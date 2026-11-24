import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { createProjectDirectionHandler } from "../app/api/vnext/operator/project-direction/route";
import { createAgentProjectDirectionHandler } from "../app/api/vnext/agent/project-direction/route";
import { createVNextOperatorContextUseReviewHandlerV01 } from "../app/api/vnext/operator/project-continuity/route";
import { consumeVNextLocalOperatorBootstrapV01, issueVNextLocalOperatorBootstrapV01, VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01 } from "../lib/vnext/runtime/local-operator-session";
import { selectActiveProjectV01 } from "../lib/vnext/persistence/project-lifecycle-registry";
import { appendDirectionRecord, readDirectionRecords, readProjectDirection } from "../lib/vnext/persistence/project-direction-store";
import { readProjectWorkInitializationSnapshotV01 } from "../lib/vnext/runtime/project-work-initialization";
import { normalizeLocalProjectRootRefV01, rebindCanonicalProjectLocalRootV01 } from "../lib/vnext/persistence/project-identity-registry";
import { canonicalizeProtocolValueV01 as canonical, createProtocolSha256V01 as hash } from "../lib/vnext/protocol-primitives";
import { createSaturatedDirectionFixture } from "./project-direction-revocation-checks";
import { createRecoveryBackup } from "./recovery-backup.mjs";
import { inspectRecoveryDatabaseFile, restoreRuntimeDatabase } from "./runtime-database-bootstrap.mjs";
import { validateRecoveryCanonicalDatabaseV01 } from "./recovery-canonical-record-validator";

type Fixture = Awaited<ReturnType<typeof createSaturatedDirectionFixture>>;
const hold = "Keep public listening on hold while reviewing the rights reply.";
const approved = "Allow an internal 20-second edit while keeping public listening on hold.";
const rights = "Internal edit approved for up to 20 seconds. Public listening stays on hold.\n";
const work = { goal: "Check the rights reply and update the internal cue sheet.", success_criteria: ["Verify the original rights reply."], non_goals: ["Do not publish audio."] };
const decide = (expected_ref: string | null, purpose: string, action = "continue_decision") => ({ action, expected_ref, content: { purpose, criteria: [hash(rights)], constraints: ["No public release."] },
  reason: "The owner reviewed the rights reply.", status: "active", proposal_ref: null });
const headers = { host: "127.0.0.1", origin: "http://127.0.0.1", "content-type": "application/json" };

function operator(f: Fixture, db: Database.Database) {
  const config = { ...f.config, database_path: db.name };
  const options = { environment: { ...f.environment, AUGNES_DB_PATH: db.name }, clock: f.clock };
  const bootstrap = issueVNextLocalOperatorBootstrapV01(db, { config, clock: f.clock });
  let cookie = VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01 + "=" + consumeVNextLocalOperatorBootstrapV01(db, { config, clock: f.clock, bootstrap_token: bootstrap.bootstrap_token }).cookie_value;
  const direction = createProjectDirectionHandler(options), task = createVNextOperatorContextUseReviewHandlerV01(options);
  return async (body?: Record<string, unknown>, expected = 200) => {
    f.tick();
    const taskRequest = body?.action === "define_initial_project_work";
    const url = taskRequest ? "http://127.0.0.1/api/vnext/operator/project-continuity" : f.humanUrl;
    const response = await (taskRequest ? task : direction)(new Request(url, { method: body ? "POST" : "GET", headers: { ...headers, cookie }, ...(body && { body: JSON.stringify(body) }) }));
    const value = await response.json();
    assert.equal(response.status, expected, value.error ?? value.error_code);
    cookie = response.headers.get("set-cookie")?.split(";")[0] ?? cookie;
    return value;
  };
}

async function recover(db: Database.Database, directory: string) {
  const backupDirectory = path.join(directory, "backups"), databasePath = path.join(directory, "restored.db");
  mkdirSync(directory);
  const fingerprint = hash(process.cwd()).slice(7);
  const saved = await createRecoveryBackup({ databasePath: db.name, backupDirectory, applicationScopeFingerprint: fingerprint,
    sourceApplication: { application_version: null, build_identity: null, package_contract: null, package_contract_version: null, runtime_contract: null, runtime_schema_version: null },
    reason: "manual_recovery", inspectDatabase: inspectRecoveryDatabaseFile } as Parameters<typeof createRecoveryBackup>[0]);
  const result = await restoreRuntimeDatabase({ databasePath, backupDirectory, repositoryRoot: process.cwd(), instanceId: "direction-continuation",
    repositoryFingerprint: fingerprint, runtimeOwnershipGeneration: "direction-continuation-test", databaseOverrideActive: true,
    selectedBackupId: saved.manifest.backup_id } as unknown as NonNullable<Parameters<typeof restoreRuntimeDatabase>[0]>);
  assert.equal(result.databaseState, "restored");
  return new Database(databasePath);
}

async function recoveredTask(root: string) {
  // All seeded dates precede both the test clock and current wall-clock root binding reads.
  const f = await createSaturatedDirectionFixture(root, 1, 508, Date.now() - 10_000);
  let recovered: Database.Database | undefined, reopened: Database.Database | undefined;
  try {
    const { db, scope } = f;
    const owner = operator(f, db);
    const previous = (await owner(decide(f.last.ref, hold, "decide"))).record;
    const active = selectActiveProjectV01(db, { ...scope, expected_project_id: null, expected_revision: null, now: f.tick() });
    await owner({ action: "define_initial_project_work", ...scope, expected_active_project_id: scope.project_id, expected_active_selection_revision: active.selection_revision,
      expected_initialization_state: "not_defined", ...work }, 201);
    writeFileSync(path.join(root, "parent", "rights.txt"), rights);
    const inspect = (ref: string) => ({ action: "prepare_inspection", expected_ref: ref, files: [{ path: "rights.txt", contains: "20 seconds" }] });
    await owner(inspect(previous.ref));
    assert.equal((await owner(decide(previous.ref, approved), 409)).error, "project_direction_history_bound");
    const grant = f.grants[0];
    const proposal = (await f.agentCall(grant.issued.credential, { project_id: scope.project_id, sequence: 1, operation: {
      action: "propose", expected_ref: previous.ref, content: decide(previous.ref, approved).content, reason: "Check the reply before the internal edit." } })).record;
    const baseline = readProjectWorkInitializationSnapshotV01(db, scope);
    const prefix = readDirectionRecords(db, scope, f.clock.now());
    assert.equal(prefix.length, 512);
    const prefixRows = (connection: Database.Database) => connection.prepare("SELECT * FROM vnext_project_direction_records WHERE workspace_id=? AND project_id=? ORDER BY ordinal LIMIT 512").all(scope.workspace_id, scope.project_id);
    const originalRows = prefixRows(db);
    recovered = await recover(db, path.join(root, "recovery-one"));
    const replacementRoot = path.join(root, "replacement-project");
    mkdirSync(replacementRoot);
    rebindCanonicalProjectLocalRootV01(recovered, { ...scope, local_root: normalizeLocalProjectRootRefV01(replacementRoot, { base_path: root }) });
    const nextOwner = operator(f, recovered);
    const staleOwner = operator(f, recovered);
    const restored = readProjectWorkInitializationSnapshotV01(recovered, scope);
    assert.deepEqual(restored.packet, baseline.packet);
    assert.deepEqual(restored.projection.current_work, work);
    assert.equal(restored.task_origin_fingerprint, baseline.task_origin_fingerprint);
    const agent = createAgentProjectDirectionHandler({ environment: { ...f.environment, AUGNES_DB_PATH: recovered.name }, clock: f.clock });
    const refused = await agent(new Request("http://127.0.0.1/api/vnext/agent/project-direction", { headers: { host: headers.host, authorization: "Bearer " + f.grants[0].issued.credential } }));
    assert.equal(refused.status, 401);
    const cutoff = f.clock.now(), then = readProjectDirection(recovered, scope, cutoff);
    assert.equal(then.effective?.ref, previous.ref);
    assert.equal(then.continuation_slots, 511, "The suspended grant retains withdrawal capacity");
    assert.equal((await nextOwner(decide(previous.ref, approved, "decide"), 409)).error, "project_direction_history_bound");
    const retained = readFileSync(path.join(root, "parent", "rights.txt"));
    assert.equal(hash(retained.toString()), then.effective!.value.content.criteria[0]);
    writeFileSync(path.join(replacementRoot, "rights.txt"), retained, { flag: "wx" });
    const next = await nextOwner({ ...decide(previous.ref, approved), proposal_ref: proposal.ref });
    assert.equal(next.record.value.previous, previous.ref);
    assert.equal(next.record.value.proposal_ref, proposal.ref);
    assert.equal(next.state.proposals.length, 0);
    const expectedHistory = createHash("sha256").update("augnes.direction-history.v1\0");
    for (const row of originalRows as { ref: string }[]) expectedHistory.update(row.ref);
    assert.equal(next.record.value.prior_history_ref, "sha256:" + expectedHistory.digest("hex"));
    assert.equal(next.state.execution_authority_granted, false);
    assert.equal(next.state.pending_work[0].needs_reconsideration, true);
    assert.equal(next.state.continuation_slots, 510);
    assert.deepEqual(readProjectDirection(recovered, scope, cutoff), then);
    assert.equal((await staleOwner(decide(previous.ref, approved), 409)).error, "project_direction_stale_revision");
    // A self-consistent final record must still cite the proposal actually adopted.
    for (const change of [{ proposal_ref: hash("absent proposal") }, { content: decide(previous.ref, hold).content }]) {
      const wrongSource = new Database(recovered.serialize());
      try {
        const body = { ...next.record.value, ...change };
        wrongSource.exec("DROP TRIGGER trg_vnext_project_direction_update");
        wrongSource.prepare("UPDATE vnext_project_direction_records SET body_json=?,ref=? WHERE ref=?").run(canonical(body), hash(canonical(body)), next.record.ref);
        assert.throws(() => readDirectionRecords(wrongSource, scope, cutoff), /proposal_changed/);
        assert.notEqual(validateRecoveryCanonicalDatabaseV01(wrongSource).status, "valid");
      } finally { wrongSource.close(); }
    }
    const prepared = await nextOwner(inspect(next.record.ref));
    assert.equal(prepared.direction_ref, next.record.ref);
    assert.equal(prepared.execution_started, false);
    const after = readProjectWorkInitializationSnapshotV01(recovered, scope);
    assert.equal(after.task_origin_fingerprint, baseline.task_origin_fingerprint);
    assert.deepEqual(after.projection.current_work, work);
    assert.equal(after.packet?.packet_id, prepared.packet_id);
    const current = (await nextOwner()).state;
    assert.equal(current.continuation_slots, 509);
    assert.equal(current.pending_work[0].direction_ref, next.record.ref);
    assert.equal(current.pending_work[0].needs_reconsideration, false);
    assert.deepEqual(prefixRows(recovered), originalRows);
    reopened = await recover(recovered, path.join(root, "recovery-two"));
    assert.equal(validateRecoveryCanonicalDatabaseV01(reopened).status, "valid");
    const newSession = operator(f, reopened);
    const fresh = (await newSession()).state;
    assert.deepEqual(fresh.effective, next.record);
    assert.deepEqual(readProjectWorkInitializationSnapshotV01(reopened, scope).packet, after.packet);
    assert.deepEqual(prefixRows(reopened), originalRows);
    assert.deepEqual(readDirectionRecords(reopened, scope, f.clock.now()).slice(0, 512), prefix);
    assert.equal((await newSession({ action: "revoke_agent", grant_ref: f.grants[0].issued.record.ref, reason: "Withdraw this recovered role." })).state.continuation_slots, 509);

    // Even an early cutoff must refuse a damaged sealed prefix. Change an
    // otherwise valid original binding to its legacy shape and recompute its reference.
    const damaged = new Database(reopened.serialize());
    try {
      const binding = prefix.find(r => r.value.kind === "binding")!;
      assert(binding.value.kind === "binding" && binding.value.basis === "selected_direction");
      const { basis: _basis, ...changed } = binding.value;
      damaged.exec("DROP TRIGGER trg_vnext_project_direction_update");
      damaged.prepare("UPDATE vnext_project_direction_records SET body_json=?,ref=? WHERE ref=?").run(canonical(changed), hash(canonical(changed)), binding.ref);
      assert.throws(() => readDirectionRecords(damaged, scope, cutoff), /continuation_prefix_invalid/);
      assert.notEqual(validateRecoveryCanonicalDatabaseV01(damaged).status, "valid");
    } finally { damaged.close(); }
  } finally { reopened?.close(); recovered?.close(); f.db.close(); }
}

async function reservedWithdrawals(root: string) {
  const f = await createSaturatedDirectionFixture(root, 1, 1, Date.now() - 10_000);
  try {
    const first = f.grants[0].issued.record;
    const reserve = f.db.prepare("INSERT INTO vnext_project_direction_credentials(grant_ref,suspended) VALUES (?,1)");
    f.db.transaction(() => {
      for (let i = 0; i < 510; i++) {
        const record = appendDirectionRecord(f.db, { ...first.value, at: f.tick(), principal: { kind: "agent", id: "role:retained-" + i }, creation_slots: [] });
        reserve.run(record.ref);
      }
    })();
    assert.equal((await f.humanCall()).state.continuation_slots, 1);
    const last = await f.humanCall(decide(f.last.ref, approved));
    assert.equal(last.state.continuation_slots, 0);
    assert.equal((await f.humanCall(decide(last.record.ref, hold), 409)).error, "project_direction_history_bound");
    await f.humanCall({ action: "revoke_agent", grant_ref: first.ref, reason: "Withdraw after the last owner decision." });
    assert.equal((await f.humanCall()).state.continuation_slots, 0);
    assert.equal(validateRecoveryCanonicalDatabaseV01(f.db).status, "valid");
  } finally { f.db.close(); }
}

export async function testDirectionContinuation() {
  const root = realpathSync(mkdtempSync(path.join(tmpdir(), "augnes-direction-continuation-")));
  try {
    await recoveredTask(root);
    const reserved = path.join(root, "reserved"); mkdirSync(reserved);
    await reservedWithdrawals(reserved);
    const decisions = path.join(root, "decisions"); mkdirSync(decisions);
    const f = await createSaturatedDirectionFixture(decisions, 0, 512, Date.now() - 10_000);
    try {
      const first = await f.humanCall(decide(f.last.ref, approved));
      assert.equal(first.record.value.revision, 513);
      const second = await f.humanCall(decide(first.record.ref, hold));
      assert.equal(second.record.value.revision, 514);
      assert.notEqual(first.record.value.prior_history_ref, second.record.value.prior_history_ref);
      assert.equal(validateRecoveryCanonicalDatabaseV01(f.db).status, "valid");
    } finally { f.db.close(); }
    console.log("Direction continuation passed: two restores, historical decisions and pending task, selected evidence, stale refusal, corruption refusal and reserved withdrawals.");
  } finally { rmSync(root, { recursive: true, force: true }); }
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  void testDirectionContinuation().catch(error => { console.error(error); process.exitCode = 1; });
}
