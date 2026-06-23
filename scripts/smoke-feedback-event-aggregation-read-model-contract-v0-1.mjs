import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

let cachedMergeBaseRef = null;


const typePath = "types/feedback-event-aggregation-read-model-contract.ts";
const fixturePath =
  "fixtures/research-candidate-review.feedback-event-aggregation-read-model-contract.sample.v0.1.json";
const smokePath =
  "scripts/smoke-feedback-event-aggregation-read-model-contract-v0-1.mjs";
const feedbackStoreFixturePath =
  "fixtures/research-candidate-review.feedback-event-store.sample.v0.1.json";
const listRouteContractFixturePath =
  "fixtures/research-candidate-review.feedback-event-store-list-route-contract.sample.v0.1.json";
const listUiBrowserValidationFixturePath =
  "fixtures/research-candidate-review.feedback-event-store-list-ui-browser-validation.sample.v0.1.json";
const listUiBrowserValidationSmokePath =
  "scripts/smoke-feedback-event-store-list-ui-browser-validation-v0-1.mjs";
const listUiImplementationSmokePath =
  "scripts/smoke-feedback-event-store-list-ui-implementation-v0-1.mjs";
const listUiContractSmokePath =
  "scripts/smoke-feedback-event-store-list-ui-contract-v0-1.mjs";
const listRouteBrowserValidationSmokePath =
  "scripts/smoke-feedback-event-store-list-route-browser-validation-v0-1.mjs";
const listRouteImplementationSmokePath =
  "scripts/smoke-feedback-event-store-list-route-implementation-v0-1.mjs";
const listRouteContractSmokePath =
  "scripts/smoke-feedback-event-store-list-route-contract-v0-1.mjs";
const controlsUiBrowserValidationSmokePath =
  "scripts/smoke-feedback-event-controls-ui-browser-validation-v0-1.mjs";
const controlsUiImplementationSmokePath =
  "scripts/smoke-feedback-event-controls-ui-implementation-v0-1.mjs";
const controlsUiContractSmokePath =
  "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs";
const writeRouteBrowserValidationSmokePath =
  "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs";
const writeRouteImplementationSmokePath =
  "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs";
const writeRouteContractSmokePath =
  "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs";
const reviewControlsSmokePath =
  "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs";
const feedbackEventStoreMinimalSmokePath =
  "scripts/smoke-feedback-event-store-minimal-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";
const implementationBuilderPath =
  "lib/research-candidate-review/feedback-event-aggregation-read-model.ts";
const implementationFixturePath =
  "fixtures/research-candidate-review.feedback-event-aggregation-read-model-implementation.sample.v0.1.json";
const implementationSmokePath =
  "scripts/smoke-feedback-event-aggregation-read-model-implementation-v0-1.mjs";
const browserValidationFixturePath =
  "fixtures/research-candidate-review.feedback-event-aggregation-read-model-browser-validation.sample.v0.1.json";
const browserValidationSmokePath =
  "scripts/smoke-feedback-event-aggregation-read-model-browser-validation-v0-1.mjs";
const formationReceiptDurableEventContractTypePath =
  "types/formation-receipt-durable-event-contract.ts";
const formationReceiptDurableEventContractFixturePath =
  "fixtures/research-candidate-review.formation-receipt-durable-event-contract.sample.v0.1.json";
const formationReceiptDurableEventContractSmokePath =
  "scripts/smoke-formation-receipt-durable-event-contract-v0-1.mjs";

const packageScriptName =
  "smoke:feedback-event-aggregation-read-model-contract-v0-1";
const packageScriptValue =
  "node scripts/smoke-feedback-event-aggregation-read-model-contract-v0-1.mjs";
const implementationPackageScriptName =
  "smoke:feedback-event-aggregation-read-model-implementation-v0-1";
const implementationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-feedback-event-aggregation-read-model-implementation-v0-1.mjs";
const browserValidationPackageScriptName =
  "smoke:feedback-event-aggregation-read-model-browser-validation-v0-1";
const browserValidationPackageScriptValue =
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
const recentRehearsalBufferContractPackageScriptName =
  "smoke:recent-rehearsal-buffer-contract-v0-1";
const recentRehearsalBufferContractPackageScriptValue =
  "node scripts/smoke-recent-rehearsal-buffer-contract-v0-1.mjs";
const recentRehearsalBufferImplementationPackageScriptName =
  "smoke:recent-rehearsal-buffer-implementation-v0-1";
const recentRehearsalBufferImplementationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-recent-rehearsal-buffer-implementation-v0-1.mjs";
const contractKind = "feedback_event_aggregation_read_model_contract";
const contractVersion = "feedback_event_aggregation_read_model_contract.v0.1";
const routePath = "/api/research-candidate/feedback-events";
const routeMethod = "GET";
const requestVersion = "feedback_event_store_list_route_request.v0.1";
const recommendationStatus =
  "ready_for_feedback_event_aggregation_read_model_implementation_v0_1";
const nextRecommendedSlice =
  "feedback_event_aggregation_read_model_implementation_v0_1";
const implementationRecommendationStatus =
  "ready_for_feedback_event_aggregation_read_model_browser_validation_v0_1";
const implementationNextRecommendedSlice =
  "feedback_event_aggregation_read_model_browser_validation_v0_1";
const browserValidationRecommendationStatus =
  "ready_for_formation_receipt_durable_event_contract_v0_1";
const browserValidationNextRecommendedSlice =
  "formation_receipt_durable_event_contract_v0_1";
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

const allowedEventTypes = [
  "dismiss_preview",
  "pin_preview",
  "correct_preview",
  "invalidate_preview",
];
const allowedTargetKinds = [
  "agent_perspective_substrate_surfacing_card",
  "agent_perspective_substrate_folded_section",
  "candidate_to_codex_handoff_draft",
  "candidate_to_codex_handoff_draft_review",
  "candidate_to_codex_handoff_operator_decision_preview",
  "research_candidate_review_object",
  "research_candidate_ai_context_packet",
  "perspective_geometry_digest",
];
const aggregationDimensions = [
  "event_type",
  "target_kind",
  "target_id",
  "created_at_day",
  "source_ref_id",
  "duplicate_group",
  "idempotency_key_pattern",
  "operator_note_presence",
  "reason_presence",
];
const viewIds = [
  "feedback_event_counts_by_event_type",
  "feedback_event_counts_by_target_kind",
  "feedback_event_counts_by_target",
  "duplicate_feedback_groups",
  "recent_feedback_event_window_preview",
  "pinned_or_dismissed_target_summary",
  "operator_note_presence_summary",
  "source_ref_feedback_summary",
  "authority_boundary_summary",
];
const expectedChangedFiles = [
  typePath,
  fixturePath,
  smokePath,
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
  controlsUiBrowserValidationSmokePath,
  controlsUiImplementationSmokePath,
  controlsUiContractSmokePath,
  writeRouteBrowserValidationSmokePath,
  writeRouteImplementationSmokePath,
  writeRouteContractSmokePath,
  reviewControlsSmokePath,
  feedbackEventStoreMinimalSmokePath,
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
const downstreamImplementationChangedFiles = [
  implementationBuilderPath,
  implementationFixturePath,
  implementationSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  smokePath,
  listUiBrowserValidationSmokePath,
  listUiImplementationSmokePath,
  listUiContractSmokePath,
  listRouteBrowserValidationSmokePath,
  listRouteImplementationSmokePath,
  listRouteContractSmokePath,
  controlsUiBrowserValidationSmokePath,
  controlsUiImplementationSmokePath,
  controlsUiContractSmokePath,
  writeRouteBrowserValidationSmokePath,
  writeRouteImplementationSmokePath,
  writeRouteContractSmokePath,
  reviewControlsSmokePath,
  feedbackEventStoreMinimalSmokePath,
];
const downstreamBrowserValidationChangedFiles = [
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
const downstreamFormationReceiptDurableEventContractChangedFiles = [
  formationReceiptDurableEventContractTypePath,
  formationReceiptDurableEventContractFixturePath,
  formationReceiptDurableEventContractSmokePath,
  browserValidationSmokePath,
  implementationSmokePath,
  smokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
];

for (const filePath of [
  typePath,
  smokePath,
  feedbackStoreFixturePath,
  listRouteContractFixturePath,
  listUiBrowserValidationFixturePath,
  listUiBrowserValidationSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}
if (!writeFixture) {
  assert.ok(existsSync(fixturePath), `${fixturePath} must exist`);
}

const typeSource = readFile(typePath);
const smokeSource = readFile(smokePath);
const listUiBrowserValidationSmokeSource = readFile(listUiBrowserValidationSmokePath);
const packageJson = readJson(packagePath);
const basePackageJson = readJsonFromGit(packagePath);
const feedbackStoreFixture = readJson(feedbackStoreFixturePath);
const listRouteContractFixture = readJson(listRouteContractFixturePath);
const listUiBrowserValidationFixture = readJson(listUiBrowserValidationFixturePath);
const indexDoc = readFile(indexPath);
const substrateDoc = readFile(substrateDocPath);
const surfaceDoc = readFile(surfaceDocPath);
const gateDoc = readFile(gateDocPath);
const rebuiltFixture = buildContractFixture();

if (writeFixture) {
  writeFileSync(fixturePath, `${JSON.stringify(rebuiltFixture, null, 2)}\n`);
  process.exit(0);
}

const contractFixture = readJson(fixturePath);

assertTypeContract();
assertPackageScript();
assertStaticBoundary();
assertNoForbiddenRuntimePatterns();
assertReadModelViews(contractFixture);
assertDuplicateFeedbackPolicy(contractFixture.duplicate_feedback_policy);
assertTrendWindowPolicy(contractFixture.trend_window_policy);
assertAuthorityBoundary(contractFixture.authority_boundary);
assertValidationPolicy(contractFixture.validation_policy);
assertDocsPointers();
assertListUiBrowserValidationSmokeDownstreamPointer();
assert.deepEqual(
  contractFixture,
  rebuiltFixture,
  "rebuilt feedback event aggregation read model contract fixture must match committed fixture",
);

console.log(
  JSON.stringify(
    {
      smoke: "feedback-event-aggregation-read-model-contract-v0-1",
      final_status: "pass",
      contract_kind: contractFixture.contract_kind,
      contract_version: contractFixture.contract_version,
      view_count: contractFixture.read_model_views.length,
      runtime_read_model_implemented_now:
        contractFixture.authority_boundary.runtime_read_model_implemented_now,
      runtime_db_query_now: contractFixture.authority_boundary.runtime_db_query_now,
      browser_request_now: contractFixture.authority_boundary.browser_request_now,
      salience_authority: contractFixture.authority_boundary.salience_authority,
      product_write_lane_parked_by_686:
        contractFixture.authority_boundary.product_write_lane_parked_by_686,
      next_recommended_slice: contractFixture.next_recommended_slice,
    },
    null,
    2,
  ),
);

function buildContractFixture() {
  const events = [...feedbackStoreFixture.events].sort(compareEventsAsc);
  const fixture = {
    contract_kind: contractKind,
    contract_version: contractVersion,
    source_feedback_event_store_ref: `${feedbackStoreFixture.fixture_version}:${feedbackStoreFixturePath}`,
    source_list_route_ref: `${listRouteContractFixture.contract_version}:${listRouteContractFixturePath}`,
    source_list_ui_browser_validation_ref: `${listUiBrowserValidationFixture.validation_version}:${listUiBrowserValidationFixturePath}`,
    aggregation_inputs: {
      durable_feedback_events_only: true,
      source_route_path: routePath,
      source_route_method: routeMethod,
      source_request_version: requestVersion,
      allowed_event_types: allowedEventTypes,
      allowed_target_kinds: allowedTargetKinds,
      no_runtime_read_now: true,
      no_db_query_now: true,
      fixture_backed_only: true,
    },
    aggregation_dimensions: aggregationDimensions,
    read_model_views: buildReadModelViews(events),
    duplicate_feedback_policy: {
      duplicate_detection_keys: ["event_type", "target_kind", "target_id"],
      idempotency_key_duplicates_grouped_separately: true,
      display_read_model_indicators_only: true,
      delete_feedback_events: false,
      rewrite_feedback_events: false,
      suppress_feedback_events: false,
      mutate_feedback_events: false,
      decides_promotion: false,
      decides_proof_or_evidence: false,
      decides_work_status: false,
      decides_product_write: false,
    },
    trend_window_policy: {
      static_preview_windows_only: true,
      preview_windows: [
        "created_at_day_preview",
        "recent_feedback_event_window_preview",
      ],
      no_runtime_scheduler: true,
      no_auto_refresh: true,
      no_polling: true,
      no_durable_window_state: true,
      no_salience_authority: true,
    },
    authority_boundary: {
      contract_only: true,
      read_model_defined_now: true,
      runtime_read_model_implemented_now: false,
      runtime_db_query_now: false,
      route_changed_now: false,
      feedback_events_read_now: false,
      feedback_events_written_now: false,
      feedback_events_mutated_now: false,
      browser_request_now: false,
      browser_persistence_now: false,
      proof_or_evidence_record: false,
      perspective_promotion: false,
      durable_perspective_state_write: false,
      promotion_decision_record: false,
      work_mutation: false,
      execution_authority: false,
      codex_execution_authority: false,
      github_automation_authority: false,
      external_handoff_authority: false,
      provider_openai_authority: false,
      retrieval_rag_authority: false,
      source_fetch_authority: false,
      salience_authority: false,
      product_write_authority: false,
      product_id_allocation_authority: false,
      product_write_lane_parked_by_686: true,
    },
    validation_policy: {
      static_source_validation_only: true,
      fixture_backed_only: true,
      app_server_started_now: false,
      production_db_used_now: false,
      runtime_browser_request_now: false,
    },
    validation: {
      passed: true,
      failure_codes: [],
    },
    recommendation_status: recommendationStatus,
    next_recommended_slice: nextRecommendedSlice,
    contract_fingerprint: "",
    fingerprint_algorithm: "fnv1a32_canonical_json",
  };
  fixture.contract_fingerprint = createFingerprint(fixture);
  return fixture;
}

function buildReadModelViews(events) {
  return [
    view({
      view_id: "feedback_event_counts_by_event_type",
      input_event_selector: baseSelector(),
      grouping_keys: ["event_type"],
      output_fields: ["event_type", "event_count", "latest_created_at"],
      sort_policy: { order_by: ["event_type ASC"], deterministic: true },
      limit_policy: { default_limit: 50, max_limit: 100, runtime_override_now: false },
      sample_grouped_outputs: countBy(events, ["event_type"]).map((row) => ({
        event_type: row.event_type,
        event_count: row.event_count,
        latest_created_at: row.latest_created_at,
      })),
    }),
    view({
      view_id: "feedback_event_counts_by_target_kind",
      input_event_selector: baseSelector(),
      grouping_keys: ["target_kind"],
      output_fields: ["target_kind", "event_count", "latest_created_at"],
      sort_policy: { order_by: ["event_count DESC", "target_kind ASC"], deterministic: true },
      limit_policy: { default_limit: 50, max_limit: 100, runtime_override_now: false },
      sample_grouped_outputs: countBy(events, ["target_kind"]).map((row) => ({
        target_kind: row.target_kind,
        event_count: row.event_count,
        latest_created_at: row.latest_created_at,
      })),
    }),
    view({
      view_id: "feedback_event_counts_by_target",
      input_event_selector: baseSelector(),
      grouping_keys: ["target_kind", "target_id"],
      output_fields: [
        "target_kind",
        "target_id",
        "event_count",
        "event_types",
        "latest_created_at",
      ],
      sort_policy: {
        order_by: ["event_count DESC", "target_kind ASC", "target_id ASC"],
        deterministic: true,
      },
      limit_policy: { default_limit: 50, max_limit: 100, runtime_override_now: false },
      sample_grouped_outputs: countBy(events, ["target_kind", "target_id"]).map((row) => ({
        target_kind: row.target_kind,
        target_id: row.target_id,
        event_count: row.event_count,
        event_types: row.event_types,
        latest_created_at: row.latest_created_at,
      })),
    }),
    view({
      view_id: "duplicate_feedback_groups",
      input_event_selector: baseSelector(),
      grouping_keys: ["event_type", "target_kind", "target_id", "duplicate_group"],
      output_fields: [
        "duplicate_group",
        "event_type",
        "target_kind",
        "target_id",
        "event_count",
        "duplicate_detected",
        "display_indicator_only",
        "mutates_feedback_events",
      ],
      sort_policy: { order_by: ["duplicate_detected DESC", "duplicate_group ASC"], deterministic: true },
      limit_policy: { default_limit: 50, max_limit: 100, runtime_override_now: false },
      sample_grouped_outputs: countBy(events, ["event_type", "target_kind", "target_id"]).map(
        (row) => ({
          duplicate_group: `${row.event_type}:${row.target_kind}:${row.target_id}`,
          event_type: row.event_type,
          target_kind: row.target_kind,
          target_id: row.target_id,
          event_count: row.event_count,
          duplicate_detected: row.event_count > 1,
          display_indicator_only: true,
          mutates_feedback_events: false,
        }),
      ),
    }),
    view({
      view_id: "recent_feedback_event_window_preview",
      input_event_selector: {
        ...baseSelector(),
        window_kind: "static_recent_fixture_window",
      },
      grouping_keys: ["created_at_day"],
      output_fields: [
        "created_at_day",
        "event_count",
        "event_ids",
        "event_types",
        "target_kinds",
        "target_ids",
        "latest_created_at",
        "read_model_only",
      ],
      sort_policy: { order_by: ["created_at_day DESC"], deterministic: true },
      limit_policy: { default_limit: 50, max_limit: 100, runtime_override_now: false },
      sample_grouped_outputs: recentFeedbackEventWindowPreviewSummary(events),
    }),
    view({
      view_id: "pinned_or_dismissed_target_summary",
      input_event_selector: {
        ...baseSelector(),
        event_type_in: ["pin_preview", "dismiss_preview"],
      },
      grouping_keys: ["target_kind", "target_id"],
      output_fields: ["target_kind", "target_id", "pin_count", "dismiss_count"],
      sort_policy: { order_by: ["target_kind ASC", "target_id ASC"], deterministic: true },
      limit_policy: { default_limit: 50, max_limit: 100, runtime_override_now: false },
      sample_grouped_outputs: pinnedOrDismissedSummary(events),
    }),
    view({
      view_id: "operator_note_presence_summary",
      input_event_selector: baseSelector(),
      grouping_keys: ["operator_note_presence"],
      output_fields: ["operator_note_presence", "event_count"],
      sort_policy: { order_by: ["operator_note_presence DESC"], deterministic: true },
      limit_policy: { default_limit: 50, max_limit: 100, runtime_override_now: false },
      sample_grouped_outputs: countByPresence(events, "operator_note", "operator_note_presence"),
    }),
    view({
      view_id: "source_ref_feedback_summary",
      input_event_selector: baseSelector(),
      grouping_keys: ["source_ref_id"],
      output_fields: ["source_ref_id", "event_count", "event_types"],
      sort_policy: { order_by: ["event_count DESC", "source_ref_id ASC"], deterministic: true },
      limit_policy: { default_limit: 50, max_limit: 100, runtime_override_now: false },
      sample_grouped_outputs: sourceRefSummary(events),
    }),
    view({
      view_id: "authority_boundary_summary",
      input_event_selector: baseSelector(),
      grouping_keys: ["event_type"],
      output_fields: [
        "event_count",
        "forbidden_authority_flags_true_count",
        "read_model_only",
        "product_write_lane_parked_by_686",
      ],
      sort_policy: { order_by: ["event_count DESC"], deterministic: true },
      limit_policy: { default_limit: 1, max_limit: 1, runtime_override_now: false },
      sample_grouped_outputs: [
        {
          event_count: events.length,
          forbidden_authority_flags_true_count: 0,
          read_model_only: true,
          product_write_lane_parked_by_686: true,
        },
      ],
    }),
  ];
}

function view(input) {
  return {
    view_id: input.view_id,
    view_version: `${input.view_id}.v0.1`,
    input_event_selector: input.input_event_selector,
    grouping_keys: input.grouping_keys,
    output_fields: input.output_fields,
    sort_policy: input.sort_policy,
    limit_policy: input.limit_policy,
    sample_grouped_outputs: input.sample_grouped_outputs,
    authority_boundary: viewAuthorityBoundary(),
  };
}

function baseSelector() {
  return {
    durable_feedback_events_only: true,
    fixture_backed_only: true,
    no_runtime_read_now: true,
    source_route_path: routePath,
    source_route_method: routeMethod,
  };
}

function viewAuthorityBoundary() {
  return {
    read_model_only: true,
    not_source_of_truth: true,
    not_proof_or_evidence: true,
    not_perspective_state: true,
    not_work_status: true,
    not_promotion_decision: true,
    not_retrieval_rag_result: true,
    not_product_write: true,
  };
}

function countBy(events, keys) {
  const groups = new Map();
  for (const event of events) {
    const key = keys.map((field) => event[field]).join("\u0000");
    const current =
      groups.get(key) ??
      Object.fromEntries(keys.map((field) => [field, event[field]]));
    current.event_count = (current.event_count ?? 0) + 1;
    current.latest_created_at = latestDate(current.latest_created_at, event.created_at);
    current.event_types = uniqueSorted([...(current.event_types ?? []), event.event_type]);
    groups.set(key, current);
  }
  return [...groups.values()].sort(compareObjectsByFields(keys));
}

function countByPresence(events, field, outputField) {
  const rows = new Map();
  for (const event of events) {
    const value = Boolean(event[field]);
    const current = rows.get(value) ?? { [outputField]: value, event_count: 0 };
    current.event_count += 1;
    rows.set(value, current);
  }
  return [...rows.values()].sort((a, b) =>
    Number(b[outputField]) - Number(a[outputField]),
  );
}

function pinnedOrDismissedSummary(events) {
  const rows = new Map();
  for (const event of events) {
    if (!["pin_preview", "dismiss_preview"].includes(event.event_type)) {
      continue;
    }
    const key = `${event.target_kind}\u0000${event.target_id}`;
    const current =
      rows.get(key) ??
      {
        target_kind: event.target_kind,
        target_id: event.target_id,
        pin_count: 0,
        dismiss_count: 0,
      };
    if (event.event_type === "pin_preview") {
      current.pin_count += 1;
    }
    if (event.event_type === "dismiss_preview") {
      current.dismiss_count += 1;
    }
    rows.set(key, current);
  }
  return [...rows.values()].sort(compareObjectsByFields(["target_kind", "target_id"]));
}

function recentFeedbackEventWindowPreviewSummary(events) {
  const rows = new Map();
  for (const event of events) {
    const created_at_day = createdAtDay(event);
    const current =
      rows.get(created_at_day) ??
      {
        created_at_day,
        event_count: 0,
        event_ids: [],
        event_types: [],
        target_kinds: [],
        target_ids: [],
        latest_created_at: null,
        read_model_only: true,
      };
    current.event_count += 1;
    current.event_ids = uniqueSorted([...current.event_ids, event.event_id]);
    current.event_types = uniqueSorted([...current.event_types, event.event_type]);
    current.target_kinds = uniqueSorted([...current.target_kinds, event.target_kind]);
    current.target_ids = uniqueSorted([...current.target_ids, event.target_id]);
    current.latest_created_at = latestDate(current.latest_created_at, event.created_at);
    rows.set(created_at_day, current);
  }
  return [...rows.values()].sort((a, b) =>
    String(b.created_at_day).localeCompare(String(a.created_at_day)),
  );
}

function sourceRefSummary(events) {
  const rows = new Map();
  for (const event of events) {
    for (const source_ref_id of event.source_ref_ids) {
      const current =
        rows.get(source_ref_id) ??
        { source_ref_id, event_count: 0, event_types: [] };
      current.event_count += 1;
      current.event_types = uniqueSorted([...current.event_types, event.event_type]);
      rows.set(source_ref_id, current);
    }
  }
  return [...rows.values()].sort((a, b) => {
    if (b.event_count !== a.event_count) {
      return b.event_count - a.event_count;
    }
    return String(a.source_ref_id).localeCompare(String(b.source_ref_id));
  });
}

function assertTypeContract() {
  for (const requiredText of [
    "FeedbackEventAggregationReadModelContract",
    "contract_kind: \"feedback_event_aggregation_read_model_contract\"",
    "contract_version: \"feedback_event_aggregation_read_model_contract.v0.1\"",
    "source_feedback_event_store_ref",
    "source_list_route_ref",
    "source_list_ui_browser_validation_ref",
    "aggregation_inputs",
    "aggregation_dimensions",
    "read_model_views",
    "duplicate_feedback_policy",
    "trend_window_policy",
    "authority_boundary",
    "validation_policy",
    "recommendation_status",
    "next_recommended_slice",
    "contract_fingerprint",
    "fingerprint_algorithm",
  ]) {
    assert.ok(typeSource.includes(requiredText), `${typePath} must include ${requiredText}`);
  }
  for (const dimension of aggregationDimensions) {
    assert.ok(typeSource.includes(`"${dimension}"`), `${typePath} must include ${dimension}`);
  }
  for (const viewId of viewIds) {
    assert.ok(typeSource.includes(`"${viewId}"`), `${typePath} must include ${viewId}`);
  }
}

function assertPackageScript() {
  if (durablePerspectiveStateTrajectoryContractSliceActive()) {
    assertDurablePerspectiveStateTrajectoryContractPackageScript();
    return;
  }
  if (humanReviewedDurablePerspectivePromotionBrowserValidationSliceActive()) {
    assertHumanReviewedDurablePerspectivePromotionBrowserValidationPackageScript();
    return;
  }
  if (humanReviewedDurablePerspectivePromotionImplementationSliceActive()) {
    assertHumanReviewedDurablePerspectivePromotionImplementationPackageScript();
    return;
  }
  if (humanReviewedDurablePerspectivePromotionContractSliceActive()) {
    assertHumanReviewedDurablePerspectivePromotionContractPackageScript();
    return;
  }
  if (nonAuthoritativeRetrievalRagBrowserValidationSliceActive()) {
    assertNonAuthoritativeRetrievalRagBrowserValidationPackageScript();
    return;
  }
  if (nonAuthoritativeRetrievalRagImplementationSliceActive()) {
    assertNonAuthoritativeRetrievalRagImplementationPackageScript();
    return;
  }
  if (nonAuthoritativeRetrievalRagContractSliceActive()) {
    assertNonAuthoritativeRetrievalRagContractPackageScript();
    return;
  }
  if (operatorSourceCandidateGenerationBrowserValidationSliceActive()) {
    assertOperatorSourceCandidateGenerationBrowserValidationPackageScript();
    return;
  }
  if (operatorSourceCandidateGenerationImplementationSliceActive()) {
    assertOperatorSourceCandidateGenerationImplementationPackageScript();
    return;
  }
  if (operatorSourceCandidateGenerationContractSliceActive()) {
    assertOperatorSourceCandidateGenerationContractPackageScript();
    return;
  }
  if (boundedExternalSourceIntakeBrowserValidationSliceActive()) {
    assertBoundedExternalSourceIntakeBrowserValidationPackageScript();
    return;
  }
  if (boundedExternalSourceIntakeImplementationSliceActive()) {
    assertBoundedExternalSourceIntakeImplementationPackageScript();
    return;
  }
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
  assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
  if (downstreamFormationReceiptDurableEventContractSliceActive()) {
    assert.equal(
      packageJson.scripts[formationReceiptDurableEventContractPackageScriptName],
      formationReceiptDurableEventContractPackageScriptValue,
    );
  } else if (downstreamBrowserValidationSliceActive()) {
    assert.equal(
      packageJson.scripts[browserValidationPackageScriptName],
      browserValidationPackageScriptValue,
    );
  } else if (downstreamImplementationSliceActive()) {
    assert.equal(
      packageJson.scripts[implementationPackageScriptName],
      implementationPackageScriptValue,
    );
  }
  const addedScripts = Object.keys(packageJson.scripts)
    .filter((scriptName) => !basePackageJson.scripts[scriptName])
    .sort();
  if (recentRehearsalBufferImplementationSliceActive()) {
    assert.equal(
      packageJson.scripts[recentRehearsalBufferImplementationPackageScriptName],
      recentRehearsalBufferImplementationPackageScriptValue,
    );
    assert.deepEqual(
      addedScripts,
      [recentRehearsalBufferImplementationPackageScriptName],
      "package.json must add only the Recent Rehearsal Buffer implementation smoke script",
    );
    assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
    assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
    assert.deepEqual(
      packageJson.optionalDependencies ?? {},
      basePackageJson.optionalDependencies ?? {},
    );
    return;
  }
  if (recentRehearsalBufferContractSliceActive()) {
    assert.equal(
      packageJson.scripts[recentRehearsalBufferContractPackageScriptName],
      recentRehearsalBufferContractPackageScriptValue,
    );
    assert.deepEqual(
      addedScripts,
      [recentRehearsalBufferContractPackageScriptName],
      "package.json must add only the Recent Rehearsal Buffer contract smoke script",
    );
    assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
    assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
    assert.deepEqual(
      packageJson.optionalDependencies ?? {},
      basePackageJson.optionalDependencies ?? {},
    );
    return;
  }
  const expectedAddedScripts = downstreamFormationReceiptDurableEventContractSliceActive()
    ? [formationReceiptDurableEventContractPackageScriptName]
    : downstreamBrowserValidationSliceActive()
    ? [browserValidationPackageScriptName]
    : downstreamImplementationSliceActive()
    ? [implementationPackageScriptName]
    : [packageScriptName];
  if (formationReceiptDurableEventBrowserValidationSliceActive()) {
    assert.equal(
      packageJson.scripts[formationReceiptDurableEventBrowserValidationPackageScriptName],
      formationReceiptDurableEventBrowserValidationPackageScriptValue,
    );
    assert.deepEqual(
      addedScripts,
      [formationReceiptDurableEventBrowserValidationPackageScriptName],
      "package.json must add only the Formation Receipt durable event browser validation smoke script",
    );
    assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
    assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
    assert.deepEqual(
      packageJson.optionalDependencies ?? {},
      basePackageJson.optionalDependencies ?? {},
    );
    return;
  }
  if (formationReceiptDurableEventImplementationSliceActive()) {
    assert.equal(
      packageJson.scripts[formationReceiptDurableEventImplementationPackageScriptName],
      formationReceiptDurableEventImplementationPackageScriptValue,
    );
    assert.deepEqual(
      addedScripts,
      [formationReceiptDurableEventImplementationPackageScriptName],
      "package.json must add only the Formation Receipt durable event implementation smoke script",
    );
    assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
    assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
    assert.deepEqual(
      packageJson.optionalDependencies ?? {},
      basePackageJson.optionalDependencies ?? {},
    );
    return;
  }
  if (formationReceiptDurableEventContractSliceActive()) {
    assert.equal(
      packageJson.scripts[formationReceiptDurableEventContractPackageScriptName],
      formationReceiptDurableEventContractPackageScriptValue,
    );
    assert.deepEqual(
      addedScripts,
      [formationReceiptDurableEventContractPackageScriptName],
      "package.json must add only the Formation Receipt durable event contract smoke script",
    );
    assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
    assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
    assert.deepEqual(
      packageJson.optionalDependencies ?? {},
      basePackageJson.optionalDependencies ?? {},
    );
    return;
  }
  assert.deepEqual(
    addedScripts,
    expectedAddedScripts,
    "package.json must add only the expected aggregation read model smoke script",
  );
  assert.deepEqual(
    packageJson.dependencies,
    basePackageJson.dependencies,
    "package dependencies must not change",
  );
  assert.deepEqual(
    packageJson.devDependencies,
    basePackageJson.devDependencies,
    "package devDependencies must not change",
  );
  assert.deepEqual(
    packageJson.optionalDependencies ?? {},
    basePackageJson.optionalDependencies ?? {},
    "package optionalDependencies must not change",
  );
}

function assertStaticBoundary() {
  const changedFiles = readChangedFiles();
  if (durablePerspectiveStateTrajectoryContractSliceActive()) {
    assertDurablePerspectiveStateTrajectoryContractChangedFiles(changedFiles);
    return;
  }
  if (humanReviewedDurablePerspectivePromotionBrowserValidationSliceActive()) {
    assertHumanReviewedDurablePerspectivePromotionBrowserValidationChangedFiles(changedFiles);
    return;
  }
  if (humanReviewedDurablePerspectivePromotionImplementationSliceActive()) {
    assertHumanReviewedDurablePerspectivePromotionImplementationChangedFiles(changedFiles);
    return;
  }
  if (humanReviewedDurablePerspectivePromotionContractSliceActive()) {
    assertHumanReviewedDurablePerspectivePromotionContractChangedFiles(changedFiles);
    return;
  }
  if (nonAuthoritativeRetrievalRagBrowserValidationSliceActive()) {
    assertNonAuthoritativeRetrievalRagBrowserValidationChangedFiles(changedFiles);
    return;
  }
  if (nonAuthoritativeRetrievalRagImplementationSliceActive()) {
    assertNonAuthoritativeRetrievalRagImplementationChangedFiles(changedFiles);
    return;
  }
  if (nonAuthoritativeRetrievalRagContractSliceActive()) {
    assertNonAuthoritativeRetrievalRagContractChangedFiles(changedFiles);
    return;
  }
  if (operatorSourceCandidateGenerationBrowserValidationSliceActive()) {
    assertOperatorSourceCandidateGenerationBrowserValidationChangedFiles(changedFiles);
    return;
  }
  if (operatorSourceCandidateGenerationImplementationSliceActive()) {
    assertOperatorSourceCandidateGenerationImplementationChangedFiles(changedFiles);
    return;
  }
  if (operatorSourceCandidateGenerationContractSliceActive()) {
    assertOperatorSourceCandidateGenerationContractChangedFiles(changedFiles);
    return;
  }
  if (boundedExternalSourceIntakeBrowserValidationSliceActive()) {
    assertBoundedExternalSourceIntakeBrowserValidationChangedFiles(changedFiles);
    return;
  }
  if (boundedExternalSourceIntakeImplementationSliceActive()) {
    assertBoundedExternalSourceIntakeImplementationChangedFiles(changedFiles);
    return;
  }
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
  const requiredFiles = downstreamFormationReceiptDurableEventContractSliceActive()
    ? downstreamFormationReceiptDurableEventContractChangedFiles
    : downstreamBrowserValidationSliceActive()
    ? downstreamBrowserValidationChangedFiles
    : downstreamImplementationSliceActive()
    ? downstreamImplementationChangedFiles
    : expectedChangedFiles;
  for (const expectedFile of requiredFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      requiredFiles.includes(changedFile),
      `unexpected changed file in aggregation read model contract slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|retrieval|source-fetch)\b/i);
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


function durablePerspectiveStateTrajectoryContractSliceActive() {
  return readChangedFiles().includes(
    "scripts/smoke-durable-perspective-state-trajectory-contract-v0-1.mjs",
  );
}

function assertDurablePerspectiveStateTrajectoryContractPackageScript() {
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
    packageJson.scripts["smoke:durable-perspective-state-trajectory-contract-v0-1"],
    "node scripts/smoke-durable-perspective-state-trajectory-contract-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:durable-perspective-state-trajectory-contract-v0-1"],
    "package.json must add only the Durable Perspective State / Trajectory contract smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
  if (typeof basePackageJson !== "undefined") {
    assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
    assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
    assert.deepEqual(
      packageJson.optionalDependencies ?? {},
      basePackageJson.optionalDependencies ?? {},
    );
  }
}

function assertDurablePerspectiveStateTrajectoryContractChangedFiles(changedFiles) {
  const expectedFiles = [
    "types/durable-perspective-state-trajectory-contract.ts",
    "fixtures/research-candidate-review.durable-perspective-state-trajectory-contract.sample.v0.1.json",
    "scripts/smoke-durable-perspective-state-trajectory-contract-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    "scripts/smoke-human-reviewed-durable-perspective-promotion-browser-validation-v0-1.mjs",
    "scripts/smoke-human-reviewed-durable-perspective-promotion-implementation-v0-1.mjs",
    "scripts/smoke-human-reviewed-durable-perspective-promotion-contract-v0-1.mjs",
    "scripts/smoke-non-authoritative-retrieval-rag-browser-validation-v0-1.mjs",
    "scripts/smoke-non-authoritative-retrieval-rag-implementation-v0-1.mjs",
    "scripts/smoke-non-authoritative-retrieval-rag-contract-v0-1.mjs",
    "scripts/smoke-operator-source-candidate-generation-browser-validation-v0-1.mjs",
    "scripts/smoke-operator-source-candidate-generation-implementation-v0-1.mjs",
    "scripts/smoke-operator-source-candidate-generation-contract-v0-1.mjs",
    "scripts/smoke-bounded-external-source-intake-browser-validation-v0-1.mjs",
    "scripts/smoke-bounded-external-source-intake-implementation-v0-1.mjs",
    "scripts/smoke-bounded-external-source-intake-contract-v0-1.mjs",
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
    "scripts/smoke-feedback-event-store-minimal-v0-1.mjs"
];
  const protectedUnchangedPaths = [
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-browser-validation.sample.v0.1.json",
    "types/human-reviewed-durable-perspective-promotion-contract.ts",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-contract.sample.v0.1.json",
    "lib/research-candidate-review/human-reviewed-durable-perspective-promotion.ts",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-implementation.sample.v0.1.json",
    "lib/research-candidate-review/non-authoritative-retrieval-rag.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-implementation.sample.v0.1.json",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-browser-validation.sample.v0.1.json",
    "lib/research-candidate-review/operator-source-candidate-generation.ts",
    "fixtures/research-candidate-review.operator-source-candidate-generation-implementation.sample.v0.1.json",
    "lib/research-candidate-review/bounded-external-source-intake.ts",
    "fixtures/research-candidate-review.bounded-external-source-intake-implementation.sample.v0.1.json",
    "lib/research-candidate-review/salience-governor.ts",
    "fixtures/research-candidate-review.salience-governor-implementation.sample.v0.1.json",
    "lib/research-candidate-review/recent-rehearsal-buffer.ts",
    "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
    "lib/db/schema.sql",
  ];
  for (const unchangedPath of protectedUnchangedPaths) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      "Durable Perspective State / Trajectory contract slice must not change " + unchangedPath,
    );
  }
  for (const expectedFile of [
    "types/durable-perspective-state-trajectory-contract.ts",
    "fixtures/research-candidate-review.durable-perspective-state-trajectory-contract.sample.v0.1.json",
    "scripts/smoke-durable-perspective-state-trajectory-contract-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    "scripts/smoke-human-reviewed-durable-perspective-promotion-browser-validation-v0-1.mjs",
  ]) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      "unexpected changed file in Durable Perspective State / Trajectory contract downstream slice: " + changedFile,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\/research-retrieval\//, "must not add retrieval implementation files");
    assert.doesNotMatch(changedFile, /^lib\/research-rag\//, "must not add RAG implementation files");
    assert.doesNotMatch(changedFile, /^lib\/.*perspective.*state/i, "must not add runtime Perspective state files");
    assert.doesNotMatch(changedFile, /^lib\/.*perspective.*snapshot/i, "must not add runtime PerspectiveSnapshot files");
    assert.doesNotMatch(changedFile, /^lib\/.*trajectory/i, "must not add runtime trajectory builder files");
    assert.doesNotMatch(changedFile, /^lib\/.*promotion/i, "must not add runtime promotion implementation files");
    assert.doesNotMatch(changedFile, /^lib\/.*(proof|evidence).*write/i, "must not add proof/evidence write files");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|openai|source-fetch|crawler)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
  const durablePerspectiveStateTrajectoryContractSmokeSource =
    typeof smokeSource === "string" ? smokeSource : readFileSync(smokePath, "utf8");
  for (const requiredText of [
    "durable_perspective_state_trajectory_contract.v0.1",
    "types/durable-perspective-state-trajectory-contract.ts",
    "fixtures/research-candidate-review.durable-perspective-state-trajectory-contract.sample.v0.1.json",
    "scripts/smoke-durable-perspective-state-trajectory-contract-v0-1.mjs",
    "smoke:durable-perspective-state-trajectory-contract-v0-1",
    "ready_for_durable_perspective_state_trajectory_implementation_v0_1",
    "durable_perspective_state_trajectory_implementation_v0_1",
    "future durable Perspective state shape and trajectory grammar",
    "current thesis has lineage",
    "prior thesis is not overwritten silently",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      durablePerspectiveStateTrajectoryContractSmokeSource.includes(requiredText),
      "smoke must allow Durable Perspective State / Trajectory contract downstream pointer: " + requiredText,
    );
  }
}

function assertNoForbiddenRuntimePatterns() {
  assert.doesNotMatch(smokeSource, /\bnext\s+(dev|start)\b/i);
  const changedSourceFiles = readChangedFiles().filter((filePath) =>
    filePath !== "types/non-authoritative-retrieval-rag-contract.ts" &&
    (filePath.endsWith(".ts") || filePath.endsWith(".tsx") || filePath.endsWith(".mjs")) &&
    !filePath.startsWith("scripts/smoke-")
  );
  for (const filePath of changedSourceFiles) {
    const source = stripValidationText(readFile(filePath));
    for (const { label, regex } of [
      { label: "route handler", regex: /\bexport\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\b/ },
      { label: "server action", regex: /["']use server["']/ },
      { label: "browser fetch", regex: /\bfetch\s*\(/ },
      { label: "localStorage", regex: /\blocalStorage\b/ },
      { label: "sessionStorage", regex: /\bsessionStorage\b/ },
      { label: "indexedDB", regex: /\bindexedDB\b/ },
      { label: "document.cookie", regex: /document\.cookie/ },
      { label: "polling", regex: /\bsetInterval\b|\bsetTimeout\b/ },
      { label: "DB open", regex: /\bnew\s+Database\b|\bopenDatabase\b|better-sqlite3/i },
      { label: "runtime SQL", regex: /\bdb\.(prepare|query|exec)\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b/ },
      { label: "feedback write", regex: /\bwriteFeedbackEvent\b|\binsertFeedbackEvent\b|\bmutateFeedbackEvent\b/ },
      { label: "OpenAI import", regex: /from\s+["'][^"']*openai["']/i },
      { label: "OpenAI constructor", regex: /new\s+OpenAI\b/i },
      { label: "source fetch call", regex: /\bfetchSource\b|\bsourceFetch\b/ },
      { label: "retrieval execution", regex: /\brunRetrieval\b|\brunRag\b|\brunRAG\b/ },
      { label: "embedding/vector/FTS implementation", regex: /\bcreateEmbedding\b|\bvectorIndex\b|\bFTS5\b/i },
      { label: "Codex product execution", regex: /\bcodex\s+(exec|run)\b/i },
      { label: "GitHub automation", regex: /\bgh\s+pr\b|Octokit|api\.github\.com/i },
      { label: "external handoff send", regex: /\bsendExternalHandoff\b/ },
      { label: "agent execution", regex: /\bexecuteAgent\b|\brouteAgent\b/ },
      { label: "proof write", regex: /\bcreateProof\b|\binsertProof\b/ },
      { label: "evidence write", regex: /\bcreateEvidence\b|\binsertEvidence\b/ },
      { label: "Perspective promotion", regex: /\bpromotePerspective\b/ },
      { label: "Perspective durable state write", regex: /\bwritePerspective\b|\bupsertPerspective\b/ },
      { label: "promotion decision", regex: /\bcreatePromotionDecision\b|\brecordPromotionDecision\b/ },
      { label: "work mutation", regex: /\bcreateWork\b|\bmutateWork\b|\bupdateWork\b/ },
      { label: "salience authority true flag", regex: /\bsalience_authority:\s*true\b/ },
      { label: "product write", regex: /\bexecuteProductWrite\b|\bproductDbWrite\b/i },
      { label: "product ID allocation", regex: /\ballocateProductId\b/i },
    ]) {
      assert.doesNotMatch(source, regex, `${filePath} must not include ${label}`);
    }
  }
}

function assertReadModelViews(value) {
  assert.equal(value.contract_kind, contractKind);
  assert.equal(value.contract_version, contractVersion);
  assert.equal(
    value.source_feedback_event_store_ref,
    `${feedbackStoreFixture.fixture_version}:${feedbackStoreFixturePath}`,
  );
  assert.equal(
    value.source_list_route_ref,
    `${listRouteContractFixture.contract_version}:${listRouteContractFixturePath}`,
  );
  assert.equal(
    value.source_list_ui_browser_validation_ref,
    `${listUiBrowserValidationFixture.validation_version}:${listUiBrowserValidationFixturePath}`,
  );
  assert.deepEqual(value.aggregation_inputs, {
    durable_feedback_events_only: true,
    source_route_path: routePath,
    source_route_method: routeMethod,
    source_request_version: requestVersion,
    allowed_event_types: allowedEventTypes,
    allowed_target_kinds: allowedTargetKinds,
    no_runtime_read_now: true,
    no_db_query_now: true,
    fixture_backed_only: true,
  });
  assert.deepEqual(value.aggregation_dimensions, aggregationDimensions);
  assert.deepEqual(
    value.read_model_views.map((viewValue) => viewValue.view_id),
    viewIds,
  );
  for (const viewValue of value.read_model_views) {
    assert.equal(viewValue.view_version, `${viewValue.view_id}.v0.1`);
    assert.ok(viewValue.input_event_selector);
    assert.ok(Array.isArray(viewValue.grouping_keys));
    assert.ok(Array.isArray(viewValue.output_fields));
    assert.ok(viewValue.sort_policy);
    assert.ok(viewValue.limit_policy);
    assert.ok(
      Array.isArray(viewValue.sample_grouped_outputs) &&
        viewValue.sample_grouped_outputs.length >= 1,
      `${viewValue.view_id} must include at least one sample grouped output`,
    );
    assert.deepEqual(viewValue.authority_boundary, viewAuthorityBoundary());
  }
  assertRecentFeedbackEventWindowPreviewView(value.read_model_views);
  assert.equal(value.recommendation_status, recommendationStatus);
  assert.equal(value.next_recommended_slice, nextRecommendedSlice);
  assert.equal(value.fingerprint_algorithm, "fnv1a32_canonical_json");
  assert.match(value.contract_fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
}

function assertRecentFeedbackEventWindowPreviewView(views) {
  const viewValue = views.find(
    (candidate) => candidate.view_id === "recent_feedback_event_window_preview",
  );
  assert.ok(viewValue, "recent feedback event window preview view must exist");
  assert.deepEqual(viewValue.grouping_keys, ["created_at_day"]);
  assert.deepEqual(viewValue.output_fields, [
    "created_at_day",
    "event_count",
    "event_ids",
    "event_types",
    "target_kinds",
    "target_ids",
    "latest_created_at",
    "read_model_only",
  ]);
  for (const eventLevelIdentityField of [
    "event_id",
    "event_type",
    "target_kind",
    "target_id",
    "created_at",
  ]) {
    assert.ok(
      !viewValue.output_fields.includes(eventLevelIdentityField),
      `${eventLevelIdentityField} must not be a standalone output field for day-level preview rows`,
    );
  }

  const expectedRows = recentFeedbackEventWindowPreviewSummary(feedbackStoreFixture.events);
  assert.deepEqual(
    viewValue.sample_grouped_outputs,
    expectedRows,
    "recent preview sample outputs must be one aggregate row per created_at_day",
  );
  const uniqueCreatedAtDays = uniqueSorted(feedbackStoreFixture.events.map(createdAtDay));
  assert.equal(
    viewValue.sample_grouped_outputs.length,
    uniqueCreatedAtDays.length,
    "recent preview row count must match unique created_at_day values",
  );
  for (const row of viewValue.sample_grouped_outputs) {
    for (const requiredField of [
      "created_at_day",
      "event_count",
      "event_ids",
      "event_types",
      "target_kinds",
      "target_ids",
      "latest_created_at",
      "read_model_only",
    ]) {
      assert.ok(
        Object.hasOwn(row, requiredField),
        `recent preview row must include ${requiredField}`,
      );
    }
    assert.equal(row.read_model_only, true);
    assert.ok(Array.isArray(row.event_ids) && row.event_ids.length === row.event_count);
    assert.ok(Array.isArray(row.event_types) && row.event_types.length >= 1);
    assert.ok(Array.isArray(row.target_kinds) && row.target_kinds.length >= 1);
    assert.ok(Array.isArray(row.target_ids) && row.target_ids.length >= 1);
    for (const forbiddenStandaloneField of [
      "event_id",
      "event_type",
      "target_kind",
      "target_id",
      "created_at",
    ]) {
      assert.ok(
        !Object.hasOwn(row, forbiddenStandaloneField),
        `recent preview row must not include standalone ${forbiddenStandaloneField}`,
      );
    }
  }
}

function assertDuplicateFeedbackPolicy(value) {
  assert.deepEqual(value.duplicate_detection_keys, [
    "event_type",
    "target_kind",
    "target_id",
  ]);
  assert.equal(value.idempotency_key_duplicates_grouped_separately, true);
  assert.equal(value.display_read_model_indicators_only, true);
  for (const falseField of [
    "delete_feedback_events",
    "rewrite_feedback_events",
    "suppress_feedback_events",
    "mutate_feedback_events",
    "decides_promotion",
    "decides_proof_or_evidence",
    "decides_work_status",
    "decides_product_write",
  ]) {
    assert.equal(value[falseField], false, `duplicate policy ${falseField} must be false`);
  }
}

function assertTrendWindowPolicy(value) {
  assert.equal(value.static_preview_windows_only, true);
  assert.ok(Array.isArray(value.preview_windows) && value.preview_windows.length >= 1);
  assert.equal(value.no_runtime_scheduler, true);
  assert.equal(value.no_auto_refresh, true);
  assert.equal(value.no_polling, true);
  assert.equal(value.no_durable_window_state, true);
  assert.equal(value.no_salience_authority, true);
}

function assertAuthorityBoundary(value) {
  assert.deepEqual(value, {
    contract_only: true,
    read_model_defined_now: true,
    runtime_read_model_implemented_now: false,
    runtime_db_query_now: false,
    route_changed_now: false,
    feedback_events_read_now: false,
    feedback_events_written_now: false,
    feedback_events_mutated_now: false,
    browser_request_now: false,
    browser_persistence_now: false,
    proof_or_evidence_record: false,
    perspective_promotion: false,
    durable_perspective_state_write: false,
    promotion_decision_record: false,
    work_mutation: false,
    execution_authority: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    external_handoff_authority: false,
    provider_openai_authority: false,
    retrieval_rag_authority: false,
    source_fetch_authority: false,
    salience_authority: false,
    product_write_authority: false,
    product_id_allocation_authority: false,
    product_write_lane_parked_by_686: true,
  });
}

function assertValidationPolicy(value) {
  assert.deepEqual(value, {
    static_source_validation_only: true,
    fixture_backed_only: true,
    app_server_started_now: false,
    production_db_used_now: false,
    runtime_browser_request_now: false,
  });
}

function assertDocsPointers() {
  for (const requiredText of [
    "Feedback Event aggregation read model contract v0.1",
    typePath,
    fixturePath,
    smokePath,
    packageScriptName,
    "read-model-only aggregation over durable feedback events",
    "no runtime implementation",
    "no DB query",
    "no browser request",
    "no feedback write/mutation",
    "no proof/evidence/Perspective promotion/work mutation",
    "no provider/OpenAI/source-fetch/retrieval/RAG execution",
    "no salience authority",
    "no product write/product IDs",
    "product-write remains parked by #686",
    nextRecommendedSlice,
  ]) {
    assert.ok(indexDoc.includes(requiredText), `index must include ${requiredText}`);
  }
  for (const doc of [substrateDoc, surfaceDoc, gateDoc]) {
    assert.match(doc, /Feedback event aggregation read model/i);
    assert.match(doc, /advisory|contract-only|read-only/i);
    assert.match(doc, /not proof\/evidence/i);
    assert.match(doc, /not Perspective state|separated from durable Perspective promotion/i);
    assert.match(doc, /not work status|work mutation/i);
    assert.match(doc, /not promotion authority|promotion authority/i);
    assert.match(doc, /not salience authority|no salience authority/i);
    assert.match(doc, /not retrieval\/RAG result|retrieval\/RAG/i);
    assert.match(doc, /not product write|no product write/i);
    assert.match(doc, /no runtime DB|no DB query|no runtime implementation/i);
    assert.match(doc, /#686/);
    assert.match(doc, new RegExp(nextRecommendedSlice));
  }
}

function assertListUiBrowserValidationSmokeDownstreamPointer() {
  if (downstreamImplementationSliceActive()) {
    for (const requiredText of [
      implementationPackageScriptName,
      implementationBuilderPath,
      implementationFixturePath,
      implementationSmokePath,
      implementationRecommendationStatus,
      implementationNextRecommendedSlice,
    ]) {
      assert.ok(
        readFileSync(smokePath, "utf8").includes(requiredText),
        `contract smoke must allow implementation pointer text: ${requiredText}`,
      );
    }
    return;
  }
  for (const requiredText of [
    packageScriptName,
    typePath,
    fixturePath,
    smokePath,
    recommendationStatus,
    nextRecommendedSlice,
  ]) {
    assert.ok(
      listUiBrowserValidationSmokeSource.includes(requiredText),
      `#708 list UI browser validation smoke must allow aggregation read model contract text: ${requiredText}`,
    );
  }
  assert.equal(
    listUiBrowserValidationFixture.next_recommended_slice,
    "feedback_event_aggregation_read_model_contract_v0_1",
    "#708 list UI browser validation fixture output must remain unchanged",
  );
}

function downstreamImplementationSliceActive() {
  return readChangedFiles().includes(implementationSmokePath);
}

function downstreamBrowserValidationSliceActive() {
  return readChangedFiles().includes(browserValidationSmokePath);
}

function downstreamFormationReceiptDurableEventContractSliceActive() {
  return readChangedFiles().includes(formationReceiptDurableEventContractSmokePath);
}

function compareEventsAsc(a, b) {
  return (
    String(a.created_at).localeCompare(String(b.created_at)) ||
    String(a.event_id).localeCompare(String(b.event_id))
  );
}

function compareEventsDesc(a, b) {
  return (
    String(b.created_at).localeCompare(String(a.created_at)) ||
    String(b.event_id).localeCompare(String(a.event_id))
  );
}

function compareObjectsByFields(fields) {
  return (a, b) => {
    for (const field of fields) {
      const compared = String(a[field]).localeCompare(String(b[field]));
      if (compared !== 0) {
        return compared;
      }
    }
    return 0;
  };
}

function createdAtDay(event) {
  return String(event.created_at).slice(0, 10);
}

function latestDate(current, candidate) {
  if (!current || String(candidate) > String(current)) {
    return candidate;
  }
  return current;
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function readFile(filePath) {
  return readFileSync(filePath, "utf8");
}

function readJson(filePath) {
  return JSON.parse(readFile(filePath));
}

function readJsonFromGit(filePath) {
  return JSON.parse(readGitOutput(["show", `${mergeBaseRef()}:${filePath}`]));
}

function readChangedFiles() {
  const changed = [
    ...readGitOutput(["diff", "--name-only", mergeBaseRef()]).split("\n"),
    ...readGitOutput(["diff", "--cached", "--name-only"]).split("\n"),
    ...readGitOutput(["ls-files", "--others", "--exclude-standard"]).split("\n"),
  ]
    .map((line) => line.trim())
    .filter(Boolean);
  return [...new Set(changed)].sort();
}



function recentRehearsalBufferImplementationSliceActive() {
  return readChangedFiles().includes("scripts/smoke-recent-rehearsal-buffer-implementation-v0-1.mjs");
}

function recentRehearsalBufferContractSliceActive() {
  return readChangedFiles().includes("scripts/smoke-recent-rehearsal-buffer-contract-v0-1.mjs");
}

function stripValidationText(source) {
  return source
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(["'`])(?:\\.|(?!\1)[\s\S])*\1/g, "\"\"");
}

function createFingerprint(value) {
  const normalized = JSON.parse(JSON.stringify(value));
  delete normalized.contract_fingerprint;
  return `fnv1a32:${fnv1a32(canonicalJson(normalized))}`;
}

function canonicalJson(value) {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value) {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, nested]) => [key, sortKeys(nested)]),
    );
  }
  return value;
}

function fnv1a32(input) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
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
  if (cachedMergeBaseRef) {
    return cachedMergeBaseRef;
  }
  for (const ref of ["origin/main", "main"]) {
    if (!gitRefExists(ref)) {
      continue;
    }
    const mergeBase = tryGitOutput(["merge-base", "HEAD", ref])?.trim();
    if (mergeBase) {
      cachedMergeBaseRef = mergeBase;
      return cachedMergeBaseRef;
    }
  }
  const parentRef = tryGitOutput(["rev-parse", "--verify", "HEAD^"])?.trim();
  if (parentRef) {
    cachedMergeBaseRef = parentRef;
    return cachedMergeBaseRef;
  }
  throw new Error(
    "Unable to determine a base ref for static changed-file validation. " +
      "Expected origin/main, local main, or HEAD^ to resolve.",
  );
}

function gitRefExists(ref) {
  return tryGitOutput(["rev-parse", "--verify", ref]) !== null;
}

function tryGitOutput(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" });
  } catch {
    return null;
  }
}

function readGitOutput(args) {
  return execFileSync("git", args, { encoding: "utf8" });
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

function nonAuthoritativeRetrievalRagBrowserValidationSliceActive() {
  return (
    !humanReviewedDurablePerspectivePromotionContractSliceActive() &&
    readChangedFiles().includes(
      "scripts/smoke-non-authoritative-retrieval-rag-browser-validation-v0-1.mjs",
    )
  );
}

function nonAuthoritativeRetrievalRagImplementationSliceActive() {
  return (
    !humanReviewedDurablePerspectivePromotionContractSliceActive() &&
    !nonAuthoritativeRetrievalRagBrowserValidationSliceActive() &&
    readChangedFiles().includes(
      "scripts/smoke-non-authoritative-retrieval-rag-implementation-v0-1.mjs",
    )
  );
}

function nonAuthoritativeRetrievalRagContractSliceActive() {
  return (
    !humanReviewedDurablePerspectivePromotionContractSliceActive() &&
    !nonAuthoritativeRetrievalRagBrowserValidationSliceActive() &&
    !nonAuthoritativeRetrievalRagImplementationSliceActive() &&
    readChangedFiles().includes(
      "scripts/smoke-non-authoritative-retrieval-rag-contract-v0-1.mjs",
    )
  );
}



function humanReviewedDurablePerspectivePromotionBrowserValidationSliceActive() {
  return readChangedFiles().includes(
    "scripts/smoke-human-reviewed-durable-perspective-promotion-browser-validation-v0-1.mjs",
  );
}

function assertHumanReviewedDurablePerspectivePromotionBrowserValidationPackageScript() {
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
    packageJson.scripts["smoke:human-reviewed-durable-perspective-promotion-browser-validation-v0-1"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-human-reviewed-durable-perspective-promotion-browser-validation-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:human-reviewed-durable-perspective-promotion-browser-validation-v0-1"],
    "package.json must add only the Human-reviewed Durable Perspective Promotion browser validation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"s*:/);
  if (typeof basePackageJson !== "undefined") {
    assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
    assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
    assert.deepEqual(
      packageJson.optionalDependencies ?? {},
      basePackageJson.optionalDependencies ?? {},
    );
  }
}

function assertHumanReviewedDurablePerspectivePromotionBrowserValidationChangedFiles(changedFiles) {
  const browserValidationAllowedSmokePaths = [
    "scripts/smoke-human-reviewed-durable-perspective-promotion-browser-validation-v0-1.mjs",
    "scripts/smoke-human-reviewed-durable-perspective-promotion-implementation-v0-1.mjs",
    "scripts/smoke-human-reviewed-durable-perspective-promotion-contract-v0-1.mjs",
    "scripts/smoke-non-authoritative-retrieval-rag-browser-validation-v0-1.mjs",
    "scripts/smoke-non-authoritative-retrieval-rag-implementation-v0-1.mjs",
    "scripts/smoke-non-authoritative-retrieval-rag-contract-v0-1.mjs",
    "scripts/smoke-operator-source-candidate-generation-browser-validation-v0-1.mjs",
    "scripts/smoke-operator-source-candidate-generation-implementation-v0-1.mjs",
    "scripts/smoke-operator-source-candidate-generation-contract-v0-1.mjs",
    "scripts/smoke-bounded-external-source-intake-browser-validation-v0-1.mjs",
    "scripts/smoke-bounded-external-source-intake-implementation-v0-1.mjs",
    "scripts/smoke-bounded-external-source-intake-contract-v0-1.mjs",
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
  const expectedFiles = [
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-browser-validation.sample.v0.1.json",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    ...browserValidationAllowedSmokePaths,
  ];
  for (const unchangedPath of [
    "types/human-reviewed-durable-perspective-promotion-contract.ts",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-contract.sample.v0.1.json",
    "lib/research-candidate-review/human-reviewed-durable-perspective-promotion.ts",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-implementation.sample.v0.1.json",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-browser-validation.sample.v0.1.json",
    "lib/research-candidate-review/non-authoritative-retrieval-rag.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-implementation.sample.v0.1.json",
    "types/non-authoritative-retrieval-rag-contract.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-contract.sample.v0.1.json",
    "lib/research-candidate-review/operator-source-candidate-generation.ts",
    "fixtures/research-candidate-review.operator-source-candidate-generation-implementation.sample.v0.1.json",
    "lib/research-candidate-review/bounded-external-source-intake.ts",
    "fixtures/research-candidate-review.bounded-external-source-intake-implementation.sample.v0.1.json",
    "lib/research-candidate-review/salience-governor.ts",
    "fixtures/research-candidate-review.salience-governor-implementation.sample.v0.1.json",
    "lib/research-candidate-review/recent-rehearsal-buffer.ts",
    "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
    "lib/db/schema.sql",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      "Human-reviewed Durable Perspective Promotion browser validation slice must not change " + unchangedPath,
    );
  }
  for (const expectedFile of [
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-browser-validation.sample.v0.1.json",
    "scripts/smoke-human-reviewed-durable-perspective-promotion-browser-validation-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    "scripts/smoke-human-reviewed-durable-perspective-promotion-implementation-v0-1.mjs",
  ]) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      "unexpected changed file in Human-reviewed Durable Perspective Promotion browser validation downstream slice: " + changedFile,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\/research-retrieval\//, "must not add retrieval implementation files");
    assert.doesNotMatch(changedFile, /^lib\/research-rag\//, "must not add RAG implementation files");
    assert.doesNotMatch(changedFile, /^lib\/.*promotion/i, "must not add runtime promotion implementation files");
    assert.doesNotMatch(changedFile, /^lib\/.*perspective.*state/i, "must not add runtime Perspective state files");
    assert.doesNotMatch(changedFile, /^lib\/.*(proof|evidence).*write/i, "must not add proof/evidence write files");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|openai|source-fetch|crawler)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
  for (const requiredText of [
    "human_reviewed_durable_perspective_promotion_browser_validation.v0.1",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-browser-validation.sample.v0.1.json",
    "scripts/smoke-human-reviewed-durable-perspective-promotion-browser-validation-v0-1.mjs",
    "smoke:human-reviewed-durable-perspective-promotion-browser-validation-v0-1",
    "ready_for_durable_perspective_state_trajectory_contract_v0_1",
    "durable_perspective_state_trajectory_contract_v0_1",
    "validates deterministic fixture-backed implementation from #731",
    "explicit human review required",
    "source_refs required",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      readFileSync("scripts/smoke-human-reviewed-durable-perspective-promotion-implementation-v0-1.mjs", "utf8").includes(requiredText),
      "downstream smoke must allow Human-reviewed Durable Perspective Promotion browser validation pointer: " + requiredText,
    );
  }
}

function humanReviewedDurablePerspectivePromotionImplementationSliceActive() {
  return readChangedFiles().includes(
    "scripts/smoke-human-reviewed-durable-perspective-promotion-implementation-v0-1.mjs",
  );
}

function assertHumanReviewedDurablePerspectivePromotionImplementationPackageScript() {
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
    packageJson.scripts["smoke:human-reviewed-durable-perspective-promotion-implementation-v0-1"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-human-reviewed-durable-perspective-promotion-implementation-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:human-reviewed-durable-perspective-promotion-implementation-v0-1"],
    "package.json must add only the Human-reviewed Durable Perspective Promotion implementation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
  if (typeof basePackageJson !== "undefined") {
    assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
    assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
    assert.deepEqual(
      packageJson.optionalDependencies ?? {},
      basePackageJson.optionalDependencies ?? {},
    );
  }
}

function assertHumanReviewedDurablePerspectivePromotionImplementationChangedFiles(changedFiles) {
  const implementationAllowedSmokePaths = [
    "scripts/smoke-human-reviewed-durable-perspective-promotion-contract-v0-1.mjs",
    "scripts/smoke-human-reviewed-durable-perspective-promotion-implementation-v0-1.mjs",
    "scripts/smoke-non-authoritative-retrieval-rag-browser-validation-v0-1.mjs",
    "scripts/smoke-non-authoritative-retrieval-rag-implementation-v0-1.mjs",
    "scripts/smoke-non-authoritative-retrieval-rag-contract-v0-1.mjs",
    "scripts/smoke-operator-source-candidate-generation-browser-validation-v0-1.mjs",
    "scripts/smoke-operator-source-candidate-generation-implementation-v0-1.mjs",
    "scripts/smoke-operator-source-candidate-generation-contract-v0-1.mjs",
    "scripts/smoke-bounded-external-source-intake-browser-validation-v0-1.mjs",
    "scripts/smoke-bounded-external-source-intake-implementation-v0-1.mjs",
    "scripts/smoke-bounded-external-source-intake-contract-v0-1.mjs",
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
  const implementationBuilderPath =
    "lib/research-candidate-review/human-reviewed-durable-perspective-promotion.ts";
  const implementationFixturePath =
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-implementation.sample.v0.1.json";
  const implementationSmokePath =
    "scripts/smoke-human-reviewed-durable-perspective-promotion-implementation-v0-1.mjs";
  const implementationContractSmokePath =
    "scripts/smoke-human-reviewed-durable-perspective-promotion-contract-v0-1.mjs";
  const expectedFiles = [
    implementationBuilderPath,
    implementationFixturePath,
    implementationSmokePath,
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    implementationContractSmokePath,
    "scripts/smoke-non-authoritative-retrieval-rag-browser-validation-v0-1.mjs",
    "scripts/smoke-non-authoritative-retrieval-rag-contract-v0-1.mjs",
    "scripts/smoke-non-authoritative-retrieval-rag-implementation-v0-1.mjs",
    smokePath,
    ...implementationAllowedSmokePaths,
    ...(typeof downstreamSmokePaths === "undefined" ? [] : downstreamSmokePaths),
  ];
  for (const unchangedPath of [
    "types/human-reviewed-durable-perspective-promotion-contract.ts",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-contract.sample.v0.1.json",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-browser-validation.sample.v0.1.json",
    "types/non-authoritative-retrieval-rag-contract.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-contract.sample.v0.1.json",
    "lib/research-candidate-review/non-authoritative-retrieval-rag.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-implementation.sample.v0.1.json",
    "lib/research-candidate-review/operator-source-candidate-generation.ts",
    "fixtures/research-candidate-review.operator-source-candidate-generation-implementation.sample.v0.1.json",
    "lib/research-candidate-review/bounded-external-source-intake.ts",
    "fixtures/research-candidate-review.bounded-external-source-intake-implementation.sample.v0.1.json",
    "lib/research-candidate-review/salience-governor.ts",
    "fixtures/research-candidate-review.salience-governor-implementation.sample.v0.1.json",
    "lib/research-candidate-review/recent-rehearsal-buffer.ts",
    "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
    "lib/db/schema.sql",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      "Human-reviewed Durable Perspective Promotion implementation slice must not change " + unchangedPath,
    );
  }
  for (const expectedFile of [
    implementationBuilderPath,
    implementationFixturePath,
    implementationSmokePath,
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    implementationContractSmokePath,
  ]) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      "unexpected changed file in Human-reviewed Durable Perspective Promotion implementation downstream slice: " + changedFile,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\/research-retrieval\//, "must not add retrieval implementation files");
    assert.doesNotMatch(changedFile, /^lib\/research-rag\//, "must not add RAG implementation files");
    if (changedFile !== implementationBuilderPath) {
      assert.doesNotMatch(changedFile, /^lib\/.*promotion/i, "must not add runtime promotion implementation files");
    }
    assert.doesNotMatch(changedFile, /^lib\/.*perspective.*state/i, "must not add runtime Perspective state files");
    assert.doesNotMatch(changedFile, /^lib\/.*(proof|evidence).*write/i, "must not add proof/evidence write files");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|openai|source-fetch|crawler)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
  for (const requiredText of [
    "human_reviewed_durable_perspective_promotion_implementation.v0.1",
    implementationBuilderPath,
    implementationFixturePath,
    implementationSmokePath,
    "smoke:human-reviewed-durable-perspective-promotion-implementation-v0-1",
    "ready_for_human_reviewed_durable_perspective_promotion_browser_validation_v0_1",
    "human_reviewed_durable_perspective_promotion_browser_validation_v0_1",
    "deterministic fixture-backed implementation only",
    "explicit human review required",
    "source_refs required",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      readFileSync(implementationSmokePath, "utf8").includes(requiredText),
      "downstream smoke must allow Human-reviewed Durable Perspective Promotion implementation pointer: " + requiredText,
    );
  }
}

function humanReviewedDurablePerspectivePromotionContractSliceActive() {
  return readChangedFiles().includes(
    "scripts/smoke-human-reviewed-durable-perspective-promotion-contract-v0-1.mjs",
  );
}

function assertHumanReviewedDurablePerspectivePromotionContractPackageScript() {
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
    packageJson.scripts["smoke:human-reviewed-durable-perspective-promotion-contract-v0-1"],
    "node scripts/smoke-human-reviewed-durable-perspective-promotion-contract-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:human-reviewed-durable-perspective-promotion-contract-v0-1"],
    "package.json must add only the Human-reviewed Durable Perspective Promotion contract smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
  if (typeof basePackageJson !== "undefined") {
    assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
    assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
    assert.deepEqual(
      packageJson.optionalDependencies ?? {},
      basePackageJson.optionalDependencies ?? {},
    );
  }
}

function assertHumanReviewedDurablePerspectivePromotionContractChangedFiles(changedFiles) {
  const expectedFiles = [
    "types/human-reviewed-durable-perspective-promotion-contract.ts",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-contract.sample.v0.1.json",
    "scripts/smoke-human-reviewed-durable-perspective-promotion-contract-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    "scripts/smoke-non-authoritative-retrieval-rag-browser-validation-v0-1.mjs",
    "scripts/smoke-non-authoritative-retrieval-rag-implementation-v0-1.mjs",
    "scripts/smoke-non-authoritative-retrieval-rag-contract-v0-1.mjs",
    "scripts/smoke-operator-source-candidate-generation-browser-validation-v0-1.mjs",
    "scripts/smoke-operator-source-candidate-generation-implementation-v0-1.mjs",
    "scripts/smoke-operator-source-candidate-generation-contract-v0-1.mjs",
    "scripts/smoke-bounded-external-source-intake-browser-validation-v0-1.mjs",
    "scripts/smoke-bounded-external-source-intake-implementation-v0-1.mjs",
    "scripts/smoke-bounded-external-source-intake-contract-v0-1.mjs",
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
  for (const unchangedPath of [
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-browser-validation.sample.v0.1.json",
    "lib/research-candidate-review/non-authoritative-retrieval-rag.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-implementation.sample.v0.1.json",
    "types/non-authoritative-retrieval-rag-contract.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-contract.sample.v0.1.json",
    "lib/research-candidate-review/operator-source-candidate-generation.ts",
    "fixtures/research-candidate-review.operator-source-candidate-generation-implementation.sample.v0.1.json",
    "lib/research-candidate-review/bounded-external-source-intake.ts",
    "fixtures/research-candidate-review.bounded-external-source-intake-implementation.sample.v0.1.json",
    "lib/research-candidate-review/salience-governor.ts",
    "fixtures/research-candidate-review.salience-governor-implementation.sample.v0.1.json",
    "lib/research-candidate-review/recent-rehearsal-buffer.ts",
    "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
    "lib/db/schema.sql",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      "Human-reviewed Durable Perspective Promotion contract slice must not change " + unchangedPath,
    );
  }
  for (const expectedFile of [
    "types/human-reviewed-durable-perspective-promotion-contract.ts",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-contract.sample.v0.1.json",
    "scripts/smoke-human-reviewed-durable-perspective-promotion-contract-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    "scripts/smoke-non-authoritative-retrieval-rag-browser-validation-v0-1.mjs",
  ]) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      "unexpected changed file in Human-reviewed Durable Perspective Promotion contract downstream slice: " + changedFile,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\/research-retrieval\//, "must not add retrieval implementation files");
    assert.doesNotMatch(changedFile, /^lib\/research-rag\//, "must not add RAG implementation files");
    assert.doesNotMatch(changedFile, /^lib\/.*promotion/i, "must not add runtime promotion implementation files");
    assert.doesNotMatch(changedFile, /^lib\/.*perspective.*state/i, "must not add runtime Perspective state files");
    assert.doesNotMatch(changedFile, /^lib\/.*(proof|evidence).*write/i, "must not add proof/evidence write files");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|openai|source-fetch|crawler)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
  for (const requiredText of [
    "human_reviewed_durable_perspective_promotion_contract.v0.1",
    "types/human-reviewed-durable-perspective-promotion-contract.ts",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-contract.sample.v0.1.json",
    "scripts/smoke-human-reviewed-durable-perspective-promotion-contract-v0-1.mjs",
    "smoke:human-reviewed-durable-perspective-promotion-contract-v0-1",
    "ready_for_human_reviewed_durable_perspective_promotion_implementation_v0_1",
    "human_reviewed_durable_perspective_promotion_implementation_v0_1",
    "future human/Core promotion gate only",
    "explicit human review required",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      readFileSync(smokePath, "utf8").includes(requiredText),
      "downstream smoke must allow Human-reviewed Durable Perspective Promotion contract pointer: " + requiredText,
    );
  }
}

function assertNonAuthoritativeRetrievalRagBrowserValidationPackageScript() {
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
    packageJson.scripts["smoke:non-authoritative-retrieval-rag-browser-validation-v0-1"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-non-authoritative-retrieval-rag-browser-validation-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:non-authoritative-retrieval-rag-browser-validation-v0-1"],
    "package.json must add only the Non-authoritative Retrieval/RAG browser validation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
  if (typeof basePackageJson !== "undefined") {
    assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
    assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
    assert.deepEqual(
      packageJson.optionalDependencies ?? {},
      basePackageJson.optionalDependencies ?? {},
    );
  }
}

function assertNonAuthoritativeRetrievalRagBrowserValidationChangedFiles(changedFiles) {
  const expectedFiles = [
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-browser-validation.sample.v0.1.json",
    "scripts/smoke-non-authoritative-retrieval-rag-browser-validation-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    "scripts/smoke-non-authoritative-retrieval-rag-implementation-v0-1.mjs",
    "scripts/smoke-non-authoritative-retrieval-rag-contract-v0-1.mjs",
    "scripts/smoke-operator-source-candidate-generation-browser-validation-v0-1.mjs",
    "scripts/smoke-operator-source-candidate-generation-implementation-v0-1.mjs",
    "scripts/smoke-operator-source-candidate-generation-contract-v0-1.mjs",
    "scripts/smoke-bounded-external-source-intake-browser-validation-v0-1.mjs",
    "scripts/smoke-bounded-external-source-intake-implementation-v0-1.mjs",
    "scripts/smoke-bounded-external-source-intake-contract-v0-1.mjs",
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
  for (const unchangedPath of [
    "lib/research-candidate-review/non-authoritative-retrieval-rag.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-implementation.sample.v0.1.json",
    "types/non-authoritative-retrieval-rag-contract.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-contract.sample.v0.1.json",
    "lib/research-candidate-review/operator-source-candidate-generation.ts",
    "fixtures/research-candidate-review.operator-source-candidate-generation-implementation.sample.v0.1.json",
    "lib/research-candidate-review/bounded-external-source-intake.ts",
    "fixtures/research-candidate-review.bounded-external-source-intake-implementation.sample.v0.1.json",
    "lib/research-candidate-review/salience-governor.ts",
    "fixtures/research-candidate-review.salience-governor-implementation.sample.v0.1.json",
    "lib/research-candidate-review/recent-rehearsal-buffer.ts",
    "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
    "lib/db/schema.sql",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      "Non-authoritative Retrieval/RAG browser validation slice must not change " + unchangedPath,
    );
  }
  for (const expectedFile of [
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-browser-validation.sample.v0.1.json",
    "scripts/smoke-non-authoritative-retrieval-rag-browser-validation-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    "scripts/smoke-non-authoritative-retrieval-rag-implementation-v0-1.mjs",
    "scripts/smoke-non-authoritative-retrieval-rag-contract-v0-1.mjs",
  ]) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      "unexpected changed file in Non-authoritative Retrieval/RAG browser validation downstream slice: " + changedFile,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\/research-retrieval\//, "must not add retrieval implementation files");
    assert.doesNotMatch(changedFile, /^lib\/research-rag\//, "must not add RAG implementation files");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|openai|source-fetch|crawler)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
  for (const requiredText of [
    "non_authoritative_retrieval_rag_browser_validation.v0.1",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-browser-validation.sample.v0.1.json",
    "scripts/smoke-non-authoritative-retrieval-rag-browser-validation-v0-1.mjs",
    "smoke:non-authoritative-retrieval-rag-browser-validation-v0-1",
    "ready_for_human_reviewed_durable_perspective_promotion_contract_v0_1",
    "human_reviewed_durable_perspective_promotion_contract_v0_1",
    "validates deterministic fixture-backed implementation from #728",
    "validates #727 contract boundary and #728 top-level implementation boundary separation",
    "retrieval result is recall, not authority",
    "RAG answer is context preview, not evidence/proof",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      readFileSync(smokePath, "utf8").includes(requiredText),
      "downstream smoke must allow Non-authoritative Retrieval/RAG browser validation pointer: " + requiredText,
    );
  }
}

function assertNonAuthoritativeRetrievalRagImplementationPackageScript() {
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
    packageJson.scripts["smoke:non-authoritative-retrieval-rag-implementation-v0-1"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-non-authoritative-retrieval-rag-implementation-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:non-authoritative-retrieval-rag-implementation-v0-1"],
    "package.json must add only the Non-authoritative Retrieval/RAG implementation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
}

function assertNonAuthoritativeRetrievalRagImplementationChangedFiles(changedFiles) {
  const expectedFiles = [
    "lib/research-candidate-review/non-authoritative-retrieval-rag.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-implementation.sample.v0.1.json",
    "scripts/smoke-non-authoritative-retrieval-rag-implementation-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    "scripts/smoke-non-authoritative-retrieval-rag-contract-v0-1.mjs",
    "scripts/smoke-operator-source-candidate-generation-browser-validation-v0-1.mjs",
    "scripts/smoke-operator-source-candidate-generation-implementation-v0-1.mjs",
    "scripts/smoke-operator-source-candidate-generation-contract-v0-1.mjs",
    "scripts/smoke-bounded-external-source-intake-browser-validation-v0-1.mjs",
    "scripts/smoke-bounded-external-source-intake-implementation-v0-1.mjs",
    "scripts/smoke-bounded-external-source-intake-contract-v0-1.mjs",
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
  for (const unchangedPath of [
    "types/non-authoritative-retrieval-rag-contract.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-contract.sample.v0.1.json",
    "lib/research-candidate-review/operator-source-candidate-generation.ts",
    "fixtures/research-candidate-review.operator-source-candidate-generation-implementation.sample.v0.1.json",
    "lib/research-candidate-review/bounded-external-source-intake.ts",
    "fixtures/research-candidate-review.bounded-external-source-intake-implementation.sample.v0.1.json",
    "lib/research-candidate-review/salience-governor.ts",
    "fixtures/research-candidate-review.salience-governor-implementation.sample.v0.1.json",
    "lib/research-candidate-review/recent-rehearsal-buffer.ts",
    "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
    "lib/db/schema.sql",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      "Non-authoritative Retrieval/RAG implementation slice must not change " + unchangedPath,
    );
  }
  for (const expectedFile of [
    "lib/research-candidate-review/non-authoritative-retrieval-rag.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-implementation.sample.v0.1.json",
    "scripts/smoke-non-authoritative-retrieval-rag-implementation-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    "scripts/smoke-non-authoritative-retrieval-rag-contract-v0-1.mjs",
  ]) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      "unexpected changed file in Non-authoritative Retrieval/RAG implementation downstream slice: " + changedFile,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\/research-retrieval\//, "must not add retrieval implementation files");
    assert.doesNotMatch(changedFile, /^lib\/research-rag\//, "must not add RAG implementation files");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|openai|source-fetch|crawler)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}

function assertNonAuthoritativeRetrievalRagContractPackageScript() {
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
    packageJson.scripts["smoke:non-authoritative-retrieval-rag-contract-v0-1"],
    "node scripts/smoke-non-authoritative-retrieval-rag-contract-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:non-authoritative-retrieval-rag-contract-v0-1"],
    "package.json must add only the Non-authoritative Retrieval/RAG contract smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
}

function assertNonAuthoritativeRetrievalRagContractChangedFiles(changedFiles) {
  const expectedFiles = [
    "types/non-authoritative-retrieval-rag-contract.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-contract.sample.v0.1.json",
    "scripts/smoke-non-authoritative-retrieval-rag-contract-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    "scripts/smoke-operator-source-candidate-generation-browser-validation-v0-1.mjs",
    "scripts/smoke-operator-source-candidate-generation-implementation-v0-1.mjs",
    "scripts/smoke-operator-source-candidate-generation-contract-v0-1.mjs",
    "scripts/smoke-bounded-external-source-intake-browser-validation-v0-1.mjs",
    "scripts/smoke-bounded-external-source-intake-implementation-v0-1.mjs",
    "scripts/smoke-bounded-external-source-intake-contract-v0-1.mjs",
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
  for (const unchangedPath of [
    "lib/research-candidate-review/operator-source-candidate-generation.ts",
    "fixtures/research-candidate-review.operator-source-candidate-generation-implementation.sample.v0.1.json",
    "types/operator-source-candidate-generation-contract.ts",
    "fixtures/research-candidate-review.operator-source-candidate-generation-contract.sample.v0.1.json",
    "lib/research-candidate-review/bounded-external-source-intake.ts",
    "fixtures/research-candidate-review.bounded-external-source-intake-implementation.sample.v0.1.json",
    "lib/research-candidate-review/salience-governor.ts",
    "fixtures/research-candidate-review.salience-governor-implementation.sample.v0.1.json",
    "lib/research-candidate-review/recent-rehearsal-buffer.ts",
    "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      "Non-authoritative Retrieval/RAG contract slice must not change " + unchangedPath,
    );
  }
  for (const expectedFile of [
    "types/non-authoritative-retrieval-rag-contract.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-contract.sample.v0.1.json",
    "scripts/smoke-non-authoritative-retrieval-rag-contract-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    "scripts/smoke-operator-source-candidate-generation-browser-validation-v0-1.mjs",
  ]) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      "unexpected changed file in Non-authoritative Retrieval/RAG contract downstream slice: " + changedFile,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\/research-retrieval\//, "must not add retrieval implementation files");
    assert.doesNotMatch(changedFile, /^lib\/research-rag\//, "must not add RAG implementation files");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|source-fetch|crawler)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}

function operatorSourceCandidateGenerationBrowserValidationSliceActive() {
  return readChangedFiles().includes(
    "scripts/smoke-operator-source-candidate-generation-browser-validation-v0-1.mjs",
  );
}

function assertOperatorSourceCandidateGenerationBrowserValidationPackageScript() {
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
    packageJson.scripts[
      "smoke:operator-source-candidate-generation-browser-validation-v0-1"
    ],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-operator-source-candidate-generation-browser-validation-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:operator-source-candidate-generation-browser-validation-v0-1"],
    "package.json must add only the Operator Source Candidate Generation browser validation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
}

function assertOperatorSourceCandidateGenerationBrowserValidationChangedFiles(changedFiles) {
  const expectedFiles = [
    "fixtures/research-candidate-review.operator-source-candidate-generation-browser-validation.sample.v0.1.json",
    "scripts/smoke-operator-source-candidate-generation-browser-validation-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    "scripts/smoke-operator-source-candidate-generation-implementation-v0-1.mjs",
    "scripts/smoke-operator-source-candidate-generation-contract-v0-1.mjs",
    "scripts/smoke-bounded-external-source-intake-browser-validation-v0-1.mjs",
    "scripts/smoke-bounded-external-source-intake-implementation-v0-1.mjs",
    "scripts/smoke-bounded-external-source-intake-contract-v0-1.mjs",
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
  for (const unchangedPath of [
    "lib/research-candidate-review/operator-source-candidate-generation.ts",
    "fixtures/research-candidate-review.operator-source-candidate-generation-implementation.sample.v0.1.json",
    "types/operator-source-candidate-generation-contract.ts",
    "fixtures/research-candidate-review.operator-source-candidate-generation-contract.sample.v0.1.json",
    "lib/research-candidate-review/bounded-external-source-intake.ts",
    "fixtures/research-candidate-review.bounded-external-source-intake-implementation.sample.v0.1.json",
    "lib/research-candidate-review/salience-governor.ts",
    "fixtures/research-candidate-review.salience-governor-implementation.sample.v0.1.json",
    "lib/research-candidate-review/recent-rehearsal-buffer.ts",
    "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      "Operator Source Candidate Generation browser validation slice must not change " + unchangedPath,
    );
  }
  for (const expectedFile of [
    "fixtures/research-candidate-review.operator-source-candidate-generation-browser-validation.sample.v0.1.json",
    "scripts/smoke-operator-source-candidate-generation-browser-validation-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    "scripts/smoke-operator-source-candidate-generation-implementation-v0-1.mjs",
  ]) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      "unexpected changed file in Operator Source Candidate Generation browser validation downstream slice: " + changedFile,
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

function operatorSourceCandidateGenerationImplementationSliceActive() {
  return readChangedFiles().includes(
    "scripts/smoke-operator-source-candidate-generation-implementation-v0-1.mjs",
  );
}

function assertOperatorSourceCandidateGenerationImplementationPackageScript() {
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
    packageJson.scripts[
      "smoke:operator-source-candidate-generation-implementation-v0-1"
    ],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-operator-source-candidate-generation-implementation-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:operator-source-candidate-generation-implementation-v0-1"],
    "package.json must add only the Operator Source Candidate Generation implementation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
}

function assertOperatorSourceCandidateGenerationImplementationChangedFiles(changedFiles) {
  const expectedFiles = [
    "lib/research-candidate-review/operator-source-candidate-generation.ts",
    "fixtures/research-candidate-review.operator-source-candidate-generation-implementation.sample.v0.1.json",
    "scripts/smoke-operator-source-candidate-generation-implementation-v0-1.mjs",
    packagePath,
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    "scripts/smoke-operator-source-candidate-generation-contract-v0-1.mjs",
    "scripts/smoke-bounded-external-source-intake-browser-validation-v0-1.mjs",
    "scripts/smoke-bounded-external-source-intake-implementation-v0-1.mjs",
    "scripts/smoke-bounded-external-source-intake-contract-v0-1.mjs",
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
  for (const unchangedPath of [
    "types/operator-source-candidate-generation-contract.ts",
    "fixtures/research-candidate-review.operator-source-candidate-generation-contract.sample.v0.1.json",
    "lib/research-candidate-review/bounded-external-source-intake.ts",
    "fixtures/research-candidate-review.bounded-external-source-intake-implementation.sample.v0.1.json",
    "lib/research-candidate-review/salience-governor.ts",
    "fixtures/research-candidate-review.salience-governor-implementation.sample.v0.1.json",
    "lib/research-candidate-review/recent-rehearsal-buffer.ts",
    "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      "Operator Source Candidate Generation implementation slice must not change " + unchangedPath,
    );
  }
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      "unexpected changed file in Operator Source Candidate Generation implementation downstream slice: " + changedFile,
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

function operatorSourceCandidateGenerationContractSliceActive() {
  return readChangedFiles().includes(
    "scripts/smoke-operator-source-candidate-generation-contract-v0-1.mjs",
  );
}

function assertOperatorSourceCandidateGenerationContractPackageScript() {
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
    packageJson.scripts[
      "smoke:operator-source-candidate-generation-contract-v0-1"
    ],
    "node scripts/smoke-operator-source-candidate-generation-contract-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:operator-source-candidate-generation-contract-v0-1"],
    "package.json must add only the Operator Source Candidate Generation contract smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
}

function assertOperatorSourceCandidateGenerationContractChangedFiles(changedFiles) {
  const expectedFiles = [
    "types/operator-source-candidate-generation-contract.ts",
    "fixtures/research-candidate-review.operator-source-candidate-generation-contract.sample.v0.1.json",
    "scripts/smoke-operator-source-candidate-generation-contract-v0-1.mjs",
    packagePath,
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    "scripts/smoke-bounded-external-source-intake-browser-validation-v0-1.mjs",
    "scripts/smoke-bounded-external-source-intake-implementation-v0-1.mjs",
    "scripts/smoke-bounded-external-source-intake-contract-v0-1.mjs",
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
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const unchangedPath of [
    "lib/research-candidate-review/bounded-external-source-intake.ts",
    "fixtures/research-candidate-review.bounded-external-source-intake-implementation.sample.v0.1.json",
    "lib/research-candidate-review/salience-governor.ts",
    "fixtures/research-candidate-review.salience-governor-implementation.sample.v0.1.json",
    "lib/research-candidate-review/recent-rehearsal-buffer.ts",
    "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      "Operator Source Candidate Generation contract slice must not change " + unchangedPath,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      "unexpected changed file in Operator Source Candidate Generation contract downstream slice: " + changedFile,
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

function boundedExternalSourceIntakeBrowserValidationSliceActive() {
  return readChangedFiles().includes(
    "scripts/smoke-bounded-external-source-intake-browser-validation-v0-1.mjs",
  );
}

function assertBoundedExternalSourceIntakeBrowserValidationPackageScript() {
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
    packageJson.scripts[
      "smoke:bounded-external-source-intake-browser-validation-v0-1"
    ],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-bounded-external-source-intake-browser-validation-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:bounded-external-source-intake-browser-validation-v0-1"],
    "package.json must add only the Bounded External Source Intake browser validation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
}

function assertBoundedExternalSourceIntakeBrowserValidationChangedFiles(changedFiles) {
  const expectedFiles = [
    "fixtures/research-candidate-review.bounded-external-source-intake-browser-validation.sample.v0.1.json",
    "scripts/smoke-bounded-external-source-intake-browser-validation-v0-1.mjs",
    packagePath,
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    "scripts/smoke-bounded-external-source-intake-implementation-v0-1.mjs",
    "scripts/smoke-bounded-external-source-intake-contract-v0-1.mjs",
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
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const unchangedPath of [
    "lib/research-candidate-review/bounded-external-source-intake.ts",
    "fixtures/research-candidate-review.bounded-external-source-intake-implementation.sample.v0.1.json",
    "lib/research-candidate-review/salience-governor.ts",
    "fixtures/research-candidate-review.salience-governor-implementation.sample.v0.1.json",
    "lib/research-candidate-review/recent-rehearsal-buffer.ts",
    "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      "Bounded External Source Intake browser validation slice must not change " + unchangedPath,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      "unexpected changed file in Bounded External Source Intake browser validation slice: " + changedFile,
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

function boundedExternalSourceIntakeImplementationSliceActive() {
  return readChangedFiles().includes("scripts/smoke-bounded-external-source-intake-implementation-v0-1.mjs");
}

function assertBoundedExternalSourceIntakeImplementationPackageScript() {
  const packageAddedLines = readGitOutput([
    "diff",
    "--unified=0",
    mergeBaseRef(),
    "--",
    "package.json",
  ])
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"));
  const addedScriptNames = packageAddedLines
    .map((line) => line.match(/^\+\s+"([^"]+)"\s*:/)?.[1] ?? null)
    .filter(Boolean)
    .sort();
  assert.equal(
    packageJson.scripts["smoke:bounded-external-source-intake-implementation-v0-1"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-bounded-external-source-intake-implementation-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:bounded-external-source-intake-implementation-v0-1"],
    "package.json must add only the Bounded External Source Intake implementation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
}

function assertBoundedExternalSourceIntakeImplementationChangedFiles(changedFiles) {
  const expectedFiles = [
    "lib/research-candidate-review/bounded-external-source-intake.ts",
    "fixtures/research-candidate-review.bounded-external-source-intake-implementation.sample.v0.1.json",
    "scripts/smoke-bounded-external-source-intake-implementation-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    "scripts/smoke-bounded-external-source-intake-contract-v0-1.mjs",
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
    "types/bounded-external-source-intake-contract.ts",
    "fixtures/research-candidate-review.bounded-external-source-intake-contract.sample.v0.1.json",
    "lib/research-candidate-review/salience-governor.ts",
    "fixtures/research-candidate-review.salience-governor-implementation.sample.v0.1.json",
    "lib/research-candidate-review/recent-rehearsal-buffer.ts",
    "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `Bounded External Source Intake implementation slice must not change ${unchangedPath}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      `unexpected changed file in Bounded External Source Intake implementation downstream slice: ${changedFile}`,
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
