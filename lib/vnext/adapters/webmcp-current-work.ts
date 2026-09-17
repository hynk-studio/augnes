import { INITIAL_PROJECT_WORK_LIMITS_V01 } from "@/types/vnext/project-work-initialization";
import { SELECTED_WORK_SOURCE_LABELS } from "@/types/vnext/project-work-revision";

// Browser-only presentation boundary. Currentness, source admission and the
// pre-projection source byte budget remain owned by the authenticated reader.
const ROUTE = "/api/vnext/operator/project-continuity";
const NAME = "augnes_get_current_work_context";
const DESCRIPTION = "Read the current work displayed on this Augnes page. Returns a fresh authenticated, bounded read with untrusted source material. Read-only: no decisions, state changes or execution. Refuses if the displayed project or packet changed; refresh the page first. Not continuously current or authenticated proof of origin.";
const LINEAGES = {
  defined_initial_work: ["current_initial_packet", "initial_user_defined"],
  defined_revised_work: ["current_revision_packet", "pre_execution_user_revision"],
  defined_successor_work: ["current_successor_packet", "authored_successor_task"],
  defined_transition_work: ["current_transition_packet", "semantic_transition"],
  defined_operational_continuation_work: ["current_operational_continuation_packet", "source_linked_operational_continuation"],
} as const;
type ObjectValue = Record<string, unknown>;

export interface CurrentWorkWebMcpTool {
  name: string;
  title: string;
  description: string;
  inputSchema: { type: "object"; properties: Record<string, never>; additionalProperties: false };
  // These two hints were observed in native Chrome 153. ConsequentialHint is
  // in the newer draft but is not exposed by that qualified implementation.
  annotations: { readOnlyHint: true; untrustedContentHint: true };
  execute(input: unknown, options?: unknown): Promise<string>;
}
export interface CurrentWorkModelContext {
  registerTool(tool: CurrentWorkWebMcpTool, options: { signal: AbortSignal }): Promise<void>;
}

function object(value: unknown): ObjectValue {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("shape");
  return value as ObjectValue;
}
function text(value: unknown, limit: number): string {
  if (typeof value !== "string" || !value.trim() || [...value].length > limit ||
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value)) throw new Error("text");
  return value;
}
function identity(value: unknown): string {
  const result = text(value, 256);
  if (!/^[A-Za-z0-9:_.-]+$/u.test(result)) throw new Error("identity");
  return result;
}
function fingerprint(value: unknown): string {
  if (typeof value !== "string" || !/^sha256:[a-f0-9]{64}$/u.test(value)) throw new Error("fingerprint");
  return value;
}
function timestamp(value: unknown): string {
  const result = text(value, 32);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(result) ||
      !Number.isFinite(Date.parse(result)) || new Date(result).toISOString() !== result) throw new Error("time");
  return result;
}
function readBinding(value: unknown) {
  const init = object(value);
  if (init.initialization_version !== "project_work_initialization.v0.1" ||
      init.projection_only !== true || init.semantic_authority_granted !== false ||
      init.execution_authority_granted !== false) throw new Error("initialization");
  const workspace_id = identity(init.workspace_id);
  const project_id = identity(init.project_id);
  const state = text(init.state, 64) as keyof typeof LINEAGES;
  const lineage = Object.hasOwn(LINEAGES, state) ? LINEAGES[state] : null;
  const packet = object(init.current_packet);
  if (!lineage || init.reason !== lineage[0] || packet.lineage_kind !== lineage[1] ||
      init.active_project_id !== project_id || !Number.isSafeInteger(init.active_selection_revision) ||
      (init.active_selection_revision as number) < 1) throw new Error("binding");
  return {
    workspace_id, project_id, state, reason: lineage[0],
    active_selection_revision: init.active_selection_revision as number,
    current_packet: {
      packet_id: identity(packet.packet_id), packet_fingerprint: fingerprint(packet.packet_fingerprint),
      generated_at: timestamp(packet.generated_at), lineage_kind: lineage[1],
    },
  };
}

export function currentWorkWebMcpBindingKey(value: unknown): string | null {
  try { return JSON.stringify(readBinding(value)); } catch { return null; }
}

function projectSources(value: unknown) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 8) throw new Error("sources");
  const ids = new Set<string>();
  return value.map((value) => {
    const entry = object(value);
    const ref = object(entry.external_ref);
    const currentness = object(entry.currentness);
    const entry_id = identity(entry.entry_id);
    const source_ref = fingerprint(entry.source_ref);
    const trust_class = text(entry.trust_class, 32);
    const why_included = text(entry.why_included, 128);
    const observed_at = ref.observed_at == null ? null : timestamp(ref.observed_at);
    if (entry.entry_kind !== "source_ref" || entry_id !== `selected-source:${source_ref.slice(7)}` ||
        ids.has(entry_id) || ref.ref_version !== "external_ref.v0.1" || ref.ref_type !== "selected_source_excerpt" ||
        ref.compatibility_namespace !== "augnes.selected-source-excerpt.v0.1" ||
        ref.external_id !== entry_id || ref.source_ref !== source_ref || ref.trust_class !== trust_class ||
        !["user_declaration", "derived_interpretation", "imported_unverified"].includes(trust_class) ||
        !SELECTED_WORK_SOURCE_LABELS.includes(why_included as typeof SELECTED_WORK_SOURCE_LABELS[number]) ||
        currentness.status !== "unknown" || currentness.as_of !== observed_at) throw new Error("source");
    ids.add(entry_id);
    return {
      entry_id, source_ref, excerpt_text: text(entry.bounded_summary, 2_000),
      why_included, trust_class, observed_at,
      currentness: { status: "unknown" as const, as_of: observed_at, basis: text(currentness.basis, 256) },
      source_text_authority: "untrusted_work_material" as const,
    };
  });
}
function workList(value: unknown, limit: number, characters: number): string[] {
  if (!Array.isArray(value) || value.length > limit) throw new Error("work");
  return value.map((item) => text(item, characters));
}
function unavailable(status: string) {
  return { status, semantic_authority_granted: false, execution_authority_granted: false };
}

function invocationSignal(options: unknown): AbortSignal {
  const supplied = options === undefined ? undefined : object(options).signal;
  // A host that omits cancellation cannot cancel this invocation. Keep its
  // fallback separate from both other invocations and registration lifetime.
  if (supplied === undefined) return new AbortController().signal;
  // Use the native brand check, including genuine signals from another realm;
  // instanceof alone accepts prototype impostors and rejects cross-realm signals.
  Object.getOwnPropertyDescriptor(AbortSignal.prototype, "aborted")!.get!.call(supplied);
  return supplied as AbortSignal;
}

export function projectWebMcpCurrentWork(payload: unknown, displayedKey: string) {
  try {
    const response = object(payload);
    if (response.ok !== true || response.status !== "project_continuity" ||
        response.route_version !== "vnext_operator_project_continuity_route.v0.1" ||
        response.projection_is_read_only !== true || response.semantic_authority_granted !== false) throw new Error("route");
    const init = object(response.work_initialization);
    const scope = object(response.project);
    if (scope.workspace_id !== init.workspace_id || scope.project_id !== init.project_id) throw new Error("scope");
    if (["not_defined", "unavailable", "existing_history_without_current_packet"].includes(String(init.state)) &&
        init.current_packet === null && init.current_work === null) return unavailable("current_work_unavailable");
    if (init.active_project_id !== init.project_id) return unavailable("refresh_current_work_required");
    const binding = readBinding(init);
    if (JSON.stringify(binding) !== displayedKey) return unavailable("refresh_current_work_required");
    const work = object(init.current_work);
    const limits = INITIAL_PROJECT_WORK_LIMITS_V01;
    const current_work = {
      goal: text(work.goal, limits.goal_characters),
      success_criteria: workList(work.success_criteria, limits.success_criteria, limits.success_criterion_characters),
      non_goals: workList(work.non_goals, limits.non_goals, limits.non_goal_characters),
    };
    if (!current_work.success_criteria.length) throw new Error("criteria");
    return {
      status: "current_work_context", ...binding, current_work,
      selected_source_context: projectSources(init.selected_source_context),
      selected_source_scope: "current_packet_only_not_project_history",
      source_locator_scope: "not_projected",
      source_labels: "display_context_not_accepted_state",
      unresolved_scope: "not_projected",
      currentness: "fresh_authenticated_read_matching_displayed_binding_not_continuous",
      fingerprint_meaning: "content_binding_not_future_freshness_or_authenticity",
      semantic_authority_granted: false, execution_authority_granted: false,
    };
  } catch { return unavailable("current_work_response_invalid"); }
}

// Called once per React effect. Its returned disposer owns all registration
// lifetime, including an in-flight register promise and late read completion.
export function registerCurrentWorkWebMcp(
  modelContext: CurrentWorkModelContext | undefined,
  displayedKey: string | null,
  read: typeof fetch = fetch,
): () => void {
  if (!modelContext || typeof modelContext.registerTool !== "function" || !displayedKey) return () => {};
  const registration = new AbortController();
  const tool: CurrentWorkWebMcpTool = {
    name: NAME, title: "Read current Augnes work", description: DESCRIPTION,
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    async execute(input, options) {
      const result = (status: string) => JSON.stringify(unavailable(status));
      if (registration.signal.aborted) return result("refresh_current_work_required");
      if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).length) return result("invalid_arguments");
      let signal: AbortSignal;
      try { signal = invocationSignal(options); }
      catch { return result("current_work_read_refused"); }
      if (signal.aborted) return result("read_cancelled");
      try {
        const response = await read(ROUTE, {
          method: "GET", credentials: "same-origin", cache: "no-store", redirect: "error",
          headers: { Accept: "application/json" }, signal,
        });
        if (!response.ok) return result(response.status === 401 || response.status === 403 ? "authentication_required" : "current_work_read_refused");
        const body: unknown = await response.json();
        if (registration.signal.aborted) return result("refresh_current_work_required");
        if (signal.aborted) return result("read_cancelled");
        return JSON.stringify(projectWebMcpCurrentWork(body, displayedKey));
      } catch { return result(signal.aborted ? "read_cancelled" : "current_work_read_refused"); }
    },
  };
  try {
    void Promise.resolve(modelContext.registerTool(tool, { signal: registration.signal })).catch(() => registration.abort());
  } catch { registration.abort(); }
  return () => registration.abort();
}
