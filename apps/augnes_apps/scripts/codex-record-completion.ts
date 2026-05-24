import { pathToFileURL } from "node:url";
import { z } from "zod";
import {
  StateRuntimeActionResultKindSchema,
  StateRuntimeActionResultStatusSchema,
  type StateRuntimeActionResultKind,
  type StateRuntimeActionResultStatus,
} from "../src/lib/state-runtime-types.js";
import { recordActionResult, resolveRecordResultConfig } from "./codex-record-result.js";

const DEFAULT_API_BASE_URL = "http://localhost:3000";
const DEFAULT_SCOPE = "project:augnes";
const DEFAULT_SOURCE_AGENT_ID = "agent:codex";
const DEFAULT_ACTOR = "codex";

const WorkEventTypeSchema = z.enum([
  "note",
  "implementation",
  "verification",
  "review",
  "handoff",
  "blocked",
  "decision",
]);

const WorkEventResultSchema = z.record(z.unknown());

type WorkEventType = z.infer<typeof WorkEventTypeSchema>;

type CompletionConfig = {
  apiBaseUrl: string;
  scope: string;
  workId: string;
  sourceAgentId: string;
  actionName: string;
  resultSummary: string;
  filesChanged: string[];
  resultStatus: StateRuntimeActionResultStatus;
  resultKind: StateRuntimeActionResultKind;
  relatedPr?: string;
  sessionId?: string;
  relatedStateKeys: string[];
  actor: string;
  eventType: WorkEventType;
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

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function readOptionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function parseStringListEnv(name: string, fallback: string[] = []): string[] {
  const raw = process.env[name];
  if (raw === undefined) return fallback;

  const value = raw.trim();
  if (!value) return [];

  if (value.startsWith("[")) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(value) as unknown;
    } catch {
      throw new Error(`${name} must be a comma-separated list or JSON string array.`);
    }

    if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) {
      throw new Error(`${name} must be a JSON string array.`);
    }

    return uniqueStrings(parsed.map((item) => item.trim()).filter(Boolean));
  }

  return uniqueStrings(value.split(",").map((item) => item.trim()).filter(Boolean));
}

function parseEnumEnv<T extends string>(name: string, schema: z.ZodType<T>): T {
  const value = readRequiredEnv(name);
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new Error(`Invalid ${name}: ${value}`);
  }

  return parsed.data;
}

function parseOptionalEnumEnv<T extends string>(name: string, schema: z.ZodType<T>): T | undefined {
  const value = readOptionalEnv(name);
  if (!value) return undefined;

  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new Error(`Invalid ${name}: ${value}`);
  }

  return parsed.data;
}

function normalizeWorkId(workId: string): string {
  return workId.trim().toUpperCase();
}

function resolveEventType(
  resultStatus: StateRuntimeActionResultStatus,
  resultKind: StateRuntimeActionResultKind,
): WorkEventType {
  const explicit = parseOptionalEnumEnv("CODEX_WORK_EVENT_TYPE", WorkEventTypeSchema);
  if (explicit) return explicit;

  if (resultStatus === "blocked") return "blocked";
  if (
    resultKind === "implementation" ||
    resultKind === "verification" ||
    resultKind === "review" ||
    resultKind === "handoff"
  ) {
    return resultKind;
  }

  return "note";
}

function resolveCompletionConfig(): CompletionConfig {
  const apiBaseUrl = trimTrailingSlash(
    readDefaultedEnv(["AUGNES_API_BASE_URL"], DEFAULT_API_BASE_URL),
  );
  const scope = readDefaultedEnv(["CODEX_SCOPE", "AUGNES_SCOPE"], DEFAULT_SCOPE);
  const workId = normalizeWorkId(readRequiredEnv("CODEX_WORK_ID"));
  const sourceAgentId = readDefaultedEnv(["CODEX_SOURCE_AGENT_ID"], DEFAULT_SOURCE_AGENT_ID);
  const actionName = readRequiredEnv("CODEX_ACTION_NAME");
  const resultSummary = readRequiredEnv("CODEX_RESULT_SUMMARY");
  const filesChanged = parseStringListEnv("CODEX_FILES_CHANGED", []);
  const resultStatus = parseEnumEnv("CODEX_RESULT_STATUS", StateRuntimeActionResultStatusSchema);
  const resultKind = parseEnumEnv("CODEX_RESULT_KIND", StateRuntimeActionResultKindSchema);

  return {
    apiBaseUrl,
    scope,
    workId,
    sourceAgentId,
    actionName,
    resultSummary,
    filesChanged,
    resultStatus,
    resultKind,
    relatedPr: readOptionalEnv("CODEX_RELATED_PR"),
    sessionId: readOptionalEnv("CODEX_SESSION_ID"),
    relatedStateKeys: parseStringListEnv("CODEX_RELATED_STATE_KEYS", []),
    actor: readDefaultedEnv(["CODEX_WORK_ACTOR"], DEFAULT_ACTOR),
    eventType: resolveEventType(resultStatus, resultKind),
  };
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
    throw new Error("CODEX_RECORD_COMPLETION_INVALID_BASE_URL");
  }

  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }

  return url.toString();
}

function buildWorkEventUrl(config: CompletionConfig): URL {
  try {
    const url = new URL(
      `/api/work/${encodeURIComponent(config.workId)}/events`,
      `${config.apiBaseUrl}/`,
    );
    url.searchParams.set("scope", config.scope);
    return url;
  } catch {
    throw new Error("CODEX_RECORD_COMPLETION_INVALID_BASE_URL");
  }
}

function buildWorkItemUrl(config: CompletionConfig): URL {
  try {
    const url = new URL(
      `/api/work/${encodeURIComponent(config.workId)}`,
      `${config.apiBaseUrl}/`,
    );
    url.searchParams.set("scope", config.scope);
    return url;
  } catch {
    throw new Error("CODEX_RECORD_COMPLETION_INVALID_BASE_URL");
  }
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) return {};

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error("CODEX_RECORD_COMPLETION_INVALID_JSON");
  }
}

function getPath(value: unknown, path: string[]): unknown {
  let current = value;
  for (const segment of path) {
    if (typeof current !== "object" || current === null || Array.isArray(current)) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}

function extractActionId(actionResult: Record<string, unknown>): string | undefined {
  const candidates = [
    getPath(actionResult, ["result", "action_record", "id"]),
    getPath(actionResult, ["action_record", "id"]),
    getPath(actionResult, ["result", "action_id"]),
    actionResult.action_id,
    actionResult.id,
  ];

  return candidates.find((candidate): candidate is string => typeof candidate === "string" && candidate.trim().length > 0);
}

async function assertWorkItemExists(config: CompletionConfig): Promise<void> {
  let response: Response;
  try {
    response = await fetch(buildWorkItemUrl(config));
  } catch {
    throw new Error("CODEX_RECORD_COMPLETION_RUNTIME_UNAVAILABLE");
  }

  if (response.ok) {
    return;
  }

  const parsedBody = await readJson(response);
  if (response.status === 404) {
    throw new Error(
      `CODEX_RECORD_COMPLETION_UNKNOWN_WORK_ID work_id=${config.workId} scope=${config.scope} body=${JSON.stringify(parsedBody)}`,
    );
  }

  throw new Error(
    `CODEX_RECORD_COMPLETION_WORK_PREFLIGHT_FAILED status=${response.status} body=${JSON.stringify(parsedBody)}`,
  );
}

async function recordWorkEvent(
  config: CompletionConfig,
  relatedActionId: string | undefined,
): Promise<Record<string, unknown>> {
  const body: Record<string, unknown> = {
    scope: config.scope,
    actor: config.actor,
    event_type: config.eventType,
    summary: config.resultSummary,
    result_status: config.resultStatus,
    result_kind: config.resultKind,
    related_state_keys: config.relatedStateKeys,
  };

  if (relatedActionId) body.related_action_id = relatedActionId;
  if (config.relatedPr) body.related_pr = config.relatedPr;

  let response: Response;
  try {
    response = await fetch(buildWorkEventUrl(config), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("CODEX_RECORD_COMPLETION_RUNTIME_UNAVAILABLE");
  }

  const parsedBody = await readJson(response);
  if (!response.ok) {
    throw new Error(`CODEX_RECORD_COMPLETION_WORK_EVENT_FAILED status=${response.status} body=${JSON.stringify(parsedBody)}`);
  }

  const parsed = WorkEventResultSchema.safeParse(parsedBody);
  if (!parsed.success) {
    throw new Error("CODEX_RECORD_COMPLETION_INVALID_WORK_EVENT_RESPONSE");
  }

  return parsed.data;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

function printCompletionResult({
  config,
  actionResult,
  workEventResult,
  relatedActionId,
}: {
  config: CompletionConfig;
  actionResult: Record<string, unknown>;
  workEventResult: Record<string, unknown>;
  relatedActionId?: string;
}) {
  console.log("Augnes Codex completion recorded");
  console.log(`scope: ${config.scope}`);
  console.log(`work_id: ${config.workId}`);
  console.log(`action_name: ${config.actionName}`);
  console.log(`result_status: ${config.resultStatus}`);
  console.log(`result_kind: ${config.resultKind}`);
  console.log(`event_type: ${config.eventType}`);
  console.log(`related_action_id: ${relatedActionId ?? "(none returned)"}`);
  console.log(`related_pr: ${config.relatedPr ?? "(none)"}`);
  console.log(`files_changed count: ${config.filesChanged.length}`);
  console.log(`related_state_keys count: ${config.relatedStateKeys.length}`);
  console.log(`action_record_response: ${JSON.stringify(actionResult)}`);
  console.log(`work_event_response: ${JSON.stringify(workEventResult)}`);
  console.log(`Verify work event: ${config.apiBaseUrl}/api/work/${config.workId}/brief?scope=${encodeURIComponent(config.scope)}`);
  console.log(`Verify action record: ${config.apiBaseUrl}/api/state/brief?scope=${encodeURIComponent(config.scope)}`);
  console.log("read_only_review_refs:");
  console.log(
    `work_brief_url: ${buildReviewUrl(
      config.apiBaseUrl,
      `/api/work/${encodeURIComponent(config.workId)}/brief`,
      { scope: config.scope },
    )}`,
  );
  console.log(
    `state_brief_url: ${buildReviewUrl(config.apiBaseUrl, "/api/state/brief", {
      scope: config.scope,
    })}`,
  );
  console.log(
    `evidence_pack_url: ${buildReviewUrl(config.apiBaseUrl, "/api/evidence-pack", {
      scope: config.scope,
      work_id: config.workId,
    })}`,
  );
  if (config.sessionId) {
    console.log(
      `session_trace_url: ${buildReviewUrl(
        config.apiBaseUrl,
        `/api/sessions/${encodeURIComponent(config.sessionId)}/trace`,
        { scope: config.scope },
      )}`,
    );
  }
  console.log("This helper records completion proof and trace notes only; it does not commit or reject state proposals.");
}

async function main() {
  const config = resolveCompletionConfig();
  await assertWorkItemExists(config);
  const actionResult = await recordActionResult(
    resolveRecordResultConfig({
      apiBaseUrl: config.apiBaseUrl,
      scope: config.scope,
      sourceAgentId: config.sourceAgentId,
      actionName: config.actionName,
      resultSummary: config.resultSummary,
      filesChanged: config.filesChanged,
      resultStatus: config.resultStatus,
      resultKind: config.resultKind,
      workId: config.workId,
    }),
  );
  const relatedActionId = extractActionId(actionResult);
  const workEventResult = await recordWorkEvent(config, relatedActionId);

  printCompletionResult({ config, actionResult, workEventResult, relatedActionId });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "CODEX_RECORD_COMPLETION_FAILED";
    console.error(message);
    process.exitCode = 1;
  });
}
