// Retained behavioral driver: the same bytes run against each Git source.
// It reads a controlled decision fixture; it never requests a capability.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import path from "node:path";
import {pathToFileURL} from "node:url";

const {body,p,commission}=JSON.parse(readFileSync(process.env.AUGNES_AUTHORITY_SCOPE_FIXTURE,"utf8"));
const {permitsFinalDependencySuccessor:permits}=await import(pathToFileURL(path.resolve("scripts/local-canonical-git-observation.mjs")));
const boundary="### Exact historical boundary and existing authority", correction="### Authorized bounded source correction";
const active=body.slice(body.indexOf(boundary)+boundary.length,body.indexOf(correction)).trim();
const pair=["Actual latest attempt: "+p.prior_attempt_id,"Latest failed receipt: "+p.prior_receipt_fingerprint];
const missing=body.split("\n").filter(line=>!pair.includes(line)).join("\n");
const appendix="\n\n### Historical comparison — excluded from this authorization\n\nThis other target is not approved.\n\n";
const other=body.replace(p.prior_attempt_id,"other-candidate-attempt").replace(p.prior_receipt_fingerprint,"0".repeat(64));
const excluded="Historical comparison only — this predecessor is excluded";
const cases=[
  ["genuine",body,true],
  ["genuine with excluded history",body+appendix+other.slice(other.indexOf(boundary),other.indexOf(correction)).replace(boundary,"Rejected target:"),true],
  ["complete excluded target",other+appendix+active,false],
  ["missing predecessor under indented heading",missing.replace(correction," ### "+excluded+"\n\n"+pair.join("\n")+"\n\n"+correction),false],
  ["missing predecessor in inline example",missing.replace(correction,"Excluded example: `\n"+pair.join("\n")+"\n`\n\n"+correction),false],
  ["missing predecessor in list",missing.replace(correction,"- "+excluded+":\n"+pair.map(l=>"  "+l).join("\n")+"\n\n"+correction),false],
  ["reordered record with blank separators",body.replace(active,active.split(/\n+/u).reverse().join("\n\n")),true],
];
for(const [name,text,expected] of cases){
  const actual=permits(text,p,commission);
  console.log(JSON.stringify({name,expected,actual}));
  assert.equal(actual,expected,name);
}
console.log(JSON.stringify({retained_authority_regression:"pass",cases:cases.length,capability_requested:false,reservation_invoked:false}));
