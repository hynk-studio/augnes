import { CLOSEOUT_SCHEMA, CLOSEOUT_CONTINUATION_SCHEMA, CLOSEOUT_CONTINUATION_KIND, CLOSEOUT_SCOPE_CORRECTION_KIND, isCloseoutScopeCorrection, isCloseout, isCloseoutContinuation, isAnyCloseout, hasCloseoutMarker, readCloseoutEvidence, closeoutArtifact, assertCloseoutAuthorization, validCloseoutAttempt } from "./local-canonical-1559-closeout.mjs";
import { COMPANION_TIMEOUT_SCHEMA, isCompanionTimeout, readCompanionTimeoutEvidence, companionArtifact, assertCompanionTimeoutAuthorization, validCompanionTimeoutAttempt } from "./local-canonical-companion-timeout-succession.mjs";
import { mkdirSync, lstatSync, readFileSync, readdirSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { digest } from "./local-canonical-inputs.mjs";
import { assertCheckoutVerificationOwnership } from "./local-canonical-checkout-ownership.mjs";
import { CANONICAL_NODE_VERSION } from "./local-canonical-environment.mjs";
import { readBrowserInputBinding } from "./local-canonical-browser-input.mjs";
import { BROWSER_REPLACEMENT_CONTRACT, assertBrowserReplacementAuthorization, validateBrowserReplacementLive, validateStrictBrowserLive, isStrictBrowserSourceRevision } from "./local-canonical-browser-replacement.mjs";

import { OBSERVER_REPAIR_SCHEMA, isObserverRepair, readObserverRepairEvidence, observerArtifact, assertObserverRepairAuthorization, validObserverAttempt } from "./local-canonical-observer-succession.mjs";
import { TIMEOUT_REPAIR_SCHEMA, isCorrectedTimeout, readTimeoutRepairEvidence, timeoutArtifact, assertCorrectedTimeoutAuthorization, validTimeoutAttempt } from "./local-canonical-timeout-succession.mjs";
import { CONDITION_REQUALIFICATION_SCHEMA, isConditionRequalification, readConditionRequalificationEvidence, conditionArtifact, assertConditionRequalificationAuthorization, validConditionRequalificationAttempt } from "./local-canonical-condition-requalification.mjs";

import { GUIDE_CORRECTION_SCHEMA, isGuideCorrection, readGuideCorrectionEvidence, guideArtifact, assertGuideCorrectionAuthorization, validGuideCorrectionAttempt } from "./local-canonical-guide-correction.mjs";

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
export function beginAttempt({ anchorRoot, repositoryRoot, checkoutOwner, branch, head, tree, runId, contractFingerprint, recoveryProof = null, sourceCorrection = null, browserReplacement = null, browserAuthorization = null, browserLive = null, acceptedMain = null, observerAuthorization = null, timeoutAuthorization = null, conditionAuthorization = null, guideAuthorization = null, companionTimeoutAuthorization = null, closeoutAuthorization = null }) {
  assertCheckoutVerificationOwnership(checkoutOwner, repositoryRoot);
  if (!branch || !/^[0-9a-f]{40}$/u.test(head) || !/^[0-9a-f]{40}$/u.test(tree) || !sha(contractFingerprint)) throw fail("attempt_identity_invalid");
  if ([recoveryProof, sourceCorrection, browserReplacement].filter(Boolean).length > 1) throw fail("attempt_mixed_successor_kind");
  const strictSource = isStrictBrowserSourceRevision(sourceCorrection);
  const familyId = candidateFamilyId(branch, sourceCorrection, browserReplacement);
  const artifact = directory(anchorRoot, ".augnes-local-verification");
  if (sourceCorrection && read(path.join(anchorRoot, ".augnes-local-verification", "families", sourceCorrection.prior_family_id, `attempt-${sourceCorrection.prior_number}.json`)).branch !== branch) throw fail("source_correction_predecessor_invalid");
  if (sourceCorrection || browserReplacement) {
    const tip = reconstructAttemptTip({ anchorRoot, branch });
    const proof = sourceCorrection ?? browserReplacement;
    if (tip.family_id !== proof.prior_family_id || tip.number !== proof.prior_number || tip.attempt_id !== proof.prior_attempt_id ||
        (tip.observer_repair_consumed || tip.corrected_timeout_consumed || tip.guide_correction_consumed || tip.closeout_scope_correction_consumed || (tip.closeout_continuation_consumed && !isCloseoutScopeCorrection(sourceCorrection)) || (tip.closeout_consumed && !isCloseoutContinuation(sourceCorrection) && !isCloseoutScopeCorrection(sourceCorrection)) || (tip.companion_timeout_consumed && !isAnyCloseout(sourceCorrection)) ||
          (isCloseout(sourceCorrection) && !tip.companion_timeout_consumed) ||
          (isCloseoutContinuation(sourceCorrection) && !tip.closeout_consumed) ||
          (isCloseoutScopeCorrection(sourceCorrection) && !tip.closeout_continuation_consumed) ||
          (tip.condition_requalification_consumed && !isGuideCorrection(sourceCorrection)) ||
          (isGuideCorrection(sourceCorrection) && !tip.condition_requalification_consumed) || (browserReplacement ? tip.input_replacement_consumed : tip.input_replacement_consumed !== strictSource))) throw fail("attempt_latest_tip_required");
  }
  if (sourceCorrection) admitSourceCorrection({ anchorRoot, repositoryRoot, branch, head, tree, proof: sourceCorrection, acceptedMain, browserAuthorization, browserLive, observerAuthorization, timeoutAuthorization, conditionAuthorization, guideAuthorization, companionTimeoutAuthorization, closeoutAuthorization, reserve: true });
  if (browserReplacement) {
    assertBrowserReplacementAuthorization(browserReplacement, browserAuthorization);
    validateBrowserReplacementLive({ ...browserLive, proof: browserReplacement, repositoryRoot, branch, head, tree, base: acceptedMain });
    const priorRoot = path.join(anchorRoot, ".augnes-local-verification", "families", browserReplacement.prior_family_id);
    const prior = read(path.join(priorRoot, `attempt-${browserReplacement.prior_number}.json`));
    const completion = read(path.join(priorRoot, `completion-${browserReplacement.prior_number}.json`));
    if (completion.contract !== ATTEMPT_CONTRACT || !Number.isFinite(Date.parse(completion.finished_at)) ||
        prior.attempt_id !== browserReplacement.prior_attempt_id || completion.attempt_id !== prior.attempt_id || completion.receipt_fingerprint !== browserReplacement.prior_receipt_fingerprint ||
        completion.disposition !== "safety_violation" || completion.cleanup_complete !== true ||
        Date.parse(browserAuthorization.observations.review.timestamp) <= Date.parse(completion.finished_at)) throw fail("browser_replacement_predecessor_unsettled");
    // One namespace for all kinds. Even an identical claim cannot be replayed
    // after a crash; only inspection may read an existing immutable edge.
    append(priorRoot, "correction-successor.json", browserSuccessor(branch, browserReplacement));
  }
  const root = directory(directory(artifact, "families"), familyId);
  const entries = readdirSync(root);
  if (entries.some(name => !/^(attempt|completion)-[12]\.json$/u.test(name) && name !== "correction-successor.json")) throw fail("attempt_unknown_record");
  const previous = entries.includes("attempt-1.json") ? read(path.join(root, "attempt-1.json")) : null;
  let number = 1, prior = null;
  if (previous) {
    const tip = reconstructAttemptTip({ anchorRoot, branch });
    if (tip.family_id !== familyId || tip.input_replacement_consumed || tip.observer_repair_consumed || tip.corrected_timeout_consumed || tip.condition_requalification_consumed || tip.guide_correction_consumed || tip.companion_timeout_consumed || tip.closeout_consumed) throw fail("attempt_candidate_superseded");
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
    recovery: number === 2 ? recoveryProof : null, source_correction: sourceCorrection,
    ...(browserReplacement ? { browser_replacement: browserReplacement, browser_authority: browserAuthorization.observations } : {}),
    ...(strictSource ? { input_replacement_consumed: true, browser_authority: browserAuthorization.observations } : {}),
    ...(isObserverRepair(sourceCorrection) ? { observer_authority: observerAuthorization.observations } : {}),
    ...(isCorrectedTimeout(sourceCorrection) ? { timeout_authority: timeoutAuthorization.observations } : {}),
    ...(isAnyCloseout(sourceCorrection) ? { closeout_authority: closeoutAuthorization.observations } : {}),
    ...(isCompanionTimeout(sourceCorrection) ? { companion_timeout_authority: companionTimeoutAuthorization.observations } : {}),
    ...(isConditionRequalification(sourceCorrection) ? { condition_authority: conditionAuthorization.observations } : {}),
    ...(isGuideCorrection(sourceCorrection) ? { guide_authority: guideAuthorization.observations } : {}),
    budget: { initial: 1, recovery: browserReplacement || strictSource || isObserverRepair(sourceCorrection) || isCorrectedTimeout(sourceCorrection) || isConditionRequalification(sourceCorrection) || isGuideCorrection(sourceCorrection) || isCompanionTimeout(sourceCorrection) || isAnyCloseout(sourceCorrection) ? 0 : 1 } };
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

export function inspectAttemptRecords({ anchorRoot, repositoryRoot = anchorRoot, receipt, browserAuthorization = null, browserLive = null, observerAuthorization = null, timeoutAuthorization = null, conditionAuthorization = null, guideAuthorization = null, companionTimeoutAuthorization = null, closeoutAuthorization = null }) {
  try {
    const attempt = receipt.attempt;
    const familyId = candidateFamilyId(receipt.repository.branch, attempt.source_correction, attempt.browser_replacement);
    if (attempt.browser_replacement) {
      if (receipt.receipt_version !== 5 || attempt.number !== 1 || attempt.source_correction || attempt.recovery || attempt.budget.recovery !== 0) return false;
      assertBrowserReplacementAuthorization(attempt.browser_replacement, browserAuthorization);
      if (digest(attempt.browser_authority) !== digest(browserAuthorization.observations)) return false;
      validateBrowserReplacementLive({ ...browserLive, proof: attempt.browser_replacement, repositoryRoot, branch: receipt.repository.branch,
        head: attempt.head, tree: attempt.tree, base: receipt.repository.base_sha });
      const proof = attempt.browser_replacement;
      const priorRoot = path.join(anchorRoot, ".augnes-local-verification", "families", proof.prior_family_id);
      const completion = read(path.join(priorRoot, `completion-${proof.prior_number}.json`));
      if (completion.attempt_id !== proof.prior_attempt_id || completion.receipt_fingerprint !== proof.prior_receipt_fingerprint || completion.cleanup_complete !== true || completion.disposition !== "safety_violation" ||
          digest(read(path.join(priorRoot, "correction-successor.json"))) !== digest(browserSuccessor(receipt.repository.branch, proof))) return false;
      const tip = reconstructAttemptTip({ anchorRoot, branch: receipt.repository.branch });
      if (tip.family_id !== familyId || tip.attempt_id !== attempt.attempt_id) return false;
    }
    if (attempt.source_correction) admitSourceCorrection({ anchorRoot, repositoryRoot, branch: receipt.repository.branch,
      head: attempt.head, tree: attempt.tree, proof: attempt.source_correction, acceptedMain: receipt.repository.base_sha, browserAuthorization, browserLive, observerAuthorization, timeoutAuthorization, conditionAuthorization, guideAuthorization, companionTimeoutAuthorization, closeoutAuthorization, reserve: false });
    if (isAnyCloseout(attempt.source_correction)) {
      if (receipt.receipt_version !== 4 || !validCloseoutAttempt(attempt) ||
          digest(attempt.closeout_authority) !== digest(closeoutAuthorization?.observations)) return false;
      const tip = reconstructAttemptTip({ anchorRoot, branch: receipt.repository.branch });
      if (tip.family_id !== familyId || tip.attempt_id !== attempt.attempt_id || !tip.closeout_consumed || !tip.companion_timeout_consumed ||
          Boolean(tip.closeout_continuation_consumed) !== (isCloseoutContinuation(attempt.source_correction) || isCloseoutScopeCorrection(attempt.source_correction)) ||
          Boolean(tip.closeout_scope_correction_consumed) !== isCloseoutScopeCorrection(attempt.source_correction)) return false;
    }
    if (isCompanionTimeout(attempt.source_correction)) {
      if (receipt.receipt_version !== 4 || !validCompanionTimeoutAttempt(attempt) ||
          digest(attempt.companion_timeout_authority) !== digest(companionTimeoutAuthorization?.observations)) return false;
      const tip = reconstructAttemptTip({ anchorRoot, branch: receipt.repository.branch });
      if (tip.family_id !== familyId || tip.attempt_id !== attempt.attempt_id || !tip.companion_timeout_consumed) return false;
    }
    if (isGuideCorrection(attempt.source_correction)) {
      if (!validGuideCorrectionAttempt(attempt) || digest(attempt.guide_authority) !== digest(guideAuthorization?.observations)) return false;
      const tip = reconstructAttemptTip({ anchorRoot, branch: receipt.repository.branch });
      if (tip.family_id !== familyId || tip.attempt_id !== attempt.attempt_id || !tip.guide_correction_consumed) return false;
    }
    if (isConditionRequalification(attempt.source_correction)) {
      if (!validConditionRequalificationAttempt(attempt) || digest(attempt.condition_authority) !== digest(conditionAuthorization?.observations)) return false;
      const tip = reconstructAttemptTip({ anchorRoot, branch: receipt.repository.branch });
      if (tip.family_id !== familyId || tip.attempt_id !== attempt.attempt_id || !tip.condition_requalification_consumed) return false;
    }
    if (isCorrectedTimeout(attempt.source_correction)) {
      if (receipt.receipt_version !== 4 || !validTimeoutAttempt(attempt) ||
          digest(attempt.timeout_authority) !== digest(timeoutAuthorization?.observations)) return false;
      const tip = reconstructAttemptTip({ anchorRoot, branch: receipt.repository.branch });
      if (tip.family_id !== familyId || tip.attempt_id !== attempt.attempt_id || !tip.corrected_timeout_consumed) return false;
    }
    if (isObserverRepair(attempt.source_correction)) {
      if (receipt.receipt_version !== 4 || !validObserverAttempt(attempt) ||
          digest(attempt.observer_authority) !== digest(observerAuthorization?.observations)) return false;
      const tip = reconstructAttemptTip({ anchorRoot, branch: receipt.repository.branch });
      if (tip.family_id !== familyId || tip.attempt_id !== attempt.attempt_id || !tip.observer_repair_consumed) return false;
    }
    if (isStrictBrowserSourceRevision(attempt.source_correction)) {
      if (receipt.receipt_version !== 5 || attempt.browser_replacement || attempt.recovery || attempt.number !== 1 ||
          attempt.budget?.initial !== 1 || attempt.budget?.recovery !== 0 || attempt.input_replacement_consumed !== true ||
          digest(attempt.browser_authority) !== digest(browserAuthorization?.observations)) return false;
      const tip = reconstructAttemptTip({ anchorRoot, branch: receipt.repository.branch });
      if (tip.family_id !== familyId || tip.attempt_id !== attempt.attempt_id || !tip.input_replacement_consumed) return false;
    }
    if (attempt.family_id !== familyId || ![1, 2].includes(attempt.number)) return false;
    const root = path.join(anchorRoot, ".augnes-local-verification", "families", familyId);
    if (realpathSync(root) !== root || !lstatSync(root).isDirectory()) return false;
    const original = read(path.join(root, `attempt-${attempt.number}.json`));
    const completion = read(path.join(root, `completion-${attempt.number}.json`));
    if (original.contract !== ATTEMPT_CONTRACT || completion.contract !== ATTEMPT_CONTRACT || !Number.isFinite(Date.parse(completion.finished_at)) ||
        digest(original) !== digest(attempt) || completion.attempt_id !== receipt.run.id ||
        completion.receipt_fingerprint !== receipt.integrity.content_fingerprint ||
        completion.disposition !== receipt.outcome.disposition || completion.cleanup_complete !== receipt.cleanup.completed) return false;
    if (attempt.number === 2) {
      const prior = read(path.join(root, "completion-1.json"));
      if (prior.disposition !== "infrastructure_interruption" || !validRecoveryProof(attempt.recovery, prior)) return false;
    }
    return true;
  } catch { return false; }
}

function candidateFamilyId(branch, correction, replacement) {
  return digest([ATTEMPT_CONTRACT, "hynk-studio/augnes", branch,
    ...(replacement ? [BROWSER_REPLACEMENT_CONTRACT, replacement.prior_family_id, replacement.prior_attempt_id] : []),
    ...(correction ? ["verified_source_correction", correction.prior_attempt_id, correction.head, correction.tree] : [])]);
}

const browserSuccessor = (branch, proof) => ({ contract: "augnes.local-canonical-successor.v2", kind: "browser_input_replacement",
  family_id: candidateFamilyId(branch, null, proof), head: proof.head, tree: proof.tree, proof_fingerprint: digest(proof) });

export function reconstructAttemptTip({ anchorRoot, branch }) {
  let familyId = candidateFamilyId(branch), inputReplacementConsumed = false, retainedInput = null, observerRepairConsumed = false, correctedTimeoutConsumed = false, conditionRequalificationConsumed = false, guideCorrectionConsumed = false, companionTimeoutConsumed = false, closeoutConsumed = false, closeoutContinuationConsumed = false, closeoutScopeCorrectionConsumed = false;
  const seen = new Set();
  for (let depth = 0; depth < 128; depth++) {
    if (seen.has(familyId)) throw fail("attempt_lineage_cycle");
    seen.add(familyId);
    const root = path.join(anchorRoot, ".augnes-local-verification", "families", familyId);
    if (realpathSync(root) !== root) throw fail("attempt_unsafe_directory");
    const entries = readdirSync(root);
    if (entries.some(name => !/^(attempt|completion)-[12]\.json$/u.test(name) && name !== "correction-successor.json")) throw fail("attempt_unknown_record");
    const number = entries.includes("attempt-2.json") ? 2 : 1;
    const attempt = read(path.join(root, `attempt-${number}.json`));
    if (attempt.contract !== ATTEMPT_CONTRACT || attempt.branch !== branch || attempt.family_id !== familyId || attempt.number !== number ||
        (attempt.source_correction && !["augnes.local-canonical-source-correction.v1", "augnes.local-canonical-source-correction.v2", OBSERVER_REPAIR_SCHEMA, TIMEOUT_REPAIR_SCHEMA, CONDITION_REQUALIFICATION_SCHEMA, GUIDE_CORRECTION_SCHEMA, COMPANION_TIMEOUT_SCHEMA, CLOSEOUT_SCHEMA, CLOSEOUT_CONTINUATION_SCHEMA].includes(attempt.source_correction.schema)) ||
        (attempt.browser_replacement && (attempt.browser_replacement.contract !== BROWSER_REPLACEMENT_CONTRACT || attempt.browser_replacement.kind !== "browser_input_replacement" ||
          attempt.source_correction || attempt.recovery || number !== 1 || attempt.budget?.initial !== 1 || attempt.budget?.recovery !== 0))) throw fail("attempt_lineage_identity_invalid");
    if (observerRepairConsumed) throw fail("attempt_observer_successor_terminal");
    if (correctedTimeoutConsumed) throw fail("attempt_timeout_successor_terminal");
    if (closeoutScopeCorrectionConsumed || (closeoutContinuationConsumed && !isCloseoutScopeCorrection(attempt.source_correction)) ||
        (closeoutConsumed && !isCloseoutContinuation(attempt.source_correction) && !isCloseoutScopeCorrection(attempt.source_correction))) throw fail("attempt_closeout_candidate_consumed");
    if (companionTimeoutConsumed && !isAnyCloseout(attempt.source_correction)) throw fail("attempt_companion_timeout_successor_terminal");
    if (hasCloseoutMarker(attempt)) {
      if (!companionTimeoutConsumed || !validCloseoutAttempt(attempt) ||
          (isCloseoutScopeCorrection(attempt.source_correction) ? !closeoutContinuationConsumed : isCloseoutContinuation(attempt.source_correction) !== closeoutConsumed)) throw fail("attempt_closeout_lineage_invalid");
      if (isCloseoutScopeCorrection(attempt.source_correction)) closeoutScopeCorrectionConsumed = true;
      if (isCloseoutContinuation(attempt.source_correction)) closeoutContinuationConsumed = true;
      closeoutConsumed = true;
    }
    if (attempt.source_correction?.schema === COMPANION_TIMEOUT_SCHEMA) {
      if (!validCompanionTimeoutAttempt(attempt)) throw fail("attempt_companion_timeout_lineage_invalid");
      companionTimeoutConsumed = true;
    }
    if (guideCorrectionConsumed) throw fail("attempt_guide_successor_terminal");
    if (conditionRequalificationConsumed && !isGuideCorrection(attempt.source_correction)) throw fail("attempt_condition_successor_terminal");
    if (isGuideCorrection(attempt.source_correction)) {
      if (!conditionRequalificationConsumed || !validGuideCorrectionAttempt(attempt)) throw fail("attempt_guide_lineage_invalid");
      guideCorrectionConsumed = true;
    }
    if (attempt.source_correction?.schema === CONDITION_REQUALIFICATION_SCHEMA) {
      if (!validConditionRequalificationAttempt(attempt)) throw fail("attempt_condition_lineage_invalid");
      conditionRequalificationConsumed = true;
    }
    if (attempt.source_correction?.schema === TIMEOUT_REPAIR_SCHEMA) {
      if (!validTimeoutAttempt(attempt)) throw fail("attempt_timeout_lineage_invalid");
      correctedTimeoutConsumed = true;
    }
    if (attempt.source_correction?.schema === OBSERVER_REPAIR_SCHEMA) {
      if (!validObserverAttempt(attempt)) throw fail("attempt_observer_lineage_invalid");
      observerRepairConsumed = true;
    }
    if (inputReplacementConsumed) {
      if (attempt.browser_replacement || !isStrictBrowserSourceRevision(attempt.source_correction) ||
          attempt.input_replacement_consumed !== true || attempt.source_correction.browser_input_sha256 !== retainedInput ||
          attempt.recovery || number !== 1 || attempt.budget?.initial !== 1 || attempt.budget?.recovery !== 0)
        throw fail("attempt_strict_input_lineage_invalid");
    } else if (attempt.input_replacement_consumed !== undefined || isStrictBrowserSourceRevision(attempt.source_correction)) {
      throw fail("attempt_strict_input_lineage_invalid");
    }
    if (attempt.browser_replacement) { inputReplacementConsumed = true; retainedInput = attempt.browser_replacement.browser_input_sha256; }
    const edgeFile = path.join(root, "correction-successor.json");
    if (!entries.includes("correction-successor.json")) return { family_id: familyId, number, attempt_id: attempt.attempt_id, input_replacement_consumed: inputReplacementConsumed, ...(observerRepairConsumed ? { observer_repair_consumed: true } : {}), ...(correctedTimeoutConsumed ? { corrected_timeout_consumed: true } : {}), ...(conditionRequalificationConsumed ? { condition_requalification_consumed: true } : {}), ...(guideCorrectionConsumed ? { guide_correction_consumed: true } : {}), ...(companionTimeoutConsumed ? { companion_timeout_consumed: true } : {}), ...(closeoutConsumed ? { closeout_consumed: true } : {}), ...(closeoutContinuationConsumed ? { closeout_continuation_consumed: true } : {}), ...(closeoutScopeCorrectionConsumed ? { closeout_scope_correction_consumed: true } : {}) };
    if (observerRepairConsumed) throw fail("attempt_observer_successor_terminal");
    if (correctedTimeoutConsumed) throw fail("attempt_timeout_successor_terminal");
    if (guideCorrectionConsumed) throw fail("attempt_guide_successor_terminal");
    if (closeoutScopeCorrectionConsumed) throw fail("attempt_closeout_candidate_consumed");
    const completion = read(path.join(root, `completion-${number}.json`)), edge = read(edgeFile);
    if (closeoutContinuationConsumed && edge.kind !== CLOSEOUT_SCOPE_CORRECTION_KIND) throw fail("attempt_closeout_candidate_consumed");
    if (closeoutConsumed && ![CLOSEOUT_CONTINUATION_KIND, CLOSEOUT_SCOPE_CORRECTION_KIND].includes(edge.kind)) throw fail("attempt_closeout_candidate_consumed");
    if (companionTimeoutConsumed && !["issue_1559_closeout", CLOSEOUT_CONTINUATION_KIND, CLOSEOUT_SCOPE_CORRECTION_KIND].includes(edge.kind)) throw fail("attempt_companion_timeout_successor_terminal");
    if (conditionRequalificationConsumed && edge.kind !== "guide_cancellation_correction") throw fail("attempt_condition_successor_terminal");
    const edgeKeys = edge.contract === undefined ? ["family_id", "head", "tree", "proof_fingerprint"] : ["contract", "kind", "family_id", "head", "tree", "proof_fingerprint"];
    if (completion.contract !== ATTEMPT_CONTRACT || completion.attempt_id !== attempt.attempt_id || completion.cleanup_complete !== true || !sha(completion.receipt_fingerprint) || !sha(edge.family_id) || !sha(edge.proof_fingerprint) ||
        digest(Object.keys(edge).sort()) !== digest(edgeKeys.sort()) ||
        (edge.contract !== undefined && (edge.contract !== "augnes.local-canonical-successor.v2" || !["browser_input_replacement", "observer_repair", "corrected_timeout", "condition_requalification", "guide_cancellation_correction", "companion_readiness_timeout", "issue_1559_closeout", CLOSEOUT_CONTINUATION_KIND, CLOSEOUT_SCOPE_CORRECTION_KIND].includes(edge.kind)))) throw fail("attempt_lineage_edge_invalid");
    const next = read(path.join(anchorRoot, ".augnes-local-verification", "families", edge.family_id, "attempt-1.json"));
    const proof = next.browser_replacement ?? next.source_correction;
    if (!proof || proof.prior_family_id !== familyId || proof.prior_number !== number || proof.prior_attempt_id !== attempt.attempt_id || proof.prior_receipt_fingerprint !== completion.receipt_fingerprint ||
        digest(proof) !== edge.proof_fingerprint || next.head !== edge.head || next.tree !== edge.tree ||
        candidateFamilyId(branch, next.source_correction, next.browser_replacement) !== edge.family_id ||
        (edge.kind === "browser_input_replacement") !== !!next.browser_replacement ||
        (edge.kind === "observer_repair") !== isObserverRepair(next.source_correction) ||
        (edge.kind === "corrected_timeout") !== isCorrectedTimeout(next.source_correction) ||
        (edge.kind === "issue_1559_closeout") !== isCloseout(next.source_correction) ||
        (edge.kind === CLOSEOUT_CONTINUATION_KIND) !== isCloseoutContinuation(next.source_correction) ||
        (edge.kind === CLOSEOUT_SCOPE_CORRECTION_KIND) !== isCloseoutScopeCorrection(next.source_correction) ||
        (isCloseoutScopeCorrection(next.source_correction) && (!isCloseoutContinuation(attempt.source_correction) || !validCloseoutAttempt(next) || completion.disposition !== "product_failure")) ||
        (isCloseoutContinuation(next.source_correction) && (!isCloseout(attempt.source_correction) || !validCloseoutAttempt(next) || completion.disposition !== "product_failure")) ||
        (isCloseout(next.source_correction) && (!isCompanionTimeout(attempt.source_correction) || !validCloseoutAttempt(next) || completion.disposition !== "product_failure")) ||
        (edge.kind === "companion_readiness_timeout") !== isCompanionTimeout(next.source_correction) ||
        (edge.kind === "condition_requalification") !== isConditionRequalification(next.source_correction) ||
        (edge.kind === "guide_cancellation_correction") !== isGuideCorrection(next.source_correction) ||
        (isGuideCorrection(next.source_correction) && (!isConditionRequalification(attempt.source_correction) || completion.disposition !== "product_failure" ||
          !validGuideCorrectionAttempt(next) || next.source_correction.authorization?.grant_comment_id === attempt.source_correction.authorization?.grant_comment_id))) throw fail("attempt_lineage_edge_invalid");
    if (inputReplacementConsumed && (completion.disposition !== "product_failure" || next.head === attempt.head || next.tree === attempt.tree))
      throw fail("attempt_strict_source_predecessor_invalid");
    familyId = edge.family_id;
  }
  throw fail("attempt_lineage_bound");
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
  if (hasCloseoutMarker({ source_correction: proof })) {
    if (!isAnyCloseout(proof)) throw fail("closeout_identity_invalid");
    readCloseoutEvidence(file, proof, repositoryRoot);
    return { ...proof, local_relative_path: relative };
  }
  if (isCompanionTimeout(proof)) {
    readCompanionTimeoutEvidence(file, proof, repositoryRoot);
    return { ...proof, local_relative_path: relative };
  }
  if (isGuideCorrection(proof)) {
    readGuideCorrectionEvidence(file, proof, repositoryRoot);
    return { ...proof, local_relative_path: relative };
  }
  if (isConditionRequalification(proof)) {
    readConditionRequalificationEvidence(file, proof, repositoryRoot);
    return { ...proof, local_relative_path: relative };
  }
  const observer = isObserverRepair(proof);
  if (observer) readObserverRepairEvidence(file, proof, repositoryRoot);
  const correctedTimeout = isCorrectedTimeout(proof);
  if (correctedTimeout) readTimeoutRepairEvidence(file, proof, repositoryRoot);
  const version2 = proof.schema === "augnes.local-canonical-source-correction.v2";
  const review = version2 ? readCandidateReview(file, proof) : null;
  if (["browser_input_path", "browser_input_sha256", "input_replacement_consumed"].some(k => Object.hasOwn(proof, k))) {
    if (!isStrictBrowserSourceRevision(proof) || proof.budget?.initial !== 1 || proof.budget?.recovery !== 0 ||
        !/^[0-9a-f]{40}$/u.test(proof.base ?? "") ||
        !["browser_input_sha256", "executor_fingerprint", "environment_fingerprint", "workload_fingerprint", "common_inputs_sha256", "delta_sha256"].every(k => sha(proof[k])) ||
        proof.delta_sha256 !== review.delta_sha256 || digest(proof.changed_paths) !== digest(review.changed_paths) ||
        digest(readBrowserInputBinding(proof.browser_input_path, repositoryRoot).publicBinding) !== proof.browser_input_sha256)
      throw fail("source_correction_strict_input_invalid");
  }
  if (version2 && proof.kind === "accepted_main_integration") return { ...proof, local_relative_path: relative };
  if ((!observer && !correctedTimeout && !version2 && proof.schema !== "augnes.local-canonical-source-correction.v1") ||
      !(version2 || correctedTimeout ? /^(?:next\.config\.ts|components\/blank-state\/blank-state-client\.tsx|(?:scripts|app|lib|plugins|apps|src)\/[a-zA-Z0-9_./-]+\.(?:mjs|cjs|js|ts|tsx))$/u : /^scripts\/[a-z0-9_/-]+\.mjs$/u).test(proof.source_module ?? "") || (proof.source_module ?? "").split("/").includes("..") ||
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

function admitSourceCorrection({ anchorRoot, repositoryRoot, branch, head, tree, proof, acceptedMain, browserAuthorization, browserLive, observerAuthorization, timeoutAuthorization, conditionAuthorization, guideAuthorization, companionTimeoutAuthorization, closeoutAuthorization, reserve }) {
  const reread = readSourceCorrectionProof(path.join(repositoryRoot, proof.local_relative_path ?? ""), repositoryRoot);
  if (digest(reread) !== digest(proof) || proof.branch !== branch || proof.head !== head || proof.tree !== tree ||
      !/^[0-9a-f]{40}$/u.test(head) || !/^[0-9a-f]{40}$/u.test(tree)) throw fail("source_correction_identity_invalid");
  if (isAnyCloseout(proof)) {
    const completion = JSON.parse(closeoutArtifact(path.dirname(path.join(repositoryRoot, proof.local_relative_path)), proof.originals.completion));
    assertCloseoutAuthorization(proof, closeoutAuthorization, completion);
    if (acceptedMain !== proof.base) throw fail("closeout_current_base_required");
    const priorRoot = path.join(anchorRoot, ".augnes-local-verification", "families", proof.prior_family_id);
    if (realpathSync(priorRoot) !== priorRoot || readdirSync(priorRoot).includes(`attempt-${proof.prior_number + 1}.json`)) throw fail("closeout_latest_settled_required");
    for (const kind of ["attempt", "completion"]) {
      const actual = path.join(priorRoot, `${kind}-${proof.prior_number}.json`);
      read(actual);
      if (digest(readFileSync(actual)) !== proof.originals[kind].sha256) throw fail("closeout_original_ledger_changed");
    }
    const prior = read(path.join(priorRoot, `attempt-${proof.prior_number}.json`));
    const incomingEdge = path.join(anchorRoot, ".augnes-local-verification", "families", prior.source_correction.prior_family_id, "correction-successor.json");
    read(incomingEdge);
    if (digest(readFileSync(incomingEdge)) !== proof.originals.edge.sha256) throw fail("closeout_original_edge_changed");
    const successor = { contract: "augnes.local-canonical-successor.v2", kind: proof.kind,
      family_id: candidateFamilyId(branch, proof), head, tree, proof_fingerprint: digest(proof) };
    // New scope consumes the same exclusive predecessor namespace. The old v7
    // edge and its terminal grant stay immutable; inspection never reserves.
    if (reserve) append(priorRoot, "correction-successor.json", successor);
    if (digest(read(path.join(priorRoot, "correction-successor.json"))) !== digest(successor)) throw fail("closeout_successor_already_bound");
    return;
  }
  if (isCompanionTimeout(proof)) {
    const completion = JSON.parse(companionArtifact(path.dirname(path.join(repositoryRoot, proof.local_relative_path)), proof.originals.completion));
    assertCompanionTimeoutAuthorization(proof, companionTimeoutAuthorization, completion);
    if (acceptedMain !== proof.base) throw fail("companion_timeout_current_base_required");
    const priorRoot = path.join(anchorRoot, ".augnes-local-verification", "families", proof.prior_family_id);
    if (realpathSync(priorRoot) !== priorRoot || readdirSync(priorRoot).includes(`attempt-${proof.prior_number + 1}.json`)) throw fail("companion_timeout_latest_settled_required");
    for (const kind of ["attempt", "completion"]) {
      const actual = path.join(priorRoot, `${kind}-${proof.prior_number}.json`);
      read(actual);
      if (digest(readFileSync(actual)) !== proof.originals[kind].sha256) throw fail("companion_timeout_original_ledger_changed");
    }
    const successor = { contract: "augnes.local-canonical-successor.v2", kind: "companion_readiness_timeout",
      family_id: candidateFamilyId(branch, proof), head, tree, proof_fingerprint: digest(proof) };
    // The existing exclusive namespace also consumes an interrupted reservation.
    // Inspection reconstructs this edge; it never creates or repairs one.
    if (reserve) append(priorRoot, "correction-successor.json", successor);
    if (digest(read(path.join(priorRoot, "correction-successor.json"))) !== digest(successor)) throw fail("companion_timeout_successor_already_bound");
    return;
  }
  if (isGuideCorrection(proof)) {
    const completion = JSON.parse(guideArtifact(path.dirname(path.join(repositoryRoot, proof.local_relative_path)), proof.originals.completion));
    assertGuideCorrectionAuthorization(proof, guideAuthorization, completion);
    if (acceptedMain !== proof.base) throw fail("guide_current_base_required");
    const priorRoot = path.join(anchorRoot, ".augnes-local-verification", "families", proof.prior_family_id);
    if (realpathSync(priorRoot) !== priorRoot || readdirSync(priorRoot).includes(`attempt-${proof.prior_number + 1}.json`)) throw fail("guide_latest_settled_required");
    for (const kind of ["attempt", "completion"]) {
      const actual = path.join(priorRoot, `${kind}-${proof.prior_number}.json`);
      read(actual);
      if (digest(readFileSync(actual)) !== proof.originals[kind].sha256) throw fail("guide_original_ledger_changed");
    }
    const prior = read(path.join(priorRoot, `attempt-${proof.prior_number}.json`));
    const incomingEdge = path.join(anchorRoot, ".augnes-local-verification", "families", prior.source_correction.prior_family_id, "correction-successor.json");
    read(incomingEdge);
    if (digest(readFileSync(incomingEdge)) !== proof.originals.edge.sha256) throw fail("guide_original_edge_changed");
    const successor = { contract: "augnes.local-canonical-successor.v2", kind: "guide_cancellation_correction",
      family_id: candidateFamilyId(branch, proof), head, tree, proof_fingerprint: digest(proof) };
    // The existing exclusive predecessor edge consumes the new grant across
    // candidates and successor kinds, including a crash before attempt append.
    if (reserve) append(priorRoot, "correction-successor.json", successor);
    if (digest(read(path.join(priorRoot, "correction-successor.json"))) !== digest(successor)) throw fail("guide_successor_already_bound");
    return;
  }
  if (isConditionRequalification(proof)) {
    const completion = JSON.parse(conditionArtifact(path.dirname(path.join(repositoryRoot, proof.local_relative_path)), proof.originals.completion));
    assertConditionRequalificationAuthorization(proof, conditionAuthorization, completion);
    if (acceptedMain !== proof.base) throw fail("condition_current_base_required");
    const priorRoot = path.join(anchorRoot, ".augnes-local-verification", "families", proof.prior_family_id);
    if (realpathSync(priorRoot) !== priorRoot || readdirSync(priorRoot).includes(`attempt-${proof.prior_number + 1}.json`)) throw fail("condition_latest_settled_required");
    for (const kind of ["attempt", "completion"]) {
      const actual = path.join(priorRoot, `${kind}-${proof.prior_number}.json`);
      read(actual);
      if (digest(readFileSync(actual)) !== proof.originals[kind].sha256) throw fail("condition_original_ledger_changed");
    }
    const successor = { contract: "augnes.local-canonical-successor.v2", kind: "condition_requalification",
      family_id: candidateFamilyId(branch, proof), head, tree, proof_fingerprint: digest(proof) };
    if (reserve) append(priorRoot, "correction-successor.json", successor);
    if (digest(read(path.join(priorRoot, "correction-successor.json"))) !== digest(successor)) throw fail("condition_successor_already_bound");
    return;
  }
  if (isCorrectedTimeout(proof)) {
    const completion = JSON.parse(timeoutArtifact(path.dirname(path.join(repositoryRoot, proof.local_relative_path)), proof.originals.completion));
    assertCorrectedTimeoutAuthorization(proof, timeoutAuthorization, completion);
    if (acceptedMain !== proof.base) throw fail("timeout_current_base_required");
    const priorRoot = path.join(anchorRoot, ".augnes-local-verification", "families", proof.prior_family_id);
    if (realpathSync(priorRoot) !== priorRoot || readdirSync(priorRoot).includes(`attempt-${proof.prior_number + 1}.json`)) throw fail("timeout_latest_settled_required");
    for (const kind of ["attempt", "completion"]) {
      const actual = path.join(priorRoot, `${kind}-${proof.prior_number}.json`);
      read(actual);
      if (digest(readFileSync(actual)) !== proof.originals[kind].sha256) throw fail("timeout_original_ledger_changed");
    }
    const successor = { contract: "augnes.local-canonical-successor.v2", kind: "corrected_timeout",
      family_id: candidateFamilyId(branch, proof), head, tree, proof_fingerprint: digest(proof) };
    // The existing exclusive namespace also consumes an interrupted reservation.
    // Inspection reconstructs this edge; it never creates or repairs one.
    if (reserve) append(priorRoot, "correction-successor.json", successor);
    if (digest(read(path.join(priorRoot, "correction-successor.json"))) !== digest(successor)) throw fail("timeout_successor_already_bound");
    return;
  }
  if (isObserverRepair(proof)) {
    const completion = JSON.parse(observerArtifact(path.dirname(path.join(repositoryRoot, proof.local_relative_path)), proof.originals.completion));
    assertObserverRepairAuthorization(proof, observerAuthorization, completion);
    if (acceptedMain !== proof.base) throw fail("observer_current_base_required");
    const priorRoot = path.join(anchorRoot, ".augnes-local-verification", "families", proof.prior_family_id);
    if (realpathSync(priorRoot) !== priorRoot || readdirSync(priorRoot).includes(`attempt-${proof.prior_number + 1}.json`)) throw fail("observer_latest_settled_required");
    for (const kind of ["attempt", "completion"]) {
      const actual = path.join(priorRoot, `${kind}-${proof.prior_number}.json`);
      read(actual);
      if (digest(readFileSync(actual)) !== proof.originals[kind].sha256) throw fail("observer_original_ledger_changed");
    }
    const successor = { contract: "augnes.local-canonical-successor.v2", kind: "observer_repair",
      family_id: candidateFamilyId(branch, proof), head, tree, proof_fingerprint: digest(proof) };
    if (reserve) append(priorRoot, "correction-successor.json", successor);
    if (digest(read(path.join(priorRoot, "correction-successor.json"))) !== digest(successor)) throw fail("observer_successor_already_bound");
    return;
  }
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
    const strict = isStrictBrowserSourceRevision(proof);
    if ((original.receipt_version === 5 || prior.browser_replacement || isStrictBrowserSourceRevision(prior.source_correction)) !== strict)
      throw fail("source_correction_strict_input_required");
    if (strict) {
      if (original.receipt_version !== 5 || completion.disposition !== "product_failure" || prior.budget?.recovery !== 0 ||
          digest(original.browser_input) !== proof.browser_input_sha256 || digest(original.inputs?.binding?.browser_input) !== proof.browser_input_sha256 ||
          original.attempt?.family_id !== proof.prior_family_id || original.attempt?.number !== proof.prior_number ||
          proof.authorization?.review_id === prior.browser_authority?.review?.id || proof.authorization?.grant_comment_id === prior.browser_authority?.grant?.id)
        throw fail("source_correction_strict_predecessor_invalid");
      assertBrowserReplacementAuthorization(proof, browserAuthorization);
      if (Date.parse(browserAuthorization.observations.review.timestamp) <= Date.parse(completion.finished_at)) throw fail("source_correction_review_predates_settlement");
      validateStrictBrowserLive({ ...browserLive, proof, branch, head, tree, base: acceptedMain });
    }
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
    append(priorRoot, "correction-successor.json", successor);
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
