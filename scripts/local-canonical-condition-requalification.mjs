// Explicit prospective requalification after an accepted, non-reproduced condition
// failure. This is neither a repaired-cause witness nor infrastructure recovery.
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { digest, classifyInputChange, nonFaultInputChange, effectiveInputObservation, INPUT_CLASSES } from "./local-canonical-inputs.mjs";
import { BROWSER_REPLACEMENT_PHASES } from "./local-canonical-browser-replacement.mjs";
import { createGitHubObserverAuthorizationTransport } from "./github-main-branch-transport.mjs";

export const CONDITION_REQUALIFICATION_SCHEMA = "augnes.local-canonical-source-correction.v5";
export const isConditionRequalification = p => p?.schema === CONDITION_REQUALIFICATION_SCHEMA && p.kind === "condition_requalification";
const POLICY_PATHS = new Set([
  ".github/LOCAL_CANONICAL_VERIFICATION.md", "docs/LOCAL_CANONICAL_INPUT_CONTRACT.md",
  "scripts/local-canonical-condition-requalification.mjs", "scripts/local-canonical-attempts.mjs",
  "scripts/local-canonical-receipt.mjs", "scripts/local-canonical-review-export.mjs",
  "scripts/run-local-canonical-verification.mjs", "scripts/github-main-branch-transport.mjs", "scripts/test-github-main-branch-transport.mjs",
  "scripts/run-canonical-test-suite.mjs", "scripts/test-local-canonical-executor.mjs",
  "scripts/test-local-canonical-review-corrections.mjs", "scripts/test-local-canonical-classification.mjs",
  "scripts/fixtures/local-canonical-condition-requalification.mjs",
  "scripts/operator-project-home-readiness-observation-v1.mjs", "scripts/test-operator-project-home-readiness-observation-v1.mjs",
  "scripts/operator-execution-browser-lifecycle-v1.mjs", "scripts/browser-validate-operator-work-expectation-v1.mjs",
  "scripts/operator-execution-browser-child-v1.mjs",
]);
const CONDITION = Object.freeze({ phase: "e2e-operator-work-expectation", subphase: "work_expectation_recording",
  failure: "operator-work-expectation:Error:operator_condition_timeout:hydrated_expectation_project_home",
  predicate: '[data-blank-state="v0.1"][data-blank-state-active="true"][data-blank-state-project-management-hydrated="true"]',
  condition_ms: 45000, child_ms: 360000, historical_cause: "UNKNOWN" });
const capabilities = new WeakMap();
const fail = code => { throw Object.assign(new Error(code), { code }); };
const sha = value => typeof value === "string" && /^[0-9a-f]{64}$/u.test(value);
const commit = value => typeof value === "string" && /^[0-9a-f]{40}$/u.test(value);
const exact = (a, b) => digest(a) === digest(b);
const keys = (value, expected) => value && typeof value === "object" && !Array.isArray(value) && exact(Object.keys(value).sort(), [...expected].sort());
const validTime = value => typeof value === "string" && Number.isFinite(Date.parse(value)) && Date.parse(value) <= Date.now();

export function conditionArtifact(folder, ref, maximum = 64 * 1024) {
  if (!keys(ref, ["artifact", "sha256"]) || typeof ref.artifact !== "string" || !/^[a-z0-9_-]+\.(?:json|log|zip)$/u.test(ref.artifact) || !sha(ref.sha256)) fail("condition_evidence_reference_invalid");
  const file = path.join(folder, ref.artifact), stat = lstatSync(file);
  if (realpathSync(file) !== file || !stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || stat.size > maximum) fail("condition_evidence_unsafe");
  const bytes = readFileSync(file);
  if (digest(bytes) !== ref.sha256) fail("condition_evidence_changed");
  return bytes;
}

export function validateConditionPredecessor(receipt) {
  const r = receipt, copy = { ...r }; delete copy.integrity;
  const input = r.inputs, phases = r.phases;
  if (r.receipt_version !== 4 || r.integrity?.content_fingerprint !== digest(copy) ||
      r.outcome?.disposition !== "product_failure" || r.outcome?.safety !== "preserved_within_observed_scope" ||
      r.outcome?.validity !== "valid_within_observed_scope" || r.outcome.first_fault !== null ||
      r.evidence?.selected_plan !== "full-canonical" || r.verification_context?.kind !== "isolated-worktree" ||
      input?.contract !== "augnes.local-canonical-inputs.v3" || input.path_kind !== "isolated-model-free-v1" ||
      input.first_fault !== null || input.secondary_faults?.length !== 0 || !Array.isArray(input.events) || input.events.length >= 64 ||
      !Number.isSafeInteger(input.checks) || input.checks < 1 || !sha(r.executor?.source_fingerprint) ||
      input.binding?.executor_fingerprint !== r.executor.source_fingerprint ||
      !Array.isArray(input.resources) || new Set(input.resources.map(item => item.id)).size !== input.resources.length ||
      ["codex-preferences", "user-instructions", "auth-location", "github-auth-location", "git-config", "node-executable"].some(id => !input.resources.some(item => item.id === id)) ||
      input.fingerprint !== digest({ contract: input.contract, path_kind: input.path_kind, binding: input.binding, resources: input.resources }) ||
      input.binding?.head !== r.repository?.head_sha || input.binding?.tree !== r.repository?.tree_sha ||
      r.attempt?.head !== r.repository.head_sha || r.attempt?.tree !== r.repository.tree_sha || r.attempt?.attempt_id !== r.run?.id ||
      r.attempt.contract_fingerprint !== input.fingerprint || r.attempt.browser_replacement || ["observer_repair", "corrected_timeout", "condition_requalification"].includes(r.attempt.source_correction?.kind) ||
      !r.cleanup?.completed || r.cleanup.remaining_owned_processes !== 0 || r.cleanup.companion_service?.restored !== true ||
      r.cleanup.isolated_resources?.completed !== true || r.cleanup.isolated_resources.failure_count !== 0 || r.cleanup.isolated_resources.failures?.length !== 0 ||
      r.cleanup.generated_next?.present_after === true || r.cleanup.generated_windows_helper?.present_after === true ||
      r.checkout_ownership?.released !== true || r.capacity_ownership?.released !== true ||
      !Array.isArray(phases) || !exact(phases.map(phase => phase.id), BROWSER_REPLACEMENT_PHASES)) fail("condition_predecessor_ineligible");
  const environments = input.binding.phase_environment_fingerprints;
  if (!Array.isArray(environments) || environments.length !== phases.length || new Set(environments.map(item => item?.id)).size !== environments.length ||
      phases.some(phase => !environments.some(item => item?.id === phase.id && sha(item.fingerprint) &&
        (item.fingerprint === phase.environment_fingerprint || (phase.status === "not_run" && phase.environment_fingerprint == null))))) fail("condition_predecessor_environment_invalid");
  for (const resource of input.resources) {
    if (!INPUT_CLASSES.includes(resource.classification) || !resource.before || typeof resource.before !== "object" ||
        Array.isArray(resource.before) || typeof resource.before.present !== "boolean" ||
        (resource.readOnlyExecutable && (resource.classification !== "execution" || resource.metadataOnly || resource.excludePreferences)) ||
        (resource.excludePreferences && resource.classification !== "ambient")) fail("condition_predecessor_input_role_invalid");
    effectiveInputObservation(resource.before, resource, input);
  }
  for (const event of input.events) {
    const resource = input.resources.find(item => item.id === event.resource);
    if (!resource || Object.hasOwn(event, "diagnostic") || event.classification !== resource.classification ||
        !nonFaultInputChange(event.disposition) || classifyInputChange(resource.before, event.after, resource, input) !== event.disposition ||
        event.identity !== digest([event.resource, event.disposition, event.after])) fail("condition_predecessor_input_fault");
  }
  let failed = false;
  for (const phase of phases) {
    if (failed) {
      if (phase.status !== "not_run" || phase.timed_out !== false || phase.spawn_error_code) fail("condition_predecessor_unrelated_phase");
      continue;
    }
    if (phase.timed_out !== false || phase.spawn_error_code || !phase.cleanup?.completed ||
        phase.cleanup.remaining_owned_processes !== 0 || !phase.cleanup.exit_observed || !phase.cleanup.streams_closed ||
        phase.cleanup.termination_reason !== "natural_exit") fail("condition_predecessor_unsettled_phase");
    if (phase.status === "failure" && phase.id === "e2e-operator-work-expectation" && phase.exit_status === 1 && phase.failure_code === "phase_failed") failed = true;
    else if (phase.status !== "pass" || phase.exit_status !== 0 || phase.failure_code) fail("condition_predecessor_unrelated_phase");
  }
  if (!failed || r.final?.result !== "failure" || r.final.exit_status !== 1 ||
      !exact([...(r.final.reason_codes ?? [])].sort(), ["phase_failed", "selected_phases_incomplete"])) fail("condition_predecessor_ineligible");
  return r;
}

// Only complete line-start JSON objects are considered. Nested result-shaped
// values and incomplete output cannot substitute for the emitted child result.
function logObjects(text) {
  const records = [];
  for (let start = 0; start < text.length; start++) {
    if (text[start] !== "{" || (start !== 0 && text[start - 1] !== "\n")) continue;
    let depth = 0, quoted = false, escaped = false;
    for (let end = start; end < text.length; end++) {
      const c = text[end];
      if (quoted) { if (escaped) escaped = false; else if (c === "\\") escaped = true; else if (c === '"') quoted = false; }
      else if (c === '"') quoted = true;
      else if (c === "{" || c === "[") depth++;
      else if ((c === "}" || c === "]") && --depth === 0) {
        try { records.push(JSON.parse(text.slice(start, end + 1))); } catch { fail("condition_original_log_invalid"); }
        start = end; break;
      }
    }
  }
  return records;
}

function validateConditionResult(folder, p, original, repositoryRoot) {
  if (!exact(p.condition, CONDITION)) fail("condition_predicate_invalid");
  const bytes = conditionArtifact(folder, p.originals.log, 2 * 1024 * 1024);
  const result = JSON.parse(conditionArtifact(folder, p.originals.result, 512 * 1024));
  const phase = original.phases.find(item => item.id === CONDITION.phase), log = phase.log;
  if (log?.truncated !== false || log.bytes !== bytes.length ||
      log.relative_path !== `.augnes-local-verification/logs/${original.run.id}/${CONDITION.phase}.log`) fail("condition_original_log_binding_invalid");
  const file = path.join(repositoryRoot, log.relative_path), stat = lstatSync(file);
  if (realpathSync(file) !== file || !stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 ||
      stat.size !== bytes.length || digest(readFileSync(file)) !== p.originals.log.sha256) fail("condition_original_log_changed");
  // The historical receipt binds path/length, not a hash. The new hash binds the
  // preserved original available now; it does not invent an older attestation.
  const text = bytes.toString("utf8"), records = logObjects(text);
  const emitted = records.filter(item => item.validation_version === "operator_execution_browser_validation.v1" && item.child_id === "operator-work-expectation");
  const cleanup = records.filter(item => item.suite === CONDITION.phase && Object.hasOwn(item, "resource_cleanup"));
  const prefix = `[canonical:${CONDITION.phase}]`, lines = text.split("\n");
  const starts = lines.filter(line => line.startsWith(`${prefix} child_start `));
  const results = lines.filter(line => line.startsWith(`${prefix} child_result `));
  if (emitted.length !== 1 || !exact(emitted[0], result) || result.ok !== false || result.failure !== CONDITION.failure ||
      result.browser_failure_snapshot?.primary?.phase !== CONDITION.subphase || result.acceptance_bound_ms !== CONDITION.child_ms ||
      ["cleanup_complete", "owned_streams_settled", "temporary_root_removed", "temporary_process_root_removed", "temporary_profile_removed", "temporary_database_removed", "runtime_shutdown_complete", "chrome_cdp_shutdown_complete"].some(key => result[key] !== true) ||
      result.owned_process_residue_count !== 0 || result.listener_residue_count !== 0 ||
      starts.length !== 1 || starts[0] !== `${prefix} child_start label="independent operator work-expectation Browser child" timeout_ms=360000` ||
      results.length !== 1 || !/^\[canonical:e2e-operator-work-expectation\] child_result label="independent operator work-expectation Browser child" duration_ms=\d+ exit_code=1 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit$/u.test(results[0]) ||
      cleanup.length !== 1 || !Array.isArray(cleanup[0].resource_cleanup) || !cleanup[0].resource_cleanup.length || cleanup[0].resource_cleanup.some(item =>
        item.completed !== true || item.failure_count !== 0 || item.failures?.length !== 0)) fail("condition_original_result_invalid");
}

export function readConditionRequalificationEvidence(file, p, repositoryRoot) {
  const stored = { ...p }; delete stored.local_relative_path;
  if (!keys(stored, ["schema", "kind", "branch", "base", "head", "tree", "prior_family_id", "prior_number", "prior_attempt_id", "prior_receipt_fingerprint", "originals", "condition", "diagnosis", "final_source", "authorization", "pull_request", "budget"]) ||
      !isConditionRequalification(p) || ![p.base, p.head, p.tree, p.diagnosis?.head, p.diagnosis?.tree].every(commit) ||
      typeof p.branch !== "string" || !p.branch.length || !sha(p.prior_family_id) || ![1, 2].includes(p.prior_number) || !sha(p.prior_receipt_fingerprint) ||
      !keys(p.originals, ["receipt", "attempt", "completion", "log", "result"]) || !keys(p.diagnosis, ["head", "tree", "archive", "review"]) ||
      !keys(p.diagnosis.review, ["id", "sha256"]) || !Number.isSafeInteger(p.diagnosis.review.id) || p.diagnosis.review.id <= 0 || !sha(p.diagnosis.review.sha256) ||
      !Number.isSafeInteger(p.pull_request) || p.pull_request <= 0 || !exact(p.budget, { initial: 1, recovery: 0 })) fail("condition_proof_invalid");
  const folder = path.dirname(file), original = validateConditionPredecessor(JSON.parse(conditionArtifact(folder, p.originals.receipt, 512 * 1024)));
  const prior = JSON.parse(conditionArtifact(folder, p.originals.attempt)), completion = JSON.parse(conditionArtifact(folder, p.originals.completion));
  if (!exact(original.attempt, prior) || prior.family_id !== p.prior_family_id || prior.number !== p.prior_number || prior.branch !== p.branch ||
      prior.attempt_id !== p.prior_attempt_id || original.integrity.content_fingerprint !== p.prior_receipt_fingerprint ||
      completion.contract !== prior.contract || completion.attempt_id !== prior.attempt_id || completion.receipt_fingerprint !== p.prior_receipt_fingerprint ||
      completion.disposition !== "product_failure" || completion.cleanup_complete !== true || !validTime(completion.finished_at) ||
      completion.infrastructure_code !== null ||
      p.diagnosis.head !== prior.head || p.diagnosis.tree !== prior.tree || p.head === prior.head || p.tree === prior.tree) fail("condition_original_binding_invalid");
  validateConditionResult(folder, p, original, repositoryRoot);
  conditionArtifact(folder, p.diagnosis.archive, 64 * 1024 * 1024);
  const source = JSON.parse(conditionArtifact(folder, p.final_source));
  if (!keys(source, ["schema", "basis", "base", "head", "tree", "predecessor_head", "predecessor_tree", "delta_sha256", "changed_paths", "main_delta_sha256", "main_changed_paths"]) ||
      source.schema !== "augnes.condition-requalification-final-source.v1" || source.basis !== "implementation_owner_not_independent_review" ||
      source.base !== p.base || source.head !== p.head || source.tree !== p.tree || source.predecessor_head !== prior.head || source.predecessor_tree !== prior.tree) fail("condition_final_source_invalid");
  const git = args => execFileSync("git", args, { cwd: repositoryRoot, timeout: 10000, maxBuffer: 16 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
  const paths = (a, b) => git(["diff", "--name-only", a, b, "--"]).toString().trim().split("\n").filter(Boolean).sort();
  const delta = (a, b) => digest(git(["diff", "--binary", "--no-ext-diff", "--no-textconv", a, b, "--"]));
  const blob = (head, name) => git(["show", `${head}:${name}`]);
  for (const a of [prior.head, p.base]) git(["merge-base", "--is-ancestor", a, p.head]);
  if (git(["rev-parse", `${p.head}^{tree}`]).toString().trim() !== p.tree || delta(prior.head, p.head) !== source.delta_sha256 ||
      !exact(paths(prior.head, p.head), source.changed_paths) || delta(p.base, p.head) !== source.main_delta_sha256 ||
      !exact(paths(p.base, p.head), source.main_changed_paths)) fail("condition_source_binding_invalid");
  const sharedBase = git(["merge-base", prior.head, p.base]).toString().trim(), retained = new Set(paths(sharedBase, prior.head));
  // A removed PR delta can be a task regression too: reverting an accepted task
  // file to main must not evade a check that only visits final PR changed paths.
  for (const name of retained) {
    if (!POLICY_PATHS.has(name) && digest(blob(p.head, name)) !== digest(blob(prior.head, name))) fail("condition_retained_task_changed");
  }
  for (const name of paths(p.base, p.head)) {
    if (!POLICY_PATHS.has(name) && (!retained.has(name) || digest(blob(p.head, name)) !== digest(blob(prior.head, name)))) fail("condition_unrelated_candidate_delta");
  }
  return { original, prior, completion, source };
}

export function conditionAuthorityObservation(record, role) {
  return { id: record.id, author: record.user?.login, author_id: record.user?.id, body_sha256: digest(record.body),
    timestamp: record.updated_at ?? record.submitted_at, role, commit_id: role === "accepted_diagnosis" ? record.commit_id : null };
}

function assertAuthorityProse(p, diagnosis, grant) {
  const reviewRequired = ["DIAGNOSIS ACCEPTED within its recorded development scope / no supported behavioral correction / qualification HOLD / DO NOT MERGE.",
    `Reviewed unchanged HEAD \`${p.diagnosis.head}\`, tree \`${p.diagnosis.tree}\``, p.diagnosis.archive.sha256];
  const grantRequired = ["## Explicit user authorization — bounded requalification after non-reproduced Project Home condition failure",
    `https://github.com/hynk-studio/augnes/pull/${p.pull_request}#pullrequestreview-${p.diagnosis.review.id}`,
    p.diagnosis.head, p.diagnosis.tree, p.branch, p.prior_family_id, p.prior_attempt_id, p.prior_receipt_fingerprint, p.diagnosis.archive.sha256,
    "Budget: one admitted Full; zero additional automatic or explicit recovery/retry under this authorization.",
    "Use a truthful implementation-owner final-source/binding record for new code; do not label future bytes independently reviewed.",
    "No separate policy-only Full, prior deployment, new final-source execution grant, or routine independent-review handoff between this bounded implementation and its Full is required.",
    "ChatGPT's independent audit of the implemented policy, exact final source and actual results is the post-completion decision.",
    "Once the exclusive reservation is made, the allowance cannot be renewed by a crash, different branch/worktree/HEAD/proof, compatible main integration, duplicated grant or another successor kind. Interrupted reservation stays consumed.",
    "Outcome success, failure, cancellation or interruption permits no second Full/recovery under this grant. Return the actual result."];
  if (reviewRequired.some(value => !diagnosis.body.includes(value))) fail("condition_diagnosis_scope_invalid");
  if (grantRequired.some(value => !grant.body.includes(value))) fail("condition_authority_scope_invalid");
}

export async function authorizeConditionRequalification(p, { transport = createGitHubObserverAuthorizationTransport(p.pull_request) } = {}) {
  const refs = p.authorization;
  if (!isConditionRequalification(p) || !keys(refs, ["grant_comment_id", "grant_sha256"]) || !Number.isSafeInteger(refs.grant_comment_id) || refs.grant_comment_id <= 0 || !sha(refs.grant_sha256)) fail("condition_authority_missing");
  const diagnosis = await transport.review(p.diagnosis.review.id), grant = await transport.grant(refs.grant_comment_id), observations = {};
  for (const [record, role, ref] of [[diagnosis, "accepted_diagnosis", p.diagnosis.review], [grant, "execution_grant", { id: refs.grant_comment_id, sha256: refs.grant_sha256 }]]) {
    if (record?.id !== ref.id || record.user?.type !== "User" || !Number.isSafeInteger(record.user?.id) || record.user.id <= 0 ||
        typeof record.user?.login !== "string" || !/^[A-Za-z0-9-]{1,39}$/u.test(record.user.login) || !["OWNER", "MEMBER", "COLLABORATOR"].includes(record.author_association) ||
        typeof record.body !== "string" || Buffer.byteLength(record.body) > 64 * 1024) fail("condition_authority_identity_invalid");
    if (role === "accepted_diagnosis" ? record.pull_request_url !== `https://api.github.com/repos/hynk-studio/augnes/pulls/${p.pull_request}` ||
        !["COMMENTED", "APPROVED"].includes(record.state) || record.commit_id !== p.diagnosis.head :
        record.issue_url !== `https://api.github.com/repos/hynk-studio/augnes/issues/${p.pull_request}`) fail("condition_authority_source_invalid");
    const observation = conditionAuthorityObservation(record, role);
    if (!validTime(observation.timestamp) || digest(observation) !== ref.sha256) fail("condition_authority_changed");
    const permission = await transport.permission(record.user.login);
    if (permission.user?.login !== record.user.login || !["admin", "maintain"].includes(permission.permission)) fail("condition_authority_permission_invalid");
    observations[role] = observation;
  }
  assertAuthorityProse(p, diagnosis, grant);
  if (Date.parse(observations.execution_grant.timestamp) < Date.parse(observations.accepted_diagnosis.timestamp)) fail("condition_authority_order_invalid");
  const pr = await transport.pullRequest();
  if (pr?.number !== p.pull_request || pr.state !== "open" || pr.draft !== true || pr.merged !== false || pr.auto_merge !== null ||
      pr.head?.repo?.full_name !== "hynk-studio/augnes" || pr.base?.repo?.full_name !== "hynk-studio/augnes" ||
      pr.head.sha !== p.head || pr.head.ref !== p.branch || pr.base.sha !== p.base || pr.base.ref !== "main") fail("condition_published_source_invalid");
  const capability = Object.freeze({ observations });
  capabilities.set(capability, { proof: digest(p), observations: digest(observations) });
  return capability;
}
export function assertConditionRequalificationAuthorization(p, capability, completion) {
  const state = capabilities.get(capability);
  if (!state || state.proof !== digest(p) || state.observations !== digest(capability.observations) ||
      Date.parse(capability.observations.accepted_diagnosis.timestamp) <= Date.parse(completion.finished_at)) fail("condition_authenticated_authority_required");
}

// Sanitized export references intentionally omit private artifact filenames.
// This validates evidence structure, never creates live execution authority.
export function validConditionRequalificationAttempt(attempt) {
  const p = attempt?.source_correction;
  return isConditionRequalification(p) && attempt.number === 1 && !attempt.recovery && !attempt.browser_replacement &&
    exact(attempt.budget, { initial: 1, recovery: 0 }) && exact(p.budget, { initial: 1, recovery: 0 }) && exact(p.condition, CONDITION) &&
    [p.base, p.head, p.tree, p.diagnosis?.head, p.diagnosis?.tree].every(commit) && p.head === attempt.head && p.tree === attempt.tree &&
    [p.final_source?.sha256, p.diagnosis?.archive?.sha256, ...["receipt", "attempt", "completion", "log", "result"].map(key => p.originals?.[key]?.sha256)].every(sha) &&
    ["accepted_diagnosis", "execution_grant"].every(role => {
      const observation = attempt.condition_authority?.[role];
      const ref = role === "accepted_diagnosis" ? p.diagnosis?.review : { id: p.authorization?.grant_comment_id, sha256: p.authorization?.grant_sha256 };
      return keys(observation, ["id", "author", "author_id", "body_sha256", "timestamp", "role", "commit_id"]) && observation.role === role &&
        observation.id === ref?.id && digest(observation) === ref?.sha256 && Number.isSafeInteger(observation.id) && observation.id > 0 &&
        Number.isSafeInteger(observation.author_id) && observation.author_id > 0 && typeof observation.author === "string" && /^[A-Za-z0-9-]{1,39}$/u.test(observation.author) &&
        sha(observation.body_sha256) && validTime(observation.timestamp) && observation.commit_id === (role === "accepted_diagnosis" ? p.diagnosis.head : null);
    });
}

