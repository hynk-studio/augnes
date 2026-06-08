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
const docFile =
  "docs/PERSPECTIVE_USER_JUDGMENT_CAPTURE_PACKET_V0_1.md";
const reportFile =
  "reports/2026-06-08-perspective-user-judgment-capture-packet.md";
const smokeFile =
  "scripts/smoke-perspective-user-judgment-capture-packet.mjs";
const laneDocFile = "docs/PERSPECTIVE_FORMATION_LANE_V0_1.md";
const briefingPreviewDocFile =
  "docs/PERSPECTIVE_CANDIDATE_BRIEFING_PREVIEW_V0_1.md";
const laneSmokeFile = "scripts/smoke-perspective-formation-lane-v0-1.mjs";
const inputBundleSmokeFile =
  "scripts/smoke-perspective-formation-input-bundle-builder.mjs";
const candidateSmokeFile =
  "scripts/smoke-perspective-candidate-builder-fixture.mjs";
const briefingPreviewSmokeFile =
  "scripts/smoke-perspective-candidate-briefing-preview.mjs";

const allowedChangedFiles = new Set([
  packageFile,
  userJudgmentBuilderFile,
  docFile,
  reportFile,
  smokeFile,
  laneDocFile,
  briefingPreviewDocFile,
  laneSmokeFile,
  inputBundleSmokeFile,
  candidateSmokeFile,
  briefingPreviewSmokeFile,
  "scripts/smoke-perspective-agent-brief-read-surface.mjs",
  "scripts/smoke-perspective-temporal-spatial-projection-builders.mjs",
]);

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const builderText = readFileSync(userJudgmentBuilderFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");
const laneDocText = readFileSync(laneDocFile, "utf8");
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

assert.equal(existsSync(inputBundleBuilderFile), true, `${inputBundleBuilderFile} must exist`);
assert.equal(existsSync(candidateBuilderFile), true, `${candidateBuilderFile} must exist`);
assert.equal(existsSync(briefingPreviewBuilderFile), true, `${briefingPreviewBuilderFile} must exist`);
assert.equal(existsSync(userJudgmentBuilderFile), true, `${userJudgmentBuilderFile} must exist`);
assert.equal(existsSync(docFile), true, `${docFile} must exist`);
assert.equal(existsSync(reportFile), true, `${reportFile} must exist`);
assert.equal(existsSync(smokeFile), true, `${smokeFile} must exist`);

assert.equal(
  packageJson.scripts["smoke:perspective-user-judgment-capture-packet"],
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-perspective-user-judgment-capture-packet.mjs",
  "package.json must register smoke:perspective-user-judgment-capture-packet",
);

assertBuilderSourceIsPureLocal();
assertDocsAndReport();
assertMatchesDirectionPrepareHandoff();
assertNeedsRevisionPrepareHandoffStillNeedsRevision();
assertNeedsRevisionFixInputGaps();
assertRejectsCandidateBlockingTension();
assertUnclearAskUserPm();
assertChangedFileBoundary();

console.log("PASS smoke:perspective-user-judgment-capture-packet");

function assertMatchesDirectionPrepareHandoff() {
  const briefing = buildSufficientBriefing();
  const packet = buildManualChatGptUserJudgmentCapturePacket({
    briefing_preview: briefing,
    user_judgment: {
      judgment_id: "judgment:matches-direction",
      judgment_summary:
        "The candidate matches the intended direction and can be discussed as a handoff draft.",
      answered_prompt_refs: [
        "Does this candidate match your intended direction?",
      ],
      direction_alignment: "matches_direction",
      selected_unresolved_tension_refs: [],
      blocking_tension_refs: [],
      preferred_next_action: "prepare_codex_handoff",
      next_action_rationale:
        "The user wants a handoff draft after human review.",
      assumptions: ["No unresolved tension blocks the handoff discussion."],
      generated_at: "2026-06-08T00:00:00.000Z",
    },
  });
  const repeated = buildManualChatGptUserJudgmentCapturePacket({
    briefing_preview: briefing,
    user_judgment: {
      judgment_id: "judgment:matches-direction",
      judgment_summary:
        "The candidate matches the intended direction and can be discussed as a handoff draft.",
      answered_prompt_refs: [
        "Does this candidate match your intended direction?",
      ],
      direction_alignment: "matches_direction",
      selected_unresolved_tension_refs: [],
      blocking_tension_refs: [],
      preferred_next_action: "prepare_codex_handoff",
      next_action_rationale:
        "The user wants a handoff draft after human review.",
      assumptions: ["No unresolved tension blocks the handoff discussion."],
      generated_at: "2026-06-08T00:00:00.000Z",
    },
  });

  assertCommonPacket(briefing, packet);
  assert.equal(packet.packet_id, repeated.packet_id);
  assert.equal(packet.decision_effect.status, "captured_for_review");
  assert.equal(
    packet.next_handoff_discussion.status,
    "ready_to_draft_handoff",
  );
  assert.equal(packet.user_judgment.direction_alignment, "matches_direction");
  assert.equal(
    packet.user_judgment.preferred_next_action,
    "prepare_codex_handoff",
  );
  assert.match(
    packet.user_judgment.judgment_summary,
    /matches the intended direction/,
  );
  assert.deepEqual(packet.user_judgment.answered_prompt_refs, [
    "Does this candidate match your intended direction?",
  ]);
  assertCopyable(packet);
}

function assertNeedsRevisionFixInputGaps() {
  const briefing = buildNeedsReviewBriefing();
  const packet = buildManualChatGptUserJudgmentCapturePacket({
    briefing_preview: briefing,
    user_judgment: {
      judgment_id: "judgment:needs-revision",
      judgment_summary:
        "The direction is close, but the missing user judgment gap should be resolved first.",
      answered_prompt_refs: [
        "Which unresolved tension should block the next handoff?",
      ],
      direction_alignment: "needs_revision",
      selected_unresolved_tension_refs: ["gap:missing-user-judgment"],
      blocking_tension_refs: [],
      preferred_next_action: "fix_input_gaps",
      next_action_rationale:
        "Resolve the selected unresolved tension before drafting handoff text.",
      user_questions: ["What user decision would close the selected gap?"],
    },
  });

  assertCommonPacket(briefing, packet);
  assert.equal(packet.decision_effect.status, "captured_for_review");
  assert.equal(
    packet.next_handoff_discussion.status,
    "needs_revision_first",
  );
  assert.deepEqual(packet.user_judgment.selected_unresolved_tension_refs, [
    "gap:missing-user-judgment",
  ]);
  assert.equal(packet.user_judgment.preferred_next_action, "fix_input_gaps");
  assert(
    packet.user_core_decision_questions.includes(
      "What user decision would close the selected gap?",
    ),
    "user questions must be included in user/Core decision questions",
  );
  assert.equal(
    packet.copyable_capture_text.includes("approved"),
    false,
    "needs_revision capture must not become approval",
  );
}

function assertNeedsRevisionPrepareHandoffStillNeedsRevision() {
  const briefing = buildSufficientBriefing();
  const packet = buildManualChatGptUserJudgmentCapturePacket({
    briefing_preview: briefing,
    user_judgment: {
      judgment_id: "judgment:needs-revision-prepare-handoff",
      judgment_summary:
        "The candidate needs revision before a handoff draft should be prepared.",
      answered_prompt_refs: [
        "Should the next step be to fix input gaps or prepare a Codex handoff?",
      ],
      direction_alignment: "needs_revision",
      selected_unresolved_tension_refs: [],
      blocking_tension_refs: [],
      preferred_next_action: "prepare_codex_handoff",
      next_action_rationale:
        "The user named handoff prep, but revision should happen first.",
    },
  });

  assertCommonPacket(briefing, packet);
  assert.equal(packet.decision_effect.status, "captured_for_review");
  assert.equal(
    packet.next_handoff_discussion.status,
    "needs_revision_first",
  );
  assert(
    packet.next_handoff_discussion.reasons.includes(
      "direction_alignment is needs_revision",
    ),
    "needs_revision must be recorded as the reason handoff drafting waits",
  );
  assert.equal(
    packet.copyable_capture_text.includes("ready_to_draft_handoff"),
    false,
    "needs_revision + prepare_codex_handoff must not imply handoff is ready to draft",
  );
  assert.equal(
    packet.copyable_capture_text.includes("ready to draft"),
    false,
    "needs_revision + prepare_codex_handoff must not imply handoff is ready to draft",
  );
}

function assertRejectsCandidateBlockingTension() {
  const briefing = buildNeedsReviewBriefing();
  const packet = buildManualChatGptUserJudgmentCapturePacket({
    briefing_preview: briefing,
    user_judgment: {
      judgment_id: "judgment:rejects-candidate",
      judgment_summary:
        "The candidate should not proceed because the unresolved gap changes the direction.",
      answered_prompt_refs: [
        "Does this candidate match your intended direction?",
        "Which unresolved tension should block the next handoff?",
      ],
      direction_alignment: "rejects_candidate",
      selected_unresolved_tension_refs: ["gap:missing-user-judgment"],
      blocking_tension_refs: ["gap:missing-user-judgment"],
      preferred_next_action: "none",
      next_action_rationale:
        "No handoff should be drafted until the candidate is reformed.",
    },
  });

  assertCommonPacket(briefing, packet);
  assert.equal(packet.decision_effect.status, "blocked_by_user_judgment");
  assert.equal(packet.next_handoff_discussion.status, "blocked");
  assert.deepEqual(packet.user_judgment.blocking_tension_refs, [
    "gap:missing-user-judgment",
  ]);
  assert(
    packet.decision_effect.reasons.includes(
      "direction_alignment is rejects_candidate",
    ),
  );
  assert(
    packet.decision_effect.reasons.includes("blocking tension refs present"),
  );
}

function assertUnclearAskUserPm() {
  const briefing = buildBlockedBriefing();
  const packet = buildManualChatGptUserJudgmentCapturePacket({
    briefing_preview: briefing,
    user_judgment: {
      judgment_summary: "",
      answered_prompt_refs: [
        "Should the next step be to fix input gaps or prepare a Codex handoff?",
      ],
      direction_alignment: "unclear",
      preferred_next_action: "ask_user_pm",
      user_questions: [
        "Should product direction be clarified before another candidate is formed?",
      ],
    },
  });

  assertCommonPacket(briefing, packet);
  assert.equal(packet.decision_effect.status, "needs_clarification");
  assert(
    packet.decision_effect.reasons.includes("direction_alignment is unclear"),
  );
  assert(
    packet.decision_effect.reasons.includes("judgment_summary is missing"),
  );
  assert(
    packet.decision_effect.reasons.includes(
      "preferred_next_action is ask_user_pm",
    ),
  );
  assert.equal(packet.next_handoff_discussion.status, "blocked");

  const unclearReadyPacket = buildManualChatGptUserJudgmentCapturePacket({
    briefing_preview: buildSufficientBriefing(),
    user_judgment: {
      judgment_summary: "",
      answered_prompt_refs: [
        "Should the next step be to fix input gaps or prepare a Codex handoff?",
      ],
      direction_alignment: "unclear",
      preferred_next_action: "ask_user_pm",
      user_questions: ["Who should clarify the product direction?"],
    },
  });

  assert.equal(unclearReadyPacket.decision_effect.status, "needs_clarification");
  assert.equal(unclearReadyPacket.next_handoff_discussion.status, "none");
}

function assertCommonPacket(briefing, packet) {
  assert.equal(
    packet.packet_version,
    "perspective_user_judgment_capture_packet.v0.1",
  );
  assert.equal(packet.packet_kind, "manual_chatgpt_user_judgment_capture");
  assert.equal(packet.capture_mode, "manual_chatgpt_review");
  assert.equal(packet.manual_review_only, true);
  assert.deepEqual(packet.source_briefing, {
    briefing_id: null,
    briefing_version: briefing.briefing_version,
    briefing_kind: briefing.briefing_kind,
    target_surface: briefing.target_surface,
    candidate_id: briefing.source_candidate.candidate_id,
    candidate_version: briefing.source_candidate.candidate_version,
    candidate_status: briefing.source_candidate.status,
    candidate_authority: briefing.source_candidate.authority,
    basis_quality_status: briefing.briefing_sections.basis_quality.status,
    codex_handoff_readiness_status:
      briefing.codex_handoff_readiness.status,
  });
  assert.equal(packet.privacy.raw_payloads_included, false);
  assert.deepEqual(packet.authority_flags, {
    committed_state: false,
    persistence: false,
    provider_model_api_calls: false,
    proof_evidence_readiness_writes: false,
    codex_execution: false,
    merge_publish_approval: false,
    chatgpt_app_integration: false,
    core_decision: false,
  });
  assert.deepEqual(packet.forbidden_actions, [
    "no commit/reject state",
    "no proof/evidence/readiness writes",
    "no merge/publish/approval",
    "no Codex execution",
    "no provider/model/API calls",
    "no persistence",
    "no ChatGPT Apps integration",
  ]);
  assertNoForbiddenPayloadText("user judgment packet", packet);
}

function assertCopyable(packet) {
  assert.match(packet.copyable_capture_text, new RegExp(escapeRegExp(packet.packet_id)));
  assert.match(
    packet.copyable_capture_text,
    new RegExp(escapeRegExp(packet.source_briefing.candidate_id)),
  );
  assert.match(packet.copyable_capture_text, /Judgment summary:/);
  assert.match(packet.copyable_capture_text, /Direction alignment:/);
  assert.match(packet.copyable_capture_text, /Preferred next action:/);
  assert.match(packet.copyable_capture_text, /Handoff discussion status:/);
  assert.match(packet.copyable_capture_text, /Authority boundary/);
  assert.equal(packet.copyable_capture_text.includes("approval granted"), false);
  assert.equal(packet.copyable_capture_text.includes("merge approved"), false);
  assert.equal(packet.copyable_capture_text.includes("Run Codex"), false);
  assert.equal(packet.copyable_capture_text.includes("execute Codex"), false);
  assertNoForbiddenPayloadText("copyable capture text", packet.copyable_capture_text);
}

function buildSufficientBriefing() {
  const bundle = buildPerspectiveFormationInputBundle({
    scope: "project:augnes",
    work_id: "AG-perspective-user-judgment-capture",
    source_pr_refs: ["pr:hynk-studio/augnes#466"],
    changed_files: [
      userJudgmentBuilderFile,
      docFile,
      smokeFile,
    ],
    changed_files_summary:
      "Adds a pure local manual ChatGPT user judgment capture packet.",
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
    evidence_row_refs: ["evidence:row:user-judgment-capture-smoke"],
    proof_only_action_refs: ["action:proof:user-judgment-capture-closeout"],
    work_event_refs: ["work:event:user-judgment-capture-implemented"],
    session_trace_refs: ["session:trace:user-judgment-capture-codex"],
    existing_perspective_refs: ["perspective:briefing-preview:v0.1"],
    generated_at: "2026-06-08T00:00:00.000Z",
  });
  const candidate = buildPerspectiveCandidateFromFormationInputBundle(bundle);

  return buildChatGptPerspectiveCandidateBriefingPreview(candidate);
}

function buildNeedsReviewBriefing() {
  const bundle = buildPerspectiveFormationInputBundle({
    scope: "project:augnes",
    work_id: "AG-perspective-user-judgment-capture-needs-review",
    changed_files_summary:
      "Captures a manual user judgment packet with unresolved tension selection.",
    tests_checks_run: [
      {
        check_id: "check:smoke",
        command: "npm run smoke:perspective-user-judgment-capture-packet",
        status: "passed",
        result_summary: "User judgment packet smoke passed.",
      },
    ],
    unresolved_gaps: [
      {
        gap_id: "gap:missing-user-judgment",
        summary: "The user has not yet selected which tension blocks handoff.",
      },
    ],
  });
  const candidate = buildPerspectiveCandidateFromFormationInputBundle(bundle);

  return buildChatGptPerspectiveCandidateBriefingPreview(candidate);
}

function buildBlockedBriefing() {
  const bundle = buildPerspectiveFormationInputBundle({
    work_id: "AG-perspective-user-judgment-capture-blocked",
    skipped_checks: [
      {
        check_id: "check:runtime",
        skipped_reason: "local runtime unavailable",
      },
    ],
  });
  const candidate = buildPerspectiveCandidateFromFormationInputBundle(bundle);

  return buildChatGptPerspectiveCandidateBriefingPreview(candidate);
}

function assertBuilderSourceIsPureLocal() {
  assertContainsAll(builderText, [
    "buildManualChatGptUserJudgmentCapturePacket",
    "perspective_user_judgment_capture_packet.v0.1",
    "manual_chatgpt_user_judgment_capture",
    "manual_chatgpt_review",
    "manual_review_only: true",
    "captured_for_review",
    "needs_clarification",
    "blocked_by_user_judgment",
    "ready_to_draft_handoff",
    "needs_revision_first",
    "raw_payloads_included: false",
    "core_decision: false",
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
      `${userJudgmentBuilderFile} must remain pure local and avoid ${forbiddenMarker}`,
    );
  }
}

function assertDocsAndReport() {
  assertContainsAll(docText, [
    "pure local manual ChatGPT user judgment capture packet after PR #466",
    "caller-supplied bounded user judgment",
    "non-committed review material",
    "deterministic and pure local",
    "does not implement ChatGPT Apps integration",
    "does not implement a route, UI, DB, persistence, OAuth, provider calls",
    "manual review material, not durable state",
    "next handoff discussion",
    "does not execute Codex",
    "captured_for_review",
    "needs_clarification",
    "blocked_by_user_judgment",
    "ready_to_draft_handoff",
    "needs_revision_first",
    "blocked",
    "none",
    "not committed state",
    "not proof",
    "not evidence",
    "not readiness",
    "not approval",
    "not merge authority",
    "Add pure local Codex next-handoff draft packet from user judgment",
  ]);
  assertContainsAll(reportText, [
    "Summary",
    "Why This Follows PR #466",
    "Files Changed",
    "Authority Boundary",
    "Validation Plan",
    "What Is Not Implemented",
    "Tests Run",
    "Skipped Checks",
    "Blockers or Risks",
    "Add pure local Codex next-handoff draft packet from user judgment",
  ]);
  assertContainsAll(briefingPreviewDocText, [
    "Consumed By",
    "user judgment capture packet",
    "not judgment capture by itself",
  ]);
  assertContainsAll(laneDocText, [
    "PR E: manual ChatGPT user judgment capture packet",
    "implemented as a pure local user judgment capture packet builder",
    "Add pure local Codex next-handoff draft packet from user judgment",
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
      `Perspective user judgment capture packet changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/api/") &&
        !changedFile.startsWith("components/") &&
        changedFile !== "app/globals.css" &&
        (!changedFile.startsWith("lib/") ||
          changedFile === userJudgmentBuilderFile) &&
        !changedFile.startsWith("db/") &&
        !changedFile.startsWith("migrations/") &&
        !changedFile.startsWith("fixtures/") &&
        !changedFile.startsWith("types/") &&
        !changedFile.includes("provider") &&
        !changedFile.includes("oauth") &&
        !changedFile.includes("codex-sdk") &&
        !changedFile.includes("graph-db") &&
        !changedFile.includes("persistence"),
      `Perspective user judgment capture packet must not change forbidden surfaces: ${changedFile}`,
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
      "Perspective user judgment capture packet smoke collected no changed files",
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
    "Unable to collect base diff for Perspective user judgment capture packet smoke",
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
