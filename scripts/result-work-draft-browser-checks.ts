import assert from "node:assert/strict";
import { build } from "esbuild";
import { setTimeout as delay } from "node:timers/promises";

// Component regression only: deterministic refusal responses exercise the real
// editor. The surrounding project-client suite separately proves real routes.
export async function checkResultWorkDraftRecovery(tab: { eval(expression: string): Promise<any> }) {
  const fixture = `
    import React,{useState} from 'react';
    import{createRoot}from'react-dom/client';
    import{ResultWorkComposer}from'./components/workbench/result-review/result-work-composer';
    import{ProjectClientScopeProvider}from'./components/workbench/semantic-review/project-client-scope';
    const state=window.resultFixture={owner:'operator:A',authorized:true,failPreview:true,failSave:true,version:1,posts:[],drafts:new Map(),locks:0};
    const session=()=>({authenticated:true,workspace_id:'workspace:A',project_id:'project:A',operator_id:state.owner});
    const entry=(source,text)=>({entry_id:source,source_ref:source,why_included:'New candidate',trust_class:'user_declaration',bounded_summary:text,external_ref:{observed_at:null},compatibility_source_ref:{external_id:source}});
    const previous=entry('prior-source','Prior selected material');
    const preparation=()=>({ok:true,initialization:{workspace_id:'workspace:A',project_id:'project:A',state:'defined',project_work_binding:'root:'+state.version,current_work:{goal:'Saved task '+state.version,success_criteria:['Inspect'],non_goals:[]},current_packet:{packet_id:'packet:A',packet_fingerprint:'packet-fp'},selected_source_context:[previous]},binding:{expected_latest_receipt_id:'receipt:A',expected_project_work_binding:'root:'+state.version},result_source:null});
    window.fetch=async(url,init)=>{
      if(new Headers(init?.headers).get('Augnes-Project-Id')!=='project:A')throw Error('wrong_project_selector');
      if(url.endsWith('/session'))return Response.json(state.authorized?{status:'authenticated',session:session()}:{error_code:'operator_session_expired'},{status:state.authorized?200:401});
      const body=JSON.parse(init.body);state.posts.push(body);
      if(body.action==='read_result_work_preparation'){
        if(state.holdPreparation){state.holdPreparation=false;state.preparationHeld=true;await new Promise(resolve=>{state.releasePreparation=resolve});state.preparationReleased=true;}
        return Response.json(preparation());
      }
      if(body.action==='compare_result_work_sources')return Response.json({status:'selected_source_comparison',comparison:{entries:body.notes.map(n=>entry(n.source,n.text)),fingerprint:'comparison:'+state.version,rows:[],unselected_previous:[previous],retained_source_refs:[]}});
      if(body.action==='preview_result_work'){
        if(state.holdPreview){state.holdPreview=false;state.previewHeld=true;await new Promise(resolve=>{state.releasePreview=resolve});state.previewReturned=true;return Response.json({ok:false,error_code:'operator_session_revoked'},{status:403});}
        if(state.failPreview){state.failPreview=false;return Response.json({ok:false,error_code:'successor_task_preparation_changed'},{status:409});}
        return Response.json({ok:true,before:preparation().initialization.current_work,after:body.definition,sources_before:[previous],sources_after:body.selected_sources.selected_source_context,omitted_sources:body.selected_sources.omitted_sources,request:body});
      }
      if(body.action==='prepare_result_work'){
        if(state.failSave){state.failSave=false;state.authorized=false;return Response.json({ok:false,error_code:'operator_session_revoked'},{status:403});}
        return Response.json({ok:true,status:'inserted',run_created:false,execution_started:false});
      }
      throw Error('unexpected_fixture_action');
    };
    function Harness(){
      const[revision,setRevision]=useState(0),[locked,setLocked]=useState(false);
      state.authenticate=owner=>{state.owner=owner;state.authorized=true;setLocked(false);setRevision(r=>r+1)};
      if(locked)return <p data-fixture-locked>Authenticate this project</p>;
      let draft=state.drafts.get(state.owner);if(!draft){draft=new Map();state.drafts.set(state.owner,draft)}
      return <ProjectClientScopeProvider projectId="project:A"><ResultWorkComposer key={state.owner+':'+revision} receiptId="receipt:A" context={{session:session(),draft,onAccessRefused:()=>{state.locks++;setLocked(true)}}}/></ProjectClientScopeProvider>;
    }
    createRoot(document.getElementById('root')).render(<Harness/>);
  `;
  const result = await build({ stdin: { contents: fixture, resolveDir: process.cwd(), loader: "tsx" }, bundle: true,
    write: false, outfile: "/result-draft-fixture.js", platform: "browser", define: { "process.env.NODE_ENV": '"production"' } });
  const script = result.outputFiles.find(file => file.path.endsWith(".js"))!.text;
  const evaluate = (body: string) => tab.eval(`(()=>{const w=document.querySelector('[data-result-draft-fixture]').contentWindow;return w.eval(${JSON.stringify(body)})})()`);
  const until = async (body: string, label: string) => { const end = performance.now() + 10000; while (performance.now() < end) {
    if (await evaluate(body)) return; await delay(25);
  } throw new Error(`result_draft_browser_wait:${label}`); };
  let stage = "recovery", action = "mount";
  const click = async (selector: string) => {
    action = "click:" + selector;
    await until(`!!document.querySelector(${JSON.stringify(selector)})&&!document.querySelector(${JSON.stringify(selector)}).disabled`, selector);
    await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  };
  const set = async (selector: string, value: string) => {
    action = "set:" + selector;
    await until(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}),ready=!!e&&!e.disabled&&!e.readOnly;if(!ready&&resultFixture.preparationHeld&&!resultFixture.preparationReleased)resultFixture.editorWaitObserved=true;return ready})()`, "editable:" + selector);
    return evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}))})()`); };
  const assertDraft = async () => {
    assert.equal(await evaluate(`document.querySelector('#new-work-goal')?.value`), "Retained result draft A");
    assert.equal(await evaluate(`document.querySelector('#new-work-success-criteria')?.value`), "Preserve original context");
    assert.ok(await evaluate(`document.body.textContent.includes('Selected draft note A')`));
    assert.equal(await evaluate(`document.querySelector('input[maxlength="500"]')?.value`), "Prior note is historical for this next task");
  };
  const recover = async () => {
    await click('[data-result-work-action="refresh"]');
    await click('[data-result-work-action="recompare"]');
    await assertDraft();
    await click('[data-selected-source-action="compare"]');
  };
  try {
    await tab.eval(`(()=>{const frame=document.createElement('iframe');frame.dataset.resultDraftFixture='';document.body.append(frame);frame.contentDocument.body.innerHTML='<div id="root"></div>';frame.contentWindow.eval(${JSON.stringify(script)});})()`);
    await click('[data-result-work-action="open"]');
    await until(`!!document.querySelector('#new-work-goal')`, "editor");
    await set("#new-work-goal", "Retained result draft A");
    await set("#new-work-success-criteria", "Preserve original context");
    await set("#selected-note-source", "source:A");
    await set("#selected-note-text", "Selected draft note A");
    await click('[data-selected-source-action="add"]');
    await set('input[maxlength="500"]', "Prior note is historical for this next task");
    await click('[data-selected-source-action="compare"]');
    await click('button[type="submit"]');
    await until(`!!document.querySelector('[data-result-work-draft-conflict]')`, "conflict");
    await assertDraft();
    await evaluate(`resultFixture.version=2`);
    await recover();
    await click('button[type="submit"]');
    await click('[data-result-work-action="save"]');
    await until(`!!document.querySelector('[data-fixture-locked]')`, "refused_auth_hides_draft");
    assert.equal(await evaluate(`document.body.textContent.includes('Retained result draft A')`), false);
    await evaluate(`resultFixture.authenticate('operator:B')`);
    await click('[data-result-work-action="open"]');
    await until(`!!document.querySelector('#new-work-goal')`, "other_owner_editor");
    assert.equal(await evaluate(`document.querySelector('#new-work-goal').value`), "");
    assert.equal(await evaluate(`document.body.textContent.includes('Selected draft note A')`), false);
    await evaluate(`resultFixture.authenticate('operator:A')`);
    await until(`!!document.querySelector('[data-result-work-draft-conflict]')`, "same_owner_recovers");
    await assertDraft(); await recover();
    await click('button[type="submit"]'); await click('[data-result-work-action="save"]');
    await until(`!!document.querySelector('[data-result-work-saved]')`, "saved_after_recovery");
    const evidence = await evaluate(`({locks:resultFixture.locks,saves:resultFixture.posts.filter(p=>p.action==='prepare_result_work').length,last:resultFixture.posts.at(-1)})`);
    assert.equal(evidence.locks, 1); assert.equal(evidence.saves, 2);
    assert.equal(evidence.last.request.binding.expected_project_work_binding, "root:2");
    assert.equal(evidence.last.request.definition.goal, "Retained result draft A");
    // A disposed editor's delayed refusal must not lock the replacement owner.
    // This is a refusal-only component control, not successful writer evidence.
    stage = "disposed_refusal_reopen";
    await evaluate(`resultFixture.drafts.delete('operator:A');resultFixture.holdPreview=true;resultFixture.holdPreparation=true;resultFixture.editorWaitObserved=false;resultFixture.authenticate('operator:A')`);
    await click('[data-result-work-action="open"]');
    await until('resultFixture.preparationHeld === true', 'reopen_preparation_held');
    // A real pending preparation keeps the editor absent. Observe the driver's
    // readiness wait before releasing it, without sleeping or changing its bound.
    const writing = set('#new-work-goal', 'A preview disposed before refusal');
    await Promise.race([
      writing.then(() => { throw new Error('result_draft_write_finished_before_preparation'); }),
      until('resultFixture.editorWaitObserved === true', 'editor_wait_observed'),
    ]);
    assert.equal(await evaluate(`!!document.querySelector('#new-work-goal')`), false);
    console.log('result_draft_readiness ' + JSON.stringify({ preparation_held: true, editor_present: false, write_waiting: true }));
    await evaluate('resultFixture.releasePreparation()');
    await writing;
    assert.equal(await evaluate('resultFixture.preparationReleased'), true);
    await set('#new-work-success-criteria', 'B stays private and usable');
    await set('input[maxlength="500"]', 'Do not carry the prior note');
    await click('[data-selected-source-action="compare"]');
    await click('button[type="submit"]');
    await until('resultFixture.previewHeld === true', 'old_preview_held');
    await evaluate(`resultFixture.authenticate('operator:B')`);
    await until(`document.querySelector('#new-work-goal')?.value === ''`, 'replacement_owner');
    // B's earlier preparation is retained and intentionally requires fresh
    // bindings on remount. Recover it through the ordinary controls first.
    await click('[data-result-work-action="refresh"]');
    await click('[data-result-work-action="recompare"]');
    await evaluate('resultFixture.releasePreview()');
    await until('resultFixture.previewReturned === true', 'old_refusal_returned');
    await evaluate('new Promise(resolve => setTimeout(resolve, 0))');
    assert.equal(await evaluate('resultFixture.locks'), 1, 'Old refusal cannot lock another editor');
    assert.equal(await evaluate(`!!document.querySelector('[data-fixture-locked]')`), false);
    await set('#new-work-goal', 'B remains editable after A refusal');
    assert.equal(await evaluate(`document.querySelector('#new-work-goal').value`), 'B remains editable after A refusal');
    assert.equal(await evaluate(`resultFixture.drafts.get('operator:B').get('goal')`), 'B remains editable after A refusal');
    assert.equal(await evaluate(`resultFixture.drafts.get('operator:A').get('goal')`), 'A preview disposed before refusal');
    console.log('result_draft_readiness ' + JSON.stringify({ preparation_released: true, held_preview_returned: true, locks: 1, replacement_editor_usable: true, original_draft_retained: true }));
    return { component_fixture_conflict_refresh_recompare: true, component_fixture_auth_hides_and_same_owner_recovers: true,
      component_fixture_other_principal_has_no_draft: true, component_fixture_disposed_refusal_ignored: true, live_result_routes: false };
  } catch (error) {
    // Capture only fixture-owned readiness/action state while its iframe exists.
    // The original exception still escapes; diagnostic failure cannot replace it.
    try {
      const state = await evaluate(`(()=>{const e=document.querySelector('#new-work-goal'),s=resultFixture;return {editor_present:!!e,editor_editable:!!e&&!e.disabled&&!e.readOnly,open_disabled:document.querySelector('[data-result-work-action="open"]')?.disabled??null,preparation_held:s.preparationHeld===true,preparation_released:s.preparationReleased===true,editor_wait_observed:s.editorWaitObserved===true,preview_held:s.previewHeld===true,preview_returned:s.previewReturned===true,locks:s.locks}})()`);
      console.error('result_draft_failure_state ' + JSON.stringify({ stage, action, ...state }));
    } catch { console.error('result_draft_failure_state unavailable'); }
    throw error;
  } finally {
    await tab.eval(`(()=>{const f=document.querySelector('[data-result-draft-fixture]');const s=f?.contentWindow.resultFixture;s?.releasePreparation?.();s?.releasePreview?.();f?.remove()})()`);
  }
}
