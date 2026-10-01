import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileFixtures } from './web-planning-file-fixtures.mjs';
import { digestBytes, validateFileExport } from '../apps/web_planning/src/files.ts';
import { fixtureScope } from './web-planning-local-runtime.mjs';
import { runCanonicalChild, canonicalChildAcceptanceFailure } from './canonical-child-runner.mjs';

export async function browserFileJourney({a,debug,origin,page,click,set,settled,saved,wait,navigate,requestsOnly,root,checks}) {
 const producer=path.join(root,'file-producer'),downloads=path.join(root,'file-consumer');await mkdir(producer);await mkdir(downloads);
 for(const f of fileFixtures)await writeFile(path.join(producer,f.name),f.bytes);
 const select=async(c,files)=>{const {root:dom}=await c.send('DOM.getDocument');const {nodeId}=await c.send('DOM.querySelector',{nodeId:dom.nodeId,selector:'#work-files'});await c.send('DOM.setFileInputFiles',{nodeId,files});await settled(c);};
 await settled(a);await click(a,'new-work');await set(a,'goal','Continue from an exact private file bundle');await set(a,'criteria','Download and check synthetic bytes\nReturn one bounded numerical observation');
 await click(a,'add-note');await a.eval(`(()=>{const row=$('notes').children[0];row.querySelector('[data-field=text]').value='Synthetic integer sequence only. Source and results are required together; no claim of research transfer or real-world usefulness.';row.querySelector('[data-field=source]').value='Synthetic fixture author';row.querySelector('[data-field=text]').dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await select(a,fileFixtures.map(f=>path.join(producer,f.name)));
 await wait(()=>a.eval('selectedFiles.length===4'),'selected browser files');
 for(const [i,f] of fileFixtures.entries())await a.eval(`(()=>{const select=$('file-selection').children[${i}].querySelector('select');select.value=${JSON.stringify(f.role)};select.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 assert.match(await a.eval("$('file-capacity').textContent"),/69,216 \/ 524,288/);assert.match(await a.eval("$('file-selection').innerText"),/not uploaded/);
 await click(a,'save');await saved(a,1);await settled(a);const first=await a.eval('saved');
 // A separate browser tab obtains its state from server reads, without producer variables.
 const consumer=await page(debug,origin);await navigate(consumer,origin+'/');
 await wait(()=>consumer.eval("!![...$('work-list').querySelectorAll('button')].find(b=>b.textContent==='Continue from an exact private file bundle')"),'file consumer list');
 await consumer.eval("[...$('work-list').querySelectorAll('button')].find(b=>b.textContent==='Continue from an exact private file bundle').click()");await saved(consumer,1);await settled(consumer);
 await click(consumer,'saved-context');await settled(consumer);
 assert.match(await consumer.eval("$('context-view').innerText"),/Source and results are required together/);
 assert.equal(await consumer.eval("document.querySelectorAll('#context-view [data-file-url]').length"),4);
 await consumer.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloads});
 for(const [i,f] of fileFixtures.entries()) {
   await consumer.eval(`document.querySelectorAll('#context-view [data-file-url]')[${i}].click()`);await settled(consumer);
   await wait(async()=> (await readdir(downloads)).includes(f.name),'download '+f.name);
   const bytes=await readFile(path.join(downloads,f.name));assert.deepEqual(bytes,f.bytes);assert.equal(digestBytes(bytes),first.files[i].digest);
 }
 let output='';const continuation=await runCanonicalChild({suite:'web-planning-browser',label:'downloaded-file-continuation',command:process.execPath,args:['analysis.mjs','results.json'],cwd:downloads,env:process.env,timeoutMs:10000,stdout:{write(chunk){output+=chunk.toString();}}});
 assert.equal(canonicalChildAcceptanceFailure(continuation,{requireNaturalExit:true}),null);
 const observation=JSON.parse(output);assert.deepEqual({count:observation.count,sum:observation.sum,mean:observation.mean},{count:1000,sum:499500,mean:499.5});
 await writeFile(path.join(downloads,'followup.json'),output);
 await select(consumer,[path.join(downloads,'followup.json')]);await wait(()=>consumer.eval('selectedFiles.length===5'),'return file selection');
 await consumer.eval("(()=>{const row=$('notes').children[0];row.querySelector('[data-field=text]').value+=' Downloaded source/results gave n=1000, sum=499500, mean=499.5. This checks synthetic arithmetic only.';row.querySelector('[data-field=text]').dispatchEvent(new Event('input',{bubbles:true}));})()");
 // Exercise real committed response loss with the file-bearing draft retained.
 await consumer.send('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'},{urlPattern:'*/save',requestStage:'Response'}]});
 await click(consumer,'save');await wait(()=>consumer.eval("!$('uncertain').hidden"),'file save unknown');await settled(consumer);
 const pending=await consumer.eval('JSON.stringify(pending)');assert.match(pending,/followup.json/);
 await requestsOnly(consumer);await click(consumer,'resolve-save');await saved(consumer,2);await settled(consumer);
 const second=await consumer.eval('saved');assert.equal(second.files.length,5);
 // A refused oversized selection is editable and does not remove the retained files.
 await writeFile(path.join(producer,'oversize.bin'),Buffer.alloc(262145));await select(consumer,[path.join(producer,'oversize.bin')]);
 assert.match(await consumer.eval("$('status').textContent"),/262,144/);assert.equal(await consumer.eval('selectedFiles.length'),5);assert.equal(await consumer.eval("$('edit-fields').disabled"),false);
 await navigate(consumer,origin+'/');await wait(()=>consumer.eval("!![...$('work-list').querySelectorAll('button')].find(b=>b.textContent==='Continue from an exact private file bundle')"),'file reopen');
 await consumer.eval("[...$('work-list').querySelectorAll('button')].find(b=>b.textContent==='Continue from an exact private file bundle').click()");await saved(consumer,2);await settled(consumer);
 await click(consumer,'saved-context');await settled(consumer);assert.match(await consumer.eval("$('context-view').innerText"),/sum=499500/);
 await consumer.eval("$('history-tools').open=true");await click(consumer,'export');await settled(consumer);
 await wait(async()=> (await readdir(downloads)).includes('planning-work.json'),'complete file export');
 const bytes=await readFile(path.join(downloads,'planning-work.json')),exported=JSON.parse(bytes);const validated=validateFileExport(fixtureScope,exported);
 assert.equal(validated.chain.length,2);assert.deepEqual(validated.chain[0],first);assert.deepEqual(validated.chain[1],second);assert.equal(validated.bodies.length,5);
 for(const [width,height] of [[390,844],[1200,800]]){await consumer.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});assert(await consumer.eval('document.documentElement.scrollWidth<=innerWidth'));}
 checks.push('files: ordinary multi-file picker and roles; fresh tab Saved context authenticates exact actual downloads; downloaded-only same-Mac successor returns a new artifact; response-loss resolution; editable oversized choice; reopen and complete export retain revision 1');
 console.log(JSON.stringify({browser_file_acceptance:{host:'same Mac; headless Chrome; direct Worker with platform Access simulation',producer_bytes:69216,downloaded:fileFixtures.map((f,i)=>({name:f.name,bytes:f.bytes.length,digest:first.files[i].digest})),continuation:observation,saved_revisions:2,complete_export:{bytes:bytes.length,sha256:digestBytes(bytes),fingerprint:exported.fingerprint},editing_actions:['select four files','set four roles','save baseline','fresh-tab Saved context','download four attachments','execute downloaded synthetic source with downloaded results','select followup.json','add qualified observation','save successor','resolve injected lost acknowledgement','reopen Saved context','download complete export'],refused_file_selections:1,injected_lost_acknowledgements:1,write_retries:0,operator_repairs:0,hosted_or_non_Mac_acceptance:false,general_usefulness_or_time_savings_claim:false}}));
 // Keep the original tab in an ordinary saved state for subsequent access-loss checks.
 await navigate(a,origin+'/');await wait(()=>a.eval("$('work-list').children.length>0"),'producer reloaded');await a.eval("[...$('work-list').querySelectorAll('button')].find(b=>b.textContent==='Continue from an exact private file bundle').click()");await saved(a,2);await settled(a);
}
