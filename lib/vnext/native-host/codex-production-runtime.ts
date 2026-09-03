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
  CODEX_ISOLATED_AUTH_PINNED_PRODUCTION_EXECUTABLE_FINGERPRINT_V01,
  CODEX_ISOLATED_AUTH_PINNED_PRODUCTION_SEMANTIC_PROFILE_FINGERPRINT_V01,
  CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01,
  CODEX_ISOLATED_AUTH_UPSTREAM_SOURCE_COMMIT_V01,
  CODEX_ISOLATED_AUTH_UPSTREAM_TAG_V01,
} from "@/types/vnext/codex-isolated-auth-projection";

export const CODEX_PRODUCTION_RUNTIME_RESOLUTION_VERSION_V01 =
  "codex_production_runtime_resolution.v0.1" as const;

/**
 * Exact rust-v0.152.1 `codex-cli/bin/codex.js` source bytes. The launcher is
 * recognized only to derive its official vendor target; Augnes never spawns
 * the launcher after admission.
 */
export const CODEX_PRODUCTION_OFFICIAL_NODE_LAUNCHER_FINGERPRINT_V01 =
  "sha256:134063e133f0b4244fa3b251acf973d4fe4b4aeeacbdc135211bf480f59f1477" as const;

export type CodexProductionRuntimeLaunchShapeV01 =
  | "direct_native"
  | "symlink_to_native"
  | "official_openai_node_launcher";

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
  executable_fingerprint: typeof CODEX_ISOLATED_AUTH_PINNED_PRODUCTION_EXECUTABLE_FINGERPRINT_V01 | string;
  cli_version: typeof CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01 | string;
  upstream_tag: typeof CODEX_ISOLATED_AUTH_UPSTREAM_TAG_V01;
  upstream_source_commit: typeof CODEX_ISOLATED_AUTH_UPSTREAM_SOURCE_COMMIT_V01;
  semantic_profile_fingerprint: typeof CODEX_ISOLATED_AUTH_PINNED_PRODUCTION_SEMANTIC_PROFILE_FINGERPRINT_V01;
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
  expected_executable_fingerprint: string;
  expected_cli_version: string;
  expected_official_launcher_fingerprint: string;
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
  return resolveCodexProductionRuntimeWithDependenciesV01(
    {
      environment,
      cwd: input.cwd ?? process.cwd(),
    },
    {
      expected_executable_fingerprint:
        CODEX_ISOLATED_AUTH_PINNED_PRODUCTION_EXECUTABLE_FINGERPRINT_V01,
      expected_cli_version: CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01,
      expected_official_launcher_fingerprint:
        CODEX_PRODUCTION_OFFICIAL_NODE_LAUNCHER_FINGERPRINT_V01,
      platform: process.platform,
      architecture: process.arch,
      read_cli_version: (nativeExecutable) =>
        readCodexCliVersionV01(nativeExecutable, environment),
    },
  );
}

/** Test-only injected identity owner. It cannot be used by the adapter. */
export function resolveCodexProductionRuntimeForTestV01(input: {
  environment: NodeJS.ProcessEnv;
  cwd: string;
  expected_executable_fingerprint: string;
  expected_cli_version?: string;
  expected_official_launcher_fingerprint?: string;
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
  return resolveCodexProductionRuntimeWithDependenciesV01(
    { environment: input.environment, cwd: input.cwd },
    {
      expected_executable_fingerprint: input.expected_executable_fingerprint,
      expected_cli_version:
        input.expected_cli_version ??
        CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01,
      expected_official_launcher_fingerprint:
        input.expected_official_launcher_fingerprint ??
        CODEX_PRODUCTION_OFFICIAL_NODE_LAUNCHER_FINGERPRINT_V01,
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
    if (
      identity.resolution_version !==
        CODEX_PRODUCTION_RUNTIME_RESOLUTION_VERSION_V01 ||
      identity.availability !== "exact_selected_runtime_available" ||
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
          identity.admission.official_launcher_fingerprint)
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
  } else if (
    resolvedEntryFingerprint ===
      dependencies.expected_official_launcher_fingerprint &&
    path.basename(resolvedPathEntry) === "codex.js"
  ) {
    const official = resolveOfficialNodeLauncherTargetV01(
      resolvedPathEntry,
      dependencies.expected_cli_version,
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
    upstream_tag: CODEX_ISOLATED_AUTH_UPSTREAM_TAG_V01,
    upstream_source_commit:
      CODEX_ISOLATED_AUTH_UPSTREAM_SOURCE_COMMIT_V01,
    semantic_profile_fingerprint:
      CODEX_ISOLATED_AUTH_PINNED_PRODUCTION_SEMANTIC_PROFILE_FINGERPRINT_V01,
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
    const targetTriple = "aarch64-apple-darwin";
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
    if (existsSync(nestedPackageRoot)) {
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
  if (
    dependencies.platform !== "darwin" ||
    dependencies.architecture !== "arm64" ||
    CODEX_ISOLATED_AUTH_SUPPORTED_CLI_VERSION_V01 !== "0.152.1" ||
    CODEX_ISOLATED_AUTH_UPSTREAM_TAG_V01 !== "rust-v0.152.1" ||
    CODEX_ISOLATED_AUTH_UPSTREAM_SOURCE_COMMIT_V01 !==
      "5adb68a49933ae446bf11935662c83dba55a0804" ||
    CODEX_ISOLATED_AUTH_PINNED_PRODUCTION_EXECUTABLE_FINGERPRINT_V01 !==
      "sha256:8194ea3181f330e63023b234b0b231855e5874e0331c5ef7cbc490591497a7bf" ||
    CODEX_ISOLATED_AUTH_PINNED_PRODUCTION_SEMANTIC_PROFILE_FINGERPRINT_V01 !==
      "sha256:795aefcda75d4b169dec3df4db3b3b30fc583c7202f1be7fc9eb6b809a694529"
  ) {
    throw new CodexProductionRuntimeErrorV01(
      "codex_production_runtime_identity_mismatch",
    );
  }
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
