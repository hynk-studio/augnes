// Pure, bounded adapter contracts. These records are evidence and commitments,
// never Core acceptance, a RunReceipt, or an execution grant.
import { createHash } from "node:crypto";
export const EXTERNAL_VERSION = "augnes.external-response.v1";
export const LIMITS = Object.freeze({
  material: 65536,
  records: 2048,
  recordBytes: 24000,
  workspaceBytes: 8 * 1024 * 1024,
  events: 64,
  dependencies: 8,
  shares: 16,
});
export const canonical = (v) =>
  Array.isArray(v)
    ? `[${v.map(canonical).join(",")}]`
    : v && typeof v === "object"
      ? `{${Object.keys(v)
          .sort()
          .map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`)
          .join(",")}}`
      : JSON.stringify(v);
export const hashBytes = (v) =>
  `sha256:${createHash("sha256").update(v).digest("hex")}`;
export const digest = (v) => hashBytes(canonical(v));
export class ExternalError extends Error {
  constructor(code, status = 409) {
    super(code);
    this.code = code;
    this.status = status;
  }
}
/** @returns {never} */
export function fail(code, status = 409) {
  throw new ExternalError(code, status);
}
export function object(v) {
  if (!v || typeof v !== "object" || Array.isArray(v))
    fail("external_invalid_input", 400);
  return v;
}
export function keys(v, required, optional = []) {
  object(v);
  if (
    required.some((k) => !Object.hasOwn(v, k)) ||
    Object.keys(v).some((k) => !required.includes(k) && !optional.includes(k))
  )
    fail("external_invalid_input", 400);
}
export function text(v, max = 1000) {
  if (
    typeof v !== "string" ||
    !v.trim() ||
    [...v].length > max ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(v)
  )
    fail("external_invalid_input", 400);
  return v;
}
export function ref(v) {
  if (typeof v !== "string" || !/^sha256:[a-f0-9]{64}$/.test(v))
    fail("external_invalid_reference", 400);
  return v;
}
export function refs(v, max = Number(LIMITS.dependencies)) {
  if (!Array.isArray(v) || v.length > max || new Set(v).size !== v.length)
    fail("external_invalid_input", 400);
  v.forEach(ref);
  return v;
}
export function time(v) {
  if (
    typeof v !== "string" ||
    !Number.isFinite(Date.parse(v)) ||
    new Date(v).toISOString() !== v
  )
    fail("external_invalid_time", 400);
  return v;
}
export function integer(v, min, max) {
  if (!Number.isSafeInteger(v) || v < min || v > max)
    fail("external_invalid_input", 400);
  return v;
}
export function bytes(v) {
  if (typeof v !== "string" || v.length > Math.ceil(LIMITS.material / 3) * 4)
    fail("external_material_out_of_bounds", 413);
  const b = Buffer.from(v, "base64");
  if (b.toString("base64") !== v || !b.length || b.length > LIMITS.material)
    fail("external_material_invalid", 400);
  return b;
}
export function materialMetadata(v) {
  keys(v, [
    "name",
    "media_type",
    "version",
    "source",
    "applicability",
    "dependencies",
    "sha256",
    "size",
  ]);
  text(v.name, 120);
  if (!/^[A-Za-z0-9._-]+$/.test(v.name)) fail("external_invalid_input", 400);
  text(v.media_type, 100);
  text(v.version, 80);
  text(v.source);
  text(v.applicability);
  refs(v.dependencies);
  ref(v.sha256);
  integer(v.size, 1, LIMITS.material);
  return v;
}
export function terms(v) {
  keys(v, ["operation", "format", "population", "deadline", "max_rows"]);
  if (
    v.operation !== "aggregate" ||
    !["json", "jsonl"].includes(v.format) ||
    !["success", "all"].includes(v.population)
  )
    fail("external_terms_unsupported");
  time(v.deadline);
  integer(v.max_rows, 1, 200);
  return v;
}
export function response(v, attempt, envelope) {
  keys(
    v,
    ["version", "instance", "request_ref", "input_ref", "terms_ref", "status"],
    ["accepted_terms", "proposal", "material", "limitations"],
  );
  if (
    v.version !== EXTERNAL_VERSION ||
    v.instance !== envelope.instance ||
    v.request_ref !== attempt.ref ||
    v.input_ref !== attempt.payload.input_ref ||
    v.terms_ref !== digest(attempt.payload.terms)
  )
    fail("external_response_binding_mismatch");
  if (
    ![
      "returned",
      "proposed",
      "accepted",
      "refused",
      "partial",
      "unknown",
      "absent",
    ].includes(v.status)
  )
    fail("external_response_invalid");
  if (v.limitations !== undefined) text(v.limitations);
  if (
    ["returned", "accepted", "partial"].includes(v.status) &&
    v.accepted_terms !== v.terms_ref
  )
    fail("external_terms_not_acknowledged");
  if (
    !["returned", "accepted", "partial"].includes(v.status) &&
    v.accepted_terms !== undefined
  )
    fail("external_response_invalid");
  if (v.status === "proposed") {
    keys(v.proposal, ["formats", "reason"]);
    text(v.proposal.reason);
    if (
      !Array.isArray(v.proposal.formats) ||
      !v.proposal.formats.length ||
      v.proposal.formats.length > 2 ||
      v.proposal.formats.some((f) => !["json", "jsonl"].includes(f))
    )
      fail("external_response_invalid");
  } else if (v.proposal !== undefined) fail("external_response_invalid");
  if (v.status === "returned") {
    keys(v.material, ["metadata", "base64"]);
    materialMetadata(v.material.metadata);
    const b = bytes(v.material.base64);
    if (
      b.length !== v.material.metadata.size ||
      hashBytes(b) !== v.material.metadata.sha256 ||
      !v.material.metadata.dependencies.includes(v.input_ref)
    )
      fail("external_material_integrity_failed");
  } else if (v.material !== undefined)
    fail("external_partial_material_refused");
  return v;
}
export function stateOf(events) {
  const attempts = events.filter((e) => e.kind === "attempt");
  const attempt = attempts.at(-1) ?? null;
  const sent = attempt
    ? (events
        .filter(
          (e) => e.kind === "sent" && e.payload.attempt_ref === attempt.ref,
        )
        .at(-1) ?? null)
    : null;
  const returned = attempt
    ? (events
        .filter(
          (e) => e.kind === "response" && e.payload.attempt_ref === attempt.ref,
        )
        .at(-1) ?? null)
    : null;
  const unresolved = Boolean(
    sent &&
      (!returned ||
        returned.sequence < sent.sequence ||
        ["accepted", "unknown"].includes(returned.payload.response.status)),
  );
  return {
    head: events.at(-1)?.ref ?? null,
    attempt,
    sent,
    returned,
    unresolved,
    checked: events.filter((e) => e.kind === "check").at(-1) ?? null,
    used: events.filter((e) => e.kind === "use").at(-1) ?? null,
    closed: events.some((e) => e.kind === "close"),
    amendments: Math.max(0, attempts.length - 1),
  };
}
