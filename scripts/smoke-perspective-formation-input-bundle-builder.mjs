import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const builderFile =
  "lib/perspective-ingest/perspective-formation-input-bundle.ts";
const docFile =
  "docs/PERSPECTIVE_FORMATION_INPUT_BUNDLE_BUILDER_V0_1.md";
const reportFile =
  "reports/2026-06-08-perspective-formation-input-bundle-builder.md";
const laneDocFile = "docs/PERSPECTIVE_FORMATION_LANE_V0_1.md";
const smokeFile =
  "scripts/smoke-perspective-formation-input-bundle-builder.mjs";
const laneSmokeFile = "scripts/smoke-perspective-formation-lane-v0-1.mjs";
const candidateBuilderFile =
  "lib/perspective-ingest/perspective-candidate-builder.ts";
const candidateDocFile =
  "docs/PERSPECTIVE_CANDIDATE_BUILDER_FIXTURE_V0_1.md";
const candidateReportFile =
  "reports/2026-06-08-perspective-candidate-builder-fixture.md";
const candidateSmokeFile =
  "scripts/smoke-perspective-candidate-builder-fixture.mjs";
const briefingPreviewBuilderFile =
  "lib/perspective-ingest/perspective-candidate-briefing-preview.ts";
const briefingPreviewDocFile =
  "docs/PERSPECTIVE_CANDIDATE_BRIEFING_PREVIEW_V0_1.md";
const briefingPreviewReportFile =
  "reports/2026-06-08-perspective-candidate-briefing-preview.md";
const briefingPreviewSmokeFile =
  "scripts/smoke-perspective-candidate-briefing-preview.mjs";

const allowedChangedFiles = new Set([
  packageFile,
  builderFile,
  docFile,
  reportFile,
  smokeFile,
  laneDocFile,
  laneSmokeFile,
  candidateBuilderFile,
  candidateDocFile,
  candidateReportFile,
  candidateSmokeFile,
  briefingPreviewBuilderFile,
  briefingPreviewDocFile,
  briefingPreviewReportFile,
  briefingPreviewSmokeFile,
  "scripts/smoke-perspective-agent-brief-read-surface.mjs",
  "scripts/smoke-perspective-temporal-spatial-projection-builders.mjs",
]);

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const builderText = readFileSync(builderFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");
const laneDocText = readFileSync(laneDocFile, "utf8");

const { buildPerspectiveFormationInputBundle } = await import(
  "../lib/perspective-ingest/perspective-formation-input-bundle.ts"
);

assert.equal(existsSync(builderFile), true, `${builderFile} must exist`);
assert.equal(existsSync(docFile), true, `${docFile} must exist`);
assert.equal(existsSync(reportFile), true, `${reportFile} must exist`);
assert.equal(existsSync(smokeFile), true, `${smokeFile} must exist`);

assert.equal(
  packageJson.scripts["smoke:perspective-formation-input-bundle-builder"],
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-perspective-formation-input-bundle-builder.mjs",
  "package.json must register smoke:perspective-formation-input-bundle-builder",
);

assertBuilderSourceIsPureLocal();
assertDocsAndReport();
assertUsableSample();
assertMissingScopeCase();
assertNoWorkNoPrCase();
assertPlaceholderSkippedCheckCase();
assertChangedFileBoundary();

console.log("PASS smoke:perspective-formation-input-bundle-builder");

function assertUsableSample() {
  const bundle = buildPerspectiveFormationInputBundle({
    scope: "project:augnes",
    work_id: "AG-formation-input-bundle",
    source_pr_refs: ["pr:hynk-studio/augnes#463"],
    changed_files: [
      "lib/perspective-ingest/perspective-formation-input-bundle.ts",
      "docs/PERSPECTIVE_FORMATION_INPUT_BUNDLE_BUILDER_V0_1.md",
    ],
    changed_files_summary:
      "Adds a pure local builder and bounded documentation for PR B.",
    tests_checks_run: [
      {
        check_id: "check:typecheck",
        command: "npm run typecheck",
        status: "passed",
        result_summary: "TypeScript completed without errors.",
      },
    ],
    skipped_checks: [
      {
        check_id: "check:browser",
        skipped_reason:
          "Browser validation skipped because this is a pure local builder with no UI or route changes.",
        result_summary: "No browser-facing behavior changed.",
      },
    ],
    evidence_row_refs: ["evidence:row:formation-input-bundle-smoke"],
    proof_only_action_refs: ["action:proof:formation-input-bundle-closeout"],
    work_event_refs: ["work:event:formation-input-bundle-implemented"],
    session_trace_refs: ["session:trace:formation-input-bundle-codex"],
    existing_perspective_refs: ["perspective:lane:v0.1"],
    unresolved_gaps: [],
    authority_boundaries: [
      "pure local builder only",
      "no provider/model/API calls",
    ],
    source_privacy_redaction_notes: [
      "bounded summaries and pointer refs only",
      "raw/private payloads excluded",
    ],
    generated_at: "2026-06-08T00:00:00.000Z",
  });

  assert.equal(
    bundle.bundle_version,
    "perspective_formation_input_bundle.v0.1",
  );
  assert.equal(bundle.bundle_kind, "formation_input_bundle");
  assert.equal(bundle.scope, "project:augnes");
  assert.equal(bundle.work_id, "AG-formation-input-bundle");
  assert.deepEqual(bundle.changed_files, [
    "lib/perspective-ingest/perspective-formation-input-bundle.ts",
    "docs/PERSPECTIVE_FORMATION_INPUT_BUNDLE_BUILDER_V0_1.md",
  ]);
  assert.equal(
    bundle.changed_files_summary,
    "Adds a pure local builder and bounded documentation for PR B.",
  );
  assert.equal(bundle.verification_basis.checks_run.length, 1);
  assert.equal(bundle.verification_basis.checks_run[0].command, "npm run typecheck");
  assert.equal(bundle.verification_basis.skipped_checks.length, 1);
  assert.match(
    bundle.verification_basis.skipped_checks[0].skipped_reason,
    /pure local builder/,
  );
  assert.equal(bundle.verification_basis.evidence_row_refs[0].startsWith("evidence:"), true);
  assert.equal(bundle.verification_basis.proof_only_action_refs[0].startsWith("action:proof:"), true);
  assert.equal(bundle.trace_basis.work_event_refs[0].startsWith("work:event:"), true);
  assert.equal(bundle.trace_basis.session_trace_refs[0].startsWith("session:trace:"), true);
  assert.equal(bundle.perspective_basis.existing_perspective_refs[0].startsWith("perspective:"), true);
  assert.equal(bundle.privacy.raw_payloads_included, false);
  assert.deepEqual(bundle.authority, {
    mode: "read_only_formation_input",
    committed_state: false,
    persistence: false,
    provider_model_api_calls: false,
    proof_evidence_readiness_writes: false,
    codex_execution: false,
    merge_publish_approval: false,
  });
  assert.equal(bundle.readiness.status, "ready_for_candidate");
  assert.deepEqual(bundle.readiness.reasons, []);
  assert.equal(
    bundle.generated_at,
    "2026-06-08T00:00:00.000Z",
    "generated_at must be caller-supplied only",
  );

  const serialized = JSON.stringify(bundle);
  for (const forbiddenMarker of [
    "raw_pasted_text",
    "raw_source_payload",
    "raw_candidate_payload",
    "private_payload",
    "provider_payload",
    "oauth_token",
    "api_key",
    "billing_payload",
    "hidden_reasoning",
    "generated_model_payload",
    "secret",
  ]) {
    assert.equal(
      serialized.includes(forbiddenMarker),
      false,
      `bundle must not include raw/private marker field: ${forbiddenMarker}`,
    );
  }
}

function assertMissingScopeCase() {
  const bundle = buildPerspectiveFormationInputBundle({
    work_id: "AG-missing-scope",
    skipped_checks: [
      {
        check_id: "check:runtime",
        skipped_reason: "local runtime unavailable",
      },
    ],
  });

  assert.equal(bundle.readiness.status, "blocked");
  assert.deepEqual(bundle.readiness.reasons, ["missing scope"]);
}

function assertNoWorkNoPrCase() {
  const bundle = buildPerspectiveFormationInputBundle({
    scope: "project:augnes",
    tests_checks_run: [
      {
        check_id: "check:smoke",
        command: "npm run smoke:perspective-formation-input-bundle-builder",
        status: "passed",
        result_summary: "Builder smoke passed.",
      },
    ],
  });

  assert.equal(bundle.readiness.status, "needs_review");
  assert(bundle.readiness.reasons.includes("missing work_id and source_pr_refs"));
}

function assertPlaceholderSkippedCheckCase() {
  const bundle = buildPerspectiveFormationInputBundle({
    scope: "project:augnes",
    work_id: "AG-placeholder-skipped-check",
    skipped_checks: [
      {
        check_id: "browser",
        skipped_reason: "",
      },
    ],
  });

  assert.equal(bundle.readiness.status, "needs_review");
  assert(
    bundle.readiness.reasons.includes(
      "skipped checks missing concrete reasons",
    ),
  );
  assert(
    bundle.readiness.reasons.includes(
      "missing verification, proof, evidence, or skipped-check material",
    ),
    "empty skipped_reason must not count as valid verification material",
  );
  assert.deepEqual(bundle.verification_basis.skipped_checks, [
    {
      check_id: "browser",
      skipped_reason: "",
    },
  ]);
}

function assertBuilderSourceIsPureLocal() {
  assertContainsAll(builderText, [
    "buildPerspectiveFormationInputBundle",
    "perspective_formation_input_bundle.v0.1",
    "formation_input_bundle",
    "ready_for_candidate",
    "needs_review",
    "blocked",
    "skipped checks missing concrete reasons",
    "raw_payloads_included: false",
    "read_only_formation_input",
    "provider_model_api_calls: false",
    "proof_evidence_readiness_writes: false",
    "codex_execution: false",
    "merge_publish_approval: false",
  ]);

  for (const forbiddenMarker of [
    ["read", "File"].join(""),
    ["process", "env"].join("."),
    ["fetch", "("].join(""),
    ["Date", "now"].join("."),
    ["new", "Date"].join(" "),
    "app/api/",
    "db/",
    "migrations/",
    "GITHUB_TOKEN",
    "OPENAI_API_KEY",
  ]) {
    assert.equal(
      builderText.includes(forbiddenMarker),
      false,
      `${builderFile} must remain pure local and avoid ${forbiddenMarker}`,
    );
  }
}

function assertDocsAndReport() {
  assertContainsAll(docText, [
    "first pure local builder after Perspective Formation Lane v0.1",
    "caller-supplied Codex work material refs",
    "read-only Formation Input Bundle",
    "Consumed By Candidate Builder Fixture",
    "Formation Input Bundle remains read-only input material",
    "Bounded summaries are allowed",
    "Placeholder skipped checks may be preserved",
    "Raw/private/provider/token/source payloads remain forbidden",
    "not committed state",
    "not proof",
    "not evidence",
    "not approval",
    "Add ChatGPT Perspective Candidate briefing preview",
  ]);
  assertContainsAll(reportText, [
    "Summary",
    "Why This Follows PR #463",
    "Usability Correction: Bounded Summaries Are Allowed",
    "Files Changed",
    "Authority Boundary",
    "Validation Plan",
    "Review Fix",
    "What Is Not Implemented",
    "Add deterministic Perspective Candidate builder fixture",
  ]);
  assertContainsAll(laneDocText, [
    "Bounded summaries are allowed",
    "deliberate usability correction",
    "raw/private/provider/token/source payloads remain forbidden",
  ]);
  assert.equal(
    laneDocText.includes("bounded summary values, private/provider"),
    false,
    "lane doc must not retain blanket bounded-summary ban",
  );
}

function assertChangedFileBoundary() {
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `Formation Input Bundle builder changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/api/") &&
        !changedFile.startsWith("components/") &&
        changedFile !== "app/globals.css" &&
        !changedFile.startsWith("db/") &&
        !changedFile.startsWith("migrations/") &&
        !changedFile.startsWith("fixtures/") &&
        !changedFile.includes("provider") &&
        !changedFile.includes("oauth") &&
        !changedFile.includes("codex-sdk") &&
        !changedFile.includes("graph-db") &&
        !changedFile.includes("persistence"),
      `Formation Input Bundle builder must not change forbidden surfaces: ${changedFile}`,
    );
  }
}

function collectChangedFiles() {
  const workingTreeFiles = gitLinesOrEmpty(["diff", "--name-only", "HEAD"]);
  const branchFiles = collectBranchChangedFiles();
  const untrackedFiles = gitLinesOrEmpty([
    "ls-files",
    "--others",
    "--exclude-standard",
  ]);
  const changedFiles = Array.from(
    new Set([...workingTreeFiles, ...branchFiles, ...untrackedFiles]),
  ).filter(Boolean);

  if (changedFiles.length === 0 && isCommittedBranch()) {
    throw new Error("Formation Input Bundle builder smoke collected no changed files");
  }

  return changedFiles;
}

function collectBranchChangedFiles() {
  const originMainFiles = gitLinesStrict([
    "diff",
    "--name-only",
    "origin/main...HEAD",
  ]);
  if (originMainFiles) {
    return originMainFiles;
  }

  const localMainFiles = gitLinesStrict(["diff", "--name-only", "main...HEAD"]);
  if (localMainFiles) {
    return localMainFiles;
  }

  const originMergeBase = gitLineStrict(["merge-base", "HEAD", "origin/main"]);
  if (originMergeBase) {
    const originMergeBaseFiles = gitLinesStrict([
      "diff",
      "--name-only",
      `${originMergeBase}...HEAD`,
    ]);
    if (originMergeBaseFiles) {
      return originMergeBaseFiles;
    }
  }

  const localMergeBase = gitLineStrict(["merge-base", "HEAD", "main"]);
  if (localMergeBase) {
    const localMergeBaseFiles = gitLinesStrict([
      "diff",
      "--name-only",
      `${localMergeBase}...HEAD`,
    ]);
    if (localMergeBaseFiles) {
      return localMergeBaseFiles;
    }
  }

  throw new Error(
    "Unable to collect base diff for Formation Input Bundle builder smoke",
  );
}

function gitLinesOrEmpty(args) {
  return gitLinesStrict(args) ?? [];
}

function gitLinesStrict(args) {
  const output = tryGitOutput(args);
  return output === null ? null : parseGitLines(output);
}

function gitLineStrict(args) {
  const lines = gitLinesStrict(args);
  return lines?.[0] ?? null;
}

function isCommittedBranch() {
  return gitLineStrict(["rev-parse", "--verify", "HEAD"]) !== null;
}

function tryGitOutput(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" });
  } catch {
    return null;
  }
}

function parseGitLines(output) {
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function assertContainsAll(text, snippets) {
  const normalizedText = normalize(text);
  for (const snippet of snippets) {
    assert(
      normalizedText.includes(normalize(snippet)),
      `Expected source to contain: ${snippet}`,
    );
  }
}

function normalize(text) {
  return text.replace(/\s+/g, " ").trim();
}
