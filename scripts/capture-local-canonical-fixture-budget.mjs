#!/usr/bin/env node
// Explicit development capture. Importing a witness reader never runs this
// command, collects GitHub authority or reserves a qualification invocation.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, realpathSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { runCanonicalChild } from "./canonical-child-runner.mjs";
import { createCanonicalTestResourceRoot, cleanupCanonicalTestResources } from "./canonical-test-environment.mjs";
import { observeCanonicalRuntimeInputs, observePreparedDependencyInputs, digest } from "./local-canonical-inputs.mjs";
import { observePureContractSource, observePureContractLoader } from "./local-canonical-pure-contract-witness.mjs";
import { FIXTURE_BUDGET_PATHS, registeredFixtureBudget, fixtureBudgetEnvironment } from "./local-canonical-fixture-budget-witness.mjs";
import { collectHostEnvironment } from "./local-canonical-environment.mjs";
import { admitVerificationContext } from "./local-canonical-verification-context.mjs";
import { observeGitRevisionTarget, phaseEnvironment } from "./run-local-canonical-verification.mjs";
import { AUXILIARY_EXECUTION_BUDGETS } from "./local-canonical-closeout-budgets.mjs";
import { acquireVerificationCapacity, releaseVerificationCapacity } from "./local-canonical-capacity.mjs";
import { acquireCheckoutVerificationOwnership, releaseCheckoutVerificationOwnership } from "./local-canonical-checkout-ownership.mjs";
import { createIsolatedInvocationResources, cleanupIsolatedInvocationResources } from "./local-canonical-isolated-resources.mjs";

const [directory,role,group,...extra]=process.argv.slice(2);
const integration = role === "integration" && group === "external-response";
const maintenance = group === "local-canonical-maintenance";
if(extra.length||!integration&&!["direct","registered"].includes(role)||!group||!directory)
  throw new Error("usage: capture-local-canonical-fixture-budget.mjs <existing-output-directory> <direct|registered|integration> <group>");
if (maintenance && role!=="direct") throw new Error("fixture_budget_direct_registration_required");
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
assert.equal(realpathSync(process.cwd()),root);
const out=realpathSync(directory),git=args=>execFileSync("git",["--no-replace-objects",...args],{cwd:root,timeout:10000,maxBuffer:16*1024*1024});
if([role+".json",role+".log",role+"-lifecycle.log",role+"-collector.log"].some(file=>existsSync(path.join(out,file))))throw new Error("fixture_budget_capture_exists");
const artifact=(name,value)=>{const data=Buffer.from(typeof value==="string"?value:JSON.stringify(value,null,2)+"\n");writeFileSync(path.join(out,name),data,{flag:"wx",mode:0o600});return{artifact:name,sha256:digest(data)};};
if (integration) await captureIntegration();
else await captureReviewedFixture();

async function captureIntegration() {
  const context = admitVerificationContext({ repositoryRoot: root, kind: "isolated-worktree" });
  const host = collectHostEnvironment(root);
  const invocationId = randomBytes(16).toString("hex");
  const args = ["run", "test:integration", "--", "--external-response-only"];
  const observe = async () => {
    const runtime = observeCanonicalRuntimeInputs();
    return {
      source: observePureContractSource(root),
      dependencies: observePreparedDependencyInputs({ repositoryRoot: root, phaseId: "dependencies-root" }),
      loader: observePureContractLoader(root),
      runtime,
      target: await observeGitRevisionTarget(context, host.browserExecutablePath, runtime),
    };
  };
  const controller = new AbortController();
  for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => controller.abort());
  let lease, owner, resources, result, before, after, environment, cleanup, ownership, error, started_at;
  let output = "", lifecycle = "", outputBytes = 0, truncated = false;
  const sink = { write(chunk) {
    outputBytes += Buffer.byteLength(chunk);
    if (outputBytes <= 2 * 1024 * 1024) output += chunk;
    else truncated = true;
  } };
  try {
    lease = acquireVerificationCapacity({ context, host: host.public, invocationId });
    owner = acquireCheckoutVerificationOwnership({ repositoryRoot: root });
    before = await observe();
    resources = createIsolatedInvocationResources(invocationId);
    environment = phaseEnvironment({ isolatedResources: resources,
      browserExecutablePath: host.browserExecutablePath, runtimeInputs: before.runtime });
    started_at = new Date().toISOString();
    result = await runCanonicalChild({
      suite: "fixture-budget-capture", label: "integration registered fixture allowance",
      command: "npm", args, cwd: root, env: environment,
      timeoutMs: AUXILIARY_EXECUTION_BUDGETS.reviewHarnessMs, signal: controller.signal,
      stdout: sink, stderr: sink, log(line) { lifecycle += line + "\n"; },
    });
    after = await observe();
  } catch (cause) {
    error = cause;
  } finally {
    const consumersSettled = !result || result.exit_observed && result.streams_closed &&
      result.cleanup_completed && result.remaining_owned_processes === 0;
    const finalize = action => {
      try { return action(); }
      catch (cause) { error ??= cause; return null; }
    };
    if (resources) cleanup = finalize(() => cleanupIsolatedInvocationResources(resources, { consumersSettled }));
    ownership = {
      checkout: owner ? finalize(() => releaseCheckoutVerificationOwnership(owner, root, { consumersSettled })) : null,
      capacity: lease ? finalize(() => releaseVerificationCapacity(lease, { consumersSettled })) : null,
    };
  }
  const record = {
    contract: "augnes.registered-integration-budget-witness.v1",
    basis: "actual-owned-development-invocation", group, command: ["npm", ...args].join(" "),
    tested_source_head: before?.source.head, tree: before?.source.tree,
    started_at, finished_at: new Date().toISOString(), result, before, after, environment,
    cleanup, ownership, truncated, host: host.public, capacity: lease, checkout: owner?.metadata,
    stdout: artifact(role + ".log", output),
    lifecycle: artifact(role + "-lifecycle.log", lifecycle),
    collector: artifact(role + "-collector.log", readFileSync(fileURLToPath(import.meta.url), "utf8")),
    ...(error ? { capture_error: error.code ?? error.name } : {}),
  };
  const ref = artifact(role + ".json", record);
  console.log(JSON.stringify({ record: ref, head: before?.source.head, result, cleanup, ownership,
    capture_error: record.capture_error }));
  if (error || result?.exit_code !== 0 || result?.timed_out || result?.cancelled ||
      result?.termination_reason !== "natural_exit" || !cleanup?.completed ||
      !ownership.checkout?.released || !ownership.capacity?.released || truncated) process.exitCode = 1;
}

async function captureReviewedFixture() {
const source_before=observePureContractSource(root),registration=registeredFixtureBudget(git,source_before.head,group);
const config=["package.json","package-lock.json","tsconfig.json","scripts/browser-verification-owners.v1.json","scripts/local-canonical-change-owners.v1.json","scripts/canonical-research-tests.v1.json"].map(file=>({path:file,sha256:digest(readFileSync(path.join(root,file)))}));
const dependencies_before=observePreparedDependencyInputs({repositoryRoot:root,phaseId:"dependencies-root"}),runtime_before=observeCanonicalRuntimeInputs();
const context=admitVerificationContext({repositoryRoot:root,kind:"isolated-worktree"}),host=collectHostEnvironment(root);
const input_inventory_before=(await observeGitRevisionTarget(context,host.browserExecutablePath,runtime_before)).inputInventory;
const args=maintenance?registration.command.slice(1):role==="direct"?["--import","tsx",FIXTURE_BUDGET_PATHS.wrapper,"--reviewed-revision-controls",group]:[FIXTURE_BUDGET_PATHS.suite,"authority","--reviewed-revision-only"];
const owner=createCanonicalTestResourceRoot("ag-resource-test-",{shortSocketPaths:true});
let output="",lifecycle="",result,owned_cleanup,environment_before,loader_before,error;
const started_at=new Date().toISOString();
try {
  environment_before=fixtureBudgetEnvironment(owner.root);loader_before=observePureContractLoader(root,environment_before);
  result=await runCanonicalChild({suite:"fixture-budget-capture",label:role+" registered fixture allowance",command:process.execPath,args,cwd:root,env:environment_before,
    resourceOwner:owner,timeoutMs:maintenance?registration.bound_ms:role==="direct"?registration.limits[group].outer:AUXILIARY_EXECUTION_BUDGETS.reviewHarnessMs,
    stdout:{write(chunk){output+=chunk;}},stderr:{write(chunk){output+=chunk;}},log(line){lifecycle+=line+"\n";}});
} catch(e) { error=e; }
finally { owned_cleanup=cleanupCanonicalTestResources([owner]); }
// Save the original process streams even if a later source/input read refuses.
const stdout=artifact(role+".log",output),lifecycleRef=artifact(role+"-lifecycle.log",lifecycle),collector=artifact(role+"-collector.log",readFileSync(fileURLToPath(import.meta.url),"utf8"));
let observations={};
try {
  const runtime_after=observeCanonicalRuntimeInputs();
  observations={source_after:observePureContractSource(root),dependencies_after:observePreparedDependencyInputs({repositoryRoot:root,phaseId:"dependencies-root"}),runtime_after,
    input_inventory_after:(await observeGitRevisionTarget(context,host.browserExecutablePath,runtime_after)).inputInventory,
    environment_after:fixtureBudgetEnvironment(owner.root),loader_after:observePureContractLoader(root)};
} catch(e) { error??=e; }
const record={contract:"augnes.registered-fixture-budget-witness.v1",basis:"actual-owned-development-invocation",role,command:["node",...args].join(" "),tested_source_head:source_before.head,tree:source_before.tree,dirty:"",
  source_before,config,dependencies_before,runtime_before,runtime_inputs_sha256:digest(runtime_before),node_version:process.versions.node,input_inventory_before,
  environment_before,environment:digest(environment_before),resource_root:owner.root,loader_before,started_at,finished_at:new Date().toISOString(),result,owned_cleanup,
  stdout,lifecycle:lifecycleRef,collector,...observations,...(error?{capture_error:error.code??error.message}:{})};
const ref=artifact(role+".json",record);
console.log(JSON.stringify({record:ref,head:record.tested_source_head,role,result,owned_cleanup,...(error?{capture_error:record.capture_error}:{})}));
if(error||result?.exit_code!==0||result?.timed_out||result?.cancelled||!result?.cleanup_completed||owned_cleanup.some(v=>!v.completed))process.exitCode=1;
}
