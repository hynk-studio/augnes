import { boundedText, canonical, exact, fail, reference, workRef, type Payload, type Revision, type WorkRef } from "./contract";
import { fileManifest, type FileEntry } from "./files";
import { SCENE_FILE } from "./scene-contract";

export const REASSESSMENT_FORMAT="web_planning_revision.v0.9";
export const REASSESSMENT_EXPORT="web_planning_export.v0.9";
export const REASSESSMENT_COMPATIBILITY="web-planning/9";
export interface EvidenceSelection { ref:WorkRef; kind:"file"|"return"; index:number }
export interface Reassessment {
  use:WorkRef; previous:WorkRef|null;
  evidence:EvidenceSelection & { file:FileEntry; source_head:WorkRef };
  decision:"retained"|"updated"|"deferred"|"ended";
  rationale:string; limits:string; reported_check:string; context:string; next_action:string;
  output:FileEntry|null;
}
export const equal=(a:unknown,b:unknown)=>canonical(a)===canonical(b);
export function evidenceSelection(value:unknown):EvidenceSelection {
  exact(value,"ref,kind,index");workRef(value.ref);
  if(!["file","return"].includes(value.kind)||!Number.isSafeInteger(value.index)||value.index<0||value.index>7)fail("invalid_evidence_selection");
  return value as EvidenceSelection;
}
export function selectedUse(chain:Revision[],ref:WorkRef) {
  const use=chain[ref.revision-1];
  if(!use?.return_use?.output||!equal(reference(use),ref))fail("consumer_use_unavailable",409);
  return use;
}
export function currentUse(chain:Revision[],use:Revision) {
  const latest=chain.findLast(r=>r.return_reassessment?.use.fingerprint===use.fingerprint);
  const judgment=latest?.return_reassessment;
  const chosen=judgment?judgment.output:use.return_use!.output;
  const head=chain.at(-1)!;
  const output=chosen && head.files?.find(f=>equal(f,chosen)) || null;
  return {use:reference(use),judgment:latest?{...judgment,revision:reference(latest),recorded_at:latest.recorded_at}:null,
    status:judgment?.decision==="ended"?"ended":output?"selected":"no_longer_selected",
    output,download:output?fileView(head,head.files!.indexOf(output),false).download:null};
}
// These records live only on their committing revision. History, not a second
// ledger or a source-owned disposition, determines this consumer's latest choice.
export function reassessmentRecord(value:unknown,payload:Payload,id:string,prior?:Revision[]):Reassessment {
  exact(value,"use,previous,evidence,decision,rationale,limits,reported_check,context,next_action,output");
  const ref=workRef(value.use);if(ref.work_id!==id)fail("invalid_consumer_use");
  if(value.previous!==null){const p=workRef(value.previous);if(p.work_id!==id||p.revision<=ref.revision)fail("invalid_consumer_use");}
  exact(value.evidence,"ref,kind,index,file,source_head");
  const {file,source_head,...pick}=value.evidence;evidenceSelection(pick);fileManifest([file],true);workRef(source_head);
  if(source_head.work_id!==pick.ref.work_id||source_head.revision<pick.ref.revision||
      (source_head.revision===pick.ref.revision&&!equal(source_head,pick.ref)))fail("invalid_evidence_selection");
  if(!["retained","updated","deferred","ended"].includes(value.decision))fail("invalid_reassessment");
  for(const k of ["rationale","limits","reported_check","context","next_action"])
    if(boundedText(value[k],["rationale","context","next_action"].includes(k))!==value[k])fail("invalid_reassessment");
  if(value.output!==null){fileManifest([value.output]);if(value.output.name===SCENE_FILE||!payload.files?.some(f=>equal(f,value.output)))fail("reassessment_output_mismatch");}
  if(value.decision==="ended"&&value.output!==null)fail("reassessment_output_mismatch");
  if(prior){
    const use=selectedUse(prior,ref),current=currentUse(prior,use),head=prior.at(-1)!;
    if(!equal(value.previous,current.judgment?.revision??null))fail("reassessment_previous_mismatch");
    if(!equal(payload.definition,head.definition)||!equal(payload.sources,head.sources))fail("reassessment_preserve_saved_work");
    const changed=!equal(current.output,value.output);
    if(value.decision==="retained"&&!current.output)fail("current_output_unavailable");
    if(["retained","deferred"].includes(value.decision)&&changed)fail("reassessment_output_mismatch");
    if(value.decision==="updated"&&!changed&&value.context===(current.judgment?.context??""))fail("reassessment_update_unchanged");
    const expected=(head.files??[]).filter(f=>!changed||!current.output||!equal(f,current.output));
    if(changed&&value.output)expected.push(value.output);
    if(!equal(payload.files,expected))fail("reassessment_preserve_saved_work");
    const relations=head.relations!;
    if(!relations?.file_materials)fail("reassessment_preserve_saved_work");
    const materials=relations.file_materials.filter(m=>!changed||!current.output||!equal(m.file,current.output));
    if(changed&&value.output)materials.push({file:value.output,kind:"authored",from:null});
    if(!equal(payload.relations,{...relations,file_materials:materials}))fail("reassessment_preserve_saved_work");
    if(pick.ref.work_id===id){
      const selected=prior[pick.ref.revision-1];
      if(!selected||!equal(reference(selected),pick.ref)||!equal(source_head,reference(head))||
        !equal(file,(pick.kind==="return"?selected.exchange?.kind==="return"&&selected.exchange.artifacts[pick.index]?.file:selected.files?.[pick.index])||null))fail("invalid_evidence_selection");
    }
  }
  return value as Reassessment;
}
export function fileView(r:Revision,index:number,exchange:boolean){
  const file=exchange?r.exchange!.artifacts[index].file:r.files![index];
  return {...file,download:`/api/work/${r.work_id}/${exchange?"exchange-files":"files"}/${r.revision}/${r.fingerprint.slice(7)}/${index}`};
}
