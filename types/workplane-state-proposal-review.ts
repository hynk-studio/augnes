/**
 * Type-only Workplane State Proposal Review v0.1 contract.
 *
 * This file defines read-only proposal review context for Agent Workplane. It
 * imports nothing, performs no reads or writes, calls no routes, providers,
 * OpenAI, GitHub, Codex, runner runtime, proof/evidence, memory apply,
 * Perspective apply, or delta apply helpers, and has no side effects.
 */

export const WORKPLANE_STATE_PROPOSAL_REVIEW_VERSION =
  "workplane_state_proposal_review.v0.1" as const;

export const WORKPLANE_STATE_PROPOSAL_REVIEW_GROUP_IDS = [
  "field_level_proposal_diff",
  "before_after_state_preview",
  "proposal_impact_analysis",
  "memory_proposal_review",
  "perspective_lens_detail_edit",
  "local_draft_review",
  "manual_preview_editor",
  "manual_gravity_preview",
  "formation_basis_preview",
  "proposal_status_history",
  "needs_user_judgment_lane",
  "stale_fallback_warning_review",
  "authority_boundary_review",
] as const;

export const WORKPLANE_STATE_PROPOSAL_REVIEW_ITEM_KINDS = [
  "field_diff",
  "before_after_preview",
  "impact",
  "memory_proposal",
  "perspective_lens",
  "local_draft",
  "manual_preview",
  "manual_gravity",
  "formation_basis",
  "status_history",
  "stale_fallback_warning",
  "authority_boundary",
] as const;

export const WORKPLANE_STATE_PROPOSAL_REVIEW_RISK_LEVELS = [
  "low",
  "medium",
  "high",
] as const;

export const WORKPLANE_STATE_PROPOSAL_REVIEW_STATUSES = [
  "ready",
  "partial",
  "empty",
  "fallback",
  "needs_review",
  "blocked",
] as const;

export type WorkplaneStateProposalReviewGroupId =
  (typeof WORKPLANE_STATE_PROPOSAL_REVIEW_GROUP_IDS)[number];

export type WorkplaneStateProposalReviewItemKind =
  (typeof WORKPLANE_STATE_PROPOSAL_REVIEW_ITEM_KINDS)[number];

export type WorkplaneStateProposalReviewRiskLevel =
  (typeof WORKPLANE_STATE_PROPOSAL_REVIEW_RISK_LEVELS)[number];

export type WorkplaneStateProposalReviewStatus =
  (typeof WORKPLANE_STATE_PROPOSAL_REVIEW_STATUSES)[number];

export type WorkplaneStateProposalReviewSourceStatus =
  | "runtime"
  | "fixture_fallback"
  | "empty_fallback"
  | "mixed";

export interface WorkplaneStateProposalReviewItem {
  item_id: string;
  item_kind: WorkplaneStateProposalReviewItemKind;
  title: string;
  status: WorkplaneStateProposalReviewStatus;
  before_label?: string;
  after_label?: string;
  field_path?: string;
  before_value_preview?: string;
  after_value_preview?: string;
  impact_summary?: string;
  risk_level: WorkplaneStateProposalReviewRiskLevel;
  source_refs: string[];
  needs_user_judgment: boolean;
  authority_note: string;
}

export interface WorkplaneStateProposalReviewGroup {
  group_id: WorkplaneStateProposalReviewGroupId;
  title: string;
  status: WorkplaneStateProposalReviewStatus;
  destination: "workplane_state_proposal_review";
  summary: string;
  source_refs: string[];
  review_items: WorkplaneStateProposalReviewItem[];
  gaps: string[];
  authority_note: string;
}

export interface WorkplaneStateProposalReviewAuthorityBoundary {
  surface: "workplane_state_proposal_review";
  marker: "read_only_no_apply";
  can_approve_proposal: false;
  can_reject_proposal: false;
  can_commit_proposal: false;
  can_apply_memory: false;
  can_apply_perspective: false;
  can_auto_apply_delta: false;
  can_write_product_db: false;
  can_create_evidence: false;
  can_record_proof: false;
  can_call_provider_openai: false;
  can_call_github: false;
  can_actuate_github: false;
  can_execute_codex: false;
  can_execute_runner: false;
  can_tick_runner: false;
  can_recover_delta_batch: false;
  can_schedule_runner: false;
  can_merge_publish_retry_replay_deploy: false;
  can_use_local_storage_durable_mode: false;
  notes: string[];
}

export interface WorkplaneStateProposalReviewValidationSummary {
  status: WorkplaneStateProposalReviewStatus;
  smoke_refs: string[];
  notes: string[];
}

export interface WorkplaneStateProposalReviewSummary {
  group_count: number;
  item_count: number;
  source_ref_count: number;
  needs_user_judgment_count: number;
  fallback_warning_count: number;
  field_diff_count: number;
  before_after_preview_count: number;
}

export interface WorkplaneStateProposalReviewRead {
  review_version: typeof WORKPLANE_STATE_PROPOSAL_REVIEW_VERSION;
  scope: string;
  as_of: string;
  status: WorkplaneStateProposalReviewStatus;
  source_status: WorkplaneStateProposalReviewSourceStatus;
  fallback_reason: string | null;
  summary: WorkplaneStateProposalReviewSummary;
  proposal_groups: WorkplaneStateProposalReviewGroup[];
  field_level_diffs: WorkplaneStateProposalReviewItem[];
  before_after_previews: WorkplaneStateProposalReviewItem[];
  impact_items: WorkplaneStateProposalReviewItem[];
  memory_proposal_reviews: WorkplaneStateProposalReviewItem[];
  perspective_lens_reviews: WorkplaneStateProposalReviewItem[];
  local_draft_reviews: WorkplaneStateProposalReviewItem[];
  manual_preview_reviews: WorkplaneStateProposalReviewItem[];
  proposal_status_history: WorkplaneStateProposalReviewItem[];
  needs_user_judgment: WorkplaneStateProposalReviewItem[];
  stale_fallback_warnings: WorkplaneStateProposalReviewItem[];
  authority_boundary: WorkplaneStateProposalReviewAuthorityBoundary;
  source_refs: string[];
  validation_summary: WorkplaneStateProposalReviewValidationSummary;
  next_review_targets: string[];
}
