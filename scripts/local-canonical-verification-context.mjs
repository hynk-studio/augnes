import { createHash } from "node:crypto";
import { lstatSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { isMainThread, parentPort, Worker, workerData } from "node:worker_threads";
import { readProcessBirthIdentity } from "./local-process-ownership.mjs";
import { CHECKOUT_OWNER_FILE, CHECKOUT_OWNERSHIP_CONTRACT, checkoutVerificationFingerprint } from "./local-canonical-checkout-ownership.mjs";
import {
  CANONICAL_DARWIN_REPOSITORY_ROOT, CANONICAL_ORIGIN_URL,
  CANONICAL_REPOSITORY_ID, matchCanonicalRepositoryIdentity,
} from "./canonical-repository-identity.mjs";

export const VERIFICATION_CONTEXT_CONTRACT = "augnes.local-canonical-verification-context.v1";
const contexts = new WeakMap();
const fail = code => { throw Object.assign(new Error(code), { code }); };
const hash = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const inside = (root, entry) => entry === root || entry.startsWith(root + path.sep);

// Verification admission only. Installed/service identity retains its exact
// canonical root; no product consumer accepts this opt-in as adoption authority.
export function admitVerificationContext({
  repositoryRoot, kind = "canonical", platform = process.platform,
  canonicalRoot = CANONICAL_DARWIN_REPOSITORY_ROOT,
}) {
  const root = realpathSync(repositoryRoot);
  if (root !== path.resolve(repositoryRoot)) fail("verification_checkout_alias_refused");
  const origin = git(root, ["remote", "get-url", "origin"]);
  if (origin !== CANONICAL_ORIGIN_URL) fail("unauthorized_repository_origin");
  if (realpathSync(git(root, ["rev-parse", "--show-toplevel"])) !== root) fail("verification_checkout_root_mismatch");
  if (!["canonical", "isolated-worktree"].includes(kind)) fail("verification_context_invalid");
  let anchor = root;
  let common = realpathSync(path.resolve(root, git(root, ["rev-parse", "--git-common-dir"])));
  if (kind === "canonical") {
    matchCanonicalRepositoryIdentity({ resolvedRoot: root, originUrl: origin, platform });
  } else {
    if (platform !== "darwin") fail("isolated_verification_host_unsupported");
    anchor = realpathSync(canonicalRoot);
    if (anchor !== canonicalRoot || root === anchor || inside(anchor, root) || inside(root, anchor))
      fail("isolated_verification_checkout_not_distinct");
    if (realpathSync(git(anchor, ["rev-parse", "--show-toplevel"])) !== anchor ||
        git(anchor, ["remote", "get-url", "origin"]) !== CANONICAL_ORIGIN_URL)
      fail("isolated_verification_anchor_invalid");
    const anchorCommon = realpathSync(path.resolve(anchor, git(anchor, ["rev-parse", "--git-common-dir"])));
    if (anchorCommon !== path.join(anchor, ".git") || common !== anchorCommon)
      fail("isolated_verification_unregistered_checkout");
    const entry = path.join(root, ".git");
    const entryStat = lstatSync(entry);
    if (!entryStat.isFile() || entryStat.isSymbolicLink() || entryStat.nlink !== 1)
      fail("isolated_verification_git_entry_invalid");
    const gitDir = realpathSync(git(root, ["rev-parse", "--absolute-git-dir"]));
    if (path.dirname(gitDir) !== path.join(common, "worktrees") ||
        path.resolve(readFileSync(path.join(gitDir, "gitdir"), "utf8").trim()) !== entry)
      fail("isolated_verification_git_entry_invalid");
    const roots = git(anchor, ["worktree", "list", "--porcelain", "-z"])
      .split("\0").filter(line => line.startsWith("worktree ")).map(line => path.resolve(line.slice(9)));
    if (roots.filter(entry => entry === root).length !== 1 ||
        roots.some(entry => entry !== root && (inside(root, entry) || inside(entry, root))))
      fail("isolated_verification_unregistered_checkout");
    assertIsolatedMutableResources(root);
  }
  const context = Object.freeze({
    contract: VERIFICATION_CONTEXT_CONTRACT, kind,
    repository_id: CANONICAL_REPOSITORY_ID,
    admission: kind === "canonical" ? "fixed_canonical_root" : "registered_worktree_of_authorized_mac",
    anchor_fingerprint: physicalFingerprint(anchor),
    checkout_fingerprint: physicalFingerprint(root),
    git_common_fingerprint: physicalFingerprint(common),
  });
  contexts.set(context, { root, kind, platform, canonicalRoot });
  return context;
}

export function assertVerificationContext(context, repositoryRoot) {
  const options = contexts.get(context);
  if (!options || options.root !== repositoryRoot) fail("verification_context_not_owned");
  const observed = admitVerificationContext({ ...options, repositoryRoot });
  if (JSON.stringify(observed) !== JSON.stringify(context)) fail("verification_context_changed");
  return context;
}

export function verificationAnchorRoot(context) {
  const options = contexts.get(context);
  if (!options) fail("verification_context_not_owned");
  return context.kind === "canonical" ? options.root : options.canonicalRoot;
}

// Observe the accepted checkout with its own supported inspector. A candidate
// may add source files or raise runtime floors without adopting that candidate
// into the installed service. The inspector still binds the accepted checkout,
// configuration, executable and lifecycle before/after every observation.
export async function inspectVerificationCompanionPreservation(context, { freshTransport = false } = {}) {
  const options = contexts.get(context);
  if (!options) fail("verification_context_not_owned");
  assertVerificationContext(context, options.root);
  const repositoryRoot = verificationAnchorRoot(context);
  if (freshTransport) return readWithFreshTransport(repositoryRoot);
  return readAcceptedPreservation(repositoryRoot);
}

async function readAcceptedPreservation(repositoryRoot) {
  const source = path.join(repositoryRoot, "plugins/augnes-operator/mcp/companion-service-core.mjs");
  const stat = lstatSync(source);
  if (!stat.isFile() || stat.isSymbolicLink() || realpathSync(source) !== source)
    fail("companion_preservation_source_invalid");
  const { inspectCompanionPreservation } = await import(pathToFileURL(source).href);
  return inspectCompanionPreservation({ repositoryRoot });
}

// Synchronous input/ownership checks can leave an idle HTTP socket in the
// executor's fetch pool after its peer has closed it. Give a single accepted
// observation its own pool and event loop while the parent keeps monitoring.
async function readWithFreshTransport(repositoryRoot) {
  const worker = new Worker(new URL(import.meta.url), {
    workerData: { operation: "companion_preservation", repositoryRoot },
    execArgv: [],
  });
  let deadline;
  try {
    return await new Promise((resolve, reject) => {
      const unavailable = () => reject(Object.assign(new Error("verification_preservation_reader_unavailable"),
        { code: "verification_preservation_reader_unavailable" }));
      deadline = setTimeout(unavailable, 60_000);
      worker.once("message", resolve);
      worker.once("error", unavailable);
      worker.once("exit", unavailable);
    });
  } finally {
    clearTimeout(deadline);
    await worker.terminate();
  }
}

if (!isMainThread && workerData?.operation === "companion_preservation") {
  // Browser entry points also load this module through tsx's CommonJS loader.
  readAcceptedPreservation(workerData.repositoryRoot)
    .then(observation => parentPort.postMessage(observation))
    .catch(() => process.exit(1)); // The parent rejects an exit without a sample.
}

// A read-only cooperating-owner observation, not a global lock or service
// maintenance. A foreign/ambiguous owner is never reclaimed here.
export async function observeReviewedRevisionSettlementState(context) {
  const anchor = verificationAnchorRoot(context);
  const owners = () => {
    const roots = git(anchor, ["worktree", "list", "--porcelain", "-z"]).split("\0")
      .filter(line => line.startsWith("worktree ")).map(line => line.slice(9));
    roots.push(...[1, 2].map(i => path.join(anchor, ".augnes-local-verification", "capacity", `slot-${i}`)));
    const birth = readProcessBirthIdentity(process.pid), foreign = [];
    if (birth.state !== "present") fail("revision_settlement_process_unavailable");
    for (const root of roots) {
      const file = path.join(root, ".augnes-local-verification", CHECKOUT_OWNER_FILE), stat = lstatSync(file, { throwIfNoEntry: false });
      if (!stat) continue;
      if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || stat.size > 4096 || realpathSync(file) !== file ||
          (stat.mode & 0o022) || stat.uid !== process.getuid())
        fail("revision_settlement_owner_ambiguous");
      const owner = JSON.parse(readFileSync(file, "utf8"));
      if (owner.contract !== CHECKOUT_OWNERSHIP_CONTRACT || owner.repository_id !== CANONICAL_REPOSITORY_ID ||
          owner.checkout_fingerprint !== checkoutVerificationFingerprint(root) || !Number.isSafeInteger(owner.owner_pid) ||
          !/^[0-9a-f]{64}$/u.test(owner.owner_process_identity ?? "")) fail("revision_settlement_owner_ambiguous");
      if (owner.owner_pid !== process.pid || owner.owner_process_identity !== birth.identity) foreign.push({ root, ...owner });
    }
    return foreign;
  };
  const before = owners(), service = await inspectVerificationCompanionPreservation(context), after = owners();
  if (hash(before) !== hash(after)) fail("revision_settlement_owners_changed");
  return { observed_at: new Date().toISOString(), service, foreign_checkout_owners: after };
}

export function physicalFingerprint(entry) {
  const resolved = realpathSync(entry), stat = lstatSync(entry);
  if (resolved !== entry || stat.isSymbolicLink() || !stat.isDirectory()) fail("verification_unsafe_directory");
  return hash([VERIFICATION_CONTEXT_CONTRACT, resolved, String(stat.dev), String(stat.ino)]);
}

// Outer npm/build paths are not protected by child HOME isolation. Refuse
// external symlinks and hard links not fully contained in the audited mutable
// paths before touching them (npm legitimately links native binary pairs).
// Internal npm bin links are legitimate; all their targets stay in this lane.
export const ISOLATED_MUTABLE_PATHS = Object.freeze([
  "node_modules", ".next", "out", "build", "dist", "data", "outputs", "screenshots",
  "tsconfig.tsbuildinfo", "next-env.d.ts", ".augnes-local-verification", ".augnes-history",
  "apps/augnes_apps/node_modules", "apps/augnes_apps/dist", "apps/augnes_apps/build",
  "apps/web_planning/node_modules", "apps/web_planning/.next", "apps/web_planning/dist",
  "apps/web_planning/.wrangler", "apps/augnes_apps/.wrangler",
]);
export function assertIsolatedMutableResources(root) {
  const linkedFiles = new Map();
  for (const relative of ISOLATED_MUTABLE_PATHS) {
    const entry = path.join(root, relative);
    let ancestor = path.dirname(entry);
    while (ancestor !== root) {
      const stat = lstatSync(ancestor, { throwIfNoEntry: false });
      if (stat && (!stat.isDirectory() || stat.isSymbolicLink())) fail("isolated_resource_alias_refused");
      ancestor = path.dirname(ancestor);
    }
    const stat = lstatSync(entry, { throwIfNoEntry: false });
    if (stat?.isSymbolicLink()) fail("isolated_resource_alias_refused");
    inspect(entry);
  }
  for (const linked of linkedFiles.values())
    if (linked.observed !== linked.expected) fail("isolated_resource_alias_refused");
  for (const directory of [root, path.join(root, "apps/augnes_apps"), path.join(root, "apps/web_planning")]) {
    for (const name of readdirSync(directory))
      if (/^\.env(?:\.|$)/u.test(name) && name !== ".env.example") fail("isolated_environment_file_refused");
  }
  function inspect(entry) {
    const stat = lstatSync(entry, { throwIfNoEntry: false });
    if (!stat) return;
    if (stat.isSymbolicLink()) {
      let target;
      try { target = realpathSync(entry); } catch { fail("isolated_resource_alias_refused"); }
      if (!inside(root, target)) fail("isolated_resource_alias_refused");
    } else if (stat.isDirectory()) {
      for (const name of readdirSync(entry)) inspect(path.join(entry, name));
    } else if (!stat.isFile()) fail("isolated_resource_alias_refused");
    else if (stat.nlink !== 1) {
      const key = `${stat.dev}:${stat.ino}`;
      const linked = linkedFiles.get(key) ?? { expected: stat.nlink, observed: 0 };
      if (linked.expected !== stat.nlink) fail("isolated_resource_alias_refused");
      linked.observed++; linkedFiles.set(key, linked);
    }
  }
}

function git(root, args) {
  const result = spawnSync("git", ["--no-replace-objects", "-C", root, ...args], {
    encoding: "utf8", timeout: 30_000, maxBuffer: 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0 || result.error || result.signal) fail("verification_git_identity_unavailable");
  return result.stdout.trim();
}
