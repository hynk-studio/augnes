import { pathToFileURL } from "node:url";
import { z } from "zod";

const DEFAULT_API_BASE_URL = "http://localhost:3000";
const DEFAULT_SCOPE = "project:augnes";
const DEFAULT_SURFACE = "codex";
const DEFAULT_ACTOR = "codex";

const SurfaceSchema = z.enum([
  "chatgpt",
  "codex",
  "cockpit",
  "browser",
  "github",
  "local_runtime",
  "other",
]);

type BindSessionConfig = {
  apiBaseUrl: string;
  sessionId: string;
  scope: string;
  surface: z.infer<typeof SurfaceSchema>;
  actor?: string;
  relatedWorkId?: string;
  relatedPr?: string;
  summary?: string;
  handoffRef?: string;
  evidencePackRef?: string;
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

export function resolveBindSessionConfig(): BindSessionConfig {
  const apiBaseUrl = trimTrailingSlash(
    readDefaultedEnv(["AUGNES_API_BASE_URL"], DEFAULT_API_BASE_URL),
  );
  const surface = SurfaceSchema.safeParse(
    readDefaultedEnv(["CODEX_SESSION_SURFACE"], DEFAULT_SURFACE),
  );
  if (!surface.success) {
    throw new Error(`Invalid CODEX_SESSION_SURFACE: ${surface.error.message}`);
  }

  return {
    apiBaseUrl,
    sessionId: readRequiredEnv("CODEX_SESSION_ID"),
    scope: readDefaultedEnv(["CODEX_SCOPE", "AUGNES_SCOPE"], DEFAULT_SCOPE),
    surface: surface.data,
    actor: readDefaultedEnv(["CODEX_SESSION_ACTOR"], DEFAULT_ACTOR),
    relatedWorkId: readOptionalEnv("CODEX_WORK_ID"),
    relatedPr: readOptionalEnv("CODEX_RELATED_PR"),
    summary: readOptionalEnv("CODEX_SESSION_SUMMARY"),
    handoffRef: readOptionalEnv("CODEX_HANDOFF_REF"),
    evidencePackRef: readOptionalEnv("CODEX_EVIDENCE_PACK_REF"),
  };
}

function buildBindUrl(config: BindSessionConfig): URL {
  try {
    return new URL("/api/sessions/bind", `${config.apiBaseUrl}/`);
  } catch {
    throw new Error("CODEX_BIND_SESSION_INVALID_BASE_URL");
  }
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) return {};

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error("CODEX_BIND_SESSION_INVALID_JSON");
  }
}

function cleanBody(config: BindSessionConfig) {
  return Object.fromEntries(
    Object.entries({
      session_id: config.sessionId,
      scope: config.scope,
      surface: config.surface,
      actor: config.actor,
      related_work_id: config.relatedWorkId,
      related_pr: config.relatedPr,
      summary: config.summary,
      handoff_ref: config.handoffRef,
      evidence_pack_ref: config.evidencePackRef,
    }).filter(([, value]) => value !== undefined),
  );
}

export async function bindCodexSession(
  config: BindSessionConfig,
): Promise<Record<string, unknown>> {
  let response: Response;
  try {
    response = await fetch(buildBindUrl(config), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(cleanBody(config)),
    });
  } catch {
    throw new Error("CODEX_BIND_SESSION_RUNTIME_UNAVAILABLE");
  }

  const parsed = await readJson(response);
  if (!response.ok) {
    throw new Error(
      `CODEX_BIND_SESSION_FAILED status=${response.status} body=${JSON.stringify(parsed)}`,
    );
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("CODEX_BIND_SESSION_INVALID_RESPONSE");
  }

  return parsed as Record<string, unknown>;
}

function printResult(config: BindSessionConfig, result: Record<string, unknown>) {
  console.log("Augnes Codex session binding recorded");
  console.log(`scope: ${config.scope}`);
  console.log(`session_id: ${config.sessionId}`);
  console.log(`surface: ${config.surface}`);
  console.log(`related_work_id: ${config.relatedWorkId ?? "(none)"}`);
  console.log(`related_pr: ${config.relatedPr ?? "(none)"}`);
  console.log(`response: ${JSON.stringify(result)}`);
  console.log(
    `Verify trace: ${config.apiBaseUrl}/api/sessions/${encodeURIComponent(config.sessionId)}/trace?scope=${encodeURIComponent(config.scope)}`,
  );
  console.log("Session Trace note: action_records_by_session counts only action_records whose source_session_id matches this session.");
  console.log("Session Trace note: proof-only completion actions keep source_session_id null and appear through bound work_events.related_action_id.");
  console.log("This helper binds metadata only; it does not execute Codex, publish, approve, or record evidence.");
}

async function main() {
  const config = resolveBindSessionConfig();
  const result = await bindCodexSession(config);
  printResult(config, result);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "CODEX_BIND_SESSION_FAILED";
    console.error(message);
    process.exitCode = 1;
  });
}
