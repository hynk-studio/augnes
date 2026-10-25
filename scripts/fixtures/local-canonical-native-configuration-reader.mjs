// Production-ineligible source-block fixture. The native preparation block and
// current-input collector are unchanged; only scope/selection acquisition is
// supplied by disposable fixture material. No admission or native executable.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { parse } from "smol-toml";
import * as sources from "../../lib/vnext/native-host/codex-configuration-sources.mjs";
import { selectNativeConfigurationInputs } from "../local-canonical-selected-execution.mjs";
import { digest, observeInputFile, classifyInputChange, nonFaultInputChange } from "../local-canonical-inputs.mjs";
import { collectSelectedStockEvidence } from "../local-canonical-evidence-retention.mjs";

const implementationRoot = fileURLToPath(new URL("../../", import.meta.url));
const read = file => fs.readFileSync(path.join(implementationRoot, file), "utf8");
function block(source, start, end) {
  assert.equal(source.split(start).length, 2); assert.equal(source.split(end).length, 2);
  const from = source.indexOf(start), to = source.indexOf(end, from);
  assert(to > from); return source.slice(from, to);
}
export function loadNativePreparation(environment, sourceFile = null) {
  const source = sourceFile ? fs.readFileSync(sourceFile, "utf8") : read("lib/vnext/native-host/codex-scoped-task.ts");
  const protocol = read("lib/vnext/protocol-primitives.ts");
  const bounded = read("lib/vnext/native-host/bounded-source-read.ts");
  const compiledReader = ts.transpileModule(bounded, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const readerModule = { exports: {} };
  runInNewContext(compiledReader, { ...fs, Buffer, exports: readerModule.exports, require: createRequire(import.meta.url) }, { timeout: 1000 });
  const material = block(source, "export const SCOPED_CODEX_MODEL_V01", "/** The trusted disposable operator") +
    block(protocol, "export function canonicalizeProtocolValueV01", "export function normalizeProtocolTextV01") +
    block(source, "const DISABLED_FEATURES =", "export async function consumeScopedCodexTaskV01");
  const compiled = ts.transpileModule(material, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {}, scopes = new WeakMap(), reads = [];
  runInNewContext(compiled, { ...fs, ...sources, Buffer, exports, scopes, createHash, path, os, parse,
    readBoundedLocalSourceBytes: (...args) => { reads.push(args[0]); return readerModule.exports.readBoundedLocalSourceBytes(...args); }, process: { env: environment },
    CODEX_SCOPED_CODE_MODE_PROFILE_FINGERPRINT_V01: "fixture-not-a-native-grant" }, { timeout: 1000 });
  return { source_sha256: digest(source), reads, prepare({ sourceRoot, snapshotRoot, home, codexHome }) {
    const scope = Object.freeze({ fingerprint: `sha256:${"1".repeat(64)}`, stage: 1 });
    scopes.set(scope, { root: sourceRoot, snapshot: { root: snapshotRoot }, files: [], approved_instruction_files: [] });
    return exports.prepareScopedCodexLaunchV01(scope, { HOME: home, CODEX_HOME: codexHome }, {
      version: "0.152.1", native_executable_sha256: "sha256:8194ea3181f330e63023b234b0b231855e5874e0331c5ef7cbc490591497a7bf",
      tagged_source_commit: "5adb68a49933ae446bf11935662c83dba55a0804", compatibility_profile_fingerprint: "sha256:a4cfb0e38fd6a2af0d29a467c2c5db2579cdc784e93a820f3482fa2c8a1d663a",
    });
  } };
}

export function loadReviewedInventory(directory, root, resource) {
  const selected = fs.readFileSync(path.join(directory, "local-canonical-selected-execution.mjs"), "utf8");
  const executor = fs.readFileSync(path.join(directory, "run-local-canonical-verification.mjs"), "utf8");
  const selectedBlock = block(selected, "export function selectedExecutionResources(", "export function selectedExecutionRetainedResources(").replace(/^export /u, "");
  const state = { generated: [resource], toolInputs: [], liveResources: [], git: {} }, key = {};
  const selectedResources = runInNewContext(`${selectedBlock}\nselectedExecutionResources`, {
    owners: new Map([[key, state]]), selectedGitResources: () => [], path, implementationRoot: root,
    SELECTED_CONSUMER_MANIFEST: "fixture-consumer-map-not-present", fail: code => { throw new Error(code); },
  }, { timeout: 1000 });
  const inventoryBlock = block(executor, "function invocationInputResources(", "export function currentInputEvidenceValid(");
  const inventory = runInNewContext(`${inventoryBlock}\ninvocationInputResources`, {
    os: { userInfo: () => ({ homedir: path.join(root, "fixture-user") }) }, path, repositoryRoot: root,
    process: { execPath: process.execPath, platform: process.platform, env: {} }, realpathSync: fs.realpathSync,
    verificationAnchorRoot: () => root, resolveExecutionTool: () => process.execPath, EXECUTOR_SOURCE_FILES: [], selectedExecutionResources: selectedResources,
  }, { timeout: 1000 });
  return { resources: inventory({ verificationContext: { kind: "isolated-worktree" }, selection: key }),
    executor_sha256: digest(executor), selector_sha256: digest(selected) };
}

export function fixtureManifest(privateRoot, nativeConfiguration) {
  const manifest = { schema: "augnes.local-canonical-selected-execution.v1", contract: "augnes.local-canonical-selected-execution.v1",
    private_root: privateRoot, native_configuration: nativeConfiguration, files: [], environment: {} };
  const file = path.join(privateRoot, "execution.json");
  fs.writeFileSync(file, JSON.stringify(manifest), { flag: "wx", mode: 0o400 });
  const logical_content = { schema: manifest.schema, native_configuration: { schema: nativeConfiguration.schema,
    external_sources: nativeConfiguration.external_sources.map(({ file, ...row }) => ({ ...row, location_fingerprint: digest(file) })) } };
  return { manifest, resource: { id: "selected-execution-manifest", file, classification: "execution", kind: "selected-execution-manifest",
    source_generated: true, expected_sha256: digest(fs.readFileSync(file)), logical_content },
    environment: { AUGNES_CANONICAL_SELECTED_INPUTS: file, AUGNES_CANONICAL_SELECTED_INPUTS_SHA256: digest(fs.readFileSync(file)) } };
}

export function collectFixtureCurrentInputs(receipt, binding, root, resource, nativeConfiguration) {
  const source = read("scripts/run-local-canonical-verification.mjs");
  const code = block(source, "export function collectCurrentInputEvidence(", "function selectedEvidenceBinding(").replace(/^export /u, "");
  const collect = runInNewContext(`${code}\ncollectCurrentInputEvidence`, {
    repositoryRoot: root, digest, observeInputFile, classifyInputChange, nonFaultInputChange, collectSelectedStockEvidence,
    invocationInputResources: () => [{ ...resource }, ...nativeConfiguration.external_sources.map(({ before, ...row }) => row)],
    selectedExecutionRetainedResources: () => [resource],
  }, { timeout: 1000 });
  return collect(receipt, { kind: "isolated-worktree" }, null, { fixture: true }, binding);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const request = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
  assert.equal(request.fixture_identity, "production-ineligible-native-configuration");
  const raw = fs.readFileSync(request.receipt_file), receipt = JSON.parse(raw);
  const currentRoot = path.join(request.root, "cold-current"); fs.mkdirSync(currentRoot, { mode: 0o700 });
  try {
    const nativeConfiguration = selectNativeConfigurationInputs({ privateRoot: currentRoot, environment: { HOME: path.join(currentRoot, "home") } });
    const { resource } = fixtureManifest(currentRoot, nativeConfiguration);
    const result = collectFixtureCurrentInputs(receipt, request.binding, request.root, resource, nativeConfiguration);
    assert.equal(result.currentRetainedInputEvidence.valid, true, JSON.stringify(result));
    assert.equal(result.currentRetainedChildEvidence.valid, true, JSON.stringify(result));
    assert.equal(result.currentInputStateValid, request.expected_valid, JSON.stringify(result));
    assert.equal(result.currentSafetyStateValid, request.expected_valid, JSON.stringify(result));
    assert.deepEqual(fs.readFileSync(request.receipt_file), raw);
    process.stdout.write(JSON.stringify({ fixture_identity: request.fixture_identity, production_eligible: false, reader_pid: process.pid,
      current_input_valid: result.currentInputStateValid, current_safety_valid: result.currentSafetyStateValid,
      historical_inputs_valid: result.currentRetainedInputEvidence.valid, historical_children_valid: result.currentRetainedChildEvidence.valid,
      reason_codes: result.reason_codes }));
  } finally { fs.rmSync(currentRoot, { recursive: true, force: true }); }
}
