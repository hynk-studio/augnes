import type { StateEntry } from "@/lib/db";
import type { buildStateBrief } from "@/lib/state/brief";
import type { ValidatedProposal } from "@/lib/observe/proposal-contract";
import type {
  TemporalInterpretationPreview,
  TemporalPreviewContext,
} from "@/lib/temporal-interpretation/types";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type {
  ModelInvocationReceiptUsageV02,
  ModelInvocationReceiptV02,
} from "@/types/vnext/model-invocation-receipt";
export {
  MODEL_GATEWAY_EGRESS_POLICY_VERSION_V01,
  MODEL_INVOCATION_RECEIPT_VERSION_V02,
} from "@/types/vnext/model-invocation-receipt";
export type { ModelInvocationReceiptV02 } from "@/types/vnext/model-invocation-receipt";

export const MODEL_GATEWAY_VERSION_V01 = "model_gateway.v0.1" as const;
export const MODEL_INVOCATION_ENVELOPE_VERSION_V01 =
  "model_invocation_envelope.v0.1" as const;

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
      work_id: string;
      run_id: string;
      grant_id: string;
      grant_fingerprint: string;
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

export interface ModelGatewayPolicyAuthorizationV01 {
  workspace_id: string;
  project_id: string;
  work_id: string;
  run_id: string;
  automation_control_revision: number;
  grant_lineage_ref: ExternalRefV01;
  automation_control_lineage_ref: ExternalRefV01;
}

export type ModelGatewayNormalizedUsageV01 = ModelInvocationReceiptUsageV02;

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
  model_invocation_receipt: ModelInvocationReceiptV02;
}

export interface PlannerModelGatewayResultV01 {
  planner: "openai" | "mock";
  recommendations: PlannerRecommendationV01[];
  model_invocation_receipt: ModelInvocationReceiptV02;
}

export interface TemporalModelGatewayResultV01 {
  generator: "openai" | "mock" | "mock_fallback";
  model: string | null;
  preview: TemporalInterpretationPreview;
  model_invocation_receipt: ModelInvocationReceiptV02;
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
  provider_ref: ExternalRefV01;
  model_ref: ExternalRefV01;
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
    readonly receipt: ModelInvocationReceiptV02 | null = null,
  ) {
    super("Model gateway invocation failed.");
    this.name = "ModelGatewayInvocationErrorV01";
  }
}

export function isModelGatewayInvocationErrorV01(
  value: unknown,
): value is ModelGatewayInvocationErrorV01 {
  if (value instanceof ModelGatewayInvocationErrorV01) return true;
  if (
    !(value instanceof Error) ||
    value.name !== "ModelGatewayInvocationErrorV01" ||
    !("code" in value) ||
    !("receipt" in value) ||
    !MODEL_GATEWAY_FAILURE_CODES_V01.includes(
      value.code as ModelGatewayFailureCodeV01,
    )
  ) {
    return false;
  }
  return (
    value.receipt === null ||
    (typeof value.receipt === "object" &&
      value.receipt !== null &&
      "receipt_version" in value.receipt &&
      value.receipt.receipt_version === "model_invocation_receipt.v0.2")
  );
}
