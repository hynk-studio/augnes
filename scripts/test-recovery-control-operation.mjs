import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readProcessBirthIdentity } from "./local-process-ownership.mjs";
import Database from "better-sqlite3";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { createRecoveryRequestController, readRecoveryBackupCatalog, readRecoveryRequestHistory, RECOVERY_REQUEST_FILE } from "./recovery-control-operation.mjs";
import { startControlServer, stopOwnedChild } from "./augnes-runtime-supervisor-core.mjs";
import { readRecoveryOperationResultsMetadata } from "./recovery-backup.mjs";
assert.equal(process.env.AUGNES_CANONICAL_TEST_MODE, "1");
if (process.argv[2] === "--interrupt-supervisor") {
    const options = JSON.parse(process.argv[3]);
    const childController = createRecoveryRequestController({ ...options, environment: process.env, stopOwnedChild, testScenario: "sync_hold_long" });
    const target = readRecoveryBackupCatalog(options.backupDirectory, options.scope)[0].public;
    const request = { action: "verify_backup", request_id: randomUUID(), admission_binding: childController.status().admission_binding, backup_id: target.backup_id, backup_identity: target.backup_identity, target_binding: target.target_binding };
    childController.admit(request);
    while (!childController.active?.testHolding)
        await new Promise(resolve => setTimeout(resolve, 10));
    process.send({ request_id: request.request_id, worker_pid: childController.active.pid });
    setTimeout(() => process.kill(process.pid, "SIGKILL"), 200);
    await new Promise(() => { });
}
const root = mkdtempSync(path.join(process.env.AUGNES_CANONICAL_TEMP_ROOT, "recovery-requests-"));
const databasePath = path.join(root, "state.db"), backupDirectory = path.join(root, "backups");
const scope = "a".repeat(64);
const sourceApplication = { application_version: "0.1.1", build_identity: null, package_contract: null, package_contract_version: null, runtime_contract: "augnes-local-runtime-supervisor-v1", runtime_schema_version: 2 };
let controller, server;
const database = new Database(databasePath);
try {
    applyCanonicalDatabaseMigrations(database);
}
finally {
    database.close();
}
chmodSync(databasePath, 0o600);
const options = { backupDirectory, databasePath, scope, sourceApplication, generation: randomUUID(), environment: process.env, stopOwnedChild };
const make = extra => createRecoveryRequestController({ ...options, ...extra });
const create = () => ({ action: "create_backup", request_id: randomUUID(), admission_binding: controller.status().admission_binding });
const verify = target => ({ action: "verify_backup", request_id: randomUUID(), admission_binding: controller.status().admission_binding, backup_id: target.backup_id, backup_identity: target.backup_identity, target_binding: target.target_binding });
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
async function terminal(id) {
    const end = Date.now() + 25000;
    while (controller.active && Date.now() < end)
        await wait(20);
    assert.equal(controller.active, null, "worker must settle within fixture deadline");
    return controller.status(id).operation;
}
function entries() { return readdirSync(backupDirectory).filter(name => name.endsWith(".backup")).sort(); }
let assertions = 0, admissionMs, controlReadMs;
try {
    controller = make({ testScenario: "sync_hold" });
    controller.status();
    assert.equal(existsSync(backupDirectory), false, "status/initialization must allocate no recovery state");
    const runtime = {
        children: new Map(),
        instanceId: "test-recovery-control", childOwnershipToken: "synthetic-private-owner", recoveryRequest: null, shutdownRequested: false, recoveryController: controller,
        recoveryOperationStateAvailable: true, recoveryRetryAvailable: true, recoveryRestoreAvailable: true, recoveryMode: false, databaseState: "current", databaseSchemaVersion: "current", lifecycleState: "ready", bridgePort: 1234,
        paths: { local: { backup_directory: backupDirectory } }, runtimeDistribution: { mode: "source", applicationScopeFingerprint: scope, applicationVersion: "0.1.1", buildIdentity: null, runtimeContract: sourceApplication.runtime_contract, runtimeSchemaVersion: 2 },
        legacyBackupAdoption: { adopted: [], already_adopted: [], rejected: [] },
    };
    server = await startControlServer(runtime);
    server.prependListener("request", (request, response) => {
        if (request.headers["x-test-drop-ack"] === "1")
            response.end = () => { response.destroy(); return response; };
    });
    const origin = `http://127.0.0.1:${server.address().port}`;
    const headers = { "x-augnes-child-ownership": runtime.childOwnershipToken, "x-augnes-runtime-instance": runtime.instanceId, "content-type": "application/json" };
    const request = create();
    let start = Date.now();
    await assert.rejects(fetch(`${origin}/v1/recovery`, { method: "POST", headers: { ...headers, "x-test-drop-ack": "1" }, body: JSON.stringify(request) }));
    admissionMs = Date.now() - start;
    assert.ok(admissionMs < 1500);
    // The real server discarded the acknowledgement after durable admission.
    const count = readRecoveryRequestHistory(backupDirectory, scope).requests.length;
    const pid = controller.active.pid;
    const holdDeadline = Date.now() + 5000;
    while (!controller.active?.testHolding && Date.now() < holdDeadline)
        await wait(10);
    assert.equal(controller.active?.testHolding, true);
    start = Date.now();
    const health = await fetch(`${origin}/v1/identity`);
    assert.equal((await health.json()).lifecycle_state, "ready");
    const statusResponse = await fetch(`${origin}/v1/recovery?request_id=${request.request_id}`, { headers });
    const status = await statusResponse.json();
    assert.equal(status.operation.request_id, request.request_id);
    assert.ok(["accepted", "running"].includes(status.operation.state));
    assert.equal(status.actions.restore_backup, false);
    assert.equal(status.backup_inventory_state, "metadata_only");
    controlReadMs = Date.now() - start;
    assert.ok(controlReadMs < 500, "real child synchronous work must not block health/status");
    assert.deepEqual(controller.admit(request), { accepted: true, outcome: "operation_recorded", request_id: request.request_id });
    assert.equal(controller.active.pid, pid);
    assert.equal(readRecoveryRequestHistory(backupDirectory, scope).requests.length, count);
    assert.throws(() => controller.admit({ ...request, admission_binding: randomUUID() }), { code: "recovery_request_material_conflict" });
    const rejected = create();
    const rejectedResponse = await fetch(`${origin}/v1/recovery`, { method: "POST", headers, body: JSON.stringify(rejected) });
    assert.equal(rejectedResponse.status, 409);
    const refusal = await rejectedResponse.json();
    assert.equal(refusal.outcome, "request_not_admitted");
    assert.equal(refusal.request_id, rejected.request_id);
    assert.equal(controller.active.pid, pid, "refusal must not dispatch another worker");
    const rejectedRow = readRecoveryRequestHistory(backupDirectory, scope).requests.find(row => row.request.request_id === rejected.request_id);
    assert.equal(rejectedRow.state, "not_admitted");
    assert.equal(rejectedRow.accepted_at, null);
    assert.equal(rejectedRow.worker, null);
    assert.deepEqual(controller.admit(rejected), refusal, "exact refused replay remains refused");
    assert.throws(() => controller.admit({ ...rejected, admission_binding: randomUUID() }), { code: "recovery_request_material_conflict" });
    const foreign = await fetch(`${origin}/v1/recovery`, { method: "POST", headers: { ...headers, "x-augnes-runtime-instance": "foreign" }, body: JSON.stringify(create()) });
    assert.equal(foreign.status, 403);
    const unauthenticated = await fetch(`${origin}/v1/recovery`);
    assert.equal(unauthenticated.status, 403);
    const result = await terminal(request.request_id);
    assert.equal(result.state, "completed", JSON.stringify(result));
    assert.equal(result.result.creation_completed, true);
    assert.equal(readRecoveryOperationResultsMetadata(backupDirectory).events[0].outcome, "recovery_backup_created");
    assert.equal(entries().length, 1);
    assert.equal(existsSync(path.join(backupDirectory, "augnes-recovery-backup-operation.json")), false);
    assertions += 13;
    await controller.stop();
    controller = make();
    runtime.recoveryController = controller;
    assert.deepEqual(controller.status(rejected.request_id).operation.request, rejected, "fresh controller retains exact refused material");
    assert.deepEqual(controller.admit(rejected), refusal, "settlement never turns a refused replay into new admission");
    assert.equal(controller.active, null);
    assert.equal(entries().length, 1, "only the originally admitted backup exists");
    runtime.recoveryRequest = { action: "request_pending" };
    const blockedRequest = create();
    try {
        const blockedResponse = await fetch(`${origin}/v1/recovery`, { method: "POST", headers, body: JSON.stringify(blockedRequest) });
        assert.equal((await blockedResponse.json()).outcome, "request_not_admitted", "protected-action mutex also records only proven non-admission");
        assert.equal(controller.active, null);
        const conflictingResponse = await fetch(`${origin}/v1/recovery`, { method: "POST", headers, body: JSON.stringify({ ...request, admission_binding: randomUUID() }) });
        assert.equal((await conflictingResponse.json()).outcome, "refused", "generic conflict must not claim non-admission");
        assert.equal(controller.status(request.request_id).operation.state, "completed");
    } finally { runtime.recoveryRequest = null; }
    assertions += 9;
    const target = readRecoveryBackupCatalog(backupDirectory, scope)[0].public;
    assert.equal(target.verified, false);
    const verification = verify(target), before = entries();
    const { GET, POST } = await import("../app/api/recovery/route.ts");
    const publicEnv = { AUGNES_RUNTIME_CONTROL_PORT: String(server.address().port), AUGNES_RUNTIME_INSTANCE_ID: runtime.instanceId, AUGNES_RUNTIME_OWNERSHIP_TOKEN: runtime.childOwnershipToken, AUGNES_DB_PATH: databasePath };
    const savedEnv = Object.fromEntries(Object.keys(publicEnv).map(key => [key, process.env[key]]));
    Object.assign(process.env, publicEnv);
    try {
        const { recoveryConfirmationStateV02 } = await import("../lib/vnext/recovery/recovery-action-confirmation.ts");
        const readRequest = async id => {
            const response = await GET(new Request(`http://127.0.0.1:3000/api/recovery?request_id=${id}`, { headers: { host: "127.0.0.1:3000" } }));
            assert.equal(response.status, 200);
            return response.json();
        };
        const readRefusal = await readRequest(rejected.request_id);
        assert.equal(recoveryConfirmationStateV02(readRefusal, rejected), "unverified");
        assert.equal(readRefusal.actions.create_backup, true);
        assert.equal(readRefusal.actions.restore_backup, false);
        assert.equal(readRefusal.actions.retry_update, false);
        assert.equal(recoveryConfirmationStateV02(readRefusal, { ...rejected, admission_binding: randomUUID() }), "refresh_required");
        const changedTargetRequest = verify({ ...target, target_binding: `sha256:${"e".repeat(64)}` });
        const changedResponse = await POST(new Request("http://127.0.0.1:3000/api/recovery", { method: "POST", headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000", "content-type": "application/json" }, body: JSON.stringify(changedTargetRequest) }));
        assert.equal(changedResponse.status, 409);
        assert.equal((await changedResponse.json()).outcome, "request_not_admitted");
        const changedStatus = await readRequest(changedTargetRequest.request_id);
        assert.equal(changedStatus.operation.reason, "recovery_backup_changed");
        assert.equal(recoveryConfirmationStateV02(changedStatus, changedTargetRequest), "unverified");
        assert.equal(changedStatus.backups[0].target_binding, target.target_binding, "fresh status exposes current material for explicit selection");
        assert.equal(controller.active, null);
        assert.deepEqual(entries(), before);
        assertions += 7;
        const admitted = await POST(new Request("http://127.0.0.1:3000/api/recovery", { method: "POST", headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000", "content-type": "application/json" }, body: JSON.stringify(verification) }));
        assert.equal(admitted.status, 202);
        assert.equal((await admitted.json()).request_id, verification.request_id);
        await terminal(verification.request_id);
        const consumed = await GET(new Request(`http://127.0.0.1:3000/api/recovery?request_id=${verification.request_id}`, { headers: { host: "127.0.0.1:3000" } }));
        assert.equal(consumed.status, 200);
        const body = await consumed.json();
        assert.equal(body.operation.state, "completed");
        assert.equal(body.operation.result.backup_id, target.backup_id);
        assert.equal(body.backups[0].verified, false);
        assert.equal(body.contract, "augnes.recovery-product.v2");
        assert.equal(JSON.stringify(body).includes(backupDirectory), false);
        assert.equal(JSON.stringify(body).includes(runtime.childOwnershipToken), false);
    }
    finally {
        for (const [key, value] of Object.entries(savedEnv)) {
            if (value === undefined)
                delete process.env[key];
            else
                process.env[key] = value;
        }
    }
    const verified = await terminal(verification.request_id);
    assert.equal(verified.state, "completed", JSON.stringify(verified));
    assert.equal(verified.result.backup_id, target.backup_id);
    assert.equal(verified.result.creation_completed, false);
    assert.equal(verified.result.build_identity, null);
    assert.deepEqual(entries(), before, "fresh full verification must not create another backup");
    // Historical status is an exact operation result, never a new validation.
    const historyBefore = readFileSync(path.join(backupDirectory, RECOVERY_REQUEST_FILE));
    const residue = path.join(backupDirectory, `augnes-recovery-operations.json.write-2147483646-${randomUUID()}`);
    writeFileSync(residue, "synthetic", { mode: 0o600 });
    for (let i = 0; i < 3; i++) {
        const read = await fetch(`${origin}/v1/recovery?request_id=${verification.request_id}`, { headers });
        assert.equal(read.status, 200);
        assert.equal((await read.json()).operation.state, "completed");
    }
    assert.deepEqual(readFileSync(path.join(backupDirectory, RECOVERY_REQUEST_FILE)), historyBefore);
    assert.equal(readFileSync(residue, "utf8"), "synthetic");
    rmSync(residue);
    assert.deepEqual(controller.admit(verification).request_id, verification.request_id);
    assert.equal(controller.active, null);
    assert.equal(controller.status(randomUUID()).operation.state, "unknown");
    assert.throws(() => controller.admit({ ...create(), admission_binding: randomUUID() }), { code: "recovery_request_history_unknown" });
    assertions += 10;
    // Replacement and tampering invalidate handoff. A new explicit verification
    // must run the validator and fail even though catalog metadata remains valid.
    const payload = path.join(backupDirectory, before[0], "state", "augnes.db");
    const oldPayload = readFileSync(payload);
    renameSync(payload, `${payload}.held`);
    writeFileSync(payload, oldPayload, { mode: 0o600 });
    assert.equal(controller.status(verification.request_id).operation.state, "stale");
    const replacedRequest = verify(target);
    assert.equal(controller.admit(replacedRequest).outcome, "request_not_admitted");
    assert.equal(controller.status(replacedRequest.request_id).operation.state, "not_admitted");
    const replaced = readRecoveryBackupCatalog(backupDirectory, scope)[0].public;
    writeFileSync(payload, "synthetic-invalid-database", { mode: 0o600 });
    const tampered = readRecoveryBackupCatalog(backupDirectory, scope)[0].public;
    const bad = verify(tampered);
    controller.admit(bad);
    assert.equal((await terminal(bad.request_id)).state, "failed");
    rmSync(payload);
    renameSync(`${payload}.held`, payload);
    assertions += 3;
    for (const scenario of ["fail", "output_loss", "bookkeeping_fail"]) {
        await controller.stop();
        controller = make({ testScenario: scenario });
        runtime.recoveryController = controller;
        const r = scenario === "bookkeeping_fail" ? create() : verify(readRecoveryBackupCatalog(backupDirectory, scope)[0].public);
        const size = entries().length;
        controller.admit(r);
        const failed = await terminal(r.request_id);
        assert.equal(failed.state, "failed");
        assert.equal(failed.result, null);
        assert.equal(entries().length, size + (scenario === "bookkeeping_fail" ? 1 : 0));
        assert.equal(controller.admit(r).request_id, r.request_id);
        assert.equal(controller.active, null, "failed exact replay must not dispatch");
        assertions += 4;
    }
    await controller.stop();
    controller = make({ testScenario: "sync_hold", testDeadlineMs: 250 });
    runtime.recoveryController = controller;
    const timeout = verify(readRecoveryBackupCatalog(backupDirectory, scope)[0].public);
    controller.admit(timeout);
    const expired = await terminal(timeout.request_id);
    assert.equal(expired.state, "failed");
    assert.equal(expired.result, null);
    assert.equal(controller.active, null);
    await controller.stop();
    controller = make({ testScenario: "sync_hold" });
    runtime.recoveryController = controller;
    const interrupted = verify(readRecoveryBackupCatalog(backupDirectory, scope)[0].public);
    controller.admit(interrupted);
    await controller.stop();
    assert.equal(controller.status(interrupted.request_id).operation.state, "interrupted");
    await controller.stop();
    controller = make({ generation: randomUUID() });
    runtime.recoveryController = controller;
    assert.equal(controller.status(interrupted.request_id).operation.state, "interrupted");
    assert.equal(controller.admit(interrupted).request_id, interrupted.request_id);
    assert.equal(controller.active, null);
    assertions += 5;
    await controller.stop();
    const helper = spawn(process.execPath, ["--import", "tsx", fileURLToPath(import.meta.url), "--interrupt-supervisor", JSON.stringify({ ...options, environment: undefined, stopOwnedChild: undefined, generation: randomUUID() })], { env: process.env, detached: process.platform !== "win32", stdio: ["ignore", "ignore", "ignore", "ipc"] });
    const helperRecord = { child: helper, pid: helper.pid, exit: null };
    const closed = new Promise(resolve => helper.once("close", (code, signal) => { helperRecord.exit = { code, signal }; resolve(); }));
    let crash;
    try {
        crash = await new Promise((resolve, reject) => { const timeout = setTimeout(() => reject(new Error("interrupt_fixture_timeout")), 5000); helper.once("message", value => { clearTimeout(timeout); resolve(value); }); helper.once("error", reject); });
        await closed;
    }
    finally {
        await stopOwnedChild(helperRecord);
        await closed;
    }
    const end = Date.now() + 5000;
    while (readProcessBirthIdentity(crash.worker_pid).state !== "missing" && Date.now() < end)
        await wait(50);
    assert.equal(readProcessBirthIdentity(crash.worker_pid).state, "missing", "independent watchdog must settle orphan worker");
    const persisted = readRecoveryRequestHistory(backupDirectory, scope).requests.find(row => row.request.request_id === crash.request_id);
    assert.equal(persisted.state, "running", "supervisor death cannot invent a terminal result");
    controller = make({ generation: randomUUID() });
    runtime.recoveryController = controller;
    assert.equal(controller.status(crash.request_id).operation.state, "interrupted");
    assert.equal(controller.active, null);
    assertions += 4;
    await controller.stop();
    const historyPath = path.join(backupDirectory, RECOVERY_REQUEST_FILE);
    const requestForMissing = verify(readRecoveryBackupCatalog(backupDirectory, scope)[0].public);
    assert.throws(() => readRecoveryRequestHistory(backupDirectory, "b".repeat(64)), { code: "recovery_request_history_unavailable" });
    renameSync(historyPath, `${historyPath}.held`);
    assert.throws(() => controller.status(requestForMissing.request_id));
    assert.throws(() => controller.admit(requestForMissing));
    assert.equal(controller.active, null);
    renameSync(`${historyPath}.held`, historyPath);
    controller = make();
    const bytes = readFileSync(historyPath);
    writeFileSync(historyPath, "{incompatible", { mode: 0o600 });
    assert.throws(() => controller.status(requestForMissing.request_id));
    assert.throws(() => controller.admit(requestForMissing));
    assert.equal(controller.active, null);
    writeFileSync(historyPath, bytes, { mode: 0o600 });
    controller = make();
    assertions += 5;
    console.log(JSON.stringify({ test: "recovery-control-operation", status: "pass", assertion_groups: assertions, admission_ms: admissionMs, identity_and_status_ms: controlReadMs, real_worker_validation: true, correlated_lost_ack: true, control_responsive_during_sync_work: true, no_production_access: true }));
}
finally {
    await controller?.stop();
    if (server) {
        server.closeAllConnections();
        await new Promise(resolve => server.close(resolve));
    }
    rmSync(root, { recursive: true, force: true });
    assert.equal(existsSync(root), false);
}
