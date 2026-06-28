#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { pathToFileURL } from "node:url";

import Database from "better-sqlite3";

const docsPath = "docs/RUNTIME_AUDIT_SELECTED_ROUTE_INSTRUMENTATION_V0_4_PHASE_4_PROMOTION_STATE_V0_1.md";
const fixturePath =
  "fixtures/runtime-audit-selected-route-instrumentation.v0.4.phase-4-promotion-state.sample.json";
const smokePath =
  "scripts/smoke-runtime-audit-selected-route-instrumentation-v0-4-phase-4-promotion-state-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const remainingGapDocPath = "docs/V0_2_1_REMAINING_RUNTIME_GAP_AUDIT_V0_1.md";
const remainingGapFixturePath = "fixtures/v0-2-1-remaining-runtime-gap-audit.sample.v0.1.json";
const v01DocsPath = "docs/RUNTIME_AUDIT_SELECTED_ROUTE_INSTRUMENTATION_V0_1.md";
const v02DocsPath = "docs/RUNTIME_AUDIT_SELECTED_ROUTE_INSTRUMENTATION_V0_2.md";
const v03DocsPath = "docs/RUNTIME_AUDIT_SELECTED_ROUTE_INSTRUMENTATION_V0_3.md";
const v01SmokePath = "scripts/smoke-runtime-audit-selected-route-instrumentation-v0-1.mjs";
const v02SmokePath = "scripts/smoke-runtime-audit-selected-route-instrumentation-v0-2.mjs";
const v03SmokePath = "scripts/smoke-runtime-audit-selected-route-instrumentation-v0-3.mjs";
const auditPanelDocsPath = "docs/RUNTIME_AUDIT_PANEL_RUNTIME_COMPLETION_V0_1.md";
const auditPanelSmokePath = "scripts/smoke-runtime-audit-panel-runtime-completion-v0-1.mjs";
const helperPath = "lib/runtime-audit/route-audit-instrumentation.ts";
const auditStorePath = "lib/runtime-audit/audit-event-store.ts";
const promotionCollectionRoutePath = "app/api/perspective/promotion-decisions/route.ts";
const promotionDetailRoutePath =
  "app/api/perspective/promotion-decisions/[promotion_decision_id]/route.ts";
const formationRoutePath = "app/api/perspective/formation-receipts/route.ts";
const stateApplyRoutePath = "app/api/perspective/state/apply-delta/route.ts";
const stateReadRoutePath = "app/api/perspective/state/[perspective_id]/route.ts";
const trajectoryRoutePath = "app/api/perspective/state/[perspective_id]/trajectory/route.ts";
const promotionFixturePath = "fixtures/perspective-promotion-decision-store.sample.v0.1.json";
const formationFixturePath = "fixtures/formation-receipt-durable-write.sample.v0.1.json";
const stateFixturePath = "fixtures/durable-perspective-state-apply.sample.v0.1.json";

const scope = "project:augnes";
const instrumentationVersion =
  "runtime_audit_selected_route_instrumentation.v0.4.phase_4_promotion_state.v0.1";
const auditStoreVersion = "runtime_audit_event_store.v0.1";
const nextSlice = "runtime_audit_selected_route_instrumentation_v0_4_phase_4_promotion_state_v0_1";
const packageScriptName =
  "smoke:runtime-audit-selected-route-instrumentation-v0-4-phase-4-promotion-state-v0-1";
const packageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-runtime-audit-selected-route-instrumentation-v0-4-phase-4-promotion-state-v0-1.mjs";
const domainDbPath = `.tmp/perspective-promotion-decisions/runtime-audit-v0-4-${process.pid}.sqlite`;
const auditDbPath = `.tmp/runtime-audit/selected-route-v0-4-${process.pid}.sqlite`;
const noAuditDbPath = `.tmp/runtime-audit/no-audit-v0-4-${process.pid}.sqlite`;
const invalidAuditDbPath = "../runtime-audit-v0-4.sqlite";

const expectedActions = [
  "promotion_decision_created",
  "promotion_decisions_listed",
  "promotion_decision_read",
  "formation_receipt_created",
  "formation_receipts_listed",
  "durable_perspective_state_delta_applied",
  "durable_perspective_state_read",
  "perspective_trajectory_read",
];

for (const filePath of [
  docsPath,
  fixturePath,
  packagePath,
  indexPath,
  remainingGapDocPath,
  remainingGapFixturePath,
  v01DocsPath,
  v02DocsPath,
  v03DocsPath,
  v01SmokePath,
  v02SmokePath,
  v03SmokePath,
  auditPanelDocsPath,
  auditPanelSmokePath,
  helperPath,
  auditStorePath,
  promotionCollectionRoutePath,
  promotionDetailRoutePath,
  formationRoutePath,
  stateApplyRoutePath,
  stateReadRoutePath,
  trajectoryRoutePath,
  promotionFixturePath,
  formationFixturePath,
  stateFixturePath,
  smokePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} exists`);
}

const docs = readText(docsPath);
const fixture = readJson(fixturePath);
const fixtureText = readText(fixturePath);
const packageJson = readJson(packagePath);
const index = readText(indexPath);
const remainingGapDocs = readText(remainingGapDocPath);
const remainingGapFixtureText = readText(remainingGapFixturePath);
const helperText = readText(helperPath);
const auditStoreText = readText(auditStorePath);
const promotionCollectionRouteText = readText(promotionCollectionRoutePath);
const promotionDetailRouteText = readText(promotionDetailRoutePath);
const formationRouteText = readText(formationRoutePath);
const stateApplyRouteText = readText(stateApplyRoutePath);
const stateReadRouteText = readText(stateReadRoutePath);
const trajectoryRouteText = readText(trajectoryRoutePath);
const promotionFixture = readJson(promotionFixturePath);
const formationFixture = readJson(formationFixturePath);
const stateFixture = readJson(stateFixturePath);

const auditStore = await import(pathToFileURL(`${process.cwd()}/${auditStorePath}`).href);
const promotionCollectionRoute = await import(pathToFileURL(`${process.cwd()}/${promotionCollectionRoutePath}`).href);
const promotionDetailRoute = await import(pathToFileURL(`${process.cwd()}/${promotionDetailRoutePath}`).href);
const formationRoute = await import(pathToFileURL(`${process.cwd()}/${formationRoutePath}`).href);
const stateApplyRoute = await import(pathToFileURL(`${process.cwd()}/${stateApplyRoutePath}`).href);
const stateReadRoute = await import(pathToFileURL(`${process.cwd()}/${stateReadRoutePath}`).href);
const trajectoryRoute = await import(pathToFileURL(`${process.cwd()}/${trajectoryRoutePath}`).href);

assert.equal(packageJson.scripts[packageScriptName], packageScriptValue, "package script");
assertIncludes(index, "Runtime Audit Selected Route Instrumentation v0.4 Phase 4 Promotion/State", "index pointer");
assertIncludes(index, docsPath, "index docs pointer");
assertIncludes(index, fixturePath, "index fixture pointer");
assertIncludes(index, smokePath, "index smoke pointer");
assertIncludes(remainingGapDocs, nextSlice, "remaining gap docs next slice");
assertIncludes(remainingGapFixtureText, nextSlice, "remaining gap fixture next slice");
assertIncludes(helperText, "maybeWriteRuntimeRouteAuditEventV01", "helper export");

assert.equal(fixture.fixture_version, "runtime_audit_selected_route_instrumentation.v0.4.phase_4_promotion_state.sample.v0.1");
assert.equal(fixture.instrumentation_version, instrumentationVersion);
assert.deepEqual(fixture.previous_instrumentation_versions, [
  "runtime_audit_selected_route_instrumentation.v0.1",
  "runtime_audit_selected_route_instrumentation.v0.2",
  "runtime_audit_selected_route_instrumentation.v0.3",
]);
assert.equal(fixture.audit_event_store_version, auditStoreVersion);
assert.equal(fixture.scope, scope);
assert.equal(fixture.selected_routes.length, 6);
assertSafeMarkersOnlyInSkippedExamples(fixture);

for (const phrase of [
  "This slice instruments only the selected Phase 4 promotion/state route subset.",
  "Missing audit_db_path leaves primary route behavior unchanged.",
  "Audit write failure does not fail the primary route.",
  "Audit events are bounded review records only.",
  "Audit events are not truth, proof, approval, durable state, promotion authority, Formation Receipt authority, or product-write authority.",
  "Promotion decision remains a human-reviewed decision record, not proof.",
  "Formation Receipt remains a receipt, not product-write.",
  "Durable Perspective state apply remains receipt-backed state mutation only; audit does not mutate state.",
  "Trajectory remains read-only reconstruction, not authority.",
  "This slice does not store raw request bodies.",
  "This slice does not store raw response bodies.",
  "This slice does not store raw terminal logs.",
  "This slice does not ingest browser dumps.",
  "This slice does not store hidden reasoning.",
  "This slice does not store raw provider output.",
  "This slice does not store raw retrieval output.",
  "This slice does not create proof/evidence.",
  "This slice does not write claim/evidence records.",
  "This slice does not create work items.",
  "This slice does not promote Perspective.",
  "This slice does not write/apply durable Perspective state beyond the existing selected route behavior.",
  "This slice does not write Formation Receipts beyond the existing selected route behavior.",
  "This slice does not execute Git/GitHub.",
  "This slice does not execute Codex.",
  "This slice does not product-write.",
  "This slice does not allocate product IDs.",
  "Product-write remains parked by #686.",
  "Smoke/CI pass is not truth.",
  "The roadmap guide is not SSOT.",
]) {
  assertIncludes(docs, phrase, `docs phrase ${phrase}`);
}

for (const surface of [
  "promotion_decision_store",
  "formation_receipt_runtime",
  "durable_perspective_state_runtime",
  "perspective_trajectory_runtime",
]) {
  assertIncludes(auditStoreText, `"${surface}"`, `audit store surface ${surface}`);
}
assertNotIncludes(auditStoreText, "\"phase_4_runtime\"", "no broad Phase 4 wildcard surface");
assertNotIncludes(auditStoreText, "\"all_routes\"", "no all-routes surface");

assertRouteInstrumentation(promotionCollectionRouteText, promotionCollectionRoutePath, [
  "promotion_decision_store",
  "promotion_decisions_listed",
  "promotion_decision_created",
]);
assertRouteInstrumentation(promotionDetailRouteText, promotionDetailRoutePath, [
  "promotion_decision_store",
  "promotion_decision_read",
]);
assertRouteInstrumentation(formationRouteText, formationRoutePath, [
  "formation_receipt_runtime",
  "formation_receipts_listed",
  "formation_receipt_created",
]);
assertRouteInstrumentation(stateApplyRouteText, stateApplyRoutePath, [
  "durable_perspective_state_runtime",
  "durable_perspective_state_delta_applied",
]);
assertRouteInstrumentation(stateReadRouteText, stateReadRoutePath, [
  "durable_perspective_state_runtime",
  "durable_perspective_state_read",
]);
assertRouteInstrumentation(trajectoryRouteText, trajectoryRoutePath, [
  "perspective_trajectory_runtime",
  "perspective_trajectory_read",
]);

rmSync(domainDbPath, { force: true });
rmSync(auditDbPath, { force: true });
rmSync(noAuditDbPath, { force: true });

const promotionInput = clone(promotionFixture.valid_create_inputs[0]);
const formationInput = clone(formationFixture.valid_create_inputs[0]);
const applyInput = clone(stateFixture.valid_apply_inputs[0]);
const promotionDecisionId = promotionInput.promotion_decision_id;
const formationReceiptId = formationInput.receipt_id;
const perspectiveId = applyInput.perspective_id;

const promotionCreateResponse = await promotionCollectionRoute.POST(
  postRequest("/api/perspective/promotion-decisions", {
    db_path: domainDbPath,
    audit_db_path: auditDbPath,
    input: promotionInput,
  }),
);
assert.equal(promotionCreateResponse.status, 201);
const promotionCreateBody = await promotionCreateResponse.json();
assert.equal(promotionCreateBody.result.status, "stored");
assert.equal(promotionCreateBody.audit_event_result.status, "audit_event_created");
assert.equal(countAuditEvents(auditDbPath), 1);

const promotionListResponse = await promotionCollectionRoute.GET(
  getRequest(
    `/api/perspective/promotion-decisions?${queryString({
      db_path: domainDbPath,
      audit_db_path: auditDbPath,
      include_discarded: "1",
    })}`,
  ),
);
assert.equal(promotionListResponse.status, 200);
const promotionListBody = await promotionListResponse.json();
assert.equal(promotionListBody.result.status, "stored");
assert.equal(promotionListBody.result.records.length, 1);
assert.equal(promotionListBody.audit_event_result.status, "audit_event_created");
assert.equal(countAuditEvents(auditDbPath), 2);

const promotionDetailResponse = await promotionDetailRoute.GET(
  getRequest(
    `/api/perspective/promotion-decisions/${encodeURIComponent(promotionDecisionId)}?${queryString({
      db_path: domainDbPath,
      audit_db_path: auditDbPath,
    })}`,
  ),
  { params: Promise.resolve({ promotion_decision_id: encodeURIComponent(promotionDecisionId) }) },
);
assert.equal(promotionDetailResponse.status, 200);
const promotionDetailBody = await promotionDetailResponse.json();
assert.equal(promotionDetailBody.result.status, "stored");
assert.equal(promotionDetailBody.audit_event_result.status, "audit_event_created");
assert.equal(countAuditEvents(auditDbPath), 3);

const promotionDetailRepeatResponse = await promotionDetailRoute.GET(
  getRequest(
    `/api/perspective/promotion-decisions/${encodeURIComponent(promotionDecisionId)}?${queryString({
      db_path: domainDbPath,
      audit_db_path: auditDbPath,
    })}`,
  ),
  { params: Promise.resolve({ promotion_decision_id: encodeURIComponent(promotionDecisionId) }) },
);
assert.equal(promotionDetailRepeatResponse.status, 200);
const promotionDetailRepeatBody = await promotionDetailRepeatResponse.json();
assert.equal(promotionDetailRepeatBody.audit_event_result.status, "idempotent_existing");
assert.equal(countAuditEvents(auditDbPath), 3);

const formationCreateResponse = await formationRoute.POST(
  postRequest("/api/perspective/formation-receipts", {
    action: "create",
    db_path: domainDbPath,
    audit_db_path: auditDbPath,
    input: formationInput,
  }),
);
assert.equal(formationCreateResponse.status, 201);
const formationCreateBody = await formationCreateResponse.json();
assert.equal(formationCreateBody.result.status, "written");
assert.equal(formationCreateBody.audit_event_result.status, "audit_event_created");
assert.equal(countAuditEvents(auditDbPath), 4);

const formationListResponse = await formationRoute.GET(
  getRequest(
    `/api/perspective/formation-receipts?${queryString({
      db_path: domainDbPath,
      audit_db_path: auditDbPath,
      include_discarded: "1",
    })}`,
  ),
);
assert.equal(formationListResponse.status, 200);
const formationListBody = await formationListResponse.json();
assert.equal(formationListBody.result.status, "written");
assert.equal(formationListBody.result.records.length, 1);
assert.equal(formationListBody.audit_event_result.status, "audit_event_created");
assert.equal(countAuditEvents(auditDbPath), 5);

const stateApplyResponse = await stateApplyRoute.POST(
  postRequest("/api/perspective/state/apply-delta", {
    action: "apply",
    db_path: domainDbPath,
    audit_db_path: auditDbPath,
    input: applyInput,
  }),
);
assert.equal(stateApplyResponse.status, 201);
const stateApplyBody = await stateApplyResponse.json();
assert.equal(stateApplyBody.result.status, "applied");
assert.equal(stateApplyBody.audit_event_result.status, "audit_event_created");
assert.equal(countAuditEvents(auditDbPath), 6);

const stateReadResponse = await stateReadRoute.GET(
  getRequest(
    `/api/perspective/state/${encodeURIComponent(perspectiveId)}?${queryString({
      db_path: domainDbPath,
      audit_db_path: auditDbPath,
    })}`,
  ),
  { params: Promise.resolve({ perspective_id: encodeURIComponent(perspectiveId) }) },
);
assert.equal(stateReadResponse.status, 200);
const stateReadBody = await stateReadResponse.json();
assert.equal(stateReadBody.result.status, "applied");
assert.equal(stateReadBody.audit_event_result.status, "audit_event_created");
assert.equal(countAuditEvents(auditDbPath), 7);

const trajectoryResponse = await trajectoryRoute.GET(
  getRequest(
    `/api/perspective/state/${encodeURIComponent(perspectiveId)}/trajectory?${queryString({
      db_path: domainDbPath,
      audit_db_path: auditDbPath,
    })}`,
  ),
  { params: Promise.resolve({ perspective_id: encodeURIComponent(perspectiveId) }) },
);
assert.equal(trajectoryResponse.status, 200);
const trajectoryBody = await trajectoryResponse.json();
assert.equal(trajectoryBody.trajectory.status, "built");
assert.equal(trajectoryBody.audit_event_result.status, "audit_event_created");
assert.equal(countAuditEvents(auditDbPath), 8);

const noAuditResponse = await promotionCollectionRoute.GET(
  getRequest(
    `/api/perspective/promotion-decisions?${queryString({
      db_path: domainDbPath,
      include_discarded: "1",
    })}`,
  ),
);
assert.equal(noAuditResponse.status, 200);
const noAuditBody = await noAuditResponse.json();
assert.equal(noAuditBody.audit_event_result.status, "audit_not_requested");
assert.equal(countAuditEvents(auditDbPath), 8);
assert.ok(!existsSync(noAuditDbPath), "missing audit_db_path must not create audit DB");

const invalidAuditResponse = await promotionDetailRoute.GET(
  getRequest(
    `/api/perspective/promotion-decisions/${encodeURIComponent(promotionDecisionId)}?${queryString({
      db_path: domainDbPath,
      audit_db_path: invalidAuditDbPath,
    })}`,
  ),
  { params: Promise.resolve({ promotion_decision_id: encodeURIComponent(promotionDecisionId) }) },
);
assert.equal(invalidAuditResponse.status, 200);
const invalidAuditBody = await invalidAuditResponse.json();
assert.equal(invalidAuditBody.result.status, "stored");
assert.equal(invalidAuditBody.audit_event_result.status, "audit_skipped_invalid_db_path");
assert.equal(countAuditEvents(auditDbPath), 8);
assertNoUnsafeEcho(invalidAuditBody, "invalid audit response");

const listedAuditEvents = readAuditEvents(auditDbPath);
assert.equal(listedAuditEvents.length, 8);
const actionSet = new Set(listedAuditEvents.map((event) => event.event_action));
for (const action of expectedActions) assert.ok(actionSet.has(action), `audit action ${action}`);

const surfaceSet = new Set(listedAuditEvents.map((event) => event.event_surface));
for (const surface of [
  "promotion_decision_store",
  "formation_receipt_runtime",
  "durable_perspective_state_runtime",
  "perspective_trajectory_runtime",
]) {
  assert.ok(surfaceSet.has(surface), `audit surface ${surface}`);
}

for (const event of listedAuditEvents) {
  assert.equal(event.event_kind, "route_response", "route response audit kind");
  assert.ok(event.bounded_summary.length > 0 && event.bounded_summary.length <= 300, "bounded summary");
  assertNoUnsafeEcho(event, `audit event ${event.audit_event_id}`);
  assertAuditBoundary(event, event.audit_event_id);
  assert.ok(event.reason_codes.includes("audit_event_is_not_truth"), "audit event not truth reason");
  assert.ok(event.reason_codes.includes("audit_event_is_not_proof"), "audit event not proof reason");
  assert.ok(event.reason_codes.includes("audit_event_is_not_approval"), "audit event not approval reason");
  assert.ok(event.reason_codes.includes("audit_event_is_not_durable_state"), "audit event not durable state reason");
  assert.ok(event.reason_codes.includes("audit_event_is_not_product_write_authority"), "audit event not product authority reason");
}

for (const responseBody of [
  promotionCreateBody,
  promotionListBody,
  promotionDetailBody,
  formationCreateBody,
  formationListBody,
  stateApplyBody,
  stateReadBody,
  trajectoryBody,
]) {
  assertNoUnsafeEcho(responseBody, "route response body");
}

runSmoke("smoke:runtime-audit-selected-route-instrumentation-v0-3");
runSmoke("smoke:runtime-audit-selected-route-instrumentation-v0-2");
runSmoke("smoke:runtime-audit-selected-route-instrumentation-v0-1");
runSmoke("smoke:runtime-audit-panel-runtime-completion-v0-1");
runSmoke("smoke:perspective-promotion-decision-store-v0-1");
runSmoke("smoke:formation-receipt-durable-write-v0-1");
runSmoke("smoke:durable-perspective-state-apply-v0-1");
runSmoke("smoke:perspective-trajectory-v0-1");

console.log(
  JSON.stringify(
    {
      ok: true,
      smoke: "runtime-audit-selected-route-instrumentation-v0-4-phase-4-promotion-state-v0-1",
      instrumentation_version: instrumentationVersion,
      promotion_decision_create_audit_status: promotionCreateBody.audit_event_result.status,
      promotion_decision_list_audit_status: promotionListBody.audit_event_result.status,
      promotion_decision_detail_audit_status: promotionDetailBody.audit_event_result.status,
      formation_receipt_create_audit_status: formationCreateBody.audit_event_result.status,
      formation_receipt_list_audit_status: formationListBody.audit_event_result.status,
      durable_state_apply_audit_status: stateApplyBody.audit_event_result.status,
      durable_state_read_audit_status: stateReadBody.audit_event_result.status,
      perspective_trajectory_audit_status: trajectoryBody.audit_event_result.status,
      emitted_audit_events: listedAuditEvents.length,
    },
    null,
    2,
  ),
);

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

function assertRouteInstrumentation(routeText, routePath, expectedSnippets) {
  assertIncludes(routeText, "maybeWriteRuntimeRouteAuditEventV01", `${routePath} instrumentation call`);
  assertIncludes(routeText, "audit_db_path", `${routePath} audit path`);
  assertIncludes(routeText, "audit_event_result", `${routePath} response audit result`);
  for (const snippet of expectedSnippets) assertIncludes(routeText, snippet, `${routePath} ${snippet}`);
  assertNotIncludes(routeText, "raw_request_body_stored_now: true", `${routePath} no raw request body storage`);
  assertNotIncludes(routeText, "raw_response_body_stored_now: true", `${routePath} no raw response body storage`);
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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
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

function assertAuditBoundary(event, label) {
  assert.equal(event.authority_boundary.audit_event_is_truth, false, `${label} truth`);
  assert.equal(event.authority_boundary.audit_event_is_proof, false, `${label} proof`);
  assert.equal(event.authority_boundary.audit_event_is_approval, false, `${label} approval`);
  assert.equal(event.authority_boundary.audit_event_is_durable_state, false, `${label} durable state`);
  assert.equal(event.authority_boundary.audit_event_is_product_write_authority, false, `${label} product authority`);
  assert.equal(event.authority_boundary.raw_request_body_stored_now, false, `${label} raw request`);
  assert.equal(event.authority_boundary.raw_response_body_stored_now, false, `${label} raw response`);
  assert.equal(event.authority_boundary.product_write_now, false, `${label} product write`);
  assert.equal(event.authority_boundary.git_write_now, false, `${label} git write`);
  assert.equal(event.authority_boundary.codex_execution_now, false, `${label} codex execution`);
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
    "SAFE_MARKER_PRIVATE_URL",
    invalidAuditDbPath,
    "raw request body",
    "raw response body",
    "raw terminal log",
    "browser dump",
    "hidden reasoning",
    "raw provider output",
    "raw retrieval output",
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

function runSmoke(command) {
  execFileSync("npm", ["run", command], {
    stdio: "inherit",
    env: { ...process.env },
  });
}
