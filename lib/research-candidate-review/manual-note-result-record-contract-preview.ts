import { createResearchCandidateManualNoteResultIntakeFingerprint } from "@/lib/research-candidate-review/manual-note-result-intake-operator-review";
import type {
  ResearchCandidateManualNoteHandoffResultIntake,
} from "@/types/research-candidate-manual-note-handoff-result-intake";
import type { ResearchCandidateManualNoteResultIntakeOperatorReview } from "@/types/research-candidate-manual-note-result-intake-operator-review";
import type {
  ResearchCandidateManualNoteResultRecordContractPreview,
  ResearchCandidateManualNoteResultRecordContractPreviewAuthorityBoundary,
  ResearchCandidateManualNoteResultRecordContractPreviewInput,
  ResearchCandidateManualNoteResultRecordContractPreviewStatus,
  ResearchCandidateManualNoteResultRecordContractPreviewValidation,
} from "@/types/research-candidate-manual-note-result-record-contract-preview";

type JsonRecord = Record<string, unknown>;

const contractKind =
  "research_candidate_manual_note_result_record_contract_preview" as const;
const contractVersion =
  "research_candidate_manual_note_result_record_contract_preview.v0.1" as const;
const nextRecommendedSlice =
  "manual_research_candidate_expected_observed_delta_reuse_outcome_authorized_record_write_v0_1" as const;

export function buildResearchCandidateManualNoteResultRecordContractPreview(
  input: ResearchCandidateManualNoteResultRecordContractPreviewInput,
): ResearchCandidateManualNoteResultRecordContractPreview {
  const intake = input.result_intake;
  const review = input.operator_review;
  const sourceResultIntakeFingerprint =
    review.source_result_intake_fingerprint ||
    createResearchCandidateManualNoteResultIntakeFingerprint(intake);
  const sourceResultIntakeRef =
    review.source_result_intake_ref ||
    `${intake.intake_version}:${sourceResultIntakeFingerprint}`;
  const sourceRefs = uniqueSorted(intake.source_refs);
  const authorityBoundary =
    getResearchCandidateManualNoteResultRecordContractPreviewAuthorityBoundary();
  const blockerReasons = buildContractBlockers({ intake, review });
  const contractStatus: ResearchCandidateManualNoteResultRecordContractPreviewStatus =
    blockerReasons.length === 0
      ? "ready_for_future_authorization"
      : "blocked_before_record_contract_preview";
  const expectedObservedDeltaRecordCandidate = {
    candidate_kind:
      "research_candidate_manual_note_expected_observed_delta_record_candidate" as const,
    expected_summary: intake.expected_observed_delta_draft.expected_summary,
    observed_summary: intake.expected_observed_delta_draft.observed_summary,
    mismatch_or_gap_summary:
      intake.expected_observed_delta_draft.mismatch_or_gap_summary,
    source_handoff_seed_fingerprint: intake.source_handoff_seed_fingerprint,
    source_result_text_fingerprint: intake.result_text_fingerprint,
    source_preview_session_id: intake.source_preview_session_id,
    source_refs: sourceRefs,
    draft_only: true as const,
    record_write_authorized: false as const,
  };
  const reuseOutcomeRecordCandidate = {
    candidate_kind:
      "research_candidate_manual_note_reuse_outcome_record_candidate" as const,
    selected_candidate_context_refs:
      intake.reuse_outcome_draft.selected_candidate_context_refs,
    outcome_label: intake.reuse_outcome_draft.outcome_label,
    source_line: intake.reuse_outcome_draft.source_line,
    warning_reasons: intake.reuse_outcome_draft.warning_reasons,
    source_handoff_seed_fingerprint: intake.source_handoff_seed_fingerprint,
    source_result_text_fingerprint: intake.result_text_fingerprint,
    draft_only: true as const,
    record_write_authorized: false as const,
    writes_ledger: false as const,
  };
  const idempotencyFingerprint = createContractFingerprint({
    contract_kind: contractKind,
    contract_version: contractVersion,
    source_operator_review_ref: review.review_ref,
    source_result_intake_ref: sourceResultIntakeRef,
    expected_observed_delta_record_candidate:
      expectedObservedDeltaRecordCandidate,
    reuse_outcome_record_candidate: reuseOutcomeRecordCandidate,
    contract_status: contractStatus,
  });
  const validation = validateResearchCandidateManualNoteResultRecordContractPreview({
    contractStatus,
    blockerReasons,
    authorityBoundary,
  });

  return {
    contract_kind: contractKind,
    contract_version: contractVersion,
    contract_status: contractStatus,
    contract_ref: `${contractVersion}:${idempotencyFingerprint}`,
    contract_fingerprint: idempotencyFingerprint,
    fingerprint_algorithm: "fnv1a32_canonical_json_v0_1",
    scope: intake.scope,
    source_operator_review_ref: review.review_ref,
    source_operator_review_fingerprint: review.review_fingerprint,
    source_result_intake_ref: sourceResultIntakeRef,
    source_result_intake_fingerprint: sourceResultIntakeFingerprint,
    source_handoff_seed_fingerprint: intake.source_handoff_seed_fingerprint,
    source_preview_session_id: intake.source_preview_session_id,
    expected_observed_delta_record_candidate:
      expectedObservedDeltaRecordCandidate,
    reuse_outcome_record_candidate: reuseOutcomeRecordCandidate,
    idempotency_preview: {
      idempotency_fingerprint: idempotencyFingerprint,
      fingerprint_algorithm: "fnv1a32_canonical_json_v0_1",
      durable_id_allocated: false,
      preview_only: true,
    },
    source_refs: sourceRefs,
    evidence_refs: [] as [],
    proof_refs: [] as [],
    would_write: false,
    storage_authority_present: false,
    record_write_authorized: false,
    writes_ledger: false,
    required_future_authorization: [
      "explicit_operator_authorization_for_expected_observed_delta_record",
      "explicit_operator_authorization_for_reuse_outcome_record",
      "durable_storage_authority",
      "durable_idempotency_key",
      "authorized_record_writer_slice",
    ],
    validation,
    blocker_reasons: blockerReasons,
    authority_boundary: authorityBoundary,
    next_recommended_slice: nextRecommendedSlice,
  };
}

export function getResearchCandidateManualNoteResultRecordContractPreviewAuthorityBoundary(): ResearchCandidateManualNoteResultRecordContractPreviewAuthorityBoundary {
  return {
    candidate_only: true,
    preview_only: true,
    contract_preview_only: true,
    source_of_truth: false,
    would_write: false,
    storage_authority_present: false,
    record_write_authorized: false,
    writes_ledger: false,
    can_write_db: false,
    can_record_proof: false,
    can_create_evidence: false,
    can_update_work: false,
    can_commit_or_reject_state: false,
    can_promote_perspective: false,
    can_create_work_item: false,
    can_call_github: false,
    can_execute_codex: false,
    can_call_providers_or_openai: false,
    can_fetch_sources: false,
    can_run_retrieval_rag_embeddings_vector_fts_or_crawler: false,
    can_send_external_handoff: false,
    can_allocate_product_ids: false,
    can_execute_product_write: false,
  };
}

function buildContractBlockers({
  intake,
  review,
}: {
  intake: ResearchCandidateManualNoteHandoffResultIntake;
  review: ResearchCandidateManualNoteResultIntakeOperatorReview;
}) {
  return uniqueSorted([
    ...(review.selected_operator_decision !== "prepare_record_contract_preview"
      ? [`operator_decision_not_prepare:${review.selected_operator_decision}`]
      : []),
    ...(review.review_status !== "ready_for_record_contract_preview"
      ? [`operator_review_status:${review.review_status}`]
      : []),
    ...review.blocker_reasons,
    ...(!review.validation.record_contract_preview_allowed
      ? ["operator_review_did_not_allow_record_contract_preview"]
      : []),
    ...(intake.expected_observed_delta_draft.status !==
    "ready_for_operator_review"
      ? [
          `expected_observed_delta_draft_status:${intake.expected_observed_delta_draft.status}`,
        ]
      : []),
    ...(intake.reuse_outcome_draft.outcome_label === "not_reported"
      ? ["reuse_outcome_not_reported"]
      : []),
    ...intake.missing_required_return_fields.map(
      (field) => `missing_required_return_field:${field}`,
    ),
  ]);
}

function validateResearchCandidateManualNoteResultRecordContractPreview({
  contractStatus,
  blockerReasons,
  authorityBoundary,
}: {
  contractStatus: ResearchCandidateManualNoteResultRecordContractPreviewStatus;
  blockerReasons: string[];
  authorityBoundary: ResearchCandidateManualNoteResultRecordContractPreviewAuthorityBoundary;
}): ResearchCandidateManualNoteResultRecordContractPreviewValidation {
  const authorityBoundarySafe = authorityBoundaryIsSafe(authorityBoundary);
  const failureCodes = uniqueSorted([
    ...blockerReasons,
    ...(contractStatus !== "ready_for_future_authorization"
      ? ["record_contract_preview_not_ready"]
      : []),
    ...(!authorityBoundarySafe
      ? ["authority_boundary_forbidden_capability_enabled"]
      : []),
  ]);

  return {
    passed: failureCodes.length === 0 && authorityBoundarySafe,
    failure_codes: failureCodes,
    deterministic_browser_safe: true,
    no_durable_ids_allocated: true,
    raw_result_text_retained: false,
    operator_notes_retained: false,
    would_write: false,
    authority_boundary_safe: authorityBoundarySafe,
  };
}

function authorityBoundaryIsSafe(
  boundary: ResearchCandidateManualNoteResultRecordContractPreviewAuthorityBoundary,
) {
  if (
    boundary.candidate_only !== true ||
    boundary.preview_only !== true ||
    boundary.contract_preview_only !== true
  ) {
    return false;
  }

  return Object.entries(boundary).every(([key, value]) => {
    if (["candidate_only", "preview_only", "contract_preview_only"].includes(key)) {
      return value === true;
    }
    return value === false;
  });
}

function createContractFingerprint(value: unknown): string {
  return `fnv1a32:${fnv1a32(stableJson(value))}`;
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJson(item)).join(",")}]`;
  }

  const record = value as JsonRecord;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
    .join(",")}}`;
}

function uniqueSorted(values: readonly string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

function fnv1a32(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
