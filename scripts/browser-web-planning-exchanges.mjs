import assert from 'node:assert/strict';
import { reviewZip } from './web-planning-large-exchange-checks.mjs';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';

export async function browserFileExchanges({ c, origin, click, set, saved, settled, wait, navigate, root, checks, requestsOnly, barrier, requests }) {
  const dir = path.join(root, 'event-plan-files');
  const originalDir = path.join(dir, 'original'), returnDir = path.join(dir, 'returned'), downloads = path.join(dir,'downloads');
  for (const folder of [originalDir,returnDir,downloads]) await mkdir(folder,{recursive:true});
  const name = '행사 계획.md', goal = '가을 마을 행사';
  const original = '# 행사 계획\r\n참석 12명, 한 테이블에 4명.\r\n준비할 테이블: 미정\r\n';
  await writeFile(path.join(originalDir,name),original);
  const pick = async file => {
    const {root:dom}=await c.send('DOM.getDocument');
    const {nodeId}=await c.send('DOM.querySelector',{nodeId:dom.nodeId,selector:'#exchange-upload'});
    await c.send('DOM.setFileInputFiles',{nodeId,files:Array.isArray(file)?file:[file]});
  };
  const selectTask = async () => {
    // Frame navigation can finish before the new document's deferred client runs.
    const buttons = "[...document.querySelectorAll('#work-list button')]";
    await wait(()=>c.eval(`${buttons}.some(b=>b.textContent===${JSON.stringify(goal)})`),'task entry by name');
    await c.eval(`${buttons}.find(b=>b.textContent===${JSON.stringify(goal)}).click()`);
    await settled(c);
  };
  // Reconfiguring Fetch or reloading can invalidate an unrelated paused CDP
  // request. Let the task's normal debounced capacity read finish first.
  const capacitySettled = () => wait(() => c.eval(
    "!capacityInFlight && ['fits','blocked','unavailable'].includes($('draft-capacity').dataset.state)"
  ), 'exchange task capacity settles');
  const watchSaveResponse = async loseResponse => {
    await capacitySettled();
    if (loseResponse) {
      await c.send('Fetch.enable', {patterns:[
        {urlPattern:'*', requestStage:'Request'},
        {urlPattern:'*/exchanges/save', requestStage:'Response'}
      ]});
    } else {
      await requestsOnly(c);
    }
  };
  const reopen = async () => { await capacitySettled(); await navigate(c,origin+'/'); await selectTask(); };
  const wouldWarn = () => c.eval("!window.dispatchEvent(new Event('beforeunload', {cancelable:true}))");
  // A browser may suppress beforeunload without a user gesture. Exercise the real
  // dialog on reload and distinguish it from an unguarded navigation.
  const reloadWithWarning = async accept => {
    await capacitySettled();
    const gesture = await c.send('Runtime.evaluate', {expression:'navigator.userActivation.hasBeenActive', userGesture:true});
    assert.equal(gesture.result.value, true);
    let response, navigated = false;
    const observe = event => {
      if (event.method === 'Page.javascriptDialogOpening' && event.params.type === 'beforeunload')
        response = c.send('Page.handleJavaScriptDialog', {accept});
      if (event.method === 'Page.frameNavigated' && !event.params.frame.parentId) navigated = true;
    };
    c.handlers.push(observe);
    try {
      await c.send('Page.reload');
      await wait(() => response !== undefined || navigated, 'reload dialog or new document');
      assert.ok(response, 'The browser must ask before discarding the file exchange.');
      await response;
      if (accept) await wait(() => navigated, 'confirmed reload');
    } finally {
      c.handlers.splice(c.handlers.indexOf(observe), 1);
    }
  };
  const download = async (nth,folder) => {
    await mkdir(folder,{recursive:true});
    await c.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:folder});
    await c.eval(`$('exchange-list').querySelectorAll('a')[${nth}].click()`);
    const file=path.join(folder,name);
    await wait(()=>stat(file).then(s=>s.isFile()).catch(()=>false),'versioned file download');
    return readFile(file);
  };
  await navigate(c,origin+'/');await wait(()=>c.eval("!!$('new-work')"),'planning entry');
  await click(c,'new-work');await set(c,'goal',goal);await set(c,'criteria','참석 인원에 맞는 배치 확인');await click(c,'save');await saved(c,1);await settled(c);
  await click(c,'exchange-new');await set(c,'exchange-message','필요한 테이블 수를 계산해 계획에 적어 주세요.');await pick(path.join(originalDir,name));
  const unsentWarning = await wouldWarn();
  assert.equal(await c.eval('sessionStorage.getItem(exchangeStoragePrefix+work)'), null);
  await watchSaveResponse(true);
  await click(c,'exchange-submit');await settled(c);assert.equal(await c.eval("$('exchange-uncertain').hidden"),false);
  assert.equal(await c.eval("Object.keys(JSON.parse(sessionStorage.getItem(exchangeStoragePrefix+work)).files[0]).includes('data')"),false);
  const pendingJournal=await c.eval('sessionStorage.getItem(exchangeStoragePrefix+work)');
  await click(c,'signout');
  assert.match(await c.eval("$('status').textContent"),/Sign out cancelled/);
  assert.equal(await c.eval('sessionStorage.getItem(exchangeStoragePrefix+work)'),pendingJournal,'cancelled logout preserves the real unresolved operation journal');
  assert.equal(await c.eval('accessLost'),false);
  assert.deepEqual({unsent:unsentWarning, pending:await wouldWarn()}, {unsent:true, pending:true},
    'File exchange alone must protect both the unsent draft and its uncertain save.');
  await watchSaveResponse(false); await reloadWithWarning(true); await selectTask();
  assert.match(await c.eval("$('exchange-list').textContent"),/Previous file save confirmed at version 2/);
  assert.equal(await wouldWarn(), false, 'Confirmed request clears the warning.');
  assert.match(await c.eval("$('exchange-list').textContent"),/Awaiting a return/);
  const received = await download(0,downloads);assert.equal(received.toString(),original);
  const [,people,seats] = received.toString().match(/참석 (\d+)명, 한 테이블에 (\d+)명/);
  const edit = received.toString().replace('미정',String(Math.ceil(Number(people)/Number(seats)))+'개');
  await writeFile(path.join(returnDir,name),edit);
  await c.eval("[...$('exchange-list').querySelectorAll('button')].find(b=>b.textContent==='Return edited files').click()");await set(c,'exchange-message','참석자와 좌석 수로 계산했습니다.');await set(c,'exchange-next','입구에 배치도 게시');await pick(path.join(returnDir,name));
  await reloadWithWarning(false);
  assert.deepEqual(await c.eval("[$('exchange-message').value, $('exchange-next').value, $('exchange-upload').files[0].name]"),
    ['참석자와 좌석 수로 계산했습니다.', '입구에 배치도 게시', name]);
  // Lose the real committed reply, then reconcile the identical request over the read-only resolve route.
  await watchSaveResponse(true);
  await click(c,'exchange-submit');await settled(c);assert.equal(await c.eval("$('exchange-uncertain').hidden"),false);
  await watchSaveResponse(false);await click(c,'exchange-check');await saved(c,3);await settled(c);
  assert.equal(await wouldWarn(), false, 'Confirmed return clears the warning.'); await reopen();
  const content=await c.eval("$('exchange-list').textContent");
  for(const phrase of ['Answered request','version 2','version 3',name,'입구에 배치도 게시'])assert.ok(content.includes(phrase),phrase);
  const result=await download(1,path.join(dir,'fresh'));assert.equal(result.toString(),edit);
  const widths=[];
  for(const width of [390,1200]) {
    await c.send('Emulation.setDeviceMetricsOverride',{width,height:860,deviceScaleFactor:1,mobile:false});
    await c.eval("$('exchange-panel').scrollIntoView()");
    const layout=await c.eval(`(()=>{const links=[...$('exchange-panel').querySelectorAll('a,button')].filter(e=>e.getClientRects().length);return {width:innerWidth,scroll:document.documentElement.scrollWidth,visible:links.every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.height>0;})};})()`);
    assert.equal(layout.width,width);assert.ok(layout.scroll<=width && layout.visible,JSON.stringify(layout));widths.push(layout);
    const shot=await c.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
    console.log(JSON.stringify({file_exchange_browser_image:{name:'event-plan-'+width+'.png',data:shot.data}}));
  }
  const identity = b => ({bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')});
  console.log(JSON.stringify({file_exchange_browser_evidence:{case:goal,original:identity(received),returned:identity(result),next_action:'입구에 배치도 게시',table_count:3,widths,reconciled_without_resubmitting:true}}));
  // A second writer advances this task. The stale browser's real refusal is lost in transit.
  // A reload must recover what the person typed without retargeting or issuing another write.
  const question = '입구 안내 문구도 확인해 주세요.', action = '안내판 문구 결정';
  await click(c,'exchange-new');await set(c,'exchange-message',question);await set(c,'exchange-next',action);
  await pick(path.join(originalDir,name));
  const peerBytes = Buffer.from('\ufeffVenue confirmed.\r\nVenue <b>map</b> attached.\r\n');
  const peer = {kind:'request',basis:null,message:'Confirm the arrival time',next_action:'',
    files:[{name:'venue.txt',media_type:'text/plain',bytes:peerBytes.length,digest:'sha256:'+createHash('sha256').update(peerBytes).digest('hex'),data:peerBytes.toString('base64')}]};
  await c.eval(`api('/api/work/'+work+'/exchanges/save',{...${JSON.stringify(peer)},expected:exchangeDraft.expected,request_key:crypto.randomUUID()})`);
  await watchSaveResponse(true);
  await click(c,'exchange-submit');await settled(c);assert.equal(await c.eval("$('exchange-uncertain').hidden"),false);
  await watchSaveResponse(false);await reopen();
  assert.equal(await c.eval("$('exchange-message').value"),question);assert.equal(await c.eval("$('exchange-next').value"),action);
  assert.equal(await c.eval("$('exchange-refresh').hidden"),false);
  assert.ok(await c.eval(`$('exchange-list').textContent.includes(${JSON.stringify(name)})`));
  await click(c,'exchange-refresh');await settled(c);assert.equal(await c.eval('exchangeState.items.length'),3);
  await click(c,'exchange-cancel');
  assert.equal(await wouldWarn(), false, 'Discarded draft clears the warning.');
  // Review the actual saved original in the page, without a browser download or a file picker.
  const venueArticle = `[...$('exchange-list').querySelectorAll('article')].find(a=>a.textContent.includes('venue.txt'))`;
  const venueButton = async label => {
    await c.eval(`[...${venueArticle}.querySelectorAll('button')].find(b=>b.textContent===${JSON.stringify(label)}).click()`);
    await settled(c);
  };
  await venueButton('Read text');
  assert.equal(await c.eval(`${venueArticle}.querySelector('pre').textContent`),peerBytes.toString());
  assert.equal(await c.eval(`${venueArticle}.querySelector('pre').children.length`),0);
  await venueButton('Edit this text');
  assert.equal(await c.eval("$('exchange-upload').disabled && !$('exchange-text-fields').disabled"),true);
  await set(c,'exchange-message','Confirmed the arrival time.'); await set(c,'exchange-next','Send the arrival time.');
  await set(c,'exchange-find','Venue'); await set(c,'exchange-replacement','Hall');
  await click(c,'exchange-submit'); await settled(c);
  assert.match(await c.eval("$('status').textContent"),/unique original passage/);
  assert.equal(await c.eval('exchangeState.head.revision'),4);
  await set(c,'exchange-find','confirmed.\nVenue'); await set(c,'exchange-replacement','opens at 10.\nVenue');
  await watchSaveResponse(true); await click(c,'exchange-submit'); await settled(c);
  const marker = await c.eval('sessionStorage.getItem(exchangeStoragePrefix+work)');
  assert.ok(marker && !marker.includes('opens at 10.') && !marker.includes('Venue confirmed.'));
  const markerKey=await c.eval('exchangeStoragePrefix+work');
  await watchSaveResponse(false);c.accessBoundary='challenge';await click(c,'refresh-list');await settled(c);
  assert.equal(await c.eval("accessLost&&!$('editor')&&exchangePending===null"),true,'access loss immediately clears private memory and display');
  assert.equal(await c.eval('sessionStorage.getItem('+JSON.stringify(markerKey)+')'),marker,'access loss preserves the exact unresolved operation identity');
  await navigate(c,origin+'/');await selectTask();await saved(c,5);await settled(c);await reopen();
  const edited = peerBytes.toString().replace('confirmed.','opens at 10.');
  await venueButton('Read text'); await venueButton('Read text');
  assert.deepEqual(await c.eval(`[...${venueArticle}.querySelectorAll('pre')].map(p=>p.textContent)`),[peerBytes.toString(),edited]);
  assert.deepEqual(await c.eval('exchangeState.items.at(-1).basis'),await c.eval('exchangeState.items.at(-2).ref'));
  assert.equal(await c.eval('exchangeState.items.at(-1).files[0].digest'),'sha256:'+createHash('sha256').update(edited).digest('hex'));
  checks.push('an in-page text return preserves the original, BOM, CRLF and inert markup after a lost acknowledgement');
  // A real planning list: a later change, a second task with a long unanswered
  // question, a returned file and a plain task share the normal project reader.
  const eventId=await c.eval('work');
  const longTitle='Select poems for the autumn reading: confirm the translations, reading order and permission to print the closing stanza';
  const longAction='Confirm the final stanza with the poet. Keep the source edition and translator credit in the programme; the rehearsal copy still contains the literal note <b>check this line</b>.';
  const verses=Buffer.from('Opening poem: Harbour. Closing stanza: permission to be confirmed.');
  const poemRequest={kind:'request',basis:null,message:'Check the closing stanza against the source edition.',next_action:longAction,
    files:[{name:'shortlist.txt',media_type:'text/plain',bytes:verses.length,digest:'sha256:'+createHash('sha256').update(verses).digest('hex'),data:verses.toString('base64')}]};
  const poetry=await c.eval(`(async()=>{
    const d={definition:{goal:${JSON.stringify(longTitle)},success_criteria:['Choose the opening poem'],non_goals:[]},notes:[]};
    const initial=await api('/api/drafts',d),r=await api('/api/work/'+initial.work_id+'/save',{ticket:initial.ticket,...d});
    const result=await api('/api/work/'+initial.work_id+'/exchanges/save',{...${JSON.stringify(poemRequest)},request_key:crypto.randomUUID(),expected:binding(r.saved)});
    return result.item.ref;
  })()`);
  await navigate(c,origin+'/');await wait(()=>c.eval("!!$('work-list')?.children.length"),'fresh discovery list');
  await click(c,'refresh-list');await settled(c);
  const rowFor=title=>`[...$('work-list').children].find(row=>row.firstElementChild.textContent===${JSON.stringify(title)})`;
  const poemRow=rowFor(longTitle),eventRow=rowFor(goal);
  await c.eval(poemRow+".querySelector('summary').click()");
  assert.match(await c.eval(poemRow+'.innerText'),/1 awaiting a return/);
  assert((await c.eval(poemRow+'.innerText')).includes(longAction));
  assert.equal(await c.eval(poemRow+".querySelectorAll('b').length"),0);
  assert.match(await c.eval(eventRow+'.innerText'),/2 returned files/);
  const listWidths=[];
  for(const width of [390,1200]){
    await c.send('Emulation.setDeviceMetricsOverride',{width,height:860,deviceScaleFactor:1,mobile:width===390});
    await c.eval(poemRow+".scrollIntoView({block:'start'})");
    const observed=await c.eval(`(()=>{const row=${poemRow};return {width:innerWidth,document:document.documentElement.scrollWidth,
      row:row.clientWidth,content:row.scrollWidth,controls:[...row.querySelectorAll('button,summary')].map(x=>{const r=x.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.height>=44;})}})()`);
    assert.equal(observed.width,width);assert(observed.document<=width&&observed.content<=observed.row+1&&observed.controls.every(Boolean));listWidths.push(observed);
    const shot=await c.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
    console.log(JSON.stringify({work_list_image:{name:'work-list-'+width+'.png',data:shot.data}}));
  }
  const retained=await c.eval("$('work-list').textContent");
  c.listFailure='partial';await click(c,'refresh-list');await settled(c);
  assert.equal(await c.eval("$('work-list').textContent"),retained);
  assert.match(await c.eval("$('list-state').textContent"),/out of date/);
  const readStart=requests.length;await click(c,'refresh-list');await settled(c);
  const reads=requests.slice(readStart).filter(r=>!r.path.endsWith('/capacity'));
  assert.deepEqual(reads.map(r=>[r.method,r.path]),[['GET','/api/works']]);
  // Leave the displayed v2 alone while another writer advances the actual work.
  await c.eval(`api('/api/work/'+${JSON.stringify(poetry.work_id)}+'/exchanges/save',{...${JSON.stringify(peer)},request_key:crypto.randomUUID(),expected:${JSON.stringify({revision:poetry.revision,fingerprint:poetry.fingerprint})}})`);
  await c.eval(poemRow+".querySelector('summary').click()");
  await c.eval(poemRow+".querySelector('.list-record button').focus()");
  const enter=async()=>{for(const type of ['keyDown','keyUp'])await c.send('Input.dispatchKeyEvent',{type,key:'Enter',code:'Enter',windowsVirtualKeyCode:13,...(type==='keyDown'?{text:'\r'}:{})});};
  await enter();await settled(c);
  assert.equal(await c.eval('work'),poetry.work_id);assert.equal(await c.eval('saved.revision'),3);
  assert.match(await c.eval("$('status').textContent"),/changed since it was listed/);
  assert.equal(await c.eval('document.activeElement.id'),'exchange-version-2');
  // A delayed task open must not replace edits typed after selecting a row.
  await capacitySettled();
  const delayed=await barrier(c,'/api/work/'+eventId);
  await c.eval(eventRow+'.firstElementChild.click()');await delayed.wait();
  await set(c,'goal','Retain this edit while the other work opens');await delayed.release();await settled(c);
  assert.equal(await c.eval('work'),poetry.work_id);assert.equal(await c.eval("$('goal').value"),'Retain this edit while the other work opens');
  assert.equal(await c.eval('dirty'),true);
  await c.eval(eventRow+".querySelector('summary').click()");
  let discard;
  const consent=m=>{if(m.method==='Page.javascriptDialogOpening'&&m.params.type==='confirm')discard=c.send('Page.handleJavaScriptDialog',{accept:true});};
  c.handlers.push(consent);
  try{await c.eval(eventRow+".querySelector('.list-record button').click()");await settled(c);assert(discard);await discard;}
  finally{c.handlers.splice(c.handlers.indexOf(consent),1);}
  assert.equal(await c.eval('work'),eventId);assert.equal(await c.eval('document.activeElement.id'),'exchange-version-5');
  const erased=await c.eval(`(async()=>{const root='/api/work/'+${JSON.stringify(poetry.work_id)};
    const {saved}=await api(root);return api(root+'/erase',{expected:binding(saved),confirm:'erase-whole-work'});})()`);
  assert.equal(erased.erased,true);
  await c.eval(poemRow+'.firstElementChild.click()');await settled(c);
  assert.equal(await c.eval('work'),eventId);assert.equal(await c.eval('saved.revision'),5);
  assert.match(await c.eval("$('status').textContent"),/no longer available/);
  await requestsOnly(c);
  console.log(JSON.stringify({work_list_browser:{widths:listWidths,read_requests:reads.map(r=>r.path),stale_list_opened_revision:3,focused_request_revision:2,focused_return_revision:5,partial_retained:true,delayed_open_preserved_edit:true,erased_selection_retained_editor:true}}));
  checks.push('work list: responsive poetry example, inert recorded action, exact keyboard selection after a concurrent edit, retained drafts, incomplete response and read-only refresh');
  await click(c,'new-work');await set(c,'goal','Return the field survey');await set(c,'criteria','Retain and review original observations');await click(c,'save');await saved(c,1);await settled(c);
  const long=Buffer.alloc(5328363,0x78),row=Buffer.from('Survey: 17 observed, 4 deferred.');row.copy(long,long.length-row.length);
  const largePath=path.join(originalDir,'survey.log'),zipPath=path.join(originalDir,'survey.zip'),zip=reviewZip();
  await writeFile(largePath,long);await writeFile(zipPath,zip);
  const reviewSources=[
    ['receipt.json','\uFEFF{ "observed" : 17,\r\n'],
    ['survey.patch','@@ -1 +1 @@\r\n-<b>pending</b>\r\n+<b>4 deferred</b>\r\n'],
    ['survey.mjs','globalThis.surveyRan = true;\nexport const deferred = 4;\n'],
  ];
  for(const [name,text] of reviewSources)await writeFile(path.join(originalDir,name),text);
  await click(c,'exchange-new');await set(c,'exchange-message','Check the survey totals');
  await pick([largePath,zipPath,...reviewSources.map(([name])=>path.join(originalDir,name))]);await click(c,'exchange-submit');await saved(c,2);await settled(c);
  await c.eval("document.querySelector('button[aria-label=\"Read survey.log as text\"]').click()");await settled(c);
  const reader="document.querySelector('#exchange-list li section')";
  await wait(()=>c.eval(reader+"?.querySelector('pre')?.textContent.length===8192"),'bounded first page');
  for(const width of [390,1200]){
    await c.send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<500});
    assert(await c.eval("document.documentElement.scrollWidth<=innerWidth"),'long line wraps at '+width);
  }
  await c.eval(reader+".querySelector('input[type=search]').value='Survey:'");
  await c.eval(reader+".querySelectorAll('button')[1].click()");await settled(c);
  const observed=await c.eval(reader+".querySelector('pre').textContent");
  assert.equal(observed,row.toString());assert.match(await c.eval(reader+".querySelector('p').textContent"),/End of file.*partial/);
  await c.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloads});
  await c.eval("$('exchange-list').querySelectorAll('a')[1].click()");
  const zipDownload=path.join(downloads,'survey.zip');await wait(()=>stat(zipDownload).then(f=>f.size===zip.length).catch(()=>false),'complete opaque ZIP download');assert((await readFile(zipDownload)).equals(zip));
  await c.eval("[...$('exchange-list').querySelectorAll('button')].find(b=>b.textContent==='Return edited files').click()");
  const [observations,deferred]=observed.match(/\d+/g).map(Number);
  await set(c,'exchange-message','Checked the final survey row');await set(c,'exchange-next','Transfer the verified subset');await set(c,'exchange-review','Transfer '+(observations-deferred)+' observations.');
  const revisedReceipt=path.join(returnDir,'receipt.json');await writeFile(revisedReceipt,'{"transfer":13}\n');await pick(revisedReceipt);
  await click(c,'exchange-submit');await saved(c,3);await settled(c);
  assert.match(await c.eval("$('exchange-list').textContent"),/review.md/);
  for(const [name,original] of reviewSources){
    const link=`[...$('exchange-list').querySelectorAll('a')].find(a=>a.download===${JSON.stringify(name)} && a.textContent.includes(' · version 2 · '))`;
    const file=link+'.parentElement';
    await c.eval(file+".querySelector('button').click()");await settled(c);
    assert.equal(await c.eval(file+".querySelector('pre').textContent"),original);
    assert.equal(await c.eval(file+".querySelector('pre').childElementCount"),0);
    assert.match(await c.eval(file+".querySelector('section p').textContent"),/version 2 .*Complete text/);
  }
  assert.equal(await c.eval('typeof globalThis.surveyRan'),'undefined');
  checks.push('Read text shows the original JSON, patch and module literally, including an older same-name receipt after a return');
  checks.push('complete originals: full-size log and ZIP uploaded, long line wraps at 390/1200, exact search, complete ZIP bytes and a grounded typed review');
  await click(c,'exchange-new'); await set(c,'exchange-message','Confirm the venue'); await pick(path.join(originalDir,name));
  c.accessBoundary='challenge'; await click(c,'exchange-submit'); await settled(c);
  assert.equal(await c.eval("accessLost && !exchangeDraft && !exchangePending && !$('exchange-form')"),true);
  assert.equal(await wouldWarn(), false, 'Access loss clears private work and its warning.');
  checks.push('file exchange protects unsent and uncertain work on reload; cancel, confirmed save and access loss clear the guard');
  checks.push('event plan: real named task, original and returned downloads, content-dependent edit, retained return after lost response, fresh reopen, mobile and desktop controls');
}
