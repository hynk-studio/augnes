import type { ChatGptPerspectiveCandidateBriefingPreviewV0 } from "@/lib/perspective-ingest/perspective-candidate-briefing-preview";

export type ManualChatGptUserJudgmentCapturePacketVersionV0 =
  "perspective_user_judgment_capture_packet.v0.1";
export type ManualChatGptUserJudgmentCapturePacketKindV0 =
  "manual_chatgpt_user_judgment_capture";
export type ManualChatGptUserJudgmentCaptureModeV0 =
  "manual_chatgpt_review";
export type ManualChatGptUserJudgmentDirectionAlignmentV0 =
  | "matches_direction"
  | "needs_revision"
  | "rejects_candidate"
  | "unclear";
export type ManualChatGptUserJudgmentPreferredNextActionV0 =
  | "review_candidate"
  | "fix_input_gaps"
  | "prepare_codex_handoff"
  | "ask_user_pm"
  | "none";
export type ManualChatGptUserJudgmentDecisionEffectStatusV0 =
  | "captured_for_review"
  | "needs_clarification"
  | "blocked_by_user_judgment";
export type ManualChatGptUserJudgmentNextHandoffStatusV0 =
  | "ready_to_draft_handoff"
  | "needs_revision_first"
  | "blocked"
  | "none";

export interface BuildManualChatGptUserJudgmentCapturePacketInputV0 {
  briefing_preview: ChatGptPerspectiveCandidateBriefingPreviewV0;
  user_judgment: {
    judgment_id?: string | null;
    judgment_summary?: string | null;
    answered_prompt_refs?: readonly string[];
    direction_alignment: ManualChatGptUserJudgmentDirectionAlignmentV0;
    selected_unresolved_tension_refs?: readonly string[];
    blocking_tension_refs?: readonly string[];
    preferred_next_action?: ManualChatGptUserJudgmentPreferredNextActionV0;
    next_action_rationale?: string | null;
    user_questions?: readonly string[];
    assumptions?: readonly string[];
    generated_at?: string | null;
  };
}

export interface ManualChatGptUserJudgmentCapturePacketV0 {
  packet_version: ManualChatGptUserJudgmentCapturePacketVersionV0;
  packet_kind: ManualChatGptUserJudgmentCapturePacketKindV0;
  packet_id: string;
  capture_mode: ManualChatGptUserJudgmentCaptureModeV0;
  manual_review_only: true;
  source_briefing: {
    briefing_id: string | null;
    briefing_version: ChatGptPerspectiveCandidateBriefingPreviewV0["briefing_version"];
    briefing_kind: ChatGptPerspectiveCandidateBriefingPreviewV0["briefing_kind"];
    target_surface: ChatGptPerspectiveCandidateBriefingPreviewV0["target_surface"];
    candidate_id: string;
    candidate_version: ChatGptPerspectiveCandidateBriefingPreviewV0["source_candidate"]["candidate_version"];
    candidate_status: ChatGptPerspectiveCandidateBriefingPreviewV0["source_candidate"]["status"];
    candidate_authority: ChatGptPerspectiveCandidateBriefingPreviewV0["source_candidate"]["authority"];
    basis_quality_status: ChatGptPerspectiveCandidateBriefingPreviewV0["briefing_sections"]["basis_quality"]["status"];
    codex_handoff_readiness_status: ChatGptPerspectiveCandidateBriefingPreviewV0["codex_handoff_readiness"]["status"];
  };
  user_judgment: {
    judgment_id: string | null;
    judgment_summary: string | null;
    direction_alignment: ManualChatGptUserJudgmentDirectionAlignmentV0;
    answered_prompt_refs: string[];
    selected_unresolved_tension_refs: string[];
    blocking_tension_refs: string[];
    preferred_next_action: ManualChatGptUserJudgmentPreferredNextActionV0;
    next_action_rationale: string | null;
    user_questions: string[];
    assumptions: string[];
    generated_at: string | null;
  };
  decision_effect: {
    status: ManualChatGptUserJudgmentDecisionEffectStatusV0;
    reasons: string[];
  };
  next_handoff_discussion: {
    status: ManualChatGptUserJudgmentNextHandoffStatusV0;
    reasons: string[];
  };
  user_core_decision_questions: string[];
  forbidden_actions: string[];
  copyable_capture_text: string;
  privacy: {
    raw_payloads_included: false;
  };
  authority_flags: {
    committed_state: false;
    persistence: false;
    provider_model_api_calls: false;
    proof_evidence_readiness_writes: false;
    codex_execution: false;
    merge_publish_approval: false;
    chatgpt_app_integration: false;
    core_decision: false;
  };
}

export function buildManualChatGptUserJudgmentCapturePacket(
  input: BuildManualChatGptUserJudgmentCapturePacketInputV0,
): ManualChatGptUserJudgmentCapturePacketV0 {
  const userJudgment = buildUserJudgment(input.user_judgment);
  const sourceBriefing = buildSourceBriefing(input.briefing_preview);
  const decisionEffect = buildDecisionEffect(userJudgment);
  const nextHandoffDiscussion = buildNextHandoffDiscussion({
    briefing: input.briefing_preview,
    userJudgment,
    decisionEffect,
  });
  const userCoreDecisionQuestions = buildUserCoreDecisionQuestions({
    sourceQuestions: input.briefing_preview.user_core_decision_questions,
    userQuestions: userJudgment.user_questions,
  });
  const authorityFlags = buildAuthorityFlags();
  const packetId = buildPacketId({
    candidateId: sourceBriefing.candidate_id,
    judgmentId: userJudgment.judgment_id,
    judgmentSummary: userJudgment.judgment_summary,
  });

  return {
    packet_version: "perspective_user_judgment_capture_packet.v0.1",
    packet_kind: "manual_chatgpt_user_judgment_capture",
    packet_id: packetId,
    capture_mode: "manual_chatgpt_review",
    manual_review_only: true,
    source_briefing: sourceBriefing,
    user_judgment: userJudgment,
    decision_effect: decisionEffect,
    next_handoff_discussion: nextHandoffDiscussion,
    user_core_decision_questions: userCoreDecisionQuestions,
    forbidden_actions: [
      "no commit/reject state",
      "no proof/evidence/readiness writes",
      "no merge/publish/approval",
      "no Codex execution",
      "no provider/model/API calls",
      "no persistence",
      "no ChatGPT Apps integration",
    ],
    copyable_capture_text: buildCopyableCaptureText({
      packetId,
      sourceBriefing,
      userJudgment,
      decisionEffect,
      nextHandoffDiscussion,
      userCoreDecisionQuestions,
    }),
    privacy: {
      raw_payloads_included: false,
    },
    authority_flags: authorityFlags,
  };
}

function buildSourceBriefing(
  briefing: ChatGptPerspectiveCandidateBriefingPreviewV0,
): ManualChatGptUserJudgmentCapturePacketV0["source_briefing"] {
  return {
    briefing_id: getOptionalBriefingId(briefing),
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
  };
}

function buildUserJudgment(
  judgment: BuildManualChatGptUserJudgmentCapturePacketInputV0["user_judgment"],
): ManualChatGptUserJudgmentCapturePacketV0["user_judgment"] {
  return {
    judgment_id: normalizeOptionalText(judgment.judgment_id),
    judgment_summary: normalizeOptionalText(judgment.judgment_summary),
    direction_alignment: judgment.direction_alignment,
    answered_prompt_refs: copyTextList(judgment.answered_prompt_refs),
    selected_unresolved_tension_refs: copyTextList(
      judgment.selected_unresolved_tension_refs,
    ),
    blocking_tension_refs: copyTextList(judgment.blocking_tension_refs),
    preferred_next_action: judgment.preferred_next_action ?? "none",
    next_action_rationale: normalizeOptionalText(
      judgment.next_action_rationale,
    ),
    user_questions: copyTextList(judgment.user_questions),
    assumptions: copyTextList(judgment.assumptions),
    generated_at: normalizeOptionalText(judgment.generated_at),
  };
}

function buildDecisionEffect(
  judgment: ManualChatGptUserJudgmentCapturePacketV0["user_judgment"],
): ManualChatGptUserJudgmentCapturePacketV0["decision_effect"] {
  const reasons: string[] = [];

  if (judgment.direction_alignment === "rejects_candidate") {
    reasons.push("direction_alignment is rejects_candidate");
  }

  if (judgment.blocking_tension_refs.length > 0) {
    reasons.push("blocking tension refs present");
  }

  if (reasons.length > 0) {
    return {
      status: "blocked_by_user_judgment",
      reasons,
    };
  }

  if (judgment.direction_alignment === "unclear") {
    reasons.push("direction_alignment is unclear");
  }

  if (!hasText(judgment.judgment_summary)) {
    reasons.push("judgment_summary is missing");
  }

  if (judgment.preferred_next_action === "ask_user_pm") {
    reasons.push("preferred_next_action is ask_user_pm");
  }

  if (
    judgment.user_questions.length > 0 &&
    judgment.preferred_next_action === "none"
  ) {
    reasons.push("user questions present without a clear next action");
  }

  if (reasons.length > 0) {
    return {
      status: "needs_clarification",
      reasons,
    };
  }

  return {
    status: "captured_for_review",
    reasons: [
      `direction_alignment is ${judgment.direction_alignment}`,
      "judgment_summary is present",
      "no blocking tension refs present",
    ],
  };
}

function buildNextHandoffDiscussion({
  briefing,
  userJudgment,
  decisionEffect,
}: {
  briefing: ChatGptPerspectiveCandidateBriefingPreviewV0;
  userJudgment: ManualChatGptUserJudgmentCapturePacketV0["user_judgment"];
  decisionEffect: ManualChatGptUserJudgmentCapturePacketV0["decision_effect"];
}): ManualChatGptUserJudgmentCapturePacketV0["next_handoff_discussion"] {
  if (
    decisionEffect.status === "blocked_by_user_judgment" ||
    briefing.codex_handoff_readiness.status === "blocked"
  ) {
    return {
      status: "blocked",
      reasons: buildBlockedHandoffReasons({
        briefing,
        decisionEffect,
      }),
    };
  }

  if (
    userJudgment.preferred_next_action === "fix_input_gaps" ||
    userJudgment.direction_alignment === "needs_revision" ||
    briefing.codex_handoff_readiness.status === "review_required"
  ) {
    return {
      status: "needs_revision_first",
      reasons: buildNeedsRevisionReasons({ briefing, userJudgment }),
    };
  }

  if (
    userJudgment.preferred_next_action === "none" ||
    userJudgment.preferred_next_action === "ask_user_pm" ||
    userJudgment.direction_alignment === "unclear"
  ) {
    return {
      status: "none",
      reasons: [
        `preferred_next_action is ${userJudgment.preferred_next_action}`,
        `direction_alignment is ${userJudgment.direction_alignment}`,
      ],
    };
  }

  if (
    userJudgment.direction_alignment === "matches_direction" &&
    briefing.codex_handoff_readiness.status === "ready_to_discuss_handoff" &&
    userJudgment.preferred_next_action === "prepare_codex_handoff" &&
    decisionEffect.status === "captured_for_review"
  ) {
    return {
      status: "ready_to_draft_handoff",
      reasons: [
        "direction_alignment is matches_direction",
        "briefing is ready_to_discuss_handoff",
        "preferred_next_action is prepare_codex_handoff",
        "decision_effect is captured_for_review",
      ],
    };
  }

  return {
    status: "none",
    reasons: ["no handoff drafting preference was captured"],
  };
}

function buildBlockedHandoffReasons({
  briefing,
  decisionEffect,
}: {
  briefing: ChatGptPerspectiveCandidateBriefingPreviewV0;
  decisionEffect: ManualChatGptUserJudgmentCapturePacketV0["decision_effect"];
}): string[] {
  const reasons: string[] = [];

  if (decisionEffect.status === "blocked_by_user_judgment") {
    reasons.push("decision_effect is blocked_by_user_judgment");
  }

  if (briefing.codex_handoff_readiness.status === "blocked") {
    reasons.push("briefing codex_handoff_readiness is blocked");
  }

  return reasons;
}

function buildNeedsRevisionReasons({
  briefing,
  userJudgment,
}: {
  briefing: ChatGptPerspectiveCandidateBriefingPreviewV0;
  userJudgment: ManualChatGptUserJudgmentCapturePacketV0["user_judgment"];
}): string[] {
  const reasons: string[] = [];

  if (userJudgment.preferred_next_action === "fix_input_gaps") {
    reasons.push("preferred_next_action is fix_input_gaps");
  }

  if (userJudgment.direction_alignment === "needs_revision") {
    reasons.push("direction_alignment is needs_revision");
  }

  if (briefing.codex_handoff_readiness.status === "review_required") {
    reasons.push("briefing codex_handoff_readiness is review_required");
  }

  return reasons;
}

function buildUserCoreDecisionQuestions({
  sourceQuestions,
  userQuestions,
}: {
  sourceQuestions: readonly string[];
  userQuestions: readonly string[];
}): string[] {
  return uniqueTextList([...sourceQuestions, ...userQuestions]);
}

function buildCopyableCaptureText({
  packetId,
  sourceBriefing,
  userJudgment,
  decisionEffect,
  nextHandoffDiscussion,
  userCoreDecisionQuestions,
}: {
  packetId: string;
  sourceBriefing: ManualChatGptUserJudgmentCapturePacketV0["source_briefing"];
  userJudgment: ManualChatGptUserJudgmentCapturePacketV0["user_judgment"];
  decisionEffect: ManualChatGptUserJudgmentCapturePacketV0["decision_effect"];
  nextHandoffDiscussion: ManualChatGptUserJudgmentCapturePacketV0["next_handoff_discussion"];
  userCoreDecisionQuestions: readonly string[];
}): string {
  return [
    "# Manual ChatGPT User Judgment Capture Packet",
    "",
    `Packet id: ${packetId}`,
    `Source candidate id: ${sourceBriefing.candidate_id}`,
    `Source candidate version: ${sourceBriefing.candidate_version}`,
    `Source candidate status: ${sourceBriefing.candidate_status}`,
    `Source candidate authority: ${sourceBriefing.candidate_authority}`,
    "",
    "## User judgment",
    `Judgment summary: ${userJudgment.judgment_summary ?? "None"}`,
    `Direction alignment: ${userJudgment.direction_alignment}`,
    `Preferred next action: ${userJudgment.preferred_next_action}`,
    `Next action rationale: ${userJudgment.next_action_rationale ?? "None"}`,
    "",
    "## Answered prompt refs",
    ...formatListOrNone(userJudgment.answered_prompt_refs),
    "",
    "## Selected unresolved tension refs",
    ...formatListOrNone(userJudgment.selected_unresolved_tension_refs),
    "",
    "## Blocking tension refs",
    ...formatListOrNone(userJudgment.blocking_tension_refs),
    "",
    "## Decision effect",
    `Status: ${decisionEffect.status}`,
    ...formatListOrNone(decisionEffect.reasons),
    "",
    "## Next handoff discussion",
    `Handoff discussion status: ${nextHandoffDiscussion.status}`,
    ...formatListOrNone(nextHandoffDiscussion.reasons),
    "",
    "## User/Core decision questions",
    ...formatListOrNone(userCoreDecisionQuestions),
    "",
    "## Assumptions",
    ...formatListOrNone(userJudgment.assumptions),
    "",
    "## Authority boundary",
    "Manual review material only. This is not committed state, proof, evidence, readiness, approval, merge authority, a Core decision, ChatGPT Apps integration, or a Codex execution command.",
  ].join("\n");
}

function buildPacketId({
  candidateId,
  judgmentId,
  judgmentSummary,
}: {
  candidateId: string;
  judgmentId: string | null;
  judgmentSummary: string | null;
}): string {
  const judgmentAnchor =
    judgmentId ?? judgmentSummary ?? "missing_judgment_summary";
  const anchor = `${candidateId}|${judgmentAnchor}`;

  return `perspective-user-judgment-capture:v0.1:${slugify(anchor)}:${stableHash(anchor)}`;
}

function buildAuthorityFlags(): ManualChatGptUserJudgmentCapturePacketV0["authority_flags"] {
  return {
    committed_state: false,
    persistence: false,
    provider_model_api_calls: false,
    proof_evidence_readiness_writes: false,
    codex_execution: false,
    merge_publish_approval: false,
    chatgpt_app_integration: false,
    core_decision: false,
  };
}

function getOptionalBriefingId(
  briefing: ChatGptPerspectiveCandidateBriefingPreviewV0,
): string | null {
  const value = (briefing as { briefing_id?: unknown }).briefing_id;
  return typeof value === "string" ? normalizeOptionalText(value) : null;
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
