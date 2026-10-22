import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { digestBytes, validateFileExport } from '../apps/web_planning/src/files.ts';
import { fixtureScope } from './web-planning-local-runtime.mjs';

export async function browserOrdinaryFileJourney({a,debug,origin,page,click,set,settled,saved,wait,navigate,replaceRuntime,barrier,requestsOnly,countRows,root,checks,requests}) {
 const folder=path.join(root,'ordinary-file-journey');await mkdir(folder);
 const requirements='Keep metric units and uncertainty. Synthetic example only.\n';
 const baseline='result=12 ms\nqualification=baseline synthetic result\n';
 const alternative='result=9 ms\nqualification=alternative synthetic result; not a measured product benefit\n';
 const files=[{name:'requirements.txt',text:requirements,role:'source'},{name:'results.txt',text:baseline,role:'results'},{name:'baseline-copy.txt',text:baseline,role:'report'}];
 for(const f of files)await writeFile(path.join(folder,f.name),f.text);
 const ready=async c=>{await navigate(c,origin+'/');await wait(()=>c.eval("!!$('new-work')&&$('list-state').textContent!=='Reading saved work…'"),'ordinary entry');};
 const choose=async(c,goal)=>{await c.eval(`[...$('work-list').querySelectorAll('button')].find(b=>b.textContent===${JSON.stringify(goal)}).click()`);await settled(c);};
 const picker=async(c,selector,files)=>{const {root:dom}=await c.send('DOM.getDocument');const {nodeId}=await c.send('DOM.querySelector',{nodeId:dom.nodeId,selector});await c.send('DOM.setFileInputFiles',{nodeId,files});await settled(c);};
 const add=async(c,text)=>{await click(c,'add-note');await c.eval(`(()=>{const r=$('notes').lastElementChild;r.querySelector('[data-field=text]').value=${JSON.stringify(text)};r.querySelector('[data-field=source]').value='Synthetic author';r.querySelector('[data-field=text]').dispatchEvent(new Event('input',{bubbles:true}));})()`);};
 const fileChoice=async(c,side,name,selected)=>{await c.eval(`(()=>{const e=[...$('file-choices').querySelectorAll('input')].find(e=>e.dataset.side===${JSON.stringify(side)}&&JSON.parse(e.dataset.file).name===${JSON.stringify(name)});if(e.checked!==${selected})e.click();})()`);};
 const downloadDir=async(c,name)=>{const dir=path.join(folder,name);await mkdir(dir);await c.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:dir});return dir;};
 const downloaded=async(dir,name)=>{await wait(async()=>(await readdir(dir)).includes(name),'ordinary download '+name);return readFile(path.join(dir,name));};
 await ready(a);await click(a,'new-work');await set(a,'goal','Ordinary requirements and results');await set(a,'criteria','Preserve exact requirements and earlier results');
 await add(a,'The requirements remain necessary. These numerical values are synthetic, not a benchmark.');
 await picker(a,'#work-files',files.map(f=>path.join(folder,f.name)));await wait(()=>a.eval('selectedFiles.length===3'),'ordinary files selected');
 for(const [i,f] of files.entries())await a.eval(`(()=>{const e=$('file-selection').children[${i}].querySelector('select');e.value=${JSON.stringify(f.role)};e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 await click(a,'save');await saved(a,1);await settled(a);const original=await a.eval('saved');
 assert.deepEqual(original.definition.non_goals,[]);assert.equal(original.files[1].digest,original.files[2].digest);
 await click(a,'branch-open');await set(a,'branch-reason','Try a result alternative while retaining the complete requirements');await click(a,'branch-preview');await settled(a);
 assert.match(await a.eval("$('relation-preview').innerText"),/requirements.txt/);await click(a,'relation-save');await saved(a,1);await settled(a);
 const branchInitial=await a.eval('saved');assert.deepEqual(branchInitial.files,original.files);assert.equal(branchInitial.relations.file_materials[0].from.fingerprint,original.fingerprint);
 await set(a,'goal','Alternative ordinary results');await set(a,'authored-file','results.txt');await click(a,'open-authored');await settled(a);assert.equal(await a.eval('authored.name'),'results.txt');assert.equal(await a.eval("$('authored-text').value"),baseline);await set(a,'authored-text',alternative);
 await add(a,'Use the alternative result only with its requirements and synthetic qualification.');await click(a,'save');await saved(a,2);await settled(a);const branch=await a.eval('saved');
 assert.equal(branch.files.find(f=>f.name==='results.txt').digest,digestBytes(Buffer.from(alternative)));assert.deepEqual(branch.files.find(f=>f.name==='requirements.txt'),original.files.find(f=>f.name==='requirements.txt'));
 await choose(a,original.definition.goal);await click(a,'choose-branch');await settled(a);await a.eval("$('branch-choices').querySelector('button').click()");await settled(a);
 assert.equal(await a.eval("[...$('file-choices').querySelectorAll('input[data-side=target]')].every(e=>e.checked)"),true);
 assert.equal(await a.eval("[...$('target-choices').querySelectorAll('input')].every(e=>e.checked)"),true);
 await fileChoice(a,'source','results.txt',true);await set(a,'comparison-rationale','Replace the result deliberately, retaining requirements and the earlier body.');await click(a,'incorporation-preview');await settled(a);
 assert.match(await a.eval("$('status').textContent"),/same name/);assert.equal(await a.eval("$('relation-save').hidden"),true);assert.equal((await countRows()).revisions,3);
 await fileChoice(a,'target','results.txt',false);
 await a.eval("(()=>{const r=[...$('material-choices').children].find(r=>r.querySelector('.note-text').textContent.startsWith('Use the alternative'));r.querySelector('select').value='incorporated';r.querySelector('select').dispatchEvent(new Event('input',{bubbles:true}));})()");
 await click(a,'incorporation-preview');await settled(a);assert.equal(await a.eval("$('relation-save').hidden"),false);
 const previewText=await a.eval("$('relation-preview').innerText");for(const text of ['requirements.txt','results.txt','baseline-copy.txt','No longer selected','Added to this selection','Use the alternative'])assert(previewText.includes(text));
 // An edit-then-revert still invalidates the exact reviewed choices.
 await fileChoice(a,'target','baseline-copy.txt',false);assert.equal(await a.eval('relationPending'),null);await fileChoice(a,'target','baseline-copy.txt',true);await click(a,'incorporation-preview');await settled(a);
 await a.eval("$('relation-preview').scrollIntoView()");const shot=await a.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
 const before=requests.filter(r=>r.path.endsWith('/relation-save')).length;
 const sent=await barrier(a,'/relation-save');await click(a,'relation-save');await sent.wait();
 assert.equal(await a.eval('relationUnknown'),true);assert.equal(await a.eval("[...$('file-choices').querySelectorAll('input')].every(e=>e.disabled)"),true);
 await sent.release('disconnect');const exact=await a.eval('relationPending');assert.equal(await a.eval("$('relation-uncertain').hidden"),false);
 await requestsOnly(a);await click(a,'relation-resolve');await saved(a,2);await settled(a);const result=await a.eval('saved');
 assert.equal(requests.filter(r=>r.path.endsWith('/relation-save')).length,before+1,'one incorporation Save, then read-only outcome resolution');
 assert.equal(result.files.length,3);assert.equal(result.files.find(f=>f.name==='results.txt').digest,digestBytes(Buffer.from(alternative)));
 assert.equal(result.sources.length,2);assert.equal(result.relations.file_materials.find(m=>m.file.name==='results.txt').from.fingerprint,branch.fingerprint);
 // Dispose the old runtime and all old documents before fresh consumer reads.
 await replaceRuntime(false);const fresh=await page(debug,origin);await ready(fresh);await choose(fresh,original.definition.goal);await saved(fresh,2);await settled(fresh);
 assert.deepEqual(await fresh.eval('saved'),result);await click(fresh,'saved-context');await settled(fresh);assert.match(await fresh.eval("$('context-view').innerText"),/File copy attribution/);
 const downloads=await downloadDir(fresh,'result-downloads'),artifacts=[];
 for(const f of result.files){await fresh.eval(`[...$('context-view').querySelectorAll('[data-file-url]')].find(e=>e.dataset.fileName===${JSON.stringify(f.name)}).click()`);await settled(fresh);
   const bytes=await downloaded(downloads,f.name);assert.equal(digestBytes(bytes),f.digest);assert.equal(bytes.length,f.bytes);assert.equal(bytes.toString(),f.name==='requirements.txt'?requirements:f.name==='results.txt'?alternative:baseline);artifacts.push({name:'download-'+f.name,bytes:bytes.length,sha256:digestBytes(bytes),data:bytes.toString('base64')});}
 await fresh.eval("$('history-tools').open=true");await click(fresh,'history');await settled(fresh);assert.match(await fresh.eval("$('history-view').textContent"),/revision|Revision/);
 await click(fresh,'export');await settled(fresh);await click(fresh,'reading-export');await settled(fresh);
 const complete=await downloaded(downloads,'planning-work.json'),reading=await downloaded(downloads,'authored-work.html'),exported=JSON.parse(complete);validateFileExport(fixtureScope,exported);
 assert.deepEqual(exported.revisions,[original,result]);assert(exported.files.some(f=>f.digest===original.files[1].digest));assert(reading.toString().includes(baseline));assert(reading.toString().includes(alternative));
 for(const [name,bytes] of [['original-complete.json',complete],['original-readable.html',reading]])artifacts.push({name,bytes:bytes.length,sha256:digestBytes(bytes),data:bytes.toString('base64')});
 await choose(fresh,branch.definition.goal);assert.deepEqual(await fresh.eval('saved'),branch);const branchDownloads=await downloadDir(fresh,'branch-downloads');await fresh.eval("$('history-tools').open=true");await click(fresh,'export');await settled(fresh);await click(fresh,'reading-export');await settled(fresh);
 const branchBytes=await downloaded(branchDownloads,'planning-work.json'),branchReading=await downloaded(branchDownloads,'authored-work.html');assert.deepEqual(JSON.parse(branchBytes).revisions,[branchInitial,branch]);
 for(const [name,bytes] of [['alternate-complete.json',branchBytes],['alternate-readable.html',branchReading]])artifacts.push({name,bytes:bytes.length,sha256:digestBytes(bytes),data:bytes.toString('base64')});
 // Actual zero-note ordinary file branch uses the same visible creation path.
 await click(fresh,'new-work');await set(fresh,'goal','Files with no notes');await set(fresh,'criteria','Keep a whole file without inventing a note');await picker(fresh,'#work-files',[path.join(folder,'requirements.txt')]);await wait(()=>fresh.eval('selectedFiles.length===1'),'zero-note file');await click(fresh,'save');await saved(fresh,1);await settled(fresh);
 await click(fresh,'branch-open');await set(fresh,'branch-reason','Independent file-only alternative');await click(fresh,'branch-preview');await settled(fresh);await click(fresh,'relation-save');await settled(fresh);assert.equal(await fresh.eval('saved.sources.length'),0);assert.equal(await fresh.eval('saved.files.length'),1);
 // Each work is a complete independent recovery input, without origin snapshots.
 for(const [file,expected] of [[path.join(downloads,'planning-work.json'),exported],[path.join(branchDownloads,'planning-work.json'),JSON.parse(branchBytes)]]){
   await replaceRuntime(true);const replacement=await page(debug,origin);await ready(replacement);assert.deepEqual(await countRows(),{revisions:0,files:0});await replacement.eval("$('reconstruction').open=true");await picker(replacement,'#import-file',[file]);await click(replacement,'import');await settled(replacement);assert.deepEqual(await replacement.eval('saved'),expected.revisions.at(-1));
   await replaceRuntime(false);const reopen=await page(debug,origin);await ready(reopen);await choose(reopen,expected.revisions.at(-1).definition.goal);await click(reopen,'saved-context');await settled(reopen);assert.match(await reopen.eval("$('context-view').textContent"),/Origin unavailable or unverified/);
   const recovered=await downloadDir(reopen,'recovery-'+expected.revisions[0].work_id);await reopen.eval("$('history-tools').open=true");await click(reopen,'export');await settled(reopen);assert.deepEqual(JSON.parse(await downloaded(recovered,'planning-work.json')),expected);
   for(const width of [390,768,1200]){await reopen.send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<500});const dimensions=await reopen.eval('({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth,inner:innerWidth})');assert(dimensions.scroll<=width&&dimensions.client===width,'actual requested viewport fit '+width);}
 }
 const screenshot=Buffer.from(shot.data,'base64');artifacts.push({name:'reviewed-file-selection.png',bytes:screenshot.length,sha256:digestBytes(screenshot),data:shot.data});
 console.log(JSON.stringify({ordinary_file_browser_evidence:{source:'real Chrome controls and authenticated local direct Worker/D1 with synthetic Access; no hosted authentication claim',original:original.fingerprint,alternate:branch.fingerprint,result:result.fingerprint,original_request_key:JSON.parse(Buffer.from(exact.ticket.split('.')[0],'base64url').toString()).request_key,incorporation_saves:1,write_retries:0,lost_acknowledgements:1,zero_note_branch:true,fresh_process_reopen:true,empty_store_reconstructions:2,preview_text:previewText,artifacts}}));
 checks.push('ordinary files: real upload/roles, direct branch, alternative text edit, explicit same-name replacement with target context retained, invalidated choices, one Save and lost-ack resolution; exact fresh downloads, both histories, two independent UI reconstructions, zero-note branch and actual 390/768/1200 widths');
}
