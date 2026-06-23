import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const builderPath =
  "lib/research-candidate-review/durable-perspective-state-trajectory.ts";
const contractTypePath =
  "types/durable-perspective-state-trajectory-contract.ts";
const contractFixturePath =
  "fixtures/research-candidate-review.durable-perspective-state-trajectory-contract.sample.v0.1.json";
const implementationFixturePath =
  "fixtures/research-candidate-review.durable-perspective-state-trajectory-implementation.sample.v0.1.json";
const fixturePath =
  "fixtures/research-candidate-review.durable-perspective-state-trajectory-browser-validation.sample.v0.1.json";
const smokePath =
  "scripts/smoke-durable-perspective-state-trajectory-browser-validation-v0-1.mjs";
const implementationSmokePath =
  "scripts/smoke-durable-perspective-state-trajectory-implementation-v0-1.mjs";
const contractSmokePath =
  "scripts/smoke-durable-perspective-state-trajectory-contract-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";

const packageScriptName =
  "smoke:durable-perspective-state-trajectory-browser-validation-v0-1";
const packageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-durable-perspective-state-trajectory-browser-validation-v0-1.mjs";
const validationKind =
  "durable_perspective_state_trajectory_browser_validation";
const validationVersion =
  "durable_perspective_state_trajectory_browser_validation.v0.1";
const recommendationStatus =
  "ready_for_project_constellation_runtime_layout_contract_v0_1";
const nextRecommendedSlice =
  "project_constellation_runtime_layout_contract_v0_1";
const projectLayoutTypePath =
  "types/project-constellation-runtime-layout-contract.ts";
const projectLayoutFixturePath =
  "fixtures/research-candidate-review.project-constellation-runtime-layout-contract.sample.v0.1.json";
const projectLayoutSmokePath =
  "scripts/smoke-project-constellation-runtime-layout-contract-v0-1.mjs";
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
const implementationVersion =
  "durable_perspective_state_trajectory_implementation.v0.1";
const previewVersion = "durable_perspective_state_trajectory_preview.v0.1";
const writeFixture = process.argv.includes("--write-fixture");
let cachedMergeBaseRef = null;

const downstreamSmokePaths = [
  contractSmokePath,
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

const expectedChangedFiles = [
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  implementationSmokePath,
  ...downstreamSmokePaths,
];

for (const filePath of [
  builderPath,
  contractTypePath,
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
const contractTypeSource = readFile(contractTypePath);
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

const {
  buildDurablePerspectiveStateTrajectoryImplementationFixture,
  buildDurablePerspectiveStateTrajectoryPreviewBundle,
  validateDurablePerspectiveStateTrajectoryPreviewBundle,
  createDurablePerspectiveStateTrajectoryFingerprint,
} = await import(
  "../lib/research-candidate-review/durable-perspective-state-trajectory.ts"
);

const sourceContractRef = `${contractFixture.contract_version}:${contractFixturePath}`;
const rebuiltImplementationFixture =
  buildDurablePerspectiveStateTrajectoryImplementationFixture({
    durable_perspective_state_trajectory_contract: contractFixture,
    source_contract_ref: sourceContractRef,
  });
const invalidStatePreviewOverride = buildInvalidStatePreviewOverride();
const invalidTrajectoryEventOverride = buildInvalidTrajectoryEventOverride();
const invalidSnapshotOverride = buildInvalidSnapshotOverride();
const invalidAuthorityBoundaryOverride = buildInvalidAuthorityBoundaryOverride();
const invalidRefsOverride = buildInvalidRefsOverride();
const rebuiltFixture = buildValidationFixture();

if (writeFixture) {
  writeFileSync(fixturePath, `${JSON.stringify(rebuiltFixture, null, 2)}\n`);
  process.exit(0);
}

const fixture = readJson(fixturePath);

assertUpstreamArtifactsUnchanged();
assertBuilderFile();
assertPackageScript();
assertStaticBoundary();
assertNoForbiddenRuntimePatterns();
assert.deepEqual(
  implementationFixture,
  rebuiltImplementationFixture,
  "#734 implementation fixture must match rebuilt deterministic output",
);
assert.deepEqual(
  fixture,
  rebuiltFixture,
  "rebuilt Durable Perspective State / Trajectory browser validation fixture must match committed fixture",
);
assertValidationFixture(fixture);
assertValidatedBuilder(fixture.validated_builder);
assertValidatedStateTrajectory(fixture.validated_state_trajectory);
assertAuthorityBoundary(fixture.authority_boundary);
assertImplementationFixtureReferencesContract();
assertBuiltStateTrajectoryPreviewBundle(
  implementationFixture.built_state_trajectory_preview_bundle,
);
assertInvalidStatePreviewOverrideCoverage();
assertInvalidTrajectoryEventOverrideCoverage();
assertInvalidSnapshotOverrideCoverage();
assertInvalidAuthorityBoundaryOverrideCoverage();
assertInvalidRefsOverrideCoverage();
assertDocsPointers();
assertImplementationSmokeDownstreamPointer();
assertPortableMergeBaseFallback();

console.log(
  JSON.stringify(
    {
      smoke: "durable-perspective-state-trajectory-browser-validation-v0-1",
      final_status: "pass",
      validation_kind: fixture.validation_kind,
      validation_version: fixture.validation_version,
      source_implementation_fingerprint:
        fixture.source_implementation_fingerprint,
      source_contract_fingerprint: fixture.source_contract_fingerprint,
      implementation_fixture_matches_rebuilt_output:
        fixture.validated_state_trajectory
          .implementation_fixture_matches_rebuilt_output,
      preview_bundle_follows_contract:
        fixture.validated_state_trajectory.preview_bundle_follows_contract,
      browser_request_now: fixture.authority_boundary.browser_request_now,
      runtime_state_write_implemented_now:
        fixture.authority_boundary.runtime_state_write_implemented_now,
      runtime_state_read_implemented_now:
        fixture.authority_boundary.runtime_state_read_implemented_now,
      durable_perspective_delta_apply_now:
        fixture.authority_boundary.durable_perspective_delta_apply_now,
      perspective_snapshot_runtime_implemented_now:
        fixture.authority_boundary.perspective_snapshot_runtime_implemented_now,
      trajectory_runtime_build_implemented_now:
        fixture.authority_boundary.trajectory_runtime_build_implemented_now,
      proof_or_evidence_record_write_now:
        fixture.authority_boundary.proof_or_evidence_record_write_now,
      accepted_evidence_write_now:
        fixture.authority_boundary.accepted_evidence_write_now,
      runtime_db_write_now: fixture.authority_boundary.runtime_db_write_now,
      runtime_db_query_now: fixture.authority_boundary.runtime_db_query_now,
      provider_openai_call_now:
        fixture.authority_boundary.provider_openai_call_now,
      retrieval_rag_authority:
        fixture.authority_boundary.retrieval_rag_authority,
      product_write_lane_parked_by_686:
        fixture.authority_boundary.product_write_lane_parked_by_686,
      next_recommended_slice: fixture.next_recommended_slice,
    },
    null,
    2,
  ),
);

function buildValidationFixture() {
  const {
    passed: _passed,
    failure_codes: _failureCodes,
    ...implementationValidation
  } = implementationFixture.validated_implementation;
  const validatedStateTrajectory = {
    implementation_fixture_matches_rebuilt_output: deepEqual(
      implementationFixture,
      rebuiltImplementationFixture,
    ),
    ...implementationValidation,
    invalid_state_preview_override_rejected:
      invalidStatePreviewOverride.rejected,
    invalid_trajectory_event_override_rejected:
      invalidTrajectoryEventOverride.rejected,
    invalid_snapshot_override_rejected: invalidSnapshotOverride.rejected,
    invalid_authority_boundary_override_rejected:
      invalidAuthorityBoundaryOverride.rejected,
    invalid_refs_override_rejected: invalidRefsOverride.rejected,
    browser_validation_added_now: true,
    implementation_changed_now: false,
    contract_changed_now: false,
  };
  const validation = {
    validation_kind: validationKind,
    validation_version: validationVersion,
    source_implementation_ref:
      `${implementationFixture.implementation_version}:${implementationFixturePath}#734`,
    source_implementation_fingerprint:
      implementationFixture.implementation_fingerprint,
    source_contract_ref: implementationFixture.source_contract_ref,
    source_contract_fingerprint: implementationFixture.source_contract_fingerprint,
    validated_builder: {
      builder_path: builderPath,
      implementation_fixture_path: implementationFixturePath,
      contract_fixture_path: contractFixturePath,
      deterministic_fixture_backed_only: true,
      runtime_state_write_now: false,
      runtime_state_read_now: false,
      durable_perspective_delta_apply_now: false,
      perspective_snapshot_runtime_now: false,
      trajectory_runtime_build_now: false,
      promotion_history_write_now: false,
      retirement_history_write_now: false,
      proof_evidence_write_now: false,
      accepted_evidence_write_now: false,
      formation_receipt_write_now: false,
      work_mutation_now: false,
      runtime_db_query_now: false,
      runtime_db_write_now: false,
      production_db_used_now: false,
      provider_openai_call_now: false,
      retrieval_rag_execution_now: false,
      source_fetch_now: false,
      crawler_now: false,
      browser_request_now: false,
      durable_memory_write_now: false,
    },
    validated_state_trajectory: validatedStateTrajectory,
    authority_boundary: buildAuthorityBoundary(),
    recommendation_status: recommendationStatus,
    next_recommended_slice: nextRecommendedSlice,
    validation: {
      passed: validatedStateTrajectoryPasses(validatedStateTrajectory),
      failure_codes: [],
      deterministic_rebuild_matches_fixture: true,
    },
    validation_fingerprint: "",
    fingerprint_algorithm: "fnv1a32_canonical_json",
  };
  validation.validation_fingerprint = createValidationFingerprint(validation);
  return validation;
}

function validatedStateTrajectoryPasses(value) {
  return Object.entries(value).every(([key, flag]) =>
    key === "implementation_changed_now" || key === "contract_changed_now"
      ? flag === false
      : flag === true,
  );
}

function buildAuthorityBoundary() {
  return {
    browser_validation_added_now: true,
    implementation_changed_now: false,
    contract_changed_now: false,
    runtime_state_write_implemented_now: false,
    runtime_state_read_implemented_now: false,
    durable_perspective_state_write_now: false,
    durable_perspective_delta_apply_now: false,
    perspective_snapshot_runtime_implemented_now: false,
    trajectory_runtime_build_implemented_now: false,
    promotion_history_write_now: false,
    retirement_history_write_now: false,
    proof_or_evidence_record_write_now: false,
    accepted_evidence_write_now: false,
    formation_receipt_write_now: false,
    work_mutation_now: false,
    candidate_mutation_now: false,
    candidate_record_write_now: false,
    runtime_promotion_implemented_now: false,
    promotion_decision_record_implemented_now: false,
    promotion_decision_record_write_now: false,
    runtime_retrieval_rag_implemented_now: false,
    runtime_index_build_implemented_now: false,
    runtime_index_write_now: false,
    embedding_generation_implemented_now: false,
    vector_db_implemented_now: false,
    fts_implemented_now: false,
    provider_openai_call_now: false,
    provider_extraction_now: false,
    source_fetch_now: false,
    crawler_now: false,
    source_index_write_now: false,
    durable_source_record_write_now: false,
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
    feedback_events_written_now: false,
    feedback_events_mutated_now: false,
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

function buildInvalidStatePreviewOverride() {
  const cases = [
    [
      "current_thesis_missing_lineage",
      (state) => {
        state.current_thesis.lineage_refs = [];
      },
    ],
    [
      "current_thesis_missing_promotion_record_refs",
      (state) => {
        state.current_thesis.promotion_record_refs = [];
      },
    ],
    [
      "prior_theses_missing",
      (state) => {
        state.prior_theses = [];
      },
    ],
    [
      "prior_thesis_not_preserved_for_audit",
      (state) => {
        state.prior_theses[0].preserved_for_audit = false;
      },
    ],
    [
      "prior_thesis_deleted",
      (state) => {
        state.prior_theses[0].not_deleted = false;
      },
    ],
    [
      "active_claim_missing_supporting_or_contradicting_evidence_refs",
      (state) => {
        state.active_claims[0].supporting_evidence_refs = [];
        state.active_claims[0].contradicting_evidence_refs = [];
      },
    ],
    [
      "supporting_and_contradicting_evidence_refs_not_distinct",
      (state) => {
        state.contradicting_evidence_refs = [...state.supporting_evidence_refs];
      },
    ],
    [
      "open_tensions_missing",
      (state) => {
        state.open_tensions = [];
      },
    ],
    [
      "knowledge_gaps_missing",
      (state) => {
        state.knowledge_gaps = [];
      },
    ],
    [
      "salience_state_authority_enabled",
      (state) => {
        state.salience_state.not_authority = false;
      },
    ],
    [
      "promotion_history_missing",
      (state) => {
        state.promotion_history = [];
      },
    ],
    [
      "retirement_history_missing",
      (state) => {
        state.retirement_history = [];
      },
    ],
    [
      "state_preview_runtime_write_enabled",
      (state) => {
        state.current_thesis.not_written_now = false;
      },
    ],
  ];
  const failureCodes = [];
  for (const [expectedCode, mutateState] of cases) {
    const state = clone(
      contractFixture.sample_durable_perspective_state_preview
        .perspective_state_preview,
    );
    mutateState(state);
    const validation =
      buildDurablePerspectiveStateTrajectoryPreviewBundle({
        contract: contractFixture,
        source_contract_ref: sourceContractRef,
        perspective_state_preview: state,
      }).validation;
    assert.equal(validation.passed, false);
    assert.ok(validation.failure_codes.includes(expectedCode));
    failureCodes.push(expectedCode);
  }
  return { rejected: true, failure_codes: failureCodes };
}

function buildInvalidTrajectoryEventOverride() {
  const cases = [
    [
      "trajectory_event_missing_family_kind",
      (trajectory) => {
        trajectory.trajectory_events[0].event_kind = "";
      },
    ],
    [
      "trajectory_event_unknown_family_kind",
      (trajectory) => {
        trajectory.trajectory_events[0].event_kind = "unknown_family_kind";
      },
    ],
    [
      "trajectory_event_missing_source_refs",
      (trajectory) => {
        trajectory.trajectory_events[0].source_refs = [];
      },
    ],
    [
      "trajectory_event_missing_lineage_refs",
      (trajectory) => {
        trajectory.trajectory_events[0].lineage_refs = [];
      },
    ],
    [
      "trajectory_event_runtime_write_enabled",
      (trajectory) => {
        trajectory.trajectory_events[0].runtime_write_now = true;
      },
    ],
    [
      "trajectory_missing_event_family",
      (trajectory) => {
        trajectory.trajectory_events = trajectory.trajectory_events.slice(1);
      },
    ],
    [
      "trajectory_not_public_safe",
      (trajectory) => {
        trajectory.trajectory_events[0].public_safe = false;
      },
    ],
  ];
  const failureCodes = [];
  for (const [expectedCode, mutateTrajectory] of cases) {
    const trajectory = clone(
      contractFixture.sample_durable_perspective_state_preview.trajectory_preview,
    );
    mutateTrajectory(trajectory);
    const validation =
      buildDurablePerspectiveStateTrajectoryPreviewBundle({
        contract: contractFixture,
        source_contract_ref: sourceContractRef,
        trajectory_preview: trajectory,
      }).validation;
    assert.equal(validation.passed, false);
    assert.ok(validation.failure_codes.includes(expectedCode));
    failureCodes.push(expectedCode);
  }
  return { rejected: true, failure_codes: failureCodes };
}

function buildInvalidSnapshotOverride() {
  const cases = [
    ["snapshot_not_derived_view", { snapshot_is_derived_view: false }],
    ["snapshot_runtime_enabled", { snapshot_runtime_now: true }],
    ["snapshot_missing_lineage_refs", { includes_lineage_refs: false }],
    ["snapshot_missing_current_thesis", { includes_current_thesis: false }],
    ["snapshot_missing_prior_theses", { includes_prior_theses: false }],
    ["snapshot_missing_active_claims", { includes_active_claims: false }],
    [
      "snapshot_missing_supporting_and_contradicting_evidence_refs",
      { includes_supporting_and_contradicting_evidence_refs: false },
    ],
    ["snapshot_missing_open_tensions", { includes_open_tensions: false }],
    ["snapshot_missing_knowledge_gaps", { includes_knowledge_gaps: false }],
    ["snapshot_missing_authority_boundary", { includes_authority_boundary: false }],
    [
      "snapshot_independent_source_of_truth_enabled",
      { snapshot_independent_source_of_truth: true },
    ],
  ];
  const failureCodes = [];
  for (const [expectedCode, override] of cases) {
    const snapshot = {
      ...clone(
        contractFixture.sample_durable_perspective_state_preview
          .perspective_snapshot_preview,
      ),
      ...override,
    };
    const validation =
      buildDurablePerspectiveStateTrajectoryPreviewBundle({
        contract: contractFixture,
        source_contract_ref: sourceContractRef,
        perspective_snapshot_preview: snapshot,
      }).validation;
    assert.equal(validation.passed, false);
    assert.ok(validation.failure_codes.includes(expectedCode));
    failureCodes.push(expectedCode);
  }
  return { rejected: true, failure_codes: failureCodes };
}

function buildInvalidAuthorityBoundaryOverride() {
  const cases = [
    ["runtime_state_write_enabled", "runtime_state_write_implemented_now"],
    ["runtime_state_read_enabled", "runtime_state_read_implemented_now"],
    [
      "durable_perspective_state_write_enabled",
      "durable_perspective_state_write_now",
    ],
    [
      "durable_perspective_delta_apply_enabled",
      "durable_perspective_delta_apply_now",
    ],
    [
      "perspective_snapshot_runtime_enabled",
      "perspective_snapshot_runtime_implemented_now",
    ],
    [
      "trajectory_runtime_build_enabled",
      "trajectory_runtime_build_implemented_now",
    ],
    ["promotion_history_write_enabled", "promotion_history_write_now"],
    ["retirement_history_write_enabled", "retirement_history_write_now"],
    [
      "proof_or_evidence_record_write_enabled",
      "proof_or_evidence_record_write_now",
    ],
    ["accepted_evidence_write_enabled", "accepted_evidence_write_now"],
    ["formation_receipt_write_enabled", "formation_receipt_write_now"],
    ["work_mutation_enabled", "work_mutation_now"],
    ["runtime_db_query_enabled", "runtime_db_query_now"],
    ["runtime_db_write_enabled", "runtime_db_write_now"],
    ["provider_openai_call_enabled", "provider_openai_call_now"],
    ["retrieval_rag_execution_enabled", "runtime_retrieval_rag_implemented_now"],
    ["source_fetch_enabled", "source_fetch_now"],
    ["crawler_enabled", "crawler_now"],
    ["product_write_enabled", "product_write_authority"],
    ["product_id_allocation_enabled", "product_id_allocation_authority"],
  ];
  const failureCodes = [];
  for (const [expectedCode, fieldName] of cases) {
    const implementation =
      buildDurablePerspectiveStateTrajectoryImplementationFixture({
        durable_perspective_state_trajectory_contract: contractFixture,
        source_contract_ref: sourceContractRef,
        authority_boundary_overrides: { [fieldName]: true },
      });
    assert.equal(implementation.validated_implementation.passed, false);
    assert.ok(
      implementation.validated_implementation.failure_codes.includes(
        expectedCode,
      ),
    );
    failureCodes.push(expectedCode);
  }
  return { rejected: true, failure_codes: failureCodes };
}

function buildInvalidRefsOverride() {
  const cases = [
    [
      "perspective_id_missing",
      (state, _trajectory) => {
        state.perspective_id = "";
      },
    ],
    [
      "private_or_unstable_ref_detected",
      (state, _trajectory) => {
        state.open_tensions[0].source_refs = ["source_ref:private:unstable"];
      },
    ],
    [
      "source_refs_missing",
      (state, trajectory) => {
        state.current_thesis.source_refs = [];
        state.active_claims = state.active_claims.map((claim) => ({
          ...claim,
          source_refs: [],
        }));
        state.open_tensions = state.open_tensions.map((tension) => ({
          ...tension,
          source_refs: [],
        }));
        state.knowledge_gaps = state.knowledge_gaps.map((gap) => ({
          ...gap,
          source_refs: [],
        }));
        state.promotion_history = state.promotion_history.map((record) => ({
          ...record,
          source_refs: [],
        }));
        trajectory.trajectory_events = trajectory.trajectory_events.map((event) => ({
          ...event,
          source_refs: [],
        }));
      },
    ],
    [
      "accepted_evidence_ref_missing_for_supported_claim",
      (state, _trajectory) => {
        state.active_claims[0].supporting_evidence_refs = [
          "source_ref:public:not_accepted_evidence",
        ];
      },
    ],
    [
      "candidate_evidence_used_as_accepted_evidence",
      (state, _trajectory) => {
        state.supporting_evidence_refs = [
          "candidate_evidence_ref:public:not_accepted",
        ];
      },
    ],
    [
      "raw_private_source_body_detected",
      (state, _trajectory) => {
        state.current_thesis.summary = "raw_private_source_body should fail";
      },
    ],
    [
      "raw_provider_thread_run_session_id_detected",
      (_state, trajectory) => {
        trajectory.trajectory_events[0].source_refs = [
          "thread_private_run_session_1",
        ];
      },
    ],
  ];
  const failureCodes = [];
  for (const [expectedCode, mutateRefs] of cases) {
    const state = clone(
      contractFixture.sample_durable_perspective_state_preview
        .perspective_state_preview,
    );
    const trajectory = clone(
      contractFixture.sample_durable_perspective_state_preview.trajectory_preview,
    );
    mutateRefs(state, trajectory);
    const validation =
      buildDurablePerspectiveStateTrajectoryPreviewBundle({
        contract: contractFixture,
        source_contract_ref: sourceContractRef,
        perspective_state_preview: state,
        trajectory_preview: trajectory,
      }).validation;
    assert.equal(validation.passed, false);
    assert.ok(validation.failure_codes.includes(expectedCode));
    failureCodes.push(expectedCode);
  }
  return { rejected: true, failure_codes: failureCodes };
}

function assertUpstreamArtifactsUnchanged() {
  assert.equal(
    readGitOutput(["show", `${mergeBaseRef()}:${builderPath}`]),
    builderSource,
    "#734 builder file must not change in browser validation slice",
  );
  assert.deepEqual(
    readJsonFromGit(implementationFixturePath),
    implementationFixture,
    "#734 implementation fixture must not change in browser validation slice",
  );
  assert.deepEqual(
    readJsonFromGit(contractFixturePath),
    contractFixture,
    "#733 contract fixture must not change in browser validation slice",
  );
  assert.equal(
    readGitOutput(["show", `${mergeBaseRef()}:${contractTypePath}`]),
    contractTypeSource,
    "#733 type contract must not change in browser validation slice",
  );
}

function assertBuilderFile() {
  for (const requiredText of [
    "buildDurablePerspectiveStateTrajectoryImplementationFixture",
    "buildDurablePerspectiveStateTrajectoryPreviewBundle",
    "validateDurablePerspectiveStateTrajectoryPreviewBundle",
    "createDurablePerspectiveStateTrajectoryFingerprint",
    "current_thesis_missing_lineage",
    "trajectory_event_missing_family_kind",
    "snapshot_not_derived_view",
    "runtime_state_write_enabled",
    "private_or_unstable_ref_detected",
    "product_id_allocation_enabled",
  ]) {
    assert.ok(
      builderSource.includes(requiredText),
      `${builderPath} must include ${requiredText}`,
    );
  }
}

function assertPackageScript() {
  if (projectConstellationRuntimeLayoutContractSliceActive()) {
    assertProjectConstellationRuntimeLayoutContractPackageScript();
    return;
  }
  assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
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
  assert.deepEqual(
    addedScriptNames,
    [packageScriptName],
    "package.json must add only the Durable Perspective State / Trajectory browser validation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
  assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
  assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
  assert.deepEqual(
    packageJson.optionalDependencies ?? {},
    basePackageJson.optionalDependencies ?? {},
  );
}

function assertStaticBoundary() {
  const changedFiles = readChangedFiles();
  if (projectConstellationRuntimeLayoutContractSliceActive()) {
    assertProjectConstellationRuntimeLayoutContractChangedFiles(changedFiles);
    return;
  }
  for (const unchangedPath of [
    contractTypePath,
    contractFixturePath,
    builderPath,
    implementationFixturePath,
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
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `Durable Perspective State / Trajectory browser validation slice must not change ${unchangedPath}`,
    );
  }
  for (const expectedFile of expectedChangedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedChangedFiles.includes(changedFile),
      `unexpected changed file in Durable Perspective State / Trajectory browser validation slice: ${changedFile}`,
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
}

function projectConstellationRuntimeLayoutContractSliceActive() {
  return readChangedFiles().includes(projectLayoutSmokePath);
}

function assertProjectConstellationRuntimeLayoutContractPackageScript() {
  assert.equal(
    packageJson.scripts[projectLayoutPackageScriptName],
    projectLayoutPackageScriptValue,
  );
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
  assert.deepEqual(
    addedScriptNames,
    [projectLayoutPackageScriptName],
    "package.json must add only the Project Constellation Runtime Layout contract smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
  assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
  assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
  assert.deepEqual(
    packageJson.optionalDependencies ?? {},
    basePackageJson.optionalDependencies ?? {},
  );
}

function assertProjectConstellationRuntimeLayoutContractChangedFiles(changedFiles) {
  const expectedProjectChangedFiles = [
    projectLayoutTypePath,
    projectLayoutFixturePath,
    projectLayoutSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    smokePath,
    implementationSmokePath,
    ...downstreamSmokePaths,
  ];
  for (const unchangedPath of [
    fixturePath,
    contractTypePath,
    contractFixturePath,
    builderPath,
    implementationFixturePath,
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
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `Project Constellation Runtime Layout contract slice must not change ${unchangedPath}`,
    );
  }
  for (const expectedFile of expectedProjectChangedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedProjectChangedFiles.includes(changedFile),
      `unexpected changed file in Project Constellation Runtime Layout contract slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\/research-retrieval\//, "must not add retrieval implementation files");
    assert.doesNotMatch(changedFile, /^lib\/research-rag\//, "must not add RAG implementation files");
    assert.doesNotMatch(changedFile, /^lib\/.*layout/i, "must not add runtime layout implementation files");
    assert.doesNotMatch(changedFile, /^lib\/.*constellation/i, "must not add runtime constellation implementation files");
    assert.doesNotMatch(changedFile, /^lib\/.*graph/i, "must not add graph DB or graph mutation files");
    assert.doesNotMatch(changedFile, /^lib\/.*perspective.*state/i, "must not add runtime Perspective state files");
    assert.doesNotMatch(changedFile, /^lib\/.*perspective.*snapshot/i, "must not add runtime PerspectiveSnapshot files");
    assert.doesNotMatch(changedFile, /^lib\/.*trajectory/i, "must not add runtime trajectory builder files");
    assert.doesNotMatch(changedFile, /^lib\/.*promotion/i, "must not add runtime promotion implementation files");
    assert.doesNotMatch(changedFile, /^lib\/.*(proof|evidence).*write/i, "must not add proof/evidence write files");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|openai|source-fetch|crawler)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
  assertProjectConstellationRuntimeLayoutContractDownstreamPointer();
}

function assertProjectConstellationRuntimeLayoutContractDownstreamPointer() {
  const sourceValidationSmoke = readFile(smokePath);
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
    assert.ok(
      sourceValidationSmoke.includes(requiredText),
      "#735 browser validation smoke must allow Project Constellation Runtime Layout contract downstream pointer: " +
        requiredText,
    );
  }
}

function assertNoForbiddenRuntimePatterns() {
  const changedSourceFiles = readChangedFiles().filter((filePath) =>
    filePath !== contractTypePath &&
    (filePath.endsWith(".ts") ||
      filePath.endsWith(".tsx") ||
      filePath.endsWith(".mjs")) &&
    !filePath.startsWith("scripts/smoke-") &&
    !filePath.startsWith("types/"),
  );
  for (const filePath of changedSourceFiles) {
    const source = stripValidationText(readFile(filePath));
    for (const { label, regex } of [
      { label: "route handler", regex: /\bexport\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\b/ },
      { label: "server action", regex: /["']use server["']/ },
      { label: "browser request", regex: /\bfetch\s*\(|\bXMLHttpRequest\b|navigator\.sendBeacon/ },
      { label: "browser persistence", regex: /\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b|document\.cookie/ },
      { label: "DB open", regex: /\bnew\s+Database\b|\bopenDatabase\b|better-sqlite3/i },
      { label: "runtime DB query", regex: /\bdb\.(prepare|query|exec)\b|\bSELECT\b/i },
      { label: "production DB read", regex: /\bproductionDb\b|\bAUGNES_DB_PATH\b/i },
      { label: "DB write", regex: /\bdb\.(insert|update|delete|transaction)\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b/i },
      { label: "durable memory write", regex: /\b(write|insert|persist)DurableMemory\b|\bdurableMemoryWrite\b/i },
      { label: "source fetch", regex: /\bfetchSource\b|\bsourceFetch\b|\bfetch\s*\(/ },
      { label: "crawler execution", regex: /\brunCrawler\b|\bcrawlDomain\b|\bcrawlerSeed\b/i },
      { label: "external HTTP request", regex: /\bhttps?\.request\b|\bXMLHttpRequest\b/ },
      { label: "provider extraction", regex: /\bproviderExtract\b|\brunProviderExtraction\b/i },
      { label: "OpenAI import", regex: /from\s+["'][^"']*openai["']/i },
      { label: "OpenAI constructor", regex: /new\s+OpenAI\b/i },
      { label: "retrieval/RAG execution", regex: /\brunRetrieval\b|\brunRag\b|\brunRAG\b|\bexecuteRetrieval\b/i },
      { label: "search runtime execution", regex: /\bsearchIndex\b|\bexecuteSearch\b|\brunSearch\b/i },
      { label: "index build/write", regex: /\bbuildIndex\b|\bwriteIndex\b|\bsourceIndexWrite\b|\bwriteSourceIndex\b/i },
      { label: "embedding/vector/FTS implementation", regex: /\bcreateEmbedding\b|\bgenerateEmbedding\b|\bvectorIndex\b|\bvectorDb\b|\bFTS5\b|\bfullTextSearch\b/i },
      { label: "durable source record write", regex: /\bwriteDurableSourceRecord\b|\binsertDurableSourceRecord\b|\bpersistDurableSourceRecord\b|\bdurableSourceRecordWrite\b/i },
      { label: "candidate runtime generation", regex: /\brunCandidateGeneration\b|\bgenerateCandidate\b|\bcreateCandidateFromSource\b/i },
      { label: "candidate record write", regex: /\bwriteCandidateRecord\b|\binsertCandidateRecord\b|\bpersistCandidateRecord\b/i },
      { label: "candidate mutation", regex: /\bmutateCandidate\b|\bupdateCandidate\b|\bdeleteCandidate\b/ },
      { label: "proof/evidence write", regex: /\b(write|insert|persist)(Proof|Evidence)\b|\bproof_or_evidence_record_write_now:\s*true\b/i },
      { label: "accepted evidence write", regex: /\bwriteAcceptedEvidence\b|\baccepted_evidence_write_now:\s*true\b/i },
      { label: "runtime promotion", regex: /\bpromotePerspective\b|\brunPerspectivePromotion\b|\bruntime_promotion_implemented_now:\s*true\b/i },
      { label: "durable Perspective state write", regex: /\bwriteDurablePerspective\b|\bapplyDurablePerspectiveDelta\b|\bdurable_perspective_state_write_now:\s*true\b/i },
      { label: "durable Perspective state read", regex: /\breadDurablePerspective\b|\bruntime_state_read_implemented_now:\s*true\b/i },
      { label: "PerspectiveSnapshot runtime", regex: /\bcreatePerspectiveSnapshot\b|\bperspective_snapshot_runtime_implemented_now:\s*true\b/i },
      { label: "trajectory runtime build", regex: /\bbuildRuntimeTrajectory\b|\btrajectory_runtime_build_implemented_now:\s*true\b/i },
      { label: "promotion decision record", regex: /\bpromotionDecisionRecord\b|\bwritePromotionDecision\b|\bpromotion_decision_record_write_now:\s*true\b/i },
      { label: "Formation Receipt write", regex: /\bwriteFormationReceipt\b|\bformation_receipt_write_now:\s*true\b/i },
      { label: "promotion history write", regex: /\bwritePromotionHistory\b|\bpromotion_history_write_now:\s*true\b/i },
      { label: "retirement history write", regex: /\bwriteRetirementHistory\b|\bretirement_history_write_now:\s*true\b/i },
      { label: "work mutation", regex: /\bmutateWork\b|\bupdateWork\b|\bwork_mutation_now:\s*true\b/i },
      { label: "salience authority true", regex: /\bsalience_authority:\s*true\b|\bsalience_score_used_as_authority_now:\s*true\b/i },
      { label: "Codex product execution", regex: /\bcodex\s+(exec|run)\b/i },
      { label: "GitHub automation", regex: /\bgh\s+pr\b|Octokit|api\.github\.com/i },
      { label: "external handoff send", regex: /\bsendExternalHandoff\b/ },
      { label: "agent execution", regex: /\bexecuteAgent\b|\brouteAgent\b/ },
      { label: "product write", regex: /\bproductWrite\b|\bwriteProduct\b|\bproduct_write_authority:\s*true\b/i },
      { label: "product ID allocation", regex: /\ballocateProductId\b|\bproduct_id_allocation_authority:\s*true\b/i },
    ]) {
      assert.doesNotMatch(source, regex, `${filePath} must not include ${label}`);
    }
  }
}

function assertValidationFixture(value) {
  assert.equal(value.validation_kind, validationKind);
  assert.equal(value.validation_version, validationVersion);
  assert.equal(
    value.source_implementation_ref,
    `${implementationFixture.implementation_version}:${implementationFixturePath}#734`,
  );
  assert.equal(
    value.source_implementation_fingerprint,
    implementationFixture.implementation_fingerprint,
  );
  assert.equal(value.source_contract_ref, implementationFixture.source_contract_ref);
  assert.equal(
    value.source_contract_fingerprint,
    implementationFixture.source_contract_fingerprint,
  );
  assert.equal(value.recommendation_status, recommendationStatus);
  assert.equal(value.next_recommended_slice, nextRecommendedSlice);
  assert.equal(value.validation.passed, true);
  assert.deepEqual(value.validation.failure_codes, []);
  assert.equal(value.validation.deterministic_rebuild_matches_fixture, true);
  assert.equal(value.fingerprint_algorithm, "fnv1a32_canonical_json");
  assert.equal(value.validation_fingerprint, createValidationFingerprint(value));
}

function assertValidatedBuilder(value) {
  assert.equal(value.builder_path, builderPath);
  assert.equal(value.implementation_fixture_path, implementationFixturePath);
  assert.equal(value.contract_fixture_path, contractFixturePath);
  assert.equal(value.deterministic_fixture_backed_only, true);
  for (const [key, flag] of Object.entries(value)) {
    if (
      key === "builder_path" ||
      key === "implementation_fixture_path" ||
      key === "contract_fixture_path" ||
      key === "deterministic_fixture_backed_only"
    ) {
      continue;
    }
    assert.equal(flag, false, `validated_builder.${key} must be false`);
  }
}

function assertValidatedStateTrajectory(value) {
  for (const [key, flag] of Object.entries(value)) {
    if (key === "implementation_changed_now" || key === "contract_changed_now") {
      assert.equal(flag, false, `validated_state_trajectory.${key} must be false`);
    } else {
      assert.equal(flag, true, `validated_state_trajectory.${key} must be true`);
    }
  }
}

function assertAuthorityBoundary(boundary) {
  assert.equal(boundary.browser_validation_added_now, true);
  assert.equal(boundary.implementation_changed_now, false);
  assert.equal(boundary.contract_changed_now, false);
  assert.equal(boundary.product_write_lane_parked_by_686, true);
  for (const [key, flag] of Object.entries(boundary)) {
    if (key === "browser_validation_added_now" || key === "product_write_lane_parked_by_686") {
      assert.equal(flag, true, `${key} must be true`);
    } else {
      assert.equal(flag, false, `${key} must be false`);
    }
  }
}

function assertImplementationFixtureReferencesContract() {
  assert.equal(
    implementationFixture.source_contract_ref,
    `${contractFixture.contract_version}:${contractFixturePath}`,
  );
  assert.equal(
    implementationFixture.source_contract_fingerprint,
    contractFixture.contract_fingerprint,
  );
  assert.equal(
    implementationFixture.implementation_fingerprint,
    createDurablePerspectiveStateTrajectoryFingerprint(implementationFixture),
  );
}

function assertBuiltStateTrajectoryPreviewBundle(bundle) {
  const sample = contractFixture.sample_durable_perspective_state_preview;
  assert.equal(bundle.preview_version, previewVersion);
  assert.equal(bundle.source_contract_ref, sourceContractRef);
  assert.equal(bundle.operator_context_ref, sample.operator_context_ref);
  assert.deepEqual(bundle.perspective_state_preview, sample.perspective_state_preview);
  assert.deepEqual(bundle.trajectory_preview, sample.trajectory_preview);
  assert.deepEqual(
    bundle.perspective_snapshot_preview,
    sample.perspective_snapshot_preview,
  );
  assert.deepEqual(bundle.authority_boundary, sample.authority_boundary);
  assert.deepEqual(bundle.validation_policy, contractFixture.validation_policy);
  assert.deepEqual(bundle.lineage_policy, contractFixture.lineage_policy);
  assert.deepEqual(bundle.evidence_policy, contractFixture.evidence_policy);
  assert.deepEqual(bundle.snapshot_policy, contractFixture.snapshot_policy);
  assert.deepEqual(bundle.salience_policy, contractFixture.salience_policy);
  assert.equal(Object.hasOwn(bundle.authority_boundary, "implementation_added_now"), false);
  assert.equal(Object.hasOwn(bundle.authority_boundary, "deterministic_builder_added_now"), false);
  assert.equal(implementationFixture.authority_boundary.implementation_added_now, true);
  assert.equal(
    implementationFixture.authority_boundary.deterministic_builder_added_now,
    true,
  );
  assert.deepEqual(bundle.state_field_summary.state_fields, contractFixture.state_fields);
  assert.deepEqual(
    bundle.trajectory_event_family_summary.event_kinds,
    contractFixture.trajectory_event_families.map((family) => family.event_kind),
  );
  assert.equal(bundle.lineage_summary.current_thesis_has_lineage, true);
  assert.equal(bundle.lineage_summary.prior_theses_preserved, true);
  assert.equal(bundle.lineage_summary.retired_claims_remain_auditable, true);
  assert.equal(bundle.lineage_summary.contradicted_evidence_not_deleted, true);
  assert.equal(
    bundle.evidence_summary.supporting_and_contradicting_evidence_refs_distinct,
    true,
  );
  assert.equal(bundle.evidence_summary.candidate_evidence_not_accepted_evidence, true);
  assert.equal(
    bundle.evidence_summary.accepted_evidence_refs_required_for_accepted_evidence_claims,
    true,
  );
  assert.equal(bundle.snapshot_summary.snapshot_is_derived_view, true);
  assert.equal(bundle.snapshot_summary.perspective_snapshot_runtime_now_false, true);
  assert.equal(bundle.snapshot_summary.snapshot_includes_authority_boundary, true);
  assert.equal(bundle.salience_summary.salience_state_not_authority, true);
  assert.equal(bundle.reference_summary.public_safe_refs_only, true);
  assert.equal(bundle.validation.passed, true);
  assert.equal(bundle.validation.preview_bundle_follows_contract, true);
  assert.deepEqual(
    buildDurablePerspectiveStateTrajectoryPreviewBundle({
      contract: contractFixture,
      source_contract_ref: sourceContractRef,
    }),
    bundle,
  );
  assert.deepEqual(
    validateDurablePerspectiveStateTrajectoryPreviewBundle(
      withoutKey(bundle, "validation"),
      contractFixture,
    ),
    bundle.validation,
  );
}

function assertInvalidStatePreviewOverrideCoverage() {
  assert.deepEqual(invalidStatePreviewOverride.failure_codes, [
    "current_thesis_missing_lineage",
    "current_thesis_missing_promotion_record_refs",
    "prior_theses_missing",
    "prior_thesis_not_preserved_for_audit",
    "prior_thesis_deleted",
    "active_claim_missing_supporting_or_contradicting_evidence_refs",
    "supporting_and_contradicting_evidence_refs_not_distinct",
    "open_tensions_missing",
    "knowledge_gaps_missing",
    "salience_state_authority_enabled",
    "promotion_history_missing",
    "retirement_history_missing",
    "state_preview_runtime_write_enabled",
  ]);
}

function assertInvalidTrajectoryEventOverrideCoverage() {
  assert.deepEqual(invalidTrajectoryEventOverride.failure_codes, [
    "trajectory_event_missing_family_kind",
    "trajectory_event_unknown_family_kind",
    "trajectory_event_missing_source_refs",
    "trajectory_event_missing_lineage_refs",
    "trajectory_event_runtime_write_enabled",
    "trajectory_missing_event_family",
    "trajectory_not_public_safe",
  ]);
}

function assertInvalidSnapshotOverrideCoverage() {
  assert.deepEqual(invalidSnapshotOverride.failure_codes, [
    "snapshot_not_derived_view",
    "snapshot_runtime_enabled",
    "snapshot_missing_lineage_refs",
    "snapshot_missing_current_thesis",
    "snapshot_missing_prior_theses",
    "snapshot_missing_active_claims",
    "snapshot_missing_supporting_and_contradicting_evidence_refs",
    "snapshot_missing_open_tensions",
    "snapshot_missing_knowledge_gaps",
    "snapshot_missing_authority_boundary",
    "snapshot_independent_source_of_truth_enabled",
  ]);
}

function assertInvalidAuthorityBoundaryOverrideCoverage() {
  assert.deepEqual(invalidAuthorityBoundaryOverride.failure_codes, [
    "runtime_state_write_enabled",
    "runtime_state_read_enabled",
    "durable_perspective_state_write_enabled",
    "durable_perspective_delta_apply_enabled",
    "perspective_snapshot_runtime_enabled",
    "trajectory_runtime_build_enabled",
    "promotion_history_write_enabled",
    "retirement_history_write_enabled",
    "proof_or_evidence_record_write_enabled",
    "accepted_evidence_write_enabled",
    "formation_receipt_write_enabled",
    "work_mutation_enabled",
    "runtime_db_query_enabled",
    "runtime_db_write_enabled",
    "provider_openai_call_enabled",
    "retrieval_rag_execution_enabled",
    "source_fetch_enabled",
    "crawler_enabled",
    "product_write_enabled",
    "product_id_allocation_enabled",
  ]);
}

function assertInvalidRefsOverrideCoverage() {
  assert.deepEqual(invalidRefsOverride.failure_codes, [
    "perspective_id_missing",
    "private_or_unstable_ref_detected",
    "source_refs_missing",
    "accepted_evidence_ref_missing_for_supported_claim",
    "candidate_evidence_used_as_accepted_evidence",
    "raw_private_source_body_detected",
    "raw_provider_thread_run_session_id_detected",
  ]);
}

function assertDocsPointers() {
  for (const requiredText of [
    "Durable Perspective State / Trajectory browser validation v0.1",
    fixturePath,
    smokePath,
    "validates deterministic fixture-backed implementation from #734",
    "validates #733 contract boundary and #734 top-level implementation boundary separation",
    "validates built durable state/trajectory preview bundle",
    "validates state field summary",
    "validates trajectory event family summary",
    "validates lineage summary",
    "validates evidence summary",
    "validates snapshot summary",
    "validates salience summary",
    "validates reference summary",
    "validates invalid state preview override rejection",
    "validates invalid trajectory event override rejection",
    "validates invalid snapshot override rejection",
    "validates invalid authority boundary override rejection",
    "validates invalid refs override rejection",
    "current thesis has lineage",
    "prior thesis is not overwritten silently",
    "prior theses are preserved",
    "retired claims remain auditable",
    "contradicted evidence is not deleted",
    "open tensions are preserved or explicitly resolved",
    "knowledge gaps are preserved, explicitly deferred, or closed",
    "supporting evidence refs and contradicting evidence refs are distinct",
    "candidate evidence is not accepted evidence",
    "accepted evidence refs required for accepted evidence claims",
    "promotion history append-only later",
    "retirement history append-only later",
    "PerspectiveSnapshot is derived view, not independent source of truth",
    "PerspectiveSnapshot runtime not implemented",
    "salience state is display/reuse context only",
    "salience state is not authority",
    "no runtime state read/write",
    "no durable Perspective delta apply",
    "no PerspectiveSnapshot runtime",
    "no trajectory runtime build",
    "no proof/evidence write",
    "no accepted evidence write",
    "no Formation Receipt write",
    "no work mutation",
    "no DB write/query",
    "no schema/migration",
    "no route or UI",
    "no browser request",
    "no provider/OpenAI call",
    "no retrieval/RAG execution",
    "no product write/product IDs",
    "product-write remains parked by #686",
    nextRecommendedSlice,
  ]) {
    assert.ok(indexDoc.includes(requiredText), `index doc must include ${requiredText}`);
  }
  for (const requiredText of [
    "Durable Perspective State / Trajectory browser validation validates the deterministic fixture-backed #734 implementation.",
    "It validates public-safe durable state/trajectory preview bundles against the #733 contract.",
    "Agent Substrate remains advisory-only and cannot read/write durable Perspective state.",
    "PerspectiveSnapshot remains a future derived view, not independent source of truth.",
    "Salience state remains display/reuse context only and not authority.",
    "This slice does not implement runtime state read/write, durable Perspective delta apply, PerspectiveSnapshot runtime, trajectory runtime build, proof/evidence writes, accepted evidence writes, Formation Receipt writes, DB writes, route/UI, provider/OpenAI, retrieval/RAG, or product write.",
    "Next recommended slice is Project Constellation Runtime Layout contract v0.1.",
  ]) {
    assert.ok(substrateDoc.includes(requiredText), `substrate doc must include ${requiredText}`);
  }
  for (const requiredText of [
    "Durable Perspective State / Trajectory validation remains separated from runtime durable Perspective state.",
    "It preserves candidate/durable distinction.",
    "PerspectiveDeltaCandidate is not committed state.",
    "Only future human/Core promotion can create durable Perspective state changes.",
    "Current thesis must have lineage.",
    "Prior thesis must not be overwritten silently.",
    "Retired claims remain auditable.",
    "Contradicted evidence is not deleted.",
    "Open tensions and knowledge gaps remain visible unless explicitly handled.",
    "This slice does not implement runtime DB/browser/provider/source-fetch/retrieval/promotion/state behavior.",
  ]) {
    assert.ok(surfaceDoc.includes(requiredText), `surface doc must include ${requiredText}`);
    assert.ok(gateDoc.includes(requiredText), `gate doc must include ${requiredText}`);
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
    "validates deterministic fixture-backed implementation from #734",
    "current thesis has lineage",
    "PerspectiveSnapshot runtime not implemented",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      implementationSmokeSource.includes(requiredText),
      `#734 implementation smoke must allow browser validation downstream pointer: ${requiredText}`,
    );
  }
  assert.ok(
    contractSmokeSource.includes(implementationVersion),
    "#733 contract smoke must keep #734 implementation downstream pointer",
  );
}

function assertPortableMergeBaseFallback() {
  for (const requiredText of [
    "cachedMergeBaseRef",
    "gitRefExists(\"origin/main\")",
    "gitRefExists(\"main\")",
    "rev-parse",
    "HEAD^",
    "Unable to determine a base ref for static changed-file validation",
  ]) {
    assert.ok(smokeSource.includes(requiredText), `smoke must include portable merge base fallback: ${requiredText}`);
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
  if (gitRefExists("origin/main")) {
    const mergeBase = tryGitOutput(["merge-base", "HEAD", "origin/main"])?.trim();
    if (mergeBase) {
      cachedMergeBaseRef = mergeBase;
      return cachedMergeBaseRef;
    }
  }
  if (gitRefExists("main")) {
    const mergeBase = tryGitOutput(["merge-base", "HEAD", "main"])?.trim();
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

function withoutKey(value, keyToDrop) {
  return Object.fromEntries(
    Object.entries(value).filter(([key]) => key !== keyToDrop),
  );
}

function createValidationFingerprint(value) {
  const normalized = clone(value);
  normalized.validation_fingerprint = "";
  return `fnv1a32:${fnv1a32(canonicalJson(normalized))}`;
}

function deepEqual(left, right) {
  return canonicalJson(left) === canonicalJson(right);
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
