import assert from 'node:assert/strict';
import { mkdir, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { canonicalBytes } from '../apps/web_planning/src/capacity.ts';
import { validateExport } from '../apps/web_planning/src/contract.ts';
import { fixtureScope } from './web-planning-local-runtime.mjs';
import { capacityDefinition, capacityNotes, subsequentObservation, revisedCapacityNote, essentialNotes } from './web-planning-capacity-fixture.mjs';

export async function browserCapacityJourney({a,click,set,settled,saved,wait,navigate,origin,downloads,requests,responses,checks}) {
 const notes=capacityNotes(fixtureScope);
 const capacity=state=>wait(()=>a.eval(`$('draft-capacity').dataset.state===${JSON.stringify(state)}`),'capacity '+state);
 async function fill(index,note){await a.eval(`(()=>{const row=$('notes').children[${index}];for(const [key,value] of Object.entries(${JSON.stringify(note)}))row.querySelector('[data-field='+key+']').value=value??'';row.querySelector('[data-field=text]').dispatchEvent(new Event('input',{bubbles:true}));})()`);}
 await settled(a);await click(a,'new-work');await set(a,'goal',capacityDefinition.goal);await set(a,'criteria',capacityDefinition.success_criteria.join('\n'));await set(a,'non-goals',capacityDefinition.non_goals.join('\n'));
 for(const [i,note] of notes.entries()){await click(a,'add-note');await fill(i,note);}
 await a.eval(`(()=>{const deps=$('notes').children[3].querySelector('.dependencies');for(const option of deps.options)option.selected=true;deps.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 await capacity('fits');assert.match(await a.eval("$('capacity-status').textContent"),/11,947 \/ 12,000 bytes · 53 remaining/);
 const untouched=await a.eval('JSON.stringify(draft())'),beforeInspection=requests.length;
 await click(a,'check-capacity');await capacity('fits');assert.equal(await a.eval('JSON.stringify(draft())'),untouched);
 assert(requests.slice(beforeInspection).every(r=>r.path.endsWith('/capacity')),'inspection never requests a ticket or write');
 a.capacityFailure='invalid';await click(a,'check-capacity');await capacity('unavailable');assert(!await a.eval("$('capacity-status').textContent.includes('Fits storage')"));
 a.capacityFailure=503;await click(a,'check-capacity');await capacity('unavailable');assert.equal(await a.eval('JSON.stringify(draft())'),untouched);
 // Delay one valid old check while a newer invalid draft is inspected.
 a.holdCapacity=true;await click(a,'check-capacity');await wait(()=>!!a.heldCapacity,'held capacity request');
 await fill(0,{text:'😀'.repeat(2001)});assert.equal(await a.eval("$('draft-capacity').dataset.state"),'unchecked');
 await a.eval("globalThis.capacityStates=[];globalThis.capacityObserver=new MutationObserver(()=>capacityStates.push($('draft-capacity').dataset.state));capacityObserver.observe($('draft-capacity'),{attributes:true,attributeFilter:['data-state']});");
 const responsesBefore=responses.filter(r=>r.path.endsWith('/capacity')).length;
 await a.send('Fetch.continueRequest',{requestId:a.heldCapacity.requestId});a.heldCapacity=null;
 await wait(()=>responses.filter(r=>r.path.endsWith('/capacity')).length>responsesBefore,'old capacity response');
 await capacity('blocked');assert.equal(await a.eval("capacityObserver.disconnect();capacityStates.includes('fits')"),false);
 assert.match(await a.eval("document.querySelector('.note-capacity').textContent"),/2001 \/ 2000/);
 await fill(0,notes[0]);await capacity('fits');await click(a,'save');await saved(a,1);await settled(a);
 const first=await a.eval('saved'),id=first.work_id;
 const before=await a.eval("api('/api/work/'+work+'/export')");
 await click(a,'add-note');await fill(4,{...notes[0],text:subsequentObservation});await capacity('blocked');
 assert.equal(await a.eval("$('edit-fields').disabled"),false);assert.match(await a.eval("$('capacity-details').textContent"),/Selected context exceeds/);
 assert(await a.eval("$('notes').children[4].querySelector('.note-capacity').textContent.includes('attribution and packaging')"));
 // Recovery uses the ordinary selection editor, before a failed save attempt.
 await a.eval("$('notes').children[4].querySelector('button').click()");
 const index=first.sources.findIndex(n=>n.compatibility_source_ref.external_id===notes[3].source);
 await fill(index,{text:revisedCapacityNote()});await capacity('fits');
 const measurement=await a.eval("$('capacity-status').textContent");
 assert.match(await a.eval("$('change-list').textContent"),/derived interpretations/);
 assert.equal(await a.eval(`$('notes').children[${index}].querySelectorAll('.dependencies option:checked').length`),3);
 // Required-context changes invalidate and refresh the current draft as well.
 await a.eval(`(()=>{const select=$('notes').children[${index}].querySelector('.dependencies');select.options[0].selected=false;select.dispatchEvent(new Event('change',{bubbles:true}));})()`);await capacity('fits');
 await a.eval(`(()=>{const select=$('notes').children[${index}].querySelector('.dependencies');for(const option of select.options)option.selected=true;select.dispatchEvent(new Event('change',{bubbles:true}));})()`);await capacity('fits');
 assert(await a.eval(`$('notes').children[${index}].querySelector('.dependencies').textContent.includes(${JSON.stringify(essentialNotes[0].slice(0,60))})`));
 const saveStart=requests.length;await click(a,'save');await saved(a,2);await settled(a);
 assert.equal(requests.slice(saveStart).filter(r=>r.path.endsWith('/save')).length,1);
 await navigate(a,origin+'/');await wait(()=>a.eval("$('work-list').children.length>0"),'capacity reopen list');
 await a.eval(`[...$('work-list').querySelectorAll('button')].find(b=>b.textContent===${JSON.stringify(capacityDefinition.goal)}).click()`);await saved(a,2);await capacity('fits');
 await click(a,'saved-context');await settled(a);assert.match(await a.eval("$('context-view').innerText"),/mean waits are 2.5/);
 await mkdir(downloads,{recursive:true});await a.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloads});await a.eval("$('history-tools').open=true");await click(a,'export');
 await wait(async()=> (await readdir(downloads)).some(p=>p.endsWith('.json')),'capacity export download');
 const exported=JSON.parse(await readFile(path.join(downloads,(await readdir(downloads)).find(p=>p.endsWith('.json'))),'utf8'));
 assert.equal(exported.revisions[0].work_id,id);assert.deepEqual(validateExport(fixtureScope,exported),exported.revisions);assert.equal(exported.revisions.length,2);assert.deepEqual(exported.revisions[0],before.revisions[0]);
 const head=exported.revisions[1],adapted=head.relations.materials.find(m=>m.kind==='adapted');assert.equal(adapted.from.fingerprint,first.fingerprint);assert.equal(adapted.dependencies.length,3);
 for(const [i,text] of essentialNotes.entries()){const note=head.sources.find(n=>n.compatibility_source_ref.external_id===notes[i].source);assert(note.bounded_summary.includes(text));}
 assert.match(measurement,new RegExp(canonicalBytes(head.sources).toLocaleString('en-US')));
 for(const [width,height] of [[390,844],[1200,800]]){await a.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});assert(await a.eval('document.documentElement.scrollWidth<=innerWidth'));}
 checks.push('capacity: pure/current accessible feedback, malformed/failed/late checks withheld; synthetic 11,947-byte selection updated through ordinary editing, save, reopen and validated complete download with original and three dependencies intact');
 console.log(JSON.stringify({browser_capacity_acceptance:{initial_bytes:11_947,final_bytes:canonicalBytes(head.sources),over_budget_drafts:1,unsuccessful_save_attempts:0,recovery_actions:['remove new result note','revise existing result note'],required_context:'three links retained; explicit deselect/reselect reflected',inspection_faults:['invalid response','503','delayed old valid response'],general_usability_or_time_savings_claim:false}}));
}
