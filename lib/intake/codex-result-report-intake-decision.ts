import {
  asCandidateIngressPublicSafeRefV01,
  detectCandidateIngressUnsafeMarkersV01,
  isCandidateIngressPublicSafeRefV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import type { CandidateIngressNormalizedCandidate } from "@/types/candidate-ingress-normalizer";
import {
  CODEX_RESULT_REPORT_INTAKE_OPERATOR_DECISION_PREVIEW_VERSION,
  type CodexResultReportIntakeDecisionAuthorityBoundary,
  type CodexResultReportIntakeOperatorDecisionPreview,
  type CodexResultReportIntakeOperatorDecisionPreviewInput,
  type CodexResultReportIntakeOperatorDecisionStatus,
  type CodexResultReportIntakeRecommendedOperatorDecision,
  type CodexResultReportWouldWriteCandidateRecordPreview,
} from "@/types/codex-result-report-intake-decision";
import {
  CODEX_RESULT_REPORT_INTAKE_PREVIEW_VERSION,
  type CodexResultReportCandidateMaterial,
  type CodexResultReportIntakeAuthorityBoundary,
  type CodexResultReportIntakePreview,
} from "@/types/codex-result-report-intake-preview";

const DEFAULT_SCOPE = "project:augnes" as const;
const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z" as const;

const intakeFalseAuthorityFields = [
  "can_write_db",
  "can_create_schema",
  "can_create_ingest_record",
  "can_create_ingest_receipt",
  "can_write_work_episode",
  "can_write_expected_observed_delta",
  "can_write_reuse_outcome_ledger",
  "can_write_memory",
  "can_mutate_memory",
  "can_promote_memory",
  "can_mutate_current_working_perspective",
  "can_write_perspective_unit",
  "can_write_next_work_bias",
  "can_update_continuity_relay",
  "can_mutate_handoff_context",
  "can_apply_handoff_context",
  "can_write_selected_refs_to_live_handoff",
  "can_send_handoff",
  "can_write_dogfood_metrics",
  "can_write_reuse_ledger",
  "can_call_provider_openai",
  "can_call_github",
  "can_execute_codex",
  "can_create_pr",
  "can_merge_pr",
  "can_run_autonomous_action",
  "can_create_graph_or_vector_store",
  "can_create_rag_stack",
  "can_crawl_or_observe_browser",
] as const satisfies readonly (keyof CodexResultReportIntakeAuthorityBoundary)[];

const availableOperatorDecisions = [
  "approve_for_codex_result_report_candidate_ingest",
  "defer",
  "reject",
  "keep_candidate",
  "request_more_evidence",
] as const;

export function buildCodexResultReportIntakeOperatorDecisionPreviewV01({
  codex_result_report_intake_preview,
  selected_candidate_refs,
  requested_operator_ref,
  requested_idempotency_key,
  privacy_review_confirmation_ref,
  as_of,
  scope,
  source_refs,
}: CodexResultReportIntakeOperatorDecisionPreviewInput = {}): CodexResultReportIntakeOperatorDecisionPreview {
  const previewStatus = getPreviewSourceStatus(codex_result_report_intake_preview);
  const intakePreview = isCodexResultReportIntakePreview(codex_result_report_intake_preview)
    ? codex_result_report_intake_preview
    : null;
  const selectableCandidates = intakePreview
    ? getIngestableCandidates(intakePreview.candidate_material)
    : [];
  const selectableRefs = uniqueCandidateIngressStringsV01(
    selectableCandidates.map((candidate) => candidate.candidate_id),
  );
  const selectedRefs = uniqueCandidateIngressStringsV01(selected_candidate_refs ?? []);
  const unsafeSelectedRefs = selectedRefs.filter(
    (ref) => !isCandidateIngressPublicSafeRefV01(ref),
  );
  const unknownSelectedRefs = selectedRefs.filter(
    (ref) => isCandidateIngressPublicSafeRefV01(ref) && !selectableRefs.includes(ref),
  );
  const selectedCandidates = selectableCandidates.filter((candidate) =>
    selectedRefs.includes(candidate.candidate_id),
  );
  const selectedOrPreviewCandidates =
    selectedRefs.length > 0 ? selectedCandidates : [];
  const privacyRef = asCandidateIngressPublicSafeRefV01(
    privacy_review_confirmation_ref,
  );
  const idempotencyKey = asCandidateIngressPublicSafeRefV01(
    requested_idempotency_key,
  );
  const requestedOperatorRef = asCandidateIngressPublicSafeRefV01(
    requested_operator_ref,
  );
  const previewOperatorRef =
    getFirstCandidateValue(selectableCandidates, "operator_ref") ??
    requestedOperatorRef;
  const sourceRef = getFirstCandidateValue(selectableCandidates, "source_ref");
  const projectRef = getFirstCandidateValue(selectableCandidates, "project_ref");
  const workRef = getFirstCandidateValue(selectableCandidates, "work_ref");
  const resultRef = getFirstCandidateValue(selectableCandidates, "result_ref");
  const prRef = getFirstCandidateValue(selectableCandidates, "pr_ref");
  const commitRef = getFirstCandidateValue(selectableCandidates, "commit_ref");
  const hasWorkOrResultRef = Boolean(workRef || resultRef);
  const evidenceRefs = uniqueCandidateIngressStringsV01(
    selectableCandidates.flatMap((candidate) => candidate.evidence_refs),
  ).filter(isCandidateIngressPublicSafeRefV01);
  const sourceRefs = uniqueCandidateIngressStringsV01([
    ...(source_refs ?? []),
    ...(intakePreview?.source_refs ?? []),
    ...selectableCandidates.flatMap((candidate) => candidate.source_refs),
  ]).filter(isCandidateIngressPublicSafeRefV01);
  const refusalReasons = uniqueCandidateIngressStringsV01([
    ...(previewStatus === "wrong_version" ? ["codex_result_report_intake_preview_wrong_version"] : []),
    ...(previewStatus === "malformed" ? ["codex_result_report_intake_preview_malformed"] : []),
    ...unknownSelectedRefs.map(() => "unknown_selected_codex_result_report_candidate_ref"),
    ...(unknownSelectedRefs.length > 0 ? ["selected_candidate_refs_not_in_intake_preview"] : []),
    ...(unsafeSelectedRefs.length > 0 ? ["selected_candidate_refs_unsafe"] : []),
    ...detectCandidateIngressUnsafeMarkersV01(JSON.stringify({
      privacy_review_confirmation_ref,
      requested_idempotency_key,
      requested_operator_ref,
    })).map((reason) => `decision_input_${reason}`),
  ]);
  const missingEvidence = uniqueCandidateIngressStringsV01([
    ...(intakePreview?.evidence_summary.missing_evidence ?? []),
    ...(intakePreview?.readiness.current_missing_evidence ?? []),
    ...(evidenceRefs.length === 0 ? ["evidence_refs_missing"] : []),
  ]);
  const insufficientDataReasons = uniqueCandidateIngressStringsV01([
    ...(previewStatus === "missing" ? ["codex_result_report_intake_preview_missing"] : []),
    ...(intakePreview?.insufficient_data_reasons ?? []),
    ...(intakePreview?.readiness.current_insufficient_data ?? []),
    ...(selectableRefs.length === 0 ? ["codex_result_report_candidate_material_missing"] : []),
    ...(selectedRefs.length === 0 ? ["selected_candidate_refs_missing"] : []),
    ...(!sourceRef ? ["source_ref_missing"] : []),
    ...(!previewOperatorRef ? ["operator_ref_missing"] : []),
    ...(!hasWorkOrResultRef ? ["work_or_result_ref_missing"] : []),
    ...(evidenceRefs.length === 0 ? ["evidence_refs_missing"] : []),
    ...(!privacyRef ? ["privacy_review_confirmation_ref_missing"] : []),
    ...(!idempotencyKey ? ["requested_idempotency_key_missing"] : []),
  ]);
  const blockingReasons = uniqueCandidateIngressStringsV01([
    ...(intakePreview?.blocked_reasons ?? []),
    ...(intakePreview?.unsafe_ref_reasons ?? []),
    ...(intakePreview?.readiness.current_blockers ?? []),
    ...refusalReasons,
  ]);
  const wouldWritePreview = buildWouldWritePreview({
    intakePreview,
    selectedCandidates: selectedOrPreviewCandidates,
    selectableRefs,
    selectedRefs,
    privacyRef,
    idempotencyKey,
    sourceRef,
    operatorRef: previewOperatorRef ?? undefined,
    projectRef,
    workRef,
    resultRef,
    prRef,
    commitRef,
    evidenceRefs,
    sourceRefs,
  });
  const writeReady =
    previewStatus === "supplied" &&
    intakePreview?.readiness.ready_for_candidate_ingest_record === true &&
    selectedRefs.length > 0 &&
    unknownSelectedRefs.length === 0 &&
    unsafeSelectedRefs.length === 0 &&
    Boolean(privacyRef) &&
    Boolean(idempotencyKey) &&
    Boolean(sourceRef) &&
    Boolean(previewOperatorRef) &&
    hasWorkOrResultRef &&
    evidenceRefs.length > 0 &&
    blockingReasons.length === 0 &&
    missingEvidence.length === 0 &&
    insufficientDataReasons.length === 0;
  const decisionStatus = determineStatus({
    previewStatus,
    writeReady,
    blockingReasons,
    missingEvidence,
    insufficientDataReasons,
    selectableRefs,
  });
  const recommendedDecision = determineRecommendedDecision({
    decisionStatus,
    insufficientDataReasons,
    missingEvidence,
    blockingReasons,
  });

  return {
    runtime: "augnes",
    preview_version: CODEX_RESULT_REPORT_INTAKE_OPERATOR_DECISION_PREVIEW_VERSION,
    scope: scope ?? intakePreview?.scope ?? DEFAULT_SCOPE,
    as_of: as_of ?? intakePreview?.as_of ?? FALLBACK_AS_OF,
    source_refs: sourceRefs,
    decision_preview_status: decisionStatus,
    recommended_operator_decision: recommendedDecision,
    available_operator_decisions: [...availableOperatorDecisions],
    input_summary: {
      has_valid_codex_result_report_intake_preview: previewStatus === "supplied",
      selected_candidate_ref_count: selectedRefs.length,
      selectable_candidate_ref_count: selectableRefs.length,
      would_write_candidate_count: selectedOrPreviewCandidates.length,
      review_only_candidate_count:
        intakePreview?.candidate_material.review_only_candidates.length ?? 0,
      blocker_count: blockingReasons.length,
      missing_evidence_count: missingEvidence.length,
      refusal_reason_count: refusalReasons.length,
      insufficient_data_reason_count: insufficientDataReasons.length,
      privacy_review_confirmation_supplied: Boolean(privacyRef),
      requested_idempotency_key_supplied: Boolean(idempotencyKey),
    },
    source_status: {
      codex_result_report_intake_preview: previewStatus,
      intake_authority_boundary: intakePreview
        ? intakeAuthorityIsReadOnly(intakePreview.authority_boundary)
          ? "valid_read_only"
          : "invalid"
        : "missing",
      selected_candidate_refs: unsafeSelectedRefs.length > 0
        ? "unsafe"
        : unknownSelectedRefs.length > 0
          ? "unknown_ref"
          : selectedRefs.length > 0
            ? "supplied"
            : "missing",
      privacy_review_confirmation_ref: refStatus(privacy_review_confirmation_ref),
      requested_idempotency_key: refStatus(requested_idempotency_key),
    },
    write_readiness: {
      write_ready: writeReady,
      readiness_label: writeReady
        ? "ready_for_future_candidate_record_write"
        : "not_ready_for_codex_result_report_candidate_record_write",
      requires_valid_codex_result_report_intake_preview: true,
      requires_intake_ready_for_candidate_ingest_record: true,
      requires_selected_candidate_refs: true,
      requires_privacy_review_confirmation: true,
      requires_idempotency_key: true,
      requires_operator_confirmation: true,
      requires_source_ref: true,
      requires_operator_ref: true,
      requires_work_or_result_ref: true,
      requires_evidence_refs: true,
      requires_no_blockers: true,
      requires_no_missing_evidence: true,
      requires_no_refusal_reasons: true,
      requires_read_only_intake_preview: true,
      current_blockers: blockingReasons,
      current_missing_evidence: missingEvidence,
      current_refusal_reasons: refusalReasons,
      current_insufficient_data: insufficientDataReasons,
    },
    approval_requirements: [
      "valid_codex_result_report_intake_preview",
      "selected_candidate_refs_from_intake_preview",
      "operator_privacy_review_confirmation",
      "idempotency_key",
      "source_ref_operator_ref_work_or_result_ref_and_evidence_refs",
      "operator_confirmation_for_codex_result_report_candidate_record_only",
    ],
    blocking_reasons: blockingReasons,
    missing_evidence: missingEvidence,
    refusal_reasons: refusalReasons,
    evidence_summary: {
      has_valid_codex_result_report_intake_preview: previewStatus === "supplied",
      has_candidate_material: selectableRefs.length > 0,
      has_selected_candidate_refs: selectedRefs.length > 0,
      has_source_ref: Boolean(sourceRef),
      has_operator_ref: Boolean(previewOperatorRef),
      has_work_or_result_ref: hasWorkOrResultRef,
      has_evidence_refs: evidenceRefs.length > 0,
      has_privacy_review_confirmation: Boolean(privacyRef),
      has_idempotency_key: Boolean(idempotencyKey),
      has_missing_evidence: missingEvidence.length > 0,
      has_refusal_reasons: refusalReasons.length > 0,
      has_unsafe_refs: (intakePreview?.evidence_summary.has_unsafe_refs ?? false) || unsafeSelectedRefs.length > 0,
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      missing_evidence: missingEvidence,
      unsafe_refs: uniqueCandidateIngressStringsV01([
        ...(intakePreview?.evidence_summary.unsafe_refs ?? []),
        ...unsafeSelectedRefs.map(() => "selected_candidate_ref_unsafe"),
      ]),
    },
    would_write_candidate_record_preview: wouldWritePreview,
    would_not_write: [
      "does_not_write_memory",
      "does_not_mutate_current_working_perspective",
      "does_not_write_perspective_unit",
      "does_not_write_next_work_bias",
      "does_not_update_continuity_relay",
      "does_not_mutate_handoff_context",
      "does_not_send_handoff",
      "does_not_write_work_episode_expected_observed_delta_reuse_ledger_or_dogfood_metrics",
      "does_not_call_provider_openai_github_or_codex",
      "does_not_create_graph_vector_rag_crawler_or_browser_observer",
    ],
    candidate_carry_forward: {
      review_only_candidates: intakePreview?.candidate_material.review_only_candidates ?? [],
    },
    review_checklist: [
      "review_codex_result_report_candidates_before_record_write",
      "confirm_selected_candidate_refs_belong_to_codex_result_report_intake_preview",
      "confirm_privacy_review_confirmation_ref",
      "confirm_idempotency_key",
      "confirm_codex_result_report_candidate_record_is_not_memory_or_perspective_state",
    ],
    non_goals: [
      "memory_write",
      "perspective_unit_durable_mutation",
      "next_work_bias_durable_mutation",
      "cwp_mutation",
      "continuity_relay_write",
      "handoff_context_mutation_or_send",
      "dogfood_metric_write",
      "reuse_outcome_ledger_write",
      "expected_observed_delta_write",
      "work_episode_write",
      "provider_github_codex_call",
      "automatic_codex_result_report_promotion",
    ],
    authority_boundary:
      createCodexResultReportIntakeOperatorDecisionAuthorityBoundaryV01(),
    fallback_reason: buildFallbackReason({
      previewStatus,
      blockingReasons,
      insufficientDataReasons,
      missingEvidence,
      refusalReasons,
    }),
    notes: [
      "Codex result report intake operator decision preview consumes only the already-built intake preview.",
      "Readiness here is not write authority; the scoped writer separately validates operator approval.",
    ],
  };
}

export function createCodexResultReportIntakeOperatorDecisionAuthorityBoundaryV01(): CodexResultReportIntakeDecisionAuthorityBoundary {
  return {
    read_only: true,
    advisory_only: true,
    source_of_truth: false,
    derived_read_model: true,
    can_persist_decision: false,
    can_write_db: false,
    can_create_schema: false,
    can_create_ingest_record: false,
    can_create_ingest_receipt: false,
    can_write_codex_result_report: false,
    can_write_work_episode: false,
    can_write_expected_observed_delta: false,
    can_write_reuse_outcome_ledger: false,
    can_write_memory: false,
    can_mutate_memory: false,
    can_promote_memory: false,
    can_mutate_current_working_perspective: false,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_update_continuity_relay: false,
    can_mutate_handoff_context: false,
    can_apply_handoff_context: false,
    can_write_selected_refs_to_live_handoff: false,
    can_send_handoff: false,
    can_write_dogfood_metrics: false,
    can_write_reuse_ledger: false,
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
      "Codex result report intake decision preview is read-only and advisory.",
      "It cannot create Codex result report records, WorkEpisode records, ExpectedObservedDelta records, reuse outcomes, dogfood metrics, memory, Perspective, CWP, relay, handoff state, provider calls, GitHub calls, Codex execution, or autonomous actions.",
    ],
  };
}

function getPreviewSourceStatus(
  value: unknown,
): CodexResultReportIntakeOperatorDecisionPreview["source_status"]["codex_result_report_intake_preview"] {
  if (!value) return "missing";
  if (!isRecord(value) || value.preview_version !== CODEX_RESULT_REPORT_INTAKE_PREVIEW_VERSION) {
    return "wrong_version";
  }
  return isCodexResultReportIntakePreview(value) ? "supplied" : "malformed";
}

function isCodexResultReportIntakePreview(
  value: unknown,
): value is CodexResultReportIntakePreview {
  if (!isRecord(value)) return false;
  if (value.preview_version !== CODEX_RESULT_REPORT_INTAKE_PREVIEW_VERSION) return false;
  return (
    isRecord(value.candidate_material) &&
    isRecord(value.readiness) &&
    isRecord(value.evidence_summary) &&
    isRecord(value.authority_boundary) &&
    Array.isArray(value.blocked_reasons) &&
    Array.isArray(value.insufficient_data_reasons) &&
    Array.isArray(value.unsafe_ref_reasons)
  );
}

function intakeAuthorityIsReadOnly(
  authority: CodexResultReportIntakeAuthorityBoundary,
): boolean {
  return (
    authority.read_only === true &&
    authority.advisory_only === true &&
    authority.derived_read_model === true &&
    authority.source_of_truth === false &&
    intakeFalseAuthorityFields.every((field) => authority[field] === false)
  );
}

function getIngestableCandidates(
  material: CodexResultReportCandidateMaterial,
): CandidateIngressNormalizedCandidate[] {
  return [
    ...material.result_summary_candidates,
    ...material.changed_file_candidates,
    ...material.check_result_candidates,
    ...material.skipped_check_candidates,
    ...material.not_done_candidates,
    ...material.requirement_progress_candidates,
    ...material.expected_observed_signal_candidates,
    ...material.context_reuse_signal_candidates,
    ...material.risk_or_regression_candidates,
    ...material.followup_candidates,
    ...material.evidence_ref_candidates,
    ...material.source_ref_candidates,
    ...material.reusable_context_candidates,
  ];
}

function buildWouldWritePreview({
  intakePreview,
  selectedCandidates,
  selectableRefs,
  selectedRefs,
  privacyRef,
  idempotencyKey,
  sourceRef,
  operatorRef,
  projectRef,
  workRef,
  resultRef,
  prRef,
  commitRef,
  evidenceRefs,
  sourceRefs,
}: {
  intakePreview: CodexResultReportIntakePreview | null;
  selectedCandidates: CandidateIngressNormalizedCandidate[];
  selectableRefs: string[];
  selectedRefs: string[];
  privacyRef: string | null;
  idempotencyKey: string | null;
  sourceRef?: string;
  operatorRef?: string;
  projectRef?: string;
  workRef?: string;
  resultRef?: string;
  prRef?: string;
  commitRef?: string;
  evidenceRefs: string[];
  sourceRefs: string[];
}): CodexResultReportWouldWriteCandidateRecordPreview {
  const candidateCounts: Record<string, number> = {};
  for (const candidate of selectedCandidates) {
    candidateCounts[candidate.candidate_kind] =
      (candidateCounts[candidate.candidate_kind] ?? 0) + 1;
  }
  return {
    proposed_record_kind: "codex_result_report_intake_record.v0.1",
    proposed_receipt_kind: "codex_result_report_intake_receipt.v0.1",
    selected_candidate_refs: selectedRefs,
    selectable_candidate_refs: selectableRefs,
    candidate_counts_by_kind: candidateCounts,
    source_kind: intakePreview?.source_kind ?? null,
    source_ref: sourceRef ?? null,
    operator_ref: operatorRef ?? null,
    project_ref: projectRef ?? null,
    work_ref: workRef ?? null,
    result_ref: resultRef ?? null,
    pr_ref: prRef ?? null,
    commit_ref: commitRef ?? null,
    source_refs: sourceRefs,
    evidence_refs: evidenceRefs,
    intake_preview_ref: intakePreview?.preview_version ?? null,
    privacy_review_confirmation_ref: privacyRef,
    requested_idempotency_key: idempotencyKey,
    sanitized_candidate_summaries: selectedCandidates.map((candidate) => ({
      candidate_ref: candidate.candidate_id,
      candidate_kind: candidate.candidate_kind,
      label: candidate.label,
      summary: candidate.summary,
    })),
    review_summary: selectedCandidates.length > 0
      ? "Codex result report candidate material selected for a future scoped candidate ingest record."
      : "No Codex result report candidate refs have been operator-selected.",
  };
}

function determineStatus({
  previewStatus,
  writeReady,
  blockingReasons,
  missingEvidence,
  insufficientDataReasons,
  selectableRefs,
}: {
  previewStatus: string;
  writeReady: boolean;
  blockingReasons: string[];
  missingEvidence: string[];
  insufficientDataReasons: string[];
  selectableRefs: string[];
}): CodexResultReportIntakeOperatorDecisionStatus {
  if (previewStatus === "missing") return "no_codex_result_report_intake_preview";
  if (blockingReasons.length > 0) return "blocked";
  if (missingEvidence.length > 0) return "needs_more_evidence";
  if (writeReady) return "ready_for_future_candidate_record_write";
  if (selectableRefs.length > 0 && insufficientDataReasons.length === 0) {
    return "ready_for_operator_decision";
  }
  if (selectableRefs.length > 0) return "needs_operator_judgment";
  return "insufficient_data";
}

function determineRecommendedDecision({
  decisionStatus,
  insufficientDataReasons,
  missingEvidence,
  blockingReasons,
}: {
  decisionStatus: CodexResultReportIntakeOperatorDecisionStatus;
  insufficientDataReasons: string[];
  missingEvidence: string[];
  blockingReasons: string[];
}): CodexResultReportIntakeRecommendedOperatorDecision {
  if (blockingReasons.length > 0 || decisionStatus === "blocked") return "resolve_blockers_or_unsafe_refs";
  if (missingEvidence.length > 0) return "defer_until_evidence_supplied";
  if (insufficientDataReasons.some((reason) => reason.includes("privacy"))) return "defer_until_privacy_review_confirmed";
  if (insufficientDataReasons.some((reason) => reason.includes("selected_candidate_refs"))) return "defer_until_selected_candidate_refs_supplied";
  if (insufficientDataReasons.some((reason) => reason.includes("idempotency"))) return "defer_until_idempotency_supplied";
  if (insufficientDataReasons.some((reason) => reason.includes("missing"))) return "defer_until_result_report_supplied";
  if (decisionStatus === "ready_for_future_candidate_record_write") return "approve_for_codex_result_report_candidate_ingest";
  return "request_more_evidence";
}

function buildFallbackReason({
  previewStatus,
  blockingReasons,
  insufficientDataReasons,
  missingEvidence,
  refusalReasons,
}: {
  previewStatus: string;
  blockingReasons: string[];
  insufficientDataReasons: string[];
  missingEvidence: string[];
  refusalReasons: string[];
}) {
  return [
    previewStatus !== "supplied" ? `preview_${previewStatus}` : "",
    ...blockingReasons,
    ...insufficientDataReasons,
    ...missingEvidence,
    ...refusalReasons,
  ].filter(Boolean)[0] ?? null;
}

function getFirstCandidateValue(
  candidates: CandidateIngressNormalizedCandidate[],
  field: keyof CandidateIngressNormalizedCandidate,
): string | undefined {
  for (const candidate of candidates) {
    const value = candidate[field];
    if (typeof value === "string" && isCandidateIngressPublicSafeRefV01(value)) {
      return value;
    }
  }
  return undefined;
}

function refStatus(value: unknown): "supplied" | "missing" | "unsafe" {
  if (typeof value !== "string" || !value.trim()) return "missing";
  return isCandidateIngressPublicSafeRefV01(value) ? "supplied" : "unsafe";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
