import { pathToFileURL } from "node:url";
import { z } from "zod";

const DEFAULT_API_BASE_URL = "http://localhost:3000";
const DEFAULT_SCOPE = "project:augnes";
const GUIDE_MARKER = "guide-brief-v0.2";
const PROJECT_ID = /^project:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

const StringArraySchema = z.array(z.string());
const AuthoritySchema = z.object({
  source_of_truth: z.literal(false),
  can_approve: z.literal(false),
  can_transition: z.literal(false),
  can_execute_codex: z.literal(false),
  can_write_db: z.literal(false),
  can_call_github: z.literal(false),
  can_call_openai_or_provider: z.literal(false),
  notes: StringArraySchema,
}).passthrough();
const GuideBriefSchema = z.object({
  runtime: z.literal("augnes_current_project"),
  guide_version: z.literal("guide_brief.v0.2"),
  generated_at: z.string(),
  identity: z.object({
    project_id: z.string().nullable(),
    project_display_name: z.string().nullable(),
    project_context: z.enum(["none", "current", "viewed"]),
  }).passthrough(),
  source_status: z.enum(["live_current_project", "project_choice", "viewed_project", "partial", "unavailable"]),
  gaps: StringArraySchema,
  coordinate: z.object({
    goal: z.string().nullable(),
    work_status: z.string(),
    material_blocker_or_uncertainty: z.string().nullable(),
    unresolved_user_judgment: z.string().nullable(),
    delegated_work: z
      .object({
        stage: z.string(),
        latest_checkpoint: z.string().nullable(),
        needs_user: z.boolean(),
        trusted_result_available: z.boolean(),
        next_action: z.string(),
      })
      .nullable(),
  }).passthrough(),
  observed: z.array(z.object({ statement: z.string(), source_refs: StringArraySchema }).passthrough()),
  inferred: z.array(z.object({ statement: z.string(), caveats: StringArraySchema }).passthrough()),
  suggested: z.array(z.object({ label: z.string(), reason: z.string() }).passthrough()),
  needs_user_judgment: z.array(z.object({ question: z.string(), why_it_matters: z.string(), resolved: z.literal(false) }).passthrough()),
  primary_guidance: z.object({ label: z.string(), reason: z.string(), executes: z.literal(false) }).passthrough(),
  projections: z.object({
    codex: z.object({
      constraints: StringArraySchema,
      required_checks: StringArraySchema,
      non_goals: StringArraySchema,
      source_refs: StringArraySchema,
      task_context_packet_delivered_separately: z.literal(true),
      guide_does_not_override_packet: z.literal(true),
    }).passthrough(),
  }).passthrough(),
  authority: AuthoritySchema,
}).passthrough();

const WorkBriefSchema = z.object({
  runtime: z.string().min(1),
  scope: z.string().min(1),
  work_id: z.string().min(1),
  work: z.object({ title: z.string().min(1), status: z.string().min(1), next_action: z.string(), user_attention_required: z.boolean() }).passthrough(),
  next_action: z.string(),
  user_attention_required: z.boolean(),
  related_state_keys: StringArraySchema,
  related_proof: z.object({ action_ids: StringArraySchema, prs: StringArraySchema, docs: StringArraySchema }).passthrough(),
  codex_handoff: z.object({ task_brief: z.string(), constraints: StringArraySchema, suggested_verification: StringArraySchema }).passthrough(),
}).passthrough();

type GuideBrief = z.infer<typeof GuideBriefSchema>;
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

export function resolveConfig() {
  const apiBaseUrl = trimTrailingSlash((process.env.AUGNES_API_BASE_URL ?? DEFAULT_API_BASE_URL).trim() || DEFAULT_API_BASE_URL);
  const scope = readDefaultedEnv(["CODEX_SCOPE", "AUGNES_SCOPE"], DEFAULT_SCOPE);
  const workId = process.env.CODEX_WORK_ID?.trim() || null;
  const projectId = process.env.CODEX_PROJECT_ID?.trim() || null;
  if (projectId && !PROJECT_ID.test(projectId)) throw new Error("CODEX_READ_BRIEF_INVALID_PROJECT_ID");
  return { apiBaseUrl, scope, workId, projectId };
}

export function buildGuideBriefUrl(apiBaseUrl: string, scope: string, projectId: string | null): URL {
  try {
    const url = new URL("/api/augnes/read/guide-brief", `${apiBaseUrl}/`);
    url.searchParams.set("scope", scope);
    if (projectId) url.searchParams.set("project_id", projectId);
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

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error("CODEX_READ_BRIEF_INVALID_JSON");
  }
}

export async function fetchGuideBrief(apiBaseUrl: string, scope: string, projectId: string | null): Promise<GuideBrief> {
  let response: Response;
  try {
    response = await fetch(buildGuideBriefUrl(apiBaseUrl, scope, projectId), {
      method: "GET",
      headers: { "x-augnes-local-readonly": GUIDE_MARKER },
    });
  } catch {
    throw new Error("CODEX_READ_BRIEF_RUNTIME_UNAVAILABLE");
  }
  if (!response.ok) throw new Error(`CODEX_READ_BRIEF_GUIDE_REQUEST_FAILED status=${response.status}`);
  const parsed = GuideBriefSchema.safeParse(await readJson(response));
  if (!parsed.success) throw new Error("CODEX_READ_BRIEF_INVALID_GUIDE_RESPONSE");
  return parsed.data;
}

export async function fetchWorkBrief(apiBaseUrl: string, scope: string, workId: string): Promise<WorkBrief> {
  let response: Response;
  try {
    response = await fetch(buildWorkBriefUrl(apiBaseUrl, scope, workId));
  } catch {
    throw new Error("CODEX_READ_BRIEF_RUNTIME_UNAVAILABLE");
  }
  if (!response.ok) throw new Error(`CODEX_READ_BRIEF_WORK_REQUEST_FAILED status=${response.status}`);
  const parsed = WorkBriefSchema.safeParse(await readJson(response));
  if (!parsed.success) throw new Error("CODEX_READ_BRIEF_INVALID_WORK_RESPONSE");
  return parsed.data;
}

function printList(label: string, values: string[]) {
  console.log(label);
  if (!values.length) {
    console.log("- None currently summarized");
    return;
  }
  for (const value of values) console.log(`- ${value}`);
}

export function printGuideBriefSummary(brief: GuideBrief) {
  console.log("Augnes current-project GuideBrief v0.2");
  console.log("Current coordinate");
  console.log(`- project: ${brief.identity.project_display_name ?? "No current project"}`);
  console.log(`- context: ${brief.identity.project_context}`);
  console.log(`- goal: ${brief.coordinate.goal ?? "No current goal"}`);
  console.log(`- status: ${brief.coordinate.work_status}`);
  if (brief.coordinate.delegated_work) {
    console.log(`- delegated work: ${brief.coordinate.delegated_work.stage}`);
    console.log(
      `- latest checkpoint: ${brief.coordinate.delegated_work.latest_checkpoint ?? "No checkpoint summarized"}`,
    );
  }
  printList("Observed", brief.observed.map((item) => item.statement));
  printList("Inferred with caveats", brief.inferred.map((item) => `${item.statement} Caveat: ${item.caveats.join("; ") || "bounded derived interpretation"}`));
  printList("Suggested", brief.suggested.map((item) => `${item.label}: ${item.reason}`));
  printList("Needs user judgment", brief.needs_user_judgment.map((item) => `${item.question} ${item.why_it_matters}`));
  printList("Constraints", brief.projections.codex.constraints);
  printList("Required checks", brief.projections.codex.required_checks);
  printList("Authority boundary", [
    "GuideBrief is a View, not project truth or proof.",
    "Suggestions are not instructions.",
    "The exact TaskContextPacket is delivered separately and is not overridden by GuideBrief.",
    "GuideBrief cannot approve, execute Codex, write the database, call GitHub, or call a provider.",
  ]);
  console.log("Source status");
  console.log(`- ${brief.source_status}`);
  for (const gap of brief.gaps) console.log(`- gap: ${gap}`);
}

export function printWorkBriefSummary(brief: WorkBrief) {
  console.log("");
  console.log("Optional current work brief");
  console.log(`work_id: ${brief.work_id}`);
  console.log(`title: ${brief.work.title}`);
  console.log(`status: ${brief.work.status}`);
  console.log(`next_action: ${brief.next_action}`);
  printList("work constraints", brief.codex_handoff.constraints);
  printList("work suggested verification", brief.codex_handoff.suggested_verification);
}

async function main() {
  const { apiBaseUrl, scope, workId, projectId } = resolveConfig();
  const guide = await fetchGuideBrief(apiBaseUrl, scope, projectId);
  printGuideBriefSummary(guide);
  if (workId) printWorkBriefSummary(await fetchWorkBrief(apiBaseUrl, scope, workId));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "CODEX_READ_BRIEF_FAILED");
    process.exitCode = 1;
  });
}
