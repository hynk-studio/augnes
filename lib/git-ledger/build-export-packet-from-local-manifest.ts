import { createHash } from "node:crypto";

import {
  GIT_LEDGER_EXPORT_BUILDER_VERSION_V01,
  GIT_LEDGER_EXPORT_CONTRACT_VERSION_V01,
  GIT_LEDGER_EXPORT_PACKET_VERSION_V01,
  GIT_LEDGER_EXPORT_SCOPE_V01,
  buildGitLedgerExportPacketV01,
  createGitLedgerExportBuilderAuthorityBoundaryV01,
  type GitLedgerExportBuilderInputV01,
  type GitLedgerExportPacketV01,
} from "./build-export-packet";
import {
  buildPrivacyRedactionRuntimeGuardReportV01,
  type PrivacyRedactionRuntimeGuardReport,
} from "../privacy/redaction-guard";
import {
  LocalDataExportManifestCandidateVersionV01,
  LocalDataExportManifestScopeV01,
  type LocalDataExportManifestStatusV01,
} from "../../types/local-data-export-manifest";

export const GitLedgerExportFromLocalManifestBuilderVersionV01 =
  "git_ledger_export_manifest_binding.v0.1" as const;
export const GitLedgerExportFromLocalManifestSliceV01 =
  "git_ledger_export_manifest_binding_v0_1" as const;
export const GitLedgerExportFromLocalManifestNextSliceV01 =
  "selected_runtime_audit_event_store_v0_1" as const;

export const GitLedgerExportFromLocalManifestStatusesV01 = [
  "candidate_only",
  "redacted_with_warnings",
  "blocked_private_or_raw_payload",
  "blocked_forbidden_authority",
  "rejected",
] as const;
export type GitLedgerExportFromLocalManifestStatusV01 =
  (typeof GitLedgerExportFromLocalManifestStatusesV01)[number];

type JsonRecord = Record<string, unknown>;

export interface GitLedgerExportFromLocalManifestSupplementV01 {
  packet_title?: string;
  packet_intent?: string;
  suggested_commit_intent?: string;
  generated_by?: string;
  created_at?: string;
}

export interface GitLedgerExportFromLocalManifestAuthorityBoundaryV01 {
  git_ledger_export_manifest_binding_now: true;
  caller_provided_public_safe_manifest_only: true;
  git_ledger_packet_candidate_only: true;
  git_ledger_export_packet_is_git_commit: false;
  git_ledger_export_packet_is_git_write_approval: false;
  git_ledger_export_packet_is_github_actuation: false;
  git_ledger_export_packet_is_pr_creation: false;
  git_ledger_export_packet_is_release_approval: false;
  git_ledger_export_packet_is_deploy_approval: false;
  git_ledger_export_packet_is_publish_approval: false;
  suggested_commit_message_is_approval: false;
  suggested_commit_intent_is_execution_approval: false;
  packet_hash_is_truth: false;
  packet_hash_is_proof: false;
  packet_hash_is_approval: false;
  idempotency_key_is_approval: false;
  local_data_export_manifest_is_export_file: false;
  local_data_export_manifest_is_import_approval: false;
  manifest_fingerprint_is_proof: false;
  manifest_status_is_product_readiness: false;
  manifest_status_is_release_readiness: false;
  export_item_summary_is_raw_data: false;
  import_preview_is_import_apply: false;
  git_ref_is_authority: false;
  github_pr_ref_is_authority: false;
  validation_pass_is_approval: false;
  validation_failure_is_rejection: false;
  smoke_pass_is_evidence: false;
  smoke_failure_is_rejection: false;
  ci_pass_is_authority: false;
  ci_failure_is_rejection: false;
  skipped_checks_are_automatic_failure: false;
  known_warnings_are_automatic_rejection: false;
  not_done_items_are_automatic_task_creation: false;
  expected_observed_delta_is_approval_or_rejection: false;
  next_recommended_slice_is_execution_approval: false;
  git_write_now: false;
  github_api_call_now: false;
  branch_create_now: false;
  commit_create_now: false;
  pr_create_now: false;
  merge_execute_now: false;
  tag_create_now: false;
  release_create_now: false;
  deploy_execute_now: false;
  publish_execute_now: false;
  local_file_write_now: false;
  local_file_read_now: false;
  import_apply_now: false;
  db_read_now: false;
  db_write_now: false;
  route_now: false;
  ui_now: false;
  component_now: false;
  provider_openai_call_now: false;
  prompt_sent_now: false;
  source_fetch_now: false;
  retrieval_execution_now: false;
  retrieval_index_write_now: false;
  proof_or_evidence_record_now: false;
  claim_or_evidence_write_now: false;
  review_memory_write_now: false;
  promotion_execution_now: false;
  promotion_decision_record_write_now: false;
  formation_receipt_write_now: false;
  durable_state_apply_now: false;
  product_write_now: false;
  product_id_allocation_now: false;
  codex_execution_from_augnes_runtime_now: false;
}

export interface GitLedgerExportFromLocalManifestItemSummaryV01 {
  item_id: string;
  item_kind: string;
  source_ref: string;
  public_safe_summary: string;
  reference_only: true;
  candidate_only: true;
  raw_data_included: false;
  proof_or_evidence_created: false;
}

export interface GitLedgerExportFromLocalManifestPacketV01 {
  packet_id: string;
  packet_version: typeof GIT_LEDGER_EXPORT_PACKET_VERSION_V01;
  builder_version: typeof GitLedgerExportFromLocalManifestBuilderVersionV01;
  scope: typeof GIT_LEDGER_EXPORT_SCOPE_V01;
  created_at: string;
  packet_status: GitLedgerExportFromLocalManifestStatusV01;
  source_manifest_ref: string;
  source_manifest_fingerprint: string;
  source_manifest_status: LocalDataExportManifestStatusV01;
  export_profile: string;
  packet_title: string;
  packet_intent: string;
  change_summary: string;
  reason_summary: string;
  suggested_commit_intent: string;
  suggested_commit_message: string;
  source_summary_refs: string[];
  manifest_item_refs: string[];
  manifest_item_summaries: GitLedgerExportFromLocalManifestItemSummaryV01[];
  lineage_refs: GitLedgerExportPacketV01["lineage_refs"];
  privacy_report: unknown;
  redaction_report: unknown;
  authority_boundary: GitLedgerExportFromLocalManifestAuthorityBoundaryV01;
  forbidden_capabilities: string[];
  git_write_executed: false;
  github_api_called: false;
  branch_created: false;
  commit_created: false;
  pr_created: false;
  merge_executed: false;
  tag_created: false;
  release_created: false;
  deploy_executed: false;
  publish_executed: false;
  local_file_written: false;
  local_file_read: false;
  import_apply_executed: false;
  db_read_executed: false;
  db_write_executed: false;
  review_memory_written: false;
  proof_or_evidence_created: false;
  claim_or_evidence_written: false;
  promotion_executed: false;
  formation_receipt_written: false;
  durable_state_applied: false;
  product_write_executed: false;
  provider_called: false;
  retrieval_executed: false;
  source_fetched: false;
  release_deploy_publish_executed: false;
  packet_hash: string;
  idempotency_key: string;
  reason_codes: string[];
  git_ledger_packet: GitLedgerExportPacketV01;
}

export interface GitLedgerExportFromLocalManifestResultV01 {
  ok: boolean;
  status: GitLedgerExportFromLocalManifestStatusV01;
  error_code: GitLedgerExportFromLocalManifestStatusV01 | null;
  packet: GitLedgerExportFromLocalManifestPacketV01 | null;
  source_manifest_ref: string | null;
  source_manifest_fingerprint: string | null;
  privacy_report: unknown;
  authority_boundary: GitLedgerExportFromLocalManifestAuthorityBoundaryV01;
  reason_codes: string[];
  git_write_executed: false;
  github_api_called: false;
  branch_created: false;
  commit_created: false;
  pr_created: false;
  merge_executed: false;
  tag_created: false;
  release_created: false;
  deploy_executed: false;
  publish_executed: false;
  local_file_written: false;
  local_file_read: false;
  import_apply_executed: false;
  db_read_executed: false;
  db_write_executed: false;
  review_memory_written: false;
  proof_or_evidence_created: false;
  claim_or_evidence_written: false;
  promotion_executed: false;
  formation_receipt_written: false;
  durable_state_applied: false;
  product_write_executed: false;
  provider_called: false;
  retrieval_executed: false;
  source_fetched: false;
  release_deploy_publish_executed: false;
}

interface NormalizedManifest {
  manifest_id: string;
  manifest_fingerprint: string;
  manifest_status: LocalDataExportManifestStatusV01;
  export_profile: string;
  created_at: string;
  source_summary_refs: string[];
  source_refs: string[];
  candidate_bundle_refs: string[];
  dogfooding_record_summary_refs: string[];
  review_memory_summary_refs: string[];
  review_memory_proposal_refs: string[];
  promotion_decision_refs: string[];
  formation_receipt_refs: string[];
  durable_state_summary_refs: string[];
  trajectory_refs: string[];
  feedback_summary_refs: string[];
  runtime_audit_refs: string[];
  git_ledger_packet_refs: string[];
  handoff_packet_refs: string[];
  validation_refs: string[];
  skipped_check_refs: string[];
  known_warning_refs: string[];
  not_done_refs: string[];
  expected_observed_delta_refs: string[];
  export_item_summaries: GitLedgerExportFromLocalManifestItemSummaryV01[];
  privacy_report: unknown;
  redaction_report: unknown;
  import_preview: unknown;
  reason_codes: string[];
}

const defaultCreatedAt = "1970-01-01T00:00:00.000Z" as const;
const defaultGeneratedBy = "operator-ref:local-data-export-manifest-binding" as const;

const blockedManifestStatusMap: Record<
  "blocked_private_or_raw_payload" | "blocked_forbidden_authority" | "rejected",
  GitLedgerExportFromLocalManifestStatusV01
> = {
  blocked_private_or_raw_payload: "blocked_private_or_raw_payload",
  blocked_forbidden_authority: "blocked_forbidden_authority",
  rejected: "rejected",
};

const defaultForbiddenCapabilities = [
  "Git Ledger packet candidate only.",
  "UI, route, DB, provider, retrieval, source-fetch, local file IO, and import apply remain out of scope.",
  "Review Memory, proof/evidence, promotion, Formation Receipt, durable state, and product-write remain out of scope.",
  "Codex, GitHub, Git, tag, release, deploy, and publish execution remain out of scope.",
] as const;

const defaultReasonCodes = [
  "git_ledger_export_manifest_binding_present",
  "caller_provided_public_safe_manifest_only",
  "git_ledger_packet_candidate_only",
  "local_export_manifest_candidate_only",
  "local_export_manifest_not_export_file",
  "local_export_manifest_not_import_approval",
  "manifest_fingerprint_not_proof",
  "manifest_status_not_product_or_release_readiness",
  "import_preview_not_import_apply",
  "suggested_commit_message_not_approval",
  "suggested_commit_intent_not_execution_approval",
  "packet_hash_not_truth",
  "packet_hash_not_proof",
  "packet_hash_not_approval",
  "idempotency_key_not_approval",
  "git_write_not_executed",
  "github_api_not_called",
  "branch_not_created",
  "commit_not_created",
  "pr_not_created",
  "merge_not_executed",
  "tag_not_created",
  "release_not_created",
  "deploy_not_executed",
  "publish_not_executed",
  "local_file_not_written",
  "local_file_not_read",
  "db_not_read",
  "db_not_written",
  "review_memory_not_written",
  "proof_not_created",
  "evidence_not_created",
  "claim_evidence_not_written",
  "promotion_not_executed",
  "formation_receipt_not_written",
  "durable_state_not_applied",
  "product_write_denied",
  "provider_call_not_executed",
  "retrieval_not_executed",
  "source_fetch_not_executed",
  "release_deploy_publish_not_executed",
  "validation_pass_not_approval",
  "validation_failure_not_rejection",
  "ci_pass_not_authority",
  "next_slice_is_cue_not_execution_approval",
] as const;

const privateBlockReasonCodes = new Set([
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
  "canonical_label_from_private_identifier_blocked",
]);

const allowedAuthorityTrueFields = new Set([
  "git_ledger_export_manifest_binding_now",
  "caller_provided_public_safe_manifest_only",
  "git_ledger_packet_candidate_only",
  "local_data_export_manifest_builder_now",
  "caller_provided_public_safe_summaries_only",
  "candidate_only_manifest",
  "review_memory_summaries_are_reference_only",
  "review_memory_proposals_are_candidate_only",
  "promotion_decision_refs_are_reference_only",
  "formation_receipt_refs_are_reference_only",
  "durable_state_summaries_are_summaries_only",
  "git_ledger_packet_refs_are_reference_only",
  "git_ledger_export_builder_now",
  "deterministic_packet_builder_now",
  "caller_provided_input_only",
  "public_safe_packet_candidate_only",
  "summary_markdown_render_now",
  "suggested_commit_message_render_now",
]);

const forbiddenAuthorityFieldSet = new Set([
  "git_write_executed",
  "github_api_called",
  "branch_created",
  "commit_created",
  "pr_created",
  "merge_executed",
  "tag_created",
  "release_created",
  "deploy_executed",
  "publish_executed",
  "git_write_now",
  "github_api_call_now",
  "git_branch_now",
  "git_commit_now",
  "git_tag_now",
  "pull_request_creation_now",
  "github_merge_now",
  "local_file_write_now",
  "local_file_read_now",
  "export_file_written",
  "import_apply_executed",
  "db_read_now",
  "db_write_now",
  "review_memory_write_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "promotion_execution_now",
  "promotion_decision_record_write_now",
  "formation_receipt_write_now",
  "durable_state_apply_now",
  "product_write_now",
  "product_id_allocation_now",
  "provider_openai_call_now",
  "retrieval_execution_now",
  "source_fetch_now",
  "release_deploy_publish_now",
  "source_of_truth",
  "proof_or_evidence_record",
  "product_write_authority",
  "codex_execution_authority",
  "github_automation_authority",
]);

const forbiddenAuthorityPhrasePatterns = [
  /\bgit ledger export packet\s+(?:is|=|as)\s+(?!not(?:\s+a)?\b)(?:git commit|commit|git write approval|github actuation|pr creation|release approval|deploy approval|publish approval|truth|proof|accepted evidence|approval|authority)\b/i,
  /\bsuggested commit message\s+(?:is|=|as)\s+(?!not(?:\s+a)?\b)(?:approval|commit approval|execution approval|authority|git write approval)\b/i,
  /\bsuggested commit intent\s+(?:is|=|as)\s+(?!not(?:\s+a)?\b)(?:execution approval|approval|authority|git write approval)\b/i,
  /\bpacket hash\s+(?:is|=|as)\s+(?!not(?:\s+a)?\b)(?:truth|proof|approval|authority|accepted evidence)\b/i,
  /\bidempotency key\s+(?:is|=|as)\s+(?!not(?:\s+a)?\b)(?:approval|authority|truth|proof|accepted evidence)\b/i,
  /\blocal data export manifest\s+(?:is|=|as)\s+(?!not(?:\s+a)?\b)(?:export file|import approval|truth|proof|accepted evidence|approval|authority)\b/i,
  /\bmanifest fingerprint\s+(?:is|=|as)\s+(?!not(?:\s+a)?\b)(?:proof|approval|truth|authority|accepted evidence)\b/i,
  /\bmanifest status\s+(?:is|=|as)\s+(?!not(?:\s+a)?\b)(?:product readiness|release readiness|approval|authority|truth|proof)\b/i,
  /\bexport item summary\s+(?:is|=|as)\s+(?!not(?:\s+a)?\b)(?:raw data|canonical source body|truth|proof|accepted evidence|authority)\b/i,
  /\bimport preview\s+(?:is|=|as)\s+(?!not(?:\s+a)?\b)(?:import apply|import approval|execution approval|approval|authority)\b/i,
  /\bgit refs?\s+(?:is|are|=|as)\s+(?!not(?:\s+a)?\b)(?:approval|authority|proof|truth|commit approval|write authority)\b/i,
  /\bgithub pr refs?\s+(?:is|are|=|as)\s+(?!not(?:\s+a)?\b)(?:approval|authority|proof|truth|execution approval)\b/i,
  /\bvalidation pass\s+(?:is|=|as)\s+(?!not(?:\s+a)?\b)(?:approval|truth|proof|authority)\b/i,
  /\bvalidation failure\s+(?:is|=|as)\s+(?!not(?:\s+a)?\b)(?:rejection|automatic rejection|truth|proof|authority)\b/i,
  /\bsmoke pass\s+(?:is|=|as)\s+(?!not(?:\s+a)?\b)(?:accepted evidence|evidence|truth|proof|approval|authority)\b/i,
  /\bsmoke failure\s+(?:is|=|as)\s+(?!not(?:\s+a)?\b)(?:rejection|automatic rejection|authority|approval)\b/i,
  /\bci pass\s+(?:is|=|as)\s+(?!not(?:\s+a)?\b)(?:truth|proof|approval|authority|release approval|product readiness)\b/i,
  /\bci failure\s+(?:is|=|as)\s+(?!not(?:\s+a)?\b)(?:rejection|automatic rejection|truth|proof|authority)\b/i,
] as const;

export function createGitLedgerExportFromLocalManifestAuthorityBoundaryV01():
  GitLedgerExportFromLocalManifestAuthorityBoundaryV01 {
  return {
    git_ledger_export_manifest_binding_now: true,
    caller_provided_public_safe_manifest_only: true,
    git_ledger_packet_candidate_only: true,
    git_ledger_export_packet_is_git_commit: false,
    git_ledger_export_packet_is_git_write_approval: false,
    git_ledger_export_packet_is_github_actuation: false,
    git_ledger_export_packet_is_pr_creation: false,
    git_ledger_export_packet_is_release_approval: false,
    git_ledger_export_packet_is_deploy_approval: false,
    git_ledger_export_packet_is_publish_approval: false,
    suggested_commit_message_is_approval: false,
    suggested_commit_intent_is_execution_approval: false,
    packet_hash_is_truth: false,
    packet_hash_is_proof: false,
    packet_hash_is_approval: false,
    idempotency_key_is_approval: false,
    local_data_export_manifest_is_export_file: false,
    local_data_export_manifest_is_import_approval: false,
    manifest_fingerprint_is_proof: false,
    manifest_status_is_product_readiness: false,
    manifest_status_is_release_readiness: false,
    export_item_summary_is_raw_data: false,
    import_preview_is_import_apply: false,
    git_ref_is_authority: false,
    github_pr_ref_is_authority: false,
    validation_pass_is_approval: false,
    validation_failure_is_rejection: false,
    smoke_pass_is_evidence: false,
    smoke_failure_is_rejection: false,
    ci_pass_is_authority: false,
    ci_failure_is_rejection: false,
    skipped_checks_are_automatic_failure: false,
    known_warnings_are_automatic_rejection: false,
    not_done_items_are_automatic_task_creation: false,
    expected_observed_delta_is_approval_or_rejection: false,
    next_recommended_slice_is_execution_approval: false,
    git_write_now: false,
    github_api_call_now: false,
    branch_create_now: false,
    commit_create_now: false,
    pr_create_now: false,
    merge_execute_now: false,
    tag_create_now: false,
    release_create_now: false,
    deploy_execute_now: false,
    publish_execute_now: false,
    local_file_write_now: false,
    local_file_read_now: false,
    import_apply_now: false,
    db_read_now: false,
    db_write_now: false,
    route_now: false,
    ui_now: false,
    component_now: false,
    provider_openai_call_now: false,
    prompt_sent_now: false,
    source_fetch_now: false,
    retrieval_execution_now: false,
    retrieval_index_write_now: false,
    proof_or_evidence_record_now: false,
    claim_or_evidence_write_now: false,
    review_memory_write_now: false,
    promotion_execution_now: false,
    promotion_decision_record_write_now: false,
    formation_receipt_write_now: false,
    durable_state_apply_now: false,
    product_write_now: false,
    product_id_allocation_now: false,
    codex_execution_from_augnes_runtime_now: false,
  };
}

export function buildGitLedgerExportPacketFromLocalManifestV01(
  input: unknown,
  supplement: GitLedgerExportFromLocalManifestSupplementV01 = {},
): GitLedgerExportFromLocalManifestResultV01 {
  const authorityBoundary =
    createGitLedgerExportFromLocalManifestAuthorityBoundaryV01();
  const candidateInput = { input, supplement };
  const privacyReport = buildPrivacyRedactionRuntimeGuardReportV01(
    stripAllowedAuthorityTrueFieldsForPrivacyScan(candidateInput),
  );
  const sourceRef = publicSafeManifestRef(input);
  const sourceFingerprint = publicSafeManifestFingerprint(input);

  if (
    privacyReport.status === "blocked_forbidden_authority" ||
    detectForbiddenAuthority(candidateInput)
  ) {
    return result({
      status: "blocked_forbidden_authority",
      packet: null,
      sourceManifestRef: null,
      sourceManifestFingerprint: null,
      privacyReport: blockedPrivacySummary(
        privacyReport,
        "Forbidden authority shortcut was blocked without unsafe raw echo.",
      ),
      authorityBoundary,
      reasonCodes: [...defaultReasonCodes, "forbidden_authority_blocked"],
    });
  }

  if (
    privacyReport.status === "blocked_private_or_raw_payload" ||
    privacyReport.status === "blocked_invalid_input" ||
    hasPrivateBlockingFinding(privacyReport)
  ) {
    return result({
      status: "blocked_private_or_raw_payload",
      packet: null,
      sourceManifestRef: null,
      sourceManifestFingerprint: null,
      privacyReport,
      authorityBoundary,
      reasonCodes: [...defaultReasonCodes, "raw_private_payload_blocked"],
    });
  }

  const redactedInput =
    privacyReport.status === "redacted_with_warnings"
      ? privacyReport.redacted_preview
      : candidateInput;
  const manifestCandidate = extractManifestCandidate(redactedInput);
  const normalized = normalizeManifest(manifestCandidate);
  if (!normalized) {
    return result({
      status: "rejected",
      packet: null,
      sourceManifestRef: sourceRef,
      sourceManifestFingerprint: sourceFingerprint,
      privacyReport,
      authorityBoundary,
      reasonCodes: [...defaultReasonCodes, "invalid_manifest_input_rejected"],
    });
  }

  if (isBlockedManifestStatus(normalized.manifest_status)) {
    return result({
      status: blockedManifestStatusMap[normalized.manifest_status],
      packet: null,
      sourceManifestRef: normalized.manifest_id,
      sourceManifestFingerprint: normalized.manifest_fingerprint,
      privacyReport: normalized.privacy_report,
      authorityBoundary,
      reasonCodes: [
        ...defaultReasonCodes,
        "source_manifest_status_blocked_no_packet_candidate",
      ],
    });
  }

  const resolvedSupplement = resolveSupplement(redactedInput, supplement);
  const builderInput = buildGitLedgerBuilderInput(normalized, resolvedSupplement);
  const gitLedgerPacket = buildGitLedgerExportPacketV01(builderInput);
  if (gitLedgerPacket.status !== "packet_candidate_created") {
    return result({
      status: mapGitLedgerPacketStatus(gitLedgerPacket.status),
      packet: null,
      sourceManifestRef: normalized.manifest_id,
      sourceManifestFingerprint: normalized.manifest_fingerprint,
      privacyReport: gitLedgerPacket.validation,
      authorityBoundary,
      reasonCodes: [
        ...defaultReasonCodes,
        "git_ledger_packet_builder_rejected_binding_input",
      ],
    });
  }

  const packetStatus =
    normalized.manifest_status === "redacted_with_warnings" ||
    privacyReport.status === "redacted_with_warnings"
      ? "redacted_with_warnings"
      : "candidate_only";
  const packet = buildBindingPacket(
    normalized,
    resolvedSupplement,
    gitLedgerPacket,
    packetStatus,
    authorityBoundary,
  );
  return result({
    status: packet.packet_status,
    packet,
    sourceManifestRef: packet.source_manifest_ref,
    sourceManifestFingerprint: packet.source_manifest_fingerprint,
    privacyReport: packet.privacy_report,
    authorityBoundary,
    reasonCodes: packet.reason_codes,
  });
}

export function buildGitLedgerExportFromLocalManifestV01(
  input: unknown,
  supplement: GitLedgerExportFromLocalManifestSupplementV01 = {},
): GitLedgerExportFromLocalManifestResultV01 {
  return buildGitLedgerExportPacketFromLocalManifestV01(input, supplement);
}

function buildBindingPacket(
  manifest: NormalizedManifest,
  supplement: Required<GitLedgerExportFromLocalManifestSupplementV01>,
  gitLedgerPacket: GitLedgerExportPacketV01,
  packetStatus: "candidate_only" | "redacted_with_warnings",
  authorityBoundary: GitLedgerExportFromLocalManifestAuthorityBoundaryV01,
): GitLedgerExportFromLocalManifestPacketV01 {
  const reasonCodes = uniqueSortedStrings([
    ...defaultReasonCodes,
    ...manifest.reason_codes,
    ...gitLedgerPacket.reason_codes,
    "existing_git_ledger_packet_builder_reused",
    packetStatus === "redacted_with_warnings"
      ? "redacted_with_warnings_reference_only"
      : "privacy_guard_passed",
  ]);
  return {
    packet_id: gitLedgerPacket.packet_id,
    packet_version: GIT_LEDGER_EXPORT_PACKET_VERSION_V01,
    builder_version: GitLedgerExportFromLocalManifestBuilderVersionV01,
    scope: GIT_LEDGER_EXPORT_SCOPE_V01,
    created_at: manifest.created_at,
    packet_status: packetStatus,
    source_manifest_ref: manifest.manifest_id,
    source_manifest_fingerprint: manifest.manifest_fingerprint,
    source_manifest_status: manifest.manifest_status,
    export_profile: manifest.export_profile,
    packet_title: gitLedgerPacket.packet_title,
    packet_intent: supplement.packet_intent,
    change_summary: gitLedgerPacket.change_summary,
    reason_summary: gitLedgerPacket.reason_summary,
    suggested_commit_intent: supplement.suggested_commit_intent,
    suggested_commit_message: gitLedgerPacket.suggested_commit_message,
    source_summary_refs: manifest.source_summary_refs,
    manifest_item_refs: manifest.export_item_summaries.map((item) => item.item_id),
    manifest_item_summaries: manifest.export_item_summaries,
    lineage_refs: gitLedgerPacket.lineage_refs,
    privacy_report: summarizePrivacyReport(manifest.privacy_report),
    redaction_report: manifest.redaction_report,
    authority_boundary: authorityBoundary,
    forbidden_capabilities: [...defaultForbiddenCapabilities],
    git_write_executed: false,
    github_api_called: false,
    branch_created: false,
    commit_created: false,
    pr_created: false,
    merge_executed: false,
    tag_created: false,
    release_created: false,
    deploy_executed: false,
    publish_executed: false,
    local_file_written: false,
    local_file_read: false,
    import_apply_executed: false,
    db_read_executed: false,
    db_write_executed: false,
    review_memory_written: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    promotion_executed: false,
    formation_receipt_written: false,
    durable_state_applied: false,
    product_write_executed: false,
    provider_called: false,
    retrieval_executed: false,
    source_fetched: false,
    release_deploy_publish_executed: false,
    packet_hash: gitLedgerPacket.packet_hash,
    idempotency_key: gitLedgerPacket.idempotency_key,
    reason_codes: reasonCodes,
    git_ledger_packet: gitLedgerPacket,
  };
}

function buildGitLedgerBuilderInput(
  manifest: NormalizedManifest,
  supplement: Required<GitLedgerExportFromLocalManifestSupplementV01>,
): GitLedgerExportBuilderInputV01 {
  return {
    builder_version: GIT_LEDGER_EXPORT_BUILDER_VERSION_V01,
    contract_version: GIT_LEDGER_EXPORT_CONTRACT_VERSION_V01,
    scope: GIT_LEDGER_EXPORT_SCOPE_V01,
    generated_by: supplement.generated_by,
    generated_at: supplement.created_at,
    packet_id: `git-ledger-packet:local-manifest:${hashSuffix({
      manifest_id: manifest.manifest_id,
      manifest_fingerprint: manifest.manifest_fingerprint,
      packet_intent: supplement.packet_intent,
      suggested_commit_intent: supplement.suggested_commit_intent,
    })}`,
    packet_title: supplement.packet_title,
    change_summary: [
      `Prepare Git Ledger export packet candidate from ${manifest.manifest_id}.`,
      `Manifest status ${manifest.manifest_status} and export profile ${manifest.export_profile} are context only.`,
      "No Git or GitHub actuation is executed.",
    ].join(" "),
    reason_summary: [
      supplement.packet_intent,
      "Manifest fingerprint, packet hash, idempotency key, and suggested commit text are review aids only.",
    ].join(" "),
    source_refs: toRefObjects([
      ...manifest.source_summary_refs,
      ...manifest.source_refs,
      ...manifest.validation_refs,
      ...manifest.skipped_check_refs,
      ...manifest.known_warning_refs,
      ...manifest.not_done_refs,
      ...manifest.expected_observed_delta_refs,
    ]),
    candidate_refs: toRefObjects([
      manifest.manifest_id,
      manifest.manifest_fingerprint,
      ...manifest.candidate_bundle_refs,
      ...manifest.review_memory_summary_refs,
      ...manifest.review_memory_proposal_refs,
      ...manifest.git_ledger_packet_refs,
      ...manifest.handoff_packet_refs,
    ]),
    formation_receipt_refs: toRefObjects(manifest.formation_receipt_refs),
    state_transition_refs: toRefObjects(manifest.durable_state_summary_refs),
    promotion_decision_refs: toRefObjects(manifest.promotion_decision_refs),
    dogfooding_record_refs: toRefObjects(manifest.dogfooding_record_summary_refs),
    feedback_refs: toRefObjects(manifest.feedback_summary_refs),
    runtime_audit_refs: toRefObjects(manifest.runtime_audit_refs),
    public_safe_metadata: {
      source_manifest_ref: manifest.manifest_id,
      source_manifest_fingerprint: manifest.manifest_fingerprint,
      source_manifest_status: manifest.manifest_status,
      export_profile: manifest.export_profile,
      import_preview_is_import_apply: false,
      manifest_status_is_release_readiness: false,
      manifest_fingerprint_is_proof: false,
    },
    privacy_report: summarizePrivacyReport(manifest.privacy_report),
    suggested_file_layout: [
      `git-ledger-packet-candidate:${manifest.manifest_id}`,
      "text-only-review-aid:no-file-write",
    ],
    suggested_commit_intent: supplement.suggested_commit_intent,
    boundary_notes: [
      "Git Ledger export packet is candidate-only.",
      "Suggested commit message is not approval.",
      "Suggested commit intent is not execution approval.",
      "Packet hash is not proof or approval.",
      "Idempotency key is not approval.",
      "Local manifest remains candidate context only.",
      "Import preview remains preview-only.",
      "Git refs and GitHub PR refs are references only.",
    ],
    reason_codes: [
      "contract_ref_present",
      "builder_input_validated",
      "public_safe_summary_only",
      "git_write_not_executed",
      "github_api_not_called",
      "git_commit_not_created",
      "git_branch_not_created",
      "git_tag_not_created",
      "pull_request_not_created",
      "repository_file_not_written",
      "ledger_packet_is_not_commit",
      "ledger_packet_is_not_proof",
      "ledger_packet_is_not_accepted_evidence",
    ],
    authority_boundary: createGitLedgerExportBuilderAuthorityBoundaryV01(),
  };
}

function result({
  status,
  packet,
  sourceManifestRef,
  sourceManifestFingerprint,
  privacyReport,
  authorityBoundary,
  reasonCodes,
}: {
  status: GitLedgerExportFromLocalManifestStatusV01;
  packet: GitLedgerExportFromLocalManifestPacketV01 | null;
  sourceManifestRef: string | null;
  sourceManifestFingerprint: string | null;
  privacyReport: unknown;
  authorityBoundary: GitLedgerExportFromLocalManifestAuthorityBoundaryV01;
  reasonCodes: readonly string[];
}): GitLedgerExportFromLocalManifestResultV01 {
  const ok = status === "candidate_only" || status === "redacted_with_warnings";
  return {
    ok,
    status,
    error_code: ok ? null : status,
    packet,
    source_manifest_ref: sourceManifestRef,
    source_manifest_fingerprint: sourceManifestFingerprint,
    privacy_report: privacyReport,
    authority_boundary: authorityBoundary,
    reason_codes: uniqueSortedStrings(reasonCodes),
    git_write_executed: false,
    github_api_called: false,
    branch_created: false,
    commit_created: false,
    pr_created: false,
    merge_executed: false,
    tag_created: false,
    release_created: false,
    deploy_executed: false,
    publish_executed: false,
    local_file_written: false,
    local_file_read: false,
    import_apply_executed: false,
    db_read_executed: false,
    db_write_executed: false,
    review_memory_written: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    promotion_executed: false,
    formation_receipt_written: false,
    durable_state_applied: false,
    product_write_executed: false,
    provider_called: false,
    retrieval_executed: false,
    source_fetched: false,
    release_deploy_publish_executed: false,
  };
}

function extractManifestCandidate(input: unknown): unknown {
  if (!isRecord(input)) return input;
  if (isRecord(input.input)) return extractManifestCandidate(input.input);
  if (isRecord(input.manifest)) return input.manifest;
  if (isRecord(input.local_data_export_manifest)) return input.local_data_export_manifest;
  if (isRecord(input.manifest_candidate)) return input.manifest_candidate;
  return input;
}

function resolveSupplement(
  input: unknown,
  explicitSupplement: GitLedgerExportFromLocalManifestSupplementV01,
): Required<GitLedgerExportFromLocalManifestSupplementV01> {
  const root = isRecord(input) ? input : {};
  const nested = isRecord(root.supplement) ? root.supplement : {};
  const manifest = extractManifestCandidate(input);
  const manifestRecord = isRecord(manifest) ? manifest : {};
  const manifestId = normalizeOptionalString(manifestRecord.manifest_id);
  const createdAt =
    explicitSupplement.created_at ??
    normalizeOptionalString(nested.created_at) ??
    normalizeOptionalString(root.created_at) ??
    normalizeOptionalString(manifestRecord.created_at) ??
    defaultCreatedAt;
  const packetIntent =
    explicitSupplement.packet_intent ??
    normalizeOptionalString(nested.packet_intent) ??
    normalizeOptionalString(root.packet_intent) ??
    "Bind local export manifest candidate into Git Ledger packet candidate.";
  return {
    packet_title:
      explicitSupplement.packet_title ??
      normalizeOptionalString(nested.packet_title) ??
      normalizeOptionalString(root.packet_title) ??
      `Git Ledger export packet candidate for ${manifestId ?? "local manifest"}`,
    packet_intent: packetIntent,
    suggested_commit_intent:
      explicitSupplement.suggested_commit_intent ??
      normalizeOptionalString(nested.suggested_commit_intent) ??
      normalizeOptionalString(root.suggested_commit_intent) ??
      "Prepare text-only Git Ledger packet candidate for operator review.",
    generated_by:
      explicitSupplement.generated_by ??
      normalizeOptionalString(nested.generated_by) ??
      normalizeOptionalString(root.generated_by) ??
      defaultGeneratedBy,
    created_at: createdAt,
  };
}

function normalizeManifest(value: unknown): NormalizedManifest | null {
  if (!isRecord(value)) return null;
  if (
    value.manifest_version !== LocalDataExportManifestCandidateVersionV01 ||
    value.scope !== LocalDataExportManifestScopeV01
  ) {
    return null;
  }
  const manifestId = normalizeOptionalString(value.manifest_id);
  const manifestFingerprint = normalizeOptionalString(value.manifest_fingerprint);
  const manifestStatus = normalizeManifestStatus(value.manifest_status);
  if (!manifestId || !manifestFingerprint || !manifestStatus) return null;

  return {
    manifest_id: manifestId,
    manifest_fingerprint: manifestFingerprint,
    manifest_status: manifestStatus,
    export_profile: normalizeOptionalString(value.export_profile) ?? "unknown",
    created_at: normalizeOptionalString(value.created_at) ?? defaultCreatedAt,
    source_summary_refs: normalizeList(value.source_summary_refs),
    source_refs: normalizeList(value.source_refs),
    candidate_bundle_refs: normalizeList(value.candidate_bundle_refs),
    dogfooding_record_summary_refs: normalizeList(value.dogfooding_record_summary_refs),
    review_memory_summary_refs: normalizeList(value.review_memory_summary_refs),
    review_memory_proposal_refs: normalizeList(value.review_memory_proposal_refs),
    promotion_decision_refs: normalizeList(value.promotion_decision_refs),
    formation_receipt_refs: normalizeList(value.formation_receipt_refs),
    durable_state_summary_refs: normalizeList(value.durable_state_summary_refs),
    trajectory_refs: normalizeList(value.trajectory_refs),
    feedback_summary_refs: normalizeList(value.feedback_summary_refs),
    runtime_audit_refs: normalizeList(value.runtime_audit_refs),
    git_ledger_packet_refs: normalizeList(value.git_ledger_packet_refs),
    handoff_packet_refs: normalizeList(value.handoff_packet_refs),
    validation_refs: normalizeList(value.validation_refs),
    skipped_check_refs: normalizeList(value.skipped_check_refs),
    known_warning_refs: normalizeList(value.known_warning_refs),
    not_done_refs: normalizeList(value.not_done_refs),
    expected_observed_delta_refs: normalizeList(value.expected_observed_delta_refs),
    export_item_summaries: normalizeItemSummaries(value.export_item_summaries),
    privacy_report: sanitizeValue(value.privacy_report),
    redaction_report: sanitizeValue(value.redaction_report),
    import_preview: sanitizeValue(value.import_preview),
    reason_codes: normalizeList(value.reason_codes),
  };
}

function normalizeItemSummaries(
  value: unknown,
): GitLedgerExportFromLocalManifestItemSummaryV01[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => {
      if (!isRecord(item)) return null;
      const sourceRef =
        normalizeOptionalString(item.source_ref) ??
        normalizeOptionalString(item.item_id) ??
        `manifest-item:${index + 1}`;
      const publicSafeSummary =
        normalizeOptionalString(item.public_safe_summary) ??
        "Manifest item summary remains public-safe reference context only.";
      return {
        item_id:
          normalizeOptionalString(item.item_id) ??
          `manifest-item:${hashSuffix({ sourceRef, publicSafeSummary })}`,
        item_kind: normalizeOptionalString(item.item_kind) ?? "unknown",
        source_ref: sourceRef,
        public_safe_summary: publicSafeSummary,
        reference_only: true,
        candidate_only: true,
        raw_data_included: false,
        proof_or_evidence_created: false,
      };
    })
    .filter((item): item is GitLedgerExportFromLocalManifestItemSummaryV01 =>
      Boolean(item),
    )
    .sort((a, b) => a.item_id.localeCompare(b.item_id));
}

function normalizeManifestStatus(
  value: unknown,
): LocalDataExportManifestStatusV01 | null {
  if (
    value === "candidate_only" ||
    value === "redacted_with_warnings" ||
    value === "blocked_private_or_raw_payload" ||
    value === "blocked_forbidden_authority" ||
    value === "rejected"
  ) {
    return value;
  }
  return null;
}

function isBlockedManifestStatus(
  value: LocalDataExportManifestStatusV01,
): value is "blocked_private_or_raw_payload" | "blocked_forbidden_authority" | "rejected" {
  return (
    value === "blocked_private_or_raw_payload" ||
    value === "blocked_forbidden_authority" ||
    value === "rejected"
  );
}

function mapGitLedgerPacketStatus(
  status: GitLedgerExportPacketV01["status"],
): GitLedgerExportFromLocalManifestStatusV01 {
  if (status === "blocked_private_or_raw_payload") return "blocked_private_or_raw_payload";
  if (status === "blocked_forbidden_authority") return "blocked_forbidden_authority";
  return "rejected";
}

function toRefObjects(values: readonly string[]): Array<{
  ref: string;
  public_safe_summary: string;
}> {
  return uniqueSortedStrings(values).map((ref) => ({
    ref: safeBuilderRef(ref),
    public_safe_summary: "Manifest lineage ref is preserved as reference-only context.",
  }));
}

function safeBuilderRef(ref: string): string {
  if (
    /\bgit\s+(?:commit|push|tag|checkout|branch|merge)\b/i.test(ref) ||
    /\b(?:create|call|merge)\s+(?:pull request|PR|GitHub)\b/i.test(ref) ||
    /\b(?:export|import)\s+file\b/i.test(ref)
  ) {
    return `manifest-boundary-ref:${hashSuffix(ref)}`;
  }
  return ref;
}

function summarizePrivacyReport(value: unknown): unknown {
  if (!isRecord(value)) return null;
  return {
    status: normalizeOptionalString(value.status) ?? "unknown",
    guard_version: normalizeOptionalString(value.guard_version) ?? "unknown",
    subject_ref: normalizeOptionalString(value.subject_ref) ?? "unknown",
    redacted_paths: normalizeList(value.redacted_paths),
    blocked_paths: normalizeList(value.blocked_paths),
    reason_codes: normalizeList(value.reason_codes),
    public_safe_summary: "Privacy report is preserved as public-safe summary context only.",
  };
}

function publicSafeManifestRef(input: unknown): string | null {
  const manifest = extractManifestCandidate(input);
  if (!isRecord(manifest)) return null;
  return normalizeOptionalString(manifest.manifest_id);
}

function publicSafeManifestFingerprint(input: unknown): string | null {
  const manifest = extractManifestCandidate(input);
  if (!isRecord(manifest)) return null;
  return normalizeOptionalString(manifest.manifest_fingerprint);
}

function hasPrivateBlockingFinding(report: PrivacyRedactionRuntimeGuardReport): boolean {
  return report.findings.some((finding) =>
    finding.reason_codes.some((reasonCode) => privateBlockReasonCodes.has(reasonCode)),
  );
}

function detectForbiddenAuthority(input: unknown): boolean {
  let blocked = false;
  visitValue(input, "input", (_path, value, key) => {
    if (blocked) return;
    if (key && isForbiddenAuthorityField(key, value)) {
      blocked = true;
      return;
    }
    if (typeof value !== "string") return;
    blocked = forbiddenAuthorityPhrasePatterns.some((pattern) => {
      pattern.lastIndex = 0;
      return pattern.test(value);
    });
  });
  return blocked;
}

function isForbiddenAuthorityField(key: string, value: unknown): boolean {
  if (value === false || value === null || value === undefined) return false;
  const lower = key.toLowerCase();
  if (allowedAuthorityTrueFields.has(lower)) return false;
  return (
    forbiddenAuthorityFieldSet.has(lower) ||
    lower.endsWith("_authority") ||
    lower.endsWith("_authority_now") ||
    lower.endsWith("_write_now") ||
    lower.endsWith("_read_now") ||
    lower.endsWith("_call_now") ||
    lower.endsWith("_execution_now") ||
    lower.endsWith("_apply_now") ||
    lower.endsWith("_is_truth") ||
    lower.endsWith("_is_proof") ||
    lower.endsWith("_is_approval")
  );
}

function stripAllowedAuthorityTrueFieldsForPrivacyScan(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stripAllowedAuthorityTrueFieldsForPrivacyScan(item));
  }
  if (!isRecord(value)) return value;
  return Object.keys(value)
    .sort()
    .reduce<JsonRecord>((acc, key) => {
      const child = value[key];
      if (
        allowedAuthorityTrueFields.has(key.toLowerCase()) &&
        (child === true || child === false)
      ) {
        acc[key] = false;
        return acc;
      }
      acc[key] = stripAllowedAuthorityTrueFieldsForPrivacyScan(child);
      return acc;
    }, {});
}

function blockedPrivacySummary(
  report: PrivacyRedactionRuntimeGuardReport,
  publicSafeSummary: string,
): unknown {
  return {
    guard_version: report.guard_version,
    scope: report.scope,
    status: "blocked_forbidden_authority",
    subject_ref: "git-ledger-export-from-local-manifest:blocked",
    findings: report.findings.map((finding) => ({
      finding_id: finding.finding_id,
      path: finding.path,
      finding_kind: finding.finding_kind,
      severity: finding.severity,
      action: "blocked",
      reason_codes: uniqueSortedStrings([
        ...finding.reason_codes,
        "authority_escalation_blocked",
      ]),
      public_safe_summary: "Forbidden authority claim was blocked.",
      original_value_included: false,
    })),
    blocked_paths: report.blocked_paths,
    redacted_paths: report.redacted_paths,
    reason_codes: uniqueSortedStrings([
      ...report.reason_codes,
      "authority_escalation_blocked",
    ]),
    public_safe_summary: publicSafeSummary,
    original_values_included: false,
  };
}

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (!isRecord(value)) return value;
  return Object.keys(value)
    .sort()
    .reduce<JsonRecord>((acc, key) => {
      acc[key] = sanitizeValue(value[key]);
      return acc;
    }, {});
}

function normalizeList(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return uniqueSortedStrings(value.map(normalizeString));
  return uniqueSortedStrings([normalizeString(value)]);
}

function normalizeOptionalString(value: unknown): string | null {
  const normalized = normalizeString(value);
  return normalized.length > 0 ? normalized : null;
}

function normalizeString(value: unknown): string {
  if (typeof value === "string") return clampText(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null || value === undefined) return "";
  return clampText(canonicalJson(value));
}

function clampText(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= 520) return normalized;
  return `${normalized.slice(0, 517).trimEnd()}...`;
}

function uniqueSortedStrings(values: readonly string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort();
}

function hashSuffix(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex").slice(0, 20);
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(sortJson(value));
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => sortJson(item));
  if (!isRecord(value)) return value;
  return Object.keys(value)
    .sort()
    .reduce<JsonRecord>((acc, key) => {
      acc[key] = sortJson(value[key]);
      return acc;
    }, {});
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
  if (!isRecord(value)) return;
  for (const childKey of Object.keys(value).sort()) {
    visitValue(value[childKey], `${path}.${childKey}`, visitor, childKey);
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

void GitLedgerExportFromLocalManifestSliceV01;
void GitLedgerExportFromLocalManifestNextSliceV01;
