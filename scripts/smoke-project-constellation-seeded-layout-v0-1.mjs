import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const contractDocPath = "docs/PROJECT_CONSTELLATION_RUNTIME_LAYOUT_V0_1.md";
const docPath = "docs/PROJECT_CONSTELLATION_SEEDED_LAYOUT_RUNTIME_V0_1.md";
const typePath = "types/project-constellation-runtime-layout-contract.ts";
const seededLayoutPath = "lib/perspective/layout/seeded-layout.ts";
const diagnosticsPath = "lib/perspective/layout/layout-diagnostics.ts";
const fixturePath = "fixtures/project-constellation-seeded-layout.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const runtimeVersion = "seeded_constellation_layout_runtime.v0.1";
const inputVersion = "seeded_constellation_layout_input.v0.1";
const resultVersion = "seeded_constellation_layout_result.v0.1";
const contractVersion = "project_constellation_runtime_layout_contract.v0.1";
const scope = "project:augnes";
const packageScriptName = "smoke:project-constellation-seeded-layout-v0-1";
const packageScriptValue = "node scripts/smoke-project-constellation-seeded-layout-v0-1.mjs";

const requiredDocPhrases = [
  "Product-write remains parked by #686.",
  "Seeded Constellation Layout Runtime is deterministic.",
  "Seeded Constellation Layout Runtime is display-only.",
  "Same input and same seed produce the same output.",
  "Coordinates are display hints.",
  "Coordinates are not truth.",
  "Coordinates are not proof.",
  "Coordinates are not evidence strength.",
  "Coordinates are not promotion readiness.",
  "Candidate overlay is visually distinct from durable graph.",
  "Candidate overlay is not durable graph.",
  "Source balance is advisory.",
  "Stale markers are display warnings only.",
  "Tension markers are review aids only.",
  "Gap markers are review aids only.",
  "Bridge markers are review aids only.",
  "This PR does not add route.",
  "This PR does not add UI.",
  "This PR does not persist layout.",
  "This PR does not write DB.",
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
  "raw seeded layout payload blocked by runtime fixture",
  "secret-like seeded layout input blocked by runtime fixture",
];

const forbiddenPositiveAuthorityGrants = [
  "route_now: true",
  "ui_now: true",
  "graph_rendering_now: true",
  "graph_database_now: true",
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
  "layout_is_truth: true",
  "coordinate_is_truth: true",
  "coordinate_is_proof: true",
  "coordinate_is_evidence_strength: true",
  "coordinate_is_promotion_readiness: true",
  "manual_anchor_is_authority: true",
  "candidate_overlay_is_durable_graph: true",
  "source_balance_is_truth: true",
];

for (const filePath of [
  roadmapPath,
  contractDocPath,
  docPath,
  typePath,
  seededLayoutPath,
  diagnosticsPath,
  fixturePath,
  packagePath,
  indexPath,
]) {
  assert(existsSync(filePath), `${filePath} must exist`);
}

const roadmapText = readText(roadmapPath);
const contractDocText = readText(contractDocPath);
const docText = readText(docPath);
const typeText = readText(typePath);
const seededLayoutText = readText(seededLayoutPath);
const diagnosticsText = readText(diagnosticsPath);
const fixtureText = readText(fixturePath);
const fixture = JSON.parse(fixtureText);
const packageJson = JSON.parse(readText(packagePath));
const indexText = readText(indexPath);

const seededLayoutModule = await import(`../${seededLayoutPath}`);
const diagnosticsModule = await import(`../${diagnosticsPath}`);

assertIncludes(roadmapText, "seeded_constellation_layout_runtime_v0_1", "roadmap contains Phase 5.2 slice");
assertIncludes(contractDocText, "Project Constellation Runtime Layout Contract is contract-only.", "PR #788 layout contract docs exist");
assertIncludes(typeText, "ProjectConstellationRuntimeLayoutContract", "layout contract type exists");

assert.equal(fixture.fixture_version, "project_constellation_seeded_layout.sample.v0.1");
assert.equal(fixture.runtime_version, runtimeVersion);
assert.equal(fixture.input_version, inputVersion);
assert.equal(fixture.result_version, resultVersion);
assert.equal(fixture.contract_version, contractVersion);
assert.equal(fixture.scope, scope);
assert.equal(fixture.as_of, "2026-06-26T00:00:00.000Z");

assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);

assertHelperBehavior();
assertStaticChecks();
assertDocsCoverage();
assertIndexCoverage();
assertFixturePrivacy();

console.log(
  JSON.stringify(
    {
      smoke: "project-constellation-seeded-layout-v0-1",
      final_status: "pass",
      runtime_version: runtimeVersion,
      result_version: resultVersion,
      layout_fingerprint: fixture.expected_result.layout?.layout_fingerprint,
      rejection_cases: Object.keys(fixture.expected_rejection_results).length,
    },
    null,
    2,
  ),
);

function assertHelperBehavior() {
  const result = seededLayoutModule.buildSeededConstellationLayoutV01(
    fixture.expected_valid_input,
  );
  assert.deepEqual(result, fixture.expected_result, "valid seeded layout matches expected_result");
  const repeatResult = seededLayoutModule.buildSeededConstellationLayoutV01(
    fixture.expected_valid_input,
  );
  assert.deepEqual(repeatResult, fixture.expected_repeat_result, "repeat build matches expected_repeat_result");
  assert.equal(
    result.layout.layout_fingerprint,
    repeatResult.layout.layout_fingerprint,
    "same input same seed produces same layout_fingerprint",
  );
  assert.deepEqual(result, repeatResult, "same input same seed produces same output");

  const diagnostics = diagnosticsModule.buildSeededConstellationLayoutDiagnosticsV01(
    result.layout,
    fixture.expected_valid_input,
  );
  assert.deepEqual(diagnostics, result.diagnostics, "standalone diagnostics helper matches runtime diagnostics");

  for (const position of result.layout.node_positions.map((node) => node.position)) {
    assert(Number.isFinite(position.x), "position.x is finite");
    assert(Number.isFinite(position.y), "position.y is finite");
    assert(Number.isFinite(position.z), "position.z is finite");
    for (const reasonCode of [
      "coordinate_not_truth",
      "coordinate_not_proof",
      "coordinate_not_evidence_strength",
      "coordinate_not_promotion_readiness",
    ]) {
      assert(position.reason_codes.includes(reasonCode), `position has ${reasonCode}`);
    }
  }

  const durableNodes = result.layout.node_positions.filter((node) => node.layer === "durable_graph");
  const candidateNodes = result.layout.node_positions.filter((node) => node.layer === "candidate_overlay");
  assert(durableNodes.length > 0, "durable_graph nodes are present");
  assert(candidateNodes.length > 0, "candidate_overlay nodes are present");
  const durableCenter = averagePoint(durableNodes);
  const candidateCenter = averagePoint(candidateNodes);
  assert(
    Math.abs(candidateCenter.x - durableCenter.x) > 100 || Math.abs(candidateCenter.y - durableCenter.y) > 100,
    "candidate overlay nodes are visually distinct from durable graph",
  );
  for (const candidate of candidateNodes) {
    assert(candidate.position.x > 120, "candidate overlay node is offset from durable graph");
  }

  assert(result.diagnostics.some((diagnostic) => diagnostic.diagnostic_kind === "source_balance"), "source balance diagnostic is present");
  assert(
    result.diagnostics
      .find((diagnostic) => diagnostic.diagnostic_kind === "source_balance")
      ?.reason_codes.includes("source_balance_advisory_only"),
    "source balance diagnostic is advisory",
  );
  assert(result.layout.stale_markers.length > 0, "stale marker is present");
  assert(result.layout.tension_markers.length > 0, "tension marker is present");
  assert(result.layout.gap_markers.length > 0, "gap marker is present");
  assert(result.layout.bridge_node_markers.length > 0, "bridge marker is present");

  assertBoundary(result.layout.authority_boundary, "layout");
  for (const node of result.layout.node_positions) assertBoundary(node.authority_boundary, `node ${node.node_ref}`);
  for (const edge of result.layout.edge_routes) assertBoundary(edge.authority_boundary, `edge ${edge.edge_ref}`);
  for (const diagnostic of result.diagnostics) assertBoundary(diagnostic.authority_boundary, `diagnostic ${diagnostic.diagnostic_id}`);

  for (const [key, invalidInput] of Object.entries(fixture.invalid_inputs)) {
    const rejected = seededLayoutModule.buildSeededConstellationLayoutV01(invalidInput);
    assert.deepEqual(rejected, fixture.expected_rejection_results[key], `${key} rejection result matches fixture`);
    assert.notEqual(rejected.status, "built", `${key} is blocked`);
    assert.equal(rejected.layout, null, `${key} does not return a layout`);
    assertNoRawPrivateMarkers(JSON.stringify(rejected), `rejected result ${key}`);
  }
  assert.equal(fixture.expected_rejection_results.private_raw_input.status, "blocked_private_or_raw_payload");
  assert.equal(fixture.expected_rejection_results.empty_nodes.status, "blocked_missing_nodes");
  assert.equal(fixture.expected_rejection_results.unsafe_public_safe_false_node.status, "blocked_invalid_input");
  assert.equal(fixture.expected_rejection_results.non_string_refs.status, "blocked_invalid_input");

  assertNoRawPrivateMarkers(JSON.stringify(result), "valid result");
}

function assertStaticChecks() {
  for (const [text, label] of [
    [seededLayoutText, "seeded-layout helper"],
    [diagnosticsText, "diagnostics helper"],
  ]) {
    assert(!text.includes("fetch("), `${label} must not fetch`);
    assert(!text.includes("node:fs"), `${label} must not import fs`);
    assert(!text.includes("from \"fs\""), `${label} must not import fs`);
    assert(!text.includes("from 'fs'"), `${label} must not import fs`);
    assert(!text.includes("fs.readFile"), `${label} must not read files`);
    assert(!text.includes("fs.writeFile"), `${label} must not write files`);
    assert(!text.includes("Database"), `${label} must not use DB`);
    assert(!text.includes("NextResponse"), `${label} must not use route responses`);
    assert(!text.includes("React"), `${label} must not import React`);
    assert(!text.includes("OpenAI"), `${label} must not call provider/OpenAI`);
    assert(!text.includes("product_write_now: true"), `${label} must not product-write`);
    assert(!text.includes("github_automation_authority: true"), `${label} must not add GitHub automation`);
  }
}

function assertDocsCoverage() {
  for (const phrase of requiredDocPhrases) assertIncludes(docText, phrase, `doc contains ${phrase}`);
  assertNoForbiddenPositiveAuthorityGrants(docText, "doc");
}

function assertIndexCoverage() {
  const indexBlock = extractIndexBlock(indexText, "Project Constellation Seeded Layout Runtime v0.1");
  for (const pointer of [
    docPath,
    seededLayoutPath,
    diagnosticsPath,
    fixturePath,
    "scripts/smoke-project-constellation-seeded-layout-v0-1.mjs",
  ]) {
    assertIncludes(indexBlock, pointer, `index points to ${pointer}`);
  }
  assertIncludes(indexBlock, "deterministic", "index mentions deterministic");
  assertIncludes(indexBlock, "display-only", "index mentions display-only");
  assertIncludes(indexBlock, "coordinates are not truth", "index mentions coordinates are not truth");
  assertIncludes(indexBlock, "Product-write remains parked by #686", "index mentions parked product-write");
  assertNoForbiddenPositiveAuthorityGrants(indexBlock, "index block");
}

function assertFixturePrivacy() {
  assertNoRawPrivateMarkers(fixtureText, "fixture");
}

function assertBoundary(boundary, label) {
  assert.equal(boundary.route_now, false, `${label} route remains false`);
  assert.equal(boundary.ui_now, false, `${label} UI remains false`);
  assert.equal(boundary.layout_persistence_now, false, `${label} layout persistence remains false`);
  assert.equal(boundary.manual_anchor_persistence_now, false, `${label} manual anchor persistence remains false`);
  assert.equal(boundary.db_query_or_write_now, false, `${label} DB query/write remains false`);
  assert.equal(boundary.durable_state_write_now, false, `${label} state write remains false`);
  assert.equal(boundary.durable_state_apply_now, false, `${label} state apply remains false`);
  assert.equal(boundary.proof_or_evidence_record_now, false, `${label} proof/evidence remains false`);
  assert.equal(boundary.claim_or_evidence_write_now, false, `${label} claim/evidence remains false`);
  assert.equal(boundary.product_write_now, false, `${label} product-write remains false`);
  assert.equal(boundary.provider_openai_call_now, false, `${label} provider remains false`);
  assert.equal(boundary.retrieval_execution_now, false, `${label} retrieval remains false`);
  assert.equal(boundary.rag_answer_generation_now, false, `${label} RAG remains false`);
  assert.equal(boundary.source_fetch_now, false, `${label} source fetch remains false`);
  assert.equal(boundary.git_ledger_export_now, false, `${label} Git Ledger remains false`);
  assert.equal(boundary.github_automation_authority, false, `${label} GitHub automation remains false`);
  assert.equal(boundary.coordinate_is_truth, false, `${label} coordinate truth remains false`);
  assert.equal(boundary.coordinate_is_proof, false, `${label} coordinate proof remains false`);
  assert.equal(boundary.coordinate_is_evidence_strength, false, `${label} coordinate evidence strength remains false`);
  assert.equal(boundary.coordinate_is_promotion_readiness, false, `${label} coordinate promotion readiness remains false`);
  assert.equal(boundary.candidate_overlay_is_durable_graph, false, `${label} candidate overlay durable graph remains false`);
  assert.equal(boundary.source_balance_is_truth, false, `${label} source balance truth remains false`);
}

function assertNoRawPrivateMarkers(text, label) {
  let sanitized = text;
  for (const placeholder of allowedFixturePlaceholders) {
    sanitized = sanitized.split(placeholder).join("");
  }
  for (const marker of forbiddenFixtureMarkers) {
    assert(!sanitized.includes(marker), `${label} must not contain ${marker}`);
  }
}

function assertNoForbiddenPositiveAuthorityGrants(text, label) {
  for (const grant of forbiddenPositiveAuthorityGrants) {
    assert(!text.includes(grant), `${label} must not contain ${grant}`);
  }
}

function averagePoint(nodes) {
  return {
    x: nodes.reduce((sum, node) => sum + node.position.x, 0) / nodes.length,
    y: nodes.reduce((sum, node) => sum + node.position.y, 0) / nodes.length,
  };
}

function extractIndexBlock(text, heading) {
  const start = text.indexOf(`- ${heading}:`);
  assert(start >= 0, `index block exists for ${heading}`);
  const after = text.slice(start + 2);
  const next = after.search(/\n- [^\n]+:/);
  return next >= 0 ? after.slice(0, next) : after;
}

function readText(filePath) {
  return readFileSync(filePath, "utf8");
}

function assertIncludes(text, needle, message) {
  assert(text.includes(needle), message);
}
