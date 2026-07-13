import { codexReviewProposalMapperInputFixture } from "@/fixtures/vnext/protocol/episode-delta-proposal-codex-review-v0-1";
import { normalizeCandidateIngressCandidateV01 } from "@/lib/intake/candidate-ingress-normalizer";
import type { CodexReviewEpisodeDeltaProposalInputV01 } from "@/lib/vnext/compat/episode-delta-proposal-from-codex-review";
import type { CandidateIngressNormalizedCandidate } from "@/types/candidate-ingress-normalizer";
import type { ExpectedObservedDeltaCandidateBuckets } from "@/types/expected-observed-delta-preview";

export const CODEX_REVIEW_DURABLE_SUMMARY_PILOT_POLICY_V01 =
  "Every Augnes-controlled production remote-model transport must pass a reviewed, versioned, bounded, fail-closed payload boundary before provider invocation. External native-host model execution that Augnes cannot enforce must be represented with accurate observed, advisory, or outside-coverage semantics. Any exception requires separate explicit review.";

export function codexReviewDurableRequirementMapperInputFixtureV01(
  sourceSignal: string = CODEX_REVIEW_DURABLE_SUMMARY_PILOT_POLICY_V01,
  options: {
    candidate_signal?: string;
  } = {},
): CodexReviewEpisodeDeltaProposalInputV01 {
  const input = clone(codexReviewProposalMapperInputFixture());
  const preview = input.expected_observed_delta_preview;
  const referenceCandidate = Object.values(preview.delta_candidates)
    .flat()
    .find(Boolean);
  if (!referenceCandidate) {
    throw new Error("Codex review fixture requires one reference candidate.");
  }
  const candidateSignal = options.candidate_signal ?? sourceSignal;
  const candidate = normalizeCandidateIngressCandidateV01({
    candidate_kind: "requirement",
    source_kind: "codex_result_report",
    label: "Requirement progress delta",
    summary: `Requirement progress requires operator review beyond PR or file presence: ${candidateSignal}`,
    source_ref: input.source_record.report_id,
    operator_ref: input.source_record.operator_actor_ref,
    session_ref: referenceCandidate.session_ref,
    project_ref: referenceCandidate.project_ref,
    work_ref: referenceCandidate.work_ref,
    result_ref: input.source_record.report_id,
    pr_ref: referenceCandidate.pr_ref,
    commit_ref: referenceCandidate.commit_ref,
    evidence_refs: preview.evidence_summary.evidence_refs,
    source_refs: preview.source_refs,
    confidence: "inferred_heuristic",
    generated_view: true,
    seed: `requirement:${candidateSignal}`,
  });
  if (!candidate) {
    throw new Error(
      "Codex review durable-summary candidate fixture is invalid.",
    );
  }

  preview.expected_summary = {
    expected_file_refs: [],
    expected_check_refs: [],
    expected_requirement_progress: [sourceSignal],
    expected_non_goals: [],
    expected_risks: [],
    expected_followups: [],
    expected_signal_refs: [],
    has_explicit_expected_material: true,
    derived_expected_signal_count: 0,
  };
  preview.observed_summary = {
    changed_files: [],
    passed_or_completed_checks: [],
    skipped_or_unverified_checks: [],
    not_done_items: [],
    requirement_progress: [sourceSignal],
    risks: [],
    followups: [],
    context_reuse_signals: [],
    observed_signal_refs: [candidate.candidate_id],
    has_observed_material: true,
  };
  preview.delta_candidates = emptyCandidateBuckets();
  preview.delta_candidates.requirement_progress_delta_candidates = [candidate];
  preview.input_summary = {
    has_work_episode_residue_candidate_preview: false,
    has_codex_result_report_intake_record_review: false,
    has_codex_result_report_intake_preview: true,
    has_explicit_expected_material: true,
    expected_signal_count: 1,
    observed_signal_count: 1,
    delta_candidate_count: 1,
    blocked_reason_count: 0,
    insufficient_data_reason_count: 0,
  };
  preview.delta_preview_status = "ready_for_operator_review";
  preview.recommended_next_action = "prepare_expected_observed_delta_decision";
  preview.mismatch_summary = {
    matched_expectation_count: 0,
    missing_expectation_count: 0,
    unexpected_observation_count: 0,
    skipped_or_unverified_check_count: 0,
    not_done_count: 0,
    changed_file_delta_count: 0,
    requirement_progress_delta_count: 1,
    non_goal_risk_count: 0,
    followup_delta_count: 0,
    context_reuse_signal_count: 0,
    summary: "requirement_progress_delta 1",
  };
  preview.requirement_progress_comparison = {
    expected_requirement_progress: [sourceSignal],
    observed_requirement_progress: [sourceSignal],
    requirement_progress_delta_candidates: [candidate],
    changed_files_are_not_requirement_completion: true,
  };
  preview.verification_comparison = {
    expected_checks: [],
    passed_or_completed_checks: [],
    skipped_or_unverified_checks: [],
    skipped_checks_count_as_passed: false,
  };
  preview.non_goal_comparison = {
    expected_non_goals: [],
    observed_risks: [],
    non_goal_risk_candidates: [],
  };
  preview.blocked_reasons = [];
  preview.insufficient_data_reasons = [];
  return input;
}

export function codexReviewDurableRequirementCandidateV01(
  input: CodexReviewEpisodeDeltaProposalInputV01,
): CandidateIngressNormalizedCandidate {
  const candidates =
    input.expected_observed_delta_preview.delta_candidates
      .requirement_progress_delta_candidates;
  if (candidates.length !== 1 || !candidates[0]) {
    throw new Error("Expected exactly one durable requirement candidate.");
  }
  return candidates[0];
}

function emptyCandidateBuckets(): ExpectedObservedDeltaCandidateBuckets {
  return {
    matched_expectation_candidates: [],
    missing_expectation_candidates: [],
    unexpected_observation_candidates: [],
    skipped_or_unverified_check_candidates: [],
    not_done_candidates: [],
    changed_file_delta_candidates: [],
    requirement_progress_delta_candidates: [],
    non_goal_risk_candidates: [],
    followup_delta_candidates: [],
    context_reuse_signal_candidates: [],
    review_only_candidates: [],
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
