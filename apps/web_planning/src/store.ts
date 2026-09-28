import { canonical, fail, headBinding, MAX_REVISIONS, type Binding, type Revision, type Scope, type WorkRef, validateChain } from "./contract";
// The subset of the D1 binding used here. No SQLite adapter or in-memory fallback.
export interface Statement {
  bind(...values: (string | number | null)[]): Statement;
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
  return validateChain(s,id,values);
}
const sourceGate = `NOT EXISTS (SELECT 1 FROM web_planning_erased WHERE ${where})
  AND (SELECT MAX(revision) FROM web_planning_revision WHERE ${where}) = ?
  AND EXISTS (SELECT 1 FROM web_planning_revision WHERE ${where} AND revision = ? AND fingerprint = ?)`;
const sourceArgs = (s:Scope, ref:WorkRef) => [...args(s,ref.work_id),...args(s,ref.work_id),ref.revision,...args(s,ref.work_id),ref.revision,ref.fingerprint];
export async function headsCurrent(s:Store,target:WorkRef,source:WorkRef):Promise<boolean> {
  return !!await s.DB.prepare(`SELECT 1 AS current WHERE ${sourceGate} AND ${sourceGate}`).bind(...sourceArgs(s,target),...sourceArgs(s,source)).first();
}
export async function append(s: Store, r: Revision, source?: WorkRef): Promise<void> {
  // The predecessor test is inside the INSERT. A JS read is never the concurrency gate.
  await s.DB.prepare(`INSERT INTO web_planning_revision
    (workspace_id,project_id,work_id,revision,fingerprint,request_key,request_fingerprint,envelope)
    SELECT ?,?,?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM web_planning_erased WHERE ${where})
    AND ? <= ${MAX_REVISIONS}
    AND COALESCE((SELECT MAX(revision) FROM web_planning_revision WHERE ${where}),0) = ?
    AND (? = 0 OR EXISTS (SELECT 1 FROM web_planning_revision WHERE ${where} AND revision = ? AND fingerprint = ?))
    ${source ? `AND ${sourceGate}` : ""}
    ON CONFLICT DO NOTHING`).bind(s.workspace_id,s.project_id,r.work_id,r.revision,r.fingerprint,r.request_key,r.request_fingerprint,canonical(r),
      ...args(s,r.work_id),r.revision,...args(s,r.work_id),r.revision-1,r.revision-1,...args(s,r.work_id),r.revision-1,r.predecessor,...(source?sourceArgs(s,source):[])).run();
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
    s.DB.prepare(`DELETE FROM web_planning_revision WHERE ${where} AND EXISTS (SELECT 1 FROM web_planning_erased WHERE ${where})`).bind(...args(s,id),...args(s,id)),
  ]);
  if (!await erased(s,id)) fail("refresh_required",409);
}
export async function reconstruct(s: Store, chain: Revision[]): Promise<void> {
  // A CHECK-constrained assertion is the first statement in the same transaction.
  // Emptiness includes erased IDs: reconstruction cannot resurrect erased work.
  await s.DB.batch([
    s.DB.prepare(`UPDATE web_planning_workspace SET singleton = CASE WHEN
      EXISTS(SELECT 1 FROM web_planning_revision) OR EXISTS(SELECT 1 FROM web_planning_erased)
      THEN 0 ELSE 1 END WHERE singleton=1`),
    ...chain.map(r => s.DB.prepare(`INSERT INTO web_planning_revision
      (workspace_id,project_id,work_id,revision,fingerprint,request_key,request_fingerprint,envelope) VALUES (?,?,?,?,?,?,?,?)`)
      .bind(s.workspace_id,s.project_id,r.work_id,r.revision,r.fingerprint,r.request_key,r.request_fingerprint,canonical(r))),
  ]);
  if (canonical(await readWork(s,chain[0].work_id)) !== canonical(chain)) fail("reconstruction_readback_unavailable",503);
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
