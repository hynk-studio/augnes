import type { ManualChatGptUserJudgmentCapturePacketV0 } from "@/lib/perspective-ingest/perspective-user-judgment-capture-packet";

export type PerspectiveCodexNextHandoffDraftPacketVersionV0 =
  "perspective_codex_next_handoff_draft_packet.v0.1";
export type PerspectiveCodexNextHandoffDraftPacketKindV0 =
  "codex_next_handoff_draft";
export type PerspectiveCodexNextHandoffDraftStatusV0 =
  | "ready_to_copy"
  | "needs_scope"
  | "needs_revision_first"
  | "blocked"
  | "none";

export interface BuildCodexNextHandoffDraftPacketFromUserJudgmentInputV0 {
  user_judgment_packet: ManualChatGptUserJudgmentCapturePacketV0;
  handoff_context: {
    draft_id?: string | null;
    task_goal?: string | null;
    target_repo?: string | null;
    base_branch?: string | null;
    working_branch_suggestion?: string | null;
    expected_files?: readonly string[];
    forbidden_files?: readonly string[];
    forbidden_surfaces?: readonly string[];
    required_checks?: readonly string[];
    skipped_check_policy?: string | null;
    implementation_notes?: readonly string[];
    review_notes?: readonly string[];
    user_constraints?: readonly string[];
    generated_at?: string | null;
  };
}

export interface PerspectiveCodexNextHandoffDraftPacketV0 {
  draft_version: PerspectiveCodexNextHandoffDraftPacketVersionV0;
  draft_kind: PerspectiveCodexNextHandoffDraftPacketKindV0;
  draft_id: string;
  draft_status: PerspectiveCodexNextHandoffDraftStatusV0;
  source_user_judgment: {
    packet_id: string;
    packet_version: ManualChatGptUserJudgmentCapturePacketV0["packet_version"];
    capture_mode: ManualChatGptUserJudgmentCapturePacketV0["capture_mode"];
    candidate_id: string;
    direction_alignment: ManualChatGptUserJudgmentCapturePacketV0["user_judgment"]["direction_alignment"];
    decision_effect_status: ManualChatGptUserJudgmentCapturePacketV0["decision_effect"]["status"];
    next_handoff_discussion_status: ManualChatGptUserJudgmentCapturePacketV0["next_handoff_discussion"]["status"];
    preferred_next_action: ManualChatGptUserJudgmentCapturePacketV0["user_judgment"]["preferred_next_action"];
  };
  codex_task: {
    task_goal: string | null;
    target_repo: string | null;
    base_branch: string | null;
    working_branch_suggestion: string | null;
    expected_files: string[];
    forbidden_files: string[];
    forbidden_surfaces: string[];
    required_checks: string[];
    skipped_check_policy: string | null;
    implementation_notes: string[];
    review_notes: string[];
    user_constraints: string[];
    generated_at: string | null;
  };
  readiness: {
    status: PerspectiveCodexNextHandoffDraftStatusV0;
    reasons: string[];
  };
  gaps: {
    missing_task_goal: boolean;
    missing_expected_files: boolean;
    missing_required_checks: boolean;
    blocked_by_user_judgment: boolean;
    needs_revision_first: boolean;
    user_clarification_needed: boolean;
  };
  selected_unresolved_tension_refs: string[];
  blocking_tension_refs: string[];
  user_core_decision_questions: string[];
  forbidden_actions: string[];
  copyable_codex_handoff_text: string;
  privacy: {
    raw_payloads_included: false;
  };
  authority_flags: {
    committed_state: false;
    persistence: false;
    provider_model_api_calls: false;
    proof_evidence_readiness_writes: false;
    codex_execution: false;
    github_mutation: false;
    merge_publish_approval: false;
    chatgpt_app_integration: false;
    core_decision: false;
  };
}

export function buildCodexNextHandoffDraftPacketFromUserJudgment(
  input: BuildCodexNextHandoffDraftPacketFromUserJudgmentInputV0,
): PerspectiveCodexNextHandoffDraftPacketV0 {
  const sourceUserJudgment = buildSourceUserJudgment(
    input.user_judgment_packet,
  );
  const codexTask = buildCodexTask(input.handoff_context);
  const gaps = buildGaps({
    packet: input.user_judgment_packet,
    codexTask,
  });
  const readiness = buildReadiness({
    sourceUserJudgment,
    gaps,
  });
  const draftId = buildDraftId({
    packetId: sourceUserJudgment.packet_id,
    draftId: input.handoff_context.draft_id,
    taskGoal: codexTask.task_goal,
  });
  const authorityFlags = buildAuthorityFlags();

  return {
    draft_version: "perspective_codex_next_handoff_draft_packet.v0.1",
    draft_kind: "codex_next_handoff_draft",
    draft_id: draftId,
    draft_status: readiness.status,
    source_user_judgment: sourceUserJudgment,
    codex_task: codexTask,
    readiness,
    gaps,
    selected_unresolved_tension_refs: [
      ...input.user_judgment_packet.user_judgment
        .selected_unresolved_tension_refs,
    ],
    blocking_tension_refs: [
      ...input.user_judgment_packet.user_judgment.blocking_tension_refs,
    ],
    user_core_decision_questions: [
      ...input.user_judgment_packet.user_core_decision_questions,
    ],
    forbidden_actions: [
      "no commit/reject state",
      "no proof/evidence/readiness writes",
      "no merge/publish/approval",
      "no Codex execution",
      "no provider/model/API calls",
      "no persistence",
      "no ChatGPT Apps integration",
      "no GitHub mutation outside future user-scoped PR workflow",
    ],
    copyable_codex_handoff_text: buildCopyableCodexHandoffText({
      draftId,
      sourceUserJudgment,
      codexTask,
      readiness,
      userCoreDecisionQuestions:
        input.user_judgment_packet.user_core_decision_questions,
    }),
    privacy: {
      raw_payloads_included: false,
    },
    authority_flags: authorityFlags,
  };
}

function buildSourceUserJudgment(
  packet: ManualChatGptUserJudgmentCapturePacketV0,
): PerspectiveCodexNextHandoffDraftPacketV0["source_user_judgment"] {
  return {
    packet_id: packet.packet_id,
    packet_version: packet.packet_version,
    capture_mode: packet.capture_mode,
    candidate_id: packet.source_briefing.candidate_id,
    direction_alignment: packet.user_judgment.direction_alignment,
    decision_effect_status: packet.decision_effect.status,
    next_handoff_discussion_status: packet.next_handoff_discussion.status,
    preferred_next_action: packet.user_judgment.preferred_next_action,
  };
}

function buildCodexTask(
  context: BuildCodexNextHandoffDraftPacketFromUserJudgmentInputV0["handoff_context"],
): PerspectiveCodexNextHandoffDraftPacketV0["codex_task"] {
  return {
    task_goal: normalizeOptionalText(context.task_goal),
    target_repo: normalizeOptionalText(context.target_repo),
    base_branch: normalizeOptionalText(context.base_branch),
    working_branch_suggestion: normalizeOptionalText(
      context.working_branch_suggestion,
    ),
    expected_files: copyTextList(context.expected_files),
    forbidden_files: copyTextList(context.forbidden_files),
    forbidden_surfaces: copyTextList(context.forbidden_surfaces),
    required_checks: copyTextList(context.required_checks),
    skipped_check_policy: normalizeOptionalText(context.skipped_check_policy),
    implementation_notes: copyTextList(context.implementation_notes),
    review_notes: copyTextList(context.review_notes),
    user_constraints: copyTextList(context.user_constraints),
    generated_at: normalizeOptionalText(context.generated_at),
  };
}

function buildGaps({
  packet,
  codexTask,
}: {
  packet: ManualChatGptUserJudgmentCapturePacketV0;
  codexTask: PerspectiveCodexNextHandoffDraftPacketV0["codex_task"];
}): PerspectiveCodexNextHandoffDraftPacketV0["gaps"] {
  return {
    missing_task_goal: !hasText(codexTask.task_goal),
    missing_expected_files: codexTask.expected_files.length === 0,
    missing_required_checks: codexTask.required_checks.length === 0,
    blocked_by_user_judgment:
      packet.decision_effect.status === "blocked_by_user_judgment" ||
      packet.next_handoff_discussion.status === "blocked" ||
      packet.user_judgment.blocking_tension_refs.length > 0,
    needs_revision_first:
      packet.next_handoff_discussion.status === "needs_revision_first" ||
      packet.user_judgment.direction_alignment === "needs_revision" ||
      packet.user_judgment.preferred_next_action === "fix_input_gaps",
    user_clarification_needed:
      packet.next_handoff_discussion.status === "none" ||
      packet.user_judgment.direction_alignment === "unclear" ||
      ["ask_user_pm", "none"].includes(
        packet.user_judgment.preferred_next_action,
      ),
  };
}

function buildReadiness({
  sourceUserJudgment,
  gaps,
}: {
  sourceUserJudgment: PerspectiveCodexNextHandoffDraftPacketV0["source_user_judgment"];
  gaps: PerspectiveCodexNextHandoffDraftPacketV0["gaps"];
}): PerspectiveCodexNextHandoffDraftPacketV0["readiness"] {
  if (gaps.blocked_by_user_judgment) {
    return {
      status: "blocked",
      reasons: ["user judgment or blocking tension blocks handoff drafting"],
    };
  }

  if (gaps.needs_revision_first) {
    return {
      status: "needs_revision_first",
      reasons: ["user judgment requires revision before handoff drafting"],
    };
  }

  if (gaps.user_clarification_needed) {
    return {
      status: "none",
      reasons: ["user judgment requests clarification or no handoff draft"],
    };
  }

  if (
    sourceUserJudgment.next_handoff_discussion_status ===
      "ready_to_draft_handoff" &&
    (gaps.missing_task_goal ||
      gaps.missing_expected_files ||
      gaps.missing_required_checks)
  ) {
    return {
      status: "needs_scope",
      reasons: buildNeedsScopeReasons(gaps),
    };
  }

  if (
    sourceUserJudgment.next_handoff_discussion_status ===
      "ready_to_draft_handoff" &&
    sourceUserJudgment.decision_effect_status === "captured_for_review" &&
    sourceUserJudgment.direction_alignment === "matches_direction" &&
    sourceUserJudgment.preferred_next_action === "prepare_codex_handoff" &&
    !gaps.missing_task_goal &&
    !gaps.missing_expected_files &&
    !gaps.missing_required_checks
  ) {
    return {
      status: "ready_to_copy",
      reasons: [
        "user judgment is ready_to_draft_handoff",
        "direction_alignment is matches_direction",
        "task goal, expected files, and required checks are explicit",
      ],
    };
  }

  return {
    status: "none",
    reasons: ["source user judgment is not ready for handoff drafting"],
  };
}

function buildNeedsScopeReasons(
  gaps: PerspectiveCodexNextHandoffDraftPacketV0["gaps"],
): string[] {
  const reasons: string[] = [];

  if (gaps.missing_task_goal) {
    reasons.push("task_goal is missing");
  }

  if (gaps.missing_expected_files) {
    reasons.push("expected_files are missing");
  }

  if (gaps.missing_required_checks) {
    reasons.push("required_checks are missing");
  }

  return reasons;
}

function buildCopyableCodexHandoffText({
  draftId,
  sourceUserJudgment,
  codexTask,
  readiness,
  userCoreDecisionQuestions,
}: {
  draftId: string;
  sourceUserJudgment: PerspectiveCodexNextHandoffDraftPacketV0["source_user_judgment"];
  codexTask: PerspectiveCodexNextHandoffDraftPacketV0["codex_task"];
  readiness: PerspectiveCodexNextHandoffDraftPacketV0["readiness"];
  userCoreDecisionQuestions: readonly string[];
}): string {
  return [
    "# Codex Next-Handoff Draft Packet",
    "",
    "This is draft only. It does not execute Codex or start background work.",
    "Codex may code, test, and open a PR only when the user explicitly starts a Codex task with this draft.",
    "PR-centered workflow: Codex codes/tests/opens PR, ChatGPT reviews, and the user decides merge.",
    "",
    `Draft id: ${draftId}`,
    `Draft status: ${readiness.status}`,
    `Source judgment packet id: ${sourceUserJudgment.packet_id}`,
    `Source candidate id: ${sourceUserJudgment.candidate_id}`,
    "",
    "## Task Goal",
    codexTask.task_goal ?? "None",
    "",
    "## Repo and Branch",
    `Target repo: ${codexTask.target_repo ?? "None"}`,
    `Base branch: ${codexTask.base_branch ?? "None"}`,
    `Working branch suggestion: ${
      codexTask.working_branch_suggestion ?? "None"
    }`,
    "",
    "## Expected Files",
    ...formatListOrNone(codexTask.expected_files),
    "",
    "## Forbidden Files",
    ...formatListOrNone(codexTask.forbidden_files),
    "",
    "## Forbidden Surfaces",
    ...formatListOrNone(codexTask.forbidden_surfaces),
    "",
    "## Required Checks",
    ...formatListOrNone(codexTask.required_checks),
    "",
    "## Skipped-Check Policy",
    codexTask.skipped_check_policy ?? "None",
    "",
    "## User Constraints",
    ...formatListOrNone(codexTask.user_constraints),
    "",
    "## Implementation Notes",
    ...formatListOrNone(codexTask.implementation_notes),
    "",
    "## Review Notes",
    ...formatListOrNone(codexTask.review_notes),
    "",
    "## User/Core Decision Questions",
    ...formatListOrNone(userCoreDecisionQuestions),
    "",
    "## Authority Boundary",
    "Draft only. This is not committed state, proof, evidence, readiness, approval, merge authority, GitHub mutation, a Core decision, ChatGPT Apps integration, or Codex execution.",
  ].join("\n");
}

function buildDraftId({
  packetId,
  draftId,
  taskGoal,
}: {
  packetId: string;
  draftId: string | null | undefined;
  taskGoal: string | null;
}): string {
  const draftAnchor =
    normalizeOptionalText(draftId) ?? taskGoal ?? "missing_task_goal";
  const anchor = `${packetId}|${draftAnchor}`;

  return `perspective-codex-next-handoff-draft:v0.1:${slugify(anchor)}:${stableHash(anchor)}`;
}

function buildAuthorityFlags(): PerspectiveCodexNextHandoffDraftPacketV0["authority_flags"] {
  return {
    committed_state: false,
    persistence: false,
    provider_model_api_calls: false,
    proof_evidence_readiness_writes: false,
    codex_execution: false,
    github_mutation: false,
    merge_publish_approval: false,
    chatgpt_app_integration: false,
    core_decision: false,
  };
}

function copyTextList(values: readonly string[] | undefined): string[] {
  return values ? uniqueTextList(values) : [];
}

function uniqueTextList(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const uniqueValues: string[] = [];

  for (const value of values) {
    const normalized = normalizeOptionalText(value);

    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      uniqueValues.push(normalized);
    }
  }

  return uniqueValues;
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function formatListOrNone(values: readonly string[]): string[] {
  if (values.length === 0) return ["- None"];
  return values.map((value) => `- ${value}`);
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "missing-anchor"
  );
}

function stableHash(value: string): string {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash.toString(36);
}

function hasText(value: string | null | undefined): boolean {
  return Boolean(value && value.trim());
}
