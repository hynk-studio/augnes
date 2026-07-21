"use client";

import { useEffect, useState } from "react";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { ProductShell } from "@/components/product-shell";
import type { LocalFolderPickerOutcomeV01, RecentProjectEntryV01 } from "@/types/vnext/project-onboarding";

type SelectedFolder = Extract<LocalFolderPickerOutcomeV01, { status: "selected" }>;

export function ProjectOnboardingHome({ initialRecent }: { initialRecent: RecentProjectEntryV01[] }) {
  const [recent, setRecent] = useState(initialRecent);
  const [picker, setPicker] = useState<LocalFolderPickerOutcomeV01 | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [pendingRebind, setPendingRebind] = useState<{
    entry: RecentProjectEntryV01;
    chosen: SelectedFolder;
  } | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<RecentProjectEntryV01 | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);

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
  async function confirmRemoval() {
    if (!pendingRemoval) return;
    const entry = pendingRemoval;
    setBusy(true); setMessage(null); setDialogError(null);
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
      setPendingRemoval(null);
    }
    catch (error) { setDialogError(error instanceof Error && error.message === "active_selection_conflict" ? "The active project changed. Refresh before retrying this removal." : "The project could not be removed from recents. Nothing was removed; you can retry or cancel."); }
    finally { setBusy(false); }
  }
  async function locate(entry: RecentProjectEntryV01) {
    setBusy(true); setMessage(null);
    try {
      const chosen = (await mutate({ action: "choose_folder" })).picker as LocalFolderPickerOutcomeV01;
      if (chosen.status !== "selected") { setMessage(chosen.status === "cancelled" ? "Folder selection was cancelled. Nothing changed." : "A replacement folder could not be selected."); return; }
      setDialogError(null);
      setPendingRebind({ entry, chosen });
    } catch {
      setMessage("The replacement folder could not be inspected.");
    }
    finally { setBusy(false); }
  }
  async function confirmRebind() {
    if (!pendingRebind) return;
    const { entry, chosen } = pendingRebind;
    setBusy(true); setMessage(null); setDialogError(null);
    try {
      const value = await mutate({ action: "confirm_rebind", project_id: entry.project.project_id, selection_token: chosen.selection_token, inspection_fingerprint: chosen.inspection.inspection_fingerprint });
      window.location.assign(value.result.destination);
    } catch (error) {
      setDialogError(error instanceof Error && error.message === "active_selection_conflict"
        ? "The active project changed. Refresh before retrying this folder change."
        : "The replacement folder conflicts with another project or changed during confirmation. Nothing was changed; you can retry or cancel.");
    }
    finally { setBusy(false); }
  }

  const activeProject = recent.find((entry) => entry.is_active)?.project.display_name;

  return <ProductShell
    surface="projects"
    projectContext={activeProject
      ? { label: "Current project", name: activeProject }
      : null}
  >
    <main className="project-selector-shell" data-project-onboarding-hydrated={hydrated ? "true" : "false"}>
      <header className="project-selector-header"><p className="project-selector-eyebrow">Projects</p><h1>Choose where to continue</h1><p>Open a recent project or select a local folder. Augnes inspects the folder before anything becomes active, and no provider connection is required.</p></header>
      <div className="project-selector-grid">
        <section className="project-selector-card project-selector-card--add" aria-labelledby="add-project-title" aria-busy={busy}>
          <p className="project-selector-section-label">New or existing folder</p>
          <h2 id="add-project-title">Add a local project</h2>
          <p className="project-selector-card-intro">Choose a folder to see its type, repository connection, and whether Augnes already knows it.</p>
          <button type="button" onClick={choose} disabled={busy}>{busy ? "Opening folder picker…" : "Choose folder"}</button>
          {message && <p className="project-selector-message" role="status">{message}</p>}
          {picker?.status === "selected" && <div className="project-inspection" aria-live="polite">
            <p className="project-selector-section-label">Folder inspection</p>
            <h3>{picker.inspection.display_name}</h3>
            <dl><div><dt>Folder</dt><dd>{picker.inspection.local_root.normalized_path}</dd></div><div><dt>Type</dt><dd>{picker.inspection.folder_kind === "git_repository" ? "Git repository" : "Plain folder"}</dd></div><div><dt>Repository</dt><dd>{picker.inspection.repository_display ?? (picker.inspection.folder_kind === "git_repository" ? "No remote configured" : "Not a repository")}</dd></div></dl>
            {picker.inspection.already_added && <p className="project-selector-notice">This folder is already added. Confirming will reopen the same project.</p>}
            <p>Confirming makes this the active local project.</p>
            <div className="project-actions"><button type="button" onClick={confirm} disabled={busy}>Confirm project</button><button type="button" className="secondary" onClick={() => setPicker(null)} disabled={busy}>Cancel</button></div>
          </div>}
        </section>
        <section id="recent-projects" className="project-selector-card project-selector-card--recent" aria-labelledby="recent-projects-title" aria-busy={busy}><p className="project-selector-section-label">Continue locally</p><h2 id="recent-projects-title">Recent projects</h2>
          {recent.length === 0 ? <div className="project-selector-empty"><strong>No recent projects yet</strong><p>Choose a folder to begin. It will appear here for quick access next time.</p></div> : <ul className="recent-project-list">{recent.map((entry) => <li key={entry.project.project_id} className={entry.is_active ? "is-active" : undefined}>
            <div><strong>{entry.project.display_name ?? "Unnamed project"}</strong>{entry.is_active && <span className="active-project-badge">Current</span>}<p>{entry.local_root.normalized_path}</p><p className={`root-status root-status--${entry.root_availability}`}>{entry.root_availability === "available" ? "Folder available" : `Folder ${entry.root_availability.replace("_", " ")}`}</p></div>
            <div className="project-actions">{entry.root_availability === "available" ? <button type="button" onClick={() => open(entry)} disabled={busy}>{entry.is_active ? "Open project" : "Switch and open"}</button> : <button type="button" onClick={() => locate(entry)} disabled={busy}>Locate folder</button>}<button type="button" className="secondary" onClick={() => { setMessage(null); setDialogError(null); setPendingRemoval(entry); }} disabled={busy}>Remove from recents</button></div>
          </li>)}</ul>}
        </section>
      </div>
      <details className="project-selector-compatibility"><summary>Compatibility and recovery</summary><p><a href="/recovery">Open update and recovery</a></p><p><a href="/overview">Open the previous Augnes overview</a></p></details>
    </main>
    <ConfirmationDialog
      open={pendingRebind !== null}
      title={`Move ${pendingRebind?.entry.project.display_name ?? "this project"}?`}
      description="Use the selected folder as this project's local root. Existing repository bindings will not change, and the project will become active."
      confirmLabel="Use this folder"
      busy={busy}
      error={dialogError}
      onCancel={() => { setDialogError(null); setPendingRebind(null); }}
      onConfirm={confirmRebind}
    >
      {pendingRebind ? <dl><div><dt>Previous folder</dt><dd>{pendingRebind.entry.local_root.normalized_path}</dd></div><div><dt>Selected folder</dt><dd>{pendingRebind.chosen.inspection.local_root.normalized_path}</dd></div><div><dt>Repository found</dt><dd>{pendingRebind.chosen.inspection.repository_display ?? "None"}</dd></div></dl> : null}
    </ConfirmationDialog>
    <ConfirmationDialog
      open={pendingRemoval !== null}
      title={`Remove ${pendingRemoval?.project.display_name ?? "this project"} from recents?`}
      description="This removes the shortcut only. Stored project data and local files are not deleted."
      confirmLabel="Remove from recents"
      tone="attention"
      busy={busy}
      error={dialogError}
      onCancel={() => { setDialogError(null); setPendingRemoval(null); }}
      onConfirm={confirmRemoval}
    />
  </ProductShell>;
}
