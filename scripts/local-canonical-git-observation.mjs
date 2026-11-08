import { digest, classifyInputChange, effectiveInputObservation, inputEventIdentity, nonFaultInputChange, INPUT_CONTRACT, PREPARED_DEPENDENCY_CONTRACT, comparePreparedDependencyInputs, preparedDependencyIdentity } from "./local-canonical-inputs.mjs";
import { settledIsolatedResources, cancelledPhase, verifySettledPhaseFailure } from "./local-canonical-browser-revision.mjs";
import { validPhaseBrowserUse } from "./local-canonical-browser-identity.mjs";
import { CANONICAL_NODE_VERSION } from "./local-canonical-environment.mjs";

export const isGitObservationRevision = p =>
  p?.schema === "augnes.local-canonical-source-correction.v10" && p.kind === "reviewed_revision";
export const isGitObservationSuccessor = p => isGitObservationRevision(p) && p.commission?.ordinal === 2;
// A v7 commission descending from the spent Git-observation chain keeps the
// complete input inventory throughout its physical lineage.
export const isInventoryBoundRevision = p => p?.schema === "augnes.local-canonical-source-correction.v7" &&
  p.kind === "reviewed_revision" && Object.hasOwn(p.inputs ?? {}, "inventory_sha256");
export const GIT_ACQUISITION_REPAIR = "coherent-git-file-acquisition-v1";
export const isGitAcquisitionRevision = p => isInventoryBoundRevision(p) &&
  p.commission?.input_acquisition === GIT_ACQUISITION_REPAIR;
export const REVIEWED_WORKLOAD_CONTINUATION = "spent-acquisition-reviewed-workload-v1";
export const isReviewedWorkloadRevision = p => isGitAcquisitionRevision(p) &&
  p.commission?.reviewed_workload === REVIEWED_WORKLOAD_CONTINUATION;
export const POST_TERMINAL_GIT_SUCCESSOR = "spent-terminal-git-successor-workload-v1";
export const isPostTerminalGitSuccessorRevision = p => isGitAcquisitionRevision(p) &&
  p.commission?.reviewed_workload === POST_TERMINAL_GIT_SUCCESSOR;
export const isTerminalWorkloadRevision = p => isReviewedWorkloadRevision(p) || isPostTerminalGitSuccessorRevision(p);
// A new exact-target commission for a materially corrected natural product
// failure. Acquisition remains provenance, not the current incident kind.
export const MATERIAL_SOURCE_CORRECTION = "material-source-correction-v1";
export const isMaterialSourceRevision = p => isInventoryBoundRevision(p) &&
  p.commission?.source_revision === MATERIAL_SOURCE_CORRECTION;
export const MATERIAL_HISTORY_BOUNDARY = "Historical windows remain UNKNOWN; all prior commissions, issued limits, consumed invocations, receipts and false stock remain unchanged.";
export const POST_TERMINAL_HISTORY_BOUNDARY = "Historical windows remain UNKNOWN; commissions 6707156210 and 6717558497 remain spent 2/2, commission 6719208780 remains spent 1/1, and all prior receipts, false stock and five consumed invocations remain unchanged.";
export const WORKLOAD_HISTORY_BOUNDARY = "Historical windows remain UNKNOWN; both prior commissions, their false stock and all four spent ordinals remain unchanged.";
export const usesGitInventory = p => isGitObservationRevision(p) || isInventoryBoundRevision(p);

const equal = (a,b) => a !== undefined && b !== undefined && digest(a) === digest(b);
const sha = value => /^[a-f0-9]{64}$/u.test(value ?? "");
const fail = code => { throw Object.assign(new Error(code), { code }); };
const diagnostic = { contract:"augnes.input-observation-failure.v1", stage:"metadata_consistency", code:"input_observation_race" };
const faultOf = ({resource, disposition, observed_at, monotonic_ns, diagnostic}) =>
  ({resource, disposition, observed_at, monotonic_ns, ...(diagnostic ? {diagnostic} : {})});

function gitObservation(value) {
  return value?.present === true && sha(value.sha256) && sha(value.permission_identity) &&
    value.metadata?.links === "1" && /^\d{1,40}$/u.test(value.metadata.mode) &&
    (BigInt(value.metadata.mode) & 0o170022n) === 0o100000n &&
    value.git_projection?.applicable === true && value.git_projection.policy === "isolated-current-branches-v1" &&
    sha(value.git_projection.scope_fingerprint) && sha(value.git_projection.effective_sha256);
}

// Retain the unknown first observation. The later measurement establishes a
// change in the protected input, but supplies no preimage or list of changed keys.
export function gitObservationIncident(r, prior, completion, stock, phases) {
  return readGitIncident(r, prior, completion, stock, phases, false);
}

// Prospective eligibility only. A later complete ambient observation does not
// complete or retrospectively validate the historical failed acquisition.
export function gitAcquisitionIncident(r, prior, completion, stock, phases) {
  return readGitIncident(r, prior, completion, stock, phases, true);
}

function readGitIncident(r, prior, completion, stock, phases, acquisition) {
  const i = r.inputs, a = r.attempt;
  if (r.receipt_version !== 4 || !a || a.number !== 1 || a.recovery !== null || (acquisition ?
      a.source_correction?.schema !== "augnes.local-canonical-source-correction.v7" ||
      a.source_correction.kind !== "reviewed_revision" || a.source_correction.commission?.ordinal !== 2 ||
      a.source_correction.commission.maximum_invocations !== 2 || usesGitInventory(a.source_correction) ||
      a.source_correction.settlement !== undefined : a.source_correction !== null) ||
      !equal(a,prior) || r.run.id !== a.attempt_id || r.repository.branch !== a.branch ||
      r.verification_context.kind !== "isolated-worktree" || r.evidence.selected_plan !== "full-canonical" || r.evidence.deciding !== false ||
      r.repository.worktree_before !== "clean" || r.repository.worktree_after !== "clean" ||
      r.final.result !== "failure" || r.final.exit_status !== 1 ||
      !equal(r.final.reason_codes, ["phase_cancelled","selected_phases_incomplete","verification_cancelled"]) ||
      r.outcome.disposition !== "unknown_relevance" || r.outcome.safety !== "blocked" ||
      r.outcome.validity !== "invalid_or_unknown" || r.outcome.execution !== "incomplete_or_failed" ||
      !settledIsolatedResources(r) || completion.cleanup_complete !== true || completion.infrastructure_code !== null ||
      completion.disposition !== r.outcome.disposition || !(Date.parse(completion.finished_at) >= Date.parse(r.run.finished_at)) ||
      !equal(r.phases.map(p => p.id),phases)) fail("revision_git_predecessor_invalid");

  const {contract,path_kind,binding,resources} = i;
  if (contract !== INPUT_CONTRACT || path_kind !== "isolated-model-free-v1" ||
      digest({contract,path_kind,binding,resources}) !== i.fingerprint || a.contract_fingerprint !== i.fingerprint ||
      new Set(resources.map(v=>v.id)).size !== resources.length || !Array.isArray(i.events) || i.events.length >= 64)
    fail("revision_git_observations_invalid");
  const git = resources.find(v=>v.id === "git-config"), faults=[];
  if (git?.classification !== "execution" || git.gitTracking?.policy !== "isolated-current-branches-v1" ||
      !git.gitTracking.protected_branches?.includes(digest(a.branch)) ||
      !sha(git.location_fingerprint) || !gitObservation(git.before)) fail("revision_git_observations_invalid");
  let last = -1n;
  for (const event of i.events) {
    const role = resources.find(v=>v.id===event.resource);
    if (!role || event.classification !== role.classification || inputEventIdentity(event) !== event.identity ||
        !/^\d+$/u.test(event.monotonic_ns) || BigInt(event.monotonic_ns) <= last ||
        !(Date.parse(event.observed_at) >= Date.parse(r.run.started_at) && Date.parse(event.observed_at) <= Date.parse(r.run.finished_at)))
      fail("revision_git_observations_invalid");
    last = BigInt(event.monotonic_ns);
    if (event.disposition === "observer_failure") {
      if (event.after !== null || !equal(event.diagnostic,diagnostic)) fail("revision_git_observations_invalid");
    } else if (event.diagnostic !== undefined || classifyInputChange(role.before,event.after,role,i) !== event.disposition) {
      fail("revision_git_observations_invalid");
    }
    if (!nonFaultInputChange(event.disposition)) faults.push(event);
  }
  const race = faults[0];
  const later = acquisition ? i.events.filter(e => e.resource === git.id && e.disposition === "ambient_observation" &&
    race && BigInt(e.monotonic_ns) > BigInt(race.monotonic_ns)) : [];
  const change = acquisition ? later[0] : faults[1];
  if (faults.length !== (acquisition ? 1 : 2) || race.resource !== git.id || change?.resource !== git.id ||
      race.disposition !== "observer_failure" || change.disposition !== (acquisition ? "ambient_observation" : "input_invalidation") ||
      !gitObservation(change.after) || git.before.sha256 === change.after.sha256 ||
      (acquisition ? later.length !== 1 || !equal(effectiveInputObservation(git.before,git,i),effectiveInputObservation(change.after,git,i)) ||
        binding.head !== a.head || binding.tree !== a.tree :
        git.before.git_projection.effective_sha256 === change.after.git_projection.effective_sha256 ||
        git.before.git_projection.scope_fingerprint !== change.after.git_projection.scope_fingerprint) ||
      !equal(i.first_fault,faultOf(race)) || !equal(r.outcome.first_fault,i.first_fault) ||
      !equal(i.secondary_faults,acquisition ? [] : [faultOf(change)])) fail("revision_git_observations_invalid");
  const phase = cancelledPhase(r.phases,race.observed_at);
  if (!phase || r.phases.some(p => p.status === "not_run" && (p.started_at != null || p.finished_at != null || p.browser_use?.length)))
    fail("revision_git_predecessor_invalid");
  const browserIssues = [];
  if (acquisition) {
    const browser = resources.find(v => v.id === "browser-executable"); let version = null;
    for (const phase of r.phases) {
      if (phase.status === "not_run") continue;
      if (!validPhaseBrowserUse(phase,phase.browser_use ?? [],browser ? {...browser,actual_version:version} : null)) {
        // This prospective edge accepts only an interrupted phase with no
        // Browser-use records, never invalid observed identity/permission data.
        if (!Array.isArray(phase.browser_use) || phase.browser_use.length !== 0)
          fail("revision_git_stock_invalid");
        browserIssues.push("receipt_browser_identity_invalid:"+phase.id);
      }
      version ??= phase.browser_use?.[0]?.actual_version ?? null;
    }
    // An interrupted consuming phase can be incomplete; completed phases must
    // retain their original valid Browser identities.
    if (browserIssues.some(code => code !== "receipt_browser_identity_invalid:"+phase)) fail("revision_git_stock_invalid");
  }
  const expected = ["receipt_classified_outcome_not_passing",...(acquisition ? browserIssues : ["receipt_current_inputs_unverified"]),"receipt_final_result_not_pass",
    "receipt_input_observation_blocked","receipt_non_deciding", ...(r.phases.some(p=>p.status==="not_run") ? ["receipt_phase_environment_binding_invalid"] : []),
    ...r.phases.filter(p=>p.status!=="pass").map(p=>"phase_not_passing:"+p.id)].sort();
  if (stock.status !== "non_deciding_or_stale" || stock.valid_deciding_evidence !== false ||
      stock.content_fingerprint !== r.integrity.content_fingerprint || !equal([...stock.issues].sort(),expected) ||
      !equal(stock.dimensions,{historical_integrity:"intact",execution:"incomplete_or_failed",evidence_validity:"invalid_or_incomplete",safety:"blocked",current_merge_applicability:acquisition ? "matches_observed_context" : "blocked"}))
    fail("revision_git_stock_invalid");
  return { config:git, race, change, phase };
}

// Use the production inventory and its existing read policies. Additionally
// pin the complete shared Git file for this prospective target. No raw settings
// or credentials enter the proof. The run still monitors its own full binding.
export function gitRevisionInventory(snapshot) {
  const resources = snapshot?.resources;
  if (snapshot?.contract !== INPUT_CONTRACT || snapshot.path_kind !== "isolated-model-free-v1" ||
      !Array.isArray(resources) || new Set(resources.map(r => r.id)).size !== resources.length ||
      !["git-config", "node-executable", "node-headers", "git-executable", "browser-executable"].every(id => resources.some(r => r.id === id)) ||
      !resources.every(r => sha(r.location_fingerprint) && typeof r.before?.present === "boolean") ||
      !gitObservation(resources.find(r => r.id === "git-config")?.before)) fail("revision_git_current_inputs_invalid");
  return digest(resources.map(r => {
    const value = effectiveInputObservation(r.before, r, snapshot);
    return { ...r, before: r.id === "git-config" ? r.before : value };
  }));
}

const webPhase = "dependencies-web-planning";
const inputOwner = "scripts/local-canonical-inputs.mjs";
export const finalDependencyProbe = `import path from "node:path";
import {digest,observePreparedDependencyInputs,preparedDependencyIdentity} from "./scripts/local-canonical-inputs.mjs";
const repositoryRoot=process.env.AUGNES_RETAINED_PROJECT, phaseId="dependencies-web-planning";
const location_fingerprint=digest(path.join(repositoryRoot,"apps/web_planning/node_modules"));
try { const observation=observePreparedDependencyInputs({repositoryRoot,phaseId}); preparedDependencyIdentity(observation); console.log(JSON.stringify(observation)); }
catch (error) { console.log(JSON.stringify({location_fingerprint,phase_id:phaseId,error:error.code})); process.exitCode=1; }`;
export const finalDependencyCommand = "node --input-type=module -e " + JSON.stringify(finalDependencyProbe);

// This is a failed final observation, never a failed phase or a repaired historical after-state.
function verifyFinalDependencyFailure(r, stock, inputs, phases) {
  const i = r.inputs, events = i.events, deps = i.prepared_dependencies;
  const event = events?.[0], fault = event && faultOf(event);
  const environments = i.binding.phase_environment_fingerprints, browser = i.resources.find(v => v.id === "browser-executable");
  const ids = ["dependencies-root", "dependencies-nested", webPhase];
  const originalMode = v => v?.generated_directories?.every(d => d.state === "absent" || d.metadata.mode === d.parent_metadata.mode);
  if (r.run.id !== r.attempt.attempt_id || r.attempt.contract_fingerprint !== i.fingerprint ||
      i.binding.head !== r.repository.head_sha || i.binding.tree !== r.repository.tree_sha || i.binding.executor_fingerprint !== r.executor.source_fingerprint ||
      !equal(i.binding.runtime_inputs, inputs) || !equal(r.phases?.map(v => v.id), phases) ||
      !equal(environments?.map(v => v.id), phases) || !equal(r.evidence.planner_browser_phase_ids, phases.filter(id => id.startsWith("e2e-"))) ||
      r.evidence.mode !== "full" || r.evidence.selected_plan !== "full-canonical" || r.evidence.deciding !== false ||
      r.verification_context.kind !== "isolated-worktree" || r.repository.worktree_before !== "clean" || r.repository.worktree_after !== "clean" ||
      !settledIsolatedResources(r) || r.historical_inputs?.required !== true ||
      r.final.result !== "failure" || r.final.exit_status !== 1 || !equal(r.final.reason_codes, ["verification_cancelled"]) ||
      r.outcome.disposition !== "safety_violation" || r.outcome.safety !== "blocked" || r.outcome.validity !== "invalid_or_unknown" ||
      r.outcome.execution !== "incomplete_or_failed" || events?.length !== 1 || event.resource !== webPhase ||
      event.classification !== "execution" || event.disposition !== "safety_violation" || event.after !== null || event.diagnostic !== undefined ||
      !/^\d{1,40}$/u.test(event.monotonic_ns) || event.identity !== inputEventIdentity(event) ||
      !equal(i.first_fault,fault) || !equal(r.outcome.first_fault,fault) || !equal(i.secondary_faults,[]) ||
      !(Date.parse(event.observed_at) <= Date.parse(r.run.finished_at)) ||
      !r.phases.every((phase,index) => {
        const child = phase.cleanup;
        return phase.status === "pass" && phase.exit_status === 0 && phase.failure_code === null &&
          phase.timed_out === false && phase.spawn_error_code == null && child?.completed === true && child.termination_reason === "natural_exit" &&
          child.exit_observed === true && child.streams_closed === true && child.remaining_owned_processes === 0 &&
          [0,null].includes(child.listener_residue_count) && phase.invocation_id === r.run.invocation_id &&
          phase.browser === phase.id.startsWith("e2e-") && (!phase.browser || phase.base_sha === r.repository.base_sha && phase.head_sha === r.repository.head_sha) &&
          Date.parse(phase.started_at) >= Date.parse(index ? r.phases[index-1].finished_at : r.run.started_at) &&
          Date.parse(phase.started_at) <= Date.parse(phase.finished_at) && Date.parse(phase.finished_at) < Date.parse(event.observed_at) &&
          sha(phase.environment_fingerprint) && phase.environment_fingerprint === environments[index].fingerprint &&
          validPhaseBrowserUse(phase, phase.browser_use ?? [], browser);
      }) || !equal(deps?.map(v => v.phase_id),ids) || deps.some((v,index) =>
        v.before?.contract !== PREPARED_DEPENDENCY_CONTRACT || v.before.phase_id !== v.phase_id || !preparedDependencyIdentity(v.before) || !originalMode(v.before) ||
        (index < 2 ? v.unchanged !== true || v.error !== null || !originalMode(v.after) || comparePreparedDependencyInputs(v.before,v.after) !== "unchanged" :
          v.unchanged !== false || v.error !== "dependency_input_cache_unsafe" || v.after !== null ||
          !v.before.generated_directories.every(d => d.state === "absent")))) fail("revision_final_dependency_predecessor_invalid");
  if (stock.status !== "non_deciding_or_stale" || stock.valid_deciding_evidence !== false ||
      stock.content_fingerprint !== r.integrity.content_fingerprint || !equal(stock.dimensions,{historical_integrity:"intact",
        execution:"complete_pass",evidence_validity:"invalid_or_incomplete",safety:"blocked",current_merge_applicability:"blocked"}) ||
      !equal(stock.issues,["receipt_classified_outcome_not_passing","receipt_current_inputs_unverified","receipt_final_result_not_pass",
        "receipt_input_observation_blocked","receipt_non_deciding","receipt_prepared_dependency_inputs_invalid"])) fail("revision_final_dependency_stock_invalid");
  return deps[2].before;
}

export function verifyGitRevisionFailure(receipt, stock, inputs, phases, expectedOrdinal = 1, forward = false) {
  const previous = receipt.attempt?.source_correction;
  const { contract, path_kind, binding, resources } = receipt.inputs;
  if (!usesGitInventory(previous) || previous.commission.ordinal !== expectedOrdinal ||
      gitRevisionInventory(receipt.inputs) !== previous.inputs.inventory_sha256 ||
      digest({ contract, path_kind, binding, resources }) !== receipt.inputs.fingerprint)
    fail("revision_git_predecessor_invalid");
  if (forward) return verifyFinalDependencyFailure(receipt, stock, inputs, phases);
  verifySettledPhaseFailure(receipt, stock, inputs, phases, resources.find(r => r.id === "browser-executable"), false, expectedOrdinal);
}

// One prospective workload correction, not a repaired historical timeout or an
// additional slot in either spent commission. The ordinary complete failure
// reader above still checks every phase, input, Browser record and stock issue.
export function verifyReviewedWorkloadRepair(p, prior, original, focused, {git, parse, bytes, completedAt}) {
  const registration = "scripts/test-local-canonical-review-corrections.mjs";
  const budgets = "scripts/local-canonical-closeout-budgets.mjs";
  const command = "node " + registration + " --reviewed-revision-controls revision";
  const phase = original.phases.find(v => v.status === "failure");
  const w = focused.workload;
  if (!isGitAcquisitionRevision(prior.source_correction) || isReviewedWorkloadRevision(prior.source_correction) ||
      prior.source_correction.commission.ordinal !== 2 || phase?.id !== "authority" ||
      phase.log?.truncated !== false || phase.log.relative_path !== ".augnes-local-verification/logs/"+prior.attempt_id+"/authority.log" ||
      !w || !equal(Object.keys(w).sort(),["after","before","historical_log"]) ||
      !equal(focused.implicated_paths,[budgets,registration]) || !equal(focused.input_remedy_resources,[]))
    fail("revision_workload_predecessor_invalid");
  const log = bytes(w.historical_log);
  if (log.length !== phase.log.bytes) fail("revision_workload_log_invalid");
  const prefix = "AUGNES_REVIEW_CHILD_RESULT ";
  const children = log.toString("utf8").split(/\r?\n/u).filter(l=>l.startsWith(prefix)).map(l=>JSON.parse(l.slice(prefix.length)));
  const failed = children.filter(v=>v.control_id === "reviewed-revision");
  if (failed.length !== 1 || children.filter(v=>v.timed_out===true).length!==1 || failed[0].exit_code !== null || failed[0].signal !== "SIGTERM" ||
      failed[0].timed_out !== true || failed[0].cancelled !== false || failed[0].spawn_error_code !== null ||
      failed[0].termination_reason !== "bounded_timeout" || !Number.isSafeInteger(failed[0].duration_ms) || failed[0].duration_ms < 15000 ||
      !["exit_observed","streams_closed","cleanup_started","cleanup_completed"].every(k=>failed[0][k]===true) || failed[0].remaining_owned_processes !== 0)
    fail("revision_workload_log_invalid");
  const before=parse(w.before), after=parse(w.after), controls=[];
  for (const [witness,head] of [[before,prior.head],[after,p.head]]) {
    const r=witness.result;
    if(witness.tested_source_head!==head || witness.command!==command || witness.runtime_inputs_sha256!==p.inputs.identity_sha256 ||
       !sha(witness.environment) || witness.environment!==before.environment ||
       witness.fixture_sha256!==digest(git(["show",head+":scripts/fixtures/local-canonical-reviewed-revision.mjs"])) ||
       witness.node_version!==CANONICAL_NODE_VERSION || witness.registration_sha256!==digest(git(["show",head+":"+registration])) ||
       witness.budgets_sha256!==digest(git(["show",head+":"+budgets])) || r?.exit_code!==0 || r.signal!==null ||
       r.timed_out!==false || r.cancelled!==false || r.spawn_error_code!==null || r.termination_reason!=="natural_exit" ||
       !["exit_observed","streams_closed","cleanup_started","cleanup_completed"].every(k=>r[k]===true) || r.remaining_owned_processes!==0 ||
       !(Date.parse(witness.finished_at)>Date.parse(completedAt))) fail("revision_workload_focused_invalid");
    const summaries=bytes(witness.stdout).toString("utf8").split(/\r?\n/u).filter(l=>l.startsWith('{"reviewed_revision_controls":')).map(JSON.parse);
    if(summaries.length!==1 || summaries[0].synthetic_only!==true || summaries[0].reviewed_revision_controls?.length!==14)
      fail("revision_workload_focused_invalid");
    controls.push(summaries[0].reviewed_revision_controls);
  }
  if(!equal(controls[0],controls[1]) || !(Date.parse(before.finished_at)<Date.parse(after.finished_at) && Date.parse(after.finished_at)<=Date.parse(focused.finished_at)) ||
     !focused.commands.some(c=>c.command===command && equal(c.record,w.after) && equal(c.stdout,after.stdout))) fail("revision_workload_focused_invalid");
}

export function delegatesReviewedWorkloadCommission(body,p) {
  const paragraphs=visibleDelegationParagraphs(body);
  return paragraphs.length===4 && paragraphs[0]==="Authorize one terminal reviewed-revision workload correction assignment on "+p.branch+" in Draft PR #"+p.pull_request+"." &&
    paragraphs[1]==="Predecessor: "+p.prior_family_id+" / "+p.prior_attempt_id+" / "+p.prior_receipt_fingerprint+"." &&
    paragraphs[2]===WORKLOAD_HISTORY_BOUNDARY &&
    paragraphs[3]==="After independent acceptance of the exact published source and real preparation commitment, authorize the operator to record that decision faithfully and publish one separate new prospective workload commission through the authenticated maintainer identity. Exactly one deciding invocation total; reservation or interruption consumes it. No ordinal two, recovery, unchanged-target retry, successor or replacement commission. Complete planner-selected Full, separate fresh-process stock, owned cleanup and independent result audit remain required.";
}

export const GIT_SUCCESSOR_WORKLOAD_COMMAND = ["git", "git-successor"].map(group =>
  "node scripts/test-local-canonical-review-corrections.mjs --reviewed-revision-controls " + group + " <owned-shared-handoff>").join(" && ");
export const GIT_SUCCESSOR_WORKLOAD_SOURCES = Object.freeze([
  "scripts/test-local-canonical-review-corrections.mjs", "scripts/fixtures/local-canonical-reviewed-revision.mjs",
  "scripts/fixtures/local-canonical-git-observation.mjs", "scripts/fixtures/local-canonical-browser-successor.mjs",
  "scripts/fixtures/local-canonical-authority-clock.mjs", "scripts/fixtures/local-canonical-browser-revision.mjs",
  "scripts/fixtures/local-canonical-reviewed-workload.mjs", "scripts/fixtures/local-canonical-review-child-result.mjs",
  "scripts/fixtures/local-canonical-review-child-adverse.mjs", "scripts/local-canonical-closeout-budgets.mjs",
  "scripts/canonical-child-runner.mjs", "scripts/canonical-test-environment.mjs",
]);
const gitControls = ["protected Git race then effective change", "unrelated fault, incomplete stock and unsettled cleanup refused",
  "actual raw/effective input identities, incomplete inventory and stale tip", "exact product and regression byte witnesses",
  "preparation cannot reserve", "negative review, missing scope, spoofed authority and unsafe inputs refused",
  "exclusive successor, original ledger retained and read-only stock"];
const successorRefusals = ["stale and changed originals", "reset and third ordinal", "identical and whitespace-only source",
  "wrong witness", "missing and edited authority", "unstable inputs", "competing successor"];
const completeNaturalChild = r => r?.exit_code === 0 && r.signal === null && r.timed_out === false &&
  r.cancelled === false && r.spawn_error_code === null && r.termination_reason === "natural_exit" &&
  ["exit_observed", "streams_closed", "cleanup_started", "cleanup_completed"].every(k => r[k] === true) && r.remaining_owned_processes === 0;
const childRecords = log => log.toString("utf8").split(/\r?\n/u).filter(l => l.startsWith("AUGNES_REVIEW_CHILD_RESULT ")).map(l => JSON.parse(l.slice("AUGNES_REVIEW_CHILD_RESULT ".length)));

// This is the single exceptional edge from the already spent terminal grant.
// The complete generic failure reader runs first. These additional predicates
// distinguish the actual nested Git-successor incident from another timeout.
export function verifyPostTerminalGitSuccessorRepair(p, prior, original, focused, {git, parse, bytes, completedAt}) {
  const previous = prior.source_correction, phase = original.phases.find(v => v.status === "failure"), w = focused.workload;
  const required = ["scripts/test-local-canonical-review-corrections.mjs", "scripts/fixtures/local-canonical-authority-clock.mjs",
    "scripts/fixtures/local-canonical-review-child-result.mjs", "scripts/fixtures/local-canonical-reviewed-revision.mjs"];
  if (!isReviewedWorkloadRevision(previous) || previous.commission.ordinal !== 1 || previous.commission.maximum_invocations !== 1 ||
      phase?.id !== "authority" || phase.log?.truncated !== false ||
      phase.log.relative_path !== ".augnes-local-verification/logs/" + prior.attempt_id + "/authority.log" ||
      !w || !equal(Object.keys(w).sort(), ["after", "before", "historical_log"]) ||
      !required.every(name => focused.implicated_paths.includes(name) && git(["diff", "--no-ext-diff", "--no-textconv",
        "--ignore-all-space", "--ignore-blank-lines", prior.head, p.head, "--", name]).length)) fail("revision_git_workload_predecessor_invalid");
  const currentFiles = new Set(git(["ls-tree", "-r", "--name-only", p.head]).toString().trim().split("\n"));
  const changed = git(["diff", "--name-only", prior.head, p.head, "--"]).toString().trim().split("\n").filter(Boolean);
  const inventory = new Set(focused.source_files.map(v => v.path));
  if ([...GIT_SUCCESSOR_WORKLOAD_SOURCES, ...changed.filter(name => currentFiles.has(name))].some(name => !inventory.has(name)))
    fail("revision_git_workload_source_inventory_incomplete");
  const log = bytes(w.historical_log), children = childRecords(log), failed = children.filter(v => v.control_id === "reviewed-revision-git-successor");
  const outerStart = /^\[canonical:authority\] child_start label="reviewed revision controls: git-successor" timeout_ms=30000$/gmu;
  const outerEnd = /^\[canonical:authority\] child_result label="reviewed revision controls: git-successor" duration_ms=\d+ exit_code=1 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit$/gmu;
  let last = -1n;
  if (!original.inputs.events.every(event => {
    if (event.diagnostic !== undefined || !/^\d+$/u.test(event.monotonic_ns) || BigInt(event.monotonic_ns) <= last ||
        !(Date.parse(event.observed_at) >= Date.parse(original.run.started_at) && Date.parse(event.observed_at) <= Date.parse(original.run.finished_at))) return false;
    last = BigInt(event.monotonic_ns); return true;
  })) fail("revision_git_workload_observations_invalid");
  if (log.length !== phase.log.bytes || failed.length !== 1 || children.filter(v => v.timed_out === true).length !== 1 ||
      [...log.toString("utf8").matchAll(outerStart)].length !== 1 || [...log.toString("utf8").matchAll(outerEnd)].length !== 1 ||
      failed[0].exit_code !== null || failed[0].signal !== "SIGTERM" || failed[0].timed_out !== true || failed[0].cancelled !== false ||
      failed[0].spawn_error_code !== null || failed[0].termination_reason !== "bounded_timeout" ||
      !Number.isSafeInteger(failed[0].duration_ms) || failed[0].duration_ms < 15000 ||
      !["exit_observed", "streams_closed", "cleanup_started", "cleanup_completed"].every(k => failed[0][k] === true) ||
      failed[0].remaining_owned_processes !== 0 ||
      !["reviewed-revision", "reviewed-revision-git"].every(id => {
        const matches = children.filter(v => v.control_id === id);
        return matches.length === 1 && completeNaturalChild(matches[0]) && children.indexOf(matches[0]) < children.indexOf(failed[0]);
      })) fail("revision_git_workload_log_invalid");
  const before = parse(w.before), after = parse(w.after);
  // A retained HEAD argument stays HEAD. Its complete immutable archive binds
  // it to a real commit, rather than rewriting the old execution record.
  for (const [witness, expected] of [[before, prior.head], [after, after.tested_source_head]]) {
    const record = parse(witness.record), output = bytes(witness.stdout), driver = bytes(witness.driver);
    if (!/^[a-f0-9]{40}$/u.test(expected ?? "") || witness.tested_source_head !== expected ||
        witness.command !== GIT_SUCCESSOR_WORKLOAD_COMMAND || witness.runtime_inputs_sha256 !== p.inputs.identity_sha256 ||
        !sha(witness.environment) || witness.environment !== before.environment || witness.environment !== digest({
          runtime_inputs_sha256:p.inputs.identity_sha256, driver_sha256:record.driver?.sha256,
          environment_owner_sha256:record.source_files?.find(v => v.file === "scripts/canonical-test-environment.mjs")?.sha256
        }) || witness.node_version !== CANONICAL_NODE_VERSION ||
        witness.finished_at !== record.finished_at || !equal(witness.result, record.results?.[1]?.result) ||
        record.mode !== "plain" || record.instrumentation !== null || record.error !== null ||
        ![expected, "HEAD"].includes(record.revision) || !equal(record.groups, ["git", "git-successor"]) ||
        record.runtime_identity !== p.inputs.identity_sha256 || record.node !== CANONICAL_NODE_VERSION ||
        !equal(record.driver, {sha256:digest(driver), byte_size:driver.length}) || record.driver.sha256 !== parse(before.record).driver.sha256 ||
        record.output?.sha256 !== digest(output) ||
        // Bounded immutable archive read, not a checkout mutation or a new run.
        record.archive_sha256 !== digest(git(["archive", "--format=tar", expected], 128 * 1024 * 1024)) ||
        !equal(record.source_files?.map(v => v.file), GIT_SUCCESSOR_WORKLOAD_SOURCES) ||
        record.source_files.some(v => { const b = git(["show", expected + ":" + v.file]); return b.length !== v.byte_size || digest(b) !== v.sha256; }) ||
        record.results?.length !== 2 || !record.results.every((v,i) => v.group === record.groups[i] && completeNaturalChild(v.result) &&
          v.command === GIT_SUCCESSOR_WORKLOAD_COMMAND.split(" && ")[i]) ||
        record.cleanup?.records?.length !== 3 || !record.cleanup.records.every(v => v.completed === true && v.failure_count === 0 && equal(v.failures, [])) ||
        !(Date.parse(record.finished_at) > Date.parse(record.started_at) && Date.parse(record.started_at) > Date.parse(completedAt)))
      fail("revision_git_workload_focused_invalid");
    const lines = output.toString("utf8").split(/\r?\n/u), summaries = lines.filter(l => l.startsWith("{")).map(JSON.parse);
    const controls = summaries.filter(v => v.git_revision_controls), material = summaries.filter(v => v.material_successor);
    const nested = childRecords(output);
    if (controls.length !== 1 || controls[0].synthetic_only !== true || !equal(controls[0].git_revision_controls, gitControls) ||
        material.length !== 1 || material[0].synthetic_only !== true || !equal(material[0].material_successor,
          {first_stock:false, second_stock:true, consumed:2, same_commission:true, refused:successorRefusals}) ||
        !["git", "git-successor"].every(group => {
          const pass = summaries.filter(v => v.status === "pass" && equal(v.checks, ["reviewed revision controls: " + group]));
          const child = nested.filter(v => v.control_id === "reviewed-revision-" + group);
          return pass.length === 1 && pass[0].cleanup_complete === true && child.length === 1 && completeNaturalChild(child[0]);
        })) fail("revision_git_workload_controls_incomplete");
  }
  if (!(Date.parse(before.finished_at) < Date.parse(after.finished_at) && Date.parse(after.finished_at) <= Date.parse(focused.finished_at)) ||
      !focused.commands.some(c => c.command === GIT_SUCCESSOR_WORKLOAD_COMMAND && c.tested_source_head === after.tested_source_head &&
        equal(c.record, w.after) && equal(c.stdout, after.stdout))) fail("revision_git_workload_focused_invalid");
  if (after.tested_source_head !== p.head) {
    git(["merge-base", "--is-ancestor", after.tested_source_head, p.head]);
    const patch = git(["diff", "--binary", "--full-index", "--no-ext-diff", "--no-textconv", after.tested_source_head, p.head, "--"]);
    const paths = git(["diff", "--name-only", after.tested_source_head, p.head, "--"]).toString().trim().split("\n").filter(Boolean).sort();
    // Only non-executable documentation outside this sequence's consumers can
    // differ. Every other Git entry (including transitive dependencies) is equal.
    if (!paths.length || paths.some(name => !/^docs\/[A-Za-z0-9_./-]+\.md$/u.test(name)) ||
        !equal(after.equivalence, {target:p.head, classification:"documentation-only", delta:{bytes:patch.length, sha256:digest(patch), paths}}))
      fail("revision_git_workload_source_equivalence_invalid");
  } else if (after.equivalence !== undefined) fail("revision_git_workload_source_equivalence_invalid");
  return after.tested_source_head;
}

export function delegatesPostTerminalGitSuccessorCommission(body,p) {
  const paragraphs = visibleDelegationParagraphs(body);
  return paragraphs.length === 4 && paragraphs[0] === "Authorize one post-terminal Git-successor workload correction assignment on " + p.branch + " in Draft PR #" + p.pull_request + ". Explicitly adopt the exceptional old terminal ordinal one to new terminal ordinal one policy edge." &&
    paragraphs[1] === "Predecessor: " + p.prior_family_id + " / " + p.prior_attempt_id + " / " + p.prior_receipt_fingerprint + "." &&
    paragraphs[2] === POST_TERMINAL_HISTORY_BOUNDARY &&
    paragraphs[3] === "After independent acceptance of the implemented controls, exact published source and real preparation commitment, authorize the operator to record that decision faithfully and publish one separate new prospective post-terminal Git-successor commission through the authenticated maintainer identity. Exactly one deciding invocation total; reservation or interruption consumes it. No ordinal two, recovery, unchanged-target retry, successor or replacement commission. Complete planner-selected Full, separate fresh-process stock, owned cleanup and independent result audit remain required.";
}

// A later audit does not turn this complete successful invocation into a failed
// phase. Only the inventory-bound second ordinal can retain it as a positive tip.
export function verifyGitRevisionSuccess(r, stock, inputs, phases) {
  const i = r.inputs, previous = r.attempt?.source_correction;
  const { contract, path_kind, binding, resources } = i;
  const environments = binding.phase_environment_fingerprints;
  const browser = resources.find(v => v.id === "browser-executable");
  if (!isInventoryBoundRevision(previous) || previous.commission.ordinal !== 1 ||
      gitRevisionInventory(i) !== previous.inputs.inventory_sha256 || digest({contract,path_kind,binding,resources}) !== i.fingerprint ||
      r.run.id !== r.attempt.attempt_id || r.attempt.contract_fingerprint !== i.fingerprint ||
      binding.head !== r.repository.head_sha || binding.tree !== r.repository.tree_sha || binding.executor_fingerprint !== r.executor.source_fingerprint ||
      !equal(binding.runtime_inputs,inputs) || !equal(r.phases?.map(v=>v.id),phases) || !equal(environments?.map(v=>v.id),phases) ||
      !equal(r.evidence.planner_browser_phase_ids,phases.filter(id=>id.startsWith("e2e-"))) ||
      r.evidence.mode !== "full" || r.evidence.selected_plan !== "full-canonical" || r.evidence.deciding !== true ||
      r.verification_context.kind !== "isolated-worktree" || r.repository.worktree_before !== "clean" || r.repository.worktree_after !== "clean" ||
      !settledIsolatedResources(r) || r.historical_inputs?.required !== true ||
      r.final.result !== "pass" || r.final.exit_status !== 0 || !equal(r.final.reason_codes,[]) ||
      r.outcome.disposition !== "completed_success" || r.outcome.execution !== "complete_pass" ||
      r.outcome.validity !== "valid_within_observed_scope" || r.outcome.safety !== "preserved_within_observed_scope" ||
      r.outcome.first_fault !== null || i.first_fault !== null || !equal(i.secondary_faults,[]) ||
      !Array.isArray(i.events) || !i.events.every(e=>{
        const role=resources.find(v=>v.id===e.resource);
        return role && nonFaultInputChange(e.disposition) && e.identity===inputEventIdentity(e) &&
          e.classification===role.classification && classifyInputChange(role.before,e.after,role,i)===e.disposition;
      }) || !r.phases.every((phase,index)=>{
        const child=phase.cleanup;
        return phase.status === "pass" && phase.exit_status === 0 && phase.failure_code === null && phase.timed_out === false &&
          phase.spawn_error_code == null && child?.completed === true && child.termination_reason === "natural_exit" &&
          child.exit_observed === true && child.streams_closed === true && child.remaining_owned_processes === 0 &&
          [0,null].includes(child.listener_residue_count) && phase.invocation_id === r.run.invocation_id &&
          phase.browser === phase.id.startsWith("e2e-") && (!phase.browser || phase.base_sha === r.repository.base_sha && phase.head_sha === r.repository.head_sha) &&
          Date.parse(phase.started_at) >= Date.parse(index ? r.phases[index-1].finished_at : r.run.started_at) &&
          Date.parse(phase.started_at) <= Date.parse(phase.finished_at) && Date.parse(phase.finished_at) <= Date.parse(r.run.finished_at) &&
          sha(phase.environment_fingerprint) && phase.environment_fingerprint === environments[index].fingerprint &&
          validPhaseBrowserUse(phase,phase.browser_use ?? [],browser);
      }) || !equal(i.prepared_dependencies?.map(v=>v.phase_id),["dependencies-root","dependencies-nested",webPhase]) ||
      i.prepared_dependencies.some(v=>v.before?.contract !== PREPARED_DEPENDENCY_CONTRACT || v.before.phase_id !== v.phase_id ||
        !preparedDependencyIdentity(v.before) || v.unchanged !== true || v.error !== null || comparePreparedDependencyInputs(v.before,v.after) !== "unchanged"))
    fail("revision_positive_predecessor_invalid");
  if (stock.status !== "valid" || stock.valid_deciding_evidence !== true || stock.content_fingerprint !== r.integrity.content_fingerprint ||
      !equal(stock.issues,[]) || !equal(stock.dimensions,{historical_integrity:"intact",execution:"complete_pass",
        evidence_validity:"valid_in_recorded_context",safety:"preserved_within_observed_scope",current_merge_applicability:"matches_observed_context"}))
    fail("revision_positive_stock_invalid");
}

// Observe the same behavioral command on both exact Git sources and runtimes.
// The v10 repair runs its changed script directly. Prospective v7 also allows
// a stable test driver and explicit script arguments for the implicated code.
export function verifyGitSourceRepair(p, prior, focused, { git, parse, bytes, completedAt, retainedBefore, postPass = false, acquisition = false }) {
  const regression = focused.regression;
  const material = isMaterialSourceRevision(p);
  if (acquisition && (regression?.attribution !== "final-driver-prior-input-owner" ||
      !equal(focused.implicated_paths,["scripts/local-canonical-inputs.mjs"]))) fail("revision_git_regression_invalid");
  const file = regression?.path;
  const prospective = isInventoryBoundRevision(p);
  if (!Array.isArray(focused.implicated_paths) || !(prospective ? focused.source_files?.some(f => f.path === file) : focused.implicated_paths.includes(file)) ||
      typeof file !== "string" || !/^scripts\/(?:[\w.-]+\/)*[\w.-]+\.mjs$/u.test(file) ||
      file.split("/").some(part => part === "." || part === "..") ||
      !equal(focused.input_remedy_resources, []) || prior.tree === p.tree) fail("revision_material_remedy_required");
  const blob = head => git(["rev-parse", "--verify", head + ":" + file]).toString().trim();
  const newBlob = blob(p.head), oldBlob = postPass || acquisition ? newBlob : blob(prior.head);
  // Tree:path arguments also carry mode metadata. Compare the blob objects.
  if (!prospective && (oldBlob === newBlob ||
      !git(["diff", "--no-ext-diff", "--no-textconv", "--ignore-all-space", "--ignore-blank-lines", oldBlob, newBlob]).length))
    fail("revision_material_remedy_required");
  const before = parse(regression.before), after = parse(regression.after);
  const testedAfter = material ? materialWitnessSource(p,after,regression.after_equivalence,git) : p.head;
  const args = prospective ? regression.args : [];
  if (!Array.isArray(args) || args.length > 16 || args.some(arg => typeof arg !== "string" ||
      !/^(?:--?)?[a-zA-Z0-9][\w.=-]{0,127}$/u.test(arg))) fail("revision_git_regression_invalid");
  // The Canonical Web owner uses this exact existing TS loader. No arbitrary
  // Node flags, preload scripts or assertion-disabling options are accepted.
  const nodeArgs = Object.hasOwn(regression,"node_args") ? regression.node_args : [];
  if (!Array.isArray(nodeArgs)) fail("revision_git_regression_invalid");
  if (nodeArgs.length && (!material || !equal(nodeArgs,["--import","tsx"]))) fail("revision_git_regression_invalid");
  const command = retainedBefore ? finalDependencyCommand : ["node", ...nodeArgs, file, ...args].join(" ");
  if (retainedBefore) {
    const refusal = JSON.parse(bytes(before.stdout)), observed = JSON.parse(bytes(after.stdout));
    const child = observed.generated_directories?.[1];
    if (file !== inputOwner || args.length || !focused.implicated_paths.includes(inputOwner) || oldBlob === newBlob ||
        !equal(refusal,{location_fingerprint:retainedBefore.location_fingerprint,phase_id:webPhase,error:"dependency_input_cache_unsafe"}) ||
        comparePreparedDependencyInputs(retainedBefore, observed) !== "unchanged" ||
        observed.generated_directories[0].state !== "absent" || child?.path !== ".vite-temp" || child.state !== "proven_empty" ||
        child.metadata.mode === child.parent_metadata.mode || child.metadata.uid !== String(process.getuid()) ||
        !/^@@ /mu.test(git(["diff","--no-ext-diff","--no-textconv","--ignore-all-space","--ignore-blank-lines",oldBlob,newBlob]).toString()))
      fail("revision_final_dependency_remedy_invalid");
  }
  if (!focused.commands?.some(c => c.command === command && c.tested_source_head === testedAfter &&
      equal(c.record, regression.after) && equal(c.stdout, after.stdout)) ||
      before.stdout?.sha256 === after.stdout?.sha256 ||
      !(Date.parse(completedAt) < Date.parse(before.finished_at) && Date.parse(before.finished_at) < Date.parse(after.finished_at) &&
        Date.parse(after.finished_at) <= Date.parse(focused.finished_at))) fail("revision_git_regression_invalid");
  for (const [witness, head, exit] of [[before, prior.head, 1], [after, testedAfter, 0]]) {
    const r = witness.result;
    if (material && (!sha(witness.environment) || witness.environment !== before.environment || witness.dirty !== "" ||
        !equal(witness.modules,focused.implicated_paths.map(name=>({path:name,sha256:digest(git(["show",head+":"+name]))}))) ||
        !Array.isArray(witness.source_files) || !witness.source_files.length || witness.source_files.length > 256 ||
        new Set(witness.source_files.map(v=>v.path)).size !== witness.source_files.length ||
        [file,...focused.implicated_paths].some(name=>!witness.source_files.some(v=>v.path===name)) ||
        witness.source_files.some(v=>{if(typeof v.path!=="string" || !/^[A-Za-z0-9_./-]+$/u.test(v.path) || v.path.split("/").includes(".."))return true;
          const content=git(["show",head+":"+v.path]);return content.length!==v.byte_size || digest(content)!==v.sha256;})))
      fail("revision_git_regression_invalid");
    if ((postPass || acquisition) && (!sha(witness.environment) || witness.environment !== before.environment ||
        witness.fixture_sha256 !== digest(git(["show",p.head+":"+file])) ||
        !equal(witness.modules,focused.implicated_paths.map(name=>({path:name,sha256:digest(git(["show",head+":"+name]))})))))
      fail("revision_git_regression_invalid");
    if (witness.tested_source_head !== head || witness.file_sha256 !== digest(git(["show", ((postPass || acquisition) ? p.head : head) + ":" + file])) ||
        witness.command !== command || witness.runtime_inputs_sha256 !== p.inputs.identity_sha256 ||
        witness.node_version !== CANONICAL_NODE_VERSION || r?.exit_code !== exit || r.timed_out !== false ||
        r.cancelled !== false || r.cleanup_completed !== true || r.remaining_owned_processes !== 0 ||
        r.termination_reason !== "natural_exit" || r.exit_observed !== true || r.streams_closed !== true ||
        !bytes(witness.stdout,material ? 2*1024*1024 : undefined).length)
      fail("revision_git_regression_invalid");
  }
  return testedAfter;
}

function materialWitnessSource(p,witness,equivalence,git) {
  const tested=witness.tested_source_head;
  if (tested===p.head) {if(equivalence!==undefined)fail("revision_material_equivalence_invalid");return tested;}
  if (!/^[a-f0-9]{40}$/u.test(tested ?? "")) fail("revision_material_equivalence_invalid");
  git(["merge-base","--is-ancestor",tested,p.head]);
  const patch=git(["diff","--binary","--full-index","--no-ext-diff","--no-textconv",tested,p.head,"--"]);
  const paths=git(["diff","--name-only",tested,p.head,"--"]).toString().trim().split("\n").filter(Boolean).sort();
  if (!paths.length || paths.some(name=>!/^docs\/[A-Za-z0-9_./-]+\.md$/u.test(name)) ||
      !equal(equivalence,{target:p.head,classification:"documentation-only",delta:{bytes:patch.length,sha256:digest(patch),paths}}) ||
      !Array.isArray(witness.source_files) || witness.source_files.some(v=>digest(git(["show",p.head+":"+v.path]))!==v.sha256))
    fail("revision_material_equivalence_invalid");
  return tested;
}

// Read the two operative paragraphs of the maintainer's bounded delegation.
// An investigation, quoted template or negative decision with matching IDs
// does not delegate publication of a reviewed candidate's execution grant.
function visibleDelegationParagraphs(body) {
  // This authority format uses visible prose, headings and links. Reject markup
  // which can hide normative paragraphs in a comment, collapsed block or example.
  if (/[<>\u202a-\u202e\u2066-\u2069]/u.test(body) || /^(?: {4}|\t| {0,3}(?:`{3,}|~{3,}|\$\$))/mu.test(body)) return [];
  return body.replaceAll("\r\n", "\n").trim().split(/\n[ \t]*\n/u);
}

export function delegatesMaterialSourceCommission(body,p) {
  const paragraphs=visibleDelegationParagraphs(body);
  return paragraphs.length===4 && paragraphs[0] === "Authorize one materially corrected-source qualification assignment on " + p.branch + " in Draft PR #" + p.pull_request + ". Adopt the reusable material-source-correction-v1 transition within the existing inventory-bound v7 owners for the observed in-scope product defect." &&
    paragraphs[1] === "Predecessor: " + p.prior_family_id + " / " + p.prior_attempt_id + " / " + p.prior_receipt_fingerprint + "." &&
    paragraphs[2] === MATERIAL_HISTORY_BOUNDARY &&
    paragraphs[3] === "After separate independent acceptance of the actual correction, policy controls, exact published source and real preparation commitment, authorize the operator to record that decision faithfully and publish a separate new prospective commission through the authenticated maintainer identity. Each commission permits exactly one deciding invocation total; reservation or interruption consumes it. No ordinal two, recovery or unchanged-target retry under that commission. A further in-scope material correction requires fresh evidence, independent acceptance and new authenticated authority. Complete planner-selected qualification, separate fresh-process stock, owned cleanup and independent result audit remain required.";
}

function operativeAuthoritySections(body) {
  // Read this existing decision format, not arbitrary mentions of its target.
  // Ignore quoted/code/comment headings when locating sections. The operative
  // prefix itself must still be ordinary visible prose; later appendices may
  // contain historical records, including their own quoted decision templates.
  const lines = body.replaceAll("\r\n", "\n").trim().split("\n"), headings = [];
  let fence = null, comment = false;
  for (const [index, line] of lines.entries()) {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/u);
    if (fence) {
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) fence = null;
      continue;
    }
    if (comment || line.includes("<!--")) {
      if (line.includes("-->") || line.includes("<!--")) comment = line.lastIndexOf("<!--") > line.lastIndexOf("-->");
      continue;
    }
    if (marker) { fence = marker[1]; continue; }
    if (/^#{1,6} /u.test(line)) headings.push({ title: line, index });
  }
  return {lines,headings};
}

export function permitsFinalDependencySuccessor(body, p, commissionIdentity) {
  const {lines,headings}=operativeAuthoritySections(body);
  const boundary = "### Exact historical boundary and existing authority";
  const correction = "### Authorized bounded source correction";
  const permission = "### Explicit prospective continuation for this settled failure";
  if (headings[1]?.title !== boundary || headings[2]?.title !== correction || headings[3]?.title !== permission ||
      [boundary, permission].some(title => headings.filter(h => h.title === title).length !== 1)) return false;
  const paragraphs = visibleDelegationParagraphs(lines.slice(0, headings[4]?.index ?? lines.length).join("\n"));
  const section = paragraphs.indexOf(permission);
  const link = (type,id) => "https://github.com/hynk-studio/augnes/pull/"+p.pull_request+"#"+type+"-"+id;
  const fields = lines.slice(headings[1].index+1, headings[2].index);
  // The target is the first complete flat record after the heading. Do not scan
  // through prose or Markdown for fields that this record did not supply.
  const expected = {
    "Base/main": p.accepted.base, "Audited head": p.accepted.head, "Audited tree": p.accepted.tree,
    "Actual latest attempt": p.prior_attempt_id, "Latest failed receipt": p.prior_receipt_fingerprint,
    "Previous receipt": p.commission.root_receipt_fingerprint, "Current commission": commissionIdentity+", consumed 1/2",
    "Initial source acceptance": link("pullrequestreview",p.accepted.review.id),
    "Existing prospective grant": link("issuecomment",p.authorization.grant_comment_id),
  };
  const entries = Object.entries(expected);
  const record = fields.filter(line => line.trim()).slice(0, entries.length).map(line => line.trimEnd());
  return /^## Forward decision for the [\w.-]+ final-input failure — continue the same assignment$/u.test(paragraphs[0] ?? "") &&
    paragraphs[1]?.startsWith("This decision follows ") &&
    paragraphs[1].endsWith("and extends the existing [ongoing task delegation "+p.commission.delegation.id+"]("+link("issuecomment",p.commission.delegation.id)+") for the specific settled failure below.") &&
    paragraphs[2]?.startsWith("Complete ") && paragraphs[2].endsWith("as one assignment on "+p.branch+" in Draft PR #"+p.pull_request+".") &&
    paragraphs[3] === boundary && section > 3 &&
    paragraphs[section+1] === "I authorize the minimal existing-owner and policy extension needed for a materially corrected second candidate to follow this exact all-phase-pass, final dependency-observation failure." &&
    paragraphs[section+2]?.includes("the isolated dependency_input_cache_unsafe event on dependencies-web-planning, its missing v2 after-observation") &&
    entries.every(([label,value]) => record.includes(label+": "+value) &&
      fields.filter(line => line.trimStart().startsWith(label+":")).length === 1);
}

// This append-only decision amends only the remaining ordinal of the named
// positive predecessor. Its initial reviewed correction is an ancestry bound,
// not permission to execute an unreviewed final head.
export function readPostPassDecision(body,p,commissionIdentity) {
  if (!isInventoryBoundRevision(p) || p.commission.ordinal !== 2) return null;
  const {lines,headings}=operativeAuthoritySections(body);
  const titles=["## Forward decision for an independently found material defect after PASS",
    "### Exact preserved boundary","### Prospective policy and authority amendment",
    "### Material proof and full-boundary controls","### Conditional recording and final qualification"];
  if (!titles.every((title,i)=>headings[i]?.title===title && headings.filter(h=>h.title===title).length===1)) return null;
  const paragraphs=visibleDelegationParagraphs(lines.slice(0,headings[5]?.index ?? lines.length).join("\n"));
  const at=paragraphs.indexOf(titles[2]), record=lines.slice(headings[1].index+1,headings[2].index).filter(l=>l.trim());
  const reviewed=record.slice(0,8).find(line=>line.startsWith("- Current reviewed correction:"));
  const initial=reviewed?.match(/^- Current reviewed correction: head `([a-f0-9]{40})`, tree `([a-f0-9]{40})`, base\/main `([a-f0-9]{40})`\.$/u);
  if (!initial || paragraphs[0]!==titles[0] || paragraphs[3]!==titles[1]) return null;
  const url=(kind,id)=>"https://github.com/hynk-studio/augnes/pull/"+p.pull_request+"#"+kind+"-"+id;
  const intro=paragraphs[1]?.match(/^The user explicitly approved this same-commission post-PASS proposal on (\d{4}-\d{2}-\d{2}), after the \[receiving r([1-9]\d*) source and evidence audit ([1-9]\d*)\]\(([^)]+)\)\. (.*)$/u);
  if (!intro || intro[4]!==url("pullrequestreview",intro[3]) || intro[5]!=="The receiving ChatGPT is recording that approved prospective decision through the existing authenticated maintainer account. The operative scope below is the approved proposal; its draft-only wrapper has been removed. This records scope and conditional publication authority, not an already-issued runtime capability or a completed qualification.") return null;
  const assignment=paragraphs[2]?.replace(/^Continue issue #[1-9]\d*/u,"Continue issue");
  const expected=[reviewed,
    "- Actual latest settled qualification: head `"+p.accepted.head+"`, tree `"+p.accepted.tree+"`, base `"+p.accepted.base+"`.",
    "- Actual attempt: `"+p.prior_attempt_id+"`.",
    "- Latest successful receipt: `"+p.prior_receipt_fingerprint+"`.",
    "- Original prospective grant: ["+p.authorization?.grant_comment_id+"]("+url("issuecomment",p.authorization?.grant_comment_id)+").",
    "- Current commission: `"+commissionIdentity+"`, consumed 1/2.",
    "- Original accepted source: ["+p.accepted.review.id+"]("+url("pullrequestreview",p.accepted.review.id)+").",
    "- Retained commission root receipt: `"+p.commission.root_receipt_fingerprint+"`."];
  const matched=expected.every(line=>record.slice(0,8).map(l=>l.trimEnd()).includes(line) &&
    record.filter(l=>l.trimStart().startsWith(line.slice(0,line.indexOf(":")+1))).length===1);
  if (!matched || assignment!=="Continue issue on `"+p.branch+"` in Draft PR #"+p.pull_request+" as one cohesive correction and qualification assignment. Extend the existing [task delegation "+p.commission.delegation.id+"]("+url("issuecomment",p.commission.delegation.id)+") only as stated below. Complete the bounded existing-owner/policy extension, focused validation, independent final-source review, legitimate authority recording, planner-required Mac qualification, fresh-process stock, cleanup and consolidated handoff together." ||
      paragraphs[at+1]!=="I authorize the narrow extension of the existing inventory-bound v7 reviewed-revision owners to admit one materially corrected successor after a settled ordinal-one PASS when an independent audit has demonstrated a real defect in that source. This is a prospective amendment for the existing remaining ordinal two. It does not rewrite grant"+p.authorization.grant_comment_id+" or claim that its failure/false-stock clause already covers success. The original grant remains historical accounting and scope evidence; this separately authenticated, append-only decision supplies the additional post-PASS permission.") return null;
  const final=paragraphs.indexOf(titles[4]);
  const recording=paragraphs[final+1] ?? "";
  const permission="After a separate read-only reviewer accepts the actual final published source, policy and controls, the implementation operator is authorized under this decision and task delegation"+p.commission.delegation.id+" to transcribe that independent decision faithfully and publish the required final-source authority binding through the existing authenticated maintainer identity. Preserve the review original verbatim and disclose reviewer versus submitting operator. Bind the actual final head/tree/current base, preparation/current-input commitment and inventory, successful predecessor, original grant/commission, ordinal two and this prospective amendment. ";
  if (!recording.startsWith(permission) || !/^The eventual final-source acceptance must follow the completed source and focused evidence; current r[1-9]\d* review[1-9]\d* is not approval of an unseen future change\.$/u.test(recording.slice(permission.length))) return null;
  return {head:initial[1],tree:initial[2],base:initial[3]};
}

export function postPassReviewFields(p,commissionIdentity) {
  const url=(kind,id)=>"https://github.com/hynk-studio/augnes/pull/"+p.pull_request+"#"+kind+"-"+id;
  return {"Base":p.base,"Head":p.head,"Tree":p.tree,"Branch":p.branch,"Pull request":String(p.pull_request),
    "Preparation commitment":gitReviewTarget(p),"Current inventory":p.inputs.inventory_sha256,"Runtime inputs":p.inputs.identity_sha256,
    "Successful predecessor attempt":p.prior_attempt_id,"Successful predecessor receipt":p.prior_receipt_fingerprint,
    "Original grant":url("issuecomment",p.authorization.grant_comment_id),"Original commission":commissionIdentity,
    "Ordinal":"2/2","Forward decision":url("issuecomment",p.commission.forward_decision.id)};
}

export function permitsPostPassReview(body,p,commissionIdentity) {
  const {lines,headings}=operativeAuthoritySections(body);
  const heading="### Exact post-PASS successor";
  const fields=Object.entries(postPassReviewFields(p,commissionIdentity));
  const section=lines.slice(headings[0]?.index+1,headings[1]?.index ?? lines.length);
  const record=section.filter(l=>l.trim()).slice(0,fields.length).map(l=>l.trimEnd());
  const recordEnd=section.map((line,index)=>line.trim()?index:-1).filter(index=>index>=0)[fields.length-1];
  return lines[0]==="Source review decision: ACCEPT / RETAIN for prospective qualification." &&
    headings[0]?.title===heading && headings.filter(h=>h.title===heading).length===1 &&
    lines.slice(1,headings[0].index).every(l=>!l.trim()) &&
    fields.every(([label,value])=>record.includes(label+": "+value) && section.filter(l=>l.trimStart().startsWith(label+":")).length===1) &&
    visibleDelegationParagraphs(section.slice(recordEnd+1).join("\n"))[0]==="Under the authenticated forward decision above, I record the independently accepted final source and authorize only ordinal two of the retained commission for this exact preparation commitment. No unchanged-target retry or extra recovery is authorized.";
}

export function delegatesProspectiveCommission(body, branch, pullRequest) {
  const paragraphs = visibleDelegationParagraphs(body);
  const heading = "### 4. Delegated public recording after independent source review";
  const index = paragraphs.indexOf(heading);
  const assignment = "This authorizes one cohesive correction and qualification assignment on " + branch + " in Draft PR #" + pullRequest;
  return paragraphs[1]?.startsWith(assignment + ", following the ") && index > 1 && index === paragraphs.lastIndexOf(heading) &&
    paragraphs[index + 1] === "After a separate read-only reviewer accepts the actual final published registration, continuation, policy and control changes, the implementation operator is authorized to publish the independent decision faithfully and the subsequent required prospective commission/execution authority through the existing authenticated maintainer identity under this task delegation.";
}

export function delegatesGitRevisionGrant(body, branch, pullRequest) {
  const paragraphs = visibleDelegationParagraphs(body);
  if (!paragraphs.length) return false;
  const scope = paragraphs[0].match(/^Authorize one cohesive correction and qualification assignment for issue #[1-9]\d* on (.+) and Draft PR #([1-9]\d*)\.$/u);
  const title = "## Delegated recording after independent review";
  const section = paragraphs.indexOf(title);
  if (scope?.[1] !== branch || scope[2] !== String(pullRequest) || section < 1 || paragraphs.lastIndexOf(title) !== section) return false;
  return /^After a separate read-only reviewer accepts the actual final published (?:source|fixture, continuation, policy and control changes), the implementation operator is explicitly authorized to publish the required separate exact-candidate execution record through the existing authenticated maintainer identity under this delegation\.$/u.test(paragraphs[section + 1] ?? "");
}

export function gitReviewTarget(p) {
  return digest({schema:p.schema, branch:p.branch, pull_request:p.pull_request, base:p.base, head:p.head, tree:p.tree,
    prior:[p.prior_family_id,p.prior_number,p.prior_attempt_id,p.prior_receipt_fingerprint],
    originals:p.originals, inputs:p.inputs, source:p.source, focused:p.focused, commission:p.commission});
}
