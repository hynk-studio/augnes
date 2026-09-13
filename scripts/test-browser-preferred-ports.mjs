#!/usr/bin/env node

import assert from "node:assert/strict";
import childProcess from "node:child_process";
import { EventEmitter } from "node:events";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import net from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { mock } from "node:test";

import {
  PORT_SEARCH_SIZE,
  runRuntimeSupervisorCli,
} from "./augnes-runtime-supervisor-core.mjs";
import { createOperatorExecutionBrowserLifecycleV1 } from "./operator-execution-browser-lifecycle-v1.mjs";

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

let scenarios = 0;
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
    candidates: [65_516, 65_535, 65_515, 40_001, 65_515, 40_002],
    expected: { app: 65_515, bridge: 40_001, debug: 40_002 },
  });
}
await allocationScenario({
  candidates: [1_023, 1_024, 40_003, 40_004],
  expected: { app: 1_024, bridge: 40_003, debug: 40_004 },
});
await allocationScenario({
  candidates: Array(PORT_SEARCH_SIZE).fill(65_535),
  failure: /browser_preferred_ports_exhausted/u,
});
await allocationScenario({
  candidates: Array(PORT_SEARCH_SIZE).fill(40_005),
  failure: /browser_preferred_ports_exhausted/u,
});
await allocationScenario({
  candidates: [40_006, ...Array(PORT_SEARCH_SIZE - 1).fill(65_516)],
  failure: /browser_preferred_ports_exhausted/u,
});
for (const candidate of [
  { listenError: "probe_listen_failed" },
  { listenThrow: "probe_listen_threw" },
  { addressError: "probe_address_failed" },
  { nullAddress: true },
  { port: 40_007, closeError: "probe_close_failed" },
]) {
  await allocationScenario({
    candidates: [candidate],
    failure: /probe_(?:listen_failed|listen_threw|address_failed|close_failed)|browser_loopback_port_allocation_failed/u,
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
  assert.match(source, /import \{ chooseBrowserPorts \} from "\.\/browser-preferred-ports\.mjs";/u);
  assert.match(source, /\(\{ app: appPort, bridge: bridgePort, debug: debugPort \} = await chooseBrowserPorts\(\)\);/u);
  assert.doesNotMatch(source, /chooseAvailablePort/u);
}
console.log(`Browser preferred-port allocation and launch contracts passed (${scenarios} scenarios).`);

async function allocationScenario({
  childId = "operator-native-host-execution",
  candidates,
  expected,
  failure,
}) {
  const root = mkdtempSync(path.join(tmpdir(), "ag-browser-port-contract-"));
  const probes = [];
  let cursor = 0;
  let lifecycle = null;
  const allocation = mock.method(net, "createServer", (onConnection) => {
    assert(cursor < candidates.length, "candidate_selection_exceeded_bound");
    const next = candidates[cursor++];
    const candidate = typeof next === "number" ? { port: next } : next;
    const server = new EventEmitter();
    server.listening = false;
    server.closeCount = 0;
    server.listen = (port, host, ready) => {
      assert.equal(port, 0, "allocate the OS-selected port, never a transformed port");
      assert.equal(host, "127.0.0.1");
      if (candidate.listenThrow) throw new Error(candidate.listenThrow);
      queueMicrotask(() => {
        if (candidate.listenError) return server.emit("error", new Error(candidate.listenError));
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
      const wasListening = server.listening;
      server.listening = false;
      queueMicrotask(() => closed(candidate.closeError
        ? new Error(candidate.closeError)
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
      await assert.rejects(create, failure);
      assert.equal(launchCount, 0);
    } else {
      lifecycle = await create();
      assert.deepEqual(lifecycle.ports, expected);
      assert.equal(new Set(Object.values(lifecycle.ports)).size, 3);
      await assert.rejects(() => lifecycle.start(), /allocation_contract_launch_captured/u);
      assert.equal(launchCount, 1);
    }
    assert.equal(cursor, candidates.length);
    assert.equal(probes.every((probe) => probe.closeCount === 1 && !probe.listening), true);
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
