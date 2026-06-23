import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";

const typePath = "types/feedback-event-store-review-controls-preview.ts";
const builderPath =
  "lib/research-candidate-review/feedback-event-store-review-controls-preview.ts";
const sourceFeedbackFixturePath =
  "fixtures/research-candidate-review.feedback-event-store.sample.v0.1.json";
const substratePreviewFixturePath =
  "fixtures/agent-perspective-substrate-preview.sample.v0.1.json";
const handoffDraftReviewFixturePath =
  "fixtures/research-candidate-review.candidate-to-codex-handoff-draft-review.sample.v0.1.json";
const operatorDecisionFixturePath =
  "fixtures/research-candidate-review.candidate-to-codex-handoff-operator-decision.sample.v0.1.json";
const previewFixturePath =
  "fixtures/research-candidate-review.feedback-event-store-review-controls-preview.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";
const minimalSmokePath = "scripts/smoke-feedback-event-store-minimal-v0-1.mjs";
const operatorDecisionSmokePath =
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs";
const foldedAuditPanelSmokePath =
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs";
const previewBuilderSmokePath =
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs";
const substrateSmokePath = "scripts/smoke-agent-perspective-substrate-v0-1.mjs";
const smokePath = "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs";
const routeContractTypePath = "types/feedback-event-write-route-contract.ts";
const routeContractBuilderPath =
  "lib/research-candidate-review/feedback-event-write-route-contract.ts";
const routeContractFixturePath =
  "fixtures/research-candidate-review.feedback-event-write-route-contract.sample.v0.1.json";
const routeContractSmokePath =
  "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs";
const routeImplementationRouteFilePath =
  "app/api/research-candidate/feedback-events/route.ts";
const routeImplementationFixturePath =
  "fixtures/research-candidate-review.feedback-event-write-route-implementation.sample.v0.1.json";
const routeImplementationSmokePath =
  "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs";
const browserValidationFixturePath =
  "fixtures/research-candidate-review.feedback-event-write-route-browser-validation.sample.v0.1.json";
const browserValidationSmokePath =
  "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs";
const uiContractTypePath = "types/feedback-event-controls-ui-contract.ts";
const uiContractBuilderPath =
  "lib/research-candidate-review/feedback-event-controls-ui-contract.ts";
const uiContractFixturePath =
  "fixtures/research-candidate-review.feedback-event-controls-ui-contract.sample.v0.1.json";
const uiContractSmokePath =
  "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs";
const uiImplementationComponentPath = "components/feedback-event-controls.tsx";
const foldedAuditPanelComponentPath =
  "components/agent-perspective-substrate-folded-audit-panel.tsx";
const uiImplementationFixturePath =
  "fixtures/research-candidate-review.feedback-event-controls-ui-implementation.sample.v0.1.json";
const uiImplementationSmokePath =
  "scripts/smoke-feedback-event-controls-ui-implementation-v0-1.mjs";
const uiBrowserValidationFixturePath =
  "fixtures/research-candidate-review.feedback-event-controls-ui-browser-validation.sample.v0.1.json";
const uiBrowserValidationSmokePath =
  "scripts/smoke-feedback-event-controls-ui-browser-validation-v0-1.mjs";
const listRouteContractTypePath =
  "types/feedback-event-store-list-route-contract.ts";
const listRouteContractBuilderPath =
  "lib/research-candidate-review/feedback-event-store-list-route-contract.ts";
const listRouteContractFixturePath =
  "fixtures/research-candidate-review.feedback-event-store-list-route-contract.sample.v0.1.json";
const listRouteContractSmokePath =
  "scripts/smoke-feedback-event-store-list-route-contract-v0-1.mjs";
const listRouteImplementationFixturePath =
  "fixtures/research-candidate-review.feedback-event-store-list-route-implementation.sample.v0.1.json";
const listRouteImplementationSmokePath =
  "scripts/smoke-feedback-event-store-list-route-implementation-v0-1.mjs";
const listRouteBrowserValidationFixturePath =
  "fixtures/research-candidate-review.feedback-event-store-list-route-browser-validation.sample.v0.1.json";
const listRouteBrowserValidationSmokePath =
  "scripts/smoke-feedback-event-store-list-route-browser-validation-v0-1.mjs";
const listUiContractTypePath =
  "types/feedback-event-store-list-ui-contract.ts";
const listUiContractBuilderPath =
  "lib/research-candidate-review/feedback-event-store-list-ui-contract.ts";
const listUiContractFixturePath =
  "fixtures/research-candidate-review.feedback-event-store-list-ui-contract.sample.v0.1.json";
const listUiContractSmokePath =
  "scripts/smoke-feedback-event-store-list-ui-contract-v0-1.mjs";
const listUiImplementationComponentPath =
  "components/feedback-event-store-list-panel.tsx";
const listUiImplementationFixturePath =
  "fixtures/research-candidate-review.feedback-event-store-list-ui-implementation.sample.v0.1.json";
const listUiImplementationSmokePath =
  "scripts/smoke-feedback-event-store-list-ui-implementation-v0-1.mjs";
const listUiBrowserValidationFixturePath =
  "fixtures/research-candidate-review.feedback-event-store-list-ui-browser-validation.sample.v0.1.json";
const listUiBrowserValidationSmokePath =
  "scripts/smoke-feedback-event-store-list-ui-browser-validation-v0-1.mjs";
const aggregationReadModelContractTypePath =
  "types/feedback-event-aggregation-read-model-contract.ts";
const aggregationReadModelContractFixturePath =
  "fixtures/research-candidate-review.feedback-event-aggregation-read-model-contract.sample.v0.1.json";
const aggregationReadModelContractSmokePath =
  "scripts/smoke-feedback-event-aggregation-read-model-contract-v0-1.mjs";
const aggregationReadModelImplementationBuilderPath =
  "lib/research-candidate-review/feedback-event-aggregation-read-model.ts";
const aggregationReadModelImplementationFixturePath =
  "fixtures/research-candidate-review.feedback-event-aggregation-read-model-implementation.sample.v0.1.json";
const aggregationReadModelImplementationSmokePath =
  "scripts/smoke-feedback-event-aggregation-read-model-implementation-v0-1.mjs";
const aggregationReadModelBrowserValidationFixturePath =
  "fixtures/research-candidate-review.feedback-event-aggregation-read-model-browser-validation.sample.v0.1.json";
const aggregationReadModelBrowserValidationSmokePath =
  "scripts/smoke-feedback-event-aggregation-read-model-browser-validation-v0-1.mjs";
const formationReceiptDurableEventContractTypePath =
  "types/formation-receipt-durable-event-contract.ts";
const formationReceiptDurableEventContractFixturePath =
  "fixtures/research-candidate-review.formation-receipt-durable-event-contract.sample.v0.1.json";
const formationReceiptDurableEventContractSmokePath =
  "scripts/smoke-formation-receipt-durable-event-contract-v0-1.mjs";

const recentRehearsalBufferContractPackageScriptName =
  "smoke:recent-rehearsal-buffer-contract-v0-1";
const recentRehearsalBufferContractPackageScriptValue =
  "node scripts/smoke-recent-rehearsal-buffer-contract-v0-1.mjs";
const recentRehearsalBufferImplementationPackageScriptName =
  "smoke:recent-rehearsal-buffer-implementation-v0-1";
const recentRehearsalBufferImplementationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-recent-rehearsal-buffer-implementation-v0-1.mjs";
const packageScriptName =
  "smoke:feedback-event-store-review-controls-preview-v0-1";
const packageScriptValue = `node ${smokePath}`;
const routeContractPackageScriptName =
  "smoke:feedback-event-write-route-contract-v0-1";
const routeContractPackageScriptValue = `node ${routeContractSmokePath}`;
const routeImplementationPackageScriptName =
  "smoke:feedback-event-write-route-implementation-v0-1";
const routeImplementationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs";
const browserValidationPackageScriptName =
  "smoke:feedback-event-write-route-browser-validation-v0-1";
const browserValidationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs";
const uiContractPackageScriptName = "smoke:feedback-event-controls-ui-contract-v0-1";
const uiContractPackageScriptValue =
  "node scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs";
const uiImplementationPackageScriptName =
  "smoke:feedback-event-controls-ui-implementation-v0-1";
const uiImplementationPackageScriptValue =
  "node scripts/smoke-feedback-event-controls-ui-implementation-v0-1.mjs";
const uiBrowserValidationPackageScriptName =
  "smoke:feedback-event-controls-ui-browser-validation-v0-1";
const uiBrowserValidationPackageScriptValue =
  "node scripts/smoke-feedback-event-controls-ui-browser-validation-v0-1.mjs";
const listRouteContractPackageScriptName =
  "smoke:feedback-event-store-list-route-contract-v0-1";
const listRouteContractPackageScriptValue =
  "node scripts/smoke-feedback-event-store-list-route-contract-v0-1.mjs";
const listRouteImplementationPackageScriptName =
  "smoke:feedback-event-store-list-route-implementation-v0-1";
const listRouteImplementationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-feedback-event-store-list-route-implementation-v0-1.mjs";
const listRouteBrowserValidationPackageScriptName =
  "smoke:feedback-event-store-list-route-browser-validation-v0-1";
const listRouteBrowserValidationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-feedback-event-store-list-route-browser-validation-v0-1.mjs";
const listUiContractPackageScriptName =
  "smoke:feedback-event-store-list-ui-contract-v0-1";
const listUiContractPackageScriptValue =
  "node scripts/smoke-feedback-event-store-list-ui-contract-v0-1.mjs";
const listUiImplementationPackageScriptName =
  "smoke:feedback-event-store-list-ui-implementation-v0-1";
const listUiImplementationPackageScriptValue =
  "node scripts/smoke-feedback-event-store-list-ui-implementation-v0-1.mjs";
const listUiBrowserValidationPackageScriptName =
  "smoke:feedback-event-store-list-ui-browser-validation-v0-1";
const listUiBrowserValidationPackageScriptValue =
  "node scripts/smoke-feedback-event-store-list-ui-browser-validation-v0-1.mjs";
const aggregationReadModelContractPackageScriptName =
  "smoke:feedback-event-aggregation-read-model-contract-v0-1";
const aggregationReadModelContractPackageScriptValue =
  "node scripts/smoke-feedback-event-aggregation-read-model-contract-v0-1.mjs";
const aggregationReadModelImplementationPackageScriptName =
  "smoke:feedback-event-aggregation-read-model-implementation-v0-1";
const aggregationReadModelImplementationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-feedback-event-aggregation-read-model-implementation-v0-1.mjs";
const aggregationReadModelBrowserValidationPackageScriptName =
  "smoke:feedback-event-aggregation-read-model-browser-validation-v0-1";
const aggregationReadModelBrowserValidationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-feedback-event-aggregation-read-model-browser-validation-v0-1.mjs";
const formationReceiptDurableEventContractPackageScriptName =
  "smoke:formation-receipt-durable-event-contract-v0-1";
const formationReceiptDurableEventContractPackageScriptValue =
  "node scripts/smoke-formation-receipt-durable-event-contract-v0-1.mjs";
const formationReceiptDurableEventImplementationPackageScriptName =
  "smoke:formation-receipt-durable-event-implementation-v0-1";
const formationReceiptDurableEventImplementationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-formation-receipt-durable-event-implementation-v0-1.mjs";
const formationReceiptDurableEventBrowserValidationPackageScriptName =
  "smoke:formation-receipt-durable-event-browser-validation-v0-1";
const formationReceiptDurableEventBrowserValidationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-formation-receipt-durable-event-browser-validation-v0-1.mjs";
const formationReceiptDurableEventContractChangedFiles = [
  "types/formation-receipt-durable-event-contract.ts",
  "fixtures/research-candidate-review.formation-receipt-durable-event-contract.sample.v0.1.json",
  "scripts/smoke-formation-receipt-durable-event-contract-v0-1.mjs",
  "package.json",
  "docs/00_INDEX_LATEST.md",
  "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
  "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
  "scripts/smoke-feedback-event-aggregation-read-model-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
  "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
];

const recentRehearsalBufferContractChangedFiles = [
  "types/recent-rehearsal-buffer-contract.ts",
  "fixtures/research-candidate-review.recent-rehearsal-buffer-contract.sample.v0.1.json",
  "scripts/smoke-recent-rehearsal-buffer-contract-v0-1.mjs",
  "package.json",
  "docs/00_INDEX_LATEST.md",
  "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
  "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
  "scripts/smoke-formation-receipt-durable-event-browser-validation-v0-1.mjs",
  "scripts/smoke-formation-receipt-durable-event-implementation-v0-1.mjs",
  "scripts/smoke-formation-receipt-durable-event-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
  "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
];

const recentRehearsalBufferImplementationChangedFiles = [
  "lib/research-candidate-review/recent-rehearsal-buffer.ts",
  "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
  "scripts/smoke-recent-rehearsal-buffer-implementation-v0-1.mjs",
  "package.json",
  "docs/00_INDEX_LATEST.md",
  "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
  "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
  "scripts/smoke-recent-rehearsal-buffer-contract-v0-1.mjs",
  "scripts/smoke-formation-receipt-durable-event-browser-validation-v0-1.mjs",
  "scripts/smoke-formation-receipt-durable-event-implementation-v0-1.mjs",
  "scripts/smoke-formation-receipt-durable-event-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
  "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
];
const formationReceiptDurableEventImplementationChangedFiles = [
  "lib/research-candidate-review/formation-receipt-durable-event.ts",
  "fixtures/research-candidate-review.formation-receipt-durable-event-implementation.sample.v0.1.json",
  "scripts/smoke-formation-receipt-durable-event-implementation-v0-1.mjs",
  "package.json",
  "docs/00_INDEX_LATEST.md",
  "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
  "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
  "scripts/smoke-formation-receipt-durable-event-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
  "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
];
const formationReceiptDurableEventBrowserValidationChangedFiles = [
  "fixtures/research-candidate-review.formation-receipt-durable-event-browser-validation.sample.v0.1.json",
  "scripts/smoke-formation-receipt-durable-event-browser-validation-v0-1.mjs",
  "package.json",
  "docs/00_INDEX_LATEST.md",
  "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
  "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
  "scripts/smoke-formation-receipt-durable-event-implementation-v0-1.mjs",
  "scripts/smoke-formation-receipt-durable-event-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
  "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
];
const aggregationReadModelImplementationChangedFiles = [
  "lib/research-candidate-review/feedback-event-aggregation-read-model.ts",
  "fixtures/research-candidate-review.feedback-event-aggregation-read-model-implementation.sample.v0.1.json",
  "scripts/smoke-feedback-event-aggregation-read-model-implementation-v0-1.mjs",
  "package.json",
  "docs/00_INDEX_LATEST.md",
  "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
  "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
  "scripts/smoke-feedback-event-aggregation-read-model-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
  "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
];
const aggregationReadModelBrowserValidationChangedFiles = [
  "fixtures/research-candidate-review.feedback-event-aggregation-read-model-browser-validation.sample.v0.1.json",
  "scripts/smoke-feedback-event-aggregation-read-model-browser-validation-v0-1.mjs",
  "package.json",
  "docs/00_INDEX_LATEST.md",
  "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
  "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
  "scripts/smoke-feedback-event-aggregation-read-model-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
  "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
];

const recommendationStatus = "ready_for_feedback_event_write_route_contract_v0_1";
const nextRecommendedSlice = "feedback_event_write_route_contract_v0_1";
const routeContractRecommendationStatus =
  "ready_for_feedback_event_write_route_implementation_v0_1";
const routeContractNextRecommendedSlice =
  "feedback_event_write_route_implementation_v0_1";
const routeImplementationRecommendationStatus =
  "ready_for_feedback_event_write_route_browser_validation_v0_1";
const routeImplementationNextRecommendedSlice =
  "feedback_event_write_route_browser_validation_v0_1";
const browserValidationRecommendationStatus =
  "ready_for_feedback_event_controls_ui_contract_v0_1";
const browserValidationNextRecommendedSlice =
  "feedback_event_controls_ui_contract_v0_1";
const uiContractRecommendationStatus =
  "ready_for_feedback_event_controls_ui_implementation_v0_1";
const uiContractNextRecommendedSlice =
  "feedback_event_controls_ui_implementation_v0_1";
const uiImplementationRecommendationStatus =
  "ready_for_feedback_event_controls_ui_browser_validation_v0_1";
const uiImplementationNextRecommendedSlice =
  "feedback_event_controls_ui_browser_validation_v0_1";
const uiBrowserValidationRecommendationStatus =
  "ready_for_feedback_event_store_list_route_contract_v0_1";
const uiBrowserValidationNextRecommendedSlice =
  "feedback_event_store_list_route_contract_v0_1";
const listRouteContractRecommendationStatus =
  "ready_for_feedback_event_store_list_route_implementation_v0_1";
const listRouteContractNextRecommendedSlice =
  "feedback_event_store_list_route_implementation_v0_1";
const listRouteImplementationRecommendationStatus =
  "ready_for_feedback_event_store_list_route_browser_validation_v0_1";
const listRouteImplementationNextRecommendedSlice =
  "feedback_event_store_list_route_browser_validation_v0_1";
const listRouteBrowserValidationRecommendationStatus =
  "ready_for_feedback_event_store_list_ui_contract_v0_1";
const listRouteBrowserValidationNextRecommendedSlice =
  "feedback_event_store_list_ui_contract_v0_1";
const listUiContractRecommendationStatus =
  "ready_for_feedback_event_store_list_ui_implementation_v0_1";
const listUiContractNextRecommendedSlice =
  "feedback_event_store_list_ui_implementation_v0_1";
const listUiImplementationRecommendationStatus =
  "ready_for_feedback_event_store_list_ui_browser_validation_v0_1";
const listUiImplementationNextRecommendedSlice =
  "feedback_event_store_list_ui_browser_validation_v0_1";
const listUiBrowserValidationRecommendationStatus =
  "ready_for_feedback_event_aggregation_read_model_contract_v0_1";
const listUiBrowserValidationNextRecommendedSlice =
  "feedback_event_aggregation_read_model_contract_v0_1";
const aggregationReadModelContractRecommendationStatus =
  "ready_for_feedback_event_aggregation_read_model_implementation_v0_1";
const aggregationReadModelContractNextRecommendedSlice =
  "feedback_event_aggregation_read_model_implementation_v0_1";
const aggregationReadModelImplementationRecommendationStatus =
  "ready_for_feedback_event_aggregation_read_model_browser_validation_v0_1";
const aggregationReadModelImplementationNextRecommendedSlice =
  "feedback_event_aggregation_read_model_browser_validation_v0_1";
const requiredControlKinds = [
  "dismiss_preview",
  "pin_preview",
  "correct_preview",
  "invalidate_preview",
];
const repoLocalSourceRefPrefixes = [
  "fixtures/",
  "components/",
  "docs/",
  "types/",
  "lib/",
  "scripts/",
];
const allowedExternalLineageSourceRefs = new Set(["pr:686"]);
const requiredChangedFiles = [
  typePath,
  builderPath,
  previewFixturePath,
  smokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  minimalSmokePath,
];
const allowedChangedFiles = [
  ...requiredChangedFiles,
  operatorDecisionSmokePath,
  foldedAuditPanelSmokePath,
  previewBuilderSmokePath,
  substrateSmokePath,
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
];
const downstreamRouteContractRequiredChangedFiles = [
  routeContractTypePath,
  routeContractBuilderPath,
  routeContractFixturePath,
  routeContractSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  smokePath,
];
const downstreamRouteContractAllowedChangedFiles = [
  ...downstreamRouteContractRequiredChangedFiles,
  minimalSmokePath,
  operatorDecisionSmokePath,
  foldedAuditPanelSmokePath,
  previewBuilderSmokePath,
  substrateSmokePath,
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
];
const downstreamRouteImplementationRequiredChangedFiles = [
  routeImplementationRouteFilePath,
  routeImplementationFixturePath,
  routeImplementationSmokePath,
  routeContractSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  smokePath,
];
const downstreamRouteImplementationAllowedChangedFiles = [
  ...downstreamRouteImplementationRequiredChangedFiles,
  minimalSmokePath,
  operatorDecisionSmokePath,
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  foldedAuditPanelSmokePath,
  previewBuilderSmokePath,
  substrateSmokePath,
  "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-v0-1.mjs",
  "scripts/smoke-research-candidate-canonical-promotion-gates-v0-1.mjs",
  "scripts/smoke-research-candidate-review-types-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
];
const downstreamBrowserValidationRequiredChangedFiles = [
  browserValidationFixturePath,
  browserValidationSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  routeImplementationSmokePath,
  routeContractSmokePath,
  smokePath,
  minimalSmokePath,
  foldedAuditPanelSmokePath,
  previewBuilderSmokePath,
  substrateSmokePath,
  "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
];
const downstreamBrowserValidationAllowedChangedFiles = [
  ...downstreamBrowserValidationRequiredChangedFiles,
  operatorDecisionSmokePath,
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  "scripts/smoke-research-candidate-review-manual-parser-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
];
const downstreamUiContractRequiredChangedFiles = [
  uiContractTypePath,
  uiContractBuilderPath,
  uiContractFixturePath,
  uiContractSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  browserValidationSmokePath,
  routeImplementationSmokePath,
  routeContractSmokePath,
  smokePath,
  minimalSmokePath,
  operatorDecisionSmokePath,
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  foldedAuditPanelSmokePath,
  previewBuilderSmokePath,
  substrateSmokePath,
  "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
];
const downstreamUiContractAllowedChangedFiles = [
  ...downstreamUiContractRequiredChangedFiles,
  minimalSmokePath,
  operatorDecisionSmokePath,
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  foldedAuditPanelSmokePath,
  previewBuilderSmokePath,
  substrateSmokePath,
  "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
];
const downstreamUiImplementationRequiredChangedFiles = [
  uiImplementationComponentPath,
  foldedAuditPanelComponentPath,
  uiImplementationFixturePath,
  uiImplementationSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  uiContractSmokePath,
  browserValidationSmokePath,
  routeImplementationSmokePath,
  routeContractSmokePath,
  smokePath,
];
const downstreamUiImplementationAllowedChangedFiles = [
  ...downstreamUiImplementationRequiredChangedFiles,
  routeContractSmokePath,
  minimalSmokePath,
  operatorDecisionSmokePath,
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  foldedAuditPanelSmokePath,
  previewBuilderSmokePath,
  substrateSmokePath,
  "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
];
const downstreamUiBrowserValidationChangedFiles = [
  uiBrowserValidationSmokePath,
  uiBrowserValidationFixturePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  uiImplementationSmokePath,
  uiContractSmokePath,
  browserValidationSmokePath,
  routeImplementationSmokePath,
  routeContractSmokePath,
  smokePath,
  minimalSmokePath,
  operatorDecisionSmokePath,
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  foldedAuditPanelSmokePath,
  previewBuilderSmokePath,
  substrateSmokePath,
  "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
];
const downstreamListRouteContractChangedFiles = [
  listRouteContractTypePath,
  listRouteContractBuilderPath,
  listRouteContractFixturePath,
  listRouteContractSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  uiBrowserValidationSmokePath,
  uiImplementationSmokePath,
  uiContractSmokePath,
  browserValidationSmokePath,
  routeImplementationSmokePath,
  routeContractSmokePath,
  smokePath,
  minimalSmokePath,
  operatorDecisionSmokePath,
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  foldedAuditPanelSmokePath,
  previewBuilderSmokePath,
  substrateSmokePath,
  "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
];
const downstreamListRouteImplementationChangedFiles = [
  routeImplementationRouteFilePath,
  listRouteImplementationFixturePath,
  listRouteImplementationSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  listRouteContractSmokePath,
  uiBrowserValidationSmokePath,
  uiImplementationSmokePath,
  uiContractSmokePath,
  browserValidationSmokePath,
  routeImplementationSmokePath,
  routeContractSmokePath,
  smokePath,
  minimalSmokePath,
  operatorDecisionSmokePath,
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  foldedAuditPanelSmokePath,
  previewBuilderSmokePath,
  substrateSmokePath,
  "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
];
const downstreamListRouteBrowserValidationChangedFiles = [
  listRouteBrowserValidationSmokePath,
  listRouteBrowserValidationFixturePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  listRouteImplementationSmokePath,
  listRouteContractSmokePath,
  uiBrowserValidationSmokePath,
  uiImplementationSmokePath,
  uiContractSmokePath,
  browserValidationSmokePath,
  routeImplementationSmokePath,
  routeContractSmokePath,
  smokePath,
  minimalSmokePath,
  operatorDecisionSmokePath,
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  foldedAuditPanelSmokePath,
  previewBuilderSmokePath,
  substrateSmokePath,
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
];
const downstreamListUiContractChangedFiles = [
  listUiContractTypePath,
  listUiContractBuilderPath,
  listUiContractFixturePath,
  listUiContractSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  listRouteBrowserValidationSmokePath,
  listRouteImplementationSmokePath,
  listRouteContractSmokePath,
  uiBrowserValidationSmokePath,
  uiImplementationSmokePath,
  uiContractSmokePath,
  browserValidationSmokePath,
  routeImplementationSmokePath,
  routeContractSmokePath,
  smokePath,
  minimalSmokePath,
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
];
const downstreamListUiImplementationChangedFiles = [
  listUiImplementationComponentPath,
  foldedAuditPanelComponentPath,
  listUiImplementationFixturePath,
  listUiImplementationSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  listUiContractSmokePath,
  listRouteBrowserValidationSmokePath,
  listRouteImplementationSmokePath,
  listRouteContractSmokePath,
  uiImplementationSmokePath,
  uiBrowserValidationSmokePath,
  uiContractSmokePath,
  browserValidationSmokePath,
  routeImplementationSmokePath,
  routeContractSmokePath,
  minimalSmokePath,
  smokePath,
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
];
const downstreamListUiBrowserValidationChangedFiles = [
  listUiBrowserValidationFixturePath,
  listUiBrowserValidationSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  listUiImplementationSmokePath,
  listUiContractSmokePath,
  listRouteBrowserValidationSmokePath,
  listRouteImplementationSmokePath,
  listRouteContractSmokePath,
  uiBrowserValidationSmokePath,
  uiImplementationSmokePath,
  uiContractSmokePath,
  browserValidationSmokePath,
  routeImplementationSmokePath,
  routeContractSmokePath,
  smokePath,
  minimalSmokePath,
];
const downstreamAggregationReadModelContractChangedFiles = [
  aggregationReadModelContractTypePath,
  aggregationReadModelContractFixturePath,
  aggregationReadModelContractSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  listUiBrowserValidationSmokePath,
  listUiImplementationSmokePath,
  listUiContractSmokePath,
  listRouteBrowserValidationSmokePath,
  listRouteImplementationSmokePath,
  listRouteContractSmokePath,
  uiBrowserValidationSmokePath,
  uiImplementationSmokePath,
  uiContractSmokePath,
  browserValidationSmokePath,
  routeImplementationSmokePath,
  routeContractSmokePath,
  smokePath,
  minimalSmokePath,
];

for (const filePath of [
  typePath,
  builderPath,
  sourceFeedbackFixturePath,
  substratePreviewFixturePath,
  handoffDraftReviewFixturePath,
  operatorDecisionFixturePath,
  previewFixturePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  minimalSmokePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const typeSource = readFileSync(typePath, "utf8");
const builderSource = readFileSync(builderPath, "utf8");
const smokeSource = readFileSync(smokePath, "utf8");
const sourceFeedbackFixture = readJson(sourceFeedbackFixturePath);
const substratePreviewFixture = readJson(substratePreviewFixturePath);
const handoffDraftReviewFixture = readJson(handoffDraftReviewFixturePath);
const operatorDecisionFixture = readJson(operatorDecisionFixturePath);
const previewFixture = readJson(previewFixturePath);
const packageJson = readJson(packagePath);
const indexDoc = readFileSync(indexPath, "utf8");
const substrateDoc = readFileSync(substrateDocPath, "utf8");
const surfaceDoc = readFileSync(surfaceDocPath, "utf8");
const gateDoc = readFileSync(gateDocPath, "utf8");
const minimalSmokeSource = readFileSync(minimalSmokePath, "utf8");

assertTypeAndBuilderContracts();
assertPackageScript();
assertStaticBoundary();
assertNoForbiddenImplementationPatterns();
assertDocsPointers();
assertMinimalSmokeDownstreamPointer();
assertRouteContractDownstreamPointer();
assertRouteImplementationDownstreamPointer();
assertBrowserValidationDownstreamPointer();
assertUiContractDownstreamPointer();
assertUiImplementationDownstreamPointer();
assertUiBrowserValidationDownstreamPointer();
assertListRouteContractDownstreamPointer();
assertListRouteImplementationDownstreamPointer();
assertListRouteBrowserValidationDownstreamPointer();
assertListUiContractDownstreamPointer();
assertListUiImplementationDownstreamPointer();
assertListUiBrowserValidationDownstreamPointer();

const builderModule = await importBuilderModule();
const rebuiltPreview = builderModule.buildFeedbackEventStoreReviewControlsPreview(
  buildPreviewInput(),
);
const rebuiltPreviewAgain = builderModule.buildFeedbackEventStoreReviewControlsPreview(
  buildPreviewInput(),
);

assert.deepEqual(
  rebuiltPreview,
  previewFixture,
  "rebuilt review controls preview must match committed fixture",
);
assert.equal(
  rebuiltPreview.preview_fingerprint,
  rebuiltPreviewAgain.preview_fingerprint,
  "review controls preview fingerprint must be stable across repeated builds",
);

assertPreview(previewFixture, builderModule);

console.log(
  JSON.stringify(
    {
      smoke: "feedback-event-store-review-controls-preview-v0-1",
      final_status: "pass",
      preview_fingerprint: previewFixture.preview_fingerprint,
      control_count: previewFixture.controls.length,
      event_preview_count: previewFixture.event_previews.length,
      next_recommended_slice: previewFixture.next_recommended_slice,
      checked_no_db_open: true,
      checked_no_feedback_persistence_from_controls: true,
      checked_product_write_lane_parked: true,
    },
    null,
    2,
  ),
);

function assertTypeAndBuilderContracts() {
  for (const exportName of [
    "FeedbackEventStoreReviewControlsPreview",
    "FeedbackEventStoreReviewControlsPreviewInput",
    "FeedbackEventStoreReviewControl",
    "FeedbackEventStoreReviewControlKind",
    "FeedbackEventStoreReviewControlTarget",
    "FeedbackEventStoreReviewControlEventPreview",
    "FeedbackEventStoreReviewControlsAuthorityBoundary",
    "FeedbackEventStoreReviewControlsValidationResult",
  ]) {
    assert.match(
      typeSource,
      new RegExp(`export\\s+(interface|type)\\s+${escapeRegExp(exportName)}\\b`),
      `type file must export ${exportName}`,
    );
  }
  for (const exportName of [
    "buildFeedbackEventStoreReviewControlsPreview",
    "validateFeedbackEventStoreReviewControlsPreview",
    "createFeedbackEventStoreReviewControlsPreviewFingerprint",
  ]) {
    assert.match(
      builderSource,
      new RegExp(`export\\s+function\\s+${escapeRegExp(exportName)}\\b`),
      `builder must export ${exportName}`,
    );
  }
  for (const requiredText of [
    "feedback_event_store_review_controls_preview.v0.1",
    recommendationStatus,
    nextRecommendedSlice,
    "preview_only",
    "durable_feedback_event_written_now",
    "route_available_now",
    "server_action_available_now",
    "db_write_available_now",
    "proof_or_evidence_record",
    "perspective_promotion",
    "work_mutation",
    "codex_execution_authority",
    "github_automation_authority",
    "retrieval_rag_authority",
    "source_fetch_authority",
    "product_write_authority",
    "product_id_allocation_authority",
    "product_write_lane_parked_by_686",
  ]) {
    assert.ok(typeSource.includes(requiredText), `type source must include ${requiredText}`);
    assert.ok(
      builderSource.includes(requiredText),
      `builder source must include ${requiredText}`,
    );
  }
  for (const controlKind of requiredControlKinds) {
    assert.ok(typeSource.includes(controlKind), `type source must include ${controlKind}`);
    assert.ok(
      builderSource.includes(controlKind),
      `builder source must include ${controlKind}`,
    );
  }
  assert.doesNotMatch(
    builderSource,
    /^import\s+(?!type\b)/m,
    "builder must keep runtime imports out",
  );
  assert.doesNotMatch(
    builderSource,
    /\b(insertFeedbackEvent|listFeedbackEvents|feedbackEventStoreSchemaSql|feedbackEventStoreTableName)\b/,
    "builder must not call or import DB-backed feedback store helpers",
  );
}

function assertPackageScript() {
  if (salienceGovernorImplementationSliceActive()) {
    assertSalienceGovernorImplementationPackageScript();
    return;
  }
  if (salienceGovernorContractSliceActive()) {
    assertSalienceGovernorContractPackageScript();
    return;
  }
  if (recentRehearsalBufferBrowserValidationSliceActive()) {
    assertRecentRehearsalBufferBrowserValidationPackageScript();
    return;
  }
  if (downstreamAggregationReadModelBrowserValidationSliceActive()) {
    assert.equal(
      packageJson.scripts[aggregationReadModelBrowserValidationPackageScriptName],
      aggregationReadModelBrowserValidationPackageScriptValue,
    );
  }
  assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
  if (downstreamRouteImplementationSliceActive()) {
    assert.equal(
      packageJson.scripts[routeImplementationPackageScriptName],
      routeImplementationPackageScriptValue,
    );
  }
  if (downstreamBrowserValidationSliceActive()) {
    assert.equal(
      packageJson.scripts[browserValidationPackageScriptName],
      browserValidationPackageScriptValue,
    );
  }
  if (downstreamUiContractSliceActive()) {
    assert.equal(
      packageJson.scripts[uiContractPackageScriptName],
      uiContractPackageScriptValue,
    );
  }
  if (downstreamUiImplementationSliceActive()) {
    assert.equal(
      packageJson.scripts[uiImplementationPackageScriptName],
      uiImplementationPackageScriptValue,
    );
  }
  if (downstreamUiBrowserValidationSliceActive()) {
    assert.equal(
      packageJson.scripts[uiBrowserValidationPackageScriptName],
      uiBrowserValidationPackageScriptValue,
    );
  }
  if (downstreamListRouteContractSliceActive()) {
    assert.equal(
      packageJson.scripts[listRouteContractPackageScriptName],
      listRouteContractPackageScriptValue,
    );
  }
  if (downstreamListRouteImplementationSliceActive()) {
    assert.equal(
      packageJson.scripts[listRouteImplementationPackageScriptName],
      listRouteImplementationPackageScriptValue,
    );
  }
  if (downstreamListRouteBrowserValidationSliceActive()) {
    assert.equal(
      packageJson.scripts[listRouteBrowserValidationPackageScriptName],
      listRouteBrowserValidationPackageScriptValue,
    );
  }
  if (downstreamListUiContractSliceActive()) {
    assert.equal(
      packageJson.scripts[listUiContractPackageScriptName],
      listUiContractPackageScriptValue,
    );
  }
  if (downstreamListUiImplementationSliceActive()) {
    assert.equal(
      packageJson.scripts[listUiImplementationPackageScriptName],
      listUiImplementationPackageScriptValue,
    );
  }
  if (downstreamListUiBrowserValidationSliceActive()) {
    assert.equal(
      packageJson.scripts[listUiBrowserValidationPackageScriptName],
      listUiBrowserValidationPackageScriptValue,
    );
  }
  if (downstreamAggregationReadModelImplementationSliceActive()) {
    assert.equal(
      packageJson.scripts[aggregationReadModelImplementationPackageScriptName],
      aggregationReadModelImplementationPackageScriptValue,
    );
  }
  if (downstreamAggregationReadModelContractSliceActive()) {
    assert.equal(
      packageJson.scripts[aggregationReadModelContractPackageScriptName],
      aggregationReadModelContractPackageScriptValue,
    );
  }
  if (downstreamRouteContractSliceActive()) {
    assert.equal(
      packageJson.scripts[routeContractPackageScriptName],
      routeContractPackageScriptValue,
    );
  }
  const packageAddedLines = readGitOutput([
    "diff",
    "--unified=0",
    mergeBaseRef(),
    "--",
    packagePath,
  ])
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"));
  const addedScriptNames = packageAddedLines
    .map(extractScriptName)
    .filter(Boolean)
    .sort();
  if (recentRehearsalBufferImplementationSliceActive()) {
    assert.equal(
      packageJson.scripts[recentRehearsalBufferImplementationPackageScriptName],
      recentRehearsalBufferImplementationPackageScriptValue,
    );
    assert.deepEqual(
      addedScriptNames,
      [recentRehearsalBufferImplementationPackageScriptName],
      "package.json must add only the Recent Rehearsal Buffer implementation smoke script",
    );
    assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
    assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
    assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
    return;
  }
  if (recentRehearsalBufferContractSliceActive()) {
    assert.equal(
      packageJson.scripts[recentRehearsalBufferContractPackageScriptName],
      recentRehearsalBufferContractPackageScriptValue,
    );
    assert.deepEqual(
      addedScriptNames,
      [recentRehearsalBufferContractPackageScriptName],
      "package.json must add only the Recent Rehearsal Buffer contract smoke script",
    );
    assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
    assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
    assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
    return;
  }

  if (formationReceiptDurableEventBrowserValidationSliceActive()) {
    assert.equal(
      packageJson.scripts[formationReceiptDurableEventBrowserValidationPackageScriptName],
      formationReceiptDurableEventBrowserValidationPackageScriptValue,
    );
    assert.deepEqual(
      addedScriptNames,
      [formationReceiptDurableEventBrowserValidationPackageScriptName],
      "package additions must only include the Formation Receipt durable event browser validation smoke script",
    );
    assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
    assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
    assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
    return;
  }
  if (formationReceiptDurableEventImplementationSliceActive()) {
    assert.equal(
      packageJson.scripts[formationReceiptDurableEventImplementationPackageScriptName],
      formationReceiptDurableEventImplementationPackageScriptValue,
    );
    assert.deepEqual(
      addedScriptNames,
      [formationReceiptDurableEventImplementationPackageScriptName],
      "package additions must only include the Formation Receipt durable event implementation smoke script",
    );
    assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
    assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
    assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
    return;
  }
  if (formationReceiptDurableEventContractSliceActive()) {
    assert.equal(
      packageJson.scripts[formationReceiptDurableEventContractPackageScriptName],
      formationReceiptDurableEventContractPackageScriptValue,
    );
    assert.deepEqual(
      addedScriptNames,
      [formationReceiptDurableEventContractPackageScriptName],
      "package additions must only include the Formation Receipt durable event contract smoke script",
    );
    assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
    assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
    assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
    return;
  }

  if (downstreamAggregationReadModelBrowserValidationSliceActive()) {
    assert.deepEqual(
      addedScriptNames,
      [aggregationReadModelBrowserValidationPackageScriptName],
      "package additions must only include the aggregation read model browser validation smoke script",
    );
    assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
    assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
    assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
    return;
  }
  const expectedAddedScriptNames = downstreamAggregationReadModelImplementationSliceActive()
    ? [aggregationReadModelImplementationPackageScriptName]
    : downstreamAggregationReadModelContractSliceActive()
    ? [aggregationReadModelContractPackageScriptName]
    : downstreamListUiBrowserValidationSliceActive()
    ? [listUiBrowserValidationPackageScriptName]
    : downstreamListUiImplementationSliceActive()
    ? [listUiImplementationPackageScriptName]
    : downstreamListUiContractSliceActive()
    ? [listUiContractPackageScriptName]
    : downstreamListRouteBrowserValidationSliceActive()
    ? [listRouteBrowserValidationPackageScriptName]
    : downstreamListRouteImplementationSliceActive()
    ? [listRouteImplementationPackageScriptName]
    : downstreamListRouteContractSliceActive()
    ? [listRouteContractPackageScriptName]
    : downstreamUiBrowserValidationSliceActive()
    ? [uiBrowserValidationPackageScriptName]
    : downstreamUiImplementationSliceActive()
    ? [uiImplementationPackageScriptName]
    : downstreamUiContractSliceActive()
    ? [uiContractPackageScriptName]
    : downstreamRouteImplementationSliceActive()
    ? [routeImplementationPackageScriptName]
    : downstreamBrowserValidationSliceActive()
    ? [browserValidationPackageScriptName]
    : downstreamRouteContractSliceActive()
    ? [routeContractPackageScriptName]
    : [packageScriptName];
  assert.deepEqual(
    addedScriptNames,
    expectedAddedScriptNames,
    "package additions must only include the active review controls or route contract smoke script",
  );
  assert.doesNotMatch(
    packageAddedLines.join("\n"),
    /"dependencies"\s*:/,
    "dependencies must not be added",
  );
  assert.doesNotMatch(
    packageAddedLines.join("\n"),
    /"devDependencies"\s*:/,
    "dev dependencies must not be added",
  );
}

function assertStaticBoundary() {
  const changedFiles = readChangedFiles();
  if (salienceGovernorImplementationSliceActive()) {
    assertSalienceGovernorImplementationChangedFiles(changedFiles);
    return;
  }
  if (salienceGovernorContractSliceActive()) {
    assertSalienceGovernorContractChangedFiles(changedFiles);
    return;
  }
  if (recentRehearsalBufferBrowserValidationSliceActive()) {
    assertRecentRehearsalBufferBrowserValidationChangedFiles(changedFiles);
    return;
  }
  if (recentRehearsalBufferImplementationSliceActive()) {
    for (const expectedFile of recentRehearsalBufferImplementationChangedFiles) {
      assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
    }
    for (const changedFile of changedFiles) {
      assert.ok(
        recentRehearsalBufferImplementationChangedFiles.includes(changedFile),
        `unexpected changed file in Recent Rehearsal Buffer implementation downstream slice: ${changedFile}`,
      );
      assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
      assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
      assert.doesNotMatch(changedFile, /^components\//, "must not change components");
      assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
      assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
      assert.doesNotMatch(changedFile, /(^|\/)(provider|retrieval|source-fetch)\b/i);
      assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
    }
    return;
  }
  if (recentRehearsalBufferContractSliceActive()) {
    for (const expectedFile of recentRehearsalBufferContractChangedFiles) {
      assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
    }
    for (const changedFile of changedFiles) {
      assert.ok(
        recentRehearsalBufferContractChangedFiles.includes(changedFile),
        `unexpected changed file in Recent Rehearsal Buffer contract downstream slice: ${changedFile}`,
      );
      assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
      assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
      assert.doesNotMatch(changedFile, /^components\//, "must not change components");
      assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
      assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
      assert.doesNotMatch(changedFile, /(^|\/)(provider|retrieval|source-fetch)\b/i);
      assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
    }
    return;
  }
  if (formationReceiptDurableEventBrowserValidationSliceActive()) {
    for (const expectedFile of formationReceiptDurableEventBrowserValidationChangedFiles) {
      assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
    }
    for (const changedFile of changedFiles) {
      assert.ok(
        formationReceiptDurableEventBrowserValidationChangedFiles.includes(changedFile),
        `unexpected changed file in Formation Receipt durable event browser validation downstream slice: ${changedFile}`,
      );
      assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
      assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
      assert.doesNotMatch(changedFile, /^components\//, "must not change components");
      assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
      assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
      assert.doesNotMatch(changedFile, /(^|\/)(provider|retrieval|source-fetch)\b/i);
      assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
    }
    return;
  }

  if (formationReceiptDurableEventImplementationSliceActive()) {
    for (const expectedFile of formationReceiptDurableEventImplementationChangedFiles) {
      assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
    }
    for (const changedFile of changedFiles) {
      assert.ok(
        formationReceiptDurableEventImplementationChangedFiles.includes(changedFile),
        `unexpected changed file in Formation Receipt durable event implementation downstream slice: ${changedFile}`,
      );
      assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
      assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
      assert.doesNotMatch(changedFile, /^components\//, "must not change components");
      assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
      assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
      assert.doesNotMatch(changedFile, /(^|\/)(provider|retrieval|source-fetch)\b/i);
      assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
    }
    return;
  }

  if (formationReceiptDurableEventContractSliceActive()) {
    for (const expectedFile of formationReceiptDurableEventContractChangedFiles) {
      assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
    }
    for (const changedFile of changedFiles) {
      assert.ok(
        formationReceiptDurableEventContractChangedFiles.includes(changedFile),
        `unexpected changed file in Formation Receipt durable event contract downstream slice: ${changedFile}`,
      );
      assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
      assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
      assert.doesNotMatch(changedFile, /^components\//, "must not change components");
      assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
      assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
      assert.doesNotMatch(changedFile, /(^|\/)(provider|retrieval|source-fetch)\b/i);
      assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
    }
    return;
  }
  const requiredFiles = downstreamAggregationReadModelBrowserValidationSliceActive()
    ? aggregationReadModelBrowserValidationChangedFiles
    : downstreamAggregationReadModelImplementationSliceActive()
    ? aggregationReadModelImplementationChangedFiles
    : downstreamAggregationReadModelContractSliceActive()
    ? downstreamAggregationReadModelContractChangedFiles
    : downstreamListUiBrowserValidationSliceActive()
    ? downstreamListUiBrowserValidationChangedFiles
    : downstreamListUiImplementationSliceActive()
    ? downstreamListUiImplementationChangedFiles
    : downstreamListUiContractSliceActive()
    ? downstreamListUiContractChangedFiles
    : downstreamListRouteBrowserValidationSliceActive()
    ? downstreamListRouteBrowserValidationChangedFiles
    : downstreamListRouteImplementationSliceActive()
    ? downstreamListRouteImplementationChangedFiles
    : downstreamListRouteContractSliceActive()
    ? downstreamListRouteContractChangedFiles
    : downstreamUiBrowserValidationSliceActive()
    ? downstreamUiBrowserValidationChangedFiles
    : downstreamUiImplementationSliceActive()
    ? downstreamUiImplementationRequiredChangedFiles
    : downstreamUiContractSliceActive()
    ? downstreamUiContractRequiredChangedFiles
    : downstreamRouteImplementationSliceActive()
    ? downstreamRouteImplementationRequiredChangedFiles
    : downstreamBrowserValidationSliceActive()
    ? downstreamBrowserValidationRequiredChangedFiles
    : downstreamRouteContractSliceActive()
    ? downstreamRouteContractRequiredChangedFiles
    : requiredChangedFiles;
  const allowedFiles = downstreamAggregationReadModelBrowserValidationSliceActive()
    ? aggregationReadModelBrowserValidationChangedFiles
    : downstreamAggregationReadModelImplementationSliceActive()
    ? aggregationReadModelImplementationChangedFiles
    : downstreamAggregationReadModelContractSliceActive()
    ? downstreamAggregationReadModelContractChangedFiles
    : downstreamListUiBrowserValidationSliceActive()
    ? downstreamListUiBrowserValidationChangedFiles
    : downstreamListUiImplementationSliceActive()
    ? downstreamListUiImplementationChangedFiles
    : downstreamListUiContractSliceActive()
    ? downstreamListUiContractChangedFiles
    : downstreamListRouteBrowserValidationSliceActive()
    ? downstreamListRouteBrowserValidationChangedFiles
    : downstreamListRouteImplementationSliceActive()
    ? downstreamListRouteImplementationChangedFiles
    : downstreamListRouteContractSliceActive()
    ? downstreamListRouteContractChangedFiles
    : downstreamUiBrowserValidationSliceActive()
    ? downstreamUiBrowserValidationChangedFiles
    : downstreamUiImplementationSliceActive()
    ? downstreamUiImplementationAllowedChangedFiles
    : downstreamUiContractSliceActive()
    ? downstreamUiContractAllowedChangedFiles
    : downstreamRouteImplementationSliceActive()
    ? downstreamRouteImplementationAllowedChangedFiles
    : downstreamBrowserValidationSliceActive()
    ? downstreamBrowserValidationAllowedChangedFiles
    : downstreamRouteContractSliceActive()
    ? downstreamRouteContractAllowedChangedFiles
    : allowedChangedFiles;
  for (const expectedFile of requiredFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      allowedFiles.includes(changedFile),
      `unexpected changed file in review controls preview slice: ${changedFile}`,
    );
    if (
      (!downstreamRouteImplementationSliceActive() &&
        !downstreamListRouteImplementationSliceActive() &&
        !downstreamListRouteBrowserValidationSliceActive() &&
        !downstreamListUiContractSliceActive() &&
        !downstreamListUiImplementationSliceActive() &&
        !downstreamListUiBrowserValidationSliceActive() &&
        !downstreamAggregationReadModelContractSliceActive()) ||
      changedFile !== routeImplementationRouteFilePath
    ) {
      assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api files");
    }
    if (downstreamListUiImplementationSliceActive()) {
      if (changedFile.startsWith("components/")) {
        assert.ok(
          [listUiImplementationComponentPath, foldedAuditPanelComponentPath].includes(changedFile),
          `downstream list UI implementation may only change allowed component files: ${changedFile}`,
        );
      }
    } else if (!downstreamUiImplementationSliceActive()) {
      assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    } else if (changedFile.startsWith("components/")) {
      assert.ok(
        [uiImplementationComponentPath, foldedAuditPanelComponentPath].includes(changedFile),
        `downstream UI implementation may only change allowed component files: ${changedFile}`,
      );
    }
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    if (
      changedFile !==
      "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs"
    ) {
      assert.doesNotMatch(
        changedFile,
        /product.*write/i,
        "must not change product write files",
      );
    }
  }
}

function assertNoForbiddenImplementationPatterns() {
  if (downstreamAggregationReadModelContractSliceActive()) return;
  assertNoDbOpenOrWriteHelpers();
  const scannedSources = [
    [typePath, typeSource],
    [builderPath, builderSource],
    [smokePath, stripSmokeAssertionText(smokeSource)],
  ];
  const forbiddenPatterns = [
    pattern(["from ", '"openai"']),
    pattern(["new ", "OpenAI"]),
    pattern(["fetch", "("]),
    pattern(["XMLHttpRequest"]),
    pattern(["WebSocket"]),
    pattern(["EventSource"]),
    pattern(["sendBeacon"]),
    pattern(["localStorage"]),
    pattern(["sessionStorage"]),
    pattern(["indexedDB"]),
    pattern(["document", ".", "cookie"]),
    pattern(["createServer", "("]),
    pattern(["app", ".", "listen", "("]),
    pattern(["next", " ", "dev"]),
    pattern(["api", ".", "github", ".", "com"]),
    pattern(["Octokit"]),
    { label: "gh-pr-command", regex: /\bgh\s+pr\b/i },
    { label: "git-push-command", regex: /\bgit\s+push\b/i },
    { label: "codex-exec-command", regex: /\bcodex\s+exec\b/i },
    { label: "codex-run-command", regex: /\bcodex\s+run\b/i },
    { label: "npm-run-codex-command", regex: /\bnpm\s+run\s+codex\b/i },
    pattern(["executeProductWrite", "("]),
    pattern(["productDbWrite", "("]),
  ];
  for (const [filePath, source] of scannedSources) {
    for (const { label, regex } of forbiddenPatterns) {
      assert.doesNotMatch(source, regex, `${filePath} must not include ${label}`);
    }
  }
}

function assertNoDbOpenOrWriteHelpers() {
  for (const [filePath, source] of [
    [builderPath, builderSource],
    [smokePath, stripSmokeAssertionText(smokeSource)],
  ]) {
    assert.doesNotMatch(
      source,
      /better-sqlite3|new\s+Database|\.exec\(|CREATE\s+TABLE|research_candidate_feedback_events/i,
      `${filePath} must not open or initialize a DB in this preview smoke`,
    );
  }
  assert.doesNotMatch(
    builderSource,
    /\b(insertFeedbackEvent|listFeedbackEvents)\s*\(/,
    "builder must not call DB-backed insert/list helpers",
  );
}

function assertDocsPointers() {
  for (const requiredText of [
    "Feedback Event Store review controls preview v0.1",
    typePath,
    builderPath,
    previewFixturePath,
    smokePath,
    packageScriptName,
    "dismiss_preview",
    "pin_preview",
    "correct_preview",
    "invalidate_preview",
    "preview-only controls",
    "no route/server action/DB write yet",
    "no proof/evidence/Perspective promotion/work mutation",
    "no Codex/GitHub automation/external handoff",
    "no provider/OpenAI/source-fetch/retrieval/RAG execution",
    "no product write/product IDs",
    nextRecommendedSlice,
  ]) {
    assert.ok(indexDoc.includes(requiredText), `index must include ${requiredText}`);
  }
  for (const doc of [substrateDoc, surfaceDoc, gateDoc]) {
    assert.match(doc, /Feedback Event Store review controls preview v0\.1/i);
    assert.match(doc, /event preview/i);
    assert.match(doc, /no feedback is persisted|does not write feedback/i);
    assert.match(doc, /no route\/server action\/DB write/i);
    assert.match(doc, /no provider\/OpenAI/i);
    assert.match(doc, /no source fetch|source-fetch/i);
    assert.match(doc, /no retrieval\/RAG execution/i);
    assert.match(doc, /no Codex execution/i);
    assert.match(doc, /no GitHub automation|no branch\/PR\/GitHub automation/i);
    assert.match(doc, /no product write/i);
    assert.match(doc, /#686/);
    assert.match(doc, new RegExp(nextRecommendedSlice));
  }
}

function assertMinimalSmokeDownstreamPointer() {
  for (const requiredText of [
    packageScriptName,
    nextRecommendedSlice,
    typePath,
    builderPath,
    previewFixturePath,
    smokePath,
    recommendationStatus,
  ]) {
    assert.ok(
      minimalSmokeSource.includes(requiredText),
      `#695 feedback event store smoke must allow ${requiredText}`,
    );
  }
  assert.equal(
    sourceFeedbackFixture.next_recommended_slice,
    "feedback_event_store_review_controls_preview_v0_1",
    "#695 feedback event fixture output must remain unchanged",
  );
}

function assertRouteContractDownstreamPointer() {
  if (!downstreamRouteContractSliceActive()) return;
  for (const requiredText of [
    routeContractPackageScriptName,
    routeContractNextRecommendedSlice,
    routeContractTypePath,
    routeContractBuilderPath,
    routeContractFixturePath,
    routeContractSmokePath,
    routeContractRecommendationStatus,
  ]) {
    assert.ok(
      smokeSource.includes(requiredText),
      `#696 review controls smoke must allow downstream route contract text: ${requiredText}`,
    );
  }
  assert.equal(
    previewFixture.next_recommended_slice,
    nextRecommendedSlice,
    "#696 review controls fixture output must remain unchanged",
  );
}

function assertRouteImplementationDownstreamPointer() {
  if (!downstreamRouteImplementationSliceActive()) return;
  for (const requiredText of [
    routeImplementationPackageScriptName,
    routeImplementationNextRecommendedSlice,
    routeImplementationRouteFilePath,
    routeImplementationFixturePath,
    routeImplementationSmokePath,
    routeImplementationRecommendationStatus,
  ]) {
    assert.ok(
      smokeSource.includes(requiredText),
      `#696 review controls smoke must allow downstream route implementation text: ${requiredText}`,
    );
  }
  assert.equal(
    previewFixture.next_recommended_slice,
    nextRecommendedSlice,
    "#696 review controls fixture output must remain unchanged",
  );
}

function assertBrowserValidationDownstreamPointer() {
  if (!downstreamBrowserValidationSliceActive()) return;
  for (const requiredText of [
    browserValidationPackageScriptName,
    browserValidationNextRecommendedSlice,
    browserValidationFixturePath,
    browserValidationSmokePath,
    browserValidationRecommendationStatus,
  ]) {
    assert.ok(
      smokeSource.includes(requiredText),
      `#696 review controls smoke must allow downstream browser validation text: ${requiredText}`,
    );
  }
  assert.equal(
    previewFixture.next_recommended_slice,
    nextRecommendedSlice,
    "#696 review controls fixture output must remain unchanged",
  );
}

function assertUiContractDownstreamPointer() {
  if (!downstreamUiContractSliceActive()) return;
  for (const requiredText of [
    uiContractPackageScriptName,
    uiContractNextRecommendedSlice,
    uiContractFixturePath,
    uiContractSmokePath,
    uiContractRecommendationStatus,
  ]) {
    assert.ok(
      smokeSource.includes(requiredText),
      `#696 review controls smoke must allow downstream UI contract text: ${requiredText}`,
    );
  }
  assert.equal(
    previewFixture.next_recommended_slice,
    nextRecommendedSlice,
    "#696 review controls fixture output must remain unchanged",
  );
}

function assertUiImplementationDownstreamPointer() {
  if (!downstreamUiImplementationSliceActive()) return;
  for (const requiredText of [
    uiImplementationPackageScriptName,
    uiImplementationNextRecommendedSlice,
    uiImplementationFixturePath,
    uiImplementationSmokePath,
    uiImplementationRecommendationStatus,
  ]) {
    assert.ok(
      smokeSource.includes(requiredText),
      `#696 review controls smoke must allow downstream UI implementation text: ${requiredText}`,
    );
  }
  assert.equal(
    previewFixture.next_recommended_slice,
    nextRecommendedSlice,
    "#696 review controls fixture output must remain unchanged",
  );
}

function assertUiBrowserValidationDownstreamPointer() {
  if (!downstreamUiBrowserValidationSliceActive()) return;
  for (const requiredText of [
    uiBrowserValidationPackageScriptName,
    uiBrowserValidationNextRecommendedSlice,
    uiBrowserValidationFixturePath,
    uiBrowserValidationSmokePath,
    uiBrowserValidationRecommendationStatus,
  ]) {
    assert.ok(
      smokeSource.includes(requiredText),
      `#696 review controls smoke must allow downstream UI browser validation text: ${requiredText}`,
    );
  }
  assert.equal(
    previewFixture.next_recommended_slice,
    nextRecommendedSlice,
    "#696 review controls fixture output must remain unchanged",
  );
}

function assertListRouteContractDownstreamPointer() {
  if (!downstreamListRouteContractSliceActive()) return;
  for (const requiredText of [
    listRouteContractPackageScriptName,
    listRouteContractNextRecommendedSlice,
    listRouteContractTypePath,
    listRouteContractBuilderPath,
    listRouteContractFixturePath,
    listRouteContractSmokePath,
    listRouteContractRecommendationStatus,
  ]) {
    assert.ok(
      smokeSource.includes(requiredText),
      `#696 review controls smoke must allow downstream list route contract text: ${requiredText}`,
    );
  }
  assert.equal(
    previewFixture.next_recommended_slice,
    nextRecommendedSlice,
    "#696 review controls fixture output must remain unchanged",
  );
}

function assertListRouteImplementationDownstreamPointer() {
  if (!downstreamListRouteImplementationSliceActive()) return;
  for (const requiredText of [
    listRouteImplementationPackageScriptName,
    listRouteImplementationNextRecommendedSlice,
    listRouteImplementationFixturePath,
    listRouteImplementationSmokePath,
    listRouteImplementationRecommendationStatus,
  ]) {
    assert.ok(
      smokeSource.includes(requiredText),
      `#696 review controls smoke must allow downstream list route implementation text: ${requiredText}`,
    );
  }
  const listRouteImplementationFixture = readJson(listRouteImplementationFixturePath);
  assert.equal(listRouteImplementationFixture.route_method, "GET");
  assert.equal(listRouteImplementationFixture.route_implemented_now, true);
  assert.equal(listRouteImplementationFixture.get_reads_feedback_events_only, true);
  assert.equal(listRouteImplementationFixture.get_writes_feedback_events_now, false);
  assert.equal(
    listRouteImplementationFixture.recommendation_status,
    listRouteImplementationRecommendationStatus,
  );
  assert.equal(
    listRouteImplementationFixture.next_recommended_slice,
    listRouteImplementationNextRecommendedSlice,
  );
  assert.equal(
    previewFixture.next_recommended_slice,
    nextRecommendedSlice,
    "#696 review controls fixture output must remain unchanged",
  );
}

function assertListRouteBrowserValidationDownstreamPointer() {
  if (!downstreamListRouteBrowserValidationSliceActive()) return;
  for (const requiredText of [
    listRouteBrowserValidationPackageScriptName,
    listRouteBrowserValidationNextRecommendedSlice,
    listRouteBrowserValidationFixturePath,
    listRouteBrowserValidationSmokePath,
    listRouteBrowserValidationRecommendationStatus,
  ]) {
    assert.ok(
      smokeSource.includes(requiredText),
      `#696 review controls smoke must allow downstream list route browser validation text: ${requiredText}`,
    );
  }
  const listRouteBrowserValidationFixture = readJson(
    listRouteBrowserValidationFixturePath,
  );
  assert.equal(
    listRouteBrowserValidationFixture.validation_kind,
    "feedback_event_store_list_route_browser_validation",
  );
  assert.equal(listRouteBrowserValidationFixture.route_method, "GET");
  assert.equal(listRouteBrowserValidationFixture.production_db_used_now, false);
  assert.equal(listRouteBrowserValidationFixture.temp_db_used_now, true);
  assert.equal(listRouteBrowserValidationFixture.runtime_read_executed_now, true);
  assert.equal(listRouteBrowserValidationFixture.runtime_write_executed_now, false);
  assert.equal(listRouteBrowserValidationFixture.no_feedback_write_observed, true);
  assert.equal(listRouteBrowserValidationFixture.no_forbidden_authority_granted, true);
  assert.equal(
    listRouteBrowserValidationFixture.recommendation_status,
    listRouteBrowserValidationRecommendationStatus,
  );
  assert.equal(
    listRouteBrowserValidationFixture.next_recommended_slice,
    listRouteBrowserValidationNextRecommendedSlice,
  );
  assert.equal(
    previewFixture.next_recommended_slice,
    nextRecommendedSlice,
    "#696 review controls fixture output must remain unchanged",
  );
}

function assertListUiContractDownstreamPointer() {
  if (!downstreamListUiContractSliceActive()) return;
  for (const requiredText of [
    listUiContractPackageScriptName,
    listUiContractNextRecommendedSlice,
    listUiContractTypePath,
    listUiContractBuilderPath,
    listUiContractFixturePath,
    listUiContractSmokePath,
    listUiContractRecommendationStatus,
  ]) {
    assert.ok(
      smokeSource.includes(requiredText),
      `#696 review controls smoke must allow downstream list UI contract text: ${requiredText}`,
    );
  }
  const listUiContractFixture = readJson(listUiContractFixturePath);
  assert.equal(
    listUiContractFixture.contract_kind,
    "feedback_event_store_list_ui_contract",
  );
  assert.equal(listUiContractFixture.route_method, "GET");
  assert.equal(listUiContractFixture.ui_implemented_now, false);
  assert.equal(listUiContractFixture.components_changed_now, false);
  assert.equal(listUiContractFixture.route_changed_now, false);
  assert.equal(listUiContractFixture.browser_request_executed_now, false);
  assert.equal(listUiContractFixture.feedback_events_read_now, false);
  assert.equal(listUiContractFixture.feedback_events_written_now, false);
  assert.equal(
    listUiContractFixture.recommendation_status,
    listUiContractRecommendationStatus,
  );
  assert.equal(
    listUiContractFixture.next_recommended_slice,
    listUiContractNextRecommendedSlice,
  );
  assert.equal(
    previewFixture.next_recommended_slice,
    nextRecommendedSlice,
    "#696 review controls fixture output must remain unchanged",
  );
}

function assertListUiImplementationDownstreamPointer() {
  if (!downstreamListUiImplementationSliceActive()) return;
  const listUiImplementationFixture = readJson(listUiImplementationFixturePath);
  assert.equal(
    listUiImplementationFixture.implementation_kind,
    "feedback_event_store_list_ui_implementation",
  );
  assert.equal(listUiImplementationFixture.enabled_panel.route_method, "GET");
  assert.equal(
    listUiImplementationFixture.enabled_panel.feedback_events_written_now,
    false,
  );
  assert.equal(
    listUiImplementationFixture.authority_boundary.route_changed_now,
    false,
  );
  assert.equal(
    listUiImplementationFixture.recommendation_status,
    listUiImplementationRecommendationStatus,
  );
  assert.equal(
    listUiImplementationFixture.next_recommended_slice,
    listUiImplementationNextRecommendedSlice,
  );
  assert.equal(
    previewFixture.next_recommended_slice,
    nextRecommendedSlice,
    "#696 review controls fixture output must remain unchanged",
  );
}

function assertListUiBrowserValidationDownstreamPointer() {
  if (!downstreamListUiBrowserValidationSliceActive()) return;
  const listUiBrowserValidationFixture = readJson(listUiBrowserValidationFixturePath);
  assert.equal(
    listUiBrowserValidationFixture.validation_kind,
    "feedback_event_store_list_ui_browser_validation",
  );
  assert.equal(listUiBrowserValidationFixture.validated_panel.route_method, "GET");
  assert.equal(
    listUiBrowserValidationFixture.validated_panel.default_filter.limit,
    50,
  );
  assert.equal(
    listUiBrowserValidationFixture.validated_panel.default_filter
      .target_kind_default_scoped,
    false,
  );
  assert.equal(
    listUiBrowserValidationFixture.validated_panel.default_filter
      .target_id_default_scoped,
    false,
  );
  assert.equal(
    listUiBrowserValidationFixture.authority_boundary
      .browser_request_executed_in_smoke_now,
    false,
  );
  assert.equal(
    listUiBrowserValidationFixture.authority_boundary.product_write_lane_parked_by_686,
    true,
  );
  assert.equal(
    listUiBrowserValidationFixture.recommendation_status,
    listUiBrowserValidationRecommendationStatus,
  );
  assert.equal(
    listUiBrowserValidationFixture.next_recommended_slice,
    listUiBrowserValidationNextRecommendedSlice,
  );
  assert.equal(
    previewFixture.next_recommended_slice,
    nextRecommendedSlice,
    "#696 review controls fixture output must remain unchanged",
  );
}

function assertPreview(preview, builderModule) {
  assert.equal(preview.preview_kind, "feedback_event_store_review_controls_preview");
  assert.equal(preview.preview_version, "feedback_event_store_review_controls_preview.v0.1");
  assert.equal(preview.source_feedback_event_store_fixture_path, sourceFeedbackFixturePath);
  assert.equal(
    preview.source_feedback_event_store_ref,
    `feedback_event_store.v0.1:${sourceFeedbackFixturePath}`,
  );
  assert.equal(preview.fingerprint_algorithm, "fnv1a32_canonical_json");
  assert.equal(preview.recommendation_status, recommendationStatus);
  assert.equal(preview.next_recommended_slice, nextRecommendedSlice);
  assert.equal(preview.validation.passed, true);
  assert.deepEqual(preview.validation.failure_codes, []);
  assert.match(preview.preview_fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.equal(
    builderModule.validateFeedbackEventStoreReviewControlsPreview(preview).passed,
    true,
    "committed preview must validate",
  );
  assert.equal(preview.controls.length, 4);
  assert.equal(preview.event_previews.length, 4);
  assert.deepEqual(
    preview.controls.map((control) => control.control_kind).sort(),
    requiredControlKinds.sort(),
  );
  assert.deepEqual(
    preview.event_previews.map((eventPreview) => eventPreview.event_type).sort(),
    requiredControlKinds.sort(),
  );
  assertAuthorityBoundary(preview.authority_boundary);
  assertSourceSurfaces(preview.source_surfaces);
  for (const control of preview.controls) {
    assert.equal(control.enabled_now, false, `${control.control_id} must be disabled now`);
    assert.equal(control.preview_only, true, `${control.control_id} must be preview only`);
    assert.equal(control.writes_now, false, `${control.control_id} must not write now`);
    assert.equal(
      control.route_available_now,
      false,
      `${control.control_id} must not expose route now`,
    );
    assert.equal(
      control.server_action_available_now,
      false,
      `${control.control_id} must not expose server action now`,
    );
    assert.equal(
      control.db_write_available_now,
      false,
      `${control.control_id} must not expose DB write now`,
    );
    assert.equal(
      control.durable_feedback_persisted_now,
      false,
      `${control.control_id} must not persist feedback now`,
    );
    assert.equal(control.requires_operator_action, true);
    assert.equal(control.would_create_event_type, control.control_kind);
    assertSourceRefsResolve(
      control.target.source_ref_ids,
      control.target.source_ref_resolution_notes,
    );
  }
  for (const eventPreview of preview.event_previews) {
    assert.equal(eventPreview.inserted_now, false);
    assert.equal(eventPreview.persisted_now, false);
    assert.equal(eventPreview.db_write_now, false);
    assert.equal(eventPreview.valid_feedback_event_shape_now, true);
    assert.match(
      eventPreview.event_preview_id,
      /^feedback_event_review_control_preview:fnv1a32:[0-9a-f]{8}$/,
    );
    assert.match(eventPreview.event_id_preview, /^feedback_event:fnv1a32:[0-9a-f]{8}$/);
    assert.match(
      eventPreview.idempotency_key_preview,
      /^feedback_event_store_idempotency:fnv1a32:[0-9a-f]{8}$/,
    );
    assertSourceRefsResolve(eventPreview.source_ref_ids, [eventPreview.reason_placeholder]);
  }
  const correctPreview = preview.event_previews.find(
    (eventPreview) => eventPreview.event_type === "correct_preview",
  );
  assert.ok(
    correctPreview?.correction_text_placeholder,
    "correct_preview event preview must include correction_text_placeholder",
  );
  assert.deepEqual(
    preview.event_previews.map((eventPreview) => ({
      event_type: eventPreview.event_type,
      inserted_now: eventPreview.inserted_now,
      persisted_now: eventPreview.persisted_now,
      db_write_now: eventPreview.db_write_now,
    })),
    preview.event_previews.map((eventPreview) => ({
      event_type: eventPreview.event_type,
      inserted_now: false,
      persisted_now: false,
      db_write_now: false,
    })),
    "event previews must not be inserted into DB",
  );
}

function assertAuthorityBoundary(boundary) {
  assert.equal(boundary.preview_only, true);
  assert.equal(boundary.product_write_lane_parked_by_686, true);
  for (const forbiddenKey of [
    "durable_feedback_event_written_now",
    "route_available_now",
    "server_action_available_now",
    "db_write_available_now",
    "proof_or_evidence_record",
    "perspective_promotion",
    "work_mutation",
    "execution_authority",
    "codex_execution_authority",
    "github_automation_authority",
    "external_handoff_authority",
    "provider_openai_authority",
    "retrieval_rag_authority",
    "source_fetch_authority",
    "product_write_authority",
    "product_id_allocation_authority",
  ]) {
    assert.equal(boundary[forbiddenKey], false, `${forbiddenKey} must be false`);
  }
}

function assertSourceSurfaces(sourceSurfaces) {
  assert.equal(
    sourceSurfaces.feedback_event_store_minimal.fixture_path,
    sourceFeedbackFixturePath,
  );
  assert.equal(
    sourceSurfaces.feedback_event_store_minimal.next_recommended_slice,
    "feedback_event_store_review_controls_preview_v0_1",
  );
  assert.equal(
    sourceSurfaces.agent_perspective_substrate_preview.fixture_path,
    substratePreviewFixturePath,
  );
  assert.equal(
    sourceSurfaces.candidate_to_codex_handoff_draft_review.fixture_path,
    handoffDraftReviewFixturePath,
  );
  assert.equal(
    sourceSurfaces.candidate_to_codex_handoff_operator_decision_preview.fixture_path,
    operatorDecisionFixturePath,
  );
}

function assertSourceRefsResolve(sourceRefIds, notes) {
  assert.ok(Array.isArray(sourceRefIds), "source_ref_ids must be an array");
  if (sourceRefIds.length === 0) {
    assert.ok(
      notes.some((note) => typeof note === "string" && note.trim().length > 0),
      "empty source refs require explicit notes",
    );
    return;
  }
  for (const sourceRefId of sourceRefIds) {
    if (repoLocalSourceRefPrefixes.some((prefix) => sourceRefId.startsWith(prefix))) {
      const [repoLocalPath] = sourceRefId.split("#");
      assert.ok(
        existsSync(repoLocalPath),
        `source_ref_id must resolve to a committed repo artifact: ${sourceRefId}`,
      );
      continue;
    }
    if (sourceRefId.startsWith("pr:")) {
      assert.ok(
        allowedExternalLineageSourceRefs.has(sourceRefId),
        `external lineage source_ref_id must be allowlisted: ${sourceRefId}`,
      );
      continue;
    }
    assert.fail(`unresolved source_ref_id without allowlist: ${sourceRefId}`);
  }
}

function buildPreviewInput() {
  return {
    sourceFeedbackEventStoreFixture: sourceFeedbackFixture,
    agentPerspectiveSubstratePreview: substratePreviewFixture,
    candidateToCodexHandoffDraftReview: handoffDraftReviewFixture,
    candidateToCodexHandoffOperatorDecisionPreview: operatorDecisionFixture,
    scope: "project:augnes",
    as_of:
      "fixture:research-candidate-review.feedback-event-store-review-controls-preview.sample.v0.1",
  };
}

async function importBuilderModule() {
  const transformedSource = stripTypeScriptTypes(builderSource, {
    mode: "transform",
  });
  return import(
    `data:text/javascript;charset=utf-8,${encodeURIComponent(transformedSource)}`
  );
}



function recentRehearsalBufferImplementationSliceActive() {
  return readChangedFiles().includes("scripts/smoke-recent-rehearsal-buffer-implementation-v0-1.mjs");
}

function recentRehearsalBufferContractSliceActive() {
  return readChangedFiles().includes("scripts/smoke-recent-rehearsal-buffer-contract-v0-1.mjs");
}

function readChangedFiles() {
  const baseRef = mergeBaseRef();
  return [
    ...readGitOutput(["diff", "--name-only", baseRef, "--"]).split("\n"),
    ...readGitOutput(["ls-files", "--others", "--exclude-standard"]).split("\n"),
  ]
    .map((line) => line.trim())
    .filter(Boolean)
    .sort();
}

function downstreamRouteContractSliceActive() {
  const changedFiles = readChangedFiles();
  return downstreamRouteContractRequiredChangedFiles.every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function downstreamRouteImplementationSliceActive() {
  const changedFiles = readChangedFiles();
  return downstreamRouteImplementationRequiredChangedFiles.every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function downstreamBrowserValidationSliceActive() {
  const changedFiles = readChangedFiles();
  return [browserValidationFixturePath, browserValidationSmokePath].every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function downstreamUiContractSliceActive() {
  const changedFiles = readChangedFiles();
  return [uiContractFixturePath, uiContractSmokePath].every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function downstreamUiImplementationSliceActive() {
  const changedFiles = readChangedFiles();
  return downstreamUiImplementationRequiredChangedFiles.every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function downstreamUiBrowserValidationSliceActive() {
  const changedFiles = readChangedFiles();
  return downstreamUiBrowserValidationChangedFiles.every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function downstreamListRouteContractSliceActive() {
  const changedFiles = readChangedFiles();
  return [
    listRouteContractTypePath,
    listRouteContractBuilderPath,
    listRouteContractFixturePath,
    listRouteContractSmokePath,
  ].every((filePath) => changedFiles.includes(filePath));
}

function downstreamListRouteImplementationSliceActive() {
  const changedFiles = readChangedFiles();
  return downstreamListRouteImplementationChangedFiles.every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function downstreamListRouteBrowserValidationSliceActive() {
  const changedFiles = readChangedFiles();
  return downstreamListRouteBrowserValidationChangedFiles.every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function downstreamListUiContractSliceActive() {
  const changedFiles = readChangedFiles();
  return downstreamListUiContractChangedFiles.every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function downstreamListUiImplementationSliceActive() {
  const changedFiles = readChangedFiles();
  return downstreamListUiImplementationChangedFiles.every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function downstreamListUiBrowserValidationSliceActive() {
  const changedFiles = readChangedFiles();
  return downstreamListUiBrowserValidationChangedFiles.every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function downstreamAggregationReadModelBrowserValidationSliceActive() {
  return readChangedFiles().includes(aggregationReadModelBrowserValidationSmokePath);
}

function downstreamAggregationReadModelImplementationSliceActive() {
  return readChangedFiles().includes(aggregationReadModelImplementationSmokePath);
}

function downstreamAggregationReadModelContractSliceActive() {
  return readChangedFiles().includes(aggregationReadModelContractSmokePath);
}

function formationReceiptDurableEventBrowserValidationSliceActive() {
  return readChangedFiles().includes("scripts/smoke-formation-receipt-durable-event-browser-validation-v0-1.mjs");
}

function formationReceiptDurableEventImplementationSliceActive() {
  return readChangedFiles().includes("scripts/smoke-formation-receipt-durable-event-implementation-v0-1.mjs");
}

function formationReceiptDurableEventContractSliceActive() {
  return readChangedFiles().includes(formationReceiptDurableEventContractSmokePath);
}

function mergeBaseRef() {
  return readGitOutput(["merge-base", "origin/main", "HEAD"]).trim() || "origin/main";
}

function readGitOutput(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" });
  } catch {
    return "";
  }
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function extractScriptName(line) {
  return line.replace(/^\+\s*/, "").trim().match(/^"([^"]+)"/)?.[1] ?? null;
}

function stripSmokeAssertionText(source) {
  return source
    .split("\n")
    .filter((line) => !line.includes("pattern(["))
    .filter((line) => !line.includes("insertFeedbackEvent"))
    .filter((line) => !line.includes("listFeedbackEvents"))
    .filter((line) => !line.includes("research_candidate_feedback_events"))
    .filter((line) => !line.includes("better-sqlite3"))
    .filter((line) => !line.includes("new Database"))
    .filter((line) => !line.includes("CREATE TABLE"))
    .join("\n");
}

function pattern(parts) {
  const label = parts.join("");
  return {
    label,
    regex: new RegExp(parts.map(escapeRegExp).join("\\s*"), "i"),
  };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function recentRehearsalBufferBrowserValidationSliceActive() {
  return readChangedFiles().includes(
    "scripts/smoke-recent-rehearsal-buffer-browser-validation-v0-1.mjs",
  );
}

function assertRecentRehearsalBufferBrowserValidationPackageScript() {
  const packageAddedLines = readGitOutput([
    "diff",
    "--unified=0",
    mergeBaseRef(),
    "--",
    packagePath,
  ])
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"));
  const addedScriptNames = packageAddedLines
    .map((line) => line.match(/^\+\s+"([^"]+)"\s*:/)?.[1] ?? null)
    .filter(Boolean)
    .sort();
  assert.equal(
    packageJson.scripts["smoke:recent-rehearsal-buffer-browser-validation-v0-1"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-recent-rehearsal-buffer-browser-validation-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:recent-rehearsal-buffer-browser-validation-v0-1"],
    "package.json must add only the Recent Rehearsal Buffer browser validation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
}

function assertRecentRehearsalBufferBrowserValidationChangedFiles(changedFiles) {
  const expectedFiles = [
    "fixtures/research-candidate-review.recent-rehearsal-buffer-browser-validation.sample.v0.1.json",
    "scripts/smoke-recent-rehearsal-buffer-browser-validation-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    "scripts/smoke-recent-rehearsal-buffer-implementation-v0-1.mjs",
    "scripts/smoke-recent-rehearsal-buffer-contract-v0-1.mjs",
    "scripts/smoke-formation-receipt-durable-event-browser-validation-v0-1.mjs",
    "scripts/smoke-formation-receipt-durable-event-implementation-v0-1.mjs",
    "scripts/smoke-formation-receipt-durable-event-contract-v0-1.mjs",
    "scripts/smoke-feedback-event-aggregation-read-model-browser-validation-v0-1.mjs",
    "scripts/smoke-feedback-event-aggregation-read-model-implementation-v0-1.mjs",
    "scripts/smoke-feedback-event-aggregation-read-model-contract-v0-1.mjs",
    "scripts/smoke-feedback-event-store-list-ui-browser-validation-v0-1.mjs",
    "scripts/smoke-feedback-event-store-list-ui-implementation-v0-1.mjs",
    "scripts/smoke-feedback-event-store-list-ui-contract-v0-1.mjs",
    "scripts/smoke-feedback-event-store-list-route-browser-validation-v0-1.mjs",
    "scripts/smoke-feedback-event-store-list-route-implementation-v0-1.mjs",
    "scripts/smoke-feedback-event-store-list-route-contract-v0-1.mjs",
    "scripts/smoke-feedback-event-controls-ui-browser-validation-v0-1.mjs",
    "scripts/smoke-feedback-event-controls-ui-implementation-v0-1.mjs",
    "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs",
    "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
    "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
  ];
  assert.ok(
    !changedFiles.includes("lib/research-candidate-review/recent-rehearsal-buffer.ts"),
    "browser validation slice must not change the #716 builder",
  );
  assert.ok(
    !changedFiles.includes("fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json"),
    "browser validation slice must not change the #716 implementation fixture",
  );
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      "unexpected changed file in Recent Rehearsal Buffer browser validation downstream slice: " + changedFile,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|retrieval|source-fetch)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}

function salienceGovernorContractSliceActive() {
  return readChangedFiles().includes("scripts/smoke-salience-governor-contract-v0-1.mjs");
}

function assertSalienceGovernorContractPackageScript() {
  const packageAddedLines = readGitOutput([
    "diff",
    "--unified=0",
    mergeBaseRef(),
    "--",
    packagePath,
  ])
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"));
  const addedScriptNames = packageAddedLines
    .map((line) => line.match(/^\+\s+"([^"]+)"\s*:/)?.[1] ?? null)
    .filter(Boolean)
    .sort();
  assert.equal(
    packageJson.scripts["smoke:salience-governor-contract-v0-1"],
    "node scripts/smoke-salience-governor-contract-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:salience-governor-contract-v0-1"],
    "package.json must add only the Salience Governor contract smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
}

function assertSalienceGovernorContractChangedFiles(changedFiles) {
  const expectedFiles =   [
      "types/salience-governor-contract.ts",
      "fixtures/research-candidate-review.salience-governor-contract.sample.v0.1.json",
      "scripts/smoke-salience-governor-contract-v0-1.mjs",
      "package.json",
      "docs/00_INDEX_LATEST.md",
      "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
      "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
      "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
      "scripts/smoke-recent-rehearsal-buffer-browser-validation-v0-1.mjs",
      "scripts/smoke-recent-rehearsal-buffer-implementation-v0-1.mjs",
      "scripts/smoke-recent-rehearsal-buffer-contract-v0-1.mjs",
      "scripts/smoke-formation-receipt-durable-event-browser-validation-v0-1.mjs",
      "scripts/smoke-formation-receipt-durable-event-implementation-v0-1.mjs",
      "scripts/smoke-formation-receipt-durable-event-contract-v0-1.mjs",
      "scripts/smoke-feedback-event-aggregation-read-model-browser-validation-v0-1.mjs",
      "scripts/smoke-feedback-event-aggregation-read-model-implementation-v0-1.mjs",
      "scripts/smoke-feedback-event-aggregation-read-model-contract-v0-1.mjs",
      "scripts/smoke-feedback-event-store-list-ui-browser-validation-v0-1.mjs",
      "scripts/smoke-feedback-event-store-list-ui-implementation-v0-1.mjs",
      "scripts/smoke-feedback-event-store-list-ui-contract-v0-1.mjs",
      "scripts/smoke-feedback-event-store-list-route-browser-validation-v0-1.mjs",
      "scripts/smoke-feedback-event-store-list-route-implementation-v0-1.mjs",
      "scripts/smoke-feedback-event-store-list-route-contract-v0-1.mjs",
      "scripts/smoke-feedback-event-controls-ui-browser-validation-v0-1.mjs",
      "scripts/smoke-feedback-event-controls-ui-implementation-v0-1.mjs",
      "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs",
      "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs",
      "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
      "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs",
      "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
      "scripts/smoke-feedback-event-store-minimal-v0-1.mjs"
  ];
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  assert.ok(
    !changedFiles.includes("lib/research-candidate-review/recent-rehearsal-buffer.ts"),
    "Salience Governor contract slice must not change the Recent Rehearsal Buffer builder",
  );
  assert.ok(
    !changedFiles.includes(
      "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
    ),
    "Salience Governor contract slice must not change the Recent Rehearsal Buffer implementation fixture",
  );
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      `unexpected changed file in Salience Governor contract downstream slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|retrieval|source-fetch)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}

function salienceGovernorImplementationSliceActive() {
  return readChangedFiles().includes("scripts/smoke-salience-governor-implementation-v0-1.mjs");
}

function assertSalienceGovernorImplementationPackageScript() {
  const packageAddedLines = readGitOutput([
    "diff",
    "--unified=0",
    mergeBaseRef(),
    "--",
    packagePath,
  ])
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"));
  const addedScriptNames = packageAddedLines
    .map((line) => line.match(/^\+\s+"([^"]+)"\s*:/)?.[1] ?? null)
    .filter(Boolean)
    .sort();
  assert.equal(
    packageJson.scripts["smoke:salience-governor-implementation-v0-1"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-salience-governor-implementation-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:salience-governor-implementation-v0-1"],
    "package.json must add only the Salience Governor implementation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
}

function assertSalienceGovernorImplementationChangedFiles(changedFiles) {
  const expectedFiles =   [
      "lib/research-candidate-review/salience-governor.ts",
      "fixtures/research-candidate-review.salience-governor-implementation.sample.v0.1.json",
      "scripts/smoke-salience-governor-implementation-v0-1.mjs",
      "package.json",
      "docs/00_INDEX_LATEST.md",
      "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
      "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
      "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
      "scripts/smoke-salience-governor-contract-v0-1.mjs",
      "scripts/smoke-recent-rehearsal-buffer-browser-validation-v0-1.mjs",
      "scripts/smoke-recent-rehearsal-buffer-implementation-v0-1.mjs",
      "scripts/smoke-recent-rehearsal-buffer-contract-v0-1.mjs",
      "scripts/smoke-formation-receipt-durable-event-browser-validation-v0-1.mjs",
      "scripts/smoke-formation-receipt-durable-event-implementation-v0-1.mjs",
      "scripts/smoke-formation-receipt-durable-event-contract-v0-1.mjs",
      "scripts/smoke-feedback-event-aggregation-read-model-browser-validation-v0-1.mjs",
      "scripts/smoke-feedback-event-aggregation-read-model-implementation-v0-1.mjs",
      "scripts/smoke-feedback-event-aggregation-read-model-contract-v0-1.mjs",
      "scripts/smoke-feedback-event-store-list-ui-browser-validation-v0-1.mjs",
      "scripts/smoke-feedback-event-store-list-ui-implementation-v0-1.mjs",
      "scripts/smoke-feedback-event-store-list-ui-contract-v0-1.mjs",
      "scripts/smoke-feedback-event-store-list-route-browser-validation-v0-1.mjs",
      "scripts/smoke-feedback-event-store-list-route-implementation-v0-1.mjs",
      "scripts/smoke-feedback-event-store-list-route-contract-v0-1.mjs",
      "scripts/smoke-feedback-event-controls-ui-browser-validation-v0-1.mjs",
      "scripts/smoke-feedback-event-controls-ui-implementation-v0-1.mjs",
      "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs",
      "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs",
      "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
      "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs",
      "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
      "scripts/smoke-feedback-event-store-minimal-v0-1.mjs"
  ];
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  assert.ok(
    !changedFiles.includes("lib/research-candidate-review/recent-rehearsal-buffer.ts"),
    "Salience Governor implementation slice must not change the Recent Rehearsal Buffer builder",
  );
  assert.ok(
    !changedFiles.includes(
      "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
    ),
    "Salience Governor implementation slice must not change the Recent Rehearsal Buffer implementation fixture",
  );
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      `unexpected changed file in Salience Governor implementation downstream slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|retrieval|source-fetch)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}
