import { Buffer } from "node:buffer";
import { canonical, exact, fail, reference, UUID, workRef, type Revision, type WorkRef } from "./contract";
import { decodeFile, type FileBody, type FileEntry } from "./files";

export const SCENE_FILE="augnes-scenes.v1.json";
export const SCENE_FORMAT="augnes_scene_notebook.v1";
export const DIRECTION_FORMAT="augnes_scene_notebook.v2";
export const SCENE_CONTEXT_BYTES=16_384;
export const sceneKinds=["fact","knowledge","belief","assertion","intention"] as const;
export interface SceneProposal { kind:typeof sceneKinds[number]; subject:string; text:string; event_time:number; reveal_order:number; revises?:ProposalRef[]; requires?:ProposalRef[] }
export interface Scene {
  id:string; title:string; viewpoint:string; event_time:number; reveal_order:number;
  basis:WorkRef; source_files:FileEntry[]; draft:string; proposals:SceneProposal[];
  review:null|{basis:WorkRef;author_ref:string;reason:string;dispositions:("adopted"|"undecided"|"rejected")[]};
}
export interface ProposalRef {work_id:string;scene_id:string;proposal:number}
export interface SceneUnit {ref:ProposalRef;title:string;proposal:SceneProposal;source_files:FileEntry[];review:Scene["review"];disposition:"adopted"|"undecided"|"rejected"}
export interface DirectionAdoption {source:WorkRef;target:WorkRef;author_ref:string;reason:string;units:SceneUnit[];dispositions:("adopted"|"undecided"|"rejected")[]}
export interface SceneNotebook { format:typeof SCENE_FORMAT|typeof DIRECTION_FORMAT; work_id:string; scenes:Scene[];
 inheritance?:{source:WorkRef;scenes:Scene[]}|null; adoptions?:DirectionAdoption[] }
export const unitKey=(r:ProposalRef)=>canonical(r);
export function proposalRefs(value:unknown):ProposalRef[]{
 if(!Array.isArray(value)||value.length>4)fail("invalid_proposal_links");
 for(const r of value){exact(r,"work_id,scene_id,proposal");if(!UUID.test(r.work_id)||!UUID.test(r.scene_id)||!Number.isInteger(r.proposal)||r.proposal<0||r.proposal>=16)fail("invalid_proposal_links");}
 if(new Set(value.map(unitKey)).size!==value.length)fail("invalid_proposal_links");return value;
}
export function sceneUnits(book:SceneNotebook):SceneUnit[]{
 const of=(scenes:Scene[],work:string)=>scenes.flatMap(s=>s.proposals.map((proposal,i)=>({ref:{work_id:work,scene_id:s.id,proposal:i},title:s.title,proposal,source_files:s.source_files,review:s.review,disposition:s.review?.dispositions[i]??"undecided"})));
 const inherited=book.inheritance?of(book.inheritance.scenes,book.inheritance.source.work_id):[];
 const taken=(book.adoptions??[]).flatMap(a=>a.units.map((u,i)=>({...u,disposition:a.dispositions[i]})));
 const result=new Map<string,SceneUnit>();
 for(const u of [...inherited,...of(book.scenes,book.work_id),...taken]){const old=result.get(unitKey(u.ref));if(!old||old.disposition!=="adopted"||u.disposition==="adopted")result.set(unitKey(u.ref),u);}
 return [...result.values()];
}
export function validateProposalLinks(before:SceneUnit[],candidates:SceneUnit[],choices:string[]){
 const selected=candidates.filter((_,i)=>choices[i]==="adopted"),superseded=new Set(before.filter(u=>u.disposition==="adopted").flatMap(u=>(u.proposal.revises??[]).map(unitKey)));
 const current=before.filter(u=>!superseded.has(unitKey(u.ref))),retained=new Set<string>();
 for(const u of selected){
  const key=unitKey(u.ref),old=before.find(v=>unitKey(v.ref)===key);
  if(old?.disposition!=="adopted")continue;
  // The prior target selection must have adopted this exact unit, including
  // content, original review and source files. An ID alone grants nothing, and
  // selecting an already superseded unit cannot reactivate it.
  if(!old.review||canonical(old)!==canonical(u)||superseded.has(key))fail("scene_revision_basis",409);
  retained.add(key);
 }
 const introduced=selected.filter(u=>!retained.has(unitKey(u.ref))),revising=introduced.flatMap(u=>(u.proposal.revises??[]).map(unitKey));
 if(new Set(revising).size!==revising.length)fail("scene_revision_basis",409);
 const available=[...current.filter(u=>u.disposition==="adopted"&&!revising.includes(unitKey(u.ref))),...introduced];
 for(const u of selected){
  if([...(u.proposal.requires??[]),...(u.proposal.revises??[])].some(r=>unitKey(r)===unitKey(u.ref)))fail("invalid_proposal_links");
  for(const ref of u.proposal.requires??[])if(!available.some(v=>unitKey(v.ref)===unitKey(ref)))fail("scene_prerequisite_missing",409);
  // Retention does not perform the original reinterpretation again. Its basis
  // was checked when first adopted and is now deliberately superseded. Keep
  // prerequisite checking above for both retained and newly introduced units.
  if(retained.has(unitKey(u.ref)))continue;
  for(const ref of u.proposal.revises??[]){const old=current.find(v=>unitKey(v.ref)===unitKey(ref));
   if(!old||!old.review||old.disposition==="undecided"||old.proposal.event_time!==u.proposal.event_time||old.proposal.reveal_order!==u.proposal.reveal_order)fail("scene_revision_basis",409);
  }
 }
}
export function directionNotebook(book:SceneNotebook):SceneNotebook{return book.format===DIRECTION_FORMAT?book:{...book,format:DIRECTION_FORMAT,inheritance:null,adoptions:[]};}
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
  for(const p of proposals){exact(p,"kind,subject,text,event_time,reveal_order"+(p&&typeof p==="object"&&("revises" in p||"requires" in p)?",revises,requires":""));
    if("revises" in p){proposalRefs(p.revises);proposalRefs(p.requires);}
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
    const book=notebookFrom(r,bodies),direction=book.format===DIRECTION_FORMAT;
    if(book.format!==SCENE_FORMAT&&!direction)fail("scene_notebook_incompatible",409);
    exact(book,"format,work_id,scenes"+(direction?",inheritance,adoptions":""));
    if(previous?.format===DIRECTION_FORMAT&&!direction)fail("scene_notebook_incompatible",409);
    if(direction)validateDirectionShape(book,r,previous,chain[i-1]);
    if(book.work_id!==r.work_id||!Array.isArray(book.scenes)||(!direction&&!book.scenes.length)||book.scenes.length+(book.adoptions?.length??0)>32)fail("invalid_scene_notebook",409);
    const ids=new Set(book.inheritance?.scenes.map(s=>s.id)??[]);
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
    if(!direction&&book.scenes.some(s=>s.proposals.some(p=>p.revises||p.requires)))fail("scene_notebook_incompatible",409);
    if(direction&&((!previous&&!i)||book.adoptions!.length>(previous?.adoptions?.length??0))){
      if(canonical(before)!==canonical(after))fail("invalid_scene_change",409);
      previous=book;previousFile=file;continue;
    }
    const changed=after.filter((s,n)=>canonical(s)!==canonical(before[n]??null));
    if(after.length<before.length||after.length>before.length+1||changed.length!==1)fail("invalid_scene_change",409);
    const s=changed[0],old=before.find(b=>b.id===s.id),prior=chain[i-1];
    if(!prior)fail("scene_saved_source_required",409);
    if(old?.review)fail("scene_review_locked",409);
    if(old && before.indexOf(old)!==after.indexOf(s))fail("invalid_scene_change",409);
    if(s.review){
      if(direction)validateProposalLinks(sceneUnits(previous!),sceneUnits(book).filter(u=>u.ref.work_id===book.work_id&&u.ref.scene_id===s.id),s.review.dispositions);
      if(!old||canonical({...s,review:null})!==canonical(old)||canonical(s.review.basis)!==canonical(reference(prior)))fail("scene_review_binding",409);
    }else if(canonical(s.basis)!==canonical(reference(prior)))fail("scene_source_binding",409);
    // All other scenes are immutable in this revision; no deleting/reordering.
    for(let n=0;n<before.length;n++)if(before[n].id!==s.id&&canonical(before[n])!==canonical(after[n]))fail("invalid_scene_change",409);
    previous=book;previousFile=file;
  }
}

function validateDirectionShape(book:SceneNotebook,r:Revision,previous:SceneNotebook|undefined,prior:Revision|undefined){
 if(!Array.isArray(book.adoptions))fail("invalid_direction_history",409);
 if(book.inheritance!==null){
  exact(book.inheritance,"source,scenes");workRef(book.inheritance.source);
  if(!Array.isArray(book.inheritance.scenes)||book.inheritance.scenes.length>32||canonical(book.inheritance.source)!==canonical(r.relations?.origin?.source??null))fail("invalid_direction_origin",409);
 }
 if(!previous&&prior&&book.inheritance)fail("invalid_direction_origin",409);
 if(previous&&canonical(previous.inheritance??null)!==canonical(book.inheritance))fail("invalid_direction_origin",409);
 if(!previous&&!prior&&(!book.inheritance||book.scenes.length||book.adoptions.length))fail("invalid_direction_origin",409);
 const old=previous?.adoptions??[];
 if(book.adoptions.length<old.length||book.adoptions.length>old.length+1||canonical(book.adoptions.slice(0,old.length))!==canonical(old))fail("invalid_direction_history",409);
 if(book.adoptions.length>old.length){
  const a=book.adoptions.at(-1)!;exact(a,"source,target,author_ref,reason,units,dispositions");workRef(a.source);workRef(a.target);sceneText(a.reason,2000,true);
  if(!prior||canonical(a.target)!==canonical(reference(prior))||a.author_ref!==r.author_ref||a.source.work_id===r.work_id||!Array.isArray(a.units)||!a.units.length||a.units.length>16||!Array.isArray(a.dispositions)||a.dispositions.length!==a.units.length||a.dispositions.some(d=>!["adopted","undecided","rejected"].includes(d)))fail("invalid_direction_review",409);
  if(new Set(a.units.map(u=>unitKey(u.ref))).size!==a.units.length)fail("invalid_direction_review",409);
  for(const [index,u] of a.units.entries()){exact(u,"ref,title,proposal,source_files,review,disposition");proposalRefs([u.ref]);sceneText(u.title,500,true);
   if(u.ref.work_id!==a.source.work_id||!u.review||!["adopted","undecided","rejected"].includes(u.disposition)||!Array.isArray(u.source_files))fail("invalid_direction_review",409);
   if(a.dispositions[index]==="adopted"&&(u.disposition!=="adopted"||u.source_files.some(f=>!prior.files?.some(t=>canonical(t)===canonical(f)))))fail("scene_prerequisite_missing",409);
   sceneDraft({id:u.ref.scene_id,title:u.title,viewpoint:"validation",event_time:0,reveal_order:0,source_names:u.source_files.map(f=>f.name),draft:"",proposals:[u.proposal]});
  }
  validateProposalLinks(sceneUnits(previous??emptyNotebook(r)),a.units,a.dispositions);
 }
}
