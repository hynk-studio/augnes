import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from "node:fs";
import path from "node:path";
import {execFileSync} from "node:child_process";
import {digest} from "../local-canonical-inputs.mjs";
import {REGISTERED_REQUEST_BOUND_ALLOWANCE,REQUEST_BOUND_ALLOWANCE_CLAIM,REQUEST_BOUND_OWNER,
  REQUEST_BOUND_BASELINE_ACCEPT,REQUEST_BOUND_COVERAGE_OBLIGATIONS,requestBoundAllowanceRegistration,
  requestBoundAllowanceSourcePartition,validateRequestBoundAllowanceTrace,validateRequestBoundBaselineAuthority,
  verifyRequestBoundAllowance,inspectCurrentRequestBoundInputs} from "../local-canonical-fixture-budget-witness.mjs";

// Disposable protocol/source controls only. They never run the product child,
// authenticate real authority, prepare a target or consume a deciding grant.
export function requestBoundAllowanceControls(parent) {
  const root=mkdtempSync(path.join(parent,"request-bound-allowance-"));
  const git=args=>execFileSync("git",["--no-replace-objects",...args],{cwd:root,timeout:10000,maxBuffer:16*1024*1024,stdio:["ignore","pipe","pipe"]});
  const write=(file,value)=>{mkdirSync(path.dirname(path.join(root,file)),{recursive:true});writeFileSync(path.join(root,file),value);};
  const commit=message=>{git(["add","."]);git(["-c","user.name=Fixture","-c","user.email=fixture@example.invalid","commit","-m",message]);return git(["rev-parse","HEAD"]).toString().trim();};
  const reset=head=>git(["reset","--hard",head]);let refusals=0;
  const rejects=fn=>{assert.throws(fn);refusals++;};
  const suite=limit=>'const repoRoot="fixture";\nconst rootNode=(...args)=>({command:process.execPath,args:["--import","tsx",...args],cwd:repoRoot,});\n'+
    'const suites={integration:[{id:"request-bound-review",group:"supporting-serial",requirements:["database","migrations","filesystem","process-owning","listener-port-owning","mutable-module-state"],label:"request fixture",...rootNode("scripts/test-request-bound-review.ts"),timeoutMs:'+limit+',requireNaturalExit:true}]};\n';
  const suitePath="scripts/run-canonical-test-suite.mjs",fixture="scripts/test-request-bound-review.ts",enrollment="scripts/test-review-callback-enrollment.ts";
  try {
    git(["init","--initial-branch=fixture"]);
    write(suitePath,suite(30000));write(fixture,'export const assertedFixture="all original request/read/reply and refusal assertions";\n');
    write(enrollment,'export const assertedChain="approval backup revoke restore stale-refusal fresh-approval";\n');
    write("scripts/canonical-child-runner.mjs","const DEFAULT_CANONICAL_TERM_GRACE_MS=8000;const DEFAULT_CANONICAL_KILL_GRACE_MS=5000;\n");
    write("scripts/run-local-canonical-verification.mjs",'npmPhase("integration",null,["run","test:integration"],4200000);\nnpmPhase("integration",null,["run","test:integration"],4200000);\n');
    const prior=commit("controlled predecessor");
    write(".github/LOCAL_CANONICAL_VERIFICATION.md","controlled integrated baseline\n");const baseline=commit("controlled integrated baseline");
    write("scripts/local-canonical-request-bound-authority.mjs","export const typedOwner=true;\n");const before=commit("controlled evidence owner");
    write(suitePath,suite(45000));const final=commit("controlled dedicated allowance");
    const partition=requestBoundAllowanceSourcePartition(git,baseline,final,prior,before);
    assert.equal(requestBoundAllowanceRegistration(git,final).child_ms,45000);
    assert.equal(partition.baseline.fixture_sha256,partition.after.fixture_sha256);
    for(const [file,value]of [
      [suitePath,suite(46000)],[suitePath,suite(45000).replace('group:"supporting-serial"','group:"operator-process"')],
      [fixture,"export const omittedAssertions=true;\n"],[enrollment,"export const omittedStaleRefusal=true;\n"],
      ["lib/unrelated-product.mjs","export const changed=true;\n"],
      ["scripts/canonical-child-runner.mjs","const DEFAULT_CANONICAL_TERM_GRACE_MS=100;const DEFAULT_CANONICAL_KILL_GRACE_MS=5000;\n"],
    ]) {
      write(file,value);const changed=commit("controlled forbidden delta");
      rejects(()=>requestBoundAllowanceSourcePartition(git,baseline,changed,prior,before));reset(final);
    }
    rejects(()=>requestBoundAllowanceSourcePartition(git,final,final,prior,before));
    const p={pull_request:999,commission:{evidence_kind:REGISTERED_REQUEST_BOUND_ALLOWANCE}};
    const bad={failed_phase:"integration",input_remedy_resources:[],implicated_paths:[suitePath],regression:{
      kind:REGISTERED_REQUEST_BOUND_ALLOWANCE,claim:REQUEST_BOUND_ALLOWANCE_CLAIM,owner:{...REQUEST_BOUND_OWNER,group:"external-response"},
      incident:{},accepted_baseline:{},before:{},after:{},coverage_review:{}}};
    rejects(()=>verifyRequestBoundAllowance(p,null,bad,{}));
    rejects(()=>inspectCurrentRequestBoundInputs(root,{contract:"augnes.request-bound-allowance-witness.v1",role:"request-bound-before",group:REQUEST_BOUND_OWNER.group}));
    const baselineBinding={base:prior,head:baseline,tree:git(["rev-parse",baseline+"^{tree}"]).toString().trim(),receiving_review:{id:10,sha256:""}};
    const record={id:10,user:{id:1,login:"fixture-owner",type:"User"},author_association:"OWNER",state:"COMMENTED",commit_id:baseline,
      pull_request_url:"https://api.github.com/repos/hynk-studio/augnes/pulls/999",submitted_at:"2026-01-01T00:00:02Z",
      body:[REQUEST_BOUND_BASELINE_ACCEPT,baselineBinding.base,baselineBinding.head,baselineBinding.tree].join("\n")};
    const observation=r=>({id:r.id,author:r.user.login,author_id:r.user.id,body_sha256:digest(r.body),timestamp:r.submitted_at,role:"accepted_revision",commit_id:r.commit_id});
    baselineBinding.receiving_review.sha256=digest(observation(record));
    const permission={user:{login:"fixture-owner"},permission:"maintain"};
    const chronology={completedAt:"2026-01-01T00:00:00Z",delegationAt:"2026-01-01T00:00:01Z",beforeStartedAt:"2026-01-01T00:00:03Z"};
    assert.deepEqual(validateRequestBoundBaselineAuthority(p,baselineBinding,record,permission,chronology),observation(record));
    for(const mutate of [
      r=>r.body+=" edited",r=>r.commit_id=prior,r=>r.submitted_at="2026-01-01T00:00:00Z",
      r=>r.submitted_at="2026-01-01T00:00:04Z",r=>r.state="DISMISSED",r=>r.user.type="Bot",
    ]) {const changed=structuredClone(record);mutate(changed);rejects(()=>validateRequestBoundBaselineAuthority(p,baselineBinding,changed,permission,chronology));}
    rejects(()=>validateRequestBoundBaselineAuthority(p,baselineBinding,record,{...permission,permission:"read"},chronology));
    const trace=requestBoundTraceControl();
    console.log(JSON.stringify({request_bound_allowance_controls:{synthetic_only:true,deciding:false,real_request_child_executed:false,
      source_partition_accepted:true,post_delegation_baseline_accepted:true,coverage_obligations:REQUEST_BOUND_COVERAGE_OBLIGATIONS,
      refusals:refusals+trace.refusals,trace}}));
    return {refusals:refusals+trace.refusals,source_partition_accepted:true,trace};
  } finally {rmSync(root,{recursive:true,force:true});}
}

function requestBoundTraceControl() {
  const pair=stage=>[[stage,"begin"],[stage,"end"]];
  const expected=[["test","begin"],...["revoke_after_backup","database_restore","post_restore_preparation","restored_database_invariants"].flatMap(pair),
    ["enrollment_restoration","begin"],...["inspect_restored","stale_decision_refusal","restored_subscription_refusal","restored_unsubscribe",
      "expired_subscription_observation","inspect_fresh_pending","select_fresh","fresh_approval","fresh_subscribe","fresh_unsubscribe"].map(s=>"enrollment/"+s).flatMap(pair),
    ["enrollment_restoration","end"],...["later_request","later_read","later_reply"].flatMap(pair),["cleanup","begin"],
    ...["close_protocol_client","close_http_server","close_database","remove_fixture_root"].flatMap(pair),["cleanup","end"],["test","end"]];
  const starts=new Map(),trace=expected.map(([stage,boundary],i)=>{
    if(boundary==="begin")starts.set(stage,i);
    return {test:"request-bound-review-monotonic",stage,boundary,elapsed_ms:i,since_process_ms:i+100,
      ...(boundary==="end"?{duration_ms:i-starts.get(stage)}:{})};
  });
  const names=["setup_and_first_explicit_cycle","isolation_replay_conflict_and_readback","events_and_adapter_restart","second_explicit_cycle",
    "version_and_project_races","callback_enrollment","scoped_discovery_and_authority","database_backup","database_restore",
    "post_restore_preparation","later_request_after_recovery","cleanup"];
  const phases=names.map(completed=>({test:"request-bound-review-phase",completed,duration_ms:0}));
  const report={test:"request-bound-review",status:"pass",categories:{A:"PASS",B:"PASS",C:"PASS",D:"PASS",E:"PASS local protocol fixtures",
    F:"PASS",G:"PASS scripted use; real model/comparison NOT_RUN"},setup_cycles:1,ordinary_cycles:2,scripted_human_relay:0,callbacks:1,
    actual_chatgpt:"NOT_RUN",real_model_use:"NOT_RUN",burden_comparison:"NOT_RUN",provider_cost:"unknown",
    phase_ms:Object.fromEntries(names.map(n=>[n,0]))};
  const rows=[...phases.slice(0,8),...trace,...phases.slice(8),report],log=r=>r.map(v=>JSON.stringify(v)).join("\n")+"\n";
  assert(validateRequestBoundAllowanceTrace(log(rows),1000));let refusals=0;
  for(const mutate of [
    r=>r.splice(r.findIndex(v=>v.stage==="later_reply"&&v.boundary==="end"),1),
    r=>r.find(v=>v.stage==="close_database").stage="close_other",
    r=>r.find(v=>v.stage==="enrollment/fresh_approval").elapsed_ms=-1,
    r=>r.find(v=>v.stage==="enrollment/stale_decision_refusal"&&v.boundary==="end").duration_ms=99,
    r=>r.at(-1).categories.F="NOT_RUN",r=>r.at(-1).actual_chatgpt="PASS",
  ]) {const changed=structuredClone(rows);mutate(changed);assert.throws(()=>validateRequestBoundAllowanceTrace(log(changed),1000));refusals++;}
  return {complete_monotonic_trace_accepted:true,refusals};
}

