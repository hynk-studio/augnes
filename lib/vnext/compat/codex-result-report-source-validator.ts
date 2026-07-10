import {
  CodexResultReportIngestionScopeV01,
  CodexResultReportKindsV01,
  CodexResultReportPrivacyGuardRefV01,
  CodexResultReportReasonCodesV01,
  CodexResultReportRecordVersionV01,
  CodexResultReportReviewCueKindsV01,
  CodexResultReportStatusesV01,
  createCodexResultReportAuthorityBoundaryV01,
  createCodexResultReportFingerprintV01,
  type CodexResultReportStatusV01,
} from "@/lib/dogfooding/codex-result-report-normalizer";
import {
  isProtocolRecordV01,
  parseStrictIsoTimestampV01,
  protocolStringValueV01,
  scanForbiddenProtocolMaterialV01,
  type ProtocolJsonRecordV01,
} from "@/lib/vnext/protocol-primitives";
import {
  classifyLegacyResultArtifactRefV01,
  type LegacyResultArtifactRefClassificationV01,
  type LegacyResultRunReceiptMappingIssueV01,
} from "@/lib/vnext/compat/legacy-result-mapping-primitives";

const sourceStatuses = new Set<string>(CodexResultReportStatusesV01);
const sourceKinds = new Set<string>(CodexResultReportKindsV01);
const cueKinds = new Set<string>(CodexResultReportReviewCueKindsV01);
const reasonCodes = new Set<string>(CodexResultReportReasonCodesV01);
const rootKeys = new Set([
  "record_version", "scope", "status", "report_id", "report_kind",
  "reported_at", "operator_actor_ref", "pr_refs", "branch_ref",
  "commit_refs", "source_refs", "normalized_summary", "observed_file_refs",
  "observed_check_refs", "changed_file_refs", "skipped_check_refs",
  "known_warning_refs", "not_done_refs", "expected_observed_delta_refs",
  "review_cues", "reason_codes", "boundary_notes", "privacy_report",
  "authority_boundary", "report_fingerprint",
]);
const cueKeys = new Set([
  "cue_id", "cue_kind", "public_safe_summary", "source_refs", "reason_codes",
]);
const privacyKeys = new Set([
  "guard_version", "status", "findings", "blocked_paths", "redacted_paths",
  "reason_codes", "boundary_notes",
]);
const findingKeys = new Set([
  "finding_id", "path", "finding_kind", "severity", "action", "reason_codes",
  "public_safe_summary", "original_value_included",
]);
const authorityField =
  /(?:approv|authori[sz]|accepted.?evidence|canonical.?state|state.?(?:appl|commit|mutat|write)|work.?clos|publish|merge|semantic.?commit|durable.?transition|proof)/i;

export type CodexResultRunReceiptMappingIssueV01 =
  LegacyResultRunReceiptMappingIssueV01;

export interface CodexResultReportSourceValidationV01 {
  status: "valid" | "invalid" | "blocked";
  normalized_source_status: CodexResultReportStatusV01 | null;
  source_record_fingerprint: string | null;
  errors: CodexResultRunReceiptMappingIssueV01[];
  warnings: CodexResultRunReceiptMappingIssueV01[];
}

export type CodexResultArtifactRefClassificationV01 =
  LegacyResultArtifactRefClassificationV01;

export function classifyCodexResultArtifactRefV01(
  value: unknown,
): CodexResultArtifactRefClassificationV01 {
  return classifyLegacyResultArtifactRefV01(value);
}

type Accumulator = {
  errors: CodexResultRunReceiptMappingIssueV01[];
  warnings: CodexResultRunReceiptMappingIssueV01[];
  blocked: boolean;
};

export function validateCodexResultReportRecordForRunReceiptV01(
  input: unknown,
): CodexResultReportSourceValidationV01 {
  const acc = createAccumulator();
  scanForbiddenProtocolMaterialV01(input, "$", issueSink(acc), {
    secret_material_message: "Secret-shaped material is forbidden in Codex result compatibility input.",
    provider_specific_field_message: "Provider-native identifiers must remain bounded compatibility references.",
    allowed_canonical_identity_paths: new Set([
      "$.authority_boundary.codex_result_report_ingestion_now",
      "$.authority_boundary.codex_execution_now",
      "$.authority_boundary.codex_execution_authority",
    ]),
    additional_forbidden_raw_field_pattern:
      /^(?:raw_provider_output|raw_terminal_log|terminal_log|stdout|stderr|environment_dump)$/,
  });
  scanUnsafeStrings(input, "$", acc);
  if (!isProtocolRecordV01(input)) {
    error(acc, "source_record_not_object", "$", "CodexResultReportIngestionRecordV01 must be an object.");
    return result(acc, null, null);
  }

  unknownKeys(input, rootKeys, "$", acc);
  const rawStatus = protocolStringValueV01(input.status);
  const status = sourceStatuses.has(rawStatus ?? "")
    ? (rawStatus as CodexResultReportStatusV01)
    : null;
  const fingerprint = protocolStringValueV01(input.report_fingerprint);
  exact(input.record_version, CodexResultReportRecordVersionV01, "$.record_version", "source_record_version_mismatch", acc);
  exact(input.scope, CodexResultReportIngestionScopeV01, "$.scope", "source_scope_mismatch", acc);
  enumeration(input.status, sourceStatuses, "$.status", "source_status_unknown", acc);
  required(input, "report_id", "$", acc);
  enumeration(input.report_kind, sourceKinds, "$.report_kind", "source_report_kind_unsupported", acc);
  timestamp(input.reported_at, "$.reported_at", acc);
  for (const field of ["operator_actor_ref", "branch_ref", "normalized_summary", "report_fingerprint"]) {
    required(input, field, "$", acc);
  }
  for (const field of [
    "pr_refs", "commit_refs", "source_refs", "observed_check_refs",
    "skipped_check_refs",
    "known_warning_refs", "not_done_refs", "expected_observed_delta_refs",
    "reason_codes", "boundary_notes",
  ]) stringArray(input[field], `$.${field}`, acc);
  validateArtifactRefs(
    stringArray(input.observed_file_refs, "$.observed_file_refs", acc),
    "$.observed_file_refs",
    acc,
  );
  validateArtifactRefs(
    stringArray(input.changed_file_refs, "$.changed_file_refs", acc),
    "$.changed_file_refs",
    acc,
  );
  knownStringArray(input.reason_codes, reasonCodes, "$.reason_codes", "source_reason_code_unknown", acc);
  validateCues(input.review_cues, acc);
  validatePrivacy(input.privacy_report, status, acc);
  validateAuthority(input.authority_boundary, acc);

  if (!fingerprint || !/^sha256:[a-f0-9]{64}$/.test(fingerprint)) {
    error(acc, "source_fingerprint_malformed", "$.report_fingerprint", "Legacy report fingerprint must be a SHA-256 value.");
  } else if (fingerprint !== createCodexResultReportFingerprintV01(input)) {
    error(acc, "source_fingerprint_mismatch", "$.report_fingerprint", "Legacy report fingerprint does not match the current exported helper.");
  }
  if (status === "blocked_private_or_raw_payload" || status === "blocked_forbidden_authority" || status === "rejected") {
    error(acc, "source_status_not_mappable", "$.status", `Source status ${status} must not produce a RunReceipt.`, true);
  }
  return result(acc, status, fingerprint);
}

function validateCues(value: unknown, acc: Accumulator) {
  array(value, "$.review_cues", acc).forEach((candidate, index) => {
    const path = `$.review_cues[${index}]`;
    const cue = record(candidate, path, acc);
    if (!cue) return;
    unknownKeys(cue, cueKeys, path, acc);
    required(cue, "cue_id", path, acc);
    enumeration(cue.cue_kind, cueKinds, `${path}.cue_kind`, "source_review_cue_kind_unknown", acc);
    required(cue, "public_safe_summary", path, acc);
    stringArray(cue.source_refs, `${path}.source_refs`, acc);
    knownStringArray(cue.reason_codes, reasonCodes, `${path}.reason_codes`, "source_reason_code_unknown", acc);
  });
}

function validatePrivacy(
  value: unknown,
  sourceStatus: CodexResultReportStatusV01 | null,
  acc: Accumulator,
) {
  const privacy = record(value, "$.privacy_report", acc);
  if (!privacy) return;
  unknownKeys(privacy, privacyKeys, "$.privacy_report", acc);
  exact(privacy.guard_version, CodexResultReportPrivacyGuardRefV01, "$.privacy_report.guard_version", "source_privacy_guard_version_mismatch", acc);
  enumeration(privacy.status, new Set(["passed", "blocked_private_or_raw_payload", "blocked_forbidden_authority"]), "$.privacy_report.status", "source_privacy_status_invalid", acc);
  const blockedPaths = stringArray(privacy.blocked_paths, "$.privacy_report.blocked_paths", acc);
  const redactedPaths = stringArray(privacy.redacted_paths, "$.privacy_report.redacted_paths", acc);
  const privacyReasonCodes = stringArray(privacy.reason_codes, "$.privacy_report.reason_codes", acc);
  validateKnownStrings(privacyReasonCodes, reasonCodes, "$.privacy_report.reason_codes", "source_reason_code_unknown", acc);
  stringArray(privacy.boundary_notes, "$.privacy_report.boundary_notes", acc);
  const findings = array(privacy.findings, "$.privacy_report.findings", acc);
  findings.forEach((candidate, index) => {
    const path = `$.privacy_report.findings[${index}]`;
    const finding = record(candidate, path, acc);
    if (!finding) return;
    unknownKeys(finding, findingKeys, path, acc);
    for (const field of ["finding_id", "path", "finding_kind", "public_safe_summary"]) required(finding, field, path, acc);
    enumeration(finding.severity, new Set(["info", "warning", "error"]), `${path}.severity`, "source_privacy_finding_severity_invalid", acc);
    enumeration(finding.action, new Set(["blocked", "redacted"]), `${path}.action`, "source_privacy_finding_action_invalid", acc);
    knownStringArray(finding.reason_codes, reasonCodes, `${path}.reason_codes`, "source_reason_code_unknown", acc);
    if (finding.original_value_included !== false) {
      error(acc, "source_privacy_original_value_forbidden", `${path}.original_value_included`, "Privacy findings must keep original_value_included false.", true);
    }
  });
  if ((sourceStatus === "candidate_only" || sourceStatus === "needs_operator_review") && privacy.status !== "passed") {
    error(acc, "source_privacy_not_passed", "$.privacy_report.status", "A mappable source record must have passed the legacy privacy guard.", true);
  }
  if (
    (sourceStatus === "candidate_only" || sourceStatus === "needs_operator_review") &&
    privacy.status === "passed" &&
    (findings.length > 0 ||
      blockedPaths.length > 0 ||
      redactedPaths.length > 0 ||
      privacyReasonCodes.length > 0)
  ) {
    error(
      acc,
      "source_passed_privacy_inconsistent",
      "$.privacy_report",
      "A passed v0.1 privacy report must not contain findings, paths, or reason codes.",
      true,
    );
  }
}

function validateAuthority(value: unknown, acc: Accumulator) {
  const authority = record(value, "$.authority_boundary", acc);
  if (!authority) return;
  const expected = createCodexResultReportAuthorityBoundaryV01();
  unknownKeys(authority, new Set(Object.keys(expected)), "$.authority_boundary", acc);
  for (const [key, expectedValue] of Object.entries(expected)) {
    if (authority[key] !== expectedValue) {
      error(acc, "source_authority_boundary_invalid", `$.authority_boundary.${key}`, `${key} must remain ${String(expectedValue)}.`, authority[key] !== false);
    }
  }
}

function unknownKeys(value: ProtocolJsonRecordV01, allowed: ReadonlySet<string>, path: string, acc: Accumulator) {
  for (const key of Object.keys(value)) {
    if (allowed.has(key)) continue;
    const shaped = authorityField.test(key);
    error(acc, shaped ? "source_unknown_authority_field" : "source_unknown_field", `${path}.${key}`, `Field ${key} is not part of the legacy v0.1 source contract.`, shaped && value[key] !== false && value[key] !== null);
  }
}

function knownStringArray(value: unknown, allowed: ReadonlySet<string>, path: string, code: string, acc: Accumulator) {
  validateKnownStrings(stringArray(value, path, acc), allowed, path, code, acc);
}

function validateKnownStrings(values: string[], allowed: ReadonlySet<string>, path: string, code: string, acc: Accumulator) {
  values.forEach((item, index) => {
    if (!allowed.has(item)) error(acc, code, `${path}[${index}]`, "Expected a known v0.1 value.");
  });
}

function validateArtifactRefs(values: string[], path: string, acc: Accumulator) {
  values.forEach((value, index) => {
    if (classifyCodexResultArtifactRefV01(value) === "blocked") {
      error(
        acc,
        "source_artifact_ref_unsafe",
        `${path}[${index}]`,
        "Artifact reference must be a bounded repository-relative path or explicit symbolic reference.",
        true,
      );
    }
  });
}

function required(recordValue: ProtocolJsonRecordV01, field: string, path: string, acc: Accumulator) {
  if (!protocolStringValueV01(recordValue[field])) error(acc, "source_string_missing", `${path}.${field}`, `${field} must be a non-empty string.`);
}

function timestamp(value: unknown, path: string, acc: Accumulator) {
  if (parseStrictIsoTimestampV01(value) === null) error(acc, "source_timestamp_invalid", path, "Expected a strict ISO-8601 timestamp with timezone.");
}

function exact(value: unknown, expected: string, path: string, code: string, acc: Accumulator) {
  if (value !== expected) error(acc, code, path, `Expected ${expected}.`);
}

function enumeration(value: unknown, allowed: ReadonlySet<string>, path: string, code: string, acc: Accumulator) {
  const normalized = protocolStringValueV01(value);
  if (!normalized || !allowed.has(normalized)) error(acc, code, path, "Expected a known v0.1 value.");
}

function stringArray(value: unknown, path: string, acc: Accumulator): string[] {
  const strings: string[] = [];
  array(value, path, acc).forEach((item, index) => {
    const normalized = protocolStringValueV01(item);
    if (normalized) strings.push(normalized);
    else error(acc, "source_string_array_malformed", `${path}[${index}]`, "Expected a non-empty string.");
  });
  return strings;
}

function array(value: unknown, path: string, acc: Accumulator): unknown[] {
  if (Array.isArray(value)) return value;
  error(acc, "source_array_malformed", path, "Expected an array.");
  return [];
}

function record(value: unknown, path: string, acc: Accumulator): ProtocolJsonRecordV01 | null {
  if (isProtocolRecordV01(value)) return value;
  error(acc, "source_object_malformed", path, "Expected an object.");
  return null;
}

function scanUnsafeStrings(value: unknown, path: string, acc: Accumulator) {
  if (typeof value === "string") {
    const candidate = value.trim();
    if (/(?:^|\b)(?:token|secret|password|credential|api[_-]?key)\s*[=:]\s*[A-Za-z0-9_=-]{8,}/i.test(candidate)) {
      error(acc, "secret_shaped_material", path, "Secret-shaped material is forbidden in compatibility input.", true);
    }
    if (
      /\bhttps?:\/\/[^\s"'<>]+/i.test(candidate) ||
      /SAFE_MARKER_[A-Z0-9_]+/.test(candidate) ||
      (!reasonCodes.has(candidate) &&
        /\b(?:thread|run|session|resp|response|provider|connector|file|upload)_[A-Za-z0-9_-]{12,}\b/i.test(
          candidate,
        ))
    ) {
      error(
        acc,
        "source_privacy_unsafe_value",
        path,
        "Source contains a value blocked by the legacy v0.1 privacy guard.",
        true,
      );
    }
    if (isUnsafeLocalPath(candidate)) {
      error(acc, "source_absolute_local_path_forbidden", path, "Absolute and file:// local paths are forbidden in compatibility input.", true);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanUnsafeStrings(item, `${path}[${index}]`, acc));
  } else if (isProtocolRecordV01(value)) {
    for (const [key, child] of Object.entries(value)) scanUnsafeStrings(child, `${path}.${key}`, acc);
  }
}

function isUnsafeLocalPath(value: string): boolean {
  return (
    value.startsWith("/") ||
    /^file:\/\//i.test(value) ||
    /^[A-Za-z]:[\\/]/.test(value) ||
    /^~[\\/]/.test(value) ||
    /^\\\\/.test(value) ||
    /^[a-z0-9_-]+:\/(?!\/)/i.test(value)
  );
}

function createAccumulator(): Accumulator {
  return { errors: [], warnings: [], blocked: false };
}

function issueSink(acc: Accumulator) {
  return {
    error(code: string, path: string | null, message: string, blocked = false) {
      error(acc, code, path, message, blocked);
    },
    warning(code: string, path: string | null, message: string) {
      acc.warnings.push({ severity: "warning", code, path, message });
    },
  };
}

function error(acc: Accumulator, code: string, path: string | null, message: string, blocked = false) {
  acc.errors.push({ severity: "error", code, path, message });
  if (blocked) acc.blocked = true;
}

function result(
  acc: Accumulator,
  status: CodexResultReportStatusV01 | null,
  fingerprint: string | null,
): CodexResultReportSourceValidationV01 {
  return {
    status: acc.errors.length === 0 ? "valid" : acc.blocked ? "blocked" : "invalid",
    normalized_source_status: status,
    source_record_fingerprint: fingerprint,
    errors: acc.errors,
    warnings: acc.warnings,
  };
}
