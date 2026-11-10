// Focused regression entry; the full Web suite also invokes this same check owner.
import assert from 'node:assert/strict';
import path from 'node:path';
import { startLocal,fixtureScope } from './web-planning-local-runtime.mjs';
import { checkReturnReassessment } from './web-planning-reassessment-checks.mjs';
const root=process.env.AUGNES_CANONICAL_TEMP_ROOT;if(!root)throw Error('owned_test_root_required');
const servers=[];let checks=0;
async function start(name,options={}){const s=await startLocal({root:path.join(root,name),...options});servers.push(s);return s;}
async function client(s){
  const cookie='web_planning_local='+s.env.LOCAL_SESSION,entry=await s.mf.dispatchFetch(s.env.APP_ORIGIN+'/',{headers:{cookie}});assert.equal(entry.status,200);
  const csrf=(await entry.text()).match(/name="csrf-token" content="([^"]+)"/)[1],cookies=cookie+'; '+entry.headers.get('set-cookie').split(';')[0];
  return {cookies,request:async(url,body,extra={})=>{const r=await s.mf.dispatchFetch(s.env.APP_ORIGIN+url,{method:body===undefined?'GET':'POST',headers:{cookie:cookies,...(body===undefined?{}:{origin:s.env.APP_ORIGIN,'content-type':'application/json','x-csrf-token':csrf}),...extra},...(body===undefined?{}:{body:JSON.stringify({workspace_id:fixtureScope.workspace_id,project_id:fixtureScope.project_id,...body})})});
    return {status:r.status,data:(r.headers.get('content-type')??'').includes('application/json')?await r.json():await r.text()};}};
}
async function newWork(c,definition,notes){const r=await c.request('/api/drafts',{});assert.equal(r.status,200);return {id:r.data.work_id,input:{ticket:r.data.ticket,definition,notes}};}
const save=(c,w)=>c.request('/api/work/'+w.id+'/save',w.input);
try{await checkReturnReassessment({start,client,newWork,save,passed:name=>{checks++;console.log(name);}});console.log(JSON.stringify({consumer_reassessment_checks:checks,hosted_adoption:false}));}
finally{for(const s of servers.reverse())await s.close();console.log('consumer_reassessment_owned_runtime_cleanup_complete');}
