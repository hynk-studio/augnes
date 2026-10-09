import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, linkSync, mkdirSync, readFileSync, renameSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  admitVerificationContext, assertVerificationContext, assertIsolatedMutableResources,
} from "./local-canonical-verification-context.mjs";
import { acquireVerificationCapacity, assertVerificationCapacity, releaseVerificationCapacity, verificationCapacityLimit } from "./local-canonical-capacity.mjs";
import { acquireCheckoutVerificationOwnership, releaseCheckoutVerificationOwnership, CHECKOUT_OWNER_FILE } from "./local-canonical-checkout-ownership.mjs";
import { createIsolatedInvocationResources, isolatedInvocationEnvironment, cleanupIsolatedInvocationResources } from "./local-canonical-isolated-resources.mjs";
import { createCanonicalTestResourceRoot, cleanupCanonicalTestResources } from "./canonical-test-environment.mjs";
import { runCanonicalChild, canonicalChildAcceptanceFailure } from "./canonical-child-runner.mjs";

// Contract fixtures with real Git/files/processes/listeners. These do not
// impersonate an authenticated deciding run or the actual-Mac overlap exercise.
const fixtureOwner = createCanonicalTestResourceRoot("ag-resource-test-");
const fixture = fixtureOwner.root;
const anchor = path.join(fixture, "anchor"), a = path.join(fixture, "a"), b = path.join(fixture, "b");
const origin = "https://github.com/hynk-studio/augnes.git";
const invocationA = "a".repeat(32), invocationB = "b".repeat(32);
const host = { logical_cpu_count: 10, physical_memory_bytes: 24 * 1024 ** 3, disk_free_bytes_at_start: 40 * 1024 ** 3 };
const leases = [];
const resources = [];
const pending = [];
const controllers = [];
const completed = new Map();
const hasCode = code => error => error.code === code;
const moduleUrl = name => new URL(name, import.meta.url).href;
function git(root, ...args) {
  const result = spawnSync("git", ["-C", root, ...args], { encoding: "utf8", timeout: 10_000 });
  assert.equal(result.status, 0, result.stderr); return result.stdout.trim();
}
function admit(root = a, options = {}) {
  return admitVerificationContext({ repositoryRoot: root, canonicalRoot: anchor, platform: "darwin", kind: "isolated-worktree", ...options });
}

try {
  mkdirSync(anchor);
  git(anchor, "init", "--initial-branch=main"); git(anchor, "remote", "add", "origin", origin);
  for (const relative of ["apps/augnes_apps", "apps/web_planning"]) {
    mkdirSync(path.join(anchor, relative), { recursive: true });
    writeFileSync(path.join(anchor, relative, ".keep"), "fixture");
  }
  writeFileSync(path.join(anchor, ".gitignore"), ".augnes-local-verification/\nnode_modules/\n.next/\n");
  git(anchor, "add", "."); git(anchor, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "fixture");
  git(anchor, "worktree", "add", "--detach", a, "HEAD"); git(anchor, "worktree", "add", "--detach", b, "HEAD");
  const contextA = admit(a), contextB = admit(b);
  assert.notEqual(contextA.checkout_fingerprint, contextB.checkout_fingerprint);
  assert.equal(contextA.anchor_fingerprint, contextB.anchor_fingerprint);
  assert.equal(assertVerificationContext(contextA, a), contextA);
  assert.throws(() => assertVerificationContext({ ...contextA }, a), hasCode("verification_context_not_owned"));
  assert.throws(() => assertVerificationContext(contextA, b), hasCode("verification_context_not_owned"));
  assert.throws(() => admit(a, { platform: "linux" }), hasCode("isolated_verification_host_unsupported"));
  assert.throws(() => admit(anchor), hasCode("isolated_verification_checkout_not_distinct"));
  assert.throws(() => admit(a, { kind: "canonical" }), hasCode("unauthorized_repository_root"));
  const clone = path.join(fixture, "clone");
  git(anchor, "clone", "--no-local", anchor, clone); git(clone, "remote", "set-url", "origin", origin);
  assert.throws(() => admit(clone), hasCode("isolated_verification_unregistered_checkout"));
  const alias = path.join(fixture, "alias"); symlinkSync(a, alias);
  assert.throws(() => admit(alias), hasCode("verification_checkout_alias_refused"));
  symlinkSync(b, path.join(a, "node_modules"));
  assert.throws(() => admit(a), hasCode("isolated_resource_alias_refused"));
  rmSync(path.join(a, "node_modules")); mkdirSync(path.join(a, "node_modules"));
  writeFileSync(path.join(b, "external"), "other lane"); linkSync(path.join(b, "external"), path.join(a, "node_modules", "shared"));
  assert.throws(() => assertIsolatedMutableResources(a), hasCode("isolated_resource_alias_refused"));
  rmSync(path.join(a, "node_modules", "shared"));
  symlinkSync(path.join(b, "external"), path.join(a, "node_modules", "shared"));
  assert.throws(() => assertIsolatedMutableResources(a), hasCode("isolated_resource_alias_refused"));
  rmSync(path.join(a, "node_modules", "shared"));
  writeFileSync(path.join(a, "node_modules", "local"), "owned"); symlinkSync("local", path.join(a, "node_modules", "bin"));
  linkSync(path.join(a, "node_modules", "local"), path.join(a, "node_modules", "internal-hardlink"));
  assert.doesNotThrow(() => assertIsolatedMutableResources(a));
  writeFileSync(path.join(a, ".env.local"), "FIXTURE=1");
  assert.throws(() => admit(a), hasCode("isolated_environment_file_refused")); rmSync(path.join(a, ".env.local"));
  git(anchor, "remote", "set-url", "origin", "https://github.com/example/other.git");
  assert.throws(() => admit(a), hasCode("unauthorized_repository_origin")); git(anchor, "remote", "set-url", "origin", origin);
  const saved = path.join(fixture, "a-saved"); renameSync(a, saved); mkdirSync(a);
  assert.throws(() => assertVerificationContext(contextA, a)); rmSync(a, { recursive: true }); renameSync(saved, a);
  assert.equal(assertVerificationContext(contextA, a), contextA);

  assert.equal(verificationCapacityLimit(host), 2);
  assert.equal(verificationCapacityLimit({ ...host, physical_memory_bytes: 16 * 1024 ** 3 }), 1);
  assert.equal(verificationCapacityLimit({ ...host, logical_cpu_count: 8 }), 1);
  assert.throws(() => acquireVerificationCapacity({ context: contextA, host: { ...host, disk_free_bytes_at_start: 29 * 1024 ** 3 }, invocationId: invocationA }), hasCode("verification_capacity_disk_insufficient"));
  const leaseA = acquireVerificationCapacity({ context: contextA, host, invocationId: invocationA }); leases.push(leaseA);
  const leaseB = acquireVerificationCapacity({ context: contextB, host, invocationId: invocationB }); leases.push(leaseB);
  assert.notEqual(leaseA.slot, leaseB.slot); assert.notEqual(leaseA.ownership_id, leaseB.ownership_id);
  assert.throws(() => acquireVerificationCapacity({ context: contextA, host, invocationId: invocationA }), hasCode("verification_capacity_busy"));
  assert.equal(assertVerificationCapacity(leaseB), true);
  assert.throws(() => acquireVerificationCapacity({ context: contextA, host: { ...host, logical_cpu_count: 8 }, invocationId: invocationA }), hasCode("verification_capacity_limit_conflict"));
  const busyChild = await runCanonicalChild({
    suite: "isolation-contract", label: "capacity contender", command: process.execPath,
    args: ["--input-type=module", "-e", `
      import {admitVerificationContext} from ${JSON.stringify(moduleUrl("./local-canonical-verification-context.mjs"))};
      import {acquireVerificationCapacity} from ${JSON.stringify(moduleUrl("./local-canonical-capacity.mjs"))};
      const context = admitVerificationContext(${JSON.stringify({ repositoryRoot: b, canonicalRoot: anchor, platform: "darwin", kind: "isolated-worktree" })});
      try { acquireVerificationCapacity({context,host:${JSON.stringify(host)},invocationId:${JSON.stringify(invocationB)}}); process.exitCode=2; }
      catch(e) { if(e.code!=="verification_capacity_busy") throw e; }
    `], cwd: fixture, env: process.env, timeoutMs: 10_000,
  });
  assert.equal(busyChild.exit_code, 0); assert.equal(busyChild.remaining_owned_processes, 0);

  for (const id of [invocationA, invocationB]) resources.push(createIsolatedInvocationResources(id));
  const [resourceA, resourceB] = resources;
  const envA = isolatedInvocationEnvironment(resourceA), envB = isolatedInvocationEnvironment(resourceB);
  for (const key of ["HOME", "TMPDIR", "AUGNES_DB_PATH", "AUGNES_RUNTIME_STATE_DIR", "npm_config_cache", "npm_config_devdir"])
    assert.notEqual(envA[key], envB[key]);
  for (const key of ["OPENAI_API_KEY", "GH_TOKEN", "GITHUB_TOKEN", "CODEX_HOME"])
    assert.equal(Object.hasOwn(envA, key), false);
  // Exercise a real nested tsx IPC server, not a shortened-path string check.
  // macOS refused this under its long default temp root plus an outer lane root.
  const nestedSocket = await runCanonicalChild({ suite: "isolation-contract", label: "nested tsx socket", command: process.execPath,
    args: ["--input-type=module", "-e", `
      import assert from 'node:assert/strict';
      import {createCanonicalTestResourceRoot,buildCanonicalChildEnvironment,cleanupCanonicalTestResources} from ${JSON.stringify(moduleUrl("./canonical-test-environment.mjs"))};
      import {runCanonicalChild} from ${JSON.stringify(moduleUrl("./canonical-child-runner.mjs"))};
      const owner=createCanonicalTestResourceRoot('ag-c01-');
      try { const result=await runCanonicalChild({suite:'nested-socket',label:'tsx IPC',command:process.execPath,
        args:[${JSON.stringify(path.resolve("node_modules/tsx/dist/cli.mjs"))},'--eval','console.log("socket-bound")'],cwd:process.cwd(),
        env:buildCanonicalChildEnvironment({temporaryRoot:owner.root}),resourceOwner:owner,timeoutMs:10000});
        assert.equal(result.exit_code,0);assert.equal(result.cleanup_completed,true);assert.equal(result.remaining_owned_processes,0);
      } finally { assert.equal(cleanupCanonicalTestResources([owner])[0].completed,true); }
    `], cwd: process.cwd(), env: envA, timeoutMs: 15_000 });
  assert.equal(nestedSocket.exit_code, 0); assert.equal(nestedSocket.remaining_owned_processes, 0);
  const childScript = `
    const fs = require('node:fs'), net = require('node:net');
    let count=0; const file=process.env.AUGNES_DB_PATH;
    const server=net.createServer(s=>{count++;fs.writeFileSync(file,String(count));s.end(String(count));});
    server.listen(0,'127.0.0.1',()=>process.stdout.write(JSON.stringify({port:server.address().port})+'\\n'));
  `;
  function start(resource, env, label) {
    const controller = new AbortController(); controllers.push(controller);
    let resolveReady, rejectReady, output = "";
    const ready = new Promise((resolve, reject) => { resolveReady = resolve; rejectReady = reject; });
    const timer = setTimeout(() => rejectReady(new Error("fixture_ready_timeout")), 5000);
    const run = runCanonicalChild({ suite: "isolation-contract", label, command: process.execPath, args: ["-e", childScript],
      cwd: fixture, env, signal: controller.signal, timeoutMs: 10_000,
      stdout: { write(chunk) { output += chunk; if (output.includes("\n")) { clearTimeout(timer); resolveReady(JSON.parse(output.trim())); } } },
    }).then(result => { completed.set(resource, result); return result; }).finally(() => clearTimeout(timer));
    pending.push(run); return { ready, run, controller };
  }
  const laneA = start(resourceA, envA, "fixture lane A"), laneB = start(resourceB, envB, "fixture lane B");
  const [readyA, readyB] = await Promise.all([laneA.ready, laneB.ready]);
  const { createConnection } = await import("node:net");
  const request = port => new Promise((resolve, reject) => {
    const socket = createConnection({ host: "127.0.0.1", port }); let result = "";
    socket.setTimeout(2000, () => socket.destroy(new Error("fixture_socket_timeout")));
    socket.on("data", chunk => result += chunk); socket.on("end", () => resolve(result)); socket.on("error", reject);
  });
  assert.deepEqual(await Promise.all([request(readyA.port), request(readyB.port)]), ["1", "1"]);
  laneA.controller.abort(); const cancelled = await laneA.run;
  assert.equal(cancelled.cancelled, true); assert.equal(cancelled.timed_out, false);
  assert.equal(cancelled.cleanup_completed, true); assert.equal(cancelled.remaining_owned_processes, 0);
  assert.equal(canonicalChildAcceptanceFailure({ ...cancelled, exit_code: 0 }, { suite: "fixture", timeoutMs: 10_000 }).code, "canonical_child_cancelled");
  assert.equal(cleanupIsolatedInvocationResources(resourceA, { consumersSettled: true }).completed, true);
  resources.splice(resources.indexOf(resourceA), 1);
  assert.equal(existsSync(envA.TMPDIR), false); assert.equal(existsSync(envB.TMPDIR), true);
  assert.equal(await request(readyB.port), "2"); assert.equal(readFileSync(envB.AUGNES_DB_PATH, "utf8"), "2");
  const unsettled = cleanupIsolatedInvocationResources(resourceB, { consumersSettled: false });
  assert.equal(unsettled.completed, false); assert(unsettled.failures.includes("resource_consumers_unsettled"));
  laneB.controller.abort(); const bResult = await laneB.run;
  assert.equal(bResult.cleanup_completed, true); assert.equal(bResult.remaining_owned_processes, 0);
  assert.equal(cleanupIsolatedInvocationResources(resourceB, { consumersSettled: true }).completed, true);
  resources.splice(resources.indexOf(resourceB), 1);
  assert.equal(existsSync(envB.TMPDIR), false);
  await assert.rejects(() => request(readyA.port)); await assert.rejects(() => request(readyB.port));
  assert.equal(releaseVerificationCapacity(leaseA, { consumersSettled: true }).released, true); leases.splice(leases.indexOf(leaseA), 1);
  assert.equal(assertVerificationCapacity(leaseB), true);
  assert.equal(releaseVerificationCapacity(leaseB, { consumersSettled: true }).released, true); leases.splice(leases.indexOf(leaseB), 1);
  const slotRoot = path.join(anchor, ".augnes-local-verification", "capacity", "slot-1");
  const slotFile = path.join(slotRoot, ".augnes-local-verification", CHECKOUT_OWNER_FILE);
  // Failed release retains the exact artifact and cannot admit a successor.
  const unsettledLease = acquireVerificationCapacity({ context: contextA, host, invocationId: invocationA });
  assert.throws(() => releaseVerificationCapacity(unsettledLease, { consumersSettled: false }), hasCode("checkout_owner_consumers_unsettled"));
  assert.equal(existsSync(slotFile), true); rmSync(slotFile); // fixture-owned artifact only
  const replacedLease = acquireVerificationCapacity({ context: contextA, host, invocationId: invocationA });
  const moved = slotFile + ".original"; renameSync(slotFile, moved); writeFileSync(slotFile, readFileSync(moved));
  assert.throws(() => assertVerificationCapacity(replacedLease), hasCode("checkout_owner_identity_changed"));
  assert.throws(() => releaseVerificationCapacity(replacedLease, { consumersSettled: true }), hasCode("checkout_owner_identity_changed"));
  assert.equal(existsSync(slotFile), true); rmSync(slotFile); rmSync(moved);
  async function abandonedFixtureOwner(root) {
    const result = await runCanonicalChild({ suite: "isolation-contract", label: "abandoned fixture owner", command: process.execPath,
      args: ["--input-type=module", "-e", `import {acquireCheckoutVerificationOwnership} from ${JSON.stringify(moduleUrl("./local-canonical-checkout-ownership.mjs"))}; acquireCheckoutVerificationOwnership({repositoryRoot:${JSON.stringify(root)}});`],
      cwd: fixture, env: process.env, timeoutMs: 10_000 });
    assert.equal(result.exit_code, 0); assert.equal(result.remaining_owned_processes, 0);
  }
  await abandonedFixtureOwner(slotRoot);
  assert.throws(() => acquireVerificationCapacity({ context: contextA, host, invocationId: invocationA }), hasCode("checkout_owner_stale_refused"));
  assert.equal(existsSync(slotFile), true); rmSync(slotFile);
  await abandonedFixtureOwner(anchor);
  assert.throws(() => acquireVerificationCapacity({ context: contextA, host, invocationId: invocationA }), hasCode("verification_unaccounted_canonical_owner"));
  assert.equal(existsSync(slotFile), false);
  rmSync(path.join(anchor, ".augnes-local-verification", CHECKOUT_OWNER_FILE));
  const owner = acquireCheckoutVerificationOwnership({ repositoryRoot: a });
  try { assert.throws(() => acquireCheckoutVerificationOwnership({ repositoryRoot: a }), hasCode("checkout_owner_busy")); }
  finally { releaseCheckoutVerificationOwnership(owner, a); }
  console.log(JSON.stringify({ test: "local-canonical-isolation", status: "pass", evidence: "contract_fixtures_not_deciding",
    registered_worktree_admission: true, aliases_and_shared_mutable_state_refused: true, bounded_capacity: true,
    interprocess_capacity_contention: true, stale_replaced_unsettled_capacity_refused: true, unaccounted_canonical_owner_refused: true, cancelled_A_leaves_B_working: true, unsettled_resources_refused: true,
    private_outer_environment: true, actual_nested_tsx_socket: true, owned_processes_and_listeners: 0 }));
} finally {
  for (const controller of controllers) controller.abort();
  await Promise.allSettled(pending);
  for (const resource of resources) {
    const result = completed.get(resource);
    assert.equal(cleanupIsolatedInvocationResources(resource, { consumersSettled: result?.cleanup_completed === true && result?.remaining_owned_processes === 0 }).completed, true);
  }
  for (const lease of leases) releaseVerificationCapacity(lease, { consumersSettled: true });
  assert.equal(cleanupCanonicalTestResources([fixtureOwner])[0].completed, true);
}
