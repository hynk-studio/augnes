#!/usr/bin/env node
import assert from "node:assert/strict";
import {
  assertContainsAll,
  assertPackageScript,
  collectGitDiffFiles,
  collectUntrackedFiles,
  getBaseRangeChangedFiles,
  loadTextByFile,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const pageFile = "app/page.tsx";
const publicHomeFile = "components/augnes-public-home-surface.tsx";
const homeComponentFile = "components/human-surface/human-surface-home.tsx";
const blankStateFile = "components/human-surface/blank-state-panel.tsx";
const blankStateReviewEntryGridFile =
  "components/human-surface/blank-state-review-entry-grid.tsx";
const modePresetFile = "components/human-surface/mode-preset-selector.tsx";
const currentPerspectiveCardFile =
  "components/human-surface/current-perspective-card.tsx";
const recentDeltasFile = "components/human-surface/recent-deltas-preview.tsx";
const surfaceLinkGridFile = "components/human-surface/surface-link-grid.tsx";
const currentPerspectiveReadFile =
  "lib/human-surface/read-current-perspective.ts";
const blankStateReviewEntriesReadFile =
  "lib/human-surface/blank-state-review-entries.ts";
const humanSurfaceDoc = "docs/HUMAN_SURFACE_V0_1.md";
const blankStateReviewEntryAbsorptionDoc =
  "docs/BLANK_STATE_REVIEW_ENTRY_ABSORPTION_V0_1.md";
const smokeFile = "scripts/smoke-human-surface-home-v0-1.mjs";
const blankStateReviewEntryAbsorptionSmokeFile =
  "scripts/smoke-blank-state-review-entry-absorption-v0-1.mjs";
const packageJsonFile = "package.json";
const indexDoc = "docs/00_INDEX_LATEST.md";
const globalsCssFile = "app/globals.css";

const followOnSmokeCompatibilityFiles = [
  "scripts/smoke-augnes-delta-contract-v0-1.mjs",
  "scripts/smoke-augnes-delta-projection-v0-1.mjs",
  "scripts/smoke-augnes-delta-projection-route-v0-1.mjs",
  "scripts/smoke-current-working-perspective-v0-1.mjs",
  "scripts/smoke-current-working-perspective-route-v0-1.mjs",
];

const followOnPerspectiveHumanTimelineFiles = [
  "app/perspective/page.tsx",
  "components/perspective/perspective-public-constellation-surface.tsx",
  "components/perspective/perspective-human-surface.tsx",
  "components/perspective/perspective-current-summary-rail.tsx",
  "components/perspective/perspective-timeline.tsx",
  "components/perspective/perspective-delta-card.tsx",
  "components/perspective/perspective-delta-inspector.tsx",
  "components/perspective/perspective-boundary-next-panel.tsx",
  "lib/human-surface/read-delta-projection.ts",
  "scripts/smoke-perspective-human-timeline-v0-1.mjs",
];

const followOnAgentWorkplaneFiles = [
  "app/workbench/page.tsx",
  "components/workplane/agent-workplane.tsx",
  "components/workplane/workplane-header.tsx",
  "components/workplane/workplane-overview.tsx",
  "components/workplane/workplane-boundary-card.tsx",
  "components/workplane/legacy-cockpit-compatibility-panel.tsx",
  "lib/workplane/read-workplane-context.ts",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "scripts/smoke-agent-workplane-shell-v0-1.mjs",
];

const followOnAgentWorkplanePanelFiles = [
  "components/workplane/workplane-panel-shell.tsx",
  "components/workplane/work-queue-panel.tsx",
  "components/workplane/current-perspective-workplane-panel.tsx",
  "components/workplane/delta-projection-workplane-panel.tsx",
  "components/workplane/review-queue-workplane-panel.tsx",
  "components/workplane/evidence-handoff-workplane-panel.tsx",
  "components/workplane/workplane-inspector.tsx",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
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

const followOnResearchCandidateManualNoteCurrentSurfaceFiles = [
  "app/research-candidate-review/page.tsx",
  "components/human-surface/surface-link-grid.tsx",
  "components/research-candidate-manual-note-preview-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
  "scripts/smoke-research-candidate-manual-note-preview-ui-v0-1.mjs",
  "scripts/browser-validate-research-candidate-manual-note-lane-v0-1.mjs",
  "scripts/smoke-research-candidate-review-manual-parser-v0-1.mjs",
  "scripts/smoke-human-surface-home-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
];

const followOnResearchCandidateManualNoteHandoffSeedFiles = [
  "types/research-candidate-manual-note-handoff-seed.ts",
  "lib/research-candidate-review/manual-note-handoff-seed.ts",
  "components/research-candidate-manual-note-handoff-seed-preview.tsx",
  "components/research-candidate-manual-note-preview-panel.tsx",
  "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
  "scripts/smoke-research-candidate-manual-note-handoff-seed-v0-1.mjs",
  "scripts/smoke-research-candidate-manual-note-preview-ui-v0-1.mjs",
  "scripts/smoke-human-surface-home-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "package.json",
];

const followOnResearchCandidateManualNoteHandoffResultIntakeFiles = [
  "types/research-candidate-manual-note-handoff-result-intake.ts",
  "lib/research-candidate-review/manual-note-handoff-result-intake.ts",
  "components/research-candidate-manual-note-handoff-result-intake-panel.tsx",
  "components/research-candidate-manual-note-handoff-seed-preview.tsx",
  "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
  "scripts/smoke-research-candidate-manual-note-handoff-result-intake-v0-1.mjs",
  "scripts/smoke-research-candidate-manual-note-preview-ui-v0-1.mjs",
  "scripts/smoke-human-surface-home-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "package.json",
];

const followOnResearchCandidateManualNoteResultIntakeOperatorReviewFiles = [
  "types/research-candidate-manual-note-result-intake-operator-review.ts",
  "types/research-candidate-manual-note-result-record-contract-preview.ts",
  "lib/research-candidate-review/manual-note-result-intake-operator-review.ts",
  "lib/research-candidate-review/manual-note-result-record-contract-preview.ts",
  "components/research-candidate-manual-note-result-intake-operator-review-panel.tsx",
  "components/research-candidate-manual-note-handoff-result-intake-panel.tsx",
  "app/globals.css",
  "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
  "scripts/smoke-research-candidate-manual-note-result-intake-operator-review-v0-1.mjs",
  "scripts/smoke-research-candidate-manual-note-preview-ui-v0-1.mjs",
  "scripts/smoke-human-surface-home-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "package.json",
];

const followOnResearchCandidateManualResultAuthorizedRecordWriteFiles = [
  "lib/db/schema.sql",
  "lib/db.ts",
  "scripts/db-migrations.mjs",
  "scripts/db-migrate.mjs",
  "types/research-candidate-manual-result-authorized-record-write.ts",
  "lib/research-candidate-review/manual-result-authorized-record-write.ts",
  "lib/research-candidate-review/read-manual-result-records.ts",
  "app/api/research-candidate-review/manual-result-records/route.ts",
  "app/api/research-candidate-review/manual-result-records/[receipt_id]/rollback/route.ts",
  "components/research-candidate-manual-note-authorized-record-write-panel.tsx",
  "components/research-candidate-manual-note-record-readback-panel.tsx",
  "components/research-candidate-manual-note-result-intake-operator-review-panel.tsx",
  "app/globals.css",
  "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
  "scripts/smoke-research-candidate-manual-result-authorized-record-write-v0-1.mjs",
  "scripts/smoke-human-surface-home-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "package.json",
];

const followOnResearchCandidateManualResultDogfoodBridgePreviewFiles = [
  "types/research-candidate-manual-result-dogfood-bridge-preview.ts",
  "lib/research-candidate-review/manual-result-dogfood-bridge-preview.ts",
  "components/research-candidate-manual-result-dogfood-bridge-preview-panel.tsx",
  "components/research-candidate-manual-note-record-readback-panel.tsx",
  "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
  "scripts/smoke-research-candidate-manual-result-dogfood-bridge-preview-v0-1.mjs",
  "scripts/smoke-human-surface-home-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "package.json",
];

const followOnResearchCandidateManualResultDogfoodLedgerAuthorizationContractFiles = [
  "types/research-candidate-manual-result-dogfood-ledger-authorization-contract.ts",
  "types/research-candidate-manual-result-dogfood-ledger-authorization-review.ts",
  "lib/research-candidate-review/manual-result-dogfood-ledger-authorization-contract.ts",
  "lib/research-candidate-review/manual-result-dogfood-ledger-authorization-review.ts",
  "components/research-candidate-manual-result-dogfood-ledger-authorization-contract-panel.tsx",
  "components/research-candidate-manual-result-dogfood-bridge-preview-panel.tsx",
  "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
  "scripts/smoke-research-candidate-manual-result-dogfood-ledger-authorization-contract-v0-1.mjs",
  "scripts/smoke-human-surface-home-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "package.json",
];

const followOnResearchCandidateManualGlobalDogfoodLedgerWriteFiles = [
  "lib/db/schema.sql",
  "lib/db.ts",
  "scripts/db-migrations.mjs",
  "scripts/db-migrate.mjs",
  "types/research-candidate-manual-global-dogfood-ledger-write.ts",
  "lib/research-candidate-review/manual-global-dogfood-ledger-write.ts",
  "lib/research-candidate-review/read-manual-global-dogfood-ledger.ts",
  "app/api/research-candidate-review/manual-global-dogfood-ledger/route.ts",
  "app/api/research-candidate-review/manual-global-dogfood-ledger/[receipt_id]/rollback/route.ts",
  "components/research-candidate-manual-global-dogfood-ledger-write-panel.tsx",
  "components/research-candidate-manual-global-dogfood-ledger-readback-panel.tsx",
  "types/research-candidate-manual-global-dogfood-ledger-workbench-projection.ts",
  "lib/research-candidate-review/manual-global-dogfood-ledger-workbench-projection.ts",
  "components/research-candidate-manual-global-dogfood-ledger-workbench-projection-panel.tsx",
  "components/research-candidate-manual-result-dogfood-ledger-authorization-contract-panel.tsx",
  "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
  "scripts/smoke-research-candidate-manual-global-dogfood-ledger-write-v0-1.mjs",
  "scripts/smoke-research-candidate-manual-global-dogfood-ledger-workbench-projection-v0-1.mjs",
  "scripts/smoke-human-surface-home-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "package.json",
];

const followOnResearchCandidateManualGlobalDogfoodLoopContractFiles = [
  "types/research-candidate-manual-global-dogfood-ledger-workbench-projection.ts",
  "lib/research-candidate-review/manual-global-dogfood-ledger-workbench-projection.ts",
  "components/research-candidate-manual-global-dogfood-ledger-workbench-projection-panel.tsx",
  "types/research-candidate-manual-global-dogfood-metric-snapshot-contract.ts",
  "types/research-candidate-manual-global-dogfood-metric-snapshot-review.ts",
  "types/research-candidate-manual-global-dogfood-next-work-signal-contract.ts",
  "types/research-candidate-manual-global-dogfood-next-work-signal-review.ts",
  "lib/research-candidate-review/manual-global-dogfood-metric-snapshot-contract.ts",
  "lib/research-candidate-review/manual-global-dogfood-metric-snapshot-review.ts",
  "lib/research-candidate-review/manual-global-dogfood-next-work-signal-contract.ts",
  "lib/research-candidate-review/manual-global-dogfood-next-work-signal-review.ts",
  "components/research-candidate-manual-global-dogfood-metric-snapshot-contract-panel.tsx",
  "components/research-candidate-manual-global-dogfood-next-work-signal-contract-panel.tsx",
  "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
  "scripts/smoke-research-candidate-manual-global-dogfood-loop-contracts-v0-1.mjs",
  "scripts/smoke-human-surface-home-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "package.json",
];

const followOnResearchCandidateManualGlobalDogfoodMetricSnapshotWriteFiles = [
  "lib/db/schema.sql",
  "lib/db.ts",
  "scripts/db-migrations.mjs",
  "scripts/db-migrate.mjs",
  "types/research-candidate-manual-global-dogfood-metric-snapshot-write.ts",
  "lib/research-candidate-review/manual-global-dogfood-metric-snapshot-write.ts",
  "lib/research-candidate-review/read-manual-global-dogfood-metric-snapshot.ts",
  "app/api/research-candidate-review/manual-global-dogfood-metric-snapshot/route.ts",
  "app/api/research-candidate-review/manual-global-dogfood-metric-snapshot/[receipt_id]/rollback/route.ts",
  "components/research-candidate-manual-global-dogfood-metric-snapshot-write-panel.tsx",
  "components/research-candidate-manual-global-dogfood-metric-snapshot-readback-panel.tsx",
  "components/research-candidate-manual-global-dogfood-metric-snapshot-contract-panel.tsx",
  "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
  "scripts/smoke-research-candidate-manual-global-dogfood-metric-snapshot-write-v0-1.mjs",
  "scripts/smoke-human-surface-home-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "package.json",
];

const followOnResearchCandidateManualGlobalDogfoodNextWorkSignalWriteFiles = [
  "lib/db/schema.sql",
  "lib/db.ts",
  "scripts/db-migrations.mjs",
  "scripts/db-migrate.mjs",
  "types/research-candidate-manual-global-dogfood-next-work-signal-write.ts",
  "lib/research-candidate-review/manual-global-dogfood-next-work-signal-write.ts",
  "lib/research-candidate-review/read-manual-global-dogfood-next-work-signal.ts",
  "app/api/research-candidate-review/manual-global-dogfood-next-work-signal/route.ts",
  "app/api/research-candidate-review/manual-global-dogfood-next-work-signal/[receipt_id]/rollback/route.ts",
  "components/research-candidate-manual-global-dogfood-next-work-signal-write-panel.tsx",
  "components/research-candidate-manual-global-dogfood-next-work-signal-readback-panel.tsx",
  "components/research-candidate-manual-global-dogfood-next-work-signal-contract-panel.tsx",
  "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
  "scripts/smoke-research-candidate-manual-global-dogfood-next-work-signal-write-v0-1.mjs",
  "scripts/smoke-research-candidate-manual-global-dogfood-metric-snapshot-write-v0-1.mjs",
  "scripts/smoke-human-surface-home-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "package.json",
];

const followOnResearchCandidateManualGlobalDogfoodActionContractFiles = [
  "types/research-candidate-manual-global-dogfood-next-work-bias-contract.ts",
  "types/research-candidate-manual-global-dogfood-next-work-bias-review.ts",
  "types/research-candidate-manual-global-dogfood-perspective-relay-contract.ts",
  "types/research-candidate-manual-global-dogfood-perspective-relay-review.ts",
  "lib/research-candidate-review/manual-global-dogfood-next-work-bias-contract.ts",
  "lib/research-candidate-review/manual-global-dogfood-next-work-bias-review.ts",
  "lib/research-candidate-review/manual-global-dogfood-perspective-relay-contract.ts",
  "lib/research-candidate-review/manual-global-dogfood-perspective-relay-review.ts",
  "components/research-candidate-manual-global-dogfood-next-work-bias-contract-panel.tsx",
  "components/research-candidate-manual-global-dogfood-perspective-relay-contract-panel.tsx",
  "components/research-candidate-manual-global-dogfood-next-work-signal-readback-panel.tsx",
  "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
  "scripts/smoke-research-candidate-manual-global-dogfood-action-contracts-v0-1.mjs",
  "scripts/smoke-human-surface-home-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "package.json",
];

const followOnResearchCandidateManualGlobalDogfoodNextWorkBiasWriteFiles = [
  "lib/db/schema.sql",
  "lib/db.ts",
  "scripts/db-migrations.mjs",
  "scripts/db-migrate.mjs",
  "types/research-candidate-manual-global-dogfood-next-work-bias-write.ts",
  "lib/research-candidate-review/manual-global-dogfood-next-work-bias-write.ts",
  "lib/research-candidate-review/read-manual-global-dogfood-next-work-bias.ts",
  "app/api/research-candidate-review/manual-global-dogfood-next-work-bias/route.ts",
  "app/api/research-candidate-review/manual-global-dogfood-next-work-bias/[receipt_id]/rollback/route.ts",
  "components/research-candidate-manual-global-dogfood-next-work-bias-write-panel.tsx",
  "components/research-candidate-manual-global-dogfood-next-work-bias-readback-panel.tsx",
  "components/research-candidate-manual-global-dogfood-next-work-bias-contract-panel.tsx",
  "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
  "scripts/smoke-research-candidate-manual-global-dogfood-next-work-bias-write-v0-1.mjs",
  "scripts/smoke-research-candidate-manual-global-dogfood-action-contracts-v0-1.mjs",
  "scripts/smoke-research-candidate-manual-global-dogfood-next-work-signal-write-v0-1.mjs",
  "scripts/smoke-research-candidate-manual-global-dogfood-metric-snapshot-write-v0-1.mjs",
  "scripts/smoke-human-surface-home-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "package.json",
];

const followOnResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteFiles = [
  "lib/db/schema.sql",
  "lib/db.ts",
  "scripts/db-migrations.mjs",
  "scripts/db-migrate.mjs",
  "types/research-candidate-manual-global-dogfood-perspective-relay-write.ts",
  "lib/research-candidate-review/manual-global-dogfood-perspective-relay-write.ts",
  "lib/research-candidate-review/read-manual-global-dogfood-perspective-relay.ts",
  "app/api/research-candidate-review/manual-global-dogfood-perspective-relay/route.ts",
  "app/api/research-candidate-review/manual-global-dogfood-perspective-relay/[receipt_id]/rollback/route.ts",
  "components/research-candidate-manual-global-dogfood-perspective-relay-write-panel.tsx",
  "components/research-candidate-manual-global-dogfood-perspective-relay-readback-panel.tsx",
  "components/research-candidate-manual-global-dogfood-perspective-relay-contract-panel.tsx",
  "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
  "scripts/smoke-research-candidate-manual-global-dogfood-perspective-relay-write-v0-1.mjs",
  "scripts/smoke-research-candidate-manual-global-dogfood-next-work-bias-write-v0-1.mjs",
  "scripts/smoke-research-candidate-manual-global-dogfood-action-contracts-v0-1.mjs",
  "scripts/smoke-human-surface-home-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "package.json",
];

const followOnResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateContractFiles = [
  "types/research-candidate-manual-global-dogfood-canonical-perspective-update-contract.ts",
  "types/research-candidate-manual-global-dogfood-canonical-perspective-update-review.ts",
  "lib/research-candidate-review/manual-global-dogfood-canonical-perspective-update-contract.ts",
  "lib/research-candidate-review/manual-global-dogfood-canonical-perspective-update-review.ts",
  "components/research-candidate-manual-global-dogfood-canonical-perspective-update-contract-panel.tsx",
  "components/research-candidate-manual-global-dogfood-perspective-relay-readback-panel.tsx",
  "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
  "scripts/smoke-research-candidate-manual-global-dogfood-canonical-perspective-update-contract-v0-1.mjs",
  "scripts/smoke-human-surface-home-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "package.json",
];

const followOnResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateWriteFiles = [
  "lib/db/schema.sql",
  "lib/db.ts",
  "scripts/db-migrations.mjs",
  "scripts/db-migrate.mjs",
  "types/research-candidate-manual-global-dogfood-canonical-perspective-update-write.ts",
  "lib/research-candidate-review/manual-global-dogfood-canonical-perspective-update-write.ts",
  "lib/research-candidate-review/read-manual-global-dogfood-canonical-perspective-update.ts",
  "app/api/research-candidate-review/manual-global-dogfood-canonical-perspective-update/route.ts",
  "app/api/research-candidate-review/manual-global-dogfood-canonical-perspective-update/[receipt_id]/rollback/route.ts",
  "components/research-candidate-manual-global-dogfood-canonical-perspective-update-write-panel.tsx",
  "components/research-candidate-manual-global-dogfood-canonical-perspective-update-readback-panel.tsx",
  "components/research-candidate-manual-global-dogfood-canonical-perspective-update-contract-panel.tsx",
  "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
  "scripts/smoke-research-candidate-manual-global-dogfood-canonical-perspective-update-write-v0-1.mjs",
  "scripts/smoke-human-surface-home-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "package.json",
];

const followOnResearchCandidateManualGlobalDogfoodPerspectiveApplyContractFiles = [
  "types/research-candidate-manual-global-dogfood-perspective-apply-contract.ts",
  "types/research-candidate-manual-global-dogfood-perspective-apply-review.ts",
  "lib/research-candidate-review/manual-global-dogfood-perspective-apply-contract.ts",
  "lib/research-candidate-review/manual-global-dogfood-perspective-apply-review.ts",
  "components/research-candidate-manual-global-dogfood-perspective-apply-contract-panel.tsx",
  "components/research-candidate-manual-global-dogfood-canonical-perspective-update-readback-panel.tsx",
  "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
  "scripts/smoke-research-candidate-manual-global-dogfood-perspective-apply-contract-v0-1.mjs",
  "scripts/smoke-human-surface-home-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "package.json",
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

const followOnWebGuidePanelFiles = [
  "components/guide/guide-brief-panel.tsx",
  "components/guide/guide-brief-section.tsx",
  "components/guide/guide-brief-summary-card.tsx",
  "components/guide/guide-brief-boundary-card.tsx",
  "components/guide/guide-brief-mini-panel.tsx",
  "lib/guide/read-guide-brief-for-web.ts",
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


const requiredFiles = [
  pageFile,
  publicHomeFile,
  homeComponentFile,
  blankStateFile,
  blankStateReviewEntryGridFile,
  modePresetFile,
  currentPerspectiveCardFile,
  recentDeltasFile,
  surfaceLinkGridFile,
  currentPerspectiveReadFile,
  blankStateReviewEntriesReadFile,
  humanSurfaceDoc,
  blankStateReviewEntryAbsorptionDoc,
  smokeFile,
  blankStateReviewEntryAbsorptionSmokeFile,
  packageJsonFile,
  indexDoc,
  globalsCssFile,
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
  ...requiredFiles,
  ...followOnSmokeCompatibilityFiles,
  ...followOnPerspectiveHumanTimelineFiles,
  ...followOnAgentWorkplaneFiles,
  ...followOnAgentWorkplanePanelFiles,
  ...followOnAgentWorkplaneProjectionHandoffFiles,
  ...followOnAgentWorkplaneCleanupHardeningFiles,
  ...followOnResearchCandidateManualNoteCurrentSurfaceFiles,
  ...followOnResearchCandidateManualNoteHandoffSeedFiles,
  ...followOnResearchCandidateManualNoteHandoffResultIntakeFiles,
  ...followOnResearchCandidateManualNoteResultIntakeOperatorReviewFiles,
  ...followOnResearchCandidateManualResultAuthorizedRecordWriteFiles,
  ...followOnResearchCandidateManualResultDogfoodBridgePreviewFiles,
  ...followOnResearchCandidateManualResultDogfoodLedgerAuthorizationContractFiles,
  ...followOnResearchCandidateManualGlobalDogfoodLedgerWriteFiles,
  ...followOnResearchCandidateManualGlobalDogfoodLoopContractFiles,
  ...followOnResearchCandidateManualGlobalDogfoodMetricSnapshotWriteFiles,
  ...followOnResearchCandidateManualGlobalDogfoodNextWorkSignalWriteFiles,
  ...followOnResearchCandidateManualGlobalDogfoodActionContractFiles,
  ...followOnResearchCandidateManualGlobalDogfoodNextWorkBiasWriteFiles,
  ...followOnResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteFiles,
  ...followOnResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateContractFiles,
  ...followOnResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateWriteFiles,
  ...followOnResearchCandidateManualGlobalDogfoodPerspectiveApplyContractFiles,
  ...followOnGuideBriefCoreFiles,
  ...followOnGuideBriefRouteFiles,
  ...followOnWebGuidePanelFiles,
  ...followOnChatgptAppGuideBriefToolFiles,
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
const pageText = textByFile.get(pageFile);
const publicHomeText = textByFile.get(publicHomeFile);
const homeText = textByFile.get(homeComponentFile);
const blankStateText = textByFile.get(blankStateFile);
const blankStateReviewEntryGridText = textByFile.get(
  blankStateReviewEntryGridFile,
);
const modePresetText = textByFile.get(modePresetFile);
const currentCardText = textByFile.get(currentPerspectiveCardFile);
const recentDeltasText = textByFile.get(recentDeltasFile);
const surfaceLinksText = textByFile.get(surfaceLinkGridFile);
const readHelperText = textByFile.get(currentPerspectiveReadFile);
const blankStateReviewEntriesText = textByFile.get(
  blankStateReviewEntriesReadFile,
);
const docText = textByFile.get(humanSurfaceDoc);
const blankStateReviewEntryAbsorptionDocText = textByFile.get(
  blankStateReviewEntryAbsorptionDoc,
);
const smokeText = textByFile.get(smokeFile);
const packageJsonText = textByFile.get(packageJsonFile);
const indexText = textByFile.get(indexDoc);
const cssText = textByFile.get(globalsCssFile);

assertPackageJsonScript();
assertIndexPointer();
assertHomeRoute();
assertHumanSurfaceComponents();
assertBlankStateReviewEntries();
assertModePresets();
assertCurrentPerspectiveCard();
assertRecentDeltasPreview();
assertSurfaceLinks();
assertFallbackDisclosure();
assertRuntimeReadMarkerUse();
assertDocs();
assertNoMutationOrActuationCode();
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
];
for (const file of followOnHandoffCapsuleFiles) {
  allowedChangedFiles.add(file);
}

const followOnHandoffCapsuleWebPreviewFiles = [
  "components/handoff/handoff-capsule-preview-panel.tsx",
  "components/handoff/codex-launch-card-preview-panel.tsx",
  "components/handoff/handoff-preview-boundary-card.tsx",
  "lib/handoff/read-handoff-capsule-for-web.ts",
  "components/workplane/agent-workplane.tsx",
  "scripts/smoke-handoff-capsule-web-preview-v0-1.mjs",
  "scripts/smoke-agent-workplane-shell-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
  "scripts/smoke-guide-brief-route-v0-1.mjs",
  "scripts/smoke-handoff-capsule-route-v0-1.mjs",
  "scripts/smoke-web-guide-panel-v0-1.mjs",
];
for (const file of followOnHandoffCapsuleWebPreviewFiles) {
  allowedChangedFiles.add(file);
}

const changedFilesBoundary = assertChangedFileBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "human-surface-home-v0-1",
      pass: true,
      required_files_checked: requiredFiles,
      package_script_checked: true,
      index_pointer_checked: true,
      home_route_checked: true,
      blank_state_checked: true,
      blank_state_review_entries_checked: true,
      mode_presets_checked: true,
      current_working_perspective_card_checked: true,
      recent_deltas_preview_checked: true,
      surface_links_checked: true,
      fallback_disclosure_checked: true,
      route_marker_checked: true,
      no_mutation_or_actuation_code_checked: true,
      changed_files_checked: changedFilesBoundary.checked,
      changed_files_skipped: changedFilesBoundary.skipped,
      changed_files_skip_reason: changedFilesBoundary.skip_reason,
      changed_files_observed: changedFilesBoundary.files,
      follow_on_smoke_compatibility_files_allowed:
        followOnSmokeCompatibilityFiles,
      follow_on_perspective_human_timeline_files_allowed:
        followOnPerspectiveHumanTimelineFiles,
      follow_on_agent_workplane_files_allowed: followOnAgentWorkplaneFiles,
      follow_on_agent_workplane_panel_files_allowed:
        followOnAgentWorkplanePanelFiles,
      follow_on_research_candidate_manual_note_current_surface_files_allowed:
        followOnResearchCandidateManualNoteCurrentSurfaceFiles,
      follow_on_research_candidate_manual_note_result_intake_operator_review_files_allowed:
        followOnResearchCandidateManualNoteResultIntakeOperatorReviewFiles,
      follow_on_research_candidate_manual_result_authorized_record_write_files_allowed:
        followOnResearchCandidateManualResultAuthorizedRecordWriteFiles,
      follow_on_guide_brief_core_files_allowed:
        followOnGuideBriefCoreFiles,
      smoke_type: "static-human-surface-home-ui-helper-doc-package-index-boundary-only",
      phase5a_agent_workplane_follow_on_used:
        changedFilesBoundary.phase5a_agent_workplane_follow_on_used,
      phase5b_agent_workplane_panel_follow_on_used:
        changedFilesBoundary.phase5b_agent_workplane_panel_follow_on_used,
      route_behavior_changed: changedFilesBoundary.route_behavior_changed,
      route_behavior_change_reason:
        changedFilesBoundary.route_behavior_change_reason,
      db_schema_migration_changed: false,
      db_write_added: false,
      mcp_app_tool_added: false,
      provider_openai_github_runtime_call_added: false,
      codex_execution_added: false,
      proof_evidence_write_added: false,
      memory_mutation_added: false,
      durable_perspective_state_apply_added: false,
      scheduler_autonomy_runner_added: false,
      perspective_timeline_added: false,
      workbench_page_changed: changedFilesBoundary.workbench_page_changed,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:human-surface-home-v0-1");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText,
    scriptName: "smoke:human-surface-home-v0-1",
    expectedCommand: "node scripts/smoke-human-surface-home-v0-1.mjs",
  });
}

function assertIndexPointer() {
  assertContainsAll(indexText, [humanSurfaceDoc, "Phase 4A read-only Human Surface Home"], {
    label: indexDoc,
  });
}

function assertHomeRoute() {
  assertContainsAll(pageText, ["AugnesPublicHomeSurface"], { label: pageFile });
  assertContainsAll(publicHomeText, ["HumanSurfaceHome"], {
    label: publicHomeFile,
  });
  assert(!pageText.includes("AugnesCockpit"), "/ must not render Cockpit directly");
}

function assertHumanSurfaceComponents() {
  assertContainsAll(
    homeText,
    [
      "HumanSurfaceHome",
      "readCurrentPerspectiveForHumanSurface",
      "BlankStatePanel",
      "buildBlankStateReviewEntries",
      "readRunnerDeltaBatchesForWorkplane",
      "CurrentPerspectiveCard",
      "RecentDeltasPreview",
      "SurfaceLinkGrid",
      "What are you trying to do?",
      'href="/perspective"',
      'href="/workbench"',
    ],
    { label: homeComponentFile },
  );

  assertContainsAll(
    blankStateText,
    [
      "The Blank State",
      "BlankStateReviewEntryGrid",
      "Read-only boundary",
      "Blank State Review Entry Absorption v0.1",
    ],
    {
      label: blankStateFile,
    },
  );

  assertContainsAll(cssText, ["human-surface-home", "human-surface-mode-grid"], {
    label: globalsCssFile,
  });
}

function assertBlankStateReviewEntries() {
  const requiredEntryIds = [
    "continue_current_work_entry",
    "review_pending_proposals_entry",
    "choose_perspective_lens_entry",
    "prepare_codex_handoff_entry",
    "review_runner_deltabatch_entry",
    "automation_mode_entry",
    "user_judgment_summary_entry",
  ];
  const stateProposalReviewNextSurfaceEntryIds = [
    "review_pending_proposals_entry",
    "choose_perspective_lens_entry",
    "user_judgment_summary_entry",
  ];

  assertContainsAll(
    blankStateReviewEntriesText,
    [
      "BLANK_STATE_REVIEW_ENTRY_IDS",
      'destination: "workplane";',
      'next_surface?: "state_proposal_review";',
      ...requiredEntryIds.map((id) => `"${id}"`),
      'href: "/workbench#work_queue"',
      'href: "/workbench#review_queue"',
      'href: "/perspective"',
      'href: "/workbench#handoff_builder_preview"',
      'href: "/workbench#runner_delta_batch"',
      'href: "/workbench#authority_boundary"',
      "No approve, apply, reject, or commit control.",
      "No runner execution, tick, recovery, or scheduling.",
    ],
    { label: blankStateReviewEntriesReadFile },
  );

  assertContainsAll(
    blankStateReviewEntryGridText,
    [
      'data-blank-state-review-entry-grid="v0.1"',
      "data-blank-state-entry-destination={entry.destination}",
      "data-blank-state-entry-id={entry.capability_id}",
      "data-blank-state-entry-next-surface={",
      "data-blank-state-entry-target={entry.target_label}",
      "data-blank-state-entry-source-status={entry.source_status}",
      "href={entry.href}",
    ],
    { label: blankStateReviewEntryGridFile },
  );

  const destinationAssignments = blankStateReviewEntriesText.match(
    /destination:\s*"workplane",/g,
  );
  assert.equal(
    destinationAssignments?.length ?? 0,
    7,
    "Every Blank State entry must set destination: \"workplane\"",
  );
  const nextSurfaceAssignments = blankStateReviewEntriesText.match(
    /next_surface:\s*"state_proposal_review",/g,
  );
  assert.equal(
    nextSurfaceAssignments?.length ?? 0,
    3,
    "Exactly the three State Proposal Review related entries must set next_surface",
  );
  for (const id of stateProposalReviewNextSurfaceEntryIds) {
    assert(
      new RegExp(
        `capability_id:\\s*"${id}",\\s*destination:\\s*"workplane",\\s*next_surface:\\s*"state_proposal_review",`,
      ).test(blankStateReviewEntriesText),
      `Missing state_proposal_review next surface for ${id}`,
    );
  }

  assertContainsAll(
    blankStateReviewEntryAbsorptionDocText,
    [
      "Blank State Review Entry Absorption v0.1",
      ...requiredEntryIds.map((id) => `\`${id}\``),
      "This PR adds high-level entry, summary, and navigation only.",
    ],
    { label: blankStateReviewEntryAbsorptionDoc },
  );
}

function assertModePresets() {
  assertContainsAll(
    modePresetText,
    [
      "general",
      "writing",
      "research",
      "coding",
      "office",
      "presentation",
      "agentic",
      "physical_world_model",
      "display-only",
      "do not create work",
    ],
    { label: modePresetFile },
  );

  assert(
    !/\bonClick\s*=|\buseState\s*\(|<button\b|<input\b|<form\b/i.test(
      modePresetText,
    ),
    `${modePresetFile} mode preset selection must remain local/display-only`,
  );
}

function assertCurrentPerspectiveCard() {
  assertContainsAll(
    currentCardText,
    [
      "Current Working Perspective",
      "What Augnes thinks is going on",
      "Current thesis",
      "Active goals",
      "Open questions",
      "Active risks",
      "Research pressure",
      "Staleness",
      "Source status",
      'href="/perspective"',
    ],
    { label: currentPerspectiveCardFile },
  );
}

function assertRecentDeltasPreview() {
  assertContainsAll(
    recentDeltasText,
    [
      "Recent important deltas",
      "last major",
      "needs review",
      "blocked / manual review",
      "delta.type",
      "delta.source",
      "delta.created_at",
      "delta.review_reason",
      "No projected deltas available yet. Augnes can still show Current",
    ],
    { label: recentDeltasFile },
  );
}

function assertSurfaceLinks() {
  assertContainsAll(
    surfaceLinksText,
    [
      'href: "/perspective"',
      'href: "/workbench"',
      'href: "/research-candidate-review"',
      "Manual research notes",
      "Candidate-only manual research note preview.",
      "No source fetching",
      "provider calls",
      "retrieval/RAG",
      "durable Perspective promotion",
      "proof/evidence writes",
      "Future Guide / ChatGPT / Codex handoff",
    ],
    { label: surfaceLinkGridFile },
  );
}

function assertFallbackDisclosure() {
  assertContainsAll(
    `${currentCardText}\n${readHelperText}`,
    [
      "source_status",
      "fixture_fallback",
      "empty_fallback",
      "fallback_reason",
      "authority_boundary",
      "Current Working Perspective is unavailable from runtime. Showing public-safe sample / empty fallback. No state was read or mutated.",
    ],
    { label: "human surface fallback disclosure" },
  );
}

function assertRuntimeReadMarkerUse() {
  assertContainsAll(
    readHelperText,
    [
      "GET",
      "cache: \"no-store\"",
      "x-augnes-local-readonly",
      "current-working-perspective-v0.1",
      "/api/perspective/current?scope=project:augnes",
    ],
    { label: currentPerspectiveReadFile },
  );
}

function assertDocs() {
  assertContainsAll(
    docText,
    [
      "Phase 4A Human Surface Home",
      "The Blank State",
      "source_status",
      "fixture_fallback",
      "read-only Human Surface UI",
      "Phase 4B Perspective Human Timeline",
      "Phase 5 Agent Workplane is future work",
      "Mode preset display does not create work",
    ],
    { label: humanSurfaceDoc },
  );
}

function assertNoMutationOrActuationCode() {
  const runtimeText = [
    homeText,
    blankStateText,
    modePresetText,
    currentCardText,
    recentDeltasText,
    surfaceLinksText,
    readHelperText,
    blankStateReviewEntriesText,
    blankStateReviewEntryGridText,
    publicHomeText,
  ].join("\n");

  const forbiddenPatterns = [
    /\bmethod:\s*["'](?:POST|PUT|PATCH|DELETE)["']/,
    /\bfetch\s*\([^)]*,\s*\{[\s\S]*\bmethod:\s*["'](?:POST|PUT|PATCH|DELETE)["']/,
    /\bappendWorkEvent\s*\(/,
    /\bappendCoordinationEvent\s*\(/,
    /\bcreateEvidenceRecord\s*\(/,
    /\brecordProof\s*\(/,
    /\bcommitState\b/,
    /\brejectState\b/,
    /\bcommitStateDeltaProposal\b/,
    /\brejectStateDeltaProposal\b/,
    /\bwrite[A-Z]\w*\s*\(/,
    /\binsert[A-Z]\w*\s*\(/,
    /\bupdate[A-Z]\w*\s*\(/,
    /\bdelete[A-Z]\w*\s*\(/,
    /\bnew\s+Database\b/,
    /@openai/,
    /\bopenai\b/i,
    /\boctokit\b/i,
    /\bcreatePullRequest\s*\(/,
    /\bchild_process\b/,
    /\bspawn\s*\(/,
    /\bexecFile\s*\(/,
    /\bexecuteCodex\s*\(/,
    /\bcodexSdk\b/i,
    /\bsetInterval\s*\(/,
    /\bsetTimeout\s*\(/,
    /\bscheduler\s*\(/i,
    /\bfrom\s+["'][^"']*scheduler/i,
    /\bautonomyRunner\b/i,
    /\bINSERT\s+INTO\b/i,
    /\bUPDATE\s+\w+/i,
    /\bDELETE\s+FROM\b/i,
    /\bCREATE\s+TABLE\b/i,
    /\bALTER\s+TABLE\b/i,
    /\bDROP\s+TABLE\b/i,
  ];

  for (const pattern of forbiddenPatterns) {
    assert(
      !pattern.test(runtimeText),
      `Human Surface runtime/component code must not match ${pattern}`,
    );
  }

  assertContainsAll(
    smokeText,
    [
      "no_mutation_or_actuation_code_checked",
      "app/workbench/page.tsx",
      "components/perspective/",
      "migrations/",
      "apps/augnes_apps/",
    ],
    { label: smokeFile },
  );
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

  for (const file of files) {
    assert(
      allowedChangedFiles.has(file),
      `Unexpected Phase 4A changed or untracked file: ${file}`,
    );
    assert(
      file !== "app/perspective/page.tsx" ||
        followOnPerspectiveHumanTimelineFiles.includes(file),
      "Phase 4A follow-on must only update /perspective page for Phase 4B",
    );
    assert(
      file !== "app/workbench/page.tsx" ||
        followOnAgentWorkplaneFiles.includes(file),
      "Phase 4A must not update /workbench page outside the Phase 5A Agent Workplane follow-on",
    );
    assert(
      !/^components\/perspective\//.test(file) ||
        followOnPerspectiveHumanTimelineFiles.includes(file),
      `Phase 4A follow-on must not add /perspective timeline components outside Phase 4B: ${file}`,
    );
    assert(
      !/^app\/api\//.test(file) ||
        followOnGuideBriefRouteFiles.includes(file) ||
        file === "app/api/augnes/read/autonomy-contract/route.ts" ||
        phase9aAutonomyRunnerPreflightFiles.includes(file) ||
        followOnResearchCandidateManualResultAuthorizedRecordWriteFiles.includes(file) ||
        followOnResearchCandidateManualGlobalDogfoodLedgerWriteFiles.includes(file) ||
        followOnResearchCandidateManualGlobalDogfoodMetricSnapshotWriteFiles.includes(file) ||
        followOnResearchCandidateManualGlobalDogfoodNextWorkSignalWriteFiles.includes(file) ||
        followOnResearchCandidateManualGlobalDogfoodNextWorkBiasWriteFiles.includes(file) ||
        followOnResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteFiles.includes(file) ||
        followOnResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateWriteFiles.includes(file),
      `Phase 4A must not add API routes outside exact Phase 6B GuideBrief follow-on scope: ${file}`,
    );
    assert(
      !/^app\/.*route\.(ts|tsx|js|jsx)$/.test(file) ||
        followOnGuideBriefRouteFiles.includes(file) ||
        file === "app/api/augnes/read/autonomy-contract/route.ts" ||
        phase9aAutonomyRunnerPreflightFiles.includes(file) ||
        followOnResearchCandidateManualResultAuthorizedRecordWriteFiles.includes(file) ||
        followOnResearchCandidateManualGlobalDogfoodLedgerWriteFiles.includes(file) ||
        followOnResearchCandidateManualGlobalDogfoodMetricSnapshotWriteFiles.includes(file) ||
        followOnResearchCandidateManualGlobalDogfoodNextWorkSignalWriteFiles.includes(file) ||
        followOnResearchCandidateManualGlobalDogfoodNextWorkBiasWriteFiles.includes(file) ||
        followOnResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteFiles.includes(file) ||
        followOnResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateWriteFiles.includes(file),
      `Phase 4A must not add route files outside exact Phase 6B GuideBrief follow-on scope: ${file}`,
    );
    assert(!/^db\//.test(file), `Phase 4A must not change DB files: ${file}`);
    assert(
      !/^migrations\//.test(file),
      `Phase 4A must not change migrations: ${file}`,
    );
    assert(
      (!/^apps\/augnes_apps\//.test(file) || followOnChatgptAppGuideBriefToolFiles.includes(file)),
      `Phase 4A must not change MCP/App files: ${file}`,
    );
    assert(
      ((!/(^|\/)(mcp|plugin|plugins|tool|tools)(\/|$)/i.test(file) || followOnCodexGuideBriefHandoffFiles.includes(file)) || followOnChatgptAppGuideBriefToolFiles.includes(file) || followOnCodexGuideBriefHandoffFiles.includes(file) || phase9aAutonomyRunnerPreflightFiles.includes(file)),
      `Phase 4A must not change MCP/App tool files: ${file}`,
    );
    assert(
      !/(^|\/)(provider|providers|openai|github)(\/|$)/i.test(file),
      `Phase 4A must not change provider/OpenAI/GitHub runtime files: ${file}`,
    );
    assert(
      !/(^|\/)(proof|evidence)(\/|$)/i.test(file),
      `Phase 4A must not add proof/evidence write paths: ${file}`,
    );
    assert(
      !/(^|\/)(work-mutation|work_mutation|autonomy-runner|scheduler)(\/|$)/i.test(file),
      `Phase 4A must not add work mutation or autonomy runner files: ${file}`,
    );
  }

  const phase5aAgentWorkplaneFollowOnUsed = files.some((file) =>
    followOnAgentWorkplaneFiles.includes(file),
  );
  const phase5bAgentWorkplanePanelFollowOnUsed = files.some((file) =>
    followOnAgentWorkplanePanelFiles.includes(file),
  );
  const workbenchPageChanged = files.includes("app/workbench/page.tsx");

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
    phase5a_agent_workplane_follow_on_used:
      phase5aAgentWorkplaneFollowOnUsed,
    phase5b_agent_workplane_panel_follow_on_used:
      phase5bAgentWorkplanePanelFollowOnUsed,
    workbench_page_changed: workbenchPageChanged,
    route_behavior_changed: workbenchPageChanged,
    route_behavior_change_reason: workbenchPageChanged
      ? "Phase 5A Agent Workplane follow-on updates /workbench wrapper only."
      : null,
    files,
  };
}
