/**
 * Type-only Agent Workplane Review / Memory Proposal Detail contract v0.1.
 *
 * This file defines a read-only detail shape for native review queue, durable
 * memory candidate, and Project Perspective candidate visibility. It imports
 * nothing, performs no reads or writes, calls no routes, providers, OpenAI,
 * GitHub, Codex, runner runtime, memory apply, Perspective apply, or delta
 * apply helpers, and has no side effects.
 */

export const WORKPLANE_REVIEW_MEMORY_DETAIL_VERSION =
  "workplane_review_memory_detail.v0.1" as const;

export type WorkplaneReviewMemoryStatus =
  | "ready"
  | "partial"
  | "empty"
  | "fallback"
  | "needs_review"
  | "insufficient_data";

export type WorkplaneReviewMemoryLane =
  | "needs_review"
  | "blocked"
  | "manual_review"
  | "validation_required"
  | "project_perspective_review"
  | "durable_memory_review"
  | "user_decision"
  | "unknown";

export type WorkplaneReviewMemoryCandidateKind =
  | "delta_review"
  | "durable_memory_candidate"
  | "perspective_update_candidate"
  | "validation_candidate"
  | "user_judgment_candidate"
  | "blocked_candidate"
  | "handoff_candidate"
  | "unknown";

export interface WorkplaneReviewMemoryCandidate {
  candidate_id: string;
  candidate_kind: WorkplaneReviewMemoryCandidateKind;
  lane: WorkplaneReviewMemoryLane;
  title: string;
  summary: string;
  status: WorkplaneReviewMemoryStatus;
  delta_id: string | null;
  source_refs: string[];
  evidence_refs: string[];
  artifact_refs: string[];
  handoff_refs: string[];
  diagnostic_refs: string[];
  validation_summary: {
    status: WorkplaneReviewMemoryStatus;
    required_checks: string[];
    completed_checks: string[];
    failed_checks: string[];
    skipped_checks: Array<{
      check: string;
      reason: string;
    }>;
    notes: string[];
  };
  merge_policy_summary: string | null;
  non_goals: string[];
  needs_user_judgment: string[];
  authority_notes: string[];
}

export interface WorkplaneReviewMemoryDecisionItem {
  decision_id: string;
  lane: WorkplaneReviewMemoryLane;
  candidate_id: string;
  delta_id: string | null;
  title: string;
  summary: string;
  status: WorkplaneReviewMemoryStatus;
  required_user_judgment: boolean;
  source_refs: string[];
}

export interface WorkplaneReviewMemoryQueueSummary {
  needs_review_count: number;
  blocked_count: number;
  manual_review_count: number;
  validation_required_count: number;
  project_perspective_review_count: number;
  durable_memory_review_count: number;
  user_decision_count: number;
  total_attention_count: number;
  lane_counts: Record<WorkplaneReviewMemoryLane, number>;
  notes: string[];
}

export interface WorkplaneReviewMemoryGapDetail {
  gap_id:
    | "missing_native_durable_memory_proposal_apply_detail"
    | "missing_source_backed_run_postmortem_detail"
    | "missing_richer_proposal_diff_detail";
  status: WorkplaneReviewMemoryStatus;
  summary: string;
  required_next_step: string;
  source_refs: string[];
}

export interface WorkplaneReviewMemoryAuthorityBoundary {
  surface: "agent_workplane_review_memory_detail";
  read_only_review_memory_detail: true;
  can_write_db: false;
  can_write_runner_ledger: false;
  can_record_proof: false;
  can_create_evidence: false;
  can_update_work: false;
  can_mutate_memory: false;
  can_apply_project_perspective: false;
  can_apply_durable_memory: false;
  can_auto_apply_delta: false;
  can_call_provider_openai: false;
  can_call_github: false;
  can_actuate_github: false;
  can_execute_codex: false;
  can_execute_runner: false;
  can_schedule_runner: false;
  can_recover_delta_batch: false;
  can_create_branch_or_pr: false;
  can_send_handoff: false;
  can_merge_publish_retry_replay_deploy: false;
  can_delete_or_shrink_legacy_cockpit: false;
  can_hide_legacy_cockpit: false;
  notes: string[];
}

export interface WorkplaneReviewMemoryDetailRead {
  version: typeof WORKPLANE_REVIEW_MEMORY_DETAIL_VERSION;
  status: WorkplaneReviewMemoryStatus;
  scope: string;
  as_of: string;
  queue_summary: WorkplaneReviewMemoryQueueSummary;
  candidates: WorkplaneReviewMemoryCandidate[];
  durable_memory_review_candidates: WorkplaneReviewMemoryCandidate[];
  perspective_update_candidates: WorkplaneReviewMemoryCandidate[];
  validation_required_candidates: WorkplaneReviewMemoryCandidate[];
  user_decision_candidates: WorkplaneReviewMemoryCandidate[];
  blocked_candidates: WorkplaneReviewMemoryCandidate[];
  decision_items: WorkplaneReviewMemoryDecisionItem[];
  gap_details: WorkplaneReviewMemoryGapDetail[];
  authority_boundary: WorkplaneReviewMemoryAuthorityBoundary;
  source_refs: string[];
  fallback_notes: string[];
  staleness_notes: string[];
  validation_summary: {
    status: WorkplaneReviewMemoryStatus;
    smoke_refs: string[];
    notes: string[];
  };
  notes: string[];
}
