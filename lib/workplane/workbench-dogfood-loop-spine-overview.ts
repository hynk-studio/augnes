import {
  WORKBENCH_DOGFOOD_LOOP_SPINE_OVERVIEW_VERSION,
  type WorkbenchDogfoodLoopSpineOverview,
  type WorkbenchDogfoodLoopSpineOverviewAuthorityBoundary,
  type WorkbenchDogfoodLoopSpineOverviewInput,
  type WorkbenchDogfoodLoopSpineOverviewStatus,
  type WorkbenchDogfoodLoopSpineRecommendedNextOperatorAction,
  type WorkbenchDogfoodLoopSpineStep,
  type WorkbenchDogfoodLoopSpineStepId,
  type WorkbenchDogfoodLoopSpineStepStatus,
} from "@/types/workbench-dogfood-loop-spine-overview";

const DEFAULT_SCOPE = "project:augnes" as const;
const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z" as const;

type SpineStepBuild = WorkbenchDogfoodLoopSpineStep & {
  blockers: string[];
  material_gaps: string[];
  missing_evidence: string[];
  severe_blockers: string[];
};

export function buildWorkbenchDogfoodLoopSpineOverviewV01({
  selected_session_digest_intake_preview,
  selected_session_digest_ingest_contract_preview,
  selected_session_digest_ingest_operator_decision_preview,
  selected_session_digest_ingest_record_review,
  project_history_intake_preview,
  project_history_intake_operator_decision_preview,
  project_history_intake_record_review,
  codex_result_report_intake_preview,
  codex_result_report_intake_decision_preview,
  codex_result_report_intake_record_review,
  work_episode_residue_candidate_preview,
  expected_observed_delta_preview,
  expected_observed_delta_decision_preview,
  expected_observed_delta_record_review,
  reuse_outcome_candidate_bridge_preview,
  reuse_outcome_bridge_operator_decision_preview,
  reuse_outcome_bridge_ledger_record_review,
  dogfood_metric_snapshot_preview,
  dogfood_metric_snapshot_decision_preview,
  dogfood_metric_snapshot_record_review,
  next_work_signal_refresh_preview,
  next_work_signal_decision_preview,
  next_work_signal_decision_record_review,
  perspective_relay_update_candidate_bridge_preview,
  codex_result_feedback_draft,
  dogfood_reuse_record_proposal,
  dogfood_reuse_operator_decision_preview,
  dogfood_metric_candidate_preview,
  perspective_next_work_candidate_update_preview,
  metric_informed_continuity_relay_adjustment_preview,
  handoff_context_update_preview,
  handoff_context_update_operator_decision_preview,
  handoff_context_update_record_review,
  handoff_context_apply_preview,
  handoff_context_apply_operator_decision_preview,
  handoff_context_apply_write_contract_preview,
  scope,
  as_of,
  source_refs,
}: WorkbenchDogfoodLoopSpineOverviewInput = {}): WorkbenchDogfoodLoopSpineOverview {
  const steps: SpineStepBuild[] = [
    selectedSessionIntakeStep(selected_session_digest_intake_preview),
    selectedSessionDigestIngestContractStep(
      selected_session_digest_ingest_contract_preview,
    ),
    selectedSessionDigestIngestOperatorDecisionStep(
      selected_session_digest_ingest_operator_decision_preview,
    ),
    selectedSessionDigestDurableIngestRecordStep({
      recordReview: selected_session_digest_ingest_record_review,
      operatorDecisionPreview:
        selected_session_digest_ingest_operator_decision_preview,
    }),
    projectHistoryIntakeStep(project_history_intake_preview),
    projectHistoryCandidateIngestRecordStep({
      recordReview: project_history_intake_record_review,
      decisionPreview: project_history_intake_operator_decision_preview,
    }),
    codexResultReportIntakeStep(codex_result_report_intake_preview),
    codexResultReportCandidateIngestRecordStep({
      recordReview: codex_result_report_intake_record_review,
      decisionPreview: codex_result_report_intake_decision_preview,
    }),
    workEpisodeResidueCandidateStep(work_episode_residue_candidate_preview),
    expectedObservedDeltaStep(expected_observed_delta_preview),
    expectedObservedDeltaRecordStep({
      recordReview: expected_observed_delta_record_review,
      decisionPreview: expected_observed_delta_decision_preview,
    }),
    reuseOutcomeCandidateBridgeStep(reuse_outcome_candidate_bridge_preview),
    reuseOutcomeBridgeOperatorDecisionStep(
      reuse_outcome_bridge_operator_decision_preview,
    ),
    handoffReuseOutcomeLedgerRecordStep(
      reuse_outcome_bridge_ledger_record_review,
      reuse_outcome_bridge_operator_decision_preview,
    ),
    dogfoodMetricSnapshotStep(dogfood_metric_snapshot_preview),
    dogfoodMetricSnapshotRecordStep({
      recordReview: dogfood_metric_snapshot_record_review,
      decisionPreview: dogfood_metric_snapshot_decision_preview,
    }),
    nextWorkSignalRefreshStep(next_work_signal_refresh_preview),
    nextWorkSignalDecisionStep(next_work_signal_decision_preview),
    nextWorkSignalDecisionRecordStep({
      recordReview: next_work_signal_decision_record_review,
      decisionPreview: next_work_signal_decision_preview,
    }),
    perspectiveRelayUpdateCandidateBridgeStep(
      perspective_relay_update_candidate_bridge_preview,
    ),
    codexResultFeedbackStep(codex_result_feedback_draft),
    dogfoodReuseProposalStep(dogfood_reuse_record_proposal),
    dogfoodReuseOperatorDecisionStep(dogfood_reuse_operator_decision_preview),
    dogfoodMetricCandidateStep(dogfood_metric_candidate_preview),
    perspectiveNextWorkCandidateStep(
      perspective_next_work_candidate_update_preview,
    ),
    continuityRelayAdjustmentStep(
      metric_informed_continuity_relay_adjustment_preview,
    ),
    handoffContextUpdateStep(handoff_context_update_preview),
    handoffContextUpdateDecisionStep(
      handoff_context_update_operator_decision_preview,
    ),
    approvedHandoffContextUpdateRecordReviewStep(
      handoff_context_update_record_review,
    ),
    handoffContextApplyPreviewStep(handoff_context_apply_preview),
    handoffContextApplyDecisionStep(
      handoff_context_apply_operator_decision_preview,
    ),
    handoffContextApplyWriteContractStep(
      handoff_context_apply_write_contract_preview,
    ),
  ];

  const topBlockers = limitReasons(
    steps.flatMap((step) =>
      step.severe_blockers.map((reason) => `${step.step_id}: ${reason}`),
    ),
  );
  const topMissingEvidence = limitReasons(
    steps.flatMap((step) =>
      step.missing_evidence.map((reason) => `${step.step_id}: ${reason}`),
    ),
  );
  const currentMaterialGaps = limitReasonsWithPriority(
    steps.flatMap((step) =>
      step.material_gaps.map((reason) => `${step.step_id}: ${reason}`),
    ),
    [
      /missing_codex_result_report|codex_result_report_or_raw_text_missing/i,
      /current_handoff_packet_fingerprint|current_handoff_context_ref|operator_approval_material/i,
      /approved_reuse_records_missing_for_metric_preview|approved_reuse_outcome_records_missing_for_metric_snapshot/i,
    ],
  );
  const recommendedNextOperatorAction = determineRecommendedNextOperatorAction({
    steps,
    top_blockers: topBlockers,
    top_missing_evidence: topMissingEvidence,
    current_material_gaps: currentMaterialGaps,
  });
  const overviewStatus = determineOverviewStatus({
    steps,
    top_blockers: topBlockers,
    top_missing_evidence: topMissingEvidence,
    current_material_gaps: currentMaterialGaps,
  });

  return {
    preview_version: WORKBENCH_DOGFOOD_LOOP_SPINE_OVERVIEW_VERSION,
    scope: scope ?? DEFAULT_SCOPE,
    as_of: as_of ?? firstAvailableAsOf(steps) ?? FALLBACK_AS_OF,
    source_refs: uniqueSortedStrings([
      ...(source_refs ?? []),
      ...steps.flatMap((step) =>
        step.source_preview_ref_or_version
          ? [step.source_preview_ref_or_version]
          : [],
      ),
    ]),
    overview_status: overviewStatus,
    recommended_next_operator_action: recommendedNextOperatorAction,
    spine_summary: {
      step_count: steps.length,
      supplied_step_count: steps.filter((step) => step.status !== "not_supplied")
        .length,
      blocked_step_count: steps.filter((step) => step.status === "blocked")
        .length,
      missing_or_insufficient_step_count: steps.filter((step) =>
        ["not_supplied", "no_current_material", "insufficient_data"].includes(
          step.status,
        ),
      ).length,
      candidate_material_step_count: steps.filter(
        (step) => step.material_count > 0,
      ).length,
      ready_for_operator_review_step_count: steps.filter((step) =>
        [
          "ready_for_operator_review",
          "ready_for_future_contract_review",
        ].includes(step.status),
      ).length,
      total_material_count: sum(steps.map((step) => step.material_count)),
      total_blocker_count: sum(steps.map((step) => step.blocker_count)),
      total_missing_evidence_count: sum(
        steps.map((step) => step.missing_evidence_count),
      ),
      current_material_gap_count: currentMaterialGaps.length,
      summary: buildSpineSummaryText({
        overviewStatus,
        recommendedNextOperatorAction,
        topBlockers,
        currentMaterialGaps,
      }),
    },
    spine_steps: steps.map(stripInternalStepFields),
    top_blockers: topBlockers,
    top_missing_evidence: topMissingEvidence,
    current_material_gaps: currentMaterialGaps,
    next_operator_action_rationale: buildNextOperatorActionRationale({
      recommendedNextOperatorAction,
      topBlockers,
      topMissingEvidence,
      currentMaterialGaps,
      steps,
    }),
    review_checklist: buildReviewChecklist(),
    would_not_do: buildWouldNotDo(),
    non_goals: buildNonGoals(),
    authority_boundary:
      createWorkbenchDogfoodLoopSpineOverviewAuthorityBoundaryV01(),
  };
}

export function createWorkbenchDogfoodLoopSpineOverviewAuthorityBoundaryV01(): WorkbenchDogfoodLoopSpineOverviewAuthorityBoundary {
  return {
    read_only: true,
    advisory_only: true,
    source_of_truth: false,
    derived_read_model: true,
    can_write_db: false,
    can_create_schema: false,
    can_create_route: false,
    can_call_route: false,
    can_create_ingest_decision_record: false,
    can_create_ingest_decision_receipt: false,
    can_create_ingest_receipt: false,
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
    can_write_work_episode: false,
    can_write_expected_observed_delta: false,
    can_write_dogfood_metrics: false,
    can_write_reuse_outcome_ledger: false,
    can_write_reuse_ledger: false,
    can_create_ingest_record: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_execute_codex: false,
    can_create_pr: false,
    can_merge_pr: false,
    can_run_autonomous_action: false,
    can_create_graph_or_vector_store: false,
    can_create_rag_stack: false,
    can_crawl_or_observe_browser: false,
    can_render_workbench_action_button: false,
    notes: [
      "Workbench dogfood loop spine overview is read-only and advisory.",
      "It only summarizes already-built Workbench preview objects.",
      "It cannot promote preview readiness into write, apply, send, provider, GitHub, Codex, or autonomous authority.",
    ],
  };
}

function selectedSessionIntakeStep(
  preview: WorkbenchDogfoodLoopSpineOverviewInput["selected_session_digest_intake_preview"],
): SpineStepBuild {
  if (!preview) {
    return missingStep({
      step_id: "selected_session_intake",
      label: "Selected session intake",
      recommended_next_action: "supply_selected_session_digest",
      summary: "No selected session digest intake preview supplied.",
    });
  }

  return makeStep({
    step_id: "selected_session_intake",
    label: "Selected session intake",
    status: mapSelectedSessionStatus(preview.intake_preview_status),
    source_preview_ref_or_version: preview.preview_version,
    material_count: preview.input_summary.candidate_count,
    blockers: [
      ...preview.blocked_reasons,
      ...preview.unsafe_ref_reasons,
      ...preview.readiness.current_blockers,
    ],
    material_gaps: [
      ...preview.insufficient_data_reasons,
      ...(preview.readiness.requires_digest_or_raw_text
        ? ["selected_session_digest_or_raw_text_missing"]
        : []),
      ...(preview.readiness.requires_candidate_material
        ? ["selected_session_candidate_material_missing"]
        : []),
    ],
    missing_evidence: preview.evidence_summary.missing_evidence,
    recommended_next_action:
      preview.intake_preview_status === "no_digest"
        ? "supply_selected_session_digest"
        : preview.readiness.ready_for_operator_review ||
            preview.input_summary.candidate_count > 0
          ? "review_intake_candidate"
          : "supply_selected_session_digest",
    evidence_present: preview.evidence_summary.has_digest_or_raw_text,
    summary: `Selected session intake is ${preview.intake_preview_status}; candidate_count ${preview.input_summary.candidate_count}; next ${preview.recommended_next_action}.`,
  });
}

function selectedSessionDigestIngestContractStep(
  preview: WorkbenchDogfoodLoopSpineOverviewInput["selected_session_digest_ingest_contract_preview"],
): SpineStepBuild {
  if (!preview) {
    return missingStep({
      step_id: "selected_session_digest_ingest_contract",
      label: "Selected digest ingest contract",
      recommended_next_action: "supply_selected_session_intake_preview",
      summary: "No selected session digest ingest contract preview supplied.",
    });
  }

  return makeStep({
    step_id: "selected_session_digest_ingest_contract",
    label: "Selected digest ingest contract",
    status: mapSelectedSessionIngestContractStatus(
      preview.contract_preview_status,
    ),
    source_preview_ref_or_version: preview.preview_version,
    material_count: preview.input_summary.ingestable_candidate_count,
    blockers: [
      ...preview.blocked_reasons,
      ...preview.refusal_reasons,
      ...preview.readiness.current_blockers,
      ...preview.readiness.current_refusal_reasons,
    ],
    material_gaps: [
      ...preview.insufficient_data_reasons,
      ...preview.readiness.current_insufficient_data,
      ...(preview.readiness.requires_selected_digest_candidate_refs
        ? ["selected_digest_candidate_refs_missing"]
        : []),
      ...(preview.readiness.requires_privacy_review_confirmation
        ? ["privacy_review_confirmation_ref_missing"]
        : []),
      ...(preview.readiness.requires_idempotency_key
        ? ["requested_idempotency_key_missing"]
        : []),
    ],
    missing_evidence: [
      ...preview.missing_evidence,
      ...preview.readiness.current_missing_evidence,
    ],
    recommended_next_action: preview.recommended_next_action,
    evidence_present: preview.evidence_summary.has_valid_intake_preview,
    summary: `Selected digest ingest contract preview is ${preview.contract_preview_status}; candidate_count ${preview.input_summary.ingestable_candidate_count}; next ${preview.recommended_next_action}.`,
  });
}

function selectedSessionDigestIngestOperatorDecisionStep(
  preview: WorkbenchDogfoodLoopSpineOverviewInput["selected_session_digest_ingest_operator_decision_preview"],
): SpineStepBuild {
  if (!preview) {
    return missingStep({
      step_id: "selected_session_digest_ingest_operator_decision",
      label: "Selected digest ingest operator decision",
      recommended_next_action:
        "review_selected_session_digest_ingest_operator_decision",
      summary:
        "No selected session digest ingest operator decision preview supplied.",
    });
  }

  const decisionReady =
    preview.decision_preview_status ===
      "ready_for_future_decision_record_write" &&
    preview.write_readiness.write_ready === true;

  return makeStep({
    step_id: "selected_session_digest_ingest_operator_decision",
    label: "Selected digest ingest operator decision",
    status: mapSelectedSessionIngestOperatorDecisionStatus(
      preview.decision_preview_status,
    ),
    source_preview_ref_or_version: preview.preview_version,
    material_count:
      preview.input_summary.selected_digest_candidate_ref_count +
      preview.would_write_decision_record_preview
        .sanitized_candidate_summaries.length,
    blockers: [
      ...preview.blocking_reasons,
      ...preview.refusal_reasons,
      ...preview.write_readiness.current_blockers,
      ...preview.write_readiness.current_refusal_reasons,
    ],
    material_gaps: [
      ...preview.write_readiness.current_insufficient_data,
      ...(preview.input_summary.contract_ready_for_future_ingest_write_scope
        ? []
        : ["ingest_contract_preview_not_ready_for_operator_decision"]),
      ...(preview.input_summary.selected_digest_candidate_ref_count > 0
        ? []
        : ["selected_digest_candidate_refs_missing_for_operator_decision"]),
      ...(preview.input_summary.privacy_review_confirmation_ref_supplied
        ? []
        : ["privacy_review_confirmation_ref_missing_for_operator_decision"]),
      ...(preview.input_summary.requested_idempotency_key_supplied
        ? []
        : ["requested_idempotency_key_missing_for_operator_decision"]),
    ],
    missing_evidence: [
      ...preview.missing_evidence,
      ...preview.write_readiness.current_missing_evidence,
    ],
    recommended_next_action: decisionReady
      ? "prepare_operator_approved_selected_session_digest_ingest_decision_record"
      : preview.decision_preview_status === "blocked"
        ? "resolve_selected_session_digest_ingest_decision_blockers"
        : "review_selected_session_digest_ingest_operator_decision",
    evidence_present: preview.evidence_summary.has_ingest_contract_preview,
    summary: `Selected digest ingest operator decision preview is ${preview.decision_preview_status}; recommended ${preview.recommended_operator_decision}; decision_record_write_ready ${String(preview.write_readiness.write_ready)}.`,
  });
}

function selectedSessionDigestDurableIngestRecordStep({
  recordReview,
  operatorDecisionPreview,
}: {
  recordReview: WorkbenchDogfoodLoopSpineOverviewInput["selected_session_digest_ingest_record_review"];
  operatorDecisionPreview: WorkbenchDogfoodLoopSpineOverviewInput["selected_session_digest_ingest_operator_decision_preview"];
}): SpineStepBuild {
  if (!recordReview) {
    return missingStep({
      step_id: "selected_session_digest_durable_ingest_record",
      label: "Selected digest durable candidate ingest record",
      recommended_next_action: "review_selected_session_digest_ingest_record",
      summary:
        "No selected session digest ingest record review supplied.",
    });
  }

  const decisionRecordReady =
    operatorDecisionPreview?.decision_preview_status ===
      "ready_for_future_decision_record_write" &&
    operatorDecisionPreview.write_readiness.write_ready === true;
  const hasRecords = recordReview.input_summary.valid_record_count > 0;

  return makeStep({
    step_id: "selected_session_digest_durable_ingest_record",
    label: "Selected digest durable candidate ingest record",
    status: mapRecordReviewStatus(recordReview.review_status),
    source_preview_ref_or_version: recordReview.review_version,
    material_count:
      recordReview.input_summary.valid_record_count +
      recordReview.input_summary.selected_digest_candidate_ref_count +
      recordReview.input_summary.sanitized_candidate_summary_count,
    blockers: [
      ...recordReview.blocked_reasons,
      ...(recordReview.input_summary.receipt_side_effect_problem_count > 0
        ? ["selected_session_digest_ingest_record_side_effect_problem"]
        : []),
    ],
    material_gaps: [
      ...recordReview.insufficient_data_reasons,
      ...(decisionRecordReady && !hasRecords
        ? ["selected_session_digest_candidate_ingest_record_missing_after_operator_decision"]
        : []),
      ...(!decisionRecordReady && !hasRecords
        ? ["operator_approved_selected_session_digest_ingest_decision_record_missing_or_not_ready"]
        : []),
    ],
    missing_evidence: recordReview.evidence_summary.missing_evidence,
    recommended_next_action: hasRecords
      ? "review_selected_session_digest_ingest_record"
      : decisionRecordReady
        ? "write_selected_session_digest_candidate_ingest_record"
        : "review_selected_session_digest_ingest_operator_decision",
    evidence_present: recordReview.evidence_summary.has_records,
    summary: `Selected digest candidate ingest record review is ${recordReview.review_status}; valid_record_count ${recordReview.input_summary.valid_record_count}; decision_record_ready ${String(decisionRecordReady)}.`,
  });
}

function projectHistoryIntakeStep(
  preview: WorkbenchDogfoodLoopSpineOverviewInput["project_history_intake_preview"],
): SpineStepBuild {
  if (!preview) {
    return missingStep({
      step_id: "project_history_intake",
      label: "Project history intake",
      recommended_next_action: "supply_project_history_digest",
      summary: "No project history intake preview supplied.",
    });
  }

  return makeStep({
    step_id: "project_history_intake",
    label: "Project history intake",
    status:
      preview.intake_preview_status === "no_history"
        ? "no_current_material"
        : mapProjectHistoryIntakeStatus(preview.intake_preview_status),
    source_preview_ref_or_version: preview.preview_version,
    material_count: preview.input_summary.candidate_count,
    blockers: [
      ...preview.blocked_reasons,
      ...preview.unsafe_ref_reasons,
      ...preview.readiness.current_blockers,
    ],
    material_gaps: [
      ...preview.insufficient_data_reasons,
      ...preview.readiness.current_insufficient_data,
      ...(preview.readiness.requires_digest_or_raw_text
        ? ["project_history_digest_or_raw_text_missing"]
        : []),
      ...(preview.readiness.requires_candidate_material
        ? ["project_history_candidate_material_missing"]
        : []),
    ],
    missing_evidence: [
      ...preview.evidence_summary.missing_evidence,
      ...preview.readiness.current_missing_evidence,
    ],
    recommended_next_action:
      preview.intake_preview_status === "no_history"
        ? "supply_project_history_digest"
        : preview.readiness.ready_for_operator_review ||
            preview.input_summary.candidate_count > 0
          ? "review_project_history_intake_candidates"
          : "supply_project_history_digest",
    evidence_present: preview.evidence_summary.has_history_material,
    summary: `Project history intake is ${preview.intake_preview_status}; candidate_count ${preview.input_summary.candidate_count}; next ${preview.recommended_next_action}.`,
  });
}

function projectHistoryCandidateIngestRecordStep({
  recordReview,
  decisionPreview,
}: {
  recordReview: WorkbenchDogfoodLoopSpineOverviewInput["project_history_intake_record_review"];
  decisionPreview: WorkbenchDogfoodLoopSpineOverviewInput["project_history_intake_operator_decision_preview"];
}): SpineStepBuild {
  if (!recordReview) {
    return missingStep({
      step_id: "project_history_candidate_ingest_record",
      label: "Project history candidate ingest record",
      recommended_next_action: "review_project_history_intake_record",
      summary: "No project history intake record review supplied.",
    });
  }

  const decisionReady =
    decisionPreview?.decision_preview_status ===
      "ready_for_future_candidate_record_write" &&
    decisionPreview.write_readiness.write_ready === true;
  const hasRecords = recordReview.input_summary.valid_record_count > 0;

  return makeStep({
    step_id: "project_history_candidate_ingest_record",
    label: "Project history candidate ingest record",
    status: mapRecordReviewStatus(recordReview.review_status),
    source_preview_ref_or_version: recordReview.review_version,
    material_count:
      recordReview.input_summary.valid_record_count +
      recordReview.input_summary.selected_candidate_ref_count +
      recordReview.input_summary.sanitized_candidate_summary_count,
    blockers: [
      ...recordReview.blocked_reasons,
      ...(recordReview.input_summary.receipt_side_effect_problem_count > 0
        ? ["project_history_intake_record_side_effect_problem"]
        : []),
    ],
    material_gaps: [
      ...recordReview.insufficient_data_reasons,
      ...(decisionReady && !hasRecords
        ? ["project_history_candidate_ingest_record_missing_after_operator_decision"]
        : []),
      ...(!decisionReady && !hasRecords
        ? ["project_history_intake_operator_decision_missing_or_not_ready"]
        : []),
    ],
    missing_evidence: recordReview.evidence_summary.missing_evidence,
    recommended_next_action: hasRecords
      ? "review_project_history_intake_record"
      : decisionReady
        ? "write_project_history_candidate_ingest_record"
        : "review_project_history_intake_candidates",
    evidence_present: recordReview.evidence_summary.has_records,
    summary: `Project history candidate ingest record review is ${recordReview.review_status}; valid_record_count ${recordReview.input_summary.valid_record_count}; decision_ready ${String(decisionReady)}.`,
  });
}

function codexResultReportIntakeStep(
  preview: WorkbenchDogfoodLoopSpineOverviewInput["codex_result_report_intake_preview"],
): SpineStepBuild {
  if (!preview) {
    return missingStep({
      step_id: "codex_result_report_intake",
      label: "Codex result report intake",
      recommended_next_action: "supply_codex_result_report",
      summary: "No Codex result report intake preview supplied.",
    });
  }

  return makeStep({
    step_id: "codex_result_report_intake",
    label: "Codex result report intake",
    status:
      preview.intake_preview_status === "no_result_report"
        ? "no_current_material"
        : mapProjectHistoryIntakeStatus(preview.intake_preview_status),
    source_preview_ref_or_version: preview.preview_version,
    material_count: preview.input_summary.candidate_count,
    blockers: [
      ...preview.blocked_reasons,
      ...preview.unsafe_ref_reasons,
      ...preview.readiness.current_blockers,
    ],
    material_gaps: [
      ...preview.insufficient_data_reasons,
      ...preview.readiness.current_insufficient_data,
      ...(preview.readiness.requires_result_report_or_raw_text
        ? ["codex_result_report_or_raw_text_missing"]
        : []),
      ...(preview.readiness.requires_candidate_material
        ? ["codex_result_candidate_material_missing"]
        : []),
    ],
    missing_evidence: [
      ...preview.evidence_summary.missing_evidence,
      ...preview.readiness.current_missing_evidence,
    ],
    recommended_next_action:
      preview.intake_preview_status === "no_result_report"
        ? "supply_codex_result_report"
        : preview.intake_preview_status === "keep_preview_only"
          ? "keep_preview_only"
          : preview.readiness.ready_for_operator_review ||
            preview.input_summary.candidate_count > 0
          ? "review_codex_result_report_intake_candidates"
          : "supply_codex_result_report",
    evidence_present: preview.evidence_summary.has_result_report_material,
    summary: `Codex result report intake is ${preview.intake_preview_status}; candidate_count ${preview.input_summary.candidate_count}; next ${preview.recommended_next_action}.`,
  });
}

function codexResultReportCandidateIngestRecordStep({
  recordReview,
  decisionPreview,
}: {
  recordReview: WorkbenchDogfoodLoopSpineOverviewInput["codex_result_report_intake_record_review"];
  decisionPreview: WorkbenchDogfoodLoopSpineOverviewInput["codex_result_report_intake_decision_preview"];
}): SpineStepBuild {
  if (!recordReview) {
    return missingStep({
      step_id: "codex_result_report_candidate_ingest_record",
      label: "Codex result report candidate ingest record",
      recommended_next_action: "review_codex_result_report_intake_record",
      summary: "No Codex result report intake record review supplied.",
    });
  }

  const decisionReady =
    decisionPreview?.decision_preview_status ===
      "ready_for_future_candidate_record_write" &&
    decisionPreview.write_readiness.write_ready === true;
  const hasRecords = recordReview.input_summary.valid_record_count > 0;

  return makeStep({
    step_id: "codex_result_report_candidate_ingest_record",
    label: "Codex result report candidate ingest record",
    status: mapRecordReviewStatus(recordReview.review_status),
    source_preview_ref_or_version: recordReview.review_version,
    material_count:
      recordReview.input_summary.valid_record_count +
      recordReview.input_summary.selected_candidate_ref_count +
      recordReview.input_summary.sanitized_candidate_summary_count,
    blockers: [
      ...recordReview.blocked_reasons,
      ...(recordReview.input_summary.receipt_side_effect_problem_count > 0
        ? ["codex_result_report_intake_record_side_effect_problem"]
        : []),
      ...(decisionPreview?.blocking_reasons ?? []),
      ...(decisionPreview?.refusal_reasons ?? []),
    ],
    material_gaps: [
      ...recordReview.insufficient_data_reasons,
      ...(decisionReady && !hasRecords
        ? ["codex_result_report_candidate_ingest_record_missing_after_operator_decision"]
        : []),
      ...(!decisionReady && !hasRecords
        ? ["codex_result_report_intake_operator_decision_missing_or_not_ready"]
        : []),
    ],
    missing_evidence: [
      ...recordReview.evidence_summary.missing_evidence,
      ...(decisionPreview?.missing_evidence ?? []),
    ],
    recommended_next_action: hasRecords
      ? "review_codex_result_report_intake_record"
      : decisionReady
        ? "write_codex_result_report_candidate_ingest_record"
        : "review_codex_result_report_intake_candidates",
    evidence_present: recordReview.evidence_summary.has_records,
    summary: `Codex result report candidate ingest record review is ${recordReview.review_status}; valid_record_count ${recordReview.input_summary.valid_record_count}; decision_ready ${String(decisionReady)}.`,
  });
}

function workEpisodeResidueCandidateStep(
  preview: WorkbenchDogfoodLoopSpineOverviewInput["work_episode_residue_candidate_preview"],
): SpineStepBuild {
  if (!preview) {
    return missingStep({
      step_id: "work_episode_residue_candidate",
      label: "Work episode residue candidate",
      recommended_next_action: "supply_codex_result_report",
      summary: "No work episode residue candidate preview supplied.",
    });
  }

  return makeStep({
    step_id: "work_episode_residue_candidate",
    label: "Work episode residue candidate",
    status:
      preview.residue_preview_status === "no_codex_result_material"
        ? "no_current_material"
        : mapCandidateResidueStatus(preview.residue_preview_status),
    source_preview_ref_or_version: preview.preview_version,
    material_count: preview.input_summary.residue_candidate_count,
    blockers: preview.blocked_reasons,
    material_gaps: preview.insufficient_data_reasons,
    missing_evidence: preview.evidence_summary.missing_evidence,
    recommended_next_action:
      preview.input_summary.residue_candidate_count > 0
        ? "review_work_episode_residue_candidates"
        : preview.recommended_next_action === "ingest_codex_result_report_candidate_record"
          ? "write_codex_result_report_candidate_ingest_record"
          : "supply_codex_result_report",
    evidence_present: preview.evidence_summary.has_codex_result_material,
    summary: `Work episode residue candidate preview is ${preview.residue_preview_status}; residue_candidate_count ${preview.input_summary.residue_candidate_count}; next ${preview.recommended_next_action}.`,
  });
}

function expectedObservedDeltaStep(
  preview: WorkbenchDogfoodLoopSpineOverviewInput["expected_observed_delta_preview"],
): SpineStepBuild {
  if (!preview) {
    return missingStep({
      step_id: "expected_observed_delta",
      label: "ExpectedObservedDelta candidate",
      recommended_next_action: "supply_codex_result_report",
      summary: "No ExpectedObservedDelta preview supplied.",
    });
  }

  return makeStep({
    step_id: "expected_observed_delta",
    label: "ExpectedObservedDelta candidate",
    status:
      preview.delta_preview_status === "no_result_material"
        ? "no_current_material"
        : mapExpectedObservedDeltaStatus(preview.delta_preview_status),
    source_preview_ref_or_version: preview.preview_version,
    material_count: preview.input_summary.delta_candidate_count,
    blockers: preview.blocked_reasons,
    material_gaps: [
      ...preview.insufficient_data_reasons,
      ...(preview.evidence_summary.has_expected_material
        ? []
        : ["expected_material_missing"]),
      ...(preview.evidence_summary.has_observed_material
        ? []
        : ["observed_material_missing"]),
    ],
    missing_evidence: preview.evidence_summary.missing_evidence,
    recommended_next_action:
      preview.delta_preview_status === "ready_for_operator_review" ||
      preview.input_summary.delta_candidate_count > 0
        ? "review_expected_observed_delta_candidates"
        : preview.delta_preview_status === "insufficient_expected_material"
          ? "prepare_expected_observed_delta_preview"
          : "supply_codex_result_report",
    evidence_present: preview.evidence_summary.has_result_material,
    summary: `ExpectedObservedDelta preview is ${preview.delta_preview_status}; delta_candidate_count ${preview.input_summary.delta_candidate_count}; expected ${preview.input_summary.expected_signal_count}; observed ${preview.input_summary.observed_signal_count}; next ${preview.recommended_next_action}.`,
  });
}

function expectedObservedDeltaRecordStep({
  recordReview,
  decisionPreview,
}: {
  recordReview: WorkbenchDogfoodLoopSpineOverviewInput["expected_observed_delta_record_review"];
  decisionPreview: WorkbenchDogfoodLoopSpineOverviewInput["expected_observed_delta_decision_preview"];
}): SpineStepBuild {
  if (!recordReview) {
    return missingStep({
      step_id: "expected_observed_delta_record",
      label: "ExpectedObservedDelta local record",
      recommended_next_action: "review_expected_observed_delta_candidates",
      summary: "No ExpectedObservedDelta record review supplied.",
    });
  }

  const decisionReady =
    decisionPreview?.decision_preview_status ===
      "ready_for_future_delta_record_write" &&
    decisionPreview.write_readiness.write_ready === true;
  const hasRecords = recordReview.input_summary.valid_record_count > 0;

  return makeStep({
    step_id: "expected_observed_delta_record",
    label: "ExpectedObservedDelta local record",
    status: mapRecordReviewStatus(recordReview.review_status),
    source_preview_ref_or_version: recordReview.review_version,
    material_count:
      recordReview.input_summary.valid_record_count +
      recordReview.input_summary.selected_delta_candidate_ref_count,
    blockers: [
      ...recordReview.blocked_reasons,
      ...(recordReview.input_summary.receipt_side_effect_problem_count > 0
        ? ["expected_observed_delta_record_side_effect_problem"]
        : []),
      ...(decisionPreview?.blocking_reasons ?? []),
      ...(decisionPreview?.refusal_reasons ?? []),
    ],
    material_gaps: [
      ...recordReview.insufficient_data_reasons,
      ...(decisionReady && !hasRecords
        ? ["expected_observed_delta_record_missing_after_operator_decision"]
        : []),
      ...(!decisionReady && !hasRecords
        ? ["expected_observed_delta_operator_decision_missing_or_not_ready"]
        : []),
    ],
    missing_evidence: [
      ...recordReview.evidence_summary.missing_evidence,
      ...(decisionPreview?.missing_evidence ?? []),
    ],
    recommended_next_action: hasRecords
      ? "review_reuse_outcome_candidate_bridge"
      : decisionReady
        ? "write_expected_observed_delta_record"
        : "review_expected_observed_delta_candidates",
    evidence_present: recordReview.evidence_summary.has_records,
    summary: `ExpectedObservedDelta record review is ${recordReview.review_status}; valid_record_count ${recordReview.input_summary.valid_record_count}; decision_ready ${String(decisionReady)}.`,
  });
}

function reuseOutcomeCandidateBridgeStep(
  preview: WorkbenchDogfoodLoopSpineOverviewInput["reuse_outcome_candidate_bridge_preview"],
): SpineStepBuild {
  if (!preview) {
    return missingStep({
      step_id: "reuse_outcome_candidate_bridge",
      label: "Reuse outcome candidate bridge",
      recommended_next_action: "review_expected_observed_delta_candidates",
      summary: "No reuse outcome candidate bridge preview supplied.",
    });
  }

  return makeStep({
    step_id: "reuse_outcome_candidate_bridge",
    label: "Reuse outcome candidate bridge",
    status:
      preview.bridge_preview_status === "no_delta_material"
        ? "no_current_material"
        : mapReuseOutcomeBridgeStatus(preview.bridge_preview_status),
    source_preview_ref_or_version: preview.preview_version,
    material_count: preview.input_summary.bridge_candidate_count,
    blockers: preview.blocked_reasons,
    material_gaps: preview.insufficient_data_reasons,
    missing_evidence: preview.evidence_summary.missing_evidence,
    recommended_next_action:
      preview.input_summary.bridge_candidate_count > 0
        ? "review_reuse_outcome_candidate_bridge"
        : "review_expected_observed_delta_candidates",
    evidence_present: preview.evidence_summary.has_delta_material,
    summary: `Reuse outcome candidate bridge is ${preview.bridge_preview_status}; bridge_candidate_count ${preview.input_summary.bridge_candidate_count}; next ${preview.recommended_next_action}; no reuse ledger or dogfood metric write authority.`,
  });
}

function reuseOutcomeBridgeOperatorDecisionStep(
  preview: WorkbenchDogfoodLoopSpineOverviewInput["reuse_outcome_bridge_operator_decision_preview"],
): SpineStepBuild {
  if (!preview) {
    return missingStep({
      step_id: "reuse_outcome_bridge_operator_decision",
      label: "Reuse outcome bridge operator decision",
      recommended_next_action: "review_reuse_outcome_candidate_bridge",
      summary: "No reuse outcome bridge operator decision preview supplied.",
    });
  }

  return makeStep({
    step_id: "reuse_outcome_bridge_operator_decision",
    label: "Reuse outcome bridge operator decision",
    status: mapDecisionStatus(preview.decision_preview_status),
    source_preview_ref_or_version: preview.preview_version,
    material_count:
      preview.input_summary.would_write_reuse_candidate_count +
      preview.input_summary.selected_reuse_candidate_ref_count,
    blockers: [
      ...preview.blocking_reasons,
      ...preview.refusal_reasons,
      ...preview.write_readiness.current_blockers,
      ...preview.write_readiness.current_refusal_reasons,
    ],
    material_gaps: [
      ...preview.write_readiness.current_insufficient_data,
      ...preview.missing_evidence,
      ...preview.write_readiness.current_missing_evidence,
    ],
    missing_evidence: [
      ...preview.missing_evidence,
      ...preview.write_readiness.current_missing_evidence,
    ],
    recommended_next_action: preview.write_readiness.write_ready
      ? "write_handoff_reuse_outcome_ledger_record"
      : preview.input_summary.bridge_candidate_count > 0
        ? "review_reuse_outcome_bridge_decision"
        : "review_reuse_outcome_candidate_bridge",
    evidence_present: preview.evidence_summary.has_candidate_material,
    summary: `Reuse outcome bridge decision is ${preview.decision_preview_status}; selected_ref_count ${preview.input_summary.selected_reuse_candidate_ref_count}; write_ready ${String(preview.write_readiness.write_ready)}.`,
  });
}

function handoffReuseOutcomeLedgerRecordStep(
  review: WorkbenchDogfoodLoopSpineOverviewInput["reuse_outcome_bridge_ledger_record_review"],
  decisionPreview: WorkbenchDogfoodLoopSpineOverviewInput["reuse_outcome_bridge_operator_decision_preview"],
): SpineStepBuild {
  if (!review) {
    return missingStep({
      step_id: "handoff_reuse_outcome_ledger_record",
      label: "Handoff reuse outcome ledger record",
      recommended_next_action: "review_reuse_outcome_bridge_decision",
      summary: "No reuse outcome bridge ledger record review supplied.",
    });
  }

  const decisionReady =
    decisionPreview?.decision_preview_status ===
      "ready_for_future_reuse_ledger_write" &&
    decisionPreview.write_readiness.write_ready === true;
  const hasRecords = review.input_summary.valid_record_count > 0;

  return makeStep({
    step_id: "handoff_reuse_outcome_ledger_record",
    label: "Handoff reuse outcome ledger record",
    status: mapRecordReviewStatus(review.review_status),
    source_preview_ref_or_version: review.review_version,
    material_count:
      review.input_summary.valid_record_count +
      review.input_summary.bridge_written_record_count,
    blockers: [
      ...review.blocked_reasons,
      ...(review.input_summary.receipt_side_effect_problem_count > 0
        ? ["handoff_reuse_outcome_ledger_record_side_effect_problem"]
        : []),
      ...(decisionPreview?.blocking_reasons ?? []),
      ...(decisionPreview?.refusal_reasons ?? []),
    ],
    material_gaps: [
      ...review.insufficient_data_reasons,
      ...(decisionReady && !hasRecords
        ? ["handoff_reuse_outcome_ledger_record_missing_after_operator_decision"]
        : []),
      ...(!decisionReady && !hasRecords
        ? ["reuse_outcome_bridge_operator_decision_missing_or_not_ready"]
        : []),
    ],
    missing_evidence: [
      ...(decisionPreview?.missing_evidence ?? []),
    ],
    recommended_next_action: hasRecords
      ? "review_handoff_reuse_outcome_ledger_record"
      : decisionReady
        ? "write_handoff_reuse_outcome_ledger_record"
        : "review_reuse_outcome_bridge_decision",
    evidence_present: review.evidence_summary.has_records,
    summary: `Handoff reuse outcome ledger record review is ${review.review_status}; valid_record_count ${review.input_summary.valid_record_count}; decision_ready ${String(decisionReady)}; no dogfood metric write authority.`,
  });
}

function dogfoodMetricSnapshotStep(
  preview: WorkbenchDogfoodLoopSpineOverviewInput["dogfood_metric_snapshot_preview"],
): SpineStepBuild {
  if (!preview) {
    return missingStep({
      step_id: "dogfood_metric_snapshot",
      label: "Dogfood metric snapshot",
      recommended_next_action: "review_handoff_reuse_outcome_ledger_record",
      summary: "No dogfood metric snapshot preview supplied.",
    });
  }

  return makeStep({
    step_id: "dogfood_metric_snapshot",
    label: "Dogfood metric snapshot",
    status:
      preview.snapshot_preview_status === "no_reuse_outcome_records"
        ? "no_current_material"
        : mapMetricSnapshotStatus(preview.snapshot_preview_status),
    source_preview_ref_or_version: preview.preview_version,
    material_count:
      preview.input_summary.metric_candidate_ref_count +
      preview.input_summary.approved_reuse_ledger_record_count,
    blockers: preview.blocked_reasons,
    material_gaps: [
      ...preview.insufficient_data_reasons,
      ...(preview.input_summary.approved_reuse_ledger_record_count === 0
        ? ["approved_reuse_outcome_records_missing_for_metric_snapshot"]
        : []),
    ],
    missing_evidence: preview.evidence_summary.missing_evidence,
    recommended_next_action:
      preview.input_summary.approved_reuse_ledger_record_count === 0
        ? "review_handoff_reuse_outcome_ledger_record"
        : preview.snapshot_preview_status === "ready_for_operator_review"
          ? "review_dogfood_metric_snapshot_candidates"
          : "review_dogfood_metric_snapshot_candidates",
    evidence_present: preview.evidence_summary.has_reuse_outcome_records,
    summary: `Dogfood metric snapshot preview is ${preview.snapshot_preview_status}; approved_record_count ${preview.input_summary.approved_reuse_ledger_record_count}; metric_candidate_count ${preview.input_summary.metric_candidate_ref_count}; no global metric write authority.`,
  });
}

function dogfoodMetricSnapshotRecordStep({
  recordReview,
  decisionPreview,
}: {
  recordReview: WorkbenchDogfoodLoopSpineOverviewInput["dogfood_metric_snapshot_record_review"];
  decisionPreview: WorkbenchDogfoodLoopSpineOverviewInput["dogfood_metric_snapshot_decision_preview"];
}): SpineStepBuild {
  if (!recordReview) {
    return missingStep({
      step_id: "dogfood_metric_snapshot_record",
      label: "Dogfood metric snapshot local record",
      recommended_next_action: "review_dogfood_metric_snapshot_candidates",
      summary: "No dogfood metric snapshot record review supplied.",
    });
  }

  const decisionReady =
    decisionPreview?.decision_preview_status ===
      "ready_for_future_metric_snapshot_write" &&
    decisionPreview.write_readiness.write_ready === true;
  const hasRecords = recordReview.input_summary.valid_record_count > 0;

  return makeStep({
    step_id: "dogfood_metric_snapshot_record",
    label: "Dogfood metric snapshot local record",
    status: mapRecordReviewStatus(recordReview.review_status),
    source_preview_ref_or_version: recordReview.review_version,
    material_count:
      recordReview.input_summary.valid_record_count +
      recordReview.input_summary.selected_metric_candidate_ref_count,
    blockers: [
      ...recordReview.blocked_reasons,
      ...(recordReview.input_summary.receipt_side_effect_problem_count > 0
        ? ["dogfood_metric_snapshot_record_side_effect_problem"]
        : []),
      ...(decisionPreview?.blocking_reasons ?? []),
      ...(decisionPreview?.refusal_reasons ?? []),
    ],
    material_gaps: [
      ...recordReview.insufficient_data_reasons,
      ...(decisionReady && !hasRecords
        ? ["dogfood_metric_snapshot_record_missing_after_operator_decision"]
        : []),
      ...(!decisionReady && !hasRecords
        ? ["dogfood_metric_snapshot_operator_decision_missing_or_not_ready"]
        : []),
    ],
    missing_evidence: [
      ...recordReview.evidence_summary.missing_evidence,
      ...(decisionPreview?.missing_evidence ?? []),
    ],
    recommended_next_action: hasRecords
      ? "review_next_work_signal_refresh"
      : decisionReady
        ? "write_dogfood_metric_snapshot_record"
        : "review_dogfood_metric_snapshot_candidates",
    evidence_present: recordReview.evidence_summary.has_records,
    summary: `Dogfood metric snapshot record review is ${recordReview.review_status}; valid_record_count ${recordReview.input_summary.valid_record_count}; decision_ready ${String(decisionReady)}; no Perspective, CWP, relay, or global metric write authority.`,
  });
}

function nextWorkSignalRefreshStep(
  preview: WorkbenchDogfoodLoopSpineOverviewInput["next_work_signal_refresh_preview"],
): SpineStepBuild {
  if (!preview) {
    return missingStep({
      step_id: "next_work_signal_refresh",
      label: "Next-work signal refresh",
      recommended_next_action: "review_dogfood_metric_snapshot_record",
      summary: "No next-work signal refresh preview supplied.",
    });
  }

  return makeStep({
    step_id: "next_work_signal_refresh",
    label: "Next-work signal refresh",
    status:
      preview.refresh_preview_status === "no_metric_material"
        ? "no_current_material"
        : mapNextWorkSignalRefreshStatus(preview.refresh_preview_status),
    source_preview_ref_or_version: preview.preview_version,
    material_count: preview.input_summary.next_work_signal_count,
    blockers: preview.blocked_reasons,
    material_gaps: [
      ...preview.insufficient_data_reasons,
      ...(preview.input_summary.metric_material_count === 0
        ? ["dogfood_metric_snapshot_material_missing_for_next_work_refresh"]
        : []),
    ],
    missing_evidence: preview.evidence_summary.missing_evidence,
    recommended_next_action:
      preview.input_summary.next_work_signal_count > 0
        ? "review_next_work_signal_refresh"
        : "review_dogfood_metric_snapshot_record",
    evidence_present: preview.evidence_summary.has_metric_material,
    summary: `Next-work signal refresh is ${preview.refresh_preview_status}; signal_count ${preview.input_summary.next_work_signal_count}; no Perspective, NextWorkBias, CWP, relay, handoff, memory, or metric write authority.`,
  });
}

function nextWorkSignalDecisionStep(
  preview: WorkbenchDogfoodLoopSpineOverviewInput["next_work_signal_decision_preview"],
): SpineStepBuild {
  if (!preview) {
    return missingStep({
      step_id: "next_work_signal_operator_decision",
      label: "Next-work signal operator decision",
      recommended_next_action: "review_next_work_signal_refresh",
      summary: "No next-work signal operator decision preview supplied.",
    });
  }

  return makeStep({
    step_id: "next_work_signal_operator_decision",
    label: "Next-work signal operator decision",
    status: mapNextWorkSignalDecisionStatus(preview.decision_preview_status),
    source_preview_ref_or_version: preview.preview_version,
    material_count:
      preview.input_summary.signal_candidate_count +
      preview.input_summary.selected_signal_ref_count,
    blockers: [
      ...preview.blocking_reasons,
      ...preview.refusal_reasons,
      ...preview.write_readiness.current_blockers,
      ...preview.write_readiness.current_refusal_reasons,
    ],
    material_gaps: [
      ...preview.write_readiness.current_insufficient_data,
      ...(preview.input_summary.signal_candidate_count === 0
        ? ["next_work_signal_candidates_missing_for_decision"]
        : []),
    ],
    missing_evidence: [
      ...preview.missing_evidence,
      ...preview.write_readiness.current_missing_evidence,
    ],
    recommended_next_action: preview.write_readiness.write_ready
      ? "write_next_work_signal_decision_record"
      : preview.input_summary.signal_candidate_count > 0
        ? "review_next_work_signal_decision"
        : "review_next_work_signal_refresh",
    evidence_present: preview.evidence_summary.has_evidence_refs,
    summary: `Next-work signal decision preview is ${preview.decision_preview_status}; selected_signal_count ${preview.input_summary.selected_signal_ref_count}; write_ready ${String(preview.write_readiness.write_ready)}; no Perspective, CWP, relay, handoff, memory, metric, or external write authority.`,
  });
}

function nextWorkSignalDecisionRecordStep({
  recordReview,
  decisionPreview,
}: {
  recordReview: WorkbenchDogfoodLoopSpineOverviewInput["next_work_signal_decision_record_review"];
  decisionPreview: WorkbenchDogfoodLoopSpineOverviewInput["next_work_signal_decision_preview"];
}): SpineStepBuild {
  if (!recordReview) {
    return missingStep({
      step_id: "next_work_signal_decision_record",
      label: "Next-work signal decision local record",
      recommended_next_action: "review_next_work_signal_decision",
      summary: "No next-work signal decision record review supplied.",
    });
  }

  const decisionReady =
    decisionPreview?.decision_preview_status ===
      "ready_for_future_next_work_signal_record_write" &&
    decisionPreview.write_readiness.write_ready === true;
  const hasRecords = recordReview.input_summary.valid_record_count > 0;

  return makeStep({
    step_id: "next_work_signal_decision_record",
    label: "Next-work signal decision local record",
    status: mapRecordReviewStatus(recordReview.review_status),
    source_preview_ref_or_version: recordReview.review_version,
    material_count:
      recordReview.input_summary.valid_record_count +
      recordReview.input_summary.selected_signal_ref_count,
    blockers: [
      ...recordReview.blocked_reasons,
      ...(recordReview.input_summary.receipt_side_effect_problem_count > 0
        ? ["next_work_signal_decision_record_side_effect_problem"]
        : []),
      ...(decisionPreview?.blocking_reasons ?? []),
      ...(decisionPreview?.refusal_reasons ?? []),
    ],
    material_gaps: [
      ...recordReview.insufficient_data_reasons,
      ...(decisionReady && !hasRecords
        ? ["next_work_signal_decision_record_missing_after_operator_decision"]
        : []),
      ...(!decisionReady && !hasRecords
        ? ["next_work_signal_operator_decision_missing_or_not_ready"]
        : []),
    ],
    missing_evidence: [
      ...recordReview.evidence_summary.missing_evidence,
      ...(decisionPreview?.missing_evidence ?? []),
    ],
    recommended_next_action: hasRecords
      ? "review_next_work_signal_decision_record"
      : decisionReady
        ? "write_next_work_signal_decision_record"
        : "review_next_work_signal_decision",
    evidence_present: recordReview.evidence_summary.has_records,
    summary: `Next-work signal decision record review is ${recordReview.review_status}; valid_record_count ${recordReview.input_summary.valid_record_count}; decision_ready ${String(decisionReady)}; no Perspective, CWP, relay, handoff, memory, metric, or external write authority.`,
  });
}

function perspectiveRelayUpdateCandidateBridgeStep(
  preview: WorkbenchDogfoodLoopSpineOverviewInput["perspective_relay_update_candidate_bridge_preview"],
): SpineStepBuild {
  if (!preview) {
    return missingStep({
      step_id: "perspective_relay_update_candidate_bridge",
      label: "Perspective relay update candidate bridge",
      recommended_next_action: "review_next_work_signal_decision_record",
      summary: "No Perspective/Relay update candidate bridge preview supplied.",
    });
  }

  return makeStep({
    step_id: "perspective_relay_update_candidate_bridge",
    label: "Perspective relay update candidate bridge",
    status:
      preview.bridge_preview_status === "no_next_work_signal_material"
        ? "no_current_material"
        : mapPerspectiveRelayBridgeStatus(preview.bridge_preview_status),
    source_preview_ref_or_version: preview.preview_version,
    material_count: preview.input_summary.candidate_material_count,
    blockers: preview.blocked_reasons,
    material_gaps: [
      ...preview.insufficient_data_reasons,
      ...(preview.input_summary.candidate_material_count === 0
        ? ["perspective_relay_update_candidate_material_missing"]
        : []),
    ],
    missing_evidence: preview.evidence_summary.missing_evidence,
    recommended_next_action:
      preview.input_summary.candidate_material_count > 0
        ? "review_perspective_relay_update_candidates"
        : "review_next_work_signal_decision_record",
    evidence_present: preview.evidence_summary.has_next_work_signal_material,
    summary: `Perspective/Relay update candidate bridge is ${preview.bridge_preview_status}; candidate_count ${preview.input_summary.candidate_material_count}; no PerspectiveUnit, NextWorkBias, CWP, relay, handoff, memory, metric, or external write authority.`,
  });
}

function codexResultFeedbackStep(
  draft: WorkbenchDogfoodLoopSpineOverviewInput["codex_result_feedback_draft"],
): SpineStepBuild {
  if (!draft) {
    return missingStep({
      step_id: "codex_result_feedback",
      label: "Codex result feedback",
      recommended_next_action: "supply_codex_result_report",
      summary: "No Codex result feedback draft supplied.",
    });
  }

  const resultReportMissing = draft.source_status.codex_result_report !== "supplied";
  return makeStep({
    step_id: "codex_result_feedback",
    label: "Codex result feedback",
    status: resultReportMissing
      ? "insufficient_data"
      : mapCandidateStatus(draft.candidate_status),
    source_preview_ref_or_version: draft.draft_version,
    material_count: resultReportMissing ? 0 : countCodexResultFeedbackMaterial(draft),
    blockers: draft.stale_or_gap_warnings.filter(isSevereBlockerReason),
    material_gaps: [
      ...draft.insufficient_data_reasons,
      ...(resultReportMissing ? ["missing_codex_result_report"] : []),
    ],
    missing_evidence: draft.insufficient_data_reasons,
    recommended_next_action: resultReportMissing
      ? "supply_codex_result_report"
      : "review_reuse_candidate",
    evidence_present: !resultReportMissing,
    summary: `Codex result feedback draft is ${draft.candidate_status}; result_report ${draft.source_status.codex_result_report}.`,
  });
}

function dogfoodReuseProposalStep(
  proposal: WorkbenchDogfoodLoopSpineOverviewInput["dogfood_reuse_record_proposal"],
): SpineStepBuild {
  if (!proposal) {
    return missingStep({
      step_id: "dogfood_reuse_proposal",
      label: "Dogfood reuse proposal",
      recommended_next_action: "supply_codex_result_report",
      summary: "No dogfood reuse proposal supplied.",
    });
  }

  return makeStep({
    step_id: "dogfood_reuse_proposal",
    label: "Dogfood reuse proposal",
    status: mapProposalStatus(proposal.proposal_status),
    source_preview_ref_or_version: proposal.proposal_version,
    material_count: countDogfoodReuseProposalMaterial(proposal),
    blockers: proposal.blocked_reasons,
    material_gaps: proposal.insufficient_data_reasons,
    missing_evidence: proposal.evidence_summary.missing_evidence,
    recommended_next_action: proposal.evidence_summary.has_result_report
      ? "review_reuse_candidate"
      : "supply_codex_result_report",
    evidence_present: proposal.evidence_summary.has_result_report,
    summary: `Reuse proposal is ${proposal.proposal_status}; result_report ${proposal.source_status.codex_result_report}.`,
  });
}

function dogfoodReuseOperatorDecisionStep(
  preview: WorkbenchDogfoodLoopSpineOverviewInput["dogfood_reuse_operator_decision_preview"],
): SpineStepBuild {
  if (!preview) {
    return missingStep({
      step_id: "dogfood_reuse_operator_decision",
      label: "Reuse operator decision",
      recommended_next_action: "review_reuse_candidate",
      summary: "No reuse operator decision preview supplied.",
    });
  }

  return makeStep({
    step_id: "dogfood_reuse_operator_decision",
    label: "Reuse operator decision",
    status: mapDecisionStatus(preview.decision_preview_status),
    source_preview_ref_or_version: preview.preview_version,
    material_count: countDogfoodReuseDecisionMaterial(preview),
    blockers: [
      ...preview.blocking_reasons,
      ...preview.write_readiness.current_blockers,
    ],
    material_gaps: [
      ...preview.missing_evidence,
      ...preview.write_readiness.current_missing_evidence,
      ...(preview.evidence_summary.has_result_report
        ? []
        : ["missing_codex_result_report"]),
    ],
    missing_evidence: [
      ...preview.missing_evidence,
      ...preview.write_readiness.current_missing_evidence,
    ],
    recommended_next_action: preview.evidence_summary.has_result_report
      ? "review_reuse_candidate"
      : "supply_codex_result_report",
    evidence_present: preview.evidence_summary.has_result_report,
    summary: `Reuse decision preview is ${preview.decision_preview_status}; recommended ${preview.recommended_operator_decision}; write_ready ${String(preview.write_readiness.write_ready)}.`,
  });
}

function dogfoodMetricCandidateStep(
  preview: WorkbenchDogfoodLoopSpineOverviewInput["dogfood_metric_candidate_preview"],
): SpineStepBuild {
  if (!preview) {
    return missingStep({
      step_id: "dogfood_metric_candidate",
      label: "Dogfood metric candidate",
      recommended_next_action: "review_metric_candidate",
      summary: "No dogfood metric candidate preview supplied.",
    });
  }

  return makeStep({
    step_id: "dogfood_metric_candidate",
    label: "Dogfood metric candidate",
    status: mapCandidateStatus(preview.candidate_status),
    source_preview_ref_or_version: preview.preview_version,
    material_count:
      preview.aggregate_counts.approved_record_count +
      preview.source_record_summaries.length,
    blockers: preview.metric_write_readiness.refusal_reasons,
    material_gaps: [
      ...preview.insufficient_data_reasons,
      ...preview.metric_write_readiness.required_followup,
      ...(preview.aggregate_counts.approved_record_count === 0
        ? ["approved_reuse_records_missing_for_metric_preview"]
        : []),
    ],
    missing_evidence: preview.insufficient_data_reasons,
    recommended_next_action: "review_metric_candidate",
    evidence_present: preview.aggregate_counts.approved_record_count > 0,
    summary: `Metric candidate is ${preview.candidate_status}; approved_record_count ${preview.aggregate_counts.approved_record_count}.`,
  });
}

function perspectiveNextWorkCandidateStep(
  preview: WorkbenchDogfoodLoopSpineOverviewInput["perspective_next_work_candidate_update_preview"],
): SpineStepBuild {
  if (!preview) {
    return missingStep({
      step_id: "perspective_next_work_candidate",
      label: "Perspective next-work candidate",
      recommended_next_action: "review_next_work_candidate",
      summary: "No Perspective next-work candidate update preview supplied.",
    });
  }

  return makeStep({
    step_id: "perspective_next_work_candidate",
    label: "Perspective next-work candidate",
    status: mapCandidateStatus(preview.candidate_status),
    source_preview_ref_or_version: preview.preview_version,
    material_count: countPerspectiveNextWorkMaterial(preview),
    blockers: [
      ...preview.blocked_reasons,
      ...preview.write_readiness.refusal_reasons,
    ],
    material_gaps: [
      ...preview.insufficient_data_reasons,
      ...preview.write_readiness.required_followup,
    ],
    missing_evidence: preview.evidence_summary.missing_evidence,
    recommended_next_action: "review_next_work_candidate",
    evidence_present: preview.evidence_summary.evidence_refs.length > 0,
    summary: `Perspective next-work preview is ${preview.candidate_status}; ledger_record_count ${preview.input_summary.ledger_record_count}.`,
  });
}

function continuityRelayAdjustmentStep(
  preview: WorkbenchDogfoodLoopSpineOverviewInput["metric_informed_continuity_relay_adjustment_preview"],
): SpineStepBuild {
  if (!preview) {
    return missingStep({
      step_id: "continuity_relay_adjustment",
      label: "Continuity relay adjustment",
      recommended_next_action: "review_relay_adjustment",
      summary: "No metric-informed continuity relay adjustment preview supplied.",
    });
  }

  return makeStep({
    step_id: "continuity_relay_adjustment",
    label: "Continuity relay adjustment",
    status: mapCandidateStatus(preview.candidate_status),
    source_preview_ref_or_version: preview.preview_version,
    material_count: countRelayAdjustmentMaterial(preview),
    blockers: [
      ...preview.blocked_reasons,
      ...preview.write_readiness.refusal_reasons,
    ],
    material_gaps: [
      ...preview.insufficient_data_reasons,
      ...preview.write_readiness.required_followup,
    ],
    missing_evidence: preview.evidence_summary.missing_evidence,
    recommended_next_action: "review_relay_adjustment",
    evidence_present: preview.evidence_summary.evidence_refs.length > 0,
    summary: `Relay adjustment preview is ${preview.candidate_status}; missing_evidence_count ${preview.input_summary.missing_evidence_count}.`,
  });
}

function handoffContextUpdateStep(
  preview: WorkbenchDogfoodLoopSpineOverviewInput["handoff_context_update_preview"],
): SpineStepBuild {
  if (!preview) {
    return missingStep({
      step_id: "handoff_context_update",
      label: "Handoff context update",
      recommended_next_action: "review_handoff_context_update_candidate",
      summary: "No handoff context update preview supplied.",
    });
  }

  return makeStep({
    step_id: "handoff_context_update",
    label: "Handoff context update",
    status: mapCandidateStatus(preview.candidate_status),
    source_preview_ref_or_version: preview.preview_version,
    material_count: countHandoffContextUpdateMaterial(preview),
    blockers: [
      ...preview.blocked_reasons,
      ...preview.write_readiness.refusal_reasons,
    ],
    material_gaps: [
      ...preview.insufficient_data_reasons,
      ...preview.write_readiness.required_followup,
    ],
    missing_evidence: preview.evidence_summary.missing_evidence,
    recommended_next_action: "review_handoff_context_update_candidate",
    evidence_present: preview.evidence_summary.evidence_refs.length > 0,
    summary: `Handoff context update preview is ${preview.candidate_status}; selected_ref_candidates ${preview.input_summary.selected_ref_candidate_count}.`,
  });
}

function handoffContextUpdateDecisionStep(
  preview: WorkbenchDogfoodLoopSpineOverviewInput["handoff_context_update_operator_decision_preview"],
): SpineStepBuild {
  if (!preview) {
    return missingStep({
      step_id: "handoff_context_update_decision",
      label: "Handoff context update decision",
      recommended_next_action: "review_handoff_context_update_candidate",
      summary: "No handoff context update operator decision preview supplied.",
    });
  }

  return makeStep({
    step_id: "handoff_context_update_decision",
    label: "Handoff context update decision",
    status: mapDecisionStatus(preview.decision_preview_status),
    source_preview_ref_or_version: preview.preview_version,
    material_count: preview.input_summary.total_candidate_count,
    blockers: [
      ...preview.blocking_reasons,
      ...preview.write_readiness.current_blockers,
    ],
    material_gaps: [
      ...preview.missing_evidence,
      ...preview.write_readiness.current_missing_evidence,
    ],
    missing_evidence: [
      ...preview.missing_evidence,
      ...preview.write_readiness.current_missing_evidence,
    ],
    recommended_next_action: "review_handoff_context_update_candidate",
    evidence_present: preview.evidence_summary.evidence_refs.length > 0,
    summary: `Handoff update decision preview is ${preview.decision_preview_status}; write_ready ${String(preview.write_readiness.write_ready)}.`,
  });
}

function approvedHandoffContextUpdateRecordReviewStep(
  review: WorkbenchDogfoodLoopSpineOverviewInput["handoff_context_update_record_review"],
): SpineStepBuild {
  if (!review) {
    return missingStep({
      step_id: "approved_handoff_context_update_record_review",
      label: "Approved update record review",
      recommended_next_action: "review_approved_handoff_context_update_records",
      summary: "No approved handoff context update record review supplied.",
    });
  }

  return makeStep({
    step_id: "approved_handoff_context_update_record_review",
    label: "Approved update record review",
    status: mapRecordReviewStatus(review.review_status),
    source_preview_ref_or_version: review.review_version,
    material_count:
      review.input_summary.valid_record_count +
      sum(Object.values(review.approved_material_summary)),
    blockers: review.blocked_reasons,
    material_gaps: [
      ...review.insufficient_data_reasons,
      ...review.evidence_summary.missing_evidence,
    ],
    missing_evidence: review.evidence_summary.missing_evidence,
    recommended_next_action:
      "review_approved_handoff_context_update_records",
    evidence_present: review.evidence_summary.has_records,
    summary: `Approved update record review is ${review.review_status}; valid_record_count ${review.input_summary.valid_record_count}.`,
  });
}

function handoffContextApplyPreviewStep(
  preview: WorkbenchDogfoodLoopSpineOverviewInput["handoff_context_apply_preview"],
): SpineStepBuild {
  if (!preview) {
    return missingStep({
      step_id: "handoff_context_apply_preview",
      label: "Handoff context apply preview",
      recommended_next_action: "review_handoff_context_apply_preview",
      summary: "No handoff context apply preview supplied.",
    });
  }

  return makeStep({
    step_id: "handoff_context_apply_preview",
    label: "Handoff context apply preview",
    status: mapApplyPreviewStatus(preview.preview_status),
    source_preview_ref_or_version: preview.preview_version,
    material_count: preview.input_summary.apply_candidate_count,
    blockers: [
      ...preview.blocked_reasons,
      ...preview.conflict_summary.blocked_apply_reasons,
    ],
    material_gaps: [
      ...preview.insufficient_data_reasons,
      ...preview.evidence_summary.missing_evidence,
    ],
    missing_evidence: preview.evidence_summary.missing_evidence,
    recommended_next_action: "review_handoff_context_apply_preview",
    evidence_present: preview.evidence_summary.has_record_review,
    summary: `Apply preview is ${preview.preview_status}; apply_candidate_count ${preview.input_summary.apply_candidate_count}.`,
  });
}

function handoffContextApplyDecisionStep(
  preview: WorkbenchDogfoodLoopSpineOverviewInput["handoff_context_apply_operator_decision_preview"],
): SpineStepBuild {
  if (!preview) {
    return missingStep({
      step_id: "handoff_context_apply_decision",
      label: "Handoff context apply decision",
      recommended_next_action: "review_handoff_context_apply_preview",
      summary: "No handoff context apply operator decision preview supplied.",
    });
  }

  return makeStep({
    step_id: "handoff_context_apply_decision",
    label: "Handoff context apply decision",
    status: mapDecisionStatus(preview.decision_preview_status),
    source_preview_ref_or_version: preview.preview_version,
    material_count: preview.input_summary.apply_candidate_count,
    blockers: [
      ...preview.blocking_reasons,
      ...preview.readiness.current_blockers,
    ],
    material_gaps: [
      ...preview.insufficient_data_reasons,
      ...preview.missing_evidence,
      ...preview.readiness.current_missing_evidence,
    ],
    missing_evidence: [
      ...preview.missing_evidence,
      ...preview.readiness.current_missing_evidence,
    ],
    recommended_next_action: "review_handoff_context_apply_preview",
    evidence_present: preview.evidence_summary.has_apply_preview,
    summary: `Apply decision preview is ${preview.decision_preview_status}; ready_for_future_apply_write ${String(preview.readiness.ready_for_future_apply_write)}.`,
  });
}

function handoffContextApplyWriteContractStep(
  preview: WorkbenchDogfoodLoopSpineOverviewInput["handoff_context_apply_write_contract_preview"],
): SpineStepBuild {
  if (!preview) {
    return missingStep({
      step_id: "handoff_context_apply_write_contract",
      label: "Apply write contract readiness",
      recommended_next_action: "review_apply_write_contract_preview",
      summary: "No handoff context apply write contract preview supplied.",
    });
  }

  const requiresCurrentMaterial =
    !preview.input_summary.current_handoff_packet_fingerprint_supplied ||
    !preview.input_summary.current_handoff_context_ref_supplied ||
    !preview.input_summary.requested_operator_ref_supplied;

  return makeStep({
    step_id: "handoff_context_apply_write_contract",
    label: "Apply write contract readiness",
    status: mapApplyWriteContractStatus(preview.contract_preview_status),
    source_preview_ref_or_version: preview.preview_version,
    material_count: preview.input_summary.would_apply_candidate_count,
    blockers: [
      ...preview.blocked_reasons,
      ...preview.refusal_reasons,
      ...preview.readiness.current_blockers,
      ...preview.readiness.current_refusal_reasons,
    ],
    material_gaps: [
      ...preview.insufficient_data_reasons,
      ...preview.missing_evidence,
      ...preview.readiness.current_insufficient_data,
      ...preview.readiness.current_missing_evidence,
      ...(preview.input_summary.current_handoff_packet_fingerprint_supplied
        ? []
        : ["current_handoff_packet_fingerprint_missing"]),
      ...(preview.input_summary.current_handoff_context_ref_supplied
        ? []
        : ["current_handoff_context_ref_missing"]),
      ...(preview.input_summary.requested_operator_ref_supplied
        ? []
        : ["operator_approval_material_missing"]),
    ],
    missing_evidence: [
      ...preview.missing_evidence,
      ...preview.readiness.current_missing_evidence,
    ],
    recommended_next_action: requiresCurrentMaterial
      ? "supply_current_handoff_packet_fingerprint"
      : "review_apply_write_contract_preview",
    evidence_present: preview.evidence_summary.has_apply_operator_decision_preview,
    summary: `Apply write contract preview is ${preview.contract_preview_status}; next ${preview.recommended_next_action}; future_write_scope ${String(preview.readiness.ready_for_future_write_scope)}.`,
  });
}

function makeStep({
  step_id,
  label,
  status,
  source_preview_ref_or_version,
  material_count,
  blockers,
  material_gaps,
  missing_evidence,
  recommended_next_action,
  evidence_present,
  summary,
}: Omit<SpineStepBuild, "read_only" | "blocker_count" | "missing_evidence_count" | "severe_blockers">): SpineStepBuild {
  const uniqueBlockers = uniqueSortedStrings(blockers);
  const { severeBlockers, gapReasons } = splitBlockersAndMaterialGaps([
    ...uniqueBlockers,
    ...material_gaps,
  ]);
  const finalStatus =
    severeBlockers.length > 0
      ? "blocked"
      : status === "blocked" && gapReasons.length > 0
        ? "insufficient_data"
        : status;

  return {
    step_id,
    label,
    status: finalStatus,
    source_preview_ref_or_version,
    material_count,
    blocker_count: uniqueBlockers.length,
    missing_evidence_count: uniqueSortedStrings(missing_evidence).length,
    recommended_next_action:
      severeBlockers.length > 0
        ? "resolve_blockers_or_missing_evidence"
        : recommended_next_action,
    evidence_present,
    read_only: true,
    summary,
    blockers: uniqueBlockers,
    material_gaps: uniqueSortedStrings(gapReasons),
    missing_evidence: uniqueSortedStrings(missing_evidence),
    severe_blockers: uniqueSortedStrings(severeBlockers),
  };
}

function missingStep({
  step_id,
  label,
  recommended_next_action,
  summary,
}: {
  step_id: WorkbenchDogfoodLoopSpineStepId;
  label: string;
  recommended_next_action: WorkbenchDogfoodLoopSpineRecommendedNextOperatorAction;
  summary: string;
}): SpineStepBuild {
  return {
    step_id,
    label,
    status: "not_supplied",
    source_preview_ref_or_version: null,
    material_count: 0,
    blocker_count: 0,
    missing_evidence_count: 0,
    recommended_next_action,
    evidence_present: false,
    read_only: true,
    summary,
    blockers: [],
    material_gaps: ["already_built_preview_object_missing"],
    missing_evidence: [],
    severe_blockers: [],
  };
}

function splitBlockersAndMaterialGaps(reasons: string[]): {
  severeBlockers: string[];
  gapReasons: string[];
} {
  const severeBlockers: string[] = [];
  const gapReasons: string[] = [];
  for (const reason of uniqueSortedStrings(reasons)) {
    if (!reason) continue;
    if (isMaterialGapReason(reason)) {
      gapReasons.push(reason);
    } else {
      severeBlockers.push(reason);
    }
  }
  return {
    severeBlockers: uniqueSortedStrings(severeBlockers),
    gapReasons: uniqueSortedStrings(gapReasons),
  };
}

function isMaterialGapReason(reason: string): boolean {
  if (isSevereBlockerReason(reason)) return false;
  return /missing|insufficient|no_records|no_digest|not_supplied|requires_|required_|supply|review_|needs_more|candidate_material|workbench_default|fingerprint|operator_approval|current_handoff_context_ref/i.test(
    reason,
  );
}

function isSevereBlockerReason(reason: string): boolean {
  return /unsafe|secret|private|credential|invalid|conflict|duplicate|problem|unexpected_write_ready|write_authority|mutated|sent|provider|github|codex_executed|unknown_selected_ref/i.test(
    reason,
  );
}

function determineOverviewStatus({
  steps,
  top_blockers,
  top_missing_evidence,
  current_material_gaps,
}: {
  steps: SpineStepBuild[];
  top_blockers: string[];
  top_missing_evidence: string[];
  current_material_gaps: string[];
}): WorkbenchDogfoodLoopSpineOverviewStatus {
  if (top_blockers.length > 0) return "blocked";
  if (
    steps[0]?.recommended_next_action === "supply_selected_session_digest" &&
    steps[0].material_count === 0
  ) {
    return "no_current_material";
  }
  if (
    top_missing_evidence.length > 0 ||
    current_material_gaps.length > 0 ||
    steps.some((step) => step.status === "insufficient_data")
  ) {
    return "insufficient_data";
  }
  if (
    steps.some((step) =>
      ["ready_for_operator_review", "ready_for_future_contract_review"].includes(
        step.status,
      ),
    )
  ) {
    return "ready_for_operator_review";
  }
  if (steps.some((step) => step.material_count > 0)) {
    return "candidate_material_available";
  }
  if (steps.some((step) => step.status !== "not_supplied")) return "chain_visible";
  return "keep_preview_only";
}

function determineRecommendedNextOperatorAction({
  steps,
  top_blockers,
  top_missing_evidence,
  current_material_gaps,
}: {
  steps: SpineStepBuild[];
  top_blockers: string[];
  top_missing_evidence: string[];
  current_material_gaps: string[];
}): WorkbenchDogfoodLoopSpineRecommendedNextOperatorAction {
  if (
    top_blockers.some((blocker) =>
      blocker.startsWith("selected_session_digest_ingest_operator_decision:"),
    )
  ) {
    return "resolve_selected_session_digest_ingest_decision_blockers";
  }
  if (
    top_blockers.some((blocker) =>
      blocker.startsWith("selected_session_digest_durable_ingest_record:"),
    )
  ) {
    return "resolve_selected_session_digest_ingest_record_blockers";
  }
  if (
    top_blockers.some((blocker) =>
      blocker.startsWith("project_history_intake:") ||
      blocker.startsWith("project_history_candidate_ingest_record:"),
    )
  ) {
    return "resolve_project_history_intake_blockers";
  }
  if (
    top_blockers.some((blocker) =>
      blocker.startsWith("codex_result_report_intake:") ||
      blocker.startsWith("codex_result_report_candidate_ingest_record:"),
    )
  ) {
    return "resolve_codex_result_report_intake_blockers";
  }
  if (
    top_blockers.some((blocker) =>
      blocker.startsWith("expected_observed_delta:") ||
      blocker.startsWith("expected_observed_delta_record:") ||
      blocker.startsWith("reuse_outcome_candidate_bridge:") ||
      blocker.startsWith("reuse_outcome_bridge_operator_decision:") ||
      blocker.startsWith("handoff_reuse_outcome_ledger_record:") ||
      blocker.startsWith("dogfood_metric_snapshot:") ||
      blocker.startsWith("dogfood_metric_snapshot_record:") ||
      blocker.startsWith("next_work_signal_refresh:") ||
      blocker.startsWith("next_work_signal_operator_decision:") ||
      blocker.startsWith("next_work_signal_decision_record:") ||
      blocker.startsWith("perspective_relay_update_candidate_bridge:"),
    )
  ) {
    if (
      top_blockers.some((blocker) =>
        blocker.startsWith("expected_observed_delta"),
      )
    ) {
      return "resolve_expected_observed_delta_blockers";
    }
    if (
      top_blockers.some(
        (blocker) =>
          blocker.startsWith("dogfood_metric_snapshot") ||
          blocker.startsWith("next_work_signal_refresh"),
      )
    ) {
      return "resolve_dogfood_metric_snapshot_blockers";
    }
    if (
      top_blockers.some(
        (blocker) =>
          blocker.startsWith("next_work_signal_operator_decision") ||
          blocker.startsWith("next_work_signal_decision_record") ||
          blocker.startsWith("perspective_relay_update_candidate_bridge"),
      )
    ) {
      return "resolve_next_work_signal_blockers";
    }
    return "resolve_reuse_outcome_bridge_blockers";
  }
  if (top_blockers.length > 0) return "resolve_blockers_or_missing_evidence";
  if (steps[0]?.recommended_next_action === "supply_selected_session_digest") {
    return "supply_selected_session_digest";
  }
  const selectedDigestContractStep = steps.find(
    (step) => step.step_id === "selected_session_digest_ingest_contract",
  );
  if (
    selectedDigestContractStep &&
    selectedDigestContractStep.status !== "not_supplied" &&
    selectedDigestContractStep.status !== "ready_for_future_contract_review" &&
    selectedDigestContractStep.status !== "keep_preview_only" &&
    selectedDigestContractStep.recommended_next_action !== "keep_preview_only"
  ) {
    return selectedDigestContractStep.recommended_next_action;
  }
  const selectedDigestDecisionStep = steps.find(
    (step) =>
      step.step_id === "selected_session_digest_ingest_operator_decision",
  );
  if (
    selectedDigestDecisionStep &&
    selectedDigestDecisionStep.status !== "not_supplied" &&
    selectedDigestDecisionStep.status !== "keep_preview_only"
  ) {
    if (
      selectedDigestContractStep?.status === "ready_for_future_contract_review"
    ) {
      const selectedDigestRecordStep = steps.find(
        (step) =>
          step.step_id === "selected_session_digest_durable_ingest_record",
      );
      if (
        selectedDigestRecordStep?.status !== "not_supplied" &&
        selectedDigestRecordStep?.recommended_next_action ===
        "write_selected_session_digest_candidate_ingest_record"
      ) {
        return "write_selected_session_digest_candidate_ingest_record";
      }
      if (
        selectedDigestRecordStep?.status !== "not_supplied" &&
        selectedDigestRecordStep?.recommended_next_action ===
        "review_selected_session_digest_ingest_record"
      ) {
        // Selected-session candidate ingest already has a record; let the
        // broader Phase 1 source-family gaps drive the next restart point.
      } else if (
        selectedDigestRecordStep?.status !== "not_supplied" &&
        selectedDigestDecisionStep.recommended_next_action ===
        "prepare_operator_approved_selected_session_digest_ingest_decision_record"
      ) {
        return "prepare_operator_approved_selected_session_digest_ingest_decision_record";
      } else {
        return selectedDigestDecisionStep.recommended_next_action;
      }
    }
  }
  const projectHistoryIntake = steps.find(
    (step) => step.step_id === "project_history_intake",
  );
  if (
    projectHistoryIntake &&
    projectHistoryIntake.status !== "not_supplied" &&
    projectHistoryIntake.status !== "ready_for_operator_review" &&
    projectHistoryIntake.status !== "candidate_material_available" &&
    projectHistoryIntake.recommended_next_action ===
      "supply_project_history_digest"
  ) {
    return "supply_project_history_digest";
  }
  const projectHistoryRecord = steps.find(
    (step) => step.step_id === "project_history_candidate_ingest_record",
  );
  if (
    projectHistoryRecord?.recommended_next_action ===
    "write_project_history_candidate_ingest_record"
  ) {
    return "write_project_history_candidate_ingest_record";
  }
  if (
    projectHistoryRecord?.recommended_next_action ===
    "review_project_history_intake_record" &&
    projectHistoryRecord.material_count > 0
  ) {
    return "review_project_history_intake_record";
  }
  if (
    projectHistoryIntake?.recommended_next_action ===
    "review_project_history_intake_candidates"
  ) {
    return "review_project_history_intake_candidates";
  }
  const codexResultIntake = steps.find(
    (step) => step.step_id === "codex_result_report_intake",
  );
  if (
    codexResultIntake &&
    codexResultIntake.status !== "not_supplied" &&
    codexResultIntake.status !== "ready_for_operator_review" &&
    codexResultIntake.status !== "candidate_material_available" &&
    codexResultIntake.recommended_next_action === "supply_codex_result_report"
  ) {
    return "supply_codex_result_report";
  }
  const codexResultRecord = steps.find(
    (step) => step.step_id === "codex_result_report_candidate_ingest_record",
  );
  const expectedObservedDeltaStep = steps.find(
    (step) => step.step_id === "expected_observed_delta",
  );
  const expectedObservedDeltaRecordStep = steps.find(
    (step) => step.step_id === "expected_observed_delta_record",
  );
  const reuseOutcomeBridgeStep = steps.find(
    (step) => step.step_id === "reuse_outcome_candidate_bridge",
  );
  const reuseOutcomeBridgeDecisionStep = steps.find(
    (step) => step.step_id === "reuse_outcome_bridge_operator_decision",
  );
  const handoffReuseOutcomeLedgerRecordStep = steps.find(
    (step) => step.step_id === "handoff_reuse_outcome_ledger_record",
  );
  const dogfoodMetricSnapshotStep = steps.find(
    (step) => step.step_id === "dogfood_metric_snapshot",
  );
  const dogfoodMetricSnapshotRecordStep = steps.find(
    (step) => step.step_id === "dogfood_metric_snapshot_record",
  );
  const nextWorkSignalRefreshStep = steps.find(
    (step) => step.step_id === "next_work_signal_refresh",
  );
  const nextWorkSignalDecisionStep = steps.find(
    (step) => step.step_id === "next_work_signal_operator_decision",
  );
  const nextWorkSignalDecisionRecordStep = steps.find(
    (step) => step.step_id === "next_work_signal_decision_record",
  );
  const perspectiveRelayUpdateCandidateBridgeStep = steps.find(
    (step) => step.step_id === "perspective_relay_update_candidate_bridge",
  );
  if (
    codexResultRecord?.recommended_next_action ===
    "write_codex_result_report_candidate_ingest_record"
  ) {
    return "write_codex_result_report_candidate_ingest_record";
  }
  if (
    expectedObservedDeltaRecordStep?.recommended_next_action ===
    "write_expected_observed_delta_record"
  ) {
    return "write_expected_observed_delta_record";
  }
  if (
    handoffReuseOutcomeLedgerRecordStep?.recommended_next_action ===
    "write_handoff_reuse_outcome_ledger_record"
  ) {
    return "write_handoff_reuse_outcome_ledger_record";
  }
  if (
    dogfoodMetricSnapshotRecordStep?.recommended_next_action ===
    "write_dogfood_metric_snapshot_record"
  ) {
    return "write_dogfood_metric_snapshot_record";
  }
  if (
    nextWorkSignalDecisionRecordStep?.recommended_next_action ===
    "write_next_work_signal_decision_record"
  ) {
    return "write_next_work_signal_decision_record";
  }
  if (
    perspectiveRelayUpdateCandidateBridgeStep?.recommended_next_action ===
      "review_perspective_relay_update_candidates" &&
    perspectiveRelayUpdateCandidateBridgeStep.material_count > 0
  ) {
    return "review_perspective_relay_update_candidates";
  }
  if (
    nextWorkSignalDecisionRecordStep?.recommended_next_action ===
      "review_next_work_signal_decision_record" &&
    nextWorkSignalDecisionRecordStep.material_count > 0
  ) {
    return "review_next_work_signal_decision_record";
  }
  if (
    nextWorkSignalDecisionStep?.recommended_next_action ===
      "review_next_work_signal_decision" &&
    nextWorkSignalDecisionStep.material_count > 0
  ) {
    return "review_next_work_signal_decision";
  }
  if (
    nextWorkSignalRefreshStep?.recommended_next_action ===
      "review_next_work_signal_refresh" &&
    nextWorkSignalRefreshStep.material_count > 0
  ) {
    return "review_next_work_signal_refresh";
  }
  if (
    dogfoodMetricSnapshotRecordStep?.recommended_next_action ===
      "review_next_work_signal_refresh" &&
    dogfoodMetricSnapshotRecordStep.material_count > 0
  ) {
    return "review_next_work_signal_refresh";
  }
  if (
    dogfoodMetricSnapshotStep?.recommended_next_action ===
      "review_dogfood_metric_snapshot_candidates" &&
    dogfoodMetricSnapshotStep.material_count > 0
  ) {
    return "review_dogfood_metric_snapshot_candidates";
  }
  if (
    reuseOutcomeBridgeDecisionStep?.recommended_next_action ===
      "review_reuse_outcome_bridge_decision" &&
    reuseOutcomeBridgeDecisionStep.material_count > 0
  ) {
    return "review_reuse_outcome_bridge_decision";
  }
  if (
    reuseOutcomeBridgeStep?.recommended_next_action ===
    "review_reuse_outcome_candidate_bridge" &&
    reuseOutcomeBridgeStep.material_count > 0
  ) {
    return "review_reuse_outcome_candidate_bridge";
  }
  if (
    handoffReuseOutcomeLedgerRecordStep?.recommended_next_action ===
      "review_handoff_reuse_outcome_ledger_record" &&
    handoffReuseOutcomeLedgerRecordStep.material_count > 0
  ) {
    return "review_handoff_reuse_outcome_ledger_record";
  }
  if (
    expectedObservedDeltaStep?.recommended_next_action ===
    "review_expected_observed_delta_candidates" &&
    expectedObservedDeltaStep.material_count > 0
  ) {
    return "review_expected_observed_delta_candidates";
  }
  if (
    codexResultRecord?.recommended_next_action ===
    "review_codex_result_report_intake_record" &&
    codexResultRecord.material_count > 0
  ) {
    return "review_codex_result_report_intake_record";
  }
  const residueStep = steps.find(
    (step) => step.step_id === "work_episode_residue_candidate",
  );
  if (
    residueStep?.recommended_next_action ===
    "review_work_episode_residue_candidates" &&
    residueStep.material_count > 0
  ) {
    return "review_work_episode_residue_candidates";
  }
  if (
    codexResultIntake?.recommended_next_action ===
    "review_codex_result_report_intake_candidates"
  ) {
    return "review_codex_result_report_intake_candidates";
  }
  if (
    steps.some(
      (step) =>
        step.step_id === "codex_result_feedback" &&
        step.recommended_next_action === "supply_codex_result_report",
    ) ||
    current_material_gaps.some((gap) =>
      /missing_codex_result_report|codex_result_report_or_raw_text_missing/i.test(
        gap,
      ),
    )
  ) {
    return "supply_codex_result_report";
  }
  const applyWriteContractStep = steps.find(
    (step) => step.step_id === "handoff_context_apply_write_contract",
  );
  if (
    applyWriteContractStep?.recommended_next_action ===
    "supply_current_handoff_packet_fingerprint"
  ) {
    return "supply_current_handoff_packet_fingerprint";
  }
  if (
    current_material_gaps.some((gap) =>
      /current_handoff_packet_fingerprint|current_handoff_context_ref|operator_approval_material/i.test(
        gap,
      ),
    )
  ) {
    return "supply_current_handoff_packet_fingerprint";
  }
  if (top_missing_evidence.length > 0 || current_material_gaps.length > 0) {
    return "resolve_blockers_or_missing_evidence";
  }
  return (
    steps.find((step) => step.material_count > 0)?.recommended_next_action ??
    "keep_preview_only"
  );
}

function mapSelectedSessionStatus(
  status: string,
): WorkbenchDogfoodLoopSpineStepStatus {
  if (status === "no_digest") return "no_current_material";
  if (status === "unsafe" || status === "malformed") return "blocked";
  if (status === "ready_for_operator_review") return "ready_for_operator_review";
  if (status === "candidate_material_available") {
    return "candidate_material_available";
  }
  if (status === "keep_preview_only") return "keep_preview_only";
  return "insufficient_data";
}

function mapSelectedSessionIngestContractStatus(
  status: string,
): WorkbenchDogfoodLoopSpineStepStatus {
  if (status === "no_intake_preview") return "no_current_material";
  if (status === "blocked") return "blocked";
  if (status === "ready_for_future_ingest_write_scope") {
    return "ready_for_future_contract_review";
  }
  if (status === "ready_for_operator_review") return "ready_for_operator_review";
  if (status === "contract_candidates_available") {
    return "candidate_material_available";
  }
  if (status === "keep_preview_only") return "keep_preview_only";
  return "insufficient_data";
}

function mapSelectedSessionIngestOperatorDecisionStatus(
  status: string,
): WorkbenchDogfoodLoopSpineStepStatus {
  if (status === "no_ingest_contract_preview") return "no_current_material";
  if (status === "blocked") return "blocked";
  if (status === "ready_for_future_decision_record_write") {
    return "ready_for_future_contract_review";
  }
  if (
    status === "ready_for_operator_decision" ||
    status === "needs_operator_judgment"
  ) {
    return "ready_for_operator_review";
  }
  if (status === "keep_preview_only") return "keep_preview_only";
  return "insufficient_data";
}

function mapProjectHistoryIntakeStatus(
  status: string,
): WorkbenchDogfoodLoopSpineStepStatus {
  if (status === "no_history") return "no_current_material";
  if (status === "unsafe" || status === "malformed") return "blocked";
  if (status === "ready_for_operator_review") return "ready_for_operator_review";
  if (status === "candidate_material_available") {
    return "candidate_material_available";
  }
  if (status === "keep_preview_only") return "keep_preview_only";
  return "insufficient_data";
}

function mapCandidateResidueStatus(
  status: string,
): WorkbenchDogfoodLoopSpineStepStatus {
  if (status === "no_codex_result_material") return "no_current_material";
  if (status === "ready_for_operator_review") return "ready_for_operator_review";
  if (status === "candidate_residue_available") {
    return "candidate_material_available";
  }
  if (status === "keep_preview_only") return "keep_preview_only";
  return "insufficient_data";
}

function mapExpectedObservedDeltaStatus(
  status: string,
): WorkbenchDogfoodLoopSpineStepStatus {
  if (status === "no_result_material") return "no_current_material";
  if (status === "ready_for_operator_review") return "ready_for_operator_review";
  if (status === "delta_candidates_available") {
    return "candidate_material_available";
  }
  if (status === "keep_preview_only") return "keep_preview_only";
  return "insufficient_data";
}

function mapReuseOutcomeBridgeStatus(
  status: string,
): WorkbenchDogfoodLoopSpineStepStatus {
  if (status === "no_delta_material") return "no_current_material";
  if (status === "ready_for_operator_review") return "ready_for_operator_review";
  if (status === "reuse_outcome_candidates_available") {
    return "candidate_material_available";
  }
  if (status === "keep_preview_only") return "keep_preview_only";
  return "insufficient_data";
}

function mapMetricSnapshotStatus(
  status: string,
): WorkbenchDogfoodLoopSpineStepStatus {
  if (status === "no_reuse_outcome_records") return "no_current_material";
  if (status === "ready_for_operator_review") return "ready_for_operator_review";
  if (status === "metric_candidates_available") {
    return "candidate_material_available";
  }
  if (status === "keep_preview_only") return "keep_preview_only";
  return "insufficient_data";
}

function mapNextWorkSignalRefreshStatus(
  status: string,
): WorkbenchDogfoodLoopSpineStepStatus {
  if (status === "no_metric_material") return "no_current_material";
  if (status === "ready_for_operator_review") return "ready_for_operator_review";
  if (status === "next_work_signals_available") {
    return "candidate_material_available";
  }
  if (status === "keep_preview_only") return "keep_preview_only";
  return "insufficient_data";
}

function mapNextWorkSignalDecisionStatus(
  status: string,
): WorkbenchDogfoodLoopSpineStepStatus {
  if (status === "no_next_work_signal_refresh_preview") {
    return "no_current_material";
  }
  if (status === "ready_for_future_next_work_signal_record_write") {
    return "ready_for_future_contract_review";
  }
  if (
    status === "ready_for_operator_decision" ||
    status === "needs_operator_judgment"
  ) {
    return "ready_for_operator_review";
  }
  if (status === "blocked") return "blocked";
  if (status === "keep_preview_only") return "keep_preview_only";
  return "insufficient_data";
}

function mapPerspectiveRelayBridgeStatus(
  status: string,
): WorkbenchDogfoodLoopSpineStepStatus {
  if (status === "no_next_work_signal_material") return "no_current_material";
  if (status === "ready_for_operator_review") return "ready_for_operator_review";
  if (status === "update_candidates_available") {
    return "candidate_material_available";
  }
  if (status === "keep_preview_only") return "keep_preview_only";
  return "insufficient_data";
}

function mapCandidateStatus(status: string): WorkbenchDogfoodLoopSpineStepStatus {
  if (status === "insufficient_data") return "insufficient_data";
  if (status.includes("needs_operator_review")) {
    return "ready_for_operator_review";
  }
  if (status.includes("candidate")) return "candidate_material_available";
  return "candidate_material_available";
}

function mapProposalStatus(status: string): WorkbenchDogfoodLoopSpineStepStatus {
  if (status === "proposal_ready_for_operator_review") {
    return "ready_for_operator_review";
  }
  if (status.includes("blocked")) return "blocked";
  return "insufficient_data";
}

function mapDecisionStatus(status: string): WorkbenchDogfoodLoopSpineStepStatus {
  if (status.includes("ready_for_future")) {
    return "ready_for_future_contract_review";
  }
  if (status === "ready_for_operator_review" || status === "ready_for_operator_decision") {
    return "ready_for_operator_review";
  }
  if (status === "blocked" || status.includes("blocked")) return "blocked";
  if (status === "keep_preview_only") return "keep_preview_only";
  return "insufficient_data";
}

function mapRecordReviewStatus(
  status: string,
): WorkbenchDogfoodLoopSpineStepStatus {
  if (status === "no_records") return "no_current_material";
  if (
    status === "selected_record_available" ||
    status === "selected_record_found" ||
    status === "records_available"
  ) {
    return "candidate_material_available";
  }
  if (status === "invalid_records" || status === "records_invalid") {
    return "blocked";
  }
  return "insufficient_data";
}

function mapApplyPreviewStatus(
  status: string,
): WorkbenchDogfoodLoopSpineStepStatus {
  if (status === "apply_candidates_available") {
    return "candidate_material_available";
  }
  if (status === "needs_operator_review") return "ready_for_operator_review";
  if (status === "blocked") return "blocked";
  if (status === "no_records" || status === "no_selected_record") {
    return "no_current_material";
  }
  return "insufficient_data";
}

function mapApplyWriteContractStatus(
  status: string,
): WorkbenchDogfoodLoopSpineStepStatus {
  if (status === "ready_for_future_write_scope") {
    return "ready_for_future_contract_review";
  }
  if (status === "ready_for_operator_review") return "ready_for_operator_review";
  if (status === "contract_candidates_available") {
    return "candidate_material_available";
  }
  if (status === "blocked") return "blocked";
  if (status === "keep_preview_only") return "keep_preview_only";
  return "insufficient_data";
}

function countCodexResultFeedbackMaterial(
  draft: NonNullable<
    WorkbenchDogfoodLoopSpineOverviewInput["codex_result_feedback_draft"]
  >,
): number {
  return sum([
    draft.expected_observed_delta.matched_expectations.length,
    draft.expected_observed_delta.missing_expectations.length,
    draft.expected_observed_delta.unexpected_observations.length,
    draft.expected_observed_delta.changed_files_observed.length,
    draft.expected_observed_delta.checks_observed.length,
    draft.reuse_outcome_draft.helpful_refs.length,
    draft.reuse_outcome_draft.stale_refs.length,
    draft.reuse_outcome_draft.missing_refs.length,
    draft.reuse_outcome_draft.noisy_refs.length,
    draft.reuse_outcome_draft.misleading_refs.length,
    draft.reuse_outcome_draft.unknown_refs.length,
    draft.carry_forward_suggestions.next_relay_update_suggestions.length,
    draft.carry_forward_suggestions.next_handoff_adjustments.length,
  ]);
}

function countDogfoodReuseProposalMaterial(
  proposal: NonNullable<
    WorkbenchDogfoodLoopSpineOverviewInput["dogfood_reuse_record_proposal"]
  >,
): number {
  return sum([
    proposal.proposed_expected_observed_summary.matched_expectation_count,
    proposal.proposed_expected_observed_summary.missing_expectation_count,
    proposal.proposed_expected_observed_summary.unexpected_observation_count,
    proposal.proposed_reuse_classifications.helpful_refs.length,
    proposal.proposed_reuse_classifications.stale_refs.length,
    proposal.proposed_reuse_classifications.missing_refs.length,
    proposal.proposed_reuse_classifications.noisy_refs.length,
    proposal.proposed_reuse_classifications.misleading_refs.length,
    proposal.proposed_reuse_classifications.unknown_refs.length,
    proposal.carry_forward_candidates.next_relay_update_suggestions.length,
    proposal.carry_forward_candidates.next_handoff_adjustments.length,
  ]);
}

function countDogfoodReuseDecisionMaterial(
  preview: NonNullable<
    WorkbenchDogfoodLoopSpineOverviewInput["dogfood_reuse_operator_decision_preview"]
  >,
): number {
  return sum([
    ...Object.values(preview.would_write_preview.proposed_reuse_bucket_counts),
    preview.would_write_preview.proposed_dogfood_signal_summary
      .requirement_progress_observed.length,
    preview.would_write_preview.proposed_dogfood_signal_summary.checks_observed
      .length,
    preview.candidate_carry_forward.next_relay_update_suggestions.length,
    preview.candidate_carry_forward.next_handoff_adjustments.length,
  ]);
}

function countPerspectiveNextWorkMaterial(
  preview: NonNullable<
    WorkbenchDogfoodLoopSpineOverviewInput["perspective_next_work_candidate_update_preview"]
  >,
): number {
  return sum([
    ...Object.values(preview.proposed_perspective_unit_updates).map(
      (items) => items.length,
    ),
    ...Object.values(preview.proposed_next_work_bias_updates)
      .filter(Array.isArray)
      .map((items) => items.length),
    ...Object.values(preview.proposed_carry_forward_memory_candidates)
      .filter(Array.isArray)
      .map((items) => items.length),
  ]);
}

function countRelayAdjustmentMaterial(
  preview: NonNullable<
    WorkbenchDogfoodLoopSpineOverviewInput["metric_informed_continuity_relay_adjustment_preview"]
  >,
): number {
  return sum([
    ...Object.values(preview.proposed_relay_preserve_adjustments).map(
      (items) => items.length,
    ),
    ...Object.values(preview.proposed_relay_warning_adjustments).map(
      (items) => items.length,
    ),
    ...Object.values(preview.proposed_stop_if_missing_adjustments).map(
      (items) => items.length,
    ),
    ...Object.values(preview.proposed_next_focus_adjustments).map(
      (items) => items.length,
    ),
    ...Object.values(preview.proposed_context_diet_adjustments).map(
      (items) => items.length,
    ),
  ]);
}

function countHandoffContextUpdateMaterial(
  preview: NonNullable<
    WorkbenchDogfoodLoopSpineOverviewInput["handoff_context_update_preview"]
  >,
): number {
  return sum([
    ...Object.values(preview.proposed_selected_ref_updates).map(
      (items) => items.length,
    ),
    ...Object.values(preview.proposed_warning_updates).map(
      (items) => items.length,
    ),
    ...Object.values(preview.proposed_context_diet_updates).map(
      (items) => items.length,
    ),
    ...Object.values(preview.proposed_stop_if_missing_updates).map(
      (items) => items.length,
    ),
    ...Object.values(preview.proposed_expected_return_signal_updates).map(
      (items) => items.length,
    ),
  ]);
}

function buildSpineSummaryText({
  overviewStatus,
  recommendedNextOperatorAction,
  topBlockers,
  currentMaterialGaps,
}: {
  overviewStatus: WorkbenchDogfoodLoopSpineOverviewStatus;
  recommendedNextOperatorAction: WorkbenchDogfoodLoopSpineRecommendedNextOperatorAction;
  topBlockers: string[];
  currentMaterialGaps: string[];
}): string {
  if (topBlockers.length > 0) {
    return `Dogfood loop spine is ${overviewStatus}; resolve ${topBlockers.length} blocker(s) before treating downstream previews as review-ready.`;
  }
  if (currentMaterialGaps.length > 0) {
    return `Dogfood loop spine is ${overviewStatus}; next operator action is ${recommendedNextOperatorAction} with ${currentMaterialGaps.length} current material gap(s).`;
  }
  return `Dogfood loop spine is ${overviewStatus}; next operator action is ${recommendedNextOperatorAction}.`;
}

function buildNextOperatorActionRationale({
  recommendedNextOperatorAction,
  topBlockers,
  topMissingEvidence,
  currentMaterialGaps,
  steps,
}: {
  recommendedNextOperatorAction: WorkbenchDogfoodLoopSpineRecommendedNextOperatorAction;
  topBlockers: string[];
  topMissingEvidence: string[];
  currentMaterialGaps: string[];
  steps: SpineStepBuild[];
}): string[] {
  return uniqueSortedStrings([
    `recommended_next_operator_action:${recommendedNextOperatorAction}`,
    ...(topBlockers.length > 0
      ? ["severe_blockers_must_be_resolved_before_review"]
      : []),
    ...(topMissingEvidence.length > 0
      ? ["missing_evidence_keeps_spine_review_only"]
      : []),
    ...(currentMaterialGaps.length > 0
      ? ["current_material_gaps_prevent_fake_completion"]
      : []),
    ...(steps[0]?.recommended_next_action === "supply_selected_session_digest"
      ? ["selected_session_intake_is_first_restart_point_after_pr_965"]
      : []),
  ]);
}

function buildReviewChecklist(): string[] {
  return [
    "confirm_selected_session_intake_has_real_operator_supplied_digest_material",
    "confirm_selected_session_digest_candidate_ingest_records_remain_candidate_storage_not_memory",
    "confirm_codex_result_report_intake_uses_real_result_report_material_before_residue_review",
    "confirm_work_episode_residue_candidates_remain_preview_only",
    "confirm_expected_observed_delta_candidates_do_not_treat_skipped_checks_not_done_items_prs_or_changed_files_as_completion",
    "confirm_expected_observed_delta_record_write_readiness_is_scoped_to_local_delta_record_only",
    "confirm_reuse_outcome_candidate_bridge_is_candidate_material_not_reuse_ledger_write",
    "confirm_codex_result_feedback_uses_a_real_result_report_before_reuse_review",
    "confirm_reuse_and_metric_candidates_have source_refs and evidence_refs",
    "confirm_next_work_and_relay_candidates remain preview-only",
    "confirm_handoff_update_and_apply previews do not mutate live state",
    "confirm_apply_write_contract_missing current packet/context/operator material before any separate write slice",
  ];
}

function buildWouldNotDo(): string[] {
  return [
    "does_not_write_selected_digest_ingest_record_from_workbench_overview",
    "does_not_promote_selected_digest_ingest_records_to_memory_or_perspective",
    "does_not_write_work_episode_residue_from_workbench_overview",
    "does_not_write_reuse_outcome_ledger_or_dogfood_metrics",
    "does_not_write_memory",
    "does_not_mutate_current_working_perspective",
    "does_not_write_perspective_unit",
    "does_not_write_next_work_bias",
    "does_not_write_continuity_relay",
    "does_not_apply_live_handoff_context",
    "does_not_write_selected_refs_to_live_packet",
    "does_not_send_handoff",
    "does_not_call_expected_observed_delta_route_from_workbench_overview",
    "does_not_write_db_rows_or_create_schema_from_workbench_overview",
    "does_not_call_provider_openai_github_or_codex",
    "does_not_create_graph_vector_rag_crawler_or_browser_observer",
    "does_not_render_workbench_action_buttons",
  ];
}

function buildNonGoals(): string[] {
  return [
    "automatic_memory_or_perspective_promotion_from_selected_digest_ingest_records",
    "memory_write",
    "perspective_unit_durable_mutation",
    "next_work_bias_durable_mutation",
    "cwp_mutation",
    "continuity_relay_write",
    "live_handoff_context_apply_write",
    "selected_refs_live_packet_write",
    "handoff_send",
    "work_episode_durable_write",
    "expected_observed_delta_durable_write",
    "reuse_outcome_ledger_write",
    "dogfood_metric_write",
    "db_schema_route_provider_github_codex_call",
    "graph_vector_rag_crawler_browser_observer",
    "workbench_action_buttons",
  ];
}

function stripInternalStepFields(step: SpineStepBuild): WorkbenchDogfoodLoopSpineStep {
  return {
    step_id: step.step_id,
    label: step.label,
    status: step.status,
    source_preview_ref_or_version: step.source_preview_ref_or_version,
    material_count: step.material_count,
    blocker_count: step.blocker_count,
    missing_evidence_count: step.missing_evidence_count,
    recommended_next_action: step.recommended_next_action,
    evidence_present: step.evidence_present,
    read_only: step.read_only,
    summary: step.summary,
  };
}

function firstAvailableAsOf(steps: SpineStepBuild[]): string | null {
  for (const step of steps) {
    if (step.source_preview_ref_or_version) return null;
  }
  return null;
}

function limitReasons(reasons: string[]): string[] {
  return uniqueStringsInOrder(reasons).slice(0, 20);
}

function limitReasonsWithPriority(
  reasons: string[],
  priorityPatterns: RegExp[],
): string[] {
  const uniqueReasons = uniqueStringsInOrder(reasons);
  const priorityReasons = uniqueReasons.filter((reason) =>
    priorityPatterns.some((pattern) => pattern.test(reason)),
  );
  const remainingReasons = uniqueReasons.filter(
    (reason) => !priorityReasons.includes(reason),
  );
  return [...priorityReasons, ...remainingReasons].slice(0, 20);
}

function uniqueSortedStrings(values: string[]): string[] {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));
}

function uniqueStringsInOrder(values: string[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    ordered.push(trimmed);
  }
  return ordered;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
