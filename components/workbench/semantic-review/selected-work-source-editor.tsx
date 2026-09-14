"use client";

import { useRef, useState } from "react";
import { SELECTED_WORK_SOURCE_LABELS, type SelectedWorkSourceInput, type SelectedWorkSourceSelection, type RetainedWorkSourceRef } from "@/types/vnext/project-work-revision";
import type { ProjectWorkInitializationV01 } from "@/types/vnext/project-work-initialization";
import type { compareSelectedWorkSources } from "@/lib/intake/selected-work-source-comparison";
import styles from "./semantic-review.module.css";
import { RetainedWorkSourceLookup } from "./retained-work-source-lookup";

type Comparison = ReturnType<typeof compareSelectedWorkSources>;
const emptyNote = (): SelectedWorkSourceInput => ({ source: "", text: "", observed_at: null, provenance: "imported_unverified", label: "Unclassified / needs review" });
type EditorNote = SelectedWorkSourceInput & { retainedSource?: RetainedWorkSourceRef };

export function SelectedWorkSourceEditor({ initialization, busy, onChange }: {
  initialization: ProjectWorkInitializationV01;
  busy: boolean;
  onChange: (selection: SelectedWorkSourceSelection | null, pending: boolean) => void;
}) {
  const [notes, setNotes] = useState<EditorNote[]>(() => (initialization.selected_source_context ?? []).map((entry) => ({
    source: entry.compatibility_source_ref!.external_id, observed_at: entry.external_ref!.observed_at ?? null,
    provenance: entry.trust_class as SelectedWorkSourceInput["provenance"],
    label: entry.why_included as SelectedWorkSourceInput["label"], text: entry.bounded_summary!,
  })));
  const [draft, setDraft] = useState(emptyNote);
  const [draftTime, setDraftTime] = useState("");
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const revision = useRef(0);

  function changeNotes(next: EditorNote[]) {
    revision.current += 1;
    setNotes(next);
    setComparison(null);
    setError(null);
    onChange(null, true);
  }

  async function compare() {
    const packet = initialization.current_packet;
    if (!packet) return;
    const submittedRevision = revision.current;
    setComparing(true);
    setError(null);
    try {
      const response = await fetch("/api/vnext/operator/project-continuity", {
        method: "POST", cache: "no-store", credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "compare_selected_work_sources",
          expected_current_packet_id: packet.packet_id,
          expected_current_packet_fingerprint: packet.packet_fingerprint,
          expected_active_project_id: initialization.active_project_id,
          expected_active_selection_revision: initialization.active_selection_revision,
          notes: notes.filter((note) => !note.retainedSource),
          retained_source_refs: notes.flatMap((note) => note.retainedSource ? [note.retainedSource] : []) }),
      });
      const body = await response.json() as { status?: string; comparison?: Comparison };
      if (submittedRevision !== revision.current) return;
      if (!response.ok || body.status !== "selected_source_comparison" || !body.comparison) {
        throw new Error("Comparison could not be completed. Check the note size and reload if current work has changed.");
      }
      setComparison(body.comparison);
      onChange({ selected_source_context: body.comparison.entries, expected_source_comparison: body.comparison.fingerprint,
        ...(body.comparison.retained_source_refs.length ? { retained_source_refs: body.comparison.retained_source_refs } : {}) }, false);
    } catch (failure) {
      if (submittedRevision === revision.current) setError(failure instanceof Error ? failure.message : "Comparison unavailable.");
    } finally { setComparing(false); }
  }

  return <details className={styles.panel} data-selected-work-sources>
    <summary>Selected source notes for this work</summary>
    <p className={styles.copy}>Keep a selected conversation excerpt, result or history note with its source and conditions. Comparing saves nothing. Save revision includes these notes as context for preparing the next work. You can save notes without changing the work definition or setting up execution.</p>
    <p className={styles.muted}>Up to eight notes; 2,000 characters per note. Notes and source details must fit the combined context budget. Oversized selections are refused, never silently clipped. Include the source revision and meaningful chronology. Original source availability is not verified.</p>
    <RetainedWorkSourceLookup initialization={initialization} disabled={busy || comparing} selectionFull={notes.length >= 8}
      isSelected={(hit) => notes.some((note) => note.source === hit.entry.compatibility_source_ref!.external_id &&
        note.text === hit.entry.bounded_summary && note.observed_at === (hit.entry.external_ref?.observed_at ?? null) &&
        note.provenance === hit.entry.trust_class && note.label === hit.entry.why_included)}
      onSelect={(hit) => changeNotes([...notes, {
        source: hit.entry.compatibility_source_ref!.external_id, text: hit.entry.bounded_summary!,
        observed_at: hit.entry.external_ref?.observed_at ?? null, provenance: hit.entry.trust_class as SelectedWorkSourceInput["provenance"],
        label: hit.entry.why_included as SelectedWorkSourceInput["label"], retainedSource: hit.source,
      }])} />
    <label htmlFor="selected-note-source">Source and revision</label>
    <input id="selected-note-source" value={draft.source} maxLength={256} onChange={(event) => setDraft({ ...draft, source: event.target.value })} placeholder="Review note, revision 2 — selected paragraphs" />
    <label htmlFor="selected-note-time">Source time, if known</label>
    <input id="selected-note-time" type="datetime-local" value={draftTime} onChange={(event) => {
      setDraftTime(event.target.value);
      setDraft({ ...draft, observed_at: event.target.value ? new Date(event.target.value).toISOString() : null });
    }} />
    <label htmlFor="selected-note-provenance">Whose material is this?</label>
    <select id="selected-note-provenance" value={draft.provenance} onChange={(event) => setDraft({ ...draft, provenance: event.target.value as SelectedWorkSourceInput["provenance"] })}>
      <option value="imported_unverified">Source report / unverified observation</option>
      <option value="user_declaration">User declaration or correction</option>
      <option value="derived_interpretation">Model summary or inference</option>
    </select>
    <label htmlFor="selected-note-kind">How should this material be reviewed?</label>
    <select id="selected-note-kind" value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value as SelectedWorkSourceInput["label"] })}>
      {SELECTED_WORK_SOURCE_LABELS.map((label) => <option key={label}>{label}</option>)}
    </select>
    <label htmlFor="selected-note-text">Selected material</label>
    <textarea id="selected-note-text" value={draft.text} onChange={(event) => setDraft({ ...draft, text: event.target.value })} />
    <p className={styles.muted}>Preserve corrections, rejection conditions, exceptions, deferred items, unanswered questions and next checks in full. Selecting a note does not accept its claims.</p>
    <button type="button" data-selected-source-action="add" className={styles.secondaryButton} disabled={busy || comparing || notes.length >= 8 || !draft.source.trim() || !draft.text.trim() || [...draft.text].length > 2_000}
      onClick={() => { changeNotes([...notes, draft]); setDraft(emptyNote()); setDraftTime(""); }}>Add selected note</button>
    {notes.map((note, index) => <div key={index} className={styles.panel}>
      <strong>{note.label}</strong><p>{note.source} · {note.provenance.replaceAll("_", " ")}{note.observed_at ? ` · ${note.observed_at}` : ""}</p>
      <p style={{ whiteSpace: "pre-wrap" }}>{note.text}</p>
      {note.retainedSource ? <p className={styles.muted}>Reselected from an exact saved snapshot; source binding will be rechecked before saving.</p> : null}
      <button type="button" data-selected-source-action="exclude" className={styles.secondaryButton} disabled={busy || comparing}
        onClick={() => changeNotes(notes.filter((_, position) => position !== index))}>Exclude from this revision</button>
    </div>)}
    <button type="button" data-selected-source-action="compare" className={styles.secondaryButton} disabled={busy || comparing} onClick={() => void compare()}>
      {comparing ? "Comparing…" : "Compare with current work"}
    </button>
    {error ? <p role="alert" className={styles.error}>{error}</p> : null}
    {comparison ? <div role="status">
      {comparison.rows.map((row) => <p key={row.entry.entry_id}>
        {row.entry.compatibility_source_ref!.external_id}: {row.comparison.replaceAll("_", " ")}. {row.entry.why_included}.
        {row.user_correction ? " User correction takes precedence over a model summary of what the user said." : ""}
      </p>)}
      <p>{comparison.entries.length} selected; {comparison.unselected_previous.length} previous notes excluded from this revision. Exclusion is not rejection, refutation or deletion.</p>
      <p>Review labels and source statements remain separate from accepted state. Conditions and original wording will be preserved.</p>
    </div> : null}
  </details>;
}
