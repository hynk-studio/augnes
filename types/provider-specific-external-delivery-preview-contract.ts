import type {
  ExternalHandoffDeliveryContractPreview,
  ExternalHandoffDeliveryContractRecordReview,
  ExternalHandoffDeliveryResidualGateSummary,
} from "./external-handoff-delivery-contract";
import type { AppliedHandoffContextRead } from "@/lib/workplane/read-applied-handoff-context-for-web";
import type { ExportedHandoffPacketArtifactRead } from "@/lib/workplane/read-exported-handoff-packet-artifact-for-web";
import type { SentHandoffReadForWeb } from "@/lib/workplane/read-sent-handoff-for-web";
import type { HandoffSendContractRecordReview } from "./handoff-send-contract-record-review";
import type { HandoffSendRecordReview } from "./handoff-send-record-review";
import type { ResidualDiagnosticCandidateReadModel } from "./residual-diagnostic-candidate";
import type { WorkbenchSpineConsolidation } from "./workbench-spine-consolidation";

export const PROVIDER_SPECIFIC_EXTERNAL_DELIVERY_PREVIEW_CONTRACT_VERSION =
  "provider_specific_external_delivery_preview_contract.v0.1" as const;
export const PROVIDER_SPECIFIC_EXTERNAL_DELIVERY_OPERATOR_DECISION_PREVIEW_VERSION =
  "provider_specific_external_delivery_operator_decision_preview.v0.1" as const;
export const PROVIDER_SPECIFIC_EXTERNAL_DELIVERY_SCOPE =
  "project:augnes" as const;

export type ProviderSpecificExternalDeliverySurface =
  | "manual_operator_delivery"
  | "email_delivery_preview"
  | "slack_delivery_preview"
  | "webhook_delivery_preview";

export type ProviderSpecificExternalDeliveryPreviewStatus =
  | "ready_for_provider_specific_decision"
  | "blocked"
  | "insufficient_data"
  | "external_contract_missing"
  | "external_contract_not_ready"
  | "provider_profile_missing"
  | "provider_profile_invalid"
  | "recipient_missing"
  | "payload_format_unsupported"
  | "residual_gate_blocked"
  | "authority_boundary_blocked";

export type ProviderSpecificExternalDeliveryProviderProfileStatus =
  | "not_required_for_manual_operator_delivery"
  | "missing"
  | "safe_ref_available"
  | "unsafe"
  | "not_configured";

export type ProviderSpecificExternalDeliveryDecisionStatus =
  | "ready_for_provider_specific_preview_decision"
  | "blocked"
  | "insufficient_data"
  | "keep_preview_only";

export type ProviderSpecificExternalDeliveryRecommendedDecision =
  | "record_provider_specific_preview_contract_candidate"
  | "keep_preview_only"
  | "wait_for_provider_profile"
  | "wait_for_recipient"
  | "resolve_residual_or_authority_blockers_first"
  | "do_not_prepare_provider_delivery";

export interface ProviderSpecificExternalDeliveryInput {
  external_handoff_delivery_contract_preview?:
    | ExternalHandoffDeliveryContractPreview
    | unknown;
  external_handoff_delivery_operator_decision_preview?: unknown;
  external_handoff_delivery_contract_record_review?:
    | ExternalHandoffDeliveryContractRecordReview
    | unknown;
  workbench_spine_consolidation?: WorkbenchSpineConsolidation | unknown;
  residual_diagnostic_candidate_read_model?:
    | ResidualDiagnosticCandidateReadModel
    | unknown;
  sent_handoff_read?: SentHandoffReadForWeb | unknown;
  handoff_send_record_review?: HandoffSendRecordReview | unknown;
  handoff_send_contract_record_review?: HandoffSendContractRecordReview | unknown;
  exported_handoff_packet_artifact_read?:
    | ExportedHandoffPacketArtifactRead
    | unknown;
  applied_handoff_context_read?: AppliedHandoffContextRead | unknown;
  requested_provider_surface?: ProviderSpecificExternalDeliverySurface | string;
  requested_provider_profile_ref?: string;
  requested_recipient_ref?: string;
  requested_payload_format?: string;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
  evidence_refs?: string[];
}

export interface ProviderSpecificExternalDeliveryBoundary {
  delivery_performed: false;
  provider_contract_present: false;
  provider_specific_delivery: false;
  provider_called: false;
  external_message_sent: false;
  email_sent: false;
  slack_sent: false;
  webhook_called: false;
  network_called: false;
  clipboard_written: false;
  file_downloaded: false;
  local_fulfillment_is_external_delivery: false;
  provider_specific_preview_is_delivery: false;
}

export interface ProviderSpecificExternalDeliveryAuthorityBoundary {
  read_only: true;
  advisory_only: true;
  preview_only: true;
  provider_specific_preview_only: true;
  source_of_truth: false;
  can_write_db: false;
  can_create_schema: false;
  can_create_route: false;
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
  can_call_network: false;
  can_write_clipboard: false;
  can_download_file: false;
  can_write_arbitrary_file: false;
  can_mutate_handoff_context: false;
  can_write_selected_refs_to_live_handoff: false;
  can_write_handoff_send_record: false;
  can_write_handoff_send_contract_record: false;
  can_write_external_handoff_delivery_contract_record: false;
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

export interface ProviderSpecificCapabilitySummary {
  provider_surface: ProviderSpecificExternalDeliverySurface | null;
  requires_provider_profile_ref: boolean;
  requires_provider_token: false;
  requires_recipient_ref: boolean;
  requires_payload_hash: boolean;
  requires_payload_format: boolean;
  provider_config_status: "not_required" | "not_configured" | "safe_ref_only";
  validates_by_provider_call: false;
  delivery_execution_available: false;
  future_delivery_slice_required: true;
}

export interface ProviderSpecificRecipientSummary {
  requested_recipient_ref: string | null;
  recipient_ref_safe: boolean;
  recipient_surface: ProviderSpecificExternalDeliverySurface | null;
  raw_recipient_material_rejected: boolean;
}

export interface ProviderSpecificRequirementSummary {
  required_refs: string[];
  missing_refs: string[];
  satisfied_requirements: string[];
  provider_specific_future_requirements: string[];
}

export interface ProviderSpecificReadinessSummary {
  external_contract_ready: boolean;
  external_contract_record_available: boolean;
  provider_surface_supported: boolean;
  provider_profile_ref_present: boolean;
  provider_profile_ref_safe: boolean;
  recipient_ref_present: boolean;
  recipient_ref_safe: boolean;
  payload_hash_present: boolean;
  payload_format_supported: boolean;
  residual_gate_passed: boolean;
  authority_boundary_passed: boolean;
  external_delivery_not_performed: boolean;
  provider_specific_decision_ready: boolean;
}

export interface ProviderSpecificExternalDeliveryPreviewContract {
  preview_version:
    typeof PROVIDER_SPECIFIC_EXTERNAL_DELIVERY_PREVIEW_CONTRACT_VERSION;
  preview_fingerprint: string;
  scope: typeof PROVIDER_SPECIFIC_EXTERNAL_DELIVERY_SCOPE;
  as_of: string;
  status: ProviderSpecificExternalDeliveryPreviewStatus;
  requested_provider_surface: ProviderSpecificExternalDeliverySurface | null;
  provider_profile_ref: string | null;
  provider_profile_status: ProviderSpecificExternalDeliveryProviderProfileStatus;
  provider_capability_summary: ProviderSpecificCapabilitySummary;
  source_external_handoff_delivery_contract_record_ref: string | null;
  source_external_handoff_delivery_contract_preview_fingerprint: string | null;
  source_local_fulfillment_ref: string | null;
  source_handoff_send_contract_record_ref: string | null;
  source_exported_artifact_ref: string | null;
  source_applied_handoff_context_ref: string | null;
  payload_hash: string | null;
  payload_type: string | null;
  requested_payload_format: string | null;
  requested_recipient_ref: string | null;
  provider_specific_recipient_summary: ProviderSpecificRecipientSummary;
  readiness_summary: ProviderSpecificReadinessSummary;
  blocker_reasons: string[];
  warning_reasons: string[];
  provider_requirement_summary: ProviderSpecificRequirementSummary;
  residual_gate_summary: ExternalHandoffDeliveryResidualGateSummary;
  external_delivery_boundary: ProviderSpecificExternalDeliveryBoundary;
  authority_boundary: ProviderSpecificExternalDeliveryAuthorityBoundary;
  source_refs: string[];
  evidence_refs: string[];
  would_not_do: string[];
  non_goals: string[];
}

export interface ProviderSpecificExternalDeliveryOperatorDecisionPreviewInput {
  provider_specific_external_delivery_preview_contract?:
    | ProviderSpecificExternalDeliveryPreviewContract
    | unknown;
  requested_operator_ref?: string;
  requested_idempotency_key?: string;
  review_confirmation_ref?: string;
  operator_decision_intent?:
    | "record_provider_specific_preview_contract_candidate"
    | "keep_preview_only"
    | "reject";
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export interface ProviderSpecificExternalDeliveryOperatorDecisionPreview {
  decision_preview_version:
    typeof PROVIDER_SPECIFIC_EXTERNAL_DELIVERY_OPERATOR_DECISION_PREVIEW_VERSION;
  decision_preview_fingerprint: string;
  scope: typeof PROVIDER_SPECIFIC_EXTERNAL_DELIVERY_SCOPE;
  as_of: string;
  decision_status: ProviderSpecificExternalDeliveryDecisionStatus;
  recommended_operator_decision:
    ProviderSpecificExternalDeliveryRecommendedDecision;
  decision_reasons: string[];
  blocker_reasons: string[];
  warning_reasons: string[];
  source_provider_specific_preview_fingerprint: string | null;
  requested_operator_ref: string | null;
  requested_idempotency_key: string | null;
  review_confirmation_ref: string | null;
  next_step_readiness: {
    ready_for_operator_review: boolean;
    current_blockers: string[];
    current_missing_evidence: string[];
  };
  authority_boundary: ProviderSpecificExternalDeliveryAuthorityBoundary;
  would_not_do: string[];
}
