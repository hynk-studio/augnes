import { participantFeedback } from "./participation-contract";
import { Buffer } from "node:buffer";
import { boundedText, canonical, exact, fail, hash, reference, UUID, workRef, type Payload, type Revision } from "./contract";
import { exchangeView } from "./exchange";
import { decodeFile, digestBytes, FILE_LIMIT, fileManifest, type FileBody } from "./files";
import { fileMaterials } from "./file-relations";
import { relationsOf } from "./relations";
import { SCENE_FILE } from "./scene-contract";
import { downloadFile, headsCurrent, readWork, type Store } from "./store";
import { decisionView, exactReturn, returnUse, type ReturnUse } from "./return-use";

const snapshot=(r:Revision)=>({ref:reference(r),definition:r.definition,notes:r.sources.map(s=>s.bounded_summary),files:r.files??[]});
export async function inspectReturn(s:Store,id:string,input:Record<string,unknown>) {
  exact(input,"workspace_id,project_id,returned,index,after");
  const ref=workRef(input.returned);
  if(ref.work_id!==id)fail("invalid_return_origin");
  const index=input.index;if(typeof index!=="number")fail("return_selection_unavailable",409);
  const chain=await readWork(s,id),origin=exactReturn(chain,ref,index),head=chain.at(-1)!;
  let work="",rev=0;
  if(input.after!==null){exact(input.after,"work_id,revision");work=input.after.work_id;rev=input.after.revision;
    if(!UUID.test(work)||!Number.isSafeInteger(rev)||rev<1)fail("invalid_return_cursor");}
  // This partial expression index is over the committed destination revision,
  // so a refused, pending or erased destination cannot publish a backlink.
  const {results}=await s.DB.prepare(`SELECT envelope,work_id,revision,fingerprint FROM web_planning_revision
    WHERE workspace_id=? AND project_id=? AND (envelope ->> '$.return_use.returned.fingerprint')=?
      AND (envelope ->> '$.return_use.index')=? AND (work_id,revision)>(?,?) ORDER BY work_id,revision LIMIT 11`).bind(s.workspace_id,s.project_id,ref.fingerprint,index,work,rev)
    .all<{envelope:string;work_id:string;revision:number;fingerprint:string}>();
  const rows=results.slice(0,10), decisions=rows.map(row=>{
    const r:Revision=JSON.parse(row.envelope),{fingerprint,...material}=r;
    if(r.workspace_id!==s.workspace_id||r.project_id!==s.project_id||r.author_ref!==s.author_ref||r.work_id!==row.work_id||
      r.revision!==row.revision||fingerprint!==row.fingerprint||hash(canonical(material))!==fingerprint)fail("history_integrity",409);
    const use=returnUse(r.return_use,r,r.work_id),o=exactReturn(chain,ref,use.index);
    if(use.index!==index||canonical(use.returned)!==canonical(ref)||canonical(use.request)!==canonical(reference(o.request))||
       canonical(use.request_basis)!==canonical(reference(o.basis))||canonical(use.original)!==canonical(o.original)||
       chain[use.source_head.revision-1]?.fingerprint!==use.source_head.fingerprint)fail("invalid_return_origin",409);
    return decisionView(r);
  });
  if(!await headsCurrent(s,reference(head),reference(head)))fail("refresh_required",409);
  const last=rows.at(-1);
  return {request:exchangeView(origin.request),returned:exchangeView(origin.returned),request_basis:snapshot(origin.basis),current:snapshot(head),
    selection:{returned:ref,index,source_head:reference(head),original:origin.original},
    decisions,next:results.length>10&&last?{work_id:last.work_id,revision:last.revision}:null};
}

export async function applyReturn(s:Store,id:string,chain:Revision[],prepared:{payload:Payload;bodies:FileBody[]},choice:unknown) {
  if(choice===undefined)return prepared;
  exact(choice,"selection,decision,name,text,rationale,limits,reported_check,next_action"+(choice && typeof choice === "object" && "participant_feedback" in choice?",participant_feedback":""));
  const sel=choice.selection;exact(sel,"returned,index,source_head,original");
  const ref=workRef(sel.returned),observed=workRef(sel.source_head);
  const source=ref.work_id===id?chain:await readWork(s,ref.work_id);
  const {returned,request,basis,original}=exactReturn(source,ref,sel.index);
  if(canonical(original)!==canonical(sel.original))fail("return_file_changed",409);
  if(canonical(reference(source.at(-1)!))!==canonical(observed))fail("return_conditions_changed",409);
  const current=chain.at(-1),payload={...prepared.payload,files:[...(prepared.payload.files??[])]};
  if(current){
    if(canonical(current.files??[])!==canonical(payload.files)||canonical(current.sources)!==canonical(payload.sources)||
       canonical(current.definition)!==canonical(payload.definition)||canonical(payload.relations??relationsOf(current))!==canonical(relationsOf(current)))fail("return_preserve_saved_work",409);
    if(current.relations)payload.relations=current.relations;else delete payload.relations;
  }
  const use:ReturnUse={request:reference(request),request_basis:reference(basis),returned:ref,source_head:observed,index:sel.index,original,decision:choice.decision,
    rationale:boundedText(choice.rationale,true),limits:boundedText(choice.limits),reported_check:boundedText(choice.reported_check),next_action:boundedText(choice.next_action,true),output:null};
  if(returned.exchange?.contributor)use.contributor=returned.exchange.contributor;
  if("participant_feedback" in choice){
    if(!returned.exchange?.contributor)fail("participant_return_required");
    use.participant_feedback=participantFeedback(choice.participant_feedback);
  }
  const bodies=[...prepared.bodies];
  if(use.decision==="unchanged"||use.decision==="adapted"){
    if(typeof choice.name!=="string"||choice.name===SCENE_FILE||payload.files.some(f=>f.name===choice.name)||
       current?.files?.some(f=>f.name===choice.name))fail("return_output_name_in_use",409);
    let data:string;
    if(use.decision==="unchanged"){
      if(choice.text!==null)fail("unchanged_return_has_edits");
      if(original.file.bytes>FILE_LIMIT)fail("return_exceeds_selected_file_limit",422);
      const {bytes}=await downloadFile(s,returned,sel.index,true);data=Buffer.from(bytes).toString("base64");
    }else{
      if(typeof choice.text!=="string"||!choice.text.trim()||!choice.text.isWellFormed()||Buffer.byteLength(choice.text)>FILE_LIMIT)fail("invalid_return_adaptation");
      data=Buffer.from(choice.text,"utf8").toString("base64");
    }
    const bytes=decodeFile(data),output={name:choice.name,role:original.file.role,bytes:bytes.length,digest:digestBytes(bytes)};
    if(use.decision==="adapted"&&output.digest===original.file.digest)fail("return_adaptation_unchanged");
    const existing=payload.relations??(current?relationsOf(current):{origin:null,materials:payload.sources.map(n=>({source_ref:n.source_ref!,kind:"authored" as const,from:null,dependencies:[]})),review:null});
    const prior=existing.file_materials??fileMaterials({files:payload.files} as Revision);
    payload.relations={...existing,file_materials:[...prior,{file:output,kind:use.decision==="unchanged"?"incorporated":"authored",from:use.decision==="unchanged"?ref:null}]};
    payload.files=fileManifest([...payload.files,output]);use.output=output;
    bodies.push({digest:output.digest,bytes:output.bytes,data});
  }else if(choice.name!==null||choice.text!==null||ref.work_id!==id)fail("record_nonuse_on_original");
  payload.return_use=returnUse(use,payload,id,chain);
  return {payload,bodies};
}
