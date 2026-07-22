"use client";

import { useEffect, useState } from "react";

import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { DirectHostRoundTripAction } from "@/components/direct-host-round-trip-action";
import { ProjectControls } from "@/components/project-controls";
import { publicBlankStateTextV01 } from "@/lib/vnext/blank-state/blank-state-view";
import type {
  BlankStatePrimaryActionV01,
  BlankStateSourceV01,
  BlankStateViewV01,
} from "@/types/vnext/blank-state";
import type {
  LocalFolderPickerOutcomeV01,
  RecentProjectEntryV01,
} from "@/types/vnext/project-onboarding";

type SelectedFolder = Extract<LocalFolderPickerOutcomeV01, { status: "selected" }>;

export function BlankStateClient({
  source,
  view,
}: {
  source: BlankStateSourceV01;
  view: BlankStateViewV01;
}) {
  const [recent, setRecent] = useState(source.recent_projects);
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

  useEffect(() => setHydrated(true), []);
  useEffect(() => setRecent(source.recent_projects), [source.recent_projects]);

  async function mutate(body: Record<string, unknown>) {
    const response = await fetch("/api/vnext/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const value = await response.json();
    if (!response.ok || !value.ok) {
      throw new Error(value.error_code ?? "project_management_unavailable");
    }
    return value;
  }

  async function choose() {
    setBusy(true);
    setMessage(null);
    try {
      const value = await mutate({ action: "choose_folder" });
      setPicker(value.picker);
      if (value.picker.status === "cancelled") {
        setMessage("Folder selection was cancelled. Nothing changed.");
      }
      if (value.picker.status === "unavailable") {
        setMessage("A native folder picker is unavailable on this system.");
      }
    } catch {
      setMessage("The folder picker could not be opened.");
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (!picker || picker.status !== "selected") return;
    setBusy(true);
    try {
      const value = await mutate({
        action: "confirm",
        selection_token: picker.selection_token,
        inspection_fingerprint: picker.inspection.inspection_fingerprint,
      });
      window.location.assign(value.result.destination);
    } catch (error) {
      setMessage(error instanceof Error && error.message === "active_selection_conflict"
        ? "The current project changed. Refresh and choose the folder again."
        : error instanceof Error && error.message === "inspection_stale"
          ? "The folder changed. Choose it again before confirming."
          : "The project could not be added.");
      setPicker(null);
    } finally {
      setBusy(false);
    }
  }

  async function open(entry: RecentProjectEntryV01) {
    if (entry.root_availability !== "available") {
      setMessage("Locate the folder before opening this project.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const value = await mutate({
        action: "open",
        project_id: entry.project.project_id,
        expected_project_id: entry.active_project_id,
        expected_revision: entry.active_selection_revision,
      });
      window.location.assign(value.result.destination);
    } catch {
      setMessage("The current project changed. Refresh and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function activate(projectId: string) {
    setBusy(true);
    setMessage(null);
    try {
      await mutate({
        action: "open",
        project_id: projectId,
        expected_project_id: source.active_project_id,
        expected_revision: source.recent_projects.find((entry) => entry.is_active)
          ?.active_selection_revision ?? null,
      });
      window.location.reload();
    } catch {
      setMessage("The current project changed. Refresh and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmRemoval() {
    if (!pendingRemoval) return;
    const entry = pendingRemoval;
    setBusy(true);
    setMessage(null);
    setDialogError(null);
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
    } catch (error) {
      setDialogError(error instanceof Error && error.message === "active_selection_conflict"
        ? "The current project changed. Refresh before retrying this removal."
        : "The project could not be removed from recents. Nothing was removed; you can retry or cancel.");
    } finally {
      setBusy(false);
    }
  }

  async function locate(entry: RecentProjectEntryV01) {
    setBusy(true);
    setMessage(null);
    try {
      const chosen = (await mutate({ action: "choose_folder" })).picker as LocalFolderPickerOutcomeV01;
      if (chosen.status !== "selected") {
        setMessage(chosen.status === "cancelled"
          ? "Folder selection was cancelled. Nothing changed."
          : "A replacement folder could not be selected.");
        return;
      }
      setDialogError(null);
      setPendingRebind({ entry, chosen });
    } catch {
      setMessage("The replacement folder could not be inspected.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmRebind() {
    if (!pendingRebind) return;
    const { entry, chosen } = pendingRebind;
    setBusy(true);
    setMessage(null);
    setDialogError(null);
    try {
      const value = await mutate({
        action: "confirm_rebind",
        project_id: entry.project.project_id,
        selection_token: chosen.selection_token,
        inspection_fingerprint: chosen.inspection.inspection_fingerprint,
      });
      window.location.assign(value.result.destination);
    } catch (error) {
      setDialogError(error instanceof Error && error.message === "active_selection_conflict"
        ? "The current project changed. Refresh before retrying this folder change."
        : "The replacement folder conflicts with another project or changed during confirmation. Nothing was changed; you can retry or cancel.");
    } finally {
      setBusy(false);
    }
  }

  const projection = source.projection;
  const primaryEntry = primaryRecentEntry(view.primary_action, recent);
  const projectManagement = (
    <ProjectManagement
      recent={recent}
      picker={picker}
      busy={busy}
      message={message}
      primaryAction={view.primary_action}
      onChoose={() => void choose()}
      onConfirm={() => void confirm()}
      onOpen={(entry) => void open(entry)}
      onLocate={(entry) => void locate(entry)}
      onRemove={(entry) => {
        setMessage(null);
        setDialogError(null);
        setPendingRemoval(entry);
      }}
      onCancelInspection={() => setPicker(null)}
    />
  );

  return (
    <>
      <main
        className="blank-state-shell"
        data-blank-state="v0.1"
        data-blank-state-focus={view.focus}
        data-blank-state-active={projection?.project_summary.is_active ? "true" : "false"}
        data-blank-state-project-management-hydrated={hydrated ? "true" : "false"}
      >
        <section className="blank-state-focus" aria-labelledby="blank-state-title">
          <p className="blank-state-eyebrow">Blank State</p>
          {view.project_name ? (
            <p className="blank-state-project-context">
              {view.project_context_label} · <strong>{view.project_name}</strong>
            </p>
          ) : null}
          <h1 id="blank-state-title">{view.heading}</h1>
          <p className="blank-state-situation">{view.situation}</p>
          {view.material_note ? (
            <p className="blank-state-material-note">{view.material_note}</p>
          ) : null}
          <PrimaryAction
            action={view.primary_action}
            busy={busy}
            recentEntry={primaryEntry}
            onChoose={() => void choose()}
            onOpen={(entry) => void open(entry)}
            onLocate={(entry) => void locate(entry)}
            onActivate={(projectId) => void activate(projectId)}
          />
          {message ? <p className="blank-state-message" role="status">{message}</p> : null}
        </section>

        {view.current_work ? (
          <section className="blank-state-region" aria-labelledby="current-work-title">
            <div className="blank-state-region-heading">
              <div>
                <p className="blank-state-region-label">Current work</p>
                <h2 id="current-work-title">{view.current_work.status}</h2>
              </div>
            </div>
            {projection?.run_results.current_run ? (
              <article data-current-host-run={projection.run_results.current_run.status}>
                {view.current_work.goal ? <p>{view.current_work.goal}</p> : null}
                <p className="blank-state-meta">
                  {projection.run_results.current_run.reconciliation_required
                    ? "Observation is incomplete; no result is being inferred."
                    : "The host work has not produced a saved result yet."}
                </p>
              </article>
            ) : null}
            {projection?.run_results.latest_result ? (
              <article data-latest-run-result={projection.run_results.latest_result.outcome ?? "unknown"}>
                {view.current_work.result_summary ? <p>{view.current_work.result_summary}</p> : null}
                {projection.run_results.workbench_entry ? (
                  <a
                    className="blank-state-secondary-link"
                    href={projection.run_results.workbench_entry.href}
                    data-review-result-link="true"
                  >
                    Review result
                  </a>
                ) : null}
              </article>
            ) : null}
            {view.current_work.verification ? (
              <p className="blank-state-meta" data-blank-state-verification="true">
                Verification: {view.current_work.verification.passed} passed, {view.current_work.verification.failed} failed, {view.current_work.verification.skipped} skipped.
              </p>
            ) : null}
            {view.current_work.exact_detail_href ? (
              <a className="blank-state-secondary-link" href={view.current_work.exact_detail_href} data-blank-state-exact-detail="true">
                View exact details
              </a>
            ) : null}
          </section>
        ) : null}

        {view.additional_attention.length ? (
          <section className="blank-state-region" aria-labelledby="attention-title">
            <p className="blank-state-region-label">Needs your attention</p>
            <h2 id="attention-title">Other items to review</h2>
            <ul className="blank-state-list">
              {view.additional_attention.map((item) => (
                <li key={item.id}>
                  <strong>{item.summary}</strong>
                  <p>{item.reason}</p>
                  {item.href ? <a href={item.href}>{item.label}</a> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {view.recent_change ? (
          <section className="blank-state-region" aria-labelledby="recent-change-title">
            <p className="blank-state-region-label">Recent meaningful change</p>
            <h2 id="recent-change-title">Since you last looked</h2>
            <p>{view.recent_change.summary}</p>
            <time className="blank-state-meta" dateTime={view.recent_change.occurred_at}>
              {formatTimestamp(view.recent_change.occurred_at)}
            </time>
          </section>
        ) : null}

        {view.project_management_emphasized ? projectManagement : (
          <details className="blank-state-disclosure" data-blank-state-project-management="collapsed">
            <summary>Manage project</summary>
            {projectManagement}
          </details>
        )}

        {projection ? (
          <ProjectOptions
            projection={projection}
            directHostRoundTripAvailable={source.direct_host_round_trip_available}
          />
        ) : null}
      </main>

      <ConfirmationDialog
        open={pendingRebind !== null}
        title={`Move ${pendingRebind?.entry.project.display_name ?? "this project"}?`}
        description="Use the selected folder for this project. Existing repository bindings will not change, and the project will become current."
        confirmLabel="Use this folder"
        busy={busy}
        error={dialogError}
        onCancel={() => {
          setDialogError(null);
          setPendingRebind(null);
        }}
        onConfirm={confirmRebind}
      >
        {pendingRebind ? (
          <dl>
            <div><dt>Previous folder</dt><dd>{pendingRebind.entry.local_root.normalized_path}</dd></div>
            <div><dt>Selected folder</dt><dd>{pendingRebind.chosen.inspection.local_root.normalized_path}</dd></div>
            <div><dt>Repository found</dt><dd>{pendingRebind.chosen.inspection.repository_display ?? "None"}</dd></div>
          </dl>
        ) : null}
      </ConfirmationDialog>
      <ConfirmationDialog
        open={pendingRemoval !== null}
        title={`Remove ${pendingRemoval?.project.display_name ?? "this project"} from recents?`}
        description="This removes the shortcut only. Stored project data and local files are not deleted."
        confirmLabel="Remove from recents"
        tone="attention"
        busy={busy}
        error={dialogError}
        onCancel={() => {
          setDialogError(null);
          setPendingRemoval(null);
        }}
        onConfirm={confirmRemoval}
      />
    </>
  );
}

function PrimaryAction({
  action,
  busy,
  recentEntry,
  onChoose,
  onOpen,
  onLocate,
  onActivate,
}: {
  action: BlankStatePrimaryActionV01;
  busy: boolean;
  recentEntry: RecentProjectEntryV01 | null;
  onChoose: () => void;
  onOpen: (entry: RecentProjectEntryV01) => void;
  onLocate: (entry: RecentProjectEntryV01) => void;
  onActivate: (projectId: string) => void;
}) {
  if (action.kind === "link") {
    return (
      <a
        className="blank-state-primary-action"
        href={action.href}
        data-blank-state-primary-action={action.kind}
        data-workbench-entry-state={action.entry_state ?? undefined}
      >
        {action.label}
      </a>
    );
  }
  const callback = action.kind === "choose_folder"
    ? onChoose
    : action.kind === "make_active"
      ? () => onActivate(action.project_id)
      : recentEntry
        ? action.kind === "open_recent"
          ? () => onOpen(recentEntry)
          : () => onLocate(recentEntry)
        : () => undefined;
  return (
    <button
      type="button"
      className="blank-state-primary-action"
      data-blank-state-primary-action={action.kind}
      onClick={callback}
      disabled={busy || (action.kind !== "choose_folder" && action.kind !== "make_active" && !recentEntry)}
    >
      {busy ? "Working…" : action.label}
    </button>
  );
}

function ProjectManagement({
  recent,
  picker,
  busy,
  message,
  primaryAction,
  onChoose,
  onConfirm,
  onOpen,
  onLocate,
  onRemove,
  onCancelInspection,
}: {
  recent: RecentProjectEntryV01[];
  picker: LocalFolderPickerOutcomeV01 | null;
  busy: boolean;
  message: string | null;
  primaryAction: BlankStatePrimaryActionV01;
  onChoose: () => void;
  onConfirm: () => void;
  onOpen: (entry: RecentProjectEntryV01) => void;
  onLocate: (entry: RecentProjectEntryV01) => void;
  onRemove: (entry: RecentProjectEntryV01) => void;
  onCancelInspection: () => void;
}) {
  return (
    <section id="project-management" className="blank-state-project-management" aria-labelledby="project-management-title" aria-busy={busy}>
      <div className="blank-state-region-heading">
        <div>
          <p className="blank-state-region-label">Project options</p>
          <h2 id="project-management-title">Choose or manage a local project</h2>
        </div>
        {primaryAction.kind !== "choose_folder" ? (
          <button type="button" className="blank-state-secondary-button" onClick={onChoose} disabled={busy}>
            Choose another folder
          </button>
        ) : null}
      </div>
      {message ? <p className="project-selector-message" role="status">{message}</p> : null}
      {picker?.status === "selected" ? (
        <div className="project-inspection" aria-live="polite">
          <p className="blank-state-region-label">Folder found</p>
          <h3>{picker.inspection.display_name}</h3>
          <dl>
            <div><dt>Folder</dt><dd>{picker.inspection.local_root.normalized_path}</dd></div>
            <div><dt>Type</dt><dd>{picker.inspection.folder_kind === "git_repository" ? "Git repository" : "Plain folder"}</dd></div>
            <div><dt>Repository</dt><dd>{picker.inspection.repository_display ?? (picker.inspection.folder_kind === "git_repository" ? "No remote configured" : "Not a repository")}</dd></div>
          </dl>
          {picker.inspection.already_added ? (
            <p className="project-selector-notice">This folder is already added. Confirming will reopen the same project.</p>
          ) : null}
          <p>Confirming makes this the current local project.</p>
          <div className="project-actions">
            <button type="button" className="blank-state-secondary-button" onClick={onConfirm} disabled={busy}>Confirm project</button>
            <button type="button" className="blank-state-tertiary-button" onClick={onCancelInspection} disabled={busy}>Cancel</button>
          </div>
        </div>
      ) : null}

      <div id="recent-projects">
        <h3>Recent projects</h3>
        {recent.length === 0 ? (
          <p className="blank-state-empty">No recent projects yet.</p>
        ) : (
          <ul className="recent-project-list">
            {recent.map((entry) => (
              <li key={entry.project.project_id} className={entry.is_active ? "is-active" : undefined}>
                <div>
                  <strong>{entry.project.display_name ?? "Unnamed project"}</strong>
                  {entry.is_active ? <span className="active-project-badge">Current</span> : null}
                  <p>{entry.local_root.normalized_path}</p>
                  <p className={`root-status root-status--${entry.root_availability}`}>
                    {entry.root_availability === "available" ? "Folder available" : "Folder needs to be located"}
                  </p>
                </div>
                <div className="project-actions">
                  {entry.root_availability === "available" ? (
                    <button type="button" className="blank-state-secondary-button" onClick={() => onOpen(entry)} disabled={busy}>
                      {entry.is_active ? "Open" : "Make current and open"}
                    </button>
                  ) : (
                    <button type="button" className="blank-state-secondary-button" onClick={() => onLocate(entry)} disabled={busy}>Locate folder</button>
                  )}
                  <button type="button" className="blank-state-tertiary-button" onClick={() => onRemove(entry)} disabled={busy}>Remove from recents</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function ProjectOptions({
  projection,
  directHostRoundTripAvailable,
}: {
  projection: NonNullable<BlankStateSourceV01["projection"]>;
  directHostRoundTripAvailable: boolean;
}) {
  const active = projection.project_summary.is_active;
  return (
    <details className="blank-state-disclosure" data-blank-state-project-options="true">
      <summary>Project options</summary>
      <div className="blank-state-options-grid">
        <section aria-labelledby="automation-options-title">
          <h2 id="automation-options-title">Automation</h2>
          <p>{automationSummary(projection.automation.status)}</p>
          <p>{projection.automation.state.message}</p>
          <p className="blank-state-meta">
            {projection.automation.policy_control_eligible ? "Control layer eligible" : "Control layer unavailable"}
            {` · ${projection.automation.admission_status === "grant_required" ? "Admission grant required" : projection.automation.admission_status.replaceAll("_", " ")}`}
          </p>
          <p className="blank-state-meta">{projection.automation.policy_summary.title}</p>
          <ul className="blank-state-compact-list">
            {projection.automation.policy_summary.boundaries.map((boundary) => <li key={boundary}>{publicBlankStateTextV01(boundary)}</li>)}
          </ul>
          {projection.automation.cycle.work_source ? (
            <p className="blank-state-meta">
              Available work: {publicBlankStateTextV01(projection.automation.cycle.work_source.label)} · bounded local verification · model and network denied.
            </p>
          ) : null}
          {projection.automation.cycle.run ? (
            <p className="blank-state-meta" data-blank-state-automation-run={projection.automation.cycle.status}>
              Automated work {projection.automation.cycle.run.status.replaceAll("_", " ")} · attempt {projection.automation.cycle.run.attempt}.
            </p>
          ) : null}
          {projection.automation.cycle.stop_reason ? (
            <p data-blank-state-automation-stop={projection.automation.cycle.stop_reason}>
              Automation stopped: {projection.automation.cycle.stop_reason.replaceAll("_", " ")}.
            </p>
          ) : null}
          {projection.automation.cycle.run?.result_href ? <a href={projection.automation.cycle.run.result_href}>Open automated result</a> : null}
          {projection.automation.cycle.run?.proposal_href ? <a href={projection.automation.cycle.run.proposal_href}>Review suggested change</a> : null}
          {projection.automation.cycle.feedback_href ? <a href={projection.automation.cycle.feedback_href}>Share outcome</a> : null}
          {active ? <a href={projection.automation.inspector_href} data-project-automation-inspector="true">View exact automation details</a> : null}
          <ProjectControls projection={projection} kind="automation" />
        </section>

        <section aria-labelledby="perspective-options-title">
          <h2 id="perspective-options-title">Personal Perspective</h2>
          <p>{personalPerspectiveSummary(projection.personal_perspective.status)}</p>
          <p>{projection.personal_perspective.explanation}</p>
          <p className="blank-state-meta">Task-selected material {projection.personal_perspective.task_selected_count}</p>
          {projection.personal_perspective.task_basis ? (
            <div data-personal-perspective-task-basis="present">
              <p>{projection.personal_perspective.task_basis.selected_count} reviewed items contributed to the current work.</p>
              <ul className="blank-state-compact-list">
                {projection.personal_perspective.task_basis.items.map((item, index) => (
                  <li key={`${item.why_included}:${index}`}>{publicBlankStateTextV01(item.summary ?? "Selected reviewed material")} · {publicBlankStateTextV01(item.why_included)}</li>
                ))}
              </ul>
              {active ? <a href={projection.personal_perspective.task_basis.inspector_href} data-personal-perspective-inspector="true">View exact inclusion details</a> : null}
            </div>
          ) : (
            <p className="blank-state-meta" data-personal-perspective-task-basis="absent">No reviewed Personal Perspective material is shown as part of the current work.</p>
          )}
          <ProjectControls projection={projection} kind="personal_perspective" />
        </section>

        {directHostRoundTripAvailable ? (
          <section aria-labelledby="local-work-controls-title">
            <h2 id="local-work-controls-title">Local work controls</h2>
            <p>Start or control the current repository-owned host work. Results are saved before Augnes treats them as complete.</p>
            <DirectHostRoundTripAction />
          </section>
        ) : null}

        <section aria-labelledby="project-details-title">
          <h2 id="project-details-title">Project details</h2>
          <dl className="blank-state-detail-list">
            <div><dt>Folder</dt><dd>{projection.project_summary.root_binding.local_root.normalized_path}</dd></div>
            <div><dt>Repository</dt><dd>{projection.project_summary.repository?.display ?? "No repository remote"}</dd></div>
          </dl>
          <ul className="blank-state-capabilities">
            {projection.capabilities.items.map((item) => (
              <li key={item.capability}><strong>{capabilityLabel(item.capability)}</strong><span>{item.status.replaceAll("_", " ")}</span></li>
            ))}
          </ul>
        </section>
      </div>
    </details>
  );
}

function primaryRecentEntry(
  action: BlankStatePrimaryActionV01,
  recent: RecentProjectEntryV01[],
): RecentProjectEntryV01 | null {
  if (action.kind !== "open_recent" && action.kind !== "locate_folder") return null;
  return recent.find((entry) => entry.project.project_id === action.project_id) ?? null;
}

function automationSummary(status: string): string {
  if (status === "not_configured" || status === "disabled") return "Automated work is off for this project.";
  if (status === "paused") return "Automated work is paused for new tasks.";
  return "Automated work is available within the saved project limits.";
}

function personalPerspectiveSummary(status: string): string {
  if (status === "included") return "Eligible reviewed Personal Perspective material may be considered for this project.";
  if (status === "excluded") return "Personal Perspective is excluded for this project.";
  return "Personal Perspective is excluded until you choose otherwise.";
}

function capabilityLabel(value: string): string {
  return ({
    openai: "OpenAI",
    codex_native_host: "Codex native host",
    github: "GitHub",
    mcp: "MCP",
    scheduler: "Scheduler",
  } as Record<string, string>)[value] ?? value;
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
