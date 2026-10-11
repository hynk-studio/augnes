"use client";
import { useEffect, useRef, useState } from "react";
import { useWorkDraftState, type WorkComposerDraft } from "../workbench/semantic-review/work-composer-draft";
import type { TerminalAuthorshipPreparation, TerminalPreparationResult, previewTerminalAuthorship } from "@/lib/vnext/runtime/stateless-terminal-authorship";

type Preparation = TerminalAuthorshipPreparation;
type Preview = ReturnType<typeof previewTerminalAuthorship>;
const reasons: Record<Exclude<TerminalPreparationResult, { status: "available" }>["reason"], string> = {
  completed_work: "This work has a validated completed result. Preparation for a stopped attempt does not apply.",
  attempt_not_stopped: "This attempt has not reached the stopped response required for linked-work preparation.",
  unresolved_effects: "The earlier request still has unresolved effects. Review its recorded outcome and any separately available work decision below.",
  completed_response_unavailable: "This attempt has no completed response eligible for linked-work preparation. Review its saved outcome.",
  work_receipt_present: "A work receipt is already recorded. The stopped-attempt preparation path cannot be used.",
  work_receipt_unavailable: "The returned results were saved, but the final work receipt is unavailable. This preparation path cannot repair it. Review the saved outcome.",
  history_missing: "The required attempt history is unavailable.",
  grant_missing: "The original authorization record is unavailable. It cannot be replaced with new permission.",
  packet_missing: "The original work context is unavailable.",
  receipt_unavailable: "The required historical response receipt is unavailable.",
  failure_evidence_unavailable: "The evidence needed to identify the earlier save failure is unavailable.",
  history_invalid: "The required attempt history could not be validated.",
  grant_invalid: "The original authorization could not be validated against this attempt.",
  packet_invalid: "The historical work context does not match its required bindings.",
  receipt_invalid: "The historical response receipt could not be validated against this attempt.",
  failure_evidence_invalid: "The recorded failure evidence is invalid or does not match this attempt.",
  source_context_invalid: "The saved source context could not be validated.",
  inspection_failed: "An inspection error prevented eligibility from being established.",
};

/** Keep the predecessor's mounted draft through explanatory result changes.
 * Cached material is draft context only: a failed inspection disables every
 * preparation action and invalidates in-flight comparison/preview responses. */
export function StatelessTerminalPreparation({ result, draftFor, refresh, busy, ...props }: {
  result: TerminalPreparationResult; draftFor: (key: string) => WorkComposerDraft;
  refresh: () => void; busy: boolean;
} & Pick<Parameters<typeof StatelessTerminalAuthorship>[0], "material" | "request" | "saved">) {
  const retained = useRef<Preparation | null>(null);
  if (result.status === "available") retained.current = result.preparation;
  const preparation = result.status === "available" ? result.preparation : retained.current;
  return <div data-terminal-preparation-status={result.status}>
    {result.status !== "available" && <div role="status">
      <p>{result.status === "failed" ? "Linked-work eligibility could not be established. " : result.status === "blocked" ? "Linked-work preparation is unavailable. " : ""}{reasons[result.reason]}</p>
      {result.status === "failed" && <p>Diagnostic reference: <code>{result.diagnostic_ref}</code></p>}
      {result.next_action === "read_again" && <><p>Check the saved records again. This only reads; it does not retry the model request, repair history or save work.</p>
        <button disabled={busy} onClick={refresh}>Check linked-work preparation again</button></>}
      {preparation && <p>Your draft is retained. Preparation actions stay unavailable until inspection succeeds.</p>}
    </div>}
    {preparation && <StatelessTerminalAuthorship key={JSON.stringify(preparation.binding)} {...props}
      draft={draftFor(JSON.stringify(preparation.binding))} preparation={preparation} inspectionAvailable={result.status === "available"} />}
  </div>;
}
/** Same authenticated review request owner; no grant or model control here. */
export function StatelessTerminalAuthorship({ preparation, material, request, saved, draft, inspectionAvailable = true }: {
  draft?: WorkComposerDraft;
  inspectionAvailable?: boolean;
  preparation: Preparation; material: { question: string; files: Array<{ path: string; start_line: number; end_line: number }> };
  request: (body: unknown) => Promise<any>; saved: () => Promise<void>;
}) {
  const sources = [...preparation.sources];
  if (preparation.current_direction_source && !sources.some(e => e.entry_id === preparation.current_direction_source!.entry_id)) sources.push(preparation.current_direction_source);
  const [definition, setDefinition] = useWorkDraftState(draft, "definition", preparation.definition);
  const [selected, setSelected] = useWorkDraftState(draft, "selected", () => preparation.sources.filter(e => {
    try { return JSON.parse(e.bounded_summary ?? "{}").profile !== "stateless_source_review.v0.1"; } catch { return true; }
  }).map(e => e.entry_id));
  const [comparisonResult, setComparison] = useState<{ value: Preview; identity: string } | null>(null);
  const [reasons, setReasons] = useWorkDraftState<Record<string, string>>(draft, "reasons", {});
  const [previewResult, setPreview] = useState<{ value: Preview; request: unknown; identity: string } | null>(null);
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  const revision = useRef(0), sequence = useRef(0), mounted = useRef(true);
  const context = JSON.stringify([preparation, material, inspectionAvailable]);
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
    if (!inspectionAvailable || preparation.recovery_suspended) return;
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
    <fieldset disabled={!inspectionAvailable || preparation.recovery_suspended}>
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
      <details><summary>Review exact bindings</summary><pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{JSON.stringify({ preview: preview.value.preview_binding, predecessor: preview.value.material.predecessor, root: preview.value.material.root_fingerprint, direction: preview.value.material.direction_ref, project_work: preview.value.material.project_work_binding }, null, 2)}</pre></details>
      <button disabled={busy} onClick={() => void act(async () => {
        if (preview.identity !== currentIdentity.current) return;
        await request({ action: "author_terminal_work", request: preview.request, expected_preview: preview.value.preview_binding }); setPreview(null); setComparison(null); await saved(); setMessage("New linked work saved with no execution permission. The stopped attempt remains unchanged.");
      })}>Author new linked work</button>
    </div>}
    </fieldset>
    {message && <p role="status">{message}</p>}
  </details>;
}
