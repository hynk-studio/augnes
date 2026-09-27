import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  parseStrictIsoTimestampV01,
  normalizeExternalRefPrimitiveV01,
} from "@/lib/vnext/protocol-primitives";
import type { TaskContextPacketSelectedEntryV01, TaskContextPacketV01 } from "@/types/vnext/task-context-packet";
import { REVIEWED_OUTCOME_SOURCE_V01, SELECTED_WORK_SOURCE_LABELS, type ReviewedOutcomeSourceRefV01, type SelectedWorkSourceInput, type RetainedWorkSourceRef } from "@/types/vnext/project-work-revision";

/** Bounded presentation over existing packet source entries; never a writer. */
export const SELECTED_WORK_SOURCE_NAMESPACE = "augnes.selected-source-excerpt.v0.1";
export const SELECTED_WORK_SOURCE_LIMITS = { entries: 8, characters: 2_000, bytes: 12_000 } as const;
type Scope = { workspace_id: string; project_id: string };

export class SelectedWorkSourceError extends Error {
  readonly status = 422;
  constructor(readonly code: string) { super(code); this.name = "SelectedWorkSourceError"; }
}

export function buildSelectedWorkSourceEntry(scope: Scope, value: unknown): TaskContextPacketSelectedEntryV01 {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail();
  const input = value as SelectedWorkSourceInput;
  if (
    Object.keys(input).sort().join(",") !== "label,observed_at,provenance,source,text" ||
    typeof input.source !== "string" || !input.source.trim() || input.source.length > 256 ||
    typeof input.text !== "string" || !input.text.trim() || [...input.text].length > SELECTED_WORK_SOURCE_LIMITS.characters ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(input.text + input.source) ||
    !SELECTED_WORK_SOURCE_LABELS.includes(input.label) ||
    !["user_declaration", "derived_interpretation", "imported_unverified"].includes(input.provenance) ||
    (input.observed_at !== null && (typeof input.observed_at !== "string" || parseStrictIsoTimestampV01(input.observed_at) === null))
  ) fail();
  const material = { ...input, source: input.source.trim(), text: input.text.trim(),
    observed_at: input.observed_at === null ? null : new Date(parseStrictIsoTimestampV01(input.observed_at)!).toISOString() };
  const fingerprint = createProtocolSha256V01(canonicalizeProtocolValueV01({
    workspace_id: scope.workspace_id, project_id: scope.project_id, ...material,
  }));
  const source = normalizeExternalRefPrimitiveV01({
    ref_version: "external_ref.v0.1" as const,
    ref_type: "selected_source_excerpt",
    external_id: `selected-source:${fingerprint.slice(7)}`,
    observed_at: material.observed_at,
    trust_class: material.provenance,
    source_ref: fingerprint,
    compatibility_namespace: SELECTED_WORK_SOURCE_NAMESPACE,
  });
  return {
    entry_id: `selected-source:${fingerprint.slice(7)}`,
    entry_kind: "source_ref",
    source_ref: fingerprint,
    external_ref: source,
    why_included: material.label,
    currentness: {
      status: "unknown",
      as_of: material.observed_at,
      basis: "User-selected excerpt only. Original source completeness, availability and currentness have not been verified.",
      source_ref: source,
    },
    trust_class: material.provenance,
    compatibility_source_ref: {
      ref_version: "external_ref.v0.1",
      ref_type: "selected_source_locator",
      external_id: material.source,
      compatibility_namespace: SELECTED_WORK_SOURCE_NAMESPACE,
      trust_class: "imported_unverified",
    },
    bounded_summary: material.text,
  };
}

export function selectedWorkSourceInput(entry: TaskContextPacketSelectedEntryV01): SelectedWorkSourceInput {
  return {
    source: entry.compatibility_source_ref?.external_id ?? "",
    observed_at: entry.external_ref?.observed_at ?? null,
    provenance: entry.trust_class as SelectedWorkSourceInput["provenance"],
    label: entry.why_included as SelectedWorkSourceInput["label"],
    text: entry.bounded_summary ?? "",
  };
}

export function reviewedOutcomeSourceRef(entry: TaskContextPacketSelectedEntryV01): ReviewedOutcomeSourceRefV01 | null {
  const ref = entry.compatibility_source_ref;
  return ref?.compatibility_namespace === REVIEWED_OUTCOME_SOURCE_V01
    ? { record_id: ref.external_id, fingerprint: ref.source_ref! } : null;
}

/** Shape/content identity only. The result writer validates the saved records;
 * revision writers may only retain exact entries from their validated family. */
export function buildReviewedOutcomeSourceEntry(scope: Scope, input: SelectedWorkSourceInput,
  binding: ReviewedOutcomeSourceRefV01, part: "expectation" | "report"): TaskContextPacketSelectedEntryV01 {
  if (!binding || Object.keys(binding).sort().join(",") !== "fingerprint,record_id" ||
    !/^work-expectation:[a-f0-9]{24}$/u.test(binding.record_id) || !/^sha256:[a-f0-9]{64}$/u.test(binding.fingerprint) ||
    input.source !== binding.record_id || !["expectation", "report"].includes(part)) fail();
  const entry = buildSelectedWorkSourceEntry(scope, input);
  entry.compatibility_source_ref = { ref_version: "external_ref.v0.1", ref_type: `reviewed_outcome_${part}`,
    external_id: binding.record_id, source_ref: binding.fingerprint, observed_at: input.observed_at,
    trust_class: "imported_unverified", compatibility_namespace: REVIEWED_OUTCOME_SOURCE_V01 };
  return entry;
}

export function assertReviewedOutcomeSourcesRetained(selected: TaskContextPacketSelectedEntryV01[], allowed: TaskContextPacketSelectedEntryV01[]) {
  for (const entry of selected.filter(e => reviewedOutcomeSourceRef(e))) {
    if (!allowed.some(prior => canonicalizeProtocolValueV01(prior) === canonicalizeProtocolValueV01(entry))) fail();
  }
}

export function readSelectedWorkSources(packet: TaskContextPacketV01): TaskContextPacketSelectedEntryV01[] {
  return normalizeSelectedWorkSources(packet, packet.selected_context.filter((entry) =>
    entry.external_ref?.compatibility_namespace === SELECTED_WORK_SOURCE_NAMESPACE || entry.entry_id.startsWith("selected-source:"),
  ));
}

export function normalizeSelectedWorkSources(scope: Scope, value: unknown): TaskContextPacketSelectedEntryV01[] {
  if (!Array.isArray(value) || value.length > SELECTED_WORK_SOURCE_LIMITS.entries) {
    throw new SelectedWorkSourceError("task_context_mandatory_selection_budget_exceeded");
  }
  const unique = new Map<string, TaskContextPacketSelectedEntryV01>();
  for (const entry of value) {
    if (!entry || typeof entry !== "object") fail();
    const binding = reviewedOutcomeSourceRef(entry);
    const part = entry.compatibility_source_ref?.ref_type;
    const rebuilt = binding ? buildReviewedOutcomeSourceEntry(scope, selectedWorkSourceInput(entry), binding,
      (typeof part === "string" ? part.replace("reviewed_outcome_", "") : "") as "expectation" | "report")
      : buildSelectedWorkSourceEntry(scope, selectedWorkSourceInput(entry));
    if (canonicalizeProtocolValueV01(rebuilt) !== canonicalizeProtocolValueV01(entry)) fail();
    unique.set(rebuilt.entry_id, rebuilt);
  }
  // Input position is not evidence of chronology. Known source times retain
  // their order; ties and unknown times use a stable, content-bound identity.
  const entries = [...unique.values()].sort((a, b) => {
    const left = a.external_ref?.observed_at ?? "~";
    const right = b.external_ref?.observed_at ?? "~";
    if (left !== right) return left < right ? -1 : 1;
    return a.entry_id < b.entry_id ? -1 : a.entry_id > b.entry_id ? 1 : 0;
  });
  for (const id of new Set(entries.flatMap(e => reviewedOutcomeSourceRef(e)?.record_id ?? []))) {
    const group = entries.filter(e => reviewedOutcomeSourceRef(e)?.record_id === id);
    if (group.length !== 2 || new Set(group.map(e => reviewedOutcomeSourceRef(e)!.fingerprint)).size !== 1 ||
      group.map(e => e.compatibility_source_ref!.ref_type).sort().join(",") !== "reviewed_outcome_expectation,reviewed_outcome_report") fail();
  }
  if (Buffer.byteLength(canonicalizeProtocolValueV01(entries), "utf8") > SELECTED_WORK_SOURCE_LIMITS.bytes) {
    throw new SelectedWorkSourceError("selected_source_context_budget_exceeded");
  }
  return entries;
}

export function normalizeRetainedWorkSourceRefs(value: unknown): RetainedWorkSourceRef[] {
  if (!Array.isArray(value) || value.length > SELECTED_WORK_SOURCE_LIMITS.entries) fail();
  const refs = new Map<string, RetainedWorkSourceRef>();
  for (const ref of value) {
    if (!ref || typeof ref !== "object" || Array.isArray(ref) ||
      Object.keys(ref).sort().join(",") !== "entry_id,packet_fingerprint,packet_id,source_fingerprint" ||
      typeof ref.packet_id !== "string" || !ref.packet_id || ref.packet_id.length > 256 ||
      typeof ref.entry_id !== "string" || !/^selected-source:[a-f0-9]{64}$/u.test(ref.entry_id) ||
      typeof ref.packet_fingerprint !== "string" || !/^sha256:[a-f0-9]{64}$/u.test(ref.packet_fingerprint) ||
      typeof ref.source_fingerprint !== "string" || !/^sha256:[a-f0-9]{64}$/u.test(ref.source_fingerprint)) fail();
    refs.set(canonicalizeProtocolValueV01(ref), { ...ref });
  }
  return [...refs.entries()].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([, ref]) => ref);
}

export function compareSelectedWorkSources(packet: TaskContextPacketV01, selected: unknown, retainedRefs: unknown = []) {
  const entries = normalizeSelectedWorkSources(packet, selected);
  const retained_source_refs = normalizeRetainedWorkSourceRefs(retainedRefs);
  const previous = readSelectedWorkSources(packet);
  const currentTexts = [packet.task.goal, ...packet.task.success_criteria, ...packet.task.non_goals];
  const rows = entries.map((entry) => ({
    entry,
    comparison: previous.some((prior) => prior.entry_id === entry.entry_id)
      ? "reconfirmed_selected_material" as const
      : currentTexts.includes(entry.bounded_summary!)
        ? "reconfirmed_work_text" as const
        : previous.some((prior) => prior.compatibility_source_ref?.external_id === entry.compatibility_source_ref?.external_id)
          ? "changed_source_material_review_needed" as const
          : "new_source_material_review_needed" as const,
    user_correction: entry.trust_class === "user_declaration" && entry.why_included === SELECTED_WORK_SOURCE_LABELS[0],
  }));
  return {
    current_packet_id: packet.packet_id,
    current_packet_fingerprint: packet.integrity.fingerprint,
    fingerprint: createProtocolSha256V01(canonicalizeProtocolValueV01({
      workspace_id: packet.workspace_id, project_id: packet.project_id,
      packet_id: packet.packet_id, packet_fingerprint: packet.integrity.fingerprint, entries,
      ...(retained_source_refs.length ? { retained_source_refs } : {}),
    })),
    retained_source_refs,
    rows,
    unselected_previous: previous.filter((entry) => !entries.some((next) => next.entry_id === entry.entry_id)),
    entries,
    writes: 0 as const,
    decisions_created: 0 as const,
    notes: [
      "Labels describe selected material, not accepted state. Uncertain equivalence remains review needed.",
      "A user's correction takes precedence over a model summary as a source of what the user said; neither applies a semantic change.",
      "Unselected material is not rejected, refuted or deleted. Only the selected entries will be included in this work revision.",
    ],
  };
}

function fail(): never { throw new SelectedWorkSourceError("selected_source_context_invalid"); }
