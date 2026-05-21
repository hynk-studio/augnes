import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const tempDir = mkdtempSync(
  path.join(tmpdir(), "augnes-sidecar-et-runtime-boundaries-"),
);
process.env.AUGNES_DB_PATH = path.join(tempDir, "augnes.db");
delete process.env.OPENAI_API_KEY;
delete process.env.GITHUB_TOKEN;
delete process.env.GH_TOKEN;
delete process.env.GITHUB_APP_ID;
delete process.env.GITHUB_APP_INSTALLATION_ID;
delete process.env.GITHUB_APP_PRIVATE_KEY;

let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error(
    "Sidecar e_t runtime boundary smoke must not make live external calls",
  );
};

const CLEAN_SCOPE = "project:sidecar-et-runtime-clean";
const REPEATED_SCOPE = "project:sidecar-et-runtime-repeated";
const MISSING_SCOPE = "project:sidecar-et-runtime-missing";
const AMBIGUOUS_SCOPE = "project:sidecar-et-runtime-ambiguous";
const SOURCE_REF_BOUNDARY_SCOPE =
  "project:sidecar-et-runtime-source-ref-boundary";
const OUTSIDE_SOURCE_REF_SCOPE =
  "project:sidecar-et-runtime-outside-source-ref";
const REPEATED_WORK_ID = "AG-SIDECAR-ET-RUNTIME-REPEATED";

const RUNTIME_SCOPES = [
  CLEAN_SCOPE,
  REPEATED_SCOPE,
  MISSING_SCOPE,
  AMBIGUOUS_SCOPE,
  SOURCE_REF_BOUNDARY_SCOPE,
];
const ROUTE_SCOPES = [CLEAN_SCOPE, REPEATED_SCOPE];

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

try {
  const { resetDatabase, openDatabase } = await import("./db-common.mjs");
  const db = resetDatabase();
  seedRuntimeBoundaryScopes(db);
  db.close();

  const { buildPerspectiveSnapshot } = await import(
    "../lib/perspective/snapshot.ts"
  );
  const perspectiveSnapshotRoute = await import(
    "../app/api/perspective/snapshot/route.ts"
  );

  const before = readAuthoritySnapshot(openDatabase);
  assertNoCockpitSidecarActionInputs();
  assertRuntimeSnapshotWiring();
  assertNoExtraRuntimeSidecarRoute();

  const helperSnapshots = [];
  for (const scope of RUNTIME_SCOPES) {
    const snapshot = buildPerspectiveSnapshot({ scope });
    helperSnapshots.push(snapshot);
    assertRuntimeSnapshotPlaceholder(snapshot, scope);
    assertRuntimeSourceRefFallbackPolicy(snapshot);
    assertNoDiagnosticAuthority(snapshot);
    assertAuthorityUnchanged({
      openDatabase,
      before,
      label: `${scope} helper PerspectiveSnapshot`,
    });
  }

  for (const scope of ROUTE_SCOPES) {
    const snapshot = await readRouteSnapshot({
      route: perspectiveSnapshotRoute,
      scope,
    });
    assertRuntimeSnapshotPlaceholder(snapshot, scope);
    assertRuntimeSourceRefFallbackPolicy(snapshot);
    assertNoDiagnosticAuthority(snapshot);
    assertAuthorityUnchanged({
      openDatabase,
      before,
      label: `${scope} route PerspectiveSnapshot`,
    });
  }

  assert.equal(fetchCalls, 0, "Sidecar e_t runtime smoke should not call fetch");

  const repeatedSnapshot = helperSnapshots.find(
    (snapshot) => snapshot.scope === REPEATED_SCOPE,
  );
  assert(repeatedSnapshot, "repeated runtime scope should be checked");

  console.log(
    JSON.stringify(
      {
        smoke: "sidecar-et-runtime-boundaries",
        scopes_checked: RUNTIME_SCOPES,
        route_scopes_checked: ROUTE_SCOPES,
        route_invocation:
          "direct GET /api/perspective/snapshot handler for clean and repeated scopes; no Next server started",
        runtime_sidecar_placeholder_preserved: true,
        runtime_computation_enabled: false,
        runtime_source_refs_emitted: false,
        source_ref_subset_policy_designed: true,
        runtime_sidecar_source_refs_subset_policy:
          "runtime_sidecar_e_t.source_refs subset_of PerspectiveSnapshot.source_refs",
        unsupported_ambiguous_missing_empty_malformed_or_non_read_refs_fallback:
          "placeholder",
        loopness_only_bounded_runtime_computed_log_only_diagnostic: true,
        repeated_scope_loopness_level:
          repeatedSnapshot.research_diagnostics.loopness_hint.level,
        no_state_transition_writes: true,
        no_proposal_status_changes: true,
        no_evidence_or_proof_creation: true,
        no_work_action_mailbox_publication_delivery_temporal_mutation: true,
        no_openai_or_github_calls: true,
        no_extra_runtime_sidecar_route: true,
        authority_tables_mutated: false,
        fetch_calls: fetchCalls,
        cockpit_sidecar_actions_introduced: false,
      },
      null,
      2,
    ),
  );
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

async function readRouteSnapshot({ route, scope }) {
  const response = await route.GET(
    new Request(
      `http://localhost/api/perspective/snapshot?scope=${encodeURIComponent(
        scope,
      )}`,
    ),
  );

  assert.equal(
    response.status,
    200,
    `PerspectiveSnapshot route should return 200 for ${scope}`,
  );

  return response.json();
}

function assertRuntimeSnapshotPlaceholder(snapshot, scope) {
  assert.equal(snapshot.runtime, "augnes");
  assert.equal(snapshot.snapshot_version, "perspective_snapshot.v0.1");
  assert.equal(snapshot.scope, scope);
  assert.equal(snapshot.research_diagnostics.mode, "log_only");
  assertSidecarEtPlaceholder(snapshot.research_diagnostics.sidecar_e_t);
  assertLoopnessIsOnlyBoundedRuntimeComputedDiagnostic(snapshot);

  if (scope === CLEAN_SCOPE) {
    assert.equal(snapshot.pending_proposal_pressure.count, 0);
    assert.equal(snapshot.work_trace_basis.count, 0);
    assert.equal(snapshot.action_trace_basis.count, 0);
    assert.equal(snapshot.open_tensions.count, 0);
    assert.equal(snapshot.research_diagnostics.loopness_hint.level, "none");
  }

  if (scope === REPEATED_SCOPE) {
    assert.equal(snapshot.pending_proposal_pressure.count, 1);
    assert.equal(snapshot.work_trace_basis.count, 1);
    assert.equal(snapshot.action_trace_basis.count, 2);
    assert.equal(snapshot.open_tensions.count, 1);
    assert.equal(snapshot.research_diagnostics.loopness_hint.level, "medium");
  }

  if (scope === MISSING_SCOPE) {
    assert.equal(snapshot.source_refs.state_entry_ids.length, 0);
    assert.equal(snapshot.source_refs.action_record_ids.length, 0);
    assert.equal(snapshot.source_refs.work_event_ids.length, 0);
    assert.equal(snapshot.source_refs.tension_ids.length, 0);
  }

  if (scope === AMBIGUOUS_SCOPE) {
    assert(snapshot.pending_proposal_pressure.count > 0);
    assert(snapshot.open_tensions.count > 0);
    assert.equal(
      snapshot.authority_boundaries.can_commit_or_reject_state,
      false,
    );
  }

  if (scope === SOURCE_REF_BOUNDARY_SCOPE) {
    const serializedSidecar = JSON.stringify(
      snapshot.research_diagnostics.sidecar_e_t,
    );
    for (const nonReadRef of [
      "state:sidecar-et-runtime:outside-scope",
      "action:sidecar-et-runtime:not-read",
      "work-event:sidecar-et-runtime:not-read",
      "tension:sidecar-et-runtime:not-read",
    ]) {
      assert(
        !serializedSidecar.includes(nonReadRef),
        `runtime sidecar_e_t must not include non-read ref ${nonReadRef}`,
      );
    }
  }
}

function assertSidecarEtPlaceholder(sidecarEtHint) {
  assert.equal(sidecarEtHint.version, "sidecar_e_t.placeholder.v0.1");
  assert.equal(sidecarEtHint.mode, "log_only");
  assert.equal(sidecarEtHint.status, "placeholder");
  assert.equal(sidecarEtHint.computed, false);
  assert.deepEqual(sidecarEtHint.values, {
    e_t_register: null,
    qp_observability_proxy: null,
    z_t_regime_hint: null,
    sidecar_state_summary: null,
    sidecar_e_t_hat: null,
  });
  assert.deepEqual(sidecarEtHint.source_refs, []);

  const notes = sidecarEtHint.notes.join(" ");
  for (const requiredPhrase of [
    "not computed",
    "no authority",
    "not actual Sidecar state",
    "does not run a Sidecar loop",
    "update or commit z_t",
    "create QP output",
  ]) {
    assert(
      notes.includes(requiredPhrase),
      `Sidecar e_t placeholder notes should include: ${requiredPhrase}`,
    );
  }
}

function assertLoopnessIsOnlyBoundedRuntimeComputedDiagnostic(snapshot) {
  const diagnostics = snapshot.research_diagnostics;
  assert.equal(diagnostics.loopness_hint.version, "loopness_hint.v0.1");
  assert.equal(diagnostics.loopness_hint.mode, "log_only");
  assert(diagnostics.loopness_hint.score >= 0);
  assert(diagnostics.loopness_hint.score <= 1);
  assert(["none", "low", "medium", "high"].includes(
    diagnostics.loopness_hint.level,
  ));
  assert.equal(diagnostics.sidecar_e_t.computed, false);
  assert.equal(diagnostics.meta_wm_hint.computed, false);
  assert.equal(diagnostics.bsl_hint.computed, false);
  assert.equal(diagnostics.comp_index_hint.computed, false);
}

function assertRuntimeSourceRefFallbackPolicy(snapshot) {
  assert.deepEqual(
    snapshot.research_diagnostics.sidecar_e_t.source_refs,
    [],
    "runtime sidecar_e_t.source_refs must remain empty in the skeleton phase",
  );

  // Future runtime implementation gate:
  // runtime_sidecar_e_t.source_refs subset_of PerspectiveSnapshot.source_refs.
  // Unsupported, ambiguous, missing, empty, malformed, or non-read runtime refs
  // must fall back to the structured placeholder rather than emit refs.
  const perspectiveSnapshotRefs = flattenPerspectiveSnapshotRefs(
    snapshot.source_refs,
  );
  for (const runtimeRef of snapshot.research_diagnostics.sidecar_e_t.source_refs) {
    assert(
      perspectiveSnapshotRefs.has(runtimeRef),
      `runtime sidecar_e_t emitted non-read ref ${runtimeRef}`,
    );
  }
}

function flattenPerspectiveSnapshotRefs(sourceRefs) {
  return new Set(
    Object.values(sourceRefs)
      .filter(Array.isArray)
      .flat(),
  );
}

function assertNoDiagnosticAuthority(snapshot) {
  assert.equal(snapshot.authority_boundaries.derived_view_only, true);
  assert.equal(snapshot.authority_boundaries.source_of_truth, false);
  assert.equal(snapshot.authority_boundaries.can_commit_or_reject_state, false);
  assert.equal(snapshot.authority_boundaries.can_record_proof, false);
  assert.equal(snapshot.authority_boundaries.can_create_evidence, false);
  assert.equal(snapshot.authority_boundaries.can_update_work, false);
  assert.equal(snapshot.authority_boundaries.can_publish_external, false);
  assert.equal(snapshot.authority_boundaries.can_mutate_mailbox, false);
  assert.equal(snapshot.authority_boundaries.can_mutate_publication_state, false);
  assert.equal(snapshot.authority_boundaries.can_call_github_or_openai, false);
  assert.equal(
    snapshot.authority_boundaries.can_write_temporal_review_artifacts,
    false,
  );
  assert(
    snapshot.research_diagnostics.notes.some((note) =>
      note.includes("not authority"),
    ),
    "research diagnostics notes should include non-authority language",
  );
}

function assertNoCockpitSidecarActionInputs() {
  const source = readFileSync("components/augnes-cockpit.tsx", "utf8");
  const start = source.indexOf("function SidecarEtHintPanel");
  const end = source.indexOf("function MetaWmHintPanel");
  assert(start >= 0 && end > start, "Sidecar e_t Cockpit panel should exist");
  const sidecarPanelSource = source.slice(start, end);
  const normalized = sidecarPanelSource.replace(/\s+/g, " ");

  assert(
    !sidecarPanelSource.includes("<button"),
    "Sidecar e_t Cockpit panel must not introduce action buttons",
  );
  for (const disallowedControl of [
    "Approve",
    "Publish",
    "Retry",
    "Commit",
    "Reject",
    "Proof",
    "Evidence",
    "Work",
    "Mailbox",
    "Publication",
  ]) {
    assert(
      !sidecarPanelSource.includes(`>${disallowedControl}<`),
      `Sidecar e_t Cockpit panel must not add ${disallowedControl} controls`,
    );
  }
  for (const requiredBoundaryCopy of [
    "not a Cockpit action input",
    "not source of truth",
    "not authority",
    "does not run a Sidecar loop",
    "commit z_t",
    "create QP output",
  ]) {
    assert(
      normalized.includes(requiredBoundaryCopy),
      `Sidecar e_t Cockpit copy should include: ${requiredBoundaryCopy}`,
    );
  }
}

function assertRuntimeSnapshotWiring() {
  const source = readFileSync("lib/perspective/snapshot.ts", "utf8");
  assert(
    !source.includes("buildSidecarEtOfflineFixtureCandidate"),
    "PerspectiveSnapshot must not import or call the fixture-only helper",
  );
  assert(
    !source.includes("sidecar_e_t.offline_fixture_candidate"),
    "PerspectiveSnapshot must not include fixture-only candidate output",
  );
  assert(
    /function buildSidecarEtPlaceholder\(\)/.test(source) ||
      source.includes("sidecar_e_t.placeholder.v0.1"),
    "PerspectiveSnapshot should keep placeholder construction for sidecar_e_t",
  );

  const placeholderStart = source.indexOf("function buildSidecarEtPlaceholder");
  const placeholderEnd = source.indexOf("function buildCompIndexHintPlaceholder");
  assert(
    placeholderStart >= 0 && placeholderEnd > placeholderStart,
    "Sidecar e_t placeholder construction should be locally inspectable",
  );
  const placeholderSource = source.slice(placeholderStart, placeholderEnd);
  assert(
    placeholderSource.includes("source_refs: []"),
    "runtime sidecar_e_t placeholder must not emit source refs",
  );
  assert(
    placeholderSource.includes("computed: false"),
    "runtime sidecar_e_t placeholder must keep computed=false",
  );
  assert(
    !placeholderSource.includes("computed: true"),
    "runtime sidecar_e_t placeholder must not set computed=true",
  );
}

function assertNoExtraRuntimeSidecarRoute() {
  const routeFiles = walkFiles("app/api").filter((file) =>
    file.endsWith("route.ts"),
  );
  const sidecarRoutes = routeFiles.filter((file) =>
    file.toLowerCase().includes("sidecar"),
  );
  assert.deepEqual(
    sidecarRoutes,
    [],
    "Sidecar e_t runtime smoke must not add a dedicated runtime route",
  );
}

function walkFiles(root) {
  const files = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function assertAuthorityUnchanged({ openDatabase, before, label }) {
  const after = readAuthoritySnapshot(openDatabase);
  assert.deepEqual(
    after.counts,
    before.counts,
    `${label} must not write authority table rows`,
  );
  assert.deepEqual(
    after.table_hashes,
    before.table_hashes,
    `${label} must not mutate authority table contents`,
  );
  assert.equal(
    after.counts.state_transitions,
    before.counts.state_transitions,
    `${label} must not invoke state transition writes`,
  );
  assert.equal(
    after.table_hashes.state_delta_proposals,
    before.table_hashes.state_delta_proposals,
    `${label} must not change proposal status or proposal content`,
  );
  assert.equal(
    after.counts.verification_evidence_records,
    before.counts.verification_evidence_records,
    `${label} must not create evidence/proof records`,
  );
  for (const table of [
    "work_items",
    "work_events",
    "action_records",
    "mailbox_messages",
    "publication_drafts",
    "publication_approval_requests",
    "publication_approval_decisions",
    "publication_readiness_checks",
    "delivery_ledger",
    "temporal_preview_review_artifacts",
    "temporal_preview_review_artifact_idempotency",
  ]) {
    assert.equal(
      after.table_hashes[table],
      before.table_hashes[table],
      `${label} must not mutate ${table}`,
    );
  }
}

function seedRuntimeBoundaryScopes(db) {
  const now = "2026-05-21T00:00:00.000Z";

  db.prepare(
    `
      INSERT INTO agents (id, name, kind)
      VALUES ('codex-sidecar-et-runtime-smoke', 'Codex Sidecar e_t runtime smoke', 'external')
    `,
  ).run();

  seedStateEntry({
    db,
    id: "state:sidecar-et-runtime:clean",
    scope: CLEAN_SCOPE,
    stateKey: "sidecar.runtime.clean",
    value: '"clean runtime fixture"',
    now,
  });

  seedStateEntry({
    db,
    id: "state:sidecar-et-runtime:repeated",
    scope: REPEATED_SCOPE,
    stateKey: "sidecar.runtime.repeated",
    value: '"repeated runtime fixture"',
    now,
  });
  seedActionRecord({
    db,
    id: "action:sidecar-et-runtime:repeat-a",
    scope: REPEATED_SCOPE,
    stateKey: "sidecar.runtime.loop",
    title: "Repeated runtime Sidecar e_t action A",
    now,
  });
  seedActionRecord({
    db,
    id: "action:sidecar-et-runtime:repeat-b",
    scope: REPEATED_SCOPE,
    stateKey: "sidecar.runtime.loop",
    title: "Repeated runtime Sidecar e_t action B",
    now,
  });
  seedWorkItem({
    db,
    workId: REPEATED_WORK_ID,
    scope: REPEATED_SCOPE,
    title: "Sidecar e_t runtime repeated fixture",
    now,
  });
  seedWorkEvent({
    db,
    id: "work-event:sidecar-et-runtime:repeat-a",
    workId: REPEATED_WORK_ID,
    scope: REPEATED_SCOPE,
    relatedActionId: "action:sidecar-et-runtime:repeat-a",
    now,
  });
  seedWorkEvent({
    db,
    id: "work-event:sidecar-et-runtime:repeat-b",
    workId: REPEATED_WORK_ID,
    scope: REPEATED_SCOPE,
    relatedActionId: "action:sidecar-et-runtime:repeat-b",
    now,
  });
  seedPendingProposal({
    db,
    id: "proposal:sidecar-et-runtime:pending",
    scope: REPEATED_SCOPE,
    stateKey: "sidecar.runtime.loop",
    reason: "Pending runtime proposal pressure must affect only loopness.",
    now,
  });
  seedOpenTension({
    db,
    id: "tension:sidecar-et-runtime:open",
    scope: REPEATED_SCOPE,
    stateKey: "sidecar.runtime.loop",
    title: "Sidecar e_t runtime repeated fixture tension",
    now,
  });

  seedStateEntry({
    db,
    id: "state:sidecar-et-runtime:ambiguous-a",
    scope: AMBIGUOUS_SCOPE,
    stateKey: "sidecar.runtime.ambiguous",
    value: '"ambiguous runtime fixture A"',
    now,
  });
  seedStateEntry({
    db,
    id: "state:sidecar-et-runtime:ambiguous-b",
    scope: AMBIGUOUS_SCOPE,
    stateKey: "sidecar.runtime.ambiguous.alternate",
    value: '"ambiguous runtime fixture B"',
    now,
  });
  seedPendingProposal({
    db,
    id: "proposal:sidecar-et-runtime:ambiguous",
    scope: AMBIGUOUS_SCOPE,
    stateKey: "sidecar.runtime.ambiguous",
    reason: "Ambiguous runtime context must fall back to placeholder.",
    now,
  });
  seedOpenTension({
    db,
    id: "tension:sidecar-et-runtime:ambiguous",
    scope: AMBIGUOUS_SCOPE,
    stateKey: "sidecar.runtime.ambiguous",
    title: "Sidecar e_t runtime ambiguous fixture tension",
    now,
  });

  seedStateEntry({
    db,
    id: "state:sidecar-et-runtime:source-ref-boundary",
    scope: SOURCE_REF_BOUNDARY_SCOPE,
    stateKey: "sidecar.runtime.source_ref_boundary",
    value: '"source ref boundary runtime fixture"',
    now,
  });
  seedStateEntry({
    db,
    id: "state:sidecar-et-runtime:outside-scope",
    scope: OUTSIDE_SOURCE_REF_SCOPE,
    stateKey: "sidecar.runtime.outside_scope",
    value: '"outside scope ref that must not be read for runtime sidecar_e_t"',
    now,
  });
}

function seedStateEntry({ db, id, scope, stateKey, value, now }) {
  db.prepare(
    `
      INSERT INTO state_entries (
        id,
        scope,
        state_key,
        value,
        temporal_scope,
        valid_from,
        valid_until,
        stability,
        change_type,
        source_agent_id,
        source_session_id,
        source_transition_id,
        created_at,
        updated_at
      )
      VALUES (
        @id,
        @scope,
        @state_key,
        @value,
        'current_project',
        NULL,
        NULL,
        'active',
        'new_state',
        NULL,
        NULL,
        NULL,
        @now,
        @now
      )
    `,
  ).run({ id, scope, state_key: stateKey, value, now });
}

function seedActionRecord({ db, id, scope, stateKey, title, now }) {
  db.prepare(
    `
      INSERT INTO action_records (
        id,
        scope,
        state_key,
        title,
        description,
        status,
        source_agent_id,
        source_session_id,
        created_at,
        completed_at
      )
      VALUES (
        @id,
        @scope,
        @state_key,
        @title,
        'Deterministic repeated action fixture for Sidecar e_t runtime boundary smoke.',
        'completed',
        'codex-sidecar-et-runtime-smoke',
        NULL,
        @now,
        @now
      )
    `,
  ).run({ id, scope, state_key: stateKey, title, now });
}

function seedWorkItem({ db, workId, scope, title, now }) {
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
        'in_progress',
        'now',
        'Deterministic fixture for Sidecar e_t runtime placeholder boundary smoke.',
        'Keep runtime Sidecar e_t placeholder-only and non-authoritative.',
        0,
        '["sidecar.runtime.loop"]',
        '{}',
        @now,
        @now
      )
    `,
  ).run({ work_id: workId, scope, title, now });
}

function seedWorkEvent({ db, id, workId, scope, relatedActionId, now }) {
  db.prepare(
    `
      INSERT INTO work_events (
        id,
        work_id,
        scope,
        actor,
        event_type,
        summary,
        result_status,
        result_kind,
        related_action_id,
        related_pr,
        related_state_keys,
        created_at
      )
      VALUES (
        @id,
        @work_id,
        @scope,
        'codex',
        'verification',
        'Deterministic repeated actor fixture for bounded runtime loopness only.',
        'completed',
        'verification',
        @related_action_id,
        NULL,
        '["sidecar.runtime.loop"]',
        @now
      )
    `,
  ).run({
    id,
    work_id: workId,
    scope,
    related_action_id: relatedActionId,
    now,
  });
}

function seedPendingProposal({ db, id, scope, stateKey, reason, now }) {
  db.prepare(
    `
      INSERT INTO state_delta_proposals (
        id,
        scope,
        state_key,
        before_value,
        after_value,
        operation,
        temporal_scope,
        valid_from,
        valid_until,
        stability,
        change_type,
        source_agent_id,
        source_session_id,
        reason,
        status,
        proposed_at,
        prediction_error_score,
        salience_score,
        evidence_score,
        conflict_score,
        self_impact_score,
        consolidation_status,
        reinforcement_count,
        expires_at,
        last_evaluated_at,
        scoring_version,
        scoring_reason,
        score_breakdown
      )
      VALUES (
        @id,
        @scope,
        @state_key,
        NULL,
        '"sidecar runtime proposal"',
        'set',
        'current_project',
        NULL,
        NULL,
        'tentative',
        'new_state',
        NULL,
        NULL,
        @reason,
        'pending',
        @now,
        0.1,
        0.2,
        0.3,
        0.4,
        0.5,
        'candidate',
        0,
        NULL,
        @now,
        'v0.2-rule-001',
        'Seed scoring for Sidecar e_t runtime boundary smoke.',
        '{}'
      )
    `,
  ).run({ id, scope, state_key: stateKey, reason, now });
}

function seedOpenTension({ db, id, scope, stateKey, title, now }) {
  db.prepare(
    `
      INSERT INTO state_tensions (
        id,
        scope,
        state_key,
        title,
        description,
        status,
        severity,
        source_agent_id,
        source_session_id,
        created_at,
        resolved_at
      )
      VALUES (
        @id,
        @scope,
        @state_key,
        @title,
        'Open tension should remain trace pressure only.',
        'open',
        'high',
        NULL,
        NULL,
        @now,
        NULL
      )
    `,
  ).run({ id, scope, state_key: stateKey, title, now });
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

    return {
      counts: Object.fromEntries(
        AUTHORITY_TABLES.map((table) => [table, tableRows[table].length]),
      ),
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
