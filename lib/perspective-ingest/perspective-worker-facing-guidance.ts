import type {
  PerspectiveCandidateBasisQualityStatusV0,
  PerspectiveCandidateEvidencePointerKindV0,
  PerspectiveCandidateUnresolvedTensionV0,
  PerspectiveCandidateV0,
} from "@/lib/perspective-ingest/perspective-candidate-builder";

export type WorkerFacingPerspectiveGuidanceVersionV0 =
  "worker_facing_perspective_guidance.v0.1";
export type WorkerFacingPerspectiveGuidanceKindV0 =
  "worker_facing_perspective_guidance";
export type WorkerFacingPerspectiveGuidanceStatusV0 =
  | "actionable_advisory"
  | "resolve_gaps_first"
  | "stop_or_defer";
export type WorkerFacingPerspectiveScopeAlignmentStatusV0 =
  | "aligned_for_advisory_planning"
  | "resolve_gaps_before_planning"
  | "blocked_stop_or_defer";
export type WorkerFacingPerspectiveVerificationGapKindV0 =
  | "failed_check"
  | "skipped_check"
  | "skipped_check_missing_reason"
  | "unresolved_gap"
  | "readiness_reason"
  | "missing_verification_material";

export interface BuildWorkerFacingPerspectiveGuidanceFromCandidateInputV0 {
  candidate: PerspectiveCandidateV0;
  guidance_context?: {
    work_goal?: string | null;
    bounded_summary?: string | null;
  };
}

export interface WorkerFacingPerspectiveGuidanceObservationV0 {
  observation_id: string;
  summary: string;
  source_ref?: string;
}

export interface WorkerFacingPerspectiveVerificationGapV0 {
  gap_kind: WorkerFacingPerspectiveVerificationGapKindV0;
  summary: string;
  source_ref?: string;
}

export interface WorkerFacingPerspectiveActionV0 {
  action_id: string;
  summary: string;
  advisory_only: true;
  codex_execution: false;
}

export interface WorkerFacingPerspectiveGuidanceV0 {
  guidance_version: WorkerFacingPerspectiveGuidanceVersionV0;
  guidance_kind: WorkerFacingPerspectiveGuidanceKindV0;
  guidance_status: WorkerFacingPerspectiveGuidanceStatusV0;
  source_candidate: {
    candidate_id: string;
    candidate_version: PerspectiveCandidateV0["candidate_version"];
    candidate_status: PerspectiveCandidateV0["status"];
    candidate_authority: PerspectiveCandidateV0["authority"];
    basis_quality_status: PerspectiveCandidateBasisQualityStatusV0;
    refs: {
      work_id: string | null;
      source_pr_refs: string[];
      evidence_pointer_refs: {
        pointer_kind: PerspectiveCandidateEvidencePointerKindV0;
        pointer_semantics: "pointer_only";
        ref: string;
      }[];
    };
    selected_material: {
      changed_files: string[];
      changed_files_summary: string | null;
    };
  };
  work_goal: string | null;
  neutral_observations: WorkerFacingPerspectiveGuidanceObservationV0[];
  scope_alignment: {
    status: WorkerFacingPerspectiveScopeAlignmentStatusV0;
    basis_quality_status: PerspectiveCandidateBasisQualityStatusV0;
    reasons: string[];
    advisory_only: true;
  };
  verification_gaps: WorkerFacingPerspectiveVerificationGapV0[];
  unresolved_tensions: PerspectiveCandidateUnresolvedTensionV0[];
  next_smallest_useful_actions: WorkerFacingPerspectiveActionV0[];
  stop_or_defer_actions: WorkerFacingPerspectiveActionV0[];
  user_decision_questions: string[];
  worker_instructions: string[];
  authority_boundary: string;
  privacy: {
    raw_payloads_included: false;
    bounded_summaries_allowed: true;
    unsafe_input_material_omitted: boolean;
    omitted_unsafe_fields: string[];
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

export function buildWorkerFacingPerspectiveGuidanceFromCandidate(
  input: BuildWorkerFacingPerspectiveGuidanceFromCandidateInputV0,
): WorkerFacingPerspectiveGuidanceV0 {
  const omittedUnsafeFields = new Set<string>();
  const candidate = input.candidate;
  const sourceCandidate = buildSourceCandidate(candidate, omittedUnsafeFields);
  const workGoal = buildWorkGoal(input, omittedUnsafeFields);
  const verificationGaps = buildVerificationGaps(candidate, omittedUnsafeFields);
  const unresolvedTensions = copyTensions(
    candidate.unresolved_tensions,
    omittedUnsafeFields,
  );
  const scopeAlignment = buildScopeAlignment(candidate, omittedUnsafeFields);
  const guidanceStatus = mapGuidanceStatus(candidate.basis_quality.status);
  const nextSmallestUsefulActions = buildNextSmallestUsefulActions({
    guidanceStatus,
    verificationGaps,
    unresolvedTensions,
  });
  const stopOrDeferActions = buildStopOrDeferActions(guidanceStatus);
  const userDecisionQuestions = buildUserDecisionQuestions(
    candidate,
    guidanceStatus,
    verificationGaps,
    omittedUnsafeFields,
  );

  return {
    guidance_version: "worker_facing_perspective_guidance.v0.1",
    guidance_kind: "worker_facing_perspective_guidance",
    guidance_status: guidanceStatus,
    source_candidate: sourceCandidate,
    work_goal: workGoal,
    neutral_observations: buildNeutralObservations({
      candidate,
      sourceCandidate,
      workGoal,
      boundedSummary: input.guidance_context?.bounded_summary,
      omittedUnsafeFields,
    }),
    scope_alignment: scopeAlignment,
    verification_gaps: verificationGaps,
    unresolved_tensions: unresolvedTensions,
    next_smallest_useful_actions: nextSmallestUsefulActions,
    stop_or_defer_actions: stopOrDeferActions,
    user_decision_questions: userDecisionQuestions,
    worker_instructions: buildWorkerInstructions(guidanceStatus),
    authority_boundary:
      "Local advisory worker guidance only. It is not committed state, persistence, proof, evidence, readiness, approval, merge authority, GitHub mutation, provider/model/API behavior, ChatGPT Apps integration, Codex execution, or a Core decision.",
    privacy: {
      raw_payloads_included: false,
      bounded_summaries_allowed: true,
      unsafe_input_material_omitted: omittedUnsafeFields.size > 0,
      omitted_unsafe_fields: [...omittedUnsafeFields].sort(),
    },
    authority_flags: buildAuthorityFlags(),
  };
}

function buildSourceCandidate(
  candidate: PerspectiveCandidateV0,
  omittedUnsafeFields: Set<string>,
): WorkerFacingPerspectiveGuidanceV0["source_candidate"] {
  return {
    candidate_id:
      sanitizeText(
        candidate.candidate_id,
        "candidate.candidate_id",
        omittedUnsafeFields,
      ) ?? "omitted_source_candidate_ref",
    candidate_version: candidate.candidate_version,
    candidate_status: candidate.status,
    candidate_authority: candidate.authority,
    basis_quality_status: candidate.basis_quality.status,
    refs: {
      work_id: sanitizeText(
        candidate.source_bundle.work_id,
        "candidate.source_bundle.work_id",
        omittedUnsafeFields,
      ),
      source_pr_refs: copySafeTextList(
        candidate.source_bundle.source_pr_refs,
        "candidate.source_bundle.source_pr_refs",
        omittedUnsafeFields,
      ),
      evidence_pointer_refs: candidate.evidence_pointers.flatMap((pointer) => {
        const ref = sanitizeText(
          pointer.ref,
          `candidate.evidence_pointers.${pointer.pointer_kind}`,
          omittedUnsafeFields,
        );

        if (!ref) return [];

        return [
          {
            pointer_kind: pointer.pointer_kind,
            pointer_semantics: "pointer_only" as const,
            ref,
          },
        ];
      }),
    },
    selected_material: {
      changed_files: copySafeTextList(
        candidate.selected_material.changed_files,
        "candidate.selected_material.changed_files",
        omittedUnsafeFields,
      ),
      changed_files_summary: sanitizeText(
        candidate.selected_material.changed_files_summary,
        "candidate.selected_material.changed_files_summary",
        omittedUnsafeFields,
      ),
    },
  };
}

function buildWorkGoal(
  input: BuildWorkerFacingPerspectiveGuidanceFromCandidateInputV0,
  omittedUnsafeFields: Set<string>,
): string | null {
  const explicitWorkGoal = sanitizeText(
    input.guidance_context?.work_goal,
    "guidance_context.work_goal",
    omittedUnsafeFields,
  );
  if (explicitWorkGoal) return explicitWorkGoal;

  const selectedSummary = sanitizeText(
    input.candidate.selected_material.changed_files_summary,
    "candidate.selected_material.changed_files_summary",
    omittedUnsafeFields,
  );
  if (selectedSummary) return selectedSummary;

  return sanitizeText(
    input.candidate.thesis,
    "candidate.thesis",
    omittedUnsafeFields,
  );
}

function buildNeutralObservations({
  candidate,
  sourceCandidate,
  workGoal,
  boundedSummary,
  omittedUnsafeFields,
}: {
  candidate: PerspectiveCandidateV0;
  sourceCandidate: WorkerFacingPerspectiveGuidanceV0["source_candidate"];
  workGoal: string | null;
  boundedSummary: string | null | undefined;
  omittedUnsafeFields: Set<string>;
}): WorkerFacingPerspectiveGuidanceObservationV0[] {
  const observations: WorkerFacingPerspectiveGuidanceObservationV0[] = [
    {
      observation_id: "basis_quality",
      summary: `Candidate basis quality is ${candidate.basis_quality.status}.`,
      source_ref: sourceCandidate.candidate_id,
    },
    {
      observation_id: "selected_material",
      summary: `${sourceCandidate.selected_material.changed_files.length} changed file(s) are available as selected material.`,
      source_ref: sourceCandidate.candidate_id,
    },
    {
      observation_id: "verification_basis",
      summary: `${candidate.verification_summary.checks_run_count} check(s) ran: ${candidate.verification_summary.check_statuses.passed} passed and ${candidate.verification_summary.check_statuses.failed} failed.`,
      source_ref: sourceCandidate.candidate_id,
    },
    {
      observation_id: "unresolved_tensions",
      summary: `${candidate.unresolved_tensions.length} unresolved tension(s) remain visible.`,
      source_ref: sourceCandidate.candidate_id,
    },
  ];
  const safeThesis = sanitizeText(
    candidate.thesis,
    "candidate.thesis",
    omittedUnsafeFields,
  );
  const safeBoundedSummary = sanitizeText(
    boundedSummary,
    "guidance_context.bounded_summary",
    omittedUnsafeFields,
  );

  if (workGoal) {
    observations.push({
      observation_id: "work_goal",
      summary: `Worker-facing goal: ${workGoal}`,
      source_ref: sourceCandidate.candidate_id,
    });
  }

  if (safeThesis) {
    observations.push({
      observation_id: "candidate_thesis",
      summary: safeThesis,
      source_ref: sourceCandidate.candidate_id,
    });
  }

  if (safeBoundedSummary) {
    observations.push({
      observation_id: "explicit_bounded_summary",
      summary: safeBoundedSummary,
      source_ref: sourceCandidate.candidate_id,
    });
  }

  return observations;
}

function buildScopeAlignment(
  candidate: PerspectiveCandidateV0,
  omittedUnsafeFields: Set<string>,
): WorkerFacingPerspectiveGuidanceV0["scope_alignment"] {
  const basisStatus = candidate.basis_quality.status;
  const reasons = copySafeTextList(
    candidate.basis_quality.reasons,
    "candidate.basis_quality.reasons",
    omittedUnsafeFields,
  );

  if (basisStatus === "sufficient_for_review") {
    return {
      status: "aligned_for_advisory_planning",
      basis_quality_status: basisStatus,
      reasons:
        reasons.length > 0
          ? reasons
          : ["candidate basis is sufficient_for_review"],
      advisory_only: true,
    };
  }

  if (basisStatus === "blocked") {
    return {
      status: "blocked_stop_or_defer",
      basis_quality_status: basisStatus,
      reasons:
        reasons.length > 0
          ? reasons
          : ["candidate basis is blocked"],
      advisory_only: true,
    };
  }

  return {
    status: "resolve_gaps_before_planning",
    basis_quality_status: basisStatus,
    reasons:
      reasons.length > 0
        ? reasons
        : ["candidate basis needs review before worker planning"],
    advisory_only: true,
  };
}

function buildVerificationGaps(
  candidate: PerspectiveCandidateV0,
  omittedUnsafeFields: Set<string>,
): WorkerFacingPerspectiveVerificationGapV0[] {
  const gaps: WorkerFacingPerspectiveVerificationGapV0[] = [];

  for (const check of candidate.verification_summary.checks_run) {
    if (check.status !== "failed") continue;

    const sourceRef = sanitizeText(
      check.check_id,
      "candidate.verification_summary.checks_run.check_id",
      omittedUnsafeFields,
    );
    const summary = sanitizeText(
      check.result_summary,
      "candidate.verification_summary.checks_run.result_summary",
      omittedUnsafeFields,
    );

    gaps.push({
      gap_kind: "failed_check",
      summary: summary
        ? `Failed check remains unresolved: ${summary}`
        : "Failed check remains unresolved.",
      ...(sourceRef ? { source_ref: sourceRef } : {}),
    });
  }

  for (const skippedCheck of candidate.verification_summary.skipped_checks) {
    const sourceRef = sanitizeText(
      skippedCheck.check_id,
      "candidate.verification_summary.skipped_checks.check_id",
      omittedUnsafeFields,
    );
    const skippedReason = sanitizeText(
      skippedCheck.skipped_reason,
      "candidate.verification_summary.skipped_checks.skipped_reason",
      omittedUnsafeFields,
    );
    const gapKind = skippedReason
      ? "skipped_check"
      : "skipped_check_missing_reason";

    gaps.push({
      gap_kind: gapKind,
      summary: skippedReason
        ? `Skipped check remains visible for worker planning: ${skippedReason}`
        : "Skipped check is missing a concrete reason.",
      ...(sourceRef ? { source_ref: sourceRef } : {}),
    });
  }

  for (const tension of candidate.unresolved_tensions) {
    if (
      ![
        "unresolved_gap",
        "readiness_reason",
        "failed_check",
        "skipped_check_missing_reason",
      ].includes(tension.tension_kind)
    ) {
      continue;
    }

    gaps.push({
      gap_kind: mapTensionToVerificationGapKind(tension.tension_kind),
      summary:
        sanitizeText(
          tension.summary,
          "candidate.unresolved_tensions.summary",
          omittedUnsafeFields,
        ) ?? "Unresolved candidate tension was omitted from detail.",
      ...(sanitizeText(
        tension.source_ref,
        "candidate.unresolved_tensions.source_ref",
        omittedUnsafeFields,
      )
        ? {
            source_ref: sanitizeText(
              tension.source_ref,
              "candidate.unresolved_tensions.source_ref",
              omittedUnsafeFields,
            ) as string,
          }
        : {}),
    });
  }

  if (
    gaps.length === 0 &&
    candidate.basis_quality.reasons.some((reason) =>
      reason.includes("missing verification"),
    )
  ) {
    gaps.push({
      gap_kind: "missing_verification_material",
      summary: "Candidate reports missing verification, proof, evidence, or skipped-check material.",
    });
  }

  return dedupeGaps(gaps);
}

function mapTensionToVerificationGapKind(
  tensionKind: PerspectiveCandidateUnresolvedTensionV0["tension_kind"],
): WorkerFacingPerspectiveVerificationGapKindV0 {
  if (tensionKind === "failed_check") return "failed_check";
  if (tensionKind === "skipped_check_missing_reason") {
    return "skipped_check_missing_reason";
  }
  if (tensionKind === "readiness_reason") return "readiness_reason";
  return "unresolved_gap";
}

function copyTensions(
  tensions: readonly PerspectiveCandidateUnresolvedTensionV0[],
  omittedUnsafeFields: Set<string>,
): PerspectiveCandidateUnresolvedTensionV0[] {
  return tensions.map((tension) => ({
    tension_kind: tension.tension_kind,
    summary:
      sanitizeText(
        tension.summary,
        "candidate.unresolved_tensions.summary",
        omittedUnsafeFields,
      ) ?? "Unresolved candidate tension was omitted from detail.",
    ...(sanitizeText(
      tension.source_ref,
      "candidate.unresolved_tensions.source_ref",
      omittedUnsafeFields,
    )
      ? {
          source_ref: sanitizeText(
            tension.source_ref,
            "candidate.unresolved_tensions.source_ref",
            omittedUnsafeFields,
          ) as string,
        }
      : {}),
  }));
}

function mapGuidanceStatus(
  basisStatus: PerspectiveCandidateBasisQualityStatusV0,
): WorkerFacingPerspectiveGuidanceStatusV0 {
  if (basisStatus === "sufficient_for_review") return "actionable_advisory";
  if (basisStatus === "needs_review") return "resolve_gaps_first";
  if (basisStatus === "blocked") return "stop_or_defer";
  return "resolve_gaps_first";
}

function buildNextSmallestUsefulActions({
  guidanceStatus,
  verificationGaps,
  unresolvedTensions,
}: {
  guidanceStatus: WorkerFacingPerspectiveGuidanceStatusV0;
  verificationGaps: readonly WorkerFacingPerspectiveVerificationGapV0[];
  unresolvedTensions: readonly PerspectiveCandidateUnresolvedTensionV0[];
}): WorkerFacingPerspectiveActionV0[] {
  if (guidanceStatus === "stop_or_defer") {
    return [
      buildAction(
        "stop_and_request_unblock",
        "Stop worker planning from this candidate and ask the user or Core owner to resolve the blocking basis first.",
      ),
    ];
  }

  if (guidanceStatus === "resolve_gaps_first") {
    return [
      buildAction(
        "resolve_verification_gaps",
        "Resolve or qualify verification gaps before planning implementation work.",
      ),
      buildAction(
        "preserve_unresolved_tensions",
        `${unresolvedTensions.length} unresolved tension(s) must remain visible in any revised candidate or later handoff.`,
      ),
      buildAction(
        "ask_user_decision_questions",
        "Ask the preserved user/Core decision questions before treating this as ready for worker planning.",
      ),
    ];
  }

  return [
    buildAction(
      "inspect_source_candidate_refs",
      "Inspect the source candidate refs and selected material before proposing work.",
    ),
    buildAction(
      "draft_smallest_scoped_plan",
      "Draft the smallest useful scoped plan from the work goal and changed-file summary.",
    ),
    buildAction(
      "carry_forward_verification_gaps",
      `${verificationGaps.length} verification gap(s) must stay visible and cannot be converted into proof or readiness.`,
    ),
  ];
}

function buildStopOrDeferActions(
  guidanceStatus: WorkerFacingPerspectiveGuidanceStatusV0,
): WorkerFacingPerspectiveActionV0[] {
  const commonActions = [
    buildAction(
      "defer_authority_claims",
      "Do not claim approval, readiness, proof, evidence, merge authority, GitHub mutation, Codex execution, or Core decision authority from this guidance.",
    ),
  ];

  if (guidanceStatus === "stop_or_defer") {
    return [
      buildAction(
        "defer_all_worker_planning",
        "Defer worker planning until the blocked candidate basis is resolved.",
      ),
      ...commonActions,
    ];
  }

  if (guidanceStatus === "resolve_gaps_first") {
    return [
      buildAction(
        "defer_implementation_planning",
        "Defer implementation planning until unresolved gaps and review needs are resolved.",
      ),
      ...commonActions,
    ];
  }

  return [
    buildAction(
      "defer_execution_until_user_task",
      "Do not execute work from this guidance unless the user starts a future Codex task.",
    ),
    ...commonActions,
  ];
}

function buildUserDecisionQuestions(
  candidate: PerspectiveCandidateV0,
  guidanceStatus: WorkerFacingPerspectiveGuidanceStatusV0,
  verificationGaps: readonly WorkerFacingPerspectiveVerificationGapV0[],
  omittedUnsafeFields: Set<string>,
): string[] {
  const questions = copySafeTextList(
    candidate.user_core_decision_questions,
    "candidate.user_core_decision_questions",
    omittedUnsafeFields,
  );

  if (guidanceStatus === "actionable_advisory") {
    questions.push(
      "Should a future Codex worker use this guidance as the planning basis for the next smallest useful work?",
    );
  }

  if (guidanceStatus === "resolve_gaps_first") {
    questions.push(
      `Which of the ${verificationGaps.length} visible verification gap(s) must be resolved before worker planning continues?`,
    );
  }

  if (guidanceStatus === "stop_or_defer") {
    questions.push(
      "What user or Core decision is required before this blocked candidate can be used again?",
    );
  }

  return uniqueTextList(questions);
}

function buildWorkerInstructions(
  guidanceStatus: WorkerFacingPerspectiveGuidanceStatusV0,
): string[] {
  const instructions = [
    "Treat this as neutral planning guidance only after a user starts a future Codex task.",
    "Verify the repo, branch, scope, changed files, and checks independently before editing.",
    "Keep unresolved tensions and verification gaps visible in any plan or handoff.",
    "Do not write persistence, proof, evidence, readiness, approvals, provider calls, GitHub mutations, or Core decisions from this guidance.",
  ];

  if (guidanceStatus === "stop_or_defer") {
    instructions.unshift(
      "Stop and defer because the source candidate basis is blocked.",
    );
  }

  if (guidanceStatus === "resolve_gaps_first") {
    instructions.unshift(
      "Resolve visible gaps before proposing implementation work.",
    );
  }

  return instructions;
}

function buildAction(
  actionId: string,
  summary: string,
): WorkerFacingPerspectiveActionV0 {
  return {
    action_id: actionId,
    summary,
    advisory_only: true,
    codex_execution: false,
  };
}

function buildAuthorityFlags(): WorkerFacingPerspectiveGuidanceV0["authority_flags"] {
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

function sanitizeText(
  value: string | null | undefined,
  fieldName: string,
  omittedUnsafeFields: Set<string>,
): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (containsUnsafeSourceMaterial(trimmed)) {
    omittedUnsafeFields.add(fieldName);
    return null;
  }

  return trimmed;
}

function copySafeTextList(
  values: readonly string[],
  fieldName: string,
  omittedUnsafeFields: Set<string>,
): string[] {
  const safeValues: string[] = [];

  values.forEach((value, index) => {
    const safeValue = sanitizeText(
      value,
      `${fieldName}[${index}]`,
      omittedUnsafeFields,
    );

    if (safeValue) {
      safeValues.push(safeValue);
    }
  });

  return uniqueTextList(safeValues);
}

function containsUnsafeSourceMaterial(value: string): boolean {
  const lowered = value.toLowerCase();
  const unsafeMarkers = [
    "raw_pasted_text",
    "raw_source_payload",
    "raw_candidate_payload",
    "raw_private_payload",
    "private_payload",
    "provider_payload",
    "oauth_token",
    "access_token",
    "refresh_token",
    "api_key",
    "hidden_reasoning",
    "generated_model_payload",
    "sk-proj-",
    "ghp_",
    "gho_",
    "ghu_",
    "ghs_",
    "ghr_",
  ];

  return (
    unsafeMarkers.some((marker) => lowered.includes(marker)) ||
    /\bsecret\b/i.test(value)
  );
}

function uniqueTextList(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const uniqueValues: string[] = [];

  for (const value of values) {
    if (!seen.has(value)) {
      seen.add(value);
      uniqueValues.push(value);
    }
  }

  return uniqueValues;
}

function dedupeGaps(
  gaps: readonly WorkerFacingPerspectiveVerificationGapV0[],
): WorkerFacingPerspectiveVerificationGapV0[] {
  const seen = new Set<string>();
  const dedupedGaps: WorkerFacingPerspectiveVerificationGapV0[] = [];

  for (const gap of gaps) {
    const key = `${gap.gap_kind}|${gap.summary}|${gap.source_ref ?? ""}`;
    if (!seen.has(key)) {
      seen.add(key);
      dedupedGaps.push(gap);
    }
  }

  return dedupedGaps;
}
