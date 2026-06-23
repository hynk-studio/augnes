import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const componentPath = "components/feedback-event-controls.tsx";
const foldedAuditPanelPath =
  "components/agent-perspective-substrate-folded-audit-panel.tsx";
const uiContractFixturePath =
  "fixtures/research-candidate-review.feedback-event-controls-ui-contract.sample.v0.1.json";
const reviewControlsFixturePath =
  "fixtures/research-candidate-review.feedback-event-store-review-controls-preview.sample.v0.1.json";
const substratePreviewFixturePath =
  "fixtures/agent-perspective-substrate-preview.sample.v0.1.json";
const implementationFixturePath =
  "fixtures/research-candidate-review.feedback-event-controls-ui-implementation.sample.v0.1.json";
const uiBrowserValidationFixturePath =
  "fixtures/research-candidate-review.feedback-event-controls-ui-browser-validation.sample.v0.1.json";
const smokePath = "scripts/smoke-feedback-event-controls-ui-implementation-v0-1.mjs";
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
const feedbackEventsRouteFilePath = "app/api/research-candidate/feedback-events/route.ts";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";
const uiContractSmokePath =
  "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs";
const browserValidationSmokePath =
  "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs";
const routeImplementationSmokePath =
  "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs";
const routeContractSmokePath =
  "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs";
const reviewControlsSmokePath =
  "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs";
const feedbackEventStoreSmokePath =
  "scripts/smoke-feedback-event-store-minimal-v0-1.mjs";
const foldedAuditPanelSmokePath =
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs";
const previewBuilderSmokePath =
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs";
const substrateSmokePath = "scripts/smoke-agent-perspective-substrate-v0-1.mjs";

const packageScriptName =
  "smoke:feedback-event-controls-ui-implementation-v0-1";
const packageScriptValue = `node ${smokePath}`;
const uiBrowserValidationPackageScriptName =
  "smoke:feedback-event-controls-ui-browser-validation-v0-1";
const uiBrowserValidationPackageScriptValue = `node ${uiBrowserValidationSmokePath}`;
const listRouteContractPackageScriptName =
  "smoke:feedback-event-store-list-route-contract-v0-1";
const listRouteContractPackageScriptValue = `node ${listRouteContractSmokePath}`;
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

const feedbackRoutePath = "/api/research-candidate/feedback-events";
const routeMethod = "POST";
const requestVersion = "feedback_event_write_route_request.v0.1";
const recommendationStatus =
  "ready_for_feedback_event_controls_ui_browser_validation_v0_1";
const nextRecommendedSlice =
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
const uiContractNextRecommendedSlice =
  "feedback_event_controls_ui_implementation_v0_1";
const recentRehearsalBufferContractPackageScriptName =
  "smoke:recent-rehearsal-buffer-contract-v0-1";
const recentRehearsalBufferContractPackageScriptValue =
  "node scripts/smoke-recent-rehearsal-buffer-contract-v0-1.mjs";
const writeFixture = process.argv.includes("--write-fixture");

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

const requiredAuthorityAcknowledgements = [
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
const enabledControlKinds = ["dismiss_preview", "pin_preview"];
const disabledControlKinds = ["correct_preview", "invalidate_preview"];
const expectedChangedFiles = [
  componentPath,
  foldedAuditPanelPath,
  implementationFixturePath,
  smokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  uiContractSmokePath,
  browserValidationSmokePath,
  routeImplementationSmokePath,
  routeContractSmokePath,
  reviewControlsSmokePath,
  feedbackEventStoreSmokePath,
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
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
const downstreamUiBrowserValidationChangedFiles = [
  uiBrowserValidationSmokePath,
  uiBrowserValidationFixturePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  smokePath,
  uiContractSmokePath,
  browserValidationSmokePath,
  routeImplementationSmokePath,
  routeContractSmokePath,
  reviewControlsSmokePath,
  feedbackEventStoreSmokePath,
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs",
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
  smokePath,
  uiContractSmokePath,
  browserValidationSmokePath,
  routeImplementationSmokePath,
  routeContractSmokePath,
  reviewControlsSmokePath,
  feedbackEventStoreSmokePath,
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs",
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
  feedbackEventsRouteFilePath,
  listRouteImplementationFixturePath,
  listRouteImplementationSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  listRouteContractSmokePath,
  uiBrowserValidationSmokePath,
  smokePath,
  uiContractSmokePath,
  browserValidationSmokePath,
  routeImplementationSmokePath,
  routeContractSmokePath,
  reviewControlsSmokePath,
  feedbackEventStoreSmokePath,
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs",
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
  smokePath,
  uiContractSmokePath,
  routeImplementationSmokePath,
  browserValidationSmokePath,
  routeContractSmokePath,
  reviewControlsSmokePath,
  feedbackEventStoreSmokePath,
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs",
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
  smokePath,
  uiContractSmokePath,
  browserValidationSmokePath,
  routeImplementationSmokePath,
  routeContractSmokePath,
  reviewControlsSmokePath,
  feedbackEventStoreSmokePath,
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
  smokePath,
  uiContractSmokePath,
  browserValidationSmokePath,
  routeImplementationSmokePath,
  routeContractSmokePath,
  reviewControlsSmokePath,
  feedbackEventStoreSmokePath,
];
const downstreamListUiImplementationChangedFiles = [
  listUiImplementationComponentPath,
  foldedAuditPanelPath,
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
  smokePath,
  uiBrowserValidationSmokePath,
  uiContractSmokePath,
  feedbackEventStoreSmokePath,
  reviewControlsSmokePath,
  browserValidationSmokePath,
  routeContractSmokePath,
  routeImplementationSmokePath,
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
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
  smokePath,
  uiContractSmokePath,
  browserValidationSmokePath,
  routeImplementationSmokePath,
  routeContractSmokePath,
  reviewControlsSmokePath,
  feedbackEventStoreSmokePath,
];
const allowedComponentFiles = new Set([componentPath, foldedAuditPanelPath]);

for (const filePath of [
  componentPath,
  foldedAuditPanelPath,
  uiContractFixturePath,
  reviewControlsFixturePath,
  substratePreviewFixturePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  uiContractSmokePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}
if (!writeFixture) {
  assert.ok(existsSync(implementationFixturePath), `${implementationFixturePath} must exist`);
}

const componentSource = readFileSync(componentPath, "utf8");
const foldedAuditPanelSource = readFileSync(foldedAuditPanelPath, "utf8");
const uiContractFixture = readJson(uiContractFixturePath);
const reviewControlsFixture = readJson(reviewControlsFixturePath);
const substratePreviewFixture = readJson(substratePreviewFixturePath);
const packageJson = readJson(packagePath);
const indexDoc = readFileSync(indexPath, "utf8");
const substrateDoc = readFileSync(substrateDocPath, "utf8");
const surfaceDoc = readFileSync(surfaceDocPath, "utf8");
const gateDoc = readFileSync(gateDocPath, "utf8");
const uiContractSmokeSource = readFileSync(uiContractSmokePath, "utf8");
const listUiContractSmokeSource = existsSync(listUiContractSmokePath)
  ? readFileSync(listUiContractSmokePath, "utf8")
  : "";

const rebuiltImplementation = buildImplementationFixture();

if (writeFixture) {
  writeFileSync(
    implementationFixturePath,
    `${JSON.stringify(rebuiltImplementation, null, 2)}\n`,
  );
  process.exit(0);
}

const implementationFixture = readJson(implementationFixturePath);

assertPackageScript();
assertStaticBoundary();
assertComponentContract();
assertRequestConstruction();
assertNoForbiddenRuntimePatterns();
assertDocsPointers();
assertUiContractDownstreamPointer();
assertListRouteContractDownstreamPointer();
assertListRouteImplementationDownstreamPointer();
assertListRouteBrowserValidationDownstreamPointer();
assertListUiContractDownstreamPointer();
assertListUiImplementationDownstreamPointer();
assertListUiBrowserValidationDownstreamPointer();
assertImplementationFixture(implementationFixture);
assert.deepEqual(
  implementationFixture,
  rebuiltImplementation,
  "implementation fixture must match rebuilt static summary",
);

console.log(
  JSON.stringify(
    {
      smoke: "feedback-event-controls-ui-implementation-v0-1",
      final_status: "pass",
      enabled_controls: implementationFixture.enabled_controls.map(
        (control) => control.control_kind,
      ),
      disabled_controls: implementationFixture.disabled_controls.map(
        (control) => control.control_kind,
      ),
      route_path: implementationFixture.feedback_event_route_path,
      next_recommended_slice: implementationFixture.next_recommended_slice,
      checked_no_app_server_or_db: true,
      checked_product_write_lane_parked: true,
    },
    null,
    2,
  ),
);

function buildImplementationFixture() {
  const bindingsByKind = new Map(
    uiContractFixture.control_bindings.map((binding) => [
      binding.control_kind,
      binding,
    ]),
  );
  const requestsById = new Map(
    uiContractFixture.request_previews.map((requestPreview) => [
      requestPreview.request_preview_id,
      requestPreview,
    ]),
  );
  const pinControl = summarizeControl(bindingsByKind.get("pin_preview"), requestsById);
  const cardDismissControls = substratePreviewFixture.surfacing_cards.map(
    summarizeCardDismissControl,
  );
  return {
    implementation_kind: "feedback_event_controls_ui_implementation",
    implementation_version: "feedback_event_controls_ui_implementation.v0.1",
    source_ui_contract_ref: `${uiContractFixture.contract_version}:${uiContractFixturePath}`,
    source_ui_contract_fingerprint: uiContractFixture.contract_fingerprint,
    source_review_controls_preview_ref: `${reviewControlsFixture.preview_version}:${reviewControlsFixturePath}`,
    source_substrate_preview_ref: substratePreviewFixturePath,
    enabled_controls: [
      {
        control_kind: "dismiss_preview",
        target_kind: "agent_perspective_substrate_surfacing_card",
        target_scope: "card_specific_visible_surfacing_cards",
        enabled_card_dismiss_control_count: cardDismissControls.length,
        route_path: feedbackRoutePath,
        route_method: routeMethod,
      },
      pinControl,
    ],
    enabled_card_dismiss_controls: cardDismissControls,
    enabled_section_pin_controls: [pinControl],
    disabled_controls: disabledControlKinds.map((controlKind) => ({
      ...summarizeControl(bindingsByKind.get(controlKind), requestsById),
      disabled_reason:
        "Not tied to a stable visible folded audit panel surface in this v0.1 implementation.",
    })),
    browser_request_available_now: true,
    feedback_event_route_path: feedbackRoutePath,
    feedback_event_route_method: routeMethod,
    browser_persistence_used_now: false,
    production_db_used_in_smoke_now: false,
    app_server_started_in_smoke_now: false,
    proof_evidence_write_available: false,
    perspective_promotion_available: false,
    work_mutation_available: false,
    provider_openai_available: false,
    source_fetch_available: false,
    retrieval_rag_available: false,
    codex_github_available: false,
    product_write_available: false,
    product_write_lane_parked_by_686: true,
    validation: {
      static_source_validation_only: true,
      route_handler_invoked_now: false,
      browser_request_executed_in_smoke_now: false,
      component_files_checked: [componentPath, foldedAuditPanelPath],
      enabled_controls_limited_to_substrate_dismiss_and_source_coverage_pin: true,
    },
    recommendation_status: recommendationStatus,
    next_recommended_slice: nextRecommendedSlice,
  };
}

function summarizeCardDismissControl(card) {
  const hasCardSourceRefs = card.source_refs.length > 0;
  const sourceRefIds = hasCardSourceRefs
    ? card.source_refs.map((sourceRef) => sourceRef.source_ref_id)
    : [`${substratePreviewFixturePath}#${card.card_id}`];
  return {
    control_kind: "dismiss_preview",
    card_id: card.card_id,
    target_kind: "agent_perspective_substrate_surfacing_card",
    target_id: card.card_id,
    event_type: "dismiss_preview",
    source_ref_ids: sourceRefIds,
    source_ref_resolution_status: hasCardSourceRefs
      ? "card_source_refs_preserved_with_explicit_boundary_reason"
      : "resolved_repo_local_fixture_fragment_with_explicit_boundary_reason",
    source_ref_resolution_reason: hasCardSourceRefs
      ? `source refs preserved from visible card ${card.card_id}; durable feedback event only`
      : `explicit source coverage boundary for visible card ${card.card_id}: ${
          card.source_coverage_boundary_note ?? "no card source refs present"
        }`,
    route_path: feedbackRoutePath,
    route_method: routeMethod,
  };
}

function summarizeControl(binding, requestsById) {
  assert.ok(binding, "expected control binding must exist");
  const requestPreview = requestsById.get(binding.request_preview_id);
  assert.ok(requestPreview, "expected request preview must exist");
  return {
    control_kind: binding.control_kind,
    target_kind: binding.target_kind,
    target_id: binding.target_id,
    source_control_id: binding.source_control_id,
    request_preview_id: binding.request_preview_id,
    event_type: requestPreview.event_type,
    source_ref_ids: requestPreview.source_ref_ids,
    route_path: binding.route_path,
    route_method: binding.route_method,
  };
}

function assertPackageScript() {
  if (aggregationReadModelBrowserValidationSliceActive()) {
    assert.equal(
      packageJson.scripts[aggregationReadModelBrowserValidationPackageScriptName],
      aggregationReadModelBrowserValidationPackageScriptValue,
    );
  }
  assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
  if (aggregationReadModelImplementationSliceActive()) {
    assert.equal(
      packageJson.scripts[aggregationReadModelImplementationPackageScriptName],
      aggregationReadModelImplementationPackageScriptValue,
    );
  }
  if (aggregationReadModelContractSliceActive()) {
    assert.equal(
      packageJson.scripts[aggregationReadModelContractPackageScriptName],
      aggregationReadModelContractPackageScriptValue,
    );
  } else if (listUiBrowserValidationSliceActive()) {
    assert.equal(
      packageJson.scripts[listUiBrowserValidationPackageScriptName],
      listUiBrowserValidationPackageScriptValue,
    );
  } else if (uiBrowserValidationSliceActive()) {
    assert.equal(
      packageJson.scripts[uiBrowserValidationPackageScriptName],
      uiBrowserValidationPackageScriptValue,
    );
  }
  if (listRouteContractSliceActive()) {
    assert.equal(
      packageJson.scripts[listRouteContractPackageScriptName],
      listRouteContractPackageScriptValue,
    );
  }
  if (listRouteImplementationSliceActive()) {
    assert.equal(
      packageJson.scripts[listRouteImplementationPackageScriptName],
      listRouteImplementationPackageScriptValue,
    );
  }
  if (listRouteBrowserValidationSliceActive()) {
    assert.equal(
      packageJson.scripts[listRouteBrowserValidationPackageScriptName],
      listRouteBrowserValidationPackageScriptValue,
    );
  }
  if (listUiContractSliceActive()) {
    assert.equal(
      packageJson.scripts[listUiContractPackageScriptName],
      listUiContractPackageScriptValue,
    );
  }
  if (listUiImplementationSliceActive()) {
    assert.equal(
      packageJson.scripts[listUiImplementationPackageScriptName],
      listUiImplementationPackageScriptValue,
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

  if (aggregationReadModelBrowserValidationSliceActive()) {
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
  const expectedAddedScriptNames = aggregationReadModelImplementationSliceActive()
    ? [aggregationReadModelImplementationPackageScriptName]
    : aggregationReadModelContractSliceActive()
    ? [aggregationReadModelContractPackageScriptName]
    : listUiBrowserValidationSliceActive()
    ? [listUiBrowserValidationPackageScriptName]
    : listUiImplementationSliceActive()
    ? [listUiImplementationPackageScriptName]
    : listUiContractSliceActive()
    ? [listUiContractPackageScriptName]
    : listRouteBrowserValidationSliceActive()
    ? [listRouteBrowserValidationPackageScriptName]
    : listRouteImplementationSliceActive()
    ? [listRouteImplementationPackageScriptName]
    : listRouteContractSliceActive()
    ? [listRouteContractPackageScriptName]
    : uiBrowserValidationSliceActive()
    ? [uiBrowserValidationPackageScriptName]
    : [packageScriptName];
  assert.deepEqual(
    addedScriptNames,
    expectedAddedScriptNames,
    "package additions must only include the UI implementation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
}

function assertStaticBoundary() {
  const changedFiles = readChangedFiles();
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
  const expectedFiles = aggregationReadModelBrowserValidationSliceActive()
    ? aggregationReadModelBrowserValidationChangedFiles
    : aggregationReadModelImplementationSliceActive()
    ? aggregationReadModelImplementationChangedFiles
    : aggregationReadModelContractSliceActive()
    ? downstreamAggregationReadModelContractChangedFiles
    : listUiBrowserValidationSliceActive()
    ? downstreamListUiBrowserValidationChangedFiles
    : listUiImplementationSliceActive()
    ? downstreamListUiImplementationChangedFiles
    : listUiContractSliceActive()
    ? downstreamListUiContractChangedFiles
    : listRouteBrowserValidationSliceActive()
    ? downstreamListRouteBrowserValidationChangedFiles
    : listRouteImplementationSliceActive()
    ? downstreamListRouteImplementationChangedFiles
    : listRouteContractSliceActive()
    ? downstreamListRouteContractChangedFiles
    : uiBrowserValidationSliceActive()
    ? downstreamUiBrowserValidationChangedFiles
    : expectedChangedFiles;
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      `unexpected changed file in UI implementation slice: ${changedFile}`,
    );
    if (listRouteImplementationSliceActive()) {
      if (changedFile.startsWith("app/api/")) {
        assert.equal(
          changedFile,
          feedbackEventsRouteFilePath,
          "only the existing feedback-events route may change downstream",
        );
      }
    } else {
      assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api files");
    }
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(schema|migration)\b/i);
    if (
      uiBrowserValidationSliceActive() ||
      listRouteContractSliceActive() ||
      listRouteImplementationSliceActive() ||
      listRouteBrowserValidationSliceActive() ||
      listUiContractSliceActive() ||
      listUiBrowserValidationSliceActive() ||
      aggregationReadModelContractSliceActive() ||
      aggregationReadModelImplementationSliceActive()
    ) {
      assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    } else if (listUiImplementationSliceActive()) {
      if (changedFile.startsWith("components/")) {
        assert.ok(
          [listUiImplementationComponentPath, foldedAuditPanelPath].includes(changedFile),
          `only list UI implementation component files may change: ${changedFile}`,
        );
      }
    } else if (changedFile.startsWith("components/")) {
      assert.ok(
        allowedComponentFiles.has(changedFile),
        `only allowed component files may change: ${changedFile}`,
      );
    }
    if (
      changedFile !==
      "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs"
    ) {
      if (listRouteImplementationSliceActive() && changedFile === feedbackEventsRouteFilePath) {
        continue;
      }
      assert.doesNotMatch(
        changedFile,
        /^app\/api|product-write|product_write/i,
        "must not change route or product write files",
      );
    }
  }
}

function assertComponentContract() {
  assert.match(componentSource, /export function FeedbackEventControls\b/);
  assert.match(componentSource, /useState/);
  assert.match(componentSource, /pending/);
  assert.match(componentSource, /success/);
  assert.match(componentSource, /error/);
  assert.match(componentSource, /duplicate/i);
  assert.match(componentSource, /refusal_code/);
  assert.match(componentSource, /validation failure codes/);
  assert.match(componentSource, /durable feedback event only/);
  assert.match(componentSource, /not proof\/evidence/);
  assert.match(componentSource, /not Perspective promotion/);
  assert.match(componentSource, /not work mutation/);
  assert.match(componentSource, /not retrieval\/RAG/);
  assert.match(componentSource, /not product write/);
  assert.match(foldedAuditPanelSource, /import \{ FeedbackEventControls \}/);
  assert.match(foldedAuditPanelSource, /feedback-event-controls-ui-contract/);
  assert.match(foldedAuditPanelSource, /getDismissFeedbackControlsForCard\(card\)/);
  assert.match(foldedAuditPanelSource, /function getDismissFeedbackControlsForCard/);
  assert.doesNotMatch(
    foldedAuditPanelSource,
    /getFeedbackControlsForKinds\(\["dismiss_preview"\]\)/,
  );
  assert.match(foldedAuditPanelSource, /getFeedbackControlsForKinds\(\["pin_preview"\]\)/);
  assert.match(foldedAuditPanelSource, /target_id:\s*card\.card_id/);
  assert.match(foldedAuditPanelSource, /visible surfacing card \$\{card\.card_id\}/);
  assert.match(foldedAuditPanelSource, /no direct DB\/SQL in UI/);
  assert.match(
    foldedAuditPanelSource,
    /feedback route writes durable feedback events only/,
  );
  assert.doesNotMatch(foldedAuditPanelSource, /No durable action in this slice\./);
  assert.match(
    foldedAuditPanelSource,
    /Suggested action labels above remain preview-only\. Feedback controls may\s+write durable feedback events only\./,
  );
  assert.doesNotMatch(
    foldedAuditPanelSource,
    /getFeedbackControlsForKinds\(\["correct_preview"\]\)/,
  );
  assert.doesNotMatch(
    foldedAuditPanelSource,
    /getFeedbackControlsForKinds\(\["invalidate_preview"\]\)/,
  );
}

function assertRequestConstruction() {
  assert.ok(componentSource.includes(feedbackRoutePath), "component must include route path");
  assert.equal(countMatches(componentSource, /\/api\//g), 1, "only one API route string is allowed");
  assert.match(componentSource, /fetch\(feedbackEventRoutePath/);
  assert.doesNotMatch(componentSource, /fetch\(["'`]/, "fetch must use the route constant");
  assert.match(componentSource, /method:\s*"POST"/);
  assert.match(componentSource, new RegExp(requestVersion));
  for (const acknowledgement of requiredAuthorityAcknowledgements) {
    assert.ok(
      uiContractFixture.request_previews.every((requestPreview) =>
        requestPreview.authority_acknowledgements.includes(acknowledgement),
      ),
      `UI contract request previews must include ${acknowledgement}`,
    );
  }
  assert.ok(componentSource.includes("authority_acknowledgements"));
  assert.ok(componentSource.includes("not_retrieval_rag_execution"));
  assert.ok(componentSource.includes("product_write_lane_parked_by_686"));
  assert.doesNotMatch(componentSource, /idempotency_key_preview/);
  for (const forbiddenTrueFlag of [
    "retrieval_rag_authority: true",
    "source_fetch_authority: true",
    "provider_openai_authority: true",
    "product_write_authority: true",
    "product_id_allocation_authority: true",
    "proof_or_evidence_record: true",
    "perspective_promotion: true",
    "work_mutation: true",
    "execution_authority: true",
  ]) {
    assert.ok(
      !componentSource.includes(forbiddenTrueFlag),
      `request construction must not include ${forbiddenTrueFlag}`,
    );
  }
}

function assertNoForbiddenRuntimePatterns() {
  if (listUiBrowserValidationSliceActive() || aggregationReadModelContractSliceActive()) return;
  const changedSourceFiles = readChangedFiles().filter((filePath) =>
    filePath.endsWith(".mjs") || filePath.endsWith(".ts") || filePath.endsWith(".tsx"),
  );
  for (const filePath of changedSourceFiles) {
    const source = filePath.endsWith(".mjs")
      ? stripSmokeAssertionText(readFileSync(filePath, "utf8"))
      : readFileSync(filePath, "utf8");
    assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|document\.cookie/);
    assert.doesNotMatch(source, /XMLHttpRequest|WebSocket|EventSource|sendBeacon/);
    assert.doesNotMatch(source, /from\s+["'][^"']*openai["']/i);
    assert.doesNotMatch(source, /new\s+OpenAI\b/i);
    assert.doesNotMatch(source, /Octokit|api\.github\.com/i);
    assert.doesNotMatch(source, /\bcodex\s+(exec|run)\b/i);
    assert.doesNotMatch(source, /\bgh\s+pr\b/i);
    assert.doesNotMatch(source, /\bnext\s+(dev|start)\b/i);
    assert.doesNotMatch(source, /\bcreateProof\b|\binsertProof\b/);
    assert.doesNotMatch(source, /\bcreateEvidence\b|\binsertEvidence\b/);
    assert.doesNotMatch(source, /\bmutateWork\b|\bupdateWork\b/);
    assert.doesNotMatch(source, /\bpromotePerspective\b/);
    assert.doesNotMatch(source, /\bexecuteProductWrite\b|\ballocateProductId\b/i);
  }
}

function assertDocsPointers() {
  for (const requiredText of [
    "Feedback Event controls UI implementation v0.1",
    componentPath,
    foldedAuditPanelPath,
    implementationFixturePath,
    smokePath,
    packageScriptName,
    "enables only dismiss/pin controls in folded audit panel",
    "correct/invalidate remain disabled",
    "writes durable feedback event only through existing route",
    "no proof/evidence/Perspective promotion/work mutation",
    "no Codex/GitHub automation/external handoff",
    "no provider/OpenAI/source-fetch/retrieval/RAG execution",
    "no product write/product IDs",
    nextRecommendedSlice,
  ]) {
    assert.ok(indexDoc.includes(requiredText), `index must include ${requiredText}`);
  }
  for (const doc of [substrateDoc, surfaceDoc, gateDoc]) {
    assert.match(doc, /Feedback Event controls UI implementation/i);
    assert.match(doc, /dismiss\/pin|dismiss and pin|dismiss_preview.*pin_preview/is);
    assert.match(doc, /durable feedback events? only/i);
    assert.match(doc, /no proof\/evidence/i);
    assert.match(doc, /no Perspective promotion|does not mutate substrate/i);
    assert.match(doc, /no work mutation|work/i);
    assert.match(doc, /no retrieval\/RAG execution|no retrieval\/RAG/i);
    assert.match(doc, /no provider\/OpenAI/i);
    assert.match(doc, /no source fetch|source-fetch/i);
    assert.match(doc, /no product write/i);
    assert.match(doc, /#686/);
    assert.match(doc, new RegExp(nextRecommendedSlice));
  }
}

function assertUiContractDownstreamPointer() {
  for (const requiredText of [
    packageScriptName,
    nextRecommendedSlice,
    implementationFixturePath,
    smokePath,
    recommendationStatus,
  ]) {
    assert.ok(
      uiContractSmokeSource.includes(requiredText),
      `#700 UI contract smoke must allow UI implementation text: ${requiredText}`,
    );
  }
  assert.equal(uiContractFixture.next_recommended_slice, uiContractNextRecommendedSlice);
}

function assertListRouteContractDownstreamPointer() {
  if (!listRouteContractSliceActive()) return;
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
    implementationFixture.next_recommended_slice,
    "feedback_event_controls_ui_browser_validation_v0_1",
  );
}

function assertListRouteImplementationDownstreamPointer() {
  if (!listRouteImplementationSliceActive()) return;
  for (const filePath of [
    feedbackEventsRouteFilePath,
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
    implementationFixture.next_recommended_slice,
    "feedback_event_controls_ui_browser_validation_v0_1",
  );
}

function assertListRouteBrowserValidationDownstreamPointer() {
  if (!listRouteBrowserValidationSliceActive()) return;
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
    implementationFixture.next_recommended_slice,
    "feedback_event_controls_ui_browser_validation_v0_1",
  );
}

function assertListUiContractDownstreamPointer() {
  if (!listUiContractSliceActive()) return;
  for (const requiredText of [
    listUiContractPackageScriptName,
    listUiContractFixturePath,
    listUiContractSmokePath,
    listUiContractRecommendationStatus,
    listUiContractNextRecommendedSlice,
    "buildFeedbackEventStoreListUiContract",
  ]) {
    assert.ok(
      listUiContractSmokeSource.includes(requiredText),
      `#701 UI implementation smoke must allow list UI contract text: ${requiredText}`,
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
    implementationFixture.next_recommended_slice,
    "feedback_event_controls_ui_browser_validation_v0_1",
  );
}

function assertListUiImplementationDownstreamPointer() {
  if (!listUiImplementationSliceActive()) return;
  for (const requiredText of [
    listUiImplementationPackageScriptName,
    listUiImplementationFixturePath,
    listUiImplementationSmokePath,
    listUiImplementationRecommendationStatus,
    listUiImplementationNextRecommendedSlice,
  ]) {
    assert.ok(
      readFileSync(listUiImplementationSmokePath, "utf8").includes(requiredText) ||
        listUiContractSmokeSource.includes(requiredText),
      `#701 UI implementation smoke must allow list UI implementation text: ${requiredText}`,
    );
  }
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
    implementationFixture.next_recommended_slice,
    "feedback_event_controls_ui_browser_validation_v0_1",
  );
}

function assertListUiBrowserValidationDownstreamPointer() {
  if (!listUiBrowserValidationSliceActive()) return;
  for (const requiredText of [
    listUiBrowserValidationPackageScriptName,
    listUiBrowserValidationFixturePath,
    listUiBrowserValidationSmokePath,
    listUiBrowserValidationRecommendationStatus,
    listUiBrowserValidationNextRecommendedSlice,
  ]) {
    assert.ok(
      readFileSync(listUiBrowserValidationSmokePath, "utf8").includes(requiredText),
      `#701 UI implementation smoke must allow list UI browser validation text: ${requiredText}`,
    );
  }
}

function uiBrowserValidationSliceActive() {
  const changedFiles = readChangedFiles();
  return downstreamUiBrowserValidationChangedFiles.every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function listRouteContractSliceActive() {
  const changedFiles = readChangedFiles();
  return downstreamListRouteContractChangedFiles.every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function listRouteImplementationSliceActive() {
  const changedFiles = readChangedFiles();
  return downstreamListRouteImplementationChangedFiles.every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function listRouteBrowserValidationSliceActive() {
  const changedFiles = readChangedFiles();
  return downstreamListRouteBrowserValidationChangedFiles.every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function listUiContractSliceActive() {
  const changedFiles = readChangedFiles();
  return downstreamListUiContractChangedFiles.every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function listUiImplementationSliceActive() {
  const changedFiles = readChangedFiles();
  return downstreamListUiImplementationChangedFiles.every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function listUiBrowserValidationSliceActive() {
  const changedFiles = readChangedFiles();
  return downstreamListUiBrowserValidationChangedFiles.every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function aggregationReadModelBrowserValidationSliceActive() {
  return readChangedFiles().includes(aggregationReadModelBrowserValidationSmokePath);
}

function aggregationReadModelImplementationSliceActive() {
  return readChangedFiles().includes(aggregationReadModelImplementationSmokePath);
}

function aggregationReadModelContractSliceActive() {
  return readChangedFiles().includes(aggregationReadModelContractSmokePath);
}

function assertImplementationFixture(value) {
  assert.equal(value.implementation_kind, "feedback_event_controls_ui_implementation");
  assert.equal(value.implementation_version, "feedback_event_controls_ui_implementation.v0.1");
  assert.equal(value.browser_request_available_now, true);
  assert.equal(value.feedback_event_route_path, feedbackRoutePath);
  assert.equal(value.feedback_event_route_method, routeMethod);
  assert.equal(value.browser_persistence_used_now, false);
  assert.equal(value.production_db_used_in_smoke_now, false);
  assert.equal(value.app_server_started_in_smoke_now, false);
  assert.equal(value.proof_evidence_write_available, false);
  assert.equal(value.perspective_promotion_available, false);
  assert.equal(value.work_mutation_available, false);
  assert.equal(value.provider_openai_available, false);
  assert.equal(value.source_fetch_available, false);
  assert.equal(value.retrieval_rag_available, false);
  assert.equal(value.codex_github_available, false);
  assert.equal(value.product_write_available, false);
  assert.equal(value.product_write_lane_parked_by_686, true);
  assert.deepEqual(
    value.enabled_controls.map((control) => control.control_kind),
    enabledControlKinds,
  );
  assertCardSpecificDismissControls(value);
  assertSectionLevelPinControls(value);
  assert.deepEqual(
    value.disabled_controls.map((control) => control.control_kind),
    disabledControlKinds,
  );
  assert.equal(value.recommendation_status, recommendationStatus);
  assert.equal(value.next_recommended_slice, nextRecommendedSlice);
}

function assertCardSpecificDismissControls(value) {
  assert.ok(Array.isArray(value.enabled_card_dismiss_controls));
  assert.equal(
    value.enabled_card_dismiss_controls.length,
    substratePreviewFixture.surfacing_cards.length,
  );
  const visibleCardsById = new Map(
    substratePreviewFixture.surfacing_cards.map((card) => [card.card_id, card]),
  );
  for (const control of value.enabled_card_dismiss_controls) {
    const card = visibleCardsById.get(control.card_id);
    assert.ok(card, `dismiss control card_id must be visible: ${control.card_id}`);
    assert.equal(
      control.target_id,
      card.card_id,
      `dismiss target_id must equal visible card_id for ${card.card_id}`,
    );
    assert.notEqual(
      control.target_id,
      "substrate_card:reviewed_non_authoritative_context",
      "card-level dismiss controls must not reuse the generic #700 fixture target",
    );
    assert.equal(control.target_kind, "agent_perspective_substrate_surfacing_card");
    assert.equal(control.route_path, feedbackRoutePath);
    assert.equal(control.route_method, routeMethod);
    assert.ok(control.source_ref_ids.length > 0);
    if (card.source_refs.length > 0) {
      assert.deepEqual(
        control.source_ref_ids,
        card.source_refs.map((sourceRef) => sourceRef.source_ref_id),
      );
    } else {
      assert.deepEqual(control.source_ref_ids, [
        `${substratePreviewFixturePath}#${card.card_id}`,
      ]);
    }
    assert.ok(
      control.source_ref_resolution_reason,
      `dismiss control ${card.card_id} must carry an explicit source-ref boundary reason`,
    );
    assertSourceRefsResolveOrHaveBoundaryReason(control);
  }
  assert.ok(
    new Set(value.enabled_card_dismiss_controls.map((control) => control.target_id)).size > 1,
    "card-level dismiss controls must not all share one target_id",
  );
}

function assertSectionLevelPinControls(value) {
  assert.ok(Array.isArray(value.enabled_section_pin_controls));
  assert.equal(value.enabled_section_pin_controls.length, 1);
  const [pinControl] = value.enabled_section_pin_controls;
  assert.equal(pinControl.control_kind, "pin_preview");
  assert.equal(pinControl.target_kind, "agent_perspective_substrate_folded_section");
  assert.equal(pinControl.target_id, "folded_section:source_coverage");
}

function assertSourceRefsResolveOrHaveBoundaryReason(control) {
  for (const sourceRefId of control.source_ref_ids) {
    if (sourceRefId.startsWith("fixture:")) {
      assert.ok(
        control.source_ref_resolution_reason,
        `fixture lineage source ref ${sourceRefId} requires explicit boundary reason`,
      );
      continue;
    }
    if (sourceRefId.startsWith("pr:")) {
      assert.ok(
        control.source_ref_resolution_reason,
        `external lineage source ref ${sourceRefId} requires explicit boundary reason`,
      );
      continue;
    }
    const filePath = sourceRefId.split("#")[0];
    assert.ok(existsSync(filePath), `repo-local source ref must exist: ${sourceRefId}`);
  }
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}


function recentRehearsalBufferContractSliceActive() {
  return readChangedFiles().includes("scripts/smoke-recent-rehearsal-buffer-contract-v0-1.mjs");
}

function readGitOutput(args) {
  return execFileSync("git", args, { encoding: "utf8" });
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
  return readGitOutput(["merge-base", "HEAD", "origin/main"]).trim();
}

function readChangedFiles() {
  return [
    ...readGitOutput(["diff", "--name-only", mergeBaseRef()]).split("\n"),
    ...readGitOutput(["ls-files", "--others", "--exclude-standard"]).split("\n"),
  ]
    .map((line) => line.trim())
    .filter(Boolean)
    .sort();
}

function extractScriptName(line) {
  const match = line.match(/^\+\s*"([^"]+)":\s*"/);
  return match?.[1] ?? null;
}

function countMatches(source, regex) {
  return source.match(regex)?.length ?? 0;
}

function stripSmokeAssertionText(source) {
  return source
    .split("\n")
    .filter((line) => !line.includes("assert.doesNotMatch"))
    .filter((line) => !line.includes("assert.match"))
    .filter((line) => !line.includes("pattern("))
    .filter((line) => !line.includes("localStorage"))
    .filter((line) => !line.includes("sessionStorage"))
    .filter((line) => !line.includes("indexedDB"))
    .filter((line) => !line.includes("document.cookie"))
    .filter((line) => !line.includes("XMLHttpRequest"))
    .filter((line) => !line.includes("WebSocket"))
    .filter((line) => !line.includes("EventSource"))
    .filter((line) => !line.includes("sendBeacon"))
    .filter((line) => !line.includes("OpenAI"))
    .filter((line) => !line.includes("GitHub"))
    .filter((line) => !line.includes("github"))
    .filter((line) => !line.includes("gh\\s+pr"))
    .filter((line) => !line.includes("gh pr"))
    .filter((line) => !line.includes("Octokit"))
    .filter((line) => !line.includes("Codex"))
    .filter((line) => !line.includes("retrieval"))
    .filter((line) => !line.includes("source fetch"))
    .filter((line) => !line.includes("product write"))
    .filter((line) => !line.includes("executeProductWrite"))
    .filter((line) => !line.includes("allocateProductId"))
    .filter((line) => !line.includes("productDbWrite"))
    .filter((line) => !line.includes("next dev"))
    .filter((line) => !line.includes("next start"))
    .join("\n");
}
