import assert from "node:assert/strict";
import { build } from "esbuild";
import { setTimeout as delay } from "node:timers/promises";

// Deterministic component refusals, not live route or model evidence. The parent
// suite separately exercises authenticated routes and project-bound writers.
export async function checkAncillaryWorkDraftRecovery(tab: { eval(expression: string): Promise<any> }) {
  const fixture = `
    import React,{useState} from 'react';import{createRoot}from'react-dom/client';
    import{WorkHandoff}from'./components/blank-state/work-handoff';
    import{StatelessSourceReview}from'./components/blank-state/stateless-source-review';
    const state=window.ancillaryFixture={project:'project:A',actor:'operator:A',failHandoff:false,failReview:false,failReceive:true,version:1,posts:[]};
    const snapshot=state.snapshot={task:{goal:'Historical handoff A',success_criteria:['Keep context'],non_goals:[]},selected_notes:[],evidence:{verification:'not_run',observation:{sources:[{path:'a.ts',start_line:1,end_line:1,text:'Private handoff excerpt A'}]}},source:{project_id:'source:A'},obligations:[],omissions:[]};
    const entry={entry_id:'note:A',source_ref:'source:A',why_included:'Selected candidate A',trust_class:'user_declaration',bounded_summary:'Private review note A',external_ref:{observed_at:null},compatibility_source_ref:{external_id:'review:A'}};
    const preparation={packet_id:'packet:A',review:{question:'Saved source question',files:[{path:'a.ts',start_line:1,end_line:1}]},selected_notes:{notes:[{entry_id:'note:A',label:'Selected candidate A',provenance:'user_declaration',source:'review:A',observed_at:null,text:'Private review note A'}],fingerprint:'notes:A'},predecessor_effects_unknown:false};
    const terminal={binding:{run_id:'run:A',version:1},definition:{goal:'Saved terminal work',success_criteria:['Inspect'],non_goals:[]},sources:[entry],current_direction_source:null,warning:'Stopped attempt',evidence:{public_result:'unavailable',layer:'model_invocation',code:'fixture'},recovery_suspended:false};
    const review={run:{run_id:'run:A',title:'Stopped fixture',status:'failed',stop_reason:null,steps:[]},stage:'finished',next_step:null,failures:[],terminal_preparation:{status:"available",preparation:terminal},observation_checkpoint:null,disposition_preparation:null};
    window.fetch=async(url,init)=>{
      if(new Headers(init?.headers).get('Augnes-Project-Id')!==state.project)throw Error('wrong_project_selector');
      if(url.endsWith('/session'))return Response.json({status:'authenticated',session:{authenticated:true,workspace_id:'workspace:A',project_id:state.project,operator_id:state.actor}});
      const body=init.body?JSON.parse(init.body):null;if(body)state.posts.push(body);
      if(url.includes('/work-handoff?')){
        if(state.failHandoff){state.failHandoff=false;return new Response('Access unavailable',{status:401});}
        if(!body)return Response.json({ok:true,packet:{integrity:{fingerprint:'packet:A'}},handoff:snapshot});
        if(body.action==='preview')return Response.json({ok:true,preview:{request:{handoff:{snapshot:body.handoff},binding:state.version},fingerprint:'preview:'+state.version}});
        if(body.action==='receive'){if(state.failReceive){state.failReceive=false;return Response.json({error:'changed'},{status:409});}return Response.json({ok:true});}
      }
      if(url.includes('/stateless-source-review?')){
        if(state.failReview){state.failReview=false;return new Response('Access unavailable',{status:403});}
        if(!body)return Response.json({ok:true,preparation,reviews:[review]});
        if(body.action==='compare_terminal_sources')return Response.json({preparation:{comparison:{unselected_previous:[entry]},preparation_bytes:1}});
      }
      throw Error('unexpected_ancillary_fixture_action');
    };
    function Harness(){const[project,setProject]=useState(state.project);state.changeProject=value=>{state.project=value;setProject(value)};return <><WorkHandoff projectId={project}/><StatelessSourceReview projectId={project}/></>}
    createRoot(document.getElementById('root')).render(<Harness/>);
  `;
  const bundle = await build({ stdin: { contents: fixture, resolveDir: process.cwd(), loader: "tsx" }, bundle: true,
    write: false, outfile: "/ancillary-draft-fixture.js", platform: "browser", define: { "process.env.NODE_ENV": '"production"' },
    plugins: [{ name: "fixture-navigation", setup(build) {
      build.onResolve({ filter: /^next\/navigation$/ }, () => ({ path: "navigation", namespace: "fixture" }));
      build.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({ contents: "export const useRouter=()=>({refresh(){}});", loader: "js" }));
    } }] });
  const script = bundle.outputFiles.find(file => file.path.endsWith(".js"))!.text;
  const evaluate = (body: string) => tab.eval(`(()=>{const w=document.querySelector('[data-ancillary-draft-fixture]').contentWindow;return w.eval(${JSON.stringify(body)})})()`);
  const until = async (body: string, label: string) => { const end = performance.now() + 10000; while (performance.now() < end) {
    if (await evaluate(body)) return; await delay(25);
  } throw new Error(`ancillary_draft_browser_wait:${label}`); };
  const click = async (selector: string) => {
    await until(`!!document.querySelector(${JSON.stringify(selector)})&&!document.querySelector(${JSON.stringify(selector)}).disabled`, selector);
    await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  };
  const clickText = async (label: string) => {
    const element = `[...document.querySelectorAll('button')].find(b=>b.textContent===${JSON.stringify(label)})`;
    await until(`!!(${element})&&!(${element}).disabled`, label); await evaluate(`(${element}).click()`);
  };
  const set = (selector: string, value: string) => evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}))})()`);
  const restore = async (kind: "handoff" | "review") => {
    const selector = kind === "handoff" ? '[data-work-handoff-action="restore"]' : '[data-stateless-review-action="restore"]';
    const lock = kind === "handoff" ? '[data-work-handoff-locked]' : '[data-stateless-review-locked]';
    await evaluate(`ancillaryFixture.actor='operator:B'`); await click(selector);
    await until(`!!document.querySelector(${JSON.stringify(lock)})&&!document.querySelector(${JSON.stringify(selector)}).disabled&&document.body.textContent.includes('Authenticate the original project and operator')`, "other_operator_refused");
    await evaluate(`ancillaryFixture.actor='operator:A'`); await click(selector);
    await until(`!document.querySelector(${JSON.stringify(lock)})`, "original_operator_restored");
  };
  try {
    await tab.eval(`(()=>{const frame=document.createElement('iframe');frame.dataset.ancillaryDraftFixture='';document.body.append(frame);frame.contentDocument.body.innerHTML='<div id="root"></div>';frame.contentWindow.eval(${JSON.stringify(script)});})()`);
    await clickText("Review saved handoff material");
    await until(`document.body.textContent.includes('Private handoff excerpt A')`, "handoff_loaded");
    await set('[aria-label="Source-review question"]', "Retained source question A");
    await set('[aria-label="Review file 1"]', "a.ts");
    await clickText("Read saved source reviews");
    await until(`!!document.querySelector('[aria-label="New work goal"]')`, "terminal_loaded");
    await set('[aria-label="New work goal"]', "Retained terminal draft A");
    await click('[data-stateless-terminal-authorship] input[type="checkbox"]');
    await clickText("Compare selected context for new work");
    await until(`!!document.querySelector('[aria-label="Omission reason note:A"]')`, "omission_loaded");
    await set('[aria-label="Omission reason note:A"]', "Historical note omitted for the new question");
    await evaluate(`ancillaryFixture.failHandoff=true`); await clickText("Review saved handoff material");
    await until(`!!document.querySelector('[data-work-handoff-locked]')`, "handoff401_hides_material");
    assert.equal(await evaluate(`document.body.textContent.includes('Private handoff excerpt A')`), false);
    await restore("handoff");
    assert.equal(await evaluate(`document.body.textContent.includes('Private handoff excerpt A')`), true);
    await evaluate(`ancillaryFixture.failReview=true`); await clickText("Read saved source reviews");
    await until(`!!document.querySelector('[data-stateless-review-locked]')`, "review403_hides_material");
    assert.equal(await evaluate(`!!document.querySelector('[aria-label="New work goal"]')||document.body.textContent.includes('Private review note A')`), false);
    await restore("review");
    assert.equal(await evaluate(`document.querySelector('[aria-label="Source-review question"]').value`), "Retained source question A");
    assert.equal(await evaluate(`document.querySelector('[aria-label="Review file 1"]').value`), "a.ts");
    assert.equal(await evaluate(`document.querySelector('[aria-label="New work goal"]').value`), "Retained terminal draft A");
    assert.equal(await evaluate(`document.querySelector('[data-stateless-terminal-authorship] input[type="checkbox"]').checked`), false);
    assert.equal(await evaluate(`!!document.querySelector('[aria-label="Omission reason note:A"]')`), false);
    await clickText("Compare selected context for new work");
    await until(`!!document.querySelector('[aria-label="Omission reason note:A"]')`, "recompare_recovered_draft");
    assert.equal(await evaluate(`document.querySelector('[aria-label="Omission reason note:A"]').value`), "Historical note omitted for the new question");
    await evaluate(`(()=>{const transfer=new DataTransfer();transfer.items.add(new File([JSON.stringify(ancillaryFixture.snapshot)],'handoff.json',{type:'application/json'}));const input=document.querySelector('[aria-label="Import a work handoff"]');input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}))})()`);
    await clickText("Author this work in this project");
    await until(`!!document.querySelector('[data-work-handoff-conflict]')`, "handoff409_retains_snapshot");
    assert.equal(await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Author this work in this project').disabled`), true);
    await evaluate(`ancillaryFixture.version=2`); await click('[data-work-handoff-action="refresh"]');
    await clickText("Author this work in this project");
    await until(`document.body.textContent.includes('Work saved with no execution grant')`, "handoff_saved_after_explicit_refresh");
    const saved = await evaluate(`ancillaryFixture.posts.filter(p=>p.action==='receive').at(-1)`);
    assert.equal(saved.request.binding, 2); assert.equal(saved.request.handoff.snapshot.evidence.observation.sources[0].text, "Private handoff excerpt A");
    await evaluate(`ancillaryFixture.changeProject('project:B')`);
    await until(`document.querySelector('[aria-label="Source-review question"]')?.value===''`, "project_change_clears_context");
    assert.equal(await evaluate(`document.body.textContent.includes('Private handoff excerpt A')||document.body.textContent.includes('Private review note A')||!!document.querySelector('[aria-label="New work goal"]')`), false);
    return { component_fixture_refusal_hides_handoff_and_review: true, component_fixture_original_operator_only_recovery: true,
      component_fixture_terminal_draft_retained_recompare_required: true, component_fixture_handoff_conflict_refresh: true,
      component_fixture_project_change_does_not_retarget_draft: true, live_ancillary_routes: false };
  } finally { await tab.eval(`document.querySelector('[data-ancillary-draft-fixture]')?.remove()`); }
}
