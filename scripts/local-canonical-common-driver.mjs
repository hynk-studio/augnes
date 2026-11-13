import path from "node:path";
import { createCanonicalRevisionReader } from "./canonical-revision-reader.mjs";
import { pureContractGitSource } from "./local-canonical-pure-contract-witness.mjs";
import { CANONICAL_NODE_VERSION } from "./local-canonical-environment.mjs";
import { buildCanonicalChildEnvironment } from "./canonical-test-environment.mjs";
import { digest, preparedDependencyIdentity, comparePreparedDependencyInputs } from "./local-canonical-inputs.mjs";

export const MATERIAL_COMMON_DRIVER = "material-common-candidate-driver-v1";
export const COMMON_DRIVER_RESULT_PREFIX = "AUGNES_COMMON_DRIVER_RESULT ";
const equal = (a,b) => a !== undefined && b !== undefined && digest(a) === digest(b);
const sha = value => /^[a-f0-9]{64}$/u.test(value ?? "");
const fail = () => { throw Object.assign(new Error("revision_common_driver_invalid"), {code:"revision_common_driver_invalid"}); };
const dependencyRoots = {"dependencies-root":"", "dependencies-nested":"apps/augnes_apps", "dependencies-web-planning":"apps/web_planning"};

// One operation-local immutable Git read, including binary blobs. Physical
// witness artifacts are separately reread through the existing safe reader.
export function commonDriverSources(git, repositoryRoot, candidate, predecessor, modules) {
  if(git(["rev-parse","--show-toplevel"]).toString().trim()!==repositoryRoot)fail();
  const {files} = pureContractGitSource(git,candidate);
  const reader = createCanonicalRevisionReader(repositoryRoot);
  const catalogue = source => {
    const result=[];
    for(let i=0;i<files.length;i+=64){
      const group=files.slice(i,i+64).map(([file,entry])=>({file,entry,revision:modules.includes(file)?source:candidate}));
      reader.prefetch(group);
      for(const {file,entry,revision}of group){
        const bytes=reader.readBytes(revision,file),old=reader.tree(revision).get(file);
        const expected=revision===candidate?entry.oid:git(["rev-parse",revision+":"+file]).toString().trim();
        if(old?.type!=="blob"||old.mode!==entry.mode||old.oid!==expected)fail();
        result.push({path:file,mode:entry.mode,byte_size:bytes.length,sha256:digest(bytes)});
      }
    }
    return result;
  };
  const after=catalogue(candidate),before=catalogue(predecessor);
  if(git(["for-each-ref","--format=%(refname)","refs/replace/"]).length)fail();
  return {before,after,common_sha256:digest(after.filter(v=>!modules.includes(v.path)))};
}

function completeResult(result,exit) {
  return result?.exit_code===exit && result.signal===null && result.spawn_error_code===null &&
    result.timed_out===false && result.cancelled===false && result.exit_observed===true &&
    result.streams_closed===true && result.cleanup_completed===true && result.remaining_owned_processes===0 &&
    result.termination_reason==="natural_exit" && Number.isSafeInteger(result.duration_ms) && result.duration_ms>=0;
}

function dependencies(witness,root,git,head) {
  const rows=witness.prepared_dependencies;
  if(!Array.isArray(rows)||!equal(rows.map(v=>v.phase_id),Object.keys(dependencyRoots)))fail();
  return rows.map(row=>{
    const dir=dependencyRoots[row.phase_id],sources=["package.json","package-lock.json"].map(name=>{
      const file=dir?dir+"/"+name:name,bytes=git(["show",head+":"+file]);
      return {name,sha256:digest(bytes),bytes:bytes.length};
    });
    for(const observation of [row.before,row.after])if(observation?.phase_id!==row.phase_id ||
      observation.location_fingerprint!==digest(path.join(root,dir,"node_modules")) || !equal(observation.sources,sources) ||
      !preparedDependencyIdentity(observation))fail();
    if(comparePreparedDependencyInputs(row.before,row.after)!=="unchanged")fail();
    return {phase_id:row.phase_id,identity:preparedDependencyIdentity(row.before)};
  });
}

function stdoutSummary(bytes,witness,catalogue) {
  const text=bytes(witness.stdout,2*1024*1024).toString("utf8");
  const lines=text.split(/\r?\n/u).filter(line=>line.startsWith(COMMON_DRIVER_RESULT_PREFIX));
  if(lines.length!==1)fail();
  let summary;try{summary=JSON.parse(lines[0].slice(COMMON_DRIVER_RESULT_PREFIX.length));}catch{fail();}
  if(summary.contract!=="augnes.common-request-transport-observation.v1" || summary.imports_complete!==true || summary.cleanup_complete!==true ||
      !Array.isArray(summary.cleanup_errors)||summary.cleanup_errors.length || !Array.isArray(summary.actual_imports)||
      summary.actual_imports.length>512 || new Set(summary.actual_imports.map(v=>v.path)).size!==summary.actual_imports.length ||
      summary.actual_imports.some(v=>!catalogue.some(f=>f.path===v.path&&f.byte_size===v.byte_size&&f.sha256===v.sha256)) ||
      !sha(summary.worker_bundle?.sha256)||!Number.isSafeInteger(summary.worker_bundle.bytes)||summary.worker_bundle.bytes<1 ||
      !Array.isArray(summary.worker_inputs)||!summary.worker_inputs.length||summary.worker_inputs.length>8192 ||
      new Set(summary.worker_inputs.map(v=>v.path)).size!==summary.worker_inputs.length || summary.worker_inputs.some(v=>
        !/^[\w./@+-]+$/u.test(v.path??"") || path.posix.normalize(v.path)!==v.path || v.path.startsWith("/") || v.path.startsWith("../") ||
        !sha(v.sha256)||!Number.isSafeInteger(v.byte_size)||v.byte_size<0 ||
        (!/^(?:apps\/(?:augnes_apps|web_planning)\/)?node_modules\//u.test(v.path) &&
          !catalogue.some(f=>f.path===v.path&&f.byte_size===v.byte_size&&f.sha256===v.sha256))) ||
      !Array.isArray(summary.checkpoints)||!summary.checkpoints.length||summary.checkpoints.length>32 ||
      !Array.isArray(summary.selected_uploads)||summary.selected_uploads.length>1)fail();
  return summary;
}

// The before role is explicitly a candidate harness with predecessor modules,
// never a claim that an untouched predecessor checkout executed this driver.
export function verifyMaterialCommonDriver(p,prior,focused,{git,parse,bytes,completedAt,repositoryRoot}) {
  const r=focused.regression,modules=focused.implicated_paths,file=r.path;
  if(r.attribution!==MATERIAL_COMMON_DRIVER || r.kind!==undefined || r.after_equivalence!==undefined ||
      !equal(Object.keys(r).sort(),["after","args","attribution","before","node_args","path"]) ||
      p.commission.evidence_kind!==undefined ||
      !/^scripts\/(?:[\w.-]+\/)*[\w.-]+\.mjs$/u.test(file??"") ||
      !equal(r.node_args,["--import","tsx"]) || !equal(r.args,[]) || !equal(focused.input_remedy_resources,[]) ||
      !Array.isArray(modules)||!modules.length||new Set(modules).size!==modules.length||modules.includes(file) ||
      !focused.source_files?.some(v=>v.path===file) || typeof repositoryRoot!=="string"||!path.isAbsolute(repositoryRoot))fail();
  for(const name of modules){
    const old=git(["rev-parse",prior.head+":"+name]).toString().trim(),current=git(["rev-parse",p.head+":"+name]).toString().trim();
    if(old===current||!/^@@ /mu.test(git(["diff","--no-ext-diff","--no-textconv","--ignore-all-space","--ignore-blank-lines",old,current]).toString()))fail();
  }
  const sources=commonDriverSources(git,repositoryRoot,p.head,prior.head,modules);
  const before=parse(r.before),after=parse(r.after),runtime=parse(p.inputs.current);
  const command=["node",...r.node_args,file].join(" ");
  const driver=git(["show",p.head+":"+file]),dependencyIdentity=dependencies(before,repositoryRoot,git,p.head);
  if(!sources.after.some(v=>v.path===file)||!(Date.parse(completedAt)<Date.parse(before.started_at) &&
      Date.parse(before.started_at)<=Date.parse(before.finished_at) && Date.parse(before.finished_at)<Date.parse(after.started_at) &&
      Date.parse(after.started_at)<=Date.parse(after.finished_at) && Date.parse(after.finished_at)<=Date.parse(focused.finished_at)) ||
      !focused.commands?.some(c=>c.command===command&&c.tested_source_head===p.head&&equal(c.record,r.after)&&equal(c.stdout,after.stdout)))fail();
  let beforeSummary;
  for(const [w,source,head,exit,kind] of [[before,sources.before,prior.head,1,"candidate-with-predecessor-modules"],[after,sources.after,p.head,0,"exact-final-candidate"]]){
    const catalogue=JSON.parse(bytes(w.source_files,2*1024*1024)),end=JSON.parse(bytes(w.source_files_after,2*1024*1024));
    if(w.attribution!==MATERIAL_COMMON_DRIVER||w.driver_source_head!==p.head||w.tested_source_head!==head||
        w.source_state?.kind!==kind||w.source_state.git_head!==p.head||w.source_state.git_tree!==p.tree||
        !equal(w.source_state.untracked_read_inputs,[])||!equal(catalogue,source)||!equal(end,source)||
        w.common_source_sha256!==sources.common_sha256||w.file_sha256!==digest(driver)||w.command!==command||
        !equal(w.modules,source.filter(v=>modules.includes(v.path)).map(({path,sha256})=>({path,sha256})))||
        !equal(w.runtime_before,runtime)||!equal(w.runtime_after,runtime)||w.runtime_inputs_sha256!==p.inputs.identity_sha256||
        w.node_version!==CANONICAL_NODE_VERSION||digest(w.node_executable)!==runtime.node.location_fingerprint||
        !sha(w.environment)||w.environment!==before.environment||!equal(w.environment_before,w.environment_after)||
        digest(w.environment_before)!==w.environment||!completeResult(w.result,exit)||
        !equal(dependencies(w,repositoryRoot,git,p.head),dependencyIdentity))fail();
    const env=w.environment_before;
    if(env.AUGNES_CANONICAL_TEMP_ROOT!==env.TMPDIR||!equal(env,buildCanonicalChildEnvironment({ambientEnvironment:env,
      temporaryRoot:env.TMPDIR,resourceRoot:env.AUGNES_CANONICAL_TEMP_ROOT})))fail();
    // Equal lexical environments do not authorize sharing mutable state. The
    // fixed-layout resource is created empty and completely removed per role.
    const lifecycle=w.resource_lifecycle;
    if(lifecycle?.owner?.root!==env.TMPDIR || !/^\d+$/u.test(lifecycle.owner.device??"") ||
        !/^\d+$/u.test(lifecycle.owner.inode??"") || !equal(lifecycle.initial_entries,[]) ||
        lifecycle.absent_after_cleanup!==true || lifecycle.cleanup?.root!==env.TMPDIR ||
        lifecycle.cleanup.completed!==true || lifecycle.cleanup.failure_count!==0 || !equal(lifecycle.cleanup.failures,[]) ||
        !(Date.parse(lifecycle.created_at)<=Date.parse(w.started_at) &&
          Date.parse(w.started_at)<=Date.parse(lifecycle.cleanup_finished_at) &&
          Date.parse(lifecycle.cleanup_finished_at)<=Date.parse(w.finished_at)))fail();
    if(w===after && !(Date.parse(before.resource_lifecycle.cleanup_finished_at)<Date.parse(lifecycle.created_at)))fail();
    const summary=stdoutSummary(bytes,w,source);
    if(exit===1)beforeSummary=summary;
    else if(!equal(summary.worker_bundle,beforeSummary.worker_bundle)||!equal(summary.worker_inputs,beforeSummary.worker_inputs))fail();
    if(!modules.every(name=>summary.actual_imports.some(v=>v.path===name)))fail();
    // The concrete transport driver supplies its first real error context. A
    // loader/setup/harness/timeout/cleanup failure cannot stand in for RED.
    const pipe=(error,depth=0)=>depth<8&&error&&(error.code==="EPIPE"?error:pipe(error.cause,depth+1));
    if(exit===1){
      const [upload]=summary.selected_uploads;
      if(summary.assertions_complete!==false || summary.primary_error_stage!=="response_body" ||
          summary.primary_selected!==true || summary.primary_response_status!==413 ||
          !summary.primary_error || !pipe(summary.primary_error) || !upload ||
          !pipe(upload.transport_error) || !equal(summary.first_transport_error,upload.transport_error) ||
          !equal(pipe(summary.primary_error),pipe(upload.transport_error)) ||
          upload.correlated_requests!==1 || upload.matching_413_headers!==1 || upload.released!==true || upload.harness_error!==null ||
          !sha(upload.payload_sha256)||!sha(upload.headers_sha256)||!Number.isSafeInteger(upload.declared_length)||upload.declared_length<=65536 ||
          !Number.isSafeInteger(upload.enqueued_bytes)||upload.enqueued_bytes<65536||upload.enqueued_bytes>upload.declared_length)fail();
    }else if(summary.assertions_complete!==true || summary.primary_error!==null || summary.primary_error_stage!==null ||
        summary.first_transport_error!==null || summary.selected_uploads.some(upload=>upload.harness_error!==null||upload.transport_error!==null))fail();
  }
  return p.head;
}
