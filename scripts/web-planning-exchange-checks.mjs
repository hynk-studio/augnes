import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdir, readFile, readdir, writeFile, symlink } from 'node:fs/promises';
import path from 'node:path';
import { runCanonicalChild, canonicalChildAcceptanceFailure } from './canonical-child-runner.mjs';
import { fixtureScope } from './web-planning-local-runtime.mjs';
import { headBinding } from '../apps/web_planning/src/contract.ts';

const apps = path.resolve('apps/augnes_apps');
const appRequire = createRequire(path.join(apps, 'package.json'));
const { Client } = appRequire('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = appRequire('@modelcontextprotocol/sdk/client/stdio.js');
const sha = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');

export async function checkFileExchanges({ start, client, newWork, save, root, passed }) {
  const server = await start('file-exchanges'), owner = await client(server);
  const makeTask = async goal => (await save(owner, await newWork(owner, {goal, success_criteria:['Return the checked file'],non_goals:[]},[]))).data.saved;
  const task = await makeTask('Delivery check'), other = await makeTask('Separate reading task');
  const route = '/api/work/' + task.work_id + '/exchanges';
  const dir = path.join(root, 'exchange-clients'); await mkdir(dir);
  const setup = path.join(dir, 'selected-task.json');
  const env = {...process.env,AUGNES_WEB_ORIGIN:server.origin,AUGNES_WEB_FIXTURE_COOKIE:'web_planning_local='+server.env.LOCAL_SESSION};
  const original = Buffer.from('\uFEFF# 검토 메모\r\n\r\n대상 7건 중 2건은 보류.\r\n다음 단계: 수량 확인.\r\n');
  const originalName = '인계-검토.md', originalPath = path.join(dir,originalName);
  // A stored ZIP containing counts.bin (00 07 02 05 ff). Keep it opaque to the product.
  const zipName = '계수-자료.zip', zip = Buffer.from('UEsDBBQAAAAAAAAAIVACAAQIBQAAAAUAAAAKAAAAY291bnRzLmJpbgAHAgX/UEsBAhQDFAAAAAAAAAAhUAIABAgFAAAABQAAAAoAAAAAAAAAAAAAAIABAAAAAGNvdW50cy5iaW5QSwUGAAAAAAEAAQA4AAAALQAAAAAA','base64');
  await writeFile(originalPath,original); await writeFile(path.join(dir,zipName),zip);
  async function cli(label, args, expectSuccess=true, selection=setup) {
    let stdout='', stderr='';
    const result=await runCanonicalChild({suite:'web-planning',label:'file-client-'+label,command:process.execPath,cwd:apps,env,
      args:['scripts/file-exchange.mjs',selection,...args],timeoutMs:10000, stdout:{write:data=>{stdout+=data;}},stderr:{write:data=>{stderr+=data;}}});
    if(expectSuccess){ assert.equal(canonicalChildAcceptanceFailure(result,{requireNaturalExit:true}),null,stderr);return JSON.parse(stdout); }
    assert.equal(result.exit_code,1);return stderr;
  }
  const discovered=await cli('tasks',[],true,'tasks');assert.ok(discovered.items.some(x=>x.goal===task.definition.goal));
  await cli('select',[task.definition.goal,setup],true,'select');
  const alias = path.join(dir,'alias.md'); await symlink(originalPath,alias);
  await cli('symlink',['request','Read selected file',alias],false);
  // A rejected message must not block the next send on the same selected setup.
  const longText='📝'.repeat(501), pendingDir=setup+'.pending';
  assert.match(await cli('invalid-message',['request',longText,originalPath],false),/message.*500/);
  assert.deepEqual(await readdir(pendingDir),[]);
  // Reproduce the pre-fix journal: even /resolve rejects its text before looking up the key.
  const oldBody={expected:headBinding(task),request_key:randomUUID(),kind:'request',basis:null,
    message:longText,next_action:'',files:[{name:originalName,bytes:original.length,digest:sha(original),
      media_type:'text/markdown',data:original.toString('base64')}]};
  const oldOperation={work_id:task.work_id,setup_digest:sha(await readFile(setup)),body:oldBody};
  const oldJournal=path.join(pendingDir,oldBody.request_key);
  await writeFile(oldJournal,JSON.stringify(oldOperation),{mode:0o600});
  assert.equal((await cli('refused-check',['check'])).outcome,'invalid_draft');
  assert.match(await cli('refused-retry',['retry'],false),/recover/);
  await cli('refused-recovery-existing',['recover',dir],false);
  assert.deepEqual(JSON.parse(await readFile(oldJournal)),oldOperation);
  const rescued=path.join(dir,'refused-text-draft');
  assert.equal((await cli('refused-recovery',['recover',rescued])).outcome,'invalid_draft');
  const manifest=JSON.parse(await readFile(path.join(rescued,'request.json')));
  assert.equal(manifest.message,longText);assert.equal(manifest.request_key,oldBody.request_key);
  assert.deepEqual(manifest.expected,oldBody.expected);assert.equal(manifest.work_id,task.work_id);
  assert.deepEqual(await readFile(path.join(rescued,'files',originalName)),original);
  assert.deepEqual(await readdir(pendingDir),[]);assert.equal((await owner.request(route)).data.items.length,0);
  // Count Unicode code points as the server does, not UTF-16 code units.
  const request = await cli('request',['request','📝'.repeat(500),originalPath,path.join(dir,zipName)]);
  assert.equal(request.outcome,'saved');
  const sent = request.item; assert.equal(sent.ref.revision,2);
  assert.match(await cli('invalid-return-action',['return','2','Reviewed',longText,originalPath],false),/next action.*500/);
  assert.deepEqual(await readdir(pendingDir),[]);
  // An already recorded key is never discarded based on a differently shaped local draft.
  const alternate=path.join(dir,'saved-key.json');await cli('select-for-saved-key',[task.definition.goal,alternate],true,'select');
  const collision={...oldOperation,setup_digest:sha(await readFile(alternate)),body:{...oldBody,request_key:sent.request_key}};
  await mkdir(alternate+'.pending',{mode:0o700});const collisionPath=path.join(alternate+'.pending',sent.request_key);
  await writeFile(collisionPath,JSON.stringify(collision),{mode:0o600});
  assert.match(await cli('refuse-saved-key',['recover',path.join(dir,'saved-key-copy')],false,alternate),/saved exchange uses this request key/);
  assert.deepEqual(JSON.parse(await readFile(collisionPath)),collision);
  assert.equal(sent.files[0].digest,sha(original)); assert.equal(sent.files[0].media_type,'text/markdown');
  assert.equal((await owner.request('/api/work/'+other.work_id+'/exchanges')).data.items.length,0);
  assert.equal(JSON.stringify((await owner.request(route)).data).includes(original.toString('base64')),false);
  const host = new Client({name:'scripted-file-recipient',version:'1'});
  const transport = new StdioClientTransport({command:process.execPath,args:[path.join(apps,'scripts/file-review-stdio.mjs'),setup],env,stderr:'pipe'});
  let returned;
  try {
    await host.connect(transport);
    const call = async (name,args) => { const r=await host.callTool({name,arguments:args});assert.ok(!r.isError,r.content[0]?.text);return JSON.parse(r.content[0].text); };
    const inbox = await call('list_file_requests',{});assert.equal(inbox.items.length,1);assert.equal(inbox.task,task.definition.goal);
    const received = await call('read_exchange_text',{version:sent.ref.revision,filename:originalName});
    const receivedBytes = Buffer.from(received.text,'utf8');
    assert.deepEqual(receivedBytes,original);
    const [,total,held] = received.text.match(/대상 (\d+)건 중 (\d+)건은 보류/);
    const edit = {version:sent.ref.revision,filename:originalName,source_digest:sha(receivedBytes),save_base:received.save_base,
      find:'수량 확인.',replacement:'진행 '+(Number(total)-Number(held))+'건, 보류 '+held+'건.',review:'보류를 제외한 수량을 계산했습니다.',next_action:'보류 2건의 사유 확인'};
    returned=(await call('return_text_edit',edit)).item;
    assert.deepEqual(returned.basis,sent.ref);
    assert.deepEqual((await call('return_text_edit',{...edit,check_only:true})).item,returned);
    assert.deepEqual((await call('return_text_edit',edit)).item,returned);
    assert.ok((await host.callTool({name:'return_text_edit',arguments:{...edit,replacement:'conflicting edit'}})).isError);
    assert.ok((await host.callTool({name:'read_exchange_text',arguments:{version:sent.ref.revision,filename:zipName}})).isError);
  } finally { await host.close(); }

  const get = async (version,name,dest) => {
    await cli('get-'+version+'-'+dest,['get',String(version),name,path.join(dir,dest)]);
    return readFile(path.join(dir,dest));
  };
  const originalRead = await get(2,originalName,'source.md'), returnedRead = await get(3,originalName,'return.md');
  await cli('existing-output',['get','2',originalName,path.join(dir,'return.md')],false);
  assert.deepEqual(originalRead,original);assert.deepEqual(await get(2,zipName,'bytes.zip'),zip);
  const expected=Buffer.from(original.toString().replace('수량 확인.','진행 5건, 보류 2건.'));
  assert.deepEqual(returnedRead,expected);
  const next=returnedRead.toString().match(/진행 (\d+)건, 보류 (\d+)건/);
  assert.deepEqual([Number(next[1]),Number(next[2])],[5,2]);
  const list=await cli('reopen',['list']);assert.deepEqual(list.items.map(x=>x.ref.revision),[2,3]);
  assert.equal(list.items[1].next_action,'보류 2건의 사유 확인');
  console.log(JSON.stringify({file_exchange_evidence:{client:'scripted SDK stdio recipient, separate CLI processes',task:task.work_id,original:{name:originalName,bytes:originalRead.length,sha256:sha(originalRead),utf8:originalRead.toString()},returned:{name:originalName,bytes:returnedRead.length,sha256:sha(returnedRead),utf8:returnedRead.toString()},zip:{name:zipName,bytes:zip.length,sha256:sha(zip)},basis:returned.basis,return_ref:returned.ref,fresh_continuation:{proceed:5,hold:2,next_action:list.items[1].next_action}}}));
  const addition={expected:list.head,request_key:randomUUID(),kind:'request',basis:null,message:'Second request',next_action:'',files:[{name:originalName,media_type:'text/markdown',bytes:9,digest:sha(Buffer.from('different')),data:Buffer.from('different').toString('base64')}]};
  assert.equal((await owner.request(route+'/resolve',addition)).data.outcome,'unknown');
  assert.equal((await owner.request(route+'/save',{...addition,files:[{...addition.files[0],data:'YQ='}]})).status,422);
  const truncated = await owner.request(route+'/save',{...addition,files:[{...addition.files[0],data:'YQ=='}]});
  assert.equal(truncated.data.error,'exchange_upload_integrity');
  assert.equal((await owner.request(route+'/save',{...addition,files:[{...addition.files[0],name:'../file'}]})).status,422);
  assert.equal((await owner.request(route+'/save',{...addition,project_id:randomUUID()})).status,403);
  const otherReturn={...addition,expected:headBinding(other),basis:sent.ref,kind:'return',next_action:'Review result.'};
  assert.equal((await owner.request('/api/work/'+other.work_id+'/exchanges/save',otherReturn)).status,409);
  const accepted=await owner.request(route+'/save',addition);assert.equal(accepted.data.outcome,'saved');
  // One project, three distinguishable tasks. A later request must not erase the
  // earlier return, or borrow another work's unanswered question or next action.
  const pendingTask=await makeTask('Choose poems for the reading');
  const pendingFile={...addition.files[0],name:'shortlist.md'};
  const pendingRequest=await owner.request('/api/work/'+pendingTask.work_id+'/exchanges/save',{
    ...addition,expected:headBinding(pendingTask),request_key:randomUUID(),files:[pendingFile],
    message:'Check the shortlist',next_action:'Ask the poet about the final stanza.'});
  assert.equal(pendingRequest.status,200);
  const projection=await cli('project-overview',[],true,'tasks');
  const row=work=>projection.items.find(i=>i.work_id===work.work_id);
  assert.deepEqual(row(other).overview,{awaiting_count:0,return_count:0,returned_file_count:0,awaiting:[],returns:[]});
  const pendingSummary=row(pendingTask).overview;
  assert.equal(pendingSummary.awaiting_count,1);assert.equal(pendingSummary.return_count,0);
  assert.deepEqual(pendingSummary.awaiting[0].ref,pendingRequest.data.item.ref);
  assert.equal(pendingSummary.awaiting[0].next_action,'Ask the poet about the final stanza.');
  const summary=row(task).overview;
  assert.equal(row(task).fingerprint,accepted.data.head.fingerprint);
  assert.deepEqual(summary.awaiting.map(x=>x.ref),[accepted.data.item.ref]);
  assert.equal(summary.return_count,1);assert.equal(summary.returned_file_count,returned.files.length);
  const pair=summary.returns[0];assert.deepEqual(pair.request.ref,sent.ref);
  assert.deepEqual(pair.returned.ref,returned.ref);assert.deepEqual(pair.returned.basis,sent.ref);
  assert.equal(pair.returned.author_ref,fixtureScope.author_ref);assert.equal(pair.returned.next_action,returned.next_action);
  assert.deepEqual(pair.returned.files,returned.files);assert(!JSON.stringify(projection).includes(original.toString('base64')));
  assert.deepEqual((await owner.request('/api/works')).data.items,projection.items);
  for(let n=0;n<3;n++){
    const current=(await owner.request('/api/work/'+pendingTask.work_id)).data.saved;
    assert.equal((await owner.request('/api/work/'+pendingTask.work_id+'/exchanges/save',{
      ...addition,request_key:randomUUID(),expected:headBinding(current),message:'Check another poem '+n,files:[pendingFile]})).status,200);
  }
  const more=(await owner.request('/api/works')).data.items.find(i=>i.work_id===pendingTask.work_id).overview;
  assert.equal(more.awaiting_count,4);assert.equal(more.awaiting.length,2);
  assert.deepEqual(more.awaiting[0].ref,pendingRequest.data.item.ref);
  passed('work list: authenticated CLI and HTTP agree on no exchange, four unanswered poetry requests, exact returned files and independently bound next actions');
  // Reopen a pending on-disk request whose acknowledgement was lost before a different commit won the CAS.
  const absent = {...addition, request_key:randomUUID(), message:'Keep my draft question', next_action:'Check the venue'};
  await writeFile(path.join(setup+'.pending',absent.request_key),JSON.stringify({work_id:task.work_id,setup_digest:sha(await readFile(setup)),body:absent}),{mode:0o600});
  const staleDraft = await cli('stale-check',['check']);
  assert.equal(staleDraft.outcome,'unknown');assert.equal(staleDraft.draft.message,absent.message);
  assert.equal('data' in staleDraft.draft.files[0],false);
  await cli('refuse-existing-recovery',['recover',dir],false);
  const recoveredDir = path.join(dir,'recovered-draft');await cli('recover-local-draft',['recover',recoveredDir]);
  assert.deepEqual(await readFile(path.join(recoveredDir,'files',originalName)),Buffer.from('different'));
  assert.equal(JSON.parse(await readFile(path.join(recoveredDir,'request.json'),'utf8')).next_action,absent.next_action);
  assert.equal((await owner.request(route+'/resolve',absent)).data.outcome,'unknown');
  const resolved=await owner.request(route+'/resolve',addition);assert.deepEqual(resolved.data.item,accepted.data.item);
  assert.equal((await owner.request(route+'/save',{...addition,message:'different'})).status,409);
  assert.equal((await owner.request(route+'/save',{...addition,request_key:randomUUID()})).status,409);
  const revoked=await fetch(server.origin+sent.files[0].download,{redirect:'manual'});assert.equal(revoked.status,403);
  const exported=(await owner.request('/api/work/'+task.work_id+'/export')).data;
  const destination=await start('file-exchange-recovery'), recovered=await client(destination);
  const imported=await recovered.request('/api/reconstruct-files',{export:exported,confirm:'reconstruct-empty-store'});
  assert.equal(imported.status,200);assert.deepEqual((await recovered.request(route)).data.items,(await owner.request(route)).data.items);
  for (const [item,bytes] of [[sent,original],[returned,expected]]) {
    const read=await fetch(destination.origin+item.files[0].download,{headers:{cookie:'web_planning_local='+destination.env.LOCAL_SESSION}});
    assert.equal(read.status,200);assert.deepEqual(Buffer.from(await read.arrayBuffer()),bytes);
  }
  await destination.setOptions({bindings:{...destination.env,LOCAL_SESSION:randomUUID()}});
  const withdrawn=await recovered.request(sent.files[0].download);
  assert.equal(withdrawn.status,403);
  assert.equal((await recovered.request(route+'/resolve',addition)).status,403);
  // Answer an explicitly selected request after another request and return.
  // Looking up its version must not consume the subsequent CLI arguments.
  const answer=await cli('return-later-request',['return',String(accepted.data.item.ref.revision),'Read the later original.','Use its returned file.',originalPath]);
  assert.deepEqual(answer.item.basis,accepted.data.item.ref);
  assert.equal(answer.item.message,'Read the later original.');assert.equal(answer.item.next_action,'Use its returned file.');
  const erase=await owner.request('/api/work/'+task.work_id+'/erase',{expected:answer.head,confirm:'erase-whole-work'});assert.equal(erase.status,200);
  assert.equal((await owner.request(route+'/save',addition)).status,410);
  passed('file exchange: fresh CLI, separate MCP recipient, exact Korean/BOM/CRLF and ZIP bytes, content-dependent return, replay, isolation, recovery and erasure');
}
