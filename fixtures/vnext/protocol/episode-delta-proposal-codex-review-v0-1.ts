import legacyFixture from "@/fixtures/codex-result-report-ingestion.sample.v0.1.json";
import {
  CODEX_RESULT_MAPPER_PROJECT_ID,
  CODEX_RESULT_MAPPER_RECORDED_AT,
  CODEX_RESULT_MAPPER_RUN_ID,
  CODEX_RESULT_MAPPER_WORKSPACE_ID,
} from "@/fixtures/vnext/protocol/run-receipt-codex-result-report-v0-1";
import { normalizeCodexResultReportV01 } from "@/lib/dogfooding/codex-result-report-normalizer";
import { buildExpectedObservedDeltaPreviewV01 } from "@/lib/dogfooding/expected-observed-delta-preview";
import { buildCodexResultReportIntakePreviewV01 } from "@/lib/intake/codex-result-report-intake-preview";
import { normalizeCandidateIngressCandidateV01 } from "@/lib/intake/candidate-ingress-normalizer";
import type { CodexReviewEpisodeDeltaProposalInputV01 } from "@/lib/vnext/compat/episode-delta-proposal-from-codex-review";
import {
  EXTERNAL_REF_VERSION_V01,
  type ExternalRefV01,
} from "@/types/vnext/external-ref";

export const CODEX_REVIEW_PREVIEW_AS_OF = "2026-07-10T12:45:00.000Z";
export const CODEX_REVIEW_PROPOSAL_CREATED_AT =
  "2026-07-10T13:00:00.000Z";
export const CODEX_REVIEW_EVIDENCE_REF =
  "evidence:codex-review-conformance-source-only";

export const canonicalCodexReviewSourceRecord =
  normalizeCodexResultReportV01(legacyFixture.safe_input_example);

export const canonicalCodexReviewIntakePreview =
  buildCodexResultReportIntakePreviewV01({
    result_report: {
      ...legacyFixture.safe_input_example,
      evidence_refs: [CODEX_REVIEW_EVIDENCE_REF],
      work_ref: "work:codex-semantic-review-conformance",
      result_ref: canonicalCodexReviewSourceRecord.report_id,
      project_ref: "project-ref:codex-semantic-review-compatibility",
    },
    source_ref: canonicalCodexReviewSourceRecord.report_id,
    operator_ref: canonicalCodexReviewSourceRecord.operator_actor_ref,
    work_ref: "work:codex-semantic-review-conformance",
    result_ref: canonicalCodexReviewSourceRecord.report_id,
    project_ref: "project-ref:codex-semantic-review-compatibility",
    as_of: CODEX_REVIEW_PREVIEW_AS_OF,
    scope: canonicalCodexReviewSourceRecord.scope,
    source_refs: [
      canonicalCodexReviewSourceRecord.report_id,
      canonicalCodexReviewSourceRecord.report_fingerprint,
    ],
  });

export const canonicalExpectedObservedDeltaPreview =
  buildExpectedObservedDeltaPreviewV01({
    codex_result_report_intake_preview: canonicalCodexReviewIntakePreview,
    expected_material: {
      expected_files: legacyFixture.safe_input_example.expected_files,
      expected_checks: legacyFixture.safe_input_example.expected_checks,
      expected_requirement_progress: [
        "Codex semantic review material remains candidate-only and review-required.",
      ],
      expected_non_goals: [
        "No durable transition, Evidence acceptance, Perspective mutation, memory promotion, or work closure.",
      ],
      expected_risks: [
        "Legacy observed labels must not become direct observations.",
      ],
      expected_followups: [
        "Review mapped EpisodeDeltaProposal candidates explicitly.",
      ],
      handoff_ref: null,
      work_ref: "work:codex-semantic-review-conformance",
      result_ref: canonicalCodexReviewSourceRecord.report_id,
      source_refs: [
        canonicalCodexReviewSourceRecord.report_id,
        canonicalCodexReviewSourceRecord.report_fingerprint,
      ],
      evidence_refs: [CODEX_REVIEW_EVIDENCE_REF],
    },
    scope: canonicalCodexReviewSourceRecord.scope,
    as_of: CODEX_REVIEW_PREVIEW_AS_OF,
    source_refs: [
      canonicalCodexReviewSourceRecord.report_id,
      canonicalCodexReviewSourceRecord.report_fingerprint,
    ],
  });

export const codexReviewTaskContextPacketRefFixture: ExternalRefV01 = {
  ref_version: EXTERNAL_REF_VERSION_V01,
  ref_type: "task_context_packet",
  external_id: "task-context-packet:codex-review-chain-fixture",
  trust_class: "direct_local_observation",
  observed_at: CODEX_REVIEW_PREVIEW_AS_OF,
  source_ref: `sha256:${"3".repeat(64)}`,
  compatibility_namespace: "augnes.vnext.task-context-packet.v0.1",
};

export function codexReviewProposalMapperInputFixture({
  task_context_packet_ref = null,
  workspace_id = CODEX_RESULT_MAPPER_WORKSPACE_ID,
  project_id = CODEX_RESULT_MAPPER_PROJECT_ID,
}: {
  task_context_packet_ref?: ExternalRefV01 | null;
  workspace_id?: string;
  project_id?: string;
} = {}): CodexReviewEpisodeDeltaProposalInputV01 {
  return {
    workspace_id,
    project_id,
    run_id: CODEX_RESULT_MAPPER_RUN_ID,
    receipt_recorded_at: CODEX_RESULT_MAPPER_RECORDED_AT,
    proposal_created_at: CODEX_REVIEW_PROPOSAL_CREATED_AT,
    data_classification: "public_safe",
    source_record: canonicalCodexReviewSourceRecord,
    expected_observed_delta_preview: canonicalExpectedObservedDeltaPreview,
    source_currentness: {
      status: "fresh",
      as_of: CODEX_REVIEW_PREVIEW_AS_OF,
      basis:
        "The conformance fixture explicitly binds the current ExpectedObservedDelta preview time.",
    },
    task_context_packet_ref,
  };
}

export function codexReviewDistinctCandidateRelationsInputFixture(): CodexReviewEpisodeDeltaProposalInputV01 {
  const input = clone(codexReviewProposalMapperInputFixture());
  const preview = input.expected_observed_delta_preview;
  const referenceCandidate = Object.values(preview.delta_candidates)
    .flat()
    .find(Boolean)!;
  const skippedSignal = canonicalCodexReviewSourceRecord.skipped_check_refs[0]!;
  const notDoneSignal = canonicalCodexReviewSourceRecord.not_done_refs[0]!;
  const skippedCandidate = normalizeCandidateIngressCandidateV01({
    candidate_kind: "risk_or_blocker",
    source_kind: "codex_result_report",
    label: "Skipped or unverified check",
    summary: `Skipped or unverified check is not counted as passed: ${skippedSignal}`,
    source_ref: referenceCandidate.source_ref,
    operator_ref: referenceCandidate.operator_ref,
    work_ref: referenceCandidate.work_ref,
    result_ref: canonicalCodexReviewSourceRecord.report_id,
    evidence_refs: referenceCandidate.evidence_refs,
    source_refs: referenceCandidate.source_refs,
    confidence: "inferred_heuristic",
    generated_view: true,
    seed: `skipped:${skippedSignal}`,
  })!;
  const notDoneCandidate = normalizeCandidateIngressCandidateV01({
    candidate_kind: "next_action",
    source_kind: "codex_result_report",
    label: "Not done item",
    summary: `Not-done item is not counted as completed work: ${notDoneSignal}`,
    source_ref: referenceCandidate.source_ref,
    operator_ref: referenceCandidate.operator_ref,
    work_ref: referenceCandidate.work_ref,
    result_ref: canonicalCodexReviewSourceRecord.report_id,
    evidence_refs: referenceCandidate.evidence_refs,
    source_refs: referenceCandidate.source_refs,
    confidence: "inferred_heuristic",
    generated_view: true,
    seed: `not-done:${notDoneSignal}`,
  })!;

  preview.observed_summary.passed_or_completed_checks =
    preview.observed_summary.passed_or_completed_checks.filter(
      (value) => value !== skippedSignal,
    );
  preview.observed_summary.skipped_or_unverified_checks = [skippedSignal];
  preview.observed_summary.followups = preview.observed_summary.followups.filter(
    (value) => value !== notDoneSignal,
  );
  preview.observed_summary.not_done_items = [notDoneSignal];
  preview.delta_candidates.unexpected_observation_candidates =
    preview.delta_candidates.unexpected_observation_candidates.filter(
      (candidate) => !candidate.summary.endsWith(skippedSignal),
    );
  preview.delta_candidates.followup_delta_candidates =
    preview.delta_candidates.followup_delta_candidates.filter(
      (candidate) => !candidate.summary.endsWith(notDoneSignal),
    );
  preview.delta_candidates.skipped_or_unverified_check_candidates = [
    skippedCandidate,
  ];
  preview.delta_candidates.not_done_candidates = [notDoneCandidate];
  preview.verification_comparison.passed_or_completed_checks =
    preview.observed_summary.passed_or_completed_checks;
  preview.verification_comparison.skipped_or_unverified_checks = [
    skippedSignal,
  ];
  preview.input_summary.delta_candidate_count = Object.values(
    preview.delta_candidates,
  ).reduce((total, candidates) => total + candidates.length, 0);
  preview.mismatch_summary.unexpected_observation_count =
    preview.delta_candidates.unexpected_observation_candidates.length;
  preview.mismatch_summary.skipped_or_unverified_check_count = 1;
  preview.mismatch_summary.not_done_count = 1;
  preview.mismatch_summary.followup_delta_count =
    preview.delta_candidates.followup_delta_candidates.length;
  preview.mismatch_summary.summary = [
    `matched ${preview.mismatch_summary.matched_expectation_count}`,
    `missing ${preview.mismatch_summary.missing_expectation_count}`,
    `unexpected ${preview.mismatch_summary.unexpected_observation_count}`,
    "skipped_or_unverified 1",
    "not_done 1",
  ].join("; ");
  return input;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
