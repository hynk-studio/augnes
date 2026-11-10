import { Buffer } from "node:buffer";
import { exact, fail, reference, type Revision } from "./contract";
import { downloadFile, type Store } from "./store";

// Positions are offsets in the original bytes, including a BOM and CRLF.
const PAGE_BYTES=8192;
export async function readExchangePage(store:Store,r:Revision,index:number,input:Record<string,unknown>,exchange=true) {
  exact(input,"workspace_id,project_id,offset,find");
  const artifact=exchange?r.exchange?.artifacts[index]:r.files?.[index]?{file:r.files[index],media_type:null}:undefined;
  if(!artifact)fail("file_not_found",404);
  if(!/\.(?:txt|log|md|markdown|json|patch|mjs)$/i.test(artifact.file.name))fail("unsupported_text_file",415);
  const offset=input.offset,find=input.find;
  if(typeof offset!=="number"||!Number.isSafeInteger(offset)||offset<0||offset>artifact.file.bytes ||
     typeof find!=="string"||!find.isWellFormed()||Buffer.byteLength(find)>256)fail("invalid_text_position");
  const {file,bytes}=await downloadFile(store,r,index,exchange);
  const decoder=new TextDecoder("utf-8",{fatal:true,ignoreBOM:true});
  // Verify all bytes as text before disclosing a prefix. ESC in a terminal
  // transcript is inert; preserve it, BOMs, line endings and very long lines.
  try {
    for(let p=0;p<bytes.length;p+=32768){
      const text=decoder.decode(bytes.subarray(p,p+32768),{stream:true});
      if(/[\u0000-\u0008\u000b\u000c\u000e-\u001a\u001c-\u001f]/u.test(text))throw Error();
    }
    decoder.decode();
  } catch {fail("unsupported_text_encoding",415);}
  const continuation=(p:number)=>p<bytes.length && (bytes[p]&0xc0)===0x80;
  if(continuation(offset))fail("invalid_text_position");
  const match=find?Buffer.from(bytes.buffer,bytes.byteOffset,bytes.length).indexOf(Buffer.from(find),offset):null;
  const start=match===null?offset:match<0?bytes.length:match;
  let end=Math.min(start+PAGE_BYTES,bytes.length);
  while(continuation(end))end--;
  return {workspace_id:r.workspace_id,project_id:r.project_id,ref:reference(r),file:{...file,media_type:artifact.media_type},offset,start,end,total:bytes.length,
    next:end<bytes.length?end:null,match:match===null||match<0?null:match,found:match===null?null:match>=0,
    text:decoder.decode(bytes.subarray(start,end))};
}
