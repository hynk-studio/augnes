import { createHash } from "node:crypto";

export const CODEX_FORMER_LOCAL_ADAPTER_MANIFEST_VERSION =
  "codex_former_local_adapter_manifest.v0.1";
export const CODEX_FORMER_LOCAL_ADAPTER_SOURCE_KIND =
  "local_bounded_manifest";
export const CODEX_FORMER_LOCAL_ADAPTER_METADATA_VERSION =
  "codex_former_local_adapter_metadata.v0.1";

export type CodexFormerLocalAdapterCheckStatus =
  | "passed"
  | "failed"
  | "blocked"
  | "skipped"
  | "not_run";

export type CodexFormerLocalAdapterReadinessStatus =
  | "not_ready"
  | "waiting"
  | "needs_review"
  | "blocked"
  | "reviewable_with_follow_up";

export type CodexFormerLocalAdapterCheckRun = {
  check_id: string;
  command: string;
  status: CodexFormerLocalAdapterCheckStatus;
  result_summary: string;
};

export type CodexFormerLocalAdapterSkippedCheck = {
  check_id: string;
  skipped_reason: string;
  result_summary?: string;
};

export type CodexFormerLocalAdapterGap = {
  gap_id: string;
  summary: string;
};

export type CodexFormerLocalAdapterReadiness = {
  status: CodexFormerLocalAdapterReadinessStatus;
  reasons: string[];
};

export type CodexFormerLocalAdapterManifest = {
  adapter_manifest_version: typeof CODEX_FORMER_LOCAL_ADAPTER_MANIFEST_VERSION;
  adapter_source_kind: typeof CODEX_FORMER_LOCAL_ADAPTER_SOURCE_KIND;
  generated_at: string;
  scope: string;
  work_id: string;
  work_session_label: string;
  codex_surface_label: string;
  source_pr_refs: string[];
  changed_files: string[];
  changed_files_summary: string;
  tests_checks_run: CodexFormerLocalAdapterCheckRun[];
  skipped_checks: CodexFormerLocalAdapterSkippedCheck[];
  unresolved_gaps: CodexFormerLocalAdapterGap[];
  readiness: CodexFormerLocalAdapterReadiness;
  operator_notes_bounded?: string;
  existing_helper_metadata_path?: string | null;
  returned_envelope_path?: string | null;
  validation_summary_path?: string | null;
};

export type CodexFormerLocalAdapterSourceInput = {
  generated_at: string;
  scope: string;
  work_id: string;
  source_pr_refs: string[];
  changed_files: string[];
  changed_files_summary: string;
  tests_checks_run: Array<{
    check_id: string;
    command: string;
    status: "passed" | "failed";
    result_summary: string;
  }>;
  skipped_checks: CodexFormerLocalAdapterSkippedCheck[];
  unresolved_gaps: CodexFormerLocalAdapterGap[];
  readiness: CodexFormerLocalAdapterReadiness;
  source_privacy_redaction_notes: string[];
  authority_boundaries: string[];
};

export type CodexFormerLocalAdapterMetadata = {
  adapter_metadata_version: typeof CODEX_FORMER_LOCAL_ADAPTER_METADATA_VERSION;
  adapter_source_kind: typeof CODEX_FORMER_LOCAL_ADAPTER_SOURCE_KIND;
  generated_at: string;
  manifest_path: string;
  manifest_hash: string;
  source_input_path: string;
  source_input_hash: string;
  manifest_work_id: string;
  manifest_scope: string;
  source_input_work_id: string;
  source_input_scope: string;
  omitted_optional_fields: string[];
  normalized_check_statuses: Array<{
    check_id: string;
    manifest_status: Exclude<
      CodexFormerLocalAdapterCheckStatus,
      "passed" | "failed"
    >;
    emitted_as: "skipped_checks";
  }>;
  authority_flags: {
    accepted_state_created: false;
    proof_evidence_readiness_created: false;
    review_decision_created: false;
    provider_model_calls: false;
    codex_sdk_calls: false;
    github_api_calls: false;
    db_writes: false;
    clipboard_automation: false;
    live_codex_capture: false;
    runtime_fixture_mutation: false;
    core_decision: false;
  };
};

export type CodexFormerLocalAdapterBuildResult = {
  manifest: CodexFormerLocalAdapterManifest;
  sourceInput: CodexFormerLocalAdapterSourceInput;
  sourceInputJson: string;
  sourceInputHash: string;
  metadata: CodexFormerLocalAdapterMetadata;
  metadataJson: string;
};

export type CodexFormerLocalAdapterValidationResult = {
  valid: boolean;
  errors: string[];
};

export type CodexFormerLocalAdapterUnsafeMarker = {
  path: string;
  marker_kind:
    | "exact_unsafe_marker"
    | "credential_prefix"
    | "unsafe_phrase"
    | "sensitive_token";
};

type UnknownRecord = Record<string, unknown>;

const supportedCheckStatuses: CodexFormerLocalAdapterCheckStatus[] = [
  "passed",
  "failed",
  "blocked",
  "skipped",
  "not_run",
];
const helperCompatibleCheckStatuses = ["passed", "failed"] as const;
const supportedReadinessStatuses: CodexFormerLocalAdapterReadinessStatus[] = [
  "not_ready",
  "waiting",
  "needs_review",
  "blocked",
  "reviewable_with_follow_up",
];

const optionalManifestFields = [
  "operator_notes_bounded",
  "existing_helper_metadata_path",
  "returned_envelope_path",
  "validation_summary_path",
];
const maxStringLength = 1200;
const maxOperatorNotesLength = 800;
const maxArrayLength = 60;

const exactUnsafeManifestMarkers = [
  ["private", "payload"].join("_"),
  ["provider", "payload"].join("_"),
  ["raw", "source", "payload"].join("_"),
  ["raw", "candidate", "payload"].join("_"),
  ["raw", "private", "payload"].join("_"),
  ["raw", "pr", "diff"].join("_"),
  ["raw", "page", "dump"].join("_"),
  ["raw", "review", "payload"].join("_"),
  ["oauth", "token"].join("_"),
  ["access", "token"].join("_"),
  ["refresh", "token"].join("_"),
  ["api", "key"].join("_"),
  ["hidden", "reasoning"].join("_"),
];
const prefixUnsafeManifestMarkers = [
  ["sk", "proj"].join("-") + "-",
  ["gh", "p_"].join(""),
];
const phraseUnsafeManifestMarkers = [
  "raw diff",
  "raw diffs",
  "raw pr diff",
  "raw review payload",
  "raw page dump",
  "provider log",
  "provider logs",
  "hidden reasoning",
  "account data",
  "raw screenshot",
  "raw screenshots",
  "screenshot payload",
  "screenshots included",
  "screenshot included",
  "unrelated private",
  "private payload",
  "provider payload",
  "raw source payload",
  "raw candidate payload",
  "raw private payload",
];
const tokenBoundaryUnsafeManifestMarkers = [
  "cookie",
  "cookies",
  "token",
  "tokens",
  "secret",
  "secrets",
];

const preferredJsonKeyOrder = [
  "adapter_manifest_version",
  "adapter_metadata_version",
  "adapter_source_kind",
  "generated_at",
  "scope",
  "work_id",
  "work_session_label",
  "codex_surface_label",
  "source_pr_refs",
  "changed_files",
  "changed_files_summary",
  "tests_checks_run",
  "check_id",
  "command",
  "status",
  "result_summary",
  "skipped_checks",
  "skipped_reason",
  "unresolved_gaps",
  "gap_id",
  "summary",
  "readiness",
  "reasons",
  "operator_notes_bounded",
  "existing_helper_metadata_path",
  "returned_envelope_path",
  "validation_summary_path",
  "source_privacy_redaction_notes",
  "authority_boundaries",
  "manifest_path",
  "manifest_hash",
  "source_input_path",
  "source_input_hash",
  "manifest_work_id",
  "manifest_scope",
  "source_input_work_id",
  "source_input_scope",
  "omitted_optional_fields",
  "normalized_check_statuses",
  "manifest_status",
  "emitted_as",
  "authority_flags",
  "accepted_state_created",
  "proof_evidence_readiness_created",
  "review_decision_created",
  "provider_model_calls",
  "codex_sdk_calls",
  "github_api_calls",
  "db_writes",
  "clipboard_automation",
  "live_codex_capture",
  "runtime_fixture_mutation",
  "core_decision",
];

export function buildCodexFormerSourceInputFromLocalAdapterManifest({
  generatedAtOverride,
  manifest,
  manifestHash,
  manifestPath,
  sourceInputPath,
}: {
  manifest: CodexFormerLocalAdapterManifest;
  manifestPath: string;
  manifestHash: string;
  sourceInputPath: string;
  generatedAtOverride?: string | null;
}): CodexFormerLocalAdapterBuildResult {
  const generatedAt = hasText(generatedAtOverride)
    ? String(generatedAtOverride).trim()
    : manifest.generated_at;
  const normalized = normalizeCheckRuns(manifest.tests_checks_run);
  const sourceInput: CodexFormerLocalAdapterSourceInput = {
    generated_at: generatedAt,
    scope: manifest.scope,
    work_id: manifest.work_id,
    source_pr_refs: manifest.source_pr_refs,
    changed_files: manifest.changed_files,
    changed_files_summary: manifest.changed_files_summary,
    tests_checks_run: normalized.compatibleChecks,
    skipped_checks: [
      ...manifest.skipped_checks,
      ...normalized.normalizedSkippedChecks,
    ],
    unresolved_gaps: manifest.unresolved_gaps,
    readiness: manifest.readiness,
    source_privacy_redaction_notes: [
      "Only bounded local adapter manifest summaries are included.",
      "Raw unsafe, private, source, provider, credential, browser-capture, and transcript material is omitted.",
    ],
    authority_boundaries: [
      "Local review-only adapter output; no accepted Augnes state.",
      "No proof, evidence, readiness, review decision, provider/model, Codex SDK, GitHub API, DB, clipboard, live Codex capture, merge, deploy, or Core decision behavior.",
    ],
  };
  const sourceInputJson =
    stableStringifyCodexFormerLocalAdapterJson(sourceInput);
  const sourceInputHash =
    hashCodexFormerLocalAdapterContent(sourceInputJson);
  const metadata: CodexFormerLocalAdapterMetadata = {
    adapter_metadata_version: CODEX_FORMER_LOCAL_ADAPTER_METADATA_VERSION,
    adapter_source_kind: CODEX_FORMER_LOCAL_ADAPTER_SOURCE_KIND,
    generated_at: generatedAt,
    manifest_path: manifestPath,
    manifest_hash: manifestHash,
    source_input_path: sourceInputPath,
    source_input_hash: sourceInputHash,
    manifest_work_id: manifest.work_id,
    manifest_scope: manifest.scope,
    source_input_work_id: sourceInput.work_id,
    source_input_scope: sourceInput.scope,
    omitted_optional_fields: optionalManifestFields.filter(
      (field) =>
        !Object.prototype.hasOwnProperty.call(manifest, field) ||
        manifest[field as keyof CodexFormerLocalAdapterManifest] === null ||
        manifest[field as keyof CodexFormerLocalAdapterManifest] === undefined,
    ),
    normalized_check_statuses: normalized.normalizedStatuses,
    authority_flags: buildFalseAuthorityFlags(),
  };
  const metadataJson = stableStringifyCodexFormerLocalAdapterJson(metadata);

  return {
    manifest,
    sourceInput,
    sourceInputJson,
    sourceInputHash,
    metadata,
    metadataJson,
  };
}

export function validateCodexFormerLocalAdapterManifest(
  value: unknown,
): CodexFormerLocalAdapterValidationResult {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { valid: false, errors: ["manifest JSON must be an object"] };
  }
  const manifest = value;

  requireExactString(
    manifest,
    "adapter_manifest_version",
    CODEX_FORMER_LOCAL_ADAPTER_MANIFEST_VERSION,
    errors,
  );
  requireExactString(
    manifest,
    "adapter_source_kind",
    CODEX_FORMER_LOCAL_ADAPTER_SOURCE_KIND,
    errors,
  );

  for (const field of [
    "generated_at",
    "scope",
    "work_id",
    "work_session_label",
    "codex_surface_label",
    "changed_files_summary",
  ]) {
    requireBoundedString(manifest[field], field, errors);
  }

  const sourcePrRefs = readStringArray(manifest.source_pr_refs, "source_pr_refs", errors);
  if (sourcePrRefs.length === 0) {
    errors.push("manifest source_pr_refs must include at least one bounded source reference");
  }

  const changedFiles = readStringArray(manifest.changed_files, "changed_files", errors);
  if (changedFiles.length === 0) {
    errors.push("manifest changed_files must include at least one file");
  }
  changedFiles.forEach((filePath, index) => {
    if (!isSafeRelativeFilePath(filePath)) {
      errors.push(
        `manifest changed_files[${index}] must be a safe relative file path`,
      );
    }
  });

  const testsChecksRun = readObjectArray(
    manifest.tests_checks_run,
    "tests_checks_run",
    errors,
  );
  testsChecksRun.forEach((item, index) => {
    requireBoundedString(item.check_id, `tests_checks_run[${index}].check_id`, errors);
    requireBoundedString(item.command, `tests_checks_run[${index}].command`, errors);
    const status = readBoundedString(
      item.status,
      `tests_checks_run[${index}].status`,
      errors,
    );
    if (
      status &&
      !supportedCheckStatuses.includes(status as CodexFormerLocalAdapterCheckStatus)
    ) {
      errors.push(`manifest tests_checks_run[${index}].status is unsupported`);
    }
    requireBoundedString(
      item.result_summary,
      `tests_checks_run[${index}].result_summary`,
      errors,
    );
  });

  const skippedChecks = readObjectArray(
    manifest.skipped_checks,
    "skipped_checks",
    errors,
  );
  skippedChecks.forEach((item, index) => {
    requireBoundedString(item.check_id, `skipped_checks[${index}].check_id`, errors);
    requireBoundedString(
      item.skipped_reason,
      `skipped_checks[${index}].skipped_reason`,
      errors,
    );
    if (item.result_summary !== undefined) {
      requireBoundedString(
        item.result_summary,
        `skipped_checks[${index}].result_summary`,
        errors,
      );
    }
  });

  const unresolvedGaps = readObjectArray(
    manifest.unresolved_gaps,
    "unresolved_gaps",
    errors,
  );
  unresolvedGaps.forEach((item, index) => {
    requireBoundedString(item.gap_id, `unresolved_gaps[${index}].gap_id`, errors);
    requireBoundedString(item.summary, `unresolved_gaps[${index}].summary`, errors);
  });

  const readiness = manifest.readiness;
  if (!isRecord(readiness)) {
    errors.push("manifest readiness must be an object");
  } else {
    const readinessStatus = readBoundedString(
      readiness.status,
      "readiness.status",
      errors,
    );
    if (
      readinessStatus &&
      !supportedReadinessStatuses.includes(
        readinessStatus as CodexFormerLocalAdapterReadinessStatus,
      )
    ) {
      errors.push("manifest readiness.status is unsupported");
    }
    const reasons = readStringArray(readiness.reasons, "readiness.reasons", errors);
    if (reasons.length === 0) {
      errors.push("manifest readiness.reasons must include at least one reason");
    }
  }

  const readinessReasons = isRecord(readiness) && Array.isArray(readiness.reasons)
    ? readiness.reasons.filter((reason) => hasText(reason)).length
    : 0;
  if (
    testsChecksRun.length === 0 &&
    skippedChecks.length === 0 &&
    unresolvedGaps.length === 0 &&
    readinessReasons === 0
  ) {
    errors.push(
      "manifest requires verification material: checks, skipped checks, unresolved gaps, or readiness reasons",
    );
  }

  for (const field of optionalManifestFields) {
    if (
      Object.prototype.hasOwnProperty.call(manifest, field) &&
      manifest[field] !== null &&
      manifest[field] !== undefined
    ) {
      requireBoundedString(manifest[field], field, errors);
    }
  }
  if (
    typeof manifest.operator_notes_bounded === "string" &&
    manifest.operator_notes_bounded.length > maxOperatorNotesLength
  ) {
    errors.push("manifest operator_notes_bounded is too long");
  }

  for (const marker of collectUnsafeCodexFormerLocalAdapterManifestMarkers(manifest)) {
    errors.push(
      `manifest contains unsafe/private/provider material marker at ${marker.path}: ${marker.marker_kind}`,
    );
  }

  return { valid: errors.length === 0, errors: uniqueStrings(errors) };
}

export function assertCodexFormerLocalAdapterManifest(
  value: unknown,
): CodexFormerLocalAdapterManifest {
  const validation = validateCodexFormerLocalAdapterManifest(value);
  if (!validation.valid) {
    throw new Error(validation.errors.join("; "));
  }
  return value as CodexFormerLocalAdapterManifest;
}

export function collectUnsafeCodexFormerLocalAdapterManifestMarkers(
  value: unknown,
): CodexFormerLocalAdapterUnsafeMarker[] {
  const strings = collectStringValues(value);
  const markers: CodexFormerLocalAdapterUnsafeMarker[] = [];
  for (const item of strings) {
    const lowered = item.value.toLowerCase();
    for (const marker of exactUnsafeManifestMarkers) {
      if (includesExactMarker(lowered, marker)) {
        markers.push({ path: item.path, marker_kind: "exact_unsafe_marker" });
      }
    }
    for (const marker of prefixUnsafeManifestMarkers) {
      if (lowered.includes(marker)) {
        markers.push({ path: item.path, marker_kind: "credential_prefix" });
      }
    }
    for (const marker of phraseUnsafeManifestMarkers) {
      if (lowered.includes(marker)) {
        markers.push({ path: item.path, marker_kind: "unsafe_phrase" });
      }
    }
    for (const marker of tokenBoundaryUnsafeManifestMarkers) {
      if (includesWordBoundaryMarker(lowered, marker)) {
        markers.push({ path: item.path, marker_kind: "sensitive_token" });
      }
    }
  }

  return uniqueUnsafeMarkers(markers);
}

export function stableStringifyCodexFormerLocalAdapterJson(value: unknown) {
  return `${JSON.stringify(orderJsonValue(value), null, 2)}\n`;
}

export function hashCodexFormerLocalAdapterContent(content: string) {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

function normalizeCheckRuns(checks: CodexFormerLocalAdapterCheckRun[]) {
  const compatibleChecks: CodexFormerLocalAdapterSourceInput["tests_checks_run"] = [];
  const normalizedSkippedChecks: CodexFormerLocalAdapterSkippedCheck[] = [];
  const normalizedStatuses: CodexFormerLocalAdapterMetadata["normalized_check_statuses"] = [];

  for (const check of checks) {
    if (helperCompatibleCheckStatuses.includes(check.status as "passed" | "failed")) {
      compatibleChecks.push({
        check_id: check.check_id,
        command: check.command,
        status: check.status as "passed" | "failed",
        result_summary: check.result_summary,
      });
      continue;
    }

    normalizedStatuses.push({
      check_id: check.check_id,
      manifest_status: check.status as Exclude<
        CodexFormerLocalAdapterCheckStatus,
        "passed" | "failed"
      >,
      emitted_as: "skipped_checks",
    });
    normalizedSkippedChecks.push({
      check_id: check.check_id,
      skipped_reason: `Manifest check status ${check.status}; kept as bounded skipped-check summary for source-input compatibility.`,
      result_summary: check.result_summary,
    });
  }

  return { compatibleChecks, normalizedSkippedChecks, normalizedStatuses };
}

function requireExactString(
  record: UnknownRecord,
  field: string,
  expected: string,
  errors: string[],
) {
  if (record[field] !== expected) {
    errors.push(`manifest ${field} must be ${expected}`);
  }
}

function requireBoundedString(value: unknown, field: string, errors: string[]) {
  const text = readBoundedString(value, field, errors);
  if (!text) {
    errors.push(`manifest ${field} must be a non-empty string`);
  }
  return text;
}

function readBoundedString(value: unknown, field: string, errors: string[]) {
  if (typeof value !== "string") {
    errors.push(`manifest ${field} must be a string`);
    return null;
  }
  if (value.trim().length === 0) {
    return null;
  }
  if (value.length > maxStringLength) {
    errors.push(`manifest ${field} is too long`);
  }
  return value;
}

function readStringArray(value: unknown, field: string, errors: string[]) {
  if (!Array.isArray(value)) {
    errors.push(`manifest ${field} must be an array`);
    return [];
  }
  if (value.length > maxArrayLength) {
    errors.push(`manifest ${field} has too many items`);
  }
  return value.flatMap((item, index) => {
    const text = requireBoundedString(item, `${field}[${index}]`, errors);
    return text === null ? [] : [text];
  });
}

function readObjectArray(value: unknown, field: string, errors: string[]) {
  if (!Array.isArray(value)) {
    errors.push(`manifest ${field} must be an array`);
    return [];
  }
  if (value.length > maxArrayLength) {
    errors.push(`manifest ${field} has too many items`);
  }
  return value.flatMap((item, index) => {
    if (!isRecord(item)) {
      errors.push(`manifest ${field}[${index}] must be an object`);
      return [];
    }
    return [item];
  });
}

function isSafeRelativeFilePath(value: string) {
  if (!hasText(value)) return false;
  if (value.startsWith("/") || value.startsWith("\\\\")) return false;
  if (/^[a-zA-Z]:[\\/]/.test(value)) return false;
  if (value.includes("\0")) return false;
  const parts = value.split(/[\\/]+/);
  if (parts.some((part) => part === "" || part === "." || part === "..")) {
    return false;
  }
  return true;
}

function buildFalseAuthorityFlags(): CodexFormerLocalAdapterMetadata["authority_flags"] {
  return {
    accepted_state_created: false,
    proof_evidence_readiness_created: false,
    review_decision_created: false,
    provider_model_calls: false,
    codex_sdk_calls: false,
    github_api_calls: false,
    db_writes: false,
    clipboard_automation: false,
    live_codex_capture: false,
    runtime_fixture_mutation: false,
    core_decision: false,
  };
}

function collectStringValues(
  value: unknown,
  path = "manifest",
): Array<{ path: string; value: string }> {
  if (typeof value === "string") {
    return [{ path, value }];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      collectStringValues(item, `${path}[${index}]`),
    );
  }
  if (isRecord(value)) {
    return Object.entries(value).flatMap(([key, item]) =>
      collectStringValues(item, `${path}.${key}`),
    );
  }
  return [];
}

function orderJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(orderJsonValue);
  }
  if (!isRecord(value)) {
    return value;
  }

  const entries = Object.entries(value).sort(([left], [right]) => {
    const leftIndex = preferredJsonKeyOrder.indexOf(left);
    const rightIndex = preferredJsonKeyOrder.indexOf(right);
    if (leftIndex !== -1 || rightIndex !== -1) {
      if (leftIndex === -1) return 1;
      if (rightIndex === -1) return -1;
      if (leftIndex !== rightIndex) return leftIndex - rightIndex;
    }
    return left.localeCompare(right);
  });
  return Object.fromEntries(
    entries.map(([key, item]) => [key, orderJsonValue(item)]),
  );
}

function includesExactMarker(value: string, marker: string) {
  const escaped = escapeRegExp(marker);
  return new RegExp(`(^|[^a-z0-9_])${escaped}([^a-z0-9_]|$)`, "i").test(
    value,
  );
}

function includesWordBoundaryMarker(value: string, marker: string) {
  const escaped = escapeRegExp(marker);
  return new RegExp(`\\b${escaped}\\b`, "i").test(value);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function uniqueUnsafeMarkers(
  markers: CodexFormerLocalAdapterUnsafeMarker[],
) {
  const seen = new Set<string>();
  return markers.filter((marker) => {
    const key = `${marker.path}:${marker.marker_kind}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueStrings(values: string[]) {
  return [...new Set(values)];
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export default {
  CODEX_FORMER_LOCAL_ADAPTER_MANIFEST_VERSION,
  CODEX_FORMER_LOCAL_ADAPTER_METADATA_VERSION,
  CODEX_FORMER_LOCAL_ADAPTER_SOURCE_KIND,
  assertCodexFormerLocalAdapterManifest,
  buildCodexFormerSourceInputFromLocalAdapterManifest,
  collectUnsafeCodexFormerLocalAdapterManifestMarkers,
  hashCodexFormerLocalAdapterContent,
  stableStringifyCodexFormerLocalAdapterJson,
  validateCodexFormerLocalAdapterManifest,
};
