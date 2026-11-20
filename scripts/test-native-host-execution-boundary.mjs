import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { Writable } from "node:stream";
import { fileURLToPath } from "node:url";
import { canonicalChildAcceptanceFailure, runCanonicalChild } from "./canonical-child-runner.mjs";
import { buildCanonicalChildEnvironment, cleanupCanonicalTestResources, createCanonicalTestResourceRoot } from "./canonical-test-environment.mjs";
import { assertScriptedCodexParity } from "./fixtures/native-host-execution-parity.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const owners = [], results = [];
try {
  for (const route of ["injected", "default_codex", "injected_codex"]) {
    const owner = createCanonicalTestResourceRoot("ag-c01-", { shortSocketPaths: true });
    owners.push(owner);
    const env = buildCanonicalChildEnvironment({ temporaryRoot: owner.root });
    mkdirSync(env.HOME, { recursive: true });
    const output = { stdout: "", stderr: "", bytes: 0 };
    const sink = key => new Writable({ write(chunk, _encoding, done) {
      output.bytes += chunk.length;
      if (output.bytes <= 65_536) output[key] += chunk.toString("utf8");
      done();
    } });
    const stdout = sink("stdout"), stderr = sink("stderr");
    const timeoutMs = 30_000;
    const result = await runCanonicalChild({
      suite: "native-host-execution-boundary", label: route,
      command: process.execPath,
      args: ["--import", "tsx", "scripts/fixtures/native-host-execution-boundary-child.cjs", route],
      cwd: root, env, timeoutMs, heartbeatMs: 0,
      stdout, stderr, resourceOwner: owner,
    });
    stdout.end(); stderr.end();
    const failure = canonicalChildAcceptanceFailure(result, { suite: "native-host-execution-boundary", timeoutMs, requireNaturalExit: true });
    assert.equal(failure, null, `${failure?.message ?? ""}\n${output.stderr}\n${output.stdout}`);
    assert(output.bytes <= 65_536, "bounded child output required");
    const summary = JSON.parse(output.stdout);
    assert.equal(summary.route, route);
    assert.equal(summary.status, "pass");
    results.push(summary);
  }
  const defaultBehavior = results[1].behavior;
  assertScriptedCodexParity(defaultBehavior, results[2].behavior);

  // Exercise the alternating callback order even on a run where both children
  // observed the same schedule. Keep their original traces in the report.
  const opposite = { turn_started: "terminal_observed", terminal_observed: "turn_started" };
  const alternate = defaultBehavior.lifecycle.map(event => opposite[event] ?? event);
  assertScriptedCodexParity(defaultBehavior, { ...defaultBehavior, lifecycle: alternate });
  const missingTerminal = { ...defaultBehavior, lifecycle: defaultBehavior.lifecycle.filter(event => event !== "terminal_observed") };
  assert.throws(() => assertScriptedCodexParity(missingTerminal, missingTerminal), assert.AssertionError);
  console.log(JSON.stringify({ test: "native_host_execution_boundary", status: "pass", results }));
} finally {
  const cleanup = cleanupCanonicalTestResources(owners);
  assert(cleanup.every(result => result.completed), JSON.stringify(cleanup));
}
