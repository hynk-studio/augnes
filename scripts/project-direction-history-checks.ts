import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { createProjectDirectionHandler } from "../app/api/vnext/operator/project-direction/route";
import { createAgentProjectDirectionHandler } from "../app/api/vnext/agent/project-direction/route";
import { getOrCreateDefaultWorkspaceIdentityV01, getOrCreateCanonicalProjectForLocalRootV01, normalizeLocalProjectRootRefV01 } from "../lib/vnext/persistence/project-identity-registry";
import { readActiveProjectSelectionV01, selectActiveProjectV01 } from "../lib/vnext/persistence/project-lifecycle-registry";
import { issueVNextLocalOperatorBootstrapV01, consumeVNextLocalOperatorBootstrapV01, readVNextLocalOperatorCredentialFromRequestV01, VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01 } from "../lib/vnext/runtime/local-operator-session";
import { defineInitialProjectWorkV01 } from "../lib/vnext/runtime/project-work-initialization";
import { prepareDirectionAgenda } from "../lib/vnext/runtime/project-direction-preparation";
import { authenticateDirectionAgent, mutateAgentDirection, mutateHumanDirection } from "../lib/vnext/runtime/project-direction";
import { appendDirectionRecord, directionCurrent, effectiveDirection, grantAvailable, readProjectDirection, validateProjectDirectionHistory, type DirectionScope } from "../lib/vnext/persistence/project-direction-store";
import { validateRecoveryCanonicalDatabaseV01 } from "./recovery-canonical-record-validator";
import { canonicalizeProtocolValueV01 as canonical, createProtocolSha256V01 as hash } from "../lib/vnext/protocol-primitives";
import type { DirectionDecision, DirectionEntry } from "../lib/vnext/project-direction";

const content = { purpose: "Inspect the retained evidence for this bounded question", criteria: ["Preserve attributed findings"], constraints: ["No execution authority"] };
const decide = (expected_ref: string | null) => ({ action: "decide", expected_ref, content, reason: "Reconsider the bounded direction", status: "active", proposal_ref: null });

/** Preparation is excluded from measurement. Ordinary authenticated writers own
 * grants, attribution, sequences and packets; the existing immutable append
 * builder supplies only the issuer's repeated historical human decisions. */
export function createDirectionHistoryFixture(root: string, size: "small" | "larger") {
  const databasePath = path.join(root, "direction-history.db");
  const db = new Database(databasePath);
  try {
    db.pragma("foreign_keys=ON"); applyCanonicalDatabaseMigrations(db);
    const workspace = getOrCreateDefaultWorkspaceIdentityV01(db);
    const projectRoot = path.join(root, "issuer"); mkdirSync(projectRoot);
    writeFileSync(path.join(projectRoot, "evidence.txt"), "ready\n");
    const project = getOrCreateCanonicalProjectForLocalRootV01(db, { workspace_id: workspace.workspace_id,
      local_root: normalizeLocalProjectRootRefV01(projectRoot, { base_path: root }), display_name: "History issuer" }).project;
    const scope = { workspace_id: workspace.workspace_id, project_id: project.project_id };
    const config = { ...scope, enabled: true as const, operator_id: "operator:local-review", database_path: databasePath };
    let instant = Date.now() + 5;
    const clock = { now: () => new Date(instant).toISOString() };
    const tick = () => { instant += 100; return clock.now(); };
    selectActiveProjectV01(db, { ...scope, expected_project_id: null, expected_revision: null, now: clock.now() });
    const bootstrap = issueVNextLocalOperatorBootstrapV01(db, { config, clock });
    const session = consumeVNextLocalOperatorBootstrapV01(db, { config, clock, bootstrap_token: bootstrap.bootstrap_token });
    let cookie = `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${session.cookie_value}`;
    const credential = () => readVNextLocalOperatorCredentialFromRequestV01(new Request("http://127.0.0.1", { headers: { cookie } }));
    const remember = <T extends { session_admission: { cookie_value: string } }>(result: T) => { cookie = `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${result.session_admission.cookie_value}`; return result; };
    const human = (request: unknown) => { tick(); return remember(mutateHumanDirection(db, { config, credential: credential(), clock, request })); };
    tick();
    remember(defineInitialProjectWorkV01(db, { config, credential: credential(), clock, request: { action: "define_initial_project_work", ...scope,
      expected_active_project_id: scope.project_id, expected_active_selection_revision: readActiveProjectSelectionV01(db, scope.workspace_id)!.selection_revision,
      expected_initialization_state: "not_defined", goal: "Inspect retained direction evidence", success_criteria: ["Retain original source attribution"], non_goals: ["No execution"] } }));
    let last = human(decide(null)).record as DirectionEntry<DirectionDecision>;
    const earlyAt = clock.now();
    const historicalDecisions = size === "small" ? 3 : 128;
    db.transaction(() => {
      for (let revision = 2; revision <= historicalDecisions; revision++) last = appendDirectionRecord(db, { ...last.value, previous: last.ref, revision, at: tick() });
    })();
    tick();
    remember(prepareDirectionAgenda(db, { config, credential: credential(), clock, request: { action: "prepare_inspection", expected_ref: last.ref,
      files: [{ path: "evidence.txt", contains: "ready" }] } }));
    const grants: Array<{ issued: ReturnType<typeof human>; token: string; sequence: number; children: Array<{ project_id: string; genesis: ReturnType<typeof mutateAgentDirection>["record"]; current: ReturnType<typeof mutateAgentDirection>["record"] }> }> = [];
    const grantCount = size === "small" ? 1 : 4;
    for (let g = 0; g < grantCount; g++) {
      const roots = ["independent", "delegated"].map(kind => { const value = path.join(root, `${kind}-${g}`); mkdirSync(value); return value; });
      const issued = human({ action: "authorize_agent", role: `role:reader_${g}`, allowed_directions: [content], max_mutations: 20, expires_in_minutes: 60,
        creation_slots: roots.map((localRoot, index) => ({ root: localRoot, display_name: `${index ? "Delegated" : "Independent"} ${g}`,
          delegation: index ? { expected_parent_ref: last.ref, why: "Separate evidence question", contribution: "Inspect retained findings", return_question: "Which evidence matters?" } : null })) });
      const token = issued.credential!;
      let sequence = 0;
      const agent = (projectId: string | null, operation: unknown) => { tick(); const result = mutateAgentDirection(db, { token, clock,
        request: { project_id: projectId, sequence, operation } }); sequence = result.sequence; return result; };
      const children = [];
      for (let slot = 0; slot < 2; slot++) {
        let created = agent(null, { action: "create_project", slot, content, reason: "Authorized bounded evidence exploration" });
        const genesis = created.record;
        for (let r = 0; r < (size === "small" ? 1 : 5); r++) created = agent(created.project_id, decide(created.record.ref));
        children.push({ project_id: created.project_id, genesis, current: created.record });
      }
      agent(scope.project_id, { action: "propose", expected_ref: last.ref, content, reason: "Offer a bounded alternative" });
      agent(children[1]!.project_id, { action: "return_proposal", expected_ref: children[1]!.current.ref, receipt_id: null, receipt_fingerprint: null, summary: "A retained question for the issuer" });
      grants.push({ issued, token, sequence, children });
    }
    const beforeChangeAt = clock.now();
    last = human(decide(last.ref)).record as DirectionEntry<DirectionDecision>;
    validateProjectDirectionHistory(db);
    assert.equal(validateRecoveryCanonicalDatabaseV01(db).status, "valid");
    assert.equal(readProjectDirection(db, scope, clock.now()).pending_work[0]!.needs_reconsideration, true);
    return { db, scope, config, clock, tick, human, grants, last, earlyAt, beforeChangeAt, databasePath, size, cookie: () => cookie,
      metadata: () => ({ scope, at: clock.now(), earlyAt, beforeChangeAt, size,
        children: grants.flatMap(g => g.children.map(c => ({ workspace_id: scope.workspace_id, project_id: c.project_id }))),
        rows: (db.prepare("SELECT project_id,kind,count(*) AS count FROM vnext_project_direction_records GROUP BY project_id,kind ORDER BY project_id,kind").all()) }) };
  } catch (error) { db.close(); throw error; }
}

export type DirectionHistoryMetadata = ReturnType<ReturnType<typeof createDirectionHistoryFixture>["metadata"]>;

/** Counts only the operation, never fixture construction. Each returned history
 * row runs through decode and row/envelope validation on the original reader. */
export function observeDirectionHistoryReads<T>(db: Database.Database, action: () => T) {
  const counts = { full_history_reads: 0, full_history_rows: 0, point_record_reads: 0, point_record_rows: 0, workspace_enumerations: 0 };
  const prepare = db.prepare.bind(db);
  db.prepare = ((sql: string) => {
    const statement = prepare(sql);
    if (sql.includes("WITH direction_history AS MATERIALIZED")) {
      const all = statement.all.bind(statement);
      statement.all = ((...args: unknown[]) => { const rows = all(...args) as Array<{ summary: number }>; counts.full_history_reads++; counts.full_history_rows += rows.filter(r => r.summary === 0).length; return rows; }) as typeof statement.all;
    } else if (sql.startsWith("SELECT * FROM vnext_project_direction_records WHERE")) {
      const get = statement.get.bind(statement);
      statement.get = ((...args: unknown[]) => { const row = get(...args); counts.point_record_reads++; if (row) counts.point_record_rows++; return row; }) as typeof statement.get;
    } else if (sql.startsWith("SELECT DISTINCT project_id FROM vnext_project_direction_records")) counts.workspace_enumerations++;
    return statement;
  }) as typeof db.prepare;
  try { return { counts, result: action() }; } finally { db.prepare = prepare; }
}

const outcome = (action: () => unknown) => { try { return { value: action() }; } catch (error) { return { error: error instanceof Error ? error.message : String(error) }; } };
function replaceDecision(db: Database.Database, ref: string, change: (value: DirectionDecision) => void) {
  const row = db.prepare("SELECT body_json FROM vnext_project_direction_records WHERE ref=?").get(ref) as { body_json: string };
  const value = JSON.parse(row.body_json) as DirectionDecision; change(value);
  db.exec("DROP TRIGGER IF EXISTS trg_vnext_project_direction_update");
  db.prepare("UPDATE vnext_project_direction_records SET body_json=?,ref=? WHERE ref=?").run(canonical(value), hash(canonical(value)), ref);
}

/** Shared differential controls use byte-identical copies and real production
 * projections/recovery. Deliberate corruption is confined to these copies. */
export function directionHistoryParityObservations(bytes: Buffer, metadata: DirectionHistoryMetadata) {
  const results: Record<string, unknown> = {};
  for (const name of ["valid", "future_chain", "foreign_tail", "malformed_tail", "missing_tail"] as const) {
    const db = new Database(bytes);
    try {
      const last = effectiveDirection(db, metadata.scope, metadata.at)!;
      if (name === "future_chain") replaceDecision(db, last.ref, value => { value.previous = `sha256:${"a".repeat(64)}`; });
      if (name === "foreign_tail") replaceDecision(db, last.ref, value => { value.workspace_id = "workspace:foreign"; });
      if (name === "malformed_tail") { db.exec("DROP TRIGGER trg_vnext_project_direction_update"); db.prepare("UPDATE vnext_project_direction_records SET body_json='{}' WHERE ref=?").run(last.ref); }
      const completePrepare = db.prepare.bind(db);
      if (name === "missing_tail") db.prepare = ((sql: string) => { const statement = completePrepare(sql);
        if (sql.includes("WITH direction_history AS MATERIALIZED")) { const all = statement.all.bind(statement); statement.all = ((...args: unknown[]) => all(...args).slice(0, -1)) as typeof statement.all; }
        return statement; }) as typeof db.prepare;
      results[name] = { early: outcome(() => readProjectDirection(db, metadata.scope, metadata.earlyAt)),
        current: outcome(() => readProjectDirection(db, metadata.scope, metadata.at)),
        recovery: validateRecoveryCanonicalDatabaseV01(db) };
    } finally { db.close(); }
  }
  return results;
}

export async function testDirectionHistoryReuse() {
  const root = realpathSync(mkdtempSync(path.join(tmpdir(), "augnes-direction-history-")));
  let f: ReturnType<typeof createDirectionHistoryFixture> | undefined;
  try {
    f = createDirectionHistoryFixture(root, "small");
    const { db, scope, clock, grants } = f;
    const metadata = f.metadata(), bytes = db.serialize();
    const observations = directionHistoryParityObservations(bytes, metadata) as Record<string, { early: { error?: string }; current: { error?: string }; recovery: { status: string } }>;
    assert.equal(observations.valid!.recovery.status, "valid");
    assert.equal(observations.future_chain!.early.error, undefined, "Full rows are validated before cutoff, but future decision-chain checks remain cutoff-specific");
    assert.equal(observations.future_chain!.current.error, "project_direction_history_invalid");
    for (const kind of ["foreign_tail", "malformed_tail", "missing_tail"]) { assert(observations[kind]!.early.error); assert.notEqual(observations[kind]!.recovery.status, "valid"); }
    const reference = readProjectDirection(db, scope, clock.now());
    const measured = observeDirectionHistoryReads(db, () => readProjectDirection(db, scope, clock.now()));
    assert.deepEqual(measured.result, reference);
    assert.equal(measured.counts.full_history_reads, 3, "Issuer and two required child histories each decode once per projection");
    assert.equal(measured.counts.workspace_enumerations, 1);
    measured.result.history[measured.result.history.length - 1]!.value.content.purpose = "Caller mutation";
    assert.deepEqual(measured.result.effective, reference.effective, "Effective output stays independent of mutable returned history");
    measured.result.grants[0]!.record.value.allowed_directions[0]!.purpose = "Caller mutation";
    assert.deepEqual(readProjectDirection(db, scope, clock.now()), reference, "Returned mutable material cannot poison the next invocation");
    const environment = { NODE_ENV: "test" as const, AUGNES_DB_PATH: f.databasePath, AUGNES_LOCAL_REVIEW_PROFILE: "companion_first_work_v1",
      AUGNES_RUNTIME_CONTRACT: "augnes-local-runtime-supervisor-v1", AUGNES_RUNTIME_CHILD_ROLE: "ui", AUGNES_DISTRIBUTION_MODE: "source" };
    const originalPrepare = Database.prototype.prepare;
    let authenticatedReads = 0, routeHistories = 0;
    const boundaryObservations: Array<{ kind: string; transaction: boolean }> = [];
    Database.prototype.prepare = function(this: Database.Database, sql: string) {
      if (sql === "SELECT * FROM vnext_local_operator_sessions WHERE session_id = ?" || sql.includes("SELECT c.grant_ref,c.token_hash,c.sequence,r.workspace_id")) {
        boundaryObservations.push({ kind: "authentication", transaction: this.inTransaction }); authenticatedReads++;
      }
      if (authenticatedReads > 0 && sql.includes("WITH direction_history AS MATERIALIZED")) { boundaryObservations.push({ kind: "history", transaction: this.inTransaction }); routeHistories++; }
      return originalPrepare.call(this, sql);
    } as typeof originalPrepare;
    try {
      const human = createProjectDirectionHandler({ environment, clock });
      const response = await human(new Request(`http://127.0.0.1/api/vnext/operator/project-direction?project_id=${scope.project_id}`, { headers: { host: "127.0.0.1", cookie: f.cookie() } }));
      const body = await response.json(); assert.equal(response.status, 200, body.error); assert.deepEqual(body.state, reference);
      const agent = createAgentProjectDirectionHandler({ environment, clock });
      const responseAgent = await agent(new Request(`http://127.0.0.1/api/vnext/agent/project-direction?project_id=${scope.project_id}`, { headers: { host: "127.0.0.1", authorization: `Bearer ${grants[0]!.token}` } }));
      const agentBody = await responseAgent.json(); assert.equal(responseAgent.status, 200, agentBody.error); assert.deepEqual(agentBody.state, reference);
    } finally { Database.prototype.prepare = originalPrepare; }
    assert.equal(authenticatedReads, 3); assert(routeHistories >= 2);
    // The existing Companion profile first resolves credential scope on a separate
    // connection. The route must authenticate again inside its read transaction.
    assert.deepEqual(boundaryObservations.filter(o => o.kind === "authentication").map(o => o.transaction), [false, true, true]);
    assert(boundaryObservations.filter(o => o.kind === "history").every(o => o.transaction));
    const grant = grants[0]!;
    const childScope = { ...scope, project_id: grant.children[0]!.project_id };
    db.exec("BEGIN");
    try {
      assert.equal(readProjectDirection(db, childScope, clock.now()).authority_current, true);
      db.prepare("UPDATE vnext_project_direction_credentials SET suspended=1,token_hash=NULL WHERE grant_ref=?").run(grant.issued.record.ref);
      assert.equal(readProjectDirection(db, childScope, clock.now()).authority_current, false, "Two reads within one caller transaction still see intervening writes");
      assert.throws(() => authenticateDirectionAgent(db, grant.token, clock.now()), /agent_credential_invalid/);
      assert.equal(db.inTransaction, true, "Reader does not settle a caller-owned transaction");
    } finally { db.exec("ROLLBACK"); }
    assert.equal(readProjectDirection(db, childScope, clock.now()).authority_current, true);
    await Promise.resolve();
    assert.deepEqual(readProjectDirection(db, scope, clock.now()), reference, "No material survives an async boundary");
    const reopened = new Database(f.databasePath);
    try { assert.deepEqual(readProjectDirection(reopened, scope, clock.now()), reference); } finally { reopened.close(); }
    db.pragma("journal_mode=WAL");
    const other = new Database(f.databasePath);
    const prepare = db.prepare.bind(db);
    let changed = false;
    db.prepare = ((sql: string) => {
      const statement = prepare(sql);
      if (sql.includes("WITH direction_history AS MATERIALIZED")) {
        const all = statement.all.bind(statement);
        statement.all = ((...args: unknown[]) => { const rows = all(...args); if (!changed) { changed = true;
          assert.equal(db.inTransaction, true, "The projection owns a stable SQLite snapshot");
          other.prepare("UPDATE vnext_project_identities SET display_name=? WHERE workspace_id=? AND project_id=?").run("Changed concurrently", scope.workspace_id, childScope.project_id);
          other.prepare("UPDATE vnext_project_direction_credentials SET suspended=1,token_hash=NULL WHERE grant_ref=?").run(grant.issued.record.ref);
        } return rows; }) as typeof statement.all;
      }
      return statement;
    }) as typeof db.prepare;
    try { assert.deepEqual(readProjectDirection(db, scope, clock.now()), reference, "A second connection's committed change cannot split a projection snapshot"); }
    finally { db.prepare = prepare; other.close(); }
    assert(changed);
    const fresh = readProjectDirection(db, scope, clock.now());
    assert.equal(fresh.grants[0]!.available, false);
    assert.equal(fresh.grants[0]!.projects.find(p => p.project_id === childScope.project_id)!.display_name, "Changed concurrently");
    assert.equal(grantAvailable(db, scope, grant.issued.record.ref, clock.now()), false);
    assert.equal(validateRecoveryCanonicalDatabaseV01(db).status, "valid", "Recovery preserves suspended credential accounting");
    // Traversal context belongs to each walk even when its histories are reused.
    const current = effectiveDirection(db, childScope, clock.now())!;
    assert.throws(() => directionCurrent(db, current, clock.now(), new Set([current.value.project_id])), /parent_cycle/);
    assert.throws(() => directionCurrent(db, current, clock.now(), new Set(Array.from({ length: 8 }, (_, i) => `visited:${i}`))), /parent_cycle/);
    // No grant on this leaf requires workspace-wide history enumeration.
    const unrelated = new Database(bytes);
    try {
      const issuer = effectiveDirection(unrelated, scope, clock.now())!;
      replaceDecision(unrelated, issuer.ref, value => { value.previous = `sha256:${"b".repeat(64)}`; });
      const independent = observeDirectionHistoryReads(unrelated, () => readProjectDirection(unrelated, childScope, clock.now()));
      assert.equal(independent.result.authority_current, true, "An independent child validates grant rows without eagerly validating the issuer's unrelated current chain");
      assert.equal(independent.counts.full_history_reads, 2); assert.equal(independent.counts.workspace_enumerations, 0);
      // A no-direction foreign scope must not load that unrelated malformed chain.
      const emptyScope: DirectionScope = { workspace_id: scope.workspace_id, project_id: "project:unrelated-empty" };
      const empty = observeDirectionHistoryReads(unrelated, () => readProjectDirection(unrelated, emptyScope, clock.now()));
      assert.equal(empty.result.effective, null); assert.equal(empty.counts.full_history_reads, 1); assert.equal(empty.counts.workspace_enumerations, 0);
    } finally { unrelated.close(); }
    console.log(JSON.stringify({ project_direction_history_reuse: "pass", complete_tail_and_cutoff: "preserved", snapshot_and_fresh_state: "pass", projection_counts: measured.counts, model_calls: 0 }));
  } finally { f?.db.close(); rmSync(root, { recursive: true, force: true }); }
}
