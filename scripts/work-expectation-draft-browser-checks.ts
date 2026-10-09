import assert from "node:assert/strict";
import { build } from "esbuild";
import { setTimeout as delay } from "node:timers/promises";

// Production component; deterministic conflicts. Authenticated writer behavior
// is separately covered by project-client-runs and expectation owner tests.
export async function checkWorkExpectationDraftRecovery(tab: { eval(expression: string): Promise<any> }) {
  const fixture = `
    import React,{useState} from 'react';import{createRoot}from'react-dom/client';
    import{WorkExpectationPreparation,WorkExpectationResult}from'./components/workbench/semantic-review/work-expectation';
    import{readWorkExpectationDraft,workExpectationScopeKey}from'./components/workbench/semantic-review/work-expectation-draft';
    import{ProjectClientScopeProvider}from'./components/workbench/semantic-review/project-client-scope';
    const s=window.expectationFixture={owner:'operator:A',version:0,drafts:new Map(),posts:[],locked:false,mode:'preparation',receipt:'receipt:A',reportPosts:[],reportSaves:0,reportVersion:0,reportReads:0};
    const session=()=>({workspace_id:'workspace:A',project_id:'project:A',operator_id:s.owner});
    const work=()=>({workspace_id:'workspace:A',project_id:'project:A',project_work_binding:'root:'+s.version,active_selection_revision:null,current_packet:{packet_id:'packet:'+s.version,packet_fingerprint:'fingerprint:'+s.version},current_work:{goal:'Task '+s.version,success_criteria:[s.version===0?'Obsolete unopened requirement':s.version===1?'Inspect the exact source':'Recheck the exact source'],non_goals:[]}});
    window.fetch=async(url,init)=>{
      if(new Headers(init?.headers).get('Augnes-Project-Id')!=='project:A')throw Error('wrong_project_selector');
      if(init?.method!=='POST')return Response.json({eligibility:{current_packet_id:work().current_packet.packet_id,current_packet_fingerprint:work().current_packet.packet_fingerprint,project_work_binding:work().project_work_binding},criteria:[{criterion:work().current_work.success_criteria[0],criterion_id:'criterion:A'}],history:[],authoring_available:true,capacity_available:true});
      const body=JSON.parse(init.body);
      if(body.action==='report_work_expectation_outcome'){
        s.reportPosts.push(body);
        if(s.reportPosts.length===1){s.reportVersion=1;s.version=3;return Response.json({error_code:'expectation_report_changed'},{status:409});}
        if(s.reportPosts.length===2)return new Response('Access unavailable',{status:403});
        return Response.json({ok:true});
      }
      s.posts.push(body);
      if(s.posts.length===1){s.version=2;s.update();return Response.json({error_code:'expectation_packet_changed'},{status:409});}
      if(s.posts.length===2)return Response.json({error_code:'operator_session_revoked'},{status:403});
      return Response.json({record:{record_id:'expectation:saved',revision:1,recorded_at:'2026-10-09',criterion:'Inspect the exact source',predicted_outcome:body.predicted_outcome,reason:body.reason,conditions:body.conditions,author:{operator_id:s.owner},packet_ref:{external_id:body.expected_packet_id,source_ref:body.expected_packet_fingerprint},outcome_rule:'unchanged'}});
    };
    function Harness(){const[revision,update]=useState(0);s.update=()=>update(r=>r+1);s.renderedVersion=s.version;s.authenticate=owner=>{s.owner=owner;s.locked=false;s.update()};
      const initialization=work(),authority=s.locked?null:session(),draft=readWorkExpectationDraft(s.drafts,initialization,authority);
      const refuse=()=>{s.locked=true;s.update()};
      let content=<p data-expectation-locked>Authenticate this project</p>;
      if(authority&&s.mode==='report'){
        const key=JSON.stringify([authority.workspace_id,authority.project_id,authority.operator_id,s.receipt,'expectation-report']);
        let reportDraft=s.drafts.get(key);if(!reportDraft){reportDraft=new Map();s.drafts.set(key,reportDraft)};
        const comparison={comparison:'unknown',eligibility:'eligible',expectation:{project_id:'project:A',record_id:'expectation:A',criterion:'Protected result criterion',predicted_outcome:'satisfied'},actual_outcome:'unknown',basis:'operator_report',run_disposition:'completed',uncertainty:[],packet_href:'/',history:[],reports:s.reportVersion?[{record_id:'report:newer',revision:1,recorded_at:'2026-10-09',author:{operator_id:'operator:A'},outcome:'unknown',observation:'Newer recorded observation',applicability:'not_established'}]:[],report_allowed:true,outcome_source:'operator_report'};
        content=<WorkExpectationResult key={key} comparison={comparison} receiptId={s.receipt} receiptFingerprint={'fingerprint:'+s.receipt} selectionRevision={null} projectWorkBinding={'root:'+s.version} draft={reportDraft} onAccessRefused={refuse} onSaved={async()=>{s.reportReads++;if(s.reportReads===1)return false;s.reportSaves++;s.update();return true}}/>;
      }else if(draft)content=<WorkExpectationPreparation key={workExpectationScopeKey(authority)} initialization={initialization} draft={draft} onAccessRefused={refuse} onRefreshCurrentWork={async()=>{s.update()}}/>;
      return <ProjectClientScopeProvider projectId="project:A">{content}</ProjectClientScopeProvider>;
    }createRoot(document.getElementById('root')).render(<Harness/>);
  `;
  const result = await build({ stdin: { contents: fixture, resolveDir: process.cwd(), loader: "tsx" }, bundle: true, write: false,
    outfile: "/expectation-draft-fixture.js", platform: "browser", define: { "process.env.NODE_ENV": '"production"' } });
  const script = result.outputFiles.find(file => file.path.endsWith(".js"))!.text;
  const evaluate = (body: string) => tab.eval(`document.querySelector('[data-expectation-draft-fixture]').contentWindow.eval(${JSON.stringify(body)})`);
  const until = async (body: string) => { const end = performance.now() + 10000; while (performance.now() < end) {
    if (await evaluate(body)) return; await delay(25);
  } throw new Error(`expectation_draft_browser_wait:${body}`); };
  const click = async (selector: string) => { await until(`!!document.querySelector(${JSON.stringify(selector)})&&!document.querySelector(${JSON.stringify(selector)}).disabled`); await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`); };
  const set = (selector: string, value: string) => evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}))})()`);
  const assertDraft = async () => {
    assert.equal(await evaluate(`document.querySelector('#expectation-reason')?.value`), "A retained forecast reason");
    assert.equal(await evaluate(`document.querySelector('#expectation-conditions')?.value`), "A retained applicability condition");
  };
  const review = async () => { await click('[data-expectation-action="refresh"]'); await click('[data-expectation-action="review"]'); await assertDraft(); };
  try {
    await tab.eval(`(()=>{const f=document.createElement('iframe');f.dataset.expectationDraftFixture='';document.body.append(f);f.contentDocument.body.innerHTML='<div id="root"></div>';f.contentWindow.eval(${JSON.stringify(script)})})()`);
    await until(`!!document.querySelector('[data-work-expectation]')`);
    await evaluate(`expectationFixture.version=1;expectationFixture.update()`); await until(`expectationFixture.renderedVersion===1`);
    assert.equal(await evaluate(`!!document.querySelector('[data-expectation-draft-conflict]')`), false, "A pristine unopened panel has no retained edit to rebase");
    await evaluate(`document.querySelector('[data-work-expectation]').open=true`);
    await until(`!!document.querySelector('#expectation-reason')`);
    assert.equal(await evaluate(`document.querySelector('#expectation-criterion').value`), "Inspect the exact source");
    assert.equal(await evaluate(`!!document.querySelector('[data-expectation-draft-conflict]')`), false);
    await set('#expectation-reason', 'A retained forecast reason'); await set('#expectation-conditions', 'A retained applicability condition');
    await click('[data-expectation-action="save"]'); await until(`!!document.querySelector('[data-expectation-draft-conflict]')`);
    await assertDraft(); assert.equal(await evaluate(`document.querySelector('#expectation-criterion').value`), "Inspect the exact source");
    assert.equal(await evaluate(`document.querySelector('[data-expectation-action="save"]').disabled`), true);
    assert.equal(await evaluate(`expectationFixture.posts.length`), 1);
    await review();
    assert.equal(await evaluate(`document.querySelector('[data-expectation-action="save"]').disabled`), true, "An obsolete criterion needs an explicit current selection");
    await evaluate(`(()=>{const e=document.querySelector('#expectation-criterion');Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(e,'Recheck the exact source');e.dispatchEvent(new Event('change',{bubbles:true}))})()`);
    await click('[data-expectation-action="save"]'); await until(`!!document.querySelector('[data-expectation-locked]')`);
    assert.equal(await evaluate(`document.body.textContent.includes('A retained forecast reason')`), false);
    await evaluate(`expectationFixture.authenticate('operator:B')`); await until(`!!document.querySelector('[data-work-expectation]')`);
    await evaluate(`document.querySelector('[data-work-expectation]').open=true`); await until(`!!document.querySelector('#expectation-reason')`);
    assert.equal(await evaluate(`document.querySelector('#expectation-reason').value`), "");
    await evaluate(`expectationFixture.authenticate('operator:A')`); await until(`!!document.querySelector('[data-expectation-draft-conflict]')`);
    await assertDraft(); await review(); await click('[data-expectation-action="save"]'); await until(`!!document.querySelector('[data-expectation-history="1"]')`);
    const posts = await evaluate(`expectationFixture.posts`);
    assert.equal(posts.length, 3); assert.equal(posts[0].expected_packet_id, "packet:1");
    assert.equal(posts[2].expected_packet_id, "packet:2"); assert.equal(posts[2].expected_project_work_binding, "root:2");
    assert.equal(posts[2].reason, "A retained forecast reason"); assert.equal(posts[2].conditions, "A retained applicability condition");
    await evaluate(`expectationFixture.mode='report';expectationFixture.update()`);
    await until(`!!document.querySelector('[data-expectation-report-editor]')`);
    await evaluate(`document.querySelector('[data-expectation-report-editor]').open=true`);
    await set('#expectation-observation', 'Retained report observation for receipt A');
    await evaluate(`(()=>{const e=document.querySelector('#expectation-outcome');Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(e,'satisfied');e.dispatchEvent(new Event('change',{bubbles:true}))})()`);
    await click('#expectation-applicability');
    await click('[data-expectation-action="report"]'); await until(`!!document.querySelector('[data-expectation-report-conflict]')`);
    assert.equal(await evaluate(`document.querySelector('#expectation-observation').value`), "Retained report observation for receipt A");
    assert.equal(await evaluate(`document.querySelector('[data-expectation-action="report"]').disabled`), true);
    await click('[data-expectation-action="refresh-report"]');
    await until(`document.body.textContent.includes('The result could not be refreshed')`);
    assert.equal(await evaluate(`document.querySelector('[data-expectation-action="report"]').disabled`), true);
    await click('[data-expectation-action="refresh-report"]');
    await until(`!document.querySelector('[data-expectation-report-conflict]')&&document.body.textContent.includes('Newer recorded observation')`);
    assert.equal(await evaluate(`expectationFixture.reportPosts.length`), 1, "Refresh does not submit the report");
    await click('[data-expectation-action="report"]'); await until(`!!document.querySelector('[data-expectation-locked]')`);
    assert.equal(await evaluate(`document.body.textContent.includes('Protected result criterion')||!!document.querySelector('#expectation-observation')`), false);
    await evaluate(`expectationFixture.authenticate('operator:B')`); await until(`!!document.querySelector('#expectation-observation')`);
    assert.equal(await evaluate(`document.querySelector('#expectation-observation').value`), "");
    assert.equal(await evaluate(`document.querySelector('#expectation-outcome').value`), "unknown");
    assert.equal(await evaluate(`document.querySelector('#expectation-applicability').checked`), false);
    await evaluate(`expectationFixture.authenticate('operator:A')`);
    await until(`document.querySelector('#expectation-observation')?.value==='Retained report observation for receipt A'`);
    assert.equal(await evaluate(`document.querySelector('#expectation-outcome').value`), "satisfied");
    assert.equal(await evaluate(`document.querySelector('#expectation-applicability').checked`), true);
    assert.equal(await evaluate(`document.querySelector('[data-expectation-report-editor]').open`), true);
    await evaluate(`expectationFixture.receipt='receipt:B';expectationFixture.update()`);
    await until(`document.querySelector('#expectation-observation')?.value===''`);
    await evaluate(`expectationFixture.receipt='receipt:A';expectationFixture.update()`);
    await until(`document.querySelector('#expectation-observation')?.value==='Retained report observation for receipt A'`);
    await click('[data-expectation-action="report"]'); await until(`expectationFixture.reportSaves===2`);
    const reportPosts = await evaluate(`expectationFixture.reportPosts`);
    assert.equal(reportPosts.length, 3); assert.equal(reportPosts[2].receipt_id, "receipt:A");
    assert.equal(reportPosts[2].observation, "Retained report observation for receipt A");
    assert.equal(reportPosts[2].outcome, "satisfied"); assert.equal(reportPosts[2].applicability, "applied");
    assert.equal(reportPosts[2].expected_previous_id, "report:newer"); assert.equal(reportPosts[2].expected_project_work_binding, "root:3");
    return { pristine_first_open_uses_current_work: true, conflict_retains_text_and_criterion: true, explicit_review_before_rebinding: true,
      revoked_draft_hidden: true, other_operator_isolated: true, matching_authentication_recovers: true,
      report_conflict_requires_confirmed_explicit_refresh: true, report_refusal_hides_material: true, report_original_principal_and_receipt_recovery: true,
      report_retains_observation_outcome_applicability: true, live_report_routes: false };
  } finally { await tab.eval(`document.querySelector('[data-expectation-draft-fixture]')?.remove()`); }
}
