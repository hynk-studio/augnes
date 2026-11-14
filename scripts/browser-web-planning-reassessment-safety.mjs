import { settleWebPlanningBrowser } from './web-planning-browser-observation.mjs';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { startLocal } from './web-planning-local-runtime.mjs';

// Real file selection, keyboard input, Chrome unload dialogs and server replies.
// The ordinary browser owner supplies bounded lifetime/cleanup; no mock writer.
export async function browserReassessmentSafety({c,seed,root,newPage,login,click,set,settled,wait,navigate,barrier,checks,requests,observe=async(name,run)=>run(),failure=()=>{}}) {
  const failures=[], observations=[];
  async function check(name,fn) {
    try { const evidence=await observe('reassessment.case.'+name,fn); observations.push({name,result:'PASS',...evidence}); }
    catch(e) { failures.push(e);observations.push({name,result:'FAIL',error:e.message});failure('reassessment.case.'+name,e); }
  }
  async function open(id=seed.b.work_id) {
    await c.eval(`openWork(${JSON.stringify(id)})`);await settled(c);
    await c.eval("[...$('exchange-list').querySelectorAll('button')].find(b=>b.textContent==='Reconsider current use').click()");await settled(c);
    assert.equal(await c.eval('reassessmentEdited'),false);
  }
  async function type(text) {
    await c.eval("$('reassessment-reason').focus()");
    await c.send('Input.insertText',{text});
  }
  // Both outcomes complete naturally, including the defect case. A known saved
  // operation is resolved before the next case; no draft masks pending recovery.
  for(const outcome of ['acknowledged','unknown']) await check('ordinary save '+outcome,async()=>{
    await open();await set(c,'goal','Operational readiness: '+outcome);
    const before=await c.eval('saved'),held=await barrier(c,'/save');
    await click(c,'save');await held.wait();await type('Typed during ordinary save');
    const during=await c.eval("({text:$('reassessment-reason').value,disabled:$('reassessment-reason').matches(':disabled')})");
    await held.release(outcome==='unknown'?'disconnect':undefined);
    const after=await c.eval("({text:$('reassessment-reason').value,pending:!!pending,disabled:$('reassessment-reason').matches(':disabled')})");
    if(outcome==='unknown') {
      // On the predecessor, dismiss the newly authored draft explicitly so the
      // failed observation cannot prevent this exact ordinary operation settling.
      if(!after.disabled) {
        const accept=m=>{if(m.method==='Page.javascriptDialogOpening')void c.send('Page.handleJavaScriptDialog',{accept:true});};
        c.handlers.push(accept);try {await click(c,'reassessment-close');await settled(c);}finally{c.handlers.splice(c.handlers.indexOf(accept),1);}
      }
      const failedRead=await barrier(c,'/resolve');await click(c,'resolve-save');await failedRead.wait();await failedRead.release('unavailable');
      const stillPending=await c.eval('!!pending');
      if(during.disabled) {
        await type('Must stay locked after failed resolution');
        assert(await c.eval("$('reassessment-reason').matches(':disabled')&&$('reassessment-reason').value===''"));
      }
      assert(stillPending,'unavailable resolution must retain the exact ordinary save');
      await click(c,'resolve-save');await settled(c);
    }
    const saved=await c.eval('saved');assert.equal(saved.revision,before.revision+1);assert.equal(await c.eval('pending'),null);
    assert.deepEqual(saved.files,before.files);assert.deepEqual(saved.return_reassessment,before.return_reassessment);
    console.log(JSON.stringify({reassessment_save_lifetime:{outcome,during,after,settled_revision:saved.revision}}));
    assert(during.disabled&&during.text==='', 'new reassessment authoring was accepted during ordinary Save and can be erased by acknowledgement');
    if(outcome==='unknown')assert(after.disabled,'unknown save must keep reassessment authoring locked until exact settlement');
    return {during,after,revision:saved.revision};
  });

  for(const state of ['edited','prepared']) await check('real reload warning '+state,async()=>{
    await open();
    if(state==='prepared') {
      await click(c,'reassessment-list');await settled(c);await set(c,'reassessment-work',seed.e.work_id);
      await click(c,'reassessment-files');await settled(c);
      const pick=await c.eval("[...$('reassessment-evidence').options].find(o=>o.textContent.includes('README.md')).value");
      await set(c,'reassessment-evidence',pick);await click(c,'reassessment-inspect');await settled(c);
      for(const [id,value] of Object.entries({'reassessment-decision':'retained','reassessment-reason':'Keep the independent operational hold.','reassessment-limits':'No deployment authority.','reassessment-context':'Operational hold unchanged.','reassessment-next':'Obtain authorized operational observations.'}))await set(c,id,value);
      await click(c,'reassessment-preview-button');await settled(c);assert(await c.eval('!!reassessmentPrepared'));
    } else await type('An unsubmitted consumer judgment');
    // A real keyboard event supplies Chrome sticky user activation. Script-only
    // beforeunload events cannot prove that reload/close would show a warning.
    await c.eval("$('reassessment-reason').focus()");
    await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowLeft',code:'ArrowLeft',windowsVirtualKeyCode:37});
    await c.send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowLeft',code:'ArrowLeft',windowsVirtualKeyCode:37});
    const before=await c.eval("({text:$('reassessment-reason').value,prepared:!!reassessmentPrepared,dirty,pending:!!pending,returnEdited,exchangeDraft:!!exchangeDraft})");
    assert.equal(before.dirty,false);assert.equal(before.pending,false);assert.equal(before.returnEdited,false);assert.equal(before.exchangeDraft,false);
    const oldLoader=(await c.send('Page.getFrameTree')).frameTree.frame.loaderId;
    let dialog=null;
    const observe=m=>{if(m.method==='Page.javascriptDialogOpening'){dialog=m.params;void c.send('Page.handleJavaScriptDialog',{accept:false});}};
    c.handlers.push(observe);
    try {
      await c.send('Page.reload');
      await wait(async()=>!!dialog||((await c.send('Page.getFrameTree')).frameTree.frame.loaderId!==oldLoader&&await c.eval("document.readyState==='complete'")),'reload warning or completed navigation');
    }finally{c.handlers.splice(c.handlers.indexOf(observe),1);}
    const after=await c.eval("({text:$('reassessment-reason').value,prepared:!!reassessmentPrepared})");
    // Clean the draft using its actual close control, whether or not reload won.
    const accept=m=>{if(m.method==='Page.javascriptDialogOpening')void c.send('Page.handleJavaScriptDialog',{accept:true});};
    c.handlers.push(accept);try {await click(c,'reassessment-close');await settled(c);}finally{c.handlers.splice(c.handlers.indexOf(accept),1);}
    console.log(JSON.stringify({reassessment_unload:{state,before,dialog:dialog?.type??null,after}}));
    assert.equal(dialog?.type,'beforeunload','Chrome reload did not warn about an unsubmitted consumer draft');
    assert.equal(after.text,before.text);assert.equal(after.prepared,before.prepared);
    return {dialog:dialog.type,state};
  });

  await check('access loss during real journal transaction',async()=>{
    await open(seed.recovery.work_id);
    await click(c,'reassessment-list');await settled(c);await set(c,'reassessment-work',seed.e.work_id);
    await click(c,'reassessment-files');await settled(c);
    const pick=await c.eval("[...$('reassessment-evidence').options].find(o=>o.textContent.includes('README.md')).value");
    await set(c,'reassessment-evidence',pick);await click(c,'reassessment-inspect');await settled(c);
    for(const [id,value] of Object.entries({'reassessment-decision':'retained','reassessment-reason':'Keep the operational hold after explicit recovery.','reassessment-limits':'No activation.','reassessment-context':'The durable operation survives loss of this view.','reassessment-next':'Obtain authorized operational observations.'}))await set(c,id,value);
    await click(c,'reassessment-preview-button');await settled(c);
    const prepared=await c.eval('reassessmentPrepared'),revision=await c.eval('saved.revision'),origin=await c.eval('location.origin'),start=requests.length;
    // An owned, read-only keepalive in a real readwrite transaction blocks the
    // journal's later transaction. No journal method or stored body is mocked.
    await c.eval(`(async()=>{
      const db=await new Promise((ok,no)=>{const q=indexedDB.open('augnes-participant-drafts',1);q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error);});
      const original=IDBDatabase.prototype.transaction,tx=db.transaction('drafts','readwrite'),store=tx.objectStore('drafts');
      window.journalGate={release:false,queued:0,completed:0,closed:false,error:null};
      const close=()=>{if(journalGate.closed)return;db.close();IDBDatabase.prototype.transaction=original;journalGate.closed=true;};
      tx.addEventListener('complete',close);tx.addEventListener('abort',()=>{journalGate.error=tx.error?.name??'aborted';close();});
      tx.addEventListener('error',()=>{journalGate.error=tx.error?.name??'transaction_error';close();});
      IDBDatabase.prototype.transaction=function(...args){const t=original.apply(this,args);if(this.name==='augnes-participant-drafts'&&args[1]==='readwrite'){journalGate.queued++;t.addEventListener('complete',()=>journalGate.completed++);}return t;};
      function keep(){const q=store.get('__owned_readonly_barrier__');q.onsuccess=()=>{if(!journalGate.release)keep();};}keep();
    })()`);
    let journalPrimary;
    try {
      await click(c,'reassessment-save');await wait(()=>c.eval('journalGate.queued===1&&busy'),'real journal put queued');
      assert.equal(await c.eval('journalGate.completed'),0);
      const reason=await c.eval("$('reassessment-reason').value");await type('Must not replace the journaled operation');
      assert.equal(await c.eval("$('reassessment-reason').matches(':disabled')&&reassessmentJournalActive"),true);
      assert.equal(await c.eval("$('reassessment-reason').value"),reason);
      assert.equal(await c.eval('JSON.stringify(reassessmentPrepared)'),JSON.stringify(prepared));
      await c.send('Network.clearBrowserCookies');
      assert.equal(await c.eval("request('/api/works').then(()=>null,e=>e.message)"),'access_denied');
      assert.equal(await c.eval('accessLost&&work===null&&reassessmentPrepared===null&&reassessmentPending===null&&reassessmentRows.length===0'),true);
    } catch(e){journalPrimary=e;failure('reassessment.journal',e);throw e;} finally {
      // Release even when an assertion fails; wait for the actual transaction's
      // finalizer before check() proceeds to another case.
      try{await c.eval('journalGate.release=true');await wait(()=>c.eval('journalGate.closed'),'owned journal barrier closes');}
      catch(cleanup){if(journalPrimary)throw new AggregateError([journalPrimary,cleanup],'journal case and owned barrier cleanup failed');throw cleanup;}
    }
    assert.equal(await c.eval('journalGate.error'),null);
    await settled(c);await wait(()=>c.eval('journalGate.closed&&journalGate.completed===1'),'journal completion and owned barrier close');
    assert.equal(await c.eval('!busy&&!workChangeActive&&!reassessmentJournalActive&&accessLost&&work===null&&reassessmentView===null&&reassessmentPrepared===null&&reassessmentPending===null&&reassessmentRows.length===0&&!$("reassessment-fields")'),true);
    assert.match(await c.eval("$('status').textContent"),/Access is unavailable/);
    assert.equal(requests.slice(start).filter(r=>r.path.endsWith('/reassessment-save')).length,0,'late journal completion cannot dispatch a save');
    await login(c,origin);await c.eval(`openWork(${JSON.stringify(prepared.work_id)})`);await settled(c);
    assert.equal(await c.eval('saved.revision'),revision,'no append before authenticated recovery');
    assert.equal(await c.eval('JSON.stringify(reassessmentPending)'),JSON.stringify(prepared),'the exact durable journal body survives view disposal');
    await click(c,'reassessment-check');await settled(c);assert.equal(await c.eval("$('reassessment-retry').hidden"),false);
    assert.equal(requests.slice(start).filter(r=>r.path.endsWith('/reassessment-save')).length,0,'recovery read is not an automatic resend');
    await click(c,'reassessment-retry');await settled(c);
    assert.equal(await c.eval('saved.revision'),revision+1);assert.equal(await c.eval('reassessmentRows.length'),0);
    const saves=requests.slice(start).filter(r=>r.path.endsWith('/reassessment-save'));assert.equal(saves.length,1);
    const body=JSON.parse(saves[0].body);assert.equal(body.ticket,prepared.ticket);assert.deepEqual(body.intent,prepared.intent);
    const observed={before_revision:revision,after_revision:revision+1,real_transaction_completed:true,late_save_requests:0,explicit_recovery_save_requests:1,exact_journal_retained:true,active_state_cleared:true};
    console.log(JSON.stringify({reassessment_journal_access_loss:observed}));return observed;
  });

  // Produce both complete exports through their production owners. The branch
  // carries actual direction lineage; exports retain all historical file bodies.
  await c.eval(`openWork(${JSON.stringify(seed.a.work_id)})`);await settled(c);
  const original=await c.eval("api('/api/work/'+work+'/export')"),target=await c.eval('saved');
  await click(c,'branch-open');await set(c,'branch-reason','Preserve a separate preparation direction.');await click(c,'branch-preview');await settled(c);await click(c,'relation-save');await settled(c);
  const branch=await c.eval('saved');
  const direction=(await c.eval(`api('/api/work/${target.work_id}/direction-export',{expected:${JSON.stringify({revision:target.revision,fingerprint:target.fingerprint})},source:${JSON.stringify({work_id:branch.work_id,revision:branch.revision,fingerprint:branch.fingerprint})}})`)).recovery;
  const legacy=await c.eval(`api('/api/work/${seed.e.work_id}/export')`);
  assert.equal(original.format,'web_planning_export.v0.9');assert(direction.works.some(w=>w.format==='web_planning_export.v0.9'));assert.notEqual(legacy.format,original.format);
  // Valid JSON whitespace isolates the browser file-size dispatch boundary
  // without fabricating historical records or inflating product file content.
  for(const [name,value,padding,route] of [
    ['v09-standalone',original,0,'/api/reconstruct-exchange'],
    ['v09-standalone-budget',original,1500001,'/api/reconstruct-exchange'],
    ['v09-directions',direction,0,'/api/reconstruct-directions'],
    ['v09-directions-budget',direction,3000001,'/api/reconstruct-directions'],
    ['legacy',legacy,0,'/api/reconstruct-files'],
  ]) await check('file picker import '+name,async()=>{
    const local=await observe('import.'+name+'.runtime_setup',()=>startLocal({root:path.join(root,'import-'+name)}));let dest,primary;
    try {
      dest=await observe('import.'+name+'.page',()=>newPage(local.origin));await observe('import.'+name+'.login',()=>login(dest,local.origin));
      const file=path.join(root,name+'.json');await writeFile(file,JSON.stringify(value)+' '.repeat(padding),{mode:0o600});
      const {root:doc}=await dest.send('DOM.getDocument');const {nodeId}=await dest.send('DOM.querySelector',{nodeId:doc.nodeId,selector:'#import-file'});
      await dest.send('DOM.setFileInputFiles',{nodeId,files:[file]});
      const start=requests.length;await observe('import.'+name+'.settlement',async()=>{await click(dest,'import');await settled(dest);});
      const observed=requests.slice(start).filter(r=>r.path.startsWith('/api/reconstruct')).map(r=>r.path),status=await dest.eval("$('status').textContent");
      console.log(JSON.stringify({reassessment_import:{name,format:value.format,padding,observed,status}}));
      await observe('import.'+name+'.route_assertion',async()=>assert.deepEqual(observed,[route],'ordinary import must use the compatible bounded route'));
      const works=value.works??[value];for(const expected of works){
        await observe('import.'+name+'.history_assertion',async()=>{const actual=await dest.eval(`api('/api/work/${expected.revisions[0].work_id}/export')`);assert.deepEqual(actual,expected,'complete historical bytes and lineage survive browser reconstruction');});
      }
      await observe('import.'+name+'.access_assertion',async()=>assert.equal((await local.db.prepare('SELECT count(*) n FROM web_planning_participation WHERE revoked_at IS NULL').first()).n,0,'history cannot create live access'));
      return {format:value.format,route,padding,historical_exports_equal:true};
    } catch(error){primary=error;failure('import.'+name+'.body',error);throw error;}
    finally{await settleWebPlanningBrowser({primary,observe,steps:[
      ...(dest?[{name:'import.'+name+'.navigation',run:()=>navigate(dest,'about:blank')}]:[]),
      {name:'import.'+name+'.dispose',run:()=>local.close()},
    ]});}
  });
  console.log(JSON.stringify({reassessment_browser_safety:observations}));
  if(failures.length)throw new AggregateError(failures,'consumer browser safety regressions: '+failures.length);
  checks.push('Consumer browser safety: genuine v0.9 and old-format file-picker imports, direction history and bounded sizes; delayed ordinary Save/unknown resolution input lock; real edited/prepared unload dialogs; late real journal completion after access loss preserves exact authenticated recovery');
}
