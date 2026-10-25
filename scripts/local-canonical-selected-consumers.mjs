import { createHash } from "node:crypto";
import { lstatSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const SELECTED_CONSUMER_CONTRACT = "augnes.local-canonical-selected-consumers.v1";
export const SELECTED_CONSUMER_MANIFEST = "scripts/local-canonical-selected-consumers.v1.json";
const implementationRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hash = value => createHash("sha256").update(typeof value === "string" || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest("hex");
const fail = code => { throw Object.assign(new Error(code), { code }); };

// This is a bounded source-audit fence for this specific selected workload. It
// is not a sandbox or a general dependency/configuration registry. Dynamic test
// imports make a narrower literal-import graph incomplete, so the bounded
// repository source inventory is conservatively bound. Refresh is an explicit
// source-review action; execution and stock never rewrite the accepted map.
export const SELECTED_CONSUMER_ROOTS = Object.freeze(["."]);
export const SELECTED_CONSUMER_ROOT_FILES = Object.freeze([]);
const generated = [".git", ".augnes-local-verification", ".augnes-history", ".augnes-lab", ".codex-attachments",
  "node_modules", ".next", "out", "build", "dist", "outputs", "screenshots", "next-env.d.ts", "tsconfig.tsbuildinfo", "native/windows-x64",
  "apps/augnes_apps/node_modules", "apps/augnes_apps/dist", "apps/augnes_apps/build", "apps/augnes_apps/.wrangler",
  "apps/web_planning/node_modules", "apps/web_planning/.next", "apps/web_planning/dist", "apps/web_planning/.wrangler"];
export const SELECTED_CONSUMER_OWNERS = Object.freeze({
  controller: ["scripts/run-local-canonical-verification.mjs", "scripts/local-canonical-environment.mjs", "scripts/local-canonical-selected-execution.mjs", "scripts/local-canonical-selected-git.mjs", "scripts/local-canonical-selected-consumers.mjs"],
  source_reads: ["scripts/canonical-change-planner.mjs", "scripts/canonical-revision-reader.mjs", "scripts/local-canonical-verification-context.mjs", "scripts/local-canonical-integration-base.mjs", "scripts/local-canonical-attempts.mjs", "scripts/validate-canonical-docs-change.mjs", "lib/vnext/repository-execution/worktree-observation.ts"],
  dependency_and_descendants: ["scripts/local-canonical-isolated-resources.mjs", "scripts/local-canonical-selected-shell.mjs", "scripts/local-canonical-selected-python.mjs", "scripts/canonical-test-environment.mjs", "scripts/canonical-child-runner.mjs", "scripts/run-canonical-test-suite.mjs", "scripts/runtime-child-environment.mjs", "scripts/build-with-isolated-db.mjs", "scripts/augnes-runtime-supervisor-core.mjs"],
  browser: ["scripts/local-canonical-browser-identity.mjs", "scripts/browser-validate-project-experience-v1.mjs", "scripts/browser-validate-continuity-v1.mjs", "scripts/browser-validate-web-planning.mjs", "scripts/operator-execution-browser-lifecycle-v1.mjs"],
  live_authority: ["scripts/github-main-branch-transport.mjs", "plugins/augnes-operator/mcp/companion-service-core.mjs", "plugins/augnes-operator/mcp/checkout-identity.mjs", "lib/vnext/native-host/codex-scoped-task.ts", "lib/vnext/native-host/codex-configuration-sources.mjs"],
  evidence_and_cleanup: ["scripts/local-canonical-inputs.mjs", "scripts/local-canonical-evidence-retention.mjs", "scripts/local-canonical-receipt.mjs", "scripts/test-harness-process-lifecycle.mjs"],
});

export function collectSelectedConsumerInventory({ repositoryRoot = implementationRoot } = {}) {
  const root = realpathSync(repositoryRoot);
  if (root !== path.resolve(repositoryRoot)) fail("selected_consumer_root_alias_refused");
  const files = [];
  const visit = relative => {
    if (relative === SELECTED_CONSUMER_MANIFEST || generated.some(prefix => relative === prefix || relative.startsWith(prefix + "/")) ||
        /^data\/[^/]+\.db(?:-[^/]*)?$/u.test(relative)) return;
    const file = path.join(root, relative), before = lstatSync(file);
    if (before.isSymbolicLink() || realpathSync(file) !== file) fail("selected_consumer_source_alias_refused");
    if (before.isDirectory()) {
      for (const name of readdirSync(file).sort()) visit(relative ? `${relative}/${name}` : name);
      return;
    }
    if (!before.isFile()) fail("selected_consumer_source_type_unknown");
    // Do not infer non-execution from an extension. Node and shell entrypoints
    // can consume extensionless or fixture-named source through dynamic paths.
    if (before.nlink !== 1 || before.size > 32 * 1024 * 1024 || files.length >= 10000) fail("selected_consumer_inventory_unbounded");
    const bytes = readFileSync(file), after = lstatSync(file);
    if (before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size || before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs)
      fail("selected_consumer_observation_race");
    files.push({ path: relative, sha256: hash(bytes), executable: Boolean(before.mode & 0o111) });
  };
  for (const selected of [...SELECTED_CONSUMER_ROOTS, ...SELECTED_CONSUMER_ROOT_FILES]) {
    const relative = selected === "." ? "" : selected;
    const stat = lstatSync(path.join(root, relative), { throwIfNoEntry: false });
    if (stat) visit(relative);
  }
  files.sort((a, b) => a.path.localeCompare(b.path, "en"));
  if (!files.length) fail("selected_consumer_inventory_missing");
  return { files, fingerprint: hash(files), count: files.length };
}

export function auditSelectedConsumers({ repositoryRoot = implementationRoot } = {}) {
  const root = realpathSync(repositoryRoot), file = path.join(root, SELECTED_CONSUMER_MANIFEST);
  const metadata = lstatSync(file);
  if (!metadata.isFile() || metadata.isSymbolicLink() || metadata.nlink !== 1 || realpathSync(file) !== file || metadata.size > 64 * 1024)
    fail("selected_consumer_manifest_unsafe");
  let manifest;
  const bytes = readFileSync(file);
  try { manifest = JSON.parse(bytes); } catch { fail("selected_consumer_manifest_invalid"); }
  if (manifest?.schema !== SELECTED_CONSUMER_CONTRACT || Object.keys(manifest).sort().join(",") !== "file_count,inventory_fingerprint,reviewed_owners,schema,source_roots" ||
      JSON.stringify(manifest.source_roots) !== JSON.stringify(SELECTED_CONSUMER_ROOTS) ||
      JSON.stringify(manifest.reviewed_owners) !== JSON.stringify(SELECTED_CONSUMER_OWNERS) ||
      !/^[0-9a-f]{64}$/u.test(manifest.inventory_fingerprint ?? "") || !Number.isSafeInteger(manifest.file_count))
    fail("selected_consumer_manifest_invalid");
  const inventory = collectSelectedConsumerInventory({ repositoryRoot: root });
  for (const relative of Object.values(SELECTED_CONSUMER_OWNERS).flat()) if (!inventory.files.some(entry => entry.path === relative))
    fail("selected_consumer_owner_missing");
  if (inventory.count !== manifest.file_count || inventory.fingerprint !== manifest.inventory_fingerprint)
    fail("selected_consumer_inventory_changed");
  return { contract: SELECTED_CONSUMER_CONTRACT, fingerprint: hash(bytes),
    inventory_fingerprint: inventory.fingerprint, file_count: inventory.count,
    owner_fingerprint: hash(SELECTED_CONSUMER_OWNERS) };
}
