import type { StateEntry, StateValue } from "@/lib/db";
import {
  CHANGE_TYPES,
  OPERATIONS,
  STABILITIES,
  TEMPORAL_SCOPES,
  validateCompilerOutput,
  type ValidatedProposal,
} from "@/lib/observe/proposal-contract";
import {
  invokeObserveModelGatewayV01,
  type ObserveModelGatewayDependenciesV01,
} from "@/lib/vnext/model-gateway/model-gateway";
import {
  MODEL_INVOCATION_ENVELOPE_VERSION_V01,
  OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
  type ModelGatewayExecutionModeV01,
} from "@/lib/vnext/model-gateway/contracts";

export {
  CHANGE_TYPES,
  OPERATIONS,
  STABILITIES,
  TEMPORAL_SCOPES,
  validateCompilerOutput,
  type ValidatedProposal,
};

export type ObserveRequest = {
  workspace_id: string;
  project_id: string;
  expected_active_project_id: string;
  expected_active_selection_revision: number;
  message: string;
  session_id?: string;
  project_root?: {
    path_flavor: "posix" | "win32";
    normalized_path: string;
  };
  execution_mode: ModelGatewayExecutionModeV01;
};

export type ObserveCompilerGatewayDependenciesV01 = Omit<
  ObserveModelGatewayDependenciesV01,
  "deterministic_execute"
> &
  Partial<Pick<ObserveModelGatewayDependenciesV01, "deterministic_execute">>;

type UnknownRecord = Record<string, unknown>;

const MAX_MESSAGE_LENGTH = 8_000;
const CANONICAL_WORKSPACE_PATTERN =
  /^workspace:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CANONICAL_PROJECT_PATTERN =
  /^project:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateObserveRequest(body: unknown): ObserveRequest {
  if (!isRecord(body)) {
    throw new Error("Request body must be a JSON object.");
  }

  const rawMessage = body.message ?? body.user_message;
  if (typeof rawMessage !== "string" || rawMessage.trim().length === 0) {
    throw new Error("message is required.");
  }
  const message = rawMessage.trim();
  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`);
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

  const sessionId = body.session_id;
  if (
    sessionId !== undefined &&
    (typeof sessionId !== "string" || !isValidIdentifier(sessionId))
  ) {
    throw new Error("session_id must be a safe identifier string when provided.");
  }

  const executionMode = body.execution_mode ?? "live";
  if (executionMode !== "live" && executionMode !== "deterministic") {
    throw new Error("execution_mode is unsupported.");
  }

  return {
    workspace_id: workspaceId,
    project_id: projectId,
    expected_active_project_id: expectedActiveProjectId,
    expected_active_selection_revision:
      body.expected_active_selection_revision,
    message,
    ...(sessionId ? { session_id: sessionId } : {}),
    ...(body.project_root !== undefined
      ? { project_root: validateProjectRoot(body.project_root) }
      : {}),
    execution_mode: executionMode,
  };
}

export async function compileTemporalDeltaProposals({
  invocationId,
  workspaceId,
  projectId,
  expectedActiveProjectId,
  expectedActiveSelectionRevision,
  message,
  currentState,
  provenanceRefs,
  projectRoot,
  executionMode = "live",
  cancellationSignal,
  gatewayDependencies = {},
}: {
  invocationId: string;
  workspaceId: string;
  projectId: string;
  expectedActiveProjectId: string;
  expectedActiveSelectionRevision: number;
  message: string;
  currentState: StateEntry[];
  provenanceRefs: string[];
  projectRoot?: ObserveRequest["project_root"];
  executionMode?: ModelGatewayExecutionModeV01;
  cancellationSignal: AbortSignal;
  gatewayDependencies?: ObserveCompilerGatewayDependenciesV01;
}) {
  return invokeObserveModelGatewayV01(
    {
      envelope_version: MODEL_INVOCATION_ENVELOPE_VERSION_V01,
      invocation_id: invocationId,
      workspace_id: workspaceId,
      project_id: projectId,
      purpose: OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
      data_classification: "private",
      provenance_refs: provenanceRefs,
      privacy: {
        provider_egress: executionMode === "live" ? "allow" : "deny",
        retention_class: "none",
      },
      budget: {
        max_input_bytes: 98_304,
        max_output_tokens: 2_048,
        max_provider_calls: executionMode === "live" ? 1 : 0,
      },
      timeout_ms: 30_000,
      cancellation: { signal: cancellationSignal },
      execution_mode: executionMode,
      policy: {
        invocation_origin: "interactive",
        expected_active_project_id: expectedActiveProjectId,
        expected_active_selection_revision: expectedActiveSelectionRevision,
      },
      ...(projectRoot ? { project_root: projectRoot } : {}),
      input: {
        input_kind: OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
        message,
        current_state: currentState,
      },
    },
    {
      ...gatewayDependencies,
      deterministic_execute:
        gatewayDependencies.deterministic_execute ??
        ((input) => buildMockProposals(input.message, input.current_state)),
    },
  );
}

export function buildMockProposals(
  message: string,
  currentState: StateEntry[],
): ValidatedProposal[] {
  const canonicalProposals = buildCanonicalMockProposals(message, currentState);
  if (canonicalProposals.length > 0) return canonicalProposals;

  return [
    buildMockProposal({
      stateKey: selectMockStateKey(message),
      afterValue: message,
      temporalScope: selectMockTemporalScope(message),
      stability: "tentative",
      currentState,
      reason: "Deterministic no-model Observe proposal.",
    }),
  ];
}

function buildCanonicalMockProposals(
  message: string,
  currentState: StateEntry[],
) {
  const lower = message.toLowerCase();
  const proposals: ValidatedProposal[] = [];

  if (lower.includes("augnes")) {
    proposals.push(
      buildMockProposal({
        stateKey: "product.name",
        afterValue: "Augnes",
        temporalScope: "current_project",
        stability: "active",
        currentState,
        reason: "User named the product Augnes.",
      }),
    );
  }
  if (
    lower.includes("next.js") ||
    lower.includes("sqlite") ||
    lower.includes("openai api")
  ) {
    proposals.push(
      buildMockProposal({
        stateKey: "implementation.stack",
        afterValue: "Next.js + SQLite + OpenAI API",
        temporalScope: "current_project",
        stability: "active",
        currentState,
        reason: "User specified the implementation stack.",
      }),
    );
  }
  if (
    lower.includes("chatgpt app") ||
    (lower.includes("chatgpt") &&
      (lower.includes("later") || message.includes("나중")))
  ) {
    proposals.push(
      buildMockProposal({
        stateKey: "integration.chatgpt_app",
        afterValue: "planned_after_challenge",
        temporalScope: "future_phase",
        stability: "tentative",
        changeType: "future_intent",
        currentState,
        reason: "User deferred ChatGPT App integration to a later phase.",
      }),
    );
  }
  if (lower.includes("readme")) {
    proposals.push(
      buildMockProposal({
        stateKey: "submission.requires_readme",
        afterValue: true,
        temporalScope: "current_project",
        stability: "tentative",
        currentState,
        reason: "User identified README work as required before submission.",
      }),
    );
  }
  if (lower.includes("screenshots") || message.includes("스크린샷")) {
    proposals.push(
      buildMockProposal({
        stateKey: "submission.requires_screenshots",
        afterValue: true,
        temporalScope: "current_project",
        stability: "tentative",
        currentState,
        reason: "User identified screenshots as required before submission.",
      }),
    );
  }
  if (
    lower.includes("api key") ||
    lower.includes("api keys") ||
    lower.includes("secret") ||
    lower.includes("no api keys")
  ) {
    proposals.push(
      buildMockProposal({
        stateKey: "security.no_api_keys_in_repo",
        afterValue: true,
        temporalScope: "current_project",
        stability: "stable",
        currentState,
        reason: "User prioritized keeping API keys out of the repository.",
      }),
    );
  }
  return proposals;
}

function buildMockProposal({
  stateKey,
  afterValue,
  temporalScope,
  stability,
  currentState,
  reason,
  changeType,
}: {
  stateKey: string;
  afterValue: StateValue;
  temporalScope: ValidatedProposal["temporal_scope"];
  stability: ValidatedProposal["stability"];
  currentState: StateEntry[];
  reason: string;
  changeType?: ValidatedProposal["change_type"];
}): ValidatedProposal {
  const currentEntry = currentState.find((entry) => entry.state_key === stateKey);
  return {
    state_key: stateKey,
    before_value: currentEntry?.value ?? "unknown",
    after_value: afterValue,
    operation: currentEntry ? "update" : "set",
    temporal_scope: temporalScope,
    valid_from: null,
    valid_until: null,
    stability,
    change_type: changeType ?? (currentEntry ? "refinement" : "new_state"),
    reason,
  };
}

function selectMockStateKey(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("api key") || lower.includes("secret")) {
    return "security.no_api_keys_in_repo";
  }
  if (lower.includes("deadline")) return "timeline.deadline_note";
  if (lower.includes("stack") || lower.includes("sqlite")) {
    return "implementation.stack";
  }
  return "observations.latest_user_message";
}

function selectMockTemporalScope(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("later") || lower.includes("future")) return "future_phase";
  if (lower.includes("session")) return "current_session";
  return "current_task";
}

function validateProjectRoot(value: unknown): ObserveRequest["project_root"] {
  if (!isRecord(value)) throw new Error("project_root is invalid.");
  const pathFlavor = value.path_flavor;
  const normalizedPath = value.normalized_path;
  if (
    (pathFlavor !== "posix" && pathFlavor !== "win32") ||
    typeof normalizedPath !== "string" ||
    normalizedPath.length < 1 ||
    normalizedPath.length > 8_192 ||
    normalizedPath.includes("\0")
  ) {
    throw new Error("project_root is invalid.");
  }
  return { path_flavor: pathFlavor, normalized_path: normalizedPath };
}

function requireCanonicalId(value: unknown, pattern: RegExp, field: string) {
  if (typeof value !== "string" || !pattern.test(value)) {
    throw new Error(`${field} must be a canonical identity.`);
  }
  return value.toLowerCase();
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidIdentifier(value: string) {
  return /^[A-Za-z0-9:._-]{1,160}$/.test(value);
}
