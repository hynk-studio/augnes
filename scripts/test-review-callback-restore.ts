// Recovery-owned regression: real supervisor/Next, fresh local CLI processes,
// reviewer stdio and atomic backup/restore. No direct permission-row writes.
import assert from "node:assert/strict";
import { spawn, execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import Database from "better-sqlite3";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { runCanonicalChild, canonicalChildAcceptanceFailure } from "./canonical-child-runner.mjs";
import { createRecoveryBackup } from "./recovery-backup.mjs";
import { restoreRuntimeDatabase, inspectRecoveryDatabaseFile } from "./runtime-database-bootstrap.mjs";
import { cleanupOwnedProcesses, registerOwnedChild, waitForOwnedProcessExit } from "./test-harness-process-lifecycle.mjs";
import { prepareSupervisedReviewHttp } from "./test-supervised-review-http";
import { receiverSecret, receiverRecoverySecret } from "./test-review-receiver-fixture.mjs";
import { installZeroNetworkGuard } from "./test-harness-zero-network-guard.mjs";
import { assertPreparedDatabase, DatabaseAccessError } from "../lib/db/prepared-database.mjs";
import { structuralSchemaContractSignature } from "../lib/db/structural-schema-contract.mjs";
import { readReviewCallback, readReviewConnections } from "../plugins/augnes-operator/mcp/review-connection.mjs";
import { declareAndInspectLocalProjectV01, confirmLocalProjectOnboardingV01 } from "../lib/vnext/onboarding/local-project-onboarding";
import { discoverVerifiedCompanionV01, handleMessageV01 } from "../plugins/augnes-operator/mcp/companion-proxy.mjs";

async function testReviewCallbackRestore() {
    const root = process.cwd(), started = Date.now(), savedEnv = { ...process.env };
    const temporary = realpathSync(mkdtempSync(path.join(tmpdir(), "ag-review-restore-")));
    const databasePath = path.join(temporary, "fixture.db"), owned = new Set<any>();
    const guard = installZeroNetworkGuard({ allowLoopback: true });
    const f = prepareSupervisedReviewHttp(root, temporary, databasePath);
    const supervisor = path.join(root, "scripts/augnes-runtime-supervisor.mjs");
    const env: NodeJS.ProcessEnv = { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, NODE_ENV: "test",
        HOME: path.join(temporary, "home"), USERPROFILE: path.join(temporary, "home"), TMPDIR: temporary, TMP: temporary, TEMP: temporary,
        AUGNES_DB_PATH: databasePath, AUGNES_RUNTIME_STATE_DIR: path.join(temporary, "runtime"), AUGNES_RUNTIME_LOG_DIR: path.join(temporary, "logs"),
        AUGNES_UI_PREFERRED_PORT: "43100", AUGNES_BRIDGE_PREFERRED_PORT: "43101", AUGNES_REVIEW_CONNECTIONS_FILE: f.config,
        AUGNES_CANONICAL_TEST_MODE: "1", AUGNES_CANONICAL_TEMP_ROOT: temporary, AUGNES_CANONICAL_TEST_NODE_IMPORT: f.preload };
    const sdk = createRequire(path.join(root, "apps/augnes_apps/package.json"));
    const { StdioClientTransport } = sdk("@modelcontextprotocol/sdk/client/stdio.js");
    const metadata = { "io.modelcontextprotocol/protocolVersion": "2026-07-28", "io.modelcontextprotocol/clientCapabilities": {} };
    let processRecord: any, transport: any, closed: Promise<void>, runtime: any, connection: any, id = 0, restores = 0, refusals = 0;
    const phase = (name: string) => console.log(JSON.stringify({ test: "review-callback-restore", phase: name, elapsed_ms: Date.now() - started }));
    const withDB = <T>(run: (db: Database.Database) => T) => { const db = new Database(databasePath, { fileMustExist: true }); try { return run(db); } finally { db.close(); } };
    const state = () => withDB(db => createHash("sha256").update(JSON.stringify(db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map((r: any) =>
        [r.name, db.prepare(`SELECT * FROM "${r.name.replaceAll('"', '""')}"`).all()]))).digest("hex"));
    const requests = () => withDB(db => db.prepare("SELECT * FROM vnext_review_requests ORDER BY request_ref").all());
    const receiver = () => existsSync(f.receiverRecords) ? readFileSync(f.receiverRecords, "utf8").trim().split("\n").map(line => JSON.parse(line)) : [];
    async function closeReviewer() {
        if (!transport) return;
        await transport.close(); await closed; transport = null;
    }
    async function startRuntime() {
        const child = spawn(process.execPath, [supervisor, "start"], { cwd: root, env, detached: process.platform !== "win32", stdio: ["ignore", "pipe", "pipe"] });
        processRecord = registerOwnedChild(owned, child, { label: "callback-restore-supervisor" });
        let output = ""; child.stdout.on("data", chunk => { output += chunk; }); child.stderr.on("data", () => {});
        const deadline = Date.now() + 60000;
        while (Date.now() < deadline) {
            const ready = output.split("\n").some(line => { try { const v = JSON.parse(line); return v.command === "start" && v.result === "ready"; } catch { return false; } });
            if (ready) break;
            assert.equal(child.exitCode, null, "supervised recovery fixture exited before readiness");
            await delay(50);
        }
        const found = await discoverVerifiedCompanionV01(env); assert.equal(found.status, "resolved");
        const manifest = JSON.parse(readFileSync(path.join(env.AUGNES_RUNTIME_STATE_DIR!, "runtime.json"), "utf8"));
        assert.equal(found.companion.generation_id, manifest.generation_id);
        assert.equal(found.companion.instance_id, manifest.instance_id);
        if (runtime) assert.notEqual(runtime.generation_id, found.companion.generation_id);
        runtime = found.companion;
    }
    async function stopRuntime() {
        await closeReviewer();
        if (!processRecord) return;
        const stopped = await runCanonicalChild({ suite: "review-callback-restore", label: "stop-supervisor", command: process.execPath,
            args: [supervisor, "stop"], cwd: root, env, timeoutMs: 25000, heartbeatMs: 0, resourceOwner: undefined, log() {}, stdout: { write() { return true; } } as any });
        assert.equal(canonicalChildAcceptanceFailure(stopped, { suite: "review-callback-restore", timeoutMs: 25000, requireNaturalExit: true }), null);
        await waitForOwnedProcessExit(processRecord, 20000);
        assert.equal(processRecord.child.exitCode, 0);
        processRecord = null;
    }
    async function rpc(method: string, params: object = {}) {
        if (!transport) {
            transport = new StdioClientTransport({ command: process.execPath, args: [path.join(root, "plugins/augnes-operator/mcp/request-bound-review.mjs")],
                cwd: root, env: { ...env, AUGNES_REVIEW_CONNECTION_ID: connection.id }, stderr: "pipe" });
            closed = new Promise(resolve => { transport.onclose = resolve; });
            await transport.start(); transport.stderr?.on("data", () => {});
        }
        return new Promise<any>((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error("restore_reviewer_timeout")), 10000);
            transport.onmessage = (result: any) => { clearTimeout(timer); resolve(result); };
            transport.onerror = () => { clearTimeout(timer); reject(new Error("restore_reviewer_transport_failed")); };
            transport.send({ jsonrpc: "2.0", id: ++id, method, params: { ...params, _meta: metadata } }).catch(() => {
                clearTimeout(timer); reject(new Error("restore_reviewer_send_failed"));
            });
        });
    }
    const call = async (name: string, args: object) => {
        const r: any = await handleMessageV01({ jsonrpc: "2.0", id: ++id, method: "tools/call", params: { name, arguments: args } });
        assert(!r.error && !r.result?.isError, "origin operation refused"); return r.result.structuredContent;
    };
    const origin = (args: object) => call("augnes_review_repository_work", args);
    const tool = async (name: string, args: object) => { const r = await rpc("tools/call", { name, arguments: args }); assert(!r.error); return r.result.structuredContent; };
    function decisionFile(label: string, decision: object) {
        const file = path.join(f.directory, `${label}.json`); writeFileSync(file, JSON.stringify(decision), { mode: 0o600 }); return file;
    }
    function cli(operation: string, file?: string) {
        // Each invocation performs fresh authenticated discovery against the actual
        // current supervisor. No retained runtime headers can mask decision replay.
        const r = spawnSync(process.execPath, [path.join(root, "scripts/configure-review-connection.mjs"), "callbacks", operation, connection.id, ...(file ? [file] : [])],
            { cwd: root, env, encoding: "utf8", timeout: 15000 });
        assert(!r.error, "callback CLI process failed");
        assert(r.stdout.trim(), "callback CLI must return a classified outcome");
        return { code: r.status, value: JSON.parse(r.stdout) };
    }
    function inspect() { const r = cli("inspect"); assert.equal(r.code, 0); assert.equal(r.value.observation, "observed"); return r.value; }
    function decision(view = inspect(), approve = true) {
        const c = view.candidates[0];
        assert.match(view.policy_generation, /^[a-f0-9]{32}$/);
        return { candidate_ref: c.candidate_ref, expected_revision: c.revision, expected_policy_revision: view.policy_revision,
            expected_policy_generation: view.policy_generation,
            ...(approve ? { expires_at: new Date(Date.now() + 600000).toISOString() } : {}) };
    }
    function assertRefused(operation: string, file: string, reason: string) {
        const before = state(), network = receiver(), bytes = readFileSync(file);
        const r = cli(operation, file); assert.equal(r.code, 1, `${operation}: stale decision became admissible`);
        assert.equal(r.value.reason, reason, "a stale runtime/auth error must not mask the decision-generation refusal");
        assert.equal(state(), before); assert.deepEqual(receiver(), network); assert.deepEqual(readFileSync(file), bytes); refusals++;
    }
    try {
        mkdirSync(env.HOME!, { mode: 0o700 });
        const db = new Database(databasePath); try { applyCanonicalDatabaseMigrations(db); } finally { db.close(); }
        for (const key of Object.keys(process.env)) if (key.startsWith("AUGNES_") || /KEY|TOKEN|PROXY|SECRET/.test(key)) delete process.env[key];
        Object.assign(process.env, env);
        mkdirSync(f.projectRoot, { mode: 0o700 });
        execFileSync("git", ["init", "--quiet", f.projectRoot], { env });
        execFileSync("git", ["-C", f.projectRoot, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "-c", "commit.gpgsign=false", "commit", "--allow-empty", "--quiet", "-m", "Synthetic recovery fixture"], { env });
        const selection = await declareAndInspectLocalProjectV01(f.projectRoot, { open_database: () => new Database(databasePath, { fileMustExist: true }) });
        const onboardingDB = new Database(databasePath, { fileMustExist: true });
        try { assert.equal((await confirmLocalProjectOnboardingV01(onboardingDB, { selection_token: selection.selection_token, inspection_fingerprint: selection.inspection.inspection_fingerprint, selection_origin: "declared_path", display_name: "Callback recovery fixture" })).status, "created"); }
        finally { onboardingDB.close(); }
        await startRuntime();
        const resumed = await call("augnes_resume_repository", { repositoryRoot: f.projectRoot });
        const args = { repositoryRoot: f.projectRoot, expectedSnapshotBinding: resumed.continuity.snapshot.binding,
            changes: { goal: "Retain every synthetic row.", success_criteria: ["No original rows are removed."], non_goals: ["No execution or provider."] } };
        const preview = await call("augnes_preview_repository_initial_work", args);
        assert.equal((await call("augnes_define_repository_initial_work", { ...args, previewBinding: preview.preview_binding })).status, "saved");
        const setup = decisionFile("setup", { repository_root: f.projectRoot, project_key: resumed.repository_resolution.project_key,
            destination: "synthetic recovery receiver", reviewer_label: "scripted fixture; no model", expires_at: new Date(Date.now() + 1800000).toISOString(), callback_origins: [], callback_enrollment: true });
        execFileSync(process.execPath, [path.join(root, "scripts/configure-review-connection.mjs"), setup, f.config], { env, stdio: "pipe" });
        connection = JSON.parse(readFileSync(f.config, "utf8")).connections[0];
        const configBytes = readFileSync(f.config);
        const requested = await origin({ action: "request", connection_ref: connection.id, expected_material_ref: (await origin({ action: "inspect", connection_ref: connection.id })).material_ref, question: "Should every synthetic row remain?" });
        const read = await tool("augnes_read_review_request", { request_ref: requested.request_ref });
        assert.equal((await tool("augnes_reply_to_review", { request_ref: requested.request_ref, read_binding: read.read_binding, answer: "Retain all rows.", limitations: "Synthetic fixture, not model evidence.", source_refs: read.sources.map((s: any) => s.source_binding) })).status, "saved");
        const subscription = { name: "review.requested", arguments: {}, delivery: { mode: "webhook", url: "https://receiver.example.invalid/before", secret: receiverSecret } };
        assert.equal((await rpc("events/subscribe", subscription)).error.data.reason, "approval_required");
        assert.deepEqual(receiver(), []);
        const initial = inspect(); assert.equal(initial.policy_revision, 1); assert.equal(initial.candidates[0].revision, 1);
        assert.equal(cli("approve", decisionFile("initial", decision(initial))).code, 0);
        assert.equal(inspect().candidates[0].revision, 2);
        assert((await rpc("events/subscribe", subscription)).result.id);
        assert((await rpc("events/subscribe", subscription)).result.id);
        assert.equal(receiver().filter(r => r.stage === "verification").length, 1, "ordinary refresh reuses current generation cache");
        const originalNetwork = receiver();
        const approval = () => withDB(db => {
            const c = readReviewConnections()[0];
            const row = db.prepare("SELECT callback_envelope FROM vnext_review_subscriptions WHERE stopped=0").get() as any;
            return readReviewCallback(c, row.callback_envelope).approval;
        });
        assert.equal(approval().policy_generation, initial.policy_generation);
        const savedRequests = requests();
        const lifecycle = { databasePath, backupDirectory: path.join(temporary, "backups"), repositoryRoot: root, instanceId: runtime.instance_id, repositoryFingerprint: runtime.repository_fingerprint, databaseOverrideActive: true };
        const backup = await createRecoveryBackup({ databasePath, backupDirectory: lifecycle.backupDirectory, applicationScopeFingerprint: runtime.repository_fingerprint,
            sourceApplication: { application_version: null, build_identity: null, package_contract: null, package_contract_version: null, runtime_contract: null, runtime_schema_version: null }, reason: "manual_recovery", inspectDatabase: inspectRecoveryDatabaseFile } as any);
        phase("approved_snapshot_saved");
        const stopView = inspect();
        assert.equal(cli("stop", decisionFile("stop", { expected_policy_revision: stopView.policy_revision, expected_policy_generation: stopView.policy_generation })).code, 0);
        const stopped = inspect(); assert.equal(stopped.policy_revision, 2); assert.equal(stopped.candidates[0].revision, 3);
        const consumed = decisionFile("consumed", decision(stopped));
        const pending = decisionFile("prepared_unconsumed", { ...decision(stopped), expires_at: new Date(Date.now() + 590000).toISOString() });
        assert.notDeepEqual(readFileSync(pending), readFileSync(consumed), "the unconsumed decision is distinct from D");
        assert.equal(cli("approve", consumed).code, 0); assert.equal(inspect().candidates[0].revision, 4);
        assert.equal(cli("revoke", decisionFile("revoke", decision(inspect(), false))).code, 0);
        assert.equal(inspect().candidates[0].revision, 5);
        const restore = async () => {
            await stopRuntime();
            await restoreRuntimeDatabase({ ...lifecycle, instanceId: runtime.instance_id, selectedBackupId: backup.manifest.backup_id } as any);
            await startRuntime(); restores++;
            assert.deepEqual(requests(), savedRequests);
            assert.deepEqual(readFileSync(f.config), configBytes);
            const fresh = inspect(); assert.equal(fresh.stopped, true); assert.equal(fresh.policy_revision, 2); assert.equal(fresh.candidates[0].revision, 3);
            assert.equal(fresh.candidates[0].state, "revoked");
            assert.equal(withDB(db => (db.prepare("SELECT count(*) n FROM vnext_review_subscriptions WHERE stopped=0").get() as any).n), 0);
            phase(`restore_${restores}_fresh_authenticated_inspection`); return fresh;
        };
        const first = await restore();
        assertRefused("approve", consumed, "callback_policy_changed");
        assertRefused("approve", pending, "callback_policy_changed");
        const between = decisionFile("between_restores", decision(first));
        const candidateActions = decisionFile("between_candidate_actions", decision(first, false));
        const stopBetween = decisionFile("between_stop", { expected_policy_revision: first.policy_revision, expected_policy_generation: first.policy_generation });
        const second = await restore();
        assert.notEqual(second.policy_generation, first.policy_generation);
        assertRefused("approve", between, "callback_policy_changed");
        assertRefused("reject", candidateActions, "callback_policy_changed");
        assertRefused("revoke", candidateActions, "callback_policy_changed");
        assertRefused("stop", stopBetween, "callback_policy_changed");
        const betweenConsumed = decisionFile("between_consumed", decision(second));
        assert.equal(cli("approve", betweenConsumed).code, 0);
        assert.equal(cli("revoke", decisionFile("between_revoke", decision(inspect(), false))).code, 0);
        const third = await restore();
        assert.notEqual(third.policy_generation, second.policy_generation); assert.notEqual(third.policy_generation, initial.policy_generation);
        assertRefused("approve", betweenConsumed, "callback_policy_changed");
        assert.deepEqual(receiver(), originalNetwork, "no DNS, callback or application activity during restore or stale decisions");
        assert.equal(cli("approve", decisionFile("fresh_recovery", decision(third))).code, 0);
        subscription.delivery.url = "https://receiver.example.invalid/after-restore?fresh=material";
        subscription.delivery.secret = receiverRecoverySecret;
        assert((await rpc("events/subscribe", subscription)).result.id);
        assert.equal(receiver().filter(r => r.stage === "verification").length, 2, "fresh recovery requires signed verification");
        assert.equal(approval().policy_generation, third.policy_generation);
        const later = await origin({ action: "request", connection_ref: connection.id, expected_material_ref: (await origin({ action: "inspect", connection_ref: connection.id })).material_ref, question: "After recovery, should all rows still remain?" });
        assert.deepEqual(receiver().filter(r => r.stage === "event").map(r => r.request_ref), [later.request_ref]);
        const laterRead = await tool("augnes_read_review_request", { request_ref: later.request_ref });
        assert.equal((await tool("augnes_reply_to_review", { request_ref: later.request_ref, read_binding: laterRead.read_binding, answer: "Still retain all rows.", limitations: "Controlled local fixture.", source_refs: laterRead.sources.map((s: any) => s.source_binding) })).status, "saved");
        const { secret: _secret, ...unsubscribeDelivery } = subscription.delivery;
        assert((await rpc("events/unsubscribe", { ...subscription, delivery: unsubscribeDelivery })).result);
        const back = await origin({ action: "readback", connection_ref: connection.id, request_ref: requested.request_ref });
        assert.equal(back.response.answer, "Retain all rows.");
        assert.equal((await origin({ action: "readback", connection_ref: connection.id, request_ref: later.request_ref })).response.answer, "Still retain all rows.");
        // Upgrade a populated exact predecessor through the supported preparation
        // owner. Old decisions/leases fail closed; native linkage stays intact.
        await stopRuntime();
        const beforeUpgrade = requests();
        withDB(db => {
            db.exec("ALTER TABLE vnext_review_callback_policies DROP COLUMN generation");
            assert.equal(structuralSchemaContractSignature(db), "579d73c1aa80fec79b567854b2857b7d099b1a2637c5172aa2cfc26a19df72c9");
            assert.throws(() => assertPreparedDatabase(db), e => e instanceof DatabaseAccessError && e.code === "database_unprepared");
            applyCanonicalDatabaseMigrations(db); assertPreparedDatabase(db);
            const p = db.prepare("SELECT * FROM vnext_review_callback_policies").get() as any;
            assert.match(p.generation, /^[a-f0-9]{32}$/); assert.notEqual(p.generation, third.policy_generation); assert.equal(p.stopped, 1);
            assert.equal(p.last_stage, "generation_upgrade_invalidated");
            assert.equal((db.prepare("SELECT count(*) n FROM vnext_review_callback_candidates WHERE state<>'revoked'").get() as any).n, 0);
        });
        assert.deepEqual(requests(), beforeUpgrade);
        assert(!existsSync(f.networkAttempts), "no real external egress or provider request");
        assert.equal(guard.attempts.length, 0);
        phase("consumed_pending_repeated_restore_and_recovery_pass");
    } finally {
        try { await stopRuntime(); } finally {
            await cleanupOwnedProcesses(owned);
            for (const key of Object.keys(process.env)) if (!(key in savedEnv)) delete process.env[key];
            Object.assign(process.env, savedEnv); guard.restore(); rmSync(temporary, { recursive: true, force: true });
            phase("cleanup_complete");
        }
    }
    console.log(JSON.stringify({ test: "review-callback-restore", status: "pass", restores, stale_decisions_refused: refusals, real_provider: "NOT_RUN" }));
}
void testReviewCallbackRestore();
