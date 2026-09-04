import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  accessSync,
  closeSync,
  constants,
  existsSync,
  lstatSync,
  openSync,
  readFileSync,
  readSync,
  realpathSync,
} from "node:fs";
import path from "node:path";

import {
  assertCodexManagedRuntimeSelectionUnchangedV01,
  managedRootFromEnvironmentV01,
  selectCodexManagedRuntimeV01,
  type CodexManagedRuntimeSelectionV01,
} from "@/lib/vnext/native-host/codex-managed-runtime-store";
import {
  assertCurrentCodexQualifiedRuntimeSelectionV01,
  legacyExactCodexQualificationEvidenceV01,
  selectPinnedCodexQualifiedRuntimeV01,
  type CodexQualifiedRuntimeSelectionV01,
  type CodexRuntimeLaunchShapeV01,
} from "@/lib/vnext/native-host/codex-qualified-runtime-registry";

export const CODEX_PRODUCTION_RUNTIME_RESOLUTION_VERSION_V01 =
  "codex_production_runtime_resolution.v0.1" as const;

export type CodexProductionRuntimeLaunchShapeV01 = CodexRuntimeLaunchShapeV01;

interface CodexProductionRuntimeFileIdentityV01 {
  device: string;
  inode: string;
  size: string;
  mode: string;
  modified_ns: string;
  changed_ns: string;
}

export interface CodexProductionRuntimeIdentityV01 {
  resolution_version: typeof CODEX_PRODUCTION_RUNTIME_RESOLUTION_VERSION_V01;
  availability: "exact_selected_runtime_available";
  launch_shape: CodexProductionRuntimeLaunchShapeV01;
  path_candidate_was_symlink: boolean;
  canonical_native_executable: string;
  executable_fingerprint: string;
  cli_version: string;
  upstream_tag: string;
  upstream_source_commit: string;
  upstream_target_triple: string;
  semantic_profile_fingerprint: string;
  qualified_runtime_entry_id: string;
  compatibility_profile_id: string;
  compatibility_profile_fingerprint: string;
  qualified_runtime_selection: CodexQualifiedRuntimeSelectionV01;
  registry_authority:
    | "checked_in_human_reviewed_manifest"
    | "test_injected_identity";
  runtime_ownership: "managed_store" | "path_discovery_test";
  managed_runtime_root: string | null;
  managed_store_manifest_fingerprint: string | null;
  managed_runtime_selection: CodexManagedRuntimeSelectionV01 | null;
  official_package_shape:
    | "not_applicable"
    | "nested_platform_package"
    | "bundled_vendor";
  admission: {
    path_candidate: string;
    resolved_path_entry: string;
    path_candidate_identity: CodexProductionRuntimeFileIdentityV01;
    resolved_path_entry_identity: CodexProductionRuntimeFileIdentityV01;
    native_target_identity: CodexProductionRuntimeFileIdentityV01;
    official_launcher_fingerprint: string | null;
  };
}

export class CodexProductionRuntimeErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "CodexProductionRuntimeErrorV01";
  }
}

interface CodexProductionRuntimeResolverDependenciesV01 {
  qualified_runtime_selection: CodexQualifiedRuntimeSelectionV01;
  registry_authority:
    | "checked_in_human_reviewed_manifest"
    | "test_injected_identity";
  expected_executable_fingerprint: string;
  expected_cli_version: string;
  platform: NodeJS.Platform;
  architecture: string;
  read_cli_version(nativeExecutable: string): string;
  before_final_identity_check?: () => void;
}

export function resolveCodexProductionRuntimeV01(input: {
  environment?: NodeJS.ProcessEnv;
  cwd?: string;
} = {}): CodexProductionRuntimeIdentityV01 {
  const environment = input.environment ?? process.env;
  const managedRoot = managedRootFromEnvironmentV01(environment);
  const managedSelection = selectCodexManagedRuntimeV01({
    root: managedRoot,
    mode: "pinned_exact",
    lane: "ordinary_chatgpt_auth",
    environment,
  });
  return managedProductionIdentityV01(managedRoot, managedSelection, environment);
}

/** Test-only injected identity owner. It cannot be used by the adapter. */
export function resolveCodexProductionRuntimeForTestV01(input: {
  environment: NodeJS.ProcessEnv;
  cwd: string;
  expected_executable_fingerprint: string;
  expected_cli_version?: string;
  qualified_runtime_registry?: unknown;
  platform?: NodeJS.Platform;
  architecture?: string;
  read_cli_version(nativeExecutable: string): string;
  before_final_identity_check?: () => void;
}): CodexProductionRuntimeIdentityV01 {
  if (process.env.AUGNES_CODEX_PRODUCTION_RUNTIME_TEST_MODE !== "1") {
    throw new CodexProductionRuntimeErrorV01(
      "codex_production_runtime_test_override_refused",
    );
  }
  const qualifiedRuntimeSelection = selectPinnedCodexQualifiedRuntimeV01({
    lane: "ordinary_chatgpt_auth",
    registry: input.qualified_runtime_registry,
  });
  return resolveCodexProductionRuntimeWithDependenciesV01(
    { environment: input.environment, cwd: input.cwd },
    {
      qualified_runtime_selection: qualifiedRuntimeSelection,
      registry_authority: "test_injected_identity",
      expected_executable_fingerprint: input.expected_executable_fingerprint,
      expected_cli_version:
        input.expected_cli_version ??
        qualifiedRuntimeSelection.artifact.version,
      platform: input.platform ?? "darwin",
      architecture: input.architecture ?? "arm64",
      read_cli_version: input.read_cli_version,
      before_final_identity_check: input.before_final_identity_check,
    },
  );
}

export function assertCodexProductionRuntimeIdentityUnchangedV01(
  identity: CodexProductionRuntimeIdentityV01,
): void {
  try {
    if (identity.registry_authority === "checked_in_human_reviewed_manifest") {
      assertCurrentCodexQualifiedRuntimeSelectionV01(
        identity.qualified_runtime_selection,
      );
      if (
        identity.runtime_ownership !== "managed_store" ||
        identity.managed_runtime_root === null ||
        identity.managed_runtime_selection === null ||
        identity.managed_store_manifest_fingerprint !==
          identity.managed_runtime_selection.store_manifest_fingerprint
      ) throw new Error();
      assertCodexManagedRuntimeSelectionUnchangedV01(
        identity.managed_runtime_selection,
        { root: identity.managed_runtime_root },
      );
    } else if (
      identity.registry_authority !== "test_injected_identity" ||
      process.env.AUGNES_CODEX_PRODUCTION_RUNTIME_TEST_MODE !== "1" ||
      identity.runtime_ownership !== "path_discovery_test" ||
      identity.managed_runtime_root !== null ||
      identity.managed_store_manifest_fingerprint !== null ||
      identity.managed_runtime_selection !== null
    ) {
      throw new Error();
    }
    if (
      identity.resolution_version !==
        CODEX_PRODUCTION_RUNTIME_RESOLUTION_VERSION_V01 ||
      identity.availability !== "exact_selected_runtime_available" ||
      identity.qualified_runtime_entry_id !==
        identity.qualified_runtime_selection.artifact.entry_id ||
      identity.compatibility_profile_id !==
        identity.qualified_runtime_selection.compatibility_profile.profile_id ||
      identity.compatibility_profile_fingerprint !==
        identity.qualified_runtime_selection.compatibility_profile.fingerprint ||
      identity.upstream_tag !==
        identity.qualified_runtime_selection.artifact.release_tag ||
      identity.upstream_source_commit !==
        identity.qualified_runtime_selection.artifact.tagged_source_commit ||
      identity.upstream_target_triple !==
        identity.qualified_runtime_selection.artifact.upstream_target_triple ||
      identity.cli_version !==
        identity.qualified_runtime_selection.artifact.version ||
      identity.semantic_profile_fingerprint !==
        legacyExactCodexQualificationEvidenceV01(
          identity.qualified_runtime_selection.artifact,
        ).semantic_profile_fingerprint ||
      (identity.registry_authority === "checked_in_human_reviewed_manifest" &&
        identity.executable_fingerprint !==
          identity.qualified_runtime_selection.artifact
            .native_executable_sha256) ||
      !path.isAbsolute(identity.canonical_native_executable) ||
      realpathSync.native(identity.admission.path_candidate) !==
        identity.admission.resolved_path_entry ||
      !sameFileIdentityV01(
        identity.admission.path_candidate_identity,
        fileIdentityV01(identity.admission.path_candidate),
      ) ||
      !sameFileIdentityV01(
        identity.admission.resolved_path_entry_identity,
        fileIdentityV01(identity.admission.resolved_path_entry),
      ) ||
      !sameFileIdentityV01(
        identity.admission.native_target_identity,
        fileIdentityV01(identity.canonical_native_executable),
      ) ||
      realpathSync.native(identity.canonical_native_executable) !==
        identity.canonical_native_executable ||
      sha256FileV01(identity.canonical_native_executable) !==
        identity.executable_fingerprint ||
      (identity.admission.official_launcher_fingerprint !== null &&
        sha256FileV01(identity.admission.resolved_path_entry) !==
          identity.admission.official_launcher_fingerprint) ||
      !identityLaunchShapeRemainsAdmittedV01(identity)
    ) {
      throw new Error();
    }
  } catch {
    throw new CodexProductionRuntimeErrorV01(
      "codex_production_runtime_identity_changed",
    );
  }
}

function resolveCodexProductionRuntimeWithDependenciesV01(
  input: { environment: NodeJS.ProcessEnv; cwd: string },
  dependencies: CodexProductionRuntimeResolverDependenciesV01,
): CodexProductionRuntimeIdentityV01 {
  assertSelectedProductionTupleV01(dependencies);
  const pathCandidate = firstPathCodexCandidateV01(input);
  const pathCandidateIdentity = fileIdentityV01(pathCandidate);
  const pathCandidateWasSymlink = lstatSync(pathCandidate).isSymbolicLink();
  let resolvedPathEntry: string;
  try {
    resolvedPathEntry = realpathSync.native(pathCandidate);
  } catch {
    throw new CodexProductionRuntimeErrorV01(
      "codex_production_runtime_launch_shape_unsupported",
    );
  }
  const resolvedPathEntryIdentity = fileIdentityV01(resolvedPathEntry);
  const resolvedEntryFingerprint = sha256FileV01(resolvedPathEntry);

  let launchShape: CodexProductionRuntimeLaunchShapeV01;
  let officialPackageShape:
    | "not_applicable"
    | "nested_platform_package"
    | "bundled_vendor" = "not_applicable";
  let nativeTarget: string;
  let officialLauncherFingerprint: string | null = null;

  if (isDarwinArm64NativeV01(resolvedPathEntry)) {
    launchShape =
      pathCandidateWasSymlink || pathCandidate !== resolvedPathEntry
        ? "symlink_to_native"
        : "direct_native";
    nativeTarget = resolvedPathEntry;
    requireSelectedLaunchShapeV01(
      dependencies.qualified_runtime_selection,
      launchShape,
    );
  } else if (path.basename(resolvedPathEntry) === "codex.js") {
    const admittedLauncher = requireSelectedLaunchShapeV01(
      dependencies.qualified_runtime_selection,
      "official_openai_node_launcher",
    );
    if (resolvedEntryFingerprint !== admittedLauncher.launcher_sha256) {
      throw new CodexProductionRuntimeErrorV01(
        "codex_production_runtime_launch_shape_unsupported",
      );
    }
    const official = resolveOfficialNodeLauncherTargetV01(
      resolvedPathEntry,
      dependencies.expected_cli_version,
      dependencies.qualified_runtime_selection.artifact.upstream_target_triple,
      admittedLauncher.supported_package_layouts ?? [],
    );
    launchShape = "official_openai_node_launcher";
    officialPackageShape = official.package_shape;
    nativeTarget = official.native_target;
    officialLauncherFingerprint = resolvedEntryFingerprint;
  } else {
    throw new CodexProductionRuntimeErrorV01(
      "codex_production_runtime_launch_shape_unsupported",
    );
  }

  const canonicalNativeTarget = exactRegularExecutableV01(nativeTarget);
  const nativeTargetIdentity = fileIdentityV01(canonicalNativeTarget);
  const executableFingerprint = sha256FileV01(canonicalNativeTarget);
  if (executableFingerprint !== dependencies.expected_executable_fingerprint) {
    throw new CodexProductionRuntimeErrorV01(
      "codex_production_runtime_identity_mismatch",
    );
  }
  const cliVersion = dependencies.read_cli_version(canonicalNativeTarget);
  if (cliVersion !== dependencies.expected_cli_version) {
    throw new CodexProductionRuntimeErrorV01(
      "codex_production_runtime_identity_mismatch",
    );
  }

  const identity: CodexProductionRuntimeIdentityV01 = {
    resolution_version: CODEX_PRODUCTION_RUNTIME_RESOLUTION_VERSION_V01,
    availability: "exact_selected_runtime_available",
    launch_shape: launchShape,
    path_candidate_was_symlink: pathCandidateWasSymlink,
    canonical_native_executable: canonicalNativeTarget,
    executable_fingerprint: executableFingerprint,
    cli_version: cliVersion,
    upstream_tag:
      dependencies.qualified_runtime_selection.artifact.release_tag,
    upstream_source_commit:
      dependencies.qualified_runtime_selection.artifact.tagged_source_commit,
    upstream_target_triple:
      dependencies.qualified_runtime_selection.artifact.upstream_target_triple,
    semantic_profile_fingerprint:
      legacyExactCodexQualificationEvidenceV01(
        dependencies.qualified_runtime_selection.artifact,
      ).semantic_profile_fingerprint,
    qualified_runtime_entry_id:
      dependencies.qualified_runtime_selection.artifact.entry_id,
    compatibility_profile_id:
      dependencies.qualified_runtime_selection.compatibility_profile.profile_id,
    compatibility_profile_fingerprint:
      dependencies.qualified_runtime_selection.compatibility_profile.fingerprint,
    qualified_runtime_selection: dependencies.qualified_runtime_selection,
    registry_authority: dependencies.registry_authority,
    runtime_ownership: "path_discovery_test",
    managed_runtime_root: null,
    managed_store_manifest_fingerprint: null,
    managed_runtime_selection: null,
    official_package_shape: officialPackageShape,
    admission: {
      path_candidate: pathCandidate,
      resolved_path_entry: resolvedPathEntry,
      path_candidate_identity: pathCandidateIdentity,
      resolved_path_entry_identity: resolvedPathEntryIdentity,
      native_target_identity: nativeTargetIdentity,
      official_launcher_fingerprint: officialLauncherFingerprint,
    },
  };
  dependencies.before_final_identity_check?.();
  assertCodexProductionRuntimeIdentityUnchangedV01(identity);
  return Object.freeze(identity);
}

function managedProductionIdentityV01(
  managedRoot: string,
  managedSelection: CodexManagedRuntimeSelectionV01,
  environment: NodeJS.ProcessEnv,
): CodexProductionRuntimeIdentityV01 {
  const qualified = managedSelection.qualified_runtime_selection;
  const native = managedSelection.canonical_native_executable;
  const nativeIdentity = fileIdentityV01(native);
  const identity: CodexProductionRuntimeIdentityV01 = {
    resolution_version: CODEX_PRODUCTION_RUNTIME_RESOLUTION_VERSION_V01,
    availability: "exact_selected_runtime_available",
    launch_shape: "direct_native",
    path_candidate_was_symlink: false,
    canonical_native_executable: native,
    executable_fingerprint: qualified.artifact.native_executable_sha256,
    cli_version: readCodexCliVersionV01(native, environment),
    upstream_tag: qualified.artifact.release_tag,
    upstream_source_commit: qualified.artifact.tagged_source_commit,
    upstream_target_triple: qualified.artifact.upstream_target_triple,
    semantic_profile_fingerprint:
      legacyExactCodexQualificationEvidenceV01(qualified.artifact)
        .semantic_profile_fingerprint,
    qualified_runtime_entry_id: qualified.artifact.entry_id,
    compatibility_profile_id: qualified.compatibility_profile.profile_id,
    compatibility_profile_fingerprint:
      qualified.compatibility_profile.fingerprint,
    qualified_runtime_selection: qualified,
    registry_authority: "checked_in_human_reviewed_manifest",
    runtime_ownership: "managed_store",
    managed_runtime_root: managedRoot,
    managed_store_manifest_fingerprint:
      managedSelection.store_manifest_fingerprint,
    managed_runtime_selection: managedSelection,
    official_package_shape: "not_applicable",
    admission: {
      path_candidate: native,
      resolved_path_entry: native,
      path_candidate_identity: nativeIdentity,
      resolved_path_entry_identity: nativeIdentity,
      native_target_identity: nativeIdentity,
      official_launcher_fingerprint: null,
    },
  };
  assertCodexProductionRuntimeIdentityUnchangedV01(identity);
  return Object.freeze(identity);
}

function firstPathCodexCandidateV01(input: {
  environment: NodeJS.ProcessEnv;
  cwd: string;
}): string {
  const pathValue = input.environment.PATH;
  if (typeof pathValue !== "string" || pathValue.length === 0) {
    throw new CodexProductionRuntimeErrorV01(
      "codex_production_runtime_not_found",
    );
  }
  for (const rawEntry of pathValue.split(path.delimiter)) {
    const directory = rawEntry.length === 0 ? input.cwd : rawEntry;
    const candidate = path.resolve(directory, "codex");
    try {
      const stat = lstatSync(candidate);
      if (!stat.isFile() && !stat.isSymbolicLink()) {
        throw new CodexProductionRuntimeErrorV01(
          "codex_production_runtime_launch_shape_unsupported",
        );
      }
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch (error) {
      if (error instanceof CodexProductionRuntimeErrorV01) throw error;
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "ENOENT") continue;
      if (code === "EACCES") continue;
      throw new CodexProductionRuntimeErrorV01(
        "codex_production_runtime_launch_shape_unsupported",
      );
    }
  }
  throw new CodexProductionRuntimeErrorV01(
    "codex_production_runtime_not_found",
  );
}

function resolveOfficialNodeLauncherTargetV01(
  launcherPath: string,
  expectedCliVersion: string,
  targetTriple: string,
  supportedPackageLayouts: readonly string[],
): {
  native_target: string;
  package_shape: "nested_platform_package" | "bundled_vendor";
} {
  try {
    const packageRoot = realpathSync.native(
      path.resolve(path.dirname(launcherPath), ".."),
    );
    if (launcherPath !== path.join(packageRoot, "bin", "codex.js")) {
      throw new Error();
    }
    const manifest = exactJsonObjectV01(path.join(packageRoot, "package.json"));
    if (
      manifest.name !== "@openai/codex" ||
      manifest.version !== expectedCliVersion ||
      !manifest.bin ||
      typeof manifest.bin !== "object" ||
      Array.isArray(manifest.bin) ||
      (manifest.bin as Record<string, unknown>).codex !== "bin/codex.js"
    ) {
      throw new Error();
    }
    const nestedPackageRoot = path.join(
      packageRoot,
      "node_modules",
      "@openai",
      "codex-darwin-arm64",
    );
    const nestedTarget = path.join(
      nestedPackageRoot,
      "vendor",
      targetTriple,
      "bin",
      "codex",
    );
    if (
      existsSync(nestedPackageRoot) &&
      supportedPackageLayouts.includes("nested_platform_package")
    ) {
      const platformManifest = exactJsonObjectV01(
        path.join(nestedPackageRoot, "package.json"),
      );
      if (
        platformManifest.name !== "@openai/codex" ||
        platformManifest.version !== `${expectedCliVersion}-darwin-arm64`
      ) {
        throw new Error();
      }
      return {
        native_target: exactRegularExecutableV01(nestedTarget),
        package_shape: "nested_platform_package",
      };
    }
    if (!supportedPackageLayouts.includes("bundled_vendor")) throw new Error();
    const bundledTarget = path.join(
      packageRoot,
      "vendor",
      targetTriple,
      "bin",
      "codex",
    );
    return {
      native_target: exactRegularExecutableV01(bundledTarget),
      package_shape: "bundled_vendor",
    };
  } catch {
    throw new CodexProductionRuntimeErrorV01(
      "codex_production_runtime_launch_shape_unsupported",
    );
  }
}

function exactRegularExecutableV01(value: string): string {
  try {
    const exact = realpathSync.native(value);
    const stat = lstatSync(exact);
    accessSync(exact, constants.X_OK);
    if (
      !stat.isFile() ||
      stat.isSymbolicLink() ||
      !isDarwinArm64NativeV01(exact)
    ) {
      throw new Error();
    }
    return exact;
  } catch {
    throw new CodexProductionRuntimeErrorV01(
      "codex_production_runtime_launch_shape_unsupported",
    );
  }
}

function assertSelectedProductionTupleV01(
  dependencies: CodexProductionRuntimeResolverDependenciesV01,
): void {
  const selected = dependencies.qualified_runtime_selection;
  if (
    selected.selection_mode !== "pinned_exact" ||
    selected.lane !== "ordinary_chatgpt_auth" ||
    selected.artifact.lanes.ordinary_chatgpt_auth.status !== "qualified" ||
    dependencies.platform !== selected.artifact.platform ||
    dependencies.architecture !== selected.artifact.architecture ||
    dependencies.expected_cli_version !== selected.artifact.version
  ) {
    throw new CodexProductionRuntimeErrorV01(
      "codex_production_runtime_identity_mismatch",
    );
  }
}

function requireSelectedLaunchShapeV01(
  selection: CodexQualifiedRuntimeSelectionV01,
  shape: CodexProductionRuntimeLaunchShapeV01,
): CodexQualifiedRuntimeSelectionV01["artifact"]["admitted_discovery_launch_shapes"][number] {
  const launchShape = selection.artifact.admitted_discovery_launch_shapes.find(
    (candidate) => candidate.shape === shape,
  );
  if (!launchShape) {
    throw new CodexProductionRuntimeErrorV01(
      "codex_production_runtime_launch_shape_unsupported",
    );
  }
  return launchShape;
}

function identityLaunchShapeRemainsAdmittedV01(
  identity: CodexProductionRuntimeIdentityV01,
): boolean {
  const admitted = identity.qualified_runtime_selection.artifact.admitted_discovery_launch_shapes.find(
    (candidate) => candidate.shape === identity.launch_shape,
  );
  if (!admitted) return false;
  if (identity.launch_shape !== "official_openai_node_launcher") {
    return (
      identity.official_package_shape === "not_applicable" &&
      identity.admission.official_launcher_fingerprint === null
    );
  }
  return (
    typeof admitted.launcher_sha256 === "string" &&
    identity.admission.official_launcher_fingerprint ===
      admitted.launcher_sha256 &&
    identity.official_package_shape !== "not_applicable" &&
    (admitted.supported_package_layouts ?? []).includes(
      identity.official_package_shape,
    )
  );
}

function exactJsonObjectV01(value: string): Record<string, unknown> {
  const stat = lstatSync(value);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 32_768) {
    throw new Error();
  }
  const parsed: unknown = JSON.parse(readFileSync(value, "utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error();
  }
  return parsed as Record<string, unknown>;
}

function readCodexCliVersionV01(
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
  if (result.error || result.signal || result.status !== 0) {
    throw new CodexProductionRuntimeErrorV01(
      "codex_production_runtime_identity_mismatch",
    );
  }
  const match = result.stdout.match(/^codex-cli ([0-9]+\.[0-9]+\.[0-9]+)\s*$/u);
  if (!match) {
    throw new CodexProductionRuntimeErrorV01(
      "codex_production_runtime_identity_mismatch",
    );
  }
  return match[1]!;
}

function isDarwinArm64NativeV01(value: string): boolean {
  let descriptor: number | null = null;
  try {
    descriptor = openSync(value, "r");
    const magic = Buffer.alloc(4);
    if (readSync(descriptor, magic, 0, magic.length, 0) !== magic.length) {
      return false;
    }
    return magic.equals(Buffer.from([0xcf, 0xfa, 0xed, 0xfe]));
  } catch {
    return false;
  } finally {
    if (descriptor !== null) closeSync(descriptor);
  }
}

function sha256FileV01(value: string): string {
  const hash = createHash("sha256");
  const buffer = Buffer.allocUnsafe(1024 * 1024);
  const descriptor = openSync(value, "r");
  try {
    while (true) {
      const bytesRead = readSync(descriptor, buffer, 0, buffer.length, null);
      if (bytesRead === 0) break;
      hash.update(buffer.subarray(0, bytesRead));
    }
  } finally {
    closeSync(descriptor);
  }
  return `sha256:${hash.digest("hex")}`;
}

function fileIdentityV01(value: string): CodexProductionRuntimeFileIdentityV01 {
  const stat = lstatSync(value, { bigint: true });
  return {
    device: String(stat.dev),
    inode: String(stat.ino),
    size: String(stat.size),
    mode: String(stat.mode),
    modified_ns: String(stat.mtimeNs),
    changed_ns: String(stat.ctimeNs),
  };
}

function sameFileIdentityV01(
  left: CodexProductionRuntimeFileIdentityV01,
  right: CodexProductionRuntimeFileIdentityV01,
): boolean {
  return (
    left.device === right.device &&
    left.inode === right.inode &&
    left.size === right.size &&
    left.mode === right.mode &&
    left.modified_ns === right.modified_ns &&
    left.changed_ns === right.changed_ns
  );
}
