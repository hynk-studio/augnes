// Pure, pilot-specific preparation. No browser, store, provider or solver calls.
import assert from 'node:assert/strict';

export const unsandboxedPilotFlag='--allow-unsandboxed-synthetic-pilot';
export function pilotArguments(args) {
  assert(args.length===1||args.length===2,'Supply a new output directory and optional explicit synthetic-pilot sandbox exception.');
  assert(typeof args[0]==='string'&&!args[0].startsWith('--'),'Output directory required.');
  if(args.length===2)assert.equal(args[1],unsandboxedPilotFlag,'Unknown pilot option.');
  return {output:args[0],unsandboxed:args.length===2};
}
export const commissionedInputs=Object.freeze({attempt:'9',verification:'3',repair:'4',direct_success:'2/5',inspection:'1',inspected_success:'2/3'});
export function assertCommissionedInputs(observed) {
  assert.deepEqual(observed.inputs,commissionedInputs,'Observed CLI inputs must equal the commissioning inputs.');
}

export function workspaceReadinessExpression(origin,scope) {
  // Read DOM and guarded type information only. Never call application globals.
  // DOM state comes from the pinned authenticated page/client; values exposed
  // by this predicate are booleans and a closed list-state classification only.
  return `(()=>{
    const get=id=>document.getElementById(id),newWork=get('new-work'),listState=get('list-state');
    const workspace=document.querySelector('meta[name=workspace]'),project=document.querySelector('meta[name=project]');
    const correctDocument=location.href===${JSON.stringify(origin+'/')}&&document.title==='Augnes · Planning workspace'&&
      workspace?.content===${JSON.stringify(scope.workspace_id)}&&project?.content===${JSON.stringify(scope.project_id)}&&!!get('private-view')&&!!get('signout');
    const documentComplete=document.readyState==='complete';
    const clientLoaded=!!(correctDocument&&typeof run==='function'&&typeof list==='function'&&typeof request==='function'&&
      typeof busy==='boolean'&&typeof accessLost==='boolean'&&typeof newWork?.onclick==='function');
    const clientIdle=clientLoaded&&busy===false&&accessLost===false;
    const listClass=!listState?'absent':listState.textContent==='Reading saved work…'?'loading':
      listState.textContent==='No saved work yet.'?'empty':listState.textContent==='Saved on the server'?'saved':'unavailable';
    const listComplete=listClass==='empty'||listClass==='saved';
    const controlsReady=!!(newWork&&!newWork.disabled&&!newWork.hidden&&get('work-list'));
    return {correct_document:!!correctDocument,document_complete:documentComplete,client_loaded:clientLoaded,
      client_idle:!!clientIdle,list_state:listClass,list_complete:listComplete,controls_ready:controlsReady,
      ready:!!(correctDocument&&documentComplete&&clientLoaded&&clientIdle&&listComplete&&controlsReady)};
  })()`;
}
