import type { AppliedCurrentWorkingPerspectiveRead } from "@/lib/perspective/read-applied-current-working-perspective-for-web";
import type { CurrentWorkingPerspective } from "./current-working-perspective";
import type { CurrentWorkingPerspectiveRouteIntegrationMode } from "./current-working-perspective-route-integration-contract-preview";
import type {
  CurrentWorkingPerspectiveRouteIntegrationContractRecord,
  CurrentWorkingPerspectiveRouteIntegrationContractStoreResult,
} from "./current-working-perspective-route-integration-contract-write";

export const CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_READ_VERSION =
  "current_working_perspective_route_integration_read.v0.1" as const;

export const CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_READ_SCOPE =
  "project:augnes" as const;

export type CurrentWorkingPerspectiveRouteIntegrationReadMode = Exclude<
  CurrentWorkingPerspectiveRouteIntegrationMode,
  "keep_runtime_only"
>;

export type CurrentWorkingPerspectiveRouteIntegrationReadStatus =
  | "runtime_only"
  | "runtime_with_applied_snapshot_hint"
  | "runtime_with_applied_snapshot_overlay_candidate"
  | "applied_snapshot_preferred_with_runtime_fallback"
  | "contract_missing"
  | "contract_invalid"
  | "applied_snapshot_missing"
  | "applied_snapshot_invalid"
  | "fallback_to_runtime";

export type CurrentWorkingPerspectiveRouteIntegrationResponseMode =
  | "runtime_only"
  | "runtime_primary_with_applied_snapshot_hint"
  | "runtime_primary_with_applied_overlay_candidate"
  | "applied_snapshot_preferred_with_runtime_fallback";

export interface CurrentWorkingPerspectiveRouteIntegrationReadInput {
  runtime_current_working_perspective_read?: unknown;
  runtime_current_working_perspective?: unknown;
  route_integration_contract_store_result?: unknown;
  route_integration_contract_record?: unknown;
  applied_current_working_perspective_read?: unknown;
  requested_route_integration_mode?: CurrentWorkingPerspectiveRouteIntegrationReadMode;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export interface CurrentWorkingPerspectiveRouteIntegrationAuthorityBoundary {
  read_only: true;
  route_integration_read_only: true;
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

export interface CurrentWorkingPerspectiveRouteIntegrationCwpSummary {
  cwp_ref: string | null;
  perspective_version: string | null;
  scope: string | null;
  as_of: string | null;
  current_frame_summary: string | null;
  current_thesis_summary: string | null;
  active_goal_count: number;
  open_question_count: number;
  active_risk_count: number;
  next_candidate_count: number;
  staleness_status: string | null;
}

export interface CurrentWorkingPerspectiveRouteIntegrationContractSummary {
  record_id: string | null;
  route_path: string;
  route_family: string;
  route_integration_mode: CurrentWorkingPerspectiveRouteIntegrationReadMode | null;
  source_applied_snapshot_ref: string | null;
  source_cwp_apply_record_refs: string[];
  source_cwp_update_contract_record_refs: string[];
  guard_count: number;
}

export interface CurrentWorkingPerspectiveRouteIntegrationAppliedSnapshotMetadata {
  applied_snapshot_ref: string | null;
  source_contract_record_ref: string | null;
  source_apply_record_ref: string | null;
  source_current_working_perspective_ref: string | null;
  as_of: string | null;
  applied_patch_count: number;
  overlay_candidate: boolean;
  preferred_primary: boolean;
}

export interface CurrentWorkingPerspectiveRouteIntegrationMetadata {
  read_version: typeof CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_READ_VERSION;
  route_path: "/api/perspective/current";
  route_family: "current_working_perspective";
  approved_contract_required: true;
  explicit_safe_paths_required: true;
  never_write_on_get: true;
  runtime_fallback_preserved: true;
  contract_record_id: string | null;
  applied_snapshot_ref: string | null;
  requested_route_integration_mode: CurrentWorkingPerspectiveRouteIntegrationReadMode | null;
  effective_response_mode: CurrentWorkingPerspectiveRouteIntegrationResponseMode;
}

export interface CurrentWorkingPerspectiveRouteIntegrationFallbackMetadata {
  used_runtime_fallback: boolean;
  fallback_reason: string | null;
  runtime_cwp_available: boolean;
  applied_snapshot_available: boolean;
}

export interface CurrentWorkingPerspectiveRouteIntegrationRead {
  read_version: typeof CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_READ_VERSION;
  scope: typeof CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_READ_SCOPE;
  as_of: string;
  status: CurrentWorkingPerspectiveRouteIntegrationReadStatus;
  route_path: "/api/perspective/current";
  route_family: "current_working_perspective";
  response_mode: CurrentWorkingPerspectiveRouteIntegrationResponseMode;
  primary_current_working_perspective: CurrentWorkingPerspective | null;
  runtime_current_working_perspective: CurrentWorkingPerspective | null;
  applied_current_working_perspective: CurrentWorkingPerspective | null;
  runtime_current_working_perspective_summary: CurrentWorkingPerspectiveRouteIntegrationCwpSummary;
  applied_current_working_perspective_summary: CurrentWorkingPerspectiveRouteIntegrationCwpSummary;
  contract_summary: CurrentWorkingPerspectiveRouteIntegrationContractSummary;
  applied_snapshot_metadata: CurrentWorkingPerspectiveRouteIntegrationAppliedSnapshotMetadata;
  route_integration_metadata: CurrentWorkingPerspectiveRouteIntegrationMetadata;
  fallback_metadata: CurrentWorkingPerspectiveRouteIntegrationFallbackMetadata;
  source_refs: string[];
  evidence_refs: string[];
  refusal_reasons: string[];
  blocked_reasons: string[];
  warnings: string[];
  authority_boundary: CurrentWorkingPerspectiveRouteIntegrationAuthorityBoundary;
}

export type CurrentWorkingPerspectiveRouteIntegrationReadRuntimeCwp =
  CurrentWorkingPerspective;
export type CurrentWorkingPerspectiveRouteIntegrationReadAppliedRead =
  AppliedCurrentWorkingPerspectiveRead;
export type CurrentWorkingPerspectiveRouteIntegrationReadContractRecord =
  CurrentWorkingPerspectiveRouteIntegrationContractRecord;
export type CurrentWorkingPerspectiveRouteIntegrationReadContractStoreResult =
  CurrentWorkingPerspectiveRouteIntegrationContractStoreResult;
