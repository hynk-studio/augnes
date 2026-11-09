// Disposable authority and physical ledgers only. Compiler processes are real;
// fixture phase projections and Browser records are never product evidence.
import assert from "node:assert/strict";
import path from "node:path";
import {execFileSync} from "node:child_process";
import {readFileSync,existsSync,symlinkSync,rmSync,chmodSync} from "node:fs";
import {digest,observeCanonicalRuntimeInputs} from "../local-canonical-inputs.mjs";
import {observeTypecheckCompiler,observeGeneratedTypeInputs,typecheckDiagnostics,REPOSITORY_TYPECHECK} from "../local-canonical-typecheck-witness.mjs";
import {inspectGitRevisionPreparation,prepareMaterialSourceRevision,reconstructAttemptTip,reviewedRevisionAuthorityObservation,REVIEWED_REVISION_PHASES} from "../local-canonical-attempts.mjs";
import {MATERIAL_SOURCE_CORRECTION,MATERIAL_HISTORY_BOUNDARY,gitReviewTarget,verifyGitRevisionFailure} from "../local-canonical-git-observation.mjs";
import {serialInheritanceFrom,SERIAL_HISTORY} from "../local-canonical-serial-aggregate.mjs";
import {executeFixture,dependencyRecords} from "./local-canonical-browser-successor.mjs";
import {inspectClassifiedEvidence,canonicalSerialize} from "../local-canonical-receipt.mjs";
import {createPrivateReviewExport,inspectPrivateReviewExport} from "../local-canonical-review-export.mjs";
const clone=structuredClone,now=()=>new Date().toISOString();
const runner="scripts/canonical-child-runner.mjs",decision="Source review decision: ACCEPT / RETAIN for prospective qualification.";

export function seedSerialMaterialCompiler(c,h,sourceRoot) {
  c.inputs=observeCanonicalRuntimeInputs();
  for(const file of ["package.json","package-lock.json","tsconfig.json"])h.write(path.join(c.checkout,file),readFileSync(path.join(sourceRoot,file)));
  h.write(path.join(c.checkout,"app/page.tsx"),'export default function Page(){return <main>Disposable compiler fixture</main>;}\n');
  h.write(path.join(c.checkout,"scripts/message-caller.ts"),'import {runCanonicalChild} from "./canonical-child-runner.mjs";\nvoid runCanonicalChild({suite:"types",label:"types",command:"node",args:[],cwd:".",env:{},resourceOwner:undefined});\n');
  symlinkSync(path.join(sourceRoot,"node_modules"),path.join(c.checkout,"node_modules"),"dir");
  h.write(path.join(c.checkout,".git/info/exclude"),"node_modules\n.next/\nnext-env.d.ts\ntsconfig.tsbuildinfo\n.augnes-local-verification/\n");
  c.git(["add","package.json","package-lock.json","tsconfig.json","app","scripts/message-caller.ts"]);
}

export async function runSerialMaterialControls(c,h,serialProof,serialAuthority,sourceRoot,browserRecord) {
  const substituted=path.join(c.root,"substituted-compiler");
  h.write(path.join(substituted,"node_modules/.bin/tsc"),'console.log("not the compiler");\n');
  for(const name of ["typescript","next"])symlinkSync(path.join(sourceRoot,"node_modules",name),path.join(substituted,"node_modules",name),"dir");
  symlinkSync(path.join(sourceRoot,"node_modules/next/dist/bin/next"),path.join(substituted,"node_modules/.bin/next"));
  assert.throws(()=>observeTypecheckCompiler(substituted,{env:c.env}),/revision_typecheck_launcher_invalid/);
  rmSync(path.join(substituted,"node_modules/.bin/tsc"));
  symlinkSync(path.join(sourceRoot,"node_modules/typescript/bin/tsc"),path.join(substituted,"node_modules/.bin/tsc"));
  assert.throws(()=>observeTypecheckCompiler(substituted,{env:{...c.env,NODE_OPTIONS:"--no-warnings"}}),/revision_typecheck_overrides_invalid/);
  const shadowNode=path.join(substituted,"bin/node");h.write(shadowNode,'#!/bin/sh\nprintf "%s\\n" '+process.version+'\n');chmodSync(shadowNode,0o700);
  assert.equal(execFileSync(shadowNode,["--version"],{encoding:"utf8"}).trim(),process.version);
  assert.throws(()=>observeTypecheckCompiler(substituted,{env:{...c.env,PATH:path.dirname(shadowNode)+path.delimiter+c.env.PATH}}),/revision_typecheck_node_mismatch/);
  const compiler=async()=>{
    rmSync(path.join(c.checkout,"tsconfig.tsbuildinfo"),{force:true});
    const head=c.git(["rev-parse","HEAD"]).toString().trim(),dirty=c.git(["status","--porcelain=v1"]).toString().trim();assert.equal(dirty,"");
    const compilerBefore=observeTypecheckCompiler(c.checkout,{env:c.env});
    let output="";const sink={write(chunk){output+=chunk;}};const started_at=now();
    const result=await h.run({suite:"serial-material",label:"actual repository compiler",command:"npm",args:["run","typecheck"],cwd:c.checkout,env:c.env,timeoutMs:10000,stdout:sink,stderr:sink,log(){}});
    const generated=observeGeneratedTypeInputs(c.checkout);
    return {contract:"augnes.repository-typecheck-witness.v1",command:"npm run typecheck",tested_source_head:head,tree:c.git(["rev-parse","HEAD^{tree}"]).toString().trim(),dirty,
      source_after:{head,dirty:c.git(["status","--porcelain=v1"]).toString().trim(),files_unchanged:!c.git(["diff","HEAD"]).length},
      source_tree_sha256:digest(c.git(["ls-tree","-r","--full-tree",head])),
      config:["package.json","package-lock.json","tsconfig.json"].map(file=>({path:file,sha256:digest(c.git(["show",head+":"+file]))})),
      ...compilerBefore,compiler_after:observeTypecheckCompiler(c.checkout,{env:c.env}),generated,environment:digest(c.env),runtime_inputs_sha256:digest(c.inputs),
      node_version:process.versions.node,npm_version:execFileSync("npm",["--version"],{cwd:c.checkout,env:c.env,encoding:"utf8"}).trim(),
      cache_before:"absent",started_at,finished_at:now(),diagnostics:typecheckDiagnostics(output),result,output};
  };
  // Exactly the partial 3 PASS / typecheck FAIL / 12 NOT_RUN shape, using the
  // actual compiler exit. The outer executor still reports failure exit one.
  c.failurePhase="typecheck";
  const failed=await executeFixture(c,{...h,behavior:compiler},serialProof,serialAuthority,null,dependencyRecords(c));
  assert.equal(failed.child.result.exit_code,2);assert.equal(failed.stock.issues.length,17);
  assert.deepEqual(failed.receipt.phases.map(p=>p.status),[...Array(3).fill("pass"),"failure",...Array(12).fill("not_run")]);
  c.prior=failed.receipt;
  assert.equal(c.prior.attempt.source_correction.commission.delegation,undefined);
  const parent=path.join(c.anchor,".augnes-local-verification/families",c.prior.attempt.family_id),edge=path.join(parent,"correction-successor.json");
  const priorFiles=["attempt-1.json","completion-1.json"].map(f=>[path.join(parent,f),digest(readFileSync(path.join(parent,f)))]);
  const red=await compiler();assert.equal(red.result.exit_code,2);
  h.write(path.join(c.checkout,runner),readFileSync(path.join(sourceRoot,runner)));
  c.git(["add",runner]);c.git(["-c","user.name=Fixture","-c","user.email=fixture@example.invalid","commit","--quiet","-m","correct optional callback contract"]);
  c.head=c.git(["rev-parse","HEAD"]).toString().trim();c.tree=c.git(["rev-parse","HEAD^{tree}"]).toString().trim();
  c.acceptedHead=c.head;c.acceptedTree=c.tree;c.grantId=73;
  const green=await compiler();assert.equal(green.result.exit_code,0);
  const oldAuthority=clone(c.authority);h.prepare(c);const p=c.proof,read=r=>h.read(path.join(c.artifacts,r.artifact)),ref=(name,v)=>h.artifact(c,name,v);
  Object.assign(p.commission,{source_revision:MATERIAL_SOURCE_CORRECTION,maximum_invocations:1,inherited_serial:serialInheritanceFrom(serialProof,p)});
  p.inputs.inventory_sha256=serialProof.inputs.inventory_sha256;p.originals.stock=ref("prior-stock.log",JSON.stringify(failed.stock));
  p.source=ref("source.json",{...read(p.source),reviewed_at:now()});
  const witness=(label,value)=>{const w={...value,output:undefined,stdout:ref(label+".log",value.output)};return ref(label+".json",w);};
  const before=witness("compiler-red",red),after=witness("compiler-green",green),source=c.git(["show",p.head+":"+runner]);
  const focused={...read(p.focused),finished_at:now(),failed_phase:"typecheck",diagnosis:"Actual compiler rejects an omitted callback on the shared JavaScript runner signature.",
    remedy:"Make the callback explicitly optional while retaining actual IPC callback parameters and a falsy default.",implicated_paths:[runner],
    source_files:[{path:runner,byte_size:source.length,sha256:digest(source)}],input_remedy_resources:[],regression:{kind:REPOSITORY_TYPECHECK,before,after},
    commands:[{command:green.command,tested_source_head:p.head,result:green.result,record:after,stdout:read(after).stdout}]};
  p.focused=ref("focused.json",focused);
  const delegation={...oldAuthority.grant,id:71,created_at:now(),body:[
    "Authorize one materially corrected-source qualification assignment on "+p.branch+" in Draft PR #999. Adopt the reusable material-source-correction-v1 transition within the existing inventory-bound v7 owners for the observed in-scope product defect.",
    "Predecessor: "+p.prior_family_id+" / "+p.prior_attempt_id+" / "+p.prior_receipt_fingerprint+".",MATERIAL_HISTORY_BOUNDARY,
    "After separate independent acceptance of the actual correction, policy controls, exact published source and real preparation commitment, authorize the operator to record that decision faithfully and publish a separate new prospective commission through the authenticated maintainer identity. Each commission permits exactly one deciding invocation total; reservation or interruption consumes it. No ordinal two, recovery or unchanged-target retry under that commission. A further in-scope material correction requires fresh evidence, independent acceptance and new authenticated authority. Complete planner-selected qualification, separate fresh-process stock, owned cleanup and independent result audit remain required."
  ].join("\n\n")};delegation.updated_at=delegation.created_at;
  p.commission.delegation={id:delegation.id,sha256:digest(reviewedRevisionAuthorityObservation(delegation,"task_delegation"))};
  const inspect=q=>{const m=clone(q);delete m.authorization;delete m.accepted.review;delete m.local_relative_path;const file=path.join(c.artifacts,"material.json");h.write(file,m);
    return inspectGitRevisionPreparation({file,repositoryRoot:c.checkout,predecessorRoot:c.checkout,anchorRoot:c.anchor,runtimeInputs:c.inputs,live:c.live});};
  const prepared=inspect(p);assert.equal(prepared.authorized,false);assert.equal(prepared.reserved,false);assert.equal(prepared.consumed,1);assert(!existsSync(edge));
  const published={...oldAuthority.pr,head:{...oldAuthority.pr.head,sha:p.head}};
  const args={file:path.join(c.artifacts,"material.json"),repositoryRoot:c.checkout,predecessorRoot:c.checkout,anchorRoot:c.anchor,runtimeInputs:c.inputs,live:c.live};
  const transport={pullRequest:async()=>published,grant:async()=>delegation,permission:async()=>({permission:"admin",user:{login:delegation.user.login}})};
  assert.equal((await prepareMaterialSourceRevision(args,{transport})).published_head_checked,true);
  const devFile=path.join(c.checkout,".next/dev/types/probe.ts");h.write(devFile,"export type Added = true;\n");
  await assert.rejects(prepareMaterialSourceRevision(args,{transport}),/revision_typecheck_generated_changed/);
  rmSync(path.join(c.checkout,".next/dev"),{recursive:true});
  const parentPath="scripts/run-local-canonical-verification.mjs",parentSource=readFileSync(path.join(c.checkout,parentPath),"utf8");
  h.write(path.join(c.checkout,parentPath),parentSource.replaceAll("runProjectExperienceParent","runDisconnectedParent"));
  c.git(["add",parentPath]);c.git(["-c","user.name=Fixture","-c","user.email=fixture@example.invalid","commit","--quiet","-m","disconnect synthetic serial parent"]);
  const disconnected=clone(p);disconnected.head=c.git(["rev-parse","HEAD"]).toString().trim();disconnected.tree=c.git(["rev-parse","HEAD^{tree}"]).toString().trim();
  Object.assign(disconnected.accepted,{head:disconnected.head,tree:disconnected.tree});
  try{assert.throws(()=>inspect(disconnected),/revision_inherited_serial_connection_invalid/);}
  finally{c.git(["reset","--hard",p.head]);inspect(p);}
  for(const mutate of [d=>d.updated_at=new Date(Date.parse(d.created_at)+1000).toISOString(),d=>d.created_at=d.updated_at="2000-01-01T00:00:00Z",d=>d.user.type="Bot",d=>d.body="investigation only"]){
    const d=clone(delegation);mutate(d);const material=h.read(args.file);
    h.write(args.file,{...material,commission:{...material.commission,delegation:{id:d.id,sha256:digest(reviewedRevisionAuthorityObservation(d,"task_delegation"))}}});
    try{await assert.rejects(prepareMaterialSourceRevision(args,{transport:{...transport,grant:async()=>d}}),/revision_material_fresh_authority_required/);}
    finally{h.write(args.file,material);}
  }
  await assert.rejects(prepareMaterialSourceRevision(args,{transport:{...transport,pullRequest:async()=>({...published,draft:false})}}));
  const inherited=["Inherited serial envelope: "+p.commission.inherited_serial.envelope_sha256,...Object.values(p.commission.inherited_serial).map(String),SERIAL_HISTORY].join("\n");
  await new Promise(r=>setTimeout(r,2));const review={...oldAuthority.review,id:72,commit_id:p.head,submitted_at:now(),body:[decision,p.head,p.tree,p.base,gitReviewTarget(p),p.prior_receipt_fingerprint,MATERIAL_HISTORY_BOUNDARY,inherited].join("\n")};
  p.accepted.review={id:72,sha256:digest(reviewedRevisionAuthorityObservation(review,"accepted_revision"))};
  await new Promise(r=>setTimeout(r,2));const grant={...oldAuthority.grant,id:73,created_at:now(),body:[
    "Authorize one NEW prospective v7 reviewed_revision commission for a material source correction.",p.schema,p.branch,p.head,p.tree,p.base,gitReviewTarget(p),p.prior_receipt_fingerprint,
    "https://github.com/hynk-studio/augnes/pull/999#issuecomment-71","https://github.com/hynk-studio/augnes/pull/999#pullrequestreview-72",MATERIAL_HISTORY_BOUNDARY,inherited,
    "Old commission remains spent. Exactly one admitted deciding invocation total; demonstrated material correction and focused support; zero unchanged-target retry; zero extra recovery. Reservation/interruption consumes. No ordinal two, recovery or unchanged-target retry under this commission. Separate fresh-process stock and independent audit are required."
  ].join("\n")};grant.updated_at=grant.created_at;
  p.authorization={grant_comment_id:73,grant_sha256:digest(reviewedRevisionAuthorityObservation(grant,"execution_commission"))};
  c.authority={review,grant,pr:published,linked:{"repos/hynk-studio/augnes/issues/comments/71":delegation}};h.write(c.file,p);
  const proof=h.proof(c),cap=await h.auth(c,proof);assert.equal(inspect(p).target,prepared.target);
  let count=0;
  for(const mutate of [q=>delete q.commission.inherited_serial,q=>q.commission.inherited_serial.envelope_sha256=digest("other"),q=>q.commission.inherited_serial.origin_receipt_fingerprint=digest("other"),
    q=>q.prior_attempt_id="older",q=>q.prior_family_id=serialProof.prior_family_id,q=>q.commission.ordinal=2,q=>q.commission.maximum_invocations=2,q=>q.head=serialProof.head,q=>q.inputs.inventory_sha256=digest("drift")]){
    const q=clone(p);mutate(q);assert.throws(()=>inspect(q));count++;
  }
  for(const [key,mutate] of [["before",w=>w.result.exit_code=1],["before",w=>w.compiler[0].sha256=digest("compiler")],["after",w=>w.source_tree_sha256=digest("sparse")],
    ["after",w=>w.command="node assertion-wrapper.mjs"],["after",w=>w.config.pop()],["before",w=>w.diagnostics=[]],["after",w=>w.generated=[]],
    ["after",w=>w.source_after.files_unchanged=false],["after",w=>w.tested_source_head=serialProof.head],["after",w=>w.environment=digest("different")],["after",w=>w.result.cleanup_completed=false]]){
    const f=clone(focused),w=clone(read(f.regression[key]));mutate(w);f.regression[key]=ref("bad-witness-"+count+".json",w);
    if(key==="after")f.commands=[{...f.commands[0],record:f.regression.after,stdout:w.stdout,result:w.result,tested_source_head:w.tested_source_head}];
    assert.throws(()=>inspect({...p,focused:ref("bad-focused-"+count+".json",f)}));count++;
  }
  for(const mutate of [r=>r.phases[0].environment_fingerprint=digest("wrong"),r=>r.cleanup.completed=false,r=>r.outcome.disposition="unclassified_timeout",r=>r.phases[3].cleanup.termination_reason="cancelled"]){
    const r=clone(failed.receipt);mutate(r);assert.throws(()=>verifyGitRevisionFailure(r,failed.stock,c.inputs,REVIEWED_REVISION_PHASES,1,false,true));count++;
  }
  assert.throws(()=>verifyGitRevisionFailure(failed.receipt,{...failed.stock,issues:[...failed.stock.issues,"unexplained"]},c.inputs,REVIEWED_REVISION_PHASES,1,false,true));
  for(const ref of Object.values(p.originals)){const file=path.join(c.artifacts,ref.artifact),b=readFileSync(file);h.write(file,Buffer.concat([b,Buffer.from("\n")]));try{assert.throws(()=>inspect(p));}finally{h.write(file,b);}}
  for(const mutate of [d=>d.updated_at="2000-01-01T00:00:00Z",d=>d.body=d.body.replace("Inherited serial envelope:","Missing serial envelope:")])
    await assert.rejects(h.auth(c,proof,(v,e)=>{if(e.endsWith("/comments/73"))mutate(v);return v;}));
  const missingScope=clone(grant);missingScope.body=missingScope.body.replace("Inherited serial envelope:","Missing serial envelope:");
  const rebound=clone(p);rebound.authorization.grant_sha256=digest(reviewedRevisionAuthorityObservation(missingScope,"execution_commission"));
  h.write(c.file,rebound);c.authority.grant=missingScope;
  await assert.rejects(h.auth(c,h.proof(c)),/revision_authority_scope_invalid/);c.authority.grant=grant;h.write(c.file,p);
  const oldGrant=clone(p);oldGrant.authorization=clone(serialProof.authorization);h.write(c.file,oldGrant);
  assert.throws(()=>h.proof(c),/revision_commission_lineage_invalid/);h.write(c.file,p);
  assert(!existsSync(edge));for(const [file,hash] of priorFiles)assert.equal(digest(readFileSync(file)),hash);
  // Only this disposable fixture consumes its new synthetic grant.
  delete c.failurePhase;
  const success=await executeFixture(c,{...h,begin:(subject,proof,authority,extra)=>h.begin(subject,proof,authority,{...extra,runId:"serial-material-new"})},proof,cap,browserRecord,dependencyRecords(c));
  assert(success.stock.valid_deciding_evidence);
  const invalid=clone(success.receipt);delete invalid.phases.find(v=>v.id==="e2e-project-experience").serial_budget;
  const issues=[];inspectClassifiedEvidence(invalid,issues);assert(issues.includes("receipt_serial_budget_invalid"));
  const exported=createPrivateReviewExport(success.receipt);assert(inspectPrivateReviewExport(exported).structurally_valid);
  for(const mutate of [v=>delete v.attempt.source_correction.commission.inherited_serial,v=>delete v.phases.find(p=>p.id==="e2e-project-experience").serial_budget,
    v=>v.phases.find(p=>p.id==="e2e-project-experience").serial_budget.failure_code="serial_event_after_exit"]){
    const v=clone(exported);mutate(v);delete v.export_fingerprint;v.export_fingerprint=digest(canonicalSerialize(v));assert.equal(inspectPrivateReviewExport(v).structurally_valid,false);
  }
  assert.throws(()=>h.begin(c,proof,cap),/attempt_latest_tip_required/);
  assert.equal(reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch}).reviewed_revision_consumed,1);
  const currentFile=path.join(c.anchor,".augnes-local-verification/families",success.receipt.attempt.family_id,"attempt-1.json"),current=readFileSync(currentFile);
  const stripped=JSON.parse(current);delete stripped.source_correction.commission.inherited_serial;h.write(currentFile,stripped);
  try{assert.throws(()=>reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch}),/attempt_lineage_edge_invalid/);}
  finally{h.write(currentFile,current);}
  for(const [file,hash] of priorFiles)assert.equal(digest(readFileSync(file)),hash);
  console.log(JSON.stringify({serial_material_controls:{compiler:[red.result.exit_code,green.result.exit_code],source_before:red.tested_source_head,source_after:green.tested_source_head,
    partial_phases:[3,1,12],stock_issues:failed.stock.issues.length,prior_delegation_absent:true,prepared,negative_controls:count,
    fresh_stock:true,inherited_accounting_enforced:true,originals_unchanged:true},synthetic_only:true,deciding:false}));
}
