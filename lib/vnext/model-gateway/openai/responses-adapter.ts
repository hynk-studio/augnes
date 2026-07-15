import {
  assertModelEgressTextIsSafe,
  requireModelEgressText,
  serializeModelEgressJson,
  utf8ByteLength,
  type ModelTransportResponse,
} from "@/lib/model-egress/bounded-model-payload";
import {
  ModelGatewayAdapterFailureV01,
  OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
  PLANNER_MODEL_GATEWAY_PURPOSE_V01,
  TEMPORAL_MODEL_GATEWAY_PURPOSE_V01,
  type ModelAdapterImplementationV01,
  type ModelAdapterInputV01,
  type ModelAdapterInvocationResultV01,
  type ModelAdapterV01,
  type ModelGatewayNormalizedUsageV01,
  type ModelGatewayPurposeV01,
} from "@/lib/vnext/model-gateway/contracts";
import {
  buildObserveSystemPrompt,
  OBSERVE_MODEL_EGRESS_LIMITS,
  observeResponseSchema,
  parseObserveOutput,
  projectObserveModelMaterial,
} from "@/lib/vnext/model-gateway/openai/observe-codec";
import {
  buildPlannerSystemPrompt,
  parsePlannerOutput,
  PLANNER_MODEL_EGRESS_LIMITS,
  plannerResponseSchema,
  projectPlannerModelMaterial,
} from "@/lib/vnext/model-gateway/openai/planner-codec";
import {
  buildTemporalSystemPrompt,
  parseTemporalOutput,
  projectTemporalModelMaterial,
  TEMPORAL_MODEL_EGRESS_LIMITS,
  temporalResponseSchema,
} from "@/lib/vnext/model-gateway/openai/temporal-codec";

export const OPENAI_RESPONSES_ENDPOINT_V01 =
  "https://api.openai.com/v1/responses" as const;
export const OPENAI_RESPONSES_OBSERVE_ADAPTER_ID_V01 =
  "openai_responses.observe" as const;
export const OPENAI_RESPONSES_OBSERVE_ADAPTER_VERSION_V01 =
  "openai_responses_observe_adapter.v0.1" as const;
export const OPENAI_RESPONSES_PLANNER_ADAPTER_ID_V01 =
  "openai_responses.planner" as const;
export const OPENAI_RESPONSES_PLANNER_ADAPTER_VERSION_V01 =
  "openai_responses_planner_adapter.v0.1" as const;
export const OPENAI_RESPONSES_TEMPORAL_ADAPTER_ID_V01 =
  "openai_responses.temporal" as const;
export const OPENAI_RESPONSES_TEMPORAL_ADAPTER_VERSION_V01 =
  "openai_responses_temporal_adapter.v0.1" as const;

const DEFAULT_MODEL = "gpt-4.1-mini";

export interface OpenAIResponsesTransportRequestV01 {
  url: typeof OPENAI_RESPONSES_ENDPOINT_V01;
  method: "POST";
  headers: Readonly<Record<"Authorization" | "Content-Type", string>>;
  body: string;
  signal: AbortSignal;
}

export type OpenAIResponsesTransportV01 = (
  request: OpenAIResponsesTransportRequestV01,
) => Promise<ModelTransportResponse>;

export interface OpenAIResponsesAdapterDependenciesV01 {
  environment?: Partial<
    Pick<NodeJS.ProcessEnv, "OPENAI_API_KEY" | "OPENAI_MODEL">
  >;
  transport?: OpenAIResponsesTransportV01;
}

export function createOpenAIResponsesAdapterV01(
  dependencies: OpenAIResponsesAdapterDependenciesV01 = {},
): ModelAdapterV01 {
  const environment = dependencies.environment ?? process.env;
  const transport = dependencies.transport ?? sendOpenAIResponsesRequest;

  return {
    describe: describeOpenAIImplementation,
    async prepare(purpose, _signal) {
      const apiKey = optionalConfigurationText(environment.OPENAI_API_KEY);
      if (!apiKey) return null;
      const model = optionalConfigurationText(environment.OPENAI_MODEL) ?? DEFAULT_MODEL;
      const implementation = describeOpenAIImplementation(purpose);

      return {
        ...implementation,
        purpose,
        async invoke(input, lifecycle) {
          if (input.input_kind !== purpose) adapterResponseInvalid();
          const codec = codecFor(input);
          const dynamicText = serializeModelEgressJson(
            purpose,
            codec.dynamic_material,
            codec.dynamic_bytes,
          );
          assertModelEgressTextIsSafe(purpose, dynamicText);
          const requestBody = serializeModelEgressJson(
            purpose,
            {
              model: requireModelEgressText(purpose, model, 128),
              input: [
                {
                  role: "system",
                  content: [{ type: "input_text", text: codec.system_prompt }],
                },
                {
                  role: "user",
                  content: [{ type: "input_text", text: dynamicText }],
                },
              ],
              text: {
                format: {
                  type: "json_schema",
                  name: codec.schema_name,
                  strict: true,
                  schema: codec.schema,
                },
              },
              max_output_tokens: lifecycle.budget.max_output_tokens,
              store: false,
            },
            Math.min(codec.final_request_bytes, lifecycle.budget.max_input_bytes),
          );
          lifecycle.report_input_bytes(utf8ByteLength(requestBody));
          lifecycle.mark_egress_attempted();

          let response: ModelTransportResponse;
          try {
            response = await transport({
              url: OPENAI_RESPONSES_ENDPOINT_V01,
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: requestBody,
              signal: lifecycle.signal,
            });
          } catch {
            throw new ModelGatewayAdapterFailureV01("adapter_transport_failed");
          }

          if (
            typeof response.ok !== "boolean" ||
            typeof response.status !== "number"
          ) {
            adapterResponseInvalid();
          }
          if (!response.ok) {
            throw new ModelGatewayAdapterFailureV01("adapter_provider_rejected");
          }

          let payload: unknown;
          try {
            payload = await response.json();
          } catch {
            adapterResponseInvalid();
          }

          try {
            const record = requireProviderRecord(payload);
            if (Object.hasOwn(record, "status") && record.status !== "completed") {
              adapterResponseInvalid();
            }
            const outputText = extractOutputText(record);
            if (!outputText) adapterResponseInvalid();
            requireModelEgressText(purpose, outputText, codec.response_bytes);
            return codec.parse(outputText, normalizeUsage(record.usage), model);
          } catch (error) {
            if (error instanceof ModelGatewayAdapterFailureV01) throw error;
            adapterResponseInvalid();
          }
        },
      };
    },
  };
}

type PurposeCodec = {
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
};

function codecFor(input: ModelAdapterInputV01): PurposeCodec {
  if (input.input_kind === OBSERVE_MODEL_GATEWAY_PURPOSE_V01) {
    return {
      dynamic_material: projectObserveModelMaterial(input),
      dynamic_bytes: OBSERVE_MODEL_EGRESS_LIMITS.dynamicBytes,
      final_request_bytes: OBSERVE_MODEL_EGRESS_LIMITS.finalRequestBytes,
      response_bytes: 65_536,
      system_prompt: buildObserveSystemPrompt(),
      schema_name: "temporal_delta_proposals",
      schema: observeResponseSchema,
      parse(outputText, usage) {
        return {
          purpose: OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
          proposals: parseObserveOutput(outputText),
          usage,
        };
      },
    };
  }
  if (input.input_kind === PLANNER_MODEL_GATEWAY_PURPOSE_V01) {
    return {
      dynamic_material: projectPlannerModelMaterial(input),
      dynamic_bytes: PLANNER_MODEL_EGRESS_LIMITS.dynamicBytes,
      final_request_bytes: PLANNER_MODEL_EGRESS_LIMITS.finalRequestBytes,
      response_bytes: PLANNER_MODEL_EGRESS_LIMITS.responseBytes,
      system_prompt: buildPlannerSystemPrompt(),
      schema_name: "augnes_plan",
      schema: plannerResponseSchema,
      parse(outputText, usage) {
        return {
          purpose: PLANNER_MODEL_GATEWAY_PURPOSE_V01,
          recommendations: parsePlannerOutput(outputText),
          usage,
        };
      },
    };
  }
  return {
    dynamic_material: projectTemporalModelMaterial(input),
    dynamic_bytes: TEMPORAL_MODEL_EGRESS_LIMITS.dynamicBytes,
    final_request_bytes: TEMPORAL_MODEL_EGRESS_LIMITS.finalRequestBytes,
    response_bytes: TEMPORAL_MODEL_EGRESS_LIMITS.responseBytes,
    system_prompt: buildTemporalSystemPrompt(),
    schema_name: "temporal_interpretation_preview",
    schema: temporalResponseSchema,
    parse(outputText, usage, model) {
      return {
        purpose: TEMPORAL_MODEL_GATEWAY_PURPOSE_V01,
        preview: parseTemporalOutput(outputText),
        model_identifier: model,
        usage,
      };
    },
  };
}

function describeOpenAIImplementation(
  purpose: ModelGatewayPurposeV01,
): ModelAdapterImplementationV01 {
  if (purpose === OBSERVE_MODEL_GATEWAY_PURPOSE_V01) {
    return {
      implementation_id: OPENAI_RESPONSES_OBSERVE_ADAPTER_ID_V01,
      implementation_version: OPENAI_RESPONSES_OBSERVE_ADAPTER_VERSION_V01,
    };
  }
  if (purpose === PLANNER_MODEL_GATEWAY_PURPOSE_V01) {
    return {
      implementation_id: OPENAI_RESPONSES_PLANNER_ADAPTER_ID_V01,
      implementation_version: OPENAI_RESPONSES_PLANNER_ADAPTER_VERSION_V01,
    };
  }
  return {
    implementation_id: OPENAI_RESPONSES_TEMPORAL_ADAPTER_ID_V01,
    implementation_version: OPENAI_RESPONSES_TEMPORAL_ADAPTER_VERSION_V01,
  };
}

async function sendOpenAIResponsesRequest(
  request: OpenAIResponsesTransportRequestV01,
): Promise<ModelTransportResponse> {
  return fetch(request.url, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    signal: request.signal,
  });
}

function extractOutputText(record: Record<string, unknown>): string | null {
  if (typeof record.output_text === "string" && record.output_text.length > 0) {
    return record.output_text;
  }
  if (!Array.isArray(record.output)) return null;

  const parts: string[] = [];
  for (const output of record.output) {
    if (!isProviderRecord(output) || !Array.isArray(output.content)) continue;
    for (const content of output.content) {
      if (
        isProviderRecord(content) &&
        content.type === "output_text" &&
        typeof content.text === "string"
      ) {
        parts.push(content.text);
      }
    }
  }
  return parts.length > 0 ? parts.join("") : null;
}

function normalizeUsage(value: unknown): ModelGatewayNormalizedUsageV01 | null {
  if (value === undefined || value === null) return null;
  const record = requireProviderRecord(value);
  const inputTokens = requireUsageCount(record.input_tokens);
  const outputTokens = requireUsageCount(record.output_tokens);
  const totalTokens = requireUsageCount(record.total_tokens);
  if (totalTokens < inputTokens + outputTokens) throw new Error("usage_invalid");
  return {
    basis: "provider_report",
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    total_tokens: totalTokens,
  };
}

function requireUsageCount(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error("usage_invalid");
  }
  return value;
}

function requireProviderRecord(value: unknown): Record<string, unknown> {
  if (!isProviderRecord(value)) throw new Error("provider_record_invalid");
  return value;
}

function isProviderRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalConfigurationText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function adapterResponseInvalid(): never {
  throw new ModelGatewayAdapterFailureV01("adapter_response_invalid");
}
