import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, readFile, readlink, realpath } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  REPOSITORY_WORKTREE_OBSERVATION_VERSION_V01,
  type RepositoryWorktreeObservationV01,
} from "@/types/vnext/repository-execution";

const execFileAsync = promisify(execFile);
const MAX_STATUS_PATHS = 4_096;
const MAX_INDIVIDUAL_FILE_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_INSPECTED_BYTES = 32 * 1024 * 1024;
const MAX_GIT_OUTPUT_BYTES = MAX_TOTAL_INSPECTED_BYTES + 1;

export interface WorktreeObservationProcessV01 {
  run(root: string, args: readonly string[]): Promise<string>;
}

const SYSTEM_GIT_PROCESS_V01: WorktreeObservationProcessV01 = {
  async run(root, args) {
    const result = await execFileAsync("git", ["--no-optional-locks", "-C", root, ...args], {
      encoding: "utf8",
      env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" },
      timeout: 5_000,
      maxBuffer: MAX_GIT_OUTPUT_BYTES,
      windowsHide: true,
    });
    return result.stdout;
  },
};

export async function inspectRepositoryWorktreeV01(
  root: string,
  options: {
    now?: () => string;
    process?: WorktreeObservationProcessV01;
    realpath?: (pathname: string) => Promise<string>;
  } = {},
): Promise<RepositoryWorktreeObservationV01> {
  const observedAt = (options.now ?? (() => new Date().toISOString()))();
  const git = options.process ?? SYSTEM_GIT_PROCESS_V01;
  const resolve = options.realpath ?? realpath;
  try {
    const inside = (await git.run(root, ["rev-parse", "--is-inside-work-tree"])).trim();
    if (inside !== "true") return nonGit(observedAt);

    const [commonDirRaw, gitDirRaw, headRaw, branchRaw, indexRaw, statusRaw, unstagedDiffRaw, submoduleStatusRaw] =
      await Promise.all([
        git.run(root, ["rev-parse", "--git-common-dir"]),
        git.run(root, ["rev-parse", "--git-dir"]),
        git.run(root, ["rev-parse", "--verify", "HEAD"]).catch(() => ""),
        git.run(root, ["symbolic-ref", "--quiet", "--short", "HEAD"]).catch(() => ""),
        git.run(root, ["ls-files", "--stage", "-z"]),
        git.run(root, ["status", "--porcelain=v1", "-z", "--untracked-files=all", "--ignore-submodules=none"]),
        git.run(root, ["diff", "--binary", "--no-ext-diff", "--no-textconv", "--submodule=short", "--"]),
        git.run(root, ["status", "--porcelain=v2", "-z", "--untracked-files=no", "--ignore-submodules=none"]),
      ]);

    const boundedGitBytes = [indexRaw, statusRaw, unstagedDiffRaw, submoduleStatusRaw]
      .reduce((total, value) => total + Buffer.byteLength(value, "utf8"), 0);
    if (boundedGitBytes > MAX_TOTAL_INSPECTED_BYTES) {
      return ambiguous(observedAt, "worktree_total_content_bound_exceeded");
    }
    if (dirtySubmoduleUnsupported(submoduleStatusRaw)) {
      return ambiguous(observedAt, "dirty_submodule_content_unsupported");
    }
    const submodulePaths = submodulePathsV01(submoduleStatusRaw);

    const entries = statusRaw.split("\0").filter(Boolean);
    if (entries.length > MAX_STATUS_PATHS) return ambiguous(observedAt, "worktree_path_bound_exceeded");
    const tracked: string[] = [];
    const untracked: string[] = [];
    const unstagedTrackedPaths: string[] = [];
    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index];
      if (entry.length < 4) return ambiguous(observedAt, "worktree_status_invalid");
      const status = entry.slice(0, 2);
      const pathname = normalizeRepositoryPath(entry.slice(3));
      if (!pathname) return ambiguous(observedAt, "worktree_path_invalid");
      if (status === "??") untracked.push(pathname);
      else {
        tracked.push(`${status}:${pathname}`);
        if (status[1] !== " " && status[1] !== "D") {
          unstagedTrackedPaths.push(pathname);
        }
        if ((status.includes("R") || status.includes("C")) && index + 1 < entries.length) {
          const sourcePath = normalizeRepositoryPath(entries[index + 1]);
          if (!sourcePath) return ambiguous(observedAt, "worktree_path_invalid");
          tracked.push(`source:${sourcePath}`);
          index += 1;
        }
      }
    }
    if (tracked.length + untracked.length > MAX_STATUS_PATHS) {
      return ambiguous(observedAt, "worktree_path_bound_exceeded");
    }
    for (const pathname of [...new Set(unstagedTrackedPaths)].sort()) {
      const absolute = path.resolve(root, pathname);
      let stats;
      try {
        stats = await lstat(absolute);
      } catch {
        return ambiguous(observedAt, "worktree_file_changed_during_observation");
      }
      const size = stats.isSymbolicLink()
        ? Buffer.byteLength(await readlink(absolute), "utf8")
        : stats.size;
      if (size > MAX_INDIVIDUAL_FILE_BYTES) {
        return ambiguous(observedAt, "worktree_individual_file_bound_exceeded");
      }
      if (
        !stats.isFile() &&
        !stats.isSymbolicLink() &&
        !(stats.isDirectory() && submodulePaths.has(pathname))
      ) {
        return ambiguous(observedAt, "worktree_tracked_entry_unsupported");
      }
    }

    const untrackedEntries: Array<{
      path: string;
      kind: "file" | "symlink";
      size: number;
      content_fingerprint: string;
    }> = [];
    let inspectedContentBytes = boundedGitBytes;
    for (const pathname of [...new Set(untracked)].sort()) {
      const absolute = path.resolve(root, pathname);
      const relative = path.relative(root, absolute);
      if (relative.startsWith("..") || path.isAbsolute(relative)) {
        return ambiguous(observedAt, "worktree_path_escape");
      }
      const stats = await lstat(absolute);
      if (stats.isSymbolicLink()) {
        const target = await readlink(absolute);
        const bytes = Buffer.byteLength(target, "utf8");
        if (bytes > MAX_INDIVIDUAL_FILE_BYTES) {
          return ambiguous(observedAt, "worktree_individual_file_bound_exceeded");
        }
        inspectedContentBytes += bytes;
        untrackedEntries.push({
          path: pathname,
          kind: "symlink",
          size: bytes,
          content_fingerprint: sha256Bytes(Buffer.from(target, "utf8")),
        });
      } else if (stats.isFile()) {
        if (stats.size > MAX_INDIVIDUAL_FILE_BYTES) {
          return ambiguous(observedAt, "worktree_individual_file_bound_exceeded");
        }
        inspectedContentBytes += stats.size;
        if (inspectedContentBytes > MAX_TOTAL_INSPECTED_BYTES) {
          return ambiguous(observedAt, "worktree_total_content_bound_exceeded");
        }
        const content = await readFile(absolute);
        if (content.byteLength !== stats.size) {
          return ambiguous(observedAt, "worktree_file_changed_during_observation");
        }
        untrackedEntries.push({
          path: pathname,
          kind: "file",
          size: content.byteLength,
          content_fingerprint: sha256Bytes(content),
        });
      } else {
        return ambiguous(observedAt, "worktree_untracked_entry_unsupported");
      }
    }
    if (inspectedContentBytes > MAX_TOTAL_INSPECTED_BYTES) {
      return ambiguous(observedAt, "worktree_total_content_bound_exceeded");
    }

    const commonDir = await resolve(path.resolve(root, commonDirRaw.trim()));
    const gitDir = await resolve(path.resolve(root, gitDirRaw.trim()));
    const headCommit = headRaw.trim() || null;
    const branchName = branchRaw.trim() || null;
    const material = {
      observation_version: REPOSITORY_WORKTREE_OBSERVATION_VERSION_V01,
      status: "exact" as const,
      repository_kind: commonDir === gitDir ? "git_repository" as const : "git_worktree" as const,
      git_common_dir_fingerprint: createProtocolSha256V01(commonDir),
      head_commit: headCommit,
      head_state: headCommit === null ? "unborn" as const : branchName ? "branch" as const : "detached" as const,
      branch_name: branchName,
      index_fingerprint: createProtocolSha256V01(indexRaw),
      staged_content_fingerprint: createProtocolSha256V01(indexRaw),
      tracked_dirty_paths_fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(tracked.sort()),
      ),
      unstaged_tracked_content_fingerprint: createProtocolSha256V01(unstagedDiffRaw),
      relevant_untracked_paths_fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(untracked.sort()),
      ),
      relevant_untracked_content_fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(untrackedEntries),
      ),
      submodule_state_fingerprint: createProtocolSha256V01(submoduleStatusRaw),
      inspected_path_count: tracked.length + untrackedEntries.length,
      inspected_content_bytes: inspectedContentBytes,
      limits: {
        maximum_path_count: MAX_STATUS_PATHS,
        maximum_individual_file_bytes: MAX_INDIVIDUAL_FILE_BYTES,
        maximum_total_inspected_bytes: MAX_TOTAL_INSPECTED_BYTES,
      },
      observed_at: observedAt,
    };
    return {
      ...material,
      observation_fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01({ ...material, observed_at: undefined }),
      ),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/not a git repository|fatal: not a git repository/u.test(message)) {
      return nonGit(observedAt);
    }
    if (/maxBuffer|stdout maxBuffer/u.test(message)) {
      return ambiguous(observedAt, "worktree_total_content_bound_exceeded");
    }
    return unavailable(observedAt, "bounded_git_inspection_failed");
  }
}

function normalizeRepositoryPath(value: string): string | null {
  const normalized = path.posix.normalize(value.replaceAll("\\", "/"));
  if (!normalized || normalized === "." || normalized.startsWith("../") || path.posix.isAbsolute(normalized)) {
    return null;
  }
  return normalized;
}

function sha256Bytes(value: Buffer): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function dirtySubmoduleUnsupported(status: string): boolean {
  return status.split("\0").some((entry) => {
    if (!entry.startsWith("1 ") && !entry.startsWith("2 ")) return false;
    const fields = entry.split(" ");
    const sub = fields[2] ?? "";
    return sub.startsWith("S") &&
      sub.length >= 4 &&
      (sub[2] !== "." || sub[3] !== ".");
  });
}

function submodulePathsV01(status: string): Set<string> {
  const paths = new Set<string>();
  for (const entry of status.split("\0")) {
    if (!entry.startsWith("1 ") && !entry.startsWith("2 ")) continue;
    const fields = entry.split(" ");
    if (!(fields[2] ?? "").startsWith("S")) continue;
    const pathname = normalizeRepositoryPath(
      entry.startsWith("1 ") ? fields.slice(8).join(" ") : fields.slice(9).join(" "),
    );
    if (pathname) paths.add(pathname);
  }
  return paths;
}

function nonGit(observedAt: string): RepositoryWorktreeObservationV01 {
  const material = {
    observation_version: REPOSITORY_WORKTREE_OBSERVATION_VERSION_V01,
    status: "non_git" as const,
    repository_kind: "plain_folder" as const,
    observed_at: observedAt,
  };
  return {
    ...material,
    observation_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01({ ...material, observed_at: undefined }),
    ),
  };
}

function ambiguous(observedAt: string, reason: string): RepositoryWorktreeObservationV01 {
  return boundedFailure("ambiguous", observedAt, reason);
}

function unavailable(observedAt: string, reason: string): RepositoryWorktreeObservationV01 {
  return boundedFailure("unavailable", observedAt, reason);
}

function boundedFailure(
  status: "ambiguous" | "unavailable",
  observedAt: string,
  reason: string,
): RepositoryWorktreeObservationV01 {
  const material = {
    observation_version: REPOSITORY_WORKTREE_OBSERVATION_VERSION_V01,
    status,
    repository_kind: "unknown" as const,
    reason,
    observed_at: observedAt,
  };
  return {
    ...material,
    observation_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01({ ...material, observed_at: undefined }),
    ),
  };
}
