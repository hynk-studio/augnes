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
  const reopen = async () => {
    await navigate(c,origin+'/');
    await wait(()=>c.eval(`[...$('work-list').querySelectorAll('button')].some(b=>b.textContent===${JSON.stringify(goal)})`),'task entry by name');
    await c.eval(`[...$('work-list').querySelectorAll('button')].find(b=>b.textContent===${JSON.stringify(goal)}).click()`);
    await settled(c);
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
  await c.send('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'},{urlPattern:'*/exchanges/save',requestStage:'Response'}]});
  await click(c,'exchange-submit');await settled(c);assert.equal(await c.eval("$('exchange-uncertain').hidden"),false);
  assert.equal(await c.eval("Object.keys(JSON.parse(sessionStorage.getItem(exchangeStoragePrefix+work)).files[0]).includes('data')"),false);
  await requestsOnly(c);await reopen();assert.match(await c.eval("$('exchange-list').textContent"),/Previous file save confirmed at version 2/);
  assert.match(await c.eval("$('exchange-list').textContent"),/Awaiting a return/);
  const received = await download(0,downloads);assert.equal(received.toString(),original);
  const [,people,seats] = received.toString().match(/참석 (\d+)명, 한 테이블에 (\d+)명/);
  const edit = received.toString().replace('미정',String(Math.ceil(Number(people)/Number(seats)))+'개');
  await writeFile(path.join(returnDir,name),edit);
  await c.eval("$('exchange-list').querySelector('button').click()");await set(c,'exchange-message','참석자와 좌석 수로 계산했습니다.');await set(c,'exchange-next','입구에 배치도 게시');await pick(path.join(returnDir,name));
  // Lose the real committed reply, then reconcile the identical request over the read-only resolve route.
  await c.send('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'},{urlPattern:'*/exchanges/save',requestStage:'Response'}]});
  await click(c,'exchange-submit');await settled(c);assert.equal(await c.eval("$('exchange-uncertain').hidden"),false);
  await requestsOnly(c);await click(c,'exchange-check');await saved(c,3);await settled(c);await reopen();
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
  checks.push('event plan: real named task, original and returned downloads, content-dependent edit, retained return after lost response, fresh reopen, mobile and desktop controls');
}
