#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  chmodSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  parseNameStatus,
  planCanonicalChange,
} from "./canonical-change-planner.mjs";
import { validateCanonicalDocumentationChange } from "./validate-canonical-docs-change.mjs";

const temporaryRoot = mkdtempSync(path.join(tmpdir(), "ag-planner-"));
const results = [];

try {
  runPlanCase("README-only", "documentation-only", ({ write }) => {
    write("README.md", "# Updated\n");
  });
  runPlanCase("docs-only", "documentation-only", ({ write }) => {
    write("docs/guide.md", "# Guide\n");
  });
  runPlanCase("research-only", "documentation-only", ({ write }) => {
    write("research/note.md", "# Note\n");
  });
  runPlanCase("submission-image-plus-markdown", "documentation-only", ({ write }) => {
    write("docs/submission/entry.md", "![Preview](preview.png)\n");
    write("docs/submission/preview.png", Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  });
  runPlanCase("AGENTS.md", "full-canonical", ({ write }) => {
    write("AGENTS.md", "# Changed instructions\n");
  });
  runPlanCase("workflow", "full-canonical", ({ write }) => {
    write(".github/workflows/new.yml", "name: test\n");
  });
  runPlanCase("composite-action", "full-canonical", ({ write }) => {
    write(".github/actions/example/action.yml", "name: example\n");
  });
  runPlanCase("source-file", "full-canonical", ({ write }) => {
    write("lib/example.ts", "export const value = 1;\n");
  });
  runPlanCase("application-CSS", "full-canonical", ({ write }) => {
    write("app/example.css", "body { color: red; }\n");
  });
  runPlanCase("test-file", "full-canonical", ({ write }) => {
    write("tests/example.test.ts", "export {};\n");
  });
  runPlanCase("migration", "full-canonical", ({ write }) => {
    write("data/migrations/001.sql", "select 1;\n");
  });
  runPlanCase("package-manifest", "full-canonical", ({ write }) => {
    write("package.json", "{\"private\":true,\"version\":\"2\"}\n");
  });
  runPlanCase("nested-lockfile", "full-canonical", ({ write }) => {
    write("apps/example/package-lock.json", "{\"lockfileVersion\":3}\n");
  });
  runPlanCase("docs-to-source-rename", "full-canonical", ({ rename }) => {
    rename("docs/existing.md", "lib/existing.md");
  });
  runPlanCase("documentation-deletion", "full-canonical", ({ remove }) => {
    remove("docs/existing.md");
  });
  runPlanCase("unknown-path", "full-canonical", ({ write }) => {
    write("docs/unknown.payload", "unknown\n");
  });
  runPlanCase("executable-mode-change", "full-canonical", ({ chmod }) => {
    chmod("README.md", 0o755);
  });
  runPlanCase("symlink", "full-canonical", ({ symlink }) => {
    symlink("README.md", "docs/readme-link.md");
  });

  const malformedRepo = createRepository("malformed-sha");
  assert.throws(
    () =>
      planCanonicalChange({
        eventName: "pull_request",
        baseSha: "missing",
        headSha: malformedRepo.baseSha,
        cwd: malformedRepo.cwd,
      }),
    /base SHA must be exactly 40/u,
  );
  assert.throws(
    () =>
      planCanonicalChange({
        eventName: "pull_request",
        baseSha: malformedRepo.baseSha,
        headSha: "0".repeat(40),
        cwd: malformedRepo.cwd,
      }),
    /git cat-file failed/u,
  );
  assert.throws(
    () => parseNameStatus(Buffer.from("X\0path\0", "utf8")),
    /unsupported canonical diff status/u,
  );
  assert.throws(
    () => parseNameStatus(Buffer.from("M\0path", "utf8")),
    /not NUL terminated/u,
  );
  results.push("malformed-or-missing-base-head");

  const pushPlan = planCanonicalChange({
    eventName: "push",
    baseSha: "",
    headSha: malformedRepo.baseSha,
    cwd: malformedRepo.cwd,
  });
  assert.equal(pushPlan.plan, "full-canonical");
  assert.equal(pushPlan.reason, "main_push_always_full");
  results.push("main-push-always-full");

  runDocumentationValidatorCases();

  console.log(
    JSON.stringify(
      {
        test: "canonical-change-planner",
        status: "pass",
        cases: results,
        fail_closed: true,
        documentation_validation: true,
      },
      null,
      2,
    ),
  );
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}

function runPlanCase(name, expectedPlan, mutate) {
  const repository = createRepository(name);
  mutate(repository);
  commitAll(repository.cwd, `case: ${name}`);
  const headSha = git(repository.cwd, ["rev-parse", "HEAD"]).trim();
  const plan = planCanonicalChange({
    eventName: "pull_request",
    baseSha: repository.baseSha,
    headSha,
    cwd: repository.cwd,
  });
  assert.equal(plan.plan, expectedPlan, name);
  results.push(name);
}

function createRepository(name) {
  const cwd = path.join(temporaryRoot, name);
  mkdirSync(cwd, { recursive: true });
  git(cwd, ["init", "--quiet"]);
  git(cwd, ["config", "user.email", "canonical-tests@example.invalid"]);
  git(cwd, ["config", "user.name", "Canonical Tests"]);
  write(cwd, "README.md", "# Fixture\n");
  write(cwd, "AGENTS.md", "# Instructions\n");
  write(cwd, "docs/existing.md", "# Existing\n");
  write(cwd, "package.json", "{\"private\":true}\n");
  commitAll(cwd, "base");
  const baseSha = git(cwd, ["rev-parse", "HEAD"]).trim();
  return {
    cwd,
    baseSha,
    write: (relativePath, content) => write(cwd, relativePath, content),
    remove: (relativePath) => unlinkSync(path.join(cwd, relativePath)),
    rename: (from, to) => {
      mkdirSync(path.dirname(path.join(cwd, to)), { recursive: true });
      git(cwd, ["mv", from, to]);
    },
    chmod: (relativePath, mode) => chmodSync(path.join(cwd, relativePath), mode),
    symlink: (target, relativePath) => {
      mkdirSync(path.dirname(path.join(cwd, relativePath)), { recursive: true });
      symlinkSync(target, path.join(cwd, relativePath));
    },
  };
}

function runDocumentationValidatorCases() {
  const valid = createRepository("docs-validator-valid");
  valid.write(
    "docs/existing.md",
    "# Existing\n\n[Section](#details)\n\n## Details\n\n[README](../README.md#fixture)\n",
  );
  commitAll(valid.cwd, "valid docs");
  let headSha = git(valid.cwd, ["rev-parse", "HEAD"]).trim();
  const validResult = validateCanonicalDocumentationChange({
    baseSha: valid.baseSha,
    headSha,
    cwd: valid.cwd,
  });
  assert.equal(validResult.status, "pass");
  assert.equal(validResult.relative_links_checked, 1);
  assert.equal(validResult.local_anchors_checked, 2);
  results.push("documentation-links-and-anchors");

  const missingLink = createRepository("docs-validator-missing-link");
  missingLink.write("docs/existing.md", "# Existing\n\n[Missing](missing.md)\n");
  commitAll(missingLink.cwd, "missing link");
  headSha = git(missingLink.cwd, ["rev-parse", "HEAD"]).trim();
  assert.throws(
    () =>
      validateCanonicalDocumentationChange({
        baseSha: missingLink.baseSha,
        headSha,
        cwd: missingLink.cwd,
      }),
    /unresolved relative Markdown link/u,
  );
  results.push("documentation-missing-link-refused");

  const missingAnchor = createRepository("docs-validator-missing-anchor");
  missingAnchor.write("docs/existing.md", "# Existing\n\n[Missing](#absent)\n");
  commitAll(missingAnchor.cwd, "missing anchor");
  headSha = git(missingAnchor.cwd, ["rev-parse", "HEAD"]).trim();
  assert.throws(
    () =>
      validateCanonicalDocumentationChange({
        baseSha: missingAnchor.baseSha,
        headSha,
        cwd: missingAnchor.cwd,
      }),
    /unresolved local Markdown anchor/u,
  );
  results.push("documentation-missing-anchor-refused");

  const privatePath = createRepository("docs-validator-private-path");
  privatePath.write("docs/existing.md", "# Existing\n\n/Users/private/project\n");
  commitAll(privatePath.cwd, "private path");
  headSha = git(privatePath.cwd, ["rev-parse", "HEAD"]).trim();
  assert.throws(
    () =>
      validateCanonicalDocumentationChange({
        baseSha: privatePath.baseSha,
        headSha,
        cwd: privatePath.cwd,
      }),
    /private absolute filesystem path/u,
  );
  results.push("documentation-private-path-refused");
}

function write(cwd, relativePath, content) {
  const target = path.join(cwd, relativePath);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, content);
}

function commitAll(cwd, message) {
  git(cwd, ["add", "-A"]);
  git(cwd, ["commit", "--quiet", "-m", message]);
}

function git(cwd, args) {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${result.stderr.trim()}`);
  }
  return result.stdout;
}
