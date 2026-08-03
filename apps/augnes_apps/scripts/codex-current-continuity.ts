import { pathToFileURL } from "node:url";
import { z } from "zod";

const DEFAULT_API_BASE_URL = "http://localhost:3000";
const REQUEST_SCOPE = "project:augnes";
const ROUTE_MARKER = "codex-current-continuity-v0.1";
const JSON_BEGIN = "BEGIN_AUGNES_CODEX_CURRENT_CONTINUITY_JSON";
const JSON_END = "END_AUGNES_CODEX_CURRENT_CONTINUITY_JSON";

const StringArraySchema = z.array(z.string());
const NullableStringSchema = z.string().nullable();
const ProjectionSchema = z.object({
  projection_version: z.literal("codex_current_continuity.v0.1"),
  generated_at: z.string().datetime(),
  source_status: z.enum(["exact", "partial", "unavailable"]),
  snapshot: z.object({
    binding_version: z.literal("codex_current_continuity_snapshot.v0.1"),
    algorithm: z.literal("sha256"),
    status: z.enum(["exact", "unavailable"]),
    binding: NullableStringSchema,
  }).strict(),
  project: z.object({
    status: z.enum([
      "no_workspace",
      "no_active_project",
      "inactive_project",
      "active_project",
      "active_project_root_unavailable",
      "project_source_unavailable",
    ]),
    project_key: NullableStringSchema,
    display_name: NullableStringSchema,
    active: z.boolean(),
    selection_revision: z.number().int().nonnegative().nullable(),
    root_availability: z.enum([
      "available",
      "missing",
      "inaccessible",
      "not_directory",
      "inspection_error",
      "not_available",
    ]),
  }).strict(),
  current_work: z.object({
    status: z.enum([
      "no_current_work",
      "current_work",
      "stale_current_work",
      "current_work_unavailable",
      "current_work_ambiguous",
    ]),
    goal: NullableStringSchema,
    success_criteria: StringArraySchema,
    non_goals: StringArraySchema,
    lineage_kind: z.enum([
      "initial_user_defined",
      "pre_execution_user_revision",
      "semantic_transition",
    ]).nullable(),
    currentness: z.enum(["fresh", "stale", "unavailable_or_ambiguous", "not_available"]),
    start_eligible: z.boolean(),
    start_blocker: NullableStringSchema,
    revision_eligible: z.boolean(),
    revision_blocker: NullableStringSchema,
  }).strict(),
  managed_execution: z.object({
    stage: z.enum([
      "no_run",
      "preparing",
      "running",
      "waiting_for_approval",
      "cancellation_requested",
      "reconciliation_required",
      "terminal_result_ready",
      "blocked",
      "failed",
      "cancelled",
      "timed_out",
      "unavailable_or_inconsistent",
    ]),
    mode: z.enum(["interactive", "policy_triggered", "unknown"]).nullable(),
    latest_checkpoint: NullableStringSchema,
    blocker_or_attention: NullableStringSchema,
    attention_required: z.boolean(),
    reconciliation_required: z.boolean(),
    result_available: z.boolean(),
    updated_at: NullableStringSchema,
  }).strict(),
  latest_result: z.object({
    state: z.enum(["no_result", "result_unavailable", "result_present"]),
    currentness: z.enum(["current", "stale", "unavailable_or_ambiguous", "not_available"]),
    outcome: NullableStringSchema,
    execution_status: NullableStringSchema,
    verification_status: NullableStringSchema,
    summary: NullableStringSchema,
    recorded_at: NullableStringSchema,
    artifacts: z.array(z.object({
      kind: z.string(),
      repository_relative_path: NullableStringSchema,
      summary: NullableStringSchema,
      change_kind: z.enum(["added", "modified", "deleted", "renamed", "unknown"]).nullable(),
      basis: z.enum(["observed", "attested", "mixed", "unknown"]),
    }).strict()),
    checks: z.array(z.object({
      check: z.string(),
      status: z.enum(["passed", "failed", "blocked", "unknown"]),
      required: z.boolean(),
      summary: z.string(),
    }).strict()),
    skipped_checks: z.array(z.object({
      check: z.string(),
      required: z.boolean(),
      reason: z.string(),
    }).strict()),
    blockers: StringArraySchema,
    warnings: StringArraySchema,
    gaps: StringArraySchema,
    incomplete_historical_fields: StringArraySchema,
    review_attention: NullableStringSchema,
    proposed_next_steps: StringArraySchema,
  }).strict(),
  review_continuity: z.object({
    state: z.enum([
      "no_proposal",
      "proposal_present_decision_pending",
      "decision_recorded",
      "accepted_decision_awaiting_transition",
      "transition_blocked",
      "transition_applied",
      "review_source_unavailable_or_inconsistent",
    ]),
    summary: z.string(),
    decision_kind: NullableStringSchema,
    transition_currentness: z.enum(["current", "blocked", "applied", "not_available"]),
  }).strict(),
  next_action: z.object({
    kind: z.enum([
      "choose_project",
      "make_project_active",
      "restore_project_root",
      "define_work",
      "revise_or_refresh_work",
      "start_current_work",
      "view_progress",
      "review_host_approval",
      "resume_or_reconcile_work",
      "review_result",
      "review_proposal",
      "record_decision",
      "complete_authorized_transition",
      "understand_updated_project",
      "no_available_action",
      "unavailable",
    ]),
    label: z.string(),
    reason: z.string(),
    user_action_required: z.boolean(),
    executes: z.literal(false),
  }).strict(),
  authority: z.object({
    writes_database: z.literal(false),
    writes_project_files: z.literal(false),
    changes_project_selection: z.literal(false),
    changes_operator_session: z.literal(false),
    creates_run: z.literal(false),
    starts_codex_or_native_host: z.literal(false),
    calls_provider: z.literal(false),
    approves_host_action: z.literal(false),
    cancels_or_resumes_run: z.literal(false),
    creates_or_admits_result: z.literal(false),
    creates_proof_or_evidence: z.literal(false),
    creates_proposal: z.literal(false),
    creates_review_decision: z.literal(false),
    creates_or_applies_transition: z.literal(false),
    mutates_accepted_state: z.literal(false),
    retries_or_replays: z.literal(false),
    calls_github: z.literal(false),
    creates_branch_or_pr: z.literal(false),
    merges_releases_or_deploys: z.literal(false),
    starts_background_work: z.literal(false),
  }).strict(),
  gaps: StringArraySchema,
}).strict();

export type CodexCurrentContinuityProjection = z.infer<typeof ProjectionSchema>;

export function resolveConfig(environment: NodeJS.ProcessEnv = process.env) {
  const raw = environment.AUGNES_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;
  return { apiBaseUrl: normalizeLocalBaseUrl(raw), scope: REQUEST_SCOPE } as const;
}

export function buildCurrentContinuityUrl(apiBaseUrl: string): URL {
  const url = new URL("/api/augnes/read/codex-current-continuity", `${normalizeLocalBaseUrl(apiBaseUrl)}/`);
  url.searchParams.set("scope", REQUEST_SCOPE);
  return url;
}

export async function fetchCurrentContinuity(
  apiBaseUrl: string,
  runtimeFetch: typeof fetch = fetch,
): Promise<CodexCurrentContinuityProjection> {
  let response: Response;
  try {
    response = await runtimeFetch(buildCurrentContinuityUrl(apiBaseUrl), {
      method: "GET",
      cache: "no-store",
      headers: { "x-augnes-local-readonly": ROUTE_MARKER },
    });
  } catch {
    throw new Error("CODEX_CURRENT_CONTINUITY_RUNTIME_UNAVAILABLE");
  }
  if (!response.ok) {
    throw new Error(`CODEX_CURRENT_CONTINUITY_REQUEST_FAILED status=${response.status}`);
  }
  if (response.headers.get("x-augnes-local-readonly") !== ROUTE_MARKER) {
    throw new Error("CODEX_CURRENT_CONTINUITY_ROUTE_MARKER_INVALID");
  }
  const text = await response.text();
  let json: unknown;
  try {
    json = JSON.parse(text) as unknown;
  } catch {
    throw new Error("CODEX_CURRENT_CONTINUITY_INVALID_JSON");
  }
  const parsed = ProjectionSchema.safeParse(json);
  if (!parsed.success) throw new Error("CODEX_CURRENT_CONTINUITY_INVALID_RESPONSE");
  return parsed.data;
}

export function formatHumanSummary(projection: CodexCurrentContinuityProjection): string {
  const lines = [
    "Augnes exact current continuity v0.1",
    `source_status: ${projection.source_status}`,
    `project: ${projection.project.display_name ?? projection.project.status}`,
    `project_status: ${projection.project.status}`,
    `root_availability: ${projection.project.root_availability}`,
    `work_status: ${projection.current_work.status}`,
    `work_currentness: ${projection.current_work.currentness}`,
    `managed_execution: ${projection.managed_execution.stage}`,
    `latest_result: ${projection.latest_result.state}`,
    `result_currentness: ${projection.latest_result.currentness}`,
    `review_state: ${projection.review_continuity.state}`,
    `next_action: ${projection.next_action.label}`,
    `user_action_required: ${projection.next_action.user_action_required}`,
    `snapshot_status: ${projection.snapshot.status}`,
  ];
  if (projection.current_work.goal) lines.push(`goal: ${projection.current_work.goal}`);
  if (projection.gaps.length) lines.push(`gaps: ${projection.gaps.join(" | ")}`);
  lines.push("authority: read-only; no Start, approval, Decision, Transition, provider, GitHub, or persistence");
  return lines.join("\n");
}

export function formatMachineResult(projection: CodexCurrentContinuityProjection): string {
  return `${JSON_BEGIN}\n${JSON.stringify(projection)}\n${JSON_END}`;
}

export function exitCodeForError(error: unknown): 2 | 3 {
  return error instanceof Error && error.message === "CODEX_CURRENT_CONTINUITY_RUNTIME_UNAVAILABLE"
    ? 2
    : 3;
}

export async function main(): Promise<void> {
  const { apiBaseUrl } = resolveConfig();
  const projection = await fetchCurrentContinuity(apiBaseUrl);
  console.log(formatHumanSummary(projection));
  console.log(formatMachineResult(projection));
}

function normalizeLocalBaseUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("CODEX_CURRENT_CONTINUITY_INVALID_BASE_URL");
  }
  const localHost = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]" || url.hostname === "::1";
  if (url.protocol !== "http:" || !localHost || url.username || url.password || url.search || url.hash) {
    throw new Error("CODEX_CURRENT_CONTINUITY_LOCAL_RUNTIME_REQUIRED");
  }
  return url.toString().replace(/\/+$/u, "");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "CODEX_CURRENT_CONTINUITY_FAILED");
    process.exitCode = exitCodeForError(error);
  });
}
