import type {
  ModelAdapterImplementationV01,
  ModelAdapterInputV01,
  ModelAdapterInvocationResultV01,
  ModelGatewayNormalizedUsageV01,
  ModelGatewayPurposeV01,
} from "../contracts";
import type { ModelProviderResponseInvalidStageV01 } from "../provider-response-invalid-observation";

/** Data and pure method operations consumed by the generic Responses transport.
 * This type-only seam is internal composition, not runtime registration or
 * invocation authority. The existing Gateway still admits every invocation. */
export interface OpenAIResponsesPurposeCodecV01 {
  dynamic_material: unknown;
  dynamic_bytes: number;
  final_request_bytes: number;
  response_bytes: number;
  system_prompt: string;
  schema_name: string;
  schema: unknown;
  parse(
    outputText: string,
    usage: ModelGatewayNormalizedUsageV01 | null,
    model: string,
  ): ModelAdapterInvocationResultV01;
}

export interface OpenAIResponsesMethodBindingV01 {
  readonly implementation: Readonly<ModelAdapterImplementationV01>;
  readonly fixed_model?: string;
  readonly provider_contract_version?: string;
  readonly capture_provider_rejection: boolean;
  readonly require_response_status: boolean;
  readonly retain_reported_usage_on_refusal: boolean;
  model_configuration(model: string): {
    source_ref?: string;
    reasoning?: Readonly<{ effort: string; mode?: string }>;
    identity?: unknown;
  };
  codec(input: ModelAdapterInputV01): OpenAIResponsesPurposeCodecV01;
  client_request_id(input: ModelAdapterInputV01, context: {
    purpose: ModelGatewayPurposeV01;
    model: string;
    request_fingerprint: string;
    provider_request_trace_id?: string;
  }): string | null;
  parse_failure_stage(error: unknown): ModelProviderResponseInvalidStageV01;
}
