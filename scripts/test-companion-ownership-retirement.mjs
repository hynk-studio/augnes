#!/usr/bin/env node
import assert from "node:assert/strict";
import childProcess, { spawn, spawnSync } from "node:child_process";
import { syncBuiltinESMExports } from "node:module";
import { mock } from "node:test";
import { createHash, randomUUID } from "node:crypto";
import { once } from "node:events";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import * as core from "../plugins/augnes-operator/mcp/companion-service-core.mjs";
import { registerOwnedChild, cleanupOwnedProcesses } from "./test-harness-process-lifecycle.mjs";
const hash = value => createHash("sha256").update(value).digest("hex");
const json = (file, value) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(value) + "\n", { mode: 0o600 }); };
const read = file => JSON.parse(fs.readFileSync(file, "utf8"));
const birth = pid => { const p = spawnSync("/bin/ps", ["-o", "lstart=", "-o", "command=", "-p", String(pid)], { encoding: "utf8", timeout: 1500 }); return p.status === 0 ? hash(`${process.platform}:${pid}:${p.stdout.trim()}`) : null; };
const sources = ["scripts/augnes-companion-service.mjs", "plugins/augnes-operator/mcp/companion-service-core.mjs", "plugins/augnes-operator/mcp/checkout-identity.mjs", "plugins/augnes-operator/mcp/checkout-identity-darwin.py"];
// Real private loopback listeners enforce the generation's child credential.
const childSource = `
import http from 'node:http';
import fs from 'node:fs';
const [role,manifestFile,tokenFile] = process.argv.slice(2);
const handler = ownership => (req,res) => {
 try {
  const m=JSON.parse(fs.readFileSync(manifestFile)), t=JSON.parse(fs.readFileSync(tokenFile));
  const c=m.children.find(c=>c.role===role);
  if(ownership&&req.headers['x-augnes-child-ownership']!==t.child_ownership_token){res.writeHead(403);res.end('{}');return;}
  const common={runtime_instance_id:m.instance_id,runtime_generation_id:m.generation_id,runtime_repository_fingerprint:m.repository_fingerprint};
  const value=ownership?{...m,ownership_verified:true,role,child_root_pid:process.pid,process_pid:process.pid,loopback_port:c.port}:role==='ui'?{...common,ok:true,service:'augnes-ui',status:'ready',recovery_mode:false}:{...common,ok:true,name:'augnes-console',mode:'http',live_core_status:'ready'};
  res.setHeader('content-type','application/json');res.end(JSON.stringify(value));
 }catch{res.writeHead(503);res.end('{}');}
};
const health=http.createServer(handler(false)), ownership=http.createServer(handler(true));
await new Promise(r=>health.listen(0,'127.0.0.1',r));await new Promise(r=>ownership.listen(0,'127.0.0.1',r));
process.send({port:health.address().port,ownership_port:ownership.address().port});
`;
// Initialize the precise erased state, then enter the real exported manager.
// The live supervisor predates that entry and has no retained manager reference.
const managerSource = `
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import {mock} from 'node:test';
import {syncBuiltinESMExports} from 'node:module';
import {pathToFileURL} from 'node:url';
const [root,config,state]=process.argv.slice(2);
const child=spawn(process.execPath,[root+'/scripts/augnes-runtime-supervisor.mjs','start'],{detached:true,stdio:'ignore'});child.unref();
process.send({supervisor_pid:child.pid});
await new Promise(resolve=>process.once('message',resolve));
const rename=fs.renameSync;let announced=false;
mock.method(fs,'renameSync',(a,b)=>{rename(a,b);if(b===state&&!announced&&JSON.parse(fs.readFileSync(b)).reason==='companion_service_foreign_runtime_conflict'){announced=true;process.send({conflict:true});}});
syncBuiltinESMExports();
const core=await import(pathToFileURL(root+'/plugins/augnes-operator/mcp/companion-service-core.mjs'));
process.exitCode=await core.runCompanionServiceManager({configurationPath:config});
process.disconnect();
`;
async function fixture({ laterAttemptExit = false } = {}) {
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ag-recovery-"))), repositoryRoot = path.join(root, "source"), home = path.join(root, "home");
    const owned = new Set();
    let supervisor = null, loaded = true, effects = 0, manager;
    for (const rel of sources) {
        const out = path.join(repositoryRoot, rel);
        fs.mkdirSync(path.dirname(out), { recursive: true });
        fs.copyFileSync(path.join(process.cwd(), rel), out);
    }
    fs.appendFileSync(path.join(repositoryRoot, sources[0]), "\n// Independently bound installed fixture source.\n");
    fs.writeFileSync(path.join(repositoryRoot, "scripts/augnes-runtime-supervisor.mjs"), "setInterval(()=>{},1000);\n");
    fs.writeFileSync(path.join(root, "child.mjs"), childSource);
    fs.writeFileSync(path.join(root, "manager.mjs"), managerSource);
    const environment = { HOME: home, PATH: path.dirname(process.execPath), AUGNES_COMPANION_SERVICE_TEST_MODE: "1", AUGNES_COMPANION_SERVICE_TEST_ROOT: root, AUGNES_COMPANION_SERVICE_TEST_SCOPE: "ownership-retirement" };
    const options = { repositoryRoot, homeDirectory: home, environment, testScope: "ownership-retirement" };
    const layout = core.resolveCompanionServiceLayout(options);
    const configuration = { contract: core.COMPANION_SERVICE_CONTRACT, schema_version: 2, manager_version: 1, service_label: layout.service_label, service_identity: layout.service_identity, repository_root: repositoryRoot, repository_fingerprint: layout.repository.repository_fingerprint, repository_device: layout.repository.device, repository_inode: layout.repository.inode, repository_identity: layout.repository.durable_identity, node_path: process.execPath, node_version: process.version, manager_entry_path: path.join(repositoryRoot, sources[0]), service_source_fingerprint: core.computeServiceSourceFingerprint(repositoryRoot), runtime_state_directory: layout.runtime_directory, runtime_home_directory: home, database_path: path.join(root, "data/augnes.db"), configuration_path: layout.configuration_path, launch_agent_path: layout.launch_agent_path, installed_at: new Date().toISOString(), test_scope: "ownership-retirement", test_root: root };
    const desired = { contract: core.COMPANION_SERVICE_DESIRED_STATE_CONTRACT, schema_version: 1, service_identity: configuration.service_identity, repository_fingerprint: configuration.repository_fingerprint, desired_state: "running", updated_at: new Date().toISOString() };
    json(layout.configuration_path, configuration);
    json(layout.desired_state_path, desired);
    fs.mkdirSync(path.dirname(layout.launch_agent_path), { recursive: true });
    fs.writeFileSync(layout.launch_agent_path, core.buildLaunchAgentPlist(configuration));
    fs.mkdirSync(path.dirname(configuration.database_path));
    fs.writeFileSync(configuration.database_path, "disposable data sentinel — never opened\n");
    const children = [];
    for (const role of ["ui", "bridge"]) {
        const child = spawn(process.execPath, [path.join(root, "child.mjs"), role, layout.runtime_manifest_path, layout.runtime_token_path], { env: environment, stdio: ["ignore", "pipe", "pipe", "ipc"], detached: true });
        registerOwnedChild(owned, child, { label: `recovery-${role}` });
        const [ports] = await once(child, "message");
        children.push({ role, state: "ready", pid: child.pid, ...ports });
    }
    manager = spawn(process.execPath, [path.join(root, "manager.mjs"), repositoryRoot, layout.configuration_path, layout.manager_state_path], { env: environment, stdio: ["ignore", "pipe", "pipe", "ipc"], detached: true });
    registerOwnedChild(owned, manager, { label: "erased-state-manager" });
    manager.stderr.on("data", chunk => process.stderr.write(chunk));
    const [ready] = await once(manager, "message");
    supervisor = { pid: ready.supervisor_pid, identity: birth(ready.supervisor_pid) };
    const generation = { contract: "augnes-local-runtime-supervisor-v1", schema_version: 2, generation_version: 1, generation_id: randomUUID(), instance_id: randomUUID(), repository_fingerprint: configuration.repository_fingerprint };
    const manifest = { ...generation, supervisor_pid: supervisor.pid, lifecycle_state: "ready", database_state: "ready", effective_url: `http://127.0.0.1:${children[0].port}`, ui_port: children[0].port, bridge_port: children[1].port, children };
    json(layout.runtime_manifest_path, manifest);
    json(layout.runtime_lock_path, { ...generation, supervisor_pid: supervisor.pid });
    json(layout.runtime_token_path, { ...generation, token: "t".repeat(32), child_ownership_token: "o".repeat(32) });
    json(layout.runtime_access_path, { ...generation, access_version: "augnes-companion-proxy-access.v0.1", proxy_token: "p".repeat(32) });
    const attempt = core.createCompanionSupervisorAttemptDiagnostics();
    if (laterAttemptExit) core.observeCompanionSupervisorAttemptExit(attempt, 0, null);
    json(layout.manager_state_path, { contract: core.COMPANION_SERVICE_CONTRACT, schema_version: 1, service_identity: configuration.service_identity, repository_fingerprint: configuration.repository_fingerprint, status: "recovery_required", reason: "companion_service_foreign_runtime_conflict", manager_pid: manager.pid, manager_process_identity: birth(manager.pid), supervisor_pid: null, supervisor_process_identity: null, runtime_ownership: null, restart_count: 1, restart_after: null, supervisor_failure_provenance: core.snapshotCompanionSupervisorFailureProvenance({ attempt, failureOrigin: laterAttemptExit ? "managed_child_exit_observed" : "managed_child_identity_lost", restartCount: 1 }), updated_at: new Date().toISOString() });
    const conflict = once(manager, "message");
    manager.send("start");
    assert.equal((await conflict)[0].conflict, true);
    const launchctl = args => {
        if (args[0] === "print")
            return loaded ? { status: 0, stdout: `gui/${process.getuid()}/${configuration.service_label} = {\n path = ${layout.launch_agent_path}\n program = ${configuration.node_path}\n working directory = ${repositoryRoot}\n pid = ${manager.pid}\n arguments = {\n ${configuration.node_path}\n ${configuration.manager_entry_path}\n run\n --config\n ${layout.configuration_path}\n }\n}\n` } : { status: 113, stdout: "" };
        assert.deepEqual(args, ["bootout", `gui/${process.getuid()}/${configuration.service_label}`]);
        effects++;
        loaded = false;
        manager.kill("SIGTERM");
        return { status: 0 };
    };
    const protectedBefore = [layout.configuration_path, layout.launch_agent_path, configuration.database_path].map(file => [file, hash(fs.readFileSync(file))]);
    return { root, layout, configuration, desired, manager, supervisor, options: { ...options, launchctl }, effects: () => effects,
        async cleanup() {
            // Only fixture-owned process identities; never production PIDs/launchd.
            if (supervisor && birth(supervisor.pid) === supervisor.identity) {
                process.kill(-supervisor.pid, "SIGTERM");
            }
            if (manager.exitCode === null && manager.signalCode === null)
                manager.kill("SIGTERM");
            await cleanupOwnedProcesses(owned);
            for (const [file, digest] of protectedBefore)
                assert.equal(hash(fs.readFileSync(file)), digest);
            for (let n = 0; n < 100 && birth(supervisor.pid) !== null; n++)
                await new Promise(r => setTimeout(r, 20));
            assert.equal(birth(supervisor.pid), null);
            assert.equal(owned.size, 0);
            assert(!fs.existsSync(layout.lifecycle_lock_path));
            fs.rmSync(root, { recursive: true });
            assert(!fs.existsSync(root));
        } };
}
async function run(name, action, options) { const f = await fixture(options); try {
    await action(f);
    console.log(JSON.stringify({ scenario: name, pass: true, effects: f.effects() }));
}
finally {
    await f.cleanup();
} }
await run("lost-state-retirement-and-replay", async (f) => {
    const status = await core.inspectCompanionService(f.options);
    assert.equal(status.status, "recovery_required");
    assert.equal(status.start_available, false);
    await assert.rejects(core.startCompanionService(f.options), /manager_ownership_unverifiable/);
    assert.equal(f.effects(), 0);
    const inspect = await core.inspectCompanionOwnershipRecovery(f.options);
    assert.equal(inspect.result, "retirement_available");
    // Executing recovery source and unchanged target source are independently bound.
    assert.notEqual(f.options.repositoryRoot, process.cwd());
    assert.notEqual(inspect.installed_source, inspect.recovery_source);
    const preview = await core.prepareCompanionOwnershipRecovery(f.options);
    const result = await core.applyCompanionOwnershipRecovery({ ...f.options, decision: preview.decision });
    assert.equal(result.result, "settled");
    assert.equal(result.remaining_owned_processes, 0);
    assert.equal(f.effects(), 1);
    assert.equal((await core.inspectCompanionService(f.options)).status, "installed_stopped");
    assert.equal((await core.applyCompanionOwnershipRecovery({ ...f.options, decision: preview.decision })).result, "settled");
    assert.equal(f.effects(), 1);

    // A real, settled retirement remains historical after a mount's device
    // number changes. Only this observation's device is simulated; the durable
    // Darwin identity, persisted evidence and installed configuration are real.
    const recordBytes = fs.readFileSync(f.layout.ownership_recovery_path);
    const configurationBytes = fs.readFileSync(f.layout.configuration_path);
    const record = JSON.parse(recordBytes);
    const renumbered = { ...f.options, testRepositoryPhysicalIdentityOverride: {
        device: String(BigInt(f.layout.repository.device) + 1n),
        inode: f.layout.repository.inode,
    } };
    const inspectWithoutRewrite = async (options = renumbered) => {
        const before = fs.readFileSync(f.layout.ownership_recovery_path);
        const observed = await core.inspectCompanionService(options);
        assert.deepEqual(fs.readFileSync(f.layout.ownership_recovery_path), before);
        assert.equal(f.effects(), 1, "inspection never repeats retirement");
        return observed;
    };
    assert.equal((await inspectWithoutRewrite()).status, "installed_stopped",
        "settled retirement must survive device renumbering with unchanged durable identity");
    assert.equal((await core.inspectCompanionPreservation(renumbered)).state.preservation_valid, true);
    assert.deepEqual(fs.readFileSync(f.layout.ownership_recovery_path), recordBytes);
    const invalid = async () => assert.equal((await inspectWithoutRewrite()).reason, "companion_service_recovery_record_invalid");
    try {
        json(f.layout.ownership_recovery_path, { ...record, status: "retiring" });
        await invalid();
        assert.equal((await inspectWithoutRewrite(f.options)).reason, "companion_service_recovery_incomplete");
        fs.writeFileSync(f.layout.ownership_recovery_path, recordBytes);
        json(f.layout.configuration_path, { ...f.configuration, installed_at: new Date(0).toISOString() });
        assert.equal((await inspectWithoutRewrite(f.options)).status, "installed_stopped");
        assert.equal((await inspectWithoutRewrite()).status, "installed_stopped",
            "a historical record must not invalidate otherwise-valid later configuration");
        json(f.layout.configuration_path, { ...f.configuration, service_source_fingerprint: "0".repeat(64) });
        assert.equal((await inspectWithoutRewrite()).status, "service_update_required", "current source validation remains authoritative");
        json(f.layout.configuration_path, { ...f.configuration, repository_identity: {
            ...f.configuration.repository_identity, volume_uuid: "11111111-1111-1111-1111-111111111111",
        } });
        await invalid();
        fs.writeFileSync(f.layout.configuration_path, configurationBytes);
        for (const change of [
            value => { value.operation_binding = "0".repeat(64); },
            value => { value.evidence.repository_binding = "0".repeat(64); value.operation_binding = hash(JSON.stringify(value.evidence)); },
            value => { value.evidence.material.configuration_path.parent.device = "0"; value.operation_binding = hash(JSON.stringify(value.evidence)); },
            value => { value.service_identity = "0".repeat(64); },
        ]) {
            const changed = structuredClone(record); change(changed);
            json(f.layout.ownership_recovery_path, changed);
            await invalid();
        }
        fs.writeFileSync(f.layout.ownership_recovery_path, recordBytes);
        assert.equal((await inspectWithoutRewrite({ ...renumbered, testRepositoryPhysicalIdentityOverride: {
            ...renumbered.testRepositoryPhysicalIdentityOverride, inode: String(BigInt(f.layout.repository.inode) + 1n),
        } })).reason, "companion_service_recovery_record_invalid", "replacement is not device renumbering");
        // Recovery effects retain their existing same-operation observation
        // and refuse even a test override; status compatibility grants no replay.
        await assert.rejects(core.applyCompanionOwnershipRecovery({ ...renumbered, decision: preview.decision }), /test_override_refused/);
        assert.equal((await inspectWithoutRewrite()).status, "installed_stopped");
    } finally {
        fs.writeFileSync(f.layout.ownership_recovery_path, recordBytes);
        fs.writeFileSync(f.layout.configuration_path, configurationBytes);
    }
    assert.deepEqual(fs.readFileSync(f.layout.ownership_recovery_path), recordBytes);
    assert.deepEqual(fs.readFileSync(f.layout.configuration_path), configurationBytes);
    assert.equal(f.effects(), 1);
});
await run("lost-state-later-attempt-exit-diagnostic", async (f) => {
    const diagnostic = read(f.layout.manager_state_path).supervisor_failure_provenance;
    assert.equal(diagnostic.failure_origin, "managed_child_exit_observed");
    assert.equal(diagnostic.child_exit_status, 0);
    assert.equal(birth(f.supervisor.pid), f.supervisor.identity);
    const preview = await core.prepareCompanionOwnershipRecovery(f.options);
    assert.equal((await core.applyCompanionOwnershipRecovery({ ...f.options, decision: preview.decision })).result, "settled");
    assert.deepEqual(read(f.layout.ownership_recovery_path).evidence.manager.supervisor_failure_provenance, diagnostic);
    assert.equal(f.effects(), 1);
}, { laterAttemptExit: true });
await run("stale-decision-and-maintenance-refusal", async (f) => {
    const preview = await core.prepareCompanionOwnershipRecovery(f.options);
    await assert.rejects(core.applyCompanionOwnershipRecovery({ ...f.options, decision: { ...preview.decision, expires_at: new Date(0).toISOString() } }), /decision_stale/);
    await assert.rejects(core.applyCompanionOwnershipRecovery({ ...f.options, decision: preview.decision, testOwnershipRecoveryStageHook: () => json(f.layout.maintenance_lease_path, { foreign: true }) }), /lifecycle_conflict/);
    assert.equal(f.effects(), 0);
    assert(!fs.existsSync(f.layout.ownership_recovery_path));
    fs.unlinkSync(f.layout.maintenance_lease_path);
});
await run("foreign-runtime-and-configuration-refusal", async (f) => {
    const runtime = read(f.layout.runtime_lock_path);
    json(f.layout.runtime_lock_path, { ...runtime, generation_id: "foreign" });
    await assert.rejects(core.prepareCompanionOwnershipRecovery(f.options));
    json(f.layout.runtime_lock_path, runtime);
    const preview = await core.prepareCompanionOwnershipRecovery(f.options);
    await assert.rejects(core.applyCompanionOwnershipRecovery({ ...f.options, decision: preview.decision, testOwnershipRecoveryStageHook: () => json(f.layout.configuration_path, { ...f.configuration, installed_at: new Date(0).toISOString() }) }));
    assert.equal(f.effects(), 0);
    json(f.layout.configuration_path, f.configuration);
});
await run("unknown-bootout-reconciled-before-resume", async (f) => {
    const preview = await core.prepareCompanionOwnershipRecovery(f.options);
    await assert.rejects(core.applyCompanionOwnershipRecovery({ ...f.options, decision: preview.decision, testOwnershipRecoveryStageHook: stage => { if (stage === "after_bootout")
            throw Error("acknowledgement_lost"); } }), /acknowledgement_lost/);
    // Wait for actual manager settlement, not a guessed fixed delay.
    if (f.manager.exitCode === null && f.manager.signalCode === null)
        await once(f.manager, "exit");
    assert.equal((await core.inspectCompanionOwnershipRecovery(f.options)).result, "incomplete");
    await assert.rejects(core.startCompanionService(f.options), /recovery_incomplete/);
    const resumed = await core.prepareCompanionOwnershipRecovery(f.options);
    assert.equal((await core.applyCompanionOwnershipRecovery({ ...f.options, decision: resumed.decision })).result, "settled");
    assert.equal(f.effects(), 1);
});
await run("unavailable-and-reused-process-witness-refusal", async (f) => {
    const original = childProcess.spawnSync;
    for (const mode of ["unavailable", "conflicting"]) {
        const patch = mock.method(childProcess, "spawnSync", (command, args, options) => {
            if (command === "/bin/ps" && args[1] === "lstart=" && args.at(-1) === String(f.supervisor.pid)) {
                if (mode === "unavailable")
                    return { status: 1, stdout: "" };
                const value = original(command, args, options);
                return { ...value, stdout: value.stdout + " changed identity" };
            }
            return original(command, args, options);
        });
        syncBuiltinESMExports();
        try {
            if (mode === "unavailable")
                await assert.rejects(core.prepareCompanionOwnershipRecovery(f.options), /process_witness_unavailable/);
            else {
                // A changed identity after preparation cannot retire a PID-reused process.
                patch.mock.restore();
                syncBuiltinESMExports();
                const prepared = await core.prepareCompanionOwnershipRecovery(f.options);
                const conflict = mock.method(childProcess, "spawnSync", (command, args, options) => {
                    const value = original(command, args, options);
                    return command === "/bin/ps" && args[1] === "lstart=" && args.at(-1) === String(f.supervisor.pid) ? { ...value, stdout: value.stdout + " changed identity" } : value;
                });
                syncBuiltinESMExports();
                try {
                    await assert.rejects(core.applyCompanionOwnershipRecovery({ ...f.options, decision: prepared.decision }));
                }
                finally {
                    conflict.mock.restore();
                    syncBuiltinESMExports();
                }
            }
        }
        finally {
            patch.mock.restore();
            syncBuiltinESMExports();
        }
        assert.equal(f.effects(), 0);
        assert(!fs.existsSync(f.layout.ownership_recovery_path));
    }
});
await run("interrupted-runtime-retirement", async (f) => {
    const preview = await core.prepareCompanionOwnershipRecovery(f.options);
    await assert.rejects(core.applyCompanionOwnershipRecovery({ ...f.options, decision: preview.decision, testOwnershipRecoveryStageHook: stage => { if (stage === "after_supervisor")
            throw Error("runtime_acknowledgement_lost"); } }), /runtime_acknowledgement_lost/);
    const inspection = await core.inspectCompanionOwnershipRecovery(f.options);
    assert.equal(inspection.result, "incomplete");
    assert.equal(inspection.remaining_owned_processes, 2);
    const next = await core.prepareCompanionOwnershipRecovery(f.options);
    assert.equal((await core.applyCompanionOwnershipRecovery({ ...f.options, decision: next.decision })).result, "settled");
    assert.equal(f.effects(), 1);
});
await run("changed-generation-at-effect-boundary", async (f) => {
    const preview = await core.prepareCompanionOwnershipRecovery(f.options), original = read(f.layout.runtime_manifest_path);
    await assert.rejects(core.applyCompanionOwnershipRecovery({ ...f.options, decision: preview.decision, testOwnershipRecoveryStageHook: () => json(f.layout.runtime_manifest_path, { ...original, generation_id: "foreign-generation" }) }));
    assert.equal(f.effects(), 0);
    assert(!fs.existsSync(f.layout.ownership_recovery_path));
    json(f.layout.runtime_manifest_path, original);
});
console.log("PASS ownership retirement: authenticated loopback witnesses, exact refusal, reconciliation, replay and zero residue");
