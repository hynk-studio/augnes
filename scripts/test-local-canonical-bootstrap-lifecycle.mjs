// Disposable development regression. No repository admission or stock wrapper
// is invoked; the source owner receives a newly initialized fixture repository.
import assert from "node:assert/strict";
import childProcess from "node:child_process";
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanonicalTestResourceRoot, cleanupCanonicalTestResources, buildCanonicalChildEnvironment } from "./canonical-test-environment.mjs";
import { runCanonicalChild, canonicalChildAcceptanceFailure } from "./canonical-child-runner.mjs";
import { digest } from "./local-canonical-inputs.mjs";
import { createIsolatedInvocationResources, cleanupIsolatedInvocationResources, isolatedInvocationSelection } from "./local-canonical-isolated-resources.mjs";
import { resolveSelectedTool, selectedExecutionLifecycle } from "./local-canonical-selected-execution.mjs";
import { loadSelectedGit, selectedGitExecutable, SELECTED_GIT_MANIFEST_ENV, SELECTED_GIT_MANIFEST_HASH_ENV } from "./local-canonical-selected-git.mjs";
import { initializeOwnedChildLifecycleFile, inspectOwnedChildLifecycleBytes, readOwnedChildLifecycleFile,
  runOwnedSyncChild, withOwnedSyncLifecycle } from "./test-harness-process-lifecycle.mjs";

async function runBootstrapProbe() {
const owner = createCanonicalTestResourceRoot("ag-resource-test-"), root = path.join(owner.root, "fixture");
const originalSpawn = childProcess.spawnSync, originalKill = process.kill, actualPids = new Set();
const gitTool = process.env[SELECTED_GIT_MANIFEST_ENV]
  ? selectedGitExecutable(loadSelectedGit(process.env[SELECTED_GIT_MANIFEST_ENV], process.env[SELECTED_GIT_MANIFEST_HASH_ENV]))
  : resolveSelectedTool("git");
const fixtureLedger = { file: path.join(owner.root, "fixture-setup.jsonl") };
Object.assign(fixtureLedger, initializeOwnedChildLifecycleFile(fixtureLedger.file));
let resources = null, positiveResources = null, positiveLifecycle = null, positiveDispatches = 0;
let failure = null, preserved = null, historical = null, primary;
const isGone = pid => { try { process.kill(pid, 0); return false; } catch (error) { if (error.code === "ESRCH") return true; throw error; } };
const git = args => withOwnedSyncLifecycle(fixtureLedger, () => {
  const result = runOwnedSyncChild(gitTool, args, { cwd: root, timeout: 5000, encoding: "utf8",
    env: { PATH: "/usr/bin:/bin", HOME: owner.root, GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: path.join(owner.root, "empty.config") } });
  assert.equal(result.status, 0, result.stderr); return result;
});
const verifyPreservedRoot = info => {
  const directory = info.preserved_root, expected = info.preserved_root_identity;
  assert.equal(path.dirname(directory), realpathSync(process.platform === "darwin" ? "/tmp" : os.tmpdir()));
  assert.match(path.basename(directory), /^ag-suite-[A-Za-z0-9]+$/u);
  assert.equal(realpathSync(directory), directory);
  const stat = lstatSync(directory);
  assert.equal(stat.isDirectory(), true); assert.equal(stat.isSymbolicLink(), false);
  assert.equal(String(stat.dev), expected.device); assert.equal(String(stat.ino), expected.inode);
  if (process.getuid) assert.equal(stat.uid, process.getuid());
  return directory;
};
try {
  mkdirSync(root); writeFileSync(path.join(owner.root, "empty.config"), "");
  git(["init", "--quiet"]); git(["remote", "add", "origin", "https://github.com/hynk-studio/augnes.git"]);
  writeFileSync(path.join(root, "fixture.txt"), "production-ineligible-bootstrap-fixture\n");
  git(["add", "."]); git(["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid",
    "-c", "commit.gpgsign=false", "commit", "--quiet", "-m", "fixture"]);
  assert.equal(readOwnedChildLifecycleFile(fixtureLedger.file, fixtureLedger.identity).complete, true);
  childProcess.spawnSync = (command, args, options) => {
    const result = originalSpawn(command, args, options);
    if (Number.isInteger(result.pid) && result.pid > 0) actualPids.add(result.pid);
    return result;
  };
  process.kill = (pid, signal) => {
    if (pid < 0 && signal === 0) throw Object.assign(new Error("fixture group probe unavailable"), { code: "EIO" });
    return originalKill(pid, signal);
  };
  syncBuiltinESMExports();
  try { resources = createIsolatedInvocationResources("f".repeat(32), { repositoryRoot: root }); }
  catch (error) { failure = error; preserved = error.isolatedResourceCleanup; }
  finally { process.kill = originalKill; childProcess.spawnSync = originalSpawn; syncBuiltinESMExports(); }
  assert.equal(failure?.code, "owned_process_observation_unknown");
  assert.equal(preserved?.completed, false);
  assert.equal(preserved.failure_count, 1);
  assert.deepEqual(preserved.failures, ["selected_bootstrap_children_unsettled"]);
  const directory = verifyPreservedRoot(preserved), ledger = path.join(directory, "selected-inputs", "owned-children.jsonl");
  historical = inspectOwnedChildLifecycleBytes(readFileSync(ledger));
  assert.equal(historical.started_count, 1); assert.equal(historical.unknown_count, 1); assert.equal(historical.complete, false);
  assert.equal(historical.children[0].terminal.reason, "owned_process_observation_unknown");
  assert(actualPids.size > 0, "fault follows an actual started tool child");
  for (const pid of actualPids) assert.equal(isGone(pid), true, "actual child must be gone before fixture-only cleanup");
  // Restoring the observer never rewrites the retained UNKNOWN registration.
  assert.deepEqual(inspectOwnedChildLifecycleBytes(readFileSync(ledger)), historical);
  // Keep the negative bootstrap cold: successful initialization legitimately
  // caches exact metadata and may otherwise avoid its injected dispatch fault.
  const positivePids = new Set();
  childProcess.spawnSync = (command, args, options) => {
    if (command !== "/bin/ps") positiveDispatches += 1;
    const result = originalSpawn(command, args, options);
    if (command !== "/bin/ps" && Number.isInteger(result.pid) && result.pid > 0) positivePids.add(result.pid);
    return result;
  };
  syncBuiltinESMExports();
  try { positiveResources = createIsolatedInvocationResources("e".repeat(32), { repositoryRoot: root }); }
  finally { childProcess.spawnSync = originalSpawn; syncBuiltinESMExports(); }
  positiveLifecycle = selectedExecutionLifecycle(isolatedInvocationSelection(positiveResources));
  assert(positiveDispatches > 0, "successful bootstrap must dispatch actual tools");
  assert.equal(positiveLifecycle.started_count, positiveDispatches, "every actual bootstrap dispatch must have one start record, excluding fixed ps inspection");
  assert.equal(positiveLifecycle.settled_count, positiveDispatches);
  assert.equal(positiveLifecycle.complete, true);
  for (const pid of positivePids) assert.equal(isGone(pid), true, "successful bootstrap children must be gone before cleanup");
  assert.equal(cleanupIsolatedInvocationResources(positiveResources, { consumersSettled: positiveLifecycle.complete }).completed, true);
  positiveResources = null;
  console.log(JSON.stringify({ test: "selected-bootstrap-lifecycle", production_eligible: false,
    controls: ["every-successful-bootstrap-dispatch-accounted", "actual-bootstrap-child-unknown", "owner-and-ledger-preserved", "observer-restored-child-exit-proved", "unknown-history-unchanged"],
    positive_bootstrap_dispatches: positiveDispatches, positive_bootstrap_lifecycle: positiveLifecycle,
    historical_lifecycle: historical, historical_ledger_utf8: readFileSync(ledger, "utf8"),
    fixture_setup_lifecycle: readOwnedChildLifecycleFile(fixtureLedger.file, fixtureLedger.identity),
    fixture_setup_ledger_utf8: readFileSync(fixtureLedger.file, "utf8"),
    production_admission: "NOT_RUN" }));
} catch (error) { primary = error; }
finally {
  process.kill = originalKill; childProcess.spawnSync = originalSpawn; syncBuiltinESMExports();
  if (positiveResources) {
    const complete = selectedExecutionLifecycle(isolatedInvocationSelection(positiveResources)).complete;
    assert.equal(cleanupIsolatedInvocationResources(positiveResources, { consumersSettled: complete }).completed, true);
  }
  if (resources) assert.equal(cleanupIsolatedInvocationResources(resources, { consumersSettled: true }).completed, true);
  if (preserved?.preserved_root && existsSync(preserved.preserved_root)) {
    const directory = verifyPreservedRoot(preserved);
    for (const pid of actualPids) assert.equal(isGone(pid), true, "unsettled actual child preserves fixture roots");
    // The source owner intentionally retains this failed bootstrap. Only this
    // regression removes its own verified root after independent ESRCH checks.
    const visit = current => {
      const stat = lstatSync(current);
      assert.equal(String(stat.dev), preserved.preserved_root_identity.device);
      assert.equal(stat.isSymbolicLink(), false); assert.equal(realpathSync(current), current);
      if (stat.isDirectory()) for (const name of readdirSync(current)) visit(path.join(current, name));
      else { assert.equal(stat.isFile(), true); assert.equal(stat.nlink, 1); }
    };
    visit(directory); rmSync(directory, { recursive: true }); assert.equal(existsSync(directory), false);
  }
  const setup = readOwnedChildLifecycleFile(fixtureLedger.file, fixtureLedger.identity);
  assert.equal(setup.complete, true, "fixture setup children settle before cleanup");
  assert.equal(cleanupCanonicalTestResources([owner])[0].completed, true);
  if (primary) throw primary;
}
}

if (process.argv[2] === "--bootstrap-probe") await runBootstrapProbe();
else {
  const owner = createCanonicalTestResourceRoot("ag-resource-test-"), bin = path.join(owner.root, "bin");
  let output = "", diagnostic = "";
  try {
    mkdirSync(bin);
    let selected;
    if (process.env.AUGNES_CANONICAL_SELECTED_INPUTS) {
      const bytes = readFileSync(process.env.AUGNES_CANONICAL_SELECTED_INPUTS);
      assert.equal(digest(bytes), process.env.AUGNES_CANONICAL_SELECTED_INPUTS_SHA256);
      selected = JSON.parse(bytes).tools;
    }
    // Actual immutable tools are selected without inheriting the enclosing
    // verification ledger or private dispatchers into this negative fixture.
    for (const name of ["node", "npm", "git", "gh", "python3"]) {
      const tool = name === "node" ? process.execPath : selected?.[name] ?? resolveSelectedTool(name);
      symlinkSync(realpathSync(tool), path.join(bin, name));
    }
    const ambient = Object.fromEntries(Object.entries(process.env).filter(([key]) =>
      !key.startsWith("AUGNES_CANONICAL_SELECTED_") && !key.startsWith("AUGNES_CANONICAL_CHILD_LEDGER")));
    ambient.PATH = [bin, "/usr/bin", "/bin", "/usr/sbin", "/sbin"].join(path.delimiter);
    const env = buildCanonicalChildEnvironment({ ambientEnvironment: ambient, temporaryRoot: owner.root });
    for (const key of Object.keys(env)) assert(!key.startsWith("AUGNES_CANONICAL_SELECTED_") && !key.startsWith("AUGNES_CANONICAL_CHILD_LEDGER"));
    const result = await runCanonicalChild({ suite: "selected-bootstrap", label: "isolated UNKNOWN bootstrap fixture",
      command: process.execPath, args: [fileURLToPath(import.meta.url), "--bootstrap-probe"], cwd: owner.root, env,
      resourceOwner: owner, timeoutMs: 10000, heartbeatMs: 0, stdout: { write: chunk => { output += chunk; } },
      stderr: { write: chunk => { diagnostic += chunk; } }, log() {} });
    assert.equal(canonicalChildAcceptanceFailure(result, { suite: "selected-bootstrap", timeoutMs: 10000, requireNaturalExit: true }), null, diagnostic);
    const evidence = JSON.parse(output.trim());
    assert.equal(evidence.historical_lifecycle.unknown_count, 1);
    console.log(JSON.stringify({ ...evidence, enclosing_child_settled: result.owned_child_lifecycle?.event === "settled" }));
  } finally {
    assert.equal(cleanupCanonicalTestResources([owner])[0].completed, true);
  }
}
