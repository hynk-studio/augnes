"use client";

import { useState } from "react";
import { FirstWorkComposer } from "./first-work-composer";
import type { ProjectWorkInitializationV01 } from "@/types/vnext/project-work-initialization";
import type { previewNewProjectWorkV01 } from "@/lib/vnext/runtime/project-work-revision";
import styles from "./semantic-review.module.css";

type Preview = ReturnType<typeof previewNewProjectWorkV01>;
const route = "/api/vnext/operator/project-continuity";

export function NewWorkComposer({ initialization, onCancel, onCommitted }: {
  initialization: ProjectWorkInitializationV01; onCancel: () => void; onCommitted: () => Promise<void>;
}) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function post(body: unknown, save = false) {
    const uncertain = save
      ? "The save response could not be confirmed. Reload current work before taking another action; a save may have committed."
      : "Preview unavailable. Reload current work before preparing again; no save was requested.";
    let response: Response;
    let result;
    try {
      response = await fetch(route, { method: "POST", cache: "no-store", credentials: "same-origin",
        headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      result = await response.json();
    } catch {
      throw new Error(uncertain);
    }
    if (response.status >= 500) throw new Error(uncertain);
    if (!response.ok) throw new Error(`Preparation refused (${response.status}). Reload current work before preparing again.`);
    return result;
  }
  return <section data-new-work-composer>
    {error ? <p role="alert" className={styles.error}>{error}</p> : null}
    <div hidden={preview !== null}><FirstWorkComposer initialization={initialization} busy={busy} mode="new_task" onCancel={onCancel}
      onSave={async (definition, selection, omitted_sources) => {
        setBusy(true); setError(null);
        try {
          const packet = initialization.current_packet!;
          const result = await post({ action: "preview_new_project_work", workspace_id: initialization.workspace_id,
            project_id: initialization.project_id, expected_active_project_id: initialization.project_id,
            expected_active_selection_revision: initialization.active_selection_revision,
            expected_current_packet_id: packet.packet_id, expected_current_packet_fingerprint: packet.packet_fingerprint,
            expected_current_lineage_kind: packet.lineage_kind, ...definition, ...selection, omitted_sources });
          if (result.status !== "new_work_preview") throw new Error("Preview unavailable.");
          setPreview(result);
        } catch (failure) { setError(failure instanceof Error ? failure.message : "Preview unavailable."); }
        finally { setBusy(false); }
      }} /></div>
    {preview ? <div className={styles.panel} data-new-work-preview>
      <h2>Review different task</h2>
      <p>The prior preparation stays in history. It is not marked complete and its unresolved matters remain unresolved. The new task is unexecuted and unverified; no approval or execution grant transfers.</p>
      {(["before", "after"] as const).map(key => <div key={key} className={styles.materialCard}>
        <h3>{key === "before" ? "Prior task" : "New task"}</h3>
        <p>{preview.comparison[key].goal}</p>
        <strong>Success criteria</strong><ul>{preview.comparison[key].success_criteria.map(value => <li key={value}>{value}</li>)}</ul>
        <strong>Out of scope</strong><ul>{preview.comparison[key].non_goals.map(value => <li key={value}>{value}</li>)}</ul>
      </div>)}
      <h3>Selected context</h3>
      {preview.comparison.sources_after.map(entry => <p key={entry.entry_id} style={{ whiteSpace: "pre-wrap" }}>
        {entry.why_included} · {entry.trust_class} · {entry.external_ref?.observed_at ?? "Source time unknown"}: {entry.bounded_summary}
      </p>)}
      {preview.comparison.omitted_sources.map(row => <p key={row.source_binding}>
        Omitted: {preview.comparison.sources_before.find(entry => entry.source_ref === row.source_binding)?.bounded_summary} — {row.reason}
      </p>)}
      <p>Selection does not verify source claims. Exclusion does not delete or refute them.</p>
      <button type="button" className={styles.button} disabled={busy} data-new-work-action="save" onClick={async () => {
        setBusy(true); setError(null);
        try {
          const result = await post(preview.request, true);
          if (!["inserted", "exact_replay"].includes(result.status) || result.execution_started !== false || result.run_created !== false) {
            throw new Error("Save outcome could not be confirmed. Reload current work before taking another action.");
          }
          await onCommitted();
        } catch (failure) { setError(failure instanceof Error ? failure.message : "Save outcome unknown; reload current work."); }
        finally { setBusy(false); }
      }}>{busy ? "Preparing…" : "Prepare this different task"}</button>
      <button type="button" className={styles.secondaryButton} disabled={busy} onClick={() => setPreview(null)}>Edit preparation</button>
      <button type="button" className={styles.secondaryButton} disabled={busy} onClick={onCancel}>Cancel</button>
    </div> : null}
  </section>;
}
