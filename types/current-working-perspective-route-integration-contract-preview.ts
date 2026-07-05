import type { AppliedCurrentWorkingPerspectiveRead } from "@/lib/perspective/read-applied-current-working-perspective-for-web";
import type { CurrentWorkingPerspective } from "./current-working-perspective";
import type { CurrentWorkingPerspectiveApplyRecordReview } from "./current-working-perspective-apply-record-review";
import type { CurrentWorkingPerspectiveUpdateContractRecordReview } from "./current-working-perspective-update-contract-record-review";

export const CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_PREVIEW_VERSION =
  "current_working_perspective_route_integration_contract_preview.v0.1" as const;

export type CurrentWorkingPerspectiveRouteIntegrationMode =
  | "runtime_only_with_applied_snapshot_hint"
  | "applied_snapshot_overlay_candidate"
  | "applied_snapshot_preferred_with_runtime_fallback"
  | "keep_runtime_only";

export interface CurrentWorkingPerspectiveRouteIntegrationContractPreviewInput {
  current_working_perspective_read?: unknown;
  current_working_perspective?: unknown;
  applied_current_working_perspective_read?: unknown;
  current_working_perspective_apply_record_review?: unknown;
  current_working_perspective_update_contract_record_review?: unknown;
  requested_operator_ref?: string;
  requested_idempotency_key?: string;
  review_confirmation_ref?: string;
  requested_route_integration_mode?: CurrentWorkingPerspectiveRouteIntegrationMode;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export type CurrentWorkingPerspectiveRouteIntegrationContractPreviewStatus =
  | "no_runtime_current_working_perspective_material"
  | "no_applied_current_working_perspective_snapshot"
  | "insufficient_data"
  | "blocked"
  | "needs_more_evidence"
  | "ready_for_operator_review"
  | "ready_for_future_current_working_perspective_route_integration_contract_record_write"
  | "keep_preview_only";

export type CurrentWorkingPerspectiveRouteIntegrationContractRecommendedNextAction =
  | "supply_runtime_current_working_perspective_material"
  | "supply_applied_current_working_perspective_snapshot"
  | "review_current_working_perspective_route_integration_contract"
  | "write_current_working_perspective_route_integration_contract_record"
  | "resolve_current_working_perspective_route_integration_blockers"
  | "keep_runtime_only"
  | "keep_preview_only";

export interface CurrentWorkingPerspectiveRouteIntegrationContractReadiness {
  write_ready: boolean;
  readiness_label: string;
  requires_runtime_current_working_perspective: true;
  requires_applied_current_working_perspective_snapshot: true;
  requires_apply_record_review: true;
  requires_route_integration_mode: true;
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

export interface CurrentWorkingPerspectiveRouteIntegrationContractAuthorityBoundary {
  read_only: true;
  advisory_only: true;
  contract_material_only: true;
  source_of_truth: false;
  derived_read_model: true;
  can_write_db: false;
  can_create_current_working_perspective_route_integration_contract_record: false;
  can_modify_api_perspective_current_route: false;
  can_replace_current_working_perspective_route_response: false;
  can_update_upstream_current_working_perspective_source_tables: false;
  can_mutate_upstream_current_working_perspective_source_tables: false;
  can_write_applied_current_working_perspective_snapshot: false;
  can_write_current_working_perspective_apply_record: false;
  can_write_current_working_perspective_update_contract_record: false;
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

export interface CurrentWorkingPerspectiveRouteIntegrationSummary {
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

export interface CurrentWorkingPerspectiveRouteIntegrationDiffSummary {
  runtime_cwp_ref: string | null;
  applied_snapshot_ref: string | null;
  applied_snapshot_source_contract_record_ref: string | null;
  applied_snapshot_source_apply_record_ref: string | null;
  frame_summary_changed: boolean;
  thesis_summary_changed: boolean;
  active_goal_delta: number;
  open_question_delta: number;
  active_risk_delta: number;
  next_candidate_delta: number;
  applied_patch_count: number;
  route_path: "/api/perspective/current";
}

export interface CurrentWorkingPerspectiveRouteIntegrationContractMaterial {
  contract_kind: "current_working_perspective_route_integration_contract.v0.1";
  route_family: "current_working_perspective";
  route_path: "/api/perspective/current";
  route_version_before: "perspective.current.v0.1";
  current_runtime_cwp_ref: string | null;
  applied_snapshot_ref: string | null;
  applied_snapshot_source_contract_record_ref: string | null;
  applied_snapshot_source_apply_record_ref: string | null;
  requested_route_integration_mode: CurrentWorkingPerspectiveRouteIntegrationMode;
  proposed_future_route_behavior: {
    default_mode: string;
    runtime_fallback_behavior: string;
    applied_snapshot_participation: string;
    freshness_policy: string;
    staleness_policy: string;
    error_policy: string;
    local_read_auth_policy: string;
    cache_policy: string;
    response_metadata_policy: string;
    audit_receipt_policy: string;
  };
  proposed_response_contract: {
    response_version: "perspective.current.route_integration_candidate.v0.1";
    includes_runtime_cwp: boolean;
    includes_applied_snapshot_metadata: boolean;
    includes_route_integration_metadata: boolean;
    includes_authority_boundary: true;
    does_not_include_raw_private_material: true;
  };
  route_integration_guards: {
    require_local_read_marker: true;
    require_project_augnes_scope: true;
    require_safe_applied_snapshot_db_path: true;
    require_schema_existing_for_applied_snapshot_reads: true;
    refuse_private_paths: true;
    refuse_route_replacement_without_approved_record: true;
    preserve_runtime_fallback: true;
    never_write_on_get: true;
  };
  blocked_live_mutations: string[];
  future_implementation_requirements: string[];
  rollback_and_fallback_plan: string[];
  operator_acceptance_criteria: string[];
}

export interface CurrentWorkingPerspectiveRouteIntegrationContractPreview {
  preview_version: typeof CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_PREVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  contract_preview_status: CurrentWorkingPerspectiveRouteIntegrationContractPreviewStatus;
  recommended_next_action: CurrentWorkingPerspectiveRouteIntegrationContractRecommendedNextAction;
  input_summary: {
    has_runtime_current_working_perspective_material: boolean;
    has_applied_current_working_perspective_read: boolean;
    has_latest_applied_snapshot: boolean;
    has_apply_record_review: boolean;
    has_update_contract_record_review: boolean;
    runtime_current_working_perspective_source_status:
      | "runtime"
      | "supplied"
      | "fixture_fallback"
      | "empty_fallback"
      | "missing"
      | "malformed";
    requested_route_integration_mode: CurrentWorkingPerspectiveRouteIntegrationMode | null;
    applied_snapshot_ref: string | null;
    apply_record_ref: string | null;
    blocker_count: number;
    missing_evidence_count: number;
    refusal_reason_count: number;
    insufficient_data_reason_count: number;
    review_confirmation_supplied: boolean;
    requested_idempotency_key_supplied: boolean;
    requested_operator_ref_supplied: boolean;
  };
  source_status: {
    runtime_current_working_perspective:
      | "supplied"
      | "runtime"
      | "fixture_fallback"
      | "empty_fallback"
      | "missing"
      | "wrong_version"
      | "wrong_scope"
      | "malformed";
    applied_current_working_perspective_read:
      | "latest_applied_snapshot_available"
      | "no_applied_snapshot"
      | "missing"
      | "malformed"
      | "invalid";
    current_working_perspective_apply_record_review:
      | "supplied"
      | "missing"
      | "invalid"
      | "malformed";
    current_working_perspective_update_contract_record_review:
      | "supplied"
      | "missing"
      | "invalid"
      | "malformed";
    requested_route_integration_mode:
      | "supplied"
      | "missing"
      | "keep_runtime_only";
    review_confirmation_ref: "supplied" | "missing" | "unsafe";
    requested_idempotency_key: "supplied" | "missing" | "unsafe";
    requested_operator_ref: "supplied" | "missing" | "unsafe";
  };
  contract_readiness: CurrentWorkingPerspectiveRouteIntegrationContractReadiness;
  approval_requirements: string[];
  blocking_reasons: string[];
  missing_evidence: string[];
  refusal_reasons: string[];
  evidence_summary: {
    has_valid_runtime_current_working_perspective_material: boolean;
    has_valid_applied_snapshot: boolean;
    has_valid_apply_record_review: boolean;
    has_valid_update_contract_record_review: boolean;
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
  runtime_current_working_perspective_summary: CurrentWorkingPerspectiveRouteIntegrationSummary;
  applied_current_working_perspective_summary:
    CurrentWorkingPerspectiveRouteIntegrationSummary & {
      applied_snapshot_ref: string | null;
      source_contract_record_ref: string | null;
      applied_patch_count: number;
    };
  route_integration_diff_summary: CurrentWorkingPerspectiveRouteIntegrationDiffSummary;
  proposed_current_working_perspective_route_integration_contract:
    | CurrentWorkingPerspectiveRouteIntegrationContractMaterial
    | null;
  would_write_current_working_perspective_route_integration_contract_record_preview: {
    proposed_record_kind:
      | "current_working_perspective_route_integration_contract_record.v0.1"
      | null;
    proposed_receipt_kind:
      | "current_working_perspective_route_integration_contract_receipt.v0.1"
      | null;
    proposed_store_kind:
      | "current_working_perspective_route_integration_contract_store.v0.1"
      | null;
    route_path: "/api/perspective/current";
    route_family: "current_working_perspective";
    source_runtime_current_working_perspective_ref: string | null;
    source_applied_snapshot_ref: string | null;
    source_cwp_apply_record_refs: string[];
    source_cwp_update_contract_record_refs: string[];
    route_integration_mode: CurrentWorkingPerspectiveRouteIntegrationMode | null;
    proposed_route_integration_contract:
      | CurrentWorkingPerspectiveRouteIntegrationContractMaterial
      | null;
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
  authority_boundary: CurrentWorkingPerspectiveRouteIntegrationContractAuthorityBoundary;
}

export type CurrentWorkingPerspectiveRouteIntegrationRuntimeCwp =
  CurrentWorkingPerspective;
export type CurrentWorkingPerspectiveRouteIntegrationAppliedRead =
  AppliedCurrentWorkingPerspectiveRead;
export type CurrentWorkingPerspectiveRouteIntegrationApplyRecordReview =
  CurrentWorkingPerspectiveApplyRecordReview;
export type CurrentWorkingPerspectiveRouteIntegrationUpdateContractRecordReview =
  CurrentWorkingPerspectiveUpdateContractRecordReview;
