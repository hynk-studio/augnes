"use client";
import { useEffect, useRef, useState } from "react";
import type { readTerminalAuthorshipPreparation, previewTerminalAuthorship } from "@/lib/vnext/runtime/stateless-terminal-authorship";

type Preparation = NonNullable<ReturnType<typeof readTerminalAuthorshipPreparation>>;
type Preview = ReturnType<typeof previewTerminalAuthorship>;
/** Same authenticated review request owner; no grant or model control here. */
export function StatelessTerminalAuthorship({ preparation, material, request, saved }: {
  preparation: Preparation; material: { question: string; files: Array<{ path: string; start_line: number; end_line: number }> };
  request: (body: unknown) => Promise<any>; saved: () => Promise<void>;
}) {
  const sources = [...preparation.sources];
  if (preparation.current_direction_source && !sources.some(e => e.entry_id === preparation.current_direction_source!.entry_id)) sources.push(preparation.current_direction_source);
  const [definition, setDefinition] = useState(preparation.definition);
  const [selected, setSelected] = useState(preparation.sources.filter(e => {
    try { return JSON.parse(e.bounded_summary ?? "{}").profile !== "stateless_source_review.v0.1"; } catch { return true; }
  }).map(e => e.entry_id));
  const [comparisonResult, setComparison] = useState<{ value: Preview; identity: string } | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [previewResult, setPreview] = useState<{ value: Preview; request: unknown; identity: string } | null>(null);
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  const revision = useRef(0), sequence = useRef(0), mounted = useRef(true);
  const context = JSON.stringify([preparation, material]);
  const comparisonIdentity = JSON.stringify([context, definition, selected]);
  const identity = JSON.stringify([comparisonIdentity, reasons]);
  const currentIdentity = useRef(identity); currentIdentity.current = identity;
  // Hide stale values in the material-change render, before the effect clears
  // them. An old request must never be submitted beside a newer displayed draft.
  const comparison = comparisonResult?.identity === comparisonIdentity ? comparisonResult.value : null;
  const preview = previewResult?.identity === identity ? previewResult : null;
  function reset(clearComparison = true) { revision.current++; if (clearComparison) setComparison(null); setPreview(null); setMessage(""); }
  useEffect(() => { revision.current++; setComparison(null); setPreview(null); setMessage(""); }, [context]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; sequence.current++; }; }, []);
  function authoredRequest() {
    return { predecessor: preparation.binding, definition, material, notes: selected.map(id => {
      const e = sources.find(s => s.entry_id === id)!;
      return preparation.sources.some(s => s.entry_id === id) ? { saved_source_id: id }
        : { source: e.compatibility_source_ref!.external_id, text: e.bounded_summary, observed_at: e.external_ref?.observed_at ?? null, provenance: e.trust_class, label: e.why_included };
    }), omitted_sources: (comparison?.comparison.unselected_previous ?? []).map(e => ({ source_binding: e.source_ref!, reason: reasons[e.source_ref!] ?? "" })) };
  }
  async function act(fn: (current: () => boolean) => Promise<void>) {
    const id = ++sequence.current, atRevision = revision.current, atIdentity = identity;
    const current = () => mounted.current && id === sequence.current && atRevision === revision.current && atIdentity === currentIdentity.current;
    setBusy(true); setMessage(""); try { await fn(current); }
    catch (e) { if (current()) setMessage(e instanceof Error ? e.message : "Authorship refused. Read current work again."); }
    finally { if (mounted.current && id === sequence.current) setBusy(false); }
  }
  return <details data-stateless-terminal-authorship="v0.1"><summary>Prepare new work linked to this stopped attempt</summary>
    <p>{preparation.warning}</p>
    <p>The provider response returned. Public judgment: {preparation.evidence.public_result}; failure layer: {preparation.evidence.layer}; reason: {preparation.evidence.code}. Missing evidence stays unavailable. The old packet and grant remain historical even when expired.</p>
    {preparation.evidence.layer === "result_persistence" && <p>The returned judgment was not committed. Preparing separate work does not retry that judgment, repair its receipt or settle provider effects.</p>}
    <p>Use the question and file ranges above for the new source selection. Choose substantive notes below; the stopped answer is not selected automatically. Operational history and earlier unknown effects are mandatory and separate.</p>
    {preparation.recovery_suspended && <p>Restored history is readable. New authorship and execution remain suspended.</p>}
    <label>New work goal<textarea aria-label="New work goal" value={definition.goal} onChange={e => { setDefinition({ ...definition, goal: e.target.value }); reset(); }} /></label>
    {(["success_criteria", "non_goals"] as const).map(k => <label key={k}>{k === "success_criteria" ? "Success criteria, one per line" : "Non-goals, one per line"}<textarea aria-label={k === "success_criteria" ? "New work success criteria" : "New work non-goals"} value={definition[k].join("\n")} onChange={e => { setDefinition({ ...definition, [k]: e.target.value.split("\n") }); reset(); }} /></label>)}
    {sources.map(e => <div key={e.entry_id}>
      <label><input type="checkbox" checked={selected.includes(e.entry_id)} onChange={event => { setSelected(event.target.checked ? [...selected, e.entry_id] : selected.filter(id => id !== e.entry_id)); reset(); }} />{e.why_included} — {e.trust_class}</label>
      <p>Source: {e.compatibility_source_ref?.external_id}; observed: {e.external_ref?.observed_at ?? "unavailable"}</p>
      <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{e.bounded_summary}</p>
    </div>)}
    <button disabled={busy || preparation.recovery_suspended || !material.question || !material.files.length} onClick={() => void act(async current => {
      setPreview(null); const body = { ...authoredRequest(), omitted_sources: [] };
      const value: Preview = (await request({ action: "compare_terminal_sources", request: body })).preparation;
      if (!current()) return;
      setComparison({ value, identity: comparisonIdentity });
      setReasons(prior => Object.fromEntries(value.comparison.unselected_previous.filter(e => prior[e.source_ref!] !== undefined).map(e => [e.source_ref!, prior[e.source_ref!]!])));
    })}>Compare selected context for new work</button>
    {comparison && <div>
      <p>{comparison.preparation_bytes} local bytes checked. No model call or execution authority.</p>
      {comparison.comparison.unselected_previous.map(e => <label key={e.entry_id}>Reason for leaving out: {e.compatibility_source_ref?.external_id}
        <input aria-label={`Omission reason ${e.entry_id}`} value={reasons[e.source_ref!] ?? ""} onChange={event => { setReasons({ ...reasons, [e.source_ref!]: event.target.value }); reset(false); }} />
      </label>)}
      <button disabled={busy || comparison.comparison.unselected_previous.some(e => !reasons[e.source_ref!]?.trim())} onClick={() => void act(async current => {
        setPreview(null); const body = authoredRequest();
        const value: Preview = (await request({ action: "preview_terminal_work", request: body })).preparation;
        if (current()) setPreview({ request: body, value, identity });
      })}>Preview linked authorship</button>
    </div>}
    {preview && <div data-terminal-authorship-preview>
      <p>New work: {preview.value.material.definition.goal}</p><p>Question: {preview.value.material.review.question}</p>
      <ul>{preview.value.material.review.files.map(f => <li key={f.path}>{f.path}, lines {f.start_line}–{f.end_line}</li>)}</ul>
      <p>Selected notes and operational lineage above will be saved. Automation stays unchanged. This creates a new packet with no execution grant; execution needs separate authorization.</p>
      <details><summary>Review exact bindings</summary><pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{JSON.stringify({ preview: preview.value.preview_binding, predecessor: preview.value.material.predecessor, root: preview.value.material.root_fingerprint, direction: preview.value.material.direction_ref, selection: preview.value.material.selection_revision }, null, 2)}</pre></details>
      <button disabled={busy} onClick={() => void act(async () => {
        if (preview.identity !== currentIdentity.current) return;
        await request({ action: "author_terminal_work", request: preview.request, expected_preview: preview.value.preview_binding }); setPreview(null); setComparison(null); await saved(); setMessage("New linked work saved with no execution permission. The stopped attempt remains unchanged.");
      })}>Author new linked work</button>
    </div>}
    {message && <p role="status">{message}</p>}
  </details>;
}
