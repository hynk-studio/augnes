import {
  WORKBENCH_SPINE_CONSOLIDATION_VERSION,
  type WorkbenchSpineConsolidation,
  type WorkbenchSpineConsolidationAuthorityBoundary,
  type WorkbenchSpineConsolidationInput,
  type WorkbenchSpineExternalDeliveryStatus,
  type WorkbenchSpineLineageEdge,
  type WorkbenchSpineLineageMap,
  type WorkbenchSpineLineageNode,
  type WorkbenchSpinePhaseGroup,
  type WorkbenchSpinePhaseId,
  type WorkbenchSpineRecommendedOperatorAction,
  type WorkbenchSpineRecommendedOperatorActionSummary,
  type WorkbenchSpineStageId,
  type WorkbenchSpineStageStatus,
  type WorkbenchSpineStageSummary,
} from "@/types/workbench-spine-consolidation";

type RecordValue = Record<string, unknown>;
type WorkbenchSpineStageInput = Omit<
  WorkbenchSpineStageSummary,
  | "label"
  | "read_only"
  | "blocker_reasons"
  | "missing_prerequisites"
  | "authority_warnings"
  | "source_refs"
  | "evidence_refs"
  | "material_count"
> &
  Partial<
    Pick<
      WorkbenchSpineStageSummary,
      | "blocker_reasons"
      | "missing_prerequisites"
      | "authority_warnings"
      | "source_refs"
      | "evidence_refs"
      | "material_count"
    >
  >;

const DEFAULT_SCOPE = "project:augnes" as const;
const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z" as const;

const phaseLabels: Record<WorkbenchSpinePhaseId, string> = {
  cwp_foundation: "CWP foundation",
  handoff_context: "Handoff context",
  packet_artifact: "Packet artifact",
  send_fulfillment: "Send fulfillment",
  external_delivery: "External delivery",
};

const stageLabels: Record<WorkbenchSpineStageId, string> = {
  applied_current_working_perspective: "Applied CWP snapshot",
  current_working_perspective_route_integration: "Route-integrated CWP read",
  applied_handoff_context: "Applied handoff context snapshot",
  exported_handoff_packet_artifact: "Exported handoff packet artifact",
  handoff_send_contract_record: "Handoff send contract record",
  local_handoff_send_fulfillment: "Local handoff send fulfillment",
  external_handoff_delivery: "External handoff delivery",
};

const forbiddenAuthorityTrueFields = [
  "source_of_truth",
  "can_write_db",
  "can_create_schema",
  "can_create_source_of_truth_store",
  "can_mutate_current_working_perspective",
  "can_replace_current_working_perspective_route_response",
  "can_apply_handoff_context",
  "can_mutate_handoff_context",
  "can_write_selected_refs_to_live_handoff",
  "can_copy_export_handoff_packet",
  "can_send_handoff",
  "can_call_send_provider",
  "can_call_external_messaging",
  "can_call_email",
  "can_call_slack",
  "can_call_webhook",
  "can_call_provider_openai",
  "can_call_github",
  "can_execute_codex",
  "can_call_browser_or_crawler",
  "can_write_clipboard",
  "can_download_file",
  "can_write_arbitrary_file",
  "can_write_memory",
  "can_mutate_memory",
  "can_promote_memory",
  "can_write_dogfood_metrics",
  "can_update_global_dogfood_metrics",
  "can_create_pr",
  "can_merge_pr",
  "can_run_autonomous_action",
  "can_create_graph_or_vector_store",
  "can_create_rag_stack",
  "can_crawl_or_observe_browser",
  "can_render_workbench_action_button",
] as const;

export function createWorkbenchSpineConsolidationAuthorityBoundaryV01():
  WorkbenchSpineConsolidationAuthorityBoundary {
  return {
    read_only: true,
    advisory_only: true,
    derived_read_model: true,
    source_of_truth: false,
    can_write_db: false,
    can_create_schema: false,
    can_create_source_of_truth_store: false,
    can_mutate_current_working_perspective: false,
    can_replace_current_working_perspective_route_response: false,
    can_apply_handoff_context: false,
    can_mutate_handoff_context: false,
    can_write_selected_refs_to_live_handoff: false,
    can_copy_export_handoff_packet: false,
    can_send_handoff: false,
    can_call_send_provider: false,
    can_call_external_messaging: false,
    can_call_email: false,
    can_call_slack: false,
    can_call_webhook: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_execute_codex: false,
    can_call_browser_or_crawler: false,
    can_write_clipboard: false,
    can_download_file: false,
    can_write_arbitrary_file: false,
    can_write_memory: false,
    can_mutate_memory: false,
    can_promote_memory: false,
    can_write_dogfood_metrics: false,
    can_update_global_dogfood_metrics: false,
    can_create_pr: false,
    can_merge_pr: false,
    can_run_autonomous_action: false,
    can_create_graph_or_vector_store: false,
    can_create_rag_stack: false,
    can_crawl_or_observe_browser: false,
    can_render_workbench_action_button: false,
    notes: [
      "Dashboard is a read-only consolidation of already-read local Workbench spine material.",
      "It cannot write records, create schema, send externally, call providers, write clipboard/download/files, mutate CWP/handoff/memory/metrics, or render action buttons.",
    ],
  };
}

export function buildWorkbenchSpineConsolidationV01(
  input: WorkbenchSpineConsolidationInput = {},
): WorkbenchSpineConsolidation {
  const asOf = input.as_of ?? FALLBACK_AS_OF;
  const sourceRefs = uniqueStrings(input.source_refs ?? []);
  const inputAuthorityWarnings = inputAuthorityProblems(input);
  const malformedInputs = inputMalformedProblems(input);

  const stages = [
    appliedCwpStage(input.applied_current_working_perspective_read),
    routeIntegrationStage(input.current_working_perspective_route_integration_read),
    appliedHandoffContextStage(input.applied_handoff_context_read),
    exportedPacketArtifactStage(input.exported_handoff_packet_artifact_read),
    sendContractRecordStage(input.handoff_send_contract_record_review),
    localSendFulfillmentStage({
      recordReview: input.handoff_send_record_review,
      sentRead: input.sent_handoff_read,
    }),
    externalDeliveryStage(),
  ].map((stage) => ({
    ...stage,
    authority_warnings: uniqueStrings([
      ...stage.authority_warnings,
      ...inputAuthorityWarnings.filter((warning) =>
        warning.startsWith(`${stage.stage_id}:`),
      ),
    ]),
  }));

  const lineageMap = buildLineageMap(stages, input);
  const lineageProblems = lineageBlockerProblems(lineageMap, stages);
  const blockers = uniqueStrings([
    ...stages.flatMap((stage) => stage.blocker_reasons),
    ...stages.flatMap((stage) => stage.authority_warnings),
    ...inputAuthorityWarnings.filter((warning) => !warning.includes(":")),
    ...malformedInputs,
    ...lineageProblems,
  ]);
  const missingPrerequisites = uniqueStrings(
    stages.flatMap((stage) => stage.missing_prerequisites),
  );
  const requiredLocalMissingPrerequisites =
    localMissingPrerequisites(missingPrerequisites);
  const action = recommendedAction({ stages, blockers, missingPrerequisites });
  const localFulfillmentRecorded = stageStatus(
    stages,
    "local_handoff_send_fulfillment",
  ) === "fulfilled";
  const localSpineSatisfied = localSpineStagesSatisfied(stages);
  const externalDeliveryStatus: WorkbenchSpineExternalDeliveryStatus =
    blockers.some((blocker) => blocker.includes("external_handoff_delivery"))
      ? "blocked"
      : localFulfillmentRecorded
        ? "not_configured"
        : "not_attempted";
  const phaseGroups = buildPhaseGroups(stages);
  const dashboardStatus = determineDashboardStatus({
    stages,
    blockers,
    requiredLocalMissingPrerequisites,
    localFulfillmentRecorded,
    localSpineSatisfied,
  });

  return {
    dashboard_version: WORKBENCH_SPINE_CONSOLIDATION_VERSION,
    scope: DEFAULT_SCOPE,
    as_of: asOf,
    source_refs: sourceRefs,
    dashboard_status: dashboardStatus,
    recommended_next_operator_action: action,
    external_delivery: {
      status: externalDeliveryStatus,
      local_fulfillment_is_external_delivery: false,
      provider_contract_present: false,
      provider_called: false,
      external_message_sent: false,
      recommended_future_contract: "external_handoff_delivery_contract.v0.1",
      notes: [
        "Local send fulfillment records do not imply external delivery.",
        "External delivery stays unavailable until a dedicated external delivery contract exists.",
      ],
    },
    phase_groups: phaseGroups,
    stage_summaries: stages,
    lineage_map: lineageMap,
    blocker_summary: {
      blockers,
      missing_prerequisites: missingPrerequisites,
      authority_warnings: uniqueStrings([
        ...stages.flatMap((stage) => stage.authority_warnings),
        ...inputAuthorityWarnings,
      ]),
      malformed_inputs: malformedInputs,
    },
    compact_summary: {
      stage_count: stages.length,
      fulfilled_stage_count: stages.filter((stage) => stage.status === "fulfilled")
        .length,
      blocked_stage_count: stages.filter((stage) => stage.status === "blocked")
        .length,
      missing_stage_count: stages.filter((stage) => stage.status === "missing")
        .length,
      lineage_link_count: lineageMap.edges.filter((edge) => edge.linked).length,
      lineage_missing_link_count: lineageMap.missing_links.length,
      local_fulfillment_recorded: localFulfillmentRecorded,
      external_delivery_configured: false,
    },
    would_not_do: [
      "does_not_send_handoff_externally",
      "does_not_call_provider_email_slack_webhook_github_codex_openai_browser_crawler_or_network",
      "does_not_write_clipboard_download_or_arbitrary_file",
      "does_not_mutate_live_handoff_context_route_cwp_relay_memory_or_metrics",
      "does_not_create_source_of_truth_database",
      "does_not_render_workbench_action_button",
    ],
    non_goals: [
      "external_handoff_delivery_contract",
      "provider_specific_delivery",
      "clipboard_download_or_file_export_side_effect",
      "global_memory_or_perspective_mutation",
      "autonomy_runner_scheduler_or_multi_agent_execution",
    ],
    authority_boundary: createWorkbenchSpineConsolidationAuthorityBoundaryV01(),
  };
}

function appliedCwpStage(value: unknown): WorkbenchSpineStageSummary {
  const read = isRecord(value) ? value : null;
  const status = stringField(read, "status");
  const summary = recordField(read, "summary");
  const ref = stringField(summary, "applied_snapshot_ref");
  if (!read) {
    return stage({
      stage_id: "applied_current_working_perspective",
      phase_id: "cwp_foundation",
      status: "missing",
      primary_ref: null,
      source_status: null,
      summary: "No applied CWP snapshot read is available.",
      missing_prerequisites: ["applied_current_working_perspective_snapshot_missing"],
    });
  }
  if (read.read_version !== "applied_current_working_perspective_read.v0.1") {
    return blockedStage("applied_current_working_perspective", "cwp_foundation", [
      "applied_current_working_perspective_read_malformed",
    ]);
  }
  if (status === "latest_applied_snapshot_available" && ref) {
    return stage({
      stage_id: "applied_current_working_perspective",
      phase_id: "cwp_foundation",
      status: "applied",
      primary_ref: ref,
      source_status: status,
      summary: "Applied CurrentWorkingPerspective snapshot is available.",
      evidence_refs: [ref],
      material_count: 1,
    });
  }
  return stage({
    stage_id: "applied_current_working_perspective",
    phase_id: "cwp_foundation",
    status: status === "schema_missing" ? "blocked" : "insufficient_data",
    primary_ref: ref,
    source_status: status,
    summary: "Applied CWP snapshot is not available.",
    blocker_reasons:
      status === "schema_missing"
        ? ["applied_current_working_perspective_schema_missing"]
        : [],
    missing_prerequisites: ["applied_current_working_perspective_snapshot_missing"],
  });
}

function routeIntegrationStage(value: unknown): WorkbenchSpineStageSummary {
  const read = isRecord(value) ? value : null;
  if (!read) {
    return stage({
      stage_id: "current_working_perspective_route_integration",
      phase_id: "cwp_foundation",
      status: "missing",
      primary_ref: null,
      source_status: null,
      summary: "No route-integrated CWP read is available.",
      missing_prerequisites: ["current_working_perspective_route_integration_read_missing"],
    });
  }
  if (
    read.read_version !== "current_working_perspective_route_integration_read.v0.1"
  ) {
    return blockedStage(
      "current_working_perspective_route_integration",
      "cwp_foundation",
      ["current_working_perspective_route_integration_read_malformed"],
    );
  }
  const status = stringField(read, "status");
  const metadata = recordField(read, "route_integration_metadata");
  const contractRecordRef = stringField(metadata, "contract_record_id");
  const appliedSnapshotRef = stringField(metadata, "applied_snapshot_ref");
  const ref = contractRecordRef ?? appliedSnapshotRef;
  const blockers = stringArray(read.blocked_reasons);
  const integrationAvailable =
    isRouteIntegrationMaterialStatus(status) && Boolean(ref);
  const statusBlockers =
    status === "contract_invalid" ||
    status === "applied_snapshot_invalid" ||
    status === "fallback_to_runtime"
      ? [`current_working_perspective_route_integration_read_${status}`]
      : [];
  if (blockers.length > 0 || statusBlockers.length > 0) {
    return stage({
      stage_id: "current_working_perspective_route_integration",
      phase_id: "cwp_foundation",
      status: "blocked",
      primary_ref: ref,
      source_status: status,
      summary: "Route-integrated CWP read material is blocked.",
      blocker_reasons: uniqueStrings([
        ...blockers.map((reason) => `route_integration:${reason}`),
        ...statusBlockers,
      ]),
      evidence_refs: stringArray(read.evidence_refs),
      source_refs: stringArray(read.source_refs),
      material_count: ref ? 1 : 0,
    });
  }
  if (integrationAvailable) {
    return stage({
      stage_id: "current_working_perspective_route_integration",
      phase_id: "cwp_foundation",
      status: "available",
      primary_ref: ref,
      source_status: status,
      summary: "Route-integrated CWP read material is available.",
      evidence_refs: stringArray(read.evidence_refs),
      source_refs: stringArray(read.source_refs),
      material_count: 1,
    });
  }
  return stage({
    stage_id: "current_working_perspective_route_integration",
    phase_id: "cwp_foundation",
    status: "insufficient_data",
    primary_ref: ref,
    source_status: status,
    summary:
      status === "runtime_only"
        ? "Runtime CWP read is available; applied snapshot overlay is not active."
        : "Route-integrated CWP read material is not yet available.",
    missing_prerequisites: [
      routeIntegrationMissingPrerequisite(status, Boolean(ref)),
    ],
    evidence_refs: stringArray(read.evidence_refs),
    source_refs: stringArray(read.source_refs),
    material_count: 0,
  });
}

function appliedHandoffContextStage(value: unknown): WorkbenchSpineStageSummary {
  const read = isRecord(value) ? value : null;
  const status = stringField(read, "status");
  const summary = recordField(read, "summary");
  const ref = stringField(summary, "applied_handoff_context_snapshot_ref");
  if (!read) {
    return stage({
      stage_id: "applied_handoff_context",
      phase_id: "handoff_context",
      status: "missing",
      primary_ref: null,
      source_status: null,
      summary: "No applied handoff context snapshot read is available.",
      missing_prerequisites: ["applied_handoff_context_snapshot_missing"],
    });
  }
  if (read.read_version !== "applied_handoff_context_read.v0.1") {
    return blockedStage("applied_handoff_context", "handoff_context", [
      "applied_handoff_context_read_malformed",
    ]);
  }
  if (
    status === "latest_applied_handoff_context_snapshot_available" &&
    ref
  ) {
    return stage({
      stage_id: "applied_handoff_context",
      phase_id: "handoff_context",
      status: "applied",
      primary_ref: ref,
      source_status: status,
      summary: "Applied handoff context snapshot is available.",
      evidence_refs: [ref],
      material_count: 1,
    });
  }
  return stage({
    stage_id: "applied_handoff_context",
    phase_id: "handoff_context",
    status: status === "schema_missing" ? "blocked" : "missing",
    primary_ref: ref,
    source_status: status,
    summary: "Applied handoff context snapshot is not available.",
    blocker_reasons:
      status === "schema_missing"
        ? ["applied_handoff_context_schema_missing"]
        : [],
    missing_prerequisites: ["applied_handoff_context_snapshot_missing"],
  });
}

function exportedPacketArtifactStage(value: unknown): WorkbenchSpineStageSummary {
  const read = isRecord(value) ? value : null;
  const status = stringField(read, "status");
  const summary = recordField(read, "summary");
  const ref = stringField(summary, "exported_artifact_ref");
  if (!read) {
    return stage({
      stage_id: "exported_handoff_packet_artifact",
      phase_id: "packet_artifact",
      status: "missing",
      primary_ref: null,
      source_status: null,
      summary: "No exported handoff packet artifact read is available.",
      missing_prerequisites: ["exported_handoff_packet_artifact_missing"],
    });
  }
  if (read.read_version !== "exported_handoff_packet_artifact_read.v0.1") {
    return blockedStage("exported_handoff_packet_artifact", "packet_artifact", [
      "exported_handoff_packet_artifact_read_malformed",
    ]);
  }
  if (
    status === "latest_exported_handoff_packet_artifact_available" &&
    ref
  ) {
    return stage({
      stage_id: "exported_handoff_packet_artifact",
      phase_id: "packet_artifact",
      status: "exported",
      primary_ref: ref,
      source_status: status,
      summary: "Exported packet artifact is available in the local artifact store.",
      evidence_refs: [ref, stringField(summary, "packet_format")].filter(
        isNonEmptyString,
      ),
      material_count: 1,
    });
  }
  return stage({
    stage_id: "exported_handoff_packet_artifact",
    phase_id: "packet_artifact",
    status: status === "schema_missing" ? "blocked" : "missing",
    primary_ref: ref,
    source_status: status,
    summary: "Exported packet artifact is not available.",
    blocker_reasons:
      status === "schema_missing"
        ? ["exported_handoff_packet_artifact_schema_missing"]
        : [],
    missing_prerequisites: ["exported_handoff_packet_artifact_missing"],
  });
}

function sendContractRecordStage(value: unknown): WorkbenchSpineStageSummary {
  const review = isRecord(value) ? value : null;
  const status = stringField(review, "review_status");
  const latest = recordField(review, "latest_record_summary");
  const selected = recordField(review, "selected_record_summary");
  const record = selected ?? latest;
  const ref = stringField(record, "record_id");
  if (!review) {
    return stage({
      stage_id: "handoff_send_contract_record",
      phase_id: "send_fulfillment",
      status: "missing",
      primary_ref: null,
      source_status: null,
      summary: "No handoff send contract record review is available.",
      missing_prerequisites: ["handoff_send_contract_record_missing"],
    });
  }
  if (review.review_version !== "handoff_send_contract_record_review.v0.1") {
    return blockedStage("handoff_send_contract_record", "send_fulfillment", [
      "handoff_send_contract_record_review_malformed",
    ]);
  }
  if (status === "records_available" || status === "selected_record_found") {
    return stage({
      stage_id: "handoff_send_contract_record",
      phase_id: "send_fulfillment",
      status: "approved",
      primary_ref: ref,
      source_status: status,
      summary: "Approved local handoff send contract record is available.",
      blocker_reasons: stringArray(review.blocked_reasons),
      missing_prerequisites: stringArray(review.insufficient_data_reasons),
      source_refs: stringArray(review.source_refs),
      evidence_refs: stringArray(recordField(review, "evidence_summary")?.evidence_refs),
      material_count: numberField(recordField(review, "input_summary"), "valid_record_count"),
    });
  }
  return stage({
    stage_id: "handoff_send_contract_record",
    phase_id: "send_fulfillment",
    status: status === "records_invalid" || status === "schema_missing"
      ? "blocked"
      : "missing",
    primary_ref: ref,
    source_status: status,
    summary: "Approved handoff send contract record is not available.",
    blocker_reasons:
      status === "records_invalid"
        ? ["handoff_send_contract_record_review_records_invalid"]
        : status === "schema_missing"
          ? ["handoff_send_contract_record_review_schema_missing"]
          : [],
    missing_prerequisites: ["handoff_send_contract_record_missing"],
  });
}

function localSendFulfillmentStage({
  recordReview,
  sentRead,
}: {
  recordReview: unknown;
  sentRead: unknown;
}): WorkbenchSpineStageSummary {
  const read = isRecord(sentRead) ? sentRead : null;
  const review = isRecord(recordReview) ? recordReview : null;
  const readSummary = recordField(read, "latest_fulfillment_summary");
  const readRef = stringField(readSummary, "record_id");
  const reviewSummary =
    recordField(review, "selected_record_summary") ??
    recordField(review, "latest_record_summary");
  const reviewRef = stringField(reviewSummary, "record_id");
  const status = stringField(read, "status");
  if (
    read?.read_version === "sent_handoff_read.v0.1" &&
    status === "latest_handoff_send_fulfillment_available" &&
    readRef
  ) {
    return stage({
      stage_id: "local_handoff_send_fulfillment",
      phase_id: "send_fulfillment",
      status: "fulfilled",
      primary_ref: readRef,
      source_status: status,
      summary:
        "Scoped local handoff send fulfillment record is available; this is not external delivery.",
      evidence_refs: [readRef, stringField(readSummary, "payload_hash")].filter(
        isNonEmptyString,
      ),
      material_count: 1,
    });
  }
  if (
    review?.review_version === "handoff_send_record_review.v0.1" &&
    (review.review_status === "records_available" ||
      review.review_status === "selected_record_found") &&
    reviewRef
  ) {
    return stage({
      stage_id: "local_handoff_send_fulfillment",
      phase_id: "send_fulfillment",
      status: "fulfilled",
      primary_ref: reviewRef,
      source_status: stringField(review, "review_status"),
      summary:
        "Scoped local handoff send record review shows local fulfillment material.",
      blocker_reasons: stringArray(review.blocked_reasons),
      source_refs: stringArray(review.source_refs),
      evidence_refs: stringArray(
        recordField(review, "evidence_summary")?.payload_hashes,
      ),
      material_count: numberField(recordField(review, "input_summary"), "valid_record_count"),
    });
  }
  if (
    review?.review_version === "handoff_send_record_review.v0.1" &&
    (review.review_status === "records_invalid" ||
      review.review_status === "schema_missing")
  ) {
    return stage({
      stage_id: "local_handoff_send_fulfillment",
      phase_id: "send_fulfillment",
      status: "blocked",
      primary_ref: reviewRef,
      source_status: stringField(review, "review_status"),
      summary: "Local handoff send fulfillment review is blocked.",
      blocker_reasons:
        stringField(review, "review_status") === "records_invalid"
          ? ["handoff_send_record_review_records_invalid"]
          : ["handoff_send_record_review_schema_missing"],
    });
  }
  return stage({
    stage_id: "local_handoff_send_fulfillment",
    phase_id: "send_fulfillment",
    status: "missing",
    primary_ref: null,
    source_status: status ?? stringField(review, "review_status"),
    summary: "No scoped local handoff send fulfillment record is available.",
    missing_prerequisites: ["local_handoff_send_fulfillment_missing"],
  });
}

function externalDeliveryStage(): WorkbenchSpineStageSummary {
  return stage({
    stage_id: "external_handoff_delivery",
    phase_id: "external_delivery",
    status: "not_configured",
    primary_ref: null,
    source_status: "not_configured",
    summary:
      "External delivery is intentionally not configured; local fulfillment is not provider delivery.",
    missing_prerequisites: ["external_handoff_delivery_contract_missing"],
  });
}

function buildLineageMap(
  stages: WorkbenchSpineStageSummary[],
  input: WorkbenchSpineConsolidationInput,
): WorkbenchSpineLineageMap {
  const refs = lineageRefs(input, stages);
  const nodes: WorkbenchSpineLineageNode[] = stages.map((stage) => ({
    node_id: stage.stage_id,
    label: stage.label,
    ref: stage.primary_ref,
    status: stage.status,
  }));
  const edges: WorkbenchSpineLineageEdge[] = [
    lineageEdge({
      from: "applied_current_working_perspective",
      to: "current_working_perspective_route_integration",
      relationship: "route read uses applied CWP snapshot when available",
      expected_ref: refs.appliedCwpRef,
      observed_ref: refs.routeAppliedCwpRef,
    }),
    lineageEdge({
      from: "current_working_perspective_route_integration",
      to: "applied_handoff_context",
      relationship: "handoff context records source route-integrated CWP read",
      expected_ref: refs.routeRef,
      observed_ref: refs.handoffRouteRef,
      allowMissingObservedWhenExpectedMissing: true,
    }),
    lineageEdge({
      from: "applied_handoff_context",
      to: "exported_handoff_packet_artifact",
      relationship: "packet artifact sources applied handoff context snapshot",
      expected_ref: refs.appliedHandoffContextRef,
      observed_ref: refs.artifactAppliedHandoffContextRef,
    }),
    lineageEdge({
      from: "exported_handoff_packet_artifact",
      to: "handoff_send_contract_record",
      relationship: "send contract sources exported packet artifact",
      expected_ref: refs.exportedArtifactRef,
      observed_ref: refs.sendContractExportedArtifactRef,
    }),
    lineageEdge({
      from: "handoff_send_contract_record",
      to: "local_handoff_send_fulfillment",
      relationship: "local fulfillment sources approved send contract record",
      expected_ref: refs.sendContractRecordRef,
      observed_ref: refs.localFulfillmentContractRef,
    }),
    lineageEdge({
      from: "local_handoff_send_fulfillment",
      to: "external_handoff_delivery",
      relationship: "external delivery requires a future explicit contract",
      expected_ref: refs.localFulfillmentRecordRef,
      observed_ref: null,
      forceMissingProblem: "external_delivery_contract_not_configured",
    }),
  ];
  return {
    map_version: "workbench_spine_lineage_map.v0.1",
    nodes,
    edges,
    missing_links: edges
      .filter((edge) => !edge.linked && edge.problem)
      .map((edge) => edge.problem as string),
  };
}

function lineageRefs(
  input: WorkbenchSpineConsolidationInput,
  stages: WorkbenchSpineStageSummary[],
) {
  const appliedCwpRead = recordOrNull(input.applied_current_working_perspective_read);
  const routeRead = recordOrNull(input.current_working_perspective_route_integration_read);
  const appliedHandoffRead = recordOrNull(input.applied_handoff_context_read);
  const exportedRead = recordOrNull(input.exported_handoff_packet_artifact_read);
  const sendContractReview = recordOrNull(input.handoff_send_contract_record_review);
  const sentRead = recordOrNull(input.sent_handoff_read);
  const sendRecordReview = recordOrNull(input.handoff_send_record_review);
  const sentSummary = recordField(sentRead, "latest_fulfillment_summary");
  const sendRecordSummary =
    recordField(sendRecordReview, "selected_record_summary") ??
    recordField(sendRecordReview, "latest_record_summary");
  const sendContractSummary =
    recordField(sendContractReview, "selected_record_summary") ??
    recordField(sendContractReview, "latest_record_summary");
  return {
    appliedCwpRef: stringField(recordField(appliedCwpRead, "summary"), "applied_snapshot_ref"),
    routeAppliedCwpRef: stringField(
      recordField(routeRead, "applied_snapshot_metadata"),
      "applied_snapshot_ref",
    ),
    routeRef:
      stringField(recordField(routeRead, "route_integration_metadata"), "contract_record_id") ??
      stageRef(stages, "current_working_perspective_route_integration"),
    handoffRouteRef: stringField(
      recordField(appliedHandoffRead, "summary"),
      "source_route_integration_read_ref",
    ),
    appliedHandoffContextRef: stringField(
      recordField(appliedHandoffRead, "summary"),
      "applied_handoff_context_snapshot_ref",
    ),
    artifactAppliedHandoffContextRef: stringField(
      recordField(exportedRead, "summary"),
      "source_applied_handoff_context_snapshot_ref",
    ),
    exportedArtifactRef: stringField(
      recordField(exportedRead, "summary"),
      "exported_artifact_ref",
    ),
    sendContractExportedArtifactRef: stringField(
      sendContractSummary,
      "source_exported_artifact_ref",
    ),
    sendContractRecordRef: stringField(sendContractSummary, "record_id"),
    localFulfillmentContractRef:
      stringField(sentSummary, "source_handoff_send_contract_record_ref") ??
      stringField(sendRecordSummary, "source_handoff_send_contract_record_ref"),
    localFulfillmentRecordRef:
      stringField(sentSummary, "record_id") ??
      stringField(sendRecordSummary, "record_id"),
  };
}

function lineageEdge({
  from,
  to,
  relationship,
  expected_ref,
  observed_ref,
  allowMissingObservedWhenExpectedMissing = false,
  forceMissingProblem,
}: {
  from: WorkbenchSpineStageId;
  to: WorkbenchSpineStageId;
  relationship: string;
  expected_ref: string | null;
  observed_ref: string | null;
  allowMissingObservedWhenExpectedMissing?: boolean;
  forceMissingProblem?: string;
}): WorkbenchSpineLineageEdge {
  const linked = Boolean(
    !forceMissingProblem &&
      expected_ref &&
      observed_ref &&
      expected_ref === observed_ref,
  );
  const missingExpected = !expected_ref;
  const missingObserved = !observed_ref;
  const problem = forceMissingProblem
    ? forceMissingProblem
    : linked
      ? null
      : missingExpected && (missingObserved || allowMissingObservedWhenExpectedMissing)
        ? `${from}_ref_missing`
        : missingObserved
          ? `${to}_source_ref_missing`
          : `${from}_to_${to}_ref_mismatch`;
  return {
    from,
    to,
    relationship,
    linked,
    expected_ref,
    observed_ref,
    problem,
  };
}

function buildPhaseGroups(
  stages: WorkbenchSpineStageSummary[],
): WorkbenchSpinePhaseGroup[] {
  return (Object.keys(phaseLabels) as WorkbenchSpinePhaseId[]).map((phaseId) => {
    const phaseStages = stages.filter((stage) => stage.phase_id === phaseId);
    const status = phaseStatus(phaseStages);
    return {
      phase_id: phaseId,
      label: phaseLabels[phaseId],
      status,
      summary: `${phaseStages.filter((stage) => stage.material_count > 0).length}/${phaseStages.length} stages have local material.`,
      stages: phaseStages,
    };
  });
}

function recommendedAction({
  stages,
  blockers,
  missingPrerequisites,
}: {
  stages: WorkbenchSpineStageSummary[];
  blockers: string[];
  missingPrerequisites: string[];
}): WorkbenchSpineRecommendedOperatorActionSummary {
  if (blockers.length) {
    return {
      action: "resolve_workbench_spine_consolidation_blockers",
      stage_id: firstBlockedStage(stages),
      rationale: blockers.slice(0, 5),
    };
  }
  const checks: Array<{
    stage_id: WorkbenchSpineStageId;
    expected: WorkbenchSpineStageStatus[];
    action: WorkbenchSpineRecommendedOperatorAction;
  }> = [
    {
      stage_id: "applied_current_working_perspective",
      expected: ["applied"],
      action: "review_applied_current_working_perspective_snapshot",
    },
    {
      stage_id: "current_working_perspective_route_integration",
      expected: ["available"],
      action: "review_current_working_perspective_route_integration_read",
    },
    {
      stage_id: "applied_handoff_context",
      expected: ["applied"],
      action: "review_applied_handoff_context_snapshot",
    },
    {
      stage_id: "exported_handoff_packet_artifact",
      expected: ["exported"],
      action: "review_exported_handoff_packet_artifact",
    },
    {
      stage_id: "handoff_send_contract_record",
      expected: ["approved"],
      action: "review_handoff_send_contract_record",
    },
    {
      stage_id: "local_handoff_send_fulfillment",
      expected: ["fulfilled"],
      action: "review_handoff_send_record",
    },
  ];
  for (const check of checks) {
    if (!check.expected.includes(stageStatus(stages, check.stage_id))) {
      return {
        action: check.action,
        stage_id: check.stage_id,
        rationale: missingPrerequisites.slice(0, 5),
      };
    }
  }
  return {
    action: "prepare_external_handoff_delivery_contract",
    stage_id: "external_handoff_delivery",
    rationale: [
      "local_handoff_send_fulfillment_recorded",
      "external_delivery_contract_missing",
    ],
  };
}

function isRouteIntegrationMaterialStatus(status: string | null): boolean {
  return (
    status === "runtime_with_applied_snapshot_hint" ||
    status === "runtime_with_applied_snapshot_overlay_candidate" ||
    status === "applied_snapshot_preferred_with_runtime_fallback"
  );
}

function routeIntegrationMissingPrerequisite(
  status: string | null,
  hasMetadataRef: boolean,
): string {
  if (status === "runtime_only") {
    return "current_working_perspective_route_integration_not_configured";
  }
  if (status === "contract_missing") {
    return "current_working_perspective_route_integration_contract_missing";
  }
  if (status === "applied_snapshot_missing") {
    return "current_working_perspective_route_integration_applied_snapshot_missing";
  }
  if (isRouteIntegrationMaterialStatus(status) && !hasMetadataRef) {
    return "current_working_perspective_route_integration_metadata_ref_missing";
  }
  return "current_working_perspective_route_integration_material_missing";
}

function lineageBlockerProblems(
  lineageMap: WorkbenchSpineLineageMap,
  stages: WorkbenchSpineStageSummary[],
): string[] {
  return uniqueStrings(
    lineageMap.edges.flatMap((edge) => {
      if (
        edge.linked ||
        !edge.problem ||
        edge.problem === "external_delivery_contract_not_configured"
      ) {
        return [];
      }
      const hasExpectedRef = isNonEmptyString(edge.expected_ref);
      const hasObservedRef = isNonEmptyString(edge.observed_ref);
      const downstreamHasMaterial = stageClaimsLineageMaterial(stages, edge.to);

      if (
        hasExpectedRef &&
        hasObservedRef &&
        edge.expected_ref !== edge.observed_ref
      ) {
        return [`lineage_mismatch:${edge.problem}`];
      }
      if (!hasExpectedRef && hasObservedRef) {
        return [`lineage_downstream_without_upstream:${edge.problem}`];
      }
      if (hasExpectedRef && !hasObservedRef && downstreamHasMaterial) {
        return [`lineage_missing_downstream_source_ref:${edge.problem}`];
      }
      return [];
    }),
  );
}

function stageClaimsLineageMaterial(
  stages: WorkbenchSpineStageSummary[],
  stageId: WorkbenchSpineStageId,
): boolean {
  const stage = stages.find((item) => item.stage_id === stageId);
  if (!stage) return false;
  return (
    stage.material_count > 0 ||
    ["available", "approved", "applied", "exported", "fulfilled"].includes(
      stage.status,
    )
  );
}

function localMissingPrerequisites(values: string[]): string[] {
  return values.filter(
    (value) => value !== "external_handoff_delivery_contract_missing",
  );
}

function localSpineStagesSatisfied(
  stages: WorkbenchSpineStageSummary[],
): boolean {
  const expectedStatuses: Partial<
    Record<WorkbenchSpineStageId, WorkbenchSpineStageStatus>
  > = {
    applied_current_working_perspective: "applied",
    current_working_perspective_route_integration: "available",
    applied_handoff_context: "applied",
    exported_handoff_packet_artifact: "exported",
    handoff_send_contract_record: "approved",
    local_handoff_send_fulfillment: "fulfilled",
  };
  return Object.entries(expectedStatuses).every(
    ([stageId, expectedStatus]) =>
      stageStatus(stages, stageId as WorkbenchSpineStageId) === expectedStatus,
  );
}

function determineDashboardStatus({
  stages,
  blockers,
  requiredLocalMissingPrerequisites,
  localFulfillmentRecorded,
  localSpineSatisfied,
}: {
  stages: WorkbenchSpineStageSummary[];
  blockers: string[];
  requiredLocalMissingPrerequisites: string[];
  localFulfillmentRecorded: boolean;
  localSpineSatisfied: boolean;
}) {
  const materialStages = stages.filter((stage) => stage.material_count > 0);
  if (blockers.length) return "blocked";
  if (
    localFulfillmentRecorded &&
    localSpineSatisfied &&
    requiredLocalMissingPrerequisites.length === 0
  ) {
    return "local_fulfillment_available";
  }
  if (materialStages.length === 0) return "no_spine_material";
  if (requiredLocalMissingPrerequisites.length) return "insufficient_data";
  return "spine_in_progress";
}

function stage({
  stage_id,
  phase_id,
  status,
  primary_ref,
  source_status,
  summary,
  blocker_reasons = [],
  missing_prerequisites = [],
  authority_warnings = [],
  source_refs = [],
  evidence_refs = [],
  material_count = primary_ref ? 1 : 0,
}: WorkbenchSpineStageInput): WorkbenchSpineStageSummary {
  return {
    stage_id,
    phase_id,
    label: stageLabels[stage_id],
    status,
    primary_ref,
    source_status,
    summary,
    blocker_reasons: uniqueStrings(blocker_reasons),
    missing_prerequisites: uniqueStrings(missing_prerequisites),
    authority_warnings: uniqueStrings(authority_warnings),
    source_refs: uniqueStrings(source_refs),
    evidence_refs: uniqueStrings(evidence_refs),
    material_count,
    read_only: true,
  };
}

function blockedStage(
  stage_id: WorkbenchSpineStageId,
  phase_id: WorkbenchSpinePhaseId,
  blockerReasons: string[],
): WorkbenchSpineStageSummary {
  return stage({
    stage_id,
    phase_id,
    status: "blocked",
    primary_ref: null,
    source_status: "malformed",
    summary: `${stageLabels[stage_id]} is malformed or unsafe.`,
    blocker_reasons: blockerReasons,
  });
}

function inputAuthorityProblems(
  input: WorkbenchSpineConsolidationInput,
): string[] {
  return uniqueStrings([
    ...authorityProblems(
      "applied_current_working_perspective",
      input.applied_current_working_perspective_read,
    ),
    ...authorityProblems(
      "current_working_perspective_route_integration",
      input.current_working_perspective_route_integration_read,
    ),
    ...authorityProblems(
      "applied_handoff_context",
      input.applied_handoff_context_read,
    ),
    ...authorityProblems(
      "exported_handoff_packet_artifact",
      input.exported_handoff_packet_artifact_read,
    ),
    ...authorityProblems(
      "handoff_send_contract_record",
      input.handoff_send_contract_record_review,
    ),
    ...authorityProblems(
      "local_handoff_send_fulfillment",
      input.handoff_send_record_review,
    ),
    ...authorityProblems(
      "local_handoff_send_fulfillment",
      input.sent_handoff_read,
    ),
  ]);
}

function authorityProblems(label: string, value: unknown): string[] {
  const record = recordOrNull(value);
  if (!record) return [];
  const authority = recordField(record, "authority_boundary");
  if (!authority) return [`${label}:authority_boundary_missing`];
  return forbiddenAuthorityTrueFields
    .filter((field) => authority[field] === true)
    .map((field) => `${label}:authority_boundary_forbidden_true:${field}`);
}

function inputMalformedProblems(
  input: WorkbenchSpineConsolidationInput,
): string[] {
  return uniqueStrings([
    ...malformedProblem(
      input.applied_current_working_perspective_read,
      "read_version",
      "applied_current_working_perspective_read.v0.1",
      "applied_current_working_perspective_read_malformed",
    ),
    ...malformedProblem(
      input.applied_handoff_context_read,
      "read_version",
      "applied_handoff_context_read.v0.1",
      "applied_handoff_context_read_malformed",
    ),
    ...malformedProblem(
      input.exported_handoff_packet_artifact_read,
      "read_version",
      "exported_handoff_packet_artifact_read.v0.1",
      "exported_handoff_packet_artifact_read_malformed",
    ),
    ...malformedProblem(
      input.sent_handoff_read,
      "read_version",
      "sent_handoff_read.v0.1",
      "sent_handoff_read_malformed",
    ),
  ]);
}

function malformedProblem(
  value: unknown,
  key: string,
  expected: string,
  reason: string,
): string[] {
  if (value === undefined || value === null) return [];
  const record = recordOrNull(value);
  return record && record[key] === expected ? [] : [reason];
}

function firstBlockedStage(
  stages: WorkbenchSpineStageSummary[],
): WorkbenchSpineStageId | null {
  return stages.find(
    (stage) =>
      stage.status === "blocked" ||
      stage.blocker_reasons.length > 0 ||
      stage.authority_warnings.length > 0,
  )?.stage_id ?? null;
}

function phaseStatus(stages: WorkbenchSpineStageSummary[]): WorkbenchSpineStageStatus {
  if (stages.some((stage) => stage.status === "blocked")) return "blocked";
  if (stages.every((stage) => stage.status === "fulfilled")) return "fulfilled";
  if (stages.some((stage) => stage.status === "fulfilled")) return "fulfilled";
  if (stages.some((stage) => stage.status === "exported")) return "exported";
  if (stages.some((stage) => stage.status === "approved")) return "approved";
  if (stages.some((stage) => stage.status === "applied")) return "applied";
  if (stages.some((stage) => stage.status === "available")) return "available";
  if (stages.some((stage) => stage.status === "insufficient_data")) {
    return "insufficient_data";
  }
  if (stages.every((stage) => stage.status === "not_configured")) {
    return "not_configured";
  }
  return "missing";
}

function stageStatus(
  stages: WorkbenchSpineStageSummary[],
  stageId: WorkbenchSpineStageId,
): WorkbenchSpineStageStatus {
  return stages.find((stage) => stage.stage_id === stageId)?.status ?? "missing";
}

function stageRef(
  stages: WorkbenchSpineStageSummary[],
  stageId: WorkbenchSpineStageId,
): string | null {
  return stages.find((stage) => stage.stage_id === stageId)?.primary_ref ?? null;
}

function recordOrNull(value: unknown): RecordValue | null {
  return isRecord(value) ? value : null;
}

function recordField(value: unknown, key: string): RecordValue | null {
  return isRecord(value) && isRecord(value[key]) ? value[key] : null;
}

function stringField(value: unknown, key: string): string | null {
  return isRecord(value) && typeof value[key] === "string"
    ? value[key]
    : null;
}

function numberField(value: unknown, key: string): number {
  return isRecord(value) && typeof value[key] === "number" ? value[key] : 0;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function uniqueStrings(values: unknown[]): string[] {
  return Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === "string")
        .filter(Boolean),
    ),
  ).sort();
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isRecord(value: unknown): value is RecordValue {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
