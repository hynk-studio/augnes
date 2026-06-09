import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const inputBundleBuilderFile =
  "lib/perspective-ingest/perspective-formation-input-bundle.ts";
const candidateBuilderFile =
  "lib/perspective-ingest/perspective-candidate-builder.ts";
const briefingPreviewBuilderFile =
  "lib/perspective-ingest/perspective-candidate-briefing-preview.ts";
const userJudgmentBuilderFile =
  "lib/perspective-ingest/perspective-user-judgment-capture-packet.ts";
const codexDraftBuilderFile =
  "lib/perspective-ingest/perspective-codex-next-handoff-draft-packet.ts";
const docFile =
  "docs/PERSPECTIVE_CANDIDATE_BRIEFING_PREVIEW_V0_1.md";
const reportFile =
  "reports/2026-06-08-perspective-candidate-briefing-preview.md";
const smokeFile =
  "scripts/smoke-perspective-candidate-briefing-preview.mjs";
const userJudgmentDocFile =
  "docs/PERSPECTIVE_USER_JUDGMENT_CAPTURE_PACKET_V0_1.md";
const userJudgmentReportFile =
  "reports/2026-06-08-perspective-user-judgment-capture-packet.md";
const userJudgmentSmokeFile =
  "scripts/smoke-perspective-user-judgment-capture-packet.mjs";
const codexDraftDocFile =
  "docs/PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_PACKET_V0_1.md";
const codexDraftReportFile =
  "reports/2026-06-09-perspective-codex-next-handoff-draft-packet.md";
const codexDraftSmokeFile =
  "scripts/smoke-perspective-codex-next-handoff-draft-packet.mjs";
const dogfoodScriptFile =
  "scripts/dogfood-perspective-codex-next-handoff-draft.mjs";
const dogfoodSmokeFile =
  "scripts/smoke-perspective-codex-next-handoff-draft-dogfood.mjs";
const dogfoodDocFile =
  "docs/PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_DOGFOOD_V0_1.md";
const dogfoodReportFile =
  "reports/2026-06-09-perspective-codex-next-handoff-draft-dogfood.md";
const copyRefineReportFile =
  "reports/2026-06-09-perspective-codex-next-handoff-draft-copy-refine.md";
const dogfoodArtifactFile =
  "reports/dogfood/2026-06-09-perspective-codex-next-handoff-draft-packet.md";
const laneDocFile = "docs/PERSPECTIVE_FORMATION_LANE_V0_1.md";
const candidateDocFile =
  "docs/PERSPECTIVE_CANDIDATE_BUILDER_FIXTURE_V0_1.md";
const laneSmokeFile = "scripts/smoke-perspective-formation-lane-v0-1.mjs";
const inputBundleSmokeFile =
  "scripts/smoke-perspective-formation-input-bundle-builder.mjs";
const candidateSmokeFile =
  "scripts/smoke-perspective-candidate-builder-fixture.mjs";

const allowedChangedFiles = new Set([
  packageFile,
  briefingPreviewBuilderFile,
  userJudgmentBuilderFile,
  codexDraftBuilderFile,
  docFile,
  userJudgmentDocFile,
  codexDraftDocFile,
  dogfoodDocFile,
  reportFile,
  userJudgmentReportFile,
  codexDraftReportFile,
  dogfoodReportFile,
  copyRefineReportFile,
  dogfoodArtifactFile,
  smokeFile,
  userJudgmentSmokeFile,
  codexDraftSmokeFile,
  dogfoodScriptFile,
  dogfoodSmokeFile,
  laneDocFile,
  candidateDocFile,
  laneSmokeFile,
  inputBundleSmokeFile,
  candidateSmokeFile,
  "scripts/smoke-perspective-agent-brief-read-surface.mjs",
  "scripts/smoke-perspective-temporal-spatial-projection-builders.mjs",
]);

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const builderText = readFileSync(briefingPreviewBuilderFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");
const laneDocText = readFileSync(laneDocFile, "utf8");
const candidateDocText = readFileSync(candidateDocFile, "utf8");

const { buildPerspectiveFormationInputBundle } = await import(
  "../lib/perspective-ingest/perspective-formation-input-bundle.ts"
);
const { buildPerspectiveCandidateFromFormationInputBundle } = await import(
  "../lib/perspective-ingest/perspective-candidate-builder.ts"
);
const { buildChatGptPerspectiveCandidateBriefingPreview } = await import(
  "../lib/perspective-ingest/perspective-candidate-briefing-preview.ts"
);

assert.equal(existsSync(inputBundleBuilderFile), true, `${inputBundleBuilderFile} must exist`);
assert.equal(existsSync(candidateBuilderFile), true, `${candidateBuilderFile} must exist`);
assert.equal(existsSync(briefingPreviewBuilderFile), true, `${briefingPreviewBuilderFile} must exist`);
assert.equal(existsSync(docFile), true, `${docFile} must exist`);
assert.equal(existsSync(reportFile), true, `${reportFile} must exist`);
assert.equal(existsSync(smokeFile), true, `${smokeFile} must exist`);

assert.equal(
  packageJson.scripts["smoke:perspective-candidate-briefing-preview"],
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-perspective-candidate-briefing-preview.mjs",
  "package.json must register smoke:perspective-candidate-briefing-preview",
);

assertBuilderSourceIsPureLocal();
assertDocsAndReport();
assertSufficientCandidateBriefing();
assertNeedsReviewCandidateBriefing();
assertBlockedCandidateBriefing();
assertChangedFileBoundary();

console.log("PASS smoke:perspective-candidate-briefing-preview");

function assertSufficientCandidateBriefing() {
  const candidate = buildSufficientCandidate();
  const preview = buildChatGptPerspectiveCandidateBriefingPreview(candidate);
  const repeated = buildChatGptPerspectiveCandidateBriefingPreview(candidate);

  assertCommonPreview(candidate, preview);
  assert.equal(preview.headline, repeated.headline);
  assert.match(preview.headline, /Ready for human review, not approved/);
  assert.match(
    preview.briefing_sections.thesis.summary,
    /ChatGPT Perspective Candidate briefing preview/,
  );
  assert.match(preview.copyable_briefing_text, /ChatGPT Perspective Candidate briefing preview/);
  assert.deepEqual(preview.evidence_basis.pointer_kind_counts, {
    evidence_row_ref: 1,
    proof_only_action_ref: 1,
    work_event_ref: 1,
    session_trace_ref: 1,
    perspective_ref: 1,
  });
  assert.equal(preview.evidence_basis.pointer_count, 5);
  assert(
    preview.next_action_candidates.some(
      (action) => action.action_id === "review_candidate",
    ),
    "review_candidate must remain advisory when present",
  );
  const handoffAction = preview.next_action_candidates.find(
    (action) => action.action_id === "prepare_codex_handoff",
  );
  assert(handoffAction, "sufficient candidate must preserve prepare_codex_handoff");
  assert.equal(handoffAction.advisory_only, true);
  assert.equal(handoffAction.discussion_only, true);
  assert.equal(handoffAction.codex_execution, false);
  assert.match(handoffAction.summary, /does not execute Codex/);
  assert.equal(
    preview.codex_handoff_readiness.status,
    "ready_to_discuss_handoff",
  );
  assert.match(preview.copyable_briefing_text, /Candidate id:/);
  assert.match(preview.copyable_briefing_text, /Basis quality: sufficient_for_review/);
  assert.match(preview.copyable_briefing_text, /Evidence pointer count: 5/);
  assert.match(preview.copyable_briefing_text, /Unresolved tension count: 0/);
  assert.match(preview.copyable_briefing_text, /Authority boundary/);
  assertNoForbiddenPayloadText("sufficient briefing", preview.copyable_briefing_text);

  const withEmptyPointer = {
    ...candidate,
    evidence_pointers: [
      ...candidate.evidence_pointers,
      {
        pointer_kind: "evidence_row_ref",
        pointer_semantics: "pointer_only",
        ref: "",
      },
    ],
  };
  const emptyRefPreview =
    buildChatGptPerspectiveCandidateBriefingPreview(withEmptyPointer);
  assert.equal(emptyRefPreview.evidence_basis.pointer_count, 5);
  assert(
    emptyRefPreview.evidence_basis.pointer_refs.every(
      (pointer) =>
        pointer.pointer_semantics === "pointer_only" &&
        pointer.ref.trim() !== "",
    ),
    "pointer refs must remain pointer-only and omit empty refs",
  );
}

function assertNeedsReviewCandidateBriefing() {
  const candidate = buildNeedsReviewCandidate();
  const preview = buildChatGptPerspectiveCandidateBriefingPreview(candidate);

  assertCommonPreview(candidate, preview);
  assert.match(preview.headline, /Review is needed before handoff/);
  assert.equal(preview.codex_handoff_readiness.status, "review_required");
  assert(
    preview.unresolved_tensions.some(
      (tension) =>
        tension.tension_kind === "unresolved_gap" &&
        tension.source_ref === "gap:missing-user-judgment",
    ),
    "unresolved gaps must be preserved",
  );
  assert(
    preview.unresolved_tensions.some(
      (tension) =>
        tension.tension_kind === "readiness_reason" &&
        tension.summary === "unresolved gaps present",
    ),
    "readiness tension must remain visible",
  );
  assert.equal(
    Object.hasOwn(preview.briefing_sections, "support"),
    false,
    "unresolved tensions must not collapse into support",
  );
  assert(
    preview.next_action_candidates.every(
      (action) =>
        action.advisory_only === true && action.codex_execution === false,
    ),
    "all next actions must be advisory and non-executing",
  );
  assert(
    preview.user_reply_prompts.some((prompt) =>
      prompt.includes("Which unresolved tension"),
    ),
    "user reply prompts must support tension review",
  );
  assert.match(preview.copyable_briefing_text, /Unresolved tension count:/);
}

function assertBlockedCandidateBriefing() {
  const candidate = buildBlockedCandidate();
  const preview = buildChatGptPerspectiveCandidateBriefingPreview(candidate);

  assertCommonPreview(candidate, preview);
  assert.match(preview.headline, /Formation is blocked by missing or invalid input/);
  assert.equal(preview.codex_handoff_readiness.status, "blocked");
  assert(
    preview.unresolved_tensions.some(
      (tension) =>
        tension.tension_kind === "readiness_reason" &&
        tension.summary === "missing scope",
    ),
    "blocked missing scope reason must remain visible",
  );
}

function assertCommonPreview(candidate, preview) {
  assert.equal(
    preview.briefing_version,
    "perspective_candidate_briefing_preview.v0.1",
  );
  assert.equal(
    preview.briefing_kind,
    "chatgpt_perspective_candidate_briefing_preview",
  );
  assert.equal(preview.target_surface, "chatgpt_review_surface");
  assert.deepEqual(preview.source_candidate, {
    candidate_id: candidate.candidate_id,
    candidate_version: candidate.candidate_version,
    status: candidate.status,
    authority: candidate.authority,
  });
  assert.equal(preview.briefing_sections.thesis.summary, candidate.thesis);
  assert.deepEqual(preview.unresolved_tensions, candidate.unresolved_tensions);
  assert.deepEqual(
    preview.user_core_decision_questions,
    candidate.user_core_decision_questions,
  );
  assert.equal(preview.privacy.raw_payloads_included, false);
  assert.deepEqual(preview.authority_flags, {
    committed_state: false,
    persistence: false,
    provider_model_api_calls: false,
    proof_evidence_readiness_writes: false,
    codex_execution: false,
    merge_publish_approval: false,
    chatgpt_app_integration: false,
  });
  assert(
    preview.next_action_candidates.every(
      (action) =>
        action.advisory_only === true &&
        action.discussion_only === true &&
        action.codex_execution === false,
    ),
    "all next actions must be advisory-only discussion material",
  );
  assert(
    preview.user_reply_prompts.length >= 3,
    "user reply prompts must exist",
  );
  assertNoForbiddenPayloadText("briefing preview", preview);
}

function buildSufficientCandidate() {
  const bundle = buildPerspectiveFormationInputBundle({
    scope: "project:augnes",
    work_id: "AG-perspective-candidate-briefing-preview",
    source_pr_refs: ["pr:hynk-studio/augnes#465"],
    changed_files: [
      briefingPreviewBuilderFile,
      docFile,
      smokeFile,
    ],
    changed_files_summary:
      "Adds a pure local ChatGPT Perspective Candidate briefing preview.",
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
          "Browser validation skipped because this pure local builder has no UI or route changes.",
        result_summary: "No browser-facing behavior changed.",
      },
    ],
    evidence_row_refs: ["evidence:row:briefing-preview-smoke", ""],
    proof_only_action_refs: ["action:proof:briefing-preview-closeout"],
    work_event_refs: ["work:event:briefing-preview-implemented"],
    session_trace_refs: ["session:trace:briefing-preview-codex"],
    existing_perspective_refs: ["perspective:candidate-builder:v0.1"],
    source_privacy_redaction_notes: [
      "bounded summaries and pointer refs only",
      "raw/private payloads excluded",
    ],
    generated_at: "2026-06-08T00:00:00.000Z",
  });

  return buildPerspectiveCandidateFromFormationInputBundle(bundle);
}

function buildNeedsReviewCandidate() {
  const bundle = buildPerspectiveFormationInputBundle({
    scope: "project:augnes",
    work_id: "AG-perspective-candidate-briefing-preview-needs-review",
    changed_files_summary:
      "Captures candidate briefing gaps that need user judgment before handoff.",
    tests_checks_run: [
      {
        check_id: "check:smoke",
        command: "npm run smoke:perspective-candidate-briefing-preview",
        status: "passed",
        result_summary: "Briefing preview smoke passed.",
      },
    ],
    unresolved_gaps: [
      {
        gap_id: "gap:missing-user-judgment",
        summary: "The user has not yet selected which tension blocks handoff.",
      },
    ],
  });

  return buildPerspectiveCandidateFromFormationInputBundle(bundle);
}

function buildBlockedCandidate() {
  const bundle = buildPerspectiveFormationInputBundle({
    work_id: "AG-perspective-candidate-briefing-preview-blocked",
    skipped_checks: [
      {
        check_id: "check:runtime",
        skipped_reason: "local runtime unavailable",
      },
    ],
  });

  return buildPerspectiveCandidateFromFormationInputBundle(bundle);
}

function assertBuilderSourceIsPureLocal() {
  assertContainsAll(builderText, [
    "buildChatGptPerspectiveCandidateBriefingPreview",
    "perspective_candidate_briefing_preview.v0.1",
    "chatgpt_perspective_candidate_briefing_preview",
    "chatgpt_review_surface",
    "copyable_briefing_text",
    "ready_to_discuss_handoff",
    "review_required",
    "blocked",
    "raw_payloads_included: false",
    "chatgpt_app_integration: false",
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
    "api.github.com",
    "api.openai.com",
    "GITHUB_TOKEN",
    "OPENAI_API_KEY",
  ]) {
    assert.equal(
      builderText.includes(forbiddenMarker),
      false,
      `${briefingPreviewBuilderFile} must remain pure local and avoid ${forbiddenMarker}`,
    );
  }
}

function assertDocsAndReport() {
  assertContainsAll(docText, [
    "pure local ChatGPT-facing briefing preview after PR #465",
    "non-committed Perspective Candidates",
    "deterministic and pure local",
    "does not implement ChatGPT Apps integration",
    "does not implement a route, UI, DB, persistence, OAuth, provider calls",
    "Preserves evidence pointer refs as pointer-only",
    "Preserves unresolved tensions separately from support",
    "user reply prompts",
    "next handoff discussion",
    "does not execute Codex",
    "not committed state",
    "not proof",
    "not evidence",
    "not readiness",
    "not approval",
    "not merge authority",
    "Consumed By",
    "user judgment capture packet",
    "not judgment capture by itself",
    "Codex next-handoff draft packet",
  ]);
  assertContainsAll(reportText, [
    "Summary",
    "Why This Follows PR #465",
    "Files Changed",
    "Authority Boundary",
    "Validation Plan",
    "What Is Not Implemented",
    "Tests Run",
    "Skipped Checks",
    "Blockers or Risks",
    "Add manual ChatGPT user judgment capture packet",
  ]);
  assertContainsAll(candidateDocText, [
    "Consumed By",
    "Perspective Candidate briefing preview",
    "not briefing or approval by itself",
  ]);
  assertContainsAll(laneDocText, [
    "PR D: ChatGPT briefing surface preview",
    "implemented as a pure local briefing preview builder",
    "PR E: manual ChatGPT user judgment capture packet",
    "implemented as a pure local user judgment capture packet builder",
    "PR F: Codex next-handoff draft packet",
    "implemented as a pure local non-executing draft packet builder",
    "PR G: local Codex handoff draft dogfood report",
    "deterministic local dogfood/report validation slice",
    "PR H: Refine Codex handoff draft copy from dogfood findings",
  ]);
}

function assertNoForbiddenPayloadText(label, value) {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
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
      `${label} must not include raw/private marker field: ${forbiddenMarker}`,
    );
  }
}

function assertChangedFileBoundary() {
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `Perspective Candidate briefing preview changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/api/") &&
        !changedFile.startsWith("components/") &&
        changedFile !== "app/globals.css" &&
        (!changedFile.startsWith("lib/") ||
          changedFile === briefingPreviewBuilderFile ||
          changedFile === userJudgmentBuilderFile ||
          changedFile === codexDraftBuilderFile) &&
        !changedFile.startsWith("db/") &&
        !changedFile.startsWith("migrations/") &&
        !changedFile.startsWith("fixtures/") &&
        !changedFile.startsWith("types/") &&
        !changedFile.includes("provider") &&
        !changedFile.includes("oauth") &&
        !changedFile.includes("codex-sdk") &&
        !changedFile.includes("graph-db") &&
        !changedFile.includes("persistence"),
      `Perspective Candidate briefing preview must not change forbidden surfaces: ${changedFile}`,
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
    throw new Error(
      "Perspective Candidate briefing preview smoke collected no changed files",
    );
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
    "Unable to collect base diff for Perspective Candidate briefing preview smoke",
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
