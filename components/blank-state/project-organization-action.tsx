"use client";

import { useId, useRef, useState } from "react";
import type { ProjectManagementEntryV02 } from "@/types/vnext/project-onboarding";

export function ProjectOrganizationAction({ entry, disabled }: { entry: ProjectManagementEntryV02; disabled: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [pending, setPending] = useState(false);
  const [reconciliation, setReconciliation] = useState<string | null>(null);
  const archive = entry.organization.state === "working";
  const label = archive ? "Archive project" : "Unarchive project";

  async function change() {
    setPending(true);
    try {
      const response = await fetch("/api/vnext/projects", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: archive ? "archive" : "unarchive",
          project_id: entry.project.project_id, expected_organization_revision: entry.organization.revision,
          expected_project_id: entry.active_project_id, expected_revision: entry.active_selection_revision }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error("unconfirmed");
      // Refresh selection, recents and the viewed project together.
      window.location.reload();
    } catch {
      // A lost acknowledgement does not prove failure. Never replay the held
      // action: read this exact project and require fresh management controls.
      try {
        const response = await fetch("/api/vnext/projects?project_id=" + encodeURIComponent(entry.project.project_id), { cache: "no-store" });
        const value = await response.json();
        const organization = value.project?.organization;
        if (!response.ok || !value.ok || value.project?.project?.project_id !== entry.project.project_id ||
            !["working", "archived"].includes(organization?.state) || !/^organization:[0-9a-f]{32}$/u.test(organization?.revision)) throw new Error("unavailable");
        setReconciliation("The action was not confirmed. A fresh read shows this project is " +
          (organization.state === "archived" ? "archived." : "in the working list.") + " Refresh before another action.");
      } catch {
        setReconciliation("The action was not confirmed and fresh state is unavailable. Refresh to check before another action.");
      }
    } finally { setPending(false); }
  }

  return <>
    <button type="button" className="blank-state-secondary-button" disabled={disabled}
      onClick={() => { setReconciliation(null); dialog.current?.showModal(); }}>{label}</button>
    <dialog ref={dialog} aria-labelledby={titleId} style={{ maxWidth: "min(36rem, calc(100vw - 2rem))", overflowWrap: "anywhere" }} onCancel={event => { if (pending || reconciliation) event.preventDefault(); }}>
      <h3 id={titleId}>{label}: {entry.project.display_name ?? "Unnamed project"}?</h3>
      <p>{entry.local_root.normalized_path}</p>
      <p>{archive ? "Move this project out of the working list and recents. Find it later in Archived projects." : "Return this project to the working list. Open it separately when you are ready."}</p>
      {archive && entry.is_active ? <p>This is the current project. Archiving clears the displayed selection.</p> : null}
      <p>Files, saved work, history and unfinished obligations are retained. This does not pause direction, stop workers, revoke access, complete work or free history capacity.</p>
      {reconciliation ? <>
        <p role="alert">{reconciliation}</p>
        <button type="button" onClick={() => window.location.reload()}>Refresh project management</button>
      </> : <>
        <button type="button" disabled={pending} onClick={() => dialog.current?.close()}>Cancel</button>
        <button type="button" disabled={pending} onClick={() => void change()}>{label}</button>
      </>}
    </dialog>
  </>;
}
