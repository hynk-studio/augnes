// Isolated subprocess of the synthetic contract owner, not an execution CLI.
import fs from "node:fs";
import path from "node:path";
import { digest } from "../local-canonical-inputs.mjs";
import { canonicalSerialize } from "../local-canonical-receipt.mjs";
import { acquireCheckoutVerificationOwnership, releaseCheckoutVerificationOwnership, checkoutVerificationFingerprint } from "../local-canonical-checkout-ownership.mjs";
import { beginAttempt, finishAttempt, readSourceCorrectionProof, improvementMaterial } from "../local-canonical-attempts.mjs";
import { authorizeImprovement, improvementAuthorityObservation } from "../local-canonical-improvement.mjs";
const q=JSON.parse(fs.readFileSync(process.argv[2]));
const folder=path.join(q.checkout,".augnes-local-verification/improvement"),file=path.join(folder,"proof.json");
const read=name=>JSON.parse(fs.readFileSync(path.join(folder,name)));
const write=(name,value)=>fs.writeFileSync(path.join(folder,name),typeof value==="string"?value:canonicalSerialize(value),{mode:0o600});
const ref=name=>({artifact:name,sha256:digest(fs.readFileSync(path.join(folder,name)))});
const owner=acquireCheckoutVerificationOwnership({repositoryRoot:q.checkout});
let reserved=false,code=null;
try{
  const p=read("proof.json"),c=read("campaign.json"),r=read("review.json");
  c.target.checkout_fingerprint=checkoutVerificationFingerprint(q.checkout);write("campaign.json",c);p.campaign=ref("campaign.json");
  r.campaign_sha256=digest(c);write("review.md",`Synthetic race review ${p.head} ${r.delta_sha256} ${digest(c)}\n`);r.report=ref("review.md");write("review.json",r);p.review=ref("review.json");
  for(const key of ["acceptance","grant"]){const record=q.records[key],newline=record.body.indexOf("\n"),body=JSON.parse(record.body.slice(newline+1));body.campaign_sha256=digest(c);body.review_sha256=digest(r);
    if(key==="acceptance")body.independent_report_sha256=r.report.sha256;else body.acceptance_sha256=digest(improvementAuthorityObservation(q.records.acceptance,"accepted_improvement"));
    record.body=record.body.slice(0,newline+1)+canonicalSerialize(body);
  }
  p.authorization.acceptance_review_sha256=digest(improvementAuthorityObservation(q.records.acceptance,"accepted_improvement"));p.authorization.grant_comment_sha256=digest(improvementAuthorityObservation(q.records.grant,"prospective_grant"));write("proof.json",p);
  const proof=readSourceCorrectionProof(file,q.checkout);
  const transport={review:async()=>q.records.acceptance,grant:async()=>q.records.grant,permission:async()=>q.records.acceptance_permission,pullRequest:async()=>q.records.pull_request};
  const a=await beginAttempt({anchorRoot:q.anchor,repositoryRoot:q.checkout,checkoutOwner:owner,branch:p.branch,head:p.head,tree:p.tree,runId:"race-"+q.index,contractFingerprint:digest("synthetic race"),sourceCorrection:proof,acceptedMain:p.base,revisionInputs:q.inputs,assertCurrent:()=>{},
    observeRevision:async()=>{const authorization=await authorizeImprovement(proof,improvementMaterial(q.checkout,proof),transport);fs.writeFileSync(path.join(q.barrier,"ready-"+q.index),"ready");
      const deadline=Date.now()+10000;while(!fs.existsSync(path.join(q.barrier,"release"))&&Date.now()<deadline)await new Promise(r=>setTimeout(r,5));
      if(!fs.existsSync(path.join(q.barrier,"release")))throw new Error("barrier_timeout");return{authorization,live:null};}});
  reserved=true;finishAttempt(a,{receiptFingerprint:digest("synthetic race settlement"),disposition:"user_cancellation",cleanupComplete:true});
}catch(error){code=error.code??error.message;}
finally{releaseCheckoutVerificationOwnership(owner,q.checkout);}
console.log(JSON.stringify({reserved,code,phases:0,synthetic_only:true}));
