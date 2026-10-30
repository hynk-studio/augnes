// One separately authorized reviewed GuideBrief correction after a spent v5
// predecessor. This does not reopen v5 or reinterpret its failed qualification.
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { inflateRawSync } from "node:zlib";
import { digest, classifyInputChange, nonFaultInputChange, effectiveInputObservation, INPUT_CLASSES } from "./local-canonical-inputs.mjs";
import { BROWSER_REPLACEMENT_PHASES } from "./local-canonical-browser-replacement.mjs";
import { validConditionRequalificationAttempt } from "./local-canonical-condition-requalification.mjs";
import { CANONICAL_NODE_VERSION } from "./local-canonical-environment.mjs";
import { createGitHubObserverAuthorizationTransport } from "./github-main-branch-transport.mjs";

export const GUIDE_CORRECTION_SCHEMA = "augnes.local-canonical-source-correction.v6";
export const isGuideCorrection = p => p?.schema === GUIDE_CORRECTION_SCHEMA && p.kind === "guide_cancellation_correction";
export const GUIDE_REPAIR_PATHS = Object.freeze(["docs/CANONICAL_BROWSER_VERIFICATION_OWNERSHIP_V1.md", "scripts/project-experience-request-verdict-v1.mjs", "scripts/test-project-experience-guide-lifecycle-v1.mjs"]);
export const GUIDE_COMPARISON_INPUTS = Object.freeze([
  "scripts/test-project-experience-guide-lifecycle-v1.mjs", "scripts/project-experience-guide-lifecycle-v1.mjs",
  "scripts/project-experience-host-round-trip-pins-v1.mjs", "scripts/project-experience-inspector-lifecycle-v1.mjs",
  "scripts/operator-execution-result-contract-v1.mjs", "scripts/browser-validate-project-experience-v1.mjs",
  "components/guide/use-project-guide-brief-v0-2.ts", "scripts/canonical-child-runner.mjs", "scripts/canonical-test-environment.mjs",
  "scripts/local-canonical-checkout-ownership.mjs", "package-lock.json", "node_modules/typescript/package.json",
]);
const POLICY_PATHS = new Set([".github/LOCAL_CANONICAL_VERIFICATION.md", "docs/LOCAL_CANONICAL_INPUT_CONTRACT.md", "scripts/local-canonical-guide-correction.mjs",
  "scripts/local-canonical-attempts.mjs", "scripts/local-canonical-receipt.mjs", "scripts/local-canonical-review-export.mjs",
  "scripts/run-local-canonical-verification.mjs", "scripts/run-canonical-test-suite.mjs", "scripts/test-local-canonical-executor.mjs",
  "scripts/test-local-canonical-review-corrections.mjs", "scripts/fixtures/local-canonical-guide-correction.mjs"]);
const ORIGINAL_MEMBERS = Object.freeze({ receipt: "prior-lineage/original-receipt.json", attempt: "prior-lineage/attempt_reference.json",
  completion: "prior-lineage/completion_reference.json", edge: "prior-lineage/edge_reference.json", log: "evidence/original-native-host.log", extraction: "evidence/derived-extraction.json", result: "evidence/derived-child-result.json" });
const COMPARISON_MEMBERS = Object.freeze({ before: "evidence/comparison/before.json", after: "evidence/comparison/after.json",
  summary: "evidence/comparison/summary.json", completion: "evidence/comparison/completion.json",
  interpretation_correction: "evidence/comparison-interpretation-correction.json", fixture: "source/scripts/test-project-experience-guide-lifecycle-v1.mjs" });
const PHASE = "e2e-operator-native-host-execution", FAILURE = "final_gate:AssertionError:operator_unexpected_request_failure_count  2 !== 0 ";
const capabilities = new WeakMap(), fail = code => { throw Object.assign(new Error(code), { code }); };
const sha = x => typeof x === "string" && /^[0-9a-f]{64}$/u.test(x);
const commit = x => typeof x === "string" && /^[0-9a-f]{40}$/u.test(x);
const exact = (a, b) => digest(a) === digest(b);
const keys = (x, expected) => x && typeof x === "object" && !Array.isArray(x) && exact(Object.keys(x).sort(), [...expected].sort());
const validTime = x => typeof x === "string" && Number.isFinite(Date.parse(x)) && Date.parse(x) <= Date.now();
function safeBytes(file, maximum) {
  const s = lstatSync(file);
  if (realpathSync(file) !== file || !s.isFile() || s.isSymbolicLink() || s.nlink !== 1 || s.size > maximum) fail("guide_evidence_unsafe");
  return readFileSync(file);
}
export function guideArtifact(folder, ref, maximum = 64 * 1024) {
  if (!keys(ref, ["artifact", "sha256"]) || !/^[a-z0-9_-]+\.(?:json|log|zip|mjs)$/u.test(ref.artifact ?? "") || !sha(ref.sha256)) fail("guide_evidence_reference_invalid");
  const bytes = safeBytes(path.join(folder, ref.artifact), maximum);
  if (digest(bytes) !== ref.sha256) fail("guide_evidence_changed");
  return bytes;
}

// Closed, bounded archive reader: no extraction, filesystem names, ZIP64 or
// arbitrary loading. The independently accepted archive hash authenticates the
// bytes; each retained member must also agree with its original manifest hash.
function packet(bytes) {
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) if (bytes.readUInt32LE(i) === 0x06054b50) { end = i; break; }
  if (end < 0 || bytes.readUInt16LE(end + 4) || bytes.readUInt16LE(end + 6) || end + 22 + bytes.readUInt16LE(end + 20) !== bytes.length) fail("guide_packet_invalid");
  const count = bytes.readUInt16LE(end + 10), size = bytes.readUInt32LE(end + 12), start = bytes.readUInt32LE(end + 16);
  if (count < 1 || count > 128 || count !== bytes.readUInt16LE(end + 8) || start + size !== end) fail("guide_packet_invalid");
  const members = new Map(); let offset = start, total = 0;
  for (let i = 0; i < count; i++) {
    if (offset + 46 > end || bytes.readUInt32LE(offset) !== 0x02014b50) fail("guide_packet_invalid");
    const flags = bytes.readUInt16LE(offset + 8), method = bytes.readUInt16LE(offset + 10), compressed = bytes.readUInt32LE(offset + 20), length = bytes.readUInt32LE(offset + 24);
    const nameLength = bytes.readUInt16LE(offset + 28), extra = bytes.readUInt16LE(offset + 30), comment = bytes.readUInt16LE(offset + 32), local = bytes.readUInt32LE(offset + 42);
    const name = bytes.subarray(offset + 46, offset + 46 + nameLength).toString("utf8");
    if ((flags & ~0x808) || ![0, 8].includes(method) || !/^[A-Za-z0-9_./-]+$/u.test(name) || name.startsWith("/") || name.split("/").some(x => !x || x === "." || x === "..") ||
      members.has(name) || length > 16 * 1024 * 1024 || (total += length) > 64 * 1024 * 1024 || offset + 46 + nameLength + extra + comment > end ||
      local + 30 > start || bytes.readUInt32LE(local) !== 0x04034b50 || bytes.readUInt16LE(local + 8) !== method) fail("guide_packet_invalid");
    const localName = bytes.readUInt16LE(local + 26), localExtra = bytes.readUInt16LE(local + 28), data = local + 30 + localName + localExtra;
    if (bytes.subarray(local + 30, local + 30 + localName).toString("utf8") !== name || data + compressed > start) fail("guide_packet_invalid");
    const encoded = bytes.subarray(data, data + compressed), decoded = method === 0 ? encoded : inflateRawSync(encoded, { maxOutputLength: 16 * 1024 * 1024 });
    if (decoded.length !== length) fail("guide_packet_invalid");
    members.set(name, decoded); offset += 46 + nameLength + extra + comment;
  }
  if (offset !== end) fail("guide_packet_invalid");
  const get = name => { const value = members.get(name); if (!value) fail("guide_packet_member_missing"); return value; };
  const manifest = JSON.parse(get("MANIFEST.json"));
  if (manifest.kind !== "private_offline_development_return" || manifest.qualification !== false || manifest.original_evidence_retained !== true || !Array.isArray(manifest.entries) || manifest.entries.length !== members.size - 1 ||
    new Set(manifest.entries.map(x => x.name)).size !== manifest.entries.length || manifest.entries.some(x => x.name === "MANIFEST.json" || !members.has(x.name) || x.bytes !== get(x.name).length || x.sha256 !== digest(get(x.name)))) fail("guide_packet_manifest_invalid");
  return { get, manifest };
}
export function validateGuidePredecessor(receipt) {
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
      r.attempt.contract_fingerprint !== input.fingerprint || r.attempt.browser_replacement || !validConditionRequalificationAttempt(r.attempt) ||
      !r.cleanup?.completed || r.cleanup.remaining_owned_processes !== 0 || r.cleanup.companion_service?.restored !== true ||
      r.cleanup.isolated_resources?.completed !== true || r.cleanup.isolated_resources.failure_count !== 0 || r.cleanup.isolated_resources.failures?.length !== 0 ||
      r.cleanup.generated_next?.present_after === true || r.cleanup.generated_windows_helper?.present_after === true ||
      r.checkout_ownership?.released !== true || r.capacity_ownership?.released !== true ||
      !Array.isArray(phases) || !exact(phases.map(phase => phase.id), BROWSER_REPLACEMENT_PHASES)) fail("guide_predecessor_ineligible");
  const environments = input.binding.phase_environment_fingerprints;
  if (!Array.isArray(environments) || environments.length !== phases.length || new Set(environments.map(item => item?.id)).size !== environments.length ||
      phases.some(phase => !environments.some(item => item?.id === phase.id && sha(item.fingerprint) &&
        (item.fingerprint === phase.environment_fingerprint || (phase.status === "not_run" && phase.environment_fingerprint == null))))) fail("guide_predecessor_environment_invalid");
  for (const resource of input.resources) {
    if (!INPUT_CLASSES.includes(resource.classification) || !resource.before || typeof resource.before !== "object" ||
        Array.isArray(resource.before) || typeof resource.before.present !== "boolean" ||
        (resource.readOnlyExecutable && (resource.classification !== "execution" || resource.metadataOnly || resource.excludePreferences)) ||
        (resource.excludePreferences && resource.classification !== "ambient")) fail("guide_predecessor_input_role_invalid");
    effectiveInputObservation(resource.before, resource, input);
  }
  for (const event of input.events) {
    const resource = input.resources.find(item => item.id === event.resource);
    if (!resource || Object.hasOwn(event, "diagnostic") || event.classification !== resource.classification ||
        !nonFaultInputChange(event.disposition) || classifyInputChange(resource.before, event.after, resource, input) !== event.disposition ||
        event.identity !== digest([event.resource, event.disposition, event.after])) fail("guide_predecessor_input_fault");
  }
  let failed = false;
  for (const phase of phases) {
    if (failed) {
      if (phase.status !== "not_run" || phase.timed_out !== false || phase.spawn_error_code) fail("guide_predecessor_unrelated_phase");
      continue;
    }
    if (phase.timed_out !== false || phase.spawn_error_code || !phase.cleanup?.completed ||
        phase.cleanup.remaining_owned_processes !== 0 || !phase.cleanup.exit_observed || !phase.cleanup.streams_closed ||
        phase.cleanup.termination_reason !== "natural_exit") fail("guide_predecessor_unsettled_phase");
    if (phase.status === "failure" && phase.id === "e2e-operator-native-host-execution" && phase.exit_status === 1 && phase.failure_code === "phase_failed") failed = true;
    else if (phase.status !== "pass" || phase.exit_status !== 0 || phase.failure_code) fail("guide_predecessor_unrelated_phase");
  }
  if (!failed || r.final?.result !== "failure" || r.final.exit_status !== 1 ||
      !exact([...(r.final.reason_codes ?? [])].sort(), ["phase_failed", "selected_phases_incomplete"])) fail("guide_predecessor_ineligible");
  return r;
}


function firstObject(bytes, offset) {
  if (!Number.isSafeInteger(offset) || offset < 0 || offset >= bytes.length || bytes[offset] !== 123) fail("guide_original_extraction_invalid");
  const text = bytes.subarray(offset).toString("utf8"); let depth = 0, quoted = false, escaped = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) { if (escaped) escaped = false; else if (ch === "\\") escaped = true; else if (ch === '"') quoted = false; }
    else if (ch === '"') quoted = true;
    else if (ch === "{" || ch === "[") depth++;
    else if ((ch === "}" || ch === "]") && --depth === 0) return JSON.parse(text.slice(0, i + 1));
  }
  fail("guide_original_extraction_invalid");
}
function validateOriginalLog(original, raw, extraction, result, repositoryRoot) {
  const log = original.phases.find(p => p.id === PHASE).log, removed = extraction.removed_interleaved_stderr;
  if (log?.truncated !== false || log.bytes !== raw.length || log.relative_path !== `.augnes-local-verification/logs/${original.run.id}/${PHASE}.log` ||
    !safeBytes(path.join(repositoryRoot, log.relative_path), 2 * 1024 * 1024).equals(raw) || extraction.source_path !== log.relative_path || extraction.derived_not_original !== true ||
    extraction.historical_private_pin_reconstruction !== false || extraction.historical_verdict_rerun !== false || extraction.historical_result !== FAILURE ||
    extraction.raw_log_sha256 !== digest(raw) || extraction.raw_log_bytes !== raw.length || !removed || !Number.isSafeInteger(removed.start_byte_inclusive) || !Number.isSafeInteger(removed.end_byte_exclusive) ||
    removed.start_byte_inclusive < 0 || removed.end_byte_exclusive > raw.length || removed.bytes < 1 || removed.bytes > 16384 || removed.end_byte_exclusive - removed.start_byte_inclusive !== removed.bytes ||
    digest(raw.subarray(removed.start_byte_inclusive, removed.end_byte_exclusive)) !== removed.sha256) fail("guide_original_extraction_invalid");
  const derived = Buffer.concat([raw.subarray(0, removed.start_byte_inclusive), raw.subarray(removed.end_byte_exclusive)]);
  if (digest(derived) !== extraction.normalized_copy_sha256 || !exact(firstObject(derived, extraction.child_json_offset_in_derivative), result)) fail("guide_original_result_changed");
  if (result.validation_version !== "operator_execution_browser_validation.v1" || result.child_id !== "operator-native-host-execution" || result.ok !== false || result.failure !== FAILURE ||
    result.acceptance_bound_ms !== 360000 || result.unexpected_request_failure_count !== 2 ||
    ["unexpected_external_request_count", "unexpected_console_failure_count", "unexpected_page_failure_count", "unexpected_refusal_accounting_failure_count", "owned_process_residue_count", "listener_residue_count"].some(k => result[k] !== 0) ||
    ["cleanup_complete", "owned_streams_settled", "temporary_root_removed", "temporary_process_root_removed", "temporary_profile_removed", "temporary_database_removed", "runtime_shutdown_complete", "chrome_cdp_shutdown_complete"].some(k => result[k] !== true)) fail("guide_original_failure_ineligible");
  const failures = result.request_response_console_page_refusal_summary?.unexpected_request_failures;
  const capture = result.request_response_console_page_refusal_summary?.unexpected_request_failure_capture;
  if (!Array.isArray(failures) || failures.length !== 2 || new Set(failures.map(x => x.request_id)).size !== 2 ||
    capture?.total !== 2 || capture.captured !== 2 || capture.omitted !== 0 || capture.complete !== true ||
    failures.some(x => x.evidence_version !== "operator_request_failure_evidence.v1" || typeof x.request_id !== "string" || !x.request_id ||
      !exact(x.initiator_consumers, ["components/guide/use-project-guide-brief-v0-2.ts"]) || x.method !== "GET" || x.path !== "/api/augnes/read/guide-brief" ||
      [x.phase, x.initiating_phase, x.observation_phase].some(value => value !== "executed_reviewed_follow_up") || x.error_text !== "net::ERR_ABORTED" ||
      x.response_status !== null || x.response_classification !== null || x.error_code !== null || x.request_type !== "Fetch" || x.delivery_cardinality !== 1 || x.duplicate_delivery_count !== 0 ||
      !Number.isSafeInteger(x.navigation_epoch) || x.navigation_epoch < 1 || !Number.isSafeInteger(x.delivery_sequence) || x.delivery_sequence < 1) ||
    failures[0].navigation_epoch !== failures[1].navigation_epoch || failures[1].delivery_sequence !== failures[0].delivery_sequence + 1) fail("guide_original_failure_ineligible");
  const lines = raw.toString().split("\n"), prefix = `[canonical:${PHASE}]`, label = '"independent operator native-host execution Browser child"';
  const starts = lines.filter(x => x.startsWith(`${prefix} child_start `)), results = lines.filter(x => x.startsWith(`${prefix} child_result `));
  if (!exact(starts, [`${prefix} child_start label=${label} timeout_ms=360000`]) || results.length !== 1 ||
    !/^\[canonical:e2e-operator-native-host-execution\] child_result label="independent operator native-host execution Browser child" duration_ms=\d+ exit_code=1 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit$/u.test(results[0])) fail("guide_original_child_unsettled");
  const cleanups = lines.filter(x => x.startsWith('{"suite":"' + PHASE + '",')).map(x => JSON.parse(x));
  if (cleanups.length !== 1 || !Array.isArray(cleanups[0].resource_cleanup) || !cleanups[0].resource_cleanup.length || cleanups[0].resource_cleanup.some(x => x.completed !== true || x.failure_count !== 0 || x.failures?.length !== 0)) fail("guide_original_child_unsettled");
}
function validateComparison(p, originals, values, archive, repositoryRoot, source) {
  const { before, after, summary, completion, interpretation_correction: correction } = values;
  const settled = result => result && result.signal === null && result.timed_out === false && result.cancelled === false && result.spawn_error_code === null &&
    result.exit_observed === true && result.streams_closed === true && result.cleanup_completed === true && result.remaining_owned_processes === 0 && result.termination_reason === "natural_exit" && Number.isSafeInteger(result.duration_ms) && result.duration_ms > 0 && result.duration_ms < 30000;
  const cleanup = value => value.settled === true && value.released?.released === true && Array.isArray(value.cleanup) && value.cleanup.length === 1 && value.cleanup.every(x => x.completed === true && x.failure_count === 0 && x.failures?.length === 0);
  if (summary.development_only !== true || summary.qualification_or_successor !== false || summary.node !== `v${CANONICAL_NODE_VERSION}` || summary.npm !== "11.16.0" || summary.cwd !== repositoryRoot ||
    !sha(summary.environment_sha256) || !keys(summary.source_inputs, GUIDE_COMPARISON_INPUTS) || !cleanup(summary) || !exact(summary.results, [before]) ||
    !Array.isArray(summary.argv) || summary.argv.length !== 4 || summary.argv[0] !== summary.node_path || summary.argv[1] !== path.join(repositoryRoot, GUIDE_REPAIR_PATHS[2]) ||
    summary.argv[2] !== "--supersession-verdict-source" || !path.isAbsolute(summary.argv[3]) || path.basename(summary.argv[3]) !== "selected-verdict.mjs" ||
    !path.isAbsolute(summary.node_path) || digest(safeBytes(summary.node_path, 256 * 1024 * 1024)) !== summary.node_sha256 || digest(safeBytes(realpathSync(process.execPath), 256 * 1024 * 1024)) !== summary.node_sha256 ||
    completion.development_only !== true || completion.historical_session_recreated !== false || completion.qualification_allowance !== 0 || !cleanup(completion) ||
    completion.original_summary_sha256 !== p.comparison.summary.sha256 || completion.before_record_sha256 !== p.comparison.before.sha256 || !exact(completion.after, after) ||
    completion.environment_sha256 !== summary.environment_sha256 || after.environment_sha256 !== summary.environment_sha256 ||
    correction.preserved_record !== "comparison/completion.json" || correction.preserved_sha256 !== p.comparison.completion.sha256 || correction.historical_session_recreation !== false ||
    !correction.correction?.includes("Numeric inode comparison is unavailable.") || !correction.correction.includes("Original record remains unchanged.")) fail("guide_comparison_binding_invalid");
  for (const [record, label, head, exit, expected] of [[before, "before", originals.prior.head, 1, false], [after, "after", p.repair.head, 0, true]]) {
    const bytes = archive.get(`evidence/comparison/${label}.mjs`), stdout = archive.get(`evidence/comparison/${label}.stdout`).toString();
    const observations = stdout.split("\n").filter(x => x.startsWith("{")).map(x => JSON.parse(x));
    if (record.label !== label || record.head !== head || record.source_inputs_unchanged !== true || record.source_sha256 !== digest(bytes) || !bytes.equals(source(head, GUIDE_REPAIR_PATHS[1])) ||
      !validTime(record.started_at) || !validTime(record.ended_at) || Date.parse(record.started_at) <= Date.parse(originals.completion.finished_at) || Date.parse(record.ended_at) < Date.parse(record.started_at) ||
      !settled(record.result) || record.result.exit_code !== exit || !exact(record.observations, observations) || observations.length !== 1) fail("guide_comparison_witness_invalid");
    const observation = observations[0];
    if (observation.mode !== "--supersession-verdict-source" || observation.fixture !== "actual_hook_cleanup_replay_explicit_refresh" || observation.requests !== 3 || observation.bound_cancellations !== 2 ||
      observation.adopted_read !== 3 || observation.actual_producer_collector_private_pins !== true || observation.final_body_parse_commit !== true || observation.synthetic_controlled_schedule !== true || observation.historical_browser_recreation !== false || observation.production_attempt !== false ||
      !exact(observation.created_reads, [{ read: 1, effect: 1, cause: "initial_effect" }, { read: 2, effect: 2, cause: "initial_effect" }, { read: 3, effect: 2, cause: "explicit_refresh" }]) || !exact(observation.aborted_reads, [1, 2]) ||
      !Array.isArray(observation.observed) || observation.observed.length !== 2 || observation.observed.some((x, i) => x.read !== i + 1 || x.expected !== expected ||
        x.reason !== (expected ? "expected_guide_replay_refresh_supersession" : i === 0 ? "guide_duplicate_event" : "guide_generation_mismatch") || (expected && (x.canceled_reads !== 2 || x.replacement_completed_and_adopted !== true)))) fail("guide_comparison_observation_invalid");
  }
  if (p.comparison.finished_at !== after.ended_at || Date.parse(after.started_at) <= Date.parse(before.ended_at)) fail("guide_comparison_order_invalid");
  const wrapper = archive.get("evidence/comparison-console.log").toString(), corrected = archive.get("evidence/comparison-after-console.log").toString();
  if (!wrapper.includes("resource_owner_invalid") || (wrapper.match(/child_spawn label="before" /gu) ?? []).length !== 1 || (wrapper.match(/child_spawn label="after" /gu) ?? []).length !== 0 ||
    (corrected.match(/child_spawn label="after" /gu) ?? []).length !== 1 || (corrected.match(/child_spawn label="before" /gu) ?? []).length !== 0) fail("guide_comparison_refusal_history_invalid");
  for (const name of GUIDE_COMPARISON_INPUTS) {
    const hash = summary.source_inputs[name], archived = archive.get(`source/${name}`);
    if (!sha(hash) || digest(archived) !== hash || digest(safeBytes(path.join(repositoryRoot, name), 4 * 1024 * 1024)) !== hash ||
      (name !== "node_modules/typescript/package.json" && (digest(source(p.repair.head, name)) !== hash || digest(source(p.head, name)) !== hash))) fail("guide_comparison_dependency_changed");
  }
  if (!archive.get(`source/${GUIDE_REPAIR_PATHS[2]}`).equals(guideArtifact(path.dirname(originals.file), p.comparison.fixture, 512 * 1024))) fail("guide_comparison_fixture_changed");
}

export function readGuideCorrectionEvidence(file, p, repositoryRoot) {
  const stored = { ...p }; delete stored.local_relative_path;
  if (!keys(stored, ["schema", "kind", "branch", "base", "head", "tree", "prior_family_id", "prior_number", "prior_attempt_id", "prior_receipt_fingerprint", "originals", "repair", "comparison", "final_source", "authorization", "pull_request", "budget"]) ||
    !isGuideCorrection(p) || ![p.base, p.head, p.tree, p.repair?.head, p.repair?.tree].every(commit) || typeof p.branch !== "string" || !p.branch || !sha(p.prior_family_id) || p.prior_number !== 1 || !sha(p.prior_receipt_fingerprint) ||
    !keys(p.originals, Object.keys(ORIGINAL_MEMBERS)) || !keys(p.repair, ["head", "tree", "review", "archive"]) || !keys(p.repair.review, ["id", "sha256"]) || !Number.isSafeInteger(p.repair.review.id) || p.repair.review.id <= 0 || !sha(p.repair.review.sha256) ||
    !keys(p.comparison, [...Object.keys(COMPARISON_MEMBERS), "finished_at"]) || !validTime(p.comparison.finished_at) || !Number.isSafeInteger(p.pull_request) || p.pull_request <= 0 || !exact(p.budget, { initial: 1, recovery: 0 })) fail("guide_proof_invalid");
  const folder = path.dirname(file), archive = packet(guideArtifact(folder, p.repair.archive, 64 * 1024 * 1024));
  const readMembers = (refs, names) => Object.fromEntries(Object.entries(names).map(([key, member]) => {
    const bytes = guideArtifact(folder, refs[key], 2 * 1024 * 1024);
    if (!bytes.equals(archive.get(member))) fail("guide_accepted_packet_member_changed");
    return [key, ["log", "fixture"].includes(key) ? bytes : JSON.parse(bytes)];
  }));
  const old = readMembers(p.originals, ORIGINAL_MEMBERS), values = readMembers(p.comparison, COMPARISON_MEMBERS);
  const original = validateGuidePredecessor(old.receipt), prior = old.attempt, completion = old.completion;
  if (!exact(original.attempt, prior) || prior.family_id !== p.prior_family_id || prior.number !== p.prior_number || prior.branch !== p.branch || prior.attempt_id !== p.prior_attempt_id || original.integrity.content_fingerprint !== p.prior_receipt_fingerprint ||
    completion.contract !== prior.contract || completion.attempt_id !== prior.attempt_id || completion.receipt_fingerprint !== p.prior_receipt_fingerprint || completion.disposition !== "product_failure" || completion.cleanup_complete !== true || completion.infrastructure_code !== null || !validTime(completion.finished_at) ||
    p.repair.head === prior.head || p.repair.tree === prior.tree || p.head === prior.head || p.tree === prior.tree || archive.manifest.head !== p.repair.head || archive.manifest.tree !== p.repair.tree ||
    p.authorization?.grant_comment_id === prior.source_correction.authorization.grant_comment_id) fail("guide_original_binding_invalid");
  if (!keys(old.edge, ["contract", "kind", "family_id", "head", "tree", "proof_fingerprint"]) || old.edge.contract !== "augnes.local-canonical-successor.v2" ||
    old.edge.kind !== "condition_requalification" || old.edge.family_id !== prior.family_id || old.edge.head !== prior.head || old.edge.tree !== prior.tree ||
    old.edge.proof_fingerprint !== digest(prior.source_correction)) fail("guide_original_edge_invalid");
  validateOriginalLog(original, old.log, old.extraction, old.result, repositoryRoot);
  const final = JSON.parse(guideArtifact(folder, p.final_source));
  if (!keys(final, ["schema", "basis", "base", "head", "tree", "predecessor_head", "predecessor_tree", "repair_head", "repair_tree", "deltas"]) || final.schema !== "augnes.guide-correction-final-source.v1" || final.basis !== "implementation_owner_not_independent_review" ||
    final.base !== p.base || final.head !== p.head || final.tree !== p.tree || final.predecessor_head !== prior.head || final.predecessor_tree !== prior.tree || final.repair_head !== p.repair.head || final.repair_tree !== p.repair.tree || !keys(final.deltas, ["repair", "predecessor", "reviewed", "main"])) fail("guide_final_source_invalid");
  const git = args => execFileSync("git", args, { cwd: repositoryRoot, timeout: 10000, maxBuffer: 16 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
  const paths = (a, b) => git(["diff", "--name-only", a, b, "--"]).toString().trim().split("\n").filter(Boolean).sort();
  const source = (head, name) => git(["show", `${head}:${name}`]);
  for (const [a, b] of [[prior.head, p.repair.head], [p.repair.head, p.head], [p.base, p.head]]) git(["merge-base", "--is-ancestor", a, b]);
  if (git(["rev-parse", `${p.head}^{tree}`]).toString().trim() !== p.tree || git(["rev-parse", `${p.repair.head}^{tree}`]).toString().trim() !== p.repair.tree || !exact(paths(prior.head, p.repair.head), GUIDE_REPAIR_PATHS)) fail("guide_source_binding_invalid");
  for (const [kind, a, b] of [["repair", prior.head, p.repair.head], ["predecessor", prior.head, p.head], ["reviewed", p.repair.head, p.head], ["main", p.base, p.head]]) {
    const declared = final.deltas[kind], bytes = git(["diff", "--binary", "--no-ext-diff", "--no-textconv", a, b, "--"]);
    if (!keys(declared, ["sha256", "bytes", "changed_paths"]) || digest(bytes) !== declared.sha256 || bytes.length !== declared.bytes || !exact(paths(a, b), declared.changed_paths)) fail("guide_native_delta_invalid");
  }
  const archivedFinal = JSON.parse(archive.get("evidence/final-source.json"));
  if (archivedFinal.head !== p.repair.head || archivedFinal.tree !== p.repair.tree || archivedFinal.starting_head !== prior.head || archivedFinal.starting_tree !== prior.tree ||
    !exact(final.deltas.repair, { sha256: archivedFinal.deltas?.["starting-to-candidate"]?.sha256, bytes: archivedFinal.deltas?.["starting-to-candidate"]?.bytes, changed_paths: archivedFinal.deltas?.["starting-to-candidate"]?.paths })) fail("guide_reviewed_delta_changed");
  const sharedBase = git(["merge-base", p.repair.head, p.base]).toString().trim(), retained = new Set(paths(sharedBase, p.repair.head));
  for (const name of new Set([...GUIDE_REPAIR_PATHS, ...retained, ...paths(p.base, p.head)])) {
    if (GUIDE_REPAIR_PATHS.includes(name) || !POLICY_PATHS.has(name)) {
      if ((!retained.has(name) && !GUIDE_REPAIR_PATHS.includes(name)) || !source(p.head, name).equals(source(p.repair.head, name))) fail("guide_retained_source_changed");
    }
  }
  for (const name of GUIDE_REPAIR_PATHS) if (!archive.get(`source/${name}`).equals(source(p.repair.head, name))) fail("guide_reviewed_source_changed");
  validateComparison(p, { original, prior, completion, file }, values, archive, repositoryRoot, source);
  return { original, prior, completion, source: final };
}

export function guideAuthorityObservation(record, role) {
  return { id: record.id, author: record.user?.login, author_id: record.user?.id, body_sha256: digest(record.body), timestamp: record.updated_at ?? record.submitted_at,
    role, commit_id: role === "accepted_repair" ? record.commit_id : null };
}
function assertAuthorityProse(p, repair, grant) {
  const reviewed = ["SOURCE / CONTRACT / DEVELOPMENT EVIDENCE ACCEPTED for the exact three-path correction below.", p.repair.head, p.repair.tree, p.repair.archive.sha256,
    "The retained Mac 243ms FAIL / 242ms PASS comparison is accepted as development evidence.", "The historical refresh caller, absent historical private pins and exact original failure causation remain UNKNOWN."];
  const required = ["## User execution authorization: reviewed GuideBrief correction qualification", `https://github.com/hynk-studio/augnes/pull/${p.pull_request}#pullrequestreview-${p.repair.review.id}`,
    p.branch, p.repair.head, p.repair.tree, p.repair.archive.sha256, p.prior_family_id, p.prior_attempt_id, p.prior_receipt_fingerprint,
    "Budget: ONE admitted Full; ZERO additional automatic or explicit recovery/retry.", "It does **not** renew spent grant", "No separate policy-only Full, prior deployment, second final-source execution grant or routine intermediate independent-review handoff is required.",
    "ChatGPT's independent audit of the added policy/source and actual results occurs AFTER completion.", "A new interrupted reservation remains consumed; another HEAD, branch, worktree, proof, copied grant or successor kind cannot renew this authorization.",
    "No second Full or recovery follows under this authority.", "After settlement, run separate fresh-process stock on the actual new receipt, including a usable failed receipt."];
  if (reviewed.some(x => !repair.body.includes(x))) fail("guide_repair_review_scope_invalid");
  if (required.some(x => !grant.body.includes(x)) || GUIDE_REPAIR_PATHS.some(x => !repair.body.includes(x) || !grant.body.includes(x))) fail("guide_authority_scope_invalid");
}
export async function authorizeGuideCorrection(p, { transport = createGitHubObserverAuthorizationTransport(p.pull_request) } = {}) {
  if (!isGuideCorrection(p) || !keys(p.authorization, ["grant_comment_id", "grant_sha256"]) || !Number.isSafeInteger(p.authorization.grant_comment_id) || p.authorization.grant_comment_id <= 0 || !sha(p.authorization.grant_sha256)) fail("guide_authority_missing");
  const repair = await transport.review(p.repair.review.id), grant = await transport.grant(p.authorization.grant_comment_id), observations = {};
  for (const [record, role, ref] of [[repair, "accepted_repair", p.repair.review], [grant, "execution_grant", { id: p.authorization.grant_comment_id, sha256: p.authorization.grant_sha256 }]]) {
    if (record?.id !== ref.id || record.user?.type !== "User" || !Number.isSafeInteger(record.user?.id) || record.user.id <= 0 || !/^[A-Za-z0-9-]{1,39}$/u.test(record.user?.login ?? "") || !["OWNER", "MEMBER", "COLLABORATOR"].includes(record.author_association) || typeof record.body !== "string" || Buffer.byteLength(record.body) > 64 * 1024) fail("guide_authority_identity_invalid");
    if (role === "accepted_repair" ? record.pull_request_url !== `https://api.github.com/repos/hynk-studio/augnes/pulls/${p.pull_request}` || !["COMMENTED", "APPROVED"].includes(record.state) || record.commit_id !== p.repair.head : record.issue_url !== `https://api.github.com/repos/hynk-studio/augnes/issues/${p.pull_request}`) fail("guide_authority_source_invalid");
    const observation = guideAuthorityObservation(record, role), permission = await transport.permission(record.user.login);
    if (!validTime(observation.timestamp) || digest(observation) !== ref.sha256) fail("guide_authority_changed");
    if (permission.user?.login !== record.user.login || !["admin", "maintain"].includes(permission.permission)) fail("guide_authority_permission_invalid");
    observations[role] = observation;
  }
  assertAuthorityProse(p, repair, grant);
  if (Date.parse(observations.accepted_repair.timestamp) <= Date.parse(p.comparison.finished_at) || Date.parse(observations.execution_grant.timestamp) <= Date.parse(observations.accepted_repair.timestamp)) fail("guide_authority_order_invalid");
  const pr = await transport.pullRequest();
  if (pr?.number !== p.pull_request || pr.state !== "open" || pr.draft !== true || pr.merged !== false || pr.auto_merge !== null || pr.head?.repo?.full_name !== "hynk-studio/augnes" || pr.base?.repo?.full_name !== "hynk-studio/augnes" || pr.head.sha !== p.head || pr.head.ref !== p.branch || pr.base.sha !== p.base || pr.base.ref !== "main") fail("guide_published_source_invalid");
  const capability = Object.freeze({ observations }); capabilities.set(capability, { proof: digest(p), observations: digest(observations) }); return capability;
}
export function assertGuideCorrectionAuthorization(p, capability, completion) {
  const state = capabilities.get(capability);
  if (!state || state.proof !== digest(p) || state.observations !== digest(capability.observations) || Date.parse(capability.observations.accepted_repair.timestamp) <= Date.parse(completion.finished_at)) fail("guide_authenticated_authority_required");
}
export function validGuideCorrectionAttempt(attempt) {
  const p = attempt?.source_correction;
  return isGuideCorrection(p) && attempt.number === 1 && !attempt.recovery && !attempt.browser_replacement && exact(attempt.budget, { initial: 1, recovery: 0 }) && exact(p.budget, { initial: 1, recovery: 0 }) &&
    [p.base, p.head, p.tree, p.repair?.head, p.repair?.tree].every(commit) && p.head === attempt.head && p.tree === attempt.tree && p.branch === attempt.branch && p.prior_number === 1 && sha(p.prior_family_id) && sha(p.prior_receipt_fingerprint) &&
    validTime(p.comparison?.finished_at) && [p.final_source?.sha256, p.repair?.archive?.sha256, ...Object.keys(ORIGINAL_MEMBERS).map(k => p.originals?.[k]?.sha256), ...Object.keys(COMPARISON_MEMBERS).map(k => p.comparison?.[k]?.sha256)].every(sha) &&
    ["accepted_repair", "execution_grant"].every(role => {
      const observation = attempt.guide_authority?.[role], ref = role === "accepted_repair" ? p.repair?.review : { id: p.authorization?.grant_comment_id, sha256: p.authorization?.grant_sha256 };
      return keys(observation, ["id", "author", "author_id", "body_sha256", "timestamp", "role", "commit_id"]) && observation.role === role && observation.id === ref?.id && digest(observation) === ref?.sha256 && Number.isSafeInteger(observation.id) && observation.id > 0 &&
        Number.isSafeInteger(observation.author_id) && observation.author_id > 0 && /^[A-Za-z0-9-]{1,39}$/u.test(observation.author ?? "") && sha(observation.body_sha256) && validTime(observation.timestamp) && observation.commit_id === (role === "accepted_repair" ? p.repair.head : null);
    }) && Date.parse(attempt.guide_authority.accepted_repair.timestamp) > Date.parse(p.comparison.finished_at) &&
    Date.parse(attempt.guide_authority.execution_grant.timestamp) > Date.parse(attempt.guide_authority.accepted_repair.timestamp);
}
