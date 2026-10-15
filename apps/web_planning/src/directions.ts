import { canonical, exact, fail, reference, type Payload, type Revision, type WorkRef } from "./contract";
import { historyFiles, type FileBody } from "./files";
import { notebook, replaceNotebook } from "./scenes";
import { DIRECTION_FORMAT, directionNotebook, notebookFrom, sceneText, sceneUnits, validateProposalLinks, type SceneNotebook } from "./scene-contract";
import { readFileBodies, readWork } from "./store";
import type { Access } from "./access";

// A bounded pair, not a recursive branch graph. Existing file/revision budgets
// still admit the complete copies and every subsequent notebook version.
export async function fileBranch(a:Access,r:Revision,id:string,payload:Payload){
 const chain=await readWork(a,r.work_id),bodies=await readFileBodies(a,chain),book=notebookFrom(r,bodies);
 if(!book.scenes.length)fail("file_branch_selection_unsupported");
 if(r.relations?.origin||book.inheritance||book.adoptions?.length)fail("direction_pair_scope",409);
 const fork:SceneNotebook={format:DIRECTION_FORMAT,work_id:id,scenes:[],inheritance:{source:reference(r),scenes:book.scenes},adoptions:[]};
 const copied=replaceNotebook({...payload,files:r.files},fork);
 const retained=copied.payload.files!.filter(f=>f.name!=="augnes-scenes.v1.json").map(f=>bodies.find(b=>b.digest===f.digest)!);
 historyFiles([{files:copied.payload.files} as Revision]);
 return {payload:copied.payload,bodies:[...new Map([...retained,...copied.bodies].map(b=>[b.digest,b])).values()]};
}
export async function checkDirectionReferences(a:Access,book:SceneNotebook){
 const refs=[...(book.inheritance?[book.inheritance.source]:[]),...(book.adoptions??[]).map(d=>d.source)];
 const chains=new Map<string,{chain:Revision[];bodies:FileBody[]}>();
 for(const ref of refs){if(chains.has(ref.work_id))continue;
  const chain=await readWork(a,ref.work_id);if(!chain.length)fail("direction_source_unavailable",409);
  chains.set(ref.work_id,{chain,bodies:await readFileBodies(a,chain)});
 }
 validateDirectionReferences(book,ref=>{const value=chains.get(ref.work_id),r=value?.chain.find(r=>canonical(reference(r))===canonical(ref));return r&&value?notebookFrom(r,value.bodies):undefined;});
 return refs.map(source=>({source,availability:"Exact historical source and bytes available; inherited attribution is not a new review."}));
}
export function validateDirectionReferences(book:SceneNotebook,lookup:(ref:WorkRef)=>SceneNotebook|undefined){
 if(book.inheritance){const source=lookup(book.inheritance.source);
  if(!source||source.inheritance||source.adoptions?.length||canonical(source.scenes)!==canonical(book.inheritance.scenes))fail("direction_source_unavailable",409);
 }
 for(const a of book.adoptions??[]){const source=lookup(a.source);
  if(!source||source.inheritance?.source.work_id!==book.work_id)fail("direction_source_unavailable",409);
  const units=sceneUnits(source).filter(u=>u.ref.work_id===a.source.work_id&&u.review);
  if(canonical(units)!==canonical(a.units))fail("direction_source_integrity",409);
 }
}
export async function directionComparison(a:Access,target:Revision,branch:Revision){
 const targetBook=await notebook(a,[target]),branchBook=await notebook(a,[branch]);
 if(!branchBook.inheritance||branchBook.inheritance.source.work_id!==target.work_id)fail("not_a_branch_of_target",409);
 await checkDirectionReferences(a,branchBook);await checkDirectionReferences(a,targetBook);
 const units=sceneUnits(branchBook).filter(u=>u.ref.work_id===branch.work_id&&u.review);
 if(units.length>16)fail("direction_selection_capacity",422);
 return {target_book:targetBook,branch_book:branchBook,units};
}
export function directionSelection(value:unknown){
 exact(value,"dispositions,reason");sceneText(value.reason,2000,true);
 if(!Array.isArray(value.dispositions)||value.dispositions.length>16||value.dispositions.some((d:unknown)=>!["adopted","undecided","rejected"].includes(d as string)))fail("invalid_scene_dispositions");
 return value as {dispositions:("adopted"|"undecided"|"rejected")[];reason:string};
}
export async function fileIncorporation(a:Access,target:Revision,branch:Revision,input:unknown){
 const selection=directionSelection(input),comparison=await directionComparison(a,target,branch),book=directionNotebook(comparison.target_book);
 if(book.adoptions!.some(d=>d.source.work_id!==branch.work_id))fail("direction_pair_scope",409);
 const units=comparison.units;if(!units.length||selection.dispositions.length!==units.length)fail("incomplete_dispositions");
 const selected=units.filter((_,i)=>selection.dispositions[i]==="adopted");
 for(const u of selected){
  if(u.disposition!=="adopted")fail("source_proposal_not_adopted",409);
  if(u.source_files.some(f=>!target.files?.some(t=>canonical(t)===canonical(f))))fail("scene_prerequisite_missing",409);
 }
 validateProposalLinks(sceneUnits(book),units,selection.dispositions);
 const record={source:reference(branch),target:reference(target),author_ref:a.author_ref,reason:selection.reason,units,dispositions:selection.dispositions};
 const last=book.adoptions!.at(-1),noop=!!last&&canonical({...last,target:record.target})===canonical(record);
 if(!noop){if(book.scenes.length+book.adoptions!.length>=32)fail("scene_notebook_capacity");book.adoptions!.push(record);}
 const prepared=noop?{payload:{definition:target.definition,sources:target.sources,relations:target.relations,files:target.files},bodies:[]}:replaceNotebook({definition:target.definition,sources:target.sources,relations:target.relations,files:target.files},book);
 const chain=await readWork(a,target.work_id);historyFiles([...chain,{files:prepared.payload.files} as Revision]);
 return {...prepared,noop,direction:{...comparison,selection}};
}
