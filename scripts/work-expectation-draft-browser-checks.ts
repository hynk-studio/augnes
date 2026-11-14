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
    import{hasUnsavedWorkPreparation}from'./components/workbench/semantic-review/work-preparation-departure';
    const s=window.expectationFixture={owner:'operator:A',version:0,drafts:new Map(),posts:[],locked:false,mode:'preparation',receipt:'receipt:A',reportPosts:[],reportSaves:0,reportVersion:0,reportReads:0};
    s.hasUnsaved=()=>[...s.drafts.values()].some(hasUnsavedWorkPreparation);
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
    assert.equal(await evaluate(`expectationFixture.hasUnsaved()`), false, "A work revision does not author an unopened forecast");
    await evaluate(`document.querySelector('[data-work-expectation]').open=true`);
    await until(`!!document.querySelector('#expectation-reason')`);
    assert.equal(await evaluate(`document.querySelector('#expectation-criterion').value`), "Inspect the exact source");
    assert.equal(await evaluate(`expectationFixture.hasUnsaved()`), false, "First opening adopts the current requirement without an unsaved warning");
    assert.equal(await evaluate(`!!document.querySelector('[data-expectation-draft-conflict]')`), false);
    await set('#expectation-reason', 'A retained forecast reason'); await set('#expectation-conditions', 'A retained applicability condition');
    assert.equal(await evaluate(`expectationFixture.hasUnsaved()`), true, "Subsequent authored input needs departure protection");
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
      report_retains_observation_outcome_applicability: true, pending: await checkWorkExpectationPendingDraft(tab), live_report_routes: false };
  } finally { await tab.eval(`document.querySelector('[data-expectation-draft-fixture]')?.remove()`); }
}

// Delay the actual component's requests and read-refresh callback independently.
// Every submitted control is exercised alone: changing only a selection must
// retain its associated text just as changing that text does.
export async function checkWorkExpectationPendingDraft(tab: { eval(expression: string): Promise<any> }) {
  const fixture = `
    import React,{useState}from'react';import{createRoot}from'react-dom/client';
    import{WorkExpectationPreparation,WorkExpectationResult}from'./components/workbench/semantic-review/work-expectation';
    import{ProjectClientScopeProvider}from'./components/workbench/semantic-review/project-client-scope';
    import{OperatorSessionPanel}from'./components/workbench/semantic-review/operator-session-panel';
    const work={workspace_id:'workspace:A',project_id:'project:A',project_work_binding:'root:A',active_selection_revision:null,current_packet:{packet_id:'packet:A',packet_fingerprint:'fingerprint:A'},current_work:{goal:'Pending draft safety',success_criteria:['Requirement A','Requirement B'],non_goals:[]}};
    const initial={expectationOpened:true,expectationStarted:true,expectationBoundWork:work,expectationCriterion:'Requirement A',expectationPrediction:'satisfied',expectationReason:'Submitted reason',expectationConditions:'Submitted conditions',reportOpened:true,reportOutcome:'unknown',reportObservation:'Submitted observation',reportApplied:false};
    const s=window.expectationPendingFixture={epoch:0,mode:'preparation',draft:new Map(Object.entries(initial)),posts:[],readCalls:0,refusals:0,refusalCode:null,locked:false,getRefusal:0,assessed:false};
    s.reset=(mode,options={})=>{Object.assign(s,{mode,draft:new Map(Object.entries(initial)),posts:[],post:null,read:null,readCalls:0,refusals:0,refusalCode:null,locked:false,getRefusal:0,assessed:false},options);s.epoch++;s.update()};
    const record=body=>({record_id:'expectation:saved',revision:1,recorded_at:'2026-11-10',criterion:body.criterion_id==='criterion:B'?'Requirement B':'Requirement A',predicted_outcome:body.predicted_outcome,reason:body.reason,conditions:body.conditions,author:{operator_id:'operator:A'},packet_ref:{external_id:body.expected_packet_id,source_ref:body.expected_packet_fingerprint},outcome_rule:'unchanged'});
    window.fetch=async(url,init)=>{
      if(new Headers(init?.headers).get('Augnes-Project-Id')!=='project:A')throw Error('wrong_project_selector');
      if(init?.method!=='POST')return s.getRefusal?new Response('Access unavailable',{status:s.getRefusal}):Response.json({eligibility:{current_packet_id:'packet:A',current_packet_fingerprint:'fingerprint:A',project_work_binding:'root:A'},criteria:[{criterion:'Requirement A',criterion_id:'criterion:A'},{criterion:'Requirement B',criterion_id:'criterion:B'}],history:[],authoring_available:true,capacity_available:true});
      const body=JSON.parse(init.body);s.posts.push(body);
      return new Promise((resolve,reject)=>{s.post={finish:kind=>{
        if(kind==='lost'){reject(Error('response_lost'));return}
        if(kind==='conflict'){resolve(Response.json({error_code:'changed'},{status:409}));return}
        if(kind==='invalid'){resolve(new Response('Invalid JSON',{status:200}));return}
        if(kind===401||kind===403){resolve(new Response('Access unavailable',{status:kind}));return}
        resolve(Response.json(body.action==='record_work_expectation'?{record:record(body)}:{ok:true}));
      }}});
    };
    function Harness(){const[,update]=useState(0);s.update=()=>update(v=>v+1);
      const refuse=code=>{s.refusals++;s.refusalCode=code;s.locked=true;s.update()};
      const comparison={comparison:'unknown',eligibility:'eligible',expectation:{project_id:'project:A',record_id:'expectation:A',criterion:'Requirement A',predicted_outcome:'satisfied'},actual_outcome:s.assessed?'satisfied':'unknown',basis:s.assessed?'criterion_assessment':'operator_report',run_disposition:'completed',uncertainty:[],packet_href:'/',history:[],reports:[],report_allowed:true,outcome_source:s.assessed?'criterion_assessment':'operator_report'};
      return <ProjectClientScopeProvider projectId="project:A"><div data-pending-epoch={s.epoch}>{s.locked?<div data-pending-locked><OperatorSessionPanel state={{status:'locked',session:null,error_code:s.refusalCode}} onAuthenticated={()=>{}} onLocked={refuse}/></div>:s.mode==='preparation'
        ?<WorkExpectationPreparation key={s.epoch} initialization={work} draft={s.draft} onAccessRefused={refuse}/>
        :<WorkExpectationResult key={s.epoch} comparison={comparison} receiptId="receipt:A" receiptFingerprint="receipt-fingerprint:A" selectionRevision={null} projectWorkBinding="root:A" draft={s.draft} onAccessRefused={refuse} onSaved={async()=>{s.readCalls++;return await new Promise((resolve,reject)=>{s.read={finish:value=>value==='lost'?reject(Error('read_lost')):resolve(value)}})}}/>}</div></ProjectClientScopeProvider>;
    }createRoot(document.getElementById('root')).render(<Harness/>);
  `;
  const result = await build({ stdin: { contents: fixture, resolveDir: process.cwd(), loader: "tsx" }, bundle: true, write: false,
    outfile: "/expectation-pending-fixture.js", platform: "browser", define: { "process.env.NODE_ENV": '"production"' } });
  const script = result.outputFiles.find(file => file.path.endsWith(".js"))!.text;
  const evaluate = (body: string) => tab.eval(`document.querySelector('[data-expectation-pending-fixture]').contentWindow.eval(${JSON.stringify(body)})`);
  const until = async (body: string) => { const end = performance.now() + 10000; while (performance.now() < end) {
    if (await evaluate(body)) return; await delay(25);
  } throw new Error(`expectation_pending_browser_wait:${body}`); };
  const preparationFields = [
    ["expectationCriterion", "expectation-criterion", "Requirement A", "Requirement B"],
    ["expectationPrediction", "expectation-prediction", "satisfied", "unsatisfied"],
    ["expectationReason", "expectation-reason", "Submitted reason", "Later unsent reason"],
    ["expectationConditions", "expectation-conditions", "Submitted conditions", "Later unsent conditions"],
  ] as const;
  const reportFields = [
    ["reportOutcome", "expectation-outcome", "unknown", "unsatisfied"],
    ["reportObservation", "expectation-observation", "Submitted observation", "Later unsent observation"],
    ["reportApplied", "expectation-applicability", false, true],
  ] as const;
  type Mode = "preparation" | "report";
  const fields = (mode: Mode) => mode === "preparation" ? preparationFields : reportFields;
  const initialDraft = (mode: Mode): Record<string, string | boolean> => Object.fromEntries(fields(mode).map(([key, , value]) => [key, value]));
  const action = (mode: Mode) => `[data-expectation-action="${mode === "preparation" ? "save" : "report"}"]`;
  const reset = async (mode: Mode, options = {}) => {
    await evaluate(`expectationPendingFixture.reset(${JSON.stringify(mode)},${JSON.stringify(options)})`);
    await until(`document.querySelector('[data-pending-epoch]')?.dataset.pendingEpoch===String(expectationPendingFixture.epoch)&&!!document.querySelector(${JSON.stringify(action(mode))})&&!document.querySelector(${JSON.stringify(action(mode))}).disabled`);
  };
  const edit = async (id: string, value: string | boolean) => {
    await evaluate(`(()=>{const e=document.getElementById(${JSON.stringify(id)});if(e.disabled)throw Error('unexpected_disabled_input');if(e.type==='checkbox'){if(e.checked!==${JSON.stringify(value)})e.click()}else{Object.getOwnPropertyDescriptor(e.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLTextAreaElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}))}})()`);
  };
  const assertDraft = async (mode: Mode, expected: Record<string, string | boolean>) => {
    const keys = JSON.stringify(fields(mode).map(([key, id]) => [key, id]));
    assert.deepEqual(await evaluate(`Object.fromEntries(${keys}.map(([key])=>[key,expectationPendingFixture.draft.get(key)]))`), expected, `${mode}: retained draft`);
    assert.deepEqual(await evaluate(`Object.fromEntries(${keys}.map(([key,id])=>{const e=document.getElementById(id);return[key,e.type==='checkbox'?e.checked:e.value]}))`), expected, `${mode}: rendered controls`);
  };
  const submit = async (mode: Mode) => {
    await evaluate(`document.querySelector(${JSON.stringify(action(mode))}).click()`);
    await until(`expectationPendingFixture.posts.length===1&&!!expectationPendingFixture.post`);
    assert.equal(await evaluate(`document.querySelector(${JSON.stringify(action(mode))}).disabled`), true);
  };
  const assertNoSecondPost = async () => {
    await evaluate(`document.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))`);
    assert.equal(await evaluate(`expectationPendingFixture.posts.length`), 1);
  };
  const finishPost = (kind: string | number = "success") => evaluate(`expectationPendingFixture.post.finish(${JSON.stringify(kind)})`);
  const startRead = async () => { await finishPost(); await until(`!!expectationPendingFixture.read`); };
  const finishRead = async (value: boolean | string = true) => {
    await evaluate(`expectationPendingFixture.read.finish(${JSON.stringify(value)})`);
    await until(`document.querySelector(${JSON.stringify(action("report"))})?.textContent.includes('Saving')===false`);
  };
  let accessRequiredGuidance = "";
  try {
    await tab.eval(`(()=>{const f=document.createElement('iframe');f.dataset.expectationPendingFixture='';document.body.append(f);f.contentDocument.body.innerHTML='<div id="root"></div>';f.contentWindow.eval(${JSON.stringify(script)})})()`);
    await until(`!!expectationPendingFixture.update`);
    for (const [key, id, , later] of preparationFields) {
      await reset("preparation"); await submit("preparation"); await edit(id, later);
      const expected = { ...initialDraft("preparation"), [key]: later };
      await assertDraft("preparation", expected); await assertNoSecondPost(); await finishPost();
      await until(`!!document.querySelector('[data-expectation-history="1"]')`);
      await assertDraft("preparation", expected);
      assert.equal(await evaluate(`document.body.textContent.includes('later edits are retained and have not been saved')`), true);
      assert.deepEqual(await evaluate(`(({criterion_id,predicted_outcome,reason,conditions})=>({criterion_id,predicted_outcome,reason,conditions}))(expectationPendingFixture.posts[0])`),
        { criterion_id: "criterion:A", predicted_outcome: "satisfied", reason: "Submitted reason", conditions: "Submitted conditions" });
    }
    await reset("preparation"); await submit("preparation"); await finishPost();
    await until(`!!document.querySelector('[data-expectation-history="1"]')`);
    await assertDraft("preparation", { ...initialDraft("preparation"), expectationReason: "", expectationConditions: "" });
    for (const failure of ["conflict", "lost", "invalid"]) {
      await reset("preparation"); await submit("preparation"); await edit("expectation-reason", "Later unsent reason"); await finishPost(failure);
      await until(`!!document.querySelector('[data-expectation-draft-conflict]')`);
      await assertDraft("preparation", { ...initialDraft("preparation"), expectationReason: "Later unsent reason" });
      assert.equal(await evaluate(`document.querySelector(${JSON.stringify(action("preparation"))}).disabled`), true);
      await assertNoSecondPost();
    }
    for (const phase of ["post", "read"]) for (const [key, id, , later] of reportFields) {
      await reset("report"); await submit("report");
      if (phase === "read") await startRead();
      await edit(id, later); const expected = { ...initialDraft("report"), [key]: later };
      await assertDraft("report", expected); await assertNoSecondPost();
      if (phase === "post") await startRead();
      await assertDraft("report", expected); await assertNoSecondPost(); await finishRead(); await assertDraft("report", expected);
      assert.equal(await evaluate(`document.body.textContent.includes('later edits are retained and have not been saved')`), true);
      assert.deepEqual(await evaluate(`(({outcome,observation,applicability})=>({outcome,observation,applicability}))(expectationPendingFixture.posts[0])`),
        { outcome: "unknown", observation: "Submitted observation", applicability: "not_established" });
    }
    await reset("report"); await submit("report"); await startRead();
    await assertDraft("report", initialDraft("report")); await assertNoSecondPost(); await finishRead();
    await assertDraft("report", { ...initialDraft("report"), reportObservation: "" });
    for (const failure of ["conflict", "lost", "read-false", "read-lost"]) {
      await reset("report"); await submit("report");
      for (const [, id, , later] of reportFields) await edit(id, later);
      const expected = Object.fromEntries(reportFields.map(([key, , , later]) => [key, later]));
      if (failure.startsWith("read-")) { await startRead(); await finishRead(failure === "read-false" ? false : "lost"); }
      else await finishPost(failure);
      await until(`!!document.querySelector('[data-expectation-report-conflict]')`);
      await assertDraft("report", expected); await assertNoSecondPost();
      const beforeReads = await evaluate(`expectationPendingFixture.readCalls`);
      await evaluate(`document.querySelector('[data-expectation-action="refresh-report"]').click()`);
      await until(`expectationPendingFixture.readCalls===${beforeReads + 1}`);
      await assertDraft("report", expected); await assertNoSecondPost(); await finishRead();
      await until(`!document.querySelector('[data-expectation-report-conflict]')`);
      await assertDraft("report", expected);
    }
    await reset("report", { assessed: true });
    assert.equal(await evaluate(`document.querySelector('#expectation-outcome').disabled`), true);
    await submit("report"); await startRead(); await finishRead();
    assert.equal(await evaluate(`expectationPendingFixture.posts[0].outcome`), "satisfied", "Supported assessment retains outcome authority");
    for (const status of [401, 403]) {
      for (const mode of ["preparation", "report"] as const) {
        await reset(mode); await submit(mode); const [, id, , later] = fields(mode)[1]; await edit(id, later); await finishPost(status);
        await until(`!!document.querySelector('[data-pending-locked]')`);
        assert.equal(await evaluate(`expectationPendingFixture.refusals`), 1);
        assert.equal(await evaluate(`expectationPendingFixture.refusalCode`), "operator_session_required");
        assert.equal(await evaluate(`!!document.querySelector('[data-vnext-operator-session="locked"]')`), true);
        assert.equal(await evaluate(`document.body.textContent.includes('Submitted')||!!document.querySelector('[data-work-expectation],[data-expectation-comparison]')`), false);
        accessRequiredGuidance = await evaluate(`document.querySelector('[data-vnext-operator-session="locked"] [role="alert"]').textContent`);
        assert.equal(await evaluate(`expectationPendingFixture.draft.get(${JSON.stringify(fields(mode)[1][0])})`), later);
      }
      await evaluate(`expectationPendingFixture.reset('preparation',{getRefusal:${status}})`);
      await until(`document.querySelector('[data-pending-epoch]')?.dataset.pendingEpoch===String(expectationPendingFixture.epoch)&&!!document.querySelector('[data-pending-locked]')`);
      assert.equal(await evaluate(`expectationPendingFixture.refusals`), 1);
      assert.equal(await evaluate(`expectationPendingFixture.draft.get('expectationReason')`), "Submitted reason");
      assert.equal(await evaluate(`!!document.querySelector('#expectation-reason')`), false);
    }
    for (const phase of ["post", "read"]) {
      await reset("report"); await submit("report"); if (phase === "read") await startRead();
      await evaluate(`expectationPendingFixture.oldCompletion=expectationPendingFixture.${phase};expectationPendingFixture.locked=true;expectationPendingFixture.update()`);
      await until(`!!document.querySelector('[data-pending-locked]')`);
      await evaluate(`expectationPendingFixture.locked=false;expectationPendingFixture.update()`);
      await until(`!!document.querySelector('#expectation-observation')`);
      await edit("expectation-observation", "Recovered later observation");
      await evaluate(`expectationPendingFixture.oldCompletion.finish(${phase === "read" ? "true" : "'success'"})`);
      await evaluate(`new Promise(resolve=>setTimeout(resolve,0))`);
      await assertDraft("report", { ...initialDraft("report"), reportObservation: "Recovered later observation" });
      assert.equal(await evaluate(`expectationPendingFixture.readCalls`), phase === "read" ? 1 : 0, "An unmounted submission cannot start a new history read");
    }
    return { preparation_each_field_preserves_whole_draft: 4, report_each_field_during_post_and_refresh: 6,
      ordinary_success_clears_submitted_text: true, conflicts_and_uncertainty_retain_draft: true, duplicate_submission_refused: true,
      assessment_outcome_authority_preserved: true, non_json_access_refusal_hides_material: true, access_required_guidance: accessRequiredGuidance,
      late_unmounted_response_preserves_recovered_draft: true };
  } finally { await tab.eval(`document.querySelector('[data-expectation-pending-fixture]')?.remove()`); }
}
