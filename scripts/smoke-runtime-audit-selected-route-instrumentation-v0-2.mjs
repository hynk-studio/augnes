#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { pathToFileURL } from "node:url";

import Database from "better-sqlite3";

const docsPath = "docs/RUNTIME_AUDIT_SELECTED_ROUTE_INSTRUMENTATION_V0_2.md";
const fixturePath = "fixtures/runtime-audit-selected-route-instrumentation.v0.2.sample.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const helperPath = "lib/runtime-audit/route-audit-instrumentation.ts";
const auditStorePath = "lib/runtime-audit/audit-event-store.ts";
const auditPanelDocsPath = "docs/RUNTIME_AUDIT_PANEL_RUNTIME_COMPLETION_V0_1.md";
const auditRoutePath = "app/api/runtime-audit/events/route.ts";
const rebuildRoutePath = "app/api/research-retrieval/rebuild/route.ts";
const searchRoutePath = "app/api/research-retrieval/search/route.ts";
const manualAnchorsRoutePath = "app/api/perspective/layout/manual-anchors/route.ts";
const retrievalFixturePath = "fixtures/research-retrieval-index-runtime-completion.sample.v0.1.json";
const manualAnchorFixturePath = "fixtures/project-constellation-manual-anchors-runtime-completion.sample.v0.1.json";

const scope = "project:augnes";
const instrumentationVersion = "runtime_audit_selected_route_instrumentation.v0.2";
const previousInstrumentationVersion = "runtime_audit_selected_route_instrumentation.v0.1";
const auditStoreVersion = "runtime_audit_event_store.v0.1";
const rebuildRouteVersion = "rebuildable_retrieval_index_runtime_completion_rebuild_route.v0.1";
const searchRouteVersion = "rebuildable_retrieval_index_runtime_completion_search_route.v0.1";
const manualAnchorRouteVersion = "project_constellation_manual_anchor_route.v0.1";

const retrievalDbPath = `.tmp/research-retrieval/runtime-audit-v0-2-${process.pid}.sqlite`;
const manualAnchorDbPath = `.tmp/project-constellation-manual-anchors/runtime-audit-v0-2-${process.pid}.sqlite`;
const auditDbPath = `.tmp/runtime-audit/selected-route-v0-2-${process.pid}.sqlite`;
const invalidAuditDbPath = "../runtime-audit-v0-2.sqlite";
const noAuditDbPath = `.tmp/runtime-audit/no-audit-v0-2-${process.pid}.sqlite`;

function readText(path) {
  return readFileSync(path, "utf8");
}

function readJson(path) {
  return JSON.parse(readText(path));
}

function assertIncludes(source, needle, label) {
  assert.ok(source.includes(needle), `${label} missing ${needle}`);
}

function assertNotIncludes(source, needle, label) {
  assert.ok(!source.includes(needle), `${label} unexpectedly includes ${needle}`);
}

function postRequest(path, body) {
  return new Request(`https://augnes.local.test${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "augnes.local.test",
      origin: "https://augnes.local.test",
      "sec-fetch-site": "same-origin",
    },
    body: JSON.stringify(body),
  });
}

function getRequest(path) {
  return new Request(`https://augnes.local.test${path}`, {
    method: "GET",
    headers: {
      host: "augnes.local.test",
      origin: "https://augnes.local.test",
      "sec-fetch-site": "same-origin",
    },
  });
}

function countAuditEvents(path) {
  const db = new Database(path, { readonly: true, fileMustExist: true });
  try {
    return db.prepare("SELECT COUNT(*) AS count FROM runtime_audit_events").get().count;
  } finally {
    db.close();
  }
}

function readAuditEvents(path) {
  const db = new Database(path, { readonly: true, fileMustExist: true });
  try {
    return auditStore.listRuntimeAuditEventsV01({ limit: 100 }, db);
  } finally {
    db.close();
  }
}

function assertNoUnsafeEcho(value, label = "value") {
  const text = JSON.stringify(value);
  for (const marker of [
    "SAFE_MARKER_RAW_REQUEST_BODY",
    "SAFE_MARKER_RAW_RESPONSE_BODY",
    "SAFE_MARKER_RAW_TERMINAL_LOG",
    "SAFE_MARKER_HIDDEN_REASONING",
    "SAFE_MARKER_RAW_PROVIDER_OUTPUT",
    "SAFE_MARKER_RAW_RETRIEVAL_OUTPUT",
    "SAFE_MARKER_LOCAL_PRIVATE_PATH",
    "../runtime-audit-v0-2.sqlite",
  ]) {
    assertNotIncludes(text, marker, label);
  }
}

function assertSafeMarkersOnlyInSkippedExamples(value, path = []) {
  if (typeof value === "string" && value.includes("SAFE_MARKER_")) {
    assert.ok(
      path.some((segment) => {
        const key = String(segment);
        return key.includes("skipped") || key.includes("blocked") || key.includes("invalid");
      }),
      `SAFE_MARKER appears outside skipped/blocked/invalid example at ${path.join(".")}`,
    );
  }
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertSafeMarkersOnlyInSkippedExamples(item, [...path, index]));
    return;
  }
  for (const [key, nested] of Object.entries(value)) {
    assertSafeMarkersOnlyInSkippedExamples(nested, [...path, key]);
  }
}

function assertAuditBoundary(event, label) {
  assert.equal(event.authority_boundary.audit_event_is_truth, false, `${label} truth`);
  assert.equal(event.authority_boundary.audit_event_is_proof, false, `${label} proof`);
  assert.equal(event.authority_boundary.audit_event_is_approval, false, `${label} approval`);
  assert.equal(event.authority_boundary.audit_event_is_durable_state, false, `${label} durable`);
  assert.equal(event.authority_boundary.audit_event_is_product_write_authority, false, `${label} product authority`);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

for (const path of [
  docsPath,
  fixturePath,
  packagePath,
  indexPath,
  helperPath,
  auditStorePath,
  auditPanelDocsPath,
  auditRoutePath,
  rebuildRoutePath,
  searchRoutePath,
  manualAnchorsRoutePath,
  retrievalFixturePath,
  manualAnchorFixturePath,
]) {
  assert.ok(existsSync(path), `${path} exists`);
}

const docs = readText(docsPath);
const fixture = readJson(fixturePath);
const fixtureText = readText(fixturePath);
const packageJson = readJson(packagePath);
const index = readText(indexPath);
const helperText = readText(helperPath);
const auditStoreText = readText(auditStorePath);
const rebuildRouteText = readText(rebuildRoutePath);
const searchRouteText = readText(searchRoutePath);
const manualAnchorRouteText = readText(manualAnchorsRoutePath);
const auditRouteText = readText(auditRoutePath);
const retrievalFixture = readJson(retrievalFixturePath);
const manualAnchorFixture = readJson(manualAnchorFixturePath);

const helper = await import(pathToFileURL(`${process.cwd()}/${helperPath}`).href);
const auditStore = await import(pathToFileURL(`${process.cwd()}/${auditStorePath}`).href);
const rebuildRoute = await import(pathToFileURL(`${process.cwd()}/${rebuildRoutePath}`).href);
const searchRoute = await import(pathToFileURL(`${process.cwd()}/${searchRoutePath}`).href);
const manualAnchorRoute = await import(pathToFileURL(`${process.cwd()}/${manualAnchorsRoutePath}`).href);
const auditRoute = await import(pathToFileURL(`${process.cwd()}/${auditRoutePath}`).href);

assert.equal(
  packageJson.scripts["smoke:runtime-audit-selected-route-instrumentation-v0-2"],
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-runtime-audit-selected-route-instrumentation-v0-2.mjs",
  "package script",
);
assertIncludes(index, "Runtime Audit Selected Route Instrumentation v0.2", "index pointer");
assertIncludes(docs, "This slice instruments only a second selected route subset.", "docs selected subset");
assertIncludes(docs, "Missing `audit_db_path` leaves primary route behavior unchanged.", "docs no-op");
assertIncludes(docs, "Audit write failure does not fail the primary route.", "docs failure isolation");
assertIncludes(docs, "The runtime audit route instruments GET list only", "docs self-audit policy");
assertIncludes(docs, "This slice does not store raw request bodies.", "docs raw request exclusion");
assertIncludes(docs, "Product-write remains parked by #686.", "docs product-write parked");
assertIncludes(docs, "The roadmap guide is not SSOT.", "docs roadmap boundary");

assert.equal(fixture.fixture_version, "runtime_audit_selected_route_instrumentation.sample.v0.2");
assert.equal(fixture.instrumentation_version, instrumentationVersion);
assert.equal(fixture.previous_instrumentation_version, previousInstrumentationVersion);
assert.equal(fixture.audit_event_store_version, auditStoreVersion);
assert.equal(fixture.scope, scope);
assert.equal(fixture.selected_routes.length, 4);
assertSafeMarkersOnlyInSkippedExamples(fixture);
assertIncludes(fixtureText, "runtime_audit_panel", "runtime audit panel fixture surface");
assertIncludes(auditStoreText, "\"runtime_audit_panel\"", "audit store runtime audit panel surface");

for (const exportName of [
  "maybeWriteRuntimeRouteAuditEventV01",
  "buildRuntimeRouteAuditEventInputV01",
  "createRuntimeRouteAuditEventIdV01",
  "sanitizeRuntimeRouteAuditSummaryV01",
  "createRuntimeRouteAuditInstrumentationAuthorityBoundaryV01",
]) {
  assert.equal(typeof helper[exportName], "function", `helper export ${exportName}`);
  assertIncludes(helperText, exportName, `helper source ${exportName}`);
}

for (const [routePath, routeSource] of [
  [rebuildRoutePath, rebuildRouteText],
  [searchRoutePath, searchRouteText],
  [manualAnchorsRoutePath, manualAnchorRouteText],
  [auditRoutePath, auditRouteText],
]) {
  assertIncludes(routeSource, "maybeWriteRuntimeRouteAuditEventV01", `${routePath} instrumentation call`);
  assertIncludes(routeSource, "audit_db_path", `${routePath} audit_db_path`);
  assertIncludes(routeSource, "audit_event_result", `${routePath} response audit result`);
  assertNotIncludes(routeSource, "raw_request_body_stored_now: true", `${routePath} no raw request body storage`);
  assertNotIncludes(routeSource, "raw_response_body_stored_now: true", `${routePath} no raw response body storage`);
}
assertIncludes(auditRouteText, "runtime_audit_events_listed", "runtime audit GET list self-audit");
assertNotIncludes(auditRouteText, "runtime_audit_event_created", "runtime audit POST self-audit skipped");

rmSync(retrievalDbPath, { force: true });
rmSync(manualAnchorDbPath, { force: true });
rmSync(auditDbPath, { force: true });
rmSync(noAuditDbPath, { force: true });

const rebuildInput = {
  ...clone(retrievalFixture.safe_rebuild_input_example),
  db_path: retrievalDbPath,
  rebuild_request_id: "retrieval-rebuild-request:audit-v0-2",
};
const rebuildResponse = await rebuildRoute.POST(
  postRequest("/api/research-retrieval/rebuild", {
    route_version: rebuildRouteVersion,
    scope,
    db_path: retrievalDbPath,
    audit_db_path: auditDbPath,
    input: rebuildInput,
  }),
);
assert.equal(rebuildResponse.status, 200);
const rebuildBody = await rebuildResponse.json();
assert.equal(rebuildBody.result.status, "rebuilt");
assert.equal(rebuildBody.audit_event_result.status, "audit_event_created");
assert.equal(countAuditEvents(auditDbPath), 1);

const searchInput = {
  ...clone(retrievalFixture.safe_search_input_example),
  db_path: retrievalDbPath,
  search_request_id: "retrieval-search-request:audit-v0-2",
};
const searchResponse = await searchRoute.POST(
  postRequest("/api/research-retrieval/search", {
    route_version: searchRouteVersion,
    scope,
    db_path: retrievalDbPath,
    audit_db_path: auditDbPath,
    input: searchInput,
  }),
);
assert.equal(searchResponse.status, 200);
const searchBody = await searchResponse.json();
assert.equal(searchBody.result.status, "searched");
assert.equal(searchBody.audit_event_result.status, "audit_event_created");
assert.equal(countAuditEvents(auditDbPath), 2);

const searchNoAuditResponse = await searchRoute.POST(
  postRequest("/api/research-retrieval/search", {
    route_version: searchRouteVersion,
    scope,
    db_path: retrievalDbPath,
    input: {
      ...searchInput,
      search_request_id: "retrieval-search-request:audit-v0-2-no-audit",
    },
  }),
);
assert.equal(searchNoAuditResponse.status, 200);
assert.equal((await searchNoAuditResponse.json()).audit_event_result.status, "audit_not_requested");
assert.equal(existsSync(noAuditDbPath), false, "missing audit path creates no audit DB");

const invalidAuditSearchResponse = await searchRoute.POST(
  postRequest("/api/research-retrieval/search", {
    route_version: searchRouteVersion,
    scope,
    db_path: retrievalDbPath,
    audit_db_path: invalidAuditDbPath,
    input: {
      ...searchInput,
      search_request_id: "retrieval-search-request:audit-v0-2-invalid-audit",
    },
  }),
);
assert.equal(invalidAuditSearchResponse.status, 200);
const invalidAuditSearchBody = await invalidAuditSearchResponse.json();
assert.equal(invalidAuditSearchBody.audit_event_result.status, "audit_skipped_invalid_db_path");
assertNoUnsafeEcho(invalidAuditSearchBody, "invalid audit path route response");
assert.equal(countAuditEvents(auditDbPath), 2);

const anchorInput = {
  ...clone(manualAnchorFixture.safe_anchor_upsert_request_example.input),
  anchor_id: "manual-anchor:runtime-audit:v0-2",
  perspective_id: "perspective:manual-anchor:v0-2",
  node_ref: "node-ref:manual-anchor:v0-2",
};
const anchorUpsertResponse = await manualAnchorRoute.POST(
  postRequest("/api/perspective/layout/manual-anchors", {
    route_version: manualAnchorRouteVersion,
    scope,
    action: "upsert_anchor",
    db_path: manualAnchorDbPath,
    audit_db_path: auditDbPath,
    input: anchorInput,
  }),
);
assert.equal(anchorUpsertResponse.status, 201);
const anchorUpsertBody = await anchorUpsertResponse.json();
assert.equal(anchorUpsertBody.result.status, "stored");
assert.equal(anchorUpsertBody.audit_event_result.status, "audit_event_created");
assert.equal(countAuditEvents(auditDbPath), 3);

const anchorListResponse = await manualAnchorRoute.GET(
  getRequest(`/api/perspective/layout/manual-anchors?db_path=${encodeURIComponent(manualAnchorDbPath)}&audit_db_path=${encodeURIComponent(auditDbPath)}&perspective_id=${encodeURIComponent(anchorInput.perspective_id)}&limit=10`),
);
assert.equal(anchorListResponse.status, 200);
const anchorListBody = await anchorListResponse.json();
assert.equal(anchorListBody.result.status, "stored");
assert.equal(anchorListBody.audit_event_result.status, "audit_event_created");
assert.equal(countAuditEvents(auditDbPath), 4);

const anchorDiscardResponse = await manualAnchorRoute.POST(
  postRequest("/api/perspective/layout/manual-anchors", {
    route_version: manualAnchorRouteVersion,
    scope,
    action: "discard_anchor",
    db_path: manualAnchorDbPath,
    audit_db_path: auditDbPath,
    input: {
      anchor_id: anchorInput.anchor_id,
      reason: "operator cleared display hint for audit instrumentation smoke",
    },
  }),
);
assert.equal(anchorDiscardResponse.status, 200);
const anchorDiscardBody = await anchorDiscardResponse.json();
assert.equal(anchorDiscardBody.result.status, "discarded");
assert.equal(anchorDiscardBody.audit_event_result.status, "audit_event_created");
assert.equal(countAuditEvents(auditDbPath), 5);

const auditListResponse = await auditRoute.GET(
  getRequest(`/api/runtime-audit/events?db_path=${encodeURIComponent(auditDbPath)}&audit_db_path=${encodeURIComponent(auditDbPath)}&limit=20`),
);
assert.equal(auditListResponse.status, 200);
const auditListBody = await auditListResponse.json();
assert.equal(auditListBody.result.status, "audit_events_listed");
assert.equal(auditListBody.audit_event_result.status, "audit_event_created");
assert.equal(countAuditEvents(auditDbPath), 6);

const auditListRepeatResponse = await auditRoute.GET(
  getRequest(`/api/runtime-audit/events?db_path=${encodeURIComponent(auditDbPath)}&audit_db_path=${encodeURIComponent(auditDbPath)}&limit=20`),
);
assert.equal(auditListRepeatResponse.status, 200);
const auditListRepeatBody = await auditListRepeatResponse.json();
assert.equal(auditListRepeatBody.audit_event_result.status, "audit_event_created");
assert.ok(countAuditEvents(auditDbPath) <= 7, "runtime audit GET self-audit does not recurse");

const emitted = readAuditEvents(auditDbPath);
const emittedSurfaces = new Set(emitted.map((event) => event.event_surface));
const emittedActions = new Set(emitted.map((event) => event.event_action));
for (const expectedSurface of ["retrieval_index_runtime", "manual_anchors_runtime", "runtime_audit_panel"]) {
  assert.ok(emittedSurfaces.has(expectedSurface), `emitted surface ${expectedSurface}`);
}
for (const expectedAction of [
  "retrieval_index_rebuild_completed",
  "retrieval_index_search_completed",
  "manual_anchor_upsert_completed",
  "manual_anchor_list_completed",
  "manual_anchor_discard_completed",
  "runtime_audit_events_listed",
]) {
  assert.ok(emittedActions.has(expectedAction), `emitted action ${expectedAction}`);
}
for (const event of emitted) {
  assert.equal(typeof event.bounded_summary, "string");
  assert.ok(event.bounded_summary.length > 0 && event.bounded_summary.length <= 300);
  assertAuditBoundary(event, event.audit_event_id);
}
assertNoUnsafeEcho(emitted, "emitted audit events");

rmSync(".tmp", { recursive: true, force: true });

for (const command of [
  "smoke:runtime-audit-selected-route-instrumentation-v0-1",
  "smoke:runtime-audit-panel-runtime-completion-v0-1",
  "smoke:research-retrieval-index-runtime-completion-v0-1",
  "smoke:project-constellation-manual-anchors-runtime-completion-v0-1",
]) {
  execFileSync("npm", ["run", command], { stdio: "pipe" });
}

console.log(
  JSON.stringify(
    {
      ok: true,
      smoke: "runtime-audit-selected-route-instrumentation-v0-2",
      instrumentation_version: instrumentationVersion,
      rebuild_audit_status: rebuildBody.audit_event_result.status,
      search_audit_status: searchBody.audit_event_result.status,
      manual_anchor_audit_status: anchorUpsertBody.audit_event_result.status,
      runtime_audit_list_status: auditListBody.audit_event_result.status,
      emitted_audit_events: emitted.length,
    },
    null,
    2,
  ),
);
