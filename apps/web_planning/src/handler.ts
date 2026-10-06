/// <reference path="./assets.d.ts" />
import { FILE_EXPORT_REQUEST_BYTES, historyFiles, selectedFiles, validateFileExport } from "./files";
import { authorize, csrfCookie, csrfToken, readTicket, requireCsrf, requireScope, ticket, type Environment, type Principal } from "./access";
import { assertHistoryBudget, binding, canonical, exact, exportWork, fail, hash, makeRevision, normalizePayload, reference, Refusal, REQUEST_BYTES, requestFingerprint, sameBinding, UUID, validateExport } from "./contract";
import { inspectDraftCapacity } from "./capacity";
import { append, completeExport, downloadFile, eraseWork, headBinding, headsCurrent, listWork, readWork, reconstruct, requestRevision } from "./store";
import { page, renderContext, renderComparison, renderPreview, style } from "./page";
import { compare, editedPayload, previewOperation, referenceAvailability, saveOperation } from "./relations";
import client from "./client.js.txt?raw";
const headers={"Cache-Control":"no-store, private","Vary":"Cookie, oai-authenticated-user-email","X-Web-Planning-Response":"1","X-Content-Type-Options":"nosniff",
  "Referrer-Policy":"no-referrer","X-Frame-Options":"DENY","X-Robots-Tag":"noindex, nofollow",
  "Content-Security-Policy":"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"};
function json(value:unknown,status=200) { return new Response(JSON.stringify(value),{status,headers:{...headers,"Content-Type":"application/json"}}); }
function html(value:string,extra:Record<string,string>={}) { return new Response(value,{headers:{...headers,"Content-Type":"text/html; charset=utf-8",...extra}}); }
async function body(request:Request,limit=REQUEST_BYTES) {
  if(request.headers.get("content-type")!=="application/json") fail("json_required",415);
  const reader=request.body?.getReader(); if(!reader) fail("invalid_body");
  let length=0; const chunks:Uint8Array[]=[];
  try { for(;;) { const {done,value}=await reader.read(); if(done)break; length+=value.byteLength;
    if(length>limit) { await reader.cancel(); fail("request_too_large",413); } chunks.push(value); }
    const bytes=new Uint8Array(length); let at=0; for(const c of chunks){ bytes.set(c,at); at+=c.length; }
    return JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes));
  } catch(e) { if(e instanceof Refusal)throw e; fail("invalid_body"); }
}
export async function handle(request:Request,env:Environment,principal:Principal):Promise<Response> {
  try {
    const access=await authorize(request,env,principal);
    const url=new URL(request.url), path=url.pathname;
    if(request.method==="GET") {
      if(path==="/favicon.ico" && !url.search)return new Response(null,{status:204,headers});
      if(path==="/" && !url.search) {
        const csrf=csrfToken(access,request);
        return html(page(csrf,access),{"Set-Cookie":csrfCookie(access,csrf)});
      }
      if(path==="/client.js" && !url.search) return new Response(client,{headers:{...headers,"Content-Type":"text/javascript; charset=utf-8"}});
      if(path==="/style.css" && !url.search) return new Response(style,{headers:{...headers,"Content-Type":"text/css; charset=utf-8"}});
      if(path==="/api/works") {
        if([...url.searchParams.keys()].some(k=>k!=="cursor") || url.searchParams.getAll("cursor").length>1) fail("scope_denied",403);
        const cursor=url.searchParams.get("cursor")??"";
        if(cursor && !UUID.test(cursor))fail("invalid_cursor");
        const listed=await listWork(access,cursor);
        return json({items:listed.items.map(r=>({work_id:r.work_id,goal:r.definition.goal,recorded_at:r.recorded_at,...headBinding(r),branch_of:r.relations?.origin?.source.work_id??null})),next:listed.next});
      }
      const fileMatch=path.match(/^\/api\/work\/([a-f0-9-]+)\/files\/([1-9][0-9]{0,15})\/([a-f0-9]{64})\/([0-7])$/);
      if(fileMatch && UUID.test(fileMatch[1]) && !url.search) {
        const chain=await readWork(access,fileMatch[1]);
        const revision=chain.find(r=>r.revision===Number(fileMatch[2]) && r.fingerprint==="sha256:"+fileMatch[3]);
        if(!revision)fail("file_revision_unavailable",409);
        const {file,bytes}=await downloadFile(access,revision,Number(fileMatch[4]));
        const name=encodeURIComponent(file.name).replace(/['()*]/g,c=>"%"+c.charCodeAt(0).toString(16).toUpperCase());
        return new Response(bytes,{headers:{...headers,"Content-Type":"application/octet-stream","Content-Disposition":`attachment; filename="artifact.bin"; filename*=UTF-8''${name}`,"X-Content-SHA256":file.digest,"Content-Length":String(file.bytes)}});
      }
      const match=path.match(/^\/api\/work\/([a-f0-9-]+)(?:\/(history|export))?$/);
      if(match && UUID.test(match[1]) && !url.search) {
        const chain=await readWork(access,match[1]); if(!chain.length)fail("work_not_found",404);
        if(match[2]==="export"){
          const value=chain.some(r=>r.files!==undefined)?await completeExport(access,chain):exportWork(chain);
          if(!await headsCurrent(access,reference(chain.at(-1)!),reference(chain.at(-1)!)))fail("refresh_required",409);
          return new Response(canonical(value),{headers:{...headers,"Content-Type":"application/json","Content-Disposition":"attachment; filename=planning-work.json"}});
        }
        return json(match[2]==="history"?{revisions:chain}:{saved:chain.at(-1)});
      }
      fail("not_found",404);
    }
    if(request.method!=="POST" || url.search)fail("method_not_allowed",405);
    requireCsrf(access,request);
    const input=await body(request,path==="/api/reconstruct-files"?FILE_EXPORT_REQUEST_BYTES:REQUEST_BYTES); if(!input || typeof input!=="object")fail("invalid_body");
    requireScope(access,input);
    const capacity=path.match(/^\/api\/work\/([a-f0-9-]+)\/capacity$/);
    if(path==="/api/capacity" || (capacity && UUID.test(capacity[1]))) {
      exact(input,"workspace_id,project_id,check_id,definition,notes,material_edits"+(capacity?",expected":""));
      if(!UUID.test(input.check_id))fail("invalid_check_id");
      const expected=capacity?binding(input.expected):headBinding();
      const head=capacity?(await readWork(access,capacity[1])).at(-1):undefined;
      if(capacity && !head)fail("work_not_found",404);
      if(!sameBinding(headBinding(head),expected))fail("refresh_required",409);
      const result=inspectDraftCapacity(access,{definition:input.definition,notes:input.notes,material_edits:input.material_edits},head);
      if(head && !await headsCurrent(access,reference(head),reference(head)))fail("refresh_required",409);
      return json({...result,check_id:input.check_id});
    }
    if(path==="/api/drafts") {
      const bound="definition" in input;
      exact(input,"workspace_id,project_id"+(bound?",definition,notes"+("material_edits" in input?",material_edits":"")+("files" in input?",files":""):"")); const work_id=crypto.randomUUID();
      const fingerprint=bound?hash(canonical(selectedFiles(editedPayload(access,normalizePayload(access,input.definition,input.notes),input.notes,input.material_edits),input.files).payload)):undefined;
      return json({work_id,ticket:ticket(access,work_id,headBinding(),fingerprint)});
    }
    if(path==="/api/reconstruct" || path==="/api/reconstruct-files") {
      exact(input,"workspace_id,project_id,export,confirm");
      if(env.RECONSTRUCTION_MODE!=="quiesced-empty-store" || input.confirm!=="reconstruct-empty-store")fail("reconstruction_disabled",403);
      const {chain,bodies}=path==="/api/reconstruct-files"?validateFileExport(access,input.export):{chain:validateExport(access,input.export),bodies:[]};
      await reconstruct(access,chain,bodies);
      return json({saved:chain.at(-1),authorship:"imported attestation; not independently verified"});
    }
    const relation=path.match(/^\/api\/work\/([a-f0-9-]+)\/(branch-preview|compare|incorporation-preview|relation-save|relation-resolve)$/);
    if(relation && UUID.test(relation[1])) {
      const [,id,action]=relation;
      if(action==="relation-save" || action==="relation-resolve") {
        exact(input,"workspace_id,project_id,ticket,intent");
        return json(await saveOperation(access,id,input.ticket,input.intent,action==="relation-resolve"));
      }
      if(action==="compare") {
        exact(input,"workspace_id,project_id,expected,source");
        const result=await compare(access,id,input.expected,input.source);
        return json({...result,html:renderComparison(result.target,result.branch,result.baseline)});
      }
      exact(input,"workspace_id,project_id,expected,intent");
      const result=await previewOperation(access,id,action==="branch-preview"?"branch":"incorporate",input.expected,input.intent);
      return json({...result,html:renderPreview(result.payload)});
    }
    const match=path.match(/^\/api\/work\/([a-f0-9-]+)\/(ticket|save|resolve|context|erase)$/);
    if(!match || !UUID.test(match[1]))fail("not_found",404);
    const [,id,action]=match;
    if(action==="ticket" || action==="context" || action==="erase") {
      const bound=action==="ticket" && "definition" in input;
      exact(input,action==="erase"?"workspace_id,project_id,expected,confirm":"workspace_id,project_id,expected"+(bound?",definition,notes"+("material_edits" in input?",material_edits":"")+("files" in input?",files":""):""));
      const expected=binding(input.expected);
      const chain=await readWork(access,id), head=chain.at(-1);
      if(!head)fail("work_not_found",404);
      if(!sameBinding(headBinding(head),expected))fail("refresh_required",409);
      if(action==="context") {const refs=await referenceAvailability(access,head);
        if(!await headsCurrent(access,reference(head),reference(head)))fail("refresh_required",409);
        return html(renderContext(head,chain.at(-2),refs.availability,refs.reviewSource));}
      if(action==="ticket") {
        const prepared=bound?selectedFiles(editedPayload(access,normalizePayload(access,input.definition,input.notes),input.notes,input.material_edits,head),input.files,head):undefined;
        if(prepared)historyFiles([...chain,{files:prepared.payload.files} as typeof head]);
        return json({ticket:ticket(access,id,expected,prepared?hash(canonical(prepared.payload)):undefined)});
      }
      if(input.confirm!=="erase-whole-work")fail("confirmation_required");
      await eraseWork(access,id,expected); return json({erased:true});
    }
    exact(input,"workspace_id,project_id,ticket,definition,notes"+("material_edits" in input?",material_edits":"")+("files" in input?",files":""));
    const t=readTicket(access,input.ticket,id,action==="resolve");
    const previous=await readWork(access,id); // Integrity validation, NOT the write gate.
    const base=previous.find(r=>r.revision===t.expected.revision);
    const {payload,bodies}=selectedFiles(editedPayload(access,normalizePayload(access,input.definition,input.notes),input.notes,input.material_edits,base),input.files,base);
    if(t.payload_fingerprint && hash(canonical(payload))!==t.payload_fingerprint)fail("altered_replay",409);
    const fingerprint=requestFingerprint(access,id,t.expected,t.request_key,payload);
    const previousRequest=await requestRevision(access,t.request_key);
    if(previousRequest && (previousRequest.work_id!==id || previousRequest.request_fingerprint!==fingerprint))fail("altered_replay",409);
    const current=previous.at(-1);
    if(!previousRequest && t.payload_fingerprint && current?.relations && sameBinding(headBinding(current),t.expected) &&
      canonical(payload)===canonical({definition:current.definition,sources:current.sources,relations:current.relations,...(current.files!==undefined?{files:current.files}:{})}) &&
      await headsCurrent(access,reference(current),reference(current))) {
      return json({outcome:"saved",saved:current,head:headBinding(current),noop:true});
    }
    if(action==="resolve") {
      const observed=await readWork(access,id), resolved=observed.find(r=>r.request_key===t.request_key);
      if(resolved && resolved.request_fingerprint!==fingerprint)fail("altered_replay",409);
      return json({outcome:resolved?"saved":"unknown",saved:resolved??null,head:headBinding(observed.at(-1))});
    }
    if(!previousRequest) {
      if(!sameBinding(headBinding(previous.at(-1)),t.expected))fail("conflict",409);
      historyFiles([...previous,{files:payload.files} as NonNullable<typeof base>]);
      const next=makeRevision(access,id,t.expected,t.request_key,payload,new Date().toISOString());
      assertHistoryBudget([...previous,next]);
      await append(access,next,undefined,bodies);
    }
    const chain=await readWork(access,id);
    const saved=chain.find(r=>r.request_key===t.request_key);
    if(!saved)fail("conflict",409);
    if(saved.request_fingerprint!==fingerprint)fail("altered_replay",409);
    return json({outcome:"saved",saved,head:headBinding(chain.at(-1)),replayed:!!previousRequest});
  } catch(error) {
    // A failed/ambiguous storage operation is unavailable, never empty or proof of noncommit.
    return json({error:error instanceof Refusal?error.code:"storage_unavailable"},error instanceof Refusal?error.status:503);
  }
}
