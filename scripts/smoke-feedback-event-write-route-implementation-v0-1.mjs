import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");

const recentRehearsalBufferContractPackageScriptName =
  "smoke:recent-rehearsal-buffer-contract-v0-1";
const recentRehearsalBufferContractPackageScriptValue =
  "node scripts/smoke-recent-rehearsal-buffer-contract-v0-1.mjs";
const recentRehearsalBufferImplementationPackageScriptName =
  "smoke:recent-rehearsal-buffer-implementation-v0-1";
const recentRehearsalBufferImplementationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-recent-rehearsal-buffer-implementation-v0-1.mjs";
const routePath = "app/api/research-candidate/feedback-events/route.ts";
const smokePath = "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs";
const fixturePath =
  "fixtures/research-candidate-review.feedback-event-write-route-implementation.sample.v0.1.json";
const contractFixturePath =
  "fixtures/research-candidate-review.feedback-event-write-route-contract.sample.v0.1.json";
const feedbackStoreFixturePath =
  "fixtures/research-candidate-review.feedback-event-store.sample.v0.1.json";
const reviewControlsFixturePath =
  "fixtures/research-candidate-review.feedback-event-store-review-controls-preview.sample.v0.1.json";
const contractSmokePath = "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";
const reviewControlsSmokePath =
  "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs";
const feedbackStoreSmokePath = "scripts/smoke-feedback-event-store-minimal-v0-1.mjs";
const operatorDecisionSmokePath =
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs";
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
const foldedAuditPanelSmokePath =
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs";
const previewBuilderSmokePath =
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs";
const substrateSmokePath = "scripts/smoke-agent-perspective-substrate-v0-1.mjs";
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
const packageScriptName = "smoke:feedback-event-write-route-implementation-v0-1";
const packageScriptValue =
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

const recommendationStatus =
  "ready_for_feedback_event_write_route_browser_validation_v0_1";
const nextRecommendedSlice = "feedback_event_write_route_browser_validation_v0_1";
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
const routeMethod = "POST";
const routeUrl = "/api/research-candidate/feedback-events";
const authorityBoundaryRefusalCases = [
  [
    "retrieval_rag_authority_refusal_response",
    { authority_boundary: { retrieval_rag_authority: true } },
    "retrieval_rag_execution_requested",
  ],
  [
    "source_fetch_authority_refusal_response",
    { authority_boundary: { source_fetch_authority: true } },
    "source_fetch_requested",
  ],
  [
    "provider_openai_authority_refusal_response",
    { authority_boundary: { provider_openai_authority: true } },
    "provider_openai_call_requested",
  ],
  [
    "codex_github_authority_refusal_response",
    {
      authority_boundary: {
        codex_execution_authority: true,
        github_automation_authority: true,
      },
    },
    "codex_or_github_automation_requested",
  ],
  [
    "product_id_allocation_authority_refusal_response",
    { authority_boundary: { product_id_allocation_authority: true } },
    "product_write_authority_requested",
  ],
  [
    "proof_evidence_authority_refusal_response",
    { authority_boundary: { proof_or_evidence_record: true } },
    "forbidden_authority_requested",
  ],
  [
    "perspective_promotion_authority_refusal_response",
    { authority_boundary: { perspective_promotion: true } },
    "forbidden_authority_requested",
  ],
  [
    "work_mutation_authority_refusal_response",
    { authority_boundary: { work_mutation: true } },
    "forbidden_authority_requested",
  ],
  [
    "execution_authority_refusal_response",
    { authority_boundary: { execution_authority: true } },
    "forbidden_authority_requested",
  ],
];
const capabilityFlagRefusalCases = [
  [
    "product_write_available_refusal_response",
    { authority_boundary: { product_write_available: true } },
    "product_write_authority_requested",
  ],
  [
    "product_write_authorized_now_refusal_response",
    { authority_boundary: { product_write_authorized_now: true } },
    "product_write_authority_requested",
  ],
  [
    "product_db_write_refusal_response",
    { authority_boundary: { product_db_write: true } },
    "product_write_authority_requested",
  ],
  [
    "product_claim_id_allocation_available_refusal_response",
    { authority_boundary: { product_claim_id_allocation_available: true } },
    "product_write_authority_requested",
  ],
  [
    "route_action_available_refusal_response",
    { authority_boundary: { route_action_available: true } },
    "forbidden_authority_requested",
  ],
  [
    "db_write_available_refusal_response",
    { authority_boundary: { db_write_available: true } },
    "forbidden_authority_requested",
  ],
  [
    "db_open_now_refusal_response",
    { authority_boundary: { db_open_now: true } },
    "forbidden_authority_requested",
  ],
  [
    "sql_execution_now_refusal_response",
    { authority_boundary: { sql_execution_now: true } },
    "forbidden_authority_requested",
  ],
  [
    "transaction_execution_now_refusal_response",
    { authority_boundary: { transaction_execution_now: true } },
    "forbidden_authority_requested",
  ],
  [
    "external_call_available_refusal_response",
    { authority_boundary: { external_call_available: true } },
    "forbidden_authority_requested",
  ],
  [
    "agent_execution_available_refusal_response",
    { authority_boundary: { agent_execution_available: true } },
    "forbidden_authority_requested",
  ],
  [
    "durable_write_authority_refusal_response",
    { authority_boundary: { durable_write_authority: true } },
    "forbidden_authority_requested",
  ],
  [
    "retrieval_rag_available_refusal_response",
    { authority_boundary: { retrieval_rag_available: true } },
    "retrieval_rag_execution_requested",
  ],
  [
    "provider_or_openai_call_requested_refusal_response",
    { authority_boundary: { provider_or_openai_call_requested: true } },
    "provider_openai_call_requested",
  ],
  [
    "source_fetch_available_refusal_response",
    { authority_boundary: { source_fetch_available: true } },
    "source_fetch_requested",
  ],
  [
    "codex_execution_available_refusal_response",
    { authority_boundary: { codex_execution_available: true } },
    "codex_or_github_automation_requested",
  ],
  [
    "github_automation_available_refusal_response",
    { authority_boundary: { github_automation_available: true } },
    "codex_or_github_automation_requested",
  ],
];
const requiredAcknowledgements = [
  "durable_feedback_event_only",
  "not_proof_or_evidence",
  "not_perspective_promotion",
  "not_work_mutation",
  "not_execution_authority",
  "not_codex_execution",
  "not_github_automation",
  "not_external_handoff",
  "not_provider_openai_call",
  "not_source_fetch",
  "not_retrieval_rag_execution",
  "not_product_write",
  "product_write_lane_parked_by_686",
];
const requiredChangedFiles = [
  routePath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  contractSmokePath,
];
const allowedChangedFiles = [
  ...requiredChangedFiles,
  browserValidationFixturePath,
  browserValidationSmokePath,
  reviewControlsSmokePath,
  feedbackStoreSmokePath,
  operatorDecisionSmokePath,
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  "scripts/smoke-research-candidate-review-manual-parser-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-v0-1.mjs",
  "scripts/smoke-research-candidate-canonical-promotion-gates-v0-1.mjs",
  "scripts/smoke-research-candidate-review-types-v0-1.mjs",
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
  smokePath,
];
const downstreamUiContractAllowedChangedFiles = [
  ...downstreamUiContractRequiredChangedFiles,
  contractSmokePath,
  reviewControlsSmokePath,
  feedbackStoreSmokePath,
  operatorDecisionSmokePath,
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
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
  smokePath,
];
const downstreamUiImplementationAllowedChangedFiles = [
  ...downstreamUiImplementationRequiredChangedFiles,
  contractSmokePath,
  reviewControlsSmokePath,
  feedbackStoreSmokePath,
  operatorDecisionSmokePath,
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
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
  smokePath,
  contractSmokePath,
  reviewControlsSmokePath,
  feedbackStoreSmokePath,
  operatorDecisionSmokePath,
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
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
  smokePath,
  contractSmokePath,
  reviewControlsSmokePath,
  feedbackStoreSmokePath,
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
  routePath,
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
  smokePath,
  contractSmokePath,
  reviewControlsSmokePath,
  feedbackStoreSmokePath,
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
  smokePath,
  contractSmokePath,
  reviewControlsSmokePath,
  feedbackStoreSmokePath,
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
  smokePath,
  contractSmokePath,
  reviewControlsSmokePath,
  feedbackStoreSmokePath,
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
  uiImplementationSmokePath,
  uiBrowserValidationSmokePath,
  uiContractSmokePath,
  listRouteContractSmokePath,
  feedbackStoreSmokePath,
  reviewControlsSmokePath,
  browserValidationSmokePath,
  contractSmokePath,
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
  smokePath,
  contractSmokePath,
  reviewControlsSmokePath,
  feedbackStoreSmokePath,
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
  smokePath,
  contractSmokePath,
  reviewControlsSmokePath,
  feedbackStoreSmokePath,
];

const feedbackStoreModule = unwrapModule(
  await import("../lib/research-candidate-review/feedback-event-store.ts"),
);
const routeModule = unwrapModule(
  await import("../app/api/research-candidate/feedback-events/route.ts"),
);
const { feedbackEventStoreSchemaSql, feedbackEventStoreTableName } =
  feedbackStoreModule;
const { handleFeedbackEventWriteRouteRequest } = routeModule;

for (const filePath of [
  routePath,
  smokePath,
  fixturePath,
  contractFixturePath,
  feedbackStoreFixturePath,
  reviewControlsFixturePath,
  contractSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const routeSource = readFileSync(routePath, "utf8");
const smokeSource = readFileSync(smokePath, "utf8");
const fixture = readJson(fixturePath);
const contractFixture = readJson(contractFixturePath);
const feedbackStoreFixture = readJson(feedbackStoreFixturePath);
const reviewControlsFixture = readJson(reviewControlsFixturePath);
const contractSmokeSource = readFileSync(contractSmokePath, "utf8");
const packageJson = readJson(packagePath);
const indexDoc = readFileSync(indexPath, "utf8");
const substrateDoc = readFileSync(substrateDocPath, "utf8");
const surfaceDoc = readFileSync(surfaceDocPath, "utf8");
const gateDoc = readFileSync(gateDocPath, "utf8");

assertRouteSource();
assertPackageScript();
assertStaticBoundary();
assertNoForbiddenImplementationPatterns();
assertDocsPointers();
assertContractSmokeDownstreamPointer();
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

const rebuiltFixture = buildImplementationFixture();
assert.deepEqual(
  rebuiltFixture,
  fixture,
  "committed route implementation fixture must match rebuilt route responses",
);

assertImplementationFixture(fixture);
assertRouteBehaviorWithTempDb();

console.log(
  JSON.stringify(
    {
      smoke: "feedback-event-write-route-implementation-v0-1",
      final_status: "pass",
      route_path: routeUrl,
      route_method: routeMethod,
      inserted_event_id: fixture.responses.valid_insert_response.event_id,
      duplicate_event_id: fixture.responses.duplicate_response.event_id,
      next_recommended_slice: fixture.next_recommended_slice,
      checked_feedback_event_only_write: true,
      checked_no_ui_or_product_write: true,
      checked_product_write_lane_parked: true,
    },
    null,
    2,
  ),
);

function assertRouteSource() {
  assert.match(routeSource, /export async function POST\b/, "route must export POST");
  if (
    downstreamListRouteImplementationSliceActive() ||
    downstreamListRouteBrowserValidationSliceActive() ||
    downstreamListUiContractSliceActive() ||
    downstreamListUiImplementationSliceActive() ||
    downstreamListUiBrowserValidationSliceActive() ||
    downstreamAggregationReadModelContractSliceActive()
  ) {
    assert.match(routeSource, /export\s+async\s+function\s+GET\b/);
    assert.match(routeSource, /handleFeedbackEventStoreListRouteRequest/);
  } else {
    assert.doesNotMatch(
      routeSource,
      /export\s+(async\s+)?function\s+(GET|PUT|PATCH|DELETE)\b/,
    );
  }
  assert.doesNotMatch(routeSource, /export\s+(async\s+)?function\s+(PUT|PATCH|DELETE)\b/);
  assert.match(routeSource, /handleFeedbackEventWriteRouteRequest/);
  assert.match(routeSource, /insertFeedbackEvent/);
  assert.match(routeSource, /buildFeedbackEventStoreEvent/);
  assert.match(routeSource, /openDatabase/);
  assert.match(routeSource, /runtime\s*=\s*"nodejs"/);
  assert.doesNotMatch(routeSource, /\.prepare\s*\(/, "route must not execute SQL directly");
  assert.doesNotMatch(routeSource, /\bSELECT\b|\bINSERT\s+INTO\b|\bUPDATE\b|\bDELETE\s+FROM\b/i);
  assert.doesNotMatch(
    routeSource,
    /\b(?:FROM|JOIN|INTO|UPDATE|TABLE)\s+research_candidate_(?!feedback_events\b)/i,
    "route must not reference non-feedback-event research candidate tables",
  );
}

function assertPackageScript() {
  if (boundedExternalSourceIntakeContractSliceActive()) {
    assertBoundedExternalSourceIntakeContractPackageScript();
    return;
  }
  if (salienceGovernorBrowserValidationSliceActive()) {
    assertSalienceGovernorBrowserValidationPackageScript();
    return;
  }
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
    : downstreamBrowserValidationSliceActive()
    ? [browserValidationPackageScriptName]
    : [packageScriptName];
  assert.deepEqual(
    addedScriptNames,
    expectedAddedScriptNames,
    "package additions must only include the feedback event write route implementation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
}

function assertStaticBoundary() {
  const changedFiles = readChangedFiles();
  if (boundedExternalSourceIntakeContractSliceActive()) {
    assertBoundedExternalSourceIntakeContractChangedFiles(changedFiles);
    return;
  }
  if (salienceGovernorBrowserValidationSliceActive()) {
    assertSalienceGovernorBrowserValidationChangedFiles(changedFiles);
    return;
  }
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
    : downstreamBrowserValidationSliceActive()
    ? [
        browserValidationFixturePath,
        browserValidationSmokePath,
        packagePath,
        indexPath,
        substrateDocPath,
        surfaceDocPath,
        gateDocPath,
        smokePath,
        contractSmokePath,
        reviewControlsSmokePath,
        feedbackStoreSmokePath,
      ]
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
    : allowedChangedFiles;
  for (const requiredFile of requiredFiles) {
    assert.ok(changedFiles.includes(requiredFile), `changed files must include ${requiredFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      allowedFiles.includes(changedFile),
      `unexpected changed file in route implementation slice: ${changedFile}`,
    );
    if (changedFile !== routePath) {
      assert.doesNotMatch(changedFile, /^app\/api\//, "must add only the feedback route");
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
  const checkedSources = [
    [routePath, stripAssertionText(routeSource)],
    [smokePath, stripAssertionText(smokeSource)],
  ];
  const forbiddenPatterns = [
    pattern(["from ", '"openai"']),
    pattern(["new ", "OpenAI"]),
    pattern(["fet", "ch", "("]),
    pattern(["XMLHttpRequest"]),
    pattern(["WebSocket"]),
    pattern(["EventSource"]),
    pattern(["sendBeacon"]),
    pattern(["localStorage"]),
    pattern(["sessionStorage"]),
    pattern(["indexedDB"]),
    pattern(["document", ".", "cookie"]),
    pattern(["api", ".", "github", ".", "com"]),
    pattern(["Octokit"]),
    pattern(["externalHandoff"]),
    pattern(["executeProductWrite"]),
    pattern(["productDbWrite"]),
    { label: "codex-exec-command", regex: /\bcodex\s+exec\b/i },
    { label: "codex-run-command", regex: /\bcodex\s+run\b/i },
    { label: "gh-pr-command", regex: /\bgh\s+pr\b/i },
    { label: "proof-create", regex: /\bcreateProof\b|\binsertProof\b/ },
    { label: "evidence-create", regex: /\bcreateEvidence\b|\binsertEvidence\b/ },
    { label: "work-mutation", regex: /\bmutateWork\b|\bupdateWork\b/ },
    { label: "perspective-promotion", regex: /\bpromotePerspective\b/ },
  ];
  for (const [filePath, source] of checkedSources) {
    for (const { label, regex } of forbiddenPatterns) {
      assert.doesNotMatch(source, regex, `${filePath} must not include ${label}`);
    }
  }
  assert.doesNotMatch(
    routeSource,
    /from\s+["']@\/lib\/(?:observe|github|provider|retrieval|source|evidence|work|publications|actions)\b/i,
    "route must not import provider/OpenAI/retrieval/source/GitHub/proof/work/product modules",
  );
}

function assertDocsPointers() {
  for (const requiredText of [
    "Feedback Event write route implementation v0.1",
    routePath,
    fixturePath,
    smokePath,
    packageScriptName,
    "route implemented for feedback events only",
    "no UI/component change",
    "no proof/evidence/Perspective promotion/work mutation",
    "no Codex/GitHub automation/external handoff",
    "no provider/OpenAI/source-fetch/retrieval/RAG execution",
    "no product write/product IDs",
    nextRecommendedSlice,
  ]) {
    assert.ok(indexDoc.includes(requiredText), `index must include ${requiredText}`);
  }
  for (const doc of [substrateDoc, surfaceDoc, gateDoc]) {
    assert.match(doc, /Feedback Event write route/i);
    assert.match(doc, /persist(?:s)? feedback event/i);
    assert.match(doc, /no UI|No UI controls|no UI\/component/i);
    assert.match(doc, /no proof\/evidence|proof\/evidence/i);
    assert.match(doc, /no Perspective promotion|Perspective state/i);
    assert.match(doc, /no work mutation|work mutation/i);
    assert.match(doc, /no provider\/OpenAI/i);
    assert.match(doc, /no source fetch|source-fetch/i);
    assert.match(doc, /no retrieval\/RAG execution/i);
    assert.match(doc, /no product write/i);
    assert.match(doc, /#686/);
    assert.match(doc, new RegExp(nextRecommendedSlice));
  }
}

function assertContractSmokeDownstreamPointer() {
  for (const requiredText of [
    packageScriptName,
    nextRecommendedSlice,
    routePath,
    fixturePath,
    smokePath,
    recommendationStatus,
  ]) {
    assert.ok(
      contractSmokeSource.includes(requiredText),
      `#697 contract smoke must allow downstream implementation text: ${requiredText}`,
    );
  }
  assert.equal(contractFixture.next_recommended_slice, "feedback_event_write_route_implementation_v0_1");
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
      `#698 implementation smoke must allow downstream browser validation text: ${requiredText}`,
    );
  }
  assert.equal(
    fixture.next_recommended_slice,
    nextRecommendedSlice,
    "#698 route implementation fixture output must remain unchanged",
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
      `#698 implementation smoke must allow downstream UI contract text: ${requiredText}`,
    );
  }
  assert.equal(
    fixture.next_recommended_slice,
    nextRecommendedSlice,
    "#698 route implementation fixture output must remain unchanged",
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
      `#698 implementation smoke must allow downstream UI implementation text: ${requiredText}`,
    );
  }
  assert.equal(
    fixture.next_recommended_slice,
    nextRecommendedSlice,
    "#698 route implementation fixture output must remain unchanged",
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
      `#698 implementation smoke must allow downstream UI browser validation text: ${requiredText}`,
    );
  }
  assert.equal(
    fixture.next_recommended_slice,
    nextRecommendedSlice,
    "#698 route implementation fixture output must remain unchanged",
  );
}

function assertListRouteContractDownstreamPointer() {
  if (!downstreamListRouteContractSliceActive()) return;
  for (const filePath of [
    listRouteContractTypePath,
    listRouteContractBuilderPath,
    listRouteContractFixturePath,
    listRouteContractSmokePath,
  ]) {
    assert.ok(existsSync(filePath), `${filePath} must exist`);
  }
  const listRouteContractFixture = readJson(listRouteContractFixturePath);
  assert.equal(listRouteContractFixture.route_method, "GET");
  assert.equal(listRouteContractFixture.route_implemented_now, false);
  assert.equal(
    listRouteContractFixture.recommendation_status,
    listRouteContractRecommendationStatus,
  );
  assert.equal(
    listRouteContractFixture.next_recommended_slice,
    listRouteContractNextRecommendedSlice,
  );
  assert.equal(
    fixture.next_recommended_slice,
    nextRecommendedSlice,
    "#698 route implementation fixture output must remain unchanged",
  );
}

function assertListRouteImplementationDownstreamPointer() {
  if (!downstreamListRouteImplementationSliceActive()) return;
  for (const filePath of [
    listRouteImplementationFixturePath,
    listRouteImplementationSmokePath,
    listRouteContractSmokePath,
  ]) {
    assert.ok(existsSync(filePath), `${filePath} must exist`);
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
    fixture.next_recommended_slice,
    nextRecommendedSlice,
    "#698 route implementation fixture output must remain unchanged",
  );
}

function assertListRouteBrowserValidationDownstreamPointer() {
  if (!downstreamListRouteBrowserValidationSliceActive()) return;
  for (const filePath of [
    listRouteBrowserValidationFixturePath,
    listRouteBrowserValidationSmokePath,
    listRouteImplementationSmokePath,
    listRouteContractSmokePath,
  ]) {
    assert.ok(existsSync(filePath), `${filePath} must exist`);
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
    fixture.next_recommended_slice,
    nextRecommendedSlice,
    "#698 route implementation fixture output must remain unchanged",
  );
}

function assertListUiContractDownstreamPointer() {
  if (!downstreamListUiContractSliceActive()) return;
  const listUiContractFixture = readJson(listUiContractFixturePath);
  assert.equal(
    listUiContractFixture.contract_kind,
    "feedback_event_store_list_ui_contract",
  );
  assert.equal(listUiContractFixture.route_method, "GET");
  assert.equal(listUiContractFixture.ui_implemented_now, false);
  assert.equal(listUiContractFixture.browser_request_executed_now, false);
  assert.equal(listUiContractFixture.feedback_events_read_now, false);
  assert.equal(
    listUiContractFixture.recommendation_status,
    listUiContractRecommendationStatus,
  );
  assert.equal(
    listUiContractFixture.next_recommended_slice,
    listUiContractNextRecommendedSlice,
  );
  assert.equal(
    fixture.next_recommended_slice,
    nextRecommendedSlice,
    "#698 route implementation fixture output must remain unchanged",
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
    fixture.next_recommended_slice,
    nextRecommendedSlice,
    "#698 route implementation fixture output must remain unchanged",
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
    fixture.next_recommended_slice,
    nextRecommendedSlice,
    "#698 route implementation fixture output must remain unchanged",
  );
}

function assertImplementationFixture(value) {
  assert.equal(value.fixture_kind, "feedback_event_write_route_implementation_fixture");
  assert.equal(value.fixture_version, "feedback_event_write_route_implementation.v0.1");
  assert.equal(value.route_path, routeUrl);
  assert.equal(value.route_method, routeMethod);
  assert.equal(value.route_implemented_now, true);
  assert.equal(value.source_contract_fingerprint, contractFixture.contract_fingerprint);
  assert.equal(value.source_feedback_event_store_version, feedbackStoreFixture.fixture_version);
  assert.equal(value.source_review_controls_preview_fingerprint, reviewControlsFixture.preview_fingerprint);
  assert.equal(value.product_write_stopline_ref, "pr:686");
  assert.equal(value.recommendation_status, recommendationStatus);
  assert.equal(value.next_recommended_slice, nextRecommendedSlice);
  assert.equal(value.validation.passed, true);
  assert.deepEqual(value.validation.failure_codes, []);
  assertInsertResponse(value.responses.valid_insert_response);
  assertDuplicateResponse(
    value.responses.duplicate_response,
    value.responses.valid_insert_response,
  );
  for (const [key, response] of Object.entries(value.responses)) {
    assertAuthorityBoundary(response.authority_boundary);
    if (!["valid_insert_response", "duplicate_response"].includes(key)) {
      assert.equal(response.accepted, false, `${key} must refuse`);
      assert.equal(response.inserted, false, `${key} must not insert`);
      assert.equal(response.duplicate, false, `${key} must not duplicate`);
      assert.equal(response.event, null, `${key} must not return event`);
      assert.equal(response.runtime_write_executed_now, false);
      assert.equal(response.db_open_now, false);
      assert.equal(response.sql_execution_now, false);
      assert.ok(response.refusal?.refusal_code, `${key} refusal code`);
    }
  }
  assert.equal(
    value.responses.missing_ack_refusal_response.refusal.refusal_code,
    "missing_authority_acknowledgement",
  );
  assert.equal(
    value.responses.retrieval_rag_refusal_response.refusal.refusal_code,
    "retrieval_rag_execution_requested",
  );
  assert.equal(
    value.responses.provider_openai_refusal_response.refusal.refusal_code,
    "provider_openai_call_requested",
  );
  assert.equal(
    value.responses.source_fetch_refusal_response.refusal.refusal_code,
    "source_fetch_requested",
  );
  assert.equal(
    value.responses.codex_github_refusal_response.refusal.refusal_code,
    "codex_or_github_automation_requested",
  );
  assert.equal(
    value.responses.product_write_refusal_response.refusal.refusal_code,
    "product_write_authority_requested",
  );
  assert.equal(
    value.responses.correction_text_missing_refusal_response.refusal.refusal_code,
    "correction_text_required_for_correct_preview",
  );
  assert.equal(
    value.responses.operator_note_secret_refusal_response.refusal.refusal_code,
    "operator_note_secret_like_pattern",
  );
  assertAuthorityBoundaryRefusalExamples(value.authority_boundary_refusal_examples);
  assertCapabilityFlagRefusalExamples(value.capability_flag_refusal_examples);
}

function assertRouteBehaviorWithTempDb() {
  withTempDb((db) => {
    const validRequest = clone(contractFixture.request_contract);
    const insertResponse = handleFeedbackEventWriteRouteRequest({
      body: validRequest,
      db,
    });
    assertInsertResponse(insertResponse);
    assert.equal(countRows(db), 1);

    const duplicateResponse = handleFeedbackEventWriteRouteRequest({
      body: validRequest,
      db,
    });
    assertDuplicateResponse(duplicateResponse, insertResponse);
    assert.equal(countRows(db), 1);

    assertRefusal(db, removeAcknowledgement(validRequest), "missing_authority_acknowledgement");
    assertRefusal(
      db,
      { ...validRequest, nested_boundary: { run_rag: true } },
      "retrieval_rag_execution_requested",
    );
    assertRefusal(
      db,
      { ...validRequest, nested_boundary: { call_openai: true } },
      "provider_openai_call_requested",
    );
    assertRefusal(
      db,
      { ...validRequest, nested_boundary: { fetch_source: true } },
      "source_fetch_requested",
    );
    assertRefusal(
      db,
      { ...validRequest, nested_boundary: { execute_codex: true, call_github: true } },
      "codex_or_github_automation_requested",
    );
    assertRefusal(
      db,
      { ...validRequest, nested_boundary: { product_write: true } },
      "product_write_authority_requested",
    );
    for (const [, requestPatch, refusalCode] of authorityBoundaryRefusalCases) {
      assertRefusal(db, { ...validRequest, ...requestPatch }, refusalCode);
    }
    for (const [, requestPatch, refusalCode] of capabilityFlagRefusalCases) {
      assertRefusal(db, { ...validRequest, ...requestPatch }, refusalCode);
    }
    const missingCorrectionText = clone(validRequest);
    delete missingCorrectionText.correction_text;
    assertRefusal(
      db,
      missingCorrectionText,
      "correction_text_required_for_correct_preview",
    );
    assertRefusal(
      db,
      { ...validRequest, operator_note: "do not store OPENAI_API_KEY here" },
      "operator_note_secret_like_pattern",
    );

    assert.equal(countRows(db), 1, "refusals must not create extra rows");
    assert.deepEqual(tableNames(db), [feedbackEventStoreTableName]);
  });
}

function assertInsertResponse(response) {
  assert.equal(response.response_version, "feedback_event_write_route_response.v0.1");
  assert.equal(response.accepted, true);
  assert.equal(response.inserted, true);
  assert.equal(response.duplicate, false);
  assert.match(response.event_id, /^feedback_event:fnv1a32:[0-9a-f]{8}$/);
  assert.match(
    response.idempotency_key,
    /^feedback_event_store_idempotency:fnv1a32:[0-9a-f]{8}$/,
  );
  assert.ok(response.event, "insert response must return event");
  assert.equal(response.event.event_id, response.event_id);
  assert.equal(response.event.idempotency_key, response.idempotency_key);
  assert.equal(response.validation.passed, true);
  assert.deepEqual(response.validation.failure_codes, []);
  assert.equal(response.refusal, null);
  assert.equal(response.route_implemented_now, true);
  assert.equal(response.runtime_write_executed_now, true);
  assert.equal(response.db_open_now, true);
  assert.equal(response.sql_execution_now, true);
  assertAuthorityBoundary(response.authority_boundary);
}

function assertDuplicateResponse(response, insertResponse) {
  assert.equal(response.accepted, true);
  assert.equal(response.inserted, false);
  assert.equal(response.duplicate, true);
  assert.equal(response.event_id, insertResponse.event_id);
  assert.equal(response.idempotency_key, insertResponse.idempotency_key);
  assert.deepEqual(response.event, insertResponse.event);
  assert.equal(response.validation.passed, true);
  assert.deepEqual(response.validation.failure_codes, []);
  assert.equal(response.refusal, null);
  assert.equal(response.route_implemented_now, true);
  assert.equal(response.runtime_write_executed_now, true);
  assert.equal(response.db_open_now, true);
  assert.equal(response.sql_execution_now, true);
  assertAuthorityBoundary(response.authority_boundary);
}

function assertRefusal(db, request, refusalCode) {
  const beforeCount = countRows(db);
  const response = handleFeedbackEventWriteRouteRequest({ body: request, db });
  assert.equal(response.accepted, false);
  assert.equal(response.inserted, false);
  assert.equal(response.duplicate, false);
  assert.equal(response.event_id, null);
  assert.equal(response.event, null);
  assert.equal(response.refusal?.refusal_code, refusalCode);
  assert.deepEqual(response.validation.failure_codes, [refusalCode]);
  assert.equal(response.runtime_write_executed_now, false);
  assert.equal(response.db_open_now, false);
  assert.equal(response.sql_execution_now, false);
  assertAuthorityBoundary(response.authority_boundary);
  assert.equal(countRows(db), beforeCount, `${refusalCode} must not write`);
}

function assertAuthorityBoundary(boundary) {
  assert.equal(boundary.durable_feedback_event, true);
  for (const forbiddenKey of [
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

function assertAuthorityBoundaryRefusalExamples(examples) {
  assertNamedRefusalExamples(examples, authorityBoundaryRefusalCases);
}

function assertCapabilityFlagRefusalExamples(examples) {
  assertNamedRefusalExamples(examples, capabilityFlagRefusalCases);
}

function assertNamedRefusalExamples(examples, cases) {
  assert.ok(examples && typeof examples === "object");
  assert.deepEqual(
    Object.keys(examples).sort(),
    cases.map(([exampleName]) => exampleName).sort(),
  );
  for (const [exampleName, , refusalCode] of cases) {
    const response = examples[exampleName];
    assert.equal(response.accepted, false, `${exampleName} must refuse`);
    assert.equal(response.inserted, false, `${exampleName} must not insert`);
    assert.equal(response.duplicate, false, `${exampleName} must not duplicate`);
    assert.equal(response.event, null, `${exampleName} must not return event`);
    assert.equal(response.refusal?.refusal_code, refusalCode);
    assert.deepEqual(response.validation.failure_codes, [refusalCode]);
    assert.equal(response.runtime_write_executed_now, false);
    assert.equal(response.db_open_now, false);
    assert.equal(response.sql_execution_now, false);
    assertAuthorityBoundary(response.authority_boundary);
  }
}

function buildImplementationFixture() {
  let responses;
  let authorityBoundaryRefusalExamples;
  let capabilityFlagRefusalExamples;
  withTempDb((db) => {
    const validRequest = clone(contractFixture.request_contract);
    const validInsertResponse = handleFeedbackEventWriteRouteRequest({
      body: validRequest,
      db,
    });
    const duplicateResponse = handleFeedbackEventWriteRouteRequest({
      body: validRequest,
      db,
    });
    const missingCorrectionText = clone(validRequest);
    delete missingCorrectionText.correction_text;
    responses = {
      valid_insert_response: validInsertResponse,
      duplicate_response: duplicateResponse,
      missing_ack_refusal_response: handleFeedbackEventWriteRouteRequest({
        body: removeAcknowledgement(validRequest),
        db,
      }),
      retrieval_rag_refusal_response: handleFeedbackEventWriteRouteRequest({
        body: { ...validRequest, requested_authority: { run_rag: true } },
        db,
      }),
      provider_openai_refusal_response: handleFeedbackEventWriteRouteRequest({
        body: { ...validRequest, requested_authority: { call_openai: true } },
        db,
      }),
      source_fetch_refusal_response: handleFeedbackEventWriteRouteRequest({
        body: { ...validRequest, requested_authority: { fetch_source: true } },
        db,
      }),
      codex_github_refusal_response: handleFeedbackEventWriteRouteRequest({
        body: { ...validRequest, requested_authority: { execute_codex: true } },
        db,
      }),
      product_write_refusal_response: handleFeedbackEventWriteRouteRequest({
        body: { ...validRequest, requested_authority: { product_write: true } },
        db,
      }),
      correction_text_missing_refusal_response: handleFeedbackEventWriteRouteRequest({
        body: missingCorrectionText,
        db,
      }),
      operator_note_secret_refusal_response: handleFeedbackEventWriteRouteRequest({
        body: { ...validRequest, operator_note: "do not store OPENAI_API_KEY here" },
        db,
      }),
    };
    authorityBoundaryRefusalExamples = Object.fromEntries(
      authorityBoundaryRefusalCases.map(([exampleName, requestPatch]) => [
        exampleName,
        handleFeedbackEventWriteRouteRequest({
          body: { ...validRequest, ...requestPatch },
          db,
        }),
      ]),
    );
    capabilityFlagRefusalExamples = Object.fromEntries(
      capabilityFlagRefusalCases.map(([exampleName, requestPatch]) => [
        exampleName,
        handleFeedbackEventWriteRouteRequest({
          body: { ...validRequest, ...requestPatch },
          db,
        }),
      ]),
    );
  });
  return {
    fixture_kind: "feedback_event_write_route_implementation_fixture",
    fixture_version: "feedback_event_write_route_implementation.v0.1",
    route_path: routeUrl,
    route_method: routeMethod,
    route_implemented_now: true,
    source_contract_ref: `${contractFixture.contract_version}:${contractFixturePath}`,
    source_contract_fingerprint: contractFixture.contract_fingerprint,
    source_feedback_event_store_ref: `${feedbackStoreFixture.fixture_version}:${feedbackStoreFixturePath}`,
    source_feedback_event_store_version: feedbackStoreFixture.fixture_version,
    source_review_controls_preview_ref: `${reviewControlsFixture.preview_version}:${reviewControlsFixturePath}`,
    source_review_controls_preview_fingerprint: reviewControlsFixture.preview_fingerprint,
    product_write_stopline_ref: "pr:686",
    responses,
    authority_boundary_refusal_examples: authorityBoundaryRefusalExamples,
    capability_flag_refusal_examples: capabilityFlagRefusalExamples,
    validation: {
      passed: true,
      failure_codes: [],
    },
    recommendation_status: recommendationStatus,
    next_recommended_slice: nextRecommendedSlice,
  };
}

function withTempDb(callback) {
  const tempDir = join(tmpdir(), "augnes-feedback-event-write-route-implementation-v0-1");
  const tempDbPath = join(tempDir, "feedback-route.sqlite");
  assert.ok(tempDbPath.startsWith(tmpdir()), "temp DB must be under /tmp");
  rmSync(tempDir, { recursive: true, force: true });
  mkdirSync(tempDir, { recursive: true });
  const db = new Database(tempDbPath);
  try {
    db.exec(feedbackEventStoreSchemaSql);
    callback(db);
  } finally {
    db.close();
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function removeAcknowledgement(request) {
  return {
    ...request,
    authority_acknowledgements: requiredAcknowledgements.filter(
      (acknowledgement) => acknowledgement !== "not_source_fetch",
    ),
  };
}

function countRows(db) {
  const row = db
    .prepare(`SELECT COUNT(*) AS count FROM ${feedbackEventStoreTableName}`)
    .get();
  return row.count;
}

function tableNames(db) {
  return db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
    .all()
    .map((row) => row.name);
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
  return downstreamListRouteContractChangedFiles.every((filePath) =>
    changedFiles.includes(filePath),
  );
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

function stripAssertionText(source) {
  return source
    .split("\n")
    .filter((line) => !line.includes("pattern(["))
    .filter((line) => !line.includes("doesNotMatch"))
    .filter((line) => !line.includes("forbidden"))
    .join("\n");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function unwrapModule(module) {
  return module.default ?? module["module.exports"] ?? module;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function pattern(parts, prefix = "", suffix = "", flags = "") {
  const label = parts.join("");
  return {
    label,
    regex: new RegExp(`${prefix}${parts.map(escapeRegExp).join("")}${suffix}`, flags),
  };
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

function boundedExternalSourceIntakeContractSliceActive() {
  return readChangedFiles().includes("scripts/smoke-bounded-external-source-intake-contract-v0-1.mjs");
}

function assertBoundedExternalSourceIntakeContractPackageScript() {
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
    packageJson.scripts["smoke:bounded-external-source-intake-contract-v0-1"],
    "node scripts/smoke-bounded-external-source-intake-contract-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:bounded-external-source-intake-contract-v0-1"],
    "package.json must add only the Bounded External Source Intake contract smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
}

function assertBoundedExternalSourceIntakeContractChangedFiles(changedFiles) {
  const expectedFiles = [
    "types/bounded-external-source-intake-contract.ts",
    "fixtures/research-candidate-review.bounded-external-source-intake-contract.sample.v0.1.json",
    "scripts/smoke-bounded-external-source-intake-contract-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    "scripts/smoke-salience-governor-browser-validation-v0-1.mjs",
    "scripts/smoke-salience-governor-implementation-v0-1.mjs",
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
    "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
  ];
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const unchangedPath of [
    "lib/research-candidate-review/salience-governor.ts",
    "fixtures/research-candidate-review.salience-governor-implementation.sample.v0.1.json",
    "lib/research-candidate-review/recent-rehearsal-buffer.ts",
    "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `Bounded External Source Intake contract slice must not change ${unchangedPath}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      `unexpected changed file in Bounded External Source Intake contract downstream slice: ${changedFile}`,
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

function salienceGovernorBrowserValidationSliceActive() {
  return readChangedFiles().includes("scripts/smoke-salience-governor-browser-validation-v0-1.mjs");
}

function assertSalienceGovernorBrowserValidationPackageScript() {
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
    packageJson.scripts["smoke:salience-governor-browser-validation-v0-1"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-salience-governor-browser-validation-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:salience-governor-browser-validation-v0-1"],
    "package.json must add only the Salience Governor browser validation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
}

function assertSalienceGovernorBrowserValidationChangedFiles(changedFiles) {
  const expectedFiles =   [
      "fixtures/research-candidate-review.salience-governor-browser-validation.sample.v0.1.json",
      "scripts/smoke-salience-governor-browser-validation-v0-1.mjs",
      "package.json",
      "docs/00_INDEX_LATEST.md",
      "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
      "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
      "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
      "scripts/smoke-salience-governor-implementation-v0-1.mjs",
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
    !changedFiles.includes("lib/research-candidate-review/salience-governor.ts"),
    "Salience Governor browser validation slice must not change the #719 builder",
  );
  assert.ok(
    !changedFiles.includes(
      "fixtures/research-candidate-review.salience-governor-implementation.sample.v0.1.json",
    ),
    "Salience Governor browser validation slice must not change the #719 implementation fixture",
  );
  assert.ok(
    !changedFiles.includes("lib/research-candidate-review/recent-rehearsal-buffer.ts"),
    "Salience Governor browser validation slice must not change the Recent Rehearsal Buffer builder",
  );
  assert.ok(
    !changedFiles.includes(
      "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
    ),
    "Salience Governor browser validation slice must not change the Recent Rehearsal Buffer implementation fixture",
  );
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      `unexpected changed file in Salience Governor browser validation downstream slice: ${changedFile}`,
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
