"use client";

import { useEffect, useRef, useState } from "react";
import { ProjectOrganizationAction } from "./project-organization-action";
import type { ProjectManagementEntryV02, RegisteredProjectPageV02 } from "@/types/vnext/project-onboarding";

export function RegisteredProjects({ busy, onOpen, onLocate }: {
  busy: boolean;
  onOpen: (entry: ProjectManagementEntryV02) => void;
  onLocate: (entry: ProjectManagementEntryV02) => void;
}) {
  const [page, setPage] = useState<RegisteredProjectPageV02 | null>(null);
  const [scope, setScope] = useState<"working" | "archived">("working");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);

  async function load(cursor: string | null, requestedScope = scope) {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setPending(true);
    setError(null);
    if (cursor === null) setPage(null);
    setScope(requestedScope);
    try {
      const response = await fetch(`/api/vnext/projects?view=registered&organization=${requestedScope}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`, { cache: "no-store", signal: request.signal });
      const value = await response.json() as RegisteredProjectPageV02 & { ok: boolean };
      if (!response.ok || !value.ok || !Array.isArray(value.projects) || value.organization_scope !== requestedScope ||
          value.complete !== (value.next_cursor === null) || value.projects.some(entry => entry.organization?.state !== requestedScope ||
          !/^organization:[0-9a-f]{32}$/u.test(entry.organization.revision))) throw new Error("incomplete");
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
    <p>Archive sets a project aside while retaining its saved work and history. Work and access keep their existing permissions.</p>
    <div aria-label="Saved project views">
      <button type="button" className="blank-state-secondary-button" aria-pressed={scope === "working"} disabled={busy || pending} onClick={() => void load(null, "working")}>Working projects</button>
      <button type="button" className="blank-state-secondary-button" aria-pressed={scope === "archived"} disabled={busy || pending} onClick={() => void load(null, "archived")}>Archived projects</button>
    </div>
    <button type="button" className="blank-state-secondary-button" disabled={busy || pending} onClick={() => void load(null)}>
      {pending ? "Reading saved projects…" : page || error ? "Refresh saved projects" : "Find saved projects"}
    </button>
    {error ? <p role="alert">{error}</p> : null}
    {page ? <>
      <p>{scope === "working" ? "Working projects" : "Archived projects"}: {page.complete ? "All projects in this list have been read." : "More saved projects are available."} Refresh to include later changes.</p>
      {page.projects.length === 0 ? <p>No {scope} projects found.</p> : <ul className="recent-project-list">
        {page.projects.map(entry => <li key={entry.project.project_id} data-saved-project={entry.project.project_id} data-project-organization={entry.organization.state}>
          <div>
            <strong>{entry.project.display_name ?? "Unnamed project"}</strong>
            <p>{entry.local_root.normalized_path}</p>
            <p>{scope === "archived" ? "Archived" : entry.in_recents ? "In recents" : "Not in recents"}{entry.is_active ? " · Current" : ""} · {entry.root_availability === "available" ? "Folder available" : "Folder needs to be located"}</p>
          </div>
          {scope === "working" ? <button type="button" className="blank-state-secondary-button" disabled={busy || pending}
            onClick={() => entry.root_availability === "available" ? onOpen(entry) : onLocate(entry)}>
            {entry.root_availability === "available" ? "Make current and open" : "Locate folder"}
          </button> : null}
          <ProjectOrganizationAction entry={entry} disabled={busy || pending} />
        </li>)}
      </ul>}
      {page.next_cursor ? <button type="button" className="blank-state-secondary-button" disabled={busy || pending} onClick={() => void load(page.next_cursor)}>Load more saved projects</button> : null}
    </> : null}
  </div>;
}
