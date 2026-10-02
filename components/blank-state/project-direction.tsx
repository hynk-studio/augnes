"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { DirectionContent, DirectionView } from "@/lib/vnext/project-direction";

export function ProjectDirection({ projectId, initial }: { projectId: string; initial: DirectionView }) {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const [state, setState] = useState(initial);
  const [purpose, setPurpose] = useState(initial.effective?.value.content.purpose ?? "");
  const [reason, setReason] = useState("");
  const [criteria, setCriteria] = useState(initial.effective?.value.content.criteria.join("\n") ?? "");
  const [constraints, setConstraints] = useState(initial.effective?.value.content.constraints.join("\n") ?? "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [files, setFiles] = useState([{ path: "", contains: "" }, { path: "", contains: "" }]);
  const [agenda, setAgenda] = useState<string | null>(null);
  const [agentRoot, setAgentRoot] = useState("");
  const [agentName, setAgentName] = useState("");
  const [agentPurposes, setAgentPurposes] = useState("");
  const [child, setChild] = useState(false);
  const [contribution, setContribution] = useState("");
  const [returnQuestion, setReturnQuestion] = useState("");
  const [agentCredential, setAgentCredential] = useState<string | null>(null);
  const route = `/api/vnext/operator/project-direction?project_id=${encodeURIComponent(projectId)}`;
  const lines = (value: string) => value.split("\n").map(v => v.trim()).filter(Boolean);
  const content = (): DirectionContent => ({ purpose, criteria: lines(criteria), constraints: lines(constraints) });
  async function request(url: string, body?: unknown) {
    const response = await fetch(url, { method: body ? "POST" : "GET", credentials: "same-origin", cache: "no-store",
      ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}) });
    const value = await response.json();
    if (!response.ok) throw new Error(response.status === 401 || response.status === 404
      ? "Open protected project review to establish local access, then return here."
      : value.error === "project_direction_define_ordinary_work_first" ? "Define the current work before preparing an inspection."
      : value.error === "project_direction_stale_revision" ? "Direction changed while this form was open. Refresh and review the current version."
      : "The request could not be admitted. Review current direction, project access and automation permission before continuing.");
    return value;
  }
  async function act(action: () => Promise<void>) {
    setBusy(true); setMessage("");
    try { await action(); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Request unavailable."); }
    finally { setBusy(false); }
  }
  async function decide(selected = content(), proposalRef: string | null = null) {
    const result = await request(route, { action: "decide", expected_ref: state.effective?.ref ?? null, content: selected,
      reason: reason || (state.effective ? "" : "Initial working direction"), status: "active", proposal_ref: proposalRef });
    setState(result.state); setPurpose(selected.purpose); setAgenda(null); setReason(""); setMessage("Direction saved. Pending work must use this revision; earlier work and evidence remain unchanged.");
  }
  return <section className="blank-state-project-direction" aria-label="Project direction" data-project-direction="v0.1" data-project-direction-hydrated={hydrated ? "true" : "false"}>
    <p className="blank-state-region-label">Project direction</p>
    <p>{state.effective?.value.content.purpose ?? "What would you like this project to explore or achieve?"}</p>
    {state.effective && <p>Decision authority: {state.effective.value.principal.kind === "human" ? "You" : state.effective.value.principal.id.replace(/^role:/, "")} · Revision {state.effective.value.revision} · {state.effective.value.status}</p>}
    {(!state.parent_current || !state.authority_current || state.pending_work.some(w => w.needs_reconsideration)) && <p role="status">Direction or delegation changed. Reconsider pending work before starting it.</p>}
    <details>
      <summary>{state.effective ? "Review or change direction" : "Add a direction (optional)"}</summary>
      <p>A short outcome or open question is enough. Direction guides task selection; accepted goals and factual support retain their existing review process.</p>
      {state.effective?.value.principal.kind !== "agent" && <form onSubmit={event => { event.preventDefault(); void act(() => decide()); }}>
        <label>Desired outcome or open question<textarea aria-label="Desired outcome or open question" maxLength={600} value={purpose} onChange={e => setPurpose(e.target.value)} required /></label>
        {state.effective && <label>Why change direction?<input aria-label="Why change direction?" value={reason} maxLength={600} onChange={e => setReason(e.target.value)} required /></label>}
        <details><summary>Progress criteria and constraints</summary>
          <label>Useful progress (one per line)<textarea value={criteria} onChange={e => setCriteria(e.target.value)} /></label>
          <label>Constraints (one per line)<textarea value={constraints} onChange={e => setConstraints(e.target.value)} /></label>
        </details>
        <button disabled={busy || !hydrated} type="submit">Save direction</button>
      </form>}
      {state.proposals.map(proposal => <div key={proposal.ref}>
        <p>{proposal.value.kind === "return" ? "Returned child material" : "Proposed direction"}: {proposal.value.content.purpose}</p>
        <p>{proposal.value.reason} · Proposed by {proposal.value.principal.id}</p>
        {proposal.value.kind === "proposal" && state.effective?.value.principal.kind === "human" && <button disabled={busy || !hydrated || !reason} onClick={() => void act(() => decide(proposal.value.content, proposal.ref))}>Use this proposed direction</button>}
      </div>)}
      <details><summary>Direction history and delegation</summary>
        <p>Creation attribution: {state.history[0]?.value.created_by?.id ?? "Not recorded for this existing project"}. Direction permission never authorizes execution or increases resources.</p>
        {state.effective?.value.parent && <p>Delegated contribution: {state.effective.value.parent.contribution}. Return: {state.effective.value.parent.return_question}.</p>}
        <ol>{state.history.map(h => <li key={h.ref}>{h.value.content.purpose} — {h.value.reason} ({h.value.at})</li>)}</ol>
      </details>
    </details>
    {state.effective && <details><summary>Prepare a source inspection</summary>
      <p>Select up to two top-level text files in this project and the text to check. This prepares ordinary work; authorization remains a separate action.</p>
      {files.map((file, index) => <div key={index}>
        <label>Source file {index + 1}<input aria-label={`Source file ${index + 1}`} value={file.path} onChange={e => setFiles(files.map((f, i) => i === index ? { ...f, path: e.target.value } : f))} /></label>
        <label>Text to check {index + 1}<input aria-label={`Text to check ${index + 1}`} value={file.contains} onChange={e => setFiles(files.map((f, i) => i === index ? { ...f, contains: e.target.value } : f))} /></label>
      </div>)}
      <button disabled={busy || !hydrated} onClick={() => void act(async () => {
        const result = await request(route, { action: "prepare_inspection", expected_ref: state.effective!.ref, files: files.filter(f => f.path) });
        setAgenda(result.agenda_ref); setMessage("Inspection prepared. Review its permission and bounds before arming.");
      })}>Prepare inspection</button>
      {agenda && <div><p>One attempt, at most 10 seconds, two files and 65,536 bytes. No commands, model calls or network. This action arms and runs the qualified foreground host for up to 15 seconds. Existing project automation permission must also allow it.</p>
        <button disabled={busy || !hydrated} onClick={() => void act(async () => {
          const endpoint = "/api/vnext/operator/prospective-reentry";
          const preview = await request(`${endpoint}?agenda_ref=${encodeURIComponent(agenda)}&preview=authorization`);
          const authorized = await request(endpoint, { action: "authorize", authorization: preview.authorization_preview });
          await request(endpoint, { action: "arm", agenda_ref: agenda, authorization_ref: { grant_id: authorized.authorization.grant_id, grant_fingerprint: authorized.authorization.grant_fingerprint } });
          const completed = await request(route, { action: "run_inspection", agenda_ref: agenda });
          setMessage(completed.inspection.state?.receipt_id
            ? "Inspection returned a recorded result and reconsidered the agenda. Review the result in the workplane before defining the next task."
            : "The bounded host ended. Review the recorded agenda and execution state before trying again."); setAgenda(null);
        })}>Authorize and inspect</button></div>}
    </details>}
    <details><summary>Authorize a bounded agent role</summary>
      <p>Authorize direction decisions for the next hour, up to 8 mutations and one new project. The role can choose among the directions below without repeated confirmation. It receives no execution permission.</p>
      <label>New project name<input value={agentName} onChange={e => setAgentName(e.target.value)} /></label>
      <label>Existing project folder<input value={agentRoot} onChange={e => setAgentRoot(e.target.value)} /></label>
      <label>Allowed directions (one per line)<textarea value={agentPurposes} onChange={e => setAgentPurposes(e.target.value)} /></label>
      <label><input type="checkbox" checked={child} onChange={e => setChild(e.target.checked)} />Delegate this as a child of the current project</label>
      {child && <><label>Why separate, and intended contribution<input value={contribution} onChange={e => setContribution(e.target.value)} /></label>
        <label>Result or question to return<input value={returnQuestion} onChange={e => setReturnQuestion(e.target.value)} /></label></>}
      <button disabled={busy || !hydrated || child && !state.effective} onClick={() => void act(async () => {
        const result = await request(route, { action: "authorize_agent", role: "role:direction-researcher", allowed_directions: lines(agentPurposes).map(purpose => ({ purpose, criteria: [], constraints: [] })),
          max_mutations: 8, expires_in_minutes: 60, creation_slots: [{ root: agentRoot, display_name: agentName,
            delegation: child ? { expected_parent_ref: state.effective!.ref, why: contribution, contribution, return_question: returnQuestion } : null }] });
        setAgentCredential(result.credential); setState(result.state); setMessage("Bounded role authorized. Copy access directly to the intended local agent; no project or execution has started.");
      })}>Authorize role</button>
      {agentCredential && <button onClick={() => void act(async () => { await navigator.clipboard.writeText(agentCredential); setAgentCredential(null); setMessage("Agent access copied. Keep it out of prompts, logs and project files."); })}>Copy agent access once</button>}
      {state.grants.map(grant => <div key={grant.record.ref}>
        <p>{grant.record.value.principal.id.replace(/^role:/, "")} · {grant.available ? "Authorized" : "Inactive"} · expires {grant.record.value.expires_at}</p>
        {grant.projects.length > 0 && <><p>Renew direction access for: {grant.projects.map(p => p.display_name).join(", ")}. Keep the same allowed directions, at most 8 decisions for one hour, and the current parent direction. Previous access ends.</p>
          <button disabled={busy || !hydrated} onClick={() => void act(async () => {
            const result = await request(route, { action: "renew_agent", grant_ref: grant.record.ref,
              projects: grant.projects.map(p => ({ project_id: p.project_id, expected_ref: p.direction_ref })), expires_in_minutes: 60, max_mutations: 8 });
            setState(result.state); setAgentCredential(result.credential); setMessage("Replacement access authorized for the same logical role. The agent must reconsider the current direction before preparing new work.");
          })}>Renew role access</button></>}
        {grant.available && <button disabled={busy || !hydrated} onClick={() => void act(async () => {
          const result = await request(route, { action: "revoke_agent", grant_ref: grant.record.ref, reason: "User ended this delegation" });
          setState(result.state); setAgentCredential(null); setMessage("Agent delegation revoked.");
        })}>Revoke role access</button>}
      </div>)}
    </details>
    {message && <p role="status">{message}</p>}
    <a href="/workbench/semantic-review">Protected project review</a>
  </section>;
}
