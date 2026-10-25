// Development-only integration of production pipeline owners. This deliberately
// does not call repository admission, the deciding executor, or real stock.
import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanonicalTestResourceRoot, buildCanonicalChildEnvironment, beginCanonicalTestResourceUse, settleCanonicalTestResourceUse, cleanupCanonicalTestResources } from "./canonical-test-environment.mjs";
import { runCanonicalChild, canonicalChildAcceptanceFailure } from "./canonical-child-runner.mjs";
import { createIsolatedInvocationResources, isolatedInvocationEnvironment, isolatedInvocationSelection, cleanupIsolatedInvocationResources } from "./local-canonical-isolated-resources.mjs";
import { selectedExecutionRetainedResources, selectedExecutionEvidence, selectedExecutionLedger, selectedToolInvocation, withSelectedExecution } from "./local-canonical-selected-execution.mjs";
import { freezeInputContract, monitorInputContract, digest } from "./local-canonical-inputs.mjs";
import { acquireCheckoutVerificationOwnership, releaseCheckoutVerificationOwnership } from "./local-canonical-checkout-ownership.mjs";
import { retainSelectedInputEvidence, retainOwnedChildLifecycleEvidence } from "./local-canonical-evidence-retention.mjs";
import { runPhasesSequentially, executePhase } from "./run-local-canonical-verification.mjs";
import { appendOwnedChildLifecycleEvent } from "./test-harness-process-lifecycle.mjs";

const started = Date.now(), implementationRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const owner = createCanonicalTestResourceRoot("ag-resource-test-"), root = path.join(owner.root, "fixture");
const environment = buildCanonicalChildEnvironment({ temporaryRoot: owner.root });
const logId = `1530-selected-pipeline-${process.pid}-${Date.now()}`;
const phaseLogRoot = path.join(implementationRoot, ".augnes-local-verification", "logs", logId);
const evidenceRoot = path.join(implementationRoot, ".augnes-local-verification", "1530-dev", "evidence", logId);
const quiet = { write() {} }, results = [];
let resources = null, checkoutOwner = null, lastChild = null, activeChild = false;
const write = (file, bytes) => writeFileSync(file, bytes, { mode: 0o600 });
beginCanonicalTestResourceUse(owner);
async function fixtureChild(command, args, label, env = environment) {
  let output = "", diagnostic = ""; activeChild = true;
  const ledger = resources ? selectedExecutionLedger(isolatedInvocationSelection(resources)) : null;
  const result = await runCanonicalChild({ suite: "selected-pipeline", label, command, args, cwd: root, env, timeoutMs: 5000,
    stdout: { write: chunk => { output += chunk; } }, stderr: { write: chunk => { diagnostic += chunk; } }, log() {},
    ...(ledger ? { onLifecycle: event => appendOwnedChildLifecycleEvent(ledger.file, ledger.identity, event) } : {}) });
  lastChild = result; activeChild = !result.cleanup_completed || !result.streams_closed || !result.exit_observed || result.remaining_owned_processes !== 0;
  assert.equal(canonicalChildAcceptanceFailure(result, { suite: "selected-pipeline", timeoutMs: 5000, requireNaturalExit: true }), null, diagnostic);
  return output.trim();
}
try {
  mkdirSync(root); mkdirSync(evidenceRoot, { recursive: true, mode: 0o700 });
  await fixtureChild("git", ["init", "--quiet"], "initialize disposable repository");
  await fixtureChild("git", ["remote", "add", "origin", "https://github.com/hynk-studio/augnes.git"], "set disposable origin identity");
  write(path.join(root, "package.json"), JSON.stringify({ name: "production-ineligible-pipeline", version: "0.0.0", private: true,
    scripts: { "test:authority": "node tool-check.mjs" } }) + "\n");
  write(path.join(root, "tool-check.mjs"), `import {runCanonicalChild} from ${JSON.stringify(new URL("./canonical-child-runner.mjs", import.meta.url).href)};
import assert from 'node:assert/strict'; import fs from 'node:fs'; import path from 'node:path';
async function python(command,args,env=process.env,expected=0){let output='',diagnostic='';const result=await runCanonicalChild({suite:'selected-pipeline',label:'actual package Python',command,args,cwd:process.cwd(),env,timeoutMs:1500,
stdout:{write:c=>{output+=c}},stderr:{write:c=>{diagnostic+=c}},log(){}});
assert.equal(result.exit_code,expected,diagnostic);assert(result.cleanup_completed&&result.streams_closed&&result.exit_observed&&result.remaining_owned_processes===0);return output.trim();}
const flags='import sys; print(sys.flags.ignore_environment,sys.flags.no_user_site,sys.flags.no_site)';
const output=await python('python3',['-c',flags]);
const discovered=await python('python3',['-c',"import sys; sys.stdout.buffer.write(sys.executable.encode('utf-8'));"]);
assert(!output.includes('[owned-child-lifecycle]')&&!discovered.includes('[owned-child-lifecycle]'));
assert.equal(discovered,path.join(process.env.PATH.split(path.delimiter)[0],'python3'));
const userSite=await python(discovered,['-c','import site; print(site.getusersitepackages())']);
assert(userSite.startsWith(process.env.HOME+path.sep));fs.mkdirSync(userSite,{recursive:true});
const startup=path.join(process.cwd(),'python-startup');fs.mkdirSync(startup);
const marker=path.join(startup,'executed');const poison='from pathlib import Path; Path('+JSON.stringify(marker)+').write_text("unsafe")';
fs.writeFileSync(path.join(userSite,'usercustomize.py'),poison);fs.writeFileSync(path.join(startup,'sitecustomize.py'),poison);
const nestedCode='import subprocess,sys; child=subprocess.run([sys.executable,"-c",'+JSON.stringify(flags)+'],check=True,capture_output=True,text=True,timeout=1); print(child.stdout.strip())';
const nested=await python(discovered,['-c',nestedCode],{...process.env,PYTHONPATH:startup});
assert.equal(nested,'1 1 1');assert.equal(fs.existsSync(marker),false);
await python(discovered,['-m','site'],process.env,126);
await python(discovered,['/unowned-python-script.py'],process.env,126);
console.log(JSON.stringify({fixture:'selected-package-tools',path:process.env.PATH,node:process.execPath,python_flags:output,
python_discovery_retained:true,nested_python_flags:nested,external_python_startup_excluded:true}));\n`);
  write(path.join(root, ".gitignore"), ".augnes-local-verification/\n");
  await fixtureChild("git", ["add", "."], "index disposable source");
  await fixtureChild("git", ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "-c", "commit.gpgsign=false", "commit", "--quiet", "-m", "fixture"], "commit disposable source");
  const head = await fixtureChild("git", ["rev-parse", "HEAD"], "observe disposable head");
  const tree = await fixtureChild("git", ["rev-parse", "HEAD^{tree}"], "observe disposable tree");
  const shadowBin = path.join(root, "node_modules", ".bin"); mkdirSync(shadowBin, { recursive: true });
  for (const name of ["node", "python3"]) { const file = path.join(shadowBin, name); write(file, "#!/bin/sh\necho unselected-shadow\nexit 99\n"); chmodSync(file, 0o700); }
  checkoutOwner = acquireCheckoutVerificationOwnership({ repositoryRoot: root });
  const childFile = path.join(root, "consumer.mjs");
  write(childFile, `import fs from 'node:fs'; import path from 'node:path';
const [selected,ready] = process.argv.slice(2); const target = selected === 'private' ? path.join(process.env.HOME,'.codex','config.toml') : selected;
console.log(fs.readFileSync(target,'utf8').trim()); fs.writeFileSync(ready,'ready');
process.on('SIGTERM',()=>process.exit(0)); setTimeout(()=>{console.log(fs.readFileSync(target,'utf8').trim());process.exit(0)},600);
`);
  const records = [];
  for (const consumes of [false, true]) {
    const label = consumes ? "consuming" : "nonconsuming", invocationId = (consumes ? "2" : "1").repeat(32);
    resources = createIsolatedInvocationResources(invocationId, { repositoryRoot: root });
    const selection = isolatedInvocationSelection(resources), selectedEnv = isolatedInvocationEnvironment(resources);
    if (!consumes) {
      const packageOutput = await fixtureChild("npm", ["run", "test:authority"], "actual selected npm package shell", selectedEnv);
      const packageObservation = JSON.parse(packageOutput.split("\n").find(line => line.startsWith('{"fixture":"selected-package-tools"')));
      assert.equal(packageObservation.path.split(path.delimiter)[0], selectedEnv.PATH.split(path.delimiter)[0]);
      assert.equal(packageObservation.node, process.execPath); assert.equal(packageObservation.python_flags, "1 1 1");
      assert.equal(packageObservation.python_discovery_retained, true);
      assert.equal(packageObservation.nested_python_flags, "1 1 1");
      assert.equal(packageObservation.external_python_startup_excluded, true);
      await withSelectedExecution(selection, () => {
        for (const args of [["--require", "/fixture/foreign.cjs", "--version"], ["--import=/fixture/foreign.mjs", "--version"],
          ["-e", "process.exit(0)", "--require", "/fixture/foreign.cjs"]])
          assert.throws(() => selectedToolInvocation("node", args), error => error.code === "selected_node_arguments_unclassified");
        assert.throws(() => selectedToolInvocation("node", ["/fixture/foreign.mjs"]), error => error.code === "selected_node_entrypoint_unclassified");
        assert.throws(() => selectedToolInvocation("/usr/bin/env", []), error => error.code === "selected_tool_unclassified");
        for (const args of [["--userc=/fixture/unselected", "--version"], ["--prefix=/fixture/unselected", "test"]])
          assert.throws(() => selectedToolInvocation("npm", args), error => error.code === "selected_npm_arguments_unclassified");
      });
      activeChild = true;
      const packageLedger = selectedExecutionLedger(selection);
      lastChild = await runCanonicalChild({ suite: "selected-pipeline", label: "npm abbreviated input override refusal", command: "npm",
        args: ["config", "get", "userconfig", "--userc=/fixture/unselected"], cwd: root, env: selectedEnv, timeoutMs: 1500, stdout: quiet, stderr: quiet, log() {},
        onLifecycle: event => appendOwnedChildLifecycleEvent(packageLedger.file, packageLedger.identity, event) });
      activeChild = !lastChild.cleanup_completed || !lastChild.streams_closed || !lastChild.exit_observed || lastChild.remaining_owned_processes !== 0;
      assert.equal(lastChild.exit_code, 126); assert.equal(activeChild, false);
      results.push({ label: "selected-package-tools", private_bin_precedes_package_shadow: true, python_flags: packageObservation.python_flags,
        unknown_absolute_tool_refused: true, abbreviated_npm_override_refused: true });
    }
    mkdirSync(path.join(selectedEnv.HOME, ".codex"), { mode: 0o700 });
    write(path.join(selectedEnv.HOME, ".codex", "config.toml"), 'model = "private-selected"\n');
    const ambient = path.join(root, `${label}.toml`), ready = path.join(root, `${label}.ready`), forbidden = path.join(root, `${label}.second`);
    write(ambient, 'model = "same-a"\n');
    const contract = freezeInputContract({ resources: [{ id: "fixture-preferences", file: ambient, classification: consumes ? "execution" : "ambient", excludePreferences: !consumes }],
      pathKind: "isolated-model-free-v1", binding: { fixture: "production-ineligible-pipeline" } });
    const binding = { head, tree, executor_fingerprint: digest("pipeline-fixture-source-v1"), plan_fingerprint: digest(["first", "second"]),
      consumer_map_fingerprint: selectedExecutionEvidence(selection).consumer_map_fingerprint };
    mkdirSync(path.join(root, ".augnes-local-verification", "logs", label), { recursive: true, mode: 0o700 });
    const selected = retainSelectedInputEvidence({ root, checkoutOwner, runId: label, binding, resources: selectedExecutionRetainedResources(selection) });
    const controller = new AbortController(), monitor = monitorInputContract(contract, controller, { intervalMs: 10 });
    let mutated = false, admissions = 0;
    const mutate = setInterval(() => { if (!mutated && existsSync(ready)) { mutated = true; write(ambient, 'model = "same-b"\n'); monitor.check(); } }, 10);
    const phase = (suffix, args) => ({ id: `${label}-${suffix}`, label: `fixture ${label} ${suffix}`, command: "node", args,
      display: `node fixture-${suffix}`, cwdScope: "root", timeoutMs: 3000, exclusive: false, browser: false });
    const phases = [phase("first", [childFile, consumes ? ambient : "private", ready]),
      phase("second", ["-e", `require('fs').writeFileSync(${JSON.stringify(forbidden)},'executed')`])];
    let phaseResults;
    try {
      phaseResults = await withSelectedExecution(selection, () => runPhasesSequentially({ phases, signal: controller.signal,
        execute: async current => { monitor.check(); assert.equal(controller.signal.aborted, false, "latched fault must stop phase admission"); admissions++; activeChild = true;
          const result = await executePhase({ phase: current, mode: "quick", runLogRoot: phaseLogRoot, isolatedResources: resources, signal: controller.signal, invocationId });
          lastChild = { exit_observed: result.cleanup.exit_observed, streams_closed: result.cleanup.streams_closed,
            cleanup_completed: result.cleanup.completed, remaining_owned_processes: result.cleanup.remaining_owned_processes };
          activeChild = !lastChild.cleanup_completed || !lastChild.exit_observed || !lastChild.streams_closed || lastChild.remaining_owned_processes !== 0;
          return result; } }));
    } finally { clearInterval(mutate); monitor.stop(); }
    assert.equal(mutated, true); assert.equal(admissions, consumes ? 1 : 2); assert.equal(existsSync(forbidden), !consumes);
    const first = readFileSync(path.join(phaseLogRoot, `${label}-first.log`), "utf8");
    assert.match(first, consumes ? /same-a/u : /private-selected/u); assert.equal(first.includes("same-b"), false);
    assert.equal(contract.snapshot().first_fault?.disposition ?? null, consumes ? "input_invalidation" : null);
    assert.equal(phaseResults[0].status, consumes ? "failure" : "pass");
    if (consumes) { const latched = structuredClone(contract.snapshot().first_fault); write(ambient, 'model = "same-a"\n'); contract.check(); assert.deepEqual(contract.snapshot().first_fault, latched); }
    const ledger = selectedExecutionLedger(selection);
    const children = retainOwnedChildLifecycleEvidence({ root, checkoutOwner, runId: label, binding, file: ledger.file, identity: ledger.identity });
    assert.equal(children.complete, true); assert.equal(activeChild, false);
    records.push({ label, binding, selected, children });
    const cleanup = cleanupIsolatedInvocationResources(resources, { consumersSettled: !activeChild }); resources = null; assert.equal(cleanup.completed, true);
    results.push({ label, admissions, second_phase_executed: existsSync(forbidden), first_fault: contract.snapshot().first_fault?.disposition ?? null,
      phase_results: phaseResults.map(result => ({ id: result.id, status: result.status, cleanup: result.cleanup })) });
  }
  resources = createIsolatedInvocationResources("3".repeat(32), { repositoryRoot: root });
  const freshSelection = isolatedInvocationSelection(resources), currentResources = selectedExecutionRetainedResources(freshSelection);
  const request = path.join(root, "cold.json"); write(request, JSON.stringify({ fixture_identity: "production-ineligible-selected-pipeline", root, records, currentResources }));
  const cold = JSON.parse(await fixtureChild(process.execPath, [fileURLToPath(new URL("./fixtures/local-canonical-selected-pipeline-reader.mjs", import.meta.url)), request], "fresh pipeline retained reader"));
  assert.notEqual(cold.reader_pid, process.pid); assert.equal(cold.results.length, 2); assert(cold.results.every(result => result.valid));
  assert.equal(cleanupIsolatedInvocationResources(resources, { consumersSettled: !activeChild }).completed, true); resources = null;
  for (const name of ["nonconsuming-first", "nonconsuming-second", "consuming-first"]) write(path.join(evidenceRoot, `${name}.log`), readFileSync(path.join(phaseLogRoot, `${name}.log`)));
  console.log(JSON.stringify({ test: "selected-pipeline", production_eligible: false, full_executor_admission: "NOT_RUN", results,
    fresh_retained_evidence: cold.results, actual_log_directory: path.relative(implementationRoot, evidenceRoot), duration_ms: Date.now() - started }));
} finally {
  if (existsSync(phaseLogRoot)) for (const name of readdirSync(phaseLogRoot)) {
    assert(/^(?:nonconsuming|consuming)-(?:first|second)\.log$/u.test(name));
    write(path.join(evidenceRoot, name), readFileSync(path.join(phaseLogRoot, name)));
  }
  if (resources) assert.equal(cleanupIsolatedInvocationResources(resources, { consumersSettled: !activeChild }).completed, true);
  if (checkoutOwner) releaseCheckoutVerificationOwnership(checkoutOwner, root, { consumersSettled: !activeChild });
  if (!activeChild && lastChild) settleCanonicalTestResourceUse(owner, lastChild);
  const [cleanup] = cleanupCanonicalTestResources([owner]); assert.equal(cleanup.completed, true, JSON.stringify(cleanup));
  if (!activeChild) rmSync(phaseLogRoot, { recursive: true, force: true });
}
