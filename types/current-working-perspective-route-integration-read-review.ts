import type { CurrentWorkingPerspectiveRouteIntegrationRead } from "./current-working-perspective-route-integration-read";

export const CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_READ_REVIEW_VERSION =
  "current_working_perspective_route_integration_read_review.v0.1" as const;

export interface CurrentWorkingPerspectiveRouteIntegrationReadReviewInput {
  route_integration_read?: unknown;
  selected_contract_record_id?: string | null;
  selected_applied_snapshot_ref?: string | null;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export type CurrentWorkingPerspectiveRouteIntegrationReadReviewStatus =
  | "runtime_only"
  | "integration_available"
  | "applied_snapshot_overlay_available"
  | "applied_snapshot_preferred_available"
  | "fallback_to_runtime"
  | "integration_invalid";

export interface CurrentWorkingPerspectiveRouteIntegrationReadReviewAuthorityBoundary {
  read_only: true;
  route_integration_read_review_only: true;
  source_of_truth: false;
  can_write_db: false;
  can_create_schema: false;
  can_modify_api_perspective_current_route: false;
  can_replace_current_working_perspective_route_response: false;
  can_update_upstream_current_working_perspective_source_tables: false;
  can_mutate_upstream_current_working_perspective_source_tables: false;
  can_write_applied_current_working_perspective_snapshot: false;
  can_write_current_working_perspective_apply_record: false;
  can_write_current_working_perspective_update_contract_record: false;
  can_write_route_integration_contract_record: false;
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

export interface CurrentWorkingPerspectiveRouteIntegrationReadReview {
  review_version: typeof CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_READ_REVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  review_status: CurrentWorkingPerspectiveRouteIntegrationReadReviewStatus;
  input_summary: {
    has_route_integration_read: boolean;
    read_status: string | null;
    response_mode: string | null;
    selected_contract_record_id: string | null;
    selected_contract_record_found: boolean;
    selected_applied_snapshot_ref: string | null;
    selected_applied_snapshot_found: boolean;
    runtime_fallback_available: boolean;
    applied_snapshot_participates: boolean;
  };
  route_integration_summary: {
    route_path: string | null;
    route_family: string | null;
    response_mode: string | null;
    primary_source: "runtime" | "applied_snapshot" | "none";
    status: string | null;
  };
  contract_summary: {
    contract_record_id: string | null;
    route_integration_mode: string | null;
    source_applied_snapshot_ref: string | null;
    source_cwp_apply_record_ref_count: number;
    source_cwp_update_contract_record_ref_count: number;
  };
  applied_snapshot_summary: {
    applied_snapshot_ref: string | null;
    source_contract_record_ref: string | null;
    source_apply_record_ref: string | null;
    applied_patch_count: number;
    overlay_candidate: boolean;
    preferred_primary: boolean;
  };
  runtime_fallback_summary: {
    runtime_cwp_available: boolean;
    used_runtime_fallback: boolean;
    fallback_reason: string | null;
  };
  blocked_reasons: string[];
  warning_reasons: string[];
  refusal_reasons: string[];
  operator_review_checklist: string[];
  would_not_do: string[];
  non_goals: string[];
  authority_boundary: CurrentWorkingPerspectiveRouteIntegrationReadReviewAuthorityBoundary;
  route_integration_read: CurrentWorkingPerspectiveRouteIntegrationRead | null;
}
