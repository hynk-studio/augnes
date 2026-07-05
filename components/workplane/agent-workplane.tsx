import { AutonomyBoundaryCard } from "@/components/autonomy/autonomy-boundary-card";
import { AutonomyBudgetPreviewPanel } from "@/components/autonomy/autonomy-budget-preview-panel";
import { AutonomyContractPreviewPanel } from "@/components/autonomy/autonomy-contract-preview-panel";
import { AutonomyCopyExportPanel } from "@/components/autonomy/autonomy-copy-export-panel";
import { AutonomyPolicyPreviewPanel } from "@/components/autonomy/autonomy-policy-preview-panel";
import { AutonomyRunPreviewPanel } from "@/components/autonomy/autonomy-run-preview-panel";
import { AutonomyRunnerPreflightPreviewPanel } from "@/components/autonomy/autonomy-runner-preflight-preview-panel";
import { CodexResultFeedbackDraftPanel } from "@/components/codex-result-feedback-draft-panel";
import { DogfoodMetricCandidatePreviewPanel } from "@/components/dogfood-metric-candidate-preview-panel";
import { DogfoodReuseOperatorDecisionPreviewPanel } from "@/components/dogfood-reuse-operator-decision-preview-panel";
import { DogfoodReuseRecordProposalPanel } from "@/components/dogfood-reuse-record-proposal-panel";
import { DogfoodMetricSnapshotDecisionPanel } from "@/components/dogfooding/dogfood-metric-snapshot-decision-panel";
import { DogfoodMetricSnapshotPreviewPanel } from "@/components/dogfooding/dogfood-metric-snapshot-preview-panel";
import { DogfoodMetricSnapshotRecordReviewPanel } from "@/components/dogfooding/dogfood-metric-snapshot-record-review-panel";
import { ExpectedObservedDeltaDecisionPanel } from "@/components/dogfooding/expected-observed-delta-decision-panel";
import { ExpectedObservedDeltaPreviewPanel } from "@/components/dogfooding/expected-observed-delta-preview-panel";
import { ExpectedObservedDeltaRecordReviewPanel } from "@/components/dogfooding/expected-observed-delta-record-review-panel";
import { ReuseOutcomeBridgeDecisionPanel } from "@/components/dogfooding/reuse-outcome-bridge-decision-panel";
import { ReuseOutcomeBridgeLedgerRecordReviewPanel } from "@/components/dogfooding/reuse-outcome-bridge-ledger-record-review-panel";
import { ReuseOutcomeCandidateBridgePreviewPanel } from "@/components/dogfooding/reuse-outcome-candidate-bridge-preview-panel";
import { GuideBriefMiniPanel } from "@/components/guide/guide-brief-mini-panel";
import { GuideIntentProjectionPanel } from "@/components/guide/guide-intent-projection-panel";
import { GuideWorkplaneDebugPanel } from "@/components/guide/guide-workplane-debug-panel";
import { CodexLaunchCardPreviewPanel } from "@/components/handoff/codex-launch-card-preview-panel";
import { HandoffContextApplyOperatorDecisionPreviewPanel } from "@/components/handoff/handoff-context-apply-operator-decision-preview-panel";
import { HandoffContextApplyPreviewPanel } from "@/components/handoff/handoff-context-apply-preview-panel";
import { HandoffContextApplyWriteContractPreviewPanel } from "@/components/handoff/handoff-context-apply-write-contract-preview-panel";
import { HandoffCopyExportPanel } from "@/components/handoff/handoff-copy-export-panel";
import { HandoffCapsulePreviewPanel } from "@/components/handoff/handoff-capsule-preview-panel";
import { HandoffContextRelayRationalePanel } from "@/components/handoff/handoff-context-relay-rationale-panel";
import { HandoffContextUpdateOperatorDecisionPreviewPanel } from "@/components/handoff/handoff-context-update-operator-decision-preview-panel";
import { HandoffContextUpdatePreviewPanel } from "@/components/handoff/handoff-context-update-preview-panel";
import { HandoffContextUpdateRecordReviewPanel } from "@/components/handoff/handoff-context-update-record-review-panel";
import { HandoffPreviewBoundaryCard } from "@/components/handoff/handoff-preview-boundary-card";
import { SelectedSessionDigestIngestContractPreviewPanel } from "@/components/intake/selected-session-digest-ingest-contract-preview-panel";
import { SelectedSessionDigestIngestOperatorDecisionPanel } from "@/components/intake/selected-session-digest-ingest-operator-decision-panel";
import { SelectedSessionDigestIngestRecordReviewPanel } from "@/components/intake/selected-session-digest-ingest-record-review-panel";
import { SelectedSessionDigestIntakePreviewPanel } from "@/components/intake/selected-session-digest-intake-preview-panel";
import { ProjectHistoryIntakeDecisionPanel } from "@/components/intake/project-history-intake-decision-panel";
import { ProjectHistoryIntakePreviewPanel } from "@/components/intake/project-history-intake-preview-panel";
import { ProjectHistoryIntakeRecordReviewPanel } from "@/components/intake/project-history-intake-record-review-panel";
import { CodexResultReportIntakeDecisionPanel } from "@/components/intake/codex-result-report-intake-decision-panel";
import { CodexResultReportIntakePreviewPanel } from "@/components/intake/codex-result-report-intake-preview-panel";
import { CodexResultReportIntakeRecordReviewPanel } from "@/components/intake/codex-result-report-intake-record-review-panel";
import { PerspectiveNextWorkCandidateUpdatePreviewPanel } from "@/components/perspective-next-work-candidate-update-preview-panel";
import { CurrentPerspectiveWorkplanePanel } from "@/components/workplane/current-perspective-workplane-panel";
import { DeltaBatchPanel } from "@/components/workplane/delta-batch-panel";
import { DeltaProjectionWorkplanePanel } from "@/components/workplane/delta-projection-workplane-panel";
import { EvidenceHandoffWorkplanePanel } from "@/components/workplane/evidence-handoff-workplane-panel";
import { HandoffBuilderPreviewPanel } from "@/components/workplane/handoff-builder-preview-panel";
import { ContinuityRelayWorkplanePanel } from "@/components/workplane/continuity-relay-workplane-panel";
import { MetricInformedContinuityRelayAdjustmentPreviewPanel } from "@/components/workplane/metric-informed-continuity-relay-adjustment-preview-panel";
import { NextWorkSignalDecisionPanel } from "@/components/workplane/next-work-signal-decision-panel";
import { NextWorkSignalDecisionRecordReviewPanel } from "@/components/workplane/next-work-signal-decision-record-review-panel";
import { NextWorkSignalRefreshPreviewPanel } from "@/components/workplane/next-work-signal-refresh-preview-panel";
import { PerspectiveRelayUpdateCandidateBridgePreviewPanel } from "@/components/workplane/perspective-relay-update-candidate-bridge-preview-panel";
import { PerspectiveRelayUpdateDecisionPanel } from "@/components/workplane/perspective-relay-update-decision-panel";
import { PerspectiveRelayUpdateDecisionRecordReviewPanel } from "@/components/workplane/perspective-relay-update-decision-record-review-panel";
import { PerspectiveRelayUpdateWriteContractPreviewPanel } from "@/components/workplane/perspective-relay-update-write-contract-preview-panel";
import { PerspectiveNextWorkBiasRecordReviewPanel } from "@/components/workplane/perspective-next-work-bias-record-review-panel";
import { PerspectiveNextWorkBiasScopedWritePreviewPanel } from "@/components/workplane/perspective-next-work-bias-scoped-write-preview-panel";
import { ContinuityRelayRecordReviewPanel } from "@/components/workplane/continuity-relay-record-review-panel";
import { ContinuityRelayScopedWritePreviewPanel } from "@/components/workplane/continuity-relay-scoped-write-preview-panel";
import { CurrentWorkingPerspectiveUpdateContractDecisionPanel } from "@/components/workplane/current-working-perspective-update-contract-decision-panel";
import { CurrentWorkingPerspectiveUpdateContractPreviewPanel } from "@/components/workplane/current-working-perspective-update-contract-preview-panel";
import { CurrentWorkingPerspectiveUpdateContractRecordReviewPanel } from "@/components/workplane/current-working-perspective-update-contract-record-review-panel";
import { AppliedCurrentWorkingPerspectivePanel } from "@/components/workplane/applied-current-working-perspective-panel";
import { CurrentWorkingPerspectiveApplyDecisionPanel } from "@/components/workplane/current-working-perspective-apply-decision-panel";
import { CurrentWorkingPerspectiveApplyPreviewPanel } from "@/components/workplane/current-working-perspective-apply-preview-panel";
import { CurrentWorkingPerspectiveApplyRecordReviewPanel } from "@/components/workplane/current-working-perspective-apply-record-review-panel";
import { CurrentWorkingPerspectiveRouteIntegrationContractDecisionPanel } from "@/components/workplane/current-working-perspective-route-integration-contract-decision-panel";
import { CurrentWorkingPerspectiveRouteIntegrationContractPreviewPanel } from "@/components/workplane/current-working-perspective-route-integration-contract-preview-panel";
import { CurrentWorkingPerspectiveRouteIntegrationContractRecordReviewPanel } from "@/components/workplane/current-working-perspective-route-integration-contract-record-review-panel";
import { PerspectiveUnitRecordReviewPanel } from "@/components/workplane/perspective-unit-record-review-panel";
import { PerspectiveUnitScopedWritePreviewPanel } from "@/components/workplane/perspective-unit-scoped-write-preview-panel";
import { ProjectionCandidatesPanel } from "@/components/workplane/projection-candidates-panel";
import { ReviewMemoryDetailPanel } from "@/components/workplane/review-memory-detail-panel";
import { ReviewQueueWorkplanePanel } from "@/components/workplane/review-queue-workplane-panel";
import { RunPostmortemDetailPanel } from "@/components/workplane/run-postmortem-detail-panel";
import { RunnerDeltaBatchPanel } from "@/components/workplane/runner-delta-batch-panel";
import { SourceRefBridgeDetailPanel } from "@/components/workplane/source-ref-bridge-detail-panel";
import { StateProposalReviewPanel } from "@/components/workplane/state-proposal-review-panel";
import { TraceDiagnosticsPanel } from "@/components/workplane/trace-diagnostics-panel";
import { WorkbenchDogfoodLoopSpineOverviewPanel } from "@/components/workplane/workbench-dogfood-loop-spine-overview-panel";
import { WorkEpisodeResidueCandidatePreviewPanel } from "@/components/workplane/work-episode-residue-candidate-preview-panel";
import { WorkplaneIntentModePanel } from "@/components/workplane/workplane-intent-mode-panel";
import { WorkplaneMetricsPanel } from "@/components/workplane/workplane-metrics-panel";
import { WorkQueuePanel } from "@/components/workplane/work-queue-panel";
import { WorkplaneHeader } from "@/components/workplane/workplane-header";
import { WorkplaneInspector } from "@/components/workplane/workplane-inspector";
import { WorkplaneOverview } from "@/components/workplane/workplane-overview";
import { readAutonomyContractPreviewForWeb } from "@/lib/autonomy/read-autonomy-contract-for-web";
import { readAutonomyRunnerPreflightPreviewForWeb } from "@/lib/autonomy/read-autonomy-runner-preflight-for-web";
import { buildCodexResultFeedbackDraft } from "@/lib/dogfooding/codex-result-feedback-draft";
import { buildDogfoodMetricCandidatePreviewFromReuseLedgerRecordsV01 } from "@/lib/dogfooding/dogfood-metric-candidate-preview";
import { buildDogfoodMetricSnapshotOperatorDecisionPreviewV01 } from "@/lib/dogfooding/dogfood-metric-snapshot-decision";
import { buildDogfoodMetricSnapshotPreviewV01 } from "@/lib/dogfooding/dogfood-metric-snapshot-preview";
import { buildDogfoodReuseOperatorDecisionPreview } from "@/lib/dogfooding/dogfood-reuse-operator-decision-preview";
import { buildDogfoodReuseRecordProposal } from "@/lib/dogfooding/dogfood-reuse-record-proposal";
import { buildExpectedObservedDeltaOperatorDecisionPreviewV01 } from "@/lib/dogfooding/expected-observed-delta-decision";
import { buildExpectedObservedDeltaPreviewV01 } from "@/lib/dogfooding/expected-observed-delta-preview";
import { readDogfoodMetricSnapshotRecordReviewForWebV01 } from "@/lib/dogfooding/read-dogfood-metric-snapshot-record-review-for-web";
import { readExpectedObservedDeltaRecordReviewForWebV01 } from "@/lib/dogfooding/read-expected-observed-delta-record-review-for-web";
import { readReuseOutcomeBridgeLedgerRecordReviewForWebV01 } from "@/lib/dogfooding/read-reuse-outcome-bridge-ledger-record-review-for-web";
import { buildReuseOutcomeBridgeOperatorDecisionPreviewV01 } from "@/lib/dogfooding/reuse-outcome-bridge-decision";
import { buildReuseOutcomeCandidateBridgePreviewV01 } from "@/lib/dogfooding/reuse-outcome-candidate-bridge-preview";
import { readGuideBriefForWeb } from "@/lib/guide/read-guide-brief-for-web";
import {
  buildGuideWorkplaneDebugContext,
} from "@/lib/guide/guide-workplane-debug-context";
import {
  buildWorkplaneIntentProjection,
  WORKPLANE_INTENT_PROJECTION_DEFAULT_INPUT,
} from "@/lib/guide/workplane-intent-projection";
import { buildHandoffContextApplyOperatorDecisionPreviewV01 } from "@/lib/handoff/handoff-context-apply-operator-decision-preview";
import { buildHandoffContextApplyPreviewV01 } from "@/lib/handoff/handoff-context-apply-preview";
import { buildHandoffContextApplyWriteContractPreviewV01 } from "@/lib/handoff/handoff-context-apply-write-contract-preview";
import { buildHandoffContextUpdateOperatorDecisionPreviewV01 } from "@/lib/handoff/handoff-context-update-operator-decision-preview";
import { buildHandoffContextUpdatePreviewV01 } from "@/lib/handoff/handoff-context-update-preview";
import { readHandoffContextUpdateRecordReviewForWebV01 } from "@/lib/handoff/read-handoff-context-update-record-review-for-web";
import { readHandoffCapsulePreviewForWeb } from "@/lib/handoff/read-handoff-capsule-for-web";
import { buildHandoffContextRelayRationale } from "@/lib/handoff/handoff-context-relay-rationale";
import { buildSelectedSessionDigestIngestContractPreviewV01 } from "@/lib/intake/selected-session-digest-ingest-contract-preview";
import { buildSelectedSessionDigestIngestOperatorDecisionPreviewV01 } from "@/lib/intake/selected-session-digest-ingest-operator-decision";
import { buildSelectedSessionDigestIntakePreviewV01 } from "@/lib/intake/selected-session-digest-intake-preview";
import { buildProjectHistoryIntakeOperatorDecisionPreviewV01 } from "@/lib/intake/project-history-intake-decision";
import { buildProjectHistoryIntakePreviewV01 } from "@/lib/intake/project-history-intake-preview";
import { buildCodexResultReportIntakeOperatorDecisionPreviewV01 } from "@/lib/intake/codex-result-report-intake-decision";
import { buildCodexResultReportIntakePreviewV01 } from "@/lib/intake/codex-result-report-intake-preview";
import { readCodexResultReportIntakeRecordReviewForWebV01 } from "@/lib/intake/read-codex-result-report-intake-record-review-for-web";
import { readProjectHistoryIntakeRecordReviewForWebV01 } from "@/lib/intake/read-project-history-intake-record-review-for-web";
import { readSelectedSessionDigestIngestRecordReviewForWebV01 } from "@/lib/intake/read-selected-session-digest-ingest-record-review-for-web";
import { readRunnerWorkplaneMetrics } from "@/lib/metrics/runner-workplane-metrics";
import { buildPerspectiveNextWorkCandidateUpdatePreviewV01 } from "@/lib/perspective/perspective-next-work-candidate-update-preview";
import { applyWorkplaneViewProjection } from "@/lib/workplane/apply-workplane-view-projection";
import { buildNextWorkSignalRefreshPreviewV01 } from "@/lib/workplane/next-work-signal-refresh-preview";
import { buildNextWorkSignalOperatorDecisionPreviewV01 } from "@/lib/workplane/next-work-signal-decision";
import { readNextWorkSignalDecisionRecordReviewForWebV01 } from "@/lib/workplane/read-next-work-signal-decision-record-review-for-web";
import { buildPerspectiveRelayUpdateCandidateBridgePreviewV01 } from "@/lib/workplane/perspective-relay-update-candidate-bridge-preview";
import { buildPerspectiveRelayUpdateOperatorDecisionPreviewV01 } from "@/lib/workplane/perspective-relay-update-decision";
import { readPerspectiveRelayUpdateDecisionRecordReviewForWebV01 } from "@/lib/workplane/read-perspective-relay-update-decision-record-review-for-web";
import { buildPerspectiveRelayUpdateWriteContractPreviewV01 } from "@/lib/workplane/perspective-relay-update-write-contract-preview";
import { buildPerspectiveNextWorkBiasScopedWritePreviewV01 } from "@/lib/workplane/perspective-next-work-bias-scoped-write-preview";
import { readPerspectiveNextWorkBiasRecordReviewForWebV01 } from "@/lib/workplane/read-perspective-next-work-bias-record-review-for-web";
import { buildContinuityRelayScopedWritePreviewV01 } from "@/lib/workplane/continuity-relay-scoped-write-preview";
import { readContinuityRelayRecordReviewForWebV01 } from "@/lib/workplane/read-continuity-relay-record-review-for-web";
import { buildCurrentWorkingPerspectiveUpdateContractOperatorDecisionPreviewV01 } from "@/lib/workplane/current-working-perspective-update-contract-decision";
import { buildCurrentWorkingPerspectiveUpdateContractPreviewV01 } from "@/lib/workplane/current-working-perspective-update-contract-preview";
import { readCurrentWorkingPerspectiveUpdateContractRecordReviewForWebV01 } from "@/lib/workplane/read-current-working-perspective-update-contract-record-review-for-web";
import { readAppliedCurrentWorkingPerspectiveForWebV01 } from "@/lib/perspective/read-applied-current-working-perspective-for-web";
import { buildCurrentWorkingPerspectiveApplyOperatorDecisionPreviewV01 } from "@/lib/workplane/current-working-perspective-apply-decision";
import { buildCurrentWorkingPerspectiveApplyPreviewV01 } from "@/lib/workplane/current-working-perspective-apply-preview";
import { readCurrentWorkingPerspectiveApplyRecordReviewForWebV01 } from "@/lib/workplane/read-current-working-perspective-apply-record-review-for-web";
import { buildCurrentWorkingPerspectiveRouteIntegrationContractOperatorDecisionPreviewV01 } from "@/lib/workplane/current-working-perspective-route-integration-contract-decision";
import { buildCurrentWorkingPerspectiveRouteIntegrationContractPreviewV01 } from "@/lib/workplane/current-working-perspective-route-integration-contract-preview";
import { readCurrentWorkingPerspectiveRouteIntegrationContractRecordReviewForWebV01 } from "@/lib/workplane/read-current-working-perspective-route-integration-contract-record-review-for-web";
import { buildPerspectiveUnitScopedWritePreviewV01 } from "@/lib/workplane/perspective-unit-scoped-write-preview";
import { readPerspectiveUnitRecordReviewForWebV01 } from "@/lib/workplane/read-perspective-unit-record-review-for-web";
import { buildWorkbenchDogfoodLoopSpineOverviewV01 } from "@/lib/workplane/workbench-dogfood-loop-spine-overview";
import { buildWorkEpisodeResidueCandidatePreviewV01 } from "@/lib/workplane/work-episode-residue-candidate-preview";
import { buildMetricInformedContinuityRelayAdjustmentPreviewV01 } from "@/lib/workplane/metric-informed-continuity-relay-adjustment-preview";
import { readWorkplaneContext } from "@/lib/workplane/read-workplane-context";
import { buildWorkplaneBridgeTraceDetailRead } from "@/lib/workplane/workplane-bridge-trace-detail";
import { buildAgentWorkplaneNodeContextRead } from "@/lib/workplane/workplane-node-context";
import { buildWorkplaneReviewMemoryDetailRead } from "@/lib/workplane/workplane-review-memory-detail";
import { buildWorkplaneRunPostmortemDetailRead } from "@/lib/workplane/workplane-run-postmortem-detail";
import { buildWorkplaneStateProposalReviewRead } from "@/lib/workplane/workplane-state-proposal-review";
import type { CSSProperties } from "react";

const surfaceStyle: CSSProperties = {
  minHeight: "100vh",
  boxSizing: "border-box",
  padding: "clamp(12px, 4vw, 28px)",
  background:
    "linear-gradient(180deg, #eaf0f8 0%, #f8fafc 42%, #eef2f7 100%)",
  color: "#0f172a",
  overflowX: "hidden",
};

const shellStyle: CSSProperties = {
  display: "grid",
  gap: "14px",
  width: "min(1560px, 100%)",
  minWidth: 0,
  margin: "0 auto",
};

const layoutStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: "14px",
  alignItems: "start",
};

const panelGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
  gap: "14px",
  alignItems: "start",
};

const previewSectionStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  minWidth: 0,
};

const previewHeadingStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
  minWidth: 0,
  padding: "14px",
  border: "1px solid rgba(30, 41, 59, 0.12)",
  borderRadius: "8px",
  background: "rgba(255, 255, 255, 0.9)",
  overflowWrap: "anywhere",
};

const previewKickerStyle: CSSProperties = {
  margin: 0,
  color: "#64748b",
  fontSize: "0.72rem",
  fontWeight: 820,
  textTransform: "uppercase",
};

const previewTitleStyle: CSSProperties = {
  margin: 0,
  color: "#0f172a",
  fontSize: "1.06rem",
  lineHeight: 1.2,
};

const previewCopyStyle: CSSProperties = {
  margin: 0,
  color: "#475569",
  fontSize: "0.82rem",
  lineHeight: 1.38,
  overflowWrap: "anywhere",
};

export async function AgentWorkplane() {
  const guideBrief = readGuideBriefForWeb();
  const [
    context,
    handoffPreview,
    autonomyPreview,
    autonomyRunnerPreflightPreview,
  ] = await Promise.all([
    readWorkplaneContext({ guide_brief: guideBrief }),
    Promise.resolve(readHandoffCapsulePreviewForWeb()),
    Promise.resolve(readAutonomyContractPreviewForWeb()),
    Promise.resolve(readAutonomyRunnerPreflightPreviewForWeb()),
  ]);
  const workplaneNodeContext = buildAgentWorkplaneNodeContextRead(context);
  const bridgeTraceDetail = buildWorkplaneBridgeTraceDetailRead({
    workplane_context: context,
    node_context_read: workplaneNodeContext,
  });
  const reviewMemoryDetail = buildWorkplaneReviewMemoryDetailRead({
    workplane_context: context,
    node_context_read: workplaneNodeContext,
  });
  const stateProposalReview = buildWorkplaneStateProposalReviewRead({
    workplane_context: context,
    node_context_read: workplaneNodeContext,
    review_memory_detail: reviewMemoryDetail,
  });
  const runPostmortemDetail = buildWorkplaneRunPostmortemDetailRead({
    workplane_context: context,
    node_context_read: workplaneNodeContext,
  });
  const handoffContextRationale = buildHandoffContextRelayRationale({
    continuity_relay: context.continuity_relay,
    handoff_preview: handoffPreview,
  });
  const codexResultFeedbackDraft = buildCodexResultFeedbackDraft({
    handoff_context_rationale: handoffContextRationale,
    result_report: null,
  });
  const dogfoodReuseRecordProposal = buildDogfoodReuseRecordProposal({
    feedback_draft: codexResultFeedbackDraft,
  });
  const dogfoodReuseOperatorDecisionPreview =
    buildDogfoodReuseOperatorDecisionPreview({
      proposal: dogfoodReuseRecordProposal,
    });
  const workplaneDebugContext = buildGuideWorkplaneDebugContext({
    node_context_read: workplaneNodeContext,
    selection: {
      selected_panel_id:
        WORKPLANE_INTENT_PROJECTION_DEFAULT_INPUT.selected_panel_id,
      selected_node_id:
        WORKPLANE_INTENT_PROJECTION_DEFAULT_INPUT.selected_node_id,
      debug_question: WORKPLANE_INTENT_PROJECTION_DEFAULT_INPUT.debug_question,
    },
  });
  const workplaneIntentProjection = buildWorkplaneIntentProjection({
    ...WORKPLANE_INTENT_PROJECTION_DEFAULT_INPUT,
    node_context_read: workplaneNodeContext,
    debug_context: workplaneDebugContext,
  });
  const projectedWorkplaneView = applyWorkplaneViewProjection({
    projection: workplaneIntentProjection,
    node_context_read: workplaneNodeContext,
  });
  const workplaneMetrics = await readRunnerWorkplaneMetrics({
    scope: "project:augnes",
    workplane_context: context,
    node_context_read: workplaneNodeContext,
    debug_context: workplaneDebugContext,
    intent_projection: workplaneIntentProjection,
  });
  const selectedSessionDigestIntakePreview =
    buildSelectedSessionDigestIntakePreviewV01({
      scope: "project:augnes",
      as_of: workplaneMetrics.as_of,
      source_refs: [
        "workbench:selected_session_digest_intake_preview_empty_input",
      ],
    });
  const selectedSessionDigestIngestContractPreview =
    buildSelectedSessionDigestIngestContractPreviewV01({
      selected_session_digest_intake_preview:
        selectedSessionDigestIntakePreview,
      scope: "project:augnes",
      as_of: workplaneMetrics.as_of,
      source_refs: [
        "workbench:selected_session_digest_ingest_contract_preview",
      ],
    });
  const selectedSessionDigestIngestOperatorDecisionPreview =
    buildSelectedSessionDigestIngestOperatorDecisionPreviewV01({
      selected_session_digest_ingest_contract_preview:
        selectedSessionDigestIngestContractPreview,
      scope: "project:augnes",
      as_of: workplaneMetrics.as_of,
      source_refs: [
        "workbench:selected_session_digest_ingest_operator_decision_preview",
      ],
    });
  const selectedSessionDigestIngestRecordReview =
    readSelectedSessionDigestIngestRecordReviewForWebV01({
      as_of: workplaneMetrics.as_of,
      source_refs: [
        "workbench:selected_session_digest_ingest_record_review",
      ],
    });
  const projectHistoryIntakePreview = buildProjectHistoryIntakePreviewV01({
    scope: "project:augnes",
    as_of: workplaneMetrics.as_of,
    source_refs: ["workbench:project_history_intake_preview_empty_input"],
  });
  const projectHistoryIntakeOperatorDecisionPreview =
    buildProjectHistoryIntakeOperatorDecisionPreviewV01({
      project_history_intake_preview: projectHistoryIntakePreview,
      scope: "project:augnes",
      as_of: workplaneMetrics.as_of,
      source_refs: [
        "workbench:project_history_intake_operator_decision_preview",
      ],
    });
  const projectHistoryIntakeRecordReview =
    readProjectHistoryIntakeRecordReviewForWebV01({
      as_of: workplaneMetrics.as_of,
      source_refs: ["workbench:project_history_intake_record_review"],
    });
  const codexResultReportIntakePreview =
    buildCodexResultReportIntakePreviewV01({
      scope: "project:augnes",
      as_of: workplaneMetrics.as_of,
      source_refs: [
        "workbench:codex_result_report_intake_preview_empty_input",
      ],
    });
  const codexResultReportIntakeDecisionPreview =
    buildCodexResultReportIntakeOperatorDecisionPreviewV01({
      codex_result_report_intake_preview: codexResultReportIntakePreview,
      scope: "project:augnes",
      as_of: workplaneMetrics.as_of,
      source_refs: [
        "workbench:codex_result_report_intake_operator_decision_preview",
      ],
    });
  const codexResultReportIntakeRecordReview =
    readCodexResultReportIntakeRecordReviewForWebV01({
      as_of: workplaneMetrics.as_of,
      source_refs: ["workbench:codex_result_report_intake_record_review"],
    });
  const workEpisodeResidueCandidatePreview =
    buildWorkEpisodeResidueCandidatePreviewV01({
      codex_result_report_intake_preview: codexResultReportIntakePreview,
      codex_result_report_intake_record_review:
        codexResultReportIntakeRecordReview,
      scope: "project:augnes",
      as_of: workplaneMetrics.as_of,
      source_refs: ["workbench:work_episode_residue_candidate_preview"],
    });
  const expectedObservedDeltaPreview = buildExpectedObservedDeltaPreviewV01({
    work_episode_residue_candidate_preview: workEpisodeResidueCandidatePreview,
    codex_result_report_intake_record_review:
      codexResultReportIntakeRecordReview,
    codex_result_report_intake_preview: codexResultReportIntakePreview,
    scope: "project:augnes",
    as_of: workplaneMetrics.as_of,
    source_refs: ["workbench:expected_observed_delta_preview"],
  });
  const expectedObservedDeltaDecisionPreview =
    buildExpectedObservedDeltaOperatorDecisionPreviewV01({
      expected_observed_delta_preview: expectedObservedDeltaPreview,
      scope: "project:augnes",
      as_of: workplaneMetrics.as_of,
      source_refs: ["workbench:expected_observed_delta_decision_preview"],
    });
  const expectedObservedDeltaRecordReview =
    readExpectedObservedDeltaRecordReviewForWebV01({
      as_of: workplaneMetrics.as_of,
      source_refs: ["workbench:expected_observed_delta_record_review"],
    });
  const reuseOutcomeCandidateBridgePreview =
    buildReuseOutcomeCandidateBridgePreviewV01({
      expected_observed_delta_preview: expectedObservedDeltaPreview,
      expected_observed_delta_record_review: expectedObservedDeltaRecordReview,
      work_episode_residue_candidate_preview: workEpisodeResidueCandidatePreview,
      codex_result_report_intake_record_review:
        codexResultReportIntakeRecordReview,
      scope: "project:augnes",
      as_of: workplaneMetrics.as_of,
      source_refs: ["workbench:reuse_outcome_candidate_bridge_preview"],
    });
  const reuseOutcomeBridgeOperatorDecisionPreview =
    buildReuseOutcomeBridgeOperatorDecisionPreviewV01({
      reuse_outcome_candidate_bridge_preview:
        reuseOutcomeCandidateBridgePreview,
      expected_observed_delta_record_review: expectedObservedDeltaRecordReview,
      expected_observed_delta_preview: expectedObservedDeltaPreview,
      scope: "project:augnes",
      as_of: workplaneMetrics.as_of,
      source_refs: ["workbench:reuse_outcome_bridge_operator_decision_preview"],
    });
  const reuseOutcomeBridgeLedgerRecordReview =
    readReuseOutcomeBridgeLedgerRecordReviewForWebV01({
      as_of: workplaneMetrics.as_of,
      source_refs: ["workbench:reuse_outcome_bridge_ledger_record_review"],
    });
  const dogfoodMetricSnapshotPreview = buildDogfoodMetricSnapshotPreviewV01({
    reuse_outcome_bridge_ledger_record_review:
      reuseOutcomeBridgeLedgerRecordReview,
    expected_observed_delta_record_review: expectedObservedDeltaRecordReview,
    work_episode_residue_candidate_preview: workEpisodeResidueCandidatePreview,
    scope: "project:augnes",
    as_of: workplaneMetrics.as_of,
    source_refs: ["workbench:dogfood_metric_snapshot_preview"],
  });
  const dogfoodMetricSnapshotDecisionPreview =
    buildDogfoodMetricSnapshotOperatorDecisionPreviewV01({
      dogfood_metric_snapshot_preview: dogfoodMetricSnapshotPreview,
      scope: "project:augnes",
      as_of: workplaneMetrics.as_of,
      source_refs: ["workbench:dogfood_metric_snapshot_decision_preview"],
    });
  const dogfoodMetricSnapshotRecordReview =
    readDogfoodMetricSnapshotRecordReviewForWebV01({
      as_of: workplaneMetrics.as_of,
      source_refs: ["workbench:dogfood_metric_snapshot_record_review"],
    });
  const dogfoodMetricCandidatePreview =
    buildDogfoodMetricCandidatePreviewFromReuseLedgerRecordsV01({
      records: [],
      scope: "project:augnes",
      as_of: workplaneMetrics.as_of,
      source_refs: [
        "workbench:default_empty_handoff_reuse_ledger_metric_preview",
      ],
      insufficient_data_reasons: [
        "workbench_default_does_not_read_or_write_reuse_ledger_store",
      ],
    });
  const perspectiveNextWorkCandidateUpdatePreview =
    buildPerspectiveNextWorkCandidateUpdatePreviewV01({
      metric_preview: dogfoodMetricCandidatePreview,
      ledger_records: [],
      scope: "project:augnes",
      as_of: workplaneMetrics.as_of,
      source_refs: [
        "workbench:default_empty_perspective_next_work_candidate_update_preview",
      ],
    });
  const metricInformedContinuityRelayAdjustmentPreview =
    buildMetricInformedContinuityRelayAdjustmentPreviewV01({
      continuity_relay: context.continuity_relay,
      perspective_next_work_candidate_update_preview:
        perspectiveNextWorkCandidateUpdatePreview,
      scope: "project:augnes",
      as_of: workplaneMetrics.as_of,
      source_refs: [
        "workbench:default_metric_informed_continuity_relay_adjustment_preview",
      ],
    });
  const nextWorkSignalRefreshPreview = buildNextWorkSignalRefreshPreviewV01({
    dogfood_metric_snapshot_preview: dogfoodMetricSnapshotPreview,
    dogfood_metric_snapshot_record_review: dogfoodMetricSnapshotRecordReview,
    reuse_outcome_bridge_ledger_record_review:
      reuseOutcomeBridgeLedgerRecordReview,
    existing_perspective_next_work_candidate_update_preview:
      perspectiveNextWorkCandidateUpdatePreview,
    existing_metric_informed_continuity_relay_adjustment_preview:
      metricInformedContinuityRelayAdjustmentPreview,
    scope: "project:augnes",
    as_of: workplaneMetrics.as_of,
    source_refs: ["workbench:next_work_signal_refresh_preview"],
  });
  const nextWorkSignalDecisionPreview =
    buildNextWorkSignalOperatorDecisionPreviewV01({
      next_work_signal_refresh_preview: nextWorkSignalRefreshPreview,
      dogfood_metric_snapshot_record_review: dogfoodMetricSnapshotRecordReview,
      dogfood_metric_snapshot_preview: dogfoodMetricSnapshotPreview,
      scope: "project:augnes",
      as_of: workplaneMetrics.as_of,
      source_refs: ["workbench:next_work_signal_decision_preview"],
    });
  const nextWorkSignalDecisionRecordReview =
    readNextWorkSignalDecisionRecordReviewForWebV01({
      as_of: workplaneMetrics.as_of,
      source_refs: ["workbench:next_work_signal_decision_record_review"],
    });
  const perspectiveRelayUpdateCandidateBridgePreview =
    buildPerspectiveRelayUpdateCandidateBridgePreviewV01({
      next_work_signal_decision_preview: nextWorkSignalDecisionPreview,
      next_work_signal_decision_record_review:
        nextWorkSignalDecisionRecordReview,
      next_work_signal_refresh_preview: nextWorkSignalRefreshPreview,
      dogfood_metric_snapshot_record_review: dogfoodMetricSnapshotRecordReview,
      existing_perspective_next_work_candidate_update_preview:
        perspectiveNextWorkCandidateUpdatePreview,
      existing_metric_informed_continuity_relay_adjustment_preview:
        metricInformedContinuityRelayAdjustmentPreview,
      scope: "project:augnes",
      as_of: workplaneMetrics.as_of,
      source_refs: [
        "workbench:perspective_relay_update_candidate_bridge_preview",
      ],
    });
  const perspectiveRelayUpdateDecisionPreview =
    buildPerspectiveRelayUpdateOperatorDecisionPreviewV01({
      perspective_relay_update_candidate_bridge_preview:
        perspectiveRelayUpdateCandidateBridgePreview,
      scope: "project:augnes",
      as_of: workplaneMetrics.as_of,
      source_refs: ["workbench:perspective_relay_update_decision_preview"],
    });
  const perspectiveRelayUpdateDecisionRecordReview =
    readPerspectiveRelayUpdateDecisionRecordReviewForWebV01({
      as_of: workplaneMetrics.as_of,
      source_refs: [
        "workbench:perspective_relay_update_decision_record_review",
      ],
    });
  const perspectiveRelayUpdateWriteContractPreview =
    buildPerspectiveRelayUpdateWriteContractPreviewV01({
      perspective_relay_update_operator_decision_preview:
        perspectiveRelayUpdateDecisionPreview,
      perspective_relay_update_decision_record_review:
        perspectiveRelayUpdateDecisionRecordReview,
      perspective_relay_update_candidate_bridge_preview:
        perspectiveRelayUpdateCandidateBridgePreview,
      existing_perspective_next_work_candidate_update_preview:
        perspectiveNextWorkCandidateUpdatePreview,
      existing_metric_informed_continuity_relay_adjustment_preview:
        metricInformedContinuityRelayAdjustmentPreview,
      scope: "project:augnes",
      as_of: workplaneMetrics.as_of,
      source_refs: [
        "workbench:perspective_relay_update_write_contract_preview",
      ],
    });
  const perspectiveNextWorkBiasScopedWritePreview =
    buildPerspectiveNextWorkBiasScopedWritePreviewV01({
      perspective_relay_update_write_contract_preview:
        perspectiveRelayUpdateWriteContractPreview,
      perspective_relay_update_decision_record_review:
        perspectiveRelayUpdateDecisionRecordReview,
      perspective_relay_update_candidate_bridge_preview:
        perspectiveRelayUpdateCandidateBridgePreview,
      scope: "project:augnes",
      as_of: workplaneMetrics.as_of,
      source_refs: [
        "workbench:perspective_next_work_bias_scoped_write_preview",
      ],
    });
  const perspectiveNextWorkBiasRecordReview =
    readPerspectiveNextWorkBiasRecordReviewForWebV01({
      as_of: workplaneMetrics.as_of,
      source_refs: [
        "workbench:perspective_next_work_bias_record_review",
      ],
    });
  const perspectiveUnitScopedWritePreview =
    buildPerspectiveUnitScopedWritePreviewV01({
      perspective_relay_update_write_contract_preview:
        perspectiveRelayUpdateWriteContractPreview,
      perspective_relay_update_decision_record_review:
        perspectiveRelayUpdateDecisionRecordReview,
      perspective_relay_update_candidate_bridge_preview:
        perspectiveRelayUpdateCandidateBridgePreview,
      perspective_next_work_bias_record_review:
        perspectiveNextWorkBiasRecordReview,
      scope: "project:augnes",
      as_of: workplaneMetrics.as_of,
      source_refs: ["workbench:perspective_unit_scoped_write_preview"],
    });
  const perspectiveUnitRecordReview = readPerspectiveUnitRecordReviewForWebV01({
    as_of: workplaneMetrics.as_of,
    source_refs: ["workbench:perspective_unit_record_review"],
  });
  const continuityRelayScopedWritePreview =
    buildContinuityRelayScopedWritePreviewV01({
      perspective_relay_update_write_contract_preview:
        perspectiveRelayUpdateWriteContractPreview,
      perspective_relay_update_decision_record_review:
        perspectiveRelayUpdateDecisionRecordReview,
      perspective_relay_update_candidate_bridge_preview:
        perspectiveRelayUpdateCandidateBridgePreview,
      perspective_next_work_bias_record_review:
        perspectiveNextWorkBiasRecordReview,
      perspective_unit_record_review: perspectiveUnitRecordReview,
      scope: "project:augnes",
      as_of: workplaneMetrics.as_of,
      source_refs: ["workbench:continuity_relay_scoped_write_preview"],
    });
  const continuityRelayRecordReview = readContinuityRelayRecordReviewForWebV01({
    as_of: workplaneMetrics.as_of,
    source_refs: ["workbench:continuity_relay_record_review"],
  });
  const currentWorkingPerspectiveUpdateContractPreview =
    buildCurrentWorkingPerspectiveUpdateContractPreviewV01({
      current_working_perspective_read: context.current_perspective_read,
      perspective_next_work_bias_record_review:
        perspectiveNextWorkBiasRecordReview,
      perspective_unit_record_review: perspectiveUnitRecordReview,
      continuity_relay_record_review: continuityRelayRecordReview,
      perspective_relay_update_decision_record_review:
        perspectiveRelayUpdateDecisionRecordReview,
      perspective_relay_update_write_contract_preview:
        perspectiveRelayUpdateWriteContractPreview,
      workplane_continuity_relay: context.continuity_relay,
      scope: "project:augnes",
      as_of: workplaneMetrics.as_of,
      source_refs: [
        "workbench:current_working_perspective_update_contract_preview",
      ],
    });
  const currentWorkingPerspectiveUpdateContractDecisionPreview =
    buildCurrentWorkingPerspectiveUpdateContractOperatorDecisionPreviewV01({
      current_working_perspective_update_contract_preview:
        currentWorkingPerspectiveUpdateContractPreview,
      scope: "project:augnes",
      as_of: workplaneMetrics.as_of,
      source_refs: [
        "workbench:current_working_perspective_update_contract_decision_preview",
      ],
    });
  const currentWorkingPerspectiveUpdateContractRecordReview =
    readCurrentWorkingPerspectiveUpdateContractRecordReviewForWebV01({
      as_of: workplaneMetrics.as_of,
      source_refs: [
        "workbench:current_working_perspective_update_contract_record_review",
      ],
    });
  const currentWorkingPerspectiveApplyPreview =
    buildCurrentWorkingPerspectiveApplyPreviewV01({
      current_working_perspective_update_contract_record_review:
        currentWorkingPerspectiveUpdateContractRecordReview,
      current_working_perspective_read: context.current_perspective_read,
      scope: "project:augnes",
      as_of: workplaneMetrics.as_of,
      source_refs: [
        "workbench:current_working_perspective_apply_preview",
      ],
    });
  const currentWorkingPerspectiveApplyDecisionPreview =
    buildCurrentWorkingPerspectiveApplyOperatorDecisionPreviewV01({
      current_working_perspective_apply_preview:
        currentWorkingPerspectiveApplyPreview,
      scope: "project:augnes",
      as_of: workplaneMetrics.as_of,
      source_refs: [
        "workbench:current_working_perspective_apply_decision_preview",
      ],
    });
  const currentWorkingPerspectiveApplyRecordReview =
    readCurrentWorkingPerspectiveApplyRecordReviewForWebV01({
      as_of: workplaneMetrics.as_of,
      source_refs: [
        "workbench:current_working_perspective_apply_record_review",
      ],
    });
  const appliedCurrentWorkingPerspectiveRead =
    readAppliedCurrentWorkingPerspectiveForWebV01();
  const routeIntegrationMode =
    appliedCurrentWorkingPerspectiveRead.status ===
    "latest_applied_snapshot_available"
      ? "applied_snapshot_overlay_candidate"
      : "keep_runtime_only";
  const currentWorkingPerspectiveRouteIntegrationContractPreview =
    buildCurrentWorkingPerspectiveRouteIntegrationContractPreviewV01({
      current_working_perspective_read: context.current_perspective_read,
      applied_current_working_perspective_read:
        appliedCurrentWorkingPerspectiveRead,
      current_working_perspective_apply_record_review:
        currentWorkingPerspectiveApplyRecordReview,
      current_working_perspective_update_contract_record_review:
        currentWorkingPerspectiveUpdateContractRecordReview,
      requested_route_integration_mode: routeIntegrationMode,
      scope: "project:augnes",
      as_of: workplaneMetrics.as_of,
      source_refs: [
        "workbench:current_working_perspective_route_integration_contract_preview",
      ],
    });
  const currentWorkingPerspectiveRouteIntegrationContractDecisionPreview =
    buildCurrentWorkingPerspectiveRouteIntegrationContractOperatorDecisionPreviewV01({
      current_working_perspective_route_integration_contract_preview:
        currentWorkingPerspectiveRouteIntegrationContractPreview,
      scope: "project:augnes",
      as_of: workplaneMetrics.as_of,
      source_refs: [
        "workbench:current_working_perspective_route_integration_contract_decision_preview",
      ],
    });
  const currentWorkingPerspectiveRouteIntegrationContractRecordReview =
    readCurrentWorkingPerspectiveRouteIntegrationContractRecordReviewForWebV01({
      as_of: workplaneMetrics.as_of,
      source_refs: [
        "workbench:current_working_perspective_route_integration_contract_record_review",
      ],
    });
  const handoffContextUpdatePreview = buildHandoffContextUpdatePreviewV01({
    handoff_context_relay_rationale: handoffContextRationale,
    metric_informed_relay_adjustment_preview:
      metricInformedContinuityRelayAdjustmentPreview,
    scope: "project:augnes",
    as_of: workplaneMetrics.as_of,
    source_refs: [
      "workbench:default_handoff_context_update_preview",
    ],
  });
  const handoffContextUpdateOperatorDecisionPreview =
    buildHandoffContextUpdateOperatorDecisionPreviewV01({
      handoff_context_update_preview: handoffContextUpdatePreview,
      scope: "project:augnes",
      as_of: workplaneMetrics.as_of,
      source_refs: [
        "workbench:default_handoff_context_update_operator_decision_preview",
      ],
    });
  const handoffContextUpdateRecordReview =
    readHandoffContextUpdateRecordReviewForWebV01({
      as_of: workplaneMetrics.as_of,
      source_refs: [
        "workbench:handoff_context_update_record_review",
      ],
    });
  const handoffContextApplyPreview = buildHandoffContextApplyPreviewV01({
    record_review: handoffContextUpdateRecordReview,
    current_handoff_context_rationale: handoffContextRationale,
    current_selected_refs: handoffContextRationale.selected_refs.map(
      (ref) => ref.ref_id,
    ),
    scope: "project:augnes",
    as_of: workplaneMetrics.as_of,
    source_refs: [
      "workbench:handoff_context_apply_preview",
    ],
  });
  const handoffContextApplyOperatorDecisionPreview =
    buildHandoffContextApplyOperatorDecisionPreviewV01({
      apply_preview: handoffContextApplyPreview,
      scope: "project:augnes",
      as_of: workplaneMetrics.as_of,
      source_refs: [
        "workbench:handoff_context_apply_operator_decision_preview",
      ],
    });
  const handoffContextApplyWriteContractPreview =
    buildHandoffContextApplyWriteContractPreviewV01({
      apply_operator_decision_preview:
        handoffContextApplyOperatorDecisionPreview,
      scope: "project:augnes",
      as_of: workplaneMetrics.as_of,
      source_refs: [
        "workbench:handoff_context_apply_write_contract_preview",
      ],
    });
  const workbenchDogfoodLoopSpineOverview =
    buildWorkbenchDogfoodLoopSpineOverviewV01({
      selected_session_digest_intake_preview:
        selectedSessionDigestIntakePreview,
      selected_session_digest_ingest_contract_preview:
        selectedSessionDigestIngestContractPreview,
      selected_session_digest_ingest_operator_decision_preview:
        selectedSessionDigestIngestOperatorDecisionPreview,
      selected_session_digest_ingest_record_review:
        selectedSessionDigestIngestRecordReview,
      project_history_intake_preview: projectHistoryIntakePreview,
      project_history_intake_operator_decision_preview:
        projectHistoryIntakeOperatorDecisionPreview,
      project_history_intake_record_review: projectHistoryIntakeRecordReview,
      codex_result_report_intake_preview: codexResultReportIntakePreview,
      codex_result_report_intake_decision_preview:
        codexResultReportIntakeDecisionPreview,
      codex_result_report_intake_record_review:
        codexResultReportIntakeRecordReview,
      work_episode_residue_candidate_preview:
        workEpisodeResidueCandidatePreview,
      expected_observed_delta_preview: expectedObservedDeltaPreview,
      expected_observed_delta_decision_preview:
        expectedObservedDeltaDecisionPreview,
      expected_observed_delta_record_review:
        expectedObservedDeltaRecordReview,
      reuse_outcome_candidate_bridge_preview:
        reuseOutcomeCandidateBridgePreview,
      reuse_outcome_bridge_operator_decision_preview:
        reuseOutcomeBridgeOperatorDecisionPreview,
      reuse_outcome_bridge_ledger_record_review:
        reuseOutcomeBridgeLedgerRecordReview,
      dogfood_metric_snapshot_preview: dogfoodMetricSnapshotPreview,
      dogfood_metric_snapshot_decision_preview:
        dogfoodMetricSnapshotDecisionPreview,
      dogfood_metric_snapshot_record_review:
        dogfoodMetricSnapshotRecordReview,
      next_work_signal_refresh_preview: nextWorkSignalRefreshPreview,
      next_work_signal_decision_preview: nextWorkSignalDecisionPreview,
      next_work_signal_decision_record_review:
        nextWorkSignalDecisionRecordReview,
      perspective_relay_update_candidate_bridge_preview:
        perspectiveRelayUpdateCandidateBridgePreview,
      perspective_relay_update_operator_decision_preview:
        perspectiveRelayUpdateDecisionPreview,
      perspective_relay_update_decision_record_review:
        perspectiveRelayUpdateDecisionRecordReview,
      perspective_relay_update_write_contract_preview:
        perspectiveRelayUpdateWriteContractPreview,
      perspective_next_work_bias_scoped_write_preview:
        perspectiveNextWorkBiasScopedWritePreview,
      perspective_next_work_bias_record_review:
        perspectiveNextWorkBiasRecordReview,
      perspective_unit_scoped_write_preview: perspectiveUnitScopedWritePreview,
      perspective_unit_record_review: perspectiveUnitRecordReview,
      continuity_relay_scoped_write_preview:
        continuityRelayScopedWritePreview,
      continuity_relay_record_review: continuityRelayRecordReview,
      current_working_perspective_update_contract_preview:
        currentWorkingPerspectiveUpdateContractPreview,
      current_working_perspective_update_contract_decision_preview:
        currentWorkingPerspectiveUpdateContractDecisionPreview,
      current_working_perspective_update_contract_record_review:
        currentWorkingPerspectiveUpdateContractRecordReview,
      current_working_perspective_apply_preview:
        currentWorkingPerspectiveApplyPreview,
      current_working_perspective_apply_decision_preview:
        currentWorkingPerspectiveApplyDecisionPreview,
      current_working_perspective_apply_record_review:
        currentWorkingPerspectiveApplyRecordReview,
      applied_current_working_perspective_read:
        appliedCurrentWorkingPerspectiveRead,
      current_working_perspective_route_integration_contract_preview:
        currentWorkingPerspectiveRouteIntegrationContractPreview,
      current_working_perspective_route_integration_contract_decision_preview:
        currentWorkingPerspectiveRouteIntegrationContractDecisionPreview,
      current_working_perspective_route_integration_contract_record_review:
        currentWorkingPerspectiveRouteIntegrationContractRecordReview,
      codex_result_feedback_draft: codexResultFeedbackDraft,
      dogfood_reuse_record_proposal: dogfoodReuseRecordProposal,
      dogfood_reuse_operator_decision_preview:
        dogfoodReuseOperatorDecisionPreview,
      dogfood_metric_candidate_preview: dogfoodMetricCandidatePreview,
      perspective_next_work_candidate_update_preview:
        perspectiveNextWorkCandidateUpdatePreview,
      metric_informed_continuity_relay_adjustment_preview:
        metricInformedContinuityRelayAdjustmentPreview,
      handoff_context_update_preview: handoffContextUpdatePreview,
      handoff_context_update_operator_decision_preview:
        handoffContextUpdateOperatorDecisionPreview,
      handoff_context_update_record_review: handoffContextUpdateRecordReview,
      handoff_context_apply_preview: handoffContextApplyPreview,
      handoff_context_apply_operator_decision_preview:
        handoffContextApplyOperatorDecisionPreview,
      handoff_context_apply_write_contract_preview:
        handoffContextApplyWriteContractPreview,
      scope: "project:augnes",
      as_of: workplaneMetrics.as_of,
      source_refs: ["workbench:dogfood_loop_spine_overview"],
    });

  return (
    <div aria-label="Agent Workplane" style={surfaceStyle}>
      <div style={shellStyle}>
        <WorkplaneHeader />
        <WorkplaneOverview context={context} />
        <GuideBriefMiniPanel guideBrief={guideBrief} variant="workbench" />
        <ContinuityRelayWorkplanePanel context={context} />
        <GuideWorkplaneDebugPanel debugContext={workplaneDebugContext} />
        <GuideIntentProjectionPanel projection={workplaneIntentProjection} />
        <WorkplaneIntentModePanel
          projection={workplaneIntentProjection}
          projectedView={projectedWorkplaneView}
        />
        <WorkplaneMetricsPanel metrics={workplaneMetrics} />

        <section aria-label="Agent Workplane layout" style={layoutStyle}>
          <section aria-label="Agent Workplane panels" style={panelGridStyle}>
            <WorkQueuePanel context={context} />
            <CurrentPerspectiveWorkplanePanel context={context} />
            <DeltaProjectionWorkplanePanel context={context} />
            <ReviewQueueWorkplanePanel context={context} />
            <ReviewMemoryDetailPanel read={reviewMemoryDetail} />
            <StateProposalReviewPanel read={stateProposalReview} />
            <EvidenceHandoffWorkplanePanel context={context} />
            <WorkplaneInspector context={context} />
            <SourceRefBridgeDetailPanel read={bridgeTraceDetail} />
          </section>

          <section
            aria-label="Agent Workplane projection and handoff previews"
            style={previewSectionStyle}
          >
            <div style={previewHeadingStyle}>
              <p style={previewKickerStyle}>Phase 5C read-only preview</p>
              <h2 style={previewTitleStyle}>
                Projection, handoff, postmortem, and trace skeletons
              </h2>
              <p style={previewCopyStyle}>
                These panels expose preview-only backend context for projection
                candidates, projected Delta Batch review, recovered runner
                DeltaBatch readback, handoff builder inputs, run postmortem
                slots, and bounded trace diagnostics. No hidden execution
                authority is added: no apply, approve, reject, recover, tick,
                schedule, send, launch Codex, provider/GitHub call,
                proof/evidence write, DB write from Workplane reads, memory
                mutation, scheduler, merge, publish, retry, replay, or deploy
                behavior.
              </p>
            </div>

            <WorkbenchDogfoodLoopSpineOverviewPanel
              preview={workbenchDogfoodLoopSpineOverview}
            />

            <section
              aria-label="Agent Workplane Phase 5C preview panels"
              style={panelGridStyle}
            >
              <ProjectionCandidatesPanel context={context} />
              <DeltaBatchPanel context={context} />
              <RunnerDeltaBatchPanel context={context} />
              <HandoffBuilderPreviewPanel context={context} />
              <HandoffCapsulePreviewPanel preview={handoffPreview} />
              <CodexLaunchCardPreviewPanel preview={handoffPreview} />
              <HandoffContextRelayRationalePanel
                rationale={handoffContextRationale}
              />
              <SelectedSessionDigestIntakePreviewPanel
                preview={selectedSessionDigestIntakePreview}
              />
              <SelectedSessionDigestIngestContractPreviewPanel
                preview={selectedSessionDigestIngestContractPreview}
              />
              <SelectedSessionDigestIngestOperatorDecisionPanel
                preview={selectedSessionDigestIngestOperatorDecisionPreview}
              />
              <SelectedSessionDigestIngestRecordReviewPanel
                review={selectedSessionDigestIngestRecordReview}
              />
              <ProjectHistoryIntakePreviewPanel
                preview={projectHistoryIntakePreview}
              />
              <ProjectHistoryIntakeDecisionPanel
                preview={projectHistoryIntakeOperatorDecisionPreview}
              />
              <ProjectHistoryIntakeRecordReviewPanel
                review={projectHistoryIntakeRecordReview}
              />
              <CodexResultReportIntakePreviewPanel
                preview={codexResultReportIntakePreview}
              />
              <CodexResultReportIntakeDecisionPanel
                preview={codexResultReportIntakeDecisionPreview}
              />
              <CodexResultReportIntakeRecordReviewPanel
                review={codexResultReportIntakeRecordReview}
              />
              <WorkEpisodeResidueCandidatePreviewPanel
                preview={workEpisodeResidueCandidatePreview}
              />
              <ExpectedObservedDeltaPreviewPanel
                preview={expectedObservedDeltaPreview}
              />
              <ExpectedObservedDeltaDecisionPanel
                preview={expectedObservedDeltaDecisionPreview}
              />
              <ExpectedObservedDeltaRecordReviewPanel
                review={expectedObservedDeltaRecordReview}
              />
              <ReuseOutcomeCandidateBridgePreviewPanel
                preview={reuseOutcomeCandidateBridgePreview}
              />
              <ReuseOutcomeBridgeDecisionPanel
                preview={reuseOutcomeBridgeOperatorDecisionPreview}
              />
              <ReuseOutcomeBridgeLedgerRecordReviewPanel
                review={reuseOutcomeBridgeLedgerRecordReview}
              />
              <DogfoodMetricSnapshotPreviewPanel
                preview={dogfoodMetricSnapshotPreview}
              />
              <DogfoodMetricSnapshotDecisionPanel
                preview={dogfoodMetricSnapshotDecisionPreview}
              />
              <DogfoodMetricSnapshotRecordReviewPanel
                review={dogfoodMetricSnapshotRecordReview}
              />
              <CodexResultFeedbackDraftPanel draft={codexResultFeedbackDraft} />
              <DogfoodReuseRecordProposalPanel
                proposal={dogfoodReuseRecordProposal}
              />
              <DogfoodReuseOperatorDecisionPreviewPanel
                preview={dogfoodReuseOperatorDecisionPreview}
              />
              <DogfoodMetricCandidatePreviewPanel
                preview={dogfoodMetricCandidatePreview}
              />
              <PerspectiveNextWorkCandidateUpdatePreviewPanel
                preview={perspectiveNextWorkCandidateUpdatePreview}
              />
              <MetricInformedContinuityRelayAdjustmentPreviewPanel
                preview={metricInformedContinuityRelayAdjustmentPreview}
              />
              <NextWorkSignalRefreshPreviewPanel
                preview={nextWorkSignalRefreshPreview}
              />
              <NextWorkSignalDecisionPanel
                preview={nextWorkSignalDecisionPreview}
              />
              <NextWorkSignalDecisionRecordReviewPanel
                review={nextWorkSignalDecisionRecordReview}
              />
              <PerspectiveRelayUpdateCandidateBridgePreviewPanel
                preview={perspectiveRelayUpdateCandidateBridgePreview}
              />
              <PerspectiveRelayUpdateDecisionPanel
                preview={perspectiveRelayUpdateDecisionPreview}
              />
              <PerspectiveRelayUpdateDecisionRecordReviewPanel
                review={perspectiveRelayUpdateDecisionRecordReview}
              />
              <PerspectiveRelayUpdateWriteContractPreviewPanel
                preview={perspectiveRelayUpdateWriteContractPreview}
              />
              <PerspectiveNextWorkBiasScopedWritePreviewPanel
                preview={perspectiveNextWorkBiasScopedWritePreview}
              />
              <PerspectiveNextWorkBiasRecordReviewPanel
                review={perspectiveNextWorkBiasRecordReview}
              />
              <PerspectiveUnitScopedWritePreviewPanel
                preview={perspectiveUnitScopedWritePreview}
              />
              <PerspectiveUnitRecordReviewPanel
                review={perspectiveUnitRecordReview}
              />
              <ContinuityRelayScopedWritePreviewPanel
                preview={continuityRelayScopedWritePreview}
              />
              <ContinuityRelayRecordReviewPanel
                review={continuityRelayRecordReview}
              />
              <CurrentWorkingPerspectiveUpdateContractPreviewPanel
                preview={currentWorkingPerspectiveUpdateContractPreview}
              />
              <CurrentWorkingPerspectiveUpdateContractDecisionPanel
                preview={currentWorkingPerspectiveUpdateContractDecisionPreview}
              />
              <CurrentWorkingPerspectiveUpdateContractRecordReviewPanel
                review={currentWorkingPerspectiveUpdateContractRecordReview}
              />
              <CurrentWorkingPerspectiveApplyPreviewPanel
                preview={currentWorkingPerspectiveApplyPreview}
              />
              <CurrentWorkingPerspectiveApplyDecisionPanel
                preview={currentWorkingPerspectiveApplyDecisionPreview}
              />
              <CurrentWorkingPerspectiveApplyRecordReviewPanel
                review={currentWorkingPerspectiveApplyRecordReview}
              />
              <AppliedCurrentWorkingPerspectivePanel
                read={appliedCurrentWorkingPerspectiveRead}
              />
              <CurrentWorkingPerspectiveRouteIntegrationContractPreviewPanel
                preview={currentWorkingPerspectiveRouteIntegrationContractPreview}
              />
              <CurrentWorkingPerspectiveRouteIntegrationContractDecisionPanel
                preview={
                  currentWorkingPerspectiveRouteIntegrationContractDecisionPreview
                }
              />
              <CurrentWorkingPerspectiveRouteIntegrationContractRecordReviewPanel
                review={currentWorkingPerspectiveRouteIntegrationContractRecordReview}
              />
              <HandoffContextUpdatePreviewPanel
                preview={handoffContextUpdatePreview}
              />
              <HandoffContextUpdateOperatorDecisionPreviewPanel
                preview={handoffContextUpdateOperatorDecisionPreview}
              />
              <HandoffContextUpdateRecordReviewPanel
                review={handoffContextUpdateRecordReview}
              />
              <HandoffContextApplyPreviewPanel
                preview={handoffContextApplyPreview}
              />
              <HandoffContextApplyOperatorDecisionPreviewPanel
                preview={handoffContextApplyOperatorDecisionPreview}
              />
              <HandoffContextApplyWriteContractPreviewPanel
                preview={handoffContextApplyWriteContractPreview}
              />
              <HandoffCopyExportPanel
                preview={handoffPreview}
                contextRelayRationale={handoffContextRationale}
              />
              <HandoffPreviewBoundaryCard
                capsuleAuthority={handoffPreview.capsule.authority_boundary}
                launchCardAuthority={
                  handoffPreview.launch_card.authority_boundary
                }
                boundaryNotes={handoffPreview.boundary_notes}
              />
              <AutonomyContractPreviewPanel preview={autonomyPreview} />
              <AutonomyBudgetPreviewPanel preview={autonomyPreview} />
              <AutonomyPolicyPreviewPanel preview={autonomyPreview} />
              <AutonomyRunPreviewPanel preview={autonomyPreview} />
              <AutonomyRunnerPreflightPreviewPanel
                preview={autonomyRunnerPreflightPreview}
              />
              <AutonomyBoundaryCard preview={autonomyPreview} />
              <AutonomyCopyExportPanel preview={autonomyPreview} />
              <RunPostmortemDetailPanel read={runPostmortemDetail} />
              <TraceDiagnosticsPanel context={context} />
            </section>
          </section>

        </section>
      </div>
    </div>
  );
}
