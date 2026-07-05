#!/usr/bin/env node
import assert from "node:assert/strict";

import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertPackageScript,
  collectUntrackedFiles,
  loadTextByFile,
} from "./smoke-boundary-common.mjs";

const typeFile = "types/workbench-dogfood-loop-spine-overview.ts";
const helperFile = "lib/workplane/workbench-dogfood-loop-spine-overview.ts";
const panelFile =
  "components/workplane/workbench-dogfood-loop-spine-overview-panel.tsx";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const agentWorkplaneSmokeFile = "scripts/smoke-agent-workplane-panels-v0-1.mjs";
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
const perspectiveRelayUpdateDecisionTypeFile =
  "types/perspective-relay-update-decision.ts";
const perspectiveRelayUpdateDecisionHelperFile =
  "lib/workplane/perspective-relay-update-decision.ts";
const perspectiveRelayUpdateDecisionPanelFile =
  "components/workplane/perspective-relay-update-decision-panel.tsx";
const perspectiveRelayUpdateDecisionWriteTypeFile =
  "types/perspective-relay-update-decision-write.ts";
const perspectiveRelayUpdateDecisionWriteHelperFile =
  "lib/workplane/perspective-relay-update-decision-write.ts";
const perspectiveRelayUpdateDecisionRouteFile =
  "app/api/workplane/perspective-relay-update-decisions/route.ts";
const perspectiveRelayUpdateDecisionRecordReviewTypeFile =
  "types/perspective-relay-update-decision-record-review.ts";
const perspectiveRelayUpdateDecisionRecordReviewHelperFile =
  "lib/workplane/perspective-relay-update-decision-record-review.ts";
const perspectiveRelayUpdateDecisionRecordReviewForWebFile =
  "lib/workplane/read-perspective-relay-update-decision-record-review-for-web.ts";
const perspectiveRelayUpdateDecisionRecordReviewPanelFile =
  "components/workplane/perspective-relay-update-decision-record-review-panel.tsx";
const perspectiveRelayUpdateWriteContractTypeFile =
  "types/perspective-relay-update-write-contract-preview.ts";
const perspectiveRelayUpdateWriteContractHelperFile =
  "lib/workplane/perspective-relay-update-write-contract-preview.ts";
const perspectiveRelayUpdateWriteContractPanelFile =
  "components/workplane/perspective-relay-update-write-contract-preview-panel.tsx";
const perspectiveRelayUpdateDecisionWriteContractSmokeFile =
  "scripts/smoke-perspective-relay-update-decision-write-contract-v0-1.mjs";
const perspectiveNextWorkBiasScopedWritePreviewTypeFile =
  "types/perspective-next-work-bias-scoped-write-preview.ts";
const perspectiveNextWorkBiasScopedWritePreviewHelperFile =
  "lib/workplane/perspective-next-work-bias-scoped-write-preview.ts";
const perspectiveNextWorkBiasScopedWritePreviewPanelFile =
  "components/workplane/perspective-next-work-bias-scoped-write-preview-panel.tsx";
const perspectiveNextWorkBiasWriteTypeFile =
  "types/perspective-next-work-bias-write.ts";
const perspectiveNextWorkBiasWriteHelperFile =
  "lib/workplane/perspective-next-work-bias-write.ts";
const perspectiveNextWorkBiasRouteFile =
  "app/api/workplane/perspective-next-work-biases/route.ts";
const perspectiveNextWorkBiasRecordReviewTypeFile =
  "types/perspective-next-work-bias-record-review.ts";
const perspectiveNextWorkBiasRecordReviewHelperFile =
  "lib/workplane/perspective-next-work-bias-record-review.ts";
const perspectiveNextWorkBiasRecordReviewForWebFile =
  "lib/workplane/read-perspective-next-work-bias-record-review-for-web.ts";
const perspectiveNextWorkBiasRecordReviewPanelFile =
  "components/workplane/perspective-next-work-bias-record-review-panel.tsx";
const perspectiveNextWorkBiasScopedWriteSmokeFile =
  "scripts/smoke-perspective-next-work-bias-scoped-write-v0-1.mjs";
const perspectiveUnitScopedWritePreviewTypeFile =
  "types/perspective-unit-scoped-write-preview.ts";
const perspectiveUnitScopedWritePreviewHelperFile =
  "lib/workplane/perspective-unit-scoped-write-preview.ts";
const perspectiveUnitScopedWritePreviewPanelFile =
  "components/workplane/perspective-unit-scoped-write-preview-panel.tsx";
const perspectiveUnitWriteTypeFile = "types/perspective-unit-write.ts";
const perspectiveUnitWriteHelperFile = "lib/workplane/perspective-unit-write.ts";
const perspectiveUnitRouteFile = "app/api/workplane/perspective-units/route.ts";
const perspectiveUnitRecordReviewTypeFile =
  "types/perspective-unit-record-review.ts";
const perspectiveUnitRecordReviewHelperFile =
  "lib/workplane/perspective-unit-record-review.ts";
const perspectiveUnitRecordReviewForWebFile =
  "lib/workplane/read-perspective-unit-record-review-for-web.ts";
const perspectiveUnitRecordReviewPanelFile =
  "components/workplane/perspective-unit-record-review-panel.tsx";
const perspectiveUnitScopedWriteSmokeFile =
  "scripts/smoke-perspective-unit-scoped-write-v0-1.mjs";
const continuityRelayScopedWritePreviewTypeFile =
  "types/continuity-relay-scoped-write-preview.ts";
const continuityRelayScopedWritePreviewHelperFile =
  "lib/workplane/continuity-relay-scoped-write-preview.ts";
const continuityRelayScopedWritePreviewPanelFile =
  "components/workplane/continuity-relay-scoped-write-preview-panel.tsx";
const continuityRelayWriteTypeFile = "types/continuity-relay-write.ts";
const continuityRelayWriteHelperFile =
  "lib/workplane/continuity-relay-write.ts";
const continuityRelayRouteFile =
  "app/api/workplane/continuity-relays/route.ts";
const continuityRelayRecordReviewTypeFile =
  "types/continuity-relay-record-review.ts";
const continuityRelayRecordReviewHelperFile =
  "lib/workplane/continuity-relay-record-review.ts";
const continuityRelayRecordReviewForWebFile =
  "lib/workplane/read-continuity-relay-record-review-for-web.ts";
const continuityRelayRecordReviewPanelFile =
  "components/workplane/continuity-relay-record-review-panel.tsx";
const continuityRelayScopedWriteSmokeFile =
  "scripts/smoke-continuity-relay-scoped-write-v0-1.mjs";
const currentWorkingPerspectiveUpdateContractPreviewTypeFile =
  "types/current-working-perspective-update-contract-preview.ts";
const currentWorkingPerspectiveUpdateContractPreviewHelperFile =
  "lib/workplane/current-working-perspective-update-contract-preview.ts";
const currentWorkingPerspectiveUpdateContractPreviewPanelFile =
  "components/workplane/current-working-perspective-update-contract-preview-panel.tsx";
const currentWorkingPerspectiveUpdateContractDecisionTypeFile =
  "types/current-working-perspective-update-contract-decision.ts";
const currentWorkingPerspectiveUpdateContractDecisionHelperFile =
  "lib/workplane/current-working-perspective-update-contract-decision.ts";
const currentWorkingPerspectiveUpdateContractDecisionPanelFile =
  "components/workplane/current-working-perspective-update-contract-decision-panel.tsx";
const currentWorkingPerspectiveUpdateContractWriteTypeFile =
  "types/current-working-perspective-update-contract-write.ts";
const currentWorkingPerspectiveUpdateContractWriteHelperFile =
  "lib/workplane/current-working-perspective-update-contract-write.ts";
const currentWorkingPerspectiveUpdateContractRouteFile =
  "app/api/workplane/current-working-perspective-update-contracts/route.ts";
const currentWorkingPerspectiveUpdateContractRecordReviewTypeFile =
  "types/current-working-perspective-update-contract-record-review.ts";
const currentWorkingPerspectiveUpdateContractRecordReviewHelperFile =
  "lib/workplane/current-working-perspective-update-contract-record-review.ts";
const currentWorkingPerspectiveUpdateContractRecordReviewForWebFile =
  "lib/workplane/read-current-working-perspective-update-contract-record-review-for-web.ts";
const currentWorkingPerspectiveUpdateContractRecordReviewPanelFile =
  "components/workplane/current-working-perspective-update-contract-record-review-panel.tsx";
const currentWorkingPerspectiveUpdateContractSmokeFile =
  "scripts/smoke-current-working-perspective-update-contract-v0-1.mjs";
const currentWorkingPerspectiveApplyRouteFile =
  "app/api/workplane/current-working-perspective-applies/route.ts";
const currentWorkingPerspectiveRouteIntegrationContractRouteFile =
  "app/api/workplane/current-working-perspective-route-integration-contracts/route.ts";
const handoffContextUpdateContractRouteFile =
  "app/api/workplane/handoff-context-update-contracts/route.ts";
const currentWorkingPerspectiveApplySliceFiles = [
  "types/current-working-perspective-apply-preview.ts",
  "lib/workplane/current-working-perspective-apply-preview.ts",
  "components/workplane/current-working-perspective-apply-preview-panel.tsx",
  "types/current-working-perspective-apply-decision.ts",
  "lib/workplane/current-working-perspective-apply-decision.ts",
  "components/workplane/current-working-perspective-apply-decision-panel.tsx",
  "types/current-working-perspective-apply-write.ts",
  "lib/workplane/current-working-perspective-apply-write.ts",
  currentWorkingPerspectiveApplyRouteFile,
  "types/current-working-perspective-apply-record-review.ts",
  "lib/workplane/current-working-perspective-apply-record-review.ts",
  "lib/workplane/read-current-working-perspective-apply-record-review-for-web.ts",
  "components/workplane/current-working-perspective-apply-record-review-panel.tsx",
  "lib/perspective/read-applied-current-working-perspective-for-web.ts",
  "components/workplane/applied-current-working-perspective-panel.tsx",
  "types/current-working-perspective-route-integration-contract-preview.ts",
  "lib/workplane/current-working-perspective-route-integration-contract-preview.ts",
  "components/workplane/current-working-perspective-route-integration-contract-preview-panel.tsx",
  "types/current-working-perspective-route-integration-contract-decision.ts",
  "lib/workplane/current-working-perspective-route-integration-contract-decision.ts",
  "components/workplane/current-working-perspective-route-integration-contract-decision-panel.tsx",
  "types/current-working-perspective-route-integration-contract-write.ts",
  "lib/workplane/current-working-perspective-route-integration-contract-write.ts",
  "app/api/workplane/current-working-perspective-route-integration-contracts/route.ts",
  "types/current-working-perspective-route-integration-contract-record-review.ts",
  "lib/workplane/current-working-perspective-route-integration-contract-record-review.ts",
  "lib/workplane/read-current-working-perspective-route-integration-contract-record-review-for-web.ts",
  "components/workplane/current-working-perspective-route-integration-contract-record-review-panel.tsx",
  "types/current-working-perspective-route-integration-read.ts",
  "lib/perspective/current-working-perspective-route-integration-read.ts",
  "lib/perspective/read-current-working-perspective-route-integration-for-web.ts",
  "types/current-working-perspective-route-integration-read-review.ts",
  "lib/workplane/current-working-perspective-route-integration-read-review.ts",
  "components/workplane/current-working-perspective-route-integration-read-panel.tsx",
  "app/api/perspective/current/route.ts",
  "scripts/smoke-current-working-perspective-route-integration-slice-v0-1.mjs",
  "scripts/smoke-current-working-perspective-route-integration-contract-v0-1.mjs",
  "scripts/smoke-current-working-perspective-apply-slice-v0-1.mjs",
];
const handoffContextUpdateContractFiles = [
  "types/handoff-context-update-contract-preview.ts",
  "lib/workplane/handoff-context-update-contract-preview.ts",
  "components/workplane/handoff-context-update-contract-preview-panel.tsx",
  "types/handoff-context-update-contract-decision.ts",
  "lib/workplane/handoff-context-update-contract-decision.ts",
  "components/workplane/handoff-context-update-contract-decision-panel.tsx",
  "types/handoff-context-update-contract-write.ts",
  "lib/workplane/handoff-context-update-contract-write.ts",
  handoffContextUpdateContractRouteFile,
  "types/handoff-context-update-contract-record-review.ts",
  "lib/workplane/handoff-context-update-contract-record-review.ts",
  "lib/workplane/read-handoff-context-update-contract-record-review-for-web.ts",
  "components/workplane/handoff-context-update-contract-record-review-panel.tsx",
  "scripts/smoke-handoff-context-update-contract-v0-1.mjs",
];
const selectedSessionDigestIntakeSmokeFile =
  "scripts/smoke-selected-session-digest-intake-preview-v0-1.mjs";
const applyWriteContractSmokeFile =
  "scripts/smoke-handoff-context-apply-write-contract-preview-v0-1.mjs";
const smokeFile =
  "scripts/smoke-workbench-dogfood-loop-spine-overview-v0-1.mjs";
const packageJsonFile = "package.json";

const allowedChangedFiles = [
  typeFile,
  helperFile,
  panelFile,
  agentWorkplaneFile,
  smokeFile,
  agentWorkplaneSmokeFile,
  selectedSessionDigestIngestContractTypeFile,
  selectedSessionDigestIngestContractHelperFile,
  selectedSessionDigestIngestContractPanelFile,
  selectedSessionDigestIngestContractSmokeFile,
  selectedSessionDigestIngestOperatorDecisionTypeFile,
  selectedSessionDigestIngestOperatorDecisionHelperFile,
  selectedSessionDigestIngestOperatorDecisionPanelFile,
  selectedSessionDigestIngestDecisionWriteTypeFile,
  selectedSessionDigestIngestDecisionWriteHelperFile,
  selectedSessionDigestIngestDecisionWriteRouteFile,
  selectedSessionDigestIngestOperatorDecisionSmokeFile,
  selectedSessionDigestIngestWriteTypeFile,
  selectedSessionDigestIngestWriteHelperFile,
  selectedSessionDigestIngestWriteRouteFile,
  selectedSessionDigestIngestRecordReviewTypeFile,
  selectedSessionDigestIngestRecordReviewHelperFile,
  selectedSessionDigestIngestRecordReviewForWebFile,
  selectedSessionDigestIngestRecordReviewPanelFile,
  selectedSessionDigestDurableIngestRecordSmokeFile,
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
  perspectiveRelayUpdateDecisionTypeFile,
  perspectiveRelayUpdateDecisionHelperFile,
  perspectiveRelayUpdateDecisionPanelFile,
  perspectiveRelayUpdateDecisionWriteTypeFile,
  perspectiveRelayUpdateDecisionWriteHelperFile,
  perspectiveRelayUpdateDecisionRouteFile,
  perspectiveRelayUpdateDecisionRecordReviewTypeFile,
  perspectiveRelayUpdateDecisionRecordReviewHelperFile,
  perspectiveRelayUpdateDecisionRecordReviewForWebFile,
  perspectiveRelayUpdateDecisionRecordReviewPanelFile,
  perspectiveRelayUpdateWriteContractTypeFile,
  perspectiveRelayUpdateWriteContractHelperFile,
  perspectiveRelayUpdateWriteContractPanelFile,
  perspectiveRelayUpdateDecisionWriteContractSmokeFile,
  perspectiveNextWorkBiasScopedWritePreviewTypeFile,
  perspectiveNextWorkBiasScopedWritePreviewHelperFile,
  perspectiveNextWorkBiasScopedWritePreviewPanelFile,
  perspectiveNextWorkBiasWriteTypeFile,
  perspectiveNextWorkBiasWriteHelperFile,
  perspectiveNextWorkBiasRouteFile,
  perspectiveNextWorkBiasRecordReviewTypeFile,
  perspectiveNextWorkBiasRecordReviewHelperFile,
  perspectiveNextWorkBiasRecordReviewForWebFile,
  perspectiveNextWorkBiasRecordReviewPanelFile,
  perspectiveNextWorkBiasScopedWriteSmokeFile,
  perspectiveUnitScopedWritePreviewTypeFile,
  perspectiveUnitScopedWritePreviewHelperFile,
  perspectiveUnitScopedWritePreviewPanelFile,
  perspectiveUnitWriteTypeFile,
  perspectiveUnitWriteHelperFile,
  perspectiveUnitRouteFile,
  perspectiveUnitRecordReviewTypeFile,
  perspectiveUnitRecordReviewHelperFile,
  perspectiveUnitRecordReviewForWebFile,
  perspectiveUnitRecordReviewPanelFile,
  perspectiveUnitScopedWriteSmokeFile,
  continuityRelayScopedWritePreviewTypeFile,
  continuityRelayScopedWritePreviewHelperFile,
  continuityRelayScopedWritePreviewPanelFile,
  continuityRelayWriteTypeFile,
  continuityRelayWriteHelperFile,
  continuityRelayRouteFile,
  continuityRelayRecordReviewTypeFile,
  continuityRelayRecordReviewHelperFile,
  continuityRelayRecordReviewForWebFile,
  continuityRelayRecordReviewPanelFile,
  continuityRelayScopedWriteSmokeFile,
  currentWorkingPerspectiveUpdateContractPreviewTypeFile,
  currentWorkingPerspectiveUpdateContractPreviewHelperFile,
  currentWorkingPerspectiveUpdateContractPreviewPanelFile,
  currentWorkingPerspectiveUpdateContractDecisionTypeFile,
  currentWorkingPerspectiveUpdateContractDecisionHelperFile,
  currentWorkingPerspectiveUpdateContractDecisionPanelFile,
  currentWorkingPerspectiveUpdateContractWriteTypeFile,
  currentWorkingPerspectiveUpdateContractWriteHelperFile,
  currentWorkingPerspectiveUpdateContractRouteFile,
  currentWorkingPerspectiveUpdateContractRecordReviewTypeFile,
  currentWorkingPerspectiveUpdateContractRecordReviewHelperFile,
  currentWorkingPerspectiveUpdateContractRecordReviewForWebFile,
  currentWorkingPerspectiveUpdateContractRecordReviewPanelFile,
  currentWorkingPerspectiveUpdateContractSmokeFile,
  ...currentWorkingPerspectiveApplySliceFiles,
  ...handoffContextUpdateContractFiles,
  selectedSessionDigestIntakeSmokeFile,
  applyWriteContractSmokeFile,
  packageJsonFile,
];

const textByFile = loadTextByFile([
  typeFile,
  helperFile,
  panelFile,
  agentWorkplaneFile,
  agentWorkplaneSmokeFile,
  packageJsonFile,
]);
const typeText = textByFile.get(typeFile);
const helperText = textByFile.get(helperFile);
const panelText = textByFile.get(panelFile);
const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
const agentWorkplaneSmokeText = textByFile.get(agentWorkplaneSmokeFile);
const packageJsonText = textByFile.get(packageJsonFile);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:workbench-dogfood-loop-spine-overview-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-workbench-dogfood-loop-spine-overview-v0-1.mjs",
});

assertContainsAll(
  typeText,
  [
    "workbench_dogfood_loop_spine_overview.v0.1",
    "selected_session_intake",
    "selected_session_digest_ingest_contract",
    "selected_session_digest_ingest_operator_decision",
    "selected_session_digest_durable_ingest_record",
    "project_history_intake",
    "project_history_candidate_ingest_record",
    "codex_result_report_intake",
    "codex_result_report_candidate_ingest_record",
    "work_episode_residue_candidate",
    "expected_observed_delta",
    "expected_observed_delta_record",
    "reuse_outcome_candidate_bridge",
    "reuse_outcome_bridge_operator_decision",
    "handoff_reuse_outcome_ledger_record",
    "dogfood_metric_snapshot",
    "dogfood_metric_snapshot_record",
    "next_work_signal_refresh",
    "next_work_signal_operator_decision",
    "next_work_signal_decision_record",
    "perspective_relay_update_candidate_bridge",
    "perspective_relay_update_operator_decision",
    "perspective_relay_update_decision_record",
    "perspective_relay_update_write_contract",
    "perspective_next_work_bias_scoped_write",
    "perspective_next_work_bias_record",
    "perspective_unit_scoped_write",
    "perspective_unit_record",
    "continuity_relay_scoped_write",
    "continuity_relay_record",
    "current_working_perspective_update_contract",
    "current_working_perspective_update_contract_decision",
    "current_working_perspective_update_contract_record",
    "current_working_perspective_apply_preview",
    "current_working_perspective_apply_decision",
    "current_working_perspective_apply_record",
    "applied_current_working_perspective_snapshot",
    "current_working_perspective_route_integration_contract",
    "current_working_perspective_route_integration_contract_decision",
    "current_working_perspective_route_integration_contract_record",
    "current_working_perspective_route_integration_read",
    "current_working_perspective_route_integration_review",
    "handoff_context_update_contract",
    "handoff_context_update_contract_decision",
    "handoff_context_update_contract_record",
    "review_expected_observed_delta_candidates",
    "write_expected_observed_delta_record",
    "review_reuse_outcome_candidate_bridge",
    "prepare_reuse_outcome_operator_decision",
    "resolve_expected_observed_delta_blockers",
    "review_reuse_outcome_bridge_decision",
    "write_handoff_reuse_outcome_ledger_record",
    "review_handoff_reuse_outcome_ledger_record",
    "resolve_reuse_outcome_bridge_blockers",
    "review_dogfood_metric_snapshot_candidates",
    "review_continuity_relay_scoped_write",
    "write_continuity_relay_record",
    "review_continuity_relay_record",
    "resolve_continuity_relay_blockers",
    "review_current_working_perspective_update_contract",
    "approve_current_working_perspective_update_contract_record",
    "write_current_working_perspective_update_contract_record",
    "review_current_working_perspective_update_contract_record",
    "resolve_current_working_perspective_update_contract_blockers",
    "prepare_current_working_perspective_apply_slice",
    "review_current_working_perspective_apply_preview",
    "approve_current_working_perspective_apply_record",
    "write_current_working_perspective_apply_record",
    "review_current_working_perspective_apply_record",
    "review_applied_current_working_perspective_snapshot",
    "resolve_current_working_perspective_apply_blockers",
    "prepare_current_working_perspective_route_integration_contract",
    "prepare_handoff_context_update_contract",
    "review_handoff_context_update_contract",
    "approve_handoff_context_update_contract_record",
    "write_handoff_context_update_contract_record",
    "review_handoff_context_update_contract_record",
    "resolve_handoff_context_update_contract_blockers",
    "prepare_handoff_context_apply_slice",
    "prepare_handoff_packet_copy_export_contract",
    "write_dogfood_metric_snapshot_record",
    "review_dogfood_metric_snapshot_record",
    "review_next_work_signal_refresh",
    "review_next_work_signal_decision",
    "write_next_work_signal_decision_record",
    "review_next_work_signal_decision_record",
    "review_perspective_relay_update_candidates",
    "review_perspective_relay_update_decision",
    "write_perspective_relay_update_decision_record",
    "review_perspective_relay_update_decision_record",
    "review_perspective_relay_update_write_contract",
    "prepare_scoped_perspective_next_work_relay_write_slice",
    "resolve_perspective_relay_update_blockers",
    "review_perspective_next_work_bias_scoped_write",
    "write_perspective_next_work_bias_record",
    "review_perspective_next_work_bias_record",
    "resolve_perspective_next_work_bias_blockers",
    "prepare_perspective_unit_or_relay_write_slice",
    "review_perspective_unit_scoped_write",
    "write_perspective_unit_record",
    "review_perspective_unit_record",
    "resolve_perspective_unit_blockers",
    "prepare_continuity_relay_write_slice",
    "review_continuity_relay_scoped_write",
    "write_continuity_relay_record",
    "review_continuity_relay_record",
    "resolve_continuity_relay_blockers",
    "prepare_current_working_perspective_update_contract",
    "prepare_handoff_context_update_contract",
    "prepare_perspective_next_work_update_decision",
    "prepare_continuity_relay_update_contract",
    "resolve_next_work_signal_blockers",
    "prepare_perspective_next_work_update_preview",
    "resolve_dogfood_metric_snapshot_blockers",
    "prepare_dogfood_metric_candidate_preview",
    "codex_result_feedback",
    "dogfood_reuse_proposal",
    "dogfood_reuse_operator_decision",
    "dogfood_metric_candidate",
    "perspective_next_work_candidate",
    "continuity_relay_adjustment",
    "handoff_context_update",
    "handoff_context_update_decision",
    "approved_handoff_context_update_record_review",
    "handoff_context_apply_preview",
    "handoff_context_apply_decision",
    "handoff_context_apply_write_contract",
    "can_apply_handoff_context: false",
    "can_create_ingest_decision_record: false",
    "can_create_ingest_receipt: false",
    "can_write_work_episode: false",
    "can_write_expected_observed_delta: false",
    "can_write_reuse_outcome_ledger: false",
    "can_render_workbench_action_button: false",
  ],
  { label: typeFile },
);

assertContainsAll(
  helperText,
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
    "codex_result_report_intake_preview",
    "codex_result_report_intake_decision_preview",
    "codex_result_report_intake_record_review",
    "work_episode_residue_candidate_preview",
    "expected_observed_delta_preview",
    "expected_observed_delta_decision_preview",
    "expected_observed_delta_record_review",
    "reuse_outcome_candidate_bridge_preview",
    "reuse_outcome_bridge_operator_decision_preview",
    "reuse_outcome_bridge_ledger_record_review",
    "dogfood_metric_snapshot_preview",
    "dogfood_metric_snapshot_decision_preview",
    "dogfood_metric_snapshot_record_review",
    "next_work_signal_refresh_preview",
    "next_work_signal_decision_preview",
    "next_work_signal_decision_record_review",
    "perspective_relay_update_candidate_bridge_preview",
    "perspective_relay_update_operator_decision_preview",
    "perspective_relay_update_decision_record_review",
    "perspective_relay_update_write_contract_preview",
    "perspective_next_work_bias_scoped_write_preview",
    "perspective_next_work_bias_record_review",
    "perspective_unit_scoped_write_preview",
    "perspective_unit_record_review",
    "continuity_relay_scoped_write_preview",
    "continuity_relay_record_review",
    "current_working_perspective_update_contract_preview",
    "current_working_perspective_update_contract_decision_preview",
    "current_working_perspective_update_contract_record_review",
    "current_working_perspective_route_integration_read",
    "current_working_perspective_route_integration_read_review",
    "handoff_context_update_contract_preview",
    "handoff_context_update_contract_decision_preview",
    "handoff_context_update_contract_record_review",
    "selectedSessionDigestIngestContractStep",
    "selectedSessionDigestIngestOperatorDecisionStep",
    "selectedSessionDigestDurableIngestRecordStep",
    "projectHistoryIntakeStep",
    "projectHistoryCandidateIngestRecordStep",
    "codexResultReportIntakeStep",
    "codexResultReportCandidateIngestRecordStep",
    "workEpisodeResidueCandidateStep",
    "expectedObservedDeltaStep",
    "expectedObservedDeltaRecordStep",
    "reuseOutcomeCandidateBridgeStep",
    "reuseOutcomeBridgeOperatorDecisionStep",
    "handoffReuseOutcomeLedgerRecordStep",
    "dogfoodMetricSnapshotStep",
    "dogfoodMetricSnapshotRecordStep",
    "nextWorkSignalRefreshStep",
    "nextWorkSignalDecisionStep",
    "nextWorkSignalDecisionRecordStep",
    "perspectiveRelayUpdateCandidateBridgeStep",
    "perspectiveRelayUpdateDecisionStep",
    "perspectiveRelayUpdateDecisionRecordStep",
    "perspectiveRelayUpdateWriteContractStep",
    "perspectiveNextWorkBiasScopedWriteStep",
    "perspectiveNextWorkBiasRecordStep",
    "perspectiveUnitScopedWriteStep",
    "perspectiveUnitRecordStep",
    "continuityRelayScopedWriteStep",
    "continuityRelayRecordStep",
    "currentWorkingPerspectiveUpdateContractStep",
    "currentWorkingPerspectiveUpdateContractDecisionStep",
    "currentWorkingPerspectiveUpdateContractRecordStep",
    "currentWorkingPerspectiveApplyPreviewStep",
    "currentWorkingPerspectiveApplyDecisionStep",
    "currentWorkingPerspectiveApplyRecordStep",
    "appliedCurrentWorkingPerspectiveSnapshotStep",
    "handoffContextUpdateContractStep",
    "handoffContextUpdateContractDecisionStep",
    "handoffContextUpdateContractRecordStep",
    "codex_result_feedback_draft",
    "dogfood_reuse_record_proposal",
    "handoff_context_apply_write_contract_preview",
    "missing_codex_result_report",
    "current_handoff_packet_fingerprint_missing",
    "prepare_operator_approved_selected_session_digest_ingest_decision_record",
    "write_selected_session_digest_candidate_ingest_record",
    "review_selected_session_digest_ingest_record",
    "supply_project_history_digest",
    "write_project_history_candidate_ingest_record",
    "review_project_history_intake_record",
    "write_codex_result_report_candidate_ingest_record",
    "review_codex_result_report_intake_record",
    "review_work_episode_residue_candidates",
    "review_expected_observed_delta_candidates",
    "write_expected_observed_delta_record",
    "review_reuse_outcome_candidate_bridge",
    "review_reuse_outcome_bridge_decision",
    "write_handoff_reuse_outcome_ledger_record",
    "review_handoff_reuse_outcome_ledger_record",
    "write_next_work_signal_decision_record",
    "review_next_work_signal_decision_record",
    "review_perspective_relay_update_candidates",
    "review_perspective_next_work_bias_scoped_write",
    "write_perspective_next_work_bias_record",
    "review_perspective_next_work_bias_record",
    "resolve_perspective_next_work_bias_blockers",
    "prepare_perspective_unit_or_relay_write_slice",
    "review_perspective_unit_scoped_write",
    "write_perspective_unit_record",
    "review_perspective_unit_record",
    "resolve_perspective_unit_blockers",
    "prepare_continuity_relay_write_slice",
    "review_continuity_relay_scoped_write",
    "write_continuity_relay_record",
    "review_continuity_relay_record",
    "resolve_continuity_relay_blockers",
    "review_current_working_perspective_update_contract",
    "approve_current_working_perspective_update_contract_record",
    "write_current_working_perspective_update_contract_record",
    "review_current_working_perspective_update_contract_record",
    "resolve_current_working_perspective_update_contract_blockers",
    "prepare_current_working_perspective_apply_slice",
    "prepare_current_working_perspective_update_contract",
    "prepare_handoff_context_update_contract",
    "review_handoff_context_update_contract",
    "approve_handoff_context_update_contract_record",
    "write_handoff_context_update_contract_record",
    "review_handoff_context_update_contract_record",
    "resolve_handoff_context_update_contract_blockers",
    "prepare_handoff_context_apply_slice",
    "prepare_handoff_packet_copy_export_contract",
    "does_not_call_expected_observed_delta_route_from_workbench_overview",
    "does_not_write_reuse_outcome_ledger_or_dogfood_metrics",
    "does_not_write_memory",
    "does_not_promote_selected_digest_ingest_records_to_memory_or_perspective",
    "does_not_apply_live_handoff_context",
    "can_call_provider_openai: false",
    "can_execute_codex: false",
  ],
  { label: helperFile },
);

assertContainsAll(
  panelText,
  [
    "Workbench Dogfood Loop Spine Overview",
    "recommended next operator action",
    "spine steps",
    "would not",
    "authority boundary",
    "Read-only derived read model",
    "can_write_db",
    "can_apply_handoff_context",
    "can_execute_codex",
  ],
  { label: panelFile },
);

assertContainsAll(
  agentWorkplaneText,
  [
    "WorkbenchDogfoodLoopSpineOverviewPanel",
    "buildWorkbenchDogfoodLoopSpineOverviewV01",
    "workbenchDogfoodLoopSpineOverview",
    "preview={workbenchDogfoodLoopSpineOverview}",
    "selected_session_digest_ingest_contract_preview: selectedSessionDigestIngestContractPreview",
    "selected_session_digest_ingest_operator_decision_preview: selectedSessionDigestIngestOperatorDecisionPreview",
    "selected_session_digest_ingest_record_review:\n        selectedSessionDigestIngestRecordReview",
    "project_history_intake_preview: projectHistoryIntakePreview",
    "project_history_intake_operator_decision_preview:\n        projectHistoryIntakeOperatorDecisionPreview",
    "project_history_intake_record_review: projectHistoryIntakeRecordReview",
    "codex_result_report_intake_preview: codexResultReportIntakePreview",
    "codex_result_report_intake_decision_preview:\n        codexResultReportIntakeDecisionPreview",
    "codex_result_report_intake_record_review:\n        codexResultReportIntakeRecordReview",
    "work_episode_residue_candidate_preview:\n        workEpisodeResidueCandidatePreview",
    "perspective_next_work_bias_scoped_write_preview:\n        perspectiveNextWorkBiasScopedWritePreview",
    "perspective_next_work_bias_record_review:\n        perspectiveNextWorkBiasRecordReview",
    "perspective_unit_scoped_write_preview:\n        perspectiveUnitScopedWritePreview",
    "perspective_unit_record_review:\n        perspectiveUnitRecordReview",
    "continuity_relay_scoped_write_preview:\n        continuityRelayScopedWritePreview",
    "continuity_relay_record_review: continuityRelayRecordReview",
    "current_working_perspective_update_contract_preview:\n        currentWorkingPerspectiveUpdateContractPreview",
    "current_working_perspective_update_contract_decision_preview:\n        currentWorkingPerspectiveUpdateContractDecisionPreview",
    "current_working_perspective_update_contract_record_review:\n        currentWorkingPerspectiveUpdateContractRecordReview",
    "current_working_perspective_apply_preview:\n        currentWorkingPerspectiveApplyPreview",
    "current_working_perspective_apply_decision_preview:\n        currentWorkingPerspectiveApplyDecisionPreview",
    "current_working_perspective_apply_record_review:\n        currentWorkingPerspectiveApplyRecordReview",
    "applied_current_working_perspective_read:\n        appliedCurrentWorkingPerspectiveRead",
    "current_working_perspective_route_integration_read:\n        currentWorkingPerspectiveRouteIntegrationRead",
    "current_working_perspective_route_integration_read_review:\n        currentWorkingPerspectiveRouteIntegrationReadReview",
    "handoff_context_update_contract_preview:\n        handoffContextUpdateContractPreview",
    "handoff_context_update_contract_decision_preview:\n        handoffContextUpdateContractDecisionPreview",
    "handoff_context_update_contract_record_review:\n        handoffContextUpdateContractRecordReview",
    "workbench:dogfood_loop_spine_overview",
    "handoff_context_apply_write_contract_preview",
  ],
  { label: agentWorkplaneFile },
);

assertContainsAll(
  agentWorkplaneSmokeText,
  [
    "followOnWorkbenchDogfoodLoopSpineOverviewFiles",
    "followOnCurrentWorkingPerspectiveUpdateContractFiles",
    "followOnCurrentWorkingPerspectiveApplySliceFiles",
    "followOnHandoffContextUpdateContractFiles",
    "WorkbenchDogfoodLoopSpineOverviewPanel",
    "buildWorkbenchDogfoodLoopSpineOverviewV01",
    "workbenchDogfoodLoopSpineOverview",
    "preview={workbenchDogfoodLoopSpineOverview}",
  ],
  { label: agentWorkplaneSmokeFile },
);

assertNoForbiddenRuntimeCall(helperFile, helperText);
assertNoForbiddenRuntimeCall(panelFile, panelText);
assertNoForbiddenRuntimeCall(agentWorkplaneFile, agentWorkplaneText);
assertNoWorkbenchActionButtons(panelFile, panelText);
assertNoWorkbenchActionButtons(agentWorkplaneFile, agentWorkplaneText);
assertNoForbiddenChangedPaths();
assertAgentWorkbenchOverviewDoesNotRebuildInputs(agentWorkplaneText);

const overviewModule = await import(
  "../lib/workplane/workbench-dogfood-loop-spine-overview.ts"
);
const intakeModule = await import(
  "../lib/intake/selected-session-digest-intake-preview.ts"
);
const ingestContractModule = await import(
  "../lib/intake/selected-session-digest-ingest-contract-preview.ts"
);
const ingestOperatorDecisionModule = await import(
  "../lib/intake/selected-session-digest-ingest-operator-decision.ts"
);
const ingestRecordReviewModule = await import(
  "../lib/intake/selected-session-digest-ingest-record-review.ts"
);
const projectHistoryIntakeModule = await import(
  "../lib/intake/project-history-intake-preview.ts"
);
const projectHistoryDecisionModule = await import(
  "../lib/intake/project-history-intake-decision.ts"
);
const projectHistoryRecordReviewModule = await import(
  "../lib/intake/project-history-intake-record-review.ts"
);
const codexResultReportIntakeModule = await import(
  "../lib/intake/codex-result-report-intake-preview.ts"
);
const codexResultReportDecisionModule = await import(
  "../lib/intake/codex-result-report-intake-decision.ts"
);
const codexResultReportRecordReviewModule = await import(
  "../lib/intake/codex-result-report-intake-record-review.ts"
);
const workEpisodeResidueModule = await import(
  "../lib/workplane/work-episode-residue-candidate-preview.ts"
);
const expectedObservedDeltaPreviewModule = await import(
  "../lib/dogfooding/expected-observed-delta-preview.ts"
);
const expectedObservedDeltaDecisionModule = await import(
  "../lib/dogfooding/expected-observed-delta-decision.ts"
);
const expectedObservedDeltaRecordReviewModule = await import(
  "../lib/dogfooding/expected-observed-delta-record-review.ts"
);
const reuseOutcomeCandidateBridgeModule = await import(
  "../lib/dogfooding/reuse-outcome-candidate-bridge-preview.ts"
);
const reuseOutcomeBridgeDecisionModule = await import(
  "../lib/dogfooding/reuse-outcome-bridge-decision.ts"
);

const {
  buildWorkbenchDogfoodLoopSpineOverviewV01,
  createWorkbenchDogfoodLoopSpineOverviewAuthorityBoundaryV01,
} = overviewModule;
const { buildSelectedSessionDigestIntakePreviewV01 } = intakeModule;
const { buildSelectedSessionDigestIngestContractPreviewV01 } =
  ingestContractModule;
const { buildSelectedSessionDigestIngestOperatorDecisionPreviewV01 } =
  ingestOperatorDecisionModule;
const { buildSelectedSessionDigestIngestRecordReviewV01 } =
  ingestRecordReviewModule;
const { buildProjectHistoryIntakePreviewV01 } = projectHistoryIntakeModule;
const { buildProjectHistoryIntakeOperatorDecisionPreviewV01 } =
  projectHistoryDecisionModule;
const { buildProjectHistoryIntakeRecordReviewV01 } =
  projectHistoryRecordReviewModule;
const { buildCodexResultReportIntakePreviewV01 } =
  codexResultReportIntakeModule;
const { buildCodexResultReportIntakeOperatorDecisionPreviewV01 } =
  codexResultReportDecisionModule;
const { buildCodexResultReportIntakeRecordReviewV01 } =
  codexResultReportRecordReviewModule;
const { buildWorkEpisodeResidueCandidatePreviewV01 } =
  workEpisodeResidueModule;
const { buildExpectedObservedDeltaPreviewV01 } =
  expectedObservedDeltaPreviewModule;
const { buildExpectedObservedDeltaOperatorDecisionPreviewV01 } =
  expectedObservedDeltaDecisionModule;
const { buildExpectedObservedDeltaRecordReviewV01 } =
  expectedObservedDeltaRecordReviewModule;
const { buildReuseOutcomeCandidateBridgePreviewV01 } =
  reuseOutcomeCandidateBridgeModule;
const { buildReuseOutcomeBridgeOperatorDecisionPreviewV01 } =
  reuseOutcomeBridgeDecisionModule;

const emptyOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  scope: "project:augnes",
  as_of: "2026-07-04T14:30:00.000Z",
});
assert(
  ["no_current_material", "insufficient_data"].includes(
    emptyOverview.overview_status,
  ),
  "empty overview must not fake completion",
);
assert.equal(
  emptyOverview.recommended_next_operator_action,
  "supply_selected_session_digest",
);
assert.equal(emptyOverview.spine_steps.length, 56);
assert(
  emptyOverview.spine_steps.some(
    (step) => step.step_id === "project_history_intake",
  ),
  "overview should include project history intake step",
);
assert(
  emptyOverview.spine_steps.some(
    (step) => step.step_id === "project_history_candidate_ingest_record",
  ),
  "overview should include project history candidate ingest record step",
);
for (const stepId of [
  "perspective_relay_update_operator_decision",
  "perspective_relay_update_decision_record",
  "perspective_relay_update_write_contract",
  "handoff_context_update_contract",
  "handoff_context_update_contract_decision",
  "handoff_context_update_contract_record",
]) {
  assert(
    emptyOverview.spine_steps.some((step) => step.step_id === stepId),
    `overview should include ${stepId} step`,
  );
}
assert(
  emptyOverview.spine_steps.some(
    (step) => step.step_id === "codex_result_report_intake",
  ),
  "overview should include Codex result report intake step",
);
assert(
  emptyOverview.spine_steps.some(
    (step) => step.step_id === "codex_result_report_candidate_ingest_record",
  ),
  "overview should include Codex result report candidate ingest record step",
);
assert(
  emptyOverview.spine_steps.some(
    (step) => step.step_id === "work_episode_residue_candidate",
  ),
  "overview should include work episode residue candidate step",
);
assert(
  emptyOverview.spine_steps.some(
    (step) => step.step_id === "expected_observed_delta",
  ),
  "overview should include ExpectedObservedDelta step",
);
assert(
  emptyOverview.spine_steps.some(
    (step) => step.step_id === "expected_observed_delta_record",
  ),
  "overview should include ExpectedObservedDelta record step",
);
assert(
  emptyOverview.spine_steps.some(
    (step) => step.step_id === "reuse_outcome_candidate_bridge",
  ),
  "overview should include reuse outcome candidate bridge step",
);
assertAuthorityFalse(emptyOverview.authority_boundary);

const cleanSelectedIntake = buildSelectedSessionDigestIntakePreviewV01({
  digest: {
    summary: "Operator selected a bounded digest for spine review.",
    goals: ["Review current dogfood spine restart material."],
    decisions: ["Keep this overview preview-only."],
    evidence_refs: ["evidence:spine-overview-clean"],
    session_ref: "session:spine-overview-clean",
  },
  source_kind: "chatgpt_session_digest",
  source_ref: "source:spine-overview-clean",
  operator_ref: "operator:reviewer",
  scope: "project:augnes",
  as_of: "2026-07-04T14:30:00.000Z",
});
const selectedReadyOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  selected_session_digest_intake_preview: cleanSelectedIntake,
  scope: "project:augnes",
  as_of: "2026-07-04T14:30:00.000Z",
});
const selectedStep = stepById(selectedReadyOverview, "selected_session_intake");
assert.equal(selectedStep.status, "ready_for_operator_review");
assert.equal(selectedStep.material_count > 0, true);
assert.equal(selectedReadyOverview.authority_boundary.can_write_memory, false);
assert.equal(
  selectedReadyOverview.authority_boundary
    .can_mutate_current_working_perspective,
  false,
);

const selectedIngestContractMissingMaterial =
  buildSelectedSessionDigestIngestContractPreviewV01({
    selected_session_digest_intake_preview: cleanSelectedIntake,
  });
const selectedContractOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  selected_session_digest_intake_preview: cleanSelectedIntake,
  selected_session_digest_ingest_contract_preview:
    selectedIngestContractMissingMaterial,
  scope: "project:augnes",
  as_of: "2026-07-04T14:30:00.000Z",
});
const selectedContractStep = stepById(
  selectedContractOverview,
  "selected_session_digest_ingest_contract",
);
assert.equal(selectedContractStep.status, "candidate_material_available");
assert.equal(
  selectedContractOverview.recommended_next_operator_action,
  "supply_privacy_review_confirmation",
);
assert(
  selectedContractOverview.current_material_gaps.some((gap) =>
    gap.includes("privacy_review_confirmation_ref_missing"),
  ),
  "overview should surface selected digest ingest contract material gaps",
);

const selectedCandidateRef =
  selectedIngestContractMissingMaterial.would_ingest_material_preview
    .selectable_digest_candidate_refs[0];
assert(selectedCandidateRef, "selected digest contract should expose selectable refs");
const selectedReadyIngestContract =
  buildSelectedSessionDigestIngestContractPreviewV01({
    selected_session_digest_intake_preview: cleanSelectedIntake,
    selected_candidate_refs: [selectedCandidateRef],
    privacy_review_confirmation_ref: "privacy:spine-overview-clean",
    requested_idempotency_key: "idempotency:spine-overview-clean",
    requested_ingest_scope_ref: "scope:spine-overview-clean",
  });
const selectedReadyIngestDecision =
  buildSelectedSessionDigestIngestOperatorDecisionPreviewV01({
    selected_session_digest_ingest_contract_preview:
      selectedReadyIngestContract,
  });
const selectedDecisionOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  selected_session_digest_intake_preview: cleanSelectedIntake,
  selected_session_digest_ingest_contract_preview: selectedReadyIngestContract,
  selected_session_digest_ingest_operator_decision_preview:
    selectedReadyIngestDecision,
  scope: "project:augnes",
  as_of: "2026-07-04T14:30:00.000Z",
});
assert(
  selectedDecisionOverview.spine_steps.some(
    (step) =>
      step.step_id === "selected_session_digest_ingest_operator_decision",
  ),
  "overview should include selected digest ingest operator decision step",
);
assert.equal(
  selectedDecisionOverview.recommended_next_operator_action,
  "prepare_operator_approved_selected_session_digest_ingest_decision_record",
);
assert.notEqual(
  selectedDecisionOverview.recommended_next_operator_action,
  "prepare_separate_ingest_write_slice",
);

const selectedNoRecordReview = buildSelectedSessionDigestIngestRecordReviewV01({
  records: [],
  as_of: "2026-07-04T14:30:00.000Z",
});
const selectedDurableWriteOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  selected_session_digest_intake_preview: cleanSelectedIntake,
  selected_session_digest_ingest_contract_preview: selectedReadyIngestContract,
  selected_session_digest_ingest_operator_decision_preview:
    selectedReadyIngestDecision,
  selected_session_digest_ingest_record_review: selectedNoRecordReview,
  scope: "project:augnes",
  as_of: "2026-07-04T14:30:00.000Z",
});
assert.equal(
  stepById(
    selectedDurableWriteOverview,
    "selected_session_digest_durable_ingest_record",
  ).recommended_next_action,
  "write_selected_session_digest_candidate_ingest_record",
);
assert.equal(
  selectedDurableWriteOverview.recommended_next_operator_action,
  "write_selected_session_digest_candidate_ingest_record",
);
assertNoMemoryPromotionActions(selectedDurableWriteOverview);

const selectedRecordReview = buildSelectedSessionDigestIngestRecordReviewV01({
  records: [fakeSelectedDigestIngestRecord()],
  as_of: "2026-07-04T14:30:00.000Z",
});
const selectedRecordReviewOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  selected_session_digest_intake_preview: cleanSelectedIntake,
  selected_session_digest_ingest_contract_preview: selectedReadyIngestContract,
  selected_session_digest_ingest_operator_decision_preview:
    selectedReadyIngestDecision,
  selected_session_digest_ingest_record_review: selectedRecordReview,
  scope: "project:augnes",
  as_of: "2026-07-04T14:30:00.000Z",
});
assert.equal(
  stepById(
    selectedRecordReviewOverview,
    "selected_session_digest_durable_ingest_record",
  ).recommended_next_action,
  "review_selected_session_digest_ingest_record",
);
assertNoMemoryPromotionActions(selectedRecordReviewOverview);

const emptyProjectHistoryPreview = buildProjectHistoryIntakePreviewV01({
  scope: "project:augnes",
  as_of: "2026-07-04T14:30:00.000Z",
});
const emptyProjectHistoryDecision =
  buildProjectHistoryIntakeOperatorDecisionPreviewV01({
    project_history_intake_preview: emptyProjectHistoryPreview,
  });
const emptyProjectHistoryRecordReview =
  buildProjectHistoryIntakeRecordReviewV01({
    records: [],
    as_of: "2026-07-04T14:30:00.000Z",
  });
const projectHistoryMissingOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  selected_session_digest_intake_preview: cleanSelectedIntake,
  selected_session_digest_ingest_contract_preview: selectedReadyIngestContract,
  selected_session_digest_ingest_operator_decision_preview:
    selectedReadyIngestDecision,
  selected_session_digest_ingest_record_review: selectedRecordReview,
  project_history_intake_preview: emptyProjectHistoryPreview,
  project_history_intake_operator_decision_preview: emptyProjectHistoryDecision,
  project_history_intake_record_review: emptyProjectHistoryRecordReview,
});
assert.equal(
  stepById(projectHistoryMissingOverview, "project_history_intake").status,
  "no_current_material",
);
assert.equal(
  projectHistoryMissingOverview.recommended_next_operator_action,
  "supply_project_history_digest",
);

const cleanProjectHistoryIntake = buildProjectHistoryIntakePreviewV01({
  digest: {
    title: "Project history spine digest",
    summary: "Project history candidate intake is ready for bounded review.",
    timeline_events: ["Selected digest candidate ledger reached durable record"],
    decisions: ["Keep project history candidate records separate from memory"],
    requirements: ["Require source, project, operator, evidence, privacy, and idempotency refs"],
    evidence_refs: ["evidence:project-history-overview-clean"],
    source_refs: ["source:project-history-overview-clean"],
    project_ref: "project:augnes",
    created_at: "2026-07-04T14:30:00.000Z",
  },
  source_ref: "source:project-history-overview-clean",
  operator_ref: "operator:project-history-overview",
});
const projectHistoryCandidateRef =
  cleanProjectHistoryIntake.candidate_material.timeline_event_candidates[0]
    .candidate_id;
const readyProjectHistoryDecision =
  buildProjectHistoryIntakeOperatorDecisionPreviewV01({
    project_history_intake_preview: cleanProjectHistoryIntake,
    selected_candidate_refs: [projectHistoryCandidateRef],
    privacy_review_confirmation_ref: "privacy:project-history-overview-clean",
    requested_idempotency_key: "idempotency:project-history-overview-clean",
  });
const projectHistoryWriteOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  selected_session_digest_intake_preview: cleanSelectedIntake,
  selected_session_digest_ingest_contract_preview: selectedReadyIngestContract,
  selected_session_digest_ingest_operator_decision_preview:
    selectedReadyIngestDecision,
  selected_session_digest_ingest_record_review: selectedRecordReview,
  project_history_intake_preview: cleanProjectHistoryIntake,
  project_history_intake_operator_decision_preview:
    readyProjectHistoryDecision,
  project_history_intake_record_review: emptyProjectHistoryRecordReview,
});
assert.equal(
  projectHistoryWriteOverview.recommended_next_operator_action,
  "write_project_history_candidate_ingest_record",
);
assertNoMemoryPromotionActions(projectHistoryWriteOverview);

const projectHistoryRecordReview = buildProjectHistoryIntakeRecordReviewV01({
  records: [fakeProjectHistoryIntakeRecord()],
});
const projectHistoryRecordOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  selected_session_digest_intake_preview: cleanSelectedIntake,
  selected_session_digest_ingest_contract_preview: selectedReadyIngestContract,
  selected_session_digest_ingest_operator_decision_preview:
    selectedReadyIngestDecision,
  selected_session_digest_ingest_record_review: selectedRecordReview,
  project_history_intake_preview: cleanProjectHistoryIntake,
  project_history_intake_operator_decision_preview:
    readyProjectHistoryDecision,
  project_history_intake_record_review: projectHistoryRecordReview,
});
assert.equal(
  projectHistoryRecordOverview.recommended_next_operator_action,
  "review_project_history_intake_record",
);
assertNoMemoryPromotionActions(projectHistoryRecordOverview);

const emptyCodexResultPreview = buildCodexResultReportIntakePreviewV01({
  scope: "project:augnes",
  as_of: "2026-07-04T14:30:00.000Z",
});
const emptyCodexResultDecision =
  buildCodexResultReportIntakeOperatorDecisionPreviewV01({
    codex_result_report_intake_preview: emptyCodexResultPreview,
  });
const emptyCodexResultRecordReview =
  buildCodexResultReportIntakeRecordReviewV01({
    records: [],
    as_of: "2026-07-04T14:30:00.000Z",
  });
const emptyResiduePreview = buildWorkEpisodeResidueCandidatePreviewV01({
  codex_result_report_intake_preview: emptyCodexResultPreview,
  codex_result_report_intake_record_review: emptyCodexResultRecordReview,
});
const codexResultMissingOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  selected_session_digest_intake_preview: cleanSelectedIntake,
  selected_session_digest_ingest_contract_preview: selectedReadyIngestContract,
  selected_session_digest_ingest_operator_decision_preview:
    selectedReadyIngestDecision,
  selected_session_digest_ingest_record_review: selectedRecordReview,
  codex_result_report_intake_preview: emptyCodexResultPreview,
  codex_result_report_intake_decision_preview: emptyCodexResultDecision,
  codex_result_report_intake_record_review: emptyCodexResultRecordReview,
  work_episode_residue_candidate_preview: emptyResiduePreview,
});
assert.equal(
  stepById(codexResultMissingOverview, "codex_result_report_intake").status,
  "no_current_material",
);
assert.equal(
  codexResultMissingOverview.recommended_next_operator_action,
  "supply_codex_result_report",
);

const cleanCodexResultIntake = buildCodexResultReportIntakePreviewV01({
  result_report: {
    summary: "Codex result report candidate intake is ready for bounded review.",
    result_status: "completed",
    changed_files: ["lib/intake/codex-result-report-intake-preview.ts"],
    checks: ["npm run typecheck passed"],
    requirement_progress: ["Codex result candidate ledger visible in Workbench"],
    expected_vs_observed: ["Expected candidate-only return path; observed no promotion authority"],
    context_feedback: ["Useful return-binding residue candidate"],
    evidence_refs: ["evidence:codex-result-overview-clean"],
    source_refs: ["source:codex-result-overview-clean"],
    work_ref: "work:codex-result-overview-clean",
    result_ref: "result:codex-result-overview-clean",
    created_at: "2026-07-04T14:30:00.000Z",
  },
  source_ref: "source:codex-result-overview-clean",
  operator_ref: "operator:codex-result-overview",
  work_ref: "work:codex-result-overview-clean",
  result_ref: "result:codex-result-overview-clean",
});
const codexResultCandidateRef =
  cleanCodexResultIntake.candidate_material.result_summary_candidates[0]
    .candidate_id;
const readyCodexResultDecision =
  buildCodexResultReportIntakeOperatorDecisionPreviewV01({
    codex_result_report_intake_preview: cleanCodexResultIntake,
    selected_candidate_refs: [codexResultCandidateRef],
    privacy_review_confirmation_ref: "privacy:codex-result-overview-clean",
    requested_idempotency_key: "idempotency:codex-result-overview-clean",
  });
const codexResultResidueFromIntake =
  buildWorkEpisodeResidueCandidatePreviewV01({
    codex_result_report_intake_preview: cleanCodexResultIntake,
  });
const codexResultWriteOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  selected_session_digest_intake_preview: cleanSelectedIntake,
  selected_session_digest_ingest_contract_preview: selectedReadyIngestContract,
  selected_session_digest_ingest_operator_decision_preview:
    selectedReadyIngestDecision,
  selected_session_digest_ingest_record_review: selectedRecordReview,
  codex_result_report_intake_preview: cleanCodexResultIntake,
  codex_result_report_intake_decision_preview: readyCodexResultDecision,
  codex_result_report_intake_record_review: emptyCodexResultRecordReview,
  work_episode_residue_candidate_preview: codexResultResidueFromIntake,
});
assert.equal(
  codexResultWriteOverview.recommended_next_operator_action,
  "write_codex_result_report_candidate_ingest_record",
);
assertNoMemoryPromotionActions(codexResultWriteOverview);

const codexResultRecordReview = buildCodexResultReportIntakeRecordReviewV01({
  records: [fakeCodexResultReportIntakeRecord()],
});
const codexResultResidueFromRecord =
  buildWorkEpisodeResidueCandidatePreviewV01({
    codex_result_report_intake_record_review: codexResultRecordReview,
  });
const codexResultRecordOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  selected_session_digest_intake_preview: cleanSelectedIntake,
  selected_session_digest_ingest_contract_preview: selectedReadyIngestContract,
  selected_session_digest_ingest_operator_decision_preview:
    selectedReadyIngestDecision,
  selected_session_digest_ingest_record_review: selectedRecordReview,
  codex_result_report_intake_preview: cleanCodexResultIntake,
  codex_result_report_intake_decision_preview: readyCodexResultDecision,
  codex_result_report_intake_record_review: codexResultRecordReview,
  work_episode_residue_candidate_preview: codexResultResidueFromRecord,
});
assert.equal(
  codexResultRecordOverview.recommended_next_operator_action,
  "review_codex_result_report_intake_record",
);
assert(
  stepById(
    codexResultRecordOverview,
    "work_episode_residue_candidate",
  ).recommended_next_action === "review_work_episode_residue_candidates",
);
assertNoMemoryPromotionActions(codexResultRecordOverview);

const expectedObservedDeltaPreview = buildExpectedObservedDeltaPreviewV01({
  work_episode_residue_candidate_preview: codexResultResidueFromRecord,
  codex_result_report_intake_record_review: codexResultRecordReview,
  expected_material: {
    expected_files: ["lib/dogfooding/expected-observed-delta-preview.ts"],
    expected_checks: ["npm run typecheck"],
    expected_requirement_progress: ["ExpectedObservedDelta bridge visible"],
    expected_non_goals: ["no reuse ledger write"],
    expected_risks: ["skipped checks remain gaps"],
    expected_followups: ["review reuse outcome bridge"],
    work_ref: "work:codex-result-overview-clean",
    result_ref: "result:codex-result-overview-clean",
    source_refs: ["source:expected-observed-overview-clean"],
    evidence_refs: ["evidence:expected-observed-overview-clean"],
  },
  source_refs: ["source:expected-observed-overview-clean"],
});
assert(
  ["delta_candidates_available", "ready_for_operator_review"].includes(
    expectedObservedDeltaPreview.delta_preview_status,
  ),
  "ExpectedObservedDelta preview should expose candidate material",
);
assert(
  !["no_result_material", "insufficient_data"].includes(
    expectedObservedDeltaPreview.delta_preview_status,
  ),
  "ExpectedObservedDelta preview with result and expected material must not fake an empty state",
);
const expectedObservedDeltaDecision =
  buildExpectedObservedDeltaOperatorDecisionPreviewV01({
    expected_observed_delta_preview: expectedObservedDeltaPreview,
  });
const emptyExpectedObservedDeltaRecordReview =
  buildExpectedObservedDeltaRecordReviewV01({
    records: [],
    as_of: "2026-07-04T14:30:00.000Z",
  });
const expectedObservedDeltaOverview =
  buildWorkbenchDogfoodLoopSpineOverviewV01({
    selected_session_digest_intake_preview: cleanSelectedIntake,
    selected_session_digest_ingest_contract_preview: selectedReadyIngestContract,
    selected_session_digest_ingest_operator_decision_preview:
      selectedReadyIngestDecision,
    selected_session_digest_ingest_record_review: selectedRecordReview,
    codex_result_report_intake_preview: cleanCodexResultIntake,
    codex_result_report_intake_decision_preview: readyCodexResultDecision,
    codex_result_report_intake_record_review: codexResultRecordReview,
    work_episode_residue_candidate_preview: codexResultResidueFromRecord,
    expected_observed_delta_preview: expectedObservedDeltaPreview,
    expected_observed_delta_decision_preview: expectedObservedDeltaDecision,
    expected_observed_delta_record_review: emptyExpectedObservedDeltaRecordReview,
  });
assert.equal(
  expectedObservedDeltaOverview.recommended_next_operator_action,
  "review_expected_observed_delta_candidates",
);
assert.equal(
  stepById(expectedObservedDeltaOverview, "expected_observed_delta").material_count > 0,
  true,
);
assert.equal(
  stepById(expectedObservedDeltaOverview, "expected_observed_delta_record").status,
  "no_current_material",
);
assertNoMemoryPromotionActions(expectedObservedDeltaOverview);

const firstDeltaCandidateRef =
  expectedObservedDeltaDecision.would_write_delta_record_preview
    .selectable_delta_candidate_refs[0];
const readyExpectedObservedDeltaDecision =
  buildExpectedObservedDeltaOperatorDecisionPreviewV01({
    expected_observed_delta_preview: expectedObservedDeltaPreview,
    selected_delta_candidate_refs: [firstDeltaCandidateRef],
    requested_operator_ref: "operator:expected-observed-overview",
    requested_idempotency_key: "idempotency:expected-observed-overview",
    review_confirmation_ref: "review:expected-observed-overview",
  });
const expectedObservedDeltaWriteOverview =
  buildWorkbenchDogfoodLoopSpineOverviewV01({
    selected_session_digest_intake_preview: cleanSelectedIntake,
    selected_session_digest_ingest_contract_preview: selectedReadyIngestContract,
    selected_session_digest_ingest_operator_decision_preview:
      selectedReadyIngestDecision,
    selected_session_digest_ingest_record_review: selectedRecordReview,
    codex_result_report_intake_preview: cleanCodexResultIntake,
    codex_result_report_intake_decision_preview: readyCodexResultDecision,
    codex_result_report_intake_record_review: codexResultRecordReview,
    work_episode_residue_candidate_preview: codexResultResidueFromRecord,
    expected_observed_delta_preview: expectedObservedDeltaPreview,
    expected_observed_delta_decision_preview: readyExpectedObservedDeltaDecision,
    expected_observed_delta_record_review: emptyExpectedObservedDeltaRecordReview,
  });
assert.equal(
  expectedObservedDeltaWriteOverview.recommended_next_operator_action,
  "write_expected_observed_delta_record",
);
assertNoMemoryPromotionActions(expectedObservedDeltaWriteOverview);

const reuseOutcomeBridgePreview = buildReuseOutcomeCandidateBridgePreviewV01({
  expected_observed_delta_preview: expectedObservedDeltaPreview,
  expected_observed_delta_record_review: emptyExpectedObservedDeltaRecordReview,
  work_episode_residue_candidate_preview: codexResultResidueFromRecord,
  codex_result_report_intake_record_review: codexResultRecordReview,
});
const reuseOutcomeBridgeOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  selected_session_digest_intake_preview: cleanSelectedIntake,
  selected_session_digest_ingest_contract_preview: selectedReadyIngestContract,
  selected_session_digest_ingest_operator_decision_preview:
    selectedReadyIngestDecision,
  selected_session_digest_ingest_record_review: selectedRecordReview,
  codex_result_report_intake_preview: cleanCodexResultIntake,
  codex_result_report_intake_decision_preview: readyCodexResultDecision,
  codex_result_report_intake_record_review: codexResultRecordReview,
  work_episode_residue_candidate_preview: codexResultResidueFromRecord,
  expected_observed_delta_preview: expectedObservedDeltaPreview,
  expected_observed_delta_decision_preview: expectedObservedDeltaDecision,
  expected_observed_delta_record_review: emptyExpectedObservedDeltaRecordReview,
  reuse_outcome_candidate_bridge_preview: reuseOutcomeBridgePreview,
});
assert.equal(
  reuseOutcomeBridgeOverview.recommended_next_operator_action,
  "review_reuse_outcome_candidate_bridge",
);
assertNoMemoryPromotionActions(reuseOutcomeBridgeOverview);

const selectedExpectedObservedDeltaRecordReview = {
  ...emptyExpectedObservedDeltaRecordReview,
  review_status: "selected_record_found",
  input_summary: {
    ...emptyExpectedObservedDeltaRecordReview.input_summary,
    valid_record_count: 1,
    selected_record_id: "expected-observed-delta:overview",
    selected_record_found: true,
    latest_record_id: "expected-observed-delta:overview",
  },
  records: [{ record_id: "expected-observed-delta:overview" }],
  selected_record_summary: {
    record_id: "expected-observed-delta:overview",
    work_ref: "work:overview",
    result_ref: "result:overview",
    handoff_ref: "handoff:overview",
    operator_ref: "operator:overview",
  },
  latest_record_summary: {
    record_id: "expected-observed-delta:overview",
    work_ref: "work:overview",
    result_ref: "result:overview",
    handoff_ref: "handoff:overview",
    operator_ref: "operator:overview",
  },
  evidence_summary: {
    ...emptyExpectedObservedDeltaRecordReview.evidence_summary,
    has_records: true,
    has_selected_record: true,
    has_evidence_refs: true,
    evidence_refs: ["evidence:expected-observed-overview"],
    missing_evidence: [],
  },
};
const selectedExpectedObservedDeltaOverview =
  buildWorkbenchDogfoodLoopSpineOverviewV01({
    expected_observed_delta_record_review: selectedExpectedObservedDeltaRecordReview,
  });
assert.notEqual(
  stepById(selectedExpectedObservedDeltaOverview, "expected_observed_delta_record")
    .status,
  "insufficient_data",
);

const reuseOutcomeBridgeDecisionSeed =
  buildReuseOutcomeBridgeOperatorDecisionPreviewV01({
    reuse_outcome_candidate_bridge_preview: reuseOutcomeBridgePreview,
    expected_observed_delta_record_review: selectedExpectedObservedDeltaRecordReview,
  });
const firstReuseCandidateRef =
  reuseOutcomeBridgeDecisionSeed.would_write_reuse_ledger_record_preview
    .selectable_reuse_candidate_refs[0];
const readyReuseOutcomeBridgeDecision =
  buildReuseOutcomeBridgeOperatorDecisionPreviewV01({
    reuse_outcome_candidate_bridge_preview: reuseOutcomeBridgePreview,
    expected_observed_delta_record_review: selectedExpectedObservedDeltaRecordReview,
    selected_reuse_candidate_refs: [firstReuseCandidateRef],
    requested_operator_ref: "operator:reuse-overview",
    requested_idempotency_key: "idempotency:reuse-overview",
    review_confirmation_ref: "review:reuse-overview",
    source_refs: ["source:reuse-overview"],
  });
assert.equal(
  readyReuseOutcomeBridgeDecision.decision_preview_status,
  "ready_for_future_reuse_ledger_write",
);
const reuseOutcomeBridgeDecisionOverview =
  buildWorkbenchDogfoodLoopSpineOverviewV01({
    reuse_outcome_candidate_bridge_preview: reuseOutcomeBridgePreview,
    reuse_outcome_bridge_operator_decision_preview:
      reuseOutcomeBridgeDecisionSeed,
  });
assert.equal(
  stepById(
    reuseOutcomeBridgeDecisionOverview,
    "reuse_outcome_bridge_operator_decision",
  ).recommended_next_action,
  "review_reuse_outcome_bridge_decision",
);
const reuseOutcomeBridgeWriteOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  reuse_outcome_candidate_bridge_preview: reuseOutcomeBridgePreview,
  reuse_outcome_bridge_operator_decision_preview:
    readyReuseOutcomeBridgeDecision,
  reuse_outcome_bridge_ledger_record_review: {
    review_version: "reuse_outcome_bridge_ledger_record_review.v0.1",
    review_status: "no_records",
    input_summary: {
      supplied_record_count: 0,
      valid_record_count: 0,
      invalid_record_count: 0,
      bridge_written_record_count: 0,
      receipt_side_effect_problem_count: 0,
    },
    evidence_summary: { has_records: false },
    blocked_reasons: [],
    insufficient_data_reasons: [],
  },
});
assert.equal(
  stepById(
    reuseOutcomeBridgeWriteOverview,
    "handoff_reuse_outcome_ledger_record",
  ).recommended_next_action,
  "write_handoff_reuse_outcome_ledger_record",
);
const reuseOutcomeBridgeLedgerRecordOverview =
  buildWorkbenchDogfoodLoopSpineOverviewV01({
    reuse_outcome_candidate_bridge_preview: reuseOutcomeBridgePreview,
    reuse_outcome_bridge_operator_decision_preview:
      readyReuseOutcomeBridgeDecision,
    reuse_outcome_bridge_ledger_record_review: {
      review_version: "reuse_outcome_bridge_ledger_record_review.v0.1",
      review_status: "records_available",
      input_summary: {
        supplied_record_count: 1,
        valid_record_count: 1,
        invalid_record_count: 0,
        bridge_written_record_count: 1,
        receipt_side_effect_problem_count: 0,
      },
      evidence_summary: { has_records: true },
      blocked_reasons: [],
      insufficient_data_reasons: [],
    },
  });
assert.equal(
  stepById(reuseOutcomeBridgeLedgerRecordOverview, "handoff_reuse_outcome_ledger_record")
    .status,
  "candidate_material_available",
);
assert.equal(
  stepById(
    reuseOutcomeBridgeLedgerRecordOverview,
    "handoff_reuse_outcome_ledger_record",
  ).recommended_next_action,
  "review_handoff_reuse_outcome_ledger_record",
);
assertNoMemoryPromotionActions(reuseOutcomeBridgeLedgerRecordOverview);

const metricSnapshotOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  dogfood_metric_snapshot_preview: metricSnapshotPreview(),
});
assert.equal(
  stepById(metricSnapshotOverview, "dogfood_metric_snapshot").status,
  "ready_for_operator_review",
);
assert.equal(
  stepById(metricSnapshotOverview, "dogfood_metric_snapshot")
    .recommended_next_action,
  "review_dogfood_metric_snapshot_candidates",
);

const metricSnapshotWriteOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  dogfood_metric_snapshot_decision_preview: metricSnapshotDecisionPreview({
    writeReady: true,
  }),
  dogfood_metric_snapshot_record_review: metricSnapshotRecordReview({
    status: "no_records",
    validCount: 0,
  }),
});
assert.equal(
  stepById(metricSnapshotWriteOverview, "dogfood_metric_snapshot_record")
    .recommended_next_action,
  "write_dogfood_metric_snapshot_record",
);

const metricSnapshotRecordOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  dogfood_metric_snapshot_record_review: metricSnapshotRecordReview({
    status: "records_available",
    validCount: 1,
  }),
});
assert.equal(
  stepById(metricSnapshotRecordOverview, "dogfood_metric_snapshot_record")
    .status,
  "candidate_material_available",
);
assert.equal(
  stepById(metricSnapshotRecordOverview, "dogfood_metric_snapshot_record")
    .recommended_next_action,
  "review_next_work_signal_refresh",
);

const nextWorkSignalOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  next_work_signal_refresh_preview: nextWorkSignalRefreshPreview(),
});
assert.equal(
  stepById(nextWorkSignalOverview, "next_work_signal_refresh").status,
  "ready_for_operator_review",
);
assert.equal(
  stepById(nextWorkSignalOverview, "next_work_signal_refresh")
    .recommended_next_action,
  "review_next_work_signal_refresh",
);
assertNoMemoryPromotionActions(nextWorkSignalOverview);

const nextWorkSignalDecisionWriteOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  next_work_signal_decision_preview: nextWorkSignalDecisionPreview({
    writeReady: true,
  }),
  next_work_signal_decision_record_review: nextWorkSignalDecisionRecordReview({
    status: "no_records",
    validCount: 0,
  }),
});
assert.equal(
  stepById(
    nextWorkSignalDecisionWriteOverview,
    "next_work_signal_operator_decision",
  ).status,
  "ready_for_future_contract_review",
);
assert.equal(
  stepById(
    nextWorkSignalDecisionWriteOverview,
    "next_work_signal_decision_record",
  ).recommended_next_action,
  "write_next_work_signal_decision_record",
);
assertNoMemoryPromotionActions(nextWorkSignalDecisionWriteOverview);

const nextWorkSignalDecisionRecordOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  next_work_signal_decision_record_review: nextWorkSignalDecisionRecordReview({
    status: "records_available",
    validCount: 1,
  }),
});
assert.equal(
  stepById(
    nextWorkSignalDecisionRecordOverview,
    "next_work_signal_decision_record",
  ).status,
  "candidate_material_available",
);
assert.equal(
  stepById(
    nextWorkSignalDecisionRecordOverview,
    "next_work_signal_decision_record",
  ).recommended_next_action,
  "review_next_work_signal_decision_record",
);
assertNoMemoryPromotionActions(nextWorkSignalDecisionRecordOverview);

const perspectiveRelayBridgeOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  perspective_relay_update_candidate_bridge_preview:
    perspectiveRelayUpdateCandidateBridgePreview(),
});
assert.equal(
  stepById(
    perspectiveRelayBridgeOverview,
    "perspective_relay_update_candidate_bridge",
  ).status,
  "ready_for_operator_review",
);
assert.equal(
  stepById(
    perspectiveRelayBridgeOverview,
    "perspective_relay_update_candidate_bridge",
  ).recommended_next_action,
  "review_perspective_relay_update_candidates",
);
assertNoMemoryPromotionActions(perspectiveRelayBridgeOverview);

const missingCodexOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  selected_session_digest_intake_preview: cleanSelectedIntake,
  codex_result_feedback_draft: codexFeedbackDraft({ resultReport: "missing" }),
  dogfood_reuse_record_proposal: reuseProposal({
    status: "blocked_insufficient_data",
    blockedReasons: ["blocked_missing_codex_result_report"],
    insufficientReasons: ["missing_codex_result_report"],
    hasResultReport: false,
  }),
  dogfood_metric_candidate_preview: metricPreviewWithoutRecords(),
  scope: "project:augnes",
  as_of: "2026-07-04T14:30:00.000Z",
});
assert.equal(
  missingCodexOverview.recommended_next_operator_action,
  "supply_codex_result_report",
);
assert(
  missingCodexOverview.current_material_gaps.some((gap) =>
    gap.includes("missing_codex_result_report"),
  ),
  "missing Codex result report should remain a material gap",
);
assert.equal(
  stepById(missingCodexOverview, "dogfood_metric_candidate").status,
  "insufficient_data",
);
assert(
  missingCodexOverview.current_material_gaps.some((gap) =>
    gap.includes("approved_reuse_records_missing_for_metric_preview"),
  ),
  "metric preview without approved reuse records must be a gap",
);

const blockerOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  selected_session_digest_intake_preview: cleanSelectedIntake,
  codex_result_feedback_draft: codexFeedbackDraft({ resultReport: "supplied" }),
  dogfood_reuse_record_proposal: reuseProposal({
    status: "blocked_insufficient_data",
    blockedReasons: ["unsafe_source_ref"],
    insufficientReasons: ["missing_codex_result_report"],
    hasResultReport: true,
  }),
  scope: "project:augnes",
  as_of: "2026-07-04T14:30:00.000Z",
});
assert.equal(blockerOverview.overview_status, "blocked");
assert.equal(
  blockerOverview.recommended_next_operator_action,
  "resolve_blockers_or_missing_evidence",
);
assert(
  blockerOverview.top_blockers.some((blocker) =>
    blocker.includes("unsafe_source_ref"),
  ),
);
assert(
  blockerOverview.current_material_gaps.some((gap) =>
    gap.includes("missing_codex_result_report"),
  ),
);

const missingEvidenceOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  selected_session_digest_intake_preview: cleanSelectedIntake,
  handoff_context_apply_preview: applyPreviewWithMissingEvidence(),
  scope: "project:augnes",
  as_of: "2026-07-04T14:30:00.000Z",
});
assert(
  missingEvidenceOverview.top_missing_evidence.some((item) =>
    item.includes("evidence:missing-apply"),
  ),
);

const missingFingerprintOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  selected_session_digest_intake_preview: cleanSelectedIntake,
  codex_result_report_intake_preview: {
    ...cleanCodexResultIntake,
    intake_preview_status: "keep_preview_only",
    recommended_next_action: "keep_preview_only",
    input_summary: {
      ...cleanCodexResultIntake.input_summary,
      candidate_count: 0,
      ingestable_candidate_count: 0,
    },
    readiness: {
      ...cleanCodexResultIntake.readiness,
      ready_for_operator_review: false,
      ready_for_candidate_ingest_record: false,
      requires_result_report_or_raw_text: false,
      requires_candidate_material: false,
      current_insufficient_data: [],
      current_missing_evidence: [],
      current_blockers: [],
    },
    candidate_material: {
      ...cleanCodexResultIntake.candidate_material,
      result_summary_candidates: [],
      changed_file_candidates: [],
      check_result_candidates: [],
      skipped_check_candidates: [],
      not_done_candidates: [],
      requirement_progress_candidates: [],
      expected_observed_signal_candidates: [],
      context_reuse_signal_candidates: [],
      risk_or_regression_candidates: [],
      followup_candidates: [],
      reusable_context_candidates: [],
    },
  },
  codex_result_feedback_draft: codexFeedbackDraft({ resultReport: "supplied" }),
  handoff_context_apply_write_contract_preview:
    applyWriteContractMissingCurrentMaterial(),
  scope: "project:augnes",
  as_of: "2026-07-04T14:30:00.000Z",
});
assert.equal(
  missingFingerprintOverview.recommended_next_operator_action,
  "supply_current_handoff_packet_fingerprint",
);
assert(
  missingFingerprintOverview.current_material_gaps.some((gap) =>
    gap.includes("current_handoff_packet_fingerprint_missing"),
  ),
);
assert.equal(
  stepById(
    missingFingerprintOverview,
    "handoff_context_apply_write_contract",
  ).recommended_next_action,
  "supply_current_handoff_packet_fingerprint",
);
assert.equal(
  missingFingerprintOverview.authority_boundary.can_apply_handoff_context,
  false,
);

assertAuthorityFalse(createWorkbenchDogfoodLoopSpineOverviewAuthorityBoundaryV01());

const changedFileBoundary = assertChangedFilesWithin({
  allowedChangedFiles,
  label: "workbench-dogfood-loop-spine-overview-v0-1",
});

console.log(
  JSON.stringify(
    {
      smoke: "workbench-dogfood-loop-spine-overview-v0-1",
      pass: true,
      package_script_checked: true,
      default_empty_checked: true,
      selected_intake_ready_checked: true,
      missing_codex_result_report_checked: true,
      blocker_and_missing_evidence_carry_forward_checked: true,
      apply_contract_missing_current_material_checked: true,
      authority_boundary_checked: true,
      workbench_static_boundary_checked: true,
      changed_files_checked: changedFileBoundary.checked,
      changed_files_skipped: changedFileBoundary.skipped,
      changed_files_skip_reason: changedFileBoundary.skip_reason,
      changed_files_observed: changedFileBoundary.files,
      no_unscoped_api_route_added: true,
      no_db_helper_added: true,
      no_provider_github_codex_runtime_path_added: true,
      no_mcp_plugin_tool_path_added: true,
      no_workbench_action_button_added: true,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:workbench-dogfood-loop-spine-overview-v0-1");

function assertAuthorityFalse(authority) {
  for (const [field, value] of Object.entries(authority)) {
    if (["read_only", "advisory_only", "derived_read_model"].includes(field)) {
      assert.equal(value, true, `${field} should be true`);
      continue;
    }
    if (field === "notes") continue;
    assert.equal(value, false, `${field} should be false`);
  }
}

function assertNoForbiddenRuntimeCall(label, text) {
  for (const forbidden of [
    "fetch(",
    "method: \"POST\"",
    "method: 'POST'",
    "better-sqlite3",
    "new Database",
    "@/lib/db",
    "INSERT INTO",
    "UPDATE ",
    "DELETE FROM",
    "CREATE TABLE",
    "ALTER TABLE",
    "DROP TABLE",
    "@openai",
    "OpenAI",
    "Octokit",
    "@octokit",
    "createPullRequest",
    "mergePullRequest",
    "executeCodex",
    "setInterval(",
    "setTimeout(",
  ]) {
    assert(!text.includes(forbidden), `${label} must not include ${forbidden}`);
  }
}

function assertNoWorkbenchActionButtons(label, text) {
  assert(!text.includes("<button"), `${label} must not render buttons`);
  assert(
    !/<button[^>]*>[^<]*(Import|Write|Apply|Approve|Send|Launch|Run|Merge|Retry|Execute)/i.test(
      text,
    ),
    `${label} must not render action buttons`,
  );
  assert(!text.includes("ActionButton"), `${label} must not use action buttons`);
  assert(!text.includes("action-button"), `${label} must not use action buttons`);
}

function assertNoForbiddenChangedPaths() {
  const untrackedFiles = collectUntrackedFiles();
  for (const file of untrackedFiles) {
    assert(
      allowedChangedFiles.includes(file),
      `Unexpected untracked file for workbench dogfood loop spine overview: ${file}`,
    );
  }
  for (const file of allowedChangedFiles) {
    assert(
      !/^app\/api\//.test(file) ||
        file === selectedSessionDigestIngestDecisionWriteRouteFile ||
        file === selectedSessionDigestIngestWriteRouteFile ||
        file === projectHistoryIntakeWriteRouteFile ||
        file === codexResultReportIntakeWriteRouteFile ||
        file === expectedObservedDeltaWriteRouteFile ||
        file === reuseOutcomeBridgeLedgerRouteFile ||
        file === dogfoodMetricSnapshotRouteFile ||
        file === nextWorkSignalDecisionRouteFile ||
        file === perspectiveRelayUpdateDecisionRouteFile ||
        file === perspectiveNextWorkBiasRouteFile ||
        file === perspectiveUnitRouteFile ||
        file === continuityRelayRouteFile ||
        file === currentWorkingPerspectiveUpdateContractRouteFile ||
        file === currentWorkingPerspectiveApplyRouteFile ||
        file === currentWorkingPerspectiveRouteIntegrationContractRouteFile ||
        file === handoffContextUpdateContractRouteFile ||
        file === "app/api/perspective/current/route.ts",
      `No app/api route may be added outside scoped intake/dogfood follow-on routes: ${file}`,
    );
    assert(!/^db\//.test(file), `No DB helper/schema file may be added: ${file}`);
    assert(
      !/(^|\/)(provider|providers|openai|github)(\/|$)/i.test(file),
      `No provider/OpenAI/GitHub runtime path may be changed: ${file}`,
    );
    assert(
      !/(^|\/)(mcp|plugin|plugins|tool|tools)(\/|$)/i.test(file),
      `No App/MCP tool path may be changed: ${file}`,
    );
  }
}

function assertAgentWorkbenchOverviewDoesNotRebuildInputs(text) {
  const start = text.indexOf("const workbenchDogfoodLoopSpineOverview");
  const end = text.indexOf("return (");
  assert(start !== -1, "Agent Workplane must build dogfood loop spine overview");
  assert(end > start, "Dogfood loop spine overview block must be bounded");
  const snippet = text.slice(start, end);
  assert(!snippet.includes("sample"), "Overview must not pass sample material");
  assert(!snippet.includes("fixture"), "Overview must not pass fixture material");
  assert(!snippet.includes("raw_text:"), "Overview must not pass raw digest text");
  assert(!snippet.includes("digest:"), "Overview must not pass digest material");
  assert(
    !snippet.includes("result_report:"),
    "Overview must not pass raw result report material",
  );
  assert(
    !snippet.includes("buildSelectedSessionDigestIntakePreviewV01("),
    "Overview block must not rebuild selected session intake",
  );
  assert(
    !snippet.includes("buildCodexResultFeedbackDraft("),
    "Overview block must not rebuild Codex feedback draft",
  );
}

function stepById(overview, stepId) {
  const step = overview.spine_steps.find((candidate) => candidate.step_id === stepId);
  assert(step, `Expected step ${stepId}`);
  return step;
}

function assertNoMemoryPromotionActions(overview) {
  const serialized = JSON.stringify(overview);
  for (const forbidden of [
    "promote_memory",
    "write_memory",
    "write_perspective_unit",
    "write_next_work_bias",
    "mutate_current_working_perspective",
    "apply_handoff_context",
    "send_handoff",
  ]) {
    assert(!serialized.includes(`"recommended_next_action":"${forbidden}"`));
    assert(
      !serialized.includes(
        `"recommended_next_operator_action":"${forbidden}"`,
      ),
    );
  }
}

function fakeSelectedDigestIngestRecord() {
  return {
    record_version: "selected_session_digest_ingest_record.v0.1",
    record_id: "selected_session_digest_ingest:spine-overview-clean",
    idempotency_key: "idempotency:spine-overview-clean",
    created_at: "2026-07-04T14:30:00.000Z",
    scope: "project:augnes",
    source_refs: ["source:spine-overview-clean"],
    evidence_refs: ["evidence:spine-overview-clean"],
    decision_record_refs: {
      decision_record_version:
        "operator_approved_selected_session_digest_ingest_decision_record.v0.1",
      decision_record_id:
        "operator_approved_selected_session_digest_ingest_decision:spine-overview-clean",
      decision_record_fingerprint: "sha256:spineoverviewclean",
      decision_idempotency_key: "idempotency:spine-overview-clean",
      decision_created_at: "2026-07-04T14:30:00.000Z",
      operator_decision: "approve_for_future_ingest_write",
    },
    ingest_contract_preview_refs: [
      "selected_session_digest_ingest_contract_preview:project:augnes:idempotency:spine-overview-clean",
    ],
    intake_preview_refs: [
      "selected_session_digest_intake_preview:project:augnes:source:spine-overview-clean",
    ],
    source_kind: "chatgpt_session_digest",
    source_ref: "source:spine-overview-clean",
    operator_ref: "operator:reviewer",
    session_ref: "session:spine-overview-clean",
    project_ref: null,
    selected_digest_candidate_refs: ["candidate:spine-overview-clean"],
    candidate_counts_by_kind: {
      session_summary: 1,
      user_goal: 0,
      decision: 0,
      open_question: 0,
      next_action: 0,
      evidence_ref: 0,
      source_ref: 0,
      risk_or_blocker: 0,
      reusable_context: 0,
    },
    sanitized_candidate_summaries: [
      {
        candidate_ref: "candidate:spine-overview-clean",
        candidate_kind: "session_summary",
        label: "Spine overview clean candidate",
        summary: "Bounded candidate ingest record for overview smoke.",
        source_refs: ["source:spine-overview-clean"],
        evidence_refs: ["evidence:spine-overview-clean"],
      },
    ],
    privacy_review_confirmation_ref: "privacy:spine-overview-clean",
    requested_ingest_scope_ref: "scope:spine-overview-clean",
    authority_profile: {
      durable_local_candidate_ingest_record: true,
      source_of_truth: false,
      candidate_record_only: true,
      persistence_horizon: "local_project_candidate_record",
      memory_promotion_performed: false,
      perspective_promotion_performed: false,
    },
    review_status: "ingested_as_candidate_record",
    persistence_horizon: "local_project_candidate_record",
    raw_material_policy: {
      digest_material_stored: false,
      pasted_text_material_stored: false,
      excerpt_material_stored: false,
      sanitized_candidate_summaries_only: true,
      private_or_secret_markers_allowed: false,
    },
    carry_forward_review_only_material: {
      review_only_candidate_refs: [],
      review_only_candidate_count: 0,
      review_only_candidate_summaries: [],
      unresolved_contract_blockers: [],
      contract_missing_evidence: [],
    },
    no_promotion_performed: {
      memory_promoted: false,
      current_working_perspective_updated: false,
      perspective_unit_written: false,
      next_work_bias_written: false,
      continuity_relay_written: false,
      handoff_context_mutated: false,
      selected_refs_written_to_live_handoff: false,
      handoff_sent: false,
    },
    write_validation: {
      validation_version: "selected_session_digest_ingest_write_validation.v0.1",
      decision_record_revalidated: true,
      selected_candidate_refs_revalidated: true,
      refused_sample_fixture_default_or_smoke_material: false,
      refused_unrequested_side_effects: false,
      refused_memory_perspective_handoff_promotion: false,
      validation_hash: "sha256:spineoverviewcleanvalidation",
    },
    authority_boundary: {
      durable_local_candidate_ingest_record: true,
      source_of_truth: false,
      candidate_record_only: true,
      can_write_db: true,
      can_create_ingest_record: true,
      can_create_ingest_receipt: true,
      can_write_selected_session_digest_candidate_record: true,
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
      notes: [],
    },
    notes: [],
    record_fingerprint: "sha256:spineoverviewcleanrecord",
  };
}

function fakeProjectHistoryIntakeRecord() {
  return {
    record_version: "project_history_intake_record.v0.1",
    record_id: "project_history_intake_record:spine-overview-clean",
    idempotency_key: "idempotency:project-history-overview-clean",
    created_at: "2026-07-04T14:30:00.000Z",
    scope: "project:augnes",
    source_refs: ["source:project-history-overview-clean"],
    evidence_refs: ["evidence:project-history-overview-clean"],
    decision_preview_refs: {
      decision_preview_version:
        "project_history_intake_operator_decision_preview.v0.1",
      decision_preview_status: "ready_for_future_candidate_record_write",
      recommended_operator_decision:
        "approve_for_project_history_candidate_ingest",
    },
    intake_preview_refs: ["project_history_intake_preview.v0.1"],
    source_kind: "project_history_digest",
    source_ref: "source:project-history-overview-clean",
    operator_ref: "operator:project-history-overview",
    project_ref: "project:augnes",
    work_ref: null,
    selected_candidate_refs: ["candidate:timeline_event:overviewclean"],
    candidate_counts_by_kind: { timeline_event: 1 },
    sanitized_candidate_summaries: [
      {
        candidate_ref: "candidate:timeline_event:overviewclean",
        candidate_kind: "timeline_event",
        label: "Selected digest candidate ledger reached durable record",
        summary: "Selected digest candidate ledger reached durable record",
      },
    ],
    privacy_review_confirmation_ref: "privacy:project-history-overview-clean",
    authority_profile: {
      durable_local_project_history_candidate_record: true,
      source_of_truth: false,
      candidate_record_only: true,
      persistence_horizon: "local_project_candidate_record",
      memory_promotion_performed: false,
      perspective_promotion_performed: false,
    },
    review_status: "ingested_as_project_history_candidate_record",
    persistence_horizon: "local_project_candidate_record",
    raw_material_policy: {
      raw_history_material_stored: false,
      raw_text_material_stored: false,
      raw_excerpt_material_stored: false,
      sanitized_candidate_summaries_only: true,
      private_or_secret_markers_allowed: false,
    },
    carry_forward_review_only_material: { review_only_candidates: [] },
    no_promotion_performed: {
      memory_promoted: false,
      current_working_perspective_updated: false,
      perspective_unit_written: false,
      next_work_bias_written: false,
      continuity_relay_written: false,
      handoff_context_mutated: false,
      selected_refs_written_to_live_handoff: false,
      handoff_sent: false,
    },
    write_validation: {
      validation_version: "project_history_intake_write_validation.v0.1",
      decision_preview_revalidated: true,
      selected_candidate_refs_revalidated: true,
      refused_sample_fixture_default_or_smoke_material: false,
      refused_unrequested_side_effects: false,
      refused_memory_perspective_handoff_promotion: false,
      validation_hash: "validation:projecthistoryoverviewclean",
    },
    authority_boundary: {
      durable_local_project_history_candidate_record: true,
      source_of_truth: false,
      candidate_record_only: true,
      can_write_db: true,
      can_create_ingest_record: true,
      can_create_ingest_receipt: true,
      can_write_project_history_candidate_record: true,
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
      notes: [],
    },
    notes: [],
    record_fingerprint: "fingerprint:projecthistoryoverviewclean",
  };
}

function fakeCodexResultReportIntakeRecord() {
  return {
    record_version: "codex_result_report_intake_record.v0.1",
    record_id: "codex_result_report_intake_record:spine-overview-clean",
    idempotency_key: "idempotency:codex-result-overview-clean",
    created_at: "2026-07-04T14:30:00.000Z",
    scope: "project:augnes",
    source_refs: ["source:codex-result-overview-clean"],
    evidence_refs: ["evidence:codex-result-overview-clean"],
    decision_preview_refs: {
      decision_preview_version:
        "codex_result_report_intake_operator_decision_preview.v0.1",
      decision_preview_status: "ready_for_future_candidate_record_write",
      recommended_operator_decision:
        "approve_for_codex_result_report_candidate_ingest",
    },
    intake_preview_refs: ["codex_result_report_intake_preview.v0.1"],
    source_kind: "codex_result_report",
    source_ref: "source:codex-result-overview-clean",
    operator_ref: "operator:codex-result-overview",
    project_ref: "project:augnes",
    work_ref: "work:codex-result-overview-clean",
    result_ref: "result:codex-result-overview-clean",
    pr_ref: null,
    commit_ref: null,
    selected_candidate_refs: ["candidate:codex-result-overview-clean"],
    candidate_counts_by_kind: {
      project_state_summary: 1,
      changed_artifact_ref: 1,
      expected_observed_signal: 1,
    },
    sanitized_candidate_summaries: [
      {
        candidate_ref: "candidate:codex-result-overview-clean",
        candidate_kind: "project_state_summary",
        label: "Codex result report candidate",
        summary: "Codex result report candidate intake is ready for bounded review.",
      },
    ],
    result_status_summary: ["completed"],
    changed_files_summary: [
      "lib/intake/codex-result-report-intake-preview.ts",
    ],
    checks_summary: ["npm run typecheck passed"],
    skipped_checks_summary: [],
    not_done_summary: [],
    requirement_progress_summary: [
      "Codex result candidate ledger visible in Workbench",
    ],
    expected_observed_signal_summary: [
      "Expected candidate-only return path; observed no promotion authority",
    ],
    context_reuse_signal_summary: [
      "Useful return-binding residue candidate",
    ],
    risk_or_regression_summary: [],
    followup_summary: [],
    privacy_review_confirmation_ref: "privacy:codex-result-overview-clean",
    authority_profile: {
      durable_local_codex_result_report_candidate_record: true,
      source_of_truth: false,
      candidate_record_only: true,
      persistence_horizon: "local_project_candidate_record",
      dogfood_outcome_approval_performed: false,
      memory_promotion_performed: false,
      perspective_promotion_performed: false,
    },
    review_status: "ingested_as_candidate_record",
    persistence_horizon: "local_project_candidate_record",
    raw_material_policy: {
      raw_report_material_stored: false,
      raw_text_material_stored: false,
      raw_excerpt_material_stored: false,
      sanitized_candidate_summaries_only: true,
      private_or_secret_markers_allowed: false,
    },
    carry_forward_review_only_material: { review_only_candidates: [] },
    no_promotion_performed: {
      work_episode_written: false,
      expected_observed_delta_written: false,
      reuse_outcome_ledger_written: false,
      dogfood_metrics_written: false,
      memory_promoted: false,
      current_working_perspective_updated: false,
      perspective_unit_written: false,
      next_work_bias_written: false,
      continuity_relay_written: false,
      handoff_context_mutated: false,
      selected_refs_written_to_live_handoff: false,
      handoff_sent: false,
    },
    write_validation: {
      validation_version: "codex_result_report_intake_write_validation.v0.1",
      decision_preview_revalidated: true,
      selected_candidate_refs_revalidated: true,
      refused_sample_fixture_default_or_smoke_material: false,
      refused_unrequested_side_effects: false,
      refused_memory_perspective_handoff_promotion: false,
      refused_dogfood_metric_reuse_or_work_episode_write: false,
      validation_hash: "validation:codexresultoverviewclean",
    },
    authority_boundary: {
      durable_local_codex_result_report_candidate_record: true,
      source_of_truth: false,
      candidate_record_only: true,
      can_write_db: true,
      can_create_ingest_record: true,
      can_create_ingest_receipt: true,
      can_write_codex_result_report_candidate_record: true,
      can_write_work_episode: false,
      can_write_expected_observed_delta: false,
      can_write_reuse_outcome_ledger: false,
      can_write_dogfood_metrics: false,
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
      notes: [],
    },
    notes: [],
    record_fingerprint: "fingerprint:codexresultoverviewclean",
  };
}

function codexFeedbackDraft({ resultReport }) {
  return {
    draft_version: "codex_result_feedback_draft.v0.1",
    candidate_status:
      resultReport === "supplied"
        ? "candidate_ready_for_review"
        : "insufficient_data",
    source_status: {
      handoff_context_rationale: "supplied",
      codex_result_report: resultReport,
      codex_result_report_status: resultReport,
    },
    insufficient_data_reasons:
      resultReport === "supplied" ? [] : ["missing_codex_result_report"],
    stale_or_gap_warnings: [],
    expected_observed_delta: {
      matched_expectations:
        resultReport === "supplied" ? [{ field: "check", summary: "ok" }] : [],
      missing_expectations: [],
      unexpected_observations: [],
      skipped_or_unverified_checks: [],
      changed_files_observed: resultReport === "supplied" ? ["file:a"] : [],
      checks_observed: resultReport === "supplied" ? ["check:a"] : [],
      requirement_progress_observed: [],
      not_done_items: [],
      mismatch_summary: "",
      confidence: resultReport === "supplied" ? "medium" : "insufficient_data",
      insufficient_data_reasons: [],
    },
    reuse_outcome_draft: {
      helpful_refs: [],
      stale_refs: [],
      missing_refs: [],
      noisy_refs: [],
      misleading_refs: [],
      unused_or_unmentioned_refs: [],
      unknown_refs: [],
      context_helpfulness_summary: "",
      context_corrections_needed: [],
      confidence: resultReport === "supplied" ? "medium" : "insufficient_data",
      review_needed: true,
    },
    carry_forward_suggestions: {
      next_relay_update_suggestions: [],
      next_handoff_adjustments: [],
      refs_to_preserve_next_time: [],
      refs_to_warn_next_time: [],
      refs_to_drop_or_deprioritize: [],
      unresolved_gaps: [],
      next_focus_candidate: "",
    },
  };
}

function reuseProposal({
  status,
  blockedReasons,
  insufficientReasons,
  hasResultReport,
}) {
  return {
    proposal_version: "dogfood_reuse_record_proposal.v0.1",
    proposal_status: status,
    blocked_reasons: blockedReasons,
    insufficient_data_reasons: insufficientReasons,
    source_status: {
      feedback_draft: "supplied",
      codex_result_report: hasResultReport ? "supplied" : "missing",
      handoff_context_rationale: "supplied",
      codex_result_report_status: hasResultReport ? "supplied" : "missing",
    },
    proposed_expected_observed_summary: {
      matched_expectation_count: hasResultReport ? 1 : 0,
      missing_expectation_count: 0,
      unexpected_observation_count: 0,
    },
    proposed_reuse_classifications: {
      helpful_refs: [],
      stale_refs: [],
      missing_refs: [],
      noisy_refs: [],
      misleading_refs: [],
      unknown_refs: [],
    },
    carry_forward_candidates: {
      next_relay_update_suggestions: [],
      next_handoff_adjustments: [],
    },
    evidence_summary: {
      has_result_report: hasResultReport,
      evidence_refs: hasResultReport ? ["evidence:reuse"] : [],
      missing_evidence: ["evidence:missing-reuse"],
    },
  };
}

function metricSnapshotPreview() {
  return {
    preview_version: "dogfood_metric_snapshot_preview.v0.1",
    snapshot_preview_status: "ready_for_operator_review",
    recommended_next_action: "prepare_dogfood_metric_snapshot_decision",
    input_summary: {
      approved_reuse_ledger_record_count: 2,
      metric_candidate_ref_count: 4,
    },
    evidence_summary: {
      has_reuse_outcome_records: true,
      missing_evidence: [],
    },
    blocked_reasons: [],
    insufficient_data_reasons: [],
  };
}

function metricSnapshotDecisionPreview({ writeReady }) {
  return {
    preview_version: "dogfood_metric_snapshot_operator_decision_preview.v0.1",
    decision_preview_status: writeReady
      ? "ready_for_future_metric_snapshot_write"
      : "needs_operator_judgment",
    write_readiness: {
      write_ready: writeReady,
      current_blockers: [],
      current_refusal_reasons: [],
      current_missing_evidence: [],
      current_insufficient_data: [],
    },
    blocking_reasons: [],
    refusal_reasons: [],
    missing_evidence: [],
  };
}

function metricSnapshotRecordReview({ status, validCount }) {
  return {
    review_version: "dogfood_metric_snapshot_record_review.v0.1",
    review_status: status,
    input_summary: {
      valid_record_count: validCount,
      selected_metric_candidate_ref_count: validCount,
      receipt_side_effect_problem_count: 0,
    },
    evidence_summary: {
      has_records: validCount > 0,
      missing_evidence: [],
    },
    blocked_reasons: [],
    insufficient_data_reasons:
      validCount > 0 ? [] : ["dogfood_metric_snapshot_records_missing"],
  };
}

function nextWorkSignalRefreshPreview() {
  return {
    preview_version: "next_work_signal_refresh_preview.v0.1",
    refresh_preview_status: "ready_for_operator_review",
    input_summary: {
      metric_material_count: 1,
      next_work_signal_count: 3,
    },
    evidence_summary: {
      has_metric_material: true,
      missing_evidence: [],
    },
    blocked_reasons: [],
    insufficient_data_reasons: [],
  };
}

function nextWorkSignalDecisionPreview({ writeReady }) {
  return {
    preview_version: "next_work_signal_operator_decision_preview.v0.1",
    decision_preview_status: writeReady
      ? "ready_for_future_next_work_signal_record_write"
      : "needs_operator_judgment",
    input_summary: {
      signal_candidate_count: 3,
      selected_signal_ref_count: writeReady ? 1 : 0,
    },
    evidence_summary: {
      has_evidence_refs: true,
    },
    write_readiness: {
      write_ready: writeReady,
      current_blockers: [],
      current_refusal_reasons: [],
      current_missing_evidence: [],
      current_insufficient_data: [],
    },
    blocking_reasons: [],
    refusal_reasons: [],
    missing_evidence: [],
  };
}

function nextWorkSignalDecisionRecordReview({ status, validCount }) {
  return {
    review_version: "next_work_signal_decision_record_review.v0.1",
    review_status: status,
    input_summary: {
      valid_record_count: validCount,
      selected_signal_ref_count: validCount,
      receipt_side_effect_problem_count: 0,
    },
    evidence_summary: {
      has_records: validCount > 0,
      missing_evidence: [],
    },
    blocked_reasons: [],
    insufficient_data_reasons:
      validCount > 0 ? [] : ["next_work_signal_decision_records_missing"],
  };
}

function perspectiveRelayUpdateCandidateBridgePreview() {
  return {
    preview_version: "perspective_relay_update_candidate_bridge_preview.v0.1",
    bridge_preview_status: "ready_for_operator_review",
    input_summary: {
      candidate_material_count: 3,
    },
    evidence_summary: {
      has_next_work_signal_material: true,
      missing_evidence: [],
    },
    blocked_reasons: [],
    insufficient_data_reasons: [],
  };
}

function metricPreviewWithoutRecords() {
  return {
    preview_version: "dogfood_metric_candidate_preview.v0.1",
    candidate_status: "insufficient_data",
    aggregate_counts: {
      approved_record_count: 0,
    },
    source_record_summaries: [],
    insufficient_data_reasons: ["approved_reuse_records_missing"],
    metric_write_readiness: {
      required_followup: ["review_approved_reuse_records"],
      refusal_reasons: [],
    },
  };
}

function applyPreviewWithMissingEvidence() {
  return {
    preview_version: "handoff_context_apply_preview.v0.1",
    preview_status: "apply_candidates_available",
    input_summary: {
      apply_candidate_count: 1,
    },
    blocked_reasons: [],
    insufficient_data_reasons: [],
    conflict_summary: {
      blocked_apply_reasons: [],
    },
    evidence_summary: {
      has_record_review: true,
      missing_evidence: ["evidence:missing-apply"],
    },
  };
}

function applyWriteContractMissingCurrentMaterial() {
  return {
    preview_version: "handoff_context_apply_write_contract_preview.v0.1",
    contract_preview_status: "insufficient_data",
    recommended_next_action: "supply_current_handoff_packet_fingerprint",
    input_summary: {
      current_handoff_packet_fingerprint_supplied: false,
      current_handoff_context_ref_supplied: false,
      requested_operator_ref_supplied: false,
      would_apply_candidate_count: 1,
    },
    blocked_reasons: [],
    refusal_reasons: ["requires_current_handoff_packet_fingerprint"],
    insufficient_data_reasons: ["current_handoff_packet_fingerprint_missing"],
    missing_evidence: [],
    readiness: {
      ready_for_future_write_scope: false,
      current_blockers: [],
      current_refusal_reasons: ["requires_current_handoff_packet_fingerprint"],
      current_insufficient_data: [
        "current_handoff_packet_fingerprint_missing",
      ],
      current_missing_evidence: [],
    },
    evidence_summary: {
      has_apply_operator_decision_preview: true,
      missing_evidence: [],
    },
  };
}
