import { canonicalizeProtocolValueV01, createProtocolSha256V01, parseStrictIsoTimestampV01 } from "./protocol-primitives";
import { deriveCriterionIdentityV01 } from "./criterion-identity";
import { validateExternalRefV01 } from "./task-context-packet";
import { ORDINARY_SUCCESSOR_EXPECTATION_CHRONOLOGY, WORK_EXPECTATION_LIMIT, WORK_EXPECTATION_RULE, WORK_EXPECTATION_VERSION, type WorkExpectationRecord } from "@/types/vnext/work-expectation";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";

export class WorkExpectationError extends Error {
  constructor(readonly code: string, readonly status = 409) { super(code); }
}
export function expectationCheck(condition: unknown, code = "expectation_record_invalid"): asserts condition {
  if (!condition) throw new WorkExpectationError(code);
}
export function expectationHash(value: unknown): string {
  return createProtocolSha256V01(canonicalizeProtocolValueV01(value));
}
export function expectationText(value: unknown, maximum = 600): string {
  expectationCheck(typeof value === "string" && value.trim().length > 0 &&
    [...value].length <= maximum && !/[\u0000-\u0008\u000b-\u001f\u007f]/u.test(value), "expectation_text_invalid");
  return value.trim();
}
export function expectationKeys(value: unknown, keys: string[]): asserts value is Record<string, unknown> {
  expectationCheck(value !== null && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).sort().join(",") === [...keys].sort().join(","));
}
export function expectationRef(record: WorkExpectationRecord): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1", ref_type: "work_expectation_record",
    external_id: record.record_id, source_ref: record.integrity.fingerprint,
    observed_at: record.recorded_at, trust_class: record.kind === "attempt_binding" ? "direct_local_observation" : "user_declaration",
    compatibility_namespace: WORK_EXPECTATION_VERSION,
  };
}
export function expectationSourceRef(id: string, fingerprint: string, at: string, kind: "task_context_packet" | "run_receipt"): ExternalRefV01 {
  return { ref_version: "external_ref.v0.1", ref_type: kind, external_id: id, source_ref: fingerprint,
    observed_at: at, trust_class: "direct_local_observation", compatibility_namespace: WORK_EXPECTATION_VERSION };
}
type NewRecord<T> = T extends WorkExpectationRecord ? Omit<T, "record_id" | "integrity"> : never;
export function buildWorkExpectationRecord<T extends WorkExpectationRecord>(input: NewRecord<T>): T {
  const body = { ...input, record_id: `work-expectation:${expectationHash(input).slice(7, 31)}` };
  const record = { ...body, integrity: { fingerprint: expectationHash(body) } } as unknown as T;
  assertWorkExpectationRecord(record);
  return record;
}
export function assertWorkExpectationRecord(input: unknown): asserts input is WorkExpectationRecord {
  expectationCheck(input && typeof input === "object" && !Array.isArray(input));
  const r = input as WorkExpectationRecord;
  const common = ["version", "record_id", "workspace_id", "project_id", "recorded_at", "packet_ref", "integrity", "kind"];
  const fields = r.kind === "expectation"
    ? ["previous_ref", "revision", "criterion_id", "criterion", "predicted_outcome", "reason", "conditions", "observation_window", "outcome_rule", "author", "information_cutoff", "source_refs", "source_currentness", "exposure"]
    : r.kind === "attempt_binding" ? ["expectation_ref", "run_id", "run_created_at", "chronology"]
      : r.kind === "outcome_report" ? ["expectation_ref", "attempt_ref", "receipt_ref", "previous_ref", "revision", "outcome", "observation", "applicability", "author"] : null;
  expectationCheck(fields);
  expectationKeys(r, [...common, ...fields]);
  expectationCheck(r.version === WORK_EXPECTATION_VERSION && parseStrictIsoTimestampV01(r.recorded_at) !== null);
  expectationText(r.workspace_id, 256); expectationText(r.project_id, 256);
  expectationKeys(r.integrity, ["fingerprint"]);
  const { integrity, record_id, ...body } = r;
  expectationCheck(record_id === `work-expectation:${expectationHash(body).slice(7, 31)}` &&
    integrity.fingerprint === expectationHash({ ...body, record_id }));
  const ref = (v: unknown, kind?: string) => {
    expectationCheck(validateExternalRefV01(v).status === "valid");
    const source = v as ExternalRefV01;
    expectationCheck(!kind || source.ref_type === kind);
    if (kind) expectationCheck(typeof source.source_ref === "string" && /^sha256:[a-f0-9]{64}$/u.test(source.source_ref));
  };
  ref(r.packet_ref, "task_context_packet");
  if (r.kind !== "attempt_binding") {
    expectationCheck(Number.isSafeInteger(r.revision) && r.revision >= 1 && r.revision <= WORK_EXPECTATION_LIMIT);
    expectationCheck((r.revision === 1) === (r.previous_ref === null));
    if (r.previous_ref) ref(r.previous_ref, "work_expectation_record");
    expectationKeys(r.author, ["operator_id", "session_id", "provenance"]);
    expectationText(r.author.operator_id, 256); expectationText(r.author.session_id, 256);
  }
  if (r.kind === "expectation") {
    expectationCheck(r.criterion === expectationText(r.criterion, 2000) && r.criterion_id === deriveCriterionIdentityV01(r.criterion));
    expectationCheck(["satisfied", "unsatisfied"].includes(r.predicted_outcome));
    expectationCheck(r.reason === expectationText(r.reason) && r.conditions === expectationText(r.conditions));
    expectationCheck(r.observation_window === "first_upcoming_interactive_attempt_of_exact_packet" &&
      r.outcome_rule === WORK_EXPECTATION_RULE && r.author.provenance === "operator_authored" &&
      r.information_cutoff === r.recorded_at &&
      r.source_currentness === "recorded_packet_snapshot_only_external_currentness_unknown" &&
      r.exposure === "operator_ui_only_no_automatic_worker_delivery_attention_and_copying_unknown");
    expectationCheck(Array.isArray(r.source_refs) && r.source_refs.length <= 256);
    r.source_refs.forEach(v => { if (typeof v === "string") expectationText(v, 2000); else if (v !== null) ref(v); });
  } else {
    ref(r.expectation_ref, "work_expectation_record");
    if (r.kind === "attempt_binding") {
      expectationText(r.run_id, 256);
      expectationCheck(r.run_created_at === r.recorded_at &&
        ["same_transaction_as_first_local_interactive_run", ORDINARY_SUCCESSOR_EXPECTATION_CHRONOLOGY].includes(r.chronology));
    } else {
      ref(r.attempt_ref, "work_expectation_record"); ref(r.receipt_ref, "run_receipt");
      expectationCheck(["satisfied", "unsatisfied", "unknown", "not_applicable"].includes(r.outcome) &&
        ["applied", "not_established"].includes(r.applicability) && r.author.provenance === "operator_attested");
      expectationCheck(r.observation === expectationText(r.observation));
    }
  }
}
