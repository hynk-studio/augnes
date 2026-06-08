import type {
  PerspectiveCandidateBasisQualityStatusV0,
  PerspectiveCandidateEvidencePointerKindV0,
  PerspectiveCandidateEvidencePointerV0,
  PerspectiveCandidateNextActionV0,
  PerspectiveCandidateUnresolvedTensionV0,
  PerspectiveCandidateV0,
} from "@/lib/perspective-ingest/perspective-candidate-builder";

export type ChatGptPerspectiveCandidateBriefingPreviewVersionV0 =
  "perspective_candidate_briefing_preview.v0.1";
export type ChatGptPerspectiveCandidateBriefingPreviewKindV0 =
  "chatgpt_perspective_candidate_briefing_preview";
export type ChatGptPerspectiveCandidateBriefingPreviewTargetSurfaceV0 =
  "chatgpt_review_surface";
export type ChatGptPerspectiveCandidateHandoffReadinessStatusV0 =
  | "ready_to_discuss_handoff"
  | "review_required"
  | "blocked";

export interface ChatGptPerspectiveCandidateEvidenceBasisV0 {
  pointer_count: number;
  pointer_kind_counts: Record<PerspectiveCandidateEvidencePointerKindV0, number>;
  pointer_refs: PerspectiveCandidateEvidencePointerV0[];
}

export interface ChatGptPerspectiveCandidateNextActionPreviewV0
  extends PerspectiveCandidateNextActionV0 {
  advisory_only: true;
  discussion_only: true;
  codex_execution: false;
}

export interface ChatGptPerspectiveCandidateBriefingSectionsV0 {
  thesis: {
    title: "Thesis";
    summary: string;
  };
  basis_quality: {
    title: "Basis Quality";
    status: PerspectiveCandidateBasisQualityStatusV0;
    reasons: string[];
  };
  evidence_basis: {
    title: "Evidence Basis";
    summary: string;
    evidence_basis: ChatGptPerspectiveCandidateEvidenceBasisV0;
  };
  unresolved_tensions: {
    title: "Unresolved Tensions";
    summary: string;
    tensions: PerspectiveCandidateUnresolvedTensionV0[];
  };
  next_action_candidates: {
    title: "Next Action Candidates";
    summary: string;
    actions: ChatGptPerspectiveCandidateNextActionPreviewV0[];
  };
  user_core_decision_questions: {
    title: "User/Core Decision Questions";
    summary: string;
    questions: string[];
  };
  authority_boundary: {
    title: "Authority Boundary";
    summary: string;
    flags: ChatGptPerspectiveCandidateBriefingPreviewV0["authority_flags"];
  };
}

export interface ChatGptPerspectiveCandidateBriefingPreviewV0 {
  briefing_version: ChatGptPerspectiveCandidateBriefingPreviewVersionV0;
  briefing_kind: ChatGptPerspectiveCandidateBriefingPreviewKindV0;
  target_surface: ChatGptPerspectiveCandidateBriefingPreviewTargetSurfaceV0;
  source_candidate: {
    candidate_id: string;
    candidate_version: PerspectiveCandidateV0["candidate_version"];
    status: PerspectiveCandidateV0["status"];
    authority: PerspectiveCandidateV0["authority"];
  };
  headline: string;
  briefing_sections: ChatGptPerspectiveCandidateBriefingSectionsV0;
  evidence_basis: ChatGptPerspectiveCandidateEvidenceBasisV0;
  unresolved_tensions: PerspectiveCandidateUnresolvedTensionV0[];
  next_action_candidates: ChatGptPerspectiveCandidateNextActionPreviewV0[];
  user_core_decision_questions: string[];
  user_reply_prompts: string[];
  codex_handoff_readiness: {
    status: ChatGptPerspectiveCandidateHandoffReadinessStatusV0;
    reasons: string[];
  };
  copyable_briefing_text: string;
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
  };
}

const evidencePointerKinds: PerspectiveCandidateEvidencePointerKindV0[] = [
  "evidence_row_ref",
  "proof_only_action_ref",
  "work_event_ref",
  "session_trace_ref",
  "perspective_ref",
];

export function buildChatGptPerspectiveCandidateBriefingPreview(
  candidate: PerspectiveCandidateV0,
): ChatGptPerspectiveCandidateBriefingPreviewV0 {
  const evidenceBasis = buildEvidenceBasis(candidate.evidence_pointers);
  const unresolvedTensions = copyTensions(candidate.unresolved_tensions);
  const nextActionCandidates = buildNextActionPreviews(
    candidate.next_action_candidates,
  );
  const userCoreDecisionQuestions = [...candidate.user_core_decision_questions];
  const authorityFlags = buildAuthorityFlags();
  const codexHandoffReadiness = buildCodexHandoffReadiness({
    basisStatus: candidate.basis_quality.status,
    basisReasons: candidate.basis_quality.reasons,
    nextActionCandidates,
  });
  const userReplyPrompts = buildUserReplyPrompts();
  const sourceCandidate = {
    candidate_id: candidate.candidate_id,
    candidate_version: candidate.candidate_version,
    status: candidate.status,
    authority: candidate.authority,
  };
  const headline = buildHeadline(candidate);

  return {
    briefing_version: "perspective_candidate_briefing_preview.v0.1",
    briefing_kind: "chatgpt_perspective_candidate_briefing_preview",
    target_surface: "chatgpt_review_surface",
    source_candidate: sourceCandidate,
    headline,
    briefing_sections: {
      thesis: {
        title: "Thesis",
        summary: candidate.thesis,
      },
      basis_quality: {
        title: "Basis Quality",
        status: candidate.basis_quality.status,
        reasons: [...candidate.basis_quality.reasons],
      },
      evidence_basis: {
        title: "Evidence Basis",
        summary: `${evidenceBasis.pointer_count} pointer-only refs are available for review.`,
        evidence_basis: evidenceBasis,
      },
      unresolved_tensions: {
        title: "Unresolved Tensions",
        summary: `${unresolvedTensions.length} unresolved tension(s) remain visible.`,
        tensions: unresolvedTensions,
      },
      next_action_candidates: {
        title: "Next Action Candidates",
        summary: "All next actions are advisory candidates for discussion only.",
        actions: nextActionCandidates,
      },
      user_core_decision_questions: {
        title: "User/Core Decision Questions",
        summary: `${userCoreDecisionQuestions.length} candidate question(s) preserved.`,
        questions: userCoreDecisionQuestions,
      },
      authority_boundary: {
        title: "Authority Boundary",
        summary:
          "This briefing is display text for review, not committed state, proof, evidence, readiness, approval, merge authority, ChatGPT Apps integration, or Codex execution.",
        flags: authorityFlags,
      },
    },
    evidence_basis: evidenceBasis,
    unresolved_tensions: unresolvedTensions,
    next_action_candidates: nextActionCandidates,
    user_core_decision_questions: userCoreDecisionQuestions,
    user_reply_prompts: userReplyPrompts,
    codex_handoff_readiness: codexHandoffReadiness,
    copyable_briefing_text: buildCopyableBriefingText({
      sourceCandidate,
      thesis: candidate.thesis,
      basisStatus: candidate.basis_quality.status,
      basisReasons: candidate.basis_quality.reasons,
      evidenceBasis,
      unresolvedTensions,
      nextActionCandidates,
      userCoreDecisionQuestions,
      userReplyPrompts,
      codexHandoffReadiness,
    }),
    privacy: {
      raw_payloads_included: false,
    },
    authority_flags: authorityFlags,
  };
}

function buildEvidenceBasis(
  pointers: readonly PerspectiveCandidateEvidencePointerV0[],
): ChatGptPerspectiveCandidateEvidenceBasisV0 {
  const pointerRefs = pointers
    .filter((pointer) => hasText(pointer.ref))
    .map((pointer) => ({
      pointer_kind: pointer.pointer_kind,
      pointer_semantics: "pointer_only" as const,
      ref: pointer.ref,
    }));

  return {
    pointer_count: pointerRefs.length,
    pointer_kind_counts: countPointerKinds(pointerRefs),
    pointer_refs: pointerRefs,
  };
}

function countPointerKinds(
  pointers: readonly PerspectiveCandidateEvidencePointerV0[],
): Record<PerspectiveCandidateEvidencePointerKindV0, number> {
  const counts: Record<PerspectiveCandidateEvidencePointerKindV0, number> = {
    evidence_row_ref: 0,
    proof_only_action_ref: 0,
    work_event_ref: 0,
    session_trace_ref: 0,
    perspective_ref: 0,
  };

  for (const pointer of pointers) {
    counts[pointer.pointer_kind] += 1;
  }

  return counts;
}

function copyTensions(
  tensions: readonly PerspectiveCandidateUnresolvedTensionV0[],
): PerspectiveCandidateUnresolvedTensionV0[] {
  return tensions.map((tension) => ({
    tension_kind: tension.tension_kind,
    summary: tension.summary,
    ...(tension.source_ref !== undefined
      ? { source_ref: tension.source_ref }
      : {}),
  }));
}

function buildNextActionPreviews(
  actions: readonly PerspectiveCandidateNextActionV0[],
): ChatGptPerspectiveCandidateNextActionPreviewV0[] {
  return actions.map((action) => ({
    action_id: action.action_id,
    summary:
      action.action_id === "prepare_codex_handoff"
        ? `${action.summary} This remains discussion-only and does not execute Codex.`
        : action.summary,
    advisory_only: true,
    discussion_only: true,
    codex_execution: false,
  }));
}

function buildHeadline(candidate: PerspectiveCandidateV0): string {
  const thesis = shorten(candidate.thesis, 128);

  if (candidate.basis_quality.status === "blocked") {
    return `Formation is blocked by missing or invalid input: ${thesis}`;
  }

  if (candidate.basis_quality.status === "needs_review") {
    return `Review is needed before handoff: ${thesis}`;
  }

  return `Ready for human review, not approved: ${thesis}`;
}

function buildUserReplyPrompts(): string[] {
  return [
    "Does this candidate match your intended direction?",
    "Which unresolved tension should block the next handoff?",
    "Should the next step be to fix input gaps or prepare a Codex handoff?",
  ];
}

function buildCodexHandoffReadiness({
  basisStatus,
  basisReasons,
  nextActionCandidates,
}: {
  basisStatus: PerspectiveCandidateBasisQualityStatusV0;
  basisReasons: readonly string[];
  nextActionCandidates: readonly ChatGptPerspectiveCandidateNextActionPreviewV0[];
}): ChatGptPerspectiveCandidateBriefingPreviewV0["codex_handoff_readiness"] {
  if (basisStatus === "blocked") {
    return {
      status: "blocked",
      reasons: copyReasonsOrDefault(
        basisReasons,
        "candidate basis is blocked",
      ),
    };
  }

  if (basisStatus === "needs_review") {
    return {
      status: "review_required",
      reasons: copyReasonsOrDefault(
        basisReasons,
        "candidate basis needs review before handoff discussion",
      ),
    };
  }

  if (
    nextActionCandidates.some(
      (action) => action.action_id === "prepare_codex_handoff",
    )
  ) {
    return {
      status: "ready_to_discuss_handoff",
      reasons: [
        "candidate basis is sufficient_for_review",
        "prepare_codex_handoff is present as advisory discussion material only",
      ],
    };
  }

  return {
    status: "review_required",
    reasons: [
      "candidate basis is sufficient_for_review, but no prepare_codex_handoff action is present",
    ],
  };
}

function buildCopyableBriefingText({
  sourceCandidate,
  thesis,
  basisStatus,
  basisReasons,
  evidenceBasis,
  unresolvedTensions,
  nextActionCandidates,
  userCoreDecisionQuestions,
  userReplyPrompts,
  codexHandoffReadiness,
}: {
  sourceCandidate: ChatGptPerspectiveCandidateBriefingPreviewV0["source_candidate"];
  thesis: string;
  basisStatus: PerspectiveCandidateBasisQualityStatusV0;
  basisReasons: readonly string[];
  evidenceBasis: ChatGptPerspectiveCandidateEvidenceBasisV0;
  unresolvedTensions: readonly PerspectiveCandidateUnresolvedTensionV0[];
  nextActionCandidates: readonly ChatGptPerspectiveCandidateNextActionPreviewV0[];
  userCoreDecisionQuestions: readonly string[];
  userReplyPrompts: readonly string[];
  codexHandoffReadiness: ChatGptPerspectiveCandidateBriefingPreviewV0["codex_handoff_readiness"];
}): string {
  return [
    "# ChatGPT Perspective Candidate Briefing Preview",
    "",
    `Candidate id: ${sourceCandidate.candidate_id}`,
    `Candidate version: ${sourceCandidate.candidate_version}`,
    `Status: ${sourceCandidate.status}`,
    `Authority: ${sourceCandidate.authority}`,
    "",
    "## Thesis",
    thesis,
    "",
    "## Basis quality",
    `Basis quality: ${basisStatus}`,
    ...formatListOrNone(basisReasons),
    "",
    "## Evidence basis",
    `Evidence pointer count: ${evidenceBasis.pointer_count}`,
    ...formatPointerCounts(evidenceBasis.pointer_kind_counts),
    ...formatPointerRefs(evidenceBasis.pointer_refs),
    "",
    "## Unresolved tensions",
    `Unresolved tension count: ${unresolvedTensions.length}`,
    ...formatListOrNone(unresolvedTensions.map(formatTension)),
    "",
    "## Next action candidates",
    ...formatListOrNone(nextActionCandidates.map(formatAction)),
    "",
    "## User/Core decision questions",
    ...formatListOrNone(userCoreDecisionQuestions),
    "",
    "## User reply prompts",
    ...formatListOrNone(userReplyPrompts),
    "",
    "## Codex handoff readiness",
    `Status: ${codexHandoffReadiness.status}`,
    ...formatListOrNone(codexHandoffReadiness.reasons),
    "",
    "## Authority boundary",
    "Display text only for human review. This is not committed state, proof, evidence, readiness, approval, merge authority, ChatGPT Apps integration, or a Codex execution command.",
  ].join("\n");
}

function buildAuthorityFlags(): ChatGptPerspectiveCandidateBriefingPreviewV0["authority_flags"] {
  return {
    committed_state: false,
    persistence: false,
    provider_model_api_calls: false,
    proof_evidence_readiness_writes: false,
    codex_execution: false,
    merge_publish_approval: false,
    chatgpt_app_integration: false,
  };
}

function formatPointerCounts(
  counts: Record<PerspectiveCandidateEvidencePointerKindV0, number>,
): string[] {
  return evidencePointerKinds.map(
    (pointerKind) => `- ${pointerKind}: ${counts[pointerKind]}`,
  );
}

function formatPointerRefs(
  refs: readonly PerspectiveCandidateEvidencePointerV0[],
): string[] {
  if (refs.length === 0) return ["- Pointer refs: none"];

  return refs.map(
    (pointer) => `- ${pointer.pointer_kind}: ${pointer.ref} (pointer-only)`,
  );
}

function formatTension(
  tension: PerspectiveCandidateUnresolvedTensionV0,
): string {
  const source = tension.source_ref ? ` [${tension.source_ref}]` : "";
  return `${tension.tension_kind}${source}: ${tension.summary}`;
}

function formatAction(
  action: ChatGptPerspectiveCandidateNextActionPreviewV0,
): string {
  return `${action.action_id}: ${action.summary} Advisory only: ${action.advisory_only}. Codex execution: ${action.codex_execution}.`;
}

function formatListOrNone(values: readonly string[]): string[] {
  if (values.length === 0) return ["- None"];
  return values.map((value) => `- ${value}`);
}

function copyReasonsOrDefault(
  reasons: readonly string[],
  fallback: string,
): string[] {
  return reasons.length > 0 ? [...reasons] : [fallback];
}

function shorten(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3).trim()}...`;
}

function hasText(value: string | null | undefined): boolean {
  return Boolean(value && value.trim());
}
