import { seal, unseal, type Access } from "./access";
import { canonical, canonicalBytes, exact, fail, FINGERPRINT, hash, normalizePayload, reference, selectedWorkSourceInput,
  UUID, workRef, type Revision, type Scope } from "./contract";
import { listWorkIds, readNoteHistory } from "./store";
import { revisionCompatibility } from "./work-list";

// Literal, case-sensitive text, like the existing exact file reader. Search is
// a sequence of current-head observations, not a cross-request snapshot.
export function searchQuery(value: unknown): string {
  if(typeof value!=="string" || !value.trim() || new TextEncoder().encode(value).length>256 ||
    /[\u0000-\u001f\u007f]/u.test(value))fail("invalid_search_query");
  return value.trim();
}
function excerpt(text:string,query="") {
  const index=query?text.indexOf(query):0, before=[...text.slice(0,index)], rest=[...text.slice(index)];
  const prefix=before.slice(-32), content=[...prefix,...rest].slice(0,160);
  return (before.length>prefix.length?"…":"")+content.join("")+(content.length<prefix.length+rest.length?"…":"");
}
export function searchItem(row:Pick<Revision,"definition"|"sources"|"recorded_at"|"work_id"|"revision"> & {fingerprint:string|null},query:string) {
  if(typeof row.fingerprint!=="string" || !FINGERPRINT.test(row.fingerprint))fail("search_observation_incomplete",503);
  const matches:{field:"goal"|"note";excerpt:string;source_ref?:string;note?:number}[]=[];
  if(row.definition.goal.includes(query))matches.push({field:"goal",excerpt:excerpt(row.definition.goal,query)});
  row.sources.forEach((source,i)=>{
    if(typeof source.bounded_summary!=="string" || typeof source.source_ref!=="string" || !FINGERPRINT.test(source.source_ref))fail("search_observation_incomplete",503);
    if(source.bounded_summary.includes(query))matches.push({field:"note",note:i+1,
      source_ref:source.source_ref,excerpt:excerpt(source.bounded_summary,query)});
  });
  return {work_id:row.work_id,revision:row.revision,fingerprint:row.fingerprint,goal:excerpt(row.definition.goal),recorded_at:row.recorded_at,matches};
}
function identity(access:Scope) {return {workspace_id:access.workspace_id,project_id:access.project_id,author_ref:access.author_ref};}
function readSelection(access:Access,value:string,kind:string,keys:string) {
  const selected=unseal(access,value);
  exact(selected,"kind,workspace_id,project_id,author_ref,query,"+keys);
  if(selected.kind!==kind || Object.entries(identity(access)).some(([key,v])=>selected[key]!==v))fail("scope_denied",403);
  searchQuery(selected.query);
  return selected;
}
export async function searchWork(access:Access,query:string,cursor:string|null) {
  let after="",scanned=0;
  if(cursor){
    const prior=readSelection(access,cursor,"work_search_cursor","after,scanned");
    if(prior.query!==query || !UUID.test(prior.after) || !Number.isSafeInteger(prior.scanned) || prior.scanned<1)fail("invalid_search_cursor");
    after=prior.after;scanned=prior.scanned;
  }
  const ids=await listWorkIds(access,after),items=[];
  for(const {work_id} of ids.slice(0,10)) {
    // One head only, bounded before crossing D1. No historical envelopes,
    // exchange catalogue, scene bodies or attachment bodies are loaded.
    const {results}=await access.DB.prepare(`WITH head AS (
      SELECT revision,fingerprint,envelope FROM web_planning_revision
      WHERE workspace_id=? AND project_id=? AND work_id=? ORDER BY revision DESC LIMIT 1)
      SELECT revision,fingerprint,length(CAST(envelope AS BLOB)) AS bytes,
        CASE WHEN length(CAST(envelope AS BLOB))<=131072 THEN envelope ELSE NULL END AS envelope,
        EXISTS(SELECT 1 FROM web_planning_erased WHERE workspace_id=? AND project_id=? AND work_id=?) AS erased FROM head`)
      .bind(access.workspace_id,access.project_id,work_id,access.workspace_id,access.project_id,work_id)
      .all<{revision:number;fingerprint:string;bytes:number;envelope:string|null;erased:number}>();
    if(results.length!==1 || results[0].erased || !results[0].envelope)fail("search_observation_incomplete",503);
    const head=results[0], row:Revision=JSON.parse(head.envelope!);
    if(canonicalBytes(row)!==head.bytes || row.work_id!==work_id || row.revision!==head.revision || row.fingerprint!==head.fingerprint ||
      !Number.isSafeInteger(row.revision) || row.revision<1 || !FINGERPRINT.test(row.fingerprint) || row.schema!==1 ||
      !revisionCompatibility.has(row.format) || revisionCompatibility.get(row.format)!==row.compatibility ||
      Object.entries(identity(access)).some(([key,v])=>row[key as keyof Revision]!==v) ||
      !Number.isFinite(Date.parse(row.recorded_at)) || !Array.isArray(row.sources))fail("search_observation_incomplete",503);
    const {fingerprint,...material}=row;
    const normalized=normalizePayload(access,row.definition,row.sources.map(selectedWorkSourceInput));
    if(hash(canonical(material))!==fingerprint || canonical(normalized.definition)!==canonical(row.definition) ||
      canonical(normalized.sources)!==canonical(row.sources))fail("history_integrity",409);
    const item=searchItem(row,query);
    if(item.matches.length)items.push({...item,selection:seal(access,{kind:"work_search_match",...identity(access),query,ref:reference(row)})});
  }
  scanned+=Math.min(10,ids.length);
  const next=ids.length>10?seal(access,{kind:"work_search_cursor",...identity(access),query,after:ids[9].work_id,scanned}):null;
  const result={query,workspace_id:access.workspace_id,project_id:access.project_id,items,scanned,next,
    status:next?"more":"exhausted"};
  if(canonicalBytes(result)>98_304)fail("search_observation_incomplete",503);
  return result;
}
export async function inspectWorkMatch(access:Access,selection:string) {
  const chosen=readSelection(access,selection,"work_search_match","ref"),ref=workRef(chosen.ref);
  // The established history reader validates the whole bounded note history.
  // An erased source remains unavailable; inspection cannot resurrect it.
  const revisions=await readNoteHistory(access,ref.work_id),observed=revisions.find(r=>r.revision===ref.revision && r.fingerprint===ref.fingerprint);
  if(!observed)fail("search_basis_unavailable",409);
  const match=searchItem(observed,chosen.query);
  if(!match.matches.length)fail("search_basis_unavailable",409);
  const current=revisions.at(-1)!;
  return {query:chosen.query,observed,current:{work_id:current.work_id,revision:current.revision,fingerprint:current.fingerprint},
    status:current.fingerprint===observed.fingerprint?"current":"advanced",matches:match.matches};
}
