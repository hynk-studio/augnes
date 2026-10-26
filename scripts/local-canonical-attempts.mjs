import { mkdirSync, lstatSync, readFileSync, readdirSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { digest } from "./local-canonical-inputs.mjs";
import { assertCheckoutVerificationOwnership } from "./local-canonical-checkout-ownership.mjs";
import { CANONICAL_NODE_VERSION } from "./local-canonical-environment.mjs";

export const ATTEMPT_CONTRACT = "augnes.local-canonical-attempt-family.v1";
const fail = code => Object.assign(new Error(code), { code });
const sha = value => /^[0-9a-f]{64}$/u.test(value ?? "");
const capabilities = new WeakMap();

function directory(parent, name) {
  const target = path.join(parent, name);
  try { mkdirSync(target, { mode: 0o700 }); } catch (e) { if (e.code !== "EEXIST") throw e; }
  const s = lstatSync(target);
  if (!s.isDirectory() || s.isSymbolicLink() || realpathSync(target) !== target || (s.mode & 0o022)) throw fail("attempt_unsafe_directory");
  return target;
}
function read(file, maximum = 64 * 1024) {
  const s = lstatSync(file);
  if (!s.isFile() || s.isSymbolicLink() || s.nlink !== 1 || s.size > maximum) throw fail("attempt_unsafe_record");
  return JSON.parse(readFileSync(file, "utf8"));
}
function append(root, name, value) { writeFileSync(path.join(root, name), `${JSON.stringify(value)}\n`, { flag: "wx", mode: 0o600 }); }

// Family lives at the physical anchor, keyed by repository and branch (not
// commit, wrapper process or checkout). There is no CLI family-id reset knob.
export function beginAttempt({ anchorRoot, repositoryRoot, checkoutOwner, branch, head, tree, runId, contractFingerprint, recoveryProof = null, sourceCorrection = null, acceptedMain = null }) {
  assertCheckoutVerificationOwnership(checkoutOwner, repositoryRoot);
  if (!branch || !/^[0-9a-f]{40}$/u.test(head) || !/^[0-9a-f]{40}$/u.test(tree) || !sha(contractFingerprint)) throw fail("attempt_identity_invalid");
  const familyId = candidateFamilyId(branch, sourceCorrection);
  const artifact = directory(anchorRoot, ".augnes-local-verification");
  if (sourceCorrection) admitSourceCorrection({ anchorRoot, repositoryRoot, branch, head, tree, proof: sourceCorrection, acceptedMain, reserve: true });
  const root = directory(directory(artifact, "families"), familyId);
  const entries = readdirSync(root);
  if (entries.some(name => !/^(attempt|completion)-[12]\.json$/u.test(name) && name !== "correction-successor.json")) throw fail("attempt_unknown_record");
  const previous = entries.includes("attempt-1.json") ? read(path.join(root, "attempt-1.json")) : null;
  let number = 1, prior = null;
  if (previous) {
    if (entries.includes("correction-successor.json")) throw fail("attempt_candidate_superseded");
    if (entries.includes("attempt-2.json") || !entries.includes("completion-1.json")) throw fail("attempt_budget_or_unsettled");
    prior = read(path.join(root, "completion-1.json"));
    if (prior.attempt_id !== previous.attempt_id || prior.disposition !== "infrastructure_interruption" || prior.cleanup_complete !== true ||
        previous.head !== head || previous.tree !== tree || !sha(prior.receipt_fingerprint) ||
        !validRecoveryProof(recoveryProof, prior)) throw fail("attempt_recovery_not_supported");
    number = 2;
  } else if (recoveryProof || entries.length) throw fail("attempt_missing_predecessor");
  const record = { contract: ATTEMPT_CONTRACT, family_id: familyId, attempt_id: runId, number, branch,
    head, tree, contract_fingerprint: contractFingerprint, started_at: new Date().toISOString(),
    prior_attempt_id: prior?.attempt_id ?? null, prior_receipt_fingerprint: prior?.receipt_fingerprint ?? null,
    recovery: number === 2 ? recoveryProof : null, source_correction: sourceCorrection, budget: { initial: 1, recovery: 1 } };
  append(root, `attempt-${number}.json`, record);
  const capability = Object.freeze({ ...record });
  capabilities.set(capability, { root, repositoryRoot, checkoutOwner, record });
  return capability;
}

export function validRecoveryProof(proof, prior) {
  return proof?.schema === "augnes.local-canonical-infrastructure-repair.v1" &&
    proof.prior_attempt_id === prior.attempt_id && proof.prior_receipt_fingerprint === prior.receipt_fingerprint &&
    proof.cause === "child_spawn_failure" && proof.observed_code === prior.infrastructure_code &&
    ["ENOENT", "EAGAIN", "EMFILE", "ENFILE", "ENOSPC"].includes(proof.observed_code) &&
    typeof proof.remedy === "string" && /^[a-z0-9_-]{1,80}$/u.test(proof.remedy) &&
    sha(proof.evidence_sha256) && proof.probe?.exit_status === 0 && proof.probe?.cleanup_complete === true &&
    sha(proof.probe?.artifact_sha256) && Number.isFinite(Date.parse(proof.probe?.finished_at)) &&
    Date.parse(proof.probe.finished_at) > Date.parse(prior.finished_at) && proof.scope === "task_owned";
}

export function finishAttempt(capability, { receiptFingerprint, disposition, cleanupComplete, infrastructureCode = null }) {
  const state = capabilities.get(capability);
  if (!state || !sha(receiptFingerprint)) throw fail("attempt_capability_invalid");
  // The executor has settled and released its resource lease before finalizing
  // a receipt. This in-process capability only appends that attempt's completion;
  // it cannot acquire resources or alter any earlier record.
  if (realpathSync(state.root) !== state.root || !lstatSync(state.root).isDirectory()) throw fail("attempt_unsafe_directory");
  const original = read(path.join(state.root, `attempt-${state.record.number}.json`));
  if (JSON.stringify(original) !== JSON.stringify(state.record)) throw fail("attempt_record_changed");
  append(state.root, `completion-${state.record.number}.json`, { contract: ATTEMPT_CONTRACT,
    attempt_id: state.record.attempt_id, receipt_fingerprint: receiptFingerprint, disposition,
    cleanup_complete: cleanupComplete, infrastructure_code: infrastructureCode, finished_at: new Date().toISOString() });
  capabilities.delete(capability);
}

export function readRecoveryProof(file) {
  const proof = read(file);
  for (const [key, expected] of [["cause_artifact", proof.evidence_sha256], ["probe_artifact", proof.probe?.artifact_sha256]]) {
    const name = proof[key];
    if (typeof name !== "string" || !/^[a-z0-9_-]+\.json$/u.test(name) || !sha(expected)) throw fail("attempt_repair_evidence_missing");
    const artifact = path.join(path.dirname(file), name);
    read(artifact); // type/link/size checks before hashing
    if (digest(readFileSync(artifact)) !== expected) throw fail("attempt_repair_evidence_changed");
  }
  const cause = read(path.join(path.dirname(file), proof.cause_artifact));
  const probe = read(path.join(path.dirname(file), proof.probe_artifact));
  if (cause.prior_receipt_fingerprint !== proof.prior_receipt_fingerprint || cause.spawn_error_code !== proof.observed_code ||
      probe.exit_code !== 0 || probe.timed_out !== false || probe.cancelled !== false || probe.cleanup_completed !== true ||
      probe.remaining_owned_processes !== 0 || probe.streams_closed !== true || probe.termination_reason !== "natural_exit") throw fail("attempt_repair_evidence_invalid");
  return proof;
}

export function inspectAttemptRecords({ anchorRoot, repositoryRoot = anchorRoot, receipt }) {
  try {
    const attempt = receipt.attempt;
    const familyId = candidateFamilyId(receipt.repository.branch, attempt.source_correction);
    if (attempt.source_correction) admitSourceCorrection({ anchorRoot, repositoryRoot, branch: receipt.repository.branch,
      head: attempt.head, tree: attempt.tree, proof: attempt.source_correction, acceptedMain: receipt.repository.base_sha, reserve: false });
    if (attempt.family_id !== familyId || ![1, 2].includes(attempt.number)) return false;
    const root = path.join(anchorRoot, ".augnes-local-verification", "families", familyId);
    if (realpathSync(root) !== root || !lstatSync(root).isDirectory()) return false;
    const original = read(path.join(root, `attempt-${attempt.number}.json`));
    const completion = read(path.join(root, `completion-${attempt.number}.json`));
    if (digest(original) !== digest(attempt) || completion.attempt_id !== receipt.run.id ||
        completion.receipt_fingerprint !== receipt.integrity.content_fingerprint ||
        completion.disposition !== receipt.outcome.disposition || completion.cleanup_complete !== receipt.cleanup.completed) return false;
    if (attempt.number === 2) {
      const prior = read(path.join(root, "completion-1.json"));
      if (prior.disposition !== "infrastructure_interruption" || !validRecoveryProof(attempt.recovery, prior)) return false;
    }
    return true;
  } catch { return false; }
}

function candidateFamilyId(branch, correction) {
  return digest([ATTEMPT_CONTRACT, "hynk-studio/augnes", branch,
    ...(correction ? ["verified_source_correction", correction.prior_attempt_id, correction.head, correction.tree] : [])]);
}

// A real source correction is a new candidate, never an infrastructure retry.
// It requires the same finite regression to fail on the old module and pass on
// the corrected module. Proof artifacts and Git objects remain independently
// inspectable. This is local evidence, not independent attestation.
export function readSourceCorrectionProof(file, repositoryRoot) {
  const relative = path.relative(repositoryRoot, file).split(path.sep).join("/");
  if (!/^\.augnes-local-verification\/[a-zA-Z0-9_./-]+\.json$/u.test(relative) || relative.split("/").includes("..") || realpathSync(file) !== file)
    throw fail("source_correction_unsafe_path");
  const proof = read(file);
  const version2 = proof.schema === "augnes.local-canonical-source-correction.v2";
  if (version2) readCandidateReview(file, proof);
  if (version2 && proof.kind === "accepted_main_integration") return { ...proof, local_relative_path: relative };
  if ((!version2 && proof.schema !== "augnes.local-canonical-source-correction.v1") ||
      !(version2 ? /^(?:next\.config\.ts|(?:scripts|app|lib|plugins|apps|src)\/[a-zA-Z0-9_./-]+\.(?:mjs|cjs|js|ts|tsx))$/u : /^scripts\/[a-z0-9_/-]+\.mjs$/u).test(proof.source_module ?? "") || (proof.source_module ?? "").split("/").includes("..") ||
      !/^[a-z][a-z0-9_-]{0,79}$/u.test(proof.defect ?? "") || !sha(proof.fixture_sha256) ||
      !sha(proof.prior_family_id) || ![1, 2].includes(proof.prior_number) || !sha(proof.prior_receipt_fingerprint)) throw fail("source_correction_proof_invalid");
  if (!/^[a-z0-9_-]+\.mjs$/u.test(proof.fixture_artifact ?? "") || !sha(proof.environment_fingerprint)) throw fail("source_correction_fixture_missing");
  const fixture = path.join(path.dirname(file), proof.fixture_artifact), fixtureStat = lstatSync(fixture);
  if (!fixtureStat.isFile() || fixtureStat.isSymbolicLink() || fixtureStat.nlink !== 1 || fixtureStat.size > 64 * 1024 ||
      digest(readFileSync(fixture)) !== proof.fixture_sha256) throw fail("source_correction_fixture_changed");
  for (const [key, expectedExit] of [["before", 1], ["after", 0]]) {
    const witness = proof[key];
    if (!witness || !/^[a-z0-9_-]+\.json$/u.test(witness.artifact ?? "") || !sha(witness.sha256)) throw fail("source_correction_witness_missing");
    const location = path.join(path.dirname(file), witness.artifact), record = read(location);
    if (digest(readFileSync(location)) !== witness.sha256 || record.fixture_sha256 !== proof.fixture_sha256 || record.environment_fingerprint !== proof.environment_fingerprint ||
        record.source_sha256 !== witness.source_sha256 || !sha(witness.source_sha256) || record.result?.exit_code !== expectedExit ||
        record.result?.cancelled !== false || record.result?.timed_out !== false || record.result?.cleanup_completed !== true ||
        record.result?.exit_observed !== true || record.result?.streams_closed !== true || record.result?.remaining_owned_processes !== 0 ||
        record.result?.termination_reason !== "natural_exit" || record.node_version !== CANONICAL_NODE_VERSION ||
        !Number.isFinite(Date.parse(record.finished_at)) || Date.parse(record.finished_at) > Date.now()) throw fail("source_correction_witness_invalid");
    if (key === "after" && Date.parse(record.finished_at) <= Date.parse(read(path.join(path.dirname(file), proof.before.artifact)).finished_at)) throw fail("source_correction_witness_order_invalid");
  }
  if (proof.before.source_sha256 === proof.after.source_sha256) throw fail("source_correction_no_functional_delta");
  return { ...proof, local_relative_path: relative.split(path.sep).join("/") };
}

function admitSourceCorrection({ anchorRoot, repositoryRoot, branch, head, tree, proof, acceptedMain, reserve }) {
  const reread = readSourceCorrectionProof(path.join(repositoryRoot, proof.local_relative_path ?? ""), repositoryRoot);
  if (digest(reread) !== digest(proof) || proof.branch !== branch || proof.head !== head || proof.tree !== tree ||
      !/^[0-9a-f]{40}$/u.test(head) || !/^[0-9a-f]{40}$/u.test(tree)) throw fail("source_correction_identity_invalid");
  const priorRoot = path.join(anchorRoot, ".augnes-local-verification", "families", proof.prior_family_id);
  if (realpathSync(priorRoot) !== priorRoot) throw fail("source_correction_unsafe_predecessor");
  const prior = read(path.join(priorRoot, `attempt-${proof.prior_number}.json`));
  const completion = read(path.join(priorRoot, `completion-${proof.prior_number}.json`));
  if (prior.branch !== branch || prior.attempt_id !== proof.prior_attempt_id || prior.head === head || prior.tree === tree ||
      completion.attempt_id !== prior.attempt_id || completion.receipt_fingerprint !== proof.prior_receipt_fingerprint ||
      completion.cleanup_complete !== true ||
      readdirSync(priorRoot).includes(`attempt-${proof.prior_number + 1}.json`) ||
      !(proof.schema === "augnes.local-canonical-source-correction.v2" ?
        (proof.kind === "verifier_correction" ? ["safety_violation", "input_invalidation"] : proof.kind === "accepted_main_integration" ? ["completed_success"] : ["completed_success", "product_failure", "user_cancellation"]) :
        ["product_failure", "user_cancellation"]).includes(completion.disposition)) throw fail("source_correction_predecessor_invalid");
  const git = args => execFileSync("git", args, { cwd: repositoryRoot, timeout: 10000, maxBuffer: 16 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
  git(["merge-base", "--is-ancestor", prior.head, head]);
  if (git(["rev-parse", `${head}^{tree}`]).toString().trim() !== tree) throw fail("source_correction_source_mismatch");
  if (proof.schema === "augnes.local-canonical-source-correction.v2") {
    const proofFile = path.join(repositoryRoot, proof.local_relative_path);
    const review = readCandidateReview(proofFile, proof);
    const originalFile = path.join(repositoryRoot, proof.prior_receipt_path);
    if (realpathSync(originalFile) !== originalFile) throw fail("candidate_prior_receipt_unsafe");
    const original = read(originalFile, 512 * 1024), originalValue = { ...original }; delete originalValue.integrity;
    if (digest(originalValue) !== proof.prior_receipt_fingerprint || original.integrity?.content_fingerprint !== proof.prior_receipt_fingerprint ||
        original.run?.id !== prior.attempt_id || original.repository?.head_sha !== prior.head || original.repository?.tree_sha !== prior.tree ||
        original.outcome?.disposition !== completion.disposition || original.cleanup?.completed !== true ||
        review.predecessor_head !== prior.head || review.predecessor_tree !== prior.tree ||
        Date.parse(review.reviewed_at) <= Date.parse(completion.finished_at) ||
        review.delta_sha256 !== digest(git(["diff", "--binary", "--no-ext-diff", "--no-textconv", prior.head, head, "--"])) ||
        digest(review.changed_paths) !== digest(git(["diff", "--name-only", prior.head, head, "--"]).toString().trim().split("\n").sort()))
      throw fail("candidate_review_binding_invalid");
    if (proof.kind === "verifier_correction" && (!VERIFIER_MODULES.includes(proof.source_module) ||
        original.inputs?.first_fault?.disposition !== completion.disposition || review.addresses_disposition !== completion.disposition ||
        review.prior_fault_fingerprint !== digest(original.inputs.first_fault) || review.addresses_resource !== original.inputs.first_fault.resource))
      throw fail("candidate_guard_correction_unproven");
    if (proof.kind === "accepted_main_integration") {
      if (!/^[0-9a-f]{40}$/u.test(acceptedMain ?? "") || proof.accepted_main !== acceptedMain || original.repository.base_sha === acceptedMain ||
          git(["show", "-s", "--format=%P", head]).toString().trim() !== `${prior.head} ${acceptedMain}` ||
          !matchesReadOnlyMergeTree(git, prior.head, acceptedMain, head))
        throw fail("candidate_integration_unproven");
      git(["merge-base", "--is-ancestor", acceptedMain, head]);
    }
  }
  if (!(proof.schema === "augnes.local-canonical-source-correction.v2" && proof.kind === "accepted_main_integration")) {
    const beforeWitness = read(path.join(path.dirname(path.join(repositoryRoot, proof.local_relative_path)), proof.before.artifact));
    if (Date.parse(beforeWitness.finished_at) <= Date.parse(completion.finished_at)) throw fail("source_correction_witness_predates_settlement");
    if (digest(git(["show", `${prior.head}:${proof.source_module}`])) !== proof.before.source_sha256 ||
        digest(git(["show", `${head}:${proof.source_module}`])) !== proof.after.source_sha256) throw fail("source_correction_source_mismatch");
  }
  const successor = { family_id: candidateFamilyId(branch, proof), head, tree, proof_fingerprint: digest(proof) };
  const reservation = path.join(priorRoot, "correction-successor.json");
  if (reserve) {
    try { append(priorRoot, "correction-successor.json", successor); }
    catch (error) { if (error.code !== "EEXIST") throw error; }
  }
  if (digest(read(reservation)) !== digest(successor)) throw fail("source_correction_successor_already_bound");
}

const VERIFIER_MODULES = Object.freeze([
  "scripts/local-canonical-inputs.mjs", "scripts/local-canonical-browser-identity.mjs",
  "scripts/local-canonical-attempts.mjs", "scripts/local-canonical-receipt.mjs",
  "scripts/run-local-canonical-verification.mjs",
]);

// A retained source-review record is an auditable scope/input binding, not a
// signature, semantic proof, independent attestation or grant of authority.
// All actual permission still comes from the task. No hash-only reset exists.
function readCandidateReview(file, proof) {
  if (!["source_revision", "verifier_correction", "accepted_main_integration"].includes(proof.kind) ||
      !sha(proof.prior_family_id) || ![1, 2].includes(proof.prior_number) || !sha(proof.prior_receipt_fingerprint) ||
      !/^\.augnes-local-verification\/receipts\/[A-Za-z0-9_-]+\.json$/u.test(proof.prior_receipt_path ?? "") ||
      !/^[a-z0-9_-]+\.json$/u.test(proof.review?.artifact ?? "") || !sha(proof.review?.sha256)) throw fail("candidate_review_missing");
  const location = path.join(path.dirname(file), proof.review.artifact), review = read(location);
  if (digest(readFileSync(location)) !== proof.review.sha256 || review.schema !== "augnes.local-canonical-candidate-review.v1" ||
      review.head !== proof.head || review.tree !== proof.tree || review.kind !== proof.kind ||
      review.source_review !== "complete" || !sha(review.delta_sha256) ||
      !Array.isArray(review.changed_paths) || review.changed_paths.length === 0 || review.changed_paths.length > 200 ||
      !review.changed_paths.every(p => typeof p === "string" && /^[A-Za-z0-9_./-]+$/u.test(p) && !p.split("/").includes("..")) ||
      typeof review.authority_reference !== "string" || !/^https:\/\/github\.com\/hynk-studio\/augnes\/(?:issues|pull)\/[0-9]+(?:#[A-Za-z0-9_-]+)?$/u.test(review.authority_reference) ||
      !Number.isFinite(Date.parse(review.reviewed_at)) || Date.parse(review.reviewed_at) > Date.now()) throw fail("candidate_review_invalid");
  return review;
}

// Stock validation must not run a merge command or write Git objects. Resolve a
// bounded non-overlapping (or identical-overlap) merge from existing tree entries.
// Other conflict/resolution cases require an explicit behavioral correction proof.
function matchesReadOnlyMergeTree(git, predecessor, main, head) {
  const base = git(["merge-base", predecessor, main]).toString().trim();
  const entries = ref => new Map(git(["ls-tree", "-rz", "--full-tree", ref]).toString().split("\0").filter(Boolean).map(row => {
    const split = row.indexOf("\t"); return [row.slice(split + 1), row.slice(0, split)];
  }));
  const ancestor = entries(base), prior = entries(predecessor), accepted = entries(main), actual = entries(head), expected = new Map();
  for (const name of new Set([...ancestor.keys(), ...prior.keys(), ...accepted.keys()])) {
    const b = ancestor.get(name), p = prior.get(name), m = accepted.get(name);
    if (p !== b && m !== b && p !== m) return false;
    const value = p === b ? m : p;
    if (value !== undefined) expected.set(name, value);
  }
  return actual.size === expected.size && [...expected].every(([name, value]) => actual.get(name) === value);
}
