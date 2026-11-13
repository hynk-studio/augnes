import { AsyncLocalStorage } from 'node:async_hooks';
import { channel } from 'node:diagnostics_channel';
import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';

export const CONTROLLED_UPLOAD_CHUNK_BYTES = 65536;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fault = code => Object.assign(new Error(code), { code });
// esbuild preserves a text import's ?raw suffix in its input identifier; that
// suffix is not part of the file it read. Retain both identities explicitly.
export function observeControlledWorkerInput(root,input) {
 if(typeof input!=='string'||path.isAbsolute(input)||input.includes('#')||
   input.includes('?')&&(!input.endsWith('.txt?raw')||input.indexOf('?')!==input.length-4))throw fault('ERR_CONTROLLED_WORKER_INPUT');
 const physical=input.endsWith('.txt?raw')?input.slice(0,-4):input;
 if(path.normalize(physical)!==physical||physical==='..'||physical.startsWith('../'))throw fault('ERR_CONTROLLED_WORKER_INPUT');
 const file=path.join(root,physical),before=lstatSync(file,{bigint:true});
 if(!before.isFile()||realpathSync(file)!==file)throw fault('ERR_CONTROLLED_WORKER_INPUT');
 const bytes=readFileSync(file),after=lstatSync(file,{bigint:true});
 if(['dev','ino','mode','uid','gid','nlink','size','mtimeNs','ctimeNs'].some(key=>before[key]!==after[key]))throw fault('ERR_CONTROLLED_WORKER_INPUT_DRIFT');
 return {input,path:physical,byte_size:bytes.length,sha256:hash(bytes)};
}
export function controlledUploadError(error,depth=0) {
 if (!error) return null;
 return {name:String(error.name??'Error'),code:error.code??null,message:String(error.message??error).slice(0,512),
  ...(error.syscall?{syscall:error.syscall}:{}),...(error.cause&&depth<8?{cause:controlledUploadError(error.cause,depth+1)}:{})};
}

// Only this finite, body-bearing local request is converted to a stream. An
// unknown-length stream remains untouched and is never read for selection.
export function selectControlledUpload(url, init, {origin,requestBytes}) {
 const target=new URL(url),local=new URL(origin);
 if(local.hostname!=='127.0.0.1'||!['http:','https:'].includes(local.protocol))throw fault('ERR_CONTROLLED_UPLOAD_ORIGIN');
 if(target.origin!==local.origin||target.pathname!=='/api/drafts'||target.search||
   String(init?.method??'GET').toUpperCase()!=='POST'||init?.body==null)return null;
 const headers=new Headers(init.headers),length=headers.get('content-length');
 if(!/^\d+$/u.test(length??'')||!Number.isSafeInteger(Number(length))||Number(length)<=requestBytes)return null;
 let bytes;
 if(typeof init.body==='string')bytes=new TextEncoder().encode(init.body);
 else if(init.body instanceof ArrayBuffer)bytes=new Uint8Array(init.body.slice(0));
 else if(ArrayBuffer.isView(init.body))bytes=new Uint8Array(init.body.buffer.slice(init.body.byteOffset,init.body.byteOffset+init.body.byteLength));
 else throw fault('ERR_CONTROLLED_UPLOAD_BODY_TYPE');
 if(bytes.byteLength!==Number(length))throw fault('ERR_CONTROLLED_UPLOAD_LENGTH');
 return {bytes,declared_length:Number(length),payload_sha256:hash(bytes),headers_sha256:hash(JSON.stringify([...headers]))};
}

function diagnosticLength(headers) {
 if(typeof headers==='string')return /^content-length:\s*(\d+)\s*$/imu.exec(headers)?.[1]??null;
 if(Array.isArray(headers))return new Headers(Array.from({length:headers.length/2},(_,i)=>[headers[2*i],headers[2*i+1]])).get('content-length');
 return null;
}

// AsyncLocalStorage attributes the actual Undici request object created by the
// selected dispatch. A different request's 413 cannot open this upload gate.
export function installControlledUpload(server,{requestBytes,onEvent=()=>{},gateTimeoutMs=10000}={}) {
 if(!Number.isSafeInteger(requestBytes)||requestBytes<CONTROLLED_UPLOAD_CHUNK_BYTES||
   !Number.isSafeInteger(gateTimeoutMs)||gateTimeoutMs<=0)throw fault('ERR_CONTROLLED_UPLOAD_OPTIONS');
 const context=new AsyncLocalStorage(),original=server.mf.dispatchFetch,dispatch=original.bind(server.mf),records=[],subscriptions=[];
 const bound=new WeakMap();let closed=false;
 const event=(kind,data={})=>onEvent(kind,data);
 const matches=(request,record)=>{
  try{return request.method==='POST'&&new URL(request.origin).origin===new URL(server.origin).origin&&request.path==='/api/drafts'&&
   (Number.isSafeInteger(request.contentLength)?String(request.contentLength):diagnosticLength(request.headers))===String(record.declared_length);}catch{return false;}
 };
 const subscribe=(name,listener)=>{const c=channel(name);c.subscribe(listener);subscriptions.push([c,listener]);};
 subscribe('undici:request:create',({request})=>{
  const record=context.getStore();if(!record||!matches(request,record))return;
  if(record.request&&record.request!==request){record.harness_error??=controlledUploadError(fault('ERR_CONTROLLED_UPLOAD_AMBIGUOUS_REQUEST'));record.stop();return;}
  record.request=request;bound.set(request,record);record.correlated_requests++;
  event('selected_request_created',{selected:true});
 });
 subscribe('undici:request:headers',({request,response})=>{
  const record=bound.get(request);if(!record||response?.statusCode!==413||record.released)return;
  record.matching_413_headers++;record.released=true;record.release();event('selected_413_headers',{selected:true,status:413});
 });
 subscribe('undici:request:error',({request,error})=>{
  const record=bound.get(request);if(!record)return;
  record.transport_error??=controlledUploadError(error);event('selected_transport_error',{selected:true,error:controlledUploadError(error)});
 });
 const wrapped=async(url,init={})=>{
  if(closed)throw fault('ERR_CONTROLLED_UPLOAD_CLOSED');
  const selected=selectControlledUpload(url,init,{origin:server.origin,requestBytes});let record,forward=init;
  if(selected){
   if(records.length)throw fault('ERR_CONTROLLED_UPLOAD_MULTIPLE_SELECTIONS');
   let resolveGate,stopped=false,offset=0;
   const gate=new Promise(resolve=>{resolveGate=resolve;});
   record={...selected,bytes:undefined,correlated_requests:0,matching_413_headers:0,released:false,enqueued_bytes:0,enqueued_chunks:0,
    stream_closed:false,stream_cancelled:false,transport_error:null,harness_error:null,release:()=>resolveGate(),stop:()=>{stopped=true;resolveGate();}};
   records.push(record);
   const timer=setTimeout(()=>{record.harness_error??=controlledUploadError(fault('ERR_CONTROLLED_UPLOAD_RESPONSE_TIMEOUT'));record.stop();},gateTimeoutMs);
   const body=new ReadableStream({async pull(controller){
    if(offset)await gate;
    if(stopped){controller.error(fault(record.harness_error?.code??'ERR_CONTROLLED_UPLOAD_STOPPED'));clearTimeout(timer);return;}
    if(offset===selected.bytes.byteLength){controller.close();record.stream_closed=true;clearTimeout(timer);event('selected_upload_closed',{selected:true,enqueued_bytes:offset});return;}
    const end=Math.min(selected.bytes.byteLength,offset+CONTROLLED_UPLOAD_CHUNK_BYTES);
    controller.enqueue(selected.bytes.subarray(offset,end));offset=end;record.enqueued_bytes=offset;record.enqueued_chunks++;
   },cancel(reason){record.stream_cancelled=true;record.cancel_error=controlledUploadError(reason);record.stop();clearTimeout(timer);event('selected_upload_cancelled',{selected:true,enqueued_bytes:offset,error:record.cancel_error});}});
   record.clearTimer=()=>clearTimeout(timer);
   forward={...init,body,duplex:'half'};
   event('controlled_upload',{selected:true,payload_bytes:selected.bytes.byteLength,payload_sha256:selected.payload_sha256,
    headers_sha256:selected.headers_sha256,chunk_bytes:CONTROLLED_UPLOAD_CHUNK_BYTES,body_conversion:'finite-bytes-to-scheduled-stream'});
  }
  try{
   const response=await context.run(record,()=>dispatch(url,forward));
   if(record?.harness_error)throw fault(record.harness_error.code);
   event('dispatch_resolved',{selected:!!record,status:response.status});
   const json=response.json.bind(response);
   response.json=async()=>{event('response_body_start',{selected:!!record,status:response.status});
    try{const value=await json();event('response_body_complete',{selected:!!record,status:response.status});return value;}
    catch(error){event('response_body_error',{selected:!!record,status:response.status,error:controlledUploadError(error)});throw error;}};
   return response;
  }catch(error){record?.stop();event('dispatch_error',{selected:!!record,error:controlledUploadError(error)});throw error;}
 };
 server.mf.dispatchFetch=wrapped;
 return {
  snapshot(){return records.map(({request,release,stop,clearTimer,bytes,...record})=>({...record}));},
  close(){if(closed)return;closed=true;for(const record of records){record.stop();record.clearTimer();}
   for(const[c,listener]of subscriptions)c.unsubscribe(listener);
   if(server.mf.dispatchFetch!==wrapped)throw fault('ERR_CONTROLLED_UPLOAD_RESTORE');server.mf.dispatchFetch=original;},
 };
}
