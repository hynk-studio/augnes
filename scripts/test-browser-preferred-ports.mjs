#!/usr/bin/env node

import assert from "node:assert/strict";
import childProcess from "node:child_process";
import { EventEmitter } from "node:events";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import net from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { mock } from "node:test";
import { fileURLToPath } from "node:url";
import { runCanonicalChild } from "./canonical-child-runner.mjs";
import { createCanonicalTestResourceRoot, buildCanonicalChildEnvironment, cleanupCanonicalTestResources } from "./canonical-test-environment.mjs";

import {
  PORT_SEARCH_SIZE,
  runRuntimeSupervisorCli,
} from "./augnes-runtime-supervisor-core.mjs";
import { readBrowserPortAllocationDiagnostic } from "./browser-preferred-ports.mjs";
import { createOperatorExecutionBrowserLifecycleV1 } from "./operator-execution-browser-lifecycle-v1.mjs";

let scenarios = 0;
if (process.argv[2] === "--initialization-case") {
  await initializationFailureCase(process.argv[3]);
} else {
// Exercise the supervisor's real argument parser, stopping before runtime setup.
// An unknown trailing option is reached only if the preferred port was accepted.
for (const option of ["--port", "--bridge-port"]) {
  for (const port of [1_024, 65_515, 65_516, 65_535]) {
    const output = [];
    const capture = mock.method(console, "log", (line) => output.push(JSON.parse(line)));
    try {
      assert.equal(await runRuntimeSupervisorCli([
        "start", option, String(port), "--allocation-contract-stop",
      ], {}), 2);
    } finally {
      capture.mock.restore();
    }
    assert.equal(output.length, 1);
    assert.equal(output[0].reason, port <= 65_535 - PORT_SEARCH_SIZE
      ? "unknown_option"
      : option === "--port" ? "ui_port_invalid" : "bridge_port_invalid");
  }
}

const childIds = [
  "operator-review-control",
  "operator-native-host-execution",
  "operator-work-expectation",
  "operator-multi-candidate",
  "cross-boundary-golden",
];
for (const childId of childIds) {
  await allocationScenario({
    childId,
    candidates: [65_516, { port: 65_496, requested: 65_496 }, 40_001, 40_001, 40_002],
    expected: { app: 65_496, bridge: 40_001, debug: 40_002 },
    outcomes: ["range_rejected", "selected", "selected", "duplicate", "selected"],
  });
}
await allocationScenario({
  candidates: [1_023, 1_024, 40_003, 40_004],
  expected: { app: 1_024, bridge: 40_003, debug: 40_004 },
});
// Actual Mac failure schedule: two valid candidates followed by the upper tail.
// The correction must bind the transformed candidate, not invent its availability.
await allocationScenario({
  candidates: [65_514, 65_515, 65_516, { port: 65_496, requested: 65_496 }],
  expected: { app: 65_514, bridge: 65_515, debug: 65_496 },
  outcomes: ["selected", "selected", "range_rejected", "selected"],
});
await allocationScenario({
  candidates: [65_535, { port: 65_515, requested: 65_515 }, 40_010, 40_011],
  expected: { app: 65_515, bridge: 40_010, debug: 40_011 },
});
const occupiedFallback = () => [65_535, { requested: 65_515, listenError: "probe_busy", errorCode: "EADDRINUSE" }];
await allocationScenario({
  candidates: Array.from({length: PORT_SEARCH_SIZE / 2}, occupiedFallback).flat(),
  failure: /browser_preferred_ports_exhausted/u,
  outcomes: Array.from({length: PORT_SEARCH_SIZE / 2}, () => ["range_rejected", "address_in_use"]).flat(),
});
await allocationScenario({
  candidates: [...occupiedFallback(), 40_012, 40_013, 40_014],
  expected: { app: 40_012, bridge: 40_013, debug: 40_014 },
});
await allocationScenario({
  candidates: Array(PORT_SEARCH_SIZE).fill(40_005),
  failure: /browser_preferred_ports_exhausted/u,
});
await allocationScenario({
  candidates: [40_006, ...Array.from({length: 9}, occupiedFallback).flat(), 65_535],
  failure: /browser_preferred_ports_exhausted/u,
});
await allocationScenario({ candidates: Array(PORT_SEARCH_SIZE).fill(65_536), failure: /browser_preferred_ports_exhausted/u });
await allocationScenario({
  candidates: [65_535, { port: 40_001, requested: 65_515 }],
  failure: /browser_loopback_port_binding_mismatch/u,
});
await allocationScenario({
  candidates: [40_001, { listenError: "primary_listen_failure raw-sensitive /Users/private", closeError: "secondary_close_failure raw-sensitive", errorCode: "EACCES" }],
  failure: /^primary_listen_failure/u, incompleteCleanup: true, failureStage: "listen",
});
await allocationScenario({
  candidates: [65_535, { requested: 65_515, listenError: "primary_busy", errorCode: "EADDRINUSE", closeError: "secondary_close_failure" }],
  failure: /^primary_busy/u, incompleteCleanup: true,
});
for (const candidate of [
  { createError: "probe_create_failed" },
  { listenError: "probe_listen_failed" },
  { listenError: "probe_listen_failed raw-sensitive", errorCode: "raw-sensitive /Users/private" },
  { listenThrow: "probe_listen_threw" },
  { addressError: "probe_address_failed" },
  { nullAddress: true },
  { port: 40_007, closeError: "probe_close_failed" },
  { port: 40_007, closeThrow: "probe_close_threw" },
]) {
  await allocationScenario({
    candidates: [candidate],
    failure: /probe_(?:create_failed|listen_failed|listen_threw|address_failed|close_failed|close_threw)|browser_loopback_port_allocation_failed/u,
    incompleteCleanup: Boolean(candidate.closeError || candidate.closeThrow),
  });
}

// These executable owners cannot be imported without running their full flows.
// Keep their allocation call sites bound to the helper exercised above; their
// complete functional flows remain covered by their existing Browser owners.
for (const file of [
  "browser-validate-project-experience-v1.mjs",
  "browser-validate-continuity-v1.mjs",
]) {
  const source = readFileSync(new URL(file, import.meta.url), "utf8");
  assert.match(source, /import \{ chooseBrowserPorts, readBrowserPortAllocationDiagnostic \} from "\.\/browser-preferred-ports\.mjs";/u);
  assert.match(source, /const allocation = await chooseBrowserPorts\(\);/u);
  assert.match(source, /result\.browser_port_allocation_diagnostic \?\?= readBrowserPortAllocationDiagnostic\(error\);/u);
  assert.doesNotMatch(source, /chooseAvailablePort/u);
}
await initializationFailureControls();
console.log(`Browser preferred-port allocation and launch contracts passed (${scenarios} allocator scenarios, 4 serialized initialization controls).`);
}

async function allocationScenario({
  childId = "operator-native-host-execution",
  candidates,
  expected,
  failure, outcomes, incompleteCleanup = false, failureStage,
}) {
  const root = mkdtempSync(path.join(tmpdir(), "ag-browser-port-contract-"));
  const probes = [];
  let cursor = 0;
  let lifecycle = null;
  const allocation = mock.method(net, "createServer", (onConnection) => {
    assert(cursor < candidates.length, "candidate_selection_exceeded_bound");
    const next = candidates[cursor++];
    const candidate = typeof next === "number" ? { port: next } : next;
    if (candidate.createError) throw new Error(candidate.createError);
    const server = new EventEmitter();
    server.listening = false;
    server.closeCount = 0;
    server.listen = (port, host, ready) => {
      assert.equal(port, candidate.requested ?? 0, "every returned port must have been bound; fallback still consumes one probe");
      assert.equal(host, "127.0.0.1");
      if (candidate.listenThrow) throw new Error(candidate.listenThrow);
      queueMicrotask(() => {
        if (candidate.listenError) return server.emit("error", Object.assign(new Error(candidate.listenError), { code: candidate.errorCode ?? "EACCES" }));
        server.listening = true;
        if (onConnection) {
          let destroyed = false;
          onConnection({ destroy: () => { destroyed = true; } });
          assert.equal(destroyed, true, "probe connections must not hold closure open");
        }
        ready();
      });
    };
    server.address = () => {
      if (candidate.addressError) throw new Error(candidate.addressError);
      return candidate.nullAddress ? null : { port: candidate.port };
    };
    server.close = (closed) => {
      server.closeCount += 1;
      if (candidate.closeThrow) throw new Error(candidate.closeThrow);
      const wasListening = server.listening;
      server.listening = false;
      queueMicrotask(() => closed(candidate.closeError
        ? Object.assign(new Error(candidate.closeError), { code: "EPERM" })
        : wasListening ? undefined : Object.assign(new Error("not listening"), { code: "ERR_SERVER_NOT_RUNNING" })));
    };
    probes.push(server);
    return server;
  });
  let launchCount = 0;
  const launch = mock.method(childProcess, "spawn", (command, args) => {
    launchCount += 1;
    assert.equal(command, process.execPath);
    assert.equal(path.basename(args[0]), "augnes-runtime-supervisor.mjs");
    assert.equal(args[args.indexOf("--port") + 1], String(expected.app));
    assert.equal(args[args.indexOf("--bridge-port") + 1], String(expected.bridge));
    assert.equal(probes.every((probe) => probe.closeCount === 1 && !probe.listening), true);
    // Capture the real launch arguments without starting a runtime or Browser.
    throw new Error("allocation_contract_launch_captured");
  });
  syncBuiltinESMExports();
  try {
    const create = () => createOperatorExecutionBrowserLifecycleV1({
      child_id: childId,
      database_path: path.join(root, "unused.db"),
      manifest: { workspace_id: "port-contract", operator_id: "port-contract" },
      project_id: "port-contract",
      temp_root: root,
      process_temp_root: path.join(root, "process"),
    });
    if (failure) {
      let caught;
      await assert.rejects(create, error => { caught = error; return failure.test(error.message); });
      const diagnostic = readBrowserPortAllocationDiagnostic(caught);
      assert.equal(diagnostic.status, "failed");
      assert.equal(diagnostic.cleanup_complete, !incompleteCleanup);
      assert.equal(diagnostic.probe_limit, PORT_SEARCH_SIZE);
      assert.equal(diagnostic.probes.length, cursor);
      assert.deepEqual(diagnostic.probes.map(p => p.attempt), Array.from({length: cursor}, (_, i) => i + 1));
      assert.doesNotMatch(JSON.stringify(diagnostic), /raw-sensitive|\/Users\/private/u);
      if (outcomes) assert.deepEqual(diagnostic.probes.map(p => p.outcome), outcomes);
      if (failureStage) assert.equal(diagnostic.probes.at(-1).failure_stage, failureStage);
      assert.equal(readBrowserPortAllocationDiagnostic({ ...caught }), null);
      assert.equal(launchCount, 0);
    } else {
      lifecycle = await create();
      assert.deepEqual(lifecycle.ports, expected);
      const diagnostic = lifecycle.port_allocation_diagnostic;
      assert.equal(diagnostic.status, "allocated");
      assert.equal(diagnostic.cleanup_complete, true);
      assert.deepEqual(diagnostic.selected_ports, Object.values(expected));
      if (outcomes) assert.deepEqual(diagnostic.probes.map(p => p.outcome), outcomes);
      assert.equal(new Set(Object.values(lifecycle.ports)).size, 3);
      await assert.rejects(() => lifecycle.start(), /allocation_contract_launch_captured/u);
      assert.equal(launchCount, 1);
    }
    assert.equal(cursor, candidates.length);
    assert.equal(probes.every((probe) => probe.closeCount === 1), true);
    if (!incompleteCleanup) assert.equal(probes.every((probe) => !probe.listening), true);
    scenarios += 1;
  } finally {
    allocation.mock.restore();
    launch.mock.restore();
    syncBuiltinESMExports();
    if (lifecycle) await lifecycle.cleanup();
    rmSync(root, { recursive: true, force: true });
    assert.equal(existsSync(root), false);
  }
}


async function initializationFailureControls() {
  for (const scenario of ["partial", "exhausted", "cleanup-failure", "later-launch"]) {
    const owner = createCanonicalTestResourceRoot("ag-c01-");
    const env = buildCanonicalChildEnvironment({temporaryRoot: owner.root});
    mkdirSync(env.HOME, {recursive:true});
    let output = "", overflow = false;
    const sink = { write(chunk) { if (output.length + chunk.length > 512 * 1024) overflow = true; else output += chunk.toString(); } };
    let result;
    try {
      result = await runCanonicalChild({suite:"port-initialization",label:scenario,
        command:process.execPath,args:["--import","tsx",fileURLToPath(import.meta.url),"--initialization-case",scenario],
        cwd:process.cwd(),env,resourceOwner:owner,timeoutMs:15_000,stdout:sink});
    } finally {
      const cleanup = cleanupCanonicalTestResources([owner]);
      assert.equal(cleanup.every(x => x.completed), true);
    }
    assert.equal(overflow, false);
    // The negative child preserves its failure exit, even though this control
    // successfully demonstrates the refusal. Never promote it to Browser PASS.
    assert.equal(result.exit_code, 1, output);
    assert.equal(result.timed_out, false);
    assert.equal(result.cleanup_completed, true);
    assert.equal(result.remaining_owned_processes, 0);
    const marker = output.split("\n").find(line => line.startsWith('{"allocation_failure_control":'));
    assert(marker, output);
    const observed = JSON.parse(marker);
    assert.equal(observed.scenario, scenario);
    assert.equal(observed.allocation_failure_control, "pass");
    console.log(marker);
  }
}

async function initializationFailureCase(scenario) {
  assert(["partial", "exhausted", "cleanup-failure", "later-launch"].includes(scenario));
  let probes = 0, closes = 0, launchAttempts = 0;
  const allocation = mock.method(net, "createServer", () => {
    const index = ++probes;
    const server = new EventEmitter();
    server.listen = (port, host, ready) => {
      assert.equal(port,0); assert.equal(host,"127.0.0.1");
      queueMicrotask(() => {
        if (index === 2 && ["partial", "cleanup-failure"].includes(scenario))
          server.emit("error",Object.assign(new Error("allocation_primary_listen_failure"),{code:"EACCES"}));
        else ready();
      });
    };
    server.address = () => ({port: scenario === "exhausted" ? 40_020 : 40_020 + index});
    server.close = done => { closes++;
      queueMicrotask(() => done(index === 2 && scenario === "cleanup-failure"
        ? Object.assign(new Error("allocation_secondary_close_failure"),{code:"EPERM"}) : undefined));
    };
    return server;
  });
  const launch = mock.method(childProcess, "spawn", () => {
    launchAttempts++;
    throw new Error("launch_collision_control");
  });
  syncBuiltinESMExports();
  let observed;
  const originalWrite = process.stdout.write.bind(process.stdout);
  const capture = mock.method(process.stdout, "write", (chunk,...args) => {
    if (typeof chunk === "string" && chunk.startsWith('{\n  "ok":')) observed = JSON.parse(chunk);
    return originalWrite(chunk,...args);
  });
  try {
    const {runOperatorExecutionBrowserChildV1} = await import("./operator-execution-browser-child-v1.mjs");
    await runOperatorExecutionBrowserChildV1({child_id:"operator-review-control",
      execute:async () => { throw new Error("unintended_browser_execution"); }});
  } finally {
    capture.mock.restore(); allocation.mock.restore(); launch.mock.restore(); syncBuiltinESMExports();
  }
  assert(observed);
  assert.equal(observed.ok, false);
  assert.equal(process.exitCode, 1);
  assert.equal(observed.browser_failure_diagnostic, null);
  if (scenario === "later-launch") {
    assert.equal(observed.browser_failure_snapshot.primary.phase, "setup");
    assert.equal(observed.browser_failure_snapshot.primary.navigation, null);
  } else assert.equal(observed.browser_failure_snapshot, null);
  assert.equal(observed.temporary_root_removed, true);
  assert.equal(observed.temporary_process_root_removed, true);
  assert.equal(observed.temporary_database_removed, true);
  assert.equal(closes, probes);
  const diagnostic = observed.browser_port_allocation_diagnostic;
  assert.equal(diagnostic.status, scenario === "later-launch" ? "allocated" : "failed");
  assert.equal(diagnostic.cleanup_complete, scenario !== "cleanup-failure");
  assert.equal(observed.cleanup_complete, scenario !== "cleanup-failure");
  assert.equal(launchAttempts, scenario === "later-launch" ? 1 : 0);
  assert.match(observed.failure, scenario === "exhausted" ? /browser_preferred_ports_exhausted/u
    : scenario === "later-launch" ? /launch_collision_control/u : /allocation_primary_listen_failure/u);
  assert.doesNotMatch(observed.failure,/allocation_secondary_close_failure|navigation_failure/u);
  console.log(JSON.stringify({allocation_failure_control:"pass",scenario,
    diagnostic,launch_attempts:launchAttempts,temporary_roots_removed:true,primary_failure:observed.failure}));
}
