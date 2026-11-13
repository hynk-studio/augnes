// Deterministic publication recovery/privacy checks, not a real-browser observation.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { pathToFileURL } from 'node:url';

export async function checkPublicationClient(){
  const source=await readFile(new URL('../apps/web_planning/src/publication-client.js.txt',import.meta.url),'utf8');
  const work='66e17e60-a953-4b64-81ac-7c77dfe67b32',project='bb63e047-9125-43c0-88cd-79f6b212b2ad';
  const root='/api/work/'+work+'/public-requests',pointer='augnes-publication-pending:'+project+':'+work;
  const keys=['project','title','purpose','need','reason','evidence','expected_return','checking_use'];
  const head={work_id:work,revision:2,fingerprint:'sha256:'+'a'.repeat(64),definition:{goal:'Private source purpose'}};
  const grant={id:'15ab6826-56a2-41a2-a63a-39e94f17c552',recipient:'private-recipient@example.test',expires:Date.now()+86400000,revoked_at:null,
    disclosure:{request:{work_id:work,revision:2,fingerprint:head.fingerprint},expected:{revision:2,fingerprint:head.fingerprint},brief:'Private source brief'}};
  async function client(storage=new Map(),options={}){
    const elements=new Map(),calls=[],events=new Map(),replies=[];let denied=false,reloads=0;
    function make(tag='DIV'){
      let text='';return {tagName:tag.toUpperCase(),value:'',checked:false,disabled:false,hidden:false,children:[],
        get textContent(){return text;},set textContent(value){text=value;this.children=[];},
        replaceChildren(...items){text='';this.children=items;if(this.tagName==='SELECT')this.value='';},append(...items){this.children.push(...items);}};
    }
    const element=id=>{if(!elements.has(id))elements.set(id,make());return elements.get(id);};
    for(const key of keys)elements.set('summary-'+key,make('TEXTAREA'));
    for(const id of ['expires','confirm-publication'])elements.set(id,make('INPUT'));
    for(const id of ['publication-submit','publication-resolve','refresh','publications-more','grants-more','preview'])elements.set(id,make('BUTTON'));
    elements.set('grant',make('SELECT'));
    const meta={workspace:'155448c4-983f-4e32-83c5-6d340db5d4fd',project,'publication-work':work,'csrf-token':'csrf','public-response-enabled':String(options.responseEnabled!==false)};
    const context=vm.createContext({console,crypto,AbortSignal,Error,JSON,
      window:{addEventListener:(event,fn)=>events.set(event,fn)},location:{reload(){reloads++;}},
      sessionStorage:{getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},
      document:{querySelector:q=>({content:meta[q.match(/name="([^"]+)"/)[1]]}),getElementById:element,createElement:make,
        querySelectorAll:q=>[...elements.values()].filter(e=>q==='button'?e.tagName==='BUTTON':['TEXTAREA','INPUT'].includes(e.tagName))},
      fetch:async(path,request)=>{
        const call={path,method:request.method,...(request.body?{body:JSON.parse(request.body)}:{})};calls.push(call);
        let status=200,value;
        const index=replies.findIndex(r=>r.path===path&&r.method===request.method),reply=index<0?null:replies.splice(index,1)[0];
        if(denied){status=403;value={error:'access_denied'};}
        else if(reply){if(reply.error)throw reply.error;status=reply.status??200;value=reply.value;}
        else if(request.method==='GET'&&path==='/api/work/'+work)value={saved:head};
        else if(request.method==='GET'&&path==='/api/work/'+work+'/participation')value={grants:[grant],next:null};
        else if(request.method==='GET'&&path===root)value={publications:options.publications??[],next:null};
        else{status=503;value={error:'unexpected_request'};}
        return new Response(JSON.stringify(value??{error:'storage_unavailable'}),{status,headers:{'X-Web-Planning-Response':'1'}});
      },
    });
    new vm.Script(source).runInContext(context);
    const settled=async()=>{for(let i=0;i<100&&vm.runInContext('busy',context);i++)await new Promise(setImmediate);assert.equal(vm.runInContext('busy',context),false);};
    await settled();
    function prepare(label='Selected public material'){
      element('grant').value=grant.id;element('grant').onchange();
      for(const key of keys)element('summary-'+key).value=label+' '+key;
      element('expires').value=new Date(Date.now()+3600000).toISOString().slice(0,16);
      element('publication-form').oninput({target:element('summary-need')});element('confirm-publication').checked=true;
    }
    const submit=async()=>{element('publication-form').onsubmit({preventDefault(){}});await settled();};
    const queue=(path,method,value,status=200)=>replies.push({path,method,value,status});
    return {element,calls,events,storage,prepare,submit,queue,settled,deny(){denied=true;},reloads:()=>reloads};
  }
  const groups=[
    ['unknown create and fresh-page read-only recovery',async()=>{
      const c=await client();c.prepare('Private-to-draft selection');c.queue(root+'/create','POST',null,503);await c.submit();
      const original=c.calls.find(c=>c.path===root+'/create').body;
      assert.equal(c.element('publication-fields').disabled,true);assert.equal(c.element('publication-submit').disabled,true);
      assert.deepEqual([...c.storage.values()].map(JSON.parse),[{publication_id:original.publication_id}]);
      assert(!JSON.stringify([...c.storage.values()]).includes('Private-to-draft'),'local persistence keeps no selected text, recipient or source');
      const fresh=await client(c.storage);assert.equal(fresh.element('publication-fields').disabled,true);
      fresh.queue(root+'/resolve','POST',{outcome:'created',publication:{link:'/public-requests/'+original.publication_id}});
      await fresh.element('publication-resolve').onclick();
      const posts=fresh.calls.filter(c=>c.method==='POST');assert.equal(posts.length,1);assert.equal(posts[0].path,root+'/resolve');
      assert.equal(posts[0].body.publication_id,original.publication_id);assert.equal(fresh.storage.size,0);
      assert.equal(fresh.calls.some(c=>c.path.endsWith('/create')),false,'checking an old operation cannot create a new publication');
    }],
    ['unknown outcome keeps the same operation key on explicit retry',async()=>{
      const c=await client();c.prepare();c.queue(root+'/create','POST',null,503);await c.submit();
      const id=c.calls.find(c=>c.path===root+'/create').body.publication_id;
      c.queue(root+'/resolve','POST',{outcome:'unknown',publication:null});await c.element('publication-resolve').onclick();
      assert.equal(c.element('publication-fields').disabled,false);assert.deepEqual([...c.storage.values()].map(JSON.parse),[{publication_id:id}]);
      c.prepare('Re-reviewed selection');c.queue(root+'/create','POST',{error:'altered_replay'},409);await c.submit();
      const creates=c.calls.filter(c=>c.path===root+'/create');assert.equal(creates.length,2);assert.equal(creates[1].body.publication_id,id);
      assert.equal(c.element('publication-fields').disabled,true,'a refused replay returns to reconciliation, not a new key');
    }],
    ['confirmed creation survives a failed list refresh without resubmission',async()=>{
      const c=await client();c.prepare();c.queue(root+'/create','POST',{link:'/public-requests/confirmed'});c.queue(root,'GET',null,503);await c.submit();
      assert.equal(c.storage.size,0);for(const key of keys)assert.equal(c.element('summary-'+key).value,'');
      assert.equal(c.element('expires').value,'');assert.equal(c.element('confirm-publication').checked,false);
      assert.match(c.element('status').textContent,/Publication saved:.*list refresh failed/);
      await c.element('refresh').onclick();assert.equal(c.calls.filter(c=>c.path.endsWith('/create')).length,1);
      let warned=false;c.events.get('beforeunload')({preventDefault(){warned=true;}});assert.equal(warned,false,'confirmed text is no longer dirty');
    }],
    ['authentication loss clears private views; disabled responses retain withdrawal',async()=>{
      const c=await client();c.prepare();c.element('preview').onclick();assert(c.element('public-preview').textContent.includes('Selected public material'));
      c.queue(root+'/create','POST',null,503);await c.submit();const retained=[...c.storage.values()];
      c.deny();await c.element('refresh').onclick();
      for(const id of ['source-context','grant-context','public-preview','publications']){assert.equal(c.element(id).children.length,0);assert.equal(c.element(id).textContent,'');}
      for(const key of keys)assert.equal(c.element('summary-'+key).value,'');assert.equal(c.element('grant').children.length,0);
      assert.equal(c.element('publication-fields').disabled,true);assert.equal(c.element('publication-submit').disabled,true);
      assert.deepEqual([...c.storage.values()],retained,'access loss does not pretend the pending publication was absent');
      c.events.get('pageshow')({persisted:true});assert.equal(c.reloads(),1);
      const prior={id:crypto.randomUUID(),summary:{title:'Already published'},expires:Date.now()+3600000,revoked_at:null,link:'/public-requests/existing'};
      const disabled=await client(new Map(),{responseEnabled:false,publications:[prior]});
      assert.equal(disabled.calls.some(c=>c.path.endsWith('/participation')),false,'disabled response access must not block withdrawal with a denied grant read');
      assert.equal(disabled.element('publication-submit').disabled,true);assert.equal(disabled.element('publications').children.length,1);
      const withdraw=disabled.element('publications').children[0].children.find(e=>e.tagName==='BUTTON');
      assert.equal(withdraw.disabled,false);disabled.queue(root+'/revoke','POST',{...prior,revoked_at:new Date().toISOString()});
      await withdraw.onclick();assert.equal(disabled.calls.filter(c=>c.path.endsWith('/revoke')).length,1);
      assert.equal(disabled.calls.some(c=>c.path.endsWith('/create')),false);
    }],
    ['failed reconciliation or fresh read cannot unlock an uncertain publication',async()=>{
      const c=await client();c.prepare();c.queue(root+'/create','POST',null,503);await c.submit();
      c.queue(root+'/resolve','POST',null,503);await c.element('publication-resolve').onclick();
      assert.equal(c.element('publication-fields').disabled,true,'failed resolver must retain the lock');
      c.queue(root+'/resolve','POST',{outcome:'unknown',publication:null});c.queue('/api/work/'+work,'GET',null,503);
      await c.element('publication-resolve').onclick();assert.equal(c.element('publication-fields').disabled,true,'an absent snapshot does not unlock before the current source is read');
      assert.equal(c.calls.filter(c=>c.path.endsWith('/create')).length,1);
    }],
    ['malformed stored locators fail closed without reads or writes',async()=>{
      for(const raw of ['not-json',JSON.stringify({publication_id:'x'.repeat(36)}),JSON.stringify({publication_id:'------------------------------------'}),JSON.stringify({publication_id:crypto.randomUUID(),extra:true})]){
        const c=await client(new Map([[pointer,raw]]));assert.equal(c.calls.length,0,'malformed locator must not initialize a writable page');
        assert.equal(c.element('publication-fields').disabled,true);assert.equal(c.element('publication-submit').disabled,true);
        assert.match(c.element('status').textContent,/locator is unavailable or invalid/);
      }
    }],
    ['dirty selected text warns on departure and edits invalidate the preview',async()=>{
      const c=await client();let warned=false;const event={preventDefault(){warned=true;}};
      c.events.get('beforeunload')(event);assert.equal(warned,false);c.prepare();c.element('preview').onclick();
      assert(c.element('public-preview').textContent.includes('Selected public material'));
      c.element('publication-form').oninput({target:c.element('summary-reason')});
      assert.equal(c.element('confirm-publication').checked,false);assert.equal(c.element('public-preview').textContent,'');
      c.events.get('beforeunload')(event);assert.equal(warned,true);assert.equal(event.returnValue,'');
      assert.equal(c.storage.size,0,'unsent public draft text is not silently persisted');
    }],
  ];
  const failures=[];for(const [name,check] of groups){try{await check();console.log('publication client: '+name);}catch(error){failures.push(new Error(name,{cause:error}));}}
  if(failures.length)throw new AggregateError(failures,'publication recovery/privacy regressions');
  return {publication_client_checks:groups.length,real_browser:false};
}
if(import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(await checkPublicationClient()));
