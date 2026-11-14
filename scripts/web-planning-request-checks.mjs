import assert from 'node:assert/strict';
import { REQUEST_BYTES } from '../apps/web_planning/src/contract.ts';
import { dispatchRequestHeaders } from './web-planning-local-runtime.mjs';
import { checkRequestHeaderTransport } from './web-planning-request-transport-checks.mjs';

// Exercise the production request reader through the existing local Worker.
// Tickets are read/preparation responses; no revision should be written here.
export async function checkRequestBodies({server,client,passed}) {
 await checkRequestHeaderTransport();
 passed('header-first refusal transport requires a complete response, no upload and owned socket cleanup');
 const scope={workspace_id:server.env.WORKSPACE_ID,project_id:server.env.PROJECT_ID};
 const payload=JSON.stringify(scope),before=await server.db.prepare('SELECT count(*) n FROM web_planning_revision').first();
 const request=(type,body=payload,headers={})=>server.mf.dispatchFetch(server.origin+'/api/drafts',{
   method:'POST',headers:{cookie:client.cookies,origin:server.origin,'x-csrf-token':client.csrf,
     ...(type===null?{}:{'content-type':type}),...headers},body,duplex:'half'});
 async function refused(response,status,error,label) {const r=await response;assert.equal(r.status,status,label);assert.equal((await r.json()).error,error,label);}
 for(const type of [
   'application/json','Application/JSON','application/json; charset=utf-8','application/json;charset=UTF-8',
   'Application/Json ; Charset="UTF-8"','application/json; profile="a;b\\\"c"; version=1',
   'application/json; ; charset=utf-8;','application/json; charset=iso-8859-1',' application/json \t; \tprofile="" \t',
 ]) {
   const r=await request(type);assert.equal(r.status,200,type);assert.equal(typeof (await r.json()).ticket,'string');
 }
 for(const type of [null,'text/plain','application/jsonx','application/problem+json','application /json',
   'application/json, text/plain','application/json; charset','application/json; charset=',
   'application/json; =utf-8','application/json; charset =utf-8','application/json; charset="unterminated',
   'application/json; charset="utf-8"suffix','application/json; profile=a/b'])
   await refused(request(type,type===null?new TextEncoder().encode(payload):payload),415,'json_required',String(type));
 passed('JSON request media type accepts case and valid token/quoted parameters; non-JSON and malformed values refuse');

 await refused(request('application/json; charset=utf-8','{'),422,'invalid_body');
 await refused(request('application/json; charset=iso-8859-1',new Uint8Array([0xff])),422,'invalid_body');
 const oversized=JSON.stringify({...scope,padding:'x'.repeat(REQUEST_BYTES)});
 const bytes=new TextEncoder().encode(oversized);
 // The declared-length guard must respond before a body upload. The separate
 // unknown-length stream below still exercises actual bytes and reader limits.
 await refused(dispatchRequestHeaders(server,server.origin+'/api/drafts',{method:'POST',headers:{
   cookie:client.cookies,origin:server.origin,'x-csrf-token':client.csrf,
   'content-type':'application/json; charset=utf-8','content-length':String(bytes.byteLength)},
 }),413,'request_too_large','declared oversized request before upload');
 const streamed=new ReadableStream({start(controller){controller.enqueue(bytes.subarray(0,1024));controller.enqueue(bytes.subarray(1024));controller.close();}});
 await refused(request('Application/JSON; charset="UTF-8"',streamed),413,'request_too_large');
 passed('JSON parameters never change strict UTF-8, malformed-body rejection or declared/streamed request bounds');

 await refused(request('application/json; charset=utf-8',payload,{cookie:''}),403,'access_denied');
 await refused(request('application/json; charset=utf-8',payload,{'x-csrf-token':'wrong'}),403,'csrf_required');
 await refused(request('application/json; charset=utf-8',payload,{origin:'https://other.example'}),403,'same_origin_required');
 await refused(request('application/json; charset=utf-8',JSON.stringify({...scope,project_id:'00000000-0000-4000-8000-000000000000'})),403,'scope_denied');
 assert.deepEqual(await server.db.prepare('SELECT count(*) n FROM web_planning_revision').first(),before);
 passed('JSON media type compatibility preserves identity, CSRF, origin and project scope without revision writes');
}
