import {
  readModelEgressArray,
  readModelEgressField,
  refuseModelEgress,
  requireModelEgressRecord,
  requireModelEgressText,
  serializeModelEgressJson,
  utf8ByteLength,
  type ModelTransportResponse,
} from "@/lib/model-egress/bounded-model-payload";
import {
  CHANGE_TYPES,
  MAX_OBSERVE_PROPOSALS,
  OPERATIONS,
  STABILITIES,
  TEMPORAL_SCOPES,
  validateCompilerOutput,
} from "@/lib/observe/proposal-contract";
import {
  ModelGatewayAdapterFailureV01,
  OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
  type ModelGatewayNormalizedUsageV01,
  type ObserveModelAdapterV01,
} from "@/lib/vnext/model-gateway/contracts";

export const OPENAI_RESPONSES_OBSERVE_ADAPTER_ID_V01 =
  "openai_responses.observe" as const;
export const OPENAI_RESPONSES_OBSERVE_ADAPTER_VERSION_V01 =
  "openai_responses_observe_adapter.v0.1" as const;

const OPENAI_RESPONSES_ENDPOINT = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-4.1-mini";
const STATE_VALUE_TYPES = new Set(["string", "number", "boolean"]);

export const OBSERVE_MODEL_EGRESS_LIMITS = Object.freeze({
  messageCharacters: 8_000,
  messageBytes: 32_768,
  stateItems: 64,
  sourceItemBytes: 4_096,
  dynamicBytes: 65_536,
  finalRequestBytes: 98_304,
});

export interface OpenAIResponsesObserveTransportRequestV01 {
  url: typeof OPENAI_RESPONSES_ENDPOINT;
  method: "POST";
  headers: Readonly<Record<"Authorization" | "Content-Type", string>>;
  body: string;
  signal: AbortSignal;
}

export type OpenAIResponsesObserveTransportV01 = (
  request: OpenAIResponsesObserveTransportRequestV01,
) => Promise<ModelTransportResponse>;

export interface OpenAIResponsesObserveAdapterDependenciesV01 {
  environment?: Partial<
    Pick<NodeJS.ProcessEnv, "OPENAI_API_KEY" | "OPENAI_MODEL">
  >;
  transport?: OpenAIResponsesObserveTransportV01;
}

export function createOpenAIResponsesObserveAdapterV01(
  dependencies: OpenAIResponsesObserveAdapterDependenciesV01 = {},
): ObserveModelAdapterV01 {
  const environment = dependencies.environment ?? process.env;
  const transport = dependencies.transport ?? sendOpenAIResponsesRequest;

  return {
    implementation_id: OPENAI_RESPONSES_OBSERVE_ADAPTER_ID_V01,
    implementation_version: OPENAI_RESPONSES_OBSERVE_ADAPTER_VERSION_V01,
    async prepare(_signal) {
      const apiKey = optionalConfigurationText(environment.OPENAI_API_KEY);
      if (!apiKey) return null;
      const model = optionalConfigurationText(environment.OPENAI_MODEL) ?? DEFAULT_MODEL;

      return {
        implementation_id: OPENAI_RESPONSES_OBSERVE_ADAPTER_ID_V01,
        implementation_version: OPENAI_RESPONSES_OBSERVE_ADAPTER_VERSION_V01,
        async invoke(input, lifecycle) {
          const dynamicMaterial = projectObserveModelMaterial({
            canonicalProjectId: input.canonical_project_id,
            message: input.message,
            currentState: input.current_state,
          });
          const dynamicText = serializeModelEgressJson(
            OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
            dynamicMaterial,
            OBSERVE_MODEL_EGRESS_LIMITS.dynamicBytes,
          );
          const requestBody = serializeModelEgressJson(
            OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
            {
              model: requireModelEgressText(
                OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
                model,
                128,
              ),
              input: [
                {
                  role: "system",
                  content: [{ type: "input_text", text: buildSystemPrompt() }],
                },
                {
                  role: "user",
                  content: [{ type: "input_text", text: dynamicText }],
                },
              ],
              text: {
                format: {
                  type: "json_schema",
                  name: "temporal_delta_proposals",
                  strict: true,
                  schema: proposalResponseSchema,
                },
              },
              max_output_tokens: lifecycle.budget.max_output_tokens,
              store: false,
            },
            Math.min(
              OBSERVE_MODEL_EGRESS_LIMITS.finalRequestBytes,
              lifecycle.budget.max_input_bytes,
            ),
          );
          lifecycle.report_input_bytes(utf8ByteLength(requestBody));
          lifecycle.mark_egress_attempted();

          let response: ModelTransportResponse;
          try {
            response = await transport({
              url: OPENAI_RESPONSES_ENDPOINT,
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: requestBody,
              signal: lifecycle.signal,
            });
          } catch {
            throw new ModelGatewayAdapterFailureV01(
              "adapter_transport_failed",
            );
          }

          if (typeof response.ok !== "boolean") {
            throw new ModelGatewayAdapterFailureV01(
              "adapter_response_invalid",
            );
          }
          if (!response.ok) {
            throw new ModelGatewayAdapterFailureV01(
              "adapter_provider_rejected",
            );
          }

          let payload: unknown;
          try {
            payload = await response.json();
          } catch {
            throw new ModelGatewayAdapterFailureV01(
              "adapter_response_invalid",
            );
          }

          try {
            const record = requireProviderRecord(payload);
            if (
              Object.hasOwn(record, "status") &&
              record.status !== "completed"
            ) {
              throw new Error("incomplete");
            }
            const outputText = extractOutputText(record);
            if (!outputText) throw new Error("missing_output");
            return {
              proposals: validateCompilerOutput(JSON.parse(outputText)),
              usage: normalizeUsage(record.usage),
            };
          } catch {
            throw new ModelGatewayAdapterFailureV01(
              "adapter_response_invalid",
            );
          }
        },
      };
    },
  };
}

async function sendOpenAIResponsesRequest(
  request: OpenAIResponsesObserveTransportRequestV01,
): Promise<ModelTransportResponse> {
  return fetch(request.url, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    signal: request.signal,
  });
}

function projectObserveModelMaterial({
  canonicalProjectId,
  message,
  currentState,
}: {
  canonicalProjectId: unknown;
  message: unknown;
  currentState: unknown;
}) {
  const projectedMessage = requireModelEgressText(
    OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
    message,
    OBSERVE_MODEL_EGRESS_LIMITS.messageBytes,
  );
  if (projectedMessage.length > OBSERVE_MODEL_EGRESS_LIMITS.messageCharacters) {
    refuseModelEgress(
      OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
      "model_egress_payload_oversize",
      projectedMessage.length,
      OBSERVE_MODEL_EGRESS_LIMITS.messageCharacters,
    );
  }
  const projectedProjectId = requireModelEgressText(
    OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
    canonicalProjectId,
    256,
  );
  const stateItems = readModelEgressArray(
    OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
    currentState,
    OBSERVE_MODEL_EGRESS_LIMITS.stateItems,
  );

  return {
    project_id: projectedProjectId,
    message: projectedMessage,
    current_state: stateItems.map((item) =>
      projectObserveStateItem(item, projectedProjectId),
    ),
  };
}

function projectObserveStateItem(value: unknown, canonicalProjectId: string) {
  const record = requireModelEgressRecord(
    OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
    value,
  );
  const sourceScope = requireModelEgressText(
    OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
    readModelEgressField(
      OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
      record,
      "scope",
    ),
    256,
  );
  if (sourceScope !== canonicalProjectId) {
    refuseModelEgress(
      OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
      "model_egress_payload_malformed",
      1,
      0,
    );
  }

  const stateValue = readModelEgressField(
    OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
    record,
    "value",
  );
  if (
    stateValue !== null &&
    (!STATE_VALUE_TYPES.has(typeof stateValue) ||
      (typeof stateValue === "number" && !Number.isFinite(stateValue)))
  ) {
    refuseModelEgress(
      OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
      "model_egress_payload_unsupported",
      1,
      0,
    );
  }

  const projected = {
    state_key: requireModelEgressText(
      OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
      readModelEgressField(
        OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
        record,
        "state_key",
      ),
      512,
    ),
    value: stateValue as string | number | boolean | null,
    temporal_scope: requireObserveEnum(record, "temporal_scope", TEMPORAL_SCOPES),
    stability: requireObserveEnum(record, "stability", STABILITIES),
    change_type: requireObserveEnum(record, "change_type", CHANGE_TYPES),
    valid_from: requireObserveDate(record, "valid_from"),
    valid_until: requireObserveDate(record, "valid_until"),
  };
  serializeModelEgressJson(
    OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
    projected,
    OBSERVE_MODEL_EGRESS_LIMITS.sourceItemBytes,
  );
  return projected;
}

function requireObserveEnum<T extends readonly string[]>(
  record: Record<string, unknown>,
  key: string,
  allowed: T,
) {
  const value = readModelEgressField(
    OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
    record,
    key,
  );
  if (typeof value !== "string" || !allowed.includes(value)) {
    refuseModelEgress(
      OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
      "model_egress_payload_malformed",
      1,
      0,
    );
  }
  return value as T[number];
}

function requireObserveDate(record: Record<string, unknown>, key: string) {
  const value = readModelEgressField(
    OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
    record,
    key,
  );
  if (value === null) return null;
  const text = requireModelEgressText(
    OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
    value,
    128,
  );
  if (Number.isNaN(Date.parse(text))) {
    refuseModelEgress(
      OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
      "model_egress_payload_malformed",
      1,
      0,
    );
  }
  return text;
}

function buildSystemPrompt() {
  return [
    "You are the Augnes temporal delta compiler.",
    "The model proposes typed temporal state delta proposals. The runtime owns state.",
    "Never mark proposals committed, accepted, or rejected.",
    "Do not output numeric scores, consolidation status, scoring reasons, or score breakdowns.",
    "Infer only state deltas supported by the message and current committed state.",
    "Prefer dot-separated state_key names like product.name or security.no_api_keys_in_repo.",
    "Use null before_value when no committed state exists for the key.",
    `temporal_scope must be one of: ${TEMPORAL_SCOPES.join(", ")}.`,
    `stability must be one of: ${STABILITIES.join(", ")}.`,
    `change_type must be one of: ${CHANGE_TYPES.join(", ")}.`,
    `operation must be one of: ${OPERATIONS.join(", ")}.`,
  ].join("\n");
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

const proposalValueSchema = {
  anyOf: [
    { type: "string" },
    { type: "number" },
    { type: "boolean" },
    { type: "null" },
  ],
};

const nullableDateSchema = {
  anyOf: [{ type: "string" }, { type: "null" }],
};

const proposalResponseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    proposals: {
      type: "array",
      maxItems: MAX_OBSERVE_PROPOSALS,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          state_key: { type: "string" },
          before_value: proposalValueSchema,
          after_value: proposalValueSchema,
          operation: { type: "string", enum: OPERATIONS },
          temporal_scope: { type: "string", enum: TEMPORAL_SCOPES },
          valid_from: nullableDateSchema,
          valid_until: nullableDateSchema,
          stability: { type: "string", enum: STABILITIES },
          change_type: { type: "string", enum: CHANGE_TYPES },
          reason: { type: "string" },
        },
        required: [
          "state_key",
          "before_value",
          "after_value",
          "operation",
          "temporal_scope",
          "valid_from",
          "valid_until",
          "stability",
          "change_type",
          "reason",
        ],
      },
    },
  },
  required: ["proposals"],
};
