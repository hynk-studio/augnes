import assert from "node:assert/strict";
import {digest} from "../local-canonical-inputs.mjs";
import {readRequestBoundAllowanceDelegation,REQUEST_BOUND_DELEGATION_TEMPLATE,REQUEST_BOUND_GRANT,REQUEST_BOUND_LIMIT} from "../local-canonical-request-bound-authority.mjs";
import {delegatesMaterialSourceCommission,MATERIAL_SOURCE_CORRECTION,MATERIAL_HISTORY_BOUNDARY,requestBoundAllowanceAuthorityBindings} from "../local-canonical-git-observation.mjs";
import {REGISTERED_REQUEST_BOUND_ALLOWANCE} from "../local-canonical-fixture-budget-witness.mjs";
import {reviewedRevisionAuthorityObservation,validateReviewedRevisionAuthorityRecords} from "../local-canonical-attempts.mjs";

// Disposable records exercise the production authority reader. They are neither
// authenticated authority nor preparation, admission or a deciding invocation.
export function requestBoundAuthorityControls() {
  const hash=s=>digest("request-bound authority control "+s),commit=s=>s.repeat(40),stamp=n=>new Date(1700000000000+n).toISOString();
  const ref=s=>({artifact:s+".json",sha256:hash(s)});
  const p={schema:"augnes.local-canonical-source-correction.v7",kind:"reviewed_revision",pull_request:999,branch:"codex/controlled-request-bound",
    base:commit("a"),head:commit("b"),tree:commit("c"),prior_family_id:hash("family"),prior_number:1,prior_attempt_id:"controlled-spent",prior_receipt_fingerprint:hash("receipt"),
    originals:Object.fromEntries(["receipt","attempt","completion","stock"].map(s=>[s,ref(s)])),source:ref("source"),focused:ref("focused"),
    inputs:{predecessor_sha256:hash("prior inputs"),identity_sha256:hash("runtime"),inventory_sha256:hash("inventory"),current:ref("runtime")},
    accepted:{base:commit("a"),head:commit("b"),tree:commit("c"),review:{id:10,sha256:hash("review")}},authorization:{grant_comment_id:20,grant_sha256:hash("grant")},
    commission:{root_family_id:hash("family"),root_number:1,root_attempt_id:"controlled-spent",root_receipt_fingerprint:hash("receipt"),ordinal:1,maximum_invocations:1,
      source_revision:MATERIAL_SOURCE_CORRECTION,evidence_kind:REGISTERED_REQUEST_BOUND_ALLOWANCE,delegation:{id:30,sha256:hash("delegation")}}};
  const fields={revision:12,previous_revision:11,branch:p.branch,pull_request:p.pull_request,starting_base:commit("d"),starting_head:commit("e"),starting_tree:commit("f"),
    family:p.prior_family_id,attempt:p.prior_attempt_id,receipt:p.prior_receipt_fingerprint,commission:hash("spent commission"),receiving_review_id:40,
    full_ms:100000,integration_ms:90000,selected_ms:200000,checkpoint_ms:28000};
  const body=REQUEST_BOUND_DELEGATION_TEMPLATE.replace(/[{]([a-z_]+)[}]/gu,(_,key)=>String(fields[key]));
  assert(readRequestBoundAllowanceDelegation(body,p));assert(delegatesMaterialSourceCommission(body,p));let refusals=0;
  const refuse=(text,q=p)=>{assert.equal(readRequestBoundAllowanceDelegation(text,q),null);assert.equal(delegatesMaterialSourceCommission(text,q),false);refusals++;};
  for(const change of [
    s=>s.replace(p.branch,"codex/wrong"),s=>s.replace("Draft PR #999","Draft PR #998"),s=>s.replace(p.prior_family_id,hash("wrong family")),
    s=>s.replace(p.prior_attempt_id,"other-attempt"),s=>s.replace(p.prior_receipt_fingerprint,hash("wrong receipt")),
    s=>"<!-- "+s+" -->",s=>"> "+s,s=>"```\n"+s+"\n```",s=>s+"\nAuthorize another invocation.",
    s=>s.replace("exactly one NEW commission","two NEW commissions"),s=>s.replace("Complete the bounded","Do not complete the bounded"),
    s=>s.replace("Preserve the Native","\u202ePreserve the Native"),s=>s.replace("Consumed: 1 of 1; remaining: 0.","Consumed: 0 of 1; remaining: 1."),
  ])refuse(change(body));
  refuse(body,{...p,commission:{...p.commission,evidence_kind:"registered-integration-child-budget-v1"}});
  refuse(body,{...p,commission:{...p.commission,evidence_kind:"registered-fixture-aggregate-budget-v1"}});
  const user={id:2,login:"fixture-maintainer",type:"User"},permission={user:{login:user.login},permission:"maintain"};
  const delegation={id:30,user,author_association:"COLLABORATOR",issue_url:"https://api.github.com/repos/hynk-studio/augnes/issues/999",created_at:stamp(0),updated_at:stamp(0),body};
  p.commission.delegation.sha256=digest(reviewedRevisionAuthorityObservation(delegation,"task_delegation"));
  const bindings=requestBoundAllowanceAuthorityBindings(p);
  const review={id:10,user,author_association:"COLLABORATOR",state:"COMMENTED",commit_id:p.head,pull_request_url:"https://api.github.com/repos/hynk-studio/augnes/pulls/999",submitted_at:stamp(1000),
    body:["Source review decision: ACCEPT / RETAIN for prospective qualification.",bindings,MATERIAL_HISTORY_BOUNDARY].join("\n\n")};
  const grant={id:20,user,author_association:"COLLABORATOR",issue_url:delegation.issue_url,created_at:stamp(2000),updated_at:stamp(2000),
    body:[REQUEST_BOUND_GRANT,bindings,"Accepted review: https://github.com/hynk-studio/augnes/pull/999#pullrequestreview-10",MATERIAL_HISTORY_BOUNDARY,REQUEST_BOUND_LIMIT].join("\n\n")};
  const permissions={accepted_revision:permission,execution_commission:permission,task_delegation:permission};
  const pr={number:999,state:"open",draft:true,merged:false,auto_merge:null,head:{sha:p.head,ref:p.branch,repo:{full_name:"hynk-studio/augnes"}},base:{sha:p.base,ref:"main",repo:{full_name:"hynk-studio/augnes"}}};
  const inspect=v=>{
    // Rebind mutated records, so a rejection cannot be explained by a stale hash.
    v.p.accepted.review.sha256=digest(reviewedRevisionAuthorityObservation(v.review,"accepted_revision"));
    v.p.authorization.grant_sha256=digest(reviewedRevisionAuthorityObservation(v.grant,"execution_commission"));
    v.p.commission.delegation.sha256=digest(reviewedRevisionAuthorityObservation(v.delegation,"task_delegation"));
    return validateReviewedRevisionAuthorityRecords(v.p,v.review,v.grant,v.permissions,v.pr,null,null,v.delegation);
  };
  const fixture={p,review,grant,permissions,pr,delegation};assert.equal(Object.keys(inspect(fixture)).length,3);
  for(const mutate of [
    v=>v.review.body=body,v=>v.grant.body=body,v=>v.grant.body+="\n\nExtra authority.",
    v=>v.grant.body=v.grant.body.replace("Exactly one admitted","Two admitted"),
    v=>v.grant.updated_at=stamp(3000),v=>v.grant.created_at=v.grant.updated_at=stamp(500),
    v=>v.permissions.execution_commission.permission="read",v=>v.pr.head.sha=commit("d"),
    v=>v.p.authorization.grant_comment_id=v.delegation.id,
  ]){const v=structuredClone(fixture);mutate(v);assert.throws(()=>inspect(v));refusals++;}
  return {synthetic_only:true,deciding:false,visible_delegation_accepted:true,distinct_review_and_grant_required:true,refusals};
}
