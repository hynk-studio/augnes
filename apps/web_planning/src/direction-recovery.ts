import { assertHistoryBudget, canonical, canonicalBytes, exact, fail, hash, reference, type Scope } from "./contract";
import { PARTICIPATION_EXPORT } from "./participation-contract";
import { REASSESSMENT_EXPORT } from "./return-reassessment";
import { USE_EXPORT } from "./return-use";
import { LARGE_EXPORT } from "./exchange";
import { LARGE_PAIR_REQUEST_BYTES, FILE_EXPORT_REQUEST_BYTES, validateFileExport } from "./files";
import { notebookFrom, validateSceneHistory } from "./scene-contract";
import { validateDirectionReferences } from "./directions";
export const DIRECTION_EXPORT="web_planning_direction_export.v1";
export function directionExport(works:unknown[]){
 const content={format:DIRECTION_EXPORT,schema:1,compatibility:"web-planning/directions-1",works};
 const value={...content,fingerprint:hash(canonical(content))};
 // Leave room for the unchanged route's scope/confirmation wrapper.
 const limit=works.some(w=>[LARGE_EXPORT,USE_EXPORT,PARTICIPATION_EXPORT,REASSESSMENT_EXPORT].includes((w as {format:string})?.format))?LARGE_PAIR_REQUEST_BYTES:FILE_EXPORT_REQUEST_BYTES;
 if(canonicalBytes(value)+512>limit)fail("reconstruction_budget_exceeded",422);
 return value;
}
export function validateDirectionExport(scope:Scope,value:unknown){
 exact(value,"format,schema,compatibility,works,fingerprint");
 if(value.format!==DIRECTION_EXPORT||value.schema!==1||value.compatibility!=="web-planning/directions-1")fail("incompatible_format",409);
 if(!Array.isArray(value.works)||value.works.length!==2)fail("direction_pair_scope",409);
 if(directionExport(value.works).fingerprint!==value.fingerprint)fail("export_integrity",409);
 const works=value.works.map(w=>validateFileExport(scope,w));
 if(works[0].chain[0].work_id===works[1].chain[0].work_id)fail("direction_pair_scope",409);
 assertHistoryBudget(works.flatMap(w=>w.chain));
 const [primary,alternate]=works.map(w=>w.chain.at(-1)!);
 if(primary.relations?.origin||alternate.relations?.origin?.source.work_id!==primary.work_id)fail("direction_pair_scope",409);
 const lookup=(ref:ReturnType<typeof reference>)=>{const w=works.find(w=>w.chain[0].work_id===ref.work_id),r=w?.chain.find(r=>canonical(reference(r))===canonical(ref));return r&&w?notebookFrom(r,w.bodies):undefined;};
 for(const w of works){validateSceneHistory(w.chain,w.bodies);for(const r of w.chain)validateDirectionReferences(notebookFrom(r,w.bodies),lookup);}
 return works;
}
