#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";

import Database from "better-sqlite3";

const docsPath = "docs/RUNTIME_AUDIT_SELECTED_ROUTE_INSTRUMENTATION_V0_1.md";
const helperPath = "lib/runtime-audit/route-audit-instrumentation.ts";
const auditStorePath = "lib/runtime-audit/audit-event-store.ts";
const auditRoutePath = "app/api/runtime-audit/events/route.ts";
const fixturePath = "fixtures/runtime-audit-selected-route-instrumentation.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const runtimeAuditPanelDocsPath = "docs/RUNTIME_AUDIT_PANEL_RUNTIME_COMPLETION_V0_1.md";
const sourceRoutePath = "app/api/research-source/intake/route.ts";
const providerRoutePath = "app/api/research-candidate-review/provider-extraction/route.ts";
const ragRoutePath = "app/api/research-retrieval/rag-context-preview/route.ts";
const feedbackRoutePath = "app/api/research-candidate/feedback-events/route.ts";
const surfacingRoutePath = "app/api/research-candidate/feedback-events/surfacing-preview/route.ts";
const boundedSourceFixturePath = "fixtures/bounded-source-intake-runtime-completion.sample.v0.1.json";
const boundedFetchPath = "lib/research-source/fetch-bounded-source.ts";
const boundedIntakePath = "lib/research-source/intake-runtime.ts";

const instrumentationVersion = "runtime_audit_selected_route_instrumentation.v0.1";
const auditStoreVersion = "runtime_audit_event_store.v0.1";
const scope = "project:augnes";
const routeVersion = "bounded_source_intake_runtime_completion_route.v0.1";
const feedbackRouteVersion = "feedback_controls_expansion_runtime_completion_route.v0.1";
const auditDbPath = `.tmp/runtime-audit/selected-route-smoke-${process.pid}.sqlite`;
const distinctAuditDbPath = `.tmp/runtime-audit/selected-route-distinct-${process.pid}.sqlite`;
const sourceAuditDbPath = `.tmp/runtime-audit/source-route-smoke-${process.pid}.sqlite`;
const feedbackDbPath = `.tmp/feedback-event-aggregation/selected-route-feedback-${process.pid}.sqlite`;
const feedbackAuditDbPath = `.tmp/runtime-audit/feedback-route-smoke-${process.pid}.sqlite`;
const noAuditDbPath = `.tmp/runtime-audit/no-audit-route-smoke-${process.pid}.sqlite`;

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

function request(path, body) {
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

function baseAuditInput(overrides = {}) {
  return {
    audit_db_path: auditDbPath,
    route_ref: "route:/api/research-source/intake",
    runtime_slice_ref: "bounded_source_intake_runtime_completion_v0_1",
    event_surface: "source_intake_runtime",
    event_kind: "route_response",
    event_action: "source_intake_completed",
    event_status: "accepted_bounded_summary",
    subject_ref: "source-ref:bounded-intake:smoke",
    related_refs: ["url-locator-ref:bounded-intake:smoke"],
    created_by: "route:runtime-audit-selected-route-smoke",
    created_at: "2026-06-28T00:00:00.000Z",
    bounded_summary: "Bounded source intake route returned source_ref metadata.",
    primary_result_status: "accepted_bounded_summary",
    primary_result_ref: "source-ref:bounded-intake:smoke",
    authority_boundary: {},
    ...overrides,
  };
}

function feedbackInput(overrides = {}) {
  return {
    request_version: "feedback_event_write_runtime_request.v0.1",
    event_version: "feedback_event_write_runtime_event.v0.1",
    scope,
    feedback_event_id: "feedback-event:audit-instrumentation:pin:001",
    feedback_kind: "pin",
    target_ref: "candidate:audit-instrumentation:001",
    target_kind: "research_candidate_review",
    target_layer: "candidate",
    target_fingerprint: "target-fingerprint:audit-instrumentation:001",
    source_refs: ["source-ref:audit-instrumentation:public-summary"],
    candidate_ref: "candidate:audit-instrumentation:001",
    feedback_summary: "Operator pinned this candidate for audit instrumentation smoke.",
    created_by: "operator:audit-instrumentation",
    created_at: "2026-06-28T00:00:00.000Z",
    idempotency_key: "feedback-event-idempotency:audit-instrumentation:pin:001",
    authority_boundary: {},
    reason_codes: [
      "feedback_controls_runtime_completion",
      "explicit_operator_feedback_action",
      "advisory_signal_only",
    ],
    ...overrides,
  };
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
    "../runtime-audit.sqlite",
    "secret-token-runtime-audit.sqlite",
  ]) {
    assertNotIncludes(text, marker, label);
  }
}

function assertSafeMarkersOnlyInSkippedExamples(value, path = []) {
  if (typeof value === "string" && value.includes("SAFE_MARKER_")) {
    assert.ok(
      path.some((segment) => {
        const key = String(segment);
        return key.startsWith("audit_skipped_") || key.startsWith("blocked_");
      }),
      `SAFE_MARKER appears outside skipped/blocked example at ${path.join(".")}`,
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

function assertAuthorityBoundary(boundary, label) {
  for (const field of [
    "runtime_audit_selected_route_instrumentation_now",
    "runtime_audit_event_persistence_now",
    "selected_route_subset_only",
    "audit_db_path_optional",
  ]) {
    assert.equal(boundary[field], true, `${label}.${field} must be true`);
  }
  for (const field of [
    "primary_route_failure_from_audit_now",
    "raw_request_body_stored_now",
    "raw_response_body_stored_now",
    "raw_terminal_log_stored_now",
    "browser_dump_ingested_now",
    "hidden_reasoning_stored_now",
    "raw_provider_output_stored_now",
    "raw_retrieval_output_stored_now",
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
    "git_write_now",
    "github_api_call_now",
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

for (const path of [
  docsPath,
  helperPath,
  auditStorePath,
  auditRoutePath,
  fixturePath,
  packagePath,
  indexPath,
  runtimeAuditPanelDocsPath,
  sourceRoutePath,
  providerRoutePath,
  ragRoutePath,
  feedbackRoutePath,
  surfacingRoutePath,
]) {
  assert.ok(existsSync(path), `${path} exists`);
}

const docs = readText(docsPath);
const helperText = readText(helperPath);
const index = readText(indexPath);
const fixtureText = readText(fixturePath);
const fixture = readJson(fixturePath);
const packageJson = readJson(packagePath);
const sourceRouteText = readText(sourceRoutePath);
const providerRouteText = readText(providerRoutePath);
const ragRouteText = readText(ragRoutePath);
const feedbackRouteText = readText(feedbackRoutePath);
const surfacingRouteText = readText(surfacingRoutePath);
const boundedFixture = readJson(boundedSourceFixturePath);

const helper = await import(pathToFileURL(`${process.cwd()}/${helperPath}`).href);
const auditStore = await import(pathToFileURL(`${process.cwd()}/${auditStorePath}`).href);
const sourceRoute = await import(pathToFileURL(`${process.cwd()}/${sourceRoutePath}`).href);
const feedbackRoute = await import(pathToFileURL(`${process.cwd()}/${feedbackRoutePath}`).href);
const boundedFetch = await import(pathToFileURL(`${process.cwd()}/${boundedFetchPath}`).href);
const boundedIntake = await import(pathToFileURL(`${process.cwd()}/${boundedIntakePath}`).href);

assert.equal(
  packageJson.scripts["smoke:runtime-audit-selected-route-instrumentation-v0-1"],
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-runtime-audit-selected-route-instrumentation-v0-1.mjs",
  "package script",
);
assertIncludes(index, "Runtime Audit Selected Route Instrumentation v0.1", "index pointer");
assertIncludes(docs, "This slice instruments only a selected route subset.", "docs selected subset");
assertIncludes(docs, "Missing `audit_db_path` keeps primary route behavior unchanged.", "docs no-op");
assertIncludes(docs, "Audit write failure does not fail the primary route.", "docs failure isolation");
assertIncludes(docs, "This slice does not store raw request bodies.", "docs raw request exclusion");
assertIncludes(docs, "Product-write remains parked by #686.", "docs product-write parked");
assertIncludes(docs, "The roadmap guide is not SSOT.", "docs roadmap not ssot");

assert.equal(fixture.fixture_version, "runtime_audit_selected_route_instrumentation.sample.v0.1");
assert.equal(fixture.instrumentation_version, instrumentationVersion);
assert.equal(fixture.audit_event_store_version, auditStoreVersion);
assert.equal(fixture.scope, scope);
assert.equal(fixture.selected_routes.length, 5);
assertSafeMarkersOnlyInSkippedExamples(fixture);
assertAuthorityBoundary(fixture.authority_boundary_sample, "fixture authority");

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
  [sourceRoutePath, sourceRouteText],
  [providerRoutePath, providerRouteText],
  [ragRoutePath, ragRouteText],
  [feedbackRoutePath, feedbackRouteText],
  [surfacingRoutePath, surfacingRouteText],
]) {
  assertIncludes(routeSource, "maybeWriteRuntimeRouteAuditEventV01", `${routePath} instrumentation call`);
  assertIncludes(routeSource, "audit_db_path", `${routePath} top-level audit_db_path`);
  assertIncludes(routeSource, "audit_event_result", `${routePath} response audit result`);
  assertNotIncludes(routeSource, "raw_request_body", `${routePath} no raw request body storage`);
  assertNotIncludes(routeSource, "raw_response_body", `${routePath} no raw response body storage`);
}

rmSync(auditDbPath, { force: true });
const notRequested = helper.maybeWriteRuntimeRouteAuditEventV01(
  baseAuditInput({ audit_db_path: undefined }),
);
assert.equal(notRequested.status, "audit_not_requested");
assert.equal(existsSync(auditDbPath), false, "missing audit_db_path creates no DB");

const invalidPath = helper.maybeWriteRuntimeRouteAuditEventV01(
  baseAuditInput({ audit_db_path: "../runtime-audit.sqlite" }),
);
assert.equal(invalidPath.status, "audit_skipped_invalid_db_path");
assertNoUnsafeEcho(invalidPath, "invalid path audit result");

const privatePayload = helper.maybeWriteRuntimeRouteAuditEventV01(
  baseAuditInput({
    audit_db_path: auditDbPath,
    bounded_summary: "SAFE_MARKER_RAW_REQUEST_BODY",
  }),
);
assert.equal(privatePayload.status, "audit_skipped_private_or_raw_payload");
assertNoUnsafeEcho(privatePayload, "private payload audit result");

const forbiddenAuthority = helper.maybeWriteRuntimeRouteAuditEventV01(
  baseAuditInput({
    audit_db_path: auditDbPath,
    authority_boundary: { product_write_now: true },
  }),
);
assert.equal(forbiddenAuthority.status, "audit_skipped_forbidden_authority");

mkdirSync(dirname(auditDbPath), { recursive: true });
const created = helper.maybeWriteRuntimeRouteAuditEventV01(baseAuditInput());
assert.equal(created.status, "audit_event_created");
assert.equal(created.audit_event_persisted, true);
assertAuthorityBoundary(created.authority_boundary, "created authority");
const repeated = helper.maybeWriteRuntimeRouteAuditEventV01(baseAuditInput());
assert.equal(repeated.status, "idempotent_existing");
assert.equal(countAuditEvents(auditDbPath), 1);

rmSync(distinctAuditDbPath, { force: true });
const distinctFirstInput = baseAuditInput({
  audit_db_path: distinctAuditDbPath,
  subject_ref: "source-ref:bounded-intake:same-subject",
  primary_result_ref: "source-ref:bounded-intake:route-result:001",
});
const distinctSecondInput = baseAuditInput({
  audit_db_path: distinctAuditDbPath,
  subject_ref: "source-ref:bounded-intake:same-subject",
  primary_result_ref: "source-ref:bounded-intake:route-result:002",
});
const distinctFirst = helper.maybeWriteRuntimeRouteAuditEventV01(distinctFirstInput);
const distinctSecond = helper.maybeWriteRuntimeRouteAuditEventV01(distinctSecondInput);
assert.equal(distinctFirst.status, "audit_event_created");
assert.equal(distinctSecond.status, "audit_event_created");
assert.notEqual(
  distinctFirst.audit_event_id,
  distinctSecond.audit_event_id,
  "different primary_result_ref values create distinct audit ids",
);
assert.equal(countAuditEvents(distinctAuditDbPath), 2);
const distinctFirstRepeat = helper.maybeWriteRuntimeRouteAuditEventV01(distinctFirstInput);
assert.equal(distinctFirstRepeat.status, "idempotent_existing");
assert.equal(countAuditEvents(distinctAuditDbPath), 2);

const writeFailurePath = `.tmp/runtime-audit/write-failure-${process.pid}.sqlite`;
rmSync(writeFailurePath, { recursive: true, force: true });
mkdirSync(writeFailurePath, { recursive: true });
const writeFailure = helper.maybeWriteRuntimeRouteAuditEventV01(
  baseAuditInput({ audit_db_path: writeFailurePath }),
);
assert.equal(writeFailure.status, "audit_write_failed_bounded");
assert.equal(writeFailure.audit_event_persisted, false);

rmSync(sourceAuditDbPath, { force: true });
const sourceFetcher = boundedFetch.createMockBoundedSourceFetcherV01([
  {
    ...boundedFixture.mock_fetch_success_example,
    source_ref_id: boundedIntake.createBoundedSourceRefIdV01(boundedFixture.safe_url_request_example),
  },
]);
const sourceHandler = sourceRoute.createBoundedSourceIntakeRuntimeCompletionPostHandlerV01({
  fetcher: sourceFetcher,
});
const sourceWithAuditResponse = await sourceHandler(
  request("/api/research-source/intake", {
    route_version: routeVersion,
    scope,
    audit_db_path: sourceAuditDbPath,
    input: boundedFixture.safe_url_request_example,
  }),
);
assert.equal(sourceWithAuditResponse.status, 200);
const sourceWithAudit = await sourceWithAuditResponse.json();
assert.equal(sourceWithAudit.result.status, "accepted_bounded_summary");
assert.equal(sourceWithAudit.audit_event_result.status, "audit_event_created");
assert.equal(countAuditEvents(sourceAuditDbPath), 1);

rmSync(noAuditDbPath, { force: true });
const sourceNoAuditResponse = await sourceHandler(
  request("/api/research-source/intake", {
    route_version: routeVersion,
    scope,
    input: boundedFixture.safe_url_request_example,
  }),
);
assert.equal(sourceNoAuditResponse.status, 200);
const sourceNoAudit = await sourceNoAuditResponse.json();
assert.equal(sourceNoAudit.result.status, "accepted_bounded_summary");
assert.equal(sourceNoAudit.audit_event_result.status, "audit_not_requested");
assert.equal(existsSync(noAuditDbPath), false, "route without audit path creates no audit DB");

const sourcePrivateResponse = await sourceHandler(
  request("/api/research-source/intake", {
    route_version: routeVersion,
    scope,
    input: boundedFixture.blocked_private_or_raw_payload_example,
  }),
);
assert.equal(sourcePrivateResponse.status, 400);
assert.equal((await sourcePrivateResponse.json()).result.status, "blocked_private_or_raw_payload");

rmSync(feedbackDbPath, { force: true });
rmSync(feedbackAuditDbPath, { force: true });
const feedbackWithAuditResponse = await feedbackRoute.POST(
  request("/api/research-candidate/feedback-events", {
    route_version: feedbackRouteVersion,
    scope,
    action: "create_feedback_event",
    db_path: feedbackDbPath,
    audit_db_path: feedbackAuditDbPath,
    input: feedbackInput(),
  }),
);
assert.equal(feedbackWithAuditResponse.status, 201);
const feedbackWithAudit = await feedbackWithAuditResponse.json();
assert.equal(feedbackWithAudit.result.status, "feedback_event_created");
assert.equal(feedbackWithAudit.audit_event_result.status, "audit_event_created");
assert.equal(countAuditEvents(feedbackAuditDbPath), 1);

const secondFeedbackWithAuditResponse = await feedbackRoute.POST(
  request("/api/research-candidate/feedback-events", {
    route_version: feedbackRouteVersion,
    scope,
    action: "create_feedback_event",
    db_path: feedbackDbPath,
    audit_db_path: feedbackAuditDbPath,
    input: feedbackInput({
      feedback_event_id: "feedback-event:audit-instrumentation:pin:002",
      idempotency_key: "feedback-event-idempotency:audit-instrumentation:pin:002",
      feedback_summary: "Operator pinned the same target again for distinct audit result smoke.",
    }),
  }),
);
assert.equal(secondFeedbackWithAuditResponse.status, 201);
const secondFeedbackWithAudit = await secondFeedbackWithAuditResponse.json();
assert.equal(secondFeedbackWithAudit.result.status, "feedback_event_created");
assert.equal(secondFeedbackWithAudit.audit_event_result.status, "audit_event_created");
assert.notEqual(
  feedbackWithAudit.audit_event_result.audit_event_id,
  secondFeedbackWithAudit.audit_event_result.audit_event_id,
  "same feedback target/status with different feedback_event_id produces distinct audit ids",
);
assert.equal(countAuditEvents(feedbackAuditDbPath), 2);

const emitted = readAuditEvents(feedbackAuditDbPath);
assert.equal(emitted.length, 2);
const emittedIds = new Set(emitted.map((event) => event.audit_event_id));
assert.equal(emittedIds.size, 2, "feedback route emits two distinct audit events");
for (const event of emitted) {
  assert.equal(event.event_surface, "feedback_event_write_runtime");
  assert.equal(event.bounded_summary, "Feedback event write route persisted bounded feedback signal.");
  assert.equal(event.authority_boundary.audit_event_is_truth, false);
  assert.equal(event.authority_boundary.audit_event_is_proof, false);
  assert.equal(event.authority_boundary.audit_event_is_approval, false);
  assert.equal(event.authority_boundary.audit_event_is_durable_state, false);
  assert.equal(event.authority_boundary.audit_event_is_product_write_authority, false);
}
assertNoUnsafeEcho(emitted, "emitted audit events");

const feedbackNoAuditResponse = await feedbackRoute.POST(
  request("/api/research-candidate/feedback-events", {
    route_version: feedbackRouteVersion,
    scope,
    action: "create_feedback_event",
    db_path: feedbackDbPath,
    input: feedbackInput({
      feedback_event_id: "feedback-event:audit-instrumentation:pin:003",
      idempotency_key: "feedback-event-idempotency:audit-instrumentation:pin:003",
    }),
  }),
);
assert.equal(feedbackNoAuditResponse.status, 201);
assert.equal((await feedbackNoAuditResponse.json()).audit_event_result.status, "audit_not_requested");

rmSync(".tmp", { recursive: true, force: true });

for (const command of [
  "smoke:runtime-audit-panel-runtime-completion-v0-1",
  "smoke:bounded-source-intake-runtime-completion-v0-1",
  "smoke:feedback-controls-expansion-runtime-completion-v0-1",
]) {
  execFileSync("npm", ["run", command], { stdio: "pipe" });
}

console.log(
  JSON.stringify(
    {
      ok: true,
      smoke: "runtime-audit-selected-route-instrumentation-v0-1",
      instrumentation_version: instrumentationVersion,
      helper_status: created.status,
      source_route_audit_status: sourceWithAudit.audit_event_result.status,
      feedback_route_audit_status: feedbackWithAudit.audit_event_result.status,
      emitted_audit_events: emitted.length,
    },
    null,
    2,
  ),
);
