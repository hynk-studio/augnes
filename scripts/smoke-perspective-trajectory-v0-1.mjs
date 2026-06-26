import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const durableStateDocPath = "docs/DURABLE_PERSPECTIVE_STATE_APPLY_V0_1.md";
const docPath = "docs/PERSPECTIVE_TRAJECTORY_BUILDER_V0_1.md";
const builderPath = "lib/perspective/state/build-trajectory.ts";
const readHelperPath = "lib/perspective/state/read-perspective-state.ts";
const stateStorePath = "lib/perspective/state/state-store.ts";
const routePath = "app/api/perspective/state/[perspective_id]/trajectory/route.ts";
const componentPath = "components/perspective-trajectory-panel.tsx";
const fixturePath = "fixtures/perspective-trajectory.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const builderVersion = "perspective_trajectory_builder.v0.1";
const eventVersion = "perspective_trajectory_event.v0.1";
const trajectoryVersion = "perspective_trajectory.v0.1";
const scope = "project:augnes";
const packageScriptName = "smoke:perspective-trajectory-v0-1";
const packageScriptValue = "node scripts/smoke-perspective-trajectory-v0-1.mjs";

const docsExactPhrases = [
  "Product-write remains parked by #686.",
  "Perspective Trajectory Builder is read-only.",
  "Perspective Trajectory Builder is a derived view, not source of truth.",
  "Perspective Trajectory Builder does not mutate durable Perspective state.",
  "Perspective Trajectory Builder does not apply deltas.",
  "Perspective Trajectory Builder does not promote Perspective.",
  "Perspective Trajectory Builder does not write Formation Receipts.",
  "Perspective Trajectory Builder does not write promotion decisions.",
  "Perspective Trajectory Builder does not create proof/evidence.",
  "Perspective Trajectory Builder does not write claim/evidence records.",
  "Perspective Trajectory Builder does not product-write.",
  "Prior thesis must remain visible.",
  "Retired claims must remain auditable.",
  "Contradicted evidence must remain visible.",
  "Unresolved tensions must remain visible.",
  "Resolved tensions must remain visible.",
  "Knowledge gaps must remain visible.",
  "Source refs are lineage pointers, not proof.",
  "Source refs must be public-safe symbolic refs.",
  "Git Ledger export remains deferred.",
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
  "raw trajectory payload",
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
  "raw perspective trajectory payload blocked by fixture",
  "secret-like perspective trajectory input blocked by fixture",
];

const forbiddenPositiveAuthorityGrants = [
  "durable_state_write_now: true",
  "durable_state_apply_now: true",
  "formation_receipt_write_now: true",
  "promotion_execution_now: true",
  "promotion_decision_record_write_now: true",
  "proof_or_evidence_record_now: true",
  "claim_or_evidence_write_now: true",
  "product_write_now: true",
  "product_id_allocation_now: true",
  "db_write_now: true",
  "provider_openai_call_now: true",
  "prompt_sent_now: true",
  "retrieval_execution_now: true",
  "rag_answer_generation_now: true",
  "git_ledger_export_now: true",
  "github_automation_authority: true",
];

const forbiddenRouteSnippets = [
  "export async function POST",
  "mkdirSync",
  "ensureDurablePerspectiveStateSchemaV01",
  "applyDurablePerspectiveStateV01",
  "fetch(",
  "OpenAI",
  "embeddings.create",
  "provider response:",
  "actual prompt:",
  "retrieval execution implementation",
  "rag answer generation",
  "source fetch implementation",
  "product write implementation",
  "proof evidence write implementation",
  "createPullRequest",
  "github.",
  "git commit",
];

const componentForbiddenSnippets = [
  "fetch(",
  "useEffect",
  "POST",
  "promote button",
  "apply state button",
  "create proof/evidence button",
  "product write button",
];

const boundaryFalseFields = [
  "durable_state_write_now",
  "durable_state_apply_now",
  "formation_receipt_write_now",
  "promotion_execution_now",
  "promotion_decision_record_write_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "product_write_now",
  "product_id_allocation_now",
  "work_mutation_now",
  "db_write_now",
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
  "source_of_truth",
  "candidate_is_fact",
  "candidate_is_proof",
  "candidate_is_accepted_evidence",
  "formation_receipt_is_proof",
  "durable_state_apply_is_product_write",
  "product_write_authority",
];

for (const filePath of [
  roadmapPath,
  durableStateDocPath,
  docPath,
  builderPath,
  readHelperPath,
  stateStorePath,
  routePath,
  componentPath,
  fixturePath,
  packagePath,
  indexPath,
]) {
  assert(existsSync(filePath), `${filePath} must exist`);
}

const roadmapText = readText(roadmapPath);
const durableStateDocText = readText(durableStateDocPath);
const docText = readText(docPath);
const builderText = readText(builderPath);
const readHelperText = readText(readHelperPath);
const stateStoreText = readText(stateStorePath);
const routeText = readText(routePath);
const componentText = readText(componentPath);
const fixtureText = readText(fixturePath);
const fixture = JSON.parse(fixtureText);
const packageJson = JSON.parse(readText(packagePath));
const indexText = readText(indexPath);
const builder = await import(pathToFileURL(builderPath).href);

assertIncludes(roadmapText, "perspective_trajectory_builder_v0_1", "roadmap contains Phase 4.5 slice");
assertIncludes(
  durableStateDocText,
  "Durable Perspective State Apply writes durable Perspective state.",
  "PR #786 durable state docs exist",
);

assert.equal(fixture.fixture_version, "perspective_trajectory.sample.v0.1");
assert.equal(fixture.builder_version, builderVersion);
assert.equal(fixture.event_version, eventVersion);
assert.equal(fixture.trajectory_version, trajectoryVersion);
assert.equal(fixture.scope, scope);
assert.equal(fixture.as_of, "2026-06-26T00:00:00.000Z");
assert(fixture.expected_input, "fixture includes expected_input");
assert(fixture.expected_trajectory, "fixture includes expected_trajectory");

assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);

assertIndexCoverage();
assertDocsCoverage();
assertFixturePrivacy();
assertBuilderExports();
assertBuilderBehavior();
assertStaticRouteBoundaries();
assertComponentBoundaries();

console.log(
  JSON.stringify(
    {
      smoke: "perspective-trajectory-v0-1",
      final_status: "pass",
      builder_version: builderVersion,
      trajectory_version: trajectoryVersion,
      events: fixture.expected_trajectory.events.length,
      trajectory_fingerprint: fixture.expected_trajectory.trajectory_fingerprint,
    },
    null,
    2,
  ),
);

function assertBuilderBehavior() {
  const trajectory = builder.buildPerspectiveTrajectoryV01(fixture.expected_input);
  assert.deepEqual(trajectory, fixture.expected_trajectory, "valid trajectory matches expected fixture");
  const repeatedTrajectory = builder.buildPerspectiveTrajectoryV01(fixture.expected_input);
  assert.equal(repeatedTrajectory.trajectory_fingerprint, trajectory.trajectory_fingerprint, "repeated build is fingerprint-stable");
  assert.deepEqual(repeatedTrajectory, trajectory, "repeated build is deterministic");
  assertEventsSorted(trajectory.events);
  assert.equal(
    trajectory.events.filter((event) => event.event_id === "trajectory:event:candidate-created:001").length,
    1,
    "duplicate event id is deduplicated",
  );
  assert.equal(trajectory.status, "built");
  assert.equal(trajectory.events.length, 11, "fixture covers every expected event kind once after dedupe");
  for (const eventKind of [
    "candidate_created",
    "review_record_saved",
    "promotion_decision_created",
    "formation_receipt_created",
    "durable_delta_applied",
    "claim_retired",
    "tension_resolved",
    "knowledge_gap_deferred",
    "knowledge_gap_closed",
    "salience_changed",
    "feedback_influenced_surface",
  ]) {
    assert(trajectory.events.some((event) => event.event_kind === eventKind), `trajectory covers ${eventKind}`);
  }
  for (const event of trajectory.events) {
    assertBoundary(event.authority_boundary, `event ${event.event_id}`);
  }
  assertBoundary(trajectory.authority_boundary, "trajectory");
  assert(trajectory.prior_thesis_refs.includes("prior-thesis:bounded:initial"), "prior thesis refs are preserved");
  assert(trajectory.active_claim_refs.includes("claim-candidate:bounded:001"), "active claim refs are preserved");
  assert(trajectory.retired_claim_refs.includes("claim-candidate:bounded:001"), "retired claim refs are preserved");
  assert(trajectory.supporting_evidence_refs.includes("source-ref:bounded:001"), "supporting evidence refs are preserved");
  assert(trajectory.contradicting_evidence_refs.includes("contradicting-evidence:bounded:001"), "contradicting evidence refs are preserved");
  assert(trajectory.open_tension_refs.includes("unresolved-tension:bounded:001"), "open tension refs are preserved");
  assert(trajectory.resolved_tension_refs.includes("unresolved-tension:bounded:001"), "resolved tension refs are preserved");
  assert(trajectory.knowledge_gap_refs.includes("knowledge-gap:bounded:001"), "knowledge gap refs are preserved");
  assert(trajectory.promotion_decision_refs.includes("promotion-decision:store:promote:001"), "promotion decision refs are preserved");
  assert(trajectory.formation_receipt_refs.includes("formation-receipt:durable-write:001"), "Formation Receipt refs are preserved");
  assert(trajectory.apply_event_refs.includes("durable-state-apply:event:001"), "apply event refs are preserved");
  assert(trajectory.feedback_refs.includes("feedback-ref:bounded:001"), "feedback refs are preserved");
  assert(trajectory.source_refs.some((sourceRef) => sourceRef.source_ref === "source-ref:bounded:001"), "source refs are preserved");

  const emptyTrajectory = builder.buildPerspectiveTrajectoryV01(fixture.empty_input);
  assert.deepEqual(emptyTrajectory, fixture.expected_empty_trajectory, "empty trajectory matches expected fixture");
  assert.equal(emptyTrajectory.status, "empty", "empty input returns empty status");

  const blockedTrajectory = builder.buildPerspectiveTrajectoryV01(fixture.blocked_private_raw_input);
  assert.deepEqual(blockedTrajectory, fixture.expected_blocked_private_raw_trajectory, "blocked trajectory matches expected fixture");
  assert.equal(blockedTrajectory.status, "blocked_private_or_raw_payload", "private/raw input is blocked");
  assertNoUnsafePayloadEcho(blockedTrajectory);

  const routeDerivedInput = createRouteDerivedInputWithEvidenceAndTensions();
  const routeDerivedTrajectory = builder.buildPerspectiveTrajectoryV01(routeDerivedInput);
  const repeatedRouteDerivedTrajectory = builder.buildPerspectiveTrajectoryV01(routeDerivedInput);
  assert.deepEqual(
    repeatedRouteDerivedTrajectory,
    routeDerivedTrajectory,
    "route-derived trajectory build is deterministic",
  );
  assert(
    routeDerivedTrajectory.supporting_evidence_refs.includes("source-ref:supporting:route:001"),
    "route-derived supporting evidence refs are preserved",
  );
  assert.equal(
    routeDerivedTrajectory.current_state_summary,
    "Current durable Perspective state summary for perspective:trajectory:route-derived:001.",
    "route-derived current state summary remains the durable state summary",
  );
  assert(
    routeDerivedTrajectory.contradicting_evidence_refs.includes("source-ref:contradicting:route:001"),
    "route-derived contradicting evidence refs are preserved",
  );
  assert(
    routeDerivedTrajectory.open_tension_refs.includes("tension:open:route:001"),
    "route-derived open tension refs are preserved",
  );
  assert(
    routeDerivedTrajectory.resolved_tension_refs.includes("tension:resolved:route:001"),
    "route-derived resolved tension refs are preserved",
  );
  assert(
    !routeDerivedTrajectory.supporting_evidence_refs.includes("source-ref:contradicting:route:001"),
    "contradicting evidence is not cross-contaminated into supporting refs",
  );
  assert(
    !routeDerivedTrajectory.contradicting_evidence_refs.includes("source-ref:supporting:route:001"),
    "supporting evidence is not cross-contaminated into contradicting refs",
  );
  assert(
    !routeDerivedTrajectory.open_tension_refs.includes("tension:resolved:route:001"),
    "resolved tensions are not cross-contaminated into open tension refs",
  );
  assert(
    !routeDerivedTrajectory.resolved_tension_refs.includes("tension:open:route:001"),
    "open tensions are not cross-contaminated into resolved tension refs",
  );

  const runtimeUnsafePerspectiveId = "/Users/private/perspective";
  const runtimeBlockedPerspectiveInput = {
    ...fixture.expected_input,
    perspective_id: runtimeUnsafePerspectiveId,
  };
  const runtimeBlockedPerspectiveOutput = builder.buildPerspectiveTrajectoryV01(runtimeBlockedPerspectiveInput);
  assert.equal(
    runtimeBlockedPerspectiveOutput.status,
    "blocked_private_or_raw_payload",
    "runtime unsafe perspective id is blocked",
  );
  assert.equal(
    runtimeBlockedPerspectiveOutput.perspective_id,
    "perspective:trajectory:blocked",
    "runtime unsafe perspective id is not echoed",
  );
  assert(
    !JSON.stringify(runtimeBlockedPerspectiveOutput).includes(runtimeUnsafePerspectiveId),
    "runtime unsafe perspective id does not appear in blocked output",
  );

  const runtimeUnsafeAsOf = "/Users/private/as-of";
  const runtimeBlockedAsOfInput = {
    ...fixture.expected_input,
    as_of: runtimeUnsafeAsOf,
  };
  const runtimeBlockedAsOfOutput = builder.buildPerspectiveTrajectoryV01(runtimeBlockedAsOfInput);
  assert.equal(runtimeBlockedAsOfOutput.status, "blocked_private_or_raw_payload", "runtime unsafe as_of is blocked");
  assert.equal(
    runtimeBlockedAsOfOutput.as_of,
    "2026-06-26T00:00:00.000Z",
    "runtime unsafe as_of is not echoed",
  );
  assert(
    !JSON.stringify(runtimeBlockedAsOfOutput).includes(runtimeUnsafeAsOf),
    "runtime unsafe as_of does not appear in blocked output",
  );
}

function createRouteDerivedInputWithEvidenceAndTensions() {
  const asOf = "2026-06-26T00:00:00.000Z";
  const authorityBoundary = builder.createPerspectiveTrajectoryAuthorityBoundaryV01();
  const durableState = {
    state_version: "durable_perspective_state.v0.1",
    apply_version: "durable_perspective_state_apply.v0.1",
    scope,
    perspective_id: "perspective:trajectory:route-derived:001",
    current_thesis: "Route-derived durable Perspective thesis summary.",
    prior_theses: ["prior-thesis:route:001"],
    active_claims: [
      {
        claim_ref: "claim-candidate:route:active:001",
        bounded_summary: "Bounded active claim preserved from durable state.",
        source_refs: ["source-ref:supporting:route:001"],
        reason_codes: ["selected_candidate_ref_present", "durable_state_applied"],
      },
    ],
    retired_claims: [
      {
        claim_ref: "claim-candidate:route:retired:001",
        bounded_summary: "Bounded retired claim preserved from durable state.",
        source_refs: ["source-ref:contradicting:route:001"],
        reason_codes: ["retired_claim_preserved", "durable_state_applied"],
      },
    ],
    supporting_evidence_refs: ["source-ref:supporting:route:001"],
    contradicting_evidence_refs: ["source-ref:contradicting:route:001"],
    open_tensions: [
      {
        tension_ref: "tension:open:route:001",
        bounded_summary: "Bounded open tension preserved from durable state.",
        source_refs: ["source-ref:supporting:route:001"],
        reason_codes: ["unresolved_tension_preserved"],
      },
    ],
    resolved_tensions: [
      {
        tension_ref: "tension:resolved:route:001",
        bounded_summary: "Bounded resolved tension preserved from durable state.",
        source_refs: ["source-ref:contradicting:route:001"],
        reason_codes: ["unresolved_tension_resolved_explicitly"],
      },
    ],
    knowledge_gaps: [
      {
        knowledge_gap_ref: "knowledge-gap:route:001",
        bounded_summary: "Bounded knowledge gap preserved from durable state.",
        source_refs: ["source-ref:supporting:route:001"],
        gap_status: "open",
        reason_codes: ["knowledge_gap_preserved"],
      },
    ],
    promotion_history: ["promotion-decision:route:001"],
    retirement_history: ["claim-candidate:route:retired:001"],
    formation_receipt_refs: ["formation-receipt:route:001"],
    salience_state: { salience_ref: "salience:route:001" },
    reuse_conditions: ["reuse-condition:route:001"],
    created_at: asOf,
    updated_at: "2026-06-26T00:05:00.000Z",
    authority_boundary: authorityBoundary,
    reason_codes: ["durable_state_applied", "formation_receipt_required_before_state_apply"],
    state_fingerprint: "state-fingerprint:route:001",
  };
  const durableApplyEvent = {
    apply_event_version: "durable_perspective_state_apply_event.v0.1",
    apply_version: "durable_perspective_state_apply.v0.1",
    state_version: "durable_perspective_state.v0.1",
    scope,
    apply_event_id: "durable-state-apply:event:route:001",
    perspective_id: durableState.perspective_id,
    promotion_decision_id: "promotion-decision:route:001",
    formation_receipt_id: "formation-receipt:route:001",
    review_record_ref: "review-record:route:001",
    operator_actor_ref: "operator:route:001",
    apply_operation: "add",
    applied_at: "2026-06-26T00:04:00.000Z",
    prior_state_version: null,
    next_state_version: "durable_perspective_state.v0.1",
    selected_candidate_refs: ["claim-candidate:route:active:001"],
    omitted_candidate_refs: ["claim-candidate:route:omitted:001"],
    deferred_candidate_refs: ["claim-candidate:route:deferred:001"],
    unresolved_tensions_preserved: ["tension:open:route:001"],
    knowledge_gaps_preserved: ["knowledge-gap:route:001"],
    durable_state_applied: true,
    formation_receipt_written: true,
    promotion_executed: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    product_write_executed: false,
    reason_codes: ["durable_state_applied", "promotion_decision_ref_present", "formation_receipt_ref_present"],
    authority_boundary: authorityBoundary,
  };
  return builder.createPerspectiveTrajectoryInputFromDurableStateV01({
    state: durableState,
    apply_events: [durableApplyEvent],
    as_of: asOf,
    feedback_refs: ["feedback-ref:route:001"],
    source_refs: [
      {
        source_ref: "source-ref:supporting:route:001",
        bounded_summary: "Bounded supporting source ref summary for route-derived trajectory.",
        reason_codes: ["source_ref_present", "trajectory_is_read_only"],
      },
      {
        source_ref: "source-ref:contradicting:route:001",
        bounded_summary: "Bounded contradicting source ref summary for route-derived trajectory.",
        reason_codes: ["source_ref_present", "contradiction_preserved", "trajectory_is_read_only"],
      },
    ],
    boundary_notes: [
      "Perspective trajectory is read-only.",
      "Route-derived trajectory preserves durable evidence and tension status.",
      "Product-write remains parked by #686.",
    ],
  });
}

function assertBuilderExports() {
  for (const exportName of [
    "PERSPECTIVE_TRAJECTORY_BUILDER_VERSION",
    "PERSPECTIVE_TRAJECTORY_EVENT_VERSION",
    "PERSPECTIVE_TRAJECTORY_VERSION",
    "allowedPerspectiveTrajectoryEventKinds",
    "allowedPerspectiveTrajectoryLayers",
    "allowedPerspectiveTrajectoryReasonCodes",
    "buildPerspectiveTrajectoryV01",
    "validatePerspectiveTrajectoryInputV01",
    "validatePerspectiveTrajectoryEventV01",
    "createPerspectiveTrajectoryAuthorityBoundaryV01",
    "createPerspectiveTrajectoryFingerprintV01",
    "createPerspectiveTrajectoryInputFromDurableStateV01",
  ]) {
    assert.equal(typeof builder[exportName] !== "undefined", true, `${exportName} is exported`);
  }
  assertIncludes(builderText, "dedupeAndSortEvents", "builder deduplicates and sorts events");
  assertIncludes(builderText, "occurred_at.localeCompare", "builder sorts by occurred_at");
  assertIncludes(builderText, "db_write_now: false", "builder boundary denies DB writes");
  assertIncludes(builderText, "source_fetch_now: false", "builder boundary denies source fetch");
  assertIncludes(builderText, "provider_openai_call_now: false", "builder boundary denies provider calls");
  assertIncludes(builderText, ":supporting-evidence", "builder emits supporting evidence state-derived events");
  assertIncludes(builderText, ":contradicting-evidence", "builder emits contradicting evidence state-derived events");
  assertIncludes(builderText, ":open-tensions", "builder emits open tension state-derived events");
  assertIncludes(builderText, ":resolved-tensions", "builder emits resolved tension state-derived events");
  assertIncludes(builderText, "isPublicSafeNonEmptyString", "builder sanitizes blocked top-level output fields");
  assertIncludes(readHelperText, "buildDurablePerspectiveStateReadModelV01", "read helper remains available");
  assertIncludes(stateStoreText, "readDurablePerspectiveStateV01", "state store read helper remains available");
}

function assertStaticRouteBoundaries() {
  assertIncludes(routeText, "export async function GET", "trajectory route exports GET");
  for (const snippet of forbiddenRouteSnippets) {
    assert(!routeText.includes(snippet), `trajectory route must not contain ${snippet}`);
  }
  assertIncludes(routeText, "openReadOnlyLocalDb", "trajectory route uses read-only DB opener");
  assertIncludes(routeText, "readonly: true", "trajectory route has read-only DB option");
  assertIncludes(routeText, "fileMustExist: true", "trajectory route requires existing DB file");
  assertIncludes(routeText, "db_missing", "trajectory route has db_missing path");
  assertIncludes(routeText, "schema_missing", "trajectory route has schema_missing path");
  assertIncludes(routeText, "createPerspectiveTrajectoryAuthorityBoundaryV01", "trajectory route includes authority boundary");
  assertIncludes(routeText, "buildPerspectiveTrajectoryV01", "trajectory route builds trajectory");
  assertIncludes(routeText, "readDurablePerspectiveStateV01", "trajectory route reads durable state");
  assertIncludes(routeText, "listDurablePerspectiveApplyEventsV01", "trajectory route reads apply events");
}

function assertComponentBoundaries() {
  for (const phrase of [
    "Perspective trajectory is read-only",
    "Derived view, not source of truth",
    "No state mutation",
    "No product write",
    "Product-write remains parked",
  ]) {
    assertIncludes(componentText, phrase, `component contains ${phrase}`);
  }
  for (const snippet of componentForbiddenSnippets) {
    assert(!componentText.includes(snippet), `component must not contain ${snippet}`);
  }
  assertIncludes(componentText, "current_state_summary", "component renders current state summary");
  assertIncludes(componentText, "trajectory.events", "component renders trajectory events");
  assertIncludes(componentText, "prior_thesis_refs", "component renders prior thesis refs");
  assertIncludes(componentText, "retired_claim_refs", "component renders retired claim refs");
  assertIncludes(componentText, "source_refs", "component renders source refs");
  assertNoForbiddenPositiveAuthorityGrants(componentText, "component");
}

function assertIndexCoverage() {
  const indexBlock = extractIndexBlock(indexText, "Perspective Trajectory Builder v0.1");
  for (const pointer of [
    docPath,
    builderPath,
    routePath,
    componentPath,
    fixturePath,
    "scripts/smoke-perspective-trajectory-v0-1.mjs",
  ]) {
    assertIncludes(indexBlock, pointer, `index block points to ${pointer}`);
  }
  assertIncludes(indexBlock, "read-only derived trajectory view", "index mentions read-only derived view");
  assertIncludes(indexBlock, "Product-write remains parked by #686", "index mentions parked product write");
  for (const forbiddenText of [
    "durable state mutation was added",
    "promotion was added",
    "Formation Receipt write was added",
    "product-write was added",
    "proof/evidence row writes were added",
    "Git Ledger export was added",
    "provider calls were added",
    "source fetch was added",
  ]) {
    assert(!indexBlock.includes(forbiddenText), `index block must not imply ${forbiddenText}`);
  }
  assertNoForbiddenPositiveAuthorityGrants(indexBlock, "index block");
}

function assertDocsCoverage() {
  for (const phrase of docsExactPhrases) assertIncludes(docText, phrase, `doc contains ${phrase}`);
  assertNoForbiddenPositiveAuthorityGrants(docText, "doc");
}

function assertFixturePrivacy() {
  const sanitized = allowedFixturePlaceholders.reduce(
    (text, placeholder) => text.split(placeholder).join(""),
    fixtureText,
  );
  for (const marker of forbiddenFixtureMarkers) {
    assert(!sanitized.includes(marker), `fixture must not contain forbidden marker ${marker}`);
  }
}

function assertBoundary(boundary, label) {
  assert.equal(boundary.trajectory_read_model_now, true, `${label} is read model`);
  assert.equal(boundary.derived_view_only, true, `${label} is derived view only`);
  for (const field of boundaryFalseFields) {
    assert.equal(boundary[field], false, `${label} keeps ${field} false`);
  }
}

function assertEventsSorted(events) {
  const sorted = [...events].sort((a, b) =>
    a.occurred_at.localeCompare(b.occurred_at) ||
    a.event_kind.localeCompare(b.event_kind) ||
    a.event_id.localeCompare(b.event_id),
  );
  assert.deepEqual(
    events.map((event) => event.event_id),
    sorted.map((event) => event.event_id),
    "events are sorted deterministically",
  );
}

function assertNoUnsafePayloadEcho(value) {
  const text = JSON.stringify(value);
  for (const placeholder of allowedFixturePlaceholders) {
    assert(!text.includes(placeholder), `result must not echo ${placeholder}`);
  }
}

function assertNoForbiddenPositiveAuthorityGrants(text, label) {
  for (const grant of forbiddenPositiveAuthorityGrants) {
    assert(!text.includes(grant), `${label} must not contain ${grant}`);
  }
}

function extractIndexBlock(text, heading) {
  const start = text.indexOf(`- ${heading}:`);
  assert(start >= 0, `index block exists for ${heading}`);
  const after = text.slice(start + 2);
  const next = after.search(/\n- [^\n]+:/);
  return next >= 0 ? after.slice(0, next) : after;
}

function assertIncludes(text, needle, message) {
  assert(text.includes(needle), message);
}

function readText(path) {
  return readFileSync(path, "utf8");
}
