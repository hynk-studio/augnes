// Focused synthetic controls. No historical pilot imports or model assessment.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizePayload, makeRevision, headBinding } from '../apps/web_planning/src/contract.ts';
import { selectedFiles, exportFiles } from '../apps/web_planning/src/files.ts';
import { renderContext } from '../apps/web_planning/src/page.ts';
import { fixtureScope } from './web-planning-local-runtime.mjs';
import { canonical, hash, digestBytes, admitInput, validateCheckpoint, validateAssessment, checkpointMaterial, bundlePaths, requireCleanup, extractContextDom, contextFieldObservations, requireContextFields } from './web-planning-continuation-contract.mjs';
import { runDevelopmentChild, withDevelopmentFixture, writeJson } from './web-planning-continuation.mjs';
const self=fileURLToPath(import.meta.url);
function fixture(index){
  const id=randomUUID(),chain=[];
  const payload=normalizePayload(fixtureScope,{goal:`Synthetic ${index}: <escaped> & exact`,success_criteria:['Line one\n  indented','Tabs\there'],non_goals:['No judgment claim']},[
    {text:'A <tag> & "quote"\n  spaced\tvalue',source:'Attribution A',label:'Open question',provenance:'user_declaration',observed_at:null},
    {text:'B uses A\n  exact spacing',source:'Attribution B',label:'Open question',provenance:'derived_interpretation',observed_at:'2026-10-01T00:00:00.000Z'}]);
  payload.relations={origin:null,review:null,materials:payload.sources.map((s,i)=>({source_ref:s.source_ref,kind:'authored',from:null,dependencies:i?[payload.sources[0].source_ref]:[]}))};
  const selected=selectedFiles(payload,[{name:`inert-${index}.txt`,role:'other',data:Buffer.from(`inert ${index}\n`).toString('base64')}]);
  for(let n=0;n<index;n++)chain.push(makeRevision(fixtureScope,id,headBinding(chain.at(-1)),randomUUID(),selected.payload,`2026-10-01T00:00:0${n}.000Z`));
  const data=exportFiles(chain,selected.bodies),bytes=Buffer.from(JSON.stringify(data)+'\n'),current=chain.at(-1);
  return {chain,current,bytes,expected:{work_id:id,revision:current.revision,fingerprint:current.fingerprint,bytes:bytes.length,digest:digestBytes(bytes)}};
}
async function controls(output,allow){
  const root=process.env.AUGNES_CANONICAL_TEMP_ROOT,checks=[],identities=[],fields=[];
  const check=(id,fn)=>{fn();checks.push(id);},reject=(id,fn,code)=>check(id,()=>assert.throws(fn,e=>e.code===code));
  const fixtures=[fixture(1),fixture(2)];
  for(const [i,f] of fixtures.entries()){
    identities.push(f.expected);check(`input.${i}.valid`,()=>assert.equal(admitInput(f.bytes,f.expected).current.work_id,f.current.work_id));
    for(const k of ['bytes','digest','work_id','revision','fingerprint']){
      const wrong={...f.expected,[k]:k==='bytes'?f.expected.bytes+1:k==='revision'?f.expected.revision+1:k==='work_id'?randomUUID():'sha256:'+'0'.repeat(64)};
      reject(`input.${i}.wrong-${k}`,()=>admitInput(f.bytes,wrong),['bytes','digest'].includes(k)?'input_bytes_binding':'input_head_binding');
    }
    const corrupt=JSON.parse(f.bytes);corrupt.revisions.at(-1).definition.goal+='tampered';const b=Buffer.from(JSON.stringify(corrupt));
    reject(`input.${i}.tampered`,()=>admitInput(b,{...f.expected,bytes:b.length,digest:digestBytes(b)}),'export_integrity');
  }
  const bundle=path.join(root,'bundle');await mkdir(bundle);await mkdir(path.join(bundle,'read'));
  await assert.rejects(bundlePaths(bundle,'read'),{code:'operation_output_exists'});checks.push('bundle.non-overwrite');
  const linked=path.join(root,'linked');await symlink(bundle,linked);await assert.rejects(bundlePaths(linked,'save'),{code:'bundle_not_regular'});checks.push('bundle.symlink-refused');
  const goodCleanup={worker_disposed:true,browser_exit_observed:true,browser_streams_closed:true,debug_listener_closed:true,owned_browser_records:0,failures:[]};
  for(const k of ['worker_disposed','browser_exit_observed','browser_streams_closed','debug_listener_closed','owned_browser_records','failures'])reject('cleanup.'+k,()=>requireCleanup({...goodCleanup,[k]:k==='owned_browser_records'?1:k==='failures'?[{code:'observed_failure'}]:false}),'fixture_cleanup_incomplete');
  await withDevelopmentFixture(output,allow,async({c})=>{
    for(const [i,f] of fixtures.entries()){
      const render=()=>c.eval(`document.body.innerHTML=${JSON.stringify('<div id="context-view">'+renderContext(f.current,f.chain.at(-2))+'</div>')}`);
      const observe=()=>c.eval(`(${extractContextDom.toString()})(document.getElementById('context-view'))`);
      for(const expanded of [false,true]){
        await render();if(expanded)await c.eval("document.querySelectorAll('details').forEach(e=>e.open=true)");
        const dom=await observe(),rows=contextFieldObservations(dom,f.current);fields.push({identity:i,expanded,rows});requireContextFields(rows);
        assert(dom.disclosures.every(d=>d.open));if(!expanded)assert(dom.disclosures.some(d=>!d.was_open&&d.after_ref_visible===true));
        checks.push(`dom.${i}.${expanded?'expanded':'collapsed'}.exact`);
      }
      const mutations=[
        ['missing-ref',"document.querySelector('.context-note details code').remove()",'source_ref'],
        ['swapped-ref',"(()=>{const e=document.querySelectorAll('.context-note details code');[e[0].textContent,e[1].textContent]=[e[1].textContent,e[0].textContent]})()",'source_ref'],
        ['missing-attribution',"document.querySelector('.context-note dl dd').remove()",'attribution'],
        ['swapped-attribution',"(()=>{const e=document.querySelectorAll('.context-note dl dd:first-of-type');[e[0].textContent,e[1].textContent]=[e[1].textContent,e[0].textContent]})()",'attribution'],
        ['missing-dependency',"[...document.querySelectorAll('article>details')].find(e=>e.querySelector('summary').textContent==='Material provenance and required context').querySelector('p').remove()",'dependencies'],
        ['swapped-dependency',"(()=>{const e=[...document.querySelectorAll('article>details')].find(e=>e.querySelector('summary').textContent==='Material provenance and required context').querySelectorAll('p');[e[0].textContent,e[1].textContent]=[e[1].textContent,e[0].textContent]})()",'dependencies'],
        ['file-association',"document.querySelector('[data-file-url]').dataset.fileName='swapped.txt'",'files']];
      for(const [name,mutation,expected] of mutations){await render();await c.eval(mutation);const rows=contextFieldObservations(await observe(),f.current);fields.push({identity:i,negative:name,rows});assert.throws(()=>requireContextFields(rows),e=>e.code==='CONTEXT_FIELD_MISMATCH'&&e.check_id.includes(expected));checks.push(`dom.${i}.${name}.diagnostic`);}
      await render();const dom=await observe(),binding=hash(bundle),material=checkpointMaterial(f.expected,f.current,dom,f.chain),cp={format:'web_planning_development_checkpoint.v1',complete:true,cleanup:{complete:true},bundle_binding:binding,bundle_id:randomUUID(),observed_at:'2026-10-01T01:00:00.000Z',material,binding_hash:hash(canonical(material))};
      check(`checkpoint.${i}.valid`,()=>validateCheckpoint(cp,f.expected,binding));
      reject(`checkpoint.${i}.bundle`,()=>validateCheckpoint(cp,f.expected,hash(linked)),'checkpoint_bundle_mismatch');
      reject(`checkpoint.${i}.stale-input`,()=>validateCheckpoint(cp,fixtures[1-i].expected,binding),'checkpoint_input_mismatch');
      for(const changed of [{...cp,complete:false},{...cp,cleanup:{complete:false}}])reject(`checkpoint.${i}.incomplete`,()=>validateCheckpoint(changed,f.expected,binding),'checkpoint_incomplete');
      const tampered=structuredClone(cp);tampered.material.current.sources[0].bounded_summary+='changed';reject(`checkpoint.${i}.content`,()=>validateCheckpoint(tampered,f.expected,binding),'checkpoint_content_integrity');
      const assessment={format:'web_planning_development_assessment.v1',input:f.expected,checkpoint_hash:cp.binding_hash,bundle_id:cp.bundle_id,conclusion:'insufficient-context',reasons:['Synthetic neutral test'],recovered_refs:[f.current.sources[0].source_ref],authored_at:'2026-10-01T02:00:00.000Z',attribution:{author:'synthetic regression'},exposure_limits:{synthetic:true}};
      for(const conclusion of ['reuse','non-use','insufficient-context'])check(`assessment.${i}.${conclusion}`,()=>validateAssessment({...assessment,conclusion},cp));
      reject(`assessment.${i}.wrong-checkpoint`,()=>validateAssessment({...assessment,checkpoint_hash:hash('wrong')},cp),'assessment_binding');
      reject(`assessment.${i}.unseen-ref`,()=>validateAssessment({...assessment,recovered_refs:[hash('unseen')]},cp),'assessment_unseen_reference');
      reject(`assessment.${i}.stale-time`,()=>validateAssessment({...assessment,authored_at:'2026-09-01T00:00:00.000Z'},cp),'assessment_authored_time');
    }
  });
  const result={synthetic:true,checks,check_count:checks.length,identities,fields,deciding_verification:false};await writeJson(path.join(output,'result.json'),result);
}
const args=process.argv.slice(2),child=args[0]==='--child';if(child)args.shift();const allow=args.at(-1)==='--allow-unsandboxed-synthetic-pilot';if(allow)args.pop();
if(child){assert.equal(args.length,2);await controls(args[1],allow);}else{assert.equal(args.length,1);const result=await runDevelopmentChild(self,['--child'],path.resolve(args[0]),{},allow);console.log(JSON.stringify({focused_controls:result.check_count,synthetic_identities:result.identities,deciding_verification:false}));}
