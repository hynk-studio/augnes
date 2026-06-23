import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const stateTrajectoryImplementationBuilderPath =
  "lib/research-candidate-review/durable-perspective-state-trajectory.ts";
const stateTrajectoryImplementationFixturePath =
  "fixtures/research-candidate-review.durable-perspective-state-trajectory-implementation.sample.v0.1.json";
const stateTrajectoryImplementationSmokePath =
  "scripts/smoke-durable-perspective-state-trajectory-implementation-v0-1.mjs";
const stateTrajectoryImplementationContractSmokePath =
  "scripts/smoke-durable-perspective-state-trajectory-contract-v0-1.mjs";
const stateTrajectoryImplementationPackageScriptName =
  "smoke:durable-perspective-state-trajectory-implementation-v0-1";
const stateTrajectoryImplementationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-durable-perspective-state-trajectory-implementation-v0-1.mjs";
const stateTrajectoryImplementationVersion =
  "durable_perspective_state_trajectory_implementation.v0.1";
const stateTrajectoryImplementationRecommendationStatus =
  "ready_for_durable_perspective_state_trajectory_browser_validation_v0_1";
const stateTrajectoryImplementationNextRecommendedSlice =
  "durable_perspective_state_trajectory_browser_validation_v0_1";
const stateTrajectoryBrowserValidationFixturePath =
  "fixtures/research-candidate-review.durable-perspective-state-trajectory-browser-validation.sample.v0.1.json";
const stateTrajectoryBrowserValidationSmokePath =
  "scripts/smoke-durable-perspective-state-trajectory-browser-validation-v0-1.mjs";
const stateTrajectoryBrowserValidationPackageScriptName =
  "smoke:durable-perspective-state-trajectory-browser-validation-v0-1";
const stateTrajectoryBrowserValidationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-durable-perspective-state-trajectory-browser-validation-v0-1.mjs";
const stateTrajectoryBrowserValidationVersion =
  "durable_perspective_state_trajectory_browser_validation.v0.1";
const stateTrajectoryBrowserValidationRecommendationStatus =
  "ready_for_project_constellation_runtime_layout_contract_v0_1";
const stateTrajectoryBrowserValidationNextRecommendedSlice =
  "project_constellation_runtime_layout_contract_v0_1";
const projectLayoutTypePath =
  "types/project-constellation-runtime-layout-contract.ts";
const projectLayoutFixturePath =
  "fixtures/research-candidate-review.project-constellation-runtime-layout-contract.sample.v0.1.json";
const projectLayoutSmokePath =
  "scripts/smoke-project-constellation-runtime-layout-contract-v0-1.mjs";
const projectLayoutSourceValidationSmokePath =
  "scripts/smoke-durable-perspective-state-trajectory-browser-validation-v0-1.mjs";
const projectLayoutPackageScriptName =
  "smoke:project-constellation-runtime-layout-contract-v0-1";
const projectLayoutPackageScriptValue =
  "node scripts/smoke-project-constellation-runtime-layout-contract-v0-1.mjs";
const projectLayoutContractVersion =
  "project_constellation_runtime_layout_contract.v0.1";
const projectLayoutRecommendationStatus =
  "ready_for_project_constellation_runtime_layout_implementation_v0_1";
const projectLayoutNextRecommendedSlice =
  "project_constellation_runtime_layout_implementation_v0_1";
const projectLayoutImplementationBuilderPath =
  "lib/research-candidate-review/project-constellation-runtime-layout.ts";
const projectLayoutImplementationFixturePath =
  "fixtures/research-candidate-review.project-constellation-runtime-layout-implementation.sample.v0.1.json";
const projectLayoutImplementationSmokePath =
  "scripts/smoke-project-constellation-runtime-layout-implementation-v0-1.mjs";
const projectLayoutImplementationPackageScriptName =
  "smoke:project-constellation-runtime-layout-implementation-v0-1";
const projectLayoutImplementationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-project-constellation-runtime-layout-implementation-v0-1.mjs";
const projectLayoutImplementationVersion =
  "project_constellation_runtime_layout_implementation.v0.1";
const projectLayoutImplementationRecommendationStatus =
  "ready_for_project_constellation_runtime_layout_browser_validation_v0_1";
const projectLayoutImplementationNextRecommendedSlice =
  "project_constellation_runtime_layout_browser_validation_v0_1";
const projectLayoutBrowserValidationFixturePath =
  "fixtures/research-candidate-review.project-constellation-runtime-layout-browser-validation.sample.v0.1.json";
const projectLayoutBrowserValidationSmokePath =
  "scripts/smoke-project-constellation-runtime-layout-browser-validation-v0-1.mjs";
const projectLayoutBrowserValidationPackageScriptName =
  "smoke:project-constellation-runtime-layout-browser-validation-v0-1";
const projectLayoutBrowserValidationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-project-constellation-runtime-layout-browser-validation-v0-1.mjs";
const projectLayoutBrowserValidationVersion =
  "project_constellation_runtime_layout_browser_validation.v0.1";
const projectLayoutBrowserValidationRecommendationStatus =
  "ready_for_perspective_geometry_digest_contract_v0_1";
const projectLayoutBrowserValidationNextRecommendedSlice =
  "perspective_geometry_digest_contract_v0_1";
const projectLayoutContractDownstreamSmokePaths = [
  "scripts/smoke-durable-perspective-state-trajectory-browser-validation-v0-1.mjs",
  "scripts/smoke-durable-perspective-state-trajectory-implementation-v0-1.mjs",
  "scripts/smoke-durable-perspective-state-trajectory-contract-v0-1.mjs",
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
const stateTrajectoryImplementationDownstreamSmokePaths = [
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

const builderPath =
  "lib/research-candidate-review/bounded-external-source-intake.ts";
const contractFixturePath =
  "fixtures/research-candidate-review.bounded-external-source-intake-contract.sample.v0.1.json";
const implementationFixturePath =
  "fixtures/research-candidate-review.bounded-external-source-intake-implementation.sample.v0.1.json";
const fixturePath =
  "fixtures/research-candidate-review.bounded-external-source-intake-browser-validation.sample.v0.1.json";
const smokePath =
  "scripts/smoke-bounded-external-source-intake-browser-validation-v0-1.mjs";
const implementationSmokePath =
  "scripts/smoke-bounded-external-source-intake-implementation-v0-1.mjs";
const contractSmokePath =
  "scripts/smoke-bounded-external-source-intake-contract-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";

const packageScriptName =
  "smoke:bounded-external-source-intake-browser-validation-v0-1";
const packageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-bounded-external-source-intake-browser-validation-v0-1.mjs";
const validationKind = "bounded_external_source_intake_browser_validation";
const validationVersion =
  "bounded_external_source_intake_browser_validation.v0.1";
const recommendationStatus =
  "ready_for_operator_source_candidate_generation_contract_v0_1";
const nextRecommendedSlice =
  "operator_source_candidate_generation_contract_v0_1";
const operatorSourceCandidateGenerationContractTypePath =
  "types/operator-source-candidate-generation-contract.ts";
const operatorSourceCandidateGenerationContractFixturePath =
  "fixtures/research-candidate-review.operator-source-candidate-generation-contract.sample.v0.1.json";
const operatorSourceCandidateGenerationContractSmokePath =
  "scripts/smoke-operator-source-candidate-generation-contract-v0-1.mjs";
const operatorSourceCandidateGenerationContractPackageScriptName =
  "smoke:operator-source-candidate-generation-contract-v0-1";
const operatorSourceCandidateGenerationContractPackageScriptValue =
  "node scripts/smoke-operator-source-candidate-generation-contract-v0-1.mjs";
const operatorSourceCandidateGenerationContractVersion =
  "operator_source_candidate_generation_contract.v0.1";
const operatorSourceCandidateGenerationContractRecommendationStatus =
  "ready_for_operator_source_candidate_generation_implementation_v0_1";
const operatorSourceCandidateGenerationContractNextRecommendedSlice =
  "operator_source_candidate_generation_implementation_v0_1";
const writeFixture = process.argv.includes("--write-fixture");
let cachedMergeBaseRef = null;

const expectedChangedFiles = [
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  implementationSmokePath,
  contractSmokePath,
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

for (const filePath of [
  builderPath,
  contractFixturePath,
  implementationFixturePath,
  smokePath,
  implementationSmokePath,
  contractSmokePath,
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

const builderSource = readFile(builderPath);
const smokeSource = readFile(smokePath);
const implementationSmokeSource = readFile(implementationSmokePath);
const contractSmokeSource = readFile(contractSmokePath);
const contractFixture = readJson(contractFixturePath);
const implementationFixture = readJson(implementationFixturePath);
const packageJson = readJson(packagePath);
const basePackageJson = readJsonFromGit(packagePath);
const indexDoc = readFile(indexPath);
const substrateDoc = readFile(substrateDocPath);
const surfaceDoc = readFile(surfaceDocPath);
const gateDoc = readFile(gateDocPath);

const { buildBoundedExternalSourceIntakeImplementation } = await import(
  "../lib/research-candidate-review/bounded-external-source-intake.ts"
);

const rebuiltImplementationFixture =
  buildBoundedExternalSourceIntakeImplementation({
    bounded_external_source_intake_contract: contractFixture,
    source_contract_ref: `${contractFixture.contract_version}:${contractFixturePath}`,
  });
const invalidOverrideResult = buildInvalidSourceRefsOverrideResult();
const rebuiltFixture = buildValidationFixture();

if (writeFixture) {
  writeFileSync(fixturePath, `${JSON.stringify(rebuiltFixture, null, 2)}\n`);
  process.exit(0);
}

const fixture = readJson(fixturePath);

assertBuilderFile();
assertPackageScript();
assertStaticBoundary();
assertNoForbiddenRuntimePatterns();
assertImplementationRebuild();
assertValidationFixture(fixture);
assertValidatedBuilder(fixture.validated_builder);
assertValidatedSourceIntake(fixture.validated_source_intake);
assertAuthorityBoundary(fixture.authority_boundary);
assertGeneratedSourceIntakeBundle();
assertInvalidSourceRefsOverride();
assertDocsPointers();
assertImplementationSmokeDownstreamPointer();
assertImplementationSmokeInvalidOverrideCoverage();
assertPortableMergeBaseFallback();
assert.deepEqual(
  fixture,
  rebuiltFixture,
  "rebuilt Bounded External Source Intake browser validation fixture must match committed fixture",
);

console.log(
  JSON.stringify(
    {
      smoke: "bounded-external-source-intake-browser-validation-v0-1",
      final_status: "pass",
      validation_kind: fixture.validation_kind,
      validation_version: fixture.validation_version,
      source_implementation_fingerprint: fixture.source_implementation_fingerprint,
      generated_bundle_authority_boundary_matches_contract:
        fixture.validated_source_intake
          .generated_bundle_authority_boundary_matches_contract,
      generated_bundle_validation_matches_contract:
        fixture.validated_source_intake.generated_bundle_validation_matches_contract,
      invalid_source_refs_override_rejected:
        fixture.validated_source_intake.invalid_source_refs_override_rejected,
      runtime_source_fetch_implemented_now:
        fixture.authority_boundary.runtime_source_fetch_implemented_now,
      crawler_implemented_now: fixture.authority_boundary.crawler_implemented_now,
      provider_extraction_implemented_now:
        fixture.authority_boundary.provider_extraction_implemented_now,
      retrieval_rag_implemented_now:
        fixture.authority_boundary.retrieval_rag_implemented_now,
      durable_source_record_write_now:
        fixture.authority_boundary.durable_source_record_write_now,
      browser_request_now: fixture.authority_boundary.browser_request_now,
      product_write_lane_parked_by_686:
        fixture.authority_boundary.product_write_lane_parked_by_686,
      next_recommended_slice: fixture.next_recommended_slice,
    },
    null,
    2,
  ),
);

function buildValidationFixture() {
  const validation = {
    validation_kind: validationKind,
    validation_version: validationVersion,
    source_implementation_ref:
      `${implementationFixture.implementation_version}:${implementationFixturePath}#722`,
    source_implementation_fingerprint:
      implementationFixture.implementation_fingerprint,
    validated_builder: {
      builder_path: builderPath,
      implementation_fixture_path: implementationFixturePath,
      deterministic_fixture_backed_only: true,
      runtime_source_fetch_now: false,
      crawler_now: false,
      provider_extraction_now: false,
      retrieval_rag_now: false,
      source_index_write_now: false,
      durable_source_record_write_now: false,
      runtime_db_write_now: false,
      runtime_db_query_now: false,
      production_db_used_now: false,
      browser_request_now: false,
    },
    validated_source_intake: {
      generated_bundle_follows_contract: true,
      generated_bundle_authority_boundary_matches_contract: true,
      generated_bundle_validation_matches_contract: true,
      top_level_implementation_boundary_is_separate: true,
      allowed_inputs_reference_only: true,
      source_fetch_not_implemented: true,
      provider_extraction_not_implemented: true,
      retrieval_rag_not_implemented: true,
      source_index_write_not_implemented: true,
      durable_source_record_write_not_implemented: true,
      candidate_generation_not_implemented: true,
      source_refs_have_operator_context: true,
      privacy_policy_preserved: true,
      non_authority_policy_preserved: true,
      invalid_source_refs_override_rejected: true,
      disallowed_source_input_kind_rejected: true,
      unknown_source_input_kind_rejected: true,
      source_fetch_enabled_override_rejected: true,
      provider_extraction_enabled_override_rejected: true,
      candidate_generation_now_override_rejected: true,
      missing_source_refs_override_rejected: true,
      missing_operator_context_override_rejected: true,
      non_public_safe_override_rejected: true,
      invalid_source_status_override_rejected: true,
    },
    authority_boundary: buildAuthorityBoundary(),
    recommendation_status: recommendationStatus,
    next_recommended_slice: nextRecommendedSlice,
    validation: {
      passed: true,
      failure_codes: [],
      deterministic_rebuild_matches_fixture: true,
    },
    validation_fingerprint: "",
    fingerprint_algorithm: "fnv1a32_canonical_json",
  };
  validation.validation_fingerprint = createFingerprint(validation);
  return validation;
}

function buildAuthorityBoundary() {
  return {
    browser_validation_added_now: true,
    implementation_changed_now: false,
    runtime_source_fetch_implemented_now: false,
    crawler_implemented_now: false,
    provider_extraction_implemented_now: false,
    retrieval_rag_implemented_now: false,
    source_index_write_now: false,
    durable_source_record_write_now: false,
    candidate_generation_now: false,
    candidate_mutation_now: false,
    runtime_persistence_implemented_now: false,
    durable_memory_write_now: false,
    runtime_db_write_now: false,
    runtime_db_query_now: false,
    production_db_used_now: false,
    db_schema_implemented_now: false,
    route_changed_now: false,
    component_changed_now: false,
    browser_request_now: false,
    durable_salience_write_now: false,
    recent_rehearsal_buffer_written_now: false,
    formation_receipt_written_now: false,
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
  };
}

function buildInvalidSourceRefsOverrideResult() {
  return buildBoundedExternalSourceIntakeImplementation({
    bounded_external_source_intake_contract: contractFixture,
    source_contract_ref: `${contractFixture.contract_version}:${contractFixturePath}`,
    source_refs: buildInvalidSourceRefs(),
  });
}

function buildInvalidSourceRefs() {
  const sample =
    contractFixture.sample_source_intake_reference_bundle.source_refs[0];
  return [
    invalidSourceRef(sample, "invalid_source_ref_disallowed_kind", {
      source_input_kind: "crawler_seed",
    }),
    invalidSourceRef(sample, "invalid_source_ref_unknown_kind", {
      source_input_kind: "not_in_contract",
    }),
    invalidSourceRef(sample, "invalid_source_ref_not_reference_only", {
      accepted_as_reference_only_now: false,
    }),
    invalidSourceRef(sample, "invalid_source_ref_fetch_enabled", {
      source_fetch_now: true,
    }),
    invalidSourceRef(sample, "invalid_source_ref_provider_enabled", {
      provider_extraction_now: true,
    }),
    invalidSourceRef(sample, "invalid_source_ref_generation_now", {
      candidate_generation_later_only: false,
    }),
    sourceRefWithoutSourceRefs(sample),
    invalidSourceRef(sample, "invalid_source_ref_missing_operator_context", {
      operator_context_ref: "",
    }),
    invalidSourceRef(sample, "invalid_source_ref_not_public_safe", {
      public_safe: false,
    }),
    invalidSourceRef(sample, "invalid_source_ref_invalid_status", {
      source_status: "invalid_status",
    }),
  ];
}

function invalidSourceRef(sample, sourceRefId, overrides) {
  return {
    ...clone(sample),
    source_ref_id: sourceRefId,
    ...overrides,
  };
}

function sourceRefWithoutSourceRefs(sample) {
  const sourceRef = invalidSourceRef(sample, "invalid_source_ref_missing_refs", {});
  delete sourceRef.source_refs;
  return sourceRef;
}

function assertBuilderFile() {
  for (const requiredText of [
    "buildBoundedExternalSourceIntakeImplementation",
    "bounded_external_source_intake_implementation",
    "generated_source_intake_reference_bundle",
    "source_ref_disallowed_input_kind",
    "source_ref_unknown_input_kind",
    "source_ref_not_reference_only",
    "source_ref_fetch_enabled",
    "source_ref_provider_extraction_enabled",
    "source_ref_candidate_generation_not_later_only",
  ]) {
    assert.ok(builderSource.includes(requiredText), `${builderPath} must include ${requiredText}`);
  }
}

function assertPackageScript() {
  if (projectConstellationRuntimeLayoutBrowserValidationSliceActive()) {
    assertProjectConstellationRuntimeLayoutBrowserValidationPackageScript();
    return;
  }
  if (projectConstellationRuntimeLayoutImplementationSliceActive()) {
    assertProjectConstellationRuntimeLayoutImplementationPackageScript();
    return;
  }
  if (projectConstellationRuntimeLayoutContractSliceActive()) {
    assertProjectConstellationRuntimeLayoutContractPackageScript();
    return;
  }
  if (durablePerspectiveStateTrajectoryBrowserValidationSliceActive()) {
    assertDurablePerspectiveStateTrajectoryBrowserValidationPackageScript();
    return;
  }
  if (durablePerspectiveStateTrajectoryImplementationSliceActive()) {
    assertDurablePerspectiveStateTrajectoryImplementationPackageScript();
    return;
  }
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
  assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
  const addedScripts = Object.keys(packageJson.scripts)
    .filter((scriptName) => !basePackageJson.scripts[scriptName])
    .sort();
  assert.deepEqual(
    addedScripts,
    [packageScriptName],
    "package.json must add only the Bounded External Source Intake browser validation smoke script",
  );
  if (typeof basePackageJson !== "undefined") {
    assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
    assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
    assert.deepEqual(
      packageJson.optionalDependencies ?? {},
      basePackageJson.optionalDependencies ?? {},
    );
  }
}

function assertStaticBoundary() {
  const changedFiles = readChangedFiles();
  if (projectConstellationRuntimeLayoutBrowserValidationSliceActive()) {
    assertProjectConstellationRuntimeLayoutBrowserValidationChangedFiles(changedFiles);
    return;
  }
  if (projectConstellationRuntimeLayoutImplementationSliceActive()) {
    assertProjectConstellationRuntimeLayoutImplementationChangedFiles(changedFiles);
    return;
  }
  if (projectConstellationRuntimeLayoutContractSliceActive()) {
    assertProjectConstellationRuntimeLayoutContractChangedFiles(changedFiles);
    return;
  }
  if (durablePerspectiveStateTrajectoryBrowserValidationSliceActive()) {
    assertDurablePerspectiveStateTrajectoryBrowserValidationChangedFiles(changedFiles);
    return;
  }
  if (durablePerspectiveStateTrajectoryImplementationSliceActive()) {
    assertDurablePerspectiveStateTrajectoryImplementationChangedFiles(changedFiles);
    return;
  }
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
  for (const expectedFile of expectedChangedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const unchangedPath of [
    builderPath,
    implementationFixturePath,
    "lib/research-candidate-review/salience-governor.ts",
    "fixtures/research-candidate-review.salience-governor-implementation.sample.v0.1.json",
    "lib/research-candidate-review/recent-rehearsal-buffer.ts",
    "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `Bounded External Source Intake browser validation slice must not change ${unchangedPath}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedChangedFiles.includes(changedFile),
      `unexpected changed file in Bounded External Source Intake browser validation slice: ${changedFile}`,
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



function projectConstellationRuntimeLayoutBrowserValidationSliceActive() {
  return readChangedFiles().includes(projectLayoutBrowserValidationSmokePath);
}

function assertProjectConstellationRuntimeLayoutBrowserValidationPackageScript() {
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
    packageJson.scripts[projectLayoutBrowserValidationPackageScriptName],
    projectLayoutBrowserValidationPackageScriptValue,
  );
  assert.deepEqual(
    addedScriptNames,
    [projectLayoutBrowserValidationPackageScriptName],
    "package.json must add only the Project Constellation Runtime Layout browser validation smoke script",
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

function assertProjectConstellationRuntimeLayoutBrowserValidationChangedFiles(changedFiles) {
  const expectedFiles = [
    projectLayoutBrowserValidationFixturePath,
    projectLayoutBrowserValidationSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    projectLayoutImplementationSmokePath,
    projectLayoutSmokePath,
    ...projectLayoutContractDownstreamSmokePaths,
  ];
  for (const unchangedPath of [
    projectLayoutImplementationBuilderPath,
    projectLayoutImplementationFixturePath,
    projectLayoutTypePath,
    projectLayoutFixturePath,
    "lib/db/schema.sql",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      "Project Constellation Runtime Layout browser validation slice must not change " + unchangedPath,
    );
  }
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(expectedFiles.includes(changedFile), "unexpected changed file in Project Constellation Runtime Layout browser validation downstream slice: " + changedFile);
    assert.ok(!changedFile.startsWith("app/api/"), "must not change app/api routes");
    assert.ok(!changedFile.endsWith("route.ts"), "must not change route handlers");
    assert.ok(!changedFile.startsWith("components/"), "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.ok(!changedFile.startsWith("migrations/"), "must not change migrations");
    assert.ok(!changedFile.startsWith("lib/research-retrieval/"), "must not add retrieval implementation files");
    assert.ok(!changedFile.startsWith("lib/research-rag/"), "must not add RAG implementation files");
    assert.equal(new RegExp("^lib/.*layout", "i").test(changedFile), false, "must not add runtime layout implementation files");
    assert.equal(new RegExp("^lib/.*constellation", "i").test(changedFile), false, "must not add runtime constellation implementation files");
    assert.equal(new RegExp("^lib/.*graph", "i").test(changedFile), false, "must not add graph DB or graph mutation files");
    assert.equal(new RegExp("^lib/.*perspective.*state", "i").test(changedFile), false, "must not add runtime Perspective state files");
    assert.equal(new RegExp("^lib/.*perspective.*snapshot", "i").test(changedFile), false, "must not add runtime PerspectiveSnapshot files");
    assert.equal(new RegExp("^lib/.*trajectory", "i").test(changedFile), false, "must not add runtime trajectory builder files");
    assert.equal(new RegExp("^lib/.*promotion", "i").test(changedFile), false, "must not add runtime promotion implementation files");
    assert.equal(new RegExp("^lib/.*(proof|evidence).*write", "i").test(changedFile), false, "must not add proof/evidence write files");
    assert.equal(new RegExp("(^|/)(provider|openai|source-fetch|crawler)\\b", "i").test(changedFile), false, "must not change provider/OpenAI/source-fetch/crawler files");
    assert.equal(new RegExp("product.*write", "i").test(changedFile), false, "must not change product write files");
  }
  assertProjectConstellationRuntimeLayoutBrowserValidationDownstreamPointer();
}

function assertProjectConstellationRuntimeLayoutBrowserValidationDownstreamPointer() {
  const browserValidationSmoke = readFileSync(projectLayoutBrowserValidationSmokePath, "utf8");
  for (const requiredText of [
    projectLayoutBrowserValidationVersion,
    projectLayoutBrowserValidationFixturePath,
    projectLayoutBrowserValidationSmokePath,
    projectLayoutBrowserValidationPackageScriptName,
    projectLayoutBrowserValidationRecommendationStatus,
    projectLayoutBrowserValidationNextRecommendedSlice,
    "validates deterministic fixture-backed implementation from #737",
    "validates #736 contract boundary and #737 top-level implementation boundary separation",
    "validates built Project Constellation layout preview bundle",
    "validates invalid layout preview override rejection",
    "layout is interface, not truth",
    "coordinates are display hints, not source of truth",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      browserValidationSmoke.includes(requiredText),
      "downstream smoke must allow Project Constellation Runtime Layout browser validation pointer: " + requiredText,
    );
  }
}

function projectConstellationRuntimeLayoutImplementationSliceActive() {
  return readChangedFiles().includes(projectLayoutImplementationSmokePath);
}

function assertProjectConstellationRuntimeLayoutImplementationPackageScript() {
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
    packageJson.scripts[projectLayoutImplementationPackageScriptName],
    projectLayoutImplementationPackageScriptValue,
  );
  assert.deepEqual(
    addedScriptNames,
    [projectLayoutImplementationPackageScriptName],
    "package.json must add only the Project Constellation Runtime Layout implementation smoke script",
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

function assertProjectConstellationRuntimeLayoutImplementationChangedFiles(changedFiles) {
  const expectedFiles = [
    projectLayoutImplementationBuilderPath,
    projectLayoutImplementationFixturePath,
    projectLayoutImplementationSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    projectLayoutSmokePath,
    ...projectLayoutContractDownstreamSmokePaths,
  ];
  for (const unchangedPath of [
    projectLayoutTypePath,
    projectLayoutFixturePath,
    "fixtures/research-candidate-review.durable-perspective-state-trajectory-browser-validation.sample.v0.1.json",
    "types/durable-perspective-state-trajectory-contract.ts",
    "fixtures/research-candidate-review.durable-perspective-state-trajectory-contract.sample.v0.1.json",
    "lib/research-candidate-review/durable-perspective-state-trajectory.ts",
    "fixtures/research-candidate-review.durable-perspective-state-trajectory-implementation.sample.v0.1.json",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-browser-validation.sample.v0.1.json",
    "lib/research-candidate-review/human-reviewed-durable-perspective-promotion.ts",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-implementation.sample.v0.1.json",
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
    assert.ok(!changedFiles.includes(unchangedPath), "Project Constellation Runtime Layout implementation slice must not change " + unchangedPath);
  }
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(expectedFiles.includes(changedFile), "unexpected changed file in Project Constellation Runtime Layout implementation downstream slice: " + changedFile);
    assert.ok(!changedFile.startsWith("app/api/"), "must not change app/api routes");
    assert.ok(!changedFile.endsWith("route.ts"), "must not change route handlers");
    assert.ok(!changedFile.startsWith("components/"), "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.ok(!changedFile.startsWith("migrations/"), "must not change migrations");
    assert.ok(!changedFile.startsWith("lib/research-retrieval/"), "must not add retrieval implementation files");
    assert.ok(!changedFile.startsWith("lib/research-rag/"), "must not add RAG implementation files");
    if (changedFile !== projectLayoutImplementationBuilderPath) {
      assert.equal(new RegExp("^lib/.*layout", "i").test(changedFile), false, "must not add runtime layout implementation files");
      assert.equal(new RegExp("^lib/.*constellation", "i").test(changedFile), false, "must not add runtime constellation implementation files");
      assert.equal(new RegExp("^lib/.*graph", "i").test(changedFile), false, "must not add graph DB or graph mutation files");
    }
    assert.equal(new RegExp("^lib/.*perspective.*state", "i").test(changedFile), false, "must not add runtime Perspective state files");
    assert.equal(new RegExp("^lib/.*perspective.*snapshot", "i").test(changedFile), false, "must not add runtime PerspectiveSnapshot files");
    assert.equal(new RegExp("^lib/.*trajectory", "i").test(changedFile), false, "must not add runtime trajectory builder files");
    assert.equal(new RegExp("^lib/.*promotion", "i").test(changedFile), false, "must not add runtime promotion implementation files");
    assert.equal(new RegExp("^lib/.*(proof|evidence).*write", "i").test(changedFile), false, "must not add proof/evidence write files");
    assert.equal(new RegExp("(^|/)(provider|openai|source-fetch|crawler)\\b", "i").test(changedFile), false, "must not change provider/OpenAI/source-fetch/crawler files");
    assert.equal(new RegExp("product.*write", "i").test(changedFile), false, "must not change product write files");
  }
  assertProjectConstellationRuntimeLayoutImplementationDownstreamPointer();
}

function assertProjectConstellationRuntimeLayoutImplementationDownstreamPointer() {
  const implementationSmoke = readFileSync(projectLayoutImplementationSmokePath, "utf8");
  for (const requiredText of [
    projectLayoutImplementationVersion,
    projectLayoutImplementationBuilderPath,
    projectLayoutImplementationFixturePath,
    projectLayoutImplementationSmokePath,
    projectLayoutImplementationPackageScriptName,
    projectLayoutImplementationRecommendationStatus,
    projectLayoutImplementationNextRecommendedSlice,
    "deterministic fixture-backed implementation only",
    "validates and materializes #736 Project Constellation layout preview bundle",
    "layout is interface, not truth",
    "coordinates are display hints, not source of truth",
    "product-write remains parked by #686",
  ]) {
    assert.ok(implementationSmoke.includes(requiredText), "downstream smoke must allow Project Constellation Runtime Layout implementation pointer: " + requiredText);
  }
}

function projectConstellationRuntimeLayoutContractSliceActive() {
  return readChangedFiles().includes(projectLayoutSmokePath);
}

function assertProjectConstellationRuntimeLayoutContractPackageScript() {
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
    packageJson.scripts[projectLayoutPackageScriptName],
    projectLayoutPackageScriptValue,
  );
  assert.deepEqual(
    addedScriptNames,
    [projectLayoutPackageScriptName],
    "package.json must add only the Project Constellation Runtime Layout contract smoke script",
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

function assertProjectConstellationRuntimeLayoutContractChangedFiles(changedFiles) {
  const expectedFiles = [
    projectLayoutTypePath,
    projectLayoutFixturePath,
    projectLayoutSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    ...projectLayoutContractDownstreamSmokePaths,
  ];
  for (const unchangedPath of [
    "fixtures/research-candidate-review.durable-perspective-state-trajectory-browser-validation.sample.v0.1.json",
    "types/durable-perspective-state-trajectory-contract.ts",
    "fixtures/research-candidate-review.durable-perspective-state-trajectory-contract.sample.v0.1.json",
    "lib/research-candidate-review/durable-perspective-state-trajectory.ts",
    "fixtures/research-candidate-review.durable-perspective-state-trajectory-implementation.sample.v0.1.json",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-browser-validation.sample.v0.1.json",
    "lib/research-candidate-review/human-reviewed-durable-perspective-promotion.ts",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-implementation.sample.v0.1.json",
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
    assert.ok(!changedFiles.includes(unchangedPath), "Project Constellation Runtime Layout contract slice must not change " + unchangedPath);
  }
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(expectedFiles.includes(changedFile), "unexpected changed file in Project Constellation Runtime Layout contract downstream slice: " + changedFile);
    assert.ok(!changedFile.startsWith("app/api/"), "must not change app/api routes");
    assert.ok(!changedFile.endsWith("route.ts"), "must not change route handlers");
    assert.ok(!changedFile.startsWith("components/"), "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.ok(!changedFile.startsWith("migrations/"), "must not change migrations");
    assert.ok(!changedFile.startsWith("lib/research-retrieval/"), "must not add retrieval implementation files");
    assert.ok(!changedFile.startsWith("lib/research-rag/"), "must not add RAG implementation files");
    assert.equal(new RegExp("^lib/.*layout", "i").test(changedFile), false, "must not add runtime layout implementation files");
    assert.equal(new RegExp("^lib/.*constellation", "i").test(changedFile), false, "must not add runtime constellation implementation files");
    assert.equal(new RegExp("^lib/.*graph", "i").test(changedFile), false, "must not add graph DB or graph mutation files");
    assert.equal(new RegExp("^lib/.*perspective.*state", "i").test(changedFile), false, "must not add runtime Perspective state files");
    assert.equal(new RegExp("^lib/.*perspective.*snapshot", "i").test(changedFile), false, "must not add runtime PerspectiveSnapshot files");
    assert.equal(new RegExp("^lib/.*trajectory", "i").test(changedFile), false, "must not add runtime trajectory builder files");
    assert.equal(new RegExp("^lib/.*promotion", "i").test(changedFile), false, "must not add runtime promotion implementation files");
    assert.equal(new RegExp("^lib/.*(proof|evidence).*write", "i").test(changedFile), false, "must not add proof/evidence write files");
    assert.equal(new RegExp("(^|/)(provider|openai|source-fetch|crawler)\\b", "i").test(changedFile), false, "must not change provider/OpenAI/source-fetch/crawler files");
    assert.equal(new RegExp("product.*write", "i").test(changedFile), false, "must not change product write files");
  }
  assertProjectConstellationRuntimeLayoutContractDownstreamPointer();
}

function assertProjectConstellationRuntimeLayoutContractDownstreamPointer() {
  const sourceValidationSmoke = readFileSync(projectLayoutSourceValidationSmokePath, "utf8");
  for (const requiredText of [
    projectLayoutContractVersion,
    projectLayoutTypePath,
    projectLayoutFixturePath,
    projectLayoutSmokePath,
    projectLayoutPackageScriptName,
    projectLayoutRecommendationStatus,
    projectLayoutNextRecommendedSlice,
    "future stable Project Constellation layout grammar",
    "layout is interface, not truth",
    "coordinates are display hints, not source of truth",
    "product-write remains parked by #686",
  ]) {
    assert.ok(sourceValidationSmoke.includes(requiredText), "#735 browser validation smoke must allow Project Constellation Runtime Layout contract downstream pointer: " + requiredText);
  }
}

function durablePerspectiveStateTrajectoryBrowserValidationSliceActive() {
  return readChangedFiles().includes(stateTrajectoryBrowserValidationSmokePath);
}

function assertDurablePerspectiveStateTrajectoryBrowserValidationPackageScript() {
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
    packageJson.scripts[stateTrajectoryBrowserValidationPackageScriptName],
    stateTrajectoryBrowserValidationPackageScriptValue,
  );
  assert.deepEqual(
    addedScriptNames,
    [stateTrajectoryBrowserValidationPackageScriptName],
    "package.json must add only the Durable Perspective State / Trajectory browser validation smoke script",
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

function assertDurablePerspectiveStateTrajectoryBrowserValidationChangedFiles(changedFiles) {
  const expectedFiles = [
    stateTrajectoryBrowserValidationFixturePath,
    stateTrajectoryBrowserValidationSmokePath,
    stateTrajectoryImplementationSmokePath,
    stateTrajectoryImplementationContractSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    ...stateTrajectoryImplementationDownstreamSmokePaths,
  ];
  for (const unchangedPath of [
    "types/durable-perspective-state-trajectory-contract.ts",
    "fixtures/research-candidate-review.durable-perspective-state-trajectory-contract.sample.v0.1.json",
    stateTrajectoryImplementationBuilderPath,
    stateTrajectoryImplementationFixturePath,
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
  ]) {
    assert.ok(!changedFiles.includes(unchangedPath), "Durable Perspective State / Trajectory browser validation slice must not change " + unchangedPath);
  }
  for (const expectedFile of [
    stateTrajectoryBrowserValidationFixturePath,
    stateTrajectoryBrowserValidationSmokePath,
    stateTrajectoryImplementationSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
  ]) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(expectedFiles.includes(changedFile), "unexpected changed file in Durable Perspective State / Trajectory browser validation downstream slice: " + changedFile);
    assert.ok(!changedFile.startsWith("app/api/"), "must not change app/api routes");
    assert.ok(!changedFile.endsWith("route.ts"), "must not change route handlers");
    assert.ok(!changedFile.startsWith("components/"), "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.ok(!changedFile.startsWith("migrations/"), "must not change migrations");
    assert.ok(!changedFile.startsWith("lib/research-retrieval/"), "must not add retrieval implementation files");
    assert.ok(!changedFile.startsWith("lib/research-rag/"), "must not add RAG implementation files");
    assert.equal(new RegExp("^lib/.*perspective.*state", "i").test(changedFile), false, "must not add runtime Perspective state files");
    assert.equal(new RegExp("^lib/.*perspective.*snapshot", "i").test(changedFile), false, "must not add runtime PerspectiveSnapshot files");
    assert.equal(new RegExp("^lib/.*trajectory", "i").test(changedFile), false, "must not add runtime trajectory builder files");
    assert.equal(new RegExp("^lib/.*promotion", "i").test(changedFile), false, "must not add runtime promotion implementation files");
    assert.equal(new RegExp("^lib/.*(proof|evidence).*write", "i").test(changedFile), false, "must not add proof/evidence write files");
    assert.equal(new RegExp("(^|/)(provider|openai|source-fetch|crawler)\b", "i").test(changedFile), false, "must not change provider/OpenAI/source-fetch/crawler files");
    assert.equal(new RegExp("product.*write", "i").test(changedFile), false, "must not change product write files");
  }
  const stateTrajectoryImplementationSmokeSource = readFileSync(stateTrajectoryImplementationSmokePath, "utf8");
  for (const requiredText of [
    stateTrajectoryBrowserValidationVersion,
    stateTrajectoryBrowserValidationFixturePath,
    stateTrajectoryBrowserValidationSmokePath,
    stateTrajectoryBrowserValidationPackageScriptName,
    stateTrajectoryBrowserValidationRecommendationStatus,
    stateTrajectoryBrowserValidationNextRecommendedSlice,
    "validates deterministic fixture-backed implementation from #734",
    "current thesis has lineage",
    "PerspectiveSnapshot runtime not implemented",
    "product-write remains parked by #686",
  ]) {
    assert.ok(stateTrajectoryImplementationSmokeSource.includes(requiredText), "smoke must allow Durable Perspective State / Trajectory browser validation downstream pointer: " + requiredText);
  }
}

function durablePerspectiveStateTrajectoryImplementationSliceActive() {
  return readChangedFiles().includes(stateTrajectoryImplementationSmokePath);
}

function assertDurablePerspectiveStateTrajectoryImplementationPackageScript() {
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
    packageJson.scripts[stateTrajectoryImplementationPackageScriptName],
    stateTrajectoryImplementationPackageScriptValue,
  );
  assert.deepEqual(
    addedScriptNames,
    [stateTrajectoryImplementationPackageScriptName],
    "package.json must add only the Durable Perspective State / Trajectory implementation smoke script",
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

function assertDurablePerspectiveStateTrajectoryImplementationChangedFiles(changedFiles) {
  const expectedFiles = [
    stateTrajectoryImplementationBuilderPath,
    stateTrajectoryImplementationFixturePath,
    stateTrajectoryImplementationSmokePath,
    stateTrajectoryImplementationContractSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    ...stateTrajectoryImplementationDownstreamSmokePaths,
  ];
  for (const unchangedPath of [
    "types/durable-perspective-state-trajectory-contract.ts",
    "fixtures/research-candidate-review.durable-perspective-state-trajectory-contract.sample.v0.1.json",
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
  ]) {
    assert.ok(!changedFiles.includes(unchangedPath), "Durable Perspective State / Trajectory implementation slice must not change " + unchangedPath);
  }
  for (const expectedFile of [
    stateTrajectoryImplementationBuilderPath,
    stateTrajectoryImplementationFixturePath,
    stateTrajectoryImplementationSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    stateTrajectoryImplementationContractSmokePath,
  ]) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(expectedFiles.includes(changedFile), "unexpected changed file in Durable Perspective State / Trajectory implementation downstream slice: " + changedFile);
    assert.ok(!changedFile.startsWith("app/api/"), "must not change app/api routes");
    assert.ok(!changedFile.endsWith("route.ts"), "must not change route handlers");
    assert.ok(!changedFile.startsWith("components/"), "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.ok(!changedFile.startsWith("migrations/"), "must not change migrations");
    assert.ok(!changedFile.startsWith("lib/research-retrieval/"), "must not add retrieval implementation files");
    assert.ok(!changedFile.startsWith("lib/research-rag/"), "must not add RAG implementation files");
    if (changedFile !== stateTrajectoryImplementationBuilderPath) {
      assert.equal(new RegExp("^lib/.*perspective.*state", "i").test(changedFile), false, "must not add runtime Perspective state files");
      assert.equal(new RegExp("^lib/.*perspective.*snapshot", "i").test(changedFile), false, "must not add runtime PerspectiveSnapshot files");
      assert.equal(new RegExp("^lib/.*trajectory", "i").test(changedFile), false, "must not add runtime trajectory builder files");
    }
    assert.equal(new RegExp("^lib/.*promotion", "i").test(changedFile), false, "must not add runtime promotion implementation files");
    assert.equal(new RegExp("^lib/.*(proof|evidence).*write", "i").test(changedFile), false, "must not add proof/evidence write files");
    assert.equal(new RegExp("(^|/)(provider|openai|source-fetch|crawler)\\b", "i").test(changedFile), false, "must not change provider/OpenAI/source-fetch/crawler files");
    assert.equal(new RegExp("product.*write", "i").test(changedFile), false, "must not change product write files");
  }
  const stateTrajectoryImplementationSmokeSource = readFileSync(stateTrajectoryImplementationSmokePath, "utf8");
  for (const requiredText of [
    stateTrajectoryImplementationVersion,
    stateTrajectoryImplementationBuilderPath,
    stateTrajectoryImplementationFixturePath,
    stateTrajectoryImplementationSmokePath,
    stateTrajectoryImplementationPackageScriptName,
    stateTrajectoryImplementationRecommendationStatus,
    stateTrajectoryImplementationNextRecommendedSlice,
    "deterministic fixture-backed implementation only",
    "current thesis has lineage",
    "product-write remains parked by #686",
  ]) {
    assert.ok(stateTrajectoryImplementationSmokeSource.includes(requiredText), "smoke must allow Durable Perspective State / Trajectory implementation downstream pointer: " + requiredText);
  }
}

function assertNoForbiddenRuntimePatterns() {
  const changedSourceFiles = readChangedFiles().filter((filePath) =>
    filePath !== "types/non-authoritative-retrieval-rag-contract.ts" &&
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
      { label: "DB write", regex: /\bdb\.(insert|update|delete|transaction)\b|\bruntimeDbWrite\b|\bproductionDbWrite\b/i },
      { label: "durable memory write", regex: /\b(write|insert|persist)DurableMemory\b|\bdurableMemoryWrite\b/i },
      { label: "durable source record write", regex: /\bwriteDurableSourceRecord\b|\binsertDurableSourceRecord\b|\bpersistDurableSourceRecord\b|\bdurableSourceRecordWrite\b/i },
      { label: "source index write", regex: /\bwriteSourceIndex\b|\bsourceIndexWrite\b/i },
      { label: "source fetch call", regex: /\bfetchSource\b|\bsourceFetch\b/ },
      { label: "crawler execution", regex: /\brunCrawler\b|\bcrawlDomain\b|\bcrawlerSeed\b/i },
      { label: "external HTTP request", regex: /\bhttps?\.request\b|\bXMLHttpRequest\b/ },
      { label: "provider extraction", regex: /\bproviderExtract\b|\brunProviderExtraction\b/i },
      { label: "OpenAI import", regex: /from\s+["'][^"']*openai["']/i },
      { label: "OpenAI constructor", regex: /new\s+OpenAI\b/i },
      { label: "retrieval execution", regex: /\brunRetrieval\b|\brunRag\b|\brunRAG\b/ },
      { label: "embedding/vector/FTS implementation", regex: /\bcreateEmbedding\b|\bvectorIndex\b|\bFTS5\b/i },
      { label: "candidate mutation", regex: /\bmutateCandidate\b|\bupdateCandidate\b|\bdeleteCandidate\b/ },
      { label: "candidate generation runtime", regex: /\bgenerateCandidate\b|\bcreateCandidateFromSource\b/i },
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

function assertImplementationRebuild() {
  assert.deepEqual(
    implementationFixture,
    rebuiltImplementationFixture,
    "#722 implementation fixture must match rebuilt deterministic output",
  );
}

function assertValidationFixture(value) {
  assert.equal(value.validation_kind, validationKind);
  assert.equal(value.validation_version, validationVersion);
  assert.equal(
    value.source_implementation_ref,
    `${implementationFixture.implementation_version}:${implementationFixturePath}#722`,
  );
  assert.equal(
    value.source_implementation_fingerprint,
    implementationFixture.implementation_fingerprint,
  );
  assert.equal(value.recommendation_status, recommendationStatus);
  assert.equal(value.next_recommended_slice, nextRecommendedSlice);
  assert.equal(value.validation.passed, true);
  assert.deepEqual(value.validation.failure_codes, []);
  assert.equal(value.validation.deterministic_rebuild_matches_fixture, true);
  assert.equal(value.fingerprint_algorithm, "fnv1a32_canonical_json");
  assert.equal(value.validation_fingerprint, createFingerprint(value));
}

function assertValidatedBuilder(value) {
  assert.deepEqual(value, {
    builder_path: builderPath,
    implementation_fixture_path: implementationFixturePath,
    deterministic_fixture_backed_only: true,
    runtime_source_fetch_now: false,
    crawler_now: false,
    provider_extraction_now: false,
    retrieval_rag_now: false,
    source_index_write_now: false,
    durable_source_record_write_now: false,
    runtime_db_write_now: false,
    runtime_db_query_now: false,
    production_db_used_now: false,
    browser_request_now: false,
  });
}

function assertValidatedSourceIntake(value) {
  for (const [key, flag] of Object.entries(value)) {
    assert.equal(flag, true, `validated_source_intake.${key} must be true`);
  }
}

function assertAuthorityBoundary(value) {
  assert.equal(value.product_write_lane_parked_by_686, true);
  for (const [key, flag] of Object.entries(value)) {
    if (
      key === "browser_validation_added_now" ||
      key === "product_write_lane_parked_by_686"
    ) {
      assert.equal(flag, true, `${key} must be true`);
    } else {
      assert.equal(flag, false, `${key} must be false`);
    }
  }
}

function assertGeneratedSourceIntakeBundle() {
  const bundle = implementationFixture.generated_source_intake_reference_bundle;
  assert.equal(bundle.intake_version, "bounded_external_source_intake.v0.1");
  for (const requiredField of [
    "source_intake_bundle_id",
    "generated_at",
    "scope",
    "source_refs",
    "disallowed_source_inputs",
    "source_reference_policy_ref",
    "candidate_generation_policy_ref",
    "provenance_policy_ref",
    "privacy_policy_ref",
    "non_authority_policy_ref",
    "authority_boundary",
    "validation",
  ]) {
    assert.ok(Object.hasOwn(bundle, requiredField), `generated bundle must include ${requiredField}`);
  }
  assert.deepEqual(bundle.authority_boundary, contractFixture.authority_boundary);
  assert.deepEqual(bundle.validation, contractFixture.validation_policy);
  assert.equal(bundle.authority_boundary.contract_only, true);
  assert.equal(
    bundle.authority_boundary.bounded_external_source_intake_contract_defined_now,
    true,
  );
  assert.equal(Object.hasOwn(bundle.authority_boundary, "implementation_added_now"), false);
  assert.equal(
    Object.hasOwn(bundle.authority_boundary, "deterministic_builder_added_now"),
    false,
  );
  assert.equal(implementationFixture.authority_boundary.implementation_added_now, true);
  assert.equal(
    implementationFixture.authority_boundary.deterministic_builder_added_now,
    true,
  );
  assertAuthorityBoundaryFalseFlags(implementationFixture.authority_boundary);

  assert.equal(implementationFixture.validation.passed, true);
  assert.equal(implementationFixture.validation.generated_bundle_follows_contract, true);
  assert.equal(
    implementationFixture.validation.generated_bundle_boundary_matches_contract,
    true,
  );
  assert.equal(
    implementationFixture.validation.generated_bundle_validation_matches_contract,
    true,
  );
  assert.equal(
    implementationFixture.validation.top_level_implementation_boundary_is_separate,
    true,
  );
  assertAllowedSourceInputSummary(implementationFixture.allowed_source_input_summary);
  assertSourceReferenceSummary(implementationFixture.source_reference_summary);
  assertDisallowedSourceInputSummary(implementationFixture.disallowed_source_input_summary);
  assertPrivacySummary(implementationFixture.privacy_summary);
  assertNonAuthoritySummary(implementationFixture.non_authority_summary);
  assertCandidateGenerationSummary(implementationFixture.candidate_generation_summary);
}

function assertAuthorityBoundaryFalseFlags(value) {
  for (const [key, flag] of Object.entries(value)) {
    if (
      key === "implementation_added_now" ||
      key === "contract_followed_now" ||
      key === "fixture_backed_only" ||
      key === "deterministic_builder_added_now" ||
      key === "product_write_lane_parked_by_686"
    ) {
      assert.equal(flag, true, `${key} must be true`);
    } else {
      assert.equal(flag, false, `${key} must be false`);
    }
  }
}

function assertAllowedSourceInputSummary(value) {
  assert.equal(value.all_inputs_reference_only_now, true);
  assert.equal(value.all_source_fetch_now_false, true);
  assert.equal(value.all_provider_extraction_now_false, true);
  assert.equal(value.all_candidate_generation_later_only, true);
  assert.equal(value.all_require_source_refs, true);
  assert.equal(value.all_require_operator_context, true);
}

function assertSourceReferenceSummary(value) {
  assert.equal(value.all_public_safe, true);
  assert.equal(value.all_have_source_refs, true);
  assert.equal(value.all_have_operator_context, true);
  assert.equal(value.all_reference_only_now, true);
  assert.equal(value.all_source_fetch_now_false, true);
  assert.equal(value.all_provider_extraction_now_false, true);
  assert.equal(value.no_fetch_now, true);
  assert.equal(value.no_crawl_now, true);
  assert.equal(value.no_provider_call_now, true);
  assert.equal(value.no_retrieval_rag_now, true);
  assert.equal(value.no_index_write_now, true);
}

function assertDisallowedSourceInputSummary(value) {
  assert.equal(value.includes_crawler_seed, true);
  assert.equal(value.includes_unbounded_domain_crawl, true);
  assert.equal(value.includes_automatic_web_search, true);
  assert.equal(value.includes_raw_oauth_token, true);
  assert.equal(value.includes_raw_private_url_as_canonical_id, true);
  assert.ok(value.disallowed_input_kinds.includes("crawler_seed"));
  assert.ok(value.disallowed_input_kinds.includes("unbounded_domain_crawl"));
  assert.ok(value.disallowed_input_kinds.includes("automatic_web_search"));
  assert.ok(value.disallowed_input_kinds.includes("raw_oauth_token"));
  assert.ok(value.disallowed_input_kinds.includes("raw_private_url_as_canonical_id"));
  assert.equal(value.all_disallowed_now, true);
  assert.equal(value.all_have_reasons, true);
}

function assertPrivacySummary(value) {
  assert.equal(value.public_safe_fixture_only_now, true);
  assert.equal(value.no_secrets_in_fixture, true);
  assert.equal(value.no_raw_oauth_tokens, true);
  assert.equal(value.no_private_urls_in_fixture, true);
  assert.equal(value.no_provider_ids_as_canonical_labels, true);
  assert.equal(value.no_thread_run_session_ids_as_canonical_labels, true);
}

function assertNonAuthoritySummary(value) {
  assert.equal(value.not_source_of_truth, true);
  assert.equal(value.not_proof_or_evidence, true);
  assert.equal(value.not_perspective_state, true);
  assert.equal(value.not_work_status, true);
  assert.equal(value.not_promotion_basis, true);
  assert.equal(value.not_retrieval_rag_result, true);
  assert.equal(value.not_salience_authority, true);
  assert.equal(value.not_product_write, true);
  assert.equal(value.source_reference_not_evidence_record, true);
  assert.equal(value.provider_summary_not_evidence_record, true);
  assert.equal(value.retrieval_result_not_authority, true);
}

function assertCandidateGenerationSummary(value) {
  assert.equal(value.candidate_generation_not_implemented_now, true);
  assert.equal(value.generated_candidate_is_not_proof_or_evidence, true);
  assert.equal(value.generated_candidate_is_not_source_of_truth, true);
  assert.equal(value.generated_candidate_does_not_promote_perspective, true);
  assert.equal(value.generated_candidate_does_not_mutate_work, true);
  assert.equal(value.generated_candidate_does_not_write_product, true);
  assert.equal(value.human_review_required_later, true);
}

function assertInvalidSourceRefsOverride() {
  const invalidOverrideResultAgain = buildInvalidSourceRefsOverrideResult();
  assert.deepEqual(
    invalidOverrideResult,
    invalidOverrideResultAgain,
    "invalid source_refs override result must remain deterministic",
  );
  assert.equal(invalidOverrideResult.validation.passed, false);
  assert.equal(
    invalidOverrideResult.validation.generated_bundle_follows_contract,
    false,
  );
  for (const failureCode of [
    "source_ref_disallowed_input_kind",
    "source_ref_unknown_input_kind",
    "source_ref_not_reference_only",
    "source_ref_fetch_enabled",
    "source_ref_provider_extraction_enabled",
    "source_ref_candidate_generation_not_later_only",
    "source_ref_missing_operator_context",
    "source_ref_missing_refs",
    "source_ref_not_public_safe",
    "source_ref_invalid_status",
  ]) {
    assert.ok(
      invalidOverrideResult.validation.failure_codes.includes(failureCode),
      `invalid source_refs override must include ${failureCode}`,
    );
  }
  assertAuthorityBoundaryFalseFlags(invalidOverrideResult.authority_boundary);
  assert.equal(
    invalidOverrideResult.authority_boundary.runtime_source_fetch_implemented_now,
    false,
  );
  assert.equal(invalidOverrideResult.authority_boundary.crawler_implemented_now, false);
  assert.equal(
    invalidOverrideResult.authority_boundary.provider_extraction_implemented_now,
    false,
  );
  assert.equal(
    invalidOverrideResult.authority_boundary.retrieval_rag_implemented_now,
    false,
  );
}

function assertDocsPointers() {
  for (const requiredText of [
    "Bounded External Source Intake browser validation v0.1",
    fixturePath,
    smokePath,
    packageScriptName,
    "validates deterministic fixture-backed implementation",
    "validates generated reference-only source intake bundle from #721 contract",
    "validates contract boundary / top-level implementation boundary separation",
    "validates invalid source_refs override rejection",
    "validates disallowed source input rejection",
    "validates no source fetch / crawler / provider extraction / retrieval/RAG / source index / durable source record write",
    "no runtime persistence",
    "no durable memory write",
    "no runtime DB write/query",
    "no schema/migration",
    "no route or UI",
    "no browser request",
    "no proof/evidence/Perspective promotion/candidate mutation/work mutation",
    "no product write/product IDs",
    "product-write remains parked by #686",
    nextRecommendedSlice,
  ]) {
    assert.ok(indexDoc.includes(requiredText), `index doc must include ${requiredText}`);
  }
  for (const doc of [substrateDoc, surfaceDoc, gateDoc]) {
    assert.match(doc, /Bounded External Source Intake browser validation v0\.1/i);
    assert.match(doc, /reference-only source intake/i);
    assert.match(doc, /not source fetch|no runtime source fetch/i);
    assert.match(doc, /crawler/i);
    assert.match(doc, /provider extraction|providers?/i);
    assert.match(doc, /retrieval\/RAG/i);
    assert.match(doc, /not proof\/evidence/i);
    assert.match(doc, /Perspective state|durable Perspective promotion/i);
    assert.match(doc, /candidate\/work mutation|candidate mutation|work mutation/i);
    assert.match(doc, /product write/i);
    assert.match(doc, /runtime DB|no runtime DB/i);
    assert.match(doc, new RegExp(nextRecommendedSlice));
  }
}

function assertImplementationSmokeDownstreamPointer() {
  for (const requiredText of [
    validationVersion,
    fixturePath,
    smokePath,
    packageScriptName,
    recommendationStatus,
    nextRecommendedSlice,
    "reference-only source intake bundle",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      implementationSmokeSource.includes(requiredText),
      `#722 Bounded External Source Intake implementation smoke must allow browser validation downstream pointer: ${requiredText}`,
    );
  }
  assert.ok(
    contractSmokeSource.includes("bounded_external_source_intake_implementation.v0.1"),
    "#721 contract smoke must still allow implementation downstream pointer",
  );
}

function assertImplementationSmokeInvalidOverrideCoverage() {
  for (const requiredText of [
    "assertInvalidSourceRefOverride",
    "buildInvalidSourceRefs",
    "invalid source_refs override",
    "source_ref_disallowed_input_kind",
    "source_ref_unknown_input_kind",
    "source_ref_not_reference_only",
    "source_ref_fetch_enabled",
    "source_ref_provider_extraction_enabled",
    "source_ref_candidate_generation_not_later_only",
    "source_ref_missing_operator_context",
    "source_ref_missing_refs",
    "source_ref_not_public_safe",
    "source_ref_invalid_status",
  ]) {
    assert.ok(
      implementationSmokeSource.includes(requiredText),
      `#722 implementation smoke must cover invalid override text: ${requiredText}`,
    );
  }
}

function assertPortableMergeBaseFallback() {
  for (const requiredText of [
    "gitRefExists",
    "tryGitOutput",
    "origin/main",
    "main",
    "HEAD^",
    "Unable to determine a base ref for static changed-file validation",
  ]) {
    assert.ok(readFileSync(smokePath, "utf8").includes(requiredText), `smoke must include portable mergeBaseRef text: ${requiredText}`);
  }
}

function operatorSourceCandidateGenerationImplementationSliceActive() {
  return readChangedFiles().includes(
    "scripts/smoke-operator-source-candidate-generation-implementation-v0-1.mjs",
  );
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
    packagePath,
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
    packagePath,
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
    operatorSourceCandidateGenerationContractSmokePath,
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
    packageJson.scripts[operatorSourceCandidateGenerationContractPackageScriptName],
    operatorSourceCandidateGenerationContractPackageScriptValue,
  );
  assert.deepEqual(
    addedScriptNames,
    [operatorSourceCandidateGenerationContractPackageScriptName],
    "package.json must add only the Operator Source Candidate Generation contract smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
}

function assertOperatorSourceCandidateGenerationContractChangedFiles(changedFiles) {
  const expectedFiles = [
    operatorSourceCandidateGenerationContractTypePath,
    operatorSourceCandidateGenerationContractFixturePath,
    operatorSourceCandidateGenerationContractSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    smokePath,
    implementationSmokePath,
    contractSmokePath,
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
  for (const unchangedPath of [builderPath, implementationFixturePath]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `Operator Source Candidate Generation contract slice must not change ${unchangedPath}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      `unexpected changed file in Operator Source Candidate Generation contract downstream slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|retrieval|source-fetch)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
  for (const requiredText of [
    operatorSourceCandidateGenerationContractVersion,
    operatorSourceCandidateGenerationContractTypePath,
    operatorSourceCandidateGenerationContractFixturePath,
    operatorSourceCandidateGenerationContractSmokePath,
    operatorSourceCandidateGenerationContractPackageScriptName,
    operatorSourceCandidateGenerationContractRecommendationStatus,
    operatorSourceCandidateGenerationContractNextRecommendedSlice,
    "candidate-generation preview policy",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      readFileSync(smokePath, "utf8").includes(requiredText),
      `#723 Bounded External Source Intake browser validation smoke must allow Operator Source Candidate Generation downstream pointer: ${requiredText}`,
    );
  }
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

function stripValidationText(source) {
  return source
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(["'`])(?:\\.|(?!\1)[\s\S])*\1/g, "\"\"");
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
    return readGitOutput(args);
  } catch {
    return null;
  }
}

function readGitOutput(args) {
  return execFileSync("git", args, { encoding: "utf8" });
}

function createFingerprint(value) {
  const normalized = clone(value);
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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
