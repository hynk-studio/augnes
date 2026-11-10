import { canonical, fail, reference, type FileMaterial, type FileSelection, type Payload, type Revision, type ComparisonReview } from "./contract";
import { fileManifest, historyFiles, type FileBody } from "./files";
import { SCENE_FILE } from "./scene-contract";
import { readFileBodies, readWork, type Store } from "./store";

export const hasSceneFile=(r:Revision)=>!!r.files?.some(f=>f.name===SCENE_FILE);
export function fileMaterials(r:Revision):FileMaterial[] {
  return r.relations?.file_materials??(r.files??[]).map(file=>({file,kind:"authored",from:null}));
}
// Copy only the selected state. Full source history stays owned by the source.
export async function ordinaryFileBranch(s:Store,source:Revision,payload:Payload) {
  if(hasSceneFile(source))fail("scene_review_required",409);
  if(source.relations?.origin)fail("ordinary_direct_branch_required",409);
  const bodies=await readFileBodies(s,await readWork(s,source.work_id));
  const files=source.files??[];
  return {payload:{...payload,files,relations:{...payload.relations!,file_materials:files.map(file=>({file,kind:"inherited" as const,from:reference(source)}))}},
    bodies:bodies.filter(b=>files.some(f=>f.digest===b.digest))};
}
export async function ordinaryFileIncorporation(s:Store,target:Revision,source:Revision,payload:Payload,selection?:FileSelection) {
  if(hasSceneFile(target)||hasSceneFile(source))fail("scene_review_required",409);
  if(!selection)fail("explicit_file_selection_required");
  for(const [chosen,r] of [[selection.target,target],[selection.source,source]] as const)
    if(chosen.some(f=>!r.files?.some(saved=>canonical(saved)===canonical(f))))fail("invalid_file_selection");
  const selected=(r:Revision,chosen:FileSelection["source"]) => (r.files??[]).filter(f=>chosen.some(c=>canonical(c)===canonical(f)));
  const retained=selected(target,selection.target),incoming=selected(source,selection.source);
  const materials=fileMaterials(target).filter(m=>retained.some(f=>canonical(f)===canonical(m.file)));
  for(const file of incoming){
    const existing=materials.find(m=>m.file.name===file.name);
    if(existing){if(canonical(existing.file)!==canonical(file))fail("file_name_choice_required");continue;}
    materials.push({file,kind:"incorporated",from:reference(source)});
  }
  const files=fileManifest(materials.map(m=>m.file));
  const targetChain=await readWork(s,target.work_id),sourceChain=await readWork(s,source.work_id);
  // Verify both complete owned stores before admission, including retained bodies.
  await readFileBodies(s,targetChain);
  const available=await readFileBodies(s,sourceChain);
  historyFiles([...targetChain,{files} as Revision]);
  const bodies:FileBody[]=available.filter(b=>incoming.some(f=>f.digest===b.digest));
  const relations={...payload.relations!,file_materials:materials,review:{...payload.relations!.review!,file_selection:selection}};
  const prior=target.relations?.review;
  if(prior&&canonical(payload.sources)===canonical(target.sources)&&canonical(relations.materials)===canonical(target.relations!.materials)&&
    canonical(files)===canonical(target.files??[])&&canonical(materials)===canonical(fileMaterials(target))&&
    canonical({...prior,target:relations.review.target})===canonical(relations.review))relations.review=prior as ComparisonReview & {file_selection:FileSelection};
  return {payload:{...payload,files,relations},bodies};
}
