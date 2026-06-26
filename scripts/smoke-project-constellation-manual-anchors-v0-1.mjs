import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);

const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const uiDocPath = "docs/PROJECT_CONSTELLATION_RUNTIME_UI_V0_1.md";
const docPath = "docs/PROJECT_CONSTELLATION_MANUAL_ANCHORS_V0_1.md";
const storePath = "lib/perspective/layout/manual-anchor-store.ts";
const routePath = "app/api/perspective/layout/manual-anchors/route.ts";
const fixturePath = "fixtures/project-constellation-manual-anchors.sample.v0.1.json";
const schemaPath = "lib/db/schema.sql";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const storeVersion = "project_constellation_manual_anchor_store.v0.1";
const recordVersion = "project_constellation_manual_anchor_record.v0.1";
const activityVersion = "project_constellation_manual_anchor_activity.v0.1";
const scope = "project:augnes";
const packageScriptName = "smoke:project-constellation-manual-anchors-v0-1";
const packageScriptValue = "node scripts/smoke-project-constellation-manual-anchors-v0-1.mjs";

const docsExactPhrases = [
  "Product-write remains parked by #686.",
  "Manual anchors are display hints.",
  "Manual anchors are not authority.",
  "Manual anchors are not truth.",
  "Manual anchors are not proof.",
  "Manual anchors are not evidence strength.",
  "Manual anchors are not promotion readiness.",
  "Manual anchor persistence does not mutate durable Perspective state.",
  "Manual anchor persistence does not apply deltas.",
  "Manual anchor persistence does not write Formation Receipts.",
  "Manual anchor persistence does not promote Perspective.",
  "Manual anchor persistence does not create proof/evidence.",
  "Manual anchor persistence does not product-write.",
  "Explicit operator action is required.",
  "Discarding a manual anchor is lifecycle transition only.",
  "Coordinates remain display hints.",
  "Coordinates are not truth.",
  "Coordinates are not proof.",
  "Coordinates are not evidence strength.",
  "Coordinates are not promotion readiness.",
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
  "raw manual anchor payload",
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
  "raw manual anchor payload blocked by fixture",
  "secret-like manual anchor input blocked by fixture",
];

const forbiddenPositiveAuthorityGrants = [
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
  "manual_anchor_is_authority: true",
  "manual_anchor_is_truth: true",
  "manual_anchor_is_proof: true",
  "manual_anchor_is_evidence_strength: true",
  "manual_anchor_is_promotion_readiness: true",
];

for (const filePath of [
  roadmapPath,
  uiDocPath,
  docPath,
  storePath,
  routePath,
  fixturePath,
  schemaPath,
  packagePath,
  indexPath,
]) {
  assert(existsSync(filePath), `${filePath} must exist`);
}

const roadmapText = readText(roadmapPath);
const uiDocText = readText(uiDocPath);
const docText = readText(docPath);
const storeText = readText(storePath);
const routeText = readText(routePath);
const fixtureText = readText(fixturePath);
const fixture = JSON.parse(fixtureText);
const schemaText = readText(schemaPath);
const packageJson = JSON.parse(readText(packagePath));
const indexText = readText(indexPath);
const store = await import(pathToFileURL(storePath).href);

assertIncludes(roadmapText, "layout_persistence_manual_anchors_v0_1", "roadmap contains Phase 5.4 slice");
assertIncludes(uiDocText, "Constellation Runtime UI is read-only.", "PR #790 UI docs exist");
assert.equal(fixture.fixture_version, "project_constellation_manual_anchors.sample.v0.1");
assert.equal(fixture.store_version, storeVersion);
assert.equal(fixture.record_version, recordVersion);
assert.equal(fixture.activity_version, activityVersion);
assert.equal(fixture.scope, scope);
assert.equal(fixture.as_of, "2026-06-26T00:00:00.000Z");
assertIncludes(schemaText, "project_constellation_manual_anchors", "schema contains anchor table");
assertIncludes(schemaText, "project_constellation_manual_anchor_activity", "schema contains activity table");
assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);

assertHelperBehavior();
assertRouteStaticChecks();
assertDocsCoverage();
assertIndexCoverage();
assertFixturePrivacy();

console.log(
  JSON.stringify(
    {
      smoke: "project-constellation-manual-anchors-v0-1",
      final_status: "pass",
      store_version: storeVersion,
      record_version: recordVersion,
      activity_version: activityVersion,
      rejection_cases: Object.keys(fixture.expected_rejection_results).length,
    },
    null,
    2,
  ),
);

function assertHelperBehavior() {
  const Database = require("better-sqlite3");
  const tempDir = join(tmpdir(), `augnes-manual-anchors-${process.pid}`);
  rmSync(tempDir, { recursive: true, force: true });
  mkdirSync(tempDir, { recursive: true });
  const db = new Database(join(tempDir, "manual-anchors.sqlite"));
  try {
    store.ensureManualAnchorStoreSchemaV01(db);
    assert(store.manualAnchorStoreSchemaExistsV01(db), "manual anchor schema exists");
    const validInput = clone(fixture.valid_create_inputs[0]);
    const created = store.createManualAnchorRecordV01(validInput, db);
    assert.equal(created.status, fixture.expected_create_results.valid_manual_anchor_create.status);
    assert.equal(created.record.anchor_id, validInput.anchor_id);
    assert.equal(created.records.length, 1);
    assert.equal(created.activities.length, 1);
    assertValidResultAuthority(created);
    assertNoRawPrivateMarkers(JSON.stringify(created), "created result");

    const read = store.readManualAnchorRecordV01(validInput.anchor_id, db);
    assert.equal(read.status, fixture.expected_read_results.read_existing.status);
    assert.equal(read.record.anchor_id, validInput.anchor_id);
    assert.equal(read.activities.length, 1);

    const byLayout = store.listManualAnchorRecordsV01({ layout_id: validInput.layout_id }, db);
    const byPerspective = store.listManualAnchorRecordsV01({ perspective_id: validInput.perspective_id }, db);
    const byNode = store.listManualAnchorRecordsV01({ node_ref: validInput.node_ref }, db);
    assert.deepEqual(byLayout.records.map((record) => record.anchor_id), fixture.expected_list_results.by_layout_id.anchor_ids);
    assert.deepEqual(byPerspective.records.map((record) => record.anchor_id), fixture.expected_list_results.by_perspective_id.anchor_ids);
    assert.deepEqual(byNode.records.map((record) => record.anchor_id), fixture.expected_list_results.by_node_ref.anchor_ids);

    const validActivity = store.appendManualAnchorActivityV01(
      {
        activity_id: `${validInput.anchor_id}:activity:read`,
        anchor_id: validInput.anchor_id,
        activity_kind: "manual_anchor_read",
        actor_ref: validInput.created_by_ref,
        summary: "Manual anchor read as display hint.",
        reason_codes: ["manual_anchor_display_hint_only", "manual_anchor_not_authority"],
        created_at: "2026-06-26T00:00:01.000Z",
      },
      db,
    );
    assert.equal(validActivity.status, "stored");
    assert.equal(validActivity.activities.length, 1);

    const activityCountBeforeOrphan = countRows(db, "project_constellation_manual_anchor_activity");
    const orphan = store.appendManualAnchorActivityV01(
      {
        activity_id: "manual-anchor:runtime-ui:missing:activity",
        anchor_id: "manual-anchor:runtime-ui:missing",
        activity_kind: "manual_anchor_read",
        actor_ref: "operator:runtime-ui:001",
        summary: "Missing anchor activity is rejected.",
        reason_codes: ["manual_anchor_display_hint_only"],
        created_at: "2026-06-26T00:00:02.000Z",
      },
      db,
    );
    assert.equal(orphan.status, fixture.expected_rejection_results.orphan_activity.status);
    assert.equal(countRows(db, "project_constellation_manual_anchor_activity"), activityCountBeforeOrphan);

    const duplicate = store.createManualAnchorRecordV01(validInput, db);
    assert.equal(duplicate.status, fixture.expected_rejection_results.duplicate_anchor.status);
    assert.equal(countRows(db, "project_constellation_manual_anchors"), 1);

    const discarded = store.discardManualAnchorRecordV01(
      validInput.anchor_id,
      fixture.expected_discard_results.valid_discard.discard_reason,
      db,
    );
    assert.equal(discarded.status, "discarded");
    assert.equal(discarded.record.discard_reason, fixture.expected_discard_results.valid_discard.discard_reason);
    const readDiscarded = store.readManualAnchorRecordV01(validInput.anchor_id, db);
    assert.equal(readDiscarded.status, "discarded");
    assert(readDiscarded.record.discarded_at, "discarded anchor has discarded_at");
    assert.equal(readDiscarded.record.discard_reason, fixture.expected_discard_results.valid_discard.discard_reason);

    const missing = store.readManualAnchorRecordV01("manual-anchor:runtime-ui:missing", db);
    assert.equal(missing.status, fixture.expected_read_results.read_not_found.status);
  } finally {
    db.close();
  }

  for (const [caseName, expected] of Object.entries(fixture.expected_rejection_results)) {
    if (["read_not_found", "orphan_activity", "duplicate_anchor"].includes(caseName)) continue;
    const caseDb = new Database(join(tempDir, `${caseName}.sqlite`));
    try {
      store.ensureManualAnchorStoreSchemaV01(caseDb);
      const invalidInput = invalidInputForCase(caseName);
      const before = countRows(caseDb, "project_constellation_manual_anchors");
      const result = store.createManualAnchorRecordV01(invalidInput, caseDb);
      assert.equal(result.status, expected.status, `${caseName} status`);
      assert.equal(countRows(caseDb, "project_constellation_manual_anchors"), before, `${caseName} writes no anchor row`);
      assertNoRawPrivateMarkers(JSON.stringify(result), `${caseName} result`);
      assert(result.authority_boundary, `${caseName} includes authority_boundary`);
    } finally {
      caseDb.close();
    }
  }
  rmSync(tempDir, { recursive: true, force: true });

  assert(store.isSafeManualAnchorRouteDbPathV01("tmp/project-constellation-manual-anchors/manual-anchors.sqlite"));
  assert(store.isSafeManualAnchorRouteDbPathV01(".tmp/project-constellation-manual-anchors/manual-anchors.db"));
  for (const unsafePath of [
    "/tmp/project-constellation-manual-anchors/x.sqlite",
    "tmp/project-constellation-manual-anchors/../x.sqlite",
    "tmp/project-constellation-manual-anchors/x.txt",
    "tmp/project-constellation-manual-anchors//x.sqlite",
    "tmp/other/x.sqlite",
    "file://tmp/project-constellation-manual-anchors/x.sqlite",
  ]) {
    assert(!store.isSafeManualAnchorRouteDbPathV01(unsafePath), `${unsafePath} rejected`);
  }
}

function invalidInputForCase(caseName) {
  const input = clone(fixture.valid_create_inputs[0]);
  const patch = fixture.invalid_create_inputs[caseName];
  if (caseName === "non_finite_coordinate") {
    input.anchor_position.x = Number.NaN;
    return input;
  }
  return deepMerge(input, patch);
}

function assertValidResultAuthority(result) {
  assert.equal(result.durable_state_mutated, false);
  assert.equal(result.proof_or_evidence_created, false);
  assert.equal(result.claim_or_evidence_written, false);
  assert.equal(result.product_write_executed, false);
  assert.equal(result.record.persistence_now, true);
  assert.equal(result.record.display_hint_only, true);
  assert.equal(result.record.authority_boundary.manual_anchor_is_authority, false);
  assert.equal(result.record.authority_boundary.manual_anchor_is_truth, false);
  assert.equal(result.record.authority_boundary.manual_anchor_is_proof, false);
  assert.equal(result.record.authority_boundary.manual_anchor_is_evidence_strength, false);
  assert.equal(result.record.authority_boundary.manual_anchor_is_promotion_readiness, false);
}

function assertRouteStaticChecks() {
  assertIncludes(routeText, "export async function GET", "route exports GET");
  assertIncludes(routeText, "export async function POST", "route exports POST");
  assertIncludes(routeText, "requestHasSameOriginBoundary", "POST has same-origin guard");
  assertIncludes(routeText, "await request.json()", "POST parses JSON");
  assertIncludes(routeText, "invalid_json_object", "POST requires JSON object");
  assertIncludes(routeText, "openReadOnlyLocalDb", "GET uses read-only opener");
  assertIncludes(routeText, "readonly: true", "GET read-only opener uses readonly");
  assertIncludes(routeText, "fileMustExist: true", "GET read-only opener requires existing file");
  assertIncludes(routeText, "db_missing", "GET has db_missing response");
  assertIncludes(routeText, "schema_missing", "GET has schema_missing response");
  assertIncludes(routeText, "openWriteLocalDb", "POST uses write DB opener");

  const getText = routeText.slice(routeText.indexOf("export async function GET"), routeText.indexOf("export async function POST"));
  assert(!getText.includes("mkdirSync"), "GET must not mkdir");
  assert(!getText.includes("ensureManualAnchorStoreSchemaV01"), "GET must not ensure schema");

  const postText = routeText.slice(routeText.indexOf("export async function POST"));
  const openIndex = postText.indexOf("openWriteLocalDb");
  for (const marker of ["invalid_action", "invalid_input", "invalid_anchor_id", "invalid_discard_reason"]) {
    assert(postText.indexOf(marker) >= 0 && postText.indexOf(marker) < openIndex, `${marker} checked before write DB open`);
  }
  for (const forbidden of [
    "OpenAI",
    "prompt_sent_now: true",
    "retrieval_execution_now: true",
    "rag_answer_generation_now: true",
    "source fetch",
    "product write behavior",
    "durable state mutation behavior",
    "proof/evidence write behavior",
    "github.",
    "createPullRequest",
  ]) {
    assert(!routeText.includes(forbidden), `route does not contain ${forbidden}`);
  }
  assertNoForbiddenPositiveAuthorityGrants(routeText, "route");
}

function assertDocsCoverage() {
  for (const phrase of docsExactPhrases) assertIncludes(docText, phrase, `doc contains ${phrase}`);
  assertNoForbiddenPositiveAuthorityGrants(docText, "doc");
}

function assertIndexCoverage() {
  const indexBlock = extractIndexBlock(indexText, "Project Constellation Manual Anchors v0.1");
  for (const pointer of [docPath, storePath, routePath, fixturePath, "scripts/smoke-project-constellation-manual-anchors-v0-1.mjs"]) {
    assertIncludes(indexBlock, pointer, `index points to ${pointer}`);
  }
  assertIncludes(indexBlock, "manual anchors are display hints", "index mentions display hints");
  assertIncludes(indexBlock, "explicit operator manual anchors only", "index mentions explicit operator manual anchors only");
  assertIncludes(indexBlock, "Product-write remains parked by #686", "index mentions parked product-write");
  for (const forbiddenPhrase of [
    "UI drag/save was added",
    "route integration into UI was added",
    "durable state mutation was added",
    "proof/evidence writes were added",
    "product-write was added",
  ]) {
    assert(!indexBlock.includes(forbiddenPhrase), `index does not imply ${forbiddenPhrase}`);
  }
  assertNoForbiddenPositiveAuthorityGrants(indexBlock, "index block");
}

function assertFixturePrivacy() {
  assertNoRawPrivateMarkers(fixtureText, "fixture");
}

function countRows(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function deepMerge(base, patch) {
  for (const [key, value] of Object.entries(patch ?? {})) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      base[key] &&
      typeof base[key] === "object" &&
      !Array.isArray(base[key])
    ) {
      deepMerge(base[key], value);
    } else {
      base[key] = value;
    }
  }
  return base;
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
