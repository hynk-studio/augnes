import { readSelectedWorkSources } from "@/lib/intake/selected-work-source-comparison";
import { canonicalizeProtocolValueV01 as canonical, createProtocolSha256V01 as hash, parseStrictIsoTimestampV01 } from "./protocol-primitives";
import type { TaskContextPacketSelectedEntryV01, TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

export const PROSPECTIVE_INPUT = "augnes.prospective-input.v0.1";
export const PROSPECTIVE_JUDGMENT = "augnes.prospective-judgment.v0.1";
export const SELECTED_SOURCE_INSPECTION = "selected_source_inspection.v0.1";
export const PROSPECTIVE_PREPARATION_PACKET = "prospective_preparation_packet.v0.1";
export type Availability = "not_yet_observed" | "observed" | "checked_absent" | "conflicting" | "channel_unavailable";
export type Observation = { key: string; availability: Availability; value: boolean | null; source_ref: string; observed_at: string; reason: string };
export type Inspection = { key: string; path: string; digest: string; contains: string };
export interface Agenda {
  profile: typeof PROSPECTIVE_INPUT; kind: "agenda"; decision: string; direction_ref: string;
  interpretation: string; support_refs: string[]; premise_until: string;
  event_window: { earliest: string; latest: string } | null;
  deadline: string | null; preparation_ms: { min: number; max: number } | null;
  not_before: string | null; recheck_at: string; event_key: string | null;
  inspections: Inspection[];
  costs: { preparation: string | null; waiting: string | null; execution: string | null; opportunity: string | null };
  exploratory: boolean;
}
export interface ConditionalMethod {
  profile: typeof PROSPECTIVE_INPUT; kind: "method"; id: string; action: string;
  context: Record<string, boolean>; premises: Record<string, boolean>; support_refs: string[];
  conflict_refs: string[];
}
type ObservationNote = { profile: typeof PROSPECTIVE_INPUT; kind: "observation"; key: string; availability: Availability; value: boolean | null };
export interface AgendaInput {
  agenda: Agenda; source_ref: string; methods: ConditionalMethod[]; observations: Observation[];
  source_refs: string[]; uncertainty: string[]; has_preparation_report: boolean;
}
export interface ProspectiveJudgment {
  version: typeof PROSPECTIVE_JUDGMENT; judgment_id: string; information_cutoff: string;
  agenda_ref: string; decision: string; interpretation: string; interpretation_status: "candidate";
  action: "prepare" | "defer" | "retain" | "withdraw"; next_action: string;
  methods: Array<{ id: string; status: "supported" | "other_context" | "missing" | "conflicting" | "withdrawn"; action: string }>;
  observations: Observation[]; prepare_at: string | null; next_recheck_at: string | null;
  event_occurred: boolean | null; deadline_missed: boolean; source_refs: string[];
  uncertainty: string[]; authority: "recommendation_only";
}

const text = (v: unknown, max = 400): v is string => typeof v === "string" && !!v.trim() && v.length <= max;
const sha = (v: unknown): v is string => typeof v === "string" && /^sha256:[a-f0-9]{64}$/u.test(v);
const time = (v: unknown): v is string => typeof v === "string" && parseStrictIsoTimestampV01(v) !== null;
const key = (v: unknown): v is string => typeof v === "string" && /^[a-z][a-z0-9_]{0,39}$/u.test(v);
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const exact = (v: Record<string, unknown>, fields: string[]) => Object.keys(v).sort().join() === fields.sort().join();
const refs = (v: unknown): v is string[] => Array.isArray(v) && v.length <= 4 && v.every(sha) && new Set(v).size === v.length;
const conditions = (v: unknown): v is Record<string, boolean> => object(v) && Object.keys(v).length <= 2 && Object.entries(v).every(([k, value]) => key(k) && typeof value === "boolean");
export function assertInspection(value: unknown): asserts value is Inspection {
  if (!object(value) || !exact(value, ["key", "path", "digest", "contains"]) || !key(value.key) || !sha(value.digest) || !text(value.contains, 128) ||
    !text(value.path, 160) || !/^[a-zA-Z0-9_-][a-zA-Z0-9_./-]*\.(?:md|txt|json|ts|tsx|js|mjs|py|rs|go|yaml|yml)$/u.test(value.path) ||
    value.path.includes("/") ||
    value.path.split("/").some(part => !part || part === "." || part === ".." || part.startsWith("."))) throw new Error("prospective_inspection_invalid");
}

/** Selected whole notes remain the input owner. No parser grants authority. */
export function readAgendaInput(entries: TaskContextPacketSelectedEntryV01[], at: string): AgendaInput | null {
  if (!time(at)) throw new Error("prospective_cutoff_invalid");
  const notes = entries.flatMap(entry => {
    let value: unknown; try { value = JSON.parse(entry.bounded_summary ?? ""); } catch { return []; }
    return object(value) && value.profile === PROSPECTIVE_INPUT ? [{ entry, value }] : [];
  });
  if (!notes.length) return null;
  const agendas = notes.filter(n => n.value.kind === "agenda");
  if (agendas.length !== 1) throw new Error("prospective_one_agenda_required");
  const { entry, value: a } = agendas[0]!;
  if (!exact(a, ["profile", "kind", "decision", "direction_ref", "interpretation", "support_refs", "premise_until", "event_window", "deadline", "preparation_ms", "not_before", "recheck_at", "event_key", "inspections", "costs", "exploratory"]) ||
    !text(a.decision) || !sha(a.direction_ref) || !text(a.interpretation) || !refs(a.support_refs) || !time(a.premise_until) || !time(a.recheck_at) ||
    !(a.deadline === null || time(a.deadline)) || !(a.not_before === null || time(a.not_before)) || !(a.event_key === null || key(a.event_key)) ||
    !(a.event_window === null || (object(a.event_window) && exact(a.event_window, ["earliest", "latest"]) && time(a.event_window.earliest) && time(a.event_window.latest) && Date.parse(a.event_window.earliest) <= Date.parse(a.event_window.latest))) ||
    !(a.preparation_ms === null || (object(a.preparation_ms) && exact(a.preparation_ms, ["min", "max"]) && Number.isSafeInteger(a.preparation_ms.min) && Number.isSafeInteger(a.preparation_ms.max) && Number(a.preparation_ms.min) >= 0 && Number(a.preparation_ms.max) >= Number(a.preparation_ms.min) && Number(a.preparation_ms.max) <= 86_400_000)) ||
    !Array.isArray(a.inspections) || a.inspections.length < 1 || a.inspections.length > 2 || typeof a.exploratory !== "boolean" ||
    !object(a.costs) || !exact(a.costs, ["preparation", "waiting", "execution", "opportunity"]) || !Object.values(a.costs).every(v => v === null || text(v, 120))) throw new Error("prospective_agenda_invalid");
  a.inspections.forEach(assertInspection);
  const agenda = a as unknown as Agenda;
  if (new Set(agenda.inspections.map(v => v.key)).size !== agenda.inspections.length) throw new Error("prospective_duplicate_inspection");
  const available = (ref: string) => entries.some(e => e.source_ref === ref && (!e.external_ref?.observed_at || Date.parse(e.external_ref.observed_at) <= Date.parse(at)));
  const direction = entries.find(e => e.source_ref === agenda.direction_ref);
  let projectedDirection = false;
  try {
    const value = JSON.parse(direction?.bounded_summary ?? "null");
    projectedDirection = value?.version === "project_direction_source.v0.1" && sha(value.revision_ref) && sha(value.authority_ref) && value.principal?.kind === "agent";
  } catch {}
  // Interpretation accepts an attributed agent projection. Execution separately
  // reconstructs its exact authority through the project-direction owner.
  if (!direction || (direction.trust_class !== "user_declaration" && !projectedDirection) || !available(agenda.direction_ref)) throw new Error("prospective_direction_required");
  if (entry.external_ref?.observed_at && Date.parse(entry.external_ref.observed_at) > Date.parse(at)) throw new Error("prospective_future_agenda");
  const methods: ConditionalMethod[] = [];
  const observations: Observation[] = [];
  let hasPreparationReport = false;
  const uncertainty = ["Selected interpretation is a candidate, not accepted fact, a causal model or execution permission.", "Cost descriptions are declarations; unknown costs remain unknown. No calibrated utility or probability is inferred."];
  for (const { value, entry: e } of notes.filter(n => n.value.kind !== "agenda")) {
    if (value.kind === "method") {
      if (e.external_ref?.observed_at && Date.parse(e.external_ref.observed_at) > Date.parse(at)) { uncertainty.push("A selected method is not yet available at this cutoff."); continue; }
      if (!exact(value, ["profile", "kind", "id", "action", "context", "premises", "support_refs", "conflict_refs"]) || !key(value.id) || !text(value.action) || !conditions(value.context) || !conditions(value.premises) || !refs(value.support_refs) || !refs(value.conflict_refs)) throw new Error("prospective_method_invalid");
      methods.push(value as unknown as ConditionalMethod);
    } else if (value.kind === "inspection_result") {
      if (!exact(value, ["profile", "kind", "agenda_ref", "receipt_id", "receipt_fingerprint", "observations"]) || !sha(value.agenda_ref) || !sha(value.receipt_fingerprint) || !text(value.receipt_id, 160) ||
        !Array.isArray(value.observations) || value.observations.length > 2 || !e.external_ref?.observed_at || Date.parse(e.external_ref.observed_at) > Date.parse(at)) throw new Error("prospective_result_note_invalid");
      if (value.agenda_ref === entry.source_ref) hasPreparationReport = true;
      for (const raw of value.observations) {
        if (!object(raw) || !exact(raw, ["key", "availability", "value", "source_ref", "observed_at", "reason"]) || !key(raw.key) || !sha(raw.source_ref) || !time(raw.observed_at) || !text(raw.reason, 160) ||
          !["observed", "checked_absent", "conflicting", "channel_unavailable"].includes(String(raw.availability)) ||
          (raw.availability === "observed" ? typeof raw.value !== "boolean" : raw.availability === "checked_absent" ? raw.value !== false : raw.value !== null)) throw new Error("prospective_result_observation_invalid");
        if (Date.parse(raw.observed_at) <= Date.parse(at)) observations.push({ ...(raw as unknown as Observation), source_ref: e.source_ref!, reason: `selected_result_report:${raw.reason}` });
      }
    } else if (value.kind === "observation") {
      if (!exact(value, ["profile", "kind", "key", "availability", "value"]) || !key(value.key) || !["not_yet_observed", "observed", "checked_absent", "conflicting", "channel_unavailable"].includes(String(value.availability)) ||
        (value.availability === "observed" ? typeof value.value !== "boolean" : value.availability === "checked_absent" ? value.value !== false : value.value !== null)) throw new Error("prospective_observation_invalid");
      const note = value as unknown as ObservationNote;
      // Recording a note later cannot make it available at an earlier cutoff.
      if (!e.external_ref?.observed_at || Date.parse(e.external_ref.observed_at) > Date.parse(at)) { uncertainty.push(`Observation ${note.key} has unknown or future time.`); continue; }
      observations.push({ key: note.key, availability: note.availability, value: note.value, source_ref: e.source_ref!, observed_at: e.external_ref.observed_at, reason: "selected_report_not_independently_verified" });
    } else throw new Error("prospective_input_kind_invalid");
  }
  if (methods.length > 2 || new Set(methods.map(m => m.id)).size !== methods.length) throw new Error("prospective_methods_bound");
  if (agenda.support_refs.some(ref => !available(ref))) uncertainty.push("Essential agenda support is missing at this cutoff.");
  return { agenda, source_ref: entry.source_ref!, methods, observations, has_preparation_report: hasPreparationReport, source_refs: entries.filter(e => !e.external_ref?.observed_at || Date.parse(e.external_ref.observed_at) <= Date.parse(at)).map(e => e.source_ref!).filter(Boolean), uncertainty };
}

/** Same assumptions drive historical explanation and prospective choice. Context
 * changes selection, never deletes conditional methods or contradictory support. */
export function judgeAgenda(input: AgendaInput, at: string, result: Observation[] = []): ProspectiveJudgment {
  if (!time(at)) throw new Error("prospective_cutoff_invalid");
  const { agenda } = input;
  const eligibleResult = result.filter(o => Date.parse(o.observed_at) <= Date.parse(at));
  const observations = [...input.observations, ...eligibleResult].filter(o => Date.parse(o.observed_at) <= Date.parse(at));
  const observation = (k: string, currentContext = false): Observation | undefined => {
    let rows = observations.filter(o => o.key === k);
    if (!rows.length) return undefined;
    // A dated context cue can change without rewriting earlier experience.
    // Same-time cue conflicts and all essential/result conflicts still stand.
    if (currentContext) {
      const latest = Math.max(...rows.map(o => Date.parse(o.observed_at)));
      rows = rows.filter(o => Date.parse(o.observed_at) === latest);
    }
    const known = rows.filter(o => o.availability === "observed" || o.availability === "checked_absent");
    if (rows.some(o => o.availability === "conflicting") || new Set(known.map(o => o.value)).size > 1) return { ...rows[0]!, availability: "conflicting", value: null };
    return known[0] ?? rows.find(o => o.availability === "channel_unavailable") ?? rows[0];
  };
  const methods: ProspectiveJudgment["methods"] = input.methods.map(m => {
    let status: ProspectiveJudgment["methods"][number]["status"] = "supported";
    if (m.conflict_refs.length) status = "conflicting";
    else if (m.support_refs.some(ref => !input.source_refs.includes(ref))) status = "missing";
    for (const [k, expected] of Object.entries(m.premises)) {
      const o = observation(k);
      if (o?.availability === "conflicting") status = "conflicting";
      else if (o?.value !== null && o?.value !== undefined && o.value !== expected) status = "withdrawn";
      else if (!o || o.value === null) { if (status === "supported") status = "missing"; }
    }
    // Conflicts and broken essential premises take precedence over a context cue.
    if (status === "supported") for (const [k, expected] of Object.entries(m.context)) {
      const o = observation(k, true);
      if (!o || o.value === null) status = o?.availability === "conflicting" ? "conflicting" : "missing";
      else if (o.value !== expected) status = "other_context";
    }
    return { id: m.id, status, action: m.action };
  });
  const target = agenda.deadline ?? agenda.event_window?.earliest ?? agenda.recheck_at;
  const prepareAt = agenda.preparation_ms ? new Date(Math.max(Date.parse(agenda.not_before ?? "1970-01-01T00:00:00.000Z"), Date.parse(target) - agenda.preparation_ms.max)).toISOString() : null;
  const expired = Date.parse(agenda.premise_until) <= Date.parse(at) || agenda.support_refs.some(ref => !input.source_refs.includes(ref));
  const neededKeys = new Set(input.methods.flatMap(m => [...Object.keys(m.context), ...Object.keys(m.premises)]));
  const needed = agenda.inspections.filter(i => agenda.exploratory || neededKeys.has(i.key));
  const deadlineMissed = !!agenda.deadline && Date.parse(agenda.deadline) < Date.parse(at);
  const unavailable = needed.some(i => observation(i.key)?.availability === "channel_unavailable");
  const unsettled = needed.some(i => !observation(i.key) || ["not_yet_observed", "conflicting"].includes(observation(i.key)!.availability));
  const supported = methods.filter(m => m.status === "supported");
  const incompatible = new Set(supported.map(m => m.action)).size > 1;
  const preparationReported = input.has_preparation_report || eligibleResult.length > 0;
  let action: ProspectiveJudgment["action"] = "defer";
  let next = "Wait for a meaningful observation; a due check does not establish event occurrence.";
  if (expired) { action = "withdraw"; next = "Withdraw the expired or unsupported agenda; preserve its original dates and history."; }
  else if (unavailable) next = "Observation channel unavailable. Select an allowed alternative or stop; do not keep polling this channel.";
  else if (incompatible || methods.some(m => m.status === "conflicting")) next = "Retain conflicting evidence and request a discriminating observation; do not average incompatible actions.";
  else if (supported.length && !unsettled) { action = "retain"; next = supported[0]!.action; }
  else if (methods.length && methods.every(m => m.status === "withdrawn")) { action = "withdraw"; next = "Essential premises failed; withdraw the affected methods without inventing a replacement."; }
  else if (deadlineMissed && !preparationReported) next = "The declared deadline was missed. Retain it and obtain a revised direction before new preparation.";
  else if (needed.length && unsettled && !preparationReported && prepareAt && Date.parse(prepareAt) <= Date.parse(at)) { action = "prepare"; next = "Inspect the bounded complementary bundle before selecting an action; no individual-observation utility cutoff applies."; }
  else if (!prepareAt) next = "Preparation duration is unknown. Bound it before scheduling work.";
  const event = agenda.event_key ? observation(agenda.event_key) : undefined;
  const material: Omit<ProspectiveJudgment, "judgment_id"> = { version: PROSPECTIVE_JUDGMENT, information_cutoff: at, agenda_ref: input.source_ref, decision: agenda.decision,
    interpretation: agenda.interpretation, interpretation_status: "candidate" as const, action, next_action: next, methods, observations,
    prepare_at: prepareAt, next_recheck_at: expired || unavailable || deadlineMissed && action === "defer" ? null : [preparationReported ? null : prepareAt, agenda.recheck_at, agenda.premise_until].filter((v): v is string => !!v && Date.parse(v) > Date.parse(at)).sort()[0] ?? null,
    event_occurred: event?.value ?? null, deadline_missed: deadlineMissed,
    source_refs: [...new Set([...input.source_refs, ...eligibleResult.map(o => o.source_ref)])].sort(), uncertainty: input.uncertainty, authority: "recommendation_only" as const };
  return { ...material, judgment_id: hash(canonical({ ...material, information_cutoff: null })) };
}

export function prospectiveGuidance(packet: TaskContextPacketV01, at: string): string | null {
  // Optional guidance must not replace the ordinary path when the packet has
  // no prospective input, including older/minimal projection packets.
  if (!packet.selected_context?.some(entry => {
    try { return JSON.parse(entry.bounded_summary ?? "null")?.profile === PROSPECTIVE_INPUT; } catch { return false; }
  })) return null;
  try {
    const input = readAgendaInput(readSelectedWorkSources(packet), at);
    return input ? `${judgeAgenda(input, at).next_action} Candidate interpretation of selected sources; Start/Resume authority is unchanged.` : null;
  } catch {
    // An optional candidate note cannot disable ordinary Start/Resume. The
    // explicit preparation queue still parses strictly and refuses this input.
    return "Selected prospective input could not be interpreted. Repair its source or omit it; ordinary Start/Resume authority and required checks are unchanged.";
  }
}
