import {
  readCurrentPerspectiveForHumanSurface,
  type HumanSurfaceCurrentPerspectiveRead,
} from "@/lib/human-surface/read-current-perspective";
import {
  readDeltaProjectionForHumanSurface,
  type HumanSurfaceDeltaProjectionRead,
} from "@/lib/human-surface/read-delta-projection";
import {
  readRunnerDeltaBatchesForWorkplane,
  type WorkplaneRunnerDeltaBatchRead,
} from "@/lib/workplane/read-runner-delta-batches-for-workplane";

export const WORKPLANE_SCOPE = "project:augnes" as const;

export type WorkplaneReviewQueueSummary = {
  needs_review_count: number;
  blocked_count: number;
  manual_review_count: number;
  validation_required_count: number;
  project_perspective_review_count: number;
  durable_memory_review_count: number;
  user_decision_count: number;
  total_attention_count: number;
};

export type WorkplaneOverviewSummary = {
  scope: string;
  current_perspective: {
    as_of: string;
    thesis: string;
    frame_summary: string;
    active_goal_count: number;
    active_work_ids: string[];
    open_question_count: number;
    active_risk_count: number;
    next_candidate_count: number;
    research_pressure: string;
    staleness_status: string;
  };
  delta_projection: {
    as_of: string;
    projected_delta_count: number;
    batch_count: number;
    gap_count: number;
    handoff_ref_count: number;
    codex_result_ref_count: number;
    evidence_ref_count: number;
    latest_delta_titles: string[];
  };
  runner_delta_batch: {
    as_of: string | null;
    recovered_batch_count: number;
    recovered_delta_count: number;
    latest_batch_id: string | null;
    latest_run_id: string | null;
    latest_validation_status: string | null;
  };
  review_queue: WorkplaneReviewQueueSummary;
};

export type WorkplaneAuthorityBoundary = {
  surface: "agent_workplane";
  read_only_operator_view: true;
  no_hidden_execution_authority: true;
  can_write_db: false;
  can_record_proof: false;
  can_create_evidence: false;
  can_update_work: false;
  can_mutate_memory: false;
  can_apply_project_perspective: false;
  can_call_provider: false;
  can_call_github: false;
  can_execute_codex: false;
  can_publish_external: false;
  can_merge: false;
  can_retry_replay_deploy: false;
  notes: string[];
};

export type WorkplaneContextRead = {
  current_perspective_read: HumanSurfaceCurrentPerspectiveRead;
  delta_projection_read: HumanSurfaceDeltaProjectionRead;
  runner_delta_batch_read: WorkplaneRunnerDeltaBatchRead;
  overview: WorkplaneOverviewSummary;
  source_status: {
    current_perspective: HumanSurfaceCurrentPerspectiveRead["source_status"];
    delta_projection: HumanSurfaceDeltaProjectionRead["source_status"];
    runner_delta_batch: WorkplaneRunnerDeltaBatchRead["source_status"];
  };
  fallback_reason: {
    current_perspective: string | null;
    delta_projection: string | null;
    runner_delta_batch: string | null;
  };
  authority_boundary: WorkplaneAuthorityBoundary;
  workplane_notes: string[];
};

export async function readWorkplaneContext(): Promise<WorkplaneContextRead> {
  const [currentPerspectiveRead, deltaProjectionRead, runnerDeltaBatchRead] =
    await Promise.all([
    readCurrentPerspectiveForHumanSurface(),
    readDeltaProjectionForHumanSurface(),
    Promise.resolve(readRunnerDeltaBatchesForWorkplane()),
  ]);

  const current = currentPerspectiveRead.data;
  const projection = deltaProjectionRead.data;
  const reviewQueue = current.review_queue_hints;
  const reviewIds = new Set<string>([
    ...reviewQueue.needs_review_delta_ids,
    ...reviewQueue.blocked_delta_ids,
    ...reviewQueue.manual_review_delta_ids,
    ...reviewQueue.validation_required_delta_ids,
    ...reviewQueue.project_perspective_review_delta_ids,
    ...reviewQueue.durable_memory_review_delta_ids,
    ...reviewQueue.user_decision_delta_ids,
  ]);

  const evidenceRefCount = projection.deltas.reduce(
    (count, delta) => count + delta.evidence_refs.length,
    0,
  );
  const latestDeltas = [...projection.deltas].sort((left, right) => {
    const leftCreatedAt = Date.parse(left.created_at);
    const rightCreatedAt = Date.parse(right.created_at);
    const createdAtDelta =
      Number.isFinite(rightCreatedAt) && Number.isFinite(leftCreatedAt)
        ? rightCreatedAt - leftCreatedAt
        : 0;

    if (createdAtDelta !== 0) {
      return createdAtDelta;
    }

    return left.delta_id.localeCompare(right.delta_id);
  });

  const authorityBoundary: WorkplaneAuthorityBoundary = {
    surface: "agent_workplane",
    read_only_operator_view: true,
    no_hidden_execution_authority: true,
    can_write_db: false,
    can_record_proof: false,
    can_create_evidence: false,
    can_update_work: false,
    can_mutate_memory: false,
    can_apply_project_perspective: false,
    can_call_provider: false,
    can_call_github: false,
    can_execute_codex: false,
    can_publish_external: false,
    can_merge: false,
    can_retry_replay_deploy: false,
    notes: [
      "Agent Workplane is a read-only backend/operator surface in Phase 5A and Phase 5B.",
      "It can inspect Current Working Perspective, Augnes Delta Projection context, and recovered runner DeltaBatch ledger readback.",
      "Recovered runner DeltaBatches are review-only context and are separate from projected Delta Projection batches.",
      "It does not execute agents, recover DeltaBatches, tick or schedule runners, apply deltas, write proof/evidence, call providers, call GitHub, launch Codex, merge, publish, retry, replay, deploy, or mutate state.",
      "Legacy Cockpit has been removed as a product surface; migrated capabilities now live in Blank State, Agent Workplane, State Proposal Review, and Manual Controls Migration rows.",
    ],
  };

  return {
    current_perspective_read: currentPerspectiveRead,
    delta_projection_read: deltaProjectionRead,
    runner_delta_batch_read: runnerDeltaBatchRead,
    overview: {
      scope: current.scope,
      current_perspective: {
        as_of: current.as_of,
        thesis: current.current_thesis.summary,
        frame_summary: current.current_frame.summary,
        active_goal_count: current.active_goals.length,
        active_work_ids: current.current_frame.active_work_ids,
        open_question_count: current.open_questions.length,
        active_risk_count: current.active_risks.length,
        next_candidate_count: current.next_candidates.length,
        research_pressure: current.research_pressure.pressure_level,
        staleness_status: current.staleness.status,
      },
      delta_projection: {
        as_of: projection.as_of,
        projected_delta_count: projection.source_counts.total_projected_deltas,
        batch_count: projection.source_counts.total_batches,
        gap_count: projection.source_counts.total_gaps,
        handoff_ref_count: projection.source_refs.handoff_refs.length,
        codex_result_ref_count: projection.source_refs.codex_result_refs.length,
        evidence_ref_count: evidenceRefCount,
        latest_delta_titles: latestDeltas
          .slice(0, 4)
          .map((delta) => `${delta.title} (${delta.status})`),
      },
      runner_delta_batch: {
        as_of: runnerDeltaBatchRead.as_of,
        recovered_batch_count: runnerDeltaBatchRead.recovered_batch_count,
        recovered_delta_count: runnerDeltaBatchRead.recovered_delta_count,
        latest_batch_id: runnerDeltaBatchRead.latest_batch_id,
        latest_run_id: runnerDeltaBatchRead.latest_run_id,
        latest_validation_status:
          runnerDeltaBatchRead.latest_validation_status,
      },
      review_queue: {
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
        total_attention_count: reviewIds.size,
      },
    },
    source_status: {
      current_perspective: currentPerspectiveRead.source_status,
      delta_projection: deltaProjectionRead.source_status,
      runner_delta_batch: runnerDeltaBatchRead.source_status,
    },
    fallback_reason: {
      current_perspective: currentPerspectiveRead.fallback_reason,
      delta_projection: deltaProjectionRead.fallback_reason,
      runner_delta_batch: runnerDeltaBatchRead.fallback_reason,
    },
    authority_boundary: authorityBoundary,
    workplane_notes: [
      "Human-facing entry remains `/` and Perspective review remains `/perspective`.",
      "Workbench remains `/workbench` and is reframed as Agent Workplane.",
      "Phase 5B extracts work queue, Current Perspective, Delta Projection, Review Queue, Evidence/Handoff, and Inspector panels without redoing the shell.",
      "Recovered runner DeltaBatches are read from the runner ledger for Workplane review context only.",
      "Projected Delta Projection batches remain separate from recovered runner DeltaBatches.",
    ],
  };
}
