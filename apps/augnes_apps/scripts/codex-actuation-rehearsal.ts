import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const PIPELINE_JSON_BEGIN_MARKER = "BEGIN_AUGNES_CODEX_CLOSEOUT_PIPELINE_JSON";
const PIPELINE_JSON_END_MARKER = "END_AUGNES_CODEX_CLOSEOUT_PIPELINE_JSON";
const ACTION_PLAN_JSON_BEGIN_MARKER = "BEGIN_AUGNES_CODEX_ACTION_PLAN_JSON";
const ACTION_PLAN_JSON_END_MARKER = "END_AUGNES_CODEX_ACTION_PLAN_JSON";
const GATE_JSON_BEGIN_MARKER = "BEGIN_AUGNES_CODEX_ACTUATION_GATE_JSON";
const GATE_JSON_END_MARKER = "END_AUGNES_CODEX_ACTUATION_GATE_JSON";
const PREVIEW_JSON_BEGIN_MARKER = "BEGIN_AUGNES_CODEX_ACTUATION_PREVIEW_JSON";
const PREVIEW_JSON_END_MARKER = "END_AUGNES_CODEX_ACTUATION_PREVIEW_JSON";
const REHEARSAL_JSON_BEGIN_MARKER = "BEGIN_AUGNES_CODEX_ACTUATION_REHEARSAL_JSON";
const REHEARSAL_JSON_END_MARKER = "END_AUGNES_CODEX_ACTUATION_REHEARSAL_JSON";

const AUTHORITY_BOUNDARY =
  "The helper composes local action planning, local gate checking, and dry-run preview only. It does not execute actions. It does not call GitHub/OpenAI/providers. It does not call Augnes runtime routes. It does not post comments/reviews. It does not approve, merge, publish, create evidence, create proof, mutate Augnes, or commit/reject state. It does not grant authority. gate_passed and ready_for_separate_actuation are not execution. Any actuation requires a separate implementation and gate.";

const DELEGATED_NOTE =
  "Delegated note: this rehearsal may be consumed by a delegated Codex workflow, but it is dry-run-only and does not perform posting, approval, merge, publication, provider calls, GitHub calls, Augnes runtime calls, or Augnes state mutation.";

const ACTION_PLAN_PASSTHROUGH = [
  "CODEX_REQUESTED_ACTIONS",
  "CODEX_POLICY_ALLOWED_ACTIONS",
  "CODEX_POLICY_FORBIDDEN_ACTIONS",
  "CODEX_REQUIRE_PIPELINE_PASS",
  "CODEX_REQUIRE_DELEGATED_MODE_FOR_DELEGATED_ACTIONS",
] as const;

const GATE_PASSTHROUGH = [
  "CODEX_INTENDED_ACTION",
  "CODEX_AUTHORITY_GRANT_JSON",
  "CODEX_AUTHORITY_GRANT_JSON_FILE",
] as const;

const PREVIEW_PASSTHROUGH = [
  "CODEX_ACTUATION_PAYLOAD_JSON",
  "CODEX_ACTUATION_PAYLOAD_JSON_FILE",
  "CODEX_ACTUATION_PREVIEW_BODY",
  "CODEX_ACTUATION_PREVIEW_TARGET_REF",
  "CODEX_ACTUATION_PREVIEW_DRY_RUN_ID",
  "CODEX_ACTUATION_PREVIEW_INCLUDE_BODY",
  "CODEX_ACTUATION_PREVIEW_STRICT_TARGETS",
] as const;

type OutputMode = "summary" | "json" | "both";
type OperationMode = "human_assisted" | "delegated";
type PipelineStatus = "pass" | "needs_review" | "fail";
type PlanStatus = "pass" | "needs_review" | "fail";
type GateStatus = "gate_passed" | "needs_review" | "denied";
type PreviewStatus = "ready_for_separate_actuation" | "needs_review" | "blocked";
type RehearsalStatus = PreviewStatus | "failed";

type ActionPlan = {
  helper: "codex:closeout-action-plan";
  operation_mode: OperationMode;
  delegated_consumption: boolean;
  pipeline_status: PipelineStatus;
  plan_status: PlanStatus;
  scope: string;
  work_id: string | null;
  related_pr: string | null;
  requested_actions: string[];
};

type ActuationGate = {
  helper: "codex:actuation-gate";
  operation_mode: OperationMode;
  delegated_consumption: boolean;
  pipeline_status: PipelineStatus;
  plan_status: PlanStatus;
  intended_action: string;
  gate_status: GateStatus;
  scope: string;
  work_id: string | null;
  related_pr: string | null;
};

type ActuationPreview = {
  helper: "codex:actuation-preview";
  operation_mode: OperationMode;
  delegated_consumption: boolean;
  pipeline_status: PipelineStatus;
  plan_status: PlanStatus;
  intended_action: string;
  gate_status: GateStatus;
  preview_status: PreviewStatus;
  execution_permitted_by_gate: boolean;
  dry_run_only: boolean;
  would_execute: boolean;
  requires_separate_actuation_helper: boolean;
  scope: string;
  work_id: string | null;
  related_pr: string | null;
  warnings: string[];
  blockers: string[];
};

type ChildResult = {
  status: number | null;
  stdout: string;
  stderr: string;
};

type RehearsalResult = {
  helper: "codex:actuation-rehearsal";
  version: 1;
  operation_mode: OperationMode;
  delegated_consumption: boolean;
  intended_action: string;
  rehearsal_status: RehearsalStatus;
  action_plan_status: PlanStatus;
  gate_status: GateStatus;
  preview_status: PreviewStatus;
  execution_permitted_by_gate: boolean;
  dry_run_only: true;
  would_execute: false;
  requires_separate_actuation_helper: true;
  scope: string;
  work_id: string | null;
  related_pr: string | null;
  action_plan: unknown;
  actuation_gate: unknown;
  actuation_preview: unknown;
  blockers: string[];
  warnings: string[];
  next_step: string;
  authority_boundary: string;
};

class ActuationRehearsalError extends Error {}

function appDir(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), "..");
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function readPipelineInputText(): Promise<string> {
  const inline = process.env.CODEX_CLOSEOUT_PIPELINE_JSON;
  if (inline !== undefined) {
    if (!inline.trim()) throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_MISSING_INPUT");
    return inline;
  }

  const filePath = process.env.CODEX_CLOSEOUT_PIPELINE_JSON_FILE;
  if (filePath !== undefined) {
    if (!filePath.trim()) throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_MISSING_INPUT");
    const content = await readFile(filePath, "utf8");
    if (!content.trim()) throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_MISSING_INPUT");
    return content;
  }

  if (process.stdin.isTTY) {
    throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_MISSING_INPUT");
  }

  const stdin = await readStdin();
  if (!stdin.trim()) throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_MISSING_INPUT");
  return stdin;
}

function extractPipelineJsonText(input: string): string {
  const begin = input.indexOf(PIPELINE_JSON_BEGIN_MARKER);
  const end = input.indexOf(PIPELINE_JSON_END_MARKER);
  if (begin !== -1 || end !== -1) {
    if (begin === -1 || end === -1 || end <= begin) {
      throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_ACTION_PLAN_FAILED");
    }
    return input.slice(begin + PIPELINE_JSON_BEGIN_MARKER.length, end).trim();
  }

  return input.trim();
}

function canonicalPipelineJson(input: string): string {
  try {
    return JSON.stringify(JSON.parse(extractPipelineJsonText(input)) as unknown);
  } catch (error) {
    if (error instanceof ActuationRehearsalError) throw error;
    throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_ACTION_PLAN_FAILED");
  }
}

function readOutputMode(): OutputMode {
  const value = process.env.CODEX_ACTUATION_REHEARSAL_OUTPUT?.trim() || "both";
  if (value === "summary" || value === "json" || value === "both") return value;
  throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_INVALID_OUTPUT");
}

function readIntendedAction(): string {
  const action = process.env.CODEX_INTENDED_ACTION?.trim();
  if (!action) throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_MISSING_ACTION");
  return action;
}

function childEnv(extra: Record<string, string | undefined>): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    npm_config_cache: process.env.npm_config_cache,
    ...extra,
  };
  delete env.GITHUB_TOKEN;
  delete env.OPENAI_API_KEY;
  return env;
}

function copyEnv(keys: readonly string[]): Record<string, string | undefined> {
  const copied: Record<string, string | undefined> = {};
  for (const key of keys) {
    if (process.env[key] !== undefined) copied[key] = process.env[key];
  }
  return copied;
}

function runChild(scriptName: string, env: NodeJS.ProcessEnv): Promise<ChildResult> {
  return new Promise((resolveChild) => {
    const child = spawn("npm", ["--prefix", appDir(), "run", "--silent", scriptName], {
      env,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("close", (status) => resolveChild({ status, stdout, stderr }));
    child.stdin.end("");
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertStringArray(value: unknown): asserts value is string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_INCONSISTENT_CHILD_OUTPUT");
  }
}

function assertStringOrNull(value: unknown): asserts value is string | null {
  if (value !== null && typeof value !== "string") {
    throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_INCONSISTENT_CHILD_OUTPUT");
  }
}

function extractMarkedJson(stdout: string, beginMarker: string, endMarker: string, errorCode: string): unknown {
  const begin = stdout.indexOf(beginMarker);
  const end = stdout.indexOf(endMarker);
  if (begin === -1 || end === -1 || end <= begin) {
    throw new ActuationRehearsalError(errorCode);
  }

  try {
    return JSON.parse(stdout.slice(begin + beginMarker.length, end).trim()) as unknown;
  } catch {
    throw new ActuationRehearsalError(errorCode);
  }
}

function validateActionPlan(value: unknown): ActionPlan {
  if (!isRecord(value) || value.helper !== "codex:closeout-action-plan") {
    throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_INCONSISTENT_CHILD_OUTPUT");
  }
  if (value.operation_mode !== "human_assisted" && value.operation_mode !== "delegated") {
    throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_INCONSISTENT_CHILD_OUTPUT");
  }
  if (typeof value.delegated_consumption !== "boolean") {
    throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_INCONSISTENT_CHILD_OUTPUT");
  }
  if (value.pipeline_status !== "pass" && value.pipeline_status !== "needs_review" && value.pipeline_status !== "fail") {
    throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_INCONSISTENT_CHILD_OUTPUT");
  }
  if (value.plan_status !== "pass" && value.plan_status !== "needs_review" && value.plan_status !== "fail") {
    throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_INCONSISTENT_CHILD_OUTPUT");
  }
  if (typeof value.scope !== "string") {
    throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_INCONSISTENT_CHILD_OUTPUT");
  }
  assertStringOrNull(value.work_id);
  assertStringOrNull(value.related_pr);
  assertStringArray(value.requested_actions);

  return {
    helper: "codex:closeout-action-plan",
    operation_mode: value.operation_mode,
    delegated_consumption: value.delegated_consumption,
    pipeline_status: value.pipeline_status,
    plan_status: value.plan_status,
    scope: value.scope,
    work_id: value.work_id,
    related_pr: value.related_pr,
    requested_actions: value.requested_actions,
  };
}

function validateGate(value: unknown): ActuationGate {
  if (!isRecord(value) || value.helper !== "codex:actuation-gate") {
    throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_INCONSISTENT_CHILD_OUTPUT");
  }
  if (value.operation_mode !== "human_assisted" && value.operation_mode !== "delegated") {
    throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_INCONSISTENT_CHILD_OUTPUT");
  }
  if (typeof value.delegated_consumption !== "boolean") {
    throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_INCONSISTENT_CHILD_OUTPUT");
  }
  if (value.pipeline_status !== "pass" && value.pipeline_status !== "needs_review" && value.pipeline_status !== "fail") {
    throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_INCONSISTENT_CHILD_OUTPUT");
  }
  if (value.plan_status !== "pass" && value.plan_status !== "needs_review" && value.plan_status !== "fail") {
    throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_INCONSISTENT_CHILD_OUTPUT");
  }
  if (typeof value.intended_action !== "string") {
    throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_INCONSISTENT_CHILD_OUTPUT");
  }
  if (value.gate_status !== "gate_passed" && value.gate_status !== "needs_review" && value.gate_status !== "denied") {
    throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_INCONSISTENT_CHILD_OUTPUT");
  }
  if (typeof value.scope !== "string") {
    throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_INCONSISTENT_CHILD_OUTPUT");
  }
  assertStringOrNull(value.work_id);
  assertStringOrNull(value.related_pr);

  return {
    helper: "codex:actuation-gate",
    operation_mode: value.operation_mode,
    delegated_consumption: value.delegated_consumption,
    pipeline_status: value.pipeline_status,
    plan_status: value.plan_status,
    intended_action: value.intended_action,
    gate_status: value.gate_status,
    scope: value.scope,
    work_id: value.work_id,
    related_pr: value.related_pr,
  };
}

function validatePreview(value: unknown): ActuationPreview {
  if (!isRecord(value) || value.helper !== "codex:actuation-preview") {
    throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_INCONSISTENT_CHILD_OUTPUT");
  }
  if (value.operation_mode !== "human_assisted" && value.operation_mode !== "delegated") {
    throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_INCONSISTENT_CHILD_OUTPUT");
  }
  if (typeof value.delegated_consumption !== "boolean") {
    throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_INCONSISTENT_CHILD_OUTPUT");
  }
  if (value.pipeline_status !== "pass" && value.pipeline_status !== "needs_review" && value.pipeline_status !== "fail") {
    throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_INCONSISTENT_CHILD_OUTPUT");
  }
  if (value.plan_status !== "pass" && value.plan_status !== "needs_review" && value.plan_status !== "fail") {
    throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_INCONSISTENT_CHILD_OUTPUT");
  }
  if (typeof value.intended_action !== "string") {
    throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_INCONSISTENT_CHILD_OUTPUT");
  }
  if (value.gate_status !== "gate_passed" && value.gate_status !== "needs_review" && value.gate_status !== "denied") {
    throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_INCONSISTENT_CHILD_OUTPUT");
  }
  if (
    value.preview_status !== "ready_for_separate_actuation" &&
    value.preview_status !== "needs_review" &&
    value.preview_status !== "blocked"
  ) {
    throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_INCONSISTENT_CHILD_OUTPUT");
  }
  if (
    typeof value.execution_permitted_by_gate !== "boolean" ||
    value.dry_run_only !== true ||
    value.would_execute !== false ||
    value.requires_separate_actuation_helper !== true
  ) {
    throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_INCONSISTENT_CHILD_OUTPUT");
  }
  if (typeof value.scope !== "string") {
    throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_INCONSISTENT_CHILD_OUTPUT");
  }
  assertStringOrNull(value.work_id);
  assertStringOrNull(value.related_pr);
  assertStringArray(value.warnings);
  assertStringArray(value.blockers);

  return {
    helper: "codex:actuation-preview",
    operation_mode: value.operation_mode,
    delegated_consumption: value.delegated_consumption,
    pipeline_status: value.pipeline_status,
    plan_status: value.plan_status,
    intended_action: value.intended_action,
    gate_status: value.gate_status,
    preview_status: value.preview_status,
    execution_permitted_by_gate: value.execution_permitted_by_gate,
    dry_run_only: value.dry_run_only,
    would_execute: value.would_execute,
    requires_separate_actuation_helper: value.requires_separate_actuation_helper,
    scope: value.scope,
    work_id: value.work_id,
    related_pr: value.related_pr,
    warnings: value.warnings,
    blockers: value.blockers,
  };
}

function validateChildConsistency(
  intendedAction: string,
  actionPlan: ActionPlan,
  gate: ActuationGate,
  preview: ActuationPreview,
): void {
  if (!actionPlan.requested_actions.includes(intendedAction)) {
    throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_INCONSISTENT_CHILD_OUTPUT");
  }
  if (gate.intended_action !== intendedAction || preview.intended_action !== intendedAction) {
    throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_INCONSISTENT_CHILD_OUTPUT");
  }
  if (preview.gate_status !== gate.gate_status) {
    throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_INCONSISTENT_CHILD_OUTPUT");
  }
  if (preview.execution_permitted_by_gate !== (gate.gate_status === "gate_passed")) {
    throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_INCONSISTENT_CHILD_OUTPUT");
  }
}

function rehearsalStatus(previewStatus: PreviewStatus): RehearsalStatus {
  return previewStatus;
}

function nextStep(status: RehearsalStatus): string {
  if (status === "failed") return "Do not execute this action. Fix the failed local rehearsal stage first.";
  if (status === "blocked") return "Do not execute this action. Resolve the gate or preview blockers first.";
  if (status === "needs_review") {
    return "Do not execute this action. Resolve review requirements before any separate actuation layer.";
  }
  return "Local rehearsal is complete. Execution still requires a separate actuation helper or human/operator process.";
}

function buildResult(
  intendedAction: string,
  actionPlanRaw: unknown,
  actionPlan: ActionPlan,
  gateRaw: unknown,
  gate: ActuationGate,
  previewRaw: unknown,
  preview: ActuationPreview,
): RehearsalResult {
  const status = rehearsalStatus(preview.preview_status);
  return {
    helper: "codex:actuation-rehearsal",
    version: 1,
    operation_mode: preview.operation_mode,
    delegated_consumption: preview.delegated_consumption,
    intended_action: intendedAction,
    rehearsal_status: status,
    action_plan_status: actionPlan.plan_status,
    gate_status: gate.gate_status,
    preview_status: preview.preview_status,
    execution_permitted_by_gate: preview.execution_permitted_by_gate,
    dry_run_only: true,
    would_execute: false,
    requires_separate_actuation_helper: true,
    scope: preview.scope,
    work_id: preview.work_id,
    related_pr: preview.related_pr,
    action_plan: actionPlanRaw,
    actuation_gate: gateRaw,
    actuation_preview: previewRaw,
    blockers: preview.blockers,
    warnings: preview.warnings,
    next_step: nextStep(status),
    authority_boundary: AUTHORITY_BOUNDARY,
  };
}

function renderSummary(result: RehearsalResult): string {
  return [
    "Codex actuation rehearsal",
    `operation_mode: ${result.operation_mode}`,
    `delegated_consumption: ${result.delegated_consumption}`,
    `intended_action: ${result.intended_action}`,
    `rehearsal_status: ${result.rehearsal_status}`,
    `action_plan_status: ${result.action_plan_status}`,
    `gate_status: ${result.gate_status}`,
    `preview_status: ${result.preview_status}`,
    `execution_permitted_by_gate: ${result.execution_permitted_by_gate}`,
    `dry_run_only: ${result.dry_run_only}`,
    `would_execute: ${result.would_execute}`,
    `requires_separate_actuation_helper: ${result.requires_separate_actuation_helper}`,
    `scope: ${result.scope}`,
    `work_id: ${result.work_id ?? "Not provided."}`,
    `related_pr: ${result.related_pr ?? "Not provided."}`,
    `blockers count: ${result.blockers.length}`,
    `warnings count: ${result.warnings.length}`,
    `next_step: ${result.next_step}`,
    `authority boundary: ${result.authority_boundary}`,
    DELEGATED_NOTE,
  ].join("\n");
}

function printResult(result: RehearsalResult, outputMode: OutputMode): void {
  if (outputMode === "summary") {
    console.log(renderSummary(result));
    return;
  }

  if (outputMode === "json") {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(renderSummary(result));
  console.log(REHEARSAL_JSON_BEGIN_MARKER);
  console.log(JSON.stringify(result, null, 2));
  console.log(REHEARSAL_JSON_END_MARKER);
}

async function runActionPlan(pipelineJson: string): Promise<unknown> {
  const env = childEnv({
    ...copyEnv(ACTION_PLAN_PASSTHROUGH),
    CODEX_CLOSEOUT_PIPELINE_JSON: pipelineJson,
    CODEX_ACTION_PLAN_OUTPUT: "both",
  });
  const child = await runChild("codex:closeout-action-plan", env);
  if (child.status !== 0) throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_ACTION_PLAN_FAILED");
  return extractMarkedJson(
    child.stdout,
    ACTION_PLAN_JSON_BEGIN_MARKER,
    ACTION_PLAN_JSON_END_MARKER,
    "CODEX_ACTUATION_REHEARSAL_INVALID_ACTION_PLAN_JSON",
  );
}

async function runGate(actionPlan: unknown): Promise<unknown> {
  const env = childEnv({
    ...copyEnv(GATE_PASSTHROUGH),
    CODEX_ACTION_PLAN_JSON: JSON.stringify(actionPlan),
    CODEX_ACTUATION_GATE_OUTPUT: "both",
  });
  const child = await runChild("codex:actuation-gate", env);
  if (child.status !== 0) throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_GATE_FAILED");
  return extractMarkedJson(
    child.stdout,
    GATE_JSON_BEGIN_MARKER,
    GATE_JSON_END_MARKER,
    "CODEX_ACTUATION_REHEARSAL_INVALID_GATE_JSON",
  );
}

async function runPreview(gate: unknown): Promise<unknown> {
  const env = childEnv({
    ...copyEnv(PREVIEW_PASSTHROUGH),
    CODEX_ACTUATION_GATE_JSON: JSON.stringify(gate),
    CODEX_ACTUATION_PREVIEW_OUTPUT: "both",
  });
  const child = await runChild("codex:actuation-preview", env);
  if (child.status !== 0) throw new ActuationRehearsalError("CODEX_ACTUATION_REHEARSAL_PREVIEW_FAILED");
  return extractMarkedJson(
    child.stdout,
    PREVIEW_JSON_BEGIN_MARKER,
    PREVIEW_JSON_END_MARKER,
    "CODEX_ACTUATION_REHEARSAL_INVALID_PREVIEW_JSON",
  );
}

async function main(): Promise<void> {
  const pipelineJson = canonicalPipelineJson(await readPipelineInputText());
  const outputMode = readOutputMode();
  const intendedAction = readIntendedAction();

  const actionPlanRaw = await runActionPlan(pipelineJson);
  const actionPlan = validateActionPlan(actionPlanRaw);
  const gateRaw = await runGate(actionPlanRaw);
  const gate = validateGate(gateRaw);
  const previewRaw = await runPreview(gateRaw);
  const preview = validatePreview(previewRaw);
  validateChildConsistency(intendedAction, actionPlan, gate, preview);
  printResult(buildResult(intendedAction, actionPlanRaw, actionPlan, gateRaw, gate, previewRaw, preview), outputMode);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "CODEX_ACTUATION_REHEARSAL_FAILED";
    console.error(message);
    process.exitCode = 1;
  });
}
