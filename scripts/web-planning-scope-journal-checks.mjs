import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { runCanonicalChild, canonicalChildAcceptanceFailure } from './canonical-child-runner.mjs';
import { closeTrackedServer, trackServerConnections } from './test-harness-process-lifecycle.mjs';

const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};};

// Recovery-only wire fixture: real HTTP and unmodified CLI processes, with
// explicit response barriers. This is neither a D1 nor a qualification result.
export async function checkScopeJournalRetirement({root,passed,entry=path.resolve('apps/augnes_apps/scripts/file-exchange.mjs')}){
  for(const action of ['control','check','retry','recover']){
    const directory=path.join(root,'scope-journal-'+action);await mkdir(directory);
    const workspace_id=randomUUID(),project_id=randomUUID(),work_id=randomUUID();
    const request={work_id,revision:2,fingerprint:'sha256:'+'2'.repeat(64)};
    const prefix='/api/work/'+work_id;
    let head={revision:2,fingerprint:request.fingerprint},readBarrier=null,postBarrier=null,loseAck=true,postCount=0;
    const grants=new Map(),children=[],readEntered=deferred(),readRelease=deferred(),postEntered=deferred(),postRelease=deferred();
    const server=trackServerConnections(http.createServer(async(req,res)=>{
      try{
        assert.match(req.headers.cookie??'',/web_planning_local=scope-journal-fixture/);
        const chunks=[];for await(const c of req)chunks.push(c);
        const input=chunks.length?JSON.parse(Buffer.concat(chunks).toString()):null;
        const url=new URL(req.url,'http://127.0.0.1');let value;
        if(url.pathname==='/api/project')value={workspace_id,project_id,name:'Controlled journal overlap'};
        else if(url.pathname==='/'){
          res.writeHead(200,{'X-Web-Planning-Response':'1','Set-Cookie':'fixture_csrf=one; Path=/'});
          res.end('<meta name="csrf-token" content="fixture-csrf">');return;
        }else if(url.pathname===prefix+'/exchanges')value={head,items:[{kind:'request',ref:request,files:[{name:'selected.md'}]}]};
        else if(url.pathname===prefix+'/participation')value={grants:[...grants.values()],next:null};
        else if(req.method==='POST'&&url.pathname===prefix+'/participation/create'){
          assert.equal(req.headers['x-csrf-token'],'fixture-csrf');assert.equal(input.workspace_id,workspace_id);assert.equal(input.project_id,project_id);
          postCount++;
          const grant={id:input.grant_id,recipient:input.recipient,expires:input.expires,revoked_at:null,
            disclosure:{request:input.request,expected:input.expected,brief:input.brief,next_action:input.next_action,files:input.indices.map(index=>({index}))}};
          // In the recovery case S1 never commits; the advanced head prevents
          // a retry. The other cases retain the committed, unacknowledged S1.
          if(!(action==='recover'&&postCount===1))grants.set(grant.id,grant);
          value=grant;
          if(loseAck){loseAck=false;res.destroy();return;}
        }else throw Error('unexpected_scope_journal_fixture_route');
        const bytes=JSON.stringify(value);
        if(req.method==='GET'&&url.pathname===readBarrier){readBarrier=null;readEntered.resolve();await readRelease.promise;}
        if(req.method==='POST'&&url.pathname===postBarrier){postBarrier=null;postEntered.resolve(value);await postRelease.promise;res.destroy();return;}
        res.writeHead(200,{'X-Web-Planning-Response':'1','Content-Type':'application/json'});res.end(bytes);
      }catch(error){res.destroy(error);}
    }));
    try{
      await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
      const origin='http://127.0.0.1:'+server.address().port,setup=path.join(directory,'task.json');
      await writeFile(setup,JSON.stringify({format:'augnes_web_file_task.v1',origin,workspace_id,project_id,work_id}));
      const scope={recipient:'controlled@example.test',brief:'S1: check the selected material.',next_action:'Return data only; no new authority.',indices:[0],expires:Date.now()+3600000};
      const first=path.join(directory,'first.json'),second=path.join(directory,'second.json');
      await writeFile(first,JSON.stringify(scope));await writeFile(second,JSON.stringify({...scope,brief:'S2: a distinct scoped request.'}));
      function cli(label,args,success=true){
        const promise=(async()=>{
          let stdout='',stderr='';
          const result=await runCanonicalChild({suite:'web-planning',label:'scope-journal-'+action+'-'+label,command:process.execPath,
            cwd:path.resolve('apps/augnes_apps'),args:[entry,setup,...args],timeoutMs:10000,
            env:{...process.env,AUGNES_WEB_ORIGIN:origin,AUGNES_WEB_FIXTURE_COOKIE:'web_planning_local=scope-journal-fixture',AUGNES_WEB_PROJECT_ID:''},
            stdout:{write:chunk=>{stdout+=chunk;}},stderr:{write:chunk=>{stderr+=chunk;}}});
          if(success){assert.equal(canonicalChildAcceptanceFailure(result,{requireNaturalExit:true}),null,stderr);return JSON.parse(stdout);}
          assert.equal(result.exit_code,1,stderr);assert.equal(result.cleanup_completed,true);return stderr;
        })();
        children.push(promise);promise.catch(()=>{});return promise;
      }
      async function pending(){
        const entries=[];
        for(const name of await readdir(setup+'.pending')){
          if(name.endsWith('.tmp'))continue;
          entries.push({name,text:await readFile(path.join(setup+'.pending',name),'utf8')});
        }
        return entries;
      }
      await cli('lost-S1',['scope','2',first],false);
      const original=(await pending())[0];assert(original,'S1 must retain its journal after lost acknowledgement');
      if(action==='recover')head={revision:3,fingerprint:'sha256:'+'3'.repeat(64)};
      let late;
      if(action!=='control'){
        readBarrier=prefix+(action==='recover'?'/exchanges':'/participation');
        late=cli('late-A',[action,...(action==='recover'?[path.join(directory,'recovered-A')]:[])]);
        await readEntered.promise; // A has read S1; hold its exact response.
      }
      const settled=await cli('settle-B',action==='recover'?['recover',path.join(directory,'recovered-B')]:['check']);
      assert.equal(settled.outcome,action==='recover'?'unknown':'saved');assert.deepEqual(await pending(),[]);
      postBarrier=prefix+'/participation/create';
      const sending=cli('lost-S2',['scope','2',second],false);
      const secondGrant=await postEntered.promise;
      const s2=(await pending())[0];assert.equal(JSON.parse(s2.text).body.grant_id,secondGrant.id);
      readRelease.resolve();if(late)await late;
      postRelease.resolve();await sending; // S2's acknowledgement is actually lost.
      const retained=await pending();
      console.log(JSON.stringify({scope_journal_overlap:action,post_count:postCount,S1_settled:true,S2_acknowledgement:'lost',pending_after_late_completion:retained.length}));
      assert.equal(retained.length,1,'stale completion must preserve the distinct S2 journal after its lost acknowledgement');
      assert.equal(retained[0].text,s2.text,'retain the exact S2 operation, including its original key and scope');
      if(action==='recover')for(const name of ['recovered-A','recovered-B'])
        assert.deepEqual(JSON.parse(await readFile(path.join(directory,name,'scope.json'),'utf8')),JSON.parse(original.text));
      const reconciled=await cli('reconcile-S2',['check']);
      assert.equal(reconciled.outcome,'saved');assert.equal(reconciled.grant.id,secondGrant.id);
      assert.equal(postCount,2,'reconciliation must not repeat either external operation');assert.deepEqual(await pending(),[]);
      passed('scope journal '+action+': lost acknowledgement retains exact S2 and fresh check reconciles without a repeat POST');
    }finally{
      readRelease.resolve();postRelease.resolve();await Promise.allSettled(children);await closeTrackedServer(server);
    }
  }
}
