import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");

const docsPath = "docs/PROJECT_CONSTELLATION_MANUAL_ANCHORS_RUNTIME_COMPLETION_V0_1.md";
const oldDocsPath = "docs/PROJECT_CONSTELLATION_MANUAL_ANCHORS_V0_1.md";
const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const storePath = "lib/perspective/layout/manual-anchor-store.ts";
const routePath = "app/api/perspective/layout/manual-anchors/route.ts";
const fixturePath = "fixtures/project-constellation-manual-anchors-runtime-completion.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const runtimeUiCompletionDocPath = "docs/PROJECT_CONSTELLATION_RUNTIME_UI_COMPLETION_V0_1.md";
const runtimeUiCompletionComponentPath = "components/perspective/constellation-runtime-data-panel.tsx";

const packageScriptName = "smoke:project-constellation-manual-anchors-runtime-completion-v0-1";
const scope = "project:augnes";
const fixtureVersion = "project_constellation_manual_anchors_runtime_completion.sample.v0.1";
const storeVersion = "project_constellation_manual_anchor_store.v0.1";
const routeVersion = "project_constellation_manual_anchor_route.v0.1";
const packageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-project-constellation-manual-anchors-runtime-completion-v0-1.mjs";

const requiredExports = [
  "ensureProjectConstellationManualAnchorSchemaV01",
  "projectConstellationManualAnchorSchemaExistsV01",
  "createOrUpdateProjectConstellationManualAnchorV01",
  "readProjectConstellationManualAnchorV01",
  "listProjectConstellationManualAnchorsV01",
  "discardProjectConstellationManualAnchorV01",
  "createProjectConstellationManualAnchorAuthorityBoundaryV01",
  "isSafeProjectConstellationManualAnchorDbPathV01",
  "ensureManualAnchorStoreSchemaV01",
  "manualAnchorStoreSchemaExistsV01",
  "createManualAnchorRecordV01",
  "discardManualAnchorRecordV01",
];

const docsRequiredPhrases = [
  "This slice implements `layout_persistence_manual_anchors_runtime_completion_v0_1`",
  "This slice closes the original Phase 5.4 manual anchor persistence gap",
  "Manual anchors are display hints only.",
  "Layout coordinates are not truth.",
  "Manual anchors are not truth.",
  "Manual anchors are not promotion readiness.",
  "Manual anchors are not evidence strength.",
  "Manual anchors are not source authority.",
  "This slice may write only manual anchor records and lifecycle/discard metadata.",
  "This slice does not create proof/evidence.",
  "This slice does not write claim/evidence records.",
  "This slice does not create work items.",
  "This slice does not promote Perspective.",
  "This slice does not write/apply durable Perspective state.",
  "This slice does not write Formation Receipts.",
  "This slice does not call providers.",
  "This slice does not send prompts.",
  "This slice does not fetch sources.",
  "This slice does not execute retrieval/RAG.",
  "This slice does not write retrieval indexes.",
  "This slice does not generate RAG answers.",
  "This slice does not execute Git/GitHub.",
  "This slice does not execute Codex.",
  "This slice does not product-write.",
  "This slice does not allocate product IDs.",
  "Product-write remains parked by #686.",
  "Smoke/CI pass is not truth.",
  "The roadmap guide is not SSOT.",
];

const forbiddenControlOrRuntimeMarkers = [
  "provider_openai_call_now: true",
  "prompt_sent_now: true",
  "source_fetch_now: true",
  "retrieval_execution_now: true",
  "retrieval_index_write_now: true",
  "rag_answer_generation_now: true",
  "proof_or_evidence_record_now: true",
  "claim_or_evidence_write_now: true",
  "promotion_execution_now: true",
  "durable_state_apply_now: true",
  "formation_receipt_write_now: true",
  "product_write_now: true",
  "product_id_allocation_now: true",
  "github_api_call_now: true",
  "codex_execution_now: true",
];

const safeMarkers = [
  "SAFE_MARKER_PRIVATE_URL",
  "SAFE_MARKER_LOCAL_PRIVATE_PATH",
  "SAFE_MARKER_SECRET_TOKEN",
  "SAFE_MARKER_RAW_SOURCE_BODY",
  "SAFE_MARKER_RAW_PROVIDER_OUTPUT",
  "SAFE_MARKER_RAW_RETRIEVAL_OUTPUT",
  "SAFE_MARKER_PROVIDER_THREAD_ID",
  "SAFE_MARKER_RAW_CONVERSATION",
  "SAFE_MARKER_HIDDEN_REASONING",
  "SAFE_MARKER_RAW_DB_ROW",
  "SAFE_MARKER_RAW_DIFF",
  "SAFE_MARKER_TELEMETRY_DUMP",
];

const liveLookingPrivateMarkers = [
  "/Users/",
  "/home/",
  "file://",
  "sk-",
  "ghp_",
  "OPENAI_API_KEY",
  "GITHUB_TOKEN",
  "raw source body",
  "raw provider output",
  "raw retrieval output",
  "raw DB row",
  "hidden reasoning",
  "actual prompt:",
  "provider response:",
];

for (const filePath of [
  docsPath,
  oldDocsPath,
  roadmapPath,
  storePath,
  routePath,
  fixturePath,
  packagePath,
  indexPath,
  runtimeUiCompletionDocPath,
  runtimeUiCompletionComponentPath,
]) {
  assert(existsSync(filePath), `${filePath} must exist`);
}

const docsText = readText(docsPath);
const oldDocsText = readText(oldDocsPath);
const roadmapText = readText(roadmapPath);
const storeText = readText(storePath);
const routeText = readText(routePath);
const fixtureText = readText(fixturePath);
const fixture = JSON.parse(fixtureText);
const packageJson = JSON.parse(readText(packagePath));
const indexText = readText(indexPath);
const store = await import(pathToFileURL(storePath).href);
const route = await import(pathToFileURL(routePath).href);

assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
assertIncludes(roadmapText, "layout_persistence_manual_anchors_v0_1", "roadmap contains Phase 5.4 slice");
assertIncludes(roadmapText, "anchor_position", "roadmap contains manual anchor persistence requirement");
assertIncludes(roadmapText, "applies_to_layout_scope", "roadmap contains layout-scope persistence requirement");
assertIncludes(roadmapText, "truth score", "roadmap contains forbidden truth score wording");
assertIncludes(oldDocsText, "Manual anchors are display hints.", "earlier manual anchor docs exist");
assertIncludes(docsText, "earlier implementation was partial", "docs mention earlier partial/manual-anchor implementation");
for (const phrase of docsRequiredPhrases) assertIncludes(docsText, phrase, `docs contain ${phrase}`);
for (const marker of forbiddenControlOrRuntimeMarkers) {
  assert(!docsText.includes(marker), `docs do not grant ${marker}`);
  assert(!storeText.includes(marker), `store does not grant ${marker}`);
  assert(!routeText.includes(marker), `route does not grant ${marker}`);
}

assert.equal(fixture.fixture_version, fixtureVersion);
assert.equal(fixture.store_version, storeVersion);
assert.equal(fixture.route_version, routeVersion);
assert.equal(fixture.scope, scope);
for (const key of [
  "safe_db_path_examples",
  "unsafe_db_path_examples",
  "safe_anchor_upsert_request_example",
  "safe_anchor_upsert_result_example",
  "safe_anchor_list_result_example",
  "safe_anchor_discard_request_example",
  "safe_anchor_discard_result_example",
  "idempotent_upsert_example",
  "update_anchor_position_example",
  "blocked_truth_score_example",
  "blocked_promotion_readiness_example",
  "blocked_evidence_strength_example",
  "blocked_source_authority_example",
  "blocked_private_or_raw_payload_example",
  "blocked_forbidden_authority_example",
  "invalid_db_path_example",
  "invalid_anchor_position_example",
  "authority_boundary_sample",
]) {
  assert(Object.hasOwn(fixture, key), `fixture includes ${key}`);
}
for (const path of fixture.safe_db_path_examples) {
  assert(store.isSafeProjectConstellationManualAnchorDbPathV01(path), `${path} accepted`);
}
for (const path of fixture.unsafe_db_path_examples) {
  assert(!store.isSafeProjectConstellationManualAnchorDbPathV01(path), `${path} rejected`);
}
assertAuthorityBoundary(fixture.authority_boundary_sample, { read: true, write: true, route: true });
assertSafeMarkersOnlyInsideBlockedExamples(fixture);
assertNoLiveLookingPrivateMarkers(fixtureText, "fixture");

for (const exportName of requiredExports) {
  assert.equal(typeof store[exportName], "function", `${exportName} export exists`);
}
assert.equal(typeof route.GET, "function", "route exports GET");
assert.equal(typeof route.POST, "function", "route exports POST");
assertIncludes(routeText, "upsert_anchor", "route supports upsert_anchor");
assertIncludes(routeText, "discard_anchor", "route supports discard_anchor");
assertIncludes(routeText, "requestHasSameOriginBoundary", "route has same-origin guard");
assertIncludes(routeText, "readonly: true", "GET opens readonly DB");

await assertStoreRuntimeBehavior();
await assertRouteRuntimeBehavior();
assertIndexCoverage();
assertNoForbiddenFilesAdded();
runExistingSmoke("smoke:project-constellation-manual-anchors-v0-1");
runExistingSmoke("smoke:project-constellation-runtime-ui-completion-v0-1");

console.log(
  JSON.stringify(
    {
      smoke: "project-constellation-manual-anchors-runtime-completion-v0-1",
      final_status: "pass",
      slice: "layout_persistence_manual_anchors_runtime_completion_v0_1",
      store_version: storeVersion,
      route_version: routeVersion,
    },
    null,
    2,
  ),
);

async function assertStoreRuntimeBehavior() {
  const dbPath = `.tmp/project-constellation-manual-anchors/runtime-completion-smoke/store-${process.pid}.sqlite`;
  rmSync(dirname(dbPath), { recursive: true, force: true });
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  try {
    store.ensureProjectConstellationManualAnchorSchemaV01(db);
    assert(store.projectConstellationManualAnchorSchemaExistsV01(db), "schema exists after ensure");

    const input = clone(fixture.safe_anchor_upsert_request_example.input);
    const created = store.createOrUpdateProjectConstellationManualAnchorV01(input, db);
    assert.equal(created.status, "stored");
    assert.equal(countRows(db, "project_constellation_manual_anchors"), 1);
    assert.equal(countRows(db, "project_constellation_manual_anchor_activity"), 1);
    assert.equal(created.record.anchor_id, input.anchor_id);
    assert.equal(created.record.display_hint_only, true);
    assert.equal(created.record.authority_boundary.coordinate_is_truth, false);
    assertAuthorityBoundary(created.authority_boundary, { write: true });

    const listed = store.listProjectConstellationManualAnchorsV01(
      {
        perspective_id: input.perspective_id,
        applies_to_layout_scope: input.applies_to_layout_scope,
        limit: 10,
      },
      db,
    );
    assert.equal(listed.status, "stored");
    assert.deepEqual(listed.records.map((record) => record.anchor_id), [input.anchor_id]);
    assertAuthorityBoundary(listed.authority_boundary, { read: true });

    const read = store.readProjectConstellationManualAnchorV01(input.anchor_id, db);
    assert.equal(read.status, "stored");
    assert.equal(read.activities.length, 1);
    assertAuthorityBoundary(read.authority_boundary, { read: true });

    const activityRowsBeforeIdempotent = countRows(db, "project_constellation_manual_anchor_activity");
    const idempotent = store.createOrUpdateProjectConstellationManualAnchorV01(input, db);
    assert.equal(idempotent.status, "stored");
    assert(idempotent.reason_codes.includes("manual_anchor_upsert_idempotent"));
    assert.equal(countRows(db, "project_constellation_manual_anchors"), 1);
    assert.equal(countRows(db, "project_constellation_manual_anchor_activity"), activityRowsBeforeIdempotent);

    const updatedInput = clone(input);
    updatedInput.anchor_position.x = fixture.update_anchor_position_example.anchor_position.x;
    updatedInput.anchor_position.y = fixture.update_anchor_position_example.anchor_position.y;
    updatedInput.anchor_reason = fixture.update_anchor_position_example.anchor_reason;
    updatedInput.updated_at = "2026-06-28T00:01:00.000Z";
    const updated = store.createOrUpdateProjectConstellationManualAnchorV01(updatedInput, db);
    assert.equal(updated.status, "stored");
    assert(updated.reason_codes.includes("manual_anchor_updated"));
    assert.equal(updated.record.anchor_position.x, fixture.update_anchor_position_example.anchor_position.x);
    assert.equal(countRows(db, "project_constellation_manual_anchors"), 1);
    assert.equal(countRows(db, "project_constellation_manual_anchor_activity"), activityRowsBeforeIdempotent + 1);

    const discarded = store.discardProjectConstellationManualAnchorV01(
      input.anchor_id,
      fixture.safe_anchor_discard_request_example.input.reason,
      db,
    );
    assert.equal(discarded.status, "discarded");
    assert.equal(discarded.record.discard_reason, fixture.safe_anchor_discard_request_example.input.reason);
    assert.equal(countRows(db, "project_constellation_manual_anchors"), 1);
    assertAuthorityBoundary(discarded.authority_boundary, { write: true });

    const excludedDiscarded = store.listProjectConstellationManualAnchorsV01({ perspective_id: input.perspective_id }, db);
    assert.equal(excludedDiscarded.records.length, 0);
    const includedDiscarded = store.listProjectConstellationManualAnchorsV01(
      { perspective_id: input.perspective_id, include_discarded: true },
      db,
    );
    assert.equal(includedDiscarded.records.length, 1);

    const invalidPosition = clone(input);
    invalidPosition.anchor_id = "manual-anchor:runtime-completion:invalid-position";
    invalidPosition.anchor_position = fixture.invalid_anchor_position_example.anchor_position;
    assertBlockedWithoutWrites(
      db,
      () => store.createOrUpdateProjectConstellationManualAnchorV01(invalidPosition, db),
      fixture.invalid_anchor_position_example.expected_status,
      "invalid anchor position",
    );

    for (const [label, patch, expectedStatus] of [
      ["truth_score", fixture.blocked_truth_score_example, "blocked_forbidden_authority"],
      ["promotion_readiness", fixture.blocked_promotion_readiness_example, "blocked_forbidden_authority"],
      ["evidence_strength", fixture.blocked_evidence_strength_example, "blocked_forbidden_authority"],
      ["source_authority", fixture.blocked_source_authority_example, "blocked_forbidden_authority"],
      ["private_raw", fixture.blocked_private_or_raw_payload_example, "blocked_private_or_raw_payload"],
      ["forbidden_authority", fixture.blocked_forbidden_authority_example, "blocked_forbidden_authority"],
    ]) {
      const blockedInput = deepMerge(clone(input), patch);
      blockedInput.anchor_id = `manual-anchor:runtime-completion:blocked:${label}`;
      assertBlockedWithoutWrites(
        db,
        () => store.createOrUpdateProjectConstellationManualAnchorV01(blockedInput, db),
        expectedStatus,
        label,
      );
    }
  } finally {
    db.close();
  }
}

async function assertRouteRuntimeBehavior() {
  const dir = `.tmp/project-constellation-manual-anchors/runtime-completion-smoke/route-${process.pid}`;
  const missingDbPath = `${dir}/missing.sqlite`;
  const dbPath = `${dir}/manual-anchors.sqlite`;
  rmSync(dir, { recursive: true, force: true });

  let response = await route.GET(new Request(`http://localhost/api/perspective/layout/manual-anchors?db_path=${encodeURIComponent(missingDbPath)}`));
  let body = await response.json();
  assert.equal(response.status, 404);
  assert.equal(body.error_code, "db_missing");
  assert(!existsSync(missingDbPath), "GET missing DB does not create file");

  mkdirSync(dirname(dbPath), { recursive: true });
  new Database(dbPath).close();
  response = await route.GET(new Request(`http://localhost/api/perspective/layout/manual-anchors?db_path=${encodeURIComponent(dbPath)}`));
  body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.error_code, "schema_missing");
  const schemaCheck = new Database(dbPath, { readonly: true, fileMustExist: true });
  try {
    assert(!store.projectConstellationManualAnchorSchemaExistsV01(schemaCheck), "GET schema_missing does not create schema");
  } finally {
    schemaCheck.close();
  }

  const input = clone(fixture.safe_anchor_upsert_request_example.input);
  response = await route.POST(makePostRequest({ ...fixture.safe_anchor_upsert_request_example, db_path: dbPath, input }));
  body = await response.json();
  assert.equal(response.status, 201);
  assert.equal(body.status, "ok");
  assert.equal(body.result.status, "stored");
  assert.equal(body.result.record.anchor_id, input.anchor_id);
  assertAuthorityBoundary(body.authority_boundary, { write: true, route: true });

  let db = new Database(dbPath);
  try {
    assert.equal(countRows(db, "project_constellation_manual_anchors"), 1);
    assert.equal(countRows(db, "project_constellation_manual_anchor_activity"), 1);
  } finally {
    db.close();
  }

  response = await route.GET(
    new Request(
      `http://localhost/api/perspective/layout/manual-anchors?db_path=${encodeURIComponent(dbPath)}&perspective_id=${encodeURIComponent(input.perspective_id)}&limit=10`,
    ),
  );
  body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.result.records.length, 1);
  assertAuthorityBoundary(body.authority_boundary, { read: true, route: true });

  response = await route.POST(makePostRequest({ ...fixture.safe_anchor_upsert_request_example, db_path: dbPath, input }));
  body = await response.json();
  assert.equal(response.status, 201);
  assert(body.result.reason_codes.includes("manual_anchor_upsert_idempotent"));
  db = new Database(dbPath);
  try {
    assert.equal(countRows(db, "project_constellation_manual_anchors"), 1);
    assert.equal(countRows(db, "project_constellation_manual_anchor_activity"), 1);
  } finally {
    db.close();
  }

  const discardBody = {
    ...fixture.safe_anchor_discard_request_example,
    db_path: dbPath,
    input: {
      anchor_id: input.anchor_id,
      reason: fixture.safe_anchor_discard_request_example.input.reason,
    },
  };
  response = await route.POST(makePostRequest(discardBody));
  body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.result.status, "discarded");
  assert.equal(body.result.record.discard_reason, fixture.safe_anchor_discard_request_example.input.reason);
  db = new Database(dbPath);
  try {
    assert.equal(countRows(db, "project_constellation_manual_anchors"), 1);
  } finally {
    db.close();
  }

  response = await route.POST(makePostRequest({
    ...fixture.safe_anchor_upsert_request_example,
    db_path: fixture.invalid_db_path_example.db_path,
    input,
  }));
  body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.error_code, "invalid_db_path");
  assertNoUnsafeEcho(JSON.stringify(body), "invalid db path response");

  const unsafeInput = deepMerge(clone(input), fixture.blocked_private_or_raw_payload_example);
  unsafeInput.anchor_id = "manual-anchor:runtime-completion:route-blocked-private";
  response = await route.POST(makePostRequest({ ...fixture.safe_anchor_upsert_request_example, db_path: dbPath, input: unsafeInput }));
  body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.result.status, "blocked_private_or_raw_payload");
  assertNoUnsafeEcho(JSON.stringify(body), "blocked private route response");

  const forbiddenInput = deepMerge(clone(input), fixture.blocked_forbidden_authority_example);
  forbiddenInput.anchor_id = "manual-anchor:runtime-completion:route-blocked-authority";
  response = await route.POST(makePostRequest({ ...fixture.safe_anchor_upsert_request_example, db_path: dbPath, input: forbiddenInput }));
  body = await response.json();
  assert.equal(response.status, 403);
  assert.equal(body.result.status, "blocked_forbidden_authority");

  response = await route.POST(
    new Request("http://localhost/api/perspective/layout/manual-anchors", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        host: "localhost",
        origin: "https://cross-site.invalid",
      },
      body: JSON.stringify({ ...fixture.safe_anchor_upsert_request_example, db_path: dbPath, input }),
    }),
  );
  body = await response.json();
  assert.equal(response.status, 403);
  assert.equal(body.error_code, "same_origin_required");

  response = await route.POST(
    new Request("http://localhost/api/perspective/layout/manual-anchors", {
      method: "POST",
      headers: { "content-type": "application/json", host: "localhost", origin: "http://localhost" },
      body: "{",
    }),
  );
  body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.error_code, "invalid_json_body");
}

function makePostRequest(body) {
  return new Request("http://localhost/api/perspective/layout/manual-anchors", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "localhost",
      origin: "http://localhost",
    },
    body: JSON.stringify(body),
  });
}

function assertBlockedWithoutWrites(db, operation, expectedStatus, label) {
  const beforeAnchors = countRows(db, "project_constellation_manual_anchors");
  const beforeActivities = countRows(db, "project_constellation_manual_anchor_activity");
  const result = operation();
  assert.equal(result.status, expectedStatus, `${label} status`);
  assert.equal(countRows(db, "project_constellation_manual_anchors"), beforeAnchors, `${label} writes no anchor`);
  assert.equal(countRows(db, "project_constellation_manual_anchor_activity"), beforeActivities, `${label} writes no activity`);
  assertNoUnsafeEcho(JSON.stringify(result), `${label} result`);
}

function assertAuthorityBoundary(boundary, expected) {
  assert.equal(boundary.manual_anchor_persistence_runtime_now, true);
  assert.equal(boundary.explicit_operator_anchor_action_only, true);
  assert.equal(boundary.caller_injected_db_only, true);
  assert.equal(boundary.db_query_or_write_now, true);
  assert.equal(boundary.display_hint_only, true);
  if (expected.route) assert.equal(boundary.same_origin_route_now, true);
  if (expected.read) assert.equal(boundary.manual_anchor_read_now, true);
  if (expected.write) assert.equal(boundary.manual_anchor_write_now, true);
  for (const key of [
    "coordinate_is_truth",
    "manual_anchor_is_truth",
    "anchor_is_promotion_readiness",
    "anchor_is_evidence_strength",
    "anchor_is_source_authority",
    "proof_or_evidence_record_now",
    "claim_or_evidence_write_now",
    "work_item_write_now",
    "promotion_execution_now",
    "durable_state_write_now",
    "durable_state_apply_now",
    "formation_receipt_write_now",
    "provider_openai_call_now",
    "prompt_sent_now",
    "source_fetch_now",
    "retrieval_execution_now",
    "retrieval_index_write_now",
    "rag_answer_generation_now",
    "product_write_now",
    "product_write_runtime_now",
    "product_write_adapter_enabled_now",
    "product_id_allocation_now",
    "product_persistence_now",
    "git_ledger_export_runtime_now",
    "git_write_now",
    "github_api_call_now",
    "repository_file_write_now",
    "local_file_export_now",
    "local_file_import_now",
    "codex_execution_now",
    "codex_execution_authority",
    "github_automation_authority",
    "product_write_authority",
    "smoke_pass_is_truth",
    "ci_pass_is_truth",
  ]) {
    assert.equal(boundary[key], false, `${key} remains false`);
  }
}

function assertIndexCoverage() {
  const block = extractIndexBlock(indexText, "Project Constellation Manual Anchors Runtime Completion v0.1");
  for (const pointer of [docsPath, storePath, routePath, fixturePath, "scripts/smoke-project-constellation-manual-anchors-runtime-completion-v0-1.mjs"]) {
    assertIncludes(block, pointer, `index points to ${pointer}`);
  }
  for (const phrase of [
    "layout_persistence_manual_anchors_runtime_completion_v0_1",
    "manual anchors are display hints only",
    "coordinates are not truth",
    "Product-write remains parked by #686",
    "Smoke/CI pass is not truth",
  ]) {
    assertIncludes(block, phrase, `index contains ${phrase}`);
  }
}

function assertSafeMarkersOnlyInsideBlockedExamples(value) {
  const paths = [];
  walk(value, [], (path, leaf) => {
    if (typeof leaf !== "string") return;
    for (const marker of safeMarkers) {
      if (!leaf.includes(marker)) continue;
      const pathText = path.join(".");
      paths.push(pathText);
      assert(
        pathText.includes("blocked_") || pathText.includes("invalid_"),
        `${marker} appears only inside blocked/error examples: ${pathText}`,
      );
    }
  });
  assert(paths.length >= 2, "fixture includes blocked safe markers");
}

function assertNoLiveLookingPrivateMarkers(text, label) {
  let sanitized = text;
  for (const marker of safeMarkers) sanitized = sanitized.split(marker).join("");
  for (const marker of liveLookingPrivateMarkers) {
    assert(!sanitized.includes(marker), `${label} must not include ${marker}`);
  }
}

function assertNoUnsafeEcho(text, label) {
  for (const marker of safeMarkers) {
    assert(!text.includes(marker), `${label} must not echo ${marker}`);
  }
  assertNoLiveLookingPrivateMarkers(text, label);
}

function assertNoForbiddenFilesAdded() {
  const diffFiles = execFileSync("git", ["diff", "--name-only"], { encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const untrackedFiles = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const changed = [...new Set([...diffFiles, ...untrackedFiles])].sort();
  for (const filePath of changed) {
    for (const forbidden of [
      "provider",
      "retrieval-index-write",
      "github",
      "codex-execution",
      "product-write",
      "product-id",
    ]) {
      assert(!filePath.includes(forbidden), `changed file ${filePath} does not add ${forbidden} runtime`);
    }
  }
}

function runExistingSmoke(scriptName) {
  assert(packageJson.scripts[scriptName], `${scriptName} package script exists`);
  execFileSync("npm", ["run", scriptName], { stdio: "inherit" });
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

function walk(value, path, visit) {
  visit(path, value);
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, [...path, String(index)], visit));
    return;
  }
  for (const [key, nested] of Object.entries(value)) walk(nested, [...path, key], visit);
}

function extractIndexBlock(text, heading) {
  const start = text.indexOf(`- ${heading}:`);
  assert(start >= 0, `index contains ${heading}`);
  const next = text.indexOf("\n- ", start + 1);
  return next >= 0 ? text.slice(start, next) : text.slice(start);
}

function assertIncludes(text, expected, message) {
  assert(text.includes(expected), message);
}

function readText(filePath) {
  return readFileSync(filePath, "utf8");
}
