import { createHash, randomUUID } from "node:crypto";

import { buildTemporalPreviewContext } from "@/lib/temporal-interpretation/context";
import { validateTemporalPreviewGuardrails } from "@/lib/temporal-interpretation/guardrails";
import { buildMockTemporalPreview } from "@/lib/temporal-interpretation/mock";
import {
  type TemporalPreviewContext,
  type TemporalPreviewResponse,
} from "@/lib/temporal-interpretation/types";
import {
  invokeTemporalModelGatewayV01,
  type TemporalModelGatewayDependenciesV01,
} from "@/lib/vnext/model-gateway/model-gateway";
import {
  MODEL_INVOCATION_ENVELOPE_VERSION_V01,
  TEMPORAL_MODEL_GATEWAY_PURPOSE_V01,
  type ModelGatewayExecutionModeV01,
} from "@/lib/vnext/model-gateway/contracts";

const CANONICAL_WORKSPACE_PATTERN =
  /^workspace:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CANONICAL_PROJECT_PATTERN =
  /^project:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type TemporalPreviewRequest = {
  workspace_id: string;
  project_id: string;
  expected_active_project_id: string;
  expected_active_selection_revision: number;
  context?: TemporalPreviewContext;
  project_root?: {
    path_flavor: "posix" | "win32";
    normalized_path: string;
  };
  execution_mode: ModelGatewayExecutionModeV01;
};

export type TemporalGatewayDependenciesV01 = Omit<
  TemporalModelGatewayDependenciesV01,
  "deterministic_execute"
> &
  Partial<Pick<TemporalModelGatewayDependenciesV01, "deterministic_execute">>;

export function validateTemporalPreviewRequest(
  body: unknown,
): TemporalPreviewRequest {
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
  if (body.context !== undefined && !isRecord(body.context)) {
    throw new Error("context must be an object when provided.");
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
    ...(body.context
      ? { context: body.context as TemporalPreviewContext }
      : {}),
    ...(body.project_root !== undefined
      ? { project_root: validateProjectRoot(body.project_root) }
      : {}),
    execution_mode: executionMode,
  };
}

export async function buildTemporalInterpretationPreview(
  request: TemporalPreviewRequest,
  options: {
    cancellation_signal?: AbortSignal;
    gateway_dependencies?: TemporalGatewayDependenciesV01;
    create_uuid?: () => string;
  } = {},
): Promise<TemporalPreviewResponse> {
  const context = request.context ?? buildTemporalPreviewContext(request.project_id);
  const executionMode = request.execution_mode;
  const gatewayDependencies = options.gateway_dependencies ?? {};
  const result = await invokeTemporalModelGatewayV01(
    {
      envelope_version: MODEL_INVOCATION_ENVELOPE_VERSION_V01,
      invocation_id: `model-invocation:${(options.create_uuid ?? randomUUID)()}`,
      workspace_id: request.workspace_id,
      project_id: request.project_id,
      purpose: TEMPORAL_MODEL_GATEWAY_PURPOSE_V01,
      data_classification: "private",
      provenance_refs: [
        `sha256:${createHash("sha256").update(request.project_id, "utf8").digest("hex")}`,
      ],
      privacy: {
        provider_egress: executionMode === "live" ? "allow" : "deny",
        retention_class: "none",
      },
      budget: {
        max_input_bytes: 65_536,
        max_output_tokens: 4_096,
        max_provider_calls: executionMode === "live" ? 1 : 0,
      },
      timeout_ms: 30_000,
      cancellation: {
        signal: options.cancellation_signal ?? new AbortController().signal,
      },
      execution_mode: executionMode,
      policy: {
        invocation_origin: "interactive",
        expected_active_project_id: request.expected_active_project_id,
        expected_active_selection_revision:
          request.expected_active_selection_revision,
      },
      ...(request.project_root ? { project_root: request.project_root } : {}),
      input: {
        input_kind: TEMPORAL_MODEL_GATEWAY_PURPOSE_V01,
        context,
      },
    },
    {
      ...gatewayDependencies,
      deterministic_execute:
        gatewayDependencies.deterministic_execute ??
        ((input) => buildMockTemporalPreview(input.context)),
    },
  );

  const guardrails = validateTemporalPreviewGuardrails({
    context,
    preview: result.preview,
  });
  const preview = {
    ...result.preview,
    warnings: guardrails.warnings,
  };
  const boundaries = [
    "Read-only preview only.",
    "No DB schema, migration, state/proof/mailbox/publication mutation, approval, publish, retry, RuleCandidate, PromotedRule, or automatic promotion behavior.",
    "Warnings are local deterministic guardrails, not interpretive quality proof.",
  ];

  return {
    runtime: "augnes",
    workspace_id: request.workspace_id,
    project_id: request.project_id,
    scope: request.project_id,
    as_of: new Date().toISOString(),
    generator: result.generator,
    model: result.model,
    preview,
    guardrails,
    ...(result.generator === "mock_fallback"
      ? { openai_error: "Model provider invocation failed; deterministic fallback returned." }
      : {}),
    model_invocation_receipt: result.model_invocation_receipt,
    boundaries,
  };
}

function validateProjectRoot(
  value: unknown,
): NonNullable<TemporalPreviewRequest["project_root"]> {
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
