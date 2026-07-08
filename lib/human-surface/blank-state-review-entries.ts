import type {
  HumanSurfaceCurrentPerspectiveRead,
  HumanSurfaceSourceStatus,
} from "@/lib/human-surface/read-current-perspective";
import type { WorkplaneRunnerDeltaBatchRead } from "@/lib/workplane/read-runner-delta-batches-for-workplane";

export const BLANK_STATE_REVIEW_ENTRY_IDS = [
  "continue_current_work_entry",
  "review_pending_proposals_entry",
  "choose_perspective_lens_entry",
  "prepare_codex_handoff_entry",
  "review_runner_deltabatch_entry",
  "automation_mode_entry",
  "user_judgment_summary_entry",
] as const;

export type BlankStateReviewEntryId =
  (typeof BLANK_STATE_REVIEW_ENTRY_IDS)[number];

export type BlankStateReviewEntryDestination =
  | "workplane"
  | "perspective"
  | "operator_review";

export type BlankStateReviewEntry = {
  capability_id: BlankStateReviewEntryId;
  destination: BlankStateReviewEntryDestination;
  next_surface?: "state_proposal_review";
  title: string;
  summary: string;
  target_label: string;
  href: string;
  metric_label: string;
  metric_value: string;
  status_label: string;
  source_status: HumanSurfaceSourceStatus | "runner_ledger" | "empty" | "fallback";
  source_note: string;
  authority_note: string;
};

export type BlankStateReviewEntriesInput = {
  currentPerspectiveRead: HumanSurfaceCurrentPerspectiveRead;
  runnerDeltaBatchRead: WorkplaneRunnerDeltaBatchRead;
};

export function buildBlankStateReviewEntries({
  currentPerspectiveRead,
  runnerDeltaBatchRead,
}: BlankStateReviewEntriesInput): BlankStateReviewEntry[] {
  const perspective = currentPerspectiveRead.data;
  const reviewQueue = perspective.review_queue_hints;
  const activeGoal = perspective.active_goals[0] ?? null;
  const activeWorkIds = perspective.current_frame.active_work_ids;
  const reviewRefCount = uniqueCount([
    ...reviewQueue.needs_review_delta_ids,
    ...reviewQueue.blocked_delta_ids,
    ...reviewQueue.manual_review_delta_ids,
    ...reviewQueue.validation_required_delta_ids,
    ...reviewQueue.project_perspective_review_delta_ids,
    ...reviewQueue.durable_memory_review_delta_ids,
    ...reviewQueue.user_decision_delta_ids,
  ]);
  const userJudgmentCount = uniqueCount([
    ...reviewQueue.user_decision_delta_ids,
    ...reviewQueue.manual_review_delta_ids,
    ...reviewQueue.blocked_delta_ids,
    ...perspective.active_goals
      .filter((goal) => goal.user_attention_required)
      .map((goal) => goal.goal_id),
  ]);
  const handoffRefCount =
    perspective.source_refs.delta_projection.source_refs.handoff_refs.length;

  return [
    {
      capability_id: "continue_current_work_entry",
      destination: "workplane",
      title: "Continue Current Work",
      summary: activeGoal
        ? activeGoal.next_action
        : "No current work goal is materialized yet. Open Workplane to inspect the work queue fallback.",
      target_label: "Workplane work_queue",
      href: "/workbench#work_queue",
      metric_label: "Active work",
      metric_value:
        activeWorkIds.length > 0
          ? `${activeWorkIds.length} ids`
          : `${perspective.active_goals.length} goals`,
      status_label: activeGoal ? "ready" : "empty",
      source_status: currentPerspectiveRead.source_status,
      source_note: sourceNote(currentPerspectiveRead.source_status),
      authority_note: "Navigation only. No work is created or updated.",
    },
    {
      capability_id: "review_pending_proposals_entry",
      destination: "workplane",
      next_surface: "state_proposal_review",
      title: "Review Pending Proposals",
      summary:
        reviewRefCount > 0
          ? "Proposal, memory, draft, or validation refs need review before they become committed state."
          : "No proposal or memory review refs are materialized in the current read model.",
      target_label: "Workplane review_queue / future State Proposal Review",
      href: "/workbench#review_queue",
      metric_label: "Review refs",
      metric_value: String(reviewRefCount),
      status_label: reviewRefCount > 0 ? "needs review" : "empty",
      source_status: currentPerspectiveRead.source_status,
      source_note: sourceNote(currentPerspectiveRead.source_status),
      authority_note: "Review entry only. No approve, apply, reject, or commit control.",
    },
    {
      capability_id: "choose_perspective_lens_entry",
      destination: "perspective",
      next_surface: "state_proposal_review",
      title: "Choose Perspective Lens",
      summary: perspective.current_frame.summary,
      target_label: "Perspective frame and lens review",
      href: "/perspective",
      metric_label: "Staleness",
      metric_value: perspective.staleness.status,
      status_label: "view frame",
      source_status: currentPerspectiveRead.source_status,
      source_note: sourceNote(currentPerspectiveRead.source_status),
      authority_note: "View selection only. No durable Perspective apply.",
    },
    {
      capability_id: "prepare_codex_handoff_entry",
      destination: "workplane",
      title: "Preview Codex Handoff",
      summary:
        handoffRefCount > 0
          ? "Handoff refs are available for Workplane preview before any external transfer."
          : "No handoff refs are materialized yet. Workplane can still show preview/fallback context.",
      target_label: "Workplane handoff builder preview",
      href: "/workbench#handoff_builder_preview",
      metric_label: "Handoff refs",
      metric_value: String(handoffRefCount),
      status_label: handoffRefCount > 0 ? "preview" : "empty",
      source_status: currentPerspectiveRead.source_status,
      source_note: sourceNote(currentPerspectiveRead.source_status),
      authority_note: "Preview/navigation only. No Codex launch or execution.",
    },
    {
      capability_id: "review_runner_deltabatch_entry",
      destination: "workplane",
      title: "Inspect Runner DeltaBatch",
      summary:
        runnerDeltaBatchRead.recovered_batch_count > 0
          ? "Recovered runner DeltaBatch output is available for read-only inspection."
          : runnerDeltaBatchRead.empty_state,
      target_label: "Workplane runner DeltaBatch inspection",
      href: "/workbench#runner_delta_batch",
      metric_label: "Recovered batches",
      metric_value: String(runnerDeltaBatchRead.recovered_batch_count),
      status_label:
        runnerDeltaBatchRead.status === "ready"
          ? "ready"
          : runnerDeltaBatchRead.status,
      source_status: runnerDeltaBatchRead.source_status,
      source_note:
        runnerDeltaBatchRead.fallback_reason ??
        `Runner DeltaBatch source: ${runnerDeltaBatchRead.source_status}.`,
      authority_note: "Review only. No runner execution, tick, recovery, or scheduling.",
    },
    {
      capability_id: "automation_mode_entry",
      destination: "workplane",
      title: "Inspect Automation Boundary",
      summary:
        "Automation boundary is inspection-only from Blank State. Workplane remains the operational inspection surface.",
      target_label: "Workplane authority boundary inspection",
      href: "/workbench#authority_boundary",
      metric_label: "Mode",
      metric_value: "read-only",
      status_label: "blocked actions",
      source_status: currentPerspectiveRead.source_status,
      source_note: sourceNote(currentPerspectiveRead.source_status),
      authority_note:
        "No provider, GitHub, Codex, runner, scheduler, DB, proof, evidence, memory, Perspective, or delta apply authority.",
    },
    {
      capability_id: "user_judgment_summary_entry",
      destination: "workplane",
      next_surface: "state_proposal_review",
      title: "User Judgment Summary",
      summary:
        userJudgmentCount > 0
          ? "Some work or review refs require user judgment before a later surface can act on them."
          : "No user-judgment refs are materialized in the current read model.",
      target_label: "Workplane review_queue / future State Proposal Review",
      href: "/workbench#review_queue",
      metric_label: "Judgment refs",
      metric_value: String(userJudgmentCount),
      status_label: userJudgmentCount > 0 ? "needs user" : "empty",
      source_status: currentPerspectiveRead.source_status,
      source_note: sourceNote(currentPerspectiveRead.source_status),
      authority_note: "User judgment remains user-owned. Suggestions are not actions.",
    },
  ];
}

function uniqueCount(values: string[]) {
  return new Set(values.filter(Boolean)).size;
}

function sourceNote(sourceStatus: HumanSurfaceSourceStatus) {
  if (sourceStatus === "runtime") {
    return "Runtime Current Working Perspective read.";
  }

  if (sourceStatus === "fixture_fallback") {
    return "Runtime unavailable; public-safe fixture fallback is displayed.";
  }

  return "Runtime unavailable; empty fallback is displayed.";
}
