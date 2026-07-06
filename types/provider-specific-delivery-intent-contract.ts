import type {
  ExternalHandoffDeliveryContractPreview,
  ExternalHandoffDeliveryContractRecordReview,
  ExternalHandoffDeliveryResidualGateSummary,
} from "./external-handoff-delivery-contract";
import type {
  ProviderSpecificExternalDeliveryOperatorDecisionPreview,
  ProviderSpecificExternalDeliveryPreviewContract,
  ProviderSpecificExternalDeliverySurface,
  ProviderSpecificRecipientSummary,
  ProviderSpecificRequirementSummary,
} from "./provider-specific-external-delivery-preview-contract";
import type { AppliedHandoffContextRead } from "@/lib/workplane/read-applied-handoff-context-for-web";
import type { ExportedHandoffPacketArtifactRead } from "@/lib/workplane/read-exported-handoff-packet-artifact-for-web";
import type { SentHandoffReadForWeb } from "@/lib/workplane/read-sent-handoff-for-web";
import type { HandoffSendContractRecordReview } from "./handoff-send-contract-record-review";
import type { HandoffSendRecordReview } from "./handoff-send-record-review";
import type { ResidualDiagnosticCandidateReadModel } from "./residual-diagnostic-candidate";
import type { WorkbenchSpineConsolidation } from "./workbench-spine-consolidation";

export const PROVIDER_SPECIFIC_DELIVERY_INTENT_CONTRACT_PREVIEW_VERSION =
  "provider_specific_delivery_intent_contract_preview.v0.1" as const;
export const PROVIDER_SPECIFIC_DELIVERY_INTENT_OPERATOR_DECISION_PREVIEW_VERSION =
  "provider_specific_delivery_intent_operator_decision_preview.v0.1" as const;
export const PROVIDER_SPECIFIC_DELIVERY_INTENT_CONTRACT_RECORD_VERSION =
  "provider_specific_delivery_intent_contract_record.v0.1" as const;
export const PROVIDER_SPECIFIC_DELIVERY_INTENT_CONTRACT_RECEIPT_VERSION =
  "provider_specific_delivery_intent_contract_receipt.v0.1" as const;
export const PROVIDER_SPECIFIC_DELIVERY_INTENT_CONTRACT_STORE_VERSION =
  "provider_specific_delivery_intent_contract_store.v0.1" as const;
export const PROVIDER_SPECIFIC_DELIVERY_INTENT_CONTRACT_RECORD_REVIEW_VERSION =
  "provider_specific_delivery_intent_contract_record_review.v0.1" as const;
export const PROVIDER_SPECIFIC_DELIVERY_INTENT_SCOPE =
  "project:augnes" as const;

export type ProviderSpecificDeliveryIntentPreviewStatus =
  | "ready_for_intent_decision"
  | "blocked"
  | "insufficient_data"
  | "provider_specific_preview_missing"
  | "provider_specific_preview_not_ready"
  | "provider_specific_decision_missing"
  | "provider_specific_decision_not_ready"
  | "external_contract_missing"
  | "external_contract_invalid"
  | "residual_gate_blocked"
  | "authority_boundary_blocked"
  | "unsafe_ref_blocked"
  | "provider_surface_not_supported"
  | "payload_format_unsupported";

export type ProviderSpecificDeliveryIntentDecisionStatus =
  | "ready_for_provider_specific_delivery_intent_contract_record_write"
  | "blocked"
  | "insufficient_data"
  | "keep_preview_only";

export type ProviderSpecificDeliveryIntentRecommendedDecision =
  | "record_provider_specific_delivery_intent_contract_candidate"
  | "keep_preview_only"
  | "wait_for_provider_specific_preview"
  | "resolve_provider_specific_blockers_first"
  | "do_not_prepare_provider_delivery";

export type ProviderSpecificDeliveryIntentReviewStatus =
  | "no_records"
  | "schema_missing"
  | "records_available"
  | "selected_record_found"
  | "selected_record_missing"
  | "records_invalid";

export type ProviderSpecificDeliveryIntentWriteStatus =
  | "written"
  | "idempotent_existing"
  | "conflict"
  | "refused"
  | "read"
  | "listed"
  | "not_found"
  | "schema_missing";

export interface ProviderSpecificDeliveryIntentInput {
  provider_specific_external_delivery_preview_contract?:
    | ProviderSpecificExternalDeliveryPreviewContract
    | unknown;
  provider_specific_external_delivery_operator_decision_preview?:
    | ProviderSpecificExternalDeliveryOperatorDecisionPreview
    | unknown;
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
  scope?: string;
  as_of?: string;
  source_refs?: string[];
  evidence_refs?: string[];
}

export interface ProviderSpecificDeliveryIntentBoundary {
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
  provider_specific_preview_is_delivery: false;
}

export interface ProviderSpecificDeliveryIntentAuthorityBoundary {
  read_only: boolean;
  advisory_only: boolean;
  intent_contract_only: boolean;
  source_of_truth: false;
  can_write_db: boolean;
  can_create_schema: boolean;
  can_create_provider_specific_delivery_intent_contract_record: boolean;
  can_create_provider_specific_delivery_intent_contract_receipt: boolean;
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
  can_write_external_handoff_delivery_contract_record: false;
  can_write_provider_specific_preview_contract_record: false;
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

export interface ProviderSpecificDeliveryIntentReadinessSummary {
  provider_specific_preview_ready: boolean;
  provider_specific_decision_ready: boolean;
  external_contract_record_available: boolean;
  provider_surface_supported: boolean;
  provider_profile_ref_safe_and_matched: boolean;
  recipient_ref_safe_and_matched: boolean;
  payload_hash_present: boolean;
  payload_format_safe_and_supported: boolean;
  residual_gate_passed: boolean;
  authority_boundary_passed: boolean;
  external_delivery_not_performed: boolean;
  intent_decision_ready: boolean;
}

export interface ProviderSpecificDeliveryIntentContractRecordPreview {
  record_version:
    typeof PROVIDER_SPECIFIC_DELIVERY_INTENT_CONTRACT_RECORD_VERSION;
  scope: typeof PROVIDER_SPECIFIC_DELIVERY_INTENT_SCOPE;
  source_intent_contract_preview_fingerprint: string;
  source_provider_specific_preview_fingerprint: string;
  source_provider_specific_decision_fingerprint: string;
  source_external_handoff_delivery_contract_record_ref: string;
  source_external_handoff_delivery_contract_preview_fingerprint: string | null;
  source_local_fulfillment_ref: string;
  source_handoff_send_contract_record_ref: string;
  source_exported_artifact_ref: string;
  source_applied_handoff_context_ref: string | null;
  requested_provider_surface: ProviderSpecificExternalDeliverySurface;
  provider_profile_ref: string | null;
  requested_recipient_ref: string;
  requested_payload_format: string;
  payload_hash: string;
  payload_type: string;
  intent_status:
    "provider_specific_delivery_intent_contract_candidate_recordable";
  source_refs: string[];
  evidence_refs: string[];
  provider_requirement_summary: ProviderSpecificRequirementSummary;
  residual_gate_summary: ExternalHandoffDeliveryResidualGateSummary;
  external_delivery_boundary: ProviderSpecificDeliveryIntentBoundary;
  authority_boundary: ProviderSpecificDeliveryIntentAuthorityBoundary;
  no_external_delivery_performed: true;
  no_provider_call_performed: true;
  no_external_message_sent: true;
}

export interface ProviderSpecificDeliveryIntentContractPreview {
  preview_version:
    typeof PROVIDER_SPECIFIC_DELIVERY_INTENT_CONTRACT_PREVIEW_VERSION;
  preview_fingerprint: string;
  scope: typeof PROVIDER_SPECIFIC_DELIVERY_INTENT_SCOPE;
  as_of: string;
  status: ProviderSpecificDeliveryIntentPreviewStatus;
  source_refs: string[];
  evidence_refs: string[];
  source_provider_specific_preview_fingerprint: string | null;
  source_provider_specific_decision_fingerprint: string | null;
  source_external_handoff_delivery_contract_record_ref: string | null;
  source_external_handoff_delivery_contract_preview_fingerprint: string | null;
  source_local_fulfillment_ref: string | null;
  source_handoff_send_contract_record_ref: string | null;
  source_exported_artifact_ref: string | null;
  source_applied_handoff_context_ref: string | null;
  requested_provider_surface: ProviderSpecificExternalDeliverySurface | null;
  provider_profile_ref: string | null;
  requested_recipient_ref: string | null;
  requested_payload_format: string | null;
  payload_hash: string | null;
  payload_type: string | null;
  provider_specific_recipient_summary: ProviderSpecificRecipientSummary | null;
  provider_requirement_summary: ProviderSpecificRequirementSummary | null;
  readiness_summary: ProviderSpecificDeliveryIntentReadinessSummary;
  blocker_reasons: string[];
  warning_reasons: string[];
  residual_gate_summary: ExternalHandoffDeliveryResidualGateSummary;
  external_delivery_boundary: ProviderSpecificDeliveryIntentBoundary;
  authority_boundary: ProviderSpecificDeliveryIntentAuthorityBoundary;
  would_write_provider_specific_delivery_intent_contract_record_preview:
    | ProviderSpecificDeliveryIntentContractRecordPreview
    | null;
  would_not_do: string[];
  non_goals: string[];
}

export interface ProviderSpecificDeliveryIntentOperatorDecisionPreviewInput {
  provider_specific_delivery_intent_contract_preview?:
    | ProviderSpecificDeliveryIntentContractPreview
    | unknown;
  requested_operator_ref?: string;
  requested_idempotency_key?: string;
  review_confirmation_ref?: string;
  operator_decision_intent?:
    | "record_provider_specific_delivery_intent_contract_candidate"
    | "keep_preview_only"
    | "reject";
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export interface ProviderSpecificDeliveryIntentOperatorDecisionPreview {
  decision_preview_version:
    typeof PROVIDER_SPECIFIC_DELIVERY_INTENT_OPERATOR_DECISION_PREVIEW_VERSION;
  decision_preview_fingerprint: string;
  scope: typeof PROVIDER_SPECIFIC_DELIVERY_INTENT_SCOPE;
  as_of: string;
  decision_status: ProviderSpecificDeliveryIntentDecisionStatus;
  recommended_operator_decision:
    ProviderSpecificDeliveryIntentRecommendedDecision;
  decision_reasons: string[];
  blocker_reasons: string[];
  warning_reasons: string[];
  source_intent_contract_preview_fingerprint: string | null;
  requested_operator_ref: string | null;
  requested_idempotency_key: string | null;
  review_confirmation_ref: string | null;
  write_readiness: {
    write_ready: boolean;
    current_blockers: string[];
    current_missing_evidence: string[];
  };
  would_write_provider_specific_delivery_intent_decision_preview: {
    provider_specific_delivery_intent_contract_preview:
      | ProviderSpecificDeliveryIntentContractPreview
      | null;
    requested_operator_ref: string | null;
    requested_idempotency_key: string | null;
    review_confirmation_ref: string | null;
  };
  authority_boundary: ProviderSpecificDeliveryIntentAuthorityBoundary;
  would_not_do: string[];
}

export interface ProviderSpecificDeliveryIntentContractWriteInput {
  operator_decision_preview:
    ProviderSpecificDeliveryIntentOperatorDecisionPreview;
  operator_approval: {
    operator_decision:
      "record_provider_specific_delivery_intent_contract_candidate";
    approved_by: string;
    operator_ref: string;
    approved_at: string;
    approval_statement: string;
    checklist_confirmations: string[];
  };
  idempotency_key: string;
  requested_side_effects?: Record<string, unknown>;
  notes?: string[];
}

export interface ProviderSpecificDeliveryIntentContractRecord {
  record_version:
    typeof PROVIDER_SPECIFIC_DELIVERY_INTENT_CONTRACT_RECORD_VERSION;
  record_id: string;
  idempotency_key: string;
  scope: typeof PROVIDER_SPECIFIC_DELIVERY_INTENT_SCOPE;
  created_at: string;
  operator_ref: string;
  source_intent_contract_preview_fingerprint: string;
  source_operator_decision_fingerprint: string;
  source_provider_specific_preview_fingerprint: string;
  source_provider_specific_decision_fingerprint: string;
  source_external_handoff_delivery_contract_record_ref: string;
  source_external_handoff_delivery_contract_preview_fingerprint: string | null;
  source_local_fulfillment_ref: string;
  source_handoff_send_contract_record_ref: string;
  source_exported_artifact_ref: string;
  source_applied_handoff_context_ref: string | null;
  requested_provider_surface: ProviderSpecificExternalDeliverySurface;
  provider_profile_ref: string | null;
  requested_recipient_ref: string;
  requested_payload_format: string;
  payload_hash: string;
  payload_type: string;
  intent_status:
    "recorded_as_provider_specific_delivery_intent_contract_candidate";
  source_refs: string[];
  evidence_refs: string[];
  provider_requirement_summary: ProviderSpecificRequirementSummary;
  residual_gate_summary: ExternalHandoffDeliveryResidualGateSummary;
  external_delivery_boundary: ProviderSpecificDeliveryIntentBoundary;
  authority_boundary: ProviderSpecificDeliveryIntentAuthorityBoundary;
  notes: string[];
  receipt: ProviderSpecificDeliveryIntentContractReceipt;
  record_fingerprint: string;
}

export interface ProviderSpecificDeliveryIntentContractReceipt {
  receipt_version:
    typeof PROVIDER_SPECIFIC_DELIVERY_INTENT_CONTRACT_RECEIPT_VERSION;
  record_id: string | null;
  idempotency_key: string | null;
  wrote: boolean;
  idempotent_replay: boolean;
  created_at: string;
  refused: boolean;
  refusal_reasons: string[];
  validation_hash: string | null;
  record_fingerprint: string | null;
  store_ref: string | null;
  no_side_effects: true;
  delivery_performed: false;
  provider_specific_delivery: false;
  provider_called: false;
  external_message_sent: false;
  email_sent: false;
  slack_sent: false;
  webhook_called: false;
  network_called: false;
  clipboard_written: false;
  file_downloaded: false;
}

export interface ProviderSpecificDeliveryIntentContractStoreResult {
  store_version:
    typeof PROVIDER_SPECIFIC_DELIVERY_INTENT_CONTRACT_STORE_VERSION;
  scope: typeof PROVIDER_SPECIFIC_DELIVERY_INTENT_SCOPE;
  status: ProviderSpecificDeliveryIntentWriteStatus;
  ok: boolean;
  error_code: string | null;
  record: ProviderSpecificDeliveryIntentContractRecord | null;
  records: ProviderSpecificDeliveryIntentContractRecord[];
  receipt: ProviderSpecificDeliveryIntentContractReceipt;
  notes: string[];
}

export interface ProviderSpecificDeliveryIntentContractRecordReviewInput {
  records?: unknown[];
  store_result?: ProviderSpecificDeliveryIntentContractStoreResult | null;
  selected_record_id?: string | null;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export interface ProviderSpecificDeliveryIntentContractRecordSummary {
  record_id: string | null;
  created_at: string | null;
  source_provider_specific_preview_fingerprint: string | null;
  source_provider_specific_decision_fingerprint: string | null;
  source_external_handoff_delivery_contract_record_ref: string | null;
  source_local_fulfillment_ref: string | null;
  source_handoff_send_contract_record_ref: string | null;
  source_exported_artifact_ref: string | null;
  requested_provider_surface: string | null;
  provider_profile_ref: string | null;
  requested_recipient_ref: string | null;
  requested_payload_format: string | null;
  payload_hash: string | null;
  payload_type: string | null;
  intent_status: string | null;
  delivery_performed: boolean;
  provider_called: boolean;
  external_message_sent: boolean;
  network_called: boolean;
  problem_reasons: string[];
}

export interface ProviderSpecificDeliveryIntentContractRecordReview {
  review_version:
    typeof PROVIDER_SPECIFIC_DELIVERY_INTENT_CONTRACT_RECORD_REVIEW_VERSION;
  scope: typeof PROVIDER_SPECIFIC_DELIVERY_INTENT_SCOPE;
  as_of: string;
  review_status: ProviderSpecificDeliveryIntentReviewStatus;
  selected_record_summary:
    | ProviderSpecificDeliveryIntentContractRecordSummary
    | null;
  latest_record_summary:
    | ProviderSpecificDeliveryIntentContractRecordSummary
    | null;
  record_summaries: ProviderSpecificDeliveryIntentContractRecordSummary[];
  input_summary: {
    supplied_record_count: number;
    valid_record_count: number;
    invalid_record_count: number;
    selected_record_id: string | null;
    selected_record_found: boolean;
  };
  evidence_summary: {
    has_valid_records: boolean;
    provider_surfaces: string[];
    provider_profile_refs: string[];
    requested_recipient_refs: string[];
    payload_hashes: string[];
    delivery_performed: false;
    provider_called: false;
    external_message_sent: false;
    network_called: false;
  };
  blocked_reasons: string[];
  insufficient_data_reasons: string[];
  source_refs: string[];
  records: ProviderSpecificDeliveryIntentContractRecord[];
  authority_boundary: ProviderSpecificDeliveryIntentAuthorityBoundary;
}
