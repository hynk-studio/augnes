import { SERIAL_AGGREGATE_ROUTE, isSerialAggregateRevision, serialReviewTarget, serialAuthorityScope, readSerialAggregateIncident, verifySerialAggregateRemedy, validSerialInheritance, serialInheritanceFrom, inheritedSerialAuthorityScope, verifyInheritedSerialConnection } from "./local-canonical-serial-aggregate.mjs";
import { PROJECT_EXPERIENCE_COMMITMENT } from "./project-experience-serial-budget.mjs";
import { mkdirSync, lstatSync, readFileSync, readdirSync, realpathSync, writeFileSync } from "node:fs";
import { AsyncLocalStorage } from "node:async_hooks";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { digest, validNodeHeaders, classifyInputChange, nonFaultInputChange, inputEventIdentity, comparePreparedDependencyInputs, preparedDependencyIdentity, observePreparedDependencyInputs, PREPARED_DEPENDENCY_CONTRACT } from "./local-canonical-inputs.mjs";
import { assertCheckoutVerificationOwnership } from "./local-canonical-checkout-ownership.mjs";
import { CANONICAL_NODE_VERSION } from "./local-canonical-environment.mjs";


import { BROWSER_RUNTIME_INPUTS, validCanonicalRuntimeInputs } from "./local-canonical-inputs.mjs";
import { isBrowserRevision, isBrowserSuccessor, browserPredecessorEvidence, browserReviewTarget, verifyBrowserRemedy, verifyBrowserRevisionPreservation, verifyReviewedBrowserFailure } from "./local-canonical-browser-revision.mjs";
import { GIT_ACQUISITION_REPAIR, isGitAcquisitionRevision, gitAcquisitionIncident, isGitObservationRevision, isGitObservationSuccessor, isInventoryBoundRevision, usesGitInventory, gitObservationIncident, gitReviewTarget, permitsFinalDependencySuccessor, delegatesGitRevisionGrant, delegatesProspectiveCommission, verifyGitRevisionFailure, verifyGitRevisionSuccess, readPostPassDecision, permitsPostPassReview, verifyGitSourceRepair } from "./local-canonical-git-observation.mjs";
import { createGitHubObserverAuthorizationTransport } from "./github-main-branch-transport.mjs";
import {MATERIAL_SOURCE_CORRECTION, MATERIAL_HISTORY_BOUNDARY, isMaterialSourceRevision, delegatesMaterialSourceCommission} from "./local-canonical-git-observation.mjs";
import { REPOSITORY_TYPECHECK, observeTypecheckCompiler, observeGeneratedTypeInputs } from "./local-canonical-typecheck-witness.mjs";
import { REGISTERED_FIXTURE_BUDGET, FIXTURE_BUDGET_CLAIM, inspectCurrentFixtureBudgetInputs } from "./local-canonical-fixture-budget-witness.mjs";
import { REPOSITORY_PURE_CONTRACT, inspectCurrentPureContractInputs } from "./local-canonical-pure-contract-witness.mjs";
import {GIT_INPUT_REVISION, GIT_INPUT_HISTORY_BOUNDARY, isGitInputRevision, verifyGitInputRemedy, verifyGitInputPublication} from "./local-canonical-git-observation.mjs";

export const ATTEMPT_CONTRACT = "augnes.local-canonical-attempt-family.v1";
const fail = code => Object.assign(new Error(code), { code });
const sha = value => /^[0-9a-f]{64}$/u.test(value ?? "");
const capabilities = new WeakMap();
export const REVIEWED_REVISION_SCHEMA = "augnes.local-canonical-source-correction.v7";
export const REVIEWED_REVISION_PHASES = Object.freeze(["dependencies-root", "dependencies-nested", "dependencies-web-planning", "typecheck", "build", "unit", "authority", "integration", "operability", "e2e-project-experience", "e2e-operator-review-control", "e2e-operator-native-host-execution", "e2e-operator-work-expectation", "e2e-operator-multi-candidate", "e2e-continuity", "e2e-golden"]);
export const isReviewedRevision = proof => (proof?.schema === REVIEWED_REVISION_SCHEMA && proof.kind === "reviewed_revision") || isBrowserRevision(proof) || isGitObservationRevision(proof);
const revisionCapabilities = new WeakMap();
const usesRevisionInventory = p => usesGitInventory(p) || isSerialAggregateRevision(p);

// One call owns its validation and continuation. Nothing validated is exported
// as a reusable token or cached across calls. The transitive material/lineage
// reads are sealed before awaiting the real current observer and reread at use.
const revisionReadScope = new AsyncLocalStorage();
const fileIdentity = s => [s.dev, s.ino, s.mode, s.uid, s.gid, s.nlink, s.size, s.mtimeNs, s.ctimeNs].map(String);
function pathPresent(file) {
  try { lstatSync(file); return true; } catch (e) { if (e.code === "ENOENT") return false; throw e; }
}
function rememberRevisionFile(file, bytes) {
  const scope = revisionReadScope.getStore();
  if (!scope) return;
  const s = lstatSync(file, { bigint: true });
  if (!s.isFile() || s.isSymbolicLink() || s.nlink !== 1n || (s.mode & 0o022n) || realpathSync(file) !== file)
    throw fail("revision_validated_material_unsafe");
  const identity = { path: file, stat: fileIdentity(s), sha256: digest(bytes) };
  if (scope.files.has(file) && digest(scope.files.get(file)) !== digest(identity)) throw fail("revision_material_changed_during_validation");
  scope.files.set(file, identity);
}
function revisionDirectoryEntries(root) {
  const s = lstatSync(root, { bigint: true });
  if (!s.isDirectory() || s.isSymbolicLink() || realpathSync(root) !== root || (s.mode & 0o022n)) throw fail("attempt_unsafe_directory");
  const entries = readdirSync(root).sort(), scope = revisionReadScope.getStore();
  if (scope) {
    const identity = { path: realpathSync(root), stat: [s.dev, s.ino, s.mode, s.uid, s.gid].map(String), entries };
    if (scope.directories.has(root) && digest(scope.directories.get(root)) !== digest(identity)) throw fail("revision_material_changed_during_validation");
    scope.directories.set(root, identity);
  }
  return entries;
}
function afterRevisionValidation(observe, validate, finish) {
  const scope = { files: new Map(), directories: new Map(), absent: new Set(), evidence: new Map() };
  const prepared = revisionReadScope.run(scope, validate);
  if (prepared === false) return false;
  let consumed = false;
  const assertUnchanged = () => {
    for (const [file, expected] of scope.files) {
      const s = lstatSync(file, { bigint: true });
      if (!s.isFile() || s.isSymbolicLink() || s.nlink !== 1n || realpathSync(file) !== expected.path ||
          digest(fileIdentity(s)) !== digest(expected.stat) || digest(readFileSync(file)) !== expected.sha256)
        throw fail("revision_validated_material_changed");
    }
    for (const [root, expected] of scope.directories) {
      const s = lstatSync(root, { bigint: true });
      if (!s.isDirectory() || s.isSymbolicLink() || realpathSync(root) !== expected.path ||
          digest([s.dev,s.ino,s.mode,s.uid,s.gid].map(String)) !== digest(expected.stat) ||
          digest(readdirSync(root).sort()) !== digest(expected.entries)) throw fail("revision_validated_lineage_changed");
    }
    if ([...scope.absent].some(pathPresent)) throw fail("revision_validated_lineage_changed");
  };
  const complete = current => {
    if (consumed) throw fail("revision_validation_already_used");
    consumed = true;
    return finish(prepared, current, assertUnchanged);
  };
  return typeof observe === "function" ? Promise.resolve().then(observe).then(complete) : complete(null);
}

// Closed qualification routes are historical evidence, never fresh authority.
// The pinned pre-retirement revision owns historical interpretation; this guard
// also catches a downgraded schema that still carries a retired kind or marker.
const RETIRED_QUALIFICATION_SCHEMAS = new Set([
  "augnes.local-canonical-source-correction.v3",
  "augnes.local-canonical-source-correction.v4",
  "augnes.local-canonical-source-correction.v5",
  "augnes.local-canonical-source-correction.v6",
  "augnes.local-canonical-closeout.v1",
  "augnes.local-canonical-closeout-continuation.v1",
  "augnes.local-canonical-operating-profile-succession.v1",
  "augnes.local-canonical-successor-budget-succession.v1",
]);
export function hasRetiredQualificationMarker(value) {
  return value?.receipt_version === 5 ||
    (Array.isArray(value?.phases) && value.phases.some(phase =>
      Array.isArray(phase?.browser_use) && phase.browser_use.some(use =>
        use?.contract === "augnes.local-canonical-browser-use.v3" || Object.hasOwn(use ?? {}, "browser_input_fingerprint")))) ||
    (Array.isArray(value?.inputs?.resources) && value.inputs.resources.some(resource =>
      resource !== null && typeof resource === "object" && (Object.hasOwn(resource, "browserBundle") || ["browser-bundle", "browser-binding", "browser-reference"].includes(resource.id)))) ||
    [value, value?.source_correction, value?.recovery, value?.attempt,
      value?.attempt?.source_correction, value?.attempt?.recovery, value?.inputs?.binding].some(record =>
    record !== null && typeof record === "object" && (
      RETIRED_QUALIFICATION_SCHEMAS.has(record.schema) ||
      Object.hasOwn(record.commission ?? {}, "reviewed_workload") ||
      ["augnes.local-canonical-browser-replacement.v1", "augnes.local-canonical-browser-authorization.v1"].includes(record.contract) ||
      record.kind === "browser_input_replacement" ||
      ["observer_repair", "corrected_timeout", "condition_requalification", "guide_cancellation_correction"].includes(record.kind) ||
      record.kind === "companion_readiness_timeout" ||
      record.kind === "operating_profile_efficiency" ||
      record.kind === "settled_successor_budget" ||
      (typeof record.kind === "string" && record.kind.startsWith("issue_1559_")) ||
      Object.keys(record).some(key => /^(?:closeout_|companion_timeout_)/u.test(key) ||
        ["profile_authority", "operating_profile_consumed", "budget_authority", "successor_budget_consumed",
          "observer_authority", "observer_repair_consumed", "timeout_authority", "corrected_timeout_consumed",
          "condition_authority", "condition_requalification_consumed", "guide_authority", "guide_correction_consumed",
          "browser_replacement", "browser_authority", "input_replacement_consumed", "browser_input_path", "browser_input_sha256",
          "browser_input", "browser_guard"].includes(key))
    ));
}

// Schema v7 is shared with the live reviewed_revision route. Retirement is
// identified above by the old route, not by its schema version. Dispatch is
// separate from evidence/authority validation: unknown corrections cannot fall
// through to ordinary or legacy receipt handling.
export function supportsSourceCorrection(proof) {
  return proof !== null && typeof proof === "object" && !Array.isArray(proof) && !hasRetiredQualificationMarker(proof) && (
    proof.schema === "augnes.local-canonical-source-correction.v1" ||
    (proof.schema === "augnes.local-canonical-source-correction.v2" && ["source_revision", "verifier_correction", "accepted_main_integration"].includes(proof.kind)) ||
    isReviewedRevision(proof));
}


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
  const bytes = readFileSync(file);
  rememberRevisionFile(file, bytes);
  return JSON.parse(bytes.toString("utf8"));
}
function append(root, name, value) { writeFileSync(path.join(root, name), `${JSON.stringify(value)}\n`, { flag: "wx", mode: 0o600 }); }

// Family lives at the physical anchor, keyed by repository and branch (not
// commit, wrapper process or checkout). There is no CLI family-id reset knob.
export function beginAttempt(options) {
  return afterRevisionValidation(options.observeRevision, () => prepareAttempt(options), (finish, current, check) => finish(current, check));
}

function prepareAttempt({ anchorRoot, repositoryRoot, checkoutOwner, branch, head, tree, runId, contractFingerprint, recoveryProof = null, sourceCorrection = null, acceptedMain = null, revisionAuthorization = null, revisionInputs = null, revisionLive = null, observeRevision = null, assertCurrent = null, ...retiredOptions }) {
  if (["browserReplacement", "browserAuthorization", "browserLive", "observerAuthorization", "timeoutAuthorization", "conditionAuthorization", "guideAuthorization"].some(key => Object.hasOwn(retiredOptions, key))) throw fail("qualification_route_retired");
  assertCheckoutVerificationOwnership(checkoutOwner, repositoryRoot);
  if (hasRetiredQualificationMarker(sourceCorrection) || hasRetiredQualificationMarker(recoveryProof)) throw fail("qualification_route_retired");
  if (!branch || !/^[0-9a-f]{40}$/u.test(head) || !/^[0-9a-f]{40}$/u.test(tree) || !sha(contractFingerprint)) throw fail("attempt_identity_invalid");
  if ([recoveryProof, sourceCorrection].filter(Boolean).length > 1) throw fail("attempt_mixed_successor_kind");
  const familyId = candidateFamilyId(branch, sourceCorrection);
  const artifact = directory(anchorRoot, ".augnes-local-verification");
  if (sourceCorrection && read(path.join(anchorRoot, ".augnes-local-verification", "families", sourceCorrection.prior_family_id, `attempt-${sourceCorrection.prior_number}.json`)).branch !== branch) throw fail("source_correction_predecessor_invalid");
  if (sourceCorrection) {
    const tip = reconstructAttemptTip({ anchorRoot, repositoryRoot, branch });
    const proof = sourceCorrection;
    const revision = isReviewedRevision(sourceCorrection);
    if (tip.family_id !== proof.prior_family_id || tip.number !== proof.prior_number || tip.attempt_id !== proof.prior_attempt_id ||
          (revision ? !revisionFollows(proof, tip.reviewed_revision_consumed ?? 0, tip.revision_commission, tip.revision_grants ?? [],
            read(path.join(anchorRoot,".augnes-local-verification/families",tip.family_id,`attempt-${tip.number}.json`)).source_correction?.commission?.maximum_invocations) :
          tip.reviewed_revision_consumed)) throw fail("attempt_latest_tip_required");
  }
  if (observeRevision && (!isReviewedRevision(sourceCorrection) || typeof observeRevision !== "function" || typeof assertCurrent !== "function")) throw fail("revision_observer_invalid");
  const binding = digest({ sourceCorrection, branch, head, tree, acceptedMain, revisionInputs });
  const correction = sourceCorrection ? prepareSourceCorrection({ anchorRoot, repositoryRoot, branch, head, tree, proof: sourceCorrection, acceptedMain, reserve: true }) : null;
  if (isReviewedRevision(sourceCorrection)) {
    const candidate = path.join(artifact,"families",familyId);
    if (pathPresent(candidate)) {
      if (revisionDirectoryEntries(candidate).length) throw fail("attempt_candidate_superseded");
    } else revisionReadScope.getStore()?.absent.add(candidate);
  }
  return (current, assertUnchanged) => {
  if (digest({ sourceCorrection, branch, head, tree, acceptedMain, revisionInputs }) !== binding) throw fail("source_correction_identity_invalid");
  assertCheckoutVerificationOwnership(checkoutOwner, repositoryRoot);
  if (observeRevision) {
    if (!current || !Object.hasOwn(current,"authorization") || !Object.hasOwn(current,"live")) throw fail("revision_observer_invalid");
    revisionAuthorization = current.authorization;
    revisionLive = current.live;
  }
  const boundary = () => {
    assertCheckoutVerificationOwnership(checkoutOwner, repositoryRoot);
    if (assertCurrent?.()?.then) throw fail("revision_boundary_must_be_synchronous");
    assertCheckoutVerificationOwnership(checkoutOwner, repositoryRoot);
    assertUnchanged();
  };
  if (correction) correction({ revisionAuthorization, revisionInputs, revisionLive, assertCurrent: boundary });
  else boundary();
  const root = directory(directory(artifact, "families"), familyId);
  const entries = readdirSync(root);
  if (entries.some(name => !/^(attempt|completion)-[12]\.json$/u.test(name) && name !== "correction-successor.json")) throw fail("attempt_unknown_record");
  const previous = entries.includes("attempt-1.json") ? read(path.join(root, "attempt-1.json")) : null;
  let number = 1, prior = null;
  if (previous) {
    const tip = reconstructAttemptTip({ anchorRoot, repositoryRoot, branch });
    if (tip.family_id !== familyId || tip.reviewed_revision_consumed) throw fail("attempt_candidate_superseded");
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
    ...(isReviewedRevision(sourceCorrection) ? { revision_authority: revisionAuthorization.observations } : {}),
    budget: { initial: 1, recovery: isReviewedRevision(sourceCorrection) ? 0 : 1 } };
  append(root, `attempt-${number}.json`, record);
  const capability = Object.freeze({ ...record });
  capabilities.set(capability, { root, repositoryRoot, checkoutOwner, record });
  return capability;
  };
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
  if (hasRetiredQualificationMarker(proof)) throw fail("qualification_route_retired");
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

export function inspectAttemptRecords(options) {
  try {
    const result = afterRevisionValidation(options.observeRevision, () => prepareAttemptInspection(options),
      (finish, current, check) => typeof finish === "function" ? finish(current, check) : finish);
    return result?.then ? result.catch(() => false) : result;
  } catch { return false; }
}

function prepareAttemptInspection({ anchorRoot, repositoryRoot = anchorRoot, receipt, revisionAuthorization = null, revisionInputs = null, revisionLive = null, observeRevision = null, assertCurrent = null }) {
    const binding = digest(receipt);
    const attempt = receipt.attempt;
    if (hasRetiredQualificationMarker(receipt)) return false;
    const familyId = candidateFamilyId(receipt.repository.branch, attempt.source_correction);
    if (attempt.family_id !== familyId || ![1, 2].includes(attempt.number)) return false;
    let correction = null;
    if (attempt.source_correction) {
      const lineage = { anchorRoot, repositoryRoot, branch: receipt.repository.branch };
      // Check the immutable history up to this receipt before reading source artifacts.
      // A later successor does not invalidate an ordinary historical receipt.
      const prefix = readAttemptLineage(lineage, attempt);
      if (prefix.family_id !== familyId || prefix.attempt_id !== attempt.attempt_id || prefix.number !== attempt.number) return false;
      correction = prepareSourceCorrection({ anchorRoot, repositoryRoot, branch: receipt.repository.branch,
        head: attempt.head, tree: attempt.tree, proof: attempt.source_correction, acceptedMain: receipt.repository.base_sha, reserve: false });
      if (isReviewedRevision(attempt.source_correction)) {
        if (receipt.receipt_version !== 4 || !validReviewedRevisionAttempt(attempt)) return false;
        const tip = reconstructAttemptTip(lineage);
        if (tip.family_id !== familyId || tip.attempt_id !== attempt.attempt_id || tip.reviewed_revision_consumed !== attempt.source_correction.commission.ordinal) return false;
      }
    }
    const root = path.join(anchorRoot, ".augnes-local-verification", "families", familyId);
    if (realpathSync(root) !== root || !lstatSync(root).isDirectory()) return false;
    const original = read(path.join(root, `attempt-${attempt.number}.json`));
    const completion = read(path.join(root, `completion-${attempt.number}.json`));
    if (original.contract !== ATTEMPT_CONTRACT || completion.contract !== ATTEMPT_CONTRACT || !Number.isFinite(Date.parse(completion.finished_at)) ||
        digest(original) !== digest(attempt) || completion.attempt_id !== receipt.run.id ||
        completion.receipt_fingerprint !== receipt.integrity.content_fingerprint ||
        completion.disposition !== receipt.outcome.disposition || completion.cleanup_complete !== receipt.cleanup.completed) return false;
    if (attempt.number === 2) {
      if (hasRetiredQualificationMarker(read(path.join(root, "attempt-1.json")))) return false;
      const prior = read(path.join(root, "completion-1.json"));
      if (prior.disposition !== "infrastructure_interruption" || !validRecoveryProof(attempt.recovery, prior)) return false;
    }
    return (current, assertUnchanged) => {
      if (digest(receipt) !== binding) return false;
      if (observeRevision) {
        if (!current || !Object.hasOwn(current,"authorization") || !Object.hasOwn(current,"live")) return false;
        revisionAuthorization = current.authorization;
        revisionLive = current.live;
      }
      if (isReviewedRevision(attempt.source_correction) && digest(attempt.revision_authority) !== digest(revisionAuthorization?.observations)) return false;
      const boundary = () => {
        if (assertCurrent?.()?.then) throw fail("revision_boundary_must_be_synchronous");
        if (digest(receipt) !== binding) throw fail("revision_stock_receipt_changed");
        assertUnchanged();
      };
      if (correction) correction({revisionAuthorization,revisionInputs,revisionLive,assertCurrent:boundary});
      else boundary();
      return true;
    };
}

function candidateFamilyId(branch, correction) {
  return digest([ATTEMPT_CONTRACT, "hynk-studio/augnes", branch,
    ...(correction ? ["verified_source_correction", correction.prior_attempt_id, correction.head, correction.tree] : [])]);
}

export function reconstructAttemptTip(context) {
  return readAttemptLineage(context);
}

function readAttemptLineage({ anchorRoot, repositoryRoot = null, branch }, throughAttempt = null) {
  let familyId = candidateFamilyId(branch), revisionCount = 0, revisionCommission = null, revisionMaximum = 0;
  const seen = new Set(), revisionGrants = [];
  // Bound reads by the physical inventory, with cycle detection. This is not a
  // hidden total allowance across separately authorized exact-target grants.
  const familyCount = readdirSync(path.join(anchorRoot,".augnes-local-verification/families")).filter(name=>/^[a-f0-9]{64}$/u.test(name)).length;
  for (let depth = 0; depth < familyCount; depth++) {
    if (seen.has(familyId)) throw fail("attempt_lineage_cycle");
    seen.add(familyId);
    const root = path.join(anchorRoot, ".augnes-local-verification", "families", familyId);
    if (realpathSync(root) !== root) throw fail("attempt_unsafe_directory");
    const entries = revisionDirectoryEntries(root);
    if (entries.some(name => !/^(attempt|completion)-[12]\.json$/u.test(name) && name !== "correction-successor.json")) throw fail("attempt_unknown_record");
    const reachedReceipt = throughAttempt?.family_id === familyId;
    const number = reachedReceipt ? throughAttempt.number : entries.includes("attempt-2.json") ? 2 : 1;
    if (number === 2 && hasRetiredQualificationMarker(read(path.join(root, "attempt-1.json")))) throw fail("qualification_route_retired");
    const attempt = read(path.join(root, `attempt-${number}.json`));
    if (hasRetiredQualificationMarker(attempt)) throw fail("qualification_route_retired");
    if (attempt.contract !== ATTEMPT_CONTRACT || attempt.branch !== branch || attempt.family_id !== familyId || attempt.number !== number ||
        (attempt.source_correction && !supportsSourceCorrection(attempt.source_correction))) throw fail("attempt_lineage_identity_invalid");
    const revision = isReviewedRevision(attempt.source_correction);
    if (revisionCount && !revision) throw fail("attempt_revision_commission_terminal");
    if (revision) {
      if (!validReviewedRevisionAttempt(attempt) || !revisionFollows(attempt.source_correction, revisionCount, revisionCommission, revisionGrants, revisionMaximum)) throw fail("attempt_revision_commission_invalid");
      if (attempt.source_correction.commission.ordinal === 1 || usesFreshRevisionGrant(attempt.source_correction))
        revisionGrants.push(attempt.source_correction.authorization.grant_comment_id);
      revisionCount = attempt.source_correction.commission.ordinal; revisionCommission = revisionCommissionIdentity(attempt.source_correction);
      revisionMaximum = attempt.source_correction.commission.maximum_invocations;
    }
    const edgeFile = path.join(root, "correction-successor.json");
    if (reachedReceipt || !entries.includes("correction-successor.json")) return { family_id: familyId, number, attempt_id: attempt.attempt_id, ...(revisionCount ? { reviewed_revision_consumed: revisionCount, revision_commission: revisionCommission, revision_grants: [...revisionGrants] } : {}) };
    const edge = read(edgeFile), revisionEdge = edge.kind === "reviewed_revision";
    if (hasRetiredQualificationMarker(edge)) throw fail("qualification_route_retired");
    if (revisionCount && !revisionEdge) throw fail("attempt_revision_commission_terminal");
    const completion = read(path.join(root, `completion-${number}.json`));
    const edgeKeys = edge.contract === undefined ? ["family_id", "head", "tree", "proof_fingerprint"] : ["contract", "kind", "family_id", "head", "tree", "proof_fingerprint"];
    if (completion.contract !== ATTEMPT_CONTRACT || completion.attempt_id !== attempt.attempt_id || !sha(completion.receipt_fingerprint) || !sha(edge.family_id) || !sha(edge.proof_fingerprint) ||
        digest(Object.keys(edge).sort()) !== digest(edgeKeys.sort()) ||
        (edge.contract !== undefined && (edge.contract !== "augnes.local-canonical-successor.v2" || edge.kind !== "reviewed_revision"))) throw fail("attempt_lineage_edge_invalid");
    const next = read(path.join(anchorRoot, ".augnes-local-verification", "families", edge.family_id, "attempt-1.json"));
    if (hasRetiredQualificationMarker(next)) throw fail("qualification_route_retired");
    const proof = next.source_correction;
    // The ordinary safety edge is never inferred from a disposition alone.
    // Replay its original evidence during reconstruction, also for earlier edges.
    const browserEdge = isBrowserRevision(proof);
    const gitEdge = isGitObservationRevision(proof);
    if (isBrowserRevision(attempt.source_correction) && !isBrowserSuccessor(proof) ||
        !validGitRevisionEdge(attempt.source_correction, proof)) throw fail("attempt_lineage_edge_invalid");
    if (browserEdge || gitEdge || isInventoryBoundRevision(proof) || isSerialAggregateRevision(proof)) {
      if (!repositoryRoot || !validReviewedRevisionAttempt(next) || !revisionEdge ||
          (!isInventoryBoundRevision(proof) && revisionCount !== proof.commission.ordinal - 1))
        throw fail("attempt_lineage_edge_invalid");
      if (isBrowserSuccessor(proof) || usesRevisionInventory(proof)) verifyStoredRevisionProof(repositoryRoot, proof);
      readReviewedRevisionEvidence(path.join(repositoryRoot, proof.local_relative_path), proof, repositoryRoot);
      verifyRevisionOriginals(anchorRoot, repositoryRoot, proof);
    }
    if (completion.cleanup_complete !== true) {
      if (!repositoryRoot || completion.cleanup_complete !== false || !revisionEdge || revisionCount !== 2 ||
          !validReviewedRevisionAttempt(next) || proof?.commission.ordinal !== 1 || !proof.settlement ||
          !readReviewedRevisionEvidence(path.join(repositoryRoot, proof.local_relative_path), proof, repositoryRoot).externalSettlement)
        throw fail("attempt_lineage_edge_invalid");
    }
    if (!proof || proof.prior_family_id !== familyId || proof.prior_number !== number || proof.prior_attempt_id !== attempt.attempt_id || proof.prior_receipt_fingerprint !== completion.receipt_fingerprint ||
        digest(proof) !== edge.proof_fingerprint || next.head !== edge.head || next.tree !== edge.tree ||
        candidateFamilyId(branch, next.source_correction) !== edge.family_id ||
        revisionEdge !== isReviewedRevision(next.source_correction) ||
        (revisionEdge && (!validReviewedRevisionAttempt(next) || !revisionFollows(proof, revisionCount, revisionCommission, revisionGrants, revisionMaximum) ||
          (!["product_failure", "input_invalidation"].includes(completion.disposition) &&
            !(completion.disposition === "unclassified_timeout" && isSerialAggregateRevision(proof)) &&
            !(completion.disposition === "unknown_relevance" && (gitEdge || isGitAcquisitionRevision(proof) && proof.commission.ordinal === 1)) &&
            !(completion.disposition === "completed_success" && isInventoryBoundRevision(proof) && revisionCount === 1 && proof.commission.ordinal === 2 && proof.commission.forward_decision) &&
            !(completion.disposition === "safety_violation" && (browserEdge && !isBrowserSuccessor(proof) || isInventoryBoundRevision(proof) && revisionCount === 1 && proof.commission.forward_decision || revisionCount === 2 && proof.commission.ordinal === 1))) ||
          (proof.commission.ordinal === 1 && (proof.authorization.grant_comment_id === attempt.source_correction?.authorization?.grant_comment_id ||
            Date.parse(next.revision_authority.execution_commission.timestamp) <= Date.parse(completion.finished_at)))))) throw fail("attempt_lineage_edge_invalid");
    familyId = edge.family_id;
  }
  throw fail("attempt_lineage_bound");
}

// The Web handler concatenates these four raw scripts for GET /client.js.
const WEB_PLANNING_CLIENT_MODULES = new Set([
  "apps/web_planning/src/client.js.txt",
  "apps/web_planning/src/exchange-client.js.txt",
  "apps/web_planning/src/history-client.js.txt",
  "apps/web_planning/src/search-client.js.txt",
]);

export function isWebPlanningClientRevision(proof) {
  return proof?.schema === "augnes.local-canonical-source-correction.v2" &&
    proof.kind === "source_revision" && WEB_PLANNING_CLIENT_MODULES.has(proof.source_module);
}

// A real source correction is a new candidate, never an infrastructure retry.
// It requires the same finite regression to fail on the old module and pass on
// the corrected module. Proof artifacts and Git objects remain independently
// inspectable. This is local evidence, not independent attestation.
export function readSourceCorrectionProof(file, repositoryRoot) {
  return readSourceCorrectionMaterial(file, repositoryRoot).proof;
}

function readSourceCorrectionMaterial(file, repositoryRoot) {
  const relative = path.relative(repositoryRoot, file).split(path.sep).join("/");
  if (!/^\.augnes-local-verification\/[a-zA-Z0-9_./-]+\.json$/u.test(relative) || relative.split("/").includes("..") || realpathSync(file) !== file)
    throw fail("source_correction_unsafe_path");
  const proof = read(file);
  if (hasRetiredQualificationMarker(proof)) throw fail("qualification_route_retired");
  if (isReviewedRevision(proof)) {
    const evidence = readReviewedRevisionEvidence(file, proof, repositoryRoot);
    return { proof: { ...proof, local_relative_path: relative }, evidence };
  }
  const version2 = proof.schema === "augnes.local-canonical-source-correction.v2";
  const review = version2 ? readCandidateReview(file, proof) : null;
  if (version2 && proof.kind === "accepted_main_integration") return { proof: { ...proof, local_relative_path: relative } };
  const sourceModule = proof.source_module ?? "";
  const nativePreparationRevision = version2 && proof.kind === "source_revision" &&
    sourceModule === "components/workbench/semantic-review/selected-work-source-editor.tsx";
  const modulePattern = version2 ? /^(?:next\.config\.ts|components\/blank-state\/blank-state-client\.tsx|(?:scripts|app|lib|plugins|apps|src)\/[a-zA-Z0-9_./-]+\.(?:mjs|cjs|js|ts|tsx))$/u : /^scripts\/[a-z0-9_/-]+\.mjs$/u;
  if ((!version2 && proof.schema !== "augnes.local-canonical-source-correction.v1") ||
      (!modulePattern.test(sourceModule) && !nativePreparationRevision && !isWebPlanningClientRevision(proof)) || sourceModule.split("/").includes("..") ||
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
  return { proof: { ...proof, local_relative_path: relative.split(path.sep).join("/") } };
}

function prepareSourceCorrection({ anchorRoot, repositoryRoot, branch, head, tree, proof, acceptedMain, reserve }) {
  const { proof: reread, evidence } = readSourceCorrectionMaterial(path.join(repositoryRoot, proof.local_relative_path ?? ""), repositoryRoot);
  if (digest(reread) !== digest(proof) || proof.branch !== branch || proof.head !== head || proof.tree !== tree ||
      !/^[0-9a-f]{40}$/u.test(head) || !/^[0-9a-f]{40}$/u.test(tree)) throw fail("source_correction_identity_invalid");
  if (isReviewedRevision(proof)) {
    const priorRoot = verifyRevisionOriginals(anchorRoot, repositoryRoot, proof);
    const successor = { contract: "augnes.local-canonical-successor.v2", kind: "reviewed_revision",
      family_id: candidateFamilyId(branch, proof), head, tree, proof_fingerprint: digest(proof) };
    return ({ revisionAuthorization, revisionInputs, revisionLive, assertCurrent = null }) => {
    if (digest(reread) !== digest(proof)) throw fail("source_correction_identity_invalid");
    verifyGitInputPublication(proof,evidence.original,args=>execFileSync("git",["--no-replace-objects",...args],{cwd:repositoryRoot,timeout:10000,stdio:["ignore","pipe","pipe"]}));
    const capability = revisionCapabilities.get(revisionAuthorization);
    if (!capability || capability.proof !== digest(proof) || capability.observations !== digest(revisionAuthorization.observations) ||
        !revisionEqual(revisionInputs, evidence.inputs) || acceptedMain !== proof.base ||
        (Date.parse(revisionAuthorization.observations.execution_commission.timestamp) <= Date.parse(evidence.completion.finished_at) ||
         !isReviewedRevision(evidence.prior.source_correction) && Date.parse(revisionAuthorization.observations.accepted_revision.timestamp) <= Date.parse(evidence.completion.finished_at)) && proof.commission.ordinal === 1 ||
        isBrowserRevision(proof) && Date.parse(revisionAuthorization.observations.contract_review.timestamp) <=
          Math.max(Date.parse(evidence.focused.finished_at), Date.parse(evidence.source.reviewed_at), Date.parse(evidence.completion.finished_at)) ||
        evidence.dependencySafety && !capability.prospectiveDependencySafety ||
        !!evidence.postPass !== !!capability.prospectivePostPass ||
        evidence.externalSettlement && (!capability.prospectiveSettlement ||
          Date.parse(revisionAuthorization.observations.settlement_review.timestamp) <= Date.parse(evidence.externalSettlement.restored.diagnostics.finished_at)))
      throw fail("revision_authenticated_authority_required");
    const liveBinding = digest(revisionLive);
    if (usesRevisionInventory(proof)) {
      const sourceDecision = isInventoryBoundRevision(proof) && proof.commission.ordinal === 2
        ? revisionAuthorization.observations.contract_review : revisionAuthorization.observations.accepted_revision;
      if (revisionLive?.inventory !== proof.inputs.inventory_sha256 ||
          (evidence.retainedObservation || evidence.postPass) && Date.parse(revisionAuthorization.observations.forward_decision.timestamp) <= Date.parse(evidence.completion.finished_at) ||
          isGitObservationSuccessor(proof) && Date.parse(revisionAuthorization.observations.task_delegation.timestamp) <= Date.parse(evidence.completion.finished_at) ||
          Date.parse(sourceDecision.timestamp) <= Math.max(Date.parse(evidence.source.reviewed_at), Date.parse(evidence.focused.finished_at)))
        throw fail("revision_git_target_unverified");
    }
    // The historical blocked receipt is never reclassified. Admission after it
    // requires fresh, physically safe preparation under the corrected owner.
    // This is a current-input gate, not a pre-install dependency freeze.
    if (reserve && evidence.retainedObservation) verifyRetainedWebInput(repositoryRoot,evidence.retainedObservation);
    if (reserve && evidence.dependencySafety) for (const expected of evidence.focused.prospective_dependencies) {
      const current = observePreparedDependencyInputs({ repositoryRoot, phaseId: expected.phase_id });
      if (comparePreparedDependencyInputs(expected, current) !== "unchanged") throw fail("revision_prospective_dependencies_changed");
    }
    // Mutable tree/ownership/input checks may block. Freshness is evaluated
    // after them, immediately before the exclusive append, never before them.
    if (assertCurrent?.()?.then) throw fail("revision_boundary_must_be_synchronous");
    if (capability.proof !== digest(proof) || capability.observations !== digest(revisionAuthorization.observations) ||
        !revisionEqual(revisionInputs,evidence.inputs) || digest(revisionLive) !== liveBinding) throw fail("revision_authenticated_authority_required");
    if (evidence.externalSettlement) assertReviewedRevisionLiveSettlement(evidence.externalSettlement, revisionLive);
    if (usesRevisionInventory(proof) || isBrowserRevision(proof))
      verifyBrowserRevisionPreservation(evidence.original.cleanup.companion_service.after, usesRevisionInventory(proof) ? revisionLive?.service : revisionLive, {requireSameBinding:isInventoryBoundRevision(proof) || isSerialAggregateRevision(proof)});
    if (reserve) append(priorRoot, "correction-successor.json", successor);
    if (!revisionEqual(read(path.join(priorRoot, "correction-successor.json")), successor)) throw fail("revision_successor_already_bound");
    return;
    };
  }
  return ({ assertCurrent = null }) => {
  const priorRoot = path.join(anchorRoot, ".augnes-local-verification", "families", proof.prior_family_id);
  if (realpathSync(priorRoot) !== priorRoot) throw fail("source_correction_unsafe_predecessor");
  const prior = read(path.join(priorRoot, `attempt-${proof.prior_number}.json`));
  if (hasRetiredQualificationMarker(prior)) throw fail("qualification_route_retired");
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
    if (hasRetiredQualificationMarker(original)) throw fail("qualification_route_retired");
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
  if (assertCurrent?.()?.then) throw fail("revision_boundary_must_be_synchronous");
  if (reserve) {
    append(priorRoot, "correction-successor.json", successor);
  }
  if (digest(read(reservation)) !== digest(successor)) throw fail("source_correction_successor_already_bound");
  };
}

const VERIFIER_MODULES = Object.freeze([
  "scripts/local-canonical-inputs.mjs", "scripts/local-canonical-browser-identity.mjs",
  "scripts/local-canonical-attempts.mjs", "scripts/local-canonical-receipt.mjs",
  "scripts/run-local-canonical-verification.mjs",
]);

// A retained source-review record is an auditable scope/input binding, not a
// signature, semantic proof, independent attestation or grant of authority.
// All actual permission still comes from the task. No hash-only reset exists.
function verifyRevisionOriginals(anchorRoot, repositoryRoot, proof, materialFile = null) {
  const priorRoot = path.join(anchorRoot, ".augnes-local-verification", "families", proof.prior_family_id);
  if (realpathSync(priorRoot) !== priorRoot || revisionDirectoryEntries(priorRoot).includes(`attempt-${proof.prior_number + 1}.json`)) throw fail("revision_latest_settled_required");
  for (const kind of ["attempt", "completion"]) {
    const actual = path.join(priorRoot, `${kind}-${proof.prior_number}.json`); read(actual);
    if (digest(readFileSync(actual)) !== proof.originals[kind].sha256) throw fail("revision_original_ledger_changed");
  }
  const receiptFile = path.join(repositoryRoot, ".augnes-local-verification", "receipts", `${proof.prior_attempt_id}.json`);
  read(receiptFile, 512 * 1024);
  if (digest(readFileSync(receiptFile)) !== proof.originals.receipt.sha256) throw fail("revision_original_receipt_changed");
  if (isSerialAggregateRevision(proof)) {
    const folder=path.dirname(materialFile ?? path.join(repositoryRoot,proof.local_relative_path));
    const incident=JSON.parse(revisionArtifact(folder,proof.incident));
    const relative=incident.log_identity?.relative_path;
    if (!/^\.augnes-local-verification\/logs\/[A-Za-z0-9_-]+\/e2e-project-experience\.log$/u.test(relative ?? "")) throw fail("serial_original_log_unsafe");
    const file=path.join(repositoryRoot,relative), stat=lstatSync(file);
    if (realpathSync(file)!==file || !stat.isFile() || stat.isSymbolicLink() || stat.nlink!==1 || (stat.mode & 0o022) || stat.size>4*1024*1024 ||
        stat.size!==incident.log_identity.bytes || digest(readFileSync(file))!==incident.log_identity.sha256)
      throw fail("serial_original_log_changed");
    rememberRevisionFile(file,readFileSync(file));
    if (incident.capture) {
      // The complete capture may predate preparation outside the checkout.
      // Bind that exact regular local original, not just a copied excerpt.
      const capture=incident.capture_identity, original=capture?.path;
      if (typeof original!=="string" || !path.isAbsolute(original) || !original.endsWith(".log")) throw fail("serial_original_capture_unsafe");
      const info=lstatSync(original);
      if (realpathSync(original)!==original || !info.isFile() || info.isSymbolicLink() || info.nlink!==1 || (info.mode & 0o022) || info.size>8*1024*1024 ||
          info.size!==capture.bytes || digest(readFileSync(original))!==capture.sha256 || capture.sha256!==incident.capture.sha256)
        throw fail("serial_original_capture_changed");
      rememberRevisionFile(original,readFileSync(original));
    }
  }
  if (proof.commission?.evidence_kind===REGISTERED_FIXTURE_BUDGET) {
    const folder=path.dirname(materialFile??path.join(repositoryRoot,proof.local_relative_path));
    const focused=JSON.parse(revisionArtifact(folder,proof.focused));
    const incident=focused.regression?.incident,relative=incident?.log_identity?.relative_path;
    if(relative!==`.augnes-local-verification/logs/${proof.prior_attempt_id}/authority.log`)throw fail("revision_fixture_budget_original_log_invalid");
    const file=path.join(repositoryRoot,relative),stat=lstatSync(file);
    if(realpathSync(file)!==file||!stat.isFile()||stat.isSymbolicLink()||stat.nlink!==1||(stat.mode&0o022)||stat.size>2*1024*1024||
      stat.size!==incident.log_identity.bytes||digest(readFileSync(file))!==incident.log.sha256||incident.log.sha256!==incident.log_identity.sha256)
      throw fail("revision_fixture_budget_original_log_changed");
    rememberRevisionFile(file,readFileSync(file));
  }
  return priorRoot;
}

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

function verifyStoredRevisionProof(root, proof) {
  const { local_relative_path: relative, ...recorded } = proof;
  if (!revisionPath(relative) || !relative.startsWith(".augnes-local-verification/") || !relative.endsWith(".json"))
    throw fail("revision_original_proof_changed");
  const file = path.join(root, relative);
  if (realpathSync(file) !== file || !revisionEqual(read(file), recorded)) throw fail("revision_original_proof_changed");
}

export function reviewedRevisionAuthorityObservation(record, role) {
  return { id: record.id, author: record.user?.login, author_id: record.user?.id,
    body_sha256: digest(record.body), timestamp: record.updated_at ?? record.submitted_at ?? record.created_at,
    role, commit_id: isCommentRole(role) ? null : record.commit_id };
}

const isCommentRole = role => ["execution_commission", "task_delegation", "forward_decision"].includes(role);
const usesFreshRevisionGrant = p => isBrowserSuccessor(p) || isGitObservationSuccessor(p);

// Once this boundary is crossed the optional v7 inventory cannot be dropped.
function validGitRevisionEdge(previous, next) {
  if (isMaterialSourceRevision(next)) return (usesGitInventory(previous) || isSerialAggregateRevision(previous)) &&
    previous.commission.ordinal === previous.commission.maximum_invocations &&
    next.commission.ordinal === 1 && next.commission.maximum_invocations === 1 &&
    previous.commission.input_acquisition === next.commission.input_acquisition &&
    revisionEqual(next.commission.inherited_serial ?? null, serialInheritanceFrom(previous,next));
  if (isSerialAggregateRevision(previous)) return false;
  if (isSerialAggregateRevision(next)) return previous?.schema === "augnes.local-canonical-source-correction.v2" &&
    previous.kind === "source_revision" && next.commission.ordinal === 1 && next.commission.maximum_invocations === 1;
  if (isGitObservationSuccessor(next) &&
      (previous?.commission?.input_revision ?? null) !== (next.commission.input_revision ?? null)) return false;
  if (isMaterialSourceRevision(previous)) return false;
  if (isGitAcquisitionRevision(next)) {
    if (next.commission.ordinal === 1) return previous?.schema === REVIEWED_REVISION_SCHEMA &&
      previous.kind === "reviewed_revision" && previous.commission?.ordinal === 2 && !usesGitInventory(previous) && !previous.settlement;
    return isGitAcquisitionRevision(previous) && previous.commission.ordinal === 1 && next.commission.ordinal === 2;
  }
  if (isGitAcquisitionRevision(previous)) return false;
  if (isInventoryBoundRevision(next)) {
    if (previous?.commission?.ordinal === 2 && usesGitInventory(previous)) return next.commission?.ordinal === 1;
    return isInventoryBoundRevision(previous) && previous.commission.ordinal === 1 && next.commission?.ordinal === 2;
  }
  if (isInventoryBoundRevision(previous)) return false;
  return isGitObservationRevision(previous) === isGitObservationSuccessor(next);
}

function revisionCommissionIdentity(proof) {
  // Accounting stays with the source decision and grant on the physical first attempt.
  return digest({ pull_request: proof.pull_request, branch: proof.branch,
    accepted: isGitObservationSuccessor(proof) ? proof.commission.initial_accepted : proof.accepted,
    authorization: isInventoryBoundRevision(proof)
      ? { grant_comment_id: proof.authorization.grant_comment_id, grant_sha256: proof.authorization.grant_sha256 }
      : usesFreshRevisionGrant(proof) ? proof.commission.initial_authorization : proof.authorization,
    root_family_id: proof.commission.root_family_id,
    root_number: proof.commission.root_number, root_attempt_id: proof.commission.root_attempt_id,
    root_receipt_fingerprint: proof.commission.root_receipt_fingerprint,
    maximum_invocations: proof.commission.maximum_invocations,
    ...(isSerialAggregateRevision(proof) ? { route:proof.commission.route, envelope_sha256:proof.commission.envelope_sha256, incident:proof.incident, inputs:proof.inputs, source:proof.source, focused:proof.focused } : {}),
    ...(isGitInputRevision(proof) ? {input_revision: proof.commission.input_revision} : {}),
    ...(isGitAcquisitionRevision(proof) ? {input_acquisition: proof.commission.input_acquisition} : {}),
    ...(isMaterialSourceRevision(proof) ? {source_revision: proof.commission.source_revision,
      ...(proof.commission.evidence_kind ? {evidence_kind:proof.commission.evidence_kind} : {}),
      ...(proof.commission.inherited_serial ? {inherited_serial:proof.commission.inherited_serial} : {})} : {}) });
}

// A different authenticated grant can follow a spent commission only at its
// settled latest edge. Grant IDs, including all earlier commissions, are read
// from the append-only chain; changing a head, root or body cannot reset one.
function revisionFollows(proof, count, commission, grants, previousMaximum) {
  if (!revisionShape(proof)) return false;
  if (isSerialAggregateRevision(proof)) return count === 0 && proof.commission.ordinal === 1 && !grants.includes(proof.authorization.grant_comment_id);
  if (isMaterialSourceRevision(proof)) return count > 0 && count === previousMaximum &&
    proof.commission.ordinal === 1 && revisionCommissionIdentity(proof) !== commission &&
    !grants.includes(proof.authorization.grant_comment_id);
  if (usesFreshRevisionGrant(proof)) return count === 1 && revisionCommissionIdentity(proof) === commission &&
    grants.includes(proof.commission.initial_authorization.grant_comment_id) && !grants.includes(proof.authorization.grant_comment_id);
  if (count && revisionCommissionIdentity(proof) === commission) return proof.commission.ordinal === count + 1;
  return (!count || count === 2) && proof.commission.ordinal === 1 && !grants.includes(proof.authorization.grant_comment_id);
}

function browserAuthorizationShape(a) {
  const ref = a?.contract_review;
  return revisionKeys(a, ["grant_comment_id", "grant_sha256", "contract_review"]) &&
    revisionId(a.grant_comment_id) && sha(a.grant_sha256) && revisionKeys(ref, ["pull_request", "id", "sha256", "head"]) &&
    revisionId(ref.pull_request) && revisionId(ref.id) && sha(ref.sha256) && revisionCommit(ref.head);
}

function revisionMaterialShape(p, preparing = false) {
  const c = p?.commission;
  const successor = isBrowserSuccessor(p), gitSuccessor = isGitObservationSuccessor(p);
  return isReviewedRevision(p) && !hasRetiredQualificationMarker(p) && typeof p.branch === "string" && p.branch.length > 0 && p.branch.length <= 200 &&
    [p.head, p.tree, p.base, p.accepted?.head, p.accepted?.tree, p.accepted?.base].every(revisionCommit) &&
    revisionId(p.pull_request) && sha(p.prior_family_id) && [1, 2].includes(p.prior_number) && typeof p.prior_attempt_id === "string" &&
    sha(p.prior_receipt_fingerprint) && revisionKeys(c, ["root_family_id", "root_number", "root_attempt_id", "root_receipt_fingerprint", "ordinal", "maximum_invocations", ...(isSerialAggregateRevision(p) ? ["route", "envelope_sha256"] : []),
      ...(successor || gitSuccessor ? ["initial_authorization"] : []), ...(gitSuccessor ? ["initial_accepted", "delegation"] : isInventoryBoundRevision(p) ? ["delegation", ...(c.forward_decision ? ["forward_decision"] : []), ...(c.input_acquisition !== undefined ? ["input_acquisition"] : []), ...(c.source_revision !== undefined ? ["source_revision"] : [])] : []),
      ...(Object.hasOwn(c, "input_revision") ? ["input_revision"] : []), ...(Object.hasOwn(c,"inherited_serial") ? ["inherited_serial"] : []), ...(Object.hasOwn(c,"evidence_kind") ? ["evidence_kind"] : [])]) &&
    (!Object.hasOwn(c,"evidence_kind") || isMaterialSourceRevision(p) && c.evidence_kind === REGISTERED_FIXTURE_BUDGET) &&
    (!Object.hasOwn(c,"inherited_serial") || isMaterialSourceRevision(p) && validSerialInheritance(c.inherited_serial)) &&
    (!Object.hasOwn(c, "input_revision") || isGitInputRevision(p) && c.input_revision === GIT_INPUT_REVISION) &&
    (!isSerialAggregateRevision(p) || c.route === SERIAL_AGGREGATE_ROUTE && c.envelope_sha256 === PROJECT_EXPERIENCE_COMMITMENT && revisionRef(p.incident) && !p.settlement && p.accepted.head === p.head && p.accepted.tree === p.tree && p.accepted.base === p.base && sha(p.inputs?.inventory_sha256)) &&
    (c.input_acquisition === undefined || isGitAcquisitionRevision(p) && c.input_acquisition === GIT_ACQUISITION_REPAIR && !c.forward_decision) &&
    (c.source_revision === undefined || isMaterialSourceRevision(p) && c.source_revision === MATERIAL_SOURCE_CORRECTION &&
      !c.forward_decision) &&
    (!isBrowserRevision(p) || c.ordinal === (successor ? 2 : 1) && p.settlement === undefined) &&
    (!isGitObservationRevision(p) || !p.settlement && p.accepted.head === p.head && p.accepted.tree === p.tree && p.accepted.base === p.base && sha(p.inputs?.inventory_sha256)) &&
    (!isInventoryBoundRevision(p) || !p.settlement && validReviewRef(c.delegation) && (!c.forward_decision || c.ordinal === 2 && validReviewRef(c.forward_decision) && c.forward_decision.id !== c.delegation.id) && sha(p.inputs.inventory_sha256) &&
      (c.ordinal !== 1 || p.accepted.head === p.head && p.accepted.tree === p.tree && p.accepted.base === p.base)) &&
    (!gitSuccessor || revisionKeys(c.initial_accepted, ["head", "tree", "base", "review"]) &&
      [c.initial_accepted.head, c.initial_accepted.tree, c.initial_accepted.base].every(revisionCommit) &&
      validReviewRef(c.initial_accepted.review) && validReviewRef(c.delegation) &&
      revisionKeys(c.initial_authorization, ["grant_comment_id", "grant_sha256"]) &&
      revisionId(c.initial_authorization.grant_comment_id) && sha(c.initial_authorization.grant_sha256) &&
      c.delegation.id !== c.initial_authorization.grant_comment_id && c.initial_accepted.head !== p.head) &&
    (!successor || browserAuthorizationShape(c.initial_authorization) && c.initial_authorization.contract_review.head !== p.head) &&
    sha(c.root_family_id) && [1, 2].includes(c.root_number) && typeof c.root_attempt_id === "string" && sha(c.root_receipt_fingerprint) &&
    (isMaterialSourceRevision(p) || isSerialAggregateRevision(p) ? c.ordinal === 1 && c.maximum_invocations === 1 : [1, 2].includes(c.ordinal) && c.maximum_invocations === 2) &&
    (c.ordinal === 1 ? c.root_family_id === p.prior_family_id && c.root_number === p.prior_number && c.root_attempt_id === p.prior_attempt_id && c.root_receipt_fingerprint === p.prior_receipt_fingerprint :
      c.root_family_id !== p.prior_family_id && c.root_attempt_id !== p.prior_attempt_id) && (preparing && (isSerialAggregateRevision(p) || isGitObservationRevision(p) || isInventoryBoundRevision(p) && c.ordinal === 1) ? !Object.hasOwn(p.accepted, "review") : revisionId(p.accepted.review?.id) && revisionRef(p.accepted.review)) &&
    ["receipt", "attempt", "completion", "stock"].every(k => revisionRef(p.originals?.[k])) &&
    revisionRef(p.source) && revisionRef(p.focused) && revisionRef(p.inputs?.current) && sha(p.inputs?.identity_sha256) && sha(p.inputs?.predecessor_sha256);
}

const validReviewRef = ref => revisionKeys(ref, ["id", "sha256"]) && revisionId(ref.id) && sha(ref.sha256);

function revisionShape(p) {
  const c = p?.commission;
  return revisionMaterialShape(p) &&
    revisionKeys(p.authorization, ["grant_comment_id", "grant_sha256", ...(isBrowserRevision(p) || isInventoryBoundRevision(p) && c.ordinal === 2 ? ["contract_review"] : p.authorization?.settlement_review ? ["settlement_review"] : [])]) &&
    (!isBrowserRevision(p) || (browserAuthorizationShape(p.authorization) &&
      p.authorization.contract_review.id !== p.accepted.review.id && p.authorization.contract_review.head === p.head)) &&
    (!isInventoryBoundRevision(p) || !p.authorization.settlement_review && p.authorization.grant_comment_id !== c.delegation.id &&
      (c.ordinal === 1 || browserAuthorizationShape(p.authorization) && p.authorization.contract_review.pull_request === p.pull_request &&
        p.authorization.contract_review.head === p.head && p.authorization.contract_review.id !== p.accepted.review.id)) &&
    (!isBrowserSuccessor(p) || (p.authorization.grant_comment_id !== c.initial_authorization.grant_comment_id &&
      p.authorization.contract_review.id !== c.initial_authorization.contract_review.id)) &&
    (!isGitObservationSuccessor(p) || p.accepted.review.id !== c.initial_accepted.review.id &&
      ![c.initial_authorization.grant_comment_id, c.delegation.id].includes(p.authorization.grant_comment_id)) &&
    (!p.authorization.settlement_review || revisionKeys(p.authorization.settlement_review, ["id", "sha256", "head"]) &&
      revisionId(p.authorization.settlement_review.id) && sha(p.authorization.settlement_review.sha256) && revisionCommit(p.authorization.settlement_review.head)) &&
    (!isGitObservationRevision(p) || !p.authorization.settlement_review) &&
    (p.settlement === undefined || revisionRef(p.settlement) && p.authorization.settlement_review && c.ordinal === 1) &&
    revisionId(p.authorization.grant_comment_id) && sha(p.authorization.grant_sha256);
}

export function validReviewedRevisionAttempt(attempt) {
  const p = attempt?.source_correction;
  const roles = ["accepted_revision", "execution_commission", ...(p?.authorization?.contract_review ? ["contract_review"] : p?.authorization?.settlement_review ? ["settlement_review"] : []),
    ...(isGitObservationSuccessor(p) || isInventoryBoundRevision(p) ? ["task_delegation"] : []), ...(p?.commission?.forward_decision ? ["forward_decision"] : [])];
  if (!revisionShape(p) || attempt.number !== 1 || attempt.recovery || hasRetiredQualificationMarker(attempt) ||
      !revisionEqual(attempt.budget, { initial: 1, recovery: 0 }) || p.branch !== attempt.branch || p.head !== attempt.head || p.tree !== attempt.tree ||
      !revisionKeys(attempt.revision_authority, roles)) return false;
  return roles.every(role => {
    const o = attempt.revision_authority[role], ref = role === "accepted_revision" ? p.accepted.review : role === "contract_review" ? p.authorization.contract_review : role === "settlement_review" ? p.authorization.settlement_review : role === "task_delegation" ? p.commission.delegation : role === "forward_decision" ? p.commission.forward_decision : { id: p.authorization.grant_comment_id, sha256: p.authorization.grant_sha256 };
    return revisionKeys(o, ["id", "author", "author_id", "body_sha256", "timestamp", "role", "commit_id"]) && o.role === role &&
      revisionId(o.author_id) && /^[A-Za-z0-9-]{1,39}$/u.test(o.author ?? "") && sha(o.body_sha256) && revisionTime(o.timestamp) &&
      o.id === ref.id && digest(o) === ref.sha256 && o.commit_id === (role === "accepted_revision" ? p.accepted.head : isCommentRole(role) ? null : ref.head);
  }) && (!isInventoryBoundRevision(p) || (
    (!p.commission.forward_decision || Date.parse(attempt.revision_authority.execution_commission.timestamp) < Date.parse(attempt.revision_authority.forward_decision.timestamp) &&
      Date.parse(attempt.revision_authority.forward_decision.timestamp) < Date.parse(attempt.revision_authority.contract_review.timestamp)) &&
    Date.parse(attempt.revision_authority.task_delegation.timestamp) < Date.parse(attempt.revision_authority.accepted_revision.timestamp) &&
    (p.commission.ordinal === 1 || Date.parse(attempt.revision_authority.contract_review.timestamp) > Date.parse(attempt.revision_authority.execution_commission.timestamp)))) &&
    Date.parse(attempt.revision_authority.execution_commission.timestamp) > Math.max(Date.parse(attempt.revision_authority.accepted_revision.timestamp),
    isBrowserRevision(p) ? Date.parse(attempt.revision_authority.contract_review.timestamp) : 0);
}

export function validateReviewedRevisionAuthorityRecords(p, review, grant, permissions, pr, settlementReview = null, contractReview = null, delegation = null, forward = null) {
  if (!revisionShape(p)) throw fail("revision_authority_missing");
  const observations = {};
  for (const [record, role, ref] of [[review, "accepted_revision", p.accepted.review], [grant, "execution_commission", { id: p.authorization.grant_comment_id, sha256: p.authorization.grant_sha256 }],
    ...(isGitObservationSuccessor(p) || isInventoryBoundRevision(p) ? [[delegation, "task_delegation", p.commission.delegation]] : []),
    ...(p.commission.forward_decision ? [[forward, "forward_decision", p.commission.forward_decision]] : []),
    ...(p.authorization.contract_review ? [[contractReview, "contract_review", p.authorization.contract_review]] : []),
    ...(p.authorization.settlement_review ? [[settlementReview, "settlement_review", p.authorization.settlement_review]] : [])]) {
    if (record?.id !== ref.id || record.user?.type !== "User" || !revisionId(record.user?.id) || !/^[A-Za-z0-9-]{1,39}$/u.test(record.user?.login ?? "") ||
        !["OWNER", "MEMBER", "COLLABORATOR"].includes(record.author_association) || typeof record.body !== "string" || Buffer.byteLength(record.body) > 64 * 1024)
      throw fail("revision_authority_identity_invalid");
    if (!isCommentRole(role) ? record.pull_request_url !== `https://api.github.com/repos/hynk-studio/augnes/pulls/${role === "contract_review" ? ref.pull_request : p.pull_request}` ||
      !["COMMENTED", "APPROVED"].includes(record.state) || record.commit_id !== (role === "accepted_revision" ? p.accepted.head : ref.head) :
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
    (isMaterialSourceRevision(p) ? /exactly one admitted deciding invocation total/iu.test(grantText) : /at most two admitted deciding invocations total/iu.test(grantText)) && /demonstrated material.*correction.*focused support/iu.test(grantText) &&
    /zero extra recovery/iu.test(grantText) && /Reservation\/interruption consumes/iu.test(grantText);
  const settlementScope = !!p.authorization.settlement_review &&
    [p.branch, String(p.authorization.settlement_review.id), p.authorization.settlement_review.head, p.commission.root_receipt_fingerprint].every(s => grant.body.includes(s)) &&
    /new prospective authority/iu.test(grantText) && /active v7 reviewed_revision/iu.test(grantText) &&
    /fully accounted-for external shared-state incident with later verified restoration/iu.test(grantText) &&
    /Preserve the original false\/blocked\/invalid/iu.test(grantText) && /fresh safe admission observations/iu.test(grantText) &&
    /at most two admitted deciding invocations for this entire new commission/iu.test(grantText) &&
    /material in-scope defect\/input problem is corrected and relevant focused/iu.test(grantText) &&
    /No unchanged-target retry or extra recovery/iu.test(grantText) && /Interrupted reservations consume/iu.test(grantText) &&
    /Old commissions remain spent/iu.test(grantText) &&
    settlementReview.body.includes(p.commission.root_receipt_fingerprint) && /ACCEPT.*coordination\/restoration/isu.test(settlementReview.body) &&
    /not blanket approval/iu.test(settlementReview.body) &&
    Date.parse(observations.execution_commission.timestamp) > Date.parse(observations.settlement_review.timestamp);
  const reviewedContract = p.authorization.contract_review;
  const recordUrls = grantText.match(/https:\/\/github\.com\/hynk-studio\/augnes\/pull\/\d+#(?:issuecomment|pullrequestreview)-\d+(?=$|[\s)>.,;])/gu) ?? [];
  const linkedGrant = !isBrowserSuccessor(p) || (
    recordUrls.includes(`https://github.com/hynk-studio/augnes/pull/${p.pull_request}#issuecomment-${p.commission.initial_authorization.grant_comment_id}`) &&
    recordUrls.includes(`https://github.com/hynk-studio/augnes/pull/${reviewedContract.pull_request}#pullrequestreview-${reviewedContract.id}`) &&
    [p.commission.root_receipt_fingerprint, p.prior_receipt_fingerprint].every(s => grant.body.includes(s)));
  const browserScope = isBrowserRevision(p) && legacyScope && linkedGrant &&
    [p.head, p.tree, p.base, browserReviewTarget(p), "ACCEPT / RETAIN"].every(s => contractReview.body.includes(s)) &&
    /ACCEPT \/ RETAIN browser execution-input/iu.test(contractReview.body) &&
    [p.schema, p.head, p.tree, p.base, browserReviewTarget(p),
      `https://github.com/hynk-studio/augnes/pull/${reviewedContract.pull_request}#pullrequestreview-${reviewedContract.id}`].every(s => grant.body.includes(s)) &&
    /zero unchanged-target retry/iu.test(grantText) && grant.created_at === grant.updated_at &&
    Date.parse(observations.execution_commission.timestamp) > Date.parse(observations.contract_review.timestamp);
  // The acceptance here belongs to the published corrected source. A negative
  // review on the predecessor cannot stand in for it or for prospective authority.
  // Only a first-line decision is operative. An example in prose, a quote or
  // fenced code is not the reviewer's decision or the maintainer's commission.
  const firstLine = body => body.split(/\r?\n/u).find(line => line.trim().length);
  const recordUrl = (kind, id) => `https://github.com/hynk-studio/augnes/pull/${p.pull_request}#${kind}-${id}`;
  const gitSuccessor = isGitObservationSuccessor(p);
  const linkedGitGrant = !gitSuccessor || (
    [recordUrl("issuecomment", p.commission.initial_authorization.grant_comment_id), recordUrl("issuecomment", p.commission.delegation.id),
      recordUrl("pullrequestreview", p.accepted.review.id)].every(url => recordUrls.includes(url)) &&
    [revisionCommissionIdentity(p), p.commission.root_receipt_fingerprint].every(s => grant.body.includes(s)) &&
    delegation.created_at === delegation.updated_at && delegatesGitRevisionGrant(delegation.body, p.branch, p.pull_request) &&
    [p.branch, p.prior_attempt_id, p.prior_receipt_fingerprint, p.commission.root_receipt_fingerprint, revisionCommissionIdentity(p),
      recordUrl("issuecomment", p.commission.initial_authorization.grant_comment_id)].every(s => delegation.body.includes(s)) &&
    Date.parse(delegation.created_at) < Date.parse(review.submitted_at));
  const gitScope = isGitObservationRevision(p) && linkedGitGrant && firstLine(review.body) === "Source review decision: ACCEPT / RETAIN for prospective qualification." &&
    [gitReviewTarget(p), p.prior_receipt_fingerprint].every(s => review.body.includes(s)) &&
    firstLine(grant.body) === (gitSuccessor ? "Authorize ordinal two of the original reviewed Git-observation commission." : isGitInputRevision(p) ?
      "Authorize prospective Mac qualification of this stable Git-input target." :
      "Authorize prospective Mac qualification of this reviewed Git-observation successor.") &&
    (!isGitInputRevision(p) || [review.body, grant.body].every(body => body.includes(GIT_INPUT_REVISION) && body.includes(GIT_INPUT_HISTORY_BOUNDARY))) &&
    [p.schema, p.head, p.tree, p.base, p.branch, p.prior_receipt_fingerprint, gitReviewTarget(p),
      `https://github.com/hynk-studio/augnes/pull/${p.pull_request}#pullrequestreview-${p.accepted.review.id}`].every(s => grant.body.includes(s)) &&
    grant.created_at === grant.updated_at;
  let commissionedScope = false;
  if (isInventoryBoundRevision(p)) {
    const first = p.commission.ordinal === 1;
    const currentReview = first ? review : contractReview;
    const decision = "Source review decision: ACCEPT / RETAIN for prospective qualification.";
    const target = gitReviewTarget(p);
    commissionedScope = (!p.commission.forward_decision || forward.created_at === forward.updated_at &&
      Date.parse(forward.created_at) > Date.parse(grant.created_at) && Date.parse(currentReview.submitted_at) > Date.parse(forward.created_at) &&
      currentReview.body.split(/\s+/u).includes(recordUrl("issuecomment",forward.id)) &&
      (permitsFinalDependencySuccessor(forward.body,p,revisionCommissionIdentity(p)) ||
        readPostPassDecision(forward.body,p,revisionCommissionIdentity(p)) && permitsPostPassReview(currentReview.body,p,revisionCommissionIdentity(p)))) && prospectiveScope && firstLine(review.body) === decision && firstLine(currentReview.body) === decision &&
      [p.base, p.head, p.tree, target, p.prior_receipt_fingerprint].every(s => currentReview.body.includes(s)) &&
      firstLine(grant.body) === (isMaterialSourceRevision(p) ?
        "Authorize one NEW prospective v7 reviewed_revision commission for a material source correction." : isGitAcquisitionRevision(p) ?
        "Authorize a NEW prospective v7 reviewed_revision commission for a Git acquisition correction." :
        "Authorize a NEW prospective v7 reviewed_revision commission.") &&
      (!isGitAcquisitionRevision(p) || isMaterialSourceRevision(p) || [grant.body,review.body].every(body => body.includes(
        "Historical window remains UNKNOWN; old false stock and both spent ordinals remain unchanged."))) &&
      (!isMaterialSourceRevision(p) || [grant.body,review.body].every(body=>body.includes(MATERIAL_HISTORY_BOUNDARY) && inheritedSerialAuthorityScope(p,body) &&
        (!p.commission.evidence_kind || body.includes(REGISTERED_FIXTURE_BUDGET) && body.includes(FIXTURE_BUDGET_CLAIM))) &&
        /No ordinal two, recovery or unchanged-target retry under this commission\./u.test(grantText)) &&
      [p.accepted.head, p.accepted.tree, p.accepted.base, p.schema].every(s => grant.body.includes(s)) &&
      (!first || grant.body.includes(target)) && /zero unchanged-target retry/iu.test(grantText) &&
      grant.created_at === grant.updated_at && delegation.created_at === delegation.updated_at &&
      (isMaterialSourceRevision(p) ? delegatesMaterialSourceCommission(delegation.body,p) : delegatesProspectiveCommission(delegation.body, p.branch, p.pull_request)) &&
      [recordUrl("issuecomment", p.commission.delegation.id), recordUrl("pullrequestreview", p.accepted.review.id)].every(url => recordUrls.includes(url)) &&
      Date.parse(delegation.created_at) < Date.parse(review.submitted_at) &&
      (first || Date.parse(currentReview.submitted_at) > Date.parse(grant.created_at));
  }
  if (![p.accepted.head, p.accepted.tree, p.accepted.base, "ACCEPT / RETAIN"].every(s => review.body.includes(s)) ||
      !(isSerialAggregateRevision(p) ? serialAuthorityScope(p,review,grant) : isInventoryBoundRevision(p) ? commissionedScope : isGitObservationRevision(p) ? gitScope : isBrowserRevision(p) ? browserScope : settlementScope || (legacyScope || prospectiveScope) && /zero unchanged-target retry/iu.test(grantText)) ||
      !/separate fresh-process stock/iu.test(grantText) || !/independent.*(?:audit|judgment|decision)/iu.test(grantText)) throw fail("revision_authority_scope_invalid");
  if (Date.parse(observations.execution_commission.timestamp) <= Date.parse(observations.accepted_revision.timestamp)) throw fail("revision_authority_order_invalid");
  if (pr?.number !== p.pull_request || pr.state !== "open" || pr.draft !== true || pr.merged !== false || pr.auto_merge !== null ||
      pr.head?.repo?.full_name !== "hynk-studio/augnes" || pr.base?.repo?.full_name !== "hynk-studio/augnes" || pr.head.sha !== p.head ||
      pr.head.ref !== p.branch || pr.base.sha !== p.base || pr.base.ref !== "main") throw fail("revision_published_source_invalid");
  return observations;
}

export async function authorizeReviewedRevision(p, { transport = createGitHubObserverAuthorizationTransport(p.pull_request), reviewTransport = null, repositoryRoot = process.cwd() } = {}) {
  if (!revisionShape(p)) throw fail("revision_authority_missing");
  const review = await transport.review(p.accepted.review.id), grant = await transport.grant(p.authorization.grant_comment_id);
  const permissions = { accepted_revision: await transport.permission(review?.user?.login), execution_commission: await transport.permission(grant?.user?.login) };
  const settlementReview = p.authorization.settlement_review ? await transport.review(p.authorization.settlement_review.id) : null;
  if (settlementReview) permissions.settlement_review = await transport.permission(settlementReview.user?.login);
  const ref = p.authorization.contract_review;
  const contractReview = ref ? await (reviewTransport ?? (ref.pull_request === p.pull_request ? transport : createGitHubObserverAuthorizationTransport(ref.pull_request))).review(ref.id) : null;
  if (contractReview) permissions.contract_review = await transport.permission(contractReview.user?.login);
  let delegation = null;
  if (isGitObservationSuccessor(p)) {
    const c = p.commission;
    const firstReview = await transport.review(c.initial_accepted.review.id), firstGrant = await transport.grant(c.initial_authorization.grant_comment_id);
    if (!firstReview || !firstGrant || digest(reviewedRevisionAuthorityObservation(firstReview, "accepted_revision")) !== c.initial_accepted.review.sha256 ||
        digest(reviewedRevisionAuthorityObservation(firstGrant, "execution_commission")) !== c.initial_authorization.grant_sha256 ||
        !["APPROVED", "COMMENTED"].includes(firstReview.state) || firstGrant.created_at !== firstGrant.updated_at)
      throw fail("revision_initial_authority_changed");
  }
  if (isGitObservationSuccessor(p) || isInventoryBoundRevision(p)) {
    delegation = await transport.grant(p.commission.delegation.id);
    permissions.task_delegation = await transport.permission(delegation?.user?.login);
  }
  const forward = p.commission.forward_decision ? await transport.grant(p.commission.forward_decision.id) : null;
  if (forward) permissions.forward_decision = await transport.permission(forward.user?.login);
  const observations = validateReviewedRevisionAuthorityRecords(p, review, grant, permissions, await transport.pullRequest(), settlementReview, contractReview, delegation, forward);
  if (isMaterialSourceRevision(p)) {
    const evidence = readReviewedRevisionEvidence(path.join(repositoryRoot,p.local_relative_path),p,repositoryRoot);
    if (Date.parse(delegation.created_at) <= Date.parse(evidence.completion.finished_at) ||
        delegation.id === evidence.prior.source_correction.commission.delegation?.id ||
        delegation.id === evidence.prior.source_correction.authorization.grant_comment_id)
      throw fail("revision_material_fresh_authority_required");
  }
  const postPass = forward && readPostPassDecision(forward.body,p,revisionCommissionIdentity(p));
  if (postPass) {
    const git=args=>execFileSync("git",["--no-replace-objects",...args],{cwd:repositoryRoot,encoding:"utf8",timeout:10000}).trim();
    if (git(["rev-parse",postPass.head+"^{tree}"]) !== postPass.tree) throw fail("revision_forward_source_invalid");
    for (const [a,b] of [[postPass.head,p.head],[postPass.base,p.base]]) git(["merge-base","--is-ancestor",a,b]);
  }
  const capability = Object.freeze({ observations });
  const grantText = grant.body.replaceAll("*", "").replaceAll("`", "").replace(/\s+/gu, " ");
  revisionCapabilities.set(capability, { proof: digest(p), observations: digest(observations),
    prospectiveSettlement: !!observations.settlement_review, prospectivePostPass: !!postPass,
    prospectiveDependencySafety: grant.body.includes(p.commission.root_receipt_fingerprint) &&
      /Preserve the original safety_violation \/ blocked receipt/iu.test(grantText) && /clean prospective dependency preparation and current safety checks/iu.test(grantText) });
  return capability;
}

export function revisionArtifact(folder, reference, maximum = 512 * 1024) {
  if (!revisionKeys(reference, ["artifact", "sha256"]) || !/^[a-z0-9_-]+\.(?:json|log)$/u.test(reference.artifact ?? "") || !sha(reference.sha256)) throw fail("revision_artifact_invalid");
  const file = path.join(folder, reference.artifact), s = lstatSync(file);
  if (realpathSync(file) !== file || !s.isFile() || s.isSymbolicLink() || s.nlink !== 1 || s.size > maximum || (s.mode & 0o022)) throw fail("revision_artifact_unsafe");
  const bytes = readFileSync(file);
  if (digest(bytes) !== reference.sha256) throw fail("revision_artifact_changed");
  rememberRevisionFile(file, bytes);
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

// Interpret only the installed-service safety event emitted by the retained
// writer. This does not change that event's classification or stock validity.
function settledServiceIncident(receipt) {
  const input = receipt.inputs, service = receipt.cleanup?.companion_service;
  if (receipt.outcome?.disposition !== "safety_violation" || receipt.outcome.safety !== "blocked" ||
      receipt.cleanup?.completed !== false || service?.restored !== false || service.maintenance_acquired !== false ||
      service.maintenance_released !== true || service.scope !== "accepted_checkout_read_only" ||
      !revisionEqual(receipt.cleanup.failure_codes, ["companion_service_not_restored"]) ||
      !revisionEqual(receipt.final?.reason_codes, ["companion_service_not_restored"]) ||
      service.before?.status !== "installed_stopped" || service.after?.status !== "live" ||
      ![service.before, service.after].every(s => s.checkout_relation === "exact" && s.preservation_valid === true && sha(s.preservation_binding)) ||
      service.before.service_identity !== service.after.service_identity ||
      ![service.observations?.before, service.observations?.after].every(o => o?.coherent === true && o.live_identity_valid === true) ||
      !Array.isArray(receipt.phases) || !receipt.phases.length || receipt.phases.some(p => p.status !== "pass" || p.cleanup?.completed !== true || p.cleanup.remaining_owned_processes !== 0) ||
      !input || !Array.isArray(input.events) || input.events.length >= 64 || !revisionEqual(input.secondary_faults, []) ||
      !revisionEqual(input.first_fault, receipt.outcome.first_fault)) return false;
  let safetyEvent = null;
  for (const event of input.events) {
    if (event.resource === "installed_service_change") {
      const value = { ...event }; delete value.identity;
      if (safetyEvent || !revisionKeys(value, ["resource", "classification", "disposition", "observed_at", "monotonic_ns", "after"]) ||
          value.classification !== "safety" || value.disposition !== "safety_violation" || value.after !== null ||
          event.identity !== digest(value) || !revisionTime(event.observed_at) || !/^\d+$/u.test(event.monotonic_ns)) return false;
      safetyEvent = event;
    } else {
      const resource = input.resources?.find(r => r.id === event.resource);
      if (!resource || event.identity !== inputEventIdentity(event) || event.diagnostic !== undefined ||
          event.classification !== resource.classification || !nonFaultInputChange(event.disposition) ||
          classifyInputChange(resource.before, event.after, resource, input) !== event.disposition) return false;
    }
  }
  return !!safetyEvent && revisionEqual(input.first_fault, {
    resource: safetyEvent.resource, disposition: safetyEvent.disposition,
    observed_at: safetyEvent.observed_at, monotonic_ns: safetyEvent.monotonic_ns,
  });
}

function safeStoppedObservation(observation, identity) {
  const { state, diagnostics: d } = observation ?? {};
  return state?.status === "installed_stopped" && state.checkout_relation === "exact" && state.preservation_valid === true &&
    state.service_identity === identity && sha(state.preservation_binding) && d?.contract === "augnes.companion-preservation-observation.v2" &&
    d.coherent === true && d.live_identity_valid === true && d.loaded_job === null && revisionTime(d.finished_at) &&
    d.before_binding === state.preservation_binding && d.after_binding === state.preservation_binding &&
    d.material_states?.maintenance_lease_path === "missing" && d.material_states.runtime_manifest_path === "missing" &&
    d.material_states.runtime_token_path === "missing" && d.material_states.runtime_access_path === "missing" && d.material_states.runtime_lock_path === "missing";
}

function readRevisionSettlement(p, original, completion, parse, bytes) {
  const s = parse(p.settlement);
  if (!revisionKeys(s, ["prior_receipt_fingerprint", "authority", "target", "recorded_at", "responsible_owner", "stop", "consumers", "managed_consumers", "restored_observation", "start_original"]))
    throw fail("revision_settlement_invalid");
  const owner = parse(s.responsible_owner), stop = parse(s.stop),
    consumers = parse(s.consumers), managed = parse(s.managed_consumers), restored = parse(s.restored_observation);
  bytes(s.start_original); // The authenticated receiving audit supplies attribution.
  const identity = original.cleanup.companion_service.before.service_identity, restoration = owner.restoration;
  if (s.prior_receipt_fingerprint !== p.prior_receipt_fingerprint || !revisionEqual(s.authority, p.authorization) ||
      !revisionEqual(s.target, { base: p.base, head: p.head, tree: p.tree, runtime_inputs_sha256: p.inputs.identity_sha256 }) ||
      !revisionTime(s.recorded_at) || Date.parse(s.recorded_at) <= Date.parse(completion.finished_at) ||
      !revisionTime(original.run?.started_at) || !revisionTime(original.run?.finished_at) ||
      owner.service_identity !== identity || !revisionTime(owner.recorded_at) ||
      !revisionTime(owner.start?.enclosing_cell_started_at) || !revisionTime(owner.start?.enclosing_cell_completed_at) ||
      Date.parse(owner.start.enclosing_cell_started_at) < Date.parse(original.run.started_at) ||
      Date.parse(owner.start.enclosing_cell_completed_at) > Date.parse(original.run.finished_at) ||
      restoration?.command?.exit_code !== 0 || !revisionTime(restoration.command.started_at) || !revisionTime(restoration.command.finished_at) ||
      Date.parse(restoration.command.started_at) <= Date.parse(completion.finished_at) ||
      Date.parse(restoration.command.finished_at) < Date.parse(restoration.command.started_at) ||
      restoration.command.result_sha256 !== s.stop.sha256 || restoration.supported_stop_only !== true ||
      !revisionEqual(restoration.before, original.cleanup.companion_service.after) ||
      stop.command !== "stop" || !["changed", "unchanged"].includes(stop.result) ||
      stop.service?.status !== "installed_stopped" || stop.service.checkout_relation !== "exact" || stop.service.service_identity !== identity ||
      !safeStoppedObservation(restored, identity) || !revisionEqual(restoration.after, restored.state) || restoration.loaded_job_after !== null ||
      Date.parse(restored.diagnostics.finished_at) < Date.parse(restoration.command.finished_at) ||
      Date.parse(s.recorded_at) < Date.parse(restored.diagnostics.finished_at) ||
      !revisionTime(consumers.observed_at) || Date.parse(consumers.observed_at) <= Date.parse(completion.finished_at) ||
      Date.parse(consumers.observed_at) > Date.parse(restoration.command.started_at) ||
      !revisionEqual(consumers.registered_checkout_owners, []) || !revisionEqual(consumers.verification_processes, []) ||
      !revisionTime(managed.generated_at) || Date.parse(managed.generated_at) <= Date.parse(completion.finished_at) ||
      Date.parse(managed.generated_at) > Date.parse(restoration.command.started_at) ||
      managed.managed_execution?.stage !== "no_run" || managed.managed_execution.attention_required !== false ||
      managed.managed_execution.reconciliation_required !== false) throw fail("revision_settlement_invalid");
  return { identity, record: s, restored };
}

export function assertReviewedRevisionLiveSettlement(settlement, live) {
  if (!live || !revisionTime(live.observed_at) || Date.now() - Date.parse(live.observed_at) > 60_000 ||
      !revisionEqual(live.foreign_checkout_owners, []) || !safeStoppedObservation(live.service, settlement.identity) ||
      Date.now() - Date.parse(live.service.diagnostics.finished_at) > 60_000 ||
      Date.parse(live.service.diagnostics.finished_at) < Date.parse(settlement.record.recorded_at))
    throw fail("revision_current_settlement_unsafe");
}

// Recheck the retained physical tree before review and exclusive reservation.
// Replay instead uses the immutable witnesses; the successor runs a fresh npm ci.
function verifyRetainedWebInput(repositoryRoot, expected) {
  const current = observePreparedDependencyInputs({repositoryRoot,phaseId:"dependencies-web-planning"});
  if (!revisionEqual(current,expected)) throw fail("revision_prospective_dependencies_changed");
}

// A review packet deliberately has NO authorization section. It can read
// material, never mint the authenticated capability required by beginAttempt.
export const inspectBrowserRevisionPreparation = args => inspectRevisionPreparation(args, isBrowserRevision);
export const inspectGitRevisionPreparation = args => inspectRevisionPreparation(args, usesGitInventory);
export const inspectSerialAggregatePreparation = args => inspectRevisionPreparation(args, isSerialAggregateRevision);
// Current publication is checked only here and at authenticated admission.
// Retrospective physical replay uses the recorded source and authority instead.
export async function prepareSerialAggregateRevision(args, { transport } = {}) {
  const p=read(args.file);
  const pr=await (transport ?? createGitHubObserverAuthorizationTransport(p.pull_request)).pullRequest();
  assertRevisionPublication(p,pr);
  return {...await inspectSerialAggregatePreparation(args),published_head_checked:true};
}
function assertRevisionPublication(p,pr) {
  if (pr?.number!==p.pull_request || pr.state!=="open" || pr.draft!==true || pr.merged!==false || pr.auto_merge!==null ||
      pr.head?.repo?.full_name!=="hynk-studio/augnes" || pr.base?.repo?.full_name!=="hynk-studio/augnes" ||
      pr.head.sha!==p.head || pr.head.ref!==p.branch || pr.base.sha!==p.base || pr.base.ref!=="main")
    throw fail("revision_published_source_invalid");
}
// Development delegation is conditional. Preparation reads it, but obtains no
// execution capability and never supplies an accepted review or a grant.
export async function prepareMaterialSourceRevision(args,{transport}={}) {
  const p=read(args.file);
  if (!isMaterialSourceRevision(p) || Object.hasOwn(p,"authorization") || !revisionMaterialShape(p,true))
    throw fail("revision_preparation_invalid");
  const api=transport??createGitHubObserverAuthorizationTransport(p.pull_request);
  assertRevisionPublication(p,await api.pullRequest());
  const evidence=readRevisionMaterials(args.file,p,args.repositoryRoot,false);
  const delegation=await api.grant(p.commission.delegation.id), permission=await api.permission(delegation?.user?.login);
  if (!delegation || typeof delegation.body!=="string") throw fail("revision_material_fresh_authority_required");
  const observation=reviewedRevisionAuthorityObservation(delegation,"task_delegation");
  if (delegation?.id!==p.commission.delegation.id || delegation.user?.type!=="User" || !revisionId(delegation.user?.id) ||
      !/^[A-Za-z0-9-]{1,39}$/u.test(delegation.user?.login??"") || Buffer.byteLength(delegation.body)>64*1024 || !revisionTime(observation.timestamp) ||
      !["OWNER","MEMBER","COLLABORATOR"].includes(delegation.author_association) ||
      delegation.issue_url!==`https://api.github.com/repos/hynk-studio/augnes/issues/${p.pull_request}` ||
      permission?.user?.login!==delegation.user.login || !["admin","maintain"].includes(permission.permission) ||
      typeof delegation.body!=="string" || !delegatesMaterialSourceCommission(delegation.body,p) ||
      digest(observation)!==p.commission.delegation.sha256 || delegation.created_at!==delegation.updated_at ||
      !(Date.parse(delegation.created_at)>Date.parse(evidence.completion.finished_at)) ||
      delegation.id===evidence.prior.source_correction.commission.delegation?.id ||
      delegation.id===evidence.prior.source_correction.authorization.grant_comment_id)
    throw fail("revision_material_fresh_authority_required");
  if (evidence.focused.regression?.kind===REPOSITORY_TYPECHECK) {
    const witness=JSON.parse(revisionArtifact(path.dirname(args.file),evidence.focused.regression.after));
    if (!revisionEqual(observeTypecheckCompiler(args.repositoryRoot),{compiler_version:witness.compiler_version,compiler:witness.compiler,entrypoints:witness.entrypoints,overrides:witness.overrides}))
      throw fail("revision_typecheck_compiler_changed");
    if (!revisionEqual(observeGeneratedTypeInputs(args.repositoryRoot),witness.generated)) throw fail("revision_typecheck_generated_changed");
  }
  if (evidence.focused.regression?.kind===REPOSITORY_PURE_CONTRACT)
    inspectCurrentPureContractInputs(args.repositoryRoot,JSON.parse(revisionArtifact(path.dirname(args.file),evidence.focused.regression.after)));
  if (evidence.focused.regression?.kind===REGISTERED_FIXTURE_BUDGET)
    for (const ref of [evidence.focused.regression.after,evidence.focused.regression.registration])
      inspectCurrentFixtureBudgetInputs(args.repositoryRoot,JSON.parse(revisionArtifact(path.dirname(args.file),ref)));
  return {...await inspectGitRevisionPreparation(args),published_head_checked:true,delegation:observation,
    ...(p.commission.inherited_serial ? {inherited_serial:p.commission.inherited_serial} : {})};
}
function inspectRevisionPreparation(options, accepts) {
  return afterRevisionValidation(typeof options.live === "function" ? options.live : null,
    () => prepareRevisionInspection(options, accepts), (finish, current, check) => finish(current, check));
}
function prepareRevisionInspection({ file, repositoryRoot, predecessorRoot, anchorRoot, runtimeInputs, live }, accepts) {
  const p = read(file);
  if (!accepts(p) || Object.hasOwn(p, "authorization") || !revisionMaterialShape(p, true)) throw fail("revision_preparation_invalid");
  const evidence = readRevisionMaterials(file, p, repositoryRoot, false);
  const tip = reconstructAttemptTip({ anchorRoot, repositoryRoot: predecessorRoot, branch: p.branch });
  if (tip.family_id !== p.prior_family_id || tip.number !== p.prior_number || tip.attempt_id !== p.prior_attempt_id ||
      (tip.reviewed_revision_consumed ?? 0) !== (isMaterialSourceRevision(p) ? evidence.prior.source_correction.commission.maximum_invocations : isInventoryBoundRevision(p) && p.commission.ordinal === 1 ? 2 : p.commission.ordinal - 1) ||
      (usesFreshRevisionGrant(p) && tip.revision_commission !== revisionCommissionIdentity(p)) ||
      !revisionEqual(runtimeInputs, evidence.inputs)) throw fail("revision_preparation_target_changed");
  verifyRevisionOriginals(anchorRoot, predecessorRoot, p, file);
  return (current, assertUnchanged) => {
  if (typeof live === "function") live = current;
  if (!revisionEqual(runtimeInputs, evidence.inputs)) throw fail("revision_preparation_target_changed");
  if (evidence.retainedObservation) verifyRetainedWebInput(repositoryRoot,evidence.retainedObservation);
  if (isBrowserSuccessor(p) || usesRevisionInventory(p)) {
    const git = args => execFileSync("git", args, { cwd: repositoryRoot, encoding: "utf8", timeout: 10000 }).trim();
    verifyGitInputPublication(p,evidence.original,git);
    if (git(["rev-parse", "HEAD"]) !== p.head || git(["symbolic-ref", "--short", "HEAD"]) !== p.branch ||
        (usesRevisionInventory(p) && (git(["rev-parse", "refs/remotes/origin/main"]) !== p.base ||
          git(["status", "--porcelain=v1"]) || live?.inventory !== p.inputs.inventory_sha256)))
      throw fail("revision_preparation_target_changed");
  }
  assertUnchanged();
  verifyBrowserRevisionPreservation(evidence.original.cleanup.companion_service.after, usesRevisionInventory(p) ? live?.service : live, {requireSameBinding:isInventoryBoundRevision(p) || isSerialAggregateRevision(p)});
  return { target: isSerialAggregateRevision(p) ? serialReviewTarget(p) : usesGitInventory(p) ? gitReviewTarget(p) : browserReviewTarget(p), predecessor: p.prior_receipt_fingerprint, runtime_inputs: p.inputs.identity_sha256,
    head: p.head, tree: p.tree, authorized: false, reserved: false,
    ...(isSerialAggregateRevision(p) ? {route:SERIAL_AGGREGATE_ROUTE,logical_root_family_id:candidateFamilyId(p.branch),consumed:tip.reviewed_revision_consumed ?? 0,issued_limit:1,envelope_sha256:PROJECT_EXPERIENCE_COMMITMENT,incident:evidence.serialIncident} : {}),
    ...(isInventoryBoundRevision(p) ? { root_receipt: p.commission.root_receipt_fingerprint, consumed: tip.reviewed_revision_consumed,
      predecessor_commission: tip.revision_commission, ordinal: p.commission.ordinal } : {}),
    ...(usesFreshRevisionGrant(p) ? { root_receipt: p.commission.root_receipt_fingerprint, consumed: tip.reviewed_revision_consumed,
      ordinal: p.commission.ordinal, initial_grant_comment_id: p.commission.initial_authorization.grant_comment_id } : {}) };
  };
}

export function readReviewedRevisionEvidence(file, p, repositoryRoot) {
  if (!revisionShape(p)) throw fail("revision_proof_invalid");
  return readRevisionMaterials(file, p, repositoryRoot, true);
}

function readRevisionMaterials(file, p, repositoryRoot, authorizedShape) {
  const scope = revisionReadScope.getStore(), proof = {...p}; delete proof.local_relative_path;
  const key = digest({file,repositoryRoot,proof,authorizedShape});
  if (scope?.evidence.has(key)) return scope.evidence.get(key);
  const evidence = validateRevisionMaterials(file,p,repositoryRoot,authorizedShape);
  scope?.evidence.set(key,evidence);
  return evidence;
}

function validateRevisionMaterials(file, p, repositoryRoot, authorizedShape) {
  const stored = { ...p }; delete stored.local_relative_path;
  const boundedV7 = isInventoryBoundRevision(p);
  const serial = isSerialAggregateRevision(p);
  const reviewPending = !authorizedShape && (serial || isGitObservationRevision(p) || boundedV7 && p.commission.ordinal === 1);
  if (!revisionKeys(stored, ["schema", "kind", "branch", "base", "head", "tree", "prior_family_id", "prior_number", "prior_attempt_id", "prior_receipt_fingerprint", "pull_request", "commission", "accepted", ...(authorizedShape ? ["authorization"] : []), "originals", "inputs", "source", "focused", ...(serial ? ["incident"] : []), ...(p.settlement ? ["settlement"] : [])]) ||
      !revisionKeys(p.accepted, ["head", "tree", "base", ...(reviewPending ? [] : ["review"])]) || (!reviewPending && !revisionKeys(p.accepted.review, ["id", "sha256"])) ||
      !revisionKeys(p.originals, ["receipt", "attempt", "completion", "stock"]) || !revisionKeys(p.inputs, ["predecessor_sha256", "identity_sha256", "current", ...(usesRevisionInventory(p) ? ["inventory_sha256"] : [])])) throw fail("revision_proof_invalid");
  const bytes = (ref, maximum) => revisionArtifact(path.dirname(file), ref, maximum), parse = ref => JSON.parse(bytes(ref));
  const original = parse(p.originals.receipt), prior = parse(p.originals.attempt), completion = parse(p.originals.completion), inputs = parse(p.inputs.current);
  if (hasRetiredQualificationMarker(original) || hasRetiredQualificationMarker(prior)) throw fail("qualification_route_retired");
  const stockLines = bytes(p.originals.stock).toString("utf8").split("\n").filter(line => line.startsWith("{"));
  if (stockLines.length !== 1) throw fail("revision_predecessor_stock_invalid");
  const stock = JSON.parse(stockLines[0]);
  const originalGit = args => execFileSync("git", ["--no-replace-objects",...args], {cwd:repositoryRoot,timeout:10000,maxBuffer:16*1024*1024,stdio:["ignore","pipe","pipe"]});
  const serialIncident = serial ? readSerialAggregateIncident(p,original,prior,completion,{parse,bytes,git:originalGit,phases:REVIEWED_REVISION_PHASES,stock}) : null;
  const browser = isBrowserRevision(p), successor = isBrowserSuccessor(p);
  const gitSuccessor = isGitObservationSuccessor(p);
  if (isBrowserRevision(prior.source_correction) !== successor) throw fail("revision_browser_lineage_invalid");
  if (!validGitRevisionEdge(prior.source_correction, p)) throw fail("revision_git_lineage_invalid");
  const gitIncident = isGitObservationRevision(p) && !gitSuccessor ? gitObservationIncident(original, prior, completion, stock, REVIEWED_REVISION_PHASES) : null;
  const acquisitionIncident = isGitAcquisitionRevision(p) && !isMaterialSourceRevision(p) && p.commission.ordinal === 1 ?
    gitAcquisitionIncident(original, prior, completion, stock, REVIEWED_REVISION_PHASES) : null;
  if (isMaterialSourceRevision(p) && (completion.disposition !== "product_failure" || original.final?.reason_codes?.includes("interrupted")))
    throw fail("revision_material_predecessor_invalid");
  const browserIncident = browser && !successor ? browserPredecessorEvidence(original, prior, completion, stock) : null;
  let retainedBefore = null;
  const postPass=boundedV7 && p.commission.ordinal===2 && !!p.commission.forward_decision && original.outcome?.disposition==="completed_success";
  if (gitSuccessor || boundedV7) {
    verifyStoredRevisionProof(repositoryRoot, prior.source_correction);
    if (postPass) {
      verifyGitRevisionSuccess(original,stock,inputs,REVIEWED_REVISION_PHASES);
      if (p.accepted.head!==prior.head || p.accepted.tree!==prior.tree || p.accepted.base!==original.repository.base_sha) throw fail("revision_positive_predecessor_invalid");
    } else if (!acquisitionIncident) retainedBefore = verifyGitRevisionFailure(original, stock, inputs, REVIEWED_REVISION_PHASES, isMaterialSourceRevision(p) ? prior.source_correction.commission.ordinal : boundedV7 && p.commission.ordinal === 1 ? 2 : 1, !!p.commission.forward_decision, isMaterialSourceRevision(p) && isSerialAggregateRevision(prior.source_correction));
    if (completion.infrastructure_code !== null || !(Date.parse(completion.finished_at) >= Date.parse(original.run.finished_at)) ||
        (gitSuccessor && (!revisionEqual(p.commission.initial_accepted, prior.source_correction.accepted) ||
          !revisionEqual(p.commission.initial_authorization, prior.source_correction.authorization))) ||
        (boundedV7 && p.commission.ordinal === 2 && (!revisionEqual(p.accepted, prior.source_correction.accepted) ||
          !revisionEqual(p.commission.delegation, prior.source_correction.commission.delegation))))
      throw fail("revision_git_predecessor_invalid");
  }
  if (successor) {
    verifyStoredRevisionProof(repositoryRoot, prior.source_correction);
    verifyReviewedBrowserFailure(original, stock, inputs, REVIEWED_REVISION_PHASES);
    if (completion.infrastructure_code !== null || !(Date.parse(completion.finished_at) >= Date.parse(original.run.finished_at)))
      throw fail("revision_browser_failure_invalid");
  }
  if (browserIncident && (p.accepted.head !== prior.head || p.accepted.tree !== prior.tree || p.accepted.base !== original.repository.base_sha))
    throw fail("revision_browser_accepted_source_invalid");
  const content = { ...original }; delete content.integrity;
  const inputInvalidation = knownInputInvalidation(original), previousRevision = isReviewedRevision(prior.source_correction);
  const newCommission = !isMaterialSourceRevision(p) && previousRevision && prior.source_correction.commission.ordinal === 2 && p.commission.ordinal === 1 &&
    p.authorization?.grant_comment_id !== prior.source_correction.authorization.grant_comment_id;
  const dependencySafety = newCommission && knownInputInvalidation(original, true);
  const externalSettlement = newCommission && p.settlement && settledServiceIncident(original) &&
    revisionEqual(p.accepted, prior.source_correction.accepted) && p.authorization.settlement_review?.head === prior.head
    ? readRevisionSettlement(p, original, completion, parse, bytes) : null;
  if (p.settlement && !externalSettlement) throw fail("revision_settlement_predecessor_invalid");
  if (original.receipt_version !== 4 || hasRetiredQualificationMarker(original) || original.integrity?.content_fingerprint !== digest(content) ||
      !revisionEqual(original.attempt, prior) || prior.attempt_id !== p.prior_attempt_id || prior.family_id !== p.prior_family_id || prior.number !== p.prior_number ||
      prior.branch !== p.branch || original.integrity.content_fingerprint !== p.prior_receipt_fingerprint ||
      original.repository?.head_sha !== prior.head || original.repository.tree_sha !== prior.tree ||
      completion.contract !== ATTEMPT_CONTRACT || completion.attempt_id !== prior.attempt_id || completion.receipt_fingerprint !== p.prior_receipt_fingerprint ||
      !revisionTime(completion.finished_at) || completion.cleanup_complete !== (externalSettlement ? false : true) || completion.disposition !== original.outcome?.disposition ||
      (completion.disposition === "input_invalidation" ? !inputInvalidation : completion.disposition === "safety_violation" ? !(dependencySafety || externalSettlement || browserIncident || retainedBefore) :
        completion.disposition === "unclassified_timeout" ? !serialIncident :
        completion.disposition === "unknown_relevance" ? !(gitIncident || acquisitionIncident) :
        completion.disposition === "completed_success" ? !postPass :
        completion.disposition !== "product_failure" || original.outcome.safety !== "preserved_within_observed_scope") ||
      original.cleanup?.completed !== (externalSettlement ? false : true) || original.cleanup.remaining_owned_processes !== 0 || original.checkout_ownership?.released !== true || original.capacity_ownership?.released !== true ||
      original.cleanup.companion_service?.restored !== (externalSettlement ? false : true) || original.cleanup.isolated_resources?.completed !== true ||
      original.inputs?.resources?.filter(r => r.id === "node-executable").length !== 1 || p.inputs.predecessor_sha256 !== (serialIncident ? digest(serialIncident) : gitIncident ? digest(gitIncident) : browserIncident ? digest(browserIncident) : revisionPriorInputs(original))) throw fail("revision_predecessor_invalid");
  if (stock.content_fingerprint !== p.prior_receipt_fingerprint || stock.dimensions?.historical_integrity !== "intact" || stock.dimensions?.safety !== original.outcome.safety ||
      stock.valid_deciding_evidence !== postPass) throw fail("revision_predecessor_stock_invalid");
  const c = p.commission;
  if (previousRevision ? !validReviewedRevisionAttempt(prior) ||
      (boundedV7 && authorizedShape && c.ordinal === 1 && p.authorization.grant_comment_id === prior.source_correction.commission.initial_authorization?.grant_comment_id) ||
      (boundedV7 && !authorizedShape ? !validGitRevisionEdge(prior.source_correction, p) ||
        (c.ordinal === 2 && !["root_family_id", "root_number", "root_attempt_id", "root_receipt_fingerprint"].every(k => c[k] === prior.source_correction.commission[k])) :
        usesFreshRevisionGrant(p) ? revisionCommissionIdentity(p) !== revisionCommissionIdentity(prior.source_correction) :
        !revisionFollows(p, prior.source_correction.commission.ordinal, revisionCommissionIdentity(prior.source_correction),
          [prior.source_correction.authorization.grant_comment_id], prior.source_correction.commission.maximum_invocations)) :
      c.ordinal !== 1 || c.root_family_id !== p.prior_family_id || c.root_number !== p.prior_number || c.root_attempt_id !== p.prior_attempt_id || c.root_receipt_fingerprint !== p.prior_receipt_fingerprint ||
      prior.source_correction?.authorization && p.authorization?.grant_comment_id === prior.source_correction.authorization.grant_comment_id) throw fail("revision_commission_lineage_invalid");
  if (digest(inputs) !== p.inputs.identity_sha256 || (browser ? inputs?.contract !== BROWSER_RUNTIME_INPUTS || !validCanonicalRuntimeInputs(inputs) : inputs?.contract !== "augnes.local-canonical-runtime-inputs.v1") || !sha(inputs.node?.location_fingerprint) ||
      inputs.node?.observation?.present !== true || !sha(inputs.node.observation.sha256) || !sha(inputs.headers?.location_fingerprint) ||
      !validNodeHeaders(inputs.headers?.observation)) throw fail("revision_inputs_invalid");
  const source = parse(p.source), focused = parse(p.focused);
  const git = (args, maxBuffer = 16 * 1024 * 1024) => execFileSync("git", ["--no-replace-objects", ...args], { cwd: repositoryRoot, timeout: 10000, maxBuffer, stdio: ["ignore", "pipe", "pipe"] });
  verifyInheritedSerialConnection(p,git);
  const delta = (a, b) => { const d = git(["diff", "--binary", "--full-index", "--no-ext-diff", "--no-textconv", a, b, "--"]); return { bytes: d.length, sha256: digest(d), paths: git(["diff", "--name-only", a, b, "--"]).toString().trim().split("\n").filter(Boolean).sort() }; };
  const initial = gitSuccessor ? p.commission.initial_accepted : p.accepted;
  for (const [a, b] of [[initial.head, p.head], [initial.base, p.base], [p.base, p.head], [prior.head, p.head]]) git(["merge-base", "--is-ancestor", a, b]);
  for (const t of [p, p.accepted]) if (git(["rev-parse", `${t.head}^{tree}`]).toString().trim() !== t.tree) throw fail("revision_source_identity_invalid");
  if (source.schema !== "augnes.local-canonical-reviewed-revision-source.v1" || source.basis !== "implementation_owner_not_independent_review" ||
      !revisionEqual(source.accepted_to_final, delta(initial.head, p.head)) || !revisionEqual(source.predecessor_to_final, delta(prior.head, p.head)) ||
      !revisionEqual(source.main_to_final, delta(p.base, p.head)) || !revisionTime(source.reviewed_at) || Date.parse(source.reviewed_at) <= Date.parse(completion.finished_at)) throw fail("revision_source_delta_invalid");
  const changedCode = source.predecessor_to_final.paths.filter(name => /\.(?:[cm]?[jt]sx?)$/u.test(name) || gitIncident && WEB_PLANNING_CLIENT_MODULES.has(name) || isMaterialSourceRevision(p) && /^apps\/web_planning\/src\/(?:client|[a-z-]+-client)\.js\.txt$/u.test(name));
  // Metadata-only replacement/touching and proof reformatting cannot buy a
  // second invocation. Full identities still bind admission and stock; material
  // input repair requires an actual consumed path or content change.
  const materialInputs = value => ({ node: { location: value.node.location_fingerprint, sha256: value.node.observation.sha256 },
    headers: { location: value.headers.location_fingerprint, sha256: value.headers.observation.content_sha256 } });
  if (previousRevision && digest(original.inputs.binding?.runtime_inputs) !== prior.source_correction.inputs.identity_sha256) throw fail("revision_prior_runtime_binding_invalid");
  const legacyNode = original.inputs.resources.find(r => r.id === "node-executable");
  if (browserIncident) {
    const probe = focused.consumers;
    if (!revisionEqual(focused.input_remedy_resources, ["browser-executable"]) || !revisionKeys(probe, ["phase", "logs", "installation"]) ||
        !Array.isArray(probe.logs) || !probe.logs.length || probe.logs.length > 8 || new Set(probe.logs.map(ref => ref.sha256)).size !== probe.logs.length)
      throw fail("revision_browser_remedy_invalid");
    const reference = probe.installation;
    if (!revisionKeys(reference, ["record", "field"]) || !Array.isArray(reference.field) || reference.field.length > 8 ||
        reference.field.some(k => typeof k !== "string" || !/^[a-z][a-z0-9_]{0,79}$/u.test(k)))
      throw fail("revision_browser_focused_installation_invalid");
    const witness = reference.field.reduce((v,k) => v && Object.hasOwn(v,k) ? v[k] : null, parse(reference.record));
    verifyBrowserRemedy(browserIncident, inputs.browser, probe.phase, probe.logs.map(ref => revisionArtifact(path.dirname(file), ref, 2 * 1024 * 1024)), witness);
  }
  const gitInputRemedy = gitIncident && isGitInputRevision(p)
    ? verifyGitInputRemedy(p, original, gitIncident, source, focused, {parse, git}) : null;
  const changedInputs = browserIncident || gitInputRemedy ? true : previousRevision ? !revisionEqual(materialInputs(inputs), materialInputs(original.inputs.binding.runtime_inputs)) :
    inputs.node.location_fingerprint !== legacyNode.location_fingerprint || inputs.node.observation.sha256 !== legacyNode.before.sha256;
  if (!changedCode.length && !changedInputs) throw fail("revision_material_remedy_required");
  if (gitSuccessor) verifyGitSourceRepair(p, prior, focused, { git, parse, bytes, completedAt: completion.finished_at, repositoryRoot });
  if (gitIncident && !gitInputRemedy) {
    if (!revisionEqual(focused.input_remedy_resources, []) || prior.head === p.head || prior.tree === p.tree ||
        !Array.isArray(focused.implicated_paths) || !focused.implicated_paths.some(name =>
          changedCode.includes(name) && !name.startsWith("scripts/") && git(["diff","--ignore-all-space","--ignore-blank-lines",prior.head,p.head,"--",name]).length))
      throw fail("revision_material_remedy_required");
    const red = parse(focused.regression?.before), green = parse(focused.regression?.after);
    const fixture = focused.regression?.path;
    if (!revisionPath(fixture) || !/\.mjs$/u.test(fixture) || !changedCode.includes(fixture)) throw fail("revision_git_regression_invalid");
    const fixtureHash = digest(git(["show",`${p.head}:${fixture}`]));
    const modules = focused.implicated_paths.filter(name => !name.startsWith("scripts/"));
    if (!modules.length || typeof green.command !== "string" || !green.command.trim() || green.command.length > 2000 ||
        !focused.commands?.some(c => c.command === green.command && c.tested_source_head === p.head))
      throw fail("revision_git_regression_invalid");
    for (const [witness, head, code] of [[red,prior.head,1],[green,p.head,0]]) {
      if (witness.head !== head || witness.tested_source_head !== head || !revisionEqual(witness.modules, modules.map(name => ({path:name,sha256:digest(git(["show", `${head}:${name}`]))}))) ||
          witness.fixture_sha256 !== fixtureHash || !sha(witness.environment) || witness.environment !== red.environment ||
          witness.node_version !== CANONICAL_NODE_VERSION || witness.command !== green.command ||
          witness.result.exit_code !== code || witness.result.timed_out !== false || witness.result.cancelled !== false ||
          witness.result.cleanup_completed !== true || witness.result.remaining_owned_processes !== 0 || witness.result.termination_reason !== "natural_exit" ||
          witness.result.exit_observed !== true || witness.result.streams_closed !== true || !revisionTime(witness.finished_at))
        throw fail("revision_git_regression_invalid");
      if (!revisionArtifact(path.dirname(file),witness.stdout,2*1024*1024).length) throw fail("revision_git_regression_invalid");
    }
    if (red.stdout.sha256 === green.stdout.sha256 || Date.parse(red.finished_at) <= Date.parse(completion.finished_at) || Date.parse(green.finished_at) <= Date.parse(red.finished_at) ||
        Date.parse(green.finished_at) > Date.parse(focused.finished_at)) throw fail("revision_git_regression_invalid");
  }
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
  const pinnedPaths = ["package.json", "package-lock.json", "apps/augnes_apps/package.json", "apps/augnes_apps/package-lock.json",
    "apps/web_planning/package.json", "apps/web_planning/package-lock.json", ".node-version", ".nvmrc"];
  if (git(["diff", "--name-only", boundedV7 || serial ? prior.head : initial.head, p.head, "--", ...pinnedPaths]).length) throw fail("revision_pinned_inputs_changed");
  if (focused.schema !== "augnes.local-canonical-reviewed-revision-focused.v1" || focused.basis !== "implementation_owner_not_independent_review" ||
      focused.predecessor_receipt_fingerprint !== p.prior_receipt_fingerprint || focused.runtime_inputs_sha256 !== p.inputs.identity_sha256 ||
      !revisionTime(focused.finished_at) || Date.parse(focused.finished_at) <= Date.parse(completion.finished_at) ||
      typeof focused.remedy !== "string" || focused.remedy.length < 20 || focused.remedy.length > 4000 ||
      !Array.isArray(focused.implicated_paths) || !focused.implicated_paths.every(revisionPath) ||
      !focused.implicated_paths.every(name => changedCode.includes(name)) || (!focused.implicated_paths.length && !changedInputs) ||
      !Array.isArray(focused.source_files) || !focused.source_files.length || focused.source_files.length > 128 ||
      new Set(focused.source_files.map(f => f.path)).size !== focused.source_files.length ||
      focused.source_files.some(f => {
        if (!revisionPath(f.path) || !sha(f.sha256) || !Number.isSafeInteger(f.byte_size) || f.byte_size < 0) return true;
        const blob = git(["show", `${p.head}:${f.path}`]);
        return blob.length !== f.byte_size || digest(blob) !== f.sha256;
      }) ||
      focused.implicated_paths.some(name => !focused.source_files.some(f => f.path === name)) ||
      !Array.isArray(focused.commands) || !focused.commands.length || focused.commands.length > 32 || focused.commands.some(c =>
        typeof c.command !== "string" || !c.command.length || c.command.length > 2000 || c.result?.exit_code !== 0 || c.result.timed_out !== false ||
        c.result.cancelled !== false || c.result.cleanup_completed !== true || c.result.remaining_owned_processes !== 0 ||
        c.result.exit_observed !== true || c.result.streams_closed !== true || c.result.termination_reason !== "natural_exit")) throw fail("revision_focused_remedy_invalid");
  const materialSource = isMaterialSourceRevision(p) ? verifyGitSourceRepair(p,prior,focused,{git,parse,bytes,completedAt:completion.finished_at,original,completion,repositoryRoot}) : null;
  let testedFinalSource = false;
  for (const command of focused.commands) {
    const record = parse(command.record);
    if (!revisionEqual(record.result ?? record, command.result) || !revisionRef(command.stdout)) throw fail("revision_focused_original_invalid");
    revisionArtifact(path.dirname(file), command.stdout, 2 * 1024 * 1024);
    if ((successor || gitIncident || gitSuccessor || boundedV7 || serial) && (command.tested_source_head === p.head ||
        materialSource && revisionEqual(command.record,focused.regression.after) && command.tested_source_head === materialSource)) {
      if (record.tested_source_head !== command.tested_source_head || record.command !== command.command || !revisionTime(record.finished_at) ||
          Date.parse(record.finished_at) <= Date.parse(completion.finished_at) || Date.parse(record.finished_at) > Date.parse(focused.finished_at))
        throw fail("revision_focused_remedy_invalid");
      testedFinalSource = true;
    }
  }
  if ((gitIncident || gitSuccessor || boundedV7 || serial) && !testedFinalSource) throw fail("revision_focused_remedy_invalid");
  if (boundedV7 && (changedInputs || !revisionEqual(focused.input_remedy_resources, []) ||
      !focused.implicated_paths.some(name => /^@@ /mu.test(git(["diff", "--no-ext-diff", "--no-textconv", "--ignore-all-space",
        "--ignore-blank-lines", prior.head, p.head, "--", name]).toString()))))
    throw fail("revision_material_remedy_required");
  if (boundedV7 && !materialSource) verifyGitSourceRepair(p, prior, focused, { git, parse, bytes, completedAt: completion.finished_at, retainedBefore, postPass, acquisition: !!acquisitionIncident });
  if (successor && (!testedFinalSource || !revisionEqual(focused.input_remedy_resources, []) ||
      !git(["diff", "--ignore-all-space", "--ignore-blank-lines", "--no-ext-diff", "--no-textconv", prior.head, p.head, "--", ...focused.implicated_paths]).length))
    throw fail("revision_focused_remedy_invalid");
  if (previousRevision && ((inputInvalidation || externalSettlement || retainedBefore || postPass ? focused.failed_phase !== null : !original.phases?.some(phase => phase.id === focused.failed_phase && phase.status === "failure")) ||
      typeof focused.diagnosis !== "string" || focused.diagnosis.length < 20 || focused.diagnosis.length > 4000)) throw fail("revision_failure_remedy_required");
  if (serial) verifySerialAggregateRemedy(p,prior,focused,{parse,bytes,git});
  if (serial && (changedInputs || !revisionEqual(focused.input_remedy_resources, []) ||
      !["scripts/project-experience-serial-budget.mjs","scripts/run-canonical-test-suite.mjs","scripts/run-local-canonical-verification.mjs"].every(name => focused.implicated_paths.includes(name)) ||
      focused.serial_envelope_sha256 !== PROJECT_EXPERIENCE_COMMITMENT || focused.failed_phase !== "e2e-project-experience"))
    throw fail("serial_focused_contract_invalid");
  return { serialIncident, original, prior, completion, inputs, source, focused, dependencySafety, externalSettlement, browserIncident, postPass, acquisitionIncident,
    retainedObservation: retainedBefore && JSON.parse(bytes(parse(focused.regression.after).stdout)) };
}
