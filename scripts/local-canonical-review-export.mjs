import { canonicalSerialize, assertPublicSafeReceipt, verifyReceiptIntegrity } from "./local-canonical-receipt.mjs";
import { digest } from "./local-canonical-inputs.mjs";

export const REVIEW_EXPORT_SCHEMA = "augnes.local-canonical-private-review.v1";
const pick = (value, names) => Object.fromEntries(names.filter(name => value?.[name] !== undefined).map(name => [name, value[name]]));
export function createPrivateReviewExport(receipt) {
  const integrity = verifyReceiptIntegrity(receipt);
  if (!integrity) throw new Error("review_export_original_invalid");
  assertPublicSafeReceipt(receipt);
  const value = {
    schema: REVIEW_EXPORT_SCHEMA, original_receipt_fingerprint: receipt.integrity.content_fingerprint,
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
      events: receipt.inputs.events.map(e => ({ resource: e.resource, disposition: e.disposition, observed_at: e.observed_at, identity: e.identity })),
      first_fault: receipt.inputs.first_fault, limitations: receipt.inputs.limitations } : null,
    attempt: receipt.attempt ? { ...pick(receipt.attempt, ["contract", "family_id", "attempt_id", "number", "head", "tree", "contract_fingerprint", "prior_attempt_id", "prior_receipt_fingerprint", "budget"]),
      repair: receipt.attempt.recovery ? pick(receipt.attempt.recovery, ["cause", "observed_code", "remedy", "evidence_sha256", "scope"]) : null } : null,
    phases: receipt.phases.map(p => ({ id: p.id, command: p.command, status: p.status, duration_ms: p.duration_ms,
      exit_status: p.exit_status, timed_out: p.timed_out, failure_code: p.failure_code,
      cleanup: pick(p.cleanup, ["completed", "remaining_owned_processes", "termination_reason", "exit_observed", "streams_closed", "listener_residue_count"]),
      browser_use: (p.browser_use ?? []).map(b => ({ contract: b.contract, executable_name: b.executable_name, location_fingerprint: b.location_fingerprint,
        before_sha256: b.before?.sha256 ?? null, after_sha256: b.after?.sha256 ?? null, actual_version: b.actual_version, unchanged: b.unchanged })) })),
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
  const copy = structuredClone(value); delete copy.export_fingerprint;
  let safe = true; try { assertPublicSafeReceipt(value); } catch { safe = false; }
  const valid = safe && value?.schema === REVIEW_EXPORT_SCHEMA && Object.keys(value).length === allowed.size && Object.keys(value).every(k => allowed.has(k)) &&
    [3, 4].includes(value.receipt_version) && Array.isArray(value.phases) && value.phases.length > 0 &&
    value.receipt_schema === "augnes.local-canonical-receipt.v1" &&
    /^[0-9a-f]{64}$/u.test(value.original_receipt_fingerprint ?? "") &&
    value.export_fingerprint === digest(canonicalSerialize(copy));
  return { structurally_valid: valid, deciding: false, independent_attestation: false,
    original_receipt_fingerprint: valid ? value.original_receipt_fingerprint : null };
}
