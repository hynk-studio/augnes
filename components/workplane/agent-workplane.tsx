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
import { GuideBriefMiniPanel } from "@/components/guide/guide-brief-mini-panel";
import { GuideIntentProjectionPanel } from "@/components/guide/guide-intent-projection-panel";
import { GuideWorkplaneDebugPanel } from "@/components/guide/guide-workplane-debug-panel";
import { CodexLaunchCardPreviewPanel } from "@/components/handoff/codex-launch-card-preview-panel";
import { HandoffCopyExportPanel } from "@/components/handoff/handoff-copy-export-panel";
import { HandoffCapsulePreviewPanel } from "@/components/handoff/handoff-capsule-preview-panel";
import { HandoffContextRelayRationalePanel } from "@/components/handoff/handoff-context-relay-rationale-panel";
import { HandoffContextUpdatePreviewPanel } from "@/components/handoff/handoff-context-update-preview-panel";
import { HandoffPreviewBoundaryCard } from "@/components/handoff/handoff-preview-boundary-card";
import { PerspectiveNextWorkCandidateUpdatePreviewPanel } from "@/components/perspective-next-work-candidate-update-preview-panel";
import { CurrentPerspectiveWorkplanePanel } from "@/components/workplane/current-perspective-workplane-panel";
import { DeltaBatchPanel } from "@/components/workplane/delta-batch-panel";
import { DeltaProjectionWorkplanePanel } from "@/components/workplane/delta-projection-workplane-panel";
import { EvidenceHandoffWorkplanePanel } from "@/components/workplane/evidence-handoff-workplane-panel";
import { HandoffBuilderPreviewPanel } from "@/components/workplane/handoff-builder-preview-panel";
import { ContinuityRelayWorkplanePanel } from "@/components/workplane/continuity-relay-workplane-panel";
import { MetricInformedContinuityRelayAdjustmentPreviewPanel } from "@/components/workplane/metric-informed-continuity-relay-adjustment-preview-panel";
import { ProjectionCandidatesPanel } from "@/components/workplane/projection-candidates-panel";
import { ReviewMemoryDetailPanel } from "@/components/workplane/review-memory-detail-panel";
import { ReviewQueueWorkplanePanel } from "@/components/workplane/review-queue-workplane-panel";
import { RunPostmortemDetailPanel } from "@/components/workplane/run-postmortem-detail-panel";
import { RunnerDeltaBatchPanel } from "@/components/workplane/runner-delta-batch-panel";
import { SourceRefBridgeDetailPanel } from "@/components/workplane/source-ref-bridge-detail-panel";
import { StateProposalReviewPanel } from "@/components/workplane/state-proposal-review-panel";
import { TraceDiagnosticsPanel } from "@/components/workplane/trace-diagnostics-panel";
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
import { buildDogfoodReuseOperatorDecisionPreview } from "@/lib/dogfooding/dogfood-reuse-operator-decision-preview";
import { buildDogfoodReuseRecordProposal } from "@/lib/dogfooding/dogfood-reuse-record-proposal";
import { readGuideBriefForWeb } from "@/lib/guide/read-guide-brief-for-web";
import {
  buildGuideWorkplaneDebugContext,
} from "@/lib/guide/guide-workplane-debug-context";
import {
  buildWorkplaneIntentProjection,
  WORKPLANE_INTENT_PROJECTION_DEFAULT_INPUT,
} from "@/lib/guide/workplane-intent-projection";
import { buildHandoffContextUpdatePreviewV01 } from "@/lib/handoff/handoff-context-update-preview";
import { readHandoffCapsulePreviewForWeb } from "@/lib/handoff/read-handoff-capsule-for-web";
import { buildHandoffContextRelayRationale } from "@/lib/handoff/handoff-context-relay-rationale";
import { readRunnerWorkplaneMetrics } from "@/lib/metrics/runner-workplane-metrics";
import { buildPerspectiveNextWorkCandidateUpdatePreviewV01 } from "@/lib/perspective/perspective-next-work-candidate-update-preview";
import { applyWorkplaneViewProjection } from "@/lib/workplane/apply-workplane-view-projection";
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
              <HandoffContextUpdatePreviewPanel
                preview={handoffContextUpdatePreview}
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
