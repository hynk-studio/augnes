import { createHash } from "node:crypto";

import {
  PRIVACY_REDACTION_RUNTIME_GUARD_VERSION,
  buildPrivacyRedactionRuntimeGuardReportV01,
  createPrivacyRedactionRuntimeGuardAuthorityBoundaryV01,
  createPrivacyRedactionRuntimeGuardFingerprintV01,
  type PrivacyRedactionRuntimeGuardFinding,
  type PrivacyRedactionRuntimeGuardReport,
} from "../privacy/redaction-guard";
import {
  LocalDataExportManifestBuilderVersionV01,
  LocalDataExportManifestCandidateVersionV01,
  LocalDataExportManifestItemKindsV01,
  LocalDataExportManifestNextSliceV01,
  LocalDataExportManifestProfilesV01,
  LocalDataExportManifestScopeV01,
  LocalDataExportManifestSliceV01,
  type LocalDataExportManifestAuthorityBoundaryV01,
  type LocalDataExportManifestBuildResultV01,
  type LocalDataExportManifestCandidateV01,
  type LocalDataExportManifestItemKindV01,
  type LocalDataExportManifestItemSummaryV01,
  type LocalDataExportManifestProfileV01,
  type LocalDataExportManifestStatusV01,
} from "../../types/local-data-export-manifest";

type JsonRecord = Record<string, unknown>;

type NormalizedManifestInput = {
  manifest_id: string | null;
  created_at: string | null;
  export_profile: LocalDataExportManifestProfileV01;
  refs: Record<LocalDataExportManifestItemKindV01, string[]>;
  summaries: Record<LocalDataExportManifestItemKindV01, string[]>;
  reason_codes: string[];
};

const defaultCreatedAt = "1970-01-01T00:00:00.000Z" as const;
const defaultProfile =
  "operator_review_bundle" as const satisfies LocalDataExportManifestProfileV01;

const fieldNamesByItemKind = {
  source_summary_ref: ["source_summary_refs", "source_summaries"],
  dogfooding_record_summary: [
    "dogfooding_record_summary_refs",
    "dogfooding_record_summaries",
    "dogfooding_records",
  ],
  review_memory_summary: [
    "review_memory_summary_refs",
    "review_memory_summaries",
    "review_memory_records",
  ],
  review_memory_proposal: [
    "review_memory_proposal_refs",
    "review_memory_proposals",
    "proposal_refs",
  ],
  source_ref: ["source_refs"],
  candidate_bundle_ref: ["candidate_bundle_refs", "candidate_bundles"],
  promotion_decision_ref: ["promotion_decision_refs", "promotion_decisions"],
  formation_receipt_ref: ["formation_receipt_refs", "formation_receipts"],
  durable_state_summary_ref: [
    "durable_state_summary_refs",
    "durable_state_summaries",
  ],
  trajectory_ref: ["trajectory_refs", "trajectory_summaries"],
  feedback_summary_ref: ["feedback_summary_refs", "feedback_summaries"],
  runtime_audit_ref: ["runtime_audit_refs", "runtime_audit_summaries"],
  git_ledger_packet_ref: ["git_ledger_packet_refs", "git_ledger_packets"],
  handoff_packet_ref: ["handoff_packet_refs", "handoff_packets"],
  validation_ref: ["validation_refs", "validation_summaries"],
  skipped_check_ref: ["skipped_check_refs", "skipped_checks"],
  known_warning_ref: ["known_warning_refs", "known_warnings"],
  not_done_ref: ["not_done_refs", "not_done_items"],
  expected_observed_delta_ref: [
    "expected_observed_delta_refs",
    "expected_observed_deltas",
    "expected_observed_delta",
  ],
} as const satisfies Record<LocalDataExportManifestItemKindV01, readonly string[]>;

const profileItemOrder: Record<
  LocalDataExportManifestProfileV01,
  readonly LocalDataExportManifestItemKindV01[]
> = {
  operator_review_bundle: [
    "source_summary_ref",
    "review_memory_summary",
    "review_memory_proposal",
    "dogfooding_record_summary",
    "validation_ref",
    "skipped_check_ref",
    "known_warning_ref",
    "not_done_ref",
    "expected_observed_delta_ref",
    "source_ref",
    "handoff_packet_ref",
    "runtime_audit_ref",
    "candidate_bundle_ref",
    "promotion_decision_ref",
    "formation_receipt_ref",
    "durable_state_summary_ref",
    "trajectory_ref",
    "feedback_summary_ref",
    "git_ledger_packet_ref",
  ],
  dogfooding_memory_bundle: [
    "dogfooding_record_summary",
    "review_memory_proposal",
    "review_memory_summary",
    "handoff_packet_ref",
    "validation_ref",
    "skipped_check_ref",
    "known_warning_ref",
    "not_done_ref",
    "expected_observed_delta_ref",
    "source_summary_ref",
    "source_ref",
    "candidate_bundle_ref",
    "runtime_audit_ref",
    "feedback_summary_ref",
    "trajectory_ref",
    "promotion_decision_ref",
    "formation_receipt_ref",
    "durable_state_summary_ref",
    "git_ledger_packet_ref",
  ],
  handoff_context_bundle: [
    "handoff_packet_ref",
    "dogfooding_record_summary",
    "source_summary_ref",
    "source_ref",
    "validation_ref",
    "skipped_check_ref",
    "known_warning_ref",
    "not_done_ref",
    "expected_observed_delta_ref",
    "review_memory_proposal",
    "review_memory_summary",
    "candidate_bundle_ref",
    "runtime_audit_ref",
    "feedback_summary_ref",
    "trajectory_ref",
    "promotion_decision_ref",
    "formation_receipt_ref",
    "durable_state_summary_ref",
    "git_ledger_packet_ref",
  ],
  review_proposal_bundle: [
    "review_memory_proposal",
    "review_memory_summary",
    "dogfooding_record_summary",
    "source_summary_ref",
    "source_ref",
    "validation_ref",
    "skipped_check_ref",
    "known_warning_ref",
    "not_done_ref",
    "expected_observed_delta_ref",
    "handoff_packet_ref",
    "candidate_bundle_ref",
    "runtime_audit_ref",
    "feedback_summary_ref",
    "trajectory_ref",
    "promotion_decision_ref",
    "formation_receipt_ref",
    "durable_state_summary_ref",
    "git_ledger_packet_ref",
  ],
  audit_readiness_bundle: [
    "runtime_audit_ref",
    "validation_ref",
    "skipped_check_ref",
    "known_warning_ref",
    "not_done_ref",
    "expected_observed_delta_ref",
    "source_summary_ref",
    "source_ref",
    "dogfooding_record_summary",
    "review_memory_summary",
    "review_memory_proposal",
    "handoff_packet_ref",
    "candidate_bundle_ref",
    "feedback_summary_ref",
    "trajectory_ref",
    "promotion_decision_ref",
    "formation_receipt_ref",
    "durable_state_summary_ref",
    "git_ledger_packet_ref",
  ],
  release_readiness_bundle: [
    "validation_ref",
    "skipped_check_ref",
    "known_warning_ref",
    "not_done_ref",
    "expected_observed_delta_ref",
    "promotion_decision_ref",
    "formation_receipt_ref",
    "durable_state_summary_ref",
    "runtime_audit_ref",
    "git_ledger_packet_ref",
    "source_summary_ref",
    "source_ref",
    "handoff_packet_ref",
    "review_memory_summary",
    "review_memory_proposal",
    "dogfooding_record_summary",
    "candidate_bundle_ref",
    "feedback_summary_ref",
    "trajectory_ref",
  ],
  minimal_public_safe_bundle: [
    "source_summary_ref",
    "source_ref",
    "dogfooding_record_summary",
    "review_memory_proposal",
    "handoff_packet_ref",
    "validation_ref",
    "skipped_check_ref",
    "known_warning_ref",
    "not_done_ref",
    "expected_observed_delta_ref",
    "review_memory_summary",
    "candidate_bundle_ref",
    "runtime_audit_ref",
    "feedback_summary_ref",
    "trajectory_ref",
    "promotion_decision_ref",
    "formation_receipt_ref",
    "durable_state_summary_ref",
    "git_ledger_packet_ref",
  ],
};

const defaultForbiddenCapabilities = [
  "Local export manifest candidate only.",
  "UI, route, DB, provider, retrieval, source-fetch, local file IO, and import apply remain out of scope.",
  "Review Memory, proof/evidence, promotion, Formation Receipt, durable state, and product-write remain out of scope.",
  "Codex, GitHub, Git, release, deploy, and publish execution remain out of scope.",
] as const;

const defaultReasonCodes = [
  "local_data_export_manifest_builder_present",
  "caller_provided_public_safe_summaries_only",
  "candidate_only_manifest",
  "export_file_not_written",
  "import_apply_not_executed",
  "local_file_not_written",
  "local_file_not_read",
  "db_not_read",
  "db_not_written",
  "dogfooding_record_candidate_only",
  "review_memory_summary_reference_only",
  "review_memory_proposal_candidate_only",
  "promotion_decision_ref_reference_only",
  "formation_receipt_ref_reference_only",
  "durable_state_summary_only",
  "git_ledger_packet_ref_reference_only",
  "validation_refs_diagnostic_only",
  "validation_pass_not_approval",
  "validation_failure_not_rejection",
  "smoke_pass_not_evidence",
  "smoke_failure_not_rejection",
  "ci_pass_not_authority",
  "ci_failure_diagnostic_only",
  "skipped_checks_review_context_only",
  "known_warnings_review_context_only",
  "not_done_items_next_task_cues_only",
  "expected_observed_delta_review_context",
  "manifest_fingerprint_not_proof",
  "manifest_fingerprint_not_approval",
  "manifest_status_not_product_or_release_readiness",
  "product_write_denied",
  "proof_not_created",
  "evidence_not_created",
  "claim_evidence_not_written",
  "review_memory_not_written",
  "promotion_not_executed",
  "formation_receipt_not_written",
  "durable_state_not_applied",
  "provider_call_not_executed",
  "retrieval_not_executed",
  "source_fetch_not_executed",
  "git_github_not_executed",
  "release_not_executed",
  "next_slice_is_cue_not_execution_approval",
] as const;

const allowedInputAuthorityTrueFields = new Set([
  "local_data_export_import_policy_now",
  "contract_only",
  "caller_provided_policy_only",
  "privacy_guard_required_for_future_runtime",
  "candidate_only",
  "public_safe",
  "public_safe_summary_only",
  "reference_only",
  "candidate_only_manifest",
  "caller_provided_public_safe_summaries_only",
  "review_memory_summaries_are_reference_only",
  "review_memory_proposals_are_candidate_only",
  "promotion_decision_refs_are_reference_only",
  "formation_receipt_refs_are_reference_only",
  "durable_state_summaries_are_summaries_only",
  "git_ledger_packet_refs_are_reference_only",
]);

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

const forbiddenAuthorityFieldSet = new Set([
  "local_export_runtime_now",
  "local_import_runtime_now",
  "file_write_now",
  "file_read_now",
  "local_file_write_now",
  "local_file_read_now",
  "db_query_or_write_now",
  "db_read_now",
  "db_write_now",
  "route_now",
  "ui_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "source_fetch_now",
  "retrieval_execution_now",
  "retrieval_index_write_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "review_memory_write_now",
  "promotion_execution_now",
  "promotion_decision_record_write_now",
  "formation_receipt_write_now",
  "durable_state_write_now",
  "durable_state_apply_now",
  "git_ledger_export_runtime_now",
  "git_write_now",
  "github_api_call_now",
  "github_git_actuation_now",
  "release_deploy_publish_now",
  "product_write_now",
  "product_id_allocation_now",
  "import_apply_executed",
  "export_file_written",
  "import_auto_apply_now",
  "import_auto_promote_now",
  "import_auto_product_write_now",
  "source_of_truth",
  "proof_or_evidence_record",
  "product_write_authority",
  "codex_execution_authority",
  "github_automation_authority",
]);

const forbiddenAuthorityPhrasePatterns = [
  /\blocal data export manifest\s+(?:is|=|as)\s+(?!not\b)(?:export file|file write approval|import approval|truth|proof|accepted evidence|evidence|authority|approval|product readiness|release readiness)\b/i,
  /\bexport item summary\s+(?:is|=|as)\s+(?!not\b)(?:raw data|canonical source body|truth|proof|accepted evidence|authority)\b/i,
  /\bimport preview\s+(?:is|=|as)\s+(?!not\b)(?:import apply|import approval|execution approval|approval|authority)\b/i,
  /\bmanifest fingerprint\s+(?:is|=|as)\s+(?!not\b)(?:proof|approval|authority|truth|accepted evidence)\b/i,
  /\bmanifest status\s+(?:is|=|as)\s+(?!not\b)(?:product readiness|release readiness|approval|authority)\b/i,
  /\breview memory summaries?\s+(?:is|are|=|as)\s+(?!not\b)(?:proof|truth|accepted evidence|authority|saved state)\b/i,
  /\breview memory proposals?\s+(?:is|are|=|as)\s+(?!not\b)(?:saved memory|review memory write|proof|truth|authority|approval)\b/i,
  /\bpromotion decision refs?\s+(?:is|are|=|as)\s+(?!not\b)(?:promotion execution|approval|authority|truth|proof)\b/i,
  /\bformation receipt refs?\s+(?:is|are|=|as)\s+(?!not\b)(?:receipt write|approval|authority|truth|proof)\b/i,
  /\bdurable state summaries?\s+(?:is|are|=|as)\s+(?!not\b)(?:state apply|saved state|truth|proof|authority)\b/i,
  /\bgit ledger packet refs?\s+(?:is|are|=|as)\s+(?!not\b)(?:git write authority|git write|authority|approval|proof)\b/i,
  /\bvalidation pass\s+(?:is|=|as)\s+(?!not\b)(?:approval|truth|proof|authority)\b/i,
  /\bvalidation failure\s+(?:is|=|as)\s+(?!not\b)(?:rejection|automatic rejection|truth|proof|authority)\b/i,
  /\bsmoke pass\s+(?:is|=|as)\s+(?!not\b)(?:accepted evidence|evidence|truth|proof|approval|authority)\b/i,
  /\bsmoke failure\s+(?:is|=|as)\s+(?!not\b)(?:rejection|automatic rejection|authority|approval)\b/i,
  /\bci pass\s+(?:is|=|as)\s+(?!not\b)(?:truth|proof|approval|authority|promotion|merge approval|release approval|product-write authority|durable state)\b/i,
  /\bci failure\s+(?:is|=|as)\s+(?!not\b)(?:rejection|automatic rejection|truth|proof|authority)\b/i,
  /\bskipped checks?\s+(?:is|are|=|as)\s+(?!not\b)(?:automatic failure|failure|rejection|automatic rejection)\b/i,
  /\bknown warnings?\s+(?:is|are|=|as)\s+(?!not\b)(?:automatic rejection|rejection|failure|automatic failure)\b/i,
  /\bnot[-\s]?done items?\s+(?:is|are|=|as)\s+(?!not\b)(?:automatic task creation|task creation|execution approval)\b/i,
  /\bexpected\/observed delta\s+(?:is|=|as)\s+(?!not\b)(?:approval|rejection|authority|proof|evidence)\b/i,
  /\bdogfooding record\s+(?:is|=|as)\s+(?!not\b)(?:truth|proof|authority|approval|source of truth)\b/i,
  /\bhandoff packet\s+(?:is|=|as)\s+(?!not\b)(?:execution approval|truth|proof|accepted evidence|authority|approval)\b/i,
  /\bretrieval (?:result|score)\s+(?:is|=|as)\s+(?!not\b)(?:accepted evidence|evidence|authority|promotion authority|truth score|truth|promotion readiness|approval)\b/i,
  /\bprovider output\s+(?:is|=|as)\s+(?!not\b)(?:truth|proof|accepted evidence|evidence|authority|approval)\b/i,
  /\bfeedback\s+(?:is|=|as)\s+(?!not\b)(?:truth|proof|authority|approval)\b/i,
  /\blayout coordinates?\s+(?:is|are|=|as)\s+(?!not\b)(?:truth|authority|source of truth)\b/i,
  /\bsalience score\s+(?:is|=|as)\s+(?!not\b)(?:truth|truth score|authority|promotion readiness)\b/i,
  /\bgit (?:commit|ref|tag|branch)\s+(?:is|=|as)\s+(?!not\b)(?:approval|authority|durable state|core decision|promotion)\b/i,
  /\bgithub (?:branch|commit|pr)\s+(?:is|=|as)\s+(?!not\b)(?:core decision|automatic execution authority|execution authority|authority)\b/i,
] as const;

export function createLocalDataExportManifestAuthorityBoundaryV01():
  LocalDataExportManifestAuthorityBoundaryV01 {
  return {
    local_data_export_manifest_builder_now: true,
    caller_provided_public_safe_summaries_only: true,
    candidate_only_manifest: true,
    export_file_written: false,
    import_apply_executed: false,
    local_file_write_now: false,
    local_file_read_now: false,
    db_read_now: false,
    db_write_now: false,
    route_now: false,
    ui_now: false,
    component_now: false,
    cockpit_change_now: false,
    public_surface_change_now: false,
    route_model_change_now: false,
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
    durable_state_write_now: false,
    durable_state_apply_now: false,
    product_write_now: false,
    product_id_allocation_now: false,
    codex_execution_from_augnes_runtime_now: false,
    github_api_call_now: false,
    git_write_now: false,
    github_git_actuation_now: false,
    release_deploy_publish_now: false,
    import_auto_apply_now: false,
    import_auto_promote_now: false,
    import_auto_product_write_now: false,
    local_data_export_manifest_is_export_file: false,
    local_data_export_manifest_is_file_write_approval: false,
    local_data_export_manifest_is_import_approval: false,
    local_data_export_manifest_is_truth: false,
    local_data_export_manifest_is_proof: false,
    local_data_export_manifest_is_accepted_evidence: false,
    export_item_summary_is_raw_data: false,
    export_item_summary_is_canonical_source_body: false,
    import_preview_is_import_apply: false,
    manifest_fingerprint_is_proof: false,
    manifest_fingerprint_is_approval: false,
    manifest_status_is_product_readiness: false,
    manifest_status_is_release_readiness: false,
    review_memory_summaries_are_reference_only: true,
    review_memory_proposals_are_candidate_only: true,
    promotion_decision_refs_are_reference_only: true,
    formation_receipt_refs_are_reference_only: true,
    durable_state_summaries_are_summaries_only: true,
    git_ledger_packet_refs_are_reference_only: true,
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
  };
}

export function buildLocalDataExportManifestCandidateV01(
  input: unknown,
  profileOverride?: LocalDataExportManifestProfileV01,
): LocalDataExportManifestBuildResultV01 {
  const authorityBoundary = createLocalDataExportManifestAuthorityBoundaryV01();
  const profile = resolveProfile(input, profileOverride);
  const privacyScanInput = stripAllowedAuthorityTrueFieldsForPrivacyScan(input);
  const privacyReport = buildPrivacyRedactionRuntimeGuardReportV01(privacyScanInput);
  const privateBlocked = hasPrivateBlockingFinding(privacyReport);

  if (privacyReport.status === "blocked_forbidden_authority" || privateBlocked) {
    return result({
      status:
        privacyReport.status === "blocked_forbidden_authority"
          ? "blocked_forbidden_authority"
          : "blocked_private_or_raw_payload",
      profile,
      manifest: null,
      sourceSummaryRefs: [],
      privacyReport,
      authorityBoundary,
      reasonCodes: [
        ...defaultReasonCodes,
        privacyReport.status === "blocked_forbidden_authority"
          ? "forbidden_authority_blocked"
          : "raw_private_payload_blocked",
      ],
    });
  }

  if (
    privacyReport.status !== "passed" &&
    privacyReport.status !== "redacted_with_warnings"
  ) {
    return result({
      status: "blocked_private_or_raw_payload",
      profile,
      manifest: null,
      sourceSummaryRefs: [],
      privacyReport,
      authorityBoundary,
      reasonCodes: [...defaultReasonCodes, "raw_private_payload_blocked"],
    });
  }

  const authorityFindings = detectForbiddenAuthorityFindings(input);
  if (authorityFindings.length > 0) {
    return result({
      status: "blocked_forbidden_authority",
      profile,
      manifest: null,
      sourceSummaryRefs: collectSourceSummaryRefs(
        buildForbiddenAuthorityRedactedPreview(input),
      ),
      privacyReport: buildForbiddenAuthorityReport(input, authorityFindings),
      authorityBoundary,
      reasonCodes: [...defaultReasonCodes, "forbidden_authority_blocked"],
    });
  }

  const normalizedSource =
    privacyReport.status === "redacted_with_warnings"
      ? privacyReport.redacted_preview
      : input;
  const normalized = normalizeManifestInput(normalizedSource, profile);
  if (!normalized) {
    return result({
      status: "rejected",
      profile,
      manifest: null,
      sourceSummaryRefs: [],
      privacyReport,
      authorityBoundary,
      reasonCodes: [...defaultReasonCodes, "invalid_manifest_input_rejected"],
    });
  }

  const manifest = buildManifest(normalized, privacyReport, authorityBoundary);
  return result({
    status: manifest.manifest_status,
    profile,
    manifest,
    sourceSummaryRefs: manifest.source_summary_refs,
    privacyReport,
    authorityBoundary,
    reasonCodes: manifest.reason_codes,
  });
}

export function buildLocalDataExportManifestV01(
  input: unknown,
  profileOverride?: LocalDataExportManifestProfileV01,
): LocalDataExportManifestBuildResultV01 {
  return buildLocalDataExportManifestCandidateV01(input, profileOverride);
}

function result({
  status,
  profile,
  manifest,
  sourceSummaryRefs,
  privacyReport,
  authorityBoundary,
  reasonCodes,
}: {
  status: LocalDataExportManifestStatusV01;
  profile: LocalDataExportManifestProfileV01;
  manifest: LocalDataExportManifestCandidateV01 | null;
  sourceSummaryRefs: string[];
  privacyReport: unknown;
  authorityBoundary: LocalDataExportManifestAuthorityBoundaryV01;
  reasonCodes: readonly string[];
}): LocalDataExportManifestBuildResultV01 {
  return {
    ok: status === "candidate_only" || status === "redacted_with_warnings",
    status,
    error_code:
      status === "candidate_only" || status === "redacted_with_warnings"
        ? null
        : status,
    manifest,
    export_profile: profile,
    source_summary_refs: uniqueSortedStrings(sourceSummaryRefs),
    reason_codes: uniqueSortedStrings(reasonCodes),
    privacy_report: privacyReport,
    authority_boundary: authorityBoundary,
    export_file_written: false,
    import_apply_executed: false,
    local_file_written: false,
    local_file_read: false,
    db_read_executed: false,
    db_write_executed: false,
    product_write_executed: false,
    review_memory_written: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    promotion_executed: false,
    formation_receipt_written: false,
    durable_state_applied: false,
    github_git_actuated: false,
    provider_called: false,
    retrieval_executed: false,
    source_fetched: false,
    release_deploy_publish_executed: false,
  };
}

function buildManifest(
  normalized: NormalizedManifestInput,
  privacyReport: PrivacyRedactionRuntimeGuardReport,
  authorityBoundary: LocalDataExportManifestAuthorityBoundaryV01,
): LocalDataExportManifestCandidateV01 {
  const itemSummaries = buildItemSummaries(normalized);
  const manifestStatus =
    privacyReport.status === "redacted_with_warnings"
      ? "redacted_with_warnings"
      : "candidate_only";
  const sourceSummaryRefs = refsFor(normalized, "source_summary_ref");
  const manifestId =
    normalized.manifest_id ??
    `local-data-export-manifest:${normalized.export_profile}:${hashSuffix({
      profile: normalized.export_profile,
      refs: normalized.refs,
      summaries: itemSummaries.map((item) => [
        item.item_kind,
        item.source_ref,
        item.public_safe_summary,
      ]),
    })}`;
  const reasonCodes = uniqueSortedStrings([
    ...defaultReasonCodes,
    ...normalized.reason_codes,
    manifestStatus === "redacted_with_warnings"
      ? "redacted_with_warnings_reference_only"
      : "privacy_guard_passed",
    "import_preview_not_import_apply",
    "local_export_manifest_not_export_file",
    "export_item_summary_not_raw_data",
  ]);
  const manifestWithoutFingerprint: Omit<
    LocalDataExportManifestCandidateV01,
    "manifest_fingerprint"
  > = {
    manifest_id: manifestId,
    manifest_version: LocalDataExportManifestCandidateVersionV01,
    builder_version: LocalDataExportManifestBuilderVersionV01,
    scope: LocalDataExportManifestScopeV01,
    created_at: normalized.created_at ?? defaultCreatedAt,
    manifest_status: manifestStatus,
    export_profile: normalized.export_profile,
    source_summary_refs: sourceSummaryRefs,
    dogfooding_record_summary_refs: refsFor(
      normalized,
      "dogfooding_record_summary",
    ),
    review_memory_summary_refs: refsFor(normalized, "review_memory_summary"),
    review_memory_proposal_refs: refsFor(normalized, "review_memory_proposal"),
    source_refs: refsFor(normalized, "source_ref"),
    candidate_bundle_refs: refsFor(normalized, "candidate_bundle_ref"),
    promotion_decision_refs: refsFor(normalized, "promotion_decision_ref"),
    formation_receipt_refs: refsFor(normalized, "formation_receipt_ref"),
    durable_state_summary_refs: refsFor(normalized, "durable_state_summary_ref"),
    trajectory_refs: refsFor(normalized, "trajectory_ref"),
    feedback_summary_refs: refsFor(normalized, "feedback_summary_ref"),
    runtime_audit_refs: refsFor(normalized, "runtime_audit_ref"),
    git_ledger_packet_refs: refsFor(normalized, "git_ledger_packet_ref"),
    handoff_packet_refs: refsFor(normalized, "handoff_packet_ref"),
    validation_refs: refsFor(normalized, "validation_ref"),
    skipped_check_refs: refsFor(normalized, "skipped_check_ref"),
    known_warning_refs: refsFor(normalized, "known_warning_ref"),
    not_done_refs: refsFor(normalized, "not_done_ref"),
    expected_observed_delta_refs: refsFor(
      normalized,
      "expected_observed_delta_ref",
    ),
    export_item_summaries: itemSummaries,
    redaction_report: {
      redaction_status:
        manifestStatus === "redacted_with_warnings"
          ? "redacted_with_warnings"
          : "passed",
      unsafe_raw_values_included: false,
      reference_only_paths: uniqueSortedStrings(
        privacyReport.findings
          .filter((finding) => finding.action === "reference_only")
          .map((finding) => finding.path),
      ),
      redacted_paths: privacyReport.redacted_paths,
      blocked_paths: privacyReport.blocked_paths,
      reason_codes: privacyReport.reason_codes,
      public_safe_summary:
        manifestStatus === "redacted_with_warnings"
          ? "Reference-only or redacted values were preserved without unsafe raw value echo."
          : "Privacy guard passed with public-safe summaries only.",
    },
    privacy_report: privacyReport,
    authority_boundary: authorityBoundary,
    forbidden_capabilities: [...defaultForbiddenCapabilities],
    import_preview: {
      preview_kind: "local_data_import_preview_candidate_only",
      preview_only: true,
      import_apply_executed: false,
      import_approval_granted: false,
      auto_promote_executed: false,
      auto_product_write_executed: false,
      candidate_section_refs: itemSummaries.map((item) => item.item_id),
      boundary_notes: [
        "Import preview is not import apply.",
        "Local export manifest is not export file or import approval.",
      ],
    },
    export_file_written: false,
    import_apply_executed: false,
    reason_codes: reasonCodes,
  };
  return {
    ...manifestWithoutFingerprint,
    manifest_fingerprint: createLocalDataExportManifestFingerprintV01(
      manifestWithoutFingerprint,
    ),
  };
}

export function createLocalDataExportManifestFingerprintV01(value: unknown): string {
  const valueForHash = cloneJson(value);
  if (isRecord(valueForHash)) {
    delete valueForHash.manifest_fingerprint;
  }
  return createHash("sha256").update(canonicalJson(valueForHash)).digest("hex");
}

function buildItemSummaries(
  normalized: NormalizedManifestInput,
): LocalDataExportManifestItemSummaryV01[] {
  const summaries: LocalDataExportManifestItemSummaryV01[] = [];
  const orderedKinds = profileItemOrder[normalized.export_profile];
  for (const itemKind of orderedKinds) {
    const refs = refsFor(normalized, itemKind);
    const summaryValues = normalized.summaries[itemKind] ?? [];
    refs.forEach((sourceRef, index) => {
      const publicSafeSummary =
        summaryValues[index] ??
        summaryValues[0] ??
        defaultSummaryForItemKind(itemKind, sourceRef);
      summaries.push({
        item_id: `local-data-export-item:${itemKind}:${hashSuffix({
          itemKind,
          sourceRef,
          publicSafeSummary,
        })}`,
        item_kind: itemKind,
        export_profile: normalized.export_profile,
        source_ref: sourceRef,
        public_safe_summary: publicSafeSummary,
        reference_only: true,
        candidate_only: true,
        raw_data_included: false,
        canonical_source_body_included: false,
        proof_or_evidence_created: false,
        reason_codes: reasonCodesForItemKind(itemKind),
      });
    });
  }
  return summaries;
}

function normalizeManifestInput(
  input: unknown,
  profile: LocalDataExportManifestProfileV01,
): NormalizedManifestInput | null {
  if (!isRecord(input)) return null;
  const refs = emptyKindRecord();
  const summaries = emptyKindRecord();
  for (const itemKind of LocalDataExportManifestItemKindsV01) {
    for (const fieldName of fieldNamesByItemKind[itemKind]) {
      const extracted = normalizeSummaryEntries(input[fieldName]);
      refs[itemKind].push(...extracted.refs);
      summaries[itemKind].push(...extracted.summaries);
    }
  }
  for (const itemKind of LocalDataExportManifestItemKindsV01) {
    refs[itemKind] = uniqueSortedStrings(refs[itemKind]);
    summaries[itemKind] = uniqueSortedStrings(summaries[itemKind]);
  }
  const hasAnyRef = LocalDataExportManifestItemKindsV01.some(
    (itemKind) => refs[itemKind].length > 0,
  );
  if (!hasAnyRef) return null;
  return {
    manifest_id: normalizeOptionalString(input.manifest_id),
    created_at: normalizeOptionalString(input.created_at),
    export_profile: profile,
    refs,
    summaries,
    reason_codes: normalizeList(input.reason_codes),
  };
}

function emptyKindRecord(): Record<LocalDataExportManifestItemKindV01, string[]> {
  return LocalDataExportManifestItemKindsV01.reduce(
    (acc, itemKind) => {
      acc[itemKind] = [];
      return acc;
    },
    {} as Record<LocalDataExportManifestItemKindV01, string[]>,
  );
}

function normalizeSummaryEntries(value: unknown): { refs: string[]; summaries: string[] } {
  if (value === undefined || value === null) return { refs: [], summaries: [] };
  if (Array.isArray(value)) {
    return value.reduce(
      (acc, item) => {
        const normalized = normalizeSummaryEntry(item);
        acc.refs.push(...normalized.refs);
        acc.summaries.push(...normalized.summaries);
        return acc;
      },
      { refs: [] as string[], summaries: [] as string[] },
    );
  }
  return normalizeSummaryEntry(value);
}

function normalizeSummaryEntry(value: unknown): { refs: string[]; summaries: string[] } {
  if (!isRecord(value)) {
    const normalized = normalizeOptionalString(value);
    return normalized ? { refs: [normalized], summaries: [] } : { refs: [], summaries: [] };
  }
  const ref =
    normalizeOptionalString(value.ref) ??
    normalizeOptionalString(value.record_id) ??
    normalizeOptionalString(value.proposal_id) ??
    normalizeOptionalString(value.packet_id) ??
    normalizeOptionalString(value.id) ??
    normalizeOptionalString(value.source_ref) ??
    normalizeOptionalString(value.summary_ref);
  const summary =
    normalizeOptionalString(value.public_safe_summary) ??
    normalizeOptionalString(value.normalized_summary) ??
    normalizeOptionalString(value.candidate_review_summary) ??
    normalizeOptionalString(value.summary) ??
    normalizeOptionalString(value.bounded_summary);
  return {
    refs: ref ? [ref] : summary ? [`summary-ref:${hashSuffix(summary)}`] : [],
    summaries: summary ? [summary] : [],
  };
}

function resolveProfile(
  input: unknown,
  profileOverride?: LocalDataExportManifestProfileV01,
): LocalDataExportManifestProfileV01 {
  if (profileOverride && LocalDataExportManifestProfilesV01.includes(profileOverride)) {
    return profileOverride;
  }
  if (isRecord(input) && typeof input.export_profile === "string") {
    const profile = input.export_profile as LocalDataExportManifestProfileV01;
    if (LocalDataExportManifestProfilesV01.includes(profile)) return profile;
  }
  return defaultProfile;
}

function collectSourceSummaryRefs(input: unknown): string[] {
  if (!isRecord(input)) return [];
  const extracted = normalizeSummaryEntries(input.source_summary_refs);
  return uniqueSortedStrings(extracted.refs);
}

function buildForbiddenAuthorityRedactedPreview(input: unknown): unknown {
  if (!isRecord(input)) return {};
  return redactForbiddenAuthorityValue(input);
}

function redactForbiddenAuthorityValue(value: unknown): unknown {
  if (typeof value === "string") {
    return hasForbiddenAuthorityPhrase(value)
      ? "[BLOCKED:forbidden_authority_claim]"
      : value;
  }
  if (Array.isArray(value)) return value.map(redactForbiddenAuthorityValue);
  if (!isRecord(value)) return value;
  return Object.keys(value)
    .sort()
    .reduce<JsonRecord>((acc, key) => {
      acc[key] = redactForbiddenAuthorityValue(value[key]);
      return acc;
    }, {});
}

function hasForbiddenAuthorityPhrase(value: string): boolean {
  return forbiddenAuthorityPhrasePatterns.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(value);
  });
}

function refsFor(
  normalized: NormalizedManifestInput,
  itemKind: LocalDataExportManifestItemKindV01,
): string[] {
  return uniqueSortedStrings(normalized.refs[itemKind] ?? []);
}

function hasPrivateBlockingFinding(report: PrivacyRedactionRuntimeGuardReport): boolean {
  return report.findings.some((finding) =>
    finding.reason_codes.some((reasonCode) => privateBlockReasonCodes.has(reasonCode)),
  );
}

function detectForbiddenAuthorityFindings(
  input: unknown,
): PrivacyRedactionRuntimeGuardFinding[] {
  const findings: Array<Omit<PrivacyRedactionRuntimeGuardFinding, "finding_id">> = [];
  visitValue(input, "input", (path, value, key) => {
    if (key && isForbiddenAuthorityField(key, value)) {
      findings.push({
        path,
        finding_kind: "forbidden_authority_claim",
        severity: "critical",
        action: "blocked",
        reason_codes: ["authority_escalation_blocked", "public_safe_summary_only"],
        public_safe_summary:
          "Forbidden authority claim was blocked; no raw value included.",
        original_value_included: false,
      });
    }
    if (typeof value !== "string") return;
    for (const pattern of forbiddenAuthorityPhrasePatterns) {
      pattern.lastIndex = 0;
      if (!pattern.test(value)) continue;
      findings.push({
        path,
        finding_kind: "forbidden_authority_phrase",
        severity: "critical",
        action: "blocked",
        reason_codes: ["authority_escalation_blocked", "public_safe_summary_only"],
        public_safe_summary:
          "Forbidden authority phrase was blocked; no raw value included.",
        original_value_included: false,
      });
    }
  });
  return findings.map((finding, index) => ({
    finding_id: `local-data-export-manifest-authority-finding-${String(
      index + 1,
    ).padStart(3, "0")}`,
    ...finding,
  }));
}

function buildForbiddenAuthorityReport(
  input: unknown,
  findings: PrivacyRedactionRuntimeGuardFinding[],
): PrivacyRedactionRuntimeGuardReport {
  const root = isRecord(input) ? input : {};
  const reportWithoutFingerprint: Omit<
    PrivacyRedactionRuntimeGuardReport,
    "guard_fingerprint"
  > = {
    guard_version: PRIVACY_REDACTION_RUNTIME_GUARD_VERSION,
    scope: LocalDataExportManifestScopeV01,
    status: "blocked_forbidden_authority",
    as_of: normalizeOptionalString(root.created_at) ?? defaultCreatedAt,
    subject_ref: "local-data-export-manifest:blocked",
    findings,
    redacted_preview: {
      status: "blocked_forbidden_authority",
      public_safe_summary_only: true,
    },
    blocked_paths: uniqueSortedStrings(findings.map((finding) => finding.path)),
    redacted_paths: [],
    reason_codes: ["authority_escalation_blocked", "public_safe_summary_only"],
    boundary_notes: [
      "Forbidden authority shortcuts are blocked without raw value echo.",
      "Local data export manifests remain candidate-only summaries.",
    ],
    authority_boundary: createPrivacyRedactionRuntimeGuardAuthorityBoundaryV01(),
  };
  return {
    ...reportWithoutFingerprint,
    guard_fingerprint:
      createPrivacyRedactionRuntimeGuardFingerprintV01(reportWithoutFingerprint),
  };
}

function isForbiddenAuthorityField(key: string, value: unknown): boolean {
  if (value === false || value === null || value === undefined) return false;
  const lower = key.toLowerCase();
  if (allowedInputAuthorityTrueFields.has(lower)) return false;
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
    lower.endsWith("_is_approval") ||
    lower.endsWith("_is_rejection")
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
        allowedInputAuthorityTrueFields.has(key.toLowerCase()) &&
        (child === true || child === false)
      ) {
        acc[key] = false;
        return acc;
      }
      acc[key] = stripAllowedAuthorityTrueFieldsForPrivacyScan(child);
      return acc;
    }, {});
}

function reasonCodesForItemKind(itemKind: LocalDataExportManifestItemKindV01): string[] {
  const base = ["reference_only", "candidate_only", "public_safe_summary_only"];
  const byKind: Record<LocalDataExportManifestItemKindV01, string[]> = {
    source_summary_ref: ["source_refs_are_references_only"],
    dogfooding_record_summary: ["dogfooding_record_candidate_only"],
    review_memory_summary: ["review_memory_summary_reference_only"],
    review_memory_proposal: ["review_memory_proposal_candidate_only"],
    source_ref: ["source_refs_are_references_only"],
    candidate_bundle_ref: ["candidate_bundle_ref_reference_only"],
    promotion_decision_ref: ["promotion_decision_ref_reference_only"],
    formation_receipt_ref: ["formation_receipt_ref_reference_only"],
    durable_state_summary_ref: ["durable_state_summary_only"],
    trajectory_ref: ["trajectory_ref_reference_only"],
    feedback_summary_ref: ["feedback_summary_review_context_only"],
    runtime_audit_ref: ["runtime_audit_ref_reference_only"],
    git_ledger_packet_ref: ["git_ledger_packet_ref_reference_only"],
    handoff_packet_ref: ["handoff_packet_candidate_context_only"],
    validation_ref: ["validation_refs_diagnostic_only"],
    skipped_check_ref: ["skipped_checks_review_context_only"],
    known_warning_ref: ["known_warnings_review_context_only"],
    not_done_ref: ["not_done_items_next_task_cues_only"],
    expected_observed_delta_ref: ["expected_observed_delta_review_context"],
  };
  return uniqueSortedStrings([...base, ...byKind[itemKind]]);
}

function defaultSummaryForItemKind(
  itemKind: LocalDataExportManifestItemKindV01,
  sourceRef: string,
): string {
  const label = itemKind.replace(/_/g, " ");
  return `${label} ${sourceRef} is preserved as public-safe reference context only.`;
}

function hashSuffix(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex").slice(0, 16);
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

function visitValue(
  value: unknown,
  path: string,
  visitor: (path: string, value: unknown, key?: string) => void,
  key?: string,
): void {
  visitor(path, value, key);
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      visitValue(item, `${path}[${index}]`, visitor);
    });
    return;
  }
  if (!isRecord(value)) return;
  for (const childKey of Object.keys(value).sort()) {
    visitValue(value[childKey], `${path}.${childKey}`, visitor, childKey);
  }
}

function cloneJson(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value));
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

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

void LocalDataExportManifestNextSliceV01;
