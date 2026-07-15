import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const tempDir = mkdtempSync(path.join(tmpdir(), "augnes-authority-invariants-"));
process.env.AUGNES_DB_PATH = path.join(tempDir, "augnes.db");
delete process.env.OPENAI_API_KEY;

let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("authority invariant smoke must not make live external calls");
};

let SCOPE = "project:authority-invariants";
let WORKSPACE_ID = "";
let ACTIVE_SELECTION_REVISION = 0;
const WORK_ID = "AG-AUTHORITY-INVARIANTS";

const AUTHORITY_TABLES = [
  "agents",
  "sessions",
  "messages",
  "state_delta_proposals",
  "state_entries",
  "state_transitions",
  "state_tensions",
  "action_records",
  "work_items",
  "work_events",
  "handoffs",
  "mailbox_messages",
  "publication_drafts",
  "publication_approval_requests",
  "publication_approval_decisions",
  "publication_readiness_checks",
  "delivery_ledger",
  "verification_evidence_records",
  "temporal_preview_review_artifacts",
  "temporal_preview_review_artifact_idempotency",
  "coordination_events",
];

const invariantResults = [];

try {
  const { resetDatabase, openDatabase } = await import("./db-common.mjs");
  const db = resetDatabase();
  const {
    getOrCreateCanonicalProjectForLocalRootV01,
    getOrCreateDefaultWorkspaceIdentityV01,
    normalizeLocalProjectRootRefV01,
  } = await import("../lib/vnext/persistence/project-identity-registry.ts");
  const {
    selectActiveProjectV01,
    touchRecentProjectV01,
  } = await import("../lib/vnext/persistence/project-lifecycle-registry.ts");
  const workspace = getOrCreateDefaultWorkspaceIdentityV01(db, {
    create_uuid: () => "11111111-1111-4111-8111-111111111111",
    now: () => "2026-07-15T00:00:00.000Z",
  });
  const localRoot = normalizeLocalProjectRootRefV01(tempDir, {
    base_path: path.parse(tempDir).root,
  });
  const registration = getOrCreateCanonicalProjectForLocalRootV01(
    db,
    {
      workspace_id: workspace.workspace_id,
      local_root: localRoot,
      display_name: "authority-invariants",
    },
    {
      create_uuid: () => "22222222-2222-4222-8222-222222222222",
      now: () => "2026-07-15T00:00:01.000Z",
    },
  );
  touchRecentProjectV01(db, {
    workspace_id: workspace.workspace_id,
    project_id: registration.project.project_id,
    now: "2026-07-15T00:00:02.000Z",
  });
  const selection = selectActiveProjectV01(db, {
    workspace_id: workspace.workspace_id,
    project_id: registration.project.project_id,
    expected_project_id: null,
    expected_revision: null,
    now: "2026-07-15T00:00:03.000Z",
  });
  WORKSPACE_ID = workspace.workspace_id;
  SCOPE = registration.project.project_id;
  ACTIVE_SELECTION_REVISION = selection.selection_revision;
  seedWorkItem(db);
  db.close();

  const {
    assertDerivedViewOnly,
    assertNoCoreAuthority,
    getExecutionLane,
  } = await import("../lib/execution-lanes.ts");

  assertNoCoreAuthority("chatgpt_mcp_bridge");
  assertNoCoreAuthority("openai_responses_api");
  assertNoCoreAuthority("codex_worker");
  assertNoCoreAuthority("github_code_history");
  assertNoCoreAuthority("github_publication_actuator");
  assertDerivedViewOnly("cockpit");
  assertDerivedViewOnly("browser_or_mcp_inspector");
  assert.equal(getExecutionLane("augnes_core").authority.can_commit_or_reject_state, true);
  assert.equal(getExecutionLane("codex_worker").authority.can_modify_worktree, true);
  assert.equal(getExecutionLane("codex_worker").authority.can_open_pull_request, true);
  assert.equal(getExecutionLane("codex_worker").authority.can_merge_pull_request, false);
  assert.equal(
    getExecutionLane("github_publication_actuator").core_gate_required_for_external_publish,
    true,
  );

  await observeDoesNotCommit(openDatabase);
  await planDoesNotMutate(openDatabase);
  await temporalPreviewIsReadOnly(openDatabase);
  await bridgeRecordActionDoesNotCommit(openDatabase);
  await codexCompletionRecordsTraceOnly(openDatabase);
  await githubPublishRequiresCoreGate(openDatabase);
  await stateBriefIsDerivedView(openDatabase);
  await controlPacketIsDerivedView(openDatabase);

  assert.equal(fetchCalls, 0, "smoke should make no fetch/OpenAI/GitHub calls");

  console.log(
    JSON.stringify(
      {
        smoke: "authority-invariants",
        invariant_count: invariantResults.length,
        invariants: invariantResults,
        route_level_limitations: [
          "This smoke directly invokes selected Next route handlers and helper functions without starting a Next server.",
          "Full HTTP route-level enforcement remains future integration-test work.",
          "bridge_record_action_does_not_commit checks pending proposal commit/reject invariants; existing action recording still follows the current action-proof state transition behavior.",
        ],
        fetch_calls: fetchCalls,
        db_path_removed: true,
      },
      null,
      2,
    ),
  );
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

async function observeDoesNotCommit(openDatabase) {
  const before = readAuthoritySnapshot(openDatabase);
  const observeRoute = await import("../app/api/observe/route.ts");
  const response = await observeRoute.POST(
    jsonRequest("http://localhost/api/observe", {
      workspace_id: WORKSPACE_ID,
      project_id: SCOPE,
      expected_active_project_id: SCOPE,
      expected_active_selection_revision: ACTIVE_SELECTION_REVISION,
      project_root: {
        path_flavor: process.platform === "win32" ? "win32" : "posix",
        normalized_path: tempDir,
      },
      session_id: "session:authority-observe",
      message: "Augnes authority invariant smoke.",
    }),
  );
  const body = await response.json();
  const after = readAuthoritySnapshot(openDatabase);

  assert.equal(response.status, 201, "observe should create pending proposals");
  assert.equal(body.compiler, "mock", "observe smoke should use mock compiler");
  assert.equal(body.model_invocation_receipt.project_id, SCOPE);
  assert.equal(body.model_invocation_receipt.egress_attempted, false);
  assert.equal(body.proposals.length, 1, "observe fixture should create one proposal");
  assert.equal(body.proposals[0].status, "pending", "observe proposal should remain pending");
  assertCountDeltas(before, after, {
    agents: 1,
    sessions: 1,
    messages: 1,
    state_delta_proposals: 1,
  });
  assert.equal(
    after.proposal_status.committed,
    before.proposal_status.committed,
    "observe must not commit proposals",
  );
  assert.equal(
    after.proposal_status.rejected,
    before.proposal_status.rejected,
    "observe must not reject proposals",
  );
  assert.equal(
    after.counts.state_entries,
    before.counts.state_entries,
    "observe must not create committed state entries",
  );
  assert.equal(
    after.counts.state_transitions,
    before.counts.state_transitions,
    "observe must not create state transitions",
  );
  assertNoPublicationMutation(before, after, "observe");

  recordInvariant("observe_does_not_commit", {
    route_invocation: "direct Next route handler",
    allowed_writes: ["agents", "sessions", "messages", "pending state_delta_proposals"],
    proposal_status: body.proposals[0].status,
  });
}

async function planDoesNotMutate(openDatabase) {
  const { buildPlan } = await import("../lib/planner/planner.ts");
  const before = readAuthoritySnapshot(openDatabase);
  const plan = await buildPlan({
    workspace_id: WORKSPACE_ID,
    project_id: SCOPE,
    expected_active_project_id: SCOPE,
    expected_active_selection_revision: ACTIVE_SELECTION_REVISION,
    project_root: {
      path_flavor: process.platform === "win32" ? "win32" : "posix",
      normalized_path: tempDir,
    },
    execution_mode: "deterministic",
    message: "What should happen next?",
  });
  const after = readAuthoritySnapshot(openDatabase);

  assert.equal(plan.planner, "mock", "plan smoke should use mock planner");
  assertReadOnlySnapshot(before, after, "plan_does_not_mutate");

  recordInvariant("plan_does_not_mutate", {
    invocation: "buildPlan helper",
    recommendation_count: plan.recommendations.length,
  });
}

async function temporalPreviewIsReadOnly(openDatabase) {
  const { buildTemporalInterpretationPreview } = await import(
    "../lib/temporal-interpretation/preview.ts"
  );
  const { buildTemporalPreviewReviewArtifactInputFromPreview } = await import(
    "../lib/temporal-review-artifact-capture.ts"
  );
  const before = readAuthoritySnapshot(openDatabase);
  const preview = await buildTemporalInterpretationPreview({
    workspace_id: WORKSPACE_ID,
    project_id: SCOPE,
    expected_active_project_id: SCOPE,
    expected_active_selection_revision: ACTIVE_SELECTION_REVISION,
    project_root: {
      path_flavor: process.platform === "win32" ? "win32" : "posix",
      normalized_path: tempDir,
    },
    execution_mode: "deterministic",
  });
  const artifactInput = buildTemporalPreviewReviewArtifactInputFromPreview(preview, {
    source_surface: "local_runtime",
    source_ref: "authority-invariant-smoke",
    capture_mode: "smoke_preview_input_only",
    reviewer_verdict: "preview_input_built_without_insert",
    created_by: "authority-invariant-smoke",
  });
  const after = readAuthoritySnapshot(openDatabase);

  assert.equal(preview.generator, "mock", "temporal preview smoke should use mock preview");
  assert.match(
    preview.boundaries.join("\n"),
    /Read-only preview only/,
    "temporal preview should state read-only boundary",
  );
  assert.equal(
    typeof artifactInput.preview_hash,
    "string",
    "capture input builder should produce bounded artifact input",
  );
  assertReadOnlySnapshot(before, after, "temporal_preview_is_read_only");

  recordInvariant("temporal_preview_is_read_only", {
    invocation: "buildTemporalInterpretationPreview plus pure capture-input builder",
    capture_insert_path_used: false,
    route_level_fallback: "no Next server started",
  });
}

async function bridgeRecordActionDoesNotCommit(openDatabase) {
  const routeSource = readFileSync("app/api/actions/record/route.ts", "utf8");
  const helperSource = readFileSync("lib/actions/local-tools.ts", "utf8");
  assert.doesNotMatch(routeSource, /commitStateDeltaProposal|rejectStateDeltaProposal/);
  assert.doesNotMatch(helperSource, /commitStateDeltaProposal|rejectStateDeltaProposal/);

  const before = readAuthoritySnapshot(openDatabase);
  const actionRecordRoute = await import("../app/api/actions/record/route.ts");
  const response = await actionRecordRoute.POST(
    jsonRequest("http://localhost/api/actions/record", {
      scope: SCOPE,
      source_agent_id: "agent:bridge-authority-smoke",
      action_name: "bridge authority smoke",
      result_summary: "Bridge action-result smoke recorded trace without proposal commit/reject.",
      result_status: "completed",
      result_kind: "verification",
      files_changed: [],
      work_id: WORK_ID,
    }),
  );
  const after = readAuthoritySnapshot(openDatabase);

  assert.equal(response.status, 201, "bridge action recording should pass");
  assertCountDeltas(before, after, {
    agents: 1,
    state_entries: 1,
    state_transitions: 1,
    action_records: 1,
    coordination_events: 1,
  });
  assert.equal(
    after.proposal_status.committed,
    before.proposal_status.committed,
    "bridge recording must not commit pending proposals",
  );
  assert.equal(
    after.proposal_status.rejected,
    before.proposal_status.rejected,
    "bridge recording must not reject pending proposals",
  );
  assertNoPublicationMutation(before, after, "bridge action recording");

  recordInvariant("bridge_record_action_does_not_commit", {
    invocation: "direct POST /api/actions/record handler",
    allowed_writes: ["agents", "action_records", "coordination_events", "current action-proof state transition behavior"],
    fallback_scope: "asserts no pending-proposal commit/reject; preserves existing action record behavior",
  });
}

async function codexCompletionRecordsTraceOnly(openDatabase) {
  const { createEvidenceRecord } = await import("../lib/evidence-records.ts");
  const { appendWorkEvent } = await import("../lib/work.ts");
  const before = readAuthoritySnapshot(openDatabase);

  const evidence = createEvidenceRecord({
    evidence_id: "evidence:authority-invariant-codex",
    scope: SCOPE,
    work_id: WORK_ID,
    evidence_kind: "check_passed",
    label: "Authority invariant Codex evidence",
    status: "passed",
    result_summary: "Codex evidence helper recorded proof without state commit/reject or publish.",
    source_surface: "codex",
    source_ref: "authority-invariant-smoke",
    created_by: "codex-smoke",
  });
  const event = appendWorkEvent({
    work_id: WORK_ID,
    scope: SCOPE,
    actor: "codex",
    event_type: "verification",
    summary: "Codex authority invariant trace recorded.",
    result_status: "completed",
    result_kind: "verification",
    related_state_keys: [],
  });
  const after = readAuthoritySnapshot(openDatabase);

  assert.equal(evidence.evidence_id, "evidence:authority-invariant-codex");
  assert.equal(event.work_id, WORK_ID);
  assertCountDeltas(before, after, {
    work_events: 1,
    verification_evidence_records: 1,
    coordination_events: 1,
  });
  assert.equal(after.counts.state_entries, before.counts.state_entries);
  assert.equal(after.counts.state_transitions, before.counts.state_transitions);
  assert.equal(after.proposal_status.committed, before.proposal_status.committed);
  assert.equal(after.proposal_status.rejected, before.proposal_status.rejected);
  assertNoPublicationMutation(before, after, "codex trace recording");

  recordInvariant("codex_completion_records_trace_only", {
    invocation: "createEvidenceRecord plus appendWorkEvent helpers",
    allowed_writes: ["verification_evidence_records", "work_events", "coordination_events"],
  });
}

async function githubPublishRequiresCoreGate(openDatabase) {
  const {
    CORE_GATED_PUBLISH_BOUNDARIES,
    CORE_GATED_PUBLISH_GATE_CHECKS,
    validateGitHubPrCommentPublishRequest,
  } = await import("../lib/core-gated-publish.ts");
  const { getExecutionLane } = await import("../lib/execution-lanes.ts");
  const lane = getExecutionLane("github_publication_actuator");
  const before = readAuthoritySnapshot(openDatabase);

  assert.equal(lane.authority.can_publish_external, true);
  assert.equal(lane.core_gate_required_for_external_publish, true);
  assert.equal(lane.authority.can_modify_worktree, false);
  assert.equal(lane.authority.can_open_pull_request, false);
  assert.equal(lane.authority.can_merge_pull_request, false);
  assert(
    CORE_GATED_PUBLISH_GATE_CHECKS.includes("dry_run=false requires explicit target approval"),
    "publish gate should require explicit target approval",
  );
  assert(
    CORE_GATED_PUBLISH_BOUNDARIES.some((boundary) => boundary.includes("does not merge PRs")),
    "publish boundaries should reject merge authority",
  );
  assert.throws(
    () =>
      validateGitHubPrCommentPublishRequest({
        readinessCheckId: "readiness_check:authority-smoke",
        body: {
          scope: SCOPE,
          requested_by: "authority-smoke",
          dry_run: false,
          idempotency_key: "authority-smoke",
        },
      }),
    /explicit_target_approval=true/,
  );
  assert.throws(
    () =>
      validateGitHubPrCommentPublishRequest({
        readinessCheckId: "readiness_check:authority-smoke",
        body: {
          scope: SCOPE,
          requested_by: "authority-smoke",
          dry_run: true,
          idempotency_key: "authority-smoke",
          merge: true,
        },
      }),
    /merge is not accepted/,
  );
  const dryRunRequest = validateGitHubPrCommentPublishRequest({
    readinessCheckId: "readiness_check:authority-smoke",
    body: {
      scope: SCOPE,
      requested_by: "authority-smoke",
      dry_run: true,
      idempotency_key: "authority-smoke",
    },
  });
  const after = readAuthoritySnapshot(openDatabase);

  assert.equal(dryRunRequest.dryRun, true);
  assertReadOnlySnapshot(before, after, "github_publish_requires_core_gate");

  recordInvariant("github_publish_requires_core_gate", {
    invocation: "pure Core-gated publish request validator and lane metadata",
    live_github_call: false,
    core_gate_required_for_external_publish: lane.core_gate_required_for_external_publish,
  });
}

async function stateBriefIsDerivedView(openDatabase) {
  const { buildStateBrief } = await import("../lib/state/brief.ts");
  const before = readAuthoritySnapshot(openDatabase);
  const brief = buildStateBrief(SCOPE);
  const after = readAuthoritySnapshot(openDatabase);

  assert.equal(brief.runtime, "augnes");
  assertReadOnlySnapshot(before, after, "state_brief_is_derived_view");

  recordInvariant("state_brief_is_derived_view", {
    invocation: "buildStateBrief helper",
    pending_proposals_visible: brief.pending_proposals.length,
  });
}

async function controlPacketIsDerivedView(openDatabase) {
  const { buildControlPacket } = await import("../lib/control-packet.ts");
  const before = readAuthoritySnapshot(openDatabase);
  const packet = buildControlPacket({ scope: SCOPE });
  const after = readAuthoritySnapshot(openDatabase);

  assert.equal(packet.boundaries.derived_view_only, true);
  assert.equal(packet.boundaries.state_commit_or_reject, false);
  assert.equal(packet.boundaries.publish_authority, false);
  assert.equal(packet.boundaries.creates_durable_records, false);
  assert.equal(packet.boundaries.external_side_effects, false);
  assertReadOnlySnapshot(before, after, "control_packet_is_derived_view");

  recordInvariant("control_packet_is_derived_view", {
    invocation: "buildControlPacket helper",
    derived_view_only: packet.boundaries.derived_view_only,
  });
}

function seedWorkItem(db) {
  db.prepare(
    `
      INSERT INTO work_items (
        work_id,
        scope,
        title,
        status,
        priority,
        summary,
        next_action,
        user_attention_required,
        related_state_keys,
        links,
        created_at,
        updated_at
      )
      VALUES (
        @work_id,
        @scope,
        @title,
        @status,
        @priority,
        @summary,
        @next_action,
        @user_attention_required,
        @related_state_keys,
        @links,
        @created_at,
        @updated_at
      )
    `,
  ).run({
    work_id: WORK_ID,
    scope: SCOPE,
    title: "Authority invariant smoke",
    status: "in_progress",
    priority: "now",
    summary: "Seed work item for authority invariant smoke.",
    next_action: "Run authority invariant smoke.",
    user_attention_required: 0,
    related_state_keys: "[]",
    links: "{}",
    created_at: "2026-05-18T00:00:00.000Z",
    updated_at: "2026-05-18T00:00:00.000Z",
  });
}

function jsonRequest(url, body) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function readAuthoritySnapshot(openDatabase) {
  const db = openDatabase();
  try {
    const tableRows = Object.fromEntries(
      AUTHORITY_TABLES.map((table) => [
        table,
        db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all(),
      ]),
    );
    const counts = Object.fromEntries(
      AUTHORITY_TABLES.map((table) => [table, tableRows[table].length]),
    );
    const proposalStatus = Object.fromEntries(
      ["pending", "committed", "rejected"].map((status) => [
        status,
        db
          .prepare(
            `
              SELECT COUNT(*) AS count
              FROM state_delta_proposals
              WHERE status = ?
            `,
          )
          .get(status).count,
      ]),
    );

    return {
      counts,
      proposal_status: proposalStatus,
      table_hashes: Object.fromEntries(
        AUTHORITY_TABLES.map((table) => [table, hashRows(tableRows[table])]),
      ),
    };
  } finally {
    db.close();
  }
}

function hashRows(rows) {
  return createHash("sha256").update(JSON.stringify(rows)).digest("hex");
}

function assertReadOnlySnapshot(before, after, invariantName) {
  assert.deepEqual(after, before, `${invariantName} must not mutate authority tables`);
}

function assertCountDeltas(before, after, expectedDeltas) {
  for (const table of AUTHORITY_TABLES) {
    const expected = expectedDeltas[table] ?? 0;
    const actual = after.counts[table] - before.counts[table];
    assert.equal(actual, expected, `${table} count delta should be ${expected}`);
  }
}

function assertNoPublicationMutation(before, after, label) {
  for (const table of [
    "publication_drafts",
    "publication_approval_requests",
    "publication_approval_decisions",
    "publication_readiness_checks",
    "delivery_ledger",
  ]) {
    assert.equal(
      after.table_hashes[table],
      before.table_hashes[table],
      `${label} must not mutate ${table}`,
    );
  }
}

function recordInvariant(name, details) {
  invariantResults.push({
    name,
    passed: true,
    ...details,
  });
}
