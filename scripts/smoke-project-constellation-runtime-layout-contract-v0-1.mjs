import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const trajectoryDocPath = "docs/PERSPECTIVE_TRAJECTORY_BUILDER_V0_1.md";
const docPath = "docs/PROJECT_CONSTELLATION_RUNTIME_LAYOUT_V0_1.md";
const typePath = "types/project-constellation-runtime-layout-contract.ts";
const fixturePath = "fixtures/project-constellation-runtime-layout-contract.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const contractVersion = "project_constellation_runtime_layout_contract.v0.1";
const layoutVersion = "project_constellation_layout.v0.1";
const nodeVersion = "project_constellation_layout_node.v0.1";
const edgeVersion = "project_constellation_layout_edge.v0.1";
const anchorVersion = "project_constellation_manual_anchor.v0.1";
const diagnosticVersion = "project_constellation_layout_diagnostic.v0.1";
const bundleVersion = "project_constellation_runtime_layout_bundle.v0.1";
const scope = "project:augnes";
const packageScriptName = "smoke:project-constellation-runtime-layout-contract-v0-1";
const packageScriptValue = "node scripts/smoke-project-constellation-runtime-layout-contract-v0-1.mjs";

const requiredLayers = [
  "durable_graph",
  "candidate_overlay",
  "review_memory",
  "source_ref",
  "feedback",
  "trajectory",
  "unknown",
];

const requiredNodeKinds = [
  "perspective",
  "thesis",
  "claim",
  "evidence_ref",
  "source_ref",
  "tension",
  "knowledge_gap",
  "candidate",
  "review_record",
  "promotion_decision",
  "formation_receipt",
  "apply_event",
  "feedback",
  "bridge",
  "unknown",
];

const requiredEdgeKinds = [
  "supports",
  "contradicts",
  "refines",
  "weakens",
  "reverses",
  "splits",
  "merges",
  "retires",
  "reactivates",
  "preserves_tension",
  "resolves_tension",
  "preserves_gap",
  "closes_gap",
  "selected_by_receipt",
  "omitted_by_receipt",
  "deferred_by_receipt",
  "promoted_by_decision",
  "applied_by_event",
  "feedback_influences",
  "source_lineage",
  "bridge_relation",
  "unknown",
];

const requiredStatuses = [
  "contract_only",
  "layout_candidate",
  "needs_operator_review",
  "blocked_private_or_raw_payload",
  "blocked_missing_state",
  "blocked_forbidden_authority",
  "rejected",
];

const requiredCoordinateAuthorities = [
  "display_hint_only",
  "manual_anchor_hint",
  "temporal_smoothing_hint",
  "stale_layout_hint",
  "unknown",
];

const requiredMarkerKinds = [
  "stale",
  "tension",
  "gap",
  "bridge",
  "source_balance",
  "candidate_overlay",
  "retired",
  "prior_thesis",
  "contradiction",
  "unknown",
];

const requiredDiagnosticKinds = [
  "source_balance",
  "stale_layout",
  "candidate_overlay_separation",
  "durable_candidate_boundary",
  "unresolved_tension_visibility",
  "knowledge_gap_visibility",
  "retired_claim_visibility",
  "prior_thesis_visibility",
  "bridge_node_visibility",
  "authority_boundary",
  "unknown",
];

const requiredReasonCodes = [
  "roadmap_file_present",
  "trajectory_ref_present",
  "trajectory_ref_missing",
  "durable_state_ref_present",
  "durable_state_ref_missing",
  "perspective_id_present",
  "perspective_id_missing",
  "layout_seed_present",
  "layout_seed_missing",
  "node_ref_present",
  "node_ref_missing",
  "edge_ref_present",
  "edge_ref_missing",
  "source_ref_present",
  "source_ref_missing",
  "candidate_ref_present",
  "review_record_ref_present",
  "promotion_decision_ref_present",
  "formation_receipt_ref_present",
  "apply_event_ref_present",
  "feedback_ref_present",
  "prior_thesis_ref_present",
  "retired_claim_ref_present",
  "tension_ref_present",
  "knowledge_gap_ref_present",
  "coordinate_display_hint_only",
  "coordinate_not_truth",
  "coordinate_not_proof",
  "coordinate_not_evidence_strength",
  "coordinate_not_promotion_readiness",
  "manual_anchor_display_hint_only",
  "temporal_smoothing_display_continuity_only",
  "candidate_overlay_not_durable_graph",
  "source_balance_advisory_only",
  "stale_marker_display_warning_only",
  "tension_marker_review_aid_only",
  "gap_marker_review_aid_only",
  "bridge_marker_review_aid_only",
  "layout_runtime_not_implemented",
  "layout_algorithm_not_implemented",
  "layout_persistence_not_implemented",
  "route_not_implemented",
  "ui_not_implemented",
  "db_write_not_executed",
  "durable_state_not_mutated",
  "formation_receipt_not_written",
  "promotion_not_executed",
  "proof_not_created",
  "evidence_not_created",
  "claim_evidence_not_written",
  "product_write_denied",
  "provider_call_not_executed",
  "prompt_not_sent",
  "retrieval_not_executed",
  "rag_answer_not_generated",
  "source_fetch_not_executed",
  "file_read_not_executed",
  "git_ledger_export_not_executed",
  "private_or_raw_payload_blocked",
  "secret_like_pattern_blocked",
  "local_path_blocked",
  "private_url_blocked",
];

const requiredDocPhrases = [
  "Product-write remains parked by #686.",
  "Project Constellation Runtime Layout Contract is contract-only.",
  "Layout is interface.",
  "Coordinates are not truth.",
  "Coordinates are not proof.",
  "Coordinates are not evidence strength.",
  "Coordinates are not promotion readiness.",
  "Manual anchors are display hints.",
  "Manual anchors are not authority.",
  "Temporal smoothing is display continuity.",
  "Temporal smoothing is not durable state.",
  "Candidate overlay is not durable graph.",
  "Source balance is advisory.",
  "Stale markers are display warnings only.",
  "Tension markers are review aids only.",
  "Gap markers are review aids only.",
  "Bridge markers are review aids only.",
  "This PR does not implement layout runtime.",
  "This PR does not implement layout algorithm.",
  "This PR does not persist layout.",
  "This PR does not add route.",
  "This PR does not add UI.",
  "This PR does not mutate durable Perspective state.",
  "This PR does not product-write.",
  "Source refs are lineage pointers, not proof.",
  "Source refs must be public-safe symbolic refs.",
  "roadmap guide is not SSOT",
];

const forbiddenFixtureMarkers = [
  "/Users/",
  "/home/",
  "file://",
  "sk-",
  "ghp_",
  "OPENAI_API_KEY",
  "GITHUB_TOKEN",
  "password:",
  "secret:",
  "private key",
  "raw provider output",
  "raw retrieval output",
  "raw layout payload",
  "raw conversation",
  "hidden reasoning",
  "raw DB row",
  "raw_db_row",
  "browser dump",
  "raw browser dump",
  "raw source body",
  "actual prompt:",
  "provider response:",
  "actual query:",
  "embedding vector:",
  "vector index dump:",
];

const allowedFixturePlaceholders = [
  "raw layout payload blocked by contract fixture",
  "secret-like layout input blocked by contract fixture",
];

const forbiddenPositiveAuthorityGrants = [
  "layout_runtime_now: true",
  "layout_algorithm_now: true",
  "seeded_layout_now: true",
  "layout_persistence_now: true",
  "manual_anchor_persistence_now: true",
  "route_now: true",
  "ui_now: true",
  "graph_rendering_now: true",
  "graph_database_now: true",
  "db_query_or_write_now: true",
  "durable_state_write_now: true",
  "durable_state_apply_now: true",
  "formation_receipt_write_now: true",
  "promotion_execution_now: true",
  "promotion_decision_record_write_now: true",
  "proof_or_evidence_record_now: true",
  "claim_or_evidence_write_now: true",
  "product_write_now: true",
  "product_id_allocation_now: true",
  "provider_openai_call_now: true",
  "prompt_sent_now: true",
  "retrieval_execution_now: true",
  "rag_answer_generation_now: true",
  "git_ledger_export_now: true",
  "github_automation_authority: true",
  "layout_is_truth: true",
  "coordinate_is_truth: true",
  "coordinate_is_proof: true",
  "coordinate_is_evidence_strength: true",
  "coordinate_is_promotion_readiness: true",
  "manual_anchor_is_authority: true",
  "candidate_overlay_is_durable_graph: true",
  "source_balance_is_truth: true",
];

const boundaryFalseFields = [
  "layout_runtime_now",
  "layout_algorithm_now",
  "seeded_layout_now",
  "layout_persistence_now",
  "manual_anchor_persistence_now",
  "route_now",
  "ui_now",
  "graph_rendering_now",
  "graph_database_now",
  "db_query_or_write_now",
  "durable_state_write_now",
  "durable_state_apply_now",
  "formation_receipt_write_now",
  "promotion_execution_now",
  "promotion_decision_record_write_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "product_write_now",
  "product_id_allocation_now",
  "work_mutation_now",
  "source_fetch_now",
  "local_file_read_now",
  "repository_file_read_now",
  "uploaded_file_read_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "retrieval_execution_now",
  "rag_answer_generation_now",
  "embedding_created_now",
  "vector_search_now",
  "git_ledger_export_now",
  "codex_execution_authority",
  "github_automation_authority",
  "layout_is_truth",
  "coordinate_is_truth",
  "coordinate_is_proof",
  "coordinate_is_evidence_strength",
  "coordinate_is_promotion_readiness",
  "manual_anchor_is_authority",
  "temporal_smoothing_is_state",
  "candidate_overlay_is_durable_graph",
  "source_balance_is_truth",
  "product_write_authority",
];

for (const filePath of [
  roadmapPath,
  trajectoryDocPath,
  docPath,
  typePath,
  fixturePath,
  packagePath,
  indexPath,
]) {
  assert(existsSync(filePath), `${filePath} must exist`);
}

const roadmapText = readText(roadmapPath);
const trajectoryDocText = readText(trajectoryDocPath);
const docText = readText(docPath);
const typeText = readText(typePath);
const fixtureText = readText(fixturePath);
const fixture = JSON.parse(fixtureText);
const packageJson = JSON.parse(readText(packagePath));
const indexText = readText(indexPath);
const bundle = fixture.expected_bundle;

assertIncludes(roadmapText, "project_constellation_runtime_layout_contract_v0_1", "roadmap contains Phase 5.1 slice");
assertIncludes(trajectoryDocText, "Perspective Trajectory Builder is read-only.", "PR #787 trajectory docs exist");

assert.equal(fixture.fixture_version, "project_constellation_runtime_layout_contract.sample.v0.1");
assert.equal(fixture.contract_version, contractVersion);
assert.equal(fixture.layout_version, layoutVersion);
assert.equal(fixture.node_version, nodeVersion);
assert.equal(fixture.edge_version, edgeVersion);
assert.equal(fixture.anchor_version, anchorVersion);
assert.equal(fixture.diagnostic_version, diagnosticVersion);
assert.equal(fixture.bundle_version, bundleVersion);
assert.equal(fixture.scope, scope);
assert.equal(fixture.status, "contract_only");
assert.equal(fixture.as_of, "2026-06-26T00:00:00.000Z");
assert.equal(fixture.roadmap_ref, roadmapPath);

assert.equal(bundle.bundle_version, bundleVersion);
assert.equal(bundle.contract_version, contractVersion);
assert.equal(bundle.scope, scope);
assert.equal(bundle.status, "contract_only");
assert(Array.isArray(bundle.layouts) && bundle.layouts.length > 0, "expected_bundle.layouts is non-empty");

assertTypeCoverage();
assertFixtureCoverage();
assertFingerprint();
assertAuthorityBoundaries();
assertDocsCoverage();
assertIndexCoverage();
assertFixturePrivacy();
assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);

console.log(
  JSON.stringify(
    {
      smoke: "project-constellation-runtime-layout-contract-v0-1",
      final_status: "pass",
      contract_version: contractVersion,
      status: bundle.status,
      layouts: bundle.layouts.length,
      bundle_fingerprint: bundle.bundle_fingerprint,
    },
    null,
    2,
  ),
);

function assertTypeCoverage() {
  for (const [name, values] of [
    ["ProjectConstellationLayoutLayer", requiredLayers],
    ["ProjectConstellationNodeKind", requiredNodeKinds],
    ["ProjectConstellationEdgeKind", requiredEdgeKinds],
    ["ProjectConstellationLayoutStatus", requiredStatuses],
    ["ProjectConstellationCoordinateAuthority", requiredCoordinateAuthorities],
    ["ProjectConstellationMarkerKind", requiredMarkerKinds],
    ["ProjectConstellationDiagnosticKind", requiredDiagnosticKinds],
    ["ProjectConstellationReasonCode", requiredReasonCodes],
  ]) {
    assertIncludes(typeText, `export type ${name}`, `${name} is exported`);
    for (const value of values) {
      assertIncludes(typeText, `"${value}"`, `${name} includes ${value}`);
    }
  }
  for (const exportName of [
    "ProjectConstellationRuntimeLayoutContractVersion",
    "ProjectConstellationRuntimeLayoutScope",
    "ProjectConstellationRuntimeLayoutContractStatus",
    "ProjectConstellationLayoutVersion",
    "ProjectConstellationLayoutNodeVersion",
    "ProjectConstellationLayoutEdgeVersion",
    "ProjectConstellationManualAnchorVersion",
    "ProjectConstellationLayoutDiagnosticVersion",
    "ProjectConstellationRuntimeLayoutBundleVersion",
    "ProjectConstellationLayoutPosition",
    "ProjectConstellationLayoutNode",
    "ProjectConstellationLayoutEdge",
    "ProjectConstellationManualAnchor",
    "ProjectConstellationLayoutMarker",
    "ProjectConstellationLayoutDiagnostic",
    "ProjectConstellationRuntimeLayoutContract",
    "ProjectConstellationRuntimeLayoutBundle",
    "ProjectConstellationRuntimeLayoutValidationResult",
  ]) {
    assertIncludes(typeText, exportName, `${exportName} is exported`);
  }
}

function assertFixtureCoverage() {
  assertSetCoverage(new Set(bundle.layouts.map((layout) => layout.status)), requiredStatuses, "layout status");
  assertSetCoverage(new Set(allNodes().map((node) => node.node_kind)), requiredNodeKinds, "node kind");
  assertSetCoverage(new Set(allEdges().map((edge) => edge.edge_kind)), requiredEdgeKinds, "edge kind");
  assertSetCoverage(new Set(allNodes().map((node) => node.layer)), requiredLayers, "layout layer");
  assertSetCoverage(new Set(allPositions().map((position) => position.coordinate_authority)), requiredCoordinateAuthorities, "coordinate authority");
  assertSetCoverage(new Set(allMarkers().map((marker) => marker.marker_kind)), requiredMarkerKinds, "marker kind");
  assertSetCoverage(new Set(allDiagnostics().map((diagnostic) => diagnostic.diagnostic_kind)), requiredDiagnosticKinds, "diagnostic kind");
  assertSetCoverage(new Set(collectReasonCodes(bundle)), requiredReasonCodes, "parsed fixture reason code");

  assert(allNodes().some((node) => node.layer === "durable_graph"), "fixture includes durable_graph node");
  assert(allNodes().some((node) => node.layer === "candidate_overlay"), "fixture includes candidate_overlay node");
  assert(allNodes().some((node) => node.node_kind === "thesis"), "fixture includes prior thesis node");
  assert(allNodes().some((node) => node.node_kind === "claim"), "fixture includes retired claim node");
  assert(allMarkers().some((marker) => marker.marker_kind === "tension"), "fixture includes tension marker");
  assert(allMarkers().some((marker) => marker.marker_kind === "gap"), "fixture includes gap marker");
  assert(allMarkers().some((marker) => marker.marker_kind === "stale"), "fixture includes stale marker");
  assert(allMarkers().some((marker) => marker.marker_kind === "bridge"), "fixture includes bridge marker");
  assert(allDiagnostics().some((diagnostic) => diagnostic.diagnostic_kind === "source_balance"), "fixture includes source_balance diagnostic");

  for (const position of allPositions()) assertPosition(position);
  for (const anchor of allAnchors()) {
    assert.equal(anchor.display_hint_only, true, "manual anchor is display hint only");
    assert.equal(anchor.persistence_now, false, "manual anchor persistence is deferred");
    assert(anchor.reason_codes.includes("manual_anchor_display_hint_only"), "manual anchor reason code present");
  }
  for (const layout of bundle.layouts) {
    assert.equal(layout.temporal_smoothing_state.display_continuity_only, true, "temporal smoothing is display continuity");
    assert.equal(layout.temporal_smoothing_state.persistence_now, false, "temporal smoothing persistence is deferred");
    assert(
      layout.temporal_smoothing_state.reason_codes.includes("temporal_smoothing_display_continuity_only"),
      "temporal smoothing reason code present",
    );
  }
}

function assertFingerprint() {
  const withoutFingerprint = { ...bundle, bundle_fingerprint: "" };
  assert.equal(bundle.bundle_fingerprint, sha256(stableStringify(withoutFingerprint)), "bundle_fingerprint is deterministic");
}

function assertAuthorityBoundaries() {
  for (const layout of bundle.layouts) {
    assertBoundary(layout.authority_boundary, `layout ${layout.layout_id}`);
    for (const node of layout.node_positions) assertBoundary(node.authority_boundary, `node ${node.node_id}`);
    for (const edge of layout.edge_routes) assertBoundary(edge.authority_boundary, `edge ${edge.edge_id}`);
    for (const anchor of layout.manual_anchors) assertBoundary(anchor.authority_boundary, `anchor ${anchor.anchor_id}`);
    for (const diagnostic of layout.source_balance_diagnostics) {
      assertBoundary(diagnostic.authority_boundary, `diagnostic ${diagnostic.diagnostic_id}`);
    }
  }
  assertBoundary(bundle.authority_boundary, "bundle");
}

function assertDocsCoverage() {
  for (const phrase of requiredDocPhrases) assertIncludes(docText, phrase, `doc contains ${phrase}`);
  assertNoForbiddenPositiveAuthorityGrants(docText, "doc");
}

function assertIndexCoverage() {
  const indexBlock = extractIndexBlock(indexText, "Project Constellation Runtime Layout Contract v0.1");
  for (const pointer of [
    docPath,
    typePath,
    fixturePath,
    "scripts/smoke-project-constellation-runtime-layout-contract-v0-1.mjs",
  ]) {
    assertIncludes(indexBlock, pointer, `index block points to ${pointer}`);
  }
  assertIncludes(indexBlock, "contract-only", "index mentions contract-only");
  assertIncludes(indexBlock, "Layout is interface.", "index mentions layout interface");
  assertIncludes(indexBlock, "Coordinates are not truth.", "index mentions coordinates are not truth");
  assertIncludes(indexBlock, "Product-write remains parked by #686", "index mentions parked product write");
  for (const forbiddenText of [
    "layout runtime was added",
    "seeded layout algorithm was added",
    "route or UI was added",
    "layout persistence was added",
    "DB write was added",
    "state mutation was added",
    "proof/evidence writes were added",
    "product-write was added",
  ]) {
    assert(!indexBlock.includes(forbiddenText), `index block must not imply ${forbiddenText}`);
  }
  assertNoForbiddenPositiveAuthorityGrants(indexBlock, "index block");
}

function assertFixturePrivacy() {
  const sanitized = allowedFixturePlaceholders.reduce(
    (text, placeholder) => text.split(placeholder).join(""),
    fixtureText,
  );
  for (const marker of forbiddenFixtureMarkers) {
    assert(!sanitized.includes(marker), `fixture must not contain forbidden marker ${marker}`);
  }
}

function assertBoundary(boundary, label) {
  assert.equal(boundary.contract_only, true, `${label} is contract-only`);
  for (const field of boundaryFalseFields) {
    assert.equal(boundary[field], false, `${label} keeps ${field} false`);
  }
}

function assertPosition(position) {
  for (const reasonCode of [
    "coordinate_display_hint_only",
    "coordinate_not_truth",
    "coordinate_not_proof",
    "coordinate_not_evidence_strength",
    "coordinate_not_promotion_readiness",
  ]) {
    assert(position.reason_codes.includes(reasonCode), `position has ${reasonCode}`);
  }
}

function assertSetCoverage(actualSet, requiredValues, label) {
  for (const value of requiredValues) {
    assert(actualSet.has(value), `${label} coverage includes ${value}`);
  }
}

function collectReasonCodes(value) {
  if (Array.isArray(value)) return value.flatMap(collectReasonCodes);
  if (!value || typeof value !== "object") return [];
  const reasonCodes = Array.isArray(value.reason_codes)
    ? value.reason_codes.filter((item) => typeof item === "string")
    : [];
  return [...reasonCodes, ...Object.values(value).flatMap(collectReasonCodes)];
}

function allNodes() {
  return bundle.layouts.flatMap((layout) => layout.node_positions);
}

function allEdges() {
  return bundle.layouts.flatMap((layout) => layout.edge_routes);
}

function allAnchors() {
  return bundle.layouts.flatMap((layout) => layout.manual_anchors);
}

function allPositions() {
  return [...allNodes().map((node) => node.position), ...allAnchors().map((anchor) => anchor.anchor_position)];
}

function allMarkers() {
  return bundle.layouts.flatMap((layout) => [
    ...layout.stale_markers,
    ...layout.tension_markers,
    ...layout.gap_markers,
    ...layout.bridge_node_markers,
  ]);
}

function allDiagnostics() {
  return bundle.layouts.flatMap((layout) => layout.source_balance_diagnostics);
}

function assertNoForbiddenPositiveAuthorityGrants(text, label) {
  for (const grant of forbiddenPositiveAuthorityGrants) {
    assert(!text.includes(grant), `${label} must not contain ${grant}`);
  }
}

function extractIndexBlock(text, heading) {
  const start = text.indexOf(`- ${heading}:`);
  assert(start >= 0, `index block exists for ${heading}`);
  const after = text.slice(start + 2);
  const next = after.search(/\n- [^\n]+:/);
  return next >= 0 ? after.slice(0, next) : after;
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

function assertIncludes(text, needle, message) {
  assert(text.includes(needle), message);
}

function readText(path) {
  return readFileSync(path, "utf8");
}
