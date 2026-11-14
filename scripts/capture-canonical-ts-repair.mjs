// Focused evidence collector only. No preparation, admission, receipt, stock,
// authority record or physical attempt is created by this module.
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { closeSync, constants, fstatSync, ftruncateSync, openSync, writeSync, existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { digest, observeInputFile, classifyInputChange, nonFaultInputChange, observeCanonicalRuntimeInputs, validCanonicalRuntimeInputs, observePreparedDependencyInputs, preparedDependencyIdentity, comparePreparedDependencyInputs } from "./local-canonical-inputs.mjs";
import { revisionArtifact } from "./local-canonical-attempts.mjs";
import { verifyGitSourceRepair, MATERIAL_SOURCE_CORRECTION, GUIDE_REPAIR_DRIVER, GUIDE_REPAIR_MODULE, GUIDE_REPAIR_FIXTURES,
  GUIDE_REPAIR_SCOPE, validateGuideRepairOutcome } from "./local-canonical-git-observation.mjs";
import { observeGitRevisionTarget } from "./run-local-canonical-verification.mjs";
import { readReceiptFile, verifyReceiptIntegrity } from "./local-canonical-receipt.mjs";
import { runCanonicalChild } from "./canonical-child-runner.mjs";
import { createCanonicalTestResourceRoot, beginCanonicalTestResourceUse, settleCanonicalTestResourceUse, cleanupCanonicalTestResources, buildCanonicalChildEnvironment } from "./canonical-test-environment.mjs";
import { acquireCheckoutVerificationOwnership, assertCheckoutVerificationOwnership, releaseCheckoutVerificationOwnership } from "./local-canonical-checkout-ownership.mjs";
import { admitVerificationContext, inspectVerificationCompanionPreservation } from "./local-canonical-verification-context.mjs";
import { selectBrowserPath, assertSelectedBrowser, assertBrowserBundle } from "./local-canonical-browser-input.mjs";
import { parseBrowserUseLine, validBrowserUse } from "./local-canonical-browser-identity.mjs";

export const TS_REPAIR_DRIVER = "scripts/test-project-client-browser.ts";
export const TS_REPAIR_MODULE = "scripts/result-work-draft-browser-checks.ts";
export const TS_REPAIR_FIXTURES = [TS_REPAIR_DRIVER,"scripts/result-draft-capture-scheduler.mjs","scripts/browser-evaluation-diagnostic.mjs","scripts/capture-canonical-ts-repair.mjs"];
const now = () => new Date().toISOString();
const gitAt = root => (args, options={}) => execFileSync("git",["--no-replace-objects",...args],{cwd:root,timeout:30_000,maxBuffer:128*1024*1024,...options});
const text = (git,...args) => git(args).toString().trim();
const settled = r => r?.exit_observed===true && r.streams_closed===true && r.cleanup_completed===true && r.remaining_owned_processes===0;

// Original Git blobs, in Git order. Batch reads avoid thousands of subprocesses;
// the focused predicate still determines which bytes belong to each side.
export function captureGitCatalogue(git, head) {
  const raw=git(["ls-tree","-rz",head]);
  const entries=raw.toString().split("\0").filter(Boolean).map(line=>{
    const m=/^(100644|100755) blob ([a-f0-9]{40})\t([\w./\[\]-]+)$/u.exec(line);
    assert.ok(m && !m[3].split("/").includes(".."),"capture_catalogue_invalid");
    return {path:m[3],mode:m[1],oid:m[2]};
  });
  assert.equal(new Set(entries.map(e=>e.path)).size,entries.length);
  const oids=[...new Set(entries.map(e=>e.oid))],blobs=new Map();
  const batch=git(["cat-file","--batch"],{input:oids.join("\n")+"\n"});let offset=0;
  for(const oid of oids){const end=batch.indexOf(10,offset),[id,type,sizeText]=batch.subarray(offset,end).toString().split(" ");
    assert.equal(id,oid);assert.equal(type,"blob");const size=Number(sizeText),content=batch.subarray(end+1,end+1+size);
    assert.equal(content.length,size);assert.equal(batch[end+1+size],10);blobs.set(oid,content);offset=end+2+size;}
  assert.equal(offset,batch.length);
  return {raw,entries,blobs};
}
export function checkCaptureSource(root, catalogue, git, expectedHead, changedModule=false) {
  const started_at=now();
  assert.equal(text(git,"rev-parse","HEAD"),expectedHead,"capture_head_changed");
  assert.equal(text(git,"diff","--cached","--name-only"),"","capture_index_changed");
  assert.equal(text(git,"ls-files","--others","--exclude-standard"),"","capture_untracked_source");
  const changed=text(git,"diff","--name-only");
  assert.equal(changed,changedModule ? (typeof changedModule === "string" ? changedModule : TS_REPAIR_MODULE) : "","capture_unexpected_delta");
  for(const entry of catalogue) {
    const file=path.join(root,entry.path),s=lstatSync(file);
    assert.ok(s.isFile()&&!s.isSymbolicLink()&&s.nlink===1&&realpathSync(file)===file&&!(s.mode&0o022),"capture_unsafe_source:"+entry.path);
    assert.equal(s.mode&0o111?"100755":"100644",entry.mode,"capture_source_mode:"+entry.path);
    const bytes=readFileSync(file);
    assert.equal(bytes.length,entry.byte_size,"capture_source_size:"+entry.path);
    assert.equal(digest(bytes),entry.sha256,"capture_source_bytes:"+entry.path);
  }
  return {started_at,finished_at:now(),entries:catalogue.length,source_sha256:digest(catalogue)};
}
export function verifyCaptureDependencyProvenance(receipt, observation, root) {
  assert.ok(verifyReceiptIntegrity(receipt),"capture_dependency_receipt_integrity");
  const phase=receipt.phases.find(p=>p.id==="dependencies-root"),prepared=receipt.inputs.prepared_dependencies.find(p=>p.phase_id==="dependencies-root");
  assert.ok(phase?.status==="pass"&&phase.exit_status===0&&phase.command==="npm ci --no-audit --no-fund"&&
    phase.cleanup?.completed===true&&phase.cleanup.exit_observed===true&&phase.cleanup.streams_closed===true&&
    phase.cleanup.remaining_owned_processes===0&&phase.cleanup.termination_reason==="natural_exit"&&phase.timed_out===false,
    "capture_dependency_preparation_missing");
  assert.equal(observation.location_fingerprint,digest(path.join(root,"node_modules")));
  assert.ok(prepared?.unchanged===true&&prepared.error===null&&preparedDependencyIdentity(observation)&&
    comparePreparedDependencyInputs(prepared.before,prepared.after)==="unchanged"&&
    comparePreparedDependencyInputs(prepared.after,observation)==="unchanged","capture_dependency_provenance_mismatch");
  return {receipt_fingerprint:receipt.integrity.content_fingerprint,phase,prepared};
}

// Independent finalizers preserve the primary execution fault and still attempt
// safe cleanup/release after a restoration or observation refusal.
export function validateResultDraftCaptureOutcome(output, exit) {
  const rows=prefix=>output.split(/\r?\n/u).filter(line=>line.startsWith(prefix)).map(line=>JSON.parse(line.slice(prefix.length)));
  const schedules=rows("result_draft_capture_schedule ");
  assert.equal(schedules.length,1,"capture_schedule_missing");
  const before=schedules[0]?.before_cleanup,after=schedules[0]?.after_cleanup;
  assert.ok(before&&after&&before.hold_count===1&&before.cleanup_releases===0&&before.rejected_releases===0&&
    after.preparation_pending===false&&after.preview_pending===false,"capture_schedule_invalid");
  if(exit===1){
    assert.ok(before.preparation_pending===true&&before.editor_present===false&&before.boundary_releases===0&&after.cleanup_releases===1,
      "capture_red_boundary_invalid");
    const failures=rows("result_draft_capture_failure ");
    assert.ok(failures.some(v=>v?.preparation_pending===true&&v.editor_present===false&&v.hold_count===1),"capture_red_state_missing");
    assert.ok(output.includes('browser_evaluation_failed:{"class":"TypeError","message":"Cannot read properties of null (reading \'tagName\')"'),"capture_native_red_missing");
  }else{
    assert.ok(before.preparation_pending===false&&before.preview_pending===false&&before.boundary_releases===1&&after.cleanup_releases===0,
      "capture_green_boundary_invalid");
    const readiness=rows("result_draft_readiness ");
    assert.ok(readiness.length===2&&readiness[0].preparation_held===true&&readiness[0].editor_present===false&&readiness[0].write_waiting===true&&
      readiness[1].preparation_released===true&&readiness[1].held_preview_returned===true&&readiness[1].locks===1&&readiness[1].replacement_editor_usable===true&&readiness[1].original_draft_retained===true,
      "capture_green_assertions_missing");
  }
}

export function validateCaptureBrowserUses(records, expected, count) {
  assert.equal(records.length,count,"capture_browser_coverage");
  assert.ok(records.every(v=>v.consumer==="project-client"&&validBrowserUse(v,expected)),"capture_browser_identity_invalid");
  const version=expected.actual_version??records[0].actual_version;
  assert.ok(records.every(v=>v.actual_version===version),"capture_browser_version_changed");
  return version;
}

export function replaceCaptureModule(file, expected, replacement) {
  const before=lstatSync(file);
  const safe=s=>s.isFile()&&!s.isSymbolicLink()&&s.nlink===1&&!(s.mode&0o022);
  assert.ok(safe(before)&&realpathSync(file)===file,"capture_unsafe_overlay");
  const fd=openSync(file,constants.O_RDWR|(constants.O_NOFOLLOW??0));
  try {
    const opened=fstatSync(fd),same=s=>safe(s)&&s.dev===before.dev&&s.ino===before.ino;
    assert.ok(same(opened)&&same(lstatSync(file)),"capture_overlay_identity_changed");
    assert.deepEqual(readFileSync(fd),expected,"capture_overlay_bytes_changed");
    assert.ok(same(fstatSync(fd))&&same(lstatSync(file)),"capture_overlay_identity_changed");
    let offset=0;while(offset<replacement.length)offset+=writeSync(fd,replacement,offset,replacement.length-offset,offset);
    ftruncateSync(fd,replacement.length);
  } finally {closeSync(fd);}
}

export function finalizeFocusedCapture(operations) {
  const record={errors:[]};
  for(const [name,operation] of Object.entries(operations)) {
    try {record[name]=operation();}
    catch(error){record.errors.push({operation:name,code:error.code??error.name,message:error.message});}
  }
  return record;
}

export async function captureCanonicalTsRepair({repositoryRoot=process.cwd(),base,head,priorHead,output,preparationReceipt,completion,driver=TS_REPAIR_DRIVER}) {
  assert.ok([TS_REPAIR_DRIVER,GUIDE_REPAIR_DRIVER].includes(driver),"capture_driver_invalid");
  const guide=driver===GUIDE_REPAIR_DRIVER,module=guide?GUIDE_REPAIR_MODULE:TS_REPAIR_MODULE,
    fixtures=guide?GUIDE_REPAIR_FIXTURES:TS_REPAIR_FIXTURES,nodeArgs=guide?[]:["--import","tsx"],args=guide?["--operator-scope"]:[],
    command=["node",...nodeArgs,driver,...args].join(" ");
  const root=realpathSync(repositoryRoot),git=gitAt(root);
  assert.equal(path.resolve(repositoryRoot),root);
  assert.ok([base,head,priorHead].every(v=>/^[a-f0-9]{40}$/u.test(v)),"capture_source_argument_invalid");
  assert.equal(text(git,"rev-parse","HEAD"),head);
  assert.equal(text(git,"remote","get-url","origin"),"https://github.com/hynk-studio/augnes.git");
  assert.equal(text(git,"status","--porcelain"),"","capture_requires_clean_candidate");
  git(["merge-base","--is-ancestor",base,head]);
  const branch=text(git,"branch","--show-current");assert.ok(branch);
  assert.equal(text(git,"rev-parse","refs/remotes/origin/"+branch),head,"capture_publication_tracking_unsettled");
  const context=admitVerificationContext({repositoryRoot:root,kind:"isolated-worktree"});
  const out=path.resolve(root,output);
  assert.ok(out.startsWith(root+"/.augnes-local-verification/")&&!existsSync(out),"capture_output_must_be_new");
  assert.equal(realpathSync(path.dirname(out)),path.dirname(out));
  mkdirSync(out,{mode:0o700});
  const save=(name,value)=>{assert.match(name,/^[a-z0-9_-]+\.(json|log)$/u);const bytes=Buffer.isBuffer(value)?value:Buffer.from(JSON.stringify(value,null,2)+"\n");
    writeFileSync(path.join(out,name),bytes,{mode:0o600,flag:"wx"});return {artifact:name,sha256:digest(bytes)};};
  const completionBytes=readFileSync(completion),priorCompletion=JSON.parse(completionBytes);
  const receipt=readReceiptFile(preparationReceipt);
  assert.equal(priorCompletion.receipt_fingerprint,receipt.integrity.content_fingerprint,"capture_completion_receipt");
  assert.equal(receipt.repository.head_sha,priorHead);
  assert.equal(priorCompletion.attempt_id,receipt.attempt.attempt_id);
  assert.equal(priorCompletion.cleanup_complete,true);
  save("predecessor-references.json",{receipt_path:path.resolve(preparationReceipt),receipt_sha256:digest(readFileSync(preparationReceipt)),completion_path:path.resolve(completion),completion_sha256:digest(completionBytes),completion:priorCompletion});
  const runtime=observeCanonicalRuntimeInputs();assert.ok(validCanonicalRuntimeInputs(runtime));
  const headers=path.join(path.dirname(path.dirname(realpathSync(process.execPath))),"include","node");
  const {raw,entries,blobs}=captureGitCatalogue(git,head),cache=new Map(entries.map(e=>[JSON.stringify(["show",head+":"+e.path]),blobs.get(e.oid)]));
  // Only this immutable Git adapter is cached. Physical source checks read disk.
  const sourceGit=args=>{const key=JSON.stringify(args);if(!cache.has(key))cache.set(key,git(args));return cache.get(key);};
  const catalogue=ref=>entries.map(({path:name,mode})=>{const b=sourceGit(["show",(name===module?ref:head)+":"+name]);return {path:name,mode,byte_size:b.length,sha256:digest(b)};});
  const candidate=catalogue(head),beforeSource=catalogue(priorHead);
  save("git-catalogue.json",{command:["git","ls-tree","-rz",head],bytes:raw.length,sha256:digest(raw),utf8:raw.toString()});
  const catalogueRefs={before:save("before-source.json",beforeSource),after:save("after-source.json",candidate)};
  const original=readFileSync(path.join(root,module));
  assert.deepEqual(original,sourceGit(["show",head+":"+module]));
  const checkout=acquireCheckoutVerificationOwnership({repositoryRoot:root});
  let resource, inUse=false,allSettled=true,overlay=false,primary;const records=[],results=[];
  try {
    resource=createCanonicalTestResourceRoot("ag-suite-",{shortSocketPaths:true});
  const ambient={...process.env,AUGNES_CANONICAL_NODE_HEADERS:headers,AUGNES_CANONICAL_NODE_HEADERS_FINGERPRINT:digest(runtime.headers.observation)};
  const env=buildCanonicalChildEnvironment({ambientEnvironment:ambient,temporaryRoot:resource.root});
  const browserExecutable=selectBrowserPath([env.AUGNES_BROWSER_EXECUTABLE_PATH,"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome","/Applications/Chromium.app/Contents/MacOS/Chromium","/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge","/usr/bin/google-chrome","/usr/bin/google-chrome-stable","/usr/bin/chromium","/usr/bin/chromium-browser"],{repositoryRoot:root,env});
  assert.ok(browserExecutable);
  // Preserve the actual selected lane. A v10 runtime-v1 capture must not
  // silently acquire v8 protected-installation requirements. An explicitly
  // selected strict Browser input still uses its complete bundle owner.
  const browserBinding=assertSelectedBrowser(browserExecutable,{repositoryRoot:root,env});
  const browserBefore=observeInputFile(browserExecutable,{readOnlyExecutable:true});
  const browserExpected={location_fingerprint:digest(browserExecutable),before:browserBefore,...(browserBinding?{browser_input:browserBinding.publicBinding}:{})};
  const bundleBefore=browserBinding?assertBrowserBundle(browserBinding).observation:null;
  assert.ok(browserBefore.present);
  save("runtime.json",{observed_at:now(),runtime,identity_sha256:digest(runtime),browser_expected:browserExpected,browser_bundle_before:bundleBefore,environment:env,environment_sha256:digest(env)});
  const inputBefore=guide?await observeGitRevisionTarget(context,browserExecutable,runtime):null;
  if(guide)save("input-before.json",inputBefore);

    const companion=await inspectVerificationCompanionPreservation(context,{freshTransport:true});save("companion-before.json",companion);
    const acquisition={started_at:now()};const initial=observePreparedDependencyInputs({repositoryRoot:root,phaseId:"dependencies-root"});acquisition.finished_at=now();
    save("dependency-initial.json",{acquisition,initial});
    save("dependency-provenance.json",verifyCaptureDependencyProvenance(receipt,initial,root));
    for (const [label,ref,expectedExit] of [["before",priorHead,1],["after",head,0]]) {
      assertCheckoutVerificationOwnership(checkout,root);
      const target=label==="before"?beforeSource:candidate;
      replaceCaptureModule(path.join(root,module),label==="before"?original:sourceGit(["show",priorHead+":"+module]),sourceGit(["show",ref+":"+module]));overlay=label==="before";
      const source_before=checkCaptureSource(root,target,git,head,overlay?module:false);
      const worktree_before=git(["status","--porcelain"]).toString();
      const dependency_before_acquisition={started_at:now()};const dependencyBefore=observePreparedDependencyInputs({repositoryRoot:root,phaseId:"dependencies-root"});dependency_before_acquisition.finished_at=now();
      assert.equal(comparePreparedDependencyInputs(initial,dependencyBefore),"unchanged");
      const chunks=[],stdout=[],stderr=[],lifecycle=[];const write=which=>({write(chunk){const b=Buffer.from(chunk);chunks.push(b);which.push(b);return true;}});
      if(!inUse){beginCanonicalTestResourceUse(resource);inUse=true;}
      const started_at=now();allSettled=false;
      const result=await runCanonicalChild({suite:"focused-ts-repair",label,command:process.execPath,args:[...nodeArgs,driver,...args],cwd:root,env,timeoutMs:60_000,
        stdout:write(stdout),stderr:write(stderr),log:line=>{lifecycle.push(line);console.log(line);}});
      const finished_at=now();results.push(result);allSettled=settled(result);
      const stdoutRef=save(label+"-output.log",Buffer.concat(chunks));save(label+"-stdout.log",Buffer.concat(stdout));save(label+"-stderr.log",Buffer.concat(stderr));save(label+"-lifecycle.log",Buffer.from(lifecycle.join("\n")+"\n"));
      save(label+"-settlement.json",{started_at,finished_at,result});
      assert.ok(allSettled,"capture_child_unsettled");
      const dependency_after_acquisition={started_at:now()};const dependencyAfter=observePreparedDependencyInputs({repositoryRoot:root,phaseId:"dependencies-root"});dependency_after_acquisition.finished_at=now();
      const source_after=checkCaptureSource(root,target,git,head,overlay?module:false);
      const worktree_after=git(["status","--porcelain"]).toString();
      const witness={attribution:"candidate-driver-prior-implicated-source",driver_source_head:head,tested_source_head:ref,
        ...(guide?{scope:GUIDE_REPAIR_SCOPE,checkout_head:head,source_state:overlay?"candidate-with-prior-implicated-overlay":"clean-candidate",
          worktree_before,worktree_after,input_inventory_sha256:inputBefore.inventory,browser_uses:[]}:{}),
        source_files:catalogueRefs[label],fixture_sha256:digest(candidate.filter(v=>fixtures.includes(v.path))),environment:digest(env),
        file_sha256:digest(sourceGit(["show",head+":"+driver])),modules:[{path:module,sha256:digest(sourceGit(["show",ref+":"+module]))}],
        command,node_version:process.versions.node,runtime_inputs_sha256:digest(runtime),prepared_dependencies:{before:dependencyBefore,after:dependencyAfter},
        started_at,finished_at,result,stdout:stdoutRef};
      const witnessRef=save(label+"-witness.json",witness);records.push({label,ref:witnessRef,witness});
      save(label+"-observations.json",{source_before,dependency_before_acquisition,child:{started_at,finished_at},dependency_after_acquisition,source_after});
      assert.equal(comparePreparedDependencyInputs(initial,dependencyAfter),"unchanged");
      assert.equal(digest(observeCanonicalRuntimeInputs()),digest(runtime),"capture_runtime_changed");
      const browserAfter=observeInputFile(browserExecutable,{readOnlyExecutable:true});
      const browserUses=Buffer.concat(stdout).toString().split(/\r?\n/u).map(parseBrowserUseLine).filter(Boolean);
      save(label+"-browser.json",{observed_at:now(),before:browserBefore,after:browserAfter,prior_observed_version:browserExpected.actual_version??null,actual_uses:browserUses});
      assert.ok(nonFaultInputChange(classifyInputChange(browserBefore,browserAfter,{classification:"execution",readOnlyExecutable:true})),"capture_browser_changed");
      if(guide)assert.deepEqual(browserUses,[],"capture_controlled_fixture_browser_use");
      else browserExpected.actual_version=validateCaptureBrowserUses(browserUses,browserExpected,label==="before"?1:2);
      assert.equal(result.exit_code,expectedExit,"capture_causal_hypothesis_failed");
      if(guide)validateGuideRepairOutcome(Buffer.concat(chunks).toString(),expectedExit);
      else validateResultDraftCaptureOutcome(Buffer.concat(chunks).toString(),expectedExit);
      assert.equal(result.termination_reason,"natural_exit");assert.equal(result.timed_out,false);assert.equal(result.cancelled,false);
    }
    if(guide){const inputAfter=await observeGitRevisionTarget(context,browserExecutable,runtime);save("input-after.json",inputAfter);
      assert.equal(inputAfter.inventory,inputBefore.inventory,"capture_input_inventory_changed");}
    const focused={schema:"augnes.local-canonical-reviewed-revision-focused.v1",basis:"implementation_owner_not_independent_review",
      predecessor_receipt_fingerprint:receipt.integrity.content_fingerprint,runtime_inputs_sha256:digest(runtime),
      remedy:guide?"The native final-follow-up readiness waits for actual GuideBrief settlement before the deliberate project/runtime switch. The common candidate driver retains all operator controls and adopted/invalid/failed replacement boundaries against the entire prior and corrected Browser source. This is controlled sequencing evidence, not historical Browser recreation or corrected real-Browser qualification.":"The genuine corrected result-draft helper waits for an editable element, observes the pending preparation boundary and refreshes/recompares the replacement owner before editability assertions. The common candidate fixture holds the same real response for both entire helper blobs.",
      ...(guide?{diagnosis:"The prior Full failed its strict unexpected-request gate after an aborted GuideBrief lacked a completed adopted replacement before context destruction. The controlled schedule exposes premature context release in the original readiness predicate; it does not establish the historical timeout cause or real-Browser success."}:{}),
      failed_phase:guide?"e2e-operator-native-host-execution":"e2e-project-experience",implicated_paths:[module],input_remedy_resources:[],source_files:candidate.filter(v=>[module,...fixtures].includes(v.path)),
      regression:{path:driver,node_args:nodeArgs,args,fixture_paths:fixtures,attribution:"candidate-driver-prior-implicated-source",before:records[0].ref,after:records[1].ref},
      commands:[{command,tested_source_head:head,record:records[1].ref,stdout:records[1].witness.stdout,result:records[1].witness.result}],finished_at:now()};
    // This truthful recipe fragment is supplied only to the focused predicate.
    // It is not preparation, authority, a reservation or a physical commission.
    const p={schema:guide?"augnes.local-canonical-source-correction.v7":"augnes.local-canonical-source-correction.v10",kind:"reviewed_revision",
      commission:guide?{ordinal:1,maximum_invocations:1,source_revision:MATERIAL_SOURCE_CORRECTION}:{ordinal:2},head,tree:text(git,"rev-parse",head+"^{tree}"),
      inputs:{identity_sha256:digest(runtime),...(guide?{inventory_sha256:inputBefore.inventory}:{})}};
    const prior={head:priorHead,tree:text(git,"rev-parse",priorHead+"^{tree}")};
    const bytes=(ref,max)=>revisionArtifact(out,ref,max),parse=ref=>JSON.parse(bytes(ref));
    save("focused.json",focused);save("predicate-input.json",{scope:"focused-source-predicate-only; no preparation or authority",p,prior,completedAt:priorCompletion.finished_at});
    assert.equal(verifyGitSourceRepair(p,prior,focused,{git:sourceGit,parse,bytes,completedAt:priorCompletion.finished_at,repositoryRoot:root}),head);
    save("predicate-result.json",{scope:"focused-only",result:"PASS",head,base,tree:p.tree,branch,repository:"hynk-studio/augnes",finished_at:now()});
    const after=await inspectVerificationCompanionPreservation(context,{freshTransport:true});save("companion-after.json",after);
    assert.equal(companion.state.preservation_valid,true);
    assert.equal(after.state.preservation_valid,true);
    assert.deepEqual(after.state,companion.state);
  } catch(error) {primary=error;throw error;}
  finally {
    const cleanup=finalizeFocusedCapture({
      restore:()=>{if(overlay){replaceCaptureModule(path.join(root,module),sourceGit(["show",priorHead+":"+module]),original);}return {overlay_restored:overlay};},
      resources:()=>{
        if(!allSettled)return {completed:false,reason:"consumers_unsettled"};
        if(!resource)return {completed:true,created:false};
        if(inUse){assert.ok(results.length&&results.every(settled));settleCanonicalTestResourceUse(resource,results.at(-1));}
        const cleanup=cleanupCanonicalTestResources([resource]);assert.ok(cleanup.every(v=>v.completed));return {completed:true,cleanup};
      },
      ownership:()=>releaseCheckoutVerificationOwnership(checkout,root,{consumersSettled:allSettled}),
      source:()=>checkCaptureSource(root,candidate,git,head),
    });
    try {save("cleanup.json",{finished_at:now(),all_settled:allSettled,parent_root:resource?.root??null,parent_absent:!resource||!existsSync(resource.root),...cleanup});}
    catch(error){if(!primary)throw error;console.error("capture_cleanup_record_failed",error.code??error.name);}
    if(!primary&&cleanup.errors.length)throw Object.assign(new Error("capture_cleanup_incomplete"),{cleanupErrors:cleanup.errors});
  }
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const args=process.argv.slice(2),options={};
  for(let i=0;i<args.length;i+=2){assert.ok(["--base","--head","--prior-head","--output","--preparation-receipt","--completion","--driver"].includes(args[i])&&args[i+1],"capture_arguments_invalid");const key=args[i].slice(2).replace(/-([a-z])/gu,(_,v)=>v.toUpperCase());assert.ok(!Object.hasOwn(options,key));options[key]=args[i+1];}
  assert.equal(Object.keys(options).length,options.driver?7:6);
  console.log(await captureCanonicalTsRepair(options));
}
