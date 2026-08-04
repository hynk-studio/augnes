import { execFile } from "node:child_process";
import { realpath } from "node:fs/promises";
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
const MAX_GIT_OUTPUT_BYTES = 4 * 1024 * 1024;
const MAX_STATUS_PATHS = 4_096;

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

    const [commonDirRaw, gitDirRaw, headRaw, branchRaw, indexRaw, statusRaw] =
      await Promise.all([
        git.run(root, ["rev-parse", "--git-common-dir"]),
        git.run(root, ["rev-parse", "--git-dir"]),
        git.run(root, ["rev-parse", "--verify", "HEAD"]).catch(() => ""),
        git.run(root, ["symbolic-ref", "--quiet", "--short", "HEAD"]).catch(() => ""),
        git.run(root, ["ls-files", "--stage", "-z"]),
        git.run(root, ["status", "--porcelain=v1", "-z", "--untracked-files=all"]),
      ]);

    const entries = statusRaw.split("\0").filter(Boolean);
    if (entries.length > MAX_STATUS_PATHS) return ambiguous(observedAt, "worktree_path_bound_exceeded");
    const tracked: string[] = [];
    const untracked: string[] = [];
    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index];
      if (entry.length < 4) return ambiguous(observedAt, "worktree_status_invalid");
      const status = entry.slice(0, 2);
      const pathname = entry.slice(3);
      if (status === "??") untracked.push(pathname);
      else {
        tracked.push(`${status}:${pathname}`);
        if ((status.includes("R") || status.includes("C")) && index + 1 < entries.length) {
          tracked.push(`source:${entries[index + 1]}`);
          index += 1;
        }
      }
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
      tracked_dirty_paths_fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(tracked.sort()),
      ),
      relevant_untracked_paths_fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(untracked.sort()),
      ),
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
    return unavailable(observedAt, "bounded_git_inspection_failed");
  }
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
