#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync, realpathSync } from "node:fs";
import { prepareSerialAggregateRevision } from "./local-canonical-attempts.mjs";
import { admitVerificationContext, verificationAnchorRoot } from "./local-canonical-verification-context.mjs";
import { collectHostEnvironment, assertDecidingEnvironment, evaluateNodePolicy, FULL_MINIMUM_DISK_BYTES } from "./local-canonical-environment.mjs";
import { observeRevisionInputs, observeGitRevisionTarget } from "./run-local-canonical-verification.mjs";

// Read-only preparation. No attempt owner, capacity lease, maintenance lease,
// grant, authorization capability, deciding phase or reservation is acquired.
if (process.argv.length !== 3) throw new Error("usage: prepare-local-canonical-serial-aggregate.mjs <material.json>");
const repositoryRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
if (realpathSync(process.cwd())!==repositoryRoot) throw new Error("revision_preparation_checkout_invalid");
const file=realpathSync(process.argv[2]);
if (!file.startsWith(path.join(repositoryRoot,".augnes-local-verification")+path.sep)) throw new Error("revision_preparation_path_invalid");
const p=JSON.parse(readFileSync(file,"utf8")), context=admitVerificationContext({repositoryRoot,kind:"isolated-worktree"});
const host=collectHostEnvironment(repositoryRoot);
assertDecidingEnvironment({host:host.public,nodePolicy:evaluateNodePolicy(),diskMinimumBytes:FULL_MINIMUM_DISK_BYTES});
if (!host.browserExecutablePath) throw new Error("revision_preparation_browser_unavailable");
const runtimeInputs=observeRevisionInputs(p,host), live=await observeGitRevisionTarget(context,host.browserExecutablePath,runtimeInputs);
const result=await prepareSerialAggregateRevision({file,repositoryRoot,predecessorRoot:repositoryRoot,
  anchorRoot:verificationAnchorRoot(context),runtimeInputs,live});
console.log(JSON.stringify({...result,context,host:host.public,deciding:false,independent_attestation:false}));
