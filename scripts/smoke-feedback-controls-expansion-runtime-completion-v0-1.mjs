#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, rmSync, unlinkSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";

import Database from "better-sqlite3";

const docsPath = "docs/FEEDBACK_CONTROLS_EXPANSION_RUNTIME_COMPLETION_V0_1.md";
const legacyDocsPath = "docs/FEEDBACK_CONTROLS_EXPANSION_V0_1.md";
const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const helperPath = "lib/research-candidate-review/feedback-event-write-runtime.ts";
const aggregationHelperPath = "lib/research-candidate-review/feedback-event-aggregation-runtime.ts";
const routePath = "app/api/research-candidate/feedback-events/route.ts";
const componentPath = "components/feedback-event-expanded-controls.tsx";
const fixturePath = "fixtures/feedback-controls-expansion-runtime-completion.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const routeVersion = "feedback_controls_expansion_runtime_completion_route.v0.1";
const requestVersion = "feedback_event_write_runtime_request.v0.1";
const eventVersion = "feedback_event_write_runtime_event.v0.1";
const runtimeVersion = "feedback_event_write_runtime.v0.1";
const uiVersion = "feedback_controls_expansion_runtime_completion.v0.1";
const scope = "project:augnes";
const dbPath = `.tmp/feedback-event-aggregation/smoke-feedback-controls-runtime-${process.pid}.sqlite`;
const routeDbPath = `.tmp/feedback-event-aggregation/smoke-feedback-controls-route-${process.pid}.sqlite`;

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

function assertAuthorityBoundary(boundary, label) {
  for (const field of [
    "feedback_controls_runtime_completion_now",
    "explicit_operator_feedback_action_only",
    "same_origin_post_route_now",
    "caller_injected_db_only",
    "feedback_event_write_now",
    "feedback_event_persistence_now",
    "advisory_signal_only",
    "callback_compatibility_preserved",
  ]) {
    assert.equal(boundary[field], true, `${label}.${field} must be true`);
  }
  for (const field of [
    "automatic_feedback_write_on_load_now",
    "hidden_feedback_write_now",
    "feedback_is_truth",
    "pin_is_promotion",
    "dismiss_is_delete",
    "invalidate_is_source_suppression",
    "rule_mutation_now",
    "parser_mutation_now",
    "prompt_mutation_now",
    "ranking_mutation_now",
    "surfacing_mutation_now",
    "source_suppression_now",
    "candidate_delete_now",
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
    assert.equal(boundary[field], false, `${label}.${field} must be false`);
  }
}

function safeInput(overrides = {}) {
  return {
    request_version: requestVersion,
    event_version: eventVersion,
    scope,
    feedback_event_id: "feedback-event:controls-runtime:pin:001",
    feedback_kind: "pin",
    target_ref: "candidate:controls-runtime:001",
    target_kind: "research_candidate_review",
    target_layer: "candidate",
    target_fingerprint: "target-fingerprint:controls-runtime:001",
    source_refs: ["source-ref:controls-runtime:public-summary"],
    candidate_ref: "candidate:controls-runtime:001",
    feedback_summary: "Operator pinned this candidate for follow-up review.",
    created_by: "operator:feedback-controls-runtime",
    created_at: "2026-06-28T00:00:00.000Z",
    idempotency_key: "feedback-event-idempotency:controls-runtime:pin:001",
    authority_boundary: helper.createFeedbackEventWriteRuntimeAuthorityBoundaryV01(),
    reason_codes: [
      "feedback_controls_runtime_completion",
      "explicit_operator_feedback_action",
      "advisory_signal_only",
    ],
    ...overrides,
  };
}

function routeRequest(body, headers = {}) {
  return new Request("https://augnes.local.test/api/research-candidate/feedback-events", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "augnes.local.test",
      "sec-fetch-site": "same-origin",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function completionBody(input, path = routeDbPath) {
  return {
    route_version: routeVersion,
    scope,
    action: "create_feedback_event",
    db_path: path,
    input,
  };
}

function countRows(path) {
  const db = new Database(path, { readonly: true, fileMustExist: true });
  try {
    return db.prepare("SELECT COUNT(*) AS count FROM research_candidate_feedback_events").get().count;
  } finally {
    db.close();
  }
}

function assertNoUnsafeEcho(value) {
  const text = JSON.stringify(value);
  for (const marker of [
    "SAFE_MARKER_RAW_SOURCE_BODY",
    "SAFE_MARKER_SECRET_TOKEN",
    "../feedback-events.sqlite",
    "secret-token-feedback.sqlite",
  ]) {
    assertNotIncludes(text, marker, "route/helper response");
  }
}

function assertSafeMarkersOnlyInBlockedExamples(value, path = []) {
  if (typeof value === "string" && value.includes("SAFE_MARKER_")) {
    assert.ok(
      path.some((segment) => String(segment).startsWith("blocked_")),
      `SAFE_MARKER appears outside blocked example at ${path.join(".")}`,
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

const docs = readText(docsPath);
const legacyDocs = readText(legacyDocsPath);
const roadmap = readText(roadmapPath);
const helperText = readText(helperPath);
const aggregationText = readText(aggregationHelperPath);
const routeText = readText(routePath);
const componentText = readText(componentPath);
const fixture = readJson(fixturePath);
const fixtureText = readText(fixturePath);
const packageJson = readJson(packagePath);
const index = readText(indexPath);

const helper = await import(pathToFileURL(helperPath).href);
const aggregation = await import(pathToFileURL(aggregationHelperPath).href);
const route = await import(pathToFileURL(routePath).href);

assert.ok(existsSync(docsPath), "docs file exists");
assert.ok(existsSync(helperPath), "write runtime helper exists");
assert.ok(existsSync(routePath), "route file exists");
assert.ok(existsSync(componentPath), "component file exists");
assert.ok(existsSync(fixturePath), "fixture exists");
assert.equal(
  packageJson.scripts["smoke:feedback-controls-expansion-runtime-completion-v0-1"],
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-feedback-controls-expansion-runtime-completion-v0-1.mjs",
  "package script exists",
);

for (const pointer of [docsPath, helperPath, routePath, componentPath, fixturePath]) {
  assertIncludes(index, pointer, indexPath);
}
assertIncludes(index, "feedback_controls_expansion_runtime_completion_v0_1", indexPath);
assertIncludes(roadmap, "feedback_controls_expansion_v0_1", roadmapPath);
assertIncludes(roadmap, "dismiss_preview", roadmapPath);
assertIncludes(roadmap, "scope_overreach", roadmapPath);
assertIncludes(legacyDocs, "Callback-only feedback intent emission", legacyDocsPath);

for (const phrase of [
  "This slice closes the original Phase 5.6 feedback controls runtime gap.",
  "The earlier callback-only controls remain compatible but were not full runtime completion.",
  "Feedback controls write bounded feedback events only after explicit operator action.",
  "Feedback is not truth.",
  "Pin is not promotion.",
  "Dismiss is not delete.",
  "Invalidate is not source suppression.",
  "Correct does not mutate parser or rules.",
  "Scope-overreach creates review signal only.",
  "Needs more evidence creates review signal only.",
  "Product-write remains parked by #686.",
  "The roadmap guide is not SSOT.",
]) {
  assertIncludes(docs, phrase, docsPath);
}

for (const requiredExport of [
  "validateFeedbackEventWriteRuntimeInputV01",
  "createFeedbackEventWriteRuntimeAuthorityBoundaryV01",
  "writeFeedbackEventRuntimeV01",
  "createFeedbackEventRuntimeRecordV01",
  "createFeedbackEventRuntimeIdempotencyKeyV01",
  "isSafeFeedbackEventWriteRuntimeDbPathV01",
]) {
  assert.equal(typeof helper[requiredExport], "function", `${requiredExport} export`);
  assertIncludes(helperText, requiredExport, helperPath);
}
assert.equal(typeof route.POST, "function", "route exports POST");
assertIncludes(routeText, "FEEDBACK_EVENT_WRITE_RUNTIME_ROUTE_VERSION", routePath);
assertIncludes(routeText, "requestHasSameOriginBoundary", routePath);
assertIncludes(routeText, "new SqliteDatabase", routePath);
assertIncludes(routeText, "writeFeedbackEventRuntimeV01", routePath);

assert.equal(fixture.fixture_version, "feedback_controls_expansion_runtime_completion.sample.v0.1");
assert.equal(fixture.ui_version, uiVersion);
assert.equal(fixture.route_version, routeVersion);
assert.equal(fixture.write_runtime_version, runtimeVersion);
assert.equal(fixture.scope, scope);
for (const key of [
  "feedback_control_action_examples",
  "route_backed_ui_state_example",
  "callback_compatibility_state_example",
  "safe_create_feedback_event_request_example",
  "expected_created_response_example",
  "idempotent_existing_example",
  "conflict_existing_feedback_event_example",
  "blocked_private_or_raw_payload_example",
  "blocked_forbidden_authority_example",
  "invalid_feedback_event_example",
  "forbidden_control_examples",
  "authority_boundary_sample",
]) {
  assert.ok(fixture[key], `fixture includes ${key}`);
}
assert.equal(helper.isSafeFeedbackEventWriteRuntimeDbPathV01(fixture.safe_db_path_examples[0]), true);
for (const unsafePath of fixture.unsafe_db_path_examples) {
  assert.equal(helper.isSafeFeedbackEventWriteRuntimeDbPathV01(unsafePath), false, `${unsafePath} rejected`);
}
assertSafeMarkersOnlyInBlockedExamples(fixture);
for (const marker of ["/Users/", "/home/", "sk-", "ghp_", "OPENAI_API_KEY", "GITHUB_TOKEN"]) {
  assertNotIncludes(fixtureText.replace(/SAFE_MARKER_[A-Z_]+/g, ""), marker, fixturePath);
}

assertIncludes(componentText, "persistenceMode = \"callback_only\"", componentPath);
assertIncludes(componentText, "persistenceMode === \"route_backed\"", componentPath);
assertIncludes(componentText, "fetch(feedbackEventWriteRoutePath", componentPath);
assertIncludes(componentText, "method: \"POST\"", componentPath);
assertIncludes(componentText, "/api/research-candidate/feedback-events", componentPath);
assertNotIncludes(componentText, "/api/research-candidate/feedback-events/aggregation", componentPath);
assertIncludes(componentText, "onFeedbackIntent?.(payload)", componentPath);
assertIncludes(componentText, "Callback-only feedback intent emission", componentPath);
assertIncludes(componentText, "Local/dev feedback event DB path", componentPath);
assertIncludes(componentText, "Feedback controls route authority boundary", componentPath);
assertIncludes(componentText, "Product-write remains parked by #686", componentPath);
for (const control of [
  "pin_preview",
  "dismiss_preview",
  "correct_preview",
  "invalidate_preview",
  "needs_more_evidence",
  "scope_overreach",
  "not_relevant_now",
  "mark_useful",
  "mark_wrong",
]) {
  assertIncludes(componentText, control, componentPath);
}
for (const forbiddenControl of [
  "Promote",
  "Create proof",
  "Create evidence",
  "Delete candidate",
  "Suppress source",
  "Apply rule",
  "Mutate parser",
  "Product write",
  "Allocate product ID",
  "GitHub PR",
  "Git commit",
  "Execute Codex",
]) {
  assertNotIncludes(componentText, forbiddenControl, componentPath);
}
for (const forbiddenComponentPattern of [
  "better-sqlite3",
  "openDatabase",
  "new Database",
  "from \"node:fs\"",
  "from 'node:fs'",
  "OpenAI",
  "api.github.com",
  "executeCodex",
  "productWrite",
]) {
  assertNotIncludes(componentText, forbiddenComponentPattern, componentPath);
}

assertAuthorityBoundary(helper.createFeedbackEventWriteRuntimeAuthorityBoundaryV01(), "helper authority");
assertAuthorityBoundary(fixture.authority_boundary_sample, "fixture authority");

for (const safePath of [dbPath, routeDbPath]) {
  if (existsSync(safePath)) unlinkSync(safePath);
  const directory = dirname(safePath);
  if (!existsSync(directory)) mkdirSync(directory, { recursive: true });
}

{
  const db = new Database(dbPath);
  try {
    const created = helper.writeFeedbackEventRuntimeV01(safeInput(), db);
    assert.equal(created.status, "feedback_event_created");
    assert.equal(created.feedback_event_persisted, true);
    assert.equal(created.aggregation_executed, false);
    assert.equal(created.rule_mutation_executed, false);
    assert.equal(created.parser_mutation_executed, false);
    assert.equal(created.prompt_mutation_executed, false);
    assert.equal(created.ranking_mutation_executed, false);
    assert.equal(created.surfacing_mutation_executed, false);
    assert.equal(created.source_suppression_executed, false);
    assert.equal(created.candidate_deleted, false);
    assert.equal(created.proof_or_evidence_created, false);
    assert.equal(created.product_write_executed, false);
    assertAuthorityBoundary(created.authority_boundary, "created authority");
    assert.equal(countRows(dbPath), 1);

    const repeated = helper.writeFeedbackEventRuntimeV01(safeInput(), db);
    assert.equal(repeated.status, "idempotent_existing");
    assert.equal(countRows(dbPath), 1);

    const conflict = helper.writeFeedbackEventRuntimeV01(
      safeInput({
        feedback_event_id: "feedback-event:controls-runtime:pin:conflict",
        feedback_summary: "Changed summary with same idempotency key.",
      }),
      db,
    );
    assert.equal(conflict.status, "conflict_existing_feedback_event");
    assert.equal(countRows(dbPath), 1);

    const blockedRaw = helper.writeFeedbackEventRuntimeV01(
      safeInput({
        feedback_event_id: "feedback-event:controls-runtime:blocked-raw",
        idempotency_key: "feedback-event-idempotency:controls-runtime:blocked-raw",
        feedback_summary: "SAFE_MARKER_RAW_SOURCE_BODY",
      }),
      db,
    );
    assert.equal(blockedRaw.status, "blocked_private_or_raw_payload");
    assert.equal(countRows(dbPath), 1);
    assertNoUnsafeEcho(blockedRaw);

    const blockedAuthority = helper.writeFeedbackEventRuntimeV01(
      safeInput({
        feedback_event_id: "feedback-event:controls-runtime:blocked-authority",
        idempotency_key: "feedback-event-idempotency:controls-runtime:blocked-authority",
        rule_mutation_now: "enabled",
        nested: { candidate_delete_now: 1 },
      }),
      db,
    );
    assert.equal(blockedAuthority.status, "blocked_forbidden_authority");
    assert.equal(countRows(dbPath), 1);
    assertNoUnsafeEcho(blockedAuthority);

    const invalid = helper.writeFeedbackEventRuntimeV01(
      safeInput({
        feedback_event_id: "feedback-event:controls-runtime:invalid",
        idempotency_key: "feedback-event-idempotency:controls-runtime:invalid",
        feedback_kind: "dismiss",
        reason: "",
      }),
      db,
    );
    assert.equal(invalid.status, "blocked_invalid_input");
    assert.equal(countRows(dbPath), 1);

    const aggregated = aggregation.aggregateFeedbackEventsRuntimeCompletionV01(
      {
        request_version: "feedback_event_aggregation_runtime_completion_request.v0.1",
        aggregation_version: "feedback_event_aggregation_runtime_completion.v0.1",
        scope,
        aggregation_request_id: "feedback-aggregation:controls-runtime:001",
        requested_by: "operator:feedback-controls-runtime",
        requested_at: "2026-06-28T00:01:00.000Z",
        db_path: dbPath,
        filters: { target_ref: "candidate:controls-runtime:001" },
        reason_codes: ["feedback_controls_runtime_completion_smoke"],
      },
      { db },
    );
    assert.equal(aggregated.status, "aggregated");
    assert.equal(aggregated.aggregations[0].pin_count, 1);
    assert.equal(aggregated.feedback_is_truth, false);
    assert.equal(aggregated.pin_is_promotion, false);
  } finally {
    db.close();
  }
}

{
  const crossSite = await route.POST(
    routeRequest(completionBody(safeInput({ feedback_event_id: "feedback-event:route:cross-site" })), {
      "sec-fetch-site": "cross-site",
    }),
  );
  const crossBody = await crossSite.json();
  assert.equal(crossSite.status, 403);
  assert.equal(crossBody.error_code, "same_origin_required");

  const createResponse = await route.POST(routeRequest(completionBody(safeInput({
    feedback_event_id: "feedback-event:route:pin:001",
    idempotency_key: "feedback-event-idempotency:route:pin:001",
  }))));
  const createBody = await createResponse.json();
  assert.equal(createResponse.status, 201);
  assert.equal(createBody.status, "ok");
  assert.equal(createBody.result.status, "feedback_event_created");
  assert.equal(createBody.feedback_event_persisted, true);
  assert.equal(countRows(routeDbPath), 1);

  const idempotentResponse = await route.POST(routeRequest(completionBody(safeInput({
    feedback_event_id: "feedback-event:route:pin:001",
    idempotency_key: "feedback-event-idempotency:route:pin:001",
  }))));
  const idempotentBody = await idempotentResponse.json();
  assert.equal(idempotentResponse.status, 200);
  assert.equal(idempotentBody.result.status, "idempotent_existing");
  assert.equal(countRows(routeDbPath), 1);

  const conflictResponse = await route.POST(routeRequest(completionBody(safeInput({
    feedback_event_id: "feedback-event:route:pin:002",
    idempotency_key: "feedback-event-idempotency:route:pin:001",
    feedback_summary: "Conflicting event for same idempotency key.",
  }))));
  const conflictBody = await conflictResponse.json();
  assert.equal(conflictResponse.status, 409);
  assert.equal(conflictBody.result.status, "conflict_existing_feedback_event");
  assert.equal(countRows(routeDbPath), 1);

  const forbiddenResponse = await route.POST(routeRequest(completionBody(safeInput({
    feedback_event_id: "feedback-event:route:forbidden-authority",
    idempotency_key: "feedback-event-idempotency:route:forbidden-authority",
    surfacing_mutation_now: { enabled: true },
  }))));
  const forbiddenBody = await forbiddenResponse.json();
  assert.equal(forbiddenResponse.status, 403);
  assert.equal(forbiddenBody.result.status, "blocked_forbidden_authority");
  assert.equal(countRows(routeDbPath), 1);

  const rawResponse = await route.POST(routeRequest(completionBody(safeInput({
    feedback_event_id: "feedback-event:route:blocked-raw",
    idempotency_key: "feedback-event-idempotency:route:blocked-raw",
    feedback_summary: "SAFE_MARKER_RAW_SOURCE_BODY",
  }))));
  const rawBody = await rawResponse.json();
  assert.equal(rawResponse.status, 400);
  assert.equal(rawBody.result.status, "blocked_private_or_raw_payload");
  assert.equal(countRows(routeDbPath), 1);
  assertNoUnsafeEcho(rawBody);

  const invalidPathResponse = await route.POST(routeRequest(
    completionBody(safeInput({
      feedback_event_id: "feedback-event:route:invalid-db-path",
      idempotency_key: "feedback-event-idempotency:route:invalid-db-path",
    }), "tmp/feedback-event-aggregation/../escape.sqlite"),
  ));
  const invalidPathBody = await invalidPathResponse.json();
  assert.equal(invalidPathResponse.status, 400);
  assert.equal(invalidPathBody.error_code, "invalid_db_path");
  assertNoUnsafeEcho(invalidPathBody);
}

assertIncludes(aggregationText, "research_candidate_feedback_events", aggregationHelperPath);
assertIncludes(aggregationText, "listFeedbackEventAggregationRuntimeCompletionEventsV01", aggregationHelperPath);
assertIncludes(docs, "This slice does not mutate rules.", docsPath);
assertIncludes(docs, "This slice does not product-write.", docsPath);

for (const path of [dbPath, routeDbPath]) {
  if (existsSync(path)) unlinkSync(path);
}
rmSync(".tmp/feedback-event-aggregation/smoke-empty-cleanup", { recursive: true, force: true });

console.log(
  JSON.stringify(
    {
      ok: true,
      smoke: "feedback-controls-expansion-runtime-completion-v0-1",
      route_version: routeVersion,
      helper: helperPath,
      component: componentPath,
    },
    null,
    2,
  ),
);
