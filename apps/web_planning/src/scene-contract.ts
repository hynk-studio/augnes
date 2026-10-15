import { Buffer } from "node:buffer";
import { canonical, exact, fail, reference, UUID, workRef, type Revision, type WorkRef } from "./contract";
import { decodeFile, type FileBody, type FileEntry } from "./files";

export const SCENE_FILE="augnes-scenes.v1.json";
export const SCENE_FORMAT="augnes_scene_notebook.v1";
export const SCENE_CONTEXT_BYTES=16_384;
export const sceneKinds=["fact","knowledge","belief","assertion","intention"] as const;
export interface SceneProposal { kind:typeof sceneKinds[number]; subject:string; text:string; event_time:number; reveal_order:number }
export interface Scene {
  id:string; title:string; viewpoint:string; event_time:number; reveal_order:number;
  basis:WorkRef; source_files:FileEntry[]; draft:string; proposals:SceneProposal[];
  review:null|{basis:WorkRef;author_ref:string;reason:string;dispositions:("adopted"|"undecided"|"rejected")[]};
}
export interface SceneNotebook { format:typeof SCENE_FORMAT; work_id:string; scenes:Scene[] }
export function sceneText(value:unknown,max:number,required=false):asserts value is string {
  if(typeof value!=="string" || !value.isWellFormed() || Buffer.byteLength(value)>max ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value) || (required&&!value.trim()))fail("invalid_scene_text");
}
export function sceneOrder(value:unknown):asserts value is number {
  if(!Number.isSafeInteger(value) || (value as number)<0)fail("invalid_fictional_order");
}
export function sceneParameters(value:unknown) {
  exact(value,"title,viewpoint,event_time,reveal_order,source_names");
  sceneText(value.title,500,true);sceneText(value.viewpoint,200,true);sceneOrder(value.event_time);sceneOrder(value.reveal_order);
  if(!Array.isArray(value.source_names)||!value.source_names.length||value.source_names.length>8||new Set(value.source_names).size!==value.source_names.length||value.source_names.some((n:unknown)=>typeof n!=="string"))fail("scene_sources_required");
  return value as {title:string;viewpoint:string;event_time:number;reveal_order:number;source_names:string[]};
}
export function sceneDraft(value:unknown) {
  exact(value,"id,title,viewpoint,event_time,reveal_order,source_names,draft,proposals");
  const {id,draft,proposals,...parameters}=value;
  if(!UUID.test(id))fail("invalid_scene_identity");
  sceneParameters(parameters);sceneText(draft,262_144);
  if(!Array.isArray(proposals)||proposals.length>16)fail("scene_proposal_capacity");
  for(const p of proposals){exact(p,"kind,subject,text,event_time,reveal_order");
    if(!sceneKinds.includes(p.kind))fail("invalid_scene_kind");
    sceneText(p.subject,200,["belief","knowledge"].includes(p.kind));sceneText(p.text,4000,true);sceneOrder(p.event_time);sceneOrder(p.reveal_order);
  }
  return value as ReturnType<typeof sceneParameters>&{id:string;draft:string;proposals:SceneProposal[]};
}
export function sceneReview(value:unknown) {
  exact(value,"scene_id,dispositions,reason");if(!UUID.test(value.scene_id))fail("invalid_scene_identity");sceneText(value.reason,2000,true);
  if(!Array.isArray(value.dispositions)||value.dispositions.length>16||value.dispositions.some((d:unknown)=>!["adopted","undecided","rejected"].includes(d as string)))fail("invalid_scene_dispositions");
  return value as {scene_id:string;dispositions:NonNullable<Scene["review"]>["dispositions"];reason:string};
}
export function sourceFiles(r:Revision,names:string[]):FileEntry[] {
  return names.map(name=>{const f=r.files?.find(f=>f.name===name);
    if(!f || f.role!=="source" || !/\.(txt|md|markdown)$/iu.test(name))fail("scene_source_unavailable",409);
    return f;
  });
}
export function emptyNotebook(r:Revision):SceneNotebook {return {format:SCENE_FORMAT,work_id:r.work_id,scenes:[]};}
export function notebookFrom(r:Revision,bodies:FileBody[]):SceneNotebook {
  const file=r.files?.find(f=>f.name===SCENE_FILE);if(!file)return emptyNotebook(r);
  const body=bodies.find(b=>b.digest===file.digest);if(!body)fail("scene_source_unavailable",409);
  try{return JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(decodeFile(body.data)));}
  catch{fail("scene_notebook_unavailable",409);}
}
// Check every introduced body and its transition before reconstruction writes.
// Imported author attribution is an attestation, never independent verification.
export function validateSceneHistory(chain:Revision[],bodies:FileBody[]):void {
  let previous:SceneNotebook|undefined,previousFile:FileEntry|undefined;
  for(let i=0;i<chain.length;i++){
    const r=chain[i],file=r.files?.find(f=>f.name===SCENE_FILE);
    if(!file){if(previousFile)fail("scene_notebook_removal_refused",409);continue;}
    if(file.role!=="other")fail("invalid_scene_notebook",409);
    if(previousFile?.digest===file.digest)continue;
    const book=notebookFrom(r,bodies);exact(book,"format,work_id,scenes");
    if(book.format!==SCENE_FORMAT)fail("scene_notebook_incompatible",409);
    if(book.work_id!==r.work_id||!Array.isArray(book.scenes)||!book.scenes.length||book.scenes.length>32)fail("invalid_scene_notebook",409);
    const ids=new Set();
    for(const s of book.scenes){
      exact(s,"id,title,viewpoint,event_time,reveal_order,basis,source_files,draft,proposals,review");workRef(s.basis);
      if(!Array.isArray(s.source_files))fail("scene_source_unavailable",409);
      sceneDraft({id:s.id,title:s.title,viewpoint:s.viewpoint,event_time:s.event_time,reveal_order:s.reveal_order,source_names:s.source_files.map(f=>f.name),draft:s.draft,proposals:s.proposals});
      if(ids.has(s.id))fail("invalid_scene_identity");ids.add(s.id);
      const source=chain[s.basis.revision-1];
      if(!source || s.basis.revision>=r.revision || canonical(reference(source))!==canonical(s.basis) || canonical(sourceFiles(source,s.source_files.map(f=>f.name)))!==canonical(s.source_files))fail("scene_source_binding",409);
      if(s.review){exact(s.review,"basis,author_ref,reason,dispositions");workRef(s.review.basis);sceneReview({scene_id:s.id,reason:s.review.reason,dispositions:s.review.dispositions});
        const reviewed=chain[s.review.basis.revision-1];
        if(!reviewed||s.review.basis.revision>=r.revision||canonical(reference(reviewed))!==canonical(s.review.basis)||s.review.author_ref!==r.author_ref||s.review.dispositions.length!==s.proposals.length)fail("scene_review_binding",409);
      }
    }
    const before=previous?.scenes??[],after=book.scenes;
    const changed=after.filter((s,n)=>canonical(s)!==canonical(before[n]??null));
    if(after.length<before.length||after.length>before.length+1||changed.length!==1)fail("invalid_scene_change",409);
    const s=changed[0],old=before.find(b=>b.id===s.id),prior=chain[i-1];
    if(!prior)fail("scene_saved_source_required",409);
    if(old?.review)fail("scene_review_locked",409);
    if(old && before.indexOf(old)!==after.indexOf(s))fail("invalid_scene_change",409);
    if(s.review){
      if(!old||canonical({...s,review:null})!==canonical(old)||canonical(s.review.basis)!==canonical(reference(prior)))fail("scene_review_binding",409);
    }else if(canonical(s.basis)!==canonical(reference(prior)))fail("scene_source_binding",409);
    // All other scenes are immutable in this revision; no deleting/reordering.
    for(let n=0;n<before.length;n++)if(before[n].id!==s.id&&canonical(before[n])!==canonical(after[n]))fail("invalid_scene_change",409);
    previous=book;previousFile=file;
  }
}
