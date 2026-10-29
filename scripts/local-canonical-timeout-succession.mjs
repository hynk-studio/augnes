// Prospective, single-use succession after a materially corrected nested timeout.
// Historical outcomes remain unchanged; proof bytes alone never grant execution.
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { digest, classifyInputChange, nonFaultInputChange, effectiveInputObservation, INPUT_CLASSES } from "./local-canonical-inputs.mjs";
import { BROWSER_REPLACEMENT_PHASES } from "./local-canonical-browser-replacement.mjs";
import { createGitHubObserverAuthorizationTransport } from "./github-main-branch-transport.mjs";

export const TIMEOUT_REPAIR_SCHEMA = "augnes.local-canonical-source-correction.v4";
export const TIMEOUT_AUTH_SCHEMA = "augnes.local-canonical-corrected-timeout-authority.v1";
export const isCorrectedTimeout = p => p?.schema === TIMEOUT_REPAIR_SCHEMA && p.kind === "corrected_timeout";
export const TIMEOUT_RETAINED_SOURCES = Object.freeze([
  "lib/db/structural-schema-contract.mjs", "scripts/test-database-access.ts",
]);
const WORKLOAD_SOURCES = ["scripts/test-request-bound-review.ts", "scripts/test-review-callback-enrollment.ts"];
const POLICY_PATHS = new Set([
  ".github/LOCAL_CANONICAL_VERIFICATION.md", "docs/LOCAL_CANONICAL_INPUT_CONTRACT.md",
  "scripts/local-canonical-attempts.mjs", "scripts/local-canonical-timeout-succession.mjs",
  "scripts/local-canonical-receipt.mjs", "scripts/local-canonical-review-export.mjs",
  "scripts/run-local-canonical-verification.mjs", "scripts/run-canonical-test-suite.mjs", "scripts/github-main-branch-transport.mjs",
  "scripts/test-local-canonical-executor.mjs", "scripts/test-local-canonical-review-corrections.mjs",
  "scripts/test-local-canonical-classification.mjs", "scripts/fixtures/local-canonical-timeout-succession.mjs",
]);
const capabilities = new WeakMap();
const fail = code => { throw Object.assign(new Error(code), { code }); };
const sha = value => typeof value === "string" && /^[0-9a-f]{64}$/u.test(value);
const commit = value => typeof value === "string" && /^[0-9a-f]{40}$/u.test(value);
const exact = (a, b) => digest(a) === digest(b);
const keys = (value, expected) => value && typeof value === "object" && !Array.isArray(value) && exact(Object.keys(value).sort(), [...expected].sort());
const validTime = value => typeof value === "string" && Number.isFinite(Date.parse(value)) && Date.parse(value) <= Date.now();

export function timeoutArtifact(folder, ref, maximum = 64 * 1024) {
  if (!keys(ref, ["artifact", "sha256"]) || typeof ref.artifact !== "string" || !/^[a-z0-9_-]+\.(?:json|mjs|log)$/u.test(ref.artifact) || !sha(ref.sha256)) fail("timeout_evidence_reference_invalid");
  const file = path.join(folder, ref.artifact), stat = lstatSync(file);
  if (realpathSync(file) !== file || !stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || stat.size > maximum) fail("timeout_evidence_unsafe");
  const bytes = readFileSync(file);
  if (digest(bytes) !== ref.sha256) fail("timeout_evidence_changed");
  return bytes;
}

export function validateTimeoutPredecessor(receipt) {
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
      r.attempt.contract_fingerprint !== input.fingerprint || r.attempt.browser_replacement || isCorrectedTimeout(r.attempt.source_correction) ||
      !r.cleanup?.completed || r.cleanup.remaining_owned_processes !== 0 || r.cleanup.companion_service?.restored !== true ||
      r.cleanup.isolated_resources?.completed !== true || r.cleanup.isolated_resources.failure_count !== 0 || r.cleanup.isolated_resources.failures?.length !== 0 ||
      r.cleanup.generated_next?.present_after === true || r.cleanup.generated_windows_helper?.present_after === true ||
      r.checkout_ownership?.released !== true || r.capacity_ownership?.released !== true ||
      !Array.isArray(phases) || !exact(phases.map(phase => phase.id), BROWSER_REPLACEMENT_PHASES)) fail("timeout_predecessor_ineligible");
  const environments = input.binding.phase_environment_fingerprints;
  if (!Array.isArray(environments) || environments.length !== phases.length || new Set(environments.map(item => item?.id)).size !== environments.length ||
      phases.some(phase => !environments.some(item => item?.id === phase.id && sha(item.fingerprint) &&
        (item.fingerprint === phase.environment_fingerprint || (phase.status === "not_run" && phase.environment_fingerprint == null))))) fail("timeout_predecessor_environment_invalid");
  for (const resource of input.resources) {
    if (!INPUT_CLASSES.includes(resource.classification) || !resource.before || typeof resource.before !== "object" ||
        Array.isArray(resource.before) || typeof resource.before.present !== "boolean" ||
        (resource.readOnlyExecutable && (resource.classification !== "execution" || resource.metadataOnly || resource.excludePreferences)) ||
        (resource.excludePreferences && resource.classification !== "ambient")) fail("timeout_predecessor_input_role_invalid");
    effectiveInputObservation(resource.before, resource, input);
  }
  for (const event of input.events) {
    const resource = input.resources.find(item => item.id === event.resource);
    if (!resource || Object.hasOwn(event, "diagnostic") || event.classification !== resource.classification ||
        !nonFaultInputChange(event.disposition) || classifyInputChange(resource.before, event.after, resource, input) !== event.disposition ||
        event.identity !== digest([event.resource, event.disposition, event.after])) fail("timeout_predecessor_input_fault");
  }
  let failed = false;
  for (const phase of phases) {
    if (failed) {
      if (phase.status !== "not_run" || phase.timed_out !== false || phase.spawn_error_code) fail("timeout_predecessor_unrelated_phase");
      continue;
    }
    if (phase.timed_out !== false || phase.spawn_error_code || !phase.cleanup?.completed ||
        phase.cleanup.remaining_owned_processes !== 0 || !phase.cleanup.exit_observed || !phase.cleanup.streams_closed ||
        phase.cleanup.termination_reason !== "natural_exit") fail("timeout_predecessor_unsettled_phase");
    if (phase.status === "failure" && phase.id === "integration" && phase.exit_status === 1 && phase.failure_code === "phase_failed") failed = true;
    else if (phase.status !== "pass" || phase.exit_status !== 0 || phase.failure_code) fail("timeout_predecessor_unrelated_phase");
  }
  if (!failed || r.final?.result !== "failure" || r.final.exit_status !== 1 ||
      !exact([...(r.final.reason_codes ?? [])].sort(), ["phase_failed", "selected_phases_incomplete"])) fail("timeout_predecessor_ineligible");
  return r;
}

function validateNestedTimeout(file, p, original, repositoryRoot) {
  const timeout = p.timeout;
  if (!keys(timeout, ["phase", "label", "budget_ms", "log", "historical_cause"]) || timeout.phase !== "integration" ||
      timeout.historical_cause !== "UNKNOWN" || typeof timeout.label !== "string" || timeout.label.length < 1 || timeout.label.length > 200 ||
      !Number.isSafeInteger(timeout.budget_ms) || timeout.budget_ms <= 0) fail("timeout_nested_evidence_invalid");
  const bytes = timeoutArtifact(path.dirname(file), timeout.log, 2 * 1024 * 1024);
  const log = original.phases.find(phase => phase.id === timeout.phase).log;
  if (log?.truncated !== false || log.bytes !== bytes.length ||
      !/^\.augnes-local-verification\/logs\/[A-Za-z0-9_-]+\/integration\.log$/u.test(log.relative_path ?? "")) fail("timeout_original_log_binding_invalid");
  const originalFile = path.join(repositoryRoot, log.relative_path), stat = lstatSync(originalFile);
  if (realpathSync(originalFile) !== originalFile || !stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 ||
      stat.size !== log.bytes || digest(readFileSync(originalFile)) !== timeout.log.sha256) fail("timeout_original_log_changed");
  // The old receipt records path/bytes, not a log hash. This proves the preserved
  // available original matches this new capture; it does not rewrite old evidence.
  const starts = new Map(), results = new Map(), cleanups = new Set();
  let resourceCleanup = 0;
  for (const line of bytes.toString("utf8").split("\n")) {
    const start = line.match(/^\[canonical:integration\] child_start label=("(?:[^"\\]|\\.)*") timeout_ms=(\d+)$/u);
    if (line.startsWith("[canonical:integration] child_start ") && !start) fail("timeout_nested_inventory_invalid");
    if (start) {
      const label = JSON.parse(start[1]);
      if (starts.has(label)) fail("timeout_nested_inventory_invalid");
      starts.set(label, Number(start[2]));
    }
    if (line.startsWith("[canonical:integration] child_result ")) {
      const match = line.match(/^\[canonical:integration\] child_result label=("(?:[^"\\]|\\.)*") duration_ms=(\d+) exit_code=(null|\d+) signal=(null|SIGTERM|SIGKILL) timed_out=(true|false) exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=(natural_exit|bounded_timeout)$/u);
      if (!match) fail("timeout_nested_unsettled");
      const label = JSON.parse(match[1]), selected = label === timeout.label;
      if (results.has(label) || !starts.has(label) || (selected ?
        match[3] !== "null" || match[5] !== "true" || match[6] !== "bounded_timeout" || Number(match[2]) < timeout.budget_ms :
        match[3] !== "0" || match[4] !== "null" || match[5] !== "false" || match[6] !== "natural_exit")) fail("timeout_nested_unrelated_failure");
      results.set(label, true);
    }
    if (line.startsWith("[canonical:integration] child_cleanup_result ")) {
      const match = line.match(/^\[canonical:integration\] child_cleanup_result label=("(?:[^"\\]|\\.)*") elapsed_ms=\d+ reason=(bounded_timeout|post_exit_settlement|post_close_settlement)(?: term_sent=(true|false) kill_sent=(true|false))? streams_closed=true remaining_owned_processes=0$/u);
      if (!match) fail("timeout_nested_unsettled");
      const label = JSON.parse(match[1]);
      if (cleanups.has(label) || !starts.has(label) || (label === timeout.label ? match[2] !== "bounded_timeout" || match[3] !== undefined :
        match[2] === "bounded_timeout" || match[3] === undefined)) fail("timeout_nested_unsettled");
      cleanups.add(label);
    }
    if (line.startsWith("{")) {
      let record; try { record = JSON.parse(line); } catch { continue; }
      if (record.suite === "integration" && Object.hasOwn(record, "resource_cleanup")) {
        if (!Array.isArray(record.resource_cleanup) || !record.resource_cleanup.length || record.resource_cleanup.some(item =>
          item.completed !== true || item.failure_count !== 0 || item.failures?.length !== 0)) fail("timeout_nested_resource_unsettled");
        resourceCleanup++;
      }
    }
  }
  if (starts.size !== results.size || starts.size !== cleanups.size || !results.has(timeout.label) || starts.get(timeout.label) !== timeout.budget_ms ||
      resourceCleanup !== 1) fail("timeout_nested_inventory_invalid");
}

export function readTimeoutRepairEvidence(file, p, repositoryRoot) {
  const allowed = ["schema", "kind", "defect", "branch", "base", "head", "tree", "prior_family_id", "prior_number", "prior_attempt_id", "prior_receipt_fingerprint", "source_module", "fixture_artifact", "fixture_sha256", "environment_fingerprint", "before", "after", "originals", "repair", "delta_sha256", "changed_paths", "retained_sources", "authorization", "pull_request", "budget", "timeout", "final_delta"];
  const stored = { ...p }; delete stored.local_relative_path;
  if (!keys(stored, allowed) || !isCorrectedTimeout(p) || p.defect !== "fixed_pragma_statement_repreparation" ||
      p.source_module !== TIMEOUT_RETAINED_SOURCES[0] || ![p.base, p.head, p.tree, p.repair?.head, p.repair?.tree].every(commit) ||
      !keys(p.repair, ["head", "tree", "delta_sha256", "changed_paths", "review"]) || !keys(p.repair.review, ["id", "sha256"]) ||
      !Number.isSafeInteger(p.repair.review.id) || p.repair.review.id <= 0 || !sha(p.repair.review.sha256) ||
      !keys(p.originals, ["receipt", "attempt", "completion"]) || !exact(p.budget, { initial: 1, recovery: 0 }) ||
      !Number.isSafeInteger(p.pull_request) || p.pull_request <= 0 || !keys(p.retained_sources, TIMEOUT_RETAINED_SOURCES) ||
      !Object.values(p.retained_sources).every(sha) || !keys(p.final_delta, ["basis", "delta_sha256", "changed_paths"]) ||
      p.final_delta.basis !== "implementation_owner_not_independent_review") fail("timeout_proof_invalid");
  const folder = path.dirname(file), original = validateTimeoutPredecessor(JSON.parse(timeoutArtifact(folder, p.originals.receipt, 512 * 1024)));
  const prior = JSON.parse(timeoutArtifact(folder, p.originals.attempt)), completion = JSON.parse(timeoutArtifact(folder, p.originals.completion));
  if (!exact(original.attempt, prior) || prior.family_id !== p.prior_family_id || prior.number !== p.prior_number || prior.branch !== p.branch ||
      prior.attempt_id !== p.prior_attempt_id || original.integrity.content_fingerprint !== p.prior_receipt_fingerprint ||
      completion.contract !== prior.contract || completion.attempt_id !== prior.attempt_id || completion.receipt_fingerprint !== p.prior_receipt_fingerprint ||
      completion.disposition !== "product_failure" || completion.cleanup_complete !== true || !validTime(completion.finished_at) ||
      p.head === prior.head || p.tree === prior.tree || p.repair.head === prior.head || p.repair.tree === prior.tree) fail("timeout_original_binding_invalid");
  validateNestedTimeout(file, p, original, repositoryRoot);
  const git = args => execFileSync("git", args, { cwd: repositoryRoot, timeout: 10000, maxBuffer: 16 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
  const paths = (a, b) => git(["diff", "--name-only", a, b, "--"]).toString().trim().split("\n").filter(Boolean).sort();
  const delta = (a, b) => digest(git(["diff", "--binary", "--no-ext-diff", "--no-textconv", a, b, "--"]));
  const source = (head, name) => git(["show", `${head}:${name}`]);
  for (const [a, b] of [[prior.head, p.repair.head], [p.repair.head, p.head], [p.base, p.head]]) git(["merge-base", "--is-ancestor", a, b]);
  for (const target of [p, p.repair]) {
    if (git(["rev-parse", `${target.head}^{tree}`]).toString().trim() !== target.tree ||
        delta(prior.head, target.head) !== target.delta_sha256 || !exact(paths(prior.head, target.head), target.changed_paths)) fail("timeout_source_binding_invalid");
  }
  if (delta(p.repair.head, p.head) !== p.final_delta.delta_sha256 || !exact(paths(p.repair.head, p.head), p.final_delta.changed_paths)) fail("timeout_final_delta_invalid");
  const sharedBase = git(["merge-base", p.repair.head, p.base]).toString().trim();
  const retainedTaskPaths = new Set(paths(sharedBase, p.repair.head));
  for (const name of paths(p.base, p.head)) {
    if (!POLICY_PATHS.has(name) && (!retainedTaskPaths.has(name) || digest(source(p.head, name)) !== digest(source(p.repair.head, name)))) fail("timeout_unrelated_candidate_delta");
  }
  for (const [name, hash] of Object.entries(p.retained_sources)) {
    if (digest(source(p.repair.head, name)) !== hash || digest(source(p.head, name)) !== hash) fail("timeout_reviewed_repair_changed");
  }
  for (const name of WORKLOAD_SOURCES) {
    if (digest(source(prior.head, name)) !== digest(source(p.repair.head, name)) || digest(source(prior.head, name)) !== digest(source(p.head, name))) fail("timeout_workload_changed");
  }
  const registration = head => {
    const matches = [...source(head, "scripts/run-canonical-test-suite.mjs").toString().matchAll(/\{\s*id:\s*"request-bound-review",[^]*?requireNaturalExit:\s*true,\s*\}/gu)];
    if (matches.length !== 1) fail("timeout_registration_invalid");
    return matches[0][0];
  };
  const registered = registration(prior.head);
  if (registration(p.repair.head) !== registered || registration(p.head) !== registered ||
      !registered.includes(`label: ${JSON.stringify(p.timeout.label)}`) || !registered.includes('rootNode("scripts/test-request-bound-review.ts")') ||
      Number(registered.match(/timeoutMs:\s*([\d_]+),/u)?.[1].replaceAll("_", "")) !== p.timeout.budget_ms) fail("timeout_workload_changed");
  if (p.retained_sources[p.source_module] !== p.after?.source_sha256 || digest(source(prior.head, p.source_module)) !== p.before?.source_sha256) fail("timeout_regression_binding_invalid");
  const before = JSON.parse(timeoutArtifact(folder, { artifact: p.before.artifact, sha256: p.before.sha256 }));
  if (Date.parse(before.finished_at) <= Date.parse(completion.finished_at)) fail("timeout_witness_predates_settlement");
  return { original, prior, completion };
}

export function timeoutAuthorityBinding(p) {
  const evidence = { ...p }; delete evidence.authorization; delete evidence.local_relative_path;
  return { schema: TIMEOUT_AUTH_SCHEMA, evidence_fingerprint: digest(evidence), head: p.head, tree: p.tree, base: p.base,
    accepted_repair_head: p.repair.head, historical_cause: "UNKNOWN", workload: "full-canonical", separate_stock: true, budget: { initial: 1, recovery: 0 } };
}
export function timeoutAuthorityObservation(record, role) {
  return { id: record.id, author: record.user?.login, author_id: record.user?.id, body_sha256: digest(record.body),
    timestamp: record.updated_at ?? record.submitted_at, role, commit_id: role === "accepted_repair" ? record.commit_id : null };
}

// This narrow prose profile consumes the already posted prospective instruction.
// It deliberately requires neither a newly invented fence nor final-head review.
function assertAuthorityProse(p, repair, grant) {
  if (!repair.body.includes(`Reviewed head \`${p.repair.head}\`, tree \`${p.repair.tree}\``) ||
      !repair.body.includes("This review accepts the three-file structural-statement correction and its bounded development evidence;")) fail("timeout_review_scope_invalid");
  const required = [
    "## User-authorized continuation — minimal policy correction and one complete qualification",
    `https://github.com/hynk-studio/augnes/pull/${p.pull_request}#pullrequestreview-${p.repair.review.id}`,
    `The reviewed structural-statement correction at \`${p.repair.head}\` / tree \`${p.repair.tree}\` is ACCEPT / RETAIN.`,
    "The deciding allowance is **one Full and zero recovery/retry**.",
    "It is not a new allowance per commit, worktree, proof, grant copy or accepted-main merge.",
    "The user's explicit instruction supplies this task authority; the new policy/source and resulting evidence receive independent post-completion audit.",
    "Bind the actual final source and all subsequent in-scope policy/integration changes in the new proof.",
  ];
  if (required.some(sentence => !grant.body.includes(sentence))) fail("timeout_authority_scope_invalid");
}

export async function authorizeCorrectedTimeout(p, { transport = createGitHubObserverAuthorizationTransport(p.pull_request) } = {}) {
  const refs = p.authorization;
  if (!isCorrectedTimeout(p) || !keys(refs, ["grant_comment_id", "grant_sha256"]) ||
      !Number.isSafeInteger(refs.grant_comment_id) || refs.grant_comment_id <= 0 || !sha(refs.grant_sha256)) fail("timeout_authority_missing");
  const repair = await transport.review(p.repair.review.id), grant = await transport.grant(refs.grant_comment_id), observations = {};
  for (const [record, role, ref] of [[repair, "accepted_repair", p.repair.review], [grant, "execution_grant", { id: refs.grant_comment_id, sha256: refs.grant_sha256 }]]) {
    if (record?.id !== ref.id || record.user?.type !== "User" || !Number.isSafeInteger(record.user?.id) || record.user.id <= 0 ||
        typeof record.user?.login !== "string" || !/^[A-Za-z0-9-]{1,39}$/u.test(record.user.login) || !["OWNER", "MEMBER", "COLLABORATOR"].includes(record.author_association) ||
        typeof record.body !== "string" || Buffer.byteLength(record.body) > 64 * 1024) fail("timeout_authority_identity_invalid");
    if (role === "accepted_repair" ?
      record.pull_request_url !== `https://api.github.com/repos/hynk-studio/augnes/pulls/${p.pull_request}` || !["COMMENTED", "APPROVED"].includes(record.state) || record.commit_id !== p.repair.head :
      record.issue_url !== `https://api.github.com/repos/hynk-studio/augnes/issues/${p.pull_request}`) fail("timeout_authority_source_invalid");
    const observation = timeoutAuthorityObservation(record, role);
    if (!validTime(observation.timestamp) || digest(observation) !== ref.sha256) fail("timeout_authority_changed");
    const permission = await transport.permission(record.user.login);
    if (permission.user?.login !== record.user.login || !["admin", "maintain"].includes(permission.permission)) fail("timeout_authority_permission_invalid");
    observations[role] = observation;
  }
  assertAuthorityProse(p, repair, grant);
  if (Date.parse(observations.execution_grant.timestamp) < Date.parse(observations.accepted_repair.timestamp)) fail("timeout_authority_order_invalid");
  const capability = Object.freeze({ observations });
  capabilities.set(capability, { proof: digest(p), observations: digest(observations) });
  return capability;
}
export function assertCorrectedTimeoutAuthorization(proof, capability, completion) {
  const state = capabilities.get(capability);
  if (!state || state.proof !== digest(proof) || state.observations !== digest(capability.observations) ||
      Date.parse(capability.observations.accepted_repair.timestamp) <= Date.parse(completion.finished_at)) fail("timeout_authenticated_authority_required");
}

// Offline structure is evidence inspection, not live authorization.
export function validTimeoutAttempt(attempt) {
  const p = attempt?.source_correction;
  return isCorrectedTimeout(p) && attempt.number === 1 && !attempt.recovery && !attempt.browser_replacement &&
    exact(attempt.budget, { initial: 1, recovery: 0 }) && exact(p.budget, { initial: 1, recovery: 0 }) &&
    [p.base, p.head, p.tree, p.repair?.head].every(commit) && p.head === attempt.head && p.tree === attempt.tree &&
    ["accepted_repair", "execution_grant"].every(role => {
      const observation = attempt.timeout_authority?.[role];
      const ref = role === "accepted_repair" ? p.repair?.review : { id: p.authorization?.grant_comment_id, sha256: p.authorization?.grant_sha256 };
      return keys(observation, ["id", "author", "author_id", "body_sha256", "timestamp", "role", "commit_id"]) && observation.role === role &&
        observation.id === ref?.id && digest(observation) === ref?.sha256 && Number.isSafeInteger(observation.id) && observation.id > 0 &&
        Number.isSafeInteger(observation.author_id) && observation.author_id > 0 && typeof observation.author === "string" && /^[A-Za-z0-9-]{1,39}$/u.test(observation.author) &&
        sha(observation.body_sha256) && validTime(observation.timestamp) && observation.commit_id === (role === "accepted_repair" ? p.repair.head : null);
    });
}
