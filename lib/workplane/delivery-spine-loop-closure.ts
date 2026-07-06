import {
  DELIVERY_SPINE_LOOP_CLOSURE_READ_MODEL_VERSION,
  DELIVERY_SPINE_LOOP_CLOSURE_SCOPE,
  type DeliverySpineAuthorityBoundary,
  type DeliverySpineLineageEdge,
  type DeliverySpineLineageMap,
  type DeliverySpineLoopClosureInput,
  type DeliverySpineLoopClosureReadModel,
  type DeliverySpineLoopClosureSummary,
  type DeliverySpineNonDeliveryBoundary,
  type DeliverySpineRecommendedHardeningTarget,
  type DeliverySpineRecommendedOperatorAction,
  type DeliverySpineStageGroup,
  type DeliverySpineStageGroupId,
  type DeliverySpineStageId,
  type DeliverySpineStageStatus,
  type DeliverySpineStageSummary,
  type DeliverySpineStageSummaryAggregate,
} from "@/types/delivery-spine-loop-closure";
import type { ExternalHandoffDeliveryResidualGateSummary } from "@/types/external-handoff-delivery-contract";

type RecordValue = Record<string, unknown>;

const DEFAULT_AS_OF = "1970-01-01T00:00:00.000Z" as const;
const stageLabels: Record<DeliverySpineStageId, string> = {
  local_handoff_send_fulfillment: "Local handoff send fulfillment",
  handoff_send_contract_review: "Handoff send contract review",
  exported_handoff_packet_artifact: "Exported handoff packet artifact",
  external_delivery_contract_preview: "External delivery contract preview",
  external_delivery_operator_decision_preview:
    "External delivery operator decision preview",
  external_delivery_contract_record_review:
    "External delivery contract record review",
  provider_specific_external_delivery_preview:
    "Provider-specific external delivery preview",
  provider_specific_external_delivery_operator_decision:
    "Provider-specific external delivery decision",
  provider_specific_delivery_intent_preview:
    "Provider-specific delivery intent preview",
  provider_specific_delivery_intent_operator_decision:
    "Provider-specific delivery intent decision",
  provider_specific_delivery_intent_record_review:
    "Provider-specific delivery intent record review",
  future_provider_execution_contract_preview:
    "Future provider execution contract preview",
};
const groupLabels: Record<DeliverySpineStageGroupId, string> = {
  local_handoff_fulfillment: "Local handoff fulfillment",
  external_handoff_delivery_contract: "External handoff delivery contract",
  provider_specific_preview: "Provider-specific preview",
  provider_specific_intent: "Provider-specific intent",
  future_execution_boundary: "Future execution boundary",
};
const blockerBoundaryFields = [
  "delivery_performed",
  "provider_specific_delivery",
  "provider_delivery_intent_is_delivery",
  "provider_called",
  "external_message_sent",
  "email_sent",
  "slack_sent",
  "webhook_called",
  "network_called",
  "clipboard_written",
  "file_downloaded",
  "local_fulfillment_is_external_delivery",
  "external_contract_is_delivery",
  "provider_specific_preview_is_delivery",
  "provider_specific_intent_is_delivery",
] as const;
const forbiddenAuthorityFields = [
  "can_write_db",
  "can_create_schema",
  "can_send_handoff",
  "can_call_send_provider",
  "can_call_email",
  "can_call_slack",
  "can_call_webhook",
  "can_call_network",
  "can_write_clipboard",
  "can_download_file",
  "can_write_memory",
  "can_mutate_cwp",
  "can_mutate_handoff",
  "can_mutate_residual",
  "can_mutate_external_contract",
  "can_mutate_provider_intent",
  "can_render_workbench_action_button",
] as const;
const hardResidualCategories = new Set([
  "authority_boundary_drift",
  "source_ref_lineage_mismatch",
  "local_fulfillment_upstream_gap",
  "no_side_effects_replay_inconsistency",
]);
const forbiddenResidualFragments = [
  "provider_called",
  "external_message_sent",
  "network_called",
  "email_sent",
  "slack_sent",
  "webhook_called",
  "can_write_db",
  "can_send_handoff",
  "can_call_send_provider",
  "can_write_memory",
  "can_render_workbench_action_button",
] as const;

export function createDeliverySpineNonDeliveryBoundaryV01():
  DeliverySpineNonDeliveryBoundary {
  return {
    delivery_performed: false,
    provider_specific_delivery: false,
    provider_delivery_intent_is_delivery: false,
    provider_called: false,
    external_message_sent: false,
    email_sent: false,
    slack_sent: false,
    webhook_called: false,
    network_called: false,
    clipboard_written: false,
    file_downloaded: false,
    local_fulfillment_is_external_delivery: false,
    external_contract_is_delivery: false,
    provider_specific_preview_is_delivery: false,
    provider_specific_intent_is_delivery: false,
    execution_contract_preview_exists: false,
  };
}

export function createDeliverySpineLoopClosureAuthorityBoundaryV01():
  DeliverySpineAuthorityBoundary {
  return {
    read_only: true,
    advisory_only: true,
    consolidation_only: true,
    can_write_db: false,
    can_create_schema: false,
    can_send_handoff: false,
    can_call_send_provider: false,
    can_call_email: false,
    can_call_slack: false,
    can_call_webhook: false,
    can_call_network: false,
    can_write_clipboard: false,
    can_download_file: false,
    can_write_memory: false,
    can_mutate_cwp: false,
    can_mutate_handoff: false,
    can_mutate_residual: false,
    can_mutate_external_contract: false,
    can_mutate_provider_intent: false,
    can_render_workbench_action_button: false,
  };
}

export function buildDeliverySpineLoopClosureReadModelV01(
  input: DeliverySpineLoopClosureInput = {},
): DeliverySpineLoopClosureReadModel {
  const localStage = localFulfillmentStage(input);
  const sendContractStage = reviewStage({
    stageId: "handoff_send_contract_review",
    statusRecord: input.handoff_send_contract_record_review,
    validStatus: "recorded",
    nextExpectedArtifact: "external_handoff_delivery_contract_record.v0.1",
  });
  const exportedArtifactStage = exportedArtifactStageFromInput(input);
  const externalPreviewStage = previewStage({
    stageId: "external_delivery_contract_preview",
    value: input.external_handoff_delivery_contract_preview,
    readyStatus: "ready_for_contract_decision",
    fingerprintField: "preview_fingerprint",
    nextExpectedArtifact: "external_handoff_delivery_contract_record.v0.1",
  });
  const externalDecisionStage = decisionStage({
    stageId: "external_delivery_operator_decision_preview",
    value: input.external_handoff_delivery_operator_decision_preview,
    readyStatus: "ready_for_external_delivery_contract_record_write",
    fingerprintField: "decision_preview_fingerprint",
    nextExpectedArtifact: "external_handoff_delivery_contract_record.v0.1",
  });
  const externalRecordStage = reviewStage({
    stageId: "external_delivery_contract_record_review",
    statusRecord: input.external_handoff_delivery_contract_record_review,
    validStatus: "recorded",
    nextExpectedArtifact:
      "provider_specific_external_delivery_preview_contract.v0.1",
  });
  const providerPreviewStage = previewStage({
    stageId: "provider_specific_external_delivery_preview",
    value: input.provider_specific_external_delivery_preview_contract,
    readyStatus: "ready_for_provider_specific_decision",
    fingerprintField: "preview_fingerprint",
    nextExpectedArtifact:
      "provider_specific_external_delivery_operator_decision_preview.v0.1",
  });
  const providerDecisionStage = decisionStage({
    stageId: "provider_specific_external_delivery_operator_decision",
    value: input.provider_specific_external_delivery_operator_decision_preview,
    readyStatus: "ready_for_provider_specific_preview_decision",
    fingerprintField: "decision_preview_fingerprint",
    nextExpectedArtifact: "provider_specific_delivery_intent_contract.v0.1",
  });
  const intentPreviewStage = previewStage({
    stageId: "provider_specific_delivery_intent_preview",
    value: input.provider_specific_delivery_intent_contract_preview,
    readyStatus: "ready_for_intent_decision",
    fingerprintField: "preview_fingerprint",
    nextExpectedArtifact:
      "provider_specific_delivery_intent_contract_record.v0.1",
  });
  const intentDecisionStage = decisionStage({
    stageId: "provider_specific_delivery_intent_operator_decision",
    value: input.provider_specific_delivery_intent_operator_decision_preview,
    readyStatus: "ready_for_provider_specific_delivery_intent_contract_record_write",
    fingerprintField: "decision_preview_fingerprint",
    nextExpectedArtifact:
      "provider_specific_delivery_intent_contract_record.v0.1",
  });
  const intentRecordStage = reviewStage({
    stageId: "provider_specific_delivery_intent_record_review",
    statusRecord: input.provider_specific_delivery_intent_contract_record_review,
    validStatus: "recorded",
    nextExpectedArtifact:
      "future_provider_specific_delivery_execution_contract_preview.v0.1",
  });
  const futureExecutionStage = makeStage({
    stage_id: "future_provider_execution_contract_preview",
    status: "not_started",
    primary_ref: null,
    blockers: [],
    warnings: ["future_provider_execution_contract_preview_not_started"],
    material_count: 0,
    next_expected_artifact:
      "provider_specific_delivery_execution_contract_preview.v0.1",
  });

  const stages = [
    localStage,
    sendContractStage,
    exportedArtifactStage,
    externalPreviewStage,
    externalDecisionStage,
    externalRecordStage,
    providerPreviewStage,
    providerDecisionStage,
    intentPreviewStage,
    intentDecisionStage,
    intentRecordStage,
    futureExecutionStage,
  ];
  const stageGroups = buildStageGroups(stages);
  const lineageMap = buildLineageMap(input, {
    localStage,
    externalRecordStage,
    providerPreviewStage,
    intentPreviewStage,
    intentRecordStage,
  });
  const residualGate = residualGateSummary(
    recordOrNull(input.residual_diagnostic_candidate_read_model),
  );
  const sourceProblems = sourceMaterialProblems(input);
  const blockerReasons = uniqueStrings([
    ...stages.flatMap((stage) => stage.blockers),
    ...lineageMap.edges.flatMap((edge) => (edge.blocker && edge.reason ? [edge.reason] : [])),
    ...sourceProblems,
    ...residualGate.hard_blocker_reasons,
  ]);
  const warningReasons = uniqueStrings([
    ...stages.flatMap((stage) => stage.warnings),
    ...lineageMap.missing_links.map((link) => `ordinary_missing_lineage:${link}`),
    ...residualGate.warning_reasons,
  ]);
  const stageSummary = summarizeStages(stages);
  const materialCount = stages.reduce((sum, stage) => sum + stage.material_count, 0);
  const status = determineDeliverySpineStatus({
    stageSummary,
    blockerReasons,
    materialCount,
    externalRecordStage,
    externalPreviewStage,
    providerPreviewStage,
    intentRecordStage,
    localStage,
    sourceProblems,
  });
  const loopClosureSummary = buildLoopClosureSummary({
    blockerReasons,
    warningReasons,
    materialCount,
    stages,
  });
  const sourceRefs = uniqueStrings([
    ...(input.source_refs ?? []),
    ...sourceRefsFromInputs(input),
  ]);
  const evidenceRefs = uniqueStrings([
    ...(input.evidence_refs ?? []),
    ...evidenceRefsFromInputs(input),
  ]);
  return {
    read_model_version: DELIVERY_SPINE_LOOP_CLOSURE_READ_MODEL_VERSION,
    scope: DELIVERY_SPINE_LOOP_CLOSURE_SCOPE,
    as_of: input.as_of ?? latestAsOf(input) ?? DEFAULT_AS_OF,
    delivery_spine_status: status,
    source_refs: sourceRefs,
    evidence_refs: evidenceRefs,
    stage_summary: stageSummary,
    stage_groups: stageGroups,
    lineage_map: lineageMap,
    blocker_summary: {
      count: blockerReasons.length,
      blockers: blockerReasons,
    },
    warning_summary: {
      count: warningReasons.length,
      warnings: warningReasons,
    },
    loop_closure_summary: loopClosureSummary,
    review_burden_summary: {
      panel_count_considered: loopClosureSummary.panel_count_considered,
      delivery_material_count: materialCount,
      consolidated_stage_count: stages.length,
      review_burden_risk_level:
        loopClosureSummary.review_burden_risk_level,
      evidence_for_outcome_improvement_present: false,
      outcome_claim_status: loopClosureSummary.outcome_claim_status,
    },
    residual_gate_summary: residualGate,
    recommended_next_operator_action: recommendedAction({
      blockerReasons,
      externalRecordStage,
      externalPreviewStage,
      providerPreviewStage,
      intentRecordStage,
      localStage,
      materialCount,
    }),
    recommended_next_hardening_target: recommendedHardeningTarget({
      blockerReasons,
      residualGate,
      loopClosureSummary,
      intentRecordStage,
    }),
    explicit_non_delivery_boundary: createDeliverySpineNonDeliveryBoundaryV01(),
    authority_boundary: createDeliverySpineLoopClosureAuthorityBoundaryV01(),
    would_not_do: [
      "does_not_execute_external_delivery",
      "does_not_call_provider_email_slack_webhook_github_codex_openai_browser_crawler_or_network",
      "does_not_write_clipboard_download_or_file",
      "does_not_create_routes_or_db_records",
      "does_not_mutate_cwp_handoff_relay_memory_metrics_residual_external_contract_or_provider_intent_state",
      "does_not_render_workbench_action_buttons",
    ],
    non_goals: [
      "external_delivery_execution",
      "provider_specific_delivery_execution_contract",
      "provider_sdk_integration",
      "provider_credential_storage",
      "durable_loop_closure_record",
      "memory_or_metrics_write",
      "graph_vector_rag_crawler_browser_observer",
    ],
  };
}

function localFulfillmentStage(
  input: DeliverySpineLoopClosureInput,
): DeliverySpineStageSummary {
  const sentRead = recordOrNull(input.sent_handoff_read);
  const sentSummary = recordField(sentRead, "latest_fulfillment_summary");
  const sendReviewSummary = selectedOrLatestSummary(input.handoff_send_record_review);
  const primaryRef =
    stringField(sentSummary, "record_id") ??
    stringField(sendReviewSummary, "record_id");
  const status = primaryRef
    ? "available"
    : sentRead?.status === "schema_missing"
      ? "insufficient_data"
      : "missing";
  return makeStage({
    stage_id: "local_handoff_send_fulfillment",
    status,
    primary_ref: primaryRef,
    blockers: [],
    warnings: status === "missing" ? ["local_handoff_send_fulfillment_missing"] : [],
    material_count: primaryRef ? 1 : 0,
    next_expected_artifact: "external_handoff_delivery_contract_record.v0.1",
    source_refs: stringArray(sentRead?.source_refs),
    evidence_refs: uniqueStrings([
      stringField(sentSummary, "payload_hash"),
      stringField(sendReviewSummary, "payload_hash"),
    ]),
  });
}

function exportedArtifactStageFromInput(
  input: DeliverySpineLoopClosureInput,
): DeliverySpineStageSummary {
  const read = recordOrNull(input.exported_handoff_packet_artifact_read);
  const latest = recordField(read, "latest_exported_artifact") ??
    recordField(read, "latest_artifact") ??
    recordField(read, "latest_exported_artifact_summary");
  const primaryRef =
    stringField(latest, "artifact_ref") ??
    stringField(latest, "artifact_id") ??
    stringField(latest, "record_id") ??
    stringField(read, "source_exported_artifact_ref");
  const available =
    primaryRef ||
    stringField(read, "status") ===
      "latest_exported_handoff_packet_artifact_available";
  return makeStage({
    stage_id: "exported_handoff_packet_artifact",
    status: available ? "available" : "missing",
    primary_ref: primaryRef,
    blockers: [],
    warnings: available ? [] : ["exported_handoff_packet_artifact_missing"],
    material_count: available ? 1 : 0,
    next_expected_artifact: "external_handoff_delivery_contract_record.v0.1",
    source_refs: stringArray(read?.source_refs),
    evidence_refs: uniqueStrings([
      stringField(latest, "payload_hash"),
      stringField(read, "payload_hash"),
    ]),
  });
}

function previewStage({
  stageId,
  value,
  readyStatus,
  fingerprintField,
  nextExpectedArtifact,
}: {
  stageId: DeliverySpineStageId;
  value: unknown;
  readyStatus: string;
  fingerprintField: string;
  nextExpectedArtifact: string;
}): DeliverySpineStageSummary {
  const record = recordOrNull(value);
  if (!record) {
    return makeStage({
      stage_id: stageId,
      status: "missing",
      primary_ref: null,
      blockers: [],
      warnings: [`${stageId}_missing`],
      material_count: 0,
      next_expected_artifact: nextExpectedArtifact,
    });
  }
  const blockers = stringArray(record.blocker_reasons);
  const statusValue = stringField(record, "status");
  const status: DeliverySpineStageStatus =
    blockers.length > 0
      ? "blocked"
      : statusValue === readyStatus
        ? "ready"
        : statusValue
          ? "insufficient_data"
          : "available";
  return makeStage({
    stage_id: stageId,
    status,
    primary_ref: stringField(record, fingerprintField),
    blockers,
    warnings: stringArray(record.warning_reasons),
    material_count: 1,
    next_expected_artifact: nextExpectedArtifact,
    source_refs: stringArray(record.source_refs),
    evidence_refs: stringArray(record.evidence_refs),
    boundary_flags: boundaryFlags(recordField(record, "external_delivery_boundary")),
  });
}

function decisionStage({
  stageId,
  value,
  readyStatus,
  fingerprintField,
  nextExpectedArtifact,
}: {
  stageId: DeliverySpineStageId;
  value: unknown;
  readyStatus: string;
  fingerprintField: string;
  nextExpectedArtifact: string;
}): DeliverySpineStageSummary {
  const record = recordOrNull(value);
  if (!record) {
    return makeStage({
      stage_id: stageId,
      status: "missing",
      primary_ref: null,
      blockers: [],
      warnings: [`${stageId}_missing`],
      material_count: 0,
      next_expected_artifact: nextExpectedArtifact,
    });
  }
  const blockers = stringArray(record.blocker_reasons);
  const statusValue = stringField(record, "decision_status");
  const nestedReadiness =
    recordField(record, "write_readiness") ??
    recordField(record, "next_step_readiness");
  const nestedBlockers = [
    ...stringArray(nestedReadiness?.current_blockers),
    ...stringArray(nestedReadiness?.current_missing_evidence),
  ];
  const allBlockers = uniqueStrings([...blockers, ...nestedBlockers]);
  const status: DeliverySpineStageStatus =
    allBlockers.length > 0
      ? "blocked"
      : statusValue === readyStatus
        ? "ready"
        : "insufficient_data";
  return makeStage({
    stage_id: stageId,
    status,
    primary_ref: stringField(record, fingerprintField),
    blockers: allBlockers,
    warnings: stringArray(record.warning_reasons),
    material_count: 1,
    next_expected_artifact: nextExpectedArtifact,
    source_refs: stringArray(record.source_refs),
  });
}

function reviewStage({
  stageId,
  statusRecord,
  validStatus,
  nextExpectedArtifact,
}: {
  stageId: DeliverySpineStageId;
  statusRecord: unknown;
  validStatus: DeliverySpineStageStatus;
  nextExpectedArtifact: string;
}): DeliverySpineStageSummary {
  const review = recordOrNull(statusRecord);
  if (!review) {
    return makeStage({
      stage_id: stageId,
      status: "missing",
      primary_ref: null,
      blockers: [],
      warnings: [`${stageId}_missing`],
      material_count: 0,
      next_expected_artifact: nextExpectedArtifact,
    });
  }
  const summary = selectedOrLatestSummary(review);
  const validCount = numberField(recordField(review, "input_summary"), "valid_record_count");
  const reviewStatus = stringField(review, "review_status");
  const blockers = uniqueStrings([
    ...stringArray(review.blocked_reasons),
    ...stringArray(summary?.problem_reasons),
    ...(reviewStatus === "records_invalid" ? [`${stageId}_records_invalid`] : []),
  ]);
  const materialCount =
    validCount > 0 || summary ? Math.max(validCount, summary ? 1 : 0) : 0;
  const status: DeliverySpineStageStatus =
    blockers.length > 0
      ? "invalid"
      : materialCount > 0 && (
          reviewStatus === "records_available" ||
          reviewStatus === "selected_record_found" ||
          validCount > 0
        )
        ? validStatus
        : reviewStatus === "schema_missing"
          ? "insufficient_data"
          : "missing";
  return makeStage({
    stage_id: stageId,
    status,
    primary_ref: stringField(summary, "record_id"),
    blockers,
    warnings: stringArray(review.insufficient_data_reasons),
    material_count: materialCount,
    next_expected_artifact: nextExpectedArtifact,
    source_refs: stringArray(review.source_refs),
    evidence_refs: uniqueStrings([
      stringField(summary, "payload_hash"),
      stringField(summary, "source_local_fulfillment_ref"),
      stringField(summary, "source_external_handoff_delivery_contract_record_ref"),
    ]),
    boundary_flags: boundaryFlags(summary),
  });
}

function buildStageGroups(
  stages: DeliverySpineStageSummary[],
): DeliverySpineStageGroup[] {
  const groups: Array<{
    group_id: DeliverySpineStageGroupId;
    stages: DeliverySpineStageId[];
  }> = [
    {
      group_id: "local_handoff_fulfillment",
      stages: [
        "local_handoff_send_fulfillment",
        "handoff_send_contract_review",
        "exported_handoff_packet_artifact",
      ],
    },
    {
      group_id: "external_handoff_delivery_contract",
      stages: [
        "external_delivery_contract_preview",
        "external_delivery_operator_decision_preview",
        "external_delivery_contract_record_review",
      ],
    },
    {
      group_id: "provider_specific_preview",
      stages: [
        "provider_specific_external_delivery_preview",
        "provider_specific_external_delivery_operator_decision",
      ],
    },
    {
      group_id: "provider_specific_intent",
      stages: [
        "provider_specific_delivery_intent_preview",
        "provider_specific_delivery_intent_operator_decision",
        "provider_specific_delivery_intent_record_review",
      ],
    },
    {
      group_id: "future_execution_boundary",
      stages: ["future_provider_execution_contract_preview"],
    },
  ];
  return groups.map((group) => {
    const groupStages = group.stages
      .map((stageId) => stages.find((stage) => stage.stage_id === stageId))
      .filter((stage): stage is DeliverySpineStageSummary => Boolean(stage));
    return {
      group_id: group.group_id,
      label: groupLabels[group.group_id],
      status: groupStatus(groupStages),
      material_count: groupStages.reduce(
        (sum, stage) => sum + stage.material_count,
        0,
      ),
      stages: groupStages,
    };
  });
}

function buildLineageMap(
  input: DeliverySpineLoopClosureInput,
  stages: {
    localStage: DeliverySpineStageSummary;
    externalRecordStage: DeliverySpineStageSummary;
    providerPreviewStage: DeliverySpineStageSummary;
    intentPreviewStage: DeliverySpineStageSummary;
    intentRecordStage: DeliverySpineStageSummary;
  },
): DeliverySpineLineageMap {
  const externalSummary = selectedOrLatestSummary(
    input.external_handoff_delivery_contract_record_review,
  );
  const providerPreview = recordOrNull(
    input.provider_specific_external_delivery_preview_contract,
  );
  const intentPreview = recordOrNull(
    input.provider_specific_delivery_intent_contract_preview,
  );
  const intentSummary = selectedOrLatestSummary(
    input.provider_specific_delivery_intent_contract_record_review,
  );
  const providerPreviewFingerprint = stringField(providerPreview, "preview_fingerprint");
  const intentRecordRef = stringField(intentSummary, "record_id");
  const edges = [
    lineageEdge({
      from: "local_handoff_send_fulfillment",
      to: "external_delivery_contract_record_review",
      expectedRef: stages.localStage.primary_ref,
      observedRef: stringField(externalSummary, "source_local_fulfillment_ref"),
      downstreamAvailable: stages.externalRecordStage.material_count > 0,
      reasonPrefix: "local_fulfillment_to_external_contract",
    }),
    lineageEdge({
      from: "external_delivery_contract_record_review",
      to: "provider_specific_external_delivery_preview",
      expectedRef: stages.externalRecordStage.primary_ref,
      observedRef: stringField(
        providerPreview,
        "source_external_handoff_delivery_contract_record_ref",
      ),
      downstreamAvailable: stages.providerPreviewStage.material_count > 0,
      reasonPrefix: "external_contract_to_provider_specific_preview",
    }),
    lineageEdge({
      from: "provider_specific_external_delivery_preview",
      to: "provider_specific_delivery_intent_preview",
      expectedRef: providerPreviewFingerprint,
      observedRef: stringField(
        intentPreview,
        "source_provider_specific_preview_fingerprint",
      ),
      downstreamAvailable: stages.intentPreviewStage.material_count > 0,
      reasonPrefix: "provider_specific_preview_to_intent_preview",
    }),
    lineageEdge({
      from: "provider_specific_delivery_intent_preview",
      to: "provider_specific_delivery_intent_record_review",
      expectedRef: stringField(intentPreview, "preview_fingerprint"),
      observedRef: stringField(
        intentSummary,
        "source_intent_contract_preview_fingerprint",
      ),
      downstreamAvailable: stages.intentRecordStage.material_count > 0,
      reasonPrefix: "intent_preview_to_intent_record",
    }),
    {
      from: "provider_specific_delivery_intent_record_review",
      to: "future_provider_execution_contract_preview",
      expected_ref: intentRecordRef,
      observed_ref: null,
      status: intentRecordRef ? "missing" : "missing",
      blocker: false,
      reason: intentRecordRef
        ? "future_provider_execution_contract_preview_not_started"
        : null,
    } satisfies DeliverySpineLineageEdge,
  ];
  return {
    map_version: "delivery_spine_lineage_map.v0.1",
    nodes: [
      {
        node_id: "local_handoff_send_fulfillment",
        stage_id: "local_handoff_send_fulfillment",
        label: stageLabels.local_handoff_send_fulfillment,
        ref: stages.localStage.primary_ref,
        status: stages.localStage.status,
      },
      {
        node_id: "external_handoff_delivery_contract_record",
        stage_id: "external_delivery_contract_record_review",
        label: stageLabels.external_delivery_contract_record_review,
        ref: stages.externalRecordStage.primary_ref,
        status: stages.externalRecordStage.status,
      },
      {
        node_id: "provider_specific_external_delivery_preview",
        stage_id: "provider_specific_external_delivery_preview",
        label: stageLabels.provider_specific_external_delivery_preview,
        ref: providerPreviewFingerprint,
        status: stages.providerPreviewStage.status,
      },
      {
        node_id: "provider_specific_delivery_intent_contract_record",
        stage_id: "provider_specific_delivery_intent_record_review",
        label: stageLabels.provider_specific_delivery_intent_record_review,
        ref: intentRecordRef,
        status: stages.intentRecordStage.status,
      },
      {
        node_id: "future_provider_execution_contract_preview_not_started",
        stage_id: "future_provider_execution_contract_preview",
        label: stageLabels.future_provider_execution_contract_preview,
        ref: null,
        status: "not_started",
      },
    ],
    edges,
    missing_links: edges
      .filter((edge) => edge.status === "missing")
      .map((edge) => `${edge.from}->${edge.to}`),
    mismatch_links: edges
      .filter((edge) => edge.status === "mismatch" || edge.status === "downstream_without_upstream")
      .map((edge) => `${edge.from}->${edge.to}`),
  };
}

function lineageEdge({
  from,
  to,
  expectedRef,
  observedRef,
  downstreamAvailable,
  reasonPrefix,
}: {
  from: DeliverySpineStageId;
  to: DeliverySpineStageId;
  expectedRef: string | null;
  observedRef: string | null;
  downstreamAvailable: boolean;
  reasonPrefix: string;
}): DeliverySpineLineageEdge {
  if (expectedRef && observedRef && expectedRef !== observedRef) {
    return {
      from,
      to,
      expected_ref: expectedRef,
      observed_ref: observedRef,
      status: "mismatch",
      blocker: true,
      reason: `${reasonPrefix}_ref_mismatch`,
    };
  }
  if (!expectedRef && observedRef) {
    return {
      from,
      to,
      expected_ref: expectedRef,
      observed_ref: observedRef,
      status: "downstream_without_upstream",
      blocker: true,
      reason: `${reasonPrefix}_downstream_without_upstream`,
    };
  }
  if (expectedRef && !observedRef && downstreamAvailable) {
    return {
      from,
      to,
      expected_ref: expectedRef,
      observed_ref: observedRef,
      status: "mismatch",
      blocker: true,
      reason: `${reasonPrefix}_downstream_source_ref_missing`,
    };
  }
  return {
    from,
    to,
    expected_ref: expectedRef,
    observed_ref: observedRef,
    status: expectedRef && observedRef ? "match" : "missing",
    blocker: false,
    reason: null,
  };
}

function residualGateSummary(
  residual: RecordValue | null,
): ExternalHandoffDeliveryResidualGateSummary {
  if (!residual) {
    return {
      gate_status: "insufficient_data",
      hard_blocking_candidate_ids: [],
      warning_candidate_ids: [],
      non_blocking_candidate_ids: [],
      hard_blocker_reasons: [],
      warning_reasons: ["residual_diagnostic_candidate_read_model_missing"],
    };
  }
  const candidates = arrayOfRecords(residual.residual_candidates);
  const hard = candidates.filter(isHardResidualCandidate);
  const warnings = candidates.filter(
    (candidate) =>
      !hard.includes(candidate) &&
      stringField(candidate, "category") ===
        "external_delivery_boundary_pressure",
  );
  return {
    gate_status:
      hard.length > 0
        ? "blocked"
        : warnings.length > 0
          ? "warning_only"
          : "passed",
    hard_blocking_candidate_ids: uniqueStrings(
      hard.map((candidate) => stringField(candidate, "candidate_id")),
    ),
    warning_candidate_ids: uniqueStrings(
      warnings.map((candidate) => stringField(candidate, "candidate_id")),
    ),
    non_blocking_candidate_ids: [],
    hard_blocker_reasons: uniqueStrings(
      hard.map(
        (candidate) =>
          `residual_candidate_blocked:${stringField(candidate, "category") ?? "unknown"}`,
      ),
    ),
    warning_reasons: uniqueStrings(
      warnings.map(
        (candidate) =>
          `residual_candidate_warning:${stringField(candidate, "category") ?? "unknown"}`,
      ),
    ),
  };
}

function isHardResidualCandidate(candidate: RecordValue): boolean {
  if (candidateHasForbiddenResidualSignal(candidate)) return true;
  const category = stringField(candidate, "category");
  const status = stringField(candidate, "status");
  const severity = stringField(candidate, "severity");
  const materialized =
    arrayOfRecords(candidate.observed_signals).some(
      (signal) => signal.materialized_inconsistency === true,
    ) || stringArray(candidate.materialized_inconsistencies).length > 0;
  if (category === "route_integration_mode_mismatch") {
    return status === "actionable_candidate";
  }
  if (category === "review_writer_validation_drift") {
    return status === "actionable_candidate" || materialized;
  }
  if (hardResidualCategories.has(category ?? "")) {
    return status === "actionable_candidate" || severity === "high" || materialized;
  }
  return false;
}

function candidateHasForbiddenResidualSignal(candidate: RecordValue): boolean {
  const signalText = [
    ...stringArray(candidate.materialized_inconsistencies),
    ...arrayOfRecords(candidate.observed_signals).flatMap((signal) => [
      stringField(signal, "summary"),
      stringField(signal, "signal"),
      stringField(signal, "reason"),
      stringField(signal, "label"),
    ]),
  ]
    .filter(isNonEmptyString)
    .join("\n")
    .toLowerCase();
  return forbiddenResidualFragments.some((fragment) =>
    signalText.includes(fragment),
  );
}

function sourceMaterialProblems(input: DeliverySpineLoopClosureInput): string[] {
  return uniqueStrings(
    Object.entries(input).flatMap(([label, value]) =>
      nestedSourceProblems(label, value),
    ),
  );
}

function nestedSourceProblems(label: string, value: unknown): string[] {
  const record = recordOrNull(value);
  if (!record) return [];
  const directBoundary = [
    recordField(record, "external_delivery_boundary"),
    recordField(record, "external_delivery"),
    recordField(record, "explicit_non_delivery_boundary"),
    recordField(record, "latest_record_summary"),
    recordField(record, "selected_record_summary"),
  ].flatMap((boundary) =>
    blockerBoundaryFields.flatMap((field) =>
      boundary?.[field] === true ? [`${label}:${field}_true`] : [],
    ),
  );
  const authority = recordField(record, "authority_boundary");
  const authorityProblems = forbiddenAuthorityFields.flatMap((field) =>
    authority?.[field] === true
      ? [`${label}:authority_boundary_forbidden_true:${field}`]
      : [],
  );
  return [...directBoundary, ...authorityProblems];
}

function determineDeliverySpineStatus({
  stageSummary,
  blockerReasons,
  materialCount,
  externalRecordStage,
  externalPreviewStage,
  providerPreviewStage,
  intentRecordStage,
  localStage,
  sourceProblems,
}: {
  stageSummary: DeliverySpineStageSummaryAggregate;
  blockerReasons: string[];
  materialCount: number;
  externalRecordStage: DeliverySpineStageSummary;
  externalPreviewStage: DeliverySpineStageSummary;
  providerPreviewStage: DeliverySpineStageSummary;
  intentRecordStage: DeliverySpineStageSummary;
  localStage: DeliverySpineStageSummary;
  sourceProblems: string[];
}): DeliverySpineLoopClosureReadModel["delivery_spine_status"] {
  if (sourceProblems.length > 0) return "invalid_source_material";
  if (blockerReasons.length > 0) return "blocked";
  if (materialCount === 0) return "no_delivery_spine_material";
  if (intentRecordStage.status === "recorded") return "provider_specific_intent_recorded";
  if (providerPreviewStage.status === "ready") return "provider_specific_preview_ready";
  if (externalRecordStage.status === "recorded" || externalPreviewStage.status === "ready") {
    return "external_contract_ready";
  }
  if (localStage.status === "available") return "local_fulfillment_available";
  if (stageSummary.ready_stage_count + stageSummary.recorded_stage_count === 0) {
    return "insufficient_data";
  }
  return "execution_preview_not_started";
}

function recommendedAction({
  blockerReasons,
  externalRecordStage,
  externalPreviewStage,
  providerPreviewStage,
  intentRecordStage,
  localStage,
  materialCount,
}: {
  blockerReasons: string[];
  externalRecordStage: DeliverySpineStageSummary;
  externalPreviewStage: DeliverySpineStageSummary;
  providerPreviewStage: DeliverySpineStageSummary;
  intentRecordStage: DeliverySpineStageSummary;
  localStage: DeliverySpineStageSummary;
  materialCount: number;
}): DeliverySpineRecommendedOperatorAction {
  if (blockerReasons.length > 0) {
    return "resolve_delivery_spine_blockers_before_execution_preview";
  }
  if (intentRecordStage.status === "recorded") {
    return "prepare_provider_specific_delivery_execution_contract_preview";
  }
  if (providerPreviewStage.status === "ready") {
    return "wait_for_provider_specific_intent_record";
  }
  if (externalRecordStage.status === "recorded" || externalPreviewStage.status === "ready") {
    return "wait_for_provider_specific_preview_ready";
  }
  if (localStage.status === "available") {
    return "wait_for_valid_external_delivery_contract_record";
  }
  if (materialCount === 0) {
    return "keep_execution_not_started_until_contract_preview_exists";
  }
  return "consolidate_delivery_spine_panels_before_execution";
}

function recommendedHardeningTarget({
  blockerReasons,
  residualGate,
  loopClosureSummary,
  intentRecordStage,
}: {
  blockerReasons: string[];
  residualGate: ExternalHandoffDeliveryResidualGateSummary;
  loopClosureSummary: DeliverySpineLoopClosureSummary;
  intentRecordStage: DeliverySpineStageSummary;
}): DeliverySpineRecommendedHardeningTarget {
  if (blockerReasons.some((reason) => /lineage|ref_mismatch/.test(reason))) {
    return "delivery_spine_lineage_mismatch";
  }
  if (residualGate.hard_blocker_reasons.length > 0) {
    return "residual_delivery_gate_coverage";
  }
  if (blockerReasons.some((reason) => /decision/.test(reason))) {
    return "provider_specific_decision_readiness";
  }
  if (intentRecordStage.status === "invalid") {
    return "provider_specific_intent_record_review";
  }
  if (intentRecordStage.status === "recorded") return "execution_boundary_preflight";
  if (loopClosureSummary.review_burden_risk_level !== "low") {
    return "workbench_delivery_spine_ia";
  }
  return "loop_closure_outcome_observation";
}

function buildLoopClosureSummary({
  blockerReasons,
  warningReasons,
  materialCount,
  stages,
}: {
  blockerReasons: string[];
  warningReasons: string[];
  materialCount: number;
  stages: DeliverySpineStageSummary[];
}): DeliverySpineLoopClosureSummary {
  const panelCount = 7 + stages.filter((stage) => stage.material_count > 0).length;
  const riskLevel =
    panelCount >= 14 ? "high" : panelCount >= 10 ? "medium" : "low";
  const executionBoundaryPreserved = true;
  const providerNetworkBoundaryPreserved = true;
  return {
    loop_closure_status:
      blockerReasons.length > 0
        ? "blockers_visible"
        : materialCount === 0
          ? "insufficient_data"
          : riskLevel === "high"
            ? "review_burden_risk"
            : "execution_boundary_preserved",
    review_burden_risk_level: riskLevel,
    panel_count_considered: panelCount,
    consolidated_stage_count: stages.length,
    repeated_blocker_count: repeatedCount(blockerReasons),
    hard_blocker_count: blockerReasons.length,
    warning_count: warningReasons.length,
    execution_boundary_preserved: executionBoundaryPreserved,
    provider_network_boundary_preserved: providerNetworkBoundaryPreserved,
    outcome_claim_status:
      materialCount === 0 ? "insufficient_data" : "no_outcome_claim",
    loop_closure_notes: [
      "delivery_spine_status_is_consolidated_from_already_read_material",
      "future_execution_boundary_remains_not_started",
      "review_burden_reduction_is_not_claimed_without_outcome_evidence",
    ],
  };
}

function summarizeStages(
  stages: DeliverySpineStageSummary[],
): DeliverySpineStageSummaryAggregate {
  return {
    total_stage_count: stages.length,
    ready_stage_count: stages.filter((stage) => stage.status === "ready").length,
    recorded_stage_count: stages.filter((stage) => stage.status === "recorded")
      .length,
    blocked_stage_count: stages.filter((stage) => stage.status === "blocked")
      .length,
    invalid_stage_count: stages.filter((stage) => stage.status === "invalid")
      .length,
    missing_stage_count: stages.filter((stage) => stage.status === "missing")
      .length,
    warning_stage_count: stages.filter((stage) => stage.status === "warning_only")
      .length,
    future_execution_stage_status:
      stages.find(
        (stage) => stage.stage_id === "future_provider_execution_contract_preview",
      )?.status ?? "not_started",
  };
}

function groupStatus(stages: DeliverySpineStageSummary[]): DeliverySpineStageStatus {
  if (stages.some((stage) => stage.status === "invalid")) return "invalid";
  if (stages.some((stage) => stage.status === "blocked")) return "blocked";
  if (stages.some((stage) => stage.status === "recorded")) return "recorded";
  if (stages.some((stage) => stage.status === "ready")) return "ready";
  if (stages.some((stage) => stage.status === "available")) return "available";
  if (stages.every((stage) => stage.status === "not_started")) return "not_started";
  if (stages.some((stage) => stage.status === "insufficient_data")) {
    return "insufficient_data";
  }
  return "missing";
}

function makeStage({
  stage_id,
  status,
  primary_ref,
  blockers,
  warnings,
  material_count,
  next_expected_artifact,
  source_refs = [],
  evidence_refs = [],
  boundary_flags = {},
}: {
  stage_id: DeliverySpineStageId;
  status: DeliverySpineStageStatus;
  primary_ref: string | null;
  blockers: string[];
  warnings: string[];
  material_count: number;
  next_expected_artifact: string | null;
  source_refs?: string[];
  evidence_refs?: string[];
  boundary_flags?: Record<string, boolean>;
}): DeliverySpineStageSummary {
  return {
    stage_id,
    label: stageLabels[stage_id],
    status,
    primary_ref,
    source_refs,
    evidence_refs,
    blockers,
    warnings,
    boundary_flags,
    material_count,
    next_expected_artifact,
  };
}

function selectedOrLatestSummary(value: unknown): RecordValue | null {
  const record = recordOrNull(value);
  if (!record) return null;
  return (
    recordField(record, "selected_record_summary") ??
    recordField(record, "latest_record_summary")
  );
}

function boundaryFlags(value: unknown): Record<string, boolean> {
  const record = recordOrNull(value);
  if (!record) return {};
  return Object.fromEntries(
    blockerBoundaryFields.map((field) => [field, record[field] === true]),
  );
}

function sourceRefsFromInputs(input: DeliverySpineLoopClosureInput): string[] {
  return Object.values(input).flatMap((value) =>
    stringArray(recordOrNull(value)?.source_refs),
  );
}

function evidenceRefsFromInputs(input: DeliverySpineLoopClosureInput): string[] {
  return Object.values(input).flatMap((value) =>
    stringArray(recordOrNull(value)?.evidence_refs),
  );
}

function latestAsOf(input: DeliverySpineLoopClosureInput): string | null {
  return (
    Object.values(input)
      .map((value) => stringField(value, "as_of"))
      .filter(isNonEmptyString)
      .sort()
      .at(-1) ?? null
  );
}

function repeatedCount(values: string[]): number {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.values()].filter((count) => count > 1).length;
}

function numberField(value: unknown, key: string): number {
  const record = recordOrNull(value);
  return record && typeof record[key] === "number" ? record[key] : 0;
}

function recordField(value: unknown, key: string): RecordValue | null {
  return isRecord(value) && isRecord(value[key]) ? value[key] : null;
}

function stringField(value: unknown, key: string): string | null {
  return isRecord(value) && isNonEmptyString(value[key]) ? value[key] : null;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => isNonEmptyString(item))
    : [];
}

function arrayOfRecords(value: unknown): RecordValue[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function recordOrNull(value: unknown): RecordValue | null {
  return isRecord(value) ? value : null;
}

function isRecord(value: unknown): value is RecordValue {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter(isNonEmptyString))];
}
