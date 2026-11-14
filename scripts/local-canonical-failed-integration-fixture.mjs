// One retained registered-fixture failure, within the existing maintenance
// lifecycle. This reader grants no reservation, retry, or execution authority.
import path from "node:path";
import { digest, validCanonicalRuntimeInputs, preparedDependencyIdentity, PREPARED_DEPENDENCY_CONTRACT } from "./local-canonical-inputs.mjs";
import { CANONICAL_NODE_VERSION } from "./local-canonical-environment.mjs";
import { artifactReader } from "./local-canonical-improvement.mjs";
import { registeredFixtureBudget } from "./local-canonical-fixture-budget-witness.mjs";
import { gitRevisionInventory } from "./local-canonical-git-observation.mjs";

export const FAILED_INTEGRATION_FIXTURE_CASE = "failed-reviewed-integration-material-stock-partition-v1";
export const isFailedIntegrationFixture = p => p?.schema === "augnes.local-canonical-source-correction.v2" &&
  p.kind === "prospective_maintenance" && p.incident_case === FAILED_INTEGRATION_FIXTURE_CASE;

const fail = code => { throw Object.assign(new Error("maintenance_fixture_" + code), {code:"maintenance_fixture_" + code}); };
const requireThat = (ok,code) => { if (!ok) fail(code); };
const equal = (a,b) => a !== undefined && b !== undefined && digest(a) === digest(b);
const keys = (v,s) => requireThat(v && typeof v === "object" && !Array.isArray(v) && equal(Object.keys(v).sort(),s.split(" ").sort()),"shape_invalid");
const sha = x => typeof x === "string" && /^[a-f0-9]{64}$/u.test(x);
const gitId = x => typeof x === "string" && /^[a-f0-9]{40}$/u.test(x);
const integer = x => Number.isSafeInteger(x) && x >= 0;
const utc = x => typeof x === "string" && Number.isFinite(Date.parse(x)) && new Date(x).toISOString() === x && Date.parse(x) <= Date.now();
const targetFields = "branch base head tree pull_request prior_family_id prior_number prior_attempt_id prior_receipt_fingerprint";
const target = p => Object.fromEntries(targetFields.split(" ").map(k=>[k,p[k]]));
const dependencyPhases = ["dependencies-root","dependencies-nested","dependencies-web-planning"];
const browserPhases = ["e2e-project-experience","e2e-operator-review-control","e2e-operator-native-host-execution",
  "e2e-operator-work-expectation","e2e-operator-multi-candidate","e2e-continuity","e2e-golden"];
const phases = [...dependencyPhases,"typecheck","build","unit","authority","integration","operability",...browserPhases];
const fixtureFile = "scripts/fixtures/local-canonical-material-source.mjs";
const partitionPaths = [fixtureFile,"scripts/fixtures/local-canonical-reviewed-revision.mjs","scripts/run-canonical-test-suite.mjs",
  "scripts/test-local-canonical-review-corrections.mjs","scripts/test-local-canonical-verification-contract.mjs"].sort();
const sourcePaths = [...partitionPaths,"scripts/local-canonical-attempts.mjs","scripts/local-canonical-receipt.mjs",
  "scripts/run-local-canonical-verification.mjs","scripts/local-canonical-fixture-budget-witness.mjs",
  "scripts/local-canonical-closeout-budgets.mjs",".github/LOCAL_CANONICAL_VERIFICATION.md"].sort();
const supportPaths = new Set(["scripts/local-canonical-failed-integration-fixture.mjs","scripts/local-canonical-maintenance.mjs",
  "scripts/local-canonical-attempts.mjs","scripts/local-canonical-receipt.mjs","scripts/run-local-canonical-verification.mjs",
  "scripts/test-local-canonical-maintenance.mjs","scripts/fixtures/local-canonical-failed-integration-maintenance.mjs",
  ".github/LOCAL_CANONICAL_VERIFICATION.md"]);
const positiveGroups = ["acquisition","material-source","material-controls","material-successor","material-final","material-stock",
  "material-integration-preparation","material-integration-reservation","material-reservation"];
const newGroups = ["material-integration-preparation","material-integration-reservation"];
const sourceAt = (git,head,file) => git(["show",head+":"+file]);
const pathsChanged = (git,before,after) => git(["diff","--name-only","-z","--no-renames",before,after,"--"]).toString().split("\0").filter(Boolean).sort();
function only(values,code) { requireThat(values.length === 1,code); return values[0]; }
function jsonLines(output) {
  return output.split("\n").filter(line=>line.startsWith("{") && line.endsWith("}")).map(line=>{
    try { return JSON.parse(line); } catch { fail("log_json_invalid"); }
  });
}
function output(read,ref,maximum=2*1024*1024) {
  const bytes = read(ref,{json:false,maximum}), value = bytes.toString("utf8");
  requireThat(Buffer.from(value).equals(bytes),"log_utf8_invalid"); return value;
}
function naturalResult(r,label,bound) {
  keys(r,"label exit_code signal timed_out cancelled duration_ms spawn_error_code exit_observed streams_closed cleanup_started cleanup_completed remaining_owned_processes termination_reason");
  requireThat(r.label === label && r.exit_code === 0 && r.signal === null && r.timed_out === false && r.cancelled === false &&
    r.spawn_error_code === null && r.exit_observed === true && r.streams_closed === true && r.cleanup_started === true &&
    r.cleanup_completed === true && r.remaining_owned_processes === 0 && r.termination_reason === "natural_exit" &&
    integer(r.duration_ms) && r.duration_ms > 0 && r.duration_ms <= bound,"positive_not_natural");
}
function reviewChild(lines,group,bound,{timeout=false}={}) {
  const prefix = "AUGNES_REVIEW_CHILD_RESULT ", control = "reviewed-revision-"+group;
  const rows = lines.filter(line=>line.startsWith(prefix)).map(line=>{
    try { return JSON.parse(line.slice(prefix.length)); } catch { fail("child_result_invalid"); }
  });
  const r = only(rows.filter(row=>row.control_id === control),"child_result_invalid");
  keys(r,"control_id exit_code signal timed_out cancelled spawn_error_code duration_ms termination_reason exit_observed streams_closed cleanup_started cleanup_completed remaining_owned_processes last_progress");
  requireThat(r.exit_code === (timeout ? null : 0) && (timeout ? ["SIGTERM","SIGKILL"].includes(r.signal) : r.signal === null) &&
    r.timed_out === timeout && r.cancelled === false && r.spawn_error_code === null && r.exit_observed === true && r.streams_closed === true &&
    r.cleanup_started === true && r.cleanup_completed === true && r.remaining_owned_processes === 0 && r.last_progress === null &&
    r.termination_reason === (timeout ? "bounded_timeout" : "natural_exit") && integer(r.duration_ms) && r.duration_ms > 0 &&
    (timeout ? r.duration_ms >= bound : r.duration_ms <= bound),"child_result_invalid");
  return r;
}
function cleanup(rows) {
  requireThat(Array.isArray(rows) && rows.length > 0 && rows.length <= 100 &&
    new Set(rows.map(row=>row.root)).size === rows.length,"cleanup_invalid");
  for (const row of rows) {
    keys(row,"root completed failure_count failures");
    requireThat(typeof row.root === "string" && path.isAbsolute(row.root) && row.completed === true &&
      row.failure_count === 0 && equal(row.failures,[]),"cleanup_invalid");
  }
}

function predecessor(p,prior,completion,receipt,stock) {
  const proof=prior.source_correction,original={...receipt};delete original.integrity;
  requireThat(receipt.receipt_version === 4 && proof?.schema === "augnes.local-canonical-source-correction.v2" && proof.kind === "accepted_main_integration" &&
    proof.integration_case === "reviewed" && !Object.hasOwn(proof,"commission") && proof.base === proof.accepted_main &&
    proof.branch === p.branch && proof.base === p.base && proof.pull_request === p.pull_request &&
    proof.head === prior.head && proof.tree === prior.tree && equal(proof.budget,{initial:1,recovery:0}) &&
    prior.family_id === p.prior_family_id && prior.number === p.prior_number && prior.number === 1 && prior.attempt_id === p.prior_attempt_id &&
    prior.branch === p.branch && prior.head !== p.head && prior.tree !== p.tree &&
    receipt.repository?.head_sha === prior.head && receipt.repository.tree_sha === prior.tree && receipt.repository.base_sha === proof.base &&
    receipt.run?.id === prior.attempt_id && equal(receipt.attempt,prior) && digest(original) === p.prior_receipt_fingerprint &&
    receipt.integrity?.content_fingerprint === p.prior_receipt_fingerprint && completion.attempt_id === prior.attempt_id &&
    completion.receipt_fingerprint === p.prior_receipt_fingerprint &&
    equal(prior.budget,{initial:1,recovery:0}) && prior.recovery === null &&
    prior.prior_attempt_id === null && prior.prior_receipt_fingerprint === null &&
    completion.disposition === "product_failure" && completion.infrastructure_code === null && completion.cleanup_complete === true &&
    utc(completion.finished_at) && receipt.outcome?.disposition === "product_failure" && receipt.outcome?.first_fault === null &&
    receipt.outcome?.safety === "preserved_within_observed_scope" && receipt.outcome?.validity === "valid_within_observed_scope" &&
    receipt.cleanup?.completed === true && receipt.cleanup.remaining_owned_processes === 0 && equal(receipt.cleanup.failure_codes,[]) &&
    receipt.evidence?.mode === "full" && receipt.evidence.selected_plan === "full-canonical" && receipt.evidence.deciding === false &&
    receipt.evidence.transferable === false && equal(receipt.evidence.planner_browser_phase_ids,browserPhases) &&
    receipt.final?.result === "failure" && receipt.final.exit_status === 1 && equal(receipt.final.reason_codes,["phase_failed","selected_phases_incomplete"]) &&
    Array.isArray(receipt.phases) && equal(receipt.phases.map(row=>row.id),phases),"predecessor_invalid");
  const input=receipt.inputs;
  requireThat(input?.first_fault === null && equal(input.secondary_faults,[]) && equal(input.events,[]) &&
    gitRevisionInventory(input) && input.binding?.head === prior.head && input.binding.tree === prior.tree &&
    input.fingerprint === digest({contract:input.contract,path_kind:input.path_kind,binding:input.binding,resources:input.resources}),"predecessor_inputs_invalid");
  const environments=input.binding.phase_environment_fingerprints;
  requireThat(Array.isArray(environments) && equal(environments.map(row=>row.id),phases) &&
    environments.every(row=>sha(row.fingerprint)),"predecessor_environment_invalid");
  for (const [i,row] of receipt.phases.entries()) {
    requireThat(row.invocation_id === receipt.run.invocation_id && row.browser === (i >= 9) &&
      equal(row.browser_use ?? [],[]),"predecessor_coverage_invalid");
    if (i <= 6) requireThat(row.status === (i < 6 ? "pass" : "failure") && row.exit_status === (i < 6 ? 0 : 1) &&
      row.timed_out === false && row.spawn_error_code === null && row.failure_code === (i < 6 ? null : "phase_failed") &&
      utc(row.started_at) && utc(row.finished_at) && integer(row.duration_ms) && row.duration_ms > 0 &&
      row.environment_fingerprint === environments[i].fingerprint && row.cleanup?.completed === true && row.cleanup.exit_observed === true &&
      row.cleanup.streams_closed === true && row.cleanup.remaining_owned_processes === 0 && row.cleanup.termination_reason === "natural_exit","predecessor_coverage_invalid");
    else requireThat(row.status === "not_run" && row.exit_status === null && row.failure_code === "phase_not_run" &&
      row.started_at === null && row.finished_at === null && row.duration_ms === null && row.timed_out === false &&
      !Object.hasOwn(row,"environment_fingerprint") && row.log?.bytes === 0 && row.log.relative_path === null && row.log.truncated === false &&
      row.cleanup?.completed === false && row.cleanup.exit_observed === false && row.cleanup.streams_closed === false &&
      row.cleanup.remaining_owned_processes === null && row.cleanup.termination_reason === null,"predecessor_coverage_invalid");
  }
  const issues=[...phases.slice(6).map(id=>"phase_not_passing:"+id),"receipt_classified_outcome_not_passing",
    "receipt_final_result_not_pass","receipt_non_deciding","receipt_phase_environment_binding_invalid"].sort();
  keys(stock,"valid_deciding_evidence status issues dimensions content_fingerprint");
  requireThat(stock.valid_deciding_evidence === false && stock.status === "non_deciding_or_stale" &&
    stock.content_fingerprint === p.prior_receipt_fingerprint && equal(stock.issues,issues) && equal(stock.dimensions,{
      execution:"incomplete_or_failed",historical_integrity:"intact",evidence_validity:"invalid_or_incomplete",
      safety:"preserved_within_observed_scope",current_merge_applicability:"matches_observed_context",current_authorization:"authenticated",
    }),"stock_invalid");
}

function retainedFailure(incident,p,receipt,oldRegistration,{read,root,remember}) {
  const native=incident.authority_log, phase=receipt.phases[6];
  keys(native,"artifact relative_path bytes truncated");
  requireThat(native.relative_path === `.augnes-local-verification/logs/${receipt.run.id}/authority.log` &&
    equal(phase.log,{relative_path:native.relative_path,bytes:native.bytes,truncated:false}) &&
    native.truncated === false && integer(native.bytes) && native.bytes > 0 && native.bytes <= 2*1024*1024 &&
    phase.command === "npm run test:authority" && phase.label === "Canonical authority suite" && phase.cwd_scope === "root" && phase.exclusive === true,"original_log_invalid");
  const raw=read(native.artifact,{json:false,maximum:2*1024*1024});
  const physical=artifactReader(root,remember)({artifact:native.relative_path,sha256:native.artifact.sha256},{json:false,maximum:2*1024*1024});
  requireThat(raw.length === native.bytes && raw.equals(physical),"original_log_invalid");
  const text=raw.toString("utf8");requireThat(Buffer.from(text).equals(raw),"log_utf8_invalid");
  const lines=text.split("\n"),group="material-stock",label=JSON.stringify("reviewed revision controls: "+group);
  const bound=oldRegistration.limits[group];
  requireThat(bound?.inner === 15000 && bound.outer === 30000,"incident_bound_invalid");
  const start=only(lines.filter(line=>line.startsWith(`[canonical:authority] child_start label=${label} `)),"incident_outer_invalid");
  const result=only(lines.filter(line=>line.startsWith(`[canonical:authority] child_result label=${label} `)),"incident_outer_invalid");
  const match=result.match(/ duration_ms=(\d+) exit_code=1 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit$/u);
  requireThat(start === `[canonical:authority] child_start label=${label} timeout_ms=${bound.outer}` && match &&
    Number(match[1]) > 0 && Number(match[1]) <= bound.outer && Number(match[1]) <= phase.duration_ms && lines.indexOf(start) < lines.indexOf(result),"incident_outer_invalid");
  const section=lines.slice(lines.indexOf(start),lines.indexOf(result)+1), inner=reviewChild(section,group,bound.inner,{timeout:true});
  requireThat(inner.duration_ms <= Number(match[1]),"incident_outer_invalid");
  const events=section.filter(line=>line.startsWith("[canonical:authority] ") && line.includes(" label="+label+" "));
  const essential=events.filter(line=>!line.includes(" child_active "));
  requireThat(equal(essential.map(line=>line.slice("[canonical:authority] ".length).split(" ")[0]),
    ["child_start","child_spawn","child_exit","child_cleanup_start","child_cleanup_result","child_result"]),"incident_outer_invalid");
  const exit=essential[2]?.match(/ elapsed_ms=(\d+) exit_code=1 signal=null stdout_closed=true stderr_closed=true$/u);
  requireThat(essential[1]?.startsWith(`[canonical:authority] child_spawn label=${label} pid=`) && / pid=[1-9]\d* wait=process_exit$/u.test(essential[1]) &&
    exit && essential[3] === `[canonical:authority] child_cleanup_start label=${label} elapsed_ms=${exit[1]} reason=post_exit_settlement exit_observed=true stdout_closed=true stderr_closed=true` &&
    essential[4] === `[canonical:authority] child_cleanup_result label=${label} elapsed_ms=${match[1]} reason=post_exit_settlement term_sent=false kill_sent=false streams_closed=true remaining_owned_processes=0` &&
    inner.duration_ms <= Number(exit[1]) && Number(exit[1]) <= Number(match[1]),"incident_outer_invalid");
  const rows=jsonLines(section.join("\n")),stages=rows.filter(row=>Object.hasOwn(row,"material_integration_stage"));
  requireThat(equal(stages.map(row=>row.material_integration_stage),["prepared","read_only_refusals"]) &&
    stages.every(row=>row.synthetic_only === true && integer(row.elapsed_ms) && row.elapsed_ms < bound.inner) &&
    stages[0].elapsed_ms < stages[1].elapsed_ms && !section.some(line=>line.startsWith("[local-canonical-browser-use] ")),"incident_progress_invalid");
  const starts=lines.filter(line=>line.startsWith('[canonical:authority] child_start label="reviewed revision controls: '));
  const results=lines.filter(line=>line.startsWith('[canonical:authority] child_result label="reviewed revision controls: '));
  const observed=oldRegistration.groups.slice(0,oldRegistration.groups.indexOf(group)+1);
  requireThat(starts.length === observed.length && results.length === observed.length && observed.at(-1) === group,"incident_sequence_invalid");
  for (const [i,name] of observed.entries()) {
    const q=JSON.stringify("reviewed revision controls: "+name),duration=results[i].match(/ duration_ms=(\d+) /u)?.[1];
    requireThat(starts[i] === `[canonical:authority] child_start label=${q} timeout_ms=${oldRegistration.limits[name].outer}` &&
      results[i] === `[canonical:authority] child_result label=${q} duration_ms=${duration} exit_code=${name===group?1:0} signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit` &&
      integer(Number(duration)) && Number(duration) > 0 && Number(duration) <= oldRegistration.limits[name].outer &&
      lines.indexOf(starts[i]) < lines.indexOf(results[i]) && (i===0 || lines.indexOf(results[i-1]) < lines.indexOf(starts[i])),"incident_sequence_invalid");
  }
  requireThat(lines.filter(line=>line.startsWith("[canonical:authority] child_result ") && !line.includes(" exit_code=0 ")).length === 1,"incident_other_failure");
  const clean=only(jsonLines(text).filter(row=>row.suite === "authority" && Object.hasOwn(row,"resource_cleanup")),"incident_cleanup_invalid");
  cleanup(clean.resource_cleanup);
}

function replaceOnce(source,before,after) {
  const pieces=source.split(before);requireThat(pieces.length === 2,"partition_delta_invalid"); return pieces.join(after);
}
function partitionSource(git,prior,p,part) {
  requireThat(gitId(part.source_head) && gitId(part.source_tree) &&
    git(["rev-parse",part.source_head+"^{tree}"]).toString().trim() === part.source_tree &&
    equal(git(["rev-list","--parents","-n","1",part.source_head]).toString().trim().split(" "),[part.source_head,prior.head]) &&
    equal(pathsChanged(git,prior.head,part.source_head),partitionPaths),"partition_source_invalid");
  git(["merge-base","--is-ancestor",part.source_head,p.head]);
  const support=pathsChanged(git,part.source_head,p.head);
  requireThat(support.every(file=>supportPaths.has(file)),"support_delta_invalid");
  for (const file of partitionPaths) {
    let expected=sourceAt(git,prior.head,file).toString("utf8");
    if (file === fixtureFile) {
      expected=replaceOnce(expected," const final=h.proof(c),finalCap=await h.auth(c,final);\n",
        " if(group==='material-integration-preparation'||group==='material-integration-reservation'){\n await materialIntegrationControls(c,h,group==='material-integration-preparation'?'prepare':'admit');unchanged();return;\n }\n const final=h.proof(c),finalCap=await h.auth(c,final);\n");
      expected=replaceOnce(expected," runMaterialStockPredecessorControls(c,c.materialFinalReceipt);unchanged();\n await materialIntegrationControls(c,h,'prepare');unchanged();return;\n",
        " runMaterialStockPredecessorControls(c,c.materialFinalReceipt);unchanged();return;\n");
      expected=replaceOnce(expected," await materialIntegrationControls(c,h,'admit');unchanged();\n","");
    } else {
      const gap=file.includes("fixtures/") ? "" : " ";
      expected=replaceOnce(expected,'"material-stock",'+gap+'"material-reservation"',
        '"material-stock",'+gap+'"material-integration-preparation",'+gap+'"material-integration-reservation",'+gap+'"material-reservation"');
    }
    const actual=sourceAt(git,part.source_head,file);
    requireThat(Buffer.from(expected).equals(actual) && actual.equals(sourceAt(git,p.head,file)),"partition_delta_invalid");
  }
  const before=registeredFixtureBudget(git,prior.head,"serial-aggregate"),after=registeredFixtureBudget(git,part.source_head,"serial-aggregate");
  requireThat(before.groups.length === 25 && after.groups.length === 27 &&
    equal(after.groups.filter(group=>!newGroups.includes(group)),before.groups) &&
    equal(after.groups.slice(after.groups.indexOf("material-stock"),after.groups.indexOf("material-reservation")+1),["material-stock",...newGroups,"material-reservation"]) &&
    before.groups.every(group=>equal(before.limits[group],after.limits[group])) &&
    newGroups.every(group=>equal(after.limits[group],{inner:15000,outer:30000})),"partition_registration_invalid");
  return {before,after};
}

function partitionPositives(part,receipt,p,runtime,actual,{read,git}) {
  const before=read(part.source_before,{canonical:false}),after=read(part.source_after,{canonical:false}),registration=read(part.registration,{canonical:false});
  keys(before,"head tree status source node executable");keys(after,"source unchanged");
  requireThat(before.head === receipt.repository.head_sha && before.tree === receipt.repository.tree_sha && typeof before.status === "string" &&
    before.node === "v"+CANONICAL_NODE_VERSION && typeof before.executable === "string" && path.isAbsolute(before.executable) &&
    digest(before.executable) === runtime.node.location_fingerprint && equal(before.source,after.source) && after.unchanged === true &&
    equal(Object.keys(before.source).sort(),sourcePaths),"positive_source_invalid");
  for (const [file,hash] of Object.entries(before.source)) requireThat(sha(hash) && hash === digest(sourceAt(git,part.source_head,file)),"positive_source_invalid");
  keys(registration,"group_count groups limits old25_preserved");
  requireThat(registration.group_count === actual.groups.length && equal(registration.groups,actual.groups) &&
    equal(registration.limits,actual.limits) && registration.old25_preserved === true &&
    Array.isArray(part.checks) && equal(part.checks.map(check=>check.group),positiveGroups),"positive_registration_invalid");
  let latest=Date.parse(receipt.run.finished_at),previous=latest;
  let environmentKeys, sharedOwner;
  for (const check of part.checks) {
    keys(check,"group result log");
    const record=read(check.result,{canonical:false}),bound=actual.limits[check.group],text=output(read,check.log),lines=text.split("\n");
    keys(record,"command cwd environment_keys environment_safe_values started_at finished_at duration_ms registered_inner_ms registered_outer_ms result cleanup root_absent");
    requireThat(Array.isArray(record.command) && record.command.length === 7 && equal(record.command.slice(0,6),
      [before.executable,"--import","tsx","scripts/test-local-canonical-review-corrections.mjs","--reviewed-revision-controls",check.group]) &&
      typeof record.command[6] === "string" && typeof record.cwd === "string" && path.isAbsolute(record.cwd) &&
      record.registered_inner_ms === bound.inner && record.registered_outer_ms === bound.outer && utc(record.started_at) && utc(record.finished_at) &&
      Date.parse(record.started_at) >= previous && Date.parse(record.finished_at) >= Date.parse(record.started_at) &&
      integer(record.duration_ms) && record.duration_ms > 0 && record.duration_ms <= bound.outer && record.root_absent === true,"positive_binding_invalid");
    naturalResult(record.result,check.group,bound.outer);cleanup(record.cleanup);
    requireThat(record.cleanup.length === 1 && record.duration_ms >= record.result.duration_ms,"positive_binding_invalid");
    const inner=reviewChild(lines,check.group,bound.inner);
    requireThat(inner.duration_ms <= record.result.duration_ms,"positive_binding_invalid");
    const summary=only(jsonLines(text).filter(row=>row.status === "pass" && Object.hasOwn(row,"checks")),"positive_completion_invalid");
    requireThat(equal(summary,{status:"pass",checks:["reviewed revision controls: "+check.group],cleanup_complete:true}) &&
      !lines.some(line=>line.startsWith("[local-canonical-browser-use] ")),"positive_completion_invalid");
    const env=record.environment_safe_values;
    requireThat(env && env.NODE_ENV === "test" && typeof env.PATH === "string" && env.PATH.split(path.delimiter)[0] === path.dirname(before.executable) &&
      typeof env.AUGNES_CANONICAL_NODE_HEADERS === "string" && digest(env.AUGNES_CANONICAL_NODE_HEADERS) === runtime.headers.location_fingerprint &&
      env.AUGNES_CANONICAL_NODE_HEADERS_FINGERPRINT === digest(runtime.headers.observation) &&
      env.TMPDIR === record.cleanup[0].root && env.AUGNES_CANONICAL_TEMP_ROOT === env.TMPDIR && env.TMP === env.TMPDIR && env.TEMP === env.TMPDIR &&
      env.HOME === path.join(env.TMPDIR,"home") && env.USERPROFILE === env.HOME &&
      env.AUGNES_RUNTIME_STATE_DIR === path.join(env.TMPDIR,"runtime-state") && env.AUGNES_DB_PATH === path.join(env.TMPDIR,"canonical.db") &&
      Array.isArray(record.environment_keys) && record.environment_keys.every(key=>typeof key === "string") &&
      (environmentKeys === undefined || equal(record.environment_keys,environmentKeys)) && (sharedOwner === undefined || record.command[6] === sharedOwner),"positive_environment_invalid");
    environmentKeys=record.environment_keys;sharedOwner=record.command[6];
    previous=Date.parse(record.finished_at);latest=Math.max(latest,previous);
  }
  keys(part.contract,"result log");
  const contract=read(part.contract.result,{canonical:false}),text=output(read,part.contract.log);
  keys(contract,"kind started_at finished_at duration_ms command timeout_ms result cleanup root_absent source_before source_after status refusal new_grants new_deciding_invocations");
  requireThat(equal(contract.command,[before.executable,"--import","tsx","scripts/test-local-canonical-verification-contract.mjs"]) &&
    contract.timeout_ms === 30000 && utc(contract.started_at) && utc(contract.finished_at) && Date.parse(contract.started_at) >= previous &&
    Date.parse(contract.finished_at) >= Date.parse(contract.started_at) && integer(contract.duration_ms) && contract.duration_ms <= contract.timeout_ms &&
    contract.status === "PASS" && contract.refusal === null && contract.new_grants === 0 && contract.new_deciding_invocations === 0 && contract.root_absent === true &&
    equal(contract.source_before,contract.source_after) && equal(Object.keys(contract.source_before).sort(),partitionPaths),"positive_contract_invalid");
  naturalResult(contract.result,"verification and lifecycle contract",contract.timeout_ms);cleanup(contract.cleanup);
  for (const [file,hash] of Object.entries(contract.source_before)) requireThat(hash === before.source[file],"positive_contract_invalid");
  requireThat(text.includes('"status": "pass"') && text.split("\n").filter(line=>
    /^\[canonical:[a-z0-9-]+\] child_result label="verification and lifecycle contract" /u.test(line) &&
    line.endsWith(`duration_ms=${contract.result.duration_ms} exit_code=0 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit`)).length === 1,"positive_contract_invalid");
  return Math.max(latest,Date.parse(contract.finished_at));
}

export function readFailedIntegrationFixtureIncident({p,e,prior,completion,receipt,stock,read,git,root,runtime,dependencies,remember}) {
  requireThat(isFailedIntegrationFixture(p) && equal(e.repairs,[]),"case_invalid");
  const incident=read(e.incident);keys(incident,"kind receipt cause interrupted_operation authority_log partition preparation");
  requireThat(incident.kind === FAILED_INTEGRATION_FIXTURE_CASE && incident.receipt === p.prior_receipt_fingerprint &&
    incident.cause === "UNKNOWN" && incident.interrupted_operation === "UNKNOWN","incident_invalid");
  predecessor(p,prior,completion,receipt,stock);
  const part=read(incident.partition);keys(part,"source_head source_tree source_before source_after registration checks contract");
  const registrations=partitionSource(git,prior,p,part);
  retainedFailure(incident,p,receipt,registrations.before,{read,root,remember});
  // partitionSource already validated this immutable registration in this read.
  let latest=partitionPositives(part,receipt,p,runtime,registrations.after,{read,git});
  const preparation=read(incident.preparation,{maximum:512*1024});
  keys(preparation,"schema target source_head source_tree checkout_fingerprint runtime_inputs input_inventory inventory_sha256 dependencies prepared_at");
  const input=preparation.input_inventory;
  requireThat(preparation.schema === "augnes.local-canonical-failed-integration-fixture-preparation.v1" && equal(preparation.target,target(p)) &&
    preparation.source_head === p.head && preparation.source_tree === p.tree && sha(preparation.checkout_fingerprint) &&
    validCanonicalRuntimeInputs(preparation.runtime_inputs) && equal(preparation.runtime_inputs,runtime) &&
    sha(preparation.inventory_sha256) && gitRevisionInventory(input) === preparation.inventory_sha256 &&
    // observeGitRevisionTarget owns a raw resource inventory with no execution
    // binding. Source/runtime are pinned above; the Full receipt binds them in
    // its own input contract without rewriting this preparation observation.
    equal(input.binding,{}) &&
    input.fingerprint === digest({contract:input.contract,path_kind:input.path_kind,binding:input.binding,resources:input.resources}) &&
    input.first_fault === null && equal(input.secondary_faults,[]) && equal(input.events,[]) &&
    equal(preparation.dependencies,dependencies) && equal(preparation.dependencies?.map(row=>row.phase_id),dependencyPhases) &&
    preparation.dependencies.every(row=>row.contract === PREPARED_DEPENDENCY_CONTRACT && preparedDependencyIdentity(row)) &&
    utc(preparation.prepared_at) && Date.parse(preparation.prepared_at) > Math.max(latest,Date.parse(completion.finished_at)),"preparation_invalid");
  for (const [role,id] of [["node","node-executable"],["headers","node-headers"]]) {
    const resource=input.resources.find(row=>row.id === id);
    requireThat(resource?.location_fingerprint === runtime[role].location_fingerprint && equal(resource.before,runtime[role].observation),"preparation_runtime_unbound");
  }
  latest=Math.max(latest,Date.parse(preparation.prepared_at));
  return {latest,preparation,preparation_sha256:incident.preparation.sha256};
}
