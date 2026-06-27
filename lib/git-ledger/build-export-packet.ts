import { createHash } from "node:crypto";

export const GIT_LEDGER_EXPORT_BUILDER_VERSION_V01 =
  "git_ledger_export_builder.v0.1" as const;
export const GIT_LEDGER_EXPORT_CONTRACT_VERSION_V01 =
  "git_ledger_export_contract.v0.1" as const;
export const GIT_LEDGER_EXPORT_PACKET_VERSION_V01 = "git_ledger_packet.v0.1" as const;
export const GIT_LEDGER_EXPORT_SCOPE_V01 = "project:augnes" as const;

export const GitLedgerExportBuilderStatusesV01 = [
  "packet_candidate_created",
  "blocked_private_or_raw_payload",
  "blocked_forbidden_authority",
  "blocked_missing_lineage",
  "blocked_invalid_input",
  "rejected",
] as const;
export type GitLedgerExportBuilderStatusV01 =
  (typeof GitLedgerExportBuilderStatusesV01)[number];

export const GitLedgerExportLineageKindsV01 = [
  "source_ref",
  "candidate_ref",
  "evidence_ref",
  "reviewer_note_ref",
  "formation_receipt_ref",
  "state_transition_ref",
  "promotion_decision_ref",
  "dogfooding_record",
  "feedback_aggregate",
  "runtime_audit",
  "retrieval_index",
  "provider_extraction",
  "manual_anchor",
  "surfacing_preview",
  "trajectory",
] as const;
export type GitLedgerExportLineageKindV01 =
  (typeof GitLedgerExportLineageKindsV01)[number];

export const GitLedgerExportBuilderReasonCodesV01 = [
  "roadmap_file_present",
  "contract_ref_present",
  "builder_input_validated",
  "packet_candidate_created",
  "deterministic_packet_hash_created",
  "deterministic_idempotency_key_created",
  "summary_markdown_rendered",
  "suggested_commit_message_rendered",
  "lineage_ref_present",
  "lineage_ref_missing",
  "source_ref_present",
  "candidate_ref_present",
  "evidence_ref_present",
  "formation_receipt_ref_present",
  "promotion_decision_ref_present",
  "state_transition_ref_present",
  "privacy_guard_required",
  "public_safe_summary_only",
  "raw_private_payload_blocked",
  "raw_source_body_blocked",
  "raw_provider_output_blocked",
  "raw_retrieval_output_blocked",
  "provider_thread_run_session_id_blocked",
  "private_url_blocked",
  "local_private_path_blocked",
  "secret_like_pattern_blocked",
  "raw_diff_blocked",
  "git_export_runtime_not_implemented",
  "git_write_not_executed",
  "git_commit_not_created",
  "git_branch_not_created",
  "git_tag_not_created",
  "github_api_not_called",
  "pull_request_not_created",
  "repository_file_not_written",
  "db_write_not_executed",
  "provider_call_not_executed",
  "prompt_not_sent",
  "retrieval_not_executed",
  "rag_answer_not_generated",
  "proof_not_created",
  "evidence_not_created",
  "claim_evidence_not_written",
  "promotion_not_executed",
  "durable_state_not_mutated",
  "formation_receipt_not_written",
  "export_import_runtime_not_executed",
  "codex_not_executed",
  "product_write_denied",
  "product_write_not_executed",
  "product_id_allocation_not_executed",
  "ledger_packet_is_not_commit",
  "ledger_packet_is_not_truth",
  "ledger_packet_is_not_proof",
  "ledger_packet_is_not_accepted_evidence",
  "ledger_packet_is_not_product_write",
  "git_ref_not_authority",
  "smoke_pass_not_truth",
  "ci_pass_not_truth",
] as const;
export type GitLedgerExportBuilderReasonCodeV01 =
  (typeof GitLedgerExportBuilderReasonCodesV01)[number];

export type GitLedgerExportBuilderFindingKindV01 =
  | "invalid_input"
  | "missing_required_field"
  | "missing_lineage"
  | "invalid_lineage_ref"
  | "duplicate_lineage_ref"
  | "unsafe_private_or_raw_payload"
  | "forbidden_authority";

export interface GitLedgerExportBuilderAuthorityBoundaryV01 {
  git_ledger_export_builder_now: true;
  deterministic_packet_builder_now: true;
  caller_provided_input_only: true;
  public_safe_packet_candidate_only: true;
  summary_markdown_render_now: true;
  suggested_commit_message_render_now: true;
  git_ledger_export_runtime_now: false;
  git_write_now: false;
  git_commit_now: false;
  git_branch_now: false;
  git_tag_now: false;
  github_api_call_now: false;
  pull_request_creation_now: false;
  github_merge_now: false;
  repository_file_write_now: false;
  local_file_export_now: false;
  local_file_import_now: false;
  db_query_or_write_now: false;
  route_now: false;
  ui_now: false;
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
  export_import_runtime_now: false;
  codex_execution_now: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  product_write_now: false;
  product_id_allocation_now: false;
  product_write_authority: false;
  ledger_packet_is_commit: false;
  ledger_packet_is_truth: false;
  ledger_packet_is_proof: false;
  ledger_packet_is_accepted_evidence: false;
  ledger_packet_is_product_write: false;
  suggested_commit_message_is_approval: false;
  packet_hash_is_truth: false;
  idempotency_key_is_authority: false;
  git_ref_is_authority: false;
  smoke_pass_is_truth: false;
  ci_pass_is_truth: false;
}

export interface GitLedgerExportBuilderFindingV01 {
  finding_id: string;
  path: string;
  finding_kind: GitLedgerExportBuilderFindingKindV01;
  severity: "info" | "warning" | "high" | "critical";
  action: "blocked" | "redacted" | "allowed";
  reason_codes: GitLedgerExportBuilderReasonCodeV01[];
  public_safe_summary: string;
  original_value_included: false;
}

export interface GitLedgerExportBuilderValidationReportV01 {
  status: GitLedgerExportBuilderStatusV01;
  passed: boolean;
  findings: GitLedgerExportBuilderFindingV01[];
  blocked_paths: string[];
  reason_codes: GitLedgerExportBuilderReasonCodeV01[];
  public_safe_summary: string;
  original_values_included: false;
}

export interface GitLedgerExportLineageRefV01 {
  lineage_ref_id: string;
  lineage_ref_kind: GitLedgerExportLineageKindV01;
  ref: string;
  public_safe_summary: string;
  source_path: string;
}

export interface GitLedgerExportBuilderInputV01 {
  builder_version: typeof GIT_LEDGER_EXPORT_BUILDER_VERSION_V01;
  contract_version: typeof GIT_LEDGER_EXPORT_CONTRACT_VERSION_V01;
  scope: typeof GIT_LEDGER_EXPORT_SCOPE_V01;
  generated_by: string;
  generated_at: string;
  packet_id: string;
  packet_title: string;
  change_summary: string;
  reason_summary: string;
  source_refs?: unknown[];
  candidate_refs?: unknown[];
  evidence_refs?: unknown[];
  reviewer_note_refs?: unknown[];
  formation_receipt_refs?: unknown[];
  state_transition_refs?: unknown[];
  promotion_decision_refs?: unknown[];
  dogfooding_record_refs?: unknown[];
  feedback_refs?: unknown[];
  runtime_audit_refs?: unknown[];
  retrieval_index_refs?: unknown[];
  provider_extraction_refs?: unknown[];
  public_safe_metadata?: JsonRecord;
  privacy_report?: unknown;
  suggested_file_layout?: unknown[];
  suggested_commit_intent?: string;
  boundary_notes?: string[];
  reason_codes?: GitLedgerExportBuilderReasonCodeV01[];
  authority_boundary?: Partial<GitLedgerExportBuilderAuthorityBoundaryV01>;
}

export interface GitLedgerExportPacketV01 {
  packet_version: typeof GIT_LEDGER_EXPORT_PACKET_VERSION_V01;
  contract_version: typeof GIT_LEDGER_EXPORT_CONTRACT_VERSION_V01;
  builder_version: typeof GIT_LEDGER_EXPORT_BUILDER_VERSION_V01;
  scope: typeof GIT_LEDGER_EXPORT_SCOPE_V01;
  status: GitLedgerExportBuilderStatusV01;
  packet_id: string;
  packet_title: string;
  generated_by: string;
  generated_at: string;
  change_summary: string;
  reason_summary: string;
  lineage_refs: GitLedgerExportLineageRefV01[];
  public_safe_metadata: JsonRecord;
  privacy_report: unknown;
  suggested_file_layout: unknown[];
  suggested_commit_message: string;
  summary_markdown: string;
  idempotency_key: string;
  packet_hash: string;
  validation: GitLedgerExportBuilderValidationReportV01;
  boundary_notes: string[];
  reason_codes: GitLedgerExportBuilderReasonCodeV01[];
  authority_boundary: GitLedgerExportBuilderAuthorityBoundaryV01;
}

type JsonRecord = Record<string, unknown>;

type FindingDraft = Omit<GitLedgerExportBuilderFindingV01, "finding_id">;

const requiredInputStringFields = [
  "generated_by",
  "generated_at",
  "packet_id",
  "packet_title",
  "change_summary",
  "reason_summary",
] as const;

const refInputGroups: ReadonlyArray<{
  input_field: keyof GitLedgerExportBuilderInputV01;
  lineage_kind: GitLedgerExportLineageKindV01;
  present_reason: GitLedgerExportBuilderReasonCodeV01;
}> = [
  { input_field: "source_refs", lineage_kind: "source_ref", present_reason: "source_ref_present" },
  {
    input_field: "candidate_refs",
    lineage_kind: "candidate_ref",
    present_reason: "candidate_ref_present",
  },
  {
    input_field: "evidence_refs",
    lineage_kind: "evidence_ref",
    present_reason: "evidence_ref_present",
  },
  {
    input_field: "reviewer_note_refs",
    lineage_kind: "reviewer_note_ref",
    present_reason: "lineage_ref_present",
  },
  {
    input_field: "formation_receipt_refs",
    lineage_kind: "formation_receipt_ref",
    present_reason: "formation_receipt_ref_present",
  },
  {
    input_field: "state_transition_refs",
    lineage_kind: "state_transition_ref",
    present_reason: "state_transition_ref_present",
  },
  {
    input_field: "promotion_decision_refs",
    lineage_kind: "promotion_decision_ref",
    present_reason: "promotion_decision_ref_present",
  },
  {
    input_field: "dogfooding_record_refs",
    lineage_kind: "dogfooding_record",
    present_reason: "lineage_ref_present",
  },
  {
    input_field: "feedback_refs",
    lineage_kind: "feedback_aggregate",
    present_reason: "lineage_ref_present",
  },
  {
    input_field: "runtime_audit_refs",
    lineage_kind: "runtime_audit",
    present_reason: "lineage_ref_present",
  },
  {
    input_field: "retrieval_index_refs",
    lineage_kind: "retrieval_index",
    present_reason: "lineage_ref_present",
  },
  {
    input_field: "provider_extraction_refs",
    lineage_kind: "provider_extraction",
    present_reason: "lineage_ref_present",
  },
];

const forbiddenAuthorityFields = [
  "git_ledger_export_runtime_now",
  "git_write_now",
  "git_commit_now",
  "git_branch_now",
  "git_tag_now",
  "github_api_call_now",
  "pull_request_creation_now",
  "github_merge_now",
  "repository_file_write_now",
  "local_file_export_now",
  "local_file_import_now",
  "db_query_or_write_now",
  "route_now",
  "ui_now",
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
  "export_import_runtime_now",
  "codex_execution_now",
  "codex_execution_authority",
  "github_automation_authority",
  "product_write_now",
  "product_id_allocation_now",
  "product_write_authority",
  "ledger_packet_is_commit",
  "ledger_packet_is_truth",
  "ledger_packet_is_proof",
  "ledger_packet_is_accepted_evidence",
  "ledger_packet_is_product_write",
  "suggested_commit_message_is_approval",
  "packet_hash_is_truth",
  "idempotency_key_is_authority",
  "git_ref_is_authority",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
] as const;

const forbiddenAuthorityFieldSet = new Set<string>(forbiddenAuthorityFields);
const allowedTrueAuthorityFields = new Set([
  "git_ledger_export_builder_now",
  "deterministic_packet_builder_now",
  "caller_provided_input_only",
  "public_safe_packet_candidate_only",
  "summary_markdown_render_now",
  "suggested_commit_message_render_now",
]);

const unsafeMarkerReasonMap: ReadonlyArray<{
  pattern: RegExp;
  reason_code: GitLedgerExportBuilderReasonCodeV01;
  summary: string;
}> = [
  {
    pattern: /SAFE_MARKER_PRIVATE_URL|\bhttps?:\/\/(?:localhost|127\.0\.0\.1|10\.|172\.(?:1[6-9]|2\d|3[0-1])\.|192\.168\.)/i,
    reason_code: "private_url_blocked",
    summary: "Private URL marker or local-network URL was blocked.",
  },
  {
    pattern: /SAFE_MARKER_LOCAL_PRIVATE_PATH|(?:^|[\s"'])\/Users\/|(?:^|[\s"'])\/home\/|file:\/\//i,
    reason_code: "local_private_path_blocked",
    summary: "Local private path marker was blocked.",
  },
  {
    pattern: /SAFE_MARKER_SECRET_TOKEN|\b(?:OPENAI_API_KEY|GITHUB_TOKEN)\b|(?:sk-|ghp_)[A-Za-z0-9_-]{8,}|secret[_ -]?token|private key|cookie/i,
    reason_code: "secret_like_pattern_blocked",
    summary: "Secret-like marker was blocked.",
  },
  {
    pattern: /SAFE_MARKER_RAW_SOURCE_BODY|raw source body/i,
    reason_code: "raw_source_body_blocked",
    summary: "Raw source body marker was blocked.",
  },
  {
    pattern: /SAFE_MARKER_RAW_PROVIDER_OUTPUT|raw provider output/i,
    reason_code: "raw_provider_output_blocked",
    summary: "Raw provider output marker was blocked.",
  },
  {
    pattern: /SAFE_MARKER_RAW_RETRIEVAL_OUTPUT|raw retrieval output/i,
    reason_code: "raw_retrieval_output_blocked",
    summary: "Raw retrieval output marker was blocked.",
  },
  {
    pattern: /SAFE_MARKER_RAW_DB_ROW|raw DB row|raw database row/i,
    reason_code: "raw_private_payload_blocked",
    summary: "Raw DB row marker was blocked.",
  },
  {
    pattern: /SAFE_MARKER_PROVIDER_THREAD_ID|\b(?:thread|run|session|resp)_[A-Za-z0-9_-]{12,}\b/i,
    reason_code: "provider_thread_run_session_id_blocked",
    summary: "Provider runtime identifier marker was blocked.",
  },
  {
    pattern: /SAFE_MARKER_RAW_CONVERSATION|raw conversation/i,
    reason_code: "raw_private_payload_blocked",
    summary: "Raw conversation marker was blocked.",
  },
  {
    pattern: /SAFE_MARKER_HIDDEN_REASONING|hidden reasoning/i,
    reason_code: "raw_private_payload_blocked",
    summary: "Hidden reasoning marker was blocked.",
  },
  {
    pattern: /SAFE_MARKER_RAW_DIFF|(?:^|\n)diff --git\b|(?:^|\n)@@\s+-\d+/,
    reason_code: "raw_diff_blocked",
    summary: "Raw diff marker was blocked.",
  },
];

const mutationRequestPatterns: ReadonlyArray<{
  pattern: RegExp;
  reason_code: GitLedgerExportBuilderReasonCodeV01;
  summary: string;
}> = [
  {
    pattern: /\b(?:git\s+(?:commit|push|tag|checkout|branch|merge)|create\s+(?:commit|branch|tag)|merge\s+pull request)\b/i,
    reason_code: "git_write_not_executed",
    summary: "Git mutation request was blocked.",
  },
  {
    pattern: /\b(?:gh\s+pr\s+create|gh\s+pr\s+merge|create\s+(?:pull request|PR)|call\s+GitHub)\b/i,
    reason_code: "github_api_not_called",
    summary: "GitHub mutation request was blocked.",
  },
  {
    pattern: /\b(?:write\s+(?:repository\s+)?file|export\s+file|import\s+file)\b/i,
    reason_code: "repository_file_not_written",
    summary: "Repository or local file mutation request was blocked.",
  },
  {
    pattern: /\b(?:write\s+DB|database\s+write|insert\s+row|update\s+row)\b/i,
    reason_code: "db_write_not_executed",
    summary: "DB mutation request was blocked.",
  },
  {
    pattern: /\b(?:call\s+(?:provider|OpenAI)|send\s+prompt)\b/i,
    reason_code: "provider_call_not_executed",
    summary: "Provider call request was blocked.",
  },
  {
    pattern: /\b(?:execute\s+retrieval|run\s+RAG|rag\s+answer)\b/i,
    reason_code: "retrieval_not_executed",
    summary: "Retrieval or RAG request was blocked.",
  },
  {
    pattern: /\b(?:create\s+proof|create\s+evidence|write\s+claim|write\s+evidence)\b/i,
    reason_code: "proof_not_created",
    summary: "Proof or evidence mutation request was blocked.",
  },
  {
    pattern: /\b(?:promote\s+Perspective|apply\s+durable\s+state|write\s+durable\s+state)\b/i,
    reason_code: "promotion_not_executed",
    summary: "Perspective promotion or durable state mutation request was blocked.",
  },
  {
    pattern: /\b(?:write\s+Formation\s+Receipt|create\s+Formation\s+Receipt)\b/i,
    reason_code: "formation_receipt_not_written",
    summary: "Formation Receipt write request was blocked.",
  },
  {
    pattern: /\b(?:(?:execute|enable|perform|run|create|write)\s+product[-\s]?write|allocate\s+product\s+id)\b/i,
    reason_code: "product_write_denied",
    summary: "Product-write request was blocked.",
  },
];

export function createGitLedgerExportBuilderAuthorityBoundaryV01():
  GitLedgerExportBuilderAuthorityBoundaryV01 {
  return {
    git_ledger_export_builder_now: true,
    deterministic_packet_builder_now: true,
    caller_provided_input_only: true,
    public_safe_packet_candidate_only: true,
    summary_markdown_render_now: true,
    suggested_commit_message_render_now: true,
    git_ledger_export_runtime_now: false,
    git_write_now: false,
    git_commit_now: false,
    git_branch_now: false,
    git_tag_now: false,
    github_api_call_now: false,
    pull_request_creation_now: false,
    github_merge_now: false,
    repository_file_write_now: false,
    local_file_export_now: false,
    local_file_import_now: false,
    db_query_or_write_now: false,
    route_now: false,
    ui_now: false,
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
    export_import_runtime_now: false,
    codex_execution_now: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    product_write_now: false,
    product_id_allocation_now: false,
    product_write_authority: false,
    ledger_packet_is_commit: false,
    ledger_packet_is_truth: false,
    ledger_packet_is_proof: false,
    ledger_packet_is_accepted_evidence: false,
    ledger_packet_is_product_write: false,
    suggested_commit_message_is_approval: false,
    packet_hash_is_truth: false,
    idempotency_key_is_authority: false,
    git_ref_is_authority: false,
    smoke_pass_is_truth: false,
    ci_pass_is_truth: false,
  };
}

export function validateGitLedgerExportBuilderInputV01(
  input: unknown,
): GitLedgerExportBuilderValidationReportV01 {
  const findings: FindingDraft[] = [];
  if (!isRecord(input)) {
    findings.push(
      finding(
        "$",
        "invalid_input",
        "critical",
        "blocked",
        ["builder_input_validated"],
        "Builder input must be a caller-provided object.",
      ),
    );
    return finalizeValidation(findings);
  }

  if (input.builder_version !== GIT_LEDGER_EXPORT_BUILDER_VERSION_V01) {
    findings.push(
      finding(
        "$.builder_version",
        "missing_required_field",
        "high",
        "blocked",
        ["builder_input_validated"],
        "Builder version is missing or invalid.",
      ),
    );
  }
  if (input.contract_version !== GIT_LEDGER_EXPORT_CONTRACT_VERSION_V01) {
    findings.push(
      finding(
        "$.contract_version",
        "missing_required_field",
        "high",
        "blocked",
        ["contract_ref_present"],
        "Contract version is missing or invalid.",
      ),
    );
  }
  if (input.scope !== GIT_LEDGER_EXPORT_SCOPE_V01) {
    findings.push(
      finding(
        "$.scope",
        "missing_required_field",
        "high",
        "blocked",
        ["builder_input_validated"],
        "Scope is missing or invalid.",
      ),
    );
  }
  for (const field of requiredInputStringFields) {
    if (!isNonEmptyPublicSafeString(input[field])) {
      findings.push(
        finding(
          `$.${field}`,
          "missing_required_field",
          "high",
          "blocked",
          ["builder_input_validated"],
          `${field} must be a non-empty public-safe string.`,
        ),
      );
    }
  }

  const lineageRefs = collectLineageRefs(input, findings);
  if (lineageRefs.length === 0) {
    findings.push(
      finding(
        "$.lineage_refs",
        "missing_lineage",
        "high",
        "blocked",
        ["lineage_ref_missing"],
        "At least one public-safe lineage ref is required.",
      ),
    );
  }

  scanUnknownValue(input, "$", findings);
  scanAuthorityBoundary(input.authority_boundary, "$.authority_boundary", findings);

  return finalizeValidation(findings);
}

export function buildGitLedgerExportPacketV01(input: unknown): GitLedgerExportPacketV01 {
  const validation = validateGitLedgerExportBuilderInputV01(input);
  const inputRecord = isRecord(input) ? input : {};
  const lineageRefs = isRecord(input) ? collectLineageRefs(input, []) : [];
  const status = validation.status;
  const reasonCodes = withDefaultReasonCodes([
    ...validation.reason_codes,
    ...deriveLineageReasonCodes(lineageRefs),
    "roadmap_file_present",
    "contract_ref_present",
    "builder_input_validated",
    "privacy_guard_required",
    "public_safe_summary_only",
    "git_export_runtime_not_implemented",
    "git_write_not_executed",
    "git_commit_not_created",
    "git_branch_not_created",
    "git_tag_not_created",
    "github_api_not_called",
    "pull_request_not_created",
    "repository_file_not_written",
    "db_write_not_executed",
    "provider_call_not_executed",
    "prompt_not_sent",
    "retrieval_not_executed",
    "rag_answer_not_generated",
    "proof_not_created",
    "evidence_not_created",
    "claim_evidence_not_written",
    "promotion_not_executed",
    "durable_state_not_mutated",
    "formation_receipt_not_written",
    "export_import_runtime_not_executed",
    "codex_not_executed",
    "product_write_denied",
    "product_write_not_executed",
    "product_id_allocation_not_executed",
    "ledger_packet_is_not_commit",
    "ledger_packet_is_not_truth",
    "ledger_packet_is_not_proof",
    "ledger_packet_is_not_accepted_evidence",
    "ledger_packet_is_not_product_write",
    "git_ref_not_authority",
    "smoke_pass_not_truth",
    "ci_pass_not_truth",
  ]);

  if (status === "packet_candidate_created") {
    reasonCodes.push(
      "packet_candidate_created",
      "deterministic_packet_hash_created",
      "deterministic_idempotency_key_created",
      "summary_markdown_rendered",
      "suggested_commit_message_rendered",
    );
  }

  const packetWithoutRenderedText: GitLedgerExportPacketV01 = {
    packet_version: GIT_LEDGER_EXPORT_PACKET_VERSION_V01,
    contract_version: GIT_LEDGER_EXPORT_CONTRACT_VERSION_V01,
    builder_version: GIT_LEDGER_EXPORT_BUILDER_VERSION_V01,
    scope: GIT_LEDGER_EXPORT_SCOPE_V01,
    status,
    packet_id: publicSafeString(inputRecord.packet_id, "git-ledger-packet:rejected"),
    packet_title: publicSafeString(
      inputRecord.packet_title,
      "Rejected Git Ledger packet candidate",
    ),
    generated_by: publicSafeString(inputRecord.generated_by, "operator-ref:unknown"),
    generated_at: publicSafeString(inputRecord.generated_at, "1970-01-01T00:00:00.000Z"),
    change_summary: publicSafeString(inputRecord.change_summary, "No public-safe summary."),
    reason_summary: publicSafeString(inputRecord.reason_summary, "No public-safe reason."),
    lineage_refs: lineageRefs,
    public_safe_metadata: sanitizeRecord(inputRecord.public_safe_metadata),
    privacy_report: sanitizeValue(inputRecord.privacy_report ?? null),
    suggested_file_layout: sanitizeArray(inputRecord.suggested_file_layout),
    suggested_commit_message: "",
    summary_markdown: "",
    idempotency_key: createGitLedgerExportIdempotencyKeyV01(input),
    packet_hash: "",
    validation,
    boundary_notes: normalizeStringArray(inputRecord.boundary_notes),
    reason_codes: dedupeSortedReasonCodes(reasonCodes),
    authority_boundary: createGitLedgerExportBuilderAuthorityBoundaryV01(),
  };

  const withMessage = {
    ...packetWithoutRenderedText,
    suggested_commit_message: renderSuggestedGitLedgerCommitMessageV01(
      packetWithoutRenderedText,
    ),
  };
  const withSummary = {
    ...withMessage,
    summary_markdown: renderGitLedgerExportSummaryMarkdownV01(withMessage),
  };
  return {
    ...withSummary,
    packet_hash: createGitLedgerExportPacketHashV01(withSummary),
  };
}

export function validateGitLedgerExportPacketV01(
  packet: unknown,
): GitLedgerExportBuilderValidationReportV01 {
  const findings: FindingDraft[] = [];
  if (!isRecord(packet)) {
    findings.push(
      finding(
        "$",
        "invalid_input",
        "critical",
        "blocked",
        ["builder_input_validated"],
        "Packet must be an object.",
      ),
    );
    return finalizeValidation(findings);
  }
  if (packet.packet_version !== GIT_LEDGER_EXPORT_PACKET_VERSION_V01) {
    findings.push(
      finding(
        "$.packet_version",
        "missing_required_field",
        "high",
        "blocked",
        ["builder_input_validated"],
        "Packet version is missing or invalid.",
      ),
    );
  }
  if (packet.contract_version !== GIT_LEDGER_EXPORT_CONTRACT_VERSION_V01) {
    findings.push(
      finding(
        "$.contract_version",
        "missing_required_field",
        "high",
        "blocked",
        ["contract_ref_present"],
        "Contract version is missing or invalid.",
      ),
    );
  }
  if (packet.builder_version !== GIT_LEDGER_EXPORT_BUILDER_VERSION_V01) {
    findings.push(
      finding(
        "$.builder_version",
        "missing_required_field",
        "high",
        "blocked",
        ["builder_input_validated"],
        "Builder version is missing or invalid.",
      ),
    );
  }
  if (packet.scope !== GIT_LEDGER_EXPORT_SCOPE_V01) {
    findings.push(
      finding(
        "$.scope",
        "missing_required_field",
        "high",
        "blocked",
        ["builder_input_validated"],
        "Scope is missing or invalid.",
      ),
    );
  }
  for (const field of [
    "packet_id",
    "packet_title",
    "generated_by",
    "generated_at",
    "change_summary",
    "reason_summary",
    "suggested_commit_message",
    "summary_markdown",
    "idempotency_key",
    "packet_hash",
  ]) {
    if (!isNonEmptyPublicSafeString(packet[field])) {
      findings.push(
        finding(
          `$.${field}`,
          "missing_required_field",
          "high",
          "blocked",
          ["builder_input_validated"],
          `${field} must be a non-empty public-safe string.`,
        ),
      );
    }
  }
  if (!Array.isArray(packet.lineage_refs) || packet.lineage_refs.length === 0) {
    findings.push(
      finding(
        "$.lineage_refs",
        "missing_lineage",
        "high",
        "blocked",
        ["lineage_ref_missing"],
        "Packet must include at least one lineage ref.",
      ),
    );
  } else {
    const seen = new Set<string>();
    packet.lineage_refs.forEach((ref, index) => {
      const path = `$.lineage_refs[${index}]`;
      if (!isRecord(ref)) {
        findings.push(
          finding(
            path,
            "invalid_lineage_ref",
            "high",
            "blocked",
            ["lineage_ref_missing"],
            "Lineage ref must be an object.",
          ),
        );
        return;
      }
      if (!GitLedgerExportLineageKindsV01.includes(ref.lineage_ref_kind as never)) {
        findings.push(
          finding(
            `${path}.lineage_ref_kind`,
            "invalid_lineage_ref",
            "high",
            "blocked",
            ["lineage_ref_missing"],
            "Lineage ref kind is invalid.",
          ),
        );
      }
      if (!isNonEmptyPublicSafeString(ref.lineage_ref_id)) {
        findings.push(
          finding(
            `${path}.lineage_ref_id`,
            "invalid_lineage_ref",
            "high",
            "blocked",
            ["lineage_ref_missing"],
            "Lineage ref id must be public-safe.",
          ),
        );
      } else if (seen.has(ref.lineage_ref_id)) {
        findings.push(
          finding(
            `${path}.lineage_ref_id`,
            "duplicate_lineage_ref",
            "high",
            "blocked",
            ["lineage_ref_missing"],
            "Duplicate lineage ref id was blocked.",
          ),
        );
      } else {
        seen.add(ref.lineage_ref_id);
      }
      for (const stringField of ["ref", "public_safe_summary", "source_path"]) {
        if (!isNonEmptyPublicSafeString(ref[stringField])) {
          findings.push(
            finding(
              `${path}.${stringField}`,
              "invalid_lineage_ref",
              "high",
              "blocked",
              ["lineage_ref_missing"],
              `${stringField} must be public-safe.`,
            ),
          );
        }
      }
    });
  }
  const packetHash = typeof packet.packet_hash === "string" ? packet.packet_hash : "";
  if (packetHash && packetHash !== createGitLedgerExportPacketHashV01(packet)) {
    findings.push(
      finding(
        "$.packet_hash",
        "invalid_input",
        "high",
        "blocked",
        ["deterministic_packet_hash_created"],
        "Packet hash does not match deterministic packet content.",
      ),
    );
  }
  scanUnknownValue(packet, "$", findings);
  scanAuthorityBoundary(packet.authority_boundary, "$.authority_boundary", findings);
  return finalizeValidation(findings);
}

export function createGitLedgerExportPacketHashV01(packet: unknown): string {
  return sha256Stable(stripVolatileKeys(packet, new Set(["packet_hash"])));
}

export function createGitLedgerExportIdempotencyKeyV01(input: unknown): string {
  const inputRecord = isRecord(input) ? input : {};
  const basis = {
    builder_version: inputRecord.builder_version ?? GIT_LEDGER_EXPORT_BUILDER_VERSION_V01,
    contract_version: inputRecord.contract_version ?? GIT_LEDGER_EXPORT_CONTRACT_VERSION_V01,
    scope: inputRecord.scope ?? GIT_LEDGER_EXPORT_SCOPE_V01,
    generated_by: sanitizeValue(inputRecord.generated_by ?? ""),
    packet_id: sanitizeValue(inputRecord.packet_id ?? ""),
    source_refs: sanitizeValue(inputRecord.source_refs ?? []),
    candidate_refs: sanitizeValue(inputRecord.candidate_refs ?? []),
    evidence_refs: sanitizeValue(inputRecord.evidence_refs ?? []),
    formation_receipt_refs: sanitizeValue(inputRecord.formation_receipt_refs ?? []),
    promotion_decision_refs: sanitizeValue(inputRecord.promotion_decision_refs ?? []),
    state_transition_refs: sanitizeValue(inputRecord.state_transition_refs ?? []),
    change_summary: sanitizeValue(inputRecord.change_summary ?? ""),
  };
  return `git-ledger-export-builder:v0.1:${sha256Stable(basis).slice(0, 24)}`;
}

export function renderGitLedgerExportSummaryMarkdownV01(
  packet: GitLedgerExportPacketV01,
): string {
  const lines = [
    `# ${packet.packet_title}`,
    "",
    `Packet ref: ${packet.packet_id}`,
    `Status: ${packet.status}`,
    `Generated by: ${packet.generated_by}`,
    `Generated at: ${packet.generated_at}`,
    "",
    "## Change Summary",
    packet.change_summary,
    "",
    "## Reason Summary",
    packet.reason_summary,
    "",
    "## Lineage Refs",
    ...packet.lineage_refs.map(
      (ref) =>
        `- ${ref.lineage_ref_kind}: ${ref.ref} (${ref.public_safe_summary})`,
    ),
    "",
    "## Authority Boundary",
    "- Packet candidate only.",
    "- Suggested commit message is not approval.",
    "- Packet hash is not truth.",
    "- Idempotency key is not authority.",
    "- Git ref is not authority.",
    "- Product-write remains parked by #686.",
  ];
  return lines.join("\n");
}

export function renderSuggestedGitLedgerCommitMessageV01(
  packet: GitLedgerExportPacketV01,
): string {
  const title = packet.packet_title
    .replace(/[^A-Za-z0-9:() _.-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 64);
  return `docs: prepare Git Ledger packet ${packet.packet_id}\n\nPacket candidate: ${title}\nGit Ledger packet is not a commit, proof, accepted evidence, durable state, promotion, or product-write.`;
}

function collectLineageRefs(
  input: JsonRecord,
  findings: FindingDraft[],
): GitLedgerExportLineageRefV01[] {
  const refs: GitLedgerExportLineageRefV01[] = [];
  const seenIds = new Set<string>();
  for (const group of refInputGroups) {
    const rawList = input[group.input_field];
    if (rawList === undefined) {
      continue;
    }
    if (!Array.isArray(rawList)) {
      findings.push(
        finding(
          `$.${group.input_field}`,
          "invalid_lineage_ref",
          "high",
          "blocked",
          ["lineage_ref_missing"],
          "Lineage ref group must be an array.",
        ),
      );
      continue;
    }
    rawList.forEach((rawRef, index) => {
      const path = `$.${group.input_field}[${index}]`;
      const parsed = parseLineageRef(rawRef, group.lineage_kind, path);
      if (!parsed) {
        findings.push(
          finding(
            path,
            "invalid_lineage_ref",
            "high",
            "blocked",
            ["lineage_ref_missing"],
            "Lineage ref must be public-safe.",
          ),
        );
        return;
      }
      if (seenIds.has(parsed.lineage_ref_id)) {
        findings.push(
          finding(
            `${path}.lineage_ref_id`,
            "duplicate_lineage_ref",
            "high",
            "blocked",
            ["lineage_ref_missing"],
            "Duplicate lineage ref id was blocked.",
          ),
        );
        return;
      }
      seenIds.add(parsed.lineage_ref_id);
      refs.push(parsed);
    });
  }
  return refs.sort((left, right) =>
    [
      left.lineage_ref_kind.localeCompare(right.lineage_ref_kind),
      left.lineage_ref_id.localeCompare(right.lineage_ref_id),
    ].find((result) => result !== 0) ?? 0,
  );
}

function parseLineageRef(
  rawRef: unknown,
  kind: GitLedgerExportLineageKindV01,
  sourcePath: string,
): GitLedgerExportLineageRefV01 | null {
  if (typeof rawRef === "string") {
    if (!isNonEmptyPublicSafeString(rawRef)) {
      return null;
    }
    return {
      lineage_ref_id: `${kind}:${slugify(rawRef)}`,
      lineage_ref_kind: kind,
      ref: rawRef,
      public_safe_summary: "Public-safe symbolic lineage ref.",
      source_path: sourcePath,
    };
  }
  if (!isRecord(rawRef)) {
    return null;
  }
  const ref = firstPublicSafeString(rawRef, ["ref", "ref_id", "id"]);
  if (!ref) {
    return null;
  }
  const explicitKind = firstPublicSafeString(rawRef, ["lineage_ref_kind", "kind"]);
  const lineageKind = explicitKind
    ? GitLedgerExportLineageKindsV01.includes(explicitKind as never)
      ? (explicitKind as GitLedgerExportLineageKindV01)
      : null
    : kind;
  if (!lineageKind) {
    return null;
  }
  const explicitId = firstPublicSafeString(rawRef, ["lineage_ref_id"]);
  const summary =
    firstPublicSafeString(rawRef, ["public_safe_summary", "bounded_summary", "summary"]) ??
    "Public-safe symbolic lineage ref.";
  return {
    lineage_ref_id: explicitId ?? `${lineageKind}:${slugify(ref)}`,
    lineage_ref_kind: lineageKind,
    ref,
    public_safe_summary: summary,
    source_path: sourcePath,
  };
}

function deriveLineageReasonCodes(
  lineageRefs: GitLedgerExportLineageRefV01[],
): GitLedgerExportBuilderReasonCodeV01[] {
  const reasonCodes: GitLedgerExportBuilderReasonCodeV01[] = [];
  if (lineageRefs.length > 0) {
    reasonCodes.push("lineage_ref_present");
  }
  for (const ref of lineageRefs) {
    if (ref.lineage_ref_kind === "source_ref") {
      reasonCodes.push("source_ref_present");
    }
    if (ref.lineage_ref_kind === "candidate_ref") {
      reasonCodes.push("candidate_ref_present");
    }
    if (ref.lineage_ref_kind === "evidence_ref") {
      reasonCodes.push("evidence_ref_present");
    }
    if (ref.lineage_ref_kind === "formation_receipt_ref") {
      reasonCodes.push("formation_receipt_ref_present");
    }
    if (ref.lineage_ref_kind === "promotion_decision_ref") {
      reasonCodes.push("promotion_decision_ref_present");
    }
    if (ref.lineage_ref_kind === "state_transition_ref") {
      reasonCodes.push("state_transition_ref_present");
    }
  }
  return reasonCodes;
}

function scanUnknownValue(value: unknown, path: string, findings: FindingDraft[]): void {
  if (typeof value === "string") {
    for (const marker of unsafeMarkerReasonMap) {
      if (marker.pattern.test(value)) {
        findings.push(
          finding(
            path,
            "unsafe_private_or_raw_payload",
            "critical",
            "blocked",
            [marker.reason_code],
            marker.summary,
          ),
        );
      }
    }
    for (const request of mutationRequestPatterns) {
      if (request.pattern.test(value)) {
        findings.push(
          finding(
            path,
            "forbidden_authority",
            "critical",
            "blocked",
            [request.reason_code],
            request.summary,
          ),
        );
      }
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanUnknownValue(item, `${path}[${index}]`, findings));
    return;
  }
  if (!isRecord(value)) {
    return;
  }
  for (const [key, child] of Object.entries(value).sort(([left], [right]) =>
    left.localeCompare(right),
  )) {
    const childPath = path === "$" ? `$.${key}` : `${path}.${key}`;
    if (isForbiddenAuthorityKey(key) && !isExplicitlyFalseOrUnset(child)) {
      findings.push(
        finding(
          childPath,
          "forbidden_authority",
          "critical",
          "blocked",
          ["git_write_not_executed"],
          "Forbidden authority claim must be false, null, or absent.",
        ),
      );
    }
    scanUnknownValue(child, childPath, findings);
  }
}

function scanAuthorityBoundary(
  boundary: unknown,
  path: string,
  findings: FindingDraft[],
): void {
  if (boundary === undefined || boundary === null) {
    return;
  }
  if (!isRecord(boundary)) {
    findings.push(
      finding(
        path,
        "forbidden_authority",
        "critical",
        "blocked",
        ["git_write_not_executed"],
        "Authority boundary must be an object if provided.",
      ),
    );
    return;
  }
  for (const [key, value] of Object.entries(boundary).sort(([left], [right]) =>
    left.localeCompare(right),
  )) {
    if (allowedTrueAuthorityFields.has(key)) {
      continue;
    }
    if (forbiddenAuthorityFieldSet.has(key) && !isExplicitlyFalseOrUnset(value)) {
      findings.push(
        finding(
          `${path}.${key}`,
          "forbidden_authority",
          "critical",
          "blocked",
          ["git_write_not_executed"],
          "Forbidden authority field must be false, null, or absent.",
        ),
      );
      continue;
    }
    if (isForbiddenAuthorityKey(key) && !isExplicitlyFalseOrUnset(value)) {
      findings.push(
        finding(
          `${path}.${key}`,
          "forbidden_authority",
          "critical",
          "blocked",
          ["git_write_not_executed"],
          "Unknown authority-like field failed closed.",
        ),
      );
    }
  }
}

function finalizeValidation(
  findingDrafts: FindingDraft[],
): GitLedgerExportBuilderValidationReportV01 {
  const findings = dedupeFindings(findingDrafts).map((draft, index) => ({
    ...draft,
    finding_id: `git-ledger-export-builder-finding:${String(index + 1).padStart(3, "0")}`,
  }));
  const reasonCodes = dedupeSortedReasonCodes(
    findings.flatMap((findingItem) => findingItem.reason_codes),
  );
  const blockedPaths = [...new Set(findings.map((findingItem) => findingItem.path))].sort();
  const status = determineStatus(findings);
  return {
    status,
    passed: status === "packet_candidate_created",
    findings,
    blocked_paths: blockedPaths,
    reason_codes: reasonCodes,
    public_safe_summary:
      status === "packet_candidate_created"
        ? "Git Ledger packet builder input is public-safe for packet candidate creation."
        : "Git Ledger packet builder input was blocked or rejected without echoing raw values.",
    original_values_included: false,
  };
}

function determineStatus(
  findings: GitLedgerExportBuilderFindingV01[],
): GitLedgerExportBuilderStatusV01 {
  if (
    findings.some((findingItem) => findingItem.finding_kind === "forbidden_authority")
  ) {
    return "blocked_forbidden_authority";
  }
  if (
    findings.some(
      (findingItem) => findingItem.finding_kind === "unsafe_private_or_raw_payload",
    )
  ) {
    return "blocked_private_or_raw_payload";
  }
  if (
    findings.some(
      (findingItem) =>
        findingItem.finding_kind === "missing_lineage" ||
        findingItem.finding_kind === "invalid_lineage_ref" ||
        findingItem.finding_kind === "duplicate_lineage_ref",
    )
  ) {
    return "blocked_missing_lineage";
  }
  if (findings.length > 0) {
    return "blocked_invalid_input";
  }
  return "packet_candidate_created";
}

function finding(
  path: string,
  findingKind: GitLedgerExportBuilderFindingKindV01,
  severity: GitLedgerExportBuilderFindingV01["severity"],
  action: GitLedgerExportBuilderFindingV01["action"],
  reasonCodes: GitLedgerExportBuilderReasonCodeV01[],
  publicSafeSummary: string,
): FindingDraft {
  return {
    path,
    finding_kind: findingKind,
    severity,
    action,
    reason_codes: reasonCodes,
    public_safe_summary: publicSafeSummary,
    original_value_included: false,
  };
}

function dedupeFindings(findings: FindingDraft[]): FindingDraft[] {
  const byKey = new Map<string, FindingDraft>();
  for (const findingItem of findings) {
    byKey.set(
      stableStringify([
        findingItem.path,
        findingItem.finding_kind,
        findingItem.reason_codes,
      ]),
      findingItem,
    );
  }
  return [...byKey.values()].sort((left, right) =>
    [
      left.path.localeCompare(right.path),
      left.finding_kind.localeCompare(right.finding_kind),
      left.public_safe_summary.localeCompare(right.public_safe_summary),
    ].find((result) => result !== 0) ?? 0,
  );
}

function withDefaultReasonCodes(
  reasonCodes: GitLedgerExportBuilderReasonCodeV01[],
): GitLedgerExportBuilderReasonCodeV01[] {
  return dedupeSortedReasonCodes(reasonCodes);
}

function dedupeSortedReasonCodes(
  reasonCodes: GitLedgerExportBuilderReasonCodeV01[],
): GitLedgerExportBuilderReasonCodeV01[] {
  return [...new Set(reasonCodes)].sort();
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyPublicSafeString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && !hasUnsafeString(value);
}

function publicSafeString(value: unknown, fallback: string): string {
  if (isNonEmptyPublicSafeString(value)) {
    return value.trim();
  }
  return fallback;
}

function firstPublicSafeString(record: JsonRecord, keys: string[]): string | null {
  for (const key of keys) {
    if (isNonEmptyPublicSafeString(record[key])) {
      return String(record[key]).trim();
    }
  }
  return null;
}

function hasUnsafeString(value: string): boolean {
  return unsafeMarkerReasonMap.some((marker) => marker.pattern.test(value));
}

function sanitizeRecord(value: unknown): JsonRecord {
  const sanitized = sanitizeValue(value);
  return isRecord(sanitized) ? sanitized : {};
}

function sanitizeArray(value: unknown): unknown[] {
  const sanitized = sanitizeValue(value);
  return Array.isArray(sanitized) ? sanitized : [];
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    if (hasUnsafeString(value)) {
      return "[REDACTED:public-safe-summary-only]";
    }
    return value.trim();
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, sanitizeValue(child)]),
    );
  }
  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "number" ||
    value === undefined
  ) {
    return value ?? null;
  }
  return "[REDACTED:unsupported-value]";
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item): item is string => isNonEmptyPublicSafeString(item))
    .map((item) => item.trim())
    .sort();
}

function isForbiddenAuthorityKey(key: string): boolean {
  if (forbiddenAuthorityFieldSet.has(key)) {
    return true;
  }
  if (allowedTrueAuthorityFields.has(key)) {
    return false;
  }
  return /(?:_now|_authority|_is_truth|_is_proof|_is_approval|_is_commit|_write|_call|_execution|_mutation|_creation|_merge|_export|_import)$/i.test(
    key,
  );
}

function isExplicitlyFalseOrUnset(value: unknown): boolean {
  return value === false || value === null || value === undefined;
}

function stripVolatileKeys(value: unknown, keysToStrip: Set<string>): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stripVolatileKeys(item, keysToStrip));
  }
  if (!isRecord(value)) {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !keysToStrip.has(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, stripVolatileKeys(child, keysToStrip)]),
  );
}

function sha256Stable(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (isRecord(value)) {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${stableStringify(child)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9:_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return slug || sha256Stable(value).slice(0, 16);
}
