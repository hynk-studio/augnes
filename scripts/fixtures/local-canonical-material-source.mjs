// Disposable synthetic authority. Real readers, physical ledger, behavioral
// subprocesses and fresh stock; these records never authorize host qualification.
import assert from 'node:assert/strict';
import {readFileSync,existsSync,rmSync,readdirSync} from 'node:fs';
import path from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {fixtureNow} from './local-canonical-authority-clock.mjs';
import {digest} from '../local-canonical-inputs.mjs';
import {CANONICAL_NODE_VERSION} from '../local-canonical-environment.mjs';
import {inspectGitRevisionPreparation,inspectAttemptRecords,reconstructAttemptTip,reviewedRevisionAuthorityObservation} from '../local-canonical-attempts.mjs';
import {MATERIAL_SOURCE_CORRECTION,MATERIAL_HISTORY_BOUNDARY,gitReviewTarget,verifyGitRevisionFailure,
 GIT_CURRENT_STOCK_COMPARISON,gitRevisionInventory,gitRevisionStockComparison} from '../local-canonical-git-observation.mjs';
import {REVIEWED_REVISION_PHASES} from '../local-canonical-attempts.mjs';
import {executeFixture,dependencyRecords} from './local-canonical-browser-successor.mjs';
import {createPrivateReviewExport,inspectPrivateReviewExport} from '../local-canonical-review-export.mjs';
import {browserConsumersForPhase,validPhaseBrowserUse} from '../local-canonical-browser-identity.mjs';
import {runMaterialStockPredecessorControls} from './local-canonical-material-stock-predecessor.mjs';
const clone=structuredClone,now=()=>new Date(fixtureNow()).toISOString();
const driver='scripts/material-source-behavior.mjs',product='apps/web_planning/src/exchange-client.js.txt';
const predecessorDriver='scripts/material-predecessor.mjs';
const decision='Source review decision: ACCEPT / RETAIN for prospective qualification.';

// The real attempt reader replays disposable authenticated evidence and physical
// settlement. Current stock compatibility never edits those historical records.
async function currentGitStockControls(c,p,cap,receipt) {
 const inventory=clone(receipt.inputs),changed=clone(inventory),git=changed.resources.find(r=>r.id==='git-config');
 for(const key of ['inode','mtime_ns','ctime_ns'])git.before.metadata[key]=String(BigInt(git.before.metadata[key])+1n);
 assert.equal(gitRevisionInventory(inventory),p.inputs.inventory_sha256);
 const live={...clone(c.live),inputInventory:changed,inventory:gitRevisionInventory(changed)};
 const family=path.join(c.anchor,'.augnes-local-verification/families',receipt.attempt.family_id);
 const files=[c.file,...['attempt-1.json','completion-1.json'].map(name=>path.join(family,name)),
  path.join(c.checkout,'.augnes-local-verification/receipts',receipt.run.id+'.json')];
 const originals=files.map(file=>digest(readFileSync(file))),receiptHash=digest(receipt),tipHash=digest(reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch}));
 const inspect=(current,contract=GIT_CURRENT_STOCK_COMPARISON,r=receipt)=>inspectAttemptRecords({
  anchorRoot:c.anchor,repositoryRoot:c.checkout,receipt:r,revisionInputs:c.inputs,gitCurrentStockContract:contract,
  observeRevision:()=>({authorization:cap,live:current}),assertCurrent(){}});
 assert.equal(await inspect(live,null),false);assert.equal(await inspect(live,'unsupported'),false);
 assert.equal(await inspect(live),true);
 const same={...clone(c.live),inputInventory:inventory,inventory:gitRevisionInventory(inventory)};
 assert.equal(await inspect(same),true);
 const different=clone(live);different.inputInventory.resources.find(r=>r.id==='git-config').before.sha256=digest('different full config bytes');
 different.inventory=gitRevisionInventory(different.inputInventory);assert.equal(await inspect(different),false);
 assert.equal(await inspect({...live,inventory:digest('unbound inventory claim')}),false);
 assert.equal(await inspect({...live,inputInventory:undefined}),false);
 const tampered=clone(receipt);tampered.inputs=changed;
 assert(gitRevisionStockComparison(tampered.inputs,live.inputInventory,GIT_CURRENT_STOCK_COMPARISON).equivalent);
 assert.equal(await inspect(live,GIT_CURRENT_STOCK_COMPARISON,tampered),false,'historical receipt catalogue must still match the proof raw pin');
 assert.deepEqual(files.map(file=>digest(readFileSync(file))),originals);assert.equal(digest(receipt),receiptHash);
 assert.equal(digest(reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch})),tipHash);
 console.log(JSON.stringify({git_current_stock:{contract:GIT_CURRENT_STOCK_COMPARISON,synthetic_only:true,
  historical_inventory_sha256:gitRevisionInventory(inventory),current_inventory_sha256:live.inventory,
  allowed_metadata_stock:true,legacy_and_unknown_strict:true,full_content_and_hash_claim_refused:true,historical_pin_exact:true,physical_accounting_unchanged:true}}));
}

// Pure variants complement the actual integration-failure/fresh-stock/physical
// successor sequence below; none is authority or an observation of host QA.
function materialPredecessorCompatibility(c) {
 const receipt=clone(c.prior),failed=REVIEWED_REVISION_PHASES.indexOf('integration');
 const cleanup=clone(receipt.phases.find(v=>v.status==='failure').cleanup);
 const exe=receipt.inputs.resources.find(v=>v.id==='browser-executable');
 const browser={contract:'augnes.local-canonical-browser-use.v2',executable_name:'Fixture',location_fingerprint:exe.location_fingerprint,
  before:exe.before,after:exe.before,actual_version:'Chrome/1',runtime_versions:{http:'Chrome/1',cdp:'Chrome/1'},disposition:'unchanged',unchanged:true};
 const sequence=Object.entries(browserConsumersForPhase('integration')).flatMap(([consumer,count])=>Array.from({length:count},()=>({...browser,consumer})));
 receipt.integration_base.contract='augnes.local-canonical-integration-base.v2';
 for(const [i,phase]of receipt.phases.entries())Object.assign(phase,{
  status:i<failed?'pass':i===failed?'failure':'not_run',exit_status:i<failed?0:i===failed?1:null,
  failure_code:i<failed?null:i===failed?'phase_failed':'phase_not_run',
  started_at:i>failed?null:receipt.run.started_at,finished_at:i>failed?null:receipt.run.finished_at,
  environment_fingerprint:i>failed?null:receipt.inputs.binding.phase_environment_fingerprints[i].fingerprint,
  cleanup:i>failed?null:clone(cleanup),browser_use:[]});
 const stockFor=r=>({...clone(c.materialStock),dimensions:{...c.materialStock.dimensions,current_merge_applicability:'different_current_main'},
  issues:['receipt_classified_outcome_not_passing','receipt_final_result_not_pass','receipt_non_deciding',
   ...r.phases.filter(p=>p.status!=='pass').map(p=>'phase_not_passing:'+p.id),'receipt_phase_environment_binding_invalid',
   ...r.phases.filter(p=>p.status!=='not_run'&&!validPhaseBrowserUse(p,p.browser_use,exe)).map(p=>'receipt_browser_identity_invalid:'+p.id)].sort()});
 const verify=(r,s=stockFor(r),material=true)=>verifyGitRevisionFailure(r,s,c.inputs,REVIEWED_REVISION_PHASES,2,false,false,false,material);
 let accepted=0,refused=0;
 for(let n=0;n<=sequence.length;n++){const r=clone(receipt);r.phases[failed].browser_use=sequence.slice(0,n);assert.doesNotThrow(()=>verify(r));accepted++;}
 const unknown=stockFor(receipt);unknown.dimensions.current_merge_applicability='current_main_unobserved';assert.doesNotThrow(()=>verify(receipt,unknown));accepted++;
 assert.throws(()=>verify(receipt,stockFor(receipt),false));refused++;
 // A dedicated Browser failure must not inherit integration's partial prefix.
 const dedicated=clone(receipt),browserFailed=REVIEWED_REVISION_PHASES.indexOf('e2e-project-experience');
 for(let i=failed;i<=browserFailed;i++)Object.assign(dedicated.phases[i],{
  status:i<browserFailed?'pass':'failure',exit_status:i<browserFailed?0:1,failure_code:i<browserFailed?null:'phase_failed',
  started_at:receipt.run.started_at,finished_at:receipt.run.finished_at,cleanup:clone(cleanup),
  environment_fingerprint:receipt.inputs.binding.phase_environment_fingerprints[i].fingerprint,
  browser_use:i===failed?sequence:[]});
 assert.throws(()=>verify(dedicated));refused++;
 for(const mutate of [
  r=>r.integration_base.contract='augnes.local-canonical-integration-base.v1',r=>r.integration_base.contract='unsupported',
  r=>r.receipt_version=3,r=>r.integration_base.tested_head_sha='0'.repeat(40),r=>r.integration_base.base_is_ancestor_of_head=false,
  r=>r.integration_base.checked_at=new Date(0).toISOString(),r=>r.integration_base.observation.source='untrusted',
  r=>r.phases[failed].browser_use=[{...sequence[0],actual_version:'Chrome/other'}],
  r=>r.phases[failed].browser_use=Array(4).fill(sequence[0]),r=>r.phases[failed].browser_use=[sequence[3]],
  r=>r.phases[failed].browser_use=[sequence[0],sequence[3],sequence[0]],
  r=>r.phases[failed+1].browser_use=[sequence[0]],r=>r.phases[failed-1].status='not_run',
  r=>r.phases[failed].cleanup.termination_reason='cancelled',r=>r.phases[failed].cleanup.remaining_owned_processes=1,
  r=>r.outcome.safety='blocked',r=>r.phases[failed].timed_out=true,
 ]){const r=clone(receipt);mutate(r);assert.throws(()=>verify(r));refused++;}
 for(const mutate of [s=>s.dimensions.current_merge_applicability='blocked',s=>s.dimensions.safety='blocked',
  s=>s.issues=s.issues.filter(v=>!v.startsWith('receipt_browser_identity_invalid:')),s=>s.issues.push('unexplained')]){
  const s=stockFor(receipt);mutate(s);assert.throws(()=>verify(receipt,s));refused++;
 }
 console.log(JSON.stringify({material_predecessor_compatibility:{accepted,refused,legacy_requires_complete_browser:true,synthetic_only:true}}));
}

export function seedMaterialSourceFiles(c,write) {
 write(path.join(c.checkout,product),JSON.stringify({primary:false,journal:false})+'\n');
 write(path.join(c.checkout,driver),'import assert from "node:assert/strict"; import {readFileSync} from "node:fs"; const state=JSON.parse(readFileSync(new URL("../apps/web_planning/src/exchange-client.js.txt",import.meta.url))); assert.equal(state[process.argv[2]??"primary"],true); console.log("corrected "+(process.argv[2]??"primary"));\n');
 write(path.join(c.checkout,predecessorDriver),'import assert from "node:assert/strict"; assert.fail("synthetic prior defect");\n');
}

// Spend the supported acquisition commission through its ordinary two-slot
// path. Reusable material-source controls need no retired workload controller.
export async function prepareMaterialSourcePredecessor(c,h,initial,firstAttempt,initialAuthority) {
 const authority=clone(c.authority),dependencies=dependencyRecords(c);
 c.behaviorPath=predecessorDriver;
 const first=await executeFixture(c,{...h,begin:()=>firstAttempt},initial,initialAuthority,null,dependencies);
 assert.equal(first.stock.valid_deciding_evidence,false);assert.equal(first.child.result.exit_code,1);
 const priorHead=c.head,red=await h.behavior(c);
 h.write(path.join(c.checkout,predecessorDriver),'console.log("corrected synthetic predecessor");\n');
 c.git(['add',predecessorDriver]);c.git(['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','--quiet','-m','correct synthetic predecessor']);
 c.prior=first.receipt;h.prepare(c,2);const p=c.proof;
 p.commission=clone({...initial.commission,ordinal:2});p.accepted=clone(initial.accepted);
 p.inputs.inventory_sha256=initial.inputs.inventory_sha256;
 p.originals.stock=h.artifact(c,'prior-stock.log',JSON.stringify(first.stock));
 const green=await h.behavior(c);assert.equal(red.result.exit_code,1);assert.equal(green.result.exit_code,0);
 const source=c.git(['show',p.head+':'+predecessorDriver]);
 const witness=(label,run,head)=>h.artifact(c,label+'.json',{...run,node_version:CANONICAL_NODE_VERSION,runtime_inputs_sha256:p.inputs.identity_sha256,
  file_sha256:digest(c.git(['show',head+':'+predecessorDriver])),stdout:h.artifact(c,label+'.log',run.output)});
 const before=witness('red',red,priorHead),after=witness('green',green,p.head);
 const focused=h.read(path.join(c.artifacts,p.focused.artifact));
 Object.assign(focused,{finished_at:now(),failed_phase:'authority',diagnosis:'Natural predecessor failure followed by its directly implicated behavioral correction.',
  implicated_paths:[predecessorDriver],source_files:[{path:predecessorDriver,byte_size:source.length,sha256:digest(source)}],input_remedy_resources:[],
  regression:{path:predecessorDriver,args:[],before,after},commands:[{command:green.command,tested_source_head:p.head,result:green.result,record:after,stdout:h.read(path.join(c.artifacts,after.artifact)).stdout}]});
 p.focused=h.artifact(c,'focused.json',focused);p.source=h.artifact(c,'source.json',{...h.read(path.join(c.artifacts,p.source.artifact)),reviewed_at:now()});
 c.authority=authority;c.authority.pr.head.sha=p.head;
 const review={...authority.review,id:33,commit_id:p.head,submitted_at:now(),body:[decision,p.base,p.head,p.tree,p.prior_receipt_fingerprint,gitReviewTarget(p)].join('\n')};
 c.authority.contractReview=review;c.authority.contractPr=999;
 p.authorization={...clone(initial.authorization),contract_review:{pull_request:999,id:33,head:p.head,sha256:digest(reviewedRevisionAuthorityObservation(review,'contract_review'))}};
 h.write(c.file,p);const parsed=h.proof(c),cap=await h.auth(c,parsed);
 c.behaviorPath=driver;
 const second=await executeFixture(c,{...h,begin:(subject,proof,auth,extra)=>h.begin(subject,proof,auth,{...extra,runId:'acquisition-second'})},parsed,cap,null,dependencies);
 assert.equal(second.stock.valid_deciding_evidence,false);assert.equal(second.child.result.exit_code,1);
 c.prior=second.receipt;c.materialStock=second.stock;
 const tip=reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch});
 assert.equal(tip.reviewed_revision_consumed,2);assert.deepEqual(tip.revision_grants,[11,32]);
}

export async function runMaterialSourceControls(c,h,group) {
 const ref=(name,value)=>h.artifact(c,name,value),read=r=>h.read(path.join(c.artifacts,r.artifact));
 const inspect=(p,live=c.live)=>{const material=clone(p);delete material.authorization;delete material.accepted.review;delete material.local_relative_path;
  const file=path.join(c.artifacts,'material.json');h.write(file,material);
  return inspectGitRevisionPreparation({file,repositoryRoot:c.checkout,predecessorRoot:c.checkout,anchorRoot:c.anchor,runtimeInputs:c.inputs,live});};
 const tip=()=>reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch});
 const bind=()=>h.write(c.file,c.proof);
 const execute=(p,cap,browser=null,options={})=>executeFixture(c,{...h,...options,begin:(subject,proof,authority,extra)=>h.begin(subject,proof,authority,{...extra,runId:'material-grant-'+proof.authorization.grant_comment_id})},p,cap,browser,dependencyRecords(c));
 const preserve=()=>{
  const result=[];let r=c.prior.attempt;
  while(r){const dir=path.join(c.anchor,'.augnes-local-verification/families',r.family_id);
   for(const name of ['attempt-1.json','completion-1.json','correction-successor.json'])if(existsSync(path.join(dir,name)))result.push([path.join(dir,name),digest(readFileSync(path.join(dir,name)))]);
   const receipt=path.join(c.checkout,'.augnes-local-verification/receipts',r.attempt_id+'.json');
   if(existsSync(receipt))result.push([receipt,digest(readFileSync(receipt))]);
   const p=r.source_correction;
   if(p?.local_relative_path){const folder=path.dirname(path.join(c.checkout,p.local_relative_path));for(const name of readdirSync(folder)){const f=path.join(folder,name);result.push([f,digest(readFileSync(f))]);}}
   r=p?h.read(path.join(c.anchor,'.augnes-local-verification/families',p.prior_family_id,'attempt-'+p.prior_number+'.json')):null;
  }return result;
 };
 const unchanged=()=>{for(const [file,sha]of c.materialPreserved)assert.equal(digest(readFileSync(file)),sha);};
 async function correct(field,id) {
  const priorHead=c.head,authority=clone(c.authority);
  c.behaviorPath=driver;c.behaviorArgs=[field];
  const red=await h.behavior(c);assert.equal(red.result.exit_code,1);
  const content=JSON.parse(readFileSync(path.join(c.checkout,product)));content[field]=true;h.write(path.join(c.checkout,product),JSON.stringify(content)+'\n');
  c.git(['add',product]);c.git(['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','--quiet','-m','correct synthetic '+field]);
  c.head=c.git(['rev-parse','HEAD']).toString().trim();c.tree=c.git(['rev-parse','HEAD^{tree}']).toString().trim();
  const green=await h.behavior(c);assert.equal(green.result.exit_code,0);
  if(field==='primary'){
   h.write(path.join(c.checkout,'docs/material-source-note.md'),'Document the tested correction without changing consumed bytes.\n');
   c.git(['add','docs']);c.git(['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','--quiet','-m','document synthetic correction']);
  }
  c.acceptedHead=c.git(['rev-parse','HEAD']).toString().trim();c.acceptedTree=c.git(['rev-parse','HEAD^{tree}']).toString().trim();c.grantId=id+2;
  h.prepare(c);const p=c.proof;
  Object.assign(p.commission,{source_revision:MATERIAL_SOURCE_CORRECTION,maximum_invocations:1,input_acquisition:c.prior.attempt.source_correction.commission.input_acquisition});
  p.inputs.inventory_sha256=c.prior.attempt.source_correction.inputs.inventory_sha256;
  p.originals.stock=ref('prior-stock.log',JSON.stringify(c.materialStock));
  p.source=ref('source.json',{...read(p.source),reviewed_at:now()});
  const witness=(label,run,head)=>{
   const source_files=[driver,product].map(name=>{const b=c.git(['show',head+':'+name]);return{path:name,byte_size:b.length,sha256:digest(b)};});
   return ref(label+'.json',{...run,output:undefined,dirty:'',environment:digest({runtime:c.inputs,environment:'owned fixture environment'}),
    modules:[{path:product,sha256:source_files[1].sha256}],source_files,node_version:CANONICAL_NODE_VERSION,
    file_sha256:source_files[0].sha256,runtime_inputs_sha256:digest(c.inputs),stdout:ref(label+'.log',run.output)});
  };
  const before=witness('before',red,priorHead),after=witness('after',green,green.tested_source_head);
  const equivalence=green.tested_source_head===p.head?{}:{after_equivalence:{target:p.head,classification:'documentation-only',delta:read(p.source).accepted_to_final}};
  if(equivalence.after_equivalence){const from=green.tested_source_head,patch=c.git(['diff','--binary','--full-index','--no-ext-diff','--no-textconv',from,p.head,'--']);equivalence.after_equivalence.delta={bytes:patch.length,sha256:digest(patch),paths:c.git(['diff','--name-only',from,p.head,'--']).toString().trim().split('\n').filter(Boolean).sort()};}
  const focused={...read(p.focused),finished_at:now(),implicated_paths:[product],source_files:read(after).source_files,input_remedy_resources:[],failed_phase:c.prior.phases.find(phase=>phase.status==='failure').id,
   remedy:'Preserve the selected view lifetime without replacing the primary operation error.',diagnosis:'The actual behavioral subprocess read the wrong controlled owner state and failed its unchanged assertion.',
   regression:{path:driver,args:[field],before,after,...equivalence},commands:[{command:green.command,tested_source_head:green.tested_source_head,result:green.result,record:after,stdout:read(after).stdout}]};
  p.focused=ref('focused.json',focused);
  const delegation={...authority.grant,id,created_at:now(),body:[
   'Authorize one materially corrected-source qualification assignment on '+p.branch+' in Draft PR #999. Adopt the reusable material-source-correction-v1 transition within the existing inventory-bound v7 owners for the observed in-scope product defect.',
   'Predecessor: '+p.prior_family_id+' / '+p.prior_attempt_id+' / '+p.prior_receipt_fingerprint+'.',MATERIAL_HISTORY_BOUNDARY,
   'After separate independent acceptance of the actual correction, policy controls, exact published source and real preparation commitment, authorize the operator to record that decision faithfully and publish a separate new prospective commission through the authenticated maintainer identity. Each commission permits exactly one deciding invocation total; reservation or interruption consumes it. No ordinal two, recovery or unchanged-target retry under that commission. A further in-scope material correction requires fresh evidence, independent acceptance and new authenticated authority. Complete planner-selected qualification, separate fresh-process stock, owned cleanup and independent result audit remain required.'
  ].join('\n\n')};delegation.updated_at=delegation.created_at;
  p.commission.delegation={id,sha256:digest(reviewedRevisionAuthorityObservation(delegation,'task_delegation'))};
  const prepared=inspect(p);assert.equal(prepared.authorized,false);assert.equal(prepared.reserved,false);assert.equal(prepared.consumed,c.prior.attempt.source_correction.commission.maximum_invocations);
  await delay(2);const review={...authority.review,id:id+1,commit_id:p.head,submitted_at:now(),body:[decision,p.head,p.tree,p.base,gitReviewTarget(p),p.prior_receipt_fingerprint,MATERIAL_HISTORY_BOUNDARY].join('\n')};
  p.accepted.review={id:review.id,sha256:digest(reviewedRevisionAuthorityObservation(review,'accepted_revision'))};
  await delay(2);const grant={...authority.grant,id:id+2,created_at:now(),body:[
   'Authorize one NEW prospective v7 reviewed_revision commission for a material source correction.',p.schema,p.branch,p.head,p.tree,p.base,gitReviewTarget(p),p.prior_receipt_fingerprint,
   'https://github.com/hynk-studio/augnes/pull/999#issuecomment-'+id,'https://github.com/hynk-studio/augnes/pull/999#pullrequestreview-'+review.id,MATERIAL_HISTORY_BOUNDARY,
   'The old commission remains spent. Exactly one admitted deciding invocation total; demonstrated material correction and focused support; zero unchanged-target retry; zero extra recovery. Reservation/interruption consumes. No ordinal two, recovery or unchanged-target retry under this commission. Require separate fresh-process stock and independent result audit.'
  ].join('\n')};grant.updated_at=grant.created_at;
  p.authorization={grant_comment_id:grant.id,grant_sha256:digest(reviewedRevisionAuthorityObservation(grant,'execution_commission'))};
  c.authority={...c.authority,review,grant,linked:{['repos/hynk-studio/augnes/issues/comments/'+id]:delegation}};delete c.authority.contractReview;
  bind();assert.equal(inspect(p).target,prepared.target);await h.auth(c,h.proof(c));
 }
 if(group==='material-source') {
  c.behaviorPath=driver;c.behaviorArgs=['primary'];
  c.materialPreserved=preserve();
  assert.equal(tip().reviewed_revision_consumed,2);assert.deepEqual(tip().revision_grants,[11,32]);
  await correct('primary',60);unchanged();
  console.log(JSON.stringify({material_source_controls:['spent acquisition predecessor remains immutable','real natural before failure and corrected after pass through production readers','non-reserving preparation binds complete inventory and a distinct one-slot grant'],synthetic_only:true}));return;
 }
 const p=c.proof,focused=read(p.focused);let n=0;
 if(group==='material-controls') {
  materialPredecessorCompatibility(c);
  const tracking=c.git(['rev-parse','refs/remotes/origin/main']).toString().trim();
  const divergent=c.git(['commit-tree',c.tree,'-p',c.head,'-m','synthetic current main']).toString().trim();
  c.git(['update-ref','refs/remotes/origin/main',divergent]);
  try{assert.throws(()=>inspect(p),/revision_preparation_target_changed/);}finally{c.git(['update-ref','refs/remotes/origin/main',tracking]);}
  for(const mutate of [q=>q.commission.ordinal=2,q=>q.commission.maximum_invocations=2,q=>delete q.commission.source_revision,q=>delete q.commission.input_acquisition,
   q=>q.commission.reviewed_workload='spent-terminal-git-successor-workload-v1',q=>q.commission.root_family_id=digest('reset'),q=>q.branch+='-reset',q=>q.prior_attempt_id='stale',
   q=>delete q.inputs.inventory_sha256,q=>q.inputs.inventory_sha256=digest('missing input'),q=>q.head=c.prior.repository.head_sha]){
   const q=clone(p);mutate(q);assert.throws(()=>inspect(q));
  }
  for(const [key,mutate]of [['after',q=>q.runtime_inputs_sha256=digest('other runtime')],['after',q=>q.environment=digest('other environment')],['before',q=>q.file_sha256=digest('reduced assertions')],
   ['after',q=>q.source_files.pop()],['after',q=>q.modules[0].sha256=digest('wrong owner')],['after',q=>q.result.cleanup_completed=false],['after',q=>q.tested_source_head=c.prior.repository.head_sha]]){
   const f=clone(focused),original=f.regression[key],w=clone(read(original));mutate(w);f.regression[key]=ref('bad-witness-'+(++n)+'.json',w);
   // Keep the command bound to the altered witness so the named predicate,
   // rather than an earlier stale-reference check, is what refuses it.
   if(key==='after')f.commands=f.commands.map(command=>command.record.artifact===original.artifact&&command.record.sha256===original.sha256
    ? {...command,record:f.regression.after,stdout:w.stdout,result:w.result,tested_source_head:w.tested_source_head}:command);
   assert.throws(()=>inspect({...p,focused:ref('bad-focus-'+n+'.json',f)}));
  }
  // The complete Browser stdout uses the already supported 2 MiB focused-log
  // bound. It must be read intact, and one byte beyond that bound still refuses.
  for(const [size,accepted]of [[1024*1024,true],[2*1024*1024+1,false]]){
   const f=clone(focused),w=clone(read(f.regression.after));w.stdout=ref('bounded-output-'+size+'.log','synthetic bounded output\n'.padEnd(size,' '));
   f.regression.after=ref('bounded-witness-'+size+'.json',w);
   f.commands=f.commands.map(command=>({...command,record:f.regression.after,stdout:w.stdout}));
   const q={...p,focused:ref('bounded-focus-'+size+'.json',f)};
   if(accepted)assert.equal(inspect(q).reserved,false);else assert.throws(()=>inspect(q),/revision_artifact_unsafe/);
  }
  for(const node_args of [null,'--import tsx',['--inspect'],['--import','tsx','--no-warnings']]){
   const f=clone(focused);f.regression.node_args=node_args;assert.throws(()=>inspect({...p,focused:ref('bad-loader-'+(++n)+'.json',f)}));
  }
  for(const mutate of [f=>f.regression.after_equivalence.target=c.prior.repository.head_sha,f=>f.regression.after_equivalence.delta.paths=[],f=>delete f.regression.after_equivalence]){
   const f=clone(focused);mutate(f);assert.throws(()=>inspect({...p,focused:ref('bad-equivalence-'+(++n)+'.json',f)}));
  }
  assert.throws(()=>inspect(p,{...c.live,inventory:digest('different live input')}));
  for(const original of Object.values(p.originals)) {const file=path.join(c.artifacts,original.artifact),bytes=readFileSync(file);h.write(file,Buffer.concat([bytes,Buffer.from('\n')]));try{assert.throws(()=>inspect(p));}finally{h.write(file,bytes);}}
  // Prove the ordinal-two acquisition predecessor is accepted before mutating
  // it, so an unrelated ordinal refusal cannot mask these negative controls.
  assert.equal(c.prior.attempt.source_correction.commission.ordinal,2);
  const verifyPredecessor=r=>verifyGitRevisionFailure(r,c.materialStock,c.inputs,REVIEWED_REVISION_PHASES,2,false);
  assert.doesNotThrow(()=>verifyPredecessor(c.prior));
  for(const mutate of [r=>r.outcome.disposition='completed_success',r=>r.outcome.disposition='unknown_relevance',r=>r.outcome.safety='blocked',r=>r.cleanup.completed=false,r=>r.phases.find(v=>v.status==='failure').cleanup.termination_reason='cancelled']) {
   const r=clone(c.prior);mutate(r);assert.throws(()=>verifyPredecessor(r),/revision_browser_failure_invalid/);
  }
  for(const role of ['review','grant','delegation']) {
   const rec=role==='delegation'?Object.values(c.authority.linked)[0]:c.authority[role],original=clone(rec);
   for(const mutate of [r=>r.body='generic approval',r=>r.user={...r.user,type:'Bot'},r=>{if(role==='review')r.pull_request_url='https://api.github.com/repos/hynk-studio/augnes/pulls/1';else r.issue_url='https://api.github.com/repos/hynk-studio/augnes/issues/1';},r=>{if(role==='review')r.submitted_at=new Date(0).toISOString();else r.created_at=new Date(Date.parse(r.updated_at)-1).toISOString();}]) {
    mutate(rec);
    const obs=reviewedRevisionAuthorityObservation(rec,role==='review'?'accepted_revision':role==='grant'?'execution_commission':'task_delegation');
    if(role==='review')p.accepted.review.sha256=digest(obs);else if(role==='grant')p.authorization.grant_sha256=digest(obs);else p.commission.delegation.sha256=digest(obs);
    bind();await assert.rejects(h.auth(c,h.proof(c)));Object.assign(rec,clone(original));
   }
   const hash=digest(reviewedRevisionAuthorityObservation(rec,role==='review'?'accepted_revision':role==='grant'?'execution_commission':'task_delegation'));
   if(role==='review')p.accepted.review.sha256=hash;else if(role==='grant')p.authorization.grant_sha256=hash;else p.commission.delegation.sha256=hash;
  }
  {
   const delegation=Object.values(c.authority.linked)[0],original=clone(delegation),oldReview=c.authority.review.body,oldGrant=c.authority.grant.body,oldTarget=gitReviewTarget(p);
   delegation.created_at=delegation.updated_at=new Date(Date.parse(read(p.originals.completion).finished_at)-1).toISOString();
   p.commission.delegation.sha256=digest(reviewedRevisionAuthorityObservation(delegation,'task_delegation'));
   const target=gitReviewTarget(p);c.authority.review.body=oldReview.replaceAll(oldTarget,target);c.authority.grant.body=oldGrant.replaceAll(oldTarget,target);
   p.accepted.review.sha256=digest(reviewedRevisionAuthorityObservation(c.authority.review,'accepted_revision'));
   p.authorization.grant_sha256=digest(reviewedRevisionAuthorityObservation(c.authority.grant,'execution_commission'));bind();
   await assert.rejects(h.auth(c,h.proof(c)),/revision_material_fresh_authority_required/);
   Object.assign(delegation,original);c.authority.review.body=oldReview;c.authority.grant.body=oldGrant;
   p.commission.delegation.sha256=digest(reviewedRevisionAuthorityObservation(delegation,'task_delegation'));
   p.accepted.review.sha256=digest(reviewedRevisionAuthorityObservation(c.authority.review,'accepted_revision'));
   p.authorization.grant_sha256=digest(reviewedRevisionAuthorityObservation(c.authority.grant,'execution_commission'));
  }
  bind();unchanged();console.log(JSON.stringify({material_refusals:['ordinal two, provenance removal, alternate route and reset','stale or changed originals and incomplete live inventory','wrong runtime, source, driver, reduced witnesses and cleanup','success, observer and safety predecessors','absent, edited, spoofed and wrong-scope authority'],synthetic_only:true}));return;
 }
 if(group==='material-successor'){
 const parsed=h.proof(c),cap=await h.auth(c,parsed);
 // Its focused primary correction passes, but a distinct in-scope journal
 // condition fails naturally. It needs its own complete correction and grant.
 c.behaviorArgs=['journal'];c.failurePhase='integration';
 const currentMain=c.git(['commit-tree',c.tree,'-p',c.head,'-m','synthetic main movement']).toString().trim();
 c.git(['update-ref','refs/remotes/origin/main',currentMain]);
 const failed=await execute(parsed,cap,null,{decorateReceipt(r){
  Object.assign(r.integration_base,{contract:'augnes.local-canonical-integration-base.v2',base_matches_current_main:false});
  r.integration_base.observation.sha=currentMain;
  r.phases.find(p=>p.id==='integration').browser_use=[];
 }});delete c.failurePhase;
 assert.equal(failed.stock.valid_deciding_evidence,false);assert.equal(failed.child.result.exit_code,1);
 assert.equal(failed.stock.dimensions.current_merge_applicability,'different_current_main');
 assert(failed.stock.issues.includes('receipt_browser_identity_invalid:integration'));
 assert.throws(()=>h.begin(c,parsed,cap),/attempt_latest_tip_required/);unchanged();
 c.prior=failed.receipt;c.materialStock=failed.stock;c.materialPreserved=preserve();
 await correct('journal',70);unchanged();
 console.log(JSON.stringify({material_second_preparation:{new_grant:72,spent_grant:62,distinct_material_correction:true,unchanged_retry:false,
  failed_integration_browser_prefix:0,declared_base_retained:true,different_tracking_main:true,fresh_stock_false:true},synthetic_only:true}));return;
 }
 const final=h.proof(c),finalCap=await h.auth(c,final);
 if(group==='material-stock'){
 await currentGitStockControls(c,final,finalCap,c.materialFinalReceipt);
 runMaterialStockPredecessorControls(c,c.materialFinalReceipt);unchanged();return;
 }
 if(group==='material-final'){
 assert.deepEqual(tip().revision_grants,[11,32,62]);
 const exe=c.gitDeclaration.resources.find(v=>v.id==='browser-executable');
 const browser={contract:'augnes.local-canonical-browser-use.v2',executable_name:'Fixture',location_fingerprint:exe.location_fingerprint,
  before:exe.before,after:exe.before,actual_version:'Chrome/1',runtime_versions:{http:'Chrome/1',cdp:'Chrome/1'},disposition:'unchanged',unchanged:true};
 const complete=await execute(final,finalCap,browser);
 assert.equal(complete.stock.valid_deciding_evidence,true);assert.equal(tip().reviewed_revision_consumed,1);
 assert.deepEqual(tip().revision_grants,[11,32,62,72]);unchanged();
 const exported=createPrivateReviewExport(complete.receipt);assert(inspectPrivateReviewExport(exported).structurally_valid);
 assert.equal(exported.attempt.source_correction.commission.source_revision,MATERIAL_SOURCE_CORRECTION);
 assert.throws(()=>h.begin(c,final,finalCap),/attempt_latest_tip_required/);
 c.materialFinalReceipt=complete.receipt;
 let consumed=0,r=complete.receipt.attempt;while(r){if(r.source_correction?.kind==='reviewed_revision')consumed++;const prior=r.source_correction;r=prior?h.read(path.join(c.anchor,'.augnes-local-verification/families',prior.prior_family_id,'attempt-'+prior.prior_number+'.json')):null;}
 assert.equal(consumed,6);
 console.log(JSON.stringify({material_successor:{distinct_grants:[62,72],historical_grants:[11,32],historical_consumed:4,total_reviewed_consumed:consumed,commission_allowance:1,first_stock:false,second_stock:true,unchanged_retry:false},synthetic_only:true}));return;
 }
 // A genuinely separate process reobserves stock, then tries the late exact
 // reservation while holding its own checkout lease. The parent's lease is
 // released only around that owned child and reacquired after settlement.
 const packet=path.join(c.artifacts,'cold-packet.json');h.write(packet,{...h.read(packet),lateContender:true});
 h.releaseOwner();try{await h.fresh(packet);}finally{h.acquireOwner();}
 // An interrupted reservation remains consumed even without the attempt body.
 const edge=path.join(c.anchor,'.augnes-local-verification/families',final.prior_family_id,'correction-successor.json');
 rmSync(path.join(c.anchor,'.augnes-local-verification/families',c.materialFinalReceipt.attempt.family_id,'attempt-1.json'));
 assert.throws(()=>h.begin(c,final,finalCap));assert(existsSync(edge));
 console.log(JSON.stringify({material_reservation:{fresh_late_contender_refused:true,interruption_consumes:true,unchanged_retry:false},synthetic_only:true}));
}
