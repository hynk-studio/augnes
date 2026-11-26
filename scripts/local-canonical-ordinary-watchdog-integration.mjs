import { lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { digest } from "./local-canonical-inputs.mjs";
import { verifyReceiptIntegrity } from "./local-canonical-receipt.mjs";
import { settledIsolatedResources } from "./local-canonical-browser-revision.mjs";
import { inspectReviewedFixtureRegistration } from "./local-canonical-fixture-budget-witness.mjs";

// An explicit predecessor basis, not an extension of successful-predecessor
// integration, infrastructure recovery, or the frozen replacement disposition.
export const ORDINARY_WATCHDOG_INTEGRATION = "settled-ordinary-watchdog-integration-v1";
const ACCOUNTING = "augnes.local-canonical-ordinary-watchdog-accounting.v1";
const GROUP = "revision", CONTROL = "reviewed-revision";
const repository = "hynk-studio/augnes", origin = "https://github.com/hynk-studio/augnes.git";
const equal = (a,b) => a !== undefined && b !== undefined && digest(a) === digest(b);
const integer = n => Number.isSafeInteger(n) && n > 0;
const sha = v => /^[a-f0-9]{64}$/u.test(v ?? "");
const utc = v => typeof v === "string" && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/u.test(v) && Number.isFinite(Date.parse(v));
const fail = code => { throw Object.assign(new Error("integration_ordinary_watchdog_"+code), {code:"integration_ordinary_watchdog_"+code}); };
const requireThat = (condition,code) => { if (!condition) fail(code); };
const keys = (v,fields) => requireThat(v && typeof v === "object" && !Array.isArray(v) &&
  equal(Object.keys(v).sort(),fields.split(" ").sort()),"shape_invalid");
const selected = p => p?.schema === "augnes.local-canonical-source-correction.v2" && p.kind === "accepted_main_integration" &&
  p.integration_case === "reviewed" && p.integration?.delivery_revision === "accounted-verifier-chain-v1" &&
  p.integration.predecessor_basis === ORDINARY_WATCHDOG_INTEGRATION;

export function retainedBytes(root,relative,maximum,remember) {
  requireThat(typeof relative === "string" && /^\.augnes-local-verification\/[A-Za-z0-9_./-]+$/u.test(relative) &&
    !relative.split("/").includes(".."),"receipt_path_invalid");
  const file=path.join(root,relative),s=lstatSync(file);
  requireThat(realpathSync(file)===file && s.isFile() && !s.isSymbolicLink() && s.nlink===1 && !(s.mode&0o022) && s.size<=maximum,"receipt_unsafe");
  const bytes=readFileSync(file);
  requireThat(bytes.length===s.size,"receipt_changed");
  remember(file,bytes);
  return bytes;
}

function naturalPhase(phase,success,receipt) {
  const cleanup=phase?.cleanup,start=Date.parse(phase?.started_at),end=Date.parse(phase?.finished_at);
  return phase?.status===(success?"pass":"failure") && phase.exit_status===(success?0:1) && phase.timed_out===false &&
    phase.failure_code===(success?null:"phase_failed") && phase.spawn_error_code==null && phase.signal==null &&
    phase.invocation_id===receipt.run.invocation_id && sha(phase.environment_fingerprint) &&
    [start,end].every(Number.isFinite) && Date.parse(receipt.run.started_at)<=start && start<=end && end<=Date.parse(receipt.run.finished_at) &&
    Number.isFinite(phase.duration_ms) && phase.duration_ms>=0 && cleanup?.completed===true && cleanup.exit_observed===true &&
    cleanup.streams_closed===true && cleanup.remaining_owned_processes===0 && [null,0].includes(cleanup.listener_residue_count) &&
    cleanup.termination_reason==="natural_exit";
}

function externalRecord(record,permission,p,prior) {
  requireThat(integer(record?.id) && record.user?.type==="User" && integer(record.user.id) &&
    /^[A-Za-z0-9-]{1,39}$/u.test(record.user.login??"") && ["OWNER","MEMBER","COLLABORATOR"].includes(record.author_association) &&
    record.issue_url===`https://api.github.com/repos/${repository}/issues/${p.pull_request}` &&
    utc(record.created_at) && record.created_at===record.updated_at && Date.parse(record.created_at)<Date.parse(prior.started_at) &&
    typeof record.body==="string" && Buffer.byteLength(record.body)<=32*1024 &&
    [repository,origin,p.branch,prior.head,prior.tree].every(v=>record.body.includes(v)) &&
    permission?.user?.login===record.user.login && permission.user.id===record.user.id && ["admin","maintain"].includes(permission.permission),
  "historical_authority_invalid");
  return {id:record.id,author:record.user.login,author_id:record.user.id,body_sha256:digest(record.body),
    timestamp:record.created_at,role:"ordinary_external_commission",commit_id:null};
}

function readAccounting(reader,reference,p,prior,completion,receipt,completionSha) {
  const read=ref=>reader(ref,{canonical:false,maximum:128*1024});
  const manifest=reader(reference,{maximum:64*1024});
  keys(manifest,"schema commission permission amendments mapping settlement");
  requireThat(manifest.schema===ACCOUNTING && Array.isArray(manifest.amendments) && manifest.amendments.length<=4,"accounting_invalid");
  const record=read(manifest.commission),permission=read(manifest.permission),commission=externalRecord(record,permission,p,prior);
  const body=record.body.replaceAll("**","");
  requireThat(body.includes("ordinary initial") && body.includes("Maximum: one admitted deciding invocation.") &&
    body.includes("No recovery, second initial invocation") && body.includes(prior.family_id) && body.includes(receipt.repository.base_sha) &&
    Date.parse(commission.timestamp)<Date.parse(receipt.run.started_at),"commission_scope_invalid");
  const mapping=read(manifest.mapping),settlement=read(manifest.settlement);
  requireThat(mapping.target?.repository===repository && mapping.target.origin===origin && mapping.target.pull_request===p.pull_request &&
    mapping.target.branch===p.branch && mapping.target.base===receipt.repository.base_sha && mapping.target.head===prior.head && mapping.target.tree===prior.tree &&
    mapping.replacement_family?.family_id===prior.family_id && mapping.mapping_semantics?.physical_successor_edge===null &&
    mapping.mapping_semantics.physical_historical_records_modified===false && mapping.mapping_semantics.cross_family_lineage_machine_acceptance===false &&
    mapping.history?.all_old_grants_carry_over_to_new_family===false && record.body.includes(manifest.mapping.sha256) &&
    settlement.accepted_mapping?.sha256===manifest.mapping.sha256 && settlement.cross_family_physical_edge===null && settlement.no_old_records_modified===true,
  "mapping_invalid");
  let previous=Date.parse(record.created_at);const amendments=[];
  for(const entry of manifest.amendments) {
    keys(entry,"record permission");
    const amended=read(entry.record),observation=externalRecord(amended,read(entry.permission),p,prior);
    const text=amended.body.replaceAll("**","");
    requireThat(observation.id!==commission.id && !amendments.some(v=>v.id===observation.id) && Date.parse(observation.timestamp)>previous &&
      text.includes(String(commission.id)) && text.includes(commission.body_sha256) && text.includes(manifest.mapping.sha256) &&
      text.includes("This amendment adds no invocation") && text.includes("Combined invocation maximum under the original commission and this amendment: 1"),
    "amendment_invalid");
    requireThat(Date.parse(observation.timestamp)<Date.parse(receipt.run.started_at),"amendment_invalid");
    previous=Date.parse(observation.timestamp);amendments.push(observation);
  }
  const current=settlement.new_commission;
  requireThat(current?.id===commission.id && current.combined_maximum_invocations===1 && current.consumed===1 && current.remaining===0 &&
    current.attempt_id===prior.attempt_id && (amendments.length===0 ? current.amendment==null : amendments.some(v=>v.id===current.amendment) && current.amendment_adds_allowance===false) &&
    current.physical_completion_file_sha256===completionSha &&
    Array.isArray(settlement.old_grants) && settlement.old_grants.length>0 && settlement.old_grants.length<=128,"consumption_invalid");
  const rows=settlement.old_grants;
  requireThat(new Set(rows.map(v=>v.id)).size===rows.length && !rows.some(v=>v.id===commission.id || amendments.some(a=>a.id===v.id)) &&
    rows.every(v=>integer(v.id) && sha(v.current_body_sha256) && v.current_remaining===0 &&
      (v.superseded_by ? v.consumed_in_physical_branch_lineage===0 && v.combined_maximum_invocations===1 && v.combined_consumed===1 &&
        rows.some(w=>w.id===v.superseded_by && w.consumed_in_physical_branch_lineage===1 && w.maximum_invocations===1) :
        v.consumed_in_physical_branch_lineage===1 && v.maximum_invocations===1)) &&
    equal(mapping.old_family_tip?.revision_grants,rows.filter(v=>v.consumed_in_physical_branch_lineage===1).map(v=>v.id)) &&
    mapping.old_tip_identity?.commission===mapping.old_family_tip.revision_grants.at(-1) &&
    mapping.old_tip_identity.consumed===1 && mapping.old_tip_identity.maximum===1 && mapping.old_tip_identity.remaining===0 &&
    settlement.old_grants_issued===rows.length && settlement.old_grants_physically_consumed===rows.filter(v=>v.consumed_in_physical_branch_lineage===1).length &&
    settlement.old_superseded_grants===rows.filter(v=>v.superseded_by).length,"history_invalid");
  // This is retained external accounting, never an invented revision_authority
  // on the ordinary attempt or an old/new physical edge. All issued IDs remain
  // unavailable for reuse, including superseded and amendment records.
  return {manifest,commission,amendments,grants:[...rows.map(v=>v.id),commission.id,...amendments.map(v=>v.id)],
    rows:[...rows,{id:commission.id,current_body_sha256:commission.body_sha256,maximum_invocations:1,consumed_in_physical_branch_lineage:1,current_remaining:0}],
    mapping,settlement,consumed:1,remaining:0,completed_at:completion.finished_at};
}

// All predecessor evidence is retained data. Git only parses the three exact
// registrations; no old source, killed child or historical Full is executed.
export function readOrdinaryWatchdogIntegrationPredecessor(root,p,prior,completion,reader,review,git,phases,{remember=()=>{},anchorRoot=root}={}) {
  requireThat(selected(p) && prior?.source_correction===null && prior.recovery===null && prior.number===1 &&
    prior.contract==="augnes.local-canonical-attempt-family.v1" && equal(prior.budget,{initial:1,recovery:1}) &&
    prior.prior_attempt_id===null && prior.prior_receipt_fingerprint===null &&
    !["revision_authority","integration_authority","maintenance_authority","improvement_authority"].some(k=>Object.hasOwn(prior,k)) &&
    sha(prior.family_id) && prior.family_id===p.prior_family_id && prior.attempt_id===p.prior_attempt_id && p.prior_number===1 && prior.branch===p.branch &&
    completion?.contract==="augnes.local-canonical-attempt-family.v1" && completion.attempt_id===prior.attempt_id && completion.disposition==="product_failure" && completion.cleanup_complete===true &&
    completion.infrastructure_code===null && completion.receipt_fingerprint===p.prior_receipt_fingerprint,"predecessor_invalid");
  const references=review.ordinary_watchdog_predecessor;keys(references,"stock log accounting");
  const receipt=JSON.parse(retainedBytes(root,p.prior_receipt_path,512*1024,remember).toString("utf8"));
  const completionBytes=retainedBytes(anchorRoot,`.augnes-local-verification/families/${prior.family_id}/completion-1.json`,64*1024,remember);
  requireThat(equal(JSON.parse(completionBytes.toString("utf8")),completion),"completion_changed");
  requireThat(verifyReceiptIntegrity(receipt) && receipt.receipt_version===4 && receipt.verification_context?.kind==="isolated-worktree" &&
    receipt.inputs?.contract==="augnes.local-canonical-inputs.v3" && receipt.inputs.path_kind==="isolated-model-free-v1" &&
    equal(receipt.attempt,prior) && receipt.integrity.content_fingerprint===p.prior_receipt_fingerprint &&
    receipt.repository?.repository_id===repository && receipt.repository.origin===origin && receipt.repository.branch===prior.branch &&
    receipt.repository.head_sha===prior.head && receipt.repository.tree_sha===prior.tree && receipt.repository.worktree_before==="clean" && receipt.repository.worktree_after==="clean" &&
    receipt.run?.id===prior.attempt_id && /^[a-f0-9]{32}$/u.test(receipt.run.invocation_id??"") &&
    utc(receipt.run.started_at) && utc(receipt.run.finished_at) && utc(prior.started_at) && utc(completion.finished_at) &&
    Date.parse(receipt.run.started_at)<=Date.parse(prior.started_at) && Date.parse(prior.started_at)<=Date.parse(receipt.run.finished_at) &&
    Date.parse(receipt.run.finished_at)<=Date.parse(completion.finished_at) && Date.parse(completion.finished_at)<Date.parse(review.reviewed_at) &&
    receipt.outcome?.disposition==="product_failure" && receipt.outcome.safety==="preserved_within_observed_scope" &&
    receipt.outcome.first_fault===null && receipt.inputs?.first_fault===null && equal(receipt.inputs.events,[]) && equal(receipt.inputs.secondary_faults,[]) &&
    receipt.inputs.fingerprint===prior.contract_fingerprint && receipt.inputs.binding?.head===prior.head && receipt.inputs.binding.tree===prior.tree &&
    receipt.evidence?.mode==="full" && receipt.evidence.selected_plan==="full-canonical" && receipt.evidence.planner_plan==="full-canonical" &&
    receipt.evidence.deciding===false && receipt.evidence.transferable===false && receipt.final?.result==="failure" && receipt.final.exit_status===1 &&
    settledIsolatedResources(receipt) && receipt.cleanup.companion_service.before.status==="live","original_invalid");
  requireThat(Array.isArray(phases) && phases.length===16 && equal(receipt.phases?.map(v=>v.id),phases) && phases[6]==="authority" &&
    receipt.phases.slice(0,7).every((v,i)=>naturalPhase(v,i<6,receipt)) && receipt.phases.slice(7).every(v=>v.status==="not_run" &&
      v.exit_status===null && v.timed_out===false && v.failure_code==="phase_not_run" && v.started_at===null && v.finished_at===null &&
      v.log?.bytes===0 && v.log.relative_path===null),"phase_history_invalid");
  const stock=reader(references.stock,{canonical:false,maximum:512*1024});
  const issues=[...phases.slice(6).map(id=>"phase_not_passing:"+id),"receipt_classified_outcome_not_passing","receipt_final_result_not_pass","receipt_non_deciding","receipt_phase_environment_binding_invalid"].sort();
  requireThat(stock.valid_deciding_evidence===false && stock.status==="non_deciding_or_stale" && stock.content_fingerprint===p.prior_receipt_fingerprint &&
    equal(stock.issues,issues) && equal(stock.dimensions,{execution:"incomplete_or_failed",historical_integrity:"intact",evidence_validity:"invalid_or_incomplete",
      safety:"preserved_within_observed_scope",current_merge_applicability:"matches_observed_context"}),"stock_invalid");
  const phase=receipt.phases[6],logBytes=reader(references.log,{json:false,maximum:2*1024*1024});
  requireThat(Buffer.isBuffer(logBytes),"log_invalid");
  const log=logBytes.toString("utf8");
  requireThat(Buffer.from(log,"utf8").equals(logBytes),"log_utf8_invalid");
  requireThat(phase.log?.truncated===false && logBytes.length===phase.log.bytes && phase.log.relative_path===
    `.augnes-local-verification/logs/${prior.attempt_id}/authority.log`,"log_invalid");
  requireThat(retainedBytes(root,phase.log.relative_path,2*1024*1024,remember).equals(logBytes),"original_log_changed");
  const children=log.split("\n").filter(line=>line.startsWith("AUGNES_REVIEW_CHILD_RESULT ")).map(line=>JSON.parse(line.slice("AUGNES_REVIEW_CHILD_RESULT ".length)));
  const failed=children.filter(v=>v.control_id===CONTROL);requireThat(failed.length===1,"child_invalid");
  const child=failed[0];
  requireThat(child.exit_code===null && ["SIGTERM","SIGKILL"].includes(child.signal) && child.timed_out===true && child.cancelled===false &&
    child.spawn_error_code===null && child.termination_reason==="bounded_timeout" && child.exit_observed===true && child.streams_closed===true &&
    child.cleanup_completed===true && child.remaining_owned_processes===0 && integer(child.duration_ms),"child_invalid");
  const expectedFailures=new Set(["cosmetic-source-witness","source-before-witness","root-config-before-witness","blank-state-return-before-witness",
    "native-pending-selection-before-witness","web-recorded-origin-before-witness"]);
  requireThat(children.every(v=>v===child || v.timed_out===false && v.signal===null && v.spawn_error_code===null && v.exit_observed===true &&
    v.streams_closed===true && v.cleanup_completed===true && v.remaining_owned_processes===0 &&
    (v.exit_code===0 || v.exit_code===1 && expectedFailures.has(v.control_id))),"competing_child_failure");
  const before=inspectReviewedFixtureRegistration(git,prior.head,GROUP),adopted=inspectReviewedFixtureRegistration(git,p.base,GROUP),
    current=inspectReviewedFixtureRegistration(git,p.head,GROUP);
  const preserves=(previous,next)=>equal(next.groups.filter(group=>previous.groups.includes(group)),previous.groups);
  requireThat(equal(adopted.limits[GROUP],{inner:3600000,outer:3900000}) && equal(current.limits[GROUP],adopted.limits[GROUP]) &&
    preserves(before,adopted) && preserves(adopted,current) && adopted.groups.every(group=>equal(adopted.limits[group],current.limits[group])) &&
    before.limits[GROUP].inner<adopted.limits[GROUP].inner && before.limits[GROUP].outer<adopted.limits[GROUP].outer &&
    child.duration_ms>=before.limits[GROUP].inner && child.duration_ms<before.limits[GROUP].outer && child.duration_ms<=phase.duration_ms,
  "adopted_conditions_invalid");
  const lines=log.split("\n"),label='label="reviewed revision controls: revision"';
  const starts=lines.filter(line=>line.startsWith("[canonical:authority] child_start "+label+" "));
  const results=lines.filter(line=>line.startsWith("[canonical:authority] child_result "));
  const selectedResult=results.filter(line=>line.startsWith("[canonical:authority] child_result "+label+" "));
  const match=selectedResult[0]?.match(/ duration_ms=(\d+) exit_code=1 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit$/u);
  requireThat(starts.length===1 && starts[0]===`[canonical:authority] child_start ${label} timeout_ms=${before.limits[GROUP].outer}` &&
    selectedResult.length===1 && match && Number(match[1])>=child.duration_ms && Number(match[1])<before.limits[GROUP].outer && Number(match[1])<=phase.duration_ms &&
    lines.indexOf(starts[0])<lines.findIndex(line=>line.startsWith("AUGNES_REVIEW_CHILD_RESULT ")&&line.includes('"control_id":"'+CONTROL+'"')) &&
    lines.findIndex(line=>line.startsWith("AUGNES_REVIEW_CHILD_RESULT ")&&line.includes('"control_id":"'+CONTROL+'"'))<lines.indexOf(selectedResult[0]) &&
    results.every(line=>line===selectedResult[0] || / exit_code=0 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit$/u.test(line)),
  "outer_failure_invalid");
  const accounting=readAccounting(reader,references.accounting,p,prior,completion,receipt,digest(completionBytes));
  return {receipt,stock,accounting,registration:{before,adopted,current},failure:{phase:"authority",group:CONTROL,cause:"UNKNOWN",child_duration_ms:child.duration_ms}};
}
