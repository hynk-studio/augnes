#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { pathToFileURL } from "node:url";

import Database from "better-sqlite3";

const docsPath = "docs/RUNTIME_AUDIT_SELECTED_ROUTE_INSTRUMENTATION_V0_3.md";
const v01DocsPath = "docs/RUNTIME_AUDIT_SELECTED_ROUTE_INSTRUMENTATION_V0_1.md";
const v02DocsPath = "docs/RUNTIME_AUDIT_SELECTED_ROUTE_INSTRUMENTATION_V0_2.md";
const auditPanelDocsPath = "docs/RUNTIME_AUDIT_PANEL_RUNTIME_COMPLETION_V0_1.md";
const fixturePath = "fixtures/runtime-audit-selected-route-instrumentation.v0.3.sample.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const helperPath = "lib/runtime-audit/route-audit-instrumentation.ts";
const auditStorePath = "lib/runtime-audit/audit-event-store.ts";
const collectionRoutePath = "app/api/research-candidate-review/review-records/route.ts";
const detailRoutePath = "app/api/research-candidate-review/review-records/[review_record_id]/route.ts";
const activityRoutePath = "app/api/research-candidate-review/review-records/[review_record_id]/activity/route.ts";
const discardRoutePath = "app/api/research-candidate-review/review-records/[review_record_id]/discard/route.ts";
const reviewMemoryFixturePath = "fixtures/research-candidate-review.memory-db-routes-runtime.sample.v0.1.json";

const scope = "project:augnes";
const routeVersion = "research_candidate_review_memory_db_routes.v0.1";
const instrumentationVersion = "runtime_audit_selected_route_instrumentation.v0.3";
const auditStoreVersion = "runtime_audit_event_store.v0.1";
const reviewRecordId = `review-memory-record:runtime-audit-v0-3-${process.pid}`;
const activityId = `review-memory-activity:runtime-audit-v0-3-${process.pid}`;
const reviewMemoryDbPath = `.tmp/research-candidate-review-memory/runtime-audit-v0-3-${process.pid}.sqlite`;
const auditDbPath = `.tmp/runtime-audit/selected-route-v0-3-${process.pid}.sqlite`;
const noAuditDbPath = `.tmp/runtime-audit/no-audit-v0-3-${process.pid}.sqlite`;
const invalidAuditDbPath = "../runtime-audit-v0-3.sqlite";

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

function queryString(params) {
  return new URLSearchParams(params).toString();
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
    return auditStore.listRuntimeAuditEventsV01({ event_surface: "review_memory_db_routes", limit: 100 }, db);
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
    invalidAuditDbPath,
    "raw request body",
    "raw response body",
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

function makeCreateInput(baseInput) {
  return {
    ...clone(baseInput),
    review_record_id: reviewRecordId,
    candidate_ref: `candidate-ref:runtime-audit-v0-3-${process.pid}`,
    candidate_refs: [
      `candidate-ref:runtime-audit-v0-3-${process.pid}`,
      `candidate-ref:runtime-audit-v0-3-secondary-${process.pid}`,
    ],
    source_refs: [
      {
        source_surface: "research_candidate_lifecycle_read_model",
        source_ref: `source-ref:runtime-audit-v0-3-${process.pid}`,
        source_version: "research_candidate_lifecycle.v0.1",
        public_safe: true,
      },
    ],
    related_record_refs: [],
    reviewer_actor: "operator:runtime-audit-v0-3-smoke",
    reviewer_note_summary: "Operator retained bounded review memory audit instrumentation metadata only.",
    bounded_summary: "Review Memory DB route instrumentation emits bounded audit events for route results.",
    created_at: "2026-06-28T03:00:00.000Z",
    updated_at: "2026-06-28T03:00:00.000Z",
  };
}

function makeActivityInput(baseInput) {
  return {
    ...clone(baseInput),
    activity_id: activityId,
    review_record_id: reviewRecordId,
    actor_ref: "operator:runtime-audit-v0-3-smoke",
    summary: "Operator appended bounded Review Memory route activity for audit instrumentation.",
    created_at: "2026-06-28T03:05:00.000Z",
  };
}

function runSmoke(command) {
  execFileSync("npm", ["run", command], {
    stdio: "inherit",
    env: { ...process.env },
  });
}

for (const path of [
  docsPath,
  v01DocsPath,
  v02DocsPath,
  auditPanelDocsPath,
  fixturePath,
  packagePath,
  indexPath,
  helperPath,
  auditStorePath,
  collectionRoutePath,
  detailRoutePath,
  activityRoutePath,
  discardRoutePath,
  reviewMemoryFixturePath,
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
const collectionRouteText = readText(collectionRoutePath);
const detailRouteText = readText(detailRoutePath);
const activityRouteText = readText(activityRoutePath);
const discardRouteText = readText(discardRoutePath);
const reviewMemoryFixture = readJson(reviewMemoryFixturePath);

const auditStore = await import(pathToFileURL(`${process.cwd()}/${auditStorePath}`).href);
const collectionRoute = await import(pathToFileURL(`${process.cwd()}/${collectionRoutePath}`).href);
const detailRoute = await import(pathToFileURL(`${process.cwd()}/${detailRoutePath}`).href);
const activityRoute = await import(pathToFileURL(`${process.cwd()}/${activityRoutePath}`).href);
const discardRoute = await import(pathToFileURL(`${process.cwd()}/${discardRoutePath}`).href);

assert.equal(
  packageJson.scripts["smoke:runtime-audit-selected-route-instrumentation-v0-3"],
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-runtime-audit-selected-route-instrumentation-v0-3.mjs",
  "package script",
);
assertIncludes(index, "Runtime Audit Selected Route Instrumentation v0.3", "index pointer");
assertIncludes(docs, "This slice instruments only a third selected route subset: Review Memory DB routes.", "docs selected subset");
assertIncludes(docs, "Missing `audit_db_path` leaves primary route behavior unchanged.", "docs no-op");
assertIncludes(docs, "Audit write failure does not fail the primary route.", "docs failure isolation");
assertIncludes(docs, "Review memory is not truth.", "docs review memory truth boundary");
assertIncludes(docs, "Review memory is not proof.", "docs review memory proof boundary");
assertIncludes(docs, "Review memory is not accepted evidence.", "docs accepted evidence boundary");
assertIncludes(docs, "Review memory is not durable Perspective state.", "docs durable boundary");
assertIncludes(docs, "Candidate refs are not facts.", "docs candidate facts boundary");
assertIncludes(docs, "Source refs are lineage pointers, not proof.", "docs source lineage boundary");
assertIncludes(docs, "Product-write remains parked by #686.", "docs product-write parked");
assertIncludes(docs, "The roadmap guide is not SSOT.", "docs roadmap boundary");

assert.equal(fixture.fixture_version, "runtime_audit_selected_route_instrumentation.sample.v0.3");
assert.equal(fixture.instrumentation_version, instrumentationVersion);
assert.deepEqual(fixture.previous_instrumentation_versions, [
  "runtime_audit_selected_route_instrumentation.v0.1",
  "runtime_audit_selected_route_instrumentation.v0.2",
]);
assert.equal(fixture.audit_event_store_version, auditStoreVersion);
assert.equal(fixture.scope, scope);
assert.equal(fixture.selected_routes.length, 4);
assert.ok(fixture.review_memory_activity_append_audit_example, "activity POST audit example exists");
assertSafeMarkersOnlyInSkippedExamples(fixture);
assertIncludes(fixtureText, "review_memory_db_routes", "fixture review memory surface");
assertIncludes(auditStoreText, "\"review_memory_db_routes\"", "audit store review memory surface");

for (const exportName of [
  "maybeWriteRuntimeRouteAuditEventV01",
  "buildRuntimeRouteAuditEventInputV01",
  "createRuntimeRouteAuditEventIdV01",
  "sanitizeRuntimeRouteAuditSummaryV01",
  "createRuntimeRouteAuditInstrumentationAuthorityBoundaryV01",
]) {
  assertIncludes(helperText, exportName, `helper source ${exportName}`);
}

for (const [routePath, routeSource] of [
  [collectionRoutePath, collectionRouteText],
  [detailRoutePath, detailRouteText],
  [activityRoutePath, activityRouteText],
  [discardRoutePath, discardRouteText],
]) {
  assertIncludes(routeSource, "maybeWriteRuntimeRouteAuditEventV01", `${routePath} instrumentation call`);
  assertIncludes(routeSource, "audit_db_path", `${routePath} audit_db_path`);
  assertIncludes(routeSource, "audit_event_result", `${routePath} response audit result`);
  assertIncludes(routeSource, "review_memory_db_routes", `${routePath} review memory audit surface`);
  assertNotIncludes(routeSource, "raw_request_body_stored_now: true", `${routePath} no raw request body storage`);
  assertNotIncludes(routeSource, "raw_response_body_stored_now: true", `${routePath} no raw response body storage`);
}
assertIncludes(collectionRouteText, "review_memory_records_listed", "collection list action");
assertIncludes(collectionRouteText, "review_memory_record_created", "collection create action");
assertIncludes(detailRouteText, "review_memory_record_read", "detail action");
assertIncludes(activityRouteText, "review_memory_activity_listed", "activity list action");
assertIncludes(activityRouteText, "review_memory_activity_appended", "activity append action");
assertIncludes(discardRouteText, "review_memory_record_discarded", "discard action");

rmSync(reviewMemoryDbPath, { force: true });
rmSync(auditDbPath, { force: true });
rmSync(noAuditDbPath, { force: true });

const createInput = makeCreateInput(reviewMemoryFixture.safe_create_input_example);
const createResponse = await collectionRoute.POST(
  postRequest("/api/research-candidate-review/review-records", {
    route_version: routeVersion,
    scope,
    action: "create_review_record",
    db_path: reviewMemoryDbPath,
    audit_db_path: auditDbPath,
    input: createInput,
  }),
);
assert.equal(createResponse.status, 201);
const createBody = await createResponse.json();
assert.equal(createBody.status, "ok");
assert.equal(createBody.result.status, "created");
assert.equal(createBody.result.record.review_record_id, reviewRecordId);
assert.equal(createBody.audit_event_result.status, "audit_event_created");
assert.equal(countAuditEvents(auditDbPath), 1);

const listResponse = await collectionRoute.GET(
  getRequest(
    `/api/research-candidate-review/review-records?${queryString({
      route_version: routeVersion,
      scope,
      db_path: reviewMemoryDbPath,
      audit_db_path: auditDbPath,
      include_discarded: "1",
      limit: "20",
    })}`,
  ),
);
assert.equal(listResponse.status, 200);
const listBody = await listResponse.json();
assert.equal(listBody.result.status, "listed");
assert.equal(listBody.result.records.length, 1);
assert.equal(listBody.audit_event_result.status, "audit_event_created");
assert.equal(countAuditEvents(auditDbPath), 2);

const detailResponse = await detailRoute.GET(
  getRequest(
    `/api/research-candidate-review/review-records/${encodeURIComponent(reviewRecordId)}?${queryString({
      route_version: routeVersion,
      scope,
      db_path: reviewMemoryDbPath,
      audit_db_path: auditDbPath,
    })}`,
  ),
  { params: Promise.resolve({ review_record_id: encodeURIComponent(reviewRecordId) }) },
);
assert.equal(detailResponse.status, 200);
const detailBody = await detailResponse.json();
assert.equal(detailBody.result.status, "read");
assert.equal(detailBody.result.record.review_record_id, reviewRecordId);
assert.equal(detailBody.audit_event_result.status, "audit_event_created");
assert.equal(countAuditEvents(auditDbPath), 3);

const detailRepeatResponse = await detailRoute.GET(
  getRequest(
    `/api/research-candidate-review/review-records/${encodeURIComponent(reviewRecordId)}?${queryString({
      route_version: routeVersion,
      scope,
      db_path: reviewMemoryDbPath,
      audit_db_path: auditDbPath,
    })}`,
  ),
  { params: Promise.resolve({ review_record_id: encodeURIComponent(reviewRecordId) }) },
);
assert.equal(detailRepeatResponse.status, 200);
const detailRepeatBody = await detailRepeatResponse.json();
assert.equal(detailRepeatBody.audit_event_result.status, "idempotent_existing");
assert.equal(countAuditEvents(auditDbPath), 3);

const activityListResponse = await activityRoute.GET(
  getRequest(
    `/api/research-candidate-review/review-records/${encodeURIComponent(reviewRecordId)}/activity?${queryString({
      route_version: routeVersion,
      scope,
      db_path: reviewMemoryDbPath,
      audit_db_path: auditDbPath,
    })}`,
  ),
  { params: Promise.resolve({ review_record_id: encodeURIComponent(reviewRecordId) }) },
);
assert.equal(activityListResponse.status, 200);
const activityListBody = await activityListResponse.json();
assert.equal(activityListBody.result.status, "read");
assert.ok(activityListBody.result.activities.length >= 1, "activity GET includes created activity");
assert.equal(activityListBody.audit_event_result.status, "audit_event_created");
assert.equal(countAuditEvents(auditDbPath), 4);

const activityInput = makeActivityInput(reviewMemoryFixture.safe_activity_append_example);
const activityAppendResponse = await activityRoute.POST(
  postRequest(`/api/research-candidate-review/review-records/${encodeURIComponent(reviewRecordId)}/activity`, {
    route_version: routeVersion,
    scope,
    action: "append_review_record_activity",
    db_path: reviewMemoryDbPath,
    audit_db_path: auditDbPath,
    input: activityInput,
  }),
  { params: Promise.resolve({ review_record_id: encodeURIComponent(reviewRecordId) }) },
);
assert.equal(activityAppendResponse.status, 200);
const activityAppendBody = await activityAppendResponse.json();
assert.equal(activityAppendBody.result.status, "activity_appended");
assert.equal(activityAppendBody.result.activities[0].activity_id, activityId);
assert.equal(activityAppendBody.audit_event_result.status, "audit_event_created");
assert.equal(countAuditEvents(auditDbPath), 5);

const discardResponse = await discardRoute.POST(
  postRequest(`/api/research-candidate-review/review-records/${encodeURIComponent(reviewRecordId)}/discard`, {
    route_version: routeVersion,
    scope,
    action: "discard_review_record",
    db_path: reviewMemoryDbPath,
    audit_db_path: auditDbPath,
    reason: "Operator discarded this review memory route record as a lifecycle transition.",
  }),
  { params: Promise.resolve({ review_record_id: encodeURIComponent(reviewRecordId) }) },
);
assert.equal(discardResponse.status, 200);
const discardBody = await discardResponse.json();
assert.equal(discardBody.result.status, "discarded");
assert.equal(discardBody.audit_event_result.status, "audit_event_created");
assert.equal(countAuditEvents(auditDbPath), 6);

const noAuditResponse = await collectionRoute.GET(
  getRequest(
    `/api/research-candidate-review/review-records?${queryString({
      route_version: routeVersion,
      scope,
      db_path: reviewMemoryDbPath,
      include_discarded: "1",
      limit: "20",
    })}`,
  ),
);
assert.equal(noAuditResponse.status, 200);
const noAuditBody = await noAuditResponse.json();
assert.equal(noAuditBody.audit_event_result.status, "audit_not_requested");
assert.equal(countAuditEvents(auditDbPath), 6);
assert.ok(!existsSync(noAuditDbPath), "missing audit_db_path must not create audit DB");

const invalidAuditResponse = await detailRoute.GET(
  getRequest(
    `/api/research-candidate-review/review-records/${encodeURIComponent(reviewRecordId)}?${queryString({
      route_version: routeVersion,
      scope,
      db_path: reviewMemoryDbPath,
      audit_db_path: invalidAuditDbPath,
    })}`,
  ),
  { params: Promise.resolve({ review_record_id: encodeURIComponent(reviewRecordId) }) },
);
assert.equal(invalidAuditResponse.status, 200);
const invalidAuditBody = await invalidAuditResponse.json();
assert.equal(invalidAuditBody.result.status, "read");
assert.equal(invalidAuditBody.audit_event_result.status, "audit_skipped_invalid_db_path");
assert.equal(countAuditEvents(auditDbPath), 6);
assertNoUnsafeEcho(invalidAuditBody, "invalid audit response");

const listedAuditEvents = readAuditEvents(auditDbPath);
assert.equal(listedAuditEvents.length, 6);
const actions = new Set(listedAuditEvents.map((event) => event.event_action));
for (const expectedAction of [
  "review_memory_record_created",
  "review_memory_records_listed",
  "review_memory_record_read",
  "review_memory_activity_listed",
  "review_memory_activity_appended",
  "review_memory_record_discarded",
]) {
  assert.ok(actions.has(expectedAction), `audit event action ${expectedAction}`);
}
for (const event of listedAuditEvents) {
  assert.equal(event.event_surface, "review_memory_db_routes", "review memory audit surface");
  assert.equal(event.event_kind, "route_response", "route response audit kind");
  assert.ok(event.bounded_summary.length > 0 && event.bounded_summary.length <= 300, "bounded summary");
  assertNoUnsafeEcho(event, `audit event ${event.audit_event_id}`);
  assertAuditBoundary(event, event.audit_event_id);
  assert.ok(event.reason_codes.includes("audit_event_is_not_truth"), "audit event not truth reason");
  assert.ok(event.reason_codes.includes("audit_event_is_not_proof"), "audit event not proof reason");
  assert.ok(event.reason_codes.includes("audit_event_is_not_product_write_authority"), "audit event not product authority reason");
}

assertNoUnsafeEcho(createBody, "create response");
assertNoUnsafeEcho(listBody, "list response");
assertNoUnsafeEcho(detailBody, "detail response");
assertNoUnsafeEcho(activityListBody, "activity list response");
assertNoUnsafeEcho(activityAppendBody, "activity append response");
assertNoUnsafeEcho(discardBody, "discard response");

rmSync(".tmp/research-candidate-review-memory/db-route-smoke-imports", { recursive: true, force: true });
runSmoke("smoke:runtime-audit-selected-route-instrumentation-v0-2");
runSmoke("smoke:runtime-audit-selected-route-instrumentation-v0-1");
runSmoke("smoke:runtime-audit-panel-runtime-completion-v0-1");
runSmoke("smoke:research-candidate-review-memory-db-routes-runtime-v0-1");

console.log(
  JSON.stringify(
    {
      ok: true,
      smoke: "runtime-audit-selected-route-instrumentation-v0-3",
      instrumentation_version: instrumentationVersion,
      review_memory_create_audit_status: createBody.audit_event_result.status,
      review_memory_list_audit_status: listBody.audit_event_result.status,
      review_memory_detail_audit_status: detailBody.audit_event_result.status,
      review_memory_activity_audit_status: activityAppendBody.audit_event_result.status,
      review_memory_discard_audit_status: discardBody.audit_event_result.status,
      emitted_audit_events: listedAuditEvents.length,
    },
    null,
    2,
  ),
);
