import { createHash, randomUUID } from "node:crypto";

import { buildStateBrief } from "@/lib/state/brief";
import {
  invokePlannerModelGatewayV01,
  type PlannerModelGatewayDependenciesV01,
} from "@/lib/vnext/model-gateway/model-gateway";
import {
  MODEL_INVOCATION_ENVELOPE_VERSION_V01,
  PLANNER_MODEL_GATEWAY_PURPOSE_V01,
  type ModelGatewayBudgetV01,
  type ModelGatewayExecutionModeV01,
  type ModelGatewayPolicyInputV01,
  type ModelInvocationReceiptV02,
  type PlannerModelInvocationEnvelopeV01,
  type PlannerRecommendationV01,
} from "@/lib/vnext/model-gateway/contracts";

export { PLANNER_MODEL_EGRESS_LIMITS } from "@/lib/vnext/model-gateway/openai/planner-codec";

const CANONICAL_WORKSPACE_PATTERN =
  /^workspace:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CANONICAL_PROJECT_PATTERN =
  /^project:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_MESSAGE_LENGTH = 8_000;

export type PlanRequest = {
  workspace_id: string;
  project_id: string;
  expected_active_project_id: string;
  expected_active_selection_revision: number;
  message: string;
  project_root?: {
    path_flavor: "posix" | "win32";
    normalized_path: string;
  };
  execution_mode: ModelGatewayExecutionModeV01;
};

export type PlannerRecommendation = PlannerRecommendationV01;

export type PlanResponse = {
  workspace_id: string;
  project_id: string;
  scope: string;
  planner: "openai" | "mock";
  message: string;
  recommendations: PlannerRecommendation[];
  agent_instructions: string[];
  model_invocation_receipt: ModelInvocationReceiptV02;
};

export type PlannerGatewayDependenciesV01 = Omit<
  PlannerModelGatewayDependenciesV01,
  "deterministic_execute"
> &
  Partial<Pick<PlannerModelGatewayDependenciesV01, "deterministic_execute">>;

export function validatePlanRequest(body: unknown): PlanRequest {
  if (!isRecord(body)) {
    throw new Error("Request body must be a JSON object.");
  }
  const workspaceId = requireCanonicalId(
    body.workspace_id,
    CANONICAL_WORKSPACE_PATTERN,
    "workspace_id",
  );
  const projectId = requireCanonicalId(
    body.project_id,
    CANONICAL_PROJECT_PATTERN,
    "project_id",
  );
  const expectedActiveProjectId = requireCanonicalId(
    body.expected_active_project_id,
    CANONICAL_PROJECT_PATTERN,
    "expected_active_project_id",
  );
  if (
    typeof body.expected_active_selection_revision !== "number" ||
    !Number.isSafeInteger(body.expected_active_selection_revision) ||
    body.expected_active_selection_revision < 1
  ) {
    throw new Error("expected_active_selection_revision is required.");
  }
  if (typeof body.message !== "string" || body.message.trim().length === 0) {
    throw new Error("message is required.");
  }
  const message = body.message.trim();
  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`);
  }
  const executionMode = body.execution_mode ?? "live";
  if (executionMode !== "live" && executionMode !== "deterministic") {
    throw new Error("execution_mode is unsupported.");
  }

  return {
    workspace_id: workspaceId,
    project_id: projectId,
    expected_active_project_id: expectedActiveProjectId,
    expected_active_selection_revision: body.expected_active_selection_revision,
    message,
    ...(body.project_root !== undefined
      ? { project_root: validateProjectRoot(body.project_root) }
      : {}),
    execution_mode: executionMode,
  };
}

export async function buildPlan(
  request: PlanRequest,
  options: {
    cancellation_signal?: AbortSignal;
    gateway_dependencies?: PlannerGatewayDependenciesV01;
    create_uuid?: () => string;
  } = {},
): Promise<PlanResponse> {
  const brief = buildStateBrief(request.project_id);
  const executionMode = request.execution_mode;
  const gatewayDependencies = options.gateway_dependencies ?? {};
  const result = await invokePlannerModelGatewayV01(
    buildPlannerModelInvocationEnvelopeV01({
      invocation_id: `model-invocation:${(options.create_uuid ?? randomUUID)()}`,
      workspace_id: request.workspace_id,
      project_id: request.project_id,
      message: request.message,
      brief,
      execution_mode: executionMode,
      policy: {
        invocation_origin: "interactive",
        expected_active_project_id: request.expected_active_project_id,
        expected_active_selection_revision:
          request.expected_active_selection_revision,
      },
      budget: {
        max_input_bytes: 98_304,
        max_output_tokens: 2_048,
        max_provider_calls: executionMode === "live" ? 1 : 0,
      },
      timeout_ms: 30_000,
      cancellation_signal:
        options.cancellation_signal ?? new AbortController().signal,
      project_root: request.project_root,
    }),
    {
      ...gatewayDependencies,
      deterministic_execute:
        gatewayDependencies.deterministic_execute ??
        ((input) => buildMockRecommendations(input.brief)),
    },
  );

  return {
    workspace_id: request.workspace_id,
    project_id: request.project_id,
    scope: request.project_id,
    planner: result.planner,
    message: request.message,
    recommendations: result.recommendations,
    agent_instructions: brief.agent_instructions,
    model_invocation_receipt: result.model_invocation_receipt,
  };
}

export function buildPlannerModelInvocationEnvelopeV01(input: {
  invocation_id: string;
  workspace_id: string;
  project_id: string;
  message: string;
  brief: ReturnType<typeof buildStateBrief>;
  execution_mode: ModelGatewayExecutionModeV01;
  policy: ModelGatewayPolicyInputV01;
  budget: ModelGatewayBudgetV01;
  timeout_ms: number;
  cancellation_signal: AbortSignal;
  project_root?: PlanRequest["project_root"];
}): PlannerModelInvocationEnvelopeV01 {
  return {
    envelope_version: MODEL_INVOCATION_ENVELOPE_VERSION_V01,
    invocation_id: input.invocation_id,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    purpose: PLANNER_MODEL_GATEWAY_PURPOSE_V01,
    data_classification: "private",
    provenance_refs: [
      `sha256:${createHash("sha256").update(input.message, "utf8").digest("hex")}`,
    ],
    privacy: {
      provider_egress: input.execution_mode === "live" ? "allow" : "deny",
      retention_class: "none",
    },
    budget: input.budget,
    timeout_ms: input.timeout_ms,
    cancellation: { signal: input.cancellation_signal },
    execution_mode: input.execution_mode,
    policy: input.policy,
    ...(input.project_root ? { project_root: input.project_root } : {}),
    input: {
      input_kind: PLANNER_MODEL_GATEWAY_PURPOSE_V01,
      message: input.message,
      brief: input.brief,
    },
  };
}

export function buildMockRecommendations(
  brief: ReturnType<typeof buildStateBrief>,
): PlannerRecommendation[] {
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

function validateProjectRoot(
  value: unknown,
): NonNullable<PlanRequest["project_root"]> {
  if (!isRecord(value)) throw new Error("project_root must be an object.");
  if (value.path_flavor !== "posix" && value.path_flavor !== "win32") {
    throw new Error("project_root.path_flavor is unsupported.");
  }
  if (
    typeof value.normalized_path !== "string" ||
    value.normalized_path.length < 1 ||
    value.normalized_path.length > 8_192 ||
    value.normalized_path.includes("\0")
  ) {
    throw new Error("project_root.normalized_path is invalid.");
  }
  return {
    path_flavor: value.path_flavor,
    normalized_path: value.normalized_path,
  };
}

function requireCanonicalId(
  value: unknown,
  pattern: RegExp,
  field: string,
) {
  if (
    typeof value !== "string" ||
    !pattern.test(value) ||
    value === "project:augnes"
  ) {
    throw new Error(`${field} is required.`);
  }
  return value.toLowerCase();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
