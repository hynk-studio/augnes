#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createCanonicalTestResourceRoot, cleanupCanonicalTestResources,
  beginCanonicalTestResourceUse, settleCanonicalTestResourceUse } from "./canonical-test-environment.mjs";
import { initializeOwnedChildLifecycleFile, readOwnedChildLifecycleFile,
  withOwnedSyncLifecycle, runOwnedSyncChild } from "./test-harness-process-lifecycle.mjs";

const { observeInputFile, classifyInputChange, freezeInputContract, digest, nonFaultInputChange } = await import(
  process.argv[2] ? pathToFileURL(path.resolve(process.argv[2])).href : "./local-canonical-inputs.mjs");
const owner = createCanonicalTestResourceRoot("ag-resource-test-");
const root = path.join(owner.root, "selected-tool"), outside = path.join(owner.root, "outside-sentinel");
const options = { readOnlyTree: true };
const role = { classification: "execution", readOnlyTree: true };
const originalRead = fs.readFileSync;
let primary;
let groupControl = "not_run:no_alternate_supplementary_group";
let permissionLedger = null, permissionUseStarted = false;
try {
  fs.mkdirSync(root); fs.mkdirSync(path.join(root, "lib")); fs.mkdirSync(path.join(root, "bin"));
  const moduleFile = path.join(root, "lib", "private-name-sentinel.mjs");
  fs.writeFileSync(moduleFile, "export const value = 1;\n");
  // A selected parent's /private/tmp root can inherit wheel, which this user
  // cannot restore after chgrp. Bind only this new fixture to our primary group
  // before its baseline; the real alternate-group assertion below stays intact.
  if (process.getgid && fs.statSync(moduleFile).gid !== process.getgid()) fs.chownSync(moduleFile, -1, process.getgid());
  fs.writeFileSync(path.join(root, "package.json"), '{"name":"disposable-tool"}\n');
  fs.writeFileSync(outside, "outside-content-sentinel");
  fs.symlinkSync("../lib/private-name-sentinel.mjs", path.join(root, "bin", "tool"));
  fs.symlinkSync("lib", path.join(root, "internal-directory-link"));
  const baseline = observeInputFile(root, options);
  assert.equal(baseline.file_count, 2); assert.equal(baseline.entry_count, 7);
  assert.equal(classifyInputChange(baseline, observeInputFile(root, { ...options, force: true }), role), "unchanged");
  const encoded = JSON.stringify(baseline);
  for (const forbidden of [owner.root, "private-name-sentinel", "outside-content-sentinel", "disposable-tool", "../lib/"])
    assert(!encoded.includes(forbidden), "tree evidence contains only identities and counts");

  let reads = 0;
  fs.readFileSync = (...args) => { reads++; return originalRead(...args); }; syncBuiltinESMExports();
  observeInputFile(root, options); const pollingReads = reads;
  observeInputFile(root, { ...options, force: true });
  assert.equal(pollingReads, 2); assert.equal(reads, 4, "forced closeout rereads every selected file");
  fs.readFileSync = originalRead; syncBuiltinESMExports();

  const forwarded = [];
  const frozen = freezeInputContract({ resources: [{ id: "npm-installation-tree", file: root, ...role }],
    pathKind: "canonical-conservative-v1", binding: { fixture: "read-only-tool-tree" },
    read(file, selected) { forwarded.push(selected); return observeInputFile(file, selected); } });
  assert.equal(frozen.snapshot().resources[0].readOnlyTree, true);
  assert.equal(frozen.check(), null); assert.equal(frozen.check({ force: true }), null);
  assert.deepEqual(forwarded.map(value => [value.readOnlyTree, value.force]), [[true, true], [true, false], [true, true]]);
  fs.writeFileSync(moduleFile, "export const value = 2;\n");
  assert.equal(classifyInputChange(baseline, observeInputFile(root, options), role), "input_invalidation");
  assert.equal(frozen.check().disposition, "input_invalidation");
  fs.writeFileSync(moduleFile, "export const value = 1;\n");
  assert.equal(frozen.check().disposition, "input_invalidation", "restoration does not clear the first fault");
  const beforeMode = observeInputFile(root, options);
  fs.chmodSync(moduleFile, 0o600);
  assert.equal(classifyInputChange(beforeMode, observeInputFile(root, options), role), "safety_violation");
  fs.chmodSync(moduleFile, 0o644);
  const originalGroup = fs.statSync(moduleFile).gid;
  const otherGroup = process.getgroups?.().find(group => group !== originalGroup);
  if (otherGroup !== undefined) {
    const beforeGroup = observeInputFile(root, options);
    try {
      fs.chownSync(moduleFile, process.getuid(), otherGroup);
      assert.equal(classifyInputChange(beforeGroup, observeInputFile(root, options), role), "safety_violation");
      groupControl = "pass";
    } finally { fs.chownSync(moduleFile, process.getuid(), originalGroup); }
  }

  const internal = path.join(root, "bin", "tool"), priorTarget = observeInputFile(root, options);
  fs.unlinkSync(internal); fs.symlinkSync("../package.json", internal);
  assert(!nonFaultInputChange(classifyInputChange(priorTarget, observeInputFile(root, options), role)));
  fs.unlinkSync(internal); fs.symlinkSync(outside, internal);
  assert.throws(() => observeInputFile(root, options), /input_tree_link_escape/);
  fs.unlinkSync(internal); fs.symlinkSync("../lib/private-name-sentinel.mjs", internal);
  const rootAlias = path.join(owner.root, "root-alias"); fs.symlinkSync(root, rootAlias);
  assert.throws(() => observeInputFile(rootAlias, options), /input_tree_unsafe/);
  fs.linkSync(moduleFile, path.join(root, "hardlink"));
  assert.throws(() => observeInputFile(root, options), /input_tree_unsafe/);
  fs.unlinkSync(path.join(root, "hardlink"));
  assert.throws(() => observeInputFile(path.join(owner.root, "absent"), options), /input_tree_missing/);
  for (const forbidden of [{ metadataOnly: true }, { preferences: true }, { readOnlyExecutable: true }])
    assert.throws(() => observeInputFile(root, { ...options, ...forbidden }), /input_tree_role_invalid/);
  for (const invalid of [{ classification: "ambient" }, { excludePreferences: true }, { readOnlyExecutable: true }, { metadataOnly: true }])
    assert.throws(() => freezeInputContract({ resources: [{ id: "tree", file: root, ...role, ...invalid }],
      pathKind: "isolated-model-free-v1", binding: {} }), /input_(?:tree|executable)_role_invalid/);
  assert.equal(classifyInputChange(baseline, baseline, { ...role, classification: "ambient" }), "unknown_relevance");
  assert.equal(classifyInputChange(baseline, { ...baseline, tree_metadata_sha256: null }, role), "unknown_relevance");

  let raced = false;
  fs.readFileSync = (...args) => {
    const result = originalRead(...args);
    if (!raced) { raced = true; fs.writeFileSync(moduleFile, "changed during selected read\n"); }
    return result;
  }; syncBuiltinESMExports();
  assert.throws(() => observeInputFile(root, options), /input_observation_race/);
  fs.readFileSync = originalRead; syncBuiltinESMExports();
  const huge = path.join(root, "oversize"); fs.writeFileSync(huge, ""); fs.truncateSync(huge, 100 * 1024 * 1024 + 1);
  assert.throws(() => observeInputFile(root, options), /input_tree_bound_exceeded/); fs.unlinkSync(huge);
  const dense = path.join(owner.root, "entry-bound"); fs.mkdirSync(dense);
  for (let i = 0; i < 10_001; i++) fs.writeFileSync(path.join(dense, String(i)), "");
  assert.throws(() => observeInputFile(dense, options), /input_tree_bound_exceeded/);
  assert.equal(originalRead(outside, "utf8"), "outside-content-sentinel");
  const legacy = observeInputFile(moduleFile);
  assert.equal(legacy.sha256, digest(originalRead(moduleFile))); assert.equal(legacy.tree_identity_policy, undefined);
  assert.equal(classifyInputChange(legacy, observeInputFile(moduleFile), { classification: "execution" }), "unchanged");
  if (["darwin", "linux"].includes(process.platform)) {
    const executable = path.join(owner.root, "permission-control"); fs.writeFileSync(executable, "owned executable fixture\n", { mode: 0o700 });
    const file = path.join(owner.root, "permission-readers.jsonl"); permissionLedger = { file, ...initializeOwnedChildLifecycleFile(file) };
    const readers = () => readOwnedChildLifecycleFile(file, permissionLedger.identity);
    const observeExecutable = (force = false) => withOwnedSyncLifecycle(permissionLedger,
      () => observeInputFile(executable, { readOnlyExecutable: true, force }));
    const expectedReaders = process.platform === "darwin" ? 3 : 1;
    beginCanonicalTestResourceUse(owner); permissionUseStarted = true;
    const first = observeExecutable(); assert.equal(readers().started_count, expectedReaders);
    assert.deepEqual(observeExecutable(), first); assert.equal(readers().started_count, expectedReaders, "stable exact metadata reuses permission fingerprint");
    observeExecutable(true); assert.equal(readers().started_count, expectedReaders * 3, "forced observation probes before and after the content read");
    fs.chmodSync(executable, 0o500);
    const changedMode = observeExecutable(); assert.equal(readers().started_count, expectedReaders * 4);
    assert.equal(classifyInputChange(first, changedMode, { classification: "execution", readOnlyExecutable: true }), "safety_violation");
    if (process.platform === "darwin") {
      const mutateAcl = args => withOwnedSyncLifecycle(permissionLedger, () => {
        const result = runOwnedSyncChild("/bin/chmod", args, { timeout: 2000, encoding: "utf8" });
        assert.equal(result.status, 0); assert.equal(result.error, undefined);
      });
      try {
        mutateAcl(["+a", "everyone deny execute", executable]);
        const beforeAclRead = readers().started_count, changedAcl = observeExecutable();
        assert.equal(readers().started_count, beforeAclRead + expectedReaders, "actual ACL mutation invalidates permission cache");
        assert.equal(changedAcl.metadata.mode, changedMode.metadata.mode);
        assert.notEqual(changedAcl.permission_identity, changedMode.permission_identity);
        assert.equal(classifyInputChange(changedMode, changedAcl, { classification: "execution", readOnlyExecutable: true }), "safety_violation");
      } finally { mutateAcl(["-N", executable]); }
    }
    assert.equal(readers().complete, true, "every permission/control subprocess has terminal settlement");
  }
  console.log(JSON.stringify({ status: "pass", controls: ["complete-private-tree-consumption", "internal-links-bound",
    "forced-full-rehash", "freeze-flag-and-force-forwarding", "content-change-latches", "mode-change-blocks",
    "external-link-and-root-alias-and-hardlink-refused", "missing-invalid-role-and-incomplete-evidence-refused",
    "read-race-refused", "byte-and-entry-bounds", "legacy-unflagged-observation-preserved",
    "permission-readers-ledgered", "permission-cache-exact-metadata", "forced-permission-reprobe", "mode-and-acl-cache-invalidation"],
    owner_group_control: groupControl, deciding: false }));
} catch (error) { primary = error; }
finally {
  fs.readFileSync = originalRead; syncBuiltinESMExports();
  if (permissionUseStarted) {
    const evidence = readOwnedChildLifecycleFile(permissionLedger.file, permissionLedger.identity);
    if (evidence.started_count && !evidence.complete) throw new AggregateError([...(primary ? [primary] : []),
      new Error("permission reader settlement UNKNOWN; owned fixture root preserved")], "input control cleanup refused");
    settleCanonicalTestResourceUse(owner, { exit_observed: true, streams_closed: true, cleanup_completed: true, remaining_owned_processes: 0 });
  }
  const cleanup = cleanupCanonicalTestResources([owner])[0];
  if (primary || !cleanup.completed) throw new AggregateError([...(primary ? [primary] : []),
    ...(!cleanup.completed ? [new Error(cleanup.failures.join(","))] : [])], "input tree control or cleanup failed");
}
assert.equal(fs.existsSync(owner.root), false);
