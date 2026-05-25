import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const ACTION_PLAN_JSON_BEGIN_MARKER = "BEGIN_AUGNES_CODEX_ACTION_PLAN_JSON";
const ACTION_PLAN_JSON_END_MARKER = "END_AUGNES_CODEX_ACTION_PLAN_JSON";
const ACTUATION_GATE_JSON_BEGIN_MARKER = "BEGIN_AUGNES_CODEX_ACTUATION_GATE_JSON";
const ACTUATION_GATE_JSON_END_MARKER = "END_AUGNES_CODEX_ACTUATION_GATE_JSON";

const AUTHORITY_BOUNDARY =
  "The helper validates local action-plan and authority-grant material only. It does not execute actions. It does not call GitHub/OpenAI/providers. It does not post comments/reviews. It does not approve, merge, publish, create evidence, create proof, mutate Augnes, or commit/reject state. It does not grant authority. It can support human-assisted and delegated Codex workflows, but any actuation requires a separate implementation and gate.";

const DELEGATED_NOTE =
  "Delegated note: this gate may be consumed by a delegated Codex workflow, but gate_passed is not execution and does not perform posting, approval, merge, publication, provider calls, GitHub calls, or Augnes state mutation.";

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

const EXTERNAL_OR_MUTATING_ACTIONS = new Set<string>([
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

type OutputMode = "summary" | "json" | "both";
type OperationMode = "human_assisted" | "delegated";
type PipelineStatus = "pass" | "needs_review" | "fail";
type PlanStatus = "pass" | "needs_review" | "fail";
type PlannedDecision = "allow" | "needs_review" | "deny";
type GateStatus = "gate_passed" | "needs_review" | "denied";

type ActionDecision = {
  action: string;
  decision: PlannedDecision;
  reason: string;
  required_gate: string | null;
};

type ActionPlan = {
  helper: "codex:closeout-action-plan";
  version: unknown;
  operation_mode: OperationMode;
  delegated_consumption: boolean;
  pipeline_status: PipelineStatus;
  plan_status: PlanStatus;
  scope: string;
  work_id: string | null;
  related_pr: string | null;
  requested_actions: string[];
  action_decisions: ActionDecision[];
  authority_boundary: string;
};

type AuthorityGrant = {
  helper: "codex:authority-grant";
  version: unknown;
  grant_id: string;
  granted_by: string;
  granted_to: string;
  scope: string;
  work_id: string | null;
  related_pr: string | null;
  actions: string[];
  expires_at: string | null;
  constraints: string[];
  forbidden_actions: string[];
  dry_run_only: boolean;
  authority_boundary: string;
};

type GateResult = {
  helper: "codex:actuation-gate";
  version: 1;
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

class ActuationGateError extends Error {}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function readActionPlanInputText(): Promise<string> {
  const inline = process.env.CODEX_ACTION_PLAN_JSON;
  if (inline !== undefined) {
    if (!inline.trim()) throw new ActuationGateError("CODEX_ACTUATION_GATE_MISSING_INPUT");
    return inline;
  }

  const filePath = process.env.CODEX_ACTION_PLAN_JSON_FILE;
  if (filePath !== undefined) {
    if (!filePath.trim()) throw new ActuationGateError("CODEX_ACTUATION_GATE_MISSING_INPUT");
    const content = await readFile(filePath, "utf8");
    if (!content.trim()) throw new ActuationGateError("CODEX_ACTUATION_GATE_MISSING_INPUT");
    return content;
  }

  if (process.stdin.isTTY) {
    throw new ActuationGateError("CODEX_ACTUATION_GATE_MISSING_INPUT");
  }

  const stdin = await readStdin();
  if (!stdin.trim()) throw new ActuationGateError("CODEX_ACTUATION_GATE_MISSING_INPUT");
  return stdin;
}

async function readAuthorityGrantInputText(): Promise<string | null> {
  const inline = process.env.CODEX_AUTHORITY_GRANT_JSON;
  if (inline !== undefined) {
    if (!inline.trim()) throw new ActuationGateError("CODEX_ACTUATION_GATE_INVALID_GRANT_JSON");
    return inline;
  }

  const filePath = process.env.CODEX_AUTHORITY_GRANT_JSON_FILE;
  if (filePath !== undefined) {
    if (!filePath.trim()) throw new ActuationGateError("CODEX_ACTUATION_GATE_INVALID_GRANT_JSON");
    const content = await readFile(filePath, "utf8");
    if (!content.trim()) throw new ActuationGateError("CODEX_ACTUATION_GATE_INVALID_GRANT_JSON");
    return content;
  }

  return null;
}

function extractActionPlanJsonText(input: string): string {
  const begin = input.indexOf(ACTION_PLAN_JSON_BEGIN_MARKER);
  const end = input.indexOf(ACTION_PLAN_JSON_END_MARKER);
  if (begin !== -1 || end !== -1) {
    if (begin === -1 || end === -1 || end <= begin) {
      throw new ActuationGateError("CODEX_ACTUATION_GATE_INVALID_JSON");
    }

    return input.slice(begin + ACTION_PLAN_JSON_BEGIN_MARKER.length, end).trim();
  }

  return input.trim();
}

function parseActionPlanJson(input: string): unknown {
  try {
    return JSON.parse(extractActionPlanJsonText(input)) as unknown;
  } catch (error) {
    if (error instanceof ActuationGateError) throw error;
    throw new ActuationGateError("CODEX_ACTUATION_GATE_INVALID_JSON");
  }
}

function parseAuthorityGrantJson(input: string): unknown {
  try {
    return JSON.parse(input.trim()) as unknown;
  } catch {
    throw new ActuationGateError("CODEX_ACTUATION_GATE_INVALID_GRANT_JSON");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertStringArray(value: unknown, code: string): asserts value is string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new ActuationGateError(code);
  }
}

function assertStringOrNull(value: unknown, code: string): asserts value is string | null {
  if (value !== null && typeof value !== "string") {
    throw new ActuationGateError(code);
  }
}

function assertNonEmptyString(value: unknown, code: string): asserts value is string {
  if (typeof value !== "string" || !value.trim()) {
    throw new ActuationGateError(code);
  }
}

function isSupportedAction(action: string): boolean {
  return SUPPORTED_ACTIONS.includes(action as (typeof SUPPORTED_ACTIONS)[number]);
}

function validateActionPlan(value: unknown): ActionPlan {
  const code = "CODEX_ACTUATION_GATE_INVALID_ACTION_PLAN";
  if (!isRecord(value)) throw new ActuationGateError(code);
  if (value.helper !== "codex:closeout-action-plan") throw new ActuationGateError(code);
  if (!("version" in value)) throw new ActuationGateError(code);
  if (value.operation_mode !== "human_assisted" && value.operation_mode !== "delegated") {
    throw new ActuationGateError(code);
  }
  if (typeof value.delegated_consumption !== "boolean") throw new ActuationGateError(code);
  if (
    value.pipeline_status !== "pass" &&
    value.pipeline_status !== "needs_review" &&
    value.pipeline_status !== "fail"
  ) {
    throw new ActuationGateError(code);
  }
  if (value.plan_status !== "pass" && value.plan_status !== "needs_review" && value.plan_status !== "fail") {
    throw new ActuationGateError(code);
  }
  if (typeof value.scope !== "string") throw new ActuationGateError(code);
  assertStringOrNull(value.work_id, code);
  assertStringOrNull(value.related_pr, code);
  assertStringArray(value.requested_actions, code);
  if (typeof value.authority_boundary !== "string" || !value.authority_boundary.trim()) {
    throw new ActuationGateError(code);
  }
  if (!Array.isArray(value.action_decisions)) throw new ActuationGateError(code);

  const seenActions = new Set<string>();
  const actionDecisions = value.action_decisions.map((item) => {
    if (!isRecord(item)) throw new ActuationGateError(code);
    if (typeof item.action !== "string") throw new ActuationGateError(code);
    if (!isSupportedAction(item.action)) throw new ActuationGateError(code);
    if (seenActions.has(item.action)) throw new ActuationGateError(code);
    seenActions.add(item.action);
    if (item.decision !== "allow" && item.decision !== "needs_review" && item.decision !== "deny") {
      throw new ActuationGateError(code);
    }
    const plannedDecision = item.decision as PlannedDecision;
    if (typeof item.reason !== "string") throw new ActuationGateError(code);
    assertStringOrNull(item.required_gate, code);

    return {
      action: item.action,
      decision: plannedDecision,
      reason: item.reason,
      required_gate: item.required_gate,
    };
  });

  return {
    helper: "codex:closeout-action-plan",
    version: value.version,
    operation_mode: value.operation_mode,
    delegated_consumption: value.delegated_consumption,
    pipeline_status: value.pipeline_status,
    plan_status: value.plan_status,
    scope: value.scope,
    work_id: value.work_id,
    related_pr: value.related_pr,
    requested_actions: value.requested_actions,
    action_decisions: actionDecisions,
    authority_boundary: value.authority_boundary,
  };
}

function validateAuthorityGrant(value: unknown, actionPlan: ActionPlan, intendedAction: string): AuthorityGrant {
  const code = "CODEX_ACTUATION_GATE_INVALID_GRANT";
  if (!isRecord(value)) throw new ActuationGateError(code);
  if (value.helper !== "codex:authority-grant") throw new ActuationGateError(code);
  if (!("version" in value)) throw new ActuationGateError(code);
  assertNonEmptyString(value.grant_id, code);
  assertNonEmptyString(value.granted_by, code);
  assertNonEmptyString(value.granted_to, code);
  assertNonEmptyString(value.scope, code);
  assertStringOrNull(value.work_id, code);
  assertStringOrNull(value.related_pr, code);
  assertStringOrNull(value.expires_at, code);
  assertStringArray(value.actions, code);
  assertStringArray(value.constraints, code);
  assertStringArray(value.forbidden_actions, code);
  if (typeof value.dry_run_only !== "boolean") throw new ActuationGateError(code);
  if (typeof value.authority_boundary !== "string" || !value.authority_boundary.trim()) {
    throw new ActuationGateError(code);
  }

  const boundary = value.authority_boundary.toLowerCase();
  if (!boundary.includes("does not execute")) throw new ActuationGateError(code);
  if (!value.actions.includes(intendedAction)) throw new ActuationGateError(code);
  if (value.forbidden_actions.includes(intendedAction)) throw new ActuationGateError(code);
  if (value.scope !== actionPlan.scope) throw new ActuationGateError(code);
  if (actionPlan.work_id !== null && value.work_id !== null && value.work_id !== actionPlan.work_id) {
    throw new ActuationGateError(code);
  }
  if (actionPlan.related_pr !== null && value.related_pr !== null && value.related_pr !== actionPlan.related_pr) {
    throw new ActuationGateError(code);
  }

  return {
    helper: "codex:authority-grant",
    version: value.version,
    grant_id: value.grant_id,
    granted_by: value.granted_by,
    granted_to: value.granted_to,
    scope: value.scope,
    work_id: value.work_id,
    related_pr: value.related_pr,
    actions: value.actions,
    expires_at: value.expires_at,
    constraints: value.constraints,
    forbidden_actions: value.forbidden_actions,
    dry_run_only: value.dry_run_only,
    authority_boundary: value.authority_boundary,
  };
}

function readIntendedAction(): string {
  const action = process.env.CODEX_INTENDED_ACTION?.trim();
  if (!action) throw new ActuationGateError("CODEX_ACTUATION_GATE_MISSING_ACTION");
  return action;
}

function readOutputMode(): OutputMode {
  const value = process.env.CODEX_ACTUATION_GATE_OUTPUT?.trim() || "both";
  if (value === "summary" || value === "json" || value === "both") return value;
  throw new ActuationGateError("CODEX_ACTUATION_GATE_INVALID_OUTPUT");
}

function nextStep(gateStatus: GateStatus): string {
  if (gateStatus === "denied") return "Do not execute this action.";
  if (gateStatus === "needs_review") {
    return "Do not execute this action until the required authority gate is satisfied.";
  }
  return "This local gate is satisfied; execution still requires a separate actuation helper or human/operator process.";
}

function gateResult(
  actionPlan: ActionPlan,
  intendedAction: string,
  decision: ActionDecision | null,
  gateStatus: GateStatus,
  reason: string,
  authorityGrantRequired: boolean,
  authorityGrantPresent: boolean,
  authorityGrant: AuthorityGrant | null,
): GateResult {
  return {
    helper: "codex:actuation-gate",
    version: 1,
    operation_mode: actionPlan.operation_mode,
    delegated_consumption: actionPlan.delegated_consumption,
    pipeline_status: actionPlan.pipeline_status,
    plan_status: actionPlan.plan_status,
    intended_action: intendedAction,
    planned_decision: decision?.decision ?? null,
    gate_status: gateStatus,
    reason,
    required_gate: decision?.required_gate ?? null,
    authority_grant_required: authorityGrantRequired,
    authority_grant_present: authorityGrantPresent,
    authority_grant_valid: authorityGrant !== null,
    grant_id: authorityGrant?.grant_id ?? null,
    scope: actionPlan.scope,
    work_id: actionPlan.work_id,
    related_pr: actionPlan.related_pr,
    forbidden_actions: authorityGrant?.forbidden_actions ?? [],
    constraints: authorityGrant?.constraints ?? [],
    next_step: nextStep(gateStatus),
    authority_boundary: AUTHORITY_BOUNDARY,
  };
}

function decideGate(
  actionPlan: ActionPlan,
  intendedAction: string,
  authorityGrantPresent: boolean,
  authorityGrant: AuthorityGrant | null,
): GateResult {
  if (!isSupportedAction(intendedAction)) {
    return {
      ...gateResult(
        actionPlan,
        intendedAction,
        null,
        "denied",
        "unknown_action",
        false,
        authorityGrantPresent,
        authorityGrant,
      ),
      required_gate: "supported_action_required",
    };
  }

  const decision = actionPlan.action_decisions.find((item) => item.action === intendedAction) ?? null;
  if (decision === null) {
    return gateResult(
      actionPlan,
      intendedAction,
      null,
      "denied",
      "action_not_in_plan",
      false,
      authorityGrantPresent,
      authorityGrant,
    );
  }

  if (decision.decision === "deny") {
    return gateResult(
      actionPlan,
      intendedAction,
      decision,
      "denied",
      "plan_denied",
      false,
      authorityGrantPresent,
      authorityGrant,
    );
  }

  if (actionPlan.pipeline_status === "fail" || actionPlan.plan_status === "fail") {
    return gateResult(
      actionPlan,
      intendedAction,
      decision,
      "denied",
      "plan_failed",
      false,
      authorityGrantPresent,
      authorityGrant,
    );
  }

  const externalOrMutating = EXTERNAL_OR_MUTATING_ACTIONS.has(intendedAction);
  if (decision.decision === "allow" && decision.required_gate === null && !externalOrMutating) {
    return gateResult(
      actionPlan,
      intendedAction,
      decision,
      "gate_passed",
      "local_plan_allows_action",
      false,
      authorityGrantPresent,
      authorityGrant,
    );
  }

  if (
    (decision.decision === "needs_review" && decision.required_gate === "separate_authority_gate") ||
    (decision.decision === "allow" && externalOrMutating)
  ) {
    if (authorityGrant === null) {
      return gateResult(
        actionPlan,
        intendedAction,
        decision,
        "needs_review",
        "authority_grant_missing",
        true,
        authorityGrantPresent,
        null,
      );
    }

    return gateResult(
      actionPlan,
      intendedAction,
      decision,
      "gate_passed",
      "authority_grant_valid",
      true,
      authorityGrantPresent,
      authorityGrant,
    );
  }

  if (decision.decision === "needs_review" && decision.required_gate === "human_operator_in_loop") {
    if (authorityGrant === null) {
      return gateResult(
        actionPlan,
        intendedAction,
        decision,
        "needs_review",
        "authority_grant_missing",
        true,
        authorityGrantPresent,
        null,
      );
    }
    if (!authorityGrant.constraints.includes("human_operator_in_loop")) {
      return gateResult(
        actionPlan,
        intendedAction,
        decision,
        "needs_review",
        "human_operator_in_loop_required",
        true,
        authorityGrantPresent,
        authorityGrant,
      );
    }

    return gateResult(
      actionPlan,
      intendedAction,
      decision,
      "gate_passed",
      "authority_grant_valid",
      true,
      authorityGrantPresent,
      authorityGrant,
    );
  }

  if (decision.decision === "needs_review" && decision.required_gate === "pipeline_pass_required") {
    return gateResult(
      actionPlan,
      intendedAction,
      decision,
      "needs_review",
      "pipeline_pass_required",
      false,
      authorityGrantPresent,
      authorityGrant,
    );
  }

  return gateResult(
    actionPlan,
    intendedAction,
    decision,
    "needs_review",
    "gate_required",
    decision.required_gate !== null || externalOrMutating,
    authorityGrantPresent,
    authorityGrant,
  );
}

function renderSummary(result: GateResult): string {
  return [
    "Codex actuation gate",
    `operation_mode: ${result.operation_mode}`,
    `delegated_consumption: ${result.delegated_consumption}`,
    `pipeline_status: ${result.pipeline_status}`,
    `plan_status: ${result.plan_status}`,
    `intended_action: ${result.intended_action}`,
    `planned_decision: ${result.planned_decision ?? "Not provided."}`,
    `gate_status: ${result.gate_status}`,
    `reason: ${result.reason}`,
    `required_gate: ${result.required_gate ?? "Not provided."}`,
    `authority_grant_required: ${result.authority_grant_required}`,
    `authority_grant_present: ${result.authority_grant_present}`,
    `authority_grant_valid: ${result.authority_grant_valid}`,
    `grant_id: ${result.grant_id ?? "Not provided."}`,
    `scope: ${result.scope}`,
    `work_id: ${result.work_id ?? "Not provided."}`,
    `related_pr: ${result.related_pr ?? "Not provided."}`,
    `next_step: ${result.next_step}`,
    `authority boundary: ${result.authority_boundary}`,
    DELEGATED_NOTE,
  ].join("\n");
}

function printResult(result: GateResult, outputMode: OutputMode): void {
  if (outputMode === "summary") {
    console.log(renderSummary(result));
    return;
  }

  if (outputMode === "json") {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(renderSummary(result));
  console.log(ACTUATION_GATE_JSON_BEGIN_MARKER);
  console.log(JSON.stringify(result, null, 2));
  console.log(ACTUATION_GATE_JSON_END_MARKER);
}

async function main(): Promise<void> {
  const actionPlan = validateActionPlan(parseActionPlanJson(await readActionPlanInputText()));
  const outputMode = readOutputMode();
  const intendedAction = readIntendedAction();
  const authorityGrantText = await readAuthorityGrantInputText();
  const authorityGrantPresent = authorityGrantText !== null;
  const authorityGrant =
    authorityGrantText === null
      ? null
      : validateAuthorityGrant(parseAuthorityGrantJson(authorityGrantText), actionPlan, intendedAction);
  const result = decideGate(actionPlan, intendedAction, authorityGrantPresent, authorityGrant);
  printResult(result, outputMode);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "CODEX_ACTUATION_GATE_FAILED";
    console.error(message);
    process.exitCode = 1;
  });
}
