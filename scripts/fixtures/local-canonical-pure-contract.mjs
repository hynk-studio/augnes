import assert from "node:assert/strict";
import { cpSync, mkdirSync, readFileSync, writeFileSync, rmSync, symlinkSync, renameSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { digest, observeCanonicalRuntimeInputs, observePreparedDependencyInputs } from "../local-canonical-inputs.mjs";
import { verifyGitSourceRepair, MATERIAL_SOURCE_CORRECTION } from "../local-canonical-git-observation.mjs";
import { REPOSITORY_PURE_CONTRACT, PURE_CONTRACT_PATH, PURE_CONTRACT_COMMAND,
  observePureContractSource, observePureContractLoader, inspectCurrentPureContractInputs, pureContractEnvironment } from "../local-canonical-pure-contract-witness.mjs";

// Invoked by the existing serial-material fixture owner. This small checkout
// runs the actual TS loader and lifecycle; its Git and evidence are disposable.
export async function pureContractWitnessControls(parent, h, sourceRoot) {
  const root = path.join(parent, "pure-contract-witness"); mkdirSync(root);
  const write = (file, value) => { mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    writeFileSync(path.join(root, file), typeof value === "string" ? value : JSON.stringify(value)); };
  const git = args => execFileSync("git", args, { cwd: root, timeout: 10000 });
  git(["init", "--quiet"]);
  write(".gitignore", "node_modules/\n*.shadow.js\n.shadow.json\nnext-env.d.ts\n");
  for (const name of ["app", "components", "lib", "scripts", "types", "apps/augnes_apps/src", "apps/augnes_apps/public"]) write(name + "/placeholder.ts", "export {};\n");
  const version = JSON.parse(readFileSync(path.join(sourceRoot, "node_modules/tsx/package.json"))).version;
  write("package.json", { name: "pure-contract-fixture", type: "module", dependencies: { tsx: version } });
  write("package-lock.json", { packages: { "node_modules/tsx": { version } } });
  write("tsconfig.json", { compilerOptions: { target: "ES2022" } });
  for (const module of ["tsx", "esbuild", "@esbuild"])
    cpSync(path.join(sourceRoot, "node_modules", module), path.join(root, "node_modules", module), { recursive: true });
  const source = corrected => `import assert from "node:assert/strict";
const assertions = ["fixture_preserves_registration"];
const canonicalSuite = ${JSON.stringify(corrected ? "registered" : "extracted")};
const permanentBrowserSource = "registered";
assert.equal(canonicalSuite.includes(permanentBrowserSource), true);
assert.deepEqual(assertions, ["fixture_preserves_registration"]);
process.stdout.write(JSON.stringify({status:"pass",contract_version:"vnext_operator_pure_contracts.v0.1",responsibility_execution_count:Object.fromEntries(assertions.map(value=>[value,1]))})+"\\n");
`;
  const commit = corrected => { write(PURE_CONTRACT_PATH, source(corrected)); git(["add", "."]);
    git(["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "--quiet", "-m", corrected ? "correct fixture" : "seed fixture"]); };
  const inputs = observeCanonicalRuntimeInputs(), env = pureContractEnvironment();
  const completedAt = new Date().toISOString(); commit(false);
  const run = async () => {
    const source_before = observePureContractSource(root), loader = observePureContractLoader(root, env);
    const dependencies_before = observePreparedDependencyInputs({ repositoryRoot: root, phaseId: "dependencies-root" });
    let output = ""; const sink = { write(chunk) { output += chunk; } }, started_at = new Date().toISOString();
    const result = await h.run({ suite: "pure-contract-witness", label: "actual TS fixture", command: process.execPath,
      args: ["--import", "tsx", PURE_CONTRACT_PATH], cwd: root, env, timeoutMs: 5000, stdout: sink, stderr: sink, log() {} });
    return { contract: "augnes.repository-pure-contract-witness.v1", command: PURE_CONTRACT_COMMAND,
      tested_source_head: source_before.head, tree: source_before.tree, dirty: "", source_before, source_after: observePureContractSource(root),
      dependencies_before, dependencies_after: observePreparedDependencyInputs({ repositoryRoot: root, phaseId: "dependencies-root" }),
      loader, loader_after: observePureContractLoader(root, env), config: ["package.json", "package-lock.json", "tsconfig.json"].map(file => ({ path: file, sha256: digest(readFileSync(path.join(root, file))) })),
      overrides: { node_options: null, node_path: null, tsx_tsconfig_path: null, tsx_disable_cache: "1", esbuild_binary_path: null,
        node_compile_cache: null, node_v8_coverage: null, node_disable_compile_cache: "1" },
      environment: digest(env), environment_keys: Object.keys(env).sort(), runtime_inputs_sha256: digest(inputs), node_version: process.versions.node,
      started_at, finished_at: new Date().toISOString(), result, output };
  };
  const red = await run(); assert.equal(red.result.exit_code, 1); commit(true);
  const green = await run(); assert.equal(green.result.exit_code, 0);
  const records = new Map(), artifact = (name, value) => {
    const data = Buffer.from(typeof value === "string" ? value : JSON.stringify(value)); records.set(name, data);
    return { artifact: name, sha256: digest(data) };
  };
  const bytes = ref => { const value = records.get(ref.artifact); assert.equal(digest(value), ref.sha256); return value; };
  const parse = ref => JSON.parse(bytes(ref));
  const witness = (name, run) => { const { output, ...record } = run; return artifact(name + ".json", { ...record, stdout: artifact(name + ".log", output) }); };
  const before = witness("red", red), after = witness("green", green);
  const p = { schema: "augnes.local-canonical-source-correction.v7", kind: "reviewed_revision", head: green.tested_source_head, tree: green.tree,
    commission: { source_revision: MATERIAL_SOURCE_CORRECTION }, inputs: { identity_sha256: digest(inputs), inventory_sha256: digest("fixture inventory") } };
  const prior = { head: red.tested_source_head, tree: red.tree };
  const focused = { failed_phase: "unit", input_remedy_resources: [], implicated_paths: [PURE_CONTRACT_PATH],
    finished_at: new Date().toISOString(), regression: { kind: REPOSITORY_PURE_CONTRACT, before, after },
    commands: [{ command: PURE_CONTRACT_COMMAND, tested_source_head: p.head, record: after, stdout: parse(after).stdout }] };
  const verify = (q = p, f = focused) => verifyGitSourceRepair(q, prior, f, { git, parse, bytes, completedAt });
  assert.equal(verify(), p.head); inspectCurrentPureContractInputs(root, parse(after));
  let negatives = 0;
  for (const [which, mutate] of [
    ["before", w => w.result.exit_code = 2], ["before", w => w.started_at = completedAt],
    ["before", w => { w.source_before.entries--; w.source_after = structuredClone(w.source_before); }],
    ["before", w => { w.source_before.inventory_sha256 = digest("sparse"); w.source_after = structuredClone(w.source_before); }],
    ["before", w => w.environment = digest("different")], ["before", w => w.command += " --skip"],
    ["before", w => w.loader.sha256 = digest("substituted")], ["before", w => w.overrides.esbuild_binary_path = "/tmp/substituted"],
    ["after", w => w.source_after.physical_matches = false], ["after", w => w.config.pop()],
    ["after", w => w.result.cleanup_completed = false], ["after", w => w.result.termination_reason = "bounded_timeout"],
    ["after", w => w.dependencies_after.content_sha256 = digest("changed")],
    ["before", w => w.stdout = artifact("setup-error.log", "ERR_MODULE_NOT_FOUND")],
    ["after", w => w.stdout = artifact("false-pass.log", JSON.stringify({ status: "pass" }))],
  ]) {
    const f = structuredClone(focused), w = parse(f.regression[which]); mutate(w);
    f.regression[which] = artifact("bad-witness-" + negatives, w);
    if (which === "after") Object.assign(f.commands[0], { record: f.regression.after, stdout: w.stdout });
    assert.throws(() => verify(p, f)); negatives++;
  }
  for (const mutate of [f => f.failed_phase = "typecheck", f => f.regression.kind = "unknown", f => f.implicated_paths = []]) {
    const f = structuredClone(focused); mutate(f); assert.throws(() => verify(p, f)); negatives++;
  }
  assert.throws(() => verify({ ...p, schema: "augnes.local-canonical-source-correction.v10" }));
  const generic = structuredClone(focused); generic.regression = { path: PURE_CONTRACT_PATH, args: [], before, after };
  assert.throws(() => verify(p, generic), /revision_material_remedy_required/);
  negatives += 2;
  for (const file of ["lib/unexpected.shadow.js", "scripts/node_modules/shadow/package.json", ".shadow.json"]) {
    write(file, "{}"); assert.throws(() => observePureContractSource(root)); rmSync(path.join(root, file));
    if (file.includes("node_modules")) rmSync(path.join(root, "scripts/node_modules"), { recursive: true }); negatives++;
  }
  for (const key of ["NODE_OPTIONS", "NODE_PATH", "TSX_TSCONFIG_PATH", "ESBUILD_BINARY_PATH", "NODE_COMPILE_CACHE", "NODE_V8_COVERAGE"]) {
    assert.throws(() => observePureContractLoader(root, { ...env, [key]: "substitution" }));
    assert.throws(() => pureContractEnvironment({ ...env, [key]: "substitution" })); negatives += 2;
  }
  assert.equal(pureContractEnvironment({ ...env, ESBUILD_WORKER_THREADS: "0", ESBUILD_MAX_BUFFER: "1" }).ESBUILD_WORKER_THREADS, undefined);
  write("next-env.d.ts", "x".repeat(8 * 1024 * 1024 + 1));
  assert.throws(() => observePureContractSource(root)); rmSync(path.join(root, "next-env.d.ts")); negatives++;
  write("lib/placeholder.ts", "changed"); assert.throws(() => observePureContractSource(root)); git(["restore", "lib/placeholder.ts"]);
  renameSync(path.join(root, "lib"), path.join(root, "lib-original")); symlinkSync("lib-original", path.join(root, "lib"));
  assert.throws(() => observePureContractSource(root)); rmSync(path.join(root, "lib")); renameSync(path.join(root, "lib-original"), path.join(root, "lib"));
  const loader = path.join(root, "node_modules/tsx/dist/loader.mjs"), original = readFileSync(loader);
  writeFileSync(loader, "export {};\n"); assert.throws(() => inspectCurrentPureContractInputs(root, parse(after))); writeFileSync(loader, original);
  negatives += 3;
  git(["replace", prior.head, p.head]);
  try { assert.throws(() => verify()); assert.throws(() => observePureContractSource(root)); negatives += 2; }
  finally { git(["replace", "-d", prior.head]); }
  inspectCurrentPureContractInputs(root, parse(after));
  return { contract: REPOSITORY_PURE_CONTRACT, real_process_exits: [red.result.exit_code, green.result.exit_code], negatives,
    complete_git_inventory: true, current_inputs_checked: true, synthetic_only: true, deciding: false };
}
