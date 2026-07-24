import { createHash, randomBytes } from "node:crypto";
import {
  chmodSync,
  closeSync,
  existsSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  statfsSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

export const AUTHORIZED_REPOSITORY_ROOT = "/Users/hynk/code/augnes-temp";
export const AUTHORIZED_REPOSITORY_ID =
  "hynk-studio/augnes-perspective-lab";
export const AUTHORIZED_ORIGIN_URL =
  "https://github.com/hynk-studio/augnes-perspective-lab.git";
export const CANONICAL_NODE_VERSION = "24.18.0";
export const CANONICAL_NODE_COMPATIBILITY = "^22.0.0 || ^24.0.0";
export const LOCAL_ARTIFACT_DIRECTORY = ".augnes-local-verification";
export const QUICK_MINIMUM_DISK_BYTES = 1024 ** 3;
export const FULL_MINIMUM_DISK_BYTES = 15 * 1024 ** 3;

const SHA_PATTERN = /^[0-9a-f]{40}$/u;
const BROWSER_CANDIDATES = Object.freeze([
  {
    path: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    name: "Google Chrome",
  },
  {
    path: "/Applications/Chromium.app/Contents/MacOS/Chromium",
    name: "Chromium",
  },
  {
    path: "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    name: "Microsoft Edge",
  },
  { path: "/usr/bin/google-chrome", name: "Google Chrome" },
  { path: "/usr/bin/google-chrome-stable", name: "Google Chrome" },
  { path: "/usr/bin/chromium", name: "Chromium" },
  { path: "/usr/bin/chromium-browser", name: "Chromium" },
]);

export function assertAuthorizedRepositoryIdentity({
  resolvedRoot,
  originUrl,
}) {
  if (resolvedRoot !== AUTHORIZED_REPOSITORY_ROOT) {
    const error = new Error("local canonical repository root is unauthorized");
    error.code = "unauthorized_repository_root";
    throw error;
  }
  if (originUrl !== AUTHORIZED_ORIGIN_URL) {
    const error = new Error("local canonical repository origin is unauthorized");
    error.code = "unauthorized_repository_origin";
    throw error;
  }
}

export function assertExactSha(value, label) {
  if (!SHA_PATTERN.test(value ?? "")) {
    const error = new Error(
      `${label} SHA must be exactly 40 lowercase hexadecimal characters`,
    );
    error.code = `invalid_${safeLabel(label)}_sha`;
    throw error;
  }
  return value;
}

export function collectRepositoryIdentity(repositoryRoot) {
  const resolvedRoot = realpathSync(repositoryRoot);
  const origin = runGit(resolvedRoot, ["remote", "get-url", "origin"]).trim();
  assertAuthorizedRepositoryIdentity({ resolvedRoot, originUrl: origin });

  const headSha = runGit(resolvedRoot, ["rev-parse", "HEAD"]).trim();
  assertExactSha(headSha, "head");
  const branchResult = runGitResult(
    resolvedRoot,
    ["symbolic-ref", "--quiet", "--short", "HEAD"],
    { acceptedStatuses: new Set([0, 1]) },
  );
  const branch = branchResult.status === 0 ? branchResult.stdout.trim() : null;
  const worktreeOutput = runGit(resolvedRoot, [
    "status",
    "--porcelain=v1",
    "--untracked-files=all",
  ]);

  return {
    repository_id: AUTHORIZED_REPOSITORY_ID,
    origin,
    head_sha: headSha,
    branch,
    detached: branch === null,
    worktree_dirty: worktreeOutput.length > 0,
  };
}

export function assertCommitExists(repositoryRoot, sha, label) {
  assertExactSha(sha, label);
  const result = runGitResult(
    repositoryRoot,
    ["cat-file", "-e", `${sha}^{commit}`],
    { acceptedStatuses: new Set([0, 1, 128]) },
  );
  if (result.status !== 0) {
    const error = new Error(`${label} commit is unavailable locally`);
    error.code = `missing_${safeLabel(label)}_commit`;
    throw error;
  }
}

export function collectHostEnvironment(repositoryRoot) {
  const disk = collectDiskObservation(repositoryRoot);
  const browser = selectBrowserExecutable();
  const nodeExecutableVersion = runVersionCommand("node", ["--version"]).replace(
    /^v/u,
    "",
  );
  const npmVersion = runVersionCommand("npm", ["--version"]);
  const productVersion =
    process.platform === "darwin"
      ? runVersionCommand("sw_vers", ["-productVersion"])
      : os.release();
  const productBuild =
    process.platform === "darwin"
      ? runVersionCommand("sw_vers", ["-buildVersion"])
      : null;

  return {
    public: {
      operating_system:
        process.platform === "darwin" ? "macOS" : process.platform,
      operating_system_version: productVersion,
      operating_system_build: productBuild,
      architecture: process.arch,
      logical_cpu_count: os.cpus().length,
      physical_memory_bytes: os.totalmem(),
      free_memory_bytes_at_start: os.freemem(),
      disk_free_bytes_at_start: disk.free_bytes,
      node_version: process.versions.node,
      path_node_version: nodeExecutableVersion,
      npm_version: npmVersion,
      browser: {
        available: browser !== null,
        name: browser?.name ?? null,
        source: browser?.source ?? null,
      },
      sleep_prevention: {
        available: existsSync("/usr/bin/caffeinate"),
        used: false,
      },
    },
    browserExecutablePath: browser?.path ?? null,
  };
}

export function collectDiskObservation(repositoryRoot) {
  const stats = statfsSync(repositoryRoot, { bigint: true });
  return {
    free_bytes: Number(stats.bavail * stats.bsize),
    total_bytes: Number(stats.blocks * stats.bsize),
  };
}

export function evaluateNodePolicy(version = process.versions.node) {
  const parsed = parseNodeVersion(version);
  const canonicalMatch = version === CANONICAL_NODE_VERSION;
  const compatibilityMatch =
    parsed !== null && (parsed.major === 22 || parsed.major === 24);
  return {
    canonical_version: CANONICAL_NODE_VERSION,
    compatibility_range: CANONICAL_NODE_COMPATIBILITY,
    actual_version: version,
    canonical_match: canonicalMatch,
    compatibility_match: compatibilityMatch,
  };
}

export function assertDecidingEnvironment({
  host,
  nodePolicy,
  diskMinimumBytes,
}) {
  if (
    host.operating_system !== "macOS" ||
    host.architecture !== "arm64"
  ) {
    const error = new Error(
      "deciding local canonical execution requires macOS arm64",
    );
    error.code = "unsupported_deciding_platform";
    throw error;
  }
  if (
    host.path_node_version !== host.node_version ||
    nodePolicy.canonical_match !== true
  ) {
    const error = new Error(
      `deciding local canonical execution requires Node ${CANONICAL_NODE_VERSION}`,
    );
    error.code = "canonical_node_mismatch";
    throw error;
  }
  if (host.logical_cpu_count < 2) {
    const error = new Error(
      "deciding local canonical execution requires at least two logical CPUs",
    );
    error.code = "insufficient_logical_cpus";
    throw error;
  }
  if (host.physical_memory_bytes < 8 * 1024 ** 3) {
    const error = new Error(
      "deciding local canonical execution requires at least 8 GiB of memory",
    );
    error.code = "insufficient_physical_memory";
    throw error;
  }
  if (host.disk_free_bytes_at_start < diskMinimumBytes) {
    const error = new Error(
      "local canonical execution has insufficient repository-volume disk space",
    );
    error.code = "insufficient_disk_space";
    throw error;
  }
}

export function hashFile(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

export function ensureBoundedLocalDirectory(repositoryRoot, candidate) {
  const resolvedRepositoryRoot = realpathSync(repositoryRoot);
  const absoluteCandidate = path.resolve(candidate);
  const relative = path.relative(resolvedRepositoryRoot, absoluteCandidate);
  if (
    relative === "" ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    const error = new Error("local artifact directory escapes the repository");
    error.code = "local_artifact_directory_escape";
    throw error;
  }
  let current = resolvedRepositoryRoot;
  for (const segment of relative.split(path.sep)) {
    current = path.join(current, segment);
    if (!existsSync(current)) {
      mkdirSync(current, { mode: 0o700 });
    }
    const stats = lstatSync(current);
    if (!stats.isDirectory() || stats.isSymbolicLink()) {
      const error = new Error(
        "local artifact path must contain only real directories",
      );
      error.code = "unsafe_local_artifact_directory";
      throw error;
    }
  }
  return realpathSync(absoluteCandidate);
}

export function ensureMachineFingerprint(artifactRoot) {
  chmodSync(artifactRoot, 0o700);
  const identityPath = path.join(artifactRoot, "machine-id");
  if (!existsSync(identityPath)) {
    try {
      const descriptor = openSync(identityPath, "wx", 0o600);
      writeFileSync(descriptor, randomBytes(32).toString("hex"), {
        encoding: "utf8",
      });
      closeSync(descriptor);
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
    }
  }
  const identityStats = lstatSync(identityPath);
  if (!identityStats.isFile() || identityStats.isSymbolicLink()) {
    const error = new Error("local canonical machine identity is unsafe");
    error.code = "unsafe_local_machine_identity";
    throw error;
  }
  chmodSync(identityPath, 0o600);
  const localMaterial = readFileSync(identityPath, "utf8").trim();
  if (!/^[0-9a-f]{64}$/u.test(localMaterial)) {
    const error = new Error("local canonical machine identity is malformed");
    error.code = "malformed_local_machine_identity";
    throw error;
  }
  return createHash("sha256")
    .update("augnes-local-canonical-machine-v1\0")
    .update(localMaterial)
    .digest("hex")
    .slice(0, 32);
}

export function runGit(repositoryRoot, args) {
  return runGitResult(repositoryRoot, args).stdout;
}

function runGitResult(
  repositoryRoot,
  args,
  { acceptedStatuses = new Set([0]) } = {},
) {
  const result = spawnSync("git", args, {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 8 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (!acceptedStatuses.has(result.status)) {
    const error = new Error(`git ${args[0]} failed`);
    error.code = "git_command_failed";
    throw error;
  }
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function selectBrowserExecutable() {
  const configured = process.env.AUGNES_BROWSER_EXECUTABLE_PATH?.trim();
  if (configured && path.isAbsolute(configured) && existsSync(configured)) {
    return {
      path: configured,
      name: path.basename(configured),
      source: "operator_selected",
    };
  }
  const selected = BROWSER_CANDIDATES.find((candidate) =>
    existsSync(candidate.path),
  );
  return selected ? { ...selected, source: "repository_candidate_order" } : null;
}

function runVersionCommand(command, args) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 10_000,
  });
  if (result.error || result.status !== 0) {
    const error = new Error(`${command} version inspection failed`);
    error.code = "environment_version_inspection_failed";
    throw error;
  }
  return result.stdout.trim();
}

function parseNodeVersion(version) {
  const match = String(version).match(/^(\d+)\.(\d+)\.(\d+)$/u);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function safeLabel(value) {
  return String(value ?? "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "_")
    .replace(/^_+|_+$/gu, "")
    .slice(0, 40);
}
