import type { StateEntry } from "@/lib/db";
import type { ValidatedProposal } from "@/lib/observe/proposal-contract";

export const MODEL_GATEWAY_VERSION_V01 = "model_gateway.v0.1" as const;
export const MODEL_INVOCATION_ENVELOPE_VERSION_V01 =
  "model_invocation_envelope.v0.1" as const;
export const MODEL_INVOCATION_RECEIPT_VERSION_V01 =
  "model_invocation_receipt.v0.1" as const;
export const OBSERVE_MODEL_GATEWAY_PURPOSE_V01 =
  "observe_delta_compile" as const;

export const MODEL_GATEWAY_FAILURE_CODES_V01 = [
  "model_gateway_invalid_envelope",
  "model_gateway_scope_refused",
  "model_gateway_policy_refused",
  "model_gateway_budget_refused",
  "model_gateway_egress_refused",
  "model_gateway_cancelled",
  "model_gateway_timeout",
  "model_gateway_deterministic_failed",
  "model_gateway_provider_rejected",
  "model_gateway_provider_response_invalid",
  "model_gateway_transport_failed",
] as const;

export type ModelGatewayFailureCodeV01 =
  (typeof MODEL_GATEWAY_FAILURE_CODES_V01)[number];

export type ModelGatewayDataClassificationV01 =
  | "public_safe"
  | "private"
  | "local_only"
  | "secret";

export type ModelGatewayExecutionModeV01 = "live" | "deterministic";

export type ModelGatewayPolicyInputV01 =
  | {
      invocation_origin: "interactive";
      expected_active_project_id: string;
      expected_active_selection_revision: number;
    }
  | {
      invocation_origin: "policy_triggered";
      automation_control_revision: number;
    };

export interface ModelGatewayBudgetV01 {
  max_input_bytes: number;
  max_output_tokens: number;
  max_provider_calls: 0 | 1;
}

export interface ObserveModelInvocationEnvelopeV01 {
  envelope_version: typeof MODEL_INVOCATION_ENVELOPE_VERSION_V01;
  invocation_id: string;
  workspace_id: string;
  project_id: string;
  purpose: typeof OBSERVE_MODEL_GATEWAY_PURPOSE_V01;
  data_classification: ModelGatewayDataClassificationV01;
  provenance_refs: string[];
  privacy: {
    provider_egress: "allow" | "deny";
    retention_class: "none";
  };
  budget: ModelGatewayBudgetV01;
  timeout_ms: number;
  cancellation: {
    signal: AbortSignal;
  };
  execution_mode: ModelGatewayExecutionModeV01;
  policy: ModelGatewayPolicyInputV01;
  project_root?: {
    path_flavor: "posix" | "win32";
    normalized_path: string;
  };
  input: {
    input_kind: typeof OBSERVE_MODEL_GATEWAY_PURPOSE_V01;
    message: string;
    current_state: StateEntry[];
  };
}

export interface ModelGatewayNormalizedUsageV01 {
  basis: "provider_report";
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
}

export interface ModelInvocationReceiptV01 {
  receipt_version: typeof MODEL_INVOCATION_RECEIPT_VERSION_V01;
  gateway_version: typeof MODEL_GATEWAY_VERSION_V01;
  invocation_id: string;
  workspace_id: string;
  project_id: string;
  purpose: typeof OBSERVE_MODEL_GATEWAY_PURPOSE_V01;
  implementation_id: string;
  implementation_version: string;
  requested_mode: ModelGatewayExecutionModeV01;
  execution_mode: ModelGatewayExecutionModeV01;
  selection_reason:
    | "requested_live"
    | "explicit_deterministic"
    | "provider_unavailable";
  started_at: string;
  finished_at: string;
  latency_ms: number;
  status: "completed" | "blocked" | "failed" | "cancelled";
  outcome:
    | "live_success"
    | "deterministic_success"
    | "deterministic_failure"
    | "refused"
    | "provider_failure"
    | "timeout"
    | "cancelled";
  egress_attempted: boolean;
  egress_status: "occurred" | "did_not_occur" | "blocked";
  usage: ModelGatewayNormalizedUsageV01 | null;
  budget: {
    decision: "within_budget" | "not_used" | "refused";
    input_bytes_limit: number;
    input_bytes_used: number | null;
    output_tokens_limit: number;
    provider_call_limit: 0 | 1;
    provider_calls_used: 0 | 1;
  };
  failure_code: ModelGatewayFailureCodeV01 | null;
  data_classification: ModelGatewayDataClassificationV01;
  retention_class: "none";
  privacy_decision:
    | "provider_egress_approved"
    | "provider_egress_not_used"
    | "provider_egress_blocked";
  provenance_refs: string[];
  raw_prompt_persisted: false;
  raw_response_persisted: false;
  hidden_reasoning_persisted: false;
  receipt_is_semantic_authority: false;
}

export interface ObserveModelGatewayResultV01 {
  compiler: "openai" | "mock";
  proposals: ValidatedProposal[];
  model_invocation_receipt: ModelInvocationReceiptV01;
}

export interface ObserveModelAdapterInputV01 {
  canonical_project_id: string;
  message: string;
  current_state: StateEntry[];
}

export interface ObserveModelAdapterLifecycleV01 {
  signal: AbortSignal;
  budget: ModelGatewayBudgetV01;
  retention_class: "none";
  mark_egress_attempted(): void;
  report_input_bytes(bytes: number): void;
}

export interface ObserveModelAdapterInvocationResultV01 {
  proposals: ValidatedProposal[];
  usage: ModelGatewayNormalizedUsageV01 | null;
}

export interface ObserveModelAdapterSessionV01 {
  implementation_id: string;
  implementation_version: string;
  invoke(
    input: ObserveModelAdapterInputV01,
    lifecycle: ObserveModelAdapterLifecycleV01,
  ): Promise<ObserveModelAdapterInvocationResultV01>;
}

export interface ObserveModelAdapterV01 {
  implementation_id: string;
  implementation_version: string;
  prepare(signal: AbortSignal): Promise<ObserveModelAdapterSessionV01 | null>;
}

export type ModelGatewayAdapterFailureCodeV01 =
  | "adapter_provider_rejected"
  | "adapter_response_invalid"
  | "adapter_transport_failed";

export class ModelGatewayAdapterFailureV01 extends Error {
  constructor(readonly code: ModelGatewayAdapterFailureCodeV01) {
    super("Model adapter invocation failed.");
    this.name = "ModelGatewayAdapterFailureV01";
  }
}

export class ModelGatewayInvocationErrorV01 extends Error {
  constructor(
    readonly code: ModelGatewayFailureCodeV01,
    readonly receipt: ModelInvocationReceiptV01 | null = null,
  ) {
    super("Model gateway invocation failed.");
    this.name = "ModelGatewayInvocationErrorV01";
  }
}

export function isModelGatewayInvocationErrorV01(
  value: unknown,
): value is ModelGatewayInvocationErrorV01 {
  return value instanceof ModelGatewayInvocationErrorV01;
}
