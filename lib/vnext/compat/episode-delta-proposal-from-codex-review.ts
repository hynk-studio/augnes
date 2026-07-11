import type { CodexResultReportIngestionRecordV01 } from "@/lib/dogfooding/codex-result-report-normalizer";
import { createExpectedObservedDeltaPreviewAuthorityBoundaryV01 } from "@/lib/dogfooding/expected-observed-delta-preview";
import { createCandidateIngressAuthorityProfileV01 } from "@/lib/intake/candidate-ingress-normalizer";
import {
  buildEpisodeDeltaProposalV01,
  validateEpisodeDeltaProposalV01,
  type EpisodeDeltaProposalBuilderInputV01,
} from "@/lib/vnext/episode-delta-proposal";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  isProtocolRecordV01,
  parseStrictIsoTimestampV01,
  protocolStringValueV01,
  validateExternalRefStructureV01,
  type ProtocolJsonRecordV01,
} from "@/lib/vnext/protocol-primitives";
import {
  mapCodexResultReportRecordToRunReceiptV01,
  type CodexResultReportRunReceiptMappingResultV01,
} from "@/lib/vnext/compat/run-receipt-from-codex-result-report";
import {
  EXTERNAL_REF_VERSION_V01,
  type ExternalRefTrustClassV01,
  type ExternalRefV01,
} from "@/types/vnext/external-ref";
import {
  EXPECTED_OBSERVED_DELTA_PREVIEW_VERSION,
  type ExpectedObservedDeltaCandidateBuckets,
  type ExpectedObservedDeltaPreview,
} from "@/types/expected-observed-delta-preview";
import type { CandidateIngressNormalizedCandidate } from "@/types/candidate-ingress-normalizer";
import type {
  EpisodeDeltaProposalAttestationV01,
  EpisodeDeltaProposalDeltaTypeV01,
  EpisodeDeltaProposalV01,
  EpisodeDeltaProposalSourceCurrentnessV01,
} from "@/types/vnext/episode-delta-proposal";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";

const COMPATIBILITY_NAMESPACE =
  "augnes.codex-semantic-review-proposal.v0.1";
const PREVIEW_ID_PREFIX = "expected-observed-delta-preview:";
const MAX_SOURCE_COLLECTION_ITEMS = 128;
const MAX_SOURCE_REFS = 64;
const MAX_SOURCE_TEXT = 2000;

const allowedInputKeys = new Set([
  "workspace_id",
  "project_id",
  "run_id",
  "receipt_recorded_at",
  "proposal_created_at",
  "data_classification",
  "source_record",
  "expected_observed_delta_preview",
  "source_currentness",
  "work_ref",
  "task_context_packet_ref",
  "host_ref",
  "worker_ref",
]);
const allowedCurrentnessKeys = new Set(["status", "as_of", "basis"]);
const currentnessValues = new Set<string>([
  "fresh",
  "stale",
  "partial",
  "unknown",
]);
const dataClassifications = new Set<string>([
  "public_safe",
  "private",
  "local_only",
  "secret",
]);
const allowedPreviewRootKeys = new Set([
  "preview_version",
  "scope",
  "as_of",
  "source_refs",
  "delta_preview_status",
  "recommended_next_action",
  "input_summary",
  "expected_summary",
  "observed_summary",
  "delta_candidates",
  "mismatch_summary",
  "requirement_progress_comparison",
  "verification_comparison",
  "non_goal_comparison",
  "evidence_summary",
  "blocked_reasons",
  "insufficient_data_reasons",
  "operator_review_checklist",
  "would_not_write",
  "non_goals",
  "authority_boundary",
]);
const allowedInputSummaryKeys = new Set([
  "has_work_episode_residue_candidate_preview",
  "has_codex_result_report_intake_record_review",
  "has_codex_result_report_intake_preview",
  "has_explicit_expected_material",
  "expected_signal_count",
  "observed_signal_count",
  "delta_candidate_count",
  "blocked_reason_count",
  "insufficient_data_reason_count",
]);
const allowedExpectedSummaryKeys = new Set([
  "expected_file_refs",
  "expected_check_refs",
  "expected_requirement_progress",
  "expected_non_goals",
  "expected_risks",
  "expected_followups",
  "expected_signal_refs",
  "has_explicit_expected_material",
  "derived_expected_signal_count",
]);
const allowedObservedSummaryKeys = new Set([
  "changed_files",
  "passed_or_completed_checks",
  "skipped_or_unverified_checks",
  "not_done_items",
  "requirement_progress",
  "risks",
  "followups",
  "context_reuse_signals",
  "observed_signal_refs",
  "has_observed_material",
]);
const allowedCandidateBucketKeys = new Set([
  "matched_expectation_candidates",
  "missing_expectation_candidates",
  "unexpected_observation_candidates",
  "skipped_or_unverified_check_candidates",
  "not_done_candidates",
  "changed_file_delta_candidates",
  "requirement_progress_delta_candidates",
  "non_goal_risk_candidates",
  "followup_delta_candidates",
  "context_reuse_signal_candidates",
  "review_only_candidates",
]);
const selectableCandidateBucketKeys = [
  "matched_expectation_candidates",
  "missing_expectation_candidates",
  "unexpected_observation_candidates",
  "skipped_or_unverified_check_candidates",
  "not_done_candidates",
  "changed_file_delta_candidates",
  "requirement_progress_delta_candidates",
  "non_goal_risk_candidates",
  "followup_delta_candidates",
  "context_reuse_signal_candidates",
] as const;
const allowedCandidateKeys = new Set([
  "candidate_id",
  "candidate_kind",
  "source_kind",
  "label",
  "summary",
  "source_ref",
  "operator_ref",
  "session_ref",
  "project_ref",
  "work_ref",
  "result_ref",
  "pr_ref",
  "commit_ref",
  "evidence_refs",
  "source_refs",
  "confidence",
  "review_required",
  "candidate_only",
  "persistence_horizon",
  "authority_profile",
]);
const allowedCandidateAuthorityKeys = new Set([
  "source_of_truth",
  "generated_view",
  "candidate_material_only",
  "can_write_memory",
  "can_mutate_perspective",
  "can_mutate_cwp",
  "can_create_handoff",
]);
const allowedMismatchSummaryKeys = new Set([
  "matched_expectation_count",
  "missing_expectation_count",
  "unexpected_observation_count",
  "skipped_or_unverified_check_count",
  "not_done_count",
  "changed_file_delta_count",
  "requirement_progress_delta_count",
  "non_goal_risk_count",
  "followup_delta_count",
  "context_reuse_signal_count",
  "summary",
]);
const allowedRequirementComparisonKeys = new Set([
  "expected_requirement_progress",
  "observed_requirement_progress",
  "requirement_progress_delta_candidates",
  "changed_files_are_not_requirement_completion",
]);
const allowedVerificationComparisonKeys = new Set([
  "expected_checks",
  "passed_or_completed_checks",
  "skipped_or_unverified_checks",
  "skipped_checks_count_as_passed",
]);
const allowedNonGoalComparisonKeys = new Set([
  "expected_non_goals",
  "observed_risks",
  "non_goal_risk_candidates",
]);
const allowedEvidenceSummaryKeys = new Set([
  "has_result_material",
  "has_expected_material",
  "has_observed_material",
  "has_source_refs",
  "has_evidence_refs",
  "source_refs",
  "evidence_refs",
  "missing_evidence",
]);
const candidateKinds = new Set<string>([
  "timeline_event",
  "project_state_summary",
  "decision",
  "requirement",
  "open_question",
  "risk_or_blocker",
  "changed_artifact_ref",
  "evidence_ref",
  "source_ref",
  "next_action",
  "reusable_context",
  "expected_observed_signal",
  "review_only",
]);
const confidenceValues = new Set<string>([
  "explicit",
  "inferred_heuristic",
  "unknown",
]);
const persistenceHorizons = new Set<string>([
  "local_project_candidate_record",
  "review_only",
  "do_not_persist",
]);
const previewStatuses = new Set<string>([
  "no_result_material",
  "insufficient_expected_material",
  "insufficient_observed_material",
  "insufficient_data",
  "delta_candidates_available",
  "ready_for_operator_review",
  "keep_preview_only",
]);
const nextActions = new Set<string>([
  "supply_codex_result_report",
  "supply_expected_material",
  "review_expected_observed_delta_candidates",
  "prepare_expected_observed_delta_decision",
  "keep_preview_only",
  "reject_delta_candidate",
]);

export interface CodexSemanticReviewSourceCurrentnessV01 {
  status: EpisodeDeltaProposalSourceCurrentnessV01;
  as_of: string | null;
  basis: string;
}

export interface CodexReviewEpisodeDeltaProposalInputV01 {
  workspace_id: string;
  project_id: string;
  run_id: string;
  receipt_recorded_at: string;
  proposal_created_at: string;
  data_classification: RunReceiptV01["privacy_egress"]["data_classification"];
  source_record: CodexResultReportIngestionRecordV01;
  expected_observed_delta_preview: ExpectedObservedDeltaPreview;
  source_currentness: CodexSemanticReviewSourceCurrentnessV01;
  work_ref?: ExternalRefV01 | null;
  task_context_packet_ref?: ExternalRefV01 | null;
  host_ref?: ExternalRefV01 | null;
  worker_ref?: ExternalRefV01 | null;
}

export interface CodexReviewEpisodeDeltaProposalIssueV01 {
  severity: "error" | "warning";
  code: string;
  path: string | null;
  message: string;
}

export interface CodexReviewEpisodeDeltaProposalMappingResultV01 {
  status: "mapped" | "invalid" | "blocked";
  receipt: RunReceiptV01 | null;
  proposal: EpisodeDeltaProposalV01 | null;
  errors: CodexReviewEpisodeDeltaProposalIssueV01[];
  warnings: CodexReviewEpisodeDeltaProposalIssueV01[];
  source_record_fingerprint: string | null;
  preview_id: string | null;
  preview_fingerprint: string | null;
}

type Accumulator = {
  errors: CodexReviewEpisodeDeltaProposalIssueV01[];
  warnings: CodexReviewEpisodeDeltaProposalIssueV01[];
  blocked: boolean;
};

type ValidatedInput = {
  input: CodexReviewEpisodeDeltaProposalInputV01;
  previewId: string;
  previewFingerprint: string;
  selectableCandidates: Array<{
    bucket: (typeof selectableCandidateBucketKeys)[number];
    candidate: CandidateIngressNormalizedCandidate;
  }>;
};

export function createExpectedObservedDeltaPreviewFingerprintV01(
  preview: ExpectedObservedDeltaPreview,
): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01(normalizePreviewUnorderedValue(preview)),
  );
}

export function deriveExpectedObservedDeltaPreviewCompatibilityIdV01(
  preview: ExpectedObservedDeltaPreview,
): string {
  const fingerprint = createExpectedObservedDeltaPreviewFingerprintV01(preview);
  return `${PREVIEW_ID_PREFIX}${fingerprint.slice("sha256:".length, 31)}`;
}

export function mapCodexSemanticReviewToEpisodeDeltaProposalV01(
  input: CodexReviewEpisodeDeltaProposalInputV01,
): CodexReviewEpisodeDeltaProposalMappingResultV01;
export function mapCodexSemanticReviewToEpisodeDeltaProposalV01(
  input: unknown,
): CodexReviewEpisodeDeltaProposalMappingResultV01;
export function mapCodexSemanticReviewToEpisodeDeltaProposalV01(
  input: unknown,
): CodexReviewEpisodeDeltaProposalMappingResultV01 {
  const validation = validateMappingInput(input);
  if (!validation.validated) {
    return resultFromAccumulator(validation.accumulator, null, null, null, null);
  }
  const { input: typedInput, previewId, previewFingerprint } =
    validation.validated;
  const receiptMapping = mapCodexResultReportRecordToRunReceiptV01({
    workspace_id: typedInput.workspace_id,
    project_id: typedInput.project_id,
    run_id: typedInput.run_id,
    recorded_at: typedInput.receipt_recorded_at,
    data_classification: typedInput.data_classification,
    source_record: typedInput.source_record,
    work_ref: typedInput.work_ref ?? null,
    task_context_packet_ref: typedInput.task_context_packet_ref ?? null,
    host_ref: typedInput.host_ref ?? null,
    worker_ref: typedInput.worker_ref ?? null,
  });
  if (receiptMapping.status !== "mapped" || !receiptMapping.receipt) {
    return resultFromReceiptFailure(
      validation.accumulator,
      receiptMapping,
      previewId,
      previewFingerprint,
    );
  }
  const receipt = receiptMapping.receipt;
  validateReceiptBinding(typedInput, receipt, validation.accumulator);
  if (validation.accumulator.errors.length > 0) {
    return resultFromAccumulator(
      validation.accumulator,
      receipt,
      null,
      previewId,
      previewFingerprint,
      typedInput.source_record.report_fingerprint,
    );
  }

  let proposal: EpisodeDeltaProposalV01;
  try {
    proposal = buildMappedProposal(
      validation.validated,
      receipt,
    );
  } catch {
    addError(
      validation.accumulator,
      "proposal_mapping_build_failed",
      null,
      "Validated Codex semantic review material could not be normalized safely.",
    );
    return resultFromAccumulator(
      validation.accumulator,
      receipt,
      null,
      previewId,
      previewFingerprint,
      typedInput.source_record.report_fingerprint,
    );
  }
  const proposalValidation = validateEpisodeDeltaProposalV01(proposal);
  if (proposalValidation.status !== "valid") {
    for (const issue of proposalValidation.errors) {
      addError(
        validation.accumulator,
        issue.code,
        issue.path,
        issue.message,
        proposalValidation.status === "blocked",
      );
    }
    validation.accumulator.warnings.push(...proposalValidation.warnings);
    return resultFromAccumulator(
      validation.accumulator,
      receipt,
      null,
      previewId,
      previewFingerprint,
      typedInput.source_record.report_fingerprint,
    );
  }

  return {
    status: "mapped",
    receipt,
    proposal,
    errors: [],
    warnings: [
      ...validation.accumulator.warnings,
      ...receiptMapping.warnings,
      ...proposalValidation.warnings,
    ],
    source_record_fingerprint: typedInput.source_record.report_fingerprint,
    preview_id: previewId,
    preview_fingerprint: previewFingerprint,
  };
}

function validateMappingInput(input: unknown): {
  accumulator: Accumulator;
  validated: ValidatedInput | null;
} {
  const accumulator = createAccumulator();
  if (!isProtocolRecordV01(input)) {
    addError(
      accumulator,
      "mapping_input_not_object",
      "$",
      "Codex semantic review mapping input must be an object.",
    );
    return { accumulator, validated: null };
  }
  rejectUnknownKeys(input, allowedInputKeys, "$", accumulator, "mapping_input_unknown_field");
  for (const field of ["workspace_id", "project_id", "run_id"] as const) {
    requireString(input, field, "$", accumulator);
  }
  requireTimestamp(
    input.receipt_recorded_at,
    "$.receipt_recorded_at",
    accumulator,
  );
  const proposalCreatedAt = requireTimestamp(
    input.proposal_created_at,
    "$.proposal_created_at",
    accumulator,
  );
  if (
    !dataClassifications.has(
      protocolStringValueV01(input.data_classification) ?? "",
    )
  ) {
    addError(
      accumulator,
      "data_classification_invalid",
      "$.data_classification",
      "Expected an explicit RunReceipt v0.1 data classification.",
    );
  }
  for (const field of [
    "work_ref",
    "task_context_packet_ref",
    "host_ref",
    "worker_ref",
  ]) {
    if (input[field] === undefined) continue;
    validateExternalRefStructureV01(
      input[field],
      `$.${field}`,
      issueSink(accumulator),
      true,
    );
  }
  const currentness = validateCurrentness(
    input.source_currentness,
    proposalCreatedAt,
    accumulator,
  );
  const previewValidation = validateExpectedObservedDeltaPreview(
    input.expected_observed_delta_preview,
    accumulator,
  );
  const sourceRecord = isProtocolRecordV01(input.source_record)
    ? (input.source_record as unknown as CodexResultReportIngestionRecordV01)
    : null;
  if (!sourceRecord) {
    addError(
      accumulator,
      "source_record_missing",
      "$.source_record",
      "CodexResultReportIngestionRecordV01 is required.",
    );
  }
  if (sourceRecord && previewValidation.preview) {
    if (previewValidation.preview.scope !== sourceRecord.scope) {
      addError(
        accumulator,
        "preview_source_scope_mismatch",
        "$.expected_observed_delta_preview.scope",
        "Legacy preview scope must match the source record compatibility scope.",
        true,
      );
    }
    const sourceRefs = new Set(previewValidation.preview.source_refs);
    for (const [value, code] of [
      [sourceRecord.report_id, "preview_source_record_id_missing"],
      [
        sourceRecord.report_fingerprint,
        "preview_source_record_fingerprint_missing",
      ],
    ] as const) {
      if (!sourceRefs.has(value)) {
        addError(
          accumulator,
          code,
          "$.expected_observed_delta_preview.source_refs",
          "ExpectedObservedDelta preview must retain the exact source record identity and fingerprint.",
          true,
        );
      }
    }
    if (
      currentness?.as_of !== null &&
      currentness?.as_of !== previewValidation.preview.as_of
    ) {
      addError(
        accumulator,
        "source_currentness_preview_time_mismatch",
        "$.source_currentness.as_of",
        "Explicit source currentness must bind the ExpectedObservedDelta preview as_of value.",
      );
    }
  }
  if (
    accumulator.errors.length > 0 ||
    !sourceRecord ||
    !currentness ||
    !previewValidation.preview
  ) {
    return { accumulator, validated: null };
  }
  const previewFingerprint = createExpectedObservedDeltaPreviewFingerprintV01(
    previewValidation.preview,
  );
  return {
    accumulator,
    validated: {
      input: input as unknown as CodexReviewEpisodeDeltaProposalInputV01,
      previewId: deriveExpectedObservedDeltaPreviewCompatibilityIdV01(
        previewValidation.preview,
      ),
      previewFingerprint,
      selectableCandidates: previewValidation.selectableCandidates,
    },
  };
}

function validateCurrentness(
  value: unknown,
  proposalCreatedAt: number | null,
  accumulator: Accumulator,
): CodexSemanticReviewSourceCurrentnessV01 | null {
  const currentness = recordAt(value, "$.source_currentness", accumulator);
  if (!currentness) return null;
  rejectUnknownKeys(
    currentness,
    allowedCurrentnessKeys,
    "$.source_currentness",
    accumulator,
    "source_currentness_unknown_field",
  );
  const status = protocolStringValueV01(currentness.status);
  if (!status || !currentnessValues.has(status)) {
    addError(
      accumulator,
      "source_currentness_status_invalid",
      "$.source_currentness.status",
      "Expected fresh, stale, partial, or unknown source currentness.",
    );
  }
  const asOf = optionalTimestamp(
    currentness.as_of,
    "$.source_currentness.as_of",
    accumulator,
  );
  const basis = requireString(
    currentness,
    "basis",
    "$.source_currentness",
    accumulator,
  );
  if (status === "unknown" && currentness.as_of !== null) {
    addError(
      accumulator,
      "unknown_currentness_has_time",
      "$.source_currentness.as_of",
      "Unknown currentness must keep as_of null.",
    );
  }
  if (status !== "unknown" && asOf === null) {
    addError(
      accumulator,
      "known_currentness_time_missing",
      "$.source_currentness.as_of",
      "Non-unknown currentness requires an explicit as_of timestamp.",
    );
  }
  if (asOf !== null && proposalCreatedAt !== null && asOf > proposalCreatedAt) {
    addError(
      accumulator,
      "source_currentness_after_proposal",
      "$.source_currentness.as_of",
      "Source currentness cannot postdate proposal creation.",
    );
  }
  if (!status || !currentnessValues.has(status) || !basis) return null;
  return {
    status: status as EpisodeDeltaProposalSourceCurrentnessV01,
    as_of: currentness.as_of === null ? null : protocolStringValueV01(currentness.as_of),
    basis,
  };
}

function validateExpectedObservedDeltaPreview(
  value: unknown,
  accumulator: Accumulator,
): {
  preview: ExpectedObservedDeltaPreview | null;
  selectableCandidates: ValidatedInput["selectableCandidates"];
} {
  scanUnsafeSourceMaterial(value, "$.expected_observed_delta_preview", accumulator);
  const preview = recordAt(
    value,
    "$.expected_observed_delta_preview",
    accumulator,
  );
  if (!preview) return { preview: null, selectableCandidates: [] };
  rejectUnknownKeys(
    preview,
    allowedPreviewRootKeys,
    "$.expected_observed_delta_preview",
    accumulator,
    "preview_unknown_field",
  );
  if (preview.preview_version !== EXPECTED_OBSERVED_DELTA_PREVIEW_VERSION) {
    addError(
      accumulator,
      "preview_version_unsupported",
      "$.expected_observed_delta_preview.preview_version",
      "Expected ExpectedObservedDeltaPreview v0.1.",
      true,
    );
  }
  requireString(
    preview,
    "scope",
    "$.expected_observed_delta_preview",
    accumulator,
  );
  requireTimestamp(
    preview.as_of,
    "$.expected_observed_delta_preview.as_of",
    accumulator,
  );
  const sourceRefs = stringArray(
    preview.source_refs,
    "$.expected_observed_delta_preview.source_refs",
    accumulator,
  );
  if (sourceRefs.length === 0) {
    addError(
      accumulator,
      "preview_source_refs_missing",
      "$.expected_observed_delta_preview.source_refs",
      "ExpectedObservedDelta preview requires source refs.",
    );
  }
  const status = protocolStringValueV01(preview.delta_preview_status);
  if (!status || !previewStatuses.has(status)) {
    addError(
      accumulator,
      "preview_status_invalid",
      "$.expected_observed_delta_preview.delta_preview_status",
      "Expected a known ExpectedObservedDelta preview status.",
    );
  }
  const nextAction = protocolStringValueV01(preview.recommended_next_action);
  if (!nextAction || !nextActions.has(nextAction)) {
    addError(
      accumulator,
      "preview_next_action_invalid",
      "$.expected_observed_delta_preview.recommended_next_action",
      "Expected a known ExpectedObservedDelta preview next action.",
    );
  }

  validateInputSummary(preview.input_summary, accumulator);
  validateStringSummaryObject(
    preview.expected_summary,
    allowedExpectedSummaryKeys,
    "$.expected_observed_delta_preview.expected_summary",
    [
      "expected_file_refs",
      "expected_check_refs",
      "expected_requirement_progress",
      "expected_non_goals",
      "expected_risks",
      "expected_followups",
      "expected_signal_refs",
    ],
    accumulator,
  );
  validateStringSummaryObject(
    preview.observed_summary,
    allowedObservedSummaryKeys,
    "$.expected_observed_delta_preview.observed_summary",
    [
      "changed_files",
      "passed_or_completed_checks",
      "skipped_or_unverified_checks",
      "not_done_items",
      "requirement_progress",
      "risks",
      "followups",
      "context_reuse_signals",
      "observed_signal_refs",
    ],
    accumulator,
  );
  const candidates = validateCandidateBuckets(preview.delta_candidates, accumulator);
  validateComparisonObjects(preview, accumulator);
  validateEvidenceSummary(preview.evidence_summary, accumulator);
  for (const field of [
    "blocked_reasons",
    "insufficient_data_reasons",
    "operator_review_checklist",
    "would_not_write",
    "non_goals",
  ]) {
    stringArray(
      preview[field],
      `$.expected_observed_delta_preview.${field}`,
      accumulator,
    );
  }
  validatePreviewAuthority(preview.authority_boundary, accumulator);

  const blockedReasons = Array.isArray(preview.blocked_reasons)
    ? preview.blocked_reasons
    : [];
  const insufficientReasons = Array.isArray(preview.insufficient_data_reasons)
    ? preview.insufficient_data_reasons
    : [];
  if (blockedReasons.length > 0 || status === "keep_preview_only") {
    addError(
      accumulator,
      "preview_blocked_for_mapping",
      "$.expected_observed_delta_preview.blocked_reasons",
      "Blocked preview material must not produce EpisodeDeltaProposal.",
      true,
    );
  }
  if (
    insufficientReasons.length > 0 ||
    status !== "ready_for_operator_review" ||
    nextAction !== "prepare_expected_observed_delta_decision"
  ) {
    addError(
      accumulator,
      "semantic_material_insufficient",
      "$.expected_observed_delta_preview.delta_preview_status",
      "Only complete review-ready semantic comparison material may map to EpisodeDeltaProposal.",
    );
  }
  if (candidates.length === 0) {
    addError(
      accumulator,
      "semantic_delta_candidates_missing",
      "$.expected_observed_delta_preview.delta_candidates",
      "At least one non-review-only semantic candidate is required.",
    );
  }
  const expectedCount = numberValue(
    isProtocolRecordV01(preview.input_summary)
      ? preview.input_summary.delta_candidate_count
      : null,
  );
  const allCandidateCount = candidates.length + candidateArray(
    isProtocolRecordV01(preview.delta_candidates)
      ? preview.delta_candidates.review_only_candidates
      : null,
  ).length;
  if (expectedCount !== null && expectedCount !== allCandidateCount) {
    addError(
      accumulator,
      "preview_candidate_count_mismatch",
      "$.expected_observed_delta_preview.input_summary.delta_candidate_count",
      "Preview candidate count must match bounded candidate buckets.",
    );
  }
  return {
    preview: preview as unknown as ExpectedObservedDeltaPreview,
    selectableCandidates: candidates,
  };
}

function validateInputSummary(value: unknown, accumulator: Accumulator) {
  const summary = recordAt(
    value,
    "$.expected_observed_delta_preview.input_summary",
    accumulator,
  );
  if (!summary) return;
  rejectUnknownKeys(
    summary,
    allowedInputSummaryKeys,
    "$.expected_observed_delta_preview.input_summary",
    accumulator,
    "preview_unknown_nested_field",
  );
  for (const field of allowedInputSummaryKeys) {
    if (field.endsWith("_count")) {
      requireNonNegativeInteger(
        summary[field],
        `$.expected_observed_delta_preview.input_summary.${field}`,
        accumulator,
      );
    } else if (typeof summary[field] !== "boolean") {
      addError(
        accumulator,
        "preview_boolean_malformed",
        `$.expected_observed_delta_preview.input_summary.${field}`,
        "Expected a boolean.",
      );
    }
  }
}

function validateStringSummaryObject(
  value: unknown,
  allowedKeys: ReadonlySet<string>,
  path: string,
  stringArrayFields: string[],
  accumulator: Accumulator,
) {
  const summary = recordAt(value, path, accumulator);
  if (!summary) return;
  rejectUnknownKeys(
    summary,
    allowedKeys,
    path,
    accumulator,
    "preview_unknown_nested_field",
  );
  for (const field of stringArrayFields) {
    stringArray(summary[field], `${path}.${field}`, accumulator);
  }
  for (const [key, child] of Object.entries(summary)) {
    if (stringArrayFields.includes(key)) continue;
    if (key.endsWith("_count")) {
      requireNonNegativeInteger(child, `${path}.${key}`, accumulator);
    } else if (typeof child !== "boolean") {
      addError(
        accumulator,
        "preview_scalar_malformed",
        `${path}.${key}`,
        "Expected a boolean or non-negative count.",
      );
    }
  }
}

function validateCandidateBuckets(
  value: unknown,
  accumulator: Accumulator,
): ValidatedInput["selectableCandidates"] {
  const buckets = recordAt(
    value,
    "$.expected_observed_delta_preview.delta_candidates",
    accumulator,
  );
  if (!buckets) return [];
  rejectUnknownKeys(
    buckets,
    allowedCandidateBucketKeys,
    "$.expected_observed_delta_preview.delta_candidates",
    accumulator,
    "preview_unknown_candidate_bucket",
  );
  const seenCandidateIds = new Set<string>();
  const selectable: ValidatedInput["selectableCandidates"] = [];
  for (const bucket of allowedCandidateBucketKeys) {
    const path = `$.expected_observed_delta_preview.delta_candidates.${bucket}`;
    const candidates = arrayAt(buckets[bucket], path, accumulator);
    candidates.forEach((candidateValue, index) => {
      const candidatePath = `${path}[${index}]`;
      const candidate = validateCandidate(candidateValue, candidatePath, accumulator);
      if (!candidate) return;
      if (seenCandidateIds.has(candidate.candidate_id)) {
        addError(
          accumulator,
          "preview_candidate_id_duplicate",
          `${candidatePath}.candidate_id`,
          "Candidate IDs must be unique across ExpectedObservedDelta buckets.",
          true,
        );
      }
      seenCandidateIds.add(candidate.candidate_id);
      if (bucket !== "review_only_candidates") {
        selectable.push({
          bucket: bucket as (typeof selectableCandidateBucketKeys)[number],
          candidate,
        });
      }
    });
  }
  return selectable;
}

function validateCandidate(
  value: unknown,
  path: string,
  accumulator: Accumulator,
): CandidateIngressNormalizedCandidate | null {
  const candidate = recordAt(value, path, accumulator);
  if (!candidate) return null;
  rejectUnknownKeys(
    candidate,
    allowedCandidateKeys,
    path,
    accumulator,
    "preview_unknown_candidate_field",
  );
  for (const field of [
    "candidate_id",
    "label",
    "summary",
    "source_ref",
    "operator_ref",
  ]) {
    requireString(candidate, field, path, accumulator);
  }
  if (!candidateKinds.has(protocolStringValueV01(candidate.candidate_kind) ?? "")) {
    addError(
      accumulator,
      "preview_candidate_kind_invalid",
      `${path}.candidate_kind`,
      "Expected a known candidate kind.",
    );
  }
  if (candidate.source_kind !== "codex_result_report") {
    addError(
      accumulator,
      "preview_candidate_source_kind_invalid",
      `${path}.source_kind`,
      "Codex semantic proposal mapping accepts Codex result candidates only.",
      true,
    );
  }
  if (!confidenceValues.has(protocolStringValueV01(candidate.confidence) ?? "")) {
    addError(
      accumulator,
      "preview_candidate_confidence_invalid",
      `${path}.confidence`,
      "Expected a known legacy confidence value.",
    );
  }
  if (
    !persistenceHorizons.has(
      protocolStringValueV01(candidate.persistence_horizon) ?? "",
    )
  ) {
    addError(
      accumulator,
      "preview_candidate_persistence_invalid",
      `${path}.persistence_horizon`,
      "Expected a known legacy persistence horizon.",
    );
  }
  if (candidate.review_required !== true || candidate.candidate_only !== true) {
    addError(
      accumulator,
      "preview_candidate_authority_invalid",
      path,
      "ExpectedObservedDelta candidates must remain review-required candidate material.",
      true,
    );
  }
  for (const field of [
    "session_ref",
    "project_ref",
    "work_ref",
    "result_ref",
    "pr_ref",
    "commit_ref",
  ]) {
    if (candidate[field] !== undefined && !protocolStringValueV01(candidate[field])) {
      addError(
        accumulator,
        "preview_optional_ref_malformed",
        `${path}.${field}`,
        "Optional compatibility refs must be non-empty strings or absent.",
      );
    }
  }
  stringArray(candidate.evidence_refs, `${path}.evidence_refs`, accumulator);
  stringArray(candidate.source_refs, `${path}.source_refs`, accumulator);
  const authority = recordAt(candidate.authority_profile, `${path}.authority_profile`, accumulator);
  if (authority) {
    rejectUnknownKeys(
      authority,
      allowedCandidateAuthorityKeys,
      `${path}.authority_profile`,
      accumulator,
      "preview_unknown_candidate_authority_field",
    );
    const expected = createCandidateIngressAuthorityProfileV01({
      generated_view: true,
    });
    for (const [key, expectedValue] of Object.entries(expected)) {
      if (authority[key] !== expectedValue) {
        addError(
          accumulator,
          "preview_candidate_authority_invalid",
          `${path}.authority_profile.${key}`,
          `${key} must remain ${String(expectedValue)}.`,
          true,
        );
      }
    }
  }
  return candidate as unknown as CandidateIngressNormalizedCandidate;
}

function validateComparisonObjects(
  preview: ProtocolJsonRecordV01,
  accumulator: Accumulator,
) {
  const mismatch = recordAt(
    preview.mismatch_summary,
    "$.expected_observed_delta_preview.mismatch_summary",
    accumulator,
  );
  if (mismatch) {
    rejectUnknownKeys(
      mismatch,
      allowedMismatchSummaryKeys,
      "$.expected_observed_delta_preview.mismatch_summary",
      accumulator,
      "preview_unknown_nested_field",
    );
    for (const field of allowedMismatchSummaryKeys) {
      if (field === "summary") {
        requireString(
          mismatch,
          field,
          "$.expected_observed_delta_preview.mismatch_summary",
          accumulator,
        );
      } else {
        requireNonNegativeInteger(
          mismatch[field],
          `$.expected_observed_delta_preview.mismatch_summary.${field}`,
          accumulator,
        );
      }
    }
  }
  validateComparisonObject(
    preview.requirement_progress_comparison,
    allowedRequirementComparisonKeys,
    "$.expected_observed_delta_preview.requirement_progress_comparison",
    ["expected_requirement_progress", "observed_requirement_progress"],
    "requirement_progress_delta_candidates",
    "changed_files_are_not_requirement_completion",
    true,
    accumulator,
  );
  validateComparisonObject(
    preview.verification_comparison,
    allowedVerificationComparisonKeys,
    "$.expected_observed_delta_preview.verification_comparison",
    [
      "expected_checks",
      "passed_or_completed_checks",
      "skipped_or_unverified_checks",
    ],
    null,
    "skipped_checks_count_as_passed",
    false,
    accumulator,
  );
  validateComparisonObject(
    preview.non_goal_comparison,
    allowedNonGoalComparisonKeys,
    "$.expected_observed_delta_preview.non_goal_comparison",
    ["expected_non_goals", "observed_risks"],
    "non_goal_risk_candidates",
    null,
    null,
    accumulator,
  );
}

function validateComparisonObject(
  value: unknown,
  allowedKeys: ReadonlySet<string>,
  path: string,
  stringFields: string[],
  candidateField: string | null,
  invariantField: string | null,
  invariantValue: boolean | null,
  accumulator: Accumulator,
) {
  const comparison = recordAt(value, path, accumulator);
  if (!comparison) return;
  rejectUnknownKeys(
    comparison,
    allowedKeys,
    path,
    accumulator,
    "preview_unknown_nested_field",
  );
  stringFields.forEach((field) =>
    stringArray(comparison[field], `${path}.${field}`, accumulator),
  );
  if (candidateField) {
    arrayAt(comparison[candidateField], `${path}.${candidateField}`, accumulator).forEach(
      (candidate, index) =>
        validateCandidate(
          candidate,
          `${path}.${candidateField}[${index}]`,
          accumulator,
        ),
    );
  }
  if (invariantField && comparison[invariantField] !== invariantValue) {
    addError(
      accumulator,
      "preview_comparison_invariant_invalid",
      `${path}.${invariantField}`,
      `${invariantField} must remain ${String(invariantValue)}.`,
      true,
    );
  }
}

function validateEvidenceSummary(value: unknown, accumulator: Accumulator) {
  const evidence = recordAt(
    value,
    "$.expected_observed_delta_preview.evidence_summary",
    accumulator,
  );
  if (!evidence) return;
  rejectUnknownKeys(
    evidence,
    allowedEvidenceSummaryKeys,
    "$.expected_observed_delta_preview.evidence_summary",
    accumulator,
    "preview_unknown_nested_field",
  );
  for (const field of ["source_refs", "evidence_refs", "missing_evidence"]) {
    stringArray(
      evidence[field],
      `$.expected_observed_delta_preview.evidence_summary.${field}`,
      accumulator,
    );
  }
  for (const field of [
    "has_result_material",
    "has_expected_material",
    "has_observed_material",
    "has_source_refs",
    "has_evidence_refs",
  ]) {
    if (typeof evidence[field] !== "boolean") {
      addError(
        accumulator,
        "preview_boolean_malformed",
        `$.expected_observed_delta_preview.evidence_summary.${field}`,
        "Expected a boolean.",
      );
    }
  }
  if (
    evidence.has_result_material !== true ||
    evidence.has_expected_material !== true ||
    evidence.has_observed_material !== true ||
    evidence.has_source_refs !== true
  ) {
    addError(
      accumulator,
      "semantic_material_insufficient",
      "$.expected_observed_delta_preview.evidence_summary",
      "Result, expected, observed, and source material must all be explicit.",
    );
  }
}

function validatePreviewAuthority(value: unknown, accumulator: Accumulator) {
  const authority = recordAt(
    value,
    "$.expected_observed_delta_preview.authority_boundary",
    accumulator,
  );
  if (!authority) return;
  const expected = createExpectedObservedDeltaPreviewAuthorityBoundaryV01();
  rejectUnknownKeys(
    authority,
    new Set(Object.keys(expected)),
    "$.expected_observed_delta_preview.authority_boundary",
    accumulator,
    "preview_unknown_authority_field",
  );
  for (const [key, expectedValue] of Object.entries(expected)) {
    if (
      key === "notes"
        ? canonicalizeProtocolValueV01(
            normalizePreviewUnorderedValue(authority[key]),
          ) !==
          canonicalizeProtocolValueV01(
            normalizePreviewUnorderedValue(expectedValue),
          )
        : authority[key] !== expectedValue
    ) {
      addError(
        accumulator,
        "preview_authority_boundary_invalid",
        `$.expected_observed_delta_preview.authority_boundary.${key}`,
        `${key} must remain the legacy read-only authority boundary value.`,
        true,
      );
    }
  }
}

function validateReceiptBinding(
  input: CodexReviewEpisodeDeltaProposalInputV01,
  receipt: RunReceiptV01,
  accumulator: Accumulator,
) {
  if (receipt.workspace_id !== input.workspace_id) {
    addError(accumulator, "mapped_receipt_workspace_mismatch", "$.workspace_id", "Mapped receipt workspace identity changed.", true);
  }
  if (receipt.project_id !== input.project_id) {
    addError(accumulator, "mapped_receipt_project_mismatch", "$.project_id", "Mapped receipt project identity changed.", true);
  }
  const sourceRecordBinding = receipt.compatibility.external_refs.find(
    (ref) =>
      ref.ref_type === "normalized_codex_result_report_record" &&
      ref.external_id === input.source_record.report_id,
  );
  if (
    !sourceRecordBinding ||
    sourceRecordBinding.source_ref !== input.source_record.report_fingerprint
  ) {
    addError(
      accumulator,
      "mapped_receipt_source_record_binding_missing",
      "$.source_record",
      "Mapped RunReceipt must retain the exact Codex source record identity and fingerprint.",
      true,
    );
  }
  const expectedTaskRef = input.task_context_packet_ref ?? null;
  if (
    canonicalizeProtocolValueV01(receipt.task_context_packet_ref) !==
    canonicalizeProtocolValueV01(expectedTaskRef)
  ) {
    addError(
      accumulator,
      "mapped_receipt_task_context_binding_mismatch",
      "$.task_context_packet_ref",
      "Mapped RunReceipt must preserve the optional TaskContextPacket reference exactly.",
      true,
    );
  }
}

function buildMappedProposal(
  validated: ValidatedInput,
  receipt: RunReceiptV01,
): EpisodeDeltaProposalV01 {
  const { input, previewId, previewFingerprint, selectableCandidates } =
    validated;
  const receiptRef = externalRef(
    "run_receipt",
    receipt.receipt_id,
    "imported_unverified",
    receipt.recorded_at,
    receipt.integrity.fingerprint,
  );
  const sourceRecordRef = externalRef(
    "normalized_codex_result_report_record",
    input.source_record.report_id,
    "imported_unverified",
    input.source_record.reported_at,
    input.source_record.report_fingerprint,
  );
  const previewRef = externalRef(
    "expected_observed_delta_preview",
    previewId,
    "derived_interpretation",
    input.expected_observed_delta_preview.as_of,
    previewFingerprint,
  );
  const interpreterRef = externalRef(
    "deterministic_compatibility_mapper",
    "codex-semantic-review-to-episode-delta-proposal:v0.1",
    "derived_interpretation",
    input.proposal_created_at,
    previewFingerprint,
  );
  const previewSourceRefs = input.expected_observed_delta_preview.source_refs.map(
    (sourceRef) =>
      externalRef(
        "legacy_source_ref",
        sourceRef,
        "imported_unverified",
        input.expected_observed_delta_preview.as_of,
      ),
  );
  const attestations = receipt.attestations.map((attestation) => ({
    material_id: stableId(
      "material:attestation",
      attestation.attestation_id,
    ),
    material_kind: `codex_result_${attestation.attestation_kind}`,
    bounded_summary: boundedText(attestation.summary),
    reported_at: attestation.reported_at,
    reporter_ref: attestation.reporter_ref,
    trust_class: codexAttestationTrustClass(attestation.trust_class),
    source_run_receipt_refs: [receiptRef],
    source_refs: [receiptRef, ...attestation.source_refs],
    subject_refs: attestation.subject_refs,
  })) satisfies EpisodeDeltaProposalAttestationV01[];
  if (attestations.length === 0) {
    throw new Error("Codex compatibility receipt lacks attestation material.");
  }
  const basisMaterialIds = attestations.map((item) => item.material_id);
  const mappedCandidates = selectableCandidates.map(({ bucket, candidate }) => {
    const candidateRef = externalRef(
      "expected_observed_delta_candidate",
      candidate.candidate_id,
      "derived_interpretation",
      input.expected_observed_delta_preview.as_of,
      previewFingerprint,
    );
    const materialId = stableId(
      "material:inference",
      `${bucket}|${candidate.candidate_id}`,
    );
    const deltaId = stableId(
      "delta:codex-review",
      `${bucket}|${candidate.candidate_id}`,
    );
    return {
      bucket,
      candidate,
      candidateRef,
      materialId,
      deltaId,
    };
  });
  const inferences = mappedCandidates.map((entry) => ({
    material_id: entry.materialId,
    material_kind: `expected_observed_${entry.bucket.replace(/_candidates$/, "")}`,
    bounded_summary: boundedText(entry.candidate.summary),
    inferred_at: input.expected_observed_delta_preview.as_of,
    interpreter_ref: interpreterRef,
    trust_class: "derived_interpretation" as const,
    basis_material_ids: basisMaterialIds,
    source_run_receipt_refs: [receiptRef],
    source_refs: [receiptRef, sourceRecordRef, previewRef],
    subject_refs: [entry.candidateRef],
  }));
  const proposedDeltas = mappedCandidates.map((entry) => ({
    candidate_id: entry.deltaId,
    delta_type: mapCandidateDeltaType(entry.candidate.candidate_kind),
    operation: "unknown" as const,
    title: boundedText(entry.candidate.label),
    current_state: {
      knowledge_status: "unknown" as const,
      bounded_summary: null,
      source_material_ids: [],
      source_refs: [receiptRef, previewRef],
    },
    proposed_state_summary: boundedText(entry.candidate.summary),
    target_refs: [entry.candidateRef],
    basis_material_ids: [entry.materialId],
    source_refs: [receiptRef, sourceRecordRef, previewRef],
    uncertainties: candidateUncertainties(entry.bucket, entry.candidate),
    limitations: candidateLimitations(entry.bucket),
    review_required: true as const,
  }));
  const missingInformation = mappedCandidates.map((entry) => ({
    missing_id: stableId("missing:codex-review", entry.deltaId),
    knowledge_status: "unknown" as const,
    code: "canonical_current_state_unknown",
    bounded_summary:
      "The legacy comparison does not establish canonical current project state.",
    related_material_ids: [entry.materialId],
    related_delta_ids: [entry.deltaId],
    source_refs: [receiptRef, previewRef],
    review_required: true as const,
  }));
  const uncertainties = mappedCandidates.map((entry) => ({
    uncertainty_id: stableId("uncertainty:codex-review", entry.deltaId),
    bounded_summary:
      "Legacy Codex and ExpectedObservedDelta material remains imported or derived and requires explicit review.",
    related_material_ids: [entry.materialId],
    related_delta_ids: [entry.deltaId],
    source_refs: [receiptRef, sourceRecordRef, previewRef],
  }));
  if (input.source_currentness.status === "stale") {
    uncertainties.push({
      uncertainty_id: stableId("uncertainty:codex-review", "stale-source"),
      bounded_summary:
        "The explicitly stale source must be refreshed or reviewed before any later decision.",
      related_material_ids: inferences.map((item) => item.material_id),
      related_delta_ids: proposedDeltas.map((item) => item.candidate_id),
      source_refs: [sourceRecordRef, previewRef],
    });
  }
  const proposalInput: EpisodeDeltaProposalBuilderInputV01 = {
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    created_at: input.proposal_created_at,
    status: "pending_review",
    bounded_summary:
      "Imported Codex result attestations and ExpectedObservedDelta comparison material produced review-required semantic candidates.",
    task_context_packet_ref: input.task_context_packet_ref ?? null,
    run_receipt_refs: [receiptRef],
    observations: [],
    attestations,
    inferences,
    proposed_deltas: proposedDeltas,
    conflicts: [],
    missing_information: missingInformation,
    uncertainties,
    limitations: [
      "Legacy observed labels remain imported attestations, not direct observations.",
      "Changed files and check claims do not establish requirement completion, approval, accepted Evidence, or work closure.",
      "ExpectedObservedDelta material is a derived comparison input, not canonical state or a ReviewDecision.",
      "The mapper creates no durable record and performs no transition or external actuation.",
    ],
    source_status: {
      coverage: "complete",
      currentness: input.source_currentness.status,
      as_of: input.source_currentness.as_of,
      review_required: true,
      basis: boundedText(input.source_currentness.basis),
      source_refs: [sourceRecordRef, previewRef, receiptRef],
    },
    source_refs: [
      receiptRef,
      sourceRecordRef,
      previewRef,
      interpreterRef,
      ...previewSourceRefs,
    ],
    compatibility: {
      source_contracts: [
        input.source_record.record_version,
        receipt.receipt_version,
        input.expected_observed_delta_preview.preview_version,
      ],
      unmapped_fields: [
        {
          source_field: "evidence_refs",
          reason:
            "Legacy evidence references remain compatibility refs and are not accepted Evidence.",
        },
        {
          source_field: "candidate_confidence",
          reason:
            "Legacy candidate confidence does not grant semantic authority.",
        },
        {
          source_field: "recommended_next_action",
          reason:
            "Legacy next-action advice does not select or mutate later context automatically.",
        },
      ],
      warnings: [
        "All Codex result material remains imported_unverified unless a separate direct observation source exists.",
        "ExpectedObservedDelta candidates remain derived_interpretation and review_required.",
        "No ReviewDecision, StateTransitionReceipt, Evidence acceptance, Perspective mutation, memory promotion, or work closure is generated.",
      ],
      external_refs: [receiptRef, sourceRecordRef, previewRef, ...previewSourceRefs],
    },
    authority_notes: [
      "Codex source validation and fingerprint verification do not upgrade trust or grant authority.",
      "The compatibility mapper is deterministic and non-actuating.",
    ],
  };
  return buildEpisodeDeltaProposalV01(proposalInput);
}

function mapCandidateDeltaType(
  candidateKind: CandidateIngressNormalizedCandidate["candidate_kind"],
): EpisodeDeltaProposalDeltaTypeV01 {
  if (candidateKind === "changed_artifact_ref") return "artifact_delta";
  if (candidateKind === "requirement" || candidateKind === "expected_observed_signal") {
    return "validation_delta";
  }
  if (candidateKind === "next_action") return "agent_plan_delta";
  if (candidateKind === "reusable_context") return "perspective_delta";
  if (candidateKind === "risk_or_blocker") return "coordination_delta";
  return "perspective_delta";
}

function codexAttestationTrustClass(
  trustClass: RunReceiptV01["attestations"][number]["trust_class"],
): EpisodeDeltaProposalAttestationV01["trust_class"] {
  if (
    trustClass === "host_attestation" ||
    trustClass === "provider_report" ||
    trustClass === "user_declaration" ||
    trustClass === "imported_unverified"
  ) {
    return trustClass;
  }
  throw new Error(
    "Codex result compatibility mapping cannot upgrade or recast derived attestation trust.",
  );
}

function candidateUncertainties(
  bucket: (typeof selectableCandidateBucketKeys)[number],
  candidate: CandidateIngressNormalizedCandidate,
): string[] {
  return [
    `Legacy comparison bucket ${bucket} remains derived candidate material.`,
    `Legacy confidence ${candidate.confidence} grants no authority.`,
  ];
}

function candidateLimitations(
  bucket: (typeof selectableCandidateBucketKeys)[number],
): string[] {
  const limitations = [
    "Candidate comparison does not establish accepted Evidence or canonical state.",
  ];
  if (bucket === "changed_file_delta_candidates") {
    limitations.push("Changed files do not establish requirement completion.");
  }
  if (bucket === "skipped_or_unverified_check_candidates") {
    limitations.push("Skipped or unverified checks are not passed checks.");
  }
  if (bucket === "not_done_candidates") {
    limitations.push("Not-done material remains a gap and does not close work.");
  }
  if (bucket === "matched_expectation_candidates") {
    limitations.push("A matched expectation is not approval or work closure.");
  }
  return limitations;
}

function externalRef(
  refType: string,
  externalId: string,
  trustClass: ExternalRefTrustClassV01,
  observedAt?: string,
  sourceRef?: string,
): ExternalRefV01 {
  return {
    ref_version: EXTERNAL_REF_VERSION_V01,
    ref_type: refType,
    external_id: externalId,
    trust_class: trustClass,
    ...(observedAt ? { observed_at: observedAt } : {}),
    ...(sourceRef ? { source_ref: sourceRef } : {}),
    compatibility_namespace: COMPATIBILITY_NAMESPACE,
  };
}

function normalizePreviewUnorderedValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value
      .map(normalizePreviewUnorderedValue)
      .sort((left, right) => {
        const leftCanonical = canonicalizeProtocolValueV01(left);
        const rightCanonical = canonicalizeProtocolValueV01(right);
        return leftCanonical < rightCanonical
          ? -1
          : leftCanonical > rightCanonical
            ? 1
            : 0;
      });
  }
  if (!isProtocolRecordV01(value)) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      normalizePreviewUnorderedValue(child),
    ]),
  );
}

function stableId(prefix: string, value: string): string {
  const hash = createProtocolSha256V01(
    canonicalizeProtocolValueV01({ prefix, value }),
  );
  return `${prefix}:${hash.slice("sha256:".length, 31)}`;
}

function boundedText(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length <= MAX_SOURCE_TEXT
    ? normalized
    : `${normalized.slice(0, MAX_SOURCE_TEXT - 3)}...`;
}

function resultFromReceiptFailure(
  accumulator: Accumulator,
  receiptMapping: CodexResultReportRunReceiptMappingResultV01,
  previewId: string,
  previewFingerprint: string,
): CodexReviewEpisodeDeltaProposalMappingResultV01 {
  accumulator.errors.push(...receiptMapping.errors);
  accumulator.warnings.push(...receiptMapping.warnings);
  if (receiptMapping.status === "blocked") accumulator.blocked = true;
  return resultFromAccumulator(
    accumulator,
    null,
    null,
    previewId,
    previewFingerprint,
    receiptMapping.source_record_fingerprint,
  );
}

function resultFromAccumulator(
  accumulator: Accumulator,
  receipt: RunReceiptV01 | null,
  proposal: EpisodeDeltaProposalV01 | null,
  previewId: string | null,
  previewFingerprint: string | null,
  sourceFingerprint: string | null = null,
): CodexReviewEpisodeDeltaProposalMappingResultV01 {
  return {
    status:
      accumulator.errors.length === 0
        ? "mapped"
        : accumulator.blocked
          ? "blocked"
          : "invalid",
    receipt,
    proposal,
    errors: accumulator.errors,
    warnings: accumulator.warnings,
    source_record_fingerprint: sourceFingerprint,
    preview_id: previewId,
    preview_fingerprint: previewFingerprint,
  };
}

function scanUnsafeSourceMaterial(
  value: unknown,
  path: string,
  accumulator: Accumulator,
) {
  if (typeof value === "string") {
    if (
      /(?:OPENAI_API_KEY|GITHUB_TOKEN|ANTHROPIC_API_KEY|AWS_SECRET_ACCESS_KEY)\s*=/i.test(
        value,
      ) ||
      /\b(?:sk-(?:proj-)?[A-Za-z0-9_-]{8,}|ghp_[A-Za-z0-9_]{8,}|github_pat_[A-Za-z0-9_]{8,})\b/.test(
        value,
      )
    ) {
      addError(
        accumulator,
        "secret_shaped_material",
        path,
        "Secret-shaped material is forbidden in Codex semantic review input.",
        true,
      );
    }
    if (/^(?:file:\/\/|\/(?!\/)|[A-Za-z]:[\\/])/.test(value)) {
      addError(
        accumulator,
        "absolute_local_path_forbidden",
        path,
        "Absolute local paths are forbidden in compatibility material.",
        true,
      );
    }
    if (value.length > MAX_SOURCE_TEXT && !/fingerprint|sha256/i.test(path)) {
      addError(
        accumulator,
        "source_text_bound_exceeded",
        path,
        "Legacy source text exceeds the bounded mapping limit.",
        true,
      );
    }
    return;
  }
  if (Array.isArray(value)) {
    const limit = /(?:_refs|_ids)$/.test(lastPathKey(path))
      ? MAX_SOURCE_REFS
      : MAX_SOURCE_COLLECTION_ITEMS;
    if (value.length > limit) {
      addError(
        accumulator,
        "source_collection_bound_exceeded",
        path,
        "Legacy source collection exceeds the bounded mapping limit.",
        true,
      );
    }
    value.forEach((item, index) =>
      scanUnsafeSourceMaterial(item, `${path}[${index}]`, accumulator),
    );
    return;
  }
  if (!isProtocolRecordV01(value)) return;
  for (const [key, child] of Object.entries(value)) {
    const normalized = key
      .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
      .toLowerCase();
    if (
      /^(?:raw_)?(?:prompt|transcript|terminal_(?:output|log|dump)|provider_output|hidden_reasoning|reasoning_trace|chain_of_thought|credentials?|secret|api_key|access_token|password)$/.test(
        normalized,
      )
    ) {
      addError(
        accumulator,
        "forbidden_raw_material_field",
        `${path}.${key}`,
        "Raw prompt, transcript, terminal, provider, hidden reasoning, credential, or secret fields are forbidden.",
        true,
      );
    }
    scanUnsafeSourceMaterial(child, `${path}.${key}`, accumulator);
  }
}

function rejectUnknownKeys(
  value: ProtocolJsonRecordV01,
  allowed: ReadonlySet<string>,
  path: string,
  accumulator: Accumulator,
  code: string,
) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      addError(
        accumulator,
        code,
        `${path}.${key}`,
        `Field ${key} is not part of this bounded source contract.`,
        true,
      );
    }
  }
}

function requireString(
  record: ProtocolJsonRecordV01,
  field: string,
  path: string,
  accumulator: Accumulator,
): string | null {
  const value = protocolStringValueV01(record[field]);
  if (!value) {
    addError(
      accumulator,
      `${field}_missing`,
      `${path}.${field}`,
      `${field} must be a non-empty string.`,
    );
  }
  return value;
}

function requireTimestamp(
  value: unknown,
  path: string,
  accumulator: Accumulator,
): number | null {
  const parsed = parseStrictIsoTimestampV01(value);
  if (parsed === null) {
    addError(
      accumulator,
      "timestamp_invalid",
      path,
      "Expected a strict ISO-8601 timestamp with timezone.",
    );
  }
  return parsed;
}

function optionalTimestamp(
  value: unknown,
  path: string,
  accumulator: Accumulator,
): number | null {
  if (value === null || value === undefined) return null;
  return requireTimestamp(value, path, accumulator);
}

function stringArray(
  value: unknown,
  path: string,
  accumulator: Accumulator,
): string[] {
  const values: string[] = [];
  arrayAt(value, path, accumulator).forEach((item, index) => {
    const normalized = protocolStringValueV01(item);
    if (normalized) values.push(normalized);
    else {
      addError(
        accumulator,
        "source_string_array_malformed",
        `${path}[${index}]`,
        "Expected a non-empty string.",
      );
    }
  });
  return values;
}

function requireNonNegativeInteger(
  value: unknown,
  path: string,
  accumulator: Accumulator,
) {
  if (!Number.isInteger(value) || Number(value) < 0) {
    addError(
      accumulator,
      "source_count_malformed",
      path,
      "Expected a non-negative integer.",
    );
  }
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : null;
}

function candidateArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function recordAt(
  value: unknown,
  path: string,
  accumulator: Accumulator,
): ProtocolJsonRecordV01 | null {
  if (isProtocolRecordV01(value)) return value;
  addError(accumulator, "source_object_malformed", path, "Expected an object.");
  return null;
}

function arrayAt(
  value: unknown,
  path: string,
  accumulator: Accumulator,
): unknown[] {
  if (Array.isArray(value)) return value;
  addError(accumulator, "source_array_malformed", path, "Expected an array.");
  return [];
}

function lastPathKey(path: string) {
  return path.replace(/\[\d+\]$/, "").split(".").at(-1) ?? "";
}

function createAccumulator(): Accumulator {
  return { errors: [], warnings: [], blocked: false };
}

function issueSink(accumulator: Accumulator) {
  return {
    error(
      code: string,
      path: string | null,
      message: string,
      blocked = false,
    ) {
      addError(accumulator, code, path, message, blocked);
    },
    warning(code: string, path: string | null, message: string) {
      accumulator.warnings.push({ severity: "warning", code, path, message });
    },
  };
}

function addError(
  accumulator: Accumulator,
  code: string,
  path: string | null,
  message: string,
  blocked = false,
) {
  accumulator.errors.push({ severity: "error", code, path, message });
  if (blocked) accumulator.blocked = true;
}
