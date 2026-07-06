import type { HandoffSendPreview } from "./handoff-send-preview";

export const HANDOFF_SEND_DECISION_PREVIEW_VERSION =
  "handoff_send_operator_decision_preview.v0.1" as const;

export type HandoffSendOperatorDecisionIntent =
  | "approve_for_handoff_send_record"
  | "keep_preview_only"
  | "reject";

export type HandoffSendDecisionPreviewStatus =
  | "insufficient_data"
  | "blocked"
  | "ready_for_operator_review"
  | "ready_for_future_handoff_send_record_write"
  | "keep_preview_only";

export interface HandoffSendDecisionPreviewInput {
  handoff_send_preview?: unknown;
  requested_operator_ref?: string;
  requested_idempotency_key?: string;
  review_confirmation_ref?: string;
  operator_decision_intent?: HandoffSendOperatorDecisionIntent | string;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export interface HandoffSendDecisionReadiness {
  write_ready: boolean;
  readiness_label: string;
  requires_handoff_send_preview: true;
  requires_approval_intent: true;
  requires_review_confirmation: true;
  requires_idempotency_key: true;
  requires_operator_ref: true;
  requires_no_blockers: true;
  current_blockers: string[];
  current_missing_evidence: string[];
  current_refusal_reasons: string[];
  current_insufficient_data: string[];
}

export interface HandoffSendDecisionAuthorityBoundary {
  read_only: true;
  advisory_only: true;
  decision_preview_only: true;
  source_of_truth: false;
  can_write_db: false;
  can_create_handoff_send_record: false;
  can_create_handoff_send_receipt: false;
  can_record_local_send_fulfillment: false;
  can_send_handoff: false;
  can_call_send_provider: false;
  can_call_provider_openai: false;
  can_call_github: false;
  can_call_external_messaging: false;
  can_call_email: false;
  can_call_slack: false;
  can_call_webhook: false;
  can_transfer_codex_session: false;
  can_call_browser_or_crawler: false;
  can_write_clipboard: false;
  can_download_file: false;
  can_write_arbitrary_file: false;
  can_write_handoff_packet_file: false;
  can_mutate_handoff_context: false;
  can_apply_handoff_context_update_live: false;
  can_write_selected_refs_to_live_handoff: false;
  can_write_handoff_send_contract_record: false;
  can_write_handoff_packet_copy_export_record: false;
  can_write_handoff_packet_exported_artifact: false;
  can_write_handoff_packet_copy_export_contract_record: false;
  can_write_handoff_context_apply_record: false;
  can_write_applied_handoff_context_snapshot: false;
  can_write_handoff_context_update_contract_record: false;
  can_modify_api_perspective_current_route: false;
  can_replace_current_working_perspective_route_response: false;
  can_update_upstream_current_working_perspective_source_tables: false;
  can_write_applied_current_working_perspective_snapshot: false;
  can_write_current_working_perspective_apply_record: false;
  can_write_current_working_perspective_update_contract_record: false;
  can_write_route_integration_contract_record: false;
  can_write_perspective_unit: false;
  can_write_next_work_bias: false;
  can_write_continuity_relay: false;
  can_update_continuity_relay: false;
  can_apply_live_relay_state: false;
  can_write_memory: false;
  can_mutate_memory: false;
  can_promote_memory: false;
  can_update_global_dogfood_metrics: false;
  can_write_dogfood_metrics: false;
  can_write_dogfood_metric_snapshot: false;
  can_write_reuse_outcome_ledger: false;
  can_write_expected_observed_delta: false;
  can_write_work_episode: false;
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

export interface HandoffSendOperatorDecisionPreview {
  preview_version: typeof HANDOFF_SEND_DECISION_PREVIEW_VERSION;
  scope: string;
  as_of: string;
  source_refs: string[];
  decision_preview_status: HandoffSendDecisionPreviewStatus;
  recommended_operator_decision:
    | "approve_for_handoff_send_record"
    | "keep_preview_only"
    | "reject";
  available_operator_decisions: HandoffSendOperatorDecisionIntent[];
  input_summary: {
    has_handoff_send_preview: boolean;
    handoff_send_preview_ready: boolean;
    operator_decision_intent:
      | HandoffSendOperatorDecisionIntent
      | string
      | null;
    requested_operator_ref_supplied: boolean;
    requested_idempotency_key_supplied: boolean;
    review_confirmation_supplied: boolean;
    blocker_count: number;
    missing_evidence_count: number;
    refusal_reason_count: number;
    insufficient_data_reason_count: number;
  };
  source_status: {
    handoff_send_preview:
      | "supplied"
      | "missing"
      | "malformed"
      | "not_ready";
    review_confirmation_ref: "supplied" | "missing" | "unsafe";
    requested_idempotency_key: "supplied" | "missing" | "unsafe";
    requested_operator_ref: "supplied" | "missing" | "unsafe";
    operator_decision_intent:
      | "approve"
      | "missing"
      | "keep_preview_only"
      | "reject"
      | "unsupported";
  };
  write_readiness: HandoffSendDecisionReadiness;
  approval_requirements: string[];
  blocking_reasons: string[];
  missing_evidence: string[];
  refusal_reasons: string[];
  evidence_summary: {
    has_ready_handoff_send_preview: boolean;
    has_review_confirmation: boolean;
    has_idempotency_key: boolean;
    has_operator_ref: boolean;
    has_approval_intent: boolean;
    has_missing_evidence: boolean;
    has_refusal_reasons: boolean;
    no_handoff_send_confirmed: true;
    no_provider_call_confirmed: true;
    no_external_delivery_confirmed: true;
    no_codex_transfer_confirmed: true;
    source_refs: string[];
    evidence_refs: string[];
    missing_evidence: string[];
  };
  would_write_handoff_send_decision_preview: {
    operator_decision: "approve_for_handoff_send_record" | null;
    requested_operator_ref: string | null;
    requested_idempotency_key: string | null;
    review_confirmation_ref: string | null;
    source_refs: string[];
    evidence_refs: string[];
    handoff_send_preview: HandoffSendPreview | null;
  };
  operator_review_checklist: string[];
  would_not_write: string[];
  non_goals: string[];
  authority_boundary: HandoffSendDecisionAuthorityBoundary;
}
