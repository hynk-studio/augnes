// Optional, model-free test capture. No qualification or admission authority.
import assert from "node:assert/strict";
import {appendFileSync,lstatSync,readFileSync,writeFileSync,realpathSync,readdirSync} from "node:fs";
import path from "node:path";
import {createHash} from "node:crypto";
import {gzipSync,gunzipSync} from "node:zlib";
const hash=b=>createHash("sha256").update(b).digest("hex");
export function projectWorkCaptureRoot() {
  const selected=process.env.AUGNES_PROJECT_WORK_CAPTURE_ROOT;
  if(!selected)return null;
  const parent=process.env.AUGNES_CANONICAL_TEMP_ROOT;
  assert(parent&&path.isAbsolute(selected)&&realpathSync(selected)===selected&&realpathSync(parent)===parent);
  assert(selected.startsWith(parent+path.sep)&&!lstatSync(selected).isSymbolicLink());
  return selected;
}
function store(root,name,bytes) {
  assert(/^[a-z0-9_.-]+$/.test(name));
  const value=Buffer.isBuffer(bytes)?bytes:Buffer.from(JSON.stringify(bytes,(_key,value)=>value&&typeof value==="object"&&!Array.isArray(value)?Object.fromEntries(Object.entries(value).sort(([a],[b])=>a<b?-1:1)):value));
  assert(value.length<=2*1024*1024,"bounded private capture artifact");
  writeFileSync(path.join(root,name),value,{flag:"wx",mode:0o600});
  return {artifact:name,sha256:hash(value),bytes:value.length};
}
export function projectWorkSeedBytes() {
  const root=projectWorkCaptureRoot();if(!root)return null;
  const file=path.join(root,"seed.db"),s=lstatSync(file);
  assert(s.isFile()&&s.nlink===1&&s.size>0&&s.size<=64*1024);
  const bytes=readFileSync(file);assert.equal(hash(bytes),process.env.AUGNES_PROJECT_WORK_SEED_SHA256);return bytes;
}
/** @param {string} caseId @param {any} db @param {any} config @param {{selector?: {packet_id:string,packet_fingerprint:string}|null}} options */
export function captureProjectWorkInput(caseId,db,config,{selector=null}={}) {
  const root=projectWorkCaptureRoot();if(!root)return;
  assert(/^[a-z0-9_-]+$/.test(caseId));
  const bytes=db.serialize();
  const schema=db.prepare("SELECT type,name,tbl_name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name").all();
  const tables=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
  const counts=tables.map(({name})=>({table:name,rows:db.prepare('SELECT count(*) AS n FROM "'+name.replaceAll('"','""')+'"').get().n}));
  const database=store(root,caseId+".db.gz",gzipSync(bytes));
  const configRef=store(root,caseId+".config.json",config);
  store(root,caseId+".input.json",{case_id:caseId,captured_at:new Date().toISOString(),database,uncompressed_sha256:hash(bytes),uncompressed_bytes:bytes.length,
    config:configRef,schema,counts,selector});
}
export function captureProjectWorkObservation(caseId,observation) {
  const root=projectWorkCaptureRoot();if(!root)return;
  assert(/^[a-z0-9_-]+$/.test(caseId));store(root,caseId+".observation.json",observation);
}
export function captureProjectWorkTrace(caseId,operation,callSite,sequence) {
  if(!projectWorkCaptureRoot())return;
  // Raw observations go to the captured owner stream, with fixed call scope.
  console.log(JSON.stringify({comparison_work_trace:{case_id:caseId,operation,call_site:callSite,sequence}}));
}
export function readProjectWorkCaptures() {
  const root=projectWorkCaptureRoot();assert(root);
  return readdirSync(root).filter(n=>n.endsWith(".input.json")).sort().map(n=>{
    const entry=JSON.parse(readFileSync(path.join(root,n),"utf8"));
    const read=ref=>{assert(/^[a-z0-9_.-]+$/.test(ref.artifact));const file=path.join(root,ref.artifact),s=lstatSync(file);assert(s.isFile()&&s.nlink===1&&!s.isSymbolicLink()&&s.size===ref.bytes);const bytes=readFileSync(file);assert.equal(hash(bytes),ref.sha256);return bytes;};
    const bytes=gunzipSync(read(entry.database),{maxOutputLength:16*1024*1024});assert.equal(bytes.length,entry.uncompressed_bytes);assert.equal(hash(bytes),entry.uncompressed_sha256);
    return {entry,bytes,config:JSON.parse(read(entry.config))};
  });
}

export function captureProjectWorkFile(file,root,operation) {
  const capture=projectWorkCaptureRoot();if(!capture||typeof file!=="string"||!path.resolve(file).startsWith(root+path.sep))return;
  const physical=path.resolve(file),stat=lstatSync(physical);assert(stat.isFile()&&!stat.isSymbolicLink()&&stat.nlink===1&&stat.size<=2*1024*1024);
  const bytes=readFileSync(physical),sha256=hash(bytes),name="file-"+sha256+".data";
  try{store(capture,name,bytes);}catch(error){if(error.code!=="EEXIST")throw error;assert.equal(hash(readFileSync(path.join(capture,name))),sha256);}
  appendFileSync(path.join(capture,"file-observations.jsonl"),JSON.stringify({operation,path:path.relative(root,physical),artifact:name,sha256,bytes:bytes.length,at:new Date().toISOString()})+"\n",{mode:0o600});
}
