import { prepareReturnDraft } from './planning-notes.mjs';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile } from 'node:fs/promises';

export const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const fingerprint = /^sha256:[a-f0-9]{64}$/;
const accessToken = promisify(execFile);
const fail = message => { throw new Error(message); };

export async function openFileProject(origin = process.env.AUGNES_WEB_ORIGIN) { return openFileConnection(origin); }
async function openFileConnection(origin,entryPath='/',selectedScope) {
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
      headers: { cookie, ...(body === undefined ? {} : { origin, 'content-type': 'application/json', 'x-csrf-token': csrf }) },
      ...(body === undefined ? {} : { body: JSON.stringify({ ...body, workspace_id:project.workspace_id, project_id:project.project_id }) }) });
    if (response.headers.get('x-web-planning-response') !== '1') fail('Private project login or supported Web deployment required.');
    if (!response.ok) {
      const refusal = (await response.json().catch(() => ({}))).error;
      fail(typeof refusal === 'string' && /^[a-z_]+$/.test(refusal) ? refusal : 'file_exchange_unavailable');
    }
    return response;
  }
  project ??= await (await request('/api/project')).json();
  if (![project.workspace_id,project.project_id].every(id => typeof id === 'string' && uuid.test(id))) fail('Private project identity unavailable.');
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
  return { project, request, tasks, search, inspectMatch };
}
export async function openFileTask(setupPath, expectedSetupDigest) {
  const selected = await readFile(setupPath);
  if (expectedSetupDigest && digest(selected) !== expectedSetupDigest) fail('Task setup changed. Reopen the intended connection.');
  const setup = JSON.parse(selected.toString('utf8'));
  const participant=setup.format==='augnes_web_participation.v1';
  if ((!participant && setup.format !== 'augnes_web_file_task.v1') || typeof setup.work_id !== 'string' || !uuid.test(setup.work_id))
    fail('Choose the private Web task setup.');
  if(participant && (!uuid.test(setup.grant_id)||setup.request?.work_id!==setup.work_id||!fingerprint.test(setup.request?.fingerprint)))fail('Invalid participant setup.');
  const { project, request, tasks, search, inspectMatch } = participant?await openFileConnection(setup.origin,'/participate/'+setup.grant_id,{workspace_id:setup.workspace_id,project_id:setup.project_id,name:'Permitted file request'}):await openFileProject(setup.origin);
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
    const decision=(await list()).decisions?.find(d=>d.destination.revision===version&&d.output?.name===name);
    if(!decision)fail('Choose a listed destination revision and output name.');
    const ref=decision.destination;
    if(ref.work_id!==work_id||!fingerprint.test(ref.fingerprint)||!decision.download?.startsWith(root+'/files/'+version+'/'+ref.fingerprint.slice(7)+'/'))fail('Saved output identity mismatch.');
    const bytes=Buffer.from(await (await request(decision.download)).arrayBuffer());
    if(bytes.length!==decision.output.bytes||digest(bytes)!==decision.output.digest)fail('Saved output digest mismatch.');
    let text=null;try{text=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);}catch{};
    return {decision,data:bytes.toString('base64'),text};
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
  return { participant, feedback, project: project.name, work_id, setupDigest: digest(selected), planning, list, get, readPage, write, inspectReturn, prepareReturn, sendReturn, savedFile, recordedOrigin, readOrigin };
}
