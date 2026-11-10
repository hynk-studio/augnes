#!/usr/bin/env node
// Explicit development capture. Importing a witness reader never runs this
// command, collects GitHub authority or reserves a qualification invocation.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, realpathSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { runCanonicalChild } from "./canonical-child-runner.mjs";
import { createCanonicalTestResourceRoot, cleanupCanonicalTestResources } from "./canonical-test-environment.mjs";
import { observeCanonicalRuntimeInputs, observePreparedDependencyInputs, digest } from "./local-canonical-inputs.mjs";
import { observePureContractSource, observePureContractLoader } from "./local-canonical-pure-contract-witness.mjs";
import { FIXTURE_BUDGET_PATHS, registeredFixtureBudget, fixtureBudgetEnvironment } from "./local-canonical-fixture-budget-witness.mjs";
import { collectHostEnvironment } from "./local-canonical-environment.mjs";
import { admitVerificationContext } from "./local-canonical-verification-context.mjs";
import { observeGitRevisionTarget } from "./run-local-canonical-verification.mjs";
import { AUXILIARY_EXECUTION_BUDGETS } from "./local-canonical-closeout-budgets.mjs";

const [directory,role,group,...extra]=process.argv.slice(2);
if(extra.length||!["direct","registered"].includes(role)||!group||!directory)throw new Error("usage: capture-local-canonical-fixture-budget.mjs <existing-output-directory> <direct|registered> <group>");
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
assert.equal(realpathSync(process.cwd()),root);
const out=realpathSync(directory),git=args=>execFileSync("git",["--no-replace-objects",...args],{cwd:root,timeout:10000,maxBuffer:16*1024*1024});
if([role+".json",role+".log",role+"-lifecycle.log",role+"-collector.log"].some(file=>existsSync(path.join(out,file))))throw new Error("fixture_budget_capture_exists");
const source_before=observePureContractSource(root),registration=registeredFixtureBudget(git,source_before.head,group);
const config=["package.json","package-lock.json","tsconfig.json","scripts/browser-verification-owners.v1.json","scripts/local-canonical-change-owners.v1.json","scripts/canonical-research-tests.v1.json"].map(file=>({path:file,sha256:digest(readFileSync(path.join(root,file)))}));
const dependencies_before=observePreparedDependencyInputs({repositoryRoot:root,phaseId:"dependencies-root"}),runtime_before=observeCanonicalRuntimeInputs();
const context=admitVerificationContext({repositoryRoot:root,kind:"isolated-worktree"}),host=collectHostEnvironment(root);
const input_inventory_before=(await observeGitRevisionTarget(context,host.browserExecutablePath,runtime_before)).inputInventory;
const artifact=(name,value)=>{const data=Buffer.from(typeof value==="string"?value:JSON.stringify(value,null,2)+"\n");writeFileSync(path.join(out,name),data,{flag:"wx",mode:0o600});return{artifact:name,sha256:digest(data)};};
const args=role==="direct"?["--import","tsx",FIXTURE_BUDGET_PATHS.wrapper,"--reviewed-revision-controls",group]:[FIXTURE_BUDGET_PATHS.suite,"authority","--reviewed-revision-only"];
const owner=createCanonicalTestResourceRoot("ag-resource-test-",{shortSocketPaths:true});
let output="",lifecycle="",result,owned_cleanup,environment_before,loader_before,error;
const started_at=new Date().toISOString();
try {
  environment_before=fixtureBudgetEnvironment(owner.root);loader_before=observePureContractLoader(root,environment_before);
  result=await runCanonicalChild({suite:"fixture-budget-capture",label:role+" registered fixture allowance",command:process.execPath,args,cwd:root,env:environment_before,
    resourceOwner:owner,timeoutMs:role==="direct"?registration.limits[group].outer:AUXILIARY_EXECUTION_BUDGETS.reviewHarnessMs,
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
