import type { ExternalHandoffDeliveryResidualGateSummary } from "./external-handoff-delivery-contract";
import type {
  ProviderSpecificExternalDeliveryOperatorDecisionPreview,
  ProviderSpecificExternalDeliveryPreviewContract,
  ProviderSpecificExternalDeliverySurface,
} from "./provider-specific-external-delivery-preview-contract";
import type {
  ProviderSpecificDeliveryIntentContractPreview,
  ProviderSpecificDeliveryIntentContractRecordReview,
  ProviderSpecificDeliveryIntentOperatorDecisionPreview,
} from "./provider-specific-delivery-intent-contract";
import type { DeliverySpineLoopClosureReadModel } from "./delivery-spine-loop-closure";
import type { AppliedHandoffContextRead } from "@/lib/workplane/read-applied-handoff-context-for-web";
import type { ExportedHandoffPacketArtifactRead } from "@/types/exported-handoff-packet-artifact-read";
import type { SentHandoffReadForWeb } from "@/lib/workplane/read-sent-handoff-for-web";
import type { HandoffSendContractRecordReview } from "./handoff-send-contract-record-review";
import type { HandoffSendRecordReview } from "./handoff-send-record-review";
import type { ResidualDiagnosticCandidateReadModel } from "./residual-diagnostic-candidate";
import type { ExternalHandoffDeliveryContractPreview } from "./external-handoff-delivery-contract";
import type { ExternalHandoffDeliveryContractRecordReview } from "./external-handoff-delivery-contract";
import type { WorkbenchSpineConsolidation } from "./workbench-spine-consolidation";

export const PROVIDER_SPECIFIC_DELIVERY_EXECUTION_CONTRACT_PREVIEW_VERSION =
  "provider_specific_delivery_execution_contract_preview.v0.1" as const;
export const PROVIDER_SPECIFIC_DELIVERY_EXECUTION_OPERATOR_DECISION_PREVIEW_VERSION =
  "provider_specific_delivery_execution_operator_decision_preview.v0.1" as const;
export const PROVIDER_SPECIFIC_DELIVERY_EXECUTION_SCOPE =
  "project:augnes" as const;

export type ProviderSpecificDeliveryExecutionSurface =
  | "manual_operator_delivery_execution_preview"
  | "email_delivery_execution_preview"
  | "slack_delivery_execution_preview"
  | "webhook_delivery_execution_preview";

export type ProviderSpecificDeliveryExecutionPreviewStatus =
  | "ready_for_execution_contract_decision"
  | "blocked"
  | "insufficient_data"
  | "delivery_spine_missing"
  | "delivery_spine_not_ready"
  | "provider_specific_intent_missing"
  | "provider_specific_intent_invalid"
  | "execution_surface_missing"
  | "execution_surface_unsupported"
  | "provider_config_missing"
  | "provider_config_ref_unsafe"
  | "recipient_ref_unsafe"
  | "payload_ref_unsafe"
  | "residual_gate_blocked"
  | "lineage_gate_blocked"
  | "authority_boundary_blocked"
  | "execution_boundary_blocked";

export type ProviderSpecificDeliveryExecutionDecisionStatus =
  | "ready_for_execution_contract_design_review"
  | "blocked"
  | "insufficient_data"
  | "execution_preview_missing"
  | "execution_preview_not_ready"
  | "operator_evidence_missing"
  | "review_confirmation_missing";

export type ProviderSpecificDeliveryExecutionRecommendedDecision =
  | "keep_execution_preview_only"
  | "prepare_future_execution_contract_record_slice"
  | "wait_for_provider_specific_intent_record"
  | "resolve_delivery_spine_blockers_first"
  | "resolve_provider_config_refs_first"
  | "do_not_prepare_execution";

export interface ProviderSpecificDeliveryExecutionContractPreviewInput {
  delivery_spine_loop_closure_read_model?:
    | DeliverySpineLoopClosureReadModel
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
  provider_specific_external_delivery_preview_contract?:
    | ProviderSpecificExternalDeliveryPreviewContract
    | unknown;
  provider_specific_external_delivery_operator_decision_preview?:
    | ProviderSpecificExternalDeliveryOperatorDecisionPreview
    | unknown;
  external_handoff_delivery_contract_preview?:
    | ExternalHandoffDeliveryContractPreview
    | unknown;
  external_handoff_delivery_contract_record_review?:
    | ExternalHandoffDeliveryContractRecordReview
    | unknown;
  residual_diagnostic_candidate_read_model?:
    | ResidualDiagnosticCandidateReadModel
    | unknown;
  workbench_spine_consolidation?: WorkbenchSpineConsolidation | unknown;
  sent_handoff_read?: SentHandoffReadForWeb | unknown;
  handoff_send_record_review?: HandoffSendRecordReview | unknown;
  handoff_send_contract_record_review?: HandoffSendContractRecordReview | unknown;
  exported_handoff_packet_artifact_read?:
    | ExportedHandoffPacketArtifactRead
    | unknown;
  applied_handoff_context_read?: AppliedHandoffContextRead | unknown;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
  evidence_refs?: string[];
  requested_execution_surface?: ProviderSpecificDeliveryExecutionSurface | string;
  requested_execution_profile_ref?: string;
}

export interface ProviderSpecificDeliveryExecutionNonDeliveryBoundary {
  delivery_performed: false;
  execution_performed: false;
  provider_specific_delivery: false;
  provider_delivery_intent_is_delivery: false;
  provider_execution_preview_is_delivery: false;
  provider_execution_contract_is_delivery: false;
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
}

export interface ProviderSpecificDeliveryExecutionAuthorityBoundary {
  read_only: true;
  advisory_only: true;
  execution_preview_only: true;
  can_write_db: false;
  can_create_schema: false;
  can_create_route: false;
  can_send_handoff: false;
  can_execute_delivery: false;
  can_call_send_provider: false;
  can_call_email: false;
  can_call_slack: false;
  can_call_webhook: false;
  can_call_network: false;
  can_write_clipboard: false;
  can_download_file: false;
  can_write_arbitrary_file: false;
  can_write_memory: false;
  can_mutate_cwp: false;
  can_mutate_handoff: false;
  can_mutate_residual: false;
  can_mutate_external_contract: false;
  can_mutate_provider_intent: false;
  can_mutate_delivery_spine_loop_closure: false;
  can_render_workbench_action_button: false;
}

export interface ProviderSpecificDeliveryExecutionPreflightSummary {
  delivery_spine_present: boolean;
  delivery_spine_provider_intent_recorded: boolean;
  future_execution_not_started: boolean;
  provider_specific_intent_record_available: boolean;
  execution_surface_supported: boolean;
  execution_profile_ref_safe: boolean;
  execution_profile_family_matched: boolean;
  provider_profile_family_matched: boolean;
  recipient_ref_family_matched: boolean;
  payload_hash_present: boolean;
  payload_format_safe: boolean;
  residual_gate_passed: boolean;
  lineage_gate_passed: boolean;
  provider_config_gate_passed: boolean;
  operator_gate_required_for_future_slice: true;
}

export interface ProviderSpecificDeliveryExecutionRequirementSummary {
  required_refs: string[];
  missing_refs: string[];
  satisfied_requirements: string[];
  future_execution_requirements: string[];
}

export interface ProviderSpecificDeliveryProviderConfigGateSummary {
  execution_profile_ref: string | null;
  config_ref_present: boolean;
  config_ref_status:
    | "not_required_for_manual_operator_delivery"
    | "safe_ref_only"
    | "missing"
    | "unsafe"
    | "surface_mismatch";
  config_runtime_verified: false;
  provider_call_tested: false;
  future_runtime_provider_gate_required: true;
  problem_reasons: string[];
}

export interface ProviderSpecificDeliveryLineageGateSummary {
  gate_status: "passed" | "blocked" | "insufficient_data";
  lineage_refs: {
    source_provider_specific_preview_fingerprint: string | null;
    intent_record_source_provider_specific_preview_fingerprint: string | null;
    source_external_handoff_delivery_contract_record_ref: string | null;
    intent_record_source_external_handoff_delivery_contract_record_ref:
      | string
      | null;
    source_local_fulfillment_ref: string | null;
    intent_record_source_local_fulfillment_ref: string | null;
    source_exported_artifact_ref: string | null;
    intent_record_source_exported_artifact_ref: string | null;
  };
  problem_reasons: string[];
}

export interface ProviderSpecificDeliveryOperatorGateSummary {
  operator_review_required: true;
  execution_contract_record_slice_required: true;
  execution_authorization_present: false;
  provider_call_authorized: false;
}

export interface ProviderSpecificDeliveryExecutionContractPreview {
  preview_version:
    typeof PROVIDER_SPECIFIC_DELIVERY_EXECUTION_CONTRACT_PREVIEW_VERSION;
  preview_fingerprint: string;
  scope: typeof PROVIDER_SPECIFIC_DELIVERY_EXECUTION_SCOPE;
  as_of: string;
  status: ProviderSpecificDeliveryExecutionPreviewStatus;
  source_refs: string[];
  evidence_refs: string[];
  source_delivery_spine_fingerprint: string | null;
  source_provider_specific_intent_contract_record_ref: string | null;
  source_provider_specific_intent_preview_fingerprint: string | null;
  source_provider_specific_intent_decision_fingerprint: string | null;
  source_provider_specific_preview_fingerprint: string | null;
  source_external_handoff_delivery_contract_record_ref: string | null;
  source_local_fulfillment_ref: string | null;
  source_handoff_send_contract_record_ref: string | null;
  source_exported_artifact_ref: string | null;
  requested_provider_surface: ProviderSpecificExternalDeliverySurface | null;
  requested_execution_surface: ProviderSpecificDeliveryExecutionSurface | null;
  provider_profile_ref: string | null;
  execution_profile_ref: string | null;
  requested_recipient_ref: string | null;
  requested_payload_format: string | null;
  payload_hash: string | null;
  payload_type: string | null;
  execution_preflight_summary:
    ProviderSpecificDeliveryExecutionPreflightSummary;
  provider_execution_requirement_summary:
    ProviderSpecificDeliveryExecutionRequirementSummary;
  blocker_reasons: string[];
  warning_reasons: string[];
  residual_gate_summary: ExternalHandoffDeliveryResidualGateSummary;
  lineage_gate_summary: ProviderSpecificDeliveryLineageGateSummary;
  provider_config_gate_summary:
    ProviderSpecificDeliveryProviderConfigGateSummary;
  operator_gate_summary: ProviderSpecificDeliveryOperatorGateSummary;
  explicit_non_delivery_boundary:
    ProviderSpecificDeliveryExecutionNonDeliveryBoundary;
  authority_boundary: ProviderSpecificDeliveryExecutionAuthorityBoundary;
  would_not_do: string[];
  non_goals: string[];
}

export interface ProviderSpecificDeliveryExecutionOperatorDecisionPreviewInput {
  provider_specific_delivery_execution_contract_preview?:
    | ProviderSpecificDeliveryExecutionContractPreview
    | unknown;
  requested_operator_ref?: string;
  requested_idempotency_key?: string;
  review_confirmation_ref?: string;
  operator_decision_intent?:
    | "prepare_future_execution_contract_record_slice"
    | "keep_execution_preview_only"
    | "reject";
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export interface ProviderSpecificDeliveryExecutionOperatorDecisionPreview {
  decision_preview_version:
    typeof PROVIDER_SPECIFIC_DELIVERY_EXECUTION_OPERATOR_DECISION_PREVIEW_VERSION;
  decision_preview_fingerprint: string;
  scope: typeof PROVIDER_SPECIFIC_DELIVERY_EXECUTION_SCOPE;
  as_of: string;
  decision_status: ProviderSpecificDeliveryExecutionDecisionStatus;
  recommended_operator_decision:
    ProviderSpecificDeliveryExecutionRecommendedDecision;
  decision_reasons: string[];
  blocker_reasons: string[];
  warning_reasons: string[];
  source_execution_contract_preview_fingerprint: string | null;
  requested_operator_ref: string | null;
  requested_idempotency_key: string | null;
  review_confirmation_ref: string | null;
  next_step_readiness: {
    ready_for_operator_review: boolean;
    current_blockers: string[];
    current_missing_evidence: string[];
  };
  authority_boundary: ProviderSpecificDeliveryExecutionAuthorityBoundary;
  would_not_do: string[];
}
