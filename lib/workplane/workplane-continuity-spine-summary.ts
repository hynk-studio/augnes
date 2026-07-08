import { createHash } from "node:crypto";

import {
  WORKPLANE_CONTINUITY_SPINE_SUMMARY_SCOPE,
  WORKPLANE_CONTINUITY_SPINE_SUMMARY_VERSION,
  type WorkplaneContinuityBlockedAction,
  type WorkplaneContinuityNextAllowedAction,
  type WorkplaneContinuityRollbackSupersedeStatus,
  type WorkplaneContinuitySourceFreshnessStatus,
  type WorkplaneContinuitySpineAuthorityBoundary,
  type WorkplaneContinuitySpineStage,
  type WorkplaneContinuitySpineStatus,
  type WorkplaneContinuitySpineSummary,
  type WorkplaneContinuitySpineSummaryInput,
} from "@/types/workplane-continuity-spine-summary";

type RecordValue = Record<string, unknown>;

type StageCandidate = {
  stage: WorkplaneContinuitySpineStage;
  sourceName: string;
  material: RecordValue | null;
  available: boolean;
  active: boolean;
  ref: string | null;
  fingerprint: string | null;
  sourceRefs: string[];
  selectedRefs: string[];
  missingRefs: string[];
  staleRefs: string[];
  blockers: string[];
  warnings: string[];
};

const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z" as const;

const RAW_OR_SECRET_SHAPED_STRING_PATTERN =
  /https?:\/\/|www\.|bearer\s+|token|secret|password|credential|api[_-]?key|private[_-]?key|process\.env|\.env|env:|raw[_-]?(payload|recipient|body|note|result|report)|recipient[_-]?body|manual[_-]?note|result[_-]?report|email[_-]?body|slack[_-]?body|webhook[_-]?url/i;

const NEXT_ALLOWED_ACTIONS: WorkplaneContinuityNextAllowedAction[] = [
  "review_continuity_spine_summary",
  "inspect_latest_active_stage",
  "open_related_workbench_detail_panel",
  "read_source_coverage_before_handoff",
  "prepare_manual_handoff_context",
];

const BLOCKED_ACTIONS: WorkplaneContinuityBlockedAction[] = [
  "block_provider_send",
  "block_provider_network_call",
  "block_delivery_execution",
  "block_db_write",
  "block_proof_or_evidence_write",
  "block_perspective_cwp_handoff_work_mutation",
  "block_codex_or_github_automation",
  "block_clipboard_download_file_write",
  "block_route_schema_migration",
  "block_retrieval_rag_crawler_provider_call",
  "block_workbench_action_button",
];

const DANGEROUS_FALSE_FIELDS = [
  "source_of_truth",
  "can_write_db",
  "can_create_schema",
  "can_create_migration",
  "can_create_route",
  "can_call_route",
  "can_send_handoff",
  "can_execute_delivery",
  "can_call_provider",
  "can_call_send_provider",
  "can_call_network",
  "can_call_email",
  "can_call_slack",
  "can_call_webhook",
  "can_call_provider_openai",
  "can_call_github",
  "can_execute_codex",
  "can_call_browser",
  "can_call_crawler",
  "can_write_clipboard",
  "can_download_file",
  "can_write_file",
  "can_write_memory",
  "can_mutate_memory",
  "can_promote_memory",
  "can_write_proof",
  "can_write_evidence",
  "can_mutate_perspective_memory",
  "can_mutate_current_working_perspective",
  "can_mutate_cwp",
  "can_mutate_handoff",
  "can_mutate_work_state",
  "can_write_selected_refs_to_live_handoff",
  "can_write_dogfood_metrics",
  "can_create_graph_or_vector_store",
  "can_create_rag_stack",
  "can_render_workbench_action_button",
  "can_create_pr",
  "can_merge_pr",
] as const;

const EXPECTED_SOURCE_LABELS = [
  "current_working_perspective_read",
  "workplane_continuity_relay",
  "workbench_spine_consolidation",
  "workbench_dogfood_loop_spine_overview",
  "residual_diagnostic_candidate_read_model",
  "applied_current_working_perspective_read",
  "current_working_perspective_route_integration_read",
  "applied_handoff_context_read",
  "exported_handoff_packet_artifact_read",
  "handoff_send_contract_record_review",
  "handoff_send_record_review",
  "external_handoff_delivery_contract_record_review",
  "provider_specific_delivery_intent_contract_record_review",
  "delivery_spine_loop_closure_read_model",
  "provider_specific_delivery_execution_contract_record_review",
] as const;

export function createWorkplaneContinuitySpineAuthorityBoundaryV01():
  WorkplaneContinuitySpineAuthorityBoundary {
  const falseFlags = DANGEROUS_FALSE_FIELDS.reduce<Record<string, false>>(
    (acc, field) => {
      acc[field] = false;
      return acc;
    },
    {},
  );

  return {
    read_only: true,
    advisory_only: true,
    derived_read_model: true,
    compact_summary_only: true,
    ...falseFlags,
    notes: [
      "Continuity Spine Summary is a compact read model over already-supplied Workbench material.",
      "It cannot execute delivery, call providers, call network/GitHub/Codex/browser/crawler, write DB/proof/evidence/files/clipboard/memory, create route/schema/migration/RAG state, mutate Perspective/CWP/handoff/work state, or render action buttons.",
    ],
  } as WorkplaneContinuitySpineAuthorityBoundary;
}

export function buildWorkplaneContinuitySpineSummaryV01(
  input: WorkplaneContinuitySpineSummaryInput = {},
): WorkplaneContinuitySpineSummary {
  const warnings: string[] = [];
  const context = recordOrNull(input.workplane_context);
  const currentWorkingPerspectiveRead =
    recordOrNull(input.current_working_perspective_read) ??
    recordOrNull(context?.current_perspective_read);
  const relay =
    recordOrNull(input.workplane_continuity_relay) ??
    recordOrNull(context?.continuity_relay);
  const workbenchSpine = recordOrNull(input.workbench_spine_consolidation);
  const dogfoodSpine = recordOrNull(
    input.workbench_dogfood_loop_spine_overview,
  );
  const residualReadModel = recordOrNull(
    input.residual_diagnostic_candidate_read_model,
  );
  const appliedCwpRead = recordOrNull(
    input.applied_current_working_perspective_read,
  );
  const routeIntegrationRead = recordOrNull(
    input.current_working_perspective_route_integration_read,
  );
  const appliedHandoffRead = recordOrNull(input.applied_handoff_context_read);
  const exportedArtifactRead = recordOrNull(
    input.exported_handoff_packet_artifact_read,
  );
  const handoffSendContractRecordReview = recordOrNull(
    input.handoff_send_contract_record_review,
  );
  const handoffSendRecordReview = recordOrNull(
    input.handoff_send_record_review,
  );
  const externalContractReview = recordOrNull(
    input.external_handoff_delivery_contract_record_review,
  );
  const providerIntentReview = recordOrNull(
    input.provider_specific_delivery_intent_contract_record_review,
  );
  const deliverySpineLoopClosure = recordOrNull(
    input.delivery_spine_loop_closure_read_model,
  );
  const providerExecutionRecordReview = recordOrNull(
    input.provider_specific_delivery_execution_contract_record_review,
  );

  const sourceByLabel: Record<(typeof EXPECTED_SOURCE_LABELS)[number], RecordValue | null> = {
    current_working_perspective_read: currentWorkingPerspectiveRead,
    workplane_continuity_relay: relay,
    workbench_spine_consolidation: workbenchSpine,
    workbench_dogfood_loop_spine_overview: dogfoodSpine,
    residual_diagnostic_candidate_read_model: residualReadModel,
    applied_current_working_perspective_read: appliedCwpRead,
    current_working_perspective_route_integration_read: routeIntegrationRead,
    applied_handoff_context_read: appliedHandoffRead,
    exported_handoff_packet_artifact_read: exportedArtifactRead,
    handoff_send_contract_record_review: handoffSendContractRecordReview,
    handoff_send_record_review: handoffSendRecordReview,
    external_handoff_delivery_contract_record_review: externalContractReview,
    provider_specific_delivery_intent_contract_record_review:
      providerIntentReview,
    delivery_spine_loop_closure_read_model: deliverySpineLoopClosure,
    provider_specific_delivery_execution_contract_record_review:
      providerExecutionRecordReview,
  };

  const missingObjectRefs = EXPECTED_SOURCE_LABELS.filter(
    (label) => !sourceByLabel[label],
  ).map((label) => `missing:${label}`);
  const residualSummaries = residualCandidateSummaries(residualReadModel);
  const candidates = [
    providerExecutionCandidate(providerExecutionRecordReview, warnings),
    deliverySpineCandidate(deliverySpineLoopClosure, warnings),
    providerIntentCandidate(providerIntentReview, warnings),
    externalContractCandidate(externalContractReview, warnings),
    localFulfillmentCandidate(handoffSendRecordReview, warnings),
    handoffPacketExportCandidate(exportedArtifactRead, warnings),
    handoffContextCandidate(appliedHandoffRead, warnings),
    routeIntegrationCandidate(routeIntegrationRead, warnings),
    currentWorkingPerspectiveCandidate(currentWorkingPerspectiveRead, warnings),
    residualDiagnosticCandidate(residualReadModel, residualSummaries, warnings),
    dogfoodLoopCandidate(dogfoodSpine, warnings),
  ];
  const latestActive =
    candidates.find((candidate) => candidate.available && candidate.active) ??
    candidates.find((candidate) => candidate.available) ??
    null;
  const activeCandidates = candidates.filter((candidate) => candidate.available);

  const asOf = firstSafeString(
    [
      input.as_of,
      stringField(providerExecutionRecordReview, "as_of"),
      stringField(deliverySpineLoopClosure, "as_of"),
      stringField(workbenchSpine, "as_of"),
      stringField(dogfoodSpine, "as_of"),
      stringField(residualReadModel, "as_of"),
      stringField(context, "overview", "current_perspective", "as_of"),
      stringField(currentWorkingPerspectiveRead, "data", "as_of"),
    ],
    "as_of",
    warnings,
  ) ?? FALLBACK_AS_OF;
  const primarySourceRefs = uniqueStrings([
    ...safeStringArray(input.source_refs, "input.source_refs", warnings),
    ...activeCandidates.flatMap((candidate) => candidate.sourceRefs),
  ]).slice(0, 16);
  const selectedRecordRefs = uniqueStrings(
    activeCandidates.flatMap((candidate) => candidate.selectedRefs),
  ).slice(0, 14);
  const missingSourceRefs = uniqueStrings([
    ...missingObjectRefs,
    ...activeCandidates.flatMap((candidate) => candidate.missingRefs),
  ]).slice(0, 20);
  const staleSourceRefs = uniqueStrings(
    activeCandidates.flatMap((candidate) => candidate.staleRefs),
  ).slice(0, 16);
  const blockerReasons = uniqueStrings([
    ...activeCandidates.flatMap((candidate) => candidate.blockers),
    ...residualSummaries.blockers,
  ]).slice(0, 18);
  const warningReasons = uniqueStrings([
    ...warnings,
    ...activeCandidates.flatMap((candidate) => candidate.warnings),
    ...residualSummaries.warnings,
  ]).slice(0, 18);
  const sourceFreshnessStatus = sourceFreshnessStatusFromInput({
    context,
    currentWorkingPerspectiveRead,
    relay,
    routeIntegrationRead,
    appliedCwpRead,
    workbenchSpine,
    missingSourceRefs,
    staleSourceRefs,
  });
  const rollbackSupersedeStatus = rollbackSupersedeStatusFromInput(
    Object.values(sourceByLabel),
    activeCandidates.length > 0,
  );
  const spineStatus = deriveSpineStatus({
    latestActive,
    blockerReasons,
    missingSourceRefs,
    sourceFreshnessStatus,
  });
  const codexHandoffHints = buildCodexHandoffHints({
    latestActive,
    spineStatus,
    sourceFreshnessStatus,
    rollbackSupersedeStatus,
    blockerReasons,
    missingSourceRefs,
  });
  const sourceCoverageSummary = {
    primary_source_count: primarySourceRefs.length,
    selected_record_count: selectedRecordRefs.length,
    missing_source_count: missingSourceRefs.length,
    stale_source_count: staleSourceRefs.length,
    fallback_source_count: fallbackSourceCount({
      context,
      routeIntegrationRead,
      appliedCwpRead,
    }),
    blocker_count: blockerReasons.length,
    warning_count: warningReasons.length,
  };
  const authorityBoundary = createWorkplaneContinuitySpineAuthorityBoundaryV01();
  const summaryWithoutFingerprint = {
    summary_version: WORKPLANE_CONTINUITY_SPINE_SUMMARY_VERSION,
    scope: WORKPLANE_CONTINUITY_SPINE_SUMMARY_SCOPE,
    as_of: asOf,
    spine_status: spineStatus,
    latest_active_stage: latestActive?.stage ?? null,
    latest_active_receipt_or_record_ref: latestActive?.ref ?? null,
    latest_active_fingerprint: latestActive?.fingerprint ?? null,
    source_freshness_status: sourceFreshnessStatus,
    rollback_supersede_status: rollbackSupersedeStatus,
    primary_source_refs: primarySourceRefs,
    selected_record_refs: selectedRecordRefs,
    missing_source_refs: missingSourceRefs,
    stale_source_refs: staleSourceRefs,
    blocker_reasons: blockerReasons,
    warning_reasons: warningReasons,
    next_allowed_actions: NEXT_ALLOWED_ACTIONS,
    blocked_actions: BLOCKED_ACTIONS,
    codex_handoff_hints: codexHandoffHints,
    source_coverage_summary: sourceCoverageSummary,
    authority_boundary: authorityBoundary,
    would_not_do: wouldNotDoList(),
  } satisfies Omit<WorkplaneContinuitySpineSummary, "summary_fingerprint">;

  return {
    ...summaryWithoutFingerprint,
    summary_fingerprint: stableFingerprint(summaryWithoutFingerprint),
  };
}

function providerExecutionCandidate(
  review: RecordValue | null,
  warnings: string[],
): StageCandidate {
  const providerIntentRecordRef = safeString(
    stringField(review, "source_provider_specific_intent_contract_record_ref"),
    "provider_execution_record_review.source_provider_specific_intent_contract_record_ref",
    warnings,
  );
  const selectedRefs = safeStringArray(
    [
      providerIntentRecordRef,
      stringField(review, "source_external_handoff_delivery_contract_record_ref"),
      stringField(review, "source_exported_handoff_artifact_ref"),
      stringField(review, "source_local_fulfillment_ref"),
      stringField(review, "source_handoff_send_contract_record_ref"),
    ],
    "provider_execution_record_review.selected_refs",
    warnings,
  );
  const fingerprint =
    safeString(
      stringField(review, "review_fingerprint"),
      "provider_execution_record_review.review_fingerprint",
      warnings,
    ) ??
    safeString(
      stringField(
        recordOrNull(
          review?.would_record_provider_specific_delivery_execution_contract_record,
        ),
        "record_fingerprint",
      ),
      "provider_execution_record_review.record_fingerprint",
      warnings,
    );
  const missingRefs = safeStringArray(
    getPath(review, ["requirement_summary", "missing_refs"]),
    "provider_execution_record_review.missing_refs",
    warnings,
  );
  const blockers = safeStringArray(
    [
      ...arrayFromUnknown(review?.blocker_reasons),
      ...arrayFromUnknown(review?.insufficient_data_reasons),
    ],
    "provider_execution_record_review.blockers",
    warnings,
  );
  const reviewStatus = stringField(review, "review_status");

  return stageCandidate({
    stage: "provider_specific_execution_contract_record_review",
    sourceName: "provider_specific_delivery_execution_contract_record_review",
    material: review,
    active: reviewStatus === "recordable",
    ref: providerIntentRecordRef,
    fingerprint,
    sourceRefs: safeStringArray(
      review?.source_refs,
      "provider_execution_record_review.source_refs",
      warnings,
    ),
    selectedRefs,
    missingRefs,
    blockers,
    warnings: safeStringArray(
      review?.warning_reasons,
      "provider_execution_record_review.warnings",
      warnings,
    ),
  });
}

function deliverySpineCandidate(
  readModel: RecordValue | null,
  warnings: string[],
): StageCandidate {
  const nodes = arrayFromUnknown(getPath(readModel, ["lineage_map", "nodes"]));
  const refs = safeStringArray(
    nodes.map((node) => recordOrNull(node)?.ref),
    "delivery_spine_loop_closure.lineage_refs",
    warnings,
  );
  const status = stringField(readModel, "delivery_spine_status");
  return stageCandidate({
    stage: "delivery_spine_loop_closure",
    sourceName: "delivery_spine_loop_closure_read_model",
    material: readModel,
    active: status === "provider_specific_intent_recorded",
    ref: refs[0] ?? null,
    fingerprint: derivedStageFingerprint("delivery_spine_loop_closure", readModel),
    sourceRefs: safeStringArray(
      readModel?.source_refs,
      "delivery_spine_loop_closure.source_refs",
      warnings,
    ),
    selectedRefs: refs,
    missingRefs: safeStringArray(
      getPath(readModel, ["lineage_map", "missing_links"]),
      "delivery_spine_loop_closure.missing_links",
      warnings,
    ),
    blockers: safeStringArray(
      getPath(readModel, ["blocker_summary", "blockers"]),
      "delivery_spine_loop_closure.blockers",
      warnings,
    ),
    warnings: safeStringArray(
      getPath(readModel, ["warning_summary", "warnings"]),
      "delivery_spine_loop_closure.warnings",
      warnings,
    ),
  });
}

function providerIntentCandidate(
  review: RecordValue | null,
  warnings: string[],
): StageCandidate {
  const selectedSummary =
    recordOrNull(review?.selected_record_summary) ??
    recordOrNull(review?.latest_record_summary);
  const ref = safeString(
    stringField(selectedSummary, "record_id"),
    "provider_intent_record_review.record_id",
    warnings,
  );
  const selectedRefs = safeStringArray(
    [
      ref,
      stringField(selectedSummary, "source_external_handoff_delivery_contract_record_ref"),
      stringField(selectedSummary, "source_local_fulfillment_ref"),
      stringField(selectedSummary, "source_handoff_send_contract_record_ref"),
      stringField(selectedSummary, "source_exported_artifact_ref"),
    ],
    "provider_intent_record_review.selected_refs",
    warnings,
  );
  const active =
    stringField(review, "review_status") === "selected_record_found" ||
    stringField(review, "review_status") === "records_available";

  return stageCandidate({
    stage: "provider_specific_intent",
    sourceName: "provider_specific_delivery_intent_contract_record_review",
    material: review,
    active,
    ref,
    fingerprint:
      safeString(
        stringField(selectedSummary, "source_provider_specific_preview_fingerprint"),
        "provider_intent_record_review.preview_fingerprint",
        warnings,
      ) ?? derivedStageFingerprint("provider_specific_intent", review),
    sourceRefs: safeStringArray(
      review?.source_refs,
      "provider_intent_record_review.source_refs",
      warnings,
    ),
    selectedRefs,
    missingRefs: safeStringArray(
      review?.insufficient_data_reasons,
      "provider_intent_record_review.insufficient_data",
      warnings,
    ),
    blockers: safeStringArray(
      review?.blocked_reasons,
      "provider_intent_record_review.blockers",
      warnings,
    ),
    warnings: [],
  });
}

function externalContractCandidate(
  review: RecordValue | null,
  warnings: string[],
): StageCandidate {
  const selectedSummary =
    recordOrNull(review?.selected_record_summary) ??
    recordOrNull(review?.latest_record_summary);
  const ref = safeString(
    stringField(selectedSummary, "record_id"),
    "external_delivery_contract_record_review.record_id",
    warnings,
  );
  const selectedRefs = safeStringArray(
    [
      ref,
      stringField(selectedSummary, "source_local_fulfillment_ref"),
      stringField(selectedSummary, "source_handoff_send_contract_record_ref"),
      stringField(selectedSummary, "source_exported_artifact_ref"),
    ],
    "external_delivery_contract_record_review.selected_refs",
    warnings,
  );
  const active =
    stringField(review, "review_status") === "selected_record_found" ||
    stringField(review, "review_status") === "records_available";

  return stageCandidate({
    stage: "external_delivery_contract",
    sourceName: "external_handoff_delivery_contract_record_review",
    material: review,
    active,
    ref,
    fingerprint: derivedStageFingerprint("external_delivery_contract", review),
    sourceRefs: safeStringArray(
      review?.source_refs,
      "external_delivery_contract_record_review.source_refs",
      warnings,
    ),
    selectedRefs,
    missingRefs: safeStringArray(
      review?.insufficient_data_reasons,
      "external_delivery_contract_record_review.insufficient_data",
      warnings,
    ),
    blockers: safeStringArray(
      review?.blocked_reasons,
      "external_delivery_contract_record_review.blockers",
      warnings,
    ),
    warnings: [],
  });
}

function localFulfillmentCandidate(
  review: RecordValue | null,
  warnings: string[],
): StageCandidate {
  const selectedSummary =
    recordOrNull(review?.selected_record_summary) ??
    recordOrNull(review?.latest_record_summary);
  const ref = safeString(
    stringField(selectedSummary, "record_id"),
    "handoff_send_record_review.record_id",
    warnings,
  );
  const selectedRefs = safeStringArray(
    [
      ref,
      stringField(selectedSummary, "source_handoff_send_contract_record_ref"),
      stringField(selectedSummary, "source_exported_artifact_ref"),
    ],
    "handoff_send_record_review.selected_refs",
    warnings,
  );

  return stageCandidate({
    stage: "local_handoff_fulfillment",
    sourceName: "handoff_send_record_review",
    material: review,
    active: Boolean(ref),
    ref,
    fingerprint: derivedStageFingerprint("local_handoff_fulfillment", review),
    sourceRefs: safeStringArray(
      review?.source_refs,
      "handoff_send_record_review.source_refs",
      warnings,
    ),
    selectedRefs,
    missingRefs: safeStringArray(
      review?.insufficient_data_reasons,
      "handoff_send_record_review.insufficient_data",
      warnings,
    ),
    blockers: safeStringArray(
      review?.blocked_reasons,
      "handoff_send_record_review.blockers",
      warnings,
    ),
    warnings: safeStringArray(
      getPath(review, ["operator_review_checklist"]),
      "handoff_send_record_review.checklist",
      warnings,
    ).slice(0, 2),
  });
}

function handoffPacketExportCandidate(
  read: RecordValue | null,
  warnings: string[],
): StageCandidate {
  const summary = recordOrNull(read?.summary);
  const ref = safeString(
    stringField(summary, "exported_artifact_ref"),
    "exported_handoff_packet_artifact_read.exported_artifact_ref",
    warnings,
  );
  const status = stringField(read, "status");

  return stageCandidate({
    stage: "handoff_packet_export",
    sourceName: "exported_handoff_packet_artifact_read",
    material: read,
    active: Boolean(ref),
    ref,
    fingerprint: derivedStageFingerprint("handoff_packet_export", summary),
    sourceRefs: safeStringArray(
      [ref, stringField(summary, "source_copy_export_contract_record_ref")],
      "exported_handoff_packet_artifact_read.source_refs",
      warnings,
    ),
    selectedRefs: safeStringArray([ref], "exported_handoff_packet_artifact_read.selected_refs", warnings),
    missingRefs:
      status && !status.includes("available")
        ? [`missing:exported_handoff_packet_artifact:${status}`]
        : [],
    blockers: [],
    warnings: [],
  });
}

function handoffContextCandidate(
  read: RecordValue | null,
  warnings: string[],
): StageCandidate {
  const summary = recordOrNull(read?.summary);
  const ref = safeString(
    stringField(summary, "applied_handoff_context_snapshot_ref"),
    "applied_handoff_context_read.applied_handoff_context_snapshot_ref",
    warnings,
  );
  const status = stringField(read, "status");

  return stageCandidate({
    stage: "handoff_context_apply",
    sourceName: "applied_handoff_context_read",
    material: read,
    active: Boolean(ref),
    ref,
    fingerprint: derivedStageFingerprint("handoff_context_apply", summary),
    sourceRefs: safeStringArray(
      [
        ref,
        stringField(summary, "source_contract_record_ref"),
        stringField(summary, "source_route_integration_read_ref"),
      ],
      "applied_handoff_context_read.source_refs",
      warnings,
    ),
    selectedRefs: safeStringArray([ref], "applied_handoff_context_read.selected_refs", warnings),
    missingRefs:
      status && !status.includes("available")
        ? [`missing:applied_handoff_context:${status}`]
        : [],
    blockers: [],
    warnings: [],
  });
}

function routeIntegrationCandidate(
  read: RecordValue | null,
  warnings: string[],
): StageCandidate {
  const contractSummary = recordOrNull(read?.contract_summary);
  const appliedMetadata = recordOrNull(read?.applied_snapshot_metadata);
  const runtimeSummary = recordOrNull(read?.runtime_current_working_perspective_summary);
  const ref =
    safeString(
      stringField(contractSummary, "record_id"),
      "route_integration_read.contract_record_id",
      warnings,
    ) ??
    safeString(
      stringField(appliedMetadata, "applied_snapshot_ref"),
      "route_integration_read.applied_snapshot_ref",
      warnings,
    ) ??
    safeString(
      stringField(runtimeSummary, "cwp_ref"),
      "route_integration_read.runtime_cwp_ref",
      warnings,
    );
  const status = stringField(read, "status");
  const staleRefs =
    status && status.includes("fallback")
      ? [`stale_or_fallback:current_working_perspective_route:${status}`]
      : [];

  return stageCandidate({
    stage: "cwp_route_integration",
    sourceName: "current_working_perspective_route_integration_read",
    material: read,
    active: Boolean(read),
    ref,
    fingerprint: derivedStageFingerprint("cwp_route_integration", read),
    sourceRefs: safeStringArray(
      read?.source_refs,
      "route_integration_read.source_refs",
      warnings,
    ),
    selectedRefs: safeStringArray([ref], "route_integration_read.selected_refs", warnings),
    missingRefs: safeStringArray(
      read?.blocked_reasons,
      "route_integration_read.blocked_reasons",
      warnings,
    ),
    staleRefs,
    blockers: safeStringArray(
      read?.refusal_reasons,
      "route_integration_read.refusal_reasons",
      warnings,
    ),
    warnings: safeStringArray(read?.warnings, "route_integration_read.warnings", warnings),
  });
}

function currentWorkingPerspectiveCandidate(
  read: RecordValue | null,
  warnings: string[],
): StageCandidate {
  const data = recordOrNull(read?.data);
  const asOf = safeString(
    stringField(data, "as_of"),
    "current_working_perspective_read.as_of",
    warnings,
  );
  const ref = asOf ? `current_perspective:${asOf}` : null;
  const freshness = stringField(data, "staleness", "status");

  return stageCandidate({
    stage: "current_working_perspective",
    sourceName: "current_working_perspective_read",
    material: read,
    active: Boolean(data),
    ref,
    fingerprint: derivedStageFingerprint("current_working_perspective", {
      as_of: asOf,
      source_status: stringField(read, "source_status"),
      staleness_status: freshness,
    }),
    sourceRefs: safeStringArray(
      getPath(data, ["current_frame", "source_refs"]),
      "current_working_perspective_read.source_refs",
      warnings,
    ),
    selectedRefs: safeStringArray([ref], "current_working_perspective_read.selected_refs", warnings),
    staleRefs:
      freshness && freshness !== "fresh"
        ? [`stale:current_working_perspective:${freshness}`]
        : [],
    missingRefs: data ? [] : ["missing:current_working_perspective_data"],
    blockers: [],
    warnings: [],
  });
}

function residualDiagnosticCandidate(
  readModel: RecordValue | null,
  residualSummaries: { blockers: string[]; warnings: string[] },
  warnings: string[],
): StageCandidate {
  return stageCandidate({
    stage: "residual_diagnostic",
    sourceName: "residual_diagnostic_candidate_read_model",
    material: readModel,
    active: residualSummaries.blockers.length > 0,
    ref: null,
    fingerprint: derivedStageFingerprint("residual_diagnostic", readModel),
    sourceRefs: safeStringArray(
      readModel?.source_refs,
      "residual_diagnostic.source_refs",
      warnings,
    ),
    selectedRefs: [],
    missingRefs: safeStringArray(
      readModel?.insufficient_data,
      "residual_diagnostic.insufficient_data",
      warnings,
    ),
    blockers: residualSummaries.blockers,
    warnings: residualSummaries.warnings,
  });
}

function dogfoodLoopCandidate(
  overview: RecordValue | null,
  warnings: string[],
): StageCandidate {
  const steps = arrayFromUnknown(overview?.spine_steps);
  const supplied = steps.filter((step) => {
    const record = recordOrNull(step);
    return Number(record?.material_count ?? 0) > 0;
  });
  const ref = safeString(
    stringField(supplied.at(-1) ? recordOrNull(supplied.at(-1)) : null, "step_id"),
    "dogfood_loop_spine.latest_step_id",
    warnings,
  );

  return stageCandidate({
    stage: "dogfood_loop_spine",
    sourceName: "workbench_dogfood_loop_spine_overview",
    material: overview,
    active: supplied.length > 0,
    ref,
    fingerprint: derivedStageFingerprint("dogfood_loop_spine", {
      overview_status: stringField(overview, "overview_status"),
      spine_summary: overview?.spine_summary,
      latest_step_id: ref,
    }),
    sourceRefs: safeStringArray(
      overview?.source_refs,
      "dogfood_loop_spine.source_refs",
      warnings,
    ),
    selectedRefs: safeStringArray([ref], "dogfood_loop_spine.selected_refs", warnings),
    missingRefs: safeStringArray(
      overview?.top_missing_evidence,
      "dogfood_loop_spine.top_missing_evidence",
      warnings,
    ),
    blockers: safeStringArray(
      overview?.top_blockers,
      "dogfood_loop_spine.top_blockers",
      warnings,
    ),
    warnings: safeStringArray(
      overview?.current_material_gaps,
      "dogfood_loop_spine.current_material_gaps",
      warnings,
    ),
  });
}

function stageCandidate(input: {
  stage: WorkplaneContinuitySpineStage;
  sourceName: string;
  material: RecordValue | null;
  active: boolean;
  ref: string | null;
  fingerprint: string | null;
  sourceRefs: string[];
  selectedRefs: string[];
  missingRefs?: string[];
  staleRefs?: string[];
  blockers?: string[];
  warnings?: string[];
}): StageCandidate {
  const available = Boolean(input.material);
  return {
    stage: input.stage,
    sourceName: input.sourceName,
    material: input.material,
    available,
    active: available && input.active,
    ref: input.ref,
    fingerprint: input.fingerprint,
    sourceRefs: uniqueStrings(input.sourceRefs),
    selectedRefs: uniqueStrings(input.selectedRefs),
    missingRefs: uniqueStrings(input.missingRefs ?? []),
    staleRefs: uniqueStrings(input.staleRefs ?? []),
    blockers: uniqueStrings(input.blockers ?? []),
    warnings: uniqueStrings(input.warnings ?? []),
  };
}

function residualCandidateSummaries(readModel: RecordValue | null): {
  blockers: string[];
  warnings: string[];
} {
  const residualCandidates = arrayFromUnknown(readModel?.residual_candidates)
    .map(recordOrNull)
    .filter(Boolean) as RecordValue[];
  const blockers: string[] = [];
  const warnings: string[] = [];

  for (const candidate of residualCandidates) {
    const status = stringField(candidate, "status") ?? "candidate";
    const severity = stringField(candidate, "severity") ?? "low";
    const category = safeReasonToken(
      stringField(candidate, "category") ?? "unknown_category",
    );
    const candidateId = safeReasonToken(
      stringField(candidate, "candidate_id") ?? "unknown_candidate",
    );
    const summary = `residual_${severity}:${status}:${category}:${candidateId}`;
    if (status === "blocked" || (status === "actionable_candidate" && severity === "high")) {
      blockers.push(summary);
    } else if (status === "actionable_candidate" || severity === "high") {
      warnings.push(summary);
    }
  }

  return {
    blockers: uniqueStrings(blockers),
    warnings: uniqueStrings(warnings),
  };
}

function deriveSpineStatus(input: {
  latestActive: StageCandidate | null;
  blockerReasons: string[];
  missingSourceRefs: string[];
  sourceFreshnessStatus: WorkplaneContinuitySourceFreshnessStatus;
}): WorkplaneContinuitySpineStatus {
  if (!input.latestActive) return "no_active_spine";
  if (input.blockerReasons.length > 0) return "blocked";
  if (input.missingSourceRefs.length > 0) return "insufficient_data";
  if (
    input.sourceFreshnessStatus === "stale" ||
    input.sourceFreshnessStatus === "mixed" ||
    input.sourceFreshnessStatus === "fallback_only"
  ) {
    return "stale_source_attention";
  }
  return "ready_for_operator_review";
}

function buildCodexHandoffHints(input: {
  latestActive: StageCandidate | null;
  spineStatus: WorkplaneContinuitySpineStatus;
  sourceFreshnessStatus: WorkplaneContinuitySourceFreshnessStatus;
  rollbackSupersedeStatus: WorkplaneContinuityRollbackSupersedeStatus;
  blockerReasons: string[];
  missingSourceRefs: string[];
}): string[] {
  return uniqueStrings([
    input.latestActive
      ? `latest_stage:${input.latestActive.stage}`
      : "latest_stage:none",
    `spine_status:${input.spineStatus}`,
    `source_freshness:${input.sourceFreshnessStatus}`,
    `rollback_supersede:${input.rollbackSupersedeStatus}`,
    input.blockerReasons.length > 0
      ? "review_blockers_before_handoff_preparation"
      : "review_summary_before_handoff_preparation",
    input.missingSourceRefs.length > 0
      ? "resolve_missing_source_refs_before_handoff_preparation"
      : "source_refs_available_for_manual_review",
    "do_not_execute_delivery_or_mutate_state_from_this_summary",
    "use_detailed_panels_for_full_source_review",
  ]);
}

function sourceFreshnessStatusFromInput(input: {
  context: RecordValue | null;
  currentWorkingPerspectiveRead: RecordValue | null;
  relay: RecordValue | null;
  routeIntegrationRead: RecordValue | null;
  appliedCwpRead: RecordValue | null;
  workbenchSpine: RecordValue | null;
  missingSourceRefs: string[];
  staleSourceRefs: string[];
}): WorkplaneContinuitySourceFreshnessStatus {
  const observations: string[] = [];
  observations.push(...freshnessTokens(input.context));
  observations.push(...freshnessTokens(input.currentWorkingPerspectiveRead));
  observations.push(...freshnessTokens(input.relay));
  observations.push(...freshnessTokens(input.routeIntegrationRead));
  observations.push(...freshnessTokens(input.appliedCwpRead));
  observations.push(...freshnessTokens(input.workbenchSpine));
  observations.push(...input.staleSourceRefs.map(() => "stale"));
  if (input.missingSourceRefs.length > 0) observations.push("missing");

  const hasFresh = observations.includes("fresh");
  const hasStale = observations.includes("stale");
  const hasFallback = observations.includes("fallback");
  const hasMissing = observations.includes("missing");
  if (observations.length === 0 || (hasMissing && !hasFresh && !hasStale && !hasFallback)) {
    return "missing";
  }
  if (hasFallback && !hasFresh && !hasStale) return "fallback_only";
  if (
    (hasFallback && (hasFresh || hasStale || hasMissing)) ||
    (hasStale && (hasFresh || hasFallback || hasMissing)) ||
    (hasMissing && (hasFresh || hasFallback || hasStale))
  ) {
    return "mixed";
  }
  if (hasStale) return "stale";
  return "fresh";
}

function freshnessTokens(value: unknown): string[] {
  const record = recordOrNull(value);
  if (!record) return ["missing"];
  const tokens: string[] = [];
  const directStrings = [
    stringField(record, "source_status"),
    stringField(record, "status"),
    stringField(record, "dashboard_status"),
    stringField(record, "overview_status"),
    stringField(record, "fallback_reason"),
    stringField(record, "data", "staleness", "status"),
    stringField(record, "source_status", "current_perspective"),
    stringField(record, "source_status", "delta_projection"),
    stringField(record, "source_status", "runner_delta_batch"),
    stringField(record, "fallback_reason", "current_perspective"),
    stringField(record, "fallback_metadata", "fallback_reason"),
  ].filter(Boolean) as string[];

  for (const text of directStrings) {
    const normalized = text.toLowerCase();
    if (normalized.includes("fresh") || normalized.includes("available")) {
      tokens.push("fresh");
    }
    if (
      normalized.includes("stale") ||
      normalized.includes("expired") ||
      normalized.includes("outdated")
    ) {
      tokens.push("stale");
    }
    if (
      normalized.includes("fallback") ||
      normalized.includes("runtime_only") ||
      normalized.includes("schema_missing") ||
      normalized.includes("db_missing") ||
      normalized.includes("fixture")
    ) {
      tokens.push("fallback");
    }
    if (
      normalized.includes("missing") ||
      normalized.includes("no_") ||
      normalized.includes("insufficient")
    ) {
      tokens.push("missing");
    }
  }
  if (getPath(record, ["fallback_metadata", "used_runtime_fallback"]) === true) {
    tokens.push("fallback");
  }
  if (tokens.length === 0) tokens.push("fresh");
  return tokens;
}

function fallbackSourceCount(input: {
  context: RecordValue | null;
  routeIntegrationRead: RecordValue | null;
  appliedCwpRead: RecordValue | null;
}): number {
  return [
    input.context,
    input.routeIntegrationRead,
    input.appliedCwpRead,
  ].filter((value) => freshnessTokens(value).includes("fallback")).length;
}

function rollbackSupersedeStatusFromInput(
  values: (RecordValue | null)[],
  hasMaterial: boolean,
): WorkplaneContinuityRollbackSupersedeStatus {
  if (!hasMaterial) return "unknown";
  const text = values
    .filter(Boolean)
    .map((value) => stableStringify(compactForPatternScan(value)))
    .join("\n")
    .toLowerCase();
  const hasRollback = /rolled[_-]?back|rollback|roll_back/.test(text);
  const hasSupersede = /superseded|supersedes|supersede/.test(text);
  if (hasRollback && hasSupersede) return "mixed_history";
  if (hasRollback) return "has_rolled_back_context";
  if (hasSupersede) return "has_superseded_context";
  return "active_only";
}

function wouldNotDoList(): string[] {
  return [
    "does_not_execute_delivery_or_provider_send",
    "does_not_call_provider_network_email_slack_webhook_github_codex_browser_or_crawler",
    "does_not_read_or_write_db_beyond_supplied_objects",
    "does_not_create_route_schema_migration_graph_vector_rag_or_crawler",
    "does_not_write_proof_evidence_clipboard_download_file_memory_or_dogfood_metrics",
    "does_not_mutate_perspective_cwp_handoff_work_or_source_records",
    "does_not_display_sensitive_or_unsanitized_source_material",
    "does_not_render_action_buttons_or_execute_workbench_controls",
  ];
}

function recordOrNull(value: unknown): RecordValue | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordValue)
    : null;
}

function getPath(value: unknown, path: string[]): unknown {
  let current: unknown = value;
  for (const key of path) {
    const record = recordOrNull(current);
    if (!record) return undefined;
    current = record[key];
  }
  return current;
}

function stringField(value: unknown, ...path: string[]): string | null {
  const field = path.length > 0 ? getPath(value, path) : value;
  return typeof field === "string" && field.trim() ? field.trim() : null;
}

function firstSafeString(
  values: unknown[],
  label: string,
  warnings: string[],
): string | null {
  for (const value of values) {
    const safe = safeString(value, label, warnings);
    if (safe) return safe;
  }
  return null;
}

function safeString(
  value: unknown,
  label: string,
  warnings: string[],
): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (RAW_OR_SECRET_SHAPED_STRING_PATTERN.test(trimmed)) {
    warnings.push(`unsafe_source_material_suppressed:${safeReasonToken(label)}`);
    return null;
  }
  return trimmed.slice(0, 180);
}

function safeStringArray(
  value: unknown,
  label: string,
  warnings: string[],
): string[] {
  return uniqueStrings(
    arrayFromUnknown(value)
      .map((item) => safeString(item, label, warnings))
      .filter(Boolean) as string[],
  );
}

function arrayFromUnknown(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return [value];
}

function safeReasonToken(value: string): string {
  return value
    .replace(/[^A-Za-z0-9:_-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 80);
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((left, right) =>
    left.localeCompare(right),
  );
}

function derivedStageFingerprint(
  stage: WorkplaneContinuitySpineStage,
  value: unknown,
): string | null {
  if (!value) return null;
  return stableFingerprint({ stage, value: compactForPatternScan(value) });
}

function stableFingerprint(value: unknown): string {
  return createHash("sha256")
    .update(stableStringify(value))
    .digest("hex")
    .slice(0, 24);
}

function compactForPatternScan(value: unknown, depth = 0): unknown {
  if (depth > 5) return "[depth-limit]";
  if (Array.isArray(value)) {
    return value.slice(0, 16).map((item) => compactForPatternScan(item, depth + 1));
  }
  const record = recordOrNull(value);
  if (!record) {
    if (typeof value === "string") {
      return RAW_OR_SECRET_SHAPED_STRING_PATTERN.test(value)
        ? "[suppressed]"
        : value.slice(0, 160);
    }
    return value;
  }

  const compact: Record<string, unknown> = {};
  for (const key of Object.keys(record).sort().slice(0, 80)) {
    if (
      /payload|body|note|report|token|secret|password|credential|api[_-]?key|url|env/i.test(
        key,
      )
    ) {
      compact[key] = "[suppressed]";
      continue;
    }
    compact[key] = compactForPatternScan(record[key], depth + 1);
  }
  return compact;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  const record = recordOrNull(value);
  if (record) {
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}
