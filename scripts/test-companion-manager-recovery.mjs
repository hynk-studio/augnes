import assert from 'node:assert/strict';
import childProcess from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { syncBuiltinESMExports } from 'node:module';
import { mock } from 'node:test';
import { pathToFileURL } from 'node:url';
// The exported production manager runs with disposable real processes/files.
// Only supervisor behavior, HTTP responses and bounded observations are controlled.
const sourceRoot = process.cwd();
const [only] = process.argv.slice(2);
const mode = 'candidate';
const { registerOwnedChild, cleanupOwnedProcesses } = await import(pathToFileURL(path.join(sourceRoot, 'scripts/test-harness-process-lifecycle.mjs')));
const sources = ['scripts/augnes-companion-service.mjs', 'plugins/augnes-operator/mcp/companion-service-core.mjs', 'plugins/augnes-operator/mcp/checkout-identity.mjs', 'plugins/augnes-operator/mcp/checkout-identity-darwin.py'];
const digest = x => createHash('sha256').update(x).digest('hex');
let failed = 0;
for (const scenario of (only ? [only] : ['unavailable-once', 'unavailable-held', 'changed-witness', 'observed-exit', 'permanent-conflict', 'stop-unknown', 'maintenance-unknown', 'shutdown-unknown', 'initial-unavailable', 'adopted-unavailable'])) {
    const record = await exercise(scenario);
    console.log(JSON.stringify(record));
    if (!record.pass)
        failed++;
}
process.exitCode = failed ? 1 : 0;
async function exercise(scenario) {
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'manager-identity-')));
    const repositoryRoot = path.join(root, 'source'), home = path.join(root, 'home');
    const owned = new Set(), events = [], signals = [], launchCommands = [];
    const originalSpawn = childProcess.spawn, originalSpawnSync = childProcess.spawnSync, originalFetch = globalThis.fetch, fsRename = fs.renameSync;
    let supervisor = null, manifest = null, layout = null, configuration = null, desired = null, managerPromise = null;
    let armed = false, injected = 0, unverifiedStates = 0, foreignStates = 0, spawns = 0, complete = false, managerError = null;
    let resolveBarrier;
    const barrier = new Promise(resolve => resolveBarrier = resolve);
    let lastSupervisorObservation = 'present';
    let phase = 'initial', pendingFaults = scenario === 'unavailable-held' ? 3 : 1, stopRequested = false;
    const patches = [];
    const json = (file, value) => { fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 }); fs.writeFileSync(file, JSON.stringify(value) + '\n', { mode: 0o600 }); };
    const readManager = () => JSON.parse(fs.readFileSync(layout.manager_state_path, 'utf8'));
    const birth = pid => { const r = originalSpawnSync('/bin/ps', ['-o', 'lstart=', '-o', 'command=', '-p', String(pid)], { encoding: 'utf8', timeout: 1500, env: { PATH: '/usr/bin:/bin' } }); return r.status === 0 ? digest(process.platform + ':' + pid + ':' + r.stdout.trim()) : null; };
    const idle = role => {
        const child = originalSpawn(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { cwd: root, env: { PATH: path.dirname(process.execPath) }, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
        registerOwnedChild(owned, child, { label: 'manager-fixture-' + role });
        const originalKill = child.kill.bind(child);
        child.kill = (signal) => { signals.push({ role, signal }); return originalKill(signal); };
        return child;
    };
    const finish = () => { if (!complete) {
        complete = true;
        armed = false;
        resolveBarrier();
    } };
    let record = { scenario, mode };
    try {
        for (const rel of sources) {
            const dest = path.join(repositoryRoot, rel);
            fs.mkdirSync(path.dirname(dest), { recursive: true, mode: 0o700 });
            fs.writeFileSync(dest, fs.readFileSync(path.join(sourceRoot, rel)));
        }
        const core = await import(pathToFileURL(path.join(repositoryRoot, sources[1])));
        const environment = { HOME: home, PATH: path.dirname(process.execPath), AUGNES_COMPANION_SERVICE_TEST_MODE: '1', AUGNES_COMPANION_SERVICE_TEST_ROOT: root, AUGNES_COMPANION_SERVICE_TEST_SCOPE: 'identity-regression' };
        const options = { repositoryRoot, homeDirectory: home, environment, testScope: 'identity-regression' };
        layout = core.resolveCompanionServiceLayout(options);
        configuration = { contract: core.COMPANION_SERVICE_CONTRACT, schema_version: 2, manager_version: 1, service_label: layout.service_label, service_identity: layout.service_identity, repository_root: repositoryRoot, repository_fingerprint: layout.repository.repository_fingerprint, repository_device: layout.repository.device, repository_inode: layout.repository.inode, repository_identity: layout.repository.durable_identity, node_path: process.execPath, node_version: process.version, manager_entry_path: path.join(repositoryRoot, sources[0]), service_source_fingerprint: core.computeServiceSourceFingerprint(repositoryRoot), runtime_state_directory: layout.runtime_directory, runtime_home_directory: path.join(root, 'home'), database_path: path.join(root, 'data/augnes.db'), configuration_path: layout.configuration_path, launch_agent_path: layout.launch_agent_path, installed_at: new Date().toISOString(), test_scope: 'identity-regression', test_root: root };
        desired = { contract: core.COMPANION_SERVICE_DESIRED_STATE_CONTRACT, schema_version: 1, service_identity: configuration.service_identity, repository_fingerprint: configuration.repository_fingerprint, desired_state: 'running', updated_at: new Date().toISOString() };
        json(layout.configuration_path, configuration);
        json(layout.desired_state_path, desired);
        fs.mkdirSync(path.dirname(layout.launch_agent_path), { recursive: true, mode: 0o700 });
        fs.writeFileSync(layout.launch_agent_path, core.buildLaunchAgentPlist(configuration), { mode: 0o600 });
        const ui = idle('ui'), bridge = idle('bridge');
        const provisionRuntime = () => {
            const generation = { contract: 'augnes-local-runtime-supervisor-v1', schema_version: 2, generation_version: 1, generation_id: 'fixture-generation-' + spawns, instance_id: 'fixture-instance-' + spawns, repository_fingerprint: configuration.repository_fingerprint };
            manifest = { ...generation, supervisor_pid: supervisor.pid, lifecycle_state: 'ready', database_state: 'ready', effective_url: 'http://127.0.0.1:19001', ui_port: 19001, bridge_port: 19002, children: [{ role: 'ui', state: 'ready', pid: ui.pid, port: 19001, ownership_port: 19003 }, { role: 'bridge', state: 'ready', pid: bridge.pid, port: 19002, ownership_port: 19004 }] };
            json(layout.runtime_manifest_path, manifest);
            json(layout.runtime_token_path, { ...generation, token: 't'.repeat(32), child_ownership_token: 'o'.repeat(32) });
            json(layout.runtime_access_path, { ...generation, access_version: 'augnes-companion-proxy-access.v0.1', proxy_token: 'p'.repeat(32) });
            json(layout.runtime_lock_path, { ...generation, supervisor_pid: supervisor.pid });
        };
        globalThis.fetch = async (input) => {
            const url = new URL(String(input));
            assert.equal(url.hostname, '127.0.0.1');
            let value;
            const common = { runtime_instance_id: manifest.instance_id, runtime_generation_id: manifest.generation_id, runtime_repository_fingerprint: manifest.repository_fingerprint };
            if (url.pathname === '/api/healthz') {
                assert.equal(url.port, '19001');
                value = { ...common, ok: true, service: 'augnes-ui', status: 'ready', recovery_mode: false };
            }
            else if (url.pathname === '/healthz') {
                assert.equal(url.port, '19002');
                value = { ...common, ok: true, name: 'augnes-console', mode: 'http', live_core_status: 'ready' };
            }
            else {
                assert.equal(url.pathname, '/v1/ownership');
                const c = manifest.children.find(x => String(x.ownership_port) === url.port);
                assert(c);
                value = { ...manifest, ownership_verified: true, role: c.role, child_root_pid: c.pid, process_pid: c.pid, loopback_port: c.port };
            }
            return new Response(JSON.stringify(value), { status: 200, headers: { 'content-type': 'application/json' } });
        };
        patches.push(mock.method(childProcess, 'spawn', (command, args) => {
            assert.equal(command, process.execPath);
            assert.deepEqual(args, [path.join(repositoryRoot, 'scripts/augnes-runtime-supervisor.mjs'), 'start']);
            supervisor = idle('supervisor');
            spawns++;
            provisionRuntime();
            if (scenario === 'initial-unavailable') {
                armed = true;
                pendingFaults = Infinity;
            }
            return supervisor;
        }));
        patches.push(mock.method(childProcess, 'spawnSync', (command, args, opts) => {
            if (command === '/bin/launchctl')
                throw Error('real_launchctl_forbidden');
            if (command === '/bin/ps' && args[0] === '-o' && args[1] === 'lstart=' && args.at(-1) === String(supervisor?.pid) && armed && pendingFaults > 0) {
                lastSupervisorObservation = 'unverified';
                injected++;
                pendingFaults--;
                if (scenario !== 'initial-unavailable')
                    armed = false;
                if (['changed-witness', 'permanent-conflict'].includes(scenario)) {
                    const result = originalSpawnSync(command, args, opts);
                    return { ...result, stdout: result.stdout + ' changed-command-witness' };
                }
                return { pid: 0, status: null, signal: null, stdout: '', stderr: '', error: Object.assign(new Error('controlled probe unavailable'), { code: 'ETIMEDOUT' }) };
            }
            const result = originalSpawnSync(command, args, opts);
            if (command === '/bin/ps' && args[1] === 'lstart=' && args.at(-1) === String(supervisor?.pid))
                lastSupervisorObservation = result.status === 0 ? 'present' : 'unverified';
            return result;
        }));
        const originalProcessKill = process.kill.bind(process);
        patches.push(mock.method(process, 'kill', (pid, signal) => {
            if (signal !== 0 && Math.abs(pid) === supervisor?.pid) {
                assert.equal(lastSupervisorObservation, 'present', 'no signal without verified original observation');
                signals.push({ role: 'supervisor-group', signal });
            }
            return originalProcessKill(pid, signal);
        }));
        patches.push(mock.method(fs, 'renameSync', (from, to) => {
            fsRename(from, to);
            if (to !== layout.manager_state_path)
                return;
            const state = readManager();
            events.push({ status: state.status, reason: state.reason, supervisor_pid: state.supervisor_pid, supervisor_process_identity: state.supervisor_process_identity, generation: state.runtime_ownership?.generation_id ?? null, restart_count: state.restart_count, provenance: state.supervisor_failure_provenance });
            if (stopRequested || complete)
                return;
            if (phase === 'injected' && ((scenario === 'stop-unknown' && state.status === 'installed_stopped') || (scenario === 'maintenance-unknown' && state.status === 'maintenance'))) {
                finish();
                return;
            }
            if (state.status === 'live') {
                if (phase === 'initial') {
                    phase = 'injected';
                    if (scenario === 'observed-exit')
                        supervisor.kill('SIGTERM');
                    else
                        armed = true;
                }
                else if (scenario !== 'observed-exit' || spawns === 2)
                    finish();
            }
            else if (state.reason === 'companion_service_supervisor_ownership_unverifiable') {
                unverifiedStates++;
                if (scenario === 'initial-unavailable') {
                    armed = false;
                    pendingFaults = 0;
                    phase = 'injected';
                }
                assert.equal(spawns, 1);
                assert.equal(signals.length, 0);
                assert.equal(state.restart_count, 0);
                if (scenario === 'permanent-conflict' && unverifiedStates === 3) {
                    finish();
                }
                else if (scenario === 'permanent-conflict') {
                    pendingFaults = 1;
                    armed = true;
                }
                else if (scenario === 'shutdown-unknown') {
                    pendingFaults = Infinity;
                    armed = true;
                    if (unverifiedStates === 1) process.emit('SIGTERM');
                }
                else if (scenario === 'stop-unknown' && unverifiedStates === 1) {
                    json(layout.desired_state_path, { ...desired, desired_state: 'stopped' });
                    pendingFaults = 1;
                    armed = true;
                }
                else if (scenario === 'maintenance-unknown' && unverifiedStates === 1) {
                    json(layout.maintenance_lease_path, { contract: core.COMPANION_SERVICE_CONTRACT, schema_version: 1, service_identity: configuration.service_identity, repository_fingerprint: configuration.repository_fingerprint, operation_id: 'fixture-maintenance', owner_pid: process.pid, owner_process_identity: birth(process.pid), pre_maintenance_desired_state: 'running', acquired_at: new Date().toISOString(), expires_at: new Date(Date.now() + 60000).toISOString() });
                    pendingFaults = 1;
                    armed = true;
                }
                else if (pendingFaults > 0)
                    armed = true;
            }
            else if (state.reason === 'companion_service_foreign_runtime_conflict') {
                foreignStates++;
                if (foreignStates === 3)
                    finish();
            }
        }));
        if (scenario === 'adopted-unavailable') {
            supervisor = idle('supervisor');
            spawns++;
            provisionRuntime();
            json(layout.manager_state_path, { contract: core.COMPANION_SERVICE_CONTRACT, schema_version: 1, service_identity: configuration.service_identity, repository_fingerprint: configuration.repository_fingerprint, status: 'live', reason: 'companion_service_live', manager_pid: process.pid, manager_process_identity: birth(process.pid), supervisor_pid: supervisor.pid, supervisor_process_identity: birth(supervisor.pid), runtime_ownership: null, restart_count: 0, restart_after: null, updated_at: new Date().toISOString() });
        }
        syncBuiltinESMExports();
        const watchdog = setTimeout(() => { managerError ??= Error('fixture_barrier_deadline'); finish(); }, 20000);
        managerPromise = core.runCompanionServiceManager({ configurationPath: layout.configuration_path, launchEnvironment: environment }).catch(e => { managerError = e; finish(); });
        await barrier;
        clearTimeout(watchdog);
        const finalState = readManager();
        const launchctl = args => { launchCommands.push(args[0]); assert.equal(args[0] === 'print' || args[0] === 'kickstart', true); return { status: 0 }; };
        const observed = await core.inspectCompanionService({ ...options, launchctl });
        const originalWitness = events.find(e => e.status === 'live')?.supervisor_process_identity;
        const currentWitness = birth(supervisor.pid);
        record = { ...record, injected, spawns, unverifiedStates, foreignStates, events, live_observation: observed.status, launchCommands, original_witness: originalWitness, current_witness: currentWitness, signals_before_cleanup: signals.slice(), manager_error: managerError?.message ?? null };
        if (scenario === 'shutdown-unknown') {
            assert.equal(managerError?.code, 'companion_service_supervisor_ownership_unverifiable');
            assert(fs.existsSync(layout.manager_lock_path), 'failed settlement must retain manager lock');
            assert.equal(events.at(-1).reason, 'companion_service_supervisor_ownership_unverifiable');
            record.unsettled_lock_retained = true;
        } else assert.equal(managerError, null, managerError?.stack);
        assert.equal(finalState.status, ['permanent-conflict', 'shutdown-unknown'].includes(scenario) ? 'recovery_required' : scenario === 'stop-unknown' ? 'installed_stopped' : scenario === 'maintenance-unknown' ? 'maintenance' : 'live', 'retained relationship must be truthful');
        if (!['permanent-conflict', 'shutdown-unknown', 'stop-unknown', 'maintenance-unknown'].includes(scenario))
            assert.equal(observed.status, 'live');
        assert.equal(foreignStates, 0);
        if (scenario === 'observed-exit') {
            assert.equal(spawns, 2);
            assert.equal(injected, 0);
            assert(events.some(e => e.provenance?.failure_origin === 'managed_child_exit_observed'));
        }
        else {
            assert.equal(spawns, 1);
            if (['initial-unavailable', 'shutdown-unknown'].includes(scenario))
                assert(injected > 0);
            else
                assert.equal(injected, ['unavailable-held', 'permanent-conflict'].includes(scenario) ? 3 : ['stop-unknown', 'maintenance-unknown'].includes(scenario) ? 2 : 1);
            if (!['stop-unknown', 'maintenance-unknown'].includes(scenario))
                assert.equal(currentWitness, originalWitness);
            if (scenario === 'shutdown-unknown') assert(unverifiedStates >= 2);
            else assert.equal(unverifiedStates, scenario === 'initial-unavailable' ? 1 : injected);
            for (const event of events.filter(e => e.reason === 'companion_service_supervisor_ownership_unverifiable')) {
                assert.equal(event.supervisor_pid, supervisor.pid);
                assert.equal(event.supervisor_process_identity, scenario === 'initial-unavailable' ? null : originalWitness);
                assert.equal(event.generation, scenario === 'initial-unavailable' ? null : 'fixture-generation-1');
            }
            if (!['stop-unknown', 'maintenance-unknown'].includes(scenario)) assert.equal(signals.length, 0);
        }
        record.pass = true;
    }
    catch (e) {
        record = { ...record, pass: false, error: e.message };
    }
    finally {
        armed = false;
        stopRequested = true;
        if (layout && fs.existsSync(layout.maintenance_lease_path))
            fs.unlinkSync(layout.maintenance_lease_path);
        if (desired && layout)
            json(layout.desired_state_path, { ...desired, desired_state: 'stopped' });
        if (managerPromise)
            await managerPromise;
        for (const patch of patches.reverse())
            patch.mock.restore();
        syncBuiltinESMExports();
        globalThis.fetch = originalFetch;
        await cleanupOwnedProcesses(owned);
        record.cleanup_completed = owned.size === 0;
        record.remaining_owned_processes = owned.size;
        if (scenario === 'shutdown-unknown' && layout && fs.existsSync(layout.manager_lock_path)) {
            // The production path correctly retained this unsettled lock. Only
            // the disposable fixture owner removes it after its children settle.
            assert.equal(JSON.parse(fs.readFileSync(layout.manager_lock_path)).owner_pid, process.pid);
            assert.equal(owned.size, 0);
            fs.unlinkSync(layout.manager_lock_path);
        }
        record.manager_lock_removed = layout ? !fs.existsSync(layout.manager_lock_path) : true;
        if ((managerError && scenario !== 'shutdown-unknown') || !record.manager_lock_removed) {
            record.pass = false;
            record.cleanup_error = managerError?.message ?? 'manager_lock_not_removed';
        }
        fs.rmSync(root, { recursive: true, force: true });
        record.fixture_removed = !fs.existsSync(root);
    }
    return record;
}
