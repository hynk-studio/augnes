import assert from "node:assert/strict";
import { writeStockVerifierSummary } from "./local-canonical-stock-verifier-output.mjs";
import { readFileSync, realpathSync } from "node:fs";
import { createHash } from "node:crypto";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

// One candidate driver in both observations. Its two implicated modules are
// attributed by the collector. There is no role or revision selector here.
const repositoryRoot=realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)),".."));
const hash=bytes=>createHash("sha256").update(bytes).digest("hex"),loaded=new Map();
function observeSource(url){
  if(!url.startsWith("file:"))return;
  const file=fileURLToPath(url),relative=path.relative(repositoryRoot,file);
  if(relative.startsWith("..")||path.isAbsolute(relative)||relative.split(path.sep).includes("node_modules"))return;
  if(loaded.size>=512&&!loaded.has(relative))throw new Error("stock_verifier_import_bound");
  const bytes=readFileSync(file);loaded.set(relative,{path:relative,byte_size:bytes.length,sha256:hash(bytes)});
}
observeSource(import.meta.url);
observeSource(new URL("./local-canonical-stock-verifier-output.mjs",import.meta.url).href);
const hook=registerHooks({load(url,context,nextLoad){const result=nextLoad(url,context);observeSource(url);return result;}});
let restored,helpers,observation,corpus,primary=null,stage="imports",primaryStage=null,importsComplete=false,assertionsComplete=false;
const cleanupErrors=[],checkpoints=[];
const errorValue=error=>({name:String(error?.name??"Error"),code:error?.code??null,message:String(error?.message??error).slice(0,512),
  ...(error?.code==="ERR_ASSERTION"?{actual:error.actual,expected:error.expected}:{} )});
try{
  helpers=await import("./fixtures/local-canonical-stock-verifier.mjs");importsComplete=true;stage="setup";
  const canonicalRoot=realpathSync(process.env.AUGNES_CANONICAL_TEMP_ROOT??"");
  restored=helpers.restoreStockVerifierCorpus({inputRoot:path.join(canonicalRoot,"stock-verifier-input"),canonicalRoot});
  stage="stock_controls";
  observation=await helpers.exerciseStockVerifier(restored,id=>{checkpoints.push(id);});
  stage="metadata_only_assertion";
  const metadata=observation.cases.at(-1);
  assert.equal(metadata.actual,true,"complete byte-identical Git metadata replacement must preserve current stock applicability");
  assertionsComplete=true;
}catch(error){primary=error;primaryStage=stage;observation=error.stockObservation??observation;}
finally{
  if(restored)try{corpus=helpers.finishStockVerifierCorpus(restored);}catch(error){corpus=error.corpus??null;cleanupErrors.push(errorValue(error));}
  hook.deregister();
}
const summary={contract:"augnes.common-stock-verifier-observation.v1",imports_complete:importsComplete,assertions_complete:assertionsComplete,
  cleanup_complete:cleanupErrors.length===0&&Boolean(corpus?.cleanup?.completed),cleanup_errors:cleanupErrors,
  primary_error_stage:primaryStage,primary_error:primary?errorValue(primary):null,
  cases:observation?.cases??[],baseline_inventory:observation?.baseline_inventory??null,
  corpus:corpus??null,context_sha256:observation?.context_sha256??null,
  physical_accounting_unchanged:Boolean(corpus&&JSON.stringify(corpus.before)===JSON.stringify(corpus.after)),
  synthetic_authority:true,remote_requests:0,checkpoints,
  synthetic_clock:"Frozen synthetic authority/history timestamps; new cloned service fixture finished_at per stock call; no historical record edits or host service observation.",
  imports_scope:"Node-loaded project source only; complete effective candidate catalogue and runtime/dependencies bind the remaining inputs",
  actual_imports:[...loaded.values()].sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0)};
try { await writeStockVerifierSummary(summary); }
catch(error) {
  if(primary) {
    try { primary.output_error=errorValue(error); } catch { /* Preserve the original error even if diagnostic attachment refuses. */ }
    throw primary;
  }
  if(cleanupErrors.length)throw Object.assign(new Error("stock_verifier_cleanup_failed"),{code:"stock_verifier_cleanup_failed",cleanup_errors:cleanupErrors,output_error:errorValue(error)});
  throw error;
}
if(primary)throw primary;
if(cleanupErrors.length)throw Object.assign(new Error("stock_verifier_cleanup_failed"),{code:"stock_verifier_cleanup_failed"});
