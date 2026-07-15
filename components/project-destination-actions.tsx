"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProjectDestinationActions({ projectId, expectedProjectId, expectedRevision }: { projectId: string; expectedProjectId: string | null; expectedRevision: number | null }) {
  const [message, setMessage] = useState<string | null>(null);
  async function activate() {
    const response = await fetch("/api/vnext/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "open", project_id: projectId, expected_project_id: expectedProjectId, expected_revision: expectedRevision }) });
    const result = await response.json();
    if (response.ok) window.location.reload();
    else setMessage(result.error_code === "active_selection_conflict" ? "The active project changed. Refresh and try again." : "This project could not be made active.");
  }
  return <><button type="button" onClick={activate}>Make active</button>{message && <p role="status">{message}</p>}</>;
}

export function ProjectHomeRefreshAction() {
  const router = useRouter();
  return <button type="button" className="secondary" onClick={() => router.refresh()}>Refresh</button>;
}
