import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';

export async function browserHistoryJourney({a,debug,origin,page,click,set,settled,saved,wait,navigate,restart,checks}){
 const started=performance.now();await settled(a);await click(a,'new-work');
 await set(a,'criteria','Preserve the original uncertainty and exact context');
 await click(a,'add-note');
 await a.eval(`(()=>{const n=$('notes').children[0];for(const [k,v] of Object.entries({text:'Unknown source validity remains unknown. Further evidence is required before adoption.',source:'Synthetic cumulative observation',label:'Open question',provenance:'user_declaration'}))n.querySelector('[data-field='+k+']').value=v;n.querySelector('[data-field=text]').dispatchEvent(new Event('input',{bubbles:true}));})()`);
 const heads=[];
 // Every revision here is an ordinary editor change and Save click. No raw D1
 // seeding or API writer substitutes for the human/browser-agent-facing flow.
 for(let n=1;n<=33;n++){
   await set(a,'goal','Cumulative browser plan '+n);await click(a,'save');await saved(a,n);await settled(a);
   if(n>=31)heads.push(await a.eval('({revision:saved.revision,fingerprint:saved.fingerprint})'));
 }
 await wait(()=>a.eval("!capacityInFlight&&$('draft-capacity').dataset.state==='fits'"),'current history capacity');
 assert(!await a.eval("$('capacity-details').textContent.includes('/ 32')"));
 const initial=await a.eval("api('/api/work/'+work+'/export')");
 assert.equal(initial.revisions.length,33);
 await click(a,'saved-context');await settled(a);
 assert.equal(await a.eval("document.querySelector('#context-view [data-revision]').dataset.revision"),'33');
 assert.match(await a.eval("$('context-view').innerText"),/Unknown source validity remains unknown/);
 await navigate(a,'about:blank');await restart();
 const fresh=await page(debug,origin);await navigate(fresh,origin+'/');
 await wait(()=>fresh.eval("$('list-state')?.textContent!=='Reading saved work…'&&!!$('new-work')"),'fresh process list');
 async function choose(c,title){
   for(let n=0;n<10;n++){
     if(await c.eval(`[...$('work-list').querySelectorAll('button')].some(b=>b.textContent===${JSON.stringify(title)})`)){
       await c.eval(`[...$('work-list').querySelectorAll('button')].find(b=>b.textContent===${JSON.stringify(title)}).click()`);return;
     }
     assert(!await c.eval("$('more-work').hidden"),'saved work must appear on a complete list page');
     await click(c,'more-work');await settled(c);
   }
   assert.fail('bounded fixture work-list traversal exhausted');
 }
 await choose(fresh,'Cumulative browser plan 33');
 await saved(fresh,33);await click(fresh,'saved-context');await settled(fresh);
 assert.equal(await fresh.eval("document.querySelector('#context-view [data-revision]').dataset.revision"),'33');
 await set(fresh,'goal','Same plan continued after four days');await click(fresh,'save');await saved(fresh,34);await settled(fresh);
 const after=await fresh.eval("api('/api/work/'+work+'/export')");
 assert.deepEqual(after.revisions.slice(0,33),initial.revisions);
 assert(Date.parse(after.revisions[33].recorded_at)-Date.parse(after.revisions[32].recorded_at)>=4*86400000);
 await click(fresh,'saved-context');await settled(fresh);
 assert.equal(await fresh.eval("document.querySelector('#context-view [data-revision]').dataset.revision"),'34');
 assert.match(await fresh.eval("$('context-view').innerText"),/Unknown source validity remains unknown/);
 for(const [width,height] of [[390,844],[768,900],[1200,800]]){
   await fresh.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
   assert(await fresh.eval('document.documentElement.scrollWidth<=innerWidth'));
 }
 console.log(JSON.stringify({cumulative_browser_history:{producer:'ordinary editor and Save control',observed_heads:heads,after_fresh_workerd_and_four_days:34,original_revisions_unchanged:33,agent_surface:'same private server-rendered Saved context',actual_live_agent:false,elapsed_ms:Math.round(performance.now()-started)}}));
 checks.push('history: ordinary editor saves 31/32/33; fresh workerd and fresh tab reopen exact Saved context, four-day clock/fresh seals save 34, original export prefix and unknowns unchanged');
 await navigate(fresh,'about:blank');await navigate(a,origin+'/');
 await wait(()=>a.eval("!!$('new-work')&&$('list-state').textContent!=='Reading saved work…'"),'return to workspace');
 await choose(a,'Same plan continued after four days');await saved(a,34);await settled(a);
}
