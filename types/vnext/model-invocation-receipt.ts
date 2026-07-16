import type { ExternalRefV01 } from "./external-ref";

export const MODEL_INVOCATION_RECEIPT_VERSION_V02 =
  "model_invocation_receipt.v0.2" as const;
export const MODEL_GATEWAY_EGRESS_POLICY_VERSION_V01 =
  "model_gateway_egress_policy.v0.1" as const;

export type ModelInvocationReceiptPurposeV02 =
  | "observe_delta_compile"
  | "planner_plan"
  | "temporal_interpretation";

export interface ModelInvocationReceiptUsageV02 {
  basis: "provider_report";
  quality: "reported";
  source: "provider_response";
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
}

export interface ModelInvocationReceiptV02 {
  receipt_version: typeof MODEL_INVOCATION_RECEIPT_VERSION_V02;
  gateway_version: "model_gateway.v0.1";
  invocation_id: string;
  workspace_id: string;
  project_id: string;
  work_id: string | null;
  run_id: string | null;
  purpose: ModelInvocationReceiptPurposeV02;
  invocation_origin: "interactive" | "policy_triggered";
  attempted_implementation_id: string | null;
  attempted_implementation_version: string | null;
  attempted_provider_ref: ExternalRefV01 | null;
  attempted_model_ref: ExternalRefV01 | null;
  final_implementation_id: string;
  final_implementation_version: string;
  requested_mode: "live" | "deterministic";
  execution_mode: "live" | "deterministic";
  selection_reason:
    | "requested_live"
    | "explicit_deterministic"
    | "provider_unavailable"
    | "provider_failure_fallback";
  started_at: string;
  finished_at: string;
  latency_ms: number;
  status: "completed" | "blocked" | "failed" | "cancelled" | "timed_out";
  outcome:
    | "live_success"
    | "deterministic_success"
    | "deterministic_fallback_success"
    | "deterministic_failure"
    | "refused"
    | "provider_failure"
    | "timeout"
    | "cancelled";
  egress_attempted: boolean;
  egress_status: "occurred" | "did_not_occur" | "blocked";
  egress_policy_version: typeof MODEL_GATEWAY_EGRESS_POLICY_VERSION_V01;
  usage: ModelInvocationReceiptUsageV02 | null;
  cost: {
    basis: "unavailable";
    amount: null;
    currency: null;
    source: "no_pricing_authority";
  };
  budget: {
    decision: "within_budget" | "not_used" | "refused";
    input_bytes_limit: number;
    input_bytes_used: number | null;
    output_tokens_limit: number;
    output_tokens_used: number | null;
    provider_call_limit: 0 | 1;
    provider_calls_used: 0 | 1;
    timeout_limit_ms: number;
    timeout_disposition: "completed_within_deadline" | "timed_out" | "cancelled";
  };
  cancellation_disposition: "not_cancelled" | "cancelled";
  failure_code:
    | "model_gateway_invalid_envelope"
    | "model_gateway_scope_refused"
    | "model_gateway_policy_refused"
    | "model_gateway_budget_refused"
    | "model_gateway_egress_refused"
    | "model_gateway_cancelled"
    | "model_gateway_timeout"
    | "model_gateway_deterministic_failed"
    | "model_gateway_provider_rejected"
    | "model_gateway_provider_response_invalid"
    | "model_gateway_transport_failed"
    | null;
  data_classification: "public_safe" | "private" | "local_only" | "secret";
  retention_class: "none";
  privacy_decision:
    | "provider_egress_approved"
    | "provider_egress_not_used"
    | "provider_egress_blocked";
  provenance_refs: string[];
  grant_lineage_ref: ExternalRefV01 | null;
  automation_control_lineage_ref: ExternalRefV01 | null;
  fallback_used: boolean;
  coverage_class: "enforced";
  trust_class: "direct_local_observation" | "provider_report" | "mixed";
  raw_prompt_persisted: false;
  raw_response_persisted: false;
  hidden_reasoning_persisted: false;
  receipt_is_semantic_authority: false;
}
