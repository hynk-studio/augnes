import { Buffer } from "node:buffer";
import { seal, unseal, type Access } from "./access";
import { assertHistoryBudget, binding, canonical, exact, fail, hash, headBinding, makeRevision, reference, requestFingerprint, sameBinding, UUID, type Payload, type Revision } from "./contract";
import { historyFiles, selectedFiles, type FileBody } from "./files";
import { append, downloadFile, headsCurrent, readWork, requestRevision } from "./store";
import { emptyNotebook, notebookFrom, SCENE_CONTEXT_BYTES, SCENE_FILE, sceneDraft, sceneParameters, sceneReview, sourceFiles, type SceneNotebook } from "./scene-contract";

const payloadOf=(r:Revision):Payload=>({definition:r.definition,sources:r.sources,...(r.relations?{relations:r.relations}:{}),files:r.files??[]});
async function notebook(a:Access,chain:Revision[]):Promise<SceneNotebook> {
  const r=chain.at(-1)!;
  const index=r.files?.findIndex(f=>f.name===SCENE_FILE)??-1;
  if(index<0)return emptyNotebook(r);
  const {file,bytes}=await downloadFile(a,r,index);
  return notebookFrom(r,[{digest:file.digest,bytes:file.bytes,data:Buffer.from(bytes).toString("base64")}]);
}
function replaceNotebook(payload:Payload,book:SceneNotebook) {
  // The existing file admission owns all byte/selection/history bounds.
  const encoded={name:SCENE_FILE,role:"other",data:Buffer.from(canonical(book)).toString("base64")};
  return selectedFiles(payload,[...(payload.files??[]).filter(f=>f.name!==SCENE_FILE),encoded],{files:payload.files} as Revision);
}
export async function prepareSceneDraft(a:Access,chain:Revision[],prepared:{payload:Payload;bodies:FileBody[]},input:unknown) {
  const r=chain.at(-1),old=r?.files?.find(f=>f.name===SCENE_FILE),next=prepared.payload.files?.find(f=>f.name===SCENE_FILE);
  // Generic uploads, removals, and ordinary saves cannot manufacture adoption.
  if(canonical(old??null)!==canonical(next??null))fail("scene_notebook_owned",409);
  if(input===undefined)return prepared;
  if(!r)fail("scene_saved_source_required",409);
  const value=sceneDraft(input),book=await notebook(a,chain),index=book.scenes.findIndex(s=>s.id===value.id);
  if(index>=0&&book.scenes[index].review)fail("scene_review_locked",409);
  if(index<0&&book.scenes.length>=32)fail("scene_notebook_capacity");
  const {source_names,...content}=value;
  const scene={...content,basis:reference(r),source_files:sourceFiles(r,source_names),review:null};
  if(index<0)book.scenes.push(scene);else book.scenes[index]=scene;
  const changed=replaceNotebook(prepared.payload,book);
  return {payload:changed.payload,bodies:[...prepared.bodies,...changed.bodies]};
}
async function current(a:Access,id:string,expected:unknown) {
  const chain=await readWork(a,id),r=chain.at(-1);if(!r)fail("work_not_found",404);
  if(!sameBinding(headBinding(r),binding(expected)))fail("refresh_required",409);
  return {chain,r};
}
async function reviewPayload(a:Access,chain:Revision[],input:unknown) {
  const intent=sceneReview(input),r=chain.at(-1)!,book=await notebook(a,chain),scene=book.scenes.find(s=>s.id===intent.scene_id);
  if(!scene)fail("scene_unavailable",409);if(scene.review)fail("scene_review_locked",409);
  // A source revised or removed after draft preparation requires a new draft
  // and review. Merely refreshing a ticket must not bless changed sources.
  if(canonical(sourceFiles(r,scene.source_files.map(f=>f.name)))!==canonical(scene.source_files))fail("scene_sources_changed",409);
  if(intent.dispositions.length!==scene.proposals.length)fail("invalid_scene_dispositions");
  scene.review={basis:reference(r),author_ref:a.author_ref,reason:intent.reason,dispositions:intent.dispositions};
  const prepared=replaceNotebook(payloadOf(r),book);historyFiles([...chain,{files:prepared.payload.files} as Revision]);
  return {...prepared,intent,scene};
}
export async function previewSceneReview(a:Access,id:string,expected:unknown,input:unknown) {
  const {chain,r}=await current(a,id,expected),{payload,intent,scene}=await reviewPayload(a,chain,input);
  const t={kind:"scene_review",workspace_id:a.workspace_id,project_id:a.project_id,author_ref:a.author_ref,work_id:id,expected:headBinding(r),request_key:crypto.randomUUID(),intent_fingerprint:hash(canonical(intent)),request_fingerprint:"",expires:Date.now()+86_400_000};
  t.request_fingerprint=requestFingerprint(a,id,t.expected,t.request_key,payload);
  if(!await headsCurrent(a,reference(r),reference(r)))fail("refresh_required",409);
  return {ticket:seal(a,t),intent,scene,expected:t.expected};
}
export async function saveSceneReview(a:Access,id:string,value:unknown,input:unknown,resolve:boolean) {
  const t=unseal(a,value);exact(t,"kind,workspace_id,project_id,author_ref,work_id,expected,request_key,intent_fingerprint,request_fingerprint,expires");
  if(t.kind!=="scene_review"||t.work_id!==id||!UUID.test(t.request_key)||t.workspace_id!==a.workspace_id||t.project_id!==a.project_id||t.author_ref!==a.author_ref||!Number.isSafeInteger(t.expires))fail("invalid_request_binding",403);
  binding(t.expected);if(!resolve&&t.expires<Date.now())fail("save_ticket_expired",409);
  const intent=sceneReview(input);if(hash(canonical(intent))!==t.intent_fingerprint)fail("altered_replay",409);
  const chain=await readWork(a,id),prior=await requestRevision(a,t.request_key);
  if(prior&&(prior.work_id!==id||prior.request_fingerprint!==t.request_fingerprint))fail("altered_replay",409);
  const saved=chain.find(r=>r.request_key===t.request_key);
  if(saved){if(saved.request_fingerprint!==t.request_fingerprint)fail("altered_replay",409);return {outcome:"saved",saved,head:headBinding(chain.at(-1)),replayed:true};}
  if(resolve)return {outcome:"unknown",saved:null,head:headBinding(chain.at(-1))};
  if(!sameBinding(headBinding(chain.at(-1)),t.expected))fail("refresh_required",409);
  const {payload,bodies}=await reviewPayload(a,chain,intent);
  if(requestFingerprint(a,id,t.expected,t.request_key,payload)!==t.request_fingerprint)fail("preview_changed",409);
  const next=makeRevision(a,id,t.expected,t.request_key,payload,new Date().toISOString());assertHistoryBudget([...chain,next]);
  await append(a,next,undefined,bodies);
  const after=await readWork(a,id),result=after.find(r=>r.request_key===t.request_key);
  if(!result)fail("refresh_required",409);
  if(result.request_fingerprint!==t.request_fingerprint)fail("altered_replay",409);
  return {outcome:"saved",saved:result,head:headBinding(after.at(-1)),replayed:false};
}
export async function prepareSceneContext(a:Access,id:string,expected:unknown,input:unknown) {
  const parameters=sceneParameters(input),{chain,r}=await current(a,id,expected),book=await notebook(a,chain);
  const selected=sourceFiles(r,parameters.source_names),originals=[];
  for(const file of selected){const {bytes}=await downloadFile(a,r,r.files!.indexOf(file));let text;
    try{text=new TextDecoder("utf-8",{fatal:true,ignoreBOM:true}).decode(bytes);}catch{fail("scene_source_unavailable",409);}
    originals.push({file,text,revision:reference(r)});
  }
  const eligible=book.scenes.filter(s=>s.event_time<=parameters.event_time&&s.reveal_order<=parameters.reveal_order);
  const entries=book.scenes.flatMap(s=>s.proposals.flatMap((p,index)=>{
    const disposition=s.review?.dispositions[index]??"undecided";
    if(disposition!=="adopted"&&!eligible.includes(s))return [];
    if(["knowledge","belief"].includes(p.kind)&&p.subject!==parameters.viewpoint)return [];
    if(disposition==="adopted"&&(p.event_time>parameters.event_time||p.reveal_order>parameters.reveal_order))return [];
    return [{...p,disposition,scene_title:s.title,source:s.basis,review:s.review}];
  }));
  const preceding=eligible.filter(s=>s.viewpoint===parameters.viewpoint).at(-1)??null;
  const text=[`# Scene preparation: ${parameters.title}`,`Viewpoint: ${parameters.viewpoint}\nFictional event position: ${parameters.event_time}\nReveal position: ${parameters.reveal_order}`,
    `Fictional scope: ${r.definition.goal}\nSaved work: ${id}\nRevision: ${r.revision}\nFingerprint: ${r.fingerprint}`,
    "Authoring context, not empirical Evidence or execution authority. Facts are author knowledge, not automatically character knowledge. Beliefs and public/narrator assertions need not be true. Undecided and rejected changes have not happened by adoption. Draft prose is not canon. Fictional positions are independent of real revision time. Original sources remain the master; this view is bounded and rebuildable.",
    "## Applicable consequential material",entries.length?entries.map(e=>`[${e.disposition}; ${e.kind}${e.subject?`; ${e.subject}`:""}; event ${e.event_time}; reveal ${e.reveal_order}] ${e.text}\nFrom scene: ${e.scene_title}; original basis revision ${e.source.revision}; ${e.review?`reviewed at revision ${e.review.basis.revision} by ${e.review.author_ref}; reason: ${e.review.reason}`:"no adoption review"}`).join("\n\n"):"No applicable reviewed material. Do not infer adoption from saved prose.",
    "## Previous applicable draft (prose, not canon)",preceding?`${preceding.title}\n${preceding.draft}`:"No preceding draft for this viewpoint and these positions.",
    "## Exact selected originals (authored sources, not automatic adoption)",...originals.map(o=>`${o.file.name} · revision ${o.revision.revision} · ${o.file.digest}\n${o.text}`)].join("\n\n");
  const bytes=Buffer.byteLength(text);if(bytes>SCENE_CONTEXT_BYTES)fail("scene_context_capacity",422);
  if(!await headsCurrent(a,reference(r),reference(r)))fail("refresh_required",409);
  return {format:"augnes_scene_context.v1",parameters,basis:reference(r),originals,entries,preceding,text,bytes,limit:SCENE_CONTEXT_BYTES,fingerprint:hash(text)};
}
