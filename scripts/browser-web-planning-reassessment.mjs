import assert from 'node:assert/strict';
import { mkdir,writeFile } from 'node:fs/promises';
import path from 'node:path';
import { runCanonicalChild,canonicalChildAcceptanceFailure } from './canonical-child-runner.mjs';

export async function browserConsumerReassessment({c,fresh,origin,env,root,click,set,settled,wait,navigate,barrier,checks,scenario}){
  const material=scenario??{sourceGoal:'Returned route basis',aGoal:'Prepare next review route',bGoal:'Assess operational readiness',evidenceGoal:'Selected route correction',
    old:'Owner route only. Deployment remains unknown.\r\n',new:'Recipient route now supported with independent login. Deployment remains unknown.\r\n',
    aOld:'Use the owner route while recipient support is unobserved.\n',bOld:'HOLD until deployment, migration and ingress are observed.\n',
    aNew:'Select the recipient route with independent login; keep deployment and ingress prerequisites open.\n',
    aContext:'Recipient route chosen for the next permitted handoff.',bContext:'Operational HOLD retained; accepted source does not prove deployment.',
    aReason:'The selected source adds a supported recipient path.',bReason:'The source change does not observe activation.',
    next:'Confirm supported login, deployment, migration and recipient ingress before sharing.'};
  const seed=await c.eval(`(async()=>{
    const m=${JSON.stringify(material)},ref=r=>({work_id:r.work_id,revision:r.revision,fingerprint:r.fingerprint});
    const create=async(goal,text)=>{const d=await api('/api/drafts',{});const body={ticket:d.ticket,definition:{goal,success_criteria:['Prepare a permitted next step'],non_goals:['No deployment or invitations']},notes:[{text:'Preserve unrelated useful preparation.',source:'Constructed consumer context',observed_at:null,provenance:'user_declaration',label:'Next check'}],files:text?[{name:'README.md',role:'source',data:btoa(unescape(encodeURIComponent(text)))}]:[{name:'unrelated.txt',role:'source',data:btoa('KEEP UNRELATED')} ]};return (await api('/api/work/'+d.work_id+'/save',body)).saved;};
    const source=await create(m.sourceGoal,null),files=[{name:'README.md',media_type:'text/markdown',data:btoa(unescape(encodeURIComponent(m.old))),bytes:new TextEncoder().encode(m.old).length,digest:await exchangeDigest(new TextEncoder().encode(m.old))}];
    const request=await api('/api/work/'+source.work_id+'/exchanges/save',{kind:'request',basis:null,expected:binding(source),request_key:crypto.randomUUID(),message:'Review this exact public source for the two preparation purposes.',next_action:'',files});
    const returned=await api('/api/work/'+source.work_id+'/exchanges/save',{kind:'return',basis:request.item.ref,expected:request.head,request_key:crypto.randomUUID(),message:'Selected source returned for explicit consumer judgment.',next_action:'Assess each consumer independently.',files});
    const view=await api('/api/work/'+source.work_id+'/inspect-return',{returned:returned.item.ref,index:0,after:null});
    const {prepareReturnDraft}=await import('/planning-notes.mjs');
    const consume=async(goal,text)=>{const dst=await create(goal,null),p=await prepareReturnDraft(api,view.selection,{decision:'adapted',name:'choice.md',text,rationale:'Newly authored controlled baseline from the exact earlier source.',limits:'Not a historical pre-merge judgment.',next_action:'Reconsider explicitly selected current evidence.'},{saved:dst});return (await api('/api/work/'+p.work_id+'/save',p.body)).saved;};
    const a=await consume(m.aGoal,m.aOld),b=await consume(m.bGoal,m.bOld),e=await create(m.evidenceGoal,m.new),recovery=await consume('Recovery check: '+m.bGoal,m.bOld);
    await list();return {a,b,e,recovery,source,returned:returned.item};
  })()`);
  const select=async(page,id)=>{await page.eval(`openWork(${JSON.stringify(id)})`);await settled(page);await wait(()=>page.eval('saved?.work_id==='+JSON.stringify(id)),'consumer opened');};
  const button=async(page,label,selector='#exchange-list')=>{await page.eval(`(()=>{const b=[...document.querySelectorAll(${JSON.stringify(selector+' button')})].find(b=>b.textContent===${JSON.stringify(label)});if(!b)throw Error('missing button');b.click();})()`);await settled(page);};
  await select(c,seed.a.work_id);await button(c,'Reconsider current use');
  await wait(()=>c.eval("!$('reassessment-panel').hidden"),'consumer inspector');
  const baseline=await c.eval("$('reassessment-basis').innerText");assert(baseline.includes(seed.a.fingerprint));assert(baseline.includes('Old request basis'));
  await click(c,'reassessment-list');await settled(c);await set(c,'reassessment-work',seed.e.work_id);await click(c,'reassessment-files');await settled(c);
  const pick=await c.eval("[...$('reassessment-evidence').options].find(o=>o.textContent.includes('README.md')).value");
  await set(c,'reassessment-evidence',pick);await click(c,'reassessment-inspect');await settled(c);
  const noSave=await c.eval('saved');assert.equal(noSave.fingerprint,seed.a.fingerprint);
  await button(c,'Read text','#reassessment-selected');
  let selectedText=await c.eval("$('reassessment-selected').querySelector('pre').textContent");
  while(await c.eval("[...$('reassessment-selected').querySelectorAll('button')].some(b=>b.textContent==='Continue reading'&&!b.disabled)")){
    await button(c,'Continue reading','#reassessment-selected');selectedText+=await c.eval("$('reassessment-selected').querySelector('pre').textContent");
  }
  assert.equal(selectedText,material.new,'browser reads every exact selected byte');
  for(const [id,v] of Object.entries({'reassessment-decision':'updated','reassessment-context':material.aContext,'reassessment-reason':material.aReason,'reassessment-limits':'Source acceptance is not deployment or access authority.','reassessment-checks':'Read the pinned selected source and exact earlier output.','reassessment-next':material.next,'reassessment-name':'choice.md','reassessment-text':material.aNew}))await set(c,id,v);
  await click(c,'reassessment-preview-button');await settled(c);assert.equal(await c.eval("$('reassessment-save').hidden"),false);
  await c.send('Page.bringToFront');
  for(const width of [390,768,1200]){
    await c.send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<500});
    await c.eval('new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok)))');
    const layout=await c.eval("({width:innerWidth,scroll:document.documentElement.scrollWidth,x:scrollX,overflow:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right+scrollX>innerWidth+1||e.scrollWidth>e.clientWidth+1).map(e=>({tag:e.tagName,id:e.id,cls:e.className,right:e.getBoundingClientRect().right,scroll:e.scrollWidth,client:e.clientWidth})).slice(0,25)})");
    assert(layout.scroll<=layout.width,'consumer overflow '+width+' '+JSON.stringify(layout));
  }
  const p=await c.eval('reassessmentPrepared');
  const lost=await barrier(c,'/reassessment-save');await click(c,'reassessment-save');await lost.wait();await lost.release('disconnect');
  assert.equal(await c.eval('reassessmentRows.length'),1);
  await navigate(c,origin+'/');await select(c,seed.a.work_id);
  assert.equal(await c.eval('reassessmentRows.length'),1,'fresh entry retains exact operation');
  await click(c,'reassessment-check');await settled(c);
  const savedA=await c.eval('saved');assert.equal(savedA.return_reassessment.decision,'updated');assert.equal(savedA.files[1].digest,p.payload.return_reassessment.output.digest);
  assert.deepEqual(savedA.files[0],seed.a.files[0]);assert.deepEqual(savedA.sources,seed.a.sources);
  assert.equal(await c.eval('reassessmentRows.length'),0);
  const folder=path.join(root,'consumer-client');await mkdir(folder,{recursive:true,mode:0o700});
  const aSetup=path.join(folder,'a.json'),bSetup=path.join(folder,'b.json'),eSetup=path.join(folder,'e.json');
  async function cli(label,args){let stdout='',stderr='';const r=await runCanonicalChild({suite:'web-planning-browser',label:'consumer-'+label,command:process.execPath,args:['apps/augnes_apps/scripts/file-exchange.mjs',...args],cwd:process.cwd(),env,timeoutMs:15000,stdout:{write:b=>stdout+=b},stderr:{write:b=>stderr+=b}});assert.equal(canonicalChildAcceptanceFailure(r,{requireNaturalExit:true}),null,stderr);return JSON.parse(stdout);}
  await cli('select-a',['select',material.aGoal,aSetup]);await cli('select-b',['select',material.bGoal,bSetup]);await cli('select-e',['select',material.evidenceGoal,eSetup]);
  const obs=path.join(folder,'b-observed.json'),choice=path.join(folder,'b-choice.json'),pending=path.join(folder,'b-pending.json');
  const bView=await cli('read-b-basis',[bSetup,'inspect-use',String(seed.b.revision),eSetup,String(seed.e.revision),'README.md','file',obs]);assert.equal(bView.original_use.destination.fingerprint,seed.b.fingerprint);
  assert.equal((await cli('read-b-output',[bSetup,'read-saved',String(seed.b.revision),'choice.md'])).text,material.bOld);
  assert.equal((await cli('read-b-evidence',[eSetup,'read-saved',String(seed.e.revision),'README.md'])).text,material.new);
  let oldText='',offset=0;
  do{const page=await cli('read-b-origin',[bSetup,'read-origin',String(seed.b.revision),String(offset)]);oldText+=page.text;offset=page.next;}while(offset!==null);
  assert.equal(oldText,material.old);
  await writeFile(choice,JSON.stringify({decision:'retained',context:material.bContext,rationale:material.bReason,limits:'No production operation authorized.',next_action:material.next}),{mode:0o600});
  await cli('prepare-b',[bSetup,'prepare-reassessment',obs,choice,pending]);const bSaved=await cli('save-b',[bSetup,'commit-reassessment',pending]);
  assert.deepEqual(bSaved.saved.files,seed.b.files);assert.equal((await cli('replay-b',[bSetup,'commit-reassessment',pending])).saved.fingerprint,bSaved.saved.fingerprint);
  // A fresh process receives only task setup and desired next-artifact name.
  // It reads the current decision and verified selected output through normal
  // production client entry, then saves a useful preparation artifact.
  const followup=path.join(folder,'followup.mjs');
  await writeFile(followup,`import {openFileTask} from ${JSON.stringify(new URL('../apps/augnes_apps/scripts/web-file-client.mjs',import.meta.url).href)};
import {planningDraft} from ${JSON.stringify(new URL('../apps/augnes_apps/scripts/planning-notes.mjs',import.meta.url).href)};
const c=await openFileTask(process.argv[2]),v=await c.list(),d=v.decisions.find(d=>d.current?.judgment),j=d.current.judgment;
if(!j||d.current.status!=='selected')throw Error('current decision unavailable');
const r=await c.planning.current(),output=await c.savedFile(r.revision,d.current.output.name);
const text='# Next preparation\\n\\n'+j.context+'\\n\\nSelected output:\\n'+output.text+'\\n\\nLimits: '+j.limits+'\\nNext: '+j.next_action+'\\nEvidence: '+JSON.stringify(j.evidence)+'\\n';
const draft=planningDraft(r);draft.files.push({name:process.argv[3],role:'report',data:Buffer.from(text).toString('base64')});
const p=await c.planning.prepare({revision:r.revision,fingerprint:r.fingerprint},draft),saved=await c.planning.save(p);
const read=await c.savedFile(saved.saved.revision,process.argv[3]);if(read.text!==text)throw Error('followup readback');console.log(JSON.stringify({saved:saved.saved,text:read.text,source_current:j.revision}));`,{mode:0o600});
  async function freshExecutor(setup,name){let stdout='',stderr='';const r=await runCanonicalChild({suite:'web-planning-browser',label:'fresh-consumer-'+name,command:process.execPath,args:[followup,setup,name],cwd:process.cwd(),env,timeoutMs:15000,stdout:{write:b=>stdout+=b},stderr:{write:b=>stderr+=b}});assert.equal(canonicalChildAcceptanceFailure(r,{requireNaturalExit:true}),null,stderr);return JSON.parse(stdout);}
  const nextA=await freshExecutor(aSetup,'next-handoff.md'),nextB=await freshExecutor(bSetup,'readiness-next.md');
  assert(nextA.text.includes(material.aNew));assert(nextB.text.includes(material.bOld));assert(nextB.text.includes(material.bContext));
  await navigate(fresh,origin+'/');await select(fresh,seed.a.work_id);
  const shown=await fresh.eval("$('exchange-list').innerText");assert(shown.includes(material.aContext));assert(shown.includes('Historical use:'));assert(shown.includes('Current output: choice.md'));
  await click(fresh,'saved-context');await settled(fresh);assert((await fresh.eval("$('context-view').innerText")).includes(material.aContext));
  // Two tabs retain distinct operations in the real browser journal. A late
  // acknowledgement for one body must leave the other body intact.
  await c.eval(`openWork(${JSON.stringify(seed.recovery.work_id)})`);await settled(c);
  const pendingPair=await c.eval(`(async()=>{const view=await api('/api/work/'+work+'/inspect-use',{use:${JSON.stringify({work_id:seed.recovery.work_id,revision:seed.recovery.revision,fingerprint:seed.recovery.fingerprint})},evidence:JSON.parse(${JSON.stringify(pick)})});
    const intent={selection:view.selection,decision:'deferred',rationale:'Wait for operational observation.',limits:'No activation',reported_check:'',context:'Pending operational observation',next_action:'Obtain authorized operational evidence.',name:null,text:null};
    return [await api('/api/work/'+work+'/reassessment-preview',{intent}),await api('/api/work/'+work+'/reassessment-preview',{intent:{...intent,context:'Separate pending review'}})];})()`);
  const [first,second]=pendingPair;
  await c.eval(`(async()=>{const p=${JSON.stringify(first)};chooseReassessment(await reassessmentJournal(p.work_id,'put',p),p.request_key);})()`);
  await fresh.eval(`reassessmentJournal(${JSON.stringify(second.work_id)},'put',${JSON.stringify(second)})`);
  await c.eval(`(async()=>{const p=${JSON.stringify(first)};await finishReassessment(p,await api('/api/work/'+p.work_id+'/reassessment-save',{ticket:p.ticket,intent:p.intent}));})()`);
  assert.deepEqual(await c.eval('reassessmentRows.map(p=>p.request_key)'),[second.request_key]);
  await set(c,'reassessment-pending',second.request_key);await c.eval("$('reassessment-pending').dispatchEvent(new Event('change'))");
  await click(c,'reassessment-check');await settled(c);assert.equal(await c.eval("$('reassessment-release').hidden"),false);
  await click(c,'reassessment-release');await settled(c);assert.equal(await c.eval('reassessmentRows.length'),0);
  checks.push('Consumer reassessment: browser exact comparison/update and lost-ack recovery, independent authenticated CLI retention, fresh saved-state follow-up, responsive entry and operation-specific late acknowledgement');
  console.log(JSON.stringify({consumer_browser_outputs:{material,old_a:seed.a.return_use,updated_a:savedA.return_reassessment,retained_b:bSaved.saved.return_reassessment,next_a:nextA,next_b:nextB,controlled_authentication:true,hosted_adoption:false,separate_task_method_reuse:false}}));
  return {seed,savedA,savedB:bSaved.saved,nextA,nextB};
}
