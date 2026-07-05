import {
  isCandidateIngressPublicSafeRefV01,
  normalizeCandidateIngressCandidateV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import {
  CODEX_RESULT_REPORT_INTAKE_PREVIEW_VERSION,
  type CodexResultReportCandidateMaterial,
  type CodexResultReportIntakePreview,
} from "@/types/codex-result-report-intake-preview";
import {
  CODEX_RESULT_REPORT_INTAKE_RECORD_REVIEW_VERSION,
  type CodexResultReportIntakeRecordReview,
} from "@/types/codex-result-report-intake-record-review";
import type { CandidateIngressNormalizedCandidate } from "@/types/candidate-ingress-normalizer";
import {
  WORK_EPISODE_RESIDUE_CANDIDATE_PREVIEW_VERSION,
  type WorkEpisodeResidueCandidateAuthorityBoundary,
  type WorkEpisodeResidueCandidateMaterial,
  type WorkEpisodeResidueCandidatePreview,
  type WorkEpisodeResidueCandidatePreviewInput,
  type WorkEpisodeResidueCandidatePreviewStatus,
} from "@/types/work-episode-residue-candidate-preview";

const DEFAULT_SCOPE = "project:augnes" as const;
const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z" as const;

export function buildWorkEpisodeResidueCandidatePreviewV01({
  codex_result_report_intake_preview,
  codex_result_report_intake_record_review,
  scope,
  as_of,
  source_refs,
}: WorkEpisodeResidueCandidatePreviewInput = {}): WorkEpisodeResidueCandidatePreview {
  const intakePreview = isCodexResultReportIntakePreview(
    codex_result_report_intake_preview,
  )
    ? codex_result_report_intake_preview
    : null;
  const recordReview = isCodexResultReportIntakeRecordReview(
    codex_result_report_intake_record_review,
  )
    ? codex_result_report_intake_record_review
    : null;
  const sourceRefs = uniqueCandidateIngressStringsV01([
    ...(source_refs ?? []),
    ...(intakePreview?.source_refs ?? []),
    ...(recordReview?.source_refs ?? []),
  ]).filter(isCandidateIngressPublicSafeRefV01);
  const evidenceRefs = uniqueCandidateIngressStringsV01([
    ...(intakePreview?.evidence_summary.evidence_refs ?? []),
    ...(recordReview?.evidence_summary.evidence_refs ?? []),
  ]).filter(isCandidateIngressPublicSafeRefV01);
  const candidateResidue = mergeResidueMaterial([
    intakePreview ? residueFromIntakePreview(intakePreview) : emptyResidue(),
    recordReview ? residueFromRecordReview(recordReview) : emptyResidue(),
  ]);
  const residueCandidateCount = countResidue(candidateResidue);
  const recordCount = recordReview?.input_summary.valid_record_count ?? 0;
  const intakeCandidateCount =
    intakePreview?.input_summary.ingestable_candidate_count ?? 0;
  const intakeReadyForCandidateIngest =
    intakePreview?.readiness.ready_for_candidate_ingest_record === true;
  const hasIntakeCandidateMaterial =
    Boolean(intakePreview) &&
    intakePreview?.intake_preview_status !== "no_result_report" &&
    intakeCandidateCount > 0;
  const hasCodexResultMaterial = hasIntakeCandidateMaterial || recordCount > 0;
  const blockedReasons = uniqueCandidateIngressStringsV01([
    ...(intakePreview?.blocked_reasons ?? []),
    ...(recordReview?.blocked_reasons ?? []),
  ]);
  const insufficientDataReasons = uniqueCandidateIngressStringsV01([
    ...(!hasCodexResultMaterial
      ? ["codex_result_report_material_missing"]
      : []),
    ...(intakePreview?.insufficient_data_reasons ?? []),
    ...(recordReview?.insufficient_data_reasons ?? []),
    ...(residueCandidateCount === 0 ? ["work_episode_residue_candidates_missing"] : []),
  ]);
  const status = determineStatus({
    hasMaterial: hasCodexResultMaterial,
    residueCandidateCount,
    blockedReasons,
    insufficientDataReasons,
  });

  return {
    preview_version: WORK_EPISODE_RESIDUE_CANDIDATE_PREVIEW_VERSION,
    scope: scope ?? intakePreview?.scope ?? recordReview?.scope ?? DEFAULT_SCOPE,
    as_of: as_of ?? intakePreview?.as_of ?? recordReview?.as_of ?? FALLBACK_AS_OF,
    source_refs: sourceRefs,
    residue_preview_status: status,
    recommended_next_action: determineNextAction({
      status,
      hasIntakeCandidateMaterial,
      intakeReadyForCandidateIngest,
      recordCount,
      residueCandidateCount,
    }),
    input_summary: {
      has_codex_result_report_intake_preview: Boolean(intakePreview),
      has_codex_result_report_intake_records: recordCount > 0,
      intake_candidate_count: intakeCandidateCount,
      record_count: recordCount,
      residue_candidate_count: residueCandidateCount,
      blocker_count: blockedReasons.length,
      insufficient_data_count: insufficientDataReasons.length,
    },
    candidate_residue: candidateResidue,
    evidence_summary: {
      has_codex_result_material: hasCodexResultMaterial,
      has_candidate_residue: residueCandidateCount > 0,
      has_source_refs: sourceRefs.length > 0,
      has_evidence_refs: evidenceRefs.length > 0,
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      missing_evidence:
        residueCandidateCount > 0 && evidenceRefs.length === 0
          ? ["evidence_refs_missing_for_work_episode_residue_candidate_review"]
          : [],
    },
    blocked_reasons: blockedReasons,
    insufficient_data_reasons: insufficientDataReasons,
    operator_review_checklist: [
      "review_work_episode_residue_candidates",
      "confirm_residue_candidates_are_not_work_episode_records",
      "confirm_expected_observed_delta_and_reuse_outcome_are_later_preview_steps",
      "confirm_no_memory_perspective_cwp_relay_or_handoff_write",
    ],
    would_not_write: [
      "does_not_write_work_episode",
      "does_not_write_expected_observed_delta",
      "does_not_write_reuse_outcome_ledger",
      "does_not_write_dogfood_metrics",
      "does_not_write_memory",
      "does_not_write_perspective_unit",
      "does_not_write_next_work_bias",
      "does_not_update_current_working_perspective",
      "does_not_update_continuity_relay",
      "does_not_mutate_handoff_context",
      "does_not_send_handoff",
      "does_not_call_provider_openai_github_or_codex",
    ],
    non_goals: [
      "work_episode_durable_write",
      "expected_observed_delta_durable_write",
      "reuse_outcome_ledger_write",
      "dogfood_metric_write",
      "memory_write",
      "perspective_or_cwp_mutation",
      "handoff_apply_or_send",
      "provider_github_codex_call",
    ],
    authority_boundary: createWorkEpisodeResidueCandidateAuthorityBoundaryV01(),
  };
}

export function createWorkEpisodeResidueCandidateAuthorityBoundaryV01(): WorkEpisodeResidueCandidateAuthorityBoundary {
  return {
    read_only: true,
    candidate_material_only: true,
    source_of_truth: false,
    derived_read_model: true,
    can_write_work_episode: false,
    can_write_expected_observed_delta: false,
    can_write_reuse_outcome_ledger: false,
    can_write_dogfood_metrics: false,
    can_write_memory: false,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_update_current_working_perspective: false,
    can_mutate_current_working_perspective: false,
    can_update_continuity_relay: false,
    can_mutate_handoff_context: false,
    can_apply_handoff_context: false,
    can_write_selected_refs_to_live_handoff: false,
    can_send_handoff: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_execute_codex: false,
    can_create_pr: false,
    can_merge_pr: false,
    can_run_autonomous_action: false,
    can_create_graph_or_vector_store: false,
    can_create_rag_stack: false,
    can_crawl_or_observe_browser: false,
    notes: [
      "Work episode residue candidate preview is read-only and candidate-only.",
      "It bridges Codex result intake to later ExpectedObservedDelta and reuse outcome review without writing WorkEpisode, dogfood metrics, memory, Perspective, CWP, relay, handoff, provider, GitHub, or Codex state.",
    ],
  };
}

function residueFromIntakePreview(
  preview: CodexResultReportIntakePreview,
): WorkEpisodeResidueCandidateMaterial {
  const material = emptyResidue();
  copyCandidates(preview.candidate_material.result_summary_candidates, material.work_episode_summary_candidates);
  copyCandidates(preview.candidate_material.changed_file_candidates, material.changed_artifact_candidates);
  copyCandidates(preview.candidate_material.check_result_candidates, material.verification_result_candidates);
  copyCandidates(preview.candidate_material.skipped_check_candidates, material.skipped_verification_candidates);
  copyCandidates(preview.candidate_material.not_done_candidates, material.not_done_candidates);
  copyCandidates(preview.candidate_material.requirement_progress_candidates, material.requirement_progress_candidates);
  copyCandidates(preview.candidate_material.expected_observed_signal_candidates, material.expected_observed_signal_candidates);
  copyCandidates(preview.candidate_material.context_reuse_signal_candidates, material.context_reuse_signal_candidates);
  copyCandidates(preview.candidate_material.risk_or_regression_candidates, material.risk_or_regression_candidates);
  copyCandidates(preview.candidate_material.followup_candidates, material.next_work_bias_candidates);
  copyCandidates(preview.candidate_material.reusable_context_candidates, material.carry_forward_memory_candidates);
  copyCandidates(preview.candidate_material.review_only_candidates, material.review_only_candidates);
  return material;
}

function residueFromRecordReview(
  review: CodexResultReportIntakeRecordReview,
): WorkEpisodeResidueCandidateMaterial {
  const material = emptyResidue();
  for (const record of review.records) {
    const context = {
      source_ref: record.source_ref,
      operator_ref: record.operator_ref,
      project_ref: record.project_ref ?? undefined,
      work_ref: record.work_ref ?? undefined,
      result_ref: record.result_ref ?? undefined,
      pr_ref: record.pr_ref ?? undefined,
      commit_ref: record.commit_ref ?? undefined,
      evidence_refs: record.evidence_refs,
      source_refs: record.source_refs,
    };
    pushResidue(material.work_episode_summary_candidates, context, "project_state_summary", "Work episode residue", record.result_status_summary.join("; "), `record:${record.record_id}:summary`);
    for (const [items, target, kind, label] of [
      [record.changed_files_summary, material.changed_artifact_candidates, "changed_artifact_ref", "Changed artifact"],
      [record.checks_summary, material.verification_result_candidates, "expected_observed_signal", "Verification result"],
      [record.skipped_checks_summary, material.skipped_verification_candidates, "expected_observed_signal", "Skipped verification"],
      [record.not_done_summary, material.not_done_candidates, "next_action", "Not done"],
      [record.requirement_progress_summary, material.requirement_progress_candidates, "requirement", "Requirement progress"],
      [record.expected_observed_signal_summary, material.expected_observed_signal_candidates, "expected_observed_signal", "Expected/observed signal"],
      [record.context_reuse_signal_summary, material.context_reuse_signal_candidates, "reusable_context", "Context reuse signal"],
      [record.risk_or_regression_summary, material.risk_or_regression_candidates, "risk_or_blocker", "Risk or regression"],
      [record.followup_summary, material.next_work_bias_candidates, "next_action", "Next work bias candidate"],
    ] as const) {
      items.forEach((item, index) =>
        pushResidue(target, context, kind, label, item, `record:${record.record_id}:${label}:${index}`),
      );
    }
  }
  return material;
}

function pushResidue(
  bucket: CandidateIngressNormalizedCandidate[],
  context: {
    source_ref: string;
    operator_ref: string;
    project_ref?: string;
    work_ref?: string;
    result_ref?: string;
    pr_ref?: string;
    commit_ref?: string;
    evidence_refs: string[];
    source_refs: string[];
  },
  candidateKind: CandidateIngressNormalizedCandidate["candidate_kind"],
  label: string,
  summary: string,
  seed: string,
) {
  const candidate = normalizeCandidateIngressCandidateV01({
    candidate_kind: candidateKind,
    source_kind: "codex_result_report",
    label,
    summary,
    source_ref: context.source_ref,
    operator_ref: context.operator_ref,
    project_ref: context.project_ref,
    work_ref: context.work_ref,
    result_ref: context.result_ref,
    pr_ref: context.pr_ref,
    commit_ref: context.commit_ref,
    evidence_refs: context.evidence_refs,
    source_refs: context.source_refs,
    confidence: "explicit",
    generated_view: true,
    seed,
  });
  if (candidate) bucket.push(candidate);
}

function copyCandidates(
  from: CandidateIngressNormalizedCandidate[],
  to: CandidateIngressNormalizedCandidate[],
) {
  to.push(...from);
}

function emptyResidue(): WorkEpisodeResidueCandidateMaterial {
  return {
    work_episode_summary_candidates: [],
    changed_artifact_candidates: [],
    verification_result_candidates: [],
    skipped_verification_candidates: [],
    not_done_candidates: [],
    requirement_progress_candidates: [],
    expected_observed_signal_candidates: [],
    context_reuse_signal_candidates: [],
    risk_or_regression_candidates: [],
    next_work_bias_candidates: [],
    carry_forward_memory_candidates: [],
    review_only_candidates: [],
  };
}

function mergeResidueMaterial(
  materials: WorkEpisodeResidueCandidateMaterial[],
): WorkEpisodeResidueCandidateMaterial {
  const merged = emptyResidue();
  for (const material of materials) {
    for (const key of Object.keys(merged) as Array<keyof WorkEpisodeResidueCandidateMaterial>) {
      merged[key].push(...material[key]);
    }
  }
  return merged;
}

function countResidue(material: WorkEpisodeResidueCandidateMaterial): number {
  return Object.values(material).reduce((sum, bucket) => sum + bucket.length, 0);
}

function determineStatus({
  hasMaterial,
  residueCandidateCount,
  blockedReasons,
  insufficientDataReasons,
}: {
  hasMaterial: boolean;
  residueCandidateCount: number;
  blockedReasons: string[];
  insufficientDataReasons: string[];
}): WorkEpisodeResidueCandidatePreviewStatus {
  if (!hasMaterial) return "no_codex_result_material";
  if (blockedReasons.length > 0) return "keep_preview_only";
  if (residueCandidateCount > 0 && insufficientDataReasons.length <= 1) {
    return "ready_for_operator_review";
  }
  if (residueCandidateCount > 0) return "candidate_residue_available";
  return "insufficient_data";
}

function determineNextAction({
  status,
  hasIntakeCandidateMaterial,
  intakeReadyForCandidateIngest,
  recordCount,
  residueCandidateCount,
}: {
  status: WorkEpisodeResidueCandidatePreviewStatus;
  hasIntakeCandidateMaterial: boolean;
  intakeReadyForCandidateIngest: boolean;
  recordCount: number;
  residueCandidateCount: number;
}): WorkEpisodeResidueCandidatePreview["recommended_next_action"] {
  if (status === "no_codex_result_material") return "supply_codex_result_report";
  if (residueCandidateCount > 0) return "review_work_episode_residue_candidates";
  if (
    hasIntakeCandidateMaterial &&
    intakeReadyForCandidateIngest &&
    recordCount === 0
  ) {
    return "ingest_codex_result_report_candidate_record";
  }
  return "keep_preview_only";
}

function isCodexResultReportIntakePreview(
  value: unknown,
): value is CodexResultReportIntakePreview {
  return (
    isRecord(value) &&
    value.preview_version === CODEX_RESULT_REPORT_INTAKE_PREVIEW_VERSION &&
    isRecord(value.candidate_material) &&
    isRecord(value.evidence_summary)
  );
}

function isCodexResultReportIntakeRecordReview(
  value: unknown,
): value is CodexResultReportIntakeRecordReview {
  return (
    isRecord(value) &&
    value.review_version === CODEX_RESULT_REPORT_INTAKE_RECORD_REVIEW_VERSION &&
    Array.isArray(value.records) &&
    isRecord(value.input_summary)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
