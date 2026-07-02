import type { AgentWorkplaneNodeContextRead } from "@/types/agent-workplane-node";
import type { AugnesDelta } from "@/types/augnes-delta";
import {
  WORKPLANE_REVIEW_MEMORY_DETAIL_VERSION,
  type WorkplaneReviewMemoryAuthorityBoundary,
  type WorkplaneReviewMemoryCandidate,
  type WorkplaneReviewMemoryCandidateKind,
  type WorkplaneReviewMemoryDecisionItem,
  type WorkplaneReviewMemoryDetailRead,
  type WorkplaneReviewMemoryGapDetail,
  type WorkplaneReviewMemoryLane,
  type WorkplaneReviewMemoryQueueSummary,
  type WorkplaneReviewMemoryStatus,
} from "@/types/workplane-review-memory-detail";
import type { WorkplaneContextRead } from "./read-workplane-context";

export const WORKPLANE_REVIEW_MEMORY_DETAIL_LANES = [
  "needs_review",
  "blocked",
  "manual_review",
  "validation_required",
  "project_perspective_review",
  "durable_memory_review",
  "user_decision",
  "unknown",
] as const satisfies readonly WorkplaneReviewMemoryLane[];

export const WORKPLANE_REVIEW_MEMORY_DETAIL_CANDIDATE_KINDS = [
  "delta_review",
  "durable_memory_candidate",
  "perspective_update_candidate",
  "validation_candidate",
  "user_judgment_candidate",
  "blocked_candidate",
  "handoff_candidate",
  "unknown",
] as const satisfies readonly WorkplaneReviewMemoryCandidateKind[];

export const WORKPLANE_REVIEW_MEMORY_DETAIL_REQUIRED_PANEL_IDS = [
  "review_queue",
  "review_memory_detail",
  "workplane_inspector",
  "source_ref_bridge",
  "legacy_cockpit_compatibility",
] as const;

export const WORKPLANE_REVIEW_MEMORY_DETAIL_SMOKE_REFS = [
  "smoke:agent-workplane-review-memory-detail-v0-1",
  "smoke:agent-workplane-node-contract-v0-1",
  "smoke:workplane-native-browser-regression-v0-1",
  "smoke:agent-workplane-bridge-trace-detail-v0-1",
] as const;

export type WorkplaneReviewMemoryDetailInput = {
  workplane_context: WorkplaneContextRead;
  node_context_read: AgentWorkplaneNodeContextRead;
};

export type ReadWorkplaneReviewMemoryDetailOptions =
  WorkplaneReviewMemoryDetailInput;

const REVIEW_MEMORY_AUTHORITY_BOUNDARY: WorkplaneReviewMemoryAuthorityBoundary = {
  surface: "agent_workplane_review_memory_detail",
  read_only_review_memory_detail: true,
  can_write_db: false,
  can_write_runner_ledger: false,
  can_record_proof: false,
  can_create_evidence: false,
  can_update_work: false,
  can_mutate_memory: false,
  can_apply_project_perspective: false,
  can_apply_durable_memory: false,
  can_auto_apply_delta: false,
  can_call_provider_openai: false,
  can_call_github: false,
  can_actuate_github: false,
  can_execute_codex: false,
  can_execute_runner: false,
  can_schedule_runner: false,
  can_recover_delta_batch: false,
  can_create_branch_or_pr: false,
  can_send_handoff: false,
  can_merge_publish_retry_replay_deploy: false,
  can_delete_or_shrink_legacy_cockpit: false,
  can_hide_legacy_cockpit: false,
  notes: [
    "Review / memory proposal detail is read-only visibility only.",
    "It can display durable memory review candidates and Perspective review candidates, but it cannot apply durable memory, apply Perspective, auto-apply deltas, approve, reject, commit, or mutate proposal state.",
    "It does not write DB state, write runner ledger state, record proof, create evidence, update work, mutate memory, call providers, call GitHub, actuate GitHub, execute Codex, execute runner, schedule runner, recover DeltaBatch, create branches or PRs, send handoffs, merge, publish, retry, replay, deploy, delete Legacy Cockpit, shrink Legacy Cockpit, or hide Legacy Cockpit.",
    "Legacy Cockpit compatibility remains rendered for rollback and detailed legacy review context.",
  ],
};

export function readWorkplaneReviewMemoryDetail(
  options: ReadWorkplaneReviewMemoryDetailOptions,
): WorkplaneReviewMemoryDetailRead {
  return buildWorkplaneReviewMemoryDetailRead(options);
}

export function buildWorkplaneReviewMemoryDetailRead(
  input: WorkplaneReviewMemoryDetailInput,
): WorkplaneReviewMemoryDetailRead {
  const context = input.workplane_context;
  const nodeContext = input.node_context_read;
  const queueSummary = buildQueueSummary(context);
  const candidates = buildCandidates(context, nodeContext);
  const decisionItems = buildDecisionItems(candidates);
  const gapDetails = buildGapDetails(context);
  const sourceRefs = uniqueStrings([
    ...candidates.flatMap((candidate) => candidate.source_refs),
    ...decisionItems.flatMap((item) => item.source_refs),
    ...gapDetails.flatMap((gap) => gap.source_refs),
    "docs:AGENT_WORKPLANE_REVIEW_MEMORY_DETAIL_V0_1.md",
    "legacy_cockpit_compatibility:retained",
  ]);

  return {
    version: WORKPLANE_REVIEW_MEMORY_DETAIL_VERSION,
    status: summarizeStatus(context, candidates),
    scope: context.overview.scope,
    as_of: chooseLatestTimestamp(
      context.current_perspective_read.data.as_of,
      context.delta_projection_read.data.as_of,
    ),
    queue_summary: queueSummary,
    candidates,
    durable_memory_review_candidates: candidatesForLane(
      candidates,
      "durable_memory_review",
    ),
    perspective_update_candidates: candidatesForLane(
      candidates,
      "project_perspective_review",
    ),
    validation_required_candidates: candidatesForLane(
      candidates,
      "validation_required",
    ),
    user_decision_candidates: candidatesForLane(candidates, "user_decision"),
    blocked_candidates: candidatesForLane(candidates, "blocked"),
    decision_items: decisionItems,
    gap_details: gapDetails,
    authority_boundary: REVIEW_MEMORY_AUTHORITY_BOUNDARY,
    source_refs: sourceRefs,
    fallback_notes: buildFallbackNotes(context),
    staleness_notes: buildStalenessNotes(context),
    validation_summary: {
      status: "partial",
      smoke_refs: [...WORKPLANE_REVIEW_MEMORY_DETAIL_SMOKE_REFS],
      notes: [
        "Review/memory detail names smoke:agent-workplane-review-memory-detail-v0-1 as its native detail validation.",
        "Browser regression can inspect the review_memory_detail panel marker and review/memory no-apply copy.",
        "This validation summary is evidence for review, not apply authority and not shrink authority.",
      ],
    },
    notes: [
      "Built from WorkplaneContextRead and AgentWorkplaneNodeContextRead only.",
      "No runner lifecycle helper, DeltaBatch recovery write, route call, fetch, provider call, GitHub call, Codex execution, DB write, proof/evidence write, memory apply, Perspective apply, delta auto-apply, or Legacy Cockpit shrink is performed.",
      "Source-backed Run Postmortem fields remain an explicit gap for the next phase.",
    ],
  };
}

function buildQueueSummary(
  context: WorkplaneContextRead,
): WorkplaneReviewMemoryQueueSummary {
  const summary = context.overview.review_queue;
  const hints = context.current_perspective_read.data.review_queue_hints;

  return {
    needs_review_count: summary.needs_review_count,
    blocked_count: summary.blocked_count,
    manual_review_count: summary.manual_review_count,
    validation_required_count: summary.validation_required_count,
    project_perspective_review_count:
      summary.project_perspective_review_count,
    durable_memory_review_count: summary.durable_memory_review_count,
    user_decision_count: summary.user_decision_count,
    total_attention_count: summary.total_attention_count,
    lane_counts: {
      needs_review: hints.needs_review_delta_ids.length,
      blocked: hints.blocked_delta_ids.length,
      manual_review: hints.manual_review_delta_ids.length,
      validation_required: hints.validation_required_delta_ids.length,
      project_perspective_review:
        hints.project_perspective_review_delta_ids.length,
      durable_memory_review: hints.durable_memory_review_delta_ids.length,
      user_decision: hints.user_decision_delta_ids.length,
      unknown: 0,
    },
    notes: [
      ...hints.notes,
      "Queue summary is read-only review pressure, not approval, apply, or proposal mutation.",
    ],
  };
}

function buildCandidates(
  context: WorkplaneContextRead,
  nodeContext: AgentWorkplaneNodeContextRead,
): WorkplaneReviewMemoryCandidate[] {
  const hints = context.current_perspective_read.data.review_queue_hints;
  const deltaById = new Map(
    context.delta_projection_read.data.deltas.map((delta) => [
      delta.delta_id,
      delta,
    ]),
  );
  const laneEntries: Array<[WorkplaneReviewMemoryLane, string[]]> = [
    ["needs_review", hints.needs_review_delta_ids],
    ["blocked", hints.blocked_delta_ids],
    ["manual_review", hints.manual_review_delta_ids],
    ["validation_required", hints.validation_required_delta_ids],
    [
      "project_perspective_review",
      hints.project_perspective_review_delta_ids,
    ],
    ["durable_memory_review", hints.durable_memory_review_delta_ids],
    ["user_decision", hints.user_decision_delta_ids],
  ];
  const candidates: WorkplaneReviewMemoryCandidate[] = [];

  for (const [lane, ids] of laneEntries) {
    if (ids.length === 0) {
      candidates.push(emptyLaneCandidate(lane, context, nodeContext));
      continue;
    }

    for (const deltaId of ids) {
      candidates.push(
        candidateFromDelta({
          lane,
          deltaId,
          delta: deltaById.get(deltaId),
          context,
          nodeContext,
        }),
      );
    }
  }

  return dedupeCandidates(candidates);
}

function candidateFromDelta({
  lane,
  deltaId,
  delta,
  context,
  nodeContext,
}: {
  lane: WorkplaneReviewMemoryLane;
  deltaId: string;
  delta: AugnesDelta | undefined;
  context: WorkplaneContextRead;
  nodeContext: AgentWorkplaneNodeContextRead;
}): WorkplaneReviewMemoryCandidate {
  const sourceRefs = delta
    ? sourceRefsForDelta(delta, context, nodeContext)
    : sourceRefsForMissingDelta(deltaId, context, nodeContext);
  const validation = validationFromDelta(delta);
  const needsJudgment = delta
    ? needsJudgmentForDelta(delta, lane)
    : [`${deltaId} is listed in ${lane} but no projected delta detail is materialized.`];

  return {
    candidate_id: `review_memory_detail:${lane}:${deltaId}`,
    candidate_kind: candidateKindForLane(lane, delta),
    lane,
    title: delta?.title ?? `${labelForLane(lane)} candidate ${deltaId}`,
    summary:
      delta?.summary ??
      `${deltaId} is present in the ${lane} review queue lane, but no Delta Projection detail was found.`,
    status: delta ? statusForDelta(delta, lane) : "insufficient_data",
    delta_id: deltaId,
    source_refs: sourceRefs,
    evidence_refs: delta?.evidence_refs.map((ref) => ref.evidence_ref) ?? [],
    artifact_refs: delta?.artifact_refs.map((ref) => ref.artifact_ref) ?? [],
    handoff_refs: delta?.handoff_refs.map((ref) => ref.handoff_ref) ?? [],
    diagnostic_refs:
      delta?.diagnostic_refs.map((ref) => ref.diagnostic_id) ?? [],
    validation_summary: validation,
    merge_policy_summary: delta ? mergePolicySummary(delta) : null,
    non_goals: delta?.non_goals ?? [
      "Missing Delta Projection detail must not be treated as approval or apply readiness.",
    ],
    needs_user_judgment: needsJudgment,
    authority_notes: authorityNotesForDelta(delta, lane),
  };
}

function emptyLaneCandidate(
  lane: WorkplaneReviewMemoryLane,
  context: WorkplaneContextRead,
  nodeContext: AgentWorkplaneNodeContextRead,
): WorkplaneReviewMemoryCandidate {
  return {
    candidate_id: `review_memory_detail:${lane}:empty`,
    candidate_kind: candidateKindForLane(lane),
    lane,
    title: `${labelForLane(lane)} lane empty`,
    summary: `No ${labelForLane(lane)} candidates are materialized in the current Workplane review queue.`,
    status: "empty",
    delta_id: null,
    source_refs: sourceRefsForLane(lane, context, nodeContext),
    evidence_refs: [],
    artifact_refs: [],
    handoff_refs: [],
    diagnostic_refs: [],
    validation_summary: {
      status: "insufficient_data",
      required_checks: [...WORKPLANE_REVIEW_MEMORY_DETAIL_SMOKE_REFS],
      completed_checks: [],
      failed_checks: [],
      skipped_checks: [
        {
          check: `materialized_${lane}_candidate_detail`,
          reason: "No candidate refs are present for this lane.",
        },
      ],
      notes: [
        "Empty lane is explicit so browser regression and GuideBrief debug can see the review/memory lane without inventing an apply action.",
      ],
    },
    merge_policy_summary: null,
    non_goals: [
      "Empty review lanes do not imply approval.",
      "Empty review lanes do not authorize durable memory apply, Perspective apply, or delta auto-apply.",
    ],
    needs_user_judgment: [
      "If this lane is expected to contain proposals, refresh or inspect source refs outside product write authority.",
    ],
    authority_notes: [
      "Read-only empty lane disclosure only; no proposal apply or mutation authority.",
    ],
  };
}

function buildDecisionItems(
  candidates: WorkplaneReviewMemoryCandidate[],
): WorkplaneReviewMemoryDecisionItem[] {
  return candidates
    .filter(
      (candidate) =>
        candidate.lane === "user_decision" ||
        candidate.needs_user_judgment.length > 0 ||
        candidate.status === "needs_review",
    )
    .map((candidate) => ({
      decision_id: `decision:${candidate.candidate_id}`,
      lane: candidate.lane,
      candidate_id: candidate.candidate_id,
      delta_id: candidate.delta_id,
      title: candidate.title,
      summary:
        candidate.needs_user_judgment[0] ??
        "Candidate requires user judgment before any future apply-like action outside this panel.",
      status: candidate.status,
      required_user_judgment: candidate.needs_user_judgment.length > 0,
      source_refs: candidate.source_refs,
    }));
}

function buildGapDetails(
  context: WorkplaneContextRead,
): WorkplaneReviewMemoryGapDetail[] {
  return [
    {
      gap_id: "missing_native_durable_memory_proposal_apply_detail",
      status: "needs_review",
      summary:
        "Native review/memory detail shows durable memory review candidates as visibility only; it does not define or add durable memory apply detail.",
      required_next_step:
        "Keep apply authority out of Workplane; define any future durable memory apply review in a separate authority PR.",
      source_refs: [
        "docs:AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_PLAN_V0_1.md",
        "docs:AGENT_WORKPLANE_REVIEW_MEMORY_DETAIL_V0_1.md",
      ],
    },
    {
      gap_id: "missing_source_backed_run_postmortem_detail",
      status: "needs_review",
      summary:
        "Run Postmortem remains a skeleton and still needs source-backed fields before work/run compatibility can shrink.",
      required_next_step:
        "Implement source-backed Run Postmortem detail hardening before any Legacy Cockpit deletion candidate.",
      source_refs: [
        "docs:AGENT_WORKPLANE_BRIDGE_TRACE_DETAIL_V0_1.md",
        `runner_delta_batch:${context.runner_delta_batch_read.latest_batch_id ?? "none"}`,
      ],
    },
    {
      gap_id: "missing_richer_proposal_diff_detail",
      status:
        context.overview.review_queue.total_attention_count > 0
          ? "partial"
          : "insufficient_data",
      summary:
        "Review/memory candidates expose delta summaries, refs, merge policy, and non-goals, but not a rich proposal diff view.",
      required_next_step:
        "Add richer proposal diff detail only as read-only context if future review shows it is needed.",
      source_refs: [
        `current_perspective:${context.current_perspective_read.data.as_of}`,
        `delta_projection:${context.delta_projection_read.data.as_of}`,
      ],
    },
  ];
}

function validationFromDelta(delta?: AugnesDelta) {
  const summary = delta?.validation_summary;
  if (!summary) {
    return {
      status: "insufficient_data" as WorkplaneReviewMemoryStatus,
      required_checks: [...WORKPLANE_REVIEW_MEMORY_DETAIL_SMOKE_REFS],
      completed_checks: [],
      failed_checks: [],
      skipped_checks: [
        {
          check: "projected_delta_validation_summary",
          reason: "No delta validation summary is materialized.",
        },
      ],
      notes: [
        "Missing validation summary keeps the candidate in review context only.",
      ],
    };
  }

  return {
    status: statusFromValidation(summary.validation_status),
    required_checks: summary.required_checks,
    completed_checks: summary.completed_checks,
    failed_checks: summary.failed_checks,
    skipped_checks: summary.skipped_checks,
    notes: summary.notes,
  };
}

function sourceRefsForDelta(
  delta: AugnesDelta,
  context: WorkplaneContextRead,
  nodeContext: AgentWorkplaneNodeContextRead,
) {
  return uniqueStrings([
    `delta:${delta.delta_id}`,
    `delta_projection:${context.delta_projection_read.data.as_of}`,
    ...delta.target_refs,
    ...delta.snapshot_refs.map((ref) => `snapshot:${ref.snapshot_id}`),
    ...delta.diagnostic_refs.map((ref) => `diagnostic:${ref.diagnostic_id}`),
    ...delta.evidence_refs.map((ref) => `evidence:${ref.evidence_ref}`),
    ...delta.artifact_refs.map((ref) => `artifact:${ref.artifact_ref}`),
    ...delta.handoff_refs.map((ref) => `handoff:${ref.handoff_ref}`),
    ...nodeContext.panels
      .filter((panel) => panel.panel_id === "review_queue")
      .flatMap((panel) => panel.source_refs),
  ]);
}

function sourceRefsForMissingDelta(
  deltaId: string,
  context: WorkplaneContextRead,
  nodeContext: AgentWorkplaneNodeContextRead,
) {
  return uniqueStrings([
    `review_queue_delta_ref:${deltaId}`,
    `current_perspective:${context.current_perspective_read.data.as_of}`,
    ...nodeContext.panels
      .filter((panel) => panel.panel_id === "review_queue")
      .flatMap((panel) => panel.source_refs),
  ]);
}

function sourceRefsForLane(
  lane: WorkplaneReviewMemoryLane,
  context: WorkplaneContextRead,
  nodeContext: AgentWorkplaneNodeContextRead,
) {
  return uniqueStrings([
    `review_memory_lane:${lane}`,
    `current_perspective:${context.current_perspective_read.data.as_of}`,
    `delta_projection:${context.delta_projection_read.data.as_of}`,
    ...nodeContext.panels
      .filter(
        (panel) =>
          panel.panel_id === "review_queue" ||
          panel.panel_id === "review_memory_detail",
      )
      .flatMap((panel) => panel.source_refs),
  ]);
}

function needsJudgmentForDelta(
  delta: AugnesDelta,
  lane: WorkplaneReviewMemoryLane,
) {
  const needs: string[] = [];
  if (delta.merge_policy.requires_user_judgment || lane === "user_decision") {
    needs.push("needs user judgment before any future apply-like action.");
  }
  if (lane === "durable_memory_review") {
    needs.push("durable memory review candidate requires human/operator review; no durable memory apply is available here.");
  }
  if (lane === "project_perspective_review") {
    needs.push("Perspective review candidate requires human/operator review; no Perspective apply is available here.");
  }
  if (lane === "blocked") {
    needs.push(delta.merge_policy.blocked_reason || "blocked candidate needs review.");
  }
  if (delta.merge_policy.requires_validation) {
    needs.push("validation required before this candidate can be treated as ready.");
  }
  return uniqueStrings(needs);
}

function authorityNotesForDelta(
  delta: AugnesDelta | undefined,
  lane: WorkplaneReviewMemoryLane,
) {
  return uniqueStrings([
    "Review/memory detail is visibility only, not apply authority.",
    "No durable memory apply, Perspective apply, or delta auto-apply is available from this panel.",
    delta?.authority_boundary.notes.join(" ") ?? "No delta authority detail materialized.",
    lane === "durable_memory_review"
      ? "Durable memory candidate remains review-only."
      : "",
    lane === "project_perspective_review"
      ? "Perspective candidate remains review-only."
      : "",
  ].filter(Boolean));
}

function mergePolicySummary(delta: AugnesDelta) {
  const policy = delta.merge_policy;
  return [
    `mode=${policy.mode}`,
    `target_scope=${policy.target_scope}`,
    `allowed_auto_apply=${String(policy.allowed_auto_apply)}`,
    `requires_user_judgment=${String(policy.requires_user_judgment)}`,
    `requires_validation=${String(policy.requires_validation)}`,
    `durable_memory_allowed=${String(policy.durable_memory_allowed)}`,
    `project_perspective_allowed=${String(policy.project_perspective_allowed)}`,
    `external_side_effect_allowed=${String(policy.external_side_effect_allowed)}`,
    `blocked_reason=${policy.blocked_reason || "none"}`,
  ].join("; ");
}

function candidateKindForLane(
  lane: WorkplaneReviewMemoryLane,
  delta?: AugnesDelta,
): WorkplaneReviewMemoryCandidateKind {
  if (lane === "durable_memory_review") return "durable_memory_candidate";
  if (lane === "project_perspective_review") return "perspective_update_candidate";
  if (lane === "validation_required") return "validation_candidate";
  if (lane === "user_decision") return "user_judgment_candidate";
  if (lane === "blocked") return "blocked_candidate";
  if (delta && delta.handoff_refs.length > 0) return "handoff_candidate";
  if (lane === "needs_review" || lane === "manual_review") return "delta_review";
  return "unknown";
}

function statusForDelta(
  delta: AugnesDelta,
  lane: WorkplaneReviewMemoryLane,
): WorkplaneReviewMemoryStatus {
  if (lane === "blocked" || delta.merge_policy.mode === "blocked") {
    return "needs_review";
  }
  if (
    lane === "durable_memory_review" ||
    lane === "project_perspective_review" ||
    lane === "user_decision" ||
    delta.merge_policy.requires_user_judgment
  ) {
    return "needs_review";
  }
  if (delta.validation_summary?.validation_status === "passed") {
    return "ready";
  }
  return "partial";
}

function statusFromValidation(status: string): WorkplaneReviewMemoryStatus {
  if (status === "passed") return "ready";
  if (status === "failed") return "needs_review";
  if (status === "partial" || status === "skipped") return "partial";
  return "insufficient_data";
}

function candidatesForLane(
  candidates: WorkplaneReviewMemoryCandidate[],
  lane: WorkplaneReviewMemoryLane,
) {
  return candidates.filter((candidate) => candidate.lane === lane);
}

function summarizeStatus(
  context: WorkplaneContextRead,
  candidates: WorkplaneReviewMemoryCandidate[],
): WorkplaneReviewMemoryStatus {
  if (
    context.source_status.current_perspective !== "runtime" ||
    context.source_status.delta_projection !== "runtime"
  ) {
    return "fallback";
  }
  if (candidates.every((candidate) => candidate.status === "empty")) {
    return "empty";
  }
  if (candidates.some((candidate) => candidate.status === "needs_review")) {
    return "needs_review";
  }
  return "partial";
}

function buildFallbackNotes(context: WorkplaneContextRead) {
  return uniqueStrings([
    context.fallback_reason.current_perspective,
    context.fallback_reason.delta_projection,
    context.fallback_reason.runner_delta_batch,
    `source_status.current_perspective=${context.source_status.current_perspective}`,
    `source_status.delta_projection=${context.source_status.delta_projection}`,
    `source_status.runner_delta_batch=${context.source_status.runner_delta_batch}`,
  ].filter((note): note is string => Boolean(note)));
}

function buildStalenessNotes(context: WorkplaneContextRead) {
  const current = context.current_perspective_read.data;
  return uniqueStrings([
    `current_staleness=${current.staleness.status}`,
    `current_snapshot_as_of=${current.staleness.snapshot_as_of}`,
    `delta_projection_as_of=${context.delta_projection_read.data.as_of}`,
    ...current.staleness.freshness_notes,
  ]);
}

function labelForLane(lane: WorkplaneReviewMemoryLane) {
  return lane.replace(/_/g, " ");
}

function chooseLatestTimestamp(left: string, right: string) {
  const leftTime = Date.parse(left);
  const rightTime = Date.parse(right);
  if (!Number.isFinite(leftTime)) return right;
  if (!Number.isFinite(rightTime)) return left;
  return rightTime > leftTime ? right : left;
}

function dedupeCandidates(candidates: WorkplaneReviewMemoryCandidate[]) {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = `${candidate.lane}:${candidate.delta_id ?? candidate.candidate_id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueStrings(values: readonly string[]) {
  return [...new Set(values.filter(Boolean))].sort((left, right) =>
    left.localeCompare(right),
  );
}
