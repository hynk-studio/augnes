import { projectWorkListItem, listEnvelope } from "./work-list";
import { SCENE_FILE, validateSceneHistory } from "./scene-contract";
import { Buffer } from "node:buffer";
import { decodeFile, digestBytes, exportFiles, historyFiles, verifiedBodies, type FileBody, type FileEntry } from "./files";
import { assertHistoryBudget, canonical, canonicalBytes, fail, headBinding, HISTORY_READ_BYTES, HISTORY_READ_ROWS, type Binding, type Revision, type Scope, type WorkRef, UUID, validateChain, validateSameWorkOrigins } from "./contract";
// The subset of the D1 binding used here. No SQLite adapter or in-memory fallback.
export interface Statement {
  bind(...values: (string | number | null | ArrayBuffer)[]): Statement;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<{ meta: { changes: number } }>;
}
export interface Database { prepare(sql: string): Statement; batch(statements: Statement[]): Promise<unknown[]> }
export type Store = Scope & { DB: Database; historyRead?: { rows:number; bytes:number } };
// Includes authentication and batch statements; leave ten queries below D1's
// Free invocation ceiling. No retry or replica/session substitution is used.
export function boundedDatabase(db:Database):Database {
  let queries=0;
  const take=(count:number)=>{if(queries+count>40)fail("operation_query_budget_exceeded",503);queries+=count;};
  const raw=new WeakMap<Statement,Statement>();
  const wrap=(statement:Statement):Statement=>{
    const result:Statement={bind(...values){return wrap(statement.bind(...values));},
      all<T>(){take(1);return statement.all<T>();},first<T>(){take(1);return statement.first<T>();},run(){take(1);return statement.run();}};
    raw.set(result,statement);return result;
  };
  return {prepare(sql){return wrap(db.prepare(sql));},batch(statements){take(statements.length);return db.batch(statements.map(s=>{const value=raw.get(s);if(!value)fail("invalid_statement",503);return value;}));}};
}
const where = "workspace_id = ? AND project_id = ? AND work_id = ?";
const args = (s: Scope, id: string) => [s.workspace_id, s.project_id, id];
export async function erased(s: Store, id: string): Promise<boolean> {
  return !!await s.DB.prepare(`SELECT work_id FROM web_planning_erased WHERE ${where}`).bind(...args(s,id)).first();
}
async function observeWork(s: Store, id: string, forList = false) {
  // Keep the existing atomic primary observation. A bounded ordered scan plus
  // a mandatory summary proves completeness without separate-page snapshots.
  // Oversized histories return only the summary, never an apparently valid
  // prefix. Files and the erased-ID guard belong to this same observation.
  const { results } = await s.DB.prepare(`WITH bounded AS MATERIALIZED (
    SELECT envelope,revision,fingerprint,request_key,request_fingerprint FROM web_planning_revision
    WHERE ${where} ORDER BY revision LIMIT ${HISTORY_READ_ROWS+1}
  ), summary AS (SELECT COUNT(*) AS n, COALESCE(SUM(length(CAST(envelope AS BLOB))),0)+MAX(COUNT(*),1)+1 AS bytes FROM bounded),
  files AS MATERIALIZED (SELECT digest,bytes FROM web_planning_file WHERE ${where} ORDER BY digest LIMIT 17)
  SELECT 0 AS kind,NULL AS envelope,NULL AS envelope_bytes,NULL AS revision,NULL AS fingerprint,NULL AS request_key,NULL AS request_fingerprint,
    n,bytes,EXISTS(SELECT 1 FROM web_planning_erased WHERE ${where}) AS erased,
    (SELECT COUNT(*) FROM files) AS file_count,NULL AS digest,NULL AS file_bytes FROM summary
  UNION ALL SELECT 1,${forList ? listEnvelope : "envelope"},length(CAST(envelope AS BLOB)),revision,fingerprint,request_key,request_fingerprint,NULL,NULL,NULL,NULL,NULL,NULL FROM bounded
    WHERE (SELECT n<=${HISTORY_READ_ROWS} AND bytes<=${HISTORY_READ_BYTES} FROM summary)
  UNION ALL SELECT 2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,digest,bytes FROM files
  ORDER BY kind,revision,digest`).bind(...args(s,id),...args(s,id),...args(s,id)).all<{
    kind:number;envelope:string;envelope_bytes:number;revision:number;fingerprint:string;request_key:string;request_fingerprint:string;
    n:number;bytes:number;erased:number;file_count:number;digest:string;file_bytes:number;
  }>();
  const summary=results[0];
  if(!summary || summary.kind!==0 || results.filter(r=>r.kind===0).length!==1 ||
    results.some(r=>![0,1,2].includes(r.kind)) || !Number.isSafeInteger(summary.n) || summary.n<0 ||
    !Number.isSafeInteger(summary.bytes) || summary.bytes<1 || ![0,1].includes(summary.erased) ||
    !Number.isSafeInteger(summary.file_count) || summary.file_count<0)fail("history_observation_incomplete",503);
  if(summary.erased)fail("work_erased",410);
  if(summary.n>HISTORY_READ_ROWS || summary.bytes>HISTORY_READ_BYTES)fail("history_read_budget_exceeded",422);
  const rows=results.filter(r=>r.kind===1),files=results.filter(r=>r.kind===2);
  if(rows.length!==summary.n || files.length!==summary.file_count ||
    rows.some(r=>!Number.isSafeInteger(r.envelope_bytes)||r.envelope_bytes<1||(!forList && Buffer.byteLength(r.envelope)!==r.envelope_bytes)) ||
    rows.reduce((bytes,r)=>bytes+r.envelope_bytes,Math.max(rows.length,1)+1)!==summary.bytes)fail("history_observation_incomplete",503);
  if(s.historyRead){
    s.historyRead.rows+=rows.length;s.historyRead.bytes+=summary.bytes;
    // A ten-item page can validate ten maximal histories; repeated reads within
    // mutations and the two direct context references share this same budget.
    if(s.historyRead.rows>10*HISTORY_READ_ROWS || s.historyRead.bytes>10*HISTORY_READ_BYTES)fail("operation_read_budget_exceeded",503);
  }
  if(!rows.length && files.length)fail("file_content_unavailable",503);
  const values = rows.map(row => {
    const value=JSON.parse(row.envelope);
    for(const key of ["revision","fingerprint","request_key","request_fingerprint"] as const)
      if(value[key]!==row[key])fail("history_index_integrity",503);
    return value;
  });
  return { values, files };
}
function checkStoredFiles(expected:Map<string,number>,files:{digest:string;file_bytes:number}[]) {
  if(files.length!==expected.size || new Set(files.map(f=>f.digest)).size!==files.length || files.some(f=>expected.get(f.digest)!==f.file_bytes))fail("file_content_unavailable",503);
}
async function readEnvelopes(s: Store, id: string): Promise<Revision[]> {
  const {values,files}=await observeWork(s,id);
  if(!values.length)return [];
  const chain=validateChain(s,id,values);
  checkStoredFiles(historyFiles(chain),files);
  return chain;
}
// Note inspection attests to the sealed planning selection, not file bytes or
// the validity of a scene notebook. Full work, save and export keep those checks.
export async function readNoteHistory(s: Store, id: string) {
  const chain=await readEnvelopes(s,id);
  if(!chain.length)fail("work_not_found",404);
  return chain.map(r=>({...headBinding(r),work_id:id,workspace_id:r.workspace_id,project_id:r.project_id,
    author_ref:r.author_ref,recorded_at:r.recorded_at,definition:r.definition,sources:r.sources,
    ...(r.relations?{relations:{materials:r.relations.materials}}:{})}));
}
export async function readWork(s: Store, id: string): Promise<Revision[]> {
  const chain=await readEnvelopes(s,id);
  if(chain.some(r=>r.files?.some(f=>f.name===SCENE_FILE)))validateSceneHistory(chain,await readFileBodies(s,chain));
  return chain;
}
const sourceGate = `NOT EXISTS (SELECT 1 FROM web_planning_erased WHERE ${where})
  AND (SELECT MAX(revision) FROM web_planning_revision WHERE ${where}) = ?
  AND EXISTS (SELECT 1 FROM web_planning_revision WHERE ${where} AND revision = ? AND fingerprint = ?)`;
const sourceArgs = (s:Scope, ref:WorkRef) => [...args(s,ref.work_id),...args(s,ref.work_id),ref.revision,...args(s,ref.work_id),ref.revision,ref.fingerprint];
export async function headsCurrent(s:Store,target:WorkRef,source:WorkRef):Promise<boolean> {
  return !!await s.DB.prepare(`SELECT 1 AS current WHERE ${sourceGate} AND ${sourceGate}`).bind(...sourceArgs(s,target),...sourceArgs(s,source)).first();
}
export async function append(s: Store, chain: Revision[], r: Revision, source?: WorkRef, bodies:FileBody[]=[]): Promise<void> {
  // Use the same historical conditions as a later read, before inserting any row or file.
  validateSameWorkOrigins(chain,r.work_id,r,s);
  assertHistoryBudget([...chain,r]);
  // The predecessor test is inside the INSERT. A JS read is never the concurrency gate.
  const statement=s.DB.prepare(`INSERT INTO web_planning_revision
    (workspace_id,project_id,work_id,revision,fingerprint,request_key,request_fingerprint,envelope)
    SELECT ?,?,?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM web_planning_erased WHERE ${where})
    AND COALESCE((SELECT MAX(revision) FROM web_planning_revision WHERE ${where}),0) = ?
    AND (? = 0 OR EXISTS (SELECT 1 FROM web_planning_revision WHERE ${where} AND revision = ? AND fingerprint = ?))
    ${source ? `AND ${sourceGate}` : ""}
    ON CONFLICT DO NOTHING`).bind(s.workspace_id,s.project_id,r.work_id,r.revision,r.fingerprint,r.request_key,r.request_fingerprint,canonical(r),
      ...args(s,r.work_id),...args(s,r.work_id),r.revision-1,r.revision-1,...args(s,r.work_id),r.revision-1,r.predecessor,...(source?sourceArgs(s,source):[]));
  if(r.files===undefined)await statement.run();
  else {
    try {await s.DB.batch([statement,...fileInsert(s,r,bodies)]);}
    catch(error){const text=String(error);for(const code of ["file_history_count_exceeded","file_history_bytes_exceeded"])if(text.includes(code))fail(code);throw error;}
  }
}
export async function requestRevision(s: Store, key: string): Promise<{ work_id: string; request_fingerprint: string; revision: number } | null> {
  return s.DB.prepare("SELECT work_id,request_fingerprint,revision FROM web_planning_revision WHERE workspace_id=? AND project_id=? AND request_key=?")
    .bind(s.workspace_id,s.project_id,key).first();
}
export async function eraseWork(s: Store, id: string, expected: Binding): Promise<void> {
  // D1 batch is a transaction. If deletion fails, its marker rolls back too.
  await s.DB.batch([
    s.DB.prepare(`INSERT INTO web_planning_erased(workspace_id,project_id,work_id)
      SELECT ?,?,? WHERE EXISTS (SELECT 1 FROM web_planning_revision WHERE ${where} AND revision=? AND fingerprint=?)
      AND (SELECT MAX(revision) FROM web_planning_revision WHERE ${where})=? ON CONFLICT DO NOTHING`)
      .bind(...args(s,id),...args(s,id),expected.revision,expected.fingerprint,...args(s,id),expected.revision),
    s.DB.prepare(`DELETE FROM web_planning_file WHERE ${where} AND EXISTS (SELECT 1 FROM web_planning_erased WHERE ${where})`).bind(...args(s,id),...args(s,id)),
    s.DB.prepare(`DELETE FROM web_planning_revision WHERE ${where} AND EXISTS (SELECT 1 FROM web_planning_erased WHERE ${where})`).bind(...args(s,id),...args(s,id)),
  ]);
  if (!await erased(s,id)) fail("refresh_required",409);
}
export async function reconstruct(s: Store, chain: Revision[], bodies:FileBody[]=[]): Promise<void> {
  return reconstructWorks(s,[{chain,bodies}]);
}
export async function reconstructWorks(s:Store,works:{chain:Revision[];bodies:FileBody[]}[]):Promise<void>{
  if(works.length<1||works.length>2)fail("reconstruction_budget_exceeded");
  const chain=works.flatMap(w=>w.chain);assertHistoryBudget(chain);
  for(const w of works)validateSceneHistory(w.chain,w.bodies);
  // json_each avoids eight parameters and one query per revision. Chunk by
  // actual canonical bytes and rows, keeping every bound string below D1's
  // 2 MB limit. All chunks still commit or roll back in one D1 transaction.
  const chunks:Revision[][]=[];let chunk:Revision[]=[],bytes=2;
  for(const r of chain){const size=canonicalBytes(r)+1;
    if(size+2>200_000)fail("reconstruction_budget_exceeded",422);
    if(chunk.length && (bytes+size>200_000 || chunk.length===128)){chunks.push(chunk);chunk=[];bytes=2;}
    chunk.push(r);bytes+=size;
  }
  if(chunk.length)chunks.push(chunk);
  if(chunks.length>16)fail("reconstruction_budget_exceeded",422);
  // A CHECK-constrained assertion is the first statement in the same transaction.
  // Emptiness includes erased IDs: reconstruction cannot resurrect erased work.
  await s.DB.batch([
    s.DB.prepare(`UPDATE web_planning_workspace SET singleton = CASE WHEN
      EXISTS(SELECT 1 FROM web_planning_revision) OR EXISTS(SELECT 1 FROM web_planning_erased) OR EXISTS(SELECT 1 FROM web_planning_file)
      THEN 0 ELSE 1 END WHERE singleton=1`),
    ...chunks.map(rows => s.DB.prepare(`INSERT INTO web_planning_revision
      (workspace_id,project_id,work_id,revision,fingerprint,request_key,request_fingerprint,envelope)
      SELECT json_extract(value,'$.workspace_id'),json_extract(value,'$.project_id'),json_extract(value,'$.work_id'),
        json_extract(value,'$.revision'),json_extract(value,'$.fingerprint'),json_extract(value,'$.request_key'),
        json_extract(value,'$.request_fingerprint'),value FROM json_each(?)`).bind(canonical(rows))),
    ...works.flatMap(w=>fileInsert(s,w.chain.at(-1)!,w.bodies)),
  ]);
  for(const w of works){
    if(canonical(await readWork(s,w.chain[0].work_id))!==canonical(w.chain))fail("reconstruction_readback_unavailable",503);
    if(w.chain.some(r=>r.files!==undefined))verifiedBodies(w.chain,await readFileBodies(s,w.chain));
  }
}
export async function listWork(s: Store, cursor: string) {
  // Seek past each work on the existing (scope, work_id, revision) index.
  // Even a very long history cannot make discovery walk its duplicate IDs.
  const rows = await s.DB.prepare(`WITH RECURSIVE page(n,id) AS (
    SELECT 0,? UNION ALL
    SELECT n+1,(SELECT MIN(work_id) FROM web_planning_revision
      WHERE workspace_id=? AND project_id=? AND work_id>page.id)
    FROM page WHERE n<11 AND id IS NOT NULL)
    SELECT id AS work_id,n,(SELECT COUNT(id) FROM page WHERE n>0) AS count FROM page
    WHERE id IS NOT NULL ORDER BY n`)
    .bind(cursor,s.workspace_id,s.project_id).all<{ work_id: string; n:number; count:number }>();
  // The seed row is also the completeness witness, including on an empty page.
  const [seed,...ids]=rows.results;
  if(!seed || seed.n!==0 || seed.work_id!==cursor || seed.count!==ids.length || ids.length>11 ||
    ids.some((row,i)=>row.n!==i+1 || !UUID.test(row.work_id) || row.work_id<=(i?ids[i-1].work_id:cursor)))
    fail("history_observation_incomplete",503);
  const items: ReturnType<typeof projectWorkListItem>[] = [];
  for (const row of ids.slice(0,10)) {
    try {
      const {values,files}=await observeWork(s,row.work_id,true);
      if(!values.length)fail("history_observation_incomplete",503);
      const item=projectWorkListItem(s,row.work_id,values);
      checkStoredFiles(historyFiles(values),files);
      items.push(item);
    }
    catch(error) { if((error as {code?:string}).code==="work_erased")fail("refresh_required",409);throw error; }
  }
  return { items, next: ids.length>10 ? ids[9].work_id : null };
}
export { headBinding };

// One bounded statement (at most 16 bodies / 59 parameters), gated by the newly
// committed revision inside the same batch. A lost head race cannot leave uploads.
function fileInsert(s:Store,r:Revision,bodies:FileBody[]):Statement[] {
  if(!bodies.length)return [];
  return [s.DB.prepare(`WITH incoming(digest,bytes,body) AS (VALUES ${bodies.map(()=>"(?,?,?)").join(",")})
    INSERT INTO web_planning_file(workspace_id,project_id,work_id,digest,bytes,body)
    SELECT ?,?,?,digest,bytes,body FROM incoming WHERE EXISTS
      (SELECT 1 FROM web_planning_revision WHERE ${where} AND revision=? AND fingerprint=?)
    AND NOT EXISTS (SELECT 1 FROM web_planning_erased WHERE ${where}) ON CONFLICT DO NOTHING`)
    .bind(...bodies.flatMap(f=>[f.digest,f.bytes,Uint8Array.from(decodeFile(f.data)).buffer]),...args(s,r.work_id),...args(s,r.work_id),r.revision,r.fingerprint,...args(s,r.work_id))];
}
export async function readFileBodies(s:Store,chain:Revision[]):Promise<FileBody[]> {
  const id=chain[0].work_id,head=chain.at(-1)!;
  // Match the exact read revision and erasure guard; refuse missing/extra bodies
  // rather than describing a manifest without its bytes as complete.
  const rows=await s.DB.prepare(`SELECT digest,bytes,body FROM web_planning_file WHERE ${where}
    AND NOT EXISTS (SELECT 1 FROM web_planning_erased WHERE ${where})
    AND EXISTS (SELECT 1 FROM web_planning_revision WHERE ${where} AND revision=? AND fingerprint=?)`)
    .bind(...args(s,id),...args(s,id),...args(s,id),head.revision,head.fingerprint).all<{digest:string;bytes:number;body:number[]}>();
  const bodies=rows.results.map(f=>({digest:f.digest,bytes:f.bytes,data:Buffer.from(f.body).toString("base64")}));
  return verifiedBodies(chain,bodies);
}
export async function completeExport(s:Store,chain:Revision[]) {
  return exportFiles(chain,await readFileBodies(s,chain));
}
export async function downloadFile(s:Store,r:Revision,index:number,exchange=false):Promise<{file:FileEntry;bytes:Uint8Array<ArrayBuffer>}> {
  const file=exchange ? r.exchange?.artifacts[index]?.file : r.files?.[index];if(!file)fail("file_not_found",404);
  const row=await s.DB.prepare(`SELECT body FROM web_planning_file WHERE ${where} AND digest=?
    AND NOT EXISTS (SELECT 1 FROM web_planning_erased WHERE ${where})
    AND EXISTS (SELECT 1 FROM web_planning_revision WHERE ${where} AND revision=? AND fingerprint=?)`)
    .bind(...args(s,r.work_id),file.digest,...args(s,r.work_id),...args(s,r.work_id),r.revision,r.fingerprint).first<{body:number[]}>();
  if(!row)fail("file_content_unavailable",409);
  const bytes=Uint8Array.from(row.body);
  if(bytes.length!==file.bytes||digestBytes(bytes)!==file.digest)fail("file_content_integrity",409);
  return {file,bytes};
}
