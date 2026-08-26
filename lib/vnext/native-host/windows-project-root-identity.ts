import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import {
  lstatSync,
  readFileSync,
  realpathSync,
} from "node:fs";
import { release as operatingSystemRelease } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { createProtocolSha256V01 } from "@/lib/vnext/protocol-primitives";
import type { NativeHostWindowsPhysicalRootIdentityV01 } from "@/types/vnext/native-host-adapter";

export const WINDOWS_PHYSICAL_ROOT_IDENTITY_VERSION_V01 =
  "physical_root_identity.windows.v0.1" as const;
export const WINDOWS_PHYSICAL_ROOT_HELPER_CONTRACT_V01 =
  "augnes.windows_physical_root_helper.v0.1" as const;
export const WINDOWS_PHYSICAL_ROOT_HELPER_MANIFEST_V01 =
  "augnes.windows_physical_root_helper_manifest.v0.1" as const;
export const WINDOWS_PHYSICAL_ROOT_HELPER_RELATIVE_PATH_V01 =
  "native/windows-x64/augnes-windows-physical-root-v0.1.exe" as const;
export const WINDOWS_PHYSICAL_ROOT_HELPER_MANIFEST_RELATIVE_PATH_V01 =
  "native/windows-x64/augnes-windows-physical-root-v0.1.json" as const;
export const WINDOWS_PHYSICAL_ROOT_MINIMUM_BUILD_V01 = 19_045 as const;

const MAX_INPUT_PATH_BYTES = 32_768 * 4;
const MAX_HELPER_OUTPUT_BYTES = 16 * 1024;
const MAX_HELPER_ERROR_BYTES = 4 * 1024;
const MAX_HELPER_MANIFEST_BYTES = 8 * 1024;
const HELPER_TIMEOUT_MS = 3_000;
const execFileAsync = promisify(execFile);

export class WindowsProjectRootIdentityErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "WindowsProjectRootIdentityErrorV01";
  }
}

interface WindowsPhysicalRootHelperManifestV01 {
  contract: typeof WINDOWS_PHYSICAL_ROOT_HELPER_MANIFEST_V01;
  helper_contract: typeof WINDOWS_PHYSICAL_ROOT_HELPER_CONTRACT_V01;
  identity_version: typeof WINDOWS_PHYSICAL_ROOT_IDENTITY_VERSION_V01;
  platform: "win32";
  architecture: "x64";
  minimum_windows_build: typeof WINDOWS_PHYSICAL_ROOT_MINIMUM_BUILD_V01;
  helper_file: typeof WINDOWS_PHYSICAL_ROOT_HELPER_RELATIVE_PATH_V01;
  helper_sha256: string;
}

interface WindowsPhysicalRootComponentSnapshotV01 {
  logical_path: string;
  physical_path: string;
  device: bigint;
  inode: bigint;
  size: bigint;
  modified_ns: bigint;
  changed_ns: bigint;
  sha256: string;
}

interface WindowsPhysicalRootManifestReadV01 {
  manifest: WindowsPhysicalRootHelperManifestV01;
  component: WindowsPhysicalRootComponentSnapshotV01;
}

export interface WindowsPhysicalRootHelperProcessV01 {
  run(input: {
    helper_path: string;
    canonical_root: string;
    runtime_root: string;
  }): Promise<{ stdout: string; stderr: string; exit_code: number }>;
}

const SYSTEM_WINDOWS_PHYSICAL_ROOT_HELPER_PROCESS_V01: WindowsPhysicalRootHelperProcessV01 = {
  async run(input) {
    const environment: NodeJS.ProcessEnv = { NODE_ENV: "production" };
    for (const key of ["SystemRoot", "WINDIR"] as const) {
      const value = process.env[key];
      if (typeof value === "string" && value.length > 0) environment[key] = value;
    }
    try {
      const result = await execFileAsync(
        input.helper_path,
        [
          "--contract",
          WINDOWS_PHYSICAL_ROOT_HELPER_CONTRACT_V01,
          "--path",
          input.canonical_root,
        ],
        {
          cwd: input.runtime_root,
          encoding: "utf8",
          env: environment,
          maxBuffer: MAX_HELPER_OUTPUT_BYTES,
          timeout: HELPER_TIMEOUT_MS,
          windowsHide: true,
          shell: false,
        },
      );
      return { stdout: result.stdout, stderr: result.stderr, exit_code: 0 };
    } catch (error) {
      const candidate = error as {
        code?: string | number;
        killed?: boolean;
        signal?: string;
        stdout?: string;
        stderr?: string;
      };
      if (candidate.killed || candidate.signal || candidate.code === "ETIMEDOUT") {
        throw new WindowsProjectRootIdentityErrorV01(
          "windows_physical_identity_helper_timeout",
        );
      }
      if (candidate.code === "ENOENT") {
        throw new WindowsProjectRootIdentityErrorV01(
          "windows_physical_identity_component_missing",
        );
      }
      if (candidate.code === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER") {
        throw new WindowsProjectRootIdentityErrorV01(
          "windows_physical_identity_helper_output_oversized",
        );
      }
      const stdout = typeof candidate.stdout === "string" ? candidate.stdout : "";
      const stderr = typeof candidate.stderr === "string" ? candidate.stderr : "";
      if (
        Buffer.byteLength(stdout, "utf8") > MAX_HELPER_OUTPUT_BYTES ||
        Buffer.byteLength(stderr, "utf8") > MAX_HELPER_ERROR_BYTES
      ) {
        throw new WindowsProjectRootIdentityErrorV01(
          "windows_physical_identity_helper_output_oversized",
        );
      }
      return {
        stdout,
        stderr,
        exit_code: typeof candidate.code === "number" ? candidate.code : 1,
      };
    }
  },
};

export async function inspectWindowsPhysicalRootIdentityV01(
  canonicalRoot: string,
  options: {
    platform?: NodeJS.Platform;
    architecture?: NodeJS.Architecture;
    windows_version?: string;
    runtime_root?: string;
    helper_process?: WindowsPhysicalRootHelperProcessV01;
  } = {},
): Promise<NativeHostWindowsPhysicalRootIdentityV01> {
  const platform = options.platform ?? process.platform;
  const architecture = options.architecture ?? process.arch;
  if (platform !== "win32") {
    throw new WindowsProjectRootIdentityErrorV01(
      "windows_physical_identity_platform_unsupported",
    );
  }
  if (architecture !== "x64") {
    throw new WindowsProjectRootIdentityErrorV01(
      "windows_physical_identity_architecture_unsupported",
    );
  }
  assertSupportedWindowsVersionV01(
    options.windows_version ?? operatingSystemRelease(),
  );
  const normalizedInput = validateWindowsRootInputV01(canonicalRoot);
  const runtimeRoot = resolveRuntimeRootV01(options.runtime_root ?? process.cwd());
  const runtimeRootSnapshot = captureRuntimeRootSnapshotV01(runtimeRoot);
  const manifestRead = readWindowsHelperManifestV01(runtimeRoot);
  const helper = resolveVerifiedHelperPathV01(
    runtimeRoot,
    manifestRead.manifest,
  );
  // Yield once so same-process replacement attempts between admission and
  // execution are covered by the final identity/integrity revalidation too.
  await Promise.resolve();
  assertRuntimeRootSnapshotUnchangedV01(runtimeRoot, runtimeRootSnapshot);
  assertComponentSnapshotUnchangedV01(runtimeRoot, manifestRead.component);
  assertComponentSnapshotUnchangedV01(runtimeRoot, helper);
  const output = await (
    options.helper_process ?? SYSTEM_WINDOWS_PHYSICAL_ROOT_HELPER_PROCESS_V01
  ).run({
    helper_path: helper.physical_path,
    canonical_root: normalizedInput,
    runtime_root: runtimeRoot,
  });
  if (!Number.isSafeInteger(output.exit_code)) {
    throw new WindowsProjectRootIdentityErrorV01(
      "windows_physical_identity_helper_failed",
    );
  }
  if (
    Buffer.byteLength(output.stdout, "utf8") > MAX_HELPER_OUTPUT_BYTES ||
    Buffer.byteLength(output.stderr, "utf8") > MAX_HELPER_ERROR_BYTES
  ) {
    throw new WindowsProjectRootIdentityErrorV01(
      "windows_physical_identity_helper_output_oversized",
    );
  }
  if (output.exit_code !== 0) {
    throw new WindowsProjectRootIdentityErrorV01(
      parseWindowsPhysicalRootHelperErrorV01(output.stdout) ??
        "windows_physical_identity_helper_failed",
    );
  }
  return parseWindowsPhysicalRootHelperResponseV01(output.stdout);
}

export function parseWindowsPhysicalRootHelperResponseV01(
  raw: string,
): NativeHostWindowsPhysicalRootIdentityV01 {
  if (
    typeof raw !== "string" ||
    raw.length === 0 ||
    Buffer.byteLength(raw, "utf8") > MAX_HELPER_OUTPUT_BYTES
  ) {
    throw new WindowsProjectRootIdentityErrorV01(
      "windows_physical_identity_helper_output_invalid",
    );
  }
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new WindowsProjectRootIdentityErrorV01(
      "windows_physical_identity_helper_output_invalid",
    );
  }
  if (!isPlainRecord(value)) {
    throw new WindowsProjectRootIdentityErrorV01(
      "windows_physical_identity_helper_output_invalid",
    );
  }
  const keys = Object.keys(value).sort();
  if (
    JSON.stringify(keys) !==
      JSON.stringify([
        "architecture",
        "contract",
        "drive_type",
        "file_id",
        "filesystem_family",
        "final_target_path",
        "identity_version",
        "platform",
        "status",
        "volume_serial_identity",
      ]) ||
    value.contract !== WINDOWS_PHYSICAL_ROOT_HELPER_CONTRACT_V01 ||
    value.identity_version !== WINDOWS_PHYSICAL_ROOT_IDENTITY_VERSION_V01 ||
    value.status !== "exact" ||
    value.platform !== "win32" ||
    value.architecture !== "x64"
  ) {
    throw new WindowsProjectRootIdentityErrorV01(
      "windows_physical_identity_helper_contract_mismatch",
    );
  }
  if (value.filesystem_family !== "NTFS") {
    throw new WindowsProjectRootIdentityErrorV01(
      "windows_physical_identity_filesystem_unsupported",
    );
  }
  if (value.drive_type !== "fixed") {
    throw new WindowsProjectRootIdentityErrorV01(
      "windows_physical_identity_drive_unsupported",
    );
  }
  const finalTarget = normalizeWindowsFinalTargetPathV01(
    requiredString(value.final_target_path),
  );
  const volumeSerial = requiredPattern(
    value.volume_serial_identity,
    /^[0-9a-f]{16}$/iu,
  ).toLowerCase();
  const fileId = requiredPattern(value.file_id, /^[0-9a-f]{32}$/iu).toLowerCase();
  return {
    identity_version: WINDOWS_PHYSICAL_ROOT_IDENTITY_VERSION_V01,
    canonical_final_path_fingerprint: createProtocolSha256V01(finalTarget),
    volume_serial_identity: volumeSerial,
    file_id: fileId,
    filesystem_family: "NTFS",
    drive_type: "fixed",
  };
}

function parseWindowsPhysicalRootHelperErrorV01(raw: string): string | null {
  if (
    typeof raw !== "string" ||
    raw.length === 0 ||
    Buffer.byteLength(raw, "utf8") > MAX_HELPER_OUTPUT_BYTES
  ) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (
    !isPlainRecord(value) ||
    JSON.stringify(Object.keys(value).sort()) !==
      JSON.stringify(["code", "contract", "status"]) ||
    value.contract !== WINDOWS_PHYSICAL_ROOT_HELPER_CONTRACT_V01 ||
    value.status !== "error" ||
    typeof value.code !== "string"
  ) return null;
  const mapped = Object.freeze<Record<string, string>>({
    request_invalid: "windows_physical_identity_helper_contract_mismatch",
    path_invalid: "windows_physical_identity_input_invalid",
    network_path_unsupported: "windows_physical_identity_network_unsupported",
    network_target_unsupported: "windows_physical_identity_network_unsupported",
    directory_open_failed: "windows_physical_identity_directory_unavailable",
    not_directory: "windows_physical_identity_directory_unsupported",
    reparse_target_unsupported:
      "windows_physical_identity_reparse_target_unsupported",
    reparse_target_ambiguous:
      "windows_physical_identity_reparse_target_ambiguous",
    final_target_unavailable:
      "windows_physical_identity_final_path_unavailable",
    final_target_ambiguous: "windows_physical_identity_final_path_ambiguous",
    file_identity_unavailable:
      "windows_physical_identity_file_identity_unavailable",
    reparse_classification_unavailable:
      "windows_physical_identity_reparse_classification_unavailable",
    reparse_ancestor_unavailable:
      "windows_physical_identity_reparse_classification_unavailable",
    reparse_ancestor_unsupported:
      "windows_physical_identity_reparse_target_unsupported",
    reparse_ancestor_ambiguous:
      "windows_physical_identity_reparse_target_ambiguous",
    filesystem_classification_unavailable:
      "windows_physical_identity_filesystem_classification_unavailable",
    filesystem_unsupported:
      "windows_physical_identity_filesystem_unsupported",
    drive_type_unsupported: "windows_physical_identity_drive_unsupported",
    final_target_encoding_invalid:
      "windows_physical_identity_final_path_encoding_invalid",
  });
  return mapped[value.code] ?? null;
}

function assertSupportedWindowsVersionV01(value: string): void {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:\D.*)?$/u.exec(value);
  const build = match ? Number(match[3]) : Number.NaN;
  if (
    !match ||
    match[1] !== "10" ||
    match[2] !== "0" ||
    !Number.isSafeInteger(build) ||
    build < WINDOWS_PHYSICAL_ROOT_MINIMUM_BUILD_V01
  ) {
    throw new WindowsProjectRootIdentityErrorV01(
      "windows_physical_identity_windows_version_unsupported",
    );
  }
}

export function normalizeWindowsFinalTargetPathV01(value: string): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.includes("\0") ||
    Buffer.byteLength(value, "utf8") > MAX_INPUT_PATH_BYTES
  ) {
    throw new WindowsProjectRootIdentityErrorV01(
      "windows_physical_identity_final_path_invalid",
    );
  }
  if (/^\\\\\?\\UNC\\/iu.test(value) || /^\\\\(?:wsl\$|wsl\.localhost)\\/iu.test(value)) {
    throw new WindowsProjectRootIdentityErrorV01(
      /^\\\\(?:wsl\$|wsl\.localhost)\\/iu.test(value.replace(/^\\\\\?\\UNC\\/iu, "\\\\"))
        ? "windows_physical_identity_wsl_unsupported"
        : "windows_physical_identity_network_unsupported",
    );
  }
  if (/^\\\\\.\\/u.test(value) || /^\\\\\?\\Volume\{/iu.test(value)) {
    throw new WindowsProjectRootIdentityErrorV01(
      "windows_physical_identity_final_path_ambiguous",
    );
  }
  const withoutExtendedPrefix = value.replace(/^\\\\\?\\(?=[a-z]:\\)/iu, "");
  const normalized = path.win32.normalize(withoutExtendedPrefix);
  if (!/^[a-z]:\\/iu.test(normalized) || !path.win32.isAbsolute(normalized)) {
    throw new WindowsProjectRootIdentityErrorV01(
      "windows_physical_identity_final_path_invalid",
    );
  }
  return `${normalized[0].toUpperCase()}${normalized.slice(1)}`;
}

function validateWindowsRootInputV01(value: string): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.includes("\0") ||
    Buffer.byteLength(value, "utf8") > MAX_INPUT_PATH_BYTES ||
    !path.win32.isAbsolute(value)
  ) {
    throw new WindowsProjectRootIdentityErrorV01(
      "windows_physical_identity_input_invalid",
    );
  }
  if (/^\\\\(?:\?\\UNC\\|wsl\$\\|wsl\.localhost\\)/iu.test(value)) {
    throw new WindowsProjectRootIdentityErrorV01(
      /wsl/iu.test(value)
        ? "windows_physical_identity_wsl_unsupported"
        : "windows_physical_identity_network_unsupported",
    );
  }
  if (/^\\\\/u.test(value) && !/^\\\\\?\\[a-z]:\\/iu.test(value)) {
    throw new WindowsProjectRootIdentityErrorV01(
      "windows_physical_identity_network_unsupported",
    );
  }
  return value;
}

function resolveRuntimeRootV01(candidate: string): string {
  try {
    if (!path.isAbsolute(candidate)) throw new Error("runtime root is relative");
    const stats = lstatSync(candidate);
    if (!stats.isDirectory() || stats.isSymbolicLink()) {
      throw new Error("runtime root is not a regular directory");
    }
    return realpathSync.native(candidate);
  } catch {
    throw new WindowsProjectRootIdentityErrorV01(
      "windows_physical_identity_runtime_root_invalid",
    );
  }
}

function readWindowsHelperManifestV01(
  runtimeRoot: string,
): WindowsPhysicalRootManifestReadV01 {
  const component = resolvePhysicallyContainedComponentV01(
    runtimeRoot,
    WINDOWS_PHYSICAL_ROOT_HELPER_MANIFEST_RELATIVE_PATH_V01,
    { maximum_size: BigInt(MAX_HELPER_MANIFEST_BYTES) },
  );
  let value: unknown;
  try {
    value = JSON.parse(readFileSync(component.physical_path, "utf8"));
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code === "ENOENT"
      ? "windows_physical_identity_component_missing"
      : "windows_physical_identity_manifest_invalid";
    throw new WindowsProjectRootIdentityErrorV01(code);
  }
  if (!isPlainRecord(value)) {
    throw new WindowsProjectRootIdentityErrorV01(
      "windows_physical_identity_manifest_invalid",
    );
  }
  const keys = Object.keys(value).sort();
  if (
    JSON.stringify(keys) !==
      JSON.stringify([
        "architecture",
        "contract",
        "helper_contract",
        "helper_file",
        "helper_sha256",
        "identity_version",
        "minimum_windows_build",
        "platform",
      ]) ||
    value.contract !== WINDOWS_PHYSICAL_ROOT_HELPER_MANIFEST_V01 ||
    value.helper_contract !== WINDOWS_PHYSICAL_ROOT_HELPER_CONTRACT_V01 ||
    value.identity_version !== WINDOWS_PHYSICAL_ROOT_IDENTITY_VERSION_V01 ||
    value.minimum_windows_build !== WINDOWS_PHYSICAL_ROOT_MINIMUM_BUILD_V01 ||
    value.platform !== "win32" ||
    value.architecture !== "x64" ||
    value.helper_file !== WINDOWS_PHYSICAL_ROOT_HELPER_RELATIVE_PATH_V01 ||
    !/^[0-9a-f]{64}$/u.test(String(value.helper_sha256 ?? ""))
  ) {
    throw new WindowsProjectRootIdentityErrorV01(
      "windows_physical_identity_manifest_invalid",
    );
  }
  return {
    manifest: value as unknown as WindowsPhysicalRootHelperManifestV01,
    component,
  };
}

function resolveVerifiedHelperPathV01(
  runtimeRoot: string,
  manifest: WindowsPhysicalRootHelperManifestV01,
): WindowsPhysicalRootComponentSnapshotV01 {
  try {
    const component = resolvePhysicallyContainedComponentV01(
      runtimeRoot,
      manifest.helper_file,
    );
    if (component.sha256 !== manifest.helper_sha256) {
      throw new WindowsProjectRootIdentityErrorV01(
        "windows_physical_identity_component_integrity_invalid",
      );
    }
    return component;
  } catch (error) {
    if (error instanceof WindowsProjectRootIdentityErrorV01) throw error;
    const code = (error as NodeJS.ErrnoException)?.code === "ENOENT"
      ? "windows_physical_identity_component_missing"
      : "windows_physical_identity_component_invalid";
    throw new WindowsProjectRootIdentityErrorV01(code);
  }
}

function resolvePhysicallyContainedComponentV01(
  runtimeRoot: string,
  relativePath: string,
  { maximum_size = null }: { maximum_size?: bigint | null } = {},
): WindowsPhysicalRootComponentSnapshotV01 {
  const logicalPath = resolveInsideRuntimeRootV01(runtimeRoot, relativePath);
  try {
    const logicalStats = lstatSync(logicalPath, { bigint: true });
    if (
      !logicalStats.isFile() ||
      logicalStats.isSymbolicLink() ||
      logicalStats.size < BigInt(1) ||
      (maximum_size !== null && logicalStats.size > maximum_size)
    ) {
      throw new Error("component is not a bounded regular file");
    }
    const physicalPath = realpathSync.native(logicalPath);
    assertPhysicalPathInsideRuntimeRootV01(runtimeRoot, physicalPath);
    const physicalStats = lstatSync(physicalPath, { bigint: true });
    if (
      !physicalStats.isFile() ||
      physicalStats.isSymbolicLink() ||
      physicalStats.size < BigInt(1) ||
      (maximum_size !== null && physicalStats.size > maximum_size)
    ) {
      throw new Error("physical component is not a bounded regular file");
    }
    const bytes = readFileSync(physicalPath);
    return {
      logical_path: logicalPath,
      physical_path: physicalPath,
      device: physicalStats.dev,
      inode: physicalStats.ino,
      size: physicalStats.size,
      modified_ns: physicalStats.mtimeNs,
      changed_ns: physicalStats.ctimeNs,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    };
  } catch (error) {
    if (error instanceof WindowsProjectRootIdentityErrorV01) throw error;
    const code = (error as NodeJS.ErrnoException)?.code === "ENOENT"
      ? "windows_physical_identity_component_missing"
      : "windows_physical_identity_component_invalid";
    throw new WindowsProjectRootIdentityErrorV01(code);
  }
}

function assertPhysicalPathInsideRuntimeRootV01(
  runtimeRoot: string,
  physicalPath: string,
): void {
  const relative = path.relative(runtimeRoot, physicalPath);
  if (
    relative === "" ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new WindowsProjectRootIdentityErrorV01(
      "windows_physical_identity_component_physical_escape",
    );
  }
}

function captureRuntimeRootSnapshotV01(runtimeRoot: string): {
  device: bigint;
  inode: bigint;
  modified_ns: bigint;
  changed_ns: bigint;
} {
  const stats = lstatSync(runtimeRoot, { bigint: true });
  if (!stats.isDirectory() || stats.isSymbolicLink()) {
    throw new WindowsProjectRootIdentityErrorV01(
      "windows_physical_identity_runtime_root_invalid",
    );
  }
  return {
    device: stats.dev,
    inode: stats.ino,
    modified_ns: stats.mtimeNs,
    changed_ns: stats.ctimeNs,
  };
}

function assertRuntimeRootSnapshotUnchangedV01(
  runtimeRoot: string,
  expected: ReturnType<typeof captureRuntimeRootSnapshotV01>,
): void {
  const current = captureRuntimeRootSnapshotV01(runtimeRoot);
  if (
    current.device !== expected.device ||
    current.inode !== expected.inode ||
    current.modified_ns !== expected.modified_ns ||
    current.changed_ns !== expected.changed_ns
  ) {
    throw new WindowsProjectRootIdentityErrorV01(
      "windows_physical_identity_runtime_root_changed",
    );
  }
}

function assertComponentSnapshotUnchangedV01(
  runtimeRoot: string,
  expected: WindowsPhysicalRootComponentSnapshotV01,
): void {
  try {
    const physicalPath = realpathSync.native(expected.logical_path);
    assertPhysicalPathInsideRuntimeRootV01(runtimeRoot, physicalPath);
    const stats = lstatSync(physicalPath, { bigint: true });
    const digest = createHash("sha256")
      .update(readFileSync(physicalPath))
      .digest("hex");
    if (
      physicalPath !== expected.physical_path ||
      !stats.isFile() ||
      stats.isSymbolicLink() ||
      stats.dev !== expected.device ||
      stats.ino !== expected.inode ||
      stats.size !== expected.size ||
      stats.mtimeNs !== expected.modified_ns ||
      stats.ctimeNs !== expected.changed_ns ||
      digest !== expected.sha256
    ) {
      throw new WindowsProjectRootIdentityErrorV01(
        "windows_physical_identity_component_changed",
      );
    }
  } catch (error) {
    if (error instanceof WindowsProjectRootIdentityErrorV01) throw error;
    throw new WindowsProjectRootIdentityErrorV01(
      "windows_physical_identity_component_changed",
    );
  }
}

function resolveInsideRuntimeRootV01(runtimeRoot: string, relativePath: string): string {
  const candidate = path.resolve(runtimeRoot, ...relativePath.split("/"));
  const relative = path.relative(runtimeRoot, candidate);
  if (
    relative === "" ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new WindowsProjectRootIdentityErrorV01(
      "windows_physical_identity_component_path_invalid",
    );
  }
  return candidate;
}

function requiredString(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new WindowsProjectRootIdentityErrorV01(
      "windows_physical_identity_helper_output_invalid",
    );
  }
  return value;
}

function requiredPattern(value: unknown, pattern: RegExp): string {
  const text = requiredString(value);
  if (!pattern.test(text)) {
    throw new WindowsProjectRootIdentityErrorV01(
      "windows_physical_identity_helper_output_invalid",
    );
  }
  return text;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype,
  );
}
