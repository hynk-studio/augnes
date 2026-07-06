import type {
  ExternalHandoffDeliveryContractPreview,
  ExternalHandoffDeliveryContractRecordReview,
  ExternalHandoffDeliveryOperatorDecisionPreview,
  ExternalHandoffDeliveryResidualGateSummary,
} from "./external-handoff-delivery-contract";
import type {
  ProviderSpecificExternalDeliveryOperatorDecisionPreview,
  ProviderSpecificExternalDeliveryPreviewContract,
} from "./provider-specific-external-delivery-preview-contract";
import type {
  ProviderSpecificDeliveryIntentContractPreview,
  ProviderSpecificDeliveryIntentContractRecordReview,
  ProviderSpecificDeliveryIntentOperatorDecisionPreview,
} from "./provider-specific-delivery-intent-contract";
import type { AppliedHandoffContextRead } from "@/lib/workplane/read-applied-handoff-context-for-web";
import type { ExportedHandoffPacketArtifactRead } from "@/lib/workplane/read-exported-handoff-packet-artifact-for-web";
import type { SentHandoffReadForWeb } from "@/lib/workplane/read-sent-handoff-for-web";
import type { HandoffSendContractRecordReview } from "./handoff-send-contract-record-review";
import type { HandoffSendRecordReview } from "./handoff-send-record-review";
import type { ResidualDiagnosticCandidateReadModel } from "./residual-diagnostic-candidate";
import type { WorkbenchDogfoodLoopSpineOverview } from "./workbench-dogfood-loop-spine-overview";
import type { WorkbenchSpineConsolidation } from "./workbench-spine-consolidation";

export const DELIVERY_SPINE_LOOP_CLOSURE_READ_MODEL_VERSION =
  "delivery_spine_loop_closure_read_model.v0.1" as const;
export const DELIVERY_SPINE_LOOP_CLOSURE_SCOPE = "project:augnes" as const;

export type DeliverySpineStatus =
  | "no_delivery_spine_material"
  | "local_fulfillment_available"
  | "external_contract_ready"
  | "provider_specific_preview_ready"
  | "provider_specific_intent_recorded"
  | "execution_preview_not_started"
  | "blocked"
  | "insufficient_data"
  | "invalid_source_material";

export type DeliverySpineStageStatus =
  | "missing"
  | "available"
  | "ready"
  | "recorded"
  | "blocked"
  | "invalid"
  | "warning_only"
  | "not_started"
  | "not_applicable"
  | "insufficient_data";

export type DeliverySpineStageGroupId =
  | "local_handoff_fulfillment"
  | "external_handoff_delivery_contract"
  | "provider_specific_preview"
  | "provider_specific_intent"
  | "future_execution_boundary";

export type DeliverySpineStageId =
  | "local_handoff_send_fulfillment"
  | "handoff_send_contract_review"
  | "exported_handoff_packet_artifact"
  | "external_delivery_contract_preview"
  | "external_delivery_operator_decision_preview"
  | "external_delivery_contract_record_review"
  | "provider_specific_external_delivery_preview"
  | "provider_specific_external_delivery_operator_decision"
  | "provider_specific_delivery_intent_preview"
  | "provider_specific_delivery_intent_operator_decision"
  | "provider_specific_delivery_intent_record_review"
  | "future_provider_execution_contract_preview";

export type DeliverySpineRecommendedOperatorAction =
  | "resolve_delivery_spine_blockers_before_execution_preview"
  | "review_provider_specific_intent_contract_record"
  | "keep_execution_not_started_until_contract_preview_exists"
  | "prepare_provider_specific_delivery_execution_contract_preview"
  | "consolidate_delivery_spine_panels_before_execution"
  | "wait_for_valid_external_delivery_contract_record"
  | "wait_for_provider_specific_preview_ready"
  | "wait_for_provider_specific_intent_record";

export type DeliverySpineRecommendedHardeningTarget =
  | "delivery_spine_lineage_mismatch"
  | "provider_specific_decision_readiness"
  | "provider_specific_intent_record_review"
  | "execution_boundary_preflight"
  | "workbench_delivery_spine_ia"
  | "loop_closure_outcome_observation"
  | "residual_delivery_gate_coverage";

export interface DeliverySpineLoopClosureInput {
  workbench_spine_consolidation?: WorkbenchSpineConsolidation | unknown;
  residual_diagnostic_candidate_read_model?:
    | ResidualDiagnosticCandidateReadModel
    | unknown;
  external_handoff_delivery_contract_preview?:
    | ExternalHandoffDeliveryContractPreview
    | unknown;
  external_handoff_delivery_operator_decision_preview?:
    | ExternalHandoffDeliveryOperatorDecisionPreview
    | unknown;
  external_handoff_delivery_contract_record_review?:
    | ExternalHandoffDeliveryContractRecordReview
    | unknown;
  provider_specific_external_delivery_preview_contract?:
    | ProviderSpecificExternalDeliveryPreviewContract
    | unknown;
  provider_specific_external_delivery_operator_decision_preview?:
    | ProviderSpecificExternalDeliveryOperatorDecisionPreview
    | unknown;
  provider_specific_delivery_intent_contract_preview?:
    | ProviderSpecificDeliveryIntentContractPreview
    | unknown;
  provider_specific_delivery_intent_operator_decision_preview?:
    | ProviderSpecificDeliveryIntentOperatorDecisionPreview
    | unknown;
  provider_specific_delivery_intent_contract_record_review?:
    | ProviderSpecificDeliveryIntentContractRecordReview
    | unknown;
  sent_handoff_read?: SentHandoffReadForWeb | unknown;
  handoff_send_record_review?: HandoffSendRecordReview | unknown;
  handoff_send_contract_record_review?: HandoffSendContractRecordReview | unknown;
  exported_handoff_packet_artifact_read?:
    | ExportedHandoffPacketArtifactRead
    | unknown;
  applied_handoff_context_read?: AppliedHandoffContextRead | unknown;
  workbench_dogfood_loop_spine_overview?:
    | WorkbenchDogfoodLoopSpineOverview
    | unknown;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
  evidence_refs?: string[];
}

export interface DeliverySpineStageSummary {
  stage_id: DeliverySpineStageId;
  label: string;
  status: DeliverySpineStageStatus;
  primary_ref: string | null;
  source_refs: string[];
  evidence_refs: string[];
  blockers: string[];
  warnings: string[];
  boundary_flags: Record<string, boolean>;
  material_count: number;
  next_expected_artifact: string | null;
}

export interface DeliverySpineStageGroup {
  group_id: DeliverySpineStageGroupId;
  label: string;
  status: DeliverySpineStageStatus;
  material_count: number;
  stages: DeliverySpineStageSummary[];
}

export interface DeliverySpineStageSummaryAggregate {
  total_stage_count: number;
  ready_stage_count: number;
  recorded_stage_count: number;
  blocked_stage_count: number;
  invalid_stage_count: number;
  missing_stage_count: number;
  warning_stage_count: number;
  future_execution_stage_status: DeliverySpineStageStatus;
}

export interface DeliverySpineLineageNode {
  node_id: string;
  stage_id: DeliverySpineStageId;
  label: string;
  ref: string | null;
  status: DeliverySpineStageStatus;
}

export interface DeliverySpineLineageEdge {
  from: DeliverySpineStageId;
  to: DeliverySpineStageId;
  expected_ref: string | null;
  observed_ref: string | null;
  status: "match" | "missing" | "mismatch" | "downstream_without_upstream";
  blocker: boolean;
  reason: string | null;
}

export interface DeliverySpineLineageMap {
  map_version: "delivery_spine_lineage_map.v0.1";
  nodes: DeliverySpineLineageNode[];
  edges: DeliverySpineLineageEdge[];
  missing_links: string[];
  mismatch_links: string[];
}

export interface DeliverySpineReasonSummary {
  count: number;
  blockers: string[];
}

export interface DeliverySpineWarningSummary {
  count: number;
  warnings: string[];
}

export interface DeliverySpineLoopClosureSummary {
  loop_closure_status:
    | "insufficient_data"
    | "observed_contract_spine_ready"
    | "blockers_visible"
    | "review_burden_risk"
    | "execution_boundary_preserved";
  review_burden_risk_level: "low" | "medium" | "high";
  panel_count_considered: number;
  consolidated_stage_count: number;
  repeated_blocker_count: number;
  hard_blocker_count: number;
  warning_count: number;
  execution_boundary_preserved: boolean;
  provider_network_boundary_preserved: boolean;
  outcome_claim_status:
    | "insufficient_data"
    | "no_outcome_claim"
    | "local_operator_clarity_only";
  loop_closure_notes: string[];
}

export interface DeliverySpineReviewBurdenSummary {
  panel_count_considered: number;
  delivery_material_count: number;
  consolidated_stage_count: number;
  review_burden_risk_level: "low" | "medium" | "high";
  evidence_for_outcome_improvement_present: boolean;
  outcome_claim_status:
    | "insufficient_data"
    | "no_outcome_claim"
    | "local_operator_clarity_only";
}

export interface DeliverySpineNonDeliveryBoundary {
  delivery_performed: false;
  provider_specific_delivery: false;
  provider_delivery_intent_is_delivery: false;
  provider_called: false;
  external_message_sent: false;
  email_sent: false;
  slack_sent: false;
  webhook_called: false;
  network_called: false;
  clipboard_written: false;
  file_downloaded: false;
  local_fulfillment_is_external_delivery: false;
  external_contract_is_delivery: false;
  provider_specific_preview_is_delivery: false;
  provider_specific_intent_is_delivery: false;
  execution_contract_preview_exists: false;
}

export interface DeliverySpineAuthorityBoundary {
  read_only: true;
  advisory_only: true;
  consolidation_only: true;
  can_write_db: false;
  can_create_schema: false;
  can_send_handoff: false;
  can_call_send_provider: false;
  can_call_email: false;
  can_call_slack: false;
  can_call_webhook: false;
  can_call_network: false;
  can_write_clipboard: false;
  can_download_file: false;
  can_write_memory: false;
  can_mutate_cwp: false;
  can_mutate_handoff: false;
  can_mutate_residual: false;
  can_mutate_external_contract: false;
  can_mutate_provider_intent: false;
  can_render_workbench_action_button: false;
}

export interface DeliverySpineLoopClosureReadModel {
  read_model_version: typeof DELIVERY_SPINE_LOOP_CLOSURE_READ_MODEL_VERSION;
  scope: typeof DELIVERY_SPINE_LOOP_CLOSURE_SCOPE;
  as_of: string;
  delivery_spine_status: DeliverySpineStatus;
  source_refs: string[];
  evidence_refs: string[];
  stage_summary: DeliverySpineStageSummaryAggregate;
  stage_groups: DeliverySpineStageGroup[];
  lineage_map: DeliverySpineLineageMap;
  blocker_summary: DeliverySpineReasonSummary;
  warning_summary: DeliverySpineWarningSummary;
  loop_closure_summary: DeliverySpineLoopClosureSummary;
  review_burden_summary: DeliverySpineReviewBurdenSummary;
  residual_gate_summary: ExternalHandoffDeliveryResidualGateSummary;
  recommended_next_operator_action: DeliverySpineRecommendedOperatorAction;
  recommended_next_hardening_target: DeliverySpineRecommendedHardeningTarget;
  explicit_non_delivery_boundary: DeliverySpineNonDeliveryBoundary;
  authority_boundary: DeliverySpineAuthorityBoundary;
  would_not_do: string[];
  non_goals: string[];
}
