// Fresh-process CommonJS load observations cover the actual service import and
// product call below. The guard is test-local; it is never an execution option.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const fsPromises = require("node:fs/promises");
const Module = require("node:module");
const path = require("node:path");
const { installZeroNetworkGuard } = require("../test-harness-zero-network-guard.mjs");
const root = path.resolve(__dirname, "../..");
const route = process.argv[2];
assert(["injected", "default_codex", "injected_codex"].includes(route));
const temporary = process.env.AUGNES_CANONICAL_TEMP_ROOT;
assert(temporary && process.env.HOME.startsWith(temporary), "parent-owned private state required");
const at = "2026-08-01T00:00:20.000Z", now = () => at;
const livePath = "lib/vnext/runtime/live-native-host-run-service.ts";
const directPath = "lib/vnext/runtime/direct-native-host-round-trip.ts";
const adapterPath = "lib/vnext/native-host/codex-app-server-adapter.ts";
const productionPath = "lib/vnext/native-host/codex-production-runtime.ts";
const storePath = "lib/vnext/native-host/codex-managed-runtime-store.ts";
const scopedPath = "lib/vnext/native-host/codex-scoped-task.ts";
const relative = value => typeof value === "string" ? path.relative(root, value).split(path.sep).join("/") : "";
const counts = { factory: 0, invoke: 0, exported_probe: 0, runtime_selection: 0, host_configuration_read: 0 };
const loadEdges = [], blockedEdges = [], observations = [], requests = [], results = [];
const originalLoad = Module._load;
const originalReadFileSync = fs.readFileSync, originalReadFile = fsPromises.readFile;
const network = installZeroNetworkGuard();
const proxyCache = new WeakMap();
const hostConfiguration = path.join(process.env.HOME, ".codex", "config.toml");
fs.mkdirSync(path.dirname(hostConfiguration), { recursive: true });
fs.writeFileSync(hostConfiguration, "# synthetic unconsumed host configuration\n");
const trace = path.join(temporary, "transport.jsonl");
const cleanupMarker = path.join(temporary, "transport-settled");
const networkMarker = path.join(temporary, "transport-network");
function guardConfiguration(filename) {
  if (typeof filename === "string" && path.resolve(filename) === hostConfiguration) {
    counts.host_configuration_read++;
    throw new Error("native_host_test_live_configuration_consumed");
  }
}
fs.readFileSync = function (filename, ...args) { guardConfiguration(filename); return originalReadFileSync.call(this, filename, ...args); };
fsPromises.readFile = async function (filename, ...args) { guardConfiguration(filename); return originalReadFile.call(this, filename, ...args); };
const guardedSelectors = new Set(["resolveDefaultCodexAppServerLaunchV01", "resolveCodexProductionRuntimeV01", "managedRootFromEnvironmentV01", "ensurePinnedCodexManagedRuntimeV01", "selectCodexManagedRuntimeV01"]);
const guardedProbes = new Set(["probeCodexIsolatedAuthCredentialFreeCompatibilityV01", "probeCodexCredentialFreeExactProfileV01"]);
Module._load = function (id, parent, ...args) {
  const resolved = Module._resolveFilename(id, parent), filename = relative(resolved), importer = relative(parent?.filename);
  if ([adapterPath, scopedPath].includes(filename)) {
    const edge = { importer, imported: filename };
    loadEdges.push(edge);
    if ([livePath, directPath].includes(importer)) {
      blockedEdges.push(edge);
      throw new Error("native_host_test_concrete_lifecycle_dependency");
    }
  }
  const loaded = originalLoad.call(this, id, parent, ...args);
  if (![adapterPath, productionPath, storePath].includes(filename)) return loaded;
  if (proxyCache.has(loaded)) return proxyCache.get(loaded);
  const proxy = new Proxy(loaded, { get(target, key) {
    if (filename === adapterPath && key === "createCodexAppServerAdapterV01") return options => {
      counts.factory++;
      if (route === "injected") throw new Error("native_host_test_live_adapter_constructed");
      assert.deepEqual(Object.keys(options ?? {}).filter(key => key !== "scoped_task"), [],
        "the default composition must not add hidden execution settings");
      const adapter = target[key]({ ...options, now,
        observe: observation => observations.push(observation.kind),
        launch: { command: process.execPath,
          prefix_args: [path.join(root, "scripts/fixtures/fake-codex-app-server.mjs")],
          environment: { NODE_ENV: "test", HOME: process.env.HOME, TMPDIR: temporary,
            PATH: process.env.PATH, FAKE_CODEX_SCENARIO: "success",
            FAKE_CODEX_TRACE_PATH: trace, FAKE_CODEX_CLEANUP_MARKER_PATH: cleanupMarker,
            FAKE_CODEX_NETWORK_COUNT_PATH: networkMarker } },
      });
      return { ...adapter, invoke(request, control) {
        counts.invoke++; requests.push(request);
        const invocation = adapter.invoke(request, control);
        const result = invocation.result.then(value => { results.push(value); return value; });
        return { ...invocation, result };
      } };
    };
    if (guardedProbes.has(key)) return () => {
      counts.exported_probe++;
      throw new Error("native_host_test_live_probe_started");
    };
    if (guardedSelectors.has(key)) return () => {
      counts.runtime_selection++;
      throw new Error("native_host_test_live_runtime_selected");
    };
    return Reflect.get(target, key);
  } });
  proxyCache.set(loaded, proxy); return proxy;
};

async function main() {
  let db, service;
  try {
    const { LiveNativeHostRunServiceV01 } = require(path.join(root, livePath));
    assert.deepEqual(counts, { factory: 0, invoke: 0, exported_probe: 0, runtime_selection: 0, host_configuration_read: 0 },
      "import alone must not initialize execution or consume live host configuration");
    assert.deepEqual(blockedEdges, []);
    const Database = require("better-sqlite3");
    const { applyCanonicalDatabaseMigrations } = require("../canonical-database-migrations.mjs");
    const { normalizeLocalProjectRootRefV01, getOrCreateCanonicalProjectForLocalRootV01, getOrCreateDefaultWorkspaceIdentityV01 } = require(path.join(root, "lib/vnext/persistence/project-identity-registry.ts"));
    const { selectActiveProjectV01, readActiveProjectSelectionV01 } = require(path.join(root, "lib/vnext/persistence/project-lifecycle-registry.ts"));
    const { issueVNextLocalOperatorBootstrapV01, consumeVNextLocalOperatorBootstrapV01, readVNextLocalOperatorCredentialFromRequestV01, VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01 } = require(path.join(root, "lib/vnext/runtime/local-operator-session.ts"));
    const { defineInitialProjectWorkV01 } = require(path.join(root, "lib/vnext/runtime/project-work-initialization.ts"));
    const { listVNextCoreRecordsV01 } = require(path.join(root, "lib/vnext/persistence/durable-semantic-store.ts"));
    const { readProjectRunResultDetailV01 } = require(path.join(root, "lib/vnext/runtime/project-run-result-read-model.ts"));
    const { validateRunReceiptV01 } = require(path.join(root, "lib/vnext/run-receipt.ts"));
    const { createDeterministicCodexAdapterV01 } = require(path.join(root, "lib/vnext/native-host/deterministic-codex-adapter.ts"));
    const databasePath = process.env.AUGNES_DB_PATH;
    db = new Database(databasePath); db.pragma("foreign_keys = ON"); applyCanonicalDatabaseMigrations(db);
    const workspace = getOrCreateDefaultWorkspaceIdentityV01(db);
    const projectRoot = path.join(temporary, "project"); fs.mkdirSync(projectRoot);
    const registration = getOrCreateCanonicalProjectForLocalRootV01(db, { workspace_id: workspace.workspace_id,
      local_root: normalizeLocalProjectRootRefV01(projectRoot, { base_path: temporary }), display_name: "Execution boundary fixture" });
    const config = { enabled: true, workspace_id: workspace.workspace_id, project_id: registration.project.project_id,
      operator_id: "operator:execution-boundary", database_path: databasePath };
    selectActiveProjectV01(db, { workspace_id: config.workspace_id, project_id: config.project_id,
      expected_project_id: null, expected_revision: null, now: at });
    const clock = value => ({ now: () => value });
    const bootstrap = issueVNextLocalOperatorBootstrapV01(db, { config, clock: clock("2026-08-01T00:00:00.000Z") });
    const session = consumeVNextLocalOperatorBootstrapV01(db, { config, bootstrap_token: bootstrap.bootstrap_token,
      clock: clock("2026-08-01T00:00:01.000Z") });
    const defined = defineInitialProjectWorkV01(db, { config, credential: session.credential,
      clock: clock("2026-08-01T00:00:09.000Z"), request: { action: "define_initial_project_work",
        workspace_id: config.workspace_id, project_id: config.project_id, expected_active_project_id: config.project_id,
        expected_active_selection_revision: readActiveProjectSelectionV01(db, config.workspace_id).selection_revision,
        expected_initialization_state: "not_defined", goal: "Inspect the execution boundary in its project",
        success_criteria: ["The intended project retains the result"], non_goals: ["No real provider call"] } });
    const credential = cookie => readVNextLocalOperatorCredentialFromRequestV01(new Request("http://127.0.0.1", {
      headers: { cookie: `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${cookie}` } }));
    let currentCredential = credential(defined.session_admission.cookie_value);
    let deterministicInvocations = 0, opened = 0, closed = 0;
    const deterministic = createDeterministicCodexAdapterV01({ now });
    const injected = { ...deterministic, invoke(request, control) {
      deterministicInvocations++; requests.push(request);
      const invocation = deterministic.invoke(request, control);
      return { ...invocation, result: invocation.result.then(value => { results.push(value); return value; }) };
    } };
    const options = { now, timeout_ms: 5_000, stop_settle_timeout_ms: 1_000,
      open_database() { const connection = new Database(databasePath); connection.pragma("foreign_keys = ON"); opened++;
        const close = connection.close.bind(connection); connection.close = () => { closed++; return close(); }; return connection; } };
    if (route === "injected") options.adapter_factory = (...args) => {
      assert.deepEqual(args, [undefined], "retain the injected factory's synchronous scope argument"); return injected;
    };
    if (route === "injected_codex") options.adapter_factory = (...args) => {
      assert.deepEqual(args, [undefined]); return require(path.join(root, adapterPath)).createCodexAppServerAdapterV01();
    };
    service = new LiveNativeHostRunServiceV01(options);
    await assert.rejects(service.start({ config, mode: "interactive" }), /live_host_operator_authority_required/);
    const start = await service.start({ config, mode: "interactive", operator_mutation: { credential: currentCredential, clock: { now } } });
    assert.equal(start.status, "accepted"); currentCredential = credential(start.session_admission.cookie_value);
    const deadline = performance.now() + 10_000;
    while (true) {
      const projection = service.read(config);
      if (projection.receipt) break;
      assert(!["failed", "blocked", "paused", "cancelled", "timed_out"].includes(projection.status), JSON.stringify(projection));
      assert(performance.now() < deadline, "bounded service receipt wait");
      await new Promise(resolve => setTimeout(resolve, 1));
    }
    await service.shutdown();
    const projection = service.read(config);
    assert.equal(projection.status, "completed");
    assert.equal(requests.length, 1); assert.equal(results.length, 1); assert.equal(results[0].outcome, "completed");
    const receipts = () => listVNextCoreRecordsV01(db, { ...config, record_kinds: ["run_receipt"], limit: 10 });
    assert.equal(receipts().length, 1);
    const receipt = receipts()[0].payload;
    assert.equal(validateRunReceiptV01(receipt).status, "valid");
    assert.equal(receipt.execution.status, "completed");
    assert.equal(receipt.receipt_id, projection.receipt.receipt_ref);
    const readback = readProjectRunResultDetailV01(db, { ...config, receipt_id: receipt.receipt_id });
    assert.equal(readback.summary.receipt_ref, receipt.receipt_id);
    assert.equal(readback.identity.packet_ref.external_id, defined.packet.packet_id);
    const replay = await service.start({ config, mode: "interactive", operator_mutation: { credential: currentCredential, clock: { now } } });
    assert.equal(replay.status, "exact_replay"); assert.deepEqual(replay.projection.receipt, projection.receipt);
    assert.equal(receipts().length, 1); assert.equal(requests.length, 1);
    await service.shutdown(); assert.equal(opened, closed);
    assert.equal(counts.exported_probe, 0); assert.equal(counts.runtime_selection, 0); assert.equal(counts.host_configuration_read, 0);
    assert.deepEqual(blockedEdges, []); assert.deepEqual(network.attempts, []);
    const observedCounts = { ...counts };
    if (route === "injected") { assert.equal(counts.factory, 0); assert.equal(counts.invoke, 0); assert.equal(deterministicInvocations, 1); }
    else { assert(counts.factory > 0); assert.equal(counts.invoke, 1);
      assert.equal(originalReadFileSync(cleanupMarker, "utf8"), "settled\n");
      assert.equal(originalReadFileSync(networkMarker, "utf8"), "0\n");
      assert(observations.includes("spawned")); assert(observations.includes("account_available"));
      assert(observations.includes("turn_started")); assert(observations.includes("settled")); }
    const request = requests[0], result = results[0];
    let transport = null;
    if (route !== "injected") {
      const received = originalReadFileSync(trace, "utf8").trim().split("\n").map(line => JSON.parse(line))
        .filter(entry => entry.kind === "received").map(entry => entry.value);
      const thread = received.find(value => value.method === "thread/start");
      const turn = received.find(value => value.method === "turn/start");
      assert(thread && turn); assert.equal(thread.cwd, projectRoot); assert.equal(turn.cwd, projectRoot);
      // This ordinary interactive request includes the existing project-scoped
      // approval categories. Its accepted sandbox is the exact project root.
      assert.equal(thread.sandbox, "workspace-write");
      assert.deepEqual(turn.sandbox_policy, { type: "workspaceWrite", writableRoots: [projectRoot],
        networkAccess: false, excludeTmpdirEnvVar: true, excludeSlashTmp: true });
      assert.equal(turn.output_schema, true); assert.equal(turn.task_context_packet_section, true);
      assert.equal(turn.guide_before_task_context_packet, true);
      transport = { methods: received.map(value => value.method).filter(Boolean),
        thread_sandbox: thread.sandbox, thread_approval: thread.approval_policy,
        turn_sandbox: { ...turn.sandbox_policy, writableRoots: ["<exact_project_root>"] }, turn_approval: turn.approval_policy,
        output_schema: turn.output_schema, packet_delivered: turn.task_context_packet_section,
        guide_delivered: turn.guide_before_task_context_packet };
    }
    const behavior = { request: { request_version: request.request_version, mode: request.mode,
        allowed_operation_categories: request.allowed_operation_categories, policy: request.policy,
        result_return: request.result_return, task: request.packet.task,
        guide_brief_present: Boolean(request.guide_brief) },
      lifecycle: observations, transport, result: { outcome: result.outcome, summary: result.summary,
        changed_files: result.changed_files, commands: result.commands, checks: result.checks,
        artifacts: result.artifacts.map(artifact => ({ path: artifact.artifact_ref.external_id,
          type: artifact.artifact_ref.ref_type, summary: artifact.summary })),
        skipped_checks: result.skipped_checks, uncertainty: result.uncertainty, gaps: result.gaps },
      receipt: { status: receipt.execution.status, basis: receipt.execution.basis,
        checks: receipt.checks.map(check => ({ check_id: check.check_id, status: check.status, basis: check.basis })),
        privacy_egress: receipt.privacy_egress, authority_summary: receipt.authority_summary },
      actual_results: results.length, receipts: receipts().length, replay: replay.status,
      refusal: "live_host_operator_authority_required" };
    const observedLoadEdges = [...loadEdges];
    // Reproduce the exact forbidden importer edge, using Node's real resolver.
    const oldImporter = new Module(path.join(root, livePath)); oldImporter.filename = path.join(root, livePath);
    assert.throws(() => oldImporter.require(path.join(root, adapterPath)), /native_host_test_concrete_lifecycle_dependency/);
    assert.throws(() => require(path.join(root, adapterPath)).probeCodexCredentialFreeExactProfileV01({}), /native_host_test_live_probe_started/);
    assert.throws(() => require(path.join(root, productionPath)).resolveCodexProductionRuntimeV01({ environment: {} }), /native_host_test_live_runtime_selected/);
    assert.throws(() => fs.readFileSync(hostConfiguration), /native_host_test_live_configuration_consumed/);
    if (route === "injected") assert.throws(() => new LiveNativeHostRunServiceV01().readCapabilityContractV01(), /native_host_test_live_adapter_constructed/);
    assert.equal(blockedEdges.length, 1); assert.equal(counts.exported_probe, 1); assert.equal(counts.runtime_selection, 1); assert.equal(counts.host_configuration_read, 1);
    process.stdout.write(JSON.stringify({ route, status: "pass", observed: observedCounts,
      load_scope: "fresh CommonJS service import and authenticated Start/result/receipt/product readback/exact replay; direct lifecycle-to-Codex adapter/scoped-task edges refused",
      permitted_transitive_codex_edges: observedLoadEdges.filter(edge => ![livePath, directPath].includes(edge.importer)),
      configuration_scope: "production-runtime and managed-runtime selectors plus exact private synthetic config.toml reads; no universal module or filesystem isolation claim",
      probe_scope: "exported credential-free probes observed; actual adapter startup/account probes are within invoke, which is never called on the injected deterministic route",
      positive_controls: route === "injected" ? 5 : 4, network_calls: network.attempts.length,
      database_connections_closed: opened === closed, behavior }) + "\n");
  } finally {
    if (service) await service.shutdown();
    db?.close();
    Module._load = originalLoad; fs.readFileSync = originalReadFileSync; fsPromises.readFile = originalReadFile;
    network.restore();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
