"use client";

import { useRef, useState } from "react";

const unavailable = "Authenticate the original project and operator in protected review, then restore this draft.";

// Mounted editor memory belongs to the first verified principal. A new session
// for that principal may recover it; another principal never adopts the draft.
export function useProjectDraftAccess(projectId: string) {
  const owner = useRef<string | null>(null);
  const blocked = useRef(false);
  const generation = useRef(0);
  const [locked, setLocked] = useState(false);
  function refuse(): never {
    blocked.current = true; generation.current++; setLocked(true);
    throw new Error(unavailable);
  }
  async function verify(recover = false) {
    if (blocked.current && !recover) throw new Error(unavailable);
    const observedGeneration = generation.current;
    const response = await fetch("/api/vnext/operator/session", { cache: "no-store", credentials: "same-origin",
      headers: { "Augnes-Project-Id": projectId } });
    if (response.status === 401 || response.status === 403) refuse();
    const body = await response.json();
    if (!response.ok || body.status !== "authenticated" || body.session?.authenticated !== true ||
      body.session.project_id !== projectId || typeof body.session.workspace_id !== "string" || typeof body.session.operator_id !== "string") refuse();
    const identity = JSON.stringify([body.session.workspace_id, body.session.project_id, body.session.operator_id]);
    if (owner.current !== null && owner.current !== identity) refuse();
    if (observedGeneration !== generation.current) throw new Error(unavailable);
    owner.current = identity;
    if (recover) { blocked.current = false; setLocked(false); }
  }
  function check(response: Response) {
    if (response.status === 401 || response.status === 403) refuse();
  }
  return { locked, verify, check };
}
