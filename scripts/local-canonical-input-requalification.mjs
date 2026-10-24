import { lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { digest, observeInputFile, classifyInputChange, nonFaultInputChange } from "./local-canonical-inputs.mjs";
import { admitIntegrationBase } from "./local-canonical-integration-base.mjs";
import { checkoutVerificationFingerprint, assertCheckoutVerificationOwnership } from "./local-canonical-checkout-ownership.mjs";
import { browserConsumersForPhase } from "./local-canonical-browser-identity.mjs";
import { CODEX_REUSE_PHASE_IDS } from "./codex-reuse-verification-ownership.mjs";
import { canonicalChildAcceptanceFailure } from "./canonical-child-runner.mjs";

export const INPUT_REQUALIFICATION_CONTRACT = "augnes.local-canonical-input-requalification.v1";
const fail = code => { throw Object.assign(new Error(code), { code }); };
const hash = v => /^[0-9a-f]{64}$/u.test(v ?? "");
const sha = v => /^[0-9a-f]{40}$/u.test(v ?? "");
const reference = v => typeof v === "string" && /^https:\/\/github\.com\/hynk-studio\/augnes\/(?:issues|pull)\/[0-9]+(?:#[A-Za-z0-9_-]+)?$/u.test(v);
const safePath = v => typeof v === "string" && /^[A-Za-z0-9_./-]+$/u.test(v) && !v.startsWith("/") && !v.split("/").some(x => !x || x === "." || x === "..");
const same = (a, b) => digest(a) === digest(b);
const time = v => Number.isFinite(Date.parse(v));
// Match the executor/stock owners: Browser and reuse require natural exit;
// other owners can accept a successful exit followed by settled descendants.
const naturalExitRequired = p => p.browser === true || CODEX_REUSE_PHASE_IDS.includes(p.id) || Object.keys(browserConsumersForPhase(p.id)).length > 0;
const successfulTermination = reason => ["natural_exit", "exited_with_owned_descendant_cleanup", "closed_with_owned_descendant_cleanup"].includes(reason);
const gitAt = root => args => execFileSync("git", ["--no-replace-objects", ...args], {
  cwd: root, timeout: 10000, maxBuffer: 16 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"],
});

// These readers are deliberately read-only, including directory resolution.
// Proof files bind existing task authority; no local string authenticates it.
export function readRequalificationArtifact(file, maximum = 512 * 1024) {
  const s = lstatSync(file);
  if (!s.isFile() || s.isSymbolicLink() || s.nlink !== 1 || s.size > maximum || (s.mode & 0o022) || realpathSync(file) !== file)
    fail("input_requalification_unsafe_artifact");
  return readFileSync(file);
}
const json = file => JSON.parse(readRequalificationArtifact(file));
function local(root, relative) {
  if (!safePath(relative) || !relative.startsWith(".augnes-local-verification/")) fail("input_requalification_unsafe_path");
  const file = path.join(root, relative);
  if (realpathSync(file) !== file) fail("input_requalification_unsafe_path");
  return file;
}
function linked(file, descriptor, maximum) {
  if (!descriptor || !/^[a-z0-9_-]+\.(?:json|bin)$/u.test(descriptor.artifact ?? "") || !hash(descriptor.sha256))
    fail("input_requalification_evidence_missing");
  const bytes = readRequalificationArtifact(path.join(path.dirname(file), descriptor.artifact), maximum);
  if (digest(bytes) !== descriptor.sha256) fail("input_requalification_evidence_changed");
  return bytes;
}

export function readInputRequalificationProof(file, repositoryRoot) {
  const relative = path.relative(repositoryRoot, file).split(path.sep).join("/");
  local(repositoryRoot, relative);
  const proof = json(file);
  if (proof.schema !== INPUT_REQUALIFICATION_CONTRACT || !["unchanged_source", "accepted_main_adoption"].includes(proof.kind) ||
      ![proof.head, proof.tree, proof.accepted_main].every(sha) || typeof proof.branch !== "string" ||
      !hash(proof.prior?.family_id) || proof.prior.number !== 1 || !hash(proof.prior.receipt_fingerprint) ||
      !hash(proof.prior.input_fingerprint) || !hash(proof.prior.fault_fingerprint) ||
      ![proof.prior.receipt_bytes_sha256, proof.prior.attempt_record_sha256, proof.prior.completion_record_sha256].every(hash) ||
      !/^\.augnes-local-verification\/receipts\/[A-Za-z0-9_-]+\.json$/u.test(proof.prior.receipt_path ?? ""))
    fail("input_requalification_proof_invalid");
  linked(file, proof.history_review);
  linked(file, proof.source_review);
  return { ...proof, local_relative_path: relative };
}

export function inputRequalificationResources({ repositoryRoot, anchorRoot, proof }) {
  const file = local(repositoryRoot, proof.local_relative_path), reread = readInputRequalificationProof(file, repositoryRoot);
  if (!same(reread, proof)) fail("input_requalification_evidence_changed");
  const history = JSON.parse(linked(file, proof.history_review)), source = JSON.parse(linked(file, proof.source_review));
  const adjacent = descriptor => {
    linked(file, descriptor, 2 * 1024 * 1024);
    return path.join(path.dirname(file), descriptor.artifact);
  };
  const files = [file, local(repositoryRoot, proof.prior.receipt_path), adjacent(proof.history_review), adjacent(proof.source_review),
    ...proof.input.snapshots.map(adjacent), ...history.logs.map(log => local(repositoryRoot, log.path)),
    ...source.overlaps.map(overlap => adjacent(overlap.preservation)),
    ...["attempt", "completion"].map(kind => path.join(anchorRoot, ".augnes-local-verification/families", proof.prior.family_id, `${kind}-1.json`))];
  return [...new Set(files)].sort().map((file, n) => {
    readRequalificationArtifact(file, 2 * 1024 * 1024);
    return { id: `requalification-evidence-${n}`, file, classification: "execution" };
  });
}

function originalContract(receipt) {
  const i = receipt.inputs;
  return { contract: i.contract, path_kind: i.path_kind, binding: i.binding, resources: i.resources };
}

export function inspectInputPredecessor({ anchorRoot, repositoryRoot, receiptPath, checkoutOwner = null }) {
  const receiptFile = local(repositoryRoot, receiptPath), originalBytes = readRequalificationArtifact(receiptFile);
  const original = JSON.parse(originalBytes), value = { ...original }; delete value.integrity;
  const a = original.attempt, i = original.inputs, f = i?.first_fault;
  if (original.integrity?.algorithm !== "sha256" || original.integrity?.canonicalization !== "json-sorted-keys-v1" ||
      digest(value) !== original.integrity?.content_fingerprint || original.receipt_version !== 4 ||
      !a || !["augnes.local-canonical-attempt-family.v1", "augnes.local-canonical-attempt-family.v2"].includes(a.contract) ||
      !hash(a.family_id) || a.number !== 1 || original.run?.id !== a.attempt_id ||
      original.repository?.head_sha !== a.head || original.repository?.tree_sha !== a.tree ||
      original.repository?.branch !== a.branch || original.repository?.repository_id !== "hynk-studio/augnes" ||
      original.repository?.origin !== "https://github.com/hynk-studio/augnes.git" ||
      original.repository?.worktree_before !== "clean" || original.repository?.worktree_after !== "clean" ||
      !sha(a.head) || !sha(a.tree) || !sha(original.repository.base_sha) ||
      !time(original.run.started_at) || !time(original.run.finished_at) || !time(a.started_at) ||
      Date.parse(original.run.started_at) > Date.parse(a.started_at) || Date.parse(a.started_at) > Date.parse(original.run.finished_at) ||
      original.executor?.version !== 4 || original.environment?.node?.canonical_match !== true ||
      original.environment.node.actual_version !== original.environment.node.canonical_version || original.environment.node.path_version !== original.environment.node.canonical_version ||
      i?.contract !== "augnes.local-canonical-inputs.v2" || !Array.isArray(i.resources) || !Array.isArray(i.events) || !Array.isArray(i.secondary_faults) ||
      i.fingerprint !== digest(originalContract(original)) || a.contract_fingerprint !== i.fingerprint ||
      i.binding?.head !== a.head || i.binding?.tree !== a.tree || i.binding?.executor_fingerprint !== original.executor?.source_fingerprint ||
      !Number.isSafeInteger(i.checks) || i.checks < 1 || i.events.length >= 64 || i.secondary_faults.length >= 16 || i.observation_overflow === true ||
      f?.resource !== "git-config" || f.disposition !== "input_invalidation" || !same(f, original.outcome?.first_fault) ||
      original.outcome?.disposition !== "input_invalidation" || original.outcome?.safety !== "blocked" ||
      !time(f.observed_at) || Date.parse(f.observed_at) < Date.parse(a.started_at) || Date.parse(f.observed_at) > Date.parse(original.run.finished_at))
    fail("input_requalification_original_invalid");
  const family = path.join(anchorRoot, ".augnes-local-verification", "families", a.family_id);
  if (realpathSync(family) !== family || !lstatSync(family).isDirectory()) fail("input_requalification_original_invalid");
  const attemptBytes = readRequalificationArtifact(path.join(family, "attempt-1.json")), completionBytes = readRequalificationArtifact(path.join(family, "completion-1.json"));
  const retained = JSON.parse(attemptBytes), completion = JSON.parse(completionBytes);
  if (!same(retained, a) || completion.contract !== a.contract || completion.attempt_id !== a.attempt_id || completion.receipt_fingerprint !== original.integrity.content_fingerprint ||
      completion.disposition !== "input_invalidation" || completion.cleanup_complete !== true ||
      !time(completion.finished_at) || Date.parse(completion.finished_at) < Date.parse(original.run.finished_at))
    fail("input_requalification_settlement_invalid");
  const resource = i.resources.find(r => r.id === "git-config");
  if (!resource || resource.classification !== "execution" || resource.metadataOnly || resource.excludePreferences || resource.readOnlyExecutable ||
      resource.location_fingerprint !== digest(path.join(anchorRoot, ".git", "config")) || !hash(resource.before?.sha256))
    fail("input_requalification_resource_invalid");
  const faults = [];
  let previousMonotonic = -1n;
  for (const event of i.events) {
    const r = i.resources.find(x => x.id === event.resource);
    if (!r || !event.after || event.classification !== r.classification ||
        event.identity !== digest([event.resource, event.disposition, event.after]) ||
        classifyInputChange(r.before, event.after, r) !== event.disposition || !time(event.observed_at) ||
        Date.parse(event.observed_at) < Date.parse(original.run.started_at) || Date.parse(event.observed_at) > Date.parse(original.run.finished_at) ||
        !/^[0-9]{1,40}$/u.test(event.monotonic_ns ?? "") || BigInt(event.monotonic_ns) <= previousMonotonic)
      fail("input_requalification_history_unknown");
    previousMonotonic = BigInt(event.monotonic_ns);
    if (!nonFaultInputChange(event.disposition)) {
      if (event.resource !== "git-config" || event.disposition !== "input_invalidation") fail("input_requalification_mixed_history");
      faults.push(event);
    }
  }
  if (!faults.length || faults[0].after.sha256 === resource.before.sha256 || !same(f, Object.fromEntries(["resource", "disposition", "observed_at", "monotonic_ns"].map(k => [k, faults[0][k]]))) ||
      i.secondary_faults.some(s => !faults.some(e => ["resource", "disposition", "observed_at", "monotonic_ns"].every(k => s[k] === e[k]))))
    fail("input_requalification_fault_link_invalid");
  const cleanup = original.cleanup;
  const capacity = original.capacity_ownership, historical = original.historical_inputs;
  const historicalRequired = original.verification_context?.kind === "isolated-worktree" && original.phases?.some(p => p.id === "authority");
  if (cleanup?.completed !== true || cleanup.remaining_owned_processes !== 0 || cleanup.companion_service?.restored !== true ||
      original.checkout_ownership?.acquired !== true || original.checkout_ownership.released !== true || original.checkout_ownership.failure_code ||
      typeof capacity?.required !== "boolean" ||
      (original.environment.operating_system === "macOS" && ["full-canonical", "owner-targeted"].includes(original.evidence?.selected_plan) && !capacity.required) ||
      ((capacity.required || capacity.acquired) && (!capacity.acquired || !capacity.released || capacity.failure_code)) ||
      (cleanup.isolated_resources?.required && (!cleanup.isolated_resources.completed || cleanup.isolated_resources.failure_count !== 0)))
    fail("input_requalification_cleanup_incomplete");
  if ((historicalRequired || historical?.required) && (historical?.required !== true || historical.prepared !== true ||
      historical.completed !== true || historical.unchanged !== true || !same(historical.failures, []) ||
      historical.invocation_id !== original.run.invocation_id)) fail("input_requalification_cleanup_incomplete");
  if (original.verification_context?.kind === "isolated-worktree" &&
      (cleanup.isolated_resources?.required !== true || cleanup.isolated_resources.prepared !== true ||
       !same(cleanup.isolated_resources.failures, []) || cleanup.companion_service.scope !== "accepted_checkout_read_only" ||
       cleanup.companion_service.maintenance_acquired !== false || cleanup.companion_service.maintenance_released !== true ||
       !same(cleanup.companion_service.before, cleanup.companion_service.after) || ["before", "after"].some(side => {
         const state = cleanup.companion_service[side], observed = cleanup.companion_service.observations?.[side];
         return state?.preservation_valid !== true || !hash(state?.preservation_binding) || observed?.coherent !== true || observed.live_identity_valid !== true ||
           observed.before_binding !== state.preservation_binding || observed.after_binding !== state.preservation_binding;
       }))) fail("input_requalification_cleanup_incomplete");
  if ([cleanup.generated_next?.present_after, cleanup.generated_windows_helper?.present_after].some(v => v === true)) fail("input_requalification_cleanup_incomplete");
  if (!Array.isArray(original.phases) || !original.phases.length || new Set(original.phases.map(p => p.id)).size !== original.phases.length ||
      !Array.isArray(i.binding.phase_environment_fingerprints) || !same(original.phases.map(p => p.id), i.binding.phase_environment_fingerprints.map(p => p.id)) ||
      new Set(i.resources.map(r => r.id)).size !== i.resources.length)
    fail("input_requalification_history_unknown");
  let stopped = false;
  for (const p of original.phases) {
    if (p.status === "not_run") {
      stopped = true;
      if (p.started_at !== null || p.finished_at !== null || p.exit_status !== null || p.timed_out || p.failure_code !== "phase_not_run") fail("input_requalification_mixed_history");
      continue;
    }
    if (stopped || p.timed_out !== false || p.spawn_error_code || p.cleanup?.completed !== true || p.cleanup.remaining_owned_processes !== 0 ||
        p.cleanup.exit_observed !== true || p.cleanup.streams_closed !== true || !time(p.started_at) || !time(p.finished_at))
      fail("input_requalification_mixed_history");
    if (p.status === "pass") {
      if (p.exit_status !== 0 || p.failure_code !== null || !successfulTermination(p.cleanup.termination_reason) ||
          (naturalExitRequired(p) && p.cleanup.termination_reason !== "natural_exit") || Date.parse(p.finished_at) > Date.parse(f.observed_at))
        fail("input_requalification_mixed_history");
    } else {
      if (p.status !== "failure" || p.failure_code !== "phase_cancelled" || ![null, 0].includes(p.exit_status) ||
          p.cleanup.termination_reason !== "operator_cancelled" || Date.parse(p.started_at) > Date.parse(f.observed_at) || Date.parse(p.finished_at) < Date.parse(f.observed_at))
        fail("input_requalification_mixed_history");
      stopped = true;
    }
  }
  if (original.evidence?.deciding !== false || original.final?.result !== "failure" || original.final?.exit_status !== 1 ||
      !Array.isArray(original.final?.reason_codes) || original.final.reason_codes.some(c => !["phase_cancelled", "selected_phases_incomplete", "verification_cancelled"].includes(c)))
    fail("input_requalification_history_unknown");
  const git = gitAt(repositoryRoot);
  if (git(["rev-parse", `${a.head}^{tree}`]).toString().trim() !== a.tree) fail("input_requalification_source_changed");
  const h = createHash("sha256");
  if (!Array.isArray(original.executor.source_files) || !original.executor.source_files.length || original.executor.source_files.length > 200 ||
      !original.executor.source_files.every(safePath)) fail("input_requalification_source_changed");
  for (const name of [...original.executor.source_files].sort()) h.update(name).update("\0").update(git(["show", `${a.head}:${name}`])).update("\0");
  if (h.digest("hex") !== original.executor.source_fingerprint) fail("input_requalification_source_changed");
  const registered = git(["worktree", "list", "--porcelain"]).toString().split("\n").filter(x => x.startsWith("worktree ")).map(x => x.slice(9));
  const candidates = registered.filter(root => checkoutVerificationFingerprint(root) === original.checkout_ownership?.checkout_fingerprint);
  if (candidates.length !== 1) fail("input_requalification_original_checkout_unknown");
  const ownerFile = path.join(candidates[0], ".augnes-local-verification", "checkout-owner.json");
  if (lstatSync(ownerFile, { throwIfNoEntry: false })) {
    if (candidates[0] !== repositoryRoot || !checkoutOwner) fail("input_requalification_original_owner_active");
    assertCheckoutVerificationOwnership(checkoutOwner, repositoryRoot);
  }
  return { original, completion, family, resource, original_bytes_sha256: digest(originalBytes), attempt_record_sha256: digest(attemptBytes), completion_record_sha256: digest(completionBytes) };
}

// Complete bytes are local-only. Initially accept fully accounted additions of
// branch tracking pairs, not arbitrary config syntax or command/include changes.
export function validateBranchTrackingAddition(before, after) {
  const text = before.toString("utf8"), next = after.toString("utf8");
  if (!Buffer.from(text).equals(before) || !Buffer.from(next).equals(after) || before.includes(0) || after.includes(0) ||
      !after.subarray(0, before.length).equals(before) || after.length <= before.length)
    fail("input_requalification_change_unsupported");
  const suffix = next.slice(text.length);
  let parsedBefore, parsedAfter;
  try {
    // Read only the supplied bytes, without includes or global configuration.
    // Compare the complete interpretations, including repeated records, bare
    // versus empty values and continuation/comment boundaries. Values never
    // leave this function. Parsing the suffix alone cannot establish addition.
    const parse = input => execFileSync("git", ["config", "--no-includes", "--file", "-", "--null", "--list"], {
      input, timeout: 5000, maxBuffer: 2 * 1024 * 1024, stdio: ["pipe", "pipe", "pipe"],
    });
    parsedBefore = parse(before); parsedAfter = parse(after);
  } catch { fail("input_requalification_change_unsupported"); }
  const existingKeys = parsedBefore.toString("utf8").split("\0").filter(Boolean).map(row => row.split("\n", 1)[0]);
  const pattern = /\[branch "([A-Za-z0-9_./-]+)"\]\r?\n[\t ]+remote = origin\r?\n[\t ]+merge = refs\/heads\/([A-Za-z0-9_./-]+)\r?\n/gu;
  const matches = [...suffix.matchAll(pattern)];
  if (!matches.length || matches.length > 16 || matches.map(m => m[0]).join("") !== suffix ||
      matches.some(m => m[1] !== m[2] || m[1].includes("..") || m[1].startsWith("-") || m[1].endsWith(".") ||
        m[1].split("/").some(part => !part || part.startsWith(".") || part.endsWith(".lock")) || existingKeys.some(key => key.startsWith(`branch.${m[1]}.`))) ||
      new Set(matches.map(m => m[1])).size !== matches.length) fail("input_requalification_change_unsupported");
  const addedRecords = Buffer.from(matches.map(m => `branch.${m[1]}.remote\norigin\0branch.${m[1]}.merge\nrefs/heads/${m[1]}\0`).join(""));
  if (!parsedAfter.equals(Buffer.concat([parsedBefore, addedRecords]))) fail("input_requalification_change_unsupported");
  return matches.map(m => ({ branch_fingerprint: digest(m[1]), remote: "origin", merge_matches_branch: true }));
}

function completedSuiteResult(bytes, phase) {
  if (phase.status !== "pass") return null;
  // Legacy logs lack per-child policy flags. Their complete successful suite
  // return is the existing owner's acceptance decision (including explicit
  // natural-exit requirements), not merely a raw child exit observation.
  // A cancelled/partial suite provides no such decision: fail closed there.
  const lines = bytes.toString("utf8").split("\n");
  for (let n = lines.length - 1; n >= 0; n--) {
    if (!lines[n].startsWith("{")) continue;
    try {
      const summary = JSON.parse(lines.slice(n).join("\n"));
      return summary.suite === phase.id && summary.status === "pass" && Array.isArray(summary.results) &&
        new Set(summary.results.map(r => r.label)).size === summary.results.length ? summary : null;
    } catch { /* This may be an earlier resource record, not the final return. */ }
  }
  return null;
}

function inspectHistory(file, proof, original) {
  const review = JSON.parse(linked(file, proof.history_review));
  const expected = { receipt_fingerprint: proof.prior.receipt_fingerprint, input_fingerprint: proof.prior.input_fingerprint,
    first_fault_fingerprint: proof.prior.fault_fingerprint, events_fingerprint: digest(original.inputs.events),
    secondary_faults_fingerprint: digest(original.inputs.secondary_faults), phases_fingerprint: digest(original.phases) };
  if (review.schema !== "augnes.local-canonical-input-history-review.v1" || !reference(review.review_reference) || !time(review.reviewed_at) ||
      Date.parse(review.reviewed_at) > Date.now() || Object.entries(expected).some(([k, v]) => review[k] !== v) ||
      !same(review.independent_failures, []) || !same(review.unresolved, []) || review.safety_review !== "complete")
    fail("input_requalification_history_review_invalid");
  const phases = original.phases.filter(p => p.status !== "not_run");
  if (!Array.isArray(review.logs) || review.logs.length !== phases.length) fail("input_requalification_history_incomplete");
  const repositoryRoot = path.resolve(file.slice(0, -proof.local_relative_path.length));
  for (const [index, phase] of phases.entries()) {
    const entry = review.logs[index];
    if (!entry || entry.phase !== phase.id || entry.path !== phase.log?.relative_path || phase.log.truncated !== false || entry.bytes !== phase.log.bytes || !hash(entry.sha256))
      fail("input_requalification_history_incomplete");
    const bytes = readRequalificationArtifact(local(repositoryRoot, entry.path), 2 * 1024 * 1024);
    if (bytes.length !== entry.bytes || digest(bytes) !== entry.sha256) fail("input_requalification_log_changed");
    // Suite-owned result rows are actual acceptance evidence. Deliberate nested
    // negative controls have their own suite namespace, not this selected one.
    const rows = bytes.toString("utf8").split("\n").filter(l => l.startsWith(`[canonical:${phase.id}] `));
    const summary = completedSuiteResult(bytes, phase);
    const starts = new Set(), results = new Set();
    for (const row of rows) {
      if (row.includes(" child_start ") || row.includes(" child_result ")) {
        const label = / label=("(?:[^"\\]|\\.)*") /u.exec(row)?.[1];
        if (!label) fail("input_requalification_history_unknown");
        const collection = row.includes(" child_start ") ? starts : results;
        if (collection.has(label) || (collection === results && !starts.has(label))) fail("input_requalification_history_unknown");
        collection.add(label);
      }
      if (row.includes(" group_inventory ")) {
        let group; try { group = JSON.parse(row.split(" group_inventory ")[1]); } catch { fail("input_requalification_history_unknown"); }
        if (group.failed_count !== 0 || group.started_count !== group.settled_count || group.started_count !== group.completed_count ||
            !Array.isArray(group.children) || group.children.some(c => c.started && c.outcome !== "passed")) fail("input_requalification_independent_child_failure");
      }
      if (row.includes(" child_result ")) {
        const parsed = / child_result label=("(?:[^"\\]|\\.)*") duration_ms=([0-9]+) exit_code=(0) signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=([a-z_]+)$/u.exec(row);
        if (!parsed) fail("input_requalification_independent_child_failure");
        const result = { label: JSON.parse(parsed[1]), duration_ms: Number(parsed[2]), exit_code: 0, timed_out: false,
          exit_observed: true, streams_closed: true, cleanup_completed: true, remaining_owned_processes: 0, termination_reason: parsed[4] };
        const accepted = summary?.results.find(r => r.label === result.label);
        const ownerAccepted = accepted?.status === 0 && [undefined, false, true].includes(accepted.require_natural_exit) &&
          ["timed_out", "exit_observed", "streams_closed", "cleanup_completed", "remaining_owned_processes", "termination_reason"].every(key => accepted[key] === result[key]);
        if ((phase.status === "pass" && !ownerAccepted) || !successfulTermination(result.termination_reason) || canonicalChildAcceptanceFailure(result, {
          suite: phase.id, requireCompleteCleanup: true,
          requireNaturalExit: naturalExitRequired(phase) || !ownerAccepted || accepted.require_natural_exit === true,
        })) fail("input_requalification_independent_child_failure");
      }
      if (row.includes(" group_failure ") || row.includes(" reason=bounded_timeout") || row.includes(" remaining_owned_processes=unknown"))
        fail("input_requalification_independent_child_failure");
    }
    if (summary && (summary.results.length !== results.size || summary.results.some(r => !results.has(JSON.stringify(r.label)))))
      fail("input_requalification_history_incomplete");
    // A guard-cancelled outer process may stop before its final child-result
    // record. The settled outer owner accounts for at most the existing two
    // concurrent children; a passing phase may not omit any started result.
    if (starts.size - results.size > (phase.failure_code === "phase_cancelled" ? 2 : 0)) fail("input_requalification_history_incomplete");
  }
  return review;
}

export function inputAdoptionInventory(repositoryRoot, predecessor, main, head) {
  if (![predecessor, main, head].every(sha)) fail("input_requalification_source_invalid");
  const git = gitAt(repositoryRoot), base = git(["merge-base", predecessor, main]).toString().trim();
  if (!sha(base)) fail("input_requalification_ancestry_ambiguous");
  const entries = ref => new Map(git(["ls-tree", "-rz", "--full-tree", ref]).toString().split("\0").filter(Boolean).map(row => {
    const split = row.indexOf("\t"); return [row.slice(split + 1), row.slice(0, split)];
  }));
  const maps = [base, predecessor, main, head].map(entries);
  const inventory = [...new Set(maps.flatMap(m => [...m.keys()]))].sort().map(name => {
    if (!safePath(name)) fail("input_requalification_source_path_unsupported");
    const [b, p, m, t] = maps.map(map => map.get(name) ?? null);
    return { path: name, base: b, predecessor: p, main: m, target: t, divergent: p !== b && m !== b && p !== m };
  });
  return { merge_base: base, entries: inventory, fingerprint: digest(inventory),
    changed_paths: git(["diff", "--name-only", predecessor, head, "--"]).toString().trim().split("\n").filter(Boolean).sort(),
    delta_sha256: digest(git(["diff", "--binary", "--no-ext-diff", "--no-textconv", predecessor, head, "--"])) };
}

function isLineSubsequence(before, after) {
  const old = before.toString("utf8"), current = after.toString("utf8");
  if (!Buffer.from(old).equals(before) || !Buffer.from(current).equals(after) || old.includes("\0") || current.includes("\0")) return false;
  const lines = old.split("\n"); let i = 0;
  for (const line of current.split("\n")) if (line === lines[i]) i++;
  return i === lines.length;
}
function inspectSource(file, proof, original, completion) {
  const review = JSON.parse(linked(file, proof.source_review));
  const git = gitAt(path.resolve(file.slice(0, -proof.local_relative_path.length)));
  if (review.schema !== "augnes.local-canonical-input-source-review.v1" || review.kind !== proof.kind || review.head !== proof.head || review.tree !== proof.tree ||
      review.predecessor_head !== original.attempt.head || review.predecessor_tree !== original.attempt.tree || review.accepted_main !== proof.accepted_main ||
      !reference(review.review_reference) || review.source_review !== "complete" || !time(review.reviewed_at) ||
      Date.parse(review.reviewed_at) <= Date.parse(completion.finished_at) || Date.parse(review.reviewed_at) > Date.now() ||
      git(["rev-parse", `${proof.head}^{tree}`]).toString().trim() !== proof.tree)
    fail("input_requalification_source_review_invalid");
  git(["merge-base", "--is-ancestor", proof.accepted_main, proof.head]);
  if (proof.kind === "unchanged_source") {
    if (proof.head !== original.attempt.head || proof.tree !== original.attempt.tree || proof.accepted_main !== original.repository.base_sha || !same(review.overlaps, []))
      fail("input_requalification_source_changed");
    return review;
  }
  if (proof.head === original.attempt.head || proof.accepted_main === original.repository.base_sha ||
      git(["show", "-s", "--format=%P", proof.head]).toString().trim() !== `${original.attempt.head} ${proof.accepted_main}`)
    fail("input_requalification_adoption_parents_invalid");
  const inventory = inputAdoptionInventory(path.resolve(file.slice(0, -proof.local_relative_path.length)), original.attempt.head, proof.accepted_main, proof.head);
  if (review.merge_base !== inventory.merge_base || review.inventory_fingerprint !== inventory.fingerprint || review.delta_sha256 !== inventory.delta_sha256 ||
      !same(review.changed_paths, inventory.changed_paths) || !Array.isArray(review.overlaps) ||
      !same(review.task_assets, inventory.entries.filter(e => e.predecessor !== e.base && e.predecessor !== null).map(e => ({ path: e.path, entry: e.predecessor }))))
    fail("input_requalification_adoption_inventory_invalid");
  const divergent = inventory.entries.filter(e => e.divergent);
  if (review.overlaps.length !== divergent.length) fail("input_requalification_overlap_unreviewed");
  for (const entry of inventory.entries) {
    if (!entry.divergent) {
      if (entry.target !== (entry.predecessor === entry.base ? entry.main : entry.predecessor)) fail("input_requalification_lost_or_unreviewed_asset");
      continue;
    }
    const resolution = review.overlaps.find(r => r.path === entry.path);
    if (!resolution || !same(resolution.entries, entry) || !reference(resolution.review_reference) || resolution.kind !== "reviewed_additive_overlap" ||
        ![entry.predecessor, entry.main, entry.target].every(e => /^100(?:644|755) blob [0-9a-f]{40}$/u.test(e ?? "")) ||
        new Set([entry.predecessor, entry.main, entry.target].map(e => e?.split(" ")[0])).size !== 1)
      fail("input_requalification_overlap_unreviewed");
    const bytes = identity => git(["cat-file", "blob", identity.split(" ").at(-1)]);
    const priorBytes = bytes(entry.predecessor), mainBytes = bytes(entry.main), targetBytes = bytes(entry.target);
    const baseBytes = entry.base && /^100(?:644|755) blob [0-9a-f]{40}$/u.test(entry.base) ? bytes(entry.base) : null;
    if ((entry.base && !baseBytes) || !isLineSubsequence(priorBytes, targetBytes) || !isLineSubsequence(mainBytes, targetBytes) ||
        (baseBytes && (!isLineSubsequence(baseBytes, priorBytes) || !isLineSubsequence(baseBytes, mainBytes))))
      fail("input_requalification_lost_or_unreviewed_asset");
    const counts = buffer => {
      const result = new Map();
      for (const line of buffer?.toString("utf8").split("\n") ?? []) result.set(line, (result.get(line) ?? 0) + 1);
      return result;
    };
    const beforeCounts = counts(baseBytes), priorCounts = counts(priorBytes), mainCounts = counts(mainBytes);
    for (const [line, count] of counts(targetBytes)) {
      if (count > (priorCounts.get(line) ?? 0) + (mainCounts.get(line) ?? 0) - (beforeCounts.get(line) ?? 0))
        fail("input_requalification_unreviewed_resolution_content");
    }
    const witness = JSON.parse(linked(file, resolution.preservation));
    if (witness.schema !== "augnes.local-canonical-integration-preservation.v1" || witness.head !== proof.head || witness.tree !== proof.tree ||
        witness.delta_sha256 !== inventory.delta_sha256 || !Array.isArray(witness.paths) || !witness.paths.includes(entry.path) ||
        witness.node_version !== "24.18.0" || !time(witness.finished_at) || Date.parse(witness.finished_at) <= Date.parse(completion.finished_at) ||
        Date.parse(witness.finished_at) > Date.now() || witness.result?.exit_code !== 0 || witness.result?.cancelled !== false || witness.result?.timed_out !== false ||
        witness.result?.exit_observed !== true || witness.result?.streams_closed !== true || witness.result?.cleanup_completed !== true ||
        witness.result?.remaining_owned_processes !== 0 || witness.result?.termination_reason !== "natural_exit")
      fail("input_requalification_preservation_unproven");
  }
  return review;
}

export function inspectInputRequalification({ anchorRoot, repositoryRoot, branch, head, tree, acceptedMain, proof, inputs = null, checkoutOwner = null }) {
  const file = local(repositoryRoot, proof.local_relative_path), reread = readInputRequalificationProof(file, repositoryRoot);
  if (!same(reread, proof) || proof.branch !== branch || proof.head !== head || proof.tree !== tree || proof.accepted_main !== acceptedMain)
    fail("input_requalification_target_changed");
  const predecessor = inspectInputPredecessor({ anchorRoot, repositoryRoot, receiptPath: proof.prior.receipt_path, checkoutOwner });
  const { original, completion, resource } = predecessor, a = original.attempt;
  if (proof.prior.family_id !== a.family_id || proof.prior.attempt_id !== a.attempt_id || proof.prior.receipt_fingerprint !== original.integrity.content_fingerprint ||
      proof.prior.input_fingerprint !== original.inputs.fingerprint || proof.prior.fault_fingerprint !== digest(original.inputs.first_fault) || a.branch !== branch ||
      proof.prior.receipt_bytes_sha256 !== predecessor.original_bytes_sha256 || proof.prior.attempt_record_sha256 !== predecessor.attempt_record_sha256 ||
      proof.prior.completion_record_sha256 !== predecessor.completion_record_sha256)
    fail("input_requalification_predecessor_changed");
  const history = inspectHistory(file, proof, original);
  if (Date.parse(history.reviewed_at) <= Date.parse(completion.finished_at)) fail("input_requalification_review_predates_settlement");
  const current = observeInputFile(path.join(anchorRoot, ".git", "config"));
  if (!same(proof.input?.current_observation, current) || proof.input?.current_observation_fingerprint !== digest(current) ||
      proof.input?.resource !== "git-config" || proof.input?.change_kind !== "additive_branch_tracking" || !Array.isArray(proof.input.snapshots))
    fail("input_requalification_current_input_changed");
  const observations = [resource.before, ...original.inputs.events.filter(e => e.resource === "git-config").map(e => e.after), current];
  const unique = [...new Set(observations.map(o => o.sha256))];
  if (proof.input.snapshots.length !== unique.length || proof.input.snapshots.some((s, n) => s.sha256 !== unique[n]))
    fail("input_requalification_change_incomplete");
  const snapshots = new Map(proof.input.snapshots.map(s => {
    const bytes = linked(file, s, 1024 * 1024);
    if (bytes.length !== s.bytes) fail("input_requalification_change_incomplete");
    return [s.sha256, bytes];
  }));
  for (let n = 0; n < observations.length; n++) {
    const o = observations[n];
    if (snapshots.get(o.sha256)?.length !== Number(o.metadata?.bytes) ||
        ["mode", "uid", "gid", "device", "links"].some(k => o.metadata?.[k] !== resource.before.metadata[k]) || o.metadata.links !== "1")
      fail("input_requalification_input_safety_changed");
    if (n && o.sha256 !== observations[n - 1].sha256) validateBranchTrackingAddition(snapshots.get(observations[n - 1].sha256), snapshots.get(o.sha256));
  }
  const authority = proof.authority;
  if (!reference(authority?.reference) || authority.decision !== "authorize_prospective_input_requalification" || authority.scope !== "one_complete_invocation" ||
      authority.head !== head || authority.tree !== tree || authority.base !== acceptedMain || authority.current_input_fingerprint !== digest(current) ||
      authority.historical_writer !== "UNKNOWN" || !same(authority.unresolved_risks, []) || !time(authority.issued_at) ||
      Date.parse(authority.issued_at) <= Date.parse(completion.finished_at) || Date.parse(authority.issued_at) > Date.now())
    fail("input_requalification_authority_missing");
  inspectSource(file, proof, original, completion);
  if (inputs) {
    if (inputs.binding?.head !== head || inputs.binding?.tree !== tree || inputs.binding?.input_requalification !== digest(proof) ||
        !Array.isArray(inputs.resources) || !same(inputs.resources.find(r => r.id === "git-config")?.before, current)) fail("input_requalification_freeze_mismatch");
    for (const resource of inputRequalificationResources({ repositoryRoot, anchorRoot, proof })) {
      const declared = inputs.resources.find(r => r.id === resource.id);
      if (declared?.classification !== "execution" || declared.metadataOnly || declared.excludePreferences || declared.readOnlyExecutable ||
          declared.location_fingerprint !== digest(resource.file) || !same(declared.before, observeInputFile(resource.file)))
        fail("input_requalification_freeze_mismatch");
    }
  }
  return { ...predecessor, proof_fingerprint: digest(proof), authority_fingerprint: digest(authority), current_input_fingerprint: digest(current) };
}

// Use the ordinary authenticated-main owner again immediately before spending.
// The injectable transport is the existing disposable-repository test seam.
export async function renewInputRequalificationBase({ repositoryRoot, proof, transport }) {
  const admission = await admitIntegrationBase({ repositoryRoot, baseSha: proof.accepted_main, headSha: proof.head, ...(transport ? { transport } : {}) });
  if (admission.status !== "admitted") throw Object.assign(new Error(admission.reason_code), { code: admission.reason_code, integrationBase: admission });
  return admission;
}
