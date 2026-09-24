#!/usr/bin/env node

import path from "node:path";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { collectMarkdownAnchors, extractMarkdownDestinations, planCanonicalChange } from "./canonical-change-planner.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

export { extractMarkdownDestinations } from "./canonical-change-planner.mjs";

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
  return validateCanonicalMarkdownChange({
    baseSha,
    headSha,
    cwd,
    expectedPlan: "documentation-only",
    test: "canonical-documentation-change",
  });
}

export function validateCanonicalOperatingPolicyChange({
  baseSha,
  headSha,
  cwd = repositoryRoot,
}) {
  return validateCanonicalMarkdownChange({
    baseSha,
    headSha,
    cwd,
    expectedPlan: "operating-policy-only",
    test: "canonical-operating-policy-change",
  });
}

export function validateCanonicalOwnerTargetedChange({
  baseSha,
  headSha,
  cwd = repositoryRoot,
}) {
  return validateCanonicalMarkdownChange({
    baseSha,
    headSha,
    cwd,
    expectedPlan: "owner-targeted",
    test: "canonical-owner-targeted-change",
  });
}

function validateCanonicalMarkdownChange({
  baseSha,
  headSha,
  cwd,
  expectedPlan,
  test,
}) {
  const plan = planCanonicalChange({
    eventName: "pull_request",
    baseSha,
    headSha,
    cwd,
  });
  if (plan.plan !== expectedPlan) {
    throw new Error(
      `Markdown validator requires ${expectedPlan} plan, received ${plan.plan}`,
    );
  }
  if (
    expectedPlan === "owner-targeted" &&
    (!Array.isArray(plan.owner_ids) ||
      plan.owner_ids.length === 0 ||
      !Array.isArray(plan.targeted_phase_ids) ||
      plan.targeted_phase_ids.length < 4 ||
      plan.targeted_phase_ids[0] !== "targeted-change-validator" ||
      plan.targeted_phase_ids[1] !== "dependencies-root" ||
      plan.targeted_phase_ids[2] !== "dependencies-nested")
  ) {
    throw new Error(
      "owner-targeted validator requires explicit owners and deciding phases",
    );
  }

  runGit(cwd, ["diff", "--check", baseSha, headSha]);
  const markdownPaths = plan.changes.map((change) => change.newPath).filter((p) => p?.endsWith(".md"));
  const affected = new Set(plan.changes.flatMap((change) => [change.oldPath, change.newPath]).filter(Boolean));
  for (const change of plan.changes.filter((item) => ["D", "R"].includes(item.status))) {
    for (let parent = path.posix.dirname(change.oldPath); parent !== "."; parent = path.posix.dirname(parent)) affected.add(parent);
  }
  const preexisting = [];
  const historical = [];
  let relativeLinksChecked = 0;
  let localAnchorsChecked = 0;
  let incomingReferencesChecked = 0;
  const files = listRevisionMarkdown(cwd, headSha);
  const cache = new Map();
  const read = (revision, file) => {
    const key = `${revision}:${file}`;
    if (!cache.has(key)) cache.set(key, readRevisionFile(cwd, revision, file));
    return cache.get(key);
  };
  for (const markdownPath of files) {
    const changed = markdownPaths.includes(markdownPath);
    const markdown = read(headSha, markdownPath);
    if (changed) {
      // Existing identity examples are not new private-path exposure.
      let previous = "";
      try { previous = read(baseSha, markdownPath); } catch { /* Added file. */ }
      assertNoPrivateAbsolutePath(markdown.split(/\r?\n/u)
        .filter((line) => !previous.split(/\r?\n/u).includes(line)).join("\n"), markdownPath);
      assertVerificationDocumentation({ [markdownPath]: markdown });
    }
    for (const destination of extractMarkdownDestinations(markdown)) {
      let reference;
      try { reference = resolveDestination(markdownPath, destination); }
      catch (error) {
        let existed = false;
        try { existed = extractMarkdownDestinations(read(baseSha, markdownPath)).includes(destination); } catch { /* New file. */ }
        if (!existed) throw error;
        preexisting.push({ source: markdownPath, destination, reason: error.message });
        continue;
      }
      if (!reference || (!changed && !affected.has(reference.targetPath))) continue;
      if (!changed) incomingReferencesChecked += 1;
      try {
        const checked = validateDestination({ cwd, headSha, markdownPath, destination, read });
        relativeLinksChecked += checked.relativeLink ? 1 : 0;
        localAnchorsChecked += checked.localAnchor ? 1 : 0;
        if (reference.revision) historical.push({ source: markdownPath, destination, status: "checked_at_pinned_commit" });
      } catch (error) {
        // A pinned historical commit is not retargeted to the proposed tree.
        if (reference.revision && !revisionAvailable(cwd, reference.revision)) {
          historical.push({ source: markdownPath, destination, status: "pinned_commit_unavailable_locally_not_checked" });
          continue;
        }
        if (error.code !== "broken_documentation_reference") throw error;
        let existingFailure = false;
        try {
          if (extractMarkdownDestinations(read(baseSha, markdownPath)).includes(destination)) {
            try { validateDestination({ cwd, headSha: baseSha, markdownPath, destination, read }); }
            catch (previousError) {
              if (previousError.code !== "broken_documentation_reference") throw previousError;
              existingFailure = true;
            }
          }
        } catch (previousError) {
          if (!String(previousError.message).startsWith("git show failed:")) throw previousError;
          // A newly added file cannot have a pre-existing reference.
        }
        if (!existingFailure) throw error;
        preexisting.push({ source: markdownPath, destination, reason: error.message });
      }
    }
  }

  return {
    schema_version: 1,
    test,
    status: "pass",
    plan: plan.plan,
    base_sha: baseSha,
    head_sha: headSha,
    changed_paths: plan.change_count,
    markdown_files_checked: markdownPaths.length,
    relative_links_checked: relativeLinksChecked,
    local_anchors_checked: localAnchorsChecked,
    incoming_references_checked: incomingReferencesChecked,
    preexisting_broken_references: preexisting,
    historical_references: historical,
    documentation_responsibilities: plan.documentation_responsibilities,
    required_contract_checks: plan.documentation_checks.filter((check) => check !== "references"),
    review_required: "meaning, dynamic/external consumers, retention and authority; link checks do not prove these",
    runtime_verified: false,
    new_private_absolute_paths_found: 0,
    git_diff_check: "pass",
    owner_ids: plan.owner_ids ?? [],
    targeted_phase_ids: plan.targeted_phase_ids ?? [],
  };
}

function resolveDestination(markdownPath, destination) {
  let cleaned = destination.trim();
  let revision = null;
  const repositoryLink = cleaned.match(/^https:\/\/github\.com\/hynk-studio\/augnes\/blob\/(main|[0-9a-f]{40})\/(.+)$/u);
  let repositoryRelative = false;
  if (repositoryLink) {
    revision = repositoryLink[1] === "main" ? null : repositoryLink[1];
    cleaned = repositoryLink[2];
    repositoryRelative = true;
  } else if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/iu.test(cleaned)) return null;
  const hashIndex = cleaned.indexOf("#");
  const rawPath = hashIndex >= 0 ? cleaned.slice(0, hashIndex) : cleaned;
  const rawAnchor = hashIndex >= 0 ? cleaned.slice(hashIndex + 1) : "";
  let decodedPath, decodedAnchor;
  try {
    decodedPath = decodeURIComponent(rawPath);
    decodedAnchor = decodeURIComponent(rawAnchor);
  } catch { throw new Error(`invalid percent encoding in ${markdownPath}: ${destination}`); }
  const targetPath = decodedPath
    ? normalizeTargetPath(repositoryRelative || decodedPath.startsWith("/") ? "ROOT.md" : markdownPath, decodedPath.replace(/^\//u, ""))
    : markdownPath;
  return { targetPath, decodedPath, decodedAnchor, revision };
}

function validateDestination({ cwd, headSha, markdownPath, destination, read = (revision, file) => readRevisionFile(cwd, revision, file) }) {
  const reference = resolveDestination(markdownPath, destination);
  if (!reference) return { relativeLink: false, localAnchor: false };
  const { targetPath, decodedPath, decodedAnchor } = reference;
  const revision = reference.revision ?? headSha;
  if (decodedPath) assertRevisionPathExists(cwd, revision, targetPath, markdownPath, destination);
  if (decodedAnchor && targetPath.endsWith(".md")) {
    if (!collectMarkdownAnchors(read(revision, targetPath)).has(decodedAnchor.toLowerCase())) {
      throw brokenReference(`unresolved local Markdown anchor in ${markdownPath}: ${destination}`);
    }
  }
  return { relativeLink: Boolean(decodedPath), localAnchor: Boolean(decodedAnchor && targetPath.endsWith(".md")) };
}

function revisionAvailable(cwd, revision) {
  return spawnSync("git", ["cat-file", "-e", `${revision}^{commit}`], { cwd, stdio: "ignore", timeout: 30_000 }).status === 0;
}

function listRevisionMarkdown(cwd, revision) {
  return runGit(cwd, ["ls-tree", "-r", "-z", revision]).stdout.split("\0").filter(Boolean).flatMap((entry) => {
    const separator = entry.indexOf("\t");
    const metadata = entry.slice(0, separator);
    const file = entry.slice(separator + 1);
    return /^100(?:644|755) blob /u.test(metadata) && file?.endsWith(".md") ? [file] : [];
  });
}

// These are existing executable interfaces and required delegations, not prose
// semantics. Human authority/meaning review cannot be replaced by this function.
export function assertVerificationDocumentation(sources) {
  for (const [file, source] of Object.entries(sources)) {
    if (file === "AGENTS.md") {
      assert.ok(source.includes("small, durable repository constitution for Augnes"), "AGENTS.md instruction marker required by hook installer");
      assert.ok(extractMarkdownDestinations(source).includes(".github/LOCAL_CANONICAL_VERIFICATION.md"), "AGENTS.md must delegate verification to its active owner");
    }
    if (["README.md", ".github/LOCAL_CANONICAL_VERIFICATION.md"].includes(file)) {
      for (const command of ["quick", "changed", "full", "receipt"]) {
        assert.ok(source.includes(`npm run verify:local:${command}`), `${file}: missing documented executable command verify:local:${command}`);
      }
    }
    if (file === ".github/pull_request_template.md") {
      // GitHub copies this text into a PR body, without the template's file context.
      assert.ok(extractMarkdownDestinations(source).includes("https://github.com/hynk-studio/augnes/blob/main/.github/LOCAL_CANONICAL_VERIFICATION.md"), "PR template must delegate verification applicability with an absolute URL usable in copied PR text");
    }
  }
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
  return normalized.replace(/\/$/u, "");
}

function assertRevisionPathExists(
  cwd,
  revision,
  targetPath,
  markdownPath,
  destination,
) {
  if (targetPath === ".") return;
  const result = runGit(cwd, ["ls-tree", "-z", revision, "--", targetPath]);
  const found = result.stdout.split("\0").some((entry) => entry.slice(entry.indexOf("\t") + 1) === targetPath);
  if (!found) throw brokenReference(`unresolved relative Markdown link in ${markdownPath}: ${destination}`);

}

function brokenReference(message) {
  const error = new Error(message);
  error.code = "broken_documentation_reference";
  return error;
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
    timeout: 30_000,
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
    const expectedPlan = args.get("plan") ?? "documentation-only";
    let result;
    if (expectedPlan === "documentation-only") {
      result = validateCanonicalDocumentationChange({
        baseSha: args.get("base"),
        headSha: args.get("head"),
      });
    } else if (expectedPlan === "operating-policy-only") {
      result = validateCanonicalOperatingPolicyChange({
        baseSha: args.get("base"),
        headSha: args.get("head"),
      });
    } else if (expectedPlan === "owner-targeted") {
      result = validateCanonicalOwnerTargetedChange({
        baseSha: args.get("base"),
        headSha: args.get("head"),
      });
    } else if (expectedPlan === "full-canonical") {
      result = validateCanonicalMarkdownChange({ baseSha: args.get("base"), headSha: args.get("head"), cwd: repositoryRoot, expectedPlan, test: "canonical-full-change-documentation" });
    } else {
      throw new Error(`unsupported Markdown validator plan: ${expectedPlan}`);
    }
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
