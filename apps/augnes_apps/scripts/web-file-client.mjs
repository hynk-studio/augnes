import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile } from 'node:fs/promises';

export const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const fingerprint = /^sha256:[a-f0-9]{64}$/;
const accessToken = promisify(execFile);
const fail = message => { throw new Error(message); };

export async function openFileProject(origin = process.env.AUGNES_WEB_ORIGIN) {
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
  let csrf, project;
  async function request(path, body) {
    if (body !== undefined && !csrf) {
      const entry = await request('/');
      const html = await entry.text();
      csrf = html.match(/<meta name="csrf-token" content="([^"]+)"/)?.[1];
      const part = entry.headers.getSetCookie()[0]?.split(';')[0];
      if (!csrf || !part) fail('Private write session unavailable.');
      cookie += '; ' + part;
    }
    const response = await fetch(origin + path, { redirect: 'manual', signal: AbortSignal.timeout(15000),
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
  project = await (await request('/api/project')).json();
  if (![project.workspace_id,project.project_id].every(id => typeof id === 'string' && uuid.test(id))) fail('Private project identity unavailable.');
  async function tasks(cursor) {
    if (cursor && !uuid.test(cursor)) fail('Invalid task cursor.');
    return (await request('/api/works'+(cursor?'?cursor='+cursor:''))).json();
  }
  return { project, request, tasks };
}
export async function openFileTask(setupPath, expectedSetupDigest) {
  const selected = await readFile(setupPath);
  if (expectedSetupDigest && digest(selected) !== expectedSetupDigest) fail('Task setup changed. Reopen the intended connection.');
  const setup = JSON.parse(selected.toString('utf8'));
  if (setup.format !== 'augnes_web_file_task.v1' || typeof setup.work_id !== 'string' || !uuid.test(setup.work_id))
    fail('Choose the private Web task setup.');
  const { project, request } = await openFileProject(setup.origin);
  if (project.workspace_id !== setup.workspace_id || project.project_id !== setup.project_id) fail('Project selection changed.');
  const work_id = setup.work_id, root = '/api/work/'+work_id;
  async function list() {
    return (await request(root + '/exchanges')).json();
  }
  async function get(version, name) {
    const { items } = await list();
    const item = items.find(r => r.ref.revision === version);
    const index = item?.files.findIndex(f => f.name === name) ?? -1;
    if (index < 0 || index > 7 || !fingerprint.test(item.ref.fingerprint)) fail('Select a listed file and version.');
    const file = item.files[index];
    const path = root + '/exchange-files/' + version + '/' + item.ref.fingerprint.slice(7) + '/' + index;
    const response = await request(path);
    if (Number(response.headers.get('content-length')) !== file.bytes || file.bytes > 262144) fail('File size mismatch.');
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length !== file.bytes || digest(bytes) !== file.digest) fail('File digest mismatch.');
    return { item, file, bytes };
  }
  async function write(body, resolve = false) {
    return (await request(root + '/exchanges/' + (resolve ? 'resolve' : 'save'), body)).json();
  }
  return { project: project.name, work_id, setupDigest: digest(selected), list, get, write };
}
