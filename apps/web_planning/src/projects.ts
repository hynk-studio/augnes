import type { Access } from './access';
import { boundedText, canonical, exact, fail, hash, makeRevision, normalizePayload, UUID } from './contract';
import { readWork } from './store';

type ProjectRow={singleton:number;workspace_id:string;project_id:string;author_ref:string;owner_login_hash:string;
  name:string|null;continuation_work_id:string|null;creation_key:string|null;creation_fingerprint:string|null};
function view(s:Access,row:ProjectRow){
  return {workspace_id:row.workspace_id,project_id:row.project_id,author_ref:row.author_ref,
    name:row.name??s.env.PROJECT_NAME??'Private planning workspace',continuation_work_id:row.continuation_work_id};
}
export async function listProjects(s:Access,cursor=''){
  if(!s.projectEntry)fail('scope_denied',403);
  if(cursor&&!UUID.test(cursor))fail('invalid_cursor');
  const {results}=await s.DB.prepare(`SELECT * FROM web_planning_workspace
    WHERE workspace_id=? AND owner_login_hash=? AND project_id>? ORDER BY project_id LIMIT 21`)
    .bind(s.env.WORKSPACE_ID,s.principalHash,cursor).all<ProjectRow>();
  return {projects:results.slice(0,20).map(row=>view(s,row)),next:results.length>20?results[19].project_id:null};
}
export async function createProject(s:Access,input:Record<string,unknown>){
  if(!s.projectEntry)fail('scope_denied',403);
  exact(input,'request_key,name,purpose,judgment,unfinished,next_action');
  exact(input.judgment,'text,source');
  if(!UUID.test(String(input.request_key)))fail('invalid_request_key');
  const name=boundedText(input.name,true);
  if([...name].length>120)fail('invalid_project_name');
  const unfinished=boundedText(input.unfinished,true),next_action=boundedText(input.next_action,true);
  const material={name,purpose:input.purpose,judgment:input.judgment,unfinished,next_action};
  const fingerprint=hash(canonical(material)),key=String(input.request_key);
  const prior=await s.DB.prepare('SELECT * FROM web_planning_workspace WHERE workspace_id=? AND owner_login_hash=? AND creation_key=?')
    .bind(s.env.WORKSPACE_ID,s.principalHash,key).first<ProjectRow>();
  if(prior){
    if(prior.creation_fingerprint!==fingerprint)fail('altered_replay',409);
    const saved=await readWork({...s,...prior},prior.continuation_work_id!);
    if(!saved.length)fail('project_creation_unavailable',503);
    return {project:view(s,prior),saved:saved[0],replayed:true};
  }
  const scope={workspace_id:s.env.WORKSPACE_ID,project_id:crypto.randomUUID(),author_ref:crypto.randomUUID()};
  const work_id=crypto.randomUUID();
  const payload=normalizePayload(scope,{goal:input.purpose,success_criteria:[next_action],non_goals:[]},[
    {text:input.judgment.text,source:input.judgment.source,provenance:'derived_interpretation',observed_at:null,label:'New candidate'},
    {text:unfinished,source:scope.author_ref,provenance:'user_declaration',observed_at:null,label:'Open question'},
    {text:next_action,source:scope.author_ref,provenance:'user_declaration',observed_at:null,label:'Next check'},
  ]);
  const revision=makeRevision(scope,work_id,{revision:0,fingerprint:null},key,payload,new Date().toISOString());
  // The mapping and its ordinary continuing work commit together. A repeated
  // key can never create another project, including simultaneous submissions.
  await s.DB.batch([
    s.DB.prepare(`INSERT INTO web_planning_workspace(singleton,workspace_id,project_id,author_ref,owner_login_hash,name,continuation_work_id,creation_key,creation_fingerprint)
      SELECT COALESCE(MAX(singleton),1)+1,?,?,?,?,?,?,?,? FROM web_planning_workspace WHERE true ON CONFLICT DO NOTHING`)
      .bind(scope.workspace_id,scope.project_id,scope.author_ref,s.principalHash,name,work_id,key,fingerprint),
    s.DB.prepare(`INSERT INTO web_planning_revision(workspace_id,project_id,work_id,revision,fingerprint,request_key,request_fingerprint,envelope)
      SELECT ?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM web_planning_workspace WHERE workspace_id=? AND project_id=? AND creation_key=?)`)
      .bind(scope.workspace_id,scope.project_id,work_id,1,revision.fingerprint,key,revision.request_fingerprint,canonical(revision),scope.workspace_id,scope.project_id,key),
  ]);
  const row=await s.DB.prepare('SELECT * FROM web_planning_workspace WHERE workspace_id=? AND owner_login_hash=? AND creation_key=?')
    .bind(s.env.WORKSPACE_ID,s.principalHash,key).first<ProjectRow>();
  if(!row)fail('project_creation_unavailable',503);
  if(row.creation_fingerprint!==fingerprint)fail('altered_replay',409);
  const saved=await readWork({...s,...row},row.continuation_work_id!);
  if(!saved.length)fail('project_creation_unavailable',503);
  return {project:view(s,row),saved:saved[0],replayed:row.project_id!==scope.project_id};
}
