"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { DirectHostRoundTripAction } from "@/components/direct-host-round-trip-action";
import {
  GuideBriefConversation,
  type GuideBriefInteractionHostV01,
} from "@/components/guide/guide-brief-conversation";
import { ProjectControls } from "@/components/project-controls";
import {
  ContinuityPinAction,
  ContinuityPinFeedback,
  MobilePinnedContinuities,
} from "@/components/continuity-pins/continuity-pins-ui";
import {
  blankStatePresentationModeV01,
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
  BlankStatePresentationModeV01,
  BlankStatePrimaryActionV01,
  BlankStateSourceV01,
  BlankStateViewV01,
  ContinuitiesTemporalContextV01,
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
  temporalContext,
  managementSafety,
}: {
  source: BlankStateSourceV01;
  view: BlankStateViewV01;
  guide: ProjectGuideBriefV02;
  temporalContext: ContinuitiesTemporalContextV01;
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
  const [continuityFilter, setContinuityFilter] = useState("");
  const [continuityMode, setContinuityMode] = useState<"all" | "attention">(
    "all",
  );
  const [guideOpen, setGuideOpen] = useState(false);
  const guideDialogRef = useRef<HTMLDialogElement>(null);
  const guideLauncherRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setHydrated(true), []);
  useEffect(() => setRecent(source.recent_projects), [source.recent_projects]);
  useEffect(() => {
    const dialog = guideDialogRef.current;
    if (!dialog) return;
    if (guideOpen && !dialog.open) {
      dialog.showModal();
    } else if (!guideOpen && dialog.open) {
      dialog.close();
    }
  }, [guideOpen]);

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
  const presentationMode = blankStatePresentationModeV01(view);
  const activeContinuities = presentationMode === "active_continuities";
  const projectSelection =
    presentationMode === "local_project_onboarding" ||
    presentationMode === "project_choice";
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
      presentationMode={presentationMode}
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
  const normalizedContinuityFilter = continuityFilter.trim().toLocaleLowerCase();
  const shownContinuityItems = [
    view.highlighted_item,
    ...view.continuity_items,
  ];
  const attentionContinuityCount = shownContinuityItems.filter(
    (item) => item.requires_human_attention,
  ).length;
  const itemMatchesCurrentFilters = (item: BlankStateContinuityItemV01) =>
    (continuityMode === "all" || item.requires_human_attention) &&
    continuityItemMatchesV01(item, normalizedContinuityFilter);
  const highlightedVisible = itemMatchesCurrentFilters(view.highlighted_item);
  const visibleContinuityItems = view.continuity_items.filter((item) =>
    itemMatchesCurrentFilters(item)
  );

  function closeGuide() {
    const dialog = guideDialogRef.current;
    setGuideOpen(false);
    if (dialog?.open) dialog.close();
    window.requestAnimationFrame(() => guideLauncherRef.current?.focus());
  }

  const guideSupportText =
    presentationMode === "active_continuities"
      ? "Get context on the current project and what comes next."
      : presentationMode === "local_project_onboarding" ||
          presentationMode === "project_choice"
        ? "Learn how to begin with a local project."
        : "Get context on this project and the next available step.";
  const guideRailTarget =
    hydrated && typeof document !== "undefined"
      ? document.getElementById("continuities-guide-rail-support")
      : null;
  const guideLauncher = (
    <section
      className="continuities-guide-launcher"
      data-augnes-surface-role={SEMANTIC_SURFACE_ROLE.guideBrief}
      data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.supporting}
    >
      <p className="blank-state-region-label">Contextual support</p>
      <h2>Ask GuideBrief</h2>
      <p>{guideSupportText}</p>
      <button
        ref={guideLauncherRef}
        type="button"
        aria-haspopup="dialog"
        aria-controls="continuities-guide-dialog"
        aria-expanded={guideOpen}
        data-continuities-guidebrief-launcher="true"
        aria-label="Open GuideBrief"
        onClick={() => setGuideOpen(true)}
      >
        <span className="continuities-action-label-full">
          Open GuideBrief
        </span>
        <span
          className="continuities-action-label-compact"
          aria-hidden="true"
        >
          GuideBrief
        </span>
      </button>
    </section>
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
        data-blank-state-presentation={presentationMode}
        data-augnes-surface-role={SEMANTIC_SURFACE_ROLE.blankState}
      >
        <div className="continuities-layout">
          <div className="continuities-workstream">
            <section
              className="blank-state-focus"
              aria-labelledby="blank-state-title"
              data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.situation}
            >
              <h1 id="blank-state-title">Continuities</h1>
              <p className="continuities-tagline">
                Work and perspective you carry forward.
              </p>
              {!projectSelection ? (
                <div className="continuities-current-situation">
                  {view.project_name ? (
                    <p className="blank-state-project-context">
                      {view.project_context_label} ·{" "}
                      <strong>{view.project_name}</strong>
                    </p>
                  ) : null}
                  <div className="continuities-current-situation-copy">
                    <p className="blank-state-region-label">Current situation</p>
                    <h2>{view.heading}</h2>
                    <p className="blank-state-situation">{view.situation}</p>
                  </div>
                  {view.material_note ? (
                    <p
                      className="blank-state-material-note"
                      data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.risk}
                    >
                      {view.material_note}
                    </p>
                  ) : null}
                  {activeContinuities &&
                  view.why_this_is_next.observed.length ? (
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
                            <span>
                              {view.why_this_is_next.inferred[0].caveats[0]}
                            </span>
                          </p>
                        ) : null}
                        {view.why_this_is_next.needs_user_judgment[0] ? (
                          <p>
                            Waiting for your judgment:{" "}
                            {view.why_this_is_next.needs_user_judgment[0]}
                          </p>
                        ) : null}
                        <p>
                          This guidance is read-only and does not make the
                          decision for you.
                        </p>
                      </div>
                    </details>
                  ) : null}
                  {!activeContinuities && view.primary_action ? (
                    <div className="continuities-focused-actions">
                      <PrimaryAction
                        action={view.primary_action}
                        item={view.highlighted_item}
                        busy={busy}
                        recentEntry={primaryEntry}
                        onChoose={() => void choose()}
                        onOpen={(entry) => void open(entry)}
                        onLocate={(entry) => void locate(entry)}
                        onActivate={(projectId) => void activate(projectId)}
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}
              {!projectSelection && message ? (
                <p className="blank-state-message" role="status">
                  {message}
                </p>
              ) : null}
            </section>

            {projectSelection ? projectManagement : null}

            {activeContinuities ? (
              <>
                <ContinuityPinFeedback />
                <MobilePinnedContinuities />

            <div className="continuities-filter-controls">
              <label className="continuities-filter">
                <span className="continuities-visually-hidden">
                  Search shown continuities
                </span>
                <input
                  type="search"
                  value={continuityFilter}
                  onChange={(event) => setContinuityFilter(event.target.value)}
                  placeholder="Search shown continuities"
                  aria-describedby="continuities-filter-boundary"
                  data-continuities-filter="shown-items"
                />
                <small
                  id="continuities-filter-boundary"
                  className="continuities-visually-hidden"
                >
                  Searches this bounded current-project presentation only.
                </small>
              </label>
              <div
                className="continuities-filter-chips"
                aria-label="Filter shown continuities"
              >
                <button
                  type="button"
                  aria-pressed={continuityMode === "all"}
                  data-continuities-filter-chip="all"
                  onClick={() => setContinuityMode("all")}
                >
                  All <span>{shownContinuityItems.length}</span>
                </button>
                <button
                  type="button"
                  aria-pressed={continuityMode === "attention"}
                  data-continuities-filter-chip="attention"
                  onClick={() => setContinuityMode("attention")}
                >
                  Attention <span>{attentionContinuityCount}</span>
                </button>
              </div>
            </div>

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
                  <p className="blank-state-region-label">Continuity stream</p>
                  <h2 id="continuity-list-title">Work carrying forward</h2>
                </div>
                <p
                  className="blank-state-attention-summary"
                  data-blank-state-attention-summary="true"
                >
                  {view.continuity_summary}
                </p>
              </div>
              {highlightedVisible ? (
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
              ) : null}
              {visibleContinuityItems.length ? (
                <ol className="blank-state-continuity-list">
                  {visibleContinuityItems.map((item) => (
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
              {!highlightedVisible && visibleContinuityItems.length === 0 ? (
                <p className="continuities-filter-empty" role="status">
                  No shown continuities match this filter.
                </p>
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
              </>
            ) : null}
          </div>

          {activeContinuities ? (
            <aside
              className="continuities-supporting-rail"
              aria-label="Project temporal context"
            >
              <ContinuitiesTemporalContext view={temporalContext} />
            </aside>
          ) : null}
        </div>

        {guideRailTarget
          ? createPortal(guideLauncher, guideRailTarget)
          : null}

        <dialog
          ref={guideDialogRef}
          id="continuities-guide-dialog"
          className="continuities-guide-dialog"
          aria-labelledby="continuities-guide-title"
          data-continuities-guidebrief-dialog="true"
          onCancel={(event) => {
            event.preventDefault();
            closeGuide();
          }}
          onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            closeGuide();
          }}
          onClose={() => {
            setGuideOpen(false);
            window.requestAnimationFrame(() =>
              guideLauncherRef.current?.focus()
            );
          }}
        >
          <div className="continuities-guide-dialog-heading">
            <div>
              <p className="blank-state-region-label">Current context</p>
              <h2 id="continuities-guide-title">Ask GuideBrief</h2>
            </div>
            <button
              type="button"
              aria-label="Close GuideBrief"
              data-continuities-guidebrief-close="true"
              onClick={closeGuide}
            >
              Close
            </button>
          </div>
          <GuideBriefConversation
            guide={guide}
            surface="blank_state"
            interaction={blankInteraction}
            presentation="embedded"
          />
        </dialog>

        {activeContinuities ? (
          view.project_management_emphasized ? (
            <>
              {projectManagement}
              <ManagementSafety view={managementSafety} />
              {projection ? (
                <ProjectOptions
                  projection={projection}
                  directHostRoundTripAvailable={
                    source.direct_host_round_trip_available
                  }
                />
              ) : null}
            </>
          ) : (
            <details
              className="blank-state-disclosure blank-state-project-settings"
              data-blank-state-project-settings-recovery="true"
              data-augnes-surface-role={SEMANTIC_SURFACE_ROLE.management}
              data-augnes-visual-priority={
                SEMANTIC_VISUAL_PRIORITY.supporting
              }
            >
              <summary>Project settings and recovery</summary>
              <div className="blank-state-project-settings-content">
                {projectManagement}
                <ManagementSafety view={managementSafety} embedded />
                {projection ? (
                  <ProjectOptions
                    projection={projection}
                    directHostRoundTripAvailable={
                      source.direct_host_round_trip_available
                    }
                    embedded
                  />
                ) : null}
              </div>
            </details>
          )
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

function ContinuitiesTemporalContext({
  view,
}: {
  view: ContinuitiesTemporalContextV01;
}) {
  return (
    <section
      className="continuities-temporal-context"
      aria-labelledby="continuities-temporal-title"
      data-continuities-temporal-context={view.temporal_context_version}
      data-continuities-temporal-projection-only={String(view.projection_only)}
      data-continuities-temporal-semantic-authority={String(
        view.semantic_authority_granted,
      )}
      data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.supporting}
    >
      <p className="blank-state-region-label">Project context</p>
      <h2 id="continuities-temporal-title">Recent and next</h2>
      <p className="continuities-temporal-intro">
        Source-backed movement around the current project. No future time is
        inferred.
      </p>
      <div className="continuities-temporal-track">
        <div className="continuities-temporal-group">
          <p className="continuities-temporal-label">Next</p>
          {view.next_items.length ? (
            <ol>
              {view.next_items.map((item) => (
                <li key={item.item_id}>
                  <span aria-hidden="true" />
                  <div>
                    {item.href ? (
                      <a
                        className="continuities-temporal-title"
                        href={item.href}
                        title={item.label}
                      >
                        {item.label}
                      </a>
                    ) : (
                      <strong
                        className="continuities-temporal-title"
                        title={item.label}
                      >
                        {item.label}
                      </strong>
                    )}
                    <p>{item.reason}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="continuities-temporal-empty">
              No next action is asserted by the current source.
            </p>
          )}
        </div>
        <div className="continuities-temporal-now">
          <span aria-hidden="true" />
          <div>
            <p className="continuities-temporal-label">Now</p>
            <strong>{view.current.label}</strong>
            <p>{view.current.summary}</p>
          </div>
        </div>
        <div className="continuities-temporal-group">
          <p className="continuities-temporal-label">Recent</p>
          {view.recent_items.length ? (
            <ol>
              {view.recent_items.map((item) => (
                <li key={item.item_id}>
                  <span aria-hidden="true" />
                  <div>
                    {item.href ? (
                      <a
                        className="continuities-temporal-title"
                        href={item.href}
                        title={item.summary}
                      >
                        {item.summary}
                      </a>
                    ) : (
                      <strong
                        className="continuities-temporal-title"
                        title={item.summary}
                      >
                        {item.summary}
                      </strong>
                    )}
                    <time dateTime={item.occurred_at}>
                      {formatTimestamp(item.occurred_at)}
                    </time>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="continuities-temporal-empty">
              No source-backed recent change is available in this projection.
            </p>
          )}
        </div>
      </div>
    </section>
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
      data-continuities-recommended={highlighted ? "true" : "false"}
      data-continuities-tone={continuityToneV01(item)}
      data-delegated-work-summary={delegatedStage}
      data-current-host-run={currentRunStatus}
      data-latest-run-result={resultOutcome}
    >
      {highlighted ? (
        <p className="continuities-recommendation-label">
          Recommended next
        </p>
      ) : null}
      <div className="continuities-item-row">
        <span className="continuities-item-indicator" aria-hidden="true" />
        <div className="continuities-item-copy">
          <p
            className={
              item.requires_human_attention
                ? "blank-state-attention-label blank-state-attention-label--required"
                : "blank-state-attention-label"
            }
          >
            {attentionLabel}
          </p>
          <h3 title={item.work_name}>{item.work_name}</h3>
          <p
            className="blank-state-continuity-state"
            title={item.meaningful_state}
          >
            {item.meaningful_state}
          </p>
        </div>
        <div className="continuities-item-entry">
          {item.last_meaningful_change ? (
            <time dateTime={item.last_meaningful_change.occurred_at}>
              {formatTimestamp(item.last_meaningful_change.occurred_at)}
            </time>
          ) : null}
          {highlighted && primaryAction ? (
            <div className="blank-state-continuity-actions">
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
            </div>
          ) : secondaryAction ? (
            <a
              className="blank-state-secondary-link"
              href={secondaryAction.href}
              aria-label={secondaryAction.label}
              data-blank-state-delegated-work-link={
                item.source_family === "delegated_work" ? "true" : undefined
              }
              data-review-result-link={isResultItem ? "true" : undefined}
            >
              <span className="continuities-action-label-full">
                {secondaryAction.label}
              </span>
              <span
                className="continuities-action-label-compact"
                aria-hidden="true"
              >
                Open
              </span>
            </a>
          ) : null}
        </div>
      </div>
      {item.consequential_detail ||
      item.last_meaningful_change ||
      item.verification ||
      item.pinning.status ||
      (highlighted && secondaryAction) ||
      (item.exact_detail_href &&
        item.exact_detail_href !== secondaryAction?.href) ? (
        <details className="continuities-item-details">
          <summary>More context</summary>
          <div>
            {item.consequential_detail ? (
              <p className="blank-state-continuity-detail">
                {item.consequential_detail}
              </p>
            ) : null}
            {item.last_meaningful_change ? (
              <p className="blank-state-continuity-change">
                <span>Meaningfully changed</span>{" "}
                {item.last_meaningful_change.summary}{" "}
                <time dateTime={item.last_meaningful_change.occurred_at}>
                  {formatTimestamp(item.last_meaningful_change.occurred_at)}
                </time>
              </p>
            ) : null}
            {item.verification ? (
              <p
                className="blank-state-meta"
                data-blank-state-verification="true"
              >
                Verification: {item.verification.passed} passed,{" "}
                {item.verification.failed} failed,{" "}
                {item.verification.skipped} skipped.
              </p>
            ) : null}
            {highlighted && secondaryAction ? (
              <a
                className="blank-state-secondary-link"
                href={secondaryAction.href}
                aria-label={secondaryAction.label}
                data-blank-state-delegated-work-link={
                  item.source_family === "delegated_work" ? "true" : undefined
                }
                data-review-result-link={isResultItem ? "true" : undefined}
              >
                <span className="continuities-action-label-full">
                  {secondaryAction.label}
                </span>
                <span
                  className="continuities-action-label-compact"
                  aria-hidden="true"
                >
                  Open
                </span>
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
            <ContinuityPinAction item={item} />
          </div>
        </details>
      ) : null}
    </article>
  );
}

function ManagementSafety({
  view,
  embedded = false,
}: {
  view: ManagementSafetyViewV01;
  embedded?: boolean;
}) {
  const items = [
    view.project_management,
    view.project_transfer,
    view.local_recovery,
  ];
  const content = (
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
  );
  if (embedded) {
    return (
      <section
        className="blank-state-management-section"
        aria-labelledby="management-safety-title"
        data-management-safety={view.view_version}
        data-management-safety-project-context={view.project_context}
        data-augnes-surface-role={SEMANTIC_SURFACE_ROLE.management}
        data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.supporting}
      >
        <h2 id="management-safety-title">Management and safety</h2>
        {content}
      </section>
    );
  }
  return (
    <details
      className="blank-state-disclosure"
      data-management-safety={view.view_version}
      data-management-safety-project-context={view.project_context}
      data-augnes-surface-role={SEMANTIC_SURFACE_ROLE.management}
      data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.supporting}
    >
      <summary>Manage and protect</summary>
      {content}
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
        aria-label={action.label}
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
        <span className="continuities-action-label-full">{action.label}</span>
        <span
          className="continuities-action-label-compact"
          aria-hidden="true"
        >
          Open
        </span>
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
      aria-label={busy ? "Working…" : action.label}
      data-blank-state-primary-action={action.kind}
      data-augnes-primary-action={action.kind}
      data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.primaryAction}
      onClick={callback}
      disabled={busy || (action.kind !== "choose_folder" && action.kind !== "make_active" && !recentEntry)}
    >
      {busy ? (
        "Working…"
      ) : (
        <>
          <span className="continuities-action-label-full">{action.label}</span>
          <span
            className="continuities-action-label-compact"
            aria-hidden="true"
          >
            {action.kind === "choose_folder"
              ? "Choose"
              : action.kind === "locate_folder"
                ? "Locate"
                : action.kind === "make_active"
                  ? "Activate"
                  : "Open"}
          </span>
        </>
      )}
    </button>
  );
}

function ProjectManagement({
  presentationMode,
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
  presentationMode: BlankStatePresentationModeV01;
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
  const onboarding = presentationMode === "local_project_onboarding";
  const choosingProject = presentationMode === "project_choice";
  const selectedFolder = picker?.status === "selected";
  return (
    <section
      id="project-management"
      className={
        onboarding || choosingProject
          ? "blank-state-project-management blank-state-project-management--focused"
          : "blank-state-project-management"
      }
      aria-labelledby="project-management-title"
      aria-busy={busy}
      data-project-selection-presentation={presentationMode}
      data-augnes-surface-role={SEMANTIC_SURFACE_ROLE.management}
      data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.supporting}
    >
      <div className="blank-state-region-heading">
        <div>
          <p className="blank-state-region-label">
            {onboarding ? "Local project" : "Project options"}
          </p>
          <h2 id="project-management-title">
            {onboarding
              ? "Open a local project folder"
              : choosingProject
                ? "Choose a local project"
                : "Choose or manage a local project"}
          </h2>
        </div>
        {!onboarding && primaryAction?.kind !== "choose_folder" ? (
          <button type="button" className="blank-state-secondary-button" onClick={onChoose} disabled={busy}>
            Choose another folder
          </button>
        ) : null}
      </div>
      {onboarding ? (
        <div className="project-onboarding-copy">
          <p id="local-project-onboarding-description">
            Select an existing folder on this computer. Augnes links it as the
            local project root; this step does not upload the folder.
          </p>
          <p id="local-project-onboarding-support">
            Use a regular folder or a Git repository.
          </p>
          <p id="local-project-onboarding-cancellation">
            Cancelling the folder picker leaves the workspace unchanged.
          </p>
          {!selectedFolder ? (
            <button
              type="button"
              className="blank-state-primary-action project-onboarding-action"
              aria-label={busy ? "Working…" : "Choose a folder"}
              aria-describedby={[
                "local-project-onboarding-description",
                "local-project-onboarding-support",
                "local-project-onboarding-cancellation",
              ].join(" ")}
              data-blank-state-primary-action="choose_folder"
              data-augnes-primary-action="choose_folder"
              data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.primaryAction}
              onClick={onChoose}
              disabled={busy}
            >
              {busy ? "Working…" : "Choose a folder"}
            </button>
          ) : null}
        </div>
      ) : null}
      {message ? <p className="project-selector-message" role="status">{message}</p> : null}
      {selectedFolder ? (
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
            <button
              type="button"
              className="blank-state-primary-action"
              data-blank-state-primary-action="confirm_folder"
              data-augnes-primary-action="confirm_folder"
              data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.primaryAction}
              onClick={onConfirm}
              disabled={busy}
            >
              {busy ? "Working…" : "Use this folder"}
            </button>
            <button type="button" className="blank-state-tertiary-button" onClick={onCancelInspection} disabled={busy}>Cancel</button>
          </div>
        </div>
      ) : null}

      {!onboarding || recent.length > 0 ? (
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
                    <button
                      type="button"
                      className="blank-state-secondary-button"
                      data-blank-state-primary-action={
                        !selectedFolder &&
                        primaryAction?.kind === "open_recent" &&
                        primaryAction.project_id === entry.project.project_id
                          ? "open_recent"
                          : undefined
                      }
                      data-augnes-primary-action={
                        !selectedFolder &&
                        primaryAction?.kind === "open_recent" &&
                        primaryAction.project_id === entry.project.project_id
                          ? "open_recent"
                          : undefined
                      }
                      onClick={() => onOpen(entry)}
                      disabled={busy}
                    >
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
      ) : null}
    </section>
  );
}

function ProjectOptions({
  projection,
  directHostRoundTripAvailable,
  embedded = false,
}: {
  projection: NonNullable<BlankStateSourceV01["projection"]>;
  directHostRoundTripAvailable: boolean;
  embedded?: boolean;
}) {
  const active = projection.project_summary.is_active;
  const content = (
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
  );
  if (embedded) {
    return (
      <section
        className="blank-state-management-section blank-state-management-section--technical"
        aria-labelledby="project-options-title"
        data-blank-state-project-options="true"
        data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.rawRecord}
      >
        <h2 id="project-options-title">Project options</h2>
        {content}
      </section>
    );
  }
  return (
    <details
      className="blank-state-disclosure"
      data-blank-state-project-options="true"
      data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.rawRecord}
    >
      <summary>Project options</summary>
      {content}
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

function continuityItemMatchesV01(
  item: BlankStateContinuityItemV01,
  normalizedFilter: string,
): boolean {
  if (!normalizedFilter) return true;
  return [
    item.work_name,
    item.meaningful_state,
    item.last_meaningful_change?.summary,
    item.consequential_detail,
  ].some((value) => value?.toLocaleLowerCase().includes(normalizedFilter));
}

function continuityToneV01(
  item: BlankStateContinuityItemV01,
): "amber" | "blue" | "quiet" {
  if (item.requires_human_attention) return "amber";
  if (item.source_family === "recent_change") return "quiet";
  return "blue";
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
