import { isAnyCloseout, isCloseoutContinuation, isCloseoutScopeCorrection, isCloseoutInstructionReplacement, isCloseoutFixtureCorrection, isCloseoutCapabilityCorrection, isCloseoutScopeFixtureCorrection, usesCloseoutInstructionInputs, closeoutInstructionInputBinding, hasCloseoutMarker, validCloseoutAttempt } from "./local-canonical-1559-closeout.mjs";
import { COMPANION_TIMEOUT_SCHEMA, isCompanionTimeout, validCompanionTimeoutAttempt } from "./local-canonical-companion-timeout-succession.mjs";
import { GUIDE_CORRECTION_SCHEMA, isGuideCorrection, validGuideCorrectionAttempt } from "./local-canonical-guide-correction.mjs";
import { isObserverRepair, validObserverAttempt } from "./local-canonical-observer-succession.mjs";
import { TIMEOUT_REPAIR_SCHEMA, isCorrectedTimeout, validTimeoutAttempt } from "./local-canonical-timeout-succession.mjs";
import { CONDITION_REQUALIFICATION_SCHEMA, isConditionRequalification, validConditionRequalificationAttempt } from "./local-canonical-condition-requalification.mjs";
import { canonicalSerialize, assertPublicSafeReceipt, verifyReceiptIntegrity } from "./local-canonical-receipt.mjs";
import { digest, validInputFailureDiagnostics } from "./local-canonical-inputs.mjs";

import { isStrictBrowserSourceRevision } from "./local-canonical-browser-replacement.mjs";

export const REVIEW_EXPORT_SCHEMA = "augnes.local-canonical-private-review.v1";
const pick = (value, names) => Object.fromEntries(names.filter(name => value?.[name] !== undefined).map(name => [name, value[name]]));
export function createPrivateReviewExport(receipt) {
  if (![3, 4, 5].includes(receipt?.receipt_version)) throw new Error("review_export_version_unsupported");
  const integrity = verifyReceiptIntegrity(receipt);
  if (!integrity) throw new Error("review_export_original_invalid");
  if (!validInputFailureDiagnostics(receipt.inputs)) throw new Error("review_export_diagnostic_invalid");
  if (hasCloseoutMarker(receipt.attempt) && (receipt.receipt_version !== 4 || !validCloseoutAttempt(receipt.attempt))) throw new Error("review_export_closeout_invalid");
  if (usesCloseoutInstructionInputs(receipt.attempt?.source_correction)) {
    try { if (digest(closeoutInstructionInputBinding(receipt.attempt.source_correction, receipt.inputs, { requireUnfaulted: false })) !== digest(receipt.attempt.closeout_instruction_input)) throw new Error(); }
    catch { throw new Error("review_export_closeout_invalid"); }
  }
  assertPublicSafeReceipt(receipt);
  const value = {
    schema: receipt.receipt_version === 5 ? "augnes.local-canonical-private-review.v2" : REVIEW_EXPORT_SCHEMA, original_receipt_fingerprint: receipt.integrity.content_fingerprint,
    receipt_schema: receipt.schema, receipt_version: receipt.receipt_version,
    repository: pick(receipt.repository, ["repository_id", "origin", "base_sha", "head_sha", "tree_sha", "branch", "detached", "worktree_before", "worktree_after"]),
    executor: pick(receipt.executor, ["version", "source_files", "source_fingerprint", "scheduling", "resource_exclusive_phases"]),
    context: pick(receipt.verification_context, ["contract", "kind", "repository_id", "admission", "anchor_fingerprint", "checkout_fingerprint", "git_common_fingerprint"]),
    run: pick(receipt.run, ["id", "invocation_id", "started_at", "finished_at", "duration_ms"]),
    toolchain: { node: pick(receipt.environment.node, ["actual_version", "path_version", "canonical_version", "compatibility_range", "canonical_match", "compatibility_match"]), npm_version: receipt.environment.npm_version,
      operating_system: receipt.environment.operating_system, architecture: receipt.environment.architecture },
    inputs: receipt.inputs ? { contract: receipt.inputs.contract, fingerprint: receipt.inputs.fingerprint,
      path_kind: receipt.inputs.path_kind, binding: pick(receipt.inputs.binding, ["head", "tree", "executor_fingerprint", "phase_inventory", "phase_environment_fingerprints", "environment_keys", "authenticated_transport", "provider_policy"]),
      resources: receipt.inputs.resources.map(r => ({ id: r.id, classification: r.classification, excludePreferences: r.excludePreferences === true })),
      events: receipt.inputs.events.map(e => ({ resource: e.resource, disposition: e.disposition, observed_at: e.observed_at, identity: e.identity,
        ...(e.diagnostic === undefined ? {} : { diagnostic: { ...e.diagnostic } }) })),
      first_fault: receipt.inputs.first_fault, limitations: receipt.inputs.limitations } : null,
    ...(receipt.receipt_version === 5 ? { browser_input: receipt.browser_input, browser_guard: receipt.browser_guard } : {}),
    attempt: receipt.attempt ? { ...pick(receipt.attempt, ["contract", "family_id", "attempt_id", "number", "head", "tree", "contract_fingerprint", "prior_attempt_id", "prior_receipt_fingerprint", "budget", "input_replacement_consumed"]),
      source_correction: isAnyCloseout(receipt.attempt.source_correction) ? closeoutProofExport(receipt.attempt.source_correction) : isCompanionTimeout(receipt.attempt.source_correction) ? companionProofExport(receipt.attempt.source_correction) : isGuideCorrection(receipt.attempt.source_correction) ? guideProofExport(receipt.attempt.source_correction) : isConditionRequalification(receipt.attempt.source_correction) ? conditionProofExport(receipt.attempt.source_correction) : isCorrectedTimeout(receipt.attempt.source_correction) ? timeoutProofExport(receipt.attempt.source_correction) : isObserverRepair(receipt.attempt.source_correction) ? observerProofExport(receipt.attempt.source_correction) : receipt.attempt.source_correction ? pick(receipt.attempt.source_correction, ["schema", "kind", "defect", "prior_family_id", "prior_attempt_id", "prior_receipt_fingerprint", "head", "tree", "source_module", "fixture_sha256", "accepted_main", "review", "browser_input_path", "browser_input_sha256", "input_replacement_consumed", "authorization"]) : null,
      ...(isAnyCloseout(receipt.attempt.source_correction) ? { branch: receipt.attempt.branch,
        closeout_authority: { closeout_scope: pick(receipt.attempt.closeout_authority?.closeout_scope, ["id", "author", "author_id", "body_sha256", "timestamp", "role", "commit_id"]) } } : {}),
      ...(usesCloseoutInstructionInputs(receipt.attempt.source_correction) ? { closeout_instruction_input: pick(receipt.attempt.closeout_instruction_input, ["contract", "path_kind", "fingerprint", "head", "tree", "resource", "classification", "location_fingerprint", "sha256", "bytes", "identity_fingerprint"]) } : {}),
      ...(isGuideCorrection(receipt.attempt.source_correction) ? { branch: receipt.attempt.branch, guide_authority: receipt.attempt.guide_authority } : {}),
      ...(isObserverRepair(receipt.attempt.source_correction) ? { observer_authority: receipt.attempt.observer_authority } : {}),
      ...(isCompanionTimeout(receipt.attempt.source_correction) ? { companion_timeout_authority: receipt.attempt.companion_timeout_authority } : {}),
      ...(isCorrectedTimeout(receipt.attempt.source_correction) ? { timeout_authority: receipt.attempt.timeout_authority } : {}),
      ...(isConditionRequalification(receipt.attempt.source_correction) ? { condition_authority: receipt.attempt.condition_authority,
        condition_requalification_consumed: receipt.attempt.condition_requalification_consumed } : {}),
      ...(receipt.receipt_version === 5 ? { browser_replacement: receipt.attempt.browser_replacement, browser_authority: receipt.attempt.browser_authority } : {}),
      repair: receipt.attempt.recovery ? pick(receipt.attempt.recovery, ["cause", "observed_code", "remedy", "evidence_sha256", "scope"]) : null } : null,
    phases: receipt.phases.map(p => ({ id: p.id, command: p.command, status: p.status, duration_ms: p.duration_ms,
      exit_status: p.exit_status, timed_out: p.timed_out, failure_code: p.failure_code,
      cleanup: pick(p.cleanup, ["completed", "remaining_owned_processes", "termination_reason", "exit_observed", "streams_closed", "listener_residue_count"]),
      browser_use: (p.browser_use ?? []).map(b => ({ contract: b.contract, consumer: b.consumer, disposition: b.disposition, runtime_versions: b.runtime_versions, executable_name: b.executable_name, location_fingerprint: b.location_fingerprint,
        before_sha256: b.before?.sha256 ?? null, after_sha256: b.after?.sha256 ?? null, actual_version: b.actual_version, unchanged: b.unchanged, ...(b.contract === "augnes.local-canonical-browser-use.v3" ? pick(b, ["browser_input_fingerprint", "cli_version", "bundle_before", "bundle_after"]) : {}) })) })),
    outcome: receipt.outcome ? pick(receipt.outcome, ["disposition", "execution", "validity", "safety", "applicability_at_admission"]) : null,
    cleanup: { completed: receipt.cleanup.completed, remaining_owned_processes: receipt.cleanup.remaining_owned_processes,
      companion_restored: receipt.cleanup.companion_service.restored }, final: pick(receipt.final, ["result", "exit_status", "reason_codes"]),
    limitations: ["derived sanitized export, not original receipt bytes or independent attestation", "off-host review is structural only; local context-bound stock validation remains required", "no credential contents or complete global configuration projection included"] };
  // Never copy arbitrary log/config/environment fields into a review export.
  assertPublicSafeReceipt(value);
  return { ...value, export_fingerprint: digest(canonicalSerialize(value)) };
}

export function inspectPrivateReviewExport(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { structurally_valid: false, deciding: false, independent_attestation: false, original_receipt_fingerprint: null };
  const allowed = new Set(["schema", "original_receipt_fingerprint", "receipt_schema", "receipt_version", "repository", "executor", "context", "run", "toolchain", "inputs", "attempt", "phases", "outcome", "cleanup", "final", "limitations", "export_fingerprint"]);
  if (value.schema === "augnes.local-canonical-private-review.v2") { allowed.add("browser_input"); allowed.add("browser_guard"); }
  const copy = structuredClone(value); delete copy.export_fingerprint;
  let safe = true; try { assertPublicSafeReceipt(value); } catch { safe = false; }
  const closeoutValid = hasCloseoutMarker(value.attempt) ? validCloseoutAttempt(value.attempt) && value.receipt_version === 4 &&
    (!usesCloseoutInstructionInputs(value.attempt?.source_correction) || (value.inputs?.fingerprint === value.attempt.contract_fingerprint && value.inputs?.binding?.head === value.attempt.head && value.inputs?.binding?.tree === value.attempt.tree)) : true;
  const observerValid = value.attempt?.source_correction?.schema === "augnes.local-canonical-source-correction.v3" || value.attempt?.observer_authority ? validObserverAttempt(value.attempt) && value.receipt_version === 4 : true;
  const timeoutValid = value.attempt?.source_correction?.schema === TIMEOUT_REPAIR_SCHEMA || value.attempt?.timeout_authority ? validTimeoutAttempt(value.attempt) && value.receipt_version === 4 : true;
  const companionValid = value.attempt?.source_correction?.schema === COMPANION_TIMEOUT_SCHEMA || value.attempt?.source_correction?.kind === "companion_readiness_timeout" || value.attempt?.companion_timeout_authority || value.attempt?.companion_timeout_consumed ? validCompanionTimeoutAttempt(value.attempt) && value.receipt_version === 4 : true;
  const conditionValid = value.attempt?.source_correction?.schema === CONDITION_REQUALIFICATION_SCHEMA || value.attempt?.source_correction?.kind === "condition_requalification" || value.attempt?.condition_authority || value.attempt?.condition_requalification_consumed ? validConditionRequalificationAttempt(value.attempt) && value.receipt_version === 4 : true;
  const guideValid = value.attempt?.source_correction?.schema === GUIDE_CORRECTION_SCHEMA || value.attempt?.source_correction?.kind === "guide_cancellation_correction" || value.attempt?.guide_authority ? validGuideCorrectionAttempt(value.attempt) && value.receipt_version === 4 : true;
  const valid = closeoutValid && companionValid && guideValid && conditionValid && timeoutValid && observerValid && safe && validInputFailureDiagnostics(value.inputs, { exported: true }) && (value?.schema === REVIEW_EXPORT_SCHEMA || value?.schema === "augnes.local-canonical-private-review.v2") && Object.keys(value).length === allowed.size && Object.keys(value).every(k => allowed.has(k)) &&
    ([3, 4].includes(value.receipt_version) ? value.schema === REVIEW_EXPORT_SCHEMA : value.receipt_version === 5 && value.schema === "augnes.local-canonical-private-review.v2" && value.browser_input?.contract === "augnes.local-canonical-browser-input.v1" && (value.attempt?.browser_replacement?.contract === "augnes.local-canonical-browser-replacement.v1" || (isStrictBrowserSourceRevision(value.attempt?.source_correction) && value.attempt.input_replacement_consumed === true && value.attempt.source_correction.browser_input_sha256 === digest(value.browser_input)))) && Array.isArray(value.phases) && value.phases.length > 0 &&
    value.receipt_schema === "augnes.local-canonical-receipt.v1" &&
    /^[0-9a-f]{64}$/u.test(value.original_receipt_fingerprint ?? "") &&
    value.export_fingerprint === digest(canonicalSerialize(copy));
  return { structurally_valid: valid, deciding: false, independent_attestation: false,
    original_receipt_fingerprint: valid ? value.original_receipt_fingerprint : null };
}

function observerProofExport(p) {
  // Only the bound identifiers needed for independent review, never arbitrary
  // proof properties, original receipt bodies, review text or local file paths.
  return { ...pick(p, ["schema", "kind", "defect", "head", "tree", "base", "prior_family_id", "prior_number", "prior_attempt_id", "prior_receipt_fingerprint", "delta_sha256", "fixture_sha256", "environment_fingerprint", "pull_request", "budget"]),
    repair: { ...pick(p.repair, ["head", "tree", "delta_sha256"]), review: pick(p.repair?.review, ["id", "sha256"]) },
    originals: Object.fromEntries(["receipt", "attempt", "completion"].map(k => [k, pick(p.originals?.[k], ["sha256"])])),
    before: pick(p.before, ["sha256", "source_sha256"]), after: pick(p.after, ["sha256", "source_sha256"]),
    authorization: pick(p.authorization, ["review_id", "review_sha256", "grant_comment_id", "grant_sha256"]) };
}

function timeoutProofExport(p) {
  return { ...pick(p, ["schema", "kind", "defect", "head", "tree", "base", "prior_family_id", "prior_number", "prior_attempt_id", "prior_receipt_fingerprint", "delta_sha256", "fixture_sha256", "environment_fingerprint", "pull_request", "budget"]),
    repair: { ...pick(p.repair, ["head", "tree", "delta_sha256"]), review: pick(p.repair?.review, ["id", "sha256"]) },
    originals: Object.fromEntries(["receipt", "attempt", "completion"].map(k => [k, pick(p.originals?.[k], ["sha256"])])),
    timeout: { ...pick(p.timeout, ["phase", "label", "budget_ms", "historical_cause"]), log: pick(p.timeout?.log, ["sha256"]) },
    final_delta: pick(p.final_delta, ["basis", "delta_sha256", "changed_paths"]),
    before: pick(p.before, ["sha256", "source_sha256"]), after: pick(p.after, ["sha256", "source_sha256"]),
    authorization: pick(p.authorization, ["grant_comment_id", "grant_sha256"]) };
}

function companionProofExport(p) {
  const hash = ref => pick(ref, ["sha256"]);
  const state = value => pick(value, ["present", "mode", "type", "object", "sha256"]);
  const scope = p.source_scope;
  return { ...pick(p, ["schema", "kind", "defect", "head", "tree", "base", "prior_family_id", "prior_number", "prior_attempt_id", "prior_receipt_fingerprint", "source_module", "delta_sha256", "pull_request", "budget", "limitations"]),
    source_scope: scope ? { ...pick(scope, ["schema", "basis", "accepted_base", "accepted_head", "current_main", "accepted_task_paths", "candidate_delta_paths", "policy_delta_paths"]),
      accepted_task: scope.accepted_task?.map(row => ({ ...pick(row, ["path"]), accepted: state(row.accepted), candidate: state(row.candidate) })),
      main_reconciliation: scope.main_reconciliation?.map(row => ({ ...pick(row, ["path", "rule"]), accepted_main: state(row.accepted_main), candidate: state(row.candidate) })) } : null,
    repair: { ...pick(p.repair, ["head", "tree", "delta_sha256"]), review: pick(p.repair?.review, ["id", "sha256"]),
      accepted_review: pick(p.repair?.accepted_review, ["reviewed_at", "source_url", "block_id", "block_sha256"]) },
    originals: Object.fromEntries(["receipt", "attempt", "completion", "unit_log"].map(k => [k, hash(p.originals?.[k])])),
    retained_sources: pick(p.retained_sources, ["scripts/test-companion-ownership-retirement.mjs"]),
    timeout: pick(p.timeout, ["phase", "label", "budget_ms", "historical_cause", "original_blocked_operation"]),
    final_delta: pick(p.final_delta, ["basis", "delta_sha256", "changed_paths"]),
    evidence: { fixture: hash(p.evidence?.fixture), launcher: hash(p.evidence?.launcher),
      before: Object.fromEntries(["source", "log", "settlement"].map(k => [k, hash(p.evidence?.before?.[k])])),
      after: Object.fromEntries(["source", "log", "settlement"].map(k => [k, hash(p.evidence?.after?.[k])])),
      focused: Object.fromEntries(["log", "settlement"].map(k => [k, hash(p.evidence?.focused?.[k])])) },
    authorization: pick(p.authorization, ["policy_review_id", "policy_review_sha256", "grant_comment_id", "grant_sha256"]) };
}

function conditionProofExport(p) {
  // Retained byte identities and prospective authority, not a claimed repair
  // or independent exact-source review. Original logs/archive stay private.
  return { ...pick(p, ["schema", "kind", "branch", "base", "head", "tree", "prior_family_id", "prior_number", "prior_attempt_id", "prior_receipt_fingerprint", "pull_request", "budget"]),
    condition: pick(p.condition, ["phase", "subphase", "failure", "predicate", "condition_ms", "child_ms", "historical_cause"]),
    originals: Object.fromEntries(["receipt", "attempt", "completion", "log", "result"].map(k => [k, pick(p.originals?.[k], ["sha256"])])),
    diagnosis: { ...pick(p.diagnosis, ["head", "tree"]), archive: pick(p.diagnosis?.archive, ["sha256"]), review: pick(p.diagnosis?.review, ["id", "sha256"]) },
    final_source: pick(p.final_source, ["sha256"]), authorization: pick(p.authorization, ["grant_comment_id", "grant_sha256"]) };
}

function guideProofExport(p) {
  // The accepted repair and prospective implementation authority stay distinct.
  // Raw original logs, packet members and local artifact names remain private.
  return { ...pick(p, ["schema", "kind", "branch", "base", "head", "tree", "prior_family_id", "prior_number", "prior_attempt_id", "prior_receipt_fingerprint", "pull_request", "budget"]),
    originals: Object.fromEntries(["receipt", "attempt", "completion", "edge", "log", "extraction", "result"].map(k => [k, pick(p.originals?.[k], ["sha256"])])),
    repair: { ...pick(p.repair, ["head", "tree"]), archive: pick(p.repair?.archive, ["sha256"]), review: pick(p.repair?.review, ["id", "sha256"]) },
    comparison: { ...Object.fromEntries(["before", "after", "summary", "completion", "interpretation_correction", "fixture"].map(k => [k, pick(p.comparison?.[k], ["sha256"])])), finished_at: p.comparison?.finished_at },
    final_source: pick(p.final_source, ["sha256"]), authorization: pick(p.authorization, ["grant_comment_id", "grant_sha256"]) };
}

function closeoutProofExport(p) {
  // This is a hash/identity projection for review, not the original private
  // evidence, authenticated authorization or an independent final-source audit.
  const hash = ref => pick(ref, ["sha256"]);
  const state = value => pick(value, ["present", "mode", "type", "object", "sha256"]);
  const scope = p.source_scope;
  if (isCloseoutFixtureCorrection(p) || isCloseoutCapabilityCorrection(p) || isCloseoutScopeFixtureCorrection(p)) return {
    ...pick(p, ["schema", "kind", "pull_request", "branch", "base", "head", "tree", "prior_family_id", "prior_number", "prior_attempt_id", "prior_receipt_fingerprint", "budget"]),
    originals: Object.fromEntries(["receipt", "attempt", "completion", "edge", "authority_log", "stock", "stock_log"].map(k => [k, hash(p.originals?.[k])])),
    predecessor_proof: hash(p.predecessor_proof), correction: { manifest: hash(p.correction?.manifest), retained: p.correction?.retained?.map(ref => pick(ref, ["path", "sha256"])) },
    source_scope: scope ? { ...pick(scope, ["schema", "basis", "accepted_base", "accepted_head", "current_main", "accepted_task_paths", "candidate_delta_paths", "policy_delta_paths"]),
      accepted_task: scope.accepted_task?.map(row => ({ path: row.path, accepted: state(row.accepted), candidate: state(row.candidate) })),
      candidate_policy: scope.candidate_policy?.map(row => ({ path: row.path, candidate: state(row.candidate) })),
      main_reconciliation: scope.main_reconciliation?.map(row => ({ ...pick(row, ["path", "rule"]), accepted_main: state(row.accepted_main), candidate: state(row.candidate) })) } : null,
    final_source: hash(p.final_source), authorization: pick(p.authorization, ["scope_comment_id", "scope_sha256"]),
  };
  if (isCloseoutInstructionReplacement(p)) return {
    ...pick(p, ["schema", "kind", "pull_request", "branch", "base", "head", "tree", "prior_family_id", "prior_number", "prior_attempt_id", "prior_receipt_fingerprint", "budget"]),
    originals: Object.fromEntries(["receipt", "attempt", "completion", "edge", "unit_log", "stock", "stock_log"].map(k => [k, hash(p.originals?.[k])])),
    predecessor_proof: hash(p.predecessor_proof),
    instruction: Object.fromEntries(["before", "after", "delta", "provenance"].map(k => [k, hash(p.instruction?.[k])])),
    source_scope: scope ? { ...pick(scope, ["schema", "basis", "accepted_base", "accepted_head", "current_main", "accepted_task_paths", "candidate_delta_paths", "policy_delta_paths"]),
      accepted_task: scope.accepted_task?.map(row => ({ path: row.path, accepted: state(row.accepted), candidate: state(row.candidate) })),
      candidate_policy: scope.candidate_policy?.map(row => ({ path: row.path, candidate: state(row.candidate) })),
      main_reconciliation: scope.main_reconciliation?.map(row => ({ ...pick(row, ["path", "rule"]), accepted_main: state(row.accepted_main), candidate: state(row.candidate) })) } : null,
    final_source: hash(p.final_source), authorization: pick(p.authorization, ["scope_comment_id", "scope_sha256"]),
  };
  if (isCloseoutScopeCorrection(p)) return {
    ...pick(p, ["schema", "kind", "pull_request", "branch", "base", "head", "tree", "prior_family_id", "prior_number", "prior_attempt_id", "prior_receipt_fingerprint", "budget"]),
    originals: Object.fromEntries(["receipt", "attempt", "completion", "edge", "authority_log", "stock", "stock_log"].map(k => [k, hash(p.originals?.[k])])),
    predecessor_proof: hash(p.predecessor_proof),
    correction: { ...Object.fromEntries(["mechanism_before", "mechanism_after", "native_delta", "observations"].map(k => [k, hash(p.correction?.[k])])),
      retained: p.correction?.retained?.map(ref => pick(ref, ["path", "sha256"])) },
    source_scope: scope ? { ...pick(scope, ["schema", "basis", "accepted_base", "accepted_head", "current_main", "accepted_task_paths", "candidate_delta_paths", "policy_delta_paths"]),
      accepted_task: scope.accepted_task?.map(row => ({ path: row.path, accepted: state(row.accepted), candidate: state(row.candidate) })),
      candidate_policy: scope.candidate_policy?.map(row => ({ path: row.path, candidate: state(row.candidate) })),
      main_reconciliation: scope.main_reconciliation?.map(row => ({ ...pick(row, ["path", "rule"]), accepted_main: state(row.accepted_main), candidate: state(row.candidate) })) } : null,
    final_source: hash(p.final_source), authorization: pick(p.authorization, ["scope_comment_id", "scope_sha256"]),
  };
  if (isCloseoutContinuation(p)) return {
    ...pick(p, ["schema", "kind", "pull_request", "branch", "base", "head", "tree", "prior_family_id", "prior_number", "prior_attempt_id", "prior_receipt_fingerprint", "budget"]),
    originals: Object.fromEntries(["receipt", "attempt", "completion", "edge", "unit_log", "stock", "stock_log"].map(k => [k, hash(p.originals?.[k])])),
    initial_proof: hash(p.initial_proof),
    correction: { source_hashes: p.correction?.source_hashes,
      evidence: Object.fromEntries(Object.entries(p.correction?.evidence ?? {}).map(([key, ref]) => [key, hash(ref)])) },
    source_scope: scope ? { ...pick(scope, ["schema", "basis", "accepted_base", "accepted_head", "current_main", "accepted_task_paths", "candidate_delta_paths", "policy_delta_paths"]),
      accepted_task: scope.accepted_task?.map(row => ({ path: row.path, accepted: state(row.accepted), candidate: state(row.candidate) })),
      candidate_policy: scope.candidate_policy?.map(row => ({ path: row.path, candidate: state(row.candidate) })),
      main_reconciliation: scope.main_reconciliation?.map(row => ({ ...pick(row, ["path", "rule"]), accepted_main: state(row.accepted_main), candidate: state(row.candidate) })),
      correction_source: scope.correction_source?.map(row => ({ path: row.path, before: state(row.before), candidate: state(row.candidate) })) } : null,
    final_source: hash(p.final_source), authorization: pick(p.authorization, ["scope_comment_id", "scope_sha256"]),
  };
  return { ...pick(p, ["schema", "kind", "pull_request", "branch", "base", "head", "tree", "prior_family_id", "prior_number", "prior_attempt_id", "prior_receipt_fingerprint", "budget"]),
    originals: Object.fromEntries(["receipt", "attempt", "completion", "edge", "unit_log", "stock", "stock_log"].map(k => [k, hash(p.originals?.[k])])),
    repair: { ...pick(p.repair, ["head", "tree"]),
      accepted_review: pick(p.repair?.accepted_review, ["source_url", "block_id", "block_sha256", "reviewed_at", "sha256"]),
      ...Object.fromEntries(["manifest", "source_bindings", "native_delta", "full_pr_delta", "comparison"].map(k => [k, hash(p.repair?.[k])])),
      retained: p.repair?.retained?.map(ref => pick(ref, ["path", "sha256"])) },
    source_scope: scope ? { ...pick(scope, ["schema", "basis", "accepted_base", "accepted_head", "current_main", "accepted_task_paths", "candidate_delta_paths", "policy_delta_paths"]),
      accepted_task: scope.accepted_task?.map(row => ({ path: row.path, accepted: state(row.accepted), candidate: state(row.candidate) })),
      candidate_policy: scope.candidate_policy?.map(row => ({ path: row.path, candidate: state(row.candidate) })),
      main_reconciliation: scope.main_reconciliation?.map(row => ({ ...pick(row, ["path", "rule"]), accepted_main: state(row.accepted_main), candidate: state(row.candidate) })) } : null,
    final_source: hash(p.final_source), authorization: pick(p.authorization, ["scope_comment_id", "scope_sha256"]) };
}
