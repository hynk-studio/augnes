import { pathToFileURL } from "node:url";
import { z } from "zod";
import {
  StateRuntimeActionResultKindSchema,
  StateRuntimeActionResultStatusSchema,
  type StateRuntimeActionResultKind,
  type StateRuntimeActionResultStatus,
} from "../src/lib/state-runtime-types.js";

const DEFAULT_API_BASE_URL = "http://localhost:3000";
const DEFAULT_SCOPE = "project:augnes";
const DEFAULT_SOURCE_AGENT_ID = "agent:codex";
const DEFAULT_ACTION_NAME = "codex_handoff_demo";
const DEFAULT_RESULT_SUMMARY = "Codex handoff demo recorded an external action result through Augnes.";
const DEFAULT_FILES_CHANGED = "docs/CODEX_HANDOFF_DEMO.md";

const ActionRecordResultSchema = z.record(z.unknown());

export interface RecordResultConfig {
  apiBaseUrl: string;
  scope: string;
  sourceAgentId: string;
  actionName: string;
  resultSummary: string;
  filesChanged: string[];
  resultStatus?: StateRuntimeActionResultStatus;
  resultKind?: StateRuntimeActionResultKind;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function readEnv(name: string, fallback: string): string {
  return (process.env[name] ?? fallback).trim() || fallback;
}

export function readFilesChanged(): string[] {
  const rawFilesChanged = process.env.CODEX_FILES_CHANGED;
  const filesChanged = rawFilesChanged === undefined ? DEFAULT_FILES_CHANGED : rawFilesChanged;

  return filesChanged
    .split(",")
    .map((file) => file.trim())
    .filter(Boolean);
}

function readOptionalEnv<T extends string>(name: string, schema: z.ZodType<T>): T | undefined {
  const rawValue = process.env[name];
  if (rawValue === undefined) return undefined;

  const value = rawValue.trim();
  if (!value) return undefined;

  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new Error(`Invalid ${name}: ${value}`);
  }

  return parsed.data;
}

export function resolveRecordResultConfig(overrides: Partial<RecordResultConfig> = {}): RecordResultConfig {
  return {
    apiBaseUrl:
      overrides.apiBaseUrl ??
      trimTrailingSlash((process.env.AUGNES_API_BASE_URL ?? DEFAULT_API_BASE_URL).trim() || DEFAULT_API_BASE_URL),
    scope: overrides.scope ?? readEnv("AUGNES_SCOPE", DEFAULT_SCOPE),
    sourceAgentId: overrides.sourceAgentId ?? readEnv("CODEX_SOURCE_AGENT_ID", DEFAULT_SOURCE_AGENT_ID),
    actionName: overrides.actionName ?? readEnv("CODEX_ACTION_NAME", DEFAULT_ACTION_NAME),
    resultSummary: overrides.resultSummary ?? readEnv("CODEX_RESULT_SUMMARY", DEFAULT_RESULT_SUMMARY),
    filesChanged: overrides.filesChanged ?? readFilesChanged(),
    resultStatus: overrides.resultStatus ?? readOptionalEnv("CODEX_RESULT_STATUS", StateRuntimeActionResultStatusSchema),
    resultKind: overrides.resultKind ?? readOptionalEnv("CODEX_RESULT_KIND", StateRuntimeActionResultKindSchema),
  };
}

function buildRecordActionUrl(apiBaseUrl: string): URL {
  try {
    return new URL("/api/actions/record", `${apiBaseUrl}/`);
  } catch {
    throw new Error("CODEX_RECORD_RESULT_INVALID_BASE_URL");
  }
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) return {};

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error("CODEX_RECORD_RESULT_INVALID_JSON");
  }
}

export async function recordActionResult(config: RecordResultConfig): Promise<Record<string, unknown>> {
  const url = buildRecordActionUrl(config.apiBaseUrl);
  const body: Record<string, unknown> = {
    scope: config.scope,
    source_agent_id: config.sourceAgentId,
    action_name: config.actionName,
    result_summary: config.resultSummary,
    files_changed: config.filesChanged,
  };

  if (config.resultStatus) {
    body.result_status = config.resultStatus;
  }

  if (config.resultKind) {
    body.result_kind = config.resultKind;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("CODEX_RECORD_RESULT_RUNTIME_UNAVAILABLE");
  }

  if (!response.ok) {
    throw new Error(`CODEX_RECORD_RESULT_REQUEST_FAILED status=${response.status}`);
  }

  const parsed = ActionRecordResultSchema.safeParse(await readJson(response));
  if (!parsed.success) {
    throw new Error("CODEX_RECORD_RESULT_INVALID_RESPONSE");
  }

  return parsed.data;
}

function collectIdFields(value: unknown, prefix = "", output: Record<string, unknown> = {}): Record<string, unknown> {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectIdFields(item, `${prefix}${prefix ? "." : ""}${index}`, output));
    return output;
  }

  if (typeof value !== "object" || value === null) return output;

  for (const [key, child] of Object.entries(value)) {
    const path = `${prefix}${prefix ? "." : ""}${key}`;
    if (/(\b|_)(id|ids)$/.test(key) || key.endsWith("_id") || key.endsWith("_ids")) {
      output[path] = child;
    }
    collectIdFields(child, path, output);
  }

  return output;
}

export function printRecordResult(config: RecordResultConfig, result: Record<string, unknown>) {
  const ids = collectIdFields(result);

  console.log("Augnes action record result");
  console.log(`scope: ${config.scope}`);
  console.log(`action_name: ${config.actionName}`);
  console.log(`source_agent_id: ${config.sourceAgentId}`);
  console.log(`files_changed count: ${config.filesChanged.length}`);
  console.log(`result_status: ${config.resultStatus ?? "(runtime default)"}`);
  console.log(`result_kind: ${config.resultKind ?? "(runtime default)"}`);
  console.log(`ids: ${Object.keys(ids).length ? JSON.stringify(ids) : "(none returned)"}`);
  console.log(`raw_result: ${JSON.stringify(result)}`);
  console.log(`Refresh http://localhost:3000 and confirm the Temporal State Graph shows external.${config.actionName}_recorded`);
}

async function main() {
  const config = resolveRecordResultConfig();
  const result = await recordActionResult(config);
  printRecordResult(config, result);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "CODEX_RECORD_RESULT_FAILED";
    console.error(message);
    process.exitCode = 1;
  });
}
