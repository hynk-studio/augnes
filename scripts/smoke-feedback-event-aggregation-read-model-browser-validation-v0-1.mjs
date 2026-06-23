import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const builderPath =
  "lib/research-candidate-review/feedback-event-aggregation-read-model.ts";
const implementationFixturePath =
  "fixtures/research-candidate-review.feedback-event-aggregation-read-model-implementation.sample.v0.1.json";
const implementationSmokePath =
  "scripts/smoke-feedback-event-aggregation-read-model-implementation-v0-1.mjs";
const contractFixturePath =
  "fixtures/research-candidate-review.feedback-event-aggregation-read-model-contract.sample.v0.1.json";
const feedbackStoreFixturePath =
  "fixtures/research-candidate-review.feedback-event-store.sample.v0.1.json";
const validationFixturePath =
  "fixtures/research-candidate-review.feedback-event-aggregation-read-model-browser-validation.sample.v0.1.json";
const smokePath =
  "scripts/smoke-feedback-event-aggregation-read-model-browser-validation-v0-1.mjs";
const formationReceiptDurableEventContractTypePath =
  "types/formation-receipt-durable-event-contract.ts";
const formationReceiptDurableEventContractFixturePath =
  "fixtures/research-candidate-review.formation-receipt-durable-event-contract.sample.v0.1.json";
const formationReceiptDurableEventContractSmokePath =
  "scripts/smoke-formation-receipt-durable-event-contract-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";

const packageScriptName =
  "smoke:feedback-event-aggregation-read-model-browser-validation-v0-1";
const packageScriptValue =
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
const validationKind = "feedback_event_aggregation_read_model_browser_validation";
const validationVersion =
  "feedback_event_aggregation_read_model_browser_validation.v0.1";
const recommendationStatus =
  "ready_for_formation_receipt_durable_event_contract_v0_1";
const nextRecommendedSlice = "formation_receipt_durable_event_contract_v0_1";
const formationReceiptDurableEventContractVersion =
  "formation_receipt_durable_event_contract.v0.1";
const formationReceiptDurableEventContractRecommendationStatus =
  "ready_for_formation_receipt_durable_event_implementation_v0_1";
const formationReceiptDurableEventContractNextRecommendedSlice =
  "formation_receipt_durable_event_implementation_v0_1";
const writeFixture = process.argv.includes("--write-fixture");

const expectedChangedFiles = [
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

for (const filePath of [
  builderPath,
  implementationFixturePath,
  implementationSmokePath,
  contractFixturePath,
  feedbackStoreFixturePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}
if (!writeFixture) {
  assert.ok(existsSync(validationFixturePath), `${validationFixturePath} must exist`);
}

const builderSource = readFile(builderPath);
const implementationSmokeSource = readFile(implementationSmokePath);
const validationSmokeSource = readFile(smokePath);
const packageJson = readJson(packagePath);
const basePackageJson = readJsonFromGit(packagePath);
const implementationFixture = readJson(implementationFixturePath);
const contractFixture = readJson(contractFixturePath);
const feedbackStoreFixture = readJson(feedbackStoreFixturePath);
const indexDoc = readFile(indexPath);
const substrateDoc = readFile(substrateDocPath);
const surfaceDoc = readFile(surfaceDocPath);
const gateDoc = readFile(gateDocPath);

const { buildFeedbackEventAggregationReadModelImplementation } = await import(
  "../lib/research-candidate-review/feedback-event-aggregation-read-model.ts"
);

const rebuiltImplementation = buildFeedbackEventAggregationReadModelImplementation({
  feedback_events: feedbackStoreFixture.events,
  aggregation_read_model_contract: contractFixture,
  source_contract_ref: `${contractFixture.contract_version}:${contractFixturePath}`,
  source_feedback_event_store_ref: `${feedbackStoreFixture.fixture_version}:${feedbackStoreFixturePath}`,
});
const rebuiltFixture = buildValidationFixture();

if (writeFixture) {
  writeFileSync(validationFixturePath, `${JSON.stringify(rebuiltFixture, null, 2)}\n`);
  process.exit(0);
}

const validationFixture = readJson(validationFixturePath);

assertBuilderAndFixture();
assertPackageScript();
assertStaticBoundary();
assertNoForbiddenRuntimePatterns();
assertImplementationRebuild();
assertImplementationViews(implementationFixture, contractFixture);
assertRecentWindow(implementationFixture);
assertDuplicateSummary(implementationFixture.duplicate_feedback_summary);
assertAuthorityBoundary(validationFixture.authority_boundary);
assertDocsPointers();
assertImplementationSmokeDownstreamPointer();
assertFormationReceiptDurableEventContractDownstreamPointer();
assert.deepEqual(
  validationFixture,
  rebuiltFixture,
  "rebuilt feedback event aggregation read model browser validation fixture must match committed fixture",
);

console.log(
  JSON.stringify(
    {
      smoke: "feedback-event-aggregation-read-model-browser-validation-v0-1",
      final_status: "pass",
      validation_kind: validationFixture.validation_kind,
      validation_version: validationFixture.validation_version,
      source_implementation_fingerprint:
        validationFixture.source_implementation_fingerprint,
      runtime_db_query_now: validationFixture.authority_boundary.runtime_db_query_now,
      browser_request_now: validationFixture.authority_boundary.browser_request_now,
      salience_authority: validationFixture.authority_boundary.salience_authority,
      product_write_lane_parked_by_686:
        validationFixture.authority_boundary.product_write_lane_parked_by_686,
      next_recommended_slice: validationFixture.next_recommended_slice,
    },
    null,
    2,
  ),
);

function buildValidationFixture() {
  const fixture = {
    validation_kind: validationKind,
    validation_version: validationVersion,
    source_implementation_ref: `${implementationFixture.implementation_version}:${implementationFixturePath}`,
    source_implementation_fingerprint: implementationFixture.implementation_fingerprint,
    validated_builder: {
      builder_path: builderPath,
      implementation_fixture_path: implementationFixturePath,
      deterministic_fixture_backed_only: true,
      runtime_db_query_now: false,
      production_db_used_now: false,
      browser_request_now: false,
    },
    validated_views: {
      all_contract_views_implemented: true,
      all_views_sorted_by_contract_policy: true,
      all_views_limited_by_contract_policy: true,
      recent_window_one_row_per_created_at_day: true,
      duplicate_groups_display_only: true,
      read_model_only: true,
    },
    authority_boundary: {
      browser_validation_added_now: true,
      implementation_changed_now: false,
      route_changed_now: false,
      component_changed_now: false,
      runtime_db_query_now: false,
      production_db_used_now: false,
      browser_request_now: false,
      feedback_events_written_now: false,
      feedback_events_mutated_now: false,
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
    validation: {
      passed: true,
      failure_codes: [],
      implemented_view_count: implementationFixture.read_model_views.length,
      checked_sort_policy: true,
      checked_limit_policy: true,
      checked_deterministic_rebuild: true,
      checked_synthetic_uneven_rows_in_implementation_smoke: true,
    },
    recommendation_status: recommendationStatus,
    next_recommended_slice: nextRecommendedSlice,
    validation_fingerprint: "",
    fingerprint_algorithm: "fnv1a32_canonical_json",
  };
  fixture.validation_fingerprint = createFingerprint(fixture);
  return fixture;
}

function assertBuilderAndFixture() {
  for (const requiredText of [
    "buildFeedbackEventAggregationReadModelImplementation",
    "applyContractViewPolicies",
    "compareRowsBySortPolicy",
    "appliedLimit",
    "runtime_db_query_now: false",
    "browser_request_now: false",
    "product_write_lane_parked_by_686: true",
  ]) {
    assert.ok(builderSource.includes(requiredText), `${builderPath} must include ${requiredText}`);
  }
  assert.equal(
    implementationFixture.implementation_kind,
    "feedback_event_aggregation_read_model_implementation",
  );
  assert.equal(
    implementationFixture.implementation_version,
    "feedback_event_aggregation_read_model_implementation.v0.1",
  );
}

function assertPackageScript() {
  if (recentRehearsalBufferBrowserValidationSliceActive()) {
    assertRecentRehearsalBufferBrowserValidationPackageScript();
    return;
  }
  assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
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
  }
  assert.deepEqual(
    addedScripts,
    formationReceiptDurableEventContractSliceActive()
      ? [formationReceiptDurableEventContractPackageScriptName]
      : [packageScriptName],
    formationReceiptDurableEventContractSliceActive()
      ? "package.json must add only the Formation Receipt durable event contract smoke script"
      : "package.json must add only the aggregation read model browser validation smoke script",
  );
  assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
  assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
  assert.deepEqual(
    packageJson.optionalDependencies ?? {},
    basePackageJson.optionalDependencies ?? {},
  );
}

function assertStaticBoundary() {
  const changedFiles = readChangedFiles();
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
  const expectedFiles = formationReceiptDurableEventContractSliceActive()
    ? formationReceiptDurableEventContractChangedFiles
    : expectedChangedFiles;
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      `unexpected changed file in aggregation read model browser validation slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|retrieval|source-fetch)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}

function assertNoForbiddenRuntimePatterns() {
  const changedSourceFiles = readChangedFiles().filter((filePath) =>
    (filePath.endsWith(".ts") || filePath.endsWith(".tsx") || filePath.endsWith(".mjs")) &&
    !filePath.startsWith("scripts/smoke-"),
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
      { label: "salience score", regex: /\bsalience_score\b|\bsalienceScore\b/ },
      { label: "product write", regex: /\bexecuteProductWrite\b|\bproductDbWrite\b/i },
      { label: "product ID allocation", regex: /\ballocateProductId\b/i },
    ]) {
      assert.doesNotMatch(source, regex, `${filePath} must not include ${label}`);
    }
  }
}

function assertImplementationRebuild() {
  assert.deepEqual(
    implementationFixture,
    rebuiltImplementation,
    "#710 implementation fixture must match rebuilt deterministic output",
  );
}

function assertImplementationViews(implementation, contract) {
  const contractViewIds = contract.read_model_views.map((view) => view.view_id);
  assert.deepEqual(
    implementation.read_model_views.map((view) => view.view_id),
    contractViewIds,
    "every #709 contract view must be implemented",
  );
  for (const contractView of contract.read_model_views) {
    const implementationView = implementation.read_model_views.find(
      (view) => view.view_id === contractView.view_id,
    );
    assert.ok(implementationView, `${contractView.view_id} must be present`);
    assert.equal(implementationView.row_count, implementationView.rows.length);
    const limit = appliedLimit(contractView.limit_policy);
    if (typeof limit === "number") {
      assert.ok(
        implementationView.row_count <= limit,
        `${contractView.view_id} must obey contract limit_policy`,
      );
    }
    assertRowsSortedByPolicy(
      implementationView.rows,
      contractView.sort_policy,
      contractView.view_id,
    );
    assert.equal(implementationView.authority_boundary.read_model_only, true);
    assert.equal(implementationView.authority_boundary.not_source_of_truth, true);
    assert.equal(implementationView.authority_boundary.not_proof_or_evidence, true);
    assert.equal(implementationView.authority_boundary.not_perspective_state, true);
    assert.equal(implementationView.authority_boundary.not_work_status, true);
    assert.equal(implementationView.authority_boundary.not_promotion_decision, true);
    assert.equal(implementationView.authority_boundary.not_retrieval_rag_result, true);
    assert.equal(implementationView.authority_boundary.not_product_write, true);
  }
}

function assertRowsSortedByPolicy(rows, sortPolicy, viewId) {
  for (let index = 1; index < rows.length; index += 1) {
    assert.ok(
      compareRowsBySortPolicy(sortPolicy, rows[index - 1], rows[index]) <= 0,
      `${viewId} rows must be sorted by contract sort_policy`,
    );
  }
}

function assertRecentWindow(implementation) {
  const recentView = implementation.read_model_views.find(
    (view) => view.view_id === "recent_feedback_event_window_preview",
  );
  assert.ok(recentView, "recent feedback event window preview view must exist");
  const uniqueDays = uniqueSorted(
    feedbackStoreFixture.events.map((event) => String(event.created_at).slice(0, 10)),
  );
  assert.equal(recentView.rows.length, uniqueDays.length);
  assert.equal(implementation.recent_feedback_event_window_preview.rows.length, uniqueDays.length);
  for (const row of recentView.rows) {
    assert.ok(Object.hasOwn(row, "created_at_day"));
    assert.ok(Object.hasOwn(row, "event_count"));
    assert.ok(Object.hasOwn(row, "event_ids"));
    assert.ok(Object.hasOwn(row, "event_types"));
    assert.ok(Object.hasOwn(row, "target_kinds"));
    assert.ok(Object.hasOwn(row, "target_ids"));
    assert.ok(Object.hasOwn(row, "latest_created_at"));
    assert.equal(row.read_model_only, true);
    for (const forbiddenField of [
      "event_id",
      "event_type",
      "target_kind",
      "target_id",
      "created_at",
    ]) {
      assert.ok(!Object.hasOwn(row, forbiddenField), `recent row must not include ${forbiddenField}`);
    }
  }
}

function assertDuplicateSummary(value) {
  assert.equal(value.display_read_model_indicators_only, true);
  assert.equal(value.delete_feedback_events, false);
  assert.equal(value.rewrite_feedback_events, false);
  assert.equal(value.suppress_feedback_events, false);
  assert.equal(value.mutate_feedback_events, false);
  assert.equal(value.decides_promotion, false);
  assert.equal(value.decides_proof_or_evidence, false);
  assert.equal(value.decides_work_status, false);
  assert.equal(value.decides_product_write, false);
  for (const group of [...value.duplicate_groups, ...value.idempotency_key_duplicate_groups]) {
    assert.equal(group.display_indicator_only, true);
    assert.equal(group.mutates_feedback_events, false);
  }
}

function assertAuthorityBoundary(value) {
  assert.deepEqual(value, {
    browser_validation_added_now: true,
    implementation_changed_now: false,
    route_changed_now: false,
    component_changed_now: false,
    runtime_db_query_now: false,
    production_db_used_now: false,
    browser_request_now: false,
    feedback_events_written_now: false,
    feedback_events_mutated_now: false,
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

function assertDocsPointers() {
  for (const requiredText of [
    "Feedback Event aggregation read model browser validation v0.1",
    validationFixturePath,
    smokePath,
    packageScriptName,
    "validates deterministic fixture-backed implementation",
    "no runtime DB query",
    "no route or UI",
    "no browser request",
    "no feedback write/mutation",
    "no proof/evidence/Perspective promotion/work mutation",
    "no provider/OpenAI/source-fetch/retrieval/RAG execution",
    "no salience authority",
    "no product write/product IDs",
    "product-write remains parked by #686",
    nextRecommendedSlice,
  ]) {
    assert.ok(indexDoc.includes(requiredText), `index doc must include ${requiredText}`);
  }
  for (const doc of [substrateDoc, surfaceDoc, gateDoc]) {
    assert.match(doc, /Feedback event aggregation read model browser validation/i);
    assert.match(doc, /advisory\/read-only|validation/i);
    assert.match(doc, /fixture-backed/i);
    assert.match(doc, /not proof\/evidence|no proof\/evidence/i);
    assert.match(doc, /Perspective/i);
    assert.match(doc, /no runtime DB|runtime DB/i);
    assert.match(doc, /no browser/i);
    assert.match(doc, /provider\/OpenAI|OpenAI/i);
    assert.match(doc, /retrieval\/RAG/i);
    assert.match(doc, /product write/i);
    assert.match(doc, new RegExp(nextRecommendedSlice));
  }
}

function assertImplementationSmokeDownstreamPointer() {
  for (const requiredText of [
    validationVersion,
    validationFixturePath,
    smokePath,
    packageScriptName,
    recommendationStatus,
    nextRecommendedSlice,
    "assertSyntheticPolicyApplication",
  ]) {
    assert.ok(
      implementationSmokeSource.includes(requiredText),
      `#710 implementation smoke must allow browser validation text: ${requiredText}`,
    );
  }
}

function assertFormationReceiptDurableEventContractDownstreamPointer() {
  if (!formationReceiptDurableEventContractSliceActive()) return;
  for (const requiredText of [
    formationReceiptDurableEventContractVersion,
    formationReceiptDurableEventContractTypePath,
    formationReceiptDurableEventContractFixturePath,
    formationReceiptDurableEventContractSmokePath,
    formationReceiptDurableEventContractPackageScriptName,
    formationReceiptDurableEventContractRecommendationStatus,
    formationReceiptDurableEventContractNextRecommendedSlice,
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      validationSmokeSource.includes(requiredText),
      `#711 browser validation smoke must allow Formation Receipt durable event contract text: ${requiredText}`,
    );
  }
}

function compareRowsBySortPolicy(sortPolicy, a, b) {
  const orderBy = Array.isArray(sortPolicy.order_by) ? sortPolicy.order_by : [];
  const clauses = orderBy
    .map((clause) => (typeof clause === "string" ? parseSortClause(clause) : null))
    .filter(Boolean);
  for (const clause of clauses) {
    const compared = compareSortValues(a[clause.field], b[clause.field]);
    if (compared !== 0) {
      return clause.direction === "DESC" ? -compared : compared;
    }
  }
  return canonicalJson(a).localeCompare(canonicalJson(b));
}

function parseSortClause(clause) {
  const match = clause.match(/^([A-Za-z0-9_]+)\s+(ASC|DESC)$/);
  return match ? { field: match[1], direction: match[2] } : null;
}

function compareSortValues(a, b) {
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }
  if (typeof a === "boolean" && typeof b === "boolean") {
    return Number(a) - Number(b);
  }
  return stableSortString(a).localeCompare(stableSortString(b));
}

function stableSortString(value) {
  if (Array.isArray(value) || (value && typeof value === "object")) {
    return canonicalJson(value);
  }
  return String(value);
}

function appliedLimit(limitPolicy) {
  const defaultLimit = numericLimit(limitPolicy.default_limit);
  const maxLimit = numericLimit(limitPolicy.max_limit);
  if (typeof defaultLimit === "number" && typeof maxLimit === "number") {
    return Math.min(defaultLimit, maxLimit);
  }
  return defaultLimit ?? maxLimit;
}

function numericLimit(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.trunc(value)
    : undefined;
}

function createFingerprint(value) {
  const normalized = JSON.parse(JSON.stringify(value));
  delete normalized.validation_fingerprint;
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

function formationReceiptDurableEventBrowserValidationSliceActive() {
  return readChangedFiles().includes("scripts/smoke-formation-receipt-durable-event-browser-validation-v0-1.mjs");
}

function formationReceiptDurableEventImplementationSliceActive() {
  return readChangedFiles().includes("scripts/smoke-formation-receipt-durable-event-implementation-v0-1.mjs");
}

function formationReceiptDurableEventContractSliceActive() {
  return readChangedFiles().includes(formationReceiptDurableEventContractSmokePath);
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

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function mergeBaseRef() {
  return readGitOutput(["merge-base", "HEAD", "origin/main"]).trim();
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
