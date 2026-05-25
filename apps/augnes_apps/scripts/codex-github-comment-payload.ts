import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const PREVIEW_JSON_BEGIN_MARKER = "BEGIN_AUGNES_CODEX_ACTUATION_PREVIEW_JSON";
const PREVIEW_JSON_END_MARKER = "END_AUGNES_CODEX_ACTUATION_PREVIEW_JSON";
const PAYLOAD_JSON_BEGIN_MARKER = "BEGIN_AUGNES_CODEX_GITHUB_COMMENT_PAYLOAD_JSON";
const PAYLOAD_JSON_END_MARKER = "END_AUGNES_CODEX_GITHUB_COMMENT_PAYLOAD_JSON";

const NEXT_STEP =
  "Dry-run GitHub comment payload is rendered. Posting still requires a separate authority-gated actuation helper or human/operator process.";

const AUTHORITY_BOUNDARY =
  "The helper renders a GitHub comment payload preview only. It does not call GitHub. It does not post comments or reviews. It does not approve, merge, publish, create evidence, create proof, mutate Augnes, call providers, call OpenAI, call Augnes runtime routes, or commit/reject state. It does not grant authority. gate_passed and rendered payload are not execution. Any posting requires a separate implementation and gate.";

const DELEGATED_NOTE =
  "Delegated note: this payload may be consumed by a delegated Codex workflow, but it is dry-run-only and does not call GitHub or post a comment.";

type OutputMode = "summary" | "json" | "both";
type OperationMode = "human_assisted" | "delegated";
type PipelineStatus = "pass" | "needs_review" | "fail";
type PlanStatus = "pass" | "needs_review" | "fail";
type GateStatus = "gate_passed" | "needs_review" | "denied";
type PreviewStatus = "ready_for_separate_actuation" | "needs_review" | "blocked";
type TargetStatus = "present" | "missing" | "not_required";

type OperationPreview = {
  action: string;
  operation_kind: string;
  target_ref: string | null;
  method_preview: string;
  payload_keys: string[];
  body_present: boolean;
  body_length: number;
  body_preview?: string;
  dry_run_only: boolean;
  would_execute: boolean;
};

type ActuationPreview = {
  helper: "codex:actuation-preview";
  version: unknown;
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

type Target = {
  target_ref: string;
  owner: string;
  repo: string;
  pull_number: number;
  issue_number: number;
  target_status: "present";
};

type CommentPayload = {
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

type CommentPayloadResult = {
  helper: "codex:github-comment-payload";
  version: 1;
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
  payload: CommentPayload;
  warnings: string[];
  blockers: string[];
  dry_run_only: true;
  would_execute: false;
  requires_separate_actuation_helper: true;
  next_step: string;
  authority_boundary: string;
};

class GithubCommentPayloadError extends Error {}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function readPreviewInputText(): Promise<string> {
  const inline = process.env.CODEX_ACTUATION_PREVIEW_JSON;
  if (inline !== undefined) {
    if (!inline.trim()) throw new GithubCommentPayloadError("CODEX_GITHUB_COMMENT_PAYLOAD_MISSING_INPUT");
    return inline;
  }

  const filePath = process.env.CODEX_ACTUATION_PREVIEW_JSON_FILE;
  if (filePath !== undefined) {
    if (!filePath.trim()) throw new GithubCommentPayloadError("CODEX_GITHUB_COMMENT_PAYLOAD_MISSING_INPUT");
    const content = await readFile(filePath, "utf8");
    if (!content.trim()) throw new GithubCommentPayloadError("CODEX_GITHUB_COMMENT_PAYLOAD_MISSING_INPUT");
    return content;
  }

  if (process.stdin.isTTY) {
    throw new GithubCommentPayloadError("CODEX_GITHUB_COMMENT_PAYLOAD_MISSING_INPUT");
  }

  const stdin = await readStdin();
  if (!stdin.trim()) throw new GithubCommentPayloadError("CODEX_GITHUB_COMMENT_PAYLOAD_MISSING_INPUT");
  return stdin;
}

function extractPreviewJsonText(input: string): string {
  const begin = input.indexOf(PREVIEW_JSON_BEGIN_MARKER);
  const end = input.indexOf(PREVIEW_JSON_END_MARKER);
  if (begin !== -1 || end !== -1) {
    if (begin === -1 || end === -1 || end <= begin) {
      throw new GithubCommentPayloadError("CODEX_GITHUB_COMMENT_PAYLOAD_INVALID_JSON");
    }

    return input.slice(begin + PREVIEW_JSON_BEGIN_MARKER.length, end).trim();
  }

  return input.trim();
}

function parsePreviewJson(input: string): unknown {
  try {
    return JSON.parse(extractPreviewJsonText(input)) as unknown;
  } catch (error) {
    if (error instanceof GithubCommentPayloadError) throw error;
    throw new GithubCommentPayloadError("CODEX_GITHUB_COMMENT_PAYLOAD_INVALID_JSON");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertStringArray(value: unknown, code: string): asserts value is string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new GithubCommentPayloadError(code);
  }
}

function assertStringOrNull(value: unknown, code: string): asserts value is string | null {
  if (value !== null && typeof value !== "string") {
    throw new GithubCommentPayloadError(code);
  }
}

function validateBasePreview(value: unknown): ActuationPreview {
  const code = "CODEX_GITHUB_COMMENT_PAYLOAD_INVALID_PREVIEW";
  if (!isRecord(value)) throw new GithubCommentPayloadError(code);
  if (value.helper !== "codex:actuation-preview") throw new GithubCommentPayloadError(code);
  if (!("version" in value)) throw new GithubCommentPayloadError(code);
  if (value.operation_mode !== "human_assisted" && value.operation_mode !== "delegated") {
    throw new GithubCommentPayloadError(code);
  }
  if (typeof value.delegated_consumption !== "boolean") throw new GithubCommentPayloadError(code);
  if (
    value.pipeline_status !== "pass" &&
    value.pipeline_status !== "needs_review" &&
    value.pipeline_status !== "fail"
  ) {
    throw new GithubCommentPayloadError(code);
  }
  if (value.plan_status !== "pass" && value.plan_status !== "needs_review" && value.plan_status !== "fail") {
    throw new GithubCommentPayloadError(code);
  }
  if (typeof value.intended_action !== "string") throw new GithubCommentPayloadError(code);
  if (value.gate_status !== "gate_passed" && value.gate_status !== "needs_review" && value.gate_status !== "denied") {
    throw new GithubCommentPayloadError(code);
  }
  if (
    value.preview_status !== "ready_for_separate_actuation" &&
    value.preview_status !== "needs_review" &&
    value.preview_status !== "blocked"
  ) {
    throw new GithubCommentPayloadError(code);
  }
  if (typeof value.execution_permitted_by_gate !== "boolean") throw new GithubCommentPayloadError(code);
  if (value.dry_run_only !== true) throw new GithubCommentPayloadError(code);
  if (value.would_execute !== false) throw new GithubCommentPayloadError(code);
  if (value.requires_separate_actuation_helper !== true) throw new GithubCommentPayloadError(code);
  assertStringOrNull(value.grant_id, code);
  if (typeof value.scope !== "string") throw new GithubCommentPayloadError(code);
  assertStringOrNull(value.work_id, code);
  assertStringOrNull(value.related_pr, code);
  if (
    value.target_status !== "present" &&
    value.target_status !== "missing" &&
    value.target_status !== "not_required"
  ) {
    throw new GithubCommentPayloadError(code);
  }
  if (!isRecord(value.operation_preview)) throw new GithubCommentPayloadError(code);
  assertStringArray(value.warnings, code);
  assertStringArray(value.blockers, code);
  if (typeof value.next_step !== "string") throw new GithubCommentPayloadError(code);
  if (typeof value.authority_boundary !== "string" || !value.authority_boundary.trim()) {
    throw new GithubCommentPayloadError(code);
  }

  const operationPreview = validateBaseOperationPreview(value.operation_preview);

  return {
    helper: "codex:actuation-preview",
    version: value.version,
    operation_mode: value.operation_mode,
    delegated_consumption: value.delegated_consumption,
    pipeline_status: value.pipeline_status,
    plan_status: value.plan_status,
    intended_action: value.intended_action,
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
    operation_preview: operationPreview,
    warnings: value.warnings,
    blockers: value.blockers,
    next_step: value.next_step,
    authority_boundary: value.authority_boundary,
  };
}

function validateBaseOperationPreview(value: Record<string, unknown>): OperationPreview {
  const code = "CODEX_GITHUB_COMMENT_PAYLOAD_INVALID_PREVIEW";
  if (typeof value.action !== "string") throw new GithubCommentPayloadError(code);
  if (typeof value.operation_kind !== "string") throw new GithubCommentPayloadError(code);
  assertStringOrNull(value.target_ref, code);
  if (typeof value.method_preview !== "string") throw new GithubCommentPayloadError(code);
  assertStringArray(value.payload_keys, code);
  if (typeof value.body_present !== "boolean") throw new GithubCommentPayloadError(code);
  if (typeof value.body_length !== "number" || !Number.isFinite(value.body_length) || value.body_length < 0) {
    throw new GithubCommentPayloadError(code);
  }
  if (value.body_preview !== undefined && typeof value.body_preview !== "string") {
    throw new GithubCommentPayloadError(code);
  }
  if (typeof value.dry_run_only !== "boolean") throw new GithubCommentPayloadError(code);
  if (typeof value.would_execute !== "boolean") throw new GithubCommentPayloadError(code);

  return {
    action: value.action,
    operation_kind: value.operation_kind,
    target_ref: value.target_ref,
    method_preview: value.method_preview,
    payload_keys: value.payload_keys,
    body_present: value.body_present,
    body_length: value.body_length,
    ...(value.body_preview === undefined ? {} : { body_preview: value.body_preview }),
    dry_run_only: value.dry_run_only,
    would_execute: value.would_execute,
  };
}

function validateCommentOperationPreview(operationPreview: OperationPreview): void {
  const code = "CODEX_GITHUB_COMMENT_PAYLOAD_INVALID_PREVIEW";
  if (operationPreview.action !== "create_pr_comment") throw new GithubCommentPayloadError(code);
  if (operationPreview.operation_kind !== "github_write") throw new GithubCommentPayloadError(code);
  if (operationPreview.method_preview !== "would_POST") throw new GithubCommentPayloadError(code);
  if (operationPreview.dry_run_only !== true) throw new GithubCommentPayloadError(code);
  if (operationPreview.would_execute !== false) throw new GithubCommentPayloadError(code);
}

function assertSupportedAction(preview: ActuationPreview): void {
  if (preview.intended_action !== "create_pr_comment") {
    throw new GithubCommentPayloadError("CODEX_GITHUB_COMMENT_PAYLOAD_UNSUPPORTED_ACTION");
  }
  validateCommentOperationPreview(preview.operation_preview);
}

function assertReady(preview: ActuationPreview): void {
  if (preview.preview_status === "blocked") {
    throw new GithubCommentPayloadError("CODEX_GITHUB_COMMENT_PAYLOAD_PREVIEW_BLOCKED");
  }
  if (preview.preview_status === "needs_review") {
    throw new GithubCommentPayloadError("CODEX_GITHUB_COMMENT_PAYLOAD_PREVIEW_NEEDS_REVIEW");
  }
  if (preview.gate_status !== "gate_passed" || preview.execution_permitted_by_gate !== true) {
    throw new GithubCommentPayloadError("CODEX_GITHUB_COMMENT_PAYLOAD_GATE_NOT_PASSED");
  }
  if (
    preview.dry_run_only !== true ||
    preview.would_execute !== false ||
    preview.requires_separate_actuation_helper !== true
  ) {
    throw new GithubCommentPayloadError("CODEX_GITHUB_COMMENT_PAYLOAD_INVALID_PREVIEW");
  }
  if (preview.target_status !== "present") {
    throw new GithubCommentPayloadError("CODEX_GITHUB_COMMENT_PAYLOAD_TARGET_MISSING");
  }
}

function readOutputMode(): OutputMode {
  const value = process.env.CODEX_GITHUB_COMMENT_PAYLOAD_OUTPUT?.trim() || "both";
  if (value === "summary" || value === "json" || value === "both") return value;
  throw new GithubCommentPayloadError("CODEX_GITHUB_COMMENT_PAYLOAD_INVALID_OUTPUT");
}

function readBooleanEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  const value = raw.trim();
  if (value === "true") return true;
  if (value === "false") return false;
  throw new GithubCommentPayloadError(`CODEX_GITHUB_COMMENT_PAYLOAD_INVALID_BOOLEAN ${name}`);
}

function readBodyMaxChars(): number {
  const raw = process.env.CODEX_GITHUB_COMMENT_BODY_MAX_CHARS;
  if (raw === undefined) return 60000;
  const value = raw.trim();
  if (!/^[1-9]\d*$/.test(value)) {
    throw new GithubCommentPayloadError("CODEX_GITHUB_COMMENT_PAYLOAD_INVALID_BODY_LIMIT");
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new GithubCommentPayloadError("CODEX_GITHUB_COMMENT_PAYLOAD_INVALID_BODY_LIMIT");
  }
  return parsed;
}

async function readBody(preview: ActuationPreview): Promise<string> {
  let body: string | null = null;

  if (process.env.CODEX_GITHUB_COMMENT_BODY !== undefined) {
    body = process.env.CODEX_GITHUB_COMMENT_BODY;
  } else if (process.env.CODEX_GITHUB_COMMENT_BODY_FILE !== undefined) {
    const filePath = process.env.CODEX_GITHUB_COMMENT_BODY_FILE.trim();
    if (!filePath) throw new GithubCommentPayloadError("CODEX_GITHUB_COMMENT_PAYLOAD_MISSING_BODY");
    body = await readFile(filePath, "utf8");
  } else if (preview.operation_preview.body_preview !== undefined) {
    body = preview.operation_preview.body_preview;
  }

  if (body === null || !body.trim()) {
    throw new GithubCommentPayloadError("CODEX_GITHUB_COMMENT_PAYLOAD_MISSING_BODY");
  }

  const maxChars = readBodyMaxChars();
  if (body.length > maxChars) {
    throw new GithubCommentPayloadError("CODEX_GITHUB_COMMENT_PAYLOAD_BODY_TOO_LARGE");
  }

  return body;
}

function readTargetRef(preview: ActuationPreview): string | null {
  const raw = process.env.CODEX_GITHUB_COMMENT_TARGET_REF;
  const envTarget = raw === undefined ? null : raw.trim() || null;
  return envTarget ?? preview.operation_preview.target_ref ?? preview.related_pr;
}

function parseTarget(targetRef: string | null): { target: Target; warnings: string[] } {
  if (targetRef === null || !targetRef.trim()) {
    throw new GithubCommentPayloadError("CODEX_GITHUB_COMMENT_PAYLOAD_TARGET_MISSING");
  }

  const trimmed = targetRef.trim();
  const shorthand = /^([^/\s#]+)\/([^/\s#]+)#(\d+)$/.exec(trimmed);
  if (shorthand !== null) {
    const owner = validateTargetSegment(shorthand[1]);
    const repo = validateTargetSegment(shorthand[2]);
    const pullNumber = parsePullNumber(shorthand[3]);
    return {
      target: {
        target_ref: trimmed,
        owner,
        repo,
        pull_number: pullNumber,
        issue_number: pullNumber,
        target_status: "present",
      },
      warnings: [],
    };
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new GithubCommentPayloadError("CODEX_GITHUB_COMMENT_PAYLOAD_INVALID_TARGET");
  }

  if (url.hostname !== "github.com") {
    throw new GithubCommentPayloadError("CODEX_GITHUB_COMMENT_PAYLOAD_INVALID_TARGET");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new GithubCommentPayloadError("CODEX_GITHUB_COMMENT_PAYLOAD_INVALID_TARGET");
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length !== 4 || parts[2] !== "pull") {
    throw new GithubCommentPayloadError("CODEX_GITHUB_COMMENT_PAYLOAD_INVALID_TARGET");
  }

  const owner = validateTargetSegment(decodePathPart(parts[0]));
  const repo = validateTargetSegment(decodePathPart(parts[1]));
  const pullNumber = parsePullNumber(parts[3]);
  return {
    target: {
      target_ref: trimmed,
      owner,
      repo,
      pull_number: pullNumber,
      issue_number: pullNumber,
      target_status: "present",
    },
    warnings: url.protocol === "http:" ? ["non_https_github_target"] : [],
  };
}

function decodePathPart(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    throw new GithubCommentPayloadError("CODEX_GITHUB_COMMENT_PAYLOAD_INVALID_TARGET");
  }
}

function validateTargetSegment(value: string): string {
  if (!value || /[\s/#?]/.test(value) || /[\u0000-\u001F\u007F]/.test(value)) {
    throw new GithubCommentPayloadError("CODEX_GITHUB_COMMENT_PAYLOAD_INVALID_TARGET");
  }
  return value;
}

function parsePullNumber(value: string): number {
  if (!/^[1-9]\d*$/.test(value)) {
    throw new GithubCommentPayloadError("CODEX_GITHUB_COMMENT_PAYLOAD_INVALID_TARGET");
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) throw new GithubCommentPayloadError("CODEX_GITHUB_COMMENT_PAYLOAD_INVALID_TARGET");
  return parsed;
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

function buildPayload(target: Target, body: string, includeBody: boolean): CommentPayload {
  const basePayload = {
    endpoint_preview: `POST /repos/${target.owner}/${target.repo}/issues/${target.issue_number}/comments`,
    api_url_preview: `https://api.github.com/repos/${encodeURIComponent(target.owner)}/${encodeURIComponent(
      target.repo,
    )}/issues/${target.issue_number}/comments`,
    method_preview: "would_POST",
    body_present: true,
    body_length: body.length,
    body_sha256: createHash("sha256").update(body).digest("hex"),
  } as const;

  if (includeBody) {
    return {
      ...basePayload,
      body,
      dry_run_only: true,
      would_execute: false,
    };
  }

  return {
    ...basePayload,
    dry_run_only: true,
    would_execute: false,
  };
}

async function buildResult(preview: ActuationPreview): Promise<CommentPayloadResult> {
  assertSupportedAction(preview);
  assertReady(preview);

  const includeBody = readBooleanEnv("CODEX_GITHUB_COMMENT_INCLUDE_BODY", false);
  const { target, warnings } = parseTarget(readTargetRef(preview));
  const body = await readBody(preview);
  const payload = buildPayload(target, body, includeBody);

  return {
    helper: "codex:github-comment-payload",
    version: 1,
    operation_mode: preview.operation_mode,
    delegated_consumption: preview.delegated_consumption,
    intended_action: "create_pr_comment",
    gate_status: preview.gate_status,
    preview_status: preview.preview_status,
    grant_id: preview.grant_id,
    scope: preview.scope,
    work_id: preview.work_id,
    related_pr: preview.related_pr,
    target,
    payload,
    warnings: unique([...preview.warnings, ...warnings]),
    blockers: preview.blockers,
    dry_run_only: true,
    would_execute: false,
    requires_separate_actuation_helper: true,
    next_step: NEXT_STEP,
    authority_boundary: AUTHORITY_BOUNDARY,
  };
}

function renderSummary(result: CommentPayloadResult, includeBody: boolean): string {
  return [
    "Codex GitHub comment payload",
    `operation_mode: ${result.operation_mode}`,
    `delegated_consumption: ${result.delegated_consumption}`,
    `intended_action: ${result.intended_action}`,
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
    `endpoint_preview: ${result.payload.endpoint_preview}`,
    `body_present: ${result.payload.body_present}`,
    `body_length: ${result.payload.body_length}`,
    `body_sha256: ${result.payload.body_sha256}`,
    `include_body: ${includeBody}`,
    `dry_run_only: ${result.dry_run_only}`,
    `would_execute: ${result.would_execute}`,
    `requires_separate_actuation_helper: ${result.requires_separate_actuation_helper}`,
    `warnings count: ${result.warnings.length}`,
    `blockers count: ${result.blockers.length}`,
    `next_step: ${result.next_step}`,
    `authority boundary: ${result.authority_boundary}`,
    DELEGATED_NOTE,
  ].join("\n");
}

function printResult(result: CommentPayloadResult, outputMode: OutputMode, includeBody: boolean): void {
  if (outputMode === "summary") {
    console.log(renderSummary(result, includeBody));
    return;
  }

  if (outputMode === "json") {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(renderSummary(result, includeBody));
  console.log(PAYLOAD_JSON_BEGIN_MARKER);
  console.log(JSON.stringify(result, null, 2));
  console.log(PAYLOAD_JSON_END_MARKER);
}

async function main(): Promise<void> {
  const preview = validateBasePreview(parsePreviewJson(await readPreviewInputText()));
  const outputMode = readOutputMode();
  const includeBody = readBooleanEnv("CODEX_GITHUB_COMMENT_INCLUDE_BODY", false);
  const result = await buildResult(preview);
  printResult(result, outputMode, includeBody);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "CODEX_GITHUB_COMMENT_PAYLOAD_FAILED";
    console.error(message);
    process.exitCode = 1;
  });
}
