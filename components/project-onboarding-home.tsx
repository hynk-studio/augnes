"use client";

import { useEffect, useState } from "react";
import type { LocalFolderPickerOutcomeV01, RecentProjectEntryV01 } from "@/types/vnext/project-onboarding";

export function ProjectOnboardingHome({ initialRecent }: { initialRecent: RecentProjectEntryV01[] }) {
  const [recent, setRecent] = useState(initialRecent);
  const [picker, setPicker] = useState<LocalFolderPickerOutcomeV01 | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setHydrated(true); }, []);

  async function mutate(body: Record<string, unknown>) {
    const response = await fetch("/api/vnext/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const value = await response.json();
    if (!response.ok || !value.ok) throw new Error(value.error_code ?? "onboarding_unavailable");
    return value;
  }
  async function choose() {
    setBusy(true); setMessage(null);
    try {
      const value = await mutate({ action: "choose_folder" });
      setPicker(value.picker);
      if (value.picker.status === "cancelled") setMessage("Folder selection was cancelled. Nothing changed.");
      if (value.picker.status === "unavailable") setMessage("A native folder picker is unavailable on this system.");
    } catch { setMessage("The folder picker could not be opened."); }
    finally { setBusy(false); }
  }
  async function confirm() {
    if (!picker || picker.status !== "selected") return;
    setBusy(true);
    try {
      const value = await mutate({ action: "confirm", selection_token: picker.selection_token, inspection_fingerprint: picker.inspection.inspection_fingerprint });
      window.location.assign(value.result.destination);
    } catch (error) {
      setMessage(error instanceof Error && error.message === "active_selection_conflict"
        ? "The active project changed. Refresh and choose the folder again."
        : error instanceof Error && error.message === "inspection_stale"
          ? "The folder changed. Choose it again before confirming."
          : "The project could not be added.");
      setPicker(null);
    }
    finally { setBusy(false); }
  }
  async function open(entry: RecentProjectEntryV01) {
    if (entry.root_availability !== "available") { setMessage("Locate the folder before opening this project."); return; }
    setBusy(true);
    try {
      const value = await mutate({
        action: "open",
        project_id: entry.project.project_id,
        expected_project_id: entry.active_project_id,
        expected_revision: entry.active_selection_revision,
      });
      window.location.assign(value.result.destination);
    } catch { setMessage("The active project changed. Refresh and try again."); }
    finally { setBusy(false); }
  }
  async function remove(entry: RecentProjectEntryV01) {
    setBusy(true);
    try {
      await mutate({
        action: "remove",
        project_id: entry.project.project_id,
        expected_project_id: entry.active_project_id,
        expected_revision: entry.active_selection_revision,
      });
      setRecent((items) => items
        .filter((item) => item.project.project_id !== entry.project.project_id)
        .map((item) => entry.is_active
          ? { ...item, is_active: false, active_project_id: null, active_selection_revision: null }
          : item));
      setMessage("Removed from recent projects. Project data remains stored.");
    }
    catch (error) { setMessage(error instanceof Error && error.message === "active_selection_conflict" ? "The active project changed. Refresh and try again." : "The project could not be removed from recents."); }
    finally { setBusy(false); }
  }
  async function locate(entry: RecentProjectEntryV01) {
    setBusy(true); setMessage(null);
    try {
      const chosen = (await mutate({ action: "choose_folder" })).picker as LocalFolderPickerOutcomeV01;
      if (chosen.status !== "selected") { setMessage(chosen.status === "cancelled" ? "Folder selection was cancelled. Nothing changed." : "A replacement folder could not be selected."); return; }
      if (!window.confirm(`Move ${entry.project.display_name ?? "this project"} from\n${entry.local_root.normalized_path}\nto\n${chosen.inspection.local_root.normalized_path}?\nRepository found: ${chosen.inspection.repository_display ?? "none"}\nExisting repository bindings will not be changed. This project will become active.`)) return;
      const value = await mutate({ action: "confirm_rebind", project_id: entry.project.project_id, selection_token: chosen.selection_token, inspection_fingerprint: chosen.inspection.inspection_fingerprint });
      window.location.assign(value.result.destination);
    } catch (error) {
      setMessage(error instanceof Error && error.message === "active_selection_conflict"
        ? "The active project changed. Refresh and try again."
        : "The replacement root conflicts with another project or changed during confirmation.");
    }
    finally { setBusy(false); }
  }

  return <main className="project-selector-shell" data-project-onboarding-hydrated={hydrated ? "true" : "false"}>
    <header><p className="project-selector-eyebrow">Augnes · Local projects</p><h1>Choose a project</h1><p>Select a folder, review what Augnes found locally, then confirm. No provider connection is required.</p></header>
    <section className="project-selector-card" aria-labelledby="add-project-title">
      <h2 id="add-project-title">Add a local project</h2>
      <button type="button" onClick={choose} disabled={busy}>Choose folder</button>
      {message && <p role="status">{message}</p>}
      {picker?.status === "selected" && <div className="project-inspection" aria-live="polite">
        <h3>{picker.inspection.display_name}</h3>
        <dl><div><dt>Folder</dt><dd>{picker.inspection.local_root.normalized_path}</dd></div><div><dt>Type</dt><dd>{picker.inspection.folder_kind === "git_repository" ? "Git repository" : "Plain folder"}</dd></div><div><dt>Repository</dt><dd>{picker.inspection.repository_display ?? (picker.inspection.folder_kind === "git_repository" ? "No remote configured" : "Not a repository")}</dd></div></dl>
        {picker.inspection.already_added && <p>This folder is already added. Confirming will reopen the same project.</p>}
        <p>Confirming will make this project active.</p>
        <div className="project-actions"><button type="button" onClick={confirm} disabled={busy}>Confirm project</button><button type="button" className="secondary" onClick={() => setPicker(null)} disabled={busy}>Cancel</button></div>
      </div>}
    </section>
    <section className="project-selector-card" aria-labelledby="recent-projects-title"><h2 id="recent-projects-title">Recent projects</h2>
      {recent.length === 0 ? <p>No recent projects yet. Choose a folder to begin.</p> : <ul className="recent-project-list">{recent.map((entry) => <li key={entry.project.project_id}>
        <div><strong>{entry.project.display_name ?? "Unnamed project"}</strong>{entry.is_active && <span className="active-project-badge">Active</span>}<p>{entry.local_root.normalized_path}</p><p className={`root-status root-status--${entry.root_availability}`}>{entry.root_availability === "available" ? "Folder available" : `Folder ${entry.root_availability.replace("_", " ")}`}</p></div>
        <div className="project-actions">{entry.root_availability === "available" ? <button type="button" onClick={() => open(entry)} disabled={busy}>{entry.is_active ? "Open" : "Switch and open"}</button> : <button type="button" onClick={() => locate(entry)} disabled={busy}>Locate folder</button>}<button type="button" className="secondary" onClick={() => remove(entry)} disabled={busy}>Remove from recent</button></div>
      </li>)}</ul>}
    </section>
    <p><a href="/overview">Open the previous Augnes overview</a></p>
  </main>;
}
