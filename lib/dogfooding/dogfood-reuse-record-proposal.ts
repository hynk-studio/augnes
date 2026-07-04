import type { CodexResultFeedbackDraft } from "@/types/codex-result-feedback-draft";
import {
  DOGFOOD_REUSE_RECORD_PROPOSAL_VERSION,
  type DogfoodReuseEvidenceSummary,
  type DogfoodReuseFeedbackDraftRefs,
  type DogfoodReuseProposedClassifications,
  type DogfoodReuseProposedSignal,
  type DogfoodReuseRecordProposal,
  type DogfoodReuseRecordProposalAuthorityBoundary,
  type DogfoodReuseRecordProposalSourceStatus,
  type DogfoodReuseRecordProposalStatus,
} from "@/types/dogfood-reuse-record-proposal";

const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z" as const;
const DEFAULT_SCOPE = "project:augnes" as const;

export type DogfoodReuseRecordProposalInput = {
  feedback_draft?: CodexResultFeedbackDraft | null;
  as_of?: string;
};

export function buildDogfoodReuseRecordProposal({
  feedback_draft: feedbackDraft,
  as_of,
}: DogfoodReuseRecordProposalInput): DogfoodReuseRecordProposal {
  const evidenceSummary = buildEvidenceSummary(feedbackDraft);
  const insufficientDataReasons = buildInsufficientDataReasons({
    feedbackDraft,
    evidenceSummary,
  });
  const blockedReasons = buildBlockedReasons({
    feedbackDraft,
    evidenceSummary,
    insufficientDataReasons,
  });
  const proposalStatus = determineProposalStatus({
    feedbackDraft,
    evidenceSummary,
    blockedReasons,
    insufficientDataReasons,
  });

  return {
    runtime: "augnes",
    proposal_version: DOGFOOD_REUSE_RECORD_PROPOSAL_VERSION,
    scope: feedbackDraft?.scope ?? DEFAULT_SCOPE,
    as_of: as_of ?? feedbackDraft?.as_of ?? FALLBACK_AS_OF,
    source_refs: buildSourceRefs(feedbackDraft),
    feedback_draft_refs: buildFeedbackDraftRefs(feedbackDraft),
    proposed_record_kind: "handoff_reuse_outcome_candidate",
    proposal_status: proposalStatus,
    proposed_dogfood_signal: buildProposedDogfoodSignal(feedbackDraft),
    proposed_reuse_classifications:
      buildProposedReuseClassifications(feedbackDraft),
    proposed_expected_observed_summary:
      buildExpectedObservedSummary(feedbackDraft),
    evidence_summary: evidenceSummary,
    review_required: true,
    operator_review_checklist: buildOperatorReviewChecklist(),
    blocked_reasons: blockedReasons,
    insufficient_data_reasons: insufficientDataReasons,
    carry_forward_candidates: {
      next_relay_update_suggestions:
        feedbackDraft?.carry_forward_suggestions
          .next_relay_update_suggestions ?? [],
      next_handoff_adjustments:
        feedbackDraft?.carry_forward_suggestions.next_handoff_adjustments ?? [],
      refs_to_preserve_next_time:
        feedbackDraft?.carry_forward_suggestions.refs_to_preserve_next_time ?? [],
      refs_to_warn_next_time:
        feedbackDraft?.carry_forward_suggestions.refs_to_warn_next_time ?? [],
      refs_to_drop_or_deprioritize:
        feedbackDraft?.carry_forward_suggestions
          .refs_to_drop_or_deprioritize ?? [],
      unresolved_gaps:
        feedbackDraft?.carry_forward_suggestions.unresolved_gaps ?? [],
      next_focus_candidate:
        feedbackDraft?.carry_forward_suggestions.next_focus_candidate ??
        "Supply an operator-reviewed Codex result report before proposing a dogfood/reuse record.",
    },
    non_goals: [
      "No durable Handoff Reuse Outcome Ledger write.",
      "No dogfood metric integration or metric update.",
      "No Perspective apply, promotion decision, Formation Receipt, or durable memory mutation.",
      "No provider, GitHub, Codex execution, handoff send, graph/vector/RAG/crawler/browser observer, autonomous action, DB migration, route, or store.",
    ],
    authority_boundary: buildAuthorityBoundary(),
    source_status: buildSourceStatus(feedbackDraft),
    fallback_reason: buildFallbackReason({
      feedbackDraft,
      blockedReasons,
      insufficientDataReasons,
    }),
    notes: [
      "Derived from an existing Codex Result Feedback Draft.",
      "This proposal previews what an operator could review for a later dogfood/reuse record; it does not write that record.",
    ],
  };
}

function buildFeedbackDraftRefs(
  feedbackDraft?: CodexResultFeedbackDraft | null,
): DogfoodReuseFeedbackDraftRefs {
  return {
    feedback_draft_ref: feedbackDraft
      ? `codex-result-feedback-draft:${feedbackDraft.draft_version}`
      : null,
    feedback_draft_version: feedbackDraft?.draft_version ?? null,
    result_report_ref: feedbackDraft?.result_report_refs.result_report_ref ?? null,
    result_report_fingerprint:
      feedbackDraft?.result_report_refs.result_report_fingerprint ?? null,
    context_relay_rationale_ref:
      feedbackDraft?.handoff_context_refs.context_relay_rationale_ref ?? null,
    continuity_relay_ref:
      feedbackDraft?.handoff_context_refs.continuity_relay_ref ?? null,
    source_refs: feedbackDraft?.source_refs ?? [],
  };
}

function buildProposedDogfoodSignal(
  feedbackDraft?: CodexResultFeedbackDraft | null,
): DogfoodReuseProposedSignal {
  const expectedObserved = feedbackDraft?.expected_observed_delta;
  const reuseOutcome = feedbackDraft?.reuse_outcome_draft;
  const explicitContextFeedbackCount =
    (reuseOutcome?.helpful_refs.length ?? 0) +
    (reuseOutcome?.stale_refs.length ?? 0) +
    (reuseOutcome?.missing_refs.length ?? 0) +
    (reuseOutcome?.noisy_refs.length ?? 0) +
    (reuseOutcome?.misleading_refs.length ?? 0);

  return {
    requirement_progress_observed:
      expectedObserved?.requirement_progress_observed ?? [],
    checks_observed: expectedObserved?.checks_observed ?? [],
    skipped_or_unverified_checks:
      expectedObserved?.skipped_or_unverified_checks ?? [],
    not_done_items: expectedObserved?.not_done_items ?? [],
    mismatch_summary:
      expectedObserved?.mismatch_summary ??
      "No Codex Result Feedback Draft was supplied.",
    context_feedback_signal_present: explicitContextFeedbackCount > 0,
    stale_or_gap_warnings: feedbackDraft?.stale_or_gap_warnings ?? [],
    review_burden_hint: buildReviewBurdenHint({
      feedbackDraft,
      explicitContextFeedbackCount,
    }),
    handoff_quality_hint: buildHandoffQualityHint({
      feedbackDraft,
      explicitContextFeedbackCount,
    }),
    confidence: expectedObserved?.confidence ?? "insufficient_data",
  };
}

function buildProposedReuseClassifications(
  feedbackDraft?: CodexResultFeedbackDraft | null,
): DogfoodReuseProposedClassifications {
  const reuseOutcome = feedbackDraft?.reuse_outcome_draft;
  return {
    helpful_refs: reuseOutcome?.helpful_refs ?? [],
    stale_refs: reuseOutcome?.stale_refs ?? [],
    missing_refs: reuseOutcome?.missing_refs ?? [],
    noisy_refs: reuseOutcome?.noisy_refs ?? [],
    misleading_refs: reuseOutcome?.misleading_refs ?? [],
    unknown_refs: reuseOutcome?.unknown_refs ?? [],
    corrections_needed: reuseOutcome?.context_corrections_needed ?? [],
    refs_to_preserve_next_time:
      feedbackDraft?.carry_forward_suggestions.refs_to_preserve_next_time ?? [],
    refs_to_warn_next_time:
      feedbackDraft?.carry_forward_suggestions.refs_to_warn_next_time ?? [],
    refs_to_drop_or_deprioritize:
      feedbackDraft?.carry_forward_suggestions
        .refs_to_drop_or_deprioritize ?? [],
    confidence: reuseOutcome?.confidence ?? "insufficient_data",
    review_needed: true,
  };
}

function buildExpectedObservedSummary(
  feedbackDraft?: CodexResultFeedbackDraft | null,
) {
  const expectedObserved = feedbackDraft?.expected_observed_delta;
  return {
    matched_expectation_count:
      expectedObserved?.matched_expectations.length ?? 0,
    missing_expectation_count:
      expectedObserved?.missing_expectations.length ?? 0,
    unexpected_observation_count:
      expectedObserved?.unexpected_observations.length ?? 0,
    skipped_or_unverified_check_count:
      expectedObserved?.skipped_or_unverified_checks.length ?? 0,
    changed_files_observed: expectedObserved?.changed_files_observed ?? [],
    checks_observed: expectedObserved?.checks_observed ?? [],
    requirement_progress_observed:
      expectedObserved?.requirement_progress_observed ?? [],
    missing_expectations:
      expectedObserved?.missing_expectations.map((item) => item.field) ?? [],
    unexpected_observations:
      expectedObserved?.unexpected_observations.map((item) => item.field) ?? [],
    not_done_items: expectedObserved?.not_done_items ?? [],
    mismatch_summary:
      expectedObserved?.mismatch_summary ??
      "No expected/observed draft is available.",
    confidence: expectedObserved?.confidence ?? "insufficient_data",
  };
}

function buildEvidenceSummary(
  feedbackDraft?: CodexResultFeedbackDraft | null,
): DogfoodReuseEvidenceSummary {
  const observed = feedbackDraft?.observed_return_signal;
  const reuseOutcome = feedbackDraft?.reuse_outcome_draft;
  const explicitContextFeedbackCount =
    (reuseOutcome?.helpful_refs.length ?? 0) +
    (reuseOutcome?.stale_refs.length ?? 0) +
    (reuseOutcome?.missing_refs.length ?? 0) +
    (reuseOutcome?.noisy_refs.length ?? 0) +
    (reuseOutcome?.misleading_refs.length ?? 0);
  const hasObservedReturnSignal =
    Boolean(observed) &&
    [
      observed?.changed_files,
      observed?.checks_run,
      observed?.skipped_checks,
      observed?.requirement_progress,
      observed?.context_helpful_or_stale_refs,
      observed?.unresolved_gaps,
      observed?.next_relay_update_suggestions,
    ].some((values) => (values?.length ?? 0) > 0);

  const evidenceRefs = uniqueSortedStrings([
    ...(feedbackDraft?.source_refs ?? []),
    ...(feedbackDraft?.result_report_refs.result_report_ref
      ? [`codex-result-report:${feedbackDraft.result_report_refs.result_report_ref}`]
      : []),
    ...(feedbackDraft?.result_report_refs.result_report_fingerprint
      ? [
          `codex-result-report-fingerprint:${feedbackDraft.result_report_refs.result_report_fingerprint}`,
        ]
      : []),
    ...(feedbackDraft?.handoff_context_refs.context_relay_rationale_ref
      ? [feedbackDraft.handoff_context_refs.context_relay_rationale_ref]
      : []),
    ...(feedbackDraft?.expected_observed_delta.matched_expectations.flatMap(
      (item) => item.source_refs,
    ) ?? []),
    ...(feedbackDraft?.reuse_outcome_draft.helpful_refs.flatMap(
      (ref) => ref.evidence_refs,
    ) ?? []),
    ...(feedbackDraft?.reuse_outcome_draft.stale_refs.flatMap(
      (ref) => ref.evidence_refs,
    ) ?? []),
    ...(feedbackDraft?.reuse_outcome_draft.missing_refs.flatMap(
      (ref) => ref.evidence_refs,
    ) ?? []),
    ...(feedbackDraft?.reuse_outcome_draft.noisy_refs.flatMap(
      (ref) => ref.evidence_refs,
    ) ?? []),
    ...(feedbackDraft?.reuse_outcome_draft.misleading_refs.flatMap(
      (ref) => ref.evidence_refs,
    ) ?? []),
  ]);

  const missingEvidence = uniqueSortedStrings([
    ...(feedbackDraft ? [] : ["missing_feedback_draft"]),
    ...(feedbackDraft?.source_status.codex_result_report === "supplied"
      ? []
      : ["missing_codex_result_report"]),
    ...(feedbackDraft?.source_status.handoff_context_rationale === "supplied"
      ? []
      : ["missing_handoff_context_rationale"]),
    ...(feedbackDraft?.expected_return_signal.required_fields.length
      ? []
      : ["missing_expected_return_signal"]),
    ...(hasObservedReturnSignal ? [] : ["missing_observed_return_signal"]),
    ...(explicitContextFeedbackCount > 0
      ? []
      : ["missing_explicit_context_feedback"]),
  ]);

  return {
    has_feedback_draft: Boolean(feedbackDraft),
    has_result_report:
      feedbackDraft?.source_status.codex_result_report === "supplied",
    has_context_rationale:
      feedbackDraft?.source_status.handoff_context_rationale === "supplied",
    has_expected_return_signal:
      (feedbackDraft?.expected_return_signal.required_fields.length ?? 0) > 0,
    has_observed_return_signal: hasObservedReturnSignal,
    has_explicit_context_feedback: explicitContextFeedbackCount > 0,
    has_skipped_or_unverified_checks:
      (feedbackDraft?.expected_observed_delta.skipped_or_unverified_checks
        .length ?? 0) > 0,
    has_insufficient_data:
      !feedbackDraft ||
      feedbackDraft.candidate_status === "insufficient_data" ||
      feedbackDraft.insufficient_data_reasons.length > 0,
    evidence_refs: evidenceRefs,
    missing_evidence: missingEvidence,
  };
}

function buildInsufficientDataReasons({
  feedbackDraft,
  evidenceSummary,
}: {
  feedbackDraft?: CodexResultFeedbackDraft | null;
  evidenceSummary: DogfoodReuseEvidenceSummary;
}): string[] {
  return uniqueSortedStrings([
    ...(feedbackDraft ? feedbackDraft.insufficient_data_reasons : []),
    ...evidenceSummary.missing_evidence,
  ]);
}

function buildBlockedReasons({
  feedbackDraft,
  evidenceSummary,
  insufficientDataReasons,
}: {
  feedbackDraft?: CodexResultFeedbackDraft | null;
  evidenceSummary: DogfoodReuseEvidenceSummary;
  insufficientDataReasons: string[];
}): string[] {
  return uniqueSortedStrings([
    ...(feedbackDraft ? [] : ["blocked_missing_feedback_draft"]),
    ...(!evidenceSummary.has_result_report
      ? ["blocked_missing_codex_result_report"]
      : []),
    ...(!evidenceSummary.has_context_rationale
      ? ["blocked_missing_handoff_context_rationale"]
      : []),
    ...(feedbackDraft?.candidate_status === "insufficient_data"
      ? ["blocked_feedback_draft_insufficient_data"]
      : []),
    ...(insufficientDataReasons.some((reason) =>
      reason.includes("blocked_private_or_raw_payload"),
    )
      ? ["blocked_private_or_raw_payload"]
      : []),
    ...(insufficientDataReasons.some((reason) =>
      reason.includes("blocked_forbidden_authority"),
    )
      ? ["blocked_forbidden_authority"]
      : []),
  ]);
}

function determineProposalStatus({
  feedbackDraft,
  evidenceSummary,
  blockedReasons,
  insufficientDataReasons,
}: {
  feedbackDraft?: CodexResultFeedbackDraft | null;
  evidenceSummary: DogfoodReuseEvidenceSummary;
  blockedReasons: string[];
  insufficientDataReasons: string[];
}): DogfoodReuseRecordProposalStatus {
  if (!feedbackDraft) return "blocked_missing_feedback_draft";
  if (
    blockedReasons.length > 0 ||
    insufficientDataReasons.includes("missing_codex_result_report") ||
    insufficientDataReasons.includes("missing_handoff_context_rationale")
  ) {
    return "blocked_insufficient_data";
  }
  if (
    !evidenceSummary.has_explicit_context_feedback ||
    feedbackDraft.expected_observed_delta.missing_expectations.length > 0
  ) {
    return "needs_more_result_signal";
  }
  return "proposal_ready_for_operator_review";
}

function buildSourceStatus(
  feedbackDraft?: CodexResultFeedbackDraft | null,
): DogfoodReuseRecordProposalSourceStatus {
  return {
    feedback_draft: feedbackDraft ? "supplied" : "missing",
    codex_result_report:
      feedbackDraft?.source_status.codex_result_report ?? "missing",
    handoff_context_rationale:
      feedbackDraft?.source_status.handoff_context_rationale ?? "missing",
    codex_result_report_status:
      feedbackDraft?.source_status.codex_result_report_status ?? "missing",
  };
}

function buildFallbackReason({
  feedbackDraft,
  blockedReasons,
  insufficientDataReasons,
}: {
  feedbackDraft?: CodexResultFeedbackDraft | null;
  blockedReasons: string[];
  insufficientDataReasons: string[];
}): string | null {
  if (!feedbackDraft) {
    return "Codex Result Feedback Draft was not supplied; dogfood/reuse record proposal is blocked.";
  }
  if (blockedReasons.length > 0 || insufficientDataReasons.length > 0) {
    return `Proposal remains candidate-only and blocked/insufficient because: ${[
      ...blockedReasons,
      ...insufficientDataReasons,
    ]
      .slice(0, 6)
      .join(", ")}.`;
  }
  return null;
}

function buildReviewBurdenHint({
  feedbackDraft,
  explicitContextFeedbackCount,
}: {
  feedbackDraft?: CodexResultFeedbackDraft | null;
  explicitContextFeedbackCount: number;
}): string {
  if (!feedbackDraft) return "high: no feedback draft supplied";
  if (feedbackDraft.insufficient_data_reasons.length > 0) {
    return `high: ${feedbackDraft.insufficient_data_reasons.length} insufficient_data reasons`;
  }
  if (feedbackDraft.expected_observed_delta.skipped_or_unverified_checks.length > 0) {
    return "medium: skipped or unverified checks require operator review";
  }
  if (explicitContextFeedbackCount === 0) {
    return "medium: context reuse feedback is not explicit";
  }
  return "medium: operator review required before any durable dogfood write";
}

function buildHandoffQualityHint({
  feedbackDraft,
  explicitContextFeedbackCount,
}: {
  feedbackDraft?: CodexResultFeedbackDraft | null;
  explicitContextFeedbackCount: number;
}): string {
  if (!feedbackDraft) return "insufficient_data: no feedback draft supplied";
  if (feedbackDraft.source_status.codex_result_report !== "supplied") {
    return "insufficient_data: no Codex result report supplied";
  }
  if (explicitContextFeedbackCount === 0) {
    return "needs_more_result_signal: selected context refs were not explicitly classified";
  }
  return "reviewable: explicit context reuse classifications are present";
}

function buildOperatorReviewChecklist(): string[] {
  return [
    "Confirm the result report is from the actual intended Codex run.",
    "Confirm changed files and checks match the PR/result.",
    "Confirm skipped checks are not counted as success.",
    "Confirm helpful/stale/missing/noisy/misleading refs are evidence-backed.",
    "Confirm unknown refs remain unknown.",
    "Confirm carry-forward suggestions are candidates only.",
    "Confirm no durable memory, dogfood ledger, metrics, or Perspective state is updated by this preview.",
  ];
}

function buildSourceRefs(
  feedbackDraft?: CodexResultFeedbackDraft | null,
): string[] {
  return uniqueSortedStrings([
    DOGFOOD_REUSE_RECORD_PROPOSAL_VERSION,
    ...(feedbackDraft
      ? [
          feedbackDraft.draft_version,
          ...feedbackDraft.source_refs,
          ...(feedbackDraft.result_report_refs.result_report_ref
            ? [
                `codex-result-report:${feedbackDraft.result_report_refs.result_report_ref}`,
              ]
            : []),
          ...(feedbackDraft.handoff_context_refs.context_relay_rationale_ref
            ? [feedbackDraft.handoff_context_refs.context_relay_rationale_ref]
            : []),
        ]
      : ["missing_codex_result_feedback_draft"]),
  ]);
}

function buildAuthorityBoundary(): DogfoodReuseRecordProposalAuthorityBoundary {
  return {
    read_only: true,
    candidate_material_only: true,
    source_of_truth: false,
    derived_read_model: true,
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
      "Proposal preview is read-only and advisory.",
      "It cannot write a dogfood ledger, update metrics, mutate memory, apply Perspective state, call providers/GitHub/Codex, send handoffs, or run autonomous actions.",
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
