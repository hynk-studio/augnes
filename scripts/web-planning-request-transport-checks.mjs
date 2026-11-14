import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { dispatchRequestHeaders } from './web-planning-local-runtime.mjs';

// Real loopback controls for the header-first refusal ingress. These are not
// production-handler or hosted acceptance substitutes.
export async function checkRequestHeaderTransport() {
 const sockets=new Set();let uploaded=0;
 const server=http.createServer((request,response)=>{
  request.on('data',chunk=>{uploaded+=chunk.length;});
  if(request.url==='/complete'){
   response.writeHead(413,{'content-type':'application/json'});
   response.end(JSON.stringify({error:'request_too_large'}));
  }else if(request.url==='/partial'){
   response.writeHead(413,{'content-type':'application/json','content-length':'100'});
   response.flushHeaders();response.write('{');response.socket.end();
  }else if(request.url==='/large')response.end('x'.repeat(4097));
  else request.socket.destroy();
 });
 server.on('connection',socket=>{sockets.add(socket);socket.on('close',()=>sockets.delete(socket));});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 const origin=`http://127.0.0.1:${server.address().port}`,headers={'content-length':'1500001','content-type':'application/json'};
 try{
  const response=await dispatchRequestHeaders({origin},origin+'/complete',{headers});
  assert.equal(response.status,413);assert.deepEqual(await response.json(),{error:'request_too_large'});assert.equal(uploaded,0);
  await assert.rejects(dispatchRequestHeaders({origin},origin+'/partial',{headers}),/response_aborted|response_incomplete|aborted/);
  await assert.rejects(dispatchRequestHeaders({origin},origin+'/large',{headers}),/response_too_large/);
  await assert.rejects(dispatchRequestHeaders({origin},origin+'/reset',{headers}),/socket hang up|response_incomplete/);
  await assert.rejects(dispatchRequestHeaders({origin},origin+'/complete',{headers,body:'forbidden'}),/local_headers_dispatch_only/);
  await assert.rejects(dispatchRequestHeaders({origin:'http://example.test'},'http://example.test/',{headers}),/local_headers_dispatch_only/);
  assert.equal(uploaded,0);
 }finally{
  const closed=once(server,'close');server.close();for(const socket of sockets)socket.destroy();await closed;
 }
 assert.equal(server.listening,false);
 return {complete_response:true,body_bytes_sent:uploaded,refusal_controls:5,listener_closed:true};
}
