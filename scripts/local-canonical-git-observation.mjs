import { digest, classifyInputChange, effectiveInputObservation, inputEventIdentity, nonFaultInputChange, INPUT_CONTRACT } from "./local-canonical-inputs.mjs";
import { settledIsolatedResources, cancelledPhase, verifySettledPhaseFailure } from "./local-canonical-browser-revision.mjs";
import { CANONICAL_NODE_VERSION } from "./local-canonical-environment.mjs";

export const isGitObservationRevision = p =>
  p?.schema === "augnes.local-canonical-source-correction.v10" && p.kind === "reviewed_revision";
export const isGitObservationSuccessor = p => isGitObservationRevision(p) && p.commission?.ordinal === 2;
// A v7 commission descending from the spent Git-observation chain keeps the
// complete input inventory throughout its physical lineage.
export const isInventoryBoundRevision = p => p?.schema === "augnes.local-canonical-source-correction.v7" &&
  p.kind === "reviewed_revision" && Object.hasOwn(p.inputs ?? {}, "inventory_sha256");
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
  const i = r.inputs, a = r.attempt;
  if (r.receipt_version !== 4 || !a || a.number !== 1 || a.recovery !== null || a.source_correction !== null ||
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
  const [race,change] = faults;
  if (faults.length !== 2 || race.resource !== git.id || change.resource !== git.id ||
      race.disposition !== "observer_failure" || change.disposition !== "input_invalidation" || !gitObservation(change.after) ||
      git.before.sha256 === change.after.sha256 || git.before.git_projection.effective_sha256 === change.after.git_projection.effective_sha256 ||
      git.before.git_projection.scope_fingerprint !== change.after.git_projection.scope_fingerprint ||
      !equal(i.first_fault,faultOf(race)) || !equal(r.outcome.first_fault,i.first_fault) ||
      !equal(i.secondary_faults,[faultOf(change)])) fail("revision_git_observations_invalid");
  const phase = cancelledPhase(r.phases,race.observed_at);
  if (!phase || r.phases.some(p => p.status === "not_run" && (p.started_at != null || p.finished_at != null || p.browser_use?.length)))
    fail("revision_git_predecessor_invalid");
  const expected = ["receipt_classified_outcome_not_passing","receipt_current_inputs_unverified","receipt_final_result_not_pass",
    "receipt_input_observation_blocked","receipt_non_deciding", ...(r.phases.some(p=>p.status==="not_run") ? ["receipt_phase_environment_binding_invalid"] : []),
    ...r.phases.filter(p=>p.status!=="pass").map(p=>"phase_not_passing:"+p.id)].sort();
  if (stock.status !== "non_deciding_or_stale" || stock.valid_deciding_evidence !== false ||
      stock.content_fingerprint !== r.integrity.content_fingerprint || !equal([...stock.issues].sort(),expected) ||
      !equal(stock.dimensions,{historical_integrity:"intact",execution:"incomplete_or_failed",evidence_validity:"invalid_or_incomplete",safety:"blocked",current_merge_applicability:"blocked"}))
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

export function verifyGitRevisionFailure(receipt, stock, inputs, phases, expectedOrdinal = 1) {
  const previous = receipt.attempt?.source_correction;
  const { contract, path_kind, binding, resources } = receipt.inputs;
  if (!usesGitInventory(previous) || previous.commission.ordinal !== expectedOrdinal ||
      gitRevisionInventory(receipt.inputs) !== previous.inputs.inventory_sha256 ||
      digest({ contract, path_kind, binding, resources }) !== receipt.inputs.fingerprint)
    fail("revision_git_predecessor_invalid");
  verifySettledPhaseFailure(receipt, stock, inputs, phases, resources.find(r => r.id === "browser-executable"), false, expectedOrdinal);
}

// Ordinal two repairs a failing executable source. Observe the same command
// on the predecessor and final Git blobs, with the same canonical runtime.
export function verifyGitSourceRepair(p, prior, focused, { git, parse, bytes, completedAt }) {
  const regression = focused.regression;
  const file = regression?.path;
  if (!Array.isArray(focused.implicated_paths) || !focused.implicated_paths.includes(file) ||
      typeof file !== "string" || !/^scripts\/(?:[\w.-]+\/)*[\w.-]+\.mjs$/u.test(file) ||
      file.split("/").some(part => part === "." || part === "..") ||
      !equal(focused.input_remedy_resources, []) || prior.tree === p.tree) fail("revision_material_remedy_required");
  const blob = head => git(["rev-parse", "--verify", head + ":" + file]).toString().trim();
  const oldBlob = blob(prior.head), newBlob = blob(p.head);
  // Tree:path arguments also carry mode metadata. Compare the blob objects.
  if (oldBlob === newBlob ||
      !git(["diff", "--no-ext-diff", "--no-textconv", "--ignore-all-space", "--ignore-blank-lines", oldBlob, newBlob]).length)
    fail("revision_material_remedy_required");
  const before = parse(regression.before), after = parse(regression.after);
  const command = "node " + file;
  if (!focused.commands?.some(c => c.command === command && c.tested_source_head === p.head &&
      equal(c.record, regression.after) && equal(c.stdout, after.stdout)) ||
      before.stdout?.sha256 === after.stdout?.sha256 ||
      !(Date.parse(completedAt) < Date.parse(before.finished_at) && Date.parse(before.finished_at) < Date.parse(after.finished_at) &&
        Date.parse(after.finished_at) <= Date.parse(focused.finished_at))) fail("revision_git_regression_invalid");
  for (const [witness, head, exit] of [[before, prior.head, 1], [after, p.head, 0]]) {
    const r = witness.result;
    if (witness.tested_source_head !== head || witness.file_sha256 !== digest(git(["show", head + ":" + file])) ||
        witness.command !== command || witness.runtime_inputs_sha256 !== p.inputs.identity_sha256 ||
        witness.node_version !== CANONICAL_NODE_VERSION || r?.exit_code !== exit || r.timed_out !== false ||
        r.cancelled !== false || r.cleanup_completed !== true || r.remaining_owned_processes !== 0 ||
        r.termination_reason !== "natural_exit" || r.exit_observed !== true || r.streams_closed !== true || !bytes(witness.stdout).length)
      fail("revision_git_regression_invalid");
  }
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
