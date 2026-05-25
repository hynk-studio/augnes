import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const READINESS_JSON_BEGIN_MARKER = "BEGIN_AUGNES_CODEX_GITHUB_COMMENT_READINESS_JSON";
const READINESS_JSON_END_MARKER = "END_AUGNES_CODEX_GITHUB_COMMENT_READINESS_JSON";
const COMMAND_PREVIEW_JSON_BEGIN_MARKER = "BEGIN_AUGNES_CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_JSON";
const COMMAND_PREVIEW_JSON_END_MARKER = "END_AUGNES_CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_JSON";

const NEXT_STEP = "ready_for_separate_actuation_helper_review";

const AUTHORITY_BOUNDARY =
  "This helper renders a dry-run GitHub comment command envelope only. It does not call GitHub. It does not post comments or reviews. It does not include auth headers or tokens. It does not approve, merge, publish, create evidence, create proof, mutate Augnes, call providers, call OpenAI, call Augnes runtime routes, or commit/reject state. preflight_passed is not execution readiness. Any posting requires a separate implementation and gate.";

const DELEGATED_NOTE =
  "Delegated note: this command preview may be consumed by a delegated Codex workflow, but it is local preflight material only and does not call GitHub or post a comment.";

type OutputMode = "summary" | "json" | "both";
type OperationMode = "human_assisted" | "delegated";
type PreflightStatus = "preflight_passed" | "needs_review" | "blocked";

type Target = {
  target_ref: string;
  owner: string;
  repo: string;
  pull_number: number;
  issue_number: number;
};

type ParsedTargetRef = {
  target_ref: string;
  owner: string;
  repo: string;
  pull_number: number;
};

type PayloadFingerprint = {
  endpoint_preview: string;
  api_url_preview: string;
  method_preview: "would_POST";
  body_length: number;
  body_sha256: string;
};

type ReadinessResult = {
  helper: "codex:github-comment-readiness";
  version: 1;
  operation_mode: OperationMode;
  delegated_consumption: boolean;
  intended_action: "create_pr_comment";
  preflight_status: PreflightStatus;
  grant_id: string | null;
  scope: string;
  work_id: string | null;
  related_pr: string | null;
  target: Target;
  payload_fingerprint: PayloadFingerprint;
  warnings: string[];
  blockers: string[];
  dry_run_only: true;
  would_execute: false;
  requires_separate_actuation_helper: true;
};

type CommandPreview = {
  command_kind: "github_issue_comment_post";
  method_preview: "would_POST";
  endpoint_preview: string;
  api_url_preview: string;
  body_length: number;
  body_sha256: string;
  auth_header_present: false;
  token_present: false;
  dry_run_only: true;
  would_execute: false;
};

type CommandPreviewResult = {
  helper: "codex:github-comment-command-preview";
  version: 1;
  operation_mode: OperationMode;
  delegated_consumption: boolean;
  intended_action: "create_pr_comment";
  preflight_status: "preflight_passed";
  grant_id: string | null;
  scope: string;
  work_id: string | null;
  related_pr: string | null;
  command_preview: CommandPreview;
  target: Target;
  payload_fingerprint: PayloadFingerprint;
  warnings: string[];
  blockers: string[];
  dry_run_only: true;
  would_execute: false;
  requires_separate_actuation_helper: true;
  next_step: string;
  authority_boundary: string;
};

class GithubCommentCommandPreviewError extends Error {}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function readReadinessInputText(): Promise<string> {
  const inline = process.env.CODEX_GITHUB_COMMENT_READINESS_JSON;
  if (inline !== undefined) {
    if (!inline.trim()) throw new GithubCommentCommandPreviewError("CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_MISSING_INPUT");
    return inline;
  }

  const filePath = process.env.CODEX_GITHUB_COMMENT_READINESS_JSON_FILE;
  if (filePath !== undefined) {
    if (!filePath.trim()) throw new GithubCommentCommandPreviewError("CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_MISSING_INPUT");
    const content = await readFile(filePath, "utf8");
    if (!content.trim()) throw new GithubCommentCommandPreviewError("CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_MISSING_INPUT");
    return content;
  }

  if (process.stdin.isTTY) {
    throw new GithubCommentCommandPreviewError("CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_MISSING_INPUT");
  }

  const stdin = await readStdin();
  if (!stdin.trim()) throw new GithubCommentCommandPreviewError("CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_MISSING_INPUT");
  return stdin;
}

function extractJsonText(input: string): string {
  const begin = input.indexOf(READINESS_JSON_BEGIN_MARKER);
  const end = input.indexOf(READINESS_JSON_END_MARKER);
  if (begin !== -1 || end !== -1) {
    if (begin === -1 || end === -1 || end <= begin) {
      throw new GithubCommentCommandPreviewError("CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_INVALID_JSON");
    }
    return input.slice(begin + READINESS_JSON_BEGIN_MARKER.length, end).trim();
  }

  return input.trim();
}

function parseReadinessJson(input: string): unknown {
  try {
    return JSON.parse(extractJsonText(input)) as unknown;
  } catch (error) {
    if (error instanceof GithubCommentCommandPreviewError) throw error;
    throw new GithubCommentCommandPreviewError("CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_INVALID_JSON");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertStringArray(value: unknown, code: string): asserts value is string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new GithubCommentCommandPreviewError(code);
  }
}

function assertStringOrNull(value: unknown, code: string): asserts value is string | null {
  if (value !== null && typeof value !== "string") {
    throw new GithubCommentCommandPreviewError(code);
  }
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function readOutputMode(): OutputMode {
  const value = process.env.CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_OUTPUT?.trim() || "both";
  if (value === "summary" || value === "json" || value === "both") return value;
  throw new GithubCommentCommandPreviewError("CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_INVALID_OUTPUT");
}

function validateReadiness(value: unknown): ReadinessResult {
  const code = "CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_INVALID_READINESS";
  if (!isRecord(value)) throw new GithubCommentCommandPreviewError(code);
  if (value.helper !== "codex:github-comment-readiness") throw new GithubCommentCommandPreviewError(code);
  if (value.version !== 1) throw new GithubCommentCommandPreviewError(code);
  if (value.operation_mode !== "human_assisted" && value.operation_mode !== "delegated") {
    throw new GithubCommentCommandPreviewError(code);
  }
  if (typeof value.delegated_consumption !== "boolean") throw new GithubCommentCommandPreviewError(code);
  if (value.intended_action !== "create_pr_comment") throw new GithubCommentCommandPreviewError(code);
  if (value.preflight_status === "blocked") {
    throw new GithubCommentCommandPreviewError("CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_PREFLIGHT_BLOCKED");
  }
  if (value.preflight_status === "needs_review") {
    throw new GithubCommentCommandPreviewError("CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_PREFLIGHT_NEEDS_REVIEW");
  }
  if (value.preflight_status !== "preflight_passed") {
    throw new GithubCommentCommandPreviewError("CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_INVALID_PREFLIGHT_STATUS");
  }
  assertStringOrNull(value.grant_id, code);
  if (typeof value.scope !== "string") throw new GithubCommentCommandPreviewError(code);
  assertStringOrNull(value.work_id, code);
  assertStringOrNull(value.related_pr, code);
  if (!isRecord(value.target)) throw new GithubCommentCommandPreviewError(code);
  if (!isRecord(value.payload_fingerprint)) throw new GithubCommentCommandPreviewError(code);
  assertStringArray(value.warnings, code);
  assertStringArray(value.blockers, code);
  if (value.blockers.length > 0) throw new GithubCommentCommandPreviewError(code);
  if (value.dry_run_only !== true) throw new GithubCommentCommandPreviewError(code);
  if (value.would_execute !== false) throw new GithubCommentCommandPreviewError(code);
  if (value.requires_separate_actuation_helper !== true) throw new GithubCommentCommandPreviewError(code);

  const target = validateTarget(value.target);
  const payloadFingerprint = validatePayloadFingerprint(value.payload_fingerprint, target);

  return {
    helper: "codex:github-comment-readiness",
    version: 1,
    operation_mode: value.operation_mode,
    delegated_consumption: value.delegated_consumption,
    intended_action: "create_pr_comment",
    preflight_status: "preflight_passed",
    grant_id: value.grant_id,
    scope: value.scope,
    work_id: value.work_id,
    related_pr: value.related_pr,
    target,
    payload_fingerprint: payloadFingerprint,
    warnings: value.warnings,
    blockers: value.blockers,
    dry_run_only: true,
    would_execute: false,
    requires_separate_actuation_helper: true,
  };
}

function validateTarget(value: Record<string, unknown>): Target {
  const code = "CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_INVALID_TARGET";
  if (typeof value.target_ref !== "string") throw new GithubCommentCommandPreviewError(code);
  if (typeof value.owner !== "string") throw new GithubCommentCommandPreviewError(code);
  if (typeof value.repo !== "string") throw new GithubCommentCommandPreviewError(code);
  if (!isPositiveInteger(value.pull_number)) throw new GithubCommentCommandPreviewError(code);
  if (!isPositiveInteger(value.issue_number)) throw new GithubCommentCommandPreviewError(code);

  const target: Target = {
    target_ref: value.target_ref.trim(),
    owner: validateTargetSegment(value.owner, "CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_INVALID_OWNER"),
    repo: validateTargetSegment(value.repo, "CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_INVALID_REPO"),
    pull_number: value.pull_number,
    issue_number: value.issue_number,
  };
  const parsedTargetRef = parseTargetRef(value.target_ref);
  if (
    parsedTargetRef.owner !== target.owner ||
    parsedTargetRef.repo !== target.repo ||
    parsedTargetRef.pull_number !== target.pull_number ||
    target.issue_number !== target.pull_number
  ) {
    throw new GithubCommentCommandPreviewError("CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_TARGET_REF_MISMATCH");
  }

  return target;
}

function parseTargetRef(targetRef: string): ParsedTargetRef {
  const trimmed = targetRef.trim();
  if (!trimmed) throw new GithubCommentCommandPreviewError("CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_INVALID_TARGET");

  const shorthand = /^([^/\s#]+)\/([^/\s#]+)#(\d+)$/.exec(trimmed);
  if (shorthand !== null) {
    return {
      target_ref: trimmed,
      owner: validateTargetSegment(shorthand[1], "CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_INVALID_OWNER"),
      repo: validateTargetSegment(shorthand[2], "CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_INVALID_REPO"),
      pull_number: parsePullNumber(shorthand[3]),
    };
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new GithubCommentCommandPreviewError("CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_INVALID_TARGET");
  }

  if (url.hostname !== "github.com" || (url.protocol !== "https:" && url.protocol !== "http:")) {
    throw new GithubCommentCommandPreviewError("CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_INVALID_TARGET");
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length !== 4 || parts[2] !== "pull") {
    throw new GithubCommentCommandPreviewError("CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_INVALID_TARGET");
  }

  return {
    target_ref: trimmed,
    owner: validateTargetSegment(decodePathPart(parts[0]), "CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_INVALID_OWNER"),
    repo: validateTargetSegment(decodePathPart(parts[1]), "CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_INVALID_REPO"),
    pull_number: parsePullNumber(parts[3]),
  };
}

function decodePathPart(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    throw new GithubCommentCommandPreviewError("CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_INVALID_TARGET");
  }
}

function parsePullNumber(value: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0 || String(parsed) !== value) {
    throw new GithubCommentCommandPreviewError("CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_INVALID_TARGET");
  }
  return parsed;
}

function validateTargetSegment(value: string, code: string): string {
  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    throw new GithubCommentCommandPreviewError(code);
  }

  if (
    !value ||
    value.includes("/") ||
    decoded.includes("/") ||
    /[\s#?]/.test(value) ||
    /[\s#?]/.test(decoded) ||
    /[\u0000-\u001F\u007F]/.test(value) ||
    /[\u0000-\u001F\u007F]/.test(decoded)
  ) {
    throw new GithubCommentCommandPreviewError(code);
  }

  return value;
}

function validatePayloadFingerprint(value: Record<string, unknown>, target: Target): PayloadFingerprint {
  const code = "CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_INVALID_PAYLOAD_FINGERPRINT";
  if (typeof value.endpoint_preview !== "string") throw new GithubCommentCommandPreviewError(code);
  if (typeof value.api_url_preview !== "string") throw new GithubCommentCommandPreviewError(code);
  if (value.method_preview !== "would_POST") throw new GithubCommentCommandPreviewError(code);
  if (!isPositiveInteger(value.body_length)) throw new GithubCommentCommandPreviewError(code);
  if (typeof value.body_sha256 !== "string" || !/^[a-f0-9]{64}$/.test(value.body_sha256)) {
    throw new GithubCommentCommandPreviewError(code);
  }

  const endpointPath = endpointPreviewPath(target);
  if (value.endpoint_preview !== endpointPath && value.endpoint_preview !== `POST ${endpointPath}`) {
    throw new GithubCommentCommandPreviewError(code);
  }
  if (value.api_url_preview !== apiUrlPreview(target)) throw new GithubCommentCommandPreviewError(code);
  validateOptionalBodyMaterial(value, value.body_length, value.body_sha256);

  return {
    endpoint_preview: endpointPath,
    api_url_preview: value.api_url_preview,
    method_preview: "would_POST",
    body_length: value.body_length,
    body_sha256: value.body_sha256,
  };
}

function validateOptionalBodyMaterial(value: Record<string, unknown>, bodyLength: number, bodySha256: string): void {
  for (const key of ["body", "body_preview"]) {
    const body = value[key];
    if (body === undefined) continue;
    if (typeof body !== "string") {
      throw new GithubCommentCommandPreviewError("CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_INVALID_PAYLOAD_FINGERPRINT");
    }
    if (body.length !== bodyLength) {
      throw new GithubCommentCommandPreviewError("CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_INVALID_PAYLOAD_FINGERPRINT");
    }
    if (createHash("sha256").update(body).digest("hex") !== bodySha256) {
      throw new GithubCommentCommandPreviewError("CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_INVALID_PAYLOAD_FINGERPRINT");
    }
  }
}

function endpointPreviewPath(target: Target): string {
  return `/repos/${target.owner}/${target.repo}/issues/${target.issue_number}/comments`;
}

function apiUrlPreview(target: Target): string {
  return `https://api.github.com/repos/${encodeURIComponent(target.owner)}/${encodeURIComponent(target.repo)}/issues/${
    target.issue_number
  }/comments`;
}

function buildResult(readiness: ReadinessResult): CommandPreviewResult {
  const commandPreview: CommandPreview = {
    command_kind: "github_issue_comment_post",
    method_preview: "would_POST",
    endpoint_preview: readiness.payload_fingerprint.endpoint_preview,
    api_url_preview: readiness.payload_fingerprint.api_url_preview,
    body_length: readiness.payload_fingerprint.body_length,
    body_sha256: readiness.payload_fingerprint.body_sha256,
    auth_header_present: false,
    token_present: false,
    dry_run_only: true,
    would_execute: false,
  };

  return {
    helper: "codex:github-comment-command-preview",
    version: 1,
    operation_mode: readiness.operation_mode,
    delegated_consumption: readiness.delegated_consumption,
    intended_action: "create_pr_comment",
    preflight_status: "preflight_passed",
    grant_id: readiness.grant_id,
    scope: readiness.scope,
    work_id: readiness.work_id,
    related_pr: readiness.related_pr,
    command_preview: commandPreview,
    target: readiness.target,
    payload_fingerprint: readiness.payload_fingerprint,
    warnings: readiness.warnings,
    blockers: [],
    dry_run_only: true,
    would_execute: false,
    requires_separate_actuation_helper: true,
    next_step: NEXT_STEP,
    authority_boundary: AUTHORITY_BOUNDARY,
  };
}

function renderSummary(result: CommandPreviewResult): string {
  return [
    "Codex GitHub comment command preview",
    `operation_mode: ${result.operation_mode}`,
    `delegated_consumption: ${result.delegated_consumption}`,
    `intended_action: ${result.intended_action}`,
    `preflight_status: ${result.preflight_status}`,
    `grant_id: ${result.grant_id ?? "Not provided."}`,
    `scope: ${result.scope}`,
    `work_id: ${result.work_id ?? "Not provided."}`,
    `related_pr: ${result.related_pr ?? "Not provided."}`,
    `target_ref: ${result.target.target_ref}`,
    `owner: ${result.target.owner}`,
    `repo: ${result.target.repo}`,
    `issue_number: ${result.target.issue_number}`,
    `command_kind: ${result.command_preview.command_kind}`,
    `method_preview: ${result.command_preview.method_preview}`,
    `endpoint_preview: ${result.command_preview.endpoint_preview}`,
    `api_url_preview: ${result.command_preview.api_url_preview}`,
    `body_length: ${result.command_preview.body_length}`,
    `body_sha256: ${result.command_preview.body_sha256}`,
    `auth_header_present: ${result.command_preview.auth_header_present}`,
    `token_present: ${result.command_preview.token_present}`,
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

function printResult(result: CommandPreviewResult, outputMode: OutputMode): void {
  if (outputMode === "summary") {
    console.log(renderSummary(result));
    return;
  }

  if (outputMode === "json") {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(renderSummary(result));
  console.log(COMMAND_PREVIEW_JSON_BEGIN_MARKER);
  console.log(JSON.stringify(result, null, 2));
  console.log(COMMAND_PREVIEW_JSON_END_MARKER);
}

async function main(): Promise<void> {
  const outputMode = readOutputMode();
  const readiness = validateReadiness(parseReadinessJson(await readReadinessInputText()));
  printResult(buildResult(readiness), outputMode);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "CODEX_GITHUB_COMMENT_COMMAND_PREVIEW_FAILED";
    console.error(message);
    process.exitCode = 1;
  });
}
