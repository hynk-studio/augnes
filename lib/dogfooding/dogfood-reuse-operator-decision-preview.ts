import type {
  DogfoodReuseCarryForwardCandidates,
  DogfoodReuseRecordProposal,
} from "@/types/dogfood-reuse-record-proposal";
import {
  DOGFOOD_REUSE_OPERATOR_DECISION_PREVIEW_VERSION,
  type DogfoodReuseAvailableOperatorDecision,
  type DogfoodReuseBucketCounts,
  type DogfoodReuseDogfoodSignalSummary,
  type DogfoodReuseOperatorDecisionAuthorityBoundary,
  type DogfoodReuseOperatorDecisionEvidenceSummary,
  type DogfoodReuseOperatorDecisionPreview,
  type DogfoodReuseOperatorDecisionPreviewStatus,
  type DogfoodReuseOperatorDecisionProposalRefs,
  type DogfoodReuseOperatorDecisionSourceStatus,
  type DogfoodReuseRecommendedOperatorDecision,
  type DogfoodReuseWouldWritePreview,
  type DogfoodReuseWriteReadiness,
} from "@/types/dogfood-reuse-operator-decision-preview";

const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z" as const;
const DEFAULT_SCOPE = "project:augnes" as const;

const AVAILABLE_OPERATOR_DECISIONS: DogfoodReuseAvailableOperatorDecision[] = [
  "approve_for_future_write",
  "defer",
  "reject",
  "keep_candidate",
  "request_more_evidence",
];

const DEFAULT_CARRY_FORWARD_CANDIDATES: DogfoodReuseCarryForwardCandidates = {
  next_relay_update_suggestions: [],
  next_handoff_adjustments: [],
  refs_to_preserve_next_time: [],
  refs_to_warn_next_time: [],
  refs_to_drop_or_deprioritize: [],
  unresolved_gaps: [],
  next_focus_candidate:
    "Supply an operator-reviewed dogfood/reuse record proposal before previewing a write decision.",
};

export type DogfoodReuseOperatorDecisionPreviewInput = {
  proposal?: DogfoodReuseRecordProposal | null;
  as_of?: string;
};

export function buildDogfoodReuseOperatorDecisionPreview({
  proposal,
  as_of,
}: DogfoodReuseOperatorDecisionPreviewInput): DogfoodReuseOperatorDecisionPreview {
  const baseEvidenceSummary = buildEvidenceSummary(proposal);
  const blockingReasons = buildBlockingReasons({
    proposal,
    evidenceSummary: baseEvidenceSummary,
  });
  const missingEvidence = buildMissingEvidence({
    proposal,
    evidenceSummary: baseEvidenceSummary,
  });
  const evidenceSummary = finalizeEvidenceSummary({
    proposal,
    evidenceSummary: baseEvidenceSummary,
    blockingReasons,
    missingEvidence,
  });
  const writeReadiness = buildWriteReadiness({
    proposal,
    blockingReasons,
    missingEvidence,
  });
  const decisionPreviewStatus = determineDecisionPreviewStatus({
    proposal,
    writeReadiness,
  });
  const recommendedOperatorDecision = determineRecommendedOperatorDecision({
    proposal,
    writeReadiness,
  });

  return {
    runtime: "augnes",
    preview_version: DOGFOOD_REUSE_OPERATOR_DECISION_PREVIEW_VERSION,
    scope: proposal?.scope ?? DEFAULT_SCOPE,
    as_of: as_of ?? proposal?.as_of ?? FALLBACK_AS_OF,
    source_refs: buildSourceRefs(proposal),
    proposal_refs: buildProposalRefs(proposal),
    decision_preview_status: decisionPreviewStatus,
    recommended_operator_decision: recommendedOperatorDecision,
    available_operator_decisions: AVAILABLE_OPERATOR_DECISIONS,
    write_readiness: writeReadiness,
    approval_requirements: buildApprovalRequirements(),
    blocking_reasons: blockingReasons,
    missing_evidence: missingEvidence,
    evidence_summary: evidenceSummary,
    would_write_preview: buildWouldWritePreview(proposal),
    would_not_write: buildWouldNotWrite(),
    candidate_carry_forward:
      proposal?.carry_forward_candidates ?? DEFAULT_CARRY_FORWARD_CANDIDATES,
    review_checklist: buildReviewChecklist(proposal),
    non_goals: [
      "No durable Handoff Reuse Outcome Ledger write.",
      "No persisted operator approve/defer/reject decision.",
      "No dogfood metric integration or metric update.",
      "No Perspective apply, promotion decision, Formation Receipt, or durable memory mutation.",
      "No provider, GitHub, Codex execution, handoff send, graph/vector/RAG/crawler/browser observer, autonomous action, DB migration, route, or store.",
    ],
    authority_boundary: buildAuthorityBoundary(),
    source_status: buildSourceStatus(proposal),
    fallback_reason: buildFallbackReason({
      proposal,
      decisionPreviewStatus,
      blockingReasons,
      missingEvidence,
    }),
    notes: [
      "Derived from an existing Dogfood Reuse Record Proposal.",
      "This preview shows whether a later durable dogfood/reuse write could be operator-reviewable; it does not persist a decision or write a record.",
    ],
  };
}

function buildProposalRefs(
  proposal?: DogfoodReuseRecordProposal | null,
): DogfoodReuseOperatorDecisionProposalRefs {
  return {
    proposal_ref: proposal
      ? `dogfood-reuse-record-proposal:${proposal.proposal_version}`
      : null,
    proposal_version: proposal?.proposal_version ?? null,
    proposal_status: proposal?.proposal_status ?? null,
    feedback_draft_ref:
      proposal?.feedback_draft_refs.feedback_draft_ref ?? null,
    result_report_ref:
      proposal?.feedback_draft_refs.result_report_ref ?? null,
    result_report_fingerprint:
      proposal?.feedback_draft_refs.result_report_fingerprint ?? null,
    context_relay_rationale_ref:
      proposal?.feedback_draft_refs.context_relay_rationale_ref ?? null,
    continuity_relay_ref:
      proposal?.feedback_draft_refs.continuity_relay_ref ?? null,
    source_refs: proposal?.source_refs ?? [],
  };
}

function buildEvidenceSummary(
  proposal?: DogfoodReuseRecordProposal | null,
): DogfoodReuseOperatorDecisionEvidenceSummary {
  const missingEvidence = uniqueSortedStrings([
    ...(proposal ? [] : ["missing_dogfood_reuse_record_proposal"]),
    ...(proposal?.evidence_summary.missing_evidence ?? []),
  ]);

  return {
    has_proposal: Boolean(proposal),
    proposal_status: proposal?.proposal_status ?? null,
    has_feedback_draft: proposal?.evidence_summary.has_feedback_draft ?? false,
    has_result_report: proposal?.evidence_summary.has_result_report ?? false,
    has_context_rationale:
      proposal?.evidence_summary.has_context_rationale ?? false,
    has_expected_return_signal:
      proposal?.evidence_summary.has_expected_return_signal ?? false,
    has_observed_return_signal:
      proposal?.evidence_summary.has_observed_return_signal ?? false,
    has_explicit_context_feedback:
      proposal?.evidence_summary.has_explicit_context_feedback ?? false,
    has_skipped_or_unverified_checks:
      proposal?.evidence_summary.has_skipped_or_unverified_checks ?? false,
    has_insufficient_data:
      !proposal || proposal.evidence_summary.has_insufficient_data,
    has_blocking_reasons: (proposal?.blocked_reasons.length ?? 0) > 0,
    has_missing_evidence: missingEvidence.length > 0,
    evidence_refs: proposal?.evidence_summary.evidence_refs ?? [],
    missing_evidence: missingEvidence,
  };
}

function finalizeEvidenceSummary({
  proposal,
  evidenceSummary,
  blockingReasons,
  missingEvidence,
}: {
  proposal?: DogfoodReuseRecordProposal | null;
  evidenceSummary: DogfoodReuseOperatorDecisionEvidenceSummary;
  blockingReasons: string[];
  missingEvidence: string[];
}): DogfoodReuseOperatorDecisionEvidenceSummary {
  const blockedInsufficientDataState =
    !proposal ||
    proposal.proposal_status === "blocked_insufficient_data" ||
    proposal.proposal_status === "blocked_missing_feedback_draft";

  return {
    ...evidenceSummary,
    has_insufficient_data:
      evidenceSummary.has_insufficient_data ||
      blockedInsufficientDataState ||
      missingEvidence.length > 0,
    has_blocking_reasons: blockingReasons.length > 0,
    has_missing_evidence: missingEvidence.length > 0,
    missing_evidence: missingEvidence,
  };
}

function buildBlockingReasons({
  proposal,
  evidenceSummary,
}: {
  proposal?: DogfoodReuseRecordProposal | null;
  evidenceSummary: DogfoodReuseOperatorDecisionEvidenceSummary;
}): string[] {
  return uniqueSortedStrings([
    ...(proposal ? [] : ["blocked_missing_proposal"]),
    ...(proposal?.blocked_reasons ?? []),
    ...(proposal &&
    proposal.proposal_status !== "proposal_ready_for_operator_review"
      ? [`proposal_status:${proposal.proposal_status}`]
      : []),
    ...(!evidenceSummary.has_result_report
      ? ["blocked_missing_actual_result_report"]
      : []),
    ...(!evidenceSummary.has_context_rationale
      ? ["blocked_missing_handoff_context_rationale"]
      : []),
    ...(!evidenceSummary.has_explicit_context_feedback
      ? ["blocked_missing_explicit_context_feedback"]
      : []),
    ...(proposal?.insufficient_data_reasons.some((reason) =>
      reason.includes("blocked_private_or_raw_payload"),
    )
      ? ["blocked_private_or_raw_payload"]
      : []),
    ...(proposal?.insufficient_data_reasons.some((reason) =>
      reason.includes("blocked_forbidden_authority"),
    )
      ? ["blocked_forbidden_authority"]
      : []),
  ]);
}

function buildMissingEvidence({
  proposal,
  evidenceSummary,
}: {
  proposal?: DogfoodReuseRecordProposal | null;
  evidenceSummary: DogfoodReuseOperatorDecisionEvidenceSummary;
}): string[] {
  return uniqueSortedStrings([
    ...evidenceSummary.missing_evidence,
    ...(proposal?.insufficient_data_reasons ?? []),
  ]);
}

function buildWriteReadiness({
  proposal,
  blockingReasons,
  missingEvidence,
}: {
  proposal?: DogfoodReuseRecordProposal | null;
  blockingReasons: string[];
  missingEvidence: string[];
}): DogfoodReuseWriteReadiness {
  const evidenceSummary = proposal?.evidence_summary;
  const writeReady =
    Boolean(proposal) &&
    proposal?.proposal_status === "proposal_ready_for_operator_review" &&
    blockingReasons.length === 0 &&
    missingEvidence.length === 0 &&
    Boolean(evidenceSummary?.has_result_report) &&
    Boolean(evidenceSummary?.has_context_rationale) &&
    Boolean(evidenceSummary?.has_expected_return_signal) &&
    Boolean(evidenceSummary?.has_observed_return_signal) &&
    Boolean(evidenceSummary?.has_explicit_context_feedback);

  return {
    write_ready: writeReady,
    readiness_label: buildReadinessLabel({
      proposal,
      writeReady,
      blockingReasons,
      missingEvidence,
    }),
    requires_actual_result_report: true,
    requires_explicit_context_feedback: true,
    requires_operator_confirmation: true,
    requires_no_blockers: true,
    requires_evidence_backing: true,
    requires_skipped_checks_review:
      proposal?.evidence_summary.has_skipped_or_unverified_checks ?? false,
    current_blockers: blockingReasons,
    current_missing_evidence: missingEvidence,
    confidence:
      proposal?.proposed_expected_observed_summary.confidence ??
      "insufficient_data",
  };
}

function buildReadinessLabel({
  proposal,
  writeReady,
  blockingReasons,
  missingEvidence,
}: {
  proposal?: DogfoodReuseRecordProposal | null;
  writeReady: boolean;
  blockingReasons: string[];
  missingEvidence: string[];
}): string {
  if (!proposal) {
    return "blocked: missing dogfood/reuse record proposal";
  }
  if (proposal.evidence_summary.has_result_report === false) {
    return "blocked: actual Codex result report required";
  }
  if (proposal.evidence_summary.has_explicit_context_feedback === false) {
    return "needs more evidence: explicit context reuse feedback required";
  }
  if (blockingReasons.length > 0) {
    return "blocked: unresolved proposal blockers remain";
  }
  if (missingEvidence.length > 0) {
    return "needs more evidence: missing evidence remains";
  }
  if (writeReady) {
    return "ready for operator decision preview; future write still requires explicit approval";
  }
  return "needs operator judgment before any future write";
}

function determineDecisionPreviewStatus({
  proposal,
  writeReadiness,
}: {
  proposal?: DogfoodReuseRecordProposal | null;
  writeReadiness: DogfoodReuseWriteReadiness;
}): DogfoodReuseOperatorDecisionPreviewStatus {
  if (!proposal) return "blocked_missing_proposal";
  if (proposal.proposal_status === "blocked_missing_feedback_draft") {
    return "blocked_insufficient_data";
  }
  if (proposal.proposal_status === "blocked_insufficient_data") {
    return "blocked_insufficient_data";
  }
  if (proposal.proposal_status === "needs_more_result_signal") {
    return "needs_more_evidence";
  }
  if (writeReadiness.write_ready) return "ready_for_operator_decision";
  return "needs_operator_judgment";
}

function determineRecommendedOperatorDecision({
  proposal,
  writeReadiness,
}: {
  proposal?: DogfoodReuseRecordProposal | null;
  writeReadiness: DogfoodReuseWriteReadiness;
}): DogfoodReuseRecommendedOperatorDecision {
  if (writeReadiness.write_ready) return "approve_for_future_write";
  if (!proposal) return "request_more_evidence";
  if (proposal.evidence_summary.has_result_report === false) {
    return "defer_until_result_report_supplied";
  }
  if (proposal.proposal_status === "blocked_insufficient_data") {
    return "reject_as_insufficient_data";
  }
  if (proposal.evidence_summary.has_explicit_context_feedback === false) {
    return "request_more_evidence";
  }
  return "keep_as_candidate_only";
}

function buildWouldWritePreview(
  proposal?: DogfoodReuseRecordProposal | null,
): DogfoodReuseWouldWritePreview {
  return {
    proposed_record_kind: proposal?.proposed_record_kind ?? null,
    proposed_dogfood_signal_summary: buildDogfoodSignalSummary(proposal),
    proposed_reuse_bucket_counts: buildBucketCounts(proposal),
    proposed_reuse_classifications:
      proposal?.proposed_reuse_classifications ?? null,
    proposed_expected_observed_summary:
      proposal?.proposed_expected_observed_summary ?? null,
    evidence_refs: proposal?.evidence_summary.evidence_refs ?? [],
    carry_forward_candidates:
      proposal?.carry_forward_candidates ?? DEFAULT_CARRY_FORWARD_CANDIDATES,
    confidence:
      proposal?.proposed_expected_observed_summary.confidence ??
      "insufficient_data",
  };
}

function buildDogfoodSignalSummary(
  proposal?: DogfoodReuseRecordProposal | null,
): DogfoodReuseDogfoodSignalSummary {
  return {
    requirement_progress_observed:
      proposal?.proposed_dogfood_signal.requirement_progress_observed ?? [],
    checks_observed: proposal?.proposed_dogfood_signal.checks_observed ?? [],
    skipped_or_unverified_checks:
      proposal?.proposed_dogfood_signal.skipped_or_unverified_checks ?? [],
    not_done_items: proposal?.proposed_dogfood_signal.not_done_items ?? [],
    mismatch_summary:
      proposal?.proposed_dogfood_signal.mismatch_summary ??
      "No dogfood/reuse record proposal was supplied.",
    context_feedback_signal_present:
      proposal?.proposed_dogfood_signal.context_feedback_signal_present ??
      false,
    review_burden_hint:
      proposal?.proposed_dogfood_signal.review_burden_hint ?? null,
    handoff_quality_hint:
      proposal?.proposed_dogfood_signal.handoff_quality_hint ?? null,
  };
}

function buildBucketCounts(
  proposal?: DogfoodReuseRecordProposal | null,
): DogfoodReuseBucketCounts {
  const classifications = proposal?.proposed_reuse_classifications;
  return {
    helpful_refs: classifications?.helpful_refs.length ?? 0,
    stale_refs: classifications?.stale_refs.length ?? 0,
    missing_refs: classifications?.missing_refs.length ?? 0,
    noisy_refs: classifications?.noisy_refs.length ?? 0,
    misleading_refs: classifications?.misleading_refs.length ?? 0,
    unknown_refs: classifications?.unknown_refs.length ?? 0,
  };
}

function buildWouldNotWrite(): string[] {
  return [
    "persisted operator review decision",
    "durable dogfood ledger row",
    "dogfood metric update",
    "Perspective state",
    "memory item",
    "promotion decision",
    "Formation Receipt",
    "GitHub/Codex action",
    "handoff send",
  ];
}

function buildApprovalRequirements(): string[] {
  return [
    "Actual result report is supplied and source/ref is visible.",
    "Result report matches the intended Codex run, PR, branch, or commit.",
    "Changed files and checks are confirmed.",
    "Skipped or unverified checks are reviewed and not counted as success.",
    "Reuse classifications are evidence-backed.",
    "Unknown refs remain unknown.",
    "Insufficient-data reasons are resolved or explicitly accepted as non-write blockers.",
    "Operator explicitly approves a future write action.",
  ];
}

function buildReviewChecklist(
  proposal?: DogfoodReuseRecordProposal | null,
): string[] {
  return uniqueSortedStrings([
    "Confirm this preview is not a persisted approve/defer/reject decision.",
    "Confirm would_write_preview matches the proposal under review.",
    "Confirm blocked and missing-evidence reasons are resolved before any future durable write.",
    ...buildApprovalRequirements(),
    ...(proposal?.operator_review_checklist ?? []),
  ]);
}

function buildSourceStatus(
  proposal?: DogfoodReuseRecordProposal | null,
): DogfoodReuseOperatorDecisionSourceStatus {
  return {
    proposal: proposal ? "supplied" : "missing",
    feedback_draft: proposal?.source_status.feedback_draft ?? "missing",
    codex_result_report:
      proposal?.source_status.codex_result_report ?? "missing",
    handoff_context_rationale:
      proposal?.source_status.handoff_context_rationale ?? "missing",
    codex_result_report_status:
      proposal?.source_status.codex_result_report_status ?? "missing",
  };
}

function buildFallbackReason({
  proposal,
  decisionPreviewStatus,
  blockingReasons,
  missingEvidence,
}: {
  proposal?: DogfoodReuseRecordProposal | null;
  decisionPreviewStatus: DogfoodReuseOperatorDecisionPreviewStatus;
  blockingReasons: string[];
  missingEvidence: string[];
}): string | null {
  if (!proposal) {
    return "Dogfood Reuse Record Proposal was not supplied; operator decision preview is blocked.";
  }
  if (decisionPreviewStatus === "ready_for_operator_decision") return null;
  return `Decision preview remains read-only and not write-ready because: ${[
    ...blockingReasons,
    ...missingEvidence,
  ]
    .slice(0, 6)
    .join(", ")}.`;
}

function buildSourceRefs(
  proposal?: DogfoodReuseRecordProposal | null,
): string[] {
  return uniqueSortedStrings([
    DOGFOOD_REUSE_OPERATOR_DECISION_PREVIEW_VERSION,
    ...(proposal
      ? [
          proposal.proposal_version,
          ...proposal.source_refs,
          ...(proposal.feedback_draft_refs.feedback_draft_ref
            ? [proposal.feedback_draft_refs.feedback_draft_ref]
            : []),
          ...(proposal.feedback_draft_refs.result_report_ref
            ? [
                `codex-result-report:${proposal.feedback_draft_refs.result_report_ref}`,
              ]
            : []),
        ]
      : ["missing_dogfood_reuse_record_proposal"]),
  ]);
}

function buildAuthorityBoundary(): DogfoodReuseOperatorDecisionAuthorityBoundary {
  return {
    read_only: true,
    candidate_material_only: true,
    source_of_truth: false,
    derived_read_model: true,
    can_persist_decision: false,
    can_write_db: false,
    can_write_dogfood_ledger: false,
    can_update_metrics: false,
    can_mutate_memory: false,
    can_promote_memory: false,
    can_apply_project_perspective: false,
    can_create_promotion_decision: false,
    can_create_formation_receipt: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_execute_codex: false,
    can_send_handoff: false,
    can_create_pr: false,
    can_merge_pr: false,
    can_run_autonomous_action: false,
    can_create_graph_or_vector_store: false,
    can_create_rag_stack: false,
    can_crawl_or_observe_browser: false,
    notes: [
      "Operator decision preview is read-only and advisory.",
      "It cannot persist a review decision, write a dogfood ledger, update metrics, mutate memory, apply Perspective state, call providers/GitHub/Codex, send handoffs, create stores/routes, or run autonomous actions.",
    ],
  };
}

function uniqueSortedStrings(values: readonly string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    ),
  ).sort();
}
