import { PARTICIPATION_FORMAT, PARTICIPATION_COMPATIBILITY } from "./participation-contract";
import { REASSESSMENT_FORMAT, REASSESSMENT_COMPATIBILITY, reassessmentRecord } from "./return-reassessment";
import { USE_FORMAT, USE_COMPATIBILITY, returnUse } from "./return-use";
import { canonical, COMPATIBILITY, fail, FINGERPRINT, FORMAT, hash, headBinding, RELATION_COMPATIBILITY, RELATION_FORMAT,
  UUID, type Revision, type Scope } from "./contract";
import { exchangeRecord, exchangeView, EXCHANGE_COMPATIBILITY, EXCHANGE_FORMAT, LARGE_COMPATIBILITY, LARGE_FORMAT, largeExchange } from "./exchange";
import { fileManifest, FILE_COMPATIBILITY, FILE_FORMAT, FILE_RELATION_COMPATIBILITY, FILE_RELATION_FORMAT } from "./files";

// The head supplies the title; exchange envelopes supply the actual recordings.
// Return their original seals for checking. Older planning-only rows contribute
// lineage and file membership, not notes, definitions, scenes or comparisons.
export const listEnvelope = `CASE WHEN revision=(SELECT n FROM summary)
  OR json_type(envelope,'$.exchange') IS NOT NULL OR json_extract(envelope,'$.format')='${EXCHANGE_FORMAT}'
  THEN envelope ELSE json_remove(envelope,'$.sources','$.definition','$.relations','$.return_use','$.return_reassessment') END`;
export const revisionCompatibility = new Map<string,string>([[REASSESSMENT_FORMAT,REASSESSMENT_COMPATIBILITY],[PARTICIPATION_FORMAT,PARTICIPATION_COMPATIBILITY],[USE_FORMAT,USE_COMPATIBILITY],[FORMAT,COMPATIBILITY],[RELATION_FORMAT,RELATION_COMPATIBILITY],
  [FILE_FORMAT,FILE_COMPATIBILITY],[FILE_RELATION_FORMAT,FILE_RELATION_COMPATIBILITY],[EXCHANGE_FORMAT,EXCHANGE_COMPATIBILITY],[LARGE_FORMAT,LARGE_COMPATIBILITY]]);
const previewLimit = 2;

function preview(row:Revision) {
  const {ref,basis,message,next_action,files} = exchangeView(row);
  return {ref,basis,author_ref:row.author_ref,message,next_action,files};
}

// Receives the complete bounded observation, never a page of a task's history.
export function projectWorkListItem(scope:Scope,id:string,rows:Revision[]) {
  const head = rows.at(-1)!;
  const awaiting = new Map<string,Revision>();
  const returns: {request:Revision;returned:Revision}[] = [];
  let returnedFiles = 0, predecessor:string|null = null;
  for (const [i,row] of rows.entries()) {
    if (row.schema!==1 || !revisionCompatibility.has(row.format) || revisionCompatibility.get(row.format)!==row.compatibility ||
        (row.format===EXCHANGE_FORMAT || row.format===LARGE_FORMAT || (row.format===PARTICIPATION_FORMAT && !!row.exchange?.contributor))!==("exchange" in row)) fail("incompatible_format",409);
    if (row.work_id!==id || !UUID.test(id) || row.workspace_id!==scope.workspace_id ||
        row.project_id!==scope.project_id || row.author_ref!==scope.author_ref || row.revision!==i+1 ||
        row.predecessor!==predecessor || !FINGERPRINT.test(row.fingerprint) || !UUID.test(row.request_key) ||
        !FINGERPRINT.test(row.request_fingerprint)) fail("history_index_integrity",503);
    predecessor = row.fingerprint;
    if (row.files!==undefined) fileManifest(row.files);
    if (row===head || row.exchange) {
      const {fingerprint,...material}=row;
      if (hash(canonical(material))!==fingerprint) fail("history_integrity",409);
    }
    if(row===head){
      if((row.format===USE_FORMAT || (row.format===PARTICIPATION_FORMAT && !!(row.return_use?.participant_feedback||row.return_use?.contributor)))!==("return_use" in row))fail("incompatible_format",409);
      if(row.return_use)returnUse(row.return_use,row,id);
      if((row.format===REASSESSMENT_FORMAT)!==("return_reassessment" in row))fail("incompatible_format",409);
      if(row.return_reassessment)reassessmentRecord(row.return_reassessment,row,id);
    }
    if (!row.exchange) continue;
    const event=exchangeRecord(row.exchange);
    if (row.format!==PARTICIPATION_FORMAT && largeExchange(event)!==(row.format===LARGE_FORMAT)) fail("incompatible_format",409);
    if (!i) fail("invalid_exchange");
    if (event.kind==="request") awaiting.set(row.fingerprint,row);
    else {
      const basis=event.basis!, request=awaiting.get(basis.fingerprint);
      if (!request || basis.work_id!==id || basis.revision!==request.revision) fail("exchange_request_unavailable",409);
      awaiting.delete(basis.fingerprint);
      returns.push({request,returned:row});
      returnedFiles+=event.artifacts.length;
    }
  }
  if (typeof head.definition?.goal!=="string" || !head.definition.goal || !Number.isFinite(Date.parse(head.recorded_at)))
    fail("history_observation_incomplete",503);
  return {work_id:id,goal:head.definition.goal,exchanges:"/api/work/"+id+"/exchanges",recorded_at:head.recorded_at,
    ...headBinding(head),branch_of:head.relations?.origin?.source.work_id??null,
    overview:{awaiting_count:awaiting.size,return_count:returns.length,returned_file_count:returnedFiles,
      awaiting:[...awaiting.values()].slice(0,previewLimit).map(preview),
      returns:returns.slice(-previewLimit).reverse().map(({request,returned})=>({request:preview(request),returned:preview(returned)}))}};
}
