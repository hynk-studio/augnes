import {
  buildOpenAIOutboundPayloadV01,
  OpenAIOutboundPayloadBoundaryErrorV01,
  type OpenAIResponsesProviderPayloadV01,
} from "@/lib/model-egress/openai-outbound-payload-boundary-v0-1";
import { buildStateBrief } from "@/lib/state/brief";

const DEFAULT_SCOPE = "project:augnes";
const DEFAULT_MODEL = "gpt-4.1-mini";

type PlannerOpenAITransportResultV01 = {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
};

export type PlannerOpenAITransportV01 = (
  payload: OpenAIResponsesProviderPayloadV01,
) => Promise<PlannerOpenAITransportResultV01>;

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

  if (!process.env.OPENAI_API_KEY) {
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
    recommendations: await planWithOpenAI(request.message, brief),
    agent_instructions: brief.agent_instructions,
  };
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
  transport: PlannerOpenAITransportV01 = sendPlannerOpenAIRequest,
) {
  const model = process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
  const boundary = buildOpenAIOutboundPayloadV01({
    purpose: "planner_plan",
    model,
    scope: brief.scope,
    message,
    state: {
      active: brief.active_state,
      future: brief.future_state,
      completed: brief.completed_state,
      deprecated: brief.deprecated_state,
    },
    open_tensions: brief.open_tensions,
    pending_proposals: brief.pending_proposals,
  });
  if (boundary.status === "blocked") {
    throw new OpenAIOutboundPayloadBoundaryErrorV01(boundary);
  }

  const response = await transport(boundary.provider_payload);

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

export function planWithOpenAIForTestV01(
  message: string,
  brief: ReturnType<typeof buildStateBrief>,
  transport: PlannerOpenAITransportV01,
) {
  return planWithOpenAI(message, brief, transport);
}

async function sendPlannerOpenAIRequest(
  payload: OpenAIResponsesProviderPayloadV01,
): Promise<PlannerOpenAITransportResultV01> {
  return fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
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
