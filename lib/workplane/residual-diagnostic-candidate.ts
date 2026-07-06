import {
  RESIDUAL_DIAGNOSTIC_CANDIDATE_VERSION,
  type ResidualDiagnosticAuthorityBoundary,
  type ResidualDiagnosticCandidate,
  type ResidualDiagnosticCandidateCategory,
  type ResidualDiagnosticCandidateInput,
  type ResidualDiagnosticCandidateReadModel,
  type ResidualDiagnosticCandidateStatus,
  type ResidualDiagnosticConfidence,
  type ResidualDiagnosticObservedSignal,
  type ResidualDiagnosticSeverity,
} from "@/types/residual-diagnostic-candidate";
import type { WorkbenchSpineStageId } from "@/types/workbench-spine-consolidation";

type RecordValue = Record<string, unknown>;

const DEFAULT_SCOPE = "project:augnes" as const;
const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z" as const;

const forbiddenAuthorityTrueFields = [
  "source_of_truth",
  "can_write_db",
  "can_create_schema",
  "can_create_route",
  "can_call_route",
  "can_write_residual_diagnostic_record",
  "can_promote_diagnostic_candidate",
  "can_mutate_current_working_perspective",
  "can_mutate_handoff_context",
  "can_write_selected_refs_to_live_handoff",
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

export function createResidualDiagnosticCandidateAuthorityBoundaryV01():
  ResidualDiagnosticAuthorityBoundary {
  return {
    read_only: true,
    advisory_only: true,
    candidate_layer_only: true,
    derived_read_model: true,
    source_of_truth: false,
    can_write_db: false,
    can_create_schema: false,
    can_create_route: false,
    can_call_route: false,
    can_write_residual_diagnostic_record: false,
    can_promote_diagnostic_candidate: false,
    can_mutate_current_working_perspective: false,
    can_mutate_handoff_context: false,
    can_write_selected_refs_to_live_handoff: false,
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
      "Residual diagnostics are derived candidates from already-read local Workbench material.",
      "The layer cannot write records, create schema, call routes, send externally, call providers, mutate CWP/handoff/memory/metrics, or render action buttons.",
    ],
  };
}

export function buildResidualDiagnosticCandidateReadModelV01(
  input: ResidualDiagnosticCandidateInput = {},
): ResidualDiagnosticCandidateReadModel {
  const spine = recordOrNull(input.workbench_spine_consolidation);
  const dogfood = recordOrNull(input.workbench_dogfood_loop_spine_overview);
  const routeRead = recordOrNull(
    input.current_working_perspective_route_integration_read,
  );
  const sourceRefs = uniqueStrings([
    ...(input.source_refs ?? []),
    ...stringArray(spine?.source_refs),
    ...stringArray(dogfood?.source_refs),
  ]);
  const asOf =
    input.as_of ??
    stringField(spine, "as_of") ??
    stringField(dogfood, "as_of") ??
    FALLBACK_AS_OF;

  const ordinaryMissing = ordinaryMissingPrerequisites(spine, dogfood);
  const lineageSignals = lineageMaterializedSignals(spine);
  const routeSignals = routeIntegrationSignals(spine, dogfood, routeRead);
  const localFulfillmentSignals = localFulfillmentUpstreamGapSignals(spine);
  const externalDeliverySignals = externalDeliveryBoundarySignals(spine);
  const authoritySignals = authorityBoundarySignals(input);
  const expectedObservedSignals = expectedObservedMismatchSignals(
    input.expected_observed_delta_record_review,
    input.dogfood_metric_snapshot_record_review,
  );
  const reuseSignals = reuseOutcomeGapSignals(
    input.reuse_outcome_bridge_ledger_record_review,
  );
  const validationDriftSignals = reviewWriterValidationDriftSignals(input);
  const noSideEffectSignals = noSideEffectsReplaySignals(input);
  const iaSignals = workbenchIaOverloadSignals(spine, dogfood);

  const materializedInconsistencies = uniqueStrings([
    ...lineageSignals,
    ...localFulfillmentSignals,
    ...authoritySignals,
    ...expectedObservedSignals.filter((signal) => signal.includes("mismatch")),
    ...reuseSignals.filter((signal) => !signal.includes("ordinary_missing")),
    ...validationDriftSignals,
    ...noSideEffectSignals,
  ]);

  const candidates = compactCandidates([
    sourceRefLineageCandidate(lineageSignals, spine),
    routeIntegrationModeCandidate(routeSignals, spine, dogfood, routeRead),
    localFulfillmentUpstreamGapCandidate(localFulfillmentSignals, spine),
    externalDeliveryBoundaryPressureCandidate(externalDeliverySignals, spine),
    authorityBoundaryDriftCandidate(authoritySignals, input),
    expectedObservedMismatchCandidate(expectedObservedSignals, input),
    reuseOutcomeGapCandidate(reuseSignals, input),
    reviewWriterValidationDriftCandidate(validationDriftSignals, input),
    noSideEffectsReplayInconsistencyCandidate(noSideEffectSignals, input),
    workbenchIaOverloadCandidate(iaSignals, spine, dogfood),
  ]);

  const insufficientData = insufficientDataReasons({
    candidates,
    ordinaryMissing,
    spine,
    dogfood,
    routeRead,
  });
  const summary = {
    candidate_count: candidates.length,
    actionable_candidate_count: candidates.filter(
      (candidate) => candidate.status === "actionable_candidate",
    ).length,
    blocked_candidate_count: candidates.filter(
      (candidate) => candidate.status === "blocked",
    ).length,
    insufficient_data_candidate_count: candidates.filter(
      (candidate) => candidate.status === "insufficient_data",
    ).length,
    repeated_pattern_count: candidates.filter(
      (candidate) => candidate.repeated_evidence_count >= 2,
    ).length,
    materialized_inconsistency_count: materializedInconsistencies.length,
    ordinary_missing_count: ordinaryMissing.length,
    recommended_next_hardening_target:
      recommendedNextHardeningTarget(candidates),
  };

  return {
    diagnostic_version: RESIDUAL_DIAGNOSTIC_CANDIDATE_VERSION,
    scope: DEFAULT_SCOPE,
    as_of: asOf,
    dashboard_status: dashboardStatus(candidates, insufficientData),
    source_refs: sourceRefs,
    candidate_summary: summary,
    residual_candidates: candidates,
    insufficient_data: insufficientData,
    ordinary_missing_prerequisites: ordinaryMissing,
    materialized_inconsistencies: materializedInconsistencies,
    authority_boundary: createResidualDiagnosticCandidateAuthorityBoundaryV01(),
    would_not_do: [
      "does_not_write_residual_diagnostic_records",
      "does_not_create_schema_or_route",
      "does_not_send_handoff_or_enable_external_delivery",
      "does_not_call_provider_email_slack_webhook_github_codex_openai_browser_crawler_or_network",
      "does_not_write_clipboard_download_or_arbitrary_file",
      "does_not_mutate_cwp_handoff_memory_relay_metrics_or_global_state",
      "does_not_render_workbench_action_button",
    ],
    non_goals: [
      "external_handoff_delivery_contract",
      "provider_specific_delivery",
      "residual_diagnostic_durable_write_store",
      "global_memory_or_perspective_promotion",
      "graph_vector_rag_crawler_browser_observer",
      "autonomy_runner_scheduler_daemon_or_multi_agent_execution",
    ],
  };
}

function sourceRefLineageCandidate(
  signals: string[],
  spine: RecordValue | null,
): ResidualDiagnosticCandidate | null {
  if (signals.length === 0) return null;
  return candidate({
    category: "source_ref_lineage_mismatch",
    label: "Source-ref lineage mismatch",
    status: "actionable_candidate",
    severity: "high",
    confidence: signals.length >= 2 ? "high" : "medium",
    patternKey: "source_ref_lineage_mismatch",
    summary:
      "Materialized upstream and downstream spine refs do not line up, or downstream material exists without its upstream source ref.",
    signals: signals.map((signal, index) =>
      observedSignal({
        id: `lineage:${index + 1}`,
        category: "source_ref_lineage_mismatch",
        source: "workbench_spine_consolidation.lineage_map",
        summary: signal,
        materialized: true,
        evidenceRef: signal,
      }),
    ),
    sourceRefs: stringArray(spine?.source_refs),
    evidenceRefs: signals,
    materializedInconsistencies: signals,
    falseLeapContrast:
      "Do not treat both-sides-missing refs as blockers; only materialized mismatches or downstream-without-upstream refs become residual candidates.",
    minimumVerification: [
      "Add or keep a smoke case where both-sides-missing lineage remains non-blocking.",
      "Add or keep a smoke case where materialized upstream/downstream refs mismatch and the dashboard blocks.",
    ],
    suggestedTarget: "harden_source_ref_lineage_mismatch_smokes",
    whyNow: [
      "The Workbench spine now exposes lineage edges across CWP, handoff context, packet artifact, send contract, and local fulfillment.",
      "A materialized mismatch can mislead the next operator action.",
    ],
  });
}

function routeIntegrationModeCandidate(
  signals: string[],
  spine: RecordValue | null,
  dogfood: RecordValue | null,
  routeRead: RecordValue | null,
): ResidualDiagnosticCandidate | null {
  if (signals.length === 0) return null;
  const repeated = signals.length;
  return candidate({
    category: "route_integration_mode_mismatch",
    label: "Route integration mode mismatch",
    status: repeated >= 2 ? "actionable_candidate" : "insufficient_data",
    severity: repeated >= 2 ? "high" : "medium",
    confidence: repeated >= 2 ? "high" : "medium",
    patternKey: "route_integration_mode_mismatch",
    summary:
      "Runtime-only CWP material is visible where route-integrated CWP progress might otherwise be inferred.",
    signals: signals.map((signal, index) =>
      observedSignal({
        id: `route-integration:${index + 1}`,
        category: "route_integration_mode_mismatch",
        source: "route_integration_read",
        summary: signal,
        ordinaryMissing: signal.includes("runtime_only"),
        evidenceRef: stringField(routeRead, "status") ?? signal,
      }),
    ),
    sourceRefs: uniqueStrings([
      ...stringArray(spine?.source_refs),
      ...stringArray(dogfood?.source_refs),
      ...stringArray(routeRead?.source_refs),
    ]),
    evidenceRefs: uniqueStrings([stringField(routeRead, "status"), ...signals]),
    ordinaryMissing: signals,
    falseLeapContrast:
      "Runtime fallback is diagnostic material, not route integration progress.",
    minimumVerification: [
      "Add or keep a smoke case where runtime_only route read is insufficient_data with material_count 0.",
      "Verify the next operator action does not advance to external delivery preparation from runtime_only route material.",
    ],
    suggestedTarget: "harden_route_integration_runtime_only_classification",
    whyNow: [
      "Workbench now depends on route integration status before handoff context and packet lineage.",
      "Counting runtime fallback as progress can hide missing route integration prerequisites.",
    ],
  });
}

function localFulfillmentUpstreamGapCandidate(
  signals: string[],
  spine: RecordValue | null,
): ResidualDiagnosticCandidate | null {
  if (signals.length === 0) return null;
  return candidate({
    category: "local_fulfillment_upstream_gap",
    label: "Local fulfillment upstream gap",
    status: "actionable_candidate",
    severity: "high",
    confidence: signals.length >= 2 ? "high" : "medium",
    patternKey: "local_fulfillment_upstream_gap",
    summary:
      "A local send fulfillment exists while at least one required pre-external spine stage is missing, blocked, or inconsistent.",
    signals: signals.map((signal, index) =>
      observedSignal({
        id: `local-fulfillment-gap:${index + 1}`,
        category: "local_fulfillment_upstream_gap",
        source: "workbench_spine_consolidation.stage_summaries",
        summary: signal,
        materialized: true,
        evidenceRef: signal,
      }),
    ),
    sourceRefs: stringArray(spine?.source_refs),
    evidenceRefs: signals,
    materializedInconsistencies: signals,
    falseLeapContrast:
      "A local send fulfillment record does not prove the full local CWP to handoff packet spine is complete.",
    minimumVerification: [
      "Add or keep a smoke case where local_fulfillment_available requires all pre-external stages.",
      "Verify local fulfillment with missing upstream material reports blocked or insufficient_data instead of success.",
    ],
    suggestedTarget: "harden_local_fulfillment_upstream_prerequisite_gate",
    whyNow: [
      "The local handoff send slice can produce fulfillment records independently of external delivery.",
      "Operators need the dashboard to prevent a false completion leap.",
    ],
  });
}

function externalDeliveryBoundaryPressureCandidate(
  signals: string[],
  spine: RecordValue | null,
): ResidualDiagnosticCandidate | null {
  if (signals.length === 0) return null;
  return candidate({
    category: "external_delivery_boundary_pressure",
    label: "External delivery boundary pressure",
    status: "candidate",
    severity: "medium",
    confidence: "high",
    patternKey: "external_delivery_boundary_pressure",
    summary:
      "Local fulfillment or send wording is present while external delivery remains intentionally unconfigured.",
    signals: signals.map((signal, index) =>
      observedSignal({
        id: `external-boundary:${index + 1}`,
        category: "external_delivery_boundary_pressure",
        source: "workbench_spine_consolidation.external_delivery",
        summary: signal,
        evidenceRef: signal,
      }),
    ),
    sourceRefs: stringArray(spine?.source_refs),
    evidenceRefs: signals,
    falseLeapContrast:
      "Local send fulfillment is not provider delivery, email, Slack, webhook, or external message delivery.",
    minimumVerification: [
      "Verify external_delivery.status remains not_configured when local fulfillment exists.",
      "Verify provider_called and external_message_sent remain false.",
    ],
    suggestedTarget: "preserve_external_delivery_boundary_in_workbench_copy",
    whyNow: [
      "The local fulfillment slice intentionally uses send terminology without granting provider authority.",
      "The next hardening target should preserve the boundary before any future delivery contract.",
    ],
  });
}

function authorityBoundaryDriftCandidate(
  signals: string[],
  input: ResidualDiagnosticCandidateInput,
): ResidualDiagnosticCandidate | null {
  if (signals.length === 0) return null;
  return candidate({
    category: "authority_boundary_drift",
    label: "Authority boundary drift",
    status: "actionable_candidate",
    severity: "high",
    confidence: signals.length >= 2 ? "high" : "medium",
    patternKey: "authority_boundary_drift",
    summary:
      "One or more read-model inputs surfaced forbidden write, send, provider, memory, metric, graph, crawler, or action-button authority.",
    signals: signals.map((signal, index) =>
      observedSignal({
        id: `authority:${index + 1}`,
        category: "authority_boundary_drift",
        source: "input.authority_boundary",
        summary: signal,
        materialized: true,
        evidenceRef: signal,
      }),
    ),
    sourceRefs: uniqueStrings([
      ...stringArray(recordOrNull(input.workbench_spine_consolidation)?.source_refs),
      ...stringArray(
        recordOrNull(input.workbench_dogfood_loop_spine_overview)?.source_refs,
      ),
    ]),
    evidenceRefs: signals,
    materializedInconsistencies: signals,
    falseLeapContrast:
      "A diagnostic candidate read model may surface unsafe authority claims, but it must not inherit or exercise that authority.",
    minimumVerification: [
      "Add or keep a smoke case with a forbidden true authority flag.",
      "Verify the residual model authority boundary remains read-only and advisory-only.",
    ],
    suggestedTarget: "harden_authority_boundary_drift_regressions",
    whyNow: [
      "The Workbench now aggregates many upstream read models with their own authority boundaries.",
      "A forged upstream flag should become diagnostic signal, not product authority.",
    ],
  });
}

function expectedObservedMismatchCandidate(
  signals: string[],
  input: ResidualDiagnosticCandidateInput,
): ResidualDiagnosticCandidate | null {
  if (signals.length === 0) return null;
  return candidate({
    category: "expected_observed_mismatch",
    label: "Expected/observed mismatch",
    status: signals.length >= 2 ? "actionable_candidate" : "candidate",
    severity: signals.length >= 2 ? "high" : "medium",
    confidence: signals.length >= 2 ? "high" : "medium",
    patternKey: "expected_observed_mismatch",
    summary:
      "Dogfood review material contains missing expectations, unexpected observations, or review-burden signals.",
    signals: signals.map((signal, index) =>
      observedSignal({
        id: `expected-observed:${index + 1}`,
        category: "expected_observed_mismatch",
        source: "expected_observed_or_metric_review",
        summary: signal,
        materialized: signal.includes("mismatch") || signal.includes("unexpected"),
        evidenceRef: signal,
      }),
    ),
    sourceRefs: reviewSourceRefs(input.expected_observed_delta_record_review),
    evidenceRefs: signals,
    materializedInconsistencies: signals.filter(
      (signal) => signal.includes("mismatch") || signal.includes("unexpected"),
    ),
    falseLeapContrast:
      "Do not promote review-burden signals into metrics or memory; keep them as review candidates until a writer slice is explicitly approved.",
    minimumVerification: [
      "Verify mismatched expected/observed counts remain review-only diagnostic signals.",
      "Verify the read model does not write ExpectedObservedDelta, dogfood metrics, or memory.",
    ],
    suggestedTarget: "harden_expected_observed_delta_review_burden",
    whyNow: [
      "The dogfood loop now exposes expected/observed review material near the handoff spine.",
      "Repeated mismatch counts can guide the next smoke or validation target.",
    ],
  });
}

function reuseOutcomeGapCandidate(
  signals: string[],
  input: ResidualDiagnosticCandidateInput,
): ResidualDiagnosticCandidate | null {
  if (signals.length === 0) return null;
  return candidate({
    category: "reuse_outcome_gap",
    label: "Reuse outcome gap",
    status: signals.some((signal) => signal.includes("misleading"))
      ? "actionable_candidate"
      : "candidate",
    severity: signals.some((signal) => signal.includes("misleading"))
      ? "high"
      : "medium",
    confidence: signals.length >= 2 ? "high" : "medium",
    patternKey: "reuse_outcome_gap",
    summary:
      "Reuse outcome review material contains stale, missing, noisy, misleading, or unknown context signals.",
    signals: signals.map((signal, index) =>
      observedSignal({
        id: `reuse-outcome:${index + 1}`,
        category: "reuse_outcome_gap",
        source: "reuse_outcome_bridge_ledger_record_review",
        summary: signal,
        materialized: !signal.includes("ordinary_missing"),
        evidenceRef: signal,
      }),
    ),
    sourceRefs: reviewSourceRefs(input.reuse_outcome_bridge_ledger_record_review),
    evidenceRefs: signals,
    materializedInconsistencies: signals.filter(
      (signal) => !signal.includes("ordinary_missing"),
    ),
    ordinaryMissing: signals.filter((signal) => signal.includes("missing")),
    falseLeapContrast:
      "A missing reuse signal is not automatically a bottleneck; stale or misleading reuse evidence is a stronger diagnostic target.",
    minimumVerification: [
      "Verify missing reuse refs remain visible without becoming durable memory updates.",
      "Verify misleading or stale reuse counts surface as candidate evidence.",
    ],
    suggestedTarget: "harden_reuse_outcome_gap_review",
    whyNow: [
      "Local dogfood outcomes can now be compared with handoff and Workbench residuals.",
      "Reusable context should not be promoted from noisy or misleading signals.",
    ],
  });
}

function reviewWriterValidationDriftCandidate(
  signals: string[],
  input: ResidualDiagnosticCandidateInput,
): ResidualDiagnosticCandidate | null {
  if (signals.length === 0) return null;
  return candidate({
    category: "review_writer_validation_drift",
    label: "Review/writer validation drift",
    status: "actionable_candidate",
    severity: "high",
    confidence: signals.length >= 2 ? "high" : "medium",
    patternKey: "review_writer_validation_drift",
    summary:
      "One or more record reviews report invalid records, selected-record drift, malformed material, or blocked review state.",
    signals: signals.map((signal, index) =>
      observedSignal({
        id: `review-drift:${index + 1}`,
        category: "review_writer_validation_drift",
        source: "record_review",
        summary: signal,
        materialized: true,
        evidenceRef: signal,
      }),
    ),
    sourceRefs: uniqueStrings([
      ...reviewSourceRefs(input.expected_observed_delta_record_review),
      ...reviewSourceRefs(input.reuse_outcome_bridge_ledger_record_review),
      ...reviewSourceRefs(input.dogfood_metric_snapshot_record_review),
      ...decisionReviewSourceRefs(input),
    ]),
    evidenceRefs: signals,
    materializedInconsistencies: signals,
    falseLeapContrast:
      "Review drift should guide the next hardening smoke, not bypass operator approval or writer validation.",
    minimumVerification: [
      "Add or keep a smoke where records_invalid remains blocked.",
      "Verify selected_record_missing is surfaced as diagnostic drift, not write readiness.",
    ],
    suggestedTarget: "harden_review_writer_validation_drift",
    whyNow: [
      "The Workbench now reads many local stores through review helpers.",
      "Repeated review invalidity increases future review burden.",
    ],
  });
}

function noSideEffectsReplayInconsistencyCandidate(
  signals: string[],
  input: ResidualDiagnosticCandidateInput,
): ResidualDiagnosticCandidate | null {
  if (signals.length === 0) return null;
  return candidate({
    category: "no_side_effects_replay_inconsistency",
    label: "No-side-effects replay inconsistency",
    status: "actionable_candidate",
    severity: "high",
    confidence: signals.length >= 2 ? "high" : "medium",
    patternKey: "no_side_effects_replay_inconsistency",
    summary:
      "Receipt or review evidence suggests forbidden side effects, corrupt receipts, or replay claims need hardening.",
    signals: signals.map((signal, index) =>
      observedSignal({
        id: `no-side-effects:${index + 1}`,
        category: "no_side_effects_replay_inconsistency",
        source: "record_review.evidence_summary",
        summary: signal,
        materialized: true,
        evidenceRef: signal,
      }),
    ),
    sourceRefs: uniqueStrings([
      ...reviewSourceRefs(input.expected_observed_delta_record_review),
      ...reviewSourceRefs(input.reuse_outcome_bridge_ledger_record_review),
      ...reviewSourceRefs(input.dogfood_metric_snapshot_record_review),
      ...decisionReviewSourceRefs(input),
    ]),
    evidenceRefs: signals,
    materializedInconsistencies: signals,
    falseLeapContrast:
      "Receipt anomalies are diagnostic evidence only; they do not authorize replay, repair, or write behavior.",
    minimumVerification: [
      "Verify corrupt no-side-effect claims remain records_invalid or blocked.",
      "Verify idempotent replay does not claim a fresh write in receipt summaries.",
    ],
    suggestedTarget: "harden_no_side_effects_replay_smokes",
    whyNow: [
      "Recent local write slices rely on receipt integrity to preserve authority boundaries.",
      "A receipt side-effect problem is stronger than ordinary missing material.",
    ],
  });
}

function workbenchIaOverloadCandidate(
  signals: string[],
  spine: RecordValue | null,
  dogfood: RecordValue | null,
): ResidualDiagnosticCandidate | null {
  if (signals.length === 0) return null;
  return candidate({
    category: "workbench_ia_overload",
    label: "Workbench IA overload",
    status: "candidate",
    severity: "low",
    confidence: "medium",
    patternKey: "workbench_ia_overload",
    summary:
      "Workbench has many adjacent spine stages and dogfood steps; the consolidation dashboard mitigates part of the scanning burden.",
    signals: signals.map((signal, index) =>
      observedSignal({
        id: `workbench-ia:${index + 1}`,
        category: "workbench_ia_overload",
        source: "workbench_dashboard_summary",
        summary: signal,
        evidenceRef: signal,
      }),
    ),
    sourceRefs: uniqueStrings([
      ...stringArray(spine?.source_refs),
      ...stringArray(dogfood?.source_refs),
    ]),
    evidenceRefs: signals,
    falseLeapContrast:
      "More panels are not themselves a diagnostic blocker; blocker-first grouping and next-action clarity are the hardening target.",
    minimumVerification: [
      "Verify the dashboard surfaces candidate summary and next hardening target before detailed lists.",
      "Verify the panel remains display-only with no action controls.",
    ],
    suggestedTarget: "harden_workbench_blocker_first_information_architecture",
    whyNow: [
      "The local continuity and handoff spine now spans many panels.",
      "The operator needs residual patterns, not another ungrouped context dump.",
    ],
  });
}

function ordinaryMissingPrerequisites(
  spine: RecordValue | null,
  dogfood: RecordValue | null,
): string[] {
  return uniqueStrings([
    ...stringArray(recordField(spine, "blocker_summary")?.missing_prerequisites),
    ...stringArray(dogfood?.current_material_gaps),
  ]).filter(
    (value) =>
      !value.includes("lineage_mismatch") &&
      !value.includes("downstream_without_upstream") &&
      !value.includes("authority_boundary_forbidden_true"),
  );
}

function lineageMaterializedSignals(spine: RecordValue | null): string[] {
  const lineage = recordField(spine, "lineage_map");
  const edges = arrayOfRecords(lineage?.edges);
  const stageMaterial = stageMaterialMap(spine);
  return uniqueStrings([
    ...stringArray(recordField(spine, "blocker_summary")?.blockers).filter(
      (blocker) =>
        blocker.startsWith("lineage_mismatch:") ||
        blocker.startsWith("lineage_downstream_without_upstream:") ||
        blocker.startsWith("lineage_missing_downstream_source_ref:"),
    ),
    ...edges.flatMap((edge) => materializedLineageProblems(edge, stageMaterial)),
  ]);
}

function materializedLineageProblems(
  edge: RecordValue,
  stageMaterial: Map<string, boolean>,
): string[] {
  const from = stringField(edge, "from");
  const to = stringField(edge, "to");
  const problem = stringField(edge, "problem");
  if (!from || !to || !problem || problem === "external_delivery_contract_not_configured") {
    return [];
  }
  const expected = stringField(edge, "expected_ref");
  const observed = stringField(edge, "observed_ref");
  const downstreamHasMaterial = stageMaterial.get(to) === true;
  if (expected && observed && expected !== observed) {
    return [`lineage_mismatch:${problem}`];
  }
  if (!expected && observed) {
    return [`lineage_downstream_without_upstream:${problem}`];
  }
  if (expected && !observed && downstreamHasMaterial) {
    return [`lineage_missing_downstream_source_ref:${problem}`];
  }
  return [];
}

function routeIntegrationSignals(
  spine: RecordValue | null,
  dogfood: RecordValue | null,
  routeRead: RecordValue | null,
): string[] {
  const routeStage = stageById(
    spine,
    "current_working_perspective_route_integration",
  );
  const status = stringField(routeRead, "status") ?? stringField(routeStage, "source_status");
  return uniqueStrings([
    ...(status === "runtime_only"
      ? ["route_integration_read_runtime_only"]
      : []),
    ...stringArray(routeStage?.missing_prerequisites).filter((reason) =>
      reason.includes("route_integration"),
    ),
    ...stringArray(dogfood?.current_material_gaps).filter((gap) =>
      gap.includes("route_integration_read_runtime_only"),
    ),
  ]);
}

function localFulfillmentUpstreamGapSignals(spine: RecordValue | null): string[] {
  const localFulfillment = stageById(spine, "local_handoff_send_fulfillment");
  if (stringField(localFulfillment, "status") !== "fulfilled") return [];
  const dashboardStatus = stringField(spine, "dashboard_status");
  const requiredStages: WorkbenchSpineStageId[] = [
    "applied_current_working_perspective",
    "current_working_perspective_route_integration",
    "applied_handoff_context",
    "exported_handoff_packet_artifact",
    "handoff_send_contract_record",
  ];
  const unsatisfied = requiredStages.flatMap((stageId) => {
    const stage = stageById(spine, stageId);
    const status = stringField(stage, "status");
    return stageSatisfied(stageId, status)
      ? []
      : [`local_fulfillment_upstream_stage_unsatisfied:${stageId}:${status ?? "missing"}`];
  });
  return uniqueStrings([
    ...(dashboardStatus && dashboardStatus !== "local_fulfillment_available"
      ? [`local_fulfillment_present_dashboard_status:${dashboardStatus}`]
      : []),
    ...unsatisfied,
  ]);
}

function externalDeliveryBoundarySignals(spine: RecordValue | null): string[] {
  const externalDelivery = recordField(spine, "external_delivery");
  const localFulfillment = stageById(spine, "local_handoff_send_fulfillment");
  const localFulfilled = stringField(localFulfillment, "status") === "fulfilled";
  const status = stringField(externalDelivery, "status");
  const providerCalled = externalDelivery?.provider_called === true;
  const externalMessageSent = externalDelivery?.external_message_sent === true;
  const localIsExternal =
    externalDelivery?.local_fulfillment_is_external_delivery === true;
  return uniqueStrings([
    ...(localFulfilled && status === "not_configured"
      ? ["local_fulfillment_external_delivery_not_configured"]
      : []),
    ...(providerCalled ? ["external_delivery_provider_called_true"] : []),
    ...(externalMessageSent ? ["external_delivery_message_sent_true"] : []),
    ...(localIsExternal
      ? ["external_delivery_local_fulfillment_marked_as_external"]
      : []),
  ]);
}

function authorityBoundarySignals(
  input: ResidualDiagnosticCandidateInput,
): string[] {
  return uniqueStrings([
    ...authorityProblems(
      "workbench_spine_consolidation",
      input.workbench_spine_consolidation,
    ),
    ...authorityProblems(
      "workbench_dogfood_loop_spine_overview",
      input.workbench_dogfood_loop_spine_overview,
    ),
    ...authorityProblems(
      "current_working_perspective_route_integration_read",
      input.current_working_perspective_route_integration_read,
    ),
    ...authorityProblems(
      "current_working_perspective_route_integration_read_review",
      input.current_working_perspective_route_integration_read_review,
    ),
    ...authorityProblems(
      "expected_observed_delta_record_review",
      input.expected_observed_delta_record_review,
    ),
    ...authorityProblems(
      "reuse_outcome_bridge_ledger_record_review",
      input.reuse_outcome_bridge_ledger_record_review,
    ),
    ...authorityProblems(
      "dogfood_metric_snapshot_record_review",
      input.dogfood_metric_snapshot_record_review,
    ),
    ...authorityProblems(
      "work_episode_residue_candidate_preview",
      input.work_episode_residue_candidate_preview,
    ),
    ...authorityProblems(
      "next_work_signal_decision_record_review",
      input.next_work_signal_decision_record_review,
    ),
    ...authorityProblems(
      "perspective_relay_update_decision_record_review",
      input.perspective_relay_update_decision_record_review,
    ),
    ...stringArray(
      recordField(recordOrNull(input.workbench_spine_consolidation), "blocker_summary")
        ?.authority_warnings,
    ),
  ]);
}

function expectedObservedMismatchSignals(
  expectedObservedReview: unknown,
  metricReview: unknown,
): string[] {
  const review = recordOrNull(expectedObservedReview);
  const metric = recordOrNull(metricReview);
  const material = recordField(review, "record_material_summary");
  const metricMaterial = recordField(metric, "record_material_summary");
  return uniqueStrings([
    ...numberSignal(
      material,
      "missing_expectation_count",
      "expected_observed_missing_expectations",
    ),
    ...numberSignal(
      material,
      "unexpected_observation_count",
      "expected_observed_unexpected_observations",
    ),
    ...numberSignal(
      material,
      "skipped_or_unverified_check_count",
      "expected_observed_skipped_or_unverified_checks",
    ),
    ...numberSignal(
      metricMaterial,
      "expected_observed_mismatch_count",
      "dogfood_metric_expected_observed_mismatch",
    ),
    ...numberSignal(
      metricMaterial,
      "review_burden_signal_count",
      "dogfood_metric_review_burden",
    ),
  ]);
}

function reuseOutcomeGapSignals(value: unknown): string[] {
  const review = recordOrNull(value);
  const counts = recordField(review, "aggregate_counts");
  return uniqueStrings([
    ...numberSignal(counts, "stale_ref_count", "reuse_outcome_stale_refs"),
    ...numberSignal(counts, "missing_ref_count", "reuse_outcome_ordinary_missing_refs"),
    ...numberSignal(counts, "noisy_ref_count", "reuse_outcome_noisy_refs"),
    ...numberSignal(counts, "misleading_ref_count", "reuse_outcome_misleading_refs"),
    ...numberSignal(counts, "unknown_ref_count", "reuse_outcome_unknown_refs"),
    ...numberSignal(
      counts,
      "expected_observed_mismatch_count",
      "reuse_outcome_expected_observed_mismatch",
    ),
  ]);
}

function reviewWriterValidationDriftSignals(
  input: ResidualDiagnosticCandidateInput,
): string[] {
  return uniqueStrings([
    ...reviewDrift("expected_observed_delta", input.expected_observed_delta_record_review),
    ...reviewDrift("reuse_outcome", input.reuse_outcome_bridge_ledger_record_review),
    ...reviewDrift("dogfood_metric_snapshot", input.dogfood_metric_snapshot_record_review),
    ...reviewDrift("next_work_signal", input.next_work_signal_decision_record_review),
    ...reviewDrift(
      "perspective_relay_update",
      input.perspective_relay_update_decision_record_review,
    ),
  ]);
}

function noSideEffectsReplaySignals(
  input: ResidualDiagnosticCandidateInput,
): string[] {
  return uniqueStrings([
    ...receiptProblems(
      "expected_observed_delta",
      input.expected_observed_delta_record_review,
    ),
    ...receiptProblems("reuse_outcome", input.reuse_outcome_bridge_ledger_record_review),
    ...receiptProblems(
      "dogfood_metric_snapshot",
      input.dogfood_metric_snapshot_record_review,
    ),
    ...receiptProblems(
      "next_work_signal",
      input.next_work_signal_decision_record_review,
    ),
    ...receiptProblems(
      "perspective_relay_update",
      input.perspective_relay_update_decision_record_review,
    ),
  ]);
}

function workbenchIaOverloadSignals(
  spine: RecordValue | null,
  dogfood: RecordValue | null,
): string[] {
  const stageCount = numberField(recordField(spine, "compact_summary"), "stage_count");
  const stepCount = numberField(recordField(dogfood, "spine_summary"), "step_count");
  return uniqueStrings([
    ...(stageCount >= 6 ? [`workbench_spine_stage_count:${stageCount}`] : []),
    ...(stepCount >= 30 ? [`dogfood_spine_step_count:${stepCount}`] : []),
  ]);
}

function insufficientDataReasons({
  candidates,
  ordinaryMissing,
  spine,
  dogfood,
  routeRead,
}: {
  candidates: ResidualDiagnosticCandidate[];
  ordinaryMissing: string[];
  spine: RecordValue | null;
  dogfood: RecordValue | null;
  routeRead: RecordValue | null;
}): string[] {
  if (!spine && !dogfood && !routeRead) {
    return ["workbench_residual_source_material_missing"];
  }
  return uniqueStrings([
    ...ordinaryMissing,
    ...candidates
      .filter((candidate) => candidate.status === "insufficient_data")
      .map((candidate) => `${candidate.pattern_key}_needs_more_evidence`),
  ]);
}

function dashboardStatus(
  candidates: ResidualDiagnosticCandidate[],
  insufficientData: string[],
): ResidualDiagnosticCandidateReadModel["dashboard_status"] {
  if (candidates.some((candidate) => candidate.status === "blocked")) {
    return "blocked";
  }
  if (candidates.some((candidate) => candidate.status === "actionable_candidate")) {
    return "actionable_candidates_available";
  }
  if (candidates.length > 0) return "candidates_available";
  if (insufficientData.length > 0) return "insufficient_data";
  return "no_signal";
}

function recommendedNextHardeningTarget(
  candidates: ResidualDiagnosticCandidate[],
): string {
  const ordered = [...candidates].sort((a, b) => {
    const severityDelta = severityRank(b.severity) - severityRank(a.severity);
    if (severityDelta !== 0) return severityDelta;
    return b.repeated_evidence_count - a.repeated_evidence_count;
  });
  return ordered[0]?.suggested_next_hardening_target ??
    "keep_observing_residual_signals";
}

function candidate({
  category,
  label,
  status,
  severity,
  confidence,
  patternKey,
  summary,
  signals,
  sourceRefs = [],
  evidenceRefs = [],
  ordinaryMissing = [],
  materializedInconsistencies = [],
  falseLeapContrast,
  minimumVerification,
  suggestedTarget,
  whyNow,
}: {
  category: ResidualDiagnosticCandidateCategory;
  label: string;
  status: ResidualDiagnosticCandidateStatus;
  severity: ResidualDiagnosticSeverity;
  confidence: ResidualDiagnosticConfidence;
  patternKey: string;
  summary: string;
  signals: ResidualDiagnosticObservedSignal[];
  sourceRefs?: string[];
  evidenceRefs?: string[];
  ordinaryMissing?: string[];
  materializedInconsistencies?: string[];
  falseLeapContrast: string;
  minimumVerification: string[];
  suggestedTarget: string;
  whyNow: string[];
}): ResidualDiagnosticCandidate {
  return {
    candidate_id: `residual:${patternKey}`,
    category,
    label,
    status,
    severity,
    confidence,
    pattern_key: patternKey,
    summary,
    source_signal_count: signals.length,
    repeated_evidence_count: repeatedEvidenceCount(signals),
    source_refs: uniqueStrings(sourceRefs),
    evidence_refs: uniqueStrings(evidenceRefs),
    observed_signals: signals,
    ordinary_missing_prerequisites: uniqueStrings(ordinaryMissing),
    materialized_inconsistencies: uniqueStrings(materializedInconsistencies),
    false_leap_contrast: falseLeapContrast,
    minimum_verification: minimumVerification,
    suggested_next_hardening_target: suggestedTarget,
    why_now: whyNow,
    non_goals: [
      "no_durable_residual_diagnostic_write",
      "no_external_delivery",
      "no_provider_or_network_call",
      "no_memory_metric_cwp_handoff_mutation",
    ],
    read_only: true,
  };
}

function observedSignal({
  id,
  category,
  source,
  summary,
  ordinaryMissing = false,
  materialized = false,
  evidenceRef = null,
}: {
  id: string;
  category: ResidualDiagnosticCandidateCategory;
  source: string;
  summary: string;
  ordinaryMissing?: boolean;
  materialized?: boolean;
  evidenceRef?: string | null;
}): ResidualDiagnosticObservedSignal {
  return {
    signal_id: id,
    category,
    source,
    summary,
    ordinary_missing: ordinaryMissing,
    materialized_inconsistency: materialized,
    evidence_ref: evidenceRef,
  };
}

function stageMaterialMap(spine: RecordValue | null): Map<string, boolean> {
  const result = new Map<string, boolean>();
  for (const stage of arrayOfRecords(spine?.stage_summaries)) {
    const stageId = stringField(stage, "stage_id");
    if (!stageId) continue;
    result.set(
      stageId,
      numberField(stage, "material_count") > 0 ||
        ["available", "approved", "applied", "exported", "fulfilled"].includes(
          stringField(stage, "status") ?? "",
        ),
    );
  }
  return result;
}

function stageById(spine: RecordValue | null, stageId: string): RecordValue | null {
  return (
    arrayOfRecords(spine?.stage_summaries).find(
      (stage) => stringField(stage, "stage_id") === stageId,
    ) ?? null
  );
}

function stageSatisfied(stageId: WorkbenchSpineStageId, status: string | null): boolean {
  const expected: Partial<Record<WorkbenchSpineStageId, string>> = {
    applied_current_working_perspective: "applied",
    current_working_perspective_route_integration: "available",
    applied_handoff_context: "applied",
    exported_handoff_packet_artifact: "exported",
    handoff_send_contract_record: "approved",
    local_handoff_send_fulfillment: "fulfilled",
  };
  return expected[stageId] === status;
}

function authorityProblems(label: string, value: unknown): string[] {
  const record = recordOrNull(value);
  if (!record) return [];
  const authority = recordField(record, "authority_boundary");
  if (!authority) return [];
  return forbiddenAuthorityTrueFields
    .filter((field) => authority[field] === true)
    .map((field) => `${label}:authority_boundary_forbidden_true:${field}`);
}

function reviewDrift(label: string, value: unknown): string[] {
  const review = recordOrNull(value);
  const status = stringField(review, "review_status");
  return uniqueStrings([
    ...(status === "records_invalid" ? [`${label}:records_invalid`] : []),
    ...(status === "selected_record_missing"
      ? [`${label}:selected_record_missing`]
      : []),
    ...stringArray(review?.blocked_reasons).map(
      (reason) => `${label}:blocked:${reason}`,
    ),
  ]);
}

function receiptProblems(label: string, value: unknown): string[] {
  const review = recordOrNull(value);
  const evidence = recordField(review, "evidence_summary");
  const inputSummary = recordField(review, "input_summary");
  return uniqueStrings([
    ...(evidence?.has_receipt_side_effect_problem === true
      ? [`${label}:receipt_side_effect_problem`]
      : []),
    ...(numberField(inputSummary, "receipt_side_effect_problem_count") > 0
      ? [
          `${label}:receipt_side_effect_problem_count:${numberField(
            inputSummary,
            "receipt_side_effect_problem_count",
          )}`,
        ]
      : []),
  ]);
}

function reviewSourceRefs(value: unknown): string[] {
  return stringArray(recordOrNull(value)?.source_refs);
}

function decisionReviewSourceRefs(input: ResidualDiagnosticCandidateInput): string[] {
  return uniqueStrings([
    ...reviewSourceRefs(input.next_work_signal_decision_record_review),
    ...reviewSourceRefs(input.perspective_relay_update_decision_record_review),
  ]);
}

function numberSignal(
  record: RecordValue | null,
  field: string,
  label: string,
): string[] {
  const value = numberField(record, field);
  return value > 0 ? [`${label}:${value}`] : [];
}

function repeatedEvidenceCount(signals: ResidualDiagnosticObservedSignal[]): number {
  return new Set(signals.map((signal) => signal.summary)).size;
}

function severityRank(value: ResidualDiagnosticSeverity): number {
  if (value === "high") return 3;
  if (value === "medium") return 2;
  return 1;
}

function compactCandidates(
  candidates: Array<ResidualDiagnosticCandidate | null>,
): ResidualDiagnosticCandidate[] {
  return candidates.filter(
    (candidate): candidate is ResidualDiagnosticCandidate => Boolean(candidate),
  );
}

function arrayOfRecords(value: unknown): RecordValue[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function recordField(value: unknown, key: string): RecordValue | null {
  if (!isRecord(value)) return null;
  return isRecord(value[key]) ? value[key] : null;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => isNonEmptyString(item))
    : [];
}

function numberField(value: unknown, key: string): number {
  if (!isRecord(value)) return 0;
  return typeof value[key] === "number" && Number.isFinite(value[key])
    ? value[key]
    : 0;
}

function stringField(value: unknown, key: string): string | null {
  if (!isRecord(value)) return null;
  return isNonEmptyString(value[key]) ? value[key] : null;
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
