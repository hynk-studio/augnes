// Disposable synthetic authority. Real readers, physical ledger, behavioral
// subprocesses and fresh stock; these records never authorize host qualification.
import assert from 'node:assert/strict';
import {readFileSync,existsSync,rmSync,readdirSync} from 'node:fs';
import path from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {digest} from '../local-canonical-inputs.mjs';
import {CANONICAL_NODE_VERSION} from '../local-canonical-environment.mjs';
import {inspectGitRevisionPreparation,reconstructAttemptTip,reviewedRevisionAuthorityObservation} from '../local-canonical-attempts.mjs';
import {MATERIAL_SOURCE_CORRECTION,MATERIAL_HISTORY_BOUNDARY,gitReviewTarget,verifyGitRevisionFailure} from '../local-canonical-git-observation.mjs';
import {REVIEWED_REVISION_PHASES} from '../local-canonical-attempts.mjs';
import {executeFixture,dependencyRecords} from './local-canonical-browser-successor.mjs';
import {createPrivateReviewExport,inspectPrivateReviewExport} from '../local-canonical-review-export.mjs';
const clone=structuredClone,now=()=>new Date().toISOString();
const driver='scripts/workload-other-failure.mjs',product='apps/web_planning/src/exchange-client.js.txt';
const decision='Source review decision: ACCEPT / RETAIN for prospective qualification.';

export async function runMaterialSourceControls(c,h,group) {
 const ref=(name,value)=>h.artifact(c,name,value),read=r=>h.read(path.join(c.artifacts,r.artifact));
 const inspect=(p,live=c.live)=>{const material=clone(p);delete material.authorization;delete material.accepted.review;delete material.local_relative_path;
  const file=path.join(c.artifacts,'material.json');h.write(file,material);
  return inspectGitRevisionPreparation({file,repositoryRoot:c.checkout,predecessorRoot:c.checkout,anchorRoot:c.anchor,runtimeInputs:c.inputs,live});};
 const tip=()=>reconstructAttemptTip({anchorRoot:c.anchor,repositoryRoot:c.checkout,branch:c.branch});
 const bind=()=>h.write(c.file,c.proof);
 const execute=(p,cap,browser=null)=>executeFixture(c,{...h,begin:(subject,proof,authority,extra)=>h.begin(subject,proof,authority,{...extra,runId:'material-grant-'+proof.authorization.grant_comment_id})},p,cap,browser,dependencyRecords(c));
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
  const focused={...read(p.focused),finished_at:now(),implicated_paths:[product],source_files:read(after).source_files,input_remedy_resources:[],failed_phase:'authority',
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
  const p=h.proof(c),cap=await h.auth(c,p);
  const completed=await execute(p,cap);
  assert.equal(completed.stock.valid_deciding_evidence,false);assert.equal(completed.child.result.exit_code,1);
  c.prior=completed.receipt;c.materialStock=completed.stock;c.materialPreserved=preserve();
  assert.equal(tip().revision_grants.length,4);
  await correct('primary',60);unchanged();
  console.log(JSON.stringify({material_source_controls:['terminal spent predecessor remains immutable','real natural before failure and corrected after pass through production readers','non-reserving preparation binds complete inventory and a distinct one-slot grant'],synthetic_only:true}));return;
 }
 const p=c.proof,focused=read(p.focused);let n=0;
 if(group==='material-controls') {
  for(const mutate of [q=>q.commission.ordinal=2,q=>q.commission.maximum_invocations=2,q=>delete q.commission.source_revision,q=>delete q.commission.input_acquisition,
   q=>q.commission.reviewed_workload='spent-terminal-git-successor-workload-v1',q=>q.commission.root_family_id=digest('reset'),q=>q.branch+='-reset',q=>q.prior_attempt_id='stale',
   q=>delete q.inputs.inventory_sha256,q=>q.inputs.inventory_sha256=digest('missing input'),q=>q.head=c.prior.repository.head_sha]){
   const q=clone(p);mutate(q);assert.throws(()=>inspect(q));
  }
  for(const [key,mutate]of [['after',q=>q.runtime_inputs_sha256=digest('other runtime')],['after',q=>q.environment=digest('other environment')],['before',q=>q.file_sha256=digest('reduced assertions')],
   ['after',q=>q.source_files.pop()],['after',q=>q.modules[0].sha256=digest('wrong owner')],['after',q=>q.result.cleanup_completed=false],['after',q=>q.tested_source_head=c.prior.repository.head_sha]]){
   const f=clone(focused),w=clone(read(f.regression[key]));mutate(w);f.regression[key]=ref('bad-witness-'+(++n)+'.json',w);
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
  for(const mutate of [r=>r.outcome.disposition='completed_success',r=>r.outcome.disposition='unknown_relevance',r=>r.outcome.safety='blocked',r=>r.cleanup.completed=false,r=>r.phases.find(v=>v.status==='failure').cleanup.termination_reason='cancelled']) {
   const r=clone(c.prior);mutate(r);assert.throws(()=>verifyGitRevisionFailure(r,c.materialStock,c.inputs,REVIEWED_REVISION_PHASES,1,false));
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
 c.behaviorArgs=['journal'];const failed=await execute(parsed,cap);
 assert.equal(failed.stock.valid_deciding_evidence,false);assert.equal(failed.child.result.exit_code,1);
 assert.throws(()=>h.begin(c,parsed,cap),/attempt_latest_tip_required/);unchanged();
 c.prior=failed.receipt;c.materialStock=failed.stock;c.materialPreserved=preserve();
 await correct('journal',70);unchanged();
 console.log(JSON.stringify({material_second_preparation:{new_grant:72,spent_grant:62,distinct_material_correction:true,unchanged_retry:false},synthetic_only:true}));return;
 }
 const final=h.proof(c),finalCap=await h.auth(c,final);
 if(group==='material-final'){
 assert.deepEqual(tip().revision_grants,[11,32,42,52,62]);
 const exe=c.gitDeclaration.resources.find(v=>v.id==='browser-executable');
 const browser={contract:'augnes.local-canonical-browser-use.v2',executable_name:'Fixture',location_fingerprint:exe.location_fingerprint,
  before:exe.before,after:exe.before,actual_version:'Chrome/1',runtime_versions:{http:'Chrome/1',cdp:'Chrome/1'},disposition:'unchanged',unchanged:true};
 const complete=await execute(final,finalCap,browser);
 assert.equal(complete.stock.valid_deciding_evidence,true);assert.equal(tip().reviewed_revision_consumed,1);
 assert.deepEqual(tip().revision_grants,[11,32,42,52,62,72]);unchanged();
 const exported=createPrivateReviewExport(complete.receipt);assert(inspectPrivateReviewExport(exported).structurally_valid);
 assert.equal(exported.attempt.source_correction.commission.source_revision,MATERIAL_SOURCE_CORRECTION);
 assert.throws(()=>h.begin(c,final,finalCap),/attempt_latest_tip_required/);
 c.materialFinalReceipt=complete.receipt;
 let consumed=0,r=complete.receipt.attempt;while(r){if(r.source_correction?.kind==='reviewed_revision')consumed++;const prior=r.source_correction;r=prior?h.read(path.join(c.anchor,'.augnes-local-verification/families',prior.prior_family_id,'attempt-'+prior.prior_number+'.json')):null;}
 assert.equal(consumed,8);
 console.log(JSON.stringify({material_successor:{distinct_grants:[62,72],historical_grants:[11,32,42,52],historical_consumed:6,total_reviewed_consumed:consumed,commission_allowance:1,first_stock:false,second_stock:true,unchanged_retry:false},synthetic_only:true}));return;
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
