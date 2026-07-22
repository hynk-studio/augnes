#!/usr/bin/env node

import { appendFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const SHA_PATTERN = /^[0-9a-f]{40}$/u;
const MAX_DIFF_BYTES = 8 * 1024 * 1024;
const MAX_CHANGED_PATHS = 5_000;
const MAX_PATH_BYTES = 4_096;
const MAX_SUMMARY_PATHS = 200;
const MAX_SUMMARY_BYTES = 64 * 1024;

const FULL_PATH_PREFIXES = [
  ".github/workflows/",
  ".github/actions/",
  "scripts/",
  "lib/",
  "apps/",
  "app/",
  "components/",
  "data/",
  "test/",
  "tests/",
  "fixtures/",
];

const DOCUMENTATION_ASSET_EXTENSIONS = new Set([
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".svg",
  ".webp",
]);

export function planCanonicalChange({
  eventName,
  baseSha,
  headSha,
  cwd = repositoryRoot,
}) {
  if (eventName === "push") {
    return boundedSummary({
      schema_version: 1,
      event: "push",
      plan: "full-canonical",
      reason: "main_push_always_full",
      base_sha: normalizeOptionalSha(baseSha),
      head_sha: normalizeOptionalSha(headSha),
      change_count: null,
      changed_paths: [],
      full_reasons: ["main_push_always_full"],
      changes: [],
    });
  }
  if (eventName !== "pull_request") {
    throw new Error(`unsupported canonical planner event: ${eventName || "<missing>"}`);
  }

  assertExactCommit(cwd, "base", baseSha);
  assertExactCommit(cwd, "head", headSha);
  if (baseSha === headSha) {
    throw new Error("canonical planner base and head must differ");
  }

  const changes = readGitChanges({ cwd, baseSha, headSha });
  if (changes.length === 0) {
    throw new Error("canonical planner found no pull-request changes");
  }
  if (changes.length > MAX_CHANGED_PATHS) {
    return boundedSummary({
      schema_version: 1,
      event: "pull_request",
      plan: "full-canonical",
      reason: "change_count_exceeds_documentation_bound",
      base_sha: baseSha,
      head_sha: headSha,
      change_count: changes.length,
      changed_paths: [],
      full_reasons: ["change_count_exceeds_documentation_bound"],
      changes,
    });
  }

  const fullReasons = [];
  for (const change of changes) {
    const reason = classifyFullReason(change);
    if (reason) fullReasons.push(reason);
  }
  const uniqueReasons = [...new Set(fullReasons)].sort();
  const documentationOnly = uniqueReasons.length === 0;

  return boundedSummary({
    schema_version: 1,
    event: "pull_request",
    plan: documentationOnly ? "documentation-only" : "full-canonical",
    reason: documentationOnly
      ? "all_changes_match_documentation_allowlist"
      : "one_or_more_changes_require_full_canonical",
    base_sha: baseSha,
    head_sha: headSha,
    change_count: changes.length,
    changed_paths: changes
      .map((change) => change.newPath ?? change.oldPath)
      .filter(Boolean)
      .slice(0, MAX_SUMMARY_PATHS),
    full_reasons: uniqueReasons,
    changes,
  });
}

export function parseNameStatus(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error("canonical planner diff must be a Buffer");
  }
  if (buffer.length > MAX_DIFF_BYTES) {
    throw new Error("canonical planner diff exceeds the bounded input size");
  }
  const tokens = buffer.toString("utf8").split("\0");
  if (tokens.at(-1) !== "") {
    throw new Error("canonical planner diff is not NUL terminated");
  }
  tokens.pop();

  const records = [];
  for (let index = 0; index < tokens.length; ) {
    const statusToken = tokens[index++];
    if (!/^(?:[AMDTU]|[RC][0-9]{1,3})$/u.test(statusToken)) {
      throw new Error(`unsupported canonical diff status: ${statusToken || "<missing>"}`);
    }
    const status = statusToken[0];
    const pathCount = status === "R" || status === "C" ? 2 : 1;
    if (index + pathCount > tokens.length) {
      throw new Error(`malformed canonical diff record: ${statusToken}`);
    }
    const paths = tokens.slice(index, index + pathCount);
    index += pathCount;
    for (const changedPath of paths) validateChangedPath(changedPath);
    records.push({
      status,
      statusToken,
      oldPath: status === "A" ? null : paths[0],
      newPath:
        status === "D"
          ? null
          : status === "R" || status === "C"
            ? paths[1]
            : paths[0],
    });
  }
  return records;
}

export function isDocumentationPath(relativePath) {
  const normalized = normalizeRepositoryPath(relativePath);
  if (requiresFullByPath(normalized)) return false;

  if (normalized.endsWith(".md")) {
    return (
      !normalized.includes("/") ||
      normalized.startsWith("docs/") ||
      normalized.startsWith("research/") ||
      /^\.github\/[^/]+\.md$/u.test(normalized)
    );
  }
  const extension = path.posix.extname(normalized).toLowerCase();
  return (
    (normalized.startsWith("docs/") || normalized.startsWith("research/")) &&
    DOCUMENTATION_ASSET_EXTENSIONS.has(extension)
  );
}

function readGitChanges({ cwd, baseSha, headSha }) {
  const result = runGit(
    cwd,
    [
      "diff",
      "--name-status",
      "-z",
      "--find-renames=50%",
      baseSha,
      headSha,
    ],
    { encoding: "buffer", maxBuffer: MAX_DIFF_BYTES },
  );
  const records = parseNameStatus(result.stdout);
  return records.map((record) => ({
    ...record,
    oldMode: record.oldPath ? readGitMode(cwd, baseSha, record.oldPath) : null,
    newMode: record.newPath ? readGitMode(cwd, headSha, record.newPath) : null,
  }));
}

function classifyFullReason(change) {
  if (change.status === "D") return `deletion:${change.oldPath}`;
  if (change.status === "T" || change.status === "U") {
    return `unsafe_status_${change.status}:${change.newPath ?? change.oldPath}`;
  }
  if (change.status === "C") {
    return `copy_requires_full:${change.newPath}`;
  }
  if (!isSafeRegularMode(change.newMode)) {
    return `unsafe_new_mode_${change.newMode ?? "missing"}:${change.newPath}`;
  }
  if (
    change.oldMode !== null &&
    (change.oldMode !== change.newMode || !isSafeRegularMode(change.oldMode))
  ) {
    return `mode_change:${change.newPath ?? change.oldPath}`;
  }
  if (change.status === "R") {
    if (
      !isDocumentationPath(change.oldPath) ||
      !isDocumentationPath(change.newPath)
    ) {
      return `rename_crosses_documentation_boundary:${change.oldPath}->${change.newPath}`;
    }
    return null;
  }
  if (!isDocumentationPath(change.newPath)) {
    return `path_requires_full:${change.newPath}`;
  }
  return null;
}

function requiresFullByPath(relativePath) {
  const lower = relativePath.toLowerCase();
  const basename = path.posix.basename(relativePath);
  if (/(^|\/)AGENTS\.md$/u.test(relativePath)) return true;
  if (FULL_PATH_PREFIXES.some((prefix) => relativePath.startsWith(prefix))) {
    return true;
  }
  if (basename === "package.json" || basename === "package-lock.json") {
    return true;
  }
  if (
    /(^|\/)(?:schema|schemas|migration|migrations)(?:\/|$)/u.test(lower) ||
    /(?:^|[._-])(?:schema|migration)(?:[._-]|$)/u.test(lower)
  ) {
    return true;
  }
  return false;
}

function readGitMode(cwd, revision, relativePath) {
  const result = runGit(cwd, ["ls-tree", "-z", revision, "--", relativePath], {
    encoding: "buffer",
    maxBuffer: 64 * 1024,
  });
  if (result.stdout.length === 0) return null;
  const entry = result.stdout.toString("utf8");
  const match = entry.match(/^(\d{6})\s+(?:blob|tree)\s+[0-9a-f]+\t/u);
  if (!match) {
    throw new Error(`malformed git tree entry for ${relativePath}`);
  }
  return match[1];
}

function assertExactCommit(cwd, label, sha) {
  if (!SHA_PATTERN.test(sha ?? "")) {
    throw new Error(`canonical planner ${label} SHA must be exactly 40 lowercase hex characters`);
  }
  runGit(cwd, ["cat-file", "-e", `${sha}^{commit}`], {
    encoding: "buffer",
    maxBuffer: 64 * 1024,
  });
}

function runGit(cwd, args, options) {
  const result = spawnSync("git", args, {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const stderr = Buffer.isBuffer(result.stderr)
      ? result.stderr.toString("utf8")
      : String(result.stderr ?? "");
    throw new Error(`git ${args[0]} failed: ${stderr.trim() || `exit ${result.status}`}`);
  }
  return result;
}

function validateChangedPath(relativePath) {
  if (
    typeof relativePath !== "string" ||
    relativePath.length === 0 ||
    Buffer.byteLength(relativePath, "utf8") > MAX_PATH_BYTES ||
    relativePath.includes("\0")
  ) {
    throw new Error("canonical planner encountered a malformed or oversized path");
  }
  normalizeRepositoryPath(relativePath);
}

function normalizeRepositoryPath(relativePath) {
  const normalized = path.posix.normalize(relativePath.replaceAll("\\", "/"));
  if (
    path.posix.isAbsolute(normalized) ||
    normalized === ".." ||
    normalized.startsWith("../") ||
    normalized === "."
  ) {
    throw new Error(`canonical planner path escapes the repository: ${relativePath}`);
  }
  return normalized;
}

function isSafeRegularMode(mode) {
  return mode === "100644";
}

function normalizeOptionalSha(sha) {
  return SHA_PATTERN.test(sha ?? "") ? sha : null;
}

function boundedSummary(summary) {
  const publicSummary = { ...summary };
  delete publicSummary.changes;
  const serialized = JSON.stringify(publicSummary);
  if (Buffer.byteLength(serialized, "utf8") > MAX_SUMMARY_BYTES) {
    throw new Error("canonical planner summary exceeds the bounded output size");
  }
  return summary;
}

function parseCliArguments(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith("--") || value === undefined) {
      throw new Error("canonical planner arguments must be --key value pairs");
    }
    values.set(key.slice(2), value);
  }
  return values;
}

function cliSummary(plan) {
  const summary = { ...plan };
  delete summary.changes;
  return summary;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = parseCliArguments(process.argv.slice(2));
    const plan = planCanonicalChange({
      eventName: args.get("event"),
      baseSha: args.get("base"),
      headSha: args.get("head"),
    });
    const summary = cliSummary(plan);
    console.log(JSON.stringify(summary));
    if (args.get("write-github-output") === "true") {
      const githubOutput = process.env.GITHUB_OUTPUT;
      if (!githubOutput) {
        throw new Error("GITHUB_OUTPUT is required when writing planner outputs");
      }
      appendFileSync(
        githubOutput,
        `plan=${summary.plan}\nchange_count=${summary.change_count ?? 0}\n`,
        "utf8",
      );
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
