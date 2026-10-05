/** A bounded imported snapshot, not a Core record, restore image or authority. */
import { canonicalizeProtocolValueV01 as canonical, createProtocolSha256V01 as hash, parseStrictIsoTimestampV01 } from "./protocol-primitives";
import { buildSelectedWorkSourceEntry, readSelectedWorkSources, selectedWorkSourceInput } from "@/lib/intake/selected-work-source-comparison";
import { normalizeInitialProjectWorkDefinitionV01 } from "@/lib/intake/work-definition";
import type { ProjectWorkDefinitionV01 } from "@/types/vnext/project-work-initialization";
import type { TaskContextPacketV01, TaskContextPacketSelectedEntryV01 } from "@/types/vnext/task-context-packet";
import type { ReviewObservation } from "./stateless-work";

export const WORK_HANDOFF = "source_bound_work_handoff.v0.1";
export const WORK_HANDOFF_ENTRY = "imported-work-handoff";
export const WORK_HANDOFF_MAX_BYTES = 24_576;
export const handoffHash = (v: unknown) => hash(canonical(v));
export function handoffCheck(v: unknown, code: string): asserts v { if (!v) throw new Error(`work_handoff_${code}`); }
const exact = (v: unknown, keys: string[]) => { handoffCheck(v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).sort().join() === keys.sort().join(), "shape_invalid"); return v as Record<string, unknown>; };
const text = (v: unknown, max = 256): string => { handoffCheck(typeof v === "string" && v.length > 0 && Buffer.byteLength(v) <= max && !v.includes("\0"), "text_invalid"); return v; };
const sha = (v: unknown) => { handoffCheck(/^sha256:[a-f0-9]{64}$/.test(text(v)), "digest_invalid"); return v as string; };
const time = (v: unknown) => { handoffCheck(parseStrictIsoTimestampV01(text(v)) !== null, "time_invalid"); };
export interface WorkHandoff {
  version: typeof WORK_HANDOFF;
  source: { workspace_id: string; project_id: string; work_id: string; packet_id: string; packet_fingerprint: string; generated_at: string; expires_at: string | null; exported_at: string; root_fingerprint: string };
  task: ProjectWorkDefinitionV01;
  selected_notes: TaskContextPacketSelectedEntryV01[];
  obligations: Array<{ entry_id: string; source_ref: string; bounded_summary: string }>;
  omissions: Array<{ entry_id: string; reason: string }>;
  evidence: { workspace_id: string; project_id: string; packet_id: string; packet_fingerprint: string; run_id: string; receipt_id: string; receipt_fingerprint: string; verification: string; generation: string; grant_id: string; grant_fingerprint: string; observation: ReviewObservation; observation_fingerprint: string };
  fingerprint: string;
}

/** Integrity and source-scope consistency only. No signature/authenticity claim. */
export function parseWorkHandoff(value: unknown): WorkHandoff {
  handoffCheck(Buffer.byteLength(canonical(value)) <= WORK_HANDOFF_MAX_BYTES, "size_limit");
  const v = exact(value, ["version", "source", "task", "selected_notes", "obligations", "omissions", "evidence", "fingerprint"]);
  handoffCheck(v.version === WORK_HANDOFF, "version_invalid");
  const { fingerprint, ...material } = v; handoffCheck(sha(fingerprint) === handoffHash(material), "fingerprint_changed");
  const s = exact(v.source, ["workspace_id", "project_id", "work_id", "packet_id", "packet_fingerprint", "generated_at", "expires_at", "exported_at", "root_fingerprint"]);
  for (const key of ["workspace_id", "project_id", "work_id", "packet_id"]) text(s[key]);
  sha(s.packet_fingerprint); sha(s.root_fingerprint); time(s.generated_at); time(s.exported_at); if (s.expires_at !== null) time(s.expires_at);
  handoffCheck(canonical(normalizeInitialProjectWorkDefinitionV01(v.task as ProjectWorkDefinitionV01)) === canonical(v.task), "task_invalid");
  handoffCheck(Array.isArray(v.selected_notes) && v.selected_notes.length <= 8, "notes_invalid");
  for (const entry of v.selected_notes) handoffCheck(canonical(buildSelectedWorkSourceEntry(s as WorkHandoff["source"], selectedWorkSourceInput(entry))) === canonical(entry), "note_lineage_invalid");
  handoffCheck(new Set(v.selected_notes.map(e => e.entry_id)).size === v.selected_notes.length, "notes_duplicate");
  handoffCheck(Array.isArray(v.obligations) && v.obligations.length <= 2, "obligations_invalid");
  for (const entry of v.obligations) {
    const e = exact(entry, ["entry_id", "source_ref", "bounded_summary"]);
    handoffCheck(["stateless-review-unresolved-predecessors", "stateless-review-returned-predecessors"].includes(text(e.entry_id)), "obligation_kind_invalid"); sha(e.source_ref); text(e.bounded_summary, 12_000);
    obligationProjection(entry);
  }
  handoffCheck(new Set(v.obligations.map(e => e.entry_id)).size === v.obligations.length, "obligations_duplicate");
  handoffCheck(Array.isArray(v.omissions) && v.omissions.length <= 32, "omissions_invalid");
  for (const entry of v.omissions) { const e = exact(entry, ["entry_id", "reason"]); text(e.entry_id); text(e.reason, 2000); }
  const e = exact(v.evidence, ["workspace_id", "project_id", "packet_id", "packet_fingerprint", "run_id", "receipt_id", "receipt_fingerprint", "verification", "generation", "grant_id", "grant_fingerprint", "observation", "observation_fingerprint"]);
  handoffCheck(e.workspace_id === s.workspace_id && e.project_id === s.project_id, "foreign_evidence");
  for (const key of ["packet_id", "run_id", "receipt_id", "generation", "grant_id", "verification"]) text(e[key]);
  for (const key of ["packet_fingerprint", "receipt_fingerprint", "grant_fingerprint", "observation_fingerprint"]) sha(e[key]);
  const o = exact(e.observation, ["availability", "observed_at", "bytes_read", "reason", "sources"]); time(o.observed_at); text(o.reason);
  handoffCheck(o.availability === "observed" && Number.isSafeInteger(o.bytes_read) && Number(o.bytes_read) >= 0 && Number(o.bytes_read) <= 65_536 && Array.isArray(o.sources) && o.sources.length > 0 && o.sources.length <= 2, "material_unavailable");
  let bytes = 0;
  for (const item of o.sources) {
    const f = exact(item, ["path", "start_line", "end_line", "digest", "text", "excerpt_digest"]);
    handoffCheck(/^(?:[A-Za-z0-9_-][A-Za-z0-9_.-]*\/){0,7}[A-Za-z0-9_-][A-Za-z0-9_.-]*\.(?:md|txt|ts|tsx|js|mjs|py|json)$/.test(text(f.path, 220)), "path_invalid");
    handoffCheck(Number.isSafeInteger(f.start_line) && Number.isSafeInteger(f.end_line) && Number(f.start_line) >= 1 && Number(f.end_line) >= Number(f.start_line) && Number(f.end_line) <= 20_000, "range_invalid");
    sha(f.digest); handoffCheck(typeof f.text === "string" && !f.text.includes("\0") && sha(f.excerpt_digest) === hash(f.text), "material_changed"); bytes += Buffer.byteLength(f.text);
  }
  handoffCheck(bytes <= 4096 && new Set(o.sources.map(f => f.path)).size === o.sources.length && sha(e.observation_fingerprint) === handoffHash(o), "observation_changed");
  return value as WorkHandoff;
}

function obligationProjection(entry: WorkHandoff["obligations"][number]) {
  const data = exact(JSON.parse(entry.bounded_summary), ["warning", "predecessors"]); text(data.warning, 1000);
  handoffCheck(Array.isArray(data.predecessors) && data.predecessors.length > 0 && data.predecessors.length <= 8 && handoffHash(data.predecessors) === entry.source_ref, "obligation_binding_invalid");
  const predecessors = data.predecessors.map(value => {
    if (entry.entry_id === "stateless-review-unresolved-predecessors") {
      const p = exact(value, ["run_id", "disposition_fingerprint"]); return { run_id: text(p.run_id, 160), disposition_fingerprint: sha(p.disposition_fingerprint) };
    }
    const p = exact(value, ["binding", "evidence"]), b = exact(p.binding, ["run_id", "revision", "step_id", "generation", "packet_id", "packet_fingerprint", "grant_id", "grant_fingerprint", "receipt_fingerprint", "history_fingerprint"]);
    for (const key of ["run_id", "step_id", "generation", "packet_id", "grant_id"]) text(b[key], 160);
    for (const key of ["packet_fingerprint", "grant_fingerprint", "receipt_fingerprint", "history_fingerprint"]) sha(b[key]);
    handoffCheck(Number.isSafeInteger(b.revision) && Number(b.revision) > 0, "obligation_revision_invalid");
    const availability = exact(p.evidence, ["public_result", "layer", "code"]); for (const key of ["public_result", "layer", "code"]) text(availability[key], 160);
    return { run_id: b.run_id, history_fingerprint: b.history_fingerprint, evidence_availability: availability };
  });
  handoffCheck(new Set(predecessors.map(p => p.run_id)).size === predecessors.length, "obligation_duplicate");
  return { kind: entry.entry_id, binding: entry.source_ref, predecessors };
}

export function readWorkHandoff(packet: TaskContextPacketV01): WorkHandoff | null {
  const entries = packet.selected_context.filter(e => e.entry_id === WORK_HANDOFF_ENTRY);
  if (!entries.length) return null;
  handoffCheck(entries.length === 1 && typeof entries[0]!.bounded_summary === "string", "saved_material_missing");
  const handoff = parseWorkHandoff(JSON.parse(entries[0]!.bounded_summary!));
  handoffCheck(entries[0]!.source_ref === handoff.fingerprint, "saved_binding_changed"); return handoff;
}
export const handoffEntries = (p: TaskContextPacketV01) => p.selected_context.filter(e => e.entry_id === WORK_HANDOFF_ENTRY);
export function receivedHandoffEntries(scope: { workspace_id: string; project_id: string }, value: WorkHandoff, at: string) {
  const h = parseWorkHandoff(value);
  const ref = { ref_version: "external_ref.v0.1" as const, ref_type: "imported_work_snapshot", external_id: h.source.packet_id, source_ref: h.fingerprint, trust_class: "imported_unverified" as const, observed_at: h.source.exported_at, compatibility_namespace: WORK_HANDOFF };
  const entry: TaskContextPacketSelectedEntryV01 = { entry_id: WORK_HANDOFF_ENTRY, entry_kind: "evidence_ref", source_ref: h.fingerprint, external_ref: ref,
    compatibility_source_ref: null, bounded_summary: canonical(h), trust_class: "imported_unverified",
    currentness: { status: "unknown", as_of: at, basis: "Transferred historical bytes; source authenticity and current local material are not established.", source_ref: ref },
    why_included: "Mandatory imported provenance and obligations. Historical effects, missing evidence and reconsideration reasons remain unresolved; no execution, semantic acceptance or recovery authority transfers." };
  // Explicitly imported notes retain exact text and locator; their original
  // identity/provenance remains in the immutable snapshot, not a local claim.
  const notes = h.selected_notes.map(e => buildSelectedWorkSourceEntry(scope, { ...selectedWorkSourceInput(e), source: importedNoteLocator(h, e), provenance: "imported_unverified" }));
  return [entry, ...notes];
}
export function handoffModelContext(packet: TaskContextPacketV01) {
  const h = readWorkHandoff(packet); if (!h) return null;
  return { fingerprint: h.fingerprint, source_project: h.source.project_id, source_packet: h.source.packet_id,
    receipt: h.evidence.receipt_id, observation: h.evidence.observation_fingerprint,
    obligations: h.obligations.map(obligationProjection),
    boundary: "Imported historical evidence only. Unknown predecessor effects and missing returned-result evidence remain unresolved where listed. No historical execution authority transfers. Selected notes are optional attributed interpretations; locally inspected current material is separate." };
}
export function handoffSelectedNotes(packet: TaskContextPacketV01) {
  return readSelectedWorkSources(packet).filter(e => { try { return JSON.parse(e.bounded_summary!).profile !== "stateless_source_review.v0.1"; } catch { return true; } });
}

const importedNoteLocator = (h: WorkHandoff, e: TaskContextPacketSelectedEntryV01) => `Handoff ${h.fingerprint} source ${e.entry_id}`;
export function handoffNoteAttribution(packet: TaskContextPacketV01, entry: TaskContextPacketSelectedEntryV01) {
  const h = readWorkHandoff(packet); if (!h) return null;
  const source = selectedWorkSourceInput(entry).source, original = h.selected_notes.find(e => importedNoteLocator(h, e) === source);
  if (!original) return null;
  const imported = buildSelectedWorkSourceEntry(packet, { ...selectedWorkSourceInput(original), source, provenance: "imported_unverified" });
  // Local edits keep their own attribution; a retained locator is not identity.
  if (canonical(imported) !== canonical(entry)) return null;
  return { handoff_fingerprint: h.fingerprint, source_entry_id: original.entry_id, source_ref: original.source_ref,
    original_source: selectedWorkSourceInput(original).source, original_provenance: original.trust_class };
}
