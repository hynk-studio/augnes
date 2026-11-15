// Frozen candidate driver for retained failed-predecessor admission. The prior
// role replaces only the two implicated readers; this driver and its support
// never claim to have existed at the predecessor or to qualify the product.
import assert from "node:assert/strict";
import {readFileSync,lstatSync,realpathSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {digest} from "./local-canonical-inputs.mjs";
import {verifyReceiptIntegrity} from "./local-canonical-receipt.mjs";
import {MATERIAL_SOURCE_CORRECTION,GIT_CURRENT_STOCK_COMPARISON,gitRevisionInventory,
  gitRevisionStockComparison,verifyGitRevisionFailure} from "./local-canonical-git-observation.mjs";
import {MATERIAL_CURRENT_STOCK_GIT_MISMATCH,verifyMaterialCurrentStockMismatchPredecessor,
  verifiedMaterialCurrentStockMismatchPredecessor} from "./local-canonical-material-stock-predecessor.mjs";

const scope="candidate-reader-with-prior-strict-modules; retained-material-failure-admission-not-qualification";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),".."),temporary=process.env.AUGNES_CANONICAL_TEMP_ROOT;
assert(temporary&&path.isAbsolute(temporary)&&realpathSync(temporary)===temporary);
const file=path.join(temporary,"material-stock-input.json"),stat=lstatSync(file);
assert(stat.isFile()&&!stat.isSymbolicLink()&&stat.nlink===1&&stat.size>0&&stat.size<=2*1024*1024&&realpathSync(file)===file);
const bytes=readFileSync(file),input=JSON.parse(bytes),keys=(v,names)=>assert.deepEqual(Object.keys(v).sort(),[...names].sort());
keys(input,["contract","originals"]);keys(input.originals,["receipt","attempt","stock","observation"]);
assert.equal(input.contract,"augnes.material-stock-mismatch-input.v1");
for(const value of Object.values(input.originals))assert.equal(typeof value,"string");
const original=JSON.parse(input.originals.receipt),prior=JSON.parse(input.originals.attempt),snapshot=JSON.parse(input.originals.observation);
const rawStock=input.originals.stock;assert(rawStock.indexOf("{")>=0);const stock=JSON.parse(rawStock.slice(rawStock.indexOf("{")));
assert(verifyReceiptIntegrity(original));assert.deepEqual(original.attempt,prior);
assert.equal(stock.valid_deciding_evidence,false);assert(stock.issues.includes("receipt_attempt_records_unverified"));
const comparison=gitRevisionStockComparison(original.inputs,snapshot.inputInventory,GIT_CURRENT_STOCK_COMPARISON);
assert.deepEqual(comparison,stock.current_stock_input_comparison);assert.equal(comparison.exact,false);assert.equal(comparison.equivalent,false);
const ref={artifact:"retained-complete-observation.json",sha256:digest(Buffer.from(input.originals.observation))};
const p={schema:"augnes.local-canonical-source-correction.v7",kind:"reviewed_revision",
  commission:{source_revision:MATERIAL_SOURCE_CORRECTION,ordinal:1,maximum_invocations:1},
  prior_family_id:prior.family_id,prior_number:prior.number,prior_attempt_id:prior.attempt_id,prior_receipt_fingerprint:original.integrity.content_fingerprint};
const focused={finished_at:new Date().toISOString(),predecessor_stock:{contract:MATERIAL_CURRENT_STOCK_GIT_MISMATCH,observation:ref}};
const token=verifyMaterialCurrentStockMismatchPredecessor(p,prior,focused,{original,stock,parse:reference=>{
  assert.deepEqual(reference,ref);return snapshot;
},inventory:gitRevisionInventory,stockComparison:gitRevisionStockComparison,stockContract:GIT_CURRENT_STOCK_COMPARISON});
assert(verifiedMaterialCurrentStockMismatchPredecessor(token,original,stock));
const saved=digest({original,prior,stock,snapshot});let decision,refusal_controls=0,failure;
try {
  verifyGitRevisionFailure(original,stock,snapshot.runtime,original.phases.map(v=>v.id),1,false,false,false,true,null,null,token);
  decision={status:"pass"};
}catch(error){decision={status:"failure",error_code:error.code??error.message};failure=error;}
if(!failure){
  const {runMaterialCurrentStockMismatchControls}=await import("./fixtures/local-canonical-material-source.mjs");
  const controls=runMaterialCurrentStockMismatchControls({inputs:snapshot.runtime},original,receipt=>({...structuredClone(stock),
    content_fingerprint:receipt.integrity.content_fingerprint,issues:stock.issues.filter(v=>v!=="receipt_attempt_records_unverified")}),{quiet:true});
  assert.equal(controls.accepted,1);assert.equal(controls.refused,35);refusal_controls=controls.refused;
}
assert.equal(digest({original,prior,stock,snapshot}),saved);assert(readFileSync(file).equals(bytes));
const implicated_sources=["scripts/local-canonical-browser-revision.mjs","scripts/local-canonical-git-observation.mjs"].map(name=>{
  const content=readFileSync(path.join(root,name));return{path:name,byte_size:content.length,sha256:digest(content)};
});
console.log("AUGNES_MATERIAL_STOCK_MISMATCH "+JSON.stringify({contract:"augnes.material-stock-mismatch-boundary.v1",scope,
  input_sha256:digest(bytes),historical_sha256:digest(input.originals),
  originals:Object.fromEntries(Object.entries(input.originals).map(([name,value])=>[name,digest(Buffer.from(value))])),
  implicated_sources,decision,refusal_controls,historical_stock_preserved:true,complete_git_still_inequivalent:true,
  lineage_unverified_preserved:true,deciding:false,cleanup_complete:true}));
if(failure)throw failure;
