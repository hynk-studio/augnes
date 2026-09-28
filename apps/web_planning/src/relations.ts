import { binding, boundedText, canonical, dispositions, exact, fail, hash, headBinding, makeRevision, MAX_REVISIONS, normalizePayload, reference, requestFingerprint, sameBinding, selectedWorkSourceInput, UUID, validateRelations, workRef, type Material, type Payload, type Relations, type Revision, type Scope, type WorkRef } from "./contract";
import { seal, unseal, type Access } from "./access";
import { append, headsCurrent, readWork, requestRevision, type Store } from "./store";

export function relationsOf(r:Revision):Relations {
  return r.relations ?? {origin:null,materials:r.sources.map(s=>({source_ref:s.source_ref!,kind:"authored",from:null,dependencies:[]})),review:null};
}
// Ordinary edits use the existing normalizer. The client supplies dependency
// positions, never canonical source entries or cross-work provenance claims.
export function editedPayload(scope:Scope,payload:Payload,notes:any[],edits:unknown,previous?:Revision):Payload {
  if (edits===undefined && !previous?.relations) return payload;
  if (edits!==undefined && (!Array.isArray(edits) || edits.length!==notes.length)) fail("invalid_material_edits");
  const prior=previous?relationsOf(previous):{origin:null,materials:[],review:null};
  const refs=notes.map(n=>normalizePayload(scope,payload.definition,[n]).sources[0].source_ref!);
  const materials=new Map<string,Material>();
  refs.forEach((ref,index)=>{
    const retained=prior.materials.find(m=>m.source_ref===ref);
    const edit=edits===undefined?null:(edits as any[])[index];
    if(edit!==null)exact(edit,"dependencies,adapts");
    if(edit && (!Array.isArray(edit.dependencies) || edit.dependencies.length>7 || edit.dependencies.some((i:unknown)=>!Number.isInteger(i) || Number(i)<0 || Number(i)>=refs.length)))fail("invalid_dependencies");
    const deps=edit?[...new Set<string>(edit.dependencies.map((i:number)=>refs[i]))].sort():retained?.dependencies??[];
    let material:Material;
    if(retained && canonical(deps)===canonical([...retained.dependencies].sort()) && (edit===null || edit.adapts===null)) material=retained;
    else if(edit?.adapts!==null && edit?.adapts!==undefined) {
      if(!previous || !previous.sources.some(s=>s.source_ref===edit.adapts))fail("invalid_adaptation_source");
      material={source_ref:ref,kind:"adapted",from:{...reference(previous),source_ref:edit.adapts},dependencies:deps};
    } else {
      if(retained && retained.kind!=="authored")fail("inherited_dependencies_changed");
      material={source_ref:ref,kind:"authored",from:null,dependencies:deps};
    }
    if(materials.has(ref) && canonical(materials.get(ref))!==canonical(material))fail("duplicate_material_conflict");
    materials.set(ref,material);
  });
  const result={...payload,relations:{...prior,materials:payload.sources.map(s=>materials.get(s.source_ref!)!)}};
  validateRelations(result.relations,result,previous?.work_id??"new");
  return result;
}
async function current(s:Store,ref:WorkRef):Promise<Revision[]> {
  const chain=await readWork(s,ref.work_id);
  if(!chain.length)fail("work_not_found",404);
  if(!sameBinding(headBinding(chain.at(-1)),{revision:ref.revision,fingerprint:ref.fingerprint}))fail("refresh_required",409);
  return chain;
}
function sourceRef(value:unknown):WorkRef { return workRef(value); }
export async function compare(s:Store,id:string,expected:unknown,source:unknown) {
  const targetBinding=binding(expected);
  if(!targetBinding.fingerprint)fail("invalid_binding");
  const targetChain=await current(s,{work_id:id,revision:targetBinding.revision,fingerprint:targetBinding.fingerprint});
  const sourceChain=await current(s,sourceRef(source));
  const target=targetChain.at(-1)!,branch=sourceChain.at(-1)!,origin=branch.relations?.origin;
  if(!origin || origin.source.work_id!==id || branch.work_id===id)fail("not_a_branch_of_target");
  const baseline=targetChain.find(r=>canonical(reference(r))===canonical(origin.source));
  if(!baseline)fail("origin_unavailable",409);
  if(!await headsCurrent(s,reference(target),reference(branch)))fail("refresh_required",409);
  return {target,branch,baseline};
}
function branchIntent(input:any) { exact(input,"reason"); return {reason:boundedText(input.reason,true)}; }
function incorporationIntent(input:any) {
  exact(input,"source,dispositions,rationale,next_question");
  return {source:sourceRef(input.source),dispositions:dispositions(input.dispositions),rationale:boundedText(input.rationale,true),next_question:boundedText(input.next_question)};
}
function branchPayload(source:Revision,reason:string):Payload {
  return {definition:source.definition,sources:source.sources,relations:{
    origin:{source:reference(source),reason,selection:source.sources.map(s=>s.source_ref!),starting_review:source.relations?.review??source.relations?.origin?.starting_review??null},
    materials:relationsOf(source).materials.map(m=>({...m,kind:"inherited",from:{...reference(source),source_ref:m.source_ref}})),review:null}};
}
function incorporationPayload(target:Revision,source:Revision,intent:ReturnType<typeof incorporationIntent>):Payload {
  if(canonical(intent.dispositions.map(d=>d.source_ref).sort())!==canonical(source.sources.map(s=>s.source_ref).sort()))fail("incomplete_dispositions");
  const selected=intent.dispositions.filter(d=>d.disposition==="incorporated").map(d=>d.source_ref);
  const entries=new Map(target.sources.map(s=>[s.source_ref,s]));
  const materials=new Map(relationsOf(target).materials.map(m=>[m.source_ref,m]));
  for(const ref of selected) {
    entries.set(ref,source.sources.find(s=>s.source_ref===ref)!);
    const m=relationsOf(source).materials.find(m=>m.source_ref===ref)!;
    materials.set(ref,{...m,kind:"incorporated",from:{...reference(source),source_ref:ref}});
  }
  const payload=normalizePayload(target,target.definition,[...entries.values()].map(selectedWorkSourceInput));
  const relations:Relations={...relationsOf(target),materials:payload.sources.map(s=>materials.get(s.source_ref!)!),review:{source:reference(source),target:reference(target),dispositions:intent.dispositions,rationale:intent.rationale,next_question:intent.next_question}};
  validateRelations(relations,payload,target.work_id); // all represented dependencies must remain selected
  // Repeating the same comparison choices is not another judgment or revision.
  const prior=target.relations?.review;
  if(prior && canonical({...prior,target:relations.review!.target})===canonical(relations.review))relations.review=prior;
  return {...payload,relations};
}
interface OperationTicket {
  kind:"branch"|"incorporate"; workspace_id:string; project_id:string; author_ref:string;
  work_id:string; request_key:string; expected:ReturnType<typeof binding>; source:WorkRef;
  intent_fingerprint:string; request_fingerprint:string; expires:number;
}
function operationTicket(a:Access,value:unknown,id:string,allowExpired:boolean):OperationTicket {
  const t=unseal(a,value);
  exact(t,"kind,workspace_id,project_id,author_ref,work_id,request_key,expected,source,intent_fingerprint,request_fingerprint,expires");
  if(!["branch","incorporate"].includes(t.kind) || t.work_id!==id || !UUID.test(id) || !UUID.test(t.request_key) || t.workspace_id!==a.workspace_id || t.project_id!==a.project_id || t.author_ref!==a.author_ref || !Number.isSafeInteger(t.expires))fail("invalid_request_binding",403);
  binding(t.expected);workRef(t.source);
  if(!allowExpired && t.expires<Date.now())fail("save_ticket_expired",409);
  return t as OperationTicket;
}
export async function previewOperation(a:Access,id:string,kind:"branch"|"incorporate",expected:unknown,input:unknown) {
  let source:Revision,payload:Payload,target:Revision|undefined,work_id=id;
  const intent=kind==="branch"?branchIntent(input):incorporationIntent(input);
  if(kind==="branch") {
    const b=binding(expected);if(!b.fingerprint)fail("invalid_binding");
    source=(await current(a,{work_id:id,revision:b.revision,fingerprint:b.fingerprint})).at(-1)!;
    payload=branchPayload(source,(intent as ReturnType<typeof branchIntent>).reason);work_id=crypto.randomUUID();
  } else {
    const result=await compare(a,id,expected,(intent as ReturnType<typeof incorporationIntent>).source);
    source=result.branch;target=result.target;payload=incorporationPayload(target,source,intent as ReturnType<typeof incorporationIntent>);
  }
  const t:OperationTicket={kind,workspace_id:a.workspace_id,project_id:a.project_id,author_ref:a.author_ref,work_id,request_key:crypto.randomUUID(),expected:headBinding(target),source:reference(source),intent_fingerprint:hash(canonical(intent)),request_fingerprint:"",expires:Date.now()+86_400_000};
  t.request_fingerprint=requestFingerprint(a,work_id,t.expected,t.request_key,payload);
  return {work_id,ticket:seal(a,t),intent,payload,target:target??null,source,noop:!!target && canonical(payload)===canonical({definition:target.definition,sources:target.sources,relations:target.relations})};
}
export async function saveOperation(a:Access,id:string,value:unknown,input:unknown,resolve=false) {
  const t=operationTicket(a,value,id,resolve);
  const intent=t.kind==="branch"?branchIntent(input):incorporationIntent(input);
  if(hash(canonical(intent))!==t.intent_fingerprint)fail("altered_replay",409);
  const chain=await readWork(a,id),prior=await requestRevision(a,t.request_key);
  if(prior && (prior.work_id!==id || prior.request_fingerprint!==t.request_fingerprint))fail("altered_replay",409);
  const saved=chain.find(r=>r.request_key===t.request_key);
  if(saved) {
    if(saved.request_fingerprint!==t.request_fingerprint)fail("altered_replay",409);
    return {outcome:"saved",saved,head:headBinding(chain.at(-1)),replayed:true};
  }
  if(resolve) {
    // A genuine no-op has no request row. It can acknowledge existing material
    // only while the exact reviewed source and target are still current.
    if(t.kind==="incorporate" && sameBinding(headBinding(chain.at(-1)),t.expected)) {
      try {
        const {target,branch}=await compare(a,id,t.expected,t.source);
        const payload=incorporationPayload(target,branch,intent as ReturnType<typeof incorporationIntent>);
        if(requestFingerprint(a,id,t.expected,t.request_key,payload)===t.request_fingerprint &&
          canonical(payload)===canonical({definition:target.definition,sources:target.sources,relations:target.relations}) &&
          await headsCurrent(a,reference(target),t.source)) return {outcome:"saved",saved:target,head:headBinding(target),noop:true};
      } catch { /* Unavailable currentness does not establish the outcome. */ }
    }
    return {outcome:"unknown",saved:null,head:headBinding(chain.at(-1))};
  }
  if(!sameBinding(headBinding(chain.at(-1)),t.expected))fail("refresh_required",409);
  let payload:Payload;
  if(t.kind==="branch") {
    const source=(await current(a,t.source)).at(-1)!;
    payload=branchPayload(source,(intent as ReturnType<typeof branchIntent>).reason);
  } else {
    const {target,branch}=await compare(a,id,t.expected,t.source);
    payload=incorporationPayload(target,branch,intent as ReturnType<typeof incorporationIntent>);
  }
  if(requestFingerprint(a,id,t.expected,t.request_key,payload)!==t.request_fingerprint)fail("preview_changed",409);
  const target=chain.at(-1);
  if(target && canonical(payload)===canonical({definition:target.definition,sources:target.sources,relations:target.relations})) {
    if(!await headsCurrent(a,reference(target),t.source))fail("refresh_required",409);
    return {outcome:"saved",saved:target,head:headBinding(target),noop:true};
  }
  if(t.expected.revision===MAX_REVISIONS)fail("history_capacity",409);
  await append(a,makeRevision(a,id,t.expected,t.request_key,payload,new Date().toISOString()),t.source);
  const after=await readWork(a,id),result=after.find(r=>r.request_key===t.request_key);
  if(!result)fail("refresh_required",409);
  if(result.request_fingerprint!==t.request_fingerprint)fail("altered_replay",409);
  return {outcome:"saved",saved:result,head:headBinding(after.at(-1)),replayed:false};
}
// At most two direct referenced works; never recursively fetch material ancestry.
// Missing origins are disclosure, not a prerequisite to reading an independent work.
export async function referenceAvailability(a:Store,r:Revision):Promise<{availability:Record<string,string>;reviewSource:Revision|undefined}> {
  const refs=[r.relations?.origin?.source,r.relations?.review?.source].filter(Boolean) as WorkRef[];
  const result:Record<string,string>={};
  let reviewSource:Revision|undefined;
  for(const ref of refs) {
    try {const chain=await readWork(a,ref.work_id);
      if(ref.fingerprint===r.relations?.review?.source.fingerprint)reviewSource=chain.find(v=>canonical(reference(v))===canonical(ref));
      result[ref.fingerprint]=chain.some(v=>canonical(reference(v))===canonical(ref))?(chain.at(-1)!.fingerprint===ref.fingerprint?"Exact saved revision available; source truth remains unverified.":"Saved source revision available; that work has newer material. No automatic update."):"Origin unavailable or unverified; this independently saved work remains readable.";
    } catch {result[ref.fingerprint]="Origin unavailable or unverified; this independently saved work remains readable.";}
  }
  return {availability:result,reviewSource};
}
