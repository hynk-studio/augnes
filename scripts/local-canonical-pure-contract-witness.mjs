import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, lstatSync, realpathSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { createCanonicalRevisionReader } from "./canonical-revision-reader.mjs";
import { digest, observePreparedDependencyInputs, preparedDependencyIdentity } from "./local-canonical-inputs.mjs";
import { CANONICAL_NODE_VERSION } from "./local-canonical-environment.mjs";

export const REPOSITORY_PURE_CONTRACT = "repository-pure-contracts-v1";
export const PURE_CONTRACT_PATH = "scripts/test-vnext-operator-pure-contracts-v0-1.ts";
export const PURE_CONTRACT_COMMAND = "node --import tsx " + PURE_CONTRACT_PATH;
const roots = ["app", "components", "lib", "scripts", "types", "apps/augnes_apps/src", "apps/augnes_apps/public"];
const configPaths = ["package.json", "package-lock.json", "tsconfig.json"];
const environmentKeys = ["PATH", "HOME", "TMPDIR", "TMP", "TEMP", "LANG", "LC_ALL", "TZ", "SYSTEMROOT"];
const forbiddenEnvironmentKeys = ["NODE_OPTIONS", "NODE_PATH", "TSX_TSCONFIG_PATH", "ESBUILD_BINARY_PATH", "NODE_COMPILE_CACHE", "NODE_V8_COVERAGE"];
const fixedEnvironment = { TSX_DISABLE_CACHE: "1", NODE_DISABLE_COMPILE_CACHE: "1", NO_COLOR: "1" };
const overrides = { node_options: null, node_path: null, tsx_tsconfig_path: null, tsx_disable_cache: "1", esbuild_binary_path: null,
  node_compile_cache: null, node_v8_coverage: null, node_disable_compile_cache: "1" };
const equal = (a, b) => a !== undefined && b !== undefined && digest(a) === digest(b);
const sha = value => /^[a-f0-9]{64}$/u.test(value ?? "");
const fail = () => { throw Object.assign(new Error("revision_pure_contract_witness_invalid"), { code: "revision_pure_contract_witness_invalid" }); };
const gitAt = root => args => execFileSync("git", ["--no-replace-objects", ...args], { cwd: root, timeout: 10000, maxBuffer: 8 * 1024 * 1024 });

export function pureContractGitSource(git, head) {
  // Keep the shared tree reader and the material reader on the same original
  // objects. This bounded witness does not admit local replacement namespaces.
  if (process.env.GIT_REPLACE_REF_BASE || git(["for-each-ref", "--format=%(refname)", "refs/replace/"]).length) fail();
  const root = git(["rev-parse", "--show-toplevel"]).toString().trim();
  const entries = createCanonicalRevisionReader(root).tree(head);
  if (git(["for-each-ref", "--format=%(refname)", "refs/replace/"]).length) fail();
  const files = [...entries].filter(([, entry]) => entry.type !== "tree");
  if (entries.size > 10000 || files.reduce((sum, [, entry]) => sum + (entry.size ?? 0), 0) > 128 * 1024 * 1024 ||
      files.some(([, entry]) => entry.type !== "blob" || !["100644", "100755"].includes(entry.mode) || entry.size > 8 * 1024 * 1024)) fail();
  return { entries, files, summary: {
    head, tree: git(["rev-parse", head + "^{tree}"]).toString().trim(), dirty: "",
    inventory_sha256: digest(git(["ls-tree", "-r", "-z", "--full-tree", head])),
    entries: files.length, byte_size: files.reduce((sum, [, entry]) => sum + entry.size, 0),
    physical_matches: true, read_roots: roots, untracked_read_inputs: [],
  } };
}

// Bind the entire Git tree, including binary files, rather than a caller-chosen
// subset. The fixed test's recursive scans, local imports and alias scopes must
// contain only those tracked inputs; ignored shadow files and nested modules
// in those scopes refuse. Generated next-env is separately observed, not Git.
export function observePureContractSource(root) {
  if (realpathSync(root) !== root) fail();
  const git = gitAt(root), head = git(["rev-parse", "HEAD"]).toString().trim();
  if (git(["status", "--porcelain=v1"]).length) fail();
  const { entries, files, summary } = pureContractGitSource(git, head);
  for (const [relative, entry] of entries) {
    const file = path.join(root, relative), stat = lstatSync(file);
    if (stat.isSymbolicLink() || realpathSync(file) !== file ||
        (entry.type === "tree" ? !stat.isDirectory() : !stat.isFile())) fail();
  }
  for (const [relative, entry] of files) {
    const file = path.join(root, relative), before = lstatSync(file, { bigint: true });
    if (before.size !== BigInt(entry.size)) fail();
    const bytes = readFileSync(file);
    const after = lstatSync(file, { bigint: true });
    if (["dev", "ino", "size", "mtimeNs", "ctimeNs", "mode"].some(key => before[key] !== after[key]) ||
        bytes.length !== entry.size || ((before.mode & 0o111n) ? "100755" : "100644") !== entry.mode ||
        createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex") !== entry.oid) fail();
  }
  const walk = relative => {
    for (const entry of readdirSync(path.join(root, relative), { withFileTypes: true })) {
      const next = relative + "/" + entry.name;
      if (entry.isSymbolicLink() || !entries.has(next)) fail();
      if (entry.isDirectory()) walk(next); else if (!entry.isFile()) fail();
    }
  };
  for (const relative of roots) walk(relative);
  const root_generated = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!/\.(?:[cm]?[jt]sx?|json|jsonc)$/u.test(entry.name) || entries.has(entry.name)) continue;
    if (entry.name !== "next-env.d.ts" || !entry.isFile() || entry.isSymbolicLink()) fail();
    const file = path.join(root, entry.name), before = lstatSync(file, { bigint: true });
    if (!before.isFile() || before.size > 8n * 1024n * 1024n || realpathSync(file) !== file) fail();
    const bytes = readFileSync(file), after = lstatSync(file, { bigint: true });
    if (["dev", "ino", "size", "mtimeNs", "ctimeNs", "mode"].some(key => before[key] !== after[key]) || BigInt(bytes.length) !== before.size) fail();
    root_generated.push({ path: entry.name, sha256: digest(bytes) });
  }
  if (git(["rev-parse", "HEAD"]).toString().trim() !== head || git(["status", "--porcelain=v1"]).length) fail();
  return { ...summary, root_generated };
}

export function pureContractEnvironment(env = process.env) {
  if (forbiddenEnvironmentKeys.some(key => env[key])) fail();
  return { ...Object.fromEntries(environmentKeys.filter(key => typeof env[key] === "string").map(key => [key, env[key]])), ...fixedEnvironment };
}

export function observePureContractLoader(root, env = process.env) {
  if (forbiddenEnvironmentKeys.some(key => env[key])) fail();
  const node = (env.PATH ?? "").split(path.delimiter).map(dir => path.join(dir, "node")).find(existsSync);
  if (!node || realpathSync(node) !== realpathSync(process.execPath)) fail();
  const file = realpathSync(createRequire(path.join(root, "package.json")).resolve("tsx"));
  if (file !== path.join(root, "node_modules/tsx/dist/loader.mjs")) fail();
  return { path: "node_modules/tsx/dist/loader.mjs", sha256: digest(readFileSync(file)),
    version: JSON.parse(readFileSync(path.join(root, "node_modules/tsx/package.json"), "utf8")).version };
}

function assertions(source) {
  const matches = [...source.matchAll(/assert\.deepEqual\(assertions, \[([\s\S]*?)\]\);/gu)];
  if (matches.length !== 1) fail();
  const values = JSON.parse("[" + matches[0][1].replace(/,\s*$/u, "") + "]");
  if (!values.length || values.some(value => typeof value !== "string") || new Set(values).size !== values.length) fail();
  return values;
}

// This representation is only the existing pure-contract TS command. It does
// not broaden the generic MJS witness, compiler witness, incident or authority.
export function verifyRepositoryPureContract(p, prior, focused, { git, parse, bytes, completedAt }) {
  const regression = focused.regression;
  if (!equal(Object.keys(regression).sort(), ["after", "before", "kind"]) ||
      regression.kind !== REPOSITORY_PURE_CONTRACT || focused.failed_phase !== "unit" ||
      !equal(focused.input_remedy_resources, []) || !focused.implicated_paths.includes(PURE_CONTRACT_PATH) || prior.tree === p.tree) fail();
  const before = parse(regression.before), after = parse(regression.after);
  const configAt = head => configPaths.map(file => ({ path: file, sha256: digest(git(["show", head + ":" + file])) }));
  const oldSource = git(["show", prior.head + ":" + PURE_CONTRACT_PATH]).toString();
  const newSource = git(["show", p.head + ":" + PURE_CONTRACT_PATH]).toString();
  if (!equal(configAt(prior.head), configAt(p.head)) || !equal(assertions(oldSource), assertions(newSource)) ||
      !git(["diff", "--no-ext-diff", "--no-textconv", "--ignore-all-space", "--ignore-blank-lines", prior.head, p.head, "--", PURE_CONTRACT_PATH]).length) fail();
  const lock = JSON.parse(git(["show", p.head + ":package-lock.json"]));
  if (before.loader?.path !== "node_modules/tsx/dist/loader.mjs" || !sha(before.loader.sha256) ||
      before.loader.version !== lock.packages?.["node_modules/tsx"]?.version || !equal(before.loader, after.loader) ||
      !equal(before.loader, before.loader_after) || !equal(after.loader, after.loader_after) ||
      !sha(before.environment) || before.environment !== after.environment ||
      !equal(before.environment_keys, after.environment_keys) || !Array.isArray(before.environment_keys) ||
      !equal(before.environment_keys, [...new Set(before.environment_keys)].sort()) ||
      before.environment_keys.some(key => ![...environmentKeys, ...Object.keys(fixedEnvironment)].includes(key)) ||
      ["PATH", ...Object.keys(fixedEnvironment)].some(key => !before.environment_keys.includes(key)) ||
      !equal(before.overrides, overrides) || !equal(after.overrides, overrides) ||
      !equal(before.dependencies_before, after.dependencies_before)) fail();
  const expectedResponsibilities = Object.fromEntries(assertions(oldSource).map(value => [value, 1]));
  for (const [w, head, exit] of [[before, prior.head, 1], [after, p.head, 0]]) {
    const expected = pureContractGitSource(git, head).summary, r = w.result;
    const { root_generated, ...snapshot } = w.source_before ?? {};
    const dependency = preparedDependencyIdentity(w.dependencies_before);
    if (w.contract !== "augnes.repository-pure-contract-witness.v1" || w.command !== PURE_CONTRACT_COMMAND ||
        w.tested_source_head !== head || w.tree !== expected.tree || w.dirty !== "" ||
        !equal(snapshot, expected) || !Array.isArray(root_generated) || root_generated.length > 1 ||
        root_generated.some(file => !equal(Object.keys(file).sort(), ["path", "sha256"]) || file.path !== "next-env.d.ts" || !sha(file.sha256)) ||
        !equal(w.source_before, w.source_after) || !equal(before.source_before.root_generated, root_generated) ||
        !equal(w.config, configAt(head)) || dependency.phase_id !== "dependencies-root" ||
        dependency.sources.some((source, i) => source.sha256 !== w.config[i].sha256) ||
        !equal(w.dependencies_before, w.dependencies_after) ||
        w.runtime_inputs_sha256 !== p.inputs.identity_sha256 || w.node_version !== CANONICAL_NODE_VERSION ||
        r?.exit_code !== exit || r.timed_out !== false || r.cancelled !== false || r.cleanup_completed !== true ||
        r.remaining_owned_processes !== 0 || r.termination_reason !== "natural_exit" || r.exit_observed !== true || r.streams_closed !== true ||
        !(Date.parse(completedAt) < Date.parse(w.started_at) && Date.parse(w.started_at) < Date.parse(w.finished_at))) fail();
    const output = bytes(w.stdout, 2 * 1024 * 1024).toString();
    if (exit === 1) {
      const locations = [...output.matchAll(/test-vnext-operator-pure-contracts-v0-1\.ts:(\d+):(\d+)/gu)];
      if (!output.includes("AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:\n\nfalse !== true") ||
          !locations.length || oldSource.split("\n")[Number(locations[0][1]) - 1]?.trim() !== "assert.equal(canonicalSuite.includes(permanentBrowserSource), true);") fail();
    } else {
      if (!equal(JSON.parse(output), { status: "pass", contract_version: "vnext_operator_pure_contracts.v0.1", responsibility_execution_count: expectedResponsibilities })) fail();
    }
  }
  if (!(Date.parse(before.finished_at) < Date.parse(after.started_at) && Date.parse(after.finished_at) <= Date.parse(focused.finished_at)) ||
      !focused.commands.some(c => c.command === PURE_CONTRACT_COMMAND && c.tested_source_head === p.head &&
        equal(c.record, regression.after) && equal(c.stdout, after.stdout))) fail();
  return p.head;
}

export function inspectCurrentPureContractInputs(root, witness) {
  // The preparer does not execute the test. Validate the exact closed execution
  // environment it would receive without claiming the preparer ran that child.
  const env = pureContractEnvironment();
  if (!equal(Object.keys(env).sort(), witness.environment_keys) || digest(env) !== witness.environment) fail();
  if (!equal(observePureContractSource(root), witness.source_after) ||
      !equal(observePureContractLoader(root, env), witness.loader) ||
      !equal(observePreparedDependencyInputs({ repositoryRoot: root, phaseId: "dependencies-root" }), witness.dependencies_after)) fail();
}
