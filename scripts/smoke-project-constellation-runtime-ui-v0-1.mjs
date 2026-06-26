import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const contractDocPath = "docs/PROJECT_CONSTELLATION_RUNTIME_LAYOUT_V0_1.md";
const seededDocPath = "docs/PROJECT_CONSTELLATION_SEEDED_LAYOUT_RUNTIME_V0_1.md";
const docPath = "docs/PROJECT_CONSTELLATION_RUNTIME_UI_V0_1.md";
const viewPath = "components/perspective/constellation-runtime-view.tsx";
const nodePath = "components/perspective/constellation-node.tsx";
const edgePath = "components/perspective/constellation-edge.tsx";
const inspectorPath = "components/perspective/constellation-inspector.tsx";
const togglePath = "components/perspective/candidate-overlay-toggle.tsx";
const fixturePath = "fixtures/project-constellation-runtime-ui.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const uiVersion = "project_constellation_runtime_ui.v0.1";
const runtimeVersion = "seeded_constellation_layout_runtime.v0.1";
const contractVersion = "project_constellation_runtime_layout_contract.v0.1";
const scope = "project:augnes";
const packageScriptName = "smoke:project-constellation-runtime-ui-v0-1";
const packageScriptValue =
  "node scripts/smoke-project-constellation-runtime-ui-v0-1.mjs";
const browserPackageScriptName = "browser:project-constellation-runtime-ui-v0-1";
const browserPackageScriptValue =
  "node scripts/browser-validate-project-constellation-runtime-ui-v0-1.mjs";

const requiredDocPhrases = [
  "Product-write remains parked by #686.",
  "Constellation Runtime UI is read-only.",
  "Constellation Runtime UI is an interface, not source of truth.",
  "Constellation Runtime UI does not mutate durable Perspective state.",
  "Constellation Runtime UI does not persist layout.",
  "Constellation Runtime UI does not persist manual anchors.",
  "Constellation Runtime UI does not add routes.",
  "Constellation Runtime UI does not fetch data.",
  "Constellation Runtime UI does not call providers.",
  "Constellation Runtime UI does not execute retrieval or RAG.",
  "Constellation Runtime UI does not write DB.",
  "Constellation Runtime UI does not create proof/evidence.",
  "Constellation Runtime UI does not product-write.",
  "Coordinates are display hints.",
  "Negative seeded layout coordinates are normalized for display only.",
  "Coordinate normalization does not mutate layout data.",
  "Coordinate normalization does not persist layout.",
  "Coordinate normalization does not make coordinates truth.",
  "Coordinate normalization keeps coordinates as display hints.",
  "Coordinates are not truth.",
  "Coordinates are not proof.",
  "Coordinates are not evidence strength.",
  "Coordinates are not promotion readiness.",
  "Candidate overlay is not durable graph.",
  "Source balance is advisory.",
  "Stale markers are display warnings only.",
  "Tension markers are review aids only.",
  "Gap markers are review aids only.",
  "Bridge markers are review aids only.",
  "Source refs are lineage pointers, not proof.",
  "Source refs must be public-safe symbolic refs.",
  "Missing edge endpoints render bounded warnings rather than crashing or inventing nodes.",
  "Toggle state is local display state only.",
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
  "raw constellation UI payload",
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
  "raw constellation UI payload blocked by fixture",
  "secret-like constellation UI input blocked by fixture",
];

const forbiddenPositiveAuthorityGrants = [
  "route_now: true",
  "ui_route_now: true",
  "layout_persistence_now: true",
  "manual_anchor_persistence_now: true",
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
  "coordinate_is_truth: true",
  "coordinate_is_proof: true",
  "coordinate_is_evidence_strength: true",
  "coordinate_is_promotion_readiness: true",
  "candidate_overlay_is_durable_graph: true",
];

for (const filePath of [
  roadmapPath,
  contractDocPath,
  seededDocPath,
  docPath,
  viewPath,
  nodePath,
  edgePath,
  inspectorPath,
  togglePath,
  fixturePath,
  packagePath,
  indexPath,
]) {
  assert(existsSync(filePath), `${filePath} must exist`);
}

const roadmapText = readText(roadmapPath);
const contractDocText = readText(contractDocPath);
const seededDocText = readText(seededDocPath);
const docText = readText(docPath);
const viewText = readText(viewPath);
const nodeText = readText(nodePath);
const edgeText = readText(edgePath);
const inspectorText = readText(inspectorPath);
const toggleText = readText(togglePath);
const componentTexts = [
  [viewText, viewPath],
  [nodeText, nodePath],
  [edgeText, edgePath],
  [inspectorText, inspectorPath],
  [toggleText, togglePath],
];
const componentBundleText = componentTexts.map(([text]) => text).join("\n");
const fixtureText = readText(fixturePath);
const fixture = JSON.parse(fixtureText);
const packageJson = JSON.parse(readText(packagePath));
const indexText = readText(indexPath);

assertIncludes(roadmapText, "constellation_runtime_ui_v0_1", "roadmap contains Phase 5.3 slice");
assertIncludes(contractDocText, "Project Constellation Runtime Layout Contract is contract-only.", "PR #788 layout contract docs exist");
assertIncludes(seededDocText, "Seeded Constellation Layout Runtime is deterministic.", "PR #789 seeded layout docs exist");

assert.equal(fixture.fixture_version, "project_constellation_runtime_ui.sample.v0.1");
assert.equal(fixture.ui_version, uiVersion);
assert.equal(fixture.runtime_version, runtimeVersion);
assert.equal(fixture.contract_version, contractVersion);
assert.equal(fixture.scope, scope);
assert.equal(fixture.as_of, "2026-06-26T00:00:00.000Z");

assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
assert.equal(packageJson.scripts[browserPackageScriptName], browserPackageScriptValue);

assertComponentStaticChecks();
assertFixtureCoverage();
assertDocsCoverage();
assertIndexCoverage();
assertFixturePrivacy();

console.log(
  JSON.stringify(
    {
      smoke: "project-constellation-runtime-ui-v0-1",
      final_status: "pass",
      ui_version: uiVersion,
      runtime_version: runtimeVersion,
      nodes: fixture.expected_props.layoutResult.layout.node_positions.length,
      diagnostics: fixture.expected_props.layoutResult.diagnostics.length,
      browser_validation_mode: fixture.browser_validation_expectation.validation_mode,
    },
    null,
    2,
  ),
);

function assertComponentStaticChecks() {
  assertIncludes(viewText, "Read-only constellation view", "view has read-only label");
  assertIncludes(viewText, "Coordinates are display hints", "view has coordinate hint label");
  assertIncludes(viewText, "Candidate overlay is not durable graph", "view has candidate overlay boundary label");
  assertIncludes(viewText, "No state mutation", "view has no state mutation label");
  assertIncludes(viewText, "Product-write remains parked", "view has parked product-write label");
  assertIncludes(inspectorText, "Inspector is read-only", "inspector has read-only label");
  assertIncludes(inspectorText, "Source refs are lineage pointers, not proof", "inspector has source lineage label");
  assertIncludes(inspectorText, "Markers are review aids", "inspector has marker review aid label");
  assertIncludes(toggleText, "Show candidate overlay", "toggle has overlay label");
  assertIncludes(toggleText, "Display only", "toggle has display-only label");
  assertIncludes(edgeText, "Missing edge endpoints render bounded warnings rather than crashing or", "edge has missing endpoint warning");
  assertIncludes(viewText, "createConstellationRenderFrameV01", "view has render-frame helper");
  assertIncludes(viewText, "normalizeConstellationNodePositionV01", "view has position normalization helper");
  assertIncludes(viewText, "const minX", "view computes minX");
  assertIncludes(viewText, "const minY", "view computes minY");
  assertIncludes(viewText, "const offsetX", "view computes offsetX");
  assertIncludes(viewText, "const offsetY", "view computes offsetY");
  assertIncludes(viewText, "padding - minX", "view offsets negative or low x coordinates");
  assertIncludes(viewText, "padding - minY", "view offsets negative or low y coordinates");
  assertIncludes(viewText, "frame.offsetX", "view applies x offset");
  assertIncludes(viewText, "frame.offsetY", "view applies y offset");
  assertIncludes(viewText, "...position", "normalization copies original position metadata instead of mutating it");
  assertIncludes(viewText, "normalizedNodePositionsByRef", "view stores normalized render positions separately");
  assertIncludes(viewText, "fromPosition={normalizedNodePositionsByRef.get", "view passes normalized edge fromPosition");
  assertIncludes(viewText, "toPosition={normalizedNodePositionsByRef.get", "view passes normalized edge toPosition");
  assertIncludes(nodeText, "renderPosition", "node accepts renderPosition distinct from persisted node.position");
  assertIncludes(nodeText, "const displayPosition = renderPosition ?? node.position", "node falls back to original position only when no render position is supplied");
  assertIncludes(nodeText, "left: `${displayPosition.x}px`", "node uses display x position");
  assertIncludes(nodeText, "top: `${displayPosition.y}px`", "node uses display y position");
  assert(!nodeText.includes("left: `${node.position.x}px`"), "node must not render raw x position directly");
  assert(!nodeText.includes("top: `${node.position.y}px`"), "node must not render raw y position directly");
  assert(!viewText.includes("fromPosition={fromNode.position}"), "view must not pass raw from node position to edges");
  assert(!viewText.includes("toPosition={toNode.position}"), "view must not pass raw to node position to edges");

  for (const [text, label] of componentTexts) {
    assert(!text.includes("fetch("), `${label} must not fetch`);
    assert(!text.includes("useEffect"), `${label} must not use effects`);
    assert(!text.includes("POST"), `${label} must not POST`);
    assert(!text.includes("action="), `${label} must not use form actions`);
    assert(!text.includes("save button"), `${label} must not expose save button`);
    assert(!text.includes("rollback button"), `${label} must not expose rollback button`);
    assert(!text.includes("promote button"), `${label} must not expose promote button`);
    assert(!text.includes("apply state button"), `${label} must not expose apply state button`);
    assert(!text.includes("create proof/evidence button"), `${label} must not expose proof/evidence button`);
    assert(!text.includes("product write button"), `${label} must not expose product write button`);
    assert(!text.includes("OpenAI"), `${label} must not reference provider/OpenAI`);
    assert(!text.includes("provider"), `${label} must not reference provider calls`);
    assert(!text.includes("router."), `${label} must not call router`);
    assert(!text.includes("/api/"), `${label} must not call routes`);
    assert(!text.includes("localStorage"), `${label} must not persist local storage`);
    assert(!text.includes("sessionStorage"), `${label} must not persist session storage`);
    assert(!text.includes("node:fs"), `${label} must not import fs`);
    assert(!text.includes("from \"fs\""), `${label} must not import fs`);
    assert(!text.includes("from 'fs'"), `${label} must not import fs`);
    assert(!text.includes("Database"), `${label} must not use DB`);
    assert(!text.includes("NextResponse"), `${label} must not use route responses`);
    assertNoForbiddenPositiveAuthorityGrants(text, label);
  }
}

function assertFixtureCoverage() {
  const layout = fixture.expected_props.layoutResult.layout;
  const diagnostics = fixture.expected_props.layoutResult.diagnostics;
  assert(layout.node_positions.some((node) => node.layer === "durable_graph"), "fixture includes durable graph nodes");
  assert(layout.node_positions.some((node) => node.layer === "candidate_overlay"), "fixture includes candidate overlay nodes");
  assert(layout.node_positions.some((node) => node.layer === "source_ref"), "fixture includes source ref nodes");
  assert(layout.node_positions.some((node) => node.layer === "feedback"), "fixture includes feedback nodes");
  assert(layout.node_positions.some((node) => node.layer === "trajectory"), "fixture includes trajectory nodes");
  const negativeCoordinateNodes = layout.node_positions.filter(
    (node) => node.position.x < 0 || node.position.y < 0,
  );
  const negativeCoordinateNodeRefs = new Set(negativeCoordinateNodes.map((node) => node.node_ref));
  assert(negativeCoordinateNodes.some((node) => node.position.x < 0), "fixture includes negative x position");
  assert(negativeCoordinateNodes.some((node) => node.position.y < 0), "fixture includes negative y position");
  assert(
    layout.edge_routes.some(
      (edge) =>
        negativeCoordinateNodeRefs.has(edge.from_node_ref) ||
        negativeCoordinateNodeRefs.has(edge.to_node_ref),
    ),
    "fixture includes an edge connected to a negative-coordinate node",
  );
  assert(layout.stale_markers.length > 0, "fixture includes stale markers");
  assert(layout.tension_markers.length > 0, "fixture includes tension markers");
  assert(layout.gap_markers.length > 0, "fixture includes gap markers");
  assert(layout.bridge_node_markers.length > 0, "fixture includes bridge markers");
  assert(layout.source_balance_diagnostics.some((diagnostic) => diagnostic.diagnostic_kind === "source_balance"), "fixture includes source balance diagnostics");
  assert(diagnostics.some((diagnostic) => diagnostic.diagnostic_kind === "candidate_overlay_separation"), "fixture includes candidate overlay diagnostics");
  assert(fixture.expected_render_summary.missing_endpoint_edge_warning_example, "fixture includes missing endpoint warning example");
  assert.equal(fixture.expected_render_summary.missing_endpoint_behavior, "bounded warning only; no invented node");
  assertIncludes(JSON.stringify(fixture.expected_render_summary), "route_now false", "fixture includes authority boundary display example");
  assertIncludes(JSON.stringify(fixture.expected_render_summary), "overlay nodes are hidden locally without persistence", "fixture covers overlay off display");
  assertIncludes(
    JSON.stringify(fixture.expected_render_summary),
    "negative seeded layout coordinates are normalized for display only",
    "fixture covers negative-coordinate display normalization",
  );
  for (const label of fixture.expected_static_labels) {
    assertIncludes(componentBundleText, label, `expected static label exists: ${label}`);
  }
  for (const forbiddenControl of fixture.expected_forbidden_controls_absent) {
    assert(!componentBundleText.includes(forbiddenControl), `forbidden control absent: ${forbiddenControl}`);
  }
}

function assertDocsCoverage() {
  for (const phrase of requiredDocPhrases) assertIncludes(docText, phrase, `doc contains ${phrase}`);
  assertNoForbiddenPositiveAuthorityGrants(docText, "doc");
}

function assertIndexCoverage() {
  const indexBlock = extractIndexBlock(indexText, "Project Constellation Runtime UI v0.1");
  for (const pointer of [
    docPath,
    viewPath,
    nodePath,
    edgePath,
    inspectorPath,
    togglePath,
    fixturePath,
    "scripts/smoke-project-constellation-runtime-ui-v0-1.mjs",
    "scripts/browser-validate-project-constellation-runtime-ui-v0-1.mjs",
  ]) {
    assertIncludes(indexBlock, pointer, `index points to ${pointer}`);
  }
  assertIncludes(indexBlock, "read-only UI", "index mentions read-only UI");
  assertIncludes(indexBlock, "no state mutation", "index mentions no state mutation");
  assertIncludes(indexBlock, "coordinates are display hints", "index mentions coordinate display hints");
  assertIncludes(indexBlock, "Product-write remains parked by #686", "index mentions parked product-write");
  for (const forbiddenPhrase of [
    "route was added",
    "fetch was added",
    "layout persistence was added",
    "DB write was added",
    "state mutation was added",
    "product-write was added",
  ]) {
    assert(!indexBlock.includes(forbiddenPhrase), `index does not imply ${forbiddenPhrase}`);
  }
  assertNoForbiddenPositiveAuthorityGrants(indexBlock, "index block");
}

function assertFixturePrivacy() {
  assertNoRawPrivateMarkers(fixtureText, "fixture");
}

function assertIncludes(text, expected, message) {
  assert(text.includes(expected), message);
}

function readText(filePath) {
  return readFileSync(filePath, "utf8");
}

function assertNoRawPrivateMarkers(text, label) {
  let sanitized = text;
  for (const allowed of allowedFixturePlaceholders) {
    sanitized = sanitized.split(allowed).join("");
  }
  for (const marker of forbiddenFixtureMarkers) {
    assert(!sanitized.includes(marker), `${label} must not contain ${marker}`);
  }
}

function assertNoForbiddenPositiveAuthorityGrants(text, label) {
  for (const marker of forbiddenPositiveAuthorityGrants) {
    assert(!text.includes(marker), `${label} must not include ${marker}`);
  }
}

function extractIndexBlock(text, heading) {
  const start = text.indexOf(`- ${heading}:`);
  assert(start >= 0, `index contains ${heading}`);
  const next = text.indexOf("\n- ", start + 1);
  return next >= 0 ? text.slice(start, next) : text.slice(start);
}
