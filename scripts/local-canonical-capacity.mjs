import { lstatSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  acquireCheckoutVerificationOwnership, assertCheckoutVerificationOwnership,
  releaseCheckoutVerificationOwnership, CHECKOUT_OWNER_FILE,
} from "./local-canonical-checkout-ownership.mjs";
import { ensureBoundedLocalDirectory, LOCAL_ARTIFACT_DIRECTORY } from "./local-canonical-environment.mjs";
import { verificationAnchorRoot } from "./local-canonical-verification-context.mjs";

export const VERIFICATION_CAPACITY_CONTRACT = "augnes.local-canonical-capacity.v1";
const leases = new WeakMap();
const fail = code => { throw Object.assign(new Error(code), { code }); };

// Admission bounds, not a throughput claim or a queue. Leave one host budget
// for the installed runtime/user. Existing per-phase deadlines stay unchanged.
export function verificationCapacityLimit(host) {
  return host.logical_cpu_count >= 10 && host.physical_memory_bytes >= 24 * 1024 ** 3 ? 2 : 1;
}

export function acquireVerificationCapacity({ context, host, invocationId }) {
  const anchor = verificationAnchorRoot(context);
  if (!/^[0-9a-f]{32}$/u.test(invocationId ?? "")) fail("verification_capacity_invocation_invalid");
  const limit = verificationCapacityLimit(host);
  const roots = Array.from({ length: 2 }, (_, index) => ensureBoundedLocalDirectory(anchor,
    path.join(anchor, LOCAL_ARTIFACT_DIRECTORY, "capacity", `slot-${index + 1}`)));
  // Reserve enough current free disk for every admitted lane's existing 15 GiB
  // budget. This is admission only; free memory/disk remain observable, fallible.
  if (host.disk_free_bytes_at_start < limit * 15 * 1024 ** 3) fail("verification_capacity_disk_insufficient");
  if (limit === 1 && readOwner(roots[1])) fail("verification_capacity_limit_conflict");
  let selected;
  for (const [index, root] of roots.slice(0, limit).entries()) {
    try {
      const owner = acquireCheckoutVerificationOwnership({ repositoryRoot: root });
      selected = { owner, root, slot: index + 1 }; break;
    } catch (error) {
      if (error.code !== "checkout_owner_busy") throw error;
    }
  }
  if (!selected) fail("verification_capacity_busy");
  const lease = Object.freeze({
    contract: VERIFICATION_CAPACITY_CONTRACT, limit, slot: selected.slot,
    invocation_id: invocationId, ownership_id: selected.owner.metadata.ownership_id,
    acquired_at: selected.owner.metadata.acquired_at,
    checkout_fingerprint: selected.owner.metadata.checkout_fingerprint,
  });
  leases.set(lease, { ...selected, roots, anchor });
  try { assertVerificationCapacity(lease); }
  catch (error) {
    releaseCheckoutVerificationOwnership(selected.owner, selected.root);
    leases.delete(lease); throw error;
  }
  return lease;
}

export function assertVerificationCapacity(lease) {
  const state = leases.get(lease);
  if (!state) fail("verification_capacity_not_owned");
  assertCheckoutVerificationOwnership(state.owner, state.root);
  const canonical = readOwner(state.anchor);
  // A pre-upgrade executor or handoff does not participate in these budgets.
  // Never infer it is idle or steal its owner: refuse unknown concurrent use.
  if (canonical && canonical.owner_pid !== process.pid && !state.roots.some(root => {
    const slot = readOwner(root);
    return slot?.owner_pid === canonical.owner_pid &&
      slot.owner_process_identity === canonical.owner_process_identity;
  })) fail("verification_unaccounted_canonical_owner");
  return true;
}

export function releaseVerificationCapacity(lease, { consumersSettled }) {
  const state = leases.get(lease);
  if (!state) fail("verification_capacity_not_owned");
  const result = releaseCheckoutVerificationOwnership(state.owner, state.root, { consumersSettled });
  leases.delete(lease);
  return result;
}

function readOwner(root) {
  const file = path.join(root, LOCAL_ARTIFACT_DIRECTORY, CHECKOUT_OWNER_FILE);
  const stat = lstatSync(file, { throwIfNoEntry: false });
  if (!stat) return null;
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || stat.size > 4096)
    fail("verification_capacity_owner_ambiguous");
  try {
    const value = JSON.parse(readFileSync(file, "utf8"));
    if (!Number.isSafeInteger(value.owner_pid) || !/^[0-9a-f]{64}$/u.test(value.owner_process_identity ?? ""))
      fail("verification_capacity_owner_ambiguous");
    return value;
  } catch { fail("verification_capacity_owner_ambiguous"); }
}
