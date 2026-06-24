import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const typePath = "types/project-constellation-runtime-layout-contract.ts";
const fixturePath =
  "fixtures/research-candidate-review.project-constellation-runtime-layout-contract.sample.v0.1.json";
const smokePath =
  "scripts/smoke-project-constellation-runtime-layout-contract-v0-1.mjs";
const sourceValidationFixturePath =
  "fixtures/research-candidate-review.durable-perspective-state-trajectory-browser-validation.sample.v0.1.json";
const sourceValidationSmokePath =
  "scripts/smoke-durable-perspective-state-trajectory-browser-validation-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";

const packageScriptName =
  "smoke:project-constellation-runtime-layout-contract-v0-1";
const packageScriptValue =
  "node scripts/smoke-project-constellation-runtime-layout-contract-v0-1.mjs";
const contractKind = "project_constellation_runtime_layout_contract";
const contractVersion = "project_constellation_runtime_layout_contract.v0.1";
const previewVersion = "project_constellation_runtime_layout_preview.v0.1";
const layoutVersion = "project_constellation_layout.v0.1";
const recommendationStatus =
  "ready_for_project_constellation_runtime_layout_implementation_v0_1";
const nextRecommendedSlice =
  "project_constellation_runtime_layout_implementation_v0_1";
const implementationBuilderPath =
  "lib/research-candidate-review/project-constellation-runtime-layout.ts";
const implementationFixturePath =
  "fixtures/research-candidate-review.project-constellation-runtime-layout-implementation.sample.v0.1.json";
const implementationSmokePath =
  "scripts/smoke-project-constellation-runtime-layout-implementation-v0-1.mjs";
const implementationPackageScriptName =
  "smoke:project-constellation-runtime-layout-implementation-v0-1";
const implementationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-project-constellation-runtime-layout-implementation-v0-1.mjs";
const implementationVersion =
  "project_constellation_runtime_layout_implementation.v0.1";
const implementationRecommendationStatus =
  "ready_for_project_constellation_runtime_layout_browser_validation_v0_1";
const implementationNextRecommendedSlice =
  "project_constellation_runtime_layout_browser_validation_v0_1";
const browserValidationFixturePath =
  "fixtures/research-candidate-review.project-constellation-runtime-layout-browser-validation.sample.v0.1.json";
const browserValidationSmokePath =
  "scripts/smoke-project-constellation-runtime-layout-browser-validation-v0-1.mjs";
const browserValidationPackageScriptName =
  "smoke:project-constellation-runtime-layout-browser-validation-v0-1";
const browserValidationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-project-constellation-runtime-layout-browser-validation-v0-1.mjs";
const browserValidationVersion =
  "project_constellation_runtime_layout_browser_validation.v0.1";
const browserValidationRecommendationStatus =
  "ready_for_perspective_geometry_digest_contract_v0_1";
const browserValidationNextRecommendedSlice =
  "perspective_geometry_digest_contract_v0_1";
const perspectiveGeometryDigestTypePath =
  "types/perspective-geometry-digest-contract.ts";
const perspectiveGeometryDigestFixturePath =
  "fixtures/research-candidate-review.perspective-geometry-digest-contract.sample.v0.1.json";
const perspectiveGeometryDigestSmokePath =
  "scripts/smoke-perspective-geometry-digest-contract-v0-1.mjs";
const perspectiveGeometryDigestPackageScriptName =
  "smoke:perspective-geometry-digest-contract-v0-1";
const perspectiveGeometryDigestPackageScriptValue =
  "node scripts/smoke-perspective-geometry-digest-contract-v0-1.mjs";
const perspectiveGeometryDigestContractVersion =
  "perspective_geometry_digest_contract.v0.1";
const perspectiveGeometryDigestRecommendationStatus =
  "ready_for_perspective_geometry_digest_implementation_v0_1";
const perspectiveGeometryDigestNextRecommendedSlice =
  "perspective_geometry_digest_implementation_v0_1";
const perspectiveGeometryDigestImplementationBuilderPath =
  "lib/research-candidate-review/perspective-geometry-digest.ts";
const perspectiveGeometryDigestImplementationFixturePath =
  "fixtures/research-candidate-review.perspective-geometry-digest-implementation.sample.v0.1.json";
const perspectiveGeometryDigestImplementationSmokePath =
  "scripts/smoke-perspective-geometry-digest-implementation-v0-1.mjs";
const perspectiveGeometryDigestImplementationPackageScriptName =
  "smoke:perspective-geometry-digest-implementation-v0-1";
const perspectiveGeometryDigestImplementationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-perspective-geometry-digest-implementation-v0-1.mjs";
const perspectiveGeometryDigestImplementationVersion =
  "perspective_geometry_digest_implementation.v0.1";
const perspectiveGeometryDigestImplementationRecommendationStatus =
  "ready_for_perspective_geometry_digest_browser_validation_v0_1";
const perspectiveGeometryDigestImplementationNextRecommendedSlice =
  "perspective_geometry_digest_browser_validation_v0_1";
const perspectiveGeometryDigestImplementationDownstreamSmokePaths = [
  "scripts/smoke-project-constellation-runtime-layout-browser-validation-v0-1.mjs",
  "scripts/smoke-project-constellation-runtime-layout-implementation-v0-1.mjs",
  "scripts/smoke-project-constellation-runtime-layout-contract-v0-1.mjs",
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
  "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
];
const writeFixture = process.argv.includes("--write-fixture");
let cachedMergeBaseRef = null;

const downstreamSmokePaths = [
  sourceValidationSmokePath,
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

const expectedChangedFiles = [
  typePath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  ...downstreamSmokePaths,
];

const protectedUnchangedPaths = [
  sourceValidationFixturePath,
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
];

for (const filePath of [
  typePath,
  smokePath,
  sourceValidationFixturePath,
  sourceValidationSmokePath,
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
const sourceValidationFixture = readJson(sourceValidationFixturePath);
const sourceValidationSmoke = readFile(sourceValidationSmokePath);
const packageJson = readJson(packagePath);
const basePackageJson = readJsonFromGit(packagePath);
const indexDoc = readFile(indexPath);
const substrateDoc = readFile(substrateDocPath);
const surfaceDoc = readFile(surfaceDocPath);
const gateDoc = readFile(gateDocPath);
const rebuiltFixture = buildContractFixture();

if (writeFixture) {
  writeFileSync(fixturePath, `${JSON.stringify(rebuiltFixture, null, 2)}\n`);
  process.exit(0);
}

const fixture = readJson(fixturePath);

assertRequiredFiles();
assertUpstreamValidationUnchanged();
assertTypeContract();
assertPackageScript();
assertStaticBoundary();
assertNoForbiddenRuntimePatterns();
assertContractShape(fixture);
assertContractScope(fixture.contract_scope);
assertLayoutPrinciples(fixture.layout_principles);
assertLayoutInputFields(fixture.layout_input_fields);
assertLayoutOutputFields(fixture.layout_output_fields);
assertNodeFamilies(fixture.node_families);
assertEdgeFamilies(fixture.edge_families);
assertStabilityPolicy(fixture.stability_policy);
assertSourceBalancePolicy(fixture.source_balance_policy);
assertCandidateOverlayPolicy(fixture.candidate_overlay_policy);
assertSnapshotPolicy(fixture.snapshot_policy);
assertSaliencePolicy(fixture.salience_policy);
assertSamplePreview(fixture.sample_project_constellation_layout_preview);
assertAuthorityBoundary(fixture.authority_boundary);
assertValidationPolicy(fixture.validation_policy);
assertPrivacyPolicy(fixture.privacy_policy);
assertDocsPointers();
assertSourceValidationDownstreamPointer();
assertPortableMergeBaseFallback();
assert.deepEqual(
  fixture,
  rebuiltFixture,
  "rebuilt Project Constellation Runtime Layout contract fixture must match committed fixture",
);

console.log(
  JSON.stringify(
    {
      smoke: "project-constellation-runtime-layout-contract-v0-1",
      final_status: "pass",
      contract_kind: fixture.contract_kind,
      contract_version: fixture.contract_version,
      source_state_trajectory_validation_fingerprint:
        fixture.source_state_trajectory_validation_fingerprint,
      node_family_count: fixture.node_families.length,
      edge_family_count: fixture.edge_families.length,
      layout_is_interface_not_truth:
        fixture.layout_principles.layout_is_interface_not_truth,
      coordinates_not_source_of_truth:
        fixture.layout_principles.coordinates_not_source_of_truth,
      runtime_layout_execution_now:
        fixture.authority_boundary.runtime_layout_execution_now,
      layout_persistence_now: fixture.authority_boundary.layout_persistence_now,
      graph_mutation_now: fixture.authority_boundary.graph_mutation_now,
      browser_request_now: fixture.authority_boundary.browser_request_now,
      runtime_db_write_now: fixture.authority_boundary.runtime_db_write_now,
      runtime_db_query_now: fixture.authority_boundary.runtime_db_query_now,
      provider_openai_call_now:
        fixture.authority_boundary.provider_openai_call_now,
      retrieval_rag_authority:
        fixture.authority_boundary.retrieval_rag_authority,
      layout_coordinate_authority:
        fixture.authority_boundary.layout_coordinate_authority,
      product_write_lane_parked_by_686:
        fixture.authority_boundary.product_write_lane_parked_by_686,
      next_recommended_slice: fixture.next_recommended_slice,
    },
    null,
    2,
  ),
);

function buildContractFixture() {
  const authorityBoundary = buildAuthorityBoundary();
  const validationPolicy = buildValidationPolicy();
  const contract = {
    contract_kind: contractKind,
    contract_version: contractVersion,
    source_state_trajectory_validation_ref:
      `${sourceValidationFixture.validation_version}:${sourceValidationFixturePath}#735`,
    source_state_trajectory_validation_fingerprint:
      sourceValidationFixture.validation_fingerprint,
    contract_scope: buildContractScope(),
    layout_principles: buildLayoutPrinciples(),
    layout_input_fields: expectedLayoutInputFields(),
    layout_output_fields: expectedLayoutOutputFields(),
    node_families: buildNodeFamilies(),
    edge_families: buildEdgeFamilies(),
    stability_policy: buildStabilityPolicy(),
    source_balance_policy: buildSourceBalancePolicy(),
    candidate_overlay_policy: buildCandidateOverlayPolicy(),
    snapshot_policy: buildSnapshotPolicy(),
    salience_policy: buildSaliencePolicy(),
    sample_project_constellation_layout_preview: buildSamplePreview(
      authorityBoundary,
      validationPolicy,
    ),
    authority_boundary: authorityBoundary,
    validation_policy: validationPolicy,
    privacy_policy: buildPrivacyPolicy(),
    recommendation_status: recommendationStatus,
    next_recommended_slice: nextRecommendedSlice,
    contract_fingerprint: "",
    fingerprint_algorithm: "fnv1a32_canonical_json",
  };
  contract.contract_fingerprint = createContractFingerprint(contract);
  return contract;
}

function buildContractScope() {
  return {
    project_constellation_layout_contract_only: true,
    runtime_layout_execution_now: false,
    seeded_layout_runtime_now: false,
    force_directed_layout_runtime_now: false,
    temporal_smoothing_runtime_now: false,
    layout_persistence_now: false,
    layout_coordinate_write_now: false,
    graph_db_now: false,
    graph_mutation_now: false,
    durable_perspective_state_read_now: false,
    durable_perspective_state_write_now: false,
    durable_perspective_delta_apply_now: false,
    perspective_snapshot_runtime_now: false,
    trajectory_runtime_build_now: false,
    proof_evidence_write_now: false,
    accepted_evidence_write_now: false,
    formation_receipt_write_now: false,
    work_mutation_now: false,
    runtime_db_query_now: false,
    runtime_db_write_now: false,
    schema_migration_now: false,
    route_ui_now: false,
    browser_request_now: false,
    provider_openai_call_now: false,
    retrieval_rag_execution_now: false,
    source_fetch_now: false,
    crawler_now: false,
    product_write_now: false,
  };
}

function buildLayoutPrinciples() {
  return {
    layout_is_interface_not_truth: true,
    coordinates_are_display_hints_not_truth: true,
    coordinates_not_source_of_truth: true,
    stable_across_refreshes_required_later: true,
    deterministic_seeded_layout_required_later: true,
    manual_anchors_are_hints_only: true,
    temporal_smoothing_is_display_continuity_only: true,
    source_balance_required: true,
    candidate_overlay_and_durable_graph_distinct: true,
    stale_high_gravity_nodes_marked: true,
    bridge_nodes_visible: true,
    tension_markers_visible: true,
    knowledge_gap_markers_visible: true,
    evidence_rays_are_refs_not_proof: true,
    salience_state_not_authority: true,
    perspective_snapshot_is_derived_view: true,
    agent_substrate_advisory_only: true,
  };
}

function expectedLayoutInputFields() {
  return [
    "layout_scope_ref",
    "perspective_snapshot_ref",
    "durable_perspective_state_ref",
    "candidate_overlay_ref",
    "geometry_digest_ref",
    "source_refs",
    "manual_anchor_refs",
    "salience_state_ref",
    "prior_layout_ref",
    "operator_context_ref",
  ];
}

function expectedLayoutOutputFields() {
  return [
    "layout_id",
    "layout_version",
    "nodes",
    "edges",
    "clusters",
    "markers",
    "evidence_rays",
    "viewport_hints",
    "source_balance_summary",
    "stability_policy",
    "authority_boundary",
    "validation_policy",
  ];
}

function expectedNodeKinds() {
  return [
    "durable_perspective_node",
    "candidate_overlay_node",
    "claim_node",
    "evidence_anchor_node",
    "tension_marker_node",
    "knowledge_gap_marker_node",
    "bridge_node",
    "stale_high_gravity_node",
    "source_reference_node",
    "work_context_node",
  ];
}

function expectedEdgeKinds() {
  return [
    "supports_ref",
    "contradicts_ref",
    "qualifies_ref",
    "derived_from_source",
    "candidate_overlay_link",
    "bridge_hint",
    "tension_line",
    "knowledge_gap_line",
    "reuse_condition_link",
    "work_context_link",
  ];
}

function buildNodeFamilies() {
  return [
    {
      node_kind: "durable_perspective_node",
      durable_state_ref_required: true,
      candidate_only: false,
      source_refs_required: true,
      coordinate_truth_forbidden: true,
      runtime_write_now: false,
    },
    {
      node_kind: "candidate_overlay_node",
      candidate_ref_required: true,
      candidate_only: true,
      durable_state_ref_forbidden: true,
      source_refs_required: true,
      visually_distinct_from_durable: true,
      coordinate_truth_forbidden: true,
      runtime_write_now: false,
    },
    {
      node_kind: "claim_node",
      claim_ref_required: true,
      supporting_or_contradicting_evidence_refs_required: true,
      source_refs_required: true,
      coordinate_truth_forbidden: true,
      runtime_write_now: false,
    },
    {
      node_kind: "evidence_anchor_node",
      evidence_ref_required: true,
      evidence_ref_is_ref_not_raw_body: true,
      proof_write_now: false,
      coordinate_truth_forbidden: true,
      runtime_write_now: false,
    },
    {
      node_kind: "tension_marker_node",
      tension_ref_required: true,
      tension_visible: true,
      resolution_not_implied_by_layout: true,
      coordinate_truth_forbidden: true,
      runtime_write_now: false,
    },
    {
      node_kind: "knowledge_gap_marker_node",
      knowledge_gap_ref_required: true,
      gap_visible: true,
      closure_not_implied_by_layout: true,
      coordinate_truth_forbidden: true,
      runtime_write_now: false,
    },
    {
      node_kind: "bridge_node",
      bridge_reason_required: true,
      source_refs_required: true,
      bridge_is_navigation_hint_not_truth: true,
      coordinate_truth_forbidden: true,
      runtime_write_now: false,
    },
    {
      node_kind: "stale_high_gravity_node",
      stale_reason_required: true,
      manual_gravity_hint_allowed: true,
      stale_marker_visible: true,
      coordinate_truth_forbidden: true,
      runtime_write_now: false,
    },
    {
      node_kind: "source_reference_node",
      source_ref_required: true,
      raw_source_body_forbidden: true,
      coordinate_truth_forbidden: true,
      runtime_write_now: false,
    },
    {
      node_kind: "work_context_node",
      work_ref_required: true,
      work_mutation_now: false,
      coordinate_truth_forbidden: true,
      runtime_write_now: false,
    },
  ];
}

function buildEdgeFamilies() {
  return [
    {
      edge_kind: "supports_ref",
      source_ref_backed: true,
      proof_write_now: false,
      runtime_write_now: false,
    },
    {
      edge_kind: "contradicts_ref",
      source_ref_backed: true,
      contradicted_evidence_preserved: true,
      runtime_write_now: false,
    },
    {
      edge_kind: "qualifies_ref",
      source_ref_backed: true,
      tension_or_gap_visible: true,
      runtime_write_now: false,
    },
    {
      edge_kind: "derived_from_source",
      source_ref_required: true,
      raw_source_body_forbidden: true,
      runtime_write_now: false,
    },
    {
      edge_kind: "candidate_overlay_link",
      candidate_only: true,
      durable_graph_mutation_now: false,
      runtime_write_now: false,
    },
    {
      edge_kind: "bridge_hint",
      bridge_reason_required: true,
      navigation_hint_only: true,
      runtime_write_now: false,
    },
    {
      edge_kind: "tension_line",
      tension_ref_required: true,
      tension_visible: true,
      resolution_not_implied: true,
      runtime_write_now: false,
    },
    {
      edge_kind: "knowledge_gap_line",
      knowledge_gap_ref_required: true,
      gap_visible: true,
      closure_not_implied: true,
      runtime_write_now: false,
    },
    {
      edge_kind: "reuse_condition_link",
      reuse_condition_ref_required: true,
      display_context_only: true,
      runtime_write_now: false,
    },
    {
      edge_kind: "work_context_link",
      work_ref_required: true,
      work_mutation_now: false,
      runtime_write_now: false,
    },
  ];
}

function buildStabilityPolicy() {
  return {
    deterministic_seed_required_later: true,
    stable_across_refreshes_required_later: true,
    temporal_smoothing_allowed_later: true,
    temporal_smoothing_runtime_now: false,
    manual_anchor_hints_allowed_later: true,
    manual_anchor_hints_not_authority: true,
    layout_persistence_now: false,
    coordinate_truth_forbidden: true,
  };
}

function buildSourceBalancePolicy() {
  return {
    source_balance_required: true,
    source_dominance_warning_allowed: true,
    source_dominance_warning_advisory_only: true,
    source_balance_not_truth: true,
    source_balance_not_promotion_authority: true,
  };
}

function buildCandidateOverlayPolicy() {
  return {
    candidate_overlay_allowed_later: true,
    candidate_overlay_is_not_durable_graph: true,
    candidate_overlay_nodes_visually_distinct: true,
    candidate_overlay_edges_visually_distinct: true,
    candidate_overlay_runtime_merge_now: false,
    candidate_overlay_promotion_now: false,
  };
}

function buildSnapshotPolicy() {
  return {
    perspective_snapshot_input_allowed: true,
    perspective_snapshot_is_derived_view: true,
    perspective_snapshot_runtime_now: false,
    snapshot_not_independent_source_of_truth: true,
  };
}

function buildSaliencePolicy() {
  return {
    salience_state_allowed_as_display_context: true,
    salience_state_not_truth: true,
    salience_state_not_promotion_authority: true,
    salience_state_not_evidence_strength: true,
    durable_salience_write_now: false,
  };
}

function buildAuthorityBoundary() {
  return {
    contract_added_now: true,
    implementation_added_now: false,
    browser_validation_added_now: false,
    runtime_layout_implemented_now: false,
    runtime_layout_execution_now: false,
    seeded_layout_runtime_now: false,
    force_directed_layout_runtime_now: false,
    temporal_smoothing_runtime_now: false,
    layout_persistence_now: false,
    layout_coordinate_write_now: false,
    graph_db_implemented_now: false,
    graph_mutation_now: false,
    component_changed_now: false,
    route_changed_now: false,
    browser_request_now: false,
    browser_persistence_now: false,
    durable_perspective_state_read_now: false,
    durable_perspective_state_write_now: false,
    durable_perspective_delta_apply_now: false,
    perspective_snapshot_runtime_implemented_now: false,
    trajectory_runtime_build_implemented_now: false,
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
    layout_coordinate_authority: false,
    manual_anchor_authority: false,
    cluster_position_authority: false,
    product_write_authority: false,
    product_id_allocation_authority: false,
    product_write_lane_parked_by_686: true,
  };
}

function buildValidationPolicy() {
  return {
    layout_is_interface_not_truth: true,
    coordinates_are_display_hints_not_truth: true,
    coordinates_not_source_of_truth: true,
    stable_across_refreshes_required_later: true,
    deterministic_seeded_layout_required_later: true,
    manual_anchors_are_hints_only: true,
    temporal_smoothing_is_display_continuity_only: true,
    source_balance_required: true,
    candidate_overlay_and_durable_graph_distinct: true,
    candidate_overlay_not_durable_graph: true,
    candidate_overlay_promotion_now_false: true,
    stale_high_gravity_nodes_marked: true,
    bridge_nodes_visible: true,
    tension_markers_visible: true,
    knowledge_gap_markers_visible: true,
    evidence_rays_are_refs_not_proof: true,
    all_nodes_have_public_safe_refs: true,
    all_edges_have_public_safe_refs: true,
    raw_coordinates_not_used_as_truth: true,
    source_balance_not_truth: true,
    source_balance_not_promotion_authority: true,
    salience_state_not_authority: true,
    manual_anchor_not_authority: true,
    cluster_position_not_authority: true,
    perspective_snapshot_is_derived_view: true,
    no_runtime_layout_execution: true,
    no_seeded_layout_runtime: true,
    no_force_directed_layout_runtime: true,
    no_temporal_smoothing_runtime: true,
    no_layout_persistence: true,
    no_graph_db: true,
    no_graph_mutation: true,
    no_runtime_state_read_or_write: true,
    no_durable_perspective_delta_apply: true,
    no_perspective_snapshot_runtime: true,
    no_proof_or_evidence_write: true,
    no_accepted_evidence_write: true,
    no_formation_receipt_write: true,
    no_work_mutation: true,
    no_runtime_db_write_or_query: true,
    no_schema_or_migration: true,
    no_route_or_ui: true,
    no_browser_request: true,
    no_provider_openai_call: true,
    no_retrieval_rag_execution: true,
    no_product_write_or_ids: true,
  };
}

function buildPrivacyPolicy() {
  return {
    no_secrets_in_fixture: true,
    no_private_urls: true,
    no_raw_provider_thread_run_session_ids: true,
    no_raw_source_body: true,
    public_safe_layout_refs_only: true,
    public_safe_node_refs_only: true,
    public_safe_edge_refs_only: true,
    public_safe_cluster_refs_only: true,
    public_safe_marker_refs_only: true,
    public_safe_source_refs_only: true,
    public_safe_perspective_refs_only: true,
    public_safe_candidate_refs_only: true,
    public_safe_evidence_refs_only: true,
    public_safe_tension_refs_only: true,
    public_safe_knowledge_gap_refs_only: true,
    public_safe_work_refs_only: true,
  };
}

function buildSamplePreview(authorityBoundary, validationPolicy) {
  const nodes = buildSampleNodes();
  const edges = buildSampleEdges();
  return {
    preview_version: previewVersion,
    operator_context_ref:
      "operator_context:public:project_constellation_runtime_layout_contract",
    layout_input_preview: {
      layout_scope_ref: "layout_scope_ref:public:example_constellation_scope",
      perspective_snapshot_ref:
        "perspective_snapshot_ref:public:future_derived_view",
      durable_perspective_state_ref:
        "perspective_state_ref:public:future_state_preview",
      candidate_overlay_ref:
        "candidate_overlay_ref:public:future_candidate_overlay",
      geometry_digest_ref: "geometry_digest_ref:public:future_digest",
      source_refs: [
        "source_ref:public:durable_perspective_state_trajectory_validation",
        "source_ref:public:project_constellation_runtime_layout_contract",
      ],
      manual_anchor_refs: ["manual_anchor_ref:public:display_hint_only"],
      salience_state_ref: "salience_state_ref:public:display_context_only",
      prior_layout_ref: "layout_ref:public:prior_layout_hint_optional",
      not_executed_now: true,
    },
    layout_preview: {
      layout_id: "layout_ref:public:project_constellation_contract_preview",
      layout_version: layoutVersion,
      nodes,
      edges,
      clusters: [
        {
          cluster_ref: "cluster_ref:public:durable_candidate_boundary",
          cluster_kind: "durable_candidate_boundary_preview",
          node_refs: [
            "node_ref:public:durable_perspective",
            "node_ref:public:candidate_overlay",
          ],
          source_refs: [
            "source_ref:public:project_constellation_runtime_layout_contract",
          ],
          cluster_is_display_grouping_only: true,
          coordinates_not_truth: true,
          runtime_write_now: false,
        },
      ],
      markers: {
        stale_high_gravity_nodes: [
          {
            node_ref: "node_ref:public:stale_high_gravity",
            stale_reason: "public-safe stale gravity display marker",
            marker_visible: true,
            not_authority: true,
          },
        ],
        bridge_nodes: [
          {
            node_ref: "node_ref:public:bridge_navigation_hint",
            bridge_reason: "public-safe bridge navigation hint",
            navigation_hint_only: true,
          },
        ],
        tension_markers: [
          {
            tension_ref: "tension_ref:public:layout_tension_visible",
            visible: true,
            resolution_not_implied_by_layout: true,
          },
        ],
        knowledge_gap_markers: [
          {
            knowledge_gap_ref: "knowledge_gap_ref:public:layout_gap_visible",
            visible: true,
            closure_not_implied_by_layout: true,
          },
        ],
      },
      evidence_rays: [
        {
          evidence_ray_ref: "evidence_ray_ref:public:support_ref_ray",
          from_evidence_node_ref: "node_ref:public:evidence_anchor",
          to_claim_node_ref: "node_ref:public:claim",
          evidence_ref: "accepted_evidence_ref:public:layout_evidence",
          source_refs: [
            "source_ref:public:project_constellation_runtime_layout_contract",
          ],
          evidence_ray_is_ref_not_proof: true,
          proof_write_now: false,
        },
      ],
      viewport_hints: {
        default_center_ref: "node_ref:public:durable_perspective",
        zoom_hint: "overview",
        viewport_hint_only: true,
        not_state: true,
      },
      source_balance_summary: {
        source_ref_count: 2,
        source_balance_required: true,
        source_dominance_warning_advisory_only: true,
        not_truth: true,
      },
      all_nodes_public_safe: true,
      all_edges_public_safe: true,
      all_coordinates_not_truth: true,
      all_runtime_write_now_false: true,
    },
    authority_boundary: previewAuthorityBoundary(authorityBoundary),
    validation_policy: validationPolicy,
  };
}

function buildSampleNodes() {
  const commonSourceRefs = [
    "source_ref:public:project_constellation_runtime_layout_contract",
  ];
  return [
    sampleNode({
      node_ref: "node_ref:public:durable_perspective",
      node_kind: "durable_perspective_node",
      label_summary: "Durable Perspective node preview",
      state_boundary: "durable",
      x: 0.15,
      y: 0.25,
      durable_state_ref: "perspective_state_ref:public:future_state_preview",
      candidate_only: false,
    }),
    sampleNode({
      node_ref: "node_ref:public:candidate_overlay",
      node_kind: "candidate_overlay_node",
      label_summary: "Candidate overlay node preview",
      state_boundary: "candidate",
      x: 0.35,
      y: 0.25,
      candidate_ref: "candidate_ref:public:layout_candidate_overlay",
      candidate_only: true,
      visually_distinct_from_durable: true,
    }),
    sampleNode({
      node_ref: "node_ref:public:claim",
      node_kind: "claim_node",
      label_summary: "Claim node preview",
      state_boundary: "durable",
      x: 0.55,
      y: 0.35,
      claim_ref: "claim_ref:public:layout_claim",
    }),
    sampleNode({
      node_ref: "node_ref:public:evidence_anchor",
      node_kind: "evidence_anchor_node",
      label_summary: "Evidence anchor node preview",
      state_boundary: "durable",
      x: 0.75,
      y: 0.35,
      evidence_ref: "accepted_evidence_ref:public:layout_evidence",
    }),
    sampleNode({
      node_ref: "node_ref:public:tension_marker",
      node_kind: "tension_marker_node",
      label_summary: "Tension marker node preview",
      state_boundary: "marker",
      x: 0.45,
      y: 0.55,
      tension_ref: "tension_ref:public:layout_tension_visible",
    }),
    sampleNode({
      node_ref: "node_ref:public:knowledge_gap_marker",
      node_kind: "knowledge_gap_marker_node",
      label_summary: "Knowledge gap marker node preview",
      state_boundary: "marker",
      x: 0.6,
      y: 0.65,
      knowledge_gap_ref: "knowledge_gap_ref:public:layout_gap_visible",
    }),
    sampleNode({
      node_ref: "node_ref:public:bridge_navigation_hint",
      node_kind: "bridge_node",
      label_summary: "Bridge navigation hint node preview",
      state_boundary: "marker",
      x: 0.3,
      y: 0.7,
      bridge_reason: "public-safe bridge reason",
    }),
    sampleNode({
      node_ref: "node_ref:public:stale_high_gravity",
      node_kind: "stale_high_gravity_node",
      label_summary: "Stale high-gravity node preview",
      state_boundary: "marker",
      x: 0.2,
      y: 0.5,
      stale_reason: "public-safe stale high-gravity reason",
    }),
    sampleNode({
      node_ref: "node_ref:public:source_reference",
      node_kind: "source_reference_node",
      label_summary: "Source reference node preview",
      state_boundary: "source",
      x: 0.85,
      y: 0.2,
      source_ref: commonSourceRefs[0],
    }),
    sampleNode({
      node_ref: "node_ref:public:work_context",
      node_kind: "work_context_node",
      label_summary: "Work context node preview",
      state_boundary: "work_context",
      x: 0.8,
      y: 0.75,
      work_ref: "work_ref:public:layout_context_only",
    }),
  ];
}

function sampleNode({
  node_ref,
  node_kind,
  label_summary,
  state_boundary,
  x,
  y,
  ...extra
}) {
  return {
    node_ref,
    node_kind,
    label_summary,
    source_refs: [
      "source_ref:public:project_constellation_runtime_layout_contract",
    ],
    state_boundary,
    position_hint: {
      coordinate_system: "normalized_preview_2d",
      x,
      y,
      coordinates_are_display_hints_not_truth: true,
      not_source_of_truth: true,
    },
    runtime_write_now: false,
    public_safe: true,
    ...extra,
  };
}

function buildSampleEdges() {
  return [
    sampleEdge("edge_ref:public:supports", "supports_ref", "node_ref:public:evidence_anchor", "node_ref:public:claim"),
    sampleEdge("edge_ref:public:contradicts", "contradicts_ref", "node_ref:public:evidence_anchor", "node_ref:public:tension_marker"),
    sampleEdge("edge_ref:public:qualifies", "qualifies_ref", "node_ref:public:claim", "node_ref:public:knowledge_gap_marker"),
    sampleEdge("edge_ref:public:source_derivation", "derived_from_source", "node_ref:public:source_reference", "node_ref:public:claim"),
    sampleEdge("edge_ref:public:candidate_overlay", "candidate_overlay_link", "node_ref:public:candidate_overlay", "node_ref:public:durable_perspective"),
    sampleEdge("edge_ref:public:bridge_hint", "bridge_hint", "node_ref:public:bridge_navigation_hint", "node_ref:public:durable_perspective"),
    sampleEdge("edge_ref:public:tension_line", "tension_line", "node_ref:public:tension_marker", "node_ref:public:claim"),
    sampleEdge("edge_ref:public:knowledge_gap_line", "knowledge_gap_line", "node_ref:public:knowledge_gap_marker", "node_ref:public:claim"),
    sampleEdge("edge_ref:public:reuse_condition", "reuse_condition_link", "node_ref:public:durable_perspective", "node_ref:public:work_context"),
    sampleEdge("edge_ref:public:work_context", "work_context_link", "node_ref:public:work_context", "node_ref:public:durable_perspective"),
  ];
}

function sampleEdge(edge_ref, edge_kind, from_node_ref, to_node_ref) {
  return {
    edge_ref,
    edge_kind,
    from_node_ref,
    to_node_ref,
    source_refs: [
      "source_ref:public:project_constellation_runtime_layout_contract",
    ],
    relation_summary: `${edge_kind} display relation preview`,
    runtime_write_now: false,
    public_safe: true,
  };
}

function previewAuthorityBoundary(authorityBoundary) {
  const { contract_added_now: _contractAddedNow, ...previewBoundary } =
    authorityBoundary;
  return previewBoundary;
}

function assertRequiredFiles() {
  for (const requiredPath of [typePath, fixturePath, smokePath]) {
    assert.ok(existsSync(requiredPath), `${requiredPath} must exist`);
  }
}

function assertUpstreamValidationUnchanged() {
  assert.deepEqual(
    readJsonFromGit(sourceValidationFixturePath),
    sourceValidationFixture,
    "#735 Durable Perspective State / Trajectory browser validation fixture must not change in contract slice",
  );
}

function assertTypeContract() {
  for (const requiredText of [
    "ProjectConstellationRuntimeLayoutContract",
    contractKind,
    contractVersion,
    "layout_is_interface_not_truth",
    "coordinates_are_display_hints_not_truth",
    "stable_across_refreshes_required_later",
    "deterministic_seeded_layout_required_later",
    "candidate_overlay_node",
    "stale_high_gravity_node",
    "bridge_node",
    "tension_marker_node",
    "knowledge_gap_marker_node",
    "evidence_rays_are_refs_not_proof",
    "runtime_layout_execution_now",
    "seeded_layout_runtime_now",
    "force_directed_layout_runtime_now",
    "layout_coordinate_authority",
    "manual_anchor_authority",
    "cluster_position_authority",
    recommendationStatus,
    nextRecommendedSlice,
    "fnv1a32_canonical_json",
  ]) {
    assert.ok(typeSource.includes(requiredText), `${typePath} must include ${requiredText}`);
  }
}

function assertPackageScript() {
  if (perspectiveGeometryDigestImplementationSliceActive()) {
    assertPerspectiveGeometryDigestImplementationPackageScript();
    return;
  }
  if (perspectiveGeometryDigestContractSliceActive()) {
    assertPerspectiveGeometryDigestContractPackageScript();
    return;
  }
  if (projectConstellationRuntimeLayoutBrowserValidationSliceActive()) {
    assertProjectConstellationRuntimeLayoutBrowserValidationPackageScript();
    return;
  }
  if (projectConstellationRuntimeLayoutImplementationSliceActive()) {
    assertProjectConstellationRuntimeLayoutImplementationPackageScript();
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

function assertStaticBoundary() {
  const changedFiles = readChangedFiles();
  if (perspectiveGeometryDigestImplementationSliceActive()) {
    assertPerspectiveGeometryDigestImplementationChangedFiles(changedFiles);
    return;
  }
  if (perspectiveGeometryDigestContractSliceActive()) {
    assertPerspectiveGeometryDigestContractChangedFiles(changedFiles);
    return;
  }
  if (projectConstellationRuntimeLayoutBrowserValidationSliceActive()) {
    assertProjectConstellationRuntimeLayoutBrowserValidationChangedFiles(
      changedFiles,
    );
    return;
  }
  if (projectConstellationRuntimeLayoutImplementationSliceActive()) {
    assertProjectConstellationRuntimeLayoutImplementationChangedFiles(changedFiles);
    return;
  }
  for (const unchangedPath of protectedUnchangedPaths) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `Project Constellation Runtime Layout contract slice must not change ${unchangedPath}`,
    );
  }
  for (const expectedFile of expectedChangedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedChangedFiles.includes(changedFile),
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
}

function perspectiveGeometryDigestImplementationSliceActive() {
  return readChangedFiles().includes(perspectiveGeometryDigestImplementationSmokePath);
}

function perspectiveGeometryDigestContractSliceActive() {
  return readChangedFiles().includes(perspectiveGeometryDigestSmokePath);
}

function assertPerspectiveGeometryDigestContractPackageScript() {
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
    packageJson.scripts[perspectiveGeometryDigestPackageScriptName],
    perspectiveGeometryDigestPackageScriptValue,
  );
  assert.deepEqual(
    addedScriptNames,
    [perspectiveGeometryDigestPackageScriptName],
    "package.json must add only the Perspective Geometry Digest contract smoke script",
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

function assertPerspectiveGeometryDigestContractChangedFiles(changedFiles) {
  const expectedFiles = [
    perspectiveGeometryDigestTypePath,
    perspectiveGeometryDigestFixturePath,
    perspectiveGeometryDigestSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    smokePath,
    implementationSmokePath,
    browserValidationSmokePath,
    ...perspectiveGeometryDigestImplementationDownstreamSmokePaths,
  ];
  for (const unchangedPath of [
    typePath,
    fixturePath,
    implementationBuilderPath,
    implementationFixturePath,
    browserValidationFixturePath,
    sourceValidationFixturePath,
    "lib/db/schema.sql",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `Perspective Geometry Digest contract slice must not change ${unchangedPath}`,
    );
  }
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      `unexpected changed file in Perspective Geometry Digest contract downstream slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\/research-retrieval\//, "must not add retrieval implementation files");
    assert.doesNotMatch(changedFile, /^lib\/research-rag\//, "must not add RAG implementation files");
    assert.doesNotMatch(changedFile, /^lib\/.*geometry.*digest/i, "must not add runtime geometry digest implementation files");
    assert.doesNotMatch(changedFile, /^lib\/.*layout/i, "must not add runtime layout implementation files");
    assert.doesNotMatch(changedFile, /^lib\/.*constellation/i, "must not add runtime constellation implementation files");
    assert.doesNotMatch(changedFile, /^lib\/.*graph/i, "must not add graph DB or graph mutation files");
    assert.doesNotMatch(changedFile, /^lib\/.*ai.*context/i, "must not add AI context packet files");
    assert.doesNotMatch(changedFile, /^lib\/.*codex.*handoff/i, "must not add Codex handoff files");
    assert.doesNotMatch(changedFile, /^lib\/.*perspective.*state/i, "must not add runtime Perspective state files");
    assert.doesNotMatch(changedFile, /^lib\/.*perspective.*snapshot/i, "must not add runtime PerspectiveSnapshot files");
    assert.doesNotMatch(changedFile, /^lib\/.*trajectory/i, "must not add runtime trajectory builder files");
    assert.doesNotMatch(changedFile, /^lib\/.*promotion/i, "must not add runtime promotion implementation files");
    assert.doesNotMatch(changedFile, /^lib\/.*(proof|evidence).*write/i, "must not add proof/evidence write files");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|openai|source-fetch|crawler)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
  assertPerspectiveGeometryDigestImplementationDownstreamPointer();
}

function assertPerspectiveGeometryDigestImplementationPackageScript() {
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
    packageJson.scripts[perspectiveGeometryDigestImplementationPackageScriptName],
    perspectiveGeometryDigestImplementationPackageScriptValue,
  );
  assert.deepEqual(
    addedScriptNames,
    [perspectiveGeometryDigestImplementationPackageScriptName],
    "package.json must add only the Perspective Geometry Digest implementation smoke script",
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

function assertPerspectiveGeometryDigestImplementationChangedFiles(changedFiles) {
  const expectedFiles = [
    perspectiveGeometryDigestImplementationBuilderPath,
    perspectiveGeometryDigestImplementationFixturePath,
    perspectiveGeometryDigestImplementationSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    perspectiveGeometryDigestSmokePath,
    smokePath,
    ...perspectiveGeometryDigestImplementationDownstreamSmokePaths,
  ];
  const protectedImplementationFiles = [
    ...(typeof perspectiveGeometryDigestTypePath !== "undefined" ? [perspectiveGeometryDigestTypePath] : []),
    ...(typeof perspectiveGeometryDigestFixturePath !== "undefined" ? [perspectiveGeometryDigestFixturePath] : []),
    ...(typeof builderPath !== "undefined" ? [builderPath] : []),
    ...(typeof contractTypePath !== "undefined" ? [contractTypePath] : []),
    ...(typeof contractFixturePath !== "undefined" ? [contractFixturePath] : []),
    ...(typeof implementationFixturePath !== "undefined" ? [implementationFixturePath] : []),
    ...(typeof fixturePath !== "undefined" ? [fixturePath] : []),
    "lib/db/schema.sql",
  ];
  for (const unchangedPath of protectedImplementationFiles) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `Perspective Geometry Digest implementation slice must not change ${unchangedPath}`,
    );
  }
  for (const expectedFile of expectedFiles) {
    assert.ok(
      changedFiles.includes(expectedFile),
      `changed files must include ${expectedFile}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      `unexpected changed file in Perspective Geometry Digest implementation downstream slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\/research-retrieval\//, "must not add retrieval implementation files");
    assert.doesNotMatch(changedFile, /^lib\/research-rag\//, "must not add RAG implementation files");
    if (changedFile !== perspectiveGeometryDigestImplementationBuilderPath) {
      assert.doesNotMatch(changedFile, /^lib\/.*geometry.*digest/i, "must not add runtime geometry digest files outside the deterministic builder");
    }
    assert.doesNotMatch(changedFile, /^lib\/.*ai.*context/i, "must not add AI context packet files");
    assert.doesNotMatch(changedFile, /^lib\/.*codex.*handoff/i, "must not add Codex handoff files");
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
  assertPerspectiveGeometryDigestImplementationDownstreamPointer();
}

function assertPerspectiveGeometryDigestImplementationDownstreamPointer() {
  const digestSmoke = readFileSync(perspectiveGeometryDigestImplementationSmokePath, "utf8");
  for (const requiredText of [
    perspectiveGeometryDigestImplementationVersion,
    perspectiveGeometryDigestImplementationBuilderPath,
    perspectiveGeometryDigestImplementationFixturePath,
    perspectiveGeometryDigestImplementationSmokePath,
    perspectiveGeometryDigestImplementationPackageScriptName,
    perspectiveGeometryDigestImplementationRecommendationStatus,
    perspectiveGeometryDigestImplementationNextRecommendedSlice,
    "deterministic fixture-backed builder/helper for the #739 contract",
    "materializes public-safe Perspective Geometry Digest preview bundles only",
    "invalid_digest_preview_override_rejected",
    "invalid_authority_boundary_override_rejected",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      digestSmoke.includes(requiredText),
      `downstream smoke must allow Perspective Geometry Digest implementation pointer: ${requiredText}`,
    );
  }
}

function assertPerspectiveGeometryDigestContractDownstreamPointer() {
  const digestSmoke = readFileSync(perspectiveGeometryDigestSmokePath, "utf8");
  for (const requiredText of [
    perspectiveGeometryDigestContractVersion,
    perspectiveGeometryDigestTypePath,
    perspectiveGeometryDigestFixturePath,
    perspectiveGeometryDigestSmokePath,
    perspectiveGeometryDigestPackageScriptName,
    perspectiveGeometryDigestRecommendationStatus,
    perspectiveGeometryDigestNextRecommendedSlice,
    "future AI-readable interpretation layer",
    "PerspectiveGeometryDigest is interpretation, not truth",
    "raw coordinates are not enough",
    "recommended retrieval expansion is advisory and does not execute retrieval",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      digestSmoke.includes(requiredText),
      `#736 contract smoke must allow Perspective Geometry Digest contract downstream pointer: ${requiredText}`,
    );
  }
}

function projectConstellationRuntimeLayoutBrowserValidationSliceActive() {
  return readChangedFiles().includes(browserValidationSmokePath);
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
    packageJson.scripts[browserValidationPackageScriptName],
    browserValidationPackageScriptValue,
  );
  assert.deepEqual(
    addedScriptNames,
    [browserValidationPackageScriptName],
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

function assertProjectConstellationRuntimeLayoutBrowserValidationChangedFiles(
  changedFiles,
) {
  const expectedFiles = [
    browserValidationFixturePath,
    browserValidationSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    implementationSmokePath,
    smokePath,
    ...perspectiveGeometryDigestImplementationDownstreamSmokePaths,
  ];
  for (const unchangedPath of [
    implementationBuilderPath,
    implementationFixturePath,
    typePath,
    fixturePath,
    sourceValidationFixturePath,
    "lib/db/schema.sql",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `Project Constellation Runtime Layout browser validation slice must not change ${unchangedPath}`,
    );
  }
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      `unexpected changed file in Project Constellation Runtime Layout browser validation slice: ${changedFile}`,
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
  assertProjectConstellationRuntimeLayoutBrowserValidationDownstreamPointer();
}

function assertProjectConstellationRuntimeLayoutBrowserValidationDownstreamPointer() {
  const browserValidationSmoke = readFileSync(browserValidationSmokePath, "utf8");
  for (const requiredText of [
    browserValidationVersion,
    browserValidationFixturePath,
    browserValidationSmokePath,
    browserValidationPackageScriptName,
    browserValidationRecommendationStatus,
    browserValidationNextRecommendedSlice,
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
      `downstream smoke must allow Project Constellation Runtime Layout browser validation pointer: ${requiredText}`,
    );
  }
}

function projectConstellationRuntimeLayoutImplementationSliceActive() {
  return readChangedFiles().includes(implementationSmokePath);
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
    packageJson.scripts[implementationPackageScriptName],
    implementationPackageScriptValue,
  );
  assert.deepEqual(
    addedScriptNames,
    [implementationPackageScriptName],
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

function assertProjectConstellationRuntimeLayoutImplementationChangedFiles(
  changedFiles,
) {
  const expectedFiles = [
    implementationBuilderPath,
    implementationFixturePath,
    implementationSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    smokePath,
    ...perspectiveGeometryDigestImplementationDownstreamSmokePaths,
  ];
  for (const unchangedPath of [
    typePath,
    fixturePath,
    sourceValidationFixturePath,
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
    assert.ok(
      !changedFiles.includes(unchangedPath),
      "Project Constellation Runtime Layout implementation slice must not change " +
        unchangedPath,
    );
  }
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      "unexpected changed file in Project Constellation Runtime Layout implementation downstream slice: " +
        changedFile,
    );
    assert.ok(!changedFile.startsWith("app/api/"), "must not change app/api routes");
    assert.ok(!changedFile.endsWith("route.ts"), "must not change route handlers");
    assert.ok(!changedFile.startsWith("components/"), "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.ok(!changedFile.startsWith("migrations/"), "must not change migrations");
    assert.ok(!changedFile.startsWith("lib/research-retrieval/"), "must not add retrieval implementation files");
    assert.ok(!changedFile.startsWith("lib/research-rag/"), "must not add RAG implementation files");
    if (changedFile !== implementationBuilderPath) {
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
  const implementationSmoke = readFileSync(implementationSmokePath, "utf8");
  for (const requiredText of [
    implementationVersion,
    implementationBuilderPath,
    implementationFixturePath,
    implementationSmokePath,
    implementationPackageScriptName,
    implementationRecommendationStatus,
    implementationNextRecommendedSlice,
    "deterministic fixture-backed implementation only",
    "validates and materializes #736 Project Constellation layout preview bundle",
    "layout is interface, not truth",
    "coordinates are display hints, not source of truth",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      implementationSmoke.includes(requiredText),
      "#736 contract smoke must allow Project Constellation Runtime Layout implementation downstream pointer: " +
        requiredText,
    );
  }
}

function assertNoForbiddenRuntimePatterns() {
  const changedSourceFiles = readChangedFiles().filter((filePath) =>
    filePath !== typePath &&
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
      { label: "component or UI", regex: /\bReact\b|\bJSX\b|\buseState\b|\buseEffect\b/ },
      { label: "constellation component", regex: /\bConstellation(Canvas|Graph|Layout|View)\b/i },
      { label: "canvas/SVG/WebGL/D3/React Flow", regex: /\b(canvas|CanvasRenderingContext2D|SVGElement|WebGL|d3\\.|ReactFlow)\b/i },
      { label: "browser request", regex: /\bfetch\s*\(|\bXMLHttpRequest\b|navigator\.sendBeacon/ },
      { label: "browser persistence", regex: /\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b|document\.cookie/ },
      { label: "animation runtime", regex: /\brequestAnimationFrame\b/ },
      { label: "layout execution", regex: /\b(run|execute|compute)(Seeded|Force|Constellation|Graph)?Layout\b|\bruntime_layout_execution_now:\s*true\b/i },
      { label: "seeded layout runtime", regex: /\bseededLayout\b|\bdeterministicSeed\b|\bseeded_layout_runtime_now:\s*true\b/i },
      { label: "force-directed layout runtime", regex: /\bforceSimulation\b|\bforceDirected\b|\bforce_directed_layout_runtime_now:\s*true\b/i },
      { label: "temporal smoothing runtime", regex: /\btemporalSmoothing\b|\bsmoothLayout\b|\btemporal_smoothing_runtime_now:\s*true\b/i },
      { label: "layout persistence", regex: /\bpersistLayout\b|\bwriteLayout\b|\blayout_persistence_now:\s*true\b/i },
      { label: "graph mutation", regex: /\bmutateGraph\b|\bwriteGraph\b|\bgraph_mutation_now:\s*true\b/i },
      { label: "DB open", regex: /\bnew\s+Database\b|\bopenDatabase\b|better-sqlite3/i },
      { label: "runtime DB query", regex: /\bdb\.(prepare|query|exec)\b|\bSELECT\b/i },
      { label: "DB write", regex: /\bdb\.(insert|update|delete|transaction)\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b/i },
      { label: "OpenAI import", regex: /from\s+["'][^"']*openai["']/i },
      { label: "OpenAI constructor", regex: /new\s+OpenAI\b/i },
      { label: "provider extraction", regex: /\bproviderExtract\b|\brunProviderExtraction\b/i },
      { label: "retrieval/RAG execution", regex: /\brunRetrieval\b|\brunRag\b|\brunRAG\b|\bexecuteRetrieval\b/i },
      { label: "source fetch", regex: /\bfetchSource\b|\bsourceFetch\b|\bfetch\s*\(/ },
      { label: "crawler execution", regex: /\brunCrawler\b|\bcrawlDomain\b|\bcrawlerSeed\b/i },
      { label: "index build/write", regex: /\bbuildIndex\b|\bwriteIndex\b|\bsourceIndexWrite\b|\bwriteSourceIndex\b/i },
      { label: "embedding/vector/FTS implementation", regex: /\bcreateEmbedding\b|\bgenerateEmbedding\b|\bvectorIndex\b|\bvectorDb\b|\bFTS5\b|\bfullTextSearch\b/i },
      { label: "durable source record write", regex: /\bwriteDurableSourceRecord\b|\binsertDurableSourceRecord\b|\bpersistDurableSourceRecord\b/i },
      { label: "candidate record write", regex: /\bwriteCandidateRecord\b|\binsertCandidateRecord\b|\bpersistCandidateRecord\b/i },
      { label: "candidate mutation", regex: /\bmutateCandidate\b|\bupdateCandidate\b|\bdeleteCandidate\b/ },
      { label: "proof/evidence write", regex: /\b(write|insert|persist)(Proof|Evidence)\b|\bproof_or_evidence_record_write_now:\s*true\b/i },
      { label: "accepted evidence write", regex: /\bwriteAcceptedEvidence\b|\baccepted_evidence_write_now:\s*true\b/i },
      { label: "runtime promotion", regex: /\bpromotePerspective\b|\brunPerspectivePromotion\b|\bruntime_promotion_implemented_now:\s*true\b/i },
      { label: "durable Perspective state write", regex: /\bwriteDurablePerspective\b|\bapplyDurablePerspectiveDelta\b|\bdurable_perspective_state_write_now:\s*true\b/i },
      { label: "durable Perspective state read", regex: /\breadDurablePerspective\b|\bdurable_perspective_state_read_now:\s*true\b/i },
      { label: "PerspectiveSnapshot runtime", regex: /\bcreatePerspectiveSnapshot\b|\bperspective_snapshot_runtime_implemented_now:\s*true\b/i },
      { label: "trajectory runtime build", regex: /\bbuildRuntimeTrajectory\b|\btrajectory_runtime_build_implemented_now:\s*true\b/i },
      { label: "promotion decision record", regex: /\bpromotionDecisionRecord\b|\bwritePromotionDecision\b|\bpromotion_decision_record_write_now:\s*true\b/i },
      { label: "Formation Receipt write", regex: /\bwriteFormationReceipt\b|\bformation_receipt_write_now:\s*true\b/i },
      { label: "work mutation", regex: /\bmutateWork\b|\bupdateWork\b|\bwork_mutation_now:\s*true\b/i },
      { label: "layout coordinate authority true", regex: /\blayout_coordinate_authority:\s*true\b/i },
      { label: "manual anchor authority true", regex: /\bmanual_anchor_authority:\s*true\b/i },
      { label: "cluster position authority true", regex: /\bcluster_position_authority:\s*true\b/i },
      { label: "salience authority true", regex: /\bsalience_authority:\s*true\b|\bsalience_score_used_as_authority_now:\s*true\b/i },
      { label: "Codex product execution", regex: /\bcodex\s+(exec|run)\b/i },
      { label: "GitHub automation", regex: /\bgh\s+pr\b|Octokit|api\.github\.com/i },
      { label: "product write", regex: /\bproductWrite\b|\bwriteProduct\b|\bproduct_write_authority:\s*true\b/i },
      { label: "product ID allocation", regex: /\ballocateProductId\b|\bproduct_id_allocation_authority:\s*true\b/i },
    ]) {
      assert.doesNotMatch(source, regex, `${filePath} must not include ${label}`);
    }
  }
}

function assertContractShape(value) {
  assert.equal(value.contract_kind, contractKind);
  assert.equal(value.contract_version, contractVersion);
  assert.equal(
    value.source_state_trajectory_validation_ref,
    `${sourceValidationFixture.validation_version}:${sourceValidationFixturePath}#735`,
  );
  assert.equal(
    value.source_state_trajectory_validation_fingerprint,
    sourceValidationFixture.validation_fingerprint,
  );
  assert.equal(value.recommendation_status, recommendationStatus);
  assert.equal(value.next_recommended_slice, nextRecommendedSlice);
  assert.equal(value.fingerprint_algorithm, "fnv1a32_canonical_json");
  assert.equal(value.contract_fingerprint, createContractFingerprint(value));
}

function assertContractScope(scope) {
  assert.equal(scope.project_constellation_layout_contract_only, true);
  for (const [key, value] of Object.entries(scope)) {
    if (key === "project_constellation_layout_contract_only") {
      continue;
    }
    assert.equal(value, false, `contract_scope.${key} must be false`);
  }
}

function assertLayoutPrinciples(policy) {
  for (const [key, value] of Object.entries(policy)) {
    assert.equal(value, true, `layout_principles.${key} must be true`);
  }
  assert.equal(policy.layout_is_interface_not_truth, true);
  assert.equal(policy.coordinates_are_display_hints_not_truth, true);
}

function assertLayoutInputFields(fields) {
  assert.deepEqual(fields, expectedLayoutInputFields());
}

function assertLayoutOutputFields(fields) {
  assert.deepEqual(fields, expectedLayoutOutputFields());
}

function assertNodeFamilies(families) {
  assert.deepEqual(families.map((family) => family.node_kind), expectedNodeKinds());
  for (const family of families) {
    assert.equal(family.coordinate_truth_forbidden, true);
    assert.equal(family.runtime_write_now, false);
  }
  assert.equal(
    families.find((family) => family.node_kind === "candidate_overlay_node")
      .candidate_only,
    true,
  );
  assert.equal(
    families.find((family) => family.node_kind === "durable_perspective_node")
      .candidate_only,
    false,
  );
}

function assertEdgeFamilies(families) {
  assert.deepEqual(families.map((family) => family.edge_kind), expectedEdgeKinds());
  for (const family of families) {
    assert.equal(family.runtime_write_now, false);
  }
}

function assertStabilityPolicy(policy) {
  assert.equal(policy.deterministic_seed_required_later, true);
  assert.equal(policy.stable_across_refreshes_required_later, true);
  assert.equal(policy.temporal_smoothing_allowed_later, true);
  assert.equal(policy.temporal_smoothing_runtime_now, false);
  assert.equal(policy.manual_anchor_hints_allowed_later, true);
  assert.equal(policy.manual_anchor_hints_not_authority, true);
  assert.equal(policy.layout_persistence_now, false);
  assert.equal(policy.coordinate_truth_forbidden, true);
}

function assertSourceBalancePolicy(policy) {
  assert.equal(policy.source_balance_required, true);
  assert.equal(policy.source_dominance_warning_allowed, true);
  assert.equal(policy.source_dominance_warning_advisory_only, true);
  assert.equal(policy.source_balance_not_truth, true);
  assert.equal(policy.source_balance_not_promotion_authority, true);
}

function assertCandidateOverlayPolicy(policy) {
  assert.equal(policy.candidate_overlay_allowed_later, true);
  assert.equal(policy.candidate_overlay_is_not_durable_graph, true);
  assert.equal(policy.candidate_overlay_nodes_visually_distinct, true);
  assert.equal(policy.candidate_overlay_edges_visually_distinct, true);
  assert.equal(policy.candidate_overlay_runtime_merge_now, false);
  assert.equal(policy.candidate_overlay_promotion_now, false);
}

function assertSnapshotPolicy(policy) {
  assert.equal(policy.perspective_snapshot_input_allowed, true);
  assert.equal(policy.perspective_snapshot_is_derived_view, true);
  assert.equal(policy.perspective_snapshot_runtime_now, false);
  assert.equal(policy.snapshot_not_independent_source_of_truth, true);
}

function assertSaliencePolicy(policy) {
  assert.equal(policy.salience_state_allowed_as_display_context, true);
  assert.equal(policy.salience_state_not_truth, true);
  assert.equal(policy.salience_state_not_promotion_authority, true);
  assert.equal(policy.salience_state_not_evidence_strength, true);
  assert.equal(policy.durable_salience_write_now, false);
}

function assertSamplePreview(sample) {
  assert.equal(sample.preview_version, previewVersion);
  assert.ok(sample.operator_context_ref.startsWith("operator_context:public:"));
  assert.ok(sample.layout_input_preview.not_executed_now);
  assert.ok(Array.isArray(sample.layout_input_preview.source_refs));
  const layout = sample.layout_preview;
  assert.equal(layout.layout_version, layoutVersion);
  assert.ok(layout.layout_id.startsWith("layout_ref:public:"));
  assert.ok(Array.isArray(layout.nodes));
  assert.ok(Array.isArray(layout.edges));
  assert.ok(Array.isArray(layout.clusters));
  assert.ok(layout.markers);
  assert.ok(Array.isArray(layout.evidence_rays));
  assert.ok(layout.viewport_hints);
  assert.ok(layout.source_balance_summary);
  assert.deepEqual(
    layout.nodes.map((node) => node.node_kind),
    expectedNodeKinds(),
  );
  assert.deepEqual(
    layout.edges.map((edge) => edge.edge_kind),
    expectedEdgeKinds(),
  );
  for (const node of layout.nodes) {
    assert.ok(node.node_ref.startsWith("node_ref:public:"));
    assert.ok(expectedNodeKinds().includes(node.node_kind));
    assert.ok(node.label_summary);
    assert.ok(Array.isArray(node.source_refs) && node.source_refs.length > 0);
    assert.ok(["durable", "candidate", "marker", "source", "work_context"].includes(node.state_boundary));
    assert.equal(node.runtime_write_now, false);
    assert.equal(node.public_safe, true);
    assert.equal(node.position_hint.coordinate_system, "normalized_preview_2d");
    assert.equal(typeof node.position_hint.x, "number");
    assert.equal(typeof node.position_hint.y, "number");
    assert.equal(node.position_hint.coordinates_are_display_hints_not_truth, true);
    assert.equal(node.position_hint.not_source_of_truth, true);
    assert.ok(node.source_refs.every(publicSafeRefIsStable));
  }
  for (const edge of layout.edges) {
    assert.ok(edge.edge_ref.startsWith("edge_ref:public:"));
    assert.ok(expectedEdgeKinds().includes(edge.edge_kind));
    assert.ok(edge.from_node_ref.startsWith("node_ref:public:"));
    assert.ok(edge.to_node_ref.startsWith("node_ref:public:"));
    assert.ok(Array.isArray(edge.source_refs) && edge.source_refs.length > 0);
    assert.equal(edge.runtime_write_now, false);
    assert.equal(edge.public_safe, true);
    assert.ok(edge.source_refs.every(publicSafeRefIsStable));
  }
  const candidateNode = layout.nodes.find(
    (node) => node.node_kind === "candidate_overlay_node",
  );
  assert.equal(candidateNode.candidate_only, true);
  assert.equal(candidateNode.visually_distinct_from_durable, true);
  const durableNode = layout.nodes.find(
    (node) => node.node_kind === "durable_perspective_node",
  );
  assert.equal(durableNode.candidate_only, false);
  assert.equal(layout.clusters[0].cluster_is_display_grouping_only, true);
  assert.equal(layout.clusters[0].coordinates_not_truth, true);
  assert.equal(layout.clusters[0].runtime_write_now, false);
  assert.equal(layout.markers.stale_high_gravity_nodes[0].marker_visible, true);
  assert.equal(layout.markers.stale_high_gravity_nodes[0].not_authority, true);
  assert.equal(layout.markers.bridge_nodes[0].navigation_hint_only, true);
  assert.equal(
    layout.markers.tension_markers[0].resolution_not_implied_by_layout,
    true,
  );
  assert.equal(
    layout.markers.knowledge_gap_markers[0].closure_not_implied_by_layout,
    true,
  );
  assert.equal(layout.evidence_rays[0].evidence_ray_is_ref_not_proof, true);
  assert.equal(layout.evidence_rays[0].proof_write_now, false);
  assert.equal(layout.source_balance_summary.source_balance_required, true);
  assert.equal(
    layout.source_balance_summary.source_dominance_warning_advisory_only,
    true,
  );
  assert.equal(layout.source_balance_summary.not_truth, true);
  assert.equal(layout.all_nodes_public_safe, true);
  assert.equal(layout.all_edges_public_safe, true);
  assert.equal(layout.all_coordinates_not_truth, true);
  assert.equal(layout.all_runtime_write_now_false, true);
  assert.deepEqual(sample.authority_boundary, previewAuthorityBoundary(fixture.authority_boundary));
  assert.deepEqual(sample.validation_policy, fixture.validation_policy);
  assert.equal(Object.hasOwn(sample.authority_boundary, "contract_added_now"), false);
}

function assertAuthorityBoundary(boundary) {
  assert.equal(boundary.contract_added_now, true);
  assert.equal(boundary.product_write_lane_parked_by_686, true);
  for (const [key, value] of Object.entries(boundary)) {
    if (key === "contract_added_now" || key === "product_write_lane_parked_by_686") {
      assert.equal(value, true, `authority_boundary.${key} must be true`);
    } else {
      assert.equal(value, false, `authority_boundary.${key} must be false`);
    }
  }
}

function assertValidationPolicy(policy) {
  for (const [key, value] of Object.entries(policy)) {
    assert.equal(value, true, `validation_policy.${key} must be true`);
  }
}

function assertPrivacyPolicy(policy) {
  for (const [key, value] of Object.entries(policy)) {
    assert.equal(value, true, `privacy_policy.${key} must be true`);
  }
}

function assertDocsPointers() {
  for (const requiredText of [
    "Project Constellation Runtime Layout contract v0.1",
    typePath,
    fixturePath,
    smokePath,
    "contract-only, fixture-only, smoke-only",
    "defines future stable Project Constellation layout grammar",
    "layout is interface, not truth",
    "coordinates are display hints, not source of truth",
    "stable layout across refreshes required later",
    "deterministic seeded 2D layout required later",
    "manual anchors are display hints only",
    "temporal smoothing is display continuity only",
    "source balance required",
    "candidate overlay and durable graph remain distinct",
    "stale high-gravity nodes are marked",
    "bridge nodes are visible",
    "tension markers are visible",
    "knowledge gap markers are visible",
    "evidence rays are refs, not proof/evidence writes",
    "PerspectiveSnapshot remains derived view",
    "salience state is display/reuse context only",
    "salience state is not authority",
    "no runtime layout execution",
    "no seeded layout runtime",
    "no force-directed layout runtime",
    "no temporal smoothing runtime",
    "no layout persistence",
    "no graph DB",
    "no graph mutation",
    "no runtime state read/write",
    "no durable Perspective delta apply",
    "no PerspectiveSnapshot runtime",
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
    "Project Constellation Runtime Layout contract defines future stable layout grammar only.",
    "Agent Substrate remains advisory-only and cannot execute layout, mutate graph/state, promote Perspective, or write evidence/work/product data.",
    "Coordinates are display hints, not source of truth.",
    "PerspectiveSnapshot remains a derived view, not independent source of truth.",
    "Salience/manual anchors/cluster position remain display context only and not authority.",
    "This slice does not implement runtime layout execution, UI, graph DB, graph mutation, state read/write, durable Perspective delta apply, proof/evidence writes, Formation Receipt writes, DB writes, route/UI, provider/OpenAI, retrieval/RAG, or product write.",
    "Next recommended slice is Project Constellation Runtime Layout implementation v0.1.",
  ]) {
    assert.ok(substrateDoc.includes(requiredText), `substrate doc must include ${requiredText}`);
  }
  for (const requiredText of [
    "Project Constellation Runtime Layout remains separated from candidate preview, durable Perspective state, and promotion runtime.",
    "Candidate overlay is not durable graph.",
    "Coordinates are display hints, not truth.",
    "Evidence rays are refs, not proof/evidence records.",
    "Tension and knowledge gap markers remain visible and do not imply resolution or closure.",
    "This slice does not implement runtime DB/browser/provider/source-fetch/retrieval/promotion/state/layout behavior.",
  ]) {
    assert.ok(surfaceDoc.includes(requiredText), `surface doc must include ${requiredText}`);
    assert.ok(gateDoc.includes(requiredText), `gate doc must include ${requiredText}`);
  }
}

function assertSourceValidationDownstreamPointer() {
  for (const requiredText of [
    contractVersion,
    typePath,
    fixturePath,
    smokePath,
    packageScriptName,
    recommendationStatus,
    nextRecommendedSlice,
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

function publicSafeRefIsStable(ref) {
  return typeof ref === "string" && /^[a-z0-9_]+_ref:public:[a-z0-9_]+$/i.test(ref);
}

function createContractFingerprint(value) {
  const normalized = clone(value);
  normalized.contract_fingerprint = "";
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
