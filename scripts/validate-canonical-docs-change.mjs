#!/usr/bin/env node

import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { planCanonicalChange } from "./canonical-change-planner.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const PRIVATE_PATH_PATTERNS = [
  /(?:^|[\s("'])\/Users\/[A-Za-z0-9._-]+\//gmu,
  /(?:^|[\s("'])\/home\/(?!user\/|username\/|example\/)[A-Za-z0-9._-]+\//gmu,
  /(?:^|[\s("'])[A-Za-z]:\\Users\\[A-Za-z0-9._-]+\\/gmu,
  /file:\/\/\/(?:Users|home)\//gmu,
];

export function validateCanonicalDocumentationChange({
  baseSha,
  headSha,
  cwd = repositoryRoot,
}) {
  const plan = planCanonicalChange({
    eventName: "pull_request",
    baseSha,
    headSha,
    cwd,
  });
  if (plan.plan !== "documentation-only") {
    throw new Error(`documentation validator requires documentation-only plan, received ${plan.plan}`);
  }

  runGit(cwd, ["diff", "--check", baseSha, headSha]);
  const markdownPaths = plan.changes
    .map((change) => change.newPath)
    .filter((changedPath) => changedPath?.endsWith(".md"));
  let relativeLinksChecked = 0;
  let localAnchorsChecked = 0;

  for (const markdownPath of markdownPaths) {
    const markdown = readRevisionFile(cwd, headSha, markdownPath);
    assertNoPrivateAbsolutePath(markdown, markdownPath);
    for (const destination of extractMarkdownDestinations(markdown)) {
      const checked = validateDestination({
        cwd,
        headSha,
        markdownPath,
        destination,
      });
      relativeLinksChecked += checked.relativeLink ? 1 : 0;
      localAnchorsChecked += checked.localAnchor ? 1 : 0;
    }
  }

  return {
    schema_version: 1,
    test: "canonical-documentation-change",
    status: "pass",
    plan: plan.plan,
    base_sha: baseSha,
    head_sha: headSha,
    changed_paths: plan.change_count,
    markdown_files_checked: markdownPaths.length,
    relative_links_checked: relativeLinksChecked,
    local_anchors_checked: localAnchorsChecked,
    private_absolute_paths_found: 0,
    git_diff_check: "pass",
  };
}

export function extractMarkdownDestinations(markdown) {
  const destinations = [];
  for (const match of markdown.matchAll(/!?\[[^\]]*\]\(\s*(?:<([^>]+)>|([^\s)]+))(?:\s+[^)]*)?\)/gmu)) {
    destinations.push(match[1] ?? match[2]);
  }
  for (const match of markdown.matchAll(/^\s*\[[^\]]+\]:\s*(?:<([^>]+)>|(\S+))/gmu)) {
    destinations.push(match[1] ?? match[2]);
  }
  return destinations.filter(Boolean);
}

function validateDestination({ cwd, headSha, markdownPath, destination }) {
  const cleaned = destination.trim();
  if (/^(?:https?:|mailto:|tel:|data:|javascript:)/iu.test(cleaned)) {
    return { relativeLink: false, localAnchor: false };
  }
  if (cleaned.startsWith("/")) {
    return { relativeLink: false, localAnchor: false };
  }

  const hashIndex = cleaned.indexOf("#");
  const rawPath = hashIndex >= 0 ? cleaned.slice(0, hashIndex) : cleaned;
  const rawAnchor = hashIndex >= 0 ? cleaned.slice(hashIndex + 1) : "";
  let decodedPath;
  let decodedAnchor;
  try {
    decodedPath = decodeURIComponent(rawPath);
    decodedAnchor = decodeURIComponent(rawAnchor);
  } catch {
    throw new Error(`invalid percent encoding in ${markdownPath}: ${destination}`);
  }

  const targetPath = decodedPath
    ? normalizeTargetPath(markdownPath, decodedPath)
    : markdownPath;
  if (decodedPath) {
    assertRevisionPathExists(cwd, headSha, targetPath, markdownPath, destination);
  }
  if (decodedAnchor && targetPath.endsWith(".md")) {
    const targetMarkdown = readRevisionFile(cwd, headSha, targetPath);
    const anchors = collectMarkdownAnchors(targetMarkdown);
    if (!anchors.has(decodedAnchor.toLowerCase())) {
      throw new Error(
        `unresolved local Markdown anchor in ${markdownPath}: ${destination}`,
      );
    }
  }
  return {
    relativeLink: Boolean(decodedPath),
    localAnchor: Boolean(decodedAnchor && targetPath.endsWith(".md")),
  };
}

function collectMarkdownAnchors(markdown) {
  const anchors = new Set();
  const counts = new Map();
  for (const line of markdown.split(/\r?\n/u)) {
    const explicitMatches = line.matchAll(/\bid=["']([^"']+)["']/giu);
    for (const match of explicitMatches) anchors.add(match[1].toLowerCase());

    const heading = line.match(/^ {0,3}#{1,6}\s+(.+?)\s*#*\s*$/u);
    if (!heading) continue;
    const base = heading[1]
      .replace(/<[^>]*>/gu, "")
      .replace(/[`*_~]/gu, "")
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}\s_-]/gu, "")
      .replace(/\s/gu, "-");
    if (!base) continue;
    const duplicate = counts.get(base) ?? 0;
    counts.set(base, duplicate + 1);
    anchors.add(duplicate === 0 ? base : `${base}-${duplicate}`);
  }
  return anchors;
}

function assertNoPrivateAbsolutePath(markdown, markdownPath) {
  for (const pattern of PRIVATE_PATH_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(markdown)) {
      throw new Error(`private absolute filesystem path found in ${markdownPath}`);
    }
  }
}

function normalizeTargetPath(markdownPath, destinationPath) {
  const withoutQuery = destinationPath.split("?", 1)[0];
  const normalized = path.posix.normalize(
    path.posix.join(path.posix.dirname(markdownPath), withoutQuery),
  );
  if (
    path.posix.isAbsolute(normalized) ||
    normalized === ".." ||
    normalized.startsWith("../")
  ) {
    throw new Error(`relative Markdown link escapes the repository: ${destinationPath}`);
  }
  return normalized;
}

function assertRevisionPathExists(
  cwd,
  revision,
  targetPath,
  markdownPath,
  destination,
) {
  const result = spawnSync("git", ["cat-file", "-e", `${revision}:${targetPath}`], {
    cwd,
    stdio: "ignore",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`unresolved relative Markdown link in ${markdownPath}: ${destination}`);
  }
}

function readRevisionFile(cwd, revision, relativePath) {
  return runGit(cwd, ["show", `${revision}:${relativePath}`]).stdout;
}

function runGit(cwd, args) {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 8 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `git ${args[0]} failed: ${result.stderr.trim() || `exit ${result.status}`}`,
    );
  }
  return result;
}

function parseCliArguments(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith("--") || value === undefined) {
      throw new Error("documentation validator arguments must be --key value pairs");
    }
    values.set(key.slice(2), value);
  }
  return values;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = parseCliArguments(process.argv.slice(2));
    const result = validateCanonicalDocumentationChange({
      baseSha: args.get("base"),
      headSha: args.get("head"),
    });
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
