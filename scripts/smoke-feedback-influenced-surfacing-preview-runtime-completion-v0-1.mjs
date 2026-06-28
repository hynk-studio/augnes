#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";

import Database from "better-sqlite3";

const docsPath = "docs/FEEDBACK_INFLUENCED_SURFACING_PREVIEW_RUNTIME_COMPLETION_V0_1.md";
const legacyDocsPath = "docs/FEEDBACK_INFLUENCED_SURFACING_PREVIEW_V0_1.md";
const aggregationDocsPath = "docs/FEEDBACK_EVENT_AGGREGATION_RUNTIME_COMPLETION_V0_1.md";
const controlsDocsPath = "docs/FEEDBACK_CONTROLS_EXPANSION_RUNTIME_COMPLETION_V0_1.md";
const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const helperPath = "lib/research-candidate-review/feedback-influenced-surfacing-preview.ts";
const aggregationHelperPath = "lib/research-candidate-review/feedback-event-aggregation-runtime.ts";
const writeHelperPath = "lib/research-candidate-review/feedback-event-write-runtime.ts";
const routePath = "app/api/research-candidate/feedback-events/surfacing-preview/route.ts";
const aggregationRoutePath = "app/api/research-candidate/feedback-events/aggregation/route.ts";
const writeRoutePath = "app/api/research-candidate/feedback-events/route.ts";
const componentPath = "components/feedback-influenced-surfacing-preview-panel.tsx";
const fixturePath =
  "fixtures/feedback-influenced-surfacing-preview-runtime-completion.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const previewVersion = "feedback_influenced_surfacing_preview_runtime_completion.v0.1";
const requestVersion =
  "feedback_influenced_surfacing_preview_runtime_completion_request.v0.1";
const resultVersion =
  "feedback_influenced_surfacing_preview_runtime_completion_result.v0.1";
const routeVersion =
  "feedback_influenced_surfacing_preview_runtime_completion_route.v0.1";
const aggregationVersion = "feedback_event_aggregation_runtime_completion.v0.1";
const scope = "project:augnes";
const dbPath = `.tmp/feedback-event-aggregation/smoke-surfacing-preview-${process.pid}.sqlite`;
const routeDbPath = `.tmp/feedback-event-aggregation/smoke-surfacing-route-${process.pid}.sqlite`;
const missingDbPath = `.tmp/feedback-event-aggregation/missing-surfacing-route-${process.pid}.sqlite`;
const schemaMissingDbPath = `.tmp/feedback-event-aggregation/schema-missing-surfacing-route-${process.pid}.sqlite`;

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

function assertNoUnsafeEcho(value, label = "response") {
  const text = JSON.stringify(value);
  for (const marker of [
    "SAFE_MARKER_RAW_SOURCE_BODY",
    "SAFE_MARKER_SECRET_TOKEN",
    "SAFE_MARKER_LOCAL_PRIVATE_PATH",
    "../feedback-events.sqlite",
    "secret-token-feedback.sqlite",
  ]) {
    assertNotIncludes(text, marker, label);
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

function assertAuthorityBoundary(boundary, label) {
  for (const field of [
    "feedback_influenced_surfacing_preview_runtime_now",
    "db_backed_feedback_aggregation_read_now",
    "explicit_operator_preview_only",
    "same_origin_preview_route_now",
    "advisory_preview_only",
    "source_visibility_preserved",
    "candidate_durable_boundary_visible",
    "rule_failure_candidates_review_only",
  ]) {
    assert.equal(boundary[field], true, `${label}.${field} must be true`);
  }
  for (const field of [
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
    "feedback_is_truth",
    "priority_hint_is_truth",
    "priority_hint_is_ranking_mutation",
    "surfacing_preview_is_surfacing_mutation",
    "invalidate_is_source_suppression",
    "dismiss_is_delete",
    "pin_is_promotion",
    "smoke_pass_is_truth",
    "ci_pass_is_truth",
  ]) {
    assert.equal(boundary[field], false, `${label}.${field} must be false`);
  }
}

function routeRequest(body, headers = {}) {
  return new Request(
    "https://augnes.local.test/api/research-candidate/feedback-events/surfacing-preview",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        host: "augnes.local.test",
        "sec-fetch-site": "same-origin",
        ...headers,
      },
      body: JSON.stringify(body),
    },
  );
}

function requestInput(overrides = {}) {
  return {
    ...fixture.safe_surfacing_preview_request_example,
    db_path: dbPath,
    surfacing_preview_request_id: "feedback-surfacing-preview-runtime:smoke:001",
    ...overrides,
  };
}

function routeBody(input, path = routeDbPath) {
  return {
    route_version: routeVersion,
    scope,
    db_path: path,
    input: {
      ...input,
      db_path: path,
    },
  };
}

function seedEvent(overrides = {}) {
  return {
    request_version: "feedback_event_write_runtime_request.v0.1",
    event_version: "feedback_event_write_runtime_event.v0.1",
    scope,
    feedback_event_id: "feedback-event:surfacing-preview-runtime:smoke:pin:001",
    feedback_kind: "pin",
    target_ref: "candidate:surfacing-preview-runtime:positive",
    target_kind: "research_candidate_review",
    target_layer: "candidate",
    target_fingerprint: "target-fingerprint:surfacing-preview-runtime:positive",
    source_refs: ["source-ref:surfacing-preview-runtime:positive"],
    candidate_ref: "candidate:surfacing-preview-runtime:positive",
    feedback_summary: "Operator feedback event for surfacing preview smoke.",
    created_by: "operator:surfacing-preview-runtime",
    created_at: "2026-06-28T00:00:00.000Z",
    idempotency_key: "feedback-idempotency:surfacing-preview-runtime:smoke:pin:001",
    authority_boundary: {},
    reason_codes: ["feedback_event_seed", "advisory_signal_only"],
    ...overrides,
  };
}

function seedDatabase(path) {
  mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  try {
    const events = [
      seedEvent(),
      seedEvent({
        feedback_event_id: "feedback-event:surfacing-preview-runtime:smoke:dismiss:001",
        feedback_kind: "dismiss",
        target_ref: "source-ref:surfacing-preview-runtime:lower",
        target_kind: "source_ref",
        target_layer: "source_ref",
        candidate_ref: undefined,
        source_refs: ["source-ref:surfacing-preview-runtime:lower"],
        feedback_summary: "Operator lowered this source for current review but kept visibility.",
        reason: "Not relevant now.",
        created_at: "2026-06-28T00:01:00.000Z",
        idempotency_key: "feedback-idempotency:surfacing-preview-runtime:smoke:dismiss:001",
      }),
      seedEvent({
        feedback_event_id: "feedback-event:surfacing-preview-runtime:smoke:invalidate:001",
        feedback_kind: "invalidate",
        target_ref: "source-ref:surfacing-preview-runtime:warning",
        target_kind: "source_ref",
        target_layer: "source_ref",
        candidate_ref: undefined,
        source_refs: ["source-ref:surfacing-preview-runtime:warning"],
        feedback_summary: "Operator invalidation creates warning without source suppression.",
        reason: "Source context needs review.",
        created_at: "2026-06-28T00:02:00.000Z",
        idempotency_key: "feedback-idempotency:surfacing-preview-runtime:smoke:invalidate:001",
      }),
      seedEvent({
        feedback_event_id: "feedback-event:surfacing-preview-runtime:smoke:evidence:001",
        feedback_kind: "needs_more_evidence",
        target_ref: "candidate:surfacing-preview-runtime:evidence",
        candidate_ref: "candidate:surfacing-preview-runtime:evidence",
        feedback_summary: "Operator requested more evidence.",
        reason: "Needs more evidence.",
        created_at: "2026-06-28T00:03:00.000Z",
        idempotency_key: "feedback-idempotency:surfacing-preview-runtime:smoke:evidence:001",
      }),
      seedEvent({
        feedback_event_id: "feedback-event:surfacing-preview-runtime:smoke:scope:001",
        feedback_kind: "scope_overreach",
        target_ref: "candidate:surfacing-preview-runtime:scope",
        candidate_ref: "candidate:surfacing-preview-runtime:scope",
        feedback_summary: "Operator marked scope overreach.",
        reason: "Surface rule may be too broad.",
        created_at: "2026-06-28T00:04:00.000Z",
        idempotency_key: "feedback-idempotency:surfacing-preview-runtime:smoke:scope:001",
      }),
      seedEvent({
        feedback_event_id: "feedback-event:surfacing-preview-runtime:smoke:durable:001",
        feedback_kind: "mark_useful",
        target_ref: "durable-state:surfacing-preview-runtime:readout",
        target_kind: "durable_perspective_state",
        target_layer: "durable_perspective_state",
        candidate_ref: undefined,
        durable_ref: "durable-state:surfacing-preview-runtime:readout",
        source_refs: [],
        feedback_summary: "Operator marked durable readout useful as a review signal.",
        created_at: "2026-06-28T00:05:00.000Z",
        idempotency_key: "feedback-idempotency:surfacing-preview-runtime:smoke:durable:001",
      }),
    ];
    for (const event of events) {
      const result = writeRuntime.writeFeedbackEventRuntimeV01(event, db);
      assert.equal(result.status, "feedback_event_created", `${event.feedback_event_id} seeded`);
    }
    return db;
  } catch (error) {
    db.close();
    throw error;
  }
}

function rowCount(path) {
  const db = new Database(path, { readonly: true, fileMustExist: true });
  try {
    return db.prepare("SELECT COUNT(*) AS count FROM research_candidate_feedback_events").get()
      .count;
  } finally {
    db.close();
  }
}

for (const filePath of [
  docsPath,
  legacyDocsPath,
  aggregationDocsPath,
  controlsDocsPath,
  roadmapPath,
  helperPath,
  aggregationHelperPath,
  writeHelperPath,
  routePath,
  aggregationRoutePath,
  writeRoutePath,
  componentPath,
  fixturePath,
  packagePath,
  indexPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const docs = readText(docsPath);
const roadmap = readText(roadmapPath);
const helperText = readText(helperPath);
const routeText = readText(routePath);
const componentText = readText(componentPath);
const fixture = readJson(fixturePath);
const packageJson = readJson(packagePath);
const indexText = readText(indexPath);
const helper = await import(pathToFileURL(helperPath).href);
const aggregation = await import(pathToFileURL(aggregationHelperPath).href);
const writeRuntime = await import(pathToFileURL(writeHelperPath).href);
const route = await import(pathToFileURL(routePath).href);

assert.equal(fixture.fixture_version, "feedback_influenced_surfacing_preview_runtime_completion.sample.v0.1");
assert.equal(fixture.preview_version, previewVersion);
assert.equal(fixture.request_version, requestVersion);
assert.equal(fixture.route_version, routeVersion);
assert.equal(fixture.aggregation_version, aggregationVersion);
assert.equal(fixture.scope, scope);
assert.equal(
  packageJson.scripts["smoke:feedback-influenced-surfacing-preview-runtime-completion-v0-1"],
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-feedback-influenced-surfacing-preview-runtime-completion-v0-1.mjs",
);

assertIncludes(roadmap, "feedback_influenced_surfacing_preview_v0_1", "roadmap");
assertIncludes(docs, "DB-backed feedback aggregation results", docsPath);
assertIncludes(docs, "The earlier surfacing preview remains compatible", docsPath);
assertIncludes(docs, "Product-write remains parked by #686.", docsPath);
assertIncludes(indexText, docsPath, indexPath);
assertIncludes(indexText, fixturePath, indexPath);
assertIncludes(indexText, routePath, indexPath);

for (const exported of [
  "FEEDBACK_INFLUENCED_SURFACING_PREVIEW_RUNTIME_COMPLETION_VERSION",
  "FEEDBACK_INFLUENCED_SURFACING_PREVIEW_RUNTIME_COMPLETION_REQUEST_VERSION",
  "FEEDBACK_INFLUENCED_SURFACING_PREVIEW_RUNTIME_COMPLETION_ROUTE_VERSION",
  "createFeedbackInfluencedSurfacingPreviewRuntimeCompletionAuthorityBoundaryV01",
  "validateFeedbackInfluencedSurfacingPreviewRuntimeCompletionRequestV01",
  "buildFeedbackInfluencedSurfacingPreviewRuntimeCompletionV01",
  "runFeedbackInfluencedSurfacingPreviewRuntimeCompletionV01",
  "createFeedbackInfluencedSurfacingPreviewRuntimeItemRefV01",
  "isSafeFeedbackInfluencedSurfacingPreviewRuntimeDbPathV01",
]) {
  assert.ok(helper[exported], `helper exports ${exported}`);
}
assert.equal(typeof route.POST, "function", "route exports POST");
assert.equal(route.GET, undefined, "route has no GET export");

for (const phrase of [
  "runtimeCompletionResult",
  "DB-backed aggregation surfacing preview",
  "Priority hint is not ranking mutation",
  "Surfacing preview is not surfacing mutation",
  "Invalidate is not source suppression",
  "Dismiss is not delete",
  "Pin is not promotion",
]) {
  assertIncludes(componentText, phrase, componentPath);
}
for (const forbidden of [
  "fetch(",
  "Product write executed",
  "product_write_executed: true",
  "Suppress source",
  "Delete candidate",
  "Apply rule",
  "Mutate parser",
  "Allocate product ID",
  "GitHub PR",
  "Execute Codex",
]) {
  assertNotIncludes(componentText, forbidden, componentPath);
}

assertSafeMarkersOnlyInBlockedExamples(fixture);
assertAuthorityBoundary(fixture.authority_boundary_sample, "fixture.authority_boundary_sample");

rmSync(dbPath, { force: true });
rmSync(routeDbPath, { force: true });
rmSync(missingDbPath, { force: true });
rmSync(schemaMissingDbPath, { force: true });

const db = seedDatabase(dbPath);
try {
  const aggregationInput = {
    request_version: "feedback_event_aggregation_runtime_completion_request.v0.1",
    aggregation_version: aggregationVersion,
    scope,
    aggregation_request_id: "feedback-aggregation-runtime:surfacing-smoke",
    requested_by: "operator:surfacing-preview-runtime",
    requested_at: "2026-06-28T00:06:00.000Z",
    db_path: dbPath,
    filters: { limit: 50 },
    authority_boundary: {},
    reason_codes: ["surfacing_preview_smoke"],
  };
  const aggregationResult = aggregation.aggregateFeedbackEventsRuntimeCompletionV01(
    aggregationInput,
    { db },
  );
  assert.equal(aggregationResult.status, "aggregated");
  assert.ok(aggregationResult.aggregations.length >= 5, "aggregation reads seeded events");

  const helperInput = requestInput();
  const aggregateFeedbackEvents = (input) =>
    aggregation.aggregateFeedbackEventsRuntimeCompletionV01(input, { db });
  const helperResult = helper.runFeedbackInfluencedSurfacingPreviewRuntimeCompletionV01(
    helperInput,
    { aggregateFeedbackEvents },
  );
  assert.equal(helperResult.result_version, resultVersion);
  assert.equal(helperResult.status, "preview_created");
  assert.equal(helperResult.aggregation_status, "aggregated");
  assert.ok(helperResult.surfaced_items.length >= 5, "preview returns surfaced items");
  assert.equal(helperResult.advisory_only, true);
  assert.equal(helperResult.feedback_is_truth, false);
  assert.equal(helperResult.priority_hint_is_ranking_mutation, false);
  assert.equal(helperResult.surfacing_preview_is_surfacing_mutation, false);
  assert.equal(helperResult.source_suppression_executed, false);
  assert.equal(helperResult.candidate_deleted, false);
  assert.equal(helperResult.rule_mutation_executed, false);
  assert.equal(helperResult.product_write_executed, false);
  assertAuthorityBoundary(helperResult.authority_boundary, "helperResult.authority_boundary");
  assert.ok(
    helperResult.surfaced_items.some((item) => item.preview_rank_bucket === "raise_for_review"),
    "pin/mark_useful creates raise review bucket without promotion",
  );
  assert.ok(
    helperResult.surfaced_items.some((item) => item.preview_rank_bucket === "lower_but_visible"),
    "dismiss/not_relevant lowers but keeps visible",
  );
  assert.ok(
    helperResult.surfaced_items.some((item) => item.preview_rank_bucket === "needs_more_evidence"),
    "needs_more_evidence bucket exists",
  );
  assert.ok(
    helperResult.surfaced_items.some((item) => item.preview_rank_bucket === "needs_operator_review"),
    "invalidate/scope_overreach creates operator review bucket",
  );
  assert.ok(helperResult.source_visibility_warnings.length > 0, "source visibility warnings present");
  assert.ok(helperResult.rule_failure_candidates.length > 0, "rule failure candidates present");
  assert.ok(
    helperResult.rule_failure_candidates.every((candidate) => candidate.rule_mutation_executed === false),
    "rule failure candidates are review-only",
  );
  assert.ok(
    helperResult.candidate_durable_boundary_notes.some((note) => note.candidate_ref),
    "candidate boundary note present",
  );
  assert.ok(
    helperResult.candidate_durable_boundary_notes.some((note) => note.durable_ref),
    "durable boundary note present",
  );
  assertNoUnsafeEcho(helperResult, "helper result");

  const privateResult = helper.runFeedbackInfluencedSurfacingPreviewRuntimeCompletionV01(
    fixture.blocked_private_or_raw_payload_example,
    { aggregateFeedbackEvents },
  );
  assert.equal(privateResult.status, "blocked_private_or_raw_payload");
  assertNoUnsafeEcho(privateResult, "private result");

  const authorityResult = helper.runFeedbackInfluencedSurfacingPreviewRuntimeCompletionV01(
    fixture.blocked_forbidden_authority_example,
    { aggregateFeedbackEvents },
  );
  assert.equal(authorityResult.status, "blocked_forbidden_authority");
  assertNoUnsafeEcho(authorityResult, "authority result");

  const invalidFilterResult = helper.runFeedbackInfluencedSurfacingPreviewRuntimeCompletionV01(
    requestInput({ target_filters: { limit: 0 } }),
    { aggregateFeedbackEvents },
  );
  assert.equal(invalidFilterResult.status, "blocked_invalid_input");
} finally {
  db.close();
}

const routeDb = seedDatabase(routeDbPath);
routeDb.close();
const beforeRouteRows = rowCount(routeDbPath);
const routeResponse = await route.POST(routeRequest(routeBody(requestInput({ db_path: routeDbPath }), routeDbPath)));
assert.equal(routeResponse.status, 200);
const routeJson = await routeResponse.json();
assert.equal(routeJson.status, "ok");
assert.equal(routeJson.result.status, "preview_created");
assert.equal(routeJson.result.aggregation_status, "aggregated");
assert.equal(rowCount(routeDbPath), beforeRouteRows, "preview route must not write DB");
assertNoUnsafeEcho(routeJson, "route response");

const missingResponse = await route.POST(
  routeRequest(routeBody(requestInput({ db_path: missingDbPath }), missingDbPath)),
);
assert.equal(missingResponse.status, 404);
const missingJson = await missingResponse.json();
assert.equal(missingJson.error_code, "db_missing");
assert.equal(existsSync(missingDbPath), false, "missing DB request must not create DB file");

mkdirSync(dirname(schemaMissingDbPath), { recursive: true });
const schemaDb = new Database(schemaMissingDbPath);
schemaDb.close();
const schemaResponse = await route.POST(
  routeRequest(routeBody(requestInput({ db_path: schemaMissingDbPath }), schemaMissingDbPath)),
);
assert.equal(schemaResponse.status, 400);
const schemaJson = await schemaResponse.json();
assert.equal(schemaJson.error_code, "schema_missing");
const schemaCheckDb = new Database(schemaMissingDbPath, { readonly: true, fileMustExist: true });
try {
  const table = schemaCheckDb
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'research_candidate_feedback_events'")
    .get();
  assert.equal(table, undefined, "schema-missing request must not create schema");
} finally {
  schemaCheckDb.close();
}

const crossSite = await route.POST(
  routeRequest(routeBody(requestInput({ db_path: routeDbPath }), routeDbPath), {
    "sec-fetch-site": "cross-site",
  }),
);
assert.equal(crossSite.status, 403);
assert.equal((await crossSite.json()).error_code, "same_origin_required");

const invalidPath = await route.POST(
  routeRequest(routeBody(requestInput({ db_path: "blocked:url-feedback-events.sqlite" }), "blocked:url-feedback-events.sqlite")),
);
assert.equal(invalidPath.status, 400);
assert.equal((await invalidPath.json()).error_code, "invalid_db_path");

const privateRoute = await route.POST(
  routeRequest(
    routeBody(
      {
        ...fixture.blocked_private_or_raw_payload_example,
        db_path: missingDbPath,
      },
      missingDbPath,
    ),
  ),
);
assert.equal(privateRoute.status, 400);
assert.equal((await privateRoute.json()).error_code, "blocked_private_or_raw_payload");

const authorityRoute = await route.POST(
  routeRequest(
    routeBody(
      {
        ...fixture.blocked_forbidden_authority_example,
        db_path: missingDbPath,
      },
      missingDbPath,
    ),
  ),
);
assert.equal(authorityRoute.status, 403);
assert.equal((await authorityRoute.json()).error_code, "blocked_forbidden_authority");

for (const [source, label] of [
  [helperText, helperPath],
  [routeText, routePath],
  [componentText, componentPath],
]) {
  for (const forbidden of [
    "rule_mutation_executed: true",
    "parser_mutation_executed: true",
    "ranking_mutation_executed: true",
    "surfacing_mutation_executed: true",
    "source_suppression_executed: true",
    "candidate_deleted: true",
    "product_write_executed: true",
    "provider_openai_call_now: true",
    "prompt_sent_now: true",
    "retrieval_index_write_now: true",
    "rag_answer_generation_now: true",
  ]) {
    assertNotIncludes(source, forbidden, label);
  }
}

for (const phrase of [
  "Feedback is not truth.",
  "Priority hint is not ranking mutation.",
  "Surfacing preview is not surfacing mutation.",
  "Pin is not promotion.",
  "Dismiss is not delete.",
  "Invalidate is not source suppression.",
  "Rule failure candidates are review-only",
  "Product-write remains parked by #686.",
]) {
  assertIncludes(docs, phrase, docsPath);
}

rmSync(dbPath, { force: true });
rmSync(routeDbPath, { force: true });
rmSync(missingDbPath, { force: true });
rmSync(schemaMissingDbPath, { force: true });

console.log(
  JSON.stringify(
    {
      ok: true,
      smoke: "feedback-influenced-surfacing-preview-runtime-completion-v0-1",
      preview_version: previewVersion,
      route_version: routeVersion,
      db_backed_aggregation_read: true,
    },
    null,
    2,
  ),
);
