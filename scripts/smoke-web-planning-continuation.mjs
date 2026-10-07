// One synthetic campaign. Assessment is externally supplied test data, not a judgment.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateFileExport } from '../apps/web_planning/src/files.ts';
import { fixtureScope } from './web-planning-local-runtime.mjs';
import { digestBytes } from './web-planning-continuation-contract.mjs';
import { runDevelopmentChild, runOperation, withDevelopmentFixture, writeJson, click, set, settled, wait, selectFiles, ordinarySave } from './web-planning-continuation.mjs';
const self=fileURLToPath(import.meta.url);
async function seed(output,allow){
  const result=await withDevelopmentFixture(output,allow,async({c,root,login,traffic})=>{
    await login();await click(c,'new-work');await settled(c);await set(c,'goal','Synthetic D1 continuation <test> & exact');await set(c,'criteria','Preserve history\nVerify downloaded bytes');await set(c,'non-goals','No model judgment or code execution');
    for(const [i,text] of ['A <tag> & "quote"\n  spaced\tvalue','B depends on A; currentness unknown'].entries()){
      await click(c,'add-note');await c.eval(`(()=>{const n=document.querySelectorAll('.note')[${i}];for(const [k,v] of Object.entries(${JSON.stringify({text,source:'Synthetic attribution '+i,label:'Open question',provenance:i?'derived_interpretation':'user_declaration',observed_at:i?'2026-10-01T00:00:00.000Z':''})})){const e=n.querySelector('[data-field='+k+']');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));}})()`);
    }
    await c.eval("(()=>{const e=document.querySelectorAll('.dependencies')[1];e.options[0].selected=true;e.dispatchEvent(new Event('change',{bubbles:true}));})()");
    const file=path.join(root,'inert.txt');await writeFile(file,'Synthetic inert text. Never execute.\n',{flag:'wx'});await selectFiles(c,[file]);await settled(c);
    const progress={accepted_save:false,unknown_resolutions:0};await ordinarySave(c,1,progress);await set(c,'goal','Synthetic D1 continuation <test> & exact, revision two');await ordinarySave(c,2,progress);
    const exported=await c.eval("api('/api/work/'+work+'/export')"),validated=validateFileExport(fixtureScope,exported),current=validated.chain.at(-1),bytes=Buffer.from(JSON.stringify(exported)+'\n');await writeFile(path.join(output,'planning-work.json'),bytes,{flag:'wx'});
    return {synthetic:true,expected:{work_id:current.work_id,revision:current.revision,fingerprint:current.fingerprint,bytes:bytes.length,digest:digestBytes(bytes)},authored_save_requests:traffic.filter(x=>x.path.endsWith('/save')).length,unknown_resolutions:progress.unknown_resolutions};
  });await writeJson(path.join(output,'result.json'),result);
}
async function campaign(bundle,allow){
  const started_at=new Date().toISOString();await mkdir(bundle,{recursive:true});
  let stage='seed';try{
    const seeded=await runDevelopmentChild(self,['--seed'],path.join(bundle,'seed'),{},allow);
    await writeJson(path.join(bundle,'read-spec.json'),{input_export:'seed/planning-work.json',bundle:'.',expected:seeded.expected});stage='read';const cp=await runOperation('read',path.join(bundle,'read-spec.json'),allow);
    // This payload is authored only after the separate read returns with cleanup.
    const assessment={format:'web_planning_development_assessment.v1',input:seeded.expected,checkpoint_hash:cp.binding_hash,bundle_id:cp.bundle_id,conclusion:'insufficient-context',reasons:['Explicitly synthetic regression payload; no observed model judgment.'],recovered_refs:cp.material.current.sources.map(s=>s.source_ref),authored_at:new Date().toISOString(),attribution:{author:'D1 synthetic smoke orchestrator'},exposure_limits:{synthetic:true}};
    await writeJson(path.join(bundle,'synthetic-assessment.json'),assessment);await writeJson(path.join(bundle,'save-spec.json'),{input_export:'seed/planning-work.json',bundle:'.',expected:seeded.expected,assessment_file:'synthetic-assessment.json'});
    stage='save';const saved=await runOperation('save',path.join(bundle,'save-spec.json'),allow);assert.equal(saved.revision,seeded.expected.revision+1);assert.equal(saved.authored_save_requests,1);assert(saved.original_history_and_selections_preserved&&saved.assessment.authenticated_download_equal);
    await writeJson(path.join(bundle,'campaign.json'),{started_at,finished_at:new Date().toISOString(),status:'pass',synthetic:true,seed:seeded,checkpoint_hash:cp.binding_hash,save:saved,campaigns:1,corrections:0,deciding_verification:false});console.log(JSON.stringify({smoke:'pass',bundle,revision:saved.revision,assessment_digest:saved.assessment.digest}));
  }catch(e){await writeJson(path.join(bundle,'campaign-failure.json'),{started_at,finished_at:new Date().toISOString(),stage,status:'failed',code:e.code??null,campaigns:1,corrections:0});throw e;}
}
const args=process.argv.slice(2),child=args[0]==='--seed';if(child)args.shift();const allow=args.at(-1)==='--allow-unsandboxed-synthetic-pilot';if(allow)args.pop();
if(child){assert.equal(args.length,2);await seed(args[1],allow);}else{assert.equal(args.length,1);await campaign(path.resolve(args[0]),allow);}
