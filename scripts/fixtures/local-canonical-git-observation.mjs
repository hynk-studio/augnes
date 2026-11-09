// Synthetic Git, ledger and authenticated read transport. No production admission.
import assert from "node:assert/strict";
import { chmodSync, cpSync, existsSync, linkSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { digest, INPUT_CONTRACT, inputEventIdentity, createGitTrackingResource, freezeInputContract } from "../local-canonical-inputs.mjs";
import { CANONICAL_NODE_VERSION } from "../local-canonical-environment.mjs";
import { finalizeReceipt } from "../local-canonical-receipt.mjs";
import { REVIEWED_REVISION_PHASES, reconstructAttemptTip, inspectGitRevisionPreparation, readSourceCorrectionProof, reviewedRevisionAuthorityObservation } from "../local-canonical-attempts.mjs";
import { GIT_INPUT_REVISION, GIT_INPUT_HISTORY_BOUNDARY, gitObservationIncident, gitRevisionInventory, gitReviewTarget, finalDependencyCommand, finalDependencyProbe, verifyGitRevisionFailure, verifyGitRevisionSuccess, postPassReviewFields } from "../local-canonical-git-observation.mjs";

import { runCanonicalChild } from "../canonical-child-runner.mjs";
import { behavior, dependencyRecords, executeFixture } from "./local-canonical-browser-successor.mjs";
import { fixtureNow } from "./local-canonical-authority-clock.mjs";

const time = offset => new Date(fixtureNow() + offset).toISOString();
const product = "apps/web_planning/src/client.js.txt", fixture = "scripts/fixture.mjs";
const phaseIds = REVIEWED_REVISION_PHASES;

export function gitFixtureDeclaration(c) {
  const node = c.inputs.node;
  const config = { ...structuredClone(node.observation), git_projection:{policy:"isolated-current-branches-v1", applicable:true,
    effective_sha256:digest("original effective config"), scope_fingerprint:digest("branches")} };
  const resource = (id, before) => ({id, classification:"execution", location_fingerprint:digest(id), before});
  return {contract:INPUT_CONTRACT, path_kind:"isolated-model-free-v1", binding:{head:c.acceptedHead},
    resources:[{...resource("git-config",config),gitTracking:{policy:"isolated-current-branches-v1",protected_branches:[digest(c.branch)]}},
      {...resource("node-executable",node.observation),location_fingerprint:node.location_fingerprint,readOnlyExecutable:true},
      ...["git-executable","browser-executable"].map(id=>({...resource(id,node.observation),readOnlyExecutable:true})),
      ...["codex-preferences","user-instructions","auth-location"].map(id=>({...resource(id,{present:false}),classification:"ambient"})),
      {...resource("node-headers",c.inputs.headers.observation),location_fingerprint:c.inputs.headers.location_fingerprint,nodeHeaders:true}]};
}

export function gitFixtureReceipt(c, raw) {
  const declared = c.gitDeclaration, config = structuredClone(c.gitChangedObservation ?? declared.resources[0].before);
  if (!c.gitChangedObservation) {
    config.sha256 = digest("changed file"); config.git_projection.effective_sha256 = digest("changed protected projection");
  }
  const diagnostic = {contract:"augnes.input-observation-failure.v1",stage:"metadata_consistency",code:"input_observation_race"};
  const event = (disposition, offset, ns, after, extra) => {
    const v = {resource:"git-config",classification:"execution",disposition,observed_at:time(offset),monotonic_ns:ns,after,...extra};
    return {...v,identity:inputEventIdentity(v)};
  };
  const race = event("observer_failure",-84000,"11",null,{diagnostic}), change = event("input_invalidation",-83000,"12",config);
  const fault = ({resource,disposition,observed_at,monotonic_ns,diagnostic}) => ({resource,disposition,observed_at,monotonic_ns,...(diagnostic?{diagnostic}:{})});
  const [pass,stop,unused] = raw.phases;
  return finalizeReceipt({...raw,run:{...raw.run,started_at:time(-100000)},phases:phaseIds.map((id,i)=>({...(i < 3 ? pass : i === 3 ? stop : unused),id})),
    inputs:{...declared,fingerprint:digest(declared),events:[race,change],first_fault:fault(race),secondary_faults:[fault(change)]},
    outcome:{...raw.outcome,disposition:"unknown_relevance",first_fault:fault(race)}});
}
// Exercise the same exclusive ledger, proof reader, authenticated capability and
// separate-process stock entry as the browser successor, using ordinary v10 inputs.
async function checkGitSourceSuccessor(c, h, initial, initialCapability) {
  const tip = () => reconstructAttemptTip({anchorRoot:c.anchor, repositoryRoot:c.checkout, branch:c.branch});
  const packages = dependencyRecords(c), firstAuthority = structuredClone(c.authority);
  const exe = c.gitDeclaration.resources.find(r => r.id === "browser-executable");
  const browser = {contract:"augnes.local-canonical-browser-use.v2",executable_name:"Fixture",location_fingerprint:exe.location_fingerprint,
    before:exe.before,after:exe.before,actual_version:"Chrome/1",runtime_versions:{http:"Chrome/1",cdp:"Chrome/1"},disposition:"unchanged",unchanged:true};
  const first = await executeFixture(c,h,initial,initialCapability,browser,packages);
  assert.equal(first.stock.valid_deciding_evidence,false);
  assert.match(first.child.output,/3 !== 4/);
  const consumed = tip();
  assert.equal(consumed.reviewed_revision_consumed,1);
  const priorFolder = c.artifacts, previous = c.head;
  const red = await behavior(c,false,h.run);
  const oldBlob = digest(c.git(["show",previous+":"+fixture]));
  const url = type => "https://github.com/hynk-studio/augnes/pull/999#"+type+"-";
  const comment = url("issuecomment"), reviewUrl = url("pullrequestreview");
  const delegation = {...firstAuthority.grant,id:13,created_at:time(0),body:[
    "Authorize one cohesive correction and qualification assignment for issue #123 on "+c.branch+" and Draft PR #999.\n\n## Delegated recording after independent review\n\nAfter a separate read-only reviewer accepts the actual final published source, the implementation operator is explicitly authorized to publish the required separate exact-candidate execution record through the existing authenticated maintainer identity under this delegation.\n",c.branch,first.receipt.run.id,first.receipt.integrity.content_fingerprint,
    initial.prior_receipt_fingerprint,consumed.revision_commission,comment+firstAuthority.grant.id].join("\n")};
  delegation.updated_at=delegation.created_at;
  c.prior=first.receipt;c.grantId=14;
  c.commit(4);
  h.prepare(c,2);
  const p=c.proof;
  p.schema=initial.schema;
  Object.assign(p.commission,{initial_accepted:initial.accepted,initial_authorization:initial.authorization,
    delegation:{id:delegation.id,sha256:digest(reviewedRevisionAuthorityObservation(delegation,"task_delegation"))}});
  p.accepted={base:p.base,head:p.head,tree:p.tree};
  p.inputs.predecessor_sha256=initial.inputs.identity_sha256;p.inputs.inventory_sha256=initial.inputs.inventory_sha256;
  p.originals.stock=h.artifact(c,"prior-stock.log",JSON.stringify(first.stock));
  const artifact=(name,value)=>h.artifact(c,name,value);
  const get=ref=>h.read(path.join(c.artifacts,ref.artifact));
  p.source=artifact("source.json",{...get(p.source),reviewed_at:time(0)});
  const green=await behavior(c,false,h.run);
  assert.equal(red.result.exit_code,1);assert.equal(green.result.exit_code,0);
  const witness=(run,hash,label)=>artifact(label+".json",{...run,node_version:CANONICAL_NODE_VERSION,file_sha256:hash,
    runtime_inputs_sha256:p.inputs.identity_sha256,stdout:artifact(label+".log",run.output)});
  const before=witness(red,oldBlob,"red"),after=witness(green,digest(c.git(["show",p.head+":"+fixture])),"green");
  const focus={...get(p.focused),finished_at:green.finished_at,input_remedy_resources:[],failed_phase:"authority",
    diagnosis:"The executed fixture asserted the wrong value on the first reviewed candidate.",regression:{path:fixture,before,after},
    commands:[{command:green.command,tested_source_head:p.head,result:green.result,record:after,stdout:get(after).stdout}]};
  p.focused=artifact("focused.json",focus);
  const prepFile=path.join(c.artifacts,"preparation.json");
  const prepare=(candidate,live=c.live)=>{
    const material=structuredClone(candidate);delete material.authorization;delete material.accepted.review;h.write(prepFile,material);
    return inspectGitRevisionPreparation({file:prepFile,repositoryRoot:c.checkout,predecessorRoot:c.checkout,anchorRoot:c.anchor,runtimeInputs:c.inputs,live});
  };
  const prepared=prepare(p), target=gitReviewTarget(p);
  assert.equal(prepared.consumed,1);assert.equal(prepared.ordinal,2);assert.equal(prepared.target,target);assert.equal(prepared.reserved,false);
  for (const mutate of [q=>q.commission.ordinal=1,q=>q.commission.ordinal=3,q=>q.commission.root_family_id=digest("fork"),
    q=>q.commission.initial_accepted.review.id++,q=>q.commission.initial_authorization.grant_sha256=digest("replacement"),
    q=>q.prior_receipt_fingerprint=initial.prior_receipt_fingerprint,q=>Object.assign(q,{head:previous,tree:initial.tree})]) {
    const bad=structuredClone(p);mutate(bad);assert.throws(()=>prepare(bad));
  }
  assert.throws(()=>prepare(p,{...c.live,inventory:digest("protected input changed")}));
  for(const name of [path.join(priorFolder,initial.originals.stock.artifact),path.join(c.artifacts,p.originals.stock.artifact),
    path.join(c.anchor,".augnes-local-verification/families",p.prior_family_id,"completion-1.json")]){
    const raw=readFileSync(name);h.write(name,Buffer.concat([raw,Buffer.from("\n")]));
    try{assert.throws(()=>prepare(p));}finally{h.write(name,raw);}
  }
  const wrong={...focus,regression:{...focus.regression,before:after}};
  assert.throws(()=>prepare({...p,focused:artifact("wrong.json",wrong)}),/revision_git_regression_invalid/);
  // All three synthetic trees differ, including when only the executable bit changes.
  const oldText=c.git(["show",previous+":"+fixture]).toString();
  for (const [content, executable] of [[oldText,true],[oldText.replace("value=","value = "),false],[oldText.replace("value=","value = "),true]]) {
    h.write(path.join(c.checkout,fixture),content);
    c.git(["add",fixture]);
    if (executable) c.git(["update-index","--chmod=+x",fixture]);
    const tree=c.git(["write-tree"]).toString().trim();
    const head=c.git(["-c","user.name=Fixture","-c","user.email=fixture@example.invalid","commit-tree",tree,"-p",previous,"-m","cosmetic"]).toString().trim();
    c.git(["restore","--source=HEAD","--staged","--worktree","--",fixture]);
    const diff=from=>{const bytes=c.git(["diff","--binary","--full-index","--no-ext-diff","--no-textconv",from,head,"--"]);
      return {bytes:bytes.length,sha256:digest(bytes),paths:c.git(["diff","--name-only",from,head,"--"]).toString().trim().split("\n").filter(Boolean).sort()};};
    const source={...get(p.source),main_to_final:diff(p.base),accepted_to_final:diff(previous),predecessor_to_final:diff(previous)};
    assert.throws(()=>prepare({...p,head,tree,accepted:{base:p.base,head,tree},source:artifact("cosmetic.json",source)}),/revision_material_remedy_required/);
  }
  const finalTarget=prepare(p).target;
  const pause=()=>new Promise(r=>setTimeout(r,5));await pause();
  const review={...firstAuthority.review,id:12,submitted_at:time(0),commit_id:p.head,body:[
    "Source review decision: ACCEPT / RETAIN for prospective qualification.",p.base,p.head,p.tree,p.prior_receipt_fingerprint,finalTarget].join("\n")};
  await pause();
  const grant={...firstAuthority.grant,id:14,created_at:time(0),body:["Authorize ordinal two of the original reviewed Git-observation commission.",
    p.schema,p.head,p.tree,p.base,p.branch,p.prior_receipt_fingerprint,finalTarget,p.commission.root_receipt_fingerprint,consumed.revision_commission,
    comment+delegation.id,comment+firstAuthority.grant.id,reviewUrl+review.id,"Separate fresh-process stock and independent audit."].join("\n")};
  grant.updated_at=grant.created_at;
  c.authority={review,grant,pr:{...firstAuthority.pr,head:{...firstAuthority.pr.head,sha:p.head}},linked:{
    ["repos/hynk-studio/augnes/pulls/999/reviews/"+firstAuthority.review.id]:firstAuthority.review,
    ["repos/hynk-studio/augnes/issues/comments/"+firstAuthority.grant.id]:firstAuthority.grant,
    ["repos/hynk-studio/augnes/issues/comments/"+delegation.id]:delegation}};
  p.accepted.review={id:review.id,sha256:digest(reviewedRevisionAuthorityObservation(review,"accepted_revision"))};
  p.authorization={grant_comment_id:grant.id,grant_sha256:digest(reviewedRevisionAuthorityObservation(grant,"execution_commission"))};
  h.write(c.file,p);const proof=h.proof(c);
  for(const id of [review.id,grant.id,delegation.id,firstAuthority.grant.id,firstAuthority.review.id]) {
    await assert.rejects(h.auth(c,proof,(v,endpoint)=>endpoint.endsWith("/"+id)?{...v,body:"edited"}:v));
  }
  await assert.rejects(h.auth(c,proof,(v,endpoint)=>endpoint.endsWith("/"+grant.id)?null:v));
  await assert.rejects(h.auth(c,proof,(v,endpoint)=>endpoint.includes("/permission")?{...v,permission:"read"}:v));
  // Rebind the review and new grant to the altered delegation itself. A hash
  // mismatch must not mask an inoperative or negative delegation decision.
  const opening = delegation.body.split("\n")[0];
  const affirmative = delegation.body.split("\n\n")[2].split("\n")[0];
  for (const body of [
    delegation.body.replace(opening,"Authorize only an investigation. The operator must not publish a grant or execute qualification."),
    delegation.body.replace(affirmative,"Keep execution on hold. The operator has no publication authority."),
    delegation.body.replace(affirmative,"> "+affirmative),
    delegation.body.replace("## Delegated recording after independent review","Grant publication is denied.\n\n<!--\n\n## Delegated recording after independent review")+"\n\n-->",
    delegation.body.replace("## Delegated recording after independent review","<details>\n\n## Delegated recording after independent review")+"\n\n</details>",
    delegation.body.replace("## Delegated recording after independent review","~~~text\n\n## Delegated recording after independent review")+"\n~~~"
  ]) {
    const changed={...delegation,body}, q=structuredClone(p);
    q.commission.delegation.sha256=digest(reviewedRevisionAuthorityObservation(changed,"task_delegation"));
    const replacementTarget=gitReviewTarget(q);
    const r={...review,body:review.body.replace(finalTarget,replacementTarget)}, g={...grant,body:grant.body.replace(finalTarget,replacementTarget)};
    q.accepted.review.sha256=digest(reviewedRevisionAuthorityObservation(r,"accepted_revision"));
    q.authorization.grant_sha256=digest(reviewedRevisionAuthorityObservation(g,"execution_commission"));
    h.write(c.file,q);
    const records={...c.authority,review:r,grant:g,linked:{...c.authority.linked,["repos/hynk-studio/augnes/issues/comments/"+changed.id]:changed}};
    await assert.rejects(h.auth({...c,authority:records},h.proof(c)),/revision_authority_scope_invalid/);
  }
  for (const omit of [comment+delegation.id, comment+firstAuthority.grant.id, reviewUrl+review.id, consumed.revision_commission]) {
    const incomplete = {...grant, body:grant.body.replace(omit, "")};
    const altered = {...p, authorization:{grant_comment_id:grant.id, grant_sha256:digest(reviewedRevisionAuthorityObservation(incomplete,"execution_commission"))}};
    h.write(c.file,altered);
    await assert.rejects(h.auth(c,h.proof(c),(v,endpoint)=>endpoint.endsWith("/"+grant.id)?incomplete:v), /revision_authority_scope_invalid/);
  }
  h.write(c.file,p);
  const cap=await h.auth(c,proof);
  assert.throws(()=>h.begin(c,proof,{observations:cap.observations}));
  assert.throws(()=>h.begin(c,proof,cap,{revisionLive:{...c.live,inventory:digest("changed")}}));
  assert.equal(tip().reviewed_revision_consumed,1);
  const competing = {...h, begin(...args) {
    const reserved = h.begin(...args);
    assert.throws(() => h.begin(...args), /attempt_latest_tip_required/);
    return reserved;
  }};
  if (h.snapshot) {
    // Fork the synthetic inputs before reservation. The existing case retains its
    // passing ordinal two. The sibling independently executes a failure there.
    mkdirSync(h.snapshot, {mode:0o700});
    cpSync(c.checkout, path.join(h.snapshot, "checkout"), {
      recursive:true, filter:file => path.basename(file) !== "checkout-owner.json",
    });
    cpSync(c.anchor, path.join(h.snapshot, "anchor"), {recursive:true});
    h.write(path.join(h.snapshot, "context.json"), {
      branch:c.branch, base:c.base, head:c.head, tree:c.tree, inputs:c.inputs, gitDeclaration:c.gitDeclaration,
      authority:c.authority, live:c.live, proofPath:path.relative(c.checkout,c.file), browser, packages,
    });
  }
  const second=await executeFixture(c,competing,proof,cap,browser,packages);
  assert.equal(second.stock.valid_deciding_evidence,true);
  assert(!h.stock({...c,live:{...c.live,inventory:digest("changed")}},second.receipt,cap));
  assert.equal(tip().revision_commission,consumed.revision_commission);assert.equal(tip().reviewed_revision_consumed,2);
  assert.deepEqual(tip().revision_grants,[firstAuthority.grant.id,grant.id]);assert.throws(()=>h.begin(c,proof,cap));assert.throws(()=>prepare(p));
  console.log(JSON.stringify({synthetic_only:true,material_successor:{first_stock:false,second_stock:true,consumed:2,same_commission:true,
    refused:["stale and changed originals","reset and third ordinal","identical and whitespace-only source","wrong witness","missing and edited authority","unstable inputs","competing successor"]}}));
}

// Continue an independently executed failure on the fork. Exercise the new
// commission and its prospective second ordinal through the same cold stock reader.
export async function checkSpentCommission(c, h, stage) {
  const tip = () => reconstructAttemptTip({anchorRoot:c.anchor, repositoryRoot:c.checkout, branch:c.branch});
  const next = stage === "successor";
  const p2 = next ? c.spentContext.p2 : h.proof(c), oldGrant = next ? c.spentContext.oldGrant : c.authority.grant;
  const spentIdentity = next ? c.spentContext.spentIdentity : tip().revision_commission;
  if (!next) c.behaviorPath = "scripts/registration.mjs";
  const failed = next ? c.spentContext.failed : await executeFixture(c, h, p2, await h.auth(c,p2), c.browser, c.packages);
  assert.equal(failed.stock.valid_deciding_evidence, false);
  const spent = next ? c.spentContext.spent : tip();
  assert.equal(spent.reviewed_revision_consumed, 2);
  assert.equal(spent.revision_commission, spentIdentity);
  const prefix = "https://github.com/hynk-studio/augnes/pull/999#";
  const delegation = {...oldGrant, id:21, body:[
    "## Ongoing task delegation",
    "This authorizes one cohesive correction and qualification assignment on "+c.branch+" in Draft PR #999, following the receiving audit.",
    "### 4. Delegated public recording after independent source review",
    "After a separate read-only reviewer accepts the actual final published registration, continuation, policy and control changes, the implementation operator is authorized to publish the independent decision faithfully and the subsequent required prospective commission/execution authority through the existing authenticated maintainer identity under this task delegation.",
  ].join("\n\n")};
  const priorBytes = [p2.local_relative_path, ".augnes-local-verification/receipts/"+failed.receipt.run.id+".json"]
    .map(file => [path.join(c.checkout,file), digest(readFileSync(path.join(c.checkout,file)))]);
  let prior = next ? c.spentContext.prior : failed, accepted = next && c.spentContext.accepted, grant = next && c.spentContext.grant;
  for (const ordinal of [next ? 2 : 1]) {
    const file = c.behaviorPath;
    c.prior = prior.receipt; c.grantId = 23;
    const commit = text => {
      h.write(path.join(c.checkout,file), text); c.git(["add",file]);
      c.git(["-c","user.name=Fixture","-c","user.email=fixture@example.invalid","commit","--quiet","-m","synthetic registration repair"]);
    };
    const was = readFileSync(path.join(c.checkout,file),"utf8");
    const red = await behavior(c,false,h.run);
    assert.equal(red.result.exit_code, 1);
    const syntaxBefore = ordinal === 1 ? await behavior(c, true,h.run) : null;
    commit(was.replace("false, true", "true, true"));
    if (ordinal === 1) {
      c.acceptedHead=c.git(["rev-parse","HEAD"]).toString().trim();
      c.acceptedTree=c.git(["rev-parse","HEAD^{tree}"]).toString().trim();
    }
    h.prepare(c,ordinal);
    const p=c.proof, artifact=(name,value)=>h.artifact(c,name,value);
    const readItem=ref=>h.read(path.join(c.artifacts,ref.artifact));
    p.commission.delegation={id:delegation.id,sha256:digest(reviewedRevisionAuthorityObservation(delegation,"task_delegation"))};
    p.inputs.inventory_sha256=c.live.inventory; p.inputs.predecessor_sha256=p2.inputs.identity_sha256;
    p.originals.stock=artifact("prior-stock.log",JSON.stringify(prior.stock));
    const green=await behavior(c,false,h.run);
    assert.equal(green.result.exit_code,0);
    const raw=readFileSync(path.join(c.checkout,file));
    const witness=(label,run,content)=>artifact(label+".json",{...run,node_version:CANONICAL_NODE_VERSION,
      file_sha256:digest(content),runtime_inputs_sha256:p.inputs.identity_sha256,stdout:artifact(label+".log",run.output)});
    const before=witness("red",red,Buffer.from(was)), after=witness("green",green,raw);
    p.source=artifact("source.json",{...readItem(p.source),reviewed_at:time(0)});
    p.focused=artifact("focused.json",{...readItem(p.focused),finished_at:time(0),failed_phase:"authority",
      implicated_paths:[file],source_files:[{path:file,sha256:digest(raw),byte_size:raw.length}],input_remedy_resources:[],
      diagnosis:"A real bounded command failed before the remaining fixture work could run.",
      regression:{path:file,args:[],before,after},
      commands:[{command:green.command,tested_source_head:p.head,result:green.result,stdout:readItem(after).stdout,record:after}]});
    if (ordinal === 2) p.accepted=accepted;
    const prepFile=path.join(c.artifacts,"preparation.json");
    const prepare=(q,live=c.live)=>{
      const material=structuredClone(q);delete material.authorization;if(ordinal===1)delete material.accepted.review;
      h.write(prepFile,material);
      return inspectGitRevisionPreparation({file:prepFile,repositoryRoot:c.checkout,predecessorRoot:c.checkout,
        anchorRoot:c.anchor,runtimeInputs:c.inputs,live});
    };
    const prepared=prepare(p);
    assert.equal(prepared.consumed, ordinal===1?2:1); assert.equal(prepared.reserved,false);
    const review={...c.authority.review,id:21+ordinal,commit_id:p.head,submitted_at:time(1),body:[
      "Source review decision: ACCEPT / RETAIN for prospective qualification.",p.base,p.head,p.tree,p.prior_receipt_fingerprint,prepared.target,
    ].join("\n")};
    const ref=role=>({id:review.id,sha256:digest(reviewedRevisionAuthorityObservation(review,role))});
    if(ordinal===1) {
      const checked=readItem(p.focused);
      const differentCommand={...checked,regression:{...checked.regression,args:["--different"]}};
      assert.throws(()=>prepare({...p,focused:artifact("different-command.json",differentCommand)}), /revision_git_regression_invalid/);
      assert.throws(()=>prepare({...p,prior_attempt_id:"skipped"}));
      const priorFolder = path.dirname(path.join(c.checkout,p2.local_relative_path));
      const firstOriginals = Object.fromEntries(Object.entries(p2.originals).map(([key,ref]) =>
        [key, artifact("first-"+ref.artifact,readFileSync(path.join(priorFolder,ref.artifact)))]));
      const firstTip = {prior_family_id:p2.prior_family_id, prior_number:p2.prior_number, prior_attempt_id:p2.prior_attempt_id,
        prior_receipt_fingerprint:p2.prior_receipt_fingerprint};
      assert.throws(()=>prepare({...p,...firstTip,originals:firstOriginals,commission:{...p.commission,
        root_family_id:firstTip.prior_family_id,root_number:firstTip.prior_number,root_attempt_id:firstTip.prior_attempt_id,
        root_receipt_fingerprint:firstTip.prior_receipt_fingerprint}}), /revision_git_lineage_invalid/);
      assert.throws(()=>prepare({...p,inputs:{...p.inputs,inventory_sha256:undefined}}));
      const priorStock = path.join(c.artifacts,p.originals.stock.artifact), oldStock = readFileSync(priorStock);
      h.write(priorStock,JSON.stringify({...prior.stock,issues:[]}));
      try {assert.throws(()=>prepare(p));} finally {h.write(priorStock,oldStock);}
      const previousPath = path.join(c.checkout, p2.local_relative_path);
      const oldProof = readFileSync(previousPath); h.write(previousPath,{...p2,base:p.head});
      try {assert.throws(()=>prepare(p));} finally {h.write(previousPath,oldProof);}
      const otherService = structuredClone(c.live);
      otherService.service.state.preservation_binding = digest("different service binding");
      otherService.service.diagnostics.before_binding = otherService.service.diagnostics.after_binding = otherService.service.state.preservation_binding;
      assert.throws(()=>prepare(p,otherService), /revision_current_preservation_unsafe/);
      // Reseal unchanged, whitespace/mode-only and inert-comment Git candidates.
      // A real syntax check passes on both sides of the comment-only edit.
      const parent = prior.receipt.repository.head_sha;
      const diff = (from,to) => {const raw=c.git(["diff","--binary","--full-index","--no-ext-diff","--no-textconv",from,to,"--"]);
        return {bytes:raw.length,sha256:digest(raw),paths:c.git(["diff","--name-only",from,to,"--"]).toString().trim().split("\n").filter(Boolean).sort()};};
      for (const content of [was, was.replace("false, true","false,  true"), was+"// No executable change.\n"]) {
        h.write(path.join(c.checkout,file),content);c.git(["add",file]);
        if (content !== was) c.git(["update-index","--chmod=+x",file]);
        const tree=c.git(["write-tree"]).toString().trim();
        const head=c.git(["-c","user.name=Fixture","-c","user.email=fixture@example.invalid","commit-tree",tree,"-p",parent,"-m","cosmetic"]).toString().trim();
        const syntaxAfter=await behavior({...c,head},true,h.run);
        assert.equal(syntaxBefore.result.exit_code,0);assert.equal(syntaxAfter.result.exit_code,0);
        c.git(["restore","--source=HEAD","--staged","--worktree","--",file]);
        const source={...readItem(p.source),accepted_to_final:diff(head,head),predecessor_to_final:diff(parent,head),main_to_final:diff(p.base,head)};
        const before=witness("cosmetic-before",syntaxBefore,Buffer.from(was)), after=witness("cosmetic-after",syntaxAfter,Buffer.from(content));
        const cosmetic={...readItem(p.focused),finished_at:time(0),regression:{path:file,args:[],before,after},
          source_files:[{path:file,byte_size:Buffer.byteLength(content),sha256:digest(Buffer.from(content))}],
          commands:[{command:syntaxAfter.command,tested_source_head:head,result:syntaxAfter.result,record:after,stdout:readItem(after).stdout}]};
        c.git(["switch","-C",c.branch,head]);
        try {
          assert.throws(()=>prepare({...p,head,tree,accepted:{head,tree,base:p.base},source:artifact("cosmetic-source.json",source),
            focused:artifact("cosmetic-focused.json",cosmetic)}),/revision_material_remedy_required|revision_git_regression_invalid/);
        } finally { c.git(["switch","-C",c.branch,p.head]); }
      }
      assert.throws(()=>prepare(p,{...c.live,inventory:digest("unstable")}));
      const oldCompletion=path.join(c.anchor,".augnes-local-verification/families",spent.family_id,"completion-1.json");
      const bytes=readFileSync(oldCompletion);h.write(oldCompletion,{...h.read(oldCompletion),cleanup_complete:false});
      try {assert.throws(()=>prepare(p));} finally {h.write(oldCompletion,bytes);}
      p.accepted.review=ref("accepted_revision");accepted=structuredClone(p.accepted);
      grant={...oldGrant,id:23,created_at:time(3),body:[
        "Authorize a NEW prospective v7 reviewed_revision commission.",p.schema,p.branch,p.base,p.head,p.tree,prepared.target,p.prior_receipt_fingerprint,
        prefix+"pullrequestreview-"+review.id,prefix+"issuecomment-"+delegation.id,
        "The old commission remains spent. At most two admitted deciding invocations total, demonstrated material correction with focused support, zero unchanged-target retry and zero extra recovery. Reservation/interruption consumes. Separate fresh-process stock and independent audit.",
      ].join("\n")};grant.updated_at=grant.created_at;
      c.authority.review=review;
    } else {
      c.authority.review=c.firstReview;
      c.authority.linked={["repos/hynk-studio/augnes/pulls/999/reviews/"+review.id]:review};
    }
    c.authority.grant=grant; c.authority.linked={...c.authority.linked,["repos/hynk-studio/augnes/issues/comments/"+delegation.id]:delegation};
    p.authorization={grant_comment_id:grant.id,grant_sha256:digest(reviewedRevisionAuthorityObservation(grant,"execution_commission")),
      ...(ordinal===2?{contract_review:{...ref("contract_review"),head:p.head,pull_request:p.pull_request}}:{})};
    h.write(c.file,p);
    const proof=h.proof(c), cap=await h.auth(c,proof);
    if (ordinal===1) {
      c.firstReview=review;
      for(const used of spent.revision_grants) {
        h.write(c.file,{...p,authorization:{...p.authorization,grant_comment_id:used}});
        assert.throws(()=>h.proof(c),/revision_commission_lineage_invalid/);
      }
      h.write(c.file,p);
      for(const id of [grant.id,delegation.id]) await assert.rejects(h.auth(c,proof,(v,e)=>e.endsWith("/"+id)?{...v,body:"edited"}:v));
      await assert.rejects(h.auth(c,proof,(v,e)=>e.includes("/permission")?{...v,permission:"read"}:v));
      assert.throws(()=>h.begin(c,proof,cap,{revisionLive:{...c.live,inventory:digest("changed")}}));
      c.behaviorPath="scripts/final-check.mjs";
      mkdirSync(h.fork,{mode:0o700});
      cpSync(c.checkout,path.join(h.fork,"checkout"),{recursive:true,filter:f=>path.basename(f)!=="checkout-owner.json"});
      cpSync(c.anchor,path.join(h.fork,"anchor"),{recursive:true});
      h.write(path.join(h.fork,"context.json"),{branch:c.branch,base:c.base,acceptedHead:c.acceptedHead,acceptedTree:c.acceptedTree,
        head:c.head,tree:c.tree,inputs:c.inputs,gitDeclaration:c.gitDeclaration,authority:c.authority,live:c.live,
        proofPath:path.relative(c.checkout,c.file),browser:c.browser,packages:c.packages,grantId:c.grantId});
      cpSync(h.fork,h.positive,{recursive:true});

    }
    const competing={...h,begin(ctx,src,authority,opts) {
      const input={...opts,runId:"new-commission-"+ordinal};
      const record=h.begin(ctx,src,authority,input);
      assert.throws(()=>h.begin(ctx,src,authority,input));return record;
    }};
    prior=await executeFixture(c,competing,proof,cap,c.browser,c.packages);
    assert.equal(prior.stock.valid_deciding_evidence,ordinal===2);
    const current=tip();assert.notEqual(current.revision_commission,spentIdentity);
    if(ordinal===1)c.newIdentity=current.revision_commission;
    assert.equal(current.revision_commission,c.newIdentity);
    assert.deepEqual(current.revision_grants,[...spent.revision_grants,grant.id]);
    assert.equal(current.reviewed_revision_consumed,ordinal);
    if (!next) c.spentContext={p2,oldGrant,spentIdentity,failed,spent,prior,accepted,grant};
  }
  for(const [file,hash] of priorBytes)assert.equal(digest(readFileSync(file)),hash);
  console.log(JSON.stringify({synthetic_only:true,spent_v10_to_v7:true,old_consumed:2,new_consumed:next?2:1,fresh_stock:next?[true]:[false,false]}));
}

// Fork the unreserved synthetic v7 ordinal one. Here the phase child succeeds
// and the subsequent read actually refuses the empty directory's narrower mode.
export async function checkFinalDependency(c,h,stage) {
  const root = path.join(c.checkout,"apps/web_planning/node_modules"), file="scripts/local-canonical-inputs.mjs";
  const probe = async () => {
    let output=""; const sink={write(b){output+=b;}};
    const result=await (h.run??runCanonicalChild)({suite:"reviewed-revision",label:"retained Web dependency observation",command:process.execPath,
      args:["--input-type=module","-e",finalDependencyProbe],cwd:c.checkout,env:{...c.env,AUGNES_RETAINED_PROJECT:c.checkout},
      timeoutMs:5000,stdout:sink,stderr:sink});
    assert(result.cleanup_completed && !result.remaining_owned_processes && result.termination_reason==="natural_exit");
    return {tested_source_head:c.git(["rev-parse","HEAD"]).toString().trim(),command:finalDependencyCommand,result,output,finished_at:time(0)};
  };
  if (stage==="final-input") {
    const exclude=path.join(c.checkout,".git/info/exclude");
    h.write(exclude,readFileSync(exclude,"utf8")+"\nnode_modules/\npackage.json\npackage-lock.json\n");
    mkdirSync(root,{recursive:true});chmodSync(root,0o755);
    c.packages=dependencyRecords(c,c.checkout);
    c.behaviorPath="scripts/registration.mjs";
    const p=h.proof(c); const cap=await h.auth(c,p);
    const failed=await executeFixture(c,{...h,finalInputFailure:async()=>{
      mkdirSync(path.join(root,".vite-temp"),{mode:0o700});
      const red=await probe();assert.equal(red.result.exit_code,1);return JSON.parse(red.output).error;
    },begin:(ctx,src,cap,opts)=>h.begin(ctx,src,cap,{...opts,runId:"final-input-failure"})},p,cap,c.browser,c.packages);
    assert.equal(failed.stock.valid_deciding_evidence,false);
    c.failed={receipt:failed.receipt,stock:failed.stock};
    console.log(JSON.stringify({synthetic_only:true,phase_passes:failed.receipt.phases.length,after:null,stock:failed.stock}));
    return;
  }
  const failed=c.failed, first=h.proof(c), authority=structuredClone(c.authority);
  const verify=(r,s=failed.stock)=>verifyGitRevisionFailure(r,s,c.inputs,phaseIds,1,true);
  verify(failed.receipt);
  for (const mutate of [r=>r.inputs.events.push(r.inputs.events[0]), r=>r.inputs.events[0].identity=digest("changed"),
    r=>r.inputs.prepared_dependencies[2].error="dependency_input_generated_unsafe", r=>r.inputs.prepared_dependencies[2].after=c.packages[2].before,
    r=>r.inputs.prepared_dependencies[0].after.content_sha256=digest("other change"),r=>r.phases.at(-1).browser_use=[],
    r=>r.phases[3].cleanup.termination_reason="timeout",r=>r.capacity_ownership.released=false]) {
    const r=structuredClone(failed.receipt);mutate(r);assert.throws(()=>verify(r));
  }
  assert.throws(()=>verify(failed.receipt,{...failed.stock,issues:[]}));
  const retained=await probe();assert.equal(retained.result.exit_code,1);
  const oldBytes=readFileSync(path.join(c.checkout,file));
  h.write(path.join(c.checkout,file),oldBytes.toString().split("\n")[0]+"\n");
  c.git(["add",file]);c.git(["-c","user.name=Fixture","-c","user.email=fixture@example.invalid","commit","--quiet","-m","Use corrected physical input reader"]);
  c.prior=failed.receipt;h.prepare(c,2);const p=c.proof, pr=c.authority.pr; c.authority={...authority,pr};
  c.behaviorPath="scripts/registration.mjs";
  p.accepted=first.accepted;p.inputs.inventory_sha256=c.live.inventory;
  const ref=(name,value)=>h.artifact(c,name,value), readItem=ref=>h.read(path.join(c.artifacts,ref.artifact));
  p.originals.stock=ref("prior-stock.log",JSON.stringify(failed.stock));
  const green=await probe();assert.equal(green.result.exit_code,0);
  const raw=readFileSync(path.join(c.checkout,file));
  const witness=(name,run,bytes)=>ref(name+".json",{...run,node_version:CANONICAL_NODE_VERSION,
    file_sha256:digest(bytes),runtime_inputs_sha256:p.inputs.identity_sha256,stdout:ref(name+".log",run.output)});
  const before=witness("red",retained,oldBytes), after=witness("green",green,raw);
  p.source=ref("source.json",{...readItem(p.source),reviewed_at:time(0)});
  const focused={...readItem(p.focused),finished_at:time(0),failed_phase:null,input_remedy_resources:[],implicated_paths:[file],
    source_files:[{path:file,byte_size:raw.length,sha256:digest(raw)}],regression:{path:file,args:[],before,after},
    diagnosis:"A later physical read isolates the empty task-owned directory's restrictive mode; the missing historical observation remains null.",
    commands:[{command:green.command,tested_source_head:p.head,result:green.result,stdout:readItem(after).stdout,record:after}]};
  p.focused=ref("focused.json",focused);
  const latest=()=>reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch});
  const originalTip=latest(), baseUrl="https://github.com/hynk-studio/augnes/pull/999#";
  const forward={...authority.grant,id:31,created_at:time(0),body:[
    "## Forward decision for the fixture final-input failure — continue the same assignment",
    "This decision follows the independent audit and extends the existing [ongoing task delegation "+p.commission.delegation.id+"]("+baseUrl+"issuecomment-"+p.commission.delegation.id+") for the specific settled failure below.",
    "Complete the correction and qualification as one assignment on "+c.branch+" in Draft PR #999.",
    "### Exact historical boundary and existing authority",
    "Base/main: "+p.accepted.base,"Audited head: "+p.accepted.head,"Audited tree: "+p.accepted.tree,
    "Actual latest attempt: "+p.prior_attempt_id,"Latest failed receipt: "+p.prior_receipt_fingerprint,
    "Previous receipt: "+p.commission.root_receipt_fingerprint,"Current commission: "+originalTip.revision_commission+", consumed 1/2",
    "Initial source acceptance: "+baseUrl+"pullrequestreview-"+p.accepted.review.id,
    "Existing prospective grant: "+baseUrl+"issuecomment-"+authority.grant.id,
    "### Authorized bounded source correction", "Correct the restrictive-mode observation while retaining the failure.",
    "### Explicit prospective continuation for this settled failure",
    "I authorize the minimal existing-owner and policy extension needed for a materially corrected second candidate to follow this exact all-phase-pass, final dependency-observation failure.",
    "Require the isolated dependency_input_cache_unsafe event on dependencies-web-planning, its missing v2 after-observation.",
  ].join("\n\n")};forward.updated_at=forward.created_at;
  const record=(r,role)=>({id:r.id,sha256:digest(reviewedRevisionAuthorityObservation(r,role))});
  p.commission.forward_decision=record(forward,"forward_decision");
  const prepare=(material,live=c.live)=>{
    const decl=structuredClone(material);delete decl.authorization;
    const f=path.join(c.artifacts,"preparation.json");h.write(f,decl);
    return inspectGitRevisionPreparation({file:f,repositoryRoot:c.checkout,predecessorRoot:c.checkout,anchorRoot:c.anchor,runtimeInputs:c.inputs,live});
  };
  const prepared=prepare(p);assert(!prepared.reserved && prepared.consumed===1 && prepared.ordinal===2);
  const without=structuredClone(p);delete without.commission.forward_decision;assert.throws(()=>prepare(without));
  assert.throws(()=>prepare({...p,prior_attempt_id:"skipped"}));
  assert.throws(()=>prepare({...p,focused:ref("wrong-phase.json",{...focused,failed_phase:"authority"})}));
  assert.throws(()=>prepare(p,{...c.live,inventory:digest("changed")}));
  const review={...authority.review,id:32,commit_id:p.head,submitted_at:time(1),body:[
    "Source review decision: ACCEPT / RETAIN for prospective qualification.",p.base,p.head,p.tree,p.prior_receipt_fingerprint,prepared.target,baseUrl+"issuecomment-"+forward.id,
  ].join("\n")};
  c.authority.linked={...c.authority.linked,["repos/hynk-studio/augnes/issues/comments/"+forward.id]:forward,["repos/hynk-studio/augnes/pulls/999/reviews/"+review.id]:review};
  p.authorization={...first.authorization,contract_review:{...record(review,"contract_review"),head:p.head,pull_request:p.pull_request}};
  h.write(c.file,p);const proof=h.proof(c), cap=await h.auth(c,proof);
  const ledgerBytes=()=>digest(readdirSync(c.anchor,{recursive:true}).sort().filter(f=>statSync(path.join(c.anchor,f)).isFile())
    .map(f=>[f,digest(readFileSync(path.join(c.anchor,f)))]));
  const unchangedLedger=ledgerBytes();
  let acceptedBodies=0, refusedBodies=0;
  const authorizeBody=async(body,accepted=true,link=true,changes={})=>{
    const candidate=structuredClone(p), decision={...forward,...changes,body};
    candidate.commission.forward_decision=record(decision,"forward_decision");
    const sourceReview={...review,body:review.body.replace(prepared.target,gitReviewTarget(candidate))};
    if (!link) sourceReview.body=sourceReview.body.replace(baseUrl+"issuecomment-"+forward.id,"");
    candidate.authorization.contract_review={...candidate.authorization.contract_review,...record(sourceReview,"contract_review")};
    const authorize=()=>h.auth(c,candidate,(v,e)=>e.endsWith("/"+forward.id)?decision:e.endsWith("/"+review.id)?sourceReview:v);
    if (accepted) { await authorize(); acceptedBodies++; }
    else { await assert.rejects(authorize,/revision_authority_scope_invalid/); refusedBodies++; }
    // The reader is read-only. Check the complete physical ledger after each
    // refusal, without rerunning unrelated Git reconstruction for every body.
    assert.equal(ledgerBytes(),unchangedLedger);
  };
  // Operative B remains authorized with a historical, explicitly excluded A.
  // Conversely all of B's missing bindings in an appendix cannot authorize B
  // when the operative decision names A. Use real authenticated-reader records,
  // with both record hashes and the separate review commitment rebound.
  const boundary="### Exact historical boundary and existing authority";
  const correction="### Authorized bounded source correction";
  const start=forward.body.indexOf(boundary), end=forward.body.indexOf(correction);
  const active=forward.body.slice(start+boundary.length,end).trim();
  const appendix="\n\n### Historical comparison — excluded from this authorization\n\nThis other target is not approved.\n\n";
  const other=forward.body.replace(p.prior_attempt_id,"other-candidate-attempt").replace(p.prior_receipt_fingerprint,digest("other receipt"));
  const otherFields=other.slice(start,other.indexOf(correction));
  await authorizeBody(forward.body+appendix+otherFields.replace(boundary,"Rejected target:"));
  await authorizeBody(other,false);
  await authorizeBody(other+appendix+active,false);
  await authorizeBody(other+appendix+forward.body,false);
  // These two fields are absent from the active record. Only an excluded
  // peer heading (also valid with a leading space), inline example, or list
  // supplies their values. Refuse all of them before any reservation.
  const pair=["Actual latest attempt: "+p.prior_attempt_id,"Latest failed receipt: "+p.prior_receipt_fingerprint];
  const missing=forward.body.split("\n").filter(line=>!pair.includes(line)).join("\n");
  const excluded="Historical comparison only — this predecessor is excluded";
  for (const nonoperative of ["### "+excluded," ### "+excluded,excluded+"\n---"])
    await authorizeBody(missing.replace(correction,nonoperative+"\n\n"+pair.join("\n")+"\n\n"+correction),false);
  await authorizeBody(missing.replace(correction,"Excluded example: `\n"+pair.join("\n")+"\n`\n\n"+correction),false);
  await authorizeBody(missing.replace(correction,"- "+excluded+":\n"+pair.map(line=>"  "+line).join("\n")+"\n\n"+correction),false);
  await authorizeBody(forward.body.replace(active,active.split(/\n+/u).reverse().join("\n\n")));
  for (const wrap of [s=>"> "+s.replaceAll("\n","\n> "),s=>"```text\n"+s+"\n```",s=>"~~~\n"+s+"\n~~~",
    s=>"<!--\n"+s+"\n-->",s=>"    "+s.replaceAll("\n","\n    ")]) {
    await authorizeBody(wrap(forward.body),false);
    await authorizeBody(other+appendix+wrap(forward.body),false);
    await authorizeBody(forward.body+appendix+wrap(other));
  }
  await authorizeBody("## Historical example only\n\n"+forward.body,false);
  await authorizeBody(forward.body.replace(boundary,"### Historical example only"),false);
  await authorizeBody(forward.body.replace(boundary,boundary+"\n\n"+boundary),false);
  await authorizeBody(forward.body+appendix+"```text\n<!--\n```\n\n"+boundary+"\n\n"+active,false);
  await authorizeBody(forward.body+appendix+"<!--\n```\n"+other+"\n-->\n");
  for (const field of active.split(/\n+/u)) {
    await authorizeBody(forward.body.replace(field,"")+appendix+field,false);
    await authorizeBody(forward.body.replace(field,field+"\n"+field),false);
    await authorizeBody(forward.body.replace(field,field+"\n"+field.split(": ")[0]+": conflicting target"),false);
    await authorizeBody(forward.body.replace(field,field+" suffix"),false);
  }
  for (const value of [c.branch,"Draft PR #999","ongoing task delegation "+p.commission.delegation.id])
    await authorizeBody(forward.body.replace(value,"wrong binding")+appendix+value,false);
  await authorizeBody(forward.body,false,true,{created_at:review.submitted_at,updated_at:review.submitted_at});
  await authorizeBody(forward.body,false,true,{created_at:authority.grant.created_at,updated_at:authority.grant.created_at});
  assert.deepEqual(latest(),originalTip);
  console.log(JSON.stringify({synthetic_only:true,authority_scope:"operative boundary",authorized_with_excluded_appendix:true,
    excluded_target_refused:true,nonoperative_decisions_refused:true,missing_conflicting_fields_refused:true,
    accepted_bodies:acceptedBodies,refused_bodies:refusedBodies,refusals_changed_ledger:false}));
  assert.throws(()=>h.begin(c,proof,null),/revision_authenticated_authority_required/);
  assert.equal(ledgerBytes(),unchangedLedger);
  // Rebind the mocked record identities and target: refusal must come from
  // the operative decision/link, not a hash mismatch on an edited response.
  for (const [body,link] of [
    [forward.body.replace("I authorize the minimal","I decline the minimal"),true],
    [forward.body.replace(p.prior_attempt_id,"different-attempt"),true],
    [forward.body,false],
  ]) {
    const candidate=structuredClone(p), wrongForward={...forward,body};
    candidate.commission.forward_decision=record(wrongForward,"forward_decision");
    const wrongReview={...review,body:review.body.replace(prepared.target,gitReviewTarget(candidate))};
    if (!link) wrongReview.body=wrongReview.body.replace(baseUrl+"issuecomment-"+forward.id,"");
    candidate.authorization.contract_review={...candidate.authorization.contract_review,...record(wrongReview,"contract_review")};
    await assert.rejects(h.auth(c,candidate,(v,e)=>e.endsWith("/"+forward.id)?wrongForward:e.endsWith("/"+review.id)?wrongReview:v),/revision_authority_scope_invalid/);
  }
  for (const id of [forward.id,review.id]) await assert.rejects(h.auth(c,proof,(v,e)=>e.endsWith("/"+id)?{...v,body:"changed"}:v));
  await assert.rejects(h.auth(c,proof,(v,e)=>e.endsWith("/"+forward.id)?null:v));
  await assert.rejects(h.auth(c,proof,(v,e)=>e.includes("/permission")?{...v,permission:"read"}:v));
  const ordinary=path.join(root,"fixture/package.json"), mode=statSync(ordinary).mode & 0o777;
  chmodSync(ordinary,0o666);
  try {assert.throws(()=>h.begin(c,proof,cap),/dependency_input_entry_unsafe/);} finally {chmodSync(ordinary,mode);}
  assert.deepEqual(latest(),originalTip);
  const current=await probe();assert.equal(current.result.exit_code,0);
  assert.equal(JSON.parse(current.output).content_sha256,JSON.parse(green.output).content_sha256);
  const result=await executeFixture(c,{...h,begin(ctx,src,cap,opts){
    const a=h.begin(ctx,src,cap,{...opts,runId:"final-input-successor"});assert.throws(()=>h.begin(ctx,src,cap,opts));return a;
  }},proof,cap,c.browser,c.packages);
  assert.equal(result.stock.valid_deciding_evidence,true);assert.equal(latest().revision_commission,originalTip.revision_commission);
  assert.equal(latest().reviewed_revision_consumed,2);
  console.log(JSON.stringify({synthetic_only:true,material_final_input_successor:true,old_stock:false,stock:true,consumed:2}));
}

// A separate fork retains a genuine synthetic PASS. Its later audit is not a
// failed Full phase, and its append-only decision retains the original grant.
export async function checkPostPass(c,h,stage) {
  if(stage==="post-pass-successor") return completePostPass(c,h);
  const latest=()=>reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch});
  c.behaviorPath="scripts/registration.mjs";
  if(stage==="post-pass") {
    const p=h.proof(c),cap=await h.auth(c,p);
    c.passed=await executeFixture(c,{...h,begin:(ctx,p,cap,opts)=>h.begin(ctx,p,cap,{...opts,runId:"positive-first"})},p,cap,c.browser,c.packages);
    delete c.passed.child;
    assert.equal(c.passed.stock.valid_deciding_evidence,true);
    verifyGitRevisionSuccess(c.passed.receipt,c.passed.stock,c.inputs,phaseIds);
    assert.equal(latest().reviewed_revision_consumed,1);
    console.log(JSON.stringify({synthetic_only:true,post_pass_predecessor:true,stock:true,consumed:1}));
    return;
  }
  const success=c.passed,first=h.proof(c),authority=structuredClone(c.authority),tip=latest();
  const originalGrant=JSON.stringify(authority.grant),originalReceipt=digest(success.receipt);
  for(const change of [r=>r.phases.pop(),r=>r.phases.at(-1).browser_use=[],r=>r.final.result="failure",
    r=>r.evidence.deciding=false,r=>r.cleanup.completed=false,r=>r.checkout_ownership.released=false,
    r=>r.inputs.prepared_dependencies[2].after=null,r=>r.inputs.events=[{disposition:"input_invalidation"}],
    r=>r.inputs.first_fault={},r=>r.inputs.binding.runtime_inputs.node.location_fingerprint=digest("other")]) {
    const r=structuredClone(success.receipt);change(r);assert.throws(()=>verifyGitRevisionSuccess(r,success.stock,c.inputs,phaseIds));
  }
  assert.throws(()=>verifyGitRevisionSuccess(success.receipt,{...success.stock,valid_deciding_evidence:false},c.inputs,phaseIds));
  const subject="scripts/audit-subject.mjs",driver="scripts/audit-driver.mjs",beforeHead=c.head;
  c.behaviorPath=driver;const red=await behavior(c,false,h.run);assert.equal(red.result.exit_code,1);
  h.write(path.join(c.checkout,subject),"export const permitted = false;\n");
  c.git(["add",subject]);c.git(["-c","user.name=Fixture","-c","user.email=fixture@example.invalid","commit","--quiet","-m","Repair independently found material defect"]);
  c.prior=success.receipt;h.prepare(c,2);const p=c.proof,pr=c.authority.pr;c.authority={...authority,pr};
  p.accepted=first.accepted;p.authorization={...first.authorization};p.inputs.inventory_sha256=c.live.inventory;
  const ref=(name,value)=>h.artifact(c,name,value),get=ref=>h.read(path.join(c.artifacts,ref.artifact));
  p.originals.stock=ref("prior-stock.log",JSON.stringify(success.stock));
  const green=await behavior(c,false,h.run);assert.equal(green.result.exit_code,0);
  const raw=c.git(["show",p.head+":"+driver]),environment=digest({controlled:c.inputs,command:red.command});
  const witness=(label,run,head)=>ref(label+".json",{...run,node_version:CANONICAL_NODE_VERSION,
    file_sha256:digest(raw),fixture_sha256:digest(raw),environment,runtime_inputs_sha256:p.inputs.identity_sha256,
    modules:[{path:subject,sha256:digest(c.git(["show",head+":"+subject]))}],stdout:ref(label+".log",run.output)});
  const before=witness("red",red,beforeHead),after=witness("green",green,p.head);
  p.source=ref("source.json",{...get(p.source),reviewed_at:time(0)});
  const focused={...get(p.focused),finished_at:time(0),failed_phase:null,input_remedy_resources:[],implicated_paths:[subject],
    source_files:[subject,driver].map(name=>{const raw=c.git(["show",p.head+":"+name]);return {path:name,sha256:digest(raw),byte_size:raw.length};}),
    regression:{path:driver,args:[],before,after},diagnosis:"An independent later audit found an incorrect authorization result despite a complete historical PASS.",
    commands:[{command:green.command,tested_source_head:p.head,result:green.result,record:after,stdout:get(after).stdout}]};
  p.focused=ref("focused.json",focused);
  const url=(kind,id)=>"https://github.com/hynk-studio/augnes/pull/999#"+kind+"-"+id;
  const boundary="### Exact preserved boundary",policy="### Prospective policy and authority amendment";
  const record=[
    "- Current reviewed correction: head `"+beforeHead+"`, tree `"+first.tree+"`, base/main `"+p.base+"`.",
    "- Actual latest settled qualification: head `"+p.accepted.head+"`, tree `"+p.accepted.tree+"`, base `"+p.accepted.base+"`.",
    "- Actual attempt: `"+p.prior_attempt_id+"`.","- Latest successful receipt: `"+p.prior_receipt_fingerprint+"`.",
    "- Original prospective grant: ["+p.authorization.grant_comment_id+"]("+url("issuecomment",p.authorization.grant_comment_id)+").",
    "- Current commission: `"+tip.revision_commission+"`, consumed 1/2.",
    "- Original accepted source: ["+p.accepted.review.id+"]("+url("pullrequestreview",p.accepted.review.id)+").",
    "- Retained commission root receipt: `"+p.commission.root_receipt_fingerprint+"`."];
  const forward={...authority.grant,id:40,created_at:time(0),body:[
    "## Forward decision for an independently found material defect after PASS",
    "The user explicitly approved this same-commission post-PASS proposal on 2026-11-06, after the [receiving r1 source and evidence audit 12]("+url("pullrequestreview",12)+"). The receiving ChatGPT is recording that approved prospective decision through the existing authenticated maintainer account. The operative scope below is the approved proposal; its draft-only wrapper has been removed. This records scope and conditional publication authority, not an already-issued runtime capability or a completed qualification.",
    "Continue issue #123 on `"+p.branch+"` in Draft PR #999 as one cohesive correction and qualification assignment. Extend the existing [task delegation "+p.commission.delegation.id+"]("+url("issuecomment",p.commission.delegation.id)+") only as stated below. Complete the bounded existing-owner/policy extension, focused validation, independent final-source review, legitimate authority recording, planner-required Mac qualification, fresh-process stock, cleanup and consolidated handoff together.",
    boundary,record.join("\n"),policy,
    "I authorize the narrow extension of the existing inventory-bound v7 reviewed-revision owners to admit one materially corrected successor after a settled ordinal-one PASS when an independent audit has demonstrated a real defect in that source. This is a prospective amendment for the existing remaining ordinal two. It does not rewrite grant"+p.authorization.grant_comment_id+" or claim that its failure/false-stock clause already covers success. The original grant remains historical accounting and scope evidence; this separately authenticated, append-only decision supplies the additional post-PASS permission.",
    "### Material proof and full-boundary controls","Retain the same natural RED and GREEN driver and exact Git modules.",
    "### Conditional recording and final qualification",
    "After a separate read-only reviewer accepts the actual final published source, policy and controls, the implementation operator is authorized under this decision and task delegation"+p.commission.delegation.id+" to transcribe that independent decision faithfully and publish the required final-source authority binding through the existing authenticated maintainer identity. Preserve the review original verbatim and disclose reviewer versus submitting operator. Bind the actual final head/tree/current base, preparation/current-input commitment and inventory, successful predecessor, original grant/commission, ordinal two and this prospective amendment. The eventual final-source acceptance must follow the completed source and focused evidence; current r1 review12 is not approval of an unseen future change.",
  ].join("\n\n")};forward.updated_at=forward.created_at;
  const authorityRef=(value,role)=>({id:value.id,sha256:digest(reviewedRevisionAuthorityObservation(value,role))});
  p.commission.forward_decision=authorityRef(forward,"forward_decision");
  const prepFile=path.join(c.artifacts,"preparation.json");
  const prepare=(candidate,live=c.live)=>{const material=structuredClone(candidate);delete material.authorization;h.write(prepFile,material);
    return inspectGitRevisionPreparation({file:prepFile,repositoryRoot:c.checkout,predecessorRoot:c.checkout,anchorRoot:c.anchor,runtimeInputs:c.inputs,live});};
  const prepared=prepare(p);assert.equal(prepared.consumed,1);assert.equal(prepared.ordinal,2);assert.equal(prepared.predecessor_commission,tip.revision_commission);
  const ledger=()=>digest(readdirSync(c.anchor,{recursive:true}).sort().filter(f=>statSync(path.join(c.anchor,f)).isFile()).map(f=>[f,digest(readFileSync(path.join(c.anchor,f)))]));
  const unchanged=ledger();
  for(const mutation of [q=>delete q.commission.forward_decision,q=>q.commission.ordinal=1,q=>q.commission.root_receipt_fingerprint=digest("changed"),
    q=>q.prior_attempt_id="skipped",q=>q.prior_family_id=first.prior_family_id,q=>q.prior_receipt_fingerprint=first.prior_receipt_fingerprint,
    q=>Object.assign(q,{head:beforeHead,tree:first.tree}),q=>q.inputs.inventory_sha256=digest("changed")]){
    const q=structuredClone(p);mutation(q);assert.throws(()=>prepare(q));assert.equal(ledger(),unchanged);
  }
  assert.throws(()=>prepare(p,{...c.live,inventory:digest("unstable")}));
  const foreign=structuredClone(c.live);foreign.service.state.preservation_binding=digest("foreign");assert.throws(()=>prepare(p,foreign));
  for(const item of Object.values(p.originals)){
    const name=path.join(c.artifacts,item.artifact),raw=readFileSync(name);h.write(name,Buffer.concat([raw,Buffer.from("\n")]));
    try{assert.throws(()=>prepare(p));}finally{h.write(name,raw);}
  }
  for(const name of ["attempt-1.json","completion-1.json"]){
    const file=path.join(c.anchor,".augnes-local-verification/families",p.prior_family_id,name),raw=readFileSync(file);
    h.write(file,Buffer.concat([raw,Buffer.from("\n")]));try{assert.throws(()=>prepare(p));}finally{h.write(file,raw);}
  }
  for(const file of [...Object.values(p.originals).map(r=>path.join(c.artifacts,r.artifact)),
    ...["attempt-1.json","completion-1.json"].map(n=>path.join(c.anchor,".augnes-local-verification/families",p.prior_family_id,n))]){
    renameSync(file,file+".withheld");try{assert.throws(()=>prepare(p));}finally{renameSync(file+".withheld",file);}
    assert.equal(ledger(),unchanged);
  }
  for(const changes of [{fixture_sha256:digest("other driver")},{modules:[]},{environment:digest("other runtime")},{result:green.result}]){
    const bad=ref("bad-red.json",{...get(before),...changes});
    assert.throws(()=>prepare({...p,focused:ref("bad-focused.json",{...focused,regression:{...focused.regression,before:bad}})}));
  }
  // Both sides of a syntax-only or comment-only probe pass: that is not a RED.
  const syntax=await behavior(c,true,h.run);assert.equal(syntax.result.exit_code,0);
  assert.throws(()=>prepare({...p,focused:ref("nondiscriminating.json",{...focused,regression:{...focused.regression,before:after}})}));
  // A fully rebound comment-only candidate still has the defective behavior.
  // Keep its natural result; do not manufacture a GREEN or change the driver.
  const cosmeticText=c.git(["show",beforeHead+":"+subject]).toString()+"// Historical explanation only.\n";
  h.write(path.join(c.checkout,subject),cosmeticText);c.git(["add",subject]);
  const cosmeticTree=c.git(["write-tree"]).toString().trim();
  const cosmeticHead=c.git(["-c","user.name=Fixture","-c","user.email=fixture@example.invalid","commit-tree",cosmeticTree,"-p",beforeHead,"-m","Comment only"]).toString().trim();
  const cosmeticRun=await behavior({...c,head:cosmeticHead},false,h.run);assert.equal(cosmeticRun.result.exit_code,1);
  const cosmeticAfter=witness("cosmetic",cosmeticRun,cosmeticHead);
  c.git(["restore","--source=HEAD","--staged","--worktree","--",subject]);
  const delta=from=>{const raw=c.git(["diff","--binary","--full-index","--no-ext-diff","--no-textconv",from,cosmeticHead,"--"]);
    return {bytes:raw.length,sha256:digest(raw),paths:c.git(["diff","--name-only",from,cosmeticHead,"--"]).toString().trim().split("\n").filter(Boolean).sort()};};
  const cosmeticFocus={...focused,finished_at:time(0),regression:{...focused.regression,after:cosmeticAfter},
    source_files:focused.source_files.map(f=>f.path===subject?{path:subject,sha256:digest(Buffer.from(cosmeticText)),byte_size:Buffer.byteLength(cosmeticText)}:f),
    commands:[{command:cosmeticRun.command,tested_source_head:cosmeticHead,result:cosmeticRun.result,record:cosmeticAfter,stdout:get(cosmeticAfter).stdout}]};
  c.git(["switch","-C",c.branch,cosmeticHead]);
  try{assert.throws(()=>prepare({...p,head:cosmeticHead,tree:cosmeticTree,
    source:ref("cosmetic-source.json",{...get(p.source),accepted_to_final:delta(first.accepted.head),predecessor_to_final:delta(beforeHead),main_to_final:delta(p.base)}),
    focused:ref("cosmetic-focused.json",cosmeticFocus)}),/revision_focused_remedy_invalid|revision_material_remedy_required/);}
  finally{c.git(["switch","-C",c.branch,p.head]);}
  assert.equal(ledger(),unchanged);
  const reviewBody=q=>["Source review decision: ACCEPT / RETAIN for prospective qualification.","### Exact post-PASS successor",
    Object.entries(postPassReviewFields(q,tip.revision_commission)).map(([k,v])=>k+": "+v).join("\n"),
    "Under the authenticated forward decision above, I record the independently accepted final source and authorize only ordinal two of the retained commission for this exact preparation commitment. No unchanged-target retry or extra recovery is authorized."].join("\n\n");
  const review={...authority.review,id:41,commit_id:p.head,submitted_at:time(0),body:reviewBody(p)};
  p.authorization.contract_review={...authorityRef(review,"contract_review"),head:p.head,pull_request:p.pull_request};
  c.authority.linked={...authority.linked,["repos/hynk-studio/augnes/issues/comments/40"]:forward,["repos/hynk-studio/augnes/pulls/999/reviews/41"]:review};
  h.write(c.file,p);const proof=h.proof(c);
  const checkBody=async(body,ok=false)=>{
    const q=structuredClone(p),f={...forward,body};q.commission.forward_decision=authorityRef(f,"forward_decision");
    const r={...review,body:reviewBody(q)};q.authorization.contract_review={...q.authorization.contract_review,...authorityRef(r,"contract_review")};
    const request=()=>h.auth(c,q,(v,e)=>e.endsWith("/40")?f:e.endsWith("/41")?r:v);
    if(ok)await request();else await assert.rejects(request);assert.equal(ledger(),unchanged);
  };
  await checkBody(forward.body,true);
  await checkBody(forward.body+"\n\n### Historical appendix\n\nThis other target is excluded.\n\n"+record.join("\n"),true);
  for(const line of record){await checkBody(forward.body.replace(line,""));await checkBody(forward.body.replace(line,line+"\n"+line));
    await checkBody(forward.body.replace(line,"").replace(policy," ### Excluded example\n\n"+line+"\n\n"+policy));}
  await checkBody(forward.body.replace("I authorize the narrow","I decline the narrow"));
  await checkBody(forward.body.replace(forward.body.split("\n\n")[1],"This entire document below is a historical comparison only. Its positive statements are quoted for context and do not authorize any candidate or execution."));
  await checkBody("> "+forward.body.replaceAll("\n","\n> "));
  await checkBody("```text\n"+forward.body+"\n```");
  await checkBody("<!--\n"+forward.body+"\n-->");
  await checkBody(forward.body.replace(record[0],record[0].replace(beforeHead,"0".repeat(40))));
  for(const id of [forward.id,review.id,authority.grant.id,authority.review.id,p.commission.delegation.id])
    await assert.rejects(h.auth(c,proof,(v,e)=>e.endsWith("/"+id)?{...v,body:"edited"}:v));
  await assert.rejects(h.auth(c,proof,(v,e)=>e.endsWith("/40")?null:v));
  await assert.rejects(h.auth(c,proof,(v,e)=>e.includes("/permission")?{...v,permission:"read"}:v));
  await assert.rejects(h.auth(c,proof,(v,e)=>e.endsWith("/40")?{...v,created_at:authority.grant.created_at,updated_at:authority.grant.created_at}:v));
  for(const key of Object.keys(postPassReviewFields(p,tip.revision_commission))){
    const r={...review,body:review.body.replace(new RegExp("^"+key+": .*$","m"),"")};
    const q={...p,authorization:{...p.authorization,contract_review:{...p.authorization.contract_review,...authorityRef(r,"contract_review")}}};
    await assert.rejects(h.auth(c,q,(v,e)=>e.endsWith("/41")?r:v));
  }
  for(const prefix of ["The following paragraph is only an excluded example; no execution is authorized.",
    " ### Excluded execution example", "- Excluded execution example:", "`Excluded execution example`"]){
    const r={...review,body:review.body.replace("Under the authenticated forward decision",prefix+"\n\nUnder the authenticated forward decision")};
    const q={...p,authorization:{...p.authorization,contract_review:{...p.authorization.contract_review,...authorityRef(r,"contract_review")}}};
    await assert.rejects(h.auth(c,q,(v,e)=>e.endsWith("/41")?r:v));assert.equal(ledger(),unchanged);
  }
  assert.equal(ledger(),unchanged);assert.deepEqual(latest(),tip);
  c.postPass={tip,originalGrant,originalReceipt};
  console.log(JSON.stringify({synthetic_only:true,post_pass_controls:true,refusals_changed_ledger:false}));
}

async function completePostPass(c,h) {
  const {tip,originalGrant,originalReceipt}=c.postPass,proof=h.proof(c),cap=await h.auth(c,proof);
  const latest=()=>reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch});
  assert.deepEqual(latest(),tip);
  assert.throws(()=>h.begin(c,proof,null));assert.throws(()=>h.begin(c,proof,cap,{revisionLive:{...c.live,inventory:digest("changed")}}));
  c.behaviorPath="scripts/registration.mjs";
  const second=await executeFixture(c,{...h,begin(ctx,p,cap,opts){const a=h.begin(ctx,p,cap,{...opts,runId:"positive-successor"});assert.throws(()=>h.begin(ctx,p,cap,opts));return a;}},proof,cap,c.browser,c.packages);
  assert.equal(second.stock.valid_deciding_evidence,true);assert.equal(latest().reviewed_revision_consumed,2);
  assert.equal(latest().revision_commission,tip.revision_commission);assert.deepEqual(latest().revision_grants,tip.revision_grants);
  assert.equal(JSON.stringify(c.authority.grant),originalGrant);assert.equal(digest(c.passed.receipt),originalReceipt);
  const material=structuredClone(proof);delete material.authorization;delete material.sha256;delete material.local_relative_path;
  const file=path.join(c.artifacts,"spent-preparation.json");h.write(file,material);
  assert.throws(()=>inspectGitRevisionPreparation({file,repositoryRoot:c.checkout,predecessorRoot:c.checkout,anchorRoot:c.anchor,runtimeInputs:c.inputs,live:c.live}));
  assert.throws(()=>h.begin(c,proof,cap));
  console.log(JSON.stringify({synthetic_only:true,post_pass_successor:true,original_stock:true,successor_stock:true,same_commission:true,
    consumed:2,unchanged_original_success:true,unchanged_original_grant:true,refusals_changed_ledger:false}));
}

export async function runGitRevisionControls(c,h) {
  const original=c.prior, ledger=path.join(c.legacyRoot,"completion-1.json"), edge=path.join(c.legacyRoot,"correction-successor.json");
  const completion=h.read(ledger), issues=["receipt_classified_outcome_not_passing","receipt_current_inputs_unverified","receipt_final_result_not_pass",
    "receipt_input_observation_blocked","receipt_non_deciding","receipt_phase_environment_binding_invalid",
    ...phaseIds.slice(3).map(id=>"phase_not_passing:"+id)];
  const stock={content_fingerprint:original.integrity.content_fingerprint,status:"non_deciding_or_stale",valid_deciding_evidence:false,issues,
    dimensions:{historical_integrity:"intact",execution:"incomplete_or_failed",evidence_validity:"invalid_or_incomplete",safety:"blocked",current_merge_applicability:"blocked"}};
  const incident = (r=original,s=stock) => gitObservationIncident(r,r.attempt,completion,s,phaseIds);
  for(const mutate of [r=>r.inputs.events[0].diagnostic.stage="metadata_open",r=>r.inputs.events[0].resource="unrelated",
    r=>r.inputs.events.pop(),r=>r.inputs.events[1].after.git_projection.effective_sha256=r.inputs.resources[0].before.git_projection.effective_sha256,
    r=>r.inputs.secondary_faults=[],r=>r.checkout_ownership.released=false,r=>r.cleanup.companion_service.observations.after.coherent=false,
    r=>r.phases[4].browser_use=[{}],r=>r.phases[3].cleanup.remaining_owned_processes=1]){
    const r=structuredClone(original);mutate(r);for(const e of r.inputs.events)e.identity=inputEventIdentity(e);assert.throws(()=>incident(r));
  }
  assert.throws(()=>incident(original,{...stock,issues:issues.slice(1)}));
  const declaration=c.gitDeclaration, inventory=gitRevisionInventory(declaration);
  const changed=structuredClone(declaration);changed.resources[0].before.sha256=digest("raw edit");
  assert.notEqual(gitRevisionInventory(changed),inventory);
  for(const resources of [declaration.resources.slice(1),[...declaration.resources,declaration.resources[0]]])
    assert.throws(()=>gitRevisionInventory({...declaration,resources}));
  c.acceptedHead=c.git(["rev-parse","HEAD"]).toString().trim();c.acceptedTree=c.git(["rev-parse","HEAD^{tree}"]).toString().trim();
  h.prepare(c);const p=c.proof;
  p.schema="augnes.local-canonical-source-correction.v10";
  p.originals.stock=h.artifact(c,"prior-stock.log",JSON.stringify(stock));
  p.inputs.predecessor_sha256=digest(incident());p.inputs.inventory_sha256=inventory;
  const get=ref=>h.read(path.join(c.artifacts,ref.artifact)), blob=(head,name)=>c.git(["show",head+":"+name]);
  const source=get(p.source);source.reviewed_at=time(-16000);p.source=h.artifact(c,p.source.artifact,source);
  const focus=get(p.focused), command=focus.commands[0], previous=original.attempt.head;
  focus.input_remedy_resources=[];focus.finished_at=time(-10000);focus.implicated_paths.push(product);
  const bytes=blob(c.head,product);focus.source_files.push({path:product,byte_size:bytes.length,sha256:digest(bytes)});
  const witness=(head,exit,offset)=>({head,tested_source_head:head,finished_at:time(offset),environment:digest("fixture host"),
    fixture_sha256:digest(blob(c.head,fixture)),modules:[{path:product,sha256:digest(blob(head,product))}],command:command.command,
    node_version:CANONICAL_NODE_VERSION,result:{...command.result,exit_code:exit},stdout:h.artifact(c,"stdout-"+exit+".log",exit?"synthetic assertion failed\n":"synthetic assertion passed\n")});
  const red=witness(previous,1,-15000),green=witness(c.head,0,-11000);
  const retain=(name,value)=>h.artifact(c,name+".json",value);
  focus.regression={path:fixture,before:retain("red",red),after:retain("green",green)};
  Object.assign(command,{record:focus.regression.after,stdout:green.stdout,tested_source_head:c.head});
  p.focused=retain("focused",focus);
  const svc=original.cleanup.companion_service;
  c.live={inventory,service:{state:svc.after,diagnostics:{...svc.observations.after,finished_at:time(-50)}}};
  const material=structuredClone(p);delete material.accepted.review;delete material.authorization;
  const prep=path.join(c.artifacts,"preparation.json");h.write(prep,material);
  const args={file:prep,repositoryRoot:c.checkout,predecessorRoot:c.checkout,anchorRoot:c.anchor,runtimeInputs:c.inputs,live:c.live};
  assert.deepEqual(inspectGitRevisionPreparation(args).target,gitReviewTarget(p));assert.throws(()=>readSourceCorrectionProof(prep,c.checkout));
  assert.throws(()=>inspectGitRevisionPreparation({...args,live:{...c.live,inventory:digest("changed")}}));
  h.write(prep,{...material,prior_attempt_id:"stale-tip"});assert.throws(()=>inspectGitRevisionPreparation(args));h.write(prep,material);
  for(const mutate of [w=>w.tested_source_head=c.head,w=>delete w.tested_source_head,w=>w.modules[0].sha256=digest("different source"),w=>w.fixture_sha256=digest("wrong regression"),w=>w.result.exit_code=0]){
    const bad=structuredClone(red);mutate(bad);
    h.write(prep,{...material,focused:retain("bad-focus",{...focus,regression:{...focus.regression,before:retain("bad-red",bad)}})});
    assert.throws(()=>inspectGitRevisionPreparation(args),/revision_git_regression_invalid/);
  }
  h.write(prep,material);
  const {review,grant}=c.authority;
  const target=gitReviewTarget(p);
  review.body=["Source review decision: ACCEPT / RETAIN for prospective qualification.",p.base,p.head,p.tree,p.prior_receipt_fingerprint,target].join("\n");
  review.submitted_at=time(-8000);grant.created_at=grant.updated_at=time(-5000);
  grant.body=["Authorize prospective Mac qualification of this reviewed Git-observation successor.",p.schema,p.branch,p.base,p.head,p.tree,p.prior_receipt_fingerprint,target,"https://github.com/hynk-studio/augnes/pull/999#pullrequestreview-10",
    "Separate fresh-process stock and independent audit."].join("\n");
  const bind=()=>{p.accepted.review.sha256=digest(reviewedRevisionAuthorityObservation(review,"accepted_revision"));
    p.authorization.grant_sha256=digest(reviewedRevisionAuthorityObservation(grant,"execution_commission"));h.write(c.file,p);};
  const reviewBody=review.body,grantBody=grant.body;
  for (const bad of ["Source review decision: HOLD. Example for a later review:\n~~~text\n"+reviewBody+"\n~~~","> "+reviewBody,reviewBody.replace(p.head,"a".repeat(40))]){
    review.body=bad;bind();await assert.rejects(h.auth(c,h.proof(c)),/revision_authority_scope_invalid/);
  }
  review.body=reviewBody;
  for(const bad of ["Execution denied. A future commission might read:\n~~~text\n"+grantBody+"\n~~~","> "+grantBody,grantBody.replace(target,"")]){
    grant.body=bad;bind();await assert.rejects(h.auth(c,h.proof(c)),/revision_authority_scope_invalid/);
  }
  grant.body=grantBody;bind();const proof=h.proof(c),cap=await h.auth(c,proof);
  assert.throws(()=>h.begin(c,proof,{observations:cap.observations}));
  assert.throws(()=>h.begin(c,proof,cap,{revisionLive:{...c.live,inventory:digest("unstable")}}),/revision_git_target_unverified/);
  const ledgerBytes=readFileSync(ledger);h.write(ledger,JSON.stringify(completion,null,2));
  try{assert.throws(()=>h.begin(c,proof,cap),/revision_original_ledger_changed/);}finally{h.write(ledger,ledgerBytes);}
  assert(!existsSync(edge));
  c.firstLedgerHash=digest(ledgerBytes); c.ledgerPath=path.relative(c.anchor,ledger);
}

export async function completeGitRevisionControls(c,h) {
  const ledger=path.join(c.anchor,c.ledgerPath), ledgerBytes=readFileSync(ledger);
  assert.equal(digest(ledgerBytes),c.firstLedgerHash);
  const proof=h.proof(c),cap=await h.auth(c,proof);
  await checkGitSourceSuccessor(c,h,proof,cap);
  assert.throws(()=>h.begin(c,proof,cap));
  assert.equal(h.read(ledger).disposition,"unknown_relevance");assert.deepEqual(readFileSync(ledger),ledgerBytes);
  console.log(JSON.stringify({synthetic_only:true,git_revision_controls:["protected Git race then effective change","unrelated fault, incomplete stock and unsettled cleanup refused",
    "actual raw/effective input identities, incomplete inventory and stale tip","exact product and regression byte witnesses","preparation cannot reserve",
    "negative review, missing scope, spoofed authority and unsafe inputs refused","exclusive successor, original ledger retained and read-only stock"]}));
}

// Controlled historical interruption; real disposable Git reads/mutations,
// natural child settlement, authenticated transport and append-only admission.
// This is not production qualification or authority for any existing PR.
export async function runGitInputRevisionControls(c,h) {
  const original=c.prior, ledger=path.join(c.legacyRoot,"completion-1.json"), edge=path.join(c.legacyRoot,"correction-successor.json");
  const historical=[ledger,path.join(c.legacyRoot,"attempt-1.json"),path.join(c.checkout,".augnes-local-verification/receipts",original.run.id+".json")];
  const historicalBytes=historical.map(f=>readFileSync(f));
  const stock={content_fingerprint:original.integrity.content_fingerprint,status:"non_deciding_or_stale",valid_deciding_evidence:false,
    issues:["receipt_classified_outcome_not_passing","receipt_current_inputs_unverified","receipt_final_result_not_pass",
      "receipt_input_observation_blocked","receipt_non_deciding","receipt_phase_environment_binding_invalid",...phaseIds.slice(3).map(id=>"phase_not_passing:"+id)],
    dimensions:{historical_integrity:"intact",execution:"incomplete_or_failed",evidence_validity:"invalid_or_incomplete",safety:"blocked",current_merge_applicability:"blocked"}};
  const completion=h.read(ledger), incident=gitObservationIncident(original,original.attempt,completion,stock,phaseIds);
  h.prepare(c); const p=c.proof;
  assert.equal(p.head,original.attempt.head); assert.equal(p.tree,original.attempt.tree);
  p.schema="augnes.local-canonical-source-correction.v10";p.commission.input_revision=GIT_INPUT_REVISION;
  p.originals.stock=h.artifact(c,"prior-stock.log",JSON.stringify(stock));p.inputs.predecessor_sha256=digest(incident);
  const config=path.join(c.checkout,".git/config");
  const observe=()=>freezeInputContract({resources:[createGitTrackingResource(config,[c.checkout])],pathKind:"isolated-model-free-v1",binding:{}}).snapshot().resources[0];
  c.gitDeclaration.resources[0]=observe();
  const inventory={...c.gitDeclaration,binding:{head:p.head,tree:p.tree,runtime_inputs:c.inputs}};
  const snapshot={...inventory,fingerprint:digest(inventory),first_fault:null,secondary_faults:[],events:[]};
  p.inputs.inventory_sha256=gitRevisionInventory(snapshot);
  const module=new URL("../local-canonical-inputs.mjs",import.meta.url).href;
  const probe='import assert from "node:assert/strict"; import path from "node:path"; import {createGitTrackingResource,freezeInputContract,digest} from '+JSON.stringify(module)+'; const root=process.cwd(); const read=()=>freezeInputContract({resources:[createGitTrackingResource(path.join(root,".git/config"),[root])],pathKind:"isolated-model-free-v1",binding:{}}).snapshot().resources; const a=read(),b=read(); assert.equal(digest(a),digest(b)); assert.equal(a[0].before.git_projection.applicable,true); console.log(JSON.stringify(a[0]));';
  const command="node --input-type=module -e "+JSON.stringify(probe);
  let stdout="";
  const result=await h.run({command:process.execPath,args:["--input-type=module","-e",probe],cwd:c.checkout,env:c.env,
    suite:"git-input-prospective",label:"actual stable protected Git input",timeoutMs:5000,stdout:{write(v){stdout+=v;}},stderr:process.stderr,log(){}});
  assert.equal(result.exit_code,0);assert(result.exit_observed && result.streams_closed && result.cleanup_completed && result.remaining_owned_processes===0);
  const get=ref=>h.read(path.join(c.artifacts,ref.artifact)), artifact=(name,v)=>h.artifact(c,name,v);
  assert.deepEqual(JSON.parse(stdout),inventory.resources[0]);
  const output=artifact("stable-input.log",stdout), record=artifact("stable-input.json",{command,tested_source_head:p.head,finished_at:time(-10000),result});
  const focus={...get(p.focused),finished_at:time(-9000),remedy:"Completed upstream publication before freezing the changed protected Git input; product source is unchanged.",
    input_remedy_resources:["git-config"],input_inventory:artifact("input-inventory.json",snapshot),implicated_paths:[],
    commands:[{command,tested_source_head:p.head,result,record,stdout:output}]};
  p.focused=artifact("focused.json",focus);
  const source={...get(p.source),reviewed_at:time(-16000)};p.source=artifact("source.json",source);
  const svc=original.cleanup.companion_service;
  c.live={inventory:p.inputs.inventory_sha256,service:{state:svc.after,diagnostics:{...svc.observations.after,finished_at:time(0)}}};
  const prep=path.join(c.artifacts,"preparation.json");
  const prepare=(candidate=p,live=c.live)=>{
    const material=structuredClone(candidate);delete material.accepted.review;delete material.authorization;h.write(prep,material);
    return inspectGitRevisionPreparation({file:prep,repositoryRoot:c.checkout,predecessorRoot:c.checkout,anchorRoot:c.anchor,runtimeInputs:c.inputs,live});
  };
  assert.deepEqual(prepare().target,gitReviewTarget(p));assert(!existsSync(edge));
  // A real Git product delta cannot use the unchanged-product lane.
  h.write(path.join(c.checkout,product),"let decision = changedProduct();\n");c.git(["add",product]);
  const productTree=c.git(["write-tree"]).toString().trim();
  const productHead=c.git(["-c","user.name=Fixture","-c","user.email=fixture@example.invalid","commit-tree",productTree,"-p",p.head,"-m","product control"]).toString().trim();
  c.git(["restore","--source=HEAD","--staged","--worktree","--",product]);
  const delta=from=>{const bytes=c.git(["diff","--binary","--full-index","--no-ext-diff","--no-textconv",from,productHead,"--"]);
    return {bytes:bytes.length,sha256:digest(bytes),paths:c.git(["diff","--name-only",from,productHead,"--"]).toString().trim().split("\n").filter(Boolean).sort()};};
  const productCandidate={...structuredClone(p),head:productHead,tree:productTree,accepted:{...p.accepted,head:productHead,tree:productTree}};
  productCandidate.source=artifact("product-delta.json",{...source,accepted_to_final:delta(productHead),predecessor_to_final:delta(p.head),main_to_final:delta(p.base)});
  assert.throws(()=>prepare(productCandidate),/revision_product_source_changed/);
  for (const mutate of [
    v=>v.resources[0].before=structuredClone(original.inputs.resources[0].before),
    v=>v.resources[0].before.git_projection.scope_fingerprint=digest("substituted scope"),
    v=>v.resources[0].before.metadata.mode="33206",
    v=>v.resources[0].before.metadata.links="2",
    v=>v.resources[0].location_fingerprint=digest("relocated"),
    v=>v.resources.splice(1,1),
    v=>v.events.push({resource:"unexplained"}),
  ]) {
    const altered=structuredClone(snapshot);mutate(altered);
    const {contract,path_kind,binding,resources}=altered;altered.fingerprint=digest({contract,path_kind,binding,resources});
    const candidate=structuredClone(p);
    assert.throws(()=>{
      candidate.inputs.inventory_sha256=gitRevisionInventory(altered);
      candidate.focused=artifact("bad-focus.json",{...focus,input_inventory:artifact("bad-inventory.json",altered)});
      prepare(candidate,{...c.live,inventory:candidate.inputs.inventory_sha256});
    });
  }
  for(const change of [q=>delete q.commission.input_revision,q=>q.commission.input_revision="new-label",
    q=>q.prior_attempt_id="stale",q=>q.prior_receipt_fingerprint=digest("substitution")]){
    const bad=structuredClone(p);change(bad);assert.throws(()=>prepare(bad));
  }
  assert.throws(()=>prepare(p,{...c.live,inventory:digest("unverified complete inventory")}));
  assert.throws(()=>prepare(p,{...c.live,service:{...c.live.service,state:{...svc.after,preservation_valid:false}}}));
  const oldCompletion=readFileSync(ledger);
  h.write(ledger,{...completion,cleanup_complete:false});
  try{assert.throws(()=>prepare());}finally{h.write(ledger,oldCompletion);}
  const mergeKey="branch."+c.branch+".merge", ownMerge="refs/heads/"+c.branch;
  c.git(["config",mergeKey,"refs/heads/main"]);
  assert.throws(()=>prepare(),/revision_git_publication_unsettled/);
  c.git(["config",mergeKey,ownMerge]);
  // Real unsafe file and protected edit controls, through the production reader.
  const frozen=freezeInputContract({resources:[createGitTrackingResource(config,[c.checkout])],pathKind:"isolated-model-free-v1",binding:{}});
  c.git(["config",mergeKey,"refs/heads/main"]);frozen.check();
  assert.equal(frozen.snapshot().first_fault.disposition,"input_invalidation");
  c.git(["config",mergeKey,ownMerge]);
  const mode=statSync(config).mode;
  chmodSync(config,0o666);
  try{assert.throws(()=>gitRevisionInventory({...snapshot,resources:[observe(),...snapshot.resources.slice(1)]}));}finally{chmodSync(config,mode);}
  const alias=config+".alias";linkSync(config,alias);try{assert.throws(observe);}finally{rmSync(alias);}
  // Freeze the actual settled input after controls, never reuse a pre-edit full-file inventory.
  inventory.resources[0]=observe();
  Object.assign(snapshot,inventory,{fingerprint:digest(inventory)});
  p.inputs.inventory_sha256=gitRevisionInventory(snapshot);c.live.inventory=p.inputs.inventory_sha256;
  focus.input_inventory=artifact("input-inventory.json",snapshot);p.focused=artifact("focused.json",focus);
  c.gitDeclaration=inventory;
  const {review,grant}=c.authority,target=gitReviewTarget(p);
  review.body=["Source review decision: ACCEPT / RETAIN for prospective qualification.",p.base,p.head,p.tree,p.prior_receipt_fingerprint,target,GIT_INPUT_REVISION,GIT_INPUT_HISTORY_BOUNDARY].join("\n");
  review.submitted_at=time(-8000);grant.created_at=grant.updated_at=time(-5000);
  grant.body=["Authorize prospective Mac qualification of this stable Git-input target.",p.schema,p.branch,p.base,p.head,p.tree,p.prior_receipt_fingerprint,target,
    GIT_INPUT_REVISION,GIT_INPUT_HISTORY_BOUNDARY,"https://github.com/hynk-studio/augnes/pull/999#pullrequestreview-10","Separate fresh-process stock and independent audit."].join("\n");
  const bind=()=>{p.accepted.review.sha256=digest(reviewedRevisionAuthorityObservation(review,"accepted_revision"));
    p.authorization.grant_sha256=digest(reviewedRevisionAuthorityObservation(grant,"execution_commission"));h.write(c.file,p);};
  const grantBody=grant.body,reviewBody=review.body;
  for(const object of [review,grant]) {
    const body=object.body;
    for(const bad of [body.replace(GIT_INPUT_HISTORY_BOUNDARY,""),body.replace(GIT_INPUT_REVISION,""),"> "+body,"HOLD\n"+body]){
      object.body=bad;bind();await assert.rejects(h.auth(c,h.proof(c)));
    }object.body=body;
  }
  assert.equal(review.body,reviewBody);assert.equal(grant.body,grantBody);bind();
  const proof=h.proof(c),cap=await h.auth(c,proof);
  assert.throws(()=>h.begin(c,proof,null));
  assert.throws(()=>h.begin(c,proof,{observations:cap.observations}));
  assert.throws(()=>h.begin(c,proof,cap,{revisionLive:{...c.live,inventory:digest("changed at admission")}}));
  // Two ordinary fresh processes race for one existing exclusive successor.
  // The winning reservation is deliberately left incomplete in this isolated
  // fork, so interruption cannot become another allowance.
  const raceAnchor=path.join(c.root,"race-anchor"),go=path.join(c.root,"race-go"),ready=[],packets=[];
  cpSync(c.anchor,raceAnchor,{recursive:true});
  for(let i=0;i<2;i++){
    const checkout=path.join(c.root,"racing-checkout-"+i),file=path.join(c.root,"race-packet-"+i+".json"),readyFile=path.join(c.root,"race-ready-"+i);
    cpSync(c.checkout,checkout,{recursive:true,filter:source=>source!==path.join(c.checkout,".augnes-local-verification/checkout-owner.json")});
    h.write(file,{anchor:raceAnchor,checkout,file:path.join(checkout,path.relative(c.checkout,c.file)),inputs:c.inputs,authority:c.authority,live:c.live,ready:readyFile,go});
    ready.push(readyFile);packets.push(file);
  }
  let raceOutput="";
  const racing=packets.map(file=>h.run({command:process.execPath,args:[fileURLToPath(new URL("./local-canonical-reviewed-revision.mjs",import.meta.url)),"--race",file],
    cwd:c.checkout,env:c.env,suite:"git-input-prospective",label:"competing stable-input reservation",timeoutMs:10000,
    stdout:{write(v){raceOutput+=v;}},stderr:process.stderr,log(){}}));
  let reached=false, results;
  try{
    const deadline=Date.now()+8000;
    while(!ready.every(existsSync)&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,5));
    reached=ready.every(existsSync);
  }finally{h.write(go,"go");results=await Promise.allSettled(racing);}
  assert(reached);
  for(const r of results){assert.equal(r.status,"fulfilled");assert.equal(r.value.exit_code,0);assert(r.value.cleanup_completed && r.value.remaining_owned_processes===0);}
  assert.equal(raceOutput.split("\n").filter(v=>v==="admitted").length,1);
  assert.equal(raceOutput.split("\n").filter(v=>v==="refused").length,1);
  const raceFamilies=path.join(raceAnchor,".augnes-local-verification/families");
  const reserved=readdirSync(raceFamilies).filter(id=>id!==p.prior_family_id);
  assert.equal(reserved.length,1);assert(existsSync(path.join(raceFamilies,reserved[0],"attempt-1.json")));
  assert(!existsSync(path.join(raceFamilies,reserved[0],"completion-1.json")));
  assert(existsSync(path.join(raceFamilies,p.prior_family_id,"correction-successor.json")));
  const exe=inventory.resources.find(r=>r.id==="browser-executable");
  const browser={contract:"augnes.local-canonical-browser-use.v2",executable_name:"Fixture",location_fingerprint:exe.location_fingerprint,before:exe.before,after:exe.before,
    actual_version:"Chrome/1",runtime_versions:{http:"Chrome/1",cdp:"Chrome/1"},disposition:"unchanged",unchanged:true};
  const completed=await executeFixture(c,h,proof,cap,browser,dependencyRecords(c));
  assert.equal(completed.stock.valid_deciding_evidence,true);assert.equal(completed.child.result.exit_code,0);
  assert.throws(()=>h.begin(c,proof,cap));assert.throws(()=>prepare());
  const tip=reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch});
  assert.equal(tip.reviewed_revision_consumed,1);
  for(const [i,file] of historical.entries())assert.deepEqual(readFileSync(file),historicalBytes[i]);
  assert.equal(stock.valid_deciding_evidence,false);assert.equal(original.inputs.first_fault.disposition,"observer_failure");
  console.log(JSON.stringify({synthetic_only:true,unchanged_product:true,stable_protected_input:true,natural_child:true,separate_stock:true,
    historical_invalidity_preserved:true,consumed:1,controls:["missing or negative authority","unknown history acknowledgment","unchanged, incomplete or substituted input","unrelated product delta","stale predecessor","unsafe permissions and links","unsettled cleanup","in-flight input invalidation","competing reservations and exclusive replay"]}));
}
