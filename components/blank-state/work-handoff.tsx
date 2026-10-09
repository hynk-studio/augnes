"use client";
import { useState } from "react";
import { useProjectDraftAccess } from "./project-draft-access";
import { useRouter } from "next/navigation";
import type { WorkHandoff as Snapshot } from "@/lib/vnext/work-handoff";
import type { DefineInitialProjectWorkRequestV01 } from "@/types/vnext/project-work-initialization";

export function WorkHandoff({ projectId }: { projectId: string }) {
  return <ScopedWorkHandoff key={projectId} projectId={projectId} />;
}
function ScopedWorkHandoff({ projectId }: { projectId: string }) {
  const access = useProjectDraftAccess(projectId);
  const router = useRouter();
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [preview, setPreview] = useState<{ request: DefineInitialProjectWorkRequestV01; fingerprint: string } | null>(null);
  const [importedMaterial, setImportedMaterial] = useState<unknown>(null);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const route = `/api/vnext/operator/work-handoff?project_id=${encodeURIComponent(projectId)}`;
  async function call(body?: unknown) { await access.verify(); const response = await fetch(route, { method: body ? "POST" : "GET", credentials: "same-origin", headers: { "Augnes-Project-Id": projectId, ...(body ? { "Content-Type": "application/json" } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) }); access.check(response); const value = await response.json(); if (!response.ok) { if (response.status === 409 && importedMaterial !== null) setNeedsRefresh(true); throw new Error("Handoff unavailable. Your original material is retained. Refresh its preview and review this project’s current work before saving."); } return value; }
  async function act(work: () => Promise<void>) { setBusy(true); setMessage(""); try { await work(); } catch (e) { setMessage(e instanceof Error ? e.message : "Handoff unavailable."); } finally { setBusy(false); } }
  if (access.locked) return <div data-work-handoff-locked role="status"><p>Handoff access is unavailable. Its material is retained for the original project and operator.</p>
    <a href={`/workbench/semantic-review?project_id=${encodeURIComponent(projectId)}`} target="_blank" rel="noreferrer">Open protected review</a>
    <button disabled={busy} data-work-handoff-action="restore" onClick={() => void act(async () => { await access.verify(true); setPreview(null); setNeedsRefresh(importedMaterial !== null); })}>Restore handoff after authentication</button>
    {message && <p>{message}</p>}
  </div>;
  return <details data-work-handoff="v0.1"><summary>Hand off unfinished review work</summary>
    <p>Transfer selected historical excerpts and notes into a fresh local project. This authors new work with no permission to execute. Unknown effects remain unknown; local source files must be verified separately. This is not project restore or cross-device qualification.</p>
    <button disabled={busy} onClick={() => void act(async () => { const current = await call(); if (current.handoff) { setPreview(null); setImportedMaterial(null); setNeedsRefresh(false); setSnapshot(current.handoff); setMessage("Saved imported context loaded. Use ordinary work preparation to reconsider selected notes and current files."); return; }
      const packet = current.packet, receipts = packet?.selected_context.filter((e: { external_ref?: { ref_type: string } }) => e.external_ref?.ref_type === "run_receipt");
      if (receipts?.length !== 1) throw new Error("Prepare an ordinary successor from a completed source review first.");
      const exported = await call({ action: "export", expected: { packet_id: packet.packet_id, packet_fingerprint: packet.integrity.fingerprint, receipt_id: receipts[0].external_ref.external_id } });
      setPreview(null); setImportedMaterial(null); setNeedsRefresh(false); setSnapshot(exported.handoff);
    })}>Review saved handoff material</button>
    <label>Import a work handoff<input aria-label="Import a work handoff" type="file" accept="application/json" disabled={busy} onChange={e => { const file = e.target.files?.[0]; setPreview(null); setSnapshot(null); setImportedMaterial(null); setNeedsRefresh(false); if (!file) return; void act(async () => { if (file.size > 24576) throw new Error("Handoff exceeds the complete-material limit."); const value = JSON.parse(await file.text()); setImportedMaterial(value); setNeedsRefresh(true); const result = await call({ action: "preview", handoff: value }); setSnapshot(value); setPreview(result.preview); setNeedsRefresh(false); }); }} /></label>
    {importedMaterial !== null && needsRefresh && <div role="alert" data-work-handoff-conflict>
      <p>The original imported snapshot is retained. Refresh checks this project without saving or replacing its work.</p>
      <button disabled={busy} data-work-handoff-action="refresh" onClick={() => void act(async () => { const result = await call({ action: "preview", handoff: importedMaterial }); setSnapshot(result.preview.request.handoff.snapshot); setPreview(result.preview); setNeedsRefresh(false); })}>Refresh retained handoff preview</button>
    </div>}
    {snapshot && <div style={{ overflowWrap: "anywhere" }}>
      <p>{snapshot.task.goal}</p><ul>{snapshot.task.success_criteria.map(c => <li key={c}>{c}</li>)}</ul>
      <p>Non-goals: {snapshot.task.non_goals.join("; ")}</p>
      <p>Historical receipt verification: {snapshot.evidence.verification}. Source authenticity remains imported and unverified.</p>
      {snapshot.selected_notes.map(n => <div key={n.entry_id}><p>{n.why_included} — {n.trust_class}; source: {n.compatibility_source_ref?.external_id}; observed: {n.external_ref?.observed_at ?? "unavailable"}</p><p style={{ whiteSpace: "pre-wrap" }}>{n.bounded_summary}</p></div>)}
      {snapshot.evidence.observation.sources.map(s => <div key={s.path}><p>{s.path}:{s.start_line}–{s.end_line} (historical snapshot)</p><pre style={{ whiteSpace: "pre-wrap" }}>{s.text}</pre></div>)}
      <button disabled={busy || !!preview} onClick={() => void act(async () => { const current = await call(); const result = await call({ action: "verify_material", expected_packet_fingerprint: current.packet.integrity.fingerprint }); setMessage(result.matches_historical_material ? "Current local bytes match the historical material. No execution authority was created." : "Current material differs from the historical snapshot. Reconsider the source selection before execution."); })}>Compare current local material</button>
      <p>Unresolved history: {snapshot.obligations.length} mandatory entries. No historical grant, session, controller or claim is active here.</p>
      <details><summary>Provenance, omissions and remaining obligations</summary><pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify({ source: snapshot.source, evidence: { ...snapshot.evidence, observation: undefined }, obligations: snapshot.obligations, omissions: snapshot.omissions }, null, 2)}</pre></details>
      {!preview && <button disabled={busy} onClick={() => { const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot)], { type: "application/json" })); const link = document.createElement("a"); link.href = url; link.download = "augnes-work-handoff.json"; link.click(); URL.revokeObjectURL(url); }}>Save handoff file</button>}
      {preview && <button disabled={busy || needsRefresh} onClick={() => void act(async () => { await call({ action: "receive", request: preview.request, expected_preview: preview.fingerprint }); setPreview(null); setImportedMaterial(null); setNeedsRefresh(false); setMessage("Work saved with no execution grant. Review historical context and prepare current material through ordinary work preparation."); router.refresh(); })}>Author this work in this project</button>}
    </div>}
    {message && <p role="status">{message}</p>}
  </details>;
}
