"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { StatelessGrantRequest, SourceReview, StatelessDispositionBinding } from "@/lib/vnext/stateless-work";

type Review = { stage: string; next_step: string | null; disposition_preparation: null | { binding: StatelessDispositionBinding; disposition: null | { fingerprint: string }; warning: string }; run: { run_id: string; title: string; status: string; stop_reason: string | null;
  steps: Array<{ title: string; status: string; output: { judgment?: { rationale: string }; observation?: { availability: string; bytes_read: number } } }> } };
export function StatelessSourceReview({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [files, setFiles] = useState([{ path: "", start_line: 1, end_line: 1 }, { path: "", start_line: 1, end_line: 1 }]);
  const [pricing, setPricing] = useState({ input_nano_usd_per_byte: "", output_nano_usd_per_token: "", maximum_total_nano_usd: "", source_version: "" });
  const [prepared, setPrepared] = useState<{ packet_id: string; review: SourceReview; predecessor_effects_unknown?: boolean } | null>(null);
  const [preview, setPreview] = useState<StatelessGrantRequest | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  const endpoint = `/api/vnext/operator/stateless-source-review?project_id=${encodeURIComponent(projectId)}`;
  async function request(body?: unknown) {
    const response = await fetch(endpoint, { method: body ? "POST" : "GET", credentials: "same-origin", cache: "no-store",
      ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}) });
    const value = await response.json();
    if (!response.ok) throw new Error(response.status === 401 ? "Open protected project review to establish local access."
      : value.error === "stateless_review_model_configuration_unavailable" ? "The configured model is unavailable. The prepared work remains saved."
      : "This review could not be admitted. Check current work, project automation permission, file ranges and the quoted cost bounds.");
    return value;
  }
  async function act(action: () => Promise<void>) {
    setBusy(true); setMessage(""); try { await action(); router.refresh(); } catch (e) { setMessage(e instanceof Error ? e.message : "Review unavailable."); } finally { setBusy(false); }
  }
  const refresh = async () => { const value = await request(); setReviews(value.reviews); setPrepared(value.preparation); setPreview(null); setMessage(value.reviews.length ? "Saved review results loaded." : "No saved source reviews."); };
  return <details data-stateless-source-review="v0.1"><summary>Review a bounded source question with the configured model</summary>
    <p>Prepare one question for the current work and up to two exact file ranges. After one authorization, the model may request one local read or explain non-use, then reconsider the recorded observation. Its answer remains advice.</p>
    <label>Source-review question<textarea aria-label="Source-review question" value={question} maxLength={800} onChange={e => { setQuestion(e.target.value); setPrepared(null); setPreview(null); }} /></label>
    {files.map((file, index) => <div key={index}>
      <label>Review file {index + 1}<input aria-label={`Review file ${index + 1}`} value={file.path} onChange={e => { setFiles(files.map((f, i) => i === index ? { ...f, path: e.target.value } : f)); setPrepared(null); setPreview(null); }} /></label>
      {(["start_line", "end_line"] as const).map(key => <label key={key}>{key === "start_line" ? "First line" : "Last line"} {index + 1}<input type="number" min={1} max={20000} value={file[key]} onChange={e => { setFiles(files.map((f, i) => i === index ? { ...f, [key]: Number(e.target.value) } : f)); setPrepared(null); setPreview(null); }} /></label>)}
    </div>)}
    <button disabled={busy || !question || !files[0].path} onClick={() => void act(async () => {
      setPrepared(null); setPreview(null);
      const value = await request({ action: "prepare", material: { question, files: files.filter(f => f.path) } });
      setPrepared({ packet_id: value.result.packet_id, review: value.result.review }); setMessage(`Review saved with exact file versions. Preparation read ${value.result.preparation_bytes} bytes; no model call was made.`);
    })}>Prepare source review</button>
    <details><summary>Quoted model rates and spending limit</summary>
      <p>Supply reviewed conservative pricing bounds for the already configured model. Rates are integer nano-USD (one billionth of a dollar). Input is bounded by UTF-8 bytes; a per-token rate can serve as a conservative per-byte ceiling. Actual cost remains unknown unless reported.</p>
      {([ ["input_nano_usd_per_byte", "Input ceiling per byte"], ["output_nano_usd_per_token", "Output ceiling per token"], ["maximum_total_nano_usd", "Total ceiling for both judgments"], ["source_version", "Pricing source/version"] ] as const).map(([key, label]) => <label key={key}>{label}<input aria-label={label} type={key === "source_version" ? "text" : "number"} min={1} value={pricing[key]} onChange={e => { setPricing({ ...pricing, [key]: e.target.value }); setPreview(null); }} /></label>)}
      <button disabled={busy || !prepared || Object.values(pricing).some(v => !v)} onClick={() => void act(async () => {
        const p = { ...pricing, input_nano_usd_per_byte: Number(pricing.input_nano_usd_per_byte), output_nano_usd_per_token: Number(pricing.output_nano_usd_per_token), maximum_total_nano_usd: Number(pricing.maximum_total_nano_usd) };
        const authorization = (await request({ action: "preview", pricing: p })).authorization;
        if (authorization.packet_id !== prepared?.packet_id) { setPrepared(null); setPreview(null); throw new Error("Current work changed. Prepare the question again before authorizing it."); }
        setPreview(authorization);
      })}>Review authorization</button>
    </details>
    {preview && prepared && <div>
      <p>Saved question: {prepared.review.question}</p>
      {prepared.predecessor_effects_unknown && <p>The earlier request may have run or incurred cost. This authorization is for distinct new work. It does not settle, refund or reuse the earlier allowance.</p>}
      <ul style={{ overflowWrap: "anywhere" }}>{prepared.review.files.map(file => <li key={file.path}>{file.path}, lines {file.start_line}–{file.end_line}</li>)}</ul>
      <p>{preview.cost_budget.authority.provider_ref.external_id} / {preview.cost_budget.authority.model_ref.external_id}. At most two model requests, 16,384 input bytes and 1,024 output tokens each; 15 seconds each. One local read of at most two files / 65,536 bytes, returning at most 4,096 excerpt bytes. No commands or automatic retries.</p>
      <p>Authorization and first judgment each recheck up to 65,536 local bytes in addition to preparation and the action read. Model usage and cost are recorded when available.</p>
      <p>Total ceiling: ${(preview.cost_budget.maximum_permitted_cost * 2 / 1e9).toFixed(6)}. Permission expires {preview.expires_at}. The question, task, selected working direction, predecessor uncertainty and excerpts may be sent to this model.</p>
      <button disabled={busy} onClick={() => void act(async () => { await request({ action: "authorize_and_run", authorization: preview }); setPreview(null); await refresh(); })}>Authorize and run source review</button>
    </div>}
    <button disabled={busy} onClick={() => void act(refresh)}>Read saved source reviews</button>
    {reviews.map(review => <div key={review.run.run_id}>
      <p>{review.run.title} — {review.run.status}</p>
      {review.stage === "recovery_suspended" && <p>Restored history is available. Execution permission is suspended; this work will not resume.</p>}
      {review.stage === "dispatch_outcome_unknown" && <p>Dispatch outcome unknown. The request may have run or incurred cost. It will not be replayed automatically.</p>}
      {review.stage === "ended_effects_unknown" && <p>Further work ended locally. The earlier request may still have run or incurred cost. Its outcome remains unknown.</p>}
      {review.stage === "disposition_invalid" && <p>The saved work decision could not be validated. Execution remains blocked; the earlier outcome is unresolved.</p>}
      {review.run.steps.map(step => <p key={step.title}>{step.title}: {step.status}{step.output.judgment ? ` — ${step.output.judgment.rationale}` : step.output.observation ? ` — ${step.output.observation.availability}, ${step.output.observation.bytes_read} bytes` : ""}</p>)}
      {review.stage === "ready" && <button disabled={busy} onClick={() => void act(async () => { await request({ action: "continue", run_id: review.run.run_id }); await refresh(); })}>Continue from saved results</button>}
      {review.disposition_preparation && !review.disposition_preparation.disposition && <button disabled={busy} onClick={() => void act(async () => {
        await request({ action: "end_work", binding: review.disposition_preparation!.binding }); await refresh();
      })}>End further work; keep outcome unknown</button>}
      {review.disposition_preparation?.disposition && <div>
        <p>To prepare distinct linked work, enter a question and current file ranges above. Existing success criteria and non-goals carry forward. Preparation makes no model request and grants no execution permission.</p>
        <button disabled={busy || !question || !files[0].path} onClick={() => void act(async () => {
          setPrepared(null); setPreview(null);
          const value = await request({ action: "prepare_linked_work", disposition: { run_id: review.run.run_id, disposition_fingerprint: review.disposition_preparation!.disposition!.fingerprint }, material: { question, files: files.filter(f => f.path) } });
          setPrepared(value.result); setMessage("Linked new work saved. The earlier outcome remains unknown. Review fresh authorization separately when ready.");
        })}>Prepare linked work from the question above</button>
      </div>}
      {review.stage !== "finished" && review.stage !== "ended_effects_unknown" && review.stage !== "disposition_invalid" && !review.disposition_preparation && <button disabled={busy} onClick={() => void act(async () => { await request({ action: "cancel", run_id: review.run.run_id }); await refresh(); })}>Cancel further execution permission</button>}
    </div>)}
    {message && <p role="status">{message}</p>}
  </details>;
}
