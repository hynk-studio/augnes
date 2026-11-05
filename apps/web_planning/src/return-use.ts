import { boundedText, canonical, exact, fail, reference, workRef, type Payload, type Revision, type WorkRef } from "./contract";
import { fileManifest, type FileEntry } from "./files";
import { mediaType, type ExchangeFile } from "./exchange";

export const USE_FORMAT="web_planning_revision.v0.7";
export const USE_EXPORT="web_planning_export.v0.7";
export const USE_COMPATIBILITY="web-planning/7";
export interface ReturnUse {
  request:WorkRef; request_basis:WorkRef; returned:WorkRef; source_head:WorkRef;
  index:number; original:ExchangeFile; decision:"unchanged"|"adapted"|"deferred"|"declined";
  rationale:string; limits:string; reported_check:string; next_action:string; output:FileEntry|null;
}
export function exactReturn(chain:Revision[],ref:WorkRef,index:number) {
  const returned=chain[ref.revision-1], event=returned?.exchange;
  if(!event || event.kind!=="return" || canonical(reference(returned))!==canonical(ref) ||
     !Number.isSafeInteger(index)||index<0||!event.artifacts[index])fail("return_selection_unavailable",409);
  const request=chain[event.basis!.revision-1],basis=chain[request.revision-2];
  if(!basis || request.exchange?.kind!=="request" || canonical(reference(request))!==canonical(event.basis))fail("exchange_request_unavailable",409);
  return {returned,request,basis,original:event.artifacts[index]};
}
// A destination export attests to its own saved bytes. A foreign source isn't
// reconstructed from the destination and never becomes a grant to read it.
export function returnUse(value:unknown,payload:Payload,id:string,prior?:Revision[]) {
  exact(value,"request,request_basis,returned,source_head,index,original,decision,rationale,limits,reported_check,next_action,output");
  const ret=workRef(value.returned), req=workRef(value.request), basis=workRef(value.request_basis), head=workRef(value.source_head);
  if([req,basis,head].some(r=>r.work_id!==ret.work_id)||basis.revision+1!==req.revision||req.revision>=ret.revision||ret.revision>head.revision ||
     (ret.revision===head.revision && ret.fingerprint!==head.fingerprint)||!Number.isSafeInteger(value.index)||value.index<0||value.index>7)fail("invalid_return_origin");
  exact(value.original,"file,media_type");fileManifest([value.original.file],true);mediaType(value.original.media_type);
  for(const k of ["rationale","limits","reported_check","next_action"])if(boundedText(value[k],k==="rationale"||k==="next_action")!==value[k])fail("invalid_return_judgment");
  const used=value.decision==="unchanged"||value.decision==="adapted";
  if(!used && !(["deferred","declined"].includes(value.decision)&&id===ret.work_id&&value.output===null))fail("invalid_return_judgment");
  if(used) {
    fileManifest([value.output]);
    const m=payload.relations?.file_materials?.at(-1);
    if(!m || canonical(payload.files?.at(-1)??null)!==canonical(value.output)||value.output.role!==value.original.file.role||
       m.kind!==(value.decision==="unchanged"?"incorporated":"authored")||canonical(m.from)!==canonical(value.decision==="unchanged"?ret:null)||value.output.name==="augnes-scenes.v1.json" ||
       (value.decision==="unchanged" ? value.output.digest!==value.original.file.digest || value.output.bytes!==value.original.file.bytes :
         value.output.digest===value.original.file.digest))fail("return_output_mismatch");
    if(prior?.at(-1)?.files?.some(f=>f.name===value.output.name))fail("return_output_name_in_use",409);
  }
  const previous=prior?.at(-1);
  if(previous && (canonical(used?payload.files!.slice(0,-1):payload.files)!==canonical(previous.files??[])||
     canonical(payload.definition)!==canonical(previous.definition)||canonical(payload.sources)!==canonical(previous.sources)))fail("return_preserve_saved_work",409);
  if(prior && id===ret.work_id){
    const origin=exactReturn(prior,ret,value.index);
    if(canonical(reference(prior.at(-1)!))!==canonical(head)||canonical(reference(origin.request))!==canonical(req)||
       canonical(reference(origin.basis))!==canonical(basis)||canonical(origin.original)!==canonical(value.original))fail("invalid_return_origin");
  }
  return value as ReturnUse;
}
export function decisionView(r:Revision) {
  const use=r.return_use!,index=r.files?.findIndex(f=>f.name===use.output?.name)??-1;
  return {destination:reference(r),goal:r.definition.goal,recorded_at:r.recorded_at,...use,
    download:index<0?null:"/api/work/"+r.work_id+"/files/"+r.revision+"/"+r.fingerprint.slice(7)+"/"+index};
}
