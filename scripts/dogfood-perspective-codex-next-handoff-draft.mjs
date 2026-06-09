import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";

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

export const PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_DOGFOOD_GENERATED_AT =
  "2026-06-09T00:00:00.000Z";
export const PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_DOGFOOD_ARTIFACT_PATH =
  "reports/dogfood/2026-06-09-perspective-codex-next-handoff-draft-packet.md";
export const PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_DOGFOOD_NEXT_PR =
  "Prepare manual usage note for Codex handoff drafts";

const dogfoodExpectedFiles = [
  "scripts/dogfood-perspective-codex-next-handoff-draft.mjs",
  "scripts/smoke-perspective-codex-next-handoff-draft-dogfood.mjs",
  "docs/PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_DOGFOOD_V0_1.md",
  "reports/2026-06-09-perspective-codex-next-handoff-draft-dogfood.md",
  "reports/dogfood/2026-06-09-perspective-codex-next-handoff-draft-packet.md",
  "package.json",
  "docs/PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_PACKET_V0_1.md",
  "docs/PERSPECTIVE_FORMATION_LANE_V0_1.md",
  "docs/PERSPECTIVE_USER_JUDGMENT_CAPTURE_PACKET_V0_1.md",
  "scripts/smoke-perspective-codex-next-handoff-draft-packet.mjs",
  "scripts/smoke-perspective-user-judgment-capture-packet.mjs",
  "scripts/smoke-perspective-candidate-briefing-preview.mjs",
  "scripts/smoke-perspective-candidate-builder-fixture.mjs",
  "scripts/smoke-perspective-formation-input-bundle-builder.mjs",
  "scripts/smoke-perspective-formation-lane-v0-1.mjs",
  "scripts/smoke-perspective-agent-brief-read-surface.mjs",
  "scripts/smoke-perspective-temporal-spatial-projection-builders.mjs",
];

const dogfoodRequiredChecks = [
  "npm run typecheck",
  "npm run dogfood:perspective-codex-next-handoff-draft",
  "npm run smoke:perspective-codex-next-handoff-draft-dogfood",
  "npm run smoke:perspective-codex-next-handoff-draft-packet",
  "git diff --check",
];

export function buildPerspectiveCodexNextHandoffDraftDogfood() {
  const readyChain = buildReadyToCopyChain();
  const contrastCases = [
    buildNeedsScopeCase(readyChain.user_judgment_capture_packet),
    buildNeedsRevisionFirstCase(),
    buildBlockedCase(),
    buildNoneCase(),
  ];
  const evaluation = evaluateDogfood({
    contrastCases,
    readyChain,
  });
  const artifact = renderDogfoodArtifact({
    contrastCases,
    evaluation,
    readyChain,
  });

  return {
    artifact,
    contrastCases,
    evaluation,
    paths: {
      artifact:
        PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_DOGFOOD_ARTIFACT_PATH,
    },
    readyChain,
  };
}

export function runPerspectiveCodexNextHandoffDraftDogfood() {
  const dogfood = buildPerspectiveCodexNextHandoffDraftDogfood();
  writeReportFile(dogfood.paths.artifact, dogfood.artifact);
  console.log(`wrote ${dogfood.paths.artifact}`);
  return dogfood;
}

function buildReadyToCopyChain() {
  const formation_input_bundle = buildPerspectiveFormationInputBundle({
    scope: "project:augnes",
    work_id: "AG-perspective-codex-next-handoff-draft-dogfood",
    source_pr_refs: ["pr:hynk-studio/augnes#468"],
    changed_files: dogfoodExpectedFiles,
    changed_files_summary:
      "dogfood the pure local Codex next-handoff draft packet and report whether the copyable handoff text is usable.",
    tests_checks_run: [
      {
        check_id: "check:typecheck",
        command: "npm run typecheck",
        status: "passed",
        result_summary: "TypeScript validation is expected for this local dogfood slice.",
      },
      {
        check_id: "check:dogfood",
        command: "npm run dogfood:perspective-codex-next-handoff-draft",
        status: "passed",
        result_summary: "The deterministic dogfood artifact is generated locally.",
      },
    ],
    skipped_checks: [
      {
        check_id: "check:browser",
        skipped_reason:
          "Browser validation is not part of this local dogfood/report slice because no UI or route changes are made.",
        result_summary: "No browser-facing behavior changes.",
      },
    ],
    evidence_row_refs: ["evidence:pointer:dogfood-ready-copy"],
    proof_only_action_refs: ["proof:pointer:dogfood-closeout"],
    work_event_refs: ["work:event:dogfood-local-only"],
    session_trace_refs: ["session:trace:dogfood-local-loop"],
    existing_perspective_refs: [
      "perspective:formation-lane:v0.1",
      "perspective:codex-next-handoff-draft-packet:v0.1",
    ],
    authority_boundaries: [
      "dogfood output is not execution authority",
      "no GitHub mutation",
      "no approval or merge authority",
    ],
    source_privacy_redaction_notes: [
      "Sample data is bounded public-safe summary material.",
    ],
    generated_at:
      PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_DOGFOOD_GENERATED_AT,
  });
  const perspective_candidate =
    buildPerspectiveCandidateFromFormationInputBundle(formation_input_bundle);
  const chatgpt_briefing_preview =
    buildChatGptPerspectiveCandidateBriefingPreview(perspective_candidate);
  const user_judgment_capture_packet =
    buildManualChatGptUserJudgmentCapturePacket({
      briefing_preview: chatgpt_briefing_preview,
      user_judgment: {
        judgment_id: "judgment:dogfood-ready-copy",
        judgment_summary:
          "The draft packet matches the intended direction and should be prepared as copyable Codex handoff material for a future user-started task.",
        answered_prompt_refs: [
          "Does this candidate match your intended direction?",
          "Should the next step be to fix input gaps or prepare a Codex handoff?",
        ],
        direction_alignment: "matches_direction",
        selected_unresolved_tension_refs: [],
        blocking_tension_refs: [],
        preferred_next_action: "prepare_codex_handoff",
        next_action_rationale:
          "The full chain is sufficiently scoped for dogfood review, and the next step is to evaluate whether the handoff text is usable.",
        assumptions: [
          "The user will explicitly start any later Codex task.",
          "This dogfood packet is local review material only.",
        ],
        generated_at:
          PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_DOGFOOD_GENERATED_AT,
      },
    });
  const codex_next_handoff_draft_packet =
    buildCodexNextHandoffDraftPacketFromUserJudgment({
      user_judgment_packet: user_judgment_capture_packet,
      handoff_context: {
        draft_id: "draft:dogfood-ready-copy",
        task_goal:
          "Add local Codex handoff draft dogfood report for the Perspective manual review loop.",
        target_repo: "hynk-studio/augnes",
        base_branch: "main",
        working_branch_suggestion:
          "codex/perspective-codex-next-handoff-draft-dogfood-v0-1",
        expected_files: dogfoodExpectedFiles,
        forbidden_files: [
          "app/api/**",
          "components/**",
          "db/**",
          "migrations/**",
        ],
        forbidden_surfaces: [
          "runtime routes",
          "product UI",
          "provider/model/API calls",
          "Codex execution",
          "GitHub mutation",
        ],
        required_checks: dogfoodRequiredChecks,
        skipped_check_policy:
          "Report unavailable runtime helpers and absent lint/test scripts with concrete reasons.",
        implementation_notes: [
          "Build deterministic public-safe samples only.",
          "Write a dogfood artifact; do not execute Codex.",
          "Keep contrast cases visibly separate from the ready-to-copy path.",
        ],
        review_notes: [
          "Evaluate whether the copyable handoff text helps a human decide the next Codex task.",
          "Treat ready_to_copy as copyable draft status only.",
        ],
        user_constraints: [
          "No runtime route",
          "No UI or browser-facing behavior",
          "No DB schema or persistence",
          "No provider/model/API calls",
          "No GitHub mutation from the dogfood script",
          "No proof/evidence/readiness writes",
          "No Codex execution",
        ],
        generated_at:
          PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_DOGFOOD_GENERATED_AT,
      },
    });

  return {
    chatgpt_briefing_preview,
    codex_next_handoff_draft_packet,
    formation_input_bundle,
    perspective_candidate,
    user_judgment_capture_packet,
  };
}

function buildNeedsScopeCase(sourcePacket) {
  const draft = buildCodexNextHandoffDraftPacketFromUserJudgment({
    user_judgment_packet: sourcePacket,
    handoff_context: {
      draft_id: "draft:dogfood-needs-scope",
      task_goal:
        "Dogfood the handoff draft, but leave files and checks unspecified.",
      expected_files: [],
      required_checks: [],
      skipped_check_policy:
        "Do not copy until expected files and required checks are explicit.",
      generated_at:
        PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_DOGFOOD_GENERATED_AT,
    },
  });

  return {
    label: "needs_scope",
    user_note:
      "The human can see that scope is incomplete before copying a handoff.",
    draft,
  };
}

function buildNeedsRevisionFirstCase() {
  const readyBriefing = buildReadyToCopyChain().chatgpt_briefing_preview;
  const packet = buildManualChatGptUserJudgmentCapturePacket({
    briefing_preview: readyBriefing,
    user_judgment: {
      judgment_id: "judgment:dogfood-needs-revision",
      judgment_summary:
        "The candidate needs revision because the expected file list should be narrowed before any Codex handoff is copied.",
      answered_prompt_refs: [
        "Which unresolved tension should block the next handoff?",
      ],
      direction_alignment: "needs_revision",
      selected_unresolved_tension_refs: ["tension:expected-files-too-broad"],
      blocking_tension_refs: [],
      preferred_next_action: "prepare_codex_handoff",
      next_action_rationale:
        "Revision should win over prepare_codex_handoff until the file scope is narrowed.",
      assumptions: ["The user wants a smaller scope before handoff drafting."],
      generated_at:
        PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_DOGFOOD_GENERATED_AT,
    },
  });
  const draft = buildCodexNextHandoffDraftPacketFromUserJudgment({
    user_judgment_packet: packet,
    handoff_context: {
      draft_id: "draft:dogfood-needs-revision-first",
      task_goal:
        "Dogfood a revision-first handoff path without copying it as ready.",
      expected_files: dogfoodExpectedFiles,
      required_checks: dogfoodRequiredChecks,
      generated_at:
        PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_DOGFOOD_GENERATED_AT,
    },
  });

  return {
    label: "needs_revision_first",
    packet,
    user_note:
      "User revision reason: expected files should be narrowed before any handoff draft is copied.",
    draft,
  };
}

function buildBlockedCase() {
  const readyBriefing = buildReadyToCopyChain().chatgpt_briefing_preview;
  const packet = buildManualChatGptUserJudgmentCapturePacket({
    briefing_preview: readyBriefing,
    user_judgment: {
      judgment_id: "judgment:dogfood-blocked",
      judgment_summary:
        "The candidate should not be handed off because the selected tension blocks the task.",
      answered_prompt_refs: [
        "Which unresolved tension should block the next handoff?",
      ],
      direction_alignment: "rejects_candidate",
      selected_unresolved_tension_refs: ["tension:wrong-task-goal"],
      blocking_tension_refs: ["tension:wrong-task-goal"],
      preferred_next_action: "none",
      next_action_rationale:
        "The task goal does not match the user's intended direction.",
      generated_at:
        PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_DOGFOOD_GENERATED_AT,
    },
  });
  const draft = buildCodexNextHandoffDraftPacketFromUserJudgment({
    user_judgment_packet: packet,
    handoff_context: {
      draft_id: "draft:dogfood-blocked",
      task_goal:
        "Dogfood a blocked handoff path without copying it as ready.",
      expected_files: dogfoodExpectedFiles,
      required_checks: dogfoodRequiredChecks,
      generated_at:
        PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_DOGFOOD_GENERATED_AT,
    },
  });

  return {
    label: "blocked",
    packet,
    user_note: "Blocking tension: tension:wrong-task-goal.",
    draft,
  };
}

function buildNoneCase() {
  const readyBriefing = buildReadyToCopyChain().chatgpt_briefing_preview;
  const packet = buildManualChatGptUserJudgmentCapturePacket({
    briefing_preview: readyBriefing,
    user_judgment: {
      judgment_id: "judgment:dogfood-none",
      judgment_summary:
        "The user needs another question answered before deciding whether to prepare a handoff.",
      answered_prompt_refs: [
        "Should the next step be to fix input gaps or prepare a Codex handoff?",
      ],
      direction_alignment: "unclear",
      selected_unresolved_tension_refs: ["tension:handoff-scope-question"],
      blocking_tension_refs: [],
      preferred_next_action: "ask_user_pm",
      user_questions: ["Should this dogfood slice include copy refinement?"],
      next_action_rationale:
        "The user wants clarification before any handoff draft is copied.",
      generated_at:
        PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_DOGFOOD_GENERATED_AT,
    },
  });
  const draft = buildCodexNextHandoffDraftPacketFromUserJudgment({
    user_judgment_packet: packet,
    handoff_context: {
      draft_id: "draft:dogfood-none",
      task_goal:
        "Dogfood an unclear handoff path without copying it as ready.",
      expected_files: dogfoodExpectedFiles,
      required_checks: dogfoodRequiredChecks,
      generated_at:
        PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_DOGFOOD_GENERATED_AT,
    },
  });

  return {
    label: "none",
    packet,
    user_note: "Clarification requested before handoff drafting.",
    draft,
  };
}

function evaluateDogfood({ contrastCases, readyChain }) {
  const readyDraft = readyChain.codex_next_handoff_draft_packet;
  const copyableText = readyDraft.copyable_codex_handoff_text;
  const expectedFileScope = readyDraft.expected_file_scope;
  const checks = [
    readyDraft.draft_status === "ready_to_copy",
    readyDraft.source_user_judgment.direction_alignment ===
      "matches_direction",
    readyDraft.source_user_judgment.decision_effect_status ===
      "captured_for_review",
    readyDraft.source_user_judgment.preferred_next_action ===
      "prepare_codex_handoff",
    hasText(readyDraft.codex_task.task_goal),
    readyDraft.codex_task.expected_files.length > 0,
    readyDraft.codex_task.required_checks.length > 0,
    expectedFileScope.total_count === readyDraft.codex_task.expected_files.length,
    expectedFileScope.coverage.all_expected_files_listed,
    expectedFileScope.coverage.omitted_files.length === 0,
    readyDraft.codex_task.forbidden_files.length > 0,
    readyDraft.codex_task.forbidden_surfaces.length > 0,
    hasText(readyDraft.codex_task.skipped_check_policy),
    copyableText.includes(
      "draft prompt for a future user-started Codex task",
    ),
    copyableText.includes("does not execute Codex"),
    copyableText.includes(
      "only when the user explicitly starts a Codex task",
    ),
    copyableText.includes("PR-centered workflow"),
    copyableText.includes("Expected file count"),
    copyableText.includes("grouped for readability"),
    copyableText.includes("full list remains the scope"),
    copyableText.includes("Primary files"),
    copyableText.includes("Smoke/validation"),
    copyableText.includes("Docs/reports"),
    contrastCases.every((entry) => entry.draft.draft_status !== "ready_to_copy"),
  ];
  const judgment = checks.every(Boolean) ? "PASS" : "FAIL";

  return {
    copy_ready_for_human_approved_task: judgment,
    judgment,
    next_recommended_improvement:
      PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_DOGFOOD_NEXT_PR,
    risk_notes: [
      "The largest risk is treating copyable draft text as execution authority.",
      "The contrast cases reduce that risk by making non-ready statuses visible.",
    ],
    should_improve_before_runtime_or_app_integration: [
      "Keep expected-file grouping as display material only if this reaches any future runtime or App surface.",
      "Keep scope gaps, omitted-file checks, and revision blockers visually adjacent to copyable text.",
    ],
    usable_notes: [
      "The copyable text now starts by naming itself as a draft prompt for a future user-started Codex task.",
      "Expected files remain fully scoped in the canonical flat list.",
      "Readability improved by grouping expected files while keeping every file visible.",
      "No expected files were omitted from the grouped display.",
      "The ready path exposes task goal, grouped files, checks, forbidden surfaces, skipped-check policy, and PR workflow.",
      "The copyable text is bounded enough for a future user-started Codex task.",
      "The authority boundary is repeated in both summary fields and the copyable text.",
    ],
    confusing_notes: [
      "The grouping reduces scan cost without reducing scope.",
      "Another real Codex docs-only task can test this only if the next manual usage note still finds ambiguity.",
    ],
  };
}

function renderDogfoodArtifact({ contrastCases, evaluation, readyChain }) {
  const readyDraft = readyChain.codex_next_handoff_draft_packet;

  return [
    "# Perspective Codex Next-Handoff Draft Packet Dogfood",
    "",
    `Fixed generated timestamp: ${PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_DOGFOOD_GENERATED_AT}`,
    "",
    "This is dogfood output, not execution authority. It is draft only and does not execute Codex.",
    "No GitHub mutation. No approval. No merge. No Core decision.",
    "PR-centered workflow: Codex codes/tests/opens PR only after a user explicitly starts a Codex task, ChatGPT reviews, and the user decides merge.",
    "",
    "## Full Chain Summary",
    "",
    "### Formation Input Bundle",
    "",
    `- bundle_version: ${readyChain.formation_input_bundle.bundle_version}`,
    `- bundle_kind: ${readyChain.formation_input_bundle.bundle_kind}`,
    `- generated_at: ${readyChain.formation_input_bundle.generated_at}`,
    `- readiness: ${readyChain.formation_input_bundle.readiness.status}`,
    `- work_id: ${readyChain.formation_input_bundle.work_id}`,
    `- source_pr_refs: ${readyChain.formation_input_bundle.source_pr_refs.join(", ")}`,
    "",
    "### Perspective Candidate",
    "",
    `- candidate_version: ${readyChain.perspective_candidate.candidate_version}`,
    `- candidate_id: ${readyChain.perspective_candidate.candidate_id}`,
    `- basis_quality: ${readyChain.perspective_candidate.basis_quality.status}`,
    `- next_actions: ${readyChain.perspective_candidate.next_action_candidates
      .map((action) => action.action_id)
      .join(", ")}`,
    "",
    "### ChatGPT Briefing Preview",
    "",
    `- briefing_version: ${readyChain.chatgpt_briefing_preview.briefing_version}`,
    `- briefing_kind: ${readyChain.chatgpt_briefing_preview.briefing_kind}`,
    `- target_surface: ${readyChain.chatgpt_briefing_preview.target_surface}`,
    `- codex_handoff_readiness: ${readyChain.chatgpt_briefing_preview.codex_handoff_readiness.status}`,
    "",
    "### User Judgment Capture Packet",
    "",
    `- packet_version: ${readyChain.user_judgment_capture_packet.packet_version}`,
    `- packet_id: ${readyChain.user_judgment_capture_packet.packet_id}`,
    `- decision_effect: ${readyChain.user_judgment_capture_packet.decision_effect.status}`,
    `- next_handoff_discussion: ${readyChain.user_judgment_capture_packet.next_handoff_discussion.status}`,
    "",
    "### Codex Next-Handoff Draft Packet",
    "",
    `- draft_version: ${readyDraft.draft_version}`,
    `- draft_kind: ${readyDraft.draft_kind}`,
    `- draft_id: ${readyDraft.draft_id}`,
    `- draft_status: ${readyDraft.draft_status}`,
    "",
    "## Ready-to-copy Draft",
    "",
    `- draft_id: ${readyDraft.draft_id}`,
    `- draft_status: ${readyDraft.draft_status}`,
    `- source judgment packet id: ${readyDraft.source_user_judgment.packet_id}`,
    `- source candidate id: ${readyDraft.source_user_judgment.candidate_id}`,
    `- task goal: ${readyDraft.codex_task.task_goal}`,
    `- expected file count: ${readyDraft.expected_file_scope.total_count}`,
    "- expected files grouped for readability: true",
    "- full list remains the scope: true",
    `- all expected files listed: ${readyDraft.expected_file_scope.coverage.all_expected_files_listed}`,
    `- no omitted expected files: ${readyDraft.expected_file_scope.coverage.omitted_files.length === 0}`,
    "- expected file groups:",
    ...formatExpectedFileGroups(readyDraft.expected_file_scope.groups),
    "- expected files:",
    ...formatList(readyDraft.codex_task.expected_files),
    "- required checks:",
    ...formatList(readyDraft.codex_task.required_checks),
    "- forbidden files:",
    ...formatList(readyDraft.codex_task.forbidden_files),
    "- forbidden surfaces:",
    ...formatList(readyDraft.codex_task.forbidden_surfaces),
    `- skipped-check policy: ${readyDraft.codex_task.skipped_check_policy}`,
    "",
    "### Copyable Codex Handoff Text",
    "",
    "```text",
    readyDraft.copyable_codex_handoff_text,
    "```",
    "",
    "## Contrast Cases",
    "",
    ...contrastCases.flatMap(renderContrastCase),
    "## Evaluation",
    "",
    `Conclusion: ${evaluation.judgment}`,
    `Whether the draft text is copy-ready for a human-approved Codex task: ${evaluation.copy_ready_for_human_approved_task}`,
    "",
    "### What is usable",
    "",
    ...formatList(evaluation.usable_notes),
    "",
    "### What remains confusing",
    "",
    ...formatList(evaluation.confusing_notes),
    "",
    "### What should be improved before any runtime/App integration",
    "",
    ...formatList(evaluation.should_improve_before_runtime_or_app_integration),
    "",
    "### Risk notes",
    "",
    ...formatList(evaluation.risk_notes),
    "",
    "### Next recommended improvement",
    "",
    `- ${evaluation.next_recommended_improvement}`,
    "",
    "## Authority Boundary",
    "",
    "- draft only",
    "- does not execute Codex",
    "- no GitHub mutation",
    "- no approval",
    "- no merge",
    "- no Core decision",
    "- ChatGPT reviews and user decides merge",
    "",
  ].join("\n");
}

function renderContrastCase(entry) {
  return [
    `### Contrast: ${entry.label}`,
    "",
    `- draft_id: ${entry.draft.draft_id}`,
    `- draft_status: ${entry.draft.draft_status}`,
    `- decision_effect: ${entry.draft.source_user_judgment.decision_effect_status}`,
    `- next_handoff_discussion: ${entry.draft.source_user_judgment.next_handoff_discussion_status}`,
    `- note: ${entry.user_note}`,
    "- reasons:",
    ...formatList(entry.draft.readiness.reasons),
    "- gaps:",
    ...formatGapList(entry.draft.gaps),
    "",
  ];
}

function formatGapList(gaps) {
  return Object.entries(gaps).map(([key, value]) => `${key}: ${value}`);
}

function formatList(values) {
  if (values.length === 0) return ["- None"];
  return values.map((value) => `- ${value}`);
}

function formatExpectedFileGroups(groups) {
  return groups.flatMap((group) => [
    `- ${group.title}: ${group.files.length}`,
    ...group.files.map((file) => `  - ${file}`),
  ]);
}

function writeReportFile(filePath, contents) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, contents);
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runPerspectiveCodexNextHandoffDraftDogfood();
}
