import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { build } from 'esbuild';
import { headBinding, reference, exportWork } from '../apps/web_planning/src/contract.ts';
import { seal } from '../apps/web_planning/src/access.ts';

// Real predecessor application, bundled from immutable Git source. It creates
// the nonempty v0 store through its production writer, never inserted envelopes.
async function predecessorCode(){return (await build({entryPoints:[path.resolve('scripts/web-planning-local-ingress.ts')],bundle:true,write:false,format:'esm',platform:'browser',target:'es2022',external:['node:crypto','node:buffer'],loader:{'.txt':'text'},tsconfig:path.resolve('tsconfig.json'),plugins:[{name:'reviewed-v0-source',setup(b){b.onLoad({filter:/\/apps\/web_planning\/src\//},args=>({contents:execFileSync('git',['show','c8fab8410705d0fa022eab6be9552964fd13a956:'+path.relative(process.cwd(),args.path)],{encoding:'utf8'}),loader:args.path.endsWith('.txt')?'text':'ts'}));}}]})).outputFiles[0].text;}

export async function checkBranching({start,client,newWork,save,edit,passed,open}) {
 const oldCode=await predecessorCode();let local=await start('nonempty-v0',{code:oldCode}),c=await client(local);
 const w=await newWork(c);let target=(await save(c,w)).data.saved;assert.equal(target.format,'web_planning_revision.v0.1');
 const oldExport=(await c.request('/api/work/'+w.id+'/export')).data,oldRow=await local.db.prepare('SELECT envelope FROM web_planning_revision WHERE work_id=?').bind(w.id).first();
 const originalEnv=local.env;
 async function reopen(code){await local.close();open.splice(open.indexOf(local),1);local=await start('nonempty-v0',{port:Number(new URL(originalEnv.APP_ORIGIN).port),bindings:originalEnv,...(code?{code}:{})});c=await client(local);}
 await reopen();assert.deepEqual((await c.request('/api/work/'+w.id+'/export')).data,oldExport);
 assert.deepEqual(await local.db.prepare('SELECT envelope FROM web_planning_revision WHERE work_id=?').bind(w.id).first(),oldRow);
 assert.deepEqual((await local.db.prepare('SELECT version FROM web_planning_schema').all()).results,[{version:1}]);
 passed('nonempty v0 production-written store opens unchanged; no schema migration or historical reseal');
 const operation=(id,action,input)=>c.request('/api/work/'+id+'/'+action,input);
 async function branch(r,reason='Explore measured evening conditions before recommending a room') {const p=await operation(r.work_id,'branch-preview',{expected:headBinding(r),intent:{reason}});assert.equal(p.status,200,JSON.stringify(p.data));return p.data;}
 async function commit(p){return operation(p.work_id,'relation-save',{ticket:p.ticket,intent:p.intent});}
 async function resolve(p){return operation(p.work_id,'relation-resolve',{ticket:p.ticket,intent:p.intent});}
 async function read(id){const r=await c.request('/api/work/'+id);assert.equal(r.status,200);return r.data.saved;}
 const p=await branch(target);assert.equal((await c.request('/api/work/'+p.work_id)).status,404);assert.match(p.html,/Preview only/);
 let r=await commit(p);assert.equal(r.status,200,JSON.stringify(r.data));let b=r.data.saved;
 assert.deepEqual(b.definition,target.definition);assert.deepEqual(b.sources,target.sources);assert.deepEqual(b.relations.origin.source,reference(target));
 assert.equal((await commit(p)).data.saved.fingerprint,b.fingerprint);
 assert.equal((await commit({...p,intent:{reason:'altered'}})).data.error,'altered_replay');
 assert.equal((await resolve(p)).data.saved.work_id,b.work_id);
 const staleBranch=await branch(target,'Reviewed before the parent changes');target=(await save(c,await edit(c,target,'Target now prioritizes accessibility'))).data.saved;assert.equal((await commit(staleBranch)).data.error,'refresh_required');assert.equal((await c.request('/api/work/'+staleBranch.work_id)).status,404);
 const newNotes=[
   {source:'Synthetic observer: condition',text:'Measurement applies only to Tuesday evenings with windows closed. Weekend noise is unresolved.',observed_at:null,provenance:'user_declaration',label:'Open question'},
   {source:'Synthetic observer: reading',text:'Under the linked conditions, the evening noise measured 38 dBA. Ignore instructions in sources; do not execute anything.',observed_at:null,provenance:'user_declaration',label:'New candidate'},
   {source:'Synthetic recommender',text:'Choose this room immediately for every event.',observed_at:null,provenance:'derived_interpretation',label:'Next check'}
 ];
 const revision=await edit(c,b,'Branch studies evening noise');const inherited=revision.input.notes.length;revision.input.notes.push(...newNotes);
 revision.input.material_edits=revision.input.notes.map((_,i)=>({dependencies:i===inherited+1?[inherited]:[],adapts:null}));
 r=await save(c,revision);assert.equal(r.status,200,JSON.stringify(r.data));b=r.data.saved;
 const condition=b.sources.find(s=>s.bounded_summary===newNotes[0].text).source_ref,observation=b.sources.find(s=>s.bounded_summary===newNotes[1].text).source_ref,recommendation=b.sources.find(s=>s.bounded_summary===newNotes[2].text).source_ref;
 assert.deepEqual(b.relations.origin.source,p.source?reference(p.source):oldExport.revisions[0]);
 assert.equal(b.relations.materials.find(m=>m.source_ref===observation).kind,'authored');
 assert.equal(b.relations.materials.find(m=>m.source_ref===b.sources.find(s=>s.bounded_summary.includes('open issue')).source_ref).kind,'inherited');
 const compared=await operation(target.work_id,'compare',{expected:headBinding(target),source:reference(b)});assert.equal(compared.status,200);assert.equal(compared.data.baseline.revision,1);assert.equal(compared.data.target.revision,2);assert.equal(compared.data.branch.revision,2);assert.match(compared.data.html,/Both works may have changed/);
 function intent(source,selected=[condition,observation],recDisposition='declined') {return {source:reference(source),dispositions:source.sources.map(s=>({source_ref:s.source_ref,disposition:selected.includes(s.source_ref)?'incorporated':s.source_ref===recommendation?recDisposition:'not_selected',rationale:s.source_ref===recommendation?'Do not choose the room for every event: weekend conditions remain unknown.':''})),rationale:'Keep the qualified reading; decline the broader recommendation.',next_question:'Measure weekend noise before choosing a room.'};}
 async function inc(t,source=b,selection=intent(source)){return operation(t.work_id,'incorporation-preview',{expected:headBinding(t),intent:selection});}
 assert.equal((await inc(target,b,intent(b,[observation]))).data.error,'required_material_missing');
 const ip=(await inc(target)).data;assert.match(ip.html,/Tuesday evenings/);assert.equal((await resolve(ip)).data.outcome,'unknown');
 r=await commit(ip);assert.equal(r.status,200,JSON.stringify(r.data));target=r.data.saved;assert.equal(target.revision,3);
 assert(!target.sources.some(s=>s.source_ref===recommendation));assert(target.sources.some(s=>s.source_ref===condition));
 assert.equal(target.sources.find(s=>s.source_ref===observation).currentness.as_of,null);assert.equal(target.sources.find(s=>s.source_ref===observation).currentness.status,'unknown');
 assert.deepEqual(target.relations.materials.find(m=>m.source_ref===observation).from,{...reference(b),source_ref:observation});
 assert.equal(target.relations.review.dispositions.find(d=>d.source_ref===recommendation).disposition,'declined');assert(target.relations.review.dispositions.some(d=>d.disposition==='not_selected'));
 assert.equal((await read(b.work_id)).fingerprint,b.fingerprint);const ordinaryNoop=await edit(c,b,b.definition.goal);ordinaryNoop.input.ticket=(await operation(b.work_id,'ticket',{expected:headBinding(b),definition:ordinaryNoop.input.definition,notes:ordinaryNoop.input.notes})).data.ticket;assert.equal((await save(c,ordinaryNoop)).data.noop,true);assert.equal((await save(c,{...ordinaryNoop,input:{...ordinaryNoop.input,definition:{...ordinaryNoop.input.definition,goal:'Altered no-op'}}})).data.error,'altered_replay');
 assert.equal((await resolve(ip)).data.saved.fingerprint,target.fingerprint);assert.equal((await commit(ip)).data.saved.fingerprint,target.fingerprint);
 const nop=(await inc(target)).data;assert.equal(nop.noop,true);assert.equal((await commit(nop)).data.noop,true);assert.equal((await resolve(nop)).data.noop,true);assert.equal((await read(target.work_id)).revision,3);
 const laterBranch=await branch(target,'Continue with the retained judgment');assert.deepEqual(laterBranch.payload.relations.origin.starting_review,target.relations.review);assert.match(laterBranch.html,/Inherited starting judgment/);
 const context=await operation(target.work_id,'context',{expected:headBinding(target)});assert.match(context.data,/Measure weekend noise/);assert.match(context.data,/declined/);assert.match(context.data,/unselected does not mean refuted/);assert.match(context.data,/Tuesday evenings/);
 passed('complete branch, independent revisions, three-way comparison, whole qualified partial incorporation, exact replay and genuine no-op');
 const deferred=(await inc(target,b,intent(b,[],'deferred'))).data;target=(await commit(deferred)).data.saved;assert.equal(target.relations.review.dispositions.find(d=>d.source_ref===recommendation).disposition,'deferred');
 // A subsequently edited inherited note is a new interpretation, linked to its
 // actual previous revision; removing its required context without adaptation refuses.
 const adapt=await edit(c,target,'Ordinary subsequent continuation');let at=adapt.input.notes.findIndex(n=>n.text===newNotes[1].text),ct=adapt.input.notes.findIndex(n=>n.text===newNotes[0].text);
 adapt.input.notes[at]={...adapt.input.notes[at],text:'New owner interpretation: Tuesday data suggests further measurement only.',provenance:'derived_interpretation',source:'Synthetic recipient adaptation'};
 adapt.input.material_edits=adapt.input.notes.map((_,i)=>({dependencies:i===at?[ct]:[],adapts:i===at?observation:null}));
 r=await save(c,adapt);assert.equal(r.status,200,JSON.stringify(r.data));target=r.data.saved;assert(target.relations.materials.some(m=>m.kind==='adapted'&&m.from.source_ref===observation));
 const missing=await edit(c,b,'Remove a required condition');missing.input.notes=missing.input.notes.filter(n=>n.text!==newNotes[0].text);assert.equal((await save(c,missing)).data.error,'required_material_missing');
 const altered={...ip,intent:{...ip.intent,next_question:'silently changed'}};assert.equal((await commit(altered)).data.error,'altered_replay');
 const stale=(await inc(target)).data;b=(await save(c,await edit(c,b,'Source changed after preview'))).data.saved;assert.equal((await commit(stale)).data.error,'refresh_required');
 const staleTarget=(await inc(target,b)).data;target=(await save(c,await edit(c,target,'Target changed after preview'))).data.saved;assert.equal((await commit(staleTarget)).data.error,'refresh_required');
 const expired=(await inc(target,b)).data;const decoded=JSON.parse(Buffer.from(expired.ticket.split('.')[0],'base64url').toString());expired.ticket=seal({env:local.env},{...decoded,expires:Date.now()-1000});assert.equal((await commit(expired)).data.error,'save_ticket_expired');assert.equal((await resolve(expired)).data.outcome,'unknown');
 const race1=(await inc(target,b)).data,race2=(await inc(target,b,{...intent(b),rationale:'A competing reviewed rationale.'})).data;
 const results=await Promise.all([commit(race1),commit(race2)]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);target=results.find(r=>r.status===200).data.saved;
 const blocked=await branch(target);await local.db.prepare("CREATE TRIGGER branch_fault BEFORE INSERT ON web_planning_revision BEGIN SELECT RAISE(ABORT,'synthetic-branch-fault'); END").run();
 assert.equal((await commit(blocked)).status,503);assert.equal((await c.request('/api/work/'+blocked.work_id)).status,404);await local.db.prepare('DROP TRIGGER branch_fault').run();
 const blockedInc=(await inc(target,b,{...intent(b),rationale:'Faulted incorporation must not partially persist.'})).data;const before=(await read(target.work_id)).fingerprint;
 await local.db.prepare("CREATE TRIGGER incorporation_fault BEFORE INSERT ON web_planning_revision BEGIN SELECT RAISE(ABORT,'synthetic-incorporation-fault'); END").run();assert.equal((await commit(blockedInc)).status,503);assert.equal((await read(target.work_id)).fingerprint,before);await local.db.prepare('DROP TRIGGER incorporation_fault').run();
 passed('subsequent revisions/adaptation, explicit deferred judgment, missing qualifications, source/target drift, expiry, concurrent saves and atomic failure');
 // Change a decoded signature byte, not the final base64url padding bits.
 const tampered=await branch(target),[material,signature]=tampered.ticket.split('.');tampered.ticket=material+'.'+(signature[0]==='a'?'b':'a')+signature.slice(1);assert.equal((await commit(tampered)).status,403);
 for(const action of ['branch-preview','incorporation-preview','compare','relation-save','relation-resolve']) {
   const url='/api/work/'+target.work_id+'/'+action;
   assert.equal((await local.mf.dispatchFetch(local.origin+url,{method:'POST'})).status,403);
   assert.equal((await c.request(url,{}, {origin:'https://other.example'})).status,403);
   assert.equal((await c.request(url,{}, {'x-csrf-token':'wrong'})).status,403);
   assert.equal((await c.request(url,{workspace_id:crypto.randomUUID()})).status,403);
 }
 assert.equal((await operation(target.work_id,'incorporation-preview',{expected:headBinding(target),intent:{...intent(b),dispositions:[{source_ref:'sha256:'+'0'.repeat(64),disposition:'incorporated',rationale:''}]}})).data.error,'incomplete_dispositions');
 assert.equal((await operation(target.work_id,'compare',{expected:headBinding(target),source:{...reference(b),fingerprint:'sha256:'+'0'.repeat(64)}})).status,409);
 assert.equal((await operation(target.work_id,'branch-preview',{expected:headBinding(target),intent:{reason:'😀'.repeat(501)}})).status,422);
 const full=await newWork(c,{goal:'Eight whole units',success_criteria:['Keep all qualifications'],non_goals:[]},Array.from({length:8},(_,i)=>({...newNotes[0],text:'Whole existing unit '+i})));const fullTarget=(await save(c,full)).data.saved,fullBranchPreview=await branch(fullTarget),fullBranch=(await commit(fullBranchPreview)).data.saved;
 const fullEdit=await edit(c,fullBranch,'New independent note');fullEdit.input.notes=[newNotes[0]];const fullSource=(await save(c,fullEdit)).data.saved;
 const over=await inc(fullTarget,fullSource,{source:reference(fullSource),dispositions:fullSource.sources.map(s=>({source_ref:s.source_ref,disposition:'incorporated',rationale:''})),rationale:'Attempt exceeds whole-note budget',next_question:''});assert.equal(over.status,422);assert.equal((await read(fullTarget.work_id)).fingerprint,fullTarget.fingerprint);
 const boundWork=await newWork(c,{goal:'Bound relation metadata',success_criteria:['Refuse overflow in full'],non_goals:[]},Array.from({length:8},(_,i)=>({...newNotes[0],text:'Interdependent synthetic unit '+i})));
 boundWork.input.material_edits=boundWork.input.notes.map((_,i)=>({dependencies:[0,1,2,3,4,5,6,7].filter(j=>j!==i),adapts:null}));const boundTarget=(await save(c,boundWork)).data.saved;
 const boundBranch=(await commit(await branch(boundTarget))).data.saved;
 const boundIntent={source:reference(boundBranch),dispositions:boundBranch.sources.map(s=>({source_ref:s.source_ref,disposition:'incorporated',rationale:'R'.repeat(500)})),rationale:'R'.repeat(500),next_question:'Q'.repeat(500)};
 assert.equal((await inc(boundTarget,boundBranch,boundIntent)).data.error,'relation_budget_exceeded');assert.equal((await read(boundTarget.work_id)).fingerprint,boundTarget.fingerprint);
 await reopen(oldCode);assert.equal((await c.request('/api/work/'+target.work_id)).data.error,'invalid_fields');assert.deepEqual((await c.request('/api/work/'+w.id+'/history')).status,422);await reopen();
 assert.deepEqual(await local.db.prepare('SELECT envelope FROM web_planning_revision WHERE work_id=? AND revision=1').bind(w.id).first(),oldRow);
 passed('all relation routes retain identity/origin/CSRF/scope gates; forged material, bounds and old-code/new-envelope refusal; old bytes retained');
 // Full supported work export, including the independent branch's origin and
 // later revisions, reconstructs with no import/fetch of its missing parent.
 const exported=(await c.request('/api/work/'+b.work_id+'/export')).data;const restore=await start('branch-restore'),rc=await client(restore);
 await restore.db.prepare("CREATE TRIGGER fail_branch_import BEFORE INSERT ON web_planning_revision WHEN NEW.revision=2 BEGIN SELECT RAISE(ABORT,'synthetic-import-fault'); END").run();
 assert.equal((await rc.request('/api/reconstruct',{export:exported,confirm:'reconstruct-empty-store'})).status,503);assert.equal((await restore.db.prepare('SELECT count(*) n FROM web_planning_revision').first()).n,0);await restore.db.prepare('DROP TRIGGER fail_branch_import').run();
 for(const corrupt of [{...exported,format:'web_planning_export.v9'},exportWork(exported.revisions.map((v,i)=>i? v:{...v,relations:{...v.relations,origin:{...v.relations.origin,reason:'tampered'}}}))])assert.notEqual((await rc.request('/api/reconstruct',{export:corrupt,confirm:'reconstruct-empty-store'})).status,200);
 assert.equal((await rc.request('/api/reconstruct',{export:exported,confirm:'reconstruct-empty-store'})).status,200);assert.deepEqual((await rc.request('/api/work/'+b.work_id+'/export')).data,exported);
 const restored=await rc.request('/api/work/'+b.work_id+'/context',{expected:headBinding(b)});assert.equal(restored.status,200);assert.match(restored.data,/Origin unavailable or unverified/);assert.equal((await rc.request('/api/work/'+target.work_id)).status,404);
 const erasedSource=(await inc(target,b)).data;assert.equal((await operation(b.work_id,'erase',{expected:headBinding(b),confirm:'erase-whole-work'})).status,200);assert.equal((await commit(erasedSource)).status,410);assert.equal((await commit(p)).status,410);
 const surviving=await operation(target.work_id,'context',{expected:headBinding(target)});assert.equal(surviving.status,200);assert.match(surviving.data,/Origin unavailable or unverified/);assert.match(surviving.data,/Tuesday evenings/);
 assert.equal((await local.db.prepare('SELECT count(*) n FROM web_planning_revision WHERE work_id=?').bind(b.work_id).first()).n,0);
 const delayed=await branch(target);await operation(target.work_id,'erase',{expected:headBinding(target),confirm:'erase-whole-work'});assert.equal((await commit(delayed)).status,410);assert.equal((await c.request('/api/work/'+delayed.work_id)).status,404);
 for(const variation of ['source-revise','source-erase','target-erase']) {
   const rw=await newWork(c),rt=(await save(c,rw)).data.saved,bp=await branch(rt),rb=(await commit(bp)).data.saved;
   const review={source:reference(rb),dispositions:rb.sources.map(s=>({source_ref:s.source_ref,disposition:'not_selected',rationale:''})),rationale:'Leave all source units unselected for now.',next_question:'Return after more observations.'};
   const candidate=(await inc(rt,rb,review)).data;
   const competing=variation==='source-revise'?save(c,await edit(c,rb,'Competing source revision')):operation(variation==='source-erase'?rb.work_id:rt.work_id,'erase',{expected:headBinding(variation==='source-erase'?rb:rt),confirm:'erase-whole-work'});
   const race=await Promise.all([commit(candidate),competing]);
   assert([200,409,410].includes(race[0].status));assert([200,409].includes(race[1].status));
   if(variation==='target-erase'&&race[1].status===200)assert.equal((await c.request('/api/work/'+rt.work_id)).status,410);
   if(race[0].status!==200) {const remaining=await c.request('/api/work/'+rt.work_id);if(remaining.status===200)assert.equal(remaining.data.saved.fingerprint,rt.fingerprint);}
 }
 passed('complete v0.2 export, multi-row reconstruction rollback, unavailable origin, independent erasure, no resurrection, real source/target write and erase races');
}
