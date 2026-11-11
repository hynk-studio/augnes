// Deterministic UI-state regression, not a substitute for a real browser journey.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { pathToFileURL } from 'node:url';

export async function checkProjectEntryClient(){
  const source=await readFile(new URL('../apps/web_planning/src/projects-client.js.txt',import.meta.url),'utf8');
  const elements=new Map(),calls=[],responses=[],locations=[];
  const element=id=>{if(!elements.has(id))elements.set(id,{value:id==='project-name'?'   ':'test '+id,disabled:false,hidden:false,textContent:'',children:[],replaceChildren(){this.children=[];},append(child){this.children.push(child);}});return elements.get(id);};
  const context=vm.createContext({console,crypto,AbortSignal,Error,JSON,location:{assign:url=>locations.push(url)},
    window:{addEventListener(){}},document:{querySelector:()=>({content:'csrf'}),getElementById:element,createElement:()=>element(crypto.randomUUID())},
    fetch:async(path,options)=>{
      if(options.method==='POST'){calls.push(JSON.parse(options.body));const status=responses.shift();return new Response(JSON.stringify(status===200?{project:{project_id:'11111111-1111-4111-8111-111111111111'}}:{error:status===422?'invalid_relation_text':'storage_unavailable'}),{status,headers:{'X-Web-Planning-Response':'1'}});}
      return new Response(JSON.stringify({projects:[],next:null}),{headers:{'X-Web-Planning-Response':'1'}});
    },
  });
  new vm.Script(source).runInContext(context);
  await vm.runInContext('projects()',context);
  responses.push(422);
  await element('project-create').onsubmit({preventDefault(){}});
  assert.equal(element('project-fields').disabled,false);
  assert.equal(vm.runInContext('pending',context),null);
  assert.match(element('project-status').textContent,/Correct the fields/);
  element('project-name').value='Corrected project';
  responses.push(503);
  await element('project-create').onsubmit({preventDefault(){}});
  assert.equal(element('project-fields').disabled,true);
  const frozen=JSON.stringify(calls.at(-1));
  assert.notEqual(calls[0].request_key,calls[1].request_key);
  // A local field mutation cannot rewrite an uncertain exact request.
  element('project-name').value='Not the pending operation';
  responses.push(200);
  await element('project-create').onsubmit({preventDefault(){}});
  assert.equal(JSON.stringify(calls.at(-1)),frozen);
  assert.equal(vm.runInContext('pending',context),null);
  assert.deepEqual(locations,['/?project=11111111-1111-4111-8111-111111111111']);
  console.log('project entry UI state: validation correctable; unknown creation retains exact operation; acknowledged selection is explicit');
}
if(import.meta.url===pathToFileURL(process.argv[1]).href)await checkProjectEntryClient();
