import type { AgentWorkplaneNodeContextRead } from "@/types/agent-workplane-node";
import type { AugnesDelta } from "@/types/augnes-delta";
import {
  WORKPLANE_STATE_PROPOSAL_REVIEW_GROUP_IDS,
  WORKPLANE_STATE_PROPOSAL_REVIEW_ITEM_KINDS,
  WORKPLANE_STATE_PROPOSAL_REVIEW_RISK_LEVELS,
  WORKPLANE_STATE_PROPOSAL_REVIEW_STATUSES,
  WORKPLANE_STATE_PROPOSAL_REVIEW_VERSION,
  type WorkplaneStateProposalReviewAuthorityBoundary,
  type WorkplaneStateProposalReviewGroup,
  type WorkplaneStateProposalReviewGroupId,
  type WorkplaneStateProposalReviewItem,
  type WorkplaneStateProposalReviewItemKind,
  type WorkplaneStateProposalReviewRead,
  type WorkplaneStateProposalReviewRiskLevel,
  type WorkplaneStateProposalReviewSourceStatus,
  type WorkplaneStateProposalReviewStatus,
} from "@/types/workplane-state-proposal-review";
import type {
  WorkplaneReviewMemoryCandidate,
  WorkplaneReviewMemoryDetailRead,
} from "@/types/workplane-review-memory-detail";
import type { WorkplaneContextRead } from "./read-workplane-context";

export const WORKPLANE_STATE_PROPOSAL_REVIEW_SMOKE_REFS = [
  "smoke:workplane-state-proposal-review-v0-1",
  "smoke:agent-workplane-node-contract-v0-1",
  "smoke:agent-workplane-panels-v0-1",
  "smoke:agent-workplane-review-memory-detail-v0-1",
  "smoke:legacy-cockpit-remaining-capability-migration-v0-1",
] as const;

export type WorkplaneStateProposalReviewInput = {
  workplane_context: WorkplaneContextRead;
  node_context_read: AgentWorkplaneNodeContextRead;
  review_memory_detail: WorkplaneReviewMemoryDetailRead;
};

const STATE_PROPOSAL_REVIEW_AUTHORITY_BOUNDARY: WorkplaneStateProposalReviewAuthorityBoundary = {
  surface: "workplane_state_proposal_review",
  marker: "read_only_no_apply",
  can_approve_proposal: false,
  can_reject_proposal: false,
  can_commit_proposal: false,
  can_apply_memory: false,
  can_apply_perspective: false,
  can_auto_apply_delta: false,
  can_write_product_db: false,
  can_create_evidence: false,
  can_record_proof: false,
  can_call_provider_openai: false,
  can_call_github: false,
  can_actuate_github: false,
  can_execute_codex: false,
  can_execute_runner: false,
  can_tick_runner: false,
  can_recover_delta_batch: false,
  can_schedule_runner: false,
  can_merge_publish_retry_replay_deploy: false,
  can_use_local_storage_durable_mode: false,
  notes: [
    "State Proposal Review is read-only review context for proposed state changes before they become durable state.",
    "It can show field-level diffs, before/after previews, source refs, impact, stale/fallback warnings, needs-user-judgment items, proposal history, and authority boundaries.",
    "It cannot approve, reject, commit, apply memory, apply Perspective, auto-apply deltas, write product DB state, create evidence, record proof, call providers, call GitHub, actuate GitHub, execute Codex, execute runner, tick runner, recover DeltaBatch, schedule runner, merge, publish, retry, replay, deploy, or use localStorage/sessionStorage as durable mode.",
  ],
};

export function buildWorkplaneStateProposalReviewRead({
  workplane_context,
  node_context_read,
  review_memory_detail,
}: WorkplaneStateProposalReviewInput): WorkplaneStateProposalReviewRead {
  const deltas = sortDeltasNewestFirst(
    workplane_context.delta_projection_read.data.deltas,
  );
  const sourceStatus = summarizeSourceStatus(workplane_context);
  const sourceRefs = collectSourceRefs({
    workplane_context,
    node_context_read,
    review_memory_detail,
  });
  const asOf = chooseLatestTimestamp(
    chooseLatestTimestamp(
      workplane_context.current_perspective_read.data.as_of,
      workplane_context.delta_projection_read.data.as_of,
    ),
    review_memory_detail.as_of,
  );

  const fieldLevelDiffs = fieldDiffItems(deltas, sourceRefs);
  const beforeAfterPreviews = beforeAfterItems(deltas, sourceRefs);
  const impactItems = impactReviewItems(deltas, sourceRefs);
  const memoryProposalReviews = reviewMemoryItems({
    candidates: review_memory_detail.durable_memory_review_candidates,
    item_kind: "memory_proposal",
    fallback_title: "Durable memory proposal review",
    fallback_summary:
      "No durable memory proposal refs are materialized in the current Workplane review context.",
    source_refs: sourceRefs,
  });
  const perspectiveLensReviews = reviewMemoryItems({
    candidates: review_memory_detail.perspective_update_candidates,
    item_kind: "perspective_lens",
    fallback_title: "Perspective lens detail review",
    fallback_summary:
      "No Perspective lens proposal refs are materialized; current frame detail is shown as review context.",
    source_refs: uniqueStrings([
      ...sourceRefs,
      ...workplane_context.current_perspective_read.data.current_frame.source_refs,
    ]),
  });
  const localDraftReviews = localDraftItems(deltas, sourceRefs);
  const manualPreviewReviews = [
    manualPreviewItem(sourceRefs),
    manualGravityItem(workplane_context, sourceRefs),
    formationBasisItem(workplane_context, sourceRefs),
  ];
  const proposalStatusHistory = proposalStatusHistoryItems(deltas, sourceRefs);
  const needsUserJudgment = needsUserJudgmentItems({
    review_memory_detail,
    workplane_context,
    source_refs: sourceRefs,
  });
  const staleFallbackWarnings = staleFallbackWarningItems({
    workplane_context,
    source_status: sourceStatus,
    source_refs: sourceRefs,
  });
  const authorityBoundaryItems = authorityBoundaryReviewItems(sourceRefs);

  const groups: WorkplaneStateProposalReviewGroup[] = [
    group({
      group_id: "field_level_proposal_diff",
      title: "Field-level proposal diff",
      summary:
        "Field-level diffs compare current read context with proposed state-change values before durable state changes.",
      review_items: fieldLevelDiffs,
      gaps:
        deltas.length > 0
          ? [
              "Exact committed before-values are not yet source-backed; v0.1 labels them as missing before-value previews.",
            ]
          : ["No projected deltas are materialized for field-level diff review."],
    }),
    group({
      group_id: "before_after_state_preview",
      title: "Before/after state preview",
      summary:
        "Before/after previews show expected state-change direction without applying deltas.",
      review_items: beforeAfterPreviews,
      gaps:
        deltas.length > 0
          ? [
              "Before snapshots are read-model summaries until richer proposal records are native.",
            ]
          : ["No before/after proposal preview rows are materialized."],
    }),
    group({
      group_id: "proposal_impact_analysis",
      title: "Proposal impact analysis",
      summary:
        "Impact rows summarize target refs, evidence refs, risk, and user judgment implications.",
      review_items: impactItems,
      gaps:
        deltas.length > 0
          ? []
          : ["No proposal impact rows are materialized from Delta Projection."],
    }),
    group({
      group_id: "memory_proposal_review",
      title: "Memory proposal review",
      summary:
        "Memory proposal review keeps durable memory candidates visible without apply authority.",
      review_items: memoryProposalReviews,
      gaps: gapsForCandidateItems(memoryProposalReviews),
    }),
    group({
      group_id: "perspective_lens_detail_edit",
      title: "Perspective lens detail",
      summary:
        "Perspective lens detail review shows frame/lens candidate context without durable Perspective apply.",
      review_items: perspectiveLensReviews,
      gaps: gapsForCandidateItems(perspectiveLensReviews),
    }),
    group({
      group_id: "local_draft_review",
      title: "Local draft review",
      summary:
        "Local draft review distinguishes draft proposal context from committed state.",
      review_items: localDraftReviews,
      gaps:
        localDraftReviews.some((item) => item.status === "empty")
          ? ["No draft-status projected deltas are materialized."]
          : [],
    }),
    group({
      group_id: "manual_preview_editor",
      title: "Manual preview editor",
      summary:
        "Manual preview keeps manually supplied preview material explicit as preview-only context.",
      review_items: [manualPreviewReviews[0]],
      gaps: ["No manual preview text source is materialized in Workplane v0.1."],
    }),
    group({
      group_id: "manual_gravity_preview",
      title: "Manual gravity preview",
      summary:
        "Manual gravity preview shows prioritization pressure without applying Perspective gravity.",
      review_items: [manualPreviewReviews[1]],
      gaps: [],
    }),
    group({
      group_id: "formation_basis_preview",
      title: "Formation basis preview",
      summary:
        "Formation basis preview shows the current frame basis and source refs before future formation changes.",
      review_items: [manualPreviewReviews[2]],
      gaps: [],
    }),
    group({
      group_id: "proposal_status_history",
      title: "Proposal status history",
      summary:
        "Proposal status history shows proposal lifecycle state without commit or reject controls.",
      review_items: proposalStatusHistory,
      gaps:
        proposalStatusHistory.some((item) => item.status === "empty")
          ? ["No proposal lifecycle rows are materialized from Delta Projection."]
          : [],
    }),
    group({
      group_id: "needs_user_judgment_lane",
      title: "Needs user judgment",
      summary:
        "Needs-user-judgment rows separate items that must wait for explicit user review.",
      review_items: needsUserJudgment,
      gaps:
        needsUserJudgment.some((item) => item.status === "empty")
          ? ["No user-judgment refs are materialized in the current read context."]
          : [],
    }),
    group({
      group_id: "stale_fallback_warning_review",
      title: "Stale and fallback warnings",
      summary:
        "Stale/fallback warnings keep source freshness and fallback state visible in review.",
      review_items: staleFallbackWarnings,
      gaps: [],
    }),
    group({
      group_id: "authority_boundary_review",
      title: "Authority boundary",
      summary:
        "Authority boundary review shows exactly which apply, write, execution, and external actions remain unavailable.",
      review_items: authorityBoundaryItems,
      gaps: [],
    }),
  ];

  return {
    review_version: WORKPLANE_STATE_PROPOSAL_REVIEW_VERSION,
    scope: workplane_context.overview.scope,
    as_of: asOf,
    status: summarizeReadStatus(groups, sourceStatus),
    source_status: sourceStatus,
    fallback_reason: fallbackReason(workplane_context, review_memory_detail),
    summary: {
      group_count: groups.length,
      item_count: groups.reduce(
        (count, nextGroup) => count + nextGroup.review_items.length,
        0,
      ),
      source_ref_count: sourceRefs.length,
      needs_user_judgment_count: needsUserJudgment.filter(
        (item) => item.needs_user_judgment,
      ).length,
      fallback_warning_count: staleFallbackWarnings.filter(
        (item) => item.status === "fallback",
      ).length,
      field_diff_count: fieldLevelDiffs.length,
      before_after_preview_count: beforeAfterPreviews.length,
    },
    proposal_groups: groups,
    field_level_diffs: fieldLevelDiffs,
    before_after_previews: beforeAfterPreviews,
    impact_items: impactItems,
    memory_proposal_reviews: memoryProposalReviews,
    perspective_lens_reviews: perspectiveLensReviews,
    local_draft_reviews: localDraftReviews,
    manual_preview_reviews: manualPreviewReviews,
    proposal_status_history: proposalStatusHistory,
    needs_user_judgment: needsUserJudgment,
    stale_fallback_warnings: staleFallbackWarnings,
    authority_boundary: STATE_PROPOSAL_REVIEW_AUTHORITY_BOUNDARY,
    source_refs: sourceRefs,
    validation_summary: {
      status: "partial",
      smoke_refs: [...WORKPLANE_STATE_PROPOSAL_REVIEW_SMOKE_REFS],
      notes: [
        "State Proposal Review v0.1 is validated by static smoke and server-rendered /workbench marker checks.",
        "Validation names review context only; it does not approve, reject, commit, apply memory, apply Perspective, or auto-apply deltas.",
      ],
    },
    next_review_targets: groups
      .filter((nextGroup) =>
        ["needs_review", "partial", "fallback"].includes(nextGroup.status),
      )
      .map((nextGroup) => nextGroup.group_id),
  };
}

function fieldDiffItems(
  deltas: AugnesDelta[],
  sourceRefs: string[],
): WorkplaneStateProposalReviewItem[] {
  if (deltas.length === 0) {
    return [
      emptyItem({
        item_kind: "field_diff",
        item_id: "field_level_proposal_diff:empty",
        title: "No field-level proposal diffs materialized",
        summary:
          "No projected deltas are available to render field-level proposal diffs.",
        source_refs: sourceRefs,
      }),
    ];
  }

  return deltas.slice(0, 4).map((delta) => ({
    item_id: `field_level_proposal_diff:${delta.delta_id}`,
    item_kind: "field_diff",
    title: delta.title,
    status: statusForDelta(delta),
    before_label: "Current state preview",
    after_label: "Proposed state preview",
    field_path: `delta.${delta.type}.${delta.delta_id}`,
    before_value_preview:
      "Committed before-value is not materialized in this read model.",
    after_value_preview: `${delta.status}: ${delta.summary}`,
    impact_summary: mergePolicySummary(delta),
    risk_level: riskForDelta(delta),
    source_refs: sourceRefsForDelta(delta, sourceRefs),
    needs_user_judgment: delta.merge_policy.requires_user_judgment,
    authority_note: "Read-only field diff; no approve, reject, commit, or apply control.",
  }));
}

function beforeAfterItems(
  deltas: AugnesDelta[],
  sourceRefs: string[],
): WorkplaneStateProposalReviewItem[] {
  if (deltas.length === 0) {
    return [
      emptyItem({
        item_kind: "before_after_preview",
        item_id: "before_after_state_preview:empty",
        title: "No before/after state preview materialized",
        summary:
          "No projected deltas are available to render before/after state previews.",
        source_refs: sourceRefs,
      }),
    ];
  }

  return deltas.slice(0, 4).map((delta) => ({
    item_id: `before_after_state_preview:${delta.delta_id}`,
    item_kind: "before_after_preview",
    title: delta.title,
    status: statusForDelta(delta),
    before_label: "Before",
    after_label: "After",
    before_value_preview:
      delta.snapshot_refs[0]?.freshness_notes.join(" ") ||
      "Before snapshot detail is not materialized.",
    after_value_preview: delta.summary,
    impact_summary: mergePolicySummary(delta),
    risk_level: riskForDelta(delta),
    source_refs: sourceRefsForDelta(delta, sourceRefs),
    needs_user_judgment: delta.merge_policy.requires_user_judgment,
    authority_note: "Preview only; no delta auto-apply.",
  }));
}

function impactReviewItems(
  deltas: AugnesDelta[],
  sourceRefs: string[],
): WorkplaneStateProposalReviewItem[] {
  if (deltas.length === 0) {
    return [
      emptyItem({
        item_kind: "impact",
        item_id: "proposal_impact_analysis:empty",
        title: "No proposal impact rows materialized",
        summary: "No projected deltas are available for impact analysis.",
        source_refs: sourceRefs,
      }),
    ];
  }

  return deltas.slice(0, 4).map((delta) => ({
    item_id: `proposal_impact_analysis:${delta.delta_id}`,
    item_kind: "impact",
    title: delta.title,
    status: statusForDelta(delta),
    impact_summary: [
      `${delta.target_refs.length} target refs`,
      `${delta.evidence_refs.length} evidence refs`,
      `${delta.artifact_refs.length} artifact refs`,
      `merge policy ${delta.merge_policy.mode}`,
    ].join("; "),
    risk_level: riskForDelta(delta),
    source_refs: sourceRefsForDelta(delta, sourceRefs),
    needs_user_judgment: delta.merge_policy.requires_user_judgment,
    authority_note: "Impact analysis is review context only.",
  }));
}

function reviewMemoryItems({
  candidates,
  item_kind,
  fallback_title,
  fallback_summary,
  source_refs,
}: {
  candidates: WorkplaneReviewMemoryCandidate[];
  item_kind: "memory_proposal" | "perspective_lens";
  fallback_title: string;
  fallback_summary: string;
  source_refs: string[];
}): WorkplaneStateProposalReviewItem[] {
  const materialized = candidates.filter(
    (candidate) => candidate.delta_id || candidate.status !== "empty",
  );

  if (materialized.length === 0) {
    return [
      emptyItem({
        item_kind,
        item_id: `${item_kind}:empty`,
        title: fallback_title,
        summary: fallback_summary,
        source_refs,
      }),
    ];
  }

  return materialized.slice(0, 4).map((candidate) => ({
    item_id: `${item_kind}:${candidate.candidate_id}`,
    item_kind,
    title: candidate.title,
    status: statusForReviewMemoryCandidate(candidate),
    before_label: "Candidate source",
    after_label: "Review target",
    before_value_preview:
      candidate.delta_id ?? "No delta id materialized for this candidate.",
    after_value_preview: candidate.summary,
    impact_summary:
      candidate.merge_policy_summary ??
      "No merge policy summary is materialized.",
    risk_level: riskForReviewMemoryCandidate(candidate),
    source_refs: uniqueStrings([...source_refs, ...candidate.source_refs]),
    needs_user_judgment:
      candidate.needs_user_judgment.length > 0 ||
      candidate.validation_summary.status === "needs_review",
    authority_note: candidate.authority_notes.join(" "),
  }));
}

function localDraftItems(
  deltas: AugnesDelta[],
  sourceRefs: string[],
): WorkplaneStateProposalReviewItem[] {
  const drafts = deltas.filter((delta) => delta.status === "draft");
  if (drafts.length === 0) {
    return [
      emptyItem({
        item_kind: "local_draft",
        item_id: "local_draft_review:empty",
        title: "No local draft proposals materialized",
        summary:
          "No draft-status projected deltas are available; this lane remains explicit rather than hidden.",
        source_refs: sourceRefs,
      }),
    ];
  }

  return drafts.slice(0, 4).map((delta) => ({
    item_id: `local_draft_review:${delta.delta_id}`,
    item_kind: "local_draft",
    title: delta.title,
    status: "partial",
    before_label: "Draft source",
    after_label: "Review target",
    before_value_preview: delta.source,
    after_value_preview: delta.summary,
    impact_summary: mergePolicySummary(delta),
    risk_level: riskForDelta(delta),
    source_refs: sourceRefsForDelta(delta, sourceRefs),
    needs_user_judgment: true,
    authority_note: "Local draft review only; no commit or reject control.",
  }));
}

function manualPreviewItem(
  sourceRefs: string[],
): WorkplaneStateProposalReviewItem {
  return emptyItem({
    item_kind: "manual_preview",
    item_id: "manual_preview_editor:empty",
    title: "Manual preview editor not materialized",
    summary:
      "No manual preview text source is present in Workplane v0.1; the lane is retained as preview-only review context.",
    source_refs: sourceRefs,
  });
}

function manualGravityItem(
  context: WorkplaneContextRead,
  sourceRefs: string[],
): WorkplaneStateProposalReviewItem {
  const pressure = context.current_perspective_read.data.research_pressure;
  return {
    item_id: "manual_gravity_preview:current_pressure",
    item_kind: "manual_gravity",
    title: "Current review gravity",
    status: pressure.pending_proposal_count > 0 ? "partial" : "empty",
    before_label: "Current pressure",
    after_label: "Previewed gravity",
    before_value_preview: pressure.pressure_level,
    after_value_preview: `${pressure.pending_proposal_count} pending proposals; ${pressure.projection_gap_count} projection gaps.`,
    impact_summary: pressure.notes.join(" ") || "No pressure notes materialized.",
    risk_level: riskFromSeverity(pressure.pressure_level),
    source_refs: uniqueStrings([
      ...sourceRefs,
      ...pressure.diagnostic_refs.map((ref) => ref.diagnostic_id),
    ]),
    needs_user_judgment: pressure.pending_proposal_count > 0,
    authority_note: "Manual gravity preview only; no Perspective apply.",
  };
}

function formationBasisItem(
  context: WorkplaneContextRead,
  sourceRefs: string[],
): WorkplaneStateProposalReviewItem {
  const frame = context.current_perspective_read.data.current_frame;
  return {
    item_id: "formation_basis_preview:current_frame",
    item_kind: "formation_basis",
    title: "Current frame formation basis",
    status: frame.source_refs.length > 0 ? "partial" : "empty",
    before_label: "Frame basis",
    after_label: "Review basis",
    before_value_preview: frame.primary_state_keys.join(", ") || "none materialized",
    after_value_preview: frame.summary,
    impact_summary:
      frame.non_authority_notes.join(" ") ||
      "No formation basis notes are materialized.",
    risk_level: riskFromSeverity(frame.pressure_level),
    source_refs: uniqueStrings([...sourceRefs, ...frame.source_refs]),
    needs_user_judgment: frame.pressure_level === "high",
    authority_note: "Formation basis preview only; no durable state apply.",
  };
}

function proposalStatusHistoryItems(
  deltas: AugnesDelta[],
  sourceRefs: string[],
): WorkplaneStateProposalReviewItem[] {
  if (deltas.length === 0) {
    return [
      emptyItem({
        item_kind: "status_history",
        item_id: "proposal_status_history:empty",
        title: "No proposal status history materialized",
        summary: "No projected delta status rows are available.",
        source_refs: sourceRefs,
      }),
    ];
  }

  return deltas.slice(0, 6).map((delta) => ({
    item_id: `proposal_status_history:${delta.delta_id}`,
    item_kind: "status_history",
    title: delta.title,
    status: statusForDelta(delta),
    field_path: "delta.status",
    before_value_preview: delta.created_at,
    after_value_preview: delta.status,
    impact_summary: delta.review_notes?.join(" ") || mergePolicySummary(delta),
    risk_level: riskForDelta(delta),
    source_refs: sourceRefsForDelta(delta, sourceRefs),
    needs_user_judgment: delta.merge_policy.requires_user_judgment,
    authority_note: "Proposal status history is read-only; no lifecycle mutation.",
  }));
}

function needsUserJudgmentItems({
  review_memory_detail,
  workplane_context,
  source_refs,
}: {
  review_memory_detail: WorkplaneReviewMemoryDetailRead;
  workplane_context: WorkplaneContextRead;
  source_refs: string[];
}): WorkplaneStateProposalReviewItem[] {
  const decisionItems = review_memory_detail.decision_items.filter(
    (item) => item.required_user_judgment,
  );

  if (decisionItems.length === 0) {
    const goals = workplane_context.current_perspective_read.data.active_goals.filter(
      (goal) => goal.user_attention_required,
    );

    if (goals.length === 0) {
      return [
        emptyItem({
          item_kind: "status_history",
          item_id: "needs_user_judgment_lane:empty",
          title: "No user judgment refs materialized",
          summary:
            "No proposal or work refs currently require explicit user judgment in this read model.",
          source_refs,
        }),
      ];
    }

    return goals.slice(0, 4).map((goal) => ({
      item_id: `needs_user_judgment_lane:${goal.goal_id}`,
      item_kind: "status_history",
      title: goal.title,
      status: "needs_review",
      impact_summary: goal.next_action,
      risk_level: "high",
      source_refs: uniqueStrings([...source_refs, ...goal.source_refs]),
      needs_user_judgment: true,
      authority_note: "User judgment remains user-owned; suggestions are not actions.",
    }));
  }

  return decisionItems.slice(0, 6).map((item) => ({
    item_id: `needs_user_judgment_lane:${item.decision_id}`,
    item_kind: "status_history",
    title: item.title,
    status: mapReviewMemoryStatus(item.status),
    impact_summary: item.summary,
    risk_level: item.lane === "blocked" ? "high" : "medium",
    source_refs: uniqueStrings([...source_refs, ...item.source_refs]),
    needs_user_judgment: true,
    authority_note: "Needs-user-judgment lane is review only; no automatic resolution.",
  }));
}

function staleFallbackWarningItems({
  workplane_context,
  source_status,
  source_refs,
}: {
  workplane_context: WorkplaneContextRead;
  source_status: WorkplaneStateProposalReviewSourceStatus;
  source_refs: string[];
}): WorkplaneStateProposalReviewItem[] {
  const warnings = [
    workplane_context.fallback_reason.current_perspective,
    workplane_context.fallback_reason.delta_projection,
    workplane_context.fallback_reason.runner_delta_batch,
    ...workplane_context.current_perspective_read.data.staleness.freshness_notes,
  ].filter((warning): warning is string => Boolean(warning));

  if (warnings.length === 0 && source_status === "runtime") {
    return [
      {
        item_id: "stale_fallback_warning_review:ready",
        item_kind: "stale_fallback_warning",
        title: "No stale or fallback warning active",
        status: "ready",
        impact_summary:
          "Current Perspective and Delta Projection did not report fallback warnings.",
        risk_level: "low",
        source_refs,
        needs_user_judgment: false,
        authority_note: "Freshness review only; no state mutation.",
      },
    ];
  }

  return (warnings.length > 0 ? warnings : [`Source status is ${source_status}.`])
    .slice(0, 5)
    .map((warning, index) => ({
      item_id: `stale_fallback_warning_review:${index + 1}`,
      item_kind: "stale_fallback_warning",
      title: "Stale or fallback warning",
      status: source_status === "runtime" ? "partial" : "fallback",
      impact_summary: warning,
      risk_level: source_status === "runtime" ? "medium" : "high",
      source_refs,
      needs_user_judgment: source_status !== "runtime",
      authority_note: "Warning disclosure only; fallback data is not durable truth.",
    }));
}

function authorityBoundaryReviewItems(
  sourceRefs: string[],
): WorkplaneStateProposalReviewItem[] {
  return [
    {
      item_id: "authority_boundary_review:read_only_no_apply",
      item_kind: "authority_boundary",
      title: "Read-only no-apply authority boundary",
      status: "blocked",
      impact_summary:
        "Approve, reject, commit, memory apply, Perspective apply, delta auto-apply, product DB writes, proof/evidence writes, provider calls, GitHub calls, Codex execution, runner execution, runner ticks, runner recovery, runner scheduling, merge, publish, retry, replay, deploy, and durable local storage mode are unavailable here.",
      risk_level: "high",
      source_refs: sourceRefs,
      needs_user_judgment: true,
      authority_note:
        "This panel displays candidate actions as review labels only and renders no mutation controls.",
    },
  ];
}

function group({
  group_id,
  title,
  summary,
  review_items,
  gaps,
}: {
  group_id: WorkplaneStateProposalReviewGroupId;
  title: string;
  summary: string;
  review_items: WorkplaneStateProposalReviewItem[];
  gaps: string[];
}): WorkplaneStateProposalReviewGroup {
  return {
    group_id,
    title,
    status: summarizeGroupStatus(review_items),
    destination: "workplane_state_proposal_review",
    summary,
    source_refs: uniqueStrings(review_items.flatMap((item) => item.source_refs)),
    review_items,
    gaps,
    authority_note:
      "Read-only review lane; no approve, reject, commit, apply, write, execution, or external actuation authority.",
  };
}

function emptyItem({
  item_kind,
  item_id,
  title,
  summary,
  source_refs,
}: {
  item_kind: WorkplaneStateProposalReviewItemKind;
  item_id: string;
  title: string;
  summary: string;
  source_refs: string[];
}): WorkplaneStateProposalReviewItem {
  return {
    item_id,
    item_kind,
    title,
    status: "empty",
    impact_summary: summary,
    risk_level: "low",
    source_refs,
    needs_user_judgment: false,
    authority_note:
      "Explicit empty review row; missing data does not create apply authority.",
  };
}

function collectSourceRefs({
  workplane_context,
  node_context_read,
  review_memory_detail,
}: WorkplaneStateProposalReviewInput) {
  const projection = workplane_context.delta_projection_read.data;
  const current = workplane_context.current_perspective_read.data;
  return uniqueStrings([
    `current_perspective:${current.as_of}`,
    `delta_projection:${projection.as_of}`,
    ...node_context_read.source_refs,
    ...review_memory_detail.source_refs,
    ...projection.source_refs.handoff_refs,
    ...projection.source_refs.codex_result_refs,
    "docs:WORKPLANE_STATE_PROPOSAL_REVIEW_V0_1.md",
    "docs:LEGACY_COCKPIT_REMAINING_CAPABILITY_MIGRATION_V0_1.md",
  ]);
}

function sourceRefsForDelta(delta: AugnesDelta, sourceRefs: string[]) {
  return uniqueStrings([
    `delta:${delta.delta_id}`,
    ...sourceRefs,
    ...delta.target_refs,
    ...delta.snapshot_refs.flatMap((ref) => ref.source_refs),
    ...delta.diagnostic_refs.map((ref) => ref.diagnostic_id),
    ...delta.evidence_refs.map((ref) => ref.evidence_ref),
    ...delta.artifact_refs.map((ref) => ref.artifact_ref),
    ...delta.handoff_refs.map((ref) => ref.handoff_ref),
  ]);
}

function summarizeSourceStatus(
  context: WorkplaneContextRead,
): WorkplaneStateProposalReviewSourceStatus {
  const statuses = [
    context.source_status.current_perspective,
    context.source_status.delta_projection,
  ];
  if (statuses.every((status) => status === "runtime")) return "runtime";
  if (statuses.some((status) => status === "empty_fallback")) {
    return "empty_fallback";
  }
  if (statuses.every((status) => status === "fixture_fallback")) {
    return "fixture_fallback";
  }
  return "mixed";
}

function fallbackReason(
  context: WorkplaneContextRead,
  reviewMemoryDetail: WorkplaneReviewMemoryDetailRead,
) {
  return (
    [
      context.fallback_reason.current_perspective,
      context.fallback_reason.delta_projection,
      context.fallback_reason.runner_delta_batch,
      ...reviewMemoryDetail.fallback_notes,
    ]
      .filter(Boolean)
      .join(" ") || null
  );
}

function summarizeReadStatus(
  groups: WorkplaneStateProposalReviewGroup[],
  sourceStatus: WorkplaneStateProposalReviewSourceStatus,
): WorkplaneStateProposalReviewStatus {
  if (sourceStatus !== "runtime") return "fallback";
  if (groups.some((nextGroup) => nextGroup.status === "needs_review")) {
    return "needs_review";
  }
  if (groups.every((nextGroup) => nextGroup.status === "empty")) return "empty";
  return "partial";
}

function summarizeGroupStatus(
  items: WorkplaneStateProposalReviewItem[],
): WorkplaneStateProposalReviewStatus {
  if (items.some((item) => item.status === "blocked")) return "blocked";
  if (items.some((item) => item.status === "needs_review")) return "needs_review";
  if (items.some((item) => item.status === "fallback")) return "fallback";
  if (items.every((item) => item.status === "empty")) return "empty";
  if (items.every((item) => item.status === "ready")) return "ready";
  return "partial";
}

function statusForDelta(delta: AugnesDelta): WorkplaneStateProposalReviewStatus {
  if (delta.merge_policy.mode === "blocked" || delta.status === "deferred") {
    return "blocked";
  }
  if (
    delta.status === "needs_review" ||
    delta.merge_policy.requires_user_judgment ||
    delta.merge_policy.requires_validation
  ) {
    return "needs_review";
  }
  if (delta.status === "draft") return "partial";
  return "ready";
}

function statusForReviewMemoryCandidate(
  candidate: WorkplaneReviewMemoryCandidate,
): WorkplaneStateProposalReviewStatus {
  if (candidate.lane === "blocked") return "blocked";
  if (
    candidate.status === "needs_review" ||
    candidate.validation_summary.status === "needs_review" ||
    candidate.needs_user_judgment.length > 0
  ) {
    return "needs_review";
  }
  return mapReviewMemoryStatus(candidate.status);
}

function mapReviewMemoryStatus(status: string): WorkplaneStateProposalReviewStatus {
  if (WORKPLANE_STATE_PROPOSAL_REVIEW_STATUSES.includes(
    status as WorkplaneStateProposalReviewStatus,
  )) {
    return status as WorkplaneStateProposalReviewStatus;
  }
  if (status === "insufficient_data") return "partial";
  return "partial";
}

function riskForDelta(delta: AugnesDelta): WorkplaneStateProposalReviewRiskLevel {
  if (
    delta.merge_policy.mode === "blocked" ||
    delta.merge_policy.requires_user_judgment ||
    delta.merge_policy.durable_memory_allowed ||
    delta.merge_policy.project_perspective_allowed
  ) {
    return "high";
  }
  if (delta.merge_policy.requires_validation) return "medium";
  return "low";
}

function riskForReviewMemoryCandidate(
  candidate: WorkplaneReviewMemoryCandidate,
): WorkplaneStateProposalReviewRiskLevel {
  if (
    candidate.lane === "blocked" ||
    candidate.lane === "durable_memory_review" ||
    candidate.lane === "project_perspective_review"
  ) {
    return "high";
  }
  if (candidate.lane === "validation_required") return "medium";
  return "low";
}

function riskFromSeverity(
  severity: "none" | "low" | "medium" | "high",
): WorkplaneStateProposalReviewRiskLevel {
  if (WORKPLANE_STATE_PROPOSAL_REVIEW_RISK_LEVELS.includes(
    severity as WorkplaneStateProposalReviewRiskLevel,
  )) {
    return severity as WorkplaneStateProposalReviewRiskLevel;
  }
  return "low";
}

function mergePolicySummary(delta: AugnesDelta) {
  return [
    `mode ${delta.merge_policy.mode}`,
    delta.merge_policy.requires_user_judgment ? "requires user judgment" : null,
    delta.merge_policy.requires_validation ? "requires validation" : null,
    delta.merge_policy.blocked_reason
      ? `blocked reason ${delta.merge_policy.blocked_reason}`
      : null,
  ]
    .filter(Boolean)
    .join("; ");
}

function gapsForCandidateItems(items: WorkplaneStateProposalReviewItem[]) {
  return items.some((item) => item.status === "empty")
    ? ["No materialized candidate refs are available for this lane."]
    : [];
}

function sortDeltasNewestFirst(deltas: AugnesDelta[]) {
  return [...deltas].sort((left, right) => {
    const leftCreatedAt = Date.parse(left.created_at);
    const rightCreatedAt = Date.parse(right.created_at);
    const createdAtDelta =
      Number.isFinite(rightCreatedAt) && Number.isFinite(leftCreatedAt)
        ? rightCreatedAt - leftCreatedAt
        : 0;

    if (createdAtDelta !== 0) return createdAtDelta;
    return left.delta_id.localeCompare(right.delta_id);
  });
}

function chooseLatestTimestamp(left: string, right: string) {
  const leftTime = Date.parse(left);
  const rightTime = Date.parse(right);
  if (!Number.isFinite(leftTime)) return right;
  if (!Number.isFinite(rightTime)) return left;
  return rightTime > leftTime ? right : left;
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[]));
}

void WORKPLANE_STATE_PROPOSAL_REVIEW_GROUP_IDS;
void WORKPLANE_STATE_PROPOSAL_REVIEW_ITEM_KINDS;
