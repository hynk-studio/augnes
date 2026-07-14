import { buildStateBrief } from "@/lib/state/brief";
import {
  assertModelEgressCollectionCount,
  type BoundedModelTransport,
  cloneBoundedModelEgressJson,
  readModelEgressArray,
  readModelEgressField,
  requireModelEgressRecord,
  requireModelEgressText,
  serializeModelEgressJson,
} from "@/lib/model-egress/bounded-model-payload";

const DEFAULT_SCOPE = "project:augnes";
const DEFAULT_MODEL = "gpt-4.1-mini";
const PLANNER_EGRESS_PURPOSE = "planner_plan" as const;

export const PLANNER_MODEL_EGRESS_LIMITS = Object.freeze({
  messageBytes: 8_192,
  stateItems: 64,
  stateBucketItems: 32,
  tensionItems: 16,
  proposalItems: 16,
  sourceItemBytes: 4_096,
  dynamicBytes: 65_536,
  finalRequestBytes: 98_304,
  structuralDepth: 8,
  structuralNodes: 2_048,
});

export type PlannerModelTransport = BoundedModelTransport;

type PlanRequest = {
  scope: string;
  message: string;
};

type PlannerRecommendation = {
  title: string;
  rationale: string;
  tool_name: string | null;
  priority: "now" | "next" | "later";
  grounded_state_keys: string[];
};

export type PlanResponse = {
  scope: string;
  planner: "openai" | "mock";
  message: string;
  recommendations: PlannerRecommendation[];
  agent_instructions: string[];
};

export function validatePlanRequest(body: unknown): PlanRequest {
  if (!isRecord(body)) {
    throw new Error("Request body must be a JSON object.");
  }

  const scope = body.scope ?? DEFAULT_SCOPE;
  if (typeof scope !== "string" || scope.trim().length === 0) {
    throw new Error("scope is required.");
  }

  const message = body.message;
  if (typeof message !== "string" || message.trim().length === 0) {
    throw new Error("message is required.");
  }

  return {
    scope: scope.trim(),
    message: message.trim(),
  };
}

export async function buildPlan(request: PlanRequest): Promise<PlanResponse> {
  const brief = buildStateBrief(request.scope);
  return buildPlanFromBrief(
    request,
    brief,
    process.env.OPENAI_API_KEY ? sendPlannerModelRequest : null,
  );
}

async function buildPlanFromBrief(
  request: PlanRequest,
  brief: ReturnType<typeof buildStateBrief>,
  transport: PlannerModelTransport | null,
): Promise<PlanResponse> {
  if (!transport) {
    return {
      scope: request.scope,
      planner: "mock",
      message: request.message,
      recommendations: buildMockRecommendations(brief),
      agent_instructions: brief.agent_instructions,
    };
  }
  return {
    scope: request.scope,
    planner: "openai",
    message: request.message,
    recommendations: await planWithOpenAI(request.message, brief, transport),
    agent_instructions: brief.agent_instructions,
  };
}

export function buildPlanWithBriefForTest(
  request: PlanRequest,
  brief: ReturnType<typeof buildStateBrief>,
  transport: PlannerModelTransport | null,
) {
  return buildPlanFromBrief(request, brief, transport);
}

function buildMockRecommendations(brief: ReturnType<typeof buildStateBrief>) {
  const completedKeys = new Set(
    brief.completed_state.map((entry) => entry.state_key),
  );
  const activeKeys = new Set(brief.active_state.map((entry) => entry.state_key));
  const recommendations: PlannerRecommendation[] = [];

  if (!completedKeys.has("submission.readme_checklist_created")) {
    recommendations.push({
      title: "Create the README submission checklist",
      rationale:
        "The final demo needs a concrete checklist, and this action creates a local artifact plus a completion transition.",
      tool_name: "create_readme_checklist",
      priority: "now",
      grounded_state_keys: ["submission.readme_checklist_created"],
    });
  }

  if (activeKeys.has("security.no_api_keys_in_repo")) {
    recommendations.push({
      title: "Create the security checklist",
      rationale:
        "Committed state says API keys must stay out of the repo, so security verification should be explicit before demo.",
      tool_name: "create_security_checklist",
      priority: "next",
      grounded_state_keys: ["security.no_api_keys_in_repo"],
    });
  }

  recommendations.push({
    title: "Prepare the final demo script",
    rationale:
      "The current state is ready to be demonstrated through observe, commit/reject, trajectory, tools, and state brief continuity.",
    tool_name: "create_demo_script",
    priority: "next",
    grounded_state_keys: ["product.name", "implementation.stack"],
  });

  return recommendations;
}

async function planWithOpenAI(
  message: string,
  brief: ReturnType<typeof buildStateBrief>,
  transport: PlannerModelTransport = sendPlannerModelRequest,
) {
  const dynamicMaterial = projectPlannerModelMaterial(message, brief);
  const dynamicText = serializeModelEgressJson(
    PLANNER_EGRESS_PURPOSE,
    dynamicMaterial,
    PLANNER_MODEL_EGRESS_LIMITS.dynamicBytes,
  );
  const requestBody = serializeModelEgressJson(
    PLANNER_EGRESS_PURPOSE,
    {
      model: requireModelEgressText(
        PLANNER_EGRESS_PURPOSE,
        process.env.OPENAI_MODEL ?? DEFAULT_MODEL,
        128,
      ),
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: [
                "You are the Augnes state-grounded planner.",
                "Recommend next actions from committed temporal state only.",
                "Pending proposals are suggestions, not committed truth.",
                "Prefer local tools when they directly satisfy demo readiness.",
              ].join("\n"),
            },
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
          name: "augnes_plan",
          strict: true,
          schema: planSchema,
        },
      },
    },
    PLANNER_MODEL_EGRESS_LIMITS.finalRequestBytes,
  );
  const response = await transport(requestBody);

  if (!response.ok) {
    throw new Error(`OpenAI planner failed: ${response.status}`);
  }

  const payload = await response.json();
  const text = extractOutputText(payload);
  if (!text) {
    throw new Error("OpenAI planner response did not include output text.");
  }

  return validateRecommendations(JSON.parse(text));
}

export function planWithOpenAIForTest(
  message: string,
  brief: ReturnType<typeof buildStateBrief>,
  transport: PlannerModelTransport,
) {
  return planWithOpenAI(message, brief, transport);
}

async function sendPlannerModelRequest(requestBody: string) {
  return fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: requestBody,
  });
}

function projectPlannerModelMaterial(
  message: unknown,
  brief: unknown,
) {
  const record = requireModelEgressRecord(PLANNER_EGRESS_PURPOSE, brief);
  const activeState = projectPlannerList(
    readModelEgressField(PLANNER_EGRESS_PURPOSE, record, "active_state"),
    PLANNER_MODEL_EGRESS_LIMITS.stateBucketItems,
    projectPlannerState,
  );
  const futureState = projectPlannerList(
    readModelEgressField(PLANNER_EGRESS_PURPOSE, record, "future_state"),
    PLANNER_MODEL_EGRESS_LIMITS.stateBucketItems,
    projectPlannerState,
  );
  const completedState = projectPlannerList(
    readModelEgressField(PLANNER_EGRESS_PURPOSE, record, "completed_state"),
    PLANNER_MODEL_EGRESS_LIMITS.stateBucketItems,
    projectPlannerState,
  );
  const deprecatedState = projectPlannerList(
    readModelEgressField(PLANNER_EGRESS_PURPOSE, record, "deprecated_state"),
    PLANNER_MODEL_EGRESS_LIMITS.stateBucketItems,
    projectPlannerState,
  );
  assertModelEgressCollectionCount(
    PLANNER_EGRESS_PURPOSE,
    activeState.length +
      futureState.length +
      completedState.length +
      deprecatedState.length,
    PLANNER_MODEL_EGRESS_LIMITS.stateItems,
  );

  return {
    message: requireModelEgressText(
      PLANNER_EGRESS_PURPOSE,
      message,
      PLANNER_MODEL_EGRESS_LIMITS.messageBytes,
    ),
    brief: {
      scope: requireModelEgressText(
        PLANNER_EGRESS_PURPOSE,
        readModelEgressField(PLANNER_EGRESS_PURPOSE, record, "scope"),
        160,
      ),
      active_state: activeState,
      future_state: futureState,
      completed_state: completedState,
      deprecated_state: deprecatedState,
      open_tensions: projectPlannerList(
        readModelEgressField(PLANNER_EGRESS_PURPOSE, record, "open_tensions"),
        PLANNER_MODEL_EGRESS_LIMITS.tensionItems,
        projectPlannerTension,
      ),
      pending_proposals: projectPlannerList(
        readModelEgressField(
          PLANNER_EGRESS_PURPOSE,
          record,
          "pending_proposals",
        ),
        PLANNER_MODEL_EGRESS_LIMITS.proposalItems,
        projectPlannerProposal,
      ),
    },
  };
}

function projectPlannerList<T>(
  value: unknown,
  maximum: number,
  project: (item: unknown) => T,
) {
  return readModelEgressArray(PLANNER_EGRESS_PURPOSE, value, maximum).map(
    (item) => {
      const projected = project(item);
      serializeModelEgressJson(
        PLANNER_EGRESS_PURPOSE,
        projected,
        PLANNER_MODEL_EGRESS_LIMITS.sourceItemBytes,
      );
      return projected;
    },
  );
}

function projectPlannerState(value: unknown) {
  const record = requireModelEgressRecord(PLANNER_EGRESS_PURPOSE, value);
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

function projectPlannerTension(value: unknown) {
  const record = requireModelEgressRecord(PLANNER_EGRESS_PURPOSE, value);
  return {
    state_key: plannerNullableText(record, "state_key", 512),
    title: plannerText(record, "title", 1_024),
    description: plannerText(record, "description", 4_096),
    status: plannerText(record, "status", 128),
    severity: plannerText(record, "severity", 128),
  };
}

function projectPlannerProposal(value: unknown) {
  const record = requireModelEgressRecord(PLANNER_EGRESS_PURPOSE, value);
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

function plannerText(record: Record<string, unknown>, key: string, maximum: number) {
  return requireModelEgressText(
    PLANNER_EGRESS_PURPOSE,
    readModelEgressField(PLANNER_EGRESS_PURPOSE, record, key),
    maximum,
  );
}

function plannerNullableText(
  record: Record<string, unknown>,
  key: string,
  maximum: number,
) {
  const value = readModelEgressField(PLANNER_EGRESS_PURPOSE, record, key);
  return value === null
    ? null
    : requireModelEgressText(PLANNER_EGRESS_PURPOSE, value, maximum);
}

function plannerJson(record: Record<string, unknown>, key: string) {
  return cloneBoundedModelEgressJson(
    PLANNER_EGRESS_PURPOSE,
    readModelEgressField(PLANNER_EGRESS_PURPOSE, record, key),
    {
      maximumDepth: PLANNER_MODEL_EGRESS_LIMITS.structuralDepth,
      maximumNodes: PLANNER_MODEL_EGRESS_LIMITS.structuralNodes,
    },
  );
}

function validateRecommendations(output: unknown) {
  if (!isRecord(output) || !Array.isArray(output.recommendations)) {
    throw new Error("Planner output must include recommendations.");
  }

  return output.recommendations.slice(0, 5).map((item) => {
    if (!isRecord(item)) {
      throw new Error("Planner recommendation must be an object.");
    }

    return {
      title: requireString(item, "title"),
      rationale: requireString(item, "rationale"),
      tool_name:
        item.tool_name === null ? null : requireNullableToolName(item.tool_name),
      priority: requirePriority(item.priority),
      grounded_state_keys: Array.isArray(item.grounded_state_keys)
        ? item.grounded_state_keys.filter(
            (key): key is string => typeof key === "string",
          )
        : [],
    };
  });
}

function extractOutputText(payload: unknown) {
  if (!isRecord(payload)) {
    return null;
  }

  if (typeof payload.output_text === "string") {
    return payload.output_text;
  }

  if (!Array.isArray(payload.output)) {
    return null;
  }

  for (const output of payload.output) {
    if (!isRecord(output) || !Array.isArray(output.content)) {
      continue;
    }

    for (const content of output.content) {
      if (isRecord(content) && typeof content.text === "string") {
        return content.text;
      }
    }
  }

  return null;
}

function requireString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${key} must be a non-empty string.`);
  }
  return value.trim();
}

function requireNullableToolName(value: unknown) {
  if (
    value === "create_readme_checklist" ||
    value === "create_security_checklist" ||
    value === "create_demo_script"
  ) {
    return value;
  }

  throw new Error("Invalid tool_name.");
}

function requirePriority(value: unknown): PlannerRecommendation["priority"] {
  if (value === "now" || value === "next" || value === "later") {
    return value;
  }

  throw new Error("Invalid priority.");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const planSchema = {
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
