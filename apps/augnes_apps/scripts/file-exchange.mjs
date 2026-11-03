import { constants as fs } from 'node:fs';
import { open, readFile, unlink, link, mkdir, readdir, lstat, rmdir } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { digest, openFileTask, openFileProject } from './web-file-client.mjs';

const [setup, action, ...args] = process.argv.slice(2);
const pendingDir = setup + '.pending';
const print = value => console.log(JSON.stringify(value, null, 2));
async function selectedFile(path) {
  const input = await open(path, fs.O_RDONLY | fs.O_NOFOLLOW | fs.O_NONBLOCK);
  try {
    const stat = await input.stat();
    if (!stat.isFile() || stat.size > 262144) throw new Error('Select a regular file of at most 256 KiB.');
    const buffer = Buffer.alloc(stat.size + 1);
    let count = 0;
    while (count < buffer.length) {
      const { bytesRead } = await input.read(buffer, count, buffer.length - count);
      if (!bytesRead) break;
      count += bytesRead;
    }
    if (count !== stat.size) throw new Error('Selected file changed while reading.');
    const media_type = ({'.md':'text/markdown','.markdown':'text/markdown','.txt':'text/plain','.zip':'application/zip'})[extname(path).toLowerCase()] ?? null;
    const bytes = buffer.subarray(0,count);
    return { name: basename(path), media_type, bytes: count, digest: digest(bytes), data: bytes.toString('base64') };
  } finally { await input.close(); }
}
function draftSummary(body) {
  return { kind: body.kind, basis: body.basis, message: body.message, next_action: body.next_action,
    files: body.files.map(({ data, ...file }) => file) };
}
// Only an explicitly chosen, new private folder receives local files. The request
// manifest is written last. A failed export never consumes its pending journal.
async function recoverDraft(directory, body) {
  if (!Array.isArray(body.files) || !body.files.length || body.files.length > 8 || body.files.reduce((n,f) => n + f.bytes, 0) > 524288) throw new Error('Invalid pending file selection. Its journal is retained.');
  const entries = body.files.map(f => {
    if (!Number.isSafeInteger(f.bytes) || f.bytes < 0 || f.bytes > 262144 || typeof f.data !== 'string' || f.data.length !== 4 * Math.ceil(f.bytes / 3)) throw new Error('Invalid pending file bytes. Its journal is retained.');
    if (typeof f.name !== 'string' || basename(f.name) !== f.name || !f.name || /[\\/\x00-\x1f]/.test(f.name) || f.name === '.' || f.name === '..')
      throw new Error('The pending file has an unsafe name. Its journal is retained.');
    const bytes = Buffer.from(f.data, 'base64');
    if (bytes.length !== f.bytes || digest(bytes) !== f.digest) throw new Error('The pending file failed verification. Its journal is retained.');
    return [f.name, bytes];
  });
  await mkdir(directory, { mode: 0o700 });
  const filesDir = join(directory, 'files'), written = [];
  try {
    await mkdir(filesDir, { mode: 0o700 });
    for (const [name, bytes] of entries) {
      const file = join(filesDir, name);
      const handle = await open(file, 'wx', 0o600);
      written.push(file);
      try { await handle.writeFile(bytes); await handle.sync(); } finally { await handle.close(); }
    }
    const manifest = join(directory, 'request.json');
    const handle = await open(manifest, 'wx', 0o600);
    written.push(manifest);
    try { await handle.writeFile(JSON.stringify(draftSummary(body), null, 2)); await handle.sync(); } finally { await handle.close(); }
  } catch (error) {
    for (const file of written.reverse()) await unlink(file).catch(()=>{});
    await rmdir(filesDir).catch(()=>{}); await rmdir(directory).catch(()=>{}); throw error;
  }
}
async function run() {
  if (setup === 'tasks' || setup === 'select') {
    const {project,tasks} = await openFileProject();
    if (setup === 'tasks') return {project:project.name,...await tasks(action)};
    if (!action || args.length !== 1) throw new Error('Use select "Exact task title" NEW_SETUP.json');
    let match, cursor;
    do {
      const page = await tasks(cursor);
      for (const item of page.items.filter(t=>t.goal===action)) {
        if (match) throw new Error('Several tasks have this title. Open the intended one in the browser and download its setup.');
        match = item;
      }
      cursor = page.next;
    } while (cursor);
    if (!match) throw new Error('No matching saved task. Open the private workspace to choose or create it.');
    const selected = {format:'augnes_web_file_task.v1',origin:process.env.AUGNES_WEB_ORIGIN,workspace_id:project.workspace_id,project_id:project.project_id,work_id:match.work_id};
    const target = await open(args[0],'wx',0o600);
    try { await target.writeFile(JSON.stringify(selected)); } finally { await target.close(); }
    return {project:project.name,task:match.goal,revision:match.revision};
  }
  if (!setup) throw new Error('List tasks or choose a private task setup.');
  const client = await openFileTask(setup);
  if (action === 'context') return client.planning.current();
  if (action === 'history') {
    const revisions=await client.planning.history();
    if(!args.length)return revisions.map(({revision,fingerprint,recorded_at,definition})=>({revision,fingerprint,recorded_at,goal:definition.goal}));
    const match=revisions.find(r=>String(r.revision)===args[0]);
    if(args.length!==1 || !match)throw Error('Choose a listed revision of this task.');
    return match;
  }
  if (action === 'list') return { project: client.project, ...await client.list() };
  if (action === 'get' && args.length === 3) {
    const { file, bytes } = await client.get(Number(args[0]), args[1]);
    const output = await open(args[2], 'wx', 0o600);
    try { await output.writeFile(bytes); } catch (error) { await unlink(args[2]); throw error; } finally { await output.close(); }
    return file;
  }
  await mkdir(pendingDir,{recursive:true,mode:0o700});
  const directory = await lstat(pendingDir);
  if (!directory.isDirectory() || (directory.mode & 0o077)) throw new Error('Choose a private task setup directory.');
  const pending = (await readdir(pendingDir)).filter(name=>/^[a-f0-9-]{36}$/.test(name));
  let operation, journal;
  if (['check', 'retry', 'recover'].includes(action)) {
    if (action === 'recover' && !args[0]) throw new Error('Use recover NEW_DIRECTORY after checking an unrecorded, stale save.');
    const selected = (action === 'recover' ? args[1] : args[0]) ?? (pending.length === 1 ? pending[0] : undefined);
    if (!pending.includes(selected)) throw new Error('Select a pending request: ' + pending.join(', '));
    journal = join(pendingDir,selected);
    operation = JSON.parse(await readFile(journal, 'utf8'));
  } else {
    if (pending.length) throw new Error('Check the previous pending file save first.');
    const state = await client.list();
    const isReturn = action === 'return';
    const basis = isReturn ? state.items.find(r => r.kind === 'request' && r.ref.revision === Number(args.shift()))?.ref : null;
    if (isReturn && !basis) throw new Error('Select a listed request version.');
    const message = args.shift(), next_action = isReturn ? args.shift() : '';
    if ((!isReturn && action !== 'request') || !message || (isReturn && !next_action) || !args.length || args.length > 8)
      throw new Error('Use list, get VERSION NAME NEW_PATH, request MESSAGE FILE..., return REQUEST_VERSION MESSAGE NEXT FILE..., check or retry.');
    const files = [];
    for (const path of args) files.push(await selectedFile(path));
    operation = { work_id: client.work_id, setup_digest: client.setupDigest, body: { expected: state.head, request_key: randomUUID(),
      kind: isReturn ? 'return' : 'request', basis, message, next_action, files } };
    journal = join(pendingDir,operation.body.request_key);
    const tmp = journal + '.tmp';
    const output = await open(tmp, 'wx', 0o600);
    try {
      await output.writeFile(JSON.stringify(operation)); await output.sync();
      await link(tmp, journal).catch(error => { if (error.code === 'EEXIST') throw new Error('Check the previous pending file save first.'); throw error; });
    } finally { await output.close(); await unlink(tmp); }
  }
  if (operation.work_id !== client.work_id || operation.setup_digest !== client.setupDigest) throw new Error('Pending save belongs to a different task.');
  const result = await client.write(operation.body, action === 'check' || action === 'recover');
  // The private journal stays available after refusal or ambiguous transmission.
  const superseded = result.outcome === 'unknown' && result.head.revision > operation.body.expected.revision;
  if (superseded) {
    result.draft = draftSummary(operation.body);
    result.next_action = 'This save was not recorded. Review the current task, then use recover NEW_DIRECTORY to keep its request and exact files before a new submission.';
    if (action === 'recover') {
      await recoverDraft(args[0], operation.body);
      result.next_action = 'The original request is in request.json and its files are in files/. Review the current task before sending again.';
    }
  } else if (action === 'recover' && result.outcome !== 'saved') {
    result.next_action = 'The save is still eligible on its original version. Check it before retrying the exact pending request.';
  }
  if (result.outcome === 'saved' || (superseded && action === 'recover')) await unlink(journal).catch(error => { if (error.code !== 'ENOENT') throw error; });
  return result;
}
try { print(await run()); } catch (error) {
  console.error(error.code ? 'File operation failed (' + error.code + '). Check the task and destination.' : error.message);
  process.exitCode = 1;
}
