"use client";

import { useProjectClientFetch, useProjectClientScope } from "../semantic-review/project-client-scope";
import { useRef, useState } from "react";
import { useWorkDraftState, type WorkComposerDraft } from "../semantic-review/work-composer-draft";
import type { OperatorSessionViewV01 } from "../semantic-review/operator-session-panel";
import { FirstWorkComposer } from "../semantic-review/first-work-composer";
import type { readResultWorkPreparationV01, previewResultWorkV01 } from "@/lib/vnext/runtime/authored-successor-task";
import styles from "../semantic-review/semantic-review.module.css";

type Preparation = ReturnType<typeof readResultWorkPreparationV01>;
type Preview = ReturnType<typeof previewResultWorkV01>;
const route = "/api/vnext/operator/project-continuity";
export interface ResultWorkComposerContext {
  session: OperatorSessionViewV01;
  draft: WorkComposerDraft;
  onAccessRefused: (code?: string) => void;
}
class PreparationRequestError extends Error {
  constructor(readonly status: number, readonly code?: string) {
    super(status === 401 || status === 403 ? "Review access is unavailable. Authenticate this project to recover its draft."
      : "This result or its sources changed. Your text and selected notes are retained. Refresh this result before continuing.");
  }
}
async function requestPost<T>(fetch: typeof globalThis.fetch, body: unknown): Promise<T> {
  const response = await fetch(route, { method: "POST", cache: "no-store", credentials: "same-origin",
    headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok || !result.ok) throw new PreparationRequestError(response.status, result.error_code);
  return result as T;
}

export function ResultWorkComposer({ receiptId, context }: { receiptId: string; context: ResultWorkComposerContext }) {
  const fetch = useProjectClientFetch();
  const projectId = useProjectClientScope();
  const { draft, session, onAccessRefused } = context;
  const post = <T,>(body: unknown) => requestPost<T>(fetch, body);
  const [preparation, setPreparation] = useWorkDraftState<Preparation | null>(draft, "resultPreparation", null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [refreshed, setRefreshed] = useState<Preparation | null>(null);
  const [needsRefresh, setNeedsRefresh] = useState(preparation !== null);
  const [editorRevision, setEditorRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(true);
  const [saved, setSaved] = useWorkDraftState(draft, "resultSaved", false);
  function accessRefused(code?: string) {
    setVisible(false); setPreview(null); setNeedsRefresh(true); onAccessRefused(code);
  }
  async function assertOwner() {
    const response = await fetch("/api/vnext/operator/session", { method: "GET", cache: "no-store", credentials: "same-origin" });
    const body = await response.json();
    if (!response.ok || body.status !== "authenticated" || !body.session?.authenticated) throw new PreparationRequestError(401, body.error_code);
    if (body.session.workspace_id !== session.workspace_id || body.session.project_id !== session.project_id ||
      body.session.operator_id !== session.operator_id || (projectId !== null && projectId !== session.project_id)) {
      throw new PreparationRequestError(403, "operator_session_scope_mismatch");
    }
  }
  async function readPreparation() {
    const value = await post<Preparation>({ action: "read_result_work_preparation", receipt_id: receiptId });
    if (value.initialization.workspace_id !== session.workspace_id || value.initialization.project_id !== session.project_id ||
      value.binding.expected_latest_receipt_id !== receiptId) throw new PreparationRequestError(403, "operator_session_scope_mismatch");
    return value;
  }
  async function run(action: () => Promise<void>) {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError(null);
    try { await assertOwner(); await action(); }
    catch (failure) {
      if (failure instanceof PreparationRequestError && (failure.status === 401 || failure.status === 403)) accessRefused(failure.code);
      else { setNeedsRefresh(preparation !== null); setRefreshed(null); setError(failure instanceof Error ? failure.message : "Preparation unavailable. Your draft is retained."); }
    } finally { inFlight.current = false; setBusy(false); }
  }
  function discard() {
    draft.clear(); setPreparation(null); setPreview(null); setRefreshed(null); setNeedsRefresh(false); setError(null);
  }
  if (!visible || !session.authenticated || (projectId !== null && projectId !== session.project_id)) return <p role="status">Authenticate this project to recover its retained draft.</p>;
  if (saved) return <div role="status" data-result-work-saved>
    <p>Next work is prepared with the selected notes. Nothing has started. The prior outcome and unresolved matters remain in history.</p>
    <a href={`/workbench/semantic-review?project_id=${encodeURIComponent(session.project_id)}`}>Read current work</a>
  </div>;
  return <section data-result-work-composer style={{ minWidth: 0, overflowWrap: "anywhere" }}>
    {!preparation ? <button type="button" className={styles.secondaryButton} disabled={busy} data-result-work-action="open"
      onClick={() => void run(async () => setPreparation(await readPreparation()))}>
      Prepare next work from this result
    </button> : null}
    {error ? <p role="alert">{error}</p> : null}
    {preparation && needsRefresh ? <div role="alert" data-result-work-draft-conflict>
      <p>Your draft belongs to this result. Its text, selected notes and omission reasons are retained. No newer work is overwritten.</p>
      <button type="button" className={styles.secondaryButton} disabled={busy} data-result-work-action="refresh"
        onClick={() => void run(async () => setRefreshed(await readPreparation()))}>Refresh this result</button>
      {refreshed ? <>
        <p data-result-work-refreshed-goal>Current work: {refreshed.initialization.current_work?.goal}</p>
        <button type="button" className={styles.secondaryButton} disabled={busy} data-result-work-action="recompare" onClick={() => {
          draft.delete("sourceSelection"); draft.delete("comparison"); draft.set("sourcesPending", true);
          setPreparation(refreshed); setPreview(null); setRefreshed(null); setNeedsRefresh(false); setError(null); setEditorRevision(value => value + 1);
        }}>Use refreshed bindings and compare sources again</button>
      </> : null}
      <p>If this result is no longer current, keep its draft here while reviewing saved work. Start a separate preparation for the newer result.</p>
      <a href={`/workbench/semantic-review?project_id=${encodeURIComponent(session.project_id)}`} target="_blank" rel="noreferrer">Read current work in another tab</a>
    </div> : null}
    {preparation ? <div hidden={preview !== null && !needsRefresh}>
      {!preparation.result_source ? <p>The whole result report cannot fit a source note. Select a bounded, attributed excerpt using the note editor; the full report remains above.</p> : null}
      <FirstWorkComposer key={editorRevision} draft={draft} initialization={preparation.initialization} mode="new_task" busy={busy || needsRefresh}
        onAccessRefused={accessRefused} onRefreshCurrentWork={() => run(async () => { setNeedsRefresh(true); setRefreshed(await readPreparation()); })}
        resultBinding={preparation.binding} resultSource={preparation.result_source} reviewedOutcome={preparation.reviewed_outcome}
        onCancel={discard} onSave={async (definition, selection, omitted_sources) => {
          await run(async () => setPreview(await post<Preview>({ action: "preview_result_work", binding: preparation.binding,
            definition, selected_sources: { ...selection, omitted_sources } })));
        }} />
    </div> : null}
    {preview && !needsRefresh ? <div className={styles.panel} data-result-work-preview>
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
      <button type="button" className={styles.secondaryButton} disabled={busy} onClick={discard}>Discard preparation</button>
    </div> : null}
  </section>;
}
