// A separate, prospective route for the accepted Companion fixture repair.
// Historical timeout cause stays UNKNOWN; evidence never grants execution.
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { digest, classifyInputChange, nonFaultInputChange, effectiveInputObservation, INPUT_CLASSES } from "./local-canonical-inputs.mjs";
import { BROWSER_REPLACEMENT_PHASES } from "./local-canonical-browser-replacement.mjs";
import { createGitHubObserverAuthorizationTransport } from "./github-main-branch-transport.mjs";

export const COMPANION_TIMEOUT_SCHEMA = "augnes.local-canonical-source-correction.v7";
export const COMPANION_SOURCE_SCOPE_SCHEMA = "augnes.local-canonical-companion-source-scope.v1";
export const COMPANION_AUTH_SCHEMA = "augnes.local-canonical-companion-timeout-authority.v1";
export const COMPANION_DEFECT = "owned_child_readiness_exit_without_setup_cleanup";
export const COMPANION_MODULE = "scripts/test-companion-ownership-retirement.mjs";
export const COMPANION_LABEL = "Companion lost-ownership retirement and reconciliation regressions";
export const COMPANION_SOURCE_HASHES = Object.freeze({
  before: "0b8d8416742ec1dd478c4ec70748066944e3c61732964f6e2d141dcc18cedfbd",
  after: "62e63db0423627ba23fe1793de1a880a056cf2a4ea5ed854938b134793eb685d",
});
export const COMPANION_OWNER_SOURCES = Object.freeze([
  "scripts/augnes-companion-service.mjs",
  "plugins/augnes-operator/mcp/companion-service-core.mjs",
  "plugins/augnes-operator/mcp/checkout-identity.mjs",
  "plugins/augnes-operator/mcp/checkout-identity-darwin.py",
  "plugins/augnes-operator/mcp/node-runtime-policy.mjs",
  "scripts/test-harness-process-lifecycle.mjs",
]);
export const COMPANION_RETAINED_SOURCES = Object.freeze([COMPANION_MODULE, ...COMPANION_OWNER_SOURCES]);
export const COMPANION_SCENARIOS = Object.freeze([
  ["lost-state-retirement-and-replay", 1], ["lost-state-later-attempt-exit-diagnostic", 1],
  ["settled-history-after-device-renumbering", 1], ["stale-decision-and-maintenance-refusal", 0],
  ["foreign-runtime-and-configuration-refusal", 0], ["unknown-bootout-reconciled-before-resume", 1],
  ["unavailable-and-reused-process-witness-refusal", 0], ["interrupted-runtime-retirement", 1],
  ["changed-generation-at-effect-boundary", 0],
]);
export const COMPANION_LIMITATIONS = Object.freeze({
  historical_timeout_cause: "UNKNOWN", original_blocked_operation: "UNKNOWN",
  witnesses_run_before_repair_commit: true, private_home_and_temp_roots: "different_per_execution",
  original_per_run_environment_fingerprint: null, environment_observation: "after_runs_only",
  initial_manager_announcement: "unchanged_unproved",
});
const POLICY_PATHS = new Set([
  ".github/LOCAL_CANONICAL_VERIFICATION.md", "docs/LOCAL_CANONICAL_INPUT_CONTRACT.md",
  "scripts/local-canonical-attempts.mjs", "scripts/local-canonical-companion-timeout-succession.mjs",
  "scripts/local-canonical-receipt.mjs", "scripts/local-canonical-review-export.mjs",
  "scripts/run-local-canonical-verification.mjs", "scripts/run-canonical-test-suite.mjs",
  "scripts/github-main-branch-transport.mjs", "scripts/test-local-canonical-executor.mjs",
  "scripts/test-local-canonical-review-corrections.mjs", "scripts/test-local-canonical-classification.mjs",
  "scripts/fixtures/local-canonical-companion-timeout-succession.mjs",
]);
const capabilities = new WeakMap();
const validatedEvidence = new Map();
const fail = code => { throw Object.assign(new Error(code), { code }); };
const sha = value => typeof value === "string" && /^[0-9a-f]{64}$/u.test(value);
const commit = value => typeof value === "string" && /^[0-9a-f]{40}$/u.test(value);
const exact = (a, b) => digest(a) === digest(b);
const keys = (value, expected) => value && typeof value === "object" && !Array.isArray(value) && exact(Object.keys(value).sort(), [...expected].sort());
const validTime = value => typeof value === "string" && Number.isFinite(Date.parse(value)) && Date.parse(value) <= Date.now();
const json = bytes => { try { return JSON.parse(bytes.toString("utf8")); } catch { fail("companion_timeout_evidence_json_invalid"); } };
const evidenceKey = p => { const value = { ...p }; delete value.local_relative_path; return digest(value); };
export const isCompanionTimeout = p => p?.schema === COMPANION_TIMEOUT_SCHEMA && p.kind === "companion_readiness_timeout";

// Prospective auxiliary-budget normalization only. Product registrations and
// every other byte still compare against the proof's actual accepted-main Git
// source. Historical literals remain valid; no old execution is re-timed.
function normalizeAuxiliarySuiteBudgets(source) {
  const definitions = [
    [null, "local Canonical executor identity and scheduling contract", '"scripts/test-local-canonical-executor.mjs"', false, ["CLOSEOUT_EXECUTION_BUDGETS.executorHarnessMs"]],
    [null, "local Canonical receipt integrity and staleness contract", '"scripts/test-local-canonical-receipt.mjs"', false, ["CLOSEOUT_EXECUTION_BUDGETS.receiptHarnessMs"]],
    ["local-canonical-review-corrections", "shared executable roles, actual Browser consumers and reviewed candidate succession", '"scripts/test-local-canonical-review-corrections.mjs"', true, ["CLOSEOUT_EXECUTION_BUDGETS.reviewHarnessMs", "AUXILIARY_EXECUTION_BUDGETS.reviewHarnessMs"]],
    ["local-canonical-corrected-timeout", "reviewed corrected-timeout succession and terminal allowance", '"scripts/test-local-canonical-review-corrections.mjs", "--corrected-timeout-controls"', true, ["AUXILIARY_EXECUTION_BUDGETS.timeoutHarnessMs"]],
    ["local-canonical-condition-requalification", "prospectively authorized condition requalification and single-use evidence", '"scripts/test-local-canonical-review-corrections.mjs", "--condition-requalification-controls"', true, ["AUXILIARY_EXECUTION_BUDGETS.conditionHarnessMs"]],
    ["local-canonical-guide-correction", "reviewed GuideBrief correction after terminal condition qualification", '"scripts/test-local-canonical-review-corrections.mjs", "--guide-correction-controls"', true, ["AUXILIARY_EXECUTION_BUDGETS.guideHarnessMs"]],
    ["local-canonical-companion-timeout", "prospective Companion readiness timeout succession and terminal allowance", '"scripts/test-local-canonical-review-corrections.mjs", "--companion-timeout-controls"', true, ["AUXILIARY_EXECUTION_BUDGETS.companionHarnessMs"]],
    ["local-canonical-review-child-result", "review child natural completion, bounded diagnostics and intentional cancellation controls", '"scripts/test-local-canonical-review-child-result.mjs"', true, ["AUXILIARY_EXECUTION_BUDGETS.reviewChildResultHarnessMs"]],
  ];
  let normalized = source;
  const bindings = new Set();
  for (const [id, label, args, natural, selectors] of definitions) {
    const row = budget => `    {\n${id ? `      id: "${id}",\n` : ""}      label: "${label}",\n      ...rootNode(${args}),\n      timeoutMs: ${budget},\n${natural ? "      requireNaturalExit: true,\n" : ""}    },\n`;
    let count = 0;
    for (const budget of ["30_000", ...selectors]) {
      const exactRow = row(budget), occurrences = normalized.split(exactRow).length - 1;
      count += occurrences;
      if (occurrences && budget !== "30_000") bindings.add(budget.split(".")[0]);
      normalized = normalized.replaceAll(exactRow, row("30_000"));
    }
    if (count > 1) fail("companion_timeout_unrelated_registration_changed");
  }
  const imports = [
    ['import { CLOSEOUT_EXECUTION_BUDGETS } from "./local-canonical-closeout-budgets.mjs";\n', ["CLOSEOUT_EXECUTION_BUDGETS"]],
    ['import { AUXILIARY_EXECUTION_BUDGETS, CLOSEOUT_EXECUTION_BUDGETS } from "./local-canonical-closeout-budgets.mjs";\n', ["CLOSEOUT_EXECUTION_BUDGETS", "AUXILIARY_EXECUTION_BUDGETS"]],
  ];
  const present = imports.filter(([line]) => source.includes(line));
  if (present.length > 1 || present.some(([line]) => source.split(line).length !== 2) ||
      (bindings.size && (present.length !== 1 || [...bindings].some(name => !present[0][1].includes(name)))) ||
      (present.length && !bindings.size)) fail("companion_timeout_unrelated_registration_changed");
  if (present.length) normalized = normalized.replace(present[0][0], "");
  return normalized;
}

export function companionArtifact(folder, ref, maximum = 512 * 1024) {
  if (!keys(ref, ["artifact", "sha256"]) || typeof ref.artifact !== "string" ||
      !/^[a-z0-9_-]+\.(?:json|mjs|log|py|patch)$/u.test(ref.artifact) || !sha(ref.sha256)) fail("companion_timeout_evidence_reference_invalid");
  const file = path.join(folder, ref.artifact), stat = lstatSync(file);
  if (realpathSync(file) !== file || !stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || stat.size > maximum) fail("companion_timeout_evidence_unsafe");
  const bytes = readFileSync(file);
  if (digest(bytes) !== ref.sha256) fail("companion_timeout_evidence_changed");
  return bytes;
}

export function validateCompanionTimeoutPredecessor(receipt) {
  const r = receipt, copy = { ...r }; delete copy.integrity;
  const input = r.inputs, phases = r.phases;
  if (r.receipt_version !== 4 || r.integrity?.content_fingerprint !== digest(copy) ||
      r.repository?.repository_id !== "hynk-studio/augnes" || r.repository.origin !== "https://github.com/hynk-studio/augnes.git" ||
      r.repository.worktree_before !== "clean" || r.repository.worktree_after !== "clean" || r.repository.detached !== false ||
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
      r.attempt.contract_fingerprint !== input.fingerprint || r.attempt.number !== 1 || r.attempt.recovery || r.attempt.browser_replacement || ["augnes.local-canonical-source-correction.v3", "augnes.local-canonical-source-correction.v4", "augnes.local-canonical-source-correction.v5", "augnes.local-canonical-source-correction.v6", COMPANION_TIMEOUT_SCHEMA].includes(r.attempt.source_correction?.schema) ||
      !r.cleanup?.completed || r.cleanup.remaining_owned_processes !== 0 || r.cleanup.companion_service?.restored !== true ||
      r.cleanup.isolated_resources?.completed !== true || r.cleanup.isolated_resources.failure_count !== 0 || r.cleanup.isolated_resources.failures?.length !== 0 ||
      r.cleanup.generated_next?.present_after === true || r.cleanup.generated_windows_helper?.present_after === true ||
      r.checkout_ownership?.released !== true || r.capacity_ownership?.released !== true ||
      !Array.isArray(phases) || !exact(phases.map(phase => phase.id), BROWSER_REPLACEMENT_PHASES)) fail("companion_timeout_predecessor_ineligible");
  const environments = input.binding.phase_environment_fingerprints;
  if (!Array.isArray(environments) || environments.length !== phases.length || new Set(environments.map(item => item?.id)).size !== environments.length ||
      phases.some(phase => !environments.some(item => item?.id === phase.id && sha(item.fingerprint) &&
        (item.fingerprint === phase.environment_fingerprint || (phase.status === "not_run" && phase.environment_fingerprint == null))))) fail("companion_timeout_predecessor_environment_invalid");
  for (const resource of input.resources) {
    if (!INPUT_CLASSES.includes(resource.classification) || !resource.before || typeof resource.before !== "object" ||
        Array.isArray(resource.before) || typeof resource.before.present !== "boolean" ||
        (resource.readOnlyExecutable && (resource.classification !== "execution" || resource.metadataOnly || resource.excludePreferences)) ||
        (resource.excludePreferences && resource.classification !== "ambient")) fail("companion_timeout_predecessor_input_role_invalid");
    effectiveInputObservation(resource.before, resource, input);
  }
  for (const event of input.events) {
    const resource = input.resources.find(item => item.id === event.resource);
    if (!resource || Object.hasOwn(event, "diagnostic") || event.classification !== resource.classification ||
        !nonFaultInputChange(event.disposition) || classifyInputChange(resource.before, event.after, resource, input) !== event.disposition ||
        event.identity !== digest([event.resource, event.disposition, event.after])) fail("companion_timeout_predecessor_input_fault");
  }
  let failed = false;
  for (const phase of phases) {
    if (failed) {
      if (phase.status !== "not_run" || phase.timed_out !== false || phase.spawn_error_code) fail("companion_timeout_predecessor_unrelated_phase");
      continue;
    }
    if (phase.timed_out !== false || phase.spawn_error_code || !phase.cleanup?.completed ||
        phase.cleanup.remaining_owned_processes !== 0 || !phase.cleanup.exit_observed || !phase.cleanup.streams_closed ||
        phase.cleanup.termination_reason !== "natural_exit") fail("companion_timeout_predecessor_unsettled_phase");
    if (phase.status === "failure" && phase.id === "unit" && phase.exit_status === 1 && phase.failure_code === "phase_failed") failed = true;
    else if (phase.status !== "pass" || phase.exit_status !== 0 || phase.failure_code) fail("companion_timeout_predecessor_unrelated_phase");
  }
  if (!failed || r.final?.result !== "failure" || r.final.exit_status !== 1 ||
      !exact([...(r.final.reason_codes ?? [])].sort(), ["phase_failed", "selected_phases_incomplete"])) fail("companion_timeout_predecessor_ineligible");
  return r;
}


export function validateCompanionNestedTimeout(bytes, original, timeout) {
  if (!keys(timeout, ["phase", "label", "budget_ms", "historical_cause", "original_blocked_operation"]) ||
      timeout.phase !== "unit" || timeout.label !== COMPANION_LABEL || timeout.budget_ms !== 60000 ||
      timeout.historical_cause !== "UNKNOWN" || timeout.original_blocked_operation !== "UNKNOWN") fail("companion_timeout_nested_evidence_invalid");
  const log = original.phases.find(phase => phase.id === "unit")?.log;
  if (log?.truncated !== false || log.bytes !== bytes.length ||
      !/^\.augnes-local-verification\/logs\/[A-Za-z0-9_-]+\/unit\.log$/u.test(log.relative_path ?? "")) fail("companion_timeout_original_log_binding_invalid");
  // The old receipt records path/bytes, not a log hash. This proves the preserved
  // available original matches this new capture; it does not rewrite old evidence.
  const starts = new Map(), results = new Map(), cleanups = new Set();
  let resourceCleanup = 0, selectedActive = false, selectedSettled = false;
  const actions = [];
  for (const line of bytes.toString("utf8").split("\n")) {
    const start = line.match(/^\[canonical:unit\] child_start label=("(?:[^"\\]|\\.)*") timeout_ms=(\d+)$/u);
    if (line.startsWith("[canonical:unit] child_start ") && !start) fail("companion_timeout_nested_inventory_invalid");
    if (start) {
      const label = JSON.parse(start[1]);
      if (starts.has(label) || selectedSettled) fail("companion_timeout_nested_inventory_invalid");
      starts.set(label, Number(start[2]));
      if (label === timeout.label) selectedActive = true;
    }
    if (line.startsWith("[canonical:unit] child_result ")) {
      const match = line.match(/^\[canonical:unit\] child_result label=("(?:[^"\\]|\\.)*") duration_ms=(\d+) exit_code=(null|\d+) signal=(null|SIGTERM|SIGKILL) timed_out=(true|false) exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=(natural_exit|bounded_timeout)$/u);
      if (!match) fail("companion_timeout_nested_unsettled");
      const label = JSON.parse(match[1]), selected = label === timeout.label;
      if (results.has(label) || !starts.has(label) || (selected ?
        match[3] !== "null" || match[4] !== "SIGTERM" || match[5] !== "true" || match[6] !== "bounded_timeout" || Number(match[2]) < timeout.budget_ms :
        match[3] !== "0" || match[4] !== "null" || match[5] !== "false" || match[6] !== "natural_exit")) fail("companion_timeout_nested_unrelated_failure");
      results.set(label, true);
      if (selected) { selectedActive = false; selectedSettled = true; }
    }
    if (line.startsWith("[canonical:unit] child_cleanup_result ")) {
      const match = line.match(/^\[canonical:unit\] child_cleanup_result label=("(?:[^"\\]|\\.)*") elapsed_ms=\d+ reason=(bounded_timeout|post_exit_settlement|post_close_settlement)(?: term_sent=(true|false) kill_sent=(true|false))? streams_closed=true remaining_owned_processes=0$/u);
      if (!match) fail("companion_timeout_nested_unsettled");
      const label = JSON.parse(match[1]);
      if (cleanups.has(label) || !starts.has(label) || (label === timeout.label ? match[2] !== "bounded_timeout" || match[3] !== undefined :
        match[2] === "bounded_timeout" || match[3] === undefined)) fail("companion_timeout_nested_unsettled");
      cleanups.add(label);
    }
    if (line.startsWith("{")) {
      let record; try { record = JSON.parse(line); } catch { continue; }
      if (selectedActive && Object.hasOwn(record, "scenario")) actions.push(record);
      if (record.suite === "unit" && Object.hasOwn(record, "resource_cleanup")) {
        if (!Array.isArray(record.resource_cleanup) || !record.resource_cleanup.length || record.resource_cleanup.some(item =>
          item.completed !== true || item.failure_count !== 0 || item.failures?.length !== 0)) fail("companion_timeout_nested_resource_unsettled");
        resourceCleanup++;
      }
    }
  }
  if (starts.size !== results.size || starts.size !== cleanups.size || !results.has(timeout.label) || starts.get(timeout.label) !== timeout.budget_ms ||
      resourceCleanup !== 1 || !exact(actions, COMPANION_SCENARIOS.slice(0, 8).map(([scenario, effects]) => ({ scenario, pass: true, effects })))) fail("companion_timeout_nested_inventory_invalid");
}

const DIAGNOSTIC_LABEL = "Companion ownership retirement nondeciding diagnostic";
const RESULT_KEYS = ["label", "exit_code", "signal", "timed_out", "cancelled", "duration_ms", "spawn_error_code", "exit_observed", "streams_closed", "cleanup_started", "cleanup_completed", "remaining_owned_processes", "termination_reason"];
const records = bytes => bytes.toString("utf8").split("\n").filter(line => line.startsWith("{")).flatMap(line => {
  try { return [JSON.parse(line)]; } catch { return []; }
});
const one = (values, code) => { if (values.length !== 1) fail(code); return values[0]; };
const cleanResources = rows => Array.isArray(rows) && rows.length > 0 && rows.every(row =>
  typeof row.root === "string" && path.isAbsolute(row.root) && row.completed === true && row.failure_count === 0 && Array.isArray(row.failures) && row.failures.length === 0);

// These pure readers are shared by the production evidence gate and explicitly
// synthetic controls. They do not start a child or create an admission record.
export function validateCompanionRunEvidence(log, settlement, expectedExit) {
  const s = settlement, r = s?.result;
  if (!keys(s, ["nondeciding", "started_at", "finished_at", "node", "source", "cwd", "resource", "timeout_ms", "require_natural_exit", "result", "acceptance", "cleanup"]) ||
      s.nondeciding !== true || !validTime(s.started_at) || !validTime(s.finished_at) || s.node !== "v24.22.1" ||
      s.timeout_ms !== 60000 || s.require_natural_exit !== true || typeof s.source !== "string" || !path.isAbsolute(s.source) ||
      !keys(s.resource, ["root", "device", "inode"]) || !path.isAbsolute(s.resource.root) || s.cwd !== path.join(s.resource.root, "source") ||
      ![s.resource.device, s.resource.inode].every(value => typeof value === "string" && /^\d+$/u.test(value)) ||
      !keys(r, RESULT_KEYS) || r.label !== DIAGNOSTIC_LABEL || r.exit_code !== expectedExit || r.signal !== null || r.timed_out !== false ||
      r.cancelled !== false || r.spawn_error_code !== null || r.exit_observed !== true || r.streams_closed !== true ||
      r.cleanup_started !== true || r.cleanup_completed !== true || r.remaining_owned_processes !== 0 || r.termination_reason !== "natural_exit" ||
      !Number.isSafeInteger(r.duration_ms) || r.duration_ms < 0 || r.duration_ms >= 60000 ||
      Date.parse(s.finished_at) - Date.parse(s.started_at) < r.duration_ms ||
      s.acceptance !== (expectedExit === 0 ? null : "canonical_child_failed") || !cleanResources(s.cleanup) ||
      s.cleanup.length !== 1 || s.cleanup[0].root !== s.resource.root) fail("companion_timeout_run_unsettled");
  const rows = records(log), summary = one(rows.filter(row => Object.hasOwn(row, "result") && Object.hasOwn(row, "cleanup")), "companion_timeout_run_inventory_invalid");
  if (!exact(summary, { result: r, acceptance: s.acceptance, cleanup: s.cleanup })) fail("companion_timeout_run_log_mismatch");
  const lines = log.toString("utf8").split("\n"), label = JSON.stringify(DIAGNOSTIC_LABEL);
  const start = one(lines.filter(line => line.startsWith("[canonical:diagnostic] child_start ")), "companion_timeout_run_inventory_invalid");
  const result = one(lines.filter(line => line.startsWith("[canonical:diagnostic] child_result ")), "companion_timeout_run_inventory_invalid");
  if (start !== `[canonical:diagnostic] child_start label=${label} timeout_ms=60000` ||
      result !== `[canonical:diagnostic] child_result label=${label} duration_ms=${r.duration_ms} exit_code=${expectedExit} signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit` ||
      !lines.some(line => line.startsWith(`[canonical:diagnostic] child_exit label=${label} `) && line.endsWith(` exit_code=${expectedExit} signal=null stdout_closed=true stderr_closed=true`)) ||
      !lines.some(line => line.startsWith(`[canonical:diagnostic] child_cleanup_result label=${label} `) && line.endsWith(" reason=post_exit_settlement term_sent=false kill_sent=false streams_closed=true remaining_owned_processes=0"))) fail("companion_timeout_run_log_mismatch");
  return rows;
}

function derivedFixtureHash(source) {
  const marker = 'await run("lost-state-retirement-and-replay",', text = source.toString("utf8");
  if (text.split(marker).length !== 2) fail("companion_timeout_fixture_source_invalid");
  return digest(text.slice(0, text.indexOf(marker)) + "\nexport { fixture };\n");
}

export function validateCompanionRegression(rows, source, before) {
  const w = one(rows.filter(row => Object.hasOwn(row, "regression")), "companion_timeout_regression_inventory_invalid");
  if (w.regression !== "bridge-exit-before-readiness-settles-fixture" || w.source_sha256 !== digest(source) ||
      w.derived_sha256 !== derivedFixtureHash(source) || !exact(w.fault, { role: "bridge", exit: { code: 23, signal: null }, closed: true }) ||
      !exact(w.witness_cleanup, { owned_remaining: 0, roots_remaining: [] }) || !Array.isArray(w.observations) || w.observations.length !== 2 ||
      !exact(w.observations.map(({ elapsed_ms, ...row }) => row), [
        { event: "exit", role: "bridge", code: 23, signal: null }, { event: "exit", role: "ui", code: null, signal: "SIGTERM" },
      ]) || !w.observations.every(row => Number.isFinite(row.elapsed_ms) && row.elapsed_ms >= 0 && row.elapsed_ms < 60000) ||
      w.observations[0].elapsed_ms > w.observations[1].elapsed_ms) fail("companion_timeout_regression_invalid");
  if (before ?
    !exact(w.setup_outcome, { kind: "pending" }) || w.passed !== false || typeof w.assertion !== "string" ||
      !w.assertion.startsWith("fixture readiness remains pending after owned bridge exit/close") ||
      !keys(w.fixture_cleanup, ["owned_remaining", "roots_remaining"]) || w.fixture_cleanup.owned_remaining !== 1 ||
      !Array.isArray(w.fixture_cleanup.roots_remaining) || w.fixture_cleanup.roots_remaining.length !== 1 || !path.isAbsolute(w.fixture_cleanup.roots_remaining[0]) :
    !exact(w.setup_outcome, { kind: "rejected", code: "fixture_readiness_exited", message: "fixture child exited before readiness: bridge-ready" }) ||
      w.passed !== true || w.assertion !== null || !exact(w.fixture_cleanup, { owned_remaining: 0, roots_remaining: [] })) fail("companion_timeout_regression_invalid");
  return w;
}

export function validateCompanionFocused(rows, log) {
  if (!exact(rows.filter(row => Object.hasOwn(row, "scenario")), COMPANION_SCENARIOS.map(([scenario, effects]) => ({ scenario, pass: true, effects }))) ||
      !exact(rows.filter(row => Object.hasOwn(row, "adverse")), ["ui", "bridge", "manager-conflict"].map(adverse => ({ adverse, pass: true, cleanup_complete: true }))) ||
      log.toString("utf8").split("\n").filter(line => line === "PASS ownership retirement: authenticated loopback witnesses, exact refusal, reconciliation, replay and zero residue").length !== 1)
    fail("companion_timeout_focused_coverage_invalid");
}

// Compute scope from the original admitted base, never from a later merge-base
// or just the surviving PR diff. A reverted-to-base path and a deleted accepted
// addition must still be checked. Missing entries and file modes are evidence.
export function inspectCompanionSourceScope(repositoryRoot, { acceptedBase, repairHead, base, head }) {
  if (![acceptedBase, repairHead, base, head].every(commit)) fail("companion_timeout_source_scope_invalid");
  const git = args => execFileSync("git", args, { cwd: repositoryRoot, timeout: 10000, maxBuffer: 16 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
  for (const [a, b] of [[acceptedBase, repairHead], [acceptedBase, base], [repairHead, head], [base, head]]) git(["merge-base", "--is-ancestor", a, b]);
  const changed = (a, b) => git(["diff", "--no-renames", "--name-only", "-z", a, b, "--"]).toString().split("\0").filter(Boolean).sort();
  const trees = new Map(), blobs = new Map();
  const tree = ref => {
    if (!trees.has(ref)) {
      const entries = new Map();
      for (const line of git(["ls-tree", "-rz", "--full-tree", ref]).toString().split("\0").filter(Boolean)) {
        const match = line.match(/^(\d{6}) (blob|commit) ([a-f0-9]{40})\t([^]+)$/u);
        if (!match || entries.has(match[4])) fail("companion_timeout_source_tree_invalid");
        entries.set(match[4], { mode: match[1], type: match[2], object: match[3] });
      }
      trees.set(ref, entries);
    }
    return trees.get(ref);
  };
  const state = (ref, name) => {
    const entry = tree(ref).get(name);
    if (!entry) return { present: false };
    return { present: true, ...entry, sha256: entry.type === "blob" ? blobs.get(entry.object) : null };
  };
  const acceptedPaths = changed(acceptedBase, repairHead), candidatePaths = changed(base, head), mainPaths = changed(acceptedBase, base);
  // Inspect each required immutable blob once in one bounded Git process.
  // Per-blob subprocess creation was redundant observer cost, particularly for
  // complete accepted-main inventories; this retains every byte/mode/absence.
  const wanted = new Set();
  for (const [ref, names] of [[repairHead, acceptedPaths], [head, [...acceptedPaths, ...mainPaths]], [base, mainPaths]]) {
    for (const name of names) {
      const entry = tree(ref).get(name);
      if (entry?.type === "blob") wanted.add(entry.object);
    }
  }
  if (wanted.size) {
    const batch = execFileSync("git", ["cat-file", "--batch"], { cwd: repositoryRoot, input: [...wanted].join("\n") + "\n",
      timeout: 10000, maxBuffer: 16 * 1024 * 1024, stdio: ["pipe", "pipe", "pipe"] });
    let offset = 0;
    for (const object of wanted) {
      const end = batch.indexOf(10, offset), match = end < 0 ? null : batch.subarray(offset, end).toString().match(/^([a-f0-9]{40}) blob (\d+)$/u);
      if (!match || match[1] !== object) fail("companion_timeout_source_blob_invalid");
      const size = Number(match[2]); offset = end + 1;
      if (!Number.isSafeInteger(size) || size < 0 || offset + size >= batch.length || batch[offset + size] !== 10) fail("companion_timeout_source_blob_invalid");
      blobs.set(object, digest(batch.subarray(offset, offset + size))); offset += size + 1;
    }
    if (offset !== batch.length) fail("companion_timeout_source_blob_invalid");
  }
  const accepted = new Set(acceptedPaths), acceptedInventory = acceptedPaths.filter(name => !POLICY_PATHS.has(name))
    .map(name => ({ path: name, accepted: state(repairHead, name), candidate: state(head, name) }));
  const reconciliation = mainPaths.map(name => {
    const current = state(base, name), candidate = state(head, name);
    const rule = POLICY_PATHS.has(name) ? "bounded_policy_owner" : accepted.has(name) ? "main_matches_accepted_task" : "preserve_accepted_main";
    return { path: name, rule, accepted_main: current, candidate };
  });
  return { schema: COMPANION_SOURCE_SCOPE_SCHEMA, basis: "accepted_task_and_current_main_union", accepted_base: acceptedBase,
    accepted_head: repairHead, current_main: base, accepted_task_paths: acceptedPaths, candidate_delta_paths: candidatePaths,
    accepted_task: acceptedInventory, main_reconciliation: reconciliation, policy_delta_paths: candidatePaths.filter(name => POLICY_PATHS.has(name)) };
}

export function validateCompanionSourceScope(scope) {
  const accepted = new Set(scope.accepted_task_paths), acceptedEntries = new Map(scope.accepted_task.map(row => [row.path, row]));
  for (const name of [...new Set([...scope.accepted_task_paths, ...scope.candidate_delta_paths])]) {
    if (POLICY_PATHS.has(name)) continue;
    if (!accepted.has(name)) fail("companion_timeout_unrelated_candidate_delta");
    const row = acceptedEntries.get(name);
    if (!row || !exact(row.accepted, row.candidate)) fail("companion_timeout_accepted_task_changed");
  }
  for (const row of scope.main_reconciliation) {
    if (row.rule === "main_matches_accepted_task" && !exact(row.accepted_main, acceptedEntries.get(row.path)?.accepted)) fail("companion_timeout_accepted_main_overlap_requires_review");
    if (row.rule !== "bounded_policy_owner" && !exact(row.accepted_main, row.candidate)) fail("companion_timeout_accepted_main_changed");
  }
  for (const state of [...scope.accepted_task.flatMap(row => [row.accepted, row.candidate]), ...scope.main_reconciliation.flatMap(row => [row.accepted_main, row.candidate])]) {
    if (state.present && (state.type !== "blob" || !["100644", "100755"].includes(state.mode) || !sha(state.sha256))) fail("companion_timeout_source_type_invalid");
  }
  return scope;
}

export function readCompanionTimeoutEvidence(file, p, repositoryRoot) {
  const allowed = ["schema", "kind", "defect", "branch", "base", "head", "tree", "prior_family_id", "prior_number", "prior_attempt_id", "prior_receipt_fingerprint", "source_module", "originals", "repair", "delta_sha256", "changed_paths", "retained_sources", "evidence", "authorization", "pull_request", "budget", "timeout", "final_delta", "limitations", "source_scope"];
  const stored = { ...p }; delete stored.local_relative_path;
  if (!keys(stored, allowed) || !isCompanionTimeout(p) || p.defect !== COMPANION_DEFECT || p.source_module !== COMPANION_MODULE ||
      ![p.base, p.head, p.tree, p.repair?.head, p.repair?.tree].every(commit) ||
      !keys(p.repair, ["head", "tree", "delta_sha256", "changed_paths", "review", "accepted_review"]) || !keys(p.repair.review, ["id", "sha256"]) ||
      !Number.isSafeInteger(p.repair.review.id) || p.repair.review.id <= 0 || !sha(p.repair.review.sha256) ||
      !keys(p.repair.accepted_review, ["reviewed_at", "source_url", "block_id", "block_sha256"]) || !validTime(p.repair.accepted_review.reviewed_at) ||
      !/^https:\/\/chatgpt\.com\/space\/page_[a-f0-9]{32}$/u.test(p.repair.accepted_review.source_url) ||
      !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/u.test(p.repair.accepted_review.block_id) || !sha(p.repair.accepted_review.block_sha256) ||
      !keys(p.originals, ["receipt", "attempt", "completion", "unit_log"]) || !exact(p.budget, { initial: 1, recovery: 0 }) ||
      !Number.isSafeInteger(p.pull_request) || p.pull_request <= 0 || p.prior_number !== 1 || !keys(p.retained_sources, COMPANION_RETAINED_SOURCES) ||
      !Object.values(p.retained_sources).every(sha) || !keys(p.final_delta, ["basis", "delta_sha256", "changed_paths"]) ||
      p.final_delta.basis !== "implementation_owner_not_independent_review" || !exact(p.limitations, COMPANION_LIMITATIONS)) fail("companion_timeout_proof_invalid");
  const folder = path.dirname(file), artifact = ref => companionArtifact(folder, ref),
    original = validateCompanionTimeoutPredecessor(json(artifact(p.originals.receipt))),
    prior = json(artifact(p.originals.attempt)), completion = json(artifact(p.originals.completion));
  if (!exact(original.attempt, prior) || prior.family_id !== p.prior_family_id || prior.number !== p.prior_number || prior.branch !== p.branch ||
      prior.attempt_id !== p.prior_attempt_id || original.integrity.content_fingerprint !== p.prior_receipt_fingerprint ||
      completion.contract !== prior.contract || completion.attempt_id !== prior.attempt_id || completion.receipt_fingerprint !== p.prior_receipt_fingerprint ||
      completion.disposition !== "product_failure" || completion.cleanup_complete !== true || !validTime(completion.finished_at) ||
      p.head === prior.head || p.tree === prior.tree || p.repair.head === prior.head || p.repair.tree === prior.tree) fail("companion_timeout_original_binding_invalid");
  const unitLog = companionArtifact(folder, p.originals.unit_log, 2 * 1024 * 1024);
  validateCompanionNestedTimeout(unitLog, original, p.timeout);
  const originalLog = path.join(repositoryRoot, original.phases.find(phase => phase.id === "unit").log.relative_path), stat = lstatSync(originalLog);
  if (realpathSync(originalLog) !== originalLog || !stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 ||
      stat.size !== unitLog.length || digest(readFileSync(originalLog)) !== p.originals.unit_log.sha256) fail("companion_timeout_original_log_changed");
  const git = args => execFileSync("git", args, { cwd: repositoryRoot, timeout: 10000, maxBuffer: 16 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
  const paths = (a, b) => git(["diff", "--name-only", a, b, "--"]).toString().trim().split("\n").filter(Boolean).sort();
  const delta = (a, b) => digest(git(["diff", "--binary", "--full-index", "--no-ext-diff", "--no-textconv", a, b, "--"]));
  const source = (head, name) => git(["show", `${head}:${name}`]);
  for (const [a, b] of [[prior.head, p.repair.head], [p.repair.head, p.head], [p.base, p.head]]) git(["merge-base", "--is-ancestor", a, b]);
  for (const target of [p, p.repair]) {
    if (git(["rev-parse", `${target.head}^{tree}`]).toString().trim() !== target.tree ||
        delta(prior.head, target.head) !== target.delta_sha256 || !exact(paths(prior.head, target.head), target.changed_paths)) fail("companion_timeout_source_binding_invalid");
  }
  if (!exact(p.repair.changed_paths, [COMPANION_MODULE]) || delta(p.repair.head, p.head) !== p.final_delta.delta_sha256 ||
      !exact(paths(p.repair.head, p.head), p.final_delta.changed_paths)) fail("companion_timeout_final_delta_invalid");
  const sourceScope = inspectCompanionSourceScope(repositoryRoot, { acceptedBase: original.repository.base_sha, repairHead: p.repair.head, base: p.base, head: p.head });
  validateCompanionSourceScope(sourceScope);
  if (!exact(p.source_scope, sourceScope)) fail("companion_timeout_source_scope_inventory_invalid");
  for (const [name, hash] of Object.entries(p.retained_sources)) {
    if (digest(source(p.repair.head, name)) !== hash || digest(source(p.head, name)) !== hash ||
        name !== COMPANION_MODULE && digest(source(prior.head, name)) !== hash) fail("companion_timeout_reviewed_repair_changed");
  }
  const beforeSource = source(prior.head, COMPANION_MODULE), afterSource = source(p.repair.head, COMPANION_MODULE);
  if (digest(beforeSource) !== COMPANION_SOURCE_HASHES.before || digest(afterSource) !== COMPANION_SOURCE_HASHES.after) fail("companion_timeout_repair_profile_invalid");
  const registration = head => {
    const matches = [...source(head, "scripts/run-canonical-test-suite.mjs").toString().matchAll(/\{\s*label:\s*"Companion lost-ownership retirement and reconciliation regressions",\s*\.\.\.rootNode\("scripts\/test-companion-ownership-retirement\.mjs"\),\s*timeoutMs:\s*60_000,\s*requireNaturalExit:\s*true,\s*\}/gu)];
    if (matches.length !== 1) fail("companion_timeout_registration_invalid");
    return matches[0][0];
  };
  if ([p.repair.head, p.base, p.head].some(head => registration(prior.head) !== registration(head))) fail("companion_timeout_workload_changed");
  // Only the closed auxiliary budget selectors above may differ. Commands,
  // acceptance, product bounds and unrelated accepted-main bytes remain exact.
  const controlRow = '    {\n      id: "local-canonical-companion-timeout",\n      label: "prospective Companion readiness timeout succession and terminal allowance",\n      ...rootNode("scripts/test-local-canonical-review-corrections.mjs", "--companion-timeout-controls"),\n      timeoutMs: 30_000,\n      requireNaturalExit: true,\n    },\n';
  const acceptedSuite = normalizeAuxiliarySuiteBudgets(source(p.base, "scripts/run-canonical-test-suite.mjs").toString()),
    finalSuite = normalizeAuxiliarySuiteBudgets(source(p.head, "scripts/run-canonical-test-suite.mjs").toString());
  if (finalSuite !== acceptedSuite && (finalSuite.split(controlRow).length !== 2 || finalSuite.replace(controlRow, "") !== acceptedSuite)) fail("companion_timeout_unrelated_registration_changed");
  const e = p.evidence;
  if (!keys(e, ["fixture", "launcher", "before", "after", "focused", "owners", "environment_observation", "execution_inventory", "cleanup"]) ||
      !keys(e.before, ["source", "log", "settlement"]) || !keys(e.after, ["source", "log", "settlement"]) ||
      !keys(e.focused, ["log", "settlement"]) || !keys(e.owners, COMPANION_OWNER_SOURCES)) fail("companion_timeout_evidence_inventory_invalid");
  artifact(e.fixture); artifact(e.launcher);
  if (digest(artifact(e.before.source)) !== digest(beforeSource) || digest(artifact(e.after.source)) !== digest(afterSource)) fail("companion_timeout_source_snapshot_invalid");
  for (const name of COMPANION_OWNER_SOURCES) if (digest(artifact(e.owners[name])) !== p.retained_sources[name]) fail("companion_timeout_owner_snapshot_invalid");
  const runs = {};
  for (const [name, expected] of [["before", 1], ["after", 0], ["focused", 0]]) {
    const log = artifact(e[name].log), settlement = json(artifact(e[name].settlement));
    const rows = validateCompanionRunEvidence(log, settlement, expected);
    if (Date.parse(settlement.started_at) <= Date.parse(completion.finished_at)) fail("companion_timeout_witness_predates_settlement");
    if (name === "focused") validateCompanionFocused(rows, log);
    else validateCompanionRegression(rows, name === "before" ? beforeSource : afterSource, name === "before");
    runs[name] = settlement;
  }
  const repairCommitTime = Date.parse(git(["show", "-s", "--format=%cI", p.repair.head]).toString().trim());
  if (!Number.isFinite(repairCommitTime) || ["before", "after", "focused"].some(name => Date.parse(runs[name].finished_at) >= repairCommitTime) ||
      Date.parse(runs.before.finished_at) >= Date.parse(runs.after.started_at) || Date.parse(runs.after.finished_at) >= Date.parse(runs.focused.started_at) ||
      new Set(Object.values(runs).map(run => run.resource.root)).size !== 3 || runs.after.source !== runs.focused.source || runs.before.source === runs.after.source ||
      Date.parse(p.repair.accepted_review.reviewed_at) < repairCommitTime || Date.parse(p.repair.accepted_review.reviewed_at) <= Date.parse(runs.focused.finished_at))
    fail("companion_timeout_evidence_chronology_invalid");
  const environment = json(artifact(e.environment_observation)), inventory = json(artifact(e.execution_inventory)), cleanup = json(artifact(e.cleanup));
  if (!keys(environment, ["recorded_after_runs", "observed_at", "node", "npm", "node_realpath", "node_sha256", "platform", "architecture", "environment_owner", "credentials_forwarded", "private_homes_and_temp_roots", "limits"]) ||
      environment.recorded_after_runs !== true || !validTime(environment.observed_at) || Date.parse(environment.observed_at) < Date.parse(runs.focused.finished_at) ||
      environment.node !== "v24.22.1" || environment.npm !== "11.16.0" || !sha(environment.node_sha256) ||
      typeof environment.node_realpath !== "string" || !path.isAbsolute(environment.node_realpath) || environment.credentials_forwarded !== false ||
      environment.environment_owner !== "scripts/canonical-test-environment.mjs buildCanonicalChildEnvironment" ||
      environment.private_homes_and_temp_roots !== "different per execution; recorded in settlements" ||
      typeof environment.limits !== "string" || !environment.limits.includes("No retrospectively invented original environment fingerprint") ||
      Object.hasOwn(environment, "environment_fingerprint")) fail("companion_timeout_environment_claim_invalid");
  if (!Array.isArray(inventory)) fail("companion_timeout_execution_inventory_invalid");
  for (const [name, runName] of [["before", "readiness-prior"], ["after", "readiness-final"], ["focused", "focused-final"]]) {
    const run = runs[name], row = one(inventory.filter(value => value.name === runName), "companion_timeout_execution_inventory_invalid");
    if (row.started_at !== run.started_at || row.finished_at !== run.finished_at || row.source !== run.source ||
        !exact(row.result, run.result) || !exact(row.resource_cleanup, run.cleanup) || typeof row.command !== "string" || !row.command.includes("observer/run-child.mjs") ||
        !row.command.includes(run.source) || name !== "focused" && !row.command.includes("scripts/readiness-regression.mjs")) fail("companion_timeout_execution_inventory_invalid");
  }
  if (!validTime(cleanup.recorded_at) || Date.parse(cleanup.recorded_at) < Date.parse(runs.focused.finished_at) || cleanup.all_settled !== true ||
      !Array.isArray(cleanup.changed) || cleanup.changed.length || !Array.isArray(cleanup.missing) || cleanup.missing.length ||
      !Array.isArray(cleanup.remaining_run_roots) || cleanup.remaining_run_roots.length || !Array.isArray(cleanup.matching_owned_processes) || cleanup.matching_owned_processes.length ||
      !Array.isArray(cleanup.run_roots) || Object.values(runs).some(run => !cleanup.run_roots.includes(run.resource.root)) ||
      cleanup.companion?.before_after_identical !== true || cleanup.companion.status !== "installed_stopped" || cleanup.companion.state?.checkout_relation !== "exact" ||
      cleanup.new_qualification_invocations !== 0 || cleanup.new_successor_reservations !== 0 || cleanup.new_deciding_attempts !== 0) fail("companion_timeout_preservation_invalid");
  const finalCommitTime = Date.parse(git(["show", "-s", "--format=%cI", p.head]).toString().trim());
  if (!Number.isFinite(finalCommitTime)) fail("companion_timeout_final_commit_time_invalid");
  validatedEvidence.set(evidenceKey(p), { repairCommitTime, finalCommitTime, lastEvidenceTime: Date.parse(runs.focused.finished_at) });
  return { original, prior, completion, runs, environment, cleanup };
}

export function companionAuthorityObservation(record, role) {
  return { id: record.id, author: record.user?.login, author_id: record.user?.id, body_sha256: digest(record.body),
    timestamp: record.updated_at ?? record.submitted_at, role, commit_id: role === "execution_grant" ? null : record.commit_id };
}

export function companionAuthorityBinding(p) {
  const evidence = { ...p }; delete evidence.authorization; delete evidence.local_relative_path;
  return { schema: COMPANION_AUTH_SCHEMA, evidence_fingerprint: digest(evidence), base: p.base, head: p.head, tree: p.tree,
    original_family: p.prior_family_id, original_attempt: p.prior_attempt_id, original_receipt: p.prior_receipt_fingerprint,
    accepted_repair_head: p.repair.head, source_module: COMPANION_MODULE, defect: COMPANION_DEFECT,
    source_scope_fingerprint: digest(p.source_scope), independent_final_policy_review_required: true,
    historical_cause: "UNKNOWN", workload: "full-canonical", separate_stock: true, budget: { initial: 1, recovery: 0 } };
}

const reviewRef = value => keys(value, ["id", "sha256"]) && Number.isSafeInteger(value.id) && value.id > 0 && sha(value.sha256);
// Preparation helpers return reviewable prose only. They neither fabricate
// records nor authenticate anything. In particular the first two work before
// any remote record exists; the grant requires both actual returned references.
export function companionAcceptedReviewRequirements(p) {
  return [
    `Reviewed head \`${p.repair.head}\`, tree \`${p.repair.tree}\``,
    "This review accepts the one-file Companion ownership-retirement fixture correction and its bounded development evidence.",
    `Source module \`${COMPANION_MODULE}\`, defect \`${COMPANION_DEFECT}\`, source SHA-256 \`${COMPANION_SOURCE_HASHES.after}\`.`,
    `Retained fixture SHA-256 \`${p.evidence.fixture.sha256}\`; launcher SHA-256 \`${p.evidence.launcher.sha256}\`.`,
    `Retained diagnostic evidence fingerprint \`${digest(p.evidence)}\`.`,
    `Actual source review completed at \`${p.repair.accepted_review.reviewed_at}\`; source ${p.repair.accepted_review.source_url}; block \`${p.repair.accepted_review.block_id}\`; block SHA-256 \`${p.repair.accepted_review.block_sha256}\`.`,
    "This GitHub record attests that existing review; its submission time does not replace the actual review time, and the Page is not an execution grant.",
    "The historical timeout cause and original blocked operation remain UNKNOWN.",
    "Initial manager supervisor announcement remains unchanged and unproved.",
  ];
}
export function companionPolicyReviewRequirements(p) {
  return [
    "## Independent final Companion policy review",
    `Reviewed final base \`${p.base}\`, head \`${p.head}\`, tree \`${p.tree}\`.`,
    `Accepted repair \`${p.repair.head}\` / tree \`${p.repair.tree}\`; actual accepted source review \`${p.repair.accepted_review.reviewed_at}\` at ${p.repair.accepted_review.source_url}, block SHA-256 \`${p.repair.accepted_review.block_sha256}\`.`,
    `Original-to-final native delta SHA-256 \`${p.delta_sha256}\`; accepted repair delta SHA-256 \`${p.repair.delta_sha256}\`; repair-to-final native delta SHA-256 \`${p.final_delta.delta_sha256}\`.`,
    `Accepted-task and current-main source-scope fingerprint \`${digest(p.source_scope)}\`.`,
    `Retained diagnostic evidence fingerprint \`${digest(p.evidence)}\`; original retained evidence fingerprint \`${digest(p.originals)}\`.`,
    `The Companion schema is \`${COMPANION_TIMEOUT_SCHEMA}\`; condition v5 and GuideBrief v6 remain separate and unchanged.`,
    "This independent review accepts this exact final policy source and its bounded accepted-main reconciliation; implementation-owner verification is not this review.",
    "The historical timeout cause remains UNKNOWN. This review does not grant merge, adoption or an additional deciding allowance.",
  ];
}
export function companionExecutionGrantRequirements(p) {
  if (!reviewRef(p.repair?.review) || !Number.isSafeInteger(p.authorization?.policy_review_id) || p.authorization.policy_review_id <= 0 ||
      !sha(p.authorization.policy_review_sha256)) fail("companion_timeout_review_references_required");
  return [
    "## User-authorized Companion timeout succession — policy implementation and one qualification",
    `https://github.com/hynk-studio/augnes/pull/${p.pull_request}#pullrequestreview-${p.repair.review.id}`,
    `Accepted repair authenticated review fingerprint \`${p.repair.review.sha256}\`.`,
    `https://github.com/hynk-studio/augnes/pull/${p.pull_request}#pullrequestreview-${p.authorization.policy_review_id}`,
    `Final policy authenticated review fingerprint \`${p.authorization.policy_review_sha256}\`; final base \`${p.base}\`, head \`${p.head}\`, tree \`${p.tree}\`.`,
    `Original family \`${p.prior_family_id}\`, attempt \`${p.prior_attempt_id}\` number \`${p.prior_number}\`, receipt \`${p.prior_receipt_fingerprint}\`.`,
    `Original retained evidence fingerprint \`${digest(p.originals)}\`.`,
    `Accepted repair \`${p.repair.head}\` / tree \`${p.repair.tree}\`.`,
    `Source module \`${COMPANION_MODULE}\`; defect \`${COMPANION_DEFECT}\`.`,
    "The prospective scope is the minimal Companion timeout policy implementation, one normal admitted Full, separate stock validation, cleanup and one consolidated return.",
    "One Full and zero recovery/retry; no renewal per commit, worktree, proof, copied grant or accepted-main merge.",
    "Bind the actual final head, tree, native delta and all policy/integration changes; implementation-owner checks are not independent final-source review.",
    "The exact final policy review is required before execution; this grant creates no new allowance beyond the original single-use predecessor edge.",
    "Preserve the original product_failure, nested timeout and historical cause UNKNOWN.",
  ];
}
export function companionAuthorityRequirements(p) {
  return { review: companionAcceptedReviewRequirements(p), policy_review: companionPolicyReviewRequirements(p), grant: companionExecutionGrantRequirements(p) };
}

export async function authorizeCompanionTimeout(p, { transport = createGitHubObserverAuthorizationTransport(p.pull_request) } = {}) {
  const refs = p?.authorization, evidence = validatedEvidence.get(evidenceKey(p));
  if (!isCompanionTimeout(p) || !keys(refs, ["policy_review_id", "policy_review_sha256", "grant_comment_id", "grant_sha256"]) ||
      !Number.isSafeInteger(refs.grant_comment_id) || refs.grant_comment_id <= 0 || !sha(refs.grant_sha256) ||
      !Number.isSafeInteger(refs.policy_review_id) || refs.policy_review_id <= 0 || !sha(refs.policy_review_sha256) || refs.policy_review_id === p.repair.review.id)
    fail("companion_timeout_authority_missing");
  if (!evidence) fail("companion_timeout_validated_evidence_required");
  const repair = await transport.review(p.repair.review.id), policy = await transport.review(refs.policy_review_id),
    grant = await transport.grant(refs.grant_comment_id), observations = {};
  for (const [record, role, ref] of [[repair, "accepted_repair", p.repair.review],
    [policy, "final_policy_review", { id: refs.policy_review_id, sha256: refs.policy_review_sha256 }],
    [grant, "execution_grant", { id: refs.grant_comment_id, sha256: refs.grant_sha256 }]]) {
    if (record?.id !== ref.id || record.user?.type !== "User" || !Number.isSafeInteger(record.user?.id) || record.user.id <= 0 ||
        typeof record.user?.login !== "string" || !/^[A-Za-z0-9-]{1,39}$/u.test(record.user.login) || !["OWNER", "MEMBER", "COLLABORATOR"].includes(record.author_association) ||
        typeof record.body !== "string" || Buffer.byteLength(record.body) > 64 * 1024) fail("companion_timeout_authority_identity_invalid");
    if (role !== "execution_grant" ?
      record.pull_request_url !== `https://api.github.com/repos/hynk-studio/augnes/pulls/${p.pull_request}` || !["COMMENTED", "APPROVED"].includes(record.state) || record.commit_id !== (role === "accepted_repair" ? p.repair.head : p.head) :
      record.issue_url !== `https://api.github.com/repos/hynk-studio/augnes/issues/${p.pull_request}`) fail("companion_timeout_authority_source_invalid");
    const observation = companionAuthorityObservation(record, role);
    if (!validTime(observation.timestamp) || digest(observation) !== ref.sha256) fail("companion_timeout_authority_changed");
    const permission = await transport.permission(record.user.login);
    if (permission.user?.login !== record.user.login || !["admin", "maintain"].includes(permission.permission)) fail("companion_timeout_authority_permission_invalid");
    observations[role] = observation;
  }
  const requirements = companionAuthorityRequirements(p);
  if (requirements.review.some(sentence => !repair.body.includes(sentence))) fail("companion_timeout_review_scope_invalid");
  if (requirements.policy_review.some(sentence => !policy.body.includes(sentence))) fail("companion_timeout_policy_review_scope_invalid");
  if (requirements.grant.some(sentence => !grant.body.includes(sentence))) fail("companion_timeout_authority_scope_invalid");
  const reviewed = Date.parse(observations.accepted_repair.timestamp), policyReviewed = Date.parse(observations.final_policy_review.timestamp), granted = Date.parse(observations.execution_grant.timestamp);
  if (reviewed < evidence.repairCommitTime || reviewed <= evidence.lastEvidenceTime || reviewed < Date.parse(p.repair.accepted_review.reviewed_at) ||
      policyReviewed < reviewed || policyReviewed < evidence.finalCommitTime || granted < policyReviewed) fail("companion_timeout_authority_order_invalid");
  const capability = Object.freeze({ observations });
  capabilities.set(capability, { proof: digest(p), observations: digest(observations), evidence: evidenceKey(p) });
  return capability;
}

export function assertCompanionTimeoutAuthorization(proof, capability, completion) {
  const state = capabilities.get(capability), evidence = validatedEvidence.get(evidenceKey(proof));
  if (!state || !evidence || state.proof !== digest(proof) || state.evidence !== evidenceKey(proof) || state.observations !== digest(capability.observations) ||
      !validTime(completion?.finished_at) || Date.parse(capability.observations.accepted_repair.timestamp) <= Date.parse(completion.finished_at) ||
      Date.parse(capability.observations.accepted_repair.timestamp) < evidence.repairCommitTime ||
      Date.parse(capability.observations.accepted_repair.timestamp) < Date.parse(proof.repair.accepted_review.reviewed_at) ||
      Date.parse(capability.observations.accepted_repair.timestamp) <= evidence.lastEvidenceTime ||
      Date.parse(capability.observations.final_policy_review.timestamp) < evidence.finalCommitTime ||
      Date.parse(capability.observations.final_policy_review.timestamp) < Date.parse(capability.observations.accepted_repair.timestamp) ||
      Date.parse(capability.observations.execution_grant.timestamp) < Date.parse(capability.observations.final_policy_review.timestamp)) fail("companion_timeout_authenticated_authority_required");
}

// Offline reconstruction checks saved observations; it never authenticates a
// new operation and cannot replace the fresh transport/WeakMap admission gate.
export function validCompanionTimeoutAttempt(attempt) {
  const p = attempt?.source_correction;
  return isCompanionTimeout(p) && p.defect === COMPANION_DEFECT && p.source_module === COMPANION_MODULE &&
    attempt.number === 1 && !attempt.recovery && !attempt.browser_replacement &&
    exact(attempt.budget, { initial: 1, recovery: 0 }) && exact(p.budget, { initial: 1, recovery: 0 }) &&
    [p.base, p.head, p.tree, p.repair?.head].every(commit) && p.head === attempt.head && p.tree === attempt.tree &&
    p.retained_sources?.[COMPANION_MODULE] === COMPANION_SOURCE_HASHES.after && exact(p.limitations, COMPANION_LIMITATIONS) &&
    p.source_scope?.schema === COMPANION_SOURCE_SCOPE_SCHEMA && p.source_scope.basis === "accepted_task_and_current_main_union" &&
    commit(p.source_scope.accepted_base) && p.source_scope.accepted_head === p.repair.head && p.source_scope.current_main === p.base &&
    keys(p.repair?.accepted_review, ["reviewed_at", "source_url", "block_id", "block_sha256"]) && validTime(p.repair.accepted_review.reviewed_at) &&
    ["accepted_repair", "final_policy_review", "execution_grant"].every(role => {
      const observation = attempt.companion_timeout_authority?.[role];
      const ref = role === "accepted_repair" ? p.repair?.review : role === "final_policy_review" ?
        { id: p.authorization?.policy_review_id, sha256: p.authorization?.policy_review_sha256 } : { id: p.authorization?.grant_comment_id, sha256: p.authorization?.grant_sha256 };
      return keys(observation, ["id", "author", "author_id", "body_sha256", "timestamp", "role", "commit_id"]) && observation.role === role &&
        observation.id === ref?.id && digest(observation) === ref?.sha256 && Number.isSafeInteger(observation.id) && observation.id > 0 &&
        Number.isSafeInteger(observation.author_id) && observation.author_id > 0 && typeof observation.author === "string" && /^[A-Za-z0-9-]{1,39}$/u.test(observation.author) &&
        sha(observation.body_sha256) && validTime(observation.timestamp) && observation.commit_id === (role === "accepted_repair" ? p.repair.head : role === "final_policy_review" ? p.head : null);
    }) && Date.parse(attempt.companion_timeout_authority.execution_grant.timestamp) >= Date.parse(attempt.companion_timeout_authority.final_policy_review.timestamp) &&
    Date.parse(attempt.companion_timeout_authority.final_policy_review.timestamp) >= Date.parse(attempt.companion_timeout_authority.accepted_repair.timestamp) &&
    Date.parse(attempt.companion_timeout_authority.accepted_repair.timestamp) >= Date.parse(p.repair.accepted_review.reviewed_at);
}
