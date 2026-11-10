import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { storyOriginal, storyRevised } from './story-worldbuilding-fixture.mjs';
import { digestBytes } from '../apps/web_planning/src/files.ts';
import { escape } from '../apps/web_planning/src/page.ts';

export async function browserStoryJourney({a,debug,origin,page,click,set,settled,saved,wait,navigate,replaceRuntime,countRows,root,checks}) {
 const ready=async c=>{await navigate(c,origin+'/');await wait(()=>c.eval("!!$('new-story')&&$('list-state').textContent!=='Reading saved work…'"),'story entry');};
 const choose=async c=>{await c.eval("[...$('work-list').querySelectorAll('button')].find(b=>b.textContent==='황제의 귀환').click()");await settled(c);};
 await ready(a);await click(a,'new-work');await set(a,'goal','Ordinary project remains ordinary');await set(a,'criteria','Save without a creative presentation');await click(a,'save');await saved(a,1);await settled(a);
 assert.equal(await a.eval("$('presentation').value"),'ordinary');assert.equal(await a.eval('saved.files?.length??0'),0);
 await click(a,'new-story');await settled(a);await set(a,'goal','황제의 귀환');await set(a,'authored-text',storyOriginal);await click(a,'save');await saved(a,1);await settled(a);
 assert.equal(await a.eval("$('authored-text').value"),storyOriginal);assert.equal(await a.eval('saved.sources.length'),0);const first=await a.eval('saved');
 const rival=await page(debug,origin);await ready(rival);await choose(rival);await set(rival,'authored-text',storyRevised+'\n\n별도 초안은 보존한다.');
 await set(a,'authored-text',storyRevised);await click(a,'save');await saved(a,2);await settled(a);
 await click(rival,'save');await settled(rival);assert.equal(await rival.eval("$('conflict').hidden"),false);assert.equal(await rival.eval("$('authored-text').value"),storyRevised+'\n\n별도 초안은 보존한다.');
 await click(rival,'review-latest');await settled(rival);assert.match(await rival.eval("$('conflict-latest').innerText"),/재등장 시점도 열어 둔다/);
 await click(rival,'rebase-draft');await click(rival,'save');await saved(rival,3);await settled(rival);const recoveredDraft=await rival.eval("$('authored-text').value");
 await set(rival,'presentation','ordinary');await rival.eval("$('presentation').dispatchEvent(new Event('change',{bubbles:true}))");await settled(rival);await click(rival,'save');await saved(rival,4);await settled(rival);
 assert.equal(await rival.eval('saved.work_id'),first.work_id);assert.equal(await rival.eval("$('authored-text').value"),recoveredDraft);assert.equal(await rival.eval('saved.files.length'),1);
 await set(rival,'presentation','story');await rival.eval("$('presentation').dispatchEvent(new Event('change',{bubbles:true}))");await settled(rival);await click(rival,'save');await saved(rival,5);await settled(rival);
 // Close every old document and dispose workerd before the consumer exists.
 await replaceRuntime(false);
 const fresh=await page(debug,origin);await ready(fresh);await choose(fresh);await saved(fresh,5);await settled(fresh);
 assert.equal(await fresh.eval("$('presentation').value"),'story');assert.equal(await fresh.eval("$('authored-text').value"),recoveredDraft);assert.equal(await fresh.eval('saved.work_id'),first.work_id);
 assert.equal(await fresh.eval('saved.sources.length'),0);
 const downloads=path.join(root,'story-downloads');await mkdir(downloads);await fresh.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloads});
 await fresh.eval("$('history-tools').open=true");await click(fresh,'reading-export');await settled(fresh);await click(fresh,'export');await settled(fresh);
 await wait(async()=>{const names=await readdir(downloads);return names.includes('authored-work.html')&&names.includes('planning-work.json');},'story downloads');
 const html=await readFile(path.join(downloads,'authored-work.html'),'utf8'),bytes=await readFile(path.join(downloads,'planning-work.json')),exported=JSON.parse(bytes);
 assert(html.includes('<pre>'+escape(storyOriginal)+'</pre>'));assert(html.includes('<pre>'+escape(recoveredDraft)+'</pre>'));assert.equal(exported.revisions.length,5);
 for(const [width,height] of [[390,844],[768,900],[1200,800]]){await fresh.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});assert(await fresh.eval('document.documentElement.scrollWidth<=innerWidth'));}
 // The replacement has a distinct disposable D1 directory, with the same
 // explicitly configured recovery identity and its own runtime process.
 await replaceRuntime(true);
 const replacement=await page(debug,origin);await ready(replacement);assert.equal(await replacement.eval("$('list-state').textContent"),'No saved work yet.');
 const select=async file=>{await replacement.eval("$('reconstruction').open=true");const {root:dom}=await replacement.send('DOM.getDocument');const {nodeId}=await replacement.send('DOM.querySelector',{nodeId:dom.nodeId,selector:'#import-file'});await replacement.send('DOM.setFileInputFiles',{nodeId,files:[file]});};
 for(const [name,value] of [['incompatible',{...exported,compatibility:'future/9'}],['malformed',{...exported,files:exported.files.slice(1)}]]){
   const file=path.join(downloads,name+'.json');await writeFile(file,JSON.stringify(value));await select(file);await click(replacement,'import');await settled(replacement);assert.deepEqual(await countRows(),{revisions:0,files:0});assert.equal(await replacement.eval('saved'),null);
 }
 await select(path.join(downloads,'planning-work.json'));await click(replacement,'import');await saved(replacement,5);await settled(replacement);
 assert.equal(await replacement.eval("$('authored-text').value"),recoveredDraft);assert.equal(await replacement.eval("$('presentation').value"),'story');
 await replaceRuntime(false);
 const reopened=await page(debug,origin);await ready(reopened);await choose(reopened);await saved(reopened,5);await settled(reopened);
 assert.equal(await reopened.eval("$('authored-text').value"),recoveredDraft);assert.deepEqual(await reopened.eval("api('/api/work/'+work+'/export')"),exported);
 console.log(JSON.stringify({story_worldbuilding_browser:{producer:'ordinary editor and Save',reentry:'disposed workerd and fresh browser document',recovery:'separate disposable D1; browser file picker, reconstruction and fresh-process reopening',work_id:first.work_id,revision_lineage:exported.revisions.map(r=>({revision:r.revision,fingerprint:r.fingerprint,predecessor:r.predecessor,files:r.files})),original_text:storyOriginal,recovered_text:await reopened.eval("$('authored-text').value"),export_sha256:digestBytes(bytes),selected_context_notes:0,malformed_recoveries_refused:2,model_understanding_tested:false}}));
 checks.push('story: optional and ordinary entry; exact Unicode author/revise; stale draft comparison and recovery; detach/reattach preserves identity; fresh process re-entry; readable history plus complete export; actual empty-destination Browser recovery and second fresh-process reopen; malformed/incompatible atomic refusal');
 // Separate reader edge cases use the ordinary file picker and Save. They do
 // not alter the recovered story whose exact lineage was checked above.
 const pick=async file=>{const {root:dom}=await reopened.send('DOM.getDocument');const {nodeId}=await reopened.send('DOM.querySelector',{nodeId:dom.nodeId,selector:'#work-files'});await reopened.send('DOM.setFileInputFiles',{nodeId,files:[file]});await settled(reopened);};
 await click(reopened,'new-work');await set(reopened,'goal','Exact imported original');await set(reopened,'criteria','Keep byte spelling and deliberate file attribution');
 const imported='\ufeff한글 e\u0301\r\n\r\n원문\r\n',textPath=path.join(downloads,'original.txt');await writeFile(textPath,imported);await pick(textPath);await set(reopened,'authored-file','original.txt');await click(reopened,'open-authored');await settled(reopened);
 await click(reopened,'save');await saved(reopened,1);await settled(reopened);assert.equal(await reopened.eval('saved.files[0].digest'),digestBytes(Buffer.from(imported)));
 await set(reopened,'goal','Metadata edit keeps imported bytes');await click(reopened,'save');await saved(reopened,2);await settled(reopened);assert.equal(await reopened.eval('saved.files[0].digest'),digestBytes(Buffer.from(imported)));
 await set(reopened,'authored-text','\ufeff한글 e\u0301\n\n고친 원문\n');await reopened.eval("(()=>{const role=$('file-role-0');role.value='report';role.dispatchEvent(new Event('change',{bubbles:true}));})()");await click(reopened,'save');await saved(reopened,3);await settled(reopened);
 assert.equal(await reopened.eval('saved.files[0].digest'),digestBytes(Buffer.from('\ufeff한글 e\u0301\r\n\r\n고친 원문\r\n')));assert.equal(await reopened.eval('saved.files[0].role'),'report');
 await set(reopened,'authored-text','retained malformed \ud800 draft');await click(reopened,'save');await settled(reopened);assert.equal(await reopened.eval('saved.revision'),3);assert.match(await reopened.eval("$('status').textContent"),/malformed Unicode/);assert.equal(await reopened.eval("$('authored-text').value"),'retained malformed \ud800 draft');
 // Restore the exact saved display before starting the next independent work.
 await set(reopened,'authored-text','\ufeff한글 e\u0301\n\n고친 원문\n');await click(reopened,'save');await saved(reopened,3);await settled(reopened);
 await click(reopened,'new-story');await settled(reopened);await set(reopened,'goal','Missing original is unavailable');await reopened.eval("[...$('file-selection').querySelectorAll('button')].find(b=>b.textContent==='Remove manuscript.txt from next revision').click()");await click(reopened,'save');await saved(reopened,1);await settled(reopened);
 assert.equal(await reopened.eval("$('authored-text').disabled"),true);assert.match(await reopened.eval("$('authored-state').textContent"),/missing/);assert.equal(await reopened.eval('saved.files.length'),1);
 await click(reopened,'new-work');await set(reopened,'goal','Unsupported presentation remains unavailable');await set(reopened,'criteria','Do not silently reinterpret');const futurePath=path.join(downloads,'augnes-story-worldbuilding.v1.json');await writeFile(futurePath,JSON.stringify({format:'augnes_story_worldbuilding.v99',primary_file:'manuscript.txt'}));await pick(futurePath);await click(reopened,'save');await saved(reopened,1);await settled(reopened);
 assert.equal(await reopened.eval("$('authored-text').disabled"),true);assert.match(await reopened.eval("$('authored-state').textContent"),/unsupported/);await click(reopened,'save');await settled(reopened);assert.equal(await reopened.eval('saved.revision'),1);
 checks.push('story reader: BOM/combining Unicode and unchanged CRLF bytes survive metadata edits; CRLF and explicit file role survive text revision; malformed Unicode draft is retained without saving; missing primary and unknown presentation stay unavailable');
}
