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

const StringArraySchema = z.array(z.string());
const WorkBriefSchema = z
  .object({
    runtime: z.string().min(1),
    scope: z.string().min(1),
    work_id: z.string().min(1),
    work: z
      .object({
        title: z.string().min(1),
        status: z.string().min(1),
        next_action: z.string(),
        user_attention_required: z.boolean(),
      })
      .passthrough(),
    next_action: z.string(),
    user_attention_required: z.boolean(),
    related_state_keys: StringArraySchema,
    related_proof: z
      .object({
        action_ids: StringArraySchema,
        prs: StringArraySchema,
        docs: StringArraySchema,
      })
      .passthrough(),
    codex_handoff: z
      .object({
        task_brief: z.string(),
        constraints: StringArraySchema,
        suggested_verification: StringArraySchema,
      })
      .passthrough(),
  })
  .passthrough();

type StateBrief = z.infer<typeof StateBriefSchema>;
type WorkBrief = z.infer<typeof WorkBriefSchema>;

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

function resolveConfig() {
  const apiBaseUrl = trimTrailingSlash((process.env.AUGNES_API_BASE_URL ?? DEFAULT_API_BASE_URL).trim() || DEFAULT_API_BASE_URL);
  const scope = readDefaultedEnv(["CODEX_SCOPE", "AUGNES_SCOPE"], DEFAULT_SCOPE);
  const workId = process.env.CODEX_WORK_ID?.trim() || null;

  return { apiBaseUrl, scope, workId };
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

function buildWorkBriefUrl(apiBaseUrl: string, scope: string, workId: string): URL {
  try {
    const url = new URL(`/api/work/${encodeURIComponent(workId)}/brief`, `${apiBaseUrl}/`);
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

export async function fetchWorkBrief(
  apiBaseUrl: string,
  scope: string,
  workId: string,
): Promise<WorkBrief> {
  const url = buildWorkBriefUrl(apiBaseUrl, scope, workId);

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error("CODEX_READ_BRIEF_RUNTIME_UNAVAILABLE");
  }

  if (!response.ok) {
    throw new Error(`CODEX_READ_BRIEF_WORK_REQUEST_FAILED status=${response.status}`);
  }

  const parsed = WorkBriefSchema.safeParse(await readJson(response));
  if (!parsed.success) {
    throw new Error("CODEX_READ_BRIEF_INVALID_WORK_RESPONSE");
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

function printList(label: string, values: string[]) {
  if (!values.length) return;

  console.log(`${label}:`);
  for (const value of values) {
    console.log(`- ${value}`);
  }
}

export function printWorkBriefSummary(brief: WorkBrief) {
  console.log("");
  console.log("Augnes work brief");
  console.log(`work_id: ${brief.work_id}`);
  console.log(`scope: ${brief.scope}`);
  console.log(`title: ${brief.work.title}`);
  console.log(`status: ${brief.work.status}`);
  console.log(`next_action: ${brief.next_action}`);
  console.log(`user_attention_required: ${brief.user_attention_required}`);
  console.log(`related_state_keys count: ${brief.related_state_keys.length}`);
  printList("related_state_keys", brief.related_state_keys);

  console.log("codex_handoff.task_brief:");
  console.log(brief.codex_handoff.task_brief);
  printList("codex_handoff.constraints", brief.codex_handoff.constraints);
  printList(
    "codex_handoff.suggested_verification",
    brief.codex_handoff.suggested_verification,
  );
  printList("related_proof.action_ids", brief.related_proof.action_ids);
  printList("related_proof.prs", brief.related_proof.prs);
  printList("related_proof.docs", brief.related_proof.docs);
}

async function main() {
  const { apiBaseUrl, scope, workId } = resolveConfig();
  const brief = await fetchStateBrief(apiBaseUrl, scope);
  printStateBriefSummary(brief);

  if (workId) {
    const workBrief = await fetchWorkBrief(apiBaseUrl, scope, workId);
    printWorkBriefSummary(workBrief);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "CODEX_READ_BRIEF_FAILED";
    console.error(message);
    process.exitCode = 1;
  });
}
