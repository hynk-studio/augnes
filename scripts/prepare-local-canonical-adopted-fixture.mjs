#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkoutVerificationFingerprint } from "./local-canonical-checkout-ownership.mjs";
import { COMPANION_MATRIX_INTEGRATION, findCompanionMatrixCheckout } from "./local-canonical-companion-matrix-integration.mjs";
import { assertDecidingEnvironment, collectHostEnvironment, evaluateNodePolicy, FULL_MINIMUM_DISK_BYTES } from "./local-canonical-environment.mjs";
import { digest, observePreparedDependencyInputs } from "./local-canonical-inputs.mjs";
import { ADOPTED_FIXTURE_MERGE, ORDINARY_WATCHDOG_INTEGRATION, retainedBytes } from "./local-canonical-ordinary-watchdog-integration.mjs";
import { canonicalSerialize } from "./local-canonical-receipt.mjs";
import { admitVerificationContext, verificationAnchorRoot } from "./local-canonical-verification-context.mjs";
import { INTEGRATION_ACCEPT, integrationTarget, isAdoptedFixtureMerge, observeReviewedIntegrationSource, prepareAcceptedMainIntegrationCandidate,
  readSourceCorrectionProof, reconstructAttemptTip, REVIEWED_REVISION_PHASES } from "./local-canonical-attempts.mjs";
import { observeGitRevisionTarget, observeRevisionInputs, resolveVerificationPlan } from "./run-local-canonical-verification.mjs";

const [mode, folder, basis, pr, ...extra] = process.argv.slice(2);
const choices = new Map([["ordinary", ORDINARY_WATCHDOG_INTEGRATION], ["companion", COMPANION_MATRIX_INTEGRATION]]);
assert(typeof folder === "string" && extra.length === 0 && (mode === "collect" && choices.has(basis) && /^[1-9]\d*$/u.test(pr) && Number.isSafeInteger(Number(pr)) ||
  mode === "prepare" && basis === undefined || mode === "source" && /^[a-f0-9]{40}$/u.test(folder) && basis === undefined),
  "usage: source MERGE_SHA   or   collect FOLDER ordinary|companion PR   or   prepare FOLDER");
const root = realpathSync(process.cwd());
assert.equal(root, path.dirname(path.dirname(fileURLToPath(import.meta.url))), "run in the candidate checkout");
const git = args => execFileSync("git", ["--no-replace-objects", ...args], {cwd:root, timeout:10000, maxBuffer:16*1024*1024});
if (mode === "source") {
  const [predecessor,acceptedMain] = git(["show","-s","--format=%P",folder]).toString().trim().split(" ");
  const source = observeReviewedIntegrationSource(root,{predecessor,acceptedMain,commit:folder,head:folder,deliveryRevision:ADOPTED_FIXTURE_MERGE});
  console.log(JSON.stringify({stage:"source_only",predecessor,second_parent:acceptedMain,source,authorized:false,reserved:false}));
} else {
  await prepareOnRegisteredCheckout();
}

async function prepareOnRegisteredCheckout() {
  const dir = path.resolve(root, folder);
  assert.equal(dir, realpathSync(dir));
  assert.equal(path.dirname(dir), path.join(root, ".augnes-local-verification"));
  assert(/^[A-Za-z0-9_-]+$/u.test(path.basename(dir)), "use a local evidence directory");
  const rev = name => git(["rev-parse", name]).toString().trim();
  const branch = git(["symbolic-ref","--short","HEAD"]).toString().trim();
  const head = rev("HEAD"), base = rev("refs/remotes/origin/main"), tree = rev("HEAD^{tree}");
  assert.equal(git(["status","--porcelain=v1"]).length, 0, "candidate checkout must be clean");
  const context = admitVerificationContext({repositoryRoot:root,kind:"isolated-worktree"});
  const anchorRoot = verificationAnchorRoot(context), host = collectHostEnvironment(root);
  assertDecidingEnvironment({host:host.public,nodePolicy:evaluateNodePolicy(),diskMinimumBytes:FULL_MINIMUM_DISK_BYTES});
  assert(host.browserExecutablePath, "browser unavailable");

  const relative = name => path.relative(root,path.join(dir,name));
  const bytes = name => retainedBytes(root,relative(name),2*1024*1024,()=>{});
  const json = name => JSON.parse(bytes(name));
  const ref = name => ({artifact:name,sha256:digest(bytes(name))});
  function put(name, content) {
    try { writeFileSync(path.join(dir,name),content,{flag:"wx",mode:0o600}); }
    catch (error) {
      if (error.code !== "EEXIST") throw error;
      assert(bytes(name).equals(Buffer.from(content)), "different retained bytes at " + name);
    }
    return ref(name);
  }
  const putJSON = (name, value) => put(name,canonicalSerialize(value) + "\n");
  const receiptPath = id => ".augnes-local-verification/receipts/" + id + ".json";
  const physical = (checkout, name) => retainedBytes(checkout,name,2*1024*1024,()=>{});
  const readLog = (checkout, id, phase) => physical(checkout,".augnes-local-verification/logs/" + id + "/" + phase + ".log");

  if (mode === "collect") {
    const tip = reconstructAttemptTip({anchorRoot,repositoryRoot:root,branch});
    assert(/^[\w-]+$/u.test(tip.attempt_id));
    const receipt = JSON.parse(physical(root,receiptPath(tip.attempt_id)));
    const prior = receipt.repository.head_sha;
    const integration = {...observeReviewedIntegrationSource(root,{predecessor:prior,acceptedMain:base,commit:head,head,
      deliveryRevision:ADOPTED_FIXTURE_MERGE}),predecessor_basis:choices.get(basis)};
    const plan = resolveVerificationPlan({mode:"changed",baseSha:base,headSha:head});
    assert(plan.planner_status === "pass" && plan.planner_plan === "full-canonical");
    const planner = putJSON("planner.json",{base,head,selected_plan:plan.selected_plan,phases:REVIEWED_REVISION_PHASES,owners:[...plan.planner_owner_ids].sort()});
    const proof = {schema:"augnes.local-canonical-source-correction.v2",kind:"accepted_main_integration",integration_case:"reviewed",
      branch,base,accepted_main:base,head,tree,pull_request:Number(pr),prior_family_id:tip.family_id,prior_number:tip.number,prior_attempt_id:tip.attempt_id,
      prior_receipt_fingerprint:receipt.integrity.content_fingerprint,prior_receipt_path:receiptPath(tip.attempt_id),
      integration,planner,review:null,budget:{initial:1,recovery:0},authorization:null};
    const evidence = {stock:ref("failed-stock.json")};
    if (basis === "ordinary") {
      evidence.log = put("failed-authority.log", readLog(root,tip.attempt_id,"authority"));
      evidence.accounting = ref("accounting.json");
    } else {
      const accepted = json("accepted-receipt.json");
      assert(/^[\w-]+$/u.test(accepted.run.id));
      const upstream = findCompanionMatrixCheckout(git,accepted);
      assert(bytes("accepted-receipt.json").equals(physical(upstream,receiptPath(accepted.run.id))), "upstream receipt changed");
      evidence.accepted_receipt = ref("accepted-receipt.json");
      evidence.accepted_stock = ref("accepted-stock.log");
      evidence.unit_log = put("failed-unit.log",readLog(root,tip.attempt_id,"unit"));
      evidence.accepted_unit_log = put("accepted-unit.log",readLog(upstream,accepted.run.id,"unit"));
    }
    const runtime = observeRevisionInputs(proof,host);
    const observed = await observeGitRevisionTarget(context,host.browserExecutablePath,runtime);
    const preparation = putJSON("preparation.json",{schema:"augnes.local-canonical-integration-preparation.v1",target:integrationTarget(proof),
      checkout_fingerprint:checkoutVerificationFingerprint(root),runtime_inputs:runtime,input_inventory:observed.inputInventory,inventory_sha256:observed.inventory,
      dependencies:["dependencies-root","dependencies-nested","dependencies-web-planning"].map(phaseId=>observePreparedDependencyInputs({repositoryRoot:root,phaseId}))});
    const delta = git(["diff","--binary","--no-ext-diff","--no-textconv",prior,head,"--"]);
    const fields = {schema:"augnes.local-canonical-candidate-review.v1",kind:proof.kind,head,tree,predecessor_head:prior,
      predecessor_tree:receipt.repository.tree_sha,delta_sha256:digest(delta),changed_paths:git(["diff","--name-only",prior,head,"--"]).toString().trim().split("\n").sort(),
      authority_reference:"https://github.com/hynk-studio/augnes/pull/" + pr,integration_sha256:digest(integration),planner_sha256:planner.sha256,preparation,
      [basis === "ordinary" ? "ordinary_watchdog_predecessor" : "companion_matrix_predecessor"]:evidence};
    putJSON("review-inputs.json", fields);
    putJSON("target.json", proof);
    const judgments = ["complete_integration","complete_overlaps","complete_corrections","verifier_policy_adjustments_only","affected_consumers",
      "authority_and_lineage","no_weakened_contract","complete_nonoverlap_adjustments","complete_correction_chain","settled_watchdog_evidence","adopted_watchdog_conditions"];
    putJSON("decision-template.json",{reviewer:null,implementation_actor:null,reviewed_at:null,source_review:"pending",no_write:null,
      disposition:"pending",judgments:Object.fromEntries(judgments.map(key=>[key,false]))});
    console.log(JSON.stringify({head,tree,folder:relative("target.json"),authorized:false,reserved:false}));
  } else {
    const target = json("target.json"), fields = json("review-inputs.json"), decision = json("decision.json");
    assert(isAdoptedFixtureMerge(target) && target.authorization === null && target.head === head && target.base === base && target.branch === branch && target.tree === tree);
    assert.deepEqual(Object.keys(decision).sort(),Object.keys(json("decision-template.json")).sort());
    assert(!Object.keys(decision).some(key=>Object.hasOwn(fields,key) || key === "report"), "decision cannot replace collected source evidence");
    const reportBytes = bytes("review.md");
    const report = put("review-"+digest(reportBytes)+".md",reportBytes);
    const record = {...fields,...decision,report};
    const review = putJSON("review-"+digest(record)+".json",record);
    const name = "pending-"+review.sha256+".json";
    putJSON(name,{...target,review});
    const proof = readSourceCorrectionProof(path.join(dir,name),root), runtimeInputs = observeRevisionInputs(proof,host);
    const result = await prepareAcceptedMainIntegrationCandidate({anchorRoot,repositoryRoot:root,proof,acceptedMain:base,runtimeInputs,
      live:()=>observeGitRevisionTarget(context,host.browserExecutablePath,runtimeInputs)});
    const acceptance = INTEGRATION_ACCEPT+"\n"+canonicalSerialize({target:integrationTarget(proof),review_sha256:review.sha256,
      independent_report_sha256:report.sha256,scope:"reviewed_integration"});
    console.log(JSON.stringify({...result,proof:relative(name),acceptance_body:acceptance}));
  }
}
