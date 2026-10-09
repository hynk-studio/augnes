import { createHash } from "node:crypto";
import { chmodSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import { MIGRATED_HISTORICAL_EVIDENCE_ROOT } from "./canonical-historical-evidence.mjs";
import { assertVerificationContext, verificationAnchorRoot, physicalFingerprint } from "./local-canonical-verification-context.mjs";
import { assertCheckoutVerificationOwnership } from "./local-canonical-checkout-ownership.mjs";
import { createCanonicalTestResourceDirectory, beginCanonicalTestResourceUse, settleCanonicalTestResourceUse, cleanupCanonicalTestResources } from "./canonical-test-environment.mjs";

export const HISTORICAL_INPUT_CONTRACT = "augnes.local-canonical-historical-inputs.v1";
// Actual archived inputs of the authority suite. No active .augnes-lab state,
// old receipts, user WIP, production databases or other archive is copied.
export const HISTORICAL_INPUT_PATHS = Object.freeze([
  ".augnes-lab/operational-reentry-matched-cohorts/operational-reentry-cohort_48331280ed7ead6dbad2d12105208dfb/issue-185",
  ".augnes-lab/operational-reentry-provider-probes/operational-reentry-provider-probe_724ed8fce6d30d0979efd6bf837a3edc/issue-193",
  ".augnes-lab/operational-reentry-matched-cohort-replacements/operational-reentry-replacement-cohort_d3136fe392e130ba74f67349686a91d9/issue-199",
  ".augnes-lab/operational-reentry-clean-control-provider-probes/operational-reentry-clean-control-provider-probe_9b197e054fab24139b511d4a1e6a4bde/issue-208",
  ".augnes-lab/operational-reentry-parser-closed-provider-probes/operational-reentry-parser-closed-provider-probe_154650381bef68202a998f1b6770513c/issue-216",
  ".augnes-lab/operational-reentry-clean-control-provider-probes/authorization-consumptions",
  ".augnes-lab/operational-reentry-parser-closed-provider-probes/authorization-consumptions",
]);
const snapshots = new WeakMap();
const fail = code => { throw Object.assign(new Error(code), { code }); };
const digest = value => createHash("sha256").update(value).digest("hex");

function scan(root, destination = null) {
  if (realpathSync(root) !== root) fail("historical_input_alias_refused");
  const entries = [];
  let files = 0, bytes = 0;
  const visit = relative => {
    const entry = path.join(root, relative), stat = lstatSync(entry);
    if (stat.isSymbolicLink() || realpathSync(entry) !== entry) fail("historical_input_alias_refused");
    if (stat.isDirectory()) {
      entries.push([relative, "directory"]);
      if (destination) mkdirSync(path.join(destination, relative), { recursive: true, mode: 0o700 });
      for (const name of readdirSync(entry).sort()) visit(path.posix.join(relative, name));
    } else if (stat.isFile() && stat.nlink === 1) {
      const content = readFileSync(entry);
      entries.push([relative, content.length, digest(content)]); files++; bytes += content.length;
      if (destination) writeFileSync(path.join(destination, relative), content, { flag: "wx", mode: 0o400 });
    } else fail("historical_input_alias_refused");
  };
  for (const relative of HISTORICAL_INPUT_PATHS) visit(relative);
  return { content_fingerprint: digest(JSON.stringify(entries)), file_count: files, byte_count: bytes };
}

export function prepareHistoricalInputs({ context, repositoryRoot, checkoutOwner, invocationId }) {
  assertVerificationContext(context, repositoryRoot);
  assertCheckoutVerificationOwnership(checkoutOwner, repositoryRoot);
  if (context.kind !== "isolated-worktree") fail("historical_input_context_invalid");
  const source = path.join(verificationAnchorRoot(context), MIGRATED_HISTORICAL_EVIDENCE_ROOT);
  const sourceFingerprint = physicalFingerprint(source);
  const before = scan(source);
  const owner = createCanonicalTestResourceDirectory(path.join(repositoryRoot, ".augnes-history"));
  try {
    const destination = path.join(repositoryRoot, MIGRATED_HISTORICAL_EVIDENCE_ROOT);
    mkdirSync(destination, { recursive: true, mode: 0o700 });
    const copied = scan(source, destination);
    if (JSON.stringify(before) !== JSON.stringify(copied) || JSON.stringify(before) !== JSON.stringify(scan(destination)))
      fail("historical_input_changed");
    const freeze = directory => {
      for (const name of readdirSync(directory)) {
        const child = path.join(directory, name);
        if (lstatSync(child).isDirectory()) freeze(child);
      }
      chmodSync(directory, 0o500);
    };
    freeze(owner.root);
    const snapshot = Object.freeze({ contract: HISTORICAL_INPUT_CONTRACT, invocation_id: invocationId,
      anchor_fingerprint: context.anchor_fingerprint, source_fingerprint: sourceFingerprint, ...before });
    snapshots.set(snapshot, { owner, source, destination, context, repositoryRoot, checkoutOwner });
    beginCanonicalTestResourceUse(owner);
    return snapshot;
  } catch (error) {
    const [cleanup] = cleanupCanonicalTestResources([owner]);
    throw Object.assign(error, { historicalInputCleanup: {
      completed: cleanup.completed, failures: cleanup.failures, unchanged: false,
    } });
  }
}

export function finishHistoricalInputs(snapshot, { consumersSettled }) {
  const state = snapshots.get(snapshot);
  if (!state) fail("historical_input_not_owned");
  assertVerificationContext(state.context, state.repositoryRoot);
  assertCheckoutVerificationOwnership(state.checkoutOwner, state.repositoryRoot);
  let unchanged = false, failure = null;
  try {
    unchanged = physicalFingerprint(state.source) === snapshot.source_fingerprint &&
      scan(state.source).content_fingerprint === snapshot.content_fingerprint &&
      scan(state.destination).content_fingerprint === snapshot.content_fingerprint;
    if (!unchanged) failure = "historical_input_changed";
  } catch (error) { failure = error.code ?? "historical_input_unavailable"; }
  if (consumersSettled) settleCanonicalTestResourceUse(state.owner, {
    exit_observed: true, streams_closed: true, cleanup_completed: true, remaining_owned_processes: 0,
  });
  const [cleanup] = cleanupCanonicalTestResources([state.owner]);
  if (cleanup.completed) snapshots.delete(snapshot);
  return { unchanged, completed: cleanup.completed, failures: [...(failure ? [failure] : []), ...cleanup.failures] };
}
