import { prepareReturnDraft } from './planning-notes.mjs';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify, isDeepStrictEqual } from 'node:util';
import { readFile } from 'node:fs/promises';

export const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const fingerprint = /^sha256:[a-f0-9]{64}$/;
const accessToken = promisify(execFile);
const fail = message => { throw new Error(message); };

export async function openFileProject(origin = process.env.AUGNES_WEB_ORIGIN,projectId=process.env.AUGNES_WEB_PROJECT_ID) {
  if(projectId&&!uuid.test(projectId))fail('Choose a listed project ID.');
  return openFileConnection(origin,projectId?'/?project='+projectId:'/',undefined,projectId);
}
export async function openFileProjects(origin=process.env.AUGNES_WEB_ORIGIN){
  const {request}=await openFileConnection(origin,'/projects',{},undefined,true);
  return {list:async cursor=>(await request('/api/projects'+(cursor?'?cursor='+encodeURIComponent(cursor):''))).json(),
    create:async input=>(await request('/api/projects',input)).json(),
    open:projectId=>openFileProject(origin,projectId)};
}
async function openFileConnection(origin,entryPath='/',selectedScope,projectId,account=false) {
  const url = new URL(origin);
  const local = url.protocol === 'http:' && url.hostname === '127.0.0.1';
  if (url.origin !== origin || origin !== process.env.AUGNES_WEB_ORIGIN || (!local && url.protocol !== 'https:'))
    fail('Select the approved project origin and its downloaded task setup.');
  let cookie;
  if (local) cookie = process.env.AUGNES_WEB_FIXTURE_COOKIE;
  else {
    // Use the operator's existing Access session. Do not print tokens, follow redirects or start login.
    const { stdout } = await accessToken('cloudflared', ['access', 'token', '--app', origin], { timeout: 10000 })
      .catch(() => fail('An existing Cloudflare Access login is required for this project.'));
    const token = stdout.trim();
    if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) fail('Private Access session unavailable.');
    cookie = 'CF_Authorization=' + token;
  }
  if (!cookie || /[\r\n]/.test(cookie)) fail('Private project session unavailable.');
  let csrf, project=selectedScope;
  async function request(path, body) {
    if (body !== undefined && !csrf) {
      const entry = await request(entryPath);
      const html = await entry.text();
      csrf = html.match(/<meta name="csrf-token" content="([^"]+)"/)?.[1];
      const part = entry.headers.getSetCookie()[0]?.split(';')[0];
      if (!csrf || !part) fail('Private write session unavailable.');
      cookie += '; ' + part;
    }
    const response = await fetch(origin + path, { redirect: 'manual', signal: AbortSignal.timeout(60000),
      method: body === undefined ? 'GET' : 'POST',
      headers: { cookie, ...(projectId?{'x-web-planning-project':projectId}:{}),...(body === undefined ? {} : { origin, 'content-type': 'application/json', 'x-csrf-token': csrf }) },
      ...(body === undefined ? {} : { body: JSON.stringify(account?body:{ ...body, workspace_id:project.workspace_id, project_id:project.project_id }) }) });
    if (response.headers.get('x-web-planning-response') !== '1') fail('Private project login or supported Web deployment required.');
    if (!response.ok) {
      const refusal = (await response.json().catch(() => ({}))).error;
      fail(typeof refusal === 'string' && /^[a-z_]+$/.test(refusal) ? refusal : 'file_exchange_unavailable');
    }
    return response;
  }
  project ??= await (await request('/api/project')).json();
  if (!account&&![project.workspace_id,project.project_id].every(id => typeof id === 'string' && uuid.test(id))) fail('Private project identity unavailable.');
  async function tasks(cursor) {
    if (cursor && !uuid.test(cursor)) fail('Invalid task cursor.');
    return (await request('/api/works'+(cursor?'?cursor='+cursor:''))).json();
  }
  async function search(query,cursor) {
    if(typeof query!=='string' || !query.trim() || Buffer.byteLength(query)>256 || /[\u0000-\u001f\u007f]/u.test(query))
      fail('Use a literal phrase of 1–256 UTF-8 bytes without control characters.');
    query=query.trim();
    const page=await (await request('/api/works/search?q='+encodeURIComponent(query)+(cursor?'&cursor='+encodeURIComponent(cursor):''))).json();
    if(page.workspace_id!==project.workspace_id || page.project_id!==project.project_id || page.query!==query ||
      !Array.isArray(page.items) || page.items.length>10 || !Number.isSafeInteger(page.scanned) || page.scanned<0 ||
      (page.next!==null && typeof page.next!=='string') || page.status!==(page.next?'more':'exhausted') ||
      page.items.some(r=>!uuid.test(r.work_id)||!fingerprint.test(r.fingerprint)||!Number.isSafeInteger(r.revision)||r.revision<1||
        typeof r.selection!=='string'||!Array.isArray(r.matches)||!r.matches.length))fail('Search could not complete: invalid response.');
    return page;
  }
  async function inspectMatch(selection) {
    if(typeof selection!=='string'||selection.length>2500||!selection)fail('Choose a returned search selection.');
    const result=await (await request('/api/works/match?selection='+encodeURIComponent(selection))).json();
    if(result.observed?.workspace_id!==project.workspace_id || result.observed?.project_id!==project.project_id ||
      result.current?.work_id!==result.observed?.work_id || !['current','advanced'].includes(result.status))fail('Matched basis could not be confirmed.');
    return result;
  }
  return { project, request, tasks, search, inspectMatch,continuation:async()=>(await request('/api/project/continuation')).json() };
}
export async function openFileTask(setupPath, expectedSetupDigest) {
  const selected = await readFile(setupPath);
  if (expectedSetupDigest && digest(selected) !== expectedSetupDigest) fail('Task setup changed. Reopen the intended connection.');
  const setup = JSON.parse(selected.toString('utf8'));
  const participant=setup.format==='augnes_web_participation.v1';
  if ((!participant && setup.format !== 'augnes_web_file_task.v1') || typeof setup.work_id !== 'string' || !uuid.test(setup.work_id))
    fail('Choose the private Web task setup.');
  if(participant && (!uuid.test(setup.grant_id)||setup.request?.work_id!==setup.work_id||!fingerprint.test(setup.request?.fingerprint)))fail('Invalid participant setup.');
  const { project, request, tasks, search, inspectMatch } = participant?await openFileConnection(setup.origin,'/participate/'+setup.grant_id,{workspace_id:setup.workspace_id,project_id:setup.project_id,name:'Permitted file request'}):await openFileProject(setup.origin,setup.project_id);
  if (project.workspace_id !== setup.workspace_id || project.project_id !== setup.project_id) fail('Project selection changed.');
  const work_id = setup.work_id, root = participant?'/api/participation/'+setup.grant_id:'/api/work/'+work_id;
  const json = async (path, body) => (await request(root+path, body)).json();
  const planning = {
    async current() { return (await json('')).saved; },
    tasks,
    search, inspectMatch,
    async history(sourceWork=work_id) {
      if(typeof sourceWork!=='string' || !uuid.test(sourceWork))fail('Select a listed work.');
      return (await (await request('/api/work/'+sourceWork+'/history?view=notes')).json()).revisions;
    },
    capacity(expected, draft) { const {definition,notes,material_edits}=draft;
      return json('/capacity',{expected,definition,notes,material_edits,check_id:crypto.randomUUID()}); },
    async prepare(expected, draft) {
      const input=structuredClone(draft);
      const {ticket}=await json('/ticket',{...input,expected});
      return {...input,ticket};
    },
    save(pending) { return json('/save',pending); },
    resolve(pending) { return json('/resolve',pending); },
  };
  async function list() {
    const state=await (await request(root + (participant?'':'/exchanges'))).json();
    if(participant && (state.work_id!==work_id||state.workspace_id!==setup.workspace_id||state.project_id!==setup.project_id||['work_id','revision','fingerprint'].some(k=>state.items?.[0]?.ref?.[k]!==setup.request[k])))fail('Participant request selection changed.');
    return state;
  }
  async function locate(version, name) {
    const { items } = await list();
    const item = items.find(r => r.ref.revision === version);
    const index = item?.files.findIndex(f => f.name === name) ?? -1;
    if (index < 0 || index > 7 || !fingerprint.test(item.ref.fingerprint)) fail('Select a listed file and version.');
    const file = item.files[index];
    const path = participant?file.download:root + '/exchange-files/' + version + '/' + item.ref.fingerprint.slice(7) + '/' + index;
    if(participant && !new RegExp('^'+root+'/files/'+version+'/'+item.ref.fingerprint.slice(7)+'/[0-7]$').test(path))fail('Participant file selection changed.');
    return {path,item,file};
  }
  async function inspectReturn(version,name,after=null) {
    const {item,file}=await locate(version,name);if(item.kind!=='return')fail('Choose a returned version.');
    const index=item.files.findIndex(f=>f.name===name);
    const view=await json('/inspect-return',{returned:item.ref,index,after});
    if(view.returned?.ref?.fingerprint!==item.ref.fingerprint||view.request?.ref?.fingerprint!==item.basis?.fingerprint||
      view.selection?.index!==index||view.selection.original?.file?.digest!==file.digest||view.current?.ref?.work_id!==work_id)fail('Returned basis could not be confirmed.');
    return view;
  }
  const projectJson=async(path,body)=>(await request(path,body)).json();
  async function prepareReturn(selection,judgment,destination){
    if(selection?.returned?.work_id!==work_id)fail('Return belongs to another selected task.');
    return prepareReturnDraft(projectJson,selection,judgment,destination);
  }
  async function sendReturn(pending,resolve=false){
    if(!uuid.test(pending?.work_id)||pending.body?.return_choice?.selection?.returned?.work_id!==work_id)fail('Pending return belongs to a different task.');
    return projectJson('/api/work/'+pending.work_id+(resolve?'/resolve':'/save'),pending.body);
  }
  async function recordedOrigin(version){
    const d=(await list()).decisions?.find(d=>d.destination.revision===version);
    if(!d)fail('Choose a listed decision revision.');
    const {returned,index}=d;
    const v=await projectJson('/api/work/'+returned.work_id+'/inspect-return',{returned,index,after:null});
    if(v.selection.returned.fingerprint!==returned.fingerprint||v.request.ref.fingerprint!==d.request.fingerprint||
       v.selection.original.file.digest!==d.original.file.digest||v.selection.original.file.name!==d.original.file.name)fail('Recorded origin mismatch.');
    return v;
  }
  async function readOrigin(version,offset=0,find=''){
    const v=await recordedOrigin(version),ref=v.selection.returned,f=v.returned.files[v.selection.index];
    const path='/api/work/'+ref.work_id+'/exchange-files/'+ref.revision+'/'+ref.fingerprint.slice(7)+'/'+v.selection.index;
    if(f.download!==path)fail('Recorded origin mismatch.');
    const page=await projectJson(path+'/text',{offset,find});
    if(page.ref?.fingerprint!==ref.fingerprint||page.file?.digest!==f.digest||page.total!==f.bytes)fail('Original content mismatch.');return page;
  }
  async function savedFile(version,name){
    const history=await (await request(root+'/history')).json(),r=history.revisions.find(r=>r.revision===version),index=r?.files?.findIndex(f=>f.name===name)??-1;
    if(!r||index<0||r.work_id!==work_id||!fingerprint.test(r.fingerprint))fail('Choose a listed saved revision and file name.');
    const file=r.files[index],bytes=Buffer.from(await (await request(root+'/files/'+version+'/'+r.fingerprint.slice(7)+'/'+index)).arrayBuffer());
    if(bytes.length!==file.bytes||digest(bytes)!==file.digest)fail('Saved output digest mismatch.');
    let text=null;try{text=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);}catch{};
    const decision=(await list()).decisions?.find(d=>d.destination.revision===version&&d.output?.name===name)??null;
    return {decision,revision:{work_id,revision:version,fingerprint:r.fingerprint},file,data:bytes.toString('base64'),text};
  }
  async function evidenceFile(version,name,kind='file'){
    if(participant)fail('Owner task setup required.');
    const history=await projectJson(root+'/history'),r=history.revisions.find(r=>r.revision===version);
    const files=kind==='return'&&r?.exchange?.kind==='return'?r.exchange.artifacts.map(a=>a.file):kind==='file'?r?.files:[];
    const index=files?.findIndex(f=>f.name===name)??-1;
    if(!r||index<0)fail('Choose an exact saved file from history or list.');
    return {ref:{work_id,revision:r.revision,fingerprint:r.fingerprint},kind,index};
  }
  async function inspectUse(version,evidence=null){
    if(participant)fail('Owner task setup required.');
    const d=(await list()).decisions?.find(d=>d.destination.revision===version&&d.output);
    if(!d)fail('Choose a listed existing use revision.');
    return json('/inspect-use',{use:d.destination,evidence});
  }
  async function prepareReassessment(selection,judgment){
    if(participant||selection?.use?.work_id!==work_id)fail('Choose this consuming work.');
    return json('/reassessment-preview',{intent:{selection,decision:judgment.decision,rationale:judgment.rationale,limits:judgment.limits??'',
      reported_check:judgment.reported_check??'',context:judgment.context,next_action:judgment.next_action,name:judgment.name??null,text:judgment.text??null}});
  }
  async function sendReassessment(pending,resolve=false){
    if(participant||pending?.work_id!==work_id||pending.intent?.selection?.use?.work_id!==work_id)fail('Pending reassessment belongs to a different task.');
    return json(resolve?'/reassessment-resolve':'/reassessment-save',resolve?{ticket:pending.ticket}:{ticket:pending.ticket,intent:pending.intent});
  }
  async function readPage(version,name,offset=0,find=''){
    const {path,item,file}=await locate(version,name);
    const page=await (await request(path+'/text',{offset,find})).json();
    if(page.workspace_id!==project.workspace_id || page.project_id!==project.project_id || page.ref?.work_id!==work_id || page.ref.fingerprint!==item.ref.fingerprint || page.ref.revision!==version ||
      page.file?.name!==name || page.file.digest!==file.digest || page.offset!==offset || page.total!==file.bytes ||
      !Number.isSafeInteger(page.start) || !Number.isSafeInteger(page.end) || page.start<offset || page.end<page.start ||
      page.end>file.bytes || page.end-page.start>8192 || Buffer.byteLength(page.text)!==page.end-page.start ||
      page.next!==(page.end===file.bytes?null:page.end))fail('Text page identity or extent mismatch.');
    return page;
  }
  async function get(version,name) {
    const {path,item,file}=await locate(version,name);
    const response = await request(path);
    if (Number(response.headers.get('content-length')) !== file.bytes || file.bytes > 6291456) fail('File size mismatch.');
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length !== file.bytes || digest(bytes) !== file.digest) fail('File digest mismatch.');
    return { item, file, bytes };
  }
  async function write(body, resolve = false) {
    return (await request(root + (participant?'/':'/exchanges/') + (resolve ? 'resolve' : 'save'), body)).json();
  }
  async function feedback(cursor){if(!participant)fail('Choose a participant setup.');return (await request(root+'/feedback'+(cursor?'?cursor='+encodeURIComponent(cursor):''))).json();}
  const cooperation={
    async projects(cursor){if(!participant)fail('Choose a participant setup.');await list();return json('/projects'+(cursor?'?cursor='+encodeURIComponent(cursor):''));},
    async works(destination_project_id,cursor=''){await list();return json('/project-works',{destination_project_id,cursor});},
    async retain(input,resolve=false){await list();return json(resolve?'/retain-resolve':'/retain',{...input,request:setup.request});},
    async returnSaved(input,resolve=false){await list();return json(resolve?'/project-return-resolve':'/project-return',{...input,request:setup.request});},
  };
  const participation={
    async list(cursor){
      if(participant)fail('Owner task setup required.');
      return json('/participation'+(cursor?'?cursor='+encodeURIComponent(cursor):''));
    },
    async create(input){
      if(participant)fail('Owner task setup required.');
      return json('/participation/create',input);
    },
    // A failed or incomplete read cannot be interpreted as absence. Resolve
    // every page before permitting the same, caller-retained operation again.
    async resolve(input){
      let cursor;
      do {
        const page=await this.list(cursor);
        const grant=page.grants.find(g=>g.id===input.grant_id);
        if(grant){
          const d=grant.disclosure;
          const same=isDeepStrictEqual;
          if(grant.recipient!==input.recipient || grant.expires!==input.expires ||
            !same(d.request,input.request)||!same(d.expected,input.expected)||d.brief!==input.brief||
            d.next_action!==input.next_action||!same(d.files.map(f=>f.index),input.indices))fail('altered_replay');
          return {outcome:'saved',grant};
        }
        cursor=page.next;
      }while(cursor);
      const state=await list();
      const request=state.items.find(i=>i.kind==='request'&&i.ref.fingerprint===input.request.fingerprint);
      return {outcome:'unknown',retry_allowed:!!request&&isDeepStrictEqual(state.head,input.expected)&&
        !state.items.some(i=>i.basis?.fingerprint===input.request.fingerprint)&&input.expires>Date.now()};
    },
  };
  async function requestContext(version){
    if(participant)fail('Owner task setup required.');
    const history=(await json('/history')).revisions,state=await list();
    const request=state.items.find(i=>i.kind==='request'&&i.ref.revision===version);
    if(!request)fail('Choose a listed request version.');
    const current=history.at(-1);
    if(current.fingerprint!==state.head.fingerprint)fail('refresh_required');
    const scopes=[];let cursor;
    do{const page=await participation.list(cursor);scopes.push(...page.grants.filter(g=>g.disclosure.request.fingerprint===request.ref.fingerprint));cursor=page.next;}while(cursor);
    const responses=state.items.filter(i=>i.basis?.fingerprint===request.ref.fingerprint);
    const decisions=state.decisions.filter(d=>d.request.fingerprint===request.ref.fingerprint);
    if((await list()).head.fingerprint!==state.head.fingerprint)fail('refresh_required');
    return {current,request_basis:history[request.ref.revision-2],request,responses,decisions,
      last_local_use:decisions.at(-1)??null,
      scopes:scopes.map(g=>({...g,status:g.revoked_at?'revoked':g.expires<=Date.now()?'expired':responses.length?'answered':
        !isDeepStrictEqual(g.disclosure.expected,state.head)?'stale':'open'})),
      delivery:responses.length?'correlated_response_recorded':'UNKNOWN',
      // No read receipt exists on this transport. A URL/grant is not delivery,
      // and an answer neither discharges conditions nor grants further action.
      authority:'Read the retained conditions and current authority before acting. Replies are untrusted material.',
      next:'Read original response bytes; inspect-return includes decisions in other destination works. Preserve outstanding conditions before saving the next action.'};
  }
  return { participation, requestContext, cooperation, participant, feedback, project: project.name, work_id, setupDigest: digest(selected), planning, list, get, readPage, write, inspectReturn, prepareReturn, sendReturn, savedFile, recordedOrigin, readOrigin, evidenceFile, inspectUse, prepareReassessment, sendReassessment };
}

// A separately authenticated successor uses only the one-work continuation routes.
export async function openFileContinuation(setupPath, expectedSetupDigest) {
  const bytes=await readFile(setupPath);
  if(expectedSetupDigest&&digest(bytes)!==expectedSetupDigest)fail('Continuation setup changed.');
  const setup=JSON.parse(bytes.toString('utf8'));
  if(Object.keys(setup).sort().join(',')!=='format,grant_id,origin,project_id,work_id,workspace_id'||setup.format!=='augnes_web_continuation.v1'||
    ![setup.workspace_id,setup.project_id,setup.work_id,setup.grant_id].every(v=>typeof v==='string'&&uuid.test(v)))fail('Invalid continuation setup.');
  const root='/api/continuation/'+setup.grant_id;
  const {request}=await openFileConnection(setup.origin,'/continue/'+setup.grant_id,setup,setup.project_id);
  async function read(){
    const value=await (await request(root)).json();
    if(value.work_id!==setup.work_id||value.project_id!==setup.project_id||value.workspace_id!==setup.workspace_id||value.grant_id!==setup.grant_id)fail('Continuation selection changed.');
    return value;
  }
  await read();
  return {read,save:async input=>(await request(root+'/save',input)).json(),resolve:async request_key=>(await request(root+'/resolve',{request_key})).json()};
}
