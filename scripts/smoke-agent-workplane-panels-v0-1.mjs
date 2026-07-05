#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import {
  assertContainsAll,
  assertPackageScript,
  collectGitDiffFiles,
  collectUntrackedFiles,
  getBaseRangeChangedFiles,
  loadTextByFile,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const workbenchPageFile = "app/workbench/page.tsx";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const workplaneHeaderFile = "components/workplane/workplane-header.tsx";
const workplaneOverviewFile = "components/workplane/workplane-overview.tsx";
const workplaneBoundaryFile = "components/workplane/workplane-boundary-card.tsx";
const compatibilityPanelFile =
  "components/workplane/legacy-cockpit-compatibility-panel.tsx";
const augnesCockpitFile = "components/augnes-cockpit.tsx";
const cockpitPageFile = "app/cockpit/page.tsx";
const panelShellFile = "components/workplane/workplane-panel-shell.tsx";
const workQueuePanelFile = "components/workplane/work-queue-panel.tsx";
const continuityRelayPanelFile =
  "components/workplane/continuity-relay-workplane-panel.tsx";
const handoffRationaleTypeFile =
  "types/handoff-context-relay-rationale.ts";
const handoffRationaleHelperFile =
  "lib/handoff/handoff-context-relay-rationale.ts";
const handoffRationalePanelFile =
  "components/handoff/handoff-context-relay-rationale-panel.tsx";
const handoffCopyExportHelperFile =
  "lib/handoff/handoff-capsule-copy-export.ts";
const handoffCopyExportPanelFile =
  "components/handoff/handoff-copy-export-panel.tsx";
const handoffRationaleSmokeFile =
  "scripts/smoke-handoff-context-relay-rationale-v0-1.mjs";
const handoffCopyExportSmokeFile =
  "scripts/smoke-handoff-capsule-copy-export-v0-1.mjs";
const codexResultFeedbackTypeFile =
  "types/codex-result-feedback-draft.ts";
const codexResultFeedbackHelperFile =
  "lib/dogfooding/codex-result-feedback-draft.ts";
const codexResultFeedbackPanelFile =
  "components/codex-result-feedback-draft-panel.tsx";
const codexResultFeedbackSmokeFile =
  "scripts/smoke-codex-result-feedback-draft-v0-1.mjs";
const codexResultReportNormalizerFile =
  "lib/dogfooding/codex-result-report-normalizer.ts";
const codexResultReportFixtureFile =
  "fixtures/codex-result-report-ingestion.sample.v0.1.json";
const dogfoodReuseProposalTypeFile =
  "types/dogfood-reuse-record-proposal.ts";
const dogfoodReuseProposalHelperFile =
  "lib/dogfooding/dogfood-reuse-record-proposal.ts";
const dogfoodReuseProposalPanelFile =
  "components/dogfood-reuse-record-proposal-panel.tsx";
const dogfoodReuseProposalSmokeFile =
  "scripts/smoke-dogfood-reuse-record-proposal-v0-1.mjs";
const dogfoodReuseDecisionTypeFile =
  "types/dogfood-reuse-operator-decision-preview.ts";
const dogfoodReuseDecisionHelperFile =
  "lib/dogfooding/dogfood-reuse-operator-decision-preview.ts";
const dogfoodReuseDecisionPanelFile =
  "components/dogfood-reuse-operator-decision-preview-panel.tsx";
const dogfoodReuseDecisionSmokeFile =
  "scripts/smoke-dogfood-reuse-operator-decision-preview-v0-1.mjs";
const ledgerTypeFile = "types/handoff-reuse-outcome-ledger.ts";
const ledgerHelperFile = "lib/dogfooding/handoff-reuse-outcome-ledger.ts";
const ledgerRouteFile = "app/api/dogfooding/reuse-ledger/route.ts";
const ledgerSmokeFile =
  "scripts/smoke-handoff-reuse-outcome-ledger-write-v0-1.mjs";
const dogfoodMetricCandidateTypeFile =
  "types/dogfood-metric-candidate-preview.ts";
const dogfoodMetricCandidateHelperFile =
  "lib/dogfooding/dogfood-metric-candidate-preview.ts";
const dogfoodMetricCandidatePanelFile =
  "components/dogfood-metric-candidate-preview-panel.tsx";
const dogfoodMetricCandidateRouteFile =
  "app/api/dogfooding/reuse-ledger/metric-preview/route.ts";
const dogfoodMetricCandidateSmokeFile =
  "scripts/smoke-dogfood-metric-candidate-preview-v0-1.mjs";
const perspectiveNextWorkCandidateTypeFile =
  "types/perspective-next-work-candidate-update-preview.ts";
const perspectiveNextWorkCandidateHelperFile =
  "lib/perspective/perspective-next-work-candidate-update-preview.ts";
const perspectiveNextWorkCandidatePanelFile =
  "components/perspective-next-work-candidate-update-preview-panel.tsx";
const perspectiveNextWorkCandidateSmokeFile =
  "scripts/smoke-perspective-next-work-candidate-update-preview-v0-1.mjs";
const metricInformedContinuityRelayAdjustmentTypeFile =
  "types/metric-informed-continuity-relay-adjustment-preview.ts";
const metricInformedContinuityRelayAdjustmentHelperFile =
  "lib/workplane/metric-informed-continuity-relay-adjustment-preview.ts";
const metricInformedContinuityRelayAdjustmentPanelFile =
  "components/workplane/metric-informed-continuity-relay-adjustment-preview-panel.tsx";
const metricInformedContinuityRelayAdjustmentSmokeFile =
  "scripts/smoke-metric-informed-continuity-relay-adjustment-preview-v0-1.mjs";
const handoffContextUpdatePreviewTypeFile =
  "types/handoff-context-update-preview.ts";
const handoffContextUpdatePreviewHelperFile =
  "lib/handoff/handoff-context-update-preview.ts";
const handoffContextUpdatePreviewPanelFile =
  "components/handoff/handoff-context-update-preview-panel.tsx";
const handoffContextUpdatePreviewSmokeFile =
  "scripts/smoke-handoff-context-update-preview-v0-1.mjs";
const handoffContextUpdateOperatorDecisionTypeFile =
  "types/handoff-context-update-operator-decision-preview.ts";
const handoffContextUpdateOperatorDecisionHelperFile =
  "lib/handoff/handoff-context-update-operator-decision-preview.ts";
const handoffContextUpdateOperatorDecisionPanelFile =
  "components/handoff/handoff-context-update-operator-decision-preview-panel.tsx";
const handoffContextUpdateOperatorDecisionSmokeFile =
  "scripts/smoke-handoff-context-update-operator-decision-preview-v0-1.mjs";
const handoffContextUpdateWriteTypeFile =
  "types/handoff-context-update-write.ts";
const handoffContextUpdateWriteHelperFile =
  "lib/handoff/handoff-context-update-write.ts";
const handoffContextUpdateWriteRouteFile =
  "app/api/handoff/context-updates/route.ts";
const handoffContextUpdateWriteSmokeFile =
  "scripts/smoke-handoff-context-update-write-v0-1.mjs";
const handoffContextUpdateRecordReviewTypeFile =
  "types/handoff-context-update-record-review.ts";
const handoffContextUpdateRecordReviewHelperFile =
  "lib/handoff/handoff-context-update-record-review.ts";
const handoffContextUpdateRecordReviewReadForWebHelperFile =
  "lib/handoff/read-handoff-context-update-record-review-for-web.ts";
const handoffContextUpdateRecordReviewPanelFile =
  "components/handoff/handoff-context-update-record-review-panel.tsx";
const handoffContextUpdateRecordReviewSmokeFile =
  "scripts/smoke-handoff-context-update-record-review-v0-1.mjs";
const handoffContextUpdateRecordReviewDbReadSmokeFile =
  "scripts/smoke-handoff-context-update-record-review-db-read-v0-1.mjs";
const handoffContextApplyPreviewTypeFile =
  "types/handoff-context-apply-preview.ts";
const handoffContextApplyPreviewHelperFile =
  "lib/handoff/handoff-context-apply-preview.ts";
const handoffContextApplyPreviewPanelFile =
  "components/handoff/handoff-context-apply-preview-panel.tsx";
const handoffContextApplyPreviewSmokeFile =
  "scripts/smoke-handoff-context-apply-preview-v0-1.mjs";
const handoffContextApplyDecisionTypeFile =
  "types/handoff-context-apply-operator-decision-preview.ts";
const handoffContextApplyDecisionHelperFile =
  "lib/handoff/handoff-context-apply-operator-decision-preview.ts";
const handoffContextApplyDecisionPanelFile =
  "components/handoff/handoff-context-apply-operator-decision-preview-panel.tsx";
const handoffContextApplyDecisionSmokeFile =
  "scripts/smoke-handoff-context-apply-operator-decision-preview-v0-1.mjs";
const handoffContextApplyWriteContractTypeFile =
  "types/handoff-context-apply-write-contract-preview.ts";
const handoffContextApplyWriteContractHelperFile =
  "lib/handoff/handoff-context-apply-write-contract-preview.ts";
const handoffContextApplyWriteContractPanelFile =
  "components/handoff/handoff-context-apply-write-contract-preview-panel.tsx";
const handoffContextApplyWriteContractSmokeFile =
  "scripts/smoke-handoff-context-apply-write-contract-preview-v0-1.mjs";
const selectedSessionDigestIntakeTypeFile =
  "types/selected-session-digest-intake-preview.ts";
const selectedSessionDigestIntakeHelperFile =
  "lib/intake/selected-session-digest-intake-preview.ts";
const selectedSessionDigestIntakePanelFile =
  "components/intake/selected-session-digest-intake-preview-panel.tsx";
const selectedSessionDigestIntakeSmokeFile =
  "scripts/smoke-selected-session-digest-intake-preview-v0-1.mjs";
const selectedSessionDigestIngestContractTypeFile =
  "types/selected-session-digest-ingest-contract-preview.ts";
const selectedSessionDigestIngestContractHelperFile =
  "lib/intake/selected-session-digest-ingest-contract-preview.ts";
const selectedSessionDigestIngestContractPanelFile =
  "components/intake/selected-session-digest-ingest-contract-preview-panel.tsx";
const selectedSessionDigestIngestContractSmokeFile =
  "scripts/smoke-selected-session-digest-ingest-contract-preview-v0-1.mjs";
const selectedSessionDigestIngestOperatorDecisionTypeFile =
  "types/selected-session-digest-ingest-operator-decision.ts";
const selectedSessionDigestIngestOperatorDecisionHelperFile =
  "lib/intake/selected-session-digest-ingest-operator-decision.ts";
const selectedSessionDigestIngestOperatorDecisionPanelFile =
  "components/intake/selected-session-digest-ingest-operator-decision-panel.tsx";
const selectedSessionDigestIngestDecisionWriteTypeFile =
  "types/selected-session-digest-ingest-decision-write.ts";
const selectedSessionDigestIngestDecisionWriteHelperFile =
  "lib/intake/selected-session-digest-ingest-decision-write.ts";
const selectedSessionDigestIngestDecisionWriteRouteFile =
  "app/api/intake/selected-session-digest/ingest-decisions/route.ts";
const selectedSessionDigestIngestOperatorDecisionSmokeFile =
  "scripts/smoke-selected-session-digest-ingest-operator-decision-v0-1.mjs";
const selectedSessionDigestIngestWriteTypeFile =
  "types/selected-session-digest-ingest-write.ts";
const selectedSessionDigestIngestWriteHelperFile =
  "lib/intake/selected-session-digest-ingest-write.ts";
const selectedSessionDigestIngestWriteRouteFile =
  "app/api/intake/selected-session-digest/ingest-records/route.ts";
const selectedSessionDigestIngestRecordReviewTypeFile =
  "types/selected-session-digest-ingest-record-review.ts";
const selectedSessionDigestIngestRecordReviewHelperFile =
  "lib/intake/selected-session-digest-ingest-record-review.ts";
const selectedSessionDigestIngestRecordReviewForWebFile =
  "lib/intake/read-selected-session-digest-ingest-record-review-for-web.ts";
const selectedSessionDigestIngestRecordReviewPanelFile =
  "components/intake/selected-session-digest-ingest-record-review-panel.tsx";
const selectedSessionDigestDurableIngestRecordSmokeFile =
  "scripts/smoke-selected-session-digest-durable-ingest-record-v0-1.mjs";
const candidateIngressNormalizerTypeFile =
  "types/candidate-ingress-normalizer.ts";
const candidateIngressNormalizerHelperFile =
  "lib/intake/candidate-ingress-normalizer.ts";
const projectHistoryIntakePreviewTypeFile =
  "types/project-history-intake-preview.ts";
const projectHistoryIntakePreviewHelperFile =
  "lib/intake/project-history-intake-preview.ts";
const projectHistoryIntakePreviewPanelFile =
  "components/intake/project-history-intake-preview-panel.tsx";
const projectHistoryIntakeDecisionTypeFile =
  "types/project-history-intake-decision.ts";
const projectHistoryIntakeDecisionHelperFile =
  "lib/intake/project-history-intake-decision.ts";
const projectHistoryIntakeDecisionPanelFile =
  "components/intake/project-history-intake-decision-panel.tsx";
const projectHistoryIntakeWriteTypeFile =
  "types/project-history-intake-write.ts";
const projectHistoryIntakeWriteHelperFile =
  "lib/intake/project-history-intake-write.ts";
const projectHistoryIntakeWriteRouteFile =
  "app/api/intake/project-history/records/route.ts";
const projectHistoryIntakeRecordReviewTypeFile =
  "types/project-history-intake-record-review.ts";
const projectHistoryIntakeRecordReviewHelperFile =
  "lib/intake/project-history-intake-record-review.ts";
const projectHistoryIntakeRecordReviewForWebFile =
  "lib/intake/read-project-history-intake-record-review-for-web.ts";
const projectHistoryIntakeRecordReviewPanelFile =
  "components/intake/project-history-intake-record-review-panel.tsx";
const projectHistoryIntakeSmokeFile =
  "scripts/smoke-project-history-intake-candidate-ledger-v0-1.mjs";
const codexResultReportIntakePreviewTypeFile =
  "types/codex-result-report-intake-preview.ts";
const codexResultReportIntakePreviewHelperFile =
  "lib/intake/codex-result-report-intake-preview.ts";
const codexResultReportIntakePreviewPanelFile =
  "components/intake/codex-result-report-intake-preview-panel.tsx";
const codexResultReportIntakeDecisionTypeFile =
  "types/codex-result-report-intake-decision.ts";
const codexResultReportIntakeDecisionHelperFile =
  "lib/intake/codex-result-report-intake-decision.ts";
const codexResultReportIntakeDecisionPanelFile =
  "components/intake/codex-result-report-intake-decision-panel.tsx";
const codexResultReportIntakeWriteTypeFile =
  "types/codex-result-report-intake-write.ts";
const codexResultReportIntakeWriteHelperFile =
  "lib/intake/codex-result-report-intake-write.ts";
const codexResultReportIntakeWriteRouteFile =
  "app/api/intake/codex-result-report/records/route.ts";
const codexResultReportIntakeRecordReviewTypeFile =
  "types/codex-result-report-intake-record-review.ts";
const codexResultReportIntakeRecordReviewHelperFile =
  "lib/intake/codex-result-report-intake-record-review.ts";
const codexResultReportIntakeRecordReviewForWebFile =
  "lib/intake/read-codex-result-report-intake-record-review-for-web.ts";
const codexResultReportIntakeRecordReviewPanelFile =
  "components/intake/codex-result-report-intake-record-review-panel.tsx";
const workEpisodeResidueCandidatePreviewTypeFile =
  "types/work-episode-residue-candidate-preview.ts";
const workEpisodeResidueCandidatePreviewHelperFile =
  "lib/workplane/work-episode-residue-candidate-preview.ts";
const workEpisodeResidueCandidatePreviewPanelFile =
  "components/workplane/work-episode-residue-candidate-preview-panel.tsx";
const codexResultReportIntakeResidueSmokeFile =
  "scripts/smoke-codex-result-report-intake-work-episode-residue-v0-1.mjs";
const expectedObservedDeltaPreviewTypeFile =
  "types/expected-observed-delta-preview.ts";
const expectedObservedDeltaPreviewHelperFile =
  "lib/dogfooding/expected-observed-delta-preview.ts";
const expectedObservedDeltaPreviewPanelFile =
  "components/dogfooding/expected-observed-delta-preview-panel.tsx";
const expectedObservedDeltaDecisionTypeFile =
  "types/expected-observed-delta-decision.ts";
const expectedObservedDeltaDecisionHelperFile =
  "lib/dogfooding/expected-observed-delta-decision.ts";
const expectedObservedDeltaDecisionPanelFile =
  "components/dogfooding/expected-observed-delta-decision-panel.tsx";
const expectedObservedDeltaWriteTypeFile =
  "types/expected-observed-delta-write.ts";
const expectedObservedDeltaWriteHelperFile =
  "lib/dogfooding/expected-observed-delta-write.ts";
const expectedObservedDeltaWriteRouteFile =
  "app/api/dogfooding/expected-observed-deltas/route.ts";
const expectedObservedDeltaRecordReviewTypeFile =
  "types/expected-observed-delta-record-review.ts";
const expectedObservedDeltaRecordReviewHelperFile =
  "lib/dogfooding/expected-observed-delta-record-review.ts";
const expectedObservedDeltaRecordReviewForWebFile =
  "lib/dogfooding/read-expected-observed-delta-record-review-for-web.ts";
const expectedObservedDeltaRecordReviewPanelFile =
  "components/dogfooding/expected-observed-delta-record-review-panel.tsx";
const reuseOutcomeCandidateBridgeTypeFile =
  "types/reuse-outcome-candidate-bridge-preview.ts";
const reuseOutcomeCandidateBridgeHelperFile =
  "lib/dogfooding/reuse-outcome-candidate-bridge-preview.ts";
const reuseOutcomeCandidateBridgePanelFile =
  "components/dogfooding/reuse-outcome-candidate-bridge-preview-panel.tsx";
const expectedObservedDeltaBridgeSmokeFile =
  "scripts/smoke-expected-observed-delta-reuse-outcome-bridge-v0-1.mjs";
const reuseOutcomeBridgeDecisionTypeFile =
  "types/reuse-outcome-bridge-decision.ts";
const reuseOutcomeBridgeDecisionHelperFile =
  "lib/dogfooding/reuse-outcome-bridge-decision.ts";
const reuseOutcomeBridgeDecisionPanelFile =
  "components/dogfooding/reuse-outcome-bridge-decision-panel.tsx";
const reuseOutcomeBridgeLedgerWriteTypeFile =
  "types/reuse-outcome-bridge-ledger-write.ts";
const reuseOutcomeBridgeLedgerWriteHelperFile =
  "lib/dogfooding/reuse-outcome-bridge-ledger-write.ts";
const reuseOutcomeBridgeLedgerRouteFile =
  "app/api/dogfooding/reuse-outcome-bridge-ledger/route.ts";
const reuseOutcomeBridgeLedgerRecordReviewTypeFile =
  "types/reuse-outcome-bridge-ledger-record-review.ts";
const reuseOutcomeBridgeLedgerRecordReviewHelperFile =
  "lib/dogfooding/reuse-outcome-bridge-ledger-record-review.ts";
const reuseOutcomeBridgeLedgerRecordReviewForWebFile =
  "lib/dogfooding/read-reuse-outcome-bridge-ledger-record-review-for-web.ts";
const reuseOutcomeBridgeLedgerRecordReviewPanelFile =
  "components/dogfooding/reuse-outcome-bridge-ledger-record-review-panel.tsx";
const reuseOutcomeBridgeLedgerIntegrationSmokeFile =
  "scripts/smoke-reuse-outcome-bridge-ledger-integration-v0-1.mjs";
const dogfoodMetricSnapshotPreviewTypeFile =
  "types/dogfood-metric-snapshot-preview.ts";
const dogfoodMetricSnapshotPreviewHelperFile =
  "lib/dogfooding/dogfood-metric-snapshot-preview.ts";
const dogfoodMetricSnapshotPreviewPanelFile =
  "components/dogfooding/dogfood-metric-snapshot-preview-panel.tsx";
const dogfoodMetricSnapshotDecisionTypeFile =
  "types/dogfood-metric-snapshot-decision.ts";
const dogfoodMetricSnapshotDecisionHelperFile =
  "lib/dogfooding/dogfood-metric-snapshot-decision.ts";
const dogfoodMetricSnapshotDecisionPanelFile =
  "components/dogfooding/dogfood-metric-snapshot-decision-panel.tsx";
const dogfoodMetricSnapshotWriteTypeFile =
  "types/dogfood-metric-snapshot-write.ts";
const dogfoodMetricSnapshotWriteHelperFile =
  "lib/dogfooding/dogfood-metric-snapshot-write.ts";
const dogfoodMetricSnapshotRouteFile =
  "app/api/dogfooding/metric-snapshots/route.ts";
const dogfoodMetricSnapshotRecordReviewTypeFile =
  "types/dogfood-metric-snapshot-record-review.ts";
const dogfoodMetricSnapshotRecordReviewHelperFile =
  "lib/dogfooding/dogfood-metric-snapshot-record-review.ts";
const dogfoodMetricSnapshotRecordReviewForWebFile =
  "lib/dogfooding/read-dogfood-metric-snapshot-record-review-for-web.ts";
const dogfoodMetricSnapshotRecordReviewPanelFile =
  "components/dogfooding/dogfood-metric-snapshot-record-review-panel.tsx";
const nextWorkSignalRefreshTypeFile =
  "types/next-work-signal-refresh-preview.ts";
const nextWorkSignalRefreshHelperFile =
  "lib/workplane/next-work-signal-refresh-preview.ts";
const nextWorkSignalRefreshPanelFile =
  "components/workplane/next-work-signal-refresh-preview-panel.tsx";
const dogfoodMetricSnapshotNextWorkRefreshSmokeFile =
  "scripts/smoke-dogfood-metric-snapshot-next-work-refresh-v0-1.mjs";
const nextWorkSignalDecisionTypeFile =
  "types/next-work-signal-decision.ts";
const nextWorkSignalDecisionHelperFile =
  "lib/workplane/next-work-signal-decision.ts";
const nextWorkSignalDecisionPanelFile =
  "components/workplane/next-work-signal-decision-panel.tsx";
const nextWorkSignalDecisionWriteTypeFile =
  "types/next-work-signal-decision-write.ts";
const nextWorkSignalDecisionWriteHelperFile =
  "lib/workplane/next-work-signal-decision-write.ts";
const nextWorkSignalDecisionRouteFile =
  "app/api/workplane/next-work-signal-decisions/route.ts";
const nextWorkSignalDecisionRecordReviewTypeFile =
  "types/next-work-signal-decision-record-review.ts";
const nextWorkSignalDecisionRecordReviewHelperFile =
  "lib/workplane/next-work-signal-decision-record-review.ts";
const nextWorkSignalDecisionRecordReviewForWebFile =
  "lib/workplane/read-next-work-signal-decision-record-review-for-web.ts";
const nextWorkSignalDecisionRecordReviewPanelFile =
  "components/workplane/next-work-signal-decision-record-review-panel.tsx";
const perspectiveRelayUpdateCandidateBridgeTypeFile =
  "types/perspective-relay-update-candidate-bridge-preview.ts";
const perspectiveRelayUpdateCandidateBridgeHelperFile =
  "lib/workplane/perspective-relay-update-candidate-bridge-preview.ts";
const perspectiveRelayUpdateCandidateBridgePanelFile =
  "components/workplane/perspective-relay-update-candidate-bridge-preview-panel.tsx";
const nextWorkSignalDecisionPerspectiveRelayBridgeSmokeFile =
  "scripts/smoke-next-work-signal-decision-perspective-relay-bridge-v0-1.mjs";
const workbenchDogfoodLoopSpineOverviewTypeFile =
  "types/workbench-dogfood-loop-spine-overview.ts";
const workbenchDogfoodLoopSpineOverviewHelperFile =
  "lib/workplane/workbench-dogfood-loop-spine-overview.ts";
const workbenchDogfoodLoopSpineOverviewPanelFile =
  "components/workplane/workbench-dogfood-loop-spine-overview-panel.tsx";
const workbenchDogfoodLoopSpineOverviewSmokeFile =
  "scripts/smoke-workbench-dogfood-loop-spine-overview-v0-1.mjs";
const currentPerspectivePanelFile =
  "components/workplane/current-perspective-workplane-panel.tsx";
const deltaProjectionPanelFile =
  "components/workplane/delta-projection-workplane-panel.tsx";
const reviewQueuePanelFile =
  "components/workplane/review-queue-workplane-panel.tsx";
const evidenceHandoffPanelFile =
  "components/workplane/evidence-handoff-workplane-panel.tsx";
const workplaneInspectorFile = "components/workplane/workplane-inspector.tsx";
const contextReaderFile = "lib/workplane/read-workplane-context.ts";
const agentWorkplaneDoc = "docs/AGENT_WORKPLANE_V0_1.md";
const packageJsonFile = "package.json";
const indexDoc = "docs/00_INDEX_LATEST.md";
const shellSmokeFile = "scripts/smoke-agent-workplane-shell-v0-1.mjs";
const humanSurfaceSmokeFile = "scripts/smoke-human-surface-home-v0-1.mjs";
const perspectiveSmokeFile =
  "scripts/smoke-perspective-human-timeline-v0-1.mjs";
const smokeFile = "scripts/smoke-agent-workplane-panels-v0-1.mjs";

const followOnHistoricalSmokeCompatibilityFiles = [
  "scripts/smoke-augnes-delta-contract-v0-1.mjs",
  "scripts/smoke-augnes-delta-projection-v0-1.mjs",
  "scripts/smoke-augnes-delta-projection-route-v0-1.mjs",
  "scripts/smoke-current-working-perspective-v0-1.mjs",
  "scripts/smoke-current-working-perspective-route-v0-1.mjs",
];

const followOnAgentWorkplaneProjectionHandoffFiles = [
  "components/workplane/projection-candidates-panel.tsx",
  "components/workplane/delta-batch-panel.tsx",
  "components/workplane/handoff-builder-preview-panel.tsx",
  "components/workplane/run-postmortem-skeleton-panel.tsx",
  "components/workplane/trace-diagnostics-panel.tsx",
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
];

const followOnAgentWorkplaneCleanupHardeningFiles = [
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
];

const followOnAgentWorkplaneCockpitInheritanceFiles = [
  "docs/AGENT_WORKPLANE_COCKPIT_CAPABILITY_INVENTORY_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_ABSORPTION_MAP_V0_1.md",
  "scripts/smoke-agent-workplane-cockpit-inheritance-v0-1.mjs",
];

const followOnAgentWorkplaneNodeContractFiles = [
  "types/agent-workplane-node.ts",
  "lib/workplane/workplane-node-context.ts",
  "docs/AGENT_WORKPLANE_NODE_CONTRACT_V0_1.md",
  "scripts/smoke-agent-workplane-node-contract-v0-1.mjs",
  compatibilityPanelFile,
  panelShellFile,
  workQueuePanelFile,
  currentPerspectivePanelFile,
  deltaProjectionPanelFile,
  reviewQueuePanelFile,
  evidenceHandoffPanelFile,
  workplaneInspectorFile,
  "components/workplane/projection-candidates-panel.tsx",
  "components/workplane/delta-batch-panel.tsx",
  "components/workplane/handoff-builder-preview-panel.tsx",
  "components/workplane/run-postmortem-skeleton-panel.tsx",
  "components/workplane/trace-diagnostics-panel.tsx",
  agentWorkplaneDoc,
  indexDoc,
  packageJsonFile,
];

const followOnWorkplaneRunnerDeltaBatchIntegrationFiles = [
  "lib/workplane/read-runner-delta-batches-for-workplane.ts",
  "components/workplane/runner-delta-batch-panel.tsx",
  "docs/AGENT_WORKPLANE_RUNNER_DELTABATCH_INTEGRATION_V0_1.md",
  "scripts/smoke-workplane-runner-deltabatch-integration-v0-1.mjs",
  contextReaderFile,
  agentWorkplaneFile,
  "components/workplane/delta-batch-panel.tsx",
  agentWorkplaneDoc,
  "docs/AGENT_WORKPLANE_NODE_CONTRACT_V0_1.md",
  indexDoc,
  packageJsonFile,
  "scripts/smoke-agent-workplane-node-contract-v0-1.mjs",
];

const followOnGuideBriefCoreFiles = [
  "docs/GUIDEBRIEF_CONTRACT_V0_1.md",
  "types/guide-brief.ts",
  "lib/guide/guide-brief.ts",
  "fixtures/guide-brief.sample.v0.1.json",
  "scripts/smoke-guide-brief-v0-1.mjs",
];

const followOnGuideBriefRouteFiles = [
  "app/api/augnes/read/guide-brief/route.ts",
  "lib/guide/guide-brief-source.ts",
  "scripts/smoke-guide-brief-route-v0-1.mjs",
];

const followOnGuideWorkplaneDebugContextFiles = [
  "types/guide-debug-context.ts",
  "lib/guide/guide-workplane-debug-context.ts",
  "components/guide/guide-workplane-debug-panel.tsx",
  "docs/GUIDEBRIEF_WORKPLANE_DEBUG_CONTEXT_V0_1.md",
  "scripts/smoke-guide-workplane-debug-context-v0-1.mjs",
  "components/workplane/agent-workplane.tsx",
  "docs/GUIDEBRIEF_CONTRACT_V0_1.md",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/AGENT_WORKPLANE_NODE_CONTRACT_V0_1.md",
  "docs/AGENT_WORKPLANE_RUNNER_DELTABATCH_INTEGRATION_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
  "scripts/smoke-guide-brief-v0-1.mjs",
  "scripts/smoke-guide-brief-route-v0-1.mjs",
  "scripts/smoke-agent-workplane-node-contract-v0-1.mjs",
  "scripts/smoke-workplane-runner-deltabatch-integration-v0-1.mjs",
  "scripts/smoke-agent-workplane-cockpit-inheritance-v0-1.mjs",
  "scripts/smoke-agent-workplane-shell-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
];

const followOnGuideBriefIntentProjectionFiles = [
  "types/workplane-intent-projection.ts",
  "lib/guide/workplane-intent-projection.ts",
  "lib/workplane/apply-workplane-view-projection.ts",
  "components/workplane/workplane-intent-mode-panel.tsx",
  "components/guide/guide-intent-projection-panel.tsx",
  "docs/GUIDEBRIEF_INTENT_PROJECTION_V0_1.md",
  "scripts/smoke-guidebrief-intent-projection-v0-1.mjs",
  "components/workplane/agent-workplane.tsx",
  "docs/GUIDEBRIEF_CONTRACT_V0_1.md",
  "docs/GUIDEBRIEF_WORKPLANE_DEBUG_CONTEXT_V0_1.md",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/AGENT_WORKPLANE_NODE_CONTRACT_V0_1.md",
  "docs/AGENT_WORKPLANE_RUNNER_DELTABATCH_INTEGRATION_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
  "scripts/smoke-guide-workplane-debug-context-v0-1.mjs",
  "scripts/smoke-guide-brief-v0-1.mjs",
  "scripts/smoke-guide-brief-route-v0-1.mjs",
  "scripts/smoke-agent-workplane-node-contract-v0-1.mjs",
  "scripts/smoke-workplane-runner-deltabatch-integration-v0-1.mjs",
  "scripts/smoke-agent-workplane-cockpit-inheritance-v0-1.mjs",
  "scripts/smoke-agent-workplane-shell-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
];

const followOnRunnerWorkplaneMetricsFiles = [
  "types/augnes-workflow-metrics.ts",
  "lib/metrics/runner-workplane-metrics.ts",
  "components/workplane/workplane-metrics-panel.tsx",
  "docs/AUGNES_WORKFLOW_METRICS_V0_1.md",
  "scripts/smoke-runner-workplane-metrics-v0-1.mjs",
  "components/workplane/agent-workplane.tsx",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/GUIDEBRIEF_INTENT_PROJECTION_V0_1.md",
  "docs/AGENT_WORKPLANE_COCKPIT_CAPABILITY_INVENTORY_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_ABSORPTION_MAP_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
  "scripts/smoke-guidebrief-intent-projection-v0-1.mjs",
  "scripts/smoke-guide-workplane-debug-context-v0-1.mjs",
  "scripts/smoke-guide-brief-v0-1.mjs",
  "scripts/smoke-guide-brief-route-v0-1.mjs",
  "scripts/smoke-agent-workplane-node-contract-v0-1.mjs",
  "scripts/smoke-workplane-runner-deltabatch-integration-v0-1.mjs",
  "scripts/smoke-agent-workplane-cockpit-inheritance-v0-1.mjs",
  "scripts/smoke-agent-workplane-shell-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
];

const followOnAugnesDogfoodFiles = [
  "types/augnes-dogfood.ts",
  "lib/dogfood/augnes-on-augnes-dogfood.ts",
  "docs/AUGNES_ON_AUGNES_DOGFOOD_V0_1.md",
  "scripts/run-augnes-on-augnes-dogfood-v0-1.mjs",
  "scripts/smoke-augnes-on-augnes-dogfood-v0-1.mjs",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/GUIDEBRIEF_INTENT_PROJECTION_V0_1.md",
  "docs/AUGNES_WORKFLOW_METRICS_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
  "types/augnes-dogfood-metrics-baseline.ts",
  "lib/dogfood/augnes-dogfood-metrics-baseline.ts",
  "docs/AUGNES_DOGFOOD_METRICS_BASELINE_V0_2.md",
  "scripts/run-augnes-dogfood-metrics-baseline-v0-2.mjs",
  "scripts/smoke-augnes-dogfood-metrics-baseline-v0-2.mjs",

];

const followOnLegacyCockpitShrinkPlanFiles = [
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_PLAN_V0_1.md",
  "scripts/smoke-agent-workplane-legacy-cockpit-shrink-plan-v0-1.mjs",
  "docs/AGENT_WORKPLANE_COCKPIT_CAPABILITY_INVENTORY_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_ABSORPTION_MAP_V0_1.md",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/AUGNES_WORKFLOW_METRICS_V0_1.md",
  "docs/AUGNES_ON_AUGNES_DOGFOOD_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
];

const followOnWorkplaneNativeBrowserRegressionFiles = [
  "types/workplane-browser-regression.ts",
  "lib/workplane/workplane-browser-regression.ts",
  "docs/AGENT_WORKPLANE_NATIVE_REPLACEMENT_BROWSER_REGRESSION_V0_1.md",
  "scripts/run-workplane-native-browser-regression-v0-1.mjs",
  "scripts/smoke-workplane-native-browser-regression-v0-1.mjs",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_PLAN_V0_1.md",
  "docs/AUGNES_ON_AUGNES_DOGFOOD_V0_1.md",
  "docs/AUGNES_WORKFLOW_METRICS_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
];

const followOnAgentWorkplaneBridgeTraceDetailFiles = [
  "types/workplane-bridge-trace-detail.ts",
  "lib/workplane/workplane-bridge-trace-detail.ts",
  "components/workplane/source-ref-bridge-detail-panel.tsx",
  "docs/AGENT_WORKPLANE_BRIDGE_TRACE_DETAIL_V0_1.md",
  "scripts/smoke-agent-workplane-bridge-trace-detail-v0-1.mjs",
  "components/workplane/agent-workplane.tsx",
  "lib/workplane/workplane-node-context.ts",
  "lib/workplane/workplane-browser-regression.ts",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_ABSORPTION_MAP_V0_1.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_PLAN_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_REPLACEMENT_BROWSER_REGRESSION_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
];
const followOnAgentWorkplaneReviewMemoryDetailFiles = [
  "types/workplane-review-memory-detail.ts",
  "lib/workplane/workplane-review-memory-detail.ts",
  "components/workplane/review-memory-detail-panel.tsx",
  "docs/AGENT_WORKPLANE_REVIEW_MEMORY_DETAIL_V0_1.md",
  "scripts/smoke-agent-workplane-review-memory-detail-v0-1.mjs",
  "components/workplane/agent-workplane.tsx",
  "types/agent-workplane-node.ts",
  "lib/workplane/workplane-node-context.ts",
  "lib/workplane/workplane-browser-regression.ts",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_ABSORPTION_MAP_V0_1.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_PLAN_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_REPLACEMENT_BROWSER_REGRESSION_V0_1.md",
  "docs/AGENT_WORKPLANE_BRIDGE_TRACE_DETAIL_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
];

const followOnAgentWorkplaneRunPostmortemDetailFiles = [
  "types/workplane-run-postmortem-detail.ts",
  "lib/workplane/workplane-run-postmortem-detail.ts",
  "components/workplane/run-postmortem-detail-panel.tsx",
  "docs/AGENT_WORKPLANE_RUN_POSTMORTEM_DETAIL_V0_1.md",
  "scripts/smoke-agent-workplane-run-postmortem-detail-v0-1.mjs",
  "components/workplane/agent-workplane.tsx",
  "lib/workplane/workplane-node-context.ts",
  "lib/workplane/workplane-browser-regression.ts",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_ABSORPTION_MAP_V0_1.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_PLAN_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_REPLACEMENT_BROWSER_REGRESSION_V0_1.md",
  "docs/AGENT_WORKPLANE_BRIDGE_TRACE_DETAIL_V0_1.md",
  "docs/AGENT_WORKPLANE_REVIEW_MEMORY_DETAIL_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
];

const followOnWorkplaneContinuityRelayFiles = [
  "types/workplane-continuity-relay.ts",
  "lib/workplane/workplane-continuity-relay.ts",
  "components/workplane/continuity-relay-workplane-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "lib/workplane/read-workplane-context.ts",
  "types/agent-workplane-node.ts",
  "lib/workplane/workplane-node-context.ts",
  "scripts/smoke-workplane-continuity-relay-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-agent-workplane-node-contract-v0-1.mjs",
  "package.json",
];

const followOnHandoffContextRelayRationaleFiles = [
  handoffRationaleTypeFile,
  handoffRationaleHelperFile,
  handoffRationalePanelFile,
  handoffCopyExportHelperFile,
  handoffCopyExportPanelFile,
  "components/workplane/agent-workplane.tsx",
  handoffRationaleSmokeFile,
  handoffCopyExportSmokeFile,
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-workplane-continuity-relay-v0-1.mjs",
  "package.json",
];

const followOnCodexResultFeedbackDraftFiles = [
  codexResultFeedbackTypeFile,
  codexResultFeedbackHelperFile,
  codexResultFeedbackPanelFile,
  agentWorkplaneFile,
  codexResultFeedbackSmokeFile,
  smokeFile,
  packageJsonFile,
];

const followOnDogfoodReuseRecordProposalFiles = [
  dogfoodReuseProposalTypeFile,
  dogfoodReuseProposalHelperFile,
  dogfoodReuseProposalPanelFile,
  dogfoodReuseProposalSmokeFile,
  agentWorkplaneFile,
  packageJsonFile,
  smokeFile,
  codexResultFeedbackSmokeFile,
  handoffRationaleSmokeFile,
  "scripts/smoke-workplane-continuity-relay-v0-1.mjs",
];

const followOnDogfoodReuseOperatorDecisionPreviewFiles = [
  dogfoodReuseDecisionTypeFile,
  dogfoodReuseDecisionHelperFile,
  dogfoodReuseDecisionPanelFile,
  dogfoodReuseDecisionSmokeFile,
  agentWorkplaneFile,
  packageJsonFile,
  smokeFile,
  dogfoodReuseProposalSmokeFile,
  codexResultFeedbackSmokeFile,
  handoffRationaleSmokeFile,
  "scripts/smoke-workplane-continuity-relay-v0-1.mjs",
];

const followOnHandoffReuseOutcomeLedgerWriteFiles = [
  ledgerTypeFile,
  ledgerHelperFile,
  ledgerRouteFile,
  ledgerSmokeFile,
  dogfoodReuseDecisionTypeFile,
  dogfoodReuseDecisionHelperFile,
  dogfoodReuseDecisionSmokeFile,
  dogfoodReuseProposalSmokeFile,
  codexResultFeedbackSmokeFile,
  packageJsonFile,
];

const followOnDogfoodMetricCandidatePreviewFiles = [
  dogfoodMetricCandidateTypeFile,
  dogfoodMetricCandidateHelperFile,
  dogfoodMetricCandidatePanelFile,
  dogfoodMetricCandidateRouteFile,
  dogfoodMetricCandidateSmokeFile,
  agentWorkplaneFile,
  smokeFile,
  packageJsonFile,
];

const followOnPerspectiveNextWorkCandidateUpdatePreviewFiles = [
  perspectiveNextWorkCandidateTypeFile,
  perspectiveNextWorkCandidateHelperFile,
  perspectiveNextWorkCandidatePanelFile,
  perspectiveNextWorkCandidateSmokeFile,
  agentWorkplaneFile,
  smokeFile,
  packageJsonFile,
];

const followOnMetricInformedContinuityRelayAdjustmentPreviewFiles = [
  metricInformedContinuityRelayAdjustmentTypeFile,
  metricInformedContinuityRelayAdjustmentHelperFile,
  metricInformedContinuityRelayAdjustmentPanelFile,
  metricInformedContinuityRelayAdjustmentSmokeFile,
  agentWorkplaneFile,
  smokeFile,
  packageJsonFile,
];

const followOnHandoffContextUpdatePreviewFiles = [
  handoffContextUpdatePreviewTypeFile,
  handoffContextUpdatePreviewHelperFile,
  handoffContextUpdatePreviewPanelFile,
  handoffContextUpdatePreviewSmokeFile,
  agentWorkplaneFile,
  smokeFile,
  packageJsonFile,
  metricInformedContinuityRelayAdjustmentSmokeFile,
  handoffRationaleSmokeFile,
];

const followOnHandoffContextUpdateOperatorDecisionPreviewFiles = [
  handoffContextUpdateOperatorDecisionTypeFile,
  handoffContextUpdateOperatorDecisionHelperFile,
  handoffContextUpdateOperatorDecisionPanelFile,
  handoffContextUpdateOperatorDecisionSmokeFile,
  agentWorkplaneFile,
  smokeFile,
  packageJsonFile,
  handoffContextUpdatePreviewSmokeFile,
  metricInformedContinuityRelayAdjustmentSmokeFile,
  handoffRationaleSmokeFile,
];

const followOnHandoffContextUpdateWriteFiles = [
  handoffContextUpdateWriteTypeFile,
  handoffContextUpdateWriteHelperFile,
  handoffContextUpdateWriteRouteFile,
  handoffContextUpdateWriteSmokeFile,
  handoffContextUpdateOperatorDecisionSmokeFile,
  handoffContextUpdatePreviewSmokeFile,
  packageJsonFile,
  smokeFile,
];

const followOnHandoffContextUpdateRecordReviewFiles = [
  handoffContextUpdateRecordReviewTypeFile,
  handoffContextUpdateRecordReviewHelperFile,
  handoffContextUpdateRecordReviewReadForWebHelperFile,
  handoffContextUpdateRecordReviewPanelFile,
  handoffContextUpdateRecordReviewSmokeFile,
  handoffContextUpdateRecordReviewDbReadSmokeFile,
  handoffContextUpdateWriteSmokeFile,
  handoffContextUpdateOperatorDecisionSmokeFile,
  handoffContextUpdatePreviewSmokeFile,
  metricInformedContinuityRelayAdjustmentSmokeFile,
  handoffRationaleSmokeFile,
  agentWorkplaneFile,
  packageJsonFile,
  smokeFile,
];

const followOnHandoffContextApplyPreviewFiles = [
  handoffContextApplyPreviewTypeFile,
  handoffContextApplyPreviewHelperFile,
  handoffContextApplyPreviewPanelFile,
  handoffContextApplyPreviewSmokeFile,
  handoffContextUpdateRecordReviewSmokeFile,
  handoffContextUpdateRecordReviewDbReadSmokeFile,
  handoffContextUpdateWriteSmokeFile,
  handoffContextUpdateOperatorDecisionSmokeFile,
  handoffContextUpdatePreviewSmokeFile,
  metricInformedContinuityRelayAdjustmentSmokeFile,
  handoffRationaleSmokeFile,
  agentWorkplaneFile,
  packageJsonFile,
  smokeFile,
];

const followOnHandoffContextApplyOperatorDecisionPreviewFiles = [
  handoffContextApplyDecisionTypeFile,
  handoffContextApplyDecisionHelperFile,
  handoffContextApplyDecisionPanelFile,
  handoffContextApplyDecisionSmokeFile,
  handoffContextApplyPreviewSmokeFile,
  handoffContextUpdateRecordReviewDbReadSmokeFile,
  handoffContextUpdateRecordReviewSmokeFile,
  handoffContextUpdateWriteSmokeFile,
  handoffContextUpdateOperatorDecisionSmokeFile,
  handoffContextUpdatePreviewSmokeFile,
  metricInformedContinuityRelayAdjustmentSmokeFile,
  handoffRationaleSmokeFile,
  agentWorkplaneFile,
  packageJsonFile,
  smokeFile,
];

const followOnHandoffContextApplyWriteContractPreviewFiles = [
  handoffContextApplyWriteContractTypeFile,
  handoffContextApplyWriteContractHelperFile,
  handoffContextApplyWriteContractPanelFile,
  handoffContextApplyWriteContractSmokeFile,
  handoffContextApplyDecisionSmokeFile,
  handoffContextApplyPreviewSmokeFile,
  handoffContextUpdateRecordReviewDbReadSmokeFile,
  handoffContextUpdateRecordReviewSmokeFile,
  handoffContextUpdateWriteSmokeFile,
  handoffContextUpdateOperatorDecisionSmokeFile,
  handoffContextUpdatePreviewSmokeFile,
  metricInformedContinuityRelayAdjustmentSmokeFile,
  handoffRationaleSmokeFile,
  agentWorkplaneFile,
  packageJsonFile,
  smokeFile,
];

const followOnSelectedSessionDigestIntakePreviewFiles = [
  selectedSessionDigestIntakeTypeFile,
  selectedSessionDigestIntakeHelperFile,
  selectedSessionDigestIntakePanelFile,
  selectedSessionDigestIntakeSmokeFile,
  handoffContextApplyWriteContractSmokeFile,
  agentWorkplaneFile,
  packageJsonFile,
  smokeFile,
];

const followOnWorkbenchDogfoodLoopSpineOverviewFiles = [
  workbenchDogfoodLoopSpineOverviewTypeFile,
  workbenchDogfoodLoopSpineOverviewHelperFile,
  workbenchDogfoodLoopSpineOverviewPanelFile,
  workbenchDogfoodLoopSpineOverviewSmokeFile,
  agentWorkplaneFile,
  packageJsonFile,
  smokeFile,
];

const followOnSelectedSessionDigestIngestContractPreviewFiles = [
  selectedSessionDigestIngestContractTypeFile,
  selectedSessionDigestIngestContractHelperFile,
  selectedSessionDigestIngestContractPanelFile,
  selectedSessionDigestIngestContractSmokeFile,
  workbenchDogfoodLoopSpineOverviewTypeFile,
  workbenchDogfoodLoopSpineOverviewHelperFile,
  workbenchDogfoodLoopSpineOverviewSmokeFile,
  selectedSessionDigestIntakeSmokeFile,
  agentWorkplaneFile,
  packageJsonFile,
  smokeFile,
];

const followOnSelectedSessionDigestIngestOperatorDecisionFiles = [
  selectedSessionDigestIngestOperatorDecisionTypeFile,
  selectedSessionDigestIngestOperatorDecisionHelperFile,
  selectedSessionDigestIngestOperatorDecisionPanelFile,
  selectedSessionDigestIngestDecisionWriteTypeFile,
  selectedSessionDigestIngestDecisionWriteHelperFile,
  selectedSessionDigestIngestDecisionWriteRouteFile,
  selectedSessionDigestIngestOperatorDecisionSmokeFile,
  selectedSessionDigestIngestContractSmokeFile,
  workbenchDogfoodLoopSpineOverviewTypeFile,
  workbenchDogfoodLoopSpineOverviewHelperFile,
  workbenchDogfoodLoopSpineOverviewSmokeFile,
  agentWorkplaneFile,
  packageJsonFile,
  smokeFile,
];

const followOnSelectedSessionDigestDurableIngestRecordFiles = [
  selectedSessionDigestIngestWriteTypeFile,
  selectedSessionDigestIngestWriteHelperFile,
  selectedSessionDigestIngestWriteRouteFile,
  selectedSessionDigestIngestRecordReviewTypeFile,
  selectedSessionDigestIngestRecordReviewHelperFile,
  selectedSessionDigestIngestRecordReviewForWebFile,
  selectedSessionDigestIngestRecordReviewPanelFile,
  selectedSessionDigestDurableIngestRecordSmokeFile,
  selectedSessionDigestIngestOperatorDecisionSmokeFile,
  selectedSessionDigestIngestDecisionWriteHelperFile,
  selectedSessionDigestIngestOperatorDecisionHelperFile,
  workbenchDogfoodLoopSpineOverviewTypeFile,
  workbenchDogfoodLoopSpineOverviewHelperFile,
  workbenchDogfoodLoopSpineOverviewSmokeFile,
  agentWorkplaneFile,
  packageJsonFile,
  smokeFile,
];

const followOnProjectHistoryIntakeCandidateLedgerFiles = [
  candidateIngressNormalizerTypeFile,
  candidateIngressNormalizerHelperFile,
  projectHistoryIntakePreviewTypeFile,
  projectHistoryIntakePreviewHelperFile,
  projectHistoryIntakePreviewPanelFile,
  projectHistoryIntakeDecisionTypeFile,
  projectHistoryIntakeDecisionHelperFile,
  projectHistoryIntakeDecisionPanelFile,
  projectHistoryIntakeWriteTypeFile,
  projectHistoryIntakeWriteHelperFile,
  projectHistoryIntakeWriteRouteFile,
  projectHistoryIntakeRecordReviewTypeFile,
  projectHistoryIntakeRecordReviewHelperFile,
  projectHistoryIntakeRecordReviewForWebFile,
  projectHistoryIntakeRecordReviewPanelFile,
  projectHistoryIntakeSmokeFile,
  workbenchDogfoodLoopSpineOverviewTypeFile,
  workbenchDogfoodLoopSpineOverviewHelperFile,
  workbenchDogfoodLoopSpineOverviewSmokeFile,
  agentWorkplaneFile,
  packageJsonFile,
  smokeFile,
];

const followOnCodexResultReportIntakeResidueFiles = [
  codexResultReportIntakePreviewTypeFile,
  codexResultReportIntakePreviewHelperFile,
  codexResultReportIntakePreviewPanelFile,
  codexResultReportIntakeDecisionTypeFile,
  codexResultReportIntakeDecisionHelperFile,
  codexResultReportIntakeDecisionPanelFile,
  codexResultReportIntakeWriteTypeFile,
  codexResultReportIntakeWriteHelperFile,
  codexResultReportIntakeWriteRouteFile,
  codexResultReportIntakeRecordReviewTypeFile,
  codexResultReportIntakeRecordReviewHelperFile,
  codexResultReportIntakeRecordReviewForWebFile,
  codexResultReportIntakeRecordReviewPanelFile,
  workEpisodeResidueCandidatePreviewTypeFile,
  workEpisodeResidueCandidatePreviewHelperFile,
  workEpisodeResidueCandidatePreviewPanelFile,
  codexResultReportIntakeResidueSmokeFile,
  workbenchDogfoodLoopSpineOverviewTypeFile,
  workbenchDogfoodLoopSpineOverviewHelperFile,
  workbenchDogfoodLoopSpineOverviewSmokeFile,
  agentWorkplaneFile,
  packageJsonFile,
  smokeFile,
];

const followOnExpectedObservedDeltaBridgeFiles = [
  expectedObservedDeltaPreviewTypeFile,
  expectedObservedDeltaPreviewHelperFile,
  expectedObservedDeltaPreviewPanelFile,
  expectedObservedDeltaDecisionTypeFile,
  expectedObservedDeltaDecisionHelperFile,
  expectedObservedDeltaDecisionPanelFile,
  expectedObservedDeltaWriteTypeFile,
  expectedObservedDeltaWriteHelperFile,
  expectedObservedDeltaWriteRouteFile,
  expectedObservedDeltaRecordReviewTypeFile,
  expectedObservedDeltaRecordReviewHelperFile,
  expectedObservedDeltaRecordReviewForWebFile,
  expectedObservedDeltaRecordReviewPanelFile,
  reuseOutcomeCandidateBridgeTypeFile,
  reuseOutcomeCandidateBridgeHelperFile,
  reuseOutcomeCandidateBridgePanelFile,
  expectedObservedDeltaBridgeSmokeFile,
  workbenchDogfoodLoopSpineOverviewTypeFile,
  workbenchDogfoodLoopSpineOverviewHelperFile,
  workbenchDogfoodLoopSpineOverviewSmokeFile,
  agentWorkplaneFile,
  packageJsonFile,
  smokeFile,
];

const followOnReuseOutcomeBridgeLedgerIntegrationFiles = [
  reuseOutcomeBridgeDecisionTypeFile,
  reuseOutcomeBridgeDecisionHelperFile,
  reuseOutcomeBridgeDecisionPanelFile,
  reuseOutcomeBridgeLedgerWriteTypeFile,
  reuseOutcomeBridgeLedgerWriteHelperFile,
  reuseOutcomeBridgeLedgerRouteFile,
  reuseOutcomeBridgeLedgerRecordReviewTypeFile,
  reuseOutcomeBridgeLedgerRecordReviewHelperFile,
  reuseOutcomeBridgeLedgerRecordReviewForWebFile,
  reuseOutcomeBridgeLedgerRecordReviewPanelFile,
  reuseOutcomeBridgeLedgerIntegrationSmokeFile,
  expectedObservedDeltaWriteRouteFile,
  workbenchDogfoodLoopSpineOverviewTypeFile,
  workbenchDogfoodLoopSpineOverviewHelperFile,
  workbenchDogfoodLoopSpineOverviewSmokeFile,
  expectedObservedDeltaBridgeSmokeFile,
  agentWorkplaneFile,
  packageJsonFile,
  smokeFile,
];

const followOnDogfoodMetricSnapshotNextWorkRefreshFiles = [
  dogfoodMetricSnapshotPreviewTypeFile,
  dogfoodMetricSnapshotPreviewHelperFile,
  dogfoodMetricSnapshotPreviewPanelFile,
  dogfoodMetricSnapshotDecisionTypeFile,
  dogfoodMetricSnapshotDecisionHelperFile,
  dogfoodMetricSnapshotDecisionPanelFile,
  dogfoodMetricSnapshotWriteTypeFile,
  dogfoodMetricSnapshotWriteHelperFile,
  dogfoodMetricSnapshotRouteFile,
  dogfoodMetricSnapshotRecordReviewTypeFile,
  dogfoodMetricSnapshotRecordReviewHelperFile,
  dogfoodMetricSnapshotRecordReviewForWebFile,
  dogfoodMetricSnapshotRecordReviewPanelFile,
  nextWorkSignalRefreshTypeFile,
  nextWorkSignalRefreshHelperFile,
  nextWorkSignalRefreshPanelFile,
  dogfoodMetricSnapshotNextWorkRefreshSmokeFile,
  workbenchDogfoodLoopSpineOverviewTypeFile,
  workbenchDogfoodLoopSpineOverviewHelperFile,
  workbenchDogfoodLoopSpineOverviewSmokeFile,
  agentWorkplaneFile,
  packageJsonFile,
  smokeFile,
];

const followOnNextWorkSignalDecisionPerspectiveRelayBridgeFiles = [
  nextWorkSignalDecisionTypeFile,
  nextWorkSignalDecisionHelperFile,
  nextWorkSignalDecisionPanelFile,
  nextWorkSignalDecisionWriteTypeFile,
  nextWorkSignalDecisionWriteHelperFile,
  nextWorkSignalDecisionRouteFile,
  nextWorkSignalDecisionRecordReviewTypeFile,
  nextWorkSignalDecisionRecordReviewHelperFile,
  nextWorkSignalDecisionRecordReviewForWebFile,
  nextWorkSignalDecisionRecordReviewPanelFile,
  perspectiveRelayUpdateCandidateBridgeTypeFile,
  perspectiveRelayUpdateCandidateBridgeHelperFile,
  perspectiveRelayUpdateCandidateBridgePanelFile,
  nextWorkSignalDecisionPerspectiveRelayBridgeSmokeFile,
  workbenchDogfoodLoopSpineOverviewTypeFile,
  workbenchDogfoodLoopSpineOverviewHelperFile,
  workbenchDogfoodLoopSpineOverviewSmokeFile,
  agentWorkplaneFile,
  packageJsonFile,
  smokeFile,
];

const followOnLegacyCockpitLocalControlClassificationFiles = [
  "types/legacy-cockpit-local-control-classification.ts",
  "lib/workplane/legacy-cockpit-local-control-classification.ts",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_LOCAL_CONTROL_CLASSIFICATION_V0_1.md",
  "scripts/smoke-legacy-cockpit-local-control-classification-v0-1.mjs",
  "docs/AGENT_WORKPLANE_COCKPIT_CAPABILITY_INVENTORY_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_ABSORPTION_MAP_V0_1.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_PLAN_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_REPLACEMENT_BROWSER_REGRESSION_V0_1.md",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/AGENT_WORKPLANE_RUN_POSTMORTEM_DETAIL_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
];

const followOnWorkplaneStateProposalReviewFiles = [
  "types/workplane-state-proposal-review.ts",
  "lib/workplane/workplane-state-proposal-review.ts",
  "components/workplane/state-proposal-review-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "types/agent-workplane-node.ts",
  "lib/workplane/workplane-node-context.ts",
  "docs/WORKPLANE_STATE_PROPOSAL_REVIEW_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "docs/LEGACY_COCKPIT_REMAINING_CAPABILITY_MIGRATION_V0_1.md",
  "docs/BLANK_STATE_REVIEW_ENTRY_ABSORPTION_V0_1.md",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_V0_1.md",
  "docs/AGENT_WORKPLANE_NODE_CONTRACT_V0_1.md",
  "package.json",
  "scripts/smoke-workplane-state-proposal-review-v0-1.mjs",
  "scripts/smoke-agent-workplane-node-contract-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-agent-workplane-review-memory-detail-v0-1.mjs",
  "scripts/smoke-blank-state-review-entry-absorption-v0-1.mjs",
  "scripts/smoke-legacy-cockpit-remaining-capability-migration-v0-1.mjs",
  "scripts/smoke-agent-workplane-legacy-cockpit-shrink-v0-1.mjs",
];

const followOnCockpitManualControlsMigrationFiles = [
  "types/cockpit-manual-controls-migration.ts",
  "lib/workplane/cockpit-manual-controls-migration.ts",
  "types/workplane-state-proposal-review.ts",
  "lib/workplane/workplane-state-proposal-review.ts",
  "components/workplane/state-proposal-review-panel.tsx",
  "docs/COCKPIT_MANUAL_CONTROLS_MIGRATION_V0_1.md",
  "docs/WORKPLANE_STATE_PROPOSAL_REVIEW_V0_1.md",
  "docs/LEGACY_COCKPIT_REMAINING_CAPABILITY_MIGRATION_V0_1.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_V0_1.md",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
  "scripts/smoke-cockpit-manual-controls-migration-v0-1.mjs",
  "scripts/smoke-workplane-state-proposal-review-v0-1.mjs",
  "scripts/smoke-legacy-cockpit-remaining-capability-migration-v0-1.mjs",
  "scripts/smoke-agent-workplane-legacy-cockpit-shrink-v0-1.mjs",
  "scripts/smoke-blank-state-review-entry-absorption-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
];

const followOnCockpitRouteRemovalFiles = [
  "app/cockpit/page.tsx",
  "components/augnes-cockpit.tsx",
  "components/workplane/legacy-cockpit-compatibility-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "types/agent-workplane-node.ts",
  "lib/workplane/workplane-node-context.ts",
  "types/cockpit-route-removal-readiness.ts",
  "lib/workplane/cockpit-route-removal-readiness.ts",
  "docs/COCKPIT_ROUTE_REMOVAL_V0_1.md",
  "docs/COCKPIT_ROUTE_REMOVAL_READINESS_V0_1.md",
  "docs/COCKPIT_MANUAL_CONTROLS_MIGRATION_V0_1.md",
  "docs/WORKPLANE_STATE_PROPOSAL_REVIEW_V0_1.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_V0_1.md",
  "docs/LEGACY_COCKPIT_REMAINING_CAPABILITY_MIGRATION_V0_1.md",
  "docs/AGENT_WORKPLANE_NODE_CONTRACT_V0_1.md",
  "docs/AGENT_WORKPLANE_COCKPIT_CAPABILITY_INVENTORY_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_ABSORPTION_MAP_V0_1.md",
  "docs/COCKPIT_POST_REMOVAL_CLEANUP_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
  "scripts/smoke-cockpit-route-removal-v0-1.mjs",
  "scripts/smoke-cockpit-post-removal-cleanup-v0-1.mjs",
  "scripts/run-cockpit-route-removal-runtime-check-v0-1.mjs",
  "scripts/smoke-cockpit-route-removal-readiness-v0-1.mjs",
  "scripts/smoke-cockpit-manual-controls-migration-v0-1.mjs",
  "scripts/smoke-workplane-state-proposal-review-v0-1.mjs",
  "scripts/smoke-legacy-cockpit-remaining-capability-migration-v0-1.mjs",
  "scripts/smoke-agent-workplane-legacy-cockpit-shrink-v0-1.mjs",
  "scripts/smoke-blank-state-review-entry-absorption-v0-1.mjs",
  "scripts/smoke-agent-workplane-node-contract-v0-1.mjs",
  "scripts/smoke-agent-workplane-cockpit-inheritance-v0-1.mjs",
  "lib/guide/workplane-intent-projection.ts",
  "lib/metrics/runner-workplane-metrics.ts",
  "lib/workplane/workplane-bridge-trace-detail.ts",
  "lib/workplane/workplane-browser-regression.ts",
  "lib/workplane/workplane-review-memory-detail.ts",
  "lib/workplane/workplane-run-postmortem-detail.ts",
  "types/workplane-bridge-trace-detail.ts",
  "types/workplane-browser-regression.ts",
];

const followOnPerspectiveCockpitRouteNamespaceCleanupMovedRouteFiles = [
  "codex-former/capture-review-inbox-fixture/page.tsx",
  "codex-former/constellation-preview-fixture/page.tsx",
  "codex-former/local-adapter-operator-flow/operator-flow-surface.module.css",
  "codex-former/local-adapter-operator-flow/operator-flow-surface.tsx",
  "codex-former/local-adapter-operator-flow/page.tsx",
  "codex-former/local-adapter-snapshot-fixture/page.tsx",
  "codex-former/local-adapter-validate-result-fixture/page.tsx",
  "codex-former/local-adapter-validate-result-fixture/validate-result-fixture-surface.module.css",
  "codex-former/local-adapter-validate-result-fixture/validate-result-fixture-surface.tsx",
  "codex-former/session-perspective-panel-fixture/page.tsx",
  "memory-boundary-review-inbox/memory-boundary-review-inbox-surface.module.css",
  "memory-boundary-review-inbox/memory-boundary-review-inbox-surface.tsx",
  "memory-boundary-review-inbox/page.tsx",
  "memory-items/page.tsx",
  "memory-items/perspective-memory-items-surface.module.css",
  "memory-items/perspective-memory-items-surface.tsx",
  "memory-items/reuse/page.tsx",
  "memory-items/reuse/perspective-memory-item-reuse-workspace-surface.module.css",
  "memory-items/reuse/perspective-memory-item-reuse-workspace-surface.tsx",
  "memory-items/review/page.tsx",
  "memory-items/review/perspective-memory-item-review-workspace-surface.module.css",
  "memory-items/review/perspective-memory-item-review-workspace-surface.tsx",
  "memory-items/search/page.tsx",
  "memory-items/search/perspective-memory-item-search-surface.module.css",
  "memory-items/search/perspective-memory-item-search-surface.tsx",
  "memory-review-queue/local/local-memory-review-queue-surface.module.css",
  "memory-review-queue/local/local-memory-review-queue-surface.tsx",
  "memory-review-queue/local/page.tsx",
];

const followOnPerspectiveCockpitRouteNamespaceCleanupFiles = [
  "AGENTS.md",
  "SUBMISSION.md",
  "docs/PERSPECTIVE_COCKPIT_ROUTE_NAMESPACE_CLEANUP_V0_1.md",
  "docs/COCKPIT_MVP_UI_POLISH_PLAN.md",
  "docs/COCKPIT_SIX_TAB_MVP_FUNCTIONAL_MAP.md",
  "docs/COCKPIT_PERSPECTIVE_IA_V0_1.md",
  "docs/PROMOTION_READINESS_REVIEW_HUB_COCKPIT_ENTRYPOINT_V0_1.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_PLAN_V0_1.md",
  "scripts/smoke-perspective-cockpit-route-namespace-cleanup-v0-1.mjs",
  ...followOnPerspectiveCockpitRouteNamespaceCleanupMovedRouteFiles.flatMap(
    (file) => [`app/perspective/${file}`, `app/cockpit/perspective/${file}`],
  ),
  "lib/perspective-ingest/codex-former-capture-review-inbox-fixture-surface.ts",
  "lib/perspective-ingest/codex-former-local-adapter-operator-flow.ts",
  "lib/perspective-ingest/codex-former-local-adapter-snapshot-fixture-surface.ts",
  "lib/perspective-ingest/codex-former-local-adapter-validate-result-fixture-surface.ts",
  "lib/perspective-ingest/codex-former-session-perspective-panel-fixture-surface.ts",
  "lib/perspective-ingest/perspective-memory-item-reuse-packet.ts",
  "lib/perspective-ingest/perspective-memory-item-review-workspace.ts",
  "lib/perspective-ingest/perspective-memory-item-search.ts",
  "lib/perspective-ingest/perspective-memory-item.ts",
  "lib/perspective-ingest/perspective-memory-local-review-queue.ts",
  "lib/perspective-ingest/perspective-memory-product-persistence-boundary.ts",
];


const followOnWebGuidePanelFiles = [
  "components/guide/guide-brief-panel.tsx",
  "components/guide/guide-brief-section.tsx",
  "components/guide/guide-brief-summary-card.tsx",
  "components/guide/guide-brief-boundary-card.tsx",
  "components/guide/guide-brief-mini-panel.tsx",
  "lib/guide/read-guide-brief-for-web.ts",
  "components/human-surface/human-surface-home.tsx",
  "components/perspective/perspective-public-constellation-surface.tsx",
  "components/perspective/perspective-human-surface.tsx",
  "scripts/smoke-web-guide-panel-v0-1.mjs",
];
const followOnChatgptAppGuideBriefToolFiles = [
  "apps/augnes_apps/src/server.ts",
  "apps/augnes_apps/src/lib/state-runtime-types.ts",
  "apps/augnes_apps/src/adapters/state-runtime-http.ts",
  "apps/augnes_apps/scripts/invariants.ts",
  "apps/augnes_apps/scripts/smoke.ts",
  "apps/augnes_apps/scripts/mock-state-runtime.ts",
  "docs/CHATGPT_APP_MCP_READONLY_SURFACE_BOUNDARY_V0_1.md",
  "scripts/smoke-chatgpt-app-guide-brief-tool-v0-1.mjs",
];


const panelFiles = [
  panelShellFile,
  workQueuePanelFile,
  continuityRelayPanelFile,
  currentPerspectivePanelFile,
  deltaProjectionPanelFile,
  reviewQueuePanelFile,
  evidenceHandoffPanelFile,
  workplaneInspectorFile,
];

const requiredFiles = [
  workbenchPageFile,
  agentWorkplaneFile,
  workplaneHeaderFile,
  workplaneOverviewFile,
  workplaneBoundaryFile,
  ...panelFiles,
  handoffRationaleTypeFile,
  handoffRationaleHelperFile,
  handoffRationalePanelFile,
  handoffCopyExportHelperFile,
  handoffCopyExportPanelFile,
  codexResultFeedbackTypeFile,
  codexResultFeedbackHelperFile,
  codexResultFeedbackPanelFile,
  codexResultReportNormalizerFile,
  codexResultReportFixtureFile,
  dogfoodReuseProposalTypeFile,
  dogfoodReuseProposalHelperFile,
  dogfoodReuseProposalPanelFile,
  dogfoodReuseDecisionTypeFile,
  dogfoodReuseDecisionHelperFile,
  dogfoodReuseDecisionPanelFile,
  selectedSessionDigestIntakeTypeFile,
  selectedSessionDigestIntakeHelperFile,
  selectedSessionDigestIntakePanelFile,
  selectedSessionDigestIngestContractTypeFile,
  selectedSessionDigestIngestContractHelperFile,
  selectedSessionDigestIngestContractPanelFile,
  selectedSessionDigestIngestOperatorDecisionTypeFile,
  selectedSessionDigestIngestOperatorDecisionHelperFile,
  selectedSessionDigestIngestOperatorDecisionPanelFile,
  selectedSessionDigestIngestDecisionWriteTypeFile,
  selectedSessionDigestIngestDecisionWriteHelperFile,
  selectedSessionDigestIngestDecisionWriteRouteFile,
  selectedSessionDigestIngestWriteTypeFile,
  selectedSessionDigestIngestWriteHelperFile,
  selectedSessionDigestIngestWriteRouteFile,
  selectedSessionDigestIngestRecordReviewTypeFile,
  selectedSessionDigestIngestRecordReviewHelperFile,
  selectedSessionDigestIngestRecordReviewForWebFile,
  selectedSessionDigestIngestRecordReviewPanelFile,
  candidateIngressNormalizerTypeFile,
  candidateIngressNormalizerHelperFile,
  projectHistoryIntakePreviewTypeFile,
  projectHistoryIntakePreviewHelperFile,
  projectHistoryIntakePreviewPanelFile,
  projectHistoryIntakeDecisionTypeFile,
  projectHistoryIntakeDecisionHelperFile,
  projectHistoryIntakeDecisionPanelFile,
  projectHistoryIntakeWriteTypeFile,
  projectHistoryIntakeWriteHelperFile,
  projectHistoryIntakeWriteRouteFile,
  projectHistoryIntakeRecordReviewTypeFile,
  projectHistoryIntakeRecordReviewHelperFile,
  projectHistoryIntakeRecordReviewForWebFile,
  projectHistoryIntakeRecordReviewPanelFile,
  codexResultReportIntakePreviewTypeFile,
  codexResultReportIntakePreviewHelperFile,
  codexResultReportIntakePreviewPanelFile,
  codexResultReportIntakeDecisionTypeFile,
  codexResultReportIntakeDecisionHelperFile,
  codexResultReportIntakeDecisionPanelFile,
  codexResultReportIntakeWriteTypeFile,
  codexResultReportIntakeWriteHelperFile,
  codexResultReportIntakeWriteRouteFile,
  codexResultReportIntakeRecordReviewTypeFile,
  codexResultReportIntakeRecordReviewHelperFile,
  codexResultReportIntakeRecordReviewForWebFile,
  codexResultReportIntakeRecordReviewPanelFile,
  workEpisodeResidueCandidatePreviewTypeFile,
  workEpisodeResidueCandidatePreviewHelperFile,
  workEpisodeResidueCandidatePreviewPanelFile,
  workbenchDogfoodLoopSpineOverviewTypeFile,
  workbenchDogfoodLoopSpineOverviewHelperFile,
  workbenchDogfoodLoopSpineOverviewPanelFile,
  contextReaderFile,
  agentWorkplaneDoc,
  packageJsonFile,
  indexDoc,
  shellSmokeFile,
  humanSurfaceSmokeFile,
  perspectiveSmokeFile,
  smokeFile,
];

const phase9aAutonomyRunnerPreflightFiles = [
  "docs/AUTONOMY_RUNNER_PREFLIGHT_V0_1.md",
  "types/autonomy-runner.ts",
  "lib/autonomy/autonomy-runner-preflight.ts",
  "fixtures/autonomy-runner-preflight.sample.v0.1.json",
  "scripts/smoke-autonomy-runner-preflight-v0-1.mjs",
  "app/api/augnes/read/autonomy-runner-preflight/route.ts",
  "lib/autonomy/autonomy-runner-preflight-source.ts",
  "scripts/smoke-autonomy-runner-preflight-route-v0-1.mjs",
  "lib/autonomy/read-autonomy-runner-preflight-for-web.ts",
  "components/autonomy/autonomy-runner-preflight-preview-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "scripts/smoke-autonomy-runner-preflight-web-preview-v0-1.mjs",
  "scripts/smoke-chatgpt-app-autonomy-runner-preflight-tool-v0-1.mjs",
  "package.json",
  "package-lock.json",
  "docs/00_INDEX_LATEST.md",
  "scripts/smoke-augnes-delta-contract-v0-1.mjs",
  "scripts/smoke-augnes-delta-projection-v0-1.mjs",
  "scripts/smoke-augnes-delta-projection-route-v0-1.mjs",
  "scripts/smoke-current-working-perspective-v0-1.mjs",
  "scripts/smoke-current-working-perspective-route-v0-1.mjs",
  "scripts/smoke-human-surface-home-v0-1.mjs",
  "scripts/smoke-perspective-human-timeline-v0-1.mjs",
  "scripts/smoke-agent-workplane-shell-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
  "scripts/smoke-guide-brief-v0-1.mjs",
  "scripts/smoke-guide-brief-route-v0-1.mjs",
  "scripts/smoke-web-guide-panel-v0-1.mjs",
  "scripts/smoke-chatgpt-app-guide-brief-tool-v0-1.mjs",
  "scripts/smoke-codex-guidebrief-handoff-v0-1.mjs",
  "scripts/smoke-handoff-capsule-v0-1.mjs",
  "scripts/smoke-handoff-capsule-route-v0-1.mjs",
  "scripts/smoke-handoff-capsule-web-preview-v0-1.mjs",
  "scripts/smoke-chatgpt-app-handoff-capsule-tool-v0-1.mjs",
  "scripts/smoke-codex-handoff-capsule-v0-1.mjs",
  "scripts/smoke-handoff-capsule-copy-export-v0-1.mjs",
  "scripts/smoke-autonomy-contract-v0-1.mjs",
  "scripts/smoke-autonomy-contract-route-v0-1.mjs",
  "scripts/smoke-autonomy-contract-web-preview-v0-1.mjs",
  "scripts/smoke-chatgpt-app-autonomy-contract-tool-v0-1.mjs",
  "scripts/smoke-codex-autonomy-contract-v0-1.mjs",
  "scripts/smoke-autonomy-contract-copy-export-v0-1.mjs",
  "lib/autonomy/autonomy-runner-preflight-copy-export.ts",
  "components/autonomy/autonomy-runner-preflight-copy-export-panel.tsx",
  "scripts/smoke-autonomy-runner-preflight-copy-export-v0-1.mjs",
  "docs/AUTONOMY_RUNNER_EXECUTION_V0_1.md",
  "types/autonomy-runner-execution.ts",
  "lib/autonomy/runner.ts",
  "lib/autonomy/scheduler.ts",
  "lib/autonomy/runner-ledger.ts",
  "lib/autonomy/runner-delta-batch.ts",
  "lib/autonomy/runner-state.ts",
  "app/api/autonomy/runs/route.ts",
  "app/api/autonomy/runs/[id]/route.ts",
  "fixtures/autonomy-runner.sample.v0.1.json",
  "scripts/smoke-autonomy-runner-v0-1.mjs",
  "lib/db/schema.sql",
];
const allowedChangedFiles = new Set([
  "docs/AUTONOMY_CONTRACT_V0_1.md",
  "types/autonomy-contract.ts",
  "lib/autonomy/autonomy-contract.ts",
  "fixtures/autonomy-contract.sample.v0.1.json",
  "scripts/smoke-autonomy-contract-v0-1.mjs",
  "app/api/augnes/read/autonomy-contract/route.ts",
  "lib/autonomy/autonomy-contract-source.ts",
  "scripts/smoke-autonomy-contract-route-v0-1.mjs",
  "package.json",
  "docs/00_INDEX_LATEST.md",
  workbenchPageFile,
  agentWorkplaneFile,
  workplaneHeaderFile,
  workplaneOverviewFile,
  workplaneBoundaryFile,
  compatibilityPanelFile,
  ...panelFiles,
  contextReaderFile,
  agentWorkplaneDoc,
  indexDoc,
  packageJsonFile,
  shellSmokeFile,
  humanSurfaceSmokeFile,
  perspectiveSmokeFile,
  ...followOnHistoricalSmokeCompatibilityFiles,
  ...followOnAgentWorkplaneProjectionHandoffFiles,
  ...followOnAgentWorkplaneCleanupHardeningFiles,
  ...followOnAgentWorkplaneCockpitInheritanceFiles,
  ...followOnAgentWorkplaneNodeContractFiles,
  ...followOnWorkplaneRunnerDeltaBatchIntegrationFiles,
  ...followOnGuideBriefCoreFiles,
  ...followOnGuideBriefRouteFiles,
  ...followOnGuideWorkplaneDebugContextFiles,
  ...followOnGuideBriefIntentProjectionFiles,
  ...followOnRunnerWorkplaneMetricsFiles,
  ...followOnAugnesDogfoodFiles,
  ...followOnLegacyCockpitShrinkPlanFiles,
  ...followOnWorkplaneNativeBrowserRegressionFiles,
  ...followOnAgentWorkplaneBridgeTraceDetailFiles,
  ...followOnAgentWorkplaneReviewMemoryDetailFiles,
  ...followOnAgentWorkplaneRunPostmortemDetailFiles,
  ...followOnWorkplaneContinuityRelayFiles,
  ...followOnHandoffContextRelayRationaleFiles,
  ...followOnCodexResultFeedbackDraftFiles,
  ...followOnDogfoodReuseRecordProposalFiles,
  ...followOnDogfoodReuseOperatorDecisionPreviewFiles,
  ...followOnHandoffReuseOutcomeLedgerWriteFiles,
  ...followOnDogfoodMetricCandidatePreviewFiles,
  ...followOnPerspectiveNextWorkCandidateUpdatePreviewFiles,
  ...followOnMetricInformedContinuityRelayAdjustmentPreviewFiles,
  ...followOnHandoffContextUpdatePreviewFiles,
  ...followOnHandoffContextUpdateOperatorDecisionPreviewFiles,
  ...followOnHandoffContextUpdateWriteFiles,
  ...followOnHandoffContextUpdateRecordReviewFiles,
  ...followOnHandoffContextApplyPreviewFiles,
  ...followOnHandoffContextApplyOperatorDecisionPreviewFiles,
  ...followOnHandoffContextApplyWriteContractPreviewFiles,
  ...followOnSelectedSessionDigestIntakePreviewFiles,
  ...followOnWorkbenchDogfoodLoopSpineOverviewFiles,
  ...followOnSelectedSessionDigestIngestContractPreviewFiles,
  ...followOnSelectedSessionDigestIngestOperatorDecisionFiles,
  ...followOnSelectedSessionDigestDurableIngestRecordFiles,
  ...followOnProjectHistoryIntakeCandidateLedgerFiles,
  ...followOnCodexResultReportIntakeResidueFiles,
  ...followOnExpectedObservedDeltaBridgeFiles,
  ...followOnReuseOutcomeBridgeLedgerIntegrationFiles,
  ...followOnDogfoodMetricSnapshotNextWorkRefreshFiles,
  ...followOnNextWorkSignalDecisionPerspectiveRelayBridgeFiles,
  ...followOnLegacyCockpitLocalControlClassificationFiles,
  ...followOnWorkplaneStateProposalReviewFiles,
  ...followOnCockpitManualControlsMigrationFiles,
  ...followOnCockpitRouteRemovalFiles,
  ...followOnPerspectiveCockpitRouteNamespaceCleanupFiles,
  "app/cockpit/page.tsx",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_V0_1.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_CONTROL_INVENTORY_V0_1.md",
  "lib/workplane/legacy-cockpit-control-inventory.ts",
  "docs/AUGNES_DOGFOOD_METRICS_BASELINE_V0_2.md",
  "scripts/run-agent-workplane-legacy-cockpit-runtime-check-v0-1.mjs",
  "scripts/smoke-agent-workplane-legacy-cockpit-runtime-check-v0-1.mjs",
  "scripts/smoke-agent-workplane-legacy-cockpit-shrink-v0-1.mjs",
  "scripts/smoke-legacy-cockpit-control-inventory-v0-1.mjs",
  ...followOnWebGuidePanelFiles,
  ...followOnChatgptAppGuideBriefToolFiles,
  smokeFile,
]);
for (const file of phase9aAutonomyRunnerPreflightFiles) {
  allowedChangedFiles.add(file);
}
const phase8PriorSmokeAllowlistFiles = [
  "scripts/smoke-augnes-delta-contract-v0-1.mjs",
  "scripts/smoke-augnes-delta-projection-v0-1.mjs",
  "scripts/smoke-augnes-delta-projection-route-v0-1.mjs",
  "scripts/smoke-current-working-perspective-v0-1.mjs",
  "scripts/smoke-current-working-perspective-route-v0-1.mjs",
  "scripts/smoke-human-surface-home-v0-1.mjs",
  "scripts/smoke-perspective-human-timeline-v0-1.mjs",
  "scripts/smoke-agent-workplane-shell-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
  "scripts/smoke-guide-brief-v0-1.mjs",
  "scripts/smoke-guide-brief-route-v0-1.mjs",
  "scripts/smoke-web-guide-panel-v0-1.mjs",
  "scripts/smoke-chatgpt-app-guide-brief-tool-v0-1.mjs",
  "scripts/smoke-codex-guidebrief-handoff-v0-1.mjs",
  "scripts/smoke-handoff-capsule-v0-1.mjs",
  "scripts/smoke-handoff-capsule-route-v0-1.mjs",
  "scripts/smoke-handoff-capsule-web-preview-v0-1.mjs",
  "scripts/smoke-chatgpt-app-handoff-capsule-tool-v0-1.mjs",
  "scripts/smoke-codex-handoff-capsule-v0-1.mjs",
  "scripts/smoke-handoff-capsule-copy-export-v0-1.mjs",
];
for (const file of phase8PriorSmokeAllowlistFiles) {
  allowedChangedFiles.add(file);
}

const textByFile = loadTextByFile(requiredFiles);
const workbenchPageText = textByFile.get(workbenchPageFile);
const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
const headerText = textByFile.get(workplaneHeaderFile);
const overviewText = textByFile.get(workplaneOverviewFile);
const boundaryText = textByFile.get(workplaneBoundaryFile);
const panelShellText = textByFile.get(panelShellFile);
const workQueueText = textByFile.get(workQueuePanelFile);
const continuityRelayText = textByFile.get(continuityRelayPanelFile);
const handoffRationaleTypeText = textByFile.get(handoffRationaleTypeFile);
const handoffRationaleHelperText = textByFile.get(handoffRationaleHelperFile);
const handoffRationalePanelText = textByFile.get(handoffRationalePanelFile);
const handoffCopyExportHelperText = textByFile.get(
  handoffCopyExportHelperFile,
);
const handoffCopyExportPanelText = textByFile.get(handoffCopyExportPanelFile);
const codexResultFeedbackTypeText = textByFile.get(codexResultFeedbackTypeFile);
const codexResultFeedbackHelperText = textByFile.get(
  codexResultFeedbackHelperFile,
);
const codexResultFeedbackPanelText = textByFile.get(
  codexResultFeedbackPanelFile,
);
const codexResultReportNormalizerText = textByFile.get(
  codexResultReportNormalizerFile,
);
const dogfoodReuseProposalTypeText = textByFile.get(
  dogfoodReuseProposalTypeFile,
);
const dogfoodReuseProposalHelperText = textByFile.get(
  dogfoodReuseProposalHelperFile,
);
const dogfoodReuseProposalPanelText = textByFile.get(
  dogfoodReuseProposalPanelFile,
);
const dogfoodReuseDecisionTypeText = textByFile.get(
  dogfoodReuseDecisionTypeFile,
);
const dogfoodReuseDecisionHelperText = textByFile.get(
  dogfoodReuseDecisionHelperFile,
);
const dogfoodReuseDecisionPanelText = textByFile.get(
  dogfoodReuseDecisionPanelFile,
);
const selectedSessionDigestIntakeTypeText = textByFile.get(
  selectedSessionDigestIntakeTypeFile,
);
const selectedSessionDigestIntakeHelperText = textByFile.get(
  selectedSessionDigestIntakeHelperFile,
);
const selectedSessionDigestIntakePanelText = textByFile.get(
  selectedSessionDigestIntakePanelFile,
);
const selectedSessionDigestIngestContractTypeText = textByFile.get(
  selectedSessionDigestIngestContractTypeFile,
);
const selectedSessionDigestIngestContractHelperText = textByFile.get(
  selectedSessionDigestIngestContractHelperFile,
);
const selectedSessionDigestIngestContractPanelText = textByFile.get(
  selectedSessionDigestIngestContractPanelFile,
);
const selectedSessionDigestIngestOperatorDecisionTypeText = textByFile.get(
  selectedSessionDigestIngestOperatorDecisionTypeFile,
);
const selectedSessionDigestIngestOperatorDecisionHelperText = textByFile.get(
  selectedSessionDigestIngestOperatorDecisionHelperFile,
);
const selectedSessionDigestIngestOperatorDecisionPanelText = textByFile.get(
  selectedSessionDigestIngestOperatorDecisionPanelFile,
);
const selectedSessionDigestIngestWriteTypeText = textByFile.get(
  selectedSessionDigestIngestWriteTypeFile,
);
const selectedSessionDigestIngestWriteHelperText = textByFile.get(
  selectedSessionDigestIngestWriteHelperFile,
);
const selectedSessionDigestIngestRecordReviewPanelText = textByFile.get(
  selectedSessionDigestIngestRecordReviewPanelFile,
);
const candidateIngressNormalizerTypeText = textByFile.get(
  candidateIngressNormalizerTypeFile,
);
const projectHistoryIntakePreviewTypeText = textByFile.get(
  projectHistoryIntakePreviewTypeFile,
);
const projectHistoryIntakePreviewHelperText = textByFile.get(
  projectHistoryIntakePreviewHelperFile,
);
const projectHistoryIntakePreviewPanelText = textByFile.get(
  projectHistoryIntakePreviewPanelFile,
);
const projectHistoryIntakeDecisionTypeText = textByFile.get(
  projectHistoryIntakeDecisionTypeFile,
);
const projectHistoryIntakeDecisionHelperText = textByFile.get(
  projectHistoryIntakeDecisionHelperFile,
);
const projectHistoryIntakeDecisionPanelText = textByFile.get(
  projectHistoryIntakeDecisionPanelFile,
);
const projectHistoryIntakeRecordReviewPanelText = textByFile.get(
  projectHistoryIntakeRecordReviewPanelFile,
);
const codexResultReportIntakePreviewTypeText = textByFile.get(
  codexResultReportIntakePreviewTypeFile,
);
const codexResultReportIntakePreviewHelperText = textByFile.get(
  codexResultReportIntakePreviewHelperFile,
);
const codexResultReportIntakePreviewPanelText = textByFile.get(
  codexResultReportIntakePreviewPanelFile,
);
const codexResultReportIntakeDecisionTypeText = textByFile.get(
  codexResultReportIntakeDecisionTypeFile,
);
const codexResultReportIntakeDecisionHelperText = textByFile.get(
  codexResultReportIntakeDecisionHelperFile,
);
const codexResultReportIntakeDecisionPanelText = textByFile.get(
  codexResultReportIntakeDecisionPanelFile,
);
const codexResultReportIntakeRecordReviewPanelText = textByFile.get(
  codexResultReportIntakeRecordReviewPanelFile,
);
const workEpisodeResidueCandidatePreviewTypeText = textByFile.get(
  workEpisodeResidueCandidatePreviewTypeFile,
);
const workEpisodeResidueCandidatePreviewHelperText = textByFile.get(
  workEpisodeResidueCandidatePreviewHelperFile,
);
const workEpisodeResidueCandidatePreviewPanelText = textByFile.get(
  workEpisodeResidueCandidatePreviewPanelFile,
);
const workbenchDogfoodLoopSpineOverviewTypeText = textByFile.get(
  workbenchDogfoodLoopSpineOverviewTypeFile,
);
const workbenchDogfoodLoopSpineOverviewHelperText = textByFile.get(
  workbenchDogfoodLoopSpineOverviewHelperFile,
);
const workbenchDogfoodLoopSpineOverviewPanelText = textByFile.get(
  workbenchDogfoodLoopSpineOverviewPanelFile,
);
const currentPerspectiveText = textByFile.get(currentPerspectivePanelFile);
const deltaProjectionText = textByFile.get(deltaProjectionPanelFile);
const reviewQueueText = textByFile.get(reviewQueuePanelFile);
const evidenceHandoffText = textByFile.get(evidenceHandoffPanelFile);
const inspectorText = textByFile.get(workplaneInspectorFile);
const contextReaderText = textByFile.get(contextReaderFile);
const docText = textByFile.get(agentWorkplaneDoc);
const packageJsonText = textByFile.get(packageJsonFile);
const indexText = textByFile.get(indexDoc);
const shellSmokeText = textByFile.get(shellSmokeFile);
const humanSurfaceSmokeText = textByFile.get(humanSurfaceSmokeFile);
const perspectiveSmokeText = textByFile.get(perspectiveSmokeFile);

assertPackageJsonScript();
assertIndexPointer();
assertWorkbenchRouteStillShell();
assertShellComposition();
assertPanelComponents();
assertHandoffContextRelayRationaleFollowOn();
assertSelectedSessionDigestIntakePreviewFollowOn();
assertSelectedSessionDigestIngestContractPreviewFollowOn();
assertSelectedSessionDigestIngestOperatorDecisionFollowOn();
assertSelectedSessionDigestDurableIngestRecordFollowOn();
assertProjectHistoryIntakeCandidateLedgerFollowOn();
assertCodexResultReportIntakeResidueFollowOn();
assertWorkbenchDogfoodLoopSpineOverviewFollowOn();
assertCodexResultFeedbackDraftFollowOn();
assertDogfoodReuseRecordProposalFollowOn();
assertDogfoodReuseOperatorDecisionPreviewFollowOn();
assertWorkplaneContextReader();
assertDocs();
assertFollowOnSmokeCompatibility();
assertNoNewAuthorityCode();
const followOnCodexGuideBriefHandoffFiles = [
  "docs/CODEX_GUIDEBRIEF_HANDOFF_V0_1.md",
  "plugins/augnes-operator/skills/augnes-guidebrief-handoff/SKILL.md",
  "docs/GUIDEBRIEF_CONTRACT_V0_1.md",
  "docs/CODEX_AUGNES_OPERATOR_PLUGIN_V0_2.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
  "scripts/smoke-codex-guidebrief-handoff-v0-1.mjs",
  "scripts/smoke-augnes-operator-plugin-v2.mjs",
  "scripts/smoke-augnes-capsule-handoff-skill.mjs",
];
for (const file of followOnCodexGuideBriefHandoffFiles) {
  allowedChangedFiles.add(file);
}

const followOnHandoffCapsuleFiles = [
  "docs/HANDOFF_CAPSULE_CONTRACT_V0_1.md",
  "types/handoff-capsule.ts",
  "lib/handoff/handoff-capsule.ts",
  "fixtures/handoff-capsule.sample.v0.1.json",
  "fixtures/codex-launch-card.sample.v0.1.json",
  "scripts/smoke-handoff-capsule-v0-1.mjs",
  "scripts/smoke-handoff-capsule-route-v0-1.mjs",
];
for (const file of followOnHandoffCapsuleFiles) {
  allowedChangedFiles.add(file);
}

const followOnHandoffCapsuleWebPreviewFiles = [
  "components/handoff/handoff-capsule-preview-panel.tsx",
  "components/handoff/codex-launch-card-preview-panel.tsx",
  "components/handoff/handoff-preview-boundary-card.tsx",
  "lib/handoff/read-handoff-capsule-for-web.ts",
  "scripts/smoke-handoff-capsule-web-preview-v0-1.mjs",
];
for (const file of followOnHandoffCapsuleWebPreviewFiles) {
  allowedChangedFiles.add(file);
}

const changedFilesBoundary = assertChangedFileBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "agent-workplane-panels-v0-1",
      pass: true,
      required_files_checked: requiredFiles,
      package_script_checked: true,
      index_pointer_checked: true,
      workbench_route_checked: true,
      shell_composition_checked: true,
      panel_components_checked: true,
      cockpit_compatibility_removed_checked: true,
      current_working_perspective_context_checked: true,
      delta_projection_context_checked: true,
      follow_on_smoke_compatibility_checked: true,
      follow_on_historical_smoke_compatibility_files_allowed:
        followOnHistoricalSmokeCompatibilityFiles,
      phase5c_agent_workplane_projection_handoff_follow_on_used:
        changedFilesBoundary.phase5c_agent_workplane_projection_handoff_follow_on_used,
      phase5c_agent_workplane_projection_handoff_files_allowed:
        followOnAgentWorkplaneProjectionHandoffFiles,
      follow_on_guide_brief_core_files_allowed:
        followOnGuideBriefCoreFiles,
      no_new_authority_code_checked: true,
      changed_files_checked: changedFilesBoundary.checked,
      changed_files_skipped: changedFilesBoundary.skipped,
      changed_files_skip_reason: changedFilesBoundary.skip_reason,
      changed_files_observed: changedFilesBoundary.files,
      smoke_type:
        "static-agent-workplane-panels-ui-helper-doc-package-index-boundary-only",
      route_model_changed: false,
      db_schema_migration_changed: false,
      db_write_added: false,
      api_write_route_added: false,
      mcp_app_tool_added: false,
      provider_openai_github_runtime_call_added: false,
      codex_execution_added: false,
      proof_evidence_write_added: false,
      memory_mutation_added: false,
      durable_perspective_state_apply_added: false,
      scheduler_autonomy_runner_added: false,
      phase5c_panel_scope_started:
        changedFilesBoundary.phase5c_agent_workplane_projection_handoff_follow_on_used,
      external_side_effect_added: false,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:agent-workplane-panels-v0-1");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText,
    scriptName: "smoke:agent-workplane-panels-v0-1",
    expectedCommand: "node scripts/smoke-agent-workplane-panels-v0-1.mjs",
  });
}

function assertIndexPointer() {
  assertContainsAll(
    indexText,
    [
      agentWorkplaneDoc,
      "Phase 5B adds focused read-only Agent Workplane panels",
      "Work Queue",
      "Current Perspective",
      "Delta Projection",
      "Review Queue",
      "Evidence/Handoff",
      "Workplane Inspector",
    ],
    { label: indexDoc },
  );
}

function assertWorkbenchRouteStillShell() {
  assertContainsAll(
    workbenchPageText,
    [
      "AgentWorkplane",
      "@/components/workplane/agent-workplane",
      "Augnes Agent Workplane",
      "Read-only backend work surface",
    ],
    { label: workbenchPageFile },
  );
  assert(
    !workbenchPageText.includes("<" + "AugnesCockpit"),
    `${workbenchPageFile} should keep Cockpit behind the Agent Workplane compatibility shell`,
  );
}

function assertShellComposition() {
  assertContainsAll(
    agentWorkplaneText,
    [
      "Agent Workplane",
      "WorkplaneHeader",
      "WorkplaneOverview",
      "ContinuityRelayWorkplanePanel",
      "WorkQueuePanel",
      "CurrentPerspectiveWorkplanePanel",
      "DeltaProjectionWorkplanePanel",
      "ReviewQueueWorkplanePanel",
      "EvidenceHandoffWorkplanePanel",
      "WorkplaneInspector",
      "StateProposalReviewPanel",
      "readWorkplaneContext",
      "Agent Workplane panels",
    ],
    { label: agentWorkplaneFile },
  );
  assert(!agentWorkplaneText.includes("AugnesCockpit"), `${agentWorkplaneFile} must not import or render AugnesCockpit after the route split`);
  assert(!agentWorkplaneText.includes("LegacyCockpitCompatibilityPanel"), `${agentWorkplaneFile} must not render the removed compatibility panel`);
  assert(!agentWorkplaneText.includes("legacy_cockpit_compatibility"), `${agentWorkplaneFile} must not expose the removed compatibility node`);
  assert(!agentWorkplaneText.includes('href="/cockpit"'), `${agentWorkplaneFile} must not link to the removed /cockpit route`);
  assert(!existsSync(compatibilityPanelFile), `${compatibilityPanelFile} must be deleted`);
  assert(!existsSync(augnesCockpitFile), `${augnesCockpitFile} must be deleted`);
  assert(!existsSync(cockpitPageFile), `${cockpitPageFile} must be deleted`);
  assertContainsAll(
    headerText,
    [
      "Agent Workplane",
      "Backend work surface",
      "read-only operator view",
      "No hidden execution authority",
      'href="/"',
      'href="/perspective"',
    ],
    { label: workplaneHeaderFile },
  );
  assertContainsAll(
    overviewText,
    [
      "Current Working Perspective",
      "Augnes Delta Projection",
      "Review queue",
      "Source / fallback status",
    ],
    { label: workplaneOverviewFile },
  );
}

function assertPanelComponents() {
  assertContainsAll(
    panelShellText,
    [
      "WorkplanePanelShell",
      "WorkplanePanelMetric",
      "workplaneCopyStyle",
      "workplaneListStyle",
      "workplaneItemStyle",
      "workplaneBadgeStyle",
    ],
    { label: panelShellFile },
  );
  assertContainsAll(
    workQueueText,
    [
      "WorkQueuePanel",
      "Work Queue",
      "Active work and review scope",
      "No active work goals are materialized yet",
      "read-only queue hints",
      "WorkplaneContextRead",
    ],
    { label: workQueuePanelFile },
  );
  assertContainsAll(
    continuityRelayText,
    [
      "ContinuityRelayWorkplanePanel",
      "Continuity Relay",
      "Continue from here",
      "Preserve",
      "Watch",
      "Stop If Missing",
      "Next Focus",
      "Read-only/advisory",
      "WorkplaneContextRead",
      'panelId="continuity_relay"',
    ],
    { label: continuityRelayPanelFile },
  );
  assertContainsAll(
    currentPerspectiveText,
    [
      "CurrentPerspectiveWorkplanePanel",
      "Current Perspective",
      "Current Working Perspective workplane context",
      "Source status",
      "Staleness",
      "Fixture fallback is disclosed",
      "WorkplaneContextRead",
    ],
    { label: currentPerspectivePanelFile },
  );
  assertContainsAll(
    deltaProjectionText,
    [
      "DeltaProjectionWorkplanePanel",
      "Delta Projection",
      "Augnes Delta Projection workplane context",
      "No projected deltas materialized yet",
      "read-model inputs",
      "Date.parse",
      "localeCompare",
      "WorkplaneContextRead",
    ],
    { label: deltaProjectionPanelFile },
  );
  assertContainsAll(
    reviewQueueText,
    [
      "ReviewQueueWorkplanePanel",
      "Review Queue",
      "Operator attention hints",
      "No review queue delta refs are materialized yet",
      "does not approve",
      "WorkplaneContextRead",
    ],
    { label: reviewQueuePanelFile },
  );
  assertContainsAll(
    evidenceHandoffText,
    [
      "EvidenceHandoffWorkplanePanel",
      "Evidence / Handoff",
      "Pointer-only handoff and evidence context",
      "Evidence pointers",
      "Handoff context",
      "sourceHandoffRefs",
      "deltaHandoffRefs",
      "delta.handoff_refs",
      "uniqueHandoffRefCount",
      "handoffRef.handoff_ref",
      "No handoff refs materialized yet",
      "No evidence pointers materialized yet",
      "Run postmortem source is not materialized yet",
      "does not create evidence records",
      "WorkplaneContextRead",
    ],
    { label: evidenceHandoffPanelFile },
  );
  assertContainsAll(
    inspectorText,
    [
      "WorkplaneInspector",
      "WorkplaneBoundaryCard",
      "No hidden execution authority",
      "Pointer-only backend context",
      "merge policy",
      "Non-goals",
      "No projected deltas materialized yet",
      "Date.parse",
      "localeCompare",
      "WorkplaneContextRead",
    ],
    { label: workplaneInspectorFile },
  );
  assertContainsAll(
    boundaryText,
    [
      "Read-only UI; No hidden execution authority",
      "does not",
      "execute agents",
      "apply deltas",
      "write DB rows",
      "record proof",
      "create evidence",
      "launch Codex",
    ],
    { label: workplaneBoundaryFile },
  );
}

function assertHandoffContextRelayRationaleFollowOn() {
  assertContainsAll(
    handoffRationaleTypeText,
    [
      "handoff_context_relay_rationale.v0.1",
      "selected_refs",
      "why_included",
      "stale_or_gap_warnings",
      "stop_if_missing",
      "expected_return_signal",
      "authority_boundary",
      "can_send_handoff: false",
      "can_execute_codex: false",
      "can_mutate_memory: false",
    ],
    { label: handoffRationaleTypeFile },
  );
  assertContainsAll(
    handoffRationaleHelperText,
    [
      "buildHandoffContextRelayRationale",
      "WorkplaneContinuityRelay",
      "WORKPLANE_CONTINUITY_RELAY_VERSION",
      "preserve_current_work",
      "context_helpful_or_stale_refs",
      "can_send_handoff: false",
      "can_execute_codex: false",
    ],
    { label: handoffRationaleHelperFile },
  );
  assertContainsAll(
    handoffRationalePanelText,
    [
      "HandoffContextRelayRationalePanel",
      "Relay rationale",
      "selected refs",
      "stale/gaps",
      "stop if missing",
      "return signal",
      "Read-only context compilation",
    ],
    { label: handoffRationalePanelFile },
  );
  assertContainsAll(
    handoffCopyExportHelperText,
    [
      "context_relay_rationale",
      "formatContextRelayRationaleForCopy",
      "## Context Relay Rationale",
      "### Expected Return Signal",
    ],
    { label: handoffCopyExportHelperFile },
  );
  assertContainsAll(
    handoffCopyExportPanelText,
    [
      "contextRelayRationale",
      "context rationale",
      "why-included rationale",
      "expected return signal",
    ],
    { label: handoffCopyExportPanelFile },
  );
  assertContainsAll(
    agentWorkplaneText,
    [
      "buildHandoffContextRelayRationale",
      "continuity_relay: context.continuity_relay",
      "HandoffContextRelayRationalePanel",
      "contextRelayRationale={handoffContextRationale}",
    ],
    { label: agentWorkplaneFile },
  );
}

function assertSelectedSessionDigestIntakePreviewFollowOn() {
  assertContainsAll(
    selectedSessionDigestIntakeTypeText,
    [
      "selected_session_digest_intake_preview.v0.1",
      "SelectedSessionDigestIntakeCandidate",
      "ready_for_operator_review",
      "future_ingest_contract_preview",
      "would_not_ingest",
      "can_write_db: false",
      "can_create_schema: false",
      "can_create_ingest_record: false",
      "can_write_memory: false",
      "can_mutate_current_working_perspective: false",
      "can_mutate_handoff_context: false",
      "can_write_selected_refs_to_live_handoff: false",
      "can_send_handoff: false",
      "can_call_provider_openai: false",
      "can_call_github: false",
      "can_execute_codex: false",
    ],
    { label: selectedSessionDigestIntakeTypeFile },
  );
  assertContainsAll(
    selectedSessionDigestIntakeHelperText,
    [
      "buildSelectedSessionDigestIntakePreviewV01",
      "SELECTED_SESSION_DIGEST_RAW_TEXT_MAX_LENGTH",
      "raw_text_extraction_is_deterministic_and_not_semantic_summary",
      "selected_session_digest_ingest_candidate.v0.1",
      "does_not_write_db_rows",
      "does_not_write_memory",
      "does_not_mutate_current_working_perspective",
      "does_not_mutate_handoff_context",
      "does_not_write_selected_refs_to_active_handoff_packet",
      "does_not_send_handoffs",
      "does_not_call_provider_openai",
      "does_not_call_github",
      "does_not_execute_codex",
      "can_create_ingest_record: false",
    ],
    { label: selectedSessionDigestIntakeHelperFile },
  );
  assertContainsAll(
    selectedSessionDigestIntakePanelText,
    [
      "Selected Session Digest Intake Preview",
      "candidate counts by bucket",
      "extracted preview counts",
      "future ingest contract requirements",
      "privacy review",
      "would not ingest",
      "authority boundary flags",
      "can_create_ingest_record",
      "can_write_selected_refs_to_live_handoff",
      "can_send_handoff",
    ],
    { label: selectedSessionDigestIntakePanelFile },
  );
  assertContainsAll(
    agentWorkplaneText,
    [
      "SelectedSessionDigestIntakePreviewPanel",
      "buildSelectedSessionDigestIntakePreviewV01",
      "selectedSessionDigestIntakePreview",
      "workbench:selected_session_digest_intake_preview_empty_input",
      "preview={selectedSessionDigestIntakePreview}",
    ],
    { label: agentWorkplaneFile },
  );

  const start = agentWorkplaneText.indexOf(
    "const selectedSessionDigestIntakePreview",
  );
  const end = agentWorkplaneText.indexOf("return (", start);
  assert(start !== -1, "Agent Workplane must build selected digest intake preview");
  assert(end > start, "Selected digest intake preview block must be bounded");
  const snippet = agentWorkplaneText.slice(start, end);
  assert(!snippet.includes("digest:"), "Workbench default must not pass digest");
  assert(!snippet.includes("raw_text:"), "Workbench default must not pass raw_text");
  assert(!snippet.includes("sample"), "Workbench default must not pass sample material");
  assert(!snippet.includes("fixture"), "Workbench default must not pass fixture material");
  assert(
    !selectedSessionDigestIntakePanelText.includes("<button"),
    "Selected digest intake panel must not add buttons",
  );
  assert(
    !/<button[^>]*>[^<]*(Import|Write|Apply|Approve|Send)/i.test(
      selectedSessionDigestIntakePanelText,
    ),
    "Selected digest intake panel must not render import/write/apply/approve/send buttons",
  );
}

function assertSelectedSessionDigestIngestContractPreviewFollowOn() {
  assertContainsAll(
    selectedSessionDigestIngestContractTypeText,
    [
      "selected_session_digest_ingest_contract_preview.v0.1",
      "selected_session_digest_ingest_record.v0.1",
      "selected_session_digest_ingest_receipt.v0.1",
      "SelectedSessionDigestIngestContractPreview",
      "selected_session_digest_intake_preview?: unknown",
      "would_ingest_material_preview",
      "carry_forward_review_only_material",
      "can_create_ingest_record: false",
      "can_create_ingest_receipt: false",
      "can_write_selected_session_digest: false",
      "can_write_memory: false",
      "can_mutate_current_working_perspective: false",
      "can_apply_handoff_context: false",
      "can_write_selected_refs_to_live_handoff: false",
      "can_send_handoff: false",
      "can_call_provider_openai: false",
      "can_call_github: false",
      "can_execute_codex: false",
    ],
    { label: selectedSessionDigestIngestContractTypeFile },
  );
  assert(
    !selectedSessionDigestIngestContractTypeText.includes("raw_text?:") &&
      !selectedSessionDigestIngestContractTypeText.includes("digest?:"),
    "Selected digest ingest contract input must not accept raw digest/raw_text",
  );
  assertContainsAll(
    selectedSessionDigestIngestContractHelperText,
    [
      "buildSelectedSessionDigestIngestContractPreviewV01",
      "createSelectedSessionDigestIngestContractAuthorityBoundaryV01",
      "SELECTED_SESSION_DIGEST_INTAKE_PREVIEW_VERSION",
      "rejected_or_review_only_candidates",
      "privacy_review_confirmation_ref_missing",
      "selected_digest_candidate_refs_missing",
      "requested_idempotency_key_missing",
      "candidate_material_contains_secret_or_private_marker",
      "does_not_create_ingest_record",
      "does_not_create_ingest_receipt",
      "does_not_write_memory",
      "does_not_apply_handoff_context",
      "does_not_send_handoff",
      "does_not_call_provider_openai",
      "does_not_call_github",
      "does_not_execute_codex",
    ],
    { label: selectedSessionDigestIngestContractHelperFile },
  );
  assertContainsAll(
    selectedSessionDigestIngestContractPanelText,
    [
      "Selected Session Digest Ingest Contract Preview",
      "future ingest write contract",
      "privacy review",
      "idempotency",
      "would not write",
      "authority boundary",
      "can_create_ingest_record",
      "can_create_ingest_receipt",
      "can_apply_handoff_context",
      "can_execute_codex",
    ],
    { label: selectedSessionDigestIngestContractPanelFile },
  );
  assertContainsAll(
    agentWorkplaneText,
    [
      "SelectedSessionDigestIngestContractPreviewPanel",
      "buildSelectedSessionDigestIngestContractPreviewV01",
      "selectedSessionDigestIngestContractPreview",
      "selected_session_digest_intake_preview: selectedSessionDigestIntakePreview",
      "preview={selectedSessionDigestIngestContractPreview}",
      "selected_session_digest_ingest_contract_preview: selectedSessionDigestIngestContractPreview",
    ],
    { label: agentWorkplaneFile },
  );

  const start = agentWorkplaneText.indexOf(
    "const selectedSessionDigestIngestContractPreview",
  );
  const end = agentWorkplaneText.indexOf("return (", start);
  assert(start !== -1, "Agent Workplane must build selected digest ingest contract preview");
  assert(end > start, "Selected digest ingest contract block must be bounded");
  const snippet = agentWorkplaneText.slice(start, end);
  assert(
    snippet.includes(
      "selected_session_digest_intake_preview:\n        selectedSessionDigestIntakePreview",
    ),
    "Agent Workplane must pass the already-built intake preview",
  );
  assert(!snippet.includes("digest:"), "Ingest contract must not pass digest");
  assert(!snippet.includes("raw_text:"), "Ingest contract must not pass raw_text");
  assert(!snippet.includes("sample"), "Ingest contract must not pass sample material");
  assert(!snippet.includes("fixture"), "Ingest contract must not pass fixture material");
  assert(
    !selectedSessionDigestIngestContractPanelText.includes("<button"),
    "Selected digest ingest contract panel must not add buttons",
  );
  assert(
    !/<button[^>]*>[^<]*(Import|Write|Apply|Approve|Send|Launch|Run|Merge|Retry|Execute)/i.test(
      selectedSessionDigestIngestContractPanelText,
    ),
    "Selected digest ingest contract panel must not render action buttons",
  );
}

function assertSelectedSessionDigestIngestOperatorDecisionFollowOn() {
  assertContainsAll(
    selectedSessionDigestIngestOperatorDecisionTypeText,
    [
      "selected_session_digest_ingest_operator_decision_preview.v0.1",
      "ready_for_future_decision_record_write",
      "approve_for_future_ingest_write",
      "would_write_decision_record_preview",
      "can_create_ingest_decision_record: false",
      "can_create_ingest_record: false",
      "can_create_ingest_receipt: false",
      "can_execute_codex: false",
    ],
    { label: selectedSessionDigestIngestOperatorDecisionTypeFile },
  );
  assertContainsAll(
    selectedSessionDigestIngestOperatorDecisionHelperText,
    [
      "buildSelectedSessionDigestIngestOperatorDecisionPreviewV01",
      "createSelectedSessionDigestIngestOperatorDecisionAuthorityBoundaryV01",
      "SELECTED_SESSION_DIGEST_INGEST_CONTRACT_PREVIEW_VERSION",
      "selected_digest_candidate_refs_not_subset_of_selectable_refs",
      "unknown_selected_digest_candidate_ref",
      "ready_for_future_decision_record_write",
      "does_not_create_selected_session_digest_ingest_record",
      "does_not_create_selected_session_digest_ingest_receipt",
      "does_not_write_memory",
      "does_not_apply_handoff_context",
      "does_not_send_handoff",
      "does_not_call_provider_openai",
      "does_not_call_github",
      "does_not_execute_codex",
    ],
    { label: selectedSessionDigestIngestOperatorDecisionHelperFile },
  );
  assertContainsAll(
    selectedSessionDigestIngestOperatorDecisionPanelText,
    [
      "Selected Session Digest Ingest Operator Decision",
      "recommended operator decision",
      "approval requirements",
      "would-write decision record",
      "would not write",
      "authority boundary",
      "can_create_ingest_decision_record",
      "can_create_ingest_record",
      "can_create_ingest_receipt",
      "can_execute_codex",
    ],
    { label: selectedSessionDigestIngestOperatorDecisionPanelFile },
  );
  assertContainsAll(
    agentWorkplaneText,
    [
      "SelectedSessionDigestIngestOperatorDecisionPanel",
      "buildSelectedSessionDigestIngestOperatorDecisionPreviewV01",
      "selectedSessionDigestIngestOperatorDecisionPreview",
      "selected_session_digest_ingest_contract_preview:\n        selectedSessionDigestIngestContractPreview",
      "preview={selectedSessionDigestIngestOperatorDecisionPreview}",
      "selected_session_digest_ingest_operator_decision_preview:\n        selectedSessionDigestIngestOperatorDecisionPreview",
    ],
    { label: agentWorkplaneFile },
  );

  const start = agentWorkplaneText.indexOf(
    "const selectedSessionDigestIngestOperatorDecisionPreview",
  );
  const end = agentWorkplaneText.indexOf("const dogfoodMetricCandidatePreview");
  assert(
    start !== -1,
    "Agent Workplane must build selected digest ingest operator decision preview",
  );
  assert(end > start, "Selected digest ingest operator decision block must be bounded");
  const snippet = agentWorkplaneText.slice(start, end);
  assert(
    snippet.includes(
      "selected_session_digest_ingest_contract_preview:\n        selectedSessionDigestIngestContractPreview",
    ),
    "Agent Workplane must pass the already-built ingest contract preview",
  );
  assert(!snippet.includes("digest:"), "Operator decision must not pass digest");
  assert(!snippet.includes("raw_text:"), "Operator decision must not pass raw_text");
  assert(!snippet.includes("sample"), "Operator decision must not pass sample material");
  assert(!snippet.includes("fixture"), "Operator decision must not pass fixture material");
  assert(
    !selectedSessionDigestIngestOperatorDecisionPanelText.includes("<button"),
    "Selected digest ingest operator decision panel must not add buttons",
  );
  assert(
    !/<button[^>]*>[^<]*(Import|Write|Apply|Approve|Send|Launch|Run|Merge|Retry|Execute)/i.test(
      selectedSessionDigestIngestOperatorDecisionPanelText,
    ),
    "Selected digest ingest operator decision panel must not render action buttons",
  );
}

function assertSelectedSessionDigestDurableIngestRecordFollowOn() {
  assertContainsAll(
    selectedSessionDigestIngestWriteTypeText,
    [
      "selected_session_digest_ingest_record.v0.1",
      "selected_session_digest_ingest_receipt.v0.1",
      "selected_session_digest_ingest_store.v0.1",
      "can_write_memory: false",
      "can_mutate_current_working_perspective: false",
      "can_send_handoff: false",
    ],
    { label: selectedSessionDigestIngestWriteTypeFile },
  );
  assertContainsAll(
    selectedSessionDigestIngestWriteHelperText,
    [
      "writeSelectedSessionDigestIngestRecordV01",
      "readSelectedSessionDigestIngestRecordByIdV01",
      "listSelectedSessionDigestIngestRecordsV01",
      "selected_session_digest_ingest_records",
    ],
    { label: selectedSessionDigestIngestWriteHelperFile },
  );
  assertContainsAll(
    selectedSessionDigestIngestRecordReviewPanelText,
    [
      "Selected Session Digest Ingest Record Review",
      "candidate ingest record",
      "receipt no side effects",
      "authority boundary",
    ],
    { label: selectedSessionDigestIngestRecordReviewPanelFile },
  );
  assertContainsAll(
    agentWorkplaneText,
    [
      "SelectedSessionDigestIngestRecordReviewPanel",
      "readSelectedSessionDigestIngestRecordReviewForWebV01",
      "const selectedSessionDigestIngestRecordReview",
      "review={selectedSessionDigestIngestRecordReview}",
      "selected_session_digest_ingest_record_review:\n        selectedSessionDigestIngestRecordReview",
    ],
    { label: agentWorkplaneFile },
  );

  const start = agentWorkplaneText.indexOf(
    "const selectedSessionDigestIngestRecordReview",
  );
  const end = agentWorkplaneText.indexOf("const dogfoodMetricCandidatePreview");
  assert(start !== -1, "Agent Workplane must build ingest record review");
  assert(end > start, "Ingest record review block must precede metric preview");
  const snippet = agentWorkplaneText.slice(start, end);
  assert(
    snippet.includes("readSelectedSessionDigestIngestRecordReviewForWebV01"),
    "Agent Workplane must use the no-DB record review reader",
  );
  assert(!snippet.includes("new Database"), "Workbench must not open DB");
  assert(!snippet.includes("fetch("), "Workbench must not fetch ingest records");
  assert(!snippet.includes("POST"), "Workbench must not POST ingest records");
  assert(
    !selectedSessionDigestIngestRecordReviewPanelText.includes("<button"),
    "Selected digest ingest record review panel must not add buttons",
  );
}

function assertProjectHistoryIntakeCandidateLedgerFollowOn() {
  assertContainsAll(
    candidateIngressNormalizerTypeText,
    [
      "candidate_ingress_normalizer.v0.1",
      "project_history_digest",
      "codex_result_report",
      "candidate_material_only: true",
    ],
    { label: candidateIngressNormalizerTypeFile },
  );
  assertContainsAll(
    projectHistoryIntakePreviewTypeText,
    [
      "project_history_intake_preview.v0.1",
      "timeline_event_candidates",
      "ready_for_candidate_ingest_record",
      "can_write_memory: false",
    ],
    { label: projectHistoryIntakePreviewTypeFile },
  );
  assertContainsAll(
    projectHistoryIntakePreviewHelperText,
    [
      "buildProjectHistoryIntakePreviewV01",
      "createProjectHistoryIntakeAuthorityBoundaryV01",
      "PROJECT_HISTORY_RAW_TEXT_MAX_LENGTH",
      "raw_text_preview_uses_local_deterministic_extraction_only",
    ],
    { label: projectHistoryIntakePreviewHelperFile },
  );
  assertContainsAll(
    projectHistoryIntakeDecisionTypeText,
    [
      "project_history_intake_operator_decision_preview.v0.1",
      "ready_for_future_candidate_record_write",
      "approve_for_project_history_candidate_ingest",
    ],
    { label: projectHistoryIntakeDecisionTypeFile },
  );
  assertContainsAll(
    projectHistoryIntakeDecisionHelperText,
    [
      "buildProjectHistoryIntakeOperatorDecisionPreviewV01",
      "createProjectHistoryIntakeOperatorDecisionAuthorityBoundaryV01",
      "selected_candidate_refs_not_in_intake_preview",
      "unknown_selected_project_history_candidate_ref",
    ],
    { label: projectHistoryIntakeDecisionHelperFile },
  );
  assertContainsAll(
    projectHistoryIntakePreviewPanelText,
    [
      "Project History Intake Preview",
      "deterministic extraction",
      "authority boundary",
    ],
    { label: projectHistoryIntakePreviewPanelFile },
  );
  assertContainsAll(
    projectHistoryIntakeDecisionPanelText,
    [
      "Project History Intake Operator Decision",
      "recommended operator decision",
      "approval requirements",
      "would-write candidate material",
      "authority boundary",
    ],
    { label: projectHistoryIntakeDecisionPanelFile },
  );
  assertContainsAll(
    projectHistoryIntakeRecordReviewPanelText,
    [
      "Project History Intake Record Review",
      "candidate ingest record",
      "receipt no side effects",
      "authority boundary",
    ],
    { label: projectHistoryIntakeRecordReviewPanelFile },
  );
  assertContainsAll(
    agentWorkplaneText,
    [
      "ProjectHistoryIntakePreviewPanel",
      "ProjectHistoryIntakeDecisionPanel",
      "ProjectHistoryIntakeRecordReviewPanel",
      "buildProjectHistoryIntakePreviewV01",
      "buildProjectHistoryIntakeOperatorDecisionPreviewV01",
      "readProjectHistoryIntakeRecordReviewForWebV01",
      "const projectHistoryIntakePreview",
      "const projectHistoryIntakeOperatorDecisionPreview",
      "const projectHistoryIntakeRecordReview",
      "preview={projectHistoryIntakePreview}",
      "preview={projectHistoryIntakeOperatorDecisionPreview}",
      "review={projectHistoryIntakeRecordReview}",
      "project_history_intake_preview: projectHistoryIntakePreview",
      "project_history_intake_operator_decision_preview:\n        projectHistoryIntakeOperatorDecisionPreview",
      "project_history_intake_record_review: projectHistoryIntakeRecordReview",
    ],
    { label: agentWorkplaneFile },
  );

  const start = agentWorkplaneText.indexOf("const projectHistoryIntakePreview");
  const end = agentWorkplaneText.indexOf("const dogfoodMetricCandidatePreview");
  assert(start !== -1, "Agent Workplane must build project history intake preview");
  assert(end > start, "Project history intake block must precede metric preview");
  const snippet = agentWorkplaneText.slice(start, end);
  assert(
    snippet.includes("buildProjectHistoryIntakePreviewV01"),
    "Agent Workplane must build project history intake preview",
  );
  assert(
    snippet.includes("project_history_intake_preview: projectHistoryIntakePreview"),
    "Agent Workplane must pass project history intake to the spine overview",
  );
  assert(!snippet.includes("new Database"), "Workbench must not open DB");
  assert(!snippet.includes("fetch("), "Workbench must not fetch records");
  assert(!snippet.includes("POST"), "Workbench must not POST records");
  for (const [panelText, label] of [
    [projectHistoryIntakePreviewPanelText, projectHistoryIntakePreviewPanelFile],
    [projectHistoryIntakeDecisionPanelText, projectHistoryIntakeDecisionPanelFile],
    [projectHistoryIntakeRecordReviewPanelText, projectHistoryIntakeRecordReviewPanelFile],
  ]) {
    assert(!panelText.includes("<button"), `${label} must not add buttons`);
  }
}

function assertCodexResultReportIntakeResidueFollowOn() {
  assertContainsAll(
    codexResultReportIntakePreviewTypeText,
    [
      "codex_result_report_intake_preview.v0.1",
      "result_summary_candidates",
      "changed_file_candidates",
      "ready_for_candidate_ingest_record",
      "can_write_memory: false",
    ],
    { label: codexResultReportIntakePreviewTypeFile },
  );
  assertContainsAll(
    codexResultReportIntakePreviewHelperText,
    [
      "buildCodexResultReportIntakePreviewV01",
      "createCodexResultReportIntakeAuthorityBoundaryV01",
      "normalizeCodexResultReportV01",
      "raw_text_preview_uses_local_deterministic_extraction_only",
    ],
    { label: codexResultReportIntakePreviewHelperFile },
  );
  assertContainsAll(
    codexResultReportIntakeDecisionTypeText,
    [
      "codex_result_report_intake_operator_decision_preview.v0.1",
      "ready_for_future_candidate_record_write",
      "approve_for_codex_result_report_candidate_ingest",
    ],
    { label: codexResultReportIntakeDecisionTypeFile },
  );
  assertContainsAll(
    codexResultReportIntakeDecisionHelperText,
    [
      "buildCodexResultReportIntakeOperatorDecisionPreviewV01",
      "createCodexResultReportIntakeOperatorDecisionAuthorityBoundaryV01",
      "selected_candidate_refs_not_in_intake_preview",
      "unknown_selected_codex_result_report_candidate_ref",
    ],
    { label: codexResultReportIntakeDecisionHelperFile },
  );
  assertContainsAll(
    workEpisodeResidueCandidatePreviewTypeText,
    [
      "work_episode_residue_candidate_preview.v0.1",
      "expected_observed_signal_candidates",
      "context_reuse_signal_candidates",
      "can_write_work_episode: false",
    ],
    { label: workEpisodeResidueCandidatePreviewTypeFile },
  );
  assertContainsAll(
    workEpisodeResidueCandidatePreviewHelperText,
    [
      "buildWorkEpisodeResidueCandidatePreviewV01",
      "createWorkEpisodeResidueCandidateAuthorityBoundaryV01",
      "does_not_write_expected_observed_delta",
      "does_not_write_reuse_outcome_ledger",
    ],
    { label: workEpisodeResidueCandidatePreviewHelperFile },
  );
  assertContainsAll(
    codexResultReportIntakePreviewPanelText,
    [
      "Codex Result Report Intake Preview",
      "deterministic extraction",
      "authority boundary",
    ],
    { label: codexResultReportIntakePreviewPanelFile },
  );
  assertContainsAll(
    codexResultReportIntakeDecisionPanelText,
    [
      "Codex Result Report Intake Operator Decision",
      "recommended operator decision",
      "approval requirements",
      "would-write candidate material",
      "authority boundary",
    ],
    { label: codexResultReportIntakeDecisionPanelFile },
  );
  assertContainsAll(
    codexResultReportIntakeRecordReviewPanelText,
    [
      "Codex Result Report Intake Record Review",
      "candidate ingest record",
      "receipt no side effects",
      "authority boundary",
    ],
    { label: codexResultReportIntakeRecordReviewPanelFile },
  );
  assertContainsAll(
    workEpisodeResidueCandidatePreviewPanelText,
    [
      "Work Episode Residue Candidate Preview",
      "expected/observed",
      "would not write",
      "authority boundary",
    ],
    { label: workEpisodeResidueCandidatePreviewPanelFile },
  );
  assertContainsAll(
    agentWorkplaneText,
    [
      "CodexResultReportIntakePreviewPanel",
      "CodexResultReportIntakeDecisionPanel",
      "CodexResultReportIntakeRecordReviewPanel",
      "WorkEpisodeResidueCandidatePreviewPanel",
      "ExpectedObservedDeltaPreviewPanel",
      "ExpectedObservedDeltaDecisionPanel",
      "ExpectedObservedDeltaRecordReviewPanel",
      "ReuseOutcomeCandidateBridgePreviewPanel",
      "ReuseOutcomeBridgeDecisionPanel",
      "ReuseOutcomeBridgeLedgerRecordReviewPanel",
      "buildCodexResultReportIntakePreviewV01",
      "buildCodexResultReportIntakeOperatorDecisionPreviewV01",
      "readCodexResultReportIntakeRecordReviewForWebV01",
      "buildWorkEpisodeResidueCandidatePreviewV01",
      "buildExpectedObservedDeltaPreviewV01",
      "buildExpectedObservedDeltaOperatorDecisionPreviewV01",
      "readExpectedObservedDeltaRecordReviewForWebV01",
      "buildReuseOutcomeCandidateBridgePreviewV01",
      "buildReuseOutcomeBridgeOperatorDecisionPreviewV01",
      "readReuseOutcomeBridgeLedgerRecordReviewForWebV01",
      "DogfoodMetricSnapshotPreviewPanel",
      "DogfoodMetricSnapshotDecisionPanel",
      "DogfoodMetricSnapshotRecordReviewPanel",
      "NextWorkSignalRefreshPreviewPanel",
      "NextWorkSignalDecisionPanel",
      "NextWorkSignalDecisionRecordReviewPanel",
      "PerspectiveRelayUpdateCandidateBridgePreviewPanel",
      "buildDogfoodMetricSnapshotPreviewV01",
      "buildDogfoodMetricSnapshotOperatorDecisionPreviewV01",
      "readDogfoodMetricSnapshotRecordReviewForWebV01",
      "buildNextWorkSignalRefreshPreviewV01",
      "buildNextWorkSignalOperatorDecisionPreviewV01",
      "readNextWorkSignalDecisionRecordReviewForWebV01",
      "buildPerspectiveRelayUpdateCandidateBridgePreviewV01",
      "const codexResultReportIntakePreview",
      "const codexResultReportIntakeDecisionPreview",
      "const codexResultReportIntakeRecordReview",
      "const workEpisodeResidueCandidatePreview",
      "const expectedObservedDeltaPreview",
      "const expectedObservedDeltaDecisionPreview",
      "const expectedObservedDeltaRecordReview",
      "const reuseOutcomeCandidateBridgePreview",
      "const reuseOutcomeBridgeOperatorDecisionPreview",
      "const reuseOutcomeBridgeLedgerRecordReview",
      "const dogfoodMetricSnapshotPreview",
      "const dogfoodMetricSnapshotDecisionPreview",
      "const dogfoodMetricSnapshotRecordReview",
      "const nextWorkSignalRefreshPreview",
      "const nextWorkSignalDecisionPreview",
      "const nextWorkSignalDecisionRecordReview",
      "const perspectiveRelayUpdateCandidateBridgePreview",
      "preview={codexResultReportIntakePreview}",
      "preview={codexResultReportIntakeDecisionPreview}",
      "review={codexResultReportIntakeRecordReview}",
      "preview={workEpisodeResidueCandidatePreview}",
      "preview={expectedObservedDeltaPreview}",
      "preview={expectedObservedDeltaDecisionPreview}",
      "review={expectedObservedDeltaRecordReview}",
      "preview={reuseOutcomeCandidateBridgePreview}",
      "preview={reuseOutcomeBridgeOperatorDecisionPreview}",
      "review={reuseOutcomeBridgeLedgerRecordReview}",
      "preview={dogfoodMetricSnapshotPreview}",
      "preview={dogfoodMetricSnapshotDecisionPreview}",
      "review={dogfoodMetricSnapshotRecordReview}",
      "preview={nextWorkSignalRefreshPreview}",
      "preview={nextWorkSignalDecisionPreview}",
      "review={nextWorkSignalDecisionRecordReview}",
      "preview={perspectiveRelayUpdateCandidateBridgePreview}",
      "codex_result_report_intake_preview: codexResultReportIntakePreview",
      "codex_result_report_intake_decision_preview:\n        codexResultReportIntakeDecisionPreview",
      "codex_result_report_intake_record_review:\n        codexResultReportIntakeRecordReview",
      "work_episode_residue_candidate_preview:\n        workEpisodeResidueCandidatePreview",
      "expected_observed_delta_preview: expectedObservedDeltaPreview",
      "expected_observed_delta_decision_preview:\n        expectedObservedDeltaDecisionPreview",
      "expected_observed_delta_record_review:\n        expectedObservedDeltaRecordReview",
      "reuse_outcome_candidate_bridge_preview:\n        reuseOutcomeCandidateBridgePreview",
      "reuse_outcome_bridge_operator_decision_preview:\n        reuseOutcomeBridgeOperatorDecisionPreview",
      "reuse_outcome_bridge_ledger_record_review:\n        reuseOutcomeBridgeLedgerRecordReview",
      "dogfood_metric_snapshot_preview: dogfoodMetricSnapshotPreview",
      "dogfood_metric_snapshot_decision_preview:\n        dogfoodMetricSnapshotDecisionPreview",
      "dogfood_metric_snapshot_record_review:\n        dogfoodMetricSnapshotRecordReview",
      "next_work_signal_refresh_preview: nextWorkSignalRefreshPreview",
      "next_work_signal_decision_preview:\n        nextWorkSignalDecisionPreview",
      "next_work_signal_decision_record_review:\n        nextWorkSignalDecisionRecordReview",
      "perspective_relay_update_candidate_bridge_preview:\n        perspectiveRelayUpdateCandidateBridgePreview",
    ],
    { label: agentWorkplaneFile },
  );

  const start = agentWorkplaneText.indexOf("const codexResultReportIntakePreview");
  const end = agentWorkplaneText.indexOf("return (", start);
  assert(start !== -1, "Agent Workplane must build Codex result report intake preview");
  assert(end > start, "Codex result intake block must precede render output");
  const snippet = agentWorkplaneText.slice(start, end);
  assert(
    snippet.includes("buildCodexResultReportIntakePreviewV01"),
    "Agent Workplane must build Codex result report intake preview",
  );
  assert(
    snippet.includes("codex_result_report_intake_preview: codexResultReportIntakePreview"),
    "Agent Workplane must pass Codex result intake to the spine overview",
  );
  assert(
    snippet.includes("expected_observed_delta_preview: expectedObservedDeltaPreview"),
    "Agent Workplane must pass ExpectedObservedDelta preview to the spine overview",
  );
  assert(
    snippet.includes("expected_observed_delta_decision_preview:"),
    "Agent Workplane must pass ExpectedObservedDelta decision preview to the spine overview",
  );
  assert(
    snippet.includes("expected_observed_delta_record_review:"),
    "Agent Workplane must pass ExpectedObservedDelta record review to the spine overview",
  );
  assert(
    snippet.includes("reuse_outcome_candidate_bridge_preview:"),
    "Agent Workplane must pass Reuse Outcome Candidate Bridge to the spine overview",
  );
  assert(
    snippet.includes("reuse_outcome_bridge_operator_decision_preview:"),
    "Agent Workplane must pass Reuse Outcome Bridge operator decision to the spine overview",
  );
  assert(
    snippet.includes("reuse_outcome_bridge_ledger_record_review:"),
    "Agent Workplane must pass Reuse Outcome Bridge ledger review to the spine overview",
  );
  assert(!snippet.includes("new Database"), "Workbench must not open DB");
  assert(!snippet.includes("fetch("), "Workbench must not fetch records");
  assert(!snippet.includes("POST"), "Workbench must not POST records");
  assert(!snippet.includes("result_report:"), "Workbench default must not pass result report material");
  for (const [panelText, label] of [
    [codexResultReportIntakePreviewPanelText, codexResultReportIntakePreviewPanelFile],
    [codexResultReportIntakeDecisionPanelText, codexResultReportIntakeDecisionPanelFile],
    [codexResultReportIntakeRecordReviewPanelText, codexResultReportIntakeRecordReviewPanelFile],
    [workEpisodeResidueCandidatePreviewPanelText, workEpisodeResidueCandidatePreviewPanelFile],
  ]) {
    assert(!panelText.includes("<button"), `${label} must not add buttons`);
  }
}

function assertWorkbenchDogfoodLoopSpineOverviewFollowOn() {
  assertContainsAll(
    workbenchDogfoodLoopSpineOverviewTypeText,
    [
      "workbench_dogfood_loop_spine_overview.v0.1",
      "WorkbenchDogfoodLoopSpineOverview",
      "selected_session_intake",
      "selected_session_digest_ingest_contract",
      "selected_session_digest_ingest_operator_decision",
      "selected_session_digest_durable_ingest_record",
      "project_history_intake",
      "project_history_candidate_ingest_record",
      "codex_result_feedback",
      "dogfood_reuse_proposal",
      "handoff_context_apply_write_contract",
      "recommended_next_operator_action",
      "can_write_db: false",
      "can_create_schema: false",
      "can_create_ingest_receipt: false",
      "can_write_memory: false",
      "can_mutate_current_working_perspective: false",
      "can_apply_handoff_context: false",
      "can_write_selected_refs_to_live_handoff: false",
      "can_send_handoff: false",
      "can_call_provider_openai: false",
      "can_call_github: false",
      "can_execute_codex: false",
      "can_render_workbench_action_button: false",
    ],
    { label: workbenchDogfoodLoopSpineOverviewTypeFile },
  );
  assertContainsAll(
    workbenchDogfoodLoopSpineOverviewHelperText,
    [
      "buildWorkbenchDogfoodLoopSpineOverviewV01",
      "createWorkbenchDogfoodLoopSpineOverviewAuthorityBoundaryV01",
      "selected_session_digest_intake_preview",
      "selected_session_digest_ingest_contract_preview",
      "selected_session_digest_ingest_operator_decision_preview",
      "selected_session_digest_ingest_record_review",
      "project_history_intake_preview",
      "project_history_intake_operator_decision_preview",
      "project_history_intake_record_review",
      "selectedSessionDigestIngestContractStep",
      "selectedSessionDigestIngestOperatorDecisionStep",
      "selectedSessionDigestDurableIngestRecordStep",
      "projectHistoryIntakeStep",
      "projectHistoryCandidateIngestRecordStep",
      "codex_result_feedback_draft",
      "dogfood_reuse_record_proposal",
      "handoff_context_apply_write_contract_preview",
      "missing_codex_result_report",
      "current_handoff_packet_fingerprint_missing",
      "does_not_write_memory",
      "does_not_apply_live_handoff_context",
      "can_call_provider_openai: false",
      "can_call_github: false",
      "can_execute_codex: false",
    ],
    { label: workbenchDogfoodLoopSpineOverviewHelperFile },
  );
  assertContainsAll(
    workbenchDogfoodLoopSpineOverviewPanelText,
    [
      "Workbench Dogfood Loop Spine Overview",
      "recommended next operator action",
      "spine steps",
      "would not",
      "authority boundary",
      "can_apply_handoff_context",
      "can_write_selected_refs_to_live_handoff",
      "can_send_handoff",
    ],
    { label: workbenchDogfoodLoopSpineOverviewPanelFile },
  );
  assertContainsAll(
    agentWorkplaneText,
    [
      "WorkbenchDogfoodLoopSpineOverviewPanel",
      "buildWorkbenchDogfoodLoopSpineOverviewV01",
      "workbenchDogfoodLoopSpineOverview",
      "selected_session_digest_ingest_contract_preview: selectedSessionDigestIngestContractPreview",
      "selected_session_digest_ingest_operator_decision_preview:\n        selectedSessionDigestIngestOperatorDecisionPreview",
      "selected_session_digest_ingest_record_review:\n        selectedSessionDigestIngestRecordReview",
      "workbench:dogfood_loop_spine_overview",
      "preview={workbenchDogfoodLoopSpineOverview}",
    ],
    { label: agentWorkplaneFile },
  );

  const start = agentWorkplaneText.indexOf(
    "const workbenchDogfoodLoopSpineOverview",
  );
  const end = agentWorkplaneText.indexOf("return (");
  assert(start !== -1, "Agent Workplane must build dogfood spine overview");
  assert(end > start, "Dogfood spine overview block must be bounded");
  const snippet = agentWorkplaneText.slice(start, end);
  assert(!snippet.includes("digest:"), "Overview must not pass digest material");
  assert(!snippet.includes("raw_text:"), "Overview must not pass raw digest text");
  assert(!snippet.includes("sample"), "Overview must not pass sample material");
  assert(!snippet.includes("fixture"), "Overview must not pass fixture material");
  assert(
    !snippet.includes("result_report:"),
    "Overview must not pass raw Codex result reports",
  );
  assert(
    !workbenchDogfoodLoopSpineOverviewPanelText.includes("<button"),
    "Dogfood loop spine overview panel must not add buttons",
  );
  assert(
    !/<button[^>]*>[^<]*(Import|Write|Apply|Approve|Send|Launch|Run|Merge|Retry|Execute)/i.test(
      workbenchDogfoodLoopSpineOverviewPanelText,
    ),
    "Dogfood loop spine overview panel must not render action buttons",
  );
}

function assertCodexResultFeedbackDraftFollowOn() {
  assertContainsAll(
    codexResultFeedbackTypeText,
    [
      "codex_result_feedback_draft.v0.1",
      "expected_observed_delta",
      "reuse_outcome_draft",
      "carry_forward_suggestions",
      "insufficient_data_reasons",
      "candidate_material_only: true",
      "source_of_truth: false",
      "can_write_db: false",
      "can_write_dogfood_ledger: false",
      "can_mutate_memory: false",
      "can_execute_codex: false",
      "can_send_handoff: false",
      "can_create_pr: false",
      "can_merge_pr: false",
    ],
    { label: codexResultFeedbackTypeFile },
  );
  assertContainsAll(
    codexResultFeedbackHelperText,
    [
      "buildCodexResultFeedbackDraft",
      "CodexResultReportIngestionRecordV01",
      "HandoffContextRelayRationale",
      "expected_return_signal",
      "observed_return_signal",
      "missing_context_reuse_feedback_signal",
      "missing_handoff_context_rationale",
      "missing_codex_result_report",
      "can_write_db: false",
      "can_write_dogfood_ledger: false",
      "can_execute_codex: false",
      "can_send_handoff: false",
    ],
    { label: codexResultFeedbackHelperFile },
  );
  assertContainsAll(
    codexResultFeedbackPanelText,
    [
      "CodexResultFeedbackDraftPanel",
      "Feedback draft",
      "expected vs observed",
      "reuse outcome",
      "carry forward",
      "Read-only candidate material",
    ],
    { label: codexResultFeedbackPanelFile },
  );
  assertContainsAll(
    codexResultReportNormalizerText,
    [
      "normalizeCodexResultReportV01",
      "CodexResultReportIngestionRecordV01",
      "changed_file_refs",
      "observed_check_refs",
      "skipped_check_refs",
      "not_done_refs",
      "expected_observed_delta_refs",
    ],
    { label: codexResultReportNormalizerFile },
  );
  assertContainsAll(
    agentWorkplaneText,
    [
      "CodexResultFeedbackDraftPanel",
      "buildCodexResultFeedbackDraft",
      "handoff_context_rationale: handoffContextRationale",
      "result_report: null",
      "draft={codexResultFeedbackDraft}",
    ],
    { label: agentWorkplaneFile },
  );
  assert(
    !agentWorkplaneText.includes(
      "codex-result-report-ingestion.sample.v0.1.json",
    ),
    "Agent Workplane must not import the sample Codex result fixture",
  );
  assert(
    !agentWorkplaneText.includes("codexResultReportSample.safe_input_example"),
    "Agent Workplane must not normalize sample Codex result input",
  );
  assert(
    !agentWorkplaneText.includes("normalizeCodexResultReportV01("),
    "Agent Workplane must not normalize a sample Codex result report",
  );
}

function assertDogfoodReuseRecordProposalFollowOn() {
  assertContainsAll(
    dogfoodReuseProposalTypeText,
    [
      "dogfood_reuse_record_proposal.v0.1",
      "proposed_dogfood_signal",
      "proposed_reuse_classifications",
      "operator_review_checklist",
      "blocked_reasons",
      "insufficient_data_reasons",
      "candidate_material_only: true",
      "source_of_truth: false",
      "can_write_db: false",
      "can_write_dogfood_ledger: false",
      "can_update_metrics: false",
      "can_mutate_memory: false",
      "can_apply_project_perspective: false",
      "can_execute_codex: false",
      "can_send_handoff: false",
    ],
    { label: dogfoodReuseProposalTypeFile },
  );
  assertContainsAll(
    dogfoodReuseProposalHelperText,
    [
      "buildDogfoodReuseRecordProposal",
      "CodexResultFeedbackDraft",
      "blocked_missing_feedback_draft",
      "blocked_missing_codex_result_report",
      "missing_explicit_context_feedback",
      "can_write_dogfood_ledger: false",
      "can_update_metrics: false",
      "can_mutate_memory: false",
      "can_apply_project_perspective: false",
      "can_execute_codex: false",
      "can_send_handoff: false",
    ],
    { label: dogfoodReuseProposalHelperFile },
  );
  assertContainsAll(
    dogfoodReuseProposalPanelText,
    [
      "DogfoodReuseRecordProposalPanel",
      "Reuse record proposal",
      "expected vs observed",
      "reuse classifications",
      "operator review",
      "Read-only candidate proposal",
      "can_write_dogfood_ledger",
      "can_update_metrics",
    ],
    { label: dogfoodReuseProposalPanelFile },
  );
  assertContainsAll(
    agentWorkplaneText,
    [
      "DogfoodReuseRecordProposalPanel",
      "buildDogfoodReuseRecordProposal",
      "feedback_draft: codexResultFeedbackDraft",
      "proposal={dogfoodReuseRecordProposal}",
      "result_report: null",
    ],
    { label: agentWorkplaneFile },
  );
}

function assertDogfoodReuseOperatorDecisionPreviewFollowOn() {
  assertContainsAll(
    dogfoodReuseDecisionTypeText,
    [
      "dogfood_reuse_operator_decision_preview.v0.1",
      "decision_preview_status",
      "recommended_operator_decision",
      "write_readiness",
      "approval_requirements",
      "would_write_preview",
      "would_not_write",
      "blocked_missing_proposal",
      "ready_for_operator_decision",
      "candidate_material_only: true",
      "source_of_truth: false",
      "can_persist_decision: false",
      "can_write_db: false",
      "can_write_dogfood_ledger: false",
      "can_update_metrics: false",
      "can_mutate_memory: false",
      "can_apply_project_perspective: false",
      "can_execute_codex: false",
      "can_send_handoff: false",
    ],
    { label: dogfoodReuseDecisionTypeFile },
  );
  assertContainsAll(
    dogfoodReuseDecisionHelperText,
    [
      "buildDogfoodReuseOperatorDecisionPreview",
      "DogfoodReuseRecordProposal",
      "blocked_missing_proposal",
      "blocked_missing_actual_result_report",
      "blocked_missing_explicit_context_feedback",
      "proposal_ready_for_operator_review",
      "approve_for_future_write",
      "durable dogfood ledger row",
      "dogfood metric update",
      "Perspective state",
      "memory item",
      "promotion decision",
      "Formation Receipt",
      "GitHub/Codex action",
      "handoff send",
      "can_persist_decision: false",
      "can_write_dogfood_ledger: false",
      "can_update_metrics: false",
      "can_mutate_memory: false",
      "can_apply_project_perspective: false",
      "can_execute_codex: false",
      "can_send_handoff: false",
    ],
    { label: dogfoodReuseDecisionHelperFile },
  );
  assertContainsAll(
    dogfoodReuseDecisionPanelText,
    [
      "DogfoodReuseOperatorDecisionPreviewPanel",
      "Operator decision preview",
      "write readiness",
      "approval requirements",
      "would write preview",
      "would not write",
      "Read-only decision preview",
      "can_persist_decision",
      "can_write_dogfood_ledger",
      "can_update_metrics",
    ],
    { label: dogfoodReuseDecisionPanelFile },
  );
  assertContainsAll(
    agentWorkplaneText,
    [
      "DogfoodReuseOperatorDecisionPreviewPanel",
      "buildDogfoodReuseOperatorDecisionPreview",
      "proposal: dogfoodReuseRecordProposal",
      "preview={dogfoodReuseOperatorDecisionPreview}",
      "result_report: null",
    ],
    { label: agentWorkplaneFile },
  );
}

function assertWorkplaneContextReader() {
  assertContainsAll(
    contextReaderText,
    [
      "readCurrentPerspectiveForHumanSurface",
      "readDeltaProjectionForHumanSurface",
      "buildWorkplaneContinuityRelay",
      "current_perspective_read",
      "delta_projection_read",
      "continuity_relay",
      "source_status",
      "fallback_reason",
      "authority_boundary",
      "Phase 5B extracts work queue",
      "can_execute_codex: false",
      "can_create_evidence: false",
      "can_record_proof: false",
      "latestDeltas",
      ".sort(",
      "Date.parse",
      "localeCompare",
    ],
    { label: contextReaderFile },
  );
}

function assertDocs() {
  assertContainsAll(
    docText,
    [
      "Phase 5B Agent Workplane Panels",
      "Work Queue panel",
      "Current Perspective Workplane panel",
      "Delta Projection Workplane panel",
      "Review Queue panel",
      "Evidence/Handoff panel",
      "Workplane Inspector",
      "Phase 5C",
      "Projection Candidates",
      "Handoff Builder preview",
      "Trace / Diagnostics",
      "smoke:agent-workplane-panels-v0-1",
      "no-write, no-execution, no-hidden-authority",
    ],
    { label: agentWorkplaneDoc },
  );
}

function assertFollowOnSmokeCompatibility() {
  assertContainsAll(
    shellSmokeText,
    [
      "followOnAgentWorkplanePanelFiles",
      "work-queue-panel.tsx",
      "smoke-agent-workplane-panels-v0-1.mjs",
    ],
    { label: shellSmokeFile },
  );
  assertContainsAll(
    humanSurfaceSmokeText,
    [
      "followOnAgentWorkplanePanelFiles",
      "smoke-agent-workplane-panels-v0-1.mjs",
    ],
    { label: humanSurfaceSmokeFile },
  );
  assertContainsAll(
    perspectiveSmokeText,
    [
      "followOnAgentWorkplanePanelFiles",
      "smoke-agent-workplane-panels-v0-1.mjs",
    ],
    { label: perspectiveSmokeFile },
  );
}

function assertNoNewAuthorityCode() {
  const implementationText = [
    agentWorkplaneText,
    headerText,
    overviewText,
    boundaryText,
    panelShellText,
    workQueueText,
    currentPerspectiveText,
    deltaProjectionText,
    reviewQueueText,
    evidenceHandoffText,
    inspectorText,
    contextReaderText,
  ].join("\n");

  const forbiddenPatterns = [
    [/\bmethod:\s*["'](?:POST|PUT|PATCH|DELETE)["']/, "mutating HTTP method"],
    [/\bfetch\s*\([^)]*,\s*\{[\s\S]*\bmethod:\s*["'](?:POST|PUT|PATCH|DELETE)["']/, "mutating fetch"],
    [/\bappendWorkEvent\s*\(/, "work event append"],
    [/\bappendCoordinationEvent\s*\(/, "coordination event append"],
    [/\bcreateEvidenceRecord\s*\(/, "evidence write helper"],
    [/\brecordProof\s*\(/, "proof write helper"],
    [/\bcommitStateDeltaProposal\s*\(/, "state delta commit"],
    [/\brejectStateDeltaProposal\s*\(/, "state delta reject"],
    [/\bcommitState\b/, "state commit"],
    [/\brejectState\b/, "state reject"],
    [/\bwrite[A-Z]\w*\s*\(/, "write helper"],
    [/\binsert[A-Z]\w*\s*\(/, "insert helper"],
    [/\bupdate[A-Z]\w*\s*\(/, "update helper"],
    [/\bdelete[A-Z]\w*\s*\(/, "delete helper"],
    [/\bnew\s+Database\b/, "direct DB open"],
    [/from\s+["']@\/lib\/db["']/, "direct DB import"],
    [/@openai/, "OpenAI package import"],
    [/\boctokit\b/i, "GitHub runtime client"],
    [/\bexecuteCodex\s*\(/, "Codex execution"],
    [/\bcodexSdk\b/i, "Codex SDK"],
    [/\bsetInterval\s*\(/, "scheduler interval"],
    [/\bsetTimeout\s*\(/, "scheduler timeout"],
    [/\bautonomyRunner\b/i, "autonomy runner"],
    [/\bINSERT\s+INTO\b/i, "SQL insert"],
    [/\bUPDATE\s+\w+/i, "SQL update"],
    [/\bDELETE\s+FROM\b/i, "SQL delete"],
    [/\bCREATE\s+TABLE\b/i, "schema creation"],
    [/\bALTER\s+TABLE\b/i, "schema alteration"],
    [/\bDROP\s+TABLE\b/i, "schema drop"],
    [/\bcreatePullRequest\s*\(/, "GitHub actuation"],
  ];

  for (const [pattern, label] of forbiddenPatterns) {
    assert(
      !pattern.test(implementationText),
      `Agent Workplane panels must not add ${label}: ${pattern}`,
    );
  }
}

function assertChangedFileBoundary() {
  const workingTree = collectGitDiffFiles(["diff", "--name-only"]);
  const cached = collectGitDiffFiles(["diff", "--cached", "--name-only"]);
  const baseRange = getBaseRangeChangedFiles();
  const untrackedFiles = collectUntrackedFiles();
  const files = uniqueSorted([
    ...workingTree.files,
    ...cached.files,
    ...baseRange.files,
    ...untrackedFiles,
  ]);
  const phase5cAgentWorkplaneProjectionHandoffFollowOnUsed = files.some((file) =>
    followOnAgentWorkplaneProjectionHandoffFiles.includes(file),
  );

  for (const file of files) {
    assert(
      allowedChangedFiles.has(file),
      `Unexpected Phase 5B changed or untracked file: ${file}`,
    );
    assert(file !== "app/page.tsx", "Phase 5B must not update / home page");
    assert(
      file !== "app/perspective/page.tsx",
      "Phase 5B must not update /perspective page",
    );
    assert(
      !/^app\/api\//.test(file) ||
        followOnGuideBriefRouteFiles.includes(file) ||
        file === "app/api/augnes/read/autonomy-contract/route.ts" ||
        file === ledgerRouteFile ||
        followOnDogfoodMetricCandidatePreviewFiles.includes(file) ||
        followOnHandoffContextUpdateWriteFiles.includes(file) ||
        followOnSelectedSessionDigestIngestOperatorDecisionFiles.includes(file) ||
        followOnSelectedSessionDigestDurableIngestRecordFiles.includes(file) ||
        followOnProjectHistoryIntakeCandidateLedgerFiles.includes(file) ||
        followOnCodexResultReportIntakeResidueFiles.includes(file) ||
        followOnExpectedObservedDeltaBridgeFiles.includes(file) ||
        followOnReuseOutcomeBridgeLedgerIntegrationFiles.includes(file) ||
        followOnDogfoodMetricSnapshotNextWorkRefreshFiles.includes(file) ||
        followOnNextWorkSignalDecisionPerspectiveRelayBridgeFiles.includes(file) ||
        phase9aAutonomyRunnerPreflightFiles.includes(file),
      `Phase 5B must not add API routes outside exact Phase 6B GuideBrief follow-on scope: ${file}`,
    );
    assert(
      !/^app\/.*route\.(ts|tsx|js|jsx)$/.test(file) ||
        file === "app/cockpit/page.tsx" ||
        followOnGuideBriefRouteFiles.includes(file) ||
        file === "app/api/augnes/read/autonomy-contract/route.ts" ||
        file === ledgerRouteFile ||
        followOnDogfoodMetricCandidatePreviewFiles.includes(file) ||
        followOnHandoffContextUpdateWriteFiles.includes(file) ||
        followOnSelectedSessionDigestIngestOperatorDecisionFiles.includes(file) ||
        followOnSelectedSessionDigestDurableIngestRecordFiles.includes(file) ||
        followOnProjectHistoryIntakeCandidateLedgerFiles.includes(file) ||
        followOnCodexResultReportIntakeResidueFiles.includes(file) ||
        followOnExpectedObservedDeltaBridgeFiles.includes(file) ||
        followOnReuseOutcomeBridgeLedgerIntegrationFiles.includes(file) ||
        followOnDogfoodMetricSnapshotNextWorkRefreshFiles.includes(file) ||
        followOnNextWorkSignalDecisionPerspectiveRelayBridgeFiles.includes(file) ||
        phase9aAutonomyRunnerPreflightFiles.includes(file),
      `Phase 5B must not add route files outside exact Phase 6B GuideBrief follow-on scope: ${file}`,
    );
    assert(!/^db\//.test(file), `Phase 5B must not change DB files: ${file}`);
    assert(
      !/^migrations\//.test(file),
      `Phase 5B must not change migrations: ${file}`,
    );
    assert(
      (!/^apps\/augnes_apps\//.test(file) || followOnChatgptAppGuideBriefToolFiles.includes(file)),
      `Phase 5B must not change MCP/App files: ${file}`,
    );
    assert(
      ((!/(^|\/)(mcp|plugin|plugins|tool|tools)(\/|$)/i.test(file) || followOnCodexGuideBriefHandoffFiles.includes(file)) || followOnChatgptAppGuideBriefToolFiles.includes(file) || followOnCodexGuideBriefHandoffFiles.includes(file) || phase9aAutonomyRunnerPreflightFiles.includes(file)),
      `Phase 5B must not change MCP/App tool files: ${file}`,
    );
    assert(
      !/(^|\/)(provider|providers|openai|github)(\/|$)/i.test(file),
      `Phase 5B must not change provider/OpenAI/GitHub runtime files: ${file}`,
    );
    assert(
      !/(^|\/)(proof|evidence)(\/|$)/i.test(file),
      `Phase 5B must not add proof/evidence write paths: ${file}`,
    );
    assert(
      !/(^|\/)(work-mutation|work_mutation|autonomy-runner|scheduler)(\/|$)/i.test(file),
      `Phase 5B must not add work mutation or autonomy runner files: ${file}`,
    );
  }

  return {
    checked:
      workingTree.checked ||
      cached.checked ||
      baseRange.checked ||
      untrackedFiles.length > 0,
    skipped: !(
      workingTree.checked ||
      cached.checked ||
      baseRange.checked ||
      untrackedFiles.length > 0
    ),
    skip_reason:
      workingTree.checked ||
      cached.checked ||
      baseRange.checked ||
      untrackedFiles.length > 0
        ? null
        : "changed-file boundary could not be checked",
    files,
    phase5c_agent_workplane_projection_handoff_follow_on_used:
      phase5cAgentWorkplaneProjectionHandoffFollowOnUsed,
  };
}
