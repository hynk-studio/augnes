import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { chmodSync, existsSync, linkSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { acquireCheckoutVerificationOwnership, releaseCheckoutVerificationOwnership } from "./local-canonical-checkout-ownership.mjs";
import { createCanonicalTestResourceRoot, buildCanonicalChildEnvironment, cleanupCanonicalTestResources, beginCanonicalTestResourceUse, settleCanonicalTestResourceUse } from "./canonical-test-environment.mjs";
import { runCanonicalChild, canonicalChildAcceptanceFailure } from "./canonical-child-runner.mjs";
import { retainSelectedInputEvidence, inspectRetainedSelectedInputs, pinVerificationEvidence, retainOwnedChildLifecycleEvidence } from "./local-canonical-evidence-retention.mjs";
import { enforceArtifactRetention } from "./run-local-canonical-verification.mjs";
import { initializeOwnedChildLifecycleFile, appendOwnedChildLifecycleEvent } from "./test-harness-process-lifecycle.mjs";
import { freezeInputContract } from "./local-canonical-inputs.mjs";
import { beginAttempt, finishAttempt } from "./local-canonical-attempts.mjs";
import { finalizeReceipt } from "./local-canonical-receipt.mjs";
import { baseReceipt, validContext } from "./fixtures/local-canonical-receipt-v3.mjs";

const started = Date.now();
const fixtureOwner = createCanonicalTestResourceRoot("ag-resource-test-");
const root = fixtureOwner.root, runtime = path.join(root, "runtime");
const digest = bytes => createHash("sha256").update(bytes).digest("hex");
const currentSourceBytes = "disposable source v1\n", currentExecutorBytes = "disposable executor v1\n", currentPlanBytes = "disposable plan v1\n", currentConsumerBytes = "disposable consumer map v1\n";
const npmGuard = "#!/bin/sh\ncase \"$*\" in\n  \"--version\"|\"ci --no-audit --no-fund\"|\"run build\"|\"run typecheck\"|\"run typegen\"|\"test\"|\"run test:authority\"|\"run test:integration\"|\"run test:operability\"|\"config get userconfig\") ;;\n  *) exit 126 ;;\nesac\n";
const binding = { head: digest(currentSourceBytes).slice(0, 40), tree: digest(`tree:${currentSourceBytes}`).slice(0, 40),
  executor_fingerprint: digest(currentExecutorBytes), plan_fingerprint: digest(currentPlanBytes), consumer_map_fingerprint: digest(currentConsumerBytes) };
const write = (file, bytes) => writeFileSync(file, bytes, { mode: 0o600 });
const cases = [], environment = buildCanonicalChildEnvironment({ temporaryRoot: root });
let checkoutOwner, childResult, childStarted = false;
try {
  mkdirSync(runtime, { mode: 0o700 });
  checkoutOwner = acquireCheckoutVerificationOwnership({ repositoryRoot: root });
  const logs = path.join(root, ".augnes-local-verification", "logs"); mkdirSync(logs, { mode: 0o700 });
  const indexHeader = Buffer.alloc(12); indexHeader.write("DIRC"); indexHeader.writeUInt32BE(2, 4);
  const index = Buffer.concat([indexHeader, createHash("sha1").update(indexHeader).digest()]);
  const inputs = [
    { id: "git-config", kind: "generated-git-config", logical_content: { schema: "fixture-source-recipe.v1", worktree: "$PRIVATE_SOURCE", policy: "fixed-git-config" },
      bytes: `[core]\nrepositoryformatversion = 0\nbare = false\nworktree = ${runtime}/private-source\nhooksPath = /dev/null\n[remote "origin"]\nurl = https://github.com/hynk-studio/augnes.git\n` },
    { id: "git-head", kind: "source-git-head", bytes: `${binding.head}\n` },
    { id: "git-index", kind: "source-git-index", bytes: index },
    { id: "npm-user", kind: "empty-npm-config", bytes: "" },
    { id: "git-empty", kind: "empty-config", bytes: "" },
    { id: "tool-node", kind: "generated-execution-wrapper", bytes: `#!/bin/sh\nexec '${process.execPath}' "$@"\n`,
      logical_content: { schema: "augnes.local-canonical-generated-wrapper-recipe.v1", template: "selected-dispatch-v1", tool: "node", arguments: ["$SOURCE_NODE"] } },
    { id: "tool-npm", kind: "generated-execution-wrapper", bytes: `${npmGuard}exec '${process.execPath}' '/fixture/npm-cli.js' "$@"\n`,
      logical_content: { schema: "augnes.local-canonical-generated-wrapper-recipe.v1", template: "selected-dispatch-v1", tool: "npm", arguments: ["$SOURCE_NODE", "$SOURCE_NPM"] } },
    { id: "tool-python3", kind: "generated-execution-wrapper", bytes: `#!/bin/sh\nexec '${process.execPath}' '/fixture/local-canonical-selected-python.mjs' "$@"\n`,
      logical_content: { schema: "augnes.local-canonical-generated-wrapper-recipe.v1", template: "selected-dispatch-v1", tool: "python3", arguments: ["$SOURCE_NODE", "$SOURCE_PYTHON_DISPATCHER"] } },
    { id: "tool-tar", kind: "generated-execution-wrapper", bytes: `#!/bin/sh\nexec '/usr/bin/tar' "$@"\n`,
      logical_content: { schema: "augnes.local-canonical-generated-wrapper-recipe.v1", template: "selected-dispatch-v1", tool: "tar", arguments: ["$SOURCE_TAR"] } },
    { id: "selected-manifest", kind: "selected-execution-manifest", bytes: JSON.stringify({ schema: "augnes.local-canonical-selected-execution.v1", private_root: runtime, tool_sha256: "6".repeat(64) }),
      logical_content: { schema: "fixture-source-recipe.v1", private_root: "$SELECTED_ROOT", tool_sha256: "6".repeat(64) } },
  ];
  const resources = inputs.map(({ bytes, ...resource }) => {
    const file = path.join(runtime, resource.id); write(file, bytes);
    return { ...resource, file, source_generated: true, expected_sha256: digest(bytes) };
  });
  const expectedResources = resources.map(({ id, kind, expected_sha256, logical_content }) => ({ id, kind, sha256: expected_sha256, ...(logical_content ? { logical_content } : {}) }));
  function retain(label, alter = () => {}) {
    mkdirSync(path.join(logs, label), { mode: 0o700 });
    const descriptor = retainSelectedInputEvidence({ root, checkoutOwner, runId: label, binding, resources });
    assert.equal(JSON.stringify(descriptor).includes(root), false);
    assert.equal(inspectRetainedSelectedInputs({ root, descriptor, expectedBinding: binding, expectedResources }).valid, true);
    const options = { label, root, descriptor, expectedBinding: binding, expectedResources, expected_valid: false };
    alter(options, path.join(logs, label, "selected-inputs")); cases.push(options); return descriptor;
  }
  const original = retain("matching", options => { options.expected_valid = true; });
  assert.throws(() => retainSelectedInputEvidence({ root, checkoutOwner, runId: "matching", binding, resources }), error => error.code === "EEXIST");
  assert.equal(inspectRetainedSelectedInputs({ root, descriptor: original, expectedBinding: binding }).valid, true);
  for (const key of Object.keys(binding)) retain(`wrong-${key}`, options => { options.expectedBinding = { ...binding, [key]: "f".repeat(binding[key].length) }; });
  retain("new-private-paths", options => { options.expected_valid = true;
    options.expectedResources = expectedResources.map((resource, index) => index ? resource : { ...resource, sha256: "f".repeat(64) }); });
  retain("wrong-resource", options => { options.expectedResources = expectedResources.map((resource, index) => index ? resource : { ...resource, logical_content: { ...resource.logical_content, policy: "changed" } }); });
  retain("wrong-inventory", options => { options.descriptor = { ...options.descriptor, resources: options.descriptor.resources.slice(1) }; });
  retain("tampered-content", (_, directory) => { const file = path.join(directory, "git-head.input"); chmodSync(file, 0o600); write(file, `${"9".repeat(40)}\n`); chmodSync(file, 0o400); });
  retain("changed-mode", (_, directory) => { chmodSync(path.join(directory, "git-head.input"), 0o600); });
  retain("changed-owner-binding", options => { options.descriptor = structuredClone(options.descriptor); options.descriptor.manifest_identity.uid = "999999"; });
  retain("missing-evidence", (_, directory) => { rmSync(path.join(directory, "git-head.input")); });
  retain("aliased-evidence", (_, directory) => { const file = path.join(directory, "git-head.input"); rmSync(file); symlinkSync(resources[1].file, file); });
  retain("hardlinked-evidence", (_, directory) => { linkSync(path.join(directory, "git-head.input"), path.join(runtime, "hardlink")); });
  retain("tampered-manifest", (_, directory) => { const file = path.join(directory, "manifest.json"); chmodSync(file, 0o600); write(file, "{}\n"); chmodSync(file, 0o400); });
  retain("replacement-evidence", (_, directory) => { const file = path.join(directory, "git-head.input"); const bytes = readFileSync(file); rmSync(file); write(file, bytes); chmodSync(file, 0o400); });

  const badFile = path.join(runtime, "bad");
  for (const [label, bytes, kind, tool = "node", arguments_ = ["$SOURCE_NODE"]] of [
    ["include", '[include]\npath = /tmp/external\n', "generated-git-config"],
    ["credential", '[credential]\nhelper = unsafe\n', "generated-git-config"],
    ["npm-auth", '//registry.npmjs.org/:_authToken=not-a-real-token\n', "empty-npm-config"],
    ["arbitrary-script", 'process.exit(0);\n', "generated-script"],
    ["wrapper-extra-code", `#!/bin/sh\nexec '${process.execPath}' "$@"\nprintf unsafe\n`, "generated-execution-wrapper"],
    ["wrapper-flags-on-node", `#!/bin/sh\nexec '${process.execPath}' '-E' '-s' '-S' "$@"\n`, "generated-execution-wrapper", "node", ["$SOURCE_NODE", "-E", "-s", "-S"]],
    ["npm-missing-guard", `#!/bin/sh\nexec '${process.execPath}' '/fixture/npm-cli.js' "$@"\n`, "generated-execution-wrapper", "npm", ["$SOURCE_NODE", "$SOURCE_NPM"]],
    ["npm-extra-command", `${npmGuard}echo unsafe\nexec '${process.execPath}' '/fixture/npm-cli.js' "$@"\n`, "generated-execution-wrapper", "npm", ["$SOURCE_NODE", "$SOURCE_NPM"]],
    ["manifest-credential", JSON.stringify({ schema: "augnes.local-canonical-selected-execution.v1", credentials: "not-a-real-secret" }), "selected-execution-manifest"],
  ]) {
    write(badFile, bytes); mkdirSync(path.join(logs, label), { mode: 0o700 });
    assert.throws(() => retainSelectedInputEvidence({ root, checkoutOwner, runId: label, binding,
      resources: [{ id: "bad", file: badFile, kind, source_generated: true, expected_sha256: digest(bytes),
        ...(kind === "generated-execution-wrapper" ? { logical_content: { schema: "augnes.local-canonical-generated-wrapper-recipe.v1", template: "selected-dispatch-v1", tool, arguments: arguments_ } } : {}) }] }));
    assert.equal(existsSync(path.join(logs, label, "selected-inputs")), false);
  }
  assert.throws(() => retainSelectedInputEvidence({ root, checkoutOwner, runId: "unbound", binding,
    resources: resources.map(resource => ({ ...resource, source_generated: false })) }));
  write(resources[0].file, "changed producer input\n");
  assert.throws(() => retainSelectedInputEvidence({ root, checkoutOwner, runId: "changed-source", binding, resources }), error => error.code === "selected_evidence_source_changed");

  const ledgerFile = path.join(runtime, "children.jsonl"), ledger = initializeOwnedChildLifecycleFile(ledgerFile);
  beginCanonicalTestResourceUse(fixtureOwner); childStarted = true;
  childResult = await runCanonicalChild({ suite: "selected-evidence", label: "actual owned producer", command: process.execPath,
    args: ["-e", "process.exit(0)"], cwd: root, env: environment, timeoutMs: 5000,
    onLifecycle: event => appendOwnedChildLifecycleEvent(ledgerFile, ledger.identity, event), stdout: { write() {} }, stderr: { write() {} }, log() {} });
  assert.equal(canonicalChildAcceptanceFailure(childResult, { suite: "selected-evidence", timeoutMs: 5000, requireNaturalExit: true }), null);
  const lifecycleCases = [];
  const retainLifecycle = (label, alter = () => {}) => {
    mkdirSync(path.join(logs, label), { mode: 0o700 });
    const descriptor = retainOwnedChildLifecycleEvidence({ root, checkoutOwner, runId: label, binding, file: ledgerFile, identity: ledger.identity });
    const options = { label, root, descriptor, expectedBinding: binding, expected_valid: false };
    alter(options, path.join(logs, label, "child-lifecycle")); lifecycleCases.push(options);
  };
  retainLifecycle("lifecycle-matching", options => { options.expected_valid = true; });
  retainLifecycle("lifecycle-source-mismatch", options => { options.expectedBinding = { ...binding, head: "f".repeat(40) }; });
  retainLifecycle("lifecycle-missing", (_, directory) => { rmSync(path.join(directory, "events.jsonl")); });
  retainLifecycle("lifecycle-tampered", (_, directory) => { const file = path.join(directory, "events.jsonl"); chmodSync(file, 0o600); write(file, "{}\n"); chmodSync(file, 0o400); });
  const completeChildren = retainOwnedChildLifecycleEvidence({ root, checkoutOwner, runId: "matching", binding, file: ledgerFile, identity: ledger.identity });
  write(resources[0].file, inputs[0].bytes);
  const selectedReceipt = structuredClone(baseReceipt);
  Object.assign(selectedReceipt, { receipt_version: 4, selected_inputs: original, owned_children: completeChildren });
  Object.assign(selectedReceipt.repository, { head_sha: binding.head, tree_sha: binding.tree, branch: "codex/disposable-selected-stock" });
  selectedReceipt.executor.source_fingerprint = binding.executor_fingerprint;
  selectedReceipt.integration_base.tested_head_sha = binding.head;
  selectedReceipt.run.id = "matching";
  Object.assign(selectedReceipt.verification_context, { kind: "isolated-worktree", admission: "registered_worktree_of_authorized_mac", checkout_fingerprint: "c".repeat(64) });
  selectedReceipt.dependencies.download_cache = "invocation_private_cache_not_authoritative";
  selectedReceipt.cleanup.companion_service.scope = "accepted_checkout_read_only";
  selectedReceipt.cleanup.companion_service.observations = {};
  for (const side of ["before", "after"]) {
    Object.assign(selectedReceipt.cleanup.companion_service[side], { preservation_valid: true, preservation_binding: "b".repeat(64) });
    selectedReceipt.cleanup.companion_service.observations[side] = { contract: "augnes.companion-preservation-observation.v1", samples: 1,
      coherent: true, live_identity_valid: true, before_binding: "b".repeat(64), after_binding: "b".repeat(64),
      started_at: selectedReceipt.run.started_at, finished_at: selectedReceipt.run.finished_at };
  }
  selectedReceipt.cleanup.isolated_resources = { required: true, prepared: true, completed: true, failure_count: 0, failures: [],
    fingerprint: "f".repeat(64), invocation_id: selectedReceipt.run.invocation_id, policy: "private_outer_home_temp_cache_database_runtime" };
  selectedReceipt.checkout_ownership = { required: true, acquired: true, released: true, checkout_fingerprint: "c".repeat(64),
    ownership_id: "9".repeat(32), acquired_at: selectedReceipt.run.started_at, released_at: selectedReceipt.run.finished_at, failure_code: null };
  const declaration = freezeInputContract({ pathKind: "isolated-model-free-v1", resources: [
    ...resources.map(resource => ({ id: resource.id, file: resource.file, classification: "execution" })),
    ...["codex-preferences", "user-instructions", "auth-location", "node-executable"].map(id => ({ id, file: resources[4].file, classification: "execution" }))],
    binding: { head: binding.head, tree: binding.tree, executor_fingerprint: binding.executor_fingerprint, phase_inventory: binding.plan_fingerprint,
      live_authority_fingerprint: digest("fixture authority v1\n"), selected_execution: { contract: "augnes.local-canonical-selected-execution.v1", consumer_map_fingerprint: binding.consumer_map_fingerprint },
      phase_environment_fingerprints: selectedReceipt.phases.map(phase => ({ id: phase.id, fingerprint: "a".repeat(64) })) } });
  declaration.check(); selectedReceipt.inputs = declaration.snapshot();
  for (const phase of selectedReceipt.phases) phase.environment_fingerprint = "a".repeat(64);
  selectedReceipt.attempt = beginAttempt({ anchorRoot: root, repositoryRoot: root, checkoutOwner, branch: selectedReceipt.repository.branch,
    head: binding.head, tree: binding.tree, runId: "matching", contractFingerprint: selectedReceipt.inputs.fingerprint });
  selectedReceipt.outcome = { disposition: "completed_success", execution: "complete_pass", validity: "valid_within_observed_scope", safety: "preserved_within_observed_scope" };
  const stockReceipt = finalizeReceipt(selectedReceipt);
  finishAttempt(selectedReceipt.attempt, { receiptFingerprint: stockReceipt.integrity.content_fingerprint, disposition: stockReceipt.outcome.disposition, cleanupComplete: true });
  const receiptFile = path.join(root, "stock-receipt.json"), legacyFile = path.join(root, "legacy-receipt.json");
  write(receiptFile, JSON.stringify(stockReceipt)); write(legacyFile, JSON.stringify(finalizeReceipt(baseReceipt)));
  const currentDirectory = path.join(root, "current-selected"); mkdirSync(currentDirectory, { mode: 0o700 });
  const currentResources = inputs.map(({ bytes, ...resource }) => {
    const file = path.join(currentDirectory, resource.id);
    write(file, typeof bytes === "string" ? bytes.replaceAll(runtime, currentDirectory) : bytes);
    return { ...resource, file };
  });
  const stockCases = [];
  for (const label of ["matching", "source-changed", "executor-changed", "plan-changed", "consumer-map-changed", "authority-changed", "main-changed", "inventory-missing",
    "descriptor-missing", "descriptor-resource-missing", "ledger-incomplete", "retained-input-missing", "retained-child-missing"]) {
    const directory = path.join(root, `current-${label}`); mkdirSync(directory, { mode: 0o700 });
    for (const [name, bytes] of Object.entries({ source: currentSourceBytes, executor: currentExecutorBytes, plan: currentPlanBytes, consumer: currentConsumerBytes,
      authority: "fixture authority v1\n", main: selectedReceipt.repository.base_sha })) {
      const changed = label === `${name}-changed` || (name === "consumer" && label === "consumer-map-changed");
      write(path.join(directory, name), changed ? name === "main" ? "e".repeat(40) : `${bytes}changed\n` : bytes);
    }
    stockCases.push({ label, directory });
  }
  const stockContext = { ...validContext, expectedRunId: "matching", currentVerificationContext: selectedReceipt.verification_context,
    currentIdentity: { ...validContext.currentIdentity, head_sha: binding.head, branch: selectedReceipt.repository.branch }, currentExecutorFingerprint: binding.executor_fingerprint,
    currentIntegrationBase: { ...validContext.currentIntegrationBase, tested_head_sha: binding.head } };
  appendOwnedChildLifecycleEvent(ledgerFile, ledger.identity, { schema: "augnes.owned-child-lifecycle.v1", event: "started",
    child_id: "a".repeat(32), observed_at: new Date().toISOString(), label_fingerprint: "b".repeat(64) });
  retainLifecycle("lifecycle-unmatched-start");
  rmSync(runtime, { recursive: true });
  assert.equal(existsSync(runtime), false);
  const request = path.join(root, "cold-reader.json"); write(request, JSON.stringify({ fixture_identity: "production-ineligible-selected-evidence", cases, lifecycle_cases: lifecycleCases,
    stock: { root, receiptFile, legacyFile, context: stockContext, legacyContext: validContext, currentResources, cases: stockCases } }));
  let output = "", diagnostics = ""; childResult = null;
  childResult = await runCanonicalChild({ suite: "selected-evidence", label: "fresh retained-input stock reader", command: process.execPath,
    args: [fileURLToPath(new URL("./fixtures/local-canonical-selected-evidence-reader.mjs", import.meta.url)), request],
    cwd: root, env: environment, timeoutMs: 10_000,
    stdout: { write(chunk) { output += chunk; } }, stderr: { write(chunk) { diagnostics += chunk; } }, log() {} });
  assert.equal(canonicalChildAcceptanceFailure(childResult, { suite: "selected-evidence", timeoutMs: 10_000, requireNaturalExit: true }), null, diagnostics);
  const cold = JSON.parse(output); assert.notEqual(cold.reader_pid, process.pid); assert.equal(cold.production_eligible, false);
  assert.equal(cold.results.length, cases.length); assert.equal(cold.results.find(result => result.label === "matching").valid, true);
  assert.equal(cold.lifecycle_results.length, 5);
  assert.equal(cold.lifecycle_results.find(result => result.label === "lifecycle-unmatched-start").unknown_count, 1);
  assert.equal(cold.stock_results.length, stockCases.length); assert.equal(cold.legacy_unchanged, true);
  assert.equal(cold.bootstrap_results.length,3);
  mkdirSync(path.join(root, ".augnes-local-verification", "receipts"), { mode: 0o700 });
  pinVerificationEvidence({ root, checkoutOwner, runId: "new-private-paths" });
  enforceArtifactRetention({ root, checkoutOwner, currentRunId: "matching", receiptMaximum: 1, logMaximum: 1 });
  assert.equal(existsSync(path.join(logs, "matching")), true);
  assert.equal(existsSync(path.join(logs, "new-private-paths")), true);
  assert.equal(existsSync(path.join(logs, "wrong-head")), false);
  console.log(JSON.stringify({ test: "local-canonical-selected-evidence", deciding: false, production_eligible: false,
    cases: cold.results.map(({ label, valid, reason_codes }) => ({ label, valid, reason_codes })),
    lifecycle_cases: cold.lifecycle_results,
    stock_cases: cold.stock_results, bootstrap_cases:cold.bootstrap_results, legacy_raw_receipt_unchanged: cold.legacy_unchanged,
    runtime_deleted_before_fresh_reader: true, immutable_rewrite_refused: true, private_config_refused: true,
    ordinary_retention_prunes_disposable_preserves_active_pinned: true, duration_ms: Date.now() - started }));
} finally {
  const consumersSettled = !childStarted || Boolean(childResult?.cleanup_completed && childResult?.streams_closed && childResult?.exit_observed && childResult?.remaining_owned_processes === 0);
  if (childStarted && consumersSettled) settleCanonicalTestResourceUse(fixtureOwner, childResult);
  if (checkoutOwner) releaseCheckoutVerificationOwnership(checkoutOwner, root, { consumersSettled });
  const [cleanup] = cleanupCanonicalTestResources([fixtureOwner]); assert.equal(cleanup.completed, true, JSON.stringify(cleanup));
}
