import { isValidModelIdentifier, optionalConfigurationText } from "./local-configuration";
import {
  assertModelEgressTextIsSafe,
  refuseModelEgress,
  requireModelEgressText,
  serializeModelEgressJson,
  utf8ByteLength,
  type ModelTransportResponse,
} from "@/lib/model-egress/bounded-model-payload";
import { canonicalizeProtocolValueV01, createProtocolSha256V01 } from "@/lib/vnext/protocol-primitives";
import {
  ModelGatewayAdapterFailureV01,
  type ModelAdapterImplementationV01,
  type ModelAdapterV01,
  type ModelGatewayNormalizedUsageV01,
  type ModelGatewayPurposeV01,
} from "../contracts";
import type { OpenAIResponsesMethodBindingV01, OpenAIResponsesPurposeCodecV01 as PurposeCodec } from "./responses-method-binding";
import {
  OpenAIStrictSchemaSupportedSubsetErrorV01,
  validateOpenAIStrictSchemaSupportedSubsetV01,
} from "./strict-schema-supported-subset";
import { projectModelProviderRejectionObservationV01 } from "../provider-rejection-observation";
import {
  projectModelProviderResponseInvalidObservationV01,
  type ModelProviderIncompleteReasonV01,
  type ModelProviderResponseInvalidStageV01,
  type ModelProviderResponseStatusV01,
} from "../provider-response-invalid-observation";
import { projectModelTransportFailureObservationV01 } from "../transport-failure-observation";

export const OPENAI_RESPONSES_ENDPOINT_V01 = "https://api.openai.com/v1/responses" as const;
const DEFAULT_MODEL = "gpt-4.1-mini";
const MAX_PROVIDER_REJECTION_DIAGNOSTIC_BYTES_V02 = 4_096;

export interface OpenAIResponsesTransportRequestV01 {
  url: typeof OPENAI_RESPONSES_ENDPOINT_V01;
  method: "POST";
  headers: Readonly<
    Record<"Authorization" | "Content-Type", string> &
      Partial<Record<"X-Client-Request-Id", string>>
  >;
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

/** Internal composition seam. The public adapter supplies the frozen production
 * bindings; this owner enforces transport, request/response bounds and failures. */
export function createBoundOpenAIResponsesAdapterV01(
  resolveMethod: (purpose: ModelGatewayPurposeV01) => OpenAIResponsesMethodBindingV01,
  dependencies: OpenAIResponsesAdapterDependenciesV01 = {},
): ModelAdapterV01 {
  const environment = dependencies.environment ?? process.env;
  const transport = dependencies.transport ?? sendOpenAIResponsesRequest;

  return {
    describe: (purpose) => ({ ...resolveMethod(purpose).implementation }),
    async prepare(purpose, _signal) {
      const apiKey = optionalConfigurationText(environment.OPENAI_API_KEY);
      if (!apiKey) return null;
      const method = resolveMethod(purpose);
      const model = requireModelIdentifier(
        method.fixed_model ?? optionalConfigurationText(environment.OPENAI_MODEL) ?? DEFAULT_MODEL,
      );
      const implementation = method.implementation;
      const configuration = method.model_configuration(model);

      return {
        ...implementation,
        purpose,
        provider_ref: {
          ref_version: "external_ref.v0.1",
          ref_type: "model_provider",
          external_id: "openai",
          provider: "openai",
          trust_class: "direct_local_observation",
        },
        model_ref: {
          ref_version: "external_ref.v0.1",
          ref_type: "provider_model",
          external_id: model,
          ...(configuration.source_ref ? { source_ref: configuration.source_ref } : {}),
          provider: "openai",
          trust_class: "direct_local_observation",
        },
        async invoke(input, lifecycle) {
          if (input.input_kind !== purpose) adapterResponseInvalid();
          const codec = method.codec(input);
          const request = buildOpenAIResponsesRequestMaterialV01({
            purpose,
            method,
            codec,
            model,
            implementation,
            max_output_tokens: lifecycle.budget.max_output_tokens,
            max_input_bytes: lifecycle.budget.max_input_bytes,
          });
          const requestBody = request.request_body;
          const schemaFingerprint = request.schema_fingerprint;
          const requestFingerprint = request.request_fingerprint;
          const routeFingerprint = request.adapter_request_route_fingerprint;
          const clientRequestId = method.client_request_id(input, {
            purpose,
            model,
            request_fingerprint: requestFingerprint,
            provider_request_trace_id: lifecycle.provider_request_trace_id,
          });
          let receivedResult: { usage: ModelGatewayNormalizedUsageV01 | null } | null = null;
          const responseInvalid = (
            stage: ModelProviderResponseInvalidStageV01,
            observation: {
              provider_status?: unknown;
              incomplete_reason?: unknown;
              output_text_present: boolean;
              provider_request_id?: unknown;
            },
          ): never => {
            throw new ModelGatewayAdapterFailureV01(
              "adapter_response_invalid",
              null,
              clientRequestId
                ? projectModelProviderResponseInvalidObservationV01({
                    stage,
                    provider_status: observation.provider_status,
                    incomplete_reason: observation.incomplete_reason,
                    output_text_present: observation.output_text_present,
                    provider_request_id: observation.provider_request_id,
                    client_request_id: clientRequestId,
                    route_fingerprint: routeFingerprint,
                    request_fingerprint: requestFingerprint,
                    schema_fingerprint: schemaFingerprint,
                  })
                : null,
              null, receivedResult,
            );
          };
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
                ...(clientRequestId
                  ? { "X-Client-Request-Id": clientRequestId }
                  : {}),
              },
              body: requestBody,
              signal: lifecycle.signal,
            });
          } catch (error) {
            throw new ModelGatewayAdapterFailureV01(
              "adapter_transport_failed", null, null,
              projectModelTransportFailureObservationV01(error, lifecycle.signal.aborted),
            );
          }

          if (
            typeof response.ok !== "boolean" ||
            typeof response.status !== "number"
          ) {
            responseInvalid("response_envelope_invalid", {
              output_text_present: false,
              provider_request_id: readProviderRequestIdV01(response),
            });
          }
          if (!response.ok) {
            if (!method.capture_provider_rejection) {
              throw new ModelGatewayAdapterFailureV01(
                "adapter_provider_rejected",
              );
            }
            let errorPayload: unknown = null;
            let providerRequestId: string | null = null;
            let contentLength: number | null = null;
            try {
              providerRequestId =
                response.headers?.get("x-request-id") ??
                response.headers?.get("openai-request-id") ??
                null;
              const contentLengthHeader =
                response.headers?.get("content-length") ?? null;
              contentLength =
                contentLengthHeader !== null && /^\d{1,8}$/u.test(contentLengthHeader)
                  ? Number(contentLengthHeader)
                  : null;
            } catch {
              providerRequestId = null;
              contentLength = null;
            }
            if (
              contentLength === null ||
              contentLength <= MAX_PROVIDER_REJECTION_DIAGNOSTIC_BYTES_V02
            ) {
              try {
                if (response.text) {
                  const errorText = await response.text();
                  if (
                    utf8ByteLength(errorText) <=
                    MAX_PROVIDER_REJECTION_DIAGNOSTIC_BYTES_V02
                  ) {
                    errorPayload = JSON.parse(errorText) as unknown;
                  }
                } else {
                  errorPayload = await response.json();
                }
              } catch {
                errorPayload = null;
              }
            }
            throw new ModelGatewayAdapterFailureV01(
              "adapter_provider_rejected",
              projectModelProviderRejectionObservationV01({
                http_status: response.status,
                error_payload: errorPayload,
                provider_request_id: providerRequestId,
                client_request_id: clientRequestId!,
                route_fingerprint: routeFingerprint,
                request_fingerprint: requestFingerprint,
                schema_fingerprint: schemaFingerprint,
              }),
            );
          }

          let payload: unknown;
          try {
            payload = await response.json();
          } catch {
            responseInvalid("response_json_unreadable", {
              output_text_present: false,
              provider_request_id: readProviderRequestIdV01(response),
            });
          }
          let record: Record<string, unknown> | null = null;
          try {
            record = requireProviderRecord(payload);
          } catch {
            responseInvalid("response_envelope_invalid", {
              output_text_present: false,
              provider_request_id: readProviderRequestIdV01(response),
            });
          }
          if (record === null) {
            return responseInvalid("response_envelope_invalid", {
              output_text_present: false,
              provider_request_id: readProviderRequestIdV01(response),
            });
          }
          if (
            method.require_response_status &&
            !Object.hasOwn(record, "status")
          ) {
            responseInvalid("response_envelope_invalid", {
              output_text_present: extractOutputText(record) !== null,
              provider_request_id: readProviderRequestIdV01(response),
            });
          }
          // A method may retain only normalized reported counts before refusal;
          // an incomplete response can still represent billed work.
          if (method.retain_reported_usage_on_refusal) {
            try { receivedResult = { usage: normalizeUsage(record.usage) }; }
            catch { responseInvalid("response_usage_invalid", {
              provider_status: boundedProviderStatusV01(record.status), incomplete_reason: boundedIncompleteReasonV01(record),
              output_text_present: extractOutputText(record) !== null, provider_request_id: readProviderRequestIdV01(response),
            }); }
          }
          if (Object.hasOwn(record, "status") && record.status !== "completed") {
            responseInvalid("response_status_not_completed", {
              provider_status: boundedProviderStatusV01(record.status),
              incomplete_reason: boundedIncompleteReasonV01(record),
              output_text_present: extractOutputText(record) !== null,
              provider_request_id: readProviderRequestIdV01(response),
            });
          }
          const outputText = extractOutputText(record);
          if (!outputText) {
            return responseInvalid("response_output_text_missing", {
              provider_status: boundedProviderStatusV01(record.status),
              output_text_present: false,
              provider_request_id: readProviderRequestIdV01(response),
            });
          }
          if (utf8ByteLength(outputText) > codec.response_bytes) {
            responseInvalid("response_output_text_out_of_bounds", {
              provider_status: boundedProviderStatusV01(record.status),
              output_text_present: true,
              provider_request_id: readProviderRequestIdV01(response),
            });
          }
          let usage: ModelGatewayNormalizedUsageV01 | null = null;
          try {
            usage = normalizeUsage(record.usage);
          } catch {
            return responseInvalid("response_usage_invalid", {
              provider_status: boundedProviderStatusV01(record.status),
              output_text_present: true,
              provider_request_id: readProviderRequestIdV01(response),
            });
          }
          try {
            return codec.parse(outputText, usage, model);
          } catch (error) {
            if (error instanceof ModelGatewayAdapterFailureV01) throw error;
            return responseInvalid(
              method.parse_failure_stage(error),
              {
                provider_status: boundedProviderStatusV01(record.status),
                output_text_present: true,
                provider_request_id: readProviderRequestIdV01(response),
              },
            );
          }
        },
      };
    },
  };
}

export function buildOpenAIResponsesRequestMaterialV01(input: {
  purpose: ModelGatewayPurposeV01;
  codec: PurposeCodec;
  method: OpenAIResponsesMethodBindingV01;
  model: string;
  implementation: ModelAdapterImplementationV01;
  max_output_tokens: number;
  max_input_bytes: number;
}) {
  try {
    validateOpenAIStrictSchemaSupportedSubsetV01(input.codec.schema);
  } catch (error) {
    if (error instanceof OpenAIStrictSchemaSupportedSubsetErrorV01) {
      refuseModelEgress(
        input.purpose,
        "model_egress_payload_unsupported",
        1,
        0,
      );
    }
    throw error;
  }
  const dynamicText = serializeModelEgressJson(
    input.purpose,
    input.codec.dynamic_material,
    input.codec.dynamic_bytes,
  );
  assertModelEgressTextIsSafe(input.purpose, dynamicText);
  const requestBody = serializeModelEgressJson(
    input.purpose,
    {
      model: requireModelEgressText(input.purpose, input.model, 128),
      input: [
        {
          role: "system",
          content: [
            { type: "input_text", text: input.codec.system_prompt },
          ],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: dynamicText }],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: input.codec.schema_name,
          strict: true,
          schema: input.codec.schema,
        },
      },
      max_output_tokens: input.max_output_tokens,
      ...(input.method.model_configuration(input.model).reasoning
        ? { reasoning: input.method.model_configuration(input.model).reasoning } : {}),
      store: false,
    },
    Math.min(input.codec.final_request_bytes, input.max_input_bytes),
  );
  return {
    request_body: requestBody,
    request_fingerprint: createProtocolSha256V01(requestBody),
    schema_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(input.codec.schema),
    ),
    adapter_request_route_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        purpose: input.purpose,
        provider: "openai",
        model: input.model,
        ...(input.method.model_configuration(input.model).identity
          ? { model_configuration: input.method.model_configuration(input.model).identity } : {}),
        adapter_implementation_id:
          input.implementation.implementation_id,
        adapter_implementation_version:
          input.implementation.implementation_version,
        ...(input.method.provider_contract_version
          ? {
              provider_contract_version: input.method.provider_contract_version,
              max_input_bytes: input.max_input_bytes,
              max_output_tokens: input.max_output_tokens,
              response_bytes: input.codec.response_bytes,
            }
          : {}),
      }),
    ),
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
  let cachedInputTokens: number | undefined;
  let reasoningTokens: number | undefined;
  if (Object.hasOwn(record, "output_tokens_details")) {
    const details = requireProviderRecord(record.output_tokens_details);
    if (Object.hasOwn(details, "reasoning_tokens")) {
      reasoningTokens = requireUsageCount(details.reasoning_tokens);
      if (reasoningTokens > outputTokens) throw new Error("usage_invalid");
    }
  }
  if (Object.hasOwn(record, "input_tokens_details")) {
    const details = requireProviderRecord(record.input_tokens_details);
    cachedInputTokens = requireUsageCount(details.cached_tokens);
    if (cachedInputTokens > inputTokens) throw new Error("usage_invalid");
  }
  if (totalTokens < inputTokens + outputTokens) throw new Error("usage_invalid");
  return {
    basis: "provider_report",
    quality: "reported",
    source: "provider_response",
    input_tokens: inputTokens,
    ...(cachedInputTokens === undefined
      ? {}
      : { cached_input_tokens: cachedInputTokens }),
    output_tokens: outputTokens,
    ...(reasoningTokens === undefined ? {} : { reasoning_tokens: reasoningTokens }),
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

function requireModelIdentifier(value: string): string {
  if (!isValidModelIdentifier(value)) {
    throw new ModelGatewayAdapterFailureV01("adapter_transport_failed");
  }
  return value;
}

function readProviderRequestIdV01(
  response: Pick<ModelTransportResponse, "headers">,
): string | null {
  try {
    return (
      response.headers?.get("x-request-id") ??
      response.headers?.get("openai-request-id") ??
      null
    );
  } catch {
    return null;
  }
}

function boundedProviderStatusV01(
  value: unknown,
): ModelProviderResponseStatusV01 | null {
  if (value === undefined || value === null) return null;
  return ["completed", "incomplete", "failed"].includes(value as string)
    ? (value as ModelProviderResponseStatusV01)
    : "unknown";
}

function boundedIncompleteReasonV01(
  record: Record<string, unknown>,
): ModelProviderIncompleteReasonV01 | null {
  if (record.status !== "incomplete") return null;
  if (!isProviderRecord(record.incomplete_details)) return "unknown";
  const reason = record.incomplete_details.reason;
  return ["max_output_tokens", "content_filter"].includes(reason as string)
    ? (reason as ModelProviderIncompleteReasonV01)
    : "unknown";
}

function adapterResponseInvalid(): never {
  throw new ModelGatewayAdapterFailureV01("adapter_response_invalid");
}
