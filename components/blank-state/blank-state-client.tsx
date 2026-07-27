"use client";

import { useEffect, useMemo, useState } from "react";

import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { DirectHostRoundTripAction } from "@/components/direct-host-round-trip-action";
import {
  GuideBriefConversation,
  type GuideBriefInteractionHostV01,
} from "@/components/guide/guide-brief-conversation";
import { ProjectControls } from "@/components/project-controls";
import {
  blankStateAttentionLabelV01,
  publicBlankStateTextV01,
} from "@/lib/vnext/blank-state/blank-state-view";
import {
  createOpaqueGuideBriefInteractionTargetHandleV01,
} from "@/lib/vnext/guide-brief/guide-brief-interaction-plan";
import {
  buildGuideBriefConversationScopeKeyV01,
} from "@/lib/vnext/guide-brief/guide-brief-conversation-plan";
import {
  SEMANTIC_SURFACE_ROLE,
  SEMANTIC_VISUAL_PRIORITY,
} from "@/lib/vnext/semantic-visual/semantic-visual-contract";
import type {
  BlankStateContinuityItemV01,
  BlankStatePrimaryActionV01,
  BlankStateSourceV01,
  BlankStateViewV01,
} from "@/types/vnext/blank-state";
import type {
  LocalFolderPickerOutcomeV01,
  RecentProjectEntryV01,
} from "@/types/vnext/project-onboarding";
import type { ProjectGuideBriefV02 } from "@/types/vnext/guide-brief";
import type { ManagementSafetyViewV01 } from "@/types/vnext/management-safety";

type SelectedFolder = Extract<LocalFolderPickerOutcomeV01, { status: "selected" }>;

export function BlankStateClient({
  source,
  view,
  guide,
  managementSafety,
}: {
  source: BlankStateSourceV01;
  view: BlankStateViewV01;
  guide: ProjectGuideBriefV02;
  managementSafety: ManagementSafetyViewV01;
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
  const blankInteraction = useMemo<GuideBriefInteractionHostV01>(() => {
    const scopeKey = buildGuideBriefConversationScopeKeyV01({
      guide,
      question: "",
      conversation_context: null,
    });
    const exactDestination =
      view.primary_action?.kind === "link"
        ? view.primary_action.href
        : null;
    const targetHandle =
      exactDestination === null
          ? null
          : createOpaqueGuideBriefInteractionTargetHandleV01([
            guide.identity.workspace_id ?? "no-workspace",
            guide.identity.project_id ?? "no-project",
            scopeKey,
            exactDestination,
          ]);
    return {
      context: {
        pc4_scope_key: scopeKey,
        workspace_id: guide.identity.workspace_id,
        project_id: guide.identity.project_id,
        project_context: guide.identity.project_context,
        active_project_id: guide.identity.active_project_id,
        proposal_id: null,
        proposal_fingerprint: null,
        candidate_id: null,
        candidate_fingerprint: null,
        pc2: null,
        pc3: null,
        owner_state: {
          busy,
          decision_applying_kind: null,
          decision_eligible: false,
          transition_preview_available: false,
        },
      },
      capabilities:
        exactDestination && targetHandle
          ? [{
              capability_version: "browser_action_capability.v0.1",
              action_key: "surface.open_current_action",
              target_handle: targetHandle,
              public_label: "Take me to the current action",
              public_effect_preview:
                "Open the exact current destination without activating its action.",
              owner: "pc2_current_action_surface",
              effect_class: "navigation",
              availability: busy ? "blocked" : "available",
              unavailable_reason: busy
                ? "The current action owner is busy."
                : null,
              interaction_scope_key: scopeKey,
              owner_actionability_identity: [
                view.primary_action?.kind,
                exactDestination,
                busy ? "busy" : "available",
              ].join(":"),
              confirmation_policy: "immediate_current_scope",
              destination: exactDestination,
              may_propose: !busy,
              may_execute_immediately: !busy,
              route_key: "current_action",
              target_scope: {
                workspace_id: guide.identity.workspace_id,
                project_id: guide.identity.project_id,
                proposal_id: null,
                proposal_fingerprint: null,
                candidate_id: null,
                candidate_fingerprint: null,
              },
              authority: {
                projection_only: true,
                durable: false,
                semantic_authority: false,
                transition_authority: false,
                execution_authority: false,
                external_action_authority: false,
              },
            }]
          : [],
      adapters:
        exactDestination && targetHandle
          ? [{
              action_key: "surface.open_current_action",
              target_handle: targetHandle,
              owner: "pc2_current_action_surface",
              effect_class: "navigation",
              invoke: async () => {
                window.location.assign(exactDestination);
                return {
                  status: "completed",
                  public_observed_effect:
                    "The existing current-action destination is now open. No project action was performed.",
                  durable_state_changed: false,
                  exact_result_ref: null,
                };
              },
            }]
          : [],
    };
  }, [busy, guide, view.primary_action]);
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
        data-guide-brief-version={guide.guide_version}
        data-guide-brief-source-status={guide.source_status}
        data-guide-brief-project-context={guide.identity.project_context}
        data-blank-state-active={projection?.project_summary.is_active ? "true" : "false"}
        data-blank-state-project-management-hydrated={hydrated ? "true" : "false"}
        data-augnes-surface-role={SEMANTIC_SURFACE_ROLE.blankState}
      >
        <section
          className="blank-state-focus"
          aria-labelledby="blank-state-title"
          data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.situation}
        >
          <p className="blank-state-eyebrow">Blank State</p>
          {view.project_name ? (
            <p className="blank-state-project-context">
              {view.project_context_label} · <strong>{view.project_name}</strong>
            </p>
          ) : null}
          <h1 id="blank-state-title">{view.heading}</h1>
          <p className="blank-state-situation">{view.situation}</p>
          {view.material_note ? (
            <p
              className="blank-state-material-note"
              data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.risk}
            >
              {view.material_note}
            </p>
          ) : null}
          {view.why_this_is_next.observed.length ? (
            <details
              className="blank-state-guide-disclosure"
              data-guide-brief-disclosure="v0.2"
              data-augnes-surface-role={SEMANTIC_SURFACE_ROLE.guideBrief}
              data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.aiSummary}
            >
              <summary>Why this is next</summary>
              <div>
                <p>{view.why_this_is_next.observed[0]}</p>
                {view.why_this_is_next.inferred[0] ? (
                  <p>
                    {view.why_this_is_next.inferred[0].statement}{" "}
                    <span>{view.why_this_is_next.inferred[0].caveats[0]}</span>
                  </p>
                ) : null}
                {view.why_this_is_next.needs_user_judgment[0] ? (
                  <p>Waiting for your judgment: {view.why_this_is_next.needs_user_judgment[0]}</p>
                ) : null}
                <p>This guidance is read-only and does not make the decision for you.</p>
              </div>
            </details>
          ) : null}
          {message ? <p className="blank-state-message" role="status">{message}</p> : null}
        </section>

        <section
          className="blank-state-continuity"
          aria-labelledby="continuity-list-title"
          data-blank-state-continuity-list="v0.1"
          data-blank-state-known-attention-count={view.known_attention_count}
          data-blank-state-attention-count-status={view.attention_count_status}
          data-blank-state-source-omitted-attention-count={
            view.source_omitted_attention_count ?? "unknown"
          }
          data-augnes-independent-surface="continuous-work"
          data-augnes-visual-priority={
            view.known_attention_count > 0 ||
            (view.source_omitted_attention_count ?? 0) > 0
              ? SEMANTIC_VISUAL_PRIORITY.risk
              : SEMANTIC_VISUAL_PRIORITY.aiSummary
          }
        >
          <div className="blank-state-continuity-heading">
            <div>
              <p className="blank-state-region-label">Continuous work</p>
              <h2 id="continuity-list-title">What is happening now</h2>
            </div>
            <p
              className="blank-state-attention-summary"
              data-blank-state-attention-summary="true"
            >
              {view.continuity_summary}
            </p>
          </div>
          <ContinuityItem
            item={view.highlighted_item}
            highlighted
            source={source}
            primaryAction={view.primary_action}
            primaryEntry={primaryEntry}
            busy={busy}
            onChoose={() => void choose()}
            onOpen={(entry) => void open(entry)}
            onLocate={(entry) => void locate(entry)}
            onActivate={(projectId) => void activate(projectId)}
          />
          {view.continuity_items.length ? (
            <ol className="blank-state-continuity-list">
              {view.continuity_items.map((item) => (
                <li key={item.item_id}>
                  <ContinuityItem
                    item={item}
                    highlighted={false}
                    source={source}
                    primaryAction={null}
                    primaryEntry={null}
                    busy={busy}
                    onChoose={() => void choose()}
                    onOpen={(entry) => void open(entry)}
                    onLocate={(entry) => void locate(entry)}
                    onActivate={(projectId) => void activate(projectId)}
                  />
                </li>
              ))}
            </ol>
          ) : null}
          {view.locally_omitted_item_count > 0 ? (
            <p className="blank-state-meta">
              {view.locally_omitted_item_count} additional{" "}
              {view.locally_omitted_item_count === 1 ? "item is" : "items are"}{" "}
              available from the existing project destinations.
            </p>
          ) : null}
          {view.source_attention_destination &&
          view.attention_count_status !== "complete" ? (
            <p
              className="blank-state-meta"
              data-blank-state-source-attention-omitted="true"
            >
              {view.attention_count_status === "lower_bound" &&
              view.source_omitted_attention_count !== null
                ? `${view.source_omitted_attention_count} additional project ${
                    view.source_omitted_attention_count === 1
                      ? "attention item exists"
                      : "attention items exist"
                  } outside this view. `
                : "Additional project attention may exist outside this view. "}
              <a href={view.source_attention_destination.href}>
                {view.source_attention_destination.label}
              </a>
            </p>
          ) : null}
        </section>

        <GuideBriefConversation
          guide={guide}
          surface="blank_state"
          interaction={blankInteraction}
        />

        {view.project_management_emphasized ? projectManagement : (
          <details className="blank-state-disclosure" data-blank-state-project-management="collapsed">
            <summary>Manage project</summary>
            {projectManagement}
          </details>
        )}

        <ManagementSafety view={managementSafety} />

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

function ContinuityItem({
  item,
  highlighted,
  source,
  primaryAction,
  primaryEntry,
  busy,
  onChoose,
  onOpen,
  onLocate,
  onActivate,
}: {
  item: BlankStateContinuityItemV01;
  highlighted: boolean;
  source: BlankStateSourceV01;
  primaryAction: BlankStatePrimaryActionV01 | null;
  primaryEntry: RecentProjectEntryV01 | null;
  busy: boolean;
  onChoose: () => void;
  onOpen: (entry: RecentProjectEntryV01) => void;
  onLocate: (entry: RecentProjectEntryV01) => void;
  onActivate: (projectId: string) => void;
}) {
  const delegatedStage = item.source_family === "delegated_work"
    ? source.delegated_work?.stage
    : undefined;
  const currentRunStatus = item.source_family === "current_run"
    ? source.projection?.run_results.current_run?.status
    : undefined;
  const resultEntryHref =
    source.projection?.run_results.workbench_entry?.href ?? null;
  const itemDestination =
    item.next_action?.kind === "link"
      ? item.next_action.href
      : item.secondary_action?.href ?? null;
  const isResultItem = item.source_family === "saved_result" ||
    (delegatedStage === "result_ready") ||
    Boolean(resultEntryHref && resultEntryHref === itemDestination);
  const resultOutcome = isResultItem
    ? source.projection?.run_results.latest_result?.outcome ?? "unknown"
    : undefined;
  const secondaryAction =
    item.secondary_action ??
    (!highlighted && item.next_action?.kind === "link"
      ? {
          label: item.next_action.label,
          href: item.next_action.href,
        }
      : null);
  const attentionLabel = blankStateAttentionLabelV01(item);

  return (
    <article
      className={
        highlighted
          ? "blank-state-continuity-item blank-state-continuity-item--highlighted"
          : "blank-state-continuity-item"
      }
      data-blank-state-continuity-item={item.item_id}
      data-blank-state-continuity-highlighted={highlighted ? "true" : "false"}
      data-blank-state-human-attention={
        item.requires_human_attention ? "true" : "false"
      }
      data-blank-state-attention-category={item.attention_category ?? "none"}
      data-delegated-work-summary={delegatedStage}
      data-current-host-run={currentRunStatus}
      data-latest-run-result={resultOutcome}
    >
      <p
        className={
          item.requires_human_attention
            ? "blank-state-attention-label blank-state-attention-label--required"
            : "blank-state-attention-label"
        }
      >
        {attentionLabel}
      </p>
      <h3>{item.work_name}</h3>
      <p className="blank-state-continuity-state">{item.meaningful_state}</p>
      {item.last_meaningful_change ? (
        <p className="blank-state-continuity-change">
          <span>Meaningfully changed</span>{" "}
          {item.last_meaningful_change.summary}{" "}
          <time dateTime={item.last_meaningful_change.occurred_at}>
            {formatTimestamp(item.last_meaningful_change.occurred_at)}
          </time>
        </p>
      ) : null}
      {item.consequential_detail ? (
        <p className="blank-state-continuity-detail">
          {item.consequential_detail}
        </p>
      ) : null}
      {item.verification ? (
        <p className="blank-state-meta" data-blank-state-verification="true">
          Verification: {item.verification.passed} passed,{" "}
          {item.verification.failed} failed, {item.verification.skipped} skipped.
        </p>
      ) : null}
      <div className="blank-state-continuity-actions">
        {highlighted && primaryAction ? (
          <PrimaryAction
            action={primaryAction}
            item={item}
            busy={busy}
            recentEntry={primaryEntry}
            onChoose={onChoose}
            onOpen={onOpen}
            onLocate={onLocate}
            onActivate={onActivate}
          />
        ) : null}
        {secondaryAction ? (
          <a
            className="blank-state-secondary-link"
            href={secondaryAction.href}
            data-blank-state-delegated-work-link={
              item.source_family === "delegated_work" ? "true" : undefined
            }
            data-review-result-link={isResultItem ? "true" : undefined}
          >
            {secondaryAction.label}
          </a>
        ) : null}
        {item.exact_detail_href &&
        item.exact_detail_href !== secondaryAction?.href ? (
          <a
            className="blank-state-exact-detail-link"
            href={item.exact_detail_href}
            data-blank-state-exact-detail="true"
          >
            View exact details
          </a>
        ) : null}
      </div>
    </article>
  );
}

function ManagementSafety({
  view,
}: {
  view: ManagementSafetyViewV01;
}) {
  const items = [
    view.project_management,
    view.project_transfer,
    view.local_recovery,
  ];
  return (
    <details
      className="blank-state-disclosure"
      data-management-safety={view.view_version}
      data-management-safety-project-context={view.project_context}
      data-augnes-surface-role={SEMANTIC_SURFACE_ROLE.management}
      data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.supporting}
    >
      <summary>Manage and protect</summary>
      <div className="blank-state-management-safety">
        <p>
          Move local project continuity or review application-data safety
          without changing the current work.
        </p>
        <ul>
          {items.map((item) => (
            <li key={item.kind}>
              <a href={item.href}>{item.label}</a>
              <p>{item.summary}</p>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}

function PrimaryAction({
  action,
  item,
  busy,
  recentEntry,
  onChoose,
  onOpen,
  onLocate,
  onActivate,
}: {
  action: BlankStatePrimaryActionV01;
  item: BlankStateContinuityItemV01;
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
        data-blank-state-delegated-work-link={
          item.source_family === "delegated_work" ? "true" : undefined
        }
        data-review-result-link={
          item.attention_category === "result_review" ? "true" : undefined
        }
        data-augnes-primary-action={action.kind}
        data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.primaryAction}
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
      data-augnes-primary-action={action.kind}
      data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.primaryAction}
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
  primaryAction: BlankStatePrimaryActionV01 | null;
  onChoose: () => void;
  onConfirm: () => void;
  onOpen: (entry: RecentProjectEntryV01) => void;
  onLocate: (entry: RecentProjectEntryV01) => void;
  onRemove: (entry: RecentProjectEntryV01) => void;
  onCancelInspection: () => void;
}) {
  return (
    <section
      id="project-management"
      className="blank-state-project-management"
      aria-labelledby="project-management-title"
      aria-busy={busy}
      data-augnes-surface-role={SEMANTIC_SURFACE_ROLE.management}
      data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.supporting}
    >
      <div className="blank-state-region-heading">
        <div>
          <p className="blank-state-region-label">Project options</p>
          <h2 id="project-management-title">Choose or manage a local project</h2>
        </div>
        {primaryAction?.kind !== "choose_folder" ? (
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
                  {entry.is_active ? (
                    <span
                      className="active-project-badge"
                      data-augnes-state-badge="current-project"
                    >
                      Current
                    </span>
                  ) : null}
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
    <details
      className="blank-state-disclosure"
      data-blank-state-project-options="true"
      data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.rawRecord}
    >
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
          {active && projection.automation.inspector_href ? <a href={projection.automation.inspector_href} data-project-automation-inspector="true">View exact automation details</a> : null}
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
            <h2 id="local-work-controls-title">Advanced local test work</h2>
            <p>
              Run the deterministic compatibility check. Live Codex work,
              progress, approval, cancellation, and resume are owned by AI
              Workplane.
            </p>
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
  action: BlankStatePrimaryActionV01 | null,
  recent: RecentProjectEntryV01[],
): RecentProjectEntryV01 | null {
  if (!action || (action.kind !== "open_recent" && action.kind !== "locate_folder")) return null;
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
