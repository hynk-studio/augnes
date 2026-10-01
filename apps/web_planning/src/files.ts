import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { canonical, exact, fail, FINGERPRINT, hash, type Payload, type Revision, type Scope, validateChain } from "./contract";

export const FILE_FORMAT = "web_planning_revision.v0.3";
export const FILE_EXPORT_FORMAT = "web_planning_export.v0.3";
export const FILE_COMPATIBILITY = "web-planning/3";
export const FILE_LIMIT = 262_144;
export const FILE_COUNT = 8;
export const SELECTION_BYTES = 524_288;
export const HISTORY_BYTES = 1_048_576;
export const HISTORY_FILES = 16;
// Only the versioned reconstruction route uses this bound; ordinary requests stay unchanged.
export const FILE_EXPORT_REQUEST_BYTES = 3_000_000;
export interface FileEntry { name:string; role:"report"|"source"|"results"|"other"; bytes:number; digest:string }
export interface FileBody { digest:string; bytes:number; data:string }
export const digestBytes=(bytes:Uint8Array)=>"sha256:"+createHash("sha256").update(bytes).digest("hex");
function nameRole(value:Record<string,any>) {
  if(typeof value.name!=="string" || !value.name.trim() || Buffer.byteLength(value.name)>160 ||
    /[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069/\\]/u.test(value.name) || !value.name.isWellFormed() ||
    [".",".."].includes(value.name) || !["report","source","results","other"].includes(value.role))fail("invalid_file_name_or_role");
}
export function decodeFile(data:unknown,max=FILE_LIMIT):Uint8Array {
  if(typeof data!=="string" || data.length>Math.ceil(max/3)*4)fail("file_bytes_exceeded");
  // Buffer's decoder alone accepts corrupt/truncated encodings. Roundtrip is strict, including padding.
  const bytes=Buffer.from(data,"base64");
  if(bytes.toString("base64")!==data)fail("invalid_file_encoding");
  if(bytes.byteLength>max)fail("file_bytes_exceeded");
  return bytes;
}
export function fileManifest(value:unknown):FileEntry[] {
  if(!Array.isArray(value) || value.length>FILE_COUNT)fail("file_count_exceeded");
  const names=new Set();let total=0;
  for(const file of value){
    exact(file,"name,role,bytes,digest");nameRole(file);
    if(names.has(file.name))fail("duplicate_file_name");names.add(file.name);
    if(!Number.isSafeInteger(file.bytes)||file.bytes<0||file.bytes>FILE_LIMIT||!FINGERPRINT.test(file.digest))fail("invalid_file_identity");
    total+=file.bytes;
  }
  if(total>SELECTION_BYTES)fail("file_selection_bytes_exceeded");
  return value as FileEntry[];
}
export function selectedFiles(payload:Payload,input:unknown,previous?:Revision):{payload:Payload;bodies:FileBody[]} {
  if(input===undefined){if(previous?.files!==undefined)fail("explicit_file_selection_required");return {payload,bodies:[]};}
  if(!Array.isArray(input)||input.length>FILE_COUNT)fail("file_count_exceeded");
  const bodies=new Map<string,FileBody>();
  const files=input.map(value=>{
    if(value && typeof value==="object" && "data" in value){
      exact(value,"name,role,data");nameRole(value);
      const bytes=decodeFile(value.data),digest=digestBytes(bytes);
      bodies.set(digest,{digest,bytes:bytes.length,data:value.data});
      return {name:value.name,role:value.role,bytes:bytes.length,digest};
    }
    fileManifest([value]);
    // A retained selection is bound to the reviewed predecessor, not an arbitrary foreign hash.
    if(!previous?.files?.some(f=>canonical(f)===canonical(value)))fail("file_not_in_saved_selection");
    return value as FileEntry;
  });
  const manifest=fileManifest(files);
  // Empty file selection on a legacy work does not change its format or fingerprint.
  return {payload:manifest.length || previous?.files!==undefined?{...payload,files:manifest}:payload,bodies:[...bodies.values()]};
}
export function historyFiles(chain:Revision[]):Map<string,number> {
  const result=new Map<string,number>();
  for(const r of chain)for(const f of r.files??[]){
    if(result.has(f.digest)&&result.get(f.digest)!==f.bytes)fail("file_identity_conflict");
    result.set(f.digest,f.bytes);
  }
  if(result.size>HISTORY_FILES)fail("file_history_count_exceeded");
  if([...result.values()].reduce((a,b)=>a+b,0)>HISTORY_BYTES)fail("file_history_bytes_exceeded");
  return result;
}
export function verifiedBodies(chain:Revision[],value:unknown):FileBody[] {
  const expected=historyFiles(chain);
  if(!Array.isArray(value)||value.length!==expected.size)fail("file_membership_integrity",409);
  const seen=new Set();
  for(const f of value){
    exact(f,"digest,bytes,data");
    if(seen.has(f.digest)||expected.get(f.digest)!==f.bytes)fail("file_membership_integrity",409);
    const bytes=decodeFile(f.data);
    if(bytes.length!==f.bytes||digestBytes(bytes)!==f.digest)fail("file_content_integrity",409);
    seen.add(f.digest);
  }
  return [...value].sort((a,b)=>a.digest<b.digest?-1:a.digest>b.digest?1:0);
}
export function exportFiles(chain:Revision[],bodies:FileBody[]) {
  const content={format:FILE_EXPORT_FORMAT,schema:1,compatibility:FILE_COMPATIBILITY,revisions:chain,files:verifiedBodies(chain,bodies)};
  return {...content,fingerprint:hash(canonical(content))};
}
export function validateFileExport(scope:Scope,value:unknown) {
  exact(value,"format,schema,compatibility,revisions,files,fingerprint");
  if(value.format!==FILE_EXPORT_FORMAT||value.schema!==1||value.compatibility!==FILE_COMPATIBILITY)fail("incompatible_format",409);
  if(!Array.isArray(value.revisions)||!value.revisions.length)fail("invalid_export");
  const {fingerprint,...content}=value;
  if(hash(canonical(content))!==fingerprint)fail("export_integrity",409);
  const chain=validateChain(scope,value.revisions[0]?.work_id,value.revisions);
  if(!chain.some(r=>r.files!==undefined))fail("incompatible_format",409);
  const bodies=verifiedBodies(chain,value.files);
  if(canonical(exportFiles(chain,bodies))!==canonical(value))fail("export_integrity",409);
  return {chain,bodies};
}
