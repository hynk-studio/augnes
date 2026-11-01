import { BUDGET_SCHEMA, isSuccessorBudgetSuccession, readSuccessorBudgetEvidence, assertSuccessorBudgetAuthorization, validSuccessorBudgetAttempt } from "./local-canonical-successor-budget-succession.mjs";
import { OPERATING_PROFILE_SCHEMA, isOperatingProfileSuccession, readOperatingProfileEvidence, profileArtifact, assertOperatingProfileAuthorization, validOperatingProfileAttempt } from "./local-canonical-operating-profile-succession.mjs";
import { CLOSEOUT_SCHEMA, CLOSEOUT_CONTINUATION_SCHEMA, CLOSEOUT_CONTINUATION_KIND, CLOSEOUT_SCOPE_CORRECTION_KIND, CLOSEOUT_INSTRUCTION_KIND, CLOSEOUT_FIXTURE_CORRECTION_KIND, CLOSEOUT_CAPABILITY_CORRECTION_KIND, CLOSEOUT_SCOPE_FIXTURE_CORRECTION_KIND, isCloseoutScopeFixtureCorrection, hasCloseoutScopeAmendment, matchesCloseoutAmendmentPredecessor, matchesCloseoutRuntimeSettlementPredecessor, isCloseoutCapabilityCorrection, isCloseoutFixtureCorrection, usesCloseoutInstructionInputs, isCloseoutInstructionReplacement, closeoutInstructionInputBinding, isCloseoutScopeCorrection, isCloseout, isCloseoutContinuation, isAnyCloseout, hasCloseoutMarker, readCloseoutEvidence, closeoutArtifact, assertCloseoutIssuedCapability, assertCloseoutAuthorization, validCloseoutAttempt } from "./local-canonical-1559-closeout.mjs";
import { COMPANION_TIMEOUT_SCHEMA, isCompanionTimeout, readCompanionTimeoutEvidence, companionArtifact, assertCompanionTimeoutAuthorization, validCompanionTimeoutAttempt } from "./local-canonical-companion-timeout-succession.mjs";
import { mkdirSync, lstatSync, readFileSync, readdirSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { digest, validNodeHeaders, classifyInputChange, nonFaultInputChange, inputEventIdentity, comparePreparedDependencyInputs, preparedDependencyIdentity, observePreparedDependencyInputs, PREPARED_DEPENDENCY_CONTRACT } from "./local-canonical-inputs.mjs";
import { assertCheckoutVerificationOwnership } from "./local-canonical-checkout-ownership.mjs";
import { CANONICAL_NODE_VERSION } from "./local-canonical-environment.mjs";
import { readBrowserInputBinding } from "./local-canonical-browser-input.mjs";
import { BROWSER_REPLACEMENT_CONTRACT, assertBrowserReplacementAuthorization, validateBrowserReplacementLive, validateStrictBrowserLive, isStrictBrowserSourceRevision } from "./local-canonical-browser-replacement.mjs";

import { OBSERVER_REPAIR_SCHEMA, isObserverRepair, readObserverRepairEvidence, observerArtifact, assertObserverRepairAuthorization, validObserverAttempt } from "./local-canonical-observer-succession.mjs";
import { TIMEOUT_REPAIR_SCHEMA, isCorrectedTimeout, readTimeoutRepairEvidence, timeoutArtifact, assertCorrectedTimeoutAuthorization, validTimeoutAttempt } from "./local-canonical-timeout-succession.mjs";
import { CONDITION_REQUALIFICATION_SCHEMA, isConditionRequalification, readConditionRequalificationEvidence, conditionArtifact, assertConditionRequalificationAuthorization, validConditionRequalificationAttempt } from "./local-canonical-condition-requalification.mjs";

import { GUIDE_CORRECTION_SCHEMA, isGuideCorrection, readGuideCorrectionEvidence, guideArtifact, assertGuideCorrectionAuthorization, validGuideCorrectionAttempt } from "./local-canonical-guide-correction.mjs";
import { createGitHubObserverAuthorizationTransport } from "./github-main-branch-transport.mjs";

export const ATTEMPT_CONTRACT = "augnes.local-canonical-attempt-family.v1";
const fail = code => Object.assign(new Error(code), { code });
const sha = value => /^[0-9a-f]{64}$/u.test(value ?? "");
const capabilities = new WeakMap();
export const REVIEWED_REVISION_SCHEMA = "augnes.local-canonical-source-correction.v7";
export const isReviewedRevision = proof => proof?.schema === REVIEWED_REVISION_SCHEMA && proof.kind === "reviewed_revision";
const revisionCapabilities = new WeakMap();

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
export function beginAttempt({ anchorRoot, repositoryRoot, checkoutOwner, branch, head, tree, runId, contractFingerprint, recoveryProof = null, sourceCorrection = null, browserReplacement = null, browserAuthorization = null, browserLive = null, acceptedMain = null, observerAuthorization = null, timeoutAuthorization = null, conditionAuthorization = null, guideAuthorization = null, profileAuthorization = null, budgetAuthorization = null, revisionAuthorization = null, revisionInputs = null, companionTimeoutAuthorization = null, closeoutAuthorization = null, closeoutInputs = null }) {
  assertCheckoutVerificationOwnership(checkoutOwner, repositoryRoot);
  if (!branch || !/^[0-9a-f]{40}$/u.test(head) || !/^[0-9a-f]{40}$/u.test(tree) || !sha(contractFingerprint)) throw fail("attempt_identity_invalid");
  if ([recoveryProof, sourceCorrection, browserReplacement].filter(Boolean).length > 1) throw fail("attempt_mixed_successor_kind");
  const instructionInput = usesCloseoutInstructionInputs(sourceCorrection) ? closeoutInstructionInputBinding(sourceCorrection, closeoutInputs) : null;
  if (instructionInput && contractFingerprint !== instructionInput.fingerprint) throw fail("closeout_instruction_contract_binding_invalid");
  const strictSource = isStrictBrowserSourceRevision(sourceCorrection);
  const familyId = candidateFamilyId(branch, sourceCorrection, browserReplacement);
  const artifact = directory(anchorRoot, ".augnes-local-verification");
  if (sourceCorrection && read(path.join(anchorRoot, ".augnes-local-verification", "families", sourceCorrection.prior_family_id, `attempt-${sourceCorrection.prior_number}.json`)).branch !== branch) throw fail("source_correction_predecessor_invalid");
  if (sourceCorrection || browserReplacement) {
    const tip = reconstructAttemptTip({ anchorRoot, branch });
    const proof = sourceCorrection ?? browserReplacement;
    const revision = isReviewedRevision(sourceCorrection);
    if (tip.family_id !== proof.prior_family_id || tip.number !== proof.prior_number || tip.attempt_id !== proof.prior_attempt_id ||
        (tip.closeout_scope_fixture_correction_consumed && !matchesCloseoutAmendmentPredecessor(sourceCorrection, tip)) || (tip.closeout_capability_correction_consumed && !isCloseoutScopeFixtureCorrection(sourceCorrection)) || (tip.closeout_fixture_correction_consumed && !isCloseoutCapabilityCorrection(sourceCorrection) && !isCloseoutScopeFixtureCorrection(sourceCorrection)) || (tip.closeout_instruction_consumed && !isCloseoutFixtureCorrection(sourceCorrection) && !isCloseoutCapabilityCorrection(sourceCorrection) && !isCloseoutScopeFixtureCorrection(sourceCorrection)) || (tip.closeout_scope_correction_consumed && !usesCloseoutInstructionInputs(sourceCorrection)) || (tip.closeout_continuation_consumed && !isCloseoutScopeCorrection(sourceCorrection) && !usesCloseoutInstructionInputs(sourceCorrection)) || (tip.closeout_consumed && !isCloseoutContinuation(sourceCorrection) && !isCloseoutScopeCorrection(sourceCorrection) && !usesCloseoutInstructionInputs(sourceCorrection)) || (tip.companion_timeout_consumed && !isAnyCloseout(sourceCorrection)) ||
          (isCloseout(sourceCorrection) && !tip.companion_timeout_consumed) ||
          (isCloseoutContinuation(sourceCorrection) && !tip.closeout_consumed) ||
          (isCloseoutScopeCorrection(sourceCorrection) && !tip.closeout_continuation_consumed) ||
          (isCloseoutInstructionReplacement(sourceCorrection) && !tip.closeout_scope_correction_consumed) ||
          (isCloseoutFixtureCorrection(sourceCorrection) && !tip.closeout_instruction_consumed) ||
          (isCloseoutCapabilityCorrection(sourceCorrection) && !tip.closeout_fixture_correction_consumed) ||
          (isCloseoutScopeFixtureCorrection(sourceCorrection) && !tip.closeout_capability_correction_consumed) ||
          (revision ? tip.input_replacement_consumed || !revisionFollows(proof, tip.reviewed_revision_consumed ?? 0, tip.revision_commission, tip.revision_grants ?? []) :
          tip.reviewed_revision_consumed || tip.observer_repair_consumed || tip.corrected_timeout_consumed || tip.guide_correction_consumed || tip.successor_budget_consumed ||
          (tip.operating_profile_consumed && !isSuccessorBudgetSuccession(sourceCorrection)) ||
          (isSuccessorBudgetSuccession(sourceCorrection) && !tip.operating_profile_consumed) ||
          (tip.condition_requalification_consumed && !isGuideCorrection(sourceCorrection)) ||
          (isGuideCorrection(sourceCorrection) && !tip.condition_requalification_consumed) || (browserReplacement ? tip.input_replacement_consumed : tip.input_replacement_consumed !== strictSource))) throw fail("attempt_latest_tip_required");
  }
  if (sourceCorrection) admitSourceCorrection({ anchorRoot, repositoryRoot, branch, head, tree, proof: sourceCorrection, acceptedMain, browserAuthorization, browserLive, observerAuthorization, timeoutAuthorization, conditionAuthorization, guideAuthorization, profileAuthorization, budgetAuthorization, revisionAuthorization, revisionInputs, companionTimeoutAuthorization, closeoutAuthorization, closeoutInputs, reserve: true });
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
    if (tip.family_id !== familyId || tip.input_replacement_consumed || tip.observer_repair_consumed || tip.corrected_timeout_consumed || tip.condition_requalification_consumed || tip.guide_correction_consumed || tip.operating_profile_consumed || tip.successor_budget_consumed || tip.reviewed_revision_consumed || tip.companion_timeout_consumed || tip.closeout_consumed) throw fail("attempt_candidate_superseded");
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
    ...(instructionInput ? { closeout_instruction_input: instructionInput } : {}),
    ...(isCompanionTimeout(sourceCorrection) ? { companion_timeout_authority: companionTimeoutAuthorization.observations } : {}),
    ...(isConditionRequalification(sourceCorrection) ? { condition_authority: conditionAuthorization.observations } : {}),
    ...(isOperatingProfileSuccession(sourceCorrection) ? { profile_authority: profileAuthorization.observations } : {}),
    ...(isSuccessorBudgetSuccession(sourceCorrection) ? { budget_authority: budgetAuthorization.observations } : {}),
    ...(isReviewedRevision(sourceCorrection) ? { revision_authority: revisionAuthorization.observations } : {}),
    ...(isGuideCorrection(sourceCorrection) ? { guide_authority: guideAuthorization.observations } : {}),
    budget: { initial: 1, recovery: browserReplacement || strictSource || isObserverRepair(sourceCorrection) || isCorrectedTimeout(sourceCorrection) || isConditionRequalification(sourceCorrection) || isGuideCorrection(sourceCorrection) || isOperatingProfileSuccession(sourceCorrection) || isSuccessorBudgetSuccession(sourceCorrection) || isReviewedRevision(sourceCorrection) || isCompanionTimeout(sourceCorrection) || isAnyCloseout(sourceCorrection) ? 0 : 1 } };
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

export function inspectAttemptRecords({ anchorRoot, repositoryRoot = anchorRoot, receipt, browserAuthorization = null, browserLive = null, observerAuthorization = null, timeoutAuthorization = null, conditionAuthorization = null, guideAuthorization = null, profileAuthorization = null, budgetAuthorization = null, revisionAuthorization = null, revisionInputs = null, companionTimeoutAuthorization = null, closeoutAuthorization = null, closeoutInputs = null }) {
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
      head: attempt.head, tree: attempt.tree, proof: attempt.source_correction, acceptedMain: receipt.repository.base_sha, browserAuthorization, browserLive, observerAuthorization, timeoutAuthorization, conditionAuthorization, guideAuthorization, profileAuthorization, budgetAuthorization, revisionAuthorization, revisionInputs, companionTimeoutAuthorization, closeoutAuthorization, closeoutInputs: receipt.inputs, reserve: false });
    if (isReviewedRevision(attempt.source_correction)) {
      if (receipt.receipt_version !== 4 || !validReviewedRevisionAttempt(attempt) || digest(attempt.revision_authority) !== digest(revisionAuthorization?.observations)) return false;
      const tip = reconstructAttemptTip({ anchorRoot, branch: receipt.repository.branch });
      if (tip.family_id !== familyId || tip.attempt_id !== attempt.attempt_id || tip.reviewed_revision_consumed !== attempt.source_correction.commission.ordinal) return false;
    }
    if (isSuccessorBudgetSuccession(attempt.source_correction)) {
      if (receipt.receipt_version !== 4 || !validSuccessorBudgetAttempt(attempt) || digest(attempt.budget_authority) !== digest(budgetAuthorization?.observations)) return false;
      const tip = reconstructAttemptTip({ anchorRoot, branch: receipt.repository.branch });
      if (tip.family_id !== familyId || tip.attempt_id !== attempt.attempt_id || !tip.successor_budget_consumed) return false;
    }
    if (isOperatingProfileSuccession(attempt.source_correction)) {
      if (receipt.receipt_version !== 4 || !validOperatingProfileAttempt(attempt) || digest(attempt.profile_authority) !== digest(profileAuthorization?.observations)) return false;
      const tip = reconstructAttemptTip({ anchorRoot, branch: receipt.repository.branch });
      if (tip.family_id !== familyId || tip.attempt_id !== attempt.attempt_id || !tip.operating_profile_consumed) return false;
    }
    if (isAnyCloseout(attempt.source_correction)) {
      if (receipt.receipt_version !== 4 || !validCloseoutAttempt(attempt) ||
          digest(attempt.closeout_authority) !== digest(closeoutAuthorization?.observations)) return false;
      const tip = reconstructAttemptTip({ anchorRoot, branch: receipt.repository.branch });
      if (tip.family_id !== familyId || tip.attempt_id !== attempt.attempt_id || !tip.closeout_consumed || !tip.companion_timeout_consumed ||
          Boolean(tip.closeout_continuation_consumed) !== (isCloseoutContinuation(attempt.source_correction) || isCloseoutScopeCorrection(attempt.source_correction) || usesCloseoutInstructionInputs(attempt.source_correction)) ||
          Boolean(tip.closeout_scope_correction_consumed) !== (isCloseoutScopeCorrection(attempt.source_correction) || usesCloseoutInstructionInputs(attempt.source_correction)) ||
          Boolean(tip.closeout_instruction_consumed) !== usesCloseoutInstructionInputs(attempt.source_correction) ||
          Boolean(tip.closeout_fixture_correction_consumed) !== (isCloseoutFixtureCorrection(attempt.source_correction) || isCloseoutCapabilityCorrection(attempt.source_correction) || isCloseoutScopeFixtureCorrection(attempt.source_correction)) ||
          Boolean(tip.closeout_capability_correction_consumed) !== (isCloseoutCapabilityCorrection(attempt.source_correction) || isCloseoutScopeFixtureCorrection(attempt.source_correction)) ||
          Boolean(tip.closeout_scope_fixture_correction_consumed) !== isCloseoutScopeFixtureCorrection(attempt.source_correction)) return false;
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
  let familyId = candidateFamilyId(branch), inputReplacementConsumed = false, retainedInput = null, observerRepairConsumed = false, correctedTimeoutConsumed = false, conditionRequalificationConsumed = false, guideCorrectionConsumed = false, operatingProfileConsumed = false, successorBudgetConsumed = false, revisionCount = 0, revisionCommission = null, companionTimeoutConsumed = false, closeoutConsumed = false, closeoutContinuationConsumed = false, closeoutScopeCorrectionConsumed = false, closeoutInstructionConsumed = false, closeoutFixtureCorrectionConsumed = false, closeoutCapabilityCorrectionConsumed = false, closeoutScopeFixtureCorrectionConsumed = false;
  const seen = new Set(), revisionGrants = [];
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
        (attempt.source_correction && !["augnes.local-canonical-source-correction.v1", "augnes.local-canonical-source-correction.v2", OBSERVER_REPAIR_SCHEMA, TIMEOUT_REPAIR_SCHEMA, CONDITION_REQUALIFICATION_SCHEMA, GUIDE_CORRECTION_SCHEMA, OPERATING_PROFILE_SCHEMA, BUDGET_SCHEMA, REVIEWED_REVISION_SCHEMA, COMPANION_TIMEOUT_SCHEMA, CLOSEOUT_SCHEMA, CLOSEOUT_CONTINUATION_SCHEMA].includes(attempt.source_correction.schema)) ||
        (attempt.browser_replacement && (attempt.browser_replacement.contract !== BROWSER_REPLACEMENT_CONTRACT || attempt.browser_replacement.kind !== "browser_input_replacement" ||
          attempt.source_correction || attempt.recovery || number !== 1 || attempt.budget?.initial !== 1 || attempt.budget?.recovery !== 0))) throw fail("attempt_lineage_identity_invalid");
    const revision = isReviewedRevision(attempt.source_correction);
    if (revisionCount && !revision) throw fail("attempt_revision_commission_terminal");
    if (successorBudgetConsumed && !revision) throw fail("attempt_successor_budget_terminal");
    if (operatingProfileConsumed && !revision && !isSuccessorBudgetSuccession(attempt.source_correction)) throw fail("attempt_operating_profile_successor_terminal");
    if (observerRepairConsumed && !revision) throw fail("attempt_observer_successor_terminal");
    if (correctedTimeoutConsumed && !revision) throw fail("attempt_timeout_successor_terminal");
    if (guideCorrectionConsumed && !revision) throw fail("attempt_guide_successor_terminal");
    if (conditionRequalificationConsumed && !revision && !isGuideCorrection(attempt.source_correction)) throw fail("attempt_condition_successor_terminal");
    if (revision) {
      if (!validReviewedRevisionAttempt(attempt) || !revisionFollows(attempt.source_correction, revisionCount, revisionCommission, revisionGrants)) throw fail("attempt_revision_commission_invalid");
      if (attempt.source_correction.commission.ordinal === 1) revisionGrants.push(attempt.source_correction.authorization.grant_comment_id);
      revisionCount = attempt.source_correction.commission.ordinal; revisionCommission = revisionCommissionIdentity(attempt.source_correction);
    }
    if (isSuccessorBudgetSuccession(attempt.source_correction)) {
      if (!operatingProfileConsumed || !validSuccessorBudgetAttempt(attempt)) throw fail("attempt_successor_budget_lineage_invalid");
      successorBudgetConsumed = true;
    }
    if (isOperatingProfileSuccession(attempt.source_correction)) {
      if (!validOperatingProfileAttempt(attempt)) throw fail("attempt_operating_profile_lineage_invalid");
      operatingProfileConsumed = true;
    }
    if ((closeoutScopeFixtureCorrectionConsumed && !hasCloseoutScopeAmendment(attempt.source_correction)) || (closeoutCapabilityCorrectionConsumed && !isCloseoutScopeFixtureCorrection(attempt.source_correction)) || (closeoutFixtureCorrectionConsumed && !isCloseoutCapabilityCorrection(attempt.source_correction) && !isCloseoutScopeFixtureCorrection(attempt.source_correction)) || (closeoutInstructionConsumed && !isCloseoutFixtureCorrection(attempt.source_correction) && !isCloseoutCapabilityCorrection(attempt.source_correction) && !isCloseoutScopeFixtureCorrection(attempt.source_correction)) || (closeoutScopeCorrectionConsumed && !usesCloseoutInstructionInputs(attempt.source_correction)) || (closeoutContinuationConsumed && !isCloseoutScopeCorrection(attempt.source_correction) && !usesCloseoutInstructionInputs(attempt.source_correction)) ||
        (closeoutConsumed && !isCloseoutContinuation(attempt.source_correction) && !isCloseoutScopeCorrection(attempt.source_correction) && !usesCloseoutInstructionInputs(attempt.source_correction))) throw fail("attempt_closeout_candidate_consumed");
    if (companionTimeoutConsumed && !isAnyCloseout(attempt.source_correction)) throw fail("attempt_companion_timeout_successor_terminal");
    if (hasCloseoutMarker(attempt)) {
      if (!companionTimeoutConsumed || !validCloseoutAttempt(attempt) ||
          (isCloseoutScopeFixtureCorrection(attempt.source_correction) ? !closeoutCapabilityCorrectionConsumed : isCloseoutCapabilityCorrection(attempt.source_correction) ? !closeoutFixtureCorrectionConsumed : isCloseoutFixtureCorrection(attempt.source_correction) ? !closeoutInstructionConsumed : isCloseoutInstructionReplacement(attempt.source_correction) ? !closeoutScopeCorrectionConsumed : isCloseoutScopeCorrection(attempt.source_correction) ? !closeoutContinuationConsumed : isCloseoutContinuation(attempt.source_correction) !== closeoutConsumed)) throw fail("attempt_closeout_lineage_invalid");
      if (isCloseoutScopeFixtureCorrection(attempt.source_correction)) closeoutScopeFixtureCorrectionConsumed = true;
      else if (isCloseoutCapabilityCorrection(attempt.source_correction)) closeoutCapabilityCorrectionConsumed = true;
      if (isCloseoutFixtureCorrection(attempt.source_correction)) closeoutFixtureCorrectionConsumed = true;
      if (isCloseoutInstructionReplacement(attempt.source_correction)) closeoutInstructionConsumed = true;
      if (isCloseoutScopeCorrection(attempt.source_correction)) closeoutScopeCorrectionConsumed = true;
      if (isCloseoutContinuation(attempt.source_correction)) closeoutContinuationConsumed = true;
      closeoutConsumed = true;
    }
    if (attempt.source_correction?.schema === COMPANION_TIMEOUT_SCHEMA && !revision) {
      if (!validCompanionTimeoutAttempt(attempt)) throw fail("attempt_companion_timeout_lineage_invalid");
      companionTimeoutConsumed = true;
    }
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
    if (!entries.includes("correction-successor.json")) return { family_id: familyId, number, attempt_id: attempt.attempt_id, input_replacement_consumed: inputReplacementConsumed, ...(observerRepairConsumed ? { observer_repair_consumed: true } : {}), ...(correctedTimeoutConsumed ? { corrected_timeout_consumed: true } : {}), ...(conditionRequalificationConsumed ? { condition_requalification_consumed: true } : {}), ...(guideCorrectionConsumed ? { guide_correction_consumed: true } : {}), ...(operatingProfileConsumed ? { operating_profile_consumed: true } : {}), ...(successorBudgetConsumed ? { successor_budget_consumed: true } : {}), ...(revisionCount ? { reviewed_revision_consumed: revisionCount, revision_commission: revisionCommission, revision_grants: [...revisionGrants] } : {}), ...(companionTimeoutConsumed ? { companion_timeout_consumed: true } : {}), ...(closeoutConsumed ? { closeout_consumed: true } : {}), ...(closeoutContinuationConsumed ? { closeout_continuation_consumed: true } : {}), ...(closeoutScopeCorrectionConsumed ? { closeout_scope_correction_consumed: true } : {}), ...(closeoutInstructionConsumed ? { closeout_instruction_consumed: true } : {}), ...(closeoutFixtureCorrectionConsumed ? { closeout_fixture_correction_consumed: true } : {}), ...(closeoutCapabilityCorrectionConsumed ? { closeout_capability_correction_consumed: true } : {}), ...(closeoutScopeFixtureCorrectionConsumed ? { closeout_scope_fixture_correction_consumed: true } : {}) };
    const edge = read(edgeFile), revisionEdge = edge.kind === "reviewed_revision";
    if (revisionCount && !revisionEdge) throw fail("attempt_revision_commission_terminal");
    if (successorBudgetConsumed && !revisionEdge) throw fail("attempt_successor_budget_terminal");
    if (observerRepairConsumed && !revisionEdge) throw fail("attempt_observer_successor_terminal");
    if (correctedTimeoutConsumed && !revisionEdge) throw fail("attempt_timeout_successor_terminal");
    if (guideCorrectionConsumed && !revisionEdge) throw fail("attempt_guide_successor_terminal");
    // Preserve the old terminal refusal before requesting a completion for an
    // unauthorized continuation; only the explicit new kind needs that binding.
    if (operatingProfileConsumed && !revisionEdge && edge.kind !== "settled_successor_budget") throw fail("attempt_operating_profile_successor_terminal");
    const completion = read(path.join(root, `completion-${number}.json`));
    if (conditionRequalificationConsumed && !revisionEdge && edge.kind !== "guide_cancellation_correction") throw fail("attempt_condition_successor_terminal");
    if (closeoutCapabilityCorrectionConsumed && edge.kind !== CLOSEOUT_SCOPE_FIXTURE_CORRECTION_KIND) throw fail("attempt_closeout_candidate_consumed");
    if (closeoutFixtureCorrectionConsumed && ![CLOSEOUT_CAPABILITY_CORRECTION_KIND, CLOSEOUT_SCOPE_FIXTURE_CORRECTION_KIND].includes(edge.kind)) throw fail("attempt_closeout_candidate_consumed");
    if (closeoutInstructionConsumed && ![CLOSEOUT_FIXTURE_CORRECTION_KIND, CLOSEOUT_CAPABILITY_CORRECTION_KIND, CLOSEOUT_SCOPE_FIXTURE_CORRECTION_KIND].includes(edge.kind)) throw fail("attempt_closeout_candidate_consumed");
    if (closeoutScopeCorrectionConsumed && ![CLOSEOUT_INSTRUCTION_KIND, CLOSEOUT_FIXTURE_CORRECTION_KIND, CLOSEOUT_CAPABILITY_CORRECTION_KIND, CLOSEOUT_SCOPE_FIXTURE_CORRECTION_KIND].includes(edge.kind)) throw fail("attempt_closeout_candidate_consumed");
    if (closeoutContinuationConsumed && ![CLOSEOUT_SCOPE_CORRECTION_KIND, CLOSEOUT_INSTRUCTION_KIND, CLOSEOUT_FIXTURE_CORRECTION_KIND, CLOSEOUT_CAPABILITY_CORRECTION_KIND, CLOSEOUT_SCOPE_FIXTURE_CORRECTION_KIND].includes(edge.kind)) throw fail("attempt_closeout_candidate_consumed");
    if (closeoutConsumed && ![CLOSEOUT_CONTINUATION_KIND, CLOSEOUT_SCOPE_CORRECTION_KIND, CLOSEOUT_INSTRUCTION_KIND, CLOSEOUT_FIXTURE_CORRECTION_KIND, CLOSEOUT_CAPABILITY_CORRECTION_KIND, CLOSEOUT_SCOPE_FIXTURE_CORRECTION_KIND].includes(edge.kind)) throw fail("attempt_closeout_candidate_consumed");
    if (companionTimeoutConsumed && !["issue_1559_closeout", CLOSEOUT_CONTINUATION_KIND, CLOSEOUT_SCOPE_CORRECTION_KIND, CLOSEOUT_INSTRUCTION_KIND, CLOSEOUT_FIXTURE_CORRECTION_KIND, CLOSEOUT_CAPABILITY_CORRECTION_KIND, CLOSEOUT_SCOPE_FIXTURE_CORRECTION_KIND].includes(edge.kind)) throw fail("attempt_companion_timeout_successor_terminal");
    const edgeKeys = edge.contract === undefined ? ["family_id", "head", "tree", "proof_fingerprint"] : ["contract", "kind", "family_id", "head", "tree", "proof_fingerprint"];
    if (completion.contract !== ATTEMPT_CONTRACT || completion.attempt_id !== attempt.attempt_id || !sha(completion.receipt_fingerprint) || !sha(edge.family_id) || !sha(edge.proof_fingerprint) ||
        digest(Object.keys(edge).sort()) !== digest(edgeKeys.sort()) ||
        (edge.contract !== undefined && (edge.contract !== "augnes.local-canonical-successor.v2" || !["browser_input_replacement", "observer_repair", "corrected_timeout", "condition_requalification", "guide_cancellation_correction", "operating_profile_efficiency", "settled_successor_budget", "reviewed_revision", "companion_readiness_timeout", "issue_1559_closeout", CLOSEOUT_CONTINUATION_KIND, CLOSEOUT_SCOPE_CORRECTION_KIND, CLOSEOUT_INSTRUCTION_KIND, CLOSEOUT_FIXTURE_CORRECTION_KIND, CLOSEOUT_CAPABILITY_CORRECTION_KIND, CLOSEOUT_SCOPE_FIXTURE_CORRECTION_KIND].includes(edge.kind)))) throw fail("attempt_lineage_edge_invalid");
    const next = read(path.join(anchorRoot, ".augnes-local-verification", "families", edge.family_id, "attempt-1.json"));
    const reconciledSettlement = matchesCloseoutRuntimeSettlementPredecessor(next.source_correction, attempt, completion);
    if (completion.cleanup_complete !== true && !reconciledSettlement) throw fail("attempt_lineage_edge_invalid");
    const proof = next.browser_replacement ?? next.source_correction;
    if (closeoutScopeFixtureCorrectionConsumed && !matchesCloseoutAmendmentPredecessor(next.source_correction, attempt, completion)) throw fail("attempt_closeout_candidate_consumed");
    if (!proof || proof.prior_family_id !== familyId || proof.prior_number !== number || proof.prior_attempt_id !== attempt.attempt_id || proof.prior_receipt_fingerprint !== completion.receipt_fingerprint ||
        digest(proof) !== edge.proof_fingerprint || next.head !== edge.head || next.tree !== edge.tree ||
        candidateFamilyId(branch, next.source_correction, next.browser_replacement) !== edge.family_id ||
        (edge.kind === "browser_input_replacement") !== !!next.browser_replacement ||
        (edge.kind === "observer_repair") !== isObserverRepair(next.source_correction) ||
        (edge.kind === "corrected_timeout") !== isCorrectedTimeout(next.source_correction) ||
        (edge.kind === "issue_1559_closeout") !== isCloseout(next.source_correction) ||
        (edge.kind === CLOSEOUT_CONTINUATION_KIND) !== isCloseoutContinuation(next.source_correction) ||
        (edge.kind === CLOSEOUT_SCOPE_CORRECTION_KIND) !== isCloseoutScopeCorrection(next.source_correction) ||
        (edge.kind === CLOSEOUT_INSTRUCTION_KIND) !== isCloseoutInstructionReplacement(next.source_correction) ||
        (edge.kind === CLOSEOUT_FIXTURE_CORRECTION_KIND) !== isCloseoutFixtureCorrection(next.source_correction) ||
        (edge.kind === CLOSEOUT_CAPABILITY_CORRECTION_KIND) !== isCloseoutCapabilityCorrection(next.source_correction) ||
        (edge.kind === CLOSEOUT_SCOPE_FIXTURE_CORRECTION_KIND) !== isCloseoutScopeFixtureCorrection(next.source_correction) ||
        (isCloseoutScopeFixtureCorrection(next.source_correction) && ((hasCloseoutScopeAmendment(next.source_correction) ? !matchesCloseoutAmendmentPredecessor(next.source_correction, attempt, completion) : !isCloseoutCapabilityCorrection(attempt.source_correction)) || !validCloseoutAttempt(next) || (completion.disposition !== "product_failure" && !reconciledSettlement))) ||
        (isCloseoutCapabilityCorrection(next.source_correction) && (!isCloseoutFixtureCorrection(attempt.source_correction) || !validCloseoutAttempt(next) || completion.disposition !== "product_failure")) ||
        (isCloseoutFixtureCorrection(next.source_correction) && (!isCloseoutInstructionReplacement(attempt.source_correction) || !validCloseoutAttempt(next) || completion.disposition !== "product_failure")) ||
        (isCloseoutInstructionReplacement(next.source_correction) && (!isCloseoutScopeCorrection(attempt.source_correction) || !validCloseoutAttempt(next) || completion.disposition !== "safety_violation")) ||
        (isCloseoutScopeCorrection(next.source_correction) && (!isCloseoutContinuation(attempt.source_correction) || !validCloseoutAttempt(next) || completion.disposition !== "product_failure")) ||
        (isCloseoutContinuation(next.source_correction) && (!isCloseout(attempt.source_correction) || !validCloseoutAttempt(next) || completion.disposition !== "product_failure")) ||
        (isCloseout(next.source_correction) && (!isCompanionTimeout(attempt.source_correction) || !validCloseoutAttempt(next) || completion.disposition !== "product_failure")) ||
        (edge.kind === "companion_readiness_timeout") !== isCompanionTimeout(next.source_correction) ||
        (edge.kind === "condition_requalification") !== isConditionRequalification(next.source_correction) ||
        (edge.kind === "operating_profile_efficiency") !== isOperatingProfileSuccession(next.source_correction) ||
        (edge.kind === "settled_successor_budget") !== isSuccessorBudgetSuccession(next.source_correction) ||
        revisionEdge !== isReviewedRevision(next.source_correction) ||
        (revisionEdge && (!validReviewedRevisionAttempt(next) || !revisionFollows(proof, revisionCount, revisionCommission, revisionGrants) ||
          (!["product_failure", "input_invalidation"].includes(completion.disposition) &&
            !(completion.disposition === "safety_violation" && revisionCount === 2 && proof.commission.ordinal === 1)) ||
          (proof.commission.ordinal === 1 && (proof.authorization.grant_comment_id === attempt.source_correction?.authorization?.grant_comment_id ||
            Date.parse(next.revision_authority.execution_commission.timestamp) <= Date.parse(completion.finished_at))))) ||
        (isSuccessorBudgetSuccession(next.source_correction) && (!isOperatingProfileSuccession(attempt.source_correction) || completion.disposition !== "product_failure" ||
          !validSuccessorBudgetAttempt(next) || next.source_correction.authorization?.grant_comment_id === attempt.source_correction.authorization?.grant_comment_id)) ||
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
  if (isReviewedRevision(proof)) {
    readReviewedRevisionEvidence(file, proof, repositoryRoot);
    return { ...proof, local_relative_path: relative };
  }
  if (isSuccessorBudgetSuccession(proof)) {
    readSuccessorBudgetEvidence(file, proof, repositoryRoot);
    return { ...proof, local_relative_path: relative };
  }
  if (isOperatingProfileSuccession(proof)) {
    readOperatingProfileEvidence(file, proof, repositoryRoot);
    return { ...proof, local_relative_path: relative };
  }
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

function admitSourceCorrection({ anchorRoot, repositoryRoot, branch, head, tree, proof, acceptedMain, browserAuthorization, browserLive, observerAuthorization, timeoutAuthorization, conditionAuthorization, guideAuthorization, profileAuthorization, budgetAuthorization, revisionAuthorization, revisionInputs, companionTimeoutAuthorization, closeoutAuthorization, closeoutInputs, reserve }) {
  if (isAnyCloseout(proof)) assertCloseoutIssuedCapability(proof, closeoutAuthorization);
  const reread = readSourceCorrectionProof(path.join(repositoryRoot, proof.local_relative_path ?? ""), repositoryRoot);
  if (digest(reread) !== digest(proof) || proof.branch !== branch || proof.head !== head || proof.tree !== tree ||
      !/^[0-9a-f]{40}$/u.test(head) || !/^[0-9a-f]{40}$/u.test(tree)) throw fail("source_correction_identity_invalid");
  if (isAnyCloseout(proof)) {
    const completion = JSON.parse(closeoutArtifact(path.dirname(path.join(repositoryRoot, proof.local_relative_path)), proof.originals.completion));
    assertCloseoutAuthorization(proof, closeoutAuthorization, completion, closeoutInputs, { requireUnfaulted: reserve });
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
  if (isReviewedRevision(proof)) {
    const evidence = readReviewedRevisionEvidence(path.join(repositoryRoot, proof.local_relative_path), proof, repositoryRoot);
    const capability = revisionCapabilities.get(revisionAuthorization);
    if (!capability || capability.proof !== digest(proof) || capability.observations !== digest(revisionAuthorization.observations) ||
        !revisionEqual(revisionInputs, evidence.inputs) || acceptedMain !== proof.base ||
        (Date.parse(revisionAuthorization.observations.execution_commission.timestamp) <= Date.parse(evidence.completion.finished_at) ||
         !isReviewedRevision(evidence.prior.source_correction) && Date.parse(revisionAuthorization.observations.accepted_revision.timestamp) <= Date.parse(evidence.completion.finished_at)) && proof.commission.ordinal === 1 ||
        evidence.dependencySafety && !capability.prospectiveDependencySafety)
      throw fail("revision_authenticated_authority_required");
    const priorRoot = path.join(anchorRoot, ".augnes-local-verification", "families", proof.prior_family_id);
    if (realpathSync(priorRoot) !== priorRoot || readdirSync(priorRoot).includes(`attempt-${proof.prior_number + 1}.json`)) throw fail("revision_latest_settled_required");
    for (const kind of ["attempt", "completion"]) {
      const actual = path.join(priorRoot, `${kind}-${proof.prior_number}.json`); read(actual);
      if (digest(readFileSync(actual)) !== proof.originals[kind].sha256) throw fail("revision_original_ledger_changed");
    }
    const receiptFile = path.join(repositoryRoot, ".augnes-local-verification", "receipts", `${proof.prior_attempt_id}.json`);
    read(receiptFile, 512 * 1024);
    if (digest(readFileSync(receiptFile)) !== proof.originals.receipt.sha256) throw fail("revision_original_receipt_changed");
    const successor = { contract: "augnes.local-canonical-successor.v2", kind: "reviewed_revision",
      family_id: candidateFamilyId(branch, proof), head, tree, proof_fingerprint: digest(proof) };
    // The historical blocked receipt is never reclassified. Admission after it
    // requires fresh, physically safe preparation under the corrected owner.
    // This is a current-input gate, not a pre-install dependency freeze.
    if (reserve && evidence.dependencySafety) for (const expected of evidence.focused.prospective_dependencies) {
      const current = observePreparedDependencyInputs({ repositoryRoot, phaseId: expected.phase_id });
      if (comparePreparedDependencyInputs(expected, current) !== "unchanged") throw fail("revision_prospective_dependencies_changed");
    }
    if (reserve) append(priorRoot, "correction-successor.json", successor);
    if (!revisionEqual(read(path.join(priorRoot, "correction-successor.json")), successor)) throw fail("revision_successor_already_bound");
    return;
  }
  if (isSuccessorBudgetSuccession(proof)) {
    const completion = JSON.parse(timeoutArtifact(path.dirname(path.join(repositoryRoot, proof.local_relative_path)), proof.originals.completion));
    assertSuccessorBudgetAuthorization(proof, budgetAuthorization, completion);
    if (acceptedMain !== proof.base) throw fail("budget_current_base_required");
    const priorRoot = path.join(anchorRoot, ".augnes-local-verification", "families", proof.prior_family_id);
    if (realpathSync(priorRoot) !== priorRoot || readdirSync(priorRoot).includes(`attempt-${proof.prior_number + 1}.json`)) throw fail("budget_latest_settled_required");
    for (const kind of ["attempt", "completion"]) {
      const actual = path.join(priorRoot, `${kind}-${proof.prior_number}.json`);
      read(actual);
      if (digest(readFileSync(actual)) !== proof.originals[kind].sha256) throw fail("budget_original_ledger_changed");
    }
    const prior = read(path.join(priorRoot, `attempt-${proof.prior_number}.json`));
    const incomingEdge = path.join(anchorRoot, ".augnes-local-verification", "families", prior.source_correction.prior_family_id, "correction-successor.json");
    read(incomingEdge);
    if (digest(readFileSync(incomingEdge)) !== proof.originals.edge.sha256) throw fail("budget_original_edge_changed");
    const successor = { contract: "augnes.local-canonical-successor.v2", kind: "settled_successor_budget",
      family_id: candidateFamilyId(branch, proof), head, tree, proof_fingerprint: digest(proof) };
    // The existing exclusive edge consumes this prospective scope, even if the
    // process is interrupted before the successor attempt can be appended.
    if (reserve) append(priorRoot, "correction-successor.json", successor);
    if (digest(read(path.join(priorRoot, "correction-successor.json"))) !== digest(successor)) throw fail("budget_successor_already_bound");
    return;
  }
  if (isOperatingProfileSuccession(proof)) {
    const completion = JSON.parse(profileArtifact(path.dirname(path.join(repositoryRoot, proof.local_relative_path)), proof.originals.completion));
    assertOperatingProfileAuthorization(proof, profileAuthorization, completion);
    if (acceptedMain !== proof.base) throw fail("profile_current_base_required");
    const priorRoot = path.join(anchorRoot, ".augnes-local-verification", "families", proof.prior_family_id);
    if (realpathSync(priorRoot) !== priorRoot || readdirSync(priorRoot).includes(`attempt-${proof.prior_number + 1}.json`)) throw fail("profile_latest_settled_required");
    for (const kind of ["attempt", "completion"]) {
      const actual = path.join(priorRoot, `${kind}-${proof.prior_number}.json`);
      read(actual);
      if (digest(readFileSync(actual)) !== proof.originals[kind].sha256) throw fail("profile_original_ledger_changed");
    }
    const successor = { contract: "augnes.local-canonical-successor.v2", kind: "operating_profile_efficiency",
      family_id: candidateFamilyId(branch, proof), head, tree, proof_fingerprint: digest(proof) };
    // Reservation belongs exclusively to this existing edge, including interruption.
    if (reserve) append(priorRoot, "correction-successor.json", successor);
    if (digest(read(path.join(priorRoot, "correction-successor.json"))) !== digest(successor)) throw fail("profile_successor_already_bound");
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
  validateSourceCorrectionBinding({ repositoryRoot, branch, head, tree, proof, prior, completion, acceptedMain, browserAuthorization, browserLive });
  const successor = { family_id: candidateFamilyId(branch, proof), head, tree, proof_fingerprint: digest(proof) };
  const reservation = path.join(priorRoot, "correction-successor.json");
  if (reserve) {
    append(priorRoot, "correction-successor.json", successor);
  }
  if (digest(read(reservation)) !== digest(successor)) throw fail("source_correction_successor_already_bound");
}

// Pure validation shared with the authorized closeout amendment. It neither
// reserves an edge nor issues authority; ordinary admission keeps its owner.
export function validateSourceCorrectionBinding({ repositoryRoot, branch, head, tree, proof, prior, completion, acceptedMain, browserAuthorization, browserLive }) {
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

// Reviewed revisions share the existing proof, authenticated transport and
// exclusive edge. The commission's root and ordinal are reconstructed from
// those append-only edges; there is no resettable allowance or approval ledger.
const revisionEqual = (a, b) => a !== undefined && b !== undefined && digest(a) === digest(b);
const revisionKeys = (value, names) => value && typeof value === "object" && !Array.isArray(value) && revisionEqual(Object.keys(value).sort(), [...names].sort());
const revisionCommit = value => /^[0-9a-f]{40}$/u.test(value ?? "");
const revisionTime = value => typeof value === "string" && Number.isFinite(Date.parse(value)) && Date.parse(value) <= Date.now();
const revisionId = value => Number.isSafeInteger(value) && value > 0;
const revisionRef = value => value && sha(value.sha256);
const revisionPath = value => typeof value === "string" && /^[A-Za-z0-9_.\/-]+$/u.test(value) && !value.startsWith("/") && !value.split("/").some(p => !p || p === "." || p === "..");

export function reviewedRevisionAuthorityObservation(record, role) {
  return { id: record.id, author: record.user?.login, author_id: record.user?.id,
    body_sha256: digest(record.body), timestamp: record.updated_at ?? record.submitted_at ?? record.created_at,
    role, commit_id: role === "accepted_revision" ? record.commit_id : null };
}

function revisionCommissionIdentity(proof) {
  return digest({ pull_request: proof.pull_request, branch: proof.branch, accepted: proof.accepted,
    authorization: proof.authorization, root_family_id: proof.commission.root_family_id,
    root_number: proof.commission.root_number, root_attempt_id: proof.commission.root_attempt_id,
    root_receipt_fingerprint: proof.commission.root_receipt_fingerprint,
    maximum_invocations: proof.commission.maximum_invocations });
}

// A different authenticated grant can follow a spent commission only at its
// settled latest edge. Grant IDs, including all earlier commissions, are read
// from the append-only chain; changing a head, root or body cannot reset one.
function revisionFollows(proof, count, commission, grants) {
  if (!revisionShape(proof)) return false;
  if (count && revisionCommissionIdentity(proof) === commission) return proof.commission.ordinal === count + 1;
  return (!count || count === 2) && proof.commission.ordinal === 1 && !grants.includes(proof.authorization.grant_comment_id);
}

function revisionShape(p) {
  const c = p?.commission;
  return isReviewedRevision(p) && typeof p.branch === "string" && p.branch.length > 0 && p.branch.length <= 200 &&
    [p.head, p.tree, p.base, p.accepted?.head, p.accepted?.tree, p.accepted?.base].every(revisionCommit) &&
    revisionId(p.pull_request) && sha(p.prior_family_id) && [1, 2].includes(p.prior_number) && typeof p.prior_attempt_id === "string" &&
    sha(p.prior_receipt_fingerprint) && revisionKeys(c, ["root_family_id", "root_number", "root_attempt_id", "root_receipt_fingerprint", "ordinal", "maximum_invocations"]) &&
    sha(c.root_family_id) && [1, 2].includes(c.root_number) && typeof c.root_attempt_id === "string" && sha(c.root_receipt_fingerprint) &&
    [1, 2].includes(c.ordinal) && c.maximum_invocations === 2 &&
    (c.ordinal === 1 ? c.root_family_id === p.prior_family_id && c.root_number === p.prior_number && c.root_attempt_id === p.prior_attempt_id && c.root_receipt_fingerprint === p.prior_receipt_fingerprint :
      c.root_family_id !== p.prior_family_id && c.root_attempt_id !== p.prior_attempt_id) && revisionId(p.accepted.review?.id) && revisionRef(p.accepted.review) &&
    revisionKeys(p.authorization, ["grant_comment_id", "grant_sha256"]) && revisionId(p.authorization.grant_comment_id) && sha(p.authorization.grant_sha256) &&
    ["receipt", "attempt", "completion", "stock"].every(k => revisionRef(p.originals?.[k])) &&
    revisionRef(p.source) && revisionRef(p.focused) && revisionRef(p.inputs?.current) && sha(p.inputs?.identity_sha256) && sha(p.inputs?.predecessor_sha256);
}

export function validReviewedRevisionAttempt(attempt) {
  const p = attempt?.source_correction;
  if (!revisionShape(p) || attempt.number !== 1 || attempt.recovery || attempt.browser_replacement ||
      !revisionEqual(attempt.budget, { initial: 1, recovery: 0 }) || p.branch !== attempt.branch || p.head !== attempt.head || p.tree !== attempt.tree ||
      !revisionKeys(attempt.revision_authority, ["accepted_revision", "execution_commission"])) return false;
  return ["accepted_revision", "execution_commission"].every(role => {
    const o = attempt.revision_authority[role], ref = role === "accepted_revision" ? p.accepted.review : { id: p.authorization.grant_comment_id, sha256: p.authorization.grant_sha256 };
    return revisionKeys(o, ["id", "author", "author_id", "body_sha256", "timestamp", "role", "commit_id"]) && o.role === role &&
      revisionId(o.author_id) && /^[A-Za-z0-9-]{1,39}$/u.test(o.author ?? "") && sha(o.body_sha256) && revisionTime(o.timestamp) &&
      o.id === ref.id && digest(o) === ref.sha256 && o.commit_id === (role === "accepted_revision" ? p.accepted.head : null);
  }) && Date.parse(attempt.revision_authority.execution_commission.timestamp) > Date.parse(attempt.revision_authority.accepted_revision.timestamp);
}

export function validateReviewedRevisionAuthorityRecords(p, review, grant, permissions, pr) {
  if (!revisionShape(p)) throw fail("revision_authority_missing");
  const observations = {};
  for (const [record, role, ref] of [[review, "accepted_revision", p.accepted.review], [grant, "execution_commission", { id: p.authorization.grant_comment_id, sha256: p.authorization.grant_sha256 }]]) {
    if (record?.id !== ref.id || record.user?.type !== "User" || !revisionId(record.user?.id) || !/^[A-Za-z0-9-]{1,39}$/u.test(record.user?.login ?? "") ||
        !["OWNER", "MEMBER", "COLLABORATOR"].includes(record.author_association) || typeof record.body !== "string" || Buffer.byteLength(record.body) > 64 * 1024)
      throw fail("revision_authority_identity_invalid");
    if (role === "accepted_revision" ? record.pull_request_url !== `https://api.github.com/repos/hynk-studio/augnes/pulls/${p.pull_request}` ||
      !["COMMENTED", "APPROVED"].includes(record.state) || record.commit_id !== p.accepted.head :
      record.issue_url !== `https://api.github.com/repos/hynk-studio/augnes/issues/${p.pull_request}`) throw fail("revision_authority_source_invalid");
    const o = reviewedRevisionAuthorityObservation(record, role);
    if (!revisionTime(o.timestamp) || digest(o) !== ref.sha256) throw fail("revision_authority_changed");
    if (permissions[role]?.user?.login !== record.user.login || !["admin", "maintain"].includes(permissions[role]?.permission)) throw fail("revision_authority_permission_invalid");
    observations[role] = o;
  }
  // These generic scope clauses distinguish a prospective bounded commission
  // from an accepted historical repair or an ordinary approval comment. The
  // exact authenticated body hash remains binding, including all limitations.
  const grantText = grant.body.replaceAll("*", "").replaceAll("`", "").replace(/\s+/gu, " ");
  const legacyScope = [p.accepted.head, p.accepted.tree, p.branch, `https://github.com/hynk-studio/augnes/pull/${p.pull_request}#pullrequestreview-${p.accepted.review.id}`].every(s => grant.body.includes(s)) &&
    /reviewed source\/execution-input revision/iu.test(grantText) && /two admitted deciding invocations for this entire commission/iu.test(grantText) &&
    /materially corrected/iu.test(grantText) && /focused checks/iu.test(grantText) && /no additional recovery allowance/iu.test(grantText) && /Interrupted reservations consume/iu.test(grantText);
  const prospectiveScope = [p.branch, String(p.accepted.review.id), p.commission.root_receipt_fingerprint].every(s => grant.body.includes(s)) &&
    /NEW.*commission/iu.test(grantText) && /v7 reviewed_revision/iu.test(grantText) && /old commission remains spent/iu.test(grantText) &&
    /at most two admitted deciding invocations total/iu.test(grantText) && /demonstrated material.*correction.*focused support/iu.test(grantText) &&
    /zero extra recovery/iu.test(grantText) && /Reservation\/interruption consumes/iu.test(grantText);
  if (![p.accepted.head, p.accepted.tree, p.accepted.base, "ACCEPT / RETAIN"].every(s => review.body.includes(s)) ||
      !(legacyScope || prospectiveScope) || !/zero unchanged-target retry/iu.test(grantText) ||
      !/separate fresh-process stock/iu.test(grantText) || !/independent.*(?:audit|judgment|decision)/iu.test(grantText)) throw fail("revision_authority_scope_invalid");
  if (Date.parse(observations.execution_commission.timestamp) <= Date.parse(observations.accepted_revision.timestamp)) throw fail("revision_authority_order_invalid");
  if (pr?.number !== p.pull_request || pr.state !== "open" || pr.draft !== true || pr.merged !== false || pr.auto_merge !== null ||
      pr.head?.repo?.full_name !== "hynk-studio/augnes" || pr.base?.repo?.full_name !== "hynk-studio/augnes" || pr.head.sha !== p.head ||
      pr.head.ref !== p.branch || pr.base.sha !== p.base || pr.base.ref !== "main") throw fail("revision_published_source_invalid");
  return observations;
}

export async function authorizeReviewedRevision(p, { transport = createGitHubObserverAuthorizationTransport(p.pull_request) } = {}) {
  if (!revisionShape(p)) throw fail("revision_authority_missing");
  const review = await transport.review(p.accepted.review.id), grant = await transport.grant(p.authorization.grant_comment_id);
  const permissions = { accepted_revision: await transport.permission(review?.user?.login), execution_commission: await transport.permission(grant?.user?.login) };
  const observations = validateReviewedRevisionAuthorityRecords(p, review, grant, permissions, await transport.pullRequest());
  const capability = Object.freeze({ observations });
  const grantText = grant.body.replaceAll("*", "").replaceAll("`", "").replace(/\s+/gu, " ");
  revisionCapabilities.set(capability, { proof: digest(p), observations: digest(observations),
    prospectiveDependencySafety: grant.body.includes(p.commission.root_receipt_fingerprint) &&
      /Preserve the original safety_violation \/ blocked receipt/iu.test(grantText) && /clean prospective dependency preparation and current safety checks/iu.test(grantText) });
  return capability;
}

function revisionArtifact(folder, reference, maximum = 512 * 1024) {
  if (!revisionKeys(reference, ["artifact", "sha256"]) || !/^[a-z0-9_-]+\.(?:json|log)$/u.test(reference.artifact ?? "") || !sha(reference.sha256)) throw fail("revision_artifact_invalid");
  const file = path.join(folder, reference.artifact), s = lstatSync(file);
  if (realpathSync(file) !== file || !s.isFile() || s.isSymbolicLink() || s.nlink !== 1 || s.size > maximum || (s.mode & 0o022)) throw fail("revision_artifact_unsafe");
  const bytes = readFileSync(file);
  if (digest(bytes) !== reference.sha256) throw fail("revision_artifact_changed");
  return bytes;
}

function revisionPriorInputs(receipt) {
  return isReviewedRevision(receipt.attempt?.source_correction) ? receipt.attempt.source_correction.inputs.identity_sha256 :
    digest(receipt.inputs.resources.filter(resource => ["node-executable", "node-headers"].includes(resource.id)));
}

function knownInputInvalidation(receipt, dependencySafety = false) {
  const input = receipt.inputs, roles = new Set(["node-executable", "node-headers", "dependencies-root", "dependencies-nested", "dependencies-web-planning"]);
  const disposition = dependencySafety ? "safety_violation" : "input_invalidation";
  if (receipt.outcome?.disposition !== disposition || receipt.outcome.safety !== "blocked" ||
      !input || !Array.isArray(input.resources) || !revisionEqual(input.first_fault, receipt.outcome.first_fault) || !Array.isArray(input.events) || input.events.length >= 64 ||
      !Array.isArray(input.secondary_faults) || input.secondary_faults.length >= 16 || !input.first_fault ||
      ![input.first_fault, ...input.secondary_faults].every(f => f.disposition === disposition && roles.has(f.resource) && (!dependencySafety || f.resource.startsWith("dependencies-")) && f.diagnostic === undefined)) return false;
  const faults = [];
  for (const event of input.events) {
    const resource = input.resources.find(r => r.id === event.resource);
    const prepared = !resource && isReviewedRevision(receipt.attempt?.source_correction) && Array.isArray(input.prepared_dependencies) ?
      input.prepared_dependencies.filter(r => r?.phase_id === event.resource) : [];
    const dependency = prepared.length === 1 && roles.has(event.resource) && event.resource.startsWith("dependencies-") && prepared[0].error === `dependency_input_${disposition}` &&
      prepared[0].unchanged === false && revisionEqual(prepared[0].after, event.after) && receipt.phases?.some(phase => phase.id === event.resource && phase.status === "pass") ? prepared[0] : null;
    // An incomplete v1 layout/security observation stays blocked. Content and
    // source equality only identify the bounded old fault, never prove safety.
    if (dependencySafety && dependency && (dependency.before?.contract !== "augnes.local-canonical-prepared-dependencies.v1" ||
        dependency.after?.contract !== dependency.before.contract || dependency.before.content_sha256 !== dependency.after.content_sha256 ||
        dependency.before.bytes !== dependency.after.bytes || dependency.before.location_fingerprint !== dependency.after.location_fingerprint ||
        !revisionEqual(dependency.before.sources, dependency.after.sources))) return false;
    const comparison = resource ? classifyInputChange(resource.before, event.after, resource, input) :
      dependency ? comparePreparedDependencyInputs(dependency.before, event.after) : null;
    if ((!resource && !dependency) || event.diagnostic !== undefined || event.classification !== (resource?.classification ?? "execution") ||
        event.identity !== inputEventIdentity(event) || comparison !== event.disposition ||
        (!nonFaultInputChange(event.disposition) && (event.disposition !== disposition || !roles.has(event.resource) || dependencySafety && !dependency))) return false;
    if (event.disposition === disposition) faults.push(event);
  }
  return faults.length > 0 && [input.first_fault, ...input.secondary_faults].every(f => faults.some(e =>
    e.resource === f.resource && e.observed_at === f.observed_at && e.monotonic_ns === f.monotonic_ns));
}

export function readReviewedRevisionEvidence(file, p, repositoryRoot) {
  const stored = { ...p }; delete stored.local_relative_path;
  if (!revisionKeys(stored, ["schema", "kind", "branch", "base", "head", "tree", "prior_family_id", "prior_number", "prior_attempt_id", "prior_receipt_fingerprint", "pull_request", "commission", "accepted", "authorization", "originals", "inputs", "source", "focused"]) ||
      !revisionShape(p) || !revisionKeys(p.accepted, ["head", "tree", "base", "review"]) || !revisionKeys(p.accepted.review, ["id", "sha256"]) ||
      !revisionKeys(p.originals, ["receipt", "attempt", "completion", "stock"]) || !revisionKeys(p.inputs, ["predecessor_sha256", "identity_sha256", "current"])) throw fail("revision_proof_invalid");
  const bytes = ref => revisionArtifact(path.dirname(file), ref), parse = ref => JSON.parse(bytes(ref));
  const original = parse(p.originals.receipt), prior = parse(p.originals.attempt), completion = parse(p.originals.completion), inputs = parse(p.inputs.current);
  const content = { ...original }; delete content.integrity;
  const inputInvalidation = knownInputInvalidation(original), previousRevision = isReviewedRevision(prior.source_correction);
  const newCommission = previousRevision && prior.source_correction.commission.ordinal === 2 && p.commission.ordinal === 1 &&
    p.authorization.grant_comment_id !== prior.source_correction.authorization.grant_comment_id;
  const dependencySafety = newCommission && knownInputInvalidation(original, true);
  if (![4, 5].includes(original.receipt_version) || original.integrity?.content_fingerprint !== digest(content) ||
      !revisionEqual(original.attempt, prior) || prior.attempt_id !== p.prior_attempt_id || prior.family_id !== p.prior_family_id || prior.number !== p.prior_number ||
      prior.branch !== p.branch || original.integrity.content_fingerprint !== p.prior_receipt_fingerprint ||
      original.repository?.head_sha !== prior.head || original.repository.tree_sha !== prior.tree ||
      completion.contract !== ATTEMPT_CONTRACT || completion.attempt_id !== prior.attempt_id || completion.receipt_fingerprint !== p.prior_receipt_fingerprint ||
      !revisionTime(completion.finished_at) || completion.cleanup_complete !== true || completion.disposition !== original.outcome?.disposition ||
      (completion.disposition === "input_invalidation" ? !inputInvalidation : completion.disposition === "safety_violation" ? !dependencySafety :
        completion.disposition !== "product_failure" || original.outcome.safety !== "preserved_within_observed_scope") ||
      original.cleanup?.completed !== true || original.cleanup.remaining_owned_processes !== 0 || original.checkout_ownership?.released !== true || original.capacity_ownership?.released !== true ||
      original.cleanup.companion_service?.restored !== true || original.cleanup.isolated_resources?.completed !== true ||
      original.inputs?.resources?.filter(r => r.id === "node-executable").length !== 1 || p.inputs.predecessor_sha256 !== revisionPriorInputs(original)) throw fail("revision_predecessor_invalid");
  const stockLines = bytes(p.originals.stock).toString("utf8").split("\n").filter(line => line.startsWith("{"));
  if (stockLines.length !== 1) throw fail("revision_predecessor_stock_invalid");
  const stock = JSON.parse(stockLines[0]);
  if (stock.content_fingerprint !== p.prior_receipt_fingerprint || stock.dimensions?.historical_integrity !== "intact" || stock.dimensions?.safety !== original.outcome.safety ||
      stock.valid_deciding_evidence !== false) throw fail("revision_predecessor_stock_invalid");
  const c = p.commission;
  if (previousRevision ? !validReviewedRevisionAttempt(prior) || !revisionFollows(p, prior.source_correction.commission.ordinal,
      revisionCommissionIdentity(prior.source_correction), [prior.source_correction.authorization.grant_comment_id]) :
      c.ordinal !== 1 || c.root_family_id !== p.prior_family_id || c.root_number !== p.prior_number || c.root_attempt_id !== p.prior_attempt_id || c.root_receipt_fingerprint !== p.prior_receipt_fingerprint ||
      p.authorization.grant_comment_id === prior.source_correction?.authorization?.grant_comment_id) throw fail("revision_commission_lineage_invalid");
  if (digest(inputs) !== p.inputs.identity_sha256 || inputs?.contract !== "augnes.local-canonical-runtime-inputs.v1" || !sha(inputs.node?.location_fingerprint) ||
      inputs.node?.observation?.present !== true || !sha(inputs.node.observation.sha256) || !sha(inputs.headers?.location_fingerprint) ||
      !validNodeHeaders(inputs.headers?.observation)) throw fail("revision_inputs_invalid");
  const source = parse(p.source), focused = parse(p.focused);
  const git = args => execFileSync("git", ["--no-replace-objects", ...args], { cwd: repositoryRoot, timeout: 10000, maxBuffer: 16 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
  const delta = (a, b) => { const d = git(["diff", "--binary", "--full-index", "--no-ext-diff", "--no-textconv", a, b, "--"]); return { bytes: d.length, sha256: digest(d), paths: git(["diff", "--name-only", a, b, "--"]).toString().trim().split("\n").filter(Boolean).sort() }; };
  for (const [a, b] of [[p.accepted.head, p.head], [p.accepted.base, p.base], [p.base, p.head], [prior.head, p.head]]) git(["merge-base", "--is-ancestor", a, b]);
  for (const t of [p, p.accepted]) if (git(["rev-parse", `${t.head}^{tree}`]).toString().trim() !== t.tree) throw fail("revision_source_identity_invalid");
  if (source.schema !== "augnes.local-canonical-reviewed-revision-source.v1" || source.basis !== "implementation_owner_not_independent_review" ||
      !revisionEqual(source.accepted_to_final, delta(p.accepted.head, p.head)) || !revisionEqual(source.predecessor_to_final, delta(prior.head, p.head)) ||
      !revisionEqual(source.main_to_final, delta(p.base, p.head)) || !revisionTime(source.reviewed_at) || Date.parse(source.reviewed_at) <= Date.parse(completion.finished_at)) throw fail("revision_source_delta_invalid");
  const changedCode = source.predecessor_to_final.paths.filter(name => /\.(?:[cm]?[jt]sx?)$/u.test(name));
  // Metadata-only replacement/touching and proof reformatting cannot buy a
  // second invocation. Full identities still bind admission and stock; material
  // input repair requires an actual consumed path or content change.
  const materialInputs = value => ({ node: { location: value.node.location_fingerprint, sha256: value.node.observation.sha256 },
    headers: { location: value.headers.location_fingerprint, sha256: value.headers.observation.content_sha256 } });
  if (previousRevision && digest(original.inputs.binding?.runtime_inputs) !== prior.source_correction.inputs.identity_sha256) throw fail("revision_prior_runtime_binding_invalid");
  const legacyNode = original.inputs.resources.find(r => r.id === "node-executable");
  const changedInputs = previousRevision ? !revisionEqual(materialInputs(inputs), materialInputs(original.inputs.binding.runtime_inputs)) :
    inputs.node.location_fingerprint !== legacyNode.location_fingerprint || inputs.node.observation.sha256 !== legacyNode.before.sha256;
  if (!changedCode.length && !changedInputs) throw fail("revision_material_remedy_required");
  if (inputInvalidation || dependencySafety) {
    const affected = [...new Set([original.inputs.first_fault, ...original.inputs.secondary_faults].map(f => f.resource))].sort();
    const runtimeAffected = affected.filter(id => ["node-executable", "node-headers"].includes(id));
    const dependenciesAffected = affected.filter(id => id.startsWith("dependencies-"));
    if (!revisionEqual(focused.input_remedy_resources, affected) || runtimeAffected.some(id => {
      const role = id === "node-executable" ? "node" : "headers", resource = original.inputs.resources.find(r => r.id === id);
      const before = { location: resource.location_fingerprint, sha256: role === "node" ? resource.before.sha256 : resource.before.content_sha256 };
      return !changedInputs || revisionEqual(before, materialInputs(inputs)[role]);
    }) || (dependenciesAffected.length && (!changedCode.length || !Array.isArray(focused.implicated_paths) || !focused.implicated_paths.length)))
      throw fail("revision_input_remedy_required");
    if (dependencySafety && (!changedCode.includes("scripts/local-canonical-inputs.mjs") ||
        !focused.implicated_paths.includes("scripts/local-canonical-inputs.mjs") || !Array.isArray(focused.prospective_dependencies) ||
        !revisionEqual(focused.prospective_dependencies.map(v => v.phase_id).sort(), dependenciesAffected) ||
        focused.prospective_dependencies.some(v => v.contract !== PREPARED_DEPENDENCY_CONTRACT || !preparedDependencyIdentity(v))))
      throw fail("revision_prospective_dependencies_required");
  }
  // Locks and pinned package declarations are stable execution inputs for this
  // continuation; normal npm preparation produces dependencies separately.
  for (const name of ["package.json", "package-lock.json", "apps/augnes_apps/package.json", "apps/augnes_apps/package-lock.json", "apps/web_planning/package.json", "apps/web_planning/package-lock.json", ".node-version", ".nvmrc"])
    if (git(["diff", "--name-only", p.accepted.head, p.head, "--", name]).length) throw fail("revision_pinned_inputs_changed");
  if (focused.schema !== "augnes.local-canonical-reviewed-revision-focused.v1" || focused.basis !== "implementation_owner_not_independent_review" ||
      focused.predecessor_receipt_fingerprint !== p.prior_receipt_fingerprint || focused.runtime_inputs_sha256 !== p.inputs.identity_sha256 ||
      !revisionTime(focused.finished_at) || Date.parse(focused.finished_at) <= Date.parse(completion.finished_at) ||
      typeof focused.remedy !== "string" || focused.remedy.length < 20 || focused.remedy.length > 4000 ||
      !Array.isArray(focused.implicated_paths) || !focused.implicated_paths.every(revisionPath) ||
      !focused.implicated_paths.every(name => changedCode.includes(name)) || (!focused.implicated_paths.length && !changedInputs) ||
      !Array.isArray(focused.source_files) || !focused.source_files.length || focused.source_files.length > 128 ||
      new Set(focused.source_files.map(f => f.path)).size !== focused.source_files.length ||
      focused.source_files.some(f => !revisionPath(f.path) || !sha(f.sha256) || !Number.isSafeInteger(f.byte_size) || f.byte_size < 0 ||
        !revisionEqual({ byte_size: git(["show", `${p.head}:${f.path}`]).length, sha256: digest(git(["show", `${p.head}:${f.path}`])) }, { byte_size: f.byte_size, sha256: f.sha256 })) ||
      focused.implicated_paths.some(name => !focused.source_files.some(f => f.path === name)) ||
      !Array.isArray(focused.commands) || !focused.commands.length || focused.commands.length > 32 || focused.commands.some(c =>
        typeof c.command !== "string" || !c.command.length || c.command.length > 2000 || c.result?.exit_code !== 0 || c.result.timed_out !== false ||
        c.result.cancelled !== false || c.result.cleanup_completed !== true || c.result.remaining_owned_processes !== 0 ||
        c.result.exit_observed !== true || c.result.streams_closed !== true || c.result.termination_reason !== "natural_exit")) throw fail("revision_focused_remedy_invalid");
  for (const command of focused.commands) {
    const record = parse(command.record);
    if (!revisionEqual(record.result ?? record, command.result) || !revisionRef(command.stdout)) throw fail("revision_focused_original_invalid");
    revisionArtifact(path.dirname(file), command.stdout, 2 * 1024 * 1024);
  }
  if (previousRevision && ((inputInvalidation ? focused.failed_phase !== null : !original.phases?.some(phase => phase.id === focused.failed_phase && phase.status === "failure")) ||
      typeof focused.diagnosis !== "string" || focused.diagnosis.length < 20 || focused.diagnosis.length > 4000)) throw fail("revision_failure_remedy_required");
  return { original, prior, completion, inputs, source, focused, dependencySafety };
}
