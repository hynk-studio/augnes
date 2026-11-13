// A finite, file-backed synthetic ledger corpus for the production stock reader.
// Creation uses the existing material fixture builders before witness freeze;
// a witness only restores/reads this declared corpus, never reruns those suites.
import assert from "node:assert/strict";
import { chmodSync, existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import { digest, observeInputFile } from "../local-canonical-inputs.mjs";
import { createBrowserBundleObserver } from "../local-canonical-browser-bundle.mjs";
import { revisionArtifact, authorizeReviewedRevision, inspectAttemptRecords, readSourceCorrectionProof } from "../local-canonical-attempts.mjs";
import { gitRevisionInventory } from "../local-canonical-git-observation.mjs";
import { createGitHubObserverAuthorizationTransport } from "../github-main-branch-transport.mjs";
import { createCanonicalTestResourceDirectory, beginCanonicalTestResourceUse, settleCanonicalTestResourceUse, cleanupCanonicalTestResources } from "../canonical-test-environment.mjs";

const CORPUS="augnes.synthetic-stock-verifier-corpus.v1",CONTRACT="complete-git-config-current-stock-v1";
const clone=structuredClone,inside=(root,file)=>file.startsWith(root+path.sep),same=(a,b)=>digest(a)===digest(b);
const failure=code=>Object.assign(new Error(code),{code});
const parse=(root,reference,maximum)=>JSON.parse(revisionArtifact(root,reference,maximum));
const gitRedirect=(relative,type)=>relative.split("/").at(-1)===".git"&&type!=="directory" ||
  /(?:^|\/)\.git\/(?:commondir|objects\/info\/(?:alternates|http-alternates))$/u.test(relative);

export function observeStockVerifierCorpus(root) {
  const observed=createBrowserBundleObserver(root)({force:true});
  // The bounded tree owner already refuses regular-file nlink != 1. This
  // corpus additionally excludes all links and external Git object stores;
  // its producer is a standalone git init, never a clone or linked worktree.
  if(observed.inventory.some(row=>row.type==="link"||gitRedirect(row.path,row.type)) ||
      observed.inventory.some(row=>row.metadata.uid!==String(process.getuid?.())))
    throw failure("stock_verifier_corpus_unsafe");
  return observed;
}

// Write a new evidence copy; never relocate or mutate its source fixture.
export function freezeStockVerifierCorpus({corpusRoot,artifactRoot}) {
  if(realpathSync(corpusRoot)!==corpusRoot || !path.isAbsolute(artifactRoot) || existsSync(path.join(artifactRoot,"stock-corpus.json")))
    throw failure("stock_verifier_corpus_destination_invalid");
  const observed=observeStockVerifierCorpus(corpusRoot),hashes=new Map(observed.files.map(row=>[row.path,row.sha256]));
  const entries=[];
  for(const row of observed.inventory.filter(row=>row.path!==".")){
    const entry={path:row.path,type:row.type,mode:row.metadata.mode,uid:row.metadata.uid,gid:row.metadata.gid};
    if(row.type==="file"){
      const content=readFileSync(path.join(corpusRoot,row.path));
      if(digest(content)!==hashes.get(row.path))throw failure("stock_verifier_corpus_changed");
      // Reuse the existing flat private-artifact grammar. Logical filesystem
      // names remain exact in each entry; raw bytes need no encoding wrapper.
      const artifact="stock-corpus-file-"+String(entries.length+1).padStart(6,"0")+".log",file=path.join(artifactRoot,artifact);
      mkdirSync(path.dirname(file),{recursive:true,mode:0o700});writeFileSync(file,content,{mode:0o600,flag:"wx"});
      Object.assign(entry,{bytes:content.length,sha256:digest(content),record:{artifact,sha256:digest(content)}});
    }
    entries.push(entry);
  }
  entries.sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
  const context=entries.find(row=>row.path==="context.json");
  if(!context)throw failure("stock_verifier_context_missing");
  const manifest={contract:CORPUS,working_root:corpusRoot,context_path:["context.json"],entries};
  const manifestFile=path.join(artifactRoot,"stock-corpus.json"),content=JSON.stringify(manifest);
  writeFileSync(manifestFile,content,{mode:0o600,flag:"wx"});
  if(!same(observeStockVerifierCorpus(corpusRoot).observation,observed.observation))throw failure("stock_verifier_corpus_changed");
  return {reference:{artifact:"stock-corpus.json",sha256:digest(Buffer.from(content))},manifest,source_observation:observed.observation};
}

function readInputManifest(inputRoot) {
  const file=path.join(inputRoot,"stock-corpus.json"),observed=observeInputFile(file,{protectedConfiguration:true});
  if(!observed.present)throw failure("stock_verifier_manifest_missing");
  const reference={artifact:"stock-corpus.json",sha256:observed.sha256};
  const manifest=parse(inputRoot,reference);
  if(manifest.contract!==CORPUS || !same(manifest.context_path,["context.json"]) || !Array.isArray(manifest.entries) ||
      manifest.entries.length<1 || manifest.entries.length>4096)throw failure("stock_verifier_manifest_invalid");
  return {manifest,reference};
}

export function restoreStockVerifierCorpus({inputRoot,canonicalRoot}) {
  if(realpathSync(canonicalRoot)!==canonicalRoot || realpathSync(inputRoot)!==inputRoot || !inside(canonicalRoot,inputRoot))
    throw failure("stock_verifier_input_containment");
  const {manifest,reference}=readInputManifest(inputRoot),root=path.join(canonicalRoot,"acquisition-proposal");
  if(manifest.working_root!==root || existsSync(root))throw failure("stock_verifier_working_root_invalid");
  let last="",total=0;
  const records=[];
  for(const row of manifest.entries){
    if(typeof row.path!=="string" || row.path<=last || row.path.split("/").some(part=>!part||part==="."||part==="..") || path.isAbsolute(row.path) ||
        !["file","directory"].includes(row.type) || gitRedirect(row.path,row.type) || !/^\d+$/u.test(row.mode??"") || (BigInt(row.mode)&0o022n)!==0n ||
        row.uid!==String(process.getuid?.()) || !/^\d+$/u.test(row.gid??""))throw failure("stock_verifier_manifest_invalid");
    last=row.path;
    if(row.type==="file"){
      const content=revisionArtifact(inputRoot,row.record,1024*1024);
      if(row.bytes!==content.length || row.sha256!==digest(content) || row.record.sha256!==row.sha256)throw failure("stock_verifier_manifest_invalid");
      total+=content.length;if(total>8*1024*1024)throw failure("stock_verifier_corpus_bound");
      records.push({row,content});
    }else if(row.record!==undefined||row.bytes!==undefined||row.sha256!==undefined)throw failure("stock_verifier_manifest_invalid");
  }
  const owner=createCanonicalTestResourceDirectory(root);beginCanonicalTestResourceUse(owner);
  try{
    for(const row of manifest.entries.filter(row=>row.type==="directory"))mkdirSync(path.join(root,row.path),{recursive:true,mode:Number(BigInt(row.mode)&0o777n)});
    for(const {row,content}of records){const file=path.join(root,row.path);mkdirSync(path.dirname(file),{recursive:true,mode:0o700});writeFileSync(file,content,{mode:Number(BigInt(row.mode)&0o777n),flag:"wx"});}
    // Only fresh task-owned output receives its declared mode. The immutable
    // input archive and historical failed attempts are never chmod targets.
    for(const row of [...manifest.entries].reverse()){
      const file=path.join(root,row.path),stat=lstatSync(file);
      if(stat.isSymbolicLink()||stat.uid!==Number(row.uid)||stat.gid!==Number(row.gid)||realpathSync(file)!==file)throw failure("stock_verifier_copy_unsafe");
      if((stat.mode&0o777)!==Number(BigInt(row.mode)&0o777n))chmodSync(file,Number(BigInt(row.mode)&0o777n));
    }
    const observed=observeStockVerifierCorpus(root),hashes=new Map(observed.files.map(v=>[v.path,v.sha256]));
    const image=observed.inventory.filter(v=>v.path!==".").map(v=>({path:v.path,type:v.type,mode:v.metadata.mode,uid:v.metadata.uid,gid:v.metadata.gid,
      ...(v.type==="file"?{bytes:Number(v.metadata.size),sha256:hashes.get(v.path)}:{})})).sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
    const expected=manifest.entries.map(({record,...row})=>row);
    if(!same(image,expected))throw failure("stock_verifier_copy_changed");
    return {owner,root,manifest,reference,observed,inputRoot};
  }catch(error){
    try{settleCanonicalTestResourceUse(owner,{exit_observed:true,streams_closed:true,cleanup_completed:true,remaining_owned_processes:0});
      const [cleanup]=cleanupCanonicalTestResources([owner]);if(!cleanup.completed)error.cleanup=cleanup;}catch(cleanupError){error.cleanup_error=cleanupError.code??String(cleanupError);}
    throw error;
  }
}

function fixtureAuthority(context,proof) {
  const records=context.authority;
  for(const record of [records.review,records.grant,...Object.values(records.linked??{})])
    if(record.user?.login!=="synthetic-fixture" || record.user?.id!==1 || record.user?.type!=="User")throw failure("stock_verifier_synthetic_authority_required");
  if(proof.pull_request!==999 || proof.branch!=="codex/reviewed-revision")throw failure("stock_verifier_synthetic_authority_required");
  const transport=createGitHubObserverAuthorizationTransport(999,{runner:async request=>{
    assert.equal(request.operation,"fetch_browser_authority");assert(request.args.includes("GET"));
    const endpoint=request.args[1],linked=records.linked?.[endpoint];
    const value=linked??(endpoint.includes("/reviews/")?records.review:endpoint.includes("/comments/")?records.grant:
      endpoint.endsWith("/pulls/999")?records.pr:{permission:"admin",user:{login:"synthetic-fixture"}});
    return clone(value);
  }});
  return authorizeReviewedRevision(proof,{transport,repositoryRoot:context.checkout});
}

export async function exerciseStockVerifier(restored,onStage=()=>{}) {
  const {root,manifest}=restored,context=JSON.parse(readFileSync(path.join(root,"context.json"),"utf8"));
  if(context.root!==root || context.checkout!==path.join(root,"checkout") || context.anchor!==path.join(root,"anchor") ||
      !inside(context.checkout,context.file) || !context.file.startsWith(path.join(context.checkout,".augnes-local-verification")+path.sep))
    throw failure("stock_verifier_context_containment");
  const proof=readSourceCorrectionProof(context.file,context.checkout),receipt=context.materialFinalReceipt;
  const capability=await fixtureAuthority(context,proof),baseline=clone(receipt.inputs),expected=gitRevisionInventory(baseline),cases=[];
  if(expected!==proof.inputs.inventory_sha256)throw failure("stock_verifier_baseline_binding");
  const stockGit=input=>input.resources.find(row=>row.id==="git-config");
  const variants=[
    ["exact_raw",true,()=>{}],
    ["changed_content",false,input=>stockGit(input).before.sha256=digest("stock verifier different complete content")],
    ["changed_permission",false,input=>stockGit(input).before.permission_identity=digest("stock verifier different permission")],
    ["changed_location",false,input=>stockGit(input).location_fingerprint=digest("stock verifier different location")],
    ["changed_scope",false,input=>{stockGit(input).gitTracking.protected_branches=[digest("stock verifier different branch")];stockGit(input).before.git_projection.scope_fingerprint=digest("stock verifier different scope");}],
    ["forged_inventory",false,()=>{}],
    ["metadata_only",true,input=>{for(const key of ["inode","mtime_ns","ctime_ns"])stockGit(input).before.metadata[key]=String(BigInt(stockGit(input).before.metadata[key])+1n);}],
  ];
  try{for(const [id,desired,mutate]of variants){
    const input=clone(baseline);mutate(input);
    const inventory=id==="forged_inventory"?digest("stock verifier forged inventory claim"):gitRevisionInventory(input);
    const live={...clone(context.live),inputInventory:input,inventory};
    // This is fixture-authored current-service data, not a host service read.
    // Historical observations and authored authority timestamps stay frozen.
    live.service.diagnostics.finished_at=new Date().toISOString();
    onStage(id);
    const actual=await inspectAttemptRecords({anchorRoot:context.anchor,repositoryRoot:context.checkout,receipt,
      revisionInputs:context.inputs,gitCurrentStockContract:CONTRACT,
      observeRevision:()=>({authorization:capability,live}),assertCurrent(){}});
    const result={id,expected:desired,actual,expected_inventory_sha256:expected,current_inventory_sha256:inventory,
      input_inventory:input,synthetic_service_observed_at:live.service.diagnostics.finished_at,
      ...(id==="metadata_only"?{changed_fields:["inode","mtime_ns","ctime_ns"]}:{})};
    cases.push(result);
    if(id!=="metadata_only")assert.equal(actual,desired,"stock verifier control: "+id);
  }}catch(error){throw Object.assign(error,{stockObservation:{cases,baseline_inventory:baseline,
    context_sha256:manifest.entries.find(row=>row.path==="context.json").sha256}});}
  return {cases,baseline_inventory:baseline,context_sha256:manifest.entries.find(row=>row.path==="context.json").sha256};
}

export function finishStockVerifierCorpus(restored) {
  let primary,after,cleanup;
  try{
    after=observeStockVerifierCorpus(restored.root);
    if(!same(restored.observed.observation,after.observation))throw failure("stock_verifier_physical_corpus_changed");
    // Recheck every protected input artifact after its last consumer settled.
    const checked=readInputManifest(restored.inputRoot);
    if(!same(checked.manifest,restored.manifest)||checked.reference.sha256!==restored.reference.sha256)throw failure("stock_verifier_manifest_changed");
    for(const entry of restored.manifest.entries.filter(row=>row.type==="file"))revisionArtifact(restored.inputRoot,entry.record,1024*1024);
  }catch(error){primary=error;}
  finally{
    settleCanonicalTestResourceUse(restored.owner,{exit_observed:true,streams_closed:true,cleanup_completed:true,remaining_owned_processes:0});
    [cleanup]=cleanupCanonicalTestResources([restored.owner]);
  }
  const result={manifest_sha256:restored.reference.sha256,working_root:restored.root,
    before:restored.observed.observation,after:after?.observation??null,cleanup};
  if(primary)throw Object.assign(primary,{corpus:result});
  if(!cleanup.completed)throw Object.assign(failure("stock_verifier_cleanup_failed"),{corpus:result});
  return result;
}
