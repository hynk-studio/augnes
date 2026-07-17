/**
 * Workbench Spine Consolidation / Operator Dashboard v0.1.
 *
 * Read-only consolidation of the local CWP -> handoff context -> packet
 * artifact -> send contract -> local fulfillment spine. This contract does not
 * create a source-of-truth store, open DBs, write records, call providers, or
 * send external messages.
 */

import type { AppliedCurrentWorkingPerspectiveRead } from "@/lib/perspective/read-applied-current-working-perspective-for-web";
import type { AppliedHandoffContextRead } from "@/lib/workplane/read-applied-handoff-context-for-web";
import type { ExportedHandoffPacketArtifactRead } from "@/types/exported-handoff-packet-artifact-read";
import type { SentHandoffReadForWeb } from "@/lib/workplane/read-sent-handoff-for-web";
import type { CurrentWorkingPerspectiveRouteIntegrationRead } from "./current-working-perspective-route-integration-read";
import type { CurrentWorkingPerspectiveApplyRecordReview } from "./current-working-perspective-apply-record-review";
import type { HandoffContextApplyRecordReview } from "./handoff-context-apply-record-review";
import type { HandoffPacketCopyExportRecordReview } from "./handoff-packet-copy-export-record-review";
import type { HandoffSendContractRecordReview } from "./handoff-send-contract-record-review";
import type { HandoffSendRecordReview } from "./handoff-send-record-review";

export const WORKBENCH_SPINE_CONSOLIDATION_VERSION =
  "workbench_spine_consolidation.v0.1" as const;

export type WorkbenchSpineConsolidationStatus =
  | "no_spine_material"
  | "insufficient_data"
  | "blocked"
  | "spine_in_progress"
  | "local_fulfillment_available";

export type WorkbenchSpineStageStatus =
  | "missing"
  | "available"
  | "approved"
  | "applied"
  | "exported"
  | "fulfilled"
  | "blocked"
  | "insufficient_data"
  | "not_configured"
  | "not_attempted";

export type WorkbenchSpinePhaseId =
  | "cwp_foundation"
  | "handoff_context"
  | "packet_artifact"
  | "send_fulfillment"
  | "external_delivery";

export type WorkbenchSpineStageId =
  | "applied_current_working_perspective"
  | "current_working_perspective_route_integration"
  | "applied_handoff_context"
  | "exported_handoff_packet_artifact"
  | "handoff_send_contract_record"
  | "local_handoff_send_fulfillment"
  | "external_handoff_delivery";

export type WorkbenchSpineExternalDeliveryStatus =
  | "not_configured"
  | "not_attempted"
  | "blocked";

export type WorkbenchSpineRecommendedOperatorAction =
  | "review_applied_current_working_perspective_snapshot"
  | "review_current_working_perspective_route_integration_read"
  | "review_applied_handoff_context_snapshot"
  | "review_exported_handoff_packet_artifact"
  | "review_handoff_send_contract_record"
  | "review_handoff_send_record"
  | "review_sent_handoff_status"
  | "prepare_external_handoff_delivery_contract"
  | "resolve_workbench_spine_consolidation_blockers"
  | "keep_reviewing_local_spine";

export interface WorkbenchSpineConsolidationInput {
  applied_current_working_perspective_read?: AppliedCurrentWorkingPerspectiveRead | unknown;
  current_working_perspective_route_integration_read?: CurrentWorkingPerspectiveRouteIntegrationRead | unknown;
  current_working_perspective_apply_record_review?: CurrentWorkingPerspectiveApplyRecordReview | unknown;
  handoff_context_apply_record_review?: HandoffContextApplyRecordReview | unknown;
  applied_handoff_context_read?: AppliedHandoffContextRead | unknown;
  handoff_packet_copy_export_record_review?: HandoffPacketCopyExportRecordReview | unknown;
  exported_handoff_packet_artifact_read?: ExportedHandoffPacketArtifactRead | unknown;
  handoff_send_contract_record_review?: HandoffSendContractRecordReview | unknown;
  handoff_send_record_review?: HandoffSendRecordReview | unknown;
  sent_handoff_read?: SentHandoffReadForWeb | unknown;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export interface WorkbenchSpineStageSummary {
  stage_id: WorkbenchSpineStageId;
  phase_id: WorkbenchSpinePhaseId;
  label: string;
  status: WorkbenchSpineStageStatus;
  primary_ref: string | null;
  source_status: string | null;
  summary: string;
  blocker_reasons: string[];
  missing_prerequisites: string[];
  authority_warnings: string[];
  source_refs: string[];
  evidence_refs: string[];
  material_count: number;
  read_only: true;
}

export interface WorkbenchSpinePhaseGroup {
  phase_id: WorkbenchSpinePhaseId;
  label: string;
  status: WorkbenchSpineStageStatus;
  summary: string;
  stages: WorkbenchSpineStageSummary[];
}

export interface WorkbenchSpineLineageNode {
  node_id: WorkbenchSpineStageId;
  label: string;
  ref: string | null;
  status: WorkbenchSpineStageStatus;
}

export interface WorkbenchSpineLineageEdge {
  from: WorkbenchSpineStageId;
  to: WorkbenchSpineStageId;
  relationship: string;
  linked: boolean;
  expected_ref: string | null;
  observed_ref: string | null;
  problem: string | null;
}

export interface WorkbenchSpineLineageMap {
  map_version: "workbench_spine_lineage_map.v0.1";
  nodes: WorkbenchSpineLineageNode[];
  edges: WorkbenchSpineLineageEdge[];
  missing_links: string[];
}

export interface WorkbenchSpineRecommendedOperatorActionSummary {
  action: WorkbenchSpineRecommendedOperatorAction;
  stage_id: WorkbenchSpineStageId | null;
  rationale: string[];
}

export interface WorkbenchSpineExternalDeliverySummary {
  status: WorkbenchSpineExternalDeliveryStatus;
  local_fulfillment_is_external_delivery: false;
  provider_contract_present: false;
  provider_called: false;
  external_message_sent: false;
  recommended_future_contract: "external_handoff_delivery_contract.v0.1";
  notes: string[];
}

export interface WorkbenchSpineConsolidationAuthorityBoundary {
  read_only: true;
  advisory_only: true;
  derived_read_model: true;
  source_of_truth: false;
  can_write_db: false;
  can_create_schema: false;
  can_create_source_of_truth_store: false;
  can_mutate_current_working_perspective: false;
  can_replace_current_working_perspective_route_response: false;
  can_apply_handoff_context: false;
  can_mutate_handoff_context: false;
  can_write_selected_refs_to_live_handoff: false;
  can_copy_export_handoff_packet: false;
  can_send_handoff: false;
  can_call_send_provider: false;
  can_call_external_messaging: false;
  can_call_email: false;
  can_call_slack: false;
  can_call_webhook: false;
  can_call_provider_openai: false;
  can_call_github: false;
  can_execute_codex: false;
  can_call_browser_or_crawler: false;
  can_write_clipboard: false;
  can_download_file: false;
  can_write_arbitrary_file: false;
  can_write_memory: false;
  can_mutate_memory: false;
  can_promote_memory: false;
  can_write_dogfood_metrics: false;
  can_update_global_dogfood_metrics: false;
  can_create_pr: false;
  can_merge_pr: false;
  can_run_autonomous_action: false;
  can_create_graph_or_vector_store: false;
  can_create_rag_stack: false;
  can_crawl_or_observe_browser: false;
  can_render_workbench_action_button: false;
  notes: string[];
}

export interface WorkbenchSpineConsolidation {
  dashboard_version: typeof WORKBENCH_SPINE_CONSOLIDATION_VERSION;
  scope: "project:augnes";
  as_of: string;
  source_refs: string[];
  dashboard_status: WorkbenchSpineConsolidationStatus;
  recommended_next_operator_action: WorkbenchSpineRecommendedOperatorActionSummary;
  external_delivery: WorkbenchSpineExternalDeliverySummary;
  phase_groups: WorkbenchSpinePhaseGroup[];
  stage_summaries: WorkbenchSpineStageSummary[];
  lineage_map: WorkbenchSpineLineageMap;
  blocker_summary: {
    blockers: string[];
    missing_prerequisites: string[];
    authority_warnings: string[];
    malformed_inputs: string[];
  };
  compact_summary: {
    stage_count: number;
    fulfilled_stage_count: number;
    blocked_stage_count: number;
    missing_stage_count: number;
    lineage_link_count: number;
    lineage_missing_link_count: number;
    local_fulfillment_recorded: boolean;
    external_delivery_configured: false;
  };
  would_not_do: string[];
  non_goals: string[];
  authority_boundary: WorkbenchSpineConsolidationAuthorityBoundary;
}
