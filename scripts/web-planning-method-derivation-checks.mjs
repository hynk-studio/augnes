import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonical, headBinding, reference } from '../apps/web_planning/src/contract.ts';
import { planningDraft } from '../apps/augnes_apps/scripts/planning-notes.mjs';
import { digest, openFileTask } from '../apps/augnes_apps/scripts/web-file-client.mjs';
import { runCanonicalChild, canonicalChildAcceptanceFailure } from './canonical-child-runner.mjs';

const route=(r,suffix='')=>'/api/work/'+r.work_id+(suffix?'/'+suffix:'');
const upload=(name,text)=>({name,media_type:'text/plain',bytes:Buffer.byteLength(text),digest:digest(Buffer.from(text)),data:Buffer.from(text).toString('base64')});
const savedFile=(name,text,role='results')=>({name,role,data:Buffer.from(text).toString('base64')});
const method=`// Controlled fixture: whole-unit batching, no imports or external effects.
export function batch(units, packSize) {
  if (!Number.isSafeInteger(units) || units < 0 || units > 1000 ||
      !Number.isSafeInteger(packSize) || packSize < 1 || packSize > 100) throw Error('inapplicable_units');
  const batches = Math.ceil(units / packSize), packed = batches * packSize;
  return { units, pack_size: packSize, batches, packed, spare: packed - units };
}
`;
const conditions=`Permitted use: B may retain, use and adapt these selected files for its own meal-service tasks. No return to A is required.
Inputs: whole indivisible units, integer demand 0..1000, integer pack size 1..100; output: minimum whole packs, packed units and spare units. Confirm the current pack size and count every reserve unit explicitly. Fractional demand, stock limits, cost and delivery timing are outside this method.
A reported a 7-unit workshop-kit check with packs of 4: 2 packs, 8 units, 1 spare. This is inherited evidence, not B's performance or independent corroboration.
Keep original file identities and this disclosure's source revision. Recheck changes through the original request when access permits; unavailable access is not evidence of unchanged conditions.
Source-access expiry or revocation ends new reads, not the saved-use permission stated here. No private customer data, credentials, budget, payment, live access, obligation or execution authority is transferred.
`;
const adaptation=`
// B's adaptation counts a separately confirmed reserve before batching.
export function withReserve(units, packSize, reserveUnits) {
  if (!Number.isSafeInteger(reserveUnits) || reserveUnits < 0) throw Error('inapplicable_reserve');
  return { ...batch(units + reserveUnits, packSize), requested: units, reserve_units: reserveUnits };
}
`;
const note=(text,source)=>({text,source,observed_at:null,provenance:'derived_interpretation',label:'Next check'});
function addNote(draft,value){draft.notes.push(value);draft.material_edits.push({adapts:null,dependencies:[]});}
// Only these explicitly authored synthetic bytes are executed by the fixture.
// The product never evaluates or auto-runs a retained attachment.
async function fixtureMethod(text,adapted=false){
  assert.equal(text,method+(adapted?adaptation:''),'fixture execution requires the exact reviewed synthetic method');
  return import('data:text/javascript;base64,'+Buffer.from(text).toString('base64'));
}
function checkedResult(result,units,size){
  assert.equal(result.units,units);assert.equal(result.pack_size,size);
  assert.equal(result.packed,result.batches*size);
  assert(result.packed>=units && result.packed-units<size);
  assert.equal(result.spare,result.packed-units);
}
async function saveDraft(client,current,draft){
  const prepared=await client.planning.prepare(headBinding(current),draft);
  const result=await client.planning.save(prepared);assert.equal(result.outcome,'saved');return result.saved;
}
async function readRetainedMethod(client){
  const origin=await client.planning.retainedSource();
  assert.equal(origin.source_access,'not_checked');assert(origin.retained);
  const files=[];
  for(const selected of origin.retained.disclosure.files){
    const stored=await client.savedFile(origin.retained.saved.revision,selected.original.file.name);
    assert.deepEqual(stored.file,selected.original.file);files.push(stored);
  }
  const source=files.find(f=>f.file.name==='batching.mjs'),terms=files.find(f=>f.file.name==='conditions.md');
  assert.equal(terms.text,conditions);assert.equal(source.file.digest,digest(Buffer.from(method)));
  const inherited=JSON.parse(files.find(f=>f.file.name==='a-reported-result.json').text);
  assert.equal(inherited.attribution,'A reported workshop-kit result; inherited by B');
  return {origin,source,inherited};
}

// A new process receives only B's task setup and its new authorized demand.
// It retrieves its purpose, prior result, inherited method and conditions itself.
async function freshExecutor(setupPath,inputPath){
  const client=await openFileTask(setupPath),current=await client.planning.current();
  const {origin,source,inherited}=await readRetainedMethod(client);
  assert.equal(current.sources.some(s=>s.trust_class==='imported_unverified'),false);
  assert.match(current.definition.goal,/meal/);
  const prior=JSON.parse((await client.savedFile(current.revision,'b-initial-result.json')).text);
  assert.equal(prior.consumer,'Evening meal desk');assert.equal(prior.result.batches,7);
  const demand=JSON.parse(await readFile(inputPath,'utf8'));
  assert.deepEqual(demand,{consumer:'Food bank pickup',units:37,pack_size:5,reserve_units:3});
  const adapted=source.text+adaptation,result=(await fixtureMethod(adapted,true)).withReserve(demand.units,demand.pack_size,demand.reserve_units);
  checkedResult(result,40,5);assert.equal(result.batches,8);
  const draft=planningDraft(current);
  draft.definition.success_criteria=['Prepare 8 packs of 5 for the food bank pickup, including 3 confirmed reserve meals.'];
  addNote(draft,note('Adapt the retained batching method for a separately confirmed 3-meal reserve and packs of 5. A\'s workshop result remains inherited; B checked its own 40-unit total. Saved-use permission remains available; current source access is not established by these bytes.',source.file.digest));
  addNote(draft,note('Actual result: 8 packs, 40 meals, 0 spare after the reserve. Next: label the 3 reserve meals separately; no purchase, contact or external execution was performed.','B controlled computation for Food bank pickup'));
  draft.files.push(savedFile('reserve-batching.mjs',adapted,'source'),savedFile('b-reserve-input.json',JSON.stringify(demand),'source'),
    savedFile('b-reserve-result.json',JSON.stringify({consumer:demand.consumer,result,method:source.file.digest,source:origin.retained.saved,attribution:'B observed controlled result; not A inherited evidence'})));
  const saved=await saveDraft(client,current,draft);
  assert.deepEqual(await client.planning.retainedSource(),origin);
  process.stdout.write(JSON.stringify({saved:reference(saved),result,source:origin.retained.saved,inherited_belongs_to:'A',live_source_access:'not_checked',external_effects:0}));
}

export async function checkSelectedMethodDerivation({start,root,passed}){
  const {projectSession:session,projectOk:ok,projectAgentSession:agent,projectBindings}=await import('./web-planning-project-checks.mjs');
  const s=await start('selected-method-derivation',{bindings:projectBindings()});
  const project=(name,purpose)=>({request_key:randomUUID(),name,purpose,judgment:{text:'Keep direct results separate from inherited observations.',source:'Synthetic project commission'},unfinished:'Check the selected method against this project\'s own inputs.',next_action:'Read conditions before performing the authorized local computation.'});
  const aCreated=await ok(await session(s,'A'),'/api/projects',project('Workshop kit owner','Pack A workshop kits; A_PRIVATE_CUSTOMER stays private.'));
  const bCreated=await ok(await session(s,'B'),'/api/projects',project('Independent meal service','Plan meal packs for independently chosen consumers.'));
  const a=aCreated.project,b=bCreated.project,owner=await session(s,'A',a),own=await session(s,'B',b);
  assert.notEqual(a.project_id,b.project_id);assert.notEqual(a.author_ref,b.author_ref);
  const aResult=(await fixtureMethod(method)).batch(7,4);checkedResult(aResult,7,4);
  const originalResult=JSON.stringify({result:aResult,attribution:'A reported workshop-kit result; inherited by B'});
  const privateText='A_PRIVATE_CUSTOMER A_CREDENTIAL_SENTINEL A_LIVE_BUDGET_SENTINEL';
  const event=await ok(owner,route(aCreated.saved,'exchanges/save'),{kind:'request',basis:null,expected:headBinding(aCreated.saved),request_key:randomUUID(),
    message:'A_PRIVATE_REQUEST',next_action:'A_PRIVATE_OBLIGATION',files:[upload('batching.mjs',method),upload('conditions.md',conditions),upload('a-reported-result.json',originalResult),upload('private.txt',privateText)]});
  const grant=await ok(owner,route(aCreated.saved,'participation/create'),{grant_id:randomUUID(),request:event.item.ref,expected:event.head,recipient:s.env.LOCAL_PARTICIPANT_LOGIN,
    brief:'Selected batching method for B\'s independently owned meal service. Read conditions.md and keep A\'s result attributed as inherited evidence.',
    next_action:'B may retain/use/adapt these three files for its own consumers under conditions.md. No return, credentials, budget or live authority transfers.',indices:[0,1,2],expires:Date.now()+3600000});
  const participant=await session(s,'B',a,'/participate/'+grant.id),prefix='/api/participation/'+grant.id;
  const exposed=await ok(participant,prefix);
  assert.equal(exposed.items[0].files.length,3);assert(!JSON.stringify(exposed).includes('A_PRIVATE'));
  const dir=path.join(root,'method-derivation-clients');await mkdir(dir,{recursive:true});
  const participantSetup=path.join(dir,'participant.json');await writeFile(participantSetup,JSON.stringify(await ok(participant,prefix+'/setup')));
  let kept;
  await agent(s,'B',async()=>{
    const client=await openFileTask(participantSetup);
    await assert.rejects(client.planning.retainedSource(),/Open the destination task/);
    kept=(await client.cooperation.retain({destination_project_id:b.project_id,request_key:randomUUID(),indices:[0,1,2],
      title:'Prepare meal packs for B\'s evening consumer',next_action:'Check the permitted method and compute our own meal result.',confirm:'retain-selected-request'})).saved;
  });
  assert.equal(kept.project_id,b.project_id);assert.equal(kept.author_ref,b.author_ref);
  assert.equal(kept.contribution_request.project_id,a.project_id);assert.equal(kept.relations?.origin??null,null);
  const taskSetup=path.join(dir,'b-task.json');await writeFile(taskSetup,JSON.stringify({format:'augnes_web_file_task.v1',origin:s.origin,...b,work_id:kept.work_id}));
  const independentSetup=path.join(dir,'b-independent-task.json'),wrongSetup=path.join(dir,'wrong-source-task.json');
  await writeFile(independentSetup,JSON.stringify({format:'augnes_web_file_task.v1',origin:s.origin,...b,work_id:bCreated.saved.work_id}));
  await writeFile(wrongSetup,JSON.stringify({format:'augnes_web_file_task.v1',origin:s.origin,...b,work_id:aCreated.saved.work_id}));
  let made,trimmed,origin;
  await agent(s,'B',async()=>{
    assert.deepEqual(await (await openFileTask(independentSetup)).planning.retainedSource(),{retained:null,source_access:'not_checked'});
    await assert.rejects((await openFileTask(wrongSetup)).planning.retainedSource(),/work_not_found/);
    const client=await openFileTask(taskSetup),retained=await readRetainedMethod(client);origin=retained.origin;
    const demand={consumer:'Evening meal desk',units:37,pack_size:6},result=(await fixtureMethod(retained.source.text)).batch(demand.units,demand.pack_size);
    checkedResult(result,37,6);assert.deepEqual(result,{units:37,pack_size:6,batches:7,packed:42,spare:5});
    const draft=planningDraft(await client.planning.current());
    draft.definition={goal:'Prepare meal packs for B\'s evening consumer',success_criteria:['Prepare 7 packs of 6 for 37 meals; identify the 5 spare meals.'],non_goals:['No procurement, outreach or inherited budget; source outcomes are not B performance.']};
    addNote(draft,note('The integer method applies to B\'s 37-meal demand and independently confirmed pack size 6. A\'s 7-kit observation is inherited, not B\'s result. Count reserves separately if the consumer changes.',retained.source.file.digest));
    addNote(draft,note('Actual local computation: 7 packs, 42 meals, 5 spare. Next: confirm whether the next consumer requires an explicit reserve.','B controlled computation for Evening meal desk'));
    draft.files.push(savedFile('b-initial-input.json',JSON.stringify(demand),'source'),savedFile('b-initial-result.json',JSON.stringify({consumer:demand.consumer,result,attribution:'B observed controlled result; not A inherited evidence'})));
    made=await saveDraft(client,kept,draft);
    assert.deepEqual(await client.planning.retainedSource(),origin);
    // Normal authoring can deselect imported notes; the immutable disclosure
    // must still be available without inferring it from the latest selection.
    const fewer=planningDraft(made),indices=fewer.notes.map((n,i)=>n.provenance==='imported_unverified'?-1:i).filter(i=>i>=0);
    fewer.notes=indices.map(i=>fewer.notes[i]);fewer.material_edits=indices.map(i=>fewer.material_edits[i]);
    trimmed=await saveDraft(client,made,fewer);
    assert.equal(trimmed.sources.length,2);assert.deepEqual(await client.planning.retainedSource(),origin);
  });
  assert.deepEqual(origin.retained.saved,reference(kept));assert.deepEqual(origin.retained.disclosure,kept.contribution_request);
  passed('method derivation: independently owned A/B; only permitted method, conditions and inherited result retained; B computes and saves its own different-consumer output and judgment through ordinary writers');

  await ok(owner,route(aCreated.saved,'participation/revoke'),{grant_id:grant.id});
  assert.equal((await participant.request(prefix)).status,403);
  const newInput=path.join(dir,'new-demand.json');await writeFile(newInput,JSON.stringify({consumer:'Food bank pickup',units:37,pack_size:5,reserve_units:3}));
  let stdout='',stderr='';
  const child=await runCanonicalChild({suite:'web-planning',label:'fresh-method-executor',command:process.execPath,
    args:['--import','tsx',fileURLToPath(import.meta.url),'--fresh-executor',taskSetup,newInput],cwd:process.cwd(),timeoutMs:15000,
    env:{...process.env,AUGNES_WEB_ORIGIN:s.origin,AUGNES_WEB_PROJECT_ID:'',AUGNES_WEB_FIXTURE_COOKIE:'web_planning_local='+s.env.LOCAL_PARTICIPANT_SESSION},
    stdout:{write:value=>{stdout+=value;}},stderr:{write:value=>{stderr+=value;}}});
  assert.equal(canonicalChildAcceptanceFailure(child,{requireNaturalExit:true}),null,stderr);
  const continued=JSON.parse(stdout),fresh=await session(s,'B',b),head=(await ok(fresh,route(kept))).saved;
  assert.equal(head.revision,trimmed.revision+1);assert.deepEqual(reference(head),continued.saved);
  assert.equal(head.files.length,8);assert.equal(continued.result.batches,8);assert.deepEqual(continued.source,reference(kept));
  assert.equal((await participant.request(prefix)).status,403,'B computation must not restore access to A');
  await agent(s,'B',async()=>{
    const client=await openFileTask(taskSetup);assert.deepEqual(await client.planning.retainedSource(),origin);
    assert.equal((await client.savedFile(kept.revision,'batching.mjs')).text,method);
    assert.equal(JSON.parse((await client.savedFile(made.revision,'b-initial-result.json')).text).result.batches,7);
    assert.equal(JSON.parse((await client.savedFile(head.revision,'b-reserve-result.json')).text).result.batches,8);
  });
  const exported=await ok(fresh,route(kept,'export')),encoded=canonical(exported);
  assert.deepEqual(exported.revisions[0],kept);
  for(const secret of ['A_PRIVATE','A_CREDENTIAL_SENTINEL','A_LIVE_BUDGET_SENTINEL',s.env.REQUEST_SECRET,s.env.LOCAL_SESSION,s.env.LOCAL_PARTICIPANT_SESSION])
    assert.equal(encoded.includes(secret),false,'B export must not contain undisclosed source material or operational credentials');
  assert.equal((await own.request(route(aCreated.saved))).status,404);
  assert.equal(s.externalRequests(),0);
  passed('fresh method executor: new process retrieves B purpose, original conditions and prior results after imported notes are removed and A access is revoked; it executes and saves a reserve adaptation without source access or authority transfer');
}

if(process.argv[2]==='--fresh-executor')await freshExecutor(process.argv[3],process.argv[4]);
