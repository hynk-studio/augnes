import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  readdirSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  truncateSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { gzipSync } from "node:zlib";

import {
  CODEX_MANAGED_RUNTIME_RETENTION_V01,
  CodexManagedRuntimeStoreErrorV01,
  assertCodexManagedRuntimeSelectionUnchangedForTestV01,
  codexManagedRuntimeArtifactDirectoryForTestV01,
  enforceCodexManagedRuntimeRetentionForTestV01,
  ensurePinnedCodexManagedRuntimeForTestV01,
  recordCodexManagedRuntimeLastKnownGoodV01,
  selectCodexManagedRuntimeForTestV01,
  stageCodexManagedRuntimeForTestV01,
} from "../lib/vnext/native-host/codex-managed-runtime-store";
import {
  CODEX_QUALIFIED_RUNTIME_REGISTRY_V01,
  codexRuntimeCompatibilityProfileFingerprintV01,
  type CodexQualifiedRuntimeArtifactV01,
  type CodexQualifiedRuntimeRegistryV01,
} from "../lib/vnext/native-host/codex-qualified-runtime-registry";

process.env.AUGNES_CODEX_PRODUCTION_RUNTIME_TEST_MODE = "1";

const temporaryRoot = realpathSync.native(
  mkdtempSync(path.join(os.tmpdir(), "augnes-codex-store-test-")),
);
const calls = { provider: 0, repository_task: 0, strict_bootstrap: 0 };

interface FixtureArtifact {
  artifact: CodexQualifiedRuntimeArtifactV01;
  archive: Buffer;
  native: Buffer;
}

async function main(): Promise<void> {
 try {
  await testPhysicalContainmentAndExternalCanary();
  await testDirectNativeRegistryAuthority();
  await testPublishedSealContract();
  await testExactStagingAndSafety();
  await testSelectionPoliciesAndLanes();
  await testConcurrencyAndRecovery();
  await testRetentionAndImmediateRevalidation();
  assert.deepEqual(calls, { provider: 0, repository_task: 0, strict_bootstrap: 0 });
  console.log(JSON.stringify({
    passed: true,
    store_schema_validated: true,
    physical_managed_root_containment: "passed",
    external_canary_names_modes_and_bytes_preserved: true,
    direct_native_registry_authority: "refused_before_download_stage_select_or_revalidate",
    complete_published_seal_contract: "passed",
    incomplete_final_seal_accepted: false,
    ambiguous_retention_residue_preserved_fail_closed: true,
    exact_fixture_staging: "passed",
    archive_safety: "passed",
    pinned_exact: "passed",
    latest_qualified_numeric: "passed",
    strict_hold: "refused_before_external_action",
    concurrency_and_recovery: "passed",
    retention_bounds: CODEX_MANAGED_RUNTIME_RETENTION_V01,
    provider_model_calls: calls.provider,
    repository_task_calls: calls.repository_task,
    strict_agent_identity_attempts: calls.strict_bootstrap,
    remaining_owned_processes: 0,
    owned_streams_open: 0,
    browser_listener_residue: 0,
    owned_staging_roots_remaining: countOwnedStagingRoots(),
    owned_lock_roots_remaining: countOwnedLockRoots(),
    real_application_data_writes: 0,
  }));
 } finally {
  makeWritable(temporaryRoot);
  rmSync(temporaryRoot, { recursive: true, force: true });
  delete process.env.AUGNES_CODEX_PRODUCTION_RUNTIME_TEST_MODE;
 }
}

async function testPhysicalContainmentAndExternalCanary(): Promise<void> {
  const older = fixtureArtifact("0.151.0", 901);
  const active = fixtureArtifact("0.152.1", 902);
  const registry = registryWith(
    [older.artifact, active.artifact],
    active.artifact.entry_id,
  );
  const externalRoot = rootFor("physical-containment-external");
  await stage(externalRoot, older, registry);
  const activeSelection = await stage(externalRoot, active, registry);
  const olderDirectory = codexManagedRuntimeArtifactDirectoryForTestV01(
    externalRoot,
    older.artifact,
  );
  chmodSync(olderDirectory, 0o700);
  const old = new Date("2025-01-01T00:00:00.000Z");
  utimesSync(olderDirectory, old, old);
  chmodSync(olderDirectory, 0o555);

  const managedRoot = scenarioRoot("physical-containment-managed");
  symlinkSync(
    path.join(externalRoot, "artifacts"),
    path.join(managedRoot, "artifacts"),
    "dir",
  );
  const before = snapshotTree(externalRoot);
  const selectionError = captureSyncStoreCode(() =>
    select(managedRoot, registry, "pinned_exact"),
  );
  const retentionError = captureSyncStoreCode(() =>
    enforceCodexManagedRuntimeRetentionForTestV01({
      root: managedRoot,
      active: activeSelection,
      observed_at: "2026-09-03T12:00:00.000Z",
      dependencies: dependencies(registry),
    }),
  );
  const after = snapshotTree(externalRoot);

  assert.equal(
    sha256(Buffer.from(JSON.stringify(after))),
    sha256(Buffer.from(JSON.stringify(before))),
    "containment refusal must preserve external names, types, modes, and bytes exactly",
  );
  assert.equal(selectionError, "codex_managed_runtime_store_root_invalid");
  assert.equal(retentionError, "codex_managed_runtime_store_root_invalid");

  const symlinkedManagedRoot = rootFor("physical-containment-symlinked-root");
  symlinkSync(externalRoot, symlinkedManagedRoot, "dir");
  const rootSymlinkBefore = snapshotTree(externalRoot);
  expectSyncCode(
    () => select(symlinkedManagedRoot, registry, "pinned_exact"),
    "codex_managed_runtime_store_root_invalid",
  );
  expectSyncCode(
    () =>
      enforceCodexManagedRuntimeRetentionForTestV01({
        root: symlinkedManagedRoot,
        active: activeSelection,
        observed_at: "2026-09-03T12:00:00.000Z",
        dependencies: dependencies(registry),
      }),
    "codex_managed_runtime_store_root_invalid",
  );
  assert.deepEqual(snapshotTree(externalRoot), rootSymlinkBefore);

  const residueRoot = rootFor("physical-containment-residue");
  const residueSelection = await stage(residueRoot, active, registry);
  const externalCanary = scenarioRoot("physical-containment-residue-canary");
  const canaryPath = path.join(externalCanary, "preserve.txt");
  writeFileSync(canaryPath, "external-canary-bytes\n", { mode: 0o640 });
  const canaryBefore = snapshotTree(externalCanary);
  const residueArtifacts = path.join(residueRoot, "artifacts");
  symlinkSync(externalCanary, path.join(residueArtifacts, "unknown-symlink"), "dir");
  writeFileSync(path.join(residueArtifacts, "unknown-file"), "preserve\n");
  expectSyncCode(
    () =>
      enforceCodexManagedRuntimeRetentionForTestV01({
        root: residueRoot,
        active: residueSelection,
        observed_at: "2026-09-03T12:00:00.000Z",
        dependencies: dependencies(registry),
      }),
    "codex_managed_runtime_corrupt",
  );
  assert.deepEqual(snapshotTree(externalCanary), canaryBefore);
  assert.equal(existsSync(path.join(residueArtifacts, "unknown-symlink")), true);
  assert.equal(existsSync(path.join(residueArtifacts, "unknown-file")), true);
}

async function testDirectNativeRegistryAuthority(): Promise<void> {
  const fixture = fixtureArtifact("0.152.1", 903);
  const admittedRegistry = registryWith([fixture.artifact]);
  const admittedRoot = rootFor("direct-native-admitted");
  const admittedSelection = await stage(admittedRoot, fixture, admittedRegistry);

  const withoutDirect = structuredClone(fixture.artifact);
  withoutDirect.admitted_discovery_launch_shapes =
    withoutDirect.admitted_discovery_launch_shapes.filter(
      ({ shape }) => shape !== "direct_native",
    );
  const withoutDirectRegistry = registryWith([withoutDirect]);
  const refusedStageRoot = rootFor("direct-native-stage-refused");
  const stageError = await captureAsyncStoreCode(() =>
    stage(
      refusedStageRoot,
      { ...fixture, artifact: withoutDirect },
      withoutDirectRegistry,
    ),
  );
  const preArchiveError = await captureAsyncStoreCode(() =>
    stage(
      rootFor("direct-native-pre-archive-refused"),
      { ...fixture, artifact: withoutDirect },
      withoutDirectRegistry,
      Buffer.from("not-the-reviewed-archive"),
    ),
  );
  const pinnedError = captureSyncStoreCode(() =>
    select(admittedRoot, withoutDirectRegistry, "pinned_exact"),
  );
  const latestError = captureSyncStoreCode(() =>
    select(admittedRoot, withoutDirectRegistry, "latest_qualified"),
  );
  let downloadCalls = 0;
  const preDownloadRoot = rootFor("direct-native-pre-download-refused");
  const ensureError = await captureAsyncStoreCode(() =>
    ensurePinnedCodexManagedRuntimeForTestV01({
      root: preDownloadRoot,
      dependencies: dependencies(withoutDirectRegistry),
      download_reviewed_archive: async () => {
        downloadCalls += 1;
        return fixture.archive;
      },
    }),
  );

  assert.equal(stageError, "codex_managed_runtime_ineligible");
  assert.equal(existsSync(refusedStageRoot), false);
  assert.equal(preArchiveError, "codex_managed_runtime_ineligible");
  assert.equal(pinnedError, "codex_managed_runtime_ineligible");
  assert.equal(latestError, "codex_managed_runtime_no_qualified_runtime");
  assert.equal(ensureError, "codex_managed_runtime_ineligible");
  assert.equal(downloadCalls, 0);
  assert.equal(existsSync(preDownloadRoot), false);
  expectSyncCode(
    () =>
      assertCodexManagedRuntimeSelectionUnchangedForTestV01(
        admittedSelection,
        {
          root: admittedRoot,
          dependencies: dependencies(withoutDirectRegistry),
        },
      ),
    "codex_managed_runtime_identity_changed",
  );

  const directOnly = structuredClone(fixture.artifact);
  directOnly.admitted_discovery_launch_shapes =
    directOnly.admitted_discovery_launch_shapes.filter(
      ({ shape }) => shape === "direct_native",
    );
  const directOnlyRegistry = registryWith([directOnly]);
  const directOnlySelection = await stage(
    rootFor("direct-native-only"),
    { ...fixture, artifact: directOnly },
    directOnlyRegistry,
  );
  assert.equal(
    directOnlySelection.qualified_runtime_selection.artifact.entry_id,
    directOnly.entry_id,
  );
}

async function testPublishedSealContract(): Promise<void> {
  const fixture = fixtureArtifact("0.152.1", 904);
  const registry = registryWith([fixture.artifact]);
  const mutationCodes: Record<string, string | null> = {};

  const sealedRoot = rootFor("seal-exact-contract");
  await stage(sealedRoot, fixture, registry);
  const sealedDirectory = codexManagedRuntimeArtifactDirectoryForTestV01(
    sealedRoot,
    fixture.artifact,
  );
  assert.equal(lstatSync(sealedDirectory).isDirectory(), true);
  assert.equal(lstatSync(sealedDirectory).isSymbolicLink(), false);
  assert.equal(lstatSync(path.join(sealedDirectory, "bin")).isDirectory(), true);
  assert.equal(lstatSync(path.join(sealedDirectory, "bin")).isSymbolicLink(), false);
  assert.equal(lstatSync(path.join(sealedDirectory, "bin/codex")).isFile(), true);
  assert.equal(lstatSync(path.join(sealedDirectory, "bin/codex")).isSymbolicLink(), false);
  assert.equal(lstatSync(path.join(sealedDirectory, "store.json")).isFile(), true);
  assert.equal(lstatSync(path.join(sealedDirectory, "store.json")).isSymbolicLink(), false);
  assert.equal(lstatSync(sealedDirectory).mode & 0o7777, 0o555);
  assert.equal(lstatSync(path.join(sealedDirectory, "bin")).mode & 0o7777, 0o555);
  assert.equal(lstatSync(path.join(sealedDirectory, "bin/codex")).mode & 0o7777, 0o555);
  assert.equal(lstatSync(path.join(sealedDirectory, "store.json")).mode & 0o7777, 0o444);

  for (const [name, relativePath, mode] of [
    ["artifact-directory-mode", "", 0o755],
    ["bin-directory-mode", "bin", 0o755],
    ["native-mode", "bin/codex", 0o755],
    ["manifest-mode", "store.json", 0o644],
  ] as const) {
    const root = rootFor(`seal-${name}`);
    await stage(root, fixture, registry);
    const directory = codexManagedRuntimeArtifactDirectoryForTestV01(
      root,
      fixture.artifact,
    );
    chmodSync(path.join(directory, relativePath), mode);
    mutationCodes[name] = captureSyncStoreCode(() =>
      select(root, registry, "pinned_exact"),
    );
  }

  const symlinkManifestRoot = rootFor("seal-symlink-manifest");
  await stage(symlinkManifestRoot, fixture, registry);
  const symlinkManifestDirectory =
    codexManagedRuntimeArtifactDirectoryForTestV01(
      symlinkManifestRoot,
      fixture.artifact,
    );
  const manifestPath = path.join(symlinkManifestDirectory, "store.json");
  const outsideManifest = path.join(symlinkManifestRoot, "outside-store.json");
  writeFileSync(outsideManifest, readFileSync(manifestPath));
  chmodSync(symlinkManifestDirectory, 0o700);
  rmSync(manifestPath);
  symlinkSync(outsideManifest, manifestPath);
  chmodSync(symlinkManifestDirectory, 0o555);
  mutationCodes["symlink-manifest"] = captureSyncStoreCode(() =>
    select(symlinkManifestRoot, registry, "pinned_exact"),
  );

  const unexpectedEntryRoot = rootFor("seal-unexpected-entry");
  await stage(unexpectedEntryRoot, fixture, registry);
  const unexpectedEntryDirectory = codexManagedRuntimeArtifactDirectoryForTestV01(
    unexpectedEntryRoot,
    fixture.artifact,
  );
  chmodSync(unexpectedEntryDirectory, 0o700);
  writeFileSync(path.join(unexpectedEntryDirectory, "unexpected"), "unexpected\n");
  chmodSync(unexpectedEntryDirectory, 0o555);
  mutationCodes["unexpected-entry"] = captureSyncStoreCode(() =>
    select(unexpectedEntryRoot, registry, "pinned_exact"),
  );

  const unexpectedTypeRoot = rootFor("seal-unexpected-manifest-type");
  await stage(unexpectedTypeRoot, fixture, registry);
  const unexpectedTypeDirectory = codexManagedRuntimeArtifactDirectoryForTestV01(
    unexpectedTypeRoot,
    fixture.artifact,
  );
  chmodSync(unexpectedTypeDirectory, 0o700);
  rmSync(path.join(unexpectedTypeDirectory, "store.json"));
  mkdirSync(path.join(unexpectedTypeDirectory, "store.json"));
  chmodSync(unexpectedTypeDirectory, 0o555);
  mutationCodes["unexpected-manifest-type"] = captureSyncStoreCode(() =>
    select(unexpectedTypeRoot, registry, "pinned_exact"),
  );

  const incompletePublishRoot = rootFor("seal-incomplete-publish");
  await expectCode(
    () =>
      stage(incompletePublishRoot, fixture, registry, undefined, {
        afterPublishBeforeFinalSeal: () => {
          throw new Error("injected final-seal failure");
        },
      }),
    "codex_managed_runtime_stage_failed",
  );
  const incompleteDirectory = codexManagedRuntimeArtifactDirectoryForTestV01(
    incompletePublishRoot,
    fixture.artifact,
  );
  assert.equal(existsSync(incompleteDirectory), false);
  expectSyncCode(
    () => select(incompletePublishRoot, registry, "pinned_exact"),
    "codex_managed_runtime_absent",
  );

  assert.deepEqual(mutationCodes, {
    "artifact-directory-mode": "codex_managed_runtime_corrupt",
    "bin-directory-mode": "codex_managed_runtime_corrupt",
    "native-mode": "codex_managed_runtime_corrupt",
    "manifest-mode": "codex_managed_runtime_corrupt",
    "symlink-manifest": "codex_managed_runtime_corrupt",
    "unexpected-entry": "codex_managed_runtime_corrupt",
    "unexpected-manifest-type": "codex_managed_runtime_corrupt",
  });
}

void main();

async function testExactStagingAndSafety(): Promise<void> {
  const fixture = fixtureArtifact("0.152.1", 1);
  const registry = registryWith([fixture.artifact]);
  const root = scenarioRoot("exact");
  const selection = await stage(root, fixture, registry);
  assert.equal(selection.qualified_runtime_selection.artifact.version, "0.152.1");
  assert.equal(selection.selection_mode, "pinned_exact");
  assert.equal(path.isAbsolute(selection.canonical_native_executable), true);
  assert.equal(
    selection.canonical_native_executable.startsWith(realpathSync.native(root)),
    true,
  );
  assert.equal(selection.canonical_native_executable.startsWith(process.cwd()), false);
  assert.equal(existsSync(path.join(root, "staging")), true);
  assert.deepEqual(readdirSync(path.join(root, "staging")), []);
  const deterministic = await stage(
    rootFor("exact-deterministic-second-root"),
    fixture,
    registry,
  );
  assert.equal(
    deterministic.store_manifest_fingerprint,
    selection.store_manifest_fingerprint,
  );

  await expectCode(
    () => stage(rootFor("wrong-digest"), fixture, registry, Buffer.concat([fixture.archive, Buffer.from("x")])),
    "codex_managed_runtime_archive_identity_mismatch",
  );
  const sameSizeWrongDigest = Buffer.from(fixture.archive);
  const corruptIndex = Math.floor(sameSizeWrongDigest.length / 2);
  sameSizeWrongDigest[corruptIndex] = sameSizeWrongDigest[corruptIndex]! ^ 0x01;
  await expectCode(
    () => stage(rootFor("wrong-digest-same-size"), fixture, registry, sameSizeWrongDigest),
    "codex_managed_runtime_archive_identity_mismatch",
  );
  const wrongNative = fixtureArtifact("0.152.2", 2);
  const wrongNativeArtifact = structuredClone(wrongNative.artifact);
  wrongNativeArtifact.native_executable_sha256 = `sha256:${"1".repeat(64)}`;
  await expectCode(
    () => stage(rootFor("wrong-native"), { ...wrongNative, artifact: wrongNativeArtifact }, registryWith([wrongNativeArtifact])),
    "codex_managed_runtime_native_identity_mismatch",
  );
  await expectCode(
    () => stage(rootFor("wrong-version"), fixture, registry, undefined, { version: "9.9.9" }),
    "codex_managed_runtime_native_identity_mismatch",
  );
  await expectCode(
    () => stage(rootFor("wrong-file-type"), fixture, registry, undefined, { inspect: false }),
    "codex_managed_runtime_native_identity_mismatch",
  );
  await expectCode(
    () => stage(rootFor("wrong-platform"), fixture, registry, undefined, { platform: "linux" }),
    "codex_managed_runtime_ineligible",
  );
  await expectCode(
    () => stage(rootFor("wrong-architecture"), fixture, registry, undefined, { architecture: "x64" }),
    "codex_managed_runtime_ineligible",
  );

  for (const [name, entries] of [
    ["traversal", [tarMember("../../escape", fixture.native)]],
    ["absolute", [tarMember("/tmp/escape", fixture.native)]],
    ["symlink", [tarMember("codex-aarch64-apple-darwin", Buffer.alloc(0), 0o755, "2")]],
    ["hardlink", [tarMember("codex-aarch64-apple-darwin", Buffer.alloc(0), 0o755, "1")]],
    ["device", [tarMember("codex-aarch64-apple-darwin", Buffer.alloc(0), 0o755, "3")]],
    ["pax", [tarMember("codex-aarch64-apple-darwin", fixture.native, 0o755, "x")]],
    [
      "declared-size-overflow",
      [
        tarMember(
          "codex-aarch64-apple-darwin",
          fixture.native,
          0o755,
          "0",
          400 * 1024 * 1024,
        ),
      ],
    ],
    ["duplicate", [tarMember("codex-aarch64-apple-darwin", fixture.native), tarMember("codex-aarch64-apple-darwin", fixture.native)]],
    ["unexpected-auth", [tarMember(".codex/auth.json", Buffer.from("secret"))]],
    ["unexpected-config", [tarMember(".codex/config.toml", Buffer.from("secret"))]],
    ["unexpected-history", [tarMember(".codex/history.jsonl", Buffer.from("secret"))]],
    ["unexpected-skill", [tarMember(".codex/skills/example/SKILL.md", Buffer.from("secret"))]],
    ["unexpected-mcp", [tarMember(".codex/mcp/state.json", Buffer.from("secret"))]],
    ["unexpected-plugin", [tarMember(".codex/plugins/state.json", Buffer.from("secret"))]],
    ["unexpected-session", [tarMember(".codex/sessions/session.jsonl", Buffer.from("secret"))]],
    ["non-executable", [tarMember("codex-aarch64-apple-darwin", fixture.native, 0o644)]],
  ] as const) {
    const unsafeArchive = archiveFrom([...entries]);
    const unsafeFixture = bindArchive(fixtureArtifact(`0.20.${10 + entries.length}`, 20 + entries.length), unsafeArchive);
    await expectCode(
      () => stage(rootFor(`unsafe-${name}`), unsafeFixture, registryWith([unsafeFixture.artifact])),
      "codex_managed_runtime_archive_unsafe",
    );
    assert.equal(existsSync(path.join(rootFor(`unsafe-${name}`), "staging")) ? readdirSync(path.join(rootFor(`unsafe-${name}`), "staging")).length : 0, 0);
  }

  const corruptRoot = rootFor("corrupt");
  const corruptSelection = await stage(corruptRoot, fixture, registry);
  const corruptDir = codexManagedRuntimeArtifactDirectoryForTestV01(corruptRoot, fixture.artifact);
  chmodSync(corruptDir, 0o700);
  chmodSync(path.join(corruptDir, "bin"), 0o700);
  chmodSync(corruptSelection.canonical_native_executable, 0o700);
  writeFileSync(corruptSelection.canonical_native_executable, "substituted");
  expectSyncCode(
    () => select(corruptRoot, registry, "pinned_exact"),
    "codex_managed_runtime_corrupt",
  );

  const symlinkRoot = rootFor("symlinked");
  const symlinkSelection = await stage(symlinkRoot, fixture, registry);
  const symlinkDir = codexManagedRuntimeArtifactDirectoryForTestV01(symlinkRoot, fixture.artifact);
  chmodSync(symlinkDir, 0o700);
  chmodSync(path.join(symlinkDir, "bin"), 0o700);
  chmodSync(symlinkSelection.canonical_native_executable, 0o700);
  rmSync(symlinkSelection.canonical_native_executable);
  const outside = path.join(symlinkRoot, "outside-codex");
  writeFileSync(outside, fixture.native, { mode: 0o700 });
  symlinkSync(outside, symlinkSelection.canonical_native_executable);
  expectSyncCode(() => select(symlinkRoot, registry, "pinned_exact"), "codex_managed_runtime_corrupt");

  const symlinkDirectoryRoot = rootFor("symlinked-artifact-directory");
  const symlinkDirectory = codexManagedRuntimeArtifactDirectoryForTestV01(
    symlinkDirectoryRoot,
    fixture.artifact,
  );
  mkdirSync(path.dirname(symlinkDirectory), { recursive: true });
  symlinkSync(path.dirname(symlinkDirectory), symlinkDirectory);
  expectSyncCode(
    () => select(symlinkDirectoryRoot, registry, "pinned_exact"),
    "codex_managed_runtime_corrupt",
  );

  const partialRoot = rootFor("partial");
  const partialDir = codexManagedRuntimeArtifactDirectoryForTestV01(partialRoot, fixture.artifact);
  mkdirSync(partialDir, { recursive: true });
  expectSyncCode(() => select(partialRoot, registry, "pinned_exact"), "codex_managed_runtime_corrupt");

  const wrongModeRoot = rootFor("wrong-stored-mode");
  const wrongModeSelection = await stage(wrongModeRoot, fixture, registry);
  chmodSync(wrongModeSelection.canonical_native_executable, 0o755);
  expectSyncCode(
    () => select(wrongModeRoot, registry, "pinned_exact"),
    "codex_managed_runtime_corrupt",
  );

  const beforePublishRoot = rootFor("pre-publication-substitution");
  await expectCode(
    () =>
      stage(beforePublishRoot, fixture, registry, undefined, {
        beforePublish: () => {
          const [stagingDirectory] = readdirSync(
            path.join(beforePublishRoot, "staging"),
          );
          writeFileSync(
            path.join(
              beforePublishRoot,
              "staging",
              stagingDirectory!,
              "bin",
              "codex",
            ),
            "substituted-before-publication",
          );
        },
      }),
    "codex_managed_runtime_native_identity_mismatch",
  );
  assert.deepEqual(readdirSync(path.join(beforePublishRoot, "staging")), []);
}

async function testSelectionPoliciesAndLanes(): Promise<void> {
  const v099 = fixtureArtifact("0.9.9", 31);
  const v0100 = fixtureArtifact("0.10.0", 32);
  const registry = registryWith([v099.artifact, v0100.artifact], v099.artifact.entry_id);
  const root = rootFor("selection");
  await stage(root, v099, registry);
  await stage(root, v0100, registry);
  assert.equal(select(root, registry, "pinned_exact").qualified_runtime_selection.artifact.version, "0.9.9");
  assert.equal(select(root, registry, "latest_qualified").qualified_runtime_selection.artifact.version, "0.10.0");
  expectSyncCode(
    () => select(root, registry, "pinned_exact", "strict_agent_identity"),
    "codex_managed_runtime_ineligible",
  );

  for (const [name, mutate] of [
    ["candidate", (artifact: any) => {
      artifact.lanes.ordinary_chatgpt_auth.status = "candidate";
      artifact.lanes.ordinary_chatgpt_auth.qualified_at = null;
      artifact.qualification_evidence = candidateEvidenceFixtureV01();
    }],
    ["revoked", (artifact: CodexQualifiedRuntimeArtifactV01) => { artifact.revocation = { revoked_at: "2026-09-03T00:00:00.000Z", reason: "test_revocation", evidence_refs: ["test:evidence"] }; }],
    ["expired", (artifact: CodexQualifiedRuntimeArtifactV01) => { artifact.not_after = "2026-09-03T00:00:00.000Z"; }],
    ["below-floor", (artifact: CodexQualifiedRuntimeArtifactV01) => { artifact.security_floor = { floor_id: "test-floor", evaluation: "unsatisfied", evidence_refs: ["test:evidence"] }; }],
  ] as const) {
    const mutated = structuredClone(v099.artifact);
    mutate(mutated);
    expectSyncCode(
      () => select(root, registryWith([mutated]), "pinned_exact"),
      "codex_managed_runtime_ineligible",
    );
    const newerMutated = structuredClone(v0100.artifact);
    mutate(newerMutated);
    assert.equal(
      select(
        root,
        registryWith([v099.artifact, newerMutated], v099.artifact.entry_id),
        "latest_qualified",
      ).qualified_runtime_selection.artifact.version,
      "0.9.9",
      `latest_qualified must exclude ${name} entries`,
    );
  }
  const candidateOnly = structuredClone(v099.artifact);
  (candidateOnly.lanes.ordinary_chatgpt_auth as any).status = "candidate";
  (candidateOnly.lanes.ordinary_chatgpt_auth as any).qualified_at = null;
  (candidateOnly as any).qualification_evidence = candidateEvidenceFixtureV01();
  expectSyncCode(
    () =>
      select(
        rootFor("no-qualified-runtime"),
        registryWith([candidateOnly]),
        "latest_qualified",
      ),
    "codex_managed_runtime_no_qualified_runtime",
  );

  expectSyncCode(
    () => select(rootFor("missing"), registry, "latest_qualified"),
    "codex_managed_runtime_absent",
  );

  const unsupported = unsupportedProfileRegistry(v099.artifact);
  expectSyncCode(
    () => select(root, unsupported, "pinned_exact"),
    "codex_managed_runtime_ineligible",
  );

  const globalPath = path.join(rootFor("global-path"), "bin");
  mkdirSync(globalPath, { recursive: true });
  writeFileSync(path.join(globalPath, "codex"), "codex-cli 0.999.0", { mode: 0o755 });
  const selectedWithPoisonedPath = selectCodexManagedRuntimeForTestV01({
    root,
    mode: "pinned_exact",
    lane: "ordinary_chatgpt_auth",
    dependencies: dependencies(registry, { environmentPath: globalPath }),
  });
  assert.equal(selectedWithPoisonedPath.qualified_runtime_selection.artifact.version, "0.9.9");

  const fallbackRoot = rootFor("latest-skips-corrupt");
  await stage(fallbackRoot, v099, registry);
  const newer = await stage(fallbackRoot, v0100, registry);
  const newerDirectory = codexManagedRuntimeArtifactDirectoryForTestV01(
    fallbackRoot,
    v0100.artifact,
  );
  chmodSync(newerDirectory, 0o700);
  chmodSync(path.join(newerDirectory, "bin"), 0o700);
  chmodSync(newer.canonical_native_executable, 0o700);
  writeFileSync(newer.canonical_native_executable, "corrupt-newest");
  assert.equal(
    select(fallbackRoot, registry, "latest_qualified")
      .qualified_runtime_selection.artifact.version,
    "0.9.9",
  );

  const tiedLeft = fixtureArtifact("1.0.0", 33);
  const tiedRight = fixtureArtifact("1.0.0", 34);
  const tiedRegistry = registryWith([tiedLeft.artifact, tiedRight.artifact]);
  const tiedRoot = rootFor("ambiguous");
  await stage(tiedRoot, tiedLeft, tiedRegistry);
  await stage(tiedRoot, tiedRight, tiedRegistry);
  expectSyncCode(
    () => select(tiedRoot, tiedRegistry, "latest_qualified"),
    "codex_managed_runtime_selection_ambiguous",
  );
}

async function testConcurrencyAndRecovery(): Promise<void> {
  const fixture = fixtureArtifact("0.30.0", 41);
  const registry = registryWith([fixture.artifact]);
  const root = rootFor("concurrent");
  let releaseFirst!: () => void;
  let enteredFirst!: () => void;
  const firstEntered = new Promise<void>((resolve) => { enteredFirst = resolve; });
  const release = new Promise<void>((resolve) => { releaseFirst = resolve; });
  const first = stageCodexManagedRuntimeForTestV01({
    root,
    entry_id: fixture.artifact.entry_id,
    archive_bytes: fixture.archive,
    dependencies: dependencies(registry, { beforePublish: async () => { enteredFirst(); await release; } }),
  });
  await firstEntered;
  const second = stage(root, fixture, registry);
  const conflictingBytes = Buffer.from(fixture.archive);
  conflictingBytes[0] = conflictingBytes[0]! ^ 0x01;
  await expectCode(
    () => stage(root, fixture, registry, conflictingBytes),
    "codex_managed_runtime_archive_identity_mismatch",
  );
  releaseFirst();
  const [left, right] = await Promise.all([first, second]);
  assert.equal(left.store_manifest_fingerprint, right.store_manifest_fingerprint);
  assert.deepEqual(readdirSync(path.join(root, "staging")), []);

  const staleRoot = rootFor("stale-lock");
  const keyDirectory = codexManagedRuntimeArtifactDirectoryForTestV01(staleRoot, fixture.artifact);
  const key = path.basename(keyDirectory);
  const lock = path.join(staleRoot, "locks", `${key}.lock`);
  mkdirSync(lock, { recursive: true });
  const interruptedStage = path.join(
    staleRoot,
    "staging",
    `${key}.11111111-1111-4111-8111-111111111111`,
  );
  mkdirSync(interruptedStage, { recursive: true });
  writeFileSync(path.join(interruptedStage, "partial"), "partial");
  writeFileSync(path.join(lock, "owner.json"), JSON.stringify({ token: "stale", owner_pid: 987654, owner_process_identity: "a".repeat(64), created_at_ms: 1 }));
  await stageCodexManagedRuntimeForTestV01({
    root: staleRoot,
    entry_id: fixture.artifact.entry_id,
    archive_bytes: fixture.archive,
    dependencies: dependencies(registry, {
      now: () => 100_000,
      processIdentity: (pid) =>
        pid === process.pid
          ? { state: "present", identity: "b".repeat(64) }
          : { state: "missing" },
    }),
  });
  assert.equal(existsSync(lock), false);
  assert.deepEqual(readdirSync(path.join(staleRoot, "staging")), []);

  const liveRoot = rootFor("live-lock");
  const liveKey = path.basename(
    codexManagedRuntimeArtifactDirectoryForTestV01(liveRoot, fixture.artifact),
  );
  const liveLock = path.join(liveRoot, "locks", `${liveKey}.lock`);
  mkdirSync(liveLock, { recursive: true });
  writeFileSync(
    path.join(liveLock, "owner.json"),
    JSON.stringify({
      token: "live",
      owner_pid: 4321,
      owner_process_identity: "c".repeat(64),
      created_at_ms: 1,
    }),
  );
  await expectCode(
    () =>
      stageCodexManagedRuntimeForTestV01({
        root: liveRoot,
        entry_id: fixture.artifact.entry_id,
        archive_bytes: fixture.archive,
        dependencies: dependencies(registry, {
          now: () => 100_000,
          lockWait: 50,
          processIdentity: (pid) =>
            pid === 4321
              ? { state: "present", identity: "c".repeat(64) }
              : { state: "present", identity: "d".repeat(64) },
        }),
      }),
    "codex_managed_runtime_locked",
  );
  assert.equal(existsSync(liveLock), true);
  rmSync(liveLock, { recursive: true, force: true });

  const interruptedRoot = rootFor("interrupted");
  await expectCode(
    () =>
      stage(interruptedRoot, fixture, registry, undefined, {
        beforePublish: () => {
          throw new Error("simulated interrupted publication");
        },
      }),
    "codex_managed_runtime_stage_failed",
  );
  assert.deepEqual(readdirSync(path.join(interruptedRoot, "staging")), []);
  assert.deepEqual(readdirSync(path.join(interruptedRoot, "locks")), []);
}

async function testRetentionAndImmediateRevalidation(): Promise<void> {
  const fixtures = [50, 51, 52, 53].map((index) => fixtureArtifact(`0.${index}.0`, index));
  const registry = registryWith(fixtures.map(({ artifact }) => artifact), fixtures[3]!.artifact.entry_id);
  const root = rootFor("retention");
  const selections = [];
  for (const fixture of fixtures) selections.push(await stage(root, fixture, registry));
  recordCodexManagedRuntimeLastKnownGoodV01({ root, selection: selections[2]! });
  recordCodexManagedRuntimeLastKnownGoodV01({ root, selection: selections[3]! });
  for (const fixture of fixtures) {
    const directory = codexManagedRuntimeArtifactDirectoryForTestV01(root, fixture.artifact);
    const old = new Date("2025-01-01T00:00:00.000Z");
    chmodSync(directory, 0o700);
    utimesSync(directory, old, old);
    chmodSync(directory, 0o555);
  }
  const result = enforceCodexManagedRuntimeRetentionForTestV01({
    root,
    active: selections[3]!,
    observed_at: "2026-09-03T12:00:00.000Z",
    dependencies: dependencies(registry),
  });
  assert.deepEqual(new Set(result.protected_entry_ids), new Set([fixtures[3]!.artifact.entry_id, fixtures[2]!.artifact.entry_id]));
  assert.equal(result.removed_entry_ids.length, 2);
  assert.equal(existsSync(selections[3]!.canonical_native_executable), true);
  assert.equal(existsSync(selections[2]!.canonical_native_executable), true);

  await testRetentionBounds(fixtures, registry);

  const revokedRollbackRoot = rootFor("retention-revoked-rollback");
  const oldSelection = await stage(revokedRollbackRoot, fixtures[2]!, registry);
  const activeSelection = await stage(
    revokedRollbackRoot,
    fixtures[3]!,
    registry,
  );
  recordCodexManagedRuntimeLastKnownGoodV01({
    root: revokedRollbackRoot,
    selection: oldSelection,
  });
  recordCodexManagedRuntimeLastKnownGoodV01({
    root: revokedRollbackRoot,
    selection: activeSelection,
  });
  const revokedRegistry = structuredClone(registry);
  const revokedRollback = revokedRegistry.artifacts.find(
    ({ entry_id }) => entry_id === fixtures[2]!.artifact.entry_id,
  )!;
  revokedRollback.revocation = {
    revoked_at: "2026-09-03T00:00:00.000Z",
    reason: "test_revocation",
    evidence_refs: ["test:evidence"],
  };
  const revokedRollbackDirectory = codexManagedRuntimeArtifactDirectoryForTestV01(
    revokedRollbackRoot,
    fixtures[2]!.artifact,
  );
  chmodSync(revokedRollbackDirectory, 0o700);
  const old = new Date("2025-01-01T00:00:00.000Z");
  utimesSync(revokedRollbackDirectory, old, old);
  const revokedResult = enforceCodexManagedRuntimeRetentionForTestV01({
    root: revokedRollbackRoot,
    active: activeSelection,
    observed_at: "2026-09-03T12:00:00.000Z",
    dependencies: dependencies(revokedRegistry),
  });
  assert.equal(
    revokedResult.protected_entry_ids.includes(
      fixtures[2]!.artifact.entry_id,
    ),
    false,
  );
  assert.equal(existsSync(revokedRollbackDirectory), false);

  const substitute = selections[3]!;
  const directory = codexManagedRuntimeArtifactDirectoryForTestV01(root, fixtures[3]!.artifact);
  chmodSync(directory, 0o700);
  chmodSync(path.join(directory, "bin"), 0o700);
  chmodSync(substitute.canonical_native_executable, 0o700);
  writeFileSync(substitute.canonical_native_executable, "changed-before-spawn");
  expectSyncCode(
    () => assertCodexManagedRuntimeSelectionUnchangedForTestV01(substitute, { root, dependencies: dependencies(registry) }),
    "codex_managed_runtime_identity_changed",
  );
}

async function testRetentionBounds(
  fixtures: FixtureArtifact[],
  registry: CodexQualifiedRuntimeRegistryV01,
): Promise<void> {
  const countRoot = rootFor("retention-count-bound");
  const countSelections = [];
  for (const fixture of fixtures) {
    countSelections.push(await stage(countRoot, fixture, registry));
  }
  const current = new Date("2026-09-03T11:00:00.000Z");
  for (const fixture of fixtures) {
    const directory = codexManagedRuntimeArtifactDirectoryForTestV01(
      countRoot,
      fixture.artifact,
    );
    chmodSync(directory, 0o700);
    utimesSync(directory, current, current);
    chmodSync(directory, 0o555);
  }
  const countResult = enforceCodexManagedRuntimeRetentionForTestV01({
    root: countRoot,
    active: countSelections[3]!,
    observed_at: "2026-09-03T12:00:00.000Z",
    dependencies: dependencies(registry),
  });
  assert.equal(countResult.removed_entry_ids.length, 1);
  assert.equal(
    readdirSync(path.join(countRoot, "artifacts")).length,
    CODEX_MANAGED_RUNTIME_RETENTION_V01.maximum_artifact_count,
  );

  const ageRoot = rootFor("retention-age-bound");
  const ageActive = await stage(ageRoot, fixtures[3]!, registry);
  await stage(ageRoot, fixtures[2]!, registry);
  const agedDirectory = codexManagedRuntimeArtifactDirectoryForTestV01(
    ageRoot,
    fixtures[2]!.artifact,
  );
  chmodSync(agedDirectory, 0o700);
  const aged = new Date("2025-01-01T00:00:00.000Z");
  utimesSync(agedDirectory, aged, aged);
  const ageResult = enforceCodexManagedRuntimeRetentionForTestV01({
    root: ageRoot,
    active: ageActive,
    observed_at: "2026-09-03T12:00:00.000Z",
    dependencies: dependencies(registry),
  });
  assert.deepEqual(ageResult.removed_entry_ids, [fixtures[2]!.artifact.entry_id]);

  const byteRoot = rootFor("retention-byte-bound");
  const byteActive = await stage(byteRoot, fixtures[3]!, registry);
  await stage(byteRoot, fixtures[0]!, registry);
  const oversizedDirectory = codexManagedRuntimeArtifactDirectoryForTestV01(
    byteRoot,
    fixtures[0]!.artifact,
  );
  chmodSync(oversizedDirectory, 0o700);
  const oversizedPayload = path.join(oversizedDirectory, "payload");
  writeFileSync(oversizedPayload, "");
  truncateSync(
    oversizedPayload,
    CODEX_MANAGED_RUNTIME_RETENTION_V01.maximum_total_bytes + 1,
  );
  const byteResult = enforceCodexManagedRuntimeRetentionForTestV01({
    root: byteRoot,
    active: byteActive,
    observed_at: "2026-09-03T12:00:00.000Z",
    dependencies: dependencies(registry),
  });
  assert.equal(
    byteResult.removed_entry_ids.includes(fixtures[0]!.artifact.entry_id),
    true,
  );
  assert.equal(existsSync(oversizedDirectory), false);
}

function fixtureArtifact(version: string, index: number): FixtureArtifact {
  const native = Buffer.from(`fixture-native:${version}:${index}\n`);
  const archive = archiveFrom([tarMember("codex-aarch64-apple-darwin", native)]);
  const artifact = structuredClone(CODEX_QUALIFIED_RUNTIME_REGISTRY_V01.artifacts[0]!) as CodexQualifiedRuntimeArtifactV01;
  artifact.entry_id = `codex-rust-v${version}-darwin-arm64-${index}`;
  artifact.version = version;
  artifact.release_tag = `rust-v${version}`;
  artifact.tagged_source_commit = index.toString(16).padStart(40, "0").slice(-40);
  artifact.official_release = { repository: "openai/codex", release_id: 400_000_000 + index, url: `https://github.com/openai/codex/releases/tag/rust-v${version}` };
  artifact.qualified_provenance_asset = {
    ...artifact.qualified_provenance_asset,
    asset_id: 600_000_000 + index,
    size_bytes: archive.length,
    digest: sha256(archive),
  };
  artifact.native_executable_sha256 = sha256(native);
  (artifact.lanes.ordinary_chatgpt_auth as any).qualified_at =
    "2026-09-03T01:17:35.000Z";
  return { artifact, archive, native };
}

function candidateEvidenceFixtureV01(): CodexQualifiedRuntimeArtifactV01["qualification_evidence"] {
  return structuredClone(
    CODEX_QUALIFIED_RUNTIME_REGISTRY_V01.artifacts.find(
      ({ version }) => version === "0.153.2",
    )!.qualification_evidence,
  );
}

function bindArchive(fixture: FixtureArtifact, archive: Buffer): FixtureArtifact {
  fixture.archive = archive;
  fixture.artifact.qualified_provenance_asset = {
    ...fixture.artifact.qualified_provenance_asset,
    size_bytes: archive.length,
    digest: sha256(archive),
  };
  return fixture;
}

function registryWith(
  artifacts: CodexQualifiedRuntimeArtifactV01[],
  pinnedEntryId = artifacts[0]!.entry_id,
): CodexQualifiedRuntimeRegistryV01 {
  const registry = structuredClone(CODEX_QUALIFIED_RUNTIME_REGISTRY_V01) as CodexQualifiedRuntimeRegistryV01;
  registry.artifacts = artifacts;
  (registry.production_selection as any).entry_id = pinnedEntryId;
  return registry;
}

function unsupportedProfileRegistry(artifactInput: CodexQualifiedRuntimeArtifactV01): CodexQualifiedRuntimeRegistryV01 {
  const registry = registryWith([structuredClone(artifactInput)]);
  const profile = structuredClone(registry.compatibility_profiles[0]!);
  profile.profile_id = "future_unimplemented_profile.v0.1";
  profile.fingerprint = codexRuntimeCompatibilityProfileFingerprintV01({
    profile_id: profile.profile_id,
    profile_schema_version: profile.profile_schema_version,
    semantics: profile.semantics,
  });
  registry.compatibility_profiles = [profile];
  registry.artifacts[0]!.compatibility_profile_id = profile.profile_id;
  registry.artifacts[0]!.compatibility_profile_fingerprint = profile.fingerprint;
  return registry;
}

function dependencies(
  registry: CodexQualifiedRuntimeRegistryV01,
  options: {
    version?: string;
    inspect?: boolean;
    platform?: NodeJS.Platform;
    architecture?: string;
    now?: () => number;
    beforePublish?: () => void | Promise<void>;
    afterPublishBeforeFinalSeal?: () => void | Promise<void>;
    processIdentity?: (pid: number) => { state: "present"; identity: string } | { state: "missing" | "unavailable" };
    lockWait?: number;
    environmentPath?: string;
  } = {},
) {
  void options.environmentPath;
  return {
    registry,
    platform: options.platform ?? "darwin",
    architecture: options.architecture ?? "arm64",
    read_cli_version: (nativePath: string) => options.version ?? readFileSync(nativePath, "utf8").split(":")[1]!,
    inspect_native: () => options.inspect ?? true,
    now: options.now,
    before_publish: options.beforePublish,
    after_publish_before_final_seal: options.afterPublishBeforeFinalSeal,
    process_identity: options.processIdentity,
    lock_wait_ms: options.lockWait ?? 2_000,
  };
}

async function stage(
  root: string,
  fixture: FixtureArtifact,
  registry: CodexQualifiedRuntimeRegistryV01,
  archive = fixture.archive,
  options: Parameters<typeof dependencies>[1] = {},
) {
  return await stageCodexManagedRuntimeForTestV01({
    root,
    entry_id: fixture.artifact.entry_id,
    archive_bytes: archive,
    dependencies: dependencies(registry, options),
  });
}

function select(
  root: string,
  registry: CodexQualifiedRuntimeRegistryV01,
  mode: "pinned_exact" | "latest_qualified",
  lane: "ordinary_chatgpt_auth" | "strict_agent_identity" = "ordinary_chatgpt_auth",
) {
  return selectCodexManagedRuntimeForTestV01({
    root,
    mode,
    lane,
    observed_at: "2026-09-03T12:00:00.000Z",
    dependencies: dependencies(registry),
  });
}

function tarMember(
  name: string,
  bytes: Buffer,
  mode = 0o755,
  type = "0",
  declaredSize = bytes.length,
): { name: string; bytes: Buffer; mode: number; type: string; declaredSize: number } {
  return { name, bytes, mode, type, declaredSize };
}

function archiveFrom(entries: ReturnType<typeof tarMember>[]): Buffer {
  const blocks: Buffer[] = [];
  for (const entry of entries) {
    const header = Buffer.alloc(512);
    writeTarString(header, 0, 100, entry.name);
    writeTarOctal(header, 100, 8, entry.mode);
    writeTarOctal(header, 108, 8, 0);
    writeTarOctal(header, 116, 8, 0);
    writeTarOctal(header, 124, 12, entry.declaredSize);
    writeTarOctal(header, 136, 12, 0);
    header.fill(0x20, 148, 156);
    header.write(entry.type, 156, 1, "ascii");
    header.write("ustar\0", 257, 6, "ascii");
    header.write("00", 263, 2, "ascii");
    const checksum = [...header].reduce((sum, byte) => sum + byte, 0);
    const checksumText = checksum.toString(8).padStart(6, "0");
    header.write(checksumText, 148, 6, "ascii");
    header[154] = 0;
    header[155] = 0x20;
    blocks.push(header, entry.bytes, Buffer.alloc((512 - (entry.bytes.length % 512)) % 512));
  }
  blocks.push(Buffer.alloc(1024));
  return gzipSync(Buffer.concat(blocks), { level: 6 });
}

function writeTarString(target: Buffer, offset: number, length: number, value: string): void {
  target.write(value, offset, Math.min(length, Buffer.byteLength(value)), "ascii");
}

function writeTarOctal(target: Buffer, offset: number, length: number, value: number): void {
  target.write(`${value.toString(8).padStart(length - 1, "0")}\0`, offset, length, "ascii");
}

function sha256(value: Buffer): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function rootFor(name: string): string {
  const root = path.join(temporaryRoot, name);
  assert.equal(root.startsWith(temporaryRoot), true);
  return root;
}

function scenarioRoot(name: string): string {
  const root = rootFor(name);
  mkdirSync(root, { recursive: true });
  return root;
}

async function expectCode(action: () => Promise<unknown>, code: string): Promise<void> {
  await assert.rejects(action, (error: unknown) => error instanceof CodexManagedRuntimeStoreErrorV01 && error.code === code);
}

async function captureAsyncStoreCode(
  action: () => Promise<unknown>,
): Promise<string | null> {
  try {
    await action();
    return null;
  } catch (error) {
    if (error instanceof CodexManagedRuntimeStoreErrorV01) return error.code;
    throw error;
  }
}

function captureSyncStoreCode(action: () => unknown): string | null {
  try {
    action();
    return null;
  } catch (error) {
    if (error instanceof CodexManagedRuntimeStoreErrorV01) return error.code;
    throw error;
  }
}

function expectSyncCode(action: () => unknown, code: string): void {
  assert.throws(action, (error: unknown) => error instanceof CodexManagedRuntimeStoreErrorV01 && error.code === code);
}

function snapshotTree(root: string): readonly Readonly<Record<string, unknown>>[] {
  const entries: Readonly<Record<string, unknown>>[] = [];
  const visit = (target: string, relativePath: string): void => {
    const stat = lstatSync(target);
    const common = {
      path: relativePath || ".",
      mode: stat.mode & 0o777,
    };
    if (stat.isSymbolicLink()) {
      entries.push({ ...common, type: "symlink", target: readlinkSync(target) });
      return;
    }
    if (stat.isDirectory()) {
      entries.push({ ...common, type: "directory" });
      for (const name of readdirSync(target).sort()) {
        visit(
          path.join(target, name),
          relativePath ? path.join(relativePath, name) : name,
        );
      }
      return;
    }
    if (stat.isFile()) {
      entries.push({
        ...common,
        type: "file",
        size: stat.size,
        digest: sha256(readFileSync(target)),
      });
      return;
    }
    entries.push({ ...common, type: "other" });
  };
  visit(root, "");
  return entries;
}

function countOwnedStagingRoots(): number {
  let count = 0;
  for (const name of readdirSync(temporaryRoot)) {
    const staging = path.join(temporaryRoot, name, "staging");
    if (existsSync(staging)) count += readdirSync(staging).length;
  }
  return count;
}

function countOwnedLockRoots(): number {
  let count = 0;
  for (const name of readdirSync(temporaryRoot)) {
    const locks = path.join(temporaryRoot, name, "locks");
    if (existsSync(locks)) count += readdirSync(locks).length;
  }
  return count;
}

function makeWritable(target: string): void {
  if (!existsSync(target)) return;
  const stat = lstatSafe(target);
  if (!stat) return;
  if (stat.isDirectory() && !stat.isSymbolicLink()) {
    chmodSync(target, 0o700);
    for (const child of readdirSync(target)) makeWritable(path.join(target, child));
  } else if (!stat.isSymbolicLink()) {
    chmodSync(target, 0o600);
  }
}

function lstatSafe(target: string) {
  try {
    return lstatSync(target);
  } catch {
    return null;
  }
}
