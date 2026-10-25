import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createCanonicalTestResourceRoot, buildCanonicalChildEnvironment, cleanupCanonicalTestResources } from "./canonical-test-environment.mjs";
import { runCanonicalChild, canonicalChildAcceptanceFailure } from "./canonical-child-runner.mjs";
import { acquireCheckoutVerificationOwnership, releaseCheckoutVerificationOwnership } from "./local-canonical-checkout-ownership.mjs";
import { digest, freezeInputContract, monitorInputContract } from "./local-canonical-inputs.mjs";
import { retainSelectedInputEvidence, inspectRetainedSelectedInputs } from "./local-canonical-evidence-retention.mjs";
import { selectedExecutionRetainedResources, selectedExecutionEvidence, selectedExecutionResources,
  withSelectedExecution, selectedToolInvocation, selectedExecutionLedger, selectedExecutionLifecycle, resolveSelectedTool } from "./local-canonical-selected-execution.mjs";
import { selectedGitExecutable, loadSelectedGit, SELECTED_GIT_MANIFEST_ENV, SELECTED_GIT_MANIFEST_HASH_ENV } from "./local-canonical-selected-git.mjs";
import { appendOwnedChildLifecycleEvent, runOwnedSyncChild } from "./test-harness-process-lifecycle.mjs";

const implementationRoot = process.argv[2] === "--probe" ? path.resolve(process.argv[3]) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const api = await import(pathToFileURL(path.join(implementationRoot, "scripts/local-canonical-isolated-resources.mjs")));
const probeOnly = process.argv[2] === "--probe";
const owner = createCanonicalTestResourceRoot("ag-resource-test-");
const root = path.join(owner.root, "fixture-source"), outside = path.join(owner.root, "outside");
let resources, checkoutOwner;
const fixtureGit = process.env[SELECTED_GIT_MANIFEST_ENV]
  ? selectedGitExecutable(loadSelectedGit(process.env[SELECTED_GIT_MANIFEST_ENV], process.env[SELECTED_GIT_MANIFEST_HASH_ENV]))
  : resolveSelectedTool("git");
const git = (args) => {
  const result = runOwnedSyncChild(fixtureGit, args, { cwd: root, env: { PATH: process.env.PATH, HOME: outside,
    GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: path.join(outside,"gitconfig") }, encoding: "utf8", timeout: 5000 });
  assert.equal(result.status, 0, result.stderr); return result.stdout.trim();
};
const expectation = { quoted_unicode: true, npm_user_configuration: "private", nested_private_configuration: true };
const results = [];
try {
  mkdirSync(root); mkdirSync(outside);
  writeFileSync(path.join(outside,"gitconfig"), "[core]\nquotePath = false\n");
  git(["init", "--quiet"]); git(["remote", "add", "origin", "https://github.com/hynk-studio/augnes.git"]);
  writeFileSync(path.join(root,".gitignore"), ".augnes-local-verification/\n");
  writeFileSync(path.join(root,"package.json"), '{"name":"production-ineligible-fixture","version":"0.0.0","private":true}\n');
  git(["add", "."]); git(["-c","user.name=Fixture","-c","user.email=fixture@example.invalid","-c","commit.gpgsign=false","commit","--quiet","-m","fixture"]);
  git(["config","core.quotePath","false"]);
  writeFileSync(path.join(root,"한글.txt"), "fixture\n");
  resources = api.createIsolatedInvocationResources("1".repeat(32), { repositoryRoot: root });
  const environment = api.isolatedInvocationEnvironment(resources);
  const invoke = async (label, command, args, env = environment) => {
    let output = "", diagnostic = "";
    const selection = api.isolatedInvocationSelection?.(resources);
    const ledger = selection ? selectedExecutionLedger(selection) : null;
    const result = await runCanonicalChild({ suite: "selected-execution", label, command, args,
      cwd: root, env, timeoutMs: 10_000, stdout: {write: c => {output += c;}}, stderr: {write: c => {diagnostic += c;}}, log() {},
      ...(ledger ? { onLifecycle: event => appendOwnedChildLifecycleEvent(ledger.file, ledger.identity, event) } : {}) });
    assert.equal(canonicalChildAcceptanceFailure(result, {suite:"selected-execution",timeoutMs:10_000,requireNaturalExit:true}), null, diagnostic);
    return output.trim();
  };
  const before = await invoke("selected Git before external mutation", "git", ["status","--porcelain","--untracked-files=all"]);
  assert.match(before, /\\[0-7]{3}/u, "Git must consume selected quotePath policy, not repository/account configuration");
  git(["config","core.quotePath","true"]);
  writeFileSync(path.join(outside,"gitconfig"), "[core]\nquotePath = true\n[include]\npath = /not-present-fixture-input\n");
  const after = await invoke("selected Git after external mutation", "git", ["status","--porcelain","--untracked-files=all"]);
  assert.equal(after, before); results.push("actual Git consumer unchanged before/after external configuration mutation");
  const npmUser = await invoke("selected npm user input", "npm", ["config","get","userconfig"]);
  assert.equal(npmUser, environment.npm_config_userconfig);
  const nested = buildCanonicalChildEnvironment({ambientEnvironment:environment,temporaryRoot:owner.root});
  assert.equal(nested.npm_config_userconfig, npmUser); assert.equal(nested.PATH, environment.PATH);
  const nestedOutput = await invoke("nested actual Git reader", "git", ["status","--porcelain","--untracked-files=all"], nested);
  assert.equal(nestedOutput, before); results.push("npm selection and nested environment inheritance actually consumed");
  if (!probeOnly) {
    const selection = api.isolatedInvocationSelection(resources);
    const nestedProgram = `
      const api=await import(${JSON.stringify(pathToFileURL(path.join(implementationRoot,"scripts/local-canonical-isolated-resources.mjs")).href)});
      const selected=await import(${JSON.stringify(pathToFileURL(path.join(implementationRoot,"scripts/local-canonical-selected-execution.mjs")).href)});
      const {runCanonicalChild}=await import(${JSON.stringify(pathToFileURL(path.join(implementationRoot,"scripts/canonical-child-runner.mjs")).href)});
      const {appendOwnedChildLifecycleEvent}=await import(${JSON.stringify(pathToFileURL(path.join(implementationRoot,"scripts/test-harness-process-lifecycle.mjs")).href)});
      const {existsSync}=await import('node:fs');
      const resources=api.createIsolatedInvocationResources('2'.repeat(32),{repositoryRoot:process.cwd()});
      const context=api.isolatedInvocationSelection(resources), ledger=selected.selectedExecutionLedger(context);
      let snapshot;
      try {
        await selected.withSelectedExecution(context,async()=>{
          const child=await runCanonicalChild({suite:'nested-selection-proof',label:'actual grandchild Git',command:'git',args:['rev-parse','HEAD'],cwd:process.cwd(),env:api.isolatedInvocationEnvironment(resources),timeoutMs:2000,
            stdout:{write(){}},stderr:process.stderr,log(){},onLifecycle:event=>appendOwnedChildLifecycleEvent(ledger.file,ledger.identity,event)});
          if(child.exit_code!==0||!child.cleanup_completed)throw new Error('grandchild did not settle');
          snapshot=selected.selectedExecutionLifecycle(context);
          if(!snapshot.complete)throw new Error('nested local ledger must settle while its parent remains running');
        });
      }finally{
        const cleanup=api.cleanupIsolatedInvocationResources(resources,{consumersSettled:true});
        if(!cleanup.completed||existsSync(ledger.file))throw new Error('nested ledger cleanup failed');
      }
      console.log(JSON.stringify({nested_ids:snapshot.children.map(c=>c.child_id),nested_complete:snapshot.complete,nested_ledger_removed:!existsSync(ledger.file)}));
    `;
    const nestedProof = JSON.parse((await invoke("nested selection ancestor retention", process.execPath, ["--input-type=module", "-e", nestedProgram])).split("\n").at(-1));
    const ancestorSnapshot = selectedExecutionLifecycle(selection);
    assert.equal(nestedProof.nested_complete,true); assert.equal(nestedProof.nested_ledger_removed,true);
    assert(nestedProof.nested_ids.length >= 2);
    for(const id of nestedProof.nested_ids)
      assert.equal(ancestorSnapshot.children.find(child=>child.child_id===id)?.settlement,"settled","actual nested descendants remain in parent ledger after local cleanup");
    assert.equal(ancestorSnapshot.complete,true);
    results.push("ancestor ledger retains actual nested Git descendants after nested cleanup");
    const selectedFiles = selectedExecutionRetainedResources(selection);
    const head = git(["rev-parse","HEAD"]), tree = git(["rev-parse",`${head}^{tree}`]);
    const binding = { head, tree, executor_fingerprint:digest("fixture-current-source"), plan_fingerprint:digest(expectation),
      consumer_map_fingerprint:selectedExecutionEvidence(selection).consumer_map_fingerprint };
    checkoutOwner = acquireCheckoutVerificationOwnership({repositoryRoot:root});
    mkdirSync(path.join(root,".augnes-local-verification","logs","selected"),{recursive:true,mode:0o700});
    const retained = retainSelectedInputEvidence({root,checkoutOwner,runId:"selected",binding,resources:selectedFiles});
    assert.equal(inspectRetainedSelectedInputs({root,descriptor:retained,expectedBinding:binding,expectedResources:selectedFiles}).valid,true);
    assert.equal(selectedExecutionLifecycle(selection).complete,true);
    const privateConfig = selectedExecutionResources(selection).find(r=>r.id==="selected-npm-user-config");
    const controller = new AbortController();
    const contract = freezeInputContract({resources:[privateConfig],pathKind:"canonical-conservative-v1",binding:{fixture:true}});
    const monitor = monitorInputContract(contract,controller,{intervalMs:10});
    await withSelectedExecution(selection, () => {
      chmodSync(privateConfig.file,0o600); writeFileSync(privateConfig.file,"fund=false\n");
      monitor.check(); monitor.stop(); assert.equal(controller.signal.aborted,true);
      assert.equal(contract.snapshot().first_fault.disposition,"safety_violation");
      assert.throws(()=>selectedToolInvocation("/usr/bin/env",[]),/selected_tool_unclassified/u);
      assert.throws(()=>selectedToolInvocation("npm",["--userc=/fixture/unselected","--version"]),/selected_npm_arguments_unclassified/u);
      assert.throws(()=>selectedToolInvocation("node",["--version"]),/selected_execution_input_changed/u);
      assert.throws(()=>selectedToolInvocation("npm",["--version"]),/selected_execution_input_changed/u);
    });
    assert.throws(()=>api.isolatedInvocationEnvironment(resources),/selected_execution_input_changed/u);
    results.push("consumed private input mutation latches; refused requests cannot dispatch and accepted requests still recheck selection");
    const cleanup = api.cleanupIsolatedInvocationResources(resources,{consumersSettled:true}); resources=null;
    assert.equal(cleanup.completed,true);
    assert.equal(existsSync(privateConfig.file),false);
    assert.equal(inspectRetainedSelectedInputs({root,descriptor:retained,expectedBinding:binding,expectedResources:selectedFiles}).valid,true);
    results.push("retained historical selected bytes survive ordinary runtime cleanup");
  }
  console.log(JSON.stringify({test:"selected-execution",production_eligible:false,expectations_sha256:digest(expectation),results}));
} finally {
  if (resources) assert.equal(api.cleanupIsolatedInvocationResources(resources,{consumersSettled:true}).completed,true);
  if (checkoutOwner) releaseCheckoutVerificationOwnership(checkoutOwner,root);
  const [cleanup] = cleanupCanonicalTestResources([owner]); assert.equal(cleanup.completed,true,JSON.stringify(cleanup));
}
if (!probeOnly) await import("./test-local-canonical-bootstrap-lifecycle.mjs");
