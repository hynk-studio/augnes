import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const GATE_JSON_BEGIN_MARKER = "BEGIN_AUGNES_CODEX_ACTUATION_GATE_JSON";
const GATE_JSON_END_MARKER = "END_AUGNES_CODEX_ACTUATION_GATE_JSON";
const PREVIEW_JSON_BEGIN_MARKER = "BEGIN_AUGNES_CODEX_ACTUATION_PREVIEW_JSON";
const PREVIEW_JSON_END_MARKER = "END_AUGNES_CODEX_ACTUATION_PREVIEW_JSON";

const AUTHORITY_BOUNDARY =
  "The helper previews a possible action shape only. It does not execute actions. It does not call GitHub/OpenAI/providers. It does not post comments/reviews. It does not approve, merge, publish, create evidence, create proof, mutate Augnes, or commit/reject state. It does not grant authority. gate_passed is not execution. Any actuation requires a separate implementation and gate.";

const DELEGATED_NOTE =
  "Delegated note: this preview may be consumed by a delegated Codex workflow, but it is dry-run-only and does not perform posting, approval, merge, publication, provider calls, GitHub calls, or Augnes state mutation.";

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

const GITHUB_ACTIONS = new Set<string>([
  "create_pr_comment",
  "create_pr_review",
  "approve_pr",
  "merge_pr",
  "call_github",
]);

const AUGNES_TARGET_ACTIONS = new Set<string>([
  "record_more_evidence",
  "record_completion",
  "mutate_augnes_state",
  "commit_or_reject_state",
  "inspect_read_only_refs",
]);

const PROVIDER_OR_EXTERNAL_ACTIONS = new Set<string>(["call_provider", "publish_external"]);

const GRANT_REQUIRED_GATE_PASSED_ACTIONS = new Set<string>([
  "create_pr_comment",
  "create_pr_review",
  "approve_pr",
  "merge_pr",
  "call_github",
  "record_more_evidence",
  "record_completion",
  "mutate_augnes_state",
  "commit_or_reject_state",
  "call_provider",
  "publish_external",
]);

type OutputMode = "summary" | "json" | "both";
type OperationMode = "human_assisted" | "delegated";
type PipelineStatus = "pass" | "needs_review" | "fail";
type PlanStatus = "pass" | "needs_review" | "fail";
type PlannedDecision = "allow" | "needs_review" | "deny";
type GateStatus = "gate_passed" | "needs_review" | "denied";
type PreviewStatus = "ready_for_separate_actuation" | "needs_review" | "blocked";
type TargetStatus = "present" | "missing" | "not_required";
type OperationKind = "local_handoff" | "local_check" | "github_write" | "augnes_write" | "provider_call" | "external_publish";
type MethodPreview = "none" | "would_POST" | "would_PATCH" | "would_PUT" | "would_DELETE" | "would_CALL";

type ActuationGate = {
  helper: "codex:actuation-gate";
  version: unknown;
  operation_mode: OperationMode;
  delegated_consumption: boolean;
  pipeline_status: PipelineStatus;
  plan_status: PlanStatus;
  intended_action: string;
  planned_decision: PlannedDecision | null;
  gate_status: GateStatus;
  reason: string;
  required_gate: string | null;
  authority_grant_required: boolean;
  authority_grant_present: boolean;
  authority_grant_valid: boolean;
  grant_id: string | null;
  scope: string;
  work_id: string | null;
  related_pr: string | null;
  forbidden_actions: string[];
  constraints: string[];
  next_step: string;
  authority_boundary: string;
};

type PreviewConfig = {
  outputMode: OutputMode;
  includeBody: boolean;
  strictTargets: boolean;
  targetRef: string | null;
  body: string | null;
  dryRunId: string | null;
  payload: Record<string, unknown> | null;
};

type OperationPreview = {
  action: string;
  operation_kind: OperationKind;
  target_ref: string | null;
  scope: string;
  work_id: string | null;
  related_pr: string | null;
  method_preview: MethodPreview;
  payload_present: boolean;
  payload_keys: string[];
  body_present: boolean;
  body_length: number;
  body_preview?: string;
  dry_run_only: true;
  would_execute: false;
};

type PreviewResult = {
  helper: "codex:actuation-preview";
  version: 1;
  dry_run_id: string;
  operation_mode: OperationMode;
  delegated_consumption: boolean;
  pipeline_status: PipelineStatus;
  plan_status: PlanStatus;
  intended_action: string;
  gate_status: GateStatus;
  preview_status: PreviewStatus;
  execution_permitted_by_gate: boolean;
  dry_run_only: true;
  would_execute: false;
  requires_separate_actuation_helper: true;
  grant_id: string | null;
  scope: string;
  work_id: string | null;
  related_pr: string | null;
  target_status: TargetStatus;
  operation_preview: OperationPreview;
  warnings: string[];
  blockers: string[];
  next_step: string;
  authority_boundary: string;
};

class ActuationPreviewError extends Error {}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function readGateInputText(): Promise<string> {
  const inline = process.env.CODEX_ACTUATION_GATE_JSON;
  if (inline !== undefined) {
    if (!inline.trim()) throw new ActuationPreviewError("CODEX_ACTUATION_PREVIEW_MISSING_INPUT");
    return inline;
  }

  const filePath = process.env.CODEX_ACTUATION_GATE_JSON_FILE;
  if (filePath !== undefined) {
    if (!filePath.trim()) throw new ActuationPreviewError("CODEX_ACTUATION_PREVIEW_MISSING_INPUT");
    const content = await readFile(filePath, "utf8");
    if (!content.trim()) throw new ActuationPreviewError("CODEX_ACTUATION_PREVIEW_MISSING_INPUT");
    return content;
  }

  if (process.stdin.isTTY) {
    throw new ActuationPreviewError("CODEX_ACTUATION_PREVIEW_MISSING_INPUT");
  }

  const stdin = await readStdin();
  if (!stdin.trim()) throw new ActuationPreviewError("CODEX_ACTUATION_PREVIEW_MISSING_INPUT");
  return stdin;
}

async function readPayloadInputText(): Promise<string | null> {
  const inline = process.env.CODEX_ACTUATION_PAYLOAD_JSON;
  if (inline !== undefined) {
    if (!inline.trim()) throw new ActuationPreviewError("CODEX_ACTUATION_PREVIEW_INVALID_PAYLOAD_JSON");
    return inline;
  }

  const filePath = process.env.CODEX_ACTUATION_PAYLOAD_JSON_FILE;
  if (filePath !== undefined) {
    if (!filePath.trim()) throw new ActuationPreviewError("CODEX_ACTUATION_PREVIEW_INVALID_PAYLOAD_JSON");
    const content = await readFile(filePath, "utf8");
    if (!content.trim()) throw new ActuationPreviewError("CODEX_ACTUATION_PREVIEW_INVALID_PAYLOAD_JSON");
    return content;
  }

  return null;
}

function extractGateJsonText(input: string): string {
  const begin = input.indexOf(GATE_JSON_BEGIN_MARKER);
  const end = input.indexOf(GATE_JSON_END_MARKER);
  if (begin !== -1 || end !== -1) {
    if (begin === -1 || end === -1 || end <= begin) {
      throw new ActuationPreviewError("CODEX_ACTUATION_PREVIEW_INVALID_JSON");
    }

    return input.slice(begin + GATE_JSON_BEGIN_MARKER.length, end).trim();
  }

  return input.trim();
}

function parseGateJson(input: string): unknown {
  try {
    return JSON.parse(extractGateJsonText(input)) as unknown;
  } catch (error) {
    if (error instanceof ActuationPreviewError) throw error;
    throw new ActuationPreviewError("CODEX_ACTUATION_PREVIEW_INVALID_JSON");
  }
}

function parsePayloadJson(input: string): unknown {
  try {
    return JSON.parse(input.trim()) as unknown;
  } catch {
    throw new ActuationPreviewError("CODEX_ACTUATION_PREVIEW_INVALID_PAYLOAD_JSON");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertStringArray(value: unknown, code: string): asserts value is string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new ActuationPreviewError(code);
  }
}

function assertStringOrNull(value: unknown, code: string): asserts value is string | null {
  if (value !== null && typeof value !== "string") {
    throw new ActuationPreviewError(code);
  }
}

function isSupportedAction(action: string): boolean {
  return SUPPORTED_ACTIONS.includes(action as (typeof SUPPORTED_ACTIONS)[number]);
}

function validateGate(value: unknown): ActuationGate {
  const code = "CODEX_ACTUATION_PREVIEW_INVALID_GATE";
  if (!isRecord(value)) throw new ActuationPreviewError(code);
  if (value.helper !== "codex:actuation-gate") throw new ActuationPreviewError(code);
  if (!("version" in value)) throw new ActuationPreviewError(code);
  if (value.operation_mode !== "human_assisted" && value.operation_mode !== "delegated") {
    throw new ActuationPreviewError(code);
  }
  if (typeof value.delegated_consumption !== "boolean") throw new ActuationPreviewError(code);
  if (
    value.pipeline_status !== "pass" &&
    value.pipeline_status !== "needs_review" &&
    value.pipeline_status !== "fail"
  ) {
    throw new ActuationPreviewError(code);
  }
  if (value.plan_status !== "pass" && value.plan_status !== "needs_review" && value.plan_status !== "fail") {
    throw new ActuationPreviewError(code);
  }
  if (typeof value.intended_action !== "string") throw new ActuationPreviewError(code);
  if (
    value.planned_decision !== null &&
    value.planned_decision !== "allow" &&
    value.planned_decision !== "needs_review" &&
    value.planned_decision !== "deny"
  ) {
    throw new ActuationPreviewError(code);
  }
  if (value.gate_status !== "gate_passed" && value.gate_status !== "needs_review" && value.gate_status !== "denied") {
    throw new ActuationPreviewError(code);
  }
  if (typeof value.reason !== "string") throw new ActuationPreviewError(code);
  assertStringOrNull(value.required_gate, code);
  if (typeof value.authority_grant_required !== "boolean") throw new ActuationPreviewError(code);
  if (typeof value.authority_grant_present !== "boolean") throw new ActuationPreviewError(code);
  if (typeof value.authority_grant_valid !== "boolean") throw new ActuationPreviewError(code);
  assertStringOrNull(value.grant_id, code);
  if (typeof value.scope !== "string") throw new ActuationPreviewError(code);
  assertStringOrNull(value.work_id, code);
  assertStringOrNull(value.related_pr, code);
  assertStringArray(value.forbidden_actions, code);
  assertStringArray(value.constraints, code);
  if (typeof value.next_step !== "string") throw new ActuationPreviewError(code);
  if (typeof value.authority_boundary !== "string" || !value.authority_boundary.trim()) {
    throw new ActuationPreviewError(code);
  }

  const gate: ActuationGate = {
    helper: "codex:actuation-gate",
    version: value.version,
    operation_mode: value.operation_mode,
    delegated_consumption: value.delegated_consumption,
    pipeline_status: value.pipeline_status,
    plan_status: value.plan_status,
    intended_action: value.intended_action,
    planned_decision: value.planned_decision,
    gate_status: value.gate_status,
    reason: value.reason,
    required_gate: value.required_gate,
    authority_grant_required: value.authority_grant_required,
    authority_grant_present: value.authority_grant_present,
    authority_grant_valid: value.authority_grant_valid,
    grant_id: value.grant_id,
    scope: value.scope,
    work_id: value.work_id,
    related_pr: value.related_pr,
    forbidden_actions: value.forbidden_actions,
    constraints: value.constraints,
    next_step: value.next_step,
    authority_boundary: value.authority_boundary,
  };

  validateGateConsistency(gate);
  return gate;
}

function validateGateConsistency(gate: ActuationGate): void {
  const code = "CODEX_ACTUATION_PREVIEW_INVALID_GATE";
  const hasGrantId = typeof gate.grant_id === "string" && gate.grant_id.trim().length > 0;

  if (gate.authority_grant_valid) {
    if (!gate.authority_grant_present || !hasGrantId) throw new ActuationPreviewError(code);
  }

  if (!gate.authority_grant_present && (gate.authority_grant_valid || gate.grant_id !== null)) {
    throw new ActuationPreviewError(code);
  }

  if (gate.planned_decision === null) {
    if (
      gate.gate_status !== "denied" ||
      (gate.reason !== "action_not_in_plan" && gate.reason !== "unknown_action")
    ) {
      throw new ActuationPreviewError(code);
    }
  }

  if (gate.gate_status === "gate_passed") {
    if (
      gate.pipeline_status === "fail" ||
      gate.plan_status === "fail" ||
      gate.planned_decision === "deny" ||
      gate.planned_decision === null
    ) {
      throw new ActuationPreviewError(code);
    }

    if (gate.authority_grant_required && (!gate.authority_grant_present || !gate.authority_grant_valid || !hasGrantId)) {
      throw new ActuationPreviewError(code);
    }

    if (
      GRANT_REQUIRED_GATE_PASSED_ACTIONS.has(gate.intended_action) &&
      (!gate.authority_grant_required || !gate.authority_grant_present || !gate.authority_grant_valid || !hasGrantId)
    ) {
      throw new ActuationPreviewError(code);
    }

    if (
      (gate.required_gate === "separate_authority_gate" || gate.required_gate === "human_operator_in_loop") &&
      (!gate.authority_grant_required || !gate.authority_grant_valid)
    ) {
      throw new ActuationPreviewError(code);
    }
  }

  if (gate.gate_status === "needs_review") {
    if (gate.planned_decision === "deny" || gate.planned_decision === null) throw new ActuationPreviewError(code);
    if (gate.authority_grant_valid && !gate.authority_grant_present) throw new ActuationPreviewError(code);
  }

  if (gate.gate_status === "denied") {
    if (gate.planned_decision === "allow" && gate.reason !== "plan_failed") {
      throw new ActuationPreviewError(code);
    }
    if (gate.reason === "plan_failed" && gate.pipeline_status !== "fail" && gate.plan_status !== "fail") {
      throw new ActuationPreviewError(code);
    }
  }
}

function validatePayload(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new ActuationPreviewError("CODEX_ACTUATION_PREVIEW_INVALID_PAYLOAD");
  return value;
}

function readOutputMode(): OutputMode {
  const value = process.env.CODEX_ACTUATION_PREVIEW_OUTPUT?.trim() || "both";
  if (value === "summary" || value === "json" || value === "both") return value;
  throw new ActuationPreviewError("CODEX_ACTUATION_PREVIEW_INVALID_OUTPUT");
}

function readBooleanEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  const value = raw.trim();
  if (value === "true") return true;
  if (value === "false") return false;
  throw new ActuationPreviewError(`CODEX_ACTUATION_PREVIEW_INVALID_BOOLEAN ${name}`);
}

function readOptionalString(name: string): string | null {
  const value = process.env[name];
  if (value === undefined) return null;
  return value;
}

function readOptionalNonEmptyString(name: string): string | null {
  const value = process.env[name];
  if (value === undefined) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function stringFromPayload(payload: Record<string, unknown> | null, key: string): string | null {
  const value = payload?.[key];
  return typeof value === "string" && value.trim() ? value : null;
}

async function readConfig(): Promise<PreviewConfig> {
  const payloadText = await readPayloadInputText();
  const payload = payloadText === null ? null : validatePayload(parsePayloadJson(payloadText));

  return {
    outputMode: readOutputMode(),
    includeBody: readBooleanEnv("CODEX_ACTUATION_PREVIEW_INCLUDE_BODY", false),
    strictTargets: readBooleanEnv("CODEX_ACTUATION_PREVIEW_STRICT_TARGETS", true),
    targetRef:
      readOptionalNonEmptyString("CODEX_ACTUATION_PREVIEW_TARGET_REF") ?? stringFromPayload(payload, "target_ref"),
    body: readOptionalString("CODEX_ACTUATION_PREVIEW_BODY") ?? stringFromPayload(payload, "body"),
    dryRunId: readOptionalNonEmptyString("CODEX_ACTUATION_PREVIEW_DRY_RUN_ID"),
    payload,
  };
}

function operationKind(action: string): OperationKind {
  if (GITHUB_ACTIONS.has(action)) return "github_write";
  if (action === "publish_external") return "external_publish";
  if (action === "call_provider") return "provider_call";
  if (action === "record_more_evidence" || action === "record_completion" || action === "mutate_augnes_state" || action === "commit_or_reject_state") {
    return "augnes_write";
  }
  if (action === "run_missing_checks" || action === "inspect_read_only_refs") return "local_check";
  return "local_handoff";
}

function methodPreview(action: string): MethodPreview {
  if (action === "prepare_pr_body" || action === "request_human_review" || action === "run_missing_checks" || action === "inspect_read_only_refs" || action === "delegated_handoff") {
    return "none";
  }
  if (action === "merge_pr") return "would_PUT";
  if (action === "mutate_augnes_state") return "would_PATCH";
  if (action === "call_provider" || action === "call_github") return "would_CALL";
  return "would_POST";
}

function initialPreviewStatus(gateStatus: GateStatus): PreviewStatus {
  if (gateStatus === "denied") return "blocked";
  if (gateStatus === "needs_review") return "needs_review";
  return "ready_for_separate_actuation";
}

function executionPermittedByGate(gateStatus: GateStatus): boolean {
  return gateStatus === "gate_passed";
}

function targetRefForGate(gate: ActuationGate, config: PreviewConfig): string | null {
  if (GITHUB_ACTIONS.has(gate.intended_action)) {
    return config.targetRef ?? gate.related_pr;
  }
  if (PROVIDER_OR_EXTERNAL_ACTIONS.has(gate.intended_action)) {
    return config.targetRef;
  }
  return config.targetRef ?? gate.related_pr;
}

function targetStatusFor(gate: ActuationGate, targetRef: string | null): TargetStatus {
  if (GITHUB_ACTIONS.has(gate.intended_action) || PROVIDER_OR_EXTERNAL_ACTIONS.has(gate.intended_action)) {
    return targetRef === null ? "missing" : "present";
  }
  if (AUGNES_TARGET_ACTIONS.has(gate.intended_action)) {
    return gate.work_id === null ? "missing" : "present";
  }
  return targetRef === null && gate.work_id === null && !gate.scope ? "not_required" : "not_required";
}

function buildDryRunId(gate: ActuationGate, config: PreviewConfig, payloadKeys: string[]): string {
  const provided = config.dryRunId?.trim();
  if (provided) return provided;

  const hash = createHash("sha256")
    .update(
      JSON.stringify({
        action: gate.intended_action,
        gate_status: gate.gate_status,
        scope: gate.scope,
        work_id: gate.work_id,
        related_pr: gate.related_pr,
        grant_id: gate.grant_id,
        payload_keys: payloadKeys,
      }),
    )
    .digest("hex")
    .slice(0, 12);

  return `dry-run-${gate.intended_action.replace(/[^a-z0-9_]+/gi, "_")}-${hash}`;
}

function nextStep(status: PreviewStatus): string {
  if (status === "blocked") {
    return "Do not execute this action. Resolve the denied gate before previewing actuation.";
  }
  if (status === "needs_review") {
    return "Do not execute this action. Resolve preview blockers or gate review requirements first.";
  }
  return "Dry-run preview is ready. Execution still requires a separate actuation helper or human/operator process.";
}

function buildPreview(gate: ActuationGate, config: PreviewConfig): PreviewResult {
  if (!isSupportedAction(gate.intended_action)) {
    throw new ActuationPreviewError("CODEX_ACTUATION_PREVIEW_UNSUPPORTED_ACTION");
  }

  const payloadKeys = config.payload === null ? [] : Object.keys(config.payload).sort();
  const targetRef = targetRefForGate(gate, config);
  const targetStatus = targetStatusFor(gate, targetRef);
  const warnings: string[] = [];
  const blockers: string[] = [];
  let previewStatus = initialPreviewStatus(gate.gate_status);

  if (targetStatus === "missing") {
    const targetMessage = "target_missing";
    if (config.strictTargets && previewStatus !== "blocked") {
      previewStatus = "needs_review";
      blockers.push(targetMessage);
    } else {
      warnings.push(targetMessage);
    }
  }

  if (gate.gate_status === "denied") blockers.push("gate_denied");
  if (gate.gate_status === "needs_review") blockers.push("gate_needs_review");

  const body = config.body;
  const operationPreview: OperationPreview = {
    action: gate.intended_action,
    operation_kind: operationKind(gate.intended_action),
    target_ref: targetRef,
    scope: gate.scope,
    work_id: gate.work_id,
    related_pr: gate.related_pr,
    method_preview: methodPreview(gate.intended_action),
    payload_present: config.payload !== null,
    payload_keys: payloadKeys,
    body_present: body !== null,
    body_length: body?.length ?? 0,
    dry_run_only: true,
    would_execute: false,
  };

  if (config.includeBody && body !== null) {
    operationPreview.body_preview = body;
  }

  return {
    helper: "codex:actuation-preview",
    version: 1,
    dry_run_id: buildDryRunId(gate, config, payloadKeys),
    operation_mode: gate.operation_mode,
    delegated_consumption: gate.delegated_consumption,
    pipeline_status: gate.pipeline_status,
    plan_status: gate.plan_status,
    intended_action: gate.intended_action,
    gate_status: gate.gate_status,
    preview_status: previewStatus,
    execution_permitted_by_gate: executionPermittedByGate(gate.gate_status),
    dry_run_only: true,
    would_execute: false,
    requires_separate_actuation_helper: true,
    grant_id: gate.grant_id,
    scope: gate.scope,
    work_id: gate.work_id,
    related_pr: gate.related_pr,
    target_status: targetStatus,
    operation_preview: operationPreview,
    warnings,
    blockers,
    next_step: nextStep(previewStatus),
    authority_boundary: AUTHORITY_BOUNDARY,
  };
}

function renderSummary(result: PreviewResult): string {
  return [
    "Codex actuation preview",
    `operation_mode: ${result.operation_mode}`,
    `delegated_consumption: ${result.delegated_consumption}`,
    `pipeline_status: ${result.pipeline_status}`,
    `plan_status: ${result.plan_status}`,
    `intended_action: ${result.intended_action}`,
    `gate_status: ${result.gate_status}`,
    `preview_status: ${result.preview_status}`,
    `execution_permitted_by_gate: ${result.execution_permitted_by_gate}`,
    `dry_run_only: ${result.dry_run_only}`,
    `would_execute: ${result.would_execute}`,
    `requires_separate_actuation_helper: ${result.requires_separate_actuation_helper}`,
    `grant_id: ${result.grant_id ?? "Not provided."}`,
    `scope: ${result.scope}`,
    `work_id: ${result.work_id ?? "Not provided."}`,
    `related_pr: ${result.related_pr ?? "Not provided."}`,
    `target_status: ${result.target_status}`,
    `operation_kind: ${result.operation_preview.operation_kind}`,
    `method_preview: ${result.operation_preview.method_preview}`,
    `body_present: ${result.operation_preview.body_present}`,
    `body_length: ${result.operation_preview.body_length}`,
    `warnings count: ${result.warnings.length}`,
    `blockers count: ${result.blockers.length}`,
    `next_step: ${result.next_step}`,
    `authority boundary: ${result.authority_boundary}`,
    DELEGATED_NOTE,
  ].join("\n");
}

function printPreview(result: PreviewResult, outputMode: OutputMode): void {
  if (outputMode === "summary") {
    console.log(renderSummary(result));
    return;
  }

  if (outputMode === "json") {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(renderSummary(result));
  console.log(PREVIEW_JSON_BEGIN_MARKER);
  console.log(JSON.stringify(result, null, 2));
  console.log(PREVIEW_JSON_END_MARKER);
}

async function main(): Promise<void> {
  const gate = validateGate(parseGateJson(await readGateInputText()));
  const config = await readConfig();
  const preview = buildPreview(gate, config);
  printPreview(preview, config.outputMode);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "CODEX_ACTUATION_PREVIEW_FAILED";
    console.error(message);
    process.exitCode = 1;
  });
}
