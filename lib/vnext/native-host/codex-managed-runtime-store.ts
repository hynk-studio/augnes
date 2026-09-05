import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  chmodSync,
  closeSync,
  existsSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
  type Stats,
} from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";

import {
  CODEX_QUALIFIED_RUNTIME_REGISTRY_V01,
  getCodexReviewedRuntimeArtifactV01,
  selectCodexQualifiedRuntimeEntryV01,
  validateCodexQualifiedRuntimeRegistryV01,
  type CodexQualifiedRuntimeArtifactV01,
  type CodexQualifiedRuntimeRegistryV01,
  type CodexQualifiedRuntimeSelectionV01,
  type CodexRuntimeLaneV01,
} from "@/lib/vnext/native-host/codex-qualified-runtime-registry";
import { codexRuntimeSelectionHasImplementedCompatibilityV01 } from "@/lib/vnext/native-host/codex-runtime-implementation-binding";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  parseStrictIsoTimestampV01,
} from "@/lib/vnext/protocol-primitives";

export const CODEX_MANAGED_RUNTIME_STORE_SCHEMA_VERSION_V01 =
  "codex_managed_runtime_store.v0.1" as const;
export const CODEX_MANAGED_RUNTIME_SELECTION_POLICY_VERSION_V01 =
  "codex_managed_runtime_selection_policy.v0.1" as const;
export const CODEX_MANAGED_RUNTIME_RETENTION_V01 = Object.freeze({
  maximum_artifact_count: 3,
  maximum_total_bytes: 1024 * 1024 * 1024,
  maximum_unprotected_age_ms: 180 * 24 * 60 * 60 * 1_000,
  maximum_rollback_targets: 1,
});

const STORE_NATIVE_RELATIVE_PATH_V01 = "bin/codex";
const STORE_MANIFEST_NAME_V01 = "store.json";
const LOCK_STALE_AFTER_MS_V01 = 30_000;
const LOCK_WAIT_MS_V01 = 10_000;
const MAX_DECOMPRESSED_ARCHIVE_BYTES_V01 = 512 * 1024 * 1024;
const MAX_ARCHIVE_ENTRIES_V01 = 8;
const TEST_MODE_ENVIRONMENT_KEY_V01 =
  "AUGNES_CODEX_PRODUCTION_RUNTIME_TEST_MODE";

interface StoreArtifactIdentityV01 {
  registry_entry_id: string;
  version: string;
  release_tag: string;
  tagged_source_commit: string;
  platform: string;
  architecture: string;
  upstream_target_triple: string;
  official_release: CodexQualifiedRuntimeArtifactV01["official_release"];
  qualified_provenance_asset: CodexQualifiedRuntimeArtifactV01["qualified_provenance_asset"];
  provenance_method: CodexQualifiedRuntimeArtifactV01["provenance_method"];
  native_executable_sha256: string;
  compatibility_profile_id: string;
  compatibility_profile_fingerprint: string;
}

interface StoreManifestPayloadV01 {
  store_schema_version: typeof CODEX_MANAGED_RUNTIME_STORE_SCHEMA_VERSION_V01;
  artifact_identity: StoreArtifactIdentityV01;
  native_relative_path: string;
  native_size_bytes: number;
}

interface StoreManifestV01 extends StoreManifestPayloadV01 {
  manifest_fingerprint: string;
}

interface StoreValidationDependenciesV01 {
  platform: NodeJS.Platform;
  architecture: string;
  read_cli_version(nativeExecutable: string): string;
  inspect_native(nativeExecutable: string, artifact: CodexQualifiedRuntimeArtifactV01): boolean;
}

interface StoreTestDependenciesV01 extends StoreValidationDependenciesV01 {
  registry?: unknown;
  now?: () => number;
  lock_wait_ms?: number;
  before_publish?: () => void | Promise<void>;
  after_publish_before_final_seal?: () => void | Promise<void>;
  process_identity?: (pid: number) =>
    | { state: "present"; identity: string }
    | { state: "missing" | "unavailable" };
}

export interface CodexManagedRuntimeSelectionV01 {
  policy_version: typeof CODEX_MANAGED_RUNTIME_SELECTION_POLICY_VERSION_V01;
  selection_mode: "pinned_exact" | "latest_qualified";
  lane: CodexRuntimeLaneV01;
  canonical_native_executable: string;
  store_manifest_fingerprint: string;
  qualified_runtime_selection: CodexQualifiedRuntimeSelectionV01;
}

export class CodexManagedRuntimeStoreErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "CodexManagedRuntimeStoreErrorV01";
  }
}

/** Archive-bound discovery only; never creates a registry entry or store selection. */
export function extractDiscoveredCodexCandidateArchiveV01(input: {
  artifact: Pick<CodexQualifiedRuntimeArtifactV01,
    "version" | "platform" | "architecture" | "upstream_target_triple" | "qualified_provenance_asset">;
  archive_bytes: Buffer;
  destination: string;
}): {
  native_executable: string;
  native_executable_sha256: string;
  extracted_native_size_bytes: number;
  archive_member_name: string;
} {
  const artifact = input.artifact;
  if (process.platform !== "darwin" || process.arch !== "arm64" ||
      artifact.platform !== "darwin" || artifact.architecture !== "arm64" ||
      artifact.upstream_target_triple !== "aarch64-apple-darwin" ||
      !/^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/u.test(artifact.version) ||
      artifact.qualified_provenance_asset.acquisition_route !== "standalone_release_tarball" ||
      artifact.qualified_provenance_asset.asset_name !== "codex-aarch64-apple-darwin.tar.gz" ||
      artifact.qualified_provenance_asset.digest_mechanism !== "official_github_release_asset_digest_sha256")
    throw new CodexManagedRuntimeStoreErrorV01("codex_managed_runtime_ineligible");
  const destination = realpathSync.native(input.destination);
  const stat = lstatSync(input.destination);
  if (destination !== path.resolve(input.destination) || !stat.isDirectory() ||
      stat.isSymbolicLink() || (stat.mode & 0o077) !== 0 || readdirSync(destination).length !== 0)
    throw new CodexManagedRuntimeStoreErrorV01("codex_managed_runtime_store_root_invalid");
  verifyArchiveIdentityV01(input.archive_bytes, artifact);
  const extracted = extractReviewedArchiveV01(input.archive_bytes, artifact);
  const member = `codex-${artifact.upstream_target_triple}`;
  const native = path.join(destination, member);
  writeFileSync(native, extracted.bytes, { flag: "wx", mode: 0o555 });
  chmodSync(native, 0o555);
  if (!inspectNativeV01(native, artifact) || realpathSync.native(native) !== native ||
      !lstatSync(native).isFile() || (lstatSync(native).mode & 0o7777) !== 0o555 ||
      sha256FileV01(native) !== sha256BufferV01(extracted.bytes))
    throw new CodexManagedRuntimeStoreErrorV01("codex_managed_runtime_native_identity_mismatch");
  // CLI version execution belongs to the existing isolated provider-free probe.
  return Object.freeze({
    native_executable: native,
    native_executable_sha256: sha256FileV01(native),
    extracted_native_size_bytes: extracted.bytes.length,
    archive_member_name: member,
  });
}

/**
 * Qualification-only extraction into a caller-owned empty disposable root.
 * This does not publish to the managed store and grants no lane eligibility.
 */
export function extractReviewedCodexCandidateArchiveV01(input: {
  entry_id: string;
  archive_bytes: Buffer;
  destination: string;
  environment?: NodeJS.ProcessEnv;
}): {
  native_executable: string;
  archive_size_bytes: number;
  archive_digest: string;
  archive_member_name: string;
  extracted_native_size_bytes: number;
  native_executable_sha256: string;
  cli_version: string;
} {
  const reviewed = getCodexReviewedRuntimeArtifactV01({
    entry_id: input.entry_id,
  });
  const artifact = reviewed.artifact;
  const evidence = artifact.qualification_evidence;
  if (
    evidence.kind !== "candidate_source_schema_review_v0_1" ||
    artifact.lanes.ordinary_chatgpt_auth.status !== "candidate" ||
    evidence.source_schema_review.compatibility_profile_decision !==
      "reuse_supported_pending_authenticated_ordinary_canary" ||
    evidence.source_schema_review.deltas.some(
      ({ classification }) =>
        classification === "changed_profile_required" ||
        classification === "incompatible_or_unresolved",
    )
  )
    throw new CodexManagedRuntimeStoreErrorV01(
      "codex_managed_runtime_ineligible",
    );
  const destination = realpathSync.native(input.destination);
  const destinationStat = lstatSync(destination);
  if (
    destination !== path.resolve(input.destination) ||
    !destinationStat.isDirectory() ||
    destinationStat.isSymbolicLink() ||
    (destinationStat.mode & 0o077) !== 0 ||
    readdirSync(destination).length !== 0
  )
    throw new CodexManagedRuntimeStoreErrorV01(
      "codex_managed_runtime_store_root_invalid",
    );
  verifyArchiveIdentityV01(input.archive_bytes, artifact);
  const extracted = extractReviewedArchiveV01(input.archive_bytes, artifact);
  const expected = evidence.source_schema_review.candidate;
  if (
    expected.archive_member_name !== `codex-${artifact.upstream_target_triple}` ||
    extracted.bytes.length !== expected.extracted_native_size_bytes
  )
    throw new CodexManagedRuntimeStoreErrorV01(
      "codex_managed_runtime_native_identity_mismatch",
    );
  const nativeExecutable = path.join(destination, expected.archive_member_name);
  writeFileSync(nativeExecutable, extracted.bytes, { flag: "wx", mode: 0o555 });
  chmodSync(nativeExecutable, 0o555);
  const canonicalNative = realpathSync.native(nativeExecutable);
  const stat = lstatSync(canonicalNative);
  if (
    canonicalNative !== nativeExecutable ||
    !stat.isFile() ||
    stat.isSymbolicLink() ||
    stat.size !== expected.extracted_native_size_bytes ||
    (stat.mode & 0o7777) !== 0o555 ||
    !isPhysicalChildV01(destination, canonicalNative) ||
    sha256FileV01(canonicalNative) !== artifact.native_executable_sha256 ||
    !inspectNativeV01(canonicalNative, artifact)
  )
    throw new CodexManagedRuntimeStoreErrorV01(
      "codex_managed_runtime_native_identity_mismatch",
    );
  const cliVersion = readCliVersionV01(
    canonicalNative,
    input.environment ?? process.env,
  );
  if (cliVersion !== artifact.version)
    throw new CodexManagedRuntimeStoreErrorV01(
      "codex_managed_runtime_native_identity_mismatch",
    );
  return Object.freeze({
    native_executable: canonicalNative,
    archive_size_bytes: input.archive_bytes.length,
    archive_digest: sha256BufferV01(input.archive_bytes),
    archive_member_name: expected.archive_member_name,
    extracted_native_size_bytes: stat.size,
    native_executable_sha256: sha256FileV01(canonicalNative),
    cli_version: cliVersion,
  });
}

export async function ensurePinnedCodexManagedRuntimeV01(input: {
  root: string;
  environment?: NodeJS.ProcessEnv;
}): Promise<CodexManagedRuntimeSelectionV01> {
  const dependencies = productionValidationDependenciesV01(
    input.environment ?? process.env,
  );
  return await ensurePinnedFromRegistryV01({
    root: input.root,
    registry: CODEX_QUALIFIED_RUNTIME_REGISTRY_V01,
    dependencies,
    observed_at: () => new Date().toISOString(),
    download_reviewed_archive: downloadReviewedArchiveV01,
  });
}

/** Test-only production bootstrap probe. Registry and downloader injection never reach production callers. */
export async function ensurePinnedCodexManagedRuntimeForTestV01(input: {
  root: string;
  dependencies: StoreTestDependenciesV01;
  download_reviewed_archive(
    artifact: CodexQualifiedRuntimeArtifactV01,
  ): Promise<Buffer>;
}): Promise<CodexManagedRuntimeSelectionV01> {
  requireTestModeV01();
  return await ensurePinnedFromRegistryV01({
    root: input.root,
    registry: registryForTestV01(input.dependencies.registry),
    dependencies: input.dependencies,
    observed_at: () =>
      new Date(input.dependencies.now?.() ?? Date.now()).toISOString(),
    download_reviewed_archive: input.download_reviewed_archive,
  });
}

async function ensurePinnedFromRegistryV01(input: {
  root: string;
  registry: CodexQualifiedRuntimeRegistryV01;
  dependencies: StoreValidationDependenciesV01;
  observed_at(): string;
  download_reviewed_archive(
    artifact: CodexQualifiedRuntimeArtifactV01,
  ): Promise<Buffer>;
}): Promise<CodexManagedRuntimeSelectionV01> {
  const selection = selectCodexQualifiedRuntimeEntryV01({
    registry: input.registry,
    entry_id: input.registry.production_selection.entry_id,
    lane: "ordinary_chatgpt_auth",
    selection_mode: "pinned_exact",
  });
  assertManagedDirectNativeAdmittedV01(selection);
  try {
    const selected = selectFromStoreV01({
      root: input.root,
      mode: "pinned_exact",
      lane: "ordinary_chatgpt_auth",
      registry: input.registry,
      observed_at: input.observed_at(),
      dependencies: input.dependencies,
    });
    enforceRetentionV01({
      root: input.root,
      active: selected,
      registry: input.registry,
      observed_at: input.observed_at(),
      dependencies: input.dependencies,
    });
    return selected;
  } catch (error) {
    if (!(error instanceof CodexManagedRuntimeStoreErrorV01) || error.code !== "codex_managed_runtime_absent") {
      throw error;
    }
  }
  await stageSelectionV01({
    root: input.root,
    selection,
    archive_bytes: await input.download_reviewed_archive(selection.artifact),
    dependencies: input.dependencies,
  });
  const selected = selectFromStoreV01({
    root: input.root,
    mode: "pinned_exact",
    lane: "ordinary_chatgpt_auth",
    registry: input.registry,
    observed_at: input.observed_at(),
    dependencies: input.dependencies,
  });
  enforceRetentionV01({
    root: input.root,
    active: selected,
    registry: input.registry,
    observed_at: input.observed_at(),
    dependencies: input.dependencies,
  });
  return selected;
}

/** Test-only fixture staging. Arbitrary archive bytes are never accepted here in production. */
export async function stageCodexManagedRuntimeForTestV01(input: {
  root: string;
  entry_id: string;
  lane?: CodexRuntimeLaneV01;
  archive_bytes: Buffer;
  dependencies: StoreTestDependenciesV01;
}): Promise<CodexManagedRuntimeSelectionV01> {
  requireTestModeV01();
  const registry = registryForTestV01(input.dependencies.registry);
  const selection = selectCodexQualifiedRuntimeEntryV01({
    registry,
    entry_id: input.entry_id,
    lane: input.lane ?? "ordinary_chatgpt_auth",
    selection_mode: "pinned_exact",
  });
  await stageSelectionV01({
    root: input.root,
    selection,
    archive_bytes: input.archive_bytes,
    dependencies: input.dependencies,
  });
  return selectFromStoreV01({
    root: input.root,
    mode: "pinned_exact",
    lane: input.lane ?? "ordinary_chatgpt_auth",
    pinned_entry_id: selection.artifact.entry_id,
    registry,
    observed_at: new Date(input.dependencies.now?.() ?? Date.now()).toISOString(),
    dependencies: input.dependencies,
  });
}

export function selectCodexManagedRuntimeV01(input: {
  root: string;
  mode?: "pinned_exact" | "latest_qualified";
  lane?: CodexRuntimeLaneV01;
  observed_at?: string;
  environment?: NodeJS.ProcessEnv;
}): CodexManagedRuntimeSelectionV01 {
  return selectFromStoreV01({
    root: input.root,
    mode: input.mode ?? "pinned_exact",
    lane: input.lane ?? "ordinary_chatgpt_auth",
    registry: CODEX_QUALIFIED_RUNTIME_REGISTRY_V01,
    observed_at: input.observed_at ?? new Date().toISOString(),
    dependencies: productionValidationDependenciesV01(
      input.environment ?? process.env,
    ),
  });
}

/** Test-only policy probe for synthetic reviewed registries and artifacts. */
export function selectCodexManagedRuntimeForTestV01(input: {
  root: string;
  mode: "pinned_exact" | "latest_qualified";
  lane: CodexRuntimeLaneV01;
  pinned_entry_id?: string;
  observed_at?: string;
  dependencies: StoreTestDependenciesV01;
}): CodexManagedRuntimeSelectionV01 {
  requireTestModeV01();
  const registry = registryForTestV01(input.dependencies.registry);
  return selectFromStoreV01({
    root: input.root,
    mode: input.mode,
    lane: input.lane,
    pinned_entry_id: input.pinned_entry_id,
    registry,
    observed_at: input.observed_at ?? new Date(input.dependencies.now?.() ?? Date.now()).toISOString(),
    dependencies: input.dependencies,
  });
}

export function assertCodexManagedRuntimeSelectionUnchangedForTestV01(
  selection: CodexManagedRuntimeSelectionV01,
  input: { root: string; dependencies: StoreTestDependenciesV01 },
): void {
  requireTestModeV01();
  try {
    const current = selectFromStoreV01({
      root: input.root,
      mode: selection.selection_mode,
      lane: selection.lane,
      pinned_entry_id:
        selection.selection_mode === "pinned_exact"
          ? selection.qualified_runtime_selection.artifact.entry_id
          : undefined,
      registry: registryForTestV01(input.dependencies.registry),
      observed_at: new Date(input.dependencies.now?.() ?? Date.now()).toISOString(),
      dependencies: input.dependencies,
    });
    if (
      current.canonical_native_executable !== selection.canonical_native_executable ||
      current.store_manifest_fingerprint !== selection.store_manifest_fingerprint ||
      canonicalizeProtocolValueV01(current.qualified_runtime_selection) !== canonicalizeProtocolValueV01(selection.qualified_runtime_selection)
    ) throw new Error();
  } catch {
    throw new CodexManagedRuntimeStoreErrorV01("codex_managed_runtime_identity_changed");
  }
}

export function codexManagedRuntimeArtifactDirectoryForTestV01(
  root: string,
  artifact: CodexQualifiedRuntimeArtifactV01,
): string {
  requireTestModeV01();
  return artifactDirectoryV01(root, artifact);
}

export function assertCodexManagedRuntimeSelectionUnchangedV01(
  selection: CodexManagedRuntimeSelectionV01,
  input: { root: string; environment?: NodeJS.ProcessEnv },
): void {
  try {
    const current = selectCodexManagedRuntimeV01({
      root: input.root,
      mode: selection.selection_mode,
      lane: selection.lane,
      observed_at: new Date().toISOString(),
      environment: input.environment ?? process.env,
    });
    if (
      current.canonical_native_executable !== selection.canonical_native_executable ||
      current.store_manifest_fingerprint !== selection.store_manifest_fingerprint ||
      canonicalizeProtocolValueV01(current.qualified_runtime_selection) !==
        canonicalizeProtocolValueV01(selection.qualified_runtime_selection)
    ) {
      throw new Error();
    }
  } catch {
    throw new CodexManagedRuntimeStoreErrorV01(
      "codex_managed_runtime_identity_changed",
    );
  }
}

export function managedRootFromEnvironmentV01(
  environment: NodeJS.ProcessEnv,
): string {
  const root = environment.AUGNES_MANAGED_CODEX_RUNTIME_ROOT;
  if (typeof root !== "string" || !path.isAbsolute(root)) {
    throw new CodexManagedRuntimeStoreErrorV01(
      "codex_managed_runtime_store_root_invalid",
    );
  }
  return path.resolve(root);
}

export function recordCodexManagedRuntimeLastKnownGoodV01(input: {
  root: string;
  selection: CodexManagedRuntimeSelectionV01;
  observed_at?: string;
}): void {
  const stateDirectory = storePathV01(input.root, "state");
  ensureDirectoryV01(stateDirectory);
  const previous = readLastKnownGoodStateV01(input.root);
  const selectedEntryId =
    input.selection.qualified_runtime_selection.artifact.entry_id;
  const previousRollback =
    previous && previous.registry_entry_id !== selectedEntryId
      ? {
          entry_id: previous.registry_entry_id,
          manifest_fingerprint: previous.store_manifest_fingerprint,
        }
      : previous?.rollback_registry_entry_id &&
          previous.rollback_store_manifest_fingerprint
        ? {
            entry_id: previous.rollback_registry_entry_id,
            manifest_fingerprint:
              previous.rollback_store_manifest_fingerprint,
          }
        : null;
  const payload = {
    state_schema_version: "codex_managed_runtime_last_known_good.v0.1",
    lane: input.selection.lane,
    registry_entry_id: selectedEntryId,
    store_manifest_fingerprint: input.selection.store_manifest_fingerprint,
    rollback_registry_entry_id: previousRollback?.entry_id ?? null,
    rollback_store_manifest_fingerprint:
      previousRollback?.manifest_fingerprint ?? null,
    observed_at: input.observed_at ?? new Date().toISOString(),
  };
  const record = {
    ...payload,
    fingerprint: createProtocolSha256V01(canonicalizeProtocolValueV01(payload)),
  };
  const temporary = path.join(
    stateDirectory,
    `.last-known-good-${process.pid}-${randomUUID()}.json`,
  );
  try {
    writeFileSync(temporary, `${canonicalizeProtocolValueV01(record)}\n`, {
      mode: 0o600,
      flag: "wx",
    });
    renameSync(temporary, path.join(stateDirectory, "last-known-good.json"));
  } finally {
    if (existsSync(temporary)) rmSync(temporary, { force: true });
  }
}

export function enforceCodexManagedRuntimeRetentionForTestV01(input: {
  root: string;
  active: CodexManagedRuntimeSelectionV01;
  observed_at?: string;
  dependencies: StoreTestDependenciesV01;
}): Readonly<{ removed_entry_ids: readonly string[]; protected_entry_ids: readonly string[] }> {
  requireTestModeV01();
  return enforceRetentionV01({
    root: input.root,
    active: input.active,
    registry: registryForTestV01(input.dependencies.registry),
    observed_at: input.observed_at ?? new Date().toISOString(),
    dependencies: input.dependencies,
  });
}

export function enforceCodexManagedRuntimeRetentionV01(input: {
  root: string;
  active: CodexManagedRuntimeSelectionV01;
  observed_at?: string;
  environment?: NodeJS.ProcessEnv;
}): Readonly<{ removed_entry_ids: readonly string[]; protected_entry_ids: readonly string[] }> {
  return enforceRetentionV01({
    root: input.root,
    active: input.active,
    registry: CODEX_QUALIFIED_RUNTIME_REGISTRY_V01,
    observed_at: input.observed_at ?? new Date().toISOString(),
    dependencies: productionValidationDependenciesV01(
      input.environment ?? process.env,
    ),
  });
}

function enforceRetentionV01(input: {
  root: string;
  active: CodexManagedRuntimeSelectionV01;
  registry: CodexQualifiedRuntimeRegistryV01;
  observed_at: string;
  dependencies: StoreValidationDependenciesV01;
}): Readonly<{ removed_entry_ids: readonly string[]; protected_entry_ids: readonly string[] }> {
  const nowMs = parseStrictIsoTimestampV01(input.observed_at);
  if (nowMs === null) {
    throw new CodexManagedRuntimeStoreErrorV01(
      "codex_managed_runtime_retention_invalid",
    );
  }
  const artifactsDirectory = assertArtifactsRootV01(input.root);
  if (!artifactsDirectory) {
    return Object.freeze({ removed_entry_ids: [], protected_entry_ids: [] });
  }
  const protectedIds = new Set<string>([
    input.active.qualified_runtime_selection.artifact.entry_id,
  ]);
  const protectedDirectories = new Set<string>([
    path.dirname(path.dirname(input.active.canonical_native_executable)),
  ]);
  const rollback = readEligibleLastKnownGoodV01({
    root: input.root,
    active: input.active,
    registry: input.registry,
    observed_at: input.observed_at,
    dependencies: input.dependencies,
  });
  if (rollback) {
    protectedIds.add(rollback.qualified_runtime_selection.artifact.entry_id);
    protectedDirectories.add(
      path.dirname(path.dirname(rollback.canonical_native_executable)),
    );
  }
  if (assertArtifactsRootV01(input.root) !== artifactsDirectory) {
    throw new CodexManagedRuntimeStoreErrorV01(
      "codex_managed_runtime_store_root_invalid",
    );
  }
  const registeredDirectories = new Set(
    input.registry.artifacts.map((artifact) => artifactKeyV01(artifact)),
  );
  const entries = readdirSync(artifactsDirectory)
    .map((name) => {
      const directory = path.join(artifactsDirectory, name);
      const stat = lstatSync(directory);
      if (
        !registeredDirectories.has(name) ||
        !stat.isDirectory() ||
        stat.isSymbolicLink() ||
        realpathSync.native(directory) !== directory ||
        !isPhysicalChildV01(artifactsDirectory, directory)
      ) {
        throw new CodexManagedRuntimeStoreErrorV01(
          "codex_managed_runtime_corrupt",
        );
      }
      const protected_entry = protectedDirectories.has(directory);
      return {
        name,
        directory,
        stat,
        identity: directoryIdentityV01(stat),
        protected_entry,
      };
    })
    .sort(
      (left, right) =>
        Number(right.protected_entry) - Number(left.protected_entry) ||
        right.stat.mtimeMs - left.stat.mtimeMs,
    );
  let keptCount = 0;
  let keptBytes = 0;
  const removed: string[] = [];
  for (const entry of entries) {
    const manifest = readStoreManifestLooseV01(
      entry.directory,
      artifactsDirectory,
    );
    const entryId = manifest?.artifact_identity.registry_entry_id ?? entry.name;
    const protectedEntry = entry.protected_entry;
    let size = 0;
    try {
      size = directoryByteSizeV01(entry.directory, artifactsDirectory);
    } catch {
      if (protectedEntry) {
        keptCount += 1;
        continue;
      }
      removeProvablyOwnedArtifactDirectoryV01({
        root: input.root,
        artifacts_directory: artifactsDirectory,
        directory: entry.directory,
        identity: entry.identity,
      });
      removed.push(entryId);
      continue;
    }
    const withinBounds =
      keptCount < CODEX_MANAGED_RUNTIME_RETENTION_V01.maximum_artifact_count &&
      keptBytes + size <= CODEX_MANAGED_RUNTIME_RETENTION_V01.maximum_total_bytes &&
      nowMs - entry.stat.mtimeMs <=
        CODEX_MANAGED_RUNTIME_RETENTION_V01.maximum_unprotected_age_ms;
    if (protectedEntry || withinBounds) {
      keptCount += 1;
      keptBytes += size;
      continue;
    }
    removeProvablyOwnedArtifactDirectoryV01({
      root: input.root,
      artifacts_directory: artifactsDirectory,
      directory: entry.directory,
      identity: entry.identity,
    });
    removed.push(entryId);
  }
  return Object.freeze({
    removed_entry_ids: Object.freeze(removed),
    protected_entry_ids: Object.freeze([...protectedIds]),
  });
}

function selectFromStoreV01(input: {
  root: string;
  mode: "pinned_exact" | "latest_qualified";
  lane: CodexRuntimeLaneV01;
  pinned_entry_id?: string;
  registry: CodexQualifiedRuntimeRegistryV01;
  observed_at: string;
  dependencies: StoreValidationDependenciesV01;
}): CodexManagedRuntimeSelectionV01 {
  assertStoreRootV01(input.root);
  assertArtifactsRootV01(input.root);
  const candidateIds = input.mode === "pinned_exact"
    ? [input.pinned_entry_id ?? input.registry.production_selection.entry_id]
    : newestEligibleEntryIdsV01(input);
  const valid: CodexManagedRuntimeSelectionV01[] = [];
  let sawCorrupt = false;
  let eligibleCount = 0;
  for (const entryId of candidateIds) {
    let registrySelection: CodexQualifiedRuntimeSelectionV01;
    try {
      registrySelection = selectCodexQualifiedRuntimeEntryV01({
        registry: input.registry,
        entry_id: entryId,
        lane: input.lane,
        observed_at: input.observed_at,
        selection_mode: input.mode,
      });
    } catch {
      if (input.mode === "pinned_exact") throw new CodexManagedRuntimeStoreErrorV01("codex_managed_runtime_ineligible");
      continue;
    }
    if (
      registrySelection.artifact.platform !== input.dependencies.platform ||
      registrySelection.artifact.architecture !== input.dependencies.architecture ||
      !codexRuntimeSelectionHasImplementedCompatibilityV01(registrySelection) ||
      !managedDirectNativeAdmittedV01(registrySelection.artifact)
    ) {
      if (input.mode === "pinned_exact") throw new CodexManagedRuntimeStoreErrorV01("codex_managed_runtime_ineligible");
      continue;
    }
    eligibleCount += 1;
    try {
      valid.push(validateStoredArtifactV01(input.root, registrySelection, input.dependencies));
    } catch (error) {
      if (error instanceof CodexManagedRuntimeStoreErrorV01) {
        if (error.code === "codex_managed_runtime_corrupt") sawCorrupt = true;
        if (input.mode === "latest_qualified") continue;
      }
      throw error;
    }
    if (input.mode === "pinned_exact") return valid[0]!;
  }
  if (input.mode === "latest_qualified" && valid.length > 0) {
    const highestVersion = valid[0]!.qualified_runtime_selection.artifact.version;
    const tied = valid.filter(
      (candidate) => candidate.qualified_runtime_selection.artifact.version === highestVersion,
    );
    if (tied.length !== 1) {
      throw new CodexManagedRuntimeStoreErrorV01(
        "codex_managed_runtime_selection_ambiguous",
      );
    }
    return tied[0]!;
  }
  if (input.mode === "latest_qualified" && eligibleCount === 0) {
    throw new CodexManagedRuntimeStoreErrorV01(
      "codex_managed_runtime_no_qualified_runtime",
    );
  }
  throw new CodexManagedRuntimeStoreErrorV01(
    sawCorrupt ? "codex_managed_runtime_corrupt" : "codex_managed_runtime_absent",
  );
}

function newestEligibleEntryIdsV01(input: {
  registry: CodexQualifiedRuntimeRegistryV01;
  lane: CodexRuntimeLaneV01;
  observed_at: string;
  dependencies: StoreValidationDependenciesV01;
}): string[] {
  return input.registry.artifacts
    .filter(
      (artifact) =>
        artifact.platform === input.dependencies.platform &&
        artifact.architecture === input.dependencies.architecture,
    )
    .sort((left, right) => compareSemverV01(right.version, left.version))
    .map((artifact) => artifact.entry_id);
}

function validateStoredArtifactV01(
  root: string,
  selection: CodexQualifiedRuntimeSelectionV01,
  dependencies: StoreValidationDependenciesV01,
): CodexManagedRuntimeSelectionV01 {
  assertManagedDirectNativeAdmittedV01(selection);
  const artifactsDirectory = assertArtifactsRootV01(root);
  if (!artifactsDirectory) {
    throw new CodexManagedRuntimeStoreErrorV01("codex_managed_runtime_absent");
  }
  const directory = path.join(artifactsDirectory, artifactKeyV01(selection.artifact));
  const directoryStat = lstatIfExistsV01(directory);
  if (!directoryStat) throw new CodexManagedRuntimeStoreErrorV01("codex_managed_runtime_absent");
  try {
    if (
      !directoryStat.isDirectory() ||
      directoryStat.isSymbolicLink() ||
      (directoryStat.mode & 0o7777) !== 0o555 ||
      realpathSync.native(directory) !== directory ||
      !isPhysicalChildV01(artifactsDirectory, directory)
    ) throw new Error();
    const top = readdirSync(directory).sort();
    if (canonicalizeProtocolValueV01(top) !== canonicalizeProtocolValueV01(["bin", STORE_MANIFEST_NAME_V01])) throw new Error();
    const binDirectory = path.join(directory, "bin");
    const binStat = lstatSync(binDirectory);
    if (
      !binStat.isDirectory() ||
      binStat.isSymbolicLink() ||
      (binStat.mode & 0o7777) !== 0o555 ||
      realpathSync.native(binDirectory) !== binDirectory ||
      !isPhysicalChildV01(artifactsDirectory, binDirectory)
    ) throw new Error();
    if (canonicalizeProtocolValueV01(readdirSync(binDirectory)) !== canonicalizeProtocolValueV01(["codex"])) throw new Error();
    const nativeExecutable = path.join(
      directory,
      ...STORE_NATIVE_RELATIVE_PATH_V01.split("/"),
    );
    const nativeStat = lstatSync(nativeExecutable);
    if (
      !nativeStat.isFile() ||
      nativeStat.isSymbolicLink() ||
      (nativeStat.mode & 0o7777) !== 0o555
    ) throw new Error();
    const canonicalNativeExecutable = realpathSync.native(nativeExecutable);
    if (
      canonicalNativeExecutable !==
      path.join(
        realpathSync.native(directory),
        ...STORE_NATIVE_RELATIVE_PATH_V01.split("/"),
      ) ||
      !isPhysicalChildV01(artifactsDirectory, canonicalNativeExecutable)
    ) throw new Error();
    const manifestPath = path.join(directory, STORE_MANIFEST_NAME_V01);
    const manifestStat = lstatSync(manifestPath);
    if (
      !manifestStat.isFile() ||
      manifestStat.isSymbolicLink() ||
      (manifestStat.mode & 0o7777) !== 0o444 ||
      realpathSync.native(manifestPath) !== manifestPath ||
      !isPhysicalChildV01(artifactsDirectory, manifestPath)
    ) throw new Error();
    const manifest = parseStoreManifestV01(
      readFileSync(manifestPath, "utf8"),
    );
    const expectedIdentity = storeArtifactIdentityV01(selection.artifact);
    if (
      manifest.store_schema_version !== CODEX_MANAGED_RUNTIME_STORE_SCHEMA_VERSION_V01 ||
      canonicalizeProtocolValueV01(manifest.artifact_identity) !== canonicalizeProtocolValueV01(expectedIdentity) ||
      manifest.native_relative_path !== STORE_NATIVE_RELATIVE_PATH_V01 ||
      manifest.native_size_bytes !== nativeStat.size ||
      sha256FileV01(nativeExecutable) !== selection.artifact.native_executable_sha256 ||
      !dependencies.inspect_native(nativeExecutable, selection.artifact) ||
      dependencies.read_cli_version(nativeExecutable) !== selection.artifact.version
    ) throw new Error();
    return Object.freeze({
      policy_version: CODEX_MANAGED_RUNTIME_SELECTION_POLICY_VERSION_V01,
      selection_mode: selection.selection_mode,
      lane: selection.lane,
      canonical_native_executable: canonicalNativeExecutable,
      store_manifest_fingerprint: manifest.manifest_fingerprint,
      qualified_runtime_selection: selection,
    });
  } catch {
    throw new CodexManagedRuntimeStoreErrorV01("codex_managed_runtime_corrupt");
  }
}

async function stageSelectionV01(input: {
  root: string;
  selection: CodexQualifiedRuntimeSelectionV01;
  archive_bytes: Buffer;
  dependencies: StoreValidationDependenciesV01 & Partial<StoreTestDependenciesV01>;
}): Promise<void> {
  assertManagedDirectNativeAdmittedV01(input.selection);
  assertStoreRootV01(input.root, true);
  if (
    input.selection.artifact.platform !== input.dependencies.platform ||
    input.selection.artifact.architecture !== input.dependencies.architecture ||
    !codexRuntimeSelectionHasImplementedCompatibilityV01(input.selection)
  ) {
    throw new CodexManagedRuntimeStoreErrorV01("codex_managed_runtime_ineligible");
  }
  verifyArchiveIdentityV01(input.archive_bytes, input.selection.artifact);
  const owner = await acquireStageLockV01({
    root: input.root,
    artifact: input.selection.artifact,
    dependencies: input.dependencies,
  });
  let stageDirectory: string | null = null;
  let publishedDirectory: {
    directory: string;
    identity: DirectoryIdentityV01;
  } | null = null;
  try {
    recoverInterruptedStagesV01(
      input.root,
      input.selection.artifact,
      owner.token,
    );
    try {
      validateStoredArtifactV01(input.root, input.selection, input.dependencies);
      return;
    } catch (error) {
      if (!(error instanceof CodexManagedRuntimeStoreErrorV01) || error.code !== "codex_managed_runtime_absent") throw error;
    }
    const stagingRoot = storePathV01(input.root, "staging");
    ensureDirectoryV01(stagingRoot);
    stageDirectory = path.join(stagingRoot, `${artifactKeyV01(input.selection.artifact)}.${owner.token}`);
    mkdirSync(path.join(stageDirectory, "bin"), { recursive: true, mode: 0o700 });
    const extracted = extractReviewedArchiveV01(
      input.archive_bytes,
      input.selection.artifact,
    );
    const nativePath = path.join(
      stageDirectory,
      ...STORE_NATIVE_RELATIVE_PATH_V01.split("/"),
    );
    writeFileSync(nativePath, extracted.bytes, { flag: "wx", mode: 0o700 });
    if (
      sha256FileV01(nativePath) !== input.selection.artifact.native_executable_sha256 ||
      !input.dependencies.inspect_native(nativePath, input.selection.artifact) ||
      input.dependencies.read_cli_version(nativePath) !== input.selection.artifact.version
    ) {
      throw new CodexManagedRuntimeStoreErrorV01("codex_managed_runtime_native_identity_mismatch");
    }
    const payload: StoreManifestPayloadV01 = {
      store_schema_version: CODEX_MANAGED_RUNTIME_STORE_SCHEMA_VERSION_V01,
      artifact_identity: storeArtifactIdentityV01(input.selection.artifact),
      native_relative_path: STORE_NATIVE_RELATIVE_PATH_V01,
      native_size_bytes: extracted.bytes.length,
    };
    const manifest: StoreManifestV01 = {
      ...payload,
      manifest_fingerprint: createProtocolSha256V01(canonicalizeProtocolValueV01(payload)),
    };
    writeFileSync(
      path.join(stageDirectory, STORE_MANIFEST_NAME_V01),
      `${canonicalizeProtocolValueV01(manifest)}\n`,
      { flag: "wx", mode: 0o600 },
    );
    await input.dependencies.before_publish?.();
    verifyArchiveIdentityV01(input.archive_bytes, input.selection.artifact);
    validateStagingDirectoryV01(
      stageDirectory,
      input.selection,
      input.dependencies,
    );
    const artifactsDirectory = assertArtifactsRootV01(input.root, true)!;
    const finalDirectory = path.join(
      artifactsDirectory,
      artifactKeyV01(input.selection.artifact),
    );
    chmodSync(nativePath, 0o555);
    chmodSync(path.join(stageDirectory, STORE_MANIFEST_NAME_V01), 0o444);
    chmodSync(path.join(stageDirectory, "bin"), 0o555);
    const stageIdentity = directoryIdentityV01(lstatSync(stageDirectory));
    try {
      renameSync(stageDirectory, finalDirectory);
      stageDirectory = null;
      publishedDirectory = { directory: finalDirectory, identity: stageIdentity };
      await input.dependencies.after_publish_before_final_seal?.();
      assertOwnedArtifactDirectoryV01({
        root: input.root,
        artifacts_directory: artifactsDirectory,
        directory: finalDirectory,
        identity: stageIdentity,
      });
      chmodSync(finalDirectory, 0o555);
      validateStoredArtifactV01(input.root, input.selection, input.dependencies);
      publishedDirectory = null;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST" && (error as NodeJS.ErrnoException).code !== "ENOTEMPTY") throw error;
      validateStoredArtifactV01(input.root, input.selection, input.dependencies);
    }
  } catch (error) {
    if (error instanceof CodexManagedRuntimeStoreErrorV01) throw error;
    throw new CodexManagedRuntimeStoreErrorV01("codex_managed_runtime_stage_failed");
  } finally {
    if (publishedDirectory) {
      try {
        removeProvablyOwnedArtifactDirectoryV01({
          root: input.root,
          artifacts_directory: path.dirname(publishedDirectory.directory),
          directory: publishedDirectory.directory,
          identity: publishedDirectory.identity,
        });
      } catch {
        // Preserve ambiguous material rather than following or deleting it.
      }
    }
    if (stageDirectory) {
      makeTreeWritableV01(stageDirectory);
      rmSync(stageDirectory, { recursive: true, force: true });
    }
    releaseStageLockV01(owner);
  }
}

function recoverInterruptedStagesV01(
  root: string,
  artifact: CodexQualifiedRuntimeArtifactV01,
  currentOwnerToken: string,
): void {
  const stagingRoot = storePathV01(root, "staging");
  if (!existsSync(stagingRoot)) return;
  assertExactDirectoryV01(stagingRoot);
  const prefix = `${artifactKeyV01(artifact)}.`;
  for (const name of readdirSync(stagingRoot)) {
    if (
      !name.startsWith(prefix) ||
      name === `${prefix}${currentOwnerToken}` ||
      !/^[a-z0-9._-]+\.[0-9a-f-]{36}$/u.test(name)
    ) continue;
    const candidate = path.join(stagingRoot, name);
    const stat = lstatSync(candidate);
    if (!stat.isDirectory() || stat.isSymbolicLink()) {
      throw new CodexManagedRuntimeStoreErrorV01(
        "codex_managed_runtime_stage_failed",
      );
    }
    makeTreeWritableV01(candidate);
    rmSync(candidate, { recursive: true, force: true });
  }
}

function validateStagingDirectoryV01(
  directory: string,
  selection: CodexQualifiedRuntimeSelectionV01,
  dependencies: StoreValidationDependenciesV01,
): void {
  const nativePath = path.join(
    directory,
    ...STORE_NATIVE_RELATIVE_PATH_V01.split("/"),
  );
  const manifest = parseStoreManifestV01(
    readFileSync(path.join(directory, STORE_MANIFEST_NAME_V01), "utf8"),
  );
  if (
    canonicalizeProtocolValueV01(manifest.artifact_identity) !== canonicalizeProtocolValueV01(storeArtifactIdentityV01(selection.artifact)) ||
    sha256FileV01(nativePath) !== selection.artifact.native_executable_sha256 ||
    !dependencies.inspect_native(nativePath, selection.artifact) ||
    dependencies.read_cli_version(nativePath) !== selection.artifact.version
  ) throw new CodexManagedRuntimeStoreErrorV01("codex_managed_runtime_native_identity_mismatch");
}

function extractReviewedArchiveV01(
  archive: Buffer,
  artifact: Pick<CodexQualifiedRuntimeArtifactV01, "upstream_target_triple">,
): { bytes: Buffer; mode: number } {
  let tar: Buffer;
  try {
    tar = gunzipSync(archive, { maxOutputLength: MAX_DECOMPRESSED_ARCHIVE_BYTES_V01 });
  } catch {
    throw new CodexManagedRuntimeStoreErrorV01("codex_managed_runtime_archive_unsafe");
  }
  const expectedName = `codex-${artifact.upstream_target_triple}`;
  const seen = new Set<string>();
  let found: { bytes: Buffer; mode: number } | null = null;
  let sawEndMarker = false;
  let offset = 0;
  let entries = 0;
  while (offset + 512 <= tar.length) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) {
      if (
        tar.length - offset < 1024 ||
        !tar.subarray(offset).every((byte) => byte === 0)
      ) throw new CodexManagedRuntimeStoreErrorV01("codex_managed_runtime_archive_unsafe");
      sawEndMarker = true;
      break;
    }
    entries += 1;
    if (entries > MAX_ARCHIVE_ENTRIES_V01) throw new CodexManagedRuntimeStoreErrorV01("codex_managed_runtime_archive_unsafe");
    assertTarChecksumV01(header);
    if (
      !header.subarray(257, 263).equals(Buffer.from("ustar\0", "ascii")) ||
      !header.subarray(263, 265).equals(Buffer.from("00", "ascii"))
    ) throw new CodexManagedRuntimeStoreErrorV01("codex_managed_runtime_archive_unsafe");
    const name = tarStringV01(header.subarray(0, 100));
    const prefix = tarStringV01(header.subarray(345, 500));
    const fullName = prefix ? `${prefix}/${name}` : name;
    if (!safeArchivePathV01(fullName) || seen.has(fullName)) throw new CodexManagedRuntimeStoreErrorV01("codex_managed_runtime_archive_unsafe");
    seen.add(fullName);
    const type = header[156];
    if (type !== 0 && type !== 48) throw new CodexManagedRuntimeStoreErrorV01("codex_managed_runtime_archive_unsafe");
    const size = tarOctalV01(header.subarray(124, 136));
    const mode = tarOctalV01(header.subarray(100, 108));
    const dataStart = offset + 512;
    const dataEnd = dataStart + size;
    if (size <= 0 || dataEnd > tar.length || fullName !== expectedName || found) throw new CodexManagedRuntimeStoreErrorV01("codex_managed_runtime_archive_unsafe");
    if ((mode & 0o111) === 0) throw new CodexManagedRuntimeStoreErrorV01("codex_managed_runtime_archive_unsafe");
    found = { bytes: Buffer.from(tar.subarray(dataStart, dataEnd)), mode };
    offset = dataStart + Math.ceil(size / 512) * 512;
  }
  if (!found || seen.size !== 1 || !sawEndMarker) throw new CodexManagedRuntimeStoreErrorV01("codex_managed_runtime_archive_unsafe");
  return found;
}

function verifyArchiveIdentityV01(
  archive: Buffer,
  artifact: Pick<CodexQualifiedRuntimeArtifactV01, "qualified_provenance_asset">,
): void {
  if (
    archive.length !== artifact.qualified_provenance_asset.size_bytes ||
    sha256BufferV01(archive) !== artifact.qualified_provenance_asset.digest
  ) throw new CodexManagedRuntimeStoreErrorV01("codex_managed_runtime_archive_identity_mismatch");
}

async function downloadReviewedArchiveV01(
  artifact: CodexQualifiedRuntimeArtifactV01,
): Promise<Buffer> {
  const asset = artifact.qualified_provenance_asset;
  const url = `https://github.com/${artifact.official_release.repository}/releases/download/${artifact.release_tag}/${asset.asset_name}`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: { Accept: "application/octet-stream" },
      signal: AbortSignal.timeout(120_000),
    });
  } catch {
    throw new CodexManagedRuntimeStoreErrorV01("codex_managed_runtime_stage_failed");
  }
  if (!response.ok || !response.body) throw new CodexManagedRuntimeStoreErrorV01("codex_managed_runtime_stage_failed");
  const chunks: Buffer[] = [];
  let total = 0;
  const reader = response.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > asset.size_bytes) {
      await reader.cancel();
      throw new CodexManagedRuntimeStoreErrorV01("codex_managed_runtime_archive_identity_mismatch");
    }
    chunks.push(Buffer.from(value));
  }
  const bytes = Buffer.concat(chunks, total);
  verifyArchiveIdentityV01(bytes, artifact);
  return bytes;
}

function productionValidationDependenciesV01(
  environment: NodeJS.ProcessEnv,
): StoreValidationDependenciesV01 {
  return {
    platform: process.platform,
    architecture: process.arch,
    read_cli_version: (nativeExecutable) => readCliVersionV01(nativeExecutable, environment),
    inspect_native: inspectNativeV01,
  };
}

function inspectNativeV01(
  nativeExecutable: string,
  artifact: Pick<CodexQualifiedRuntimeArtifactV01, "platform" | "architecture">,
): boolean {
  let descriptor: number | null = null;
  try {
    descriptor = openSync(nativeExecutable, "r");
    const header = Buffer.alloc(16);
    if (readSync(descriptor, header, 0, header.length, 0) !== header.length) return false;
    if (artifact.platform === "darwin") {
      if (!header.subarray(0, 4).equals(Buffer.from([0xcf, 0xfa, 0xed, 0xfe]))) return false;
      const cpuType = header.readUInt32LE(4);
      const fileType = header.readUInt32LE(12);
      return (
        cpuType ===
          (artifact.architecture === "arm64" ? 0x0100000c : 0x01000007) &&
        fileType === 2
      );
    }
    return false;
  } catch {
    return false;
  } finally {
    if (descriptor !== null) closeSync(descriptor);
  }
}

function readCliVersionV01(
  nativeExecutable: string,
  environment: NodeJS.ProcessEnv,
): string {
  const result = spawnSync(nativeExecutable, ["--version"], {
    encoding: "utf8",
    timeout: 5_000,
    maxBuffer: 4_096,
    shell: false,
    windowsHide: true,
    env: {
      NODE_ENV: environment.NODE_ENV ?? "production",
      PATH: environment.PATH,
      LANG: environment.LANG,
      LC_ALL: environment.LC_ALL,
      LC_CTYPE: environment.LC_CTYPE,
      NO_COLOR: "1",
    },
  });
  const match = !result.error && !result.signal && result.status === 0
    ? result.stdout.match(/^codex-cli ([0-9]+\.[0-9]+\.[0-9]+)\s*$/u)
    : null;
  if (!match) throw new CodexManagedRuntimeStoreErrorV01("codex_managed_runtime_native_identity_mismatch");
  return match[1]!;
}

function storeArtifactIdentityV01(
  artifact: CodexQualifiedRuntimeArtifactV01,
): StoreArtifactIdentityV01 {
  return {
    registry_entry_id: artifact.entry_id,
    version: artifact.version,
    release_tag: artifact.release_tag,
    tagged_source_commit: artifact.tagged_source_commit,
    platform: artifact.platform,
    architecture: artifact.architecture,
    upstream_target_triple: artifact.upstream_target_triple,
    official_release: artifact.official_release,
    qualified_provenance_asset: artifact.qualified_provenance_asset,
    provenance_method: artifact.provenance_method,
    native_executable_sha256: artifact.native_executable_sha256,
    compatibility_profile_id: artifact.compatibility_profile_id,
    compatibility_profile_fingerprint: artifact.compatibility_profile_fingerprint,
  };
}

function parseStoreManifestV01(raw: string): StoreManifestV01 {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
  const record = parsed as Record<string, unknown>;
  if (canonicalizeProtocolValueV01(Object.keys(record).sort()) !== canonicalizeProtocolValueV01([
    "artifact_identity", "manifest_fingerprint", "native_relative_path", "native_size_bytes", "store_schema_version",
  ].sort())) throw new Error();
  const { manifest_fingerprint: fingerprint, ...payload } = record;
  if (
    typeof fingerprint !== "string" ||
    !/^sha256:[a-f0-9]{64}$/u.test(fingerprint) ||
    createProtocolSha256V01(canonicalizeProtocolValueV01(payload)) !== fingerprint ||
    record.store_schema_version !== CODEX_MANAGED_RUNTIME_STORE_SCHEMA_VERSION_V01 ||
    record.native_relative_path !== STORE_NATIVE_RELATIVE_PATH_V01 ||
    !Number.isSafeInteger(record.native_size_bytes) ||
    Number(record.native_size_bytes) <= 0
  ) throw new Error();
  return record as unknown as StoreManifestV01;
}

function readStoreManifestLooseV01(
  directory: string,
  artifactsDirectory: string,
): StoreManifestV01 | null {
  try {
    const manifestPath = path.join(directory, STORE_MANIFEST_NAME_V01);
    const stat = lstatSync(manifestPath);
    if (
      !stat.isFile() ||
      stat.isSymbolicLink() ||
      realpathSync.native(manifestPath) !== manifestPath ||
      !isPhysicalChildV01(artifactsDirectory, manifestPath)
    ) return null;
    return parseStoreManifestV01(readFileSync(manifestPath, "utf8"));
  } catch {
    return null;
  }
}

function artifactDirectoryV01(root: string, artifact: CodexQualifiedRuntimeArtifactV01): string {
  return storePathV01(root, "artifacts", artifactKeyV01(artifact));
}

function artifactKeyV01(artifact: CodexQualifiedRuntimeArtifactV01): string {
  const tupleFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(storeArtifactIdentityV01(artifact)),
  ).slice("sha256:".length);
  return `${artifact.entry_id}--${tupleFingerprint}`;
}

function managedDirectNativeAdmittedV01(
  artifact: CodexQualifiedRuntimeArtifactV01,
): boolean {
  return artifact.admitted_discovery_launch_shapes.some(
    ({ shape }) => shape === "direct_native",
  );
}

function assertManagedDirectNativeAdmittedV01(
  selection: CodexQualifiedRuntimeSelectionV01,
): void {
  if (!managedDirectNativeAdmittedV01(selection.artifact)) {
    throw new CodexManagedRuntimeStoreErrorV01(
      "codex_managed_runtime_ineligible",
    );
  }
}

function storePathV01(root: string, ...segments: string[]): string {
  if (!path.isAbsolute(root)) throw new CodexManagedRuntimeStoreErrorV01("codex_managed_runtime_store_root_invalid");
  const resolvedRoot = path.resolve(root);
  const target = path.resolve(resolvedRoot, ...segments);
  const relative = path.relative(resolvedRoot, target);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new CodexManagedRuntimeStoreErrorV01("codex_managed_runtime_store_root_invalid");
  }
  return target;
}

function assertStoreRootV01(root: string, create = false): string | null {
  if (!path.isAbsolute(root)) throw new CodexManagedRuntimeStoreErrorV01("codex_managed_runtime_store_root_invalid");
  const expected = path.resolve(root);
  const existing = lstatIfExistsV01(expected);
  if (!existing && create) mkdirSync(expected, { recursive: true, mode: 0o700 });
  const stat = lstatIfExistsV01(expected);
  if (!stat) return null;
  if (
    !stat.isDirectory() ||
    stat.isSymbolicLink() ||
    realpathSync.native(expected) !== expected
  ) {
    throw new CodexManagedRuntimeStoreErrorV01(
      "codex_managed_runtime_store_root_invalid",
    );
  }
  return expected;
}

function assertArtifactsRootV01(
  root: string,
  create = false,
): string | null {
  const managedRoot = assertStoreRootV01(root, create);
  if (!managedRoot) return null;
  const artifactsRoot = path.join(managedRoot, "artifacts");
  const existing = lstatIfExistsV01(artifactsRoot);
  if (!existing && create) mkdirSync(artifactsRoot, { mode: 0o700 });
  const stat = lstatIfExistsV01(artifactsRoot);
  if (!stat) return null;
  if (
    !stat.isDirectory() ||
    stat.isSymbolicLink() ||
    realpathSync.native(artifactsRoot) !== artifactsRoot ||
    !isPhysicalChildV01(managedRoot, artifactsRoot)
  ) {
    throw new CodexManagedRuntimeStoreErrorV01(
      "codex_managed_runtime_store_root_invalid",
    );
  }
  return artifactsRoot;
}

interface DirectoryIdentityV01 {
  dev: number;
  ino: number;
}

function directoryIdentityV01(stat: Stats): DirectoryIdentityV01 {
  return { dev: stat.dev, ino: stat.ino };
}

function sameDirectoryIdentityV01(
  stat: Stats,
  identity: DirectoryIdentityV01,
): boolean {
  return stat.dev === identity.dev && stat.ino === identity.ino;
}

function isPhysicalChildV01(parent: string, candidate: string): boolean {
  const relative = path.relative(parent, candidate);
  return (
    relative !== "" &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

function lstatIfExistsV01(target: string): Stats | null {
  try {
    return lstatSync(target);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

function assertOwnedArtifactDirectoryV01(input: {
  root: string;
  artifacts_directory: string;
  directory: string;
  identity: DirectoryIdentityV01;
}): void {
  const currentArtifactsRoot = assertArtifactsRootV01(input.root);
  if (
    currentArtifactsRoot !== input.artifacts_directory ||
    path.dirname(input.directory) !== currentArtifactsRoot
  ) {
    throw new CodexManagedRuntimeStoreErrorV01(
      "codex_managed_runtime_store_root_invalid",
    );
  }
  const stat = lstatSync(input.directory);
  if (
    !stat.isDirectory() ||
    stat.isSymbolicLink() ||
    !sameDirectoryIdentityV01(stat, input.identity) ||
    realpathSync.native(input.directory) !== input.directory ||
    !isPhysicalChildV01(currentArtifactsRoot, input.directory)
  ) {
    throw new CodexManagedRuntimeStoreErrorV01(
      "codex_managed_runtime_corrupt",
    );
  }
}

function removeProvablyOwnedArtifactDirectoryV01(input: {
  root: string;
  artifacts_directory: string;
  directory: string;
  identity: DirectoryIdentityV01;
}): void {
  assertOwnedArtifactDirectoryV01(input);
  makeTreeWritableV01(input.directory);
  assertOwnedArtifactDirectoryV01(input);
  rmSync(input.directory, { recursive: true, force: true });
}

function ensureDirectoryV01(directory: string): void {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  assertExactDirectoryV01(directory);
}

function assertExactDirectoryV01(directory: string): void {
  const stat = lstatSync(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new CodexManagedRuntimeStoreErrorV01("codex_managed_runtime_store_root_invalid");
}

function compareSemverV01(left: string, right: string): number {
  const leftParts = left.split(".").map(BigInt);
  const rightParts = right.split(".").map(BigInt);
  for (let index = 0; index < 3; index += 1) {
    const difference = leftParts[index]! - rightParts[index]!;
    if (difference < BigInt(0)) return -1;
    if (difference > BigInt(0)) return 1;
  }
  return 0;
}

function sha256BufferV01(value: Buffer): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function sha256FileV01(value: string): string {
  return sha256BufferV01(readFileSync(value));
}

function tarStringV01(field: Buffer): string {
  const nul = field.indexOf(0);
  const content = field.subarray(0, nul === -1 ? field.length : nul);
  if ([...content].some((byte) => byte < 0x20 || byte > 0x7e)) throw new CodexManagedRuntimeStoreErrorV01("codex_managed_runtime_archive_unsafe");
  return content.toString("ascii");
}

function tarOctalV01(field: Buffer): number {
  const value = tarStringV01(field).trim();
  if (!/^[0-7]+$/u.test(value)) throw new CodexManagedRuntimeStoreErrorV01("codex_managed_runtime_archive_unsafe");
  const parsed = Number.parseInt(value, 8);
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new CodexManagedRuntimeStoreErrorV01("codex_managed_runtime_archive_unsafe");
  return parsed;
}

function assertTarChecksumV01(header: Buffer): void {
  const expected = tarOctalV01(header.subarray(148, 156));
  let actual = 0;
  for (let index = 0; index < 512; index += 1) actual += index >= 148 && index < 156 ? 0x20 : header[index]!;
  if (actual !== expected) throw new CodexManagedRuntimeStoreErrorV01("codex_managed_runtime_archive_unsafe");
}

function safeArchivePathV01(value: string): boolean {
  return Boolean(value) && !path.posix.isAbsolute(value) && !path.win32.isAbsolute(value) && !value.includes("\\") && value.split("/").every((part) => part !== "" && part !== "." && part !== "..");
}

async function acquireStageLockV01(input: {
  root: string;
  artifact: CodexQualifiedRuntimeArtifactV01;
  dependencies: Partial<StoreTestDependenciesV01>;
}): Promise<{ directory: string; token: string; owner_path: string }> {
  const locks = storePathV01(input.root, "locks");
  ensureDirectoryV01(locks);
  const directory = path.join(locks, `${artifactKeyV01(input.artifact)}.lock`);
  const token = randomUUID();
  const ownerPath = path.join(directory, "owner.json");
  const now = input.dependencies.now ?? Date.now;
  const processIdentity = input.dependencies.process_identity ?? readProcessIdentityV01;
  recoverStaleLeaseCandidatesV01(locks, now(), processIdentity);
  const identity = processIdentity(process.pid);
  if (identity.state !== "present") {
    throw new CodexManagedRuntimeStoreErrorV01("codex_managed_runtime_locked");
  }
  const candidateDirectory = path.join(locks, `.lease-${token}`);
  mkdirSync(candidateDirectory, { mode: 0o700 });
  writeFileSync(
    path.join(candidateDirectory, "owner.json"),
    `${JSON.stringify({
      token,
      owner_pid: process.pid,
      owner_process_identity: identity.identity,
      created_at_ms: now(),
    })}\n`,
    { flag: "wx", mode: 0o600 },
  );
  const deadline = Date.now() + (input.dependencies.lock_wait_ms ?? LOCK_WAIT_MS_V01);
  try {
    while (true) {
      try {
        renameSync(candidateDirectory, directory);
        return { directory, token, owner_path: ownerPath };
      } catch (error) {
        if (
          (error as NodeJS.ErrnoException).code !== "EEXIST" &&
          (error as NodeJS.ErrnoException).code !== "ENOTEMPTY"
        ) throw error;
        if (recoverStaleLockV01(directory, now(), processIdentity)) continue;
        if (Date.now() >= deadline) throw new CodexManagedRuntimeStoreErrorV01("codex_managed_runtime_locked");
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
    }
  } finally {
    if (existsSync(candidateDirectory)) {
      rmSync(candidateDirectory, { recursive: true, force: true });
    }
  }
}

function recoverStaleLeaseCandidatesV01(
  locksDirectory: string,
  nowMs: number,
  processIdentity: NonNullable<StoreTestDependenciesV01["process_identity"]>,
): void {
  for (const name of readdirSync(locksDirectory)) {
    if (!/^\.lease-[0-9a-f-]{36}$/u.test(name)) continue;
    recoverStaleLockV01(
      path.join(locksDirectory, name),
      nowMs,
      processIdentity,
    );
  }
}

function recoverStaleLockV01(
  directory: string,
  nowMs: number,
  processIdentity: NonNullable<StoreTestDependenciesV01["process_identity"]>,
): boolean {
  try {
    const owner = JSON.parse(readFileSync(path.join(directory, "owner.json"), "utf8")) as Record<string, unknown>;
    if (
      typeof owner.token !== "string" ||
      !Number.isInteger(owner.owner_pid) ||
      typeof owner.owner_process_identity !== "string" ||
      !Number.isFinite(owner.created_at_ms) ||
      nowMs - Number(owner.created_at_ms) <= LOCK_STALE_AFTER_MS_V01
    ) return false;
    const current = processIdentity(Number(owner.owner_pid));
    if (current.state !== "missing" && !(current.state === "present" && current.identity !== owner.owner_process_identity)) return false;
    const recovered = `${directory}.recovered-${randomUUID()}`;
    renameSync(directory, recovered);
    rmSync(recovered, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}

function releaseStageLockV01(owner: { directory: string; token: string; owner_path: string }): void {
  try {
    const record = JSON.parse(readFileSync(owner.owner_path, "utf8")) as Record<string, unknown>;
    if (record.token !== owner.token) return;
    rmSync(owner.directory, { recursive: true, force: true });
  } catch {
    // Never delete an ownership record that cannot be proven to be ours.
  }
}

function readProcessIdentityV01(pid: number): { state: "present"; identity: string } | { state: "missing" | "unavailable" } {
  if (!Number.isInteger(pid) || pid <= 0) return { state: "missing" };
  const result = spawnSync("/bin/ps", ["-o", "lstart=", "-p", String(pid)], { encoding: "utf8", timeout: 1_500, windowsHide: true });
  const startedAt = result.status === 0 ? result.stdout.trim() : "";
  if (startedAt) return { state: "present", identity: createHash("sha256").update(`${process.platform}:${pid}:${startedAt}`).digest("hex") };
  try {
    process.kill(pid, 0);
    return { state: "unavailable" };
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "ESRCH" ? { state: "missing" } : { state: "unavailable" };
  }
}

function readEligibleLastKnownGoodV01(input: {
  root: string;
  active: CodexManagedRuntimeSelectionV01;
  registry: CodexQualifiedRuntimeRegistryV01;
  observed_at: string;
  dependencies: StoreValidationDependenciesV01;
}): CodexManagedRuntimeSelectionV01 | null {
  try {
    const record = readLastKnownGoodStateV01(input.root);
    if (!record || record.lane !== input.active.lane) return null;
    const activeEntryId =
      input.active.qualified_runtime_selection.artifact.entry_id;
    const rollbackEntryId =
      record.registry_entry_id !== activeEntryId
        ? record.registry_entry_id
        : record.rollback_registry_entry_id;
    const rollbackManifestFingerprint =
      record.registry_entry_id !== activeEntryId
        ? record.store_manifest_fingerprint
        : record.rollback_store_manifest_fingerprint;
    if (!rollbackEntryId || !rollbackManifestFingerprint) return null;
    const selection = selectFromStoreV01({
      root: input.root,
      mode: "pinned_exact",
      lane: input.active.lane,
      pinned_entry_id: rollbackEntryId,
      registry: input.registry,
      observed_at: input.observed_at,
      dependencies: input.dependencies,
    });
    return selection.store_manifest_fingerprint === rollbackManifestFingerprint
      ? selection
      : null;
  } catch {
    return null;
  }
}

function readLastKnownGoodStateV01(root: string): null | {
  lane: CodexRuntimeLaneV01;
  registry_entry_id: string;
  store_manifest_fingerprint: string;
  rollback_registry_entry_id: string | null;
  rollback_store_manifest_fingerprint: string | null;
} {
  try {
    const record = JSON.parse(
      readFileSync(
        storePathV01(root, "state", "last-known-good.json"),
        "utf8",
      ),
    ) as Record<string, unknown>;
    if (
      canonicalizeProtocolValueV01(Object.keys(record).sort()) !==
        canonicalizeProtocolValueV01([
          "fingerprint",
          "lane",
          "observed_at",
          "registry_entry_id",
          "rollback_registry_entry_id",
          "rollback_store_manifest_fingerprint",
          "state_schema_version",
          "store_manifest_fingerprint",
        ].sort()) ||
      record.state_schema_version !==
        "codex_managed_runtime_last_known_good.v0.1" ||
      typeof record.fingerprint !== "string"
    ) return null;
    const { fingerprint, ...payload } = record;
    if (
      createProtocolSha256V01(canonicalizeProtocolValueV01(payload)) !==
        fingerprint ||
      (record.lane !== "ordinary_chatgpt_auth" &&
        record.lane !== "strict_agent_identity") ||
      typeof record.registry_entry_id !== "string" ||
      typeof record.store_manifest_fingerprint !== "string" ||
      !/^sha256:[a-f0-9]{64}$/u.test(record.store_manifest_fingerprint) ||
      typeof record.observed_at !== "string" ||
      parseStrictIsoTimestampV01(record.observed_at) === null ||
      !(
        (record.rollback_registry_entry_id === null &&
          record.rollback_store_manifest_fingerprint === null) ||
        (typeof record.rollback_registry_entry_id === "string" &&
          typeof record.rollback_store_manifest_fingerprint === "string" &&
          /^sha256:[a-f0-9]{64}$/u.test(
            record.rollback_store_manifest_fingerprint,
          ))
      )
    ) return null;
    return {
      lane: record.lane,
      registry_entry_id: record.registry_entry_id,
      store_manifest_fingerprint: record.store_manifest_fingerprint,
      rollback_registry_entry_id: record.rollback_registry_entry_id as
        | string
        | null,
      rollback_store_manifest_fingerprint:
        record.rollback_store_manifest_fingerprint as string | null,
    };
  } catch {
    return null;
  }
}

function makeTreeWritableV01(directory: string): void {
  if (!existsSync(directory)) return;
  try {
    const stat = lstatSync(directory);
    if (stat.isDirectory() && !stat.isSymbolicLink()) {
      chmodSync(directory, 0o700);
      for (const child of readdirSync(directory)) makeTreeWritableV01(path.join(directory, child));
    } else if (!stat.isSymbolicLink()) chmodSync(directory, 0o600);
  } catch {
    // Cleanup remains best-effort; the caller preserves the primary failure.
  }
}

function directoryByteSizeV01(
  directory: string,
  artifactsDirectory: string,
): number {
  const directoryStat = lstatSync(directory);
  if (
    !directoryStat.isDirectory() ||
    directoryStat.isSymbolicLink() ||
    realpathSync.native(directory) !== directory ||
    !isPhysicalChildV01(artifactsDirectory, directory)
  ) {
    throw new CodexManagedRuntimeStoreErrorV01(
      "codex_managed_runtime_corrupt",
    );
  }
  let total = 0;
  for (const name of readdirSync(directory)) {
    const candidate = path.join(directory, name);
    const stat = lstatSync(candidate);
    if (stat.isSymbolicLink()) {
      throw new CodexManagedRuntimeStoreErrorV01(
        "codex_managed_runtime_corrupt",
      );
    }
    if (stat.isDirectory()) {
      total += directoryByteSizeV01(candidate, artifactsDirectory);
    }
    else if (stat.isFile()) total += stat.size;
    else {
      throw new CodexManagedRuntimeStoreErrorV01(
        "codex_managed_runtime_corrupt",
      );
    }
  }
  return total;
}

function registryForTestV01(value: unknown): CodexQualifiedRuntimeRegistryV01 {
  return value === undefined
    ? CODEX_QUALIFIED_RUNTIME_REGISTRY_V01
    : validateCodexQualifiedRuntimeRegistryV01(value);
}

function requireTestModeV01(): void {
  if (process.env[TEST_MODE_ENVIRONMENT_KEY_V01] !== "1") throw new CodexManagedRuntimeStoreErrorV01("codex_managed_runtime_test_override_refused");
}
