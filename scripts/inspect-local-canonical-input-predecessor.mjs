#!/usr/bin/env node
import path from "node:path";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { admitVerificationContext, verificationAnchorRoot } from "./local-canonical-verification-context.mjs";
import { inspectInputPredecessor } from "./local-canonical-input-requalification.mjs";
import { inspectInputContinuationAvailability } from "./local-canonical-attempts.mjs";
import { digest } from "./local-canonical-inputs.mjs";

// A source-first, read-only legacy intake. It does not create a proof, acquire a
// lease, reserve a continuation, authenticate a reviewer, or execute a phase.
export function inspectRetainedInputPredecessor({ repositoryRoot, receiptPath }) {
  const verification = admitVerificationContext({ repositoryRoot, kind: "isolated-worktree" });
  const anchorRoot = verificationAnchorRoot(verification);
  const { original, completion, original_bytes_sha256, attempt_record_sha256, completion_record_sha256 } = inspectInputPredecessor({ anchorRoot, repositoryRoot, receiptPath });
  const allowance = inspectInputContinuationAvailability({ anchorRoot, familyId: original.attempt.family_id });
  return { schema: "augnes.local-canonical-input-predecessor-intake.v1", status: "predecessor_eligible_for_prospective_review",
    invocation_eligible: false, admission_performed: false, reservation_performed: false, full_performed: false,
    predecessor: { head: original.repository.head_sha, tree: original.repository.tree_sha, base: original.repository.base_sha,
      family_id: original.attempt.family_id, attempt_id: original.attempt.attempt_id, record_contract: original.attempt.contract,
      receipt_fingerprint: original.integrity.content_fingerprint, receipt_bytes_sha256: original_bytes_sha256, attempt_record_sha256, completion_record_sha256,
      input_fingerprint: original.inputs.fingerprint, first_fault_fingerprint: digest(original.inputs.first_fault), disposition: original.outcome.disposition,
      phase_statuses: original.phases.map(p => ({ id: p.id, status: p.status })), settled_at: completion.finished_at },
    allowance, historical_writer: "UNKNOWN",
    remaining_requirements: ["complete retained log and input-byte review", "safe exact current input basis and explicit invocation authority", "fresh accepted main, exact reviewed integration and overlap preservation where applicable", "current source/toolchain/input safety and actual checkout/capacity admission", "independent infrastructure review and acceptance before real adoption"] };
}
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2), options = new Map();
    if (args.length !== 4) throw new Error("usage: --checkout ABSOLUTE_REGISTERED_WORKTREE --receipt REPOSITORY_RELATIVE_ORIGINAL");
    for (let i = 0; i < args.length; i += 2) {
      if (!["--checkout", "--receipt"].includes(args[i]) || options.has(args[i])) throw new Error("invalid_input_predecessor_options");
      options.set(args[i], args[i + 1]);
    }
    const repositoryRoot = options.get("--checkout");
    if (!path.isAbsolute(repositoryRoot) || realpathSync(repositoryRoot) !== repositoryRoot) throw new Error("input_predecessor_checkout_alias");
    console.log(JSON.stringify(inspectRetainedInputPredecessor({ repositoryRoot, receiptPath: options.get("--receipt") }), null, 2));
  } catch (e) { console.error(JSON.stringify({ status: "refused", code: e.code ?? e.message })); process.exitCode = 1; }
}
