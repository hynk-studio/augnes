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

const projectConstellationForbiddenPathPatterns = [
  /^AGENTS\.md$/,
  /^app\/api\//,
  /^app\/.*route\.(ts|tsx|js|jsx)$/,
  /^db\//,
  /^migrations\//,
  /^apps\/augnes_apps\//,
  /(^|\/)(mcp|plugin|plugins|tool|tools|hook|hooks|mapping|mappings)(\/|$)/i,
  /(^|\/)(secret|secrets|env)(\/|$)/i,
  /(^|\/)\.env/i,
  /(^|\/)(ag-work-resume|ag_resume|ag-resume)(\/|$)/i,
  /(^|\/)(proof|evidence)(\/|$)/i,
  /(^|\/)(sidecar-runtime|sidecar_et_runtime|sidecar-et-runtime|runtime-sidecar)(\/|$)/i,
  /(^|\/)(codex-sdk|codex_sdk|provider|providers)(\/|$)/i,
  /(^|\/)(graph-db|graph_db|persistence)(\/|$)/i,
];

export function defineBoundarySmokeScopeProfile({
  name,
  ownedFiles = [],
  adjacentDocsFiles = [],
  adjacentFixtureFiles = [],
  adjacentSmokeFiles = [],
  browserReportFiles = [],
  browserReportFilePatterns = [],
  packageJsonFile = "package.json",
  forbiddenPathPatterns = [],
}) {
  assert(name, "Boundary smoke scope profile must include a name");
  const exactAllowedFiles = uniqueSorted([
    packageJsonFile,
    ...ownedFiles,
    ...adjacentDocsFiles,
    ...adjacentFixtureFiles,
    ...adjacentSmokeFiles,
    ...browserReportFiles,
  ]);
  const profile = {
    name,
    exactAllowedFiles,
    allowedChangedFiles: new Set(exactAllowedFiles),
    allowedPathPatterns: browserReportFilePatterns.map(toBoundaryPathPattern),
    forbiddenPathPatterns: [
      ...projectConstellationForbiddenPathPatterns,
      ...forbiddenPathPatterns,
    ],
  };

  assertNoForbiddenBoundaryProfilePaths({
    files: exactAllowedFiles,
    profile,
    label: `${name} profile definition`,
  });

  return profile;
}

export function getProjectConstellationBoundaryScopeProfile({
  ownedFiles = [],
} = {}) {
  return defineBoundarySmokeScopeProfile({
    name: "project_constellation_boundary_scope_v0_1",
    ownedFiles,
    adjacentDocsFiles: [
      "docs/PROJECT_CONSTELLATION_IA_V0_1.md",
      "docs/PERSPECTIVE_CAPSULE_CONTRACT_V0_1.md",
      "docs/CODEX_SDK_EXECUTION_AUTHORITY_DESIGN_V0_1.md",
      "docs/00_INDEX_LATEST.md",
    ],
    adjacentFixtureFiles: [
      "fixtures/project-constellation.sample.sidecar-strategy-c-v0.1.json",
    ],
    adjacentSmokeFiles: [
      "scripts/smoke-boundary-common.mjs",
      "scripts/smoke-project-constellation-ia-boundaries.mjs",
      "scripts/smoke-project-constellation-sample-fixture.mjs",
      "scripts/smoke-project-constellation-cockpit-preview.mjs",
      "scripts/smoke-perspective-capsule-copyable-handoff-preview.mjs",
      "scripts/smoke-perspective-capsule-contract.mjs",
      "scripts/smoke-codex-sdk-execution-authority-design.mjs",
    ],
    browserReportFilePatterns: [
      "reports/browser/*project-constellation*.md",
      "reports/browser/*perspective-capsule*.md",
    ],
  });
}

export function assertChangedFilesWithinBoundaryProfile({ profile, label }) {
  assert(profile?.name, "Boundary smoke scope profile is required");
  const workingTree = collectGitDiffFiles(["diff", "--name-only", "HEAD"]);
  const baseRange = getBaseRangeChangedFiles();
  const changedFiles = uniqueSorted([...workingTree.files, ...baseRange.files]);
  const untrackedFiles = collectUntrackedFiles();
  const files = uniqueSorted([...changedFiles, ...untrackedFiles]);
  const mode = getBoundarySmokeMode();
  const contentOnly = mode === "content-only";

  if (contentOnly) {
    return {
      profile_name: profile.name,
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
      untracked_checked: false,
      untracked_skipped: true,
      untracked_skip_reason:
        "untracked-file boundary skipped because AUGNES_BOUNDARY_SMOKE_MODE=content-only",
      untracked_files: untrackedFiles,
    };
  }

  for (const file of changedFiles) {
    assertBoundaryProfileAllowsFile({
      file,
      profile,
      message: `Unexpected changed file for ${label}: ${file}`,
    });
  }

  for (const file of untrackedFiles) {
    assertBoundaryProfileAllowsFile({
      file,
      profile,
      message: `Unexpected untracked file for ${label}: ${file}`,
    });
  }

  assertNoForbiddenBoundaryProfilePaths({ files, profile, label });

  const checked = workingTree.checked || baseRange.checked;

  return {
    profile_name: profile.name,
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
    untracked_checked: true,
    untracked_skipped: false,
    untracked_skip_reason: null,
    untracked_files: untrackedFiles,
  };
}

export function collectUntrackedFiles() {
  try {
    const output = execFileSync(
      "git",
      ["ls-files", "--others", "--exclude-standard"],
      {
        cwd: repoRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    return uniqueSorted(parseGitFileList(output));
  } catch {
    return [];
  }
}

function assertBoundaryProfileAllowsFile({ file, profile, message }) {
  assert(
    profile.allowedChangedFiles.has(file) ||
      profile.allowedPathPatterns.some((pattern) => pattern.test(file)),
    message,
  );
}

function assertNoForbiddenBoundaryProfilePaths({ files, profile, label }) {
  for (const file of files) {
    for (const pattern of profile.forbiddenPathPatterns) {
      assert(
        !pattern.test(file),
        `Forbidden changed path for ${label}: ${file}`,
      );
    }
  }
}

function toBoundaryPathPattern(pattern) {
  if (pattern instanceof RegExp) return pattern;
  const source = String(pattern)
    .split("*")
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("[^/]*");
  return new RegExp(`^${source}$`);
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
