"use client";
export function ProjectDestinationActions({ projectId, expectedProjectId }: { projectId: string; expectedProjectId: string | null }) {
  async function activate() {
    const response = await fetch("/api/vnext/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "open", project_id: projectId, expected_project_id: expectedProjectId }) });
    if (response.ok) window.location.reload();
  }
  return <button type="button" onClick={activate}>Make active</button>;
}
