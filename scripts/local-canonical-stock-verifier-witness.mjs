import path from "node:path";
import { STOCK_VERIFIER_RESULT_PREFIX } from "./local-canonical-stock-verifier-output.mjs";
export { STOCK_VERIFIER_RESULT_PREFIX } from "./local-canonical-stock-verifier-output.mjs";
import { digest } from "./local-canonical-inputs.mjs";
import { CANONICAL_NODE_VERSION } from "./local-canonical-environment.mjs";
import { buildCanonicalChildEnvironment } from "./canonical-test-environment.mjs";
import { commonDriverSources, commonDriverNaturalResult, commonDriverDependencies } from "./local-canonical-common-driver.mjs";
import { gitRevisionInventory } from "./local-canonical-git-observation.mjs";
import { validBrowserBundle } from "./local-canonical-browser-bundle.mjs";

export const GIT_CONFIG_STOCK_VERIFIER_REPAIR = "git-config-stock-verifier-repair-v1";
export const MATERIAL_COMMON_STOCK_VERIFIER = "material-common-stock-verifier-driver-v1";
export const STOCK_VERIFIER_CORPUS = "augnes.synthetic-stock-verifier-corpus.v1";
export const STOCK_VERIFIER_OBSERVATION = "augnes.common-stock-verifier-observation.v1";
export const STOCK_VERIFIER_MODULES = Object.freeze([
  "scripts/local-canonical-attempts.mjs", "scripts/local-canonical-git-observation.mjs",
]);
export const STOCK_VERIFIER_CASES = Object.freeze([
  "exact_raw", "changed_content", "changed_permission", "changed_location", "changed_scope", "forged_inventory", "malformed_observation", "metadata_only",
]);
const equal = (a,b) => a !== undefined && b !== undefined && digest(a) === digest(b);
const sha = value => /^[a-f0-9]{64}$/u.test(value ?? "");
const fail = () => { throw Object.assign(new Error("revision_stock_verifier_invalid"), {code:"revision_stock_verifier_invalid"}); };
const gitRedirect=(relative,type)=>relative.split("/").at(-1)===".git"&&type!=="directory" ||
  /(?:^|\/)\.git\/(?:commondir|objects\/info\/(?:alternates|http-alternates))$/u.test(relative);

// This case witnesses an actual stock-reader correction. The existing HTTP
// attribution keeps its separate response-body/EPIPE interpretation.
export function verifyMaterialStockVerifier(p,prior,focused,context) {
  return verifyStockVerifierPair(p,prior,focused,context);
}

function verifyStockVerifierPair(p,prior,focused,{git,parse,bytes,completedAt,repositoryRoot}) {
  const r=focused.regression,modules=focused.implicated_paths;
  if(p.commission?.evidence_kind!==GIT_CONFIG_STOCK_VERIFIER_REPAIR || r?.attribution!==MATERIAL_COMMON_STOCK_VERIFIER ||
      !equal(Object.keys(r).sort(),["after","args","attribution","before","corpus","node_args","path"]) ||
      !equal(modules,STOCK_VERIFIER_MODULES) || !equal(r.node_args,["--import","tsx"]) || !equal(r.args,[]) ||
      !/^scripts\/[\w.-]+\.mjs$/u.test(r.path??"") || modules.includes(r.path) ||
      !equal(focused.input_remedy_resources,[]) || !focused.source_files?.some(v=>v.path===r.path) ||
      typeof repositoryRoot!=="string" || !path.isAbsolute(repositoryRoot))fail();
  for(const name of modules){
    const old=git(["rev-parse",prior.head+":"+name]).toString().trim(),current=git(["rev-parse",p.head+":"+name]).toString().trim();
    if(old===current || !/^@@ /mu.test(git(["diff","--no-ext-diff","--no-textconv","--ignore-all-space","--ignore-blank-lines",old,current]).toString()))fail();
  }
  const sources=commonDriverSources(git,repositoryRoot,p.head,prior.head,modules);
  const before=parse(r.before),after=parse(r.after),runtime=parse(p.inputs.current),corpus=parse(r.corpus);
  const command=["node",...r.node_args,r.path].join(" "),driver=git(["show",p.head+":"+r.path]);
  const dependencyIdentity=commonDriverDependencies(before,repositoryRoot,git,p.head);
  const corpusContext=validateCorpus(corpus,bytes);
  if(!(Date.parse(completedAt)<Date.parse(before.started_at) && Date.parse(before.started_at)<=Date.parse(before.finished_at) &&
      Date.parse(before.finished_at)<Date.parse(after.started_at) && Date.parse(after.started_at)<=Date.parse(after.finished_at) &&
      Date.parse(after.finished_at)<=Date.parse(focused.finished_at)) ||
      !focused.commands?.some(c=>c.command===command&&c.tested_source_head===p.head&&equal(c.record,r.after)&&equal(c.stdout,after.stdout)))fail();
  for(const [w,catalogue,head,exit,kind]of [[before,sources.before,prior.head,1,"candidate-with-predecessor-modules"],[after,sources.after,p.head,0,"exact-final-candidate"]]){
    if(w.attribution!==MATERIAL_COMMON_STOCK_VERIFIER || w.driver_source_head!==p.head || w.tested_source_head!==head ||
        w.source_state?.kind!==kind || w.source_state.git_head!==p.head || w.source_state.git_tree!==p.tree ||
        !equal(w.source_state_after,w.source_state) || !equal(w.source_state.untracked_read_inputs,[]) ||
        !equal(JSON.parse(bytes(w.source_files,2*1024*1024)),catalogue) ||
        !equal(JSON.parse(bytes(w.source_files_after,2*1024*1024)),catalogue) ||
        w.common_source_sha256!==sources.common_sha256 || w.file_sha256!==digest(driver) || w.command!==command ||
        !equal(w.modules,catalogue.filter(v=>modules.includes(v.path)).map(({path,sha256})=>({path,sha256}))) ||
        !equal(w.runtime_before,runtime)||!equal(w.runtime_after,runtime)||w.runtime_inputs_sha256!==p.inputs.identity_sha256||
        w.node_version!==CANONICAL_NODE_VERSION || digest(w.node_executable)!==runtime.node.location_fingerprint ||
        !sha(w.environment)||w.environment!==before.environment||!equal(w.environment_before,w.environment_after)||
        digest(w.environment_before)!==w.environment||!commonDriverNaturalResult(w.result,exit)||
        !equal(commonDriverDependencies(w,repositoryRoot,git,p.head),dependencyIdentity))fail();
    const env=w.environment_before,lifecycle=w.resource_lifecycle;
    if(env.AUGNES_CANONICAL_TEMP_ROOT!==env.TMPDIR || !equal(env,buildCanonicalChildEnvironment({ambientEnvironment:env,
        temporaryRoot:env.TMPDIR,resourceRoot:env.AUGNES_CANONICAL_TEMP_ROOT})) ||
        lifecycle?.owner?.root!==env.TMPDIR || !/^\d+$/u.test(lifecycle.owner.device??"") || !/^\d+$/u.test(lifecycle.owner.inode??"") ||
        !equal(lifecycle.initial_entries,[]) || lifecycle.absent_after_cleanup!==true || lifecycle.cleanup?.root!==env.TMPDIR ||
        lifecycle.cleanup.completed!==true || lifecycle.cleanup.failure_count!==0 || !equal(lifecycle.cleanup.failures,[]) ||
        !(Date.parse(lifecycle.created_at)<=Date.parse(w.started_at) && Date.parse(w.started_at)<=Date.parse(lifecycle.cleanup_finished_at) &&
          Date.parse(lifecycle.cleanup_finished_at)<=Date.parse(w.finished_at)) ||
        w===after && !(Date.parse(before.resource_lifecycle.cleanup_finished_at)<Date.parse(lifecycle.created_at)))fail();
    validateSummary(bytes(w.stdout,2*1024*1024),catalogue,r.corpus,corpus,corpusContext,exit,env,w,r.path);
  }
  return p.head;
}

function validateCorpus(corpus,bytes) {
  if(corpus?.contract!==STOCK_VERIFIER_CORPUS || !Array.isArray(corpus.entries) || !corpus.entries.length || corpus.entries.length>4096 ||
      !Array.isArray(corpus.context_path) || !equal(corpus.context_path,["context.json"]) ||
      typeof corpus.working_root!=="string" || !path.isAbsolute(corpus.working_root))fail();
  let last="",total=0,context=null;
  for(const entry of corpus.entries){
    if(typeof entry.path!=="string" || entry.path<=last || entry.path.startsWith("/") || entry.path.split("/").some(v=>!v||v==="."||v==="..") ||
        !["file","directory"].includes(entry.type) || gitRedirect(entry.path,entry.type) || !/^\d+$/u.test(entry.mode??"") || (BigInt(entry.mode)&0o022n)!==0n ||
        !/^\d+$/u.test(entry.uid??"") || !/^\d+$/u.test(entry.gid??""))fail();
    last=entry.path;
    if(entry.type==="file"){
      if(!Number.isSafeInteger(entry.bytes)||entry.bytes<0||!sha(entry.sha256)||entry.record?.sha256!==entry.sha256)fail();
      const content=bytes(entry.record,1024*1024);if(content.length!==entry.bytes||digest(content)!==entry.sha256)fail();
      total+=content.length;if(total>8*1024*1024)fail();
      if(entry.path==="context.json")try{context=JSON.parse(content);}catch{fail();}
    }else if(entry.bytes!==undefined||entry.sha256!==undefined||entry.record!==undefined)fail();
  }
  if(!context || context.root!==corpus.working_root || context.checkout!==path.join(corpus.working_root,"checkout") ||
      context.anchor!==path.join(corpus.working_root,"anchor") || context.branch!=="codex/reviewed-revision" ||
      !context.file?.startsWith(path.join(context.checkout,".augnes-local-verification")+path.sep) ||
      context.materialFinalReceipt?.attempt?.source_correction?.commission?.source_revision!=="material-source-correction-v1")fail();
  return context;
}

function validateSummary(output,catalogue,corpusRef,corpus,corpusContext,exit,env,witness,driverPath) {
  const lines=output.toString("utf8").split(/\r?\n/u).filter(line=>line.startsWith(STOCK_VERIFIER_RESULT_PREFIX));
  if(lines.length!==1)fail();let s;try{s=JSON.parse(lines[0].slice(STOCK_VERIFIER_RESULT_PREFIX.length));}catch{fail();}
  if(s.contract!==STOCK_VERIFIER_OBSERVATION || s.imports_complete!==true || s.cleanup_complete!==true ||
      !equal(s.cleanup_errors,[]) || s.synthetic_authority!==true || s.remote_requests!==0 || s.physical_accounting_unchanged!==true ||
      !Array.isArray(s.actual_imports) || s.actual_imports.length>512 || new Set(s.actual_imports.map(v=>v.path)).size!==s.actual_imports.length ||
      s.actual_imports.some(v=>!catalogue.some(f=>f.path===v.path&&f.byte_size===v.byte_size&&f.sha256===v.sha256)) ||
      ![...STOCK_VERIFIER_MODULES,driverPath].every(name=>s.actual_imports.some(v=>v.path===name)) ||
      s.corpus?.manifest_sha256!==corpusRef.sha256 || s.corpus.working_root!==corpus.working_root ||
      corpus.working_root!==path.join(env.AUGNES_CANONICAL_TEMP_ROOT,"acquisition-proposal") ||
      !validBrowserBundle(s.corpus.before) || s.corpus.before.location_fingerprint!==digest(corpus.working_root) ||
      !equal(s.corpus.before,s.corpus.after) || s.corpus.cleanup?.completed!==true || s.corpus.cleanup.failure_count!==0 ||
      !equal(s.corpus.cleanup.failures,[]) || !equal(s.cases?.map(v=>v.id),STOCK_VERIFIER_CASES))fail();
  const context=corpus.entries.find(row=>row.path==="context.json");
  const traversal=(a,b)=>{const aa=a.path.split("/"),bb=b.path.split("/");for(let i=0;i<Math.min(aa.length,bb.length);i++)if(aa[i]!==bb[i])return aa[i]<bb[i]?-1:1;return aa.length-bb.length;};
  const files=corpus.entries.filter(row=>row.type==="file").sort(traversal).map(({path,sha256})=>({path,sha256}));
  if(s.context_sha256!==context.sha256 || s.corpus.before.content_sha256!==digest(files) ||
      s.corpus.before.entries!==corpus.entries.length+1 || s.corpus.before.bytes!==corpus.entries.reduce((n,row)=>n+(row.bytes??0),0))fail();
  if(!equal(s.baseline_inventory,corpusContext.materialFinalReceipt.inputs) ||
      gitRevisionInventory(s.baseline_inventory)!==corpusContext.materialFinalReceipt.attempt.source_correction.inputs.inventory_sha256)fail();
  verifyCaseInputs(s,witness);
  const exact=s.cases[0],metadata=s.cases.at(-1);
  if(exact.expected!==true || exact.actual!==true || metadata.expected!==true || metadata.actual!==(exit===0) ||
      s.cases.slice(1,-1).some(v=>v.expected!==false||v.actual!==false) ||
      !equal(metadata.changed_fields,["inode","mtime_ns","ctime_ns"]) ||
      !sha(metadata.expected_inventory_sha256) || !sha(metadata.current_inventory_sha256) ||
      metadata.expected_inventory_sha256===metadata.current_inventory_sha256)fail();
  if(exit===1){
    if(s.assertions_complete!==false || s.primary_error_stage!=="metadata_only_assertion" ||
        s.primary_error?.code!=="ERR_ASSERTION" || s.primary_error.actual!==false || s.primary_error.expected!==true)fail();
  }else if(s.assertions_complete!==true||s.primary_error!==null||s.primary_error_stage!==null)fail();
}

function verifyCaseInputs(summary,witness) {
  const baseline=summary.baseline_inventory,expected=gitRevisionInventory(baseline);
  for(const row of summary.cases){
    const input=structuredClone(baseline),git=input.resources.find(value=>value.id==="git-config");
    switch(row.id){
      case "exact_raw":break;
      case "changed_content":git.before.sha256=digest("stock verifier different complete content");break;
      case "changed_permission":git.before.permission_identity=digest("stock verifier different permission");break;
      case "changed_location":git.location_fingerprint=digest("stock verifier different location");break;
      case "changed_scope":git.gitTracking.protected_branches=[digest("stock verifier different branch")];git.before.git_projection.scope_fingerprint=digest("stock verifier different scope");break;
      case "forged_inventory":break;
      case "malformed_observation":delete git.before.metadata.links;break;
      case "metadata_only":for(const key of ["inode","mtime_ns","ctime_ns"])git.before.metadata[key]=String(BigInt(git.before.metadata[key])+1n);break;
      default:fail();
    }
    const inventory=row.id==="forged_inventory"?digest("stock verifier forged inventory claim"):row.id==="malformed_observation"?digest("stock verifier malformed inventory claim"):gitRevisionInventory(input);
    if(!equal(row.input_inventory,input) || row.expected_inventory_sha256!==expected || row.current_inventory_sha256!==inventory ||
        !(Date.parse(witness.started_at)<=Date.parse(row.synthetic_service_observed_at)&&
          Date.parse(row.synthetic_service_observed_at)<=Date.parse(witness.finished_at)))fail();
  }
}
