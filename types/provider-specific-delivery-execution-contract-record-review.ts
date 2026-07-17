import type { ExternalHandoffDeliveryResidualGateSummary } from "./external-handoff-delivery-contract";
import type {
  ProviderSpecificDeliveryExecutionAuthorityBoundary,
  ProviderSpecificDeliveryExecutionContractPreview,
  ProviderSpecificDeliveryExecutionNonDeliveryBoundary,
  ProviderSpecificDeliveryExecutionOperatorDecisionPreview,
  ProviderSpecificDeliveryExecutionSurface,
  ProviderSpecificDeliveryLineageGateSummary,
  ProviderSpecificDeliveryOperatorGateSummary,
  ProviderSpecificDeliveryProviderConfigGateSummary,
} from "./provider-specific-delivery-execution-contract-preview";
import type { ProviderSpecificExternalDeliverySurface } from "./provider-specific-external-delivery-preview-contract";
import type { DeliverySpineLoopClosureReadModel } from "./delivery-spine-loop-closure";
import type { ProviderSpecificDeliveryIntentContractRecordReview } from "./provider-specific-delivery-intent-contract";
import type { ExternalHandoffDeliveryContractRecordReview } from "./external-handoff-delivery-contract";
import type { HandoffSendContractRecordReview } from "./handoff-send-contract-record-review";
import type { HandoffSendRecordReview } from "./handoff-send-record-review";
import type { ExportedHandoffPacketArtifactRead } from "@/types/exported-handoff-packet-artifact-read";
import type { AppliedHandoffContextRead } from "@/lib/workplane/read-applied-handoff-context-for-web";
import type { SentHandoffReadForWeb } from "@/lib/workplane/read-sent-handoff-for-web";

export const PROVIDER_SPECIFIC_DELIVERY_EXECUTION_CONTRACT_RECORD_VERSION =
  "provider_specific_delivery_execution_contract_record.v0.1" as const;
export const PROVIDER_SPECIFIC_DELIVERY_EXECUTION_CONTRACT_RECORD_REVIEW_VERSION =
  "provider_specific_delivery_execution_contract_record_review.v0.1" as const;
export const PROVIDER_SPECIFIC_DELIVERY_EXECUTION_CONTRACT_RECORD_REVIEW_SCOPE =
  "project:augnes" as const;

export type ProviderSpecificDeliveryExecutionContractRecordReviewStatus =
  | "recordable"
  | "blocked"
  | "insufficient_data"
  | "execution_preview_missing"
  | "execution_preview_not_ready"
  | "operator_decision_preview_missing"
  | "operator_decision_not_ready"
  | "operator_decision_lineage_mismatch"
  | "source_fingerprint_missing"
  | "source_ref_missing"
  | "residual_gate_blocked"
  | "lineage_gate_blocked"
  | "provider_config_gate_blocked"
  | "operator_gate_blocked"
  | "non_delivery_boundary_blocked"
  | "authority_boundary_blocked";

export interface ProviderSpecificDeliveryExecutionContractRecordReviewInput {
  provider_specific_delivery_execution_contract_preview?:
    | ProviderSpecificDeliveryExecutionContractPreview
    | unknown;
  provider_specific_delivery_execution_operator_decision_preview?:
    | ProviderSpecificDeliveryExecutionOperatorDecisionPreview
    | unknown;
  delivery_spine_loop_closure_read_model?:
    | DeliverySpineLoopClosureReadModel
    | unknown;
  provider_specific_delivery_intent_contract_record_review?:
    | ProviderSpecificDeliveryIntentContractRecordReview
    | unknown;
  external_handoff_delivery_contract_record_review?:
    | ExternalHandoffDeliveryContractRecordReview
    | unknown;
  handoff_send_contract_record_review?: HandoffSendContractRecordReview | unknown;
  handoff_send_record_review?: HandoffSendRecordReview | unknown;
  exported_handoff_packet_artifact_read?:
    | ExportedHandoffPacketArtifactRead
    | unknown;
  applied_handoff_context_read?: AppliedHandoffContextRead | unknown;
  sent_handoff_read?: SentHandoffReadForWeb | unknown;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
  evidence_refs?: string[];
}

export interface ProviderSpecificDeliveryExecutionContractRecordReadinessSummary {
  execution_preview_present: boolean;
  execution_preview_ready: boolean;
  operator_decision_preview_present: boolean;
  operator_decision_ready: boolean;
  operator_decision_matches_execution_preview: boolean;
  source_execution_contract_preview_fingerprint_present: boolean;
  source_operator_decision_preview_fingerprint_present: boolean;
  source_delivery_spine_fingerprint_present: boolean;
  source_provider_specific_intent_contract_record_ref_present: boolean;
  source_external_handoff_delivery_contract_record_ref_present: boolean;
  source_exported_handoff_artifact_ref_present: boolean;
  source_local_fulfillment_ref_present: boolean;
  residual_gate_passed: boolean;
  lineage_gate_passed: boolean;
  provider_config_gate_passed: boolean;
  non_delivery_boundary_passed: boolean;
  authority_boundary_passed: boolean;
  recordable: boolean;
}

export interface ProviderSpecificDeliveryExecutionContractRecordRequirementSummary {
  required_refs: string[];
  missing_refs: string[];
  satisfied_requirements: string[];
}

export interface ProviderSpecificDeliveryExecutionContractRecordOperatorGateSummary
  extends ProviderSpecificDeliveryOperatorGateSummary {
  operator_decision_preview_present: boolean;
  operator_decision_preview_status: string | null;
  operator_decision_matches_execution_preview: boolean;
  operator_decision_ready_for_record_review: boolean;
}

export interface ProviderSpecificDeliveryExecutionContractRecordReviewAuthorityBoundary
  extends Omit<
    ProviderSpecificDeliveryExecutionAuthorityBoundary,
    "execution_preview_only"
  > {
  read_only_record_review: true;
  record_review_only: true;
  source_of_truth: false;
  can_call_provider_openai: false;
  can_call_github: false;
  can_execute_codex: false;
  can_call_browser_or_crawler: false;
  can_create_pr: false;
  can_merge_pr: false;
  can_mutate_work_state: false;
}

export interface ProviderSpecificDeliveryExecutionContractRecordCandidate {
  record_version:
    typeof PROVIDER_SPECIFIC_DELIVERY_EXECUTION_CONTRACT_RECORD_VERSION;
  scope: typeof PROVIDER_SPECIFIC_DELIVERY_EXECUTION_CONTRACT_RECORD_REVIEW_SCOPE;
  as_of: string;
  record_status:
    "provider_specific_delivery_execution_contract_candidate_recordable";
  source_execution_contract_preview_fingerprint: string;
  source_operator_decision_preview_fingerprint: string;
  source_delivery_spine_fingerprint: string;
  source_provider_specific_intent_contract_record_ref: string;
  source_external_handoff_delivery_contract_record_ref: string;
  source_exported_handoff_artifact_ref: string;
  source_local_fulfillment_ref: string;
  source_handoff_send_contract_record_ref: string | null;
  requested_provider_surface: ProviderSpecificExternalDeliverySurface | null;
  requested_execution_surface: ProviderSpecificDeliveryExecutionSurface;
  provider_profile_ref: string | null;
  execution_profile_ref: string | null;
  recipient_ref: string;
  payload_hash: string;
  payload_type: string | null;
  payload_format: string;
  residual_gate_summary: ExternalHandoffDeliveryResidualGateSummary;
  lineage_gate_summary: ProviderSpecificDeliveryLineageGateSummary;
  provider_config_gate_summary:
    ProviderSpecificDeliveryProviderConfigGateSummary;
  operator_gate_summary:
    ProviderSpecificDeliveryExecutionContractRecordOperatorGateSummary;
  source_refs: string[];
  evidence_refs: string[];
  explicit_non_delivery_boundary:
    ProviderSpecificDeliveryExecutionNonDeliveryBoundary;
  authority_boundary:
    ProviderSpecificDeliveryExecutionContractRecordReviewAuthorityBoundary;
  no_delivery_performed: true;
  no_execution_performed: true;
  no_provider_call_performed: true;
  no_external_message_sent: true;
  record_fingerprint: string;
}

export interface ProviderSpecificDeliveryExecutionContractRecordReview {
  review_version:
    typeof PROVIDER_SPECIFIC_DELIVERY_EXECUTION_CONTRACT_RECORD_REVIEW_VERSION;
  review_fingerprint: string;
  scope: typeof PROVIDER_SPECIFIC_DELIVERY_EXECUTION_CONTRACT_RECORD_REVIEW_SCOPE;
  as_of: string;
  review_status: ProviderSpecificDeliveryExecutionContractRecordReviewStatus;
  source_execution_contract_preview_fingerprint: string | null;
  source_operator_decision_preview_fingerprint: string | null;
  source_delivery_spine_fingerprint: string | null;
  source_provider_specific_intent_contract_record_ref: string | null;
  source_external_handoff_delivery_contract_record_ref: string | null;
  source_exported_handoff_artifact_ref: string | null;
  source_local_fulfillment_ref: string | null;
  source_handoff_send_contract_record_ref: string | null;
  requested_provider_surface: ProviderSpecificExternalDeliverySurface | null;
  requested_execution_surface: ProviderSpecificDeliveryExecutionSurface | null;
  provider_profile_ref: string | null;
  execution_profile_ref: string | null;
  recipient_ref: string | null;
  payload_hash: string | null;
  payload_type: string | null;
  payload_format: string | null;
  residual_gate_summary: ExternalHandoffDeliveryResidualGateSummary;
  lineage_gate_summary: ProviderSpecificDeliveryLineageGateSummary;
  provider_config_gate_summary:
    ProviderSpecificDeliveryProviderConfigGateSummary;
  operator_gate_summary:
    ProviderSpecificDeliveryExecutionContractRecordOperatorGateSummary;
  readiness_summary:
    ProviderSpecificDeliveryExecutionContractRecordReadinessSummary;
  requirement_summary:
    ProviderSpecificDeliveryExecutionContractRecordRequirementSummary;
  blocker_reasons: string[];
  warning_reasons: string[];
  insufficient_data_reasons: string[];
  source_refs: string[];
  evidence_refs: string[];
  would_record_provider_specific_delivery_execution_contract_record:
    | ProviderSpecificDeliveryExecutionContractRecordCandidate
    | null;
  explicit_non_delivery_boundary:
    ProviderSpecificDeliveryExecutionNonDeliveryBoundary;
  authority_boundary:
    ProviderSpecificDeliveryExecutionContractRecordReviewAuthorityBoundary;
  would_not_do: string[];
  non_goals: string[];
}
