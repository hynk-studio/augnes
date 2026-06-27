import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

export const LOCAL_GIT_LEDGER_EXPORT_REQUEST_VERSION_V01 =
  "local_git_ledger_export_request.v0.1" as const;
export const LOCAL_GIT_LEDGER_EXPORT_VERSION_V01 =
  "local_git_ledger_export.v0.1" as const;
export const LOCAL_GIT_LEDGER_EXPORT_MANIFEST_VERSION_V01 =
  "local_git_ledger_export_manifest.v0.1" as const;
export const GIT_LEDGER_EXPORT_BUILDER_VERSION_V01 =
  "git_ledger_export_builder.v0.1" as const;
export const GIT_LEDGER_EXPORT_CONTRACT_VERSION_V01 =
  "git_ledger_export_contract.v0.1" as const;
export const LOCAL_GIT_LEDGER_EXPORT_SCOPE_V01 = "project:augnes" as const;

export const LocalGitLedgerExportArtifactNamesV01 = [
  "packet.json",
  "summary.md",
  "source-refs.json",
  "evidence-refs.json",
  "candidate-refs.json",
  "privacy-report.json",
  "suggested-commit-message.txt",
  "authority-boundary.json",
  "manifest.json",
] as const;
export type LocalGitLedgerExportArtifactNameV01 =
  (typeof LocalGitLedgerExportArtifactNamesV01)[number];

export const LocalGitLedgerExportStatusesV01 = [
  "local_export_written",
  "dry_run_manifest_created",
  "blocked_private_or_raw_payload",
  "blocked_forbidden_authority",
  "blocked_unsafe_output_dir",
  "blocked_invalid_packet",
  "blocked_invalid_input",
  "rejected",
] as const;
export type LocalGitLedgerExportStatusV01 =
  (typeof LocalGitLedgerExportStatusesV01)[number];

export const LocalGitLedgerExportReasonCodesV01 = [
  "roadmap_file_present",
  "contract_ref_present",
  "builder_ref_present",
  "readonly_preview_ref_present",
  "privacy_guard_required",
  "local_export_request_validated",
  "dry_run_manifest_created",
  "local_export_written",
  "allowlisted_output_dir_confirmed",
  "deterministic_artifact_manifest_created",
  "packet_artifact_written",
  "summary_markdown_artifact_written",
  "source_refs_artifact_written",
  "evidence_refs_artifact_written",
  "candidate_refs_artifact_written",
  "privacy_report_artifact_written",
  "suggested_commit_message_artifact_written",
  "authority_boundary_artifact_written",
  "manifest_artifact_written",
  "public_safe_summary_only",
  "raw_private_payload_blocked",
  "raw_source_body_blocked",
  "raw_provider_output_blocked",
  "raw_retrieval_output_blocked",
  "raw_db_row_blocked",
  "raw_conversation_blocked",
  "hidden_reasoning_blocked",
  "provider_thread_run_session_id_blocked",
  "private_url_blocked",
  "local_private_path_blocked",
  "secret_like_pattern_blocked",
  "raw_diff_blocked",
  "unsafe_output_dir_blocked",
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
  "local_import_not_executed",
  "codex_not_executed",
  "product_write_denied",
  "product_write_not_executed",
  "product_id_allocation_not_executed",
  "exported_packet_is_not_commit",
  "exported_packet_is_not_truth",
  "exported_packet_is_not_proof",
  "exported_packet_is_not_accepted_evidence",
  "exported_packet_is_not_durable_state",
  "exported_packet_is_not_promotion",
  "exported_packet_is_not_product_write",
  "suggested_commit_message_not_approval",
  "manifest_hash_not_truth",
  "artifact_hash_not_authority",
  "git_ref_not_authority",
  "smoke_pass_not_truth",
  "ci_pass_not_truth",
] as const;
export type LocalGitLedgerExportReasonCodeV01 =
  (typeof LocalGitLedgerExportReasonCodesV01)[number];

export type LocalGitLedgerExportFindingKindV01 =
  | "invalid_input"
  | "missing_required_field"
  | "unsafe_output_dir"
  | "invalid_packet"
  | "unsafe_private_or_raw_payload"
  | "forbidden_authority";

export interface LocalGitLedgerExportAuthorityBoundaryV01 {
  local_git_ledger_export_helper_now: true;
  caller_provided_packet_only: true;
  allowlisted_local_output_dir_only: true;
  deterministic_artifact_manifest_now: true;
  local_file_export_now: boolean;
  dry_run_manifest_only: boolean;
  git_ledger_export_runtime_now: false;
  git_write_now: false;
  git_commit_now: false;
  git_branch_now: false;
  git_tag_now: false;
  github_api_call_now: false;
  pull_request_creation_now: false;
  github_merge_now: false;
  repository_file_write_now: false;
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
  exported_packet_is_commit: false;
  exported_packet_is_truth: false;
  exported_packet_is_proof: false;
  exported_packet_is_accepted_evidence: false;
  exported_packet_is_durable_state: false;
  exported_packet_is_promotion: false;
  exported_packet_is_product_write: false;
  suggested_commit_message_is_approval: false;
  manifest_hash_is_truth: false;
  artifact_hash_is_authority: false;
  git_ref_is_authority: false;
  smoke_pass_is_truth: false;
  ci_pass_is_truth: false;
}

export interface LocalGitLedgerExportFindingV01 {
  finding_id: string;
  path: string;
  finding_kind: LocalGitLedgerExportFindingKindV01;
  severity: "info" | "warning" | "high" | "critical";
  action: "blocked" | "allowed";
  reason_codes: LocalGitLedgerExportReasonCodeV01[];
  public_safe_summary: string;
  original_value_included: false;
}

export interface LocalGitLedgerExportValidationReportV01 {
  status: LocalGitLedgerExportStatusV01;
  passed: boolean;
  findings: LocalGitLedgerExportFindingV01[];
  blocked_paths: string[];
  reason_codes: LocalGitLedgerExportReasonCodeV01[];
  public_safe_summary: string;
  original_values_included: false;
}

export interface LocalGitLedgerExportRequestV01 {
  request_version: typeof LOCAL_GIT_LEDGER_EXPORT_REQUEST_VERSION_V01;
  export_version: typeof LOCAL_GIT_LEDGER_EXPORT_VERSION_V01;
  builder_version: typeof GIT_LEDGER_EXPORT_BUILDER_VERSION_V01;
  contract_version: typeof GIT_LEDGER_EXPORT_CONTRACT_VERSION_V01;
  scope: typeof LOCAL_GIT_LEDGER_EXPORT_SCOPE_V01;
  export_id: string;
  requested_by: string;
  requested_at: string;
  output_dir: string;
  dry_run?: boolean;
  packet: JsonRecord;
  summary_markdown: string;
  suggested_commit_message: string;
  privacy_report: unknown;
  source_refs: unknown[];
  evidence_refs: unknown[];
  candidate_refs: unknown[];
  authority_boundary: Partial<LocalGitLedgerExportAuthorityBoundaryV01>;
  boundary_notes?: string[];
  reason_codes?: LocalGitLedgerExportReasonCodeV01[];
}

export interface LocalGitLedgerExportManifestV01 {
  manifest_version: typeof LOCAL_GIT_LEDGER_EXPORT_MANIFEST_VERSION_V01;
  export_version: typeof LOCAL_GIT_LEDGER_EXPORT_VERSION_V01;
  builder_version: typeof GIT_LEDGER_EXPORT_BUILDER_VERSION_V01;
  contract_version: typeof GIT_LEDGER_EXPORT_CONTRACT_VERSION_V01;
  scope: typeof LOCAL_GIT_LEDGER_EXPORT_SCOPE_V01;
  export_id: string;
  requested_by: string;
  requested_at: string;
  output_dir_ref: string;
  artifact_names: LocalGitLedgerExportArtifactNameV01[];
  artifact_count: number;
  artifact_hashes: Record<string, string>;
  manifest_hash: string;
  packet_ref: string;
  packet_hash: string;
  idempotency_key: string;
  privacy_report_summary: string;
  authority_boundary: LocalGitLedgerExportAuthorityBoundaryV01;
  boundary_notes: string[];
  reason_codes: LocalGitLedgerExportReasonCodeV01[];
  status: LocalGitLedgerExportStatusV01;
}

export interface LocalGitLedgerExportWriteResultV01 {
  status: LocalGitLedgerExportStatusV01;
  manifest: LocalGitLedgerExportManifestV01;
  validation: LocalGitLedgerExportValidationReportV01;
  artifact_names: LocalGitLedgerExportArtifactNameV01[];
  artifact_paths: string[];
  written: boolean;
}

type JsonRecord = Record<string, unknown>;
type FindingDraft = Omit<LocalGitLedgerExportFindingV01, "finding_id">;
type ExportMode = "dry_run" | "write";

const requiredRequestStringFields = [
  "export_id",
  "requested_by",
  "requested_at",
  "output_dir",
  "summary_markdown",
  "suggested_commit_message",
] as const;

const requiredRequestArrayFields = [
  "source_refs",
  "evidence_refs",
  "candidate_refs",
] as const;

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
  "exported_packet_is_commit",
  "exported_packet_is_truth",
  "exported_packet_is_proof",
  "exported_packet_is_accepted_evidence",
  "exported_packet_is_durable_state",
  "exported_packet_is_promotion",
  "exported_packet_is_product_write",
  "suggested_commit_message_is_approval",
  "manifest_hash_is_truth",
  "artifact_hash_is_authority",
  "git_ref_is_authority",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
] as const;

const forbiddenAuthorityFieldSet = new Set<string>(forbiddenAuthorityFields);
const allowedTrueAuthorityFields = new Set([
  "local_git_ledger_export_helper_now",
  "caller_provided_packet_only",
  "allowlisted_local_output_dir_only",
  "deterministic_artifact_manifest_now",
  "local_file_export_now",
  "dry_run_manifest_only",
]);
const packetAllowedTrueAuthorityFields = new Set([
  "git_ledger_export_builder_now",
  "deterministic_packet_builder_now",
  "caller_provided_input_only",
  "public_safe_packet_candidate_only",
  "summary_markdown_render_now",
  "suggested_commit_message_render_now",
]);

const unsafeMarkerReasonMap: ReadonlyArray<{
  pattern: RegExp;
  reason_code: LocalGitLedgerExportReasonCodeV01;
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
    reason_code: "raw_db_row_blocked",
    summary: "Raw DB row marker was blocked.",
  },
  {
    pattern: /SAFE_MARKER_PROVIDER_THREAD_ID|\b(?:thread|run|session|resp)_[A-Za-z0-9_-]{12,}\b/i,
    reason_code: "provider_thread_run_session_id_blocked",
    summary: "Provider runtime identifier marker was blocked.",
  },
  {
    pattern: /SAFE_MARKER_RAW_CONVERSATION|raw conversation/i,
    reason_code: "raw_conversation_blocked",
    summary: "Raw conversation marker was blocked.",
  },
  {
    pattern: /SAFE_MARKER_HIDDEN_REASONING|hidden reasoning/i,
    reason_code: "hidden_reasoning_blocked",
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
  reason_code: LocalGitLedgerExportReasonCodeV01;
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
    pattern: /\b(?:write\s+repository\s+(?:source\s+)?file|repository\s+file\s+write|write\s+file\s+outside\s+(?:the\s+)?export\s+dir|export\s+outside\s+(?:the\s+)?allowlisted)\b/i,
    reason_code: "repository_file_not_written",
    summary: "Repository source file mutation request was blocked.",
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

export function createLocalGitLedgerExportAuthorityBoundaryV01(
  mode: ExportMode = "dry_run",
): LocalGitLedgerExportAuthorityBoundaryV01 {
  return {
    local_git_ledger_export_helper_now: true,
    caller_provided_packet_only: true,
    allowlisted_local_output_dir_only: true,
    deterministic_artifact_manifest_now: true,
    local_file_export_now: mode === "write",
    dry_run_manifest_only: mode === "dry_run",
    git_ledger_export_runtime_now: false,
    git_write_now: false,
    git_commit_now: false,
    git_branch_now: false,
    git_tag_now: false,
    github_api_call_now: false,
    pull_request_creation_now: false,
    github_merge_now: false,
    repository_file_write_now: false,
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
    exported_packet_is_commit: false,
    exported_packet_is_truth: false,
    exported_packet_is_proof: false,
    exported_packet_is_accepted_evidence: false,
    exported_packet_is_durable_state: false,
    exported_packet_is_promotion: false,
    exported_packet_is_product_write: false,
    suggested_commit_message_is_approval: false,
    manifest_hash_is_truth: false,
    artifact_hash_is_authority: false,
    git_ref_is_authority: false,
    smoke_pass_is_truth: false,
    ci_pass_is_truth: false,
  };
}

export function isSafeLocalGitLedgerExportOutputDirV01(outputDir: unknown): boolean {
  if (typeof outputDir !== "string") {
    return false;
  }
  const value = outputDir.trim();
  if (!value || hasUnsafeRenderableString(value)) {
    return false;
  }
  if (
    value.includes("\0") ||
    value.includes("\\") ||
    value.includes("://") ||
    value.startsWith("file:") ||
    path.isAbsolute(value)
  ) {
    return false;
  }
  const normalized = path.posix.normalize(value);
  if (normalized !== value || normalized === "." || normalized.split("/").includes("..")) {
    return false;
  }
  if (
    !(
      normalized.startsWith("tmp/git-ledger-export/") ||
      normalized.startsWith(".tmp/git-ledger-export/")
    )
  ) {
    return false;
  }
  return !/^(?:docs|lib|app|components|scripts|fixtures|package\.json|\.github)(?:\/|$)/.test(
    normalized,
  );
}

export function validateLocalGitLedgerExportRequestV01(
  input: unknown,
): LocalGitLedgerExportValidationReportV01 {
  const findings: FindingDraft[] = [];
  if (!isRecord(input)) {
    findings.push(
      finding(
        "$",
        "invalid_input",
        "critical",
        "blocked",
        ["local_export_request_validated"],
        "Local Git Ledger export request must be a caller-provided object.",
      ),
    );
    return finalizeValidation(findings, false);
  }

  if (input.request_version !== LOCAL_GIT_LEDGER_EXPORT_REQUEST_VERSION_V01) {
    findings.push(
      finding(
        "$.request_version",
        "missing_required_field",
        "high",
        "blocked",
        ["local_export_request_validated"],
        "Request version is missing or invalid.",
      ),
    );
  }
  if (input.export_version !== LOCAL_GIT_LEDGER_EXPORT_VERSION_V01) {
    findings.push(
      finding(
        "$.export_version",
        "missing_required_field",
        "high",
        "blocked",
        ["local_export_request_validated"],
        "Export version is missing or invalid.",
      ),
    );
  }
  if (input.builder_version !== GIT_LEDGER_EXPORT_BUILDER_VERSION_V01) {
    findings.push(
      finding(
        "$.builder_version",
        "missing_required_field",
        "high",
        "blocked",
        ["builder_ref_present"],
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
  if (input.scope !== LOCAL_GIT_LEDGER_EXPORT_SCOPE_V01) {
    findings.push(
      finding(
        "$.scope",
        "missing_required_field",
        "high",
        "blocked",
        ["local_export_request_validated"],
        "Scope is missing or invalid.",
      ),
    );
  }

  for (const field of requiredRequestStringFields) {
    if (!isNonEmptyPublicSafeString(input[field])) {
      findings.push(
        finding(
          `$.${field}`,
          field === "output_dir" ? "unsafe_output_dir" : "missing_required_field",
          "high",
          "blocked",
          field === "output_dir"
            ? ["unsafe_output_dir_blocked"]
            : ["local_export_request_validated"],
          `${field} must be a non-empty public-safe string.`,
        ),
      );
    }
  }
  if (!isSafeLocalGitLedgerExportOutputDirV01(input.output_dir)) {
    findings.push(
      finding(
        "$.output_dir",
        "unsafe_output_dir",
        "critical",
        "blocked",
        ["unsafe_output_dir_blocked"],
        "Output directory must be under tmp/git-ledger-export/ or .tmp/git-ledger-export/.",
      ),
    );
  }

  for (const field of requiredRequestArrayFields) {
    if (!Array.isArray(input[field])) {
      findings.push(
        finding(
          `$.${field}`,
          "missing_required_field",
          "high",
          "blocked",
          ["local_export_request_validated"],
          `${field} must be an array.`,
        ),
      );
    }
  }

  validatePacket(input.packet, findings);
  if (!isRecord(input.privacy_report)) {
    findings.push(
      finding(
        "$.privacy_report",
        "missing_required_field",
        "high",
        "blocked",
        ["privacy_guard_required"],
        "Privacy report must be present as a public-safe object.",
      ),
    );
  }
  if (!isRecord(input.authority_boundary)) {
    findings.push(
      finding(
        "$.authority_boundary",
        "forbidden_authority",
        "critical",
        "blocked",
        ["git_write_not_executed"],
        "Authority boundary must be present as an object.",
      ),
    );
  }

  scanUnknownValue(input, "$", findings);
  scanAuthorityBoundary(input.authority_boundary, "$.authority_boundary", findings);

  return finalizeValidation(findings, Boolean(input.dry_run));
}

export function buildLocalGitLedgerExportManifestV01(
  input: unknown,
): LocalGitLedgerExportManifestV01 {
  const validation = validateLocalGitLedgerExportRequestV01(input);
  const inputRecord = isRecord(input) ? input : {};
  const mode: ExportMode =
    validation.passed && inputRecord.dry_run !== true ? "write" : "dry_run";
  const status: LocalGitLedgerExportStatusV01 = validation.passed
    ? mode === "write"
      ? "local_export_written"
      : "dry_run_manifest_created"
    : validation.status;
  const artifactContents = buildArtifactContents(inputRecord, status, mode);
  const artifactHashes = Object.fromEntries(
    LocalGitLedgerExportArtifactNamesV01.map((name) => [
      name,
      name === "manifest.json" ? "" : sha256Text(artifactContents[name]),
    ]),
  );
  const reasonCodes = dedupeSortedReasonCodes([
    ...validation.reason_codes,
    ...normalizeReasonCodes(inputRecord.reason_codes),
    "roadmap_file_present",
    "contract_ref_present",
    "builder_ref_present",
    "readonly_preview_ref_present",
    "privacy_guard_required",
    "local_export_request_validated",
    "deterministic_artifact_manifest_created",
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
    "local_import_not_executed",
    "codex_not_executed",
    "product_write_denied",
    "product_write_not_executed",
    "product_id_allocation_not_executed",
    "exported_packet_is_not_commit",
    "exported_packet_is_not_truth",
    "exported_packet_is_not_proof",
    "exported_packet_is_not_accepted_evidence",
    "exported_packet_is_not_durable_state",
    "exported_packet_is_not_promotion",
    "exported_packet_is_not_product_write",
    "suggested_commit_message_not_approval",
    "manifest_hash_not_truth",
    "artifact_hash_not_authority",
    "git_ref_not_authority",
    "smoke_pass_not_truth",
    "ci_pass_not_truth",
    ...(isSafeLocalGitLedgerExportOutputDirV01(inputRecord.output_dir)
      ? ["allowlisted_output_dir_confirmed" as const]
      : []),
    ...(status === "dry_run_manifest_created" ? ["dry_run_manifest_created" as const] : []),
    ...(status === "local_export_written"
      ? [
          "local_export_written" as const,
          "packet_artifact_written" as const,
          "summary_markdown_artifact_written" as const,
          "source_refs_artifact_written" as const,
          "evidence_refs_artifact_written" as const,
          "candidate_refs_artifact_written" as const,
          "privacy_report_artifact_written" as const,
          "suggested_commit_message_artifact_written" as const,
          "authority_boundary_artifact_written" as const,
          "manifest_artifact_written" as const,
        ]
      : []),
  ]);

  const manifestWithoutHash: LocalGitLedgerExportManifestV01 = {
    manifest_version: LOCAL_GIT_LEDGER_EXPORT_MANIFEST_VERSION_V01,
    export_version: LOCAL_GIT_LEDGER_EXPORT_VERSION_V01,
    builder_version: GIT_LEDGER_EXPORT_BUILDER_VERSION_V01,
    contract_version: GIT_LEDGER_EXPORT_CONTRACT_VERSION_V01,
    scope: LOCAL_GIT_LEDGER_EXPORT_SCOPE_V01,
    export_id: publicSafeString(inputRecord.export_id, "local-git-ledger-export:rejected"),
    requested_by: publicSafeString(inputRecord.requested_by, "operator-ref:unknown"),
    requested_at: publicSafeString(inputRecord.requested_at, "1970-01-01T00:00:00.000Z"),
    output_dir_ref:
      isSafeLocalGitLedgerExportOutputDirV01(inputRecord.output_dir)
        ? String(inputRecord.output_dir).trim()
        : "blocked-unsafe-output-dir",
    artifact_names: [...LocalGitLedgerExportArtifactNamesV01],
    artifact_count: LocalGitLedgerExportArtifactNamesV01.length,
    artifact_hashes: artifactHashes,
    manifest_hash: "",
    packet_ref: packetRef(inputRecord.packet),
    packet_hash: packetHash(inputRecord.packet),
    idempotency_key: idempotencyKey(inputRecord.packet),
    privacy_report_summary: privacyReportSummary(inputRecord.privacy_report),
    authority_boundary: createLocalGitLedgerExportAuthorityBoundaryV01(mode),
    boundary_notes: normalizeStringArray(inputRecord.boundary_notes),
    reason_codes: reasonCodes,
    status,
  };
  const manifestHash = createLocalGitLedgerExportManifestHashV01(manifestWithoutHash);
  const manifest = {
    ...manifestWithoutHash,
    artifact_hashes: {
      ...artifactHashes,
      "manifest.json": manifestHash,
    },
    manifest_hash: manifestHash,
  };
  return manifest;
}

export function writeLocalGitLedgerExportArtifactsV01(
  input: unknown,
): LocalGitLedgerExportWriteResultV01 {
  const validation = validateLocalGitLedgerExportRequestV01(input);
  const manifest = buildLocalGitLedgerExportManifestV01(input);
  if (!validation.passed || !isRecord(input) || input.dry_run === true) {
    return {
      status: manifest.status,
      manifest,
      validation,
      artifact_names: [...LocalGitLedgerExportArtifactNamesV01],
      artifact_paths: [],
      written: false,
    };
  }

  const outputDir = String(input.output_dir).trim();
  const artifactContents = buildArtifactContents(input, manifest.status, "write", manifest);
  const absoluteOutputDir = path.resolve(process.cwd(), outputDir);
  mkdirSync(absoluteOutputDir, { recursive: true });

  const writtenPaths: string[] = [];
  for (const artifactName of LocalGitLedgerExportArtifactNamesV01) {
    const absoluteArtifactPath = path.resolve(absoluteOutputDir, artifactName);
    if (!isPathInside(absoluteOutputDir, absoluteArtifactPath)) {
      throw new Error("Local Git Ledger export artifact path escaped output directory.");
    }
    writeFileSync(absoluteArtifactPath, artifactContents[artifactName], "utf8");
    writtenPaths.push(path.posix.join(outputDir, artifactName));
  }

  return {
    status: "local_export_written",
    manifest,
    validation,
    artifact_names: [...LocalGitLedgerExportArtifactNamesV01],
    artifact_paths: writtenPaths,
    written: true,
  };
}

export function createLocalGitLedgerExportManifestHashV01(
  manifest: unknown,
): string {
  return sha256Stable(stripVolatileManifestKeys(manifest));
}

function buildArtifactContents(
  inputRecord: JsonRecord,
  status: LocalGitLedgerExportStatusV01,
  mode: ExportMode,
  manifest?: LocalGitLedgerExportManifestV01,
): Record<LocalGitLedgerExportArtifactNameV01, string> {
  const packet = sanitizeValue(inputRecord.packet ?? {});
  const sourceRefs = sanitizeArray(inputRecord.source_refs);
  const evidenceRefs = sanitizeArray(inputRecord.evidence_refs);
  const candidateRefs = sanitizeArray(inputRecord.candidate_refs);
  const privacyReport = sanitizeValue(inputRecord.privacy_report ?? null);
  const boundary = createLocalGitLedgerExportAuthorityBoundaryV01(mode);
  const summaryMarkdown = publicSafeString(
    inputRecord.summary_markdown,
    blockedText(status, "summary markdown"),
  );
  const suggestedCommitMessage = publicSafeString(
    inputRecord.suggested_commit_message,
    blockedText(status, "suggested commit message"),
  );
  const manifestValue =
    manifest ??
    ({
      manifest_version: LOCAL_GIT_LEDGER_EXPORT_MANIFEST_VERSION_V01,
      status,
      public_safe_summary: "Manifest placeholder for deterministic hashing.",
    } as JsonRecord);

  return {
    "packet.json": stableStringify(packet),
    "summary.md": `${summaryMarkdown}\n`,
    "source-refs.json": stableStringify(sourceRefs),
    "evidence-refs.json": stableStringify(evidenceRefs),
    "candidate-refs.json": stableStringify(candidateRefs),
    "privacy-report.json": stableStringify(privacyReport),
    "suggested-commit-message.txt": `${suggestedCommitMessage}\n`,
    "authority-boundary.json": stableStringify(boundary),
    "manifest.json": stableStringify(manifestValue),
  };
}

function validatePacket(packet: unknown, findings: FindingDraft[]): void {
  if (!isRecord(packet)) {
    findings.push(
      finding(
        "$.packet",
        "invalid_packet",
        "critical",
        "blocked",
        ["builder_ref_present"],
        "Packet must be present as a public-safe object.",
      ),
    );
    return;
  }
  for (const field of ["packet_id", "packet_hash", "idempotency_key"]) {
    if (!isNonEmptyPublicSafeString(packet[field])) {
      findings.push(
        finding(
          `$.packet.${field}`,
          "invalid_packet",
          "high",
          "blocked",
          ["builder_ref_present"],
          `${field} must be present on the packet candidate.`,
        ),
      );
    }
  }
  if (packet.status !== "packet_candidate_created") {
    findings.push(
      finding(
        "$.packet.status",
        "invalid_packet",
        "high",
        "blocked",
        ["builder_ref_present"],
        "Packet must be a packet_candidate_created candidate.",
      ),
    );
  }
}

function scanUnknownValue(value: unknown, valuePath: string, findings: FindingDraft[]): void {
  if (typeof value === "string") {
    for (const marker of unsafeMarkerReasonMap) {
      if (marker.pattern.test(value)) {
        findings.push(
          finding(
            valuePath,
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
            valuePath,
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
    value.forEach((item, index) => scanUnknownValue(item, `${valuePath}[${index}]`, findings));
    return;
  }
  if (!isRecord(value)) {
    return;
  }
  for (const [key, child] of Object.entries(value).sort(([left], [right]) =>
    left.localeCompare(right),
  )) {
    const childPath = valuePath === "$" ? `$.${key}` : `${valuePath}.${key}`;
    if (
      isForbiddenAuthorityKey(key) &&
      !isAllowedPacketAuthorityTrue(valuePath, key) &&
      !isExplicitlyFalseOrUnset(child)
    ) {
      findings.push(
        finding(
          childPath,
          "forbidden_authority",
          "critical",
          "blocked",
          ["git_write_not_executed"],
          "Forbidden authority-like field must be false, null, or absent.",
        ),
      );
    }
    scanUnknownValue(child, childPath, findings);
  }
}

function scanAuthorityBoundary(
  boundary: unknown,
  valuePath: string,
  findings: FindingDraft[],
): void {
  if (boundary === undefined || boundary === null) {
    return;
  }
  if (!isRecord(boundary)) {
    findings.push(
      finding(
        valuePath,
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
          `${valuePath}.${key}`,
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
          `${valuePath}.${key}`,
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
  dryRun: boolean,
): LocalGitLedgerExportValidationReportV01 {
  const findings = dedupeFindings(findingDrafts).map((draft, index) => ({
    ...draft,
    finding_id: `local-git-ledger-export-finding:${String(index + 1).padStart(3, "0")}`,
  }));
  const reasonCodes = dedupeSortedReasonCodes(
    findings.flatMap((findingItem) => findingItem.reason_codes),
  );
  const status = determineStatus(findings, dryRun);
  return {
    status,
    passed: status === "local_export_written" || status === "dry_run_manifest_created",
    findings,
    blocked_paths: [...new Set(findings.map((findingItem) => findingItem.path))].sort(),
    reason_codes: reasonCodes,
    public_safe_summary:
      findings.length === 0
        ? "Local Git Ledger export request is public-safe within the requested mode."
        : "Local Git Ledger export request was blocked without echoing raw values.",
    original_values_included: false,
  };
}

function determineStatus(
  findings: LocalGitLedgerExportFindingV01[],
  dryRun: boolean,
): LocalGitLedgerExportStatusV01 {
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
  if (findings.some((findingItem) => findingItem.finding_kind === "unsafe_output_dir")) {
    return "blocked_unsafe_output_dir";
  }
  if (findings.some((findingItem) => findingItem.finding_kind === "invalid_packet")) {
    return "blocked_invalid_packet";
  }
  if (findings.length > 0) {
    return "blocked_invalid_input";
  }
  return dryRun ? "dry_run_manifest_created" : "local_export_written";
}

function finding(
  valuePath: string,
  findingKind: LocalGitLedgerExportFindingKindV01,
  severity: LocalGitLedgerExportFindingV01["severity"],
  action: LocalGitLedgerExportFindingV01["action"],
  reasonCodes: LocalGitLedgerExportReasonCodeV01[],
  publicSafeSummary: string,
): FindingDraft {
  return {
    path: valuePath,
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

function normalizeReasonCodes(value: unknown): LocalGitLedgerExportReasonCodeV01[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is LocalGitLedgerExportReasonCodeV01 =>
    LocalGitLedgerExportReasonCodesV01.includes(item as never),
  );
}

function dedupeSortedReasonCodes(
  reasonCodes: LocalGitLedgerExportReasonCodeV01[],
): LocalGitLedgerExportReasonCodeV01[] {
  return [...new Set(reasonCodes)].sort();
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyPublicSafeString(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    !hasUnsafeRenderableString(value)
  );
}

function publicSafeString(value: unknown, fallback: string): string {
  if (isNonEmptyPublicSafeString(value)) {
    return value.trim();
  }
  return fallback;
}

function packetRef(packet: unknown): string {
  if (isRecord(packet)) {
    return publicSafeString(packet.packet_id, "git-ledger-packet:rejected");
  }
  return "git-ledger-packet:rejected";
}

function packetHash(packet: unknown): string {
  if (isRecord(packet)) {
    return publicSafeString(packet.packet_hash, "packet-hash:unavailable");
  }
  return "packet-hash:unavailable";
}

function idempotencyKey(packet: unknown): string {
  if (isRecord(packet)) {
    return publicSafeString(packet.idempotency_key, "idempotency-key:unavailable");
  }
  return "idempotency-key:unavailable";
}

function privacyReportSummary(value: unknown): string {
  if (isRecord(value)) {
    return publicSafeString(
      value.public_safe_summary ?? value.status,
      "Privacy report present as public-safe summary only.",
    );
  }
  return "Privacy report unavailable.";
}

function hasUnsafeString(value: string): boolean {
  return unsafeMarkerReasonMap.some((marker) => marker.pattern.test(value));
}

function hasForbiddenMutationRequestString(value: string): boolean {
  return mutationRequestPatterns.some((request) => request.pattern.test(value));
}

function hasUnsafeRenderableString(value: string): boolean {
  return hasUnsafeString(value) || hasForbiddenMutationRequestString(value);
}

function sanitizeArray(value: unknown): unknown[] {
  const sanitized = sanitizeValue(value);
  return Array.isArray(sanitized) ? sanitized : [];
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    if (hasUnsafeRenderableString(value)) {
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

function blockedText(status: LocalGitLedgerExportStatusV01, label: string): string {
  if (status === "local_export_written" || status === "dry_run_manifest_created") {
    return `No public-safe ${label}.`;
  }
  return `Blocked ${label}; public-safe summary only.`;
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

function isAllowedPacketAuthorityTrue(valuePath: string, key: string): boolean {
  return valuePath === "$.packet.authority_boundary" && packetAllowedTrueAuthorityFields.has(key);
}

function isExplicitlyFalseOrUnset(value: unknown): boolean {
  return value === false || value === null || value === undefined;
}

function stripVolatileManifestKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stripVolatileManifestKeys(item));
  }
  if (!isRecord(value)) {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== "manifest_hash")
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => {
        if (key === "artifact_hashes" && isRecord(child)) {
          const filteredHashes = Object.fromEntries(
            Object.entries(child)
              .filter(([hashKey]) => hashKey !== "manifest.json")
              .sort(([leftHash], [rightHash]) => leftHash.localeCompare(rightHash)),
          );
          return [key, filteredHashes];
        }
        return [key, stripVolatileManifestKeys(child)];
      }),
  );
}

function isPathInside(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return relative.length > 0 && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function sha256Text(value: string): string {
  return createHash("sha256").update(value).digest("hex");
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
