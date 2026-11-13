import { PREPARED_ELIGIBILITY_REPAIR, PREPARED_ELIGIBILITY_CLAIM, PREPARED_ELIGIBILITY_GRANT, verifyPreparedEligibilityRepair } from "./local-canonical-prepared-eligibility-witness.mjs";
import { VERIFIER_LIFECYCLE_REPAIR, VERIFIER_LIFECYCLE_CLAIM, VERIFIER_LIFECYCLE_GRANT, verifyVerifierLifecycleRepair } from "./local-canonical-verifier-lifecycle-witness.mjs";
import { isSerialAggregateRevision, hasSerialAccounting } from "./local-canonical-serial-aggregate.mjs";
import { validProjectExperienceAccounting } from "./project-experience-serial-budget.mjs";
import { digest, classifyInputChange, effectiveInputObservation, inputEventIdentity, nonFaultInputChange, INPUT_CONTRACT, PREPARED_DEPENDENCY_CONTRACT, comparePreparedDependencyInputs, preparedDependencyIdentity } from "./local-canonical-inputs.mjs";
import { settledIsolatedResources, cancelledPhase, verifySettledPhaseFailure } from "./local-canonical-browser-revision.mjs";
import { validPhaseBrowserUse } from "./local-canonical-browser-identity.mjs";
import { CANONICAL_NODE_VERSION } from "./local-canonical-environment.mjs";
import { REGISTERED_FIXTURE_BUDGET, verifyRegisteredFixtureBudget,
  REGISTERED_INTEGRATION_BUDGET, INTEGRATION_BUDGET_CLAIM, verifyRegisteredIntegrationBudget,
  SELECTIVE_FIXTURE_WORKLOAD, SELECTIVE_FIXTURE_WORKLOAD_CLAIM, verifySelectiveFixtureWorkload } from "./local-canonical-fixture-budget-witness.mjs";
import { GENERATED_STOCK_REPAIR, GENERATED_STOCK_CLAIM, GENERATED_STOCK_GRANT,
  verifyGeneratedStockRepair } from "./local-canonical-stock-lifecycle-witness.mjs";
import { REPOSITORY_TYPECHECK, verifyRepositoryTypecheck } from "./local-canonical-typecheck-witness.mjs";
import { REPOSITORY_PURE_CONTRACT, verifyRepositoryPureContract } from "./local-canonical-pure-contract-witness.mjs";

export const isGitObservationRevision = p =>
  p?.schema === "augnes.local-canonical-source-correction.v10" && p.kind === "reviewed_revision";
export const isGitObservationSuccessor = p => isGitObservationRevision(p) && p.commission?.ordinal === 2;
// Prospective input remedy within the existing v10 commission. Legacy v10
// records without this discriminator keep their production RED/GREEN rule.
export const GIT_INPUT_REVISION = "stable-protected-git-input-v1";
export const DIRECT_GIT_INPUT_REVISION = "direct-protected-git-input-v1";
export const isDirectGitInputRevision = p => isGitObservationRevision(p) &&
  p.commission?.input_revision === DIRECT_GIT_INPUT_REVISION;
export const isGitInputRevision = p => isGitObservationRevision(p) &&
  [GIT_INPUT_REVISION, DIRECT_GIT_INPUT_REVISION].includes(p.commission?.input_revision);
export const GIT_INPUT_HISTORY_BOUNDARY = "Historical window remains UNKNOWN; original false stock and consumed invocation remain unchanged.";
export const DIRECT_GIT_INPUT_HISTORY_BOUNDARY = "Original direct Git input invalidation, false stock and consumed invocation remain unchanged.";
export const gitInputHistoryBoundary = p => isDirectGitInputRevision(p) ? DIRECT_GIT_INPUT_HISTORY_BOUNDARY : GIT_INPUT_HISTORY_BOUNDARY;
// A v7 commission descending from the spent Git-observation chain keeps the
// complete input inventory throughout its physical lineage.
export const isInventoryBoundRevision = p => p?.schema === "augnes.local-canonical-source-correction.v7" &&
  p.kind === "reviewed_revision" && !isSerialAggregateRevision(p) && Object.hasOwn(p.inputs ?? {}, "inventory_sha256");
export const GIT_ACQUISITION_REPAIR = "coherent-git-file-acquisition-v1";
export const isGitAcquisitionRevision = p => isInventoryBoundRevision(p) &&
  p.commission?.input_acquisition === GIT_ACQUISITION_REPAIR;
// A new exact-target commission for a materially corrected natural product
// failure. Acquisition remains provenance, not the current incident kind.
export const MATERIAL_SOURCE_CORRECTION = "material-source-correction-v1";
export const isMaterialSourceRevision = p => isInventoryBoundRevision(p) &&
  p.commission?.source_revision === MATERIAL_SOURCE_CORRECTION;
export const MATERIAL_HISTORY_BOUNDARY = "Historical windows remain UNKNOWN; all prior commissions, issued limits, consumed invocations, receipts and false stock remain unchanged.";
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
export function gitObservationIncident(r, prior, completion, stock, phases, inputRevision = null) {
  if (inputRevision !== null && ![GIT_INPUT_REVISION, DIRECT_GIT_INPUT_REVISION].includes(inputRevision)) fail("revision_git_predecessor_invalid");
  return readGitIncident(r, prior, completion, stock, phases, false, inputRevision === DIRECT_GIT_INPUT_REVISION);
}

// Prospective eligibility only. A later complete ambient observation does not
// complete or retrospectively validate the historical failed acquisition.
export function gitAcquisitionIncident(r, prior, completion, stock, phases) {
  return readGitIncident(r, prior, completion, stock, phases, true);
}

function readGitIncident(r, prior, completion, stock, phases, acquisition, direct = false) {
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
      r.outcome.disposition !== (direct ? "input_invalidation" : "unknown_relevance") || r.outcome.safety !== "blocked" ||
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
  const race = direct ? null : faults[0];
  const later = acquisition ? i.events.filter(e => e.resource === git.id && e.disposition === "ambient_observation" &&
    race && BigInt(e.monotonic_ns) > BigInt(race.monotonic_ns)) : [];
  const change = direct ? faults[0] : acquisition ? later[0] : faults[1];
  if (faults.length !== (direct || acquisition ? 1 : 2) || (!direct && (race?.resource !== git.id || race.disposition !== "observer_failure")) || change?.resource !== git.id ||
      change.disposition !== (acquisition ? "ambient_observation" : "input_invalidation") ||
      !gitObservation(change.after) || git.before.sha256 === change.after.sha256 ||
      (acquisition ? later.length !== 1 || !equal(effectiveInputObservation(git.before,git,i),effectiveInputObservation(change.after,git,i)) ||
        binding.head !== a.head || binding.tree !== a.tree :
        git.before.git_projection.effective_sha256 === change.after.git_projection.effective_sha256 ||
        git.before.git_projection.scope_fingerprint !== change.after.git_projection.scope_fingerprint) ||
      direct && (binding.head !== a.head || binding.tree !== a.tree ||
        git.before.permission_identity !== change.after.permission_identity ||
        ["device", "uid", "gid", "mode", "links"].some(k => git.before.metadata[k] !== change.after.metadata[k])) ||
      !equal(i.first_fault,faultOf(direct ? change : race)) || !equal(r.outcome.first_fault,i.first_fault) ||
      !equal(i.secondary_faults,direct || acquisition ? [] : [faultOf(change)])) fail("revision_git_observations_invalid");
  const phase = cancelledPhase(r.phases,(direct ? change : race).observed_at);
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
  // The original separate reader may have lacked the physical anchor. Keep its
  // refusal verbatim; production preparation/reservation/stock must still
  // verifyRevisionOriginals and reconstruct the exact physical latest tip.
  const expected = [...(direct && stock.issues?.includes("receipt_attempt_records_unverified") ? ["receipt_attempt_records_unverified"] : []),
    "receipt_classified_outcome_not_passing",...(acquisition ? browserIssues : ["receipt_current_inputs_unverified"]),"receipt_final_result_not_pass",
    "receipt_input_observation_blocked","receipt_non_deciding", ...(r.phases.some(p=>p.status==="not_run") ? ["receipt_phase_environment_binding_invalid"] : []),
    ...r.phases.filter(p=>p.status!=="pass").map(p=>"phase_not_passing:"+p.id)].sort();
  if (stock.status !== "non_deciding_or_stale" || stock.valid_deciding_evidence !== false ||
      stock.content_fingerprint !== r.integrity.content_fingerprint || !equal([...stock.issues].sort(),expected) ||
      !equal(stock.dimensions,{historical_integrity:"intact",execution:"incomplete_or_failed",evidence_validity:"invalid_or_incomplete",safety:"blocked",current_merge_applicability:acquisition ? "matches_observed_context" : "blocked"}))
    fail("revision_git_stock_invalid");
  return { config:git, ...(!direct ? {race} : {}), change, phase };
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

// This lane may integrate its verifier and corresponding policy/controls, but
// cannot disguise a product edit as an unchanged-product input correction.
const gitInputVerificationPaths = new Set([
  "scripts/local-canonical-git-observation.mjs", "scripts/local-canonical-attempts.mjs",
  "scripts/run-local-canonical-verification.mjs", "scripts/local-canonical-receipt.mjs",
  "scripts/local-canonical-review-export.mjs", "scripts/local-canonical-inputs.mjs",
  "scripts/fixtures/local-canonical-git-observation.mjs", "scripts/fixtures/local-canonical-reviewed-revision.mjs",
  "scripts/fixtures/local-canonical-git-input.mjs", "scripts/test-local-canonical-review-corrections.mjs",
  "scripts/test-local-canonical-verification-contract.mjs", "scripts/run-canonical-test-suite.mjs", ".github/LOCAL_CANONICAL_VERIFICATION.md",
  "docs/LOCAL_CANONICAL_INPUT_CONTRACT.md", "docs/vnext/03_AUGNES_VNEXT_TRANSITION_ROADMAP.md",
  "docs/vnext/04_AUGNES_VNEXT_EVALUATION_AND_MATURITY.md",
]);

export function verifyGitInputRemedy(p, original, incident, source, focused, { parse }) {
  const snapshot = parse(focused.input_inventory);
  const { contract, path_kind, binding, resources } = snapshot;
  if (gitRevisionInventory(snapshot) !== p.inputs.inventory_sha256 ||
      digest({contract,path_kind,binding,resources}) !== snapshot.fingerprint ||
      snapshot.first_fault !== null || !equal(snapshot.secondary_faults, []) || !equal(snapshot.events, []) ||
      !equal(focused.input_remedy_resources, ["git-config"]) || !equal(focused.implicated_paths, []) ||
      Object.hasOwn(focused, "regression")) fail("revision_git_input_remedy_invalid");
  // The legacy stable-input alternative still requires unchanged product. The
  // explicit direct case instead binds its complete source delta and requires
  // independent exact-source acceptance; a product correction is never its
  // input remedy and supplies no historical product-failure classification.
  if (!isDirectGitInputRevision(p) && source.predecessor_to_final.paths.some(name => !gitInputVerificationPaths.has(name)))
    fail("revision_product_source_changed");
  const current = resources.find(r => r.id === "git-config"), before = incident.config;
  const after = incident.change.after;
  if (current.location_fingerprint !== before.location_fingerprint || !equal(current.gitTracking, before.gitTracking) ||
      !equal(current.before.git_projection, after.git_projection) ||
      current.before.permission_identity !== after.permission_identity ||
      ["device", "uid", "gid", "mode", "links"].some(k => current.before.metadata[k] !== after.metadata[k]) ||
      current.before.git_projection.effective_sha256 === before.before.git_projection.effective_sha256)
    fail("revision_git_input_remedy_invalid");
  const oldNode = original.inputs.resources.find(r => r.id === "node-executable");
  const node = resources.find(r => r.id === "node-executable");
  if (node.location_fingerprint !== oldNode.location_fingerprint || node.before.sha256 !== oldNode.before.sha256)
    fail("revision_git_input_remedy_invalid");
  return snapshot;
}

// Current applicability, never immutable historical lineage interpretation.
// A later published source correction must not invalidate its retained first edge.
export function verifyGitInputPublication(p, original, git) {
  if (!isGitInputRevision(p)) return;
  const value = args => git(args).toString().trim();
  if (value(["remote", "get-url", "origin"]) !== original.repository.origin ||
      value(["config", "--get-all", `branch.${p.branch}.remote`]) !== "origin" ||
      value(["config", "--get-all", `branch.${p.branch}.merge`]) !== `refs/heads/${p.branch}` ||
      value(["rev-parse", "--verify", "refs/remotes/origin/"+p.branch]) !== p.head)
    fail("revision_git_publication_unsettled");
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

export function verifyGitRevisionFailure(receipt, stock, inputs, phases, expectedOrdinal = 1, forward = false, serialPredecessor = false, generatedStockSerial = false, historicalStockKind = null) {
  const previous = receipt.attempt?.source_correction;
  const { contract, path_kind, binding, resources } = receipt.inputs;
  if (!(usesGitInventory(previous) || serialPredecessor && isSerialAggregateRevision(previous)) || previous.commission.ordinal !== expectedOrdinal ||
      gitRevisionInventory(receipt.inputs) !== previous.inputs.inventory_sha256 ||
      digest({ contract, path_kind, binding, resources }) !== receipt.inputs.fingerprint)
    fail("revision_git_predecessor_invalid");
  if (forward) return verifyFinalDependencyFailure(receipt, stock, inputs, phases);
  verifySettledPhaseFailure(receipt, stock, inputs, phases, resources.find(r => r.id === "browser-executable"),
    generatedStockSerial || isGitObservationRevision(previous) && expectedOrdinal === 1, expectedOrdinal, generatedStockSerial, historicalStockKind);
  if (hasSerialAccounting(previous) && receipt.phases.some(p=>p.id === "e2e-project-experience" && p.status === "pass" && !validProjectExperienceAccounting(p.serial_budget)))
    fail("revision_inherited_serial_accounting_invalid");
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

// Proposed v10-only alternative. This is not an execution grant. The caller
// retains authenticated review/grant, physical lineage, input and stock checks.
export function verifyCanonicalTsRepair(p, prior, focused, {git, parse, bytes, completedAt, repositoryRoot}) {
  const regression = focused.regression, file = regression.path;
  const command = "node --import tsx scripts/test-project-client-browser.ts";
  const paths = focused.implicated_paths, fixture = regression.fixture_paths;
  if (!isGitObservationSuccessor(p) || file !== "scripts/test-project-client-browser.ts" ||
      focused.failed_phase !== "e2e-project-experience" ||
      !equal(regression.node_args,["--import","tsx"]) || !equal(regression.args,[]) ||
      !equal(focused.input_remedy_resources,[]) || prior.tree === p.tree ||
      !Array.isArray(paths) || !paths.length || new Set(paths).size !== paths.length || paths.includes(file) ||
      paths.some(name => !/^scripts\/(?:[\w.-]+\/)*[\w.-]+\.(?:ts|tsx|mjs)$/u.test(name) || name.split("/").includes("..")) ||
      !Array.isArray(fixture) || !fixture.includes(file) || new Set(fixture).size !== fixture.length ||
      fixture.some(name => paths.includes(name)) || !focused.source_files?.some(v=>v.path===file))
    fail("revision_git_regression_invalid");
  // A full candidate catalogue, with only the named implicated modules replaced
  // by predecessor bytes for RED. No sparse dependency list or claimed clean
  // predecessor checkout can conceal a different effective driver/fixture.
  const catalogue = head => git(["ls-tree","-rz",head]).toString().split("\0").filter(Boolean).map(line => {
    const match = /^(100644|100755) blob ([a-f0-9]{40})\t(.+)$/u.exec(line);
    if (!match || !/^[\w./\[\]-]+$/u.test(match[3]) || match[3].split("/").includes("..")) fail("revision_git_regression_invalid");
    return {path:match[3],mode:match[1]};
  });
  const target = catalogue(p.head);
  if ([...paths,...fixture].some(name=>!target.some(v=>v.path===name))) fail("revision_git_regression_invalid");
  for (const name of paths) {
    const oldBlob=git(["rev-parse","--verify",prior.head+":"+name]).toString().trim();
    const newBlob=git(["rev-parse","--verify",p.head+":"+name]).toString().trim();
    if (oldBlob===newBlob || !/^@@ /mu.test(git(["diff","--no-ext-diff","--no-textconv","--ignore-all-space","--ignore-blank-lines",oldBlob,newBlob]).toString()))
      fail("revision_material_remedy_required");
  }
  const source = head => target.map(entry=>{
    const content=git(["show",(paths.includes(entry.path)?head:p.head)+":"+entry.path]);
    return {...entry,byte_size:content.length,sha256:digest(content)};
  });
  const finalSource=source(p.head), fixtureDigest=digest(finalSource.filter(v=>fixture.includes(v.path)));
  const before=parse(regression.before),after=parse(regression.after);
  const readSource = witness => {
    try { return JSON.parse(bytes(witness.source_files,2*1024*1024)); }
    catch { fail("revision_git_regression_invalid"); }
  };
  const dependencyIdentity = observation => {
    if (typeof repositoryRoot!=="string" || !repositoryRoot.startsWith("/") ||
        observation?.contract!==PREPARED_DEPENDENCY_CONTRACT || observation.phase_id!=="dependencies-root" ||
        observation.location_fingerprint!==digest(repositoryRoot+"/node_modules") ||
        !equal(observation.sources,["package.json","package-lock.json"].map(name=>{
          const content=git(["show",p.head+":"+name]); return {name,sha256:digest(content),bytes:content.length};
        }))) fail("revision_git_regression_invalid");
    const identity=preparedDependencyIdentity(observation);
    if (!identity) fail("revision_git_regression_invalid");
    return identity;
  };
  const dependencies=before.prepared_dependencies;
  if (!dependencies || !equal(dependencyIdentity(dependencies.before),dependencyIdentity(dependencies.after)))
    fail("revision_git_regression_invalid");
  if (!focused.commands?.some(c=>c.command===command && c.tested_source_head===p.head &&
      equal(c.record,regression.after) && equal(c.stdout,after.stdout)) ||
      before.stdout?.sha256===after.stdout?.sha256 ||
      !(Date.parse(completedAt)<Date.parse(before.finished_at) && Date.parse(before.finished_at)<Date.parse(after.finished_at) &&
        Date.parse(after.finished_at)<=Date.parse(focused.finished_at))) fail("revision_git_regression_invalid");
  for (const [witness,head,exit] of [[before,prior.head,1],[after,p.head,0]]) {
    const result=witness.result;
    if (witness.attribution!=="candidate-driver-prior-implicated-source" || witness.driver_source_head!==p.head ||
        witness.tested_source_head!==head || !equal(readSource(witness),head===p.head?finalSource:source(head)) ||
        !witness.prepared_dependencies ||
        !equal(dependencyIdentity(witness.prepared_dependencies.before),dependencyIdentity(dependencies.before)) ||
        !equal(dependencyIdentity(witness.prepared_dependencies.after),dependencyIdentity(dependencies.before)) ||
        witness.fixture_sha256!==fixtureDigest || !sha(witness.environment) || witness.environment!==before.environment ||
        witness.file_sha256!==digest(git(["show",p.head+":"+file])) ||
        !equal(witness.modules,paths.map(name=>({path:name,sha256:digest(git(["show",head+":"+name]))}))) ||
        witness.command!==command || witness.node_version!==CANONICAL_NODE_VERSION ||
        witness.runtime_inputs_sha256!==p.inputs.identity_sha256 || result?.exit_code!==exit || result.timed_out!==false ||
        result.cancelled!==false || result.cleanup_completed!==true || result.remaining_owned_processes!==0 ||
        result.termination_reason!=="natural_exit" || result.exit_observed!==true || result.streams_closed!==true ||
        !bytes(witness.stdout,2*1024*1024).length) fail("revision_git_regression_invalid");
  }
  return p.head;
}

// Observe the same behavioral command on both exact Git sources and runtimes.
// The v10 repair runs its changed script directly. Prospective v7 also allows
// a stable test driver and explicit script arguments for the implicated code.
export function verifyGitSourceRepair(p, prior, focused, { git, parse, bytes, completedAt, retainedBefore, postPass = false, acquisition = false, original, stock, completion, repositoryRoot }) {
  const regression = focused.regression;
  if (isGitObservationSuccessor(p) && regression?.attribution === "candidate-driver-prior-implicated-source")
    return verifyCanonicalTsRepair(p,prior,focused,{git,parse,bytes,completedAt,repositoryRoot});
  const material = isMaterialSourceRevision(p);
  if (regression?.kind!==undefined) {
    if (!material) fail("revision_git_regression_invalid");
    if (regression.kind===VERIFIER_LIFECYCLE_REPAIR)
      return verifyVerifierLifecycleRepair(p, prior, focused, { git, parse, bytes, completedAt, original, stock, completion, repositoryRoot });
    if (regression.kind===REGISTERED_FIXTURE_BUDGET) return verifyRegisteredFixtureBudget(p,prior,focused,{git,parse,bytes,completedAt,original,completion,repositoryRoot});
    if (regression.kind===SELECTIVE_FIXTURE_WORKLOAD) return verifySelectiveFixtureWorkload(p,prior,focused,{git,parse,bytes,completedAt,original,completion,repositoryRoot});
    if (regression.kind===REGISTERED_INTEGRATION_BUDGET) return verifyRegisteredIntegrationBudget(p,prior,focused,{git,parse,bytes,completedAt,original,completion,repositoryRoot});
    if (regression.kind===PREPARED_ELIGIBILITY_REPAIR)
      return verifyPreparedEligibilityRepair(p, prior, focused, { git, parse, bytes, completedAt, original, stock, completion });
    if (regression.kind===GENERATED_STOCK_REPAIR)
      return verifyGeneratedStockRepair(p, prior, focused, { git, parse, bytes, completedAt, original, stock, completion });
    if (p.commission.evidence_kind!==undefined) fail("revision_git_regression_invalid");
    if (regression.kind===REPOSITORY_TYPECHECK) return verifyRepositoryTypecheck(p,prior,focused,{git,parse,bytes,completedAt});
    if (regression.kind===REPOSITORY_PURE_CONTRACT) return verifyRepositoryPureContract(p,prior,focused,{git,parse,bytes,completedAt});
    fail("revision_git_regression_invalid");
  }
  if (p.commission.evidence_kind!==undefined) fail("revision_git_regression_invalid");
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
  if (p.commission.evidence_kind === SELECTIVE_FIXTURE_WORKLOAD) return !!readSelectiveFixtureWorkloadDelegation(body,p);
  if (p.commission.evidence_kind === VERIFIER_LIFECYCLE_REPAIR) return !!readVerifierLifecycleDelegation(body,p);
  if (p.commission.evidence_kind === PREPARED_ELIGIBILITY_REPAIR) return !!readPreparedEligibilityDelegation(body,p);
  if (p.commission.evidence_kind === REGISTERED_INTEGRATION_BUDGET)
    return !!readIntegrationBudgetDelegation(body,p);
  if (p.commission.evidence_kind === GENERATED_STOCK_REPAIR)
    return !!readGeneratedStockDelegation(body,p);
  const paragraphs=visibleDelegationParagraphs(body);
  return paragraphs.length===4 && paragraphs[0] === "Authorize one materially corrected-source qualification assignment on " + p.branch + " in Draft PR #" + p.pull_request + ". Adopt the reusable material-source-correction-v1 transition within the existing inventory-bound v7 owners for the observed in-scope product defect." &&
    paragraphs[1] === "Predecessor: " + p.prior_family_id + " / " + p.prior_attempt_id + " / " + p.prior_receipt_fingerprint + "." &&
    paragraphs[2] === MATERIAL_HISTORY_BOUNDARY &&
    paragraphs[3] === "After separate independent acceptance of the actual correction, policy controls, exact published source and real preparation commitment, authorize the operator to record that decision faithfully and publish a separate new prospective commission through the authenticated maintainer identity. Each commission permits exactly one deciding invocation total; reservation or interruption consumes it. No ordinal two, recovery or unchanged-target retry under that commission. A further in-scope material correction requires fresh evidence, independent acceptance and new authenticated authority. Complete planner-selected qualification, separate fresh-process stock, owned cleanup and independent result audit remain required.";
}

// This authority describes reduced redundant fixture work, not a proved
// production defect or a recovered explanation of the historical timeout.
export const SELECTIVE_FIXTURE_WORKLOAD_GRANT = "Authorize one NEW prospective v7 reviewed_revision commission for a material source correction.";
export function readSelectiveFixtureWorkloadDelegation(body,p) {
  const paragraphs = visibleDelegationParagraphs(body);
  return equal(paragraphs,[
    "Authorize one selective fixture workload qualification assignment on " + p.branch + " in Draft PR #" + p.pull_request + ". Adopt selective-fixture-workload-v1 within the existing material-source-correction-v1 inventory-bound v7 owners. Reduced redundant fixture work with preserved behavior is demonstrated; stable speedup and the historical timeout cause remain unestablished.",
    "Predecessor: " + p.prior_family_id + " / " + p.prior_attempt_id + " / " + p.prior_receipt_fingerprint + ".",
    MATERIAL_HISTORY_BOUNDARY,
    "After separate independent acceptance of the implemented admission, fixture evidence, actual final published source and supported preparation inputs, authorize the operator to record that decision faithfully and publish a separate authenticated exact-target grant through the maintainer identity. Exactly one new complete planner-selected reference-Mac qualification invocation is permitted; reservation or interruption consumes it. No ordinal two, recovery or unchanged-target retry under this commission. Preserve all earlier consumption, original false stock and physical authority. Separate fresh-process stock, owned cleanup and independent result review remain required.",
  ]) ? { kind: SELECTIVE_FIXTURE_WORKLOAD } : null;
}

export const INTEGRATION_BUDGET_GRANT = "Authorize one NEW prospective v7 reviewed_revision commission for the measured registered integration allowance.";
export const INTEGRATION_BUDGET_LIMIT = "Old commission remains spent. Exactly one admitted deciding invocation total. Reservation/interruption consumes it. No ordinal two, recovery or unchanged-target retry under this commission. Separate fresh-process stock and independent result audit are required.";

// This distinct visible delegation format recognizes the measured-workload
// decision, without borrowing the four-paragraph product-defect decision.
// Exact operative paragraphs and single labeled bindings avoid accepting
// quotations, templates, qualifications or a different commission's record.
export function readIntegrationBudgetDelegation(body,p) {
  const paragraphs = visibleDelegationParagraphs(body);
  if (paragraphs.length !== 20 ||
      !/^## R[1-9]\d* cohesive external-response completion delegation$/u.test(paragraphs[0]) ||
      paragraphs[2] !== "### Accepted starting point" ||
      paragraphs[5] !== "### Development objective and authorized correction" ||
      paragraphs[9] !== "### Narrow common-owner and policy support" ||
      paragraphs[12] !== "### Conditional public recording and one prospective deciding execution" ||
      paragraphs[16] !== "### Historical and final acceptance boundaries") return null;
  const scope = paragraphs[1].match(/^Authorize one cohesive correction and qualification assignment for issue #([1-9]\d*) on `([^`\n]+)` in Draft PR #([1-9]\d*)\. Continue with the existing implementation owner, worktree and PR\. This is the user's newly approved development and conditional recording scope after the completed r([1-9]\d*) receiving audit; the completed development-only delegation remains an immutable historical record\.$/u);
  if (scope?.[2] !== p.branch || scope[3] !== String(p.pull_request)) return null;
  if (paragraphs[4] !== "Authenticate the current task records, published source and ownership before changing anything. Reconcile concurrent main changes according to their actual conflicts and risks; a main movement alone is not a reason to create a duplicate assignment or stop routine work." ||
      paragraphs[6].replace(/R[1-9]\d*'s natural development passes of \d+\.\d{3} seconds and \d+\.\d{3} seconds under the existing \d+-second child bound/gu,"The preceding development passes").replace(/r[1-9]\d* failure/gu,"historical failure") !== "Resolve the remaining external-response qualification blocker. Determine whether recovery is doing bounded, progressing canonical database validation over the accumulated fixture or is affected by an abnormal wait, lock or lifecycle stall. The preceding development passes establish limited observed headroom, not the cause of the historical failure or a demonstrated cure." ||
      paragraphs[7] !== "Choose the implementation and measurements from the source. Profile the actual recovery operations and relevant fixture workload with bounded, sanitized diagnostics. Capture enough of the registered execution, including startup and cleanup, to support the decision; retain the actual source, inputs, runtime, dependency observations and every result. Use focused development checks while investigating rather than repeated Full runs." ||
      paragraphs[11] !== "The current material-source delegation reader requires an observed product defect in an exact four-paragraph format. This truthful delegation does not claim that unproved defect and must not be silently treated as already accepted by that reader. Any required semantic support for this approved scope must be an explicit, independently reviewed source and policy change. Preserve authenticated authorship and permission checks, immutable task and grant records, exact candidate/preparation/input binding, historical lineage, single-use accounting, the existing freshness limit and the final ownership/concurrency checks. Do not add PR-, comment-, hash- or path-specific admission bypasses, reinterpret an old record as new authority, or let a permissive reader create authority by itself." ||
      paragraphs[19].replace(/\(https:\/\/chatgpt\.com\/space\/page_[a-z0-9]+\)/gu,"(Augnes Space)") !== "Complete one consolidated handoff covering the exact final source and diff, measured decision and limitations, focused checks and independent source/preparation review, authenticated delegation/review/grant records, actual qualification and stock results, physical accounting, independent result audit, preservation and owned cleanup. Update the same PR and existing [current-work Page](Augnes Space) and [handoff Page](Augnes Space), verify the saved source artifacts, and state the remaining receiving decision. Do not create a duplicate branch, PR, workstream or ceremonial approval cycle.") return null;
  const starting = paragraphs[3].split("\n");
  const worktree = starting[1]?.match(/^- Worktree: `(\/[A-Za-z0-9_./-]+)`\.$/u)?.[1];
  const head = starting[2]?.match(/^- Accepted head: `([a-f0-9]{40})`\.$/u)?.[1];
  const tree = starting[3]?.match(/^- Tree: `([a-f0-9]{40})`\.$/u)?.[1];
  const base = starting[4]?.match(/^- Integrated base and main observed at delegation intake: `([a-f0-9]{40})`\.$/u)?.[1];
  const receiving = starting[5]?.match(/^- \[R([1-9]\d*) receiving decision\]\(https:\/\/github\.com\/hynk-studio\/augnes\/pull\/([1-9]\d*)#pullrequestreview-([1-9]\d*)\): SOURCE \/ DEVELOPMENT EVIDENCE ACCEPT \/ RETAIN; QUALIFICATION HOLD \/ DO NOT MERGE\.$/u);
  if (starting.length !== 6 ||
      starting[0] !== "- Repository: `hynk-studio/augnes`; origin: `https://github.com/hynk-studio/augnes.git`." ||
      !worktree || worktree.slice(1).split("/").some(part => !part || part === "." || part === "..") ||
      !head || !tree || !base || receiving?.[1] !== scope[4] || receiving[2] !== String(p.pull_request) ||
      !Number.isSafeInteger(Number(receiving[3]))) return null;
  if (paragraphs[8].replace(/assert the r[1-9]\d* cause/u,"assert the historical cause") !== "Apply the smallest justified in-scope product or fixture correction if a defect is demonstrated. If the evidence instead supports a finite prospective allowance for the legitimate registered external-response workload, a measured adjustment of that specific budget and any necessary enclosing bound is authorized. Justify the bound and lifecycle reserve from the evidence, preserving assertions, canonical recovery validation, timeout settlement, cleanup and unrelated groups. Do not remove safety checks to gain time or inflate timeouts globally. A naturally passing original source must remain a PASS; do not manufacture a RED or retroactively assert the historical cause to fit a witness format." ||
      paragraphs[10] !== "Where necessary, reconcile the existing common verification, evidence and admission owners and their documented policy with the actual accepted correction or measured-workload case. The existing typed prospective fixture-budget approach is a precedent, not evidence that its current serial-authority scope already admits external-response integration. A narrow reusable extension for this measured registered workload, including corresponding rejection controls, is within this task." ||
      paragraphs[13] !== "After a separate read-only reviewer accepts the actual final published source, evidence, policy and controls, and the real exact-target preparation commitment and complete input inventory, the implementation operator is explicitly authorized under this task delegation to record that independent decision faithfully and publish a separate new prospective commission/execution grant through the existing authenticated maintainer identity. Identify the actual reviewer and distinguish that reviewer from the operator recording the decision. Resolve material findings before acceptance. Authenticate and read back the actual records before reservation." ||
      paragraphs[14] !== "This authorizes one new prospective commission after those conditions are met; it is not an execution grant for the starting head or any as-yet nonexistent target. The separate grant must bind the accepted repository, branch, base, head, tree, preparation commitment, input/runtime identity and predecessor lineage according to the applicable reviewed common-owner contract. Each commission permits exactly one deciding invocation total; reservation or interruption consumes it. No ordinal two, recovery or unchanged-target retry under that commission. This delegation does not authorize additional deciding commissions merely because a run fails." ||
      paragraphs[15] !== "Execute the actual planner-selected qualification, including its selected Full and Browser phases, then separate fresh-process stock and an independent read-only result audit. Retain refusal, failure, cancellation and NOT_RUN results faithfully. If the deciding execution is unsuccessful, keep HOLD and finish the evidence, owned cleanup and handoff without blind retry. Ordinary in-scope development, validation, review fixes, publishing and these conditional recording steps do not need another intermediate user permission roundtrip." ||
      paragraphs[18] !== "Reuse unaffected accepted evidence with exact attribution. Preserve the accepted #" + scope[1] + " behavior, GREEN-helper behavior, installed Companion, other owners' resources and existing Git settings. Keep this PR Draft with auto-merge off. This task grants no merge, Ready-for-review, deployment or final product-adoption authority; receiving and merge judgment remain with ChatGPT/the user.")
    return null;
  const history = paragraphs[17].match(/^Preserve r\d+(?:\/r\d+)* failures and refusals, false stock, all UNKNOWN intervals, r\d+(?:\/r\d+)* development evidence and their original attribution\. In particular, preserve r\d+ receipt fingerprint `([a-f0-9]{64})`, predecessor physical family `([a-f0-9]{64})`, and the original exhausted commission `([a-f0-9]{64})`: ordinary 1 \+ reviewed ([12]) \/ recovery 0, original reviewed maximum \4, remaining 0\. A new prospective commission must retain that spent history and its explicit lineage; it must not reset or relabel it\. No later diagnosis resolves the historical r\d+ UNKNOWN by implication\.$/u);
  if (history?.[1] !== p.prior_receipt_fingerprint || history[2] !== p.prior_family_id) return null;
  return { worktree, base, head, tree, reviewId:Number(receiving[3]), previousCommission:history[3], spent:Number(history[4]) };
}


// The verifier-lifecycle route accepts the operative Browser/stock correction
// delegation only. IDs and source identities are read from that authenticated
// record and checked again against physical history and the receiving review.
const generatedStockSections = [
  [2, "### Received baseline and task ownership"],
  [5, "### One correction objective with two evidence obligations"],
  [11, "### Bounded common-owner and admission support"],
  [12, "Necessary narrow, reusable corrections to the existing evidence, attempt, stock, admission owners and their policy are included in this approved scope. Review the actual predecessor and supported material-correction route rather than forcing this task into an old grammar. The existing product-defect delegation grammar and R{previous}'s measured-integration-budget grammar do not already authorize or truthfully describe this combined task."],
  [15, "### Conditional recording and prospective execution"],
  [16, "After a genuinely separate read-only reviewer accepts the actual final published source, relevant evidence and policy, refusal controls, real exact-target preparation commitment and complete input inventory, the implementation operator is authorized to record that independent decision faithfully and publish a separate new exact-target commission/execution grant through the existing authenticated maintainer identity. Identify the actual reviewer separately from the operator recording the decision. Resolve material findings first, then authenticate the actual author/permission, bodies and timestamps and read back the records before reservation."],
  [17, "This task delegation is not an execution grant for the received head or a future unspecified candidate. A supported substantive correction and accepted final preparation must exist first. The new grant must bind repository, branch, base, head, tree, preparation, input/runtime identities and the actual predecessor lineage under the independently reviewed common-owner contract. The applicable material-source commission permits one deciding invocation total: reservation or interruption consumes it, with no ordinal two, recovery or unchanged-candidate retry. This task authorizes that new prospective commission after the conditions above; it does not authorize replacement commissions merely because a run fails."],
  [18, "Run the unchanged planner for the exact final candidate and execute its applicable actual Mac qualification, including the selected Full and Browser phases. Then run stock in a separate fresh process, obtain an independent read-only result audit, finish owned cleanup and return the result. Preserve refusals, failures, cancellations and NOT_RUN phases. An unsuccessful deciding run remains HOLD and proceeds to truthful closeout without a blind retry. These authorized review, publication and conditional recording steps do not require a new permission roundtrip merely because a prerequisite has been completed."],
  [19, "### Immutable accounting and completion boundary"],
  [23, "Keep PR #{pull} Draft with auto-merge off and QUALIFICATION HOLD / DO NOT MERGE pending independent receiving judgment. This assignment grants no merge, Ready transition, deployment, installed adoption or final product-adoption authority."],
];
export function readGeneratedStockDelegation(body, p) {
  const sections = visibleDelegationParagraphs(body);
  const revision = Number(sections[0]?.match(/^## R([1-9]\d*) cohesive Browser and stock lifecycle correction delegation$/u)?.[1]);
  const precedingRevision = revision - 1;
  if (sections.length !== 24 || !Number.isSafeInteger(revision) || precedingRevision < 1 ||
      generatedStockSections.some(([index, expected]) =>
        sections[index] !== expected.replace("{previous}", String(precedingRevision)).replace("{pull}", String(p.pull_request)))) return null;
  const assignment = sections[1].match(/^The user has approved one complete follow-up assignment for issue #([1-9]\d*) on `([^`\n]+)` and Draft PR #([1-9]\d*)\. Continue with the existing implementation owner, worktree and PR through diagnosis, justified corrections, focused verification, independent source and preparation review, conditional public authority recording, actual qualification, separate stock, independent result audit, owned cleanup and one consolidated handoff\. Routine work within this scope does not require another intermediate user approval\.$/u);
  if (assignment?.[2] !== p.branch || assignment[3] !== String(p.pull_request) ||
      !sections[6].startsWith("**Web Planning touch failure.** Determine which real touch command was sent,") ||
      !sections[8].startsWith(`**R${precedingRevision}-F1 generated-input lifecycle.** Correct the distinction between frozen focused evidence, current admission inputs and generated output after deciding execution.`))
    return null;

  const lines = sections[3].split("\n");
  const worktree = lines[1]?.match(/^- Worktree: `(\/[A-Za-z0-9_./-]+)`\.$/u)?.[1];
  const source = lines[2]?.match(/^- Received head: `([a-f0-9]{40})`; tree: `([a-f0-9]{40})`\.$/u);
  const base = lines[3]?.match(/^- Base and authenticated main at intake: `([a-f0-9]{40})`\.$/u)?.[1];
  const review = lines[4]?.match(/^- \[Receiving review ([1-9]\d*)\]\(https:\/\/github\.com\/hynk-studio\/augnes\/pull\/([1-9]\d*)#pullrequestreview-\1\): measured allowance and failed-result evidence ACCEPT \/ RETAIN; SOURCE REVISE for R([1-9]\d*)-F1; QUALIFICATION HOLD \/ DO NOT MERGE\.$/u);
  if (lines.length !== 6 ||
      lines[0] !== "- Repository: `hynk-studio/augnes`; origin: `https://github.com/hynk-studio/augnes.git`." ||
      !worktree || worktree.slice(1).split("/").some(part => !part || part === "." || part === "..") ||
      !source || !base || review?.[2] !== String(p.pull_request) || Number(review[3]) !== precedingRevision || !Number.isSafeInteger(Number(review[1]))) return null;
  const history = sections[20].match(/^Preserve the original commission `([a-f0-9]{64})`: ordinary 1 \+ reviewed 2 \/ recovery 0, original reviewed maximum 2 spent\. Preserve R([1-9]\d*) commission `([a-f0-9]{64})` at 1\/1 consumed, remaining 0, and its physical family `([a-f0-9]{64})`\. Any authorized successor must retain that lineage without resetting, relabeling or reusing spent grants\.$/u);
  const failed = sections[21].match(/^R([1-9]\d*) receipt `([a-f0-9]{64})` remains (\d+) PASS \/ (\d+) FAIL \/ (\d+) NOT_RUN, fresh stock false \/ (\d+) issues\./u);
  if (history?.[2] !== review[3] || history[4] !== p.prior_family_id ||
      failed?.[1] !== history[2] || failed[2] !== p.prior_receipt_fingerprint) return null;
  return { worktree, base, head: source[1], tree: source[2], reviewId: Number(review[1]), precedingRevision,
    originalCommission: history[1], previousCommission: history[3], counts: failed.slice(3).map(Number) };
}

function typedMaterialAuthorityBindings(p, kind, claim) {
  return [
    "Repository: hynk-studio/augnes", "Proof schema: " + p.schema, "Branch: " + p.branch,
    "Base: " + p.base, "Head: " + p.head, "Tree: " + p.tree,
    "Preparation commitment: " + gitReviewTarget(p),
    "Current inventory: " + p.inputs.inventory_sha256, "Runtime inputs: " + p.inputs.identity_sha256,
    "Predecessor family: " + p.prior_family_id, "Predecessor attempt: " + p.prior_attempt_id,
    "Predecessor receipt: " + p.prior_receipt_fingerprint, "Original root receipt: " + p.commission.root_receipt_fingerprint,
    "Task delegation: https://github.com/hynk-studio/augnes/pull/" + p.pull_request + "#issuecomment-" + p.commission.delegation.id,
    "Evidence kind: " + kind, claim,
  ].join("\n");
}

export const integrationBudgetAuthorityBindings = p => typedMaterialAuthorityBindings(p, REGISTERED_INTEGRATION_BUDGET, INTEGRATION_BUDGET_CLAIM);
export const selectiveFixtureWorkloadAuthorityBindings = p => typedMaterialAuthorityBindings(p, SELECTIVE_FIXTURE_WORKLOAD, SELECTIVE_FIXTURE_WORKLOAD_CLAIM);
export const generatedStockAuthorityBindings = p => typedMaterialAuthorityBindings(p, GENERATED_STOCK_REPAIR, GENERATED_STOCK_CLAIM);

function typedMaterialAuthorityScope(p, review, grant, bindings, opening) {
  const accepted = visibleDelegationParagraphs(review.body);
  const commission = visibleDelegationParagraphs(grant.body);
  return accepted[0] === "Source review decision: ACCEPT / RETAIN for prospective qualification." &&
    accepted[1] === bindings && accepted[2] === MATERIAL_HISTORY_BOUNDARY &&
    equal(commission,[
      opening, bindings,
      "Accepted review: https://github.com/hynk-studio/augnes/pull/" + p.pull_request + "#pullrequestreview-" + p.accepted.review.id,
      MATERIAL_HISTORY_BOUNDARY, INTEGRATION_BUDGET_LIMIT,
    ]);
}

export const integrationBudgetAuthorityScope = (p, review, grant) =>
  typedMaterialAuthorityScope(p, review, grant, integrationBudgetAuthorityBindings(p), INTEGRATION_BUDGET_GRANT);
export const selectiveFixtureWorkloadAuthorityScope = (p, review, grant) =>
  typedMaterialAuthorityScope(p, review, grant, selectiveFixtureWorkloadAuthorityBindings(p), SELECTIVE_FIXTURE_WORKLOAD_GRANT);
export const generatedStockAuthorityScope = (p, review, grant) =>
  typedMaterialAuthorityScope(p, review, grant, generatedStockAuthorityBindings(p), GENERATED_STOCK_GRANT);

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

// Separate visible authorization for a preparation/consumer boundary correction.
// The operative delegation and single-use paragraphs are literal; source and
// historical bindings are parsed once and independently authenticated below.
export function readPreparedEligibilityDelegation(body, p) {
  const sections = visibleDelegationParagraphs(body);
  if (sections.length !== 27 || !/^## R[1-9]\d* — one cohesive B1 and dependency-lifecycle correction-through-qualification assignment$/u.test(sections[0]) ||
      sections[18] !== "### Delegated recording after independent review" ||
      sections[19] !== "After a separate read-only reviewer accepts the actual final published source, the implementation operator is explicitly authorized to publish the required separate exact-candidate execution record through the existing authenticated maintainer identity under this delegation." || sections[20] !== "The actual acceptance must include the complete final delta, B1 evidence and limitations, dependency-transition correction, policy/refusal controls, real non-reserving preparation commitment and complete current inventory. Identify the independent reviewer separately from the submitting operator. Faithfully record that decision on the exact published candidate, then publish a **distinct, subsequent, immutable exact-target execution grant** linked to this delegation, the actual acceptance and the latest physical predecessor. Authenticate and read back the complete records, current maintainer permission, chronology and normalized authority digests before reservation. A local review report, this task comment, or an old review/grant alone does not supply those later records." || sections[21] !== "The user authorizes **one new prospective commission with one deciding invocation**, conditional on that independent acceptance and separate grant. Preserve the spent history rather than resetting it. Reservation, including interruption, consumes the new allowance. No ordinal two, recovery allowance, unchanged-target retry or replacement commission merely because an execution fails is authorized. Before reservation, demonstrated issues within this task may be corrected and reviewed with updated exact-target records in the same assignment; do not loop unchanged commands or reuse a stale target's authority." || sections[23] !== "After the real conditions are met, use the unchanged planner selection for the final exact candidate and complete its actual reference-Mac qualification, including selected Full/Browser phases, followed by a separate fresh-process stock of the actual receipt and independent result audit. Preserve real FAIL, cancellation, refusal and NOT_RUN results and the executor's stop behavior. A consumed failure ends deciding execution under this delegation; complete cleanup and handoff while retaining HOLD.") return null;
  const assignment = sections[1].match(/^Authorize one cohesive correction and qualification assignment for issue #([1-9]\d*) on ([\w/-]+) and Draft PR #([1-9]\d*)\.$/u);
  if (assignment?.[2] !== p.branch || assignment?.[3] !== String(p.pull_request)) return null;
  const review = sections[2].match(/\[R([1-9]\d*) receiving review ([1-9]\d*)\]\(https:\/\/github\.com\/hynk-studio\/augnes\/pull\/([1-9]\d*)#pullrequestreview-\2\)/u);
  const lines = sections[4].split("\n");
  const workspace = lines[1]?.match(/^- Branch \/ worktree: `([^`]+)` \/ `(\/[A-Za-z0-9_./-]+)`\.$/u);
  const source = lines[2]?.match(/^- Received head: `([a-f0-9]{40})`; tree: `([a-f0-9]{40})`\.$/u);
  const base = lines[3]?.match(/^- R[1-9]\d* execution base: `([a-f0-9]{40})`; currently observed main: `([a-f0-9]{40})`\.$/u);
  const receipt = lines[4]?.match(/^- R[1-9]\d* receipt: `([a-f0-9]{64})`; preparation: `([a-f0-9]{64})`\.$/u);
  const tip = lines[5]?.match(/^- Latest settled family: `([a-f0-9]{64})`; attempt: `([^`]+)`\.$/u);
  const counts = sections[5].match(/^R[1-9]\d* remains \*\*(\d+) PASS \/ (\d+) FAIL \/ (\d+) NOT_RUN; fresh-process stock false \/ (\d+) issues\*\*\./u);
  if (lines.length !== 6 || lines[0] !== "- Repository / origin: `hynk-studio/augnes` / `https://github.com/hynk-studio/augnes.git`." ||
      !review || review[3] !== String(p.pull_request) || workspace?.[1] !== p.branch || !source || !base || !receipt || !tip || !counts ||
      workspace[2].slice(1).split("/").some(part => !part || part === "." || part === "..") ||
      receipt[1] !== p.prior_receipt_fingerprint || tip[1] !== p.prior_family_id || tip[2] !== p.prior_attempt_id ||
      sections[11] !== "Establish the eligibility of the actual registered root/Web dependency preparation outputs against the accepted focused prerequisite **before expensive consumer phases**. Either use the same supported clean-preparation and launch conditions and require matching effective identities, or demonstrate and narrowly bind a legitimate nonidentical transition with concrete owner, source, content and security provenance. Successful npm ci, matching lockfiles or later stability alone does not justify unexplained differences." ||
      sections[12] !== "Retain focused evidence integrity and actual Full prepared-before/after/current checks. Unjustified source, lockfile, loader, runtime, dependency content/layout, ownership or permission changes must remain refusals. Preserve the narrow generated-Next declaration writer-window rules, unsafe-file and substitution refusals. The source correction must not simply remove the focused guard, broadly ignore permissions/generated state or rewrite dependencies to match an expected digest." ||
      sections[13] !== "Use scoped evidence-file creation permissions rather than inadvertently imposing evidence-only umask settings on workload processes. Alternatively, explicitly support, record and validate the chosen process setting consistently throughout preparation, focused execution, Full and stock. Do not assert that umask 077 caused the historical content differences or B1 failure; that causality and the original swallowed stock exception remain UNKNOWN." ||
      sections[14] !== "Include a positive regression through the real owner ordering: accepted focused inputs, registered dependency preparation, early eligibility boundary, relevant subsequent generated output, and fresh-process stock inspection. Negative controls must prove that unjustified root/Web differences stop execution before expensive phase entry, not merely produce a later false stock. Mutations after the boundary must still be refused. Development controls must not reserve a real deciding allowance.") return null;
  return { worktree: workspace[2], head: source[1], tree: source[2], base: base[1], observedMain: base[2],
    reviewId: Number(review[2]), precedingRevision: Number(review[1]), preparation: receipt[2], counts: counts.slice(1).map(Number) };
}
export const preparedEligibilityAuthorityBindings = p => typedMaterialAuthorityBindings(p, PREPARED_ELIGIBILITY_REPAIR, PREPARED_ELIGIBILITY_CLAIM);
export const preparedEligibilityAuthorityScope = (p, review, grant) =>
  typedMaterialAuthorityScope(p, review, grant, preparedEligibilityAuthorityBindings(p), PREPARED_ELIGIBILITY_GRANT);

// Visible verifier-lifecycle delegation, distinct from the product-defect and
// Browser-repair formats. Literal backslash-n separators in the labeled source
// block are presentation only; the normalized authority digest retains raw bytes.
export function readVerifierLifecycleDelegation(body, p) {
  const sections = visibleDelegationParagraphs(body), normalize = value => value?.replace(/R[1-9]\d*/gu, "the preceding revision");
  if (sections.length !== 22 || !/^## R[1-9]\d* task delegation — complete the verifier corrections and qualification$/u.test(sections[0])) return null;
  const fixed = {
  "2": "The user approved proceeding with the next work and enabling the existing Codex operator to finish it. This assignment covers diagnosis, implementation, connected focused validation, independent final source/preparation review, conditional authority recording, one prospective deciding invocation, separate fresh-process stock, independent result audit, cleanup and one consolidated return. Do not return at measurement, patch, review or preparation merely as a routine approval checkpoint. Resolve ordinary in-scope findings without another user roundtrip.",
  "3": "### Starting point and retained history",
  "6": "### Operator autonomy and scope",
  "7": "Read current Space, AGENTS.md, active verification policy and relevant source owners. Verify actual identity, publication, worktree and resource ownership. Continue the same task; coordinate with an already active owner rather than creating duplicate work. Inspect current main and overlapping work only where they affect these changes. Necessary integration of adopted changes and resolution of real conflicts are authorized; unrelated main movement is not an automatic stop or reason to rerun everything.",
  "8": "Choose files, functions, measurements and tests from current evidence. Prefer the smallest reusable correction in existing owners. Challenge a contradicted hypothesis and reuse unaffected evidence honestly. Narrow shared reader/policy support needed to represent the actual correction and legitimate new authority is included, subject to independent review and refusal controls. Do not force incompatible evidence, invent a product defect or causal RED, add incident/commit-specific exceptions, or rebuild the verification framework. Preserve accepted product and GREEN-helper behavior, pinned package/runtime inputs, installed Companion, Git settings and foreign work.",
  "9": "### Complete both verifier obligations",
  "11": "**the preceding revision-F1:** correctly model registered generation of `next-env.d.ts` by typecheck/typegen as well as build and dev startup. Bind permitted complete content forms to the actual registered producer, execution/settlement evidence and supported writer interval. Preserve file safety, ownership, source/loader/dependency integrity and authentic receipt binding. Do not simply ignore generated files, accept an arbitrary phase label or rewrite file bytes to satisfy a hash. Cover the real development-declaration → registered typecheck/typegen → build → fresh-process inspection path, and the relevant path that fails after typegen/typecheck before build. Retain explicit refusals for unexecuted or unsupported writers, out-of-window changes, unsafe/substituted files and tampered evidence. Historical file writer and original first stock exception remain UNKNOWN unless new evidence specifically establishes them; a later reproduction has its own attribution.",
  "12": "Before any deciding reservation, demonstrate both connected paths through production owners with bounded disposable controls, not just copied predicates or isolated helper PASS. Keep the preceding revision's early dependency-eligibility gate and later prepared-input checks. Keep evidence-file privacy scoped to its files; record and consistently apply supported workload launch settings. Run meaningful affected regression/type/static checks. Development fixtures must not consume a real deciding allowance.",
  "13": "### Delegated recording after independent review",
  "14": "After a separate read-only reviewer accepts the actual final published source, the implementation operator is explicitly authorized to publish the required separate exact-candidate execution record through the existing authenticated maintainer identity under this delegation.",
  "15": "For this assignment that condition requires the final complete delta, both demonstrated verifier corrections or justified prospective allowance, connected positive/refusal evidence, applicable policy semantics, actual non-reserving preparation commitment and complete current inventory. Faithfully record the independent decision and identify reviewer and submitting operator separately. Then publish a DISTINCT subsequent exact-target execution grant, bound to this delegation, the new acceptance, actual latest predecessor and final source/preparation/inputs/runtime. Authenticate and read back complete records, current permission, chronology and canonical observation digests before reservation. An old review/grant or this task comment alone is not executable authority. Do not claim an existing parser already supports a new case; any necessary narrow semantic support must be implemented, tested and independently accepted first.",
  "16": "The new prospective commission permits **one deciding invocation total**. Reservation/interruption consumes it. No ordinal two, recovery, unchanged-target retry, reset of earlier accounting or replacement commission merely because a deciding run fails. Pre-reservation packet mistakes and demonstrated in-scope defects can be corrected with updated exact-target records within this assignment; preserve refusals and do not blindly resubmit.",
  "17": "### Finish and return",
  "18": "Once ready and authorized, execute the actual final-head planner-selected reference-Mac qualification, its separate fresh-process stock, independent result audit and owned cleanup. Preserve real FAIL, cancellation and NOT_RUN outcomes; do not force remaining stopped phases or stitch earlier passes into a new qualification. After consumption, finish permitted analysis, preservation and handoff without another deciding run.",
  "19": "Return one the preceding revision package on this same PR and existing Pages: exact final source and rationale, complete targeted delta, measurements and limitations, connected focused checks, actual independent reviews and authority records, qualification/stock, physical accounting and cleanup. Save accessible original evidence and verify delivered source bytes/hashes without repeatedly repackaging unchanged history. Keep runtime-registration limitations factual. A material unresolved safety, authority, access or evidence boundary warrants one concrete blocked return after useful independent work, not indefinite experimentation.",
  "20": "Keep Draft, auto-merge off and QUALIFICATION HOLD / DO NOT MERGE until receiving judgment. This assignment does not authorize Ready, merge, deployment, installed adoption, unrelated credentials/configuration changes or live provider spending."
};
  if (Object.entries(fixed).some(([index, expected]) => normalize(sections[index]) !== expected)) return null;
  const assignment = sections[1].match(/^Authorize one cohesive correction and qualification assignment for issue #([1-9]\d*) on ([\w/-]+) and Draft PR #([1-9]\d*)\.$/u);
  if (assignment?.[2] !== p.branch || assignment?.[3] !== String(p.pull_request)) return null;
  const lines = sections[4].split(/\\n|\n/u);
  const worktree = lines[2]?.match(/^Existing task worktree: `(\/[A-Za-z0-9_./-]+)`\.$/u)?.[1];
  const head = lines[3]?.match(/^Received head: `([a-f0-9]{40})`\.$/u)?.[1];
  const tree = lines[4]?.match(/^Received tree: `([a-f0-9]{40})`\.$/u)?.[1];
  const base = lines[5]?.match(/^Received base\/current observed main: `([a-f0-9]{40})`\.$/u)?.[1];
  const review = lines[6]?.match(/^Receiving decision: https:\/\/github\.com\/hynk-studio\/augnes\/pull\/([1-9]\d*)#pullrequestreview-([1-9]\d*)$/u);
  const report = lines[7]?.match(/^R([1-9]\d*) return: https:\/\/github\.com\/hynk-studio\/augnes\/pull\/([1-9]\d*)#issuecomment-([1-9]\d*)$/u);
  if (lines.length !== 8 || lines[0] !== "Repository/origin: `hynk-studio/augnes` / `https://github.com/hynk-studio/augnes.git`." ||
      lines[1] !== "Existing branch: `" + p.branch + "`." || !worktree || worktree.slice(1).split("/").some(part => !part || part === "." || part === "..") ||
      !head || !tree || !base || review?.[1] !== String(p.pull_request) || report?.[2] !== String(p.pull_request)) return null;
  const history = sections[5].match(/^The reported latest settled attempt is `([^`]+)`, family `([a-f0-9]{64})`, receipt `([a-f0-9]{64})`\. Verify the actual physical tip before using it\. Preserve R[1-9]\d* (\d+)\/(\d+)\/(\d+), all seven qualification Browser phases NOT_RUN, false stock\/(\d+) and its spent 1\/1 commission\. Original ordinary 1 \+ reviewed 2 \/ recovery 0 and R[1-9]\d*\/R[1-9]\d* consumed commissions also remain spent\. No historical receipt, authority, UNKNOWN or source attribution is rewritten\.$/u);
  if (!history || history[1] !== p.prior_attempt_id || history[2] !== p.prior_family_id || history[3] !== p.prior_receipt_fingerprint) return null;
  const measured = sections[10].replace(/its \d+-second bound/u, "its registered bound").replace(/passed in \d+\.\d{3} seconds/u, "passed in the recorded interval").replace(/R[1-9]\d*'s/u, "the predecessor's");
  if (measured !== "**Authority fixture:** investigate the complete timed lifetime of `reviewed revision controls: browser`, not actual Chrome/B1. The inner synthetic fixture reached its registered bound; the last visible nested receipt reader passed in the recorded interval. Use bounded sanitized stage/timing observations across imports, setup, Git/material replay, nested child, subsequent assertions/export and cleanup. Exercise the complete registered wrapper and relevant parent conditions under the intended runtime and launch settings. Correct demonstrated unnecessary work, waits or lifecycle defects without weakening assertions or isolation. If measurements instead establish progressing necessary workload with an inadequate allowance, a finite prospective adjustment specific to this registration and its required enclosing bound is authorized after independent evidence review. Justify the amount and cleanup reserve; do not inflate unrelated timeouts or claim that a new passing run explains the predecessor's historical interruption. No blind unchanged-run loops.") return null;
  const links = sections[21].split(/\\n|\n/u);
  if (links.length !== 3 || !["Current work: ", "Development operating criteria: ", "Retained handoff and originals: "].every((label, index) =>
      new RegExp("^" + label + "https://chatgpt\\.com/space/page_[a-z0-9]+$", "u").test(links[index]))) return null;
  return { worktree, head, tree, base, reviewId: Number(review[2]), reportId: Number(report[3]), counts: history.slice(4).map(Number) };
}
export const verifierLifecycleAuthorityBindings = p => typedMaterialAuthorityBindings(p, VERIFIER_LIFECYCLE_REPAIR, VERIFIER_LIFECYCLE_CLAIM);
export const verifierLifecycleAuthorityScope = (p, review, grant) =>
  typedMaterialAuthorityScope(p, review, grant, verifierLifecycleAuthorityBindings(p), VERIFIER_LIFECYCLE_GRANT);
