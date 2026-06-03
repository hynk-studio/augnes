import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export const repoRoot = process.cwd();

export function resolveRepoPath(file) {
  return path.join(repoRoot, file);
}

export function readRepoText(file) {
  return readFileSync(resolveRepoPath(file), "utf8");
}

export function assertRepoFileExists(file) {
  assert(existsSync(resolveRepoPath(file)), `Expected ${file} to exist`);
}

export function normalizeText(text) {
  return text.replace(/\s+/g, " ").trim();
}

export function loadTextByFile(files) {
  const textByFile = new Map();
  for (const file of files) {
    assertRepoFileExists(file);
    textByFile.set(file, readRepoText(file));
  }
  return textByFile;
}

export function assertContainsAll(textOrFileName, requiredPhrases, options = {}) {
  const text =
    options.textByFile?.get(textOrFileName) ??
    options.text ??
    textOrFileName;
  const label = options.label ?? textOrFileName;
  const normalizedText = normalizeText(text);

  for (const phrase of requiredPhrases) {
    assert(
      normalizedText.includes(normalizeText(phrase)),
      `${label} must contain: ${phrase}`,
    );
  }
}

export function assertNoUnnegatedPhrase({ file, text, phrase }) {
  const lowerText = text.toLowerCase();
  const lowerPhrase = phrase.toLowerCase();
  let index = lowerText.indexOf(lowerPhrase);

  while (index !== -1) {
    const before = lowerText.slice(Math.max(0, index - 80), index);
    const negated = /\b(no|not|does not|do not|must not|out of scope|without)\b/.test(
      before,
    );
    assert(
      negated,
      `${file} contains forbidden positive capability phrase: ${phrase}`,
    );
    index = lowerText.indexOf(lowerPhrase, index + lowerPhrase.length);
  }
}

export function assertNoForbiddenPositivePhrases({
  files,
  textByFile,
  phrases,
}) {
  for (const file of files) {
    const text = textByFile.get(file);
    for (const phrase of phrases) {
      assertNoUnnegatedPhrase({ file, text, phrase });
    }
  }
}

export function getBoundarySmokeMode() {
  const mode = process.env.AUGNES_BOUNDARY_SMOKE_MODE || "scoped";
  assertBoundarySmokeMode(mode);
  return mode;
}

export function isBoundaryContentOnlyMode() {
  return getBoundarySmokeMode() === "content-only";
}

export function assertBoundarySmokeMode(mode = getBoundarySmokeMode()) {
  assert(
    ["scoped", "content-only"].includes(mode),
    `AUGNES_BOUNDARY_SMOKE_MODE must be unset, scoped, or content-only; received ${JSON.stringify(mode)}`,
  );
}

export function assertChangedFilesWithin({ allowedChangedFiles, label }) {
  const workingTree = collectGitDiffFiles(["diff", "--name-only", "HEAD"]);
  const baseRange = getBaseRangeChangedFiles();
  const files = uniqueSorted([...workingTree.files, ...baseRange.files]);
  const mode = getBoundarySmokeMode();

  if (mode === "content-only") {
    return {
      mode,
      checked: false,
      skipped: true,
      skip_reason:
        "changed-file boundary skipped because AUGNES_BOUNDARY_SMOKE_MODE=content-only",
      files,
      working_tree_files: workingTree.files,
      working_tree_checked: workingTree.checked,
      working_tree_skipped: workingTree.skipped,
      base_ref: baseRange.base_ref,
      base_range_files: baseRange.files,
      base_range_checked: baseRange.checked,
      base_range_skipped: baseRange.skipped,
    };
  }

  const allowed = new Set(allowedChangedFiles);

  for (const file of files) {
    assert(allowed.has(file), `Unexpected changed file for ${label}: ${file}`);
  }

  const checked = workingTree.checked || baseRange.checked;

  return {
    mode,
    checked,
    skipped: !checked,
    skip_reason: checked ? null : "changed-file boundary could not be checked",
    files,
    working_tree_files: workingTree.files,
    working_tree_checked: workingTree.checked,
    working_tree_skipped: workingTree.skipped,
    base_ref: baseRange.base_ref,
    base_range_files: baseRange.files,
    base_range_checked: baseRange.checked,
    base_range_skipped: baseRange.skipped,
  };
}

export function collectGitDiffFiles(args) {
  try {
    const output = execFileSync("git", args, {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return {
      checked: true,
      skipped: false,
      files: uniqueSorted(parseGitFileList(output)),
    };
  } catch {
    return { checked: false, skipped: true, files: [] };
  }
}

export function getCandidateBaseRefs() {
  return [
    process.env.AUGNES_CHANGED_FILES_BASE_REF,
    process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : null,
    "origin/main",
    "main",
  ].filter(Boolean);
}

export function getBaseRangeChangedFiles() {
  const baseRef = getCandidateBaseRefs().find((candidate) =>
    gitRefExists(candidate),
  );

  if (!baseRef) {
    return { checked: false, skipped: true, files: [], base_ref: null };
  }

  const result = collectGitDiffFiles(["diff", "--name-only", `${baseRef}...HEAD`]);

  return {
    checked: result.checked,
    skipped: result.skipped,
    files: result.files,
    base_ref: baseRef,
  };
}

export function uniqueSorted(files) {
  return [...new Set(files.filter(Boolean))].sort();
}

function gitRefExists(ref) {
  try {
    execFileSync("git", ["rev-parse", "--verify", "--quiet", ref], {
      cwd: repoRoot,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function parseGitFileList(output) {
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function parsePackageJson(text) {
  return JSON.parse(text);
}

export function assertPackageScript({
  packageJsonText,
  scriptName,
  expectedCommand,
}) {
  const pkg = parsePackageJson(packageJsonText);
  assert.equal(
    pkg.scripts?.[scriptName],
    expectedCommand,
    `package.json must expose ${scriptName}`,
  );
}

export function assertNoRuntimeImports({
  file,
  text,
  forbiddenImports,
  forbidFetch = true,
}) {
  const importLines = text
    .split("\n")
    .filter((line) => line.trim().startsWith("import "));

  for (const line of importLines) {
    for (const forbiddenImport of forbiddenImports) {
      assert(
        !line.includes(forbiddenImport),
        `${file} must not import runtime module: ${forbiddenImport}`,
      );
    }
  }

  if (forbidFetch) {
    assert(!/\bfetch\s*\(/.test(text), `${file} must not reference fetch calls`);
  }
}

export function hasOwn(object, field) {
  return Object.hasOwn(object, field);
}
