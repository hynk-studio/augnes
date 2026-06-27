import { createHash } from "node:crypto";

export const PRIVACY_REDACTION_RUNTIME_GUARD_VERSION =
  "privacy_redaction_runtime_guard.v0.1" as const;

const scope = "project:augnes" as const;
const defaultAsOf = "1970-01-01T00:00:00.000Z" as const;
const defaultSubjectRef = "privacy-redaction-runtime-guard:caller-provided-input" as const;

export const PrivacyRedactionRuntimeGuardStatusesV01 = [
  "passed",
  "redacted_with_warnings",
  "blocked_private_or_raw_payload",
  "blocked_forbidden_authority",
  "blocked_invalid_input",
] as const;
export type PrivacyRedactionRuntimeGuardStatus =
  (typeof PrivacyRedactionRuntimeGuardStatusesV01)[number];

export const PrivacyRedactionRuntimeGuardActionsV01 = [
  "blocked",
  "redacted",
  "reference_only",
  "allowed",
] as const;
export type PrivacyRedactionRuntimeGuardAction =
  (typeof PrivacyRedactionRuntimeGuardActionsV01)[number];

export const PrivacyRedactionRuntimeGuardReasonCodesV01 = [
  "provider_internal_id_blocked",
  "provider_thread_id_blocked",
  "provider_run_id_blocked",
  "provider_session_id_blocked",
  "private_url_blocked",
  "local_private_path_blocked",
  "credential_marker_blocked",
  "token_marker_blocked",
  "secret_marker_blocked",
  "cookie_marker_blocked",
  "private_key_marker_blocked",
  "raw_source_body_blocked",
  "raw_note_text_blocked",
  "raw_provider_output_blocked",
  "raw_retrieval_output_blocked",
  "raw_db_row_blocked",
  "browser_dump_blocked",
  "hidden_reasoning_blocked",
  "raw_conversation_blocked",
  "opaque_connector_id_reference_only",
  "uploaded_file_opaque_id_reference_only",
  "canonical_label_from_private_identifier_blocked",
  "authority_escalation_blocked",
  "public_safe_summary_only",
  "product_write_denied",
  "invalid_input_blocked",
] as const;
export type PrivacyRedactionRuntimeGuardReasonCode =
  (typeof PrivacyRedactionRuntimeGuardReasonCodesV01)[number];

export type PrivacyRedactionRuntimeGuardSeverity =
  | "info"
  | "warning"
  | "high"
  | "critical";

export interface PrivacyRedactionRuntimeGuardFinding {
  finding_id: string;
  path: string;
  finding_kind: string;
  severity: PrivacyRedactionRuntimeGuardSeverity;
  action: PrivacyRedactionRuntimeGuardAction;
  reason_codes: PrivacyRedactionRuntimeGuardReasonCode[];
  public_safe_summary: string;
  original_value_included: false;
}

export interface PrivacyRedactionRuntimeGuardAuthorityBoundary {
  privacy_redaction_guard_now: true;
  caller_provided_input_only: true;
  deterministic_public_safe_report_now: true;
  canonical_label_created_from_private_identifier_now: false;
  raw_private_payload_persisted_now: false;
  raw_source_body_storage_now: false;
  provider_output_stored_now: false;
  provider_thread_run_session_id_canonicalized_now: false;
  private_url_canonicalized_now: false;
  local_private_path_canonicalized_now: false;
  db_query_or_write_now: false;
  route_now: false;
  ui_now: false;
  source_fetch_now: false;
  local_file_read_now: false;
  repository_file_read_now: false;
  uploaded_file_read_now: false;
  provider_openai_call_now: false;
  prompt_sent_now: false;
  retrieval_execution_now: false;
  rag_answer_generation_now: false;
  proof_or_evidence_record_now: false;
  claim_or_evidence_write_now: false;
  promotion_execution_now: false;
  durable_state_write_now: false;
  formation_receipt_write_now: false;
  git_ledger_export_runtime_now: false;
  git_write_now: false;
  github_api_call_now: false;
  repository_file_write_now: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  product_write_authority: false;
  product_id_allocation_authority: false;
  smoke_pass_is_truth: false;
  ci_pass_is_truth: false;
}

export interface PrivacyRedactionRuntimeGuardReport {
  guard_version: typeof PRIVACY_REDACTION_RUNTIME_GUARD_VERSION;
  scope: typeof scope;
  status: PrivacyRedactionRuntimeGuardStatus;
  as_of: string;
  subject_ref: string;
  findings: PrivacyRedactionRuntimeGuardFinding[];
  redacted_preview: unknown;
  blocked_paths: string[];
  redacted_paths: string[];
  reason_codes: PrivacyRedactionRuntimeGuardReasonCode[];
  boundary_notes: string[];
  authority_boundary: PrivacyRedactionRuntimeGuardAuthorityBoundary;
  guard_fingerprint: string;
}

export interface PrivacyRedactionRuntimeGuardValidationResult {
  passed: boolean;
  failure_codes: string[];
}

type JsonRecord = Record<string, unknown>;

type UnsafeCategory = {
  finding_kind: string;
  severity: PrivacyRedactionRuntimeGuardSeverity;
  action: PrivacyRedactionRuntimeGuardAction;
  reason_codes: PrivacyRedactionRuntimeGuardReasonCode[];
};

type FindingDraft = Omit<PrivacyRedactionRuntimeGuardFinding, "finding_id">;

const forbiddenAuthorityFalseFields = [
  "canonical_label_created_from_private_identifier_now",
  "raw_private_payload_persisted_now",
  "raw_source_body_storage_now",
  "provider_output_stored_now",
  "provider_thread_run_session_id_canonicalized_now",
  "private_url_canonicalized_now",
  "local_private_path_canonicalized_now",
  "db_query_or_write_now",
  "route_now",
  "ui_now",
  "source_fetch_now",
  "local_file_read_now",
  "repository_file_read_now",
  "uploaded_file_read_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "retrieval_execution_now",
  "rag_answer_generation_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "promotion_execution_now",
  "durable_state_write_now",
  "formation_receipt_write_now",
  "git_ledger_export_runtime_now",
  "git_write_now",
  "github_api_call_now",
  "repository_file_write_now",
  "codex_execution_authority",
  "github_automation_authority",
  "product_write_authority",
  "product_id_allocation_authority",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
] as const;

const forbiddenAuthorityFieldSet = new Set<string>(forbiddenAuthorityFalseFields);

const canonicalLabelKeys = new Set([
  "canonical_label",
  "canonical_label_ref",
  "canonical_name",
  "canonical_title",
  "display_label",
  "entity_label",
  "export_label",
  "label",
  "name",
  "public_label",
  "slug",
  "title",
]);

const safeMarkerCategories: ReadonlyArray<{
  marker: string;
  category: UnsafeCategory;
}> = [
  {
    marker: "SAFE_MARKER_PROVIDER_INTERNAL_ID",
    category: category(
      "provider_internal_id",
      "high",
      "redacted",
      "provider_internal_id_blocked",
    ),
  },
  {
    marker: "SAFE_MARKER_PROVIDER_THREAD_ID",
    category: category(
      "provider_thread_id",
      "high",
      "redacted",
      "provider_thread_id_blocked",
    ),
  },
  {
    marker: "SAFE_MARKER_PROVIDER_RUN_ID",
    category: category("provider_run_id", "high", "redacted", "provider_run_id_blocked"),
  },
  {
    marker: "SAFE_MARKER_PROVIDER_SESSION_ID",
    category: category(
      "provider_session_id",
      "high",
      "redacted",
      "provider_session_id_blocked",
    ),
  },
  {
    marker: "SAFE_MARKER_PRIVATE_URL",
    category: category("private_url", "high", "redacted", "private_url_blocked"),
  },
  {
    marker: "SAFE_MARKER_LOCAL_PRIVATE_PATH",
    category: category(
      "local_private_path",
      "high",
      "redacted",
      "local_private_path_blocked",
    ),
  },
  {
    marker: "SAFE_MARKER_CREDENTIAL",
    category: category(
      "credential_marker",
      "critical",
      "redacted",
      "credential_marker_blocked",
    ),
  },
  {
    marker: "SAFE_MARKER_SECRET_TOKEN",
    category: {
      finding_kind: "secret_token_marker",
      severity: "critical",
      action: "redacted",
      reason_codes: ["secret_marker_blocked", "token_marker_blocked"],
    },
  },
  {
    marker: "SAFE_MARKER_TOKEN",
    category: category("token_marker", "critical", "redacted", "token_marker_blocked"),
  },
  {
    marker: "SAFE_MARKER_SECRET",
    category: category("secret_marker", "critical", "redacted", "secret_marker_blocked"),
  },
  {
    marker: "SAFE_MARKER_COOKIE",
    category: category("cookie_marker", "critical", "redacted", "cookie_marker_blocked"),
  },
  {
    marker: "SAFE_MARKER_PRIVATE_KEY",
    category: category(
      "private_key_marker",
      "critical",
      "redacted",
      "private_key_marker_blocked",
    ),
  },
  {
    marker: "SAFE_MARKER_RAW_SOURCE_BODY",
    category: category(
      "raw_source_body",
      "critical",
      "redacted",
      "raw_source_body_blocked",
    ),
  },
  {
    marker: "SAFE_MARKER_RAW_NOTE_TEXT",
    category: category("raw_note_text", "high", "redacted", "raw_note_text_blocked"),
  },
  {
    marker: "SAFE_MARKER_RAW_PROVIDER_OUTPUT",
    category: category(
      "raw_provider_output",
      "critical",
      "redacted",
      "raw_provider_output_blocked",
    ),
  },
  {
    marker: "SAFE_MARKER_RAW_RETRIEVAL_OUTPUT",
    category: category(
      "raw_retrieval_output",
      "critical",
      "redacted",
      "raw_retrieval_output_blocked",
    ),
  },
  {
    marker: "SAFE_MARKER_RAW_DB_ROW",
    category: category("raw_db_row", "critical", "redacted", "raw_db_row_blocked"),
  },
  {
    marker: "SAFE_MARKER_BROWSER_DUMP",
    category: category("browser_dump", "high", "redacted", "browser_dump_blocked"),
  },
  {
    marker: "SAFE_MARKER_HIDDEN_REASONING",
    category: category(
      "hidden_reasoning",
      "critical",
      "redacted",
      "hidden_reasoning_blocked",
    ),
  },
  {
    marker: "SAFE_MARKER_RAW_CONVERSATION",
    category: category(
      "raw_conversation",
      "critical",
      "redacted",
      "raw_conversation_blocked",
    ),
  },
  {
    marker: "SAFE_MARKER_OPAQUE_CONNECTOR_ID",
    category: category(
      "opaque_connector_id",
      "warning",
      "reference_only",
      "opaque_connector_id_reference_only",
    ),
  },
  {
    marker: "SAFE_MARKER_UPLOADED_FILE_OPAQUE_ID",
    category: category(
      "uploaded_file_opaque_id",
      "warning",
      "reference_only",
      "uploaded_file_opaque_id_reference_only",
    ),
  },
];

const privateUrlPatterns = [
  /\bhttps?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[[^\]]+\])/i,
  /\bhttps?:\/\/[^/\s]*(?:private|internal|intranet|corp|\.local)\b/i,
] as const;

const localPrivatePathPatterns = [
  /(^|\s)\/Users\/[^/\s]+/i,
  /(^|\s)\/home\/[^/\s]+/i,
  /\bfile:\/\/[^\s]+/i,
  /\b[A-Z]:\\Users\\/i,
] as const;

const tokenLikePatterns = [
  /\bsk-[A-Za-z0-9_-]{16,}\b/,
  /\bghp_[A-Za-z0-9_]{16,}\b/,
  /\b[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/,
] as const;

export function createPrivacyRedactionRuntimeGuardAuthorityBoundaryV01():
  PrivacyRedactionRuntimeGuardAuthorityBoundary {
  return {
    privacy_redaction_guard_now: true,
    caller_provided_input_only: true,
    deterministic_public_safe_report_now: true,
    canonical_label_created_from_private_identifier_now: false,
    raw_private_payload_persisted_now: false,
    raw_source_body_storage_now: false,
    provider_output_stored_now: false,
    provider_thread_run_session_id_canonicalized_now: false,
    private_url_canonicalized_now: false,
    local_private_path_canonicalized_now: false,
    db_query_or_write_now: false,
    route_now: false,
    ui_now: false,
    source_fetch_now: false,
    local_file_read_now: false,
    repository_file_read_now: false,
    uploaded_file_read_now: false,
    provider_openai_call_now: false,
    prompt_sent_now: false,
    retrieval_execution_now: false,
    rag_answer_generation_now: false,
    proof_or_evidence_record_now: false,
    claim_or_evidence_write_now: false,
    promotion_execution_now: false,
    durable_state_write_now: false,
    formation_receipt_write_now: false,
    git_ledger_export_runtime_now: false,
    git_write_now: false,
    github_api_call_now: false,
    repository_file_write_now: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    product_write_authority: false,
    product_id_allocation_authority: false,
    smoke_pass_is_truth: false,
    ci_pass_is_truth: false,
  };
}

export function detectPrivacyRedactionRuntimeGuardFindingsV01(
  input: unknown,
): PrivacyRedactionRuntimeGuardFinding[] {
  const drafts: FindingDraft[] = [];

  if (!isAllowedTopLevelInput(input)) {
    drafts.push(invalidInputFinding("input", "Unsupported top-level input type was blocked."));
    return finalizeFindings(drafts);
  }

  if (isEmptyTopLevelInput(input)) {
    drafts.push(invalidInputFinding("input", "Empty caller-provided input was blocked."));
    return finalizeFindings(drafts);
  }

  collectFindings(input, "input", [], drafts);
  return finalizeFindings(drafts);
}

export function redactPrivacyRedactionRuntimeGuardValueV01(value: unknown): unknown {
  const findings = detectPrivacyRedactionRuntimeGuardFindingsV01(value);
  const findingByPath = new Map(findings.map((finding) => [finding.path, finding]));
  return redactValue(value, "input", [], findingByPath, true);
}

export function validatePrivacyRedactionRuntimeGuardInputV01(
  input: unknown,
): PrivacyRedactionRuntimeGuardValidationResult {
  const failures: string[] = [];
  if (!isAllowedTopLevelInput(input)) {
    failures.push("input_not_object_string_or_array");
  } else if (isEmptyTopLevelInput(input)) {
    failures.push("input_empty");
  }

  const findings = detectPrivacyRedactionRuntimeGuardFindingsV01(input);
  failures.push(
    ...findings.flatMap((finding) =>
      finding.reason_codes.map((reasonCode) => `finding:${reasonCode}`),
    ),
  );

  return {
    passed: failures.length === 0,
    failure_codes: uniqueSorted(failures),
  };
}

export function buildPrivacyRedactionRuntimeGuardReportV01(
  input: unknown,
): PrivacyRedactionRuntimeGuardReport {
  const findings = detectPrivacyRedactionRuntimeGuardFindingsV01(input);
  const status = statusForFindings(findings);
  const reportWithoutFingerprint: Omit<PrivacyRedactionRuntimeGuardReport, "guard_fingerprint"> =
    {
      guard_version: PRIVACY_REDACTION_RUNTIME_GUARD_VERSION,
      scope,
      status,
      as_of: safeInputStringField(input, "as_of") ?? defaultAsOf,
      subject_ref:
        safeInputStringField(input, "subject_ref") ??
        safeInputStringField(input, "input_ref") ??
        defaultSubjectRef,
      findings,
      redacted_preview: redactPrivacyRedactionRuntimeGuardValueV01(input),
      blocked_paths: uniqueSorted(
        findings
          .filter((finding) => finding.action === "blocked")
          .map((finding) => finding.path),
      ),
      redacted_paths: uniqueSorted(
        findings
          .filter(
            (finding) =>
              finding.action === "redacted" || finding.action === "reference_only",
          )
          .map((finding) => finding.path),
      ),
      reason_codes: uniqueSorted([
        ...findings.flatMap((finding) => finding.reason_codes),
        "public_safe_summary_only",
        "product_write_denied",
      ]),
      boundary_notes: [
        "Privacy Redaction Runtime Guard v0.1 scans caller-provided input only.",
        "Reports include public-safe summaries and paths only; original unsafe values are never included.",
        "The guard is not export/import runtime and does not create canonical labels.",
        "The guard does not persist raw/private payloads.",
        "Product-write remains parked by #686.",
        "Smoke/CI pass is not truth.",
      ],
      authority_boundary: createPrivacyRedactionRuntimeGuardAuthorityBoundaryV01(),
    };

  return {
    ...reportWithoutFingerprint,
    guard_fingerprint:
      createPrivacyRedactionRuntimeGuardFingerprintV01(reportWithoutFingerprint),
  };
}

export function createPrivacyRedactionRuntimeGuardFingerprintV01(
  reportOrInput: unknown,
): string {
  const valueForHash = cloneJson(reportOrInput);
  if (isRecord(valueForHash)) {
    delete valueForHash.guard_fingerprint;
  }
  return createHash("sha256").update(canonicalJson(valueForHash)).digest("hex");
}

function collectFindings(
  value: unknown,
  path: string,
  rawPath: string[],
  findings: FindingDraft[],
): void {
  if (typeof value === "string") {
    findings.push(...findingsForString(value, path, rawPath));
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      collectFindings(item, `${path}[${index}]`, [...rawPath, String(index)], findings);
    });
    return;
  }

  if (!isRecord(value)) {
    return;
  }

  for (const key of Object.keys(value).sort()) {
    const safeKey = safePathSegment(key);
    const childPath = `${path}.${safeKey}`;
    const childRawPath = [...rawPath, key];
    const childValue = value[key];

    if (classifyUnsafeString(key).length > 0) {
      findings.push(...findingsForString(key, childPath, childRawPath));
    }

    if (isForbiddenAuthorityClaim(key, childValue)) {
      findings.push(forbiddenAuthorityFinding(childPath, key));
    }

    collectFindings(childValue, childPath, childRawPath, findings);
  }
}

function findingsForString(value: string, path: string, rawPath: string[]): FindingDraft[] {
  const categories = classifyUnsafeString(value);
  if (categories.length === 0) {
    return [];
  }

  const isCanonical = isCanonicalLabelPath(rawPath);
  const reasonCodes = uniqueSorted([
    ...categories.flatMap((item) => item.reason_codes),
    "public_safe_summary_only",
    ...(isCanonical ? ["canonical_label_from_private_identifier_blocked" as const] : []),
  ]);
  const action: PrivacyRedactionRuntimeGuardAction = isCanonical
    ? "blocked"
    : highestAction(categories.map((item) => item.action));
  const severity = isCanonical
    ? "critical"
    : highestSeverity(categories.map((item) => item.severity));
  const findingKind = isCanonical
    ? "canonical_label_private_identifier"
    : highestPriorityFindingKind(categories.map((item) => item.finding_kind));

  return [
    {
      path,
      finding_kind: findingKind,
      severity,
      action,
      reason_codes: reasonCodes,
      public_safe_summary: publicSafeSummaryForFinding(action, reasonCodes),
      original_value_included: false,
    },
  ];
}

function classifyUnsafeString(value: string): UnsafeCategory[] {
  const categories: UnsafeCategory[] = [];
  for (const { marker, category: markerCategory } of safeMarkerCategories) {
    if (value.includes(marker)) {
      categories.push(markerCategory);
    }
  }
  if (privateUrlPatterns.some((pattern) => pattern.test(value))) {
    categories.push(category("private_url", "high", "redacted", "private_url_blocked"));
  }
  if (localPrivatePathPatterns.some((pattern) => pattern.test(value))) {
    categories.push(
      category("local_private_path", "high", "redacted", "local_private_path_blocked"),
    );
  }
  if (tokenLikePatterns.some((pattern) => pattern.test(value))) {
    categories.push(category("token_marker", "critical", "redacted", "token_marker_blocked"));
  }
  if (/\bpassword\s*:/i.test(value) || /\bcredential\s*:/i.test(value)) {
    categories.push(
      category("credential_marker", "critical", "redacted", "credential_marker_blocked"),
    );
  }
  if (/\bsecret\s*:/i.test(value)) {
    categories.push(category("secret_marker", "critical", "redacted", "secret_marker_blocked"));
  }
  if (/\bset-cookie\s*:/i.test(value) || /\bdocument\.cookie\b/i.test(value)) {
    categories.push(category("cookie_marker", "critical", "redacted", "cookie_marker_blocked"));
  }
  if (/BEGIN [A-Z ]*PRIVATE KEY/i.test(value)) {
    categories.push(
      category("private_key_marker", "critical", "redacted", "private_key_marker_blocked"),
    );
  }
  if (/raw source body/i.test(value)) {
    categories.push(category("raw_source_body", "critical", "redacted", "raw_source_body_blocked"));
  }
  if (/raw note text/i.test(value)) {
    categories.push(category("raw_note_text", "high", "redacted", "raw_note_text_blocked"));
  }
  if (/raw provider output/i.test(value)) {
    categories.push(
      category("raw_provider_output", "critical", "redacted", "raw_provider_output_blocked"),
    );
  }
  if (/raw retrieval output/i.test(value)) {
    categories.push(
      category("raw_retrieval_output", "critical", "redacted", "raw_retrieval_output_blocked"),
    );
  }
  if (/raw DB row|raw_db_row/i.test(value)) {
    categories.push(category("raw_db_row", "critical", "redacted", "raw_db_row_blocked"));
  }
  if (/browser dump/i.test(value)) {
    categories.push(category("browser_dump", "high", "redacted", "browser_dump_blocked"));
  }
  if (/hidden reasoning/i.test(value)) {
    categories.push(
      category("hidden_reasoning", "critical", "redacted", "hidden_reasoning_blocked"),
    );
  }
  if (/raw conversation/i.test(value)) {
    categories.push(
      category("raw_conversation", "critical", "redacted", "raw_conversation_blocked"),
    );
  }
  return mergeCategories(categories);
}

function forbiddenAuthorityFinding(path: string, key: string): FindingDraft {
  const reasonCodes: PrivacyRedactionRuntimeGuardReasonCode[] = [
    "authority_escalation_blocked",
    "public_safe_summary_only",
  ];
  if (key.includes("product_write")) {
    reasonCodes.push("product_write_denied");
  }
  return {
    path,
    finding_kind: "forbidden_authority_claim",
    severity: "critical",
    action: "blocked",
    reason_codes: uniqueSorted(reasonCodes),
    public_safe_summary: "Forbidden authority claim was blocked; no raw value included.",
    original_value_included: false,
  };
}

function invalidInputFinding(path: string, summary: string): FindingDraft {
  return {
    path,
    finding_kind: "invalid_input",
    severity: "critical",
    action: "blocked",
    reason_codes: ["invalid_input_blocked", "public_safe_summary_only"],
    public_safe_summary: summary,
    original_value_included: false,
  };
}

function finalizeFindings(
  drafts: FindingDraft[],
): PrivacyRedactionRuntimeGuardFinding[] {
  const mergedByPath = new Map<string, FindingDraft>();
  for (const draft of drafts) {
    const existing = mergedByPath.get(draft.path);
    if (!existing) {
      mergedByPath.set(draft.path, draft);
      continue;
    }
    const reasonCodes = uniqueSorted([
      ...existing.reason_codes,
      ...draft.reason_codes,
    ]);
    const action = highestAction([existing.action, draft.action]);
    const severity = highestSeverity([existing.severity, draft.severity]);
    mergedByPath.set(draft.path, {
      path: draft.path,
      finding_kind: highestPriorityFindingKind([
        existing.finding_kind,
        draft.finding_kind,
      ]),
      severity,
      action,
      reason_codes: reasonCodes,
      public_safe_summary: publicSafeSummaryForFinding(action, reasonCodes),
      original_value_included: false,
    });
  }

  return [...mergedByPath.values()]
    .sort((left, right) => {
      const pathCompare = left.path.localeCompare(right.path);
      if (pathCompare !== 0) return pathCompare;
      return left.finding_kind.localeCompare(right.finding_kind);
    })
    .map((finding, index) => ({
      finding_id: `privacy-redaction-runtime-guard:finding:${String(index + 1).padStart(3, "0")}`,
      ...finding,
    }));
}

function redactValue(
  value: unknown,
  path: string,
  rawPath: string[],
  findingByPath: Map<string, PrivacyRedactionRuntimeGuardFinding>,
  topLevel: boolean,
): unknown {
  const finding = findingByPath.get(path);
  if (finding) {
    return redactionPlaceholder(finding);
  }
  if (topLevel && (!isAllowedTopLevelInput(value) || isEmptyTopLevelInput(value))) {
    return "[BLOCKED:invalid_input]";
  }
  if (typeof value === "string" || value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item, index) =>
      redactValue(item, `${path}[${index}]`, [...rawPath, String(index)], findingByPath, false),
    );
  }
  if (!isRecord(value)) {
    return value;
  }

  const result: JsonRecord = {};
  for (const key of Object.keys(value).sort()) {
    const safeKey = safePreviewKey(key);
    const childPath = `${path}.${safePathSegment(key)}`;
    result[safeKey] = redactValue(
      value[key],
      childPath,
      [...rawPath, key],
      findingByPath,
      false,
    );
  }
  return result;
}

function statusForFindings(
  findings: PrivacyRedactionRuntimeGuardFinding[],
): PrivacyRedactionRuntimeGuardStatus {
  if (findings.some((finding) => finding.reason_codes.includes("invalid_input_blocked"))) {
    return "blocked_invalid_input";
  }
  if (
    findings.some((finding) =>
      finding.reason_codes.includes("authority_escalation_blocked"),
    )
  ) {
    return "blocked_forbidden_authority";
  }
  if (findings.some((finding) => finding.action === "blocked")) {
    return "blocked_private_or_raw_payload";
  }
  if (
    findings.some(
      (finding) =>
        finding.action === "redacted" || finding.action === "reference_only",
    )
  ) {
    return "redacted_with_warnings";
  }
  return "passed";
}

function publicSafeSummaryForFinding(
  action: PrivacyRedactionRuntimeGuardAction,
  reasonCodes: PrivacyRedactionRuntimeGuardReasonCode[],
): string {
  if (reasonCodes.includes("authority_escalation_blocked")) {
    return "Forbidden authority claim was blocked; no raw value included.";
  }
  if (reasonCodes.includes("invalid_input_blocked")) {
    return "Invalid input was blocked; no raw value included.";
  }
  if (reasonCodes.includes("canonical_label_from_private_identifier_blocked")) {
    return "Private/runtime identifier was blocked from canonical label use; no raw value included.";
  }
  if (action === "reference_only") {
    return "Opaque identifier was reduced to reference-only handling; no raw value included.";
  }
  return "Unsafe private/runtime value was redacted; no raw value included.";
}

function redactionPlaceholder(
  finding: PrivacyRedactionRuntimeGuardFinding,
): string {
  if (finding.action === "blocked") {
    return "[BLOCKED:public_safe_summary_only]";
  }
  if (finding.action === "reference_only") {
    return "[REFERENCE_ONLY:public_safe_summary_only]";
  }
  return "[REDACTED:public_safe_summary_only]";
}

function isForbiddenAuthorityClaim(key: string, value: unknown): boolean {
  if (value !== true) {
    return false;
  }
  if (forbiddenAuthorityFieldSet.has(key)) {
    return true;
  }
  const lower = key.toLowerCase();
  return (
    lower.endsWith("_authority") ||
    lower.endsWith("_authority_now") ||
    lower.endsWith("_write_now") ||
    lower.endsWith("_call_now") ||
    lower.endsWith("_execution_now") ||
    lower.endsWith("_is_truth")
  );
}

function isCanonicalLabelPath(rawPath: string[]): boolean {
  const key = lastStringPathKey(rawPath);
  if (!key) {
    return false;
  }
  const lower = key.toLowerCase();
  return canonicalLabelKeys.has(lower) || lower.includes("canonical_label");
}

function lastStringPathKey(rawPath: string[]): string | undefined {
  for (let index = rawPath.length - 1; index >= 0; index -= 1) {
    const key = rawPath[index];
    if (!/^\d+$/.test(key)) {
      return key;
    }
  }
  return undefined;
}

function safeInputStringField(input: unknown, field: "as_of" | "subject_ref" | "input_ref"):
  | string
  | undefined {
  if (!isRecord(input) || typeof input[field] !== "string") {
    return undefined;
  }
  const value = input[field];
  return classifyUnsafeString(value).length === 0 && value.trim() !== "" ? value : undefined;
}

function isAllowedTopLevelInput(value: unknown): boolean {
  return typeof value === "string" || Array.isArray(value) || isRecord(value);
}

function isEmptyTopLevelInput(value: unknown): boolean {
  if (typeof value === "string") {
    return value.trim() === "";
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  if (isRecord(value)) {
    return Object.keys(value).length === 0;
  }
  return true;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function category(
  findingKind: string,
  severity: PrivacyRedactionRuntimeGuardSeverity,
  action: PrivacyRedactionRuntimeGuardAction,
  reasonCode: PrivacyRedactionRuntimeGuardReasonCode,
): UnsafeCategory {
  return {
    finding_kind: findingKind,
    severity,
    action,
    reason_codes: [reasonCode],
  };
}

function mergeCategories(categories: UnsafeCategory[]): UnsafeCategory[] {
  const mergedByKind = new Map<string, UnsafeCategory>();
  for (const item of categories) {
    const existing = mergedByKind.get(item.finding_kind);
    if (!existing) {
      mergedByKind.set(item.finding_kind, item);
      continue;
    }
    mergedByKind.set(item.finding_kind, {
      finding_kind: item.finding_kind,
      severity: highestSeverity([existing.severity, item.severity]),
      action: highestAction([existing.action, item.action]),
      reason_codes: uniqueSorted([...existing.reason_codes, ...item.reason_codes]),
    });
  }
  return [...mergedByKind.values()];
}

function highestAction(
  actions: PrivacyRedactionRuntimeGuardAction[],
): PrivacyRedactionRuntimeGuardAction {
  if (actions.includes("blocked")) return "blocked";
  if (actions.includes("redacted")) return "redacted";
  if (actions.includes("reference_only")) return "reference_only";
  return "allowed";
}

function highestSeverity(
  severities: PrivacyRedactionRuntimeGuardSeverity[],
): PrivacyRedactionRuntimeGuardSeverity {
  if (severities.includes("critical")) return "critical";
  if (severities.includes("high")) return "high";
  if (severities.includes("warning")) return "warning";
  return "info";
}

function highestPriorityFindingKind(kinds: string[]): string {
  const priority = [
    "invalid_input",
    "forbidden_authority_claim",
    "canonical_label_private_identifier",
    "secret_token_marker",
    "private_key_marker",
    "credential_marker",
    "token_marker",
    "secret_marker",
    "raw_source_body",
    "raw_provider_output",
    "raw_retrieval_output",
    "raw_db_row",
    "hidden_reasoning",
    "raw_conversation",
    "provider_thread_id",
    "provider_run_id",
    "provider_session_id",
    "provider_internal_id",
    "private_url",
    "local_private_path",
    "cookie_marker",
    "browser_dump",
    "raw_note_text",
    "opaque_connector_id",
    "uploaded_file_opaque_id",
  ];
  for (const item of priority) {
    if (kinds.includes(item)) {
      return item;
    }
  }
  return uniqueSorted(kinds)[0] ?? "unknown";
}

function safePathSegment(segment: string): string {
  if (classifyUnsafeString(segment).length > 0) {
    return `redacted_key_${hashFragment(segment)}`;
  }
  if (/^[A-Za-z0-9_:-]+$/.test(segment)) {
    return segment;
  }
  return `key_${hashFragment(segment)}`;
}

function safePreviewKey(key: string): string {
  return safePathSegment(key);
}

function hashFragment(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

function uniqueSorted<T extends string>(values: T[]): T[] {
  return [...new Set(values)].sort();
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  const record = value as JsonRecord;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
