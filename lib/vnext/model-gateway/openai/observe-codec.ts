import {
  readModelEgressArray,
  readModelEgressField,
  refuseModelEgress,
  requireModelEgressRecord,
  requireModelEgressText,
  serializeModelEgressJson,
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
  OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
  type ObserveModelInvocationEnvelopeV01,
} from "@/lib/vnext/model-gateway/contracts";

export const OBSERVE_MODEL_EGRESS_LIMITS = Object.freeze({
  messageCharacters: 8_000,
  messageBytes: 32_768,
  stateItems: 64,
  sourceItemBytes: 4_096,
  dynamicBytes: 65_536,
  finalRequestBytes: 98_304,
});

const STATE_VALUE_TYPES = new Set(["string", "number", "boolean"]);

export function projectObserveModelMaterial(
  input: { canonical_project_id: string } & ObserveModelInvocationEnvelopeV01["input"],
) {
  const projectedMessage = requireModelEgressText(
    OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
    input.message,
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
    input.canonical_project_id,
    256,
  );
  const stateItems = readModelEgressArray(
    OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
    input.current_state,
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

export function buildObserveSystemPrompt() {
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

export function parseObserveOutput(outputText: string) {
  return validateCompilerOutput(JSON.parse(outputText));
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

export const observeResponseSchema = {
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
