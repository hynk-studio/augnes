import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const CLOSEOUT_JSON_BEGIN_MARKER = "BEGIN_AUGNES_CODEX_CLOSEOUT_JSON";
const CLOSEOUT_JSON_END_MARKER = "END_AUGNES_CODEX_CLOSEOUT_JSON";
const CHECK_JSON_BEGIN_MARKER = "BEGIN_AUGNES_CODEX_CLOSEOUT_CHECK_JSON";
const CHECK_JSON_END_MARKER = "END_AUGNES_CODEX_CLOSEOUT_CHECK_JSON";
const PIPELINE_JSON_BEGIN_MARKER = "BEGIN_AUGNES_CODEX_CLOSEOUT_PIPELINE_JSON";
const PIPELINE_JSON_END_MARKER = "END_AUGNES_CODEX_CLOSEOUT_PIPELINE_JSON";

const AUTHORITY_BOUNDARY =
  "The pipeline runs local formatting and validation only. It may optionally invoke closeout-check read-ref mode, which performs bounded GET-only reads to validated Augnes read-only refs. It does not call GitHub/OpenAI. It does not post PR comments/reviews. It does not approve, merge, publish, create evidence, create proof, score, benchmark, commit/reject state, mutate Augnes, or grant authority. It supports human-assisted and delegated Codex workflows, but does not itself exercise delegated authority.";

type PipelineOutputMode = "summary" | "json" | "both";
type PipelineStatus = "pass" | "needs_review" | "fail";

type CloseoutBlock = {
  helper: "codex:closeout-block";
  operation_mode: "human_assisted" | "delegated";
  closeout_status: string | null;
  scope: string;
  work_id: string | null;
  related_pr: string | null;
  changed_files: string[];
  tests_run: string[];
  evidence_completion_refs: {
    evidence_ids: string[];
  };
  blockers: string[];
  warnings: string[];
};

type CloseoutCheckResult = {
  helper: "codex:closeout-check";
  validation_status: PipelineStatus;
  operation_mode: "human_assisted" | "delegated";
  delegated_consumption: boolean;
  read_only_ref_checks: Array<{
    checked: boolean;
    ok: boolean | null;
  }>;
};

type PipelineResult = {
  helper: "codex:closeout-pipeline";
  version: 1;
  operation_mode: "human_assisted" | "delegated";
  delegated_consumption: boolean;
  pipeline_status: PipelineStatus;
  closeout_status: string | null;
  scope: string;
  work_id: string | null;
  related_pr: string | null;
  closeout: CloseoutBlock;
  closeout_check: CloseoutCheckResult;
  recommended_next_action: string;
  authority_boundary: string;
};

type ChildResult = {
  status: number | null;
  stdout: string;
  stderr: string;
};

class CloseoutPipelineError extends Error {}

function appDir(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), "..");
}

function readOutputMode(): PipelineOutputMode {
  const value = process.env.CODEX_CLOSEOUT_PIPELINE_OUTPUT?.trim() || "both";
  if (value === "summary" || value === "json" || value === "both") return value;
  throw new CloseoutPipelineError("CODEX_CLOSEOUT_PIPELINE_INVALID_OUTPUT");
}

function childEnv(extra: Record<string, string | undefined> = {}): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env, ...extra };
  delete env.GITHUB_TOKEN;
  delete env.OPENAI_API_KEY;
  return env;
}

function runChild(args: string[], env: NodeJS.ProcessEnv, stdin?: string): Promise<ChildResult> {
  return new Promise((resolveChild) => {
    const child = spawn("npm", args, {
      cwd: appDir(),
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
    child.stdin.end(stdin ?? "");
  });
}

function extractMarkedJson(text: string, beginMarker: string, endMarker: string, errorCode: string): unknown {
  const begin = text.indexOf(beginMarker);
  const end = text.indexOf(endMarker);
  if (begin === -1 || end === -1 || end <= begin) {
    throw new CloseoutPipelineError(errorCode);
  }

  try {
    return JSON.parse(text.slice(begin + beginMarker.length, end).trim()) as unknown;
  } catch {
    throw new CloseoutPipelineError(errorCode);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseCloseout(stdout: string): CloseoutBlock {
  const parsed = extractMarkedJson(
    stdout,
    CLOSEOUT_JSON_BEGIN_MARKER,
    CLOSEOUT_JSON_END_MARKER,
    "CODEX_CLOSEOUT_PIPELINE_INVALID_BLOCK_JSON",
  );
  if (!isRecord(parsed) || parsed.helper !== "codex:closeout-block") {
    throw new CloseoutPipelineError("CODEX_CLOSEOUT_PIPELINE_INVALID_BLOCK_JSON");
  }

  return parsed as CloseoutBlock;
}

function extractCloseoutMarkdown(stdout: string): string {
  const begin = stdout.indexOf(CLOSEOUT_JSON_BEGIN_MARKER);
  return (begin === -1 ? stdout : stdout.slice(0, begin)).trim();
}

function parseCheck(stdout: string): CloseoutCheckResult {
  const parsed = extractMarkedJson(
    stdout,
    CHECK_JSON_BEGIN_MARKER,
    CHECK_JSON_END_MARKER,
    "CODEX_CLOSEOUT_PIPELINE_INVALID_CHECK_JSON",
  );
  if (!isRecord(parsed) || parsed.helper !== "codex:closeout-check") {
    throw new CloseoutPipelineError("CODEX_CLOSEOUT_PIPELINE_INVALID_CHECK_JSON");
  }

  return parsed as CloseoutCheckResult;
}

function recommendedNextAction(status: PipelineStatus): string {
  if (status === "pass") {
    return "Closeout material is locally valid; a delegated or human-assisted workflow may use it as handoff material subject to its separate authority gate.";
  }
  if (status === "needs_review") {
    return "Closeout material is structurally valid but missing recommended fields; fill gaps before any posting or delegated action.";
  }
  return "Closeout material failed local validation; do not use it for posting, review, approval, merge, publication, or delegated action.";
}

function buildPipelineResult(closeout: CloseoutBlock, closeoutCheck: CloseoutCheckResult): PipelineResult {
  return {
    helper: "codex:closeout-pipeline",
    version: 1,
    operation_mode: closeout.operation_mode,
    delegated_consumption: closeoutCheck.delegated_consumption,
    pipeline_status: closeoutCheck.validation_status,
    closeout_status: closeout.closeout_status,
    scope: closeout.scope,
    work_id: closeout.work_id,
    related_pr: closeout.related_pr,
    closeout,
    closeout_check: closeoutCheck,
    recommended_next_action: recommendedNextAction(closeoutCheck.validation_status),
    authority_boundary: AUTHORITY_BOUNDARY,
  };
}

function summarizeReadRefs(closeoutCheck: CloseoutCheckResult): string {
  const checked = closeoutCheck.read_only_ref_checks.filter((check) => check.checked);
  const failed = checked.filter((check) => check.ok === false);
  return `${checked.length} checked, ${failed.length} failed`;
}

function renderSummary(result: PipelineResult, closeoutMarkdown: string): string {
  const lines = [
    "Codex closeout pipeline",
    `operation_mode: ${result.operation_mode}`,
    `delegated_consumption: ${result.delegated_consumption}`,
    `pipeline_status: ${result.pipeline_status}`,
    `closeout_status: ${result.closeout_status ?? "Not provided."}`,
    `scope: ${result.scope}`,
    `work_id: ${result.work_id ?? "Not provided."}`,
    `related_pr: ${result.related_pr ?? "Not provided."}`,
    `changed_files count: ${result.closeout.changed_files.length}`,
    `tests_run count: ${result.closeout.tests_run.length}`,
    `evidence_ids count: ${result.closeout.evidence_completion_refs.evidence_ids.length}`,
    `blockers count: ${result.closeout.blockers.length}`,
    `warnings count: ${result.closeout.warnings.length}`,
    `read_ref_checks: ${summarizeReadRefs(result.closeout_check)}`,
    `recommended_next_action: ${result.recommended_next_action}`,
    `authority_boundary: ${result.authority_boundary}`,
  ];

  if (result.operation_mode === "delegated") {
    lines.push(
      "Delegated note: this pipeline validates closeout material for possible delegated Codex consumption, but any posting, approval, merge, publication, provider call, or Augnes state mutation remains outside this helper.",
    );
  }

  return `${lines.join("\n")}\n\n${closeoutMarkdown.trim()}`;
}

function printPipeline(outputMode: PipelineOutputMode, result: PipelineResult, closeoutMarkdown: string): void {
  if (outputMode === "summary") {
    console.log(renderSummary(result, closeoutMarkdown));
    return;
  }

  if (outputMode === "json") {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(renderSummary(result, closeoutMarkdown));
  console.log(PIPELINE_JSON_BEGIN_MARKER);
  console.log(JSON.stringify(result, null, 2));
  console.log(PIPELINE_JSON_END_MARKER);
}

async function main(): Promise<void> {
  const outputMode = readOutputMode();
  const blockResult = await runChild(
    ["run", "--silent", "codex:closeout-block"],
    childEnv({
      CODEX_CLOSEOUT_FORMAT: process.env.CODEX_CLOSEOUT_FORMAT ?? "both",
    }),
  );
  if (blockResult.status !== 0) {
    throw new CloseoutPipelineError(`CODEX_CLOSEOUT_PIPELINE_BLOCK_FAILED ${blockResult.stderr.trim()}`);
  }

  const closeout = parseCloseout(blockResult.stdout);
  const checkResult = await runChild(
    ["run", "--silent", "codex:closeout-check"],
    childEnv({
      CODEX_CLOSEOUT_JSON: JSON.stringify(closeout),
    }),
  );
  if (checkResult.status !== 0) {
    throw new CloseoutPipelineError(`CODEX_CLOSEOUT_PIPELINE_CHECK_FAILED ${checkResult.stderr.trim()}`);
  }

  const closeoutCheck = parseCheck(checkResult.stdout);
  printPipeline(outputMode, buildPipelineResult(closeout, closeoutCheck), extractCloseoutMarkdown(blockResult.stdout));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "CODEX_CLOSEOUT_PIPELINE_FAILED";
    console.error(message);
    process.exitCode = 1;
  });
}
