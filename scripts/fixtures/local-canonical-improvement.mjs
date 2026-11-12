// Synthetic contract material only. Never a source of real review or authority.
import { gzipSync } from "node:zlib";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { digest, observePreparedDependencyInputs } from "../local-canonical-inputs.mjs";
import { canonicalSerialize, finalizeReceipt } from "../local-canonical-receipt.mjs";
import { beginAttempt, finishAttempt, readSourceCorrectionProof, REVIEWED_REVISION_PHASES } from "../local-canonical-attempts.mjs";
import { acquireCheckoutVerificationOwnership, checkoutVerificationFingerprint } from "../local-canonical-checkout-ownership.mjs";
import { IMPROVEMENT_KIND, IMPROVEMENT_SCHEMA, IMPROVEMENT_CLAIMS, IMPROVEMENT_ACCEPT, IMPROVEMENT_GRANT, improvementAuthorityObservation, readImprovementOwnerRegistration } from "../local-canonical-improvement.mjs";
import { CANONICAL_NODE_VERSION } from "../local-canonical-environment.mjs";
export const write = (file,value) => {mkdirSync(path.dirname(file),{recursive:true,mode:0o700});writeFileSync(file,Buffer.isBuffer(value)||typeof value==="string"?value:canonicalSerialize(value),{mode:0o600});};
const time=n=>new Date(Date.now()-120000+n).toISOString();
export const natural={exit_code:0,signal:null,timed_out:false,cancelled:false,cleanup_completed:true,exit_observed:true,streams_closed:true,remaining_owned_processes:0,termination_reason:"natural_exit",duration_ms:100};
export function createImprovementFixture(root,env) {
  const c={root,checkout:path.join(root,"checkout"),anchor:path.join(root,"anchor"),branch:"codex/synthetic-improvement",env};
  mkdirSync(c.checkout);mkdirSync(c.anchor);c.owner=acquireCheckoutVerificationOwnership({repositoryRoot:c.checkout});
  c.git=args=>execFileSync("git",args,{cwd:c.checkout,env,timeout:5000,stdio:["ignore","pipe","pipe"]});
  c.git(["init","--quiet","-b",c.branch]);
  c.suite='const rootNode=(...args)=>({command:process.execPath,args:["--import","tsx",...args],cwd:repoRoot});\nconst suites={integration:[{id:"affected-owner",label:"synthetic affected workload",...rootNode("fixture.mjs"),timeoutMs:30000,requireNaturalExit:true}]};\n';
  write(path.join(c.checkout,"scripts/run-canonical-test-suite.mjs"),c.suite);write(path.join(c.checkout,"package-lock.json"),"{\"name\":\"fixture\"}\n");write(path.join(c.checkout,"package.json"),readFileSync(path.join(c.checkout,"package-lock.json")));c.git(["add","scripts","package-lock.json","package.json"]);
  const route="app/api/[id]/route.ts";write(path.join(c.checkout,route),"export const literalRoute=true;\n");c.git(["add","app"]);
  const module="lib/work.mjs";
  c.commit=value=>{write(path.join(c.checkout,module),value);c.git(["add","lib"]);c.git(["-c","user.name=Fixture","-c","user.email=fixture@example.invalid","commit","--quiet","-m","synthetic source"]);return c.git(["rev-parse","HEAD"]).toString().trim();};
  c.base=c.commit("export const value=0;\n");c.baseTree=c.git(["rev-parse","HEAD^{tree}"]).toString().trim();
  const request={anchorRoot:c.anchor,repositoryRoot:c.checkout,checkoutOwner:c.owner,branch:c.branch,head:c.base,tree:c.baseTree,runId:"root",contractFingerprint:digest("fixture")};
  const initial=beginAttempt(request), initialReceipt=finalizeReceipt({repository:{head_sha:c.base,tree_sha:c.baseTree,base_sha:c.base},run:{id:initial.attempt_id},outcome:{disposition:"product_failure"},cleanup:{completed:true}});
  const receiptDir=path.join(c.checkout,".augnes-local-verification/receipts");write(path.join(receiptDir,"root.json"),initialReceipt);
  finishAttempt(initial,{receiptFingerprint:initialReceipt.integrity.content_fingerprint,disposition:"product_failure",cleanupComplete:true});
  const initialRoot=path.join(c.anchor,".augnes-local-verification/families",initial.family_id);
  const initialCompletion=JSON.parse(readFileSync(path.join(initialRoot,"completion-1.json")));initialCompletion.finished_at=time(0);write(path.join(initialRoot,"completion-1.json"),initialCompletion);
  c.before=c.commit("export function read(validate){validate();validate();validate();return 1;}\n");c.beforeTree=c.git(["rev-parse","HEAD^{tree}"]).toString().trim();
  const oldFolder=path.join(c.checkout,".augnes-local-verification/legacy");
  const oldRef=(name,value)=>{write(path.join(oldFolder,name),value);return{artifact:name,sha256:digest(readFileSync(path.join(oldFolder,name)))};};
  const fixture=oldRef("regression.mjs","// Synthetic ordinary regression fixture\n");
  const oldWitnesses=Object.fromEntries(["before","after"].map((side,i)=>{const source=digest(c.git(["show",`${i?c.before:c.base}:${module}`]));return[side,{...oldRef(side+".json",{fixture_sha256:fixture.sha256,environment_fingerprint:digest(env),source_sha256:source,result:{...natural,exit_code:i?0:1},node_version:CANONICAL_NODE_VERSION,finished_at:time(1000+i*1000)}),source_sha256:source}];}));
  const review=oldRef("review.json",{schema:"augnes.local-canonical-candidate-review.v1",kind:"source_revision",head:c.before,tree:c.beforeTree,predecessor_head:c.base,predecessor_tree:c.baseTree,
    source_review:"complete",reviewed_at:time(3000),authority_reference:"https://github.com/hynk-studio/augnes/pull/999",delta_sha256:digest(c.git(["diff","--binary","--no-ext-diff","--no-textconv",c.base,c.before,"--"])),changed_paths:[module]});
  const oldProof={schema:IMPROVEMENT_SCHEMA,kind:"source_revision",branch:c.branch,prior_family_id:initial.family_id,prior_number:1,prior_attempt_id:initial.attempt_id,prior_receipt_fingerprint:initialReceipt.integrity.content_fingerprint,
    prior_receipt_path:".augnes-local-verification/receipts/root.json",head:c.before,tree:c.beforeTree,defect:"synthetic_value",source_module:module,fixture_artifact:fixture.artifact,fixture_sha256:fixture.sha256,environment_fingerprint:digest(env),...oldWitnesses,review};
  write(path.join(oldFolder,"proof.json"),oldProof);const legacy=readSourceCorrectionProof(path.join(oldFolder,"proof.json"),c.checkout);
  c.prior=beginAttempt({...request,head:c.before,tree:c.beforeTree,runId:"ordinary-v2",sourceCorrection:legacy});
  c.log='[canonical:integration] child_result label="synthetic affected workload" duration_ms=30001 exit_code=null signal=SIGTERM timed_out=true\n';
  write(path.join(c.checkout,".augnes-local-verification/logs/ordinary-v2/integration.log"),c.log);
  c.original=finalizeReceipt({receipt_version:4,repository:{branch:c.branch,head_sha:c.before,tree_sha:c.beforeTree,base_sha:c.base},run:{id:c.prior.attempt_id},attempt:c.prior,outcome:{disposition:"product_failure"},cleanup:{completed:true},phases:[{id:"integration",status:"failure",log:{bytes:Buffer.byteLength(c.log),relative_path:".augnes-local-verification/logs/ordinary-v2/integration.log",truncated:false}}]});
  write(path.join(receiptDir,"ordinary-v2.json"),c.original);finishAttempt(c.prior,{receiptFingerprint:c.original.integrity.content_fingerprint,disposition:"product_failure",cleanupComplete:true});
  c.priorRoot=path.join(c.anchor,".augnes-local-verification/families",c.prior.family_id);
  const complete=JSON.parse(readFileSync(path.join(c.priorRoot,"completion-1.json")));complete.finished_at=time(4000);write(path.join(c.priorRoot,"completion-1.json"),complete);
  c.head=c.commit("export function read(validate){validate();return 1;}\n");c.tree=c.git(["rev-parse","HEAD^{tree}"]).toString().trim();
  c.folder=path.join(c.checkout,".augnes-local-verification/improvement");c.file=path.join(c.folder,"proof.json");
  c.ref=(name,value)=>{write(path.join(c.folder,name),value);return{artifact:name,sha256:digest(readFileSync(path.join(c.folder,name)))};};
  c.inputs={contract:"augnes.local-canonical-runtime-inputs.v1",node:{location_fingerprint:digest("node"),observation:{present:true,sha256:digest("node"),metadata:{mode:"33261",uid:"1",gid:"1",device:"1",inode:"1",links:"1",bytes:"4",mtime_ns:"1",ctime_ns:"1"},permission_identity:digest("permissions"),executable_identity_policy:"shared-posix-v1"}},headers:{location_fingerprint:digest("headers"),observation:{contract:"augnes.local-canonical-node-headers.v1",present:true,location_fingerprint:digest("headers"),inventory_sha256:digest("inventory"),content_sha256:digest("headers"),permission_sha256:digest("permissions"),entries:2,bytes:10}}};
  write(path.join(c.checkout,"node_modules/compiler/index.js"),"fixture");
  write(path.join(c.checkout,"node_modules/@fixture/scoped/index.js"),"scoped");
  const dependencyObservation=observePreparedDependencyInputs({repositoryRoot:c.checkout,phaseId:"dependencies-root"});
  const manifest=(name,rows=[{path:"fixture",sha256:digest("fixture"),bytes:7}])=>c.ref(name,rows);
  c.p={schema:IMPROVEMENT_SCHEMA,kind:IMPROVEMENT_KIND,branch:c.branch,base:c.base,head:c.head,tree:c.tree,pull_request:999,prior_family_id:c.prior.family_id,prior_number:1,prior_attempt_id:c.prior.attempt_id,prior_receipt_fingerprint:c.original.integrity.content_fingerprint,prior_receipt_path:".augnes-local-verification/receipts/ordinary-v2.json",campaign:null,review:null,authorization:null};
  c.target={repository:"hynk-studio/augnes",origin:"https://github.com/hynk-studio/augnes.git",...Object.fromEntries("pull_request branch base head tree prior_family_id prior_number prior_attempt_id prior_receipt_fingerprint".split(" ").map(k=>[k,c.p[k]]))};
  const receiving=c.ref("receiving.json",{body:"synthetic history accepted with limits"});
  const history={original_index:c.ref("original-index.json",{observations:[{name:"old-slow-pass"},{name:"authoring-failure"}]}),receiving_review_sha256:receiving.sha256,observations:[{id:"old-slow-pass",role:"supporting_original",original:c.ref("slow.json",{name:"old-slow-pass"}),adverse:true},{id:"authoring-failure",role:"authoring_failure",original:c.ref("authoring.json",{name:"authoring-failure"}),adverse:true}],adverse:["authoring-failure","old-slow-pass"]};
  const assertions=["positive","refusal","write","no_write","isolation","fresh_public","fresh_standalone","fresh_process","history_boundary"].map(category=>({id:category,category,expectation:category==="history_boundary"?"127/128/257 retained and foreign260":category})).sort((a,b)=>a.id.localeCompare(b.id));
  const registration=c.ref("registration.json",{source:c.ref("registration-source.mjs",c.suite),owner:readImprovementOwnerRegistration(c.suite,"affected-owner"),assertions:assertions.map(a=>a.id)});
  const owners=[{id:"affected-owner",command:["node","--import","tsx","fixture.mjs"],bound_ms:30000,assertions:assertions.map(a=>a.id),registration}];
  const driver=c.ref("driver.mjs","// Synthetic common executable driver\n");
  c.c={target:{identity:c.target,checkout_fingerprint:checkoutVerificationFingerprint(c.checkout),planner:c.ref("planner.json",{base:c.base,head:c.head,selected_plan:"full-canonical",phases:[...REVIEWED_REVISION_PHASES],owners:["affected-owner"]})},
    originals:{attempt:c.ref("prior-attempt.json",readFileSync(path.join(c.priorRoot,"attempt-1.json"))),completion:c.ref("prior-completion.json",readFileSync(path.join(c.priorRoot,"completion-1.json"))),receipt:c.ref("prior-receipt.json",readFileSync(path.join(receiptDir,"ordinary-v2.json"))),stock:c.ref("prior-stock.json",{valid_deciding_evidence:false,issues:["failed"],content_fingerprint:c.original.integrity.content_fingerprint}),logs:[c.ref("prior.log",c.log)],historical_index:c.ref("history.json",history),receiving_review:receiving,failed_owner:"affected-owner",cause:"UNKNOWN",consumed_authority:"synthetic prior 1/1"},
    source:{predecessor_head:c.before,predecessor_tree:c.beforeTree,delta_sha256:digest(c.git(["diff","--binary","--no-ext-diff","--no-textconv",c.before,c.head,"--"])),changed_paths:[module],production:[{path:module,before_blob:c.git(["rev-parse",`${c.before}:${module}`]).toString().trim(),after_blob:c.git(["rev-parse",`${c.head}:${module}`]).toString().trim(),before_sha256:digest(c.git(["show",`${c.before}:${module}`])),after_sha256:digest(c.git(["show",`${c.head}:${module}`]))}],partitions:{production:[module],focused:[],contract:[],integration:[]},integration:null},
    runtime:{node_version:CANONICAL_NODE_VERSION,inputs:c.ref("runtime.json",c.inputs),dependencies:manifest("dependencies.json",[{path:"node_modules/@fixture/scoped/index.js",sha256:digest("scoped"),bytes:6},{path:"node_modules/compiler/index.js",sha256:digest("fixture"),bytes:7}]),dependency_observation:c.ref("dependency-observation.json",dependencyObservation),locks:manifest("locks.json",["package-lock.json","package.json"].map(p=>({path:p,sha256:digest(readFileSync(path.join(c.checkout,p))),bytes:readFileSync(path.join(c.checkout,p)).length}))),compiler:manifest("compiler.json",[{path:"node_modules/compiler/index.js",sha256:digest("fixture"),bytes:7}]),environment:c.ref("environment.json",{LANG:"C"})},
    driver:{executable:driver,manifest:manifest("driver-manifest.json",[{path:"driver.mjs",sha256:driver.sha256,bytes:readFileSync(path.join(c.folder,driver.artifact)).length}]),plan:null},
    corpus:{manifest:manifest("corpus.json"),seed:c.ref("seed.txt","synthetic seed"),initial_database:c.ref("database.txt","synthetic database"),cases:["representative"]},
    observations:{historical:history.observations,qualifying:[],adverse:history.adverse},coverage:{assertions,owners,equivalence:["temporary_root"]},
    work:{operation:"validate-state",call_sites:["lib/work.mjs:read"],cases:["representative"],before_count:3,after_count:1,rationale:"One transaction needs one validation; future reads remain fresh."},claims:[...IMPROVEMENT_CLAIMS]};
  c.c.corpus.manifest=c.ref("corpus.json",[c.c.corpus.initial_database,c.c.corpus.seed].map(ref=>({path:ref.artifact,sha256:ref.sha256,bytes:readFileSync(path.join(c.folder,ref.artifact)).length})).sort((a,b)=>a.path<b.path?-1:1));
  c.plan={frozen_at:time(5000),implementation_actor:"synthetic-author",command:["node","driver.mjs"],bound_ms:60000,owners,assertions,metric:{operation:c.c.work.operation,call_sites:c.c.work.call_sites,cases:c.c.work.cases},normalization:c.c.coverage.equivalence,source_before:c.before,source_after:c.head,runtime_sha256:digest(c.c.runtime),driver_sha256:c.c.driver.manifest.sha256,corpus_sha256:digest(c.c.corpus)};
  c.plan.capture={file_owners:[{owner_id:"affected-owner",required:[{path:"fixture/input.json",operations:["read","write"],versions:1}]}],input_cases:["affected-owner:read-valid"],fresh_reader:{command:["node","fresh-reader.mjs"],bound_ms:5000,cases:["affected-owner:read-valid"]}};
  c.c.driver.plan=c.ref("plan.json",c.plan);
  c.w=["before","after"].map((role,i)=>({role,source_head:i?c.head:c.before,source_manifest:manifest(role+"-source.json",[{path:route,sha256:digest(c.git(["show",`${c.head}:${route}`])),bytes:c.git(["show",`${c.head}:${route}`]).length},{path:module,sha256:c.c.source.production[0][i?"after_sha256":"before_sha256"],bytes:c.git(["show",`${i?c.head:c.before}:${module}`]).length}]),overlay_manifest:c.ref(role+"-overlay.json",[]),runtime_sha256:digest(c.c.runtime),driver_sha256:c.c.driver.manifest.sha256,corpus_sha256:digest(c.c.corpus),command:c.plan.command,bound_ms:60000,started_at:time(6000+i*2000),finished_at:time(7000+i*2000),start_identity:null,end_identity:null,stdout:c.ref(role+".log","all synthetic assertions passed\n"),stderr:c.ref(role+".err",""),result:{...natural},assertions:assertions.map(a=>({id:a.id,outcome:"pass",output_sha256:digest(a.expectation),observation:c.ref(role+"-"+a.id+".observation",a.expectation)})),owners:owners.map(o=>({id:o.id,command:o.command,bound_ms:o.bound_ms,assertions:o.assertions,result:{...natural},stdout:c.ref(role+"-owner.log","complete synthetic owner\n"),stderr:c.ref(role+"-owner.err","")})),trace:c.ref(role+"-trace.json",Array.from({length:i?1:3},(_,n)=>({case_id:"representative",operation:c.c.work.operation,call_site:c.c.work.call_sites[0],sequence:n+1})))}));
  for(const [i,w]of c.w.entries()){
    const raw=Buffer.from("synthetic database"),db=c.ref(w.role+"-capture.db.gz",gzipSync(raw)),cfg=c.ref(w.role+"-capture-config.json",{project_id:"synthetic"});
    const input={case_id:"read-valid",captured_at:time(6500+i*2000),database:{...db,bytes:readFileSync(path.join(c.folder,db.artifact)).length},uncompressed_sha256:digest(raw),uncompressed_bytes:raw.length,config:{...cfg,bytes:readFileSync(path.join(c.folder,cfg.artifact)).length},schema:[{name:"fixture"}],counts:[],selector:null};
    const rows=[{id:"affected-owner:read-valid",observation:c.ref(w.role+"-capture-input.json",input)}];
    const observed={outcome:"available",standalone:"available",result:{synthetic:true}};
    const file=c.ref(w.role+"-input-file.json",{input:1});
    const fileRows=["write","read"].map(operation=>({operation,path:"fixture/input.json",artifact:file.artifact,sha256:file.sha256,bytes:readFileSync(path.join(c.folder,file.artifact)).length,at:time(6500+i*2000)}));
    const fileObservations=c.ref(w.role+"-files.jsonl",fileRows.map(row=>JSON.stringify(row)).join("\n")+"\n");
    w.captures=c.ref(w.role+"-captures.json",{role:w.role,corpus_sha256:w.corpus_sha256,plan_sha256:c.c.driver.plan.sha256,inputs:rows,files:[{owner_id:"affected-owner",observations:fileObservations}],observations:[{id:rows[0].id,observation:c.ref(w.role+"-origin.json",observed)}],fresh_reader:{command:c.plan.capture.fresh_reader.command,bound_ms:c.plan.capture.fresh_reader.bound_ms,result:{...natural},stdout:c.ref(w.role+"-fresh.log",JSON.stringify({fresh_process_read:"read-valid",input_sha256:input.uncompressed_sha256,config_sha256:cfg.sha256,...observed,writes:0})+"\n"),stderr:c.ref(w.role+"-fresh.err",""),inputs_sha256:digest(rows)}});
  }
  for(const w of c.w)w.start_identity=w.end_identity={source_manifest_sha256:w.source_manifest.sha256,overlay_manifest_sha256:w.overlay_manifest.sha256,runtime_sha256:w.runtime_sha256,driver_sha256:w.driver_sha256,corpus_sha256:w.corpus_sha256,dependency_manifest_sha256:c.c.runtime.dependencies.sha256,environment_sha256:c.c.runtime.environment.sha256};
  c.r={target:c.target,delta_sha256:c.c.source.delta_sha256,campaign_sha256:null,report:null,reviewer:"synthetic-independent-reviewer",implementation_actor:"synthetic-author",no_write:true,reviewed_at:time(11000),source_review:"complete",disposition:"accept",judgments:Object.fromEntries("connected_material_production_delta complete_delta preserved_behavior real_work_reduction complete_known_campaign limited_claims no_weakened_contract".split(" ").map(k=>[k,true])),gaps:[{id:"synthetic",kind:"nonblocking_limitation",detail:"synthetic fixture, not real authority or qualification evidence"}]};
  c.rebuild=()=>{
    c.c.observations.qualifying=c.w.map((w,i)=>c.ref((i?"after":"before")+".json",w));
    c.p.campaign=c.ref("campaign.json",c.c);c.r.campaign_sha256=digest(c.c);
    c.r.report=c.ref("review.md",`Synthetic separate review ${c.head} ${c.r.delta_sha256} ${digest(c.c)}\n`);c.p.review=c.ref("review.json",c.r);
    const user={login:"synthetic-owner",id:1,type:"User"};
    const common={target:c.target,campaign_sha256:digest(c.c),review_sha256:digest(c.r)};
    c.a={id:101,user,author_association:"OWNER",state:"COMMENTED",commit_id:c.head,pull_request_url:"https://api.github.com/repos/hynk-studio/augnes/pulls/999",submitted_at:time(12000),body:IMPROVEMENT_ACCEPT+"\n"+canonicalSerialize({...common,independent_report_sha256:c.r.report.sha256,scope:IMPROVEMENT_KIND,claims:IMPROVEMENT_CLAIMS})};
    const grantTime=time(13000);
    c.g={id:102,user,author_association:"OWNER",issue_url:"https://api.github.com/repos/hynk-studio/augnes/issues/999",created_at:grantTime,updated_at:grantTime,body:IMPROVEMENT_GRANT+"\n"+canonicalSerialize({...common,acceptance_sha256:digest(improvementAuthorityObservation(c.a,"accepted_improvement")),planner_sha256:digest(JSON.parse(readFileSync(path.join(c.folder,"planner.json")))),maximum_invocations:1,recovery:0,unchanged_retry:0,stop_on_failure_or_interruption:true,fresh_validation:true,independent_result_audit:true,owned_cleanup:true,timing_risk_decision:"proceed_once_under_unchanged_bounds"})};
    c.p.authorization={acceptance_review_id:c.a.id,acceptance_review_sha256:digest(improvementAuthorityObservation(c.a,"accepted_improvement")),grant_comment_id:c.g.id,grant_comment_sha256:digest(improvementAuthorityObservation(c.g,"prospective_grant"))};
    c.records={acceptance:c.a,grant:c.g,acceptance_permission:{permission:"admin",user},grant_permission:{permission:"maintain",user},pull_request:{number:999,state:"open",draft:true,auto_merge:null,base:{sha:c.base,ref:"main",repo:{full_name:"hynk-studio/augnes"}},head:{sha:c.head,ref:c.branch,repo:{full_name:"hynk-studio/augnes"}}}};
    write(c.file,c.p);return readSourceCorrectionProof(c.file,c.checkout);
  };
  c.proof=c.rebuild();
  c.transport=()=>({review:async()=>c.records.acceptance,grant:async()=>c.records.grant,permission:async()=>c.records.acceptance_permission,pullRequest:async()=>c.records.pull_request});
  c.request=()=>({...request,head:c.head,tree:c.tree,runId:"prospective",acceptedMain:c.base,sourceCorrection:c.proof,revisionInputs:c.inputs,assertCurrent:()=>{}});
  return c;
}

// Complete synthetic receipt controls; these values never claim Browser or
// qualification execution. They exercise the production receipt reader.
export async function completeSyntheticReceipt(c, reserve, { preparedDependencies = true } = {}) {
  const {baseReceipt,validContext}=await import("./local-canonical-receipt-v3.mjs");
  const {dependencyRecords}=await import("./local-canonical-browser-successor.mjs");
  const {buildPhasePlan}=await import("../run-local-canonical-verification.mjs");
  const {browserConsumersForPhase}=await import("../local-canonical-browser-identity.mjs");
  const r=structuredClone(baseReceipt), start=new Date().toISOString();
  const plan=buildPhasePlan({mode:"changed",selectedPlan:"full-canonical",baseSha:c.base,headSha:c.head});
  const input={contract:"augnes.local-canonical-inputs.v3",path_kind:"isolated-model-free-v1",binding:{head:c.head,tree:c.tree,executor_fingerprint:r.executor.source_fingerprint,
    runtime_inputs:c.inputs,environment_keys:[],phase_environment_fingerprints:plan.map(p=>({id:p.id,fingerprint:digest(p.id)}))},resources:[
    ...["codex-preferences","user-instructions","auth-location","git-config"].map(id=>({id,classification:"ambient",location_fingerprint:digest(id),before:{present:false}})),
    {id:"node-executable",classification:"execution",location_fingerprint:c.inputs.node.location_fingerprint,before:c.inputs.node.observation,readOnlyExecutable:true},
    {id:"node-headers",classification:"execution",location_fingerprint:c.inputs.headers.location_fingerprint,before:c.inputs.headers.observation,nodeHeaders:true},
    {id:"browser-executable",classification:"execution",location_fingerprint:digest("synthetic browser"),before:c.inputs.node.observation,readOnlyExecutable:true}]};
  const a=await reserve({contractFingerprint:digest(input)}), packages=c.syntheticDependencies??dependencyRecords(c), finish=new Date().toISOString();
  Object.assign(r.repository,{head_sha:c.head,tree_sha:c.tree,base_sha:c.base,branch:c.branch});
  Object.assign(r.integration_base,{requested_base_sha:c.base,tested_head_sha:c.head,checked_at:start});Object.assign(r.integration_base.observation,{sha:c.base,observed_at:start});
  Object.assign(r.evidence,{mode:"changed",selected_plan:"full-canonical",planner_plan:"full-canonical",planner_reason:"one_or_more_changes_require_full_canonical",planner_changed_paths:["lib/work.mjs"],planner_owner_ids:["local-canonical-integrity"],planner_full_reasons:["fixture_source_change"],planner_browser_phase_ids:plan.filter(p=>p.browser).map(p=>p.id)});
  Object.assign(r.dependencies,{policy:"clean_npm_ci_root_and_nested",download_cache:"invocation_private_cache_not_authoritative",installed_trees:"replaced_from_lockfiles_by_npm_ci"});
  for(const [i,key]of ["root_lock_sha256","nested_lock_sha256","web_planning_lock_sha256"].entries())r.dependencies[key]=packages[i].before.sources.find(s=>s.name==="package-lock.json").sha256;
  Object.assign(r.verification_context,{kind:"isolated-worktree",admission:"registered_worktree_of_authorized_mac",checkout_fingerprint:digest("synthetic checkout")});
  r.receipt_version=4;r.attempt=a;r.run={id:a.attempt_id,invocation_id:digest(a.attempt_id).slice(0,32),started_at:start,finished_at:finish,duration_ms:Date.parse(finish)-Date.parse(start)};
  const own={required:true,acquired:true,released:true,checkout_fingerprint:r.verification_context.checkout_fingerprint,ownership_id:digest("owner").slice(0,32),acquired_at:start,released_at:finish,failure_code:null};
  r.checkout_ownership=own;r.capacity_ownership={...own,contract:"augnes.local-canonical-capacity.v1",limit:2,slot:1,invocation_id:r.run.invocation_id};
  r.cleanup.failure_codes=[];r.cleanup.isolated_resources={required:true,prepared:true,completed:true,failure_count:0,failures:[],invocation_id:r.run.invocation_id,policy:"private_outer_home_temp_cache_database_runtime",fingerprint:digest("resources")};
  r.historical_inputs={...r.cleanup.isolated_resources,contract:"augnes.local-canonical-historical-inputs.v1",anchor_fingerprint:r.verification_context.anchor_fingerprint,source_fingerprint:digest("history-source"),content_fingerprint:digest("history-content"),unchanged:true,file_count:1,byte_count:1};
  const service={status:"not_installed",checkout_relation:"exact",service_identity:null,preservation_valid:true,preservation_binding:digest("synthetic preservation")};
  const observation={contract:"augnes.companion-preservation-observation.v1",samples:1,coherent:true,live_identity_valid:true,before_binding:service.preservation_binding,after_binding:service.preservation_binding,started_at:start,finished_at:finish};
  r.cleanup.companion_service={scope:"accepted_checkout_read_only",before:service,after:service,maintenance_acquired:false,maintenance_released:true,restored:true,observations:{before:observation,after:observation}};
  r.inputs={...input,fingerprint:digest(input),checks:1,events:[],first_fault:null,secondary_faults:[],...(preparedDependencies?{prepared_dependencies:packages}:{})};
  r.phases=plan.map(p=>({...baseReceipt.phases[0],id:p.id,label:p.label,command:p.display,cwd_scope:p.cwdScope,exclusive:p.exclusive,browser:p.browser,base_sha:c.base,head_sha:c.head,
    started_at:start,finished_at:finish,duration_ms:0,invocation_id:r.run.invocation_id,environment_fingerprint:digest(p.id),cleanup:{completed:true,exit_observed:true,streams_closed:true,termination_reason:"natural_exit",remaining_owned_processes:0,listener_residue_count:0},
    browser_use:Object.entries(browserConsumersForPhase(p.id)).flatMap(([consumer,count])=>Array.from({length:count},()=>({contract:"augnes.local-canonical-browser-use.v2",consumer,executable_name:"synthetic-browser",location_fingerprint:digest("synthetic browser"),before:c.inputs.node.observation,after:c.inputs.node.observation,actual_version:"Chrome/1.2.3.4",runtime_versions:{http:"Chrome/1.2.3.4",cdp:"Chrome/1.2.3.4"},disposition:"unchanged",unchanged:true})))}));
  r.outcome={disposition:"completed_success",first_fault:null,safety:"preserved_within_observed_scope",validity:"valid_within_observed_scope",execution:"complete_pass"};
  const receipt=finalizeReceipt(r);finishAttempt(a,{receiptFingerprint:receipt.integrity.content_fingerprint,disposition:"completed_success",cleanupComplete:true});
  return {receipt,context:{...validContext,currentVerificationContext:r.verification_context,expectedRunId:r.run.id,currentIntegrationBase:{...r.integration_base,checked_at:finish,observation:{...r.integration_base.observation,observed_at:finish}},currentIdentity:{...validContext.currentIdentity,head_sha:c.head,branch:c.branch},currentCheckoutFingerprint:own.checkout_fingerprint,expectedPhaseIds:plan.map(p=>p.id),expectedSelectedPlan:"full-canonical",expectedOwnerIds:r.evidence.planner_owner_ids,currentLocks:Object.fromEntries(["root","nested","webPlanning"].map((name,i)=>[name,packages[i].before.sources.find(s=>s.name==="package-lock.json").sha256])),currentAttemptRecordsValid:true,currentInputStateValid:true,improvementCurrentIssue:null}};
}
