import { pathToFileURL } from "node:url";

const DEFAULT_API_BASE_URL = "http://localhost:3000";
const DEFAULT_SCOPE = "project:augnes";
const DEFAULT_OPERATION_MODE = "human_assisted";
const DEFAULT_CLOSEOUT_FORMAT = "both";
const JSON_BEGIN_MARKER = "BEGIN_AUGNES_CODEX_CLOSEOUT_JSON";
const JSON_END_MARKER = "END_AUGNES_CODEX_CLOSEOUT_JSON";

const AUTHORITY_BOUNDARY =
  "The helper prints closeout/handoff material only. It does not call Augnes runtime routes. It does not call GitHub/OpenAI. It does not create evidence, proof, readiness, benchmark, score, state transition, proposal commit/reject, publication, approval, PR comment, PR review, merge, or PR mutation. It is usable by human-assisted or delegated Codex workflows, but it does not itself grant or exercise authority.";

const DELEGATED_OPERATION_NOTE =
  "Delegated operation note: this block may be consumed by a delegated Codex workflow as closeout material, but this helper does not perform posting, approval, merge, publication, provider calls, or Augnes state mutation.";

const LIST_ENV_NAMES = [
  "CODEX_EVIDENCE_IDS",
  "CODEX_TESTS_RUN",
  "CODEX_TESTS_SKIPPED",
  "CODEX_WARNINGS",
  "CODEX_BLOCKERS",
  "CODEX_CHANGED_FILES",
  "CODEX_SCOPE_RISKS",
  "CODEX_ASSUMPTIONS",
  "CODEX_OPEN_QUESTIONS",
  "CODEX_DELEGATED_AUTHORITY_SCOPE",
  "CODEX_FORBIDDEN_ACTIONS",
] as const;

type CloseoutFormat = "markdown" | "json" | "both";
type OperationMode = "human_assisted" | "delegated";
type ListEnvName = (typeof LIST_ENV_NAMES)[number];

type RuntimeRefs = {
  state_brief_url: string;
  work_brief_url: string | null;
  evidence_pack_url: string | null;
  session_trace_url: string | null;
};

type EvidenceCompletionRefs = {
  evidence_ids: string[];
  action_id: string | null;
  work_event_id: string | null;
  related_pr: string | null;
  handoff_ref: string | null;
  evidence_pack_ref: string | null;
};

type CloseoutBlock = {
  helper: "codex:closeout-block";
  version: "1";
  operation_mode: OperationMode;
  closeout_status: string | null;
  scope: string;
  work_id: string | null;
  related_pr: string | null;
  changed_files: string[];
  tests_run: string[];
  tests_skipped: string[];
  runtime_refs: RuntimeRefs;
  evidence_completion_refs: EvidenceCompletionRefs;
  warnings: string[];
  blockers: string[];
  scope_risks: string[];
  assumptions: string[];
  open_questions: string[];
  delegated_authority_scope: string[];
  forbidden_actions: string[];
  next_goal: string | null;
  authority_boundary: string;
};

type CloseoutConfig = {
  format: CloseoutFormat;
  closeout: CloseoutBlock;
};

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function readDefaultedEnv(names: string[], fallback: string): string {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }

  return fallback;
}

function readOptionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function readListEnv(name: ListEnvName): string[] {
  const raw = process.env[name];
  if (raw === undefined) return [];

  const value = raw.trim();
  if (!value) return [];

  if (value.startsWith("[")) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(value) as unknown;
    } catch {
      throw new Error(`CODEX_CLOSEOUT_BLOCK_INVALID_LIST_ENV ${name}`);
    }

    if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) {
      throw new Error(`CODEX_CLOSEOUT_BLOCK_INVALID_LIST_ENV ${name}`);
    }

    return parsed.map((item) => item.trim()).filter(Boolean);
  }

  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function readFormat(): CloseoutFormat {
  const value = readDefaultedEnv(["CODEX_CLOSEOUT_FORMAT"], DEFAULT_CLOSEOUT_FORMAT);
  if (value === "markdown" || value === "json" || value === "both") return value;
  throw new Error("CODEX_CLOSEOUT_BLOCK_INVALID_FORMAT");
}

function readOperationMode(): OperationMode {
  const value = readDefaultedEnv(["CODEX_OPERATION_MODE"], DEFAULT_OPERATION_MODE);
  if (value === "human_assisted" || value === "delegated") return value;
  throw new Error("CODEX_CLOSEOUT_BLOCK_INVALID_OPERATION_MODE");
}

function readBaseUrl(): string {
  const raw = trimTrailingSlash(readDefaultedEnv(["AUGNES_API_BASE_URL"], DEFAULT_API_BASE_URL));
  try {
    new URL(raw);
  } catch {
    throw new Error("CODEX_CLOSEOUT_BLOCK_INVALID_BASE_URL");
  }

  return raw;
}

function buildReviewUrl(
  apiBaseUrl: string,
  pathname: string,
  params: Record<string, string | undefined>,
): string {
  let url: URL;
  try {
    url = new URL(pathname, `${apiBaseUrl}/`);
  } catch {
    throw new Error("CODEX_CLOSEOUT_BLOCK_INVALID_BASE_URL");
  }

  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }

  return url.toString();
}

function resolveRuntimeRefs(apiBaseUrl: string, scope: string, workId?: string, sessionId?: string): RuntimeRefs {
  return {
    state_brief_url: buildReviewUrl(apiBaseUrl, "/api/state/brief", { scope }),
    work_brief_url: workId
      ? buildReviewUrl(apiBaseUrl, `/api/work/${encodeURIComponent(workId)}/brief`, { scope })
      : null,
    evidence_pack_url: workId
      ? buildReviewUrl(apiBaseUrl, "/api/evidence-pack", { scope, work_id: workId })
      : null,
    session_trace_url: sessionId
      ? buildReviewUrl(apiBaseUrl, `/api/sessions/${encodeURIComponent(sessionId)}/trace`, { scope })
      : null,
  };
}

function resolveCloseoutConfig(): CloseoutConfig {
  const apiBaseUrl = readBaseUrl();
  const scope = readDefaultedEnv(["CODEX_SCOPE", "AUGNES_SCOPE"], DEFAULT_SCOPE);
  const operationMode = readOperationMode();
  const workId = readOptionalEnv("CODEX_WORK_ID");
  const relatedPr = readOptionalEnv("CODEX_RELATED_PR");
  const sessionId = readOptionalEnv("CODEX_SESSION_ID");

  return {
    format: readFormat(),
    closeout: {
      helper: "codex:closeout-block",
      version: "1",
      operation_mode: operationMode,
      closeout_status: readOptionalEnv("CODEX_CLOSEOUT_STATUS") ?? null,
      scope,
      work_id: workId ?? null,
      related_pr: relatedPr ?? null,
      changed_files: readListEnv("CODEX_CHANGED_FILES"),
      tests_run: readListEnv("CODEX_TESTS_RUN"),
      tests_skipped: readListEnv("CODEX_TESTS_SKIPPED"),
      runtime_refs: resolveRuntimeRefs(apiBaseUrl, scope, workId, sessionId),
      evidence_completion_refs: {
        evidence_ids: readListEnv("CODEX_EVIDENCE_IDS"),
        action_id: readOptionalEnv("CODEX_ACTION_ID") ?? null,
        work_event_id: readOptionalEnv("CODEX_WORK_EVENT_ID") ?? null,
        related_pr: relatedPr ?? null,
        handoff_ref: readOptionalEnv("CODEX_HANDOFF_REF") ?? null,
        evidence_pack_ref: readOptionalEnv("CODEX_EVIDENCE_PACK_REF") ?? null,
      },
      warnings: readListEnv("CODEX_WARNINGS"),
      blockers: readListEnv("CODEX_BLOCKERS"),
      scope_risks: readListEnv("CODEX_SCOPE_RISKS"),
      assumptions: readListEnv("CODEX_ASSUMPTIONS"),
      open_questions: readListEnv("CODEX_OPEN_QUESTIONS"),
      delegated_authority_scope: readListEnv("CODEX_DELEGATED_AUTHORITY_SCOPE"),
      forbidden_actions: readListEnv("CODEX_FORBIDDEN_ACTIONS"),
      next_goal: readOptionalEnv("CODEX_NEXT_GOAL") ?? null,
      authority_boundary: AUTHORITY_BOUNDARY,
    },
  };
}

function markdownValue(value: string | null): string {
  return value ?? "Not provided.";
}

function markdownList(values: string[]): string {
  if (values.length === 0) return "None reported.";
  return values.map((value) => `- ${value}`).join("\n");
}

function renderMarkdown(closeout: CloseoutBlock): string {
  return [
    "## Codex closeout",
    `operation_mode: ${closeout.operation_mode}`,
    `closeout_status: ${markdownValue(closeout.closeout_status)}`,
    `scope: ${closeout.scope}`,
    `work_id: ${markdownValue(closeout.work_id)}`,
    `related_pr: ${markdownValue(closeout.related_pr)}`,
    "",
    "### Changed files",
    markdownList(closeout.changed_files),
    "",
    "### Tests run/results",
    markdownList(closeout.tests_run),
    "",
    "### Skipped tests",
    markdownList(closeout.tests_skipped),
    "",
    "### Runtime/Augnes refs",
    `state_brief_url: ${closeout.runtime_refs.state_brief_url}`,
    `work_brief_url: ${markdownValue(closeout.runtime_refs.work_brief_url)}`,
    `evidence_pack_url: ${markdownValue(closeout.runtime_refs.evidence_pack_url)}`,
    `session_trace_url: ${markdownValue(closeout.runtime_refs.session_trace_url)}`,
    "",
    "### Evidence / completion refs",
    "evidence_ids:",
    markdownList(closeout.evidence_completion_refs.evidence_ids),
    `action_id: ${markdownValue(closeout.evidence_completion_refs.action_id)}`,
    `work_event_id: ${markdownValue(closeout.evidence_completion_refs.work_event_id)}`,
    `related_pr: ${markdownValue(closeout.evidence_completion_refs.related_pr)}`,
    `handoff_ref: ${markdownValue(closeout.evidence_completion_refs.handoff_ref)}`,
    `evidence_pack_ref: ${markdownValue(closeout.evidence_completion_refs.evidence_pack_ref)}`,
    "",
    "### Warnings",
    markdownList(closeout.warnings),
    "",
    "### Blockers",
    markdownList(closeout.blockers),
    "",
    "### Scope risks",
    markdownList(closeout.scope_risks),
    "",
    "### Assumptions",
    markdownList(closeout.assumptions),
    "",
    "### Questions requiring user/PM judgment",
    markdownList(closeout.open_questions),
    "",
    "### Delegated operation note",
    DELEGATED_OPERATION_NOTE,
    "",
    "### Recommended next goal",
    markdownValue(closeout.next_goal),
    "",
    "### Authority boundary",
    closeout.authority_boundary,
  ].join("\n");
}

function renderJson(closeout: CloseoutBlock): string {
  return JSON.stringify(closeout, null, 2);
}

function printCloseout({ format, closeout }: CloseoutConfig): void {
  if (format === "markdown") {
    console.log(renderMarkdown(closeout));
    return;
  }

  if (format === "json") {
    console.log(renderJson(closeout));
    return;
  }

  console.log(renderMarkdown(closeout));
  console.log(JSON_BEGIN_MARKER);
  console.log(renderJson(closeout));
  console.log(JSON_END_MARKER);
}

function main(): void {
  printCloseout(resolveCloseoutConfig());
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "CODEX_CLOSEOUT_BLOCK_FAILED";
    console.error(message);
    process.exitCode = 1;
  }
}
