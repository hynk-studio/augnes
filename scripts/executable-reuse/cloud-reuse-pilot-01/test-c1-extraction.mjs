// Offline renderer/DOM controls only: no Worker, authentication or reconstruction.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderContext } from '../../../apps/web_planning/src/page.ts';
import { CDP, extractContextDom, contextFieldObservations, requireContextFields, continuationPaths } from './c1-judgment.mjs';
import { createCanonicalTestResourceRoot, buildCanonicalChildEnvironment, cleanupCanonicalTestResources } from '../../canonical-test-environment.mjs';
import { runCanonicalChild, canonicalChildAcceptanceFailure } from '../../canonical-child-runner.mjs';
import { registerOwnedChild, terminateOwnedProcessTree } from '../../test-harness-process-lifecycle.mjs';
import { availablePort } from '../../web-planning-local-runtime.mjs';
import { capture, writeJson, portClosed, cleanupReport, processGroupsAbsent } from './pilot-evidence.mjs';
import { pilotArguments, unsandboxedPilotFlag } from './preparation.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../../..');
const args=process.argv.slice(2),child=args[0]==='--child';if(child)args.shift();const options=pilotArguments(args),output=path.resolve(options.output);
if(!child){
  await mkdir(output,{recursive:false});const owner=createCanonicalTestResourceRoot('ag-suite-');for(const n of ['home','runtime-state'])await mkdir(path.join(owner.root,n));
  const stdout=capture(),stderr=capture(),logs=capture();let result,pid;
  try{result=await runCanonicalChild({suite:'cloud-reuse-pilot-01-C1',label:'offline-extraction-controls',command:process.execPath,args:['--import','tsx',fileURLToPath(import.meta.url),'--child',output,...(options.unsandboxed?[unsandboxedPilotFlag]:[])],cwd:repo,env:buildCanonicalChildEnvironment({temporaryRoot:owner.root,resourceRoot:owner.root}),resourceOwner:owner,timeoutMs:60000,stdout,stderr,log:s=>logs.write(Buffer.from(s+'\n')),onSpawn:x=>{pid=x;}});}
  finally{const independent=await processGroupsAbsent([pid]);const fixture=JSON.parse(await readFile(path.join(output,'fixture-cleanup.json'),'utf8'));const safe=independent.available&&independent.known_groups_absent&&fixture.independent_cleanup.available&&fixture.independent_cleanup.known_groups_absent&&fixture.failures.length===0;const removed=safe?cleanupCanonicalTestResources([owner]):[];
    await writeJson(path.join(output,'lifecycle.json'),{result,stdout:stdout.record(),stderr:stderr.record(),runner_logs:logs.record(),independent_cleanup:independent,disposable_resources_removed:safe&&removed.every(x=>x.completed)});assert(safe&&removed.every(x=>x.completed));}
  assert.equal(canonicalChildAcceptanceFailure(result,{requireNaturalExit:true}),null);console.log(await readFile(path.join(output,'controls.json'),'utf8'));
}else{
  const owned=new Set(),clients=[];let browser,debug;
  try{
    debug=await availablePort();const c=spawn('/usr/bin/chromium',['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-component-update','--disable-default-apps','--disable-domain-reliability','--disable-extensions','--disable-sync','--metrics-recording-only','--no-pings','--password-store=basic','--use-mock-keychain',...(options.unsandboxed?['--no-sandbox']:[]),'--remote-debugging-address=127.0.0.1',`--remote-debugging-port=${debug}`,`--user-data-dir=${path.join(process.env.AUGNES_CANONICAL_TEMP_ROOT,'profile')}`,'about:blank'],{stdio:['ignore','ignore','pipe'],detached:true});
    browser=registerOwnedChild(owned,c,{label:'C1-offline-DOM-controls'});c.stderr.on('data',()=>{});
    const end=Date.now()+15000;while(true){try{if((await fetch(`http://127.0.0.1:${debug}/json/version`)).ok)break;}catch(e){if(e.cause?.code!=='ECONNREFUSED')throw e;}assert(Date.now()<end);await new Promise(r=>setTimeout(r,80));}
    const target=await (await fetch(`http://127.0.0.1:${debug}/json/new?about:blank`,{method:'PUT'})).json();const connection=await new CDP(target.webSocketDebuggerUrl).open();clients.push(connection);await connection.send('Runtime.enable');const page={evaluate:s=>connection.eval(s),setContent:html=>connection.eval(`document.body.innerHTML=${JSON.stringify(html)}`)};
    const source=(ref,text)=>({source_ref:ref,why_included:'escaped & <title>',bounded_summary:text,trust_class:'untrusted',compatibility_source_ref:{external_id:'synthetic & <attribution>'},external_ref:{observed_at:'2026-01-01T00:00:00Z'}});
    const current={work_id:'synthetic-work',workspace_id:'synthetic-workspace',project_id:'synthetic-project',author_ref:'synthetic-author',fingerprint:'sha256:synthetic-fingerprint',predecessor:'synthetic-predecessor',format:'synthetic-format',compatibility:'synthetic-compatibility',recorded_at:'2026-01-01T00:00:00Z',revision:4,definition:{goal:'escaped & <goal>',success_criteria:['one & two','line\n  spacing'],non_goals:['no new solver']},sources:[source('synthetic-ref-1',`A & < > " '\n  repeated   spaces`),source('synthetic-ref-2','second summary')],relations:{origin:null,review:null,materials:[{source_ref:'synthetic-ref-1',kind:'authored',from:null,dependencies:['synthetic-ref-2']}]},files:[{name:'escaped & file.json',bytes:1234,digest:'sha256:synthetic-file',role:'results'}]};
    const load=()=>page.setContent('<div id="context-view">'+renderContext(current)+'</div>');const extract=()=>page.evaluate(extractContextDom.toString()?`(${extractContextDom.toString()})(document.getElementById('context-view'))`:'');const cases=[];
    const compare=async(name,negative=false)=>{const dom=await extract(),fields=contextFieldObservations(dom,current);await writeJson(path.join(output,'last-field-observation.json'),{name,negative,fields});if(negative){assert.throws(()=>requireContextFields(fields));cases.push({name,kind:'deliberate negative',rejected:true,failed_checks:fields.filter(f=>!f.match).map(f=>f.check_id)});}else{requireContextFields(fields);cases.push({name,kind:'positive',field_count:fields.length,disclosures:dom.disclosures});}return dom;};
    await load();const first=await compare('collapsed disclosures; exact escaped text and whitespace');assert(first.disclosures.some(d=>d.before_ref_visible===false&&d.after_ref_visible===true));
    await compare('already expanded disclosures');
    for(const [name,script] of [
      ['missing source ref',"document.querySelector('.context-note details code').remove()"],
      ['swapped source refs',"(()=>{const x=[...document.querySelectorAll('.context-note details code')];const a=x[0].textContent;x[0].textContent=x[1].textContent;x[1].textContent=a;})()"],
      ['altered summary',"document.querySelector('.note-text').textContent='altered'"],
      ['missing summary',"document.querySelector('.note-text').remove()"],
      ['wrong revision',"document.querySelector('article').dataset.revision='9'"],
      ['wrong fingerprint',"document.querySelector('article').dataset.fingerprint='wrong'"],
      ['missing file',"document.querySelector('[data-file-url]').remove()"],
      ['wrong file digest',"document.querySelector('[data-file-url]').dataset.fileDigest='wrong'"],
      ['wrong file bytes',"document.querySelector('[data-file-url]').dataset.fileBytes='1'"],
      ['wrong file name',"document.querySelector('[data-file-url]').dataset.fileName='wrong'"],
      ['wrong file URL',"document.querySelector('[data-file-url]').dataset.fileUrl='/wrong'"],
      ['wrong attribution',"document.querySelector('.context-note dd').textContent='wrong'"],
      ['missing dependency declaration',"(()=>{const d=[...document.querySelectorAll('article>details')].find(x=>x.querySelector('summary').textContent==='Material provenance and required context');d.querySelector('p').remove();})()"],
      ['missing note',"document.querySelector('.context-note').remove()"]
    ]){await load();await page.evaluate(script);await compare(name,true);}
    const bundle=path.join(here,'c1-01/continuation-01');for(const op of ['read','save']){const p=continuationPaths(bundle,op);assert.equal(p.output,path.join(bundle,op));assert.equal(p.checkpoint,path.join(bundle,'checkpoint.json'));assert.equal(p.judgment,path.join(bundle,'b3-judgment.json'));assert.equal(p.result,path.join(bundle,'save/result.json'));}assert.throws(()=>continuationPaths(path.join(here,'c1-01'),'read'));
    await writeJson(path.join(output,'controls.json'),{result:'PASS',scope:'offline pinned-renderer DOM fixtures; no Worker/login/reconstruction',positive_count:2,negative_count:14,cases,continuation_path_binding:'read/save/checkpoint/judgment/result share explicit continuation; old root rejected'});
  }finally{const cleanup=await cleanupReport({clients,browser,debug,owned},{terminate:terminateOwnedProcessTree,portClosed});const independent=await processGroupsAbsent(browser?[browser.pid]:[]);await writeJson(path.join(output,'fixture-cleanup.json'),{...cleanup,independent_cleanup:independent});assert.deepEqual(cleanup.failures,[]);assert(independent.available&&independent.known_groups_absent);}
}
