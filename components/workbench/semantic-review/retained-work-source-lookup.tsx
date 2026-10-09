"use client";

import { useProjectClientFetch } from "./project-client-scope";

import { useRef, useState } from "react";
import type { recallRetainedWorkSources, RetainedWorkSourceHit } from "@/lib/intake/retained-work-source-recall";
import type { ProjectWorkInitializationV01 } from "@/types/vnext/project-work-initialization";
import { REVIEWED_OUTCOME_SOURCE_V01 } from "@/types/vnext/project-work-revision";
import styles from "./semantic-review.module.css";

type Recall = ReturnType<typeof recallRetainedWorkSources>;

export function RetainedWorkSourceLookup({ initialization, disabled, remainingSlots, isSelected, onSelect, onAccessRefused, onRefreshCurrentWork }: {
  initialization: ProjectWorkInitializationV01;
  disabled: boolean;
  remainingSlots: number;
  isSelected: (hit: RetainedWorkSourceHit) => boolean;
  onSelect: (hits: RetainedWorkSourceHit[]) => void;
  onAccessRefused?: (errorCode?: string) => void;
  onRefreshCurrentWork?: () => Promise<void>;
}) {
  const fetch = useProjectClientFetch();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Recall | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const groups = new Map<string, RetainedWorkSourceHit[]>();
  for (const hit of result?.results ?? []) {
    const ref = hit.entry.compatibility_source_ref!;
    const key = ref.compatibility_namespace === REVIEWED_OUTCOME_SOURCE_V01
      ? JSON.stringify([ref.external_id, ref.source_ref]) : hit.entry.entry_id;
    groups.set(key, [...(groups.get(key) ?? []), hit]);
  }

  async function search() {
    const packet = initialization.current_packet;
    if (!packet) return;
    const id = ++requestId.current;
    setSearching(true); setResult(null); setError(null);
    try {
      const response = await fetch("/api/vnext/operator/project-continuity", {
        method: "POST", cache: "no-store", credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "lookup_retained_work_sources", query,
          expected_current_packet_id: packet.packet_id, expected_current_packet_fingerprint: packet.packet_fingerprint,
          expected_active_project_id: initialization.project_id,
          expected_project_work_binding: initialization.project_work_binding,
          expected_active_selection_revision: initialization.active_selection_revision }),
      });
      const body = await response.json() as { status?: string; recall?: Recall; error_code?: string };
      if (response.status === 401 || response.status === 403) onAccessRefused?.(body.error_code);
      if (response.status === 409) await onRefreshCurrentWork?.();
      if (id !== requestId.current) return;
      if (body.error_code === "retained_source_scan_bound_exceeded") throw new Error("Retained-note lookup reached its scan capacity. No partial results were returned. Current selected notes remain available; changing the query or reloading will not reduce this history.");
      if (!response.ok || body.status !== "retained_source_recall" || !body.recall) throw new Error("Retained notes are unavailable for this comparison. Your selected notes are retained. Check the query bounds or review current work before searching again.");
      setResult(body.recall);
    } catch (failure) {
      if (id === requestId.current) setError(failure instanceof Error ? failure.message : "Retained notes unavailable.");
    } finally { setSearching(false); }
  }

  return <details className={styles.retainedSources} data-retained-work-sources>
    <summary>Find notes from earlier work revisions</summary>
    <p className={styles.copy}>Search saved note snapshots in this unstarted work’s revision history, including notes excluded from current preparation. Searching selects and saves nothing.</p>
    <label htmlFor="retained-source-query">Words from the question, note or source</label>
    <input id="retained-source-query" value={query} maxLength={160} placeholder="valve bench cold start" onChange={(event) => {
      requestId.current += 1; setQuery(event.target.value); setResult(null); setError(null);
    }} />
    <p className={styles.muted}>All words must occur in a note or source label; case is ignored. A saved outcome match also shows its original forecast context and report together for explicit selection. Up to 160 characters and eight words. Other projects, transcripts and external sources are outside this search.</p>
    <button type="button" data-retained-source-action="search" className={styles.secondaryButton} disabled={disabled || searching || !query.trim()} onClick={() => void search()}>
      {searching ? "Searching…" : "Search retained notes"}
    </button>
    {error ? <p role="alert" className={styles.error}>{error}</p> : null}
    {result ? <div data-retained-source-results>
      <p role="status">{result.returned_entries} of {result.matching_entries} notes in matching results returned from {result.scanned_packets} packets through {result.cutoff_recorded_at}. Counts include both notes of each saved outcome group. {result.scanned_entry_occurrences} note occurrences scanned ({result.scanned_entry_utf8_bytes} UTF-8 bytes); {result.unique_entries} exact distinct notes.</p>
      <p className={styles.muted}>This chain is bounded to {result.limits.packets} packets, {result.limits.note_occurrences} note occurrences and {result.limits.scanned_entry_utf8_bytes} serialized note bytes. Source validation also reads lineage; these sizes are not disk I/O.</p>
      <p className={styles.muted}>Results: {result.result_utf8_bytes} UTF-8 bytes; at most {result.limits.results} notes and {result.limits.result_utf8_bytes} bytes. {result.omitted_matching_entries} notes omitted at these bounds. No note is clipped or saved outcome group split. No match here does not establish absence elsewhere.</p>
      {[...groups].map(([key, hits]) => <div key={key} className={styles.panel} data-retained-source-group>
        {hits.length === 2 ? <p>Historical forecast context and outcome report — both notes below will be selected together. Later reports do not replace this saved version.</p> : null}
        {hits.map(hit => <div key={hit.entry.entry_id} data-retained-source-hit={hit.entry.entry_id}>
        <strong>{hit.entry.why_included}</strong>
        <p>{hit.entry.compatibility_source_ref!.external_id} · {hit.entry.trust_class.replaceAll("_", " ")}</p>
        <p>{hit.selection === "currently_selected" ? "Currently selected" : "Historical — not selected in current work"}. Source time: {hit.entry.external_ref?.observed_at ?? "unknown"}. First saved: {hit.first_recorded_at}.</p>
        <p style={{ whiteSpace: "pre-wrap" }}>{hit.entry.bounded_summary}</p>
        <p className={styles.muted}>{hit.packet_occurrences} packet occurrence(s), treated as one exact excerpt, not independent evidence. Original external availability and currentness remain unverified. Reading now does not refresh the source.</p>
        <details><summary>Exact saved source</summary><p style={{ overflowWrap: "anywhere" }}>Packet: {hit.source.packet_id}<br />Packet fingerprint: {hit.source.packet_fingerprint}<br />Excerpt: {hit.source.entry_id}<br />Excerpt fingerprint: {hit.source.source_fingerprint}<br />Last selected: {hit.last_selected_at}</p></details>
        </div>)}
        <button type="button" data-retained-source-action="select" className={styles.secondaryButton}
          disabled={disabled || hits.length > remainingSlots || hits.some(isSelected)} onClick={() => onSelect(hits)}>
          {hits.some(isSelected) ? "Already selected" : hits.length === 2 ? "Select both historical notes for comparison" : "Select for comparison"}
        </button>
        {!hits.some(isSelected) && hits.length > remainingSlots ? <p data-retained-source-capacity>This selection needs {hits.length} note {hits.length === 1 ? "slot" : "slots"}; {remainingSlots} remain. Exclude notes before adding this selection.</p> : null}
      </div>)}
      <p className={styles.muted}>Historical does not mean rejected, deleted or automatically cooled. Earlier exclusions still apply until you deliberately select, compare and save a revision. Labels do not establish accepted meaning.</p>
    </div> : null}
  </details>;
}
