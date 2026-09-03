import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

import { probeCodexIsolatedAuthCredentialFreeCompatibilityV01 } from "../lib/vnext/native-host/codex-app-server-adapter";
import {
  assertCodexManagedRuntimeSelectionUnchangedV01,
  ensurePinnedCodexManagedRuntimeV01,
  selectCodexManagedRuntimeV01,
} from "../lib/vnext/native-host/codex-managed-runtime-store";
import {
  assertCodexProductionRuntimeIdentityUnchangedV01,
  resolveCodexProductionRuntimeV01,
} from "../lib/vnext/native-host/codex-production-runtime";
import { CODEX_QUALIFIED_RUNTIME_REGISTRY_V01 } from "../lib/vnext/native-host/codex-qualified-runtime-registry";

const REQUIRED_FLAG = "--exact-reviewed-official-0.152.1";
const EXPECTED_URL =
  "https://github.com/openai/codex/releases/download/rust-v0.152.1/codex-aarch64-apple-darwin.tar.gz";
const EXPECTED_ARCHIVE_SIZE = 86_499_260;
const EXPECTED_ARCHIVE_DIGEST =
  "sha256:8ddde1fcf5c9842e9baa09c7c108088bb22a39feb86e4344e45dc0986764b9d7";
const EXPECTED_NATIVE_DIGEST =
  "sha256:8194ea3181f330e63023b234b0b231855e5874e0331c5ef7cbc490591497a7bf";

async function main(): Promise<void> {
  if (process.argv.slice(2).length !== 1 || process.argv[2] !== REQUIRED_FLAG) {
    throw new Error("official_managed_runtime_canary_explicit_flag_required");
  }
  if (process.platform !== "darwin" || process.arch !== "arm64") {
    throw new Error("official_managed_runtime_canary_platform_unsupported");
  }

  const artifact = CODEX_QUALIFIED_RUNTIME_REGISTRY_V01.artifacts[0]!;
  assert.equal(artifact.version, "0.152.1");
  assert.equal(artifact.release_tag, "rust-v0.152.1");
  assert.equal(
    artifact.tagged_source_commit,
    "5adb68a49933ae446bf11935662c83dba55a0804",
  );
  assert.equal(artifact.qualified_provenance_asset.size_bytes, EXPECTED_ARCHIVE_SIZE);
  assert.equal(artifact.qualified_provenance_asset.digest, EXPECTED_ARCHIVE_DIGEST);
  assert.equal(artifact.native_executable_sha256, EXPECTED_NATIVE_DIGEST);

  const disposableRoot = realpathSync.native(
    mkdtempSync(path.join(os.tmpdir(), "augnes-codex-official-canary-")),
  );
  const managedRoot = path.join(disposableRoot, "managed-store");
  const poisonPath = path.join(disposableRoot, "poison-path");
  const probeStateParent = path.join(disposableRoot, "credential-free-state");
  mkdirSync(poisonPath, { mode: 0o700 });
  mkdirSync(probeStateParent, { mode: 0o700 });
  const poisonCodex = path.join(poisonPath, "codex");
  writeFileSync(poisonCodex, "#!/bin/sh\nexit 91\n", { mode: 0o755 });

  const environment: NodeJS.ProcessEnv = {
    NODE_ENV: "production",
    PATH: poisonPath,
    LANG: "C",
    LC_ALL: "C",
    TZ: "UTC",
    NO_COLOR: "1",
    AUGNES_MANAGED_CODEX_RUNTIME_ROOT: managedRoot,
  };
  const originalFetch = globalThis.fetch;
  let acquisitionCalls = 0;
  let requestedUrl: string | null = null;
  let observedArchiveSize: number | null = null;
  let observedArchiveDigest: string | null = null;
  let installedPath: string | null = null;
  let probeState: string | null = null;
  let probeCleanup = false;
  try {
    globalThis.fetch = (async (input, init) => {
      acquisitionCalls += 1;
      requestedUrl =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;
      assert.equal(requestedUrl, EXPECTED_URL);
      const response = await originalFetch(input, init);
      const bytes = Buffer.from(await response.arrayBuffer());
      observedArchiveSize = bytes.length;
      observedArchiveDigest = sha256(bytes);
      return new Response(bytes, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    }) as typeof fetch;

    const first = await ensurePinnedCodexManagedRuntimeV01({
      root: managedRoot,
      environment,
    });
    installedPath = first.canonical_native_executable;
    assert.equal(acquisitionCalls, 1);
    assert.equal(observedArchiveSize, EXPECTED_ARCHIVE_SIZE);
    assert.equal(observedArchiveDigest, EXPECTED_ARCHIVE_DIGEST);
    assert.equal(sha256(readFileSync(installedPath)), EXPECTED_NATIVE_DIGEST);
    assertSealedTree(managedRoot, installedPath);
    assertCodexManagedRuntimeSelectionUnchangedV01(first, {
      root: managedRoot,
      environment,
    });

    const second = await ensurePinnedCodexManagedRuntimeV01({
      root: managedRoot,
      environment,
    });
    assert.equal(acquisitionCalls, 1);
    assert.equal(second.canonical_native_executable, installedPath);
    const selected = selectCodexManagedRuntimeV01({
      root: managedRoot,
      mode: "pinned_exact",
      lane: "ordinary_chatgpt_auth",
      environment,
    });
    assert.equal(selected.canonical_native_executable, installedPath);
    assertCodexManagedRuntimeSelectionUnchangedV01(selected, {
      root: managedRoot,
      environment,
    });

    const production = resolveCodexProductionRuntimeV01({ environment });
    assert.equal(production.runtime_ownership, "managed_store");
    assert.equal(production.launch_shape, "direct_native");
    assert.equal(production.canonical_native_executable, installedPath);
    assert.equal(production.cli_version, "0.152.1");
    assert.equal(production.admission.path_candidate, installedPath);
    assert.notEqual(production.canonical_native_executable, poisonCodex);
    assertCodexProductionRuntimeIdentityUnchangedV01(production);

    const probe = await probeCodexIsolatedAuthCredentialFreeCompatibilityV01({
      command: installedPath,
      expected_executable_fingerprint: EXPECTED_NATIVE_DIGEST,
      executable_identity_class: "production_pinned_codex",
      state_parent: realpathSync.native(probeStateParent),
      repository_root: realpathSync.native(process.cwd()),
      base_environment: {
        PATH: poisonPath,
        LANG: "C",
        LC_ALL: "C",
        TZ: "UTC",
        NO_COLOR: "1",
      },
    });
    probeState = probe.state;
    probeCleanup = probe.cleanup_completed;
    assert.equal(probe.state, "compatible_exact");
    assert.equal(probe.cleanup_completed, true);
    assert.deepEqual(readdirSync(probeStateParent), []);

    console.log(
      JSON.stringify({
        passed: true,
        requested_url: requestedUrl,
        acquisition_calls: acquisitionCalls,
        observed_archive_size_bytes: observedArchiveSize,
        observed_archive_sha256: observedArchiveDigest,
        observed_native_sha256: sha256(readFileSync(installedPath)),
        observed_cli_version: production.cli_version,
        installed_disposable_native_path: installedPath,
        managed_root_physical_containment: true,
        sealed_tree: {
          artifact_directory_mode: "0555",
          bin_directory_mode: "0555",
          native_mode: "0555",
          manifest_mode: "0444",
        },
        repeated_selection_downloads: acquisitionCalls,
        poisoned_path_fallback_used: false,
        credential_free_app_server_probe: probeState,
        credential_free_probe_cleanup_completed: probeCleanup,
        credential_or_keychain_accesses: 0,
        provider_model_calls: 0,
        repository_task_calls: 0,
        agent_identity_bootstrap_or_registration_attempts: 0,
        real_application_data_writes: 0,
      }),
    );
  } finally {
    globalThis.fetch = originalFetch;
    makeWritable(disposableRoot);
    rmSync(disposableRoot, { recursive: true, force: false });
    assert.equal(existsSync(disposableRoot), false);
  }
}

function assertSealedTree(managedRoot: string, nativePath: string): void {
  const canonicalRoot = realpathSync.native(managedRoot);
  assert.equal(canonicalRoot, managedRoot);
  const artifactsRoot = path.join(canonicalRoot, "artifacts");
  assert.equal(realpathSync.native(artifactsRoot), artifactsRoot);
  assert.equal(lstatSync(artifactsRoot).isSymbolicLink(), false);
  const artifactNames = readdirSync(artifactsRoot);
  assert.equal(artifactNames.length, 1);
  const artifactDirectory = path.join(artifactsRoot, artifactNames[0]!);
  assert.equal(realpathSync.native(artifactDirectory), artifactDirectory);
  assert.equal(path.dirname(path.dirname(nativePath)), artifactDirectory);
  assert.deepEqual(readdirSync(artifactDirectory).sort(), ["bin", "store.json"]);
  assert.deepEqual(readdirSync(path.join(artifactDirectory, "bin")), ["codex"]);
  assertExactMode(artifactDirectory, "directory", 0o555);
  assertExactMode(path.join(artifactDirectory, "bin"), "directory", 0o555);
  assertExactMode(nativePath, "file", 0o555);
  assertExactMode(path.join(artifactDirectory, "store.json"), "file", 0o444);
  const relative = path.relative(artifactsRoot, realpathSync.native(nativePath));
  assert.equal(relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative), false);
}

function assertExactMode(
  target: string,
  type: "directory" | "file",
  mode: number,
): void {
  const stat = lstatSync(target);
  assert.equal(stat.isSymbolicLink(), false);
  assert.equal(type === "directory" ? stat.isDirectory() : stat.isFile(), true);
  assert.equal(stat.mode & 0o7777, mode);
}

function sha256(bytes: Buffer): string {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function makeWritable(target: string): void {
  if (!existsSync(target)) return;
  const stat = lstatSync(target);
  if (stat.isSymbolicLink()) return;
  if (stat.isDirectory()) {
    chmodSync(target, 0o700);
    for (const name of readdirSync(target)) makeWritable(path.join(target, name));
  } else if (stat.isFile()) chmodSync(target, 0o600);
}

void main();
