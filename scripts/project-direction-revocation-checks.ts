import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, realpathSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { createProjectDirectionHandler } from "../app/api/vnext/operator/project-direction/route";
import { createAgentProjectDirectionHandler } from "../app/api/vnext/agent/project-direction/route";
import { getOrCreateDefaultWorkspaceIdentityV01, getOrCreateCanonicalProjectForLocalRootV01, normalizeLocalProjectRootRefV01 } from "../lib/vnext/persistence/project-identity-registry";
import { issueVNextLocalOperatorBootstrapV01, consumeVNextLocalOperatorBootstrapV01, readVNextLocalOperatorCredentialFromRequestV01, VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01, type VNextLocalOperatorPilotConfigV01 } from "../lib/vnext/runtime/local-operator-session";
import { appendDirectionRecord, readDirectionRecords, readProjectDirection, grantAvailable, revokeDirectionGrant, validateProjectDirectionHistory } from "../lib/vnext/persistence/project-direction-store";
import { authenticateDirectionAgent, mutateAgentDirection, mutateHumanDirection } from "../lib/vnext/runtime/project-direction";
import { canonicalizeProtocolValueV01 as canonical, createProtocolSha256V01 as hash } from "../lib/vnext/protocol-primitives";
import { createRecoveryBackup } from "./recovery-backup.mjs";
import { inspectRecoveryDatabaseFile, prepareRuntimeDatabase, restoreRuntimeDatabase } from "./runtime-database-bootstrap.mjs";
import { validateRecoveryCanonicalDatabaseV01 } from "./recovery-canonical-record-validator";
import { runCanonicalChild, canonicalChildAcceptanceFailure } from "./canonical-child-runner.mjs";
import { insertAutonomyRunLedgerRecord, hasUnsettledAutonomyRunLedgerRecords } from "../lib/autonomy/runner-ledger";
import { buildDefaultRunnerAuthorityBoundary, buildDefaultRunnerBudgetSnapshot, buildDefaultRunnerSourceRefs } from "../lib/autonomy/runner-state";
import type { DirectionDecision, DirectionEntry } from "../lib/vnext/project-direction";

const agentUrl = "http://127.0.0.1/api/vnext/agent/project-direction";
const headers = { host: "127.0.0.1", origin: "http://127.0.0.1", "content-type": "application/json" };
const content = { purpose: "A bounded synthetic direction", criteria: [], constraints: [] };
const decide = (ref: string | null) => ({ action: "decide", expected_ref: ref, content, reason: "Synthetic ordinary direction", status: "active", proposal_ref: null });
const rows = (db: Database.Database) => db.prepare("SELECT * FROM vnext_project_direction_records ORDER BY ordinal").all();
const snapshot = (db: Database.Database) => Object.fromEntries((db.prepare("SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name").all() as Array<{ name: string }>)
  .map(({ name }) => [name, db.prepare(`SELECT * FROM "${name.replaceAll('"', '""')}"`).all().map(canonical).sort()]));
const revoke = (ref: string) => ({ action: "revoke_agent", grant_ref: ref, reason: "Withdraw this grant at saturation" });
type Fixture = Awaited<ReturnType<typeof fixture>>;
function sessionCookie(db: Database.Database, config: VNextLocalOperatorPilotConfigV01, clock: { now(): string }): string {
  const bootstrap = issueVNextLocalOperatorBootstrapV01(db, { config, clock });
  return `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${consumeVNextLocalOperatorBootstrapV01(db, { config, clock, bootstrap_token: bootstrap.bootstrap_token }).cookie_value}`;
}

/** Supported preparation and immutable append builders accelerate only the 509
 * historical decisions. Sessions, grants, children and the operation under test
 * use production authenticated Request/Response handlers. No SQL authority edits. */
export async function createSaturatedDirectionFixture(root: string, grantCount = 2, decisionCount = 510) {
  const databasePath = path.join(root, "direction.db");
  const db = new Database(databasePath); db.pragma("foreign_keys=ON"); applyCanonicalDatabaseMigrations(db);
  const workspace = getOrCreateDefaultWorkspaceIdentityV01(db);
  const parentRoot = path.join(root, "parent"); mkdirSync(parentRoot);
  const project = getOrCreateCanonicalProjectForLocalRootV01(db, { workspace_id: workspace.workspace_id,
    local_root: normalizeLocalProjectRootRefV01(parentRoot, { base_path: root }), display_name: "Saturated issuer" }).project;
  const scope = { workspace_id: workspace.workspace_id, project_id: project.project_id };
  const config = { ...scope, enabled: true as const, operator_id: "operator:local-review", database_path: databasePath };
  let instant = Date.now() + 5;
  const clock = { now: () => new Date(instant).toISOString() };
  const tick = () => { instant += 1; return clock.now(); };
  const environment = { NODE_ENV: "test" as const, AUGNES_DB_PATH: databasePath, AUGNES_LOCAL_REVIEW_PROFILE: "companion_first_work_v1",
    AUGNES_RUNTIME_CONTRACT: "augnes-local-runtime-supervisor-v1", AUGNES_RUNTIME_CHILD_ROLE: "ui", AUGNES_DISTRIBUTION_MODE: "source" };
  let cookie = sessionCookie(db, config, clock);
  const human = createProjectDirectionHandler({ environment, clock }), agent = createAgentProjectDirectionHandler({ environment, clock });
  const humanUrl = `http://127.0.0.1/api/vnext/operator/project-direction?project_id=${scope.project_id}`;
  async function humanCall(body?: unknown, expected = 200, usedCookie = cookie, url = humanUrl) {
    tick();
    const response = await human(new Request(url, { method: body ? "POST" : "GET", headers: { ...headers, cookie: usedCookie }, ...(body ? { body: JSON.stringify(body) } : {}) }));
    const value = await response.json(); assert.equal(response.status, expected, value.error ?? "human response");
    if (response.ok) cookie = response.headers.get("set-cookie")?.split(";")[0] ?? usedCookie;
    if (value.committed === true) assert(response.headers.has("set-cookie"), "Committed error returns the rotated credential for recovery");
    return value;
  }
  async function agentCall(token: string, body?: unknown, expected = 200) {
    tick();
    const response = await agent(new Request(agentUrl, { method: body ? "POST" : "GET", headers: { ...headers, authorization: `Bearer ${token}` }, ...(body ? { body: JSON.stringify(body) } : {}) }));
    const value = await response.json(); assert.equal(response.status, expected, value.error ?? "agent response"); return value;
  }
  let last: DirectionEntry<DirectionDecision> = (await humanCall(decide(null))).record;
  db.transaction(() => {
    for (let revision = 2; revision <= decisionCount; revision++) last = appendDirectionRecord(db, { ...last.value, previous: last.ref, revision, at: tick() });
  })();
  const grants = [];
  for (const role of ["first", "second"].slice(0, grantCount)) {
    const childRoot = path.join(root, role); mkdirSync(childRoot);
    const issued = await humanCall({ action: "authorize_agent", role: `role:${role}`, allowed_directions: [content], max_mutations: 8, expires_in_minutes: 60,
      creation_slots: [{ root: childRoot, display_name: role, delegation: { expected_parent_ref: last.ref, why: "Bounded child", contribution: "Inspect", return_question: "What changed?" } }] });
    const child = await agentCall(issued.credential, { project_id: null, sequence: 0, operation: { action: "create_project", slot: 0, content, reason: "Authorized synthetic child" } });
    grants.push({ issued, child });
  }
  validateProjectDirectionHistory(db);
  assert.equal(readDirectionRecords(db, scope, clock.now()).length, decisionCount + grantCount);
  return { db, scope, config, clock, tick, environment, human, agent, humanUrl, humanCall, agentCall, grants, last, databasePath,
    cookie: () => cookie, credential: () => readVNextLocalOperatorCredentialFromRequestV01(new Request(humanUrl, { headers: { cookie } })) };
}
const fixture = createSaturatedDirectionFixture;

async function refusalControls(f: Fixture) {
  const { db, scope, config, clock, humanCall, agentCall, grants, last } = f;
  const { issued, child } = grants[0]!;
  // All tables, including session nonce/credential sequence/identities/auxiliary
  // rows, are compared. Failed admission must leave no partial effects.
  const unchanged = async (action: () => Promise<unknown>) => { const before = snapshot(db); await action(); assert.deepEqual(snapshot(db), before); };
  await unchanged(() => humanCall(revoke(issued.record.ref), 401, ""));
  await unchanged(() => humanCall(revoke(issued.record.ref), 403, f.cookie(), `${f.humanUrl}wrong`));
  await unchanged(() => humanCall(revoke(last.ref), 403));
  await unchanged(() => humanCall(revoke(`sha256:${"a".repeat(64)}`), 403));
  await unchanged(() => humanCall(decide(null), 409));
  await unchanged(() => humanCall(decide(last.ref), 409));
  await unchanged(() => humanCall({ action: "authorize_agent", role: "role:overflow", allowed_directions: [content], max_mutations: 1, expires_in_minutes: 1, creation_slots: [] }, 409));
  await unchanged(() => humanCall({ action: "renew_agent", grant_ref: issued.record.ref, projects: [{ project_id: child.project_id, expected_ref: child.record.ref }], expires_in_minutes: 60, max_mutations: 8 }, 409));
  const otherConfig = { ...config, operator_id: "operator:other" };
  const otherCookie = sessionCookie(db, otherConfig, clock);
  const otherCredential = readVNextLocalOperatorCredentialFromRequestV01(new Request(f.humanUrl, { headers: { cookie: otherCookie } }));
  const before = snapshot(db);
  assert.throws(() => mutateHumanDirection(db, { config: otherConfig, credential: otherCredential, clock, request: revoke(issued.record.ref) }), /grant_scope_conflict/);
  assert.throws(() => mutateHumanDirection(db, { config: { ...config, workspace_id: "workspace:foreign" }, credential: f.credential(), clock, request: revoke(issued.record.ref) }), /scope_mismatch|session_invalid/);
  assert.deepEqual(snapshot(db), before);
  await unchanged(() => agentCall(issued.credential, { project_id: child.project_id, sequence: 0, operation: decide(child.record.ref) }, 409));
  await unchanged(() => agentCall(issued.credential, { project_id: child.project_id, sequence: 1, operation: decide(null) }, 409));
  await unchanged(() => agentCall(issued.credential, { project_id: scope.project_id, sequence: 1, operation: decide(last.ref) }, 403));
  await unchanged(() => agentCall(grants[1]!.issued.credential, { project_id: child.project_id, sequence: 1, operation: decide(child.record.ref) }, 403));
  await unchanged(() => agentCall(issued.credential, { project_id: child.project_id, sequence: 1, operation: { ...decide(child.record.ref), content: { ...content, purpose: "Outside policy" } } }, 403));
  assert.throws(() => mutateAgentDirection(db, { token: issued.credential, request: {}, clock: { now: () => issued.record.value.expires_at } }), /agent_grant_unavailable/);
  assert.deepEqual(snapshot(db), before);

  for (const failure of ["write", "precommit", "incomplete", "malformed"]) {
    const prepare = Database.prototype.prepare, exec = Database.prototype.exec;
    let injected = false;
    Database.prototype.prepare = function(this: Database.Database, sql: string) {
      const statement: Database.Statement = prepare.call(this, sql);
      if (sql.startsWith("INSERT INTO vnext_project_direction_records") && failure === "write") {
        statement.run = (() => { injected = true; throw new Error("injected_revocation_write"); }) as typeof statement.run;
      }
      if (sql.includes("WITH direction_history AS MATERIALIZED") && ["incomplete", "malformed"].includes(failure)) {
        const all = statement.all.bind(statement);
        statement.all = ((...args: unknown[]) => { injected = true; const values = all(...args) as Array<{ body_json: string }>;
          if (failure === "incomplete") values.pop(); else values[values.length - 1]!.body_json = "{}"; return values; }) as typeof statement.all;
      }
      return statement;
    } as typeof prepare;
    Database.prototype.exec = function(this: Database.Database, sql: string) {
      if (failure === "precommit" && sql === "COMMIT") {
        assert.equal((prepare.call(this, "SELECT count(*) AS n FROM vnext_project_direction_records WHERE project_id=?").get(scope.project_id) as { n: number }).n, 513);
        injected = true; throw new Error("injected_before_commit");
      }
      return exec.call(this, sql);
    };
    let result;
    try { result = await humanCall(revoke(issued.record.ref), 409); }
    finally { Database.prototype.prepare = prepare; Database.prototype.exec = exec; }
    assert(injected); assert.equal(result.ok, false); assert.deepEqual(snapshot(db), before);
  }
}

async function freshReadback(f: Fixture, expectedRevocations: number) {
  const expected = { at: f.clock.now(), scope: f.scope, humanUrl: f.humanUrl, expectedRevocations, rows: hash(canonical(rows(f.db))) };
  const child = await runCanonicalChild({ resourceOwner: undefined, suite: "direction-revocation", label: "fresh process complete revocation observation", command: process.execPath,
    args: ["--import", "tsx", "scripts/project-direction-revocation-checks.ts", "--readback"], cwd: process.cwd(), timeoutMs: 15000,
    env: { ...process.env, ...f.environment, AUGNES_TEST_DIRECTION_EXPECTED: JSON.stringify(expected), AUGNES_TEST_DIRECTION_CREDENTIAL: f.grants[0]!.issued.credential,
      AUGNES_TEST_DIRECTION_COOKIE: f.cookie() } });
  assert.equal(canonicalChildAcceptanceFailure(child, { suite: "direction-revocation", timeoutMs: 15000, requireNaturalExit: true }), null);
}

async function backup(f: Fixture, root: string, label: string) {
  const backupDirectory = path.join(root, label);
  const result = await createRecoveryBackup({ databasePath: f.databasePath, backupDirectory,
    applicationScopeFingerprint: hash(process.cwd()).slice(7), sourceApplication: { application_version: null, build_identity: null,
      package_contract: null, package_contract_version: null, runtime_contract: null, runtime_schema_version: null },
    reason: "manual_recovery", inspectDatabase: inspectRecoveryDatabaseFile } as unknown as Parameters<typeof createRecoveryBackup>[0]);
  return { backupDirectory, result, rows: rows(f.db), ledger: f.db.prepare("SELECT * FROM autonomy_runs ORDER BY run_id").all(), bytes: hash(readFileSync(result.payloadPath).toString("base64")) };
}

async function restore(f: Fixture, saved: Awaited<ReturnType<typeof backup>>, root: string, expectedRevocations: number) {
  const databasePath = path.join(root, `restored-${expectedRevocations}.db`);
  const options = { databasePath, backupDirectory: saved.backupDirectory, repositoryRoot: process.cwd(), instanceId: `revocation-${expectedRevocations}`,
    repositoryFingerprint: hash(process.cwd()).slice(7), runtimeOwnershipGeneration: "synthetic-revocation", databaseOverrideActive: true,
    selectedBackupId: saved.result.manifest.backup_id } as unknown as NonNullable<Parameters<typeof restoreRuntimeDatabase>[0]>;
  assert.equal((await restoreRuntimeDatabase(options)).databaseState, "restored");
  const restored = new Database(databasePath);
  try {
    assert.deepEqual(rows(restored), saved.rows); assert.equal(hash(readFileSync(saved.result.payloadPath).toString("base64")), saved.bytes);
    assert.deepEqual(restored.prepare("SELECT * FROM autonomy_runs ORDER BY run_id").all(), saved.ledger);
    assert.equal(hasUnsettledAutonomyRunLedgerRecords({ db: restored, scope: f.scope.project_id }), true);
    assert.equal(validateRecoveryCanonicalDatabaseV01(restored).status, "valid");
    assert.equal(readDirectionRecords(restored, f.scope, f.clock.now()).filter(r => r.value.kind === "revocation").length, expectedRevocations);
    const credentials = restored.prepare("SELECT token_hash,suspended FROM vnext_project_direction_credentials").all();
    assert.deepEqual(credentials, f.grants.map(() => ({ token_hash: null, suspended: 1 })));
    const recoveredAgent = createAgentProjectDirectionHandler({ environment: { ...f.environment, AUGNES_DB_PATH: databasePath }, clock: f.clock });
    for (const { issued, child } of f.grants) {
      const response = await recoveredAgent(new Request(agentUrl, { method: "POST", headers: { ...headers, authorization: `Bearer ${issued.credential}` },
        body: JSON.stringify({ project_id: child.project_id, sequence: 1, operation: decide(child.record.ref) }) }));
      assert.equal(response.status, 401); assert.equal((await response.json()).error, "project_direction_agent_credential_invalid");
    }
    assert.deepEqual(rows(restored), saved.rows);
  } finally { restored.close(); }
}

export async function testDirectionRevocation() {
  const root = realpathSync(mkdtempSync(path.join(tmpdir(), "augnes-revocation-")));
  let f: Awaited<ReturnType<typeof fixture>> | undefined;
  try {
    f = await fixture(root);
    const { db, scope, clock, humanCall, agentCall, grants } = f;
    const { issued, child } = grants[0]!;
    await refusalControls(f);
    // Supported legacy preparation on a nonempty, saturated store changes no
    // history, format or schema. There is no migration in this correction.
    const legacy = rows(db);
    await prepareRuntimeDatabase({ databasePath: f.databasePath, backupDirectory: path.join(root, "legacy-preparation"), repositoryRoot: process.cwd(), instanceId: "revocation-legacy", databaseOverrideActive: true } as unknown as Parameters<typeof prepareRuntimeDatabase>[0]);
    assert.deepEqual(rows(db), legacy);
    insertAutonomyRunLedgerRecord({ run_id: "run:synthetic-unresolved", scope: scope.project_id, autonomy_contract_ref: null, title: "Constructed unresolved obligation",
      status: "stopped", scheduled_for: null, started_at: clock.now(), finished_at: clock.now(), created_at: clock.now(), updated_at: clock.now(), stop_reason: "unknown_external_effect",
      source_refs: buildDefaultRunnerSourceRefs(), authority_boundary: buildDefaultRunnerAuthorityBoundary(), budget_snapshot: buildDefaultRunnerBudgetSnapshot(),
      metadata: { reconciliation_required: true, external_effect: "unknown", synthetic: true } }, [], [], { db });
    const beforeBackup = await backup(f, root, "before-revocation");
    // Effects committed before withdrawal remain immutable historical effects.
    const changed = await agentCall(issued.credential, { project_id: child.project_id, sequence: 1, operation: decide(child.record.ref) });
    assert.equal(changed.sequence, 2); assert.equal(changed.execution_authority_granted, false);
    const beforeTimeConflict = snapshot(db);
    const tiedWithdrawal = { config: f.config, credential: f.credential(), clock, request: revoke(issued.record.ref) };
    assert.throws(() => mutateHumanDirection(db, tiedWithdrawal), /revocation_time_conflict/);
    assert.deepEqual(snapshot(db), beforeTimeConflict, "A tied timestamp must not invalidate already committed history");
    const historicalAt = clock.now(), historical = readProjectDirection(db, scope, historicalAt), prior = rows(db);
    authenticateDirectionAgent(db, issued.credential, historicalAt);
    // The real transport is paused after request entry but before body completion.
    // The writer must acquire its transaction and observe time after revocation.
    let bodyController!: ReadableStreamDefaultController<Uint8Array>;
    const stream = new ReadableStream<Uint8Array>({ start(controller) { bodyController = controller; } });
    const held = f.agent(new Request(agentUrl, { method: "POST", headers: { ...headers, authorization: `Bearer ${issued.credential}` }, body: stream, duplex: "half" } as RequestInit));
    const usedCookie = f.cookie();
    const revoked = await humanCall(revoke(issued.record.ref));
    assert.equal(revoked.record.value.kind, "revocation"); assert.equal(revoked.record.value.principal.id, f.config.operator_id);
    assert.equal(revoked.state.grants[0].available, false); assert.deepEqual(revoked.state.grants[0].revocation, revoked.record);
    assert.deepEqual(rows(db).slice(0, prior.length), prior);
    assert.deepEqual(readProjectDirection(db, scope, historicalAt), historical);
    assert.equal(grantAvailable(db, scope, issued.record.ref, historicalAt), true);
    bodyController.enqueue(new TextEncoder().encode(JSON.stringify({ project_id: child.project_id, sequence: 2, operation: decide(changed.record.ref) }))); bodyController.close();
    const heldResponse = await held; assert.equal(heldResponse.status, 403); assert.equal((await heldResponse.json()).error, "project_direction_agent_grant_unavailable");
    const postRevoke = snapshot(db);
    await agentCall(issued.credential, { project_id: child.project_id, sequence: 2, operation: decide(changed.record.ref) }, 403);
    await agentCall(issued.credential, undefined, 403);
    await humanCall(revoke(issued.record.ref), 409, usedCookie);
    assert.deepEqual(snapshot(db), postRevoke);
    assert.deepEqual((await humanCall()).state.grants[0].revocation, revoked.record);
    await freshReadback(f, 1);
    const other = grants[1]!;
    const otherChanged = await agentCall(other.issued.credential, { project_id: other.child.project_id, sequence: 1, operation: decide(other.child.record.ref) });
    assert.equal(otherChanged.sequence, 2, "Unrelated outstanding grant stays usable");
    // Fresh valid nonce: return original attribution without another record.
    assert.deepEqual((await humanCall(revoke(issued.record.ref))).record, revoked.record);
    assert.deepEqual((await humanCall(revoke(issued.record.ref))).record, revoked.record);
    assert.equal(readDirectionRecords(db, scope, clock.now()).length, 513);
    // Concurrent same-session requests: one rotates nonce; replay remains refused.
    const sameCookie = f.cookie();
    const contenders = await Promise.all([200, 409].map((status) => humanCall(revoke(issued.record.ref), status, sameCookie)));
    assert.equal(contenders.filter(r => r.ok).length, 1);
    assert.equal(readDirectionRecords(db, scope, clock.now()).length, 513);

    // Inject response readback failure only after the revocation COMMIT. The
    // transport reports committed state and provides the rotated cookie.
    const prepare = Database.prototype.prepare, exec = Database.prototype.exec;
    let committed = false, injected = false;
    Database.prototype.exec = function(this: Database.Database, sql: string) { const result = exec.call(this, sql); if (sql === "COMMIT") committed = true; return result; };
    Database.prototype.prepare = function(this: Database.Database, sql: string) {
      if (committed && sql.includes("WITH direction_history AS MATERIALIZED")) { injected = true; throw new Error("injected_readback_unavailable"); }
      return prepare.call(this, sql);
    } as typeof prepare;
    let uncertain;
    try { uncertain = await humanCall(revoke(other.issued.record.ref), 503); }
    finally { Database.prototype.prepare = prepare; Database.prototype.exec = exec; }
    assert(committed && injected); assert.equal(uncertain.committed, true); assert.equal(uncertain.error, "project_direction_revocation_committed_readback_unavailable");
    // The caller intentionally retained the pre-response cookie (lost ACK).
    // Replay stays refused; a newly established ordinary session resolves it.
    const afterFailure = snapshot(db);
    await humanCall(revoke(other.issued.record.ref), 409);
    assert.deepEqual(snapshot(db), afterFailure);
    const observed = await humanCall(undefined, 200, sessionCookie(db, f.config, clock)); assert.deepEqual(observed.state.grants[1].revocation, uncertain.record);
    assert.equal(observed.state.grants.every((g: { available: boolean }) => !g.available), true);
    await agentCall(other.issued.credential, { project_id: other.child.project_id, sequence: 2, operation: decide(otherChanged.record.ref) }, 403);
    assert.equal(readDirectionRecords(db, scope, clock.now()).length, 514);
    validateProjectDirectionHistory(db); assert.equal(validateRecoveryCanonicalDatabaseV01(db).status, "valid");
    await freshReadback(f, 2);
    const afterBackup = await backup(f, root, "after-revocation");
    await restore(f, beforeBackup, root, 0); await restore(f, afterBackup, root, 2);
    // The ordinary append path cannot use withdrawal capacity, even for a new
    // grant/decision/binding. This owner also retains renewal's two-slot bound.
    for (const value of [f.last.value, issued.record.value, { version: issued.record.value.version, ...scope, kind: "binding", at: f.tick(), packet_id: "packet:synthetic", packet_fingerprint: issued.record.ref, direction_ref: f.last.ref }]) {
      assert.throws(() => db.transaction(() => appendDirectionRecord(db, value))(), /history_bound/);
    }
    const nearRoot = path.join(root, "near-full"); mkdirSync(nearRoot);
    const near = await fixture(nearRoot, 1);
    try {
      const nearGrant = near.grants[0]!;
      const before = snapshot(near.db);
      await near.humanCall({ action: "renew_agent", grant_ref: nearGrant.issued.record.ref, projects: [{ project_id: nearGrant.child.project_id, expected_ref: nearGrant.child.record.ref }], expires_in_minutes: 60, max_mutations: 8 }, 409);
      assert.deepEqual(snapshot(near.db), before, "One slot cannot admit a two-record renewal");
      const secondSession = sessionCookie(near.db, near.config, near.clock);
      const concurrent = await Promise.all([near.cookie(), secondSession].map(cookie => near.humanCall(revoke(nearGrant.issued.record.ref), 200, cookie)));
      const first = concurrent[0]!;
      assert.deepEqual(concurrent[1]!.record, first.record, "Independently authorized concurrent requests share one withdrawal");
      assert.equal(readDirectionRecords(near.db, near.scope, near.clock.now()).length, 512);
      assert.deepEqual((await near.humanCall(revoke(nearGrant.issued.record.ref))).record, first.record);
      assert.equal(readDirectionRecords(near.db, near.scope, near.clock.now()).length, 512);
      validateProjectDirectionHistory(near.db);
    } finally { near.db.close(); }
    // Earlier writers legitimately appended duplicates below the ordinary cap.
    // Retain those bytes, but admit no duplicate through the overflow exception.
    const oldRoot = path.join(root, "legacy-duplicates"); mkdirSync(oldRoot);
    const old = await fixture(oldRoot, 2, 508);
    try {
      const g = old.grants[0]!.issued.record;
      const value = { version: g.value.version, ...old.scope, kind: "revocation" as const, grant_ref: g.ref, principal: g.value.issuer, reason: "Legacy repeat" };
      old.db.transaction(() => { appendDirectionRecord(old.db, { ...value, at: old.tick() }); appendDirectionRecord(old.db, { ...value, at: old.tick() }); })();
      const preserved = rows(old.db);
      validateProjectDirectionHistory(old.db);
      await old.humanCall(revoke(g.ref)); assert.deepEqual(rows(old.db), preserved);
      await old.humanCall(revoke(old.grants[1]!.issued.record.ref));
      assert.deepEqual(rows(old.db).slice(0, preserved.length), preserved);
      validateProjectDirectionHistory(old.db);
      // Wrong issuer/reference cannot turn the overflow owner into an append API.
      const before = snapshot(old.db);
      assert.throws(() => old.db.transaction(() => revokeDirectionGrant(old.db, { ...value, at: old.tick(), principal: { kind: "human", id: "operator:foreign" } }))(), /grant_scope_conflict/);
      assert.throws(() => old.db.transaction(() => revokeDirectionGrant(old.db, { ...value, at: old.tick(), grant_ref: old.last.ref }))(), /grant_scope_conflict/);
      assert.deepEqual(snapshot(old.db), before);
    } finally { old.db.close(); }
    // Defensive malformed-store cases are isolated copies, never the positive
    // authority sequence. Valid hashes alone do not permit ordinary overflow.
    for (const mode of ["ordinary_tail", "duplicate_tail", "missing_tail", "hard_bound"]) {
      const damaged = new Database(db.serialize());
      try {
        if (mode === "ordinary_tail" || mode === "duplicate_tail") {
          const value = mode === "ordinary_tail" ? { ...f.last.value, previous: f.last.ref, revision: f.last.value.revision + 1, at: f.tick() }
            : { ...revoked.record.value, at: f.tick() };
          damaged.prepare("INSERT INTO vnext_project_direction_records(workspace_id,project_id,kind,ref,recorded_at,body_json) VALUES (?,?,?,?,?,?)")
            .run(scope.workspace_id, scope.project_id, value.kind, hash(canonical(value)), value.at, canonical(value));
        } else {
          const prepare = damaged.prepare.bind(damaged);
          damaged.prepare = ((sql: string) => {
            const statement = prepare(sql);
            if (sql.includes("WITH direction_history AS MATERIALIZED")) {
              const all = statement.all.bind(statement);
              statement.all = ((...args: unknown[]) => {
                const values = all(...args) as Array<{ n: number; ordinal: number }>;
                if (mode === "missing_tail") values.pop();
                else { while (values.length < 1026) values.push({ ...values[1]!, ordinal: values.length + 10000 }); values[0]!.n = 1025; }
                return values;
              }) as typeof statement.all;
            }
            return statement;
          }) as typeof damaged.prepare;
        }
        assert.throws(() => readDirectionRecords(damaged, scope, clock.now()), /history_bound|history_incomplete/);
        assert.equal(grantAvailable(damaged, scope, issued.record.ref, clock.now()), false);
      } finally { damaged.close(); }
    }
    console.log(JSON.stringify({ saturation_revocation: "pass", issuer_records: [512, 513, 514], unchanged_original_rows: true,
      ordinary_limits: "preserved", delayed_body: "refused_after_commit", all_outstanding_grants: "withdrawn_independently", replay: "refused", duplicate: "original_revocation",
      rollback: ["write", "precommit"], failed_history: ["incomplete", "malformed"], postcommit_failure: "committed_observable",
      fresh_process: true, near_full: true, recovery: ["pre_revocation_bearer_suspended", "post_revocation_history_preserved", "unresolved_obligation_preserved"], execution_authority: false, synthetic: true }));
  } finally { if (f?.db.open) f.db.close(); rmSync(root, { recursive: true, force: true }); }
}
async function readback() {
  const expected = JSON.parse(process.env.AUGNES_TEST_DIRECTION_EXPECTED!);
  const db = new Database(process.env.AUGNES_DB_PATH!);
  try {
    validateProjectDirectionHistory(db); assert.equal(validateRecoveryCanonicalDatabaseV01(db).status, "valid");
    assert.equal(hash(canonical(rows(db))), expected.rows);
    const human = createProjectDirectionHandler({ clock: { now: () => expected.at } });
    const response = await human(new Request(expected.humanUrl, { headers: { ...headers, cookie: process.env.AUGNES_TEST_DIRECTION_COOKIE! } }));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).state.grants.filter((g: { revocation: unknown }) => g.revocation).length, expected.expectedRevocations);
    const agent = createAgentProjectDirectionHandler({ clock: { now: () => expected.at } });
    assert.equal((await agent(new Request(agentUrl, { headers: { ...headers, authorization: `Bearer ${process.env.AUGNES_TEST_DIRECTION_CREDENTIAL!}` } }))).status, 403);
    console.log("fresh process: complete attributable history, authenticated human read and revoked bearer refusal");
  } finally { db.close(); }
}
if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) void (process.argv[2] === "--readback" ? readback() : testDirectionRevocation()).catch(error => { console.error(error); process.exitCode = 1; });
