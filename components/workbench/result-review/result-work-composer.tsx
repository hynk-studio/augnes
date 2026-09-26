"use client";

import { useState } from "react";
import { FirstWorkComposer } from "../semantic-review/first-work-composer";
import type { readResultWorkPreparationV01, previewResultWorkV01 } from "@/lib/vnext/runtime/authored-successor-task";
import styles from "../semantic-review/semantic-review.module.css";

type Preparation = ReturnType<typeof readResultWorkPreparationV01>;
type Preview = ReturnType<typeof previewResultWorkV01>;
const route = "/api/vnext/operator/project-continuity";
async function post<T>(body: unknown): Promise<T> {
  const response = await fetch(route, { method: "POST", cache: "no-store", credentials: "same-origin",
    headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error("This result cannot prepare current work with these bindings. Reload current work and review its status before trying again.");
  return result as T;
}

export function ResultWorkComposer({ receiptId }: { receiptId: string }) {
  const [preparation, setPreparation] = useState<Preparation | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  async function run(action: () => Promise<void>) {
    setBusy(true); setError(null);
    try { await action(); } catch (failure) { setError(failure instanceof Error ? failure.message : "Preparation unavailable."); }
    finally { setBusy(false); }
  }
  if (saved) return <div role="status" data-result-work-saved>
    <p>Next work is prepared with the selected notes. Nothing has started. The prior outcome and unresolved matters remain in history.</p>
    <a href="/workbench/semantic-review">Read current work</a>
  </div>;
  return <section data-result-work-composer style={{ minWidth: 0, overflowWrap: "anywhere" }}>
    {!preparation ? <button type="button" className={styles.secondaryButton} disabled={busy} data-result-work-action="open"
      onClick={() => void run(async () => setPreparation(await post<Preparation>({ action: "read_result_work_preparation", receipt_id: receiptId })))}>
      Prepare next work from this result
    </button> : null}
    {error ? <p role="alert">{error}</p> : null}
    {preparation ? <div hidden={preview !== null}>
      {!preparation.result_source ? <p>The whole result report cannot fit a source note. Select a bounded, attributed excerpt using the note editor; the full report remains above.</p> : null}
      <FirstWorkComposer initialization={preparation.initialization} mode="new_task" busy={busy}
        resultBinding={preparation.binding} resultSource={preparation.result_source}
        onCancel={() => setPreparation(null)} onSave={async (definition, selection, omitted_sources) => {
          await run(async () => setPreview(await post<Preview>({ action: "preview_result_work", binding: preparation.binding,
            definition, selected_sources: { ...selection, omitted_sources } })));
        }} />
    </div> : null}
    {preview ? <div className={styles.panel} data-result-work-preview>
      <h3>Review next work and selected judgments</h3>
      <p>Previous task: {preview.before?.goal}</p>
      <p>Next task: {preview.after.goal}</p>
      <strong>Success criteria</strong><ul>{preview.after.success_criteria.map(text => <li key={text}>{text}</li>)}</ul>
      <strong>Out of scope</strong><ul>{preview.after.non_goals.map(text => <li key={text}>{text}</li>)}</ul>
      <h4>Selected material</h4>
      {preview.sources_after.map(entry => <div key={entry.entry_id}>
        <p>{entry.why_included} · {entry.trust_class.replaceAll("_", " ")} · {entry.external_ref?.observed_at ?? "Source time unknown"}</p>
        <p>{entry.compatibility_source_ref?.external_id}</p><p style={{ whiteSpace: "pre-wrap" }}>{entry.bounded_summary}</p>
      </div>)}
      {preview.omitted_sources.map(row => <p key={row.source_binding}>Omitted: {preview.sources_before.find(entry => entry.source_ref === row.source_binding)?.bounded_summary} — {row.reason}</p>)}
      <p>These are attributed working notes. Selection does not verify claims; omission does not reject or delete an observation. No semantic decision or execution authority is created.</p>
      <button type="button" className={styles.button} data-result-work-action="save" disabled={busy} onClick={() => void run(async () => {
        const result = await post<{ status: string; run_created: boolean; execution_started: boolean }>({ action: "prepare_result_work", request: preview.request });
        if (result.status !== "inserted" || result.run_created !== false || result.execution_started !== false) throw new Error("Save outcome is unknown. Reload current work before another action.");
        setSaved(true);
      })}>Prepare this next work</button>
      <button type="button" className={styles.secondaryButton} data-result-work-action="edit" disabled={busy} onClick={() => setPreview(null)}>Edit preparation</button>
      <button type="button" className={styles.secondaryButton} disabled={busy} onClick={() => { setPreview(null); setPreparation(null); }}>Cancel</button>
    </div> : null}
  </section>;
}
