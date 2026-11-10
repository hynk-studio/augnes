import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { checkControlBoundaryContrast } from './browser-control-contrast.mjs';

// These checks run in the existing owned Chrome/workerd/D1 harness. Faults hold
// real responses or the native File.text continuation; mutations use UI handlers.
export async function browserDraftSafety({c,root,click,set,saved,settled,wait,barrier,requests,replaceRuntime,checks}) {
  const failures=[];
  async function check(name,fn){try{await fn();checks.push(name);console.log('draft-safety PASS: '+name);}catch(e){failures.push({name,error:e.stack});console.log('draft-safety FAIL: '+name+' '+e.message);}}
  async function pick(id,file){const {root:node}=await c.send('DOM.getDocument');const {nodeId}=await c.send('DOM.querySelector',{nodeId:node.nodeId,selector:'#'+id});await c.send('DOM.setFileInputFiles',{nodeId,files:[file]});}
  async function create(){await click(c,'new-work');await settled(c);await set(c,'goal','Disposable QA work');await set(c,'criteria','Retain exact material');await click(c,'save');await saved(c,1);await settled(c);}
  // Only navigation/explicit discard confirmations are accepted by default.
  let accept=true;
  const dialogs=m=>{if(m.method==='Page.javascriptDialogOpening')void c.send('Page.handleJavaScriptDialog',{accept});};c.handlers.push(dialogs);
  try {
    await create();
    const exported=await c.eval("api('/api/work/'+work+'/export')");
    const reconstructionRoute=['web_planning_export.v0.3','web_planning_export.v0.4','web_planning_export.v0.5'].includes(exported.format)?'/api/reconstruct-files':'/api/reconstruct';
    const exportPath=path.join(root,'draft-safety-export.json');await writeFile(exportPath,JSON.stringify(exported));
    for(const boundary of ['file','response'])await check('H6 actual Add context during '+boundary,async()=>{
      await replaceRuntime();await click(c,'new-work');await settled(c);await pick('import-file',exportPath);
      let held;
      if(boundary==='file')await c.eval("window.originalFileText=File.prototype.text;File.prototype.text=async function(){const text=await originalFileText.call(this);window.fileReadHeld=true;await new Promise(resolve=>window.releaseFileRead=resolve);return text;}");
      else held=await barrier(c,reconstructionRoute);
      const start=requests.length;await click(c,'import');
      if(held)await held.wait();else await wait(()=>c.eval('window.fileReadHeld===true'),'native file read');
      await click(c,'add-note');
      assert.equal(await c.eval("$('notes').children.length"),1,'actual button adds a row');
      if(held)await held.release();else {await c.eval('window.releaseFileRead();File.prototype.text=window.originalFileText');await settled(c);}
      assert.equal(await c.eval("$('notes').children.length"),1,'new note survives the continuation');
      assert.equal(requests.slice(start).filter(r=>r.path===reconstructionRoute).length,boundary==='file'?0:1);
      assert.match(await c.eval("$('status').textContent"),boundary==='file'?/not requested/i:/newer draft is retained/i);
      if(held)assert.equal((await c.eval('api("/api/works")')).items.length,1,'restoration really committed once');
    });
    await check('H6 unchanged reconstruction into an empty replacement store',async()=>{
      await replaceRuntime();await pick('import-file',exportPath);await click(c,'import');await settled(c);await saved(c,1);
      assert.equal(await c.eval("$('goal').value"),'Disposable QA work');assert.match(await c.eval("$('status').textContent"),/Reconstructed/);
    });
    for(const boundary of ['file','response'])await check('H6 local file chooser during '+boundary,async()=>{
      await replaceRuntime();await click(c,'new-work');await settled(c);await pick('import-file',exportPath);
      const localFile=path.join(root,'during-import.txt');await writeFile(localFile,'Selected original bytes');
      let held;if(boundary==='file')await c.eval("window.originalFileText=File.prototype.text;File.prototype.text=async function(){const text=await originalFileText.call(this);window.fileReadHeld=true;await new Promise(resolve=>window.releaseFileRead=resolve);return text;}");else held=await barrier(c,reconstructionRoute);
      await click(c,'import');if(held)await held.wait();else await wait(()=>c.eval('window.fileReadHeld===true'),'file chooser boundary');
      const locked=await c.eval("$('work-files').matches(':disabled')");if(!locked)await pick('work-files',localFile);
      if(held)await held.release();else {await c.eval('window.releaseFileRead();File.prototype.text=window.originalFileText');await settled(c);}
      if(locked){assert.equal(await c.eval("$('work-files').matches(':disabled')"),false);await pick('work-files',localFile);await settled(c);}
      const files=await c.eval('selectedFiles.map(f=>f.name)');console.log(JSON.stringify({file_chooser_boundary:{boundary,locked,files}}));
      assert(files.includes('during-import.txt'),'an enabled file chooser must not silently discard the selected bytes');
    });
    for(const boundary of ['file','response'])for(const mutation of ['remove-note','remove-file','authored-input','reselect-file'])await check('H6 '+mutation+' during '+boundary,async()=>{
      await replaceRuntime();await click(c,'new-work');await settled(c);await set(c,'goal','Retained local draft');await click(c,'new-authored');await settled(c);await set(c,'authored-text','Local original');await click(c,'add-note');await pick('import-file',exportPath);
      let held;
      if(boundary==='file')await c.eval("window.originalFileText=File.prototype.text;File.prototype.text=async function(){const text=await originalFileText.call(this);window.fileReadHeld=true;await new Promise(resolve=>window.releaseFileRead=resolve);return text;}");
      else held=await barrier(c,reconstructionRoute);
      const start=requests.length;await click(c,'import');if(held)await held.wait();else await wait(()=>c.eval('window.fileReadHeld===true'),'file continuation');
      if(mutation==='remove-note')await c.eval("$('notes').firstElementChild.querySelector('button').click()");
      if(mutation==='remove-file')await c.eval("$('file-selection').querySelector('button').click()");
      if(mutation==='authored-input')await set(c,'authored-text','Newer original writing');
      if(mutation==='reselect-file')await set(c,'authored-file','');
      if(held)await held.release();else {await c.eval('window.releaseFileRead();File.prototype.text=window.originalFileText');await settled(c);}
      assert.equal(await c.eval("$('goal').value"),'Retained local draft');
      if(mutation==='remove-note')assert.equal(await c.eval("$('notes').children.length"),0);
      if(mutation==='remove-file')assert.equal(await c.eval('selectedFiles.length'),0);
      if(mutation==='reselect-file')assert.equal(await c.eval("$('authored-file').value"),'');
      if(mutation==='authored-input')assert.equal(await c.eval("$('authored-text').value"),'Newer original writing');
      assert.equal(requests.slice(start).filter(r=>r.path===reconstructionRoute).length,boundary==='file'?0:1);
    });
    await check('H9 lost erase acknowledgement followed by failed list read',async()=>{
      await replaceRuntime();await create();await click(c,'erase');const held=await barrier(c,'/erase');const start=requests.length;
      await click(c,'confirm-erase');await held.wait();c.listFailure='http';await held.release('disconnect');
      const message=await c.eval("$('status').textContent");assert.match(message,/unknown|could not be confirmed/i);assert.doesNotMatch(message,/revision \d+ is retained/i);
      assert.equal(requests.slice(start).filter(r=>r.path.endsWith('/erase')).length,1,'never retry erasure');
      await click(c,'refresh-list');await settled(c);assert.match(await c.eval("$('erase-outcome').textContent"),/unknown|could not be confirmed/i,'list absence cannot confirm deletion');
      await click(c,'erase-reconcile');await settled(c);assert.match(await c.eval("$('erase-outcome').textContent"),/confirmed.*erased|erasure confirmed/i);
    });
    await check('H10 new manuscript in a saved work has local provenance',async()=>{
      await replaceRuntime();await create();await click(c,'new-authored');await settled(c);
      assert.doesNotMatch(await c.eval("$('authored-state').textContent"),/Read from saved revision/);
      await set(c,'authored-text','Original manuscript\n');await click(c,'save');await saved(c,2);await settled(c);
      assert.match(await c.eval("$('authored-state').textContent"),/Read from saved revision 2/);
      await set(c,'authored-text','Edited manuscript\n');assert.match(await c.eval("$('authored-state').textContent"),/Unsaved/);
    });
    await check('H10 same-name local bytes, save and exact reopening',async()=>{
      await replaceRuntime();await create();await click(c,'new-authored');await settled(c);await set(c,'authored-text','Saved original');await click(c,'save');await saved(c,2);await settled(c);
      await c.eval("$('file-selection').querySelector('button').click()");
      const text='\uFEFFLocal replacement\r\nOriginal bytes\r\n',file=path.join(root,'manuscript.txt');await writeFile(file,text);
      await pick('work-files',file);await settled(c);await set(c,'authored-file','manuscript.txt');await click(c,'open-authored');await settled(c);
      assert.doesNotMatch(await c.eval("$('authored-state').textContent"),/Read from saved revision/);
      assert.equal(Buffer.from(await c.eval('selectedFiles[0].data'),'base64').toString(),text);
      await click(c,'save');await saved(c,3);await settled(c);
      assert.match(await c.eval("$('authored-state').textContent"),/Read from saved revision 3/);
      assert.equal(await c.eval('fileText(selectedFiles[0],saved)'),text);
      await set(c,'authored-text','Edited local replacement');assert.match(await c.eval("$('authored-state').textContent"),/Unsaved/);
    });
    await check('H9 exact failed/present reads and ordinary stale-head refusal',async()=>{
      await replaceRuntime();await create();const id=await c.eval('work');
      c.beforeRequest={path:'/api/work/'+id+'/erase',method:'POST',unavailable:true};
      await click(c,'erase');await click(c,'confirm-erase');await settled(c);
      assert.match(await c.eval("$('erase-outcome').textContent"),/unknown/);
      c.beforeRequest={path:'/api/work/'+id,method:'GET',unavailable:true};await click(c,'erase-reconcile');await settled(c);
      assert.match(await c.eval("$('erase-outcome').textContent"),/unknown.*read failed/);
      c.beforeRequest={path:'/api/work/'+id,method:'GET',response:{status:404,error:'work_unavailable'}};await click(c,'erase-reconcile');await settled(c);
      assert.match(await c.eval("$('erase-outcome').textContent"),/unknown/);assert.doesNotMatch(await c.eval("$('erase-outcome').textContent"),/Erasure confirmed/);
      await click(c,'erase-reconcile');await settled(c);assert.match(await c.eval("$('erase-outcome').textContent"),/revision 1 exists at this read/);
      await click(c,'erase');
      await c.eval("(async()=>{const draftValue=draft();draftValue.definition.goal='Concurrent saved work';const t=await api('/api/work/'+work+'/ticket',{expected:binding(saved),...draftValue});await api('/api/work/'+work+'/save',{ticket:t.ticket,...draftValue});})()");
      const start=requests.length;await click(c,'confirm-erase');await settled(c);assert.match(await c.eval("$('erase-outcome').textContent"),/Erase was refused/);
      await click(c,'erase-reconcile');await settled(c);assert.match(await c.eval("$('erase-outcome').textContent"),/revision 2 exists at this read/);
      await click(c,'erase');assert.equal(await c.eval("$('erase-confirm').hidden"),true,'old cached revision cannot authorize another attempt');
      assert.equal(requests.slice(start).filter(r=>r.path.endsWith('/erase')).length,1);
      await click(c,'refresh-work');await settled(c);await click(c,'erase');await click(c,'confirm-erase');await settled(c);
      assert.match(await c.eval("$('erase-outcome').textContent"),/Erasure confirmed/);assert.equal(await c.eval("$('editor').hidden"),true);
    });
    await check('H7 late scene body, loaded lineage and scene selection input',async()=>{
      await replaceRuntime();await create();await click(c,'new-authored');await settled(c);await set(c,'authored-text','Saved source');await click(c,'save');await saved(c,2);await settled(c);
      await click(c,'scene-new');await set(c,'scene-title','First scene');await set(c,'scene-viewpoint','Narrator');await set(c,'authored-text','First scene body');await click(c,'save');await saved(c,3);await settled(c);
      const first=await c.eval('activeScene.id');const suffix=await c.eval("'/files/'+saved.revision+'/'+saved.fingerprint.slice(7)+'/'+saved.files.findIndex(f=>f.name===sceneFile)");
      const held=await barrier(c,suffix);await click(c,'refresh-work');await held.wait();await set(c,'authored-text','Newer source body');await held.release();
      assert.equal(await c.eval("$('authored-text').value"),'Newer source body');assert.equal(await c.eval('sceneBook.scenes[0].id'),first);assert.equal(await c.eval('dirty'),true);
      await click(c,'save');await saved(c,4);await settled(c);await click(c,'scene-new');await set(c,'scene-title','Second scene');await set(c,'authored-text','Second scene body');await click(c,'save');await saved(c,5);await settled(c);
      assert.equal(await c.eval('sceneBook.scenes.length'),2);
      // Native select popups do not accept this headless CDP key driver on macOS.
      // Dispatch the ordinary selection input in the rendered control; this is
      // handler/browser coverage, not a claim of physical keyboard testing.
      await set(c,'scene-choice',first);
      await click(c,'scene-open');assert.equal(await c.eval('activeScene.id'),first);assert.equal(await c.eval('dirty||sceneModified'),false);
      const originalBody=await c.eval("$('authored-text').value"),source=await c.eval("'/files/'+saved.revision+'/'+saved.fingerprint.slice(7)+'/'+saved.files.findIndex(f=>f.name==='manuscript.txt')");
      await set(c,'authored-file','manuscript.txt');const reading=await barrier(c,source);await click(c,'open-authored');await reading.wait();await click(c,'add-note');await reading.release();
      assert.equal(await c.eval("$('authored-text').value"),originalBody);assert.equal(await c.eval("$('authored-text').disabled"),false);assert.doesNotMatch(await c.eval("$('authored-state').textContent"),/Reading exact/);
      await c.eval("$('scene-add-proposal').closest('details').open=true");await click(c,'scene-add-proposal');await click(c,'scene-add-proposal');assert.equal(await c.eval("document.activeElement===$('scene-proposals').lastElementChild.querySelector('[data-scene-field=kind]')"),true);
      assert.deepEqual(await c.eval("[...document.querySelectorAll('[data-scene-remove]')].map(b=>b.textContent)"),['Remove proposed change 1','Remove proposed change 2']);
      await c.eval("$('scene-proposals').lastElementChild.querySelector('[data-scene-remove]').click()");assert.equal(await c.eval("document.activeElement===$('scene-proposals').firstElementChild.querySelector('[data-scene-remove]')"),true);
      const workId=await c.eval('work'),sceneSuffix=await c.eval("'/files/'+saved.revision+'/'+saved.fingerprint.slice(7)+'/'+saved.files.findIndex(f=>f.name===sceneFile)");
      const reloading=await barrier(c,sceneSuffix);await click(c,'refresh-work');await reloading.wait();
      await click(c,'new-work');assert.equal(await c.eval('work'),workId,'navigation serializes behind the exact saved-file read');await reloading.release();
      await click(c,'new-work');await settled(c);assert.equal(await c.eval('work===null&&sceneBook===null&&activeScene===null'),true);
      const lost=await barrier(c,sceneSuffix);await c.eval("$('work-list').querySelector('button').click()");await lost.wait();
      c.accessBoundary='challenge';await c.eval('api("/api/works").catch(e=>e.message)');assert.equal(await c.eval("accessLost&&sceneBook===null&&activeScene===null&&!$('editor')"),true);
      await lost.release();assert.equal(await c.eval("accessLost&&sceneBook===null&&activeScene===null&&!$('authored-text')"),true);

    });
    for(const operation of ['import','erase'])await check('H2/H6/H9 access loss invalidates late '+operation,async()=>{
      await replaceRuntime();if(operation==='erase')await create();else await pick('import-file',exportPath);
      const held=await barrier(c,operation==='erase'?'/erase':reconstructionRoute);
      if(operation==='erase')await click(c,'erase');await click(c,operation==='erase'?'confirm-erase':'import');await held.wait();
      c.accessBoundary='challenge';await c.eval('api("/api/works").catch(e=>e.message)');
      assert.equal(await c.eval("accessLost&&!$('editor')&&!$('erase-recovery')"),true);
      await held.release();assert.equal(await c.eval("accessLost&&work===null&&saved===null&&!$('editor')"),true);
    });
    await check('H3 repeated note controls identify their row and preserve focus',async()=>{
      await replaceRuntime();await click(c,'new-work');await settled(c);await click(c,'add-note');await click(c,'add-note');
      assert.equal(await c.eval("document.activeElement===$('notes').lastElementChild.querySelector('textarea')"),true);
      const names=await c.eval("[...document.querySelectorAll('.note-heading button')].map(b=>b.getAttribute('aria-label')||b.textContent)");assert.equal(new Set(names).size,2);
      await c.eval("$('notes').lastElementChild.querySelector('button').click()");assert.equal(await c.eval("document.activeElement===$('notes').firstElementChild.querySelector('button')"),true);
    });
    await check('H2 cancelled voluntary logout retains the draft',async()=>{
      await set(c,'goal','Retained after cancelled logout');accept=false;await click(c,'signout');await wait(()=>c.eval("$('status')?.textContent.includes('Sign out cancelled')"),'cancel logout');
      assert.equal(await c.eval("$('goal').value"),'Retained after cancelled logout');assert.equal(await c.eval('accessLost'),false);accept=true;
    });
    await check('H1 rendered boundaries and keyboard focus',async()=>{
      await checkControlBoundaryContrast(expression=>c.eval(expression),'#goal');
      await c.eval("$('goal').focus()");await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await c.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
      assert.equal(await c.eval("document.activeElement.id"),'criteria');
      assert.equal(await c.eval("getComputedStyle(document.activeElement).outlineStyle"),'solid');
    });
    await check('H1 error semantics and small-viewport general errors',async()=>{
      await replaceRuntime();await click(c,'new-work');await settled(c);await set(c,'goal','Required criterion');await click(c,'save');
      assert.equal(await c.eval("$('criteria').getAttribute('aria-invalid')"),'true');assert.equal(await c.eval("$('criteria-error').hidden"),false);
      for(const width of [320,390,720,1280]){
        await c.send('Emulation.setDeviceMetricsOverride',{width,height:760,deviceScaleFactor:1,mobile:width<720});
        await c.eval("$('authored-material').open=true");await set(c,'authored-name','invalid-name');await c.eval("$('new-authored').scrollIntoView({block:'center'})");await click(c,'new-authored');await settled(c);
        assert.equal(await c.eval("document.activeElement.id"),'status');
        const observation=await c.eval("(()=>{const r=$('status').getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:innerHeight,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).map(e=>e.id||e.tagName).slice(0,12)};})()");console.log(JSON.stringify({general_error_viewport:{width,...observation}}));
        assert(observation.top>=-1&&observation.bottom<=observation.height+1&&observation.scrollWidth<=observation.width,'visible general error without horizontal overflow at '+width);
      }
    });
  } finally {accept=true;await replaceRuntime();c.handlers.splice(c.handlers.indexOf(dialogs),1);}
  assert.deepEqual(failures,[],'rendered draft safety failures');
}
