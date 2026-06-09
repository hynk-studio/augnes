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
  "docs/PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_PACKET_V0_1.md";
const reportFile =
  "reports/2026-06-09-perspective-codex-next-handoff-draft-packet.md";
const smokeFile =
  "scripts/smoke-perspective-codex-next-handoff-draft-packet.mjs";
const dogfoodScriptFile =
  "scripts/dogfood-perspective-codex-next-handoff-draft.mjs";
const dogfoodSmokeFile =
  "scripts/smoke-perspective-codex-next-handoff-draft-dogfood.mjs";
const dogfoodDocFile =
  "docs/PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_DOGFOOD_V0_1.md";
const dogfoodReportFile =
  "reports/2026-06-09-perspective-codex-next-handoff-draft-dogfood.md";
const dogfoodArtifactFile =
  "reports/dogfood/2026-06-09-perspective-codex-next-handoff-draft-packet.md";
const laneDocFile = "docs/PERSPECTIVE_FORMATION_LANE_V0_1.md";
const userJudgmentDocFile =
  "docs/PERSPECTIVE_USER_JUDGMENT_CAPTURE_PACKET_V0_1.md";
const briefingPreviewDocFile =
  "docs/PERSPECTIVE_CANDIDATE_BRIEFING_PREVIEW_V0_1.md";
const laneSmokeFile = "scripts/smoke-perspective-formation-lane-v0-1.mjs";
const inputBundleSmokeFile =
  "scripts/smoke-perspective-formation-input-bundle-builder.mjs";
const candidateSmokeFile =
  "scripts/smoke-perspective-candidate-builder-fixture.mjs";
const briefingPreviewSmokeFile =
  "scripts/smoke-perspective-candidate-briefing-preview.mjs";
const userJudgmentSmokeFile =
  "scripts/smoke-perspective-user-judgment-capture-packet.mjs";

const allowedChangedFiles = new Set([
  packageFile,
  codexDraftBuilderFile,
  docFile,
  reportFile,
  smokeFile,
  dogfoodScriptFile,
  dogfoodSmokeFile,
  dogfoodDocFile,
  dogfoodReportFile,
  dogfoodArtifactFile,
  laneDocFile,
  userJudgmentDocFile,
  briefingPreviewDocFile,
  laneSmokeFile,
  inputBundleSmokeFile,
  candidateSmokeFile,
  briefingPreviewSmokeFile,
  userJudgmentSmokeFile,
  "scripts/smoke-perspective-agent-brief-read-surface.mjs",
  "scripts/smoke-perspective-temporal-spatial-projection-builders.mjs",
]);

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const builderText = readFileSync(codexDraftBuilderFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");
const laneDocText = readFileSync(laneDocFile, "utf8");
const userJudgmentDocText = readFileSync(userJudgmentDocFile, "utf8");
const briefingPreviewDocText = readFileSync(briefingPreviewDocFile, "utf8");

const { buildPerspectiveFormationInputBundle } = await import(
  "../lib/perspective-ingest/perspective-formation-input-bundle.ts"
);
const { buildPerspectiveCandidateFromFormationInputBundle } = await import(
  "../lib/perspective-ingest/perspective-candidate-builder.ts"
);
const { buildChatGptPerspectiveCandidateBriefingPreview } = await import(
  "../lib/perspective-ingest/perspective-candidate-briefing-preview.ts"
);
const { buildManualChatGptUserJudgmentCapturePacket } = await import(
  "../lib/perspective-ingest/perspective-user-judgment-capture-packet.ts"
);
const { buildCodexNextHandoffDraftPacketFromUserJudgment } = await import(
  "../lib/perspective-ingest/perspective-codex-next-handoff-draft-packet.ts"
);

assert.equal(existsSync(inputBundleBuilderFile), true, `${inputBundleBuilderFile} must exist`);
assert.equal(existsSync(candidateBuilderFile), true, `${candidateBuilderFile} must exist`);
assert.equal(existsSync(briefingPreviewBuilderFile), true, `${briefingPreviewBuilderFile} must exist`);
assert.equal(existsSync(userJudgmentBuilderFile), true, `${userJudgmentBuilderFile} must exist`);
assert.equal(existsSync(codexDraftBuilderFile), true, `${codexDraftBuilderFile} must exist`);
assert.equal(existsSync(docFile), true, `${docFile} must exist`);
assert.equal(existsSync(reportFile), true, `${reportFile} must exist`);
assert.equal(existsSync(smokeFile), true, `${smokeFile} must exist`);

assert.equal(
  packageJson.scripts["smoke:perspective-codex-next-handoff-draft-packet"],
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-perspective-codex-next-handoff-draft-packet.mjs",
  "package.json must register smoke:perspective-codex-next-handoff-draft-packet",
);

assertBuilderSourceIsPureLocal();
assertDocsAndReport();
assertReadyToCopyDraft();
assertNeedsScopeDraft();
assertNeedsRevisionDraft();
assertBlockedDraft();
assertNoneDraft();
assertChangedFileBoundary();

console.log("PASS smoke:perspective-codex-next-handoff-draft-packet");

function assertReadyToCopyDraft() {
  const packet = buildMatchesDirectionUserJudgmentPacket();
  const draft = buildCodexNextHandoffDraftPacketFromUserJudgment({
    user_judgment_packet: packet,
    handoff_context: buildCompleteHandoffContext({
      draft_id: "draft:ready-to-copy",
    }),
  });
  const repeated = buildCodexNextHandoffDraftPacketFromUserJudgment({
    user_judgment_packet: packet,
    handoff_context: buildCompleteHandoffContext({
      draft_id: "draft:ready-to-copy",
    }),
  });

  assertCommonDraft(packet, draft);
  assert.equal(draft.draft_id, repeated.draft_id);
  assert.equal(draft.draft_status, "ready_to_copy");
  assert.equal(draft.readiness.status, "ready_to_copy");
  assert.equal(draft.gaps.missing_task_goal, false);
  assert.equal(draft.gaps.missing_expected_files, false);
  assert.equal(draft.gaps.missing_required_checks, false);
  assert.equal(draft.codex_task.task_goal, "Add the next pure local draft packet slice.");
  assert.deepEqual(draft.codex_task.expected_files, [
    codexDraftBuilderFile,
    docFile,
    reportFile,
    smokeFile,
  ]);
  assert.deepEqual(draft.codex_task.required_checks, [
    "npm run typecheck",
    "npm run smoke:perspective-codex-next-handoff-draft-packet",
    "git diff --check",
  ]);
  assertCopyable(draft);
}

function assertNeedsScopeDraft() {
  const packet = buildMatchesDirectionUserJudgmentPacket();
  const draft = buildCodexNextHandoffDraftPacketFromUserJudgment({
    user_judgment_packet: packet,
    handoff_context: {
      draft_id: "draft:needs-scope",
      task_goal: "Draft a scoped Codex task but leave files and checks open.",
      expected_files: [],
      required_checks: [],
    },
  });

  assertCommonDraft(packet, draft);
  assert.equal(draft.draft_status, "needs_scope");
  assert.equal(draft.readiness.status, "needs_scope");
  assert.equal(draft.gaps.missing_task_goal, false);
  assert.equal(draft.gaps.missing_expected_files, true);
  assert.equal(draft.gaps.missing_required_checks, true);
  assert(
    draft.readiness.reasons.includes("expected_files are missing"),
    "missing expected files must remain visible",
  );
  assert(
    draft.readiness.reasons.includes("required_checks are missing"),
    "missing required checks must remain visible",
  );
}

function assertNeedsRevisionDraft() {
  const packet = buildNeedsRevisionUserJudgmentPacket();
  const draft = buildCodexNextHandoffDraftPacketFromUserJudgment({
    user_judgment_packet: packet,
    handoff_context: buildCompleteHandoffContext({
      draft_id: "draft:needs-revision",
    }),
  });

  assertCommonDraft(packet, draft);
  assert.equal(draft.draft_status, "needs_revision_first");
  assert.equal(draft.readiness.status, "needs_revision_first");
  assert.equal(draft.gaps.needs_revision_first, true);
  assert.notEqual(draft.draft_status, "ready_to_copy");
}

function assertBlockedDraft() {
  const packet = buildRejectedUserJudgmentPacket();
  const draft = buildCodexNextHandoffDraftPacketFromUserJudgment({
    user_judgment_packet: packet,
    handoff_context: buildCompleteHandoffContext({
      draft_id: "draft:blocked",
    }),
  });

  assertCommonDraft(packet, draft);
  assert.equal(draft.draft_status, "blocked");
  assert.equal(draft.readiness.status, "blocked");
  assert.equal(draft.gaps.blocked_by_user_judgment, true);
  assert.deepEqual(draft.blocking_tension_refs, ["gap:missing-user-judgment"]);
  assert.notEqual(draft.draft_status, "ready_to_copy");
}

function assertNoneDraft() {
  const packet = buildUnclearUserJudgmentPacket();
  const draft = buildCodexNextHandoffDraftPacketFromUserJudgment({
    user_judgment_packet: packet,
    handoff_context: buildCompleteHandoffContext({
      draft_id: "draft:none",
    }),
  });

  assertCommonDraft(packet, draft);
  assert.equal(draft.draft_status, "none");
  assert.equal(draft.readiness.status, "none");
  assert.equal(draft.gaps.user_clarification_needed, true);
  assert.notEqual(draft.draft_status, "ready_to_copy");
}

function assertCommonDraft(packet, draft) {
  assert.equal(
    draft.draft_version,
    "perspective_codex_next_handoff_draft_packet.v0.1",
  );
  assert.equal(draft.draft_kind, "codex_next_handoff_draft");
  assert.deepEqual(draft.source_user_judgment, {
    packet_id: packet.packet_id,
    packet_version: packet.packet_version,
    capture_mode: packet.capture_mode,
    candidate_id: packet.source_briefing.candidate_id,
    direction_alignment: packet.user_judgment.direction_alignment,
    decision_effect_status: packet.decision_effect.status,
    next_handoff_discussion_status:
      packet.next_handoff_discussion.status,
    preferred_next_action: packet.user_judgment.preferred_next_action,
  });
  assert.deepEqual(
    draft.selected_unresolved_tension_refs,
    packet.user_judgment.selected_unresolved_tension_refs,
  );
  assert.deepEqual(
    draft.blocking_tension_refs,
    packet.user_judgment.blocking_tension_refs,
  );
  assert.deepEqual(
    draft.user_core_decision_questions,
    packet.user_core_decision_questions,
  );
  assert.equal(draft.privacy.raw_payloads_included, false);
  assert.deepEqual(draft.authority_flags, {
    committed_state: false,
    persistence: false,
    provider_model_api_calls: false,
    proof_evidence_readiness_writes: false,
    codex_execution: false,
    github_mutation: false,
    merge_publish_approval: false,
    chatgpt_app_integration: false,
    core_decision: false,
  });
  assertNoForbiddenPayloadText("codex handoff draft packet", draft);
}

function assertCopyable(draft) {
  assert.match(draft.copyable_codex_handoff_text, new RegExp(escapeRegExp(draft.draft_id)));
  assert.match(
    draft.copyable_codex_handoff_text,
    new RegExp(escapeRegExp(draft.source_user_judgment.packet_id)),
  );
  assert.match(
    draft.copyable_codex_handoff_text,
    new RegExp(escapeRegExp(draft.source_user_judgment.candidate_id)),
  );
  assert.match(draft.copyable_codex_handoff_text, /Task Goal/);
  assert.match(draft.copyable_codex_handoff_text, /Expected Files/);
  assert.match(draft.copyable_codex_handoff_text, /Forbidden Files/);
  assert.match(draft.copyable_codex_handoff_text, /Forbidden Surfaces/);
  assert.match(draft.copyable_codex_handoff_text, /Required Checks/);
  assert.match(draft.copyable_codex_handoff_text, /Skipped-Check Policy/);
  assert.match(draft.copyable_codex_handoff_text, /Authority Boundary/);
  assert.match(draft.copyable_codex_handoff_text, /PR-centered workflow/);
  assert.match(draft.copyable_codex_handoff_text, /This is draft only/);
  assert.match(draft.copyable_codex_handoff_text, /does not execute Codex/);
  assert.match(
    draft.copyable_codex_handoff_text,
    /only when the user explicitly starts a Codex task with this draft/,
  );
  assert.match(
    draft.copyable_codex_handoff_text,
    /ChatGPT reviews, and the user decides merge/,
  );
  assert.equal(
    draft.copyable_codex_handoff_text.includes("approval granted"),
    false,
  );
  assert.equal(
    draft.copyable_codex_handoff_text.includes("execute background work"),
    false,
  );
  assertNoForbiddenPayloadText(
    "copyable Codex handoff text",
    draft.copyable_codex_handoff_text,
  );
}

function buildCompleteHandoffContext({ draft_id }) {
  return {
    draft_id,
    task_goal: "Add the next pure local draft packet slice.",
    target_repo: "hynk-studio/augnes",
    base_branch: "main",
    working_branch_suggestion:
      "codex/perspective-codex-next-handoff-draft-packet-v0-1",
    expected_files: [
      codexDraftBuilderFile,
      docFile,
      reportFile,
      smokeFile,
    ],
    forbidden_files: ["app/api/**", "components/**", "db/**", "migrations/**"],
    forbidden_surfaces: [
      "runtime routes",
      "product UI",
      "provider/model/API calls",
      "Codex execution",
      "GitHub mutation",
    ],
    required_checks: [
      "npm run typecheck",
      "npm run smoke:perspective-codex-next-handoff-draft-packet",
      "git diff --check",
    ],
    skipped_check_policy:
      "Report absent lint/test scripts and runtime-unavailable helpers with exact reasons.",
    implementation_notes: [
      "Keep the builder deterministic and pure local.",
      "Do not invent expected files or checks.",
    ],
    review_notes: [
      "Verify ready_to_copy remains a copyable draft only.",
    ],
    user_constraints: [
      "No runtime route",
      "No DB schema",
      "No Codex execution",
    ],
    generated_at: "2026-06-09T00:00:00.000Z",
  };
}

function buildMatchesDirectionUserJudgmentPacket() {
  return buildManualChatGptUserJudgmentCapturePacket({
    briefing_preview: buildReadyBriefing(),
    user_judgment: {
      judgment_id: "judgment:codex-draft-ready",
      judgment_summary:
        "The candidate matches direction and should be drafted into a bounded Codex handoff.",
      answered_prompt_refs: [
        "Should the next step be to fix input gaps or prepare a Codex handoff?",
      ],
      direction_alignment: "matches_direction",
      selected_unresolved_tension_refs: [],
      blocking_tension_refs: [],
      preferred_next_action: "prepare_codex_handoff",
      next_action_rationale:
        "The user wants a bounded handoff draft for later Codex work.",
    },
  });
}

function buildNeedsRevisionUserJudgmentPacket() {
  return buildManualChatGptUserJudgmentCapturePacket({
    briefing_preview: buildReadyBriefing(),
    user_judgment: {
      judgment_id: "judgment:codex-draft-needs-revision",
      judgment_summary:
        "The candidate needs revision before any Codex handoff draft is copied.",
      answered_prompt_refs: [
        "Which unresolved tension should block the next handoff?",
      ],
      direction_alignment: "needs_revision",
      selected_unresolved_tension_refs: ["gap:missing-user-judgment"],
      blocking_tension_refs: [],
      preferred_next_action: "prepare_codex_handoff",
      next_action_rationale:
        "Revision should happen before a handoff draft is used.",
    },
  });
}

function buildRejectedUserJudgmentPacket() {
  return buildManualChatGptUserJudgmentCapturePacket({
    briefing_preview: buildNeedsReviewBriefing(),
    user_judgment: {
      judgment_id: "judgment:codex-draft-rejected",
      judgment_summary:
        "The candidate should not become a Codex handoff because the selected tension blocks it.",
      answered_prompt_refs: [
        "Does this candidate match your intended direction?",
      ],
      direction_alignment: "rejects_candidate",
      selected_unresolved_tension_refs: ["gap:missing-user-judgment"],
      blocking_tension_refs: ["gap:missing-user-judgment"],
      preferred_next_action: "none",
    },
  });
}

function buildUnclearUserJudgmentPacket() {
  return buildManualChatGptUserJudgmentCapturePacket({
    briefing_preview: buildReadyBriefing(),
    user_judgment: {
      judgment_summary: "",
      answered_prompt_refs: [
        "Should the next step be to fix input gaps or prepare a Codex handoff?",
      ],
      direction_alignment: "unclear",
      preferred_next_action: "ask_user_pm",
      user_questions: ["Which scope should be handed off to Codex?"],
    },
  });
}

function buildReadyBriefing() {
  const bundle = buildPerspectiveFormationInputBundle({
    scope: "project:augnes",
    work_id: "AG-perspective-codex-next-handoff-draft",
    source_pr_refs: ["pr:hynk-studio/augnes#467"],
    changed_files: [codexDraftBuilderFile, docFile, smokeFile],
    changed_files_summary:
      "Adds a pure local Codex next-handoff draft packet.",
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
    evidence_row_refs: ["evidence:row:codex-draft-smoke"],
    proof_only_action_refs: ["action:proof:codex-draft-closeout"],
    work_event_refs: ["work:event:codex-draft-implemented"],
    session_trace_refs: ["session:trace:codex-draft-codex"],
    existing_perspective_refs: ["perspective:user-judgment:v0.1"],
    generated_at: "2026-06-09T00:00:00.000Z",
  });
  const candidate = buildPerspectiveCandidateFromFormationInputBundle(bundle);

  return buildChatGptPerspectiveCandidateBriefingPreview(candidate);
}

function buildNeedsReviewBriefing() {
  const bundle = buildPerspectiveFormationInputBundle({
    scope: "project:augnes",
    work_id: "AG-perspective-codex-next-handoff-draft-needs-review",
    changed_files_summary:
      "Preserves unresolved tension selection before a Codex handoff draft.",
    tests_checks_run: [
      {
        check_id: "check:smoke",
        command: "npm run smoke:perspective-codex-next-handoff-draft-packet",
        status: "passed",
        result_summary: "Codex next-handoff draft packet smoke passed.",
      },
    ],
    unresolved_gaps: [
      {
        gap_id: "gap:missing-user-judgment",
        summary: "The user has not closed the selected tension.",
      },
    ],
  });
  const candidate = buildPerspectiveCandidateFromFormationInputBundle(bundle);

  return buildChatGptPerspectiveCandidateBriefingPreview(candidate);
}

function assertBuilderSourceIsPureLocal() {
  assertContainsAll(builderText, [
    "buildCodexNextHandoffDraftPacketFromUserJudgment",
    "perspective_codex_next_handoff_draft_packet.v0.1",
    "codex_next_handoff_draft",
    "ready_to_copy",
    "needs_scope",
    "needs_revision_first",
    "github_mutation: false",
    "codex_execution: false",
    "raw_payloads_included: false",
    "Draft only",
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
      `${codexDraftBuilderFile} must remain pure local and avoid ${forbiddenMarker}`,
    );
  }
}

function assertDocsAndReport() {
  assertContainsAll(docText, [
    "pure local Codex next-handoff draft packet after PR #467",
    "non-executing Codex handoff draft",
    "deterministic and pure local",
    "does not implement Codex execution",
    "does not implement ChatGPT Apps integration",
    "GitHub mutation",
    "manual review material, not durable state",
    "next handoff drafting discussion",
    "does not execute Codex",
    "ready_to_copy",
    "needs_scope",
    "needs_revision_first",
    "blocked",
    "none",
    "explicit task goal, expected files, and required checks",
    "not committed state",
    "not proof",
    "not evidence",
    "not readiness",
    "not approval",
    "not merge authority",
    "Dogfooded By",
    "Refine Codex handoff draft copy from dogfood findings",
  ]);
  assertContainsAll(reportText, [
    "Summary",
    "Why This Follows PR #467",
    "Files Changed",
    "Authority Boundary",
    "Validation Plan",
    "What Is Not Implemented",
    "Tests Run",
    "Skipped Checks",
    "Blockers or Risks",
    "Add local Codex handoff draft dogfood report",
  ]);
  assertContainsAll(userJudgmentDocText, [
    "Consumed By",
    "Codex next-handoff draft packet",
    "not handoff by itself",
  ]);
  assertContainsAll(briefingPreviewDocText, [
    "Codex next-handoff draft packet",
  ]);
  assertContainsAll(laneDocText, [
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
      `Perspective Codex next-handoff draft packet changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/api/") &&
        !changedFile.startsWith("components/") &&
        changedFile !== "app/globals.css" &&
        (!changedFile.startsWith("lib/") ||
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
      `Perspective Codex next-handoff draft packet must not change forbidden surfaces: ${changedFile}`,
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
      "Perspective Codex next-handoff draft packet smoke collected no changed files",
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
    "Unable to collect base diff for Perspective Codex next-handoff draft packet smoke",
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
