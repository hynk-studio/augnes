import { createHash } from "node:crypto";

import {
  EXTERNAL_REF_TRUST_CLASSES_V01,
  EXTERNAL_REF_VERSION_V01,
  type ExternalRefV01,
} from "@/types/vnext/external-ref";

export type ProtocolJsonRecordV01 = Record<string, unknown>;

export interface ProtocolValidationIssueSinkV01 {
  error(
    code: string,
    path: string | null,
    message: string,
    blocked?: boolean,
  ): void;
  warning(code: string, path: string | null, message: string): void;
}

export interface ProtocolMaterialScanOptionsV01 {
  secret_material_message: string;
  provider_specific_field_message: string;
  allowed_canonical_identity_paths?: ReadonlySet<string>;
  allowed_false_invariant_fields?: ReadonlySet<string>;
  additional_forbidden_raw_field_pattern?: RegExp;
  additional_provider_identity_pattern?: RegExp;
}

const externalRefTrustClasses = new Set<string>(
  EXTERNAL_REF_TRUST_CLASSES_V01,
);
const allowedExternalRefKeys = new Set([
  "ref_version",
  "ref_type",
  "external_id",
  "provider",
  "host",
  "observed_at",
  "trust_class",
  "source_ref",
  "compatibility_namespace",
]);

export function canonicalizeProtocolValueV01(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? JSON.stringify(value) : "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalizeProtocolValueV01).join(",")}]`;
  }
  if (typeof value === "object") {
    const record = value as ProtocolJsonRecordV01;
    return `{${Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort()
      .map(
        (key) =>
          `${JSON.stringify(key)}:${canonicalizeProtocolValueV01(record[key])}`,
      )
      .join(",")}}`;
  }
  return JSON.stringify(String(value));
}

export function createProtocolSha256V01(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

export function normalizeProtocolTextV01(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeProtocolNullableTextV01(
  value: unknown,
): string | null {
  const text = normalizeProtocolTextV01(value);
  return text || null;
}

export function protocolStringValueV01(value: unknown): string | null {
  return normalizeProtocolNullableTextV01(value);
}

export function isProtocolRecordV01(
  value: unknown,
): value is ProtocolJsonRecordV01 {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function compareProtocolCodeUnitsV01(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function compareProtocolCanonicalV01(a: unknown, b: unknown): number {
  return compareProtocolCodeUnitsV01(
    canonicalizeProtocolValueV01(a),
    canonicalizeProtocolValueV01(b),
  );
}

export function uniqueProtocolStringsV01(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return [
    ...new Set(values.map(normalizeProtocolTextV01).filter(Boolean)),
  ].sort(compareProtocolCodeUnitsV01);
}

export function uniqueProtocolValuesV01<T>(values: T[]): T[] {
  const unique = new Map<string, T>();
  for (const value of values) {
    const canonical = canonicalizeProtocolValueV01(value);
    if (!unique.has(canonical)) unique.set(canonical, value);
  }
  return [...unique.values()];
}

export function normalizeExternalRefPrimitiveV01(
  input: ExternalRefV01,
): ExternalRefV01 {
  const result: ExternalRefV01 = {
    ref_version: EXTERNAL_REF_VERSION_V01,
    ref_type: normalizeProtocolTextV01(input.ref_type),
    external_id: normalizeProtocolTextV01(input.external_id),
    trust_class: input.trust_class,
  };
  const provider = normalizeProtocolNullableTextV01(input.provider);
  const host = normalizeProtocolNullableTextV01(input.host);
  const observedAt = normalizeProtocolNullableTextV01(input.observed_at);
  const sourceRef = normalizeProtocolNullableTextV01(input.source_ref);
  const compatibilityNamespace = normalizeProtocolNullableTextV01(
    input.compatibility_namespace,
  );
  if (provider !== null) result.provider = provider;
  if (host !== null) result.host = host;
  if (observedAt !== null) result.observed_at = observedAt;
  if (sourceRef !== null) result.source_ref = sourceRef;
  if (compatibilityNamespace !== null) {
    result.compatibility_namespace = compatibilityNamespace;
  }
  return result;
}

export function externalRefSortKeyV01(ref: ExternalRefV01): string {
  return [
    ref.compatibility_namespace ?? "",
    ref.ref_type,
    ref.external_id,
    ref.provider ?? "",
    ref.host ?? "",
    ref.trust_class,
    canonicalizeProtocolValueV01(ref),
  ].join("|");
}

export function compareExternalRefsV01(
  a: ExternalRefV01,
  b: ExternalRefV01,
): number {
  return compareProtocolCodeUnitsV01(
    externalRefSortKeyV01(a),
    externalRefSortKeyV01(b),
  );
}

export function parseStrictIsoTimestampV01(value: unknown): number | null {
  const text = protocolStringValueV01(value);
  const match = text?.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|([+-])(\d{2}):(\d{2}))$/,
  );
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const millisecond = Number((match[7] ?? "0").padEnd(3, "0"));
  const offsetHour = match[8] === "Z" ? 0 : Number(match[10]);
  const offsetMinute = match[8] === "Z" ? 0 : Number(match[11]);
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    hour > 23 ||
    minute > 59 ||
    second > 59 ||
    offsetHour > 23 ||
    offsetMinute > 59
  ) {
    return null;
  }
  const offsetSign = match[9] === "-" ? -1 : 1;
  const offsetMilliseconds =
    offsetSign * (offsetHour * 60 + offsetMinute) * 60_000;
  const parsed =
    Date.UTC(year, month - 1, day, hour, minute, second, millisecond) -
    offsetMilliseconds;
  const local = new Date(parsed + offsetMilliseconds);
  if (
    local.getUTCFullYear() !== year ||
    local.getUTCMonth() !== month - 1 ||
    local.getUTCDate() !== day ||
    local.getUTCHours() !== hour ||
    local.getUTCMinutes() !== minute ||
    local.getUTCSeconds() !== second ||
    local.getUTCMilliseconds() !== millisecond
  ) {
    return null;
  }
  return parsed;
}

export function validateExternalRefStructureV01(
  input: unknown,
  path: string,
  sink: ProtocolValidationIssueSinkV01,
  nullable = false,
): void {
  if (input === null && nullable) return;
  if (!isProtocolRecordV01(input)) {
    sink.error("external_ref_malformed", path, "ExternalRef must be an object.");
    return;
  }
  rejectUnknownProtocolKeysV01(
    input,
    allowedExternalRefKeys,
    path,
    sink,
    "unknown_external_ref_field",
  );
  if (input.ref_version !== EXTERNAL_REF_VERSION_V01) {
    sink.error(
      "unsupported_external_ref_version",
      `${path}.ref_version`,
      "ExternalRef uses an unsupported protocol version.",
      true,
    );
  }
  requireProtocolStringFieldV01(input, "ref_type", path, sink);
  requireProtocolStringFieldV01(input, "external_id", path, sink);
  const trustClass = protocolStringValueV01(input.trust_class);
  if (!trustClass || !externalRefTrustClasses.has(trustClass)) {
    sink.error(
      "external_ref_trust_class_invalid",
      `${path}.trust_class`,
      "ExternalRef requires a known trust class.",
    );
  }
  for (const field of [
    "provider",
    "host",
    "source_ref",
    "compatibility_namespace",
  ]) {
    if (
      input[field] !== undefined &&
      input[field] !== null &&
      !protocolStringValueV01(input[field])
    ) {
      sink.error(
        "external_ref_optional_field_malformed",
        `${path}.${field}`,
        `${field} must be a non-empty string, null, or absent.`,
      );
    }
  }
  if (
    input.observed_at !== null &&
    input.observed_at !== undefined &&
    parseStrictIsoTimestampV01(input.observed_at) === null
  ) {
    sink.error(
      "timestamp_invalid",
      `${path}.observed_at`,
      "Expected a valid ISO-8601 timestamp with timezone.",
    );
  }
}

export function validateDuplicateExternalRefsPrimitiveV01(
  input: unknown,
  sink: ProtocolValidationIssueSinkV01,
): void {
  const references: Array<{ path: string; ref: ProtocolJsonRecordV01 }> = [];
  collectExternalRefsV01(input, "$", references);
  const byIdentity = new Map<
    string,
    { canonical: string; definition: string; path: string }
  >();
  for (const { path, ref } of references) {
    const identity = externalRefIdentityKeyV01(ref);
    if (!identity) continue;
    const canonical = canonicalizeProtocolValueV01(ref);
    const definition = canonicalizeProtocolValueV01({
      provider: protocolStringValueV01(ref.provider),
      host: protocolStringValueV01(ref.host),
      trust_class: protocolStringValueV01(ref.trust_class),
    });
    const existing = byIdentity.get(identity);
    if (existing && existing.definition !== definition) {
      sink.error(
        "duplicate_conflicting_external_ref",
        path,
        `ExternalRef conflicts with ${existing.path} for identity ${identity}.`,
        true,
      );
    } else if (existing && existing.canonical !== canonical) {
      sink.warning(
        "external_ref_provenance_variation",
        path,
        `ExternalRef has provenance variation from ${existing.path}; identity remains unchanged.`,
      );
    } else if (!existing) {
      byIdentity.set(identity, { canonical, definition, path });
    }
  }
}

export function scanForbiddenProtocolMaterialV01(
  value: unknown,
  path: string,
  sink: ProtocolValidationIssueSinkV01,
  options: ProtocolMaterialScanOptionsV01,
  insideExternalRef = false,
): void {
  if (typeof value === "string") {
    if (containsSecretShapedValueV01(value)) {
      sink.error("secret_shaped_material", path, options.secret_material_message, true);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      scanForbiddenProtocolMaterialV01(
        item,
        `${path}[${index}]`,
        sink,
        options,
        insideExternalRef,
      ),
    );
    return;
  }
  if (!isProtocolRecordV01(value)) return;
  const isExternalRef = value.ref_version === EXTERNAL_REF_VERSION_V01;
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (
      !(child === false && options.allowed_false_invariant_fields?.has(key)) &&
      (isForbiddenRawMaterialFieldV01(key) ||
        options.additional_forbidden_raw_field_pattern?.test(
          normalizeProtocolFieldNameV01(key),
        ))
    ) {
      sink.error(
        forbiddenRawMaterialFieldCodeV01(key),
        childPath,
        "Raw transcript, prompt, hidden reasoning, credential, or secret fields are forbidden.",
        true,
      );
    }
    if (
      !insideExternalRef &&
      !isExternalRef &&
      !options.allowed_canonical_identity_paths?.has(childPath) &&
      (isProviderSpecificCoreFieldV01(key) ||
        options.additional_provider_identity_pattern?.test(
          normalizeProtocolFieldNameV01(key),
        ))
    ) {
      sink.error(
        "provider_specific_core_field",
        childPath,
        options.provider_specific_field_message,
        true,
      );
    }
    scanForbiddenProtocolMaterialV01(
      child,
      childPath,
      sink,
      options,
      insideExternalRef || isExternalRef,
    );
  }
}

export function rejectUnknownProtocolKeysV01(
  record: ProtocolJsonRecordV01,
  allowed: ReadonlySet<string>,
  path: string,
  sink: ProtocolValidationIssueSinkV01,
  code = "unknown_schema_field",
  blocked = false,
): void {
  for (const key of Object.keys(record)) {
    if (allowed.has(key)) continue;
    sink.error(
      code,
      `${path}.${key}`,
      `Field ${key} is not part of this v0.1 contract.`,
      blocked,
    );
  }
}

function requireProtocolStringFieldV01(
  record: ProtocolJsonRecordV01,
  field: string,
  path: string,
  sink: ProtocolValidationIssueSinkV01,
): string | null {
  const value = protocolStringValueV01(record[field]);
  if (!value) {
    sink.error(
      `${field}_missing`,
      `${path}.${field}`,
      `${field} must be a non-empty string.`,
    );
  }
  return value;
}

function collectExternalRefsV01(
  value: unknown,
  path: string,
  refs: Array<{ path: string; ref: ProtocolJsonRecordV01 }>,
): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      collectExternalRefsV01(item, `${path}[${index}]`, refs),
    );
    return;
  }
  if (!isProtocolRecordV01(value)) return;
  if (value.ref_version === EXTERNAL_REF_VERSION_V01) {
    refs.push({ path, ref: value });
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    collectExternalRefsV01(child, `${path}.${key}`, refs);
  }
}

function externalRefIdentityKeyV01(
  ref: ProtocolJsonRecordV01,
): string | null {
  const refType = protocolStringValueV01(ref.ref_type);
  const externalId = protocolStringValueV01(ref.external_id);
  if (!refType || !externalId) return null;
  const namespace = protocolStringValueV01(ref.compatibility_namespace);
  const scope = namespace
    ? `namespace:${namespace}`
    : `provider:${protocolStringValueV01(ref.provider) ?? ""}|host:${
        protocolStringValueV01(ref.host) ?? ""
      }`;
  return [scope, refType, externalId].join("|");
}

function isForbiddenRawMaterialFieldV01(key: string): boolean {
  const normalized = normalizeProtocolFieldNameV01(key);
  return (
    /^(raw_)?(transcript|chat_history|conversation|conversation_history|conversation_messages|prompt|prompt_text|raw_prompt|reasoning|thinking|thoughts|cot|hidden_reasoning|chain_of_thought|reasoning_trace|private_key|api_key|access_token|refresh_token|token|password|credentials|secret|secret_value|secret_payload)$/.test(
      normalized,
    ) ||
    /(?:^|_)(api_?key|access_token|refresh_token|token|password|credentials?|secret|private_key)(?:_|$)/.test(
      normalized,
    )
  );
}

function forbiddenRawMaterialFieldCodeV01(key: string): string {
  const normalized = normalizeProtocolFieldNameV01(key);
  if (/transcript|conversation/.test(normalized)) {
    return "raw_transcript_shaped_field";
  }
  if (/terminal_log|stdout|stderr|environment_dump/.test(normalized)) {
    return "raw_terminal_log_shaped_field";
  }
  if (/provider_output/.test(normalized)) return "raw_provider_output_shaped_field";
  if (
    /reasoning|thinking|thoughts|chain_of_thought|reasoning_trace|(?:^|_)cot(?:_|$)/.test(
      normalized,
    )
  ) {
    return "hidden_reasoning_shaped_field";
  }
  if (/prompt/.test(normalized)) return "raw_prompt_shaped_field";
  return "secret_shaped_field";
}

function isProviderSpecificCoreFieldV01(key: string): boolean {
  const normalized = normalizeProtocolFieldNameV01(key);
  return (
    /^(open_?ai|chat_?gpt|codex)(?:_.+)?$/.test(normalized) ||
    /^(provider|host|model)$/.test(normalized) ||
    /^(provider|host|model|session|thread|task|run)_id$/.test(
      normalized,
    ) || normalized === "model_identifier"
  );
}

function normalizeProtocolFieldNameV01(value: string): string {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();
}

function containsSecretShapedValueV01(value: string): boolean {
  return (
    /(?:OPENAI_API_KEY|GITHUB_TOKEN|ANTHROPIC_API_KEY|AWS_SECRET_ACCESS_KEY)\s*=/i.test(
      value,
    ) ||
    /\b(?:sk-(?:proj-)?[A-Za-z0-9_-]{8,}|ghp_[A-Za-z0-9_]{8,}|github_pat_[A-Za-z0-9_]{8,}|xox[baprs]-[A-Za-z0-9-]{8,}|AKIA[A-Z0-9]{12,})\b/.test(
      value,
    ) ||
    /BEGIN (?:OPENSSH |RSA |EC |)PRIVATE KEY/i.test(value)
  );
}
