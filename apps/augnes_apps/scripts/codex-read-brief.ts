import { z } from "zod";
import { pathToFileURL } from "node:url";

const DEFAULT_API_BASE_URL = "http://localhost:3000";
const DEFAULT_SCOPE = "project:augnes";

const StateBlockSchema = z.union([z.array(z.unknown()), z.record(z.unknown())]);
const StateBriefSchema = z
  .object({
    runtime: z.string().min(1),
    scope: z.string().min(1),
    active_state: StateBlockSchema,
    pending_proposals: z.array(z.unknown()),
    recent_actions: z.array(z.unknown()),
    open_tensions: z.array(z.unknown()),
    agent_instructions: z.array(z.unknown()).optional(),
  })
  .passthrough();

type StateBrief = z.infer<typeof StateBriefSchema>;

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function resolveConfig() {
  const apiBaseUrl = trimTrailingSlash((process.env.AUGNES_API_BASE_URL ?? DEFAULT_API_BASE_URL).trim() || DEFAULT_API_BASE_URL);
  const scope = (process.env.AUGNES_SCOPE ?? DEFAULT_SCOPE).trim() || DEFAULT_SCOPE;

  return { apiBaseUrl, scope };
}

function buildStateBriefUrl(apiBaseUrl: string, scope: string): URL {
  try {
    const url = new URL("/api/state/brief", `${apiBaseUrl}/`);
    url.searchParams.set("scope", scope);
    return url;
  } catch {
    throw new Error("CODEX_READ_BRIEF_INVALID_BASE_URL");
  }
}

function countBlock(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (typeof value === "object" && value !== null) return Object.keys(value).length;
  return 0;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error("CODEX_READ_BRIEF_INVALID_JSON");
  }
}

export async function fetchStateBrief(apiBaseUrl: string, scope: string): Promise<StateBrief> {
  const url = buildStateBriefUrl(apiBaseUrl, scope);

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error("CODEX_READ_BRIEF_RUNTIME_UNAVAILABLE");
  }

  if (!response.ok) {
    throw new Error(`CODEX_READ_BRIEF_REQUEST_FAILED status=${response.status}`);
  }

  const parsed = StateBriefSchema.safeParse(await readJson(response));
  if (!parsed.success) {
    throw new Error("CODEX_READ_BRIEF_INVALID_RESPONSE");
  }

  return parsed.data;
}

export function printStateBriefSummary(brief: StateBrief) {
  console.log("Augnes state brief");
  console.log(`runtime: ${brief.runtime}`);
  console.log(`scope: ${brief.scope}`);
  console.log(`active_state count: ${countBlock(brief.active_state)}`);
  console.log(`pending_proposals count: ${brief.pending_proposals.length}`);
  console.log(`recent_actions count: ${brief.recent_actions.length}`);
  console.log(`open_tensions count: ${brief.open_tensions.length}`);

  if (brief.agent_instructions?.length) {
    console.log("agent_instructions:");
    for (const instruction of brief.agent_instructions) {
      console.log(`- ${typeof instruction === "string" ? instruction : JSON.stringify(instruction)}`);
    }
  }
}

async function main() {
  const { apiBaseUrl, scope } = resolveConfig();
  const brief = await fetchStateBrief(apiBaseUrl, scope);
  printStateBriefSummary(brief);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "CODEX_READ_BRIEF_FAILED";
    console.error(message);
    process.exitCode = 1;
  });
}
