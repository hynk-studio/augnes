/**
 * Agent Workplane Continuity Spine Summary v0.1.
 *
 * Compact read-only summary of already-supplied Workbench continuity material.
 * This contract is deliberately not a new authority rail: it cannot write,
 * execute delivery, call providers, mutate Perspective/CWP/handoff/work state,
 * record proof/evidence, create routes/schema, or render action controls.
 */

import type { AppliedCurrentWorkingPerspectiveRead } from "@/lib/perspective/read-applied-current-working-perspective-for-web";
import type { AppliedHandoffContextRead } from "@/lib/workplane/read-applied-handoff-context-for-web";
import type { ExportedHandoffPacketArtifactRead } from "@/lib/workplane/read-exported-handoff-packet-artifact-for-web";
import type { SentHandoffReadForWeb } from "@/lib/workplane/read-sent-handoff-for-web";
import type { WorkplaneContextRead } from "@/lib/workplane/read-workplane-context";
import type { CurrentWorkingPerspectiveRouteIntegrationRead } from "./current-working-perspective-route-integration-read";
import type { DeliverySpineLoopClosureReadModel } from "./delivery-spine-loop-closure";
import type { ExternalHandoffDeliveryContractRecordReview } from "./external-handoff-delivery-contract";
import type { HandoffSendContractRecordReview } from "./handoff-send-contract-record-review";
import type { HandoffSendRecordReview } from "./handoff-send-record-review";
import type { ProviderSpecificDeliveryExecutionContractRecordReview } from "./provider-specific-delivery-execution-contract-record-review";
import type { ProviderSpecificDeliveryIntentContractRecordReview } from "./provider-specific-delivery-intent-contract";
import type { ResidualDiagnosticCandidateReadModel } from "./residual-diagnostic-candidate";
import type { WorkbenchDogfoodLoopSpineOverview } from "./workbench-dogfood-loop-spine-overview";
import type { WorkbenchSpineConsolidation } from "./workbench-spine-consolidation";

export const WORKPLANE_CONTINUITY_SPINE_SUMMARY_VERSION =
  "workplane_continuity_spine_summary.v0.1" as const;
export const WORKPLANE_CONTINUITY_SPINE_SUMMARY_SCOPE =
  "project:augnes" as const;

export type WorkplaneContinuitySpineStatus =
  | "ready_for_operator_review"
  | "blocked"
  | "insufficient_data"
  | "stale_source_attention"
  | "no_active_spine";

export type WorkplaneContinuitySpineStage =
  | "current_working_perspective"
  | "cwp_route_integration"
  | "handoff_context_apply"
  | "handoff_packet_export"
  | "local_handoff_fulfillment"
  | "external_delivery_contract"
  | "provider_specific_intent"
  | "delivery_spine_loop_closure"
  | "provider_specific_execution_contract_record_review"
  | "residual_diagnostic"
  | "dogfood_loop_spine";

export type WorkplaneContinuitySourceFreshnessStatus =
  | "fresh"
  | "stale"
  | "mixed"
  | "missing"
  | "fallback_only";

export type WorkplaneContinuityRollbackSupersedeStatus =
  | "active_only"
  | "has_rolled_back_context"
  | "has_superseded_context"
  | "mixed_history"
  | "unknown";

export type WorkplaneContinuityNextAllowedAction =
  | "review_continuity_spine_summary"
  | "inspect_latest_active_stage"
  | "open_related_workbench_detail_panel"
  | "read_source_coverage_before_handoff"
  | "prepare_manual_handoff_context";

export type WorkplaneContinuityBlockedAction =
  | "block_provider_send"
  | "block_provider_network_call"
  | "block_delivery_execution"
  | "block_db_write"
  | "block_proof_or_evidence_write"
  | "block_perspective_cwp_handoff_work_mutation"
  | "block_codex_or_github_automation"
  | "block_clipboard_download_file_write"
  | "block_route_schema_migration"
  | "block_retrieval_rag_crawler_provider_call"
  | "block_workbench_action_button";

export interface WorkplaneContinuitySpineSummaryInput {
  workplane_context?: WorkplaneContextRead | unknown;
  current_working_perspective_read?:
    | WorkplaneContextRead["current_perspective_read"]
    | unknown;
  workplane_continuity_relay?:
    | WorkplaneContextRead["continuity_relay"]
    | unknown;
  workbench_spine_consolidation?: WorkbenchSpineConsolidation | unknown;
  workbench_dogfood_loop_spine_overview?:
    | WorkbenchDogfoodLoopSpineOverview
    | unknown;
  residual_diagnostic_candidate_read_model?:
    | ResidualDiagnosticCandidateReadModel
    | unknown;
  applied_current_working_perspective_read?:
    | AppliedCurrentWorkingPerspectiveRead
    | unknown;
  current_working_perspective_route_integration_read?:
    | CurrentWorkingPerspectiveRouteIntegrationRead
    | unknown;
  applied_handoff_context_read?: AppliedHandoffContextRead | unknown;
  exported_handoff_packet_artifact_read?:
    | ExportedHandoffPacketArtifactRead
    | unknown;
  handoff_send_record_review?: HandoffSendRecordReview | unknown;
  handoff_send_contract_record_review?:
    | HandoffSendContractRecordReview
    | unknown;
  sent_handoff_read?: SentHandoffReadForWeb | unknown;
  external_handoff_delivery_contract_record_review?:
    | ExternalHandoffDeliveryContractRecordReview
    | unknown;
  provider_specific_delivery_intent_contract_record_review?:
    | ProviderSpecificDeliveryIntentContractRecordReview
    | unknown;
  delivery_spine_loop_closure_read_model?:
    | DeliverySpineLoopClosureReadModel
    | unknown;
  provider_specific_delivery_execution_contract_record_review?:
    | ProviderSpecificDeliveryExecutionContractRecordReview
    | unknown;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export interface WorkplaneContinuitySourceCoverageSummary {
  primary_source_count: number;
  selected_record_count: number;
  missing_source_count: number;
  stale_source_count: number;
  fallback_source_count: number;
  blocker_count: number;
  warning_count: number;
}

export interface WorkplaneContinuitySpineAuthorityBoundary {
  read_only: true;
  advisory_only: true;
  derived_read_model: true;
  compact_summary_only: true;
  source_of_truth: false;
  can_write_db: false;
  can_create_schema: false;
  can_create_migration: false;
  can_create_route: false;
  can_call_route: false;
  can_send_handoff: false;
  can_execute_delivery: false;
  can_call_provider: false;
  can_call_send_provider: false;
  can_call_network: false;
  can_call_email: false;
  can_call_slack: false;
  can_call_webhook: false;
  can_call_provider_openai: false;
  can_call_github: false;
  can_execute_codex: false;
  can_call_browser: false;
  can_call_crawler: false;
  can_write_clipboard: false;
  can_download_file: false;
  can_write_file: false;
  can_write_memory: false;
  can_mutate_memory: false;
  can_promote_memory: false;
  can_write_proof: false;
  can_write_evidence: false;
  can_mutate_perspective_memory: false;
  can_mutate_current_working_perspective: false;
  can_mutate_cwp: false;
  can_mutate_handoff: false;
  can_mutate_work_state: false;
  can_write_selected_refs_to_live_handoff: false;
  can_write_dogfood_metrics: false;
  can_create_graph_or_vector_store: false;
  can_create_rag_stack: false;
  can_render_workbench_action_button: false;
  can_create_pr: false;
  can_merge_pr: false;
  notes: string[];
}

export interface WorkplaneContinuitySpineSummary {
  summary_version: typeof WORKPLANE_CONTINUITY_SPINE_SUMMARY_VERSION;
  summary_fingerprint: string;
  scope: typeof WORKPLANE_CONTINUITY_SPINE_SUMMARY_SCOPE;
  as_of: string;
  spine_status: WorkplaneContinuitySpineStatus;
  latest_active_stage: WorkplaneContinuitySpineStage | null;
  latest_active_receipt_or_record_ref: string | null;
  latest_active_fingerprint: string | null;
  source_freshness_status: WorkplaneContinuitySourceFreshnessStatus;
  rollback_supersede_status: WorkplaneContinuityRollbackSupersedeStatus;
  primary_source_refs: string[];
  selected_record_refs: string[];
  missing_source_refs: string[];
  stale_source_refs: string[];
  blocker_reasons: string[];
  warning_reasons: string[];
  next_allowed_actions: WorkplaneContinuityNextAllowedAction[];
  blocked_actions: WorkplaneContinuityBlockedAction[];
  codex_handoff_hints: string[];
  source_coverage_summary: WorkplaneContinuitySourceCoverageSummary;
  authority_boundary: WorkplaneContinuitySpineAuthorityBoundary;
  would_not_do: string[];
}
