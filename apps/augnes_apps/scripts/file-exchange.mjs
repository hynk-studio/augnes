import { constants as fs } from 'node:fs';
import { open, readFile, unlink, link, mkdir, readdir, lstat } from 'node:fs/promises';
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
  if (action === 'check' || action === 'retry') {
    const selected = args[0] ?? (pending.length === 1 ? pending[0] : undefined);
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
  const result = await client.write(operation.body, action === 'check');
  // The private journal stays available after refusal or ambiguous transmission.
  const superseded = result.outcome === 'unknown' && result.head.revision > operation.body.expected.revision;
  if (superseded) result.next_action = 'The task advanced without this request. Review the current version and resubmit your original files deliberately.';
  if (result.outcome === 'saved' || superseded) await unlink(journal).catch(error => { if (error.code !== 'ENOENT') throw error; });
  return result;
}
try { print(await run()); } catch (error) {
  console.error(error.code ? 'File operation failed (' + error.code + '). Check the task and destination.' : error.message);
  process.exitCode = 1;
}
