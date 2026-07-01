import type {
  GuideBrief,
  GuideBriefAuthorityBoundary,
  GuideBriefCurrentPerspectiveSummary,
  GuideBriefDeltaSummary,
  GuideBriefGap,
  GuideBriefHandoffCandidate,
  GuideBriefHandoffCandidateStatus,
  GuideBriefHandoffTargetSurface,
  GuideBriefInferredItem,
  GuideBriefInput,
  GuideBriefJudgmentUrgency,
  GuideBriefObservedItem,
  GuideBriefReviewQueueSummary,
  GuideBriefSourceRefs,
  GuideBriefSourceSurface,
  GuideBriefStalenessSeverity,
  GuideBriefStalenessWarning,
  GuideBriefSuggestion,
  GuideBriefSurfaceRenderingNotes,
  GuideBriefUserJudgmentItem,
  GuideBriefWorkplaneSummary,
} from "@/types/guide-brief";

const GUIDE_BRIEF_VERSION = "guide_brief.v0.1" as const;
const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z";
const DEFAULT_WORKPLANE_ROUTE = "/workbench" as const;
const DEFAULT_DOCS_REFS = [
  "docs/AUGNES_CURRENT_WORKING_PERSPECTIVE_V0_1.md",
  "docs/AUGNES_DELTA_PROJECTION_READ_MODEL_V0_1.md",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/HUMAN_SURFACE_V0_1.md",
  "docs/PERSPECTIVE_CAPSULE_CONTRACT_V0_1.md",
];

export function buildGuideBrief(input: GuideBriefInput): GuideBrief {
  const observed = buildGuideObservedItems(input);
  const inferred = buildGuideInferences(input, observed);
  const suggested = buildGuideSuggestions(input, observed, inferred);
  const needsUserJudgment = buildGuideUserJudgmentItems(input);

  return {
    runtime: "augnes",
    guide_version: GUIDE_BRIEF_VERSION,
    scope: input.scope || input.current_working_perspective.scope,
    as_of:
      input.as_of ??
      input.current_working_perspective.as_of ??
      input.delta_projection.as_of ??
      FALLBACK_AS_OF,
    source_surfaces: buildGuideSourceSurfaces(input),
    observed,
    inferred,
    suggested,
    needs_user_judgment: needsUserJudgment,
    current_perspective_summary:
      buildGuideCurrentPerspectiveSummary(input),
    delta_summary: buildGuideDeltaSummary(input),
    workplane_summary: buildGuideWorkplaneSummary(input),
    review_queue_summary: buildGuideReviewQueueSummary(input),
    handoff_candidates: buildGuideHandoffCandidates(input),
    staleness_warnings: buildGuideStalenessWarnings(input),
    surface_rendering_notes: buildGuideSurfaceRenderingNotes(),
    source_refs: buildGuideSourceRefs(input),
    gaps: buildGuideGaps(input),
    authority_boundary: buildGuideBriefAuthorityBoundary(),
    next_phase_notes:
      input.next_phase_notes && input.next_phase_notes.length > 0
        ? [...input.next_phase_notes]
        : [
            "Phase 6A adds GuideBrief contract, types, helper, fixture, and smoke only.",
            "Phase 6B may add a GET-only read route only under a separate scoped prompt.",
            "Phase 6C/6D/6E and Phase 7 require separate scoped authority paths.",
          ],
  };
}

export function buildGuideObservedItems(
  input: GuideBriefInput,
): GuideBriefObservedItem[] {
  const current = input.current_working_perspective;
  const projection = input.delta_projection;
  const reviewQueue = buildGuideReviewQueueSummary(input);
  const sourceRefs = buildGuideSourceRefs(input);
  const observed: GuideBriefObservedItem[] = [
    {
      observation_id: "observed.current_thesis",
      kind: "current_perspective_thesis",
      summary: current.current_thesis.summary,
      source_refs: current.current_thesis.source_refs,
      related_delta_ids: current.last_major_delta_refs.map(
        (delta) => delta.delta_id,
      ),
      confidence: "observed",
      notes: [
        "Observed from CurrentWorkingPerspective.current_thesis.",
        "This is read-model observation only, not source-of-truth state.",
      ],
    },
    {
      observation_id: "observed.active_goal_count",
      kind: "active_goal_count",
      summary: `${current.active_goals.length} active goals are present in the supplied Current Working Perspective.`,
      source_refs: current.active_goals.flatMap((goal) => goal.source_refs),
      related_delta_ids: [],
      confidence: "observed",
      notes: [
        "Observed from CurrentWorkingPerspective.active_goals.",
        "Goal count does not create or update work.",
      ],
    },
    {
      observation_id: "observed.review_queue_counts",
      kind: "review_queue_counts",
      summary: `Review queue has ${reviewQueue.total_attention_count} total attention refs across needs-review, blocked, manual-review, validation, Project Perspective, durable-memory, and user-decision buckets.`,
      source_refs: reviewQueue.source_refs,
      related_delta_ids: collectReviewQueueDeltaIds(current),
      confidence: "observed",
      notes: [
        "Observed from CurrentWorkingPerspective.review_queue_hints.",
        "Review queue hints are advisory and do not approve or apply deltas.",
      ],
    },
    {
      observation_id: "observed.delta_projection_gaps",
      kind: "delta_projection_gap_count",
      summary: `Delta Projection reports ${projection.gaps.length} explicit gaps.`,
      source_refs: projection.gaps.flatMap((gap) => gap.source_refs),
      related_delta_ids: projection.deltas.map((delta) => delta.delta_id),
      confidence: "observed",
      notes: [
        "Observed from AugnesDeltaProjectionReadModel.gaps.",
        "Gaps do not authorize reconstructing missing source text.",
      ],
    },
  ];

  if (input.workplane_context) {
    observed.push({
      observation_id: "observed.workplane_panels_available",
      kind: "workplane_panels_available",
      summary: `Agent Workplane context lists ${input.workplane_context.panels_available.length} available panels for ${input.workplane_context.route}.`,
      source_refs: [sourceRefs.workplane_ref],
      related_delta_ids: [],
      confidence: "observed",
      notes: [
        "Observed from supplied lightweight workplane context.",
        "Workplane panel availability does not add UI or route behavior.",
      ],
    });
  }

  const fallbackStatus = input.workplane_context?.source_fallback_status ?? [];
  if (fallbackStatus.length > 0) {
    observed.push({
      observation_id: "observed.source_fallback_status",
      kind: "source_fallback_status",
      summary: `Source/fallback status entries supplied: ${fallbackStatus.join("; ")}.`,
      source_refs: [sourceRefs.workplane_ref],
      related_delta_ids: [],
      confidence: "observed",
      notes: [
        "Observed from supplied surface context.",
        "Fallback status must be disclosed and must not be presented as live state.",
      ],
    });
  }

  return observed;
}

export function buildGuideInferences(
  input: GuideBriefInput,
  observed: GuideBriefObservedItem[],
): GuideBriefInferredItem[] {
  const inferences: GuideBriefInferredItem[] = [];
  const reviewQueue = buildGuideReviewQueueSummary(input);
  const sourceRefs = buildGuideSourceRefs(input);

  if (reviewQueue.total_attention_count > 0) {
    inferences.push({
      inference_id: "inferred.review_attention_pressure",
      summary:
        "Guide consumers likely need to keep review pressure visible before any handoff or next-phase work is treated as ready.",
      basis_observation_ids: observationIds(observed, [
        "observed.review_queue_counts",
      ]),
      source_refs: reviewQueue.source_refs,
      confidence: reviewQueue.total_attention_count > 2 ? "high" : "medium",
      caveats: [
        "This is derived interpretation from review queue counts.",
        "It is not a source fact and does not decide the review outcome.",
      ],
      non_authority_notes: [
        "Inference has no apply, approve, reject, merge, or publish authority.",
      ],
    });
  }

  const gapCount =
    input.current_working_perspective.gaps.length +
    input.delta_projection.gaps.length;
  if (
    input.current_working_perspective.staleness.status !== "fresh" ||
    gapCount > 0
  ) {
    inferences.push({
      inference_id: "inferred.staleness_or_gap_pressure",
      summary:
        "Guide renderers should keep freshness and gap context adjacent to suggestions so candidates are not mistaken for decisions.",
      basis_observation_ids: observationIds(observed, [
        "observed.delta_projection_gaps",
        "observed.source_fallback_status",
      ]),
      source_refs: uniqueSorted([
        `current_working_perspective:${input.current_working_perspective.as_of}`,
        `augnes_delta_projection:${input.delta_projection.as_of}`,
        ...sourceRefs.diagnostic_refs,
      ]),
      confidence:
        input.current_working_perspective.staleness.status === "stale"
          ? "high"
          : "medium",
      caveats: [
        "This is derived from staleness status and explicit gaps.",
        "Freshness metadata is review support only.",
      ],
      non_authority_notes: [
        "Inference does not refresh sources, call routes, or mutate records.",
      ],
    });
  }

  return inferences;
}

export function buildGuideSuggestions(
  input: GuideBriefInput,
  observed: GuideBriefObservedItem[],
  inferred: GuideBriefInferredItem[],
): GuideBriefSuggestion[] {
  const sourceRefs = buildGuideSourceRefs(input);
  const reviewQueue = buildGuideReviewQueueSummary(input);
  const relatedDeltaIds = collectReviewQueueDeltaIds(
    input.current_working_perspective,
  );
  const suggestions: GuideBriefSuggestion[] = [];

  if (
    input.current_working_perspective.open_questions.length > 0 ||
    reviewQueue.user_decision_count > 0
  ) {
    suggestions.push({
      suggestion_id: "suggested.review_user_judgment_prompts",
      title: "Review unresolved judgment prompts",
      summary:
        "Show unresolved user judgment prompts before treating any guide candidate as ready.",
      suggested_surface: "future_guide_panel",
      suggested_actor: "user",
      priority: "high",
      required_checks: [
        "Keep needs_user_judgment separate from suggestions.",
        "Preserve source refs and blocked-until-decided notes.",
      ],
      blocked_by: [],
      source_refs: sourceRefs.current_working_perspective_ref
        ? [sourceRefs.current_working_perspective_ref]
        : [],
      related_delta_ids: relatedDeltaIds,
      authority_boundary_summary:
        "Candidate only; GuideBrief must not decide user judgment items.",
    });
  }

  if (input.delta_projection.deltas.length > 0) {
    suggestions.push({
      suggestion_id: "suggested.inspect_delta_timeline",
      title: "Inspect projected delta chronology",
      summary:
        "Use Perspective Timeline context to keep projected delta chronology and selected-delta source refs visible.",
      suggested_surface: "perspective_timeline",
      suggested_actor: "operator",
      priority: reviewQueue.total_attention_count > 0 ? "high" : "medium",
      required_checks: [
        "Keep AugnesDelta records as read-model inputs only.",
        "Keep evidence, artifact, and handoff refs pointer-only.",
      ],
      blocked_by: [],
      source_refs: [sourceRefs.delta_projection_ref],
      related_delta_ids: input.delta_projection.deltas
        .slice(0, 4)
        .map((delta) => delta.delta_id),
      authority_boundary_summary:
        "Navigation suggestion only; no apply, approve, reject, or persistence authority.",
    });
  }

  const hasHandoffContext =
    sourceRefs.handoff_refs.length > 0 ||
    input.current_working_perspective.next_candidates.length > 0;
  if (hasHandoffContext) {
    suggestions.push({
      suggestion_id: "suggested.prepare_preview_only_handoff",
      title: "Prepare preview-only handoff context",
      summary:
        "Collect bounded context for a future Codex or ChatGPT handoff preview without sending, launching, or executing it.",
      suggested_surface: "codex_handoff",
      suggested_actor: "operator",
      priority: "medium",
      required_checks: [
        "Preserve skipped-check reasons and authority boundary.",
        "Keep handoff candidates preview-only until separately scoped.",
      ],
      blocked_by:
        inferred.length > 0
          ? inferred.map((item) => item.inference_id)
          : [],
      source_refs: uniqueSorted([
        ...sourceRefs.handoff_refs,
        sourceRefs.current_working_perspective_ref,
      ]),
      related_delta_ids: relatedDeltaIds,
      authority_boundary_summary:
        "Preview only; no send, Codex launch, branch creation, PR creation, or external side effect.",
    });
  }

  return suggestions;
}

export function buildGuideUserJudgmentItems(
  input: GuideBriefInput,
): GuideBriefUserJudgmentItem[] {
  const current = input.current_working_perspective;
  const fromOpenQuestions = current.open_questions.slice(0, 3).map((question) => ({
    judgment_id: `judgment.open_question.${safeId(question.question_id)}`,
    question: question.summary,
    why_it_matters:
      "The guide can surface this question, but the user/operator must decide whether it blocks next work.",
    options: [
      "Resolve before handoff.",
      "Keep visible as open context.",
      "Defer to a separately scoped phase.",
    ],
    source_refs: [...question.source_refs],
    related_delta_ids: [],
    urgency: mapJudgmentUrgency(question.severity),
    blocked_until_decided: [
      "Do not convert this question into an accepted guide decision.",
    ],
  }));

  const userJudgmentDeltaIds = input.delta_projection.deltas
    .filter((delta) => delta.merge_policy.requires_user_judgment)
    .map((delta) => delta.delta_id);

  const fromDeltas = userJudgmentDeltaIds.slice(0, 2).map((deltaId) => ({
    judgment_id: `judgment.delta_requires_user.${safeId(deltaId)}`,
    question: `How should the user/operator treat projected delta ${deltaId}?`,
    why_it_matters:
      "The delta explicitly requires user judgment before any future durable or boundary-crossing path.",
    options: [
      "Review manually.",
      "Defer.",
      "Treat as blocked until a fresh scoped implementation exists.",
    ],
    source_refs: [`augnes_delta:${deltaId}`],
    related_delta_ids: [deltaId],
    urgency: "high" as const,
    blocked_until_decided: [
      "Durable Perspective apply.",
      "Durable memory mutation.",
      "External side effects.",
    ],
  }));

  return [...fromOpenQuestions, ...fromDeltas];
}

export function buildGuideCurrentPerspectiveSummary(
  input: GuideBriefInput,
): GuideBriefCurrentPerspectiveSummary {
  const current = input.current_working_perspective;

  return {
    current_thesis: current.current_thesis.summary,
    active_goal_count: current.active_goals.length,
    open_question_count: current.open_questions.length,
    active_risk_count: current.active_risks.length,
    research_pressure_level: current.research_pressure.pressure_level,
    staleness_status: current.staleness.status,
    source_status: {
      current_working_perspective:
        input.surface_context?.source_status?.current_working_perspective ??
        "supplied_read_model",
      delta_projection:
        input.surface_context?.source_status?.delta_projection ??
        "supplied_read_model",
    },
    source_refs: uniqueSorted([
      `current_working_perspective:${current.as_of}`,
      ...current.current_thesis.source_refs,
      ...current.current_frame.source_refs,
    ]),
  };
}

export function buildGuideDeltaSummary(
  input: GuideBriefInput,
): GuideBriefDeltaSummary {
  const projection = input.delta_projection;
  const reviewQueue = buildGuideReviewQueueSummary(input);

  return {
    projected_delta_count:
      projection.source_counts.total_projected_deltas ??
      projection.deltas.length,
    batch_count: projection.source_counts.total_batches ?? projection.batches.length,
    gap_count: projection.source_counts.total_gaps ?? projection.gaps.length,
    needs_review_count: reviewQueue.needs_review_count,
    blocked_count: reviewQueue.blocked_count,
    manual_review_count: reviewQueue.manual_review_count,
    important_delta_refs: uniqueSorted([
      ...input.current_working_perspective.last_major_delta_refs.map(
        (delta) => delta.delta_id,
      ),
      ...collectReviewQueueDeltaIds(input.current_working_perspective),
      ...projection.deltas.slice(0, 4).map((delta) => delta.delta_id),
    ]),
    source_refs: uniqueSorted([
      `augnes_delta_projection:${projection.as_of}`,
      ...projection.deltas.map((delta) => `augnes_delta:${delta.delta_id}`),
      ...projection.batches.map((batch) => `delta_batch:${batch.batch_id}`),
    ]),
  };
}

export function buildGuideWorkplaneSummary(
  input: GuideBriefInput,
): GuideBriefWorkplaneSummary {
  const context = input.workplane_context;

  return {
    route: context?.route ?? DEFAULT_WORKPLANE_ROUTE,
    surface_role: "agent_workplane",
    panels_available: context ? [...context.panels_available] : [],
    legacy_cockpit_reachable: context?.legacy_cockpit_reachable ?? false,
    source_fallback_status: context ? [...context.source_fallback_status] : [],
    trace_diagnostics_bounded: context?.trace_diagnostics_bounded ?? false,
    authority_boundary_summary:
      context?.authority_boundary_notes.join(" ") ||
      "Agent Workplane context was not supplied; GuideBrief keeps workplane fields read-only and non-executing.",
  };
}

export function buildGuideReviewQueueSummary(
  input: GuideBriefInput,
): GuideBriefReviewQueueSummary {
  const reviewQueue = input.current_working_perspective.review_queue_hints;
  const allIds = collectReviewQueueDeltaIds(input.current_working_perspective);

  return {
    needs_review_count: reviewQueue.needs_review_delta_ids.length,
    blocked_count: reviewQueue.blocked_delta_ids.length,
    manual_review_count: reviewQueue.manual_review_delta_ids.length,
    validation_required_count:
      reviewQueue.validation_required_delta_ids.length,
    project_perspective_review_count:
      reviewQueue.project_perspective_review_delta_ids.length,
    durable_memory_review_count:
      reviewQueue.durable_memory_review_delta_ids.length,
    user_decision_count: reviewQueue.user_decision_delta_ids.length,
    total_attention_count: allIds.length,
    source_refs: uniqueSorted([
      ...allIds.map((deltaId) => `augnes_delta:${deltaId}`),
      ...reviewQueue.notes.map((note) => `review_queue_note:${safeId(note)}`),
    ]),
  };
}

export function buildGuideHandoffCandidates(
  input: GuideBriefInput,
): GuideBriefHandoffCandidate[] {
  const candidates: GuideBriefHandoffCandidate[] = [];
  const sourceRefs = buildGuideSourceRefs(input);

  for (const handoffRef of sourceRefs.handoff_refs) {
    candidates.push(
      createHandoffCandidate({
        handoff_candidate_id: `handoff_candidate.ref.${safeId(handoffRef)}`,
        target_surface: "codex_handoff",
        title: "Preview handoff reference",
        summary: `Review pointer-only handoff ref ${handoffRef} before any future handoff execution path.`,
        source_refs: [handoffRef],
        related_delta_ids: relatedDeltaIdsForHandoff(input, handoffRef),
        required_context: [
          "GuideBrief authority boundary.",
          "Observed/Inferred/Suggested/Judgment separation.",
          "Skipped checks and source freshness status.",
        ],
        blocked_by: ["Separate scoped handoff implementation is required."],
        status: "preview_only",
      }),
    );
  }

  for (const candidate of input.current_working_perspective.next_candidates.slice(
    0,
    3,
  )) {
    candidates.push(
      createHandoffCandidate({
        handoff_candidate_id: `handoff_candidate.next.${safeId(
          candidate.candidate_id,
        )}`,
        target_surface: "agent_workplane_preview",
        title: candidate.title,
        summary:
          candidate.rationale ||
          "Current next candidate can be rendered as preview-only guide context.",
        source_refs: [...candidate.source_refs],
        related_delta_ids: [],
        required_context: [
          "Current Working Perspective next candidate.",
          "Allowed and blocked next steps.",
          "Manual review authority requirements.",
        ],
        blocked_by:
          candidate.authority_required === "none"
            ? []
            : [`authority_required:${candidate.authority_required}`],
        status:
          candidate.authority_required === "none"
            ? "preview_only"
            : "needs_review",
      }),
    );
  }

  return dedupeById(candidates, "handoff_candidate_id");
}

export function buildGuideStalenessWarnings(
  input: GuideBriefInput,
): GuideBriefStalenessWarning[] {
  const warnings: GuideBriefStalenessWarning[] = [];
  const current = input.current_working_perspective;

  if (current.staleness.status !== "fresh") {
    warnings.push({
      warning_id: `staleness.current_perspective.${safeId(
        current.staleness.status,
      )}`,
      summary: `Current Working Perspective staleness status is ${current.staleness.status}.`,
      severity: current.staleness.status === "stale" ? "high" : "medium",
      source_refs: uniqueSorted([
        `current_working_perspective:${current.as_of}`,
        ...current.staleness.source_gap_codes,
      ]),
      refresh_suggestion:
        "Refresh or explicitly accept the Current Working Perspective basis before relying on handoff candidates.",
      blocks_handoff: current.staleness.status === "stale",
    });
  }

  for (const gap of input.delta_projection.gaps) {
    if (gap.severity === "low") continue;
    warnings.push({
      warning_id: `staleness.delta_projection_gap.${safeId(gap.code)}`,
      summary: gap.summary,
      severity: mapStalenessSeverity(gap.severity),
      source_refs: [...gap.source_refs],
      refresh_suggestion:
        "Review the projection gap before treating GuideBrief suggestions as complete.",
      blocks_handoff: gap.severity === "high",
    });
  }

  for (const status of input.workplane_context?.source_fallback_status ?? []) {
    if (!/fallback|unavailable|stale|partial/i.test(status)) continue;
    warnings.push({
      warning_id: `staleness.workplane_status.${safeId(status)}`,
      summary: status,
      severity: /stale|unavailable/i.test(status) ? "medium" : "low",
      source_refs: [DEFAULT_WORKPLANE_ROUTE],
      refresh_suggestion:
        "Keep fallback disclosure visible on surfaces consuming this GuideBrief.",
      blocks_handoff: false,
    });
  }

  return dedupeById(warnings, "warning_id");
}

export function buildGuideSurfaceRenderingNotes():
  GuideBriefSurfaceRenderingNotes {
  return {
    human_surface: [
      "Render a compact summary and user judgment prompts.",
      "Keep suggestions visually separate from decisions.",
    ],
    perspective_timeline: [
      "Preserve delta chronology and selected-delta context.",
      "Keep source refs, gaps, staleness, and pointer-only refs visible.",
    ],
    agent_workplane: [
      "Show trace and diagnostic refs while keeping raw logs bounded or collapsed.",
      "Keep preview-only handoff candidates separate from execution controls.",
    ],
    chatgpt_app: [
      "Keep Observed, Inferred, Suggested, and Needs user judgment separated.",
      "Do not expose GuideBrief as an MCP/App write tool in Phase 6A.",
    ],
    codex: [
      "Preserve repo/task boundaries, expected files/checks, skipped checks, and authority boundary.",
      "Do not treat suggestions as Codex execution or PR creation authority.",
    ],
    future_agent_surface: [
      "Render GuideBrief as read-only context unless separately scoped.",
      "Require a future explicit authority path before any handoff or autonomy behavior.",
    ],
  };
}

export function buildGuideBriefAuthorityBoundary():
  GuideBriefAuthorityBoundary {
  return {
    source_of_truth: false,
    can_commit_or_reject_state: false,
    can_record_proof: false,
    can_create_evidence: false,
    can_update_work: false,
    can_mutate_memory: false,
    can_apply_project_perspective: false,
    can_publish_external: false,
    can_merge: false,
    can_retry_replay_deploy: false,
    can_call_github: false,
    can_call_openai_or_provider: false,
    can_execute_codex: false,
    can_create_branch_or_pr: false,
    can_send_handoff: false,
    can_launch_autonomy: false,
    can_create_mcp_tool: false,
    can_create_ui_action: false,
    notes: [
      "GuideBrief is read-only.",
      "Observed items are read-model observations only.",
      "Inferred items are derived interpretations only.",
      "Suggested items are candidate next actions only.",
      "Needs user judgment items must not be decided by the guide.",
      "Handoff candidates are preview-only.",
      "Codex and ChatGPT surfaces require separate scoped implementation.",
    ],
  };
}

export function buildGuideSourceRefs(
  input: GuideBriefInput,
): GuideBriefSourceRefs {
  const current = input.current_working_perspective;
  const projection = input.delta_projection;
  const currentSourceRefs = current.source_refs;
  const deltaIds = uniqueSorted([
    ...currentSourceRefs.delta_projection.delta_ids,
    ...projection.deltas.map((delta) => delta.delta_id),
  ]);
  const batchIds = uniqueSorted([
    ...currentSourceRefs.delta_projection.batch_ids,
    ...projection.batches.map((batch) => batch.batch_id),
  ]);
  const handoffRefs = uniqueSorted([
    ...projection.source_refs.handoff_refs,
    ...(input.handoff_refs ?? []).map(normalizeHandoffRef),
    ...projection.deltas.flatMap((delta) =>
      delta.handoff_refs.map((ref) => ref.handoff_ref),
    ),
  ]);

  return {
    current_working_perspective_ref: `current_working_perspective:${current.as_of}`,
    delta_projection_ref: `augnes_delta_projection:${projection.as_of}`,
    workplane_ref: `${DEFAULT_WORKPLANE_ROUTE}:agent_workplane`,
    perspective_snapshot_refs: uniqueSorted([
      currentSourceRefs.perspective_snapshot.as_of,
      ...currentSourceRefs.snapshot_refs.map((ref) => ref.snapshot_id),
      ...projection.source_refs.snapshot_refs.map((ref) => ref.snapshot_id),
    ]),
    delta_ids: deltaIds,
    batch_ids: batchIds,
    evidence_refs: uniqueSorted([
      ...currentSourceRefs.perspective_snapshot.source_refs.evidence_ids.map(
        (id) => `evidence_record:${id}`,
      ),
      ...projection.source_refs.evidence_record_ids.map(
        (id) => `evidence_record:${id}`,
      ),
      ...projection.deltas.flatMap((delta) =>
        delta.evidence_refs.map((ref) => ref.evidence_ref),
      ),
    ]),
    artifact_refs: uniqueSorted(
      projection.deltas.flatMap((delta) =>
        delta.artifact_refs.map((ref) => ref.artifact_ref),
      ),
    ),
    handoff_refs: handoffRefs,
    diagnostic_refs: uniqueSorted([
      ...currentSourceRefs.diagnostic_refs.map((ref) => ref.diagnostic_id),
      ...projection.source_refs.diagnostic_refs.map((ref) => ref.diagnostic_id),
    ]),
    route_refs: uniqueSorted([
      "/",
      "/perspective",
      DEFAULT_WORKPLANE_ROUTE,
      ...(input.surface_context?.route_refs ?? []),
    ]),
    docs_refs: uniqueSorted([
      ...DEFAULT_DOCS_REFS,
      ...(input.docs_refs ?? []),
    ]),
  };
}

export function buildGuideGaps(input: GuideBriefInput): GuideBriefGap[] {
  const explicitGaps = input.gaps ?? [];
  const currentGaps = input.current_working_perspective.gaps.map((gap) => ({
    code: `current_working_perspective.${gap.code}`,
    severity: gap.severity,
    summary: gap.summary,
    source_refs: [...gap.source_refs],
    blocks_guide_confidence: gap.severity !== "low",
  }));
  const projectionGaps = input.delta_projection.gaps.map((gap) => ({
    code: `delta_projection.${gap.code}`,
    severity: gap.severity,
    summary: gap.summary,
    source_refs: [...gap.source_refs],
    blocks_guide_confidence: gap.severity !== "low",
  }));

  return dedupeById(
    [...explicitGaps, ...currentGaps, ...projectionGaps],
    "code",
  );
}

function buildGuideSourceSurfaces(
  input: GuideBriefInput,
): GuideBriefSourceSurface[] {
  return uniqueSorted([
    "current_working_perspective",
    "delta_projection",
    "human_surface",
    "perspective_timeline",
    "docs",
    ...(input.workplane_context ? ["agent_workplane"] : []),
    ...(input.surface_context?.source_surfaces ?? []),
  ]) as GuideBriefSourceSurface[];
}

function createHandoffCandidate({
  handoff_candidate_id,
  target_surface,
  title,
  summary,
  source_refs,
  related_delta_ids,
  required_context,
  blocked_by,
  status,
}: {
  handoff_candidate_id: string;
  target_surface: GuideBriefHandoffTargetSurface;
  title: string;
  summary: string;
  source_refs: string[];
  related_delta_ids: string[];
  required_context: string[];
  blocked_by: string[];
  status: GuideBriefHandoffCandidateStatus;
}): GuideBriefHandoffCandidate {
  return {
    handoff_candidate_id,
    target_surface,
    title,
    summary,
    source_refs,
    related_delta_ids,
    required_context,
    blocked_by,
    authority_boundary:
      "Preview-only handoff candidate; GuideBrief cannot send, execute, launch Codex, create a PR, call providers, call GitHub, or write proof/evidence.",
    status,
  };
}

function collectReviewQueueDeltaIds(
  current: GuideBriefInput["current_working_perspective"],
): string[] {
  const queue = current.review_queue_hints;
  return uniqueSorted([
    ...queue.needs_review_delta_ids,
    ...queue.blocked_delta_ids,
    ...queue.manual_review_delta_ids,
    ...queue.validation_required_delta_ids,
    ...queue.project_perspective_review_delta_ids,
    ...queue.durable_memory_review_delta_ids,
    ...queue.user_decision_delta_ids,
  ]);
}

function relatedDeltaIdsForHandoff(
  input: GuideBriefInput,
  handoffRef: string,
): string[] {
  return input.delta_projection.deltas
    .filter((delta) =>
      delta.handoff_refs.some((ref) => ref.handoff_ref === handoffRef),
    )
    .map((delta) => delta.delta_id);
}

function observationIds(
  observed: GuideBriefObservedItem[],
  ids: string[],
): string[] {
  const knownIds = new Set(observed.map((item) => item.observation_id));
  return ids.filter((id) => knownIds.has(id));
}

function normalizeHandoffRef(ref: string | { handoff_ref: string }): string {
  return typeof ref === "string" ? ref : ref.handoff_ref;
}

function mapJudgmentUrgency(
  severity: string,
): GuideBriefJudgmentUrgency {
  if (severity === "high") return "high";
  if (severity === "medium") return "medium";
  return "low";
}

function mapStalenessSeverity(severity: string): GuideBriefStalenessSeverity {
  if (severity === "high") return "high";
  if (severity === "medium") return "medium";
  return "low";
}

function dedupeById<T, K extends keyof T>(
  items: T[],
  key: K,
): T[] {
  const seen = new Set<string>();
  const deduped: T[] = [];

  for (const item of items) {
    const value = String(item[key]);
    if (seen.has(value)) continue;
    seen.add(value);
    deduped.push(item);
  }

  return deduped;
}

function uniqueSorted(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
    .sort((left, right) => left.localeCompare(right));
}

function safeId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120);
}
