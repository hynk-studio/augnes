import type { CurrentWorkingPerspective } from "./current-working-perspective";
import type { CurrentWorkingPerspectivePatchEntry } from "./current-working-perspective-update-contract-preview";
import type {
  CurrentWorkingPerspectiveUpdateContractRecord,
  CurrentWorkingPerspectiveUpdateContractStoreResult,
} from "./current-working-perspective-update-contract-write";
import type { CurrentWorkingPerspectiveUpdateContractRecordReview } from "./current-working-perspective-update-contract-record-review";

export const CURRENT_WORKING_PERSPECTIVE_APPLY_PREVIEW_VERSION =
  "current_working_perspective_apply_preview.v0.1" as const;

export interface CurrentWorkingPerspectiveApplyPreviewInput {
  current_working_perspective_update_contract_record_review?: unknown;
  current_working_perspective_update_contract_record?: unknown;
  current_working_perspective_read?: unknown;
  current_working_perspective?: unknown;
  requested_operator_ref?: string;
  requested_idempotency_key?: string;
  review_confirmation_ref?: string;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export type CurrentWorkingPerspectiveApplyPreviewStatus =
  | "no_current_working_perspective_update_contract_record"
  | "no_current_working_perspective_material"
  | "insufficient_data"
  | "blocked"
  | "needs_more_evidence"
  | "ready_for_operator_review"
  | "ready_for_future_current_working_perspective_apply_record_write"
  | "keep_preview_only";

export type CurrentWorkingPerspectiveApplyRecommendedNextAction =
  | "supply_current_working_perspective_update_contract_record"
  | "supply_current_working_perspective_material"
  | "review_current_working_perspective_apply_preview"
  | "write_current_working_perspective_apply_record"
  | "resolve_current_working_perspective_apply_blockers"
  | "keep_preview_only";

export interface CurrentWorkingPerspectiveApplyReadiness {
  write_ready: boolean;
  readiness_label: string;
  requires_current_working_perspective_update_contract_record: true;
  requires_current_working_perspective_material: true;
  requires_review_confirmation: true;
  requires_idempotency_key: true;
  requires_operator_ref: true;
  requires_source_refs: true;
  requires_evidence_refs: true;
  requires_no_blockers: true;
  current_blockers: string[];
  current_missing_evidence: string[];
  current_refusal_reasons: string[];
  current_insufficient_data: string[];
}

export interface CurrentWorkingPerspectiveApplyAuthorityBoundary {
  read_only: true;
  advisory_only: true;
  apply_preview_only: true;
  source_of_truth: false;
  derived_read_model: true;
  can_write_db: false;
  can_create_current_working_perspective_apply_record: false;
  can_create_applied_current_working_perspective_snapshot: false;
  can_update_current_working_perspective: false;
  can_mutate_current_working_perspective: false;
  can_write_current_working_perspective_live_state: false;
  can_apply_current_working_perspective_update: false;
  can_write_perspective_unit: false;
  can_write_next_work_bias: false;
  can_write_continuity_relay: false;
  can_update_continuity_relay: false;
  can_apply_live_relay_state: false;
  can_mutate_handoff_context: false;
  can_apply_handoff_context: false;
  can_write_selected_refs_to_live_handoff: false;
  can_send_handoff: false;
  can_write_memory: false;
  can_mutate_memory: false;
  can_promote_memory: false;
  can_update_global_dogfood_metrics: false;
  can_write_dogfood_metrics: false;
  can_write_dogfood_metric_snapshot: false;
  can_write_reuse_outcome_ledger: false;
  can_write_expected_observed_delta: false;
  can_write_work_episode: false;
  can_call_provider_openai: false;
  can_call_github: false;
  can_execute_codex: false;
  can_create_pr: false;
  can_merge_pr: false;
  can_run_autonomous_action: false;
  can_create_graph_or_vector_store: false;
  can_create_rag_stack: false;
  can_crawl_or_observe_browser: false;
  can_render_workbench_action_button: false;
  notes: string[];
}

export interface CurrentWorkingPerspectiveApplyPatchApplicationSummary {
  applied_patch_count: number;
  applied_patch_refs: string[];
  patch_target_counts: Record<string, number>;
  patch_operation_counts: Record<string, number>;
  preserved_existing_cwp_ref: string | null;
  source_contract_record_ref: string | null;
  source_contract_record_fingerprint: string | null;
}

export interface CurrentWorkingPerspectiveApplyPreview {
  preview_version: typeof CURRENT_WORKING_PERSPECTIVE_APPLY_PREVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  apply_preview_status: CurrentWorkingPerspectiveApplyPreviewStatus;
  recommended_next_action: CurrentWorkingPerspectiveApplyRecommendedNextAction;
  input_summary: {
    has_current_working_perspective_update_contract_record_review: boolean;
    has_current_working_perspective_update_contract_record: boolean;
    has_current_working_perspective_material: boolean;
    current_working_perspective_source_status:
      | "runtime"
      | "supplied"
      | "fixture_fallback"
      | "empty_fallback"
      | "missing"
      | "malformed";
    selected_contract_record_id: string | null;
    proposed_patch_entry_count: number;
    applied_patch_count: number;
    blocker_count: number;
    missing_evidence_count: number;
    refusal_reason_count: number;
    insufficient_data_reason_count: number;
    review_confirmation_supplied: boolean;
    requested_idempotency_key_supplied: boolean;
    requested_operator_ref_supplied: boolean;
  };
  source_status: {
    current_working_perspective_update_contract_record_review:
      | "supplied"
      | "missing"
      | "invalid"
      | "malformed";
    current_working_perspective_update_contract_record:
      | "supplied"
      | "missing"
      | "invalid"
      | "selected_missing";
    current_working_perspective:
      | "supplied"
      | "runtime"
      | "fixture_fallback"
      | "empty_fallback"
      | "missing"
      | "wrong_version"
      | "wrong_scope"
      | "malformed";
    review_confirmation_ref: "supplied" | "missing" | "unsafe";
    requested_idempotency_key: "supplied" | "missing" | "unsafe";
    requested_operator_ref: "supplied" | "missing" | "unsafe";
  };
  apply_readiness: CurrentWorkingPerspectiveApplyReadiness;
  approval_requirements: string[];
  blocking_reasons: string[];
  missing_evidence: string[];
  refusal_reasons: string[];
  evidence_summary: {
    has_valid_contract_record: boolean;
    has_valid_current_working_perspective_material: boolean;
    has_source_refs: boolean;
    has_evidence_refs: boolean;
    has_review_confirmation: boolean;
    has_idempotency_key: boolean;
    has_operator_ref: boolean;
    has_missing_evidence: boolean;
    has_refusal_reasons: boolean;
    has_unsafe_refs: boolean;
    source_refs: string[];
    evidence_refs: string[];
    missing_evidence: string[];
    unsafe_refs: string[];
  };
  source_contract_summary: {
    record_id: string | null;
    record_fingerprint: string | null;
    proposed_patch_entry_count: number;
    source_current_working_perspective_ref: string | null;
  };
  current_working_perspective_before_summary: CurrentWorkingPerspectiveSummary;
  proposed_applied_current_working_perspective_summary:
    CurrentWorkingPerspectiveSummary & {
      applied_snapshot_ref: string | null;
      source_contract_record_ref: string | null;
      gap_count: number;
    };
  proposed_applied_current_working_perspective: CurrentWorkingPerspective | null;
  proposed_patch_application_summary: CurrentWorkingPerspectiveApplyPatchApplicationSummary;
  would_write_current_working_perspective_apply_record_preview: {
    proposed_record_kind: "current_working_perspective_apply_record.v0.1" | null;
    proposed_receipt_kind:
      | "current_working_perspective_apply_receipt.v0.1"
      | null;
    proposed_store_kind: "current_working_perspective_apply_store.v0.1" | null;
    proposed_applied_snapshot_kind:
      | "current_working_perspective_applied_snapshot.v0.1"
      | null;
    source_current_working_perspective_ref: string | null;
    source_current_working_perspective_update_contract_record_ref: string | null;
    source_current_working_perspective_update_contract_record_fingerprint:
      | string
      | null;
    applied_snapshot_ref: string | null;
    applied_current_working_perspective: CurrentWorkingPerspective | null;
    patch_application_summary: CurrentWorkingPerspectiveApplyPatchApplicationSummary;
    applied_patch_refs: string[];
    source_refs: string[];
    evidence_refs: string[];
    requested_operator_ref: string | null;
    requested_idempotency_key: string | null;
    review_confirmation_ref: string | null;
    review_summary: string;
  };
  operator_review_checklist: string[];
  would_not_write: string[];
  non_goals: string[];
  authority_boundary: CurrentWorkingPerspectiveApplyAuthorityBoundary;
}

export interface CurrentWorkingPerspectiveSummary {
  current_cwp_ref: string | null;
  perspective_version: string | null;
  scope: string | null;
  as_of: string | null;
  source_status: string;
  current_frame_summary: string | null;
  current_thesis_summary: string | null;
  active_goal_count: number;
  open_question_count: number;
  active_risk_count: number;
  next_candidate_count: number;
  staleness_status: string | null;
}

export type CurrentWorkingPerspectiveApplyCurrentPerspective =
  CurrentWorkingPerspective;
export type CurrentWorkingPerspectiveApplyUpdateContractRecordReview =
  CurrentWorkingPerspectiveUpdateContractRecordReview;
export type CurrentWorkingPerspectiveApplyUpdateContractRecord =
  CurrentWorkingPerspectiveUpdateContractRecord;
export type CurrentWorkingPerspectiveApplyUpdateContractStoreResult =
  CurrentWorkingPerspectiveUpdateContractStoreResult;
export type CurrentWorkingPerspectiveApplyPatchEntry =
  CurrentWorkingPerspectivePatchEntry;
