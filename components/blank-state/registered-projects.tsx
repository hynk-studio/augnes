"use client";

import { useEffect, useRef, useState } from "react";
import type { ProjectManagementEntryV02, RegisteredProjectPageV02 } from "@/types/vnext/project-onboarding";

export function RegisteredProjects({ busy, onOpen, onLocate }: {
  busy: boolean;
  onOpen: (entry: ProjectManagementEntryV02) => void;
  onLocate: (entry: ProjectManagementEntryV02) => void;
}) {
  const [page, setPage] = useState<RegisteredProjectPageV02 | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);

  async function load(cursor: string | null) {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/vnext/projects?view=registered${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`, { cache: "no-store", signal: request.signal });
      const value = await response.json() as RegisteredProjectPageV02 & { ok: boolean };
      if (!response.ok || !value.ok || !Array.isArray(value.projects) || value.complete !== (value.next_cursor === null)) throw new Error("incomplete");
      if (controller.current !== request || request.signal.aborted) return;
      setPage(previous => ({ ...value, projects: cursor && previous ? [...previous.projects, ...value.projects] : value.projects }));
    } catch {
      if (controller.current !== request || request.signal.aborted) return;
      // A failed continuation invalidates the display; it never proves absence.
      setPage(null);
      setError("The saved project list could not be completed or changed. Refresh to read it again.");
    } finally {
      if (controller.current === request && !request.signal.aborted) setPending(false);
    }
  }

  return <div id="registered-projects">
    <h3>Saved projects</h3>
    <p>Removing a project from recents keeps its data. Find it here to open the same project again, including projects created by an authorized agent.</p>
    <button type="button" className="blank-state-secondary-button" disabled={busy || pending} onClick={() => void load(null)}>
      {pending ? "Reading saved projects…" : page || error ? "Refresh saved projects" : "Find saved projects"}
    </button>
    {error ? <p role="alert">{error}</p> : null}
    {page ? <>
      <p>{page.complete ? "All projects in this list have been read." : "More saved projects are available."} Refresh to include newly registered projects.</p>
      {page.projects.length === 0 ? <p>No saved projects found.</p> : <ul className="recent-project-list">
        {page.projects.map(entry => <li key={entry.project.project_id} data-saved-project={entry.project.project_id}>
          <div>
            <strong>{entry.project.display_name ?? "Unnamed project"}</strong>
            <p>{entry.local_root.normalized_path}</p>
            <p>{entry.in_recents ? "In recents" : "Not in recents"}{entry.is_active ? " · Current" : ""} · {entry.root_availability === "available" ? "Folder available" : "Folder needs to be located"}</p>
          </div>
          <button type="button" className="blank-state-secondary-button" disabled={busy || pending}
            onClick={() => entry.root_availability === "available" ? onOpen(entry) : onLocate(entry)}>
            {entry.root_availability === "available" ? "Make current and open" : "Locate folder"}
          </button>
        </li>)}
      </ul>}
      {page.next_cursor ? <button type="button" className="blank-state-secondary-button" disabled={busy || pending} onClick={() => void load(page.next_cursor)}>Load more saved projects</button> : null}
    </> : null}
  </div>;
}
