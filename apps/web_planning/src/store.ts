import { Buffer } from "node:buffer";
import { decodeFile, digestBytes, exportFiles, historyFiles, verifiedBodies, type FileBody, type FileEntry } from "./files";
import { canonical, fail, headBinding, MAX_REVISIONS, type Binding, type Revision, type Scope, type WorkRef, validateChain } from "./contract";
// The subset of the D1 binding used here. No SQLite adapter or in-memory fallback.
export interface Statement {
  bind(...values: (string | number | null | ArrayBuffer)[]): Statement;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<{ meta: { changes: number } }>;
}
export interface Database { prepare(sql: string): Statement; batch(statements: Statement[]): Promise<unknown[]> }
export type Store = Scope & { DB: Database };
const where = "workspace_id = ? AND project_id = ? AND work_id = ?";
const args = (s: Scope, id: string) => [s.workspace_id, s.project_id, id];
export async function erased(s: Store, id: string): Promise<boolean> {
  return !!await s.DB.prepare(`SELECT work_id FROM web_planning_erased WHERE ${where}`).bind(...args(s,id)).first();
}
export async function readWork(s: Store, id: string): Promise<Revision[]> {
  // One primary statement observes marker and history together, including racing erase.
  const { results } = await s.DB.prepare(`SELECT envelope, revision, fingerprint, request_key, request_fingerprint, 0 AS erased FROM web_planning_revision WHERE ${where}
    UNION ALL SELECT NULL AS envelope, NULL AS revision, NULL AS fingerprint, NULL AS request_key, NULL AS request_fingerprint, 1 AS erased FROM web_planning_erased WHERE ${where}`).bind(...args(s,id),...args(s,id)).all<{ envelope: string | null; revision:number; fingerprint:string; request_key:string; request_fingerprint:string; erased: number }>();
  if (results.some(row => row.erased)) fail("work_erased", 410);
  if (!results.length) return [];
  const values = results.map(row => {
    const value=JSON.parse(row.envelope!);
    for(const key of ["revision","fingerprint","request_key","request_fingerprint"] as const)
      if(value[key]!==row[key])fail("history_index_integrity",503);
    return value;
  }).sort((a,b)=>a.revision-b.revision);
  const chain=validateChain(s,id,values);
  if(chain.some(r=>r.files!==undefined)) {
    const expected=historyFiles(chain);
    const rows=await s.DB.prepare(`SELECT digest, bytes FROM web_planning_file WHERE ${where}`).bind(...args(s,id)).all<{digest:string;bytes:number}>();
    if(rows.results.length!==expected.size || rows.results.some(f=>expected.get(f.digest)!==f.bytes))fail("file_content_unavailable",503);
  }
  return chain;
}
const sourceGate = `NOT EXISTS (SELECT 1 FROM web_planning_erased WHERE ${where})
  AND (SELECT MAX(revision) FROM web_planning_revision WHERE ${where}) = ?
  AND EXISTS (SELECT 1 FROM web_planning_revision WHERE ${where} AND revision = ? AND fingerprint = ?)`;
const sourceArgs = (s:Scope, ref:WorkRef) => [...args(s,ref.work_id),...args(s,ref.work_id),ref.revision,...args(s,ref.work_id),ref.revision,ref.fingerprint];
export async function headsCurrent(s:Store,target:WorkRef,source:WorkRef):Promise<boolean> {
  return !!await s.DB.prepare(`SELECT 1 AS current WHERE ${sourceGate} AND ${sourceGate}`).bind(...sourceArgs(s,target),...sourceArgs(s,source)).first();
}
export async function append(s: Store, r: Revision, source?: WorkRef, bodies:FileBody[]=[]): Promise<void> {
  // The predecessor test is inside the INSERT. A JS read is never the concurrency gate.
  const statement=s.DB.prepare(`INSERT INTO web_planning_revision
    (workspace_id,project_id,work_id,revision,fingerprint,request_key,request_fingerprint,envelope)
    SELECT ?,?,?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM web_planning_erased WHERE ${where})
    AND ? <= ${MAX_REVISIONS}
    AND COALESCE((SELECT MAX(revision) FROM web_planning_revision WHERE ${where}),0) = ?
    AND (? = 0 OR EXISTS (SELECT 1 FROM web_planning_revision WHERE ${where} AND revision = ? AND fingerprint = ?))
    ${source ? `AND ${sourceGate}` : ""}
    ON CONFLICT DO NOTHING`).bind(s.workspace_id,s.project_id,r.work_id,r.revision,r.fingerprint,r.request_key,r.request_fingerprint,canonical(r),
      ...args(s,r.work_id),r.revision,...args(s,r.work_id),r.revision-1,r.revision-1,...args(s,r.work_id),r.revision-1,r.predecessor,...(source?sourceArgs(s,source):[]));
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
  // A CHECK-constrained assertion is the first statement in the same transaction.
  // Emptiness includes erased IDs: reconstruction cannot resurrect erased work.
  await s.DB.batch([
    s.DB.prepare(`UPDATE web_planning_workspace SET singleton = CASE WHEN
      EXISTS(SELECT 1 FROM web_planning_revision) OR EXISTS(SELECT 1 FROM web_planning_erased) OR EXISTS(SELECT 1 FROM web_planning_file)
      THEN 0 ELSE 1 END WHERE singleton=1`),
    ...chain.map(r => s.DB.prepare(`INSERT INTO web_planning_revision
      (workspace_id,project_id,work_id,revision,fingerprint,request_key,request_fingerprint,envelope) VALUES (?,?,?,?,?,?,?,?)`)
      .bind(s.workspace_id,s.project_id,r.work_id,r.revision,r.fingerprint,r.request_key,r.request_fingerprint,canonical(r))),
    ...fileInsert(s,chain.at(-1)!,bodies),
  ]);
  if (canonical(await readWork(s,chain[0].work_id)) !== canonical(chain)) fail("reconstruction_readback_unavailable",503);
  if(chain.some(r=>r.files!==undefined))verifiedBodies(chain,await readFileBodies(s,chain));
}
export async function listWork(s: Store, cursor: string): Promise<{ items: Revision[]; next: string | null }> {
  const rows = await s.DB.prepare(`SELECT DISTINCT work_id FROM web_planning_revision
    WHERE workspace_id=? AND project_id=? AND work_id > ? ORDER BY work_id LIMIT 11`)
    .bind(s.workspace_id,s.project_id,cursor).all<{ work_id: string }>();
  const items: Revision[] = [];
  for (const row of rows.results.slice(0,10)) {
    try { const chain=await readWork(s,row.work_id); if(chain.length) items.push(chain.at(-1)!); }
    catch(error) { if((error as {code?:string}).code!=="work_erased") throw error; }
  }
  return { items, next: rows.results.length>10 ? rows.results[9].work_id : null };
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
export async function downloadFile(s:Store,r:Revision,index:number):Promise<{file:FileEntry;bytes:Uint8Array<ArrayBuffer>}> {
  const file=r.files?.[index];if(!file)fail("file_not_found",404);
  const row=await s.DB.prepare(`SELECT body FROM web_planning_file WHERE ${where} AND digest=?
    AND NOT EXISTS (SELECT 1 FROM web_planning_erased WHERE ${where})
    AND EXISTS (SELECT 1 FROM web_planning_revision WHERE ${where} AND revision=? AND fingerprint=?)`)
    .bind(...args(s,r.work_id),file.digest,...args(s,r.work_id),...args(s,r.work_id),r.revision,r.fingerprint).first<{body:number[]}>();
  if(!row)fail("file_content_unavailable",409);
  const bytes=Uint8Array.from(row.body);
  if(bytes.length!==file.bytes||digestBytes(bytes)!==file.digest)fail("file_content_integrity",409);
  return {file,bytes};
}
