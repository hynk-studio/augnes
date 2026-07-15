import type { StateEntry } from "@/lib/db";
import type { buildStateBrief } from "@/lib/state/brief";
import type { ValidatedProposal } from "@/lib/observe/proposal-contract";
import type {
  TemporalInterpretationPreview,
  TemporalPreviewContext,
} from "@/lib/temporal-interpretation/types";

export const MODEL_GATEWAY_VERSION_V01 = "model_gateway.v0.1" as const;
export const MODEL_INVOCATION_ENVELOPE_VERSION_V01 =
  "model_invocation_envelope.v0.1" as const;
export const MODEL_INVOCATION_RECEIPT_VERSION_V01 =
  "model_invocation_receipt.v0.1" as const;

export const OBSERVE_MODEL_GATEWAY_PURPOSE_V01 =
  "observe_delta_compile" as const;
export const PLANNER_MODEL_GATEWAY_PURPOSE_V01 = "planner_plan" as const;
export const TEMPORAL_MODEL_GATEWAY_PURPOSE_V01 =
  "temporal_interpretation" as const;
export const MODEL_GATEWAY_PURPOSES_V01 = [
  OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
  PLANNER_MODEL_GATEWAY_PURPOSE_V01,
  TEMPORAL_MODEL_GATEWAY_PURPOSE_V01,
] as const;

export type ModelGatewayPurposeV01 =
  (typeof MODEL_GATEWAY_PURPOSES_V01)[number];

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

interface ModelInvocationEnvelopeBaseV01 {
  envelope_version: typeof MODEL_INVOCATION_ENVELOPE_VERSION_V01;
  invocation_id: string;
  workspace_id: string;
  project_id: string;
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
}

export interface ObserveModelInvocationEnvelopeV01
  extends ModelInvocationEnvelopeBaseV01 {
  purpose: typeof OBSERVE_MODEL_GATEWAY_PURPOSE_V01;
  input: {
    input_kind: typeof OBSERVE_MODEL_GATEWAY_PURPOSE_V01;
    message: string;
    current_state: StateEntry[];
  };
}

export type PlannerStateBriefV01 = ReturnType<typeof buildStateBrief>;

export interface PlannerModelInvocationEnvelopeV01
  extends ModelInvocationEnvelopeBaseV01 {
  purpose: typeof PLANNER_MODEL_GATEWAY_PURPOSE_V01;
  input: {
    input_kind: typeof PLANNER_MODEL_GATEWAY_PURPOSE_V01;
    message: string;
    brief: PlannerStateBriefV01;
  };
}

export interface TemporalModelInvocationEnvelopeV01
  extends ModelInvocationEnvelopeBaseV01 {
  purpose: typeof TEMPORAL_MODEL_GATEWAY_PURPOSE_V01;
  input: {
    input_kind: typeof TEMPORAL_MODEL_GATEWAY_PURPOSE_V01;
    context: TemporalPreviewContext;
  };
}

export type ModelInvocationEnvelopeV01 =
  | ObserveModelInvocationEnvelopeV01
  | PlannerModelInvocationEnvelopeV01
  | TemporalModelInvocationEnvelopeV01;

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
  purpose: ModelGatewayPurposeV01;
  implementation_id: string;
  implementation_version: string;
  requested_mode: ModelGatewayExecutionModeV01;
  execution_mode: ModelGatewayExecutionModeV01;
  selection_reason:
    | "requested_live"
    | "explicit_deterministic"
    | "provider_unavailable"
    | "provider_failure_fallback";
  started_at: string;
  finished_at: string;
  latency_ms: number;
  status: "completed" | "blocked" | "failed" | "cancelled";
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

export type PlannerRecommendationV01 = {
  title: string;
  rationale: string;
  tool_name: string | null;
  priority: "now" | "next" | "later";
  grounded_state_keys: string[];
};

export interface ObserveModelGatewayResultV01 {
  compiler: "openai" | "mock";
  proposals: ValidatedProposal[];
  model_invocation_receipt: ModelInvocationReceiptV01;
}

export interface PlannerModelGatewayResultV01 {
  planner: "openai" | "mock";
  recommendations: PlannerRecommendationV01[];
  model_invocation_receipt: ModelInvocationReceiptV01;
}

export interface TemporalModelGatewayResultV01 {
  generator: "openai" | "mock" | "mock_fallback";
  model: string | null;
  preview: TemporalInterpretationPreview;
  model_invocation_receipt: ModelInvocationReceiptV01;
}

export type ModelAdapterInputV01 =
  | ({ canonical_project_id: string } & ObserveModelInvocationEnvelopeV01["input"])
  | ({ canonical_project_id: string } & PlannerModelInvocationEnvelopeV01["input"])
  | ({ canonical_project_id: string } & TemporalModelInvocationEnvelopeV01["input"]);

export interface ModelAdapterLifecycleV01 {
  signal: AbortSignal;
  budget: ModelGatewayBudgetV01;
  retention_class: "none";
  mark_egress_attempted(): void;
  report_input_bytes(bytes: number): void;
}

export type ModelAdapterInvocationResultV01 =
  | {
      purpose: typeof OBSERVE_MODEL_GATEWAY_PURPOSE_V01;
      proposals: ValidatedProposal[];
      usage: ModelGatewayNormalizedUsageV01 | null;
    }
  | {
      purpose: typeof PLANNER_MODEL_GATEWAY_PURPOSE_V01;
      recommendations: PlannerRecommendationV01[];
      usage: ModelGatewayNormalizedUsageV01 | null;
    }
  | {
      purpose: typeof TEMPORAL_MODEL_GATEWAY_PURPOSE_V01;
      preview: TemporalInterpretationPreview;
      model_identifier: string;
      usage: ModelGatewayNormalizedUsageV01 | null;
    };

export interface ModelAdapterImplementationV01 {
  implementation_id: string;
  implementation_version: string;
}

export interface ModelAdapterSessionV01 extends ModelAdapterImplementationV01 {
  purpose: ModelGatewayPurposeV01;
  invoke(
    input: ModelAdapterInputV01,
    lifecycle: ModelAdapterLifecycleV01,
  ): Promise<ModelAdapterInvocationResultV01>;
}

export interface ModelAdapterV01 {
  describe(purpose: ModelGatewayPurposeV01): ModelAdapterImplementationV01;
  prepare(
    purpose: ModelGatewayPurposeV01,
    signal: AbortSignal,
  ): Promise<ModelAdapterSessionV01 | null>;
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
