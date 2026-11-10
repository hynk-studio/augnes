import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { crc32 } from 'node:zlib';
import { headBinding } from '../apps/web_planning/src/contract.ts';
import { fixtureScope } from './web-planning-local-runtime.mjs';

const sha=b=>'sha256:'+createHash('sha256').update(b).digest('hex');
const upload=(name,data,media_type='text/plain')=>({name,bytes:data.length,digest:sha(data),data:data.toString('base64'),media_type});
const accepted=async p=>{const {status,data}=await p;assert.equal(status,200,data.error);return data;};
const refused=async(p,code)=>{const {status,data}=await p;assert(status>=400);assert.equal(data.error,code);};

// A real stored ZIP with a single member and central directory, kept opaque by Augnes.
export function reviewZip(total=803552){
  const name=Buffer.from('observations.bin'),body=Buffer.alloc(total-30-46-22-2*name.length);
  for(let i=0;i<body.length;i++)body[i]=(i*17+19)&255;
  const local=Buffer.alloc(30),central=Buffer.alloc(46),end=Buffer.alloc(22),crc=crc32(body);
  local.writeUInt32LE(0x04034b50);local.writeUInt16LE(20,4);local.writeUInt32LE(crc,14);
  local.writeUInt32LE(body.length,18);local.writeUInt32LE(body.length,22);local.writeUInt16LE(name.length,26);
  central.writeUInt32LE(0x02014b50);central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);central.writeUInt32LE(crc,16);
  central.writeUInt32LE(body.length,20);central.writeUInt32LE(body.length,24);central.writeUInt16LE(name.length,28);
  end.writeUInt32LE(0x06054b50);end.writeUInt16LE(1,8);end.writeUInt16LE(1,10);end.writeUInt32LE(46+name.length,12);end.writeUInt32LE(30+name.length+body.length,16);
  return Buffer.concat([local,name,body,central,name,end]);
}

export async function checkLargeExchanges({start,client,newWork,save,passed}){
  const server=await start('complete-originals'),c=await client(server);
  const make=async(owner,goal)=>(await accepted(save(owner,await newWork(owner,{goal,success_criteria:['Read the exact retained result'],non_goals:[]},[])))).saved;
  const initial=await make(c,'Return complete field reports'),path='/api/work/'+initial.work_id;
  const log=Buffer.alloc(5328363,0x61);Buffer.from('\ufeff').copy(log);Buffer.from('물🙂').copy(log,8191);
  const tail=Buffer.from('\r\nSurvey: 17 observed, 4 deferred.\r\n');tail.copy(log,log.length-tail.length);
  const zip=reviewZip(),report=Buffer.from('Check the field observations and return the transferable count.\n');
  const files=[upload('inspection.log',log),upload('measurements.zip',zip,'application/zip'),upload('report.md',report,'text/markdown')];
  const request={expected:headBinding(initial),request_key:randomUUID(),kind:'request',basis:null,message:'Review the survey.',next_action:'',files};
  const counts=async()=>Promise.all(['revision','file','file_part'].map(async t=>(await server.db.prepare('SELECT COUNT(*) n FROM web_planning_'+t+' WHERE work_id=?').bind(initial.work_id).first()).n));
  // A truncated body and a short-but-declared-complete file leave no reservations.
  const partial=await server.mf.dispatchFetch(server.origin+path+'/exchanges/save',{method:'POST',headers:{cookie:c.cookies,origin:server.origin,'x-csrf-token':c.csrf,'content-type':'application/json'},body:'{"files":[{"data":"Y'});
  assert.equal((await partial.json()).error,'invalid_body');
  await refused(c.request(path+'/exchanges/save',{...request,files:[{...files[0],data:'YQ=='}]}),'exchange_upload_integrity');
  assert.deepEqual(await counts(),[1,0,0]);
  // Discard the first acknowledgement; resolve and replay the same complete request.
  await accepted(c.request(path+'/exchanges/save',request));
  const sent=(await accepted(c.request(path+'/exchanges/resolve',request))).item;
  assert.equal(sent.ref.revision,2);assert.deepEqual((await accepted(c.request(path+'/exchanges/save',request))).item,sent);
  await refused(c.request(path+'/exchanges/resolve',{...request,message:'Another review.'}),'altered_replay');
  assert.deepEqual(await counts(),[2,3,Math.ceil(log.length/196608)+Math.ceil(zip.length/196608)]);
  const [original,archive]=sent.files;
  async function get(owner,runtime,f,expected){
    const res=await runtime.mf.dispatchFetch(runtime.origin+f.download,{headers:{cookie:owner.cookies}});
    assert.equal(res.status,200);const b=Buffer.from(await res.arrayBuffer());assert.equal(b.length,f.bytes);assert.equal(sha(b),f.digest);assert(b.equals(expected));
  }
  const page=(owner,file,offset,find='')=>owner.request(file.download+'/text',{offset,find});
  const first=await accepted(page(c,original,0));assert.equal(first.end,8191);assert.equal(first.total,log.length);assert.equal(first.text.charCodeAt(0),0xfeff);
  await refused(page(c,original,8192),'invalid_text_position');
  assert((await accepted(page(c,original,first.next))).text.startsWith('물🙂'));
  const match=await accepted(page(c,original,first.next,'Survey:'));assert.equal(match.next,null);assert.equal(match.start,log.indexOf('Survey:'));assert.deepEqual(match.ref,sent.ref);
  const empty=await accepted(page(c,original,0,'absent marker'));assert.equal(empty.found,false);assert.equal(empty.text,'');
  await refused(page(c,archive,0),'unsupported_text_file');
  await refused(c.request(original.download+'/text',{offset:0,find:'',project_id:randomUUID()}),'scope_denied');
  assert.equal((await server.mf.dispatchFetch(server.origin+archive.download)).status,403);
  assert.equal((await c.request(original.download.replace(sent.ref.fingerprint.slice(7),'a'.repeat(64))+'/text',{offset:0,find:''})).status,409);
  await get(c,server,original,log);await get(c,server,archive,zip);
  const values=match.text.match(/(\d+) observed, (\d+) deferred/),review=Buffer.from('Transfer '+(Number(values[1])-Number(values[2]))+' observations; keep the four deferred separate.\n');
  const reply={...request,expected:{revision:sent.ref.revision,fingerprint:sent.ref.fingerprint},basis:sent.ref,kind:'return',request_key:randomUUID(),message:'Reviewed the final survey row.',next_action:'Prepare the transfer.',files:[upload('report.md',review,'text/markdown')]};
  const returned=(await accepted(c.request(path+'/exchanges/save',reply))).item;
  assert.deepEqual(returned.basis,sent.ref);assert.notEqual(sent.files[2].digest,returned.files[0].digest);assert.equal((await accepted(page(c,returned.files[0],0))).text,review.toString());
  await get(c,server,sent.files[2],report);
  const before=await counts();
  await refused(c.request(path+'/exchanges/save',{...request,request_key:randomUUID()}),'refresh_required');
  const fresh={...request,expected:{revision:returned.ref.revision,fingerprint:returned.ref.fingerprint},request_key:randomUUID()};
  await refused(c.request(path+'/exchanges/save',{...fresh,files:[upload('more.log',Buffer.alloc(3*1024*1024,0x62))]}),'file_history_bytes_exceeded');
  assert.deepEqual(await counts(),before);
  // Same-name newer content must neither advance an old reader nor replace an original.
  const broken=Buffer.concat([Buffer.alloc(33000,0x61),Buffer.from([0xc0])]);
  const later=(await accepted(c.request(path+'/exchanges/save',{...fresh,files:[upload('inspection.log',broken)]}))).item;
  await refused(page(c,later.files[0],0),'unsupported_text_encoding');
  assert.equal((await accepted(page(c,original,match.start))).text,match.text);
  const backup=await accepted(c.request(path+'/export'));assert.equal(backup.format,'web_planning_export.v0.6');
  assert.equal(backup.revisions[1].format,'web_planning_revision.v0.6');assert.equal(backup.files.length,5);
  const dest=await start('complete-originals-restored'),dc=await client(dest),restore=value=>dc.request('/api/reconstruct-exchange',{confirm:'reconstruct-empty-store',export:value});
  await refused(restore({...backup,fingerprint:'sha256:'+'0'.repeat(64)}),'export_integrity');
  await accepted(restore(backup));assert.deepEqual(await accepted(dc.request(path+'/export')),backup);
  await get(dc,dest,original,log);await get(dc,dest,archive,zip);await get(dc,dest,returned.files[0],review);await get(dc,dest,later.files[0],broken);
  const separate=await make(dc,'Unrelated inventory'),other='/api/work/'+separate.work_id;
  const changed=await dest.db.prepare('DELETE FROM web_planning_file_part WHERE work_id=? AND digest=? AND ordinal=1').bind(initial.work_id,original.digest).run();assert.equal(changed.meta.changes,1);
  await refused(page(dc,original,0),'file_content_integrity');await refused(dc.request(path+'/export'),'file_content_integrity');
  await accepted(dc.request(path+'/erase',{expected:{revision:later.ref.revision,fingerprint:later.ref.fingerprint},confirm:'erase-whole-work'}));
  for(const t of ['file','file_part','revision'])assert.equal((await dest.db.prepare('SELECT count(*) n FROM web_planning_'+t+' WHERE work_id=?').bind(initial.work_id).first()).n,0);
  assert.equal((await accepted(dc.request(other))).saved.fingerprint,separate.fingerprint);
  await refused(dc.request(path),'work_erased');
  // Two large writes at the same head: even if both pass a JS preflight, only
  // the winning revision owns headers and slices. The loser can check its key.
  const contenders=[1,2].map(byte=>({...request,expected:headBinding(separate),request_key:randomUUID(),files:[upload('race.log',Buffer.alloc(320000,byte))]}));
  const outcomes=await Promise.all(contenders.map(body=>dc.request(other+'/exchanges/save',body)));
  assert.deepEqual(outcomes.map(r=>r.status).sort(),[200,409]);
  const winner=outcomes.findIndex(r=>r.status===200),lost=await accepted(dc.request(other+'/exchanges/resolve',contenders[1-winner]));
  assert.equal(lost.outcome,'unknown');
  const partRows=(await dest.db.prepare('SELECT digest,ordinal FROM web_planning_file_part WHERE work_id=? ORDER BY ordinal').bind(separate.work_id).all()).results;
  assert.deepEqual(partRows,[0,1].map(ordinal=>({digest:contenders[winner].files[0].digest,ordinal})));
  const admitted=(await accepted(dc.request(other+'/export'))).files;
  assert.deepEqual(admitted.map(f=>f.digest),[contenders[winner].files[0].digest]);
  console.log(JSON.stringify({complete_originals:{bytes:files.map(f=>f.bytes),digests:files.map(f=>f.digest),range:[match.start,match.end],return_digest:returned.files[0].digest,rows:before,restored:backup.fingerprint,erased:true}}));
  passed('whole originals: realistic log and ZIP, lost response and replay, immutable page search and grounded return, bounded restoration and owning erasure');
}
