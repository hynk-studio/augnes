import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const PIPELINE_JSON_BEGIN_MARKER = "BEGIN_AUGNES_CODEX_CLOSEOUT_PIPELINE_JSON";
const PIPELINE_JSON_END_MARKER = "END_AUGNES_CODEX_CLOSEOUT_PIPELINE_JSON";
const ACTION_PLAN_JSON_BEGIN_MARKER = "BEGIN_AUGNES_CODEX_ACTION_PLAN_JSON";
const ACTION_PLAN_JSON_END_MARKER = "END_AUGNES_CODEX_ACTION_PLAN_JSON";

const AUTHORITY_BOUNDARY =
  "The helper produces a local policy-gated action plan only. It does not execute, post, approve, merge, publish, call providers, call GitHub, create evidence, create proof, mutate Augnes, or commit/reject state. It can be used by human-assisted or delegated Codex workflows. It does not grant or exercise delegated authority. Any actuation requires a separate authority gate and separate implementation.";

const DELEGATED_NOTE =
  "Delegated note: this plan may be consumed by a delegated Codex workflow, but it does not perform posting, approval, merge, publication, provider calls, GitHub calls, or Augnes state mutation.";

const SUPPORTED_ACTIONS = [
  "prepare_pr_body",
  "request_human_review",
  "run_missing_checks",
  "inspect_read_only_refs",
  "record_more_evidence",
  "record_completion",
  "create_pr_comment",
  "create_pr_review",
  "approve_pr",
  "merge_pr",
  "publish_external",
  "mutate_augnes_state",
  "commit_or_reject_state",
  "call_provider",
  "call_github",
  "delegated_handoff",
] as const;

const DEFAULT_REQUESTED_ACTIONS: SupportedAction[] = [
  "prepare_pr_body",
  "request_human_review",
  "delegated_handoff",
];

const DEFAULT_ALLOWED_ACTIONS: SupportedAction[] = [
  "prepare_pr_body",
  "request_human_review",
  "run_missing_checks",
  "inspect_read_only_refs",
  "delegated_handoff",
];

const DEFAULT_FORBIDDEN_ACTIONS: SupportedAction[] = [
  "create_pr_comment",
  "create_pr_review",
  "approve_pr",
  "merge_pr",
  "publish_external",
  "mutate_augnes_state",
  "commit_or_reject_state",
  "call_provider",
  "call_github",
  "record_more_evidence",
  "record_completion",
];

const SEPARATE_AUTHORITY_GATE_ACTIONS = new Set<SupportedAction>([
  "record_more_evidence",
  "record_completion",
  "create_pr_comment",
  "create_pr_review",
  "approve_pr",
  "merge_pr",
  "publish_external",
  "mutate_augnes_state",
  "commit_or_reject_state",
  "call_provider",
  "call_github",
]);

type SupportedAction = (typeof SUPPORTED_ACTIONS)[number];
type ActionDecision = "allow" | "needs_review" | "deny";
type OperationMode = "human_assisted" | "delegated";
type OutputMode = "summary" | "json" | "both";
type PipelineStatus = "pass" | "needs_review" | "fail";
type PlanStatus = "pass" | "needs_review" | "fail";

type PipelineResult = {
  helper: "codex:closeout-pipeline";
  version: unknown;
  operation_mode: OperationMode;
  delegated_consumption: boolean;
  pipeline_status: PipelineStatus;
  scope: string;
  work_id: string | null;
  related_pr: string | null;
  closeout_check: Record<string, unknown>;
  closeout: {
    forbidden_actions?: unknown;
    [key: string]: unknown;
  };
  recommended_next_action: string;
  authority_boundary: string;
};

type ActionPlanDecision = {
  action: string;
  decision: ActionDecision;
  reason: string;
  required_gate: string | null;
};

type ActionPlanResult = {
  helper: "codex:closeout-action-plan";
  version: 1;
  operation_mode: OperationMode;
  delegated_consumption: boolean;
  pipeline_status: PipelineStatus;
  plan_status: PlanStatus;
  scope: string;
  work_id: string | null;
  related_pr: string | null;
  requested_actions: string[];
  allowed_policy_actions: string[];
  forbidden_policy_actions: string[];
  pipeline_forbidden_actions: string[];
  action_decisions: ActionPlanDecision[];
  recommended_next_action: string;
  authority_boundary: string;
};

type ActionPlanConfig = {
  outputMode: OutputMode;
  requirePipelinePass: boolean;
  requireDelegatedModeForDelegatedActions: boolean;
  requestedActions: string[];
  allowedPolicyActions: string[];
  forbiddenPolicyActions: string[];
};

class CloseoutActionPlanError extends Error {}

function readOptionalEnv(name: string): string | undefined {
  return process.env[name];
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function readInputText(): Promise<string> {
  const inline = readOptionalEnv("CODEX_CLOSEOUT_PIPELINE_JSON");
  if (inline !== undefined) {
    if (!inline.trim()) throw new CloseoutActionPlanError("CODEX_CLOSEOUT_ACTION_PLAN_MISSING_INPUT");
    return inline;
  }

  const filePath = readOptionalEnv("CODEX_CLOSEOUT_PIPELINE_JSON_FILE");
  if (filePath !== undefined) {
    if (!filePath.trim()) throw new CloseoutActionPlanError("CODEX_CLOSEOUT_ACTION_PLAN_MISSING_INPUT");
    const content = await readFile(filePath, "utf8");
    if (!content.trim()) throw new CloseoutActionPlanError("CODEX_CLOSEOUT_ACTION_PLAN_MISSING_INPUT");
    return content;
  }

  const stdin = await readStdin();
  if (!stdin.trim()) throw new CloseoutActionPlanError("CODEX_CLOSEOUT_ACTION_PLAN_MISSING_INPUT");
  return stdin;
}

function extractJsonText(input: string): string {
  const begin = input.indexOf(PIPELINE_JSON_BEGIN_MARKER);
  const end = input.indexOf(PIPELINE_JSON_END_MARKER);
  if (begin !== -1 || end !== -1) {
    if (begin === -1 || end === -1 || end <= begin) {
      throw new CloseoutActionPlanError("CODEX_CLOSEOUT_ACTION_PLAN_INVALID_JSON");
    }

    return input.slice(begin + PIPELINE_JSON_BEGIN_MARKER.length, end).trim();
  }

  return input.trim();
}

function parsePipelineJson(input: string): unknown {
  try {
    return JSON.parse(extractJsonText(input)) as unknown;
  } catch (error) {
    if (error instanceof CloseoutActionPlanError) throw error;
    throw new CloseoutActionPlanError("CODEX_CLOSEOUT_ACTION_PLAN_INVALID_JSON");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertStringOrNull(value: unknown): asserts value is string | null {
  if (value !== null && typeof value !== "string") {
    throw new CloseoutActionPlanError("CODEX_CLOSEOUT_ACTION_PLAN_INVALID_SHAPE");
  }
}

function assertStringArray(value: unknown): asserts value is string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new CloseoutActionPlanError("CODEX_CLOSEOUT_ACTION_PLAN_INVALID_SHAPE");
  }
}

function validatePipelineShape(value: unknown): PipelineResult {
  if (!isRecord(value)) throw new CloseoutActionPlanError("CODEX_CLOSEOUT_ACTION_PLAN_INVALID_SHAPE");
  if (value.helper !== "codex:closeout-pipeline") {
    throw new CloseoutActionPlanError("CODEX_CLOSEOUT_ACTION_PLAN_INVALID_SHAPE");
  }
  if (!("version" in value)) throw new CloseoutActionPlanError("CODEX_CLOSEOUT_ACTION_PLAN_INVALID_SHAPE");
  if (
    value.pipeline_status !== "pass" &&
    value.pipeline_status !== "needs_review" &&
    value.pipeline_status !== "fail"
  ) {
    throw new CloseoutActionPlanError("CODEX_CLOSEOUT_ACTION_PLAN_INVALID_SHAPE");
  }
  if (value.operation_mode !== "human_assisted" && value.operation_mode !== "delegated") {
    throw new CloseoutActionPlanError("CODEX_CLOSEOUT_ACTION_PLAN_INVALID_SHAPE");
  }
  if (typeof value.delegated_consumption !== "boolean") {
    throw new CloseoutActionPlanError("CODEX_CLOSEOUT_ACTION_PLAN_INVALID_SHAPE");
  }
  if (!isRecord(value.closeout_check)) throw new CloseoutActionPlanError("CODEX_CLOSEOUT_ACTION_PLAN_INVALID_SHAPE");
  if (!isRecord(value.closeout)) throw new CloseoutActionPlanError("CODEX_CLOSEOUT_ACTION_PLAN_INVALID_SHAPE");
  if (typeof value.authority_boundary !== "string" || !value.authority_boundary.trim()) {
    throw new CloseoutActionPlanError("CODEX_CLOSEOUT_ACTION_PLAN_INVALID_SHAPE");
  }
  if (typeof value.recommended_next_action !== "string" || !value.recommended_next_action.trim()) {
    throw new CloseoutActionPlanError("CODEX_CLOSEOUT_ACTION_PLAN_INVALID_SHAPE");
  }
  if (typeof value.scope !== "string") throw new CloseoutActionPlanError("CODEX_CLOSEOUT_ACTION_PLAN_INVALID_SHAPE");
  assertStringOrNull(value.work_id);
  assertStringOrNull(value.related_pr);
  if (value.closeout.forbidden_actions !== undefined) assertStringArray(value.closeout.forbidden_actions);

  return value as PipelineResult;
}

function readOutputMode(): OutputMode {
  const value = process.env.CODEX_ACTION_PLAN_OUTPUT?.trim() || "both";
  if (value === "summary" || value === "json" || value === "both") return value;
  throw new CloseoutActionPlanError("CODEX_CLOSEOUT_ACTION_PLAN_INVALID_OUTPUT");
}

function readBooleanEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  const value = raw.trim();
  if (value === "true") return true;
  if (value === "false") return false;
  throw new CloseoutActionPlanError(`CODEX_CLOSEOUT_ACTION_PLAN_INVALID_BOOLEAN ${name}`);
}

function parseListEnv(name: string): string[] | undefined {
  const raw = process.env[name];
  if (raw === undefined) return undefined;

  const value = raw.trim();
  if (!value) return [];

  if (value.startsWith("[")) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(value) as unknown;
    } catch {
      throw new CloseoutActionPlanError(`CODEX_CLOSEOUT_ACTION_PLAN_INVALID_LIST_ENV ${name}`);
    }

    if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) {
      throw new CloseoutActionPlanError(`CODEX_CLOSEOUT_ACTION_PLAN_INVALID_LIST_ENV ${name}`);
    }

    return parsed.map((item) => item.trim()).filter(Boolean);
  }

  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function readConfig(): ActionPlanConfig {
  return {
    outputMode: readOutputMode(),
    requirePipelinePass: readBooleanEnv("CODEX_REQUIRE_PIPELINE_PASS", true),
    requireDelegatedModeForDelegatedActions: readBooleanEnv(
      "CODEX_REQUIRE_DELEGATED_MODE_FOR_DELEGATED_ACTIONS",
      true,
    ),
    requestedActions: parseListEnv("CODEX_REQUESTED_ACTIONS") ?? DEFAULT_REQUESTED_ACTIONS,
    allowedPolicyActions: parseListEnv("CODEX_POLICY_ALLOWED_ACTIONS") ?? DEFAULT_ALLOWED_ACTIONS,
    forbiddenPolicyActions: parseListEnv("CODEX_POLICY_FORBIDDEN_ACTIONS") ?? DEFAULT_FORBIDDEN_ACTIONS,
  };
}

function isSupportedAction(action: string): action is SupportedAction {
  return SUPPORTED_ACTIONS.includes(action as SupportedAction);
}

function planStatusForPipeline(status: PipelineStatus): PlanStatus {
  if (status === "fail") return "fail";
  if (status === "needs_review") return "needs_review";
  return "pass";
}

function decision(
  action: string,
  value: ActionDecision,
  reason: string,
  requiredGate: string | null,
): ActionPlanDecision {
  return {
    action,
    decision: value,
    reason,
    required_gate: requiredGate,
  };
}

function decideAction(
  action: string,
  pipeline: PipelineResult,
  config: ActionPlanConfig,
  forbiddenActions: Set<string>,
  allowedActions: Set<string>,
): ActionPlanDecision {
  if (!isSupportedAction(action)) {
    return decision(action, "deny", "unknown_action", "supported_action_required");
  }

  if (pipeline.pipeline_status === "fail") {
    return decision(action, "deny", "pipeline_failed", "pipeline_pass_required");
  }

  if (forbiddenActions.has(action)) {
    return decision(action, "deny", "forbidden_action", "policy_forbidden");
  }

  if (!allowedActions.has(action)) {
    return decision(action, "deny", "not_allowed_by_policy", "policy_allowed_action_required");
  }

  if (pipeline.pipeline_status === "needs_review") {
    if (SEPARATE_AUTHORITY_GATE_ACTIONS.has(action)) {
      return decision(action, "deny", "pipeline_needs_review_external_or_mutating_action", "separate_authority_gate");
    }
    if (config.requirePipelinePass || action === "delegated_handoff") {
      return decision(action, "needs_review", "pipeline_needs_review", "pipeline_pass_required");
    }

    return decision(action, "allow", "allowed_local_planning_action", null);
  }

  if (SEPARATE_AUTHORITY_GATE_ACTIONS.has(action)) {
    return decision(action, "needs_review", "separate_authority_gate_required", "separate_authority_gate");
  }

  if (action === "delegated_handoff") {
    if (
      config.requireDelegatedModeForDelegatedActions &&
      (pipeline.operation_mode !== "delegated" || !pipeline.delegated_consumption)
    ) {
      return decision(action, "needs_review", "human_operator_in_loop_required", "human_operator_in_loop");
    }
    if (pipeline.operation_mode === "human_assisted") {
      return decision(action, "needs_review", "human_operator_in_loop_required", "human_operator_in_loop");
    }

    return decision(action, "allow", "allowed_delegated_handoff_material_only", null);
  }

  return decision(action, "allow", "allowed_local_planning_action", null);
}

function buildPlan(pipeline: PipelineResult, config: ActionPlanConfig): ActionPlanResult {
  const pipelineForbiddenActions = pipeline.closeout.forbidden_actions ?? [];
  assertStringArray(pipelineForbiddenActions);

  const forbiddenActions = new Set([...config.forbiddenPolicyActions, ...pipelineForbiddenActions]);
  const allowedActions = new Set(config.allowedPolicyActions);
  const actionDecisions = config.requestedActions.map((action) =>
    decideAction(action, pipeline, config, forbiddenActions, allowedActions),
  );

  return {
    helper: "codex:closeout-action-plan",
    version: 1,
    operation_mode: pipeline.operation_mode,
    delegated_consumption: pipeline.delegated_consumption,
    pipeline_status: pipeline.pipeline_status,
    plan_status: planStatusForPipeline(pipeline.pipeline_status),
    scope: pipeline.scope,
    work_id: pipeline.work_id,
    related_pr: pipeline.related_pr,
    requested_actions: config.requestedActions,
    allowed_policy_actions: config.allowedPolicyActions,
    forbidden_policy_actions: config.forbiddenPolicyActions,
    pipeline_forbidden_actions: pipelineForbiddenActions,
    action_decisions: actionDecisions,
    recommended_next_action: pipeline.recommended_next_action,
    authority_boundary: AUTHORITY_BOUNDARY,
  };
}

function countDecisions(plan: ActionPlanResult, value: ActionDecision): number {
  return plan.action_decisions.filter((item) => item.decision === value).length;
}

function renderSummary(plan: ActionPlanResult): string {
  const lines = [
    "Codex closeout action plan",
    `operation_mode: ${plan.operation_mode}`,
    `delegated_consumption: ${plan.delegated_consumption}`,
    `pipeline_status: ${plan.pipeline_status}`,
    `plan_status: ${plan.plan_status}`,
    `scope: ${plan.scope}`,
    `work_id: ${plan.work_id ?? "Not provided."}`,
    `related_pr: ${plan.related_pr ?? "Not provided."}`,
    `requested_actions count: ${plan.requested_actions.length}`,
    `allow count: ${countDecisions(plan, "allow")}`,
    `needs_review count: ${countDecisions(plan, "needs_review")}`,
    `deny count: ${countDecisions(plan, "deny")}`,
    `recommended_next_action: ${plan.recommended_next_action}`,
    `authority boundary: ${plan.authority_boundary}`,
    DELEGATED_NOTE,
  ];

  for (const item of plan.action_decisions) {
    const gate = item.required_gate ? ` gate=${item.required_gate}` : "";
    lines.push(`- ${item.action}: ${item.decision} (${item.reason}${gate})`);
  }

  return lines.join("\n");
}

function printPlan(plan: ActionPlanResult, outputMode: OutputMode): void {
  if (outputMode === "summary") {
    console.log(renderSummary(plan));
    return;
  }

  if (outputMode === "json") {
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  console.log(renderSummary(plan));
  console.log(ACTION_PLAN_JSON_BEGIN_MARKER);
  console.log(JSON.stringify(plan, null, 2));
  console.log(ACTION_PLAN_JSON_END_MARKER);
}

async function main(): Promise<void> {
  const config = readConfig();
  const inputText = await readInputText();
  const pipeline = validatePipelineShape(parsePipelineJson(inputText));
  const plan = buildPlan(pipeline, config);
  printPlan(plan, config.outputMode);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "CODEX_CLOSEOUT_ACTION_PLAN_FAILED";
    console.error(message);
    process.exitCode = 1;
  });
}
