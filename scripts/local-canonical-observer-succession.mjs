// A source-correction v3 proof is evidence, never a grant. Only fresh bounded
// authenticated GitHub reads can create the in-process authorization capability.
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { digest, classifyInputChange } from "./local-canonical-inputs.mjs";
import { BROWSER_REPLACEMENT_PHASES } from "./local-canonical-browser-replacement.mjs";
import { createGitHubObserverAuthorizationTransport } from "./github-main-branch-transport.mjs";

export const OBSERVER_REPAIR_SCHEMA = "augnes.local-canonical-source-correction.v3";
export const OBSERVER_AUTH_SCHEMA = "augnes.local-canonical-observer-authority.v1";
export const isObserverRepair = p => p?.schema === OBSERVER_REPAIR_SCHEMA && p.kind === "observer_repair";
const fail = code => { throw Object.assign(new Error(code), { code }); };
const sha = s => /^[0-9a-f]{64}$/u.test(s ?? "");
const commit = s => /^[0-9a-f]{40}$/u.test(s ?? "");
const exact = (a, b) => digest(a) === digest(b);
const capabilities = new WeakMap();
export const OBSERVER_RETAINED_SOURCES = Object.freeze([
  "scripts/local-canonical-inputs.mjs", "scripts/fixtures/local-canonical-observer-controls.mjs", "scripts/test-codex-companion-discovery.mjs",
]);
// Existing observer, succession, validator and focused-test owners only. Compare
// against the newly admitted main so ordinary upstream movement is not mistaken
// for a task-owned product change. This does not change planner admission.
const SUCCESSION_PATHS = new Set([
  ...OBSERVER_RETAINED_SOURCES, ".github/LOCAL_CANONICAL_VERIFICATION.md", "docs/LOCAL_CANONICAL_INPUT_CONTRACT.md",
  "scripts/local-canonical-attempts.mjs", "scripts/local-canonical-observer-succession.mjs", "scripts/local-canonical-receipt.mjs",
  "scripts/local-canonical-review-export.mjs", "scripts/run-local-canonical-verification.mjs", "scripts/github-main-branch-transport.mjs",
  "scripts/test-local-canonical-executor.mjs", "scripts/test-local-canonical-review-corrections.mjs", "scripts/test-local-canonical-classification.mjs", "scripts/fixtures/local-canonical-observer-succession.mjs",
]);
const keys = (v, allowed) => v && typeof v === "object" && !Array.isArray(v) && exact(Object.keys(v).sort(), [...allowed].sort());
const validTime = t => Number.isFinite(Date.parse(t)) && Date.parse(t) <= Date.now();

export function observerArtifact(folder, ref, maximum = 64 * 1024) {
  if (!keys(ref, ["artifact", "sha256"]) || !/^[a-z0-9_-]+\.(?:json|mjs)$/u.test(ref.artifact ?? "") || !sha(ref.sha256)) fail("observer_evidence_reference_invalid");
  const file = path.join(folder, ref.artifact), s = lstatSync(file);
  if (realpathSync(file) !== file || !s.isFile() || s.isSymbolicLink() || s.nlink !== 1 || s.size > maximum) fail("observer_evidence_unsafe");
  const bytes = readFileSync(file);
  if (digest(bytes) !== ref.sha256) fail("observer_evidence_changed");
  return bytes;
}

export function validateObserverPredecessor(r) {
  const copy = { ...r }; delete copy.integrity;
  const input = r.inputs, fault = input?.first_fault, phases = r.phases;
  if (r.receipt_version !== 4 || r.integrity?.content_fingerprint !== digest(copy) ||
      r.outcome?.disposition !== "unknown_relevance" || r.outcome?.safety !== "blocked" ||
      !exact(r.outcome.first_fault, fault) || fault?.resource !== "browser-executable" || fault.disposition !== "observer_failure" || Object.hasOwn(fault, "diagnostic") ||
      input?.contract !== "augnes.local-canonical-inputs.v3" || input.path_kind !== "isolated-model-free-v1" ||
      !Array.isArray(input.events) || input.events.length < 2 || input.events.length >= 64 || input.secondary_faults?.length !== 0 ||
      !Array.isArray(input.resources) || ["codex-preferences", "user-instructions", "auth-location", "github-auth-location", "git-config", "node-executable"].some(id => !input.resources.some(r => r.id === id)) || new Set(input.resources.map(r => r.id)).size !== input.resources.length ||
      input.fingerprint !== digest({ contract: input.contract, path_kind: input.path_kind, binding: input.binding, resources: input.resources }) ||
      input.binding?.head !== r.repository?.head_sha || input.binding?.tree !== r.repository?.tree_sha ||
      r.attempt?.head !== r.repository?.head_sha || r.attempt?.tree !== r.repository?.tree_sha || r.attempt?.attempt_id !== r.run?.id ||
      r.attempt?.contract_fingerprint !== input.fingerprint || r.attempt?.browser_replacement || isObserverRepair(r.attempt?.source_correction) ||
      !r.cleanup?.completed || r.cleanup.remaining_owned_processes !== 0 || r.cleanup.companion_service?.restored !== true ||
      r.cleanup.isolated_resources?.completed !== true || r.cleanup.isolated_resources.failure_count !== 0 ||
      r.checkout_ownership?.released !== true || r.capacity_ownership?.released !== true ||
      !Array.isArray(phases) || !exact(phases.map(p => p.id), BROWSER_REPLACEMENT_PHASES)) fail("observer_predecessor_ineligible");
  let unknowns = 0, incidental = 0;
  for (const e of input.events) {
    const resource = input.resources.find(r => r.id === e.resource);
    if (!resource || e.resource !== "browser-executable" || resource.classification !== "execution" || resource.readOnlyExecutable !== true ||
        e.classification !== resource.classification || Object.hasOwn(e, "diagnostic") || e.identity !== digest([e.resource, e.disposition, e.after])) fail("observer_predecessor_event_invalid");
    if (e.disposition === "observer_failure" && e.after === null && e.observed_at === fault.observed_at && e.monotonic_ns === fault.monotonic_ns) unknowns++;
    else if (e.disposition === "incidental_executable_metadata" && e.after && classifyInputChange(resource.before, e.after, resource, input) === e.disposition) incidental++;
    else fail("observer_predecessor_unrelated_fault");
  }
  let stopped = false;
  for (const p of phases) {
    if (p.timed_out !== false || p.spawn_error_code || (p.failure_code && p.failure_code !== "phase_cancelled")) fail("observer_predecessor_unrelated_phase");
    if (p.status === "not_run" && stopped) continue;
    if (stopped || !p.cleanup?.completed || p.cleanup.remaining_owned_processes !== 0 || !p.cleanup.exit_observed || !p.cleanup.streams_closed ||
        !["natural_exit", "operator_cancelled"].includes(p.cleanup.termination_reason)) fail("observer_predecessor_unsettled_phase");
    if (p.status === "failure" && p.failure_code === "phase_cancelled") stopped = true;
    else if (p.status !== "pass" || p.exit_status !== 0 || p.failure_code) fail("observer_predecessor_unrelated_phase");
  }
  if (unknowns !== 1 || incidental < 1 || !stopped || r.final?.result !== "failure" || r.final.exit_status !== 1 ||
      !Array.isArray(r.final.reason_codes) || r.final.reason_codes.some(c => !["phase_cancelled", "selected_phases_incomplete", "verification_cancelled"].includes(c))) fail("observer_predecessor_ineligible");
  return r;
}

// Called by the existing proof reader; common before/after witness validation is
// still performed there. Source objects are read, never checked out or executed.
export function readObserverRepairEvidence(file, p, repositoryRoot) {
  const allowed = ["schema", "kind", "defect", "branch", "base", "head", "tree", "prior_family_id", "prior_number", "prior_attempt_id", "prior_receipt_fingerprint", "source_module", "fixture_artifact", "fixture_sha256", "environment_fingerprint", "before", "after", "originals", "repair", "delta_sha256", "changed_paths", "retained_sources", "authorization", "pull_request", "budget"];
  const stored = { ...p }; delete stored.local_relative_path;
  if (!keys(stored, allowed) || !isObserverRepair(p) || p.defect !== "shared_executable_observer_read_window_and_diagnostics" ||
      p.source_module !== OBSERVER_RETAINED_SOURCES[0] || ![p.base, p.head, p.tree, p.repair?.head, p.repair?.tree].every(commit) ||
      !sha(p.delta_sha256) || !sha(p.repair?.delta_sha256) || !keys(p.repair, ["head", "tree", "delta_sha256", "changed_paths", "review"]) ||
      !keys(p.repair.review, ["id", "sha256"]) || !Number.isSafeInteger(p.repair.review.id) || p.repair.review.id <= 0 || !sha(p.repair.review.sha256) ||
      !keys(p.originals, ["receipt", "attempt", "completion"]) || !exact(p.budget, { initial: 1, recovery: 0 }) ||
      !Number.isSafeInteger(p.pull_request) || p.pull_request <= 0 || !keys(p.retained_sources, OBSERVER_RETAINED_SOURCES) ||
      !Object.values(p.retained_sources).every(sha)) fail("observer_proof_invalid");
  const folder = path.dirname(file), original = validateObserverPredecessor(JSON.parse(observerArtifact(folder, p.originals.receipt, 512 * 1024)));
  const prior = JSON.parse(observerArtifact(folder, p.originals.attempt)), completion = JSON.parse(observerArtifact(folder, p.originals.completion));
  if (!exact(original.attempt, prior) || prior.family_id !== p.prior_family_id || prior.number !== p.prior_number || prior.branch !== p.branch ||
      prior.attempt_id !== p.prior_attempt_id || original.integrity.content_fingerprint !== p.prior_receipt_fingerprint ||
      completion.contract !== prior.contract || completion.attempt_id !== prior.attempt_id || completion.receipt_fingerprint !== p.prior_receipt_fingerprint ||
      completion.disposition !== "unknown_relevance" || completion.cleanup_complete !== true || !validTime(completion.finished_at) ||
      p.head === prior.head || p.tree === prior.tree || p.repair.head === prior.head || p.repair.tree === prior.tree) fail("observer_original_binding_invalid");
  const git = args => execFileSync("git", args, { cwd: repositoryRoot, timeout: 10000, maxBuffer: 16 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
  for (const [a, b] of [[prior.head, p.repair.head], [p.repair.head, p.head], [p.base, p.head]]) git(["merge-base", "--is-ancestor", a, b]);
  for (const target of [p, p.repair]) {
    if (git(["rev-parse", `${target.head}^{tree}`]).toString().trim() !== target.tree ||
        digest(git(["diff", "--binary", "--no-ext-diff", "--no-textconv", prior.head, target.head, "--"])) !== target.delta_sha256 ||
        !exact(git(["diff", "--name-only", prior.head, target.head, "--"]).toString().trim().split("\n").sort(), target.changed_paths)) fail("observer_source_binding_invalid");
  }
  const candidatePaths = git(["diff", "--name-only", p.base, p.head, "--"]).toString().trim().split("\n").filter(Boolean);
  if (!candidatePaths.length || candidatePaths.some(name => !SUCCESSION_PATHS.has(name))) fail("observer_unrelated_candidate_delta");
  for (const [name, hash] of Object.entries(p.retained_sources)) {
    if (digest(git(["show", `${p.repair.head}:${name}`])) !== hash || digest(git(["show", `${p.head}:${name}`])) !== hash) fail("observer_reviewed_repair_changed");
  }
  if (p.retained_sources[p.source_module] !== p.after?.source_sha256 || p.retained_sources[OBSERVER_RETAINED_SOURCES[1]] !== p.fixture_sha256 ||
      digest(git(["show", `${prior.head}:${p.source_module}`])) !== p.before?.source_sha256) fail("observer_regression_binding_invalid");
  const before = JSON.parse(observerArtifact(folder, { artifact: p.before.artifact, sha256: p.before.sha256 }));
  if (Date.parse(before.finished_at) <= Date.parse(completion.finished_at)) fail("observer_witness_predates_settlement");
  return { original, prior, completion };
}

export function observerAuthorityBinding(proof) {
  const p = { ...proof }; delete p.authorization; delete p.local_relative_path;
  return { schema: OBSERVER_AUTH_SCHEMA, evidence_fingerprint: digest(p), head: proof.head, tree: proof.tree, base: proof.base,
    original_disposition: "unknown_relevance", historical_cause: "UNKNOWN", budget: { initial: 1, recovery: 0 }, workload: "full-canonical", separate_stock: true };
}
export function observerAuthorityObservation(r, role) {
  return { id: r.id, author: r.user?.login, author_id: r.user?.id, body_sha256: digest(r.body), timestamp: r.updated_at ?? r.submitted_at, role };
}
export async function authorizeObserverRepair(p, { transport = createGitHubObserverAuthorizationTransport(p.pull_request) } = {}) {
  const refs = p.authorization;
  if (!isObserverRepair(p) || !keys(refs, ["review_id", "review_sha256", "grant_comment_id", "grant_sha256"]) ||
      ![refs.review_id, refs.grant_comment_id].every(id => Number.isSafeInteger(id) && id > 0) ||
      ![refs.review_sha256, refs.grant_sha256].every(sha) || refs.review_id === p.repair.review.id) fail("observer_authority_missing");
  const repair = await transport.review(p.repair.review.id), review = await transport.review(refs.review_id), grant = await transport.grant(refs.grant_comment_id);
  const records = [[repair, "accepted_repair", p.repair.review.id, p.repair.review.sha256], [review, "independent_review", refs.review_id, refs.review_sha256], [grant, "execution_grant", refs.grant_comment_id, refs.grant_sha256]], observations = {};
  for (const [r, role, id, hash] of records) {
    if (r?.id !== id || r.user?.type !== "User" || !Number.isSafeInteger(r.user?.id) || r.user.id <= 0 ||
        !/^[A-Za-z0-9-]{1,39}$/u.test(r.user?.login ?? "") || !["OWNER", "MEMBER", "COLLABORATOR"].includes(r.author_association) ||
        typeof r.body !== "string" || Buffer.byteLength(r.body) > 64 * 1024) fail("observer_authority_identity_invalid");
    if (role !== "execution_grant") {
      if (r.pull_request_url !== `https://api.github.com/repos/hynk-studio/augnes/pulls/${p.pull_request}` ||
          !["COMMENTED", "APPROVED"].includes(r.state) || r.commit_id !== (role === "accepted_repair" ? p.repair.head : p.head)) fail("observer_review_source_invalid");
    } else if (r.issue_url !== `https://api.github.com/repos/hynk-studio/augnes/issues/${p.pull_request}`) fail("observer_grant_destination_invalid");
    if (role !== "accepted_repair") {
      const matches = [...r.body.matchAll(/```augnes-observer-repair-authorization\s*\n([^]*?)\n```/gu)];
      let value; try { if (matches.length === 1) value = JSON.parse(matches[0][1]); } catch { /* fail closed */ }
      if (!exact(value ?? null, { ...observerAuthorityBinding(p), role, review_id: refs.review_id,
        decision: role === "independent_review" ? "accept_exact_observer_succession" : "authorize_one_full_zero_recovery" })) fail("observer_authority_binding_invalid");
    }
    const observation = observerAuthorityObservation(r, role);
    if (!validTime(observation.timestamp) || digest(observation) !== hash) fail("observer_authority_changed");
    const permission = await transport.permission(r.user.login);
    if (permission.user?.login !== r.user.login || !["admin", "maintain"].includes(permission.permission)) fail("observer_authority_permission_invalid");
    observations[role] = observation;
  }
  if (Date.parse(observations.independent_review.timestamp) < Date.parse(observations.accepted_repair.timestamp) ||
      Date.parse(observations.execution_grant.timestamp) < Date.parse(observations.independent_review.timestamp)) fail("observer_authority_order_invalid");
  const capability = Object.freeze({ observations }); capabilities.set(capability, { proof: digest(p), observations: digest(observations) }); return capability;
}
export function assertObserverRepairAuthorization(proof, capability, completion) {
  const state = capabilities.get(capability);
  if (!state || state.proof !== digest(proof) || state.observations !== digest(capability.observations) ||
      Date.parse(capability.observations.accepted_repair.timestamp) <= Date.parse(completion.finished_at)) fail("observer_authenticated_authority_required");
}

// Receipt/export structural inspection does not manufacture remote authority.
export function validObserverAttempt(attempt) {
  const p = attempt?.source_correction;
  return isObserverRepair(p) && attempt.number === 1 && !attempt.recovery && !attempt.browser_replacement &&
    exact(attempt.budget, { initial: 1, recovery: 0 }) && p.head === attempt.head && p.tree === attempt.tree &&
    ["accepted_repair", "independent_review", "execution_grant"].every(role => {
      const r = attempt.observer_authority?.[role];
      const ref = role === "accepted_repair" ? p.repair?.review : role === "independent_review" ?
        { id: p.authorization?.review_id, sha256: p.authorization?.review_sha256 } : { id: p.authorization?.grant_comment_id, sha256: p.authorization?.grant_sha256 };
      return keys(r, ["id", "author", "author_id", "body_sha256", "timestamp", "role"]) && r.role === role && r.id === ref?.id && digest(r) === ref?.sha256 &&
        Number.isSafeInteger(r.id) && r.id > 0 && Number.isSafeInteger(r.author_id) && r.author_id > 0 &&
        /^[A-Za-z0-9-]{1,39}$/u.test(r.author ?? "") && sha(r.body_sha256) && validTime(r.timestamp);
    });
}
