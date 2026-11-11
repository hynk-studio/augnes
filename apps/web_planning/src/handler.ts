/// <reference path="./assets.d.ts" />
import { PARTICIPATION_EXPORT } from "./participation-contract";
import { activeGrant, knownRecipient, createGrant, listGrants, participantContext, participantFeedbackView, participantFile, participantView, participantWrite, revokeGrant } from "./participation";
import { participantPage, participantRecoveryPage } from "./participation-page";
import participantRecoveryClient from "./participation-recovery.js.txt?raw";
import participantJournal from "./participation-journal.js.txt?raw";
import participantClient from "./participation-client.js.txt?raw";
import projectsClient from './projects-client.js.txt?raw';
import { projectEntryPage } from './project-entry';
import { createProject, listProjects } from './projects';
import { applyReturn, inspectReturn } from "./return-continuation";
import { inspectUse, previewReassessment, saveReassessment } from "./return-reassessment-ops";
import { REASSESSMENT_EXPORT } from "./return-reassessment";
import { USE_EXPORT } from "./return-use";
import { readExchangePage } from "./exchange-reading";
import { inspectWorkMatch, searchQuery, searchWork } from "./work-search";
import { LARGE_EXPORT, exchangeList } from "./exchange";
import { writeExchange } from "./exchange-write";
import { notebookFrom } from "./scene-contract";
import { directionComparison, validateDirectionReferences } from "./directions";
import { hasSceneFile } from "./file-relations";
import { DIRECTION_EXPORT, directionExport, validateDirectionExport } from "./direction-recovery";
import { prepareSceneContext, prepareSceneDraft, previewSceneReview, saveSceneReview } from "./scenes";
import { type FileBody, FILE_EXPORT_REQUEST_BYTES, LARGE_EXPORT_REQUEST_BYTES, LARGE_PAIR_REQUEST_BYTES, EXCHANGE_REQUEST_BYTES, historyFiles, selectedFiles, validateFileExport } from "./files";
import { authorize, csrfCookie, csrfToken, readTicket, requireCsrf, requireScope, ticket, projectEntryEnabled, selectedProject, type Environment, type Principal } from "./access";
import { binding, canonical, exact, exportWork, fail, hash, makeRevision, normalizePayload, reference, Refusal, REQUEST_BYTES, requestFingerprint, sameBinding, UUID, validateExport, validateRetainedIncorporations, type Revision } from "./contract";
import { inspectDraftCapacity } from "./capacity";
import { append, completeExport, downloadFile, eraseWork, headBinding, headsCurrent, listWork, readNoteHistory, readWork, reconstruct, reconstructWorks, requestRevision } from "./store";
import { page, renderContext, renderComparison, renderPreview, style } from "./page";
import { compare, editedPayload, previewOperation, referenceAvailability, saveOperation, selectionHistories } from "./relations";
import exchangeClient from "./exchange-client.js.txt?raw";
import reassessmentClient from "./reassessment-client.js.txt?raw";
import exchangeTextModule from "../../augnes_apps/scripts/exchange-text.mjs?raw" with { type: "text" };
import planningNotes from "../../augnes_apps/scripts/planning-notes.mjs?raw" with { type: "text" };
import client from "./client.js.txt?raw";
import historyClient from "./history-client.js.txt?raw";
import searchClient from "./search-client.js.txt?raw";
import { readableExport } from "./readable-export";
const headers={"Cache-Control":"no-store, private","Vary":"Cookie, oai-authenticated-user-email","X-Web-Planning-Response":"1","X-Content-Type-Options":"nosniff",
  "Referrer-Policy":"no-referrer","X-Frame-Options":"DENY","X-Robots-Tag":"noindex, nofollow",
  "Content-Security-Policy":"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"};
function json(value:unknown,status=200) { return new Response(JSON.stringify(value),{status,headers:{...headers,"Content-Type":"application/json"}}); }
function html(value:string,extra:Record<string,string>={}) { return new Response(value,{headers:{...headers,"Content-Type":"text/html; charset=utf-8",...extra}}); }
// RFC 9110 media types allow case-insensitive type/subtype and token/quoted parameters.
// Parameters, including charset, do not change JSON's strict UTF-8 decoding below.
const JSON_CONTENT_TYPE=/^[\t ]*application\/json[\t ]*(?:;[\t ]*(?:[!#$%&'*+.^_`|~0-9A-Za-z-]+=(?:[!#$%&'*+.^_`|~0-9A-Za-z-]+|"(?:[\t \x21\x23-\x5B\x5D-\x7E\x80-\xFF]|\\[\t \x21-\x7E\x80-\xFF])*")[\t ]*)?)*$/i;
async function body(request:Request,limit=REQUEST_BYTES) {
  if(!JSON_CONTENT_TYPE.test(request.headers.get("content-type")??"")) fail("json_required",415);
  const reader=request.body?.getReader(); if(!reader) fail("invalid_body");
  const declared=request.headers.get("content-length");
  if(declared!==null && Number(declared)>limit){await reader.cancel();fail("request_too_large",413);}
  const decoder=new TextDecoder("utf-8",{fatal:true}),parts:string[]=[];
  let length=0,pending="";
  try { for(;;) { const {done,value}=await reader.read(); if(done)break; length+=value.byteLength;
    if(length>limit) { await reader.cancel(); fail("request_too_large",413); }
    pending+=decoder.decode(value,{stream:true});
    if(pending.length>=65536){parts.push(pending);pending="";}
    }
    parts.push(pending+decoder.decode());return JSON.parse(parts.join(""));
  } catch(e) { if(e instanceof Refusal)throw e; fail("invalid_body"); }
}
function savedPlanning(r:Revision){
  return {definition:r.definition,sources:r.sources,relations:r.relations,...(r.files!==undefined?{files:r.files}:{})};
}
function sealedPlanning(r:Revision){return {...savedPlanning(r),...(r.return_use?{return_use:r.return_use}:{})};}
function draftFingerprint(input:Record<string,unknown>){
  const {ticket,expected,workspace_id,project_id,...draft}=input;
  return hash(canonical(draft));
}
// A ticket issued by an earlier Worker might have sealed the wrong matching
// occurrence. Disclose that conflict from B alone; never rewrite the receipt.
function checkReplayedOccurrences(saved: Revision,edits: any[]) {
  for(const edit of edits)if(edit?.mode==="reuse" && edit.historical &&
    !saved.relations?.materials.some(m=>m.source_ref===edit.historical.source_ref && canonical(m.from)===canonical(edit.historical)))
    fail("historical_selection_conflict",409);
}
export async function handle(request:Request,env:Environment,principal:Principal):Promise<Response> {
  try {
    const url=new URL(request.url), path=url.pathname;
    const participant=path.match(/^\/(participate|api\/participation)\/([a-f0-9-]{36})(.*)$/);
    if(participant && UUID.test(participant[2])){
      const access=await authorize(request,env,principal,participant[2]),id=participant[2],suffix=participant[3];
      // Ended/erased grants can recover only a draft already in this browser.
      // Reauthentication still binds the exact original recipient; no server
      // request, file, feedback or acknowledgement is exposed through this shell.
      if(participant[1]==='api/participation'&&suffix==='/recovery.js'&&!url.search&&request.method==='GET'){
        await knownRecipient(access,id);
        return new Response(participantJournal+"\n"+participantRecoveryClient,{headers:{...headers,'Content-Type':'text/javascript; charset=utf-8'}});
      }
      let c;
      try{c=await participantContext(access,id);}catch(e){
        if(e instanceof Refusal&&['participation_unavailable','work_erased','exchange_request_unavailable'].includes(e.code)&&
          participant[1]==='participate'&&!suffix&&!url.search&&request.method==='GET'){
          await knownRecipient(access,id);
          return new Response(participantRecoveryPage(id),{status:403,headers:{...headers,'Content-Type':'text/html; charset=utf-8'}});
        }
        throw e;
      }
      let result:Response;
      if(participant[1]==='participate' && !suffix && !url.search && request.method==='GET'){
        const csrf=csrfToken(access,request);
        result=html(participantPage(csrf,id,access),{'Set-Cookie':csrfCookie(access,csrf)});
      }else if(participant[1]!=='api/participation')fail('scope_denied',403);
      else if(request.method==='GET' && !url.search && suffix==='/client.js')result=new Response(participantJournal+"\n"+participantClient,{headers:{...headers,'Content-Type':'text/javascript; charset=utf-8'}});
      else if(request.method==='GET' && !url.search && suffix==='/exchange-text.mjs')result=new Response(exchangeTextModule,{headers:{...headers,'Content-Type':'text/javascript; charset=utf-8'}});
      else if(request.method==='GET' && !url.search && suffix==='/style.css')result=new Response(style,{headers:{...headers,'Content-Type':'text/css; charset=utf-8'}});
      else if(request.method==='GET' && !url.search && suffix==='')result=json(participantView(access,c));
      else if(request.method==='GET' && suffix==='/feedback'){
        if([...url.searchParams.keys()].some(k=>k!=='cursor')||url.searchParams.getAll('cursor').length>1)fail('scope_denied',403);
        result=json(await participantFeedbackView(access,c,url.searchParams.get('cursor')));
      }else if(request.method==='GET' && !url.search && suffix==='/setup'){
        result=new Response(JSON.stringify({format:'augnes_web_participation.v1',origin:env.APP_ORIGIN,workspace_id:access.workspace_id,project_id:access.project_id,work_id:c.g.work_id,grant_id:id,request:c.d.request}),
          {headers:{...headers,'Content-Type':'application/json','Content-Disposition':'attachment; filename=participant-setup.json'}});
      }else{
        if(url.search)fail('scope_denied',403);
        const file=suffix.match(/^\/files\/([1-9][0-9]{0,15})\/([a-f0-9]{64})\/([0-7])(\/text)?$/);
        if(file){
          const r=participantFile(c,Number(file[1]),'sha256:'+file[2],Number(file[3]));
          if(request.method==='GET'&&!file[4]){
            const {file:meta,bytes}=await downloadFile(access,r,Number(file[3]),true);
            result=new Response(bytes,{headers:{...headers,'Content-Type':'application/octet-stream','Content-Disposition':`attachment; filename="artifact.bin"; filename*=UTF-8''${encodeURIComponent(meta.name).replace(/['()*]/g,x=>'%'+x.charCodeAt(0).toString(16))}`,'X-Content-SHA256':meta.digest,'Content-Length':String(meta.bytes)}});
          }else if(request.method==='POST'&&file[4]){
            requireCsrf(access,request);const input=await body(request);requireScope(access,input);
            result=json(await readExchangePage(access,r,Number(file[3]),input));
          }else fail('scope_denied',403);
        }else if(request.method==='POST' && ['/save','/resolve'].includes(suffix)){
          requireCsrf(access,request);const input=await body(request,EXCHANGE_REQUEST_BYTES);requireScope(access,input);
          result=json(await participantWrite(access,c,input,suffix==='/resolve'));
        }else fail('scope_denied',403);
      }
      await activeGrant(access,id); // Readback/authorization loss never becomes an empty result.
      return result;
    }
    const accountEntry=projectEntryEnabled(env)&&(path==='/projects'||path==='/api/projects'||path==='/projects.js'||
      path==='/'&&!url.search&&!request.headers.has('x-web-planning-project')||['/style.css','/client.js','/exchange-text.mjs','/planning-notes.mjs','/favicon.ico'].includes(path));
    const access=await authorize(request,env,principal,undefined,accountEntry);
    if(accountEntry){
      if(request.method==='GET'&&!url.search&&(path==='/'||path==='/projects')){
        const csrf=csrfToken(access,request);return html(projectEntryPage(csrf,access),{'Set-Cookie':csrfCookie(access,csrf)});
      }
      if(path==='/api/projects'){
        if(request.method==='GET'){
          if([...url.searchParams.keys()].some(k=>k!=='cursor')||url.searchParams.getAll('cursor').length>1)fail('scope_denied',403);
          return json(await listProjects(access,url.searchParams.get('cursor')??''));
        }
        if(request.method!=='POST'||url.search)fail('method_not_allowed',405);
        requireCsrf(access,request);return json(await createProject(access,await body(request)));
      }
      if(path==='/projects.js'&&request.method==='GET'&&!url.search)return new Response(projectsClient,{headers:{...headers,'Content-Type':'text/javascript; charset=utf-8'}});
    }
    if(request.method==="GET") {
      if(path==="/favicon.ico" && !url.search)return new Response(null,{status:204,headers});
      if(path==="/" && (!url.search || selectedProject(request))) {
        const csrf=csrfToken(access,request);
        return html(page(csrf,access),{"Set-Cookie":csrfCookie(access,csrf)});
      }
      if(path==="/client.js" && !url.search) return new Response(client+"\n"+exchangeClient+"\n"+historyClient+"\n"+searchClient+"\n"+participantJournal+"\n"+reassessmentClient,{headers:{...headers,"Content-Type":"text/javascript; charset=utf-8"}});
      if(path==="/exchange-text.mjs" && !url.search) return new Response(exchangeTextModule,{headers:{...headers,"Content-Type":"text/javascript; charset=utf-8"}});
      if(path==="/planning-notes.mjs" && !url.search) return new Response(planningNotes,{headers:{...headers,"Content-Type":"text/javascript; charset=utf-8"}});
      if(path==="/style.css" && !url.search) return new Response(style,{headers:{...headers,"Content-Type":"text/css; charset=utf-8"}});
      if(path==="/api/project" && !url.search) return json({workspace_id:access.workspace_id,project_id:access.project_id,
        author_ref:access.author_ref,name:access.projectName || "Private planning workspace",continuation_work_id:access.continuationWork??null,tasks:"/api/works"});
      if(path==='/api/project/continuation'&&!url.search){
        if(!access.continuationWork)fail('project_continuation_unavailable',404);
        const chain=await readWork(access,access.continuationWork);if(!chain.length)fail('project_continuation_unavailable',404);
        return json({saved:chain.at(-1)});
      }
      if(path==="/api/works/search") {
        if([...url.searchParams.keys()].some(k=>k!=="q"&&k!=="cursor") || url.searchParams.getAll("q").length!==1 ||
          url.searchParams.getAll("cursor").length>1)fail("scope_denied",403);
        return json(await searchWork(access,searchQuery(url.searchParams.get("q")),url.searchParams.get("cursor")));
      }
      if(path==="/api/works/match") {
        if([...url.searchParams.keys()].some(k=>k!=="selection") || url.searchParams.getAll("selection").length!==1)fail("scope_denied",403);
        return json(await inspectWorkMatch(access,url.searchParams.get("selection")!));
      }
      if(path==="/api/works") {
        if([...url.searchParams.keys()].some(k=>k!=="cursor") || url.searchParams.getAll("cursor").length>1) fail("scope_denied",403);
        const cursor=url.searchParams.get("cursor")??"";
        if(cursor && !UUID.test(cursor))fail("invalid_cursor");
        return json(await listWork(access,cursor));
      }
      const grants=path.match(/^\/api\/work\/([a-f0-9-]+)\/participation$/);
      if(grants && UUID.test(grants[1])){
        if([...url.searchParams.keys()].some(k=>k!=='cursor')||url.searchParams.getAll('cursor').length>1)fail('scope_denied',403);
        return json(await listGrants(access,grants[1],url.searchParams.get('cursor')??''));
      }
      const exchanges=path.match(/^\/api\/work\/([a-f0-9-]+)\/exchanges$/);
      if(exchanges && UUID.test(exchanges[1]) && !url.search) return json(exchangeList(await readWork(access,exchanges[1])));
      const fileMatch=path.match(/^\/api\/work\/([a-f0-9-]+)\/(files|exchange-files)\/([1-9][0-9]{0,15})\/([a-f0-9]{64})\/([0-7])$/);
      if(fileMatch && UUID.test(fileMatch[1]) && !url.search) {
        const chain=await readWork(access,fileMatch[1]);
        const revision=chain.find(r=>r.revision===Number(fileMatch[3]) && r.fingerprint==="sha256:"+fileMatch[4]);
        if(!revision)fail("file_revision_unavailable",409);
        const {file,bytes}=await downloadFile(access,revision,Number(fileMatch[5]),fileMatch[2]==="exchange-files");
        const name=encodeURIComponent(file.name).replace(/['()*]/g,c=>"%"+c.charCodeAt(0).toString(16).toUpperCase());
        return new Response(bytes,{headers:{...headers,"Content-Type":"application/octet-stream","Content-Disposition":`attachment; filename="artifact.bin"; filename*=UTF-8''${name}`,"X-Content-SHA256":file.digest,"Content-Length":String(file.bytes)}});
      }
      const match=path.match(/^\/api\/work\/([a-f0-9-]+)(?:\/(history|export|reading-export))?$/);
      if(match?.[2]==="history" && UUID.test(match[1]) && url.search==="?view=notes")
        return json({revisions:await readNoteHistory(access,match[1])});
      if(match && UUID.test(match[1]) && !url.search) {
        const chain=await readWork(access,match[1]); if(!chain.length)fail("work_not_found",404);
        if(match[2]==="export" || match[2]==="reading-export"){
          const value=chain.some(r=>r.files!==undefined)?await completeExport(access,chain):exportWork(chain);
          if(!await headsCurrent(access,reference(chain.at(-1)!),reference(chain.at(-1)!)))fail("refresh_required",409);
          if(match[2]==="export"&&"files" in value){const book=notebookFrom(chain.at(-1)!,value.files as FileBody[]);if(book.inheritance||book.adoptions?.length)fail("direction_closure_required",409);}
          if(match[2]==="reading-export")return new Response(readableExport(chain,"files" in value?value.files:[]),{headers:{...headers,"Content-Type":"text/html; charset=utf-8","Content-Disposition":"attachment; filename=authored-work.html","Content-Security-Policy":"default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"}});
          return new Response(canonical(value),{headers:{...headers,"Content-Type":"application/json","Content-Disposition":"attachment; filename=planning-work.json"}});
        }
        return json(match[2]==="history"?{revisions:chain}:{saved:chain.at(-1),exchanges:exchangeList(chain)});
      }
      fail("not_found",404);
    }
    if(request.method!=="POST" || url.search)fail("method_not_allowed",405);
    requireCsrf(access,request);
    const exchange=path.match(/^\/api\/work\/([a-f0-9-]+)\/exchanges\/(save|resolve)$/);
    const extendedRestore=path==="/api/reconstruct-exchange" || path==="/api/reconstruct-directions";
    if(extendedRestore && env.RECONSTRUCTION_MODE!=="quiesced-empty-store")fail("reconstruction_disabled",403);
    const limit=exchange?EXCHANGE_REQUEST_BYTES:path==="/api/reconstruct-exchange"?LARGE_EXPORT_REQUEST_BYTES:
      path==="/api/reconstruct-directions"?LARGE_PAIR_REQUEST_BYTES:path==="/api/reconstruct-files"?FILE_EXPORT_REQUEST_BYTES:REQUEST_BYTES;
    const input=await body(request,limit); if(!input || typeof input!=="object")fail("invalid_body");
    requireScope(access,input);
    const grant=path.match(/^\/api\/work\/([a-f0-9-]+)\/participation\/(create|revoke)$/);
    if(grant&&UUID.test(grant[1]))return json(await (grant[2]==='create'?createGrant(access,grant[1],input):revokeGrant(access,grant[1],input)));
    const text=path.match(/^\/api\/work\/([a-f0-9-]+)\/(exchange-files|files)\/([1-9][0-9]{0,15})\/([a-f0-9]{64})\/([0-7])\/text$/);
    if(text && UUID.test(text[1])){
      const chain=await readWork(access,text[1]),r=chain[Number(text[3])-1];
      if(!r || r.fingerprint!=="sha256:"+text[4])fail("file_revision_unavailable",409);
      return json(await readExchangePage(access,r,Number(text[5]),input,text[2]==="exchange-files"));
    }
    const inspection=path.match(/^\/api\/work\/([a-f0-9-]+)\/inspect-return$/);
    if(inspection && UUID.test(inspection[1]))return json(await inspectReturn(access,inspection[1],input));
    const reassessment=path.match(/^\/api\/work\/([a-f0-9-]+)\/(inspect-use|reassessment-preview|reassessment-save|reassessment-resolve)$/);
    if(reassessment && UUID.test(reassessment[1])){
      const [,id,action]=reassessment;
      if(action==="inspect-use")return json(await inspectUse(access,id,input));
      if(action==="reassessment-preview"){exact(input,"workspace_id,project_id,intent");return json(await previewReassessment(access,id,input.intent));}
      const resolve=action==="reassessment-resolve";
      exact(input,"workspace_id,project_id,ticket"+(resolve?"":",intent"));
      return json(await saveReassessment(access,id,input.ticket,input.intent,resolve));
    }
    if(exchange && UUID.test(exchange[1]))return json(await writeExchange(access,exchange[1],input,exchange[2]==="resolve"));
    const capacity=path.match(/^\/api\/work\/([a-f0-9-]+)\/capacity$/);
    if(path==="/api/capacity" || (capacity && UUID.test(capacity[1]))) {
      exact(input,"workspace_id,project_id,check_id,definition,notes,material_edits"+(capacity?",expected":""));
      if(!UUID.test(input.check_id))fail("invalid_check_id");
      const expected=capacity?binding(input.expected):headBinding();
      const chain=capacity?await readWork(access,capacity[1]):[],head=chain.at(-1);
      if(capacity && !head)fail("work_not_found",404);
      if(!sameBinding(headBinding(head),expected))fail("refresh_required",409);
      const {histories}=await selectionHistories(access,capacity?.[1]??"",input.material_edits);
      const result=inspectDraftCapacity(access,{definition:input.definition,notes:input.notes,material_edits:input.material_edits},chain,histories);
      if(head && !await headsCurrent(access,reference(head),reference(head)))fail("refresh_required",409);
      return json({...result,check_id:input.check_id});
    }
    if(path==="/api/drafts") {
      const bound="definition" in input;
      exact(input,"workspace_id,project_id"+(bound?",definition,notes"+("material_edits" in input?",material_edits":"")+("files" in input?",files":"")+("return_choice" in input?",return_choice":""):"")); const work_id=crypto.randomUUID();
      const fingerprint=bound?hash(canonical((await applyReturn(access,work_id,[],await prepareSceneDraft(access,[],selectedFiles(editedPayload(access,normalizePayload(access,input.definition,input.notes),input.notes,input.material_edits),input.files),undefined),input.return_choice)).payload)):undefined;
      return json({work_id,ticket:ticket(access,work_id,headBinding(),fingerprint,input.return_choice?draftFingerprint(input):undefined)});
    }
    if(path==="/api/reconstruct" || path==="/api/reconstruct-files" || extendedRestore) {
      exact(input,"workspace_id,project_id,export,confirm");
      if(env.RECONSTRUCTION_MODE!=="quiesced-empty-store" || input.confirm!=="reconstruct-empty-store")fail("reconstruction_disabled",403);
      if(path==="/api/reconstruct-exchange" && ![LARGE_EXPORT,USE_EXPORT,PARTICIPATION_EXPORT,REASSESSMENT_EXPORT].includes(input.export?.format) ||
         path==="/api/reconstruct-directions" && input.export?.format!==DIRECTION_EXPORT)fail("incompatible_format",409);
      if((path==="/api/reconstruct-files" || path==="/api/reconstruct-directions") && input.export?.format===DIRECTION_EXPORT){
        const works=validateDirectionExport(access,input.export);await reconstructWorks(access,works);
        return json({saved:works[0].chain.at(-1),works:works.map(w=>reference(w.chain.at(-1)!)),authorship:"imported attestation; not independently verified"});
      }
      const {chain,bodies}=path!=="/api/reconstruct"?validateFileExport(access,input.export):{chain:validateExport(access,input.export),bodies:[]};
      for(const r of chain)validateDirectionReferences(notebookFrom(r,bodies),()=>undefined);
      await reconstruct(access,chain,bodies);
      return json({saved:chain.at(-1),authorship:"imported attestation; not independently verified"});
    }
    const scene=path.match(/^\/api\/work\/([a-f0-9-]+)\/(scene-context|scene-review-preview|scene-review-save|scene-review-resolve)$/);
    if(scene && UUID.test(scene[1])) {
      const [,id,action]=scene;
      if(action==="scene-review-save" || action==="scene-review-resolve") {
        exact(input,"workspace_id,project_id,ticket,intent");
        return json(await saveSceneReview(access,id,input.ticket,input.intent,action==="scene-review-resolve"));
      }
      exact(input,"workspace_id,project_id,expected,intent");
      return json(action==="scene-context"?await prepareSceneContext(access,id,input.expected,input.intent):await previewSceneReview(access,id,input.expected,input.intent));
    }
    const relation=path.match(/^\/api\/work\/([a-f0-9-]+)\/(branch-preview|compare|direction-export|incorporation-preview|relation-save|relation-resolve)$/);
    if(relation && UUID.test(relation[1])) {
      const [,id,action]=relation;
      if(action==="relation-save" || action==="relation-resolve") {
        exact(input,"workspace_id,project_id,ticket,intent");
        return json(await saveOperation(access,id,input.ticket,input.intent,action==="relation-resolve"));
      }
      if(action==="compare"||action==="direction-export") {
        exact(input,"workspace_id,project_id,expected,source");
        const result=await compare(access,id,input.expected,input.source);
        const direction=hasSceneFile(result.branch)?await directionComparison(access,result.target,result.branch):undefined;
        if(action==="direction-export"){
          const chains=await Promise.all([readWork(access,result.target.work_id),readWork(access,result.branch.work_id)]);
          const works=[];for(const chain of chains)works.push(await completeExport(access,chain));
          const recovery=directionExport(works);validateDirectionExport(access,recovery);
          if(!await headsCurrent(access,reference(result.target),reference(result.branch)))fail("refresh_required",409);
          return json({recovery,reading:works.map(w=>readableExport(w.revisions,w.files))});
        }
        if(!await headsCurrent(access,reference(result.target),reference(result.branch)))fail("refresh_required",409);
        const {target,branch,baseline}=result;
        return json({target,branch,baseline,direction,html:renderComparison(target,branch,baseline)});
      }
      exact(input,"workspace_id,project_id,expected,intent");
      const result=await previewOperation(access,id,action==="branch-preview"?"branch":"incorporate",input.expected,input.intent);
      return json({...result,html:renderPreview(result.payload,result.target??undefined)});
    }
    const match=path.match(/^\/api\/work\/([a-f0-9-]+)\/(ticket|save|resolve|context|erase)$/);
    if(!match || !UUID.test(match[1]))fail("not_found",404);
    const [,id,action]=match;
    if(action==="ticket" || action==="context" || action==="erase") {
      const bound=action==="ticket" && "definition" in input;
      exact(input,action==="erase"?"workspace_id,project_id,expected,confirm":"workspace_id,project_id,expected"+(bound?",definition,notes"+("material_edits" in input?",material_edits":"")+("files" in input?",files":"")+("scene" in input?",scene":"")+("return_choice" in input?",return_choice":""):""));
      const expected=binding(input.expected);
      const chain=await readWork(access,id), head=chain.at(-1);
      if(!head)fail("work_not_found",404);
      if(!sameBinding(headBinding(head),expected))fail("refresh_required",409);
      if(action==="context") {const refs=await referenceAvailability(access,head);
        if(!await headsCurrent(access,reference(head),reference(head)))fail("refresh_required",409);
        return html(renderContext(head,chain.at(-2),refs.availability,refs.reviewSource,exchangeList(chain).decisions.flatMap(d=>"current" in d?[d.current!]:[])));}
      if(action==="ticket") {
        const {histories}=await selectionHistories(access,id,input.material_edits);
        const prepared=bound?await applyReturn(access,id,chain,await prepareSceneDraft(access,chain,selectedFiles(editedPayload(access,normalizePayload(access,input.definition,input.notes),input.notes,input.material_edits,chain,histories),input.files,head),input.scene),input.return_choice):undefined;
        if(prepared){
          validateRetainedIncorporations(head,prepared.payload);
          historyFiles([...chain,{files:prepared.payload.files} as typeof head]);
        }
        return json({ticket:ticket(access,id,expected,prepared?hash(canonical(prepared.payload)):undefined,histories.size||input.return_choice?draftFingerprint(input):undefined)});
      }
      if(input.confirm!=="erase-whole-work")fail("confirmation_required");
      await eraseWork(access,id,expected); return json({erased:true});
    }
    // A reloaded tab keeps only its signed receipt, never private authored bytes.
    if(action==="resolve" && !("definition" in input)){
      exact(input,"workspace_id,project_id,ticket");const t=readTicket(access,input.ticket,id,true);
      if(!t.draft_fingerprint||!t.payload_fingerprint)fail("bound_selection_ticket_required",409);
      const chain=await readWork(access,id),saved=chain.find(r=>r.request_key===t.request_key);
      if(saved && (!saved.return_use||hash(canonical(sealedPlanning(saved)))!==t.payload_fingerprint||saved.predecessor!==t.expected.fingerprint||saved.revision!==t.expected.revision+1))fail("altered_replay",409);
      return json({outcome:saved?"saved":"unknown",saved:saved??null,head:headBinding(chain.at(-1))});
    }
    exact(input,"workspace_id,project_id,ticket,definition,notes"+("material_edits" in input?",material_edits":"")+("files" in input?",files":"")+("scene" in input?",scene":"")+("return_choice" in input?",return_choice":""));
    const t=readTicket(access,input.ticket,id,action==="resolve");
    const previous=await readWork(access,id); // Integrity validation, NOT the write gate.
    // For foreign selections the ticket also seals the submitted draft. Once
    // committed, its request and exact payload live in B; A may have been erased.
    if(t.draft_fingerprint){
      if(draftFingerprint(input)!==t.draft_fingerprint)fail("altered_replay",409);
      const saved=previous.find(r=>r.request_key===t.request_key);
      if(saved){
        if(hash(canonical(sealedPlanning(saved)))!==t.payload_fingerprint || saved.revision!==t.expected.revision+1 || saved.predecessor!==t.expected.fingerprint)fail("altered_replay",409);
        checkReplayedOccurrences(saved,input.material_edits??[]);
        return json({outcome:"saved",saved,head:headBinding(previous.at(-1)),replayed:true});
      }
      if(action==="resolve"){
        const head=previous.at(-1);
        if(!input.return_choice && head?.relations && sameBinding(headBinding(head),t.expected) && hash(canonical(savedPlanning(head)))===t.payload_fingerprint &&
           await headsCurrent(access,reference(head),reference(head))){
          checkReplayedOccurrences(head,input.material_edits);
          return json({outcome:"saved",saved:head,head:headBinding(head),noop:true});
        }
        return json({outcome:"unknown",saved:null,head:headBinding(head)});
      }
    }
    const {histories,snapshots}=await selectionHistories(access,id,input.material_edits);
    if((histories.size || input.return_choice) && !t.draft_fingerprint)fail("bound_selection_ticket_required",409);
    const base=previous.find(r=>r.revision===t.expected.revision);
    const prefix=previous.slice(0,t.expected.revision);
    const {payload,bodies}=await applyReturn(access,id,prefix,await prepareSceneDraft(access,prefix,selectedFiles(editedPayload(access,normalizePayload(access,input.definition,input.notes),input.notes,input.material_edits,prefix,histories),input.files,base),input.scene),input.return_choice);
    if(t.payload_fingerprint && hash(canonical(payload))!==t.payload_fingerprint)fail("altered_replay",409);
    const fingerprint=requestFingerprint(access,id,t.expected,t.request_key,payload);
    const previousRequest=await requestRevision(access,t.request_key);
    if(previousRequest && (previousRequest.work_id!==id || previousRequest.request_fingerprint!==fingerprint))fail("altered_replay",409);
    const current=previous.at(-1);
    if(!previousRequest && t.payload_fingerprint && current?.relations && sameBinding(headBinding(current),t.expected) &&
      canonical(payload)===canonical(savedPlanning(current)) &&
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
      await append(access,previous,next,payload.return_use?.source_head,bodies,snapshots);
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
