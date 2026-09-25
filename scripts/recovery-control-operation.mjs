import { createHash, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { constants, closeSync, existsSync, fstatSync, fsyncSync, lstatSync, mkdirSync, openSync, readSync, readdirSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readProcessBirthIdentity } from "./local-process-ownership.mjs";
import { buildRuntimeChildEnvironment } from "./runtime-child-environment.mjs";
import { readVerifiedRecoveryWorkerSource } from "./distributable-package-launcher.mjs";
export const RECOVERY_REQUEST_CONTRACT = "augnes.recovery-requests.v1";
export const RECOVERY_REQUEST_FILE = "augnes-recovery-requests.json";
// Separate from the unchanged 5s HTTP deadline. The incident's complete
// creation span was 34.672s; 120s is a finite execution budget, not a speed claim.
export const RECOVERY_WORKER_DEADLINE_MS = 120000;
const MAX_REQUESTS = 64; // No automatic eviction: unknown history cannot replay.
const MAX_BYTES = 256 * 1024;
const NON_ADMISSION_REASONS = ["recovery_action_in_progress", "recovery_backup_changed"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const SHA = /^sha256:[a-f0-9]{64}$/u;
const BACKUP = /^augnes-recovery-\d{8}T\d{6}-[0-9a-f]{8}\.backup$/u;
const workerEntry = fileURLToPath(new URL("./recovery-control-worker.mjs", import.meta.url));
// Fixed trusted trampoline. Packaged JavaScript arrives as already-verified
// bytes on stdin, never through a second mutable-path import.
// Clear the public CLI argv before evaluating bundled launcher helpers: the
// private IPC worker must never enter the launcher's ordinary Start command.
const packagedBootstrap = 'const {Module}=require("node:module");const filename=process.argv[1];process.argv.splice(1);const m=new Module(filename);m.filename=filename;m.paths=Module._nodeModulePaths(require("node:path").dirname(filename));m._compile(require("node:fs").readFileSync(0,"utf8"),filename);';
const fail = code => { throw Object.assign(new Error(code), { code }); };
const hash = value => `sha256:${createHash("sha256").update(JSON.stringify(value)).digest("hex")}`;
const exact = (value, keys) => value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join("|") === [...keys].sort().join("|");
const stamp = () => new Date().toISOString();
const validDate = value => typeof value === "string" && value.length <= 32 && Number.isFinite(Date.parse(value));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function identity(file, directory = false) {
    const s = lstatSync(file, { bigint: true });
    if (s.isSymbolicLink() || (directory ? !s.isDirectory() : !s.isFile() || s.nlink !== 1n) ||
        (process.platform !== "win32" && ((s.mode & 63n) !== 0n || (process.getuid && s.uid !== BigInt(process.getuid())))))
        fail("recovery_metadata_unsafe");
    return { dev: String(s.dev), ino: String(s.ino), size: String(s.size), mtime: String(s.mtimeNs), ctime: String(s.ctimeNs) };
}
function readJson(file) {
    const before = identity(file);
    if (BigInt(before.size) > BigInt(MAX_BYTES))
        fail("recovery_metadata_oversized");
    const fd = openSync(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0) | (constants.O_NONBLOCK ?? 0));
    try {
        const s = fstatSync(fd);
        if (String(s.ino) !== before.ino || String(s.dev) !== before.dev)
            fail("recovery_metadata_changed");
        const bytes = Buffer.alloc(Number(before.size) + 1);
        const count = readSync(fd, bytes, 0, bytes.length, 0);
        if (count !== Number(before.size) || !same(identity(file), before))
            fail("recovery_metadata_changed");
        return JSON.parse(bytes.subarray(0, count).toString("utf8"));
    }
    finally {
        closeSync(fd);
    }
}
function writeJson(file, value, expected = null) {
    const bytes = JSON.stringify(value) + "\n";
    if (Buffer.byteLength(bytes) > MAX_BYTES)
        fail("recovery_metadata_oversized");
    const temporary = expected === null ? file : `${file}.write-${process.pid}-${randomUUID()}`;
    const fd = openSync(temporary, "wx", 0o600);
    const owned = fstatSync(fd);
    try {
        writeFileSync(fd, bytes);
        fsyncSync(fd);
        if (expected !== null) {
            if (!same(identity(file), expected))
                fail("recovery_request_history_changed");
            renameSync(temporary, file);
        }
        const parent = openSync(path.dirname(file), "r");
        try {
            fsyncSync(parent);
        }
        finally {
            closeSync(parent);
        }
    }
    finally {
        closeSync(fd);
        // Only this writer's residue, never a status-read cleanup or another file.
        if (expected !== null) {
            const remaining = lstatSync(temporary, { throwIfNoEntry: false });
            if (remaining?.dev === owned.dev && remaining?.ino === owned.ino)
                unlinkSync(temporary);
        }
    }
    return identity(file);
}
export function normalizeRecoveryRequest(value) {
    const base = ["action", "request_id", "admission_binding"];
    const verify = value?.action === "verify_backup";
    if (!exact(value, verify ? [...base, "backup_id", "backup_identity", "target_binding"] : base) ||
        !["create_backup", "verify_backup"].includes(value.action) || !UUID.test(value.request_id) || !UUID.test(value.admission_binding) ||
        (verify && (!/^recovery:[0-9a-f-]{36}$/iu.test(value.backup_id ?? "") || !SHA.test(value.backup_identity) || !SHA.test(value.target_binding))))
        fail("recovery_request_invalid");
    return { action: value.action, request_id: value.request_id, admission_binding: value.admission_binding,
        ...(verify ? { backup_id: value.backup_id, backup_identity: value.backup_identity, target_binding: value.target_binding } : {}) };
}
export function readRecoveryRequestHistory(backupDirectory, scope) {
    const value = readJson(path.join(backupDirectory, RECOVERY_REQUEST_FILE));
    if (!exact(value, ["contract", "schema_version", "scope", "epoch", "requests"]) || value.contract !== RECOVERY_REQUEST_CONTRACT || value.schema_version !== 1 || value.scope !== scope || !UUID.test(value.epoch) || !Array.isArray(value.requests) || value.requests.length > MAX_REQUESTS)
        fail("recovery_request_history_unavailable");
    const ids = new Set();
    for (const row of value.requests) {
        normalizeRecoveryRequest(row.request);
        if (!exact(row, ["request", "fingerprint", "state", "accepted_at", "finished_at", "generation", "worker", "result", "reason"]) || ids.has(row.request.request_id) ||
            row.fingerprint !== hash([scope, row.request]) || row.request.admission_binding !== value.epoch ||
            !["accepted", "running", "completed", "failed", "interrupted", "unknown", "not_admitted"].includes(row.state) || typeof row.generation !== "string" || row.generation.length > 100 ||
            (row.state === "not_admitted" ? row.accepted_at !== null || row.worker !== null || !NON_ADMISSION_REASONS.includes(row.reason) : !validDate(row.accepted_at)) ||
            (row.finished_at !== null && !validDate(row.finished_at)) ||
            (row.reason !== null && !/^[a-z][a-z0-9_]{0,100}$/u.test(row.reason)) ||
            (row.worker !== null && (!exact(row.worker, ["pid", "birth"]) || !Number.isSafeInteger(row.worker.pid) || row.worker.pid < 1 || !/^[a-f0-9]{64}$/u.test(row.worker.birth))))
            fail("recovery_request_history_unavailable");
        if (row.result !== null) {
            validateTerminalResult(row.result);
            assertRequestResult(row.request, row.result);
        }
        if ((row.state === "completed") !== (row.result !== null) ||
            (["accepted", "running"].includes(row.state) !== (row.finished_at === null)) ||
            (row.result && row.result.creation_completed !== (row.request.action === "create_backup")))
            fail("recovery_request_history_unavailable");
        ids.add(row.request.request_id);
    }
    return value;
}
// Metadata only: no database open, payload hashing, reconciliation or cleanup.
// Same inventory bounds as the complete backup owner; bad metadata is unselectable.
export function readRecoveryBackupCatalog(backupDirectory, scope) {
    if (!existsSync(backupDirectory))
        return [];
    identity(backupDirectory, true);
    const names = readdirSync(backupDirectory).sort();
    const candidates = names.filter(n => BACKUP.test(n));
    if (names.length > 1000 || candidates.length > 12)
        fail("recovery_backup_inventory_too_large");
    const rows = [];
    for (const name of candidates) {
        try {
            const root = path.join(backupDirectory, name);
            const directory = identity(root, true), state = identity(path.join(root, "state"), true);
            const manifestPath = path.join(root, "recovery-manifest.json");
            const manifest = readJson(manifestPath);
            if (manifest.contract !== "augnes.recovery-backup.v1" || manifest.contract_version !== 1 || manifest.application_scope_fingerprint !== scope || !/^recovery:[0-9a-f-]{36}$/iu.test(manifest.backup_id) || !SHA.test(manifest.backup_identity) || !validDate(manifest.created_at) ||
                !/^[a-z_]{1,64}$/u.test(manifest.reason) || (manifest.source_application.application_version !== null && !/^[0-9A-Za-z][0-9A-Za-z.+_-]{0,79}$/u.test(manifest.source_application.application_version)))
                continue;
            const identities = { directory, state, manifest: identity(manifestPath), payload: identity(path.join(root, "state", "augnes.db")) };
            const targetBinding = hash([manifest, identities]);
            rows.push({ name, identities, manifest, target_binding: targetBinding, public: {
                    backup_id: manifest.backup_id, backup_identity: manifest.backup_identity, target_binding: targetBinding,
                    label: `Recovery point ${manifest.created_at}`, created_at: manifest.created_at, reason: manifest.reason,
                    source_application_version: manifest.source_application.application_version ?? "unknown", verified: false,
                } });
        }
        catch { /* Malformed metadata never becomes a usable target. */ }
    }
    if (new Set(rows.map(r => r.manifest.backup_id)).size !== rows.length || new Set(rows.map(r => r.manifest.backup_identity)).size !== rows.length)
        fail("recovery_backup_duplicate");
    return rows.sort((a, b) => b.manifest.created_at.localeCompare(a.manifest.created_at));
}
export function exactRecoveryTarget(backupDirectory, scope, request) {
    const matches = readRecoveryBackupCatalog(backupDirectory, scope).filter(r => r.manifest.backup_id === request.backup_id && r.manifest.backup_identity === request.backup_identity && r.target_binding === request.target_binding);
    if (matches.length !== 1)
        fail("recovery_backup_changed");
    return matches[0];
}
export function validateTerminalResult(value) {
    if (!exact(value, ["backup_id", "backup_identity", "target_binding", "verified_at", "validator_contract", "application_version", "build_identity", "runtime_contract", "runtime_schema_version", "creation_completed"]) ||
        !/^recovery:[0-9a-f-]{36}$/iu.test(value.backup_id) || !SHA.test(value.backup_identity) || !SHA.test(value.target_binding) || !validDate(value.verified_at) ||
        value.validator_contract !== "augnes.recovery-backup.v1" || !/^[0-9A-Za-z][0-9A-Za-z.+_-]{0,79}$/u.test(value.application_version) ||
        (value.build_identity !== null && !SHA.test(value.build_identity)) || value.runtime_contract !== "augnes-local-runtime-supervisor-v1" || value.runtime_schema_version !== 2 || typeof value.creation_completed !== "boolean")
        fail("recovery_worker_result_invalid");
    return value;
}
function assertRequestResult(request, result) {
    if (request.action === "verify_backup") {
        if (["backup_id", "backup_identity", "target_binding"].some(key => request[key] !== result[key]))
            fail("recovery_worker_target_mismatch");
    }
    else if (result.backup_id !== `recovery:${request.request_id}`)
        fail("recovery_worker_target_mismatch");
}
export function recoveryRequestProjection(history, requestId, generation, backupDirectory) {
    if (!requestId)
        return null;
    if (!UUID.test(requestId))
        fail("recovery_request_invalid");
    const row = history.requests.find(r => r.request.request_id === requestId);
    if (!row)
        return { request_id: requestId, state: "unknown", reason: "recovery_request_history_unknown", result: null };
    if (row.state === "not_admitted")
        return { request_id: requestId, state: row.state, reason: row.reason, result: null, action: row.request.action,
            accepted_at: null, finished_at: row.finished_at, request: row.request, observation_boundary: "request_not_admitted" };
    let state = row.state, reason = row.reason;
    if (["accepted", "running"].includes(state) && row.generation !== generation) {
        state = "interrupted";
        reason = "recovery_supervisor_interrupted";
    }
    if (state === "completed") {
        try {
            exactRecoveryTarget(backupDirectory, history.scope, row.result);
        }
        catch {
            state = "stale";
            reason = "recovery_backup_changed";
        }
    }
    return { request_id: requestId, state, reason, result: row.result, action: row.request.action, accepted_at: row.accepted_at, finished_at: row.finished_at,
        observation_boundary: "exact_operation_validation_not_perpetual_freshness" };
}
function processGroupAbsent(worker) {
    const birth = readProcessBirthIdentity(worker.pid);
    if (birth.state === "unavailable" || (birth.state === "present" && birth.identity === worker.birth))
        return false;
    if (process.platform === "win32")
        return birth.state === "missing";
    // A dead leader does not establish settlement of its descendants. Never kill
    // a group recovered only from metadata; an ambiguous group blocks startup.
    try {
        process.kill(-worker.pid, 0);
        return false;
    }
    catch (error) {
        return error.code === "ESRCH";
    }
}
export function createRecoveryRequestController({ backupDirectory, databasePath, scope, sourceApplication, validatorApplication = sourceApplication, generation, environment, stopOwnedChild, distribution = null, protectedBackupIds = () => [], onCompleted = () => { }, testScenario = null, testDeadlineMs = null }) {
    // Existing histories are recovered under startup ownership. A status-only
    // runtime with no history allocates nothing: first admission atomically
    // persists its epoch and accepted request together before dispatch.
    let root = existsSync(backupDirectory) ? identity(backupDirectory, true) : null;
    const file = path.join(backupDirectory, RECOVERY_REQUEST_FILE);
    let fileIdentity = existsSync(file) ? identity(file) : null;
    const initial = { contract: RECOVERY_REQUEST_CONTRACT, schema_version: 1, scope, epoch: randomUUID(), requests: [] };
    let history = fileIdentity ? readRecoveryRequestHistory(backupDirectory, scope) : initial;
    let active = null, blocked = false;
    const testing = environment.AUGNES_CANONICAL_TEST_MODE === "1" && typeof environment.AUGNES_CANONICAL_TEMP_ROOT === "string" && backupDirectory.startsWith(environment.AUGNES_CANONICAL_TEMP_ROOT + path.sep);
    const save = value => {
        if (!root) {
            mkdirSync(backupDirectory, { recursive: true, mode: 0o700 });
            root = identity(backupDirectory, true);
        }
        const currentRoot = identity(backupDirectory, true);
        if (currentRoot.dev !== root.dev || currentRoot.ino !== root.ino)
            fail("recovery_metadata_changed");
        fileIdentity = writeJson(file, value, fileIdentity);
    };
    const read = () => {
        if (fileIdentity === null) {
            if (existsSync(file))
                fail("recovery_request_history_changed");
            return structuredClone(initial);
        }
        if (!same(identity(file), fileIdentity))
            fail("recovery_request_history_changed");
        return readRecoveryRequestHistory(backupDirectory, scope);
    };
    for (const row of history.requests.filter(r => ["accepted", "running", "unknown"].includes(r.state))) {
        if (row.worker && !processGroupAbsent(row.worker))
            fail("recovery_worker_ownership_unsettled");
        if (row.state === "unknown")
            continue;
        row.state = "interrupted";
        row.reason = "recovery_supervisor_interrupted";
        row.finished_at = stamp();
        save(history);
    }
    function unresolved() { return blocked || active !== null || existsSync(path.join(backupDirectory, "augnes-recovery-backup-operation.json")); }
    function status(requestId = null) {
        const h = read();
        const operation = recoveryRequestProjection(h, requestId, generation, backupDirectory);
        if (blocked && operation && ["accepted", "running"].includes(operation.state)) {
            operation.state = "unknown";
            operation.reason = "recovery_result_recording_unknown";
        }
        return { admission_binding: h.epoch, capacity_available: h.requests.length < MAX_REQUESTS, operation, busy: unresolved() };
    }
    function updateRow(id, change) {
        const h = read(), row = h.requests.find(r => r.request.request_id === id);
        if (!row)
            fail("recovery_request_history_unknown");
        change(row);
        save(h);
    }
    function launch(input, row = null) {
        const verified = distribution ? readVerifiedRecoveryWorkerSource({ packageRoot: path.resolve(path.dirname(workerEntry), ".."), buildIdentity: distribution.build_identity }) : null;
        const child = spawn(process.execPath, verified ? ["-e", packagedBootstrap, verified.filename] : [workerEntry], {
            env: buildRuntimeChildEnvironment({ role: "recovery", ambientEnvironment: environment }),
            detached: process.platform !== "win32", stdio: [verified ? "pipe" : "ignore", "ignore", "ignore", "ipc"], windowsHide: true,
        });
        let resolveClosed, resolveDone;
        const record = { child, pid: child.pid ?? null, exit: null, expectedExit: false, finishing: null, settled: false,
            closed: new Promise(resolve => { resolveClosed = resolve; }), done: new Promise(resolve => { resolveDone = resolve; }) };
        active = record;
        let message = null, messages = 0;
        const deadline = testing && testDeadlineMs ? Math.min(testDeadlineMs, RECOVERY_WORKER_DEADLINE_MS) : RECOVERY_WORKER_DEADLINE_MS;
        const finish = (code, reason = null) => {
            if (record.finishing)
                return record.finishing;
            record.finishing = (async () => {
                clearTimeout(record.timer);
                let result = null, failure = reason;
                try {
                    await stopOwnedChild(record);
                    await record.closed;
                    record.settled = true;
                    if (!failure && code === 0 && messages === 1) {
                        if (row) {
                            if (!exact(message, ["request_id", "fingerprint", "result"]) || message.request_id !== row.request.request_id || message.fingerprint !== row.fingerprint)
                                fail("recovery_worker_result_invalid");
                            validateTerminalResult(message.result);
                            assertRequestResult(row.request, message.result);
                            if (message.result.creation_completed !== (row.request.action === "create_backup"))
                                fail("recovery_worker_result_invalid");
                            exactRecoveryTarget(backupDirectory, scope, message.result);
                            result = message.result;
                        }
                        else if (!exact(message, ["package_verified"]) || message.package_verified !== true)
                            fail("recovery_worker_result_invalid");
                    }
                    else {
                        const validFailure = messages === 1 && (row
                            ? exact(message, ["request_id", "fingerprint", "failure_code"]) && message.request_id === row.request.request_id && message.fingerprint === row.fingerprint
                            : exact(message, ["failure_code"]));
                        failure ??= validFailure && /^(?:recovery|restore|package|database)_[a-z0-9_]{1,90}$/u.test(message.failure_code)
                            ? message.failure_code : "recovery_worker_output_unavailable";
                    }
                }
                catch (error) {
                    failure = /^recovery_[a-z_]+$/u.test(error.code ?? "") ? error.code : "recovery_worker_cleanup_unconfirmed";
                    if (!record.settled)
                        blocked = true;
                }
                if (row) {
                    try {
                        updateRow(row.request.request_id, current => {
                            current.result = failure ? null : result;
                            current.state = failure ? (failure === "recovery_supervisor_interrupted" ? "interrupted" : record.settled ? "failed" : "unknown") : "completed";
                            current.reason = failure;
                            current.finished_at = stamp();
                        });
                        if (!failure)
                            onCompleted(result);
                    }
                    catch {
                        blocked = true;
                        failure = "recovery_result_recording_unknown";
                    }
                }
                if (record.settled)
                    active = null;
                resolveDone({ failure, result });
            })();
            return record.finishing;
        };
        record.finish = finish;
        child.on("message", value => {
            if (testing && exact(value, ["test_phase"]) && value.test_phase === "holding") {
                record.testHolding = true;
                return;
            }
            messages += 1;
            if (Buffer.byteLength(JSON.stringify(value)) <= 16 * 1024)
                message = value;
        });
        child.once("close", (code, signal) => { record.exit = { code, signal }; resolveClosed(); void finish(code); });
        child.once("error", () => { void finish(1, "recovery_worker_spawn_failed"); });
        child.stdin?.once("error", () => { void finish(1, "recovery_worker_dispatch_unknown"); });
        record.timer = setTimeout(() => void finish(1, "recovery_worker_deadline_exceeded"), deadline);
        const birth = readProcessBirthIdentity(child.pid);
        if (birth.state !== "present")
            void finish(1, "recovery_worker_identity_unavailable");
        else {
            try {
                if (row)
                    updateRow(row.request.request_id, current => { current.worker = { pid: child.pid, birth: birth.identity }; current.state = "running"; });
                if (verified) child.stdin.end(verified.source);
                child.send({ ...input, databasePath, backupDirectory, scope, sourceApplication, validatorApplication, distribution,
                    protectedBackupIds: protectedBackupIds(), deadline, scenario: testing ? testScenario : null }, error => { if (error)
                    void finish(1, "recovery_worker_dispatch_unknown"); });
            }
            catch {
                void finish(1, "recovery_worker_dispatch_unknown");
            }
        }
        return record.done;
    }
    const refusalResult = row => ({ accepted: false, outcome: "request_not_admitted", request_id: row.request.request_id,
        reason_code: row.reason, next_action: "refresh_before_new_request" });
    function admit(material, { admissionBlocked = false } = {}) {
        const request = normalizeRecoveryRequest(material), h = read();
        const row = h.requests.find(r => r.request.request_id === request.request_id);
        if (row) {
            if (row.fingerprint !== hash([scope, request]))
                fail("recovery_request_material_conflict");
            if (row.state === "not_admitted")
                return refusalResult(row);
            return { accepted: true, outcome: "operation_recorded", request_id: request.request_id };
        }
        if (request.admission_binding !== h.epoch)
            fail("recovery_request_history_unknown");
        if (blocked)
            fail("recovery_admission_outcome_unknown");
        if (h.requests.length >= MAX_REQUESTS)
            fail("recovery_request_history_full");
        if (request.action === "create_backup" && readRecoveryBackupCatalog(backupDirectory, scope).some(row => row.manifest.backup_id === `recovery:${request.request_id}`))
            fail("recovery_request_identity_conflict");
        // Only a readable current epoch and an absent exact request identity can
        // prove non-admission. Retain that fact before responding, in the same
        // bounded history; an ID conflict or uncertain write never takes this path.
        const refuse = reason => {
            const refused = { request, fingerprint: hash([scope, request]), state: "not_admitted", accepted_at: null,
                finished_at: stamp(), generation, worker: null, result: null, reason };
            h.requests.push(refused);
            try { save(h); }
            catch { blocked = true; fail("recovery_admission_outcome_unknown"); }
            return refusalResult(refused);
        };
        if (admissionBlocked || unresolved())
            return refuse("recovery_action_in_progress");
        let target = null;
        try { target = request.action === "verify_backup" ? exactRecoveryTarget(backupDirectory, scope, request) : null; }
        catch (error) {
            if (error?.code === "recovery_backup_changed") return refuse(error.code);
            throw error;
        }
        const next = { request, fingerprint: hash([scope, request]), state: "accepted", accepted_at: stamp(), finished_at: null, generation, worker: null, result: null, reason: null };
        h.requests.push(next);
        try {
            save(h);
        }
        catch {
            blocked = true;
            fail("recovery_admission_outcome_unknown");
        }
        try {
            void launch({ request, fingerprint: next.fingerprint, targetName: target?.name ?? null }, next);
        }
        catch (error) {
            updateRow(request.request_id, current => { current.state = "failed"; current.finished_at = stamp(); current.reason = error?.code === "package_integrity_failed" ? error.code : "recovery_worker_spawn_failed"; });
        }
        return { accepted: true, outcome: "operation_recorded", request_id: request.request_id };
    }
    return {
        status, admit, busy: unresolved,
        async checkPackage() {
            if (unresolved())
                fail("recovery_action_in_progress");
            if (!distribution)
                return;
            const { failure } = await launch({ check_package: true });
            if (failure)
                fail(failure);
        },
        async stop() {
            if (active) {
                const record = active;
                await record.finish(1, "recovery_supervisor_interrupted");
            }
            if (active || blocked)
                fail("recovery_worker_cleanup_unconfirmed");
        },
        get active() { return active; },
    };
}
