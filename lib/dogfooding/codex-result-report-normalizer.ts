import { createHash } from "node:crypto";

export const CodexResultReportInputVersionV01 =
  "codex_result_report_input.v0.1" as const;
export const CodexResultReportRecordVersionV01 =
  "codex_result_report_ingestion_record.v0.1" as const;
export const CodexResultReportIngestionScopeV01 = "project:augnes" as const;
export const CodexResultReportPrivacyGuardRefV01 =
  "privacy_redaction_runtime_guard_v0_1" as const;

export const CodexResultReportStatusesV01 = [
  "candidate_only",
  "needs_operator_review",
  "blocked_private_or_raw_payload",
  "blocked_forbidden_authority",
  "rejected",
] as const;
export type CodexResultReportStatusV01 =
  (typeof CodexResultReportStatusesV01)[number];

export const CodexResultReportKindsV01 = [
  "codex_pr_result",
  "codex_validation_report",
  "codex_not_done_report",
  "codex_review_followup",
  "operator_pasted_codex_summary",
  "unknown",
] as const;
export type CodexResultReportKindV01 = (typeof CodexResultReportKindsV01)[number];

export const CodexResultReportReviewCueKindsV01 = [
  "inspect_changed_files",
  "verify_validation_command",
  "inspect_skipped_check",
  "resolve_expected_observed_delta",
  "review_known_warning",
  "preserve_not_done_item",
  "check_authority_boundary",
  "request_operator_review",
  "no_action",
] as const;
export type CodexResultReportReviewCueKindV01 =
  (typeof CodexResultReportReviewCueKindsV01)[number];

export const CodexResultReportReasonCodesV01 = [
  "codex_report_is_candidate_input",
  "pr_body_not_authority",
  "changed_files_are_review_cues",
  "validation_commands_are_diagnostic",
  "skipped_checks_preserved",
  "known_warnings_preserved",
  "not_done_preserved",
  "expected_observed_delta_preserved",
  "ci_pass_not_truth",
  "smoke_pass_not_truth",
  "codex_result_not_proof",
  "codex_result_not_evidence",
  "codex_result_not_state",
  "codex_result_not_execution_approval",
  "github_ref_not_authority",
  "privacy_guard_applied",
  "raw_private_payload_blocked",
  "raw_terminal_log_blocked",
  "raw_github_payload_blocked",
  "private_url_blocked",
  "local_private_path_blocked",
  "secret_like_pattern_blocked",
  "provider_call_not_executed",
  "retrieval_not_executed",
  "git_github_not_executed",
  "db_write_not_executed",
  "product_write_denied",
] as const;
export type CodexResultReportReasonCodeV01 =
  (typeof CodexResultReportReasonCodesV01)[number];

export type CodexResultReportSeverityV01 = "info" | "warning" | "error";
export type CodexResultReportPrivacyActionV01 = "blocked" | "redacted";

export interface CodexResultReportAuthorityBoundaryV01 {
  codex_result_report_ingestion_now: true;
  caller_provided_input_only: true;
  candidate_only: true;
  deterministic_normalization_now: true;
  codex_execution_now: false;
  codex_execution_authority: false;
  github_api_call_now: false;
  github_branch_create_now: false;
  github_commit_create_now: false;
  github_pr_create_now: false;
  github_merge_now: false;
  git_write_now: false;
  repository_file_write_now: false;
  runtime_state_mutation_now: false;
  db_query_or_write_now: false;
  route_now: false;
  provider_openai_call_now: false;
  prompt_sent_now: false;
  source_fetch_now: false;
  retrieval_execution_now: false;
  rag_answer_generation_now: false;
  proof_or_evidence_record_now: false;
  claim_or_evidence_write_now: false;
  promotion_execution_now: false;
  durable_state_write_now: false;
  durable_state_apply_now: false;
  formation_receipt_write_now: false;
  git_ledger_export_runtime_now: false;
  export_import_runtime_now: false;
  product_write_now: false;
  product_id_allocation_now: false;
  report_is_truth: false;
  report_is_proof: false;
  report_is_accepted_evidence: false;
  report_is_durable_state: false;
  pr_body_is_authority: false;
  ci_pass_is_truth: false;
  smoke_pass_is_truth: false;
  validation_pass_is_approval: false;
  validation_failure_is_rejection: false;
  github_ref_is_authority: false;
  product_write_authority: false;
}

export interface CodexResultReportInputV01 {
  input_version: typeof CodexResultReportInputVersionV01;
  scope: typeof CodexResultReportIngestionScopeV01;
  report_id: string;
  report_kind: CodexResultReportKindV01;
  reported_at: string;
  operator_actor_ref: string;
  pr_refs?: unknown[];
  branch_ref?: unknown;
  commit_refs?: unknown[];
  codex_claimed_summary?: unknown;
  expected_files?: unknown[];
  observed_files?: unknown[];
  expected_checks?: unknown[];
  observed_checks?: unknown[];
  validation_commands?: unknown[];
  skipped_checks?: unknown[];
  known_warnings?: unknown[];
  changed_files_summary?: unknown[];
  not_done_items?: unknown[];
  expected_observed_delta?: unknown[];
  boundary_notes?: unknown[];
  source_refs?: unknown[];
  privacy_report?: unknown;
  authority_boundary?: unknown;
}

export interface CodexResultReportPrivacyFindingV01 {
  finding_id: string;
  path: string;
  finding_kind: string;
  severity: CodexResultReportSeverityV01;
  action: CodexResultReportPrivacyActionV01;
  reason_codes: CodexResultReportReasonCodeV01[];
  public_safe_summary: string;
  original_value_included: false;
}

export interface CodexResultReportPrivacyReportV01 {
  guard_version: typeof CodexResultReportPrivacyGuardRefV01;
  status: "passed" | "blocked_private_or_raw_payload" | "blocked_forbidden_authority";
  findings: CodexResultReportPrivacyFindingV01[];
  blocked_paths: string[];
  redacted_paths: string[];
  reason_codes: CodexResultReportReasonCodeV01[];
  boundary_notes: string[];
}

export interface CodexResultReportReviewCueV01 {
  cue_id: string;
  cue_kind: CodexResultReportReviewCueKindV01;
  public_safe_summary: string;
  source_refs: string[];
  reason_codes: CodexResultReportReasonCodeV01[];
}

export interface CodexResultReportIngestionRecordV01 {
  record_version: typeof CodexResultReportRecordVersionV01;
  scope: typeof CodexResultReportIngestionScopeV01;
  status: CodexResultReportStatusV01;
  report_id: string;
  report_kind: CodexResultReportKindV01;
  reported_at: string;
  operator_actor_ref: string;
  pr_refs: string[];
  branch_ref: string;
  commit_refs: string[];
  source_refs: string[];
  normalized_summary: string;
  observed_file_refs: string[];
  observed_check_refs: string[];
  changed_file_refs: string[];
  skipped_check_refs: string[];
  known_warning_refs: string[];
  not_done_refs: string[];
  expected_observed_delta_refs: string[];
  review_cues: CodexResultReportReviewCueV01[];
  reason_codes: CodexResultReportReasonCodeV01[];
  boundary_notes: string[];
  privacy_report: CodexResultReportPrivacyReportV01;
  authority_boundary: CodexResultReportAuthorityBoundaryV01;
  report_fingerprint: string;
}

export interface CodexResultReportInputValidationV01 {
  passed: boolean;
  status: CodexResultReportStatusV01;
  reason_codes: CodexResultReportReasonCodeV01[];
  blocked_paths: string[];
  public_safe_summary: string;
}

type JsonRecord = Record<string, unknown>;

interface InternalFinding {
  path: string;
  finding_kind: string;
  severity: CodexResultReportSeverityV01;
  action: CodexResultReportPrivacyActionV01;
  reason_codes: CodexResultReportReasonCodeV01[];
  public_safe_summary: string;
}

const forbiddenAuthorityFields = [
  "codex_execution_now",
  "codex_execution_authority",
  "github_api_call_now",
  "github_branch_create_now",
  "github_commit_create_now",
  "github_pr_create_now",
  "github_merge_now",
  "git_write_now",
  "repository_file_write_now",
  "runtime_state_mutation_now",
  "db_query_or_write_now",
  "route_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "source_fetch_now",
  "retrieval_execution_now",
  "rag_answer_generation_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "promotion_execution_now",
  "durable_state_write_now",
  "durable_state_apply_now",
  "formation_receipt_write_now",
  "git_ledger_export_runtime_now",
  "export_import_runtime_now",
  "product_write_now",
  "product_id_allocation_now",
  "report_is_truth",
  "report_is_proof",
  "report_is_accepted_evidence",
  "report_is_durable_state",
  "pr_body_is_authority",
  "ci_pass_is_truth",
  "smoke_pass_is_truth",
  "validation_pass_is_approval",
  "validation_failure_is_rejection",
  "github_ref_is_authority",
  "product_write_authority",
] as const;

const allowedAuthorityTrueFields = [
  "codex_result_report_ingestion_now",
  "caller_provided_input_only",
  "candidate_only",
  "deterministic_normalization_now",
] as const;

const rawMarkerRules: Array<{
  marker: string;
  findingKind: string;
  reasonCode: CodexResultReportReasonCodeV01;
}> = [
  {
    marker: "SAFE_MARKER_PRIVATE_URL",
    findingKind: "private_url",
    reasonCode: "private_url_blocked",
  },
  {
    marker: "SAFE_MARKER_LOCAL_PRIVATE_PATH",
    findingKind: "local_private_path",
    reasonCode: "local_private_path_blocked",
  },
  {
    marker: "SAFE_MARKER_SECRET_TOKEN",
    findingKind: "secret_like_pattern",
    reasonCode: "secret_like_pattern_blocked",
  },
  {
    marker: "SAFE_MARKER_RAW_TERMINAL_LOG",
    findingKind: "raw_terminal_log",
    reasonCode: "raw_terminal_log_blocked",
  },
  {
    marker: "SAFE_MARKER_RAW_GITHUB_PAYLOAD",
    findingKind: "raw_github_payload",
    reasonCode: "raw_github_payload_blocked",
  },
  {
    marker: "SAFE_MARKER_RAW_SOURCE_BODY",
    findingKind: "raw_source_body",
    reasonCode: "raw_private_payload_blocked",
  },
  {
    marker: "SAFE_MARKER_RAW_PROVIDER_OUTPUT",
    findingKind: "raw_provider_output",
    reasonCode: "raw_private_payload_blocked",
  },
  {
    marker: "SAFE_MARKER_RAW_RETRIEVAL_OUTPUT",
    findingKind: "raw_retrieval_output",
    reasonCode: "raw_private_payload_blocked",
  },
  {
    marker: "SAFE_MARKER_RAW_DB_ROW",
    findingKind: "raw_db_row",
    reasonCode: "raw_private_payload_blocked",
  },
  {
    marker: "SAFE_MARKER_PROVIDER_THREAD_ID",
    findingKind: "provider_thread_id",
    reasonCode: "raw_private_payload_blocked",
  },
  {
    marker: "SAFE_MARKER_RAW_CONVERSATION",
    findingKind: "raw_conversation",
    reasonCode: "raw_private_payload_blocked",
  },
  {
    marker: "SAFE_MARKER_HIDDEN_REASONING",
    findingKind: "hidden_reasoning",
    reasonCode: "raw_private_payload_blocked",
  },
];

const unsafeValuePatterns: Array<{
  pattern: RegExp;
  findingKind: string;
  reasonCode: CodexResultReportReasonCodeV01;
}> = [
  {
    pattern: /\bhttps?:\/\/[^\s"'<>]+/i,
    findingKind: "private_url",
    reasonCode: "private_url_blocked",
  },
  {
    pattern: /(?:^|[\s"'`])\/(?:Users|home)\/[^\s"'`]+/i,
    findingKind: "local_private_path",
    reasonCode: "local_private_path_blocked",
  },
  {
    pattern: /\b(?:sk-|ghp_|xoxb-|token=|secret=|cookie=)[A-Za-z0-9_=-]{8,}\b/i,
    findingKind: "secret_like_pattern",
    reasonCode: "secret_like_pattern_blocked",
  },
  {
    pattern: /\b(?:thread|run|session|resp|response|provider|connector|file|upload)_[A-Za-z0-9_-]{12,}\b/i,
    findingKind: "opaque_runtime_identifier",
    reasonCode: "raw_private_payload_blocked",
  },
];

export function createCodexResultReportAuthorityBoundaryV01():
  CodexResultReportAuthorityBoundaryV01 {
  return {
    codex_result_report_ingestion_now: true,
    caller_provided_input_only: true,
    candidate_only: true,
    deterministic_normalization_now: true,
    codex_execution_now: false,
    codex_execution_authority: false,
    github_api_call_now: false,
    github_branch_create_now: false,
    github_commit_create_now: false,
    github_pr_create_now: false,
    github_merge_now: false,
    git_write_now: false,
    repository_file_write_now: false,
    runtime_state_mutation_now: false,
    db_query_or_write_now: false,
    route_now: false,
    provider_openai_call_now: false,
    prompt_sent_now: false,
    source_fetch_now: false,
    retrieval_execution_now: false,
    rag_answer_generation_now: false,
    proof_or_evidence_record_now: false,
    claim_or_evidence_write_now: false,
    promotion_execution_now: false,
    durable_state_write_now: false,
    durable_state_apply_now: false,
    formation_receipt_write_now: false,
    git_ledger_export_runtime_now: false,
    export_import_runtime_now: false,
    product_write_now: false,
    product_id_allocation_now: false,
    report_is_truth: false,
    report_is_proof: false,
    report_is_accepted_evidence: false,
    report_is_durable_state: false,
    pr_body_is_authority: false,
    ci_pass_is_truth: false,
    smoke_pass_is_truth: false,
    validation_pass_is_approval: false,
    validation_failure_is_rejection: false,
    github_ref_is_authority: false,
    product_write_authority: false,
  };
}

export function normalizeCodexResultReportV01(
  input: unknown,
): CodexResultReportIngestionRecordV01 {
  return buildCodexResultReportIngestionRecordV01(input);
}

export function validateCodexResultReportInputV01(
  input: unknown,
): CodexResultReportInputValidationV01 {
  const blockedPaths: string[] = [];
  const reasonCodes = new Set<CodexResultReportReasonCodeV01>([
    "codex_report_is_candidate_input",
    "privacy_guard_applied",
    "product_write_denied",
  ]);
  if (!isRecord(input)) {
    return {
      passed: false,
      status: "rejected",
      reason_codes: Array.from(reasonCodes).sort(),
      blocked_paths: ["input"],
      public_safe_summary: "Input must be a caller-provided object.",
    };
  }

  if (input.input_version !== CodexResultReportInputVersionV01) {
    blockedPaths.push("input.input_version");
  }
  if (input.scope !== CodexResultReportIngestionScopeV01) {
    blockedPaths.push("input.scope");
  }

  const requiredFieldFailures = detectRequiredFieldFailures(input);
  for (const failurePath of requiredFieldFailures) {
    blockedPaths.push(failurePath);
  }

  const privacyFindings = detectPrivacyFindings(input);
  const authorityFindings = detectForbiddenAuthorityFindings(input);
  for (const finding of [...privacyFindings, ...authorityFindings]) {
    blockedPaths.push(finding.path);
    for (const reasonCode of finding.reason_codes) {
      reasonCodes.add(reasonCode);
    }
  }

  const uniqueBlockedPaths = uniqueSorted(blockedPaths);
  const status = authorityFindings.length
    ? "blocked_forbidden_authority"
    : privacyFindings.length
      ? "blocked_private_or_raw_payload"
      : requiredFieldFailures.length > 0 ||
          input.input_version !== CodexResultReportInputVersionV01 ||
          input.scope !== CodexResultReportIngestionScopeV01
        ? "rejected"
      : "candidate_only";

  return {
    passed: status === "candidate_only",
    status,
    reason_codes: Array.from(reasonCodes).sort(),
    blocked_paths: uniqueBlockedPaths,
    public_safe_summary:
      status === "candidate_only"
        ? "Caller-provided Codex result report input is public-safe enough for candidate normalization."
        : status === "rejected"
          ? "Caller-provided Codex result report input is rejected without echoing raw values."
          : "Caller-provided Codex result report input is blocked without echoing raw values.",
  };
}

export function buildCodexResultReportIngestionRecordV01(
  input: unknown,
): CodexResultReportIngestionRecordV01 {
  const inputObject = isRecord(input) ? input : {};
  const privacyFindings = detectPrivacyFindings(inputObject);
  const authorityFindings = detectForbiddenAuthorityFindings(inputObject);
  const privacyReport = buildPrivacyReport(privacyFindings, authorityFindings);
  const recordStatus = determineRecordStatus(inputObject, privacyFindings, authorityFindings);
  const reasonCodes = collectRecordReasonCodes(inputObject, privacyReport, recordStatus);
  const observedFileRefs = normalizeStringRefs(inputObject.observed_files);
  const expectedFileRefs = normalizeStringRefs(inputObject.expected_files);
  const changedFileRefs = normalizeStringRefs(inputObject.changed_files_summary);
  const observedCheckRefs = normalizeStringRefs([
    ...normalizeArrayInput(inputObject.validation_commands),
    ...normalizeArrayInput(inputObject.observed_checks),
  ]);
  const skippedCheckRefs = normalizeStringRefs(inputObject.skipped_checks);
  const knownWarningRefs = normalizeStringRefs(inputObject.known_warnings);
  const notDoneRefs = normalizeStringRefs(inputObject.not_done_items);
  const expectedObservedDeltaRefs = normalizeStringRefs([
    ...normalizeArrayInput(inputObject.expected_observed_delta),
    ...buildFileDeltaRefs(expectedFileRefs, observedFileRefs),
  ]);
  const boundaryNotes = normalizeStringRefs(inputObject.boundary_notes);
  const recordWithoutFingerprint: Omit<
    CodexResultReportIngestionRecordV01,
    "report_fingerprint"
  > = {
    record_version: CodexResultReportRecordVersionV01,
    scope: CodexResultReportIngestionScopeV01,
    status: recordStatus,
    report_id: sanitizeScalar(inputObject.report_id, "codex-report:missing"),
    report_kind: normalizeReportKind(inputObject.report_kind),
    reported_at: sanitizeScalar(inputObject.reported_at, "reported-at:unspecified"),
    operator_actor_ref: sanitizeScalar(
      inputObject.operator_actor_ref,
      "operator-ref:unspecified",
    ),
    pr_refs: normalizeStringRefs(inputObject.pr_refs),
    branch_ref: sanitizeScalar(inputObject.branch_ref, "branch-ref:unspecified"),
    commit_refs: normalizeStringRefs(inputObject.commit_refs),
    source_refs: normalizeStringRefs(inputObject.source_refs),
    normalized_summary: buildNormalizedSummary(inputObject, recordStatus),
    observed_file_refs: observedFileRefs,
    observed_check_refs: observedCheckRefs,
    changed_file_refs: changedFileRefs,
    skipped_check_refs: skippedCheckRefs,
    known_warning_refs: knownWarningRefs,
    not_done_refs: notDoneRefs,
    expected_observed_delta_refs: expectedObservedDeltaRefs,
    review_cues: buildReviewCues({
      changedFileRefs,
      observedCheckRefs,
      skippedCheckRefs,
      knownWarningRefs,
      notDoneRefs,
      expectedObservedDeltaRefs,
      boundaryNotes,
      privacyReport,
    }),
    reason_codes: reasonCodes,
    boundary_notes: buildBoundaryNotes(boundaryNotes, recordStatus),
    privacy_report: privacyReport,
    authority_boundary: createCodexResultReportAuthorityBoundaryV01(),
  };

  return {
    ...recordWithoutFingerprint,
    report_fingerprint: createCodexResultReportFingerprintV01(recordWithoutFingerprint),
  };
}

export function createCodexResultReportFingerprintV01(record: unknown): string {
  return `sha256:${createHash("sha256")
    .update(stableStringify(omitFingerprint(record)))
    .digest("hex")}`;
}

function determineRecordStatus(
  input: JsonRecord,
  privacyFindings: InternalFinding[],
  authorityFindings: InternalFinding[],
): CodexResultReportStatusV01 {
  if (authorityFindings.length > 0) {
    return "blocked_forbidden_authority";
  }
  if (privacyFindings.length > 0) {
    return "blocked_private_or_raw_payload";
  }
  if (
    input.input_version !== CodexResultReportInputVersionV01 ||
    input.scope !== CodexResultReportIngestionScopeV01 ||
    detectRequiredFieldFailures(input).length > 0
  ) {
    return "rejected";
  }
  const reviewCueInputs = [
    input.skipped_checks,
    input.known_warnings,
    input.not_done_items,
    input.expected_observed_delta,
    input.boundary_notes,
  ];
  return reviewCueInputs.some((value) => normalizeArrayInput(value).length > 0)
    ? "needs_operator_review"
    : "candidate_only";
}

function buildNormalizedSummary(
  input: JsonRecord,
  status: CodexResultReportStatusV01,
): string {
  if (status === "blocked_private_or_raw_payload") {
    return "Blocked Codex result report input; raw private or unsafe payload values were not included.";
  }
  if (status === "blocked_forbidden_authority") {
    return "Blocked Codex result report input; forbidden authority claims were not accepted.";
  }
  if (status === "rejected") {
    return "Rejected Codex result report input; required public-safe identifiers were missing.";
  }
  return sanitizeScalar(
    input.codex_claimed_summary,
    "Codex result report normalized as candidate-only dogfooding input.",
  );
}

function collectRecordReasonCodes(
  input: JsonRecord,
  privacyReport: CodexResultReportPrivacyReportV01,
  status: CodexResultReportStatusV01,
): CodexResultReportReasonCodeV01[] {
  const reasonCodes = new Set<CodexResultReportReasonCodeV01>([
    "codex_report_is_candidate_input",
    "pr_body_not_authority",
    "changed_files_are_review_cues",
    "validation_commands_are_diagnostic",
    "ci_pass_not_truth",
    "smoke_pass_not_truth",
    "codex_result_not_proof",
    "codex_result_not_evidence",
    "codex_result_not_state",
    "codex_result_not_execution_approval",
    "github_ref_not_authority",
    "privacy_guard_applied",
    "provider_call_not_executed",
    "retrieval_not_executed",
    "git_github_not_executed",
    "db_write_not_executed",
    "product_write_denied",
  ]);
  if (normalizeArrayInput(input.skipped_checks).length > 0) {
    reasonCodes.add("skipped_checks_preserved");
  }
  if (normalizeArrayInput(input.known_warnings).length > 0) {
    reasonCodes.add("known_warnings_preserved");
  }
  if (normalizeArrayInput(input.not_done_items).length > 0) {
    reasonCodes.add("not_done_preserved");
  }
  if (normalizeArrayInput(input.expected_observed_delta).length > 0) {
    reasonCodes.add("expected_observed_delta_preserved");
  }
  if (status === "blocked_private_or_raw_payload") {
    reasonCodes.add("raw_private_payload_blocked");
  }
  for (const reasonCode of privacyReport.reason_codes) {
    reasonCodes.add(reasonCode);
  }
  return Array.from(reasonCodes).sort();
}

function buildPrivacyReport(
  privacyFindings: InternalFinding[],
  authorityFindings: InternalFinding[],
): CodexResultReportPrivacyReportV01 {
  const allFindings = [...privacyFindings, ...authorityFindings].sort(compareFinding);
  const findings = allFindings.map((finding, index) => ({
    finding_id: `codex-result-report-finding-${String(index + 1).padStart(3, "0")}`,
    path: finding.path,
    finding_kind: finding.finding_kind,
    severity: finding.severity,
    action: finding.action,
    reason_codes: uniqueSorted(finding.reason_codes),
    public_safe_summary: finding.public_safe_summary,
    original_value_included: false as const,
  }));
  const reasonCodes = new Set<CodexResultReportReasonCodeV01>();
  for (const finding of findings) {
    for (const reasonCode of finding.reason_codes) {
      reasonCodes.add(reasonCode);
    }
  }
  return {
    guard_version: CodexResultReportPrivacyGuardRefV01,
    status:
      authorityFindings.length > 0
        ? "blocked_forbidden_authority"
        : privacyFindings.length > 0
          ? "blocked_private_or_raw_payload"
          : "passed",
    findings,
    blocked_paths: uniqueSorted(findings.map((finding) => finding.path)),
    redacted_paths: [],
    reason_codes: Array.from(reasonCodes).sort(),
    boundary_notes: [
      "Privacy Redaction Runtime Guard v0.1 conventions are applied without raw value echo.",
      "Codex result report material remains candidate-only review input.",
    ],
  };
}

function buildReviewCues(args: {
  changedFileRefs: string[];
  observedCheckRefs: string[];
  skippedCheckRefs: string[];
  knownWarningRefs: string[];
  notDoneRefs: string[];
  expectedObservedDeltaRefs: string[];
  boundaryNotes: string[];
  privacyReport: CodexResultReportPrivacyReportV01;
}): CodexResultReportReviewCueV01[] {
  const cues: Array<Omit<CodexResultReportReviewCueV01, "cue_id">> = [];
  if (args.changedFileRefs.length > 0) {
    cues.push({
      cue_kind: "inspect_changed_files",
      public_safe_summary: "Changed file refs are present for later operator inspection.",
      source_refs: args.changedFileRefs,
      reason_codes: ["changed_files_are_review_cues"],
    });
  }
  if (args.observedCheckRefs.length > 0) {
    cues.push({
      cue_kind: "verify_validation_command",
      public_safe_summary: "Observed validation refs are diagnostic only.",
      source_refs: args.observedCheckRefs,
      reason_codes: ["validation_commands_are_diagnostic"],
    });
  }
  if (args.skippedCheckRefs.length > 0) {
    cues.push({
      cue_kind: "inspect_skipped_check",
      public_safe_summary: "Skipped checks require operator review.",
      source_refs: args.skippedCheckRefs,
      reason_codes: ["skipped_checks_preserved"],
    });
  }
  if (args.knownWarningRefs.length > 0) {
    cues.push({
      cue_kind: "review_known_warning",
      public_safe_summary: "Known warnings are preserved as review cues.",
      source_refs: args.knownWarningRefs,
      reason_codes: ["known_warnings_preserved"],
    });
  }
  if (args.notDoneRefs.length > 0) {
    cues.push({
      cue_kind: "preserve_not_done_item",
      public_safe_summary: "Not-done items remain candidate review material.",
      source_refs: args.notDoneRefs,
      reason_codes: ["not_done_preserved"],
    });
  }
  if (args.expectedObservedDeltaRefs.length > 0) {
    cues.push({
      cue_kind: "resolve_expected_observed_delta",
      public_safe_summary: "Expected/observed deltas require later reconciliation.",
      source_refs: args.expectedObservedDeltaRefs,
      reason_codes: ["expected_observed_delta_preserved"],
    });
  }
  if (args.boundaryNotes.length > 0 || args.privacyReport.findings.length > 0) {
    cues.push({
      cue_kind: "check_authority_boundary",
      public_safe_summary: "Authority and privacy boundaries require operator review.",
      source_refs: args.boundaryNotes,
      reason_codes: ["privacy_guard_applied"],
    });
  }
  if (cues.length === 0) {
    cues.push({
      cue_kind: "no_action",
      public_safe_summary: "No immediate review cue beyond candidate-only preservation.",
      source_refs: [],
      reason_codes: ["codex_report_is_candidate_input"],
    });
  }
  return cues.map((cue, index) => ({
    cue_id: `codex-result-review-cue-${String(index + 1).padStart(3, "0")}`,
    ...cue,
    source_refs: uniqueSorted(cue.source_refs),
    reason_codes: uniqueSorted(cue.reason_codes),
  }));
}

function buildBoundaryNotes(
  inputBoundaryNotes: string[],
  status: CodexResultReportStatusV01,
): string[] {
  const notes = [
    "Codex result report is candidate input only.",
    "PR body is not authority.",
    "Changed files are review cues only.",
    "Validation commands are diagnostic only.",
    "CI pass is not truth.",
    "Smoke pass is not truth.",
    "Validation pass is not approval.",
    "Validation failure is not automatic rejection.",
    "Codex report is not proof, not evidence, not durable state, and not execution approval.",
    "GitHub branch/commit/PR refs are references only, not authority.",
    "Product-write remains parked by #686.",
    ...inputBoundaryNotes,
  ];
  if (status.startsWith("blocked_")) {
    notes.push("Blocked report values are summarized without raw unsafe value echo.");
  }
  return uniqueSorted(notes);
}

function detectPrivacyFindings(value: unknown): InternalFinding[] {
  const findings: InternalFinding[] = [];
  visitValue(value, "input", (path, currentValue) => {
    if (typeof currentValue !== "string") {
      return;
    }
    for (const rule of rawMarkerRules) {
      if (currentValue.includes(rule.marker)) {
        findings.push({
          path,
          finding_kind: rule.findingKind,
          severity: "error",
          action: "blocked",
          reason_codes: [rule.reasonCode],
          public_safe_summary: `${rule.findingKind} marker blocked; original value omitted.`,
        });
      }
    }
    for (const rule of unsafeValuePatterns) {
      rule.pattern.lastIndex = 0;
      if (rule.pattern.test(currentValue)) {
        findings.push({
          path,
          finding_kind: rule.findingKind,
          severity: "error",
          action: "blocked",
          reason_codes: [rule.reasonCode],
          public_safe_summary: `${rule.findingKind} pattern blocked; original value omitted.`,
        });
      }
    }
  });
  return dedupeFindings(findings);
}

function detectForbiddenAuthorityFindings(value: unknown): InternalFinding[] {
  const findings: InternalFinding[] = [];
  visitValue(value, "input", (path, currentValue, key) => {
    if (!key || allowedAuthorityTrueFields.includes(key as never)) {
      return;
    }
    const isKnownForbidden = forbiddenAuthorityFields.includes(key as never);
    const looksLikeAuthorityClaim =
      /(?:_now|_authority|_is_truth|_is_proof|_is_accepted_evidence|_is_durable_state|_is_approval|_is_rejection)$/.test(
        key,
      ) &&
      !allowedAuthorityTrueFields.includes(key as never);
    if ((isKnownForbidden || looksLikeAuthorityClaim) && !isFalseNullOrUndefined(currentValue)) {
      findings.push({
        path,
        finding_kind: "forbidden_authority_claim",
        severity: "error",
        action: "blocked",
        reason_codes: [buildAuthorityClaimReasonCode(key)],
        public_safe_summary:
          "Forbidden authority claim blocked; original value omitted.",
      });
    }
  });
  return dedupeFindings(findings);
}

function visitValue(
  value: unknown,
  path: string,
  visitor: (path: string, value: unknown, key?: string) => void,
  key?: string,
): void {
  visitor(path, value, key);
  if (Array.isArray(value)) {
    value.forEach((item, index) => visitValue(item, `${path}[${index}]`, visitor));
    return;
  }
  if (isRecord(value)) {
    for (const objectKey of Object.keys(value).sort()) {
      visitValue(value[objectKey], `${path}.${objectKey}`, visitor, objectKey);
    }
  }
}

function buildFileDeltaRefs(expectedFiles: string[], observedFiles: string[]): string[] {
  const observedSet = new Set(observedFiles);
  const expectedSet = new Set(expectedFiles);
  return [
    ...expectedFiles
      .filter((fileRef) => !observedSet.has(fileRef))
      .map((fileRef) => `missing-observed-file:${fileRef}`),
    ...observedFiles
      .filter((fileRef) => !expectedSet.has(fileRef))
      .map((fileRef) => `unexpected-observed-file:${fileRef}`),
  ];
}

function normalizeReportKind(value: unknown): CodexResultReportKindV01 {
  return typeof value === "string" &&
    CodexResultReportKindsV01.includes(value as CodexResultReportKindV01)
    ? (value as CodexResultReportKindV01)
    : "unknown";
}

function detectRequiredFieldFailures(input: JsonRecord): string[] {
  const failures: string[] = [];
  if (!isNonEmptyPublicSafeString(input.report_id)) {
    failures.push("input.report_id");
  }
  if (!isAllowedExplicitReportKind(input.report_kind)) {
    failures.push("input.report_kind");
  }
  if (!isNonEmptyPublicSafeString(input.reported_at)) {
    failures.push("input.reported_at");
  }
  if (!isNonEmptyPublicSafeString(input.operator_actor_ref)) {
    failures.push("input.operator_actor_ref");
  }
  return failures;
}

function isAllowedExplicitReportKind(value: unknown): boolean {
  return (
    typeof value === "string" &&
    CodexResultReportKindsV01.includes(value as CodexResultReportKindV01)
  );
}

function isNonEmptyPublicSafeString(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    !containsUnsafeValue(value)
  );
}

function normalizeStringRefs(value: unknown): string[] {
  return uniqueSorted(normalizeArrayInput(value).map((item) => sanitizeSummary(item)));
}

function normalizeArrayInput(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === undefined || value === null) {
    return [];
  }
  return [value];
}

function sanitizeScalar(value: unknown, fallback: string): string {
  const sanitized = sanitizeSummary(value);
  return sanitized.length > 0 ? sanitized : fallback;
}

function sanitizeSummary(value: unknown): string {
  if (typeof value === "string") {
    return containsUnsafeValue(value) ? "[redacted:public-safe-summary-only]" : clamp(value);
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value === null || value === undefined) {
    return "";
  }
  if (Array.isArray(value)) {
    return clamp(
      value
        .map((item) => sanitizeSummary(item))
        .filter(Boolean)
        .join(" | "),
    );
  }
  if (isRecord(value)) {
    const entries = Object.keys(value)
      .sort()
      .map((key) => `${key}:${sanitizeSummary(value[key])}`)
      .filter((entry) => !entry.endsWith(":"));
    return clamp(entries.join("; "));
  }
  return "[unsupported-public-safe-value]";
}

function containsUnsafeValue(value: string): boolean {
  return (
    rawMarkerRules.some((rule) => value.includes(rule.marker)) ||
    unsafeValuePatterns.some((rule) => {
      rule.pattern.lastIndex = 0;
      return rule.pattern.test(value);
    })
  );
}

function clamp(value: string): string {
  const collapsed = value.replace(/\s+/g, " ").trim();
  return collapsed.length > 240 ? `${collapsed.slice(0, 237)}...` : collapsed;
}

function dedupeFindings(findings: InternalFinding[]): InternalFinding[] {
  const byKey = new Map<string, InternalFinding>();
  for (const finding of findings) {
    const key = `${finding.path}:${finding.finding_kind}:${finding.reason_codes.join(",")}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, finding);
      continue;
    }
    byKey.set(key, {
      ...existing,
      reason_codes: uniqueSorted([...existing.reason_codes, ...finding.reason_codes]),
    });
  }
  return Array.from(byKey.values()).sort(compareFinding);
}

function compareFinding(
  a: Pick<InternalFinding, "path" | "finding_kind">,
  b: Pick<InternalFinding, "path" | "finding_kind">,
): number {
  return `${a.path}:${a.finding_kind}`.localeCompare(`${b.path}:${b.finding_kind}`);
}

function buildAuthorityClaimReasonCode(
  key: string,
): CodexResultReportReasonCodeV01 {
  if (/product/.test(key)) {
    return "product_write_denied";
  }
  if (/(?:github|git_)/.test(key)) {
    return "git_github_not_executed";
  }
  if (/(?:provider|prompt)/.test(key)) {
    return "provider_call_not_executed";
  }
  if (/(?:retrieval|rag)/.test(key)) {
    return "retrieval_not_executed";
  }
  if (/db/.test(key)) {
    return "db_write_not_executed";
  }
  return "codex_result_not_execution_approval";
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFalseNullOrUndefined(value: unknown): boolean {
  return value === false || value === null || value === undefined;
}

function uniqueSorted<T extends string>(values: Iterable<T>): T[] {
  return Array.from(new Set(values)).sort();
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortValue(item));
  }
  if (isRecord(value)) {
    const sorted: JsonRecord = {};
    for (const key of Object.keys(value).sort()) {
      sorted[key] = sortValue(value[key]);
    }
    return sorted;
  }
  return value;
}

function omitFingerprint(value: unknown): unknown {
  if (!isRecord(value)) {
    return value;
  }
  const clone: JsonRecord = {};
  for (const key of Object.keys(value)) {
    if (key !== "report_fingerprint") {
      clone[key] = value[key];
    }
  }
  return clone;
}
