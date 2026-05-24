import assert from "node:assert/strict";
import { execSync } from "node:child_process";
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

export function assertChangedFilesWithin({ allowedChangedFiles, label }) {
  let output;
  try {
    output = execSync("git diff --name-only HEAD", {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    if (error.status === undefined) {
      return { checked: false, skipped: true, files: [] };
    }
    throw error;
  }

  const files = output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const allowed = new Set(allowedChangedFiles);

  for (const file of files) {
    assert(allowed.has(file), `Unexpected changed file for ${label}: ${file}`);
  }

  return { checked: true, skipped: false, files };
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
