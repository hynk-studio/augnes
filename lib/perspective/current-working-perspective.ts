import type {
  AugnesDelta,
  AugnesDeltaAuthorityBoundary,
  ResearchDiagnosticRef,
  SnapshotRef,
} from "@/types/augnes-delta";
import type { AugnesDeltaProjectionReadModel } from "@/types/augnes-delta-projection";
import type {
  CurrentWorkingPerspective,
  CurrentWorkingPerspectiveAssumption,
  CurrentWorkingPerspectiveDeltaRef,
  CurrentWorkingPerspectiveGap,
  CurrentWorkingPerspectiveGapSeverity,
  CurrentWorkingPerspectiveGoal,
  CurrentWorkingPerspectiveInput,
  CurrentWorkingPerspectiveNextCandidate,
  CurrentWorkingPerspectiveOpenQuestion,
  CurrentWorkingPerspectiveResearchPressure,
  CurrentWorkingPerspectiveResult,
  CurrentWorkingPerspectiveReviewQueueHints,
  CurrentWorkingPerspectiveRisk,
  CurrentWorkingPerspectiveSnapshotInput,
  CurrentWorkingPerspectiveSourceRefs,
  CurrentWorkingPerspectiveStaleness,
  CurrentWorkingPerspectiveThesis,
} from "@/types/current-working-perspective";

export const CURRENT_WORKING_PERSPECTIVE_CREATED_BY =
  "current_working_perspective_v0_1";

const CURRENT_WORKING_PERSPECTIVE_VERSION =
  "current_working_perspective.v0.1" as const;
const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z";
const DEFAULT_SCOPE = "project:augnes";
const MAX_ACCEPTED_ASSUMPTIONS = 12;
const MAX_REJECTED_ASSUMPTIONS = 8;
const MAX_OPEN_QUESTIONS = 12;
const MAX_ACTIVE_RISKS = 12;
const MAX_NEXT_CANDIDATES = 10;
const MAX_DELTA_REFS = 8;

export function buildCurrentWorkingPerspective(
  input: CurrentWorkingPerspectiveInput,
): CurrentWorkingPerspective {
  const scope = input.scope || input.snapshot.scope || DEFAULT_SCOPE;
  const asOf = input.as_of ?? maxIso(input.snapshot.as_of, input.delta_projection.as_of);
  const sourceRefs = buildCurrentPerspectiveSourceRefs(input);
  const gaps = buildCurrentPerspectiveGaps(input);
  const reviewQueueHints = buildCurrentPerspectiveReviewQueueHints(
    input.delta_projection,
  );
  const activeRisks = buildActiveRisks({
    snapshot: input.snapshot,
    deltaProjection: input.delta_projection,
    gaps,
  });
  const nextCandidates = buildNextCandidates({
    snapshot: input.snapshot,
    deltaProjection: input.delta_projection,
  });

  return {
    runtime: "augnes",
    perspective_version: CURRENT_WORKING_PERSPECTIVE_VERSION,
    projection_version: input.delta_projection.projection_version,
    snapshot_version: input.snapshot.snapshot_version,
    scope,
    as_of: asOf,
    current_frame: {
      summary: input.snapshot.current_frame.summary,
      primary_state_keys: [...input.snapshot.current_frame.primary_state_keys],
      active_work_ids: [...input.snapshot.current_frame.active_work_ids],
      pressure_level: input.snapshot.current_frame.pressure_level,
      source_refs: [
        `perspective_snapshot:${input.snapshot.as_of}`,
        ...input.snapshot.source_refs.state_entry_ids.map((id) => `state_entry:${id}`),
        ...input.snapshot.source_refs.work_ids.map((id) => `work:${id}`),
      ],
      non_authority_notes: [
        "Current frame is derived from PerspectiveSnapshot.",
        "Current frame is not source-of-truth state.",
        "Current frame grants no approval or apply authority.",
      ],
    },
    current_thesis: buildCurrentThesis({
      snapshot: input.snapshot,
      deltaProjection: input.delta_projection,
    }),
    active_goals: buildActiveGoals(input.snapshot),
    accepted_assumptions: buildAcceptedAssumptions(input.snapshot),
    rejected_assumptions: buildRejectedAssumptions(input.delta_projection),
    open_questions: buildOpenQuestions({
      snapshot: input.snapshot,
      gaps,
    }),
    active_risks: activeRisks,
    research_pressure: buildResearchPressure({
      snapshot: input.snapshot,
      deltaProjection: input.delta_projection,
      sourceRefs,
    }),
    next_candidates: nextCandidates,
    last_major_delta_refs: buildLastMajorDeltaRefs(input.delta_projection),
    review_queue_hints: reviewQueueHints,
    source_refs: sourceRefs,
    staleness: buildCurrentPerspectiveStaleness({
      snapshot: input.snapshot,
      deltaProjection: input.delta_projection,
      gaps,
    }),
    gaps,
    authority_boundary: buildCurrentWorkingPerspectiveAuthorityBoundary(),
    next_phase_notes:
      input.next_phase_notes && input.next_phase_notes.length > 0
        ? [...input.next_phase_notes]
        : [
            "Phase 3A builds a read-only Current Working Perspective packet only.",
            "Phase 3B may add a GET-only route under a separate scoped PR.",
            "Phase 4 can consume this packet for Human Surface v0.1 without requiring state mutation.",
          ],
  };
}

export function buildCurrentWorkingPerspectiveResult(
  input: CurrentWorkingPerspectiveInput,
): CurrentWorkingPerspectiveResult {
  const currentWorkingPerspective = buildCurrentWorkingPerspective(input);

  return {
    current_working_perspective: currentWorkingPerspective,
    active_goal_count: currentWorkingPerspective.active_goals.length,
    next_candidate_count: currentWorkingPerspective.next_candidates.length,
    review_queue_count:
      currentWorkingPerspective.review_queue_hints.needs_review_delta_ids.length +
      currentWorkingPerspective.review_queue_hints.blocked_delta_ids.length,
    gap_count: currentWorkingPerspective.gaps.length,
  };
}

export function buildCurrentWorkingPerspectiveAuthorityBoundary():
  CurrentWorkingPerspective["authority_boundary"] {
  const deltaBoundary: AugnesDeltaAuthorityBoundary = {
    source_of_truth:
      "Existing Augnes Core records, PerspectiveSnapshot inputs, and AugnesDeltaProjectionReadModel inputs remain authoritative; Current Working Perspective is a read-only derived packet.",
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
    notes: [
      "read-only derived current perspective model",
      "PerspectiveSnapshot remains derived source context",
      "AugnesDeltaProjectionReadModel deltas remain projection inputs",
      "research diagnostics are non-authoritative",
      "no durable Perspective apply",
      "no memory mutation",
      "no proof/evidence write",
      "no external side effect",
    ],
  };

  return {
    ...deltaBoundary,
    derived_view_only: true,
    can_write_db: false,
    can_add_route: false,
    can_add_ui: false,
  };
}

export function buildCurrentPerspectiveSourceRefs(
  input: CurrentWorkingPerspectiveInput,
): CurrentWorkingPerspectiveSourceRefs {
  const deltaProjection = input.delta_projection;
  const syntheticSnapshotRef: SnapshotRef = {
    snapshot_id: `perspective_snapshot.current_working.${safeId(input.snapshot.scope)}`,
    snapshot_kind: "perspective_snapshot_input",
    created_at: input.snapshot.as_of,
    source_refs: [
      ...input.snapshot.source_refs.state_entry_ids.map((id) => `state_entry:${id}`),
      ...input.snapshot.source_refs.pending_proposal_ids.map(
        (id) => `state_delta_proposal:${id}`,
      ),
      ...input.snapshot.source_refs.work_ids.map((id) => `work:${id}`),
      ...input.snapshot.source_refs.work_event_ids.map((id) => `work_event:${id}`),
      ...input.snapshot.source_refs.evidence_ids.map(
        (id) => `evidence_record:${id}`,
      ),
      ...input.snapshot.source_refs.action_record_ids.map(
        (id) => `action_record:${id}`,
      ),
      ...input.snapshot.source_refs.tension_ids.map((id) => `tension:${id}`),
    ],
    staleness_status: "fresh",
    freshness_notes: [
      "SnapshotRef mirrors the supplied PerspectiveSnapshot input.",
      "Current Working Perspective does not persist this ref.",
    ],
  };

  return {
    perspective_snapshot: {
      snapshot_version: input.snapshot.snapshot_version,
      as_of: input.snapshot.as_of,
      source_refs: {
        ...input.snapshot.source_refs,
        execution_lane_ids: [...input.snapshot.source_refs.execution_lane_ids],
      },
    },
    delta_projection: {
      projection_version: deltaProjection.projection_version,
      as_of: deltaProjection.as_of,
      source_refs: cloneProjectionSourceRefs(deltaProjection),
      source_counts: { ...deltaProjection.source_counts },
      delta_ids: deltaProjection.deltas.map((delta) => delta.delta_id),
      batch_ids: deltaProjection.batches.map((batch) => batch.batch_id),
      gap_codes: deltaProjection.gaps.map((gap) => gap.code),
    },
    snapshot_refs: uniqueSnapshotRefs([
      syntheticSnapshotRef,
      ...deltaProjection.source_refs.snapshot_refs,
    ]),
    diagnostic_refs: uniqueDiagnosticRefs([
      ...deltaProjection.source_refs.diagnostic_refs,
      ...buildSnapshotDiagnosticRefs(input.snapshot),
    ]),
    project_constellation_refs: uniqueSorted(input.project_constellation_refs ?? []),
  };
}

export function buildCurrentPerspectiveReviewQueueHints(
  deltaProjection: AugnesDeltaProjectionReadModel,
): CurrentWorkingPerspectiveReviewQueueHints {
  const deltas = deltaProjection.deltas;

  return {
    needs_review_delta_ids: deltas
      .filter((delta) => delta.status === "needs_review")
      .map((delta) => delta.delta_id),
    blocked_delta_ids: deltas
      .filter((delta) => delta.merge_policy.mode === "blocked")
      .map((delta) => delta.delta_id),
    manual_review_delta_ids: deltas
      .filter((delta) => delta.merge_policy.mode === "manual_review_required")
      .map((delta) => delta.delta_id),
    validation_required_delta_ids: deltas
      .filter((delta) => delta.merge_policy.requires_validation)
      .map((delta) => delta.delta_id),
    project_perspective_review_delta_ids: deltas
      .filter(
        (delta) =>
          delta.merge_policy.mode ===
          "review_required_for_project_perspective",
      )
      .map((delta) => delta.delta_id),
    durable_memory_review_delta_ids: deltas
      .filter(
        (delta) =>
          delta.merge_policy.mode === "review_required_for_durable_memory",
      )
      .map((delta) => delta.delta_id),
    user_decision_delta_ids: deltas
      .filter((delta) => delta.type === "user_decision_delta")
      .map((delta) => delta.delta_id),
    notes: [
      "Review queue hints are advisory read-model metadata only.",
      "Hints do not approve, reject, apply, merge, publish, retry, replay, or deploy.",
    ],
  };
}

export function buildCurrentPerspectiveStaleness({
  snapshot,
  deltaProjection,
  gaps,
}: {
  snapshot: CurrentWorkingPerspectiveSnapshotInput;
  deltaProjection: AugnesDeltaProjectionReadModel;
  gaps: CurrentWorkingPerspectiveGap[];
}): CurrentWorkingPerspectiveStaleness {
  const sourceGapCodes = gaps.map((gap) => gap.code);
  const hasHighGap = gaps.some((gap) => gap.severity === "high");
  const hasMediumGap = gaps.some((gap) => gap.severity === "medium");
  const status = hasHighGap || hasMediumGap ? "partial" : "fresh";

  return {
    status,
    snapshot_as_of: snapshot.as_of,
    projection_as_of: deltaProjection.as_of,
    freshness_notes: [
      status === "fresh"
        ? "PerspectiveSnapshot and Delta Projection inputs are both present."
        : "One or more source gaps make this packet partial.",
      "Freshness is read-model metadata only and grants no approval.",
    ],
    source_gap_codes: sourceGapCodes,
  };
}

export function createCurrentWorkingPerspectiveGap({
  code,
  severity,
  summary,
  source_refs = [],
  inherited_projection_gap,
}: {
  code: string;
  severity: CurrentWorkingPerspectiveGapSeverity;
  summary: string;
  source_refs?: string[];
  inherited_projection_gap?: CurrentWorkingPerspectiveGap["inherited_projection_gap"];
}): CurrentWorkingPerspectiveGap {
  return {
    code,
    severity,
    summary,
    source_refs,
    inherited_projection_gap,
  };
}

function buildCurrentThesis({
  snapshot,
  deltaProjection,
}: {
  snapshot: CurrentWorkingPerspectiveSnapshotInput;
  deltaProjection: AugnesDeltaProjectionReadModel;
}): CurrentWorkingPerspectiveThesis {
  return {
    summary: snapshot.current_frame.summary,
    supporting_points: [
      snapshot.committed_state_basis.summary,
      snapshot.work_trace_basis.summary_reason,
      `Delta projection currently exposes ${deltaProjection.deltas.length} deltas across ${deltaProjection.batches.length} batches.`,
      `Projection gap count: ${deltaProjection.gaps.length}.`,
    ],
    source_refs: [
      `perspective_snapshot:${snapshot.as_of}`,
      `augnes_delta_projection:${deltaProjection.as_of}`,
    ],
    confidence:
      deltaProjection.gaps.some((gap) => gap.severity === "high") ||
      snapshot.missing_context.length > 0
        ? "partial"
        : "bounded_read_model",
    non_authority_notes: [
      "Thesis is synthesized from read models only.",
      "Thesis is not a durable user preference or committed project fact.",
      "Projected deltas are inputs, not source-of-truth state.",
    ],
  };
}

function buildActiveGoals(
  snapshot: CurrentWorkingPerspectiveSnapshotInput,
): CurrentWorkingPerspectiveGoal[] {
  return snapshot.work_trace_basis.active.map((work) => ({
    goal_id: work.work_id,
    title: work.title,
    status: work.status,
    priority: work.priority,
    summary: work.summary,
    next_action: work.next_action,
    source_refs: uniqueSorted([
      `work:${work.work_id}`,
      ...work.recent_events.map((event) => `work_event:${event.id}`),
      ...work.related_state_keys.map((key) => `state_key:${key}`),
    ]),
    user_attention_required: work.user_attention_required,
  }));
}

function buildAcceptedAssumptions(
  snapshot: CurrentWorkingPerspectiveSnapshotInput,
): CurrentWorkingPerspectiveAssumption[] {
  const stateBasis = [
    ...snapshot.committed_state_basis.active,
    ...snapshot.committed_state_basis.future,
    ...snapshot.committed_state_basis.completed,
  ].slice(0, MAX_ACCEPTED_ASSUMPTIONS);

  return stateBasis.map((item) => ({
    assumption_id: `assumption.committed_state.${safeId(item.id)}`,
    assumption_kind: "committed_state_basis",
    summary: `Committed state basis includes ${item.state_key}.`,
    source_refs: uniqueSorted([
      `state_entry:${item.id}`,
      `state_key:${item.state_key}`,
      item.source_agent_id ? `agent:${item.source_agent_id}` : null,
      item.source_session_id ? `session:${item.source_session_id}` : null,
    ]),
    durability: "committed_state_ref",
    non_authority_notes: [
      "Assumption is a reference to existing committed state basis only.",
      "Current Working Perspective does not commit or mutate this assumption.",
    ],
  }));
}

function buildRejectedAssumptions(
  deltaProjection: AugnesDeltaProjectionReadModel,
): CurrentWorkingPerspectiveAssumption[] {
  return deltaProjection.deltas
    .filter((delta) => delta.status === "rejected")
    .slice(0, MAX_REJECTED_ASSUMPTIONS)
    .map((delta) => ({
      assumption_id: `assumption.rejected_delta.${safeId(delta.delta_id)}`,
      assumption_kind: "delta_rejected",
      summary: `Rejected projected delta: ${delta.title}.`,
      source_refs: uniqueSorted([
        `augnes_delta:${delta.delta_id}`,
        ...delta.target_refs,
      ]),
      durability: "projection_metadata",
      non_authority_notes: [
        "Rejected delta status is review metadata from the projection.",
        "Current Working Perspective does not restore or recommit rejected inputs.",
      ],
    }));
}

function buildOpenQuestions({
  snapshot,
  gaps,
}: {
  snapshot: CurrentWorkingPerspectiveSnapshotInput;
  gaps: CurrentWorkingPerspectiveGap[];
}): CurrentWorkingPerspectiveOpenQuestion[] {
  const missingContextQuestions = snapshot.missing_context.map((summary, index) => ({
    question_id: `question.missing_context.${index + 1}`,
    summary,
    severity: "medium" as const,
    source_refs: [`perspective_snapshot:${snapshot.as_of}`],
    suggested_review_path:
      "Review missing context before treating the current frame as complete.",
  }));
  const tensionQuestions = snapshot.open_tensions.items.map((tension) => ({
    question_id: `question.tension.${safeId(tension.id)}`,
    summary: tension.title,
    severity: mapSeverity(tension.severity),
    source_refs: uniqueSorted([
      `tension:${tension.id}`,
      tension.state_key ? `state_key:${tension.state_key}` : null,
    ]),
    suggested_review_path:
      "Review open tension in PerspectiveSnapshot before promoting any related delta.",
  }));
  const gapQuestions = gaps
    .filter((gap) => gap.severity !== "low")
    .map((gap) => ({
      question_id: `question.gap.${safeId(gap.code)}`,
      summary: gap.summary,
      severity: gap.severity,
      source_refs: [...gap.source_refs],
      suggested_review_path:
        "Resolve or accept the source gap before relying on downstream consumers.",
    }));

  return [...missingContextQuestions, ...tensionQuestions, ...gapQuestions].slice(
    0,
    MAX_OPEN_QUESTIONS,
  );
}

function buildActiveRisks({
  snapshot,
  deltaProjection,
  gaps,
}: {
  snapshot: CurrentWorkingPerspectiveSnapshotInput;
  deltaProjection: AugnesDeltaProjectionReadModel;
  gaps: CurrentWorkingPerspectiveGap[];
}): CurrentWorkingPerspectiveRisk[] {
  const tensionRisks = snapshot.open_tensions.items.map((tension) => ({
    risk_id: `risk.tension.${safeId(tension.id)}`,
    summary: tension.description || tension.title,
    severity: mapSeverity(tension.severity),
    source_refs: uniqueSorted([
      `tension:${tension.id}`,
      tension.state_key ? `state_key:${tension.state_key}` : null,
    ]),
    blocked_authority_notes: [
      "Open tension is review context only.",
      "It grants no apply, approval, or state mutation authority.",
    ],
  }));
  const blockedDeltaRisks = deltaProjection.deltas
    .filter((delta) => delta.merge_policy.mode === "blocked")
    .map((delta) => ({
      risk_id: `risk.blocked_delta.${safeId(delta.delta_id)}`,
      summary: delta.merge_policy.blocked_reason,
      severity: "medium" as const,
      source_refs: [`augnes_delta:${delta.delta_id}`],
      blocked_authority_notes: [
        "Blocked delta remains non-applicable in this read model.",
        "Future authority requires an explicit contract.",
      ],
    }));
  const gapRisks = gaps
    .filter((gap) => gap.severity !== "low")
    .map((gap) => ({
      risk_id: `risk.gap.${safeId(gap.code)}`,
      summary: gap.summary,
      severity: gap.severity,
      source_refs: [...gap.source_refs],
      blocked_authority_notes: [
        "Source gap limits downstream confidence.",
        "Gap does not authorize reconstruction from missing text.",
      ],
    }));

  return [...tensionRisks, ...blockedDeltaRisks, ...gapRisks].slice(
    0,
    MAX_ACTIVE_RISKS,
  );
}

function buildResearchPressure({
  snapshot,
  deltaProjection,
  sourceRefs,
}: {
  snapshot: CurrentWorkingPerspectiveSnapshotInput;
  deltaProjection: AugnesDeltaProjectionReadModel;
  sourceRefs: CurrentWorkingPerspectiveSourceRefs;
}): CurrentWorkingPerspectiveResearchPressure {
  const projectionGapPressure = pressureFromProjectionGaps(
    deltaProjection.gaps,
  );

  return {
    pressure_level: maxPressureLevel([
      snapshot.pending_proposal_pressure.pressure_level,
      snapshot.research_diagnostics.loopness_hint.level,
      projectionGapPressure,
    ]),
    pending_proposal_count: snapshot.pending_proposal_pressure.count,
    projection_gap_count: deltaProjection.gaps.length,
    diagnostic_refs: sourceRefs.diagnostic_refs,
    notes: [
      snapshot.pending_proposal_pressure.summary_reason,
      `Loopness hint level: ${snapshot.research_diagnostics.loopness_hint.level}.`,
      `Projection gaps: ${deltaProjection.gaps.length}.`,
    ],
    non_authority_notes: [
      "Research diagnostics are log-only.",
      "Research pressure is not truth, proof, approval, readiness, or committed Perspective state.",
      "Research pressure does not change proposal scoring or commit/reject authority.",
    ],
  };
}

function pressureFromProjectionGaps(
  gaps: AugnesDeltaProjectionReadModel["gaps"],
): CurrentWorkingPerspectiveResearchPressure["pressure_level"] {
  if (gaps.length === 0) {
    return "none";
  }

  if (gaps.some((gap) => gap.severity === "high")) {
    return "high";
  }

  if (gaps.some((gap) => gap.severity === "medium")) {
    return "medium";
  }

  return "low";
}

function buildNextCandidates({
  snapshot,
  deltaProjection,
}: {
  snapshot: CurrentWorkingPerspectiveSnapshotInput;
  deltaProjection: AugnesDeltaProjectionReadModel;
}): CurrentWorkingPerspectiveNextCandidate[] {
  const boundaryCandidate: CurrentWorkingPerspectiveNextCandidate = {
    candidate_id: "candidate.boundary_next",
    title: snapshot.boundary_next.title,
    rationale: snapshot.boundary_next.rationale,
    priority: snapshot.boundary_next.priority,
    source_refs: uniqueSorted([
      `perspective_snapshot:${snapshot.as_of}`,
      ...snapshot.boundary_next.related_state_keys.map((key) => `state_key:${key}`),
    ]),
    allowed_next_steps: [...snapshot.boundary_next.allowed_next_steps],
    blocked_next_steps: [...snapshot.boundary_next.forbidden_next_steps],
    authority_required: "manual_review",
  };
  const deltaCandidates = deltaProjection.deltas
    .filter((delta) => delta.status === "needs_review")
    .slice(0, MAX_NEXT_CANDIDATES - 1)
    .map((delta): CurrentWorkingPerspectiveNextCandidate => ({
      candidate_id: `candidate.delta_review.${safeId(delta.delta_id)}`,
      title: `Review ${delta.title}`,
      rationale: delta.summary,
      priority: delta.merge_policy.requires_user_judgment ? "review" : "normal",
      source_refs: [`augnes_delta:${delta.delta_id}`],
      allowed_next_steps: ["Inspect projected delta and source refs."],
      blocked_next_steps: [
        "Do not apply, approve, merge, publish, write proof/evidence, or mutate memory from this packet.",
      ],
      authority_required:
        delta.merge_policy.mode === "blocked"
          ? "future_contract"
          : "manual_review",
    }));

  return [boundaryCandidate, ...deltaCandidates].slice(0, MAX_NEXT_CANDIDATES);
}

function buildLastMajorDeltaRefs(
  deltaProjection: AugnesDeltaProjectionReadModel,
): CurrentWorkingPerspectiveDeltaRef[] {
  return [...deltaProjection.deltas]
    .sort(compareDeltaByCreatedAtDesc)
    .slice(0, MAX_DELTA_REFS)
    .map((delta) => ({
      delta_id: delta.delta_id,
      type: delta.type,
      status: delta.status,
      source: delta.source,
      title: delta.title,
      created_at: delta.created_at,
      source_refs: uniqueSorted([`augnes_delta:${delta.delta_id}`, ...delta.target_refs]),
      review_reason: buildDeltaReviewReason(delta),
    }));
}

function buildCurrentPerspectiveGaps(
  input: CurrentWorkingPerspectiveInput,
): CurrentWorkingPerspectiveGap[] {
  const gaps: CurrentWorkingPerspectiveGap[] = [];

  if (input.snapshot.scope !== input.delta_projection.scope) {
    gaps.push(
      createCurrentWorkingPerspectiveGap({
        code: "scope_mismatch",
        severity: "high",
        summary:
          "PerspectiveSnapshot and AugnesDeltaProjectionReadModel scopes do not match.",
        source_refs: [
          `snapshot_scope:${input.snapshot.scope}`,
          `projection_scope:${input.delta_projection.scope}`,
        ],
      }),
    );
  }

  if (input.delta_projection.deltas.length === 0) {
    gaps.push(
      createCurrentWorkingPerspectiveGap({
        code: "delta_projection_empty",
        severity: "medium",
        summary:
          "Delta Projection Read Model produced no deltas for Current Working Perspective.",
        source_refs: [`augnes_delta_projection:${input.delta_projection.as_of}`],
      }),
    );
  }

  for (const gap of input.delta_projection.gaps) {
    gaps.push(
      createCurrentWorkingPerspectiveGap({
        code: `delta_projection.${gap.code}`,
        severity: gap.severity,
        summary: gap.summary,
        source_refs: [...gap.source_refs],
        inherited_projection_gap: gap,
      }),
    );
  }

  return gaps;
}

function buildSnapshotDiagnosticRefs(
  snapshot: CurrentWorkingPerspectiveSnapshotInput,
): ResearchDiagnosticRef[] {
  return [
    {
      diagnostic_id: `diagnostic.perspective_snapshot.loopness.${safeId(snapshot.scope)}`,
      diagnostic_kind: "perspective_snapshot_loopness_hint",
      source_ref: `perspective_snapshot:${snapshot.as_of}`,
      summary: `PerspectiveSnapshot loopness hint level is ${snapshot.research_diagnostics.loopness_hint.level}.`,
      status: "log_only",
      non_authority_notes: [
        "not truth",
        "not proof",
        "not approval",
        "not readiness",
        "not committed Perspective state",
      ],
      informs_delta_ids: [],
    },
  ];
}

function cloneProjectionSourceRefs(
  deltaProjection: AugnesDeltaProjectionReadModel,
): AugnesDeltaProjectionReadModel["source_refs"] {
  return {
    state_delta_proposal_ids: [
      ...deltaProjection.source_refs.state_delta_proposal_ids,
    ],
    work_event_ids: [...deltaProjection.source_refs.work_event_ids],
    coordination_event_ids: [
      ...deltaProjection.source_refs.coordination_event_ids,
    ],
    action_record_ids: [...deltaProjection.source_refs.action_record_ids],
    evidence_record_ids: [...deltaProjection.source_refs.evidence_record_ids],
    dogfooding_record_ids: [
      ...deltaProjection.source_refs.dogfooding_record_ids,
    ],
    handoff_refs: [...deltaProjection.source_refs.handoff_refs],
    codex_result_refs: [...deltaProjection.source_refs.codex_result_refs],
    snapshot_refs: [...deltaProjection.source_refs.snapshot_refs],
    diagnostic_refs: [...deltaProjection.source_refs.diagnostic_refs],
  };
}

function uniqueSnapshotRefs(refs: SnapshotRef[]): SnapshotRef[] {
  const byId = new Map<string, SnapshotRef>();

  for (const ref of refs) {
    byId.set(ref.snapshot_id, ref);
  }

  return [...byId.values()].sort((left, right) =>
    left.snapshot_id.localeCompare(right.snapshot_id),
  );
}

function uniqueDiagnosticRefs(refs: ResearchDiagnosticRef[]): ResearchDiagnosticRef[] {
  const byId = new Map<string, ResearchDiagnosticRef>();

  for (const ref of refs) {
    byId.set(ref.diagnostic_id, ref);
  }

  return [...byId.values()].sort((left, right) =>
    left.diagnostic_id.localeCompare(right.diagnostic_id),
  );
}

function buildDeltaReviewReason(delta: AugnesDelta): string {
  if (delta.merge_policy.mode === "blocked") {
    return delta.merge_policy.blocked_reason;
  }

  if (delta.merge_policy.requires_user_judgment) {
    return "Delta requires user judgment before any future apply path.";
  }

  if (delta.merge_policy.requires_validation) {
    return "Delta requires validation before downstream use.";
  }

  return "Delta is included as read-model context only.";
}

function compareDeltaByCreatedAtDesc(left: AugnesDelta, right: AugnesDelta): number {
  const byCreatedAt = right.created_at.localeCompare(left.created_at);
  return byCreatedAt || left.delta_id.localeCompare(right.delta_id);
}

function maxIso(...values: Array<string | null | undefined>): string {
  const present = values.filter((value): value is string => Boolean(value));
  return present.length > 0
    ? present.sort((left, right) => right.localeCompare(left))[0]
    : FALLBACK_AS_OF;
}

function maxPressureLevel(
  levels: Array<"none" | "low" | "medium" | "high">,
): "none" | "low" | "medium" | "high" {
  const order = new Map([
    ["none", 0],
    ["low", 1],
    ["medium", 2],
    ["high", 3],
  ]);

  return levels.reduce((maxLevel, level) =>
    (order.get(level) ?? 0) > (order.get(maxLevel) ?? 0) ? level : maxLevel,
  );
}

function mapSeverity(value: string): CurrentWorkingPerspectiveGapSeverity {
  if (value === "high" || value === "critical") {
    return "high";
  }

  if (value === "medium") {
    return "medium";
  }

  return "low";
}

function safeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9._:-]+/g, "_");
}

function uniqueSorted(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
    .sort((left, right) => left.localeCompare(right));
}
