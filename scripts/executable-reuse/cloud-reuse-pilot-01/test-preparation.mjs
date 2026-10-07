import assert from 'node:assert/strict';
import { Script } from 'node:vm';
import { workspaceReadinessExpression, pilotArguments, unsandboxedPilotFlag, commissionedInputs, assertCommissionedInputs } from './preparation.mjs';

const scope={workspace_id:'synthetic-workspace',project_id:'synthetic-project'},origin='http://127.0.0.1:12345';
const expression=workspaceReadinessExpression(origin,scope),controls=[];
function context(options={}) {
  const nodes={'new-work':{onclick(){},disabled:false,hidden:false},'list-state':{textContent:'No saved work yet.'},'private-view':{},signout:{},'work-list':{}};
  if(options.absent)for(const id of Object.keys(nodes))delete nodes[id];
  if(options.listAbsent)delete nodes['list-state'];
  if(options.listText&&nodes['list-state'])nodes['list-state'].textContent=options.listText;
  if(options.noHandler&&nodes['new-work'])nodes['new-work'].onclick=null;
  if(options.disabled&&nodes['new-work'])nodes['new-work'].disabled=true;
  const c={document:{title:options.wrongTitle?'Local synthetic workspace':'Augnes · Planning workspace',readyState:options.loading?'loading':'complete',
    getElementById(id){if(options.unexpected)throw new TypeError('synthetic predicate failure');return nodes[id]??null;},
    querySelector(selector){if(options.absent)return null;return {content:selector.includes('workspace')?(options.wrongScope?'other-workspace':scope.workspace_id):scope.project_id};}},
    location:{href:options.wrongUrl?origin+'/_local/login':origin+'/'}};
  if(!options.noClient)Object.assign(c,{run(){},list(){},request(){},busy:options.busy??false,accessLost:options.accessLost??false});
  return c;
}
for(const [name,options,expected] of [
  ['absent DOM',{absent:true,noClient:true},false],['loading document',{loading:true},false],
  ['wrong URL',{wrongUrl:true},false],['wrong title',{wrongTitle:true},false],['wrong scope',{wrongScope:true},false],
  ['client absent',{noClient:true},false],['handler absent',{noHandler:true},false],['list absent',{listAbsent:true},false],
  ['list loading',{listText:'Reading saved work…'},false],['list unavailable',{listText:'Work list could not be refreshed.'},false],
  ['client busy',{busy:true},false],['access lost',{accessLost:true},false],['control disabled',{disabled:true},false],
  ['ready empty',{},true],['ready saved',{listText:'Saved on the server'},true]
]){const observed=new Script(expression).runInNewContext(context(options));assert.equal(observed.ready,expected,name);controls.push({name,expected_ready:expected,observed_ready:observed.ready,pass:true});}
assert.throws(()=>new Script(expression).runInNewContext(context({unexpected:true})),/synthetic predicate failure/);
assert.equal(pilotArguments(['fresh-output']).unsandboxed,false);
assert.equal(pilotArguments(['fresh-output',unsandboxedPilotFlag]).unsandboxed,true);
assert.throws(()=>pilotArguments(['fresh-output','--no-sandbox']));
assert.throws(()=>pilotArguments(['fresh-output',unsandboxedPilotFlag,'extra']));
assertCommissionedInputs({inputs:{...commissionedInputs}});
assert.throws(()=>assertCommissionedInputs({inputs:{...commissionedInputs,verification:'0'}}));
assert.throws(()=>assertCommissionedInputs({inputs:{...commissionedInputs,unexpected:'1'}}));
console.log(JSON.stringify({kind:'pure preparation controls; no browser or solver execution',readiness_controls:controls,
  unexpected_exception_propagates:true,sandbox_default:false,explicit_pilot_opt_in:true,unknown_options_refused:true,
  commissioned_input_equality:true,changed_and_extra_inputs_refused:true,phase_b:'NOT RUN'},null,2));
