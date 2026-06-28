#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";

import Database from "better-sqlite3";

const docsPath = "docs/RUNTIME_AUDIT_PANEL_RUNTIME_COMPLETION_V0_1.md";
const legacyDocsPath = "docs/RUNTIME_AUDIT_PANEL_V0_1.md";
const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const storePath = "lib/runtime-audit/audit-event-store.ts";
const modelPath = "lib/runtime-audit/build-runtime-audit-model.ts";
const routePath = "app/api/runtime-audit/events/route.ts";
const componentPath = "components/runtime-audit-panel.tsx";
const fixturePath = "fixtures/runtime-audit-panel-runtime-completion.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const routeVersion = "runtime_audit_event_route.v0.1";
const storeVersion = "runtime_audit_event_store.v0.1";
const eventVersion = "runtime_audit_event.v0.1";
const requestVersion = "runtime_audit_event_request.v0.1";
const modelVersion = "runtime_audit_panel_runtime_model.v0.1";
const scope = "project:augnes";
const dbPath = `.tmp/runtime-audit/smoke-runtime-audit-${process.pid}.sqlite`;
const routeDbPath = `.tmp/runtime-audit/smoke-runtime-audit-route-${process.pid}.sqlite`;
const missingDbPath = `.tmp/runtime-audit/missing-runtime-audit-route-${process.pid}.sqlite`;
const schemaMissingDbPath = `.tmp/runtime-audit/schema-missing-runtime-audit-route-${process.pid}.sqlite`;

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

function assertAuthorityBoundary(boundary, label, { persistenceNow = false, readNow = false } = {}) {
  const expectedTrue = [
    "runtime_audit_panel_runtime_completion_now",
    "caller_injected_db_only",
    "same_origin_audit_route_now",
    "audit_model_readonly_now",
    "bounded_summary_only",
  ];
  for (const field of expectedTrue) {
    assert.equal(boundary[field], true, `${label}.${field} must be true`);
  }
  assert.equal(
    boundary.runtime_audit_event_persistence_now,
    persistenceNow,
    `${label}.runtime_audit_event_persistence_now`,
  );
  assert.equal(
    boundary.runtime_audit_event_read_now,
    readNow,
    `${label}.runtime_audit_event_read_now`,
  );
  for (const field of [
    "raw_request_body_stored_now",
    "raw_response_body_stored_now",
    "raw_terminal_log_stored_now",
    "browser_dump_ingested_now",
    "hidden_reasoning_stored_now",
    "raw_provider_output_stored_now",
    "raw_retrieval_output_stored_now",
    "provider_openai_call_now",
    "prompt_sent_now",
    "source_fetch_now",
    "retrieval_execution_now",
    "retrieval_index_write_now",
    "rag_answer_generation_now",
    "proof_or_evidence_record_now",
    "claim_or_evidence_write_now",
    "work_item_write_now",
    "promotion_execution_now",
    "durable_state_write_now",
    "durable_state_apply_now",
    "formation_receipt_write_now",
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
    "audit_event_is_truth",
    "audit_event_is_proof",
    "audit_event_is_approval",
    "audit_event_is_durable_state",
    "audit_event_is_product_write_authority",
    "smoke_pass_is_truth",
    "ci_pass_is_truth",
  ]) {
    assert.equal(boundary[field], false, `${label}.${field} must be false`);
  }
}

function safeInput(overrides = {}) {
  return {
    request_version: requestVersion,
    event_version: eventVersion,
    scope,
    audit_event_id: "audit:event:runtime-audit:smoke:001",
    event_kind: "route_response",
    event_surface: "feedback_surfacing_preview_runtime",
    event_action: "surfacing_preview_created",
    event_status: "ok",
    subject_ref: "feedback-target:runtime-audit-smoke:001",
    related_refs: [
      "feedback-event:runtime-audit-smoke:pin:001",
      "feedback-aggregation:runtime-audit-smoke:001",
    ],
    route_ref: "route:/api/research-candidate/feedback-events/surfacing-preview",
    runtime_slice_ref: "feedback_influenced_surfacing_preview_runtime_completion_v0_1",
    created_by: "operator:runtime-audit-smoke",
    created_at: "2026-06-28T00:00:00.000Z",
    bounded_summary: "Feedback surfacing preview produced advisory audit context.",
    bounded_error_code: "none",
    authority_boundary: store.createRuntimeAuditEventAuthorityBoundaryV01({
      persistenceNow: true,
    }),
    privacy_report: {
      bounded_summary_only: true,
      raw_payload_excluded: true,
    },
    reason_codes: [
      "runtime_audit_panel_runtime_completion",
      "bounded_summary_only",
      "audit_event_is_not_truth",
      "product_write_denied",
    ],
    ...overrides,
  };
}

function routeRequest(method, path, body, headers = {}) {
  return new Request(`https://augnes.local.test${path}`, {
    method,
    headers: {
      ...(body ? { "content-type": "application/json" } : {}),
      host: "augnes.local.test",
      "sec-fetch-site": "same-origin",
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

function createBody(input, path = routeDbPath) {
  return {
    route_version: routeVersion,
    scope,
    action: "create_audit_event",
    db_path: path,
    input,
  };
}

function countRows(path) {
  const db = new Database(path, { readonly: true, fileMustExist: true });
  try {
    return db.prepare("SELECT COUNT(*) AS count FROM runtime_audit_events").get().count;
  } finally {
    db.close();
  }
}

function assertNoUnsafeEcho(value, label = "response") {
  const text = JSON.stringify(value);
  for (const marker of [
    "SAFE_MARKER_RAW_REQUEST_BODY",
    "SAFE_MARKER_RAW_RESPONSE_BODY",
    "SAFE_MARKER_RAW_TERMINAL_LOG",
    "SAFE_MARKER_HIDDEN_REASONING",
    "SAFE_MARKER_BROWSER_DUMP",
    "../runtime-audit.sqlite",
    "secret-token-runtime-audit.sqlite",
  ]) {
    assertNotIncludes(text, marker, label);
  }
}

function assertSafeMarkersOnlyInBlockedExamples(value, path = []) {
  if (typeof value === "string" && value.includes("SAFE_MARKER_")) {
    assert.ok(
      path.some((segment) => {
        const key = String(segment);
        return key.startsWith("blocked_") || key.startsWith("invalid_") || key.includes("blocked");
      }),
      `SAFE_MARKER appears outside blocked/error example at ${path.join(".")}`,
    );
  }
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertSafeMarkersOnlyInBlockedExamples(item, [...path, index]));
    return;
  }
  for (const [key, nested] of Object.entries(value)) {
    assertSafeMarkersOnlyInBlockedExamples(nested, [...path, key]);
  }
}

function assertNoLiveLookingPayloads(text, label) {
  for (const marker of [
    "sk-",
    "ghp_",
    "OPENAI_API_KEY",
    "GITHUB_TOKEN",
    "raw provider output",
    "raw retrieval output",
    "raw source body",
    "raw DB row",
    "actual prompt:",
    "provider response:",
    "embedding vector:",
    "vector index dump",
  ]) {
    assertNotIncludes(text, marker, label);
  }
}

const docs = readText(docsPath);
const legacyDocs = readText(legacyDocsPath);
const roadmap = readText(roadmapPath);
const storeText = readText(storePath);
const modelText = readText(modelPath);
const routeText = readText(routePath);
const componentText = readText(componentPath);
const fixtureText = readText(fixturePath);
const fixture = readJson(fixturePath);
const packageJson = readJson(packagePath);
const indexText = readText(indexPath);

const store = await import(pathToFileURL(`${process.cwd()}/${storePath}`).href);
const model = await import(pathToFileURL(`${process.cwd()}/${modelPath}`).href);
const route = await import(pathToFileURL(`${process.cwd()}/${routePath}`).href);

assert.ok(existsSync(docsPath), "docs file exists");
assert.ok(existsSync(storePath), "store helper exists");
assert.ok(existsSync(modelPath), "model helper exists");
assert.ok(existsSync(routePath), "route file exists");
assert.ok(existsSync(componentPath), "panel component exists");
assert.ok(existsSync(fixturePath), "fixture exists");
assert.equal(
  packageJson.scripts["smoke:runtime-audit-panel-runtime-completion-v0-1"],
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-runtime-audit-panel-runtime-completion-v0-1.mjs",
  "package script exists",
);
assertIncludes(indexText, "Runtime Audit Panel Runtime Completion v0.1", "latest index pointer exists");

assertIncludes(roadmap, "runtime_audit_panel_v0_1", "roadmap contains runtime audit panel language");
assertIncludes(roadmap, "app/api/runtime-audit/events/route.ts", "roadmap route expectation");
assertIncludes(legacyDocs, "caller-provided", "legacy docs mention caller-provided audit items");
assertIncludes(docs, "caller-provided audit-items only", "docs mention earlier caller-provided gap");
assertIncludes(docs, "DB-backed bounded audit events", "docs mention DB-backed completion");
assertIncludes(docs, "Audit event is not truth.", "docs audit event not truth");
assertIncludes(docs, "This slice does not store raw request bodies.", "docs raw request exclusion");
assertIncludes(docs, "This slice does not store raw response bodies.", "docs raw response exclusion");
assertIncludes(docs, "This slice does not store raw terminal logs.", "docs raw terminal exclusion");
assertIncludes(docs, "This slice does not ingest browser dumps.", "docs browser dump exclusion");
assertIncludes(docs, "Product-write remains parked by #686.", "docs product-write parked");

for (const exportName of [
  "ensureRuntimeAuditEventSchemaV01",
  "runtimeAuditEventSchemaExistsV01",
  "createRuntimeAuditEventV01",
  "readRuntimeAuditEventV01",
  "listRuntimeAuditEventsV01",
  "createRuntimeAuditEventAuthorityBoundaryV01",
  "createRuntimeAuditEventFingerprintV01",
  "isSafeRuntimeAuditDbPathV01",
]) {
  assert.equal(typeof store[exportName], "function", `store export ${exportName}`);
  assertIncludes(storeText, exportName, `store source export ${exportName}`);
}

for (const exportName of [
  "buildRuntimeAuditPanelModelV01",
  "summarizeRuntimeAuditEventsV01",
  "groupRuntimeAuditEventsBySurfaceV01",
  "createRuntimeAuditModelAuthorityBoundaryV01",
]) {
  assert.equal(typeof model[exportName], "function", `model export ${exportName}`);
  assertIncludes(modelText, exportName, `model source export ${exportName}`);
}

assert.equal(typeof route.GET, "function", "route exports GET");
assert.equal(typeof route.POST, "function", "route exports POST");
assertIncludes(routeText, "requestHasSameOriginBoundary", "route same-origin helper");
assertIncludes(routeText, "same_origin_required", "route same-origin rejection");
assertIncludes(routeText, "new SqliteDatabase(dbPath, { readonly: true", "GET readonly DB open");
assertNotIncludes(routeText, "provider_openai_call_now: true", "route no provider");
assertNotIncludes(routeText, "product_write_now: true", "route no product write");

assert.equal(fixture.fixture_version, "runtime_audit_panel_runtime_completion.sample.v0.1");
assert.equal(fixture.store_version, storeVersion);
assert.equal(fixture.route_version, routeVersion);
assert.equal(fixture.model_version, modelVersion);
assert.equal(fixture.event_version, eventVersion);
assert.equal(fixture.scope, scope);
assert.ok(fixture.safe_audit_event_create_request_example, "fixture create request");
assert.ok(fixture.safe_audit_event_result_example, "fixture create result");
assert.ok(fixture.safe_audit_event_list_result_example, "fixture list result");
assert.ok(fixture.audit_model_summary_example, "fixture model summary");
assert.ok(fixture.grouped_by_surface_example, "fixture grouped surfaces");
assert.ok(fixture.idempotent_existing_example, "fixture idempotent example");
assert.ok(fixture.conflict_existing_audit_event_example, "fixture conflict example");
assertSafeMarkersOnlyInBlockedExamples(fixture);
assertNoLiveLookingPayloads(fixtureText, "fixture");
assertAuthorityBoundary(fixture.authority_boundary_sample, "fixture authority", { readNow: true });

assert.equal(store.isSafeRuntimeAuditDbPathV01(".tmp/runtime-audit/ui/runtime-audit.sqlite"), true);
for (const badPath of [
  "/tmp/runtime-audit.sqlite",
  "../runtime-audit.sqlite",
  "tmp/runtime-audit/not-sqlite.txt",
  "tmp/runtime-audit/secret-token-runtime-audit.sqlite",
  "https://example.invalid/runtime-audit.sqlite",
]) {
  assert.equal(store.isSafeRuntimeAuditDbPathV01(badPath), false, `unsafe path ${badPath}`);
}

rmSync(dbPath, { force: true });
mkdirSync(dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
try {
  store.ensureRuntimeAuditEventSchemaV01(db);
  assert.equal(store.runtimeAuditEventSchemaExistsV01(db), true, "schema exists after ensure");

  const created = store.createRuntimeAuditEventV01(safeInput(), db);
  assert.equal(created.status, "audit_event_created");
  assert.equal(created.audit_event_persisted, true);
  assertAuthorityBoundary(created.authority_boundary, "created authority", { persistenceNow: true });

  const idempotent = store.createRuntimeAuditEventV01(safeInput(), db);
  assert.equal(idempotent.status, "idempotent_existing");
  assert.equal(countRows(dbPath), 1, "idempotent create does not add row");

  const conflict = store.createRuntimeAuditEventV01(
    safeInput({ bounded_summary: "Changed bounded audit summary for conflict smoke." }),
    db,
  );
  assert.equal(conflict.status, "conflict_existing_audit_event");
  assert.equal(countRows(dbPath), 1, "conflict create does not add row");

  const events = store.listRuntimeAuditEventsV01({ event_surface: "feedback_surfacing_preview_runtime" }, db);
  assert.equal(events.length, 1, "list returns event");
  const read = store.readRuntimeAuditEventV01("audit:event:runtime-audit:smoke:001", db);
  assert.equal(read?.audit_event_id, "audit:event:runtime-audit:smoke:001", "read returns event");

  const summary = model.summarizeRuntimeAuditEventsV01(events);
  assert.equal(summary.event_count, 1);
  assert.equal(summary.status_counts.ok, 1);
  assert.equal(summary.kind_counts.route_response, 1);
  const groups = model.groupRuntimeAuditEventsBySurfaceV01(events);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].event_surface, "feedback_surfacing_preview_runtime");
  const runtimeModel = model.buildRuntimeAuditPanelModelV01(events, {
    audit_id: "runtime-audit:smoke",
    as_of: "2026-06-28T00:00:00.000Z",
  });
  assert.equal(runtimeModel.model_version, modelVersion);
  assert.equal(runtimeModel.status, "built");
  assert.equal(runtimeModel.events.length, 1);
  assertAuthorityBoundary(runtimeModel.authority_boundary, "runtime model authority", { readNow: true });
} finally {
  db.close();
}

const rawRequestBlocked = store.createRuntimeAuditEventV01(
  safeInput({ audit_event_id: "audit:event:blocked:raw-request", raw_request_body: "SAFE_MARKER_RAW_REQUEST_BODY" }),
  new Database(":memory:"),
);
assert.equal(rawRequestBlocked.status, "blocked_private_or_raw_payload");
assertNoUnsafeEcho(rawRequestBlocked, "raw request blocked helper");

const rawResponseBlocked = store.createRuntimeAuditEventV01(
  safeInput({ audit_event_id: "audit:event:blocked:raw-response", raw_response_body: "SAFE_MARKER_RAW_RESPONSE_BODY" }),
  new Database(":memory:"),
);
assert.equal(rawResponseBlocked.status, "blocked_private_or_raw_payload");
assertNoUnsafeEcho(rawResponseBlocked, "raw response blocked helper");

const rawTerminalBlocked = store.createRuntimeAuditEventV01(
  safeInput({ audit_event_id: "audit:event:blocked:raw-terminal", raw_terminal_log: "SAFE_MARKER_RAW_TERMINAL_LOG" }),
  new Database(":memory:"),
);
assert.equal(rawTerminalBlocked.status, "blocked_private_or_raw_payload");
assertNoUnsafeEcho(rawTerminalBlocked, "raw terminal blocked helper");

const hiddenReasoningBlocked = store.createRuntimeAuditEventV01(
  safeInput({ audit_event_id: "audit:event:blocked:hidden-reasoning", hidden_reasoning: "SAFE_MARKER_HIDDEN_REASONING" }),
  new Database(":memory:"),
);
assert.equal(hiddenReasoningBlocked.status, "blocked_private_or_raw_payload");
assertNoUnsafeEcho(hiddenReasoningBlocked, "hidden reasoning blocked helper");

const forbiddenOutsideBoundary = store.createRuntimeAuditEventV01(
  safeInput({
    audit_event_id: "audit:event:blocked:forbidden-authority",
    nested: { product_write_now: true, provider_openai_call_now: "enabled" },
  }),
  new Database(":memory:"),
);
assert.equal(forbiddenOutsideBoundary.status, "blocked_forbidden_authority");
assertNoUnsafeEcho(forbiddenOutsideBoundary, "forbidden authority helper");

rmSync(routeDbPath, { force: true });
const postCreated = await route.POST(routeRequest("POST", "/api/runtime-audit/events", createBody(safeInput())));
assert.equal(postCreated.status, 200);
const postCreatedJson = await postCreated.json();
assert.equal(postCreatedJson.result.status, "audit_event_created");
assert.equal(postCreatedJson.audit_event_persisted, true);
assertAuthorityBoundary(postCreatedJson.authority_boundary, "post created authority", { persistenceNow: true });

const postIdempotent = await route.POST(routeRequest("POST", "/api/runtime-audit/events", createBody(safeInput())));
assert.equal(postIdempotent.status, 200);
const postIdempotentJson = await postIdempotent.json();
assert.equal(postIdempotentJson.result.status, "idempotent_existing");

const postConflict = await route.POST(
  routeRequest(
    "POST",
    "/api/runtime-audit/events",
    createBody(safeInput({ bounded_summary: "Changed route bounded summary for conflict smoke." })),
  ),
);
assert.equal(postConflict.status, 409);
assert.equal((await postConflict.json()).result.status, "conflict_existing_audit_event");
assert.equal(countRows(routeDbPath), 1, "route conflict creates no extra row");

const getListed = await route.GET(
  routeRequest(
    "GET",
    `/api/runtime-audit/events?db_path=${encodeURIComponent(routeDbPath)}&event_surface=feedback_surfacing_preview_runtime&limit=20`,
    null,
  ),
);
assert.equal(getListed.status, 200);
const getListedJson = await getListed.json();
assert.equal(getListedJson.events.length, 1);
assert.equal(getListedJson.audit_model.summary.event_count, 1);
assert.equal(getListedJson.audit_model.grouped_by_surface[0].event_surface, "feedback_surfacing_preview_runtime");
assert.equal(getListedJson.audit_event_read_executed, true);
assert.equal(getListedJson.audit_event_persisted, false);
assertAuthorityBoundary(getListedJson.authority_boundary, "get listed authority", { readNow: true });

rmSync(missingDbPath, { force: true });
const getMissing = await route.GET(
  routeRequest("GET", `/api/runtime-audit/events?db_path=${encodeURIComponent(missingDbPath)}`, null),
);
assert.equal(getMissing.status, 404);
const getMissingJson = await getMissing.json();
assert.equal(getMissingJson.error_code, "db_missing");
assert.equal(existsSync(missingDbPath), false, "GET missing DB creates no file");

rmSync(schemaMissingDbPath, { force: true });
mkdirSync(dirname(schemaMissingDbPath), { recursive: true });
new Database(schemaMissingDbPath).close();
const getSchemaMissing = await route.GET(
  routeRequest("GET", `/api/runtime-audit/events?db_path=${encodeURIComponent(schemaMissingDbPath)}`, null),
);
assert.equal(getSchemaMissing.status, 400);
const getSchemaMissingJson = await getSchemaMissing.json();
assert.equal(getSchemaMissingJson.error_code, "schema_missing");
const schemaMissingDb = new Database(schemaMissingDbPath, { readonly: true, fileMustExist: true });
try {
  assert.equal(store.runtimeAuditEventSchemaExistsV01(schemaMissingDb), false, "GET schema missing creates no schema");
} finally {
  schemaMissingDb.close();
}

const invalidPath = await route.GET(
  routeRequest("GET", "/api/runtime-audit/events?db_path=../runtime-audit.sqlite", null),
);
assert.equal(invalidPath.status, 400);
assert.equal((await invalidPath.json()).error_code, "invalid_db_path");

const crossSite = await route.GET(
  routeRequest(
    "GET",
    `/api/runtime-audit/events?db_path=${encodeURIComponent(routeDbPath)}`,
    null,
    { "sec-fetch-site": "cross-site" },
  ),
);
assert.equal(crossSite.status, 403);
assert.equal((await crossSite.json()).error_code, "same_origin_required");

const postRawBlocked = await route.POST(
  routeRequest(
    "POST",
    "/api/runtime-audit/events",
    createBody(safeInput({ audit_event_id: "audit:event:route:blocked:raw", raw_request_body: "SAFE_MARKER_RAW_REQUEST_BODY" })),
  ),
);
assert.equal(postRawBlocked.status, 400);
const postRawBlockedJson = await postRawBlocked.json();
assert.equal(postRawBlockedJson.result.status, "blocked_private_or_raw_payload");
assertNoUnsafeEcho(postRawBlockedJson, "route raw blocked");

const postForbiddenBlocked = await route.POST(
  routeRequest(
    "POST",
    "/api/runtime-audit/events",
    createBody(
      safeInput({
        audit_event_id: "audit:event:route:blocked:forbidden",
        nested: { product_write_now: true },
      }),
    ),
  ),
);
assert.equal(postForbiddenBlocked.status, 403);
const postForbiddenBlockedJson = await postForbiddenBlocked.json();
assert.equal(postForbiddenBlockedJson.result.status, "blocked_forbidden_authority");
assertNoUnsafeEcho(postForbiddenBlockedJson, "route forbidden blocked");

assertIncludes(componentText, "runtimeMode", "panel route-backed mode");
assertIncludes(componentText, "/api/runtime-audit/events", "panel audit route binding");
assertIncludes(componentText, "method: \"GET\"", "panel uses GET");
assertIncludes(componentText, "DB-backed audit event read model", "panel runtime model summary");
assertIncludes(componentText, "Grouped surface rows", "panel grouped surface rows");
assertIncludes(componentText, "bounded_error", "panel bounded errors");
assertIncludes(componentText, "Runtime authority boundary", "panel authority boundary");
for (const forbiddenControl of [
  "Product write",
  "Create proof",
  "Promote",
  "GitHub PR",
  "Git commit",
  "Execute Codex",
]) {
  assertNotIncludes(componentText, `>${forbiddenControl}<`, "panel forbidden control text");
}
for (const forbiddenSource of [
  "better-sqlite3",
  "node:fs",
  "provider_openai_call_now: true",
  "product_write_now: true",
  "proof_or_evidence_record_now: true",
]) {
  assertNotIncludes(componentText, forbiddenSource, "panel forbidden runtime source");
}

assertNoUnsafeEcho(postCreatedJson, "created response");
assertNoUnsafeEcho(getListedJson, "list response");

console.log(
  JSON.stringify(
    {
      ok: true,
      smoke: "runtime-audit-panel-runtime-completion-v0-1",
      store_version: storeVersion,
      route_version: routeVersion,
      model_version: modelVersion,
      route_events: getListedJson.events.length,
      surface_groups: getListedJson.audit_model.grouped_by_surface.length,
    },
    null,
    2,
  ),
);
