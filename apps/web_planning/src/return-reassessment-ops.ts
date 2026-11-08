import { Buffer } from "node:buffer";
import { seal, unseal, type Access } from "./access";
import { binding, boundedText, canonical, exact, fail, FINGERPRINT, hash, headBinding, makeRevision, reference, requestFingerprint, sameBinding, UUID, workRef, type Payload, type Revision } from "./contract";
import { digestBytes, FILE_LIMIT, fileManifest, historyFiles, type FileBody } from "./files";
import { fileMaterials } from "./file-relations";
import { relationsOf } from "./relations";
import { decisionView, exactReturn } from "./return-use";
import { exchangeView } from "./exchange";
import { append, downloadFile, headsCurrent, readWork, type Store } from "./store";
import { SCENE_FILE } from "./scene-contract";
import { currentUse, equal, evidenceSelection, fileView, reassessmentRecord, selectedUse, type EvidenceSelection, type Reassessment } from "./return-reassessment";

const snapshot=(r:Revision)=>({ref:reference(r),definition:r.definition,notes:r.sources.map(s=>s.bounded_summary),files:(r.files??[]).map((_,i)=>fileView(r,i,false))});
async function evidence(s:Store,pick:EvidenceSelection,known?:Revision[]){
  const chain=known?.[0]?.work_id===pick.ref.work_id?known:await readWork(s,pick.ref.work_id),r=chain[pick.ref.revision-1];
  if(!r||!equal(reference(r),pick.ref)||(pick.kind==="return"&&r.exchange?.kind!=="return"))fail("selected_evidence_unavailable",409);
  const f=pick.kind==="return"?r.exchange!.artifacts[pick.index]?.file:r.files?.[pick.index];
  if(!f)fail("selected_evidence_unavailable",409);
  // Read the exact selected bytes through the production owner before sealing.
  await downloadFile(s,r,pick.index,pick.kind==="return");
  return {selection:{...pick,file:f,source_head:reference(chain.at(-1)!)},file:fileView(r,pick.index,pick.kind==="return"),basis:snapshot(r)};
}
export async function inspectUse(s:Store,id:string,input:Record<string,unknown>){
  exact(input,"workspace_id,project_id,use,evidence");const ref=workRef(input.use);
  if(ref.work_id!==id)fail("invalid_consumer_use");
  const chain=await readWork(s,id),use=selectedUse(chain,ref),head=chain.at(-1)!;
  let origin:unknown;
  try{const source=use.return_use!.returned.work_id===id?chain:await readWork(s,use.return_use!.returned.work_id);
    const o=exactReturn(source,use.return_use!.returned,use.return_use!.index);
    if(!equal(o.original,use.return_use!.original)||!equal(reference(o.request),use.return_use!.request)||
      !equal(reference(o.basis),use.return_use!.request_basis)||!equal(o.returned.exchange?.contributor??null,use.return_use!.contributor??null))fail("invalid_return_origin",409);
    origin={status:"available",basis:snapshot(o.basis),request:exchangeView(o.request),returned:exchangeView(o.returned)};
  }catch(e){origin={status:"unavailable",reason:(e as {code?:string}).code??"storage_unavailable"};}
  let selected:Awaited<ReturnType<typeof evidence>>|null=null,unavailable:unknown=null;
  if(input.evidence!==null){const pick=evidenceSelection(input.evidence);
    try{selected=await evidence(s,pick,chain);}catch(e){unavailable={selection:pick,status:"unavailable",reason:(e as {code?:string}).code??"storage_unavailable"};}}
  if(!await headsCurrent(s,reference(head),selected?.selection.source_head??reference(head)))fail("refresh_required",409);
  return {original_use:decisionView(use),origin,consumer:snapshot(head),current:currentUse(chain,use),evidence:selected??unavailable,
    selection:selected?{use:ref,consumer:reference(head),evidence:selected.selection}:null};
}
function intent(value:unknown){
  exact(value,"selection,decision,rationale,limits,reported_check,context,next_action,name,text");
  exact(value.selection,"use,consumer,evidence");workRef(value.selection.use);workRef(value.selection.consumer);
  return value;
}
async function compose(s:Store,id:string,chain:Revision[],input:ReturnType<typeof intent>){
  const head=chain.at(-1)!;if(!head||!equal(reference(head),input.selection.consumer)||input.selection.use.work_id!==id)fail("refresh_required",409);
  const use=selectedUse(chain,workRef(input.selection.use)),current=currentUse(chain,use);
  exact(input.selection.evidence,"ref,kind,index,file,source_head");
  const {file,source_head,...pick}=input.selection.evidence,observed=await evidence(s,evidenceSelection(pick),chain);
  if(!equal(observed.selection,input.selection.evidence))fail("evidence_conditions_changed",409);
  const record:Reassessment={use:reference(use),previous:current.judgment?.revision??null,evidence:observed.selection,
    decision:input.decision,rationale:boundedText(input.rationale,true),limits:boundedText(input.limits),reported_check:boundedText(input.reported_check),
    context:boundedText(input.context,true),next_action:boundedText(input.next_action,true),output:input.decision==="ended"?null:current.output};
  const bodies:FileBody[]=[];
  if(input.text!==null||input.name!==null){
    if(input.decision!=="updated"||typeof input.text!=="string"||!input.text.trim()||!input.text.isWellFormed()||Buffer.byteLength(input.text)>FILE_LIMIT)fail("invalid_reassessment_output");
    const bytes=Buffer.from(input.text,"utf8");record.output={name:input.name,role:use.return_use!.output!.role,bytes:bytes.length,digest:digestBytes(bytes)};
    fileManifest([record.output]);
    if(record.output.name===SCENE_FILE||(head.files??[]).some(f=>f.name===record.output!.name&&!equal(f,current.output)))fail("return_output_name_in_use",409);
    if(current.output?.digest===record.output.digest)fail("reassessment_update_unchanged");
    bodies.push({digest:record.output.digest,bytes:bytes.length,data:bytes.toString("base64")});
  }
  const changed=!equal(record.output,current.output);
  const files=(head.files??[]).filter(f=>!changed||!current.output||!equal(f,current.output));
  const materials=fileMaterials(head).filter(m=>!changed||!current.output||!equal(m.file,current.output));
  if(changed&&record.output){files.push(record.output);materials.push({file:record.output,kind:"authored",from:null});}
  const payload:Payload={definition:head.definition,sources:head.sources,files:fileManifest(files),relations:{...relationsOf(head),file_materials:materials}};
  payload.return_reassessment=reassessmentRecord(record,payload,id,chain);historyFiles([...chain,{...head,...payload}]);
  return {payload,bodies};
}
export async function previewReassessment(a:Access,id:string,value:unknown){
  const input=intent(value),chain=await readWork(a,id),{payload}=await compose(a,id,chain,input),expected=headBinding(chain.at(-1));
  const t={kind:"return-reassessment",workspace_id:a.workspace_id,project_id:a.project_id,author_ref:a.author_ref,work_id:id,
    request_key:crypto.randomUUID(),expected,source:payload.return_reassessment!.evidence.source_head,intent_fingerprint:hash(canonical(input)),
    request_fingerprint:"",expires:Date.now()+86_400_000};
  t.request_fingerprint=requestFingerprint(a,id,expected,t.request_key,payload);
  if(!await headsCurrent(a,reference(chain.at(-1)!),t.source))fail("refresh_required",409);
  return {work_id:id,request_key:t.request_key,expected,ticket:seal(a,t),intent:input,payload};
}
export async function saveReassessment(a:Access,id:string,value:unknown,input:unknown,resolve=false){
  const t=unseal(a,value);
  exact(t,"kind,workspace_id,project_id,author_ref,work_id,request_key,expected,source,intent_fingerprint,request_fingerprint,expires");
  if(t.kind!=="return-reassessment"||t.work_id!==id||t.workspace_id!==a.workspace_id||t.project_id!==a.project_id||t.author_ref!==a.author_ref||
    !UUID.test(t.request_key)||!Number.isSafeInteger(t.expires)||!FINGERPRINT.test(t.request_fingerprint)||!FINGERPRINT.test(t.intent_fingerprint))fail("invalid_request_binding",403);
  binding(t.expected);workRef(t.source);
  if(!resolve&&hash(canonical(intent(input)))!==t.intent_fingerprint)fail("altered_replay",409);
  let chain=await readWork(a,id);
  const found=()=>{const saved=chain.find(r=>r.request_key===t.request_key);
    if(saved&&(!saved.return_reassessment||saved.request_fingerprint!==t.request_fingerprint))fail("altered_replay",409);
    return saved?{outcome:"saved",saved,head:headBinding(chain.at(-1)),replayed:true}:null;};
  const replay=found();if(replay)return replay;
  if(resolve){
    // After a permanently stale CAS gate is observed, reread the operation:
    // a concurrent commit may have won before that gate changed.
    const current=await headsCurrent(a,{work_id:id,...t.expected},t.source);
    if(!current){chain=await readWork(a,id);const late=found();if(late)return late;}
    return {outcome:current?"unknown":"not_saved",saved:null,head:headBinding(chain.at(-1))};
  }
  if(t.expires<Date.now())fail("save_ticket_expired",409);
  if(!sameBinding(headBinding(chain.at(-1)),t.expected))fail("refresh_required",409);
  const {payload,bodies}=await compose(a,id,chain,intent(input));
  if(requestFingerprint(a,id,t.expected,t.request_key,payload)!==t.request_fingerprint)fail("preview_changed",409);
  await append(a,chain,makeRevision(a,id,t.expected,t.request_key,payload,new Date().toISOString()),t.source,bodies);
  chain=await readWork(a,id);const saved=found();if(!saved)fail("refresh_required",409);return {...saved,replayed:false};
}
