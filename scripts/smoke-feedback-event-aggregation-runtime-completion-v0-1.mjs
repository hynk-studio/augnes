import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";

import Database from "better-sqlite3";

const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const docPath = "docs/FEEDBACK_EVENT_AGGREGATION_RUNTIME_COMPLETION_V0_1.md";
const legacyDocPath = "docs/FEEDBACK_EVENT_AGGREGATION_RUNTIME_V0_1.md";
const helperPath = "lib/research-candidate-review/feedback-event-aggregation-runtime.ts";
const routePath = "app/api/research-candidate/feedback-events/aggregation/route.ts";
const fixturePath = "fixtures/feedback-event-aggregation-runtime-completion.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const packageScriptName = "smoke:feedback-event-aggregation-runtime-completion-v0-1";
const packageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-feedback-event-aggregation-runtime-completion-v0-1.mjs";
const scope = "project:augnes";
const aggregationVersion = "feedback_event_aggregation_runtime_completion.v0.1";
const requestVersion = "feedback_event_aggregation_runtime_completion_request.v0.1";
const routeVersion = "feedback_event_aggregation_runtime_completion_route.v0.1";
const tempDbPath = ".tmp/feedback-event-aggregation/smoke-runtime-completion.sqlite";
const schemaMissingPath = ".tmp/feedback-event-aggregation/smoke-schema-missing.sqlite";
const missingDbPath = ".tmp/feedback-event-aggregation/smoke-missing.sqlite";

const requiredDocPhrases = [
  "This slice implements `feedback_event_aggregation_runtime_completion_v0_1`",
  "Aggregates pin/dismiss/correct/invalidate/needs_more_evidence/scope_overreach",
  "Aggregation is advisory only.",
  "Feedback is not truth.",
  "Pin is not promotion.",
  "Dismiss is not delete.",
  "Invalidate is not source suppression.",
  "Rule failure candidate is not rule mutation.",
  "Priority hint is not durable state.",
  "This slice does not mutate rules.",
  "This slice does not mutate parsers.",
  "This slice does not mutate prompts.",
  "This slice does not mutate ranking.",
  "This slice does not mutate surfacing.",
  "This slice does not suppress sources.",
  "This slice does not delete candidates.",
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

const liveLookingForbidden = [
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
  "raw source body",
  "raw DB row",
  "raw conversation",
  "hidden reasoning",
  "telemetry dump",
  "raw diff",
];

for (const filePath of [
  roadmapPath,
  docPath,
  legacyDocPath,
  helperPath,
  routePath,
  fixturePath,
  packagePath,
  indexPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const roadmapText = readText(roadmapPath);
const docText = readText(docPath);
const helperText = readText(helperPath);
const routeText = readText(routePath);
const fixtureText = readText(fixturePath);
const fixture = JSON.parse(fixtureText);
const packageJson = JSON.parse(readText(packagePath));
const indexText = readText(indexPath);
const helper = await import(pathToFileURL(helperPath).href);
const route = await import(pathToFileURL(routePath).href);

assertIncludes(roadmapText, "feedback_event_aggregation_runtime_v0_1", "roadmap Phase 5.5 slice");
assertIncludes(roadmapText, "pin_count", "roadmap aggregation fields");
assertIncludes(roadmapText, "candidate/durable distinction preserved", "roadmap boundary");
assertIncludes(docText, "earlier implementation was partial", "docs mention prior gap");
for (const phrase of requiredDocPhrases) assertIncludes(docText, phrase, `docs include ${phrase}`);

assert.equal(fixture.fixture_version, "feedback_event_aggregation_runtime_completion.sample.v0.1");
assert.equal(fixture.aggregation_version, aggregationVersion);
assert.equal(fixture.route_version, routeVersion);
assert.equal(fixture.scope, scope);
assert.ok(Array.isArray(fixture.safe_feedback_events_example));
assert.ok(fixture.safe_feedback_events_example.length >= 4);
assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);

for (const pointer of [docPath, helperPath, routePath, fixturePath, packageScriptName]) {
  assertIncludes(indexText, pointer, `latest index points to ${pointer}`);
}
assertIncludes(indexText, "feedback_event_aggregation_runtime_completion_v0_1", "index names slice");
assertIncludes(indexText, "Product-write remains parked by #686.", "index product-write boundary");

for (const exportName of [
  "ensureFeedbackEventAggregationRuntimeCompletionSchemaV01",
  "feedbackEventAggregationRuntimeCompletionSchemaExistsV01",
  "insertFeedbackEventAggregationRuntimeCompletionEventV01",
  "listFeedbackEventAggregationRuntimeCompletionEventsV01",
  "aggregateFeedbackEventsRuntimeCompletionV01",
  "validateFeedbackEventAggregationRuntimeCompletionInputV01",
  "validateFeedbackEventAggregationRuntimeCompletionEventV01",
  "createFeedbackEventAggregationRuntimeCompletionAuthorityBoundaryV01",
  "isSafeFeedbackEventAggregationRuntimeDbPathV01",
]) {
  assert.equal(typeof helper[exportName], "function", `helper exports ${exportName}`);
}
assert.equal(typeof route.POST, "function", "route exports POST");
assert.ok(!/\bexport\s+async\s+function\s+GET\b/.test(routeText), "route has no GET export");
assertIncludes(
  routeText,
  "FEEDBACK_EVENT_AGGREGATION_RUNTIME_COMPLETION_ROUTE_VERSION",
  "route recognizes completion route version",
);
assertIncludes(routeText, "aggregateFeedbackEventsRuntimeCompletionV01", "route calls completion helper");
assertIncludes(routeText, "new SqliteDatabase", "route opens persisted feedback events through local sqlite");

assertSafeDbPaths();
assertFixturePrivacy();
await assertRuntimeBehavior();
await assertRouteBehavior();
assertStaticBoundaries();

console.log(
  JSON.stringify(
    {
      smoke: "feedback-event-aggregation-runtime-completion-v0-1",
      final_status: "pass",
      aggregation_version: aggregationVersion,
      route_version: routeVersion,
      target_aggregations: fixture.safe_feedback_events_example.length,
    },
    null,
    2,
  ),
);

function assertSafeDbPaths() {
  for (const path of [
    "tmp/feedback-event-aggregation/runtime.sqlite",
    ".tmp/feedback-event-aggregation/runtime.db",
  ]) {
    assert.equal(helper.isSafeFeedbackEventAggregationRuntimeDbPathV01(path), true, `${path} safe`);
  }
  for (const path of [
    "/tmp/feedback-event-aggregation/runtime.sqlite",
    "../feedback-event-aggregation/runtime.sqlite",
    ".tmp/feedback-event-aggregation/../runtime.sqlite",
    ".tmp\\feedback-event-aggregation\\runtime.sqlite",
    "https://example.invalid/runtime.sqlite",
    "SAFE_MARKER_LOCAL_PRIVATE_PATH",
    ".tmp/feedback-event-aggregation/runtime.txt",
  ]) {
    assert.equal(helper.isSafeFeedbackEventAggregationRuntimeDbPathV01(path), false, `${path} unsafe`);
  }
}

async function assertRuntimeBehavior() {
  cleanupTempDbs();
  mkdirSync(dirname(tempDbPath), { recursive: true });
  const db = new Database(tempDbPath);
  try {
    helper.ensureFeedbackEventAggregationRuntimeCompletionSchemaV01(db);
    assert.equal(helper.feedbackEventAggregationRuntimeCompletionSchemaExistsV01(db), true);
    for (const event of runtimeEvents()) {
      const inserted = helper.insertFeedbackEventAggregationRuntimeCompletionEventV01(event, db);
      assert.notEqual(inserted.status, "blocked", `${event.feedback_event_id} inserts`);
    }
    const listed = helper.listFeedbackEventAggregationRuntimeCompletionEventsV01({ limit: 50 }, db);
    assert.equal(listed.length, runtimeEvents().length, "persisted event records listed");
    const result = helper.aggregateFeedbackEventsRuntimeCompletionV01(
      {
        ...baseCompletionInput(),
        db_path: tempDbPath,
        filters: { limit: 50 },
      },
      { db },
    );
    assertAggregatedResult(result);

    const repeated = helper.aggregateFeedbackEventsRuntimeCompletionV01(
      {
        ...baseCompletionInput(),
        db_path: tempDbPath,
        filters: { limit: 50 },
      },
      { db },
    );
    assert.deepEqual(repeated, result, "aggregation is deterministic");

    const filtered = helper.aggregateFeedbackEventsRuntimeCompletionV01(
      {
        ...baseCompletionInput(),
        aggregation_request_id: "feedback-aggregation-request:runtime-filtered",
        db_path: tempDbPath,
        filters: { target_ref: "candidate:feedback-runtime:beta", limit: 50 },
      },
      { db },
    );
    assert.equal(filtered.aggregations.length, 1, "target_ref filter works");
    assert.equal(filtered.aggregations[0].target_ref, "candidate:feedback-runtime:beta");
    assert.equal(filtered.aggregations[0].current_surface_priority_hint, "needs_more_evidence");
  } finally {
    db.close();
  }

  const callerProvided = helper.aggregateFeedbackEventsRuntimeCompletionV01({
    ...baseCompletionInput(),
    aggregation_request_id: "feedback-aggregation-request:caller-provided",
    feedback_events: runtimeEvents(),
  });
  assert.equal(callerProvided.status, "aggregated");
  assert.equal(callerProvided.authority_boundary.db_query_now, false);

  const blockedRaw = helper.aggregateFeedbackEventsRuntimeCompletionV01({
    ...baseCompletionInput(),
    aggregation_request_id: "feedback-aggregation-request:blocked-raw",
    feedback_events: [fixture.blocked_private_or_raw_payload_example],
  });
  assert.equal(blockedRaw.status, "blocked_private_or_raw_payload");
  assertNoUnsafeEcho(blockedRaw, "blocked raw result");

  const blockedAuthority = helper.aggregateFeedbackEventsRuntimeCompletionV01({
    ...baseCompletionInput(),
    aggregation_request_id: "feedback-aggregation-request:blocked-authority",
    feedback_events: [fixture.blocked_forbidden_authority_example],
  });
  assert.equal(blockedAuthority.status, "blocked_forbidden_authority");
  assertNoUnsafeEcho(blockedAuthority, "blocked authority result");

  const invalid = helper.aggregateFeedbackEventsRuntimeCompletionV01({
    ...baseCompletionInput(),
    aggregation_request_id: "feedback-aggregation-request:invalid-event",
    feedback_events: [fixture.invalid_feedback_event_example],
  });
  assert.equal(invalid.status, "blocked_invalid_input");
}

async function assertRouteBehavior() {
  const routeResponse = await postRoute({
    route_version: routeVersion,
    scope,
    action: "aggregate_feedback_events",
    db_path: tempDbPath,
    input: {
      ...baseCompletionInput(),
      db_path: tempDbPath,
      filters: { limit: 50 },
    },
  });
  assert.equal(routeResponse.statusCode, 200);
  assert.equal(routeResponse.body.status, "ok");
  assert.equal(routeResponse.body.result.status, "aggregated");
  assertAggregatedResult(routeResponse.body.result);
  assert.equal(routeResponse.body.feedback_write_executed, false);
  assert.equal(routeResponse.body.rule_mutation_executed, false);
  assert.equal(routeResponse.body.source_suppression_executed, false);
  assert.equal(routeResponse.body.product_write_executed, false);

  const sameSiteNoOrigin = await postRoute(
    {
      route_version: routeVersion,
      scope,
      action: "aggregate_feedback_events",
      db_path: tempDbPath,
      input: {
        ...baseCompletionInput(),
        aggregation_request_id: "feedback-aggregation-request:same-site",
        db_path: tempDbPath,
        filters: { limit: 50 },
      },
    },
    { host: "augnes.local.test", fetchSite: "same-site" },
  );
  assert.equal(sameSiteNoOrigin.statusCode, 200, "same-site fetch metadata without Origin passes");

  const crossSite = await postRoute(
    {
      route_version: routeVersion,
      scope,
      action: "aggregate_feedback_events",
      db_path: tempDbPath,
      input: baseCompletionInput(),
    },
    { host: "augnes.local.test", fetchSite: "cross-site" },
  );
  assert.equal(crossSite.statusCode, 403);
  assert.equal(crossSite.body.error_code, "same_origin_required");

  const invalidDbPath = await postRoute({
    route_version: routeVersion,
    scope,
    action: "aggregate_feedback_events",
    db_path: fixture.invalid_db_path_example,
    input: {
      ...baseCompletionInput(),
      db_path: fixture.invalid_db_path_example,
    },
  });
  assert.equal(invalidDbPath.statusCode, 400);
  assert.equal(invalidDbPath.body.error_code, "invalid_db_path");
  assertNoUnsafeEcho(invalidDbPath.body, "invalid DB path response");

  const missingDb = await postRoute({
    route_version: routeVersion,
    scope,
    action: "aggregate_feedback_events",
    db_path: missingDbPath,
    input: {
      ...baseCompletionInput(),
      aggregation_request_id: "feedback-aggregation-request:missing-db",
      db_path: missingDbPath,
    },
  });
  assert.equal(missingDb.statusCode, 404);
  assert.equal(missingDb.body.error_code, "db_missing");

  const schemaDb = new Database(schemaMissingPath);
  schemaDb.close();
  const schemaMissing = await postRoute({
    route_version: routeVersion,
    scope,
    action: "aggregate_feedback_events",
    db_path: schemaMissingPath,
    input: {
      ...baseCompletionInput(),
      aggregation_request_id: "feedback-aggregation-request:schema-missing",
      db_path: schemaMissingPath,
    },
  });
  assert.equal(schemaMissing.statusCode, 400);
  assert.equal(schemaMissing.body.error_code, "schema_missing");

  const invalidJsonResponse = await route.POST(
    new Request("https://augnes.local.test/api/research-candidate/feedback-events/aggregation", {
      method: "POST",
      headers: {
        host: "augnes.local.test",
        "sec-fetch-site": "same-origin",
        "content-type": "application/json",
      },
      body: "{",
    }),
  );
  assert.equal(invalidJsonResponse.status, 400);
  assert.equal((await invalidJsonResponse.json()).error_code, "invalid_json_body");
}

function assertAggregatedResult(result) {
  assert.equal(result.aggregation_version, aggregationVersion);
  assert.equal(result.scope, scope);
  assert.equal(result.status, "aggregated");
  assert.equal(result.advisory_only, true);
  assert.equal(result.feedback_is_truth, false);
  assert.equal(result.pin_is_promotion, false);
  assert.equal(result.dismiss_is_delete, false);
  assert.equal(result.invalidate_is_source_suppression, false);
  assert.equal(result.rule_failure_candidate_is_rule_mutation, false);
  assert.equal(result.product_write_executed, false);
  assertAuthorityBoundary(result.authority_boundary, "result");
  assert.ok(result.aggregations.length >= 4, "grouping by target_ref works");

  const totals = sumCounts(result.aggregations);
  for (const field of [
    "pin_count",
    "dismiss_count",
    "correct_count",
    "invalidate_count",
    "needs_more_evidence_count",
    "scope_overreach_count",
    "not_relevant_now_count",
    "mark_useful_count",
    "mark_wrong_count",
  ]) {
    assert.ok(totals[field] > 0, `${field} counted`);
  }

  const alpha = findAggregation(result, "candidate:feedback-runtime:alpha");
  assert.equal(alpha.pin_count, 1);
  assert.equal(alpha.invalidate_count, 1);
  assert.equal(alpha.last_feedback_at, "2026-06-28T01:05:00.000Z");
  assert.equal(alpha.current_surface_priority_hint, "needs_operator_review");
  assert.ok(alpha.source_visibility_warnings.length > 0, "invalidation creates source warning");

  assert.equal(
    findAggregation(result, "candidate:feedback-runtime:beta").current_surface_priority_hint,
    "needs_more_evidence",
  );
  assert.equal(
    findAggregation(result, "candidate:feedback-runtime:delta").current_surface_priority_hint,
    "lower_priority",
  );
  assert.equal(
    findAggregation(result, "candidate:feedback-runtime:epsilon").current_surface_priority_hint,
    "raise_priority_for_review",
  );

  assert.ok(result.rule_failure_candidates.length > 0, "rule failure candidates created");
  for (const candidate of result.rule_failure_candidates) {
    assert.equal(candidate.review_required, true);
    assert.equal(candidate.rule_mutation_executed, false);
    assertAuthorityBoundary(candidate.authority_boundary, candidate.rule_failure_candidate_ref);
  }
  assert.ok(result.source_visibility_warnings.length > 0, "source visibility warnings present");
  for (const warning of result.source_visibility_warnings) {
    assert.equal(warning.source_visibility_preserved, true);
    assert.equal(warning.invalidate_is_source_suppression, false);
    assert.ok(warning.source_refs.length > 0);
  }
  assert.ok(result.candidate_durable_boundary_notes.length > 0, "boundary notes present");
  assert.ok(
    result.candidate_durable_boundary_notes.some(
      (note) => note.target_layer === "durable_perspective_state" && note.durable_ref,
    ),
    "durable feedback is marked as signal only",
  );
  assertNoUnsafeEcho(result, "aggregated result");
}

function assertAuthorityBoundary(boundary, label) {
  for (const field of [
    "feedback_event_aggregation_runtime_now",
    "explicit_operator_aggregation_only",
    "caller_injected_db_only",
    "aggregation_read_now",
    "advisory_result_only",
    "rule_failure_candidate_preview_now",
    "candidate_durable_boundary_visible",
    "source_visibility_warning_visible",
  ]) {
    assert.equal(boundary[field], true, `${label}.${field} true`);
  }
  for (const field of [
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
    assert.equal(boundary[field], false, `${label}.${field} false`);
  }
}

function assertStaticBoundaries() {
  assert.ok(!/components\//.test(routeText), "route adds no UI");
  for (const text of [helperText, routeText, docText, indexText]) {
    for (const forbidden of [
      "provider_openai_call_now: true",
      "prompt_sent_now: true",
      "source_fetch_now: true",
      "retrieval_execution_now: true",
      "retrieval_index_write_now: true",
      "rag_answer_generation_now: true",
      "proof_or_evidence_record_now: true",
      "promotion_execution_now: true",
      "durable_state_apply_now: true",
      "formation_receipt_write_now: true",
      "product_write_now: true",
      "product_id_allocation_now: true",
    ]) {
      assert.ok(!text.includes(forbidden), `${forbidden} must not appear`);
    }
  }
}

function assertFixturePrivacy() {
  assertSafeMarkersOnlyInsideBlockedExamples(fixture, []);
  let sanitized = fixtureText;
  for (const marker of safeMarkers) sanitized = sanitized.replaceAll(marker, "");
  for (const marker of liveLookingForbidden) {
    assert.ok(!sanitized.includes(marker), `fixture must not include ${marker}`);
  }
}

function assertSafeMarkersOnlyInsideBlockedExamples(value, pathParts) {
  if (typeof value === "string") {
    if (safeMarkers.some((marker) => value.includes(marker))) {
      assert.ok(
        pathParts.some((part) => /blocked|invalid|error/.test(part)),
        `safe marker appears only in blocked/error examples: ${pathParts.join(".")}`,
      );
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertSafeMarkersOnlyInsideBlockedExamples(item, [...pathParts, String(index)]),
    );
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      assertSafeMarkersOnlyInsideBlockedExamples(nested, [...pathParts, key]);
    }
  }
}

function assertNoUnsafeEcho(value, label) {
  const serialized = JSON.stringify(value);
  for (const marker of safeMarkers) {
    assert.ok(!serialized.includes(marker), `${label} must not echo ${marker}`);
  }
  for (const marker of liveLookingForbidden) {
    assert.ok(!serialized.includes(marker), `${label} must not echo ${marker}`);
  }
}

function baseCompletionInput() {
  return {
    request_version: requestVersion,
    aggregation_version: aggregationVersion,
    scope,
    aggregation_request_id: "feedback-aggregation-request:runtime-completion",
    requested_by: "operator:feedback-runtime",
    requested_at: "2026-06-28T01:20:00.000Z",
    reason_codes: ["feedback_event_aggregation_runtime_completion"],
  };
}

function runtimeEvents() {
  return [
    ...fixture.safe_feedback_events_example,
    event("feedback-event:runtime:dismiss", "candidate:feedback-runtime:delta", "candidate", "dismiss", "Operator dismissed this candidate for now.", "2026-06-28T01:16:00.000Z"),
    event("feedback-event:runtime:not-relevant", "candidate:feedback-runtime:delta", "candidate", "not_relevant_now", "Operator marked this candidate as not relevant now.", "2026-06-28T01:17:00.000Z"),
    event("feedback-event:runtime:useful", "candidate:feedback-runtime:epsilon", "candidate", "mark_useful", "Operator marked this candidate as useful.", "2026-06-28T01:18:00.000Z"),
    event("feedback-event:runtime:correct", "candidate:feedback-runtime:epsilon", "candidate", "correct", "Operator supplied a bounded correction.", "2026-06-28T01:19:00.000Z"),
    event("feedback-event:runtime:wrong", "candidate:feedback-runtime:zeta", "candidate", "mark_wrong", "Operator marked this candidate as wrong.", "2026-06-28T01:21:00.000Z"),
  ];
}

function event(id, targetRef, layer, kind, summary, createdAt) {
  return {
    feedback_event_id: id,
    scope,
    target_ref: targetRef,
    target_kind: layer === "durable_perspective_state" ? "durable_perspective_state" : "research_candidate_review_object",
    target_layer: layer,
    feedback_kind: kind,
    feedback_summary: summary,
    source_ref: `source-ref:${id.replaceAll(":", "-")}`,
    candidate_ref: layer === "candidate" ? targetRef : undefined,
    durable_ref: layer === "durable_perspective_state" ? targetRef : undefined,
    created_by: "operator:feedback-runtime",
    created_at: createdAt,
    authority_boundary: { product_write_now: false },
    reason_codes: ["smoke_feedback_event"],
  };
}

async function postRoute(body, options = {}) {
  const response = await route.POST(
    new Request("https://augnes.local.test/api/research-candidate/feedback-events/aggregation", {
      method: "POST",
      headers: {
        host: options.host ?? "augnes.local.test",
        "sec-fetch-site": options.fetchSite ?? "same-origin",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    }),
  );
  return {
    statusCode: response.status,
    body: await response.json(),
  };
}

function findAggregation(result, targetRef) {
  const aggregation = result.aggregations.find((item) => item.target_ref === targetRef);
  assert.ok(aggregation, `aggregation exists for ${targetRef}`);
  return aggregation;
}

function sumCounts(aggregations) {
  return aggregations.reduce(
    (totals, aggregation) => {
      for (const key of Object.keys(totals)) totals[key] += aggregation[key];
      return totals;
    },
    {
      pin_count: 0,
      dismiss_count: 0,
      correct_count: 0,
      invalidate_count: 0,
      needs_more_evidence_count: 0,
      scope_overreach_count: 0,
      not_relevant_now_count: 0,
      mark_useful_count: 0,
      mark_wrong_count: 0,
    },
  );
}

function cleanupTempDbs() {
  for (const filePath of [tempDbPath, schemaMissingPath, missingDbPath]) {
    rmSync(filePath, { force: true });
  }
}

function readText(filePath) {
  return readFileSync(filePath, "utf8");
}

function assertIncludes(text, expected, label) {
  assert.ok(text.includes(expected), label);
}
