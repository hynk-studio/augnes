import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';

export async function browserFileExchanges({ c, origin, click, set, saved, settled, wait, navigate, root, checks, requestsOnly }) {
  const dir = path.join(root, 'event-plan-files');
  const originalDir = path.join(dir, 'original'), returnDir = path.join(dir, 'returned'), downloads = path.join(dir,'downloads');
  for (const folder of [originalDir,returnDir,downloads]) await mkdir(folder,{recursive:true});
  const name = '행사 계획.md', goal = '가을 마을 행사';
  const original = '# 행사 계획\r\n참석 12명, 한 테이블에 4명.\r\n준비할 테이블: 미정\r\n';
  await writeFile(path.join(originalDir,name),original);
  const pick = async file => {
    const {root:dom}=await c.send('DOM.getDocument');
    const {nodeId}=await c.send('DOM.querySelector',{nodeId:dom.nodeId,selector:'#exchange-upload'});
    await c.send('DOM.setFileInputFiles',{nodeId,files:[file]});
  };
  const selectTask = async () => {
    await wait(()=>c.eval(`[...$('work-list').querySelectorAll('button')].some(b=>b.textContent===${JSON.stringify(goal)})`),'task entry by name');
    await c.eval(`[...$('work-list').querySelectorAll('button')].find(b=>b.textContent===${JSON.stringify(goal)}).click()`);
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
  await watchSaveResponse(false); await click(c,'exchange-check'); await saved(c,5); await settled(c); await reopen();
  const edited = peerBytes.toString().replace('confirmed.','opens at 10.');
  await venueButton('Read text'); await venueButton('Read text');
  assert.deepEqual(await c.eval(`[...${venueArticle}.querySelectorAll('pre')].map(p=>p.textContent)`),[peerBytes.toString(),edited]);
  assert.deepEqual(await c.eval('exchangeState.items.at(-1).basis'),await c.eval('exchangeState.items.at(-2).ref'));
  assert.equal(await c.eval('exchangeState.items.at(-1).files[0].digest'),'sha256:'+createHash('sha256').update(edited).digest('hex'));
  checks.push('an in-page text return preserves the original, BOM, CRLF and inert markup after a lost acknowledgement');
  await click(c,'exchange-new'); await set(c,'exchange-message','Confirm the venue'); await pick(path.join(originalDir,name));
  c.accessBoundary='challenge'; await click(c,'exchange-submit'); await settled(c);
  assert.equal(await c.eval("accessLost && !exchangeDraft && !exchangePending && !$('exchange-form')"),true);
  assert.equal(await wouldWarn(), false, 'Access loss clears private work and its warning.');
  checks.push('file exchange protects unsent and uncertain work on reload; cancel, confirmed save and access loss clear the guard');
  checks.push('event plan: real named task, original and returned downloads, content-dependent edit, retained return after lost response, fresh reopen, mobile and desktop controls');
}
