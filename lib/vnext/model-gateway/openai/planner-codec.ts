import {
  assertModelEgressCollectionCount,
  cloneBoundedModelEgressJson,
  readModelEgressArray,
  readModelEgressField,
  refuseModelEgress,
  requireModelEgressRecord,
  requireModelEgressText,
  serializeModelEgressJson,
} from "@/lib/model-egress/bounded-model-payload";
import {
  PLANNER_MODEL_GATEWAY_PURPOSE_V01,
  type PlannerModelInvocationEnvelopeV01,
  type PlannerRecommendationV01,
} from "@/lib/vnext/model-gateway/contracts";

export const PLANNER_MODEL_EGRESS_LIMITS = Object.freeze({
  messageBytes: 8_192,
  stateItems: 64,
  stateBucketItems: 32,
  tensionItems: 16,
  proposalItems: 16,
  sourceItemBytes: 4_096,
  dynamicBytes: 65_536,
  finalRequestBytes: 98_304,
  responseBytes: 65_536,
  structuralDepth: 8,
  structuralNodes: 2_048,
});

export function projectPlannerModelMaterial(
  input: { canonical_project_id: string } & PlannerModelInvocationEnvelopeV01["input"],
) {
  const record = requireModelEgressRecord(
    PLANNER_MODEL_GATEWAY_PURPOSE_V01,
    input.brief,
  );
  const briefScope = requireModelEgressText(
    PLANNER_MODEL_GATEWAY_PURPOSE_V01,
    readModelEgressField(PLANNER_MODEL_GATEWAY_PURPOSE_V01, record, "scope"),
    256,
  );
  if (briefScope !== input.canonical_project_id) {
    throwPlannerMalformed();
  }
  const activeState = projectPlannerList(
    readModelEgressField(PLANNER_MODEL_GATEWAY_PURPOSE_V01, record, "active_state"),
    PLANNER_MODEL_EGRESS_LIMITS.stateBucketItems,
    (value) => projectPlannerState(value, input.canonical_project_id),
  );
  const futureState = projectPlannerList(
    readModelEgressField(PLANNER_MODEL_GATEWAY_PURPOSE_V01, record, "future_state"),
    PLANNER_MODEL_EGRESS_LIMITS.stateBucketItems,
    (value) => projectPlannerState(value, input.canonical_project_id),
  );
  const completedState = projectPlannerList(
    readModelEgressField(PLANNER_MODEL_GATEWAY_PURPOSE_V01, record, "completed_state"),
    PLANNER_MODEL_EGRESS_LIMITS.stateBucketItems,
    (value) => projectPlannerState(value, input.canonical_project_id),
  );
  const deprecatedState = projectPlannerList(
    readModelEgressField(PLANNER_MODEL_GATEWAY_PURPOSE_V01, record, "deprecated_state"),
    PLANNER_MODEL_EGRESS_LIMITS.stateBucketItems,
    (value) => projectPlannerState(value, input.canonical_project_id),
  );
  assertModelEgressCollectionCount(
    PLANNER_MODEL_GATEWAY_PURPOSE_V01,
    activeState.length +
      futureState.length +
      completedState.length +
      deprecatedState.length,
    PLANNER_MODEL_EGRESS_LIMITS.stateItems,
  );

  return {
    project_id: requireModelEgressText(
      PLANNER_MODEL_GATEWAY_PURPOSE_V01,
      input.canonical_project_id,
      256,
    ),
    message: requireModelEgressText(
      PLANNER_MODEL_GATEWAY_PURPOSE_V01,
      input.message,
      PLANNER_MODEL_EGRESS_LIMITS.messageBytes,
    ),
    brief: {
      scope: briefScope,
      active_state: activeState,
      future_state: futureState,
      completed_state: completedState,
      deprecated_state: deprecatedState,
      open_tensions: projectPlannerList(
        readModelEgressField(
          PLANNER_MODEL_GATEWAY_PURPOSE_V01,
          record,
          "open_tensions",
        ),
        PLANNER_MODEL_EGRESS_LIMITS.tensionItems,
        (value) => projectPlannerTension(value, input.canonical_project_id),
      ),
      pending_proposals: projectPlannerList(
        readModelEgressField(
          PLANNER_MODEL_GATEWAY_PURPOSE_V01,
          record,
          "pending_proposals",
        ),
        PLANNER_MODEL_EGRESS_LIMITS.proposalItems,
        (value) => projectPlannerProposal(value, input.canonical_project_id),
      ),
    },
  };
}

function projectPlannerList<T>(
  value: unknown,
  maximum: number,
  project: (item: unknown) => T,
) {
  return readModelEgressArray(
    PLANNER_MODEL_GATEWAY_PURPOSE_V01,
    value,
    maximum,
  ).map((item) => {
    const projected = project(item);
    serializeModelEgressJson(
      PLANNER_MODEL_GATEWAY_PURPOSE_V01,
      projected,
      PLANNER_MODEL_EGRESS_LIMITS.sourceItemBytes,
    );
    return projected;
  });
}

function projectPlannerState(value: unknown, canonicalProjectId: string) {
  const record = requireModelEgressRecord(
    PLANNER_MODEL_GATEWAY_PURPOSE_V01,
    value,
  );
  requireMatchingOptionalScope(record, canonicalProjectId);
  return {
    state_key: plannerText(record, "state_key", 512),
    value: plannerJson(record, "value"),
    temporal_scope: plannerText(record, "temporal_scope", 128),
    valid_from: plannerNullableText(record, "valid_from", 128),
    valid_until: plannerNullableText(record, "valid_until", 128),
    stability: plannerText(record, "stability", 128),
    change_type: plannerText(record, "change_type", 128),
  };
}

function projectPlannerTension(value: unknown, canonicalProjectId: string) {
  const record = requireModelEgressRecord(
    PLANNER_MODEL_GATEWAY_PURPOSE_V01,
    value,
  );
  requireMatchingOptionalScope(record, canonicalProjectId);
  return {
    state_key: plannerNullableText(record, "state_key", 512),
    title: plannerText(record, "title", 1_024),
    description: plannerText(record, "description", 4_096),
    status: plannerText(record, "status", 128),
    severity: plannerText(record, "severity", 128),
  };
}

function projectPlannerProposal(value: unknown, canonicalProjectId: string) {
  const record = requireModelEgressRecord(
    PLANNER_MODEL_GATEWAY_PURPOSE_V01,
    value,
  );
  requireMatchingOptionalScope(record, canonicalProjectId);
  return {
    state_key: plannerText(record, "state_key", 512),
    before_value: plannerJson(record, "before_value"),
    after_value: plannerJson(record, "after_value"),
    operation: plannerText(record, "operation", 128),
    temporal_scope: plannerText(record, "temporal_scope", 128),
    valid_from: plannerNullableText(record, "valid_from", 128),
    valid_until: plannerNullableText(record, "valid_until", 128),
    stability: plannerText(record, "stability", 128),
    change_type: plannerText(record, "change_type", 128),
    reason: plannerNullableText(record, "reason", 4_096),
    status: plannerText(record, "status", 128),
  };
}

function requireMatchingOptionalScope(
  record: Record<string, unknown>,
  canonicalProjectId: string,
) {
  if (!Object.hasOwn(record, "scope")) return;
  if (
    requireModelEgressText(
      PLANNER_MODEL_GATEWAY_PURPOSE_V01,
      readModelEgressField(PLANNER_MODEL_GATEWAY_PURPOSE_V01, record, "scope"),
      256,
    ) !== canonicalProjectId
  ) {
    throwPlannerMalformed();
  }
}

function plannerText(record: Record<string, unknown>, key: string, maximum: number) {
  return requireModelEgressText(
    PLANNER_MODEL_GATEWAY_PURPOSE_V01,
    readModelEgressField(PLANNER_MODEL_GATEWAY_PURPOSE_V01, record, key),
    maximum,
  );
}

function plannerNullableText(
  record: Record<string, unknown>,
  key: string,
  maximum: number,
) {
  const value = readModelEgressField(
    PLANNER_MODEL_GATEWAY_PURPOSE_V01,
    record,
    key,
  );
  return value === null
    ? null
    : requireModelEgressText(
        PLANNER_MODEL_GATEWAY_PURPOSE_V01,
        value,
        maximum,
      );
}

function plannerJson(record: Record<string, unknown>, key: string) {
  return cloneBoundedModelEgressJson(
    PLANNER_MODEL_GATEWAY_PURPOSE_V01,
    readModelEgressField(PLANNER_MODEL_GATEWAY_PURPOSE_V01, record, key),
    {
      maximumDepth: PLANNER_MODEL_EGRESS_LIMITS.structuralDepth,
      maximumNodes: PLANNER_MODEL_EGRESS_LIMITS.structuralNodes,
    },
  );
}

function throwPlannerMalformed(): never {
  refuseModelEgress(
    PLANNER_MODEL_GATEWAY_PURPOSE_V01,
    "model_egress_payload_malformed",
    1,
    0,
  );
}

export function buildPlannerSystemPrompt() {
  return [
    "You are the Augnes state-grounded planner.",
    "Recommend next actions from committed temporal state only.",
    "Pending proposals are suggestions, not committed truth.",
    "Prefer local tools when they directly satisfy demo readiness.",
  ].join("\n");
}

export function parsePlannerOutput(outputText: string): PlannerRecommendationV01[] {
  const output = JSON.parse(outputText) as unknown;
  if (!isRecord(output) || !Array.isArray(output.recommendations)) {
    throw new Error("planner_output_invalid");
  }
  if (output.recommendations.length > 5) throw new Error("planner_output_invalid");

  return output.recommendations.map((item) => {
    if (!isRecord(item)) throw new Error("planner_output_invalid");
    const groundedStateKeys = item.grounded_state_keys;
    if (!Array.isArray(groundedStateKeys) || groundedStateKeys.length > 16) {
      throw new Error("planner_output_invalid");
    }
    return {
      title: outputTextField(item, "title", 512),
      rationale: outputTextField(item, "rationale", 4_096),
      tool_name:
        item.tool_name === null ? null : requirePlannerToolName(item.tool_name),
      priority: requirePlannerPriority(item.priority),
      grounded_state_keys: groundedStateKeys.map((value) =>
        outputStandaloneText(value, 512),
      ),
    };
  });
}

function outputTextField(
  record: Record<string, unknown>,
  key: string,
  maximum: number,
) {
  return outputStandaloneText(record[key], maximum);
}

function outputStandaloneText(value: unknown, maximum: number) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("planner_output_invalid");
  }
  const text = value.trim();
  if (Buffer.byteLength(text, "utf8") > maximum) {
    throw new Error("planner_output_invalid");
  }
  return text;
}

function requirePlannerToolName(value: unknown) {
  if (
    value === "create_readme_checklist" ||
    value === "create_security_checklist" ||
    value === "create_demo_script"
  ) {
    return value;
  }
  throw new Error("planner_output_invalid");
}

function requirePlannerPriority(value: unknown): PlannerRecommendationV01["priority"] {
  if (value === "now" || value === "next" || value === "later") return value;
  throw new Error("planner_output_invalid");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const plannerResponseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    recommendations: {
      type: "array",
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          rationale: { type: "string" },
          tool_name: {
            anyOf: [
              {
                type: "string",
                enum: [
                  "create_readme_checklist",
                  "create_security_checklist",
                  "create_demo_script",
                ],
              },
              { type: "null" },
            ],
          },
          priority: { type: "string", enum: ["now", "next", "later"] },
          grounded_state_keys: {
            type: "array",
            maxItems: 16,
            items: { type: "string" },
          },
        },
        required: [
          "title",
          "rationale",
          "tool_name",
          "priority",
          "grounded_state_keys",
        ],
      },
    },
  },
  required: ["recommendations"],
};
