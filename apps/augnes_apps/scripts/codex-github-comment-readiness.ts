import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const PAYLOAD_JSON_BEGIN_MARKER = "BEGIN_AUGNES_CODEX_GITHUB_COMMENT_PAYLOAD_JSON";
const PAYLOAD_JSON_END_MARKER = "END_AUGNES_CODEX_GITHUB_COMMENT_PAYLOAD_JSON";
const GATE_JSON_BEGIN_MARKER = "BEGIN_AUGNES_CODEX_ACTUATION_GATE_JSON";
const GATE_JSON_END_MARKER = "END_AUGNES_CODEX_ACTUATION_GATE_JSON";
const PREVIEW_JSON_BEGIN_MARKER = "BEGIN_AUGNES_CODEX_ACTUATION_PREVIEW_JSON";
const PREVIEW_JSON_END_MARKER = "END_AUGNES_CODEX_ACTUATION_PREVIEW_JSON";
const GRANT_JSON_BEGIN_MARKER = "BEGIN_AUGNES_CODEX_AUTHORITY_GRANT_JSON";
const GRANT_JSON_END_MARKER = "END_AUGNES_CODEX_AUTHORITY_GRANT_JSON";
const READINESS_JSON_BEGIN_MARKER = "BEGIN_AUGNES_CODEX_GITHUB_COMMENT_READINESS_JSON";
const READINESS_JSON_END_MARKER = "END_AUGNES_CODEX_GITHUB_COMMENT_READINESS_JSON";
const GITHUB_API_HOST = ["api", "github", "com"].join(".");

const AUTHORITY_BOUNDARY =
  "The helper validates local GitHub comment preflight material only. It does not call GitHub. It does not post comments or reviews. It does not approve, merge, publish, create evidence, create proof, mutate Augnes, call providers, call OpenAI, call Augnes runtime routes, or commit/reject state. It does not grant authority. preflight_passed is not execution readiness. Any posting requires a separate implementation and gate.";

const DELEGATED_NOTE =
  "Delegated note: this readiness result may be consumed by a delegated Codex workflow, but it is local preflight material only and does not call GitHub or post a comment.";

type OutputMode = "summary" | "json" | "both";
type OperationMode = "human_assisted" | "delegated";
type GateStatus = "gate_passed" | "needs_review" | "denied";
type PreviewStatus = "ready_for_separate_actuation" | "needs_review" | "blocked";
type PreflightStatus = "preflight_passed" | "needs_review" | "blocked";
type PlannedDecision = "allow" | "needs_review" | "deny";

type Target = {
  target_ref: string;
  owner: string;
  repo: string;
  pull_number: number;
  issue_number: number;
  target_status: "present";
};

type GithubCommentPayload = {
  endpoint_preview: string;
  api_url_preview: string;
  method_preview: "would_POST";
  body_present: true;
  body_length: number;
  body_sha256: string;
  body?: string;
  dry_run_only: true;
  would_execute: false;
};

type PayloadResult = {
  helper: "codex:github-comment-payload";
  version: unknown;
  operation_mode: OperationMode;
  delegated_consumption: boolean;
  intended_action: "create_pr_comment";
  gate_status: GateStatus;
  preview_status: PreviewStatus;
  grant_id: string | null;
  scope: string;
  work_id: string | null;
  related_pr: string | null;
  target: Target;
  payload: GithubCommentPayload;
  warnings: string[];
  blockers: string[];
  dry_run_only: true;
  would_execute: false;
  requires_separate_actuation_helper: true;
  next_step: string;
  authority_boundary: string;
};

type ActuationGate = {
  helper: "codex:actuation-gate";
  intended_action: "create_pr_comment";
  gate_status: GateStatus;
  planned_decision: PlannedDecision | null;
  authority_grant_required: boolean;
  authority_grant_present: boolean;
  authority_grant_valid: boolean;
  grant_id: string | null;
  scope: string;
  work_id: string | null;
  related_pr: string | null;
};

type OperationPreview = {
  action: "create_pr_comment";
  operation_kind: "github_write";
  method_preview: "would_POST";
  target_ref: string | null;
  body_present: boolean;
  body_length: number;
  body_preview?: string;
  dry_run_only: true;
  would_execute: false;
};

type ActuationPreview = {
  helper: "codex:actuation-preview";
  intended_action: "create_pr_comment";
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
  target_status: "present" | "missing" | "not_required";
  operation_preview: OperationPreview;
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
  dry_run_only: true;
  authority_boundary: string;
};

type ConsistencyCheck = {
  checked: boolean;
  ok: boolean;
  warnings: string[];
  blockers: string[];
};

type ConsistencyChecks = {
  payload_internal: ConsistencyCheck;
  gate_consistency: ConsistencyCheck;
  preview_consistency: ConsistencyCheck;
  grant_consistency: ConsistencyCheck;
};

type ReadinessResult = {
  helper: "codex:github-comment-readiness";
  version: 1;
  operation_mode: OperationMode;
  delegated_consumption: boolean;
  intended_action: "create_pr_comment";
  preflight_status: PreflightStatus;
  gate_status: GateStatus;
  preview_status: PreviewStatus;
  grant_id: string | null;
  scope: string;
  work_id: string | null;
  related_pr: string | null;
  target: Omit<Target, "target_status">;
  payload_fingerprint: {
    endpoint_preview: string;
    api_url_preview: string;
    method_preview: "would_POST";
    body_length: number;
    body_sha256: string;
  };
  consistency_checks: ConsistencyChecks;
  warnings: string[];
  blockers: string[];
  dry_run_only: true;
  would_execute: false;
  requires_separate_actuation_helper: true;
  next_step: string;
  authority_boundary: string;
};

class GithubCommentReadinessError extends Error {}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function readPrimaryPayloadInputText(): Promise<string> {
  const inline = process.env.CODEX_GITHUB_COMMENT_PAYLOAD_JSON;
  if (inline !== undefined) {
    if (!inline.trim()) throw new GithubCommentReadinessError("CODEX_GITHUB_COMMENT_READINESS_MISSING_PAYLOAD_INPUT");
    return inline;
  }

  const filePath = process.env.CODEX_GITHUB_COMMENT_PAYLOAD_JSON_FILE;
  if (filePath !== undefined) {
    if (!filePath.trim()) {
      throw new GithubCommentReadinessError("CODEX_GITHUB_COMMENT_READINESS_MISSING_PAYLOAD_INPUT");
    }
    const content = await readFile(filePath, "utf8");
    if (!content.trim()) throw new GithubCommentReadinessError("CODEX_GITHUB_COMMENT_READINESS_MISSING_PAYLOAD_INPUT");
    return content;
  }

  if (process.stdin.isTTY) {
    throw new GithubCommentReadinessError("CODEX_GITHUB_COMMENT_READINESS_MISSING_PAYLOAD_INPUT");
  }

  const stdin = await readStdin();
  if (!stdin.trim()) throw new GithubCommentReadinessError("CODEX_GITHUB_COMMENT_READINESS_MISSING_PAYLOAD_INPUT");
  return stdin;
}

async function readOptionalInputText(envName: string, fileEnvName: string, invalidCode: string): Promise<string | null> {
  const inline = process.env[envName];
  if (inline !== undefined) {
    if (!inline.trim()) throw new GithubCommentReadinessError(invalidCode);
    return inline;
  }

  const filePath = process.env[fileEnvName];
  if (filePath !== undefined) {
    if (!filePath.trim()) throw new GithubCommentReadinessError(invalidCode);
    const content = await readFile(filePath, "utf8");
    if (!content.trim()) throw new GithubCommentReadinessError(invalidCode);
    return content;
  }

  return null;
}

function extractJsonText(input: string, beginMarker: string, endMarker: string, invalidCode: string): string {
  const begin = input.indexOf(beginMarker);
  const end = input.indexOf(endMarker);
  if (begin !== -1 || end !== -1) {
    if (begin === -1 || end === -1 || end <= begin) {
      throw new GithubCommentReadinessError(invalidCode);
    }
    return input.slice(begin + beginMarker.length, end).trim();
  }

  return input.trim();
}

function parseJson(input: string, beginMarker: string, endMarker: string, invalidCode: string): unknown {
  try {
    return JSON.parse(extractJsonText(input, beginMarker, endMarker, invalidCode)) as unknown;
  } catch (error) {
    if (error instanceof GithubCommentReadinessError) throw error;
    throw new GithubCommentReadinessError(invalidCode);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertStringArray(value: unknown, code: string): asserts value is string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new GithubCommentReadinessError(code);
  }
}

function assertStringOrNull(value: unknown, code: string): asserts value is string | null {
  if (value !== null && typeof value !== "string") {
    throw new GithubCommentReadinessError(code);
  }
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function validatePayload(value: unknown): PayloadResult {
  const code = "CODEX_GITHUB_COMMENT_READINESS_INVALID_PAYLOAD";
  if (!isRecord(value)) throw new GithubCommentReadinessError(code);
  if (value.helper !== "codex:github-comment-payload") throw new GithubCommentReadinessError(code);
  if (!("version" in value)) throw new GithubCommentReadinessError(code);
  if (value.operation_mode !== "human_assisted" && value.operation_mode !== "delegated") {
    throw new GithubCommentReadinessError(code);
  }
  if (typeof value.delegated_consumption !== "boolean") throw new GithubCommentReadinessError(code);
  if (value.intended_action !== "create_pr_comment") throw new GithubCommentReadinessError(code);
  if (value.gate_status !== "gate_passed" && value.gate_status !== "needs_review" && value.gate_status !== "denied") {
    throw new GithubCommentReadinessError(code);
  }
  if (
    value.preview_status !== "ready_for_separate_actuation" &&
    value.preview_status !== "needs_review" &&
    value.preview_status !== "blocked"
  ) {
    throw new GithubCommentReadinessError(code);
  }
  assertStringOrNull(value.grant_id, code);
  if (typeof value.scope !== "string") throw new GithubCommentReadinessError(code);
  assertStringOrNull(value.work_id, code);
  assertStringOrNull(value.related_pr, code);
  if (!isRecord(value.target)) throw new GithubCommentReadinessError(code);
  if (!isRecord(value.payload)) throw new GithubCommentReadinessError(code);
  assertStringArray(value.warnings, code);
  assertStringArray(value.blockers, code);
  if (value.dry_run_only !== true) throw new GithubCommentReadinessError(code);
  if (value.would_execute !== false) throw new GithubCommentReadinessError(code);
  if (value.requires_separate_actuation_helper !== true) throw new GithubCommentReadinessError(code);
  if (typeof value.next_step !== "string") throw new GithubCommentReadinessError(code);
  if (typeof value.authority_boundary !== "string" || !value.authority_boundary.trim()) {
    throw new GithubCommentReadinessError(code);
  }

  return {
    helper: "codex:github-comment-payload",
    version: value.version,
    operation_mode: value.operation_mode,
    delegated_consumption: value.delegated_consumption,
    intended_action: "create_pr_comment",
    gate_status: value.gate_status,
    preview_status: value.preview_status,
    grant_id: value.grant_id,
    scope: value.scope,
    work_id: value.work_id,
    related_pr: value.related_pr,
    target: validateTarget(value.target),
    payload: validateCommentPayload(value.payload),
    warnings: value.warnings,
    blockers: value.blockers,
    dry_run_only: true,
    would_execute: false,
    requires_separate_actuation_helper: true,
    next_step: value.next_step,
    authority_boundary: value.authority_boundary,
  };
}

function validateTarget(value: Record<string, unknown>): Target {
  const code = "CODEX_GITHUB_COMMENT_READINESS_INVALID_PAYLOAD";
  if (typeof value.target_ref !== "string") throw new GithubCommentReadinessError(code);
  if (typeof value.owner !== "string") throw new GithubCommentReadinessError(code);
  if (typeof value.repo !== "string") throw new GithubCommentReadinessError(code);
  if (!isPositiveInteger(value.pull_number)) throw new GithubCommentReadinessError(code);
  if (!isPositiveInteger(value.issue_number)) throw new GithubCommentReadinessError(code);
  if (value.target_status !== "present") throw new GithubCommentReadinessError(code);

  return {
    target_ref: value.target_ref,
    owner: validateTargetSegment(value.owner),
    repo: validateTargetSegment(value.repo),
    pull_number: value.pull_number,
    issue_number: value.issue_number,
    target_status: "present",
  };
}

function validateCommentPayload(value: Record<string, unknown>): GithubCommentPayload {
  const code = "CODEX_GITHUB_COMMENT_READINESS_INVALID_PAYLOAD";
  if (typeof value.endpoint_preview !== "string") throw new GithubCommentReadinessError(code);
  if (typeof value.api_url_preview !== "string") throw new GithubCommentReadinessError(code);
  if (value.method_preview !== "would_POST") throw new GithubCommentReadinessError(code);
  if (value.body_present !== true) throw new GithubCommentReadinessError(code);
  if (!isPositiveInteger(value.body_length)) throw new GithubCommentReadinessError(code);
  if (typeof value.body_sha256 !== "string") throw new GithubCommentReadinessError(code);
  if (value.body !== undefined && typeof value.body !== "string") throw new GithubCommentReadinessError(code);
  if (value.dry_run_only !== true) throw new GithubCommentReadinessError(code);
  if (value.would_execute !== false) throw new GithubCommentReadinessError(code);

  return {
    endpoint_preview: value.endpoint_preview,
    api_url_preview: value.api_url_preview,
    method_preview: "would_POST",
    body_present: true,
    body_length: value.body_length,
    body_sha256: value.body_sha256,
    ...(value.body === undefined ? {} : { body: value.body }),
    dry_run_only: true,
    would_execute: false,
  };
}

function validateTargetSegment(value: string): string {
  if (!value || /[\s/#?]/.test(value) || /[\u0000-\u001F\u007F]/.test(value)) {
    throw new GithubCommentReadinessError("CODEX_GITHUB_COMMENT_READINESS_INVALID_PAYLOAD");
  }
  return value;
}

function validateGate(value: unknown): ActuationGate {
  const code = "CODEX_GITHUB_COMMENT_READINESS_INVALID_GATE";
  if (!isRecord(value)) throw new GithubCommentReadinessError(code);
  if (value.helper !== "codex:actuation-gate") throw new GithubCommentReadinessError(code);
  if (value.intended_action !== "create_pr_comment") throw new GithubCommentReadinessError(code);
  if (value.gate_status !== "gate_passed" && value.gate_status !== "needs_review" && value.gate_status !== "denied") {
    throw new GithubCommentReadinessError(code);
  }
  if (
    value.planned_decision !== "allow" &&
    value.planned_decision !== "needs_review" &&
    value.planned_decision !== "deny" &&
    value.planned_decision !== null
  ) {
    throw new GithubCommentReadinessError(code);
  }
  if (typeof value.authority_grant_required !== "boolean") throw new GithubCommentReadinessError(code);
  if (typeof value.authority_grant_present !== "boolean") throw new GithubCommentReadinessError(code);
  if (typeof value.authority_grant_valid !== "boolean") throw new GithubCommentReadinessError(code);
  assertStringOrNull(value.grant_id, code);
  if (typeof value.scope !== "string") throw new GithubCommentReadinessError(code);
  assertStringOrNull(value.work_id, code);
  assertStringOrNull(value.related_pr, code);

  return {
    helper: "codex:actuation-gate",
    intended_action: "create_pr_comment",
    gate_status: value.gate_status,
    planned_decision: value.planned_decision,
    authority_grant_required: value.authority_grant_required,
    authority_grant_present: value.authority_grant_present,
    authority_grant_valid: value.authority_grant_valid,
    grant_id: value.grant_id,
    scope: value.scope,
    work_id: value.work_id,
    related_pr: value.related_pr,
  };
}

function validatePreview(value: unknown): ActuationPreview {
  const code = "CODEX_GITHUB_COMMENT_READINESS_INVALID_PREVIEW";
  if (!isRecord(value)) throw new GithubCommentReadinessError(code);
  if (value.helper !== "codex:actuation-preview") throw new GithubCommentReadinessError(code);
  if (value.intended_action !== "create_pr_comment") throw new GithubCommentReadinessError(code);
  if (value.gate_status !== "gate_passed" && value.gate_status !== "needs_review" && value.gate_status !== "denied") {
    throw new GithubCommentReadinessError(code);
  }
  if (
    value.preview_status !== "ready_for_separate_actuation" &&
    value.preview_status !== "needs_review" &&
    value.preview_status !== "blocked"
  ) {
    throw new GithubCommentReadinessError(code);
  }
  if (typeof value.execution_permitted_by_gate !== "boolean") throw new GithubCommentReadinessError(code);
  if (value.dry_run_only !== true) throw new GithubCommentReadinessError(code);
  if (value.would_execute !== false) throw new GithubCommentReadinessError(code);
  if (value.requires_separate_actuation_helper !== true) throw new GithubCommentReadinessError(code);
  assertStringOrNull(value.grant_id, code);
  if (typeof value.scope !== "string") throw new GithubCommentReadinessError(code);
  assertStringOrNull(value.work_id, code);
  assertStringOrNull(value.related_pr, code);
  if (
    value.target_status !== "present" &&
    value.target_status !== "missing" &&
    value.target_status !== "not_required"
  ) {
    throw new GithubCommentReadinessError(code);
  }
  if (!isRecord(value.operation_preview)) throw new GithubCommentReadinessError(code);

  return {
    helper: "codex:actuation-preview",
    intended_action: "create_pr_comment",
    gate_status: value.gate_status,
    preview_status: value.preview_status,
    execution_permitted_by_gate: value.execution_permitted_by_gate,
    dry_run_only: true,
    would_execute: false,
    requires_separate_actuation_helper: true,
    grant_id: value.grant_id,
    scope: value.scope,
    work_id: value.work_id,
    related_pr: value.related_pr,
    target_status: value.target_status,
    operation_preview: validateOperationPreview(value.operation_preview),
  };
}

function validateOperationPreview(value: Record<string, unknown>): OperationPreview {
  const code = "CODEX_GITHUB_COMMENT_READINESS_INVALID_PREVIEW";
  if (value.action !== "create_pr_comment") throw new GithubCommentReadinessError(code);
  if (value.operation_kind !== "github_write") throw new GithubCommentReadinessError(code);
  if (value.method_preview !== "would_POST") throw new GithubCommentReadinessError(code);
  assertStringOrNull(value.target_ref, code);
  if (typeof value.body_present !== "boolean") throw new GithubCommentReadinessError(code);
  if (typeof value.body_length !== "number" || !Number.isFinite(value.body_length) || value.body_length < 0) {
    throw new GithubCommentReadinessError(code);
  }
  if (value.body_preview !== undefined && typeof value.body_preview !== "string") {
    throw new GithubCommentReadinessError(code);
  }
  if (value.dry_run_only !== true) throw new GithubCommentReadinessError(code);
  if (value.would_execute !== false) throw new GithubCommentReadinessError(code);

  return {
    action: "create_pr_comment",
    operation_kind: "github_write",
    method_preview: "would_POST",
    target_ref: value.target_ref,
    body_present: value.body_present,
    body_length: value.body_length,
    ...(value.body_preview === undefined ? {} : { body_preview: value.body_preview }),
    dry_run_only: true,
    would_execute: false,
  };
}

function validateGrant(value: unknown): AuthorityGrant {
  const code = "CODEX_GITHUB_COMMENT_READINESS_INVALID_GRANT";
  if (!isRecord(value)) throw new GithubCommentReadinessError(code);
  if (value.helper !== "codex:authority-grant") throw new GithubCommentReadinessError(code);
  if (!("version" in value)) throw new GithubCommentReadinessError(code);
  if (typeof value.grant_id !== "string" || !value.grant_id.trim()) throw new GithubCommentReadinessError(code);
  if (typeof value.granted_by !== "string" || !value.granted_by.trim()) throw new GithubCommentReadinessError(code);
  if (typeof value.granted_to !== "string" || !value.granted_to.trim()) throw new GithubCommentReadinessError(code);
  if (typeof value.scope !== "string" || !value.scope.trim()) throw new GithubCommentReadinessError(code);
  assertStringOrNull(value.work_id, code);
  assertStringOrNull(value.related_pr, code);
  assertStringArray(value.actions, code);
  assertStringOrNull(value.expires_at, code);
  assertStringArray(value.constraints, code);
  assertStringArray(value.forbidden_actions, code);
  if (value.dry_run_only !== true) throw new GithubCommentReadinessError(code);
  if (
    typeof value.authority_boundary !== "string" ||
    !value.authority_boundary.toLowerCase().includes("does not execute")
  ) {
    throw new GithubCommentReadinessError(code);
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
    dry_run_only: true,
    authority_boundary: value.authority_boundary,
  };
}

function readOutputMode(): OutputMode {
  const value = process.env.CODEX_GITHUB_COMMENT_READINESS_OUTPUT?.trim() || "both";
  if (value === "summary" || value === "json" || value === "both") return value;
  throw new GithubCommentReadinessError("CODEX_GITHUB_COMMENT_READINESS_INVALID_OUTPUT");
}

function readBooleanEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  const value = raw.trim();
  if (value === "true") return true;
  if (value === "false") return false;
  throw new GithubCommentReadinessError(`CODEX_GITHUB_COMMENT_READINESS_INVALID_BOOLEAN ${name}`);
}

function check(checked: boolean): ConsistencyCheck {
  return { checked, ok: true, warnings: [], blockers: [] };
}

function addBlocker(checkResult: ConsistencyCheck, blocker: string): void {
  checkResult.ok = false;
  checkResult.blockers.push(blocker);
}

function addWarning(checkResult: ConsistencyCheck, warning: string): void {
  checkResult.warnings.push(warning);
}

function payloadInternalCheck(payload: PayloadResult): ConsistencyCheck {
  const result = check(true);
  const target = payload.target;
  const preview = payload.payload;
  const expectedEndpoint = `POST /repos/${target.owner}/${target.repo}/issues/${target.issue_number}/comments`;
  const expectedApiUrl = `https://${GITHUB_API_HOST}/repos/${encodeURIComponent(target.owner)}/${encodeURIComponent(
    target.repo,
  )}/issues/${target.issue_number}/comments`;

  if (payload.intended_action !== "create_pr_comment") addBlocker(result, "payload_action_mismatch");
  if (preview.method_preview !== "would_POST") addBlocker(result, "payload_method_mismatch");
  if (preview.dry_run_only !== true || preview.would_execute !== false) {
    addBlocker(result, "payload_dry_run_inconsistent");
  }
  if (payload.dry_run_only !== true || payload.would_execute !== false || payload.requires_separate_actuation_helper !== true) {
    addBlocker(result, "payload_top_level_dry_run_inconsistent");
  }
  if (target.issue_number !== target.pull_number) addBlocker(result, "target_issue_number_mismatch");
  if (preview.endpoint_preview !== expectedEndpoint) addBlocker(result, "endpoint_preview_mismatch");
  if (preview.api_url_preview !== expectedApiUrl) addBlocker(result, "api_url_preview_mismatch");
  if (!/^[a-f0-9]{64}$/.test(preview.body_sha256)) addBlocker(result, "body_sha256_invalid");
  if (!Number.isSafeInteger(preview.body_length) || preview.body_length <= 0) addBlocker(result, "body_length_invalid");
  if (preview.body !== undefined && preview.body.length !== preview.body_length) {
    addBlocker(result, "payload_body_length_mismatch");
  }
  if (preview.body !== undefined && createHash("sha256").update(preview.body).digest("hex") !== preview.body_sha256) {
    addBlocker(result, "payload_body_hash_mismatch");
  }
  return result;
}

function gateConsistencyCheck(payload: PayloadResult, gate: ActuationGate | null): ConsistencyCheck {
  const result = check(gate !== null);
  if (gate === null) {
    addWarning(result, "gate_input_missing");
    return result;
  }

  if (gate.intended_action !== payload.intended_action) addBlocker(result, "gate_intended_action_mismatch");
  if (gate.gate_status !== payload.gate_status) addBlocker(result, "gate_status_mismatch");
  if (gate.grant_id !== null && payload.grant_id !== null && gate.grant_id !== payload.grant_id) {
    addBlocker(result, "gate_grant_id_mismatch");
  }
  if (gate.scope !== payload.scope) addBlocker(result, "gate_scope_mismatch");
  if (gate.work_id !== payload.work_id) addBlocker(result, "gate_work_id_mismatch");
  if (gate.related_pr !== payload.related_pr) addBlocker(result, "gate_related_pr_mismatch");
  if (gate.authority_grant_required && payload.grant_id === null) {
    addBlocker(result, "gate_authority_grant_required_without_payload_grant");
  }
  if (gate.gate_status !== "gate_passed" && payload.gate_status === "gate_passed") {
    addBlocker(result, "gate_not_passed_payload_passed");
  }
  return result;
}

function previewConsistencyCheck(payload: PayloadResult, preview: ActuationPreview | null): ConsistencyCheck {
  const result = check(preview !== null);
  if (preview === null) {
    addWarning(result, "preview_input_missing");
    return result;
  }

  if (preview.intended_action !== payload.intended_action) addBlocker(result, "preview_intended_action_mismatch");
  if (preview.gate_status !== payload.gate_status) addBlocker(result, "preview_gate_status_mismatch");
  if (preview.preview_status !== payload.preview_status) addBlocker(result, "preview_status_mismatch");
  if (preview.grant_id !== null && payload.grant_id !== null && preview.grant_id !== payload.grant_id) {
    addBlocker(result, "preview_grant_id_mismatch");
  }
  if (preview.scope !== payload.scope) addBlocker(result, "preview_scope_mismatch");
  if (preview.work_id !== payload.work_id) addBlocker(result, "preview_work_id_mismatch");
  if (preview.related_pr !== payload.related_pr) addBlocker(result, "preview_related_pr_mismatch");
  if (preview.operation_preview.target_ref !== null && preview.operation_preview.target_ref !== payload.target.target_ref) {
    addBlocker(result, "preview_target_ref_mismatch");
  }
  if (preview.operation_preview.body_present && preview.operation_preview.body_length !== payload.payload.body_length) {
    addBlocker(result, "preview_body_length_mismatch");
  }
  if (
    preview.operation_preview.body_preview !== undefined &&
    createHash("sha256").update(preview.operation_preview.body_preview).digest("hex") !== payload.payload.body_sha256
  ) {
    addBlocker(result, "preview_body_hash_mismatch");
  }
  if (
    preview.dry_run_only !== true ||
    preview.would_execute !== false ||
    preview.requires_separate_actuation_helper !== true ||
    preview.operation_preview.dry_run_only !== true ||
    preview.operation_preview.would_execute !== false
  ) {
    addBlocker(result, "preview_dry_run_inconsistent");
  }
  return result;
}

function grantConsistencyCheck(payload: PayloadResult, grant: AuthorityGrant | null): ConsistencyCheck {
  const result = check(grant !== null);
  if (grant === null) {
    addWarning(result, "authority_grant_input_missing");
    return result;
  }

  if (payload.grant_id !== grant.grant_id) addBlocker(result, "grant_id_mismatch");
  if (!grant.actions.includes("create_pr_comment")) addBlocker(result, "grant_missing_create_pr_comment");
  if (grant.forbidden_actions.includes("create_pr_comment")) addBlocker(result, "grant_forbids_create_pr_comment");
  if (grant.scope !== payload.scope) addBlocker(result, "grant_scope_mismatch");
  if (payload.work_id !== null && grant.work_id !== null && grant.work_id !== payload.work_id) {
    addBlocker(result, "grant_work_id_mismatch");
  }
  if (payload.related_pr !== null && grant.related_pr !== null && grant.related_pr !== payload.related_pr) {
    addBlocker(result, "grant_related_pr_mismatch");
  }
  if (grant.dry_run_only !== true) addBlocker(result, "grant_dry_run_inconsistent");
  if (!grant.constraints.includes("dry_run_only")) addBlocker(result, "grant_missing_dry_run_only_constraint");
  return result;
}

function flattenWarnings(checks: ConsistencyChecks): string[] {
  return unique([
    ...checks.payload_internal.warnings,
    ...checks.gate_consistency.warnings,
    ...checks.preview_consistency.warnings,
    ...checks.grant_consistency.warnings,
  ]);
}

function flattenBlockers(checks: ConsistencyChecks): string[] {
  return unique([
    ...checks.payload_internal.blockers,
    ...checks.gate_consistency.blockers,
    ...checks.preview_consistency.blockers,
    ...checks.grant_consistency.blockers,
  ]);
}

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    deduped.push(value);
  }
  return deduped;
}

function baseStatus(payload: PayloadResult): PreflightStatus {
  if (payload.gate_status === "denied" || payload.preview_status === "blocked" || payload.blockers.length > 0) {
    return "blocked";
  }
  if (payload.gate_status === "needs_review" || payload.preview_status === "needs_review") {
    return "needs_review";
  }
  return "preflight_passed";
}

function nextStep(status: PreflightStatus): string {
  if (status === "preflight_passed") {
    return "Local preflight checks passed. Posting still requires a separate authority-gated actuation helper or human/operator process.";
  }
  if (status === "needs_review") {
    return "Do not post. Resolve local preflight warnings or missing chain material before any separate posting layer.";
  }
  return "Do not post. Resolve local preflight blockers before any separate posting layer.";
}

function buildStatus(payload: PayloadResult, warnings: string[], blockers: string[], requireFullChain: boolean): PreflightStatus {
  const initialStatus = baseStatus(payload);
  if (blockers.length > 0 || initialStatus === "blocked") return "blocked";
  if (initialStatus === "needs_review") return "needs_review";
  if (
    requireFullChain &&
    (warnings.includes("gate_input_missing") ||
      warnings.includes("preview_input_missing") ||
      warnings.includes("authority_grant_input_missing"))
  ) {
    return "needs_review";
  }
  return "preflight_passed";
}

function buildResult(
  payload: PayloadResult,
  gate: ActuationGate | null,
  preview: ActuationPreview | null,
  grant: AuthorityGrant | null,
  requireFullChain: boolean,
): ReadinessResult {
  const consistencyChecks: ConsistencyChecks = {
    payload_internal: payloadInternalCheck(payload),
    gate_consistency: gateConsistencyCheck(payload, gate),
    preview_consistency: previewConsistencyCheck(payload, preview),
    grant_consistency: grantConsistencyCheck(payload, grant),
  };

  const warnings = unique([...payload.warnings, ...flattenWarnings(consistencyChecks)]);
  const blockers = unique([...payload.blockers, ...flattenBlockers(consistencyChecks)]);
  const preflightStatus = buildStatus(payload, warnings, blockers, requireFullChain);

  return {
    helper: "codex:github-comment-readiness",
    version: 1,
    operation_mode: payload.operation_mode,
    delegated_consumption: payload.delegated_consumption,
    intended_action: "create_pr_comment",
    preflight_status: preflightStatus,
    gate_status: payload.gate_status,
    preview_status: payload.preview_status,
    grant_id: payload.grant_id,
    scope: payload.scope,
    work_id: payload.work_id,
    related_pr: payload.related_pr,
    target: {
      target_ref: payload.target.target_ref,
      owner: payload.target.owner,
      repo: payload.target.repo,
      pull_number: payload.target.pull_number,
      issue_number: payload.target.issue_number,
    },
    payload_fingerprint: {
      endpoint_preview: payload.payload.endpoint_preview,
      api_url_preview: payload.payload.api_url_preview,
      method_preview: payload.payload.method_preview,
      body_length: payload.payload.body_length,
      body_sha256: payload.payload.body_sha256,
    },
    consistency_checks: consistencyChecks,
    warnings,
    blockers,
    dry_run_only: true,
    would_execute: false,
    requires_separate_actuation_helper: true,
    next_step: nextStep(preflightStatus),
    authority_boundary: AUTHORITY_BOUNDARY,
  };
}

function renderLabels(labels: string[]): string {
  return labels.length > 0 ? labels.join(",") : "none";
}

function renderConsistencyCheck(name: keyof ConsistencyChecks, checkResult: ConsistencyCheck): string {
  return `- ${name}: checked=${checkResult.checked} ok=${checkResult.ok} warnings=${renderLabels(
    checkResult.warnings,
  )} blockers=${renderLabels(checkResult.blockers)}`;
}

function renderConsistencyChecks(checks: ConsistencyChecks): string[] {
  return [
    "consistency_checks:",
    renderConsistencyCheck("payload_internal", checks.payload_internal),
    renderConsistencyCheck("gate_consistency", checks.gate_consistency),
    renderConsistencyCheck("preview_consistency", checks.preview_consistency),
    renderConsistencyCheck("grant_consistency", checks.grant_consistency),
  ];
}

function renderSummary(result: ReadinessResult, requireFullChain: boolean): string {
  return [
    "Codex GitHub comment readiness",
    `operation_mode: ${result.operation_mode}`,
    `delegated_consumption: ${result.delegated_consumption}`,
    `intended_action: ${result.intended_action}`,
    `preflight_status: ${result.preflight_status}`,
    `gate_status: ${result.gate_status}`,
    `preview_status: ${result.preview_status}`,
    `grant_id: ${result.grant_id ?? "Not provided."}`,
    `scope: ${result.scope}`,
    `work_id: ${result.work_id ?? "Not provided."}`,
    `related_pr: ${result.related_pr ?? "Not provided."}`,
    `target_ref: ${result.target.target_ref}`,
    `owner: ${result.target.owner}`,
    `repo: ${result.target.repo}`,
    `issue_number: ${result.target.issue_number}`,
    `endpoint_preview: ${result.payload_fingerprint.endpoint_preview}`,
    `body_length: ${result.payload_fingerprint.body_length}`,
    `body_sha256: ${result.payload_fingerprint.body_sha256}`,
    `full_chain_required: ${requireFullChain}`,
    `dry_run_only: ${result.dry_run_only}`,
    `would_execute: ${result.would_execute}`,
    `requires_separate_actuation_helper: ${result.requires_separate_actuation_helper}`,
    `warnings count: ${result.warnings.length}`,
    `blockers count: ${result.blockers.length}`,
    ...renderConsistencyChecks(result.consistency_checks),
    `next_step: ${result.next_step}`,
    `authority boundary: ${result.authority_boundary}`,
    DELEGATED_NOTE,
  ].join("\n");
}

function printResult(result: ReadinessResult, outputMode: OutputMode, requireFullChain: boolean): void {
  if (outputMode === "summary") {
    console.log(renderSummary(result, requireFullChain));
    return;
  }

  if (outputMode === "json") {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(renderSummary(result, requireFullChain));
  console.log(READINESS_JSON_BEGIN_MARKER);
  console.log(JSON.stringify(result, null, 2));
  console.log(READINESS_JSON_END_MARKER);
}

async function main(): Promise<void> {
  const outputMode = readOutputMode();
  const requireFullChain = readBooleanEnv("CODEX_GITHUB_COMMENT_READINESS_REQUIRE_FULL_CHAIN", false);
  const payload = validatePayload(
    parseJson(
      await readPrimaryPayloadInputText(),
      PAYLOAD_JSON_BEGIN_MARKER,
      PAYLOAD_JSON_END_MARKER,
      "CODEX_GITHUB_COMMENT_READINESS_INVALID_JSON",
    ),
  );
  const gateText = await readOptionalInputText(
    "CODEX_ACTUATION_GATE_JSON",
    "CODEX_ACTUATION_GATE_JSON_FILE",
    "CODEX_GITHUB_COMMENT_READINESS_INVALID_GATE_JSON",
  );
  const previewText = await readOptionalInputText(
    "CODEX_ACTUATION_PREVIEW_JSON",
    "CODEX_ACTUATION_PREVIEW_JSON_FILE",
    "CODEX_GITHUB_COMMENT_READINESS_INVALID_PREVIEW_JSON",
  );
  const grantText = await readOptionalInputText(
    "CODEX_AUTHORITY_GRANT_JSON",
    "CODEX_AUTHORITY_GRANT_JSON_FILE",
    "CODEX_GITHUB_COMMENT_READINESS_INVALID_GRANT_JSON",
  );

  const gate =
    gateText === null
      ? null
      : validateGate(
          parseJson(gateText, GATE_JSON_BEGIN_MARKER, GATE_JSON_END_MARKER, "CODEX_GITHUB_COMMENT_READINESS_INVALID_GATE_JSON"),
        );
  const preview =
    previewText === null
      ? null
      : validatePreview(
          parseJson(
            previewText,
            PREVIEW_JSON_BEGIN_MARKER,
            PREVIEW_JSON_END_MARKER,
            "CODEX_GITHUB_COMMENT_READINESS_INVALID_PREVIEW_JSON",
          ),
        );
  const grant =
    grantText === null
      ? null
      : validateGrant(
          parseJson(grantText, GRANT_JSON_BEGIN_MARKER, GRANT_JSON_END_MARKER, "CODEX_GITHUB_COMMENT_READINESS_INVALID_GRANT_JSON"),
        );
  const result = buildResult(payload, gate, preview, grant, requireFullChain);
  printResult(result, outputMode, requireFullChain);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "CODEX_GITHUB_COMMENT_READINESS_FAILED";
    console.error(message);
    process.exitCode = 1;
  });
}
