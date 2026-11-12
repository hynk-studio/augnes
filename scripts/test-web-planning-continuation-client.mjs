// Deterministic response-loss/privacy regression, not a real-browser observation.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { pathToFileURL } from 'node:url';

export async function checkContinuationClient(){
  const source=await readFile(new URL('../apps/web_planning/src/continuation-client.js.txt',import.meta.url),'utf8');
  const head={revision:1,fingerprint:'sha256:'+'a'.repeat(64),definition:{goal:'Retain the venue conditions',success_criteria:['Confirm arrival']},sources:[],files:[]};
  async function client(manage,storage=new Map()){
    const elements=new Map(),posts=[],responses=[],events=new Map();let denied=false,reloads=0,readValue,readFailure;
    const element=id=>{if(!elements.has(id))elements.set(id,{value:'',disabled:false,hidden:false,textContent:'',children:[],replaceChildren(){this.children=[];},append(...items){this.children.push(...items);}});return elements.get(id);};
    const meta={workspace:'workspace',project:'project','continuation-id':'work-or-grant','continuation-mode':manage?'manage':'continue','csrf-token':'csrf'};
    const context=vm.createContext({console,crypto,AbortSignal,Error,JSON,
      window:{addEventListener:(event,fn)=>events.set(event,fn)},location:{reload(){reloads++;}},
      sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
      document:{querySelector:q=>({content:meta[q.match(/name="([^"]+)"/)[1]]}),getElementById:element,createElement:()=>element(crypto.randomUUID()),querySelectorAll:()=>[...elements.values()]},
      fetch:async(path,options)=>{
        if(denied)return new Response('{"error":"access_denied"}',{status:403,headers:{'X-Web-Planning-Response':'1'}});
        let status=200,value;
        if(options.method==='POST'){posts.push({path,body:JSON.parse(options.body)});({status=200,value}=responses.shift()??{});}
        else value=manage?(path.endsWith('/history')?{revisions:[head]}:{grants:[],next:null}):{saved:head,history:[head],remaining_updates:1,max_updates:2,expires:Date.now()+3600000,obligation:'Keep the unknown noise condition',...readValue};
        if(options.method==='GET'&&readFailure){status=readFailure;readFailure=null;value={error:'storage_unavailable'};}
        return new Response(JSON.stringify(value??{error:'storage_unavailable'}),{status,headers:{'X-Web-Planning-Response':'1'}});
      },
    });
    new vm.Script(source).runInContext(context);
    const settled=async()=>{for(let i=0;i<100&&vm.runInContext('busy',context);i++)await new Promise(setImmediate);assert.equal(vm.runInContext('busy',context),false);};
    await settled();
    return {element,posts,responses,events,storage,settled,read(value){readValue=value;},failRead(status){readFailure=status;},deny(){denied=true;},reloads:()=>reloads};
  }
  const owner=await client(true);
  for(const [id,value] of Object.entries({recipient:'private@example.test',obligation:'Private unfinished obligation',expires:'2030-01-01T12:00','max-updates':'2'}))owner.element(id).value=value;
  owner.responses.push({status:503});owner.element('grant-form').onsubmit({preventDefault(){}});await owner.settled();
  assert.equal(owner.element('grant-fields').disabled,true);
  const key=owner.posts[0].body.grant_id;
  assert.deepEqual([...owner.storage.values()].map(JSON.parse),[{grant_id:key}]);
  const reopened=await client(true,owner.storage);assert.equal(reopened.element('grant-fields').disabled,true);
  reopened.responses.push({value:{outcome:'unknown',grant:null}});await reopened.element('grant-reconcile').onclick();
  assert.equal(reopened.posts[0].path.endsWith('/resolve'),true);assert.equal(reopened.element('grant-fields').disabled,false);
  assert.equal(reopened.posts.some(p=>p.path.endsWith('/create')),false,'checking cannot create a delegation');
  for(const [id,value] of Object.entries({recipient:'private@example.test',obligation:'Corrected obligation',expires:'2030-01-01T12:00','max-updates':'2'}))reopened.element(id).value=value;
  reopened.responses.push({value:{id:key}});reopened.element('grant-form').onsubmit({preventDefault(){}});await reopened.settled();
  assert.equal(reopened.posts.at(-1).body.grant_id,key,'re-preparing cannot allocate a second grant operation');assert.equal(owner.storage.size,0);

  const successor=await client(false);successor.element('report').value='Private report';successor.element('next-action').value='Private next action';
  successor.responses.push({status:503});successor.element('update-form').onsubmit({preventDefault(){}});await successor.settled();
  assert.equal(successor.element('update-submit').disabled,true);
  assert.deepEqual([...successor.storage.values()].map(JSON.parse),[{request_key:successor.posts[0].body.request_key}]);
  const fresh=await client(false,successor.storage);assert.equal(fresh.element('update-submit').disabled,true);
  fresh.responses.push({value:{outcome:'saved',saved:head}});await fresh.element('resolve').onclick();
  assert.equal(fresh.posts.length,1);assert(fresh.posts[0].path.endsWith('/resolve'));assert.equal(fresh.element('update-submit').disabled,false);assert.equal(fresh.storage.size,0);
  fresh.element('report').value='Private draft';fresh.deny();await fresh.element('refresh').onclick();
  assert.equal(fresh.element('work-context').children.length,0);assert.equal(fresh.element('report').value,'');assert.equal(fresh.element('update-submit').disabled,true);
  fresh.events.get('pageshow')({persisted:true});assert.equal(fresh.reloads(),1,'back/forward restoration must reauthorize');
  const regressions=await Promise.allSettled([
    (async()=>{
      const c=await client(false);c.element('report').value='Confirmed report';c.element('next-action').value='Confirmed next step';
      c.responses.push({value:{outcome:'saved',saved:{...head,revision:2}}});c.failRead(503);
      c.element('update-form').onsubmit({preventDefault(){}});await c.settled();
      assert.equal(c.storage.size,0);assert.equal(c.element('report').value,'','a confirmed acknowledgement clears the submitted report before refreshing');
      assert.equal(c.element('next-action').value,'');assert.match(c.element('status').textContent,/update is saved/);
      assert.equal(c.element('update-submit').disabled,true,'a failed post-save refresh cannot prepare a replacement against the old head');
      c.read({saved:{...head,revision:2}});await c.element('refresh').onclick();assert.equal(c.element('update-submit').disabled,false);
      assert.equal(c.posts.length,1,'refresh after acknowledgement does not resubmit');
    })(),
    (async()=>{
      const c=await client(false);c.element('report').value='Original report';c.element('next-action').value='Original next step';
      c.responses.push({status:503});c.element('update-form').onsubmit({preventDefault(){}});await c.settled();
      const original=c.posts[0].body;
      c.responses.push({value:{outcome:'unknown',saved:null}});await c.element('resolve').onclick();
      assert.deepEqual([...c.storage.values()].map(JSON.parse),[{request_key:original.request_key}],'an absent snapshot must retain the original operation key');
      assert.equal(c.posts.length,2,'reconciliation only reads');
      assert.equal(c.element('update-submit').disabled,false,'an explicit preparation remains possible with the same key');
      c.responses.push({status:409,value:{error:'altered_replay'}});c.element('update-form').onsubmit({preventDefault(){}});await c.settled();
      assert.equal(c.posts.at(-1).body.request_key,original.request_key,'a late original commit cannot be duplicated under a new key');
      assert.equal(c.element('update-submit').disabled,true,'a refused replay still needs reconciliation');
    })(),
    (async()=>{
      const c=await client(false);c.element('report').value='Original report';c.element('next-action').value='Original next step';
      c.responses.push({status:503});c.element('update-form').onsubmit({preventDefault(){}});await c.settled();
      const committed={...head,revision:2,request_key:c.posts[0].body.request_key,continuation:{grant_id:'work-or-grant'}};
      c.read({saved:committed,history:[head,committed]});
      c.responses.push({value:{outcome:'unknown',saved:null}});await c.element('resolve').onclick();
      assert.equal(c.storage.size,0);assert.equal(c.posts.length,2);
      assert.match(c.element('status').textContent,/earlier update is saved/,'a commit between resolve and fresh read is recognized');
      assert.equal(c.element('report').value,'');assert.equal(c.element('next-action').value,'','saved text must not remain prepared for duplicate submission');
    })(),
    (async()=>{
      const c=await client(false),historical={...head,definition:{...head.definition,non_goals:['Do not send the notice yet']},
        sources:[{why_included:'Venue limit',bounded_summary:'Unconfirmed limit',compatibility_source_ref:{external_id:'venue-email'},trust:{status:'unverified'},currentness:{status:'unknown'}}],
        relations:{dependencies:[{meaning:'Wait for the venue confirmation'}]},return_use:{judgment:'Do not use the previous draft'},return_reassessment:{decision:'End this method',next_action:'Measure before choosing'}};
      c.read({saved:head,history:[historical,head]});await c.element('refresh').onclick();
      const text=e=>[e.textContent,...e.children.map(text)].join('\n'),shown=text(c.element('work-context'));
      for(const phrase of ['Do not send the notice yet','unverified','unknown','Wait for the venue confirmation','Do not use the previous draft','End this method','Measure before choosing'])assert(shown.includes(phrase),'complete history must disclose '+phrase);
      c.deny();await c.element('refresh').onclick();assert.equal(c.element('work-context').children.length,0,'access loss clears the complete history too');
    })(),
  ]);
  const failures=regressions.filter(r=>r.status==='rejected');if(failures.length)throw new AggregateError(failures.map(r=>r.reason),'continuation recovery/history regressions');
  console.log('continuation UI state: locator-only reload recovery, read-only reconciliation, same grant key after unknown outcome, access-loss clearing and back/forward reauthorization');
}
if(import.meta.url===pathToFileURL(process.argv[1]).href)await checkContinuationClient();
