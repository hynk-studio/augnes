import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const manualAnchorsDocPath = "docs/PROJECT_CONSTELLATION_MANUAL_ANCHORS_V0_1.md";
const docPath = "docs/FEEDBACK_EVENT_AGGREGATION_RUNTIME_V0_1.md";
const helperPath = "lib/research-candidate-review/feedback-event-aggregation-runtime.ts";
const routePath = "app/api/research-candidate/feedback-events/aggregation/route.ts";
const fixturePath = "fixtures/feedback-event-aggregation-runtime.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const runtimeVersion = "feedback_event_aggregation_runtime.v0.1";
const inputVersion = "feedback_event_aggregation_input.v0.1";
const resultVersion = "feedback_event_aggregation_result.v0.1";
const aggregateVersion = "feedback_event_aggregate.v0.1";
const ruleFailureCandidateVersion = "feedback_rule_failure_candidate.v0.1";
const scope = "project:augnes";
const packageScriptName = "smoke:feedback-event-aggregation-runtime-v0-1";
const packageScriptValue = "node scripts/smoke-feedback-event-aggregation-runtime-v0-1.mjs";

const eventKinds = [
  "pin_preview",
  "dismiss_preview",
  "correct_preview",
  "invalidate_preview",
  "needs_more_evidence",
  "scope_overreach",
  "not_relevant_now",
  "mark_useful",
  "mark_wrong",
  "unknown",
];

const surfaces = [
  "manual_note_parser",
  "research_candidate_review",
  "geometry_digest",
  "ai_context_packet",
  "codex_handoff_draft",
  "lifecycle_read_model",
  "calibration_diagnostic",
  "constellation_runtime_ui",
  "manual_anchor_store",
  "perspective_trajectory",
  "durable_state_apply",
  "unknown",
];

const statuses = [
  "aggregated",
  "empty",
  "blocked_private_or_raw_payload",
  "blocked_invalid_input",
];

const priorityHints = ["none", "lower", "normal", "elevated", "needs_review"];

const ruleFailureKinds = [
  "parser_rule_failure",
  "surface_scope_overreach",
  "candidate_conflict",
  "repeated_dismissal",
  "repeated_correction",
  "evidence_gap",
  "stale_context",
  "unknown",
];

const docsExactPhrases = [
  "Product-write remains parked by #686.",
  "Feedback Event Aggregation Runtime is advisory only.",
  "Feedback is not truth.",
  "Feedback is not proof.",
  "Feedback is not evidence.",
  "Feedback is not promotion readiness.",
  "Aggregation is not authority.",
  "Aggregation does not mutate candidates.",
  "Aggregation does not delete candidates.",
  "Aggregation does not promote candidates.",
  "Aggregation does not mutate rules.",
  "Aggregation does not mutate parser behavior.",
  "Aggregation does not mutate durable Perspective state.",
  "Aggregation does not product-write.",
  "Pinned items stay visible but are not promoted.",
  "Dismissed items lower display priority but are not deleted.",
  "Corrected items show correction warning but do not mutate parser/rules.",
  "Invalidated items require source/review follow-up and are not hard-deleted.",
  "Needs-more-evidence creates review cue only.",
  "Scope-overreach creates rule failure candidate only.",
  "Rule failure candidates are candidate-only review aids.",
  "Source refs are lineage pointers, not proof.",
  "Source refs must be public-safe symbolic refs.",
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
  "raw feedback payload",
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
  "raw feedback aggregation payload blocked by fixture",
  "secret-like feedback aggregation input blocked by fixture",
];

const forbiddenPositiveAuthorityGrants = [
  "feedback_write_now: true",
  "candidate_mutation_now: true",
  "rule_mutation_now: true",
  "parser_mutation_now: true",
  "promotion_execution_now: true",
  "durable_state_write_now: true",
  "durable_state_apply_now: true",
  "formation_receipt_write_now: true",
  "promotion_decision_record_write_now: true",
  "proof_or_evidence_record_now: true",
  "claim_or_evidence_write_now: true",
  "product_write_now: true",
  "product_id_allocation_now: true",
  "db_query_or_write_now: true",
  "provider_openai_call_now: true",
  "prompt_sent_now: true",
  "retrieval_execution_now: true",
  "rag_answer_generation_now: true",
  "git_ledger_export_now: true",
  "github_automation_authority: true",
  "feedback_is_truth: true",
  "feedback_is_proof: true",
  "feedback_is_evidence: true",
  "feedback_is_promotion_readiness: true",
  "aggregation_is_authority: true",
];

for (const filePath of [
  roadmapPath,
  manualAnchorsDocPath,
  docPath,
  helperPath,
  routePath,
  fixturePath,
  packagePath,
  indexPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const roadmapText = readText(roadmapPath);
const manualAnchorsDocText = readText(manualAnchorsDocPath);
const docText = readText(docPath);
const helperText = readText(helperPath);
const routeText = readText(routePath);
const fixtureText = readText(fixturePath);
const fixture = JSON.parse(fixtureText);
const packageJson = JSON.parse(readText(packagePath));
const indexText = readText(indexPath);
const helper = await import(pathToFileURL(helperPath).href);

assertIncludes(
  roadmapText,
  "feedback_event_aggregation_runtime_v0_1",
  "roadmap contains Phase 5.5 slice",
);
assertIncludes(
  manualAnchorsDocText,
  "Manual anchors are display hints.",
  "PR #791 manual anchors docs exist",
);
assert.equal(fixture.fixture_version, "feedback_event_aggregation_runtime.sample.v0.1");
assert.equal(fixture.runtime_version, runtimeVersion);
assert.equal(fixture.input_version, inputVersion);
assert.equal(fixture.result_version, resultVersion);
assert.equal(fixture.aggregate_version, aggregateVersion);
assert.equal(fixture.rule_failure_candidate_version, ruleFailureCandidateVersion);
assert.equal(fixture.scope, scope);
assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);

assertTypeAndFixtureCoverage();
assertHelperBehavior();
assertRouteStaticChecks();
assertDocsCoverage();
assertIndexCoverage();
assertFixturePrivacy();
assertHelperStaticBoundaries();

console.log(
  JSON.stringify(
    {
      smoke: "feedback-event-aggregation-runtime-v0-1",
      final_status: "pass",
      runtime_version: runtimeVersion,
      aggregates: fixture.expected_result.aggregates.length,
      rule_failure_candidates: fixture.expected_result.rule_failure_candidates.length,
      rejection_cases: Object.keys(fixture.expected_rejection_results).length,
    },
    null,
    2,
  ),
);

function assertTypeAndFixtureCoverage() {
  for (const text of [
    "export type FeedbackAggregationInputEventKind",
    "export type FeedbackAggregationSurface",
    "export type FeedbackAggregationStatus",
    "export type FeedbackSurfacePriorityHint",
    "export type FeedbackRuleFailureKind",
    "export interface FeedbackAggregationInputEvent",
    "export interface FeedbackRuleFailureCandidate",
    "export interface FeedbackEventAggregate",
    "export interface FeedbackEventAggregationInput",
    "export interface FeedbackEventAggregationResult",
    "export interface FeedbackEventAggregationValidationResult",
    "aggregateFeedbackEventsV01",
    "validateFeedbackEventAggregationInputV01",
    "validateFeedbackAggregationInputEventV01",
    "createFeedbackAggregationAuthorityBoundaryV01",
    "createFeedbackRuleFailureCandidateV01",
    "createFeedbackAggregateIdV01",
  ]) {
    assertIncludes(helperText, text, `helper exports ${text}`);
  }
  for (const value of [
    ...eventKinds,
    ...surfaces,
    ...statuses,
    ...priorityHints,
    ...ruleFailureKinds,
  ]) {
    assertIncludes(helperText, `"${value}"`, `helper type coverage includes ${value}`);
  }
  assert.deepEqual(fixture.coverage.event_kinds, eventKinds);
  assert.deepEqual(fixture.coverage.surfaces, surfaces);
  assert.deepEqual(fixture.coverage.statuses, statuses);
  assert.deepEqual(fixture.coverage.priority_hints, priorityHints);
  assert.deepEqual(fixture.coverage.rule_failure_kinds, ruleFailureKinds);
}

function assertHelperBehavior() {
  const result = helper.aggregateFeedbackEventsV01(fixture.expected_valid_input);
  assert.deepEqual(result, fixture.expected_result, "valid aggregation must match fixture");
  assert.deepEqual(
    helper.aggregateFeedbackEventsV01(fixture.expected_valid_input),
    result,
    "aggregation must be deterministic",
  );

  assert.equal(result.status, "aggregated");
  assert.ok(result.aggregates.length > 0, "expected aggregates must be non-empty");
  assertAggregateInvariants(result);

  const inputEventKinds = new Set(
    fixture.expected_valid_input.input_events.map((event) => event.event_kind),
  );
  for (const eventKind of eventKinds) {
    assert.ok(inputEventKinds.has(eventKind), `valid input covers event kind ${eventKind}`);
  }
  const inputSurfaces = new Set(
    fixture.expected_valid_input.input_events.map((event) => event.target_surface),
  );
  for (const surface of surfaces) {
    assert.ok(inputSurfaces.has(surface), `valid input covers surface ${surface}`);
  }

  const countTotals = sumCounts(result.aggregates);
  assert.ok(countTotals.pin_count > 0, "pin_count is covered");
  assert.ok(countTotals.dismiss_count > 0, "dismiss_count is covered");
  assert.ok(countTotals.correct_count > 0, "correct_count is covered");
  assert.ok(countTotals.invalidate_count > 0, "invalidate_count is covered");
  assert.ok(countTotals.needs_more_evidence_count > 0, "needs_more_evidence_count is covered");
  assert.ok(countTotals.scope_overreach_count > 0, "scope_overreach_count is covered");
  assert.ok(countTotals.not_relevant_now_count > 0, "not_relevant_now_count is covered");
  assert.ok(countTotals.mark_useful_count > 0, "mark_useful_count is covered");
  assert.ok(countTotals.mark_wrong_count > 0, "mark_wrong_count is covered");

  const outputPriorityHints = new Set(
    result.aggregates.map((aggregate) => aggregate.current_surface_priority_hint),
  );
  for (const priorityHint of ["lower", "normal", "elevated", "needs_review"]) {
    assert.ok(outputPriorityHints.has(priorityHint), `${priorityHint} priority hint is covered`);
  }

  const ruleKinds = new Set(
    result.rule_failure_candidates.map((candidate) => candidate.failure_kind),
  );
  for (const ruleKind of ruleFailureKinds) {
    assert.ok(ruleKinds.has(ruleKind), `${ruleKind} rule failure is covered`);
  }

  assert.ok(
    findAggregate(result, "manual_note_parser", "candidate:feedback:dismiss").rule_failure_candidates.some(
      (candidate) => candidate.failure_kind === "repeated_dismissal",
    ),
    "repeated dismissal creates rule failure candidate",
  );
  assert.ok(
    findAggregate(result, "research_candidate_review", "candidate:feedback:correction").rule_failure_candidates.some(
      (candidate) => candidate.failure_kind === "repeated_correction",
    ),
    "repeated correction creates rule failure candidate",
  );
  assert.ok(
    findAggregate(result, "geometry_digest", "candidate:feedback:scope").rule_failure_candidates.some(
      (candidate) => candidate.failure_kind === "surface_scope_overreach",
    ),
    "scope overreach creates rule failure candidate",
  );
  assert.ok(
    findAggregate(result, "ai_context_packet", "candidate:feedback:evidence").rule_failure_candidates.some(
      (candidate) => candidate.failure_kind === "evidence_gap",
    ),
    "needs more evidence creates evidence gap candidate",
  );

  const empty = helper.aggregateFeedbackEventsV01(fixture.empty_input);
  assert.deepEqual(empty, fixture.expected_empty_result, "empty input must match fixture");
  assert.equal(empty.status, "empty");
  assert.ok(empty.reason_codes.includes("feedback_event_missing"));

  for (const [caseName, input] of Object.entries(fixture.invalid_inputs)) {
    const rejection = helper.aggregateFeedbackEventsV01(input);
    assert.deepEqual(
      rejection,
      fixture.expected_rejection_results[caseName],
      `${caseName} rejection matches fixture`,
    );
    assert.ok(
      ["blocked_private_or_raw_payload", "blocked_invalid_input"].includes(rejection.status),
      `${caseName} must be blocked`,
    );
    assert.equal(rejection.aggregates.length, 0, `${caseName} creates no aggregates`);
    assert.equal(
      rejection.rule_failure_candidates.length,
      0,
      `${caseName} creates no rule failure candidates`,
    );
    assertNoRawPrivateMarkers(JSON.stringify(rejection), `${caseName} rejection output`);
  }
}

function assertAggregateInvariants(result) {
  assertAuthorityBoundary(result.authority_boundary, "result");
  for (const aggregate of result.aggregates) {
    assert.equal(aggregate.aggregate_version, aggregateVersion);
    assert.equal(aggregate.scope, scope);
    assert.equal(aggregate.advisory_only, true);
    assert.equal(aggregate.deletes_candidate, false);
    assert.equal(aggregate.promotes_candidate, false);
    assert.equal(aggregate.mutates_rules, false);
    assert.equal(aggregate.mutates_parser, false);
    assert.equal(aggregate.mutates_durable_state, false);
    assert.equal(aggregate.product_write_executed, false);
    assertAuthorityBoundary(aggregate.authority_boundary, aggregate.aggregate_id);
    for (const candidate of aggregate.rule_failure_candidates) {
      assert.equal(candidate.candidate_version, ruleFailureCandidateVersion);
      assert.equal(candidate.review_status, "candidate_only");
      assertAuthorityBoundary(candidate.authority_boundary, candidate.rule_failure_candidate_id);
    }
  }
  for (const candidate of result.rule_failure_candidates) {
    assert.equal(candidate.review_status, "candidate_only");
    assertAuthorityBoundary(candidate.authority_boundary, candidate.rule_failure_candidate_id);
  }
}

function assertRouteStaticChecks() {
  assertIncludes(routeText, "export async function POST", "route exports POST");
  assert.ok(!/\bexport\s+async\s+function\s+GET\b/.test(routeText), "route does not export GET");
  assertIncludes(routeText, "requestHasSameOriginBoundary", "POST has same-origin guard");
  assertIncludes(routeText, "await request.json()", "POST parses JSON");
  assertIncludes(routeText, "invalid_json_object", "POST requires JSON object");
  assertIncludes(routeText, "aggregateFeedbackEventsV01", "route calls aggregation helper");
  assertIncludes(routeText, "error_code: isBlocked ? result.status : null", "blocked results map to top-level error");
  assertIncludes(routeText, "authority_boundary", "route includes authority boundary");
  assertRouteHasNoForbiddenRuntime();
}

function assertRouteHasNoForbiddenRuntime() {
  for (const forbidden of [
    "new Database",
    "openDatabase",
    "readFile",
    "writeFile",
    "source fetch",
    "new OpenAI",
    "retrieval execution",
    "rag answer",
    "product write",
    "durable state mutation",
    "proof/evidence write",
    "GitHub automation",
  ]) {
    assert.ok(!routeText.includes(forbidden), `route must not contain ${forbidden}`);
  }
}

function assertHelperStaticBoundaries() {
  for (const forbidden of [
    'from "node:fs"',
    "Database",
    "NextResponse",
    "React",
    "new OpenAI",
    "fetch(",
    "GitHub",
  ]) {
    assert.ok(!helperText.includes(forbidden), `helper must not contain ${forbidden}`);
  }
}

function assertDocsCoverage() {
  for (const phrase of docsExactPhrases) {
    assertIncludes(docText, phrase, `docs include ${phrase}`);
  }
  assertNoForbiddenPositiveAuthorityGrants(docText, "docs");
}

function assertIndexCoverage() {
  for (const pointer of [docPath, helperPath, routePath, fixturePath, packageScriptName]) {
    assertIncludes(indexText, pointer, `index points to ${pointer}`);
  }
  assertIncludes(indexText, "advisory aggregation only", "index mentions advisory aggregation");
  assertIncludes(indexText, "Feedback is not truth.", "index mentions feedback is not truth");
  assertIncludes(indexText, "Product-write remains parked by #686.", "index mentions product write parked");
  for (const forbidden of [
    "feedback write route was added",
    "UI controls were added",
    "DB write was added",
    "state mutation was added",
    "proof/evidence writes were added",
    "product-write was added",
  ]) {
    assert.ok(!indexText.includes(forbidden), `index must not imply ${forbidden}`);
  }
  assertNoForbiddenPositiveAuthorityGrants(indexText, "index");
}

function assertFixturePrivacy() {
  let sanitized = fixtureText;
  for (const allowed of allowedFixturePlaceholders) {
    sanitized = sanitized.replaceAll(allowed, "");
  }
  for (const marker of forbiddenFixtureMarkers) {
    assert.ok(!sanitized.includes(marker), `fixture must not contain ${marker}`);
  }
}

function assertNoRawPrivateMarkers(value, label) {
  let sanitized = value;
  for (const allowed of allowedFixturePlaceholders) {
    sanitized = sanitized.replaceAll(allowed, "");
  }
  for (const marker of forbiddenFixtureMarkers) {
    assert.ok(!sanitized.includes(marker), `${label} must not contain ${marker}`);
  }
}

function assertAuthorityBoundary(boundary, label) {
  assert.equal(boundary.feedback_aggregation_runtime_now, true, `${label} runtime active`);
  assert.equal(boundary.advisory_read_model_only, true, `${label} advisory read model`);
  for (const field of [
    "feedback_write_now",
    "candidate_mutation_now",
    "rule_mutation_now",
    "parser_mutation_now",
    "promotion_execution_now",
    "durable_state_write_now",
    "durable_state_apply_now",
    "formation_receipt_write_now",
    "promotion_decision_record_write_now",
    "proof_or_evidence_record_now",
    "claim_or_evidence_write_now",
    "product_write_now",
    "product_id_allocation_now",
    "work_mutation_now",
    "db_query_or_write_now",
    "source_fetch_now",
    "local_file_read_now",
    "repository_file_read_now",
    "uploaded_file_read_now",
    "provider_openai_call_now",
    "prompt_sent_now",
    "retrieval_execution_now",
    "rag_answer_generation_now",
    "embedding_created_now",
    "vector_search_now",
    "git_ledger_export_now",
    "codex_execution_authority",
    "github_automation_authority",
    "feedback_is_truth",
    "feedback_is_proof",
    "feedback_is_evidence",
    "feedback_is_promotion_readiness",
    "aggregation_is_authority",
    "product_write_authority",
  ]) {
    assert.equal(boundary[field], false, `${label}.${field} must be false`);
  }
}

function assertNoForbiddenPositiveAuthorityGrants(text, label) {
  for (const forbidden of forbiddenPositiveAuthorityGrants) {
    assert.ok(!text.includes(forbidden), `${label} must not include ${forbidden}`);
  }
}

function sumCounts(aggregates) {
  return aggregates.reduce(
    (totals, aggregate) => {
      for (const field of Object.keys(totals)) totals[field] += aggregate[field];
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

function findAggregate(result, targetSurface, targetCandidateRef) {
  const aggregate = result.aggregates.find(
    (candidateAggregate) =>
      candidateAggregate.target_surface === targetSurface &&
      candidateAggregate.target_candidate_ref === targetCandidateRef,
  );
  assert.ok(aggregate, `aggregate exists for ${targetSurface}/${targetCandidateRef}`);
  return aggregate;
}

function readText(filePath) {
  return readFileSync(filePath, "utf8");
}

function assertIncludes(text, expected, label) {
  assert.ok(text.includes(expected), label);
}
