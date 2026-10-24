import { mkdirSync, lstatSync, readFileSync, readdirSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import { digest } from "./local-canonical-inputs.mjs";
import { assertCheckoutVerificationOwnership } from "./local-canonical-checkout-ownership.mjs";

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
function read(file) {
  const s = lstatSync(file);
  if (!s.isFile() || s.isSymbolicLink() || s.nlink !== 1 || s.size > 64 * 1024) throw fail("attempt_unsafe_record");
  return JSON.parse(readFileSync(file, "utf8"));
}
function append(root, name, value) { writeFileSync(path.join(root, name), `${JSON.stringify(value)}\n`, { flag: "wx", mode: 0o600 }); }

// Family lives at the physical anchor, keyed by repository and branch (not
// commit, wrapper process or checkout). There is no CLI family-id reset knob.
export function beginAttempt({ anchorRoot, repositoryRoot, checkoutOwner, branch, head, tree, runId, contractFingerprint, recoveryProof = null }) {
  assertCheckoutVerificationOwnership(checkoutOwner, repositoryRoot);
  if (!branch || !/^[0-9a-f]{40}$/u.test(head) || !/^[0-9a-f]{40}$/u.test(tree) || !sha(contractFingerprint)) throw fail("attempt_identity_invalid");
  const familyId = digest([ATTEMPT_CONTRACT, "hynk-studio/augnes", branch]);
  const artifact = directory(anchorRoot, ".augnes-local-verification");
  const root = directory(directory(artifact, "families"), familyId);
  const entries = readdirSync(root);
  if (entries.some(name => !/^(attempt|completion)-[12]\.json$/u.test(name))) throw fail("attempt_unknown_record");
  const previous = entries.includes("attempt-1.json") ? read(path.join(root, "attempt-1.json")) : null;
  let number = 1, prior = null;
  if (previous) {
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
    recovery: number === 2 ? recoveryProof : null, budget: { initial: 1, recovery: 1 } };
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

export function inspectAttemptRecords({ anchorRoot, receipt }) {
  try {
    const attempt = receipt.attempt;
    const familyId = digest([ATTEMPT_CONTRACT, "hynk-studio/augnes", receipt.repository.branch]);
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

// A deliberate source correction needs a separately reviewed new family
// disposition; cosmetic commits, renaming a wrapper or repeat CLI calls never
// silently reset this branch's budget. This increment exposes no reset command.
