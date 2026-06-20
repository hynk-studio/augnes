"use client";

import type { DraftLabelEditState } from "@/components/research-candidate-preview-draft-label-controls";
import type { DraftListControls } from "@/components/research-candidate-preview-draft-list-panel";
import {
  MANUAL_NOTE_PREVIEW_DRAFTS_ROUTE,
  MANUAL_NOTE_PREVIEW_ROUTE,
  MAX_MANUAL_NOTE_PREVIEW_DRAFT_LABEL_LENGTH,
  buildManualNotePreviewDraftActivityRoute,
  buildManualNotePreviewDraftDetailRoute,
  buildManualNotePreviewDraftDiscardRoute,
  buildManualNotePreviewDraftLabelRoute,
  buildManualNotePreviewDraftPromotionDryRunPlanRoute,
  buildManualNotePreviewDraftPromotionReadinessRoute,
  type ManualNotePreviewDraftActivityResponse,
  type ManualNotePreviewDraftCandidateFilter,
  type ManualNotePreviewDraftDetailOkResponse,
  type ManualNotePreviewDraftDetailResponse,
  type ManualNotePreviewDraftDiscardResponse,
  type ManualNotePreviewDraftLabelUpdateResponse,
  type ManualNotePreviewDraftListLifecycleFilter,
  type ManualNotePreviewDraftListItem,
  type ManualNotePreviewDraftListResponse,
  type ManualNotePreviewDraftListSummary,
  type ManualNotePreviewDraftListSort,
  type ManualNotePreviewDraftPromotionDryRunPlanResponse,
  type ManualNotePreviewDraftPromotionReadinessResponse,
  type ManualNotePreviewDraftWarningFilter,
  type ManualNotePreviewRuntimeOkResponse,
  type ManualNotePreviewRuntimeResponse,
} from "@/lib/research-candidate-review/manual-note-runtime-preview";
import { useState } from "react";

type CreateRuntimePreviewDraftInput = {
  manualNoteText: string;
  operatorPreviewLabel: string;
};

function buildDraftListControls(
  baseControls: DraftListControls,
  overrides: Partial<DraftListControls>,
) {
  return {
    lifecycle: overrides.lifecycle ?? baseControls.lifecycle,
    sort: overrides.sort ?? baseControls.sort,
    warnings: overrides.warnings ?? baseControls.warnings,
    candidates: overrides.candidates ?? baseControls.candidates,
    limit: overrides.limit ?? baseControls.limit,
  } satisfies DraftListControls;
}

export function useResearchCandidateManualNotePreviewRuntime() {
  const [runtimeResult, setRuntimeResult] =
    useState<ManualNotePreviewRuntimeOkResponse | null>(null);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [isRuntimeLoading, setIsRuntimeLoading] = useState(false);
  const [previewDraftItems, setPreviewDraftItems] = useState<
    ManualNotePreviewDraftListItem[]
  >([]);
  const [previewDraftListSummary, setPreviewDraftListSummary] =
    useState<ManualNotePreviewDraftListSummary | null>(null);
  const [draftLifecycleFilter, setDraftLifecycleFilter] =
    useState<ManualNotePreviewDraftListLifecycleFilter>("active");
  const [draftSort, setDraftSort] =
    useState<ManualNotePreviewDraftListSort>("created_desc");
  const [draftWarningFilter, setDraftWarningFilter] =
    useState<ManualNotePreviewDraftWarningFilter>("all");
  const [draftCandidateFilter, setDraftCandidateFilter] =
    useState<ManualNotePreviewDraftCandidateFilter>("all");
  const [draftListLimit, setDraftListLimit] =
    useState<DraftListControls["limit"]>(10);
  const [previewDraftsError, setPreviewDraftsError] = useState<string | null>(
    null,
  );
  const [isPreviewDraftsLoading, setIsPreviewDraftsLoading] = useState(false);
  const [openedPreviewDraft, setOpenedPreviewDraft] =
    useState<ManualNotePreviewDraftDetailOkResponse | null>(null);
  const [previewDraftActivity, setPreviewDraftActivity] =
    useState<ManualNotePreviewDraftActivityResponse | null>(null);
  const [previewDraftActivityError, setPreviewDraftActivityError] = useState<
    string | null
  >(null);
  const [loadingPreviewDraftActivityId, setLoadingPreviewDraftActivityId] =
    useState<string | null>(null);
  const [promotionReadinessPreflight, setPromotionReadinessPreflight] =
    useState<ManualNotePreviewDraftPromotionReadinessResponse | null>(null);
  const [
    promotionReadinessPreflightError,
    setPromotionReadinessPreflightError,
  ] = useState<string | null>(null);
  const [
    loadingPromotionReadinessPreflightId,
    setLoadingPromotionReadinessPreflightId,
  ] = useState<string | null>(null);
  const [promotionDryRunPlan, setPromotionDryRunPlan] =
    useState<ManualNotePreviewDraftPromotionDryRunPlanResponse | null>(null);
  const [promotionDryRunPlanError, setPromotionDryRunPlanError] = useState<
    string | null
  >(null);
  const [loadingPromotionDryRunPlanId, setLoadingPromotionDryRunPlanId] =
    useState<string | null>(null);
  const [openingPreviewDraftId, setOpeningPreviewDraftId] = useState<
    string | null
  >(null);
  const [discardingPreviewDraftId, setDiscardingPreviewDraftId] = useState<
    string | null
  >(null);
  const [confirmDiscardPreviewDraftId, setConfirmDiscardPreviewDraftId] =
    useState<string | null>(null);
  const [draftLabelEditState, setDraftLabelEditState] =
    useState<DraftLabelEditState | null>(null);
  const [savingDraftLabelId, setSavingDraftLabelId] = useState<string | null>(
    null,
  );

  function clearPreviewDraftActivityState() {
    setPreviewDraftActivity(null);
    setPreviewDraftActivityError(null);
    setLoadingPreviewDraftActivityId(null);
  }

  function clearPromotionReadinessPreflightState() {
    setPromotionReadinessPreflight(null);
    setPromotionReadinessPreflightError(null);
    setLoadingPromotionReadinessPreflightId(null);
  }

  function clearPromotionDryRunPlanState() {
    setPromotionDryRunPlan(null);
    setPromotionDryRunPlanError(null);
    setLoadingPromotionDryRunPlanId(null);
  }

  function clearDraftLabelEditState() {
    setDraftLabelEditState(null);
    setSavingDraftLabelId(null);
  }

  function clearPreviewDraftTransitionUiState() {
    setConfirmDiscardPreviewDraftId(null);
    clearDraftLabelEditState();
  }

  function clearOpenedPreviewDraftDependentState() {
    clearPreviewDraftActivityState();
    clearPromotionReadinessPreflightState();
    clearPromotionDryRunPlanState();
    clearPreviewDraftTransitionUiState();
  }

  function clearRuntimeResult() {
    setRuntimeResult(null);
    setOpenedPreviewDraft(null);
    clearOpenedPreviewDraftDependentState();
    setRuntimeError(null);
    setIsRuntimeLoading(false);
  }

  function resetRuntimeDraftState() {
    clearRuntimeResult();
  }

  async function refreshPreviewDrafts(
    overrides: Partial<DraftListControls> = {},
  ) {
    const controls = buildDraftListControls(
      {
        lifecycle: draftLifecycleFilter,
        sort: draftSort,
        warnings: draftWarningFilter,
        candidates: draftCandidateFilter,
        limit: draftListLimit,
      },
      overrides,
    );

    setIsPreviewDraftsLoading(true);
    setPreviewDraftsError(null);
    setConfirmDiscardPreviewDraftId(null);

    try {
      const params = new URLSearchParams({
        limit: String(controls.limit),
        lifecycle: controls.lifecycle,
        sort: controls.sort,
        warnings: controls.warnings,
        candidates: controls.candidates,
        include_discarded: String(controls.lifecycle !== "active"),
      });
      const response = await fetch(
        `${MANUAL_NOTE_PREVIEW_DRAFTS_ROUTE}?${params.toString()}`,
      );
      const result = (await response.json()) as ManualNotePreviewDraftListResponse;

      if (!response.ok || !result.ok) {
        setPreviewDraftsError(
          result.ok
            ? "Preview draft list route returned an unavailable response."
            : result.message,
        );
        return false;
      }

      setPreviewDraftItems(result.items);
      setPreviewDraftListSummary(result.summary);
      return true;
    } catch {
      setPreviewDraftsError("Preview draft list route is unavailable.");
      return false;
    } finally {
      setIsPreviewDraftsLoading(false);
    }
  }

  async function createRuntimePreviewDraft({
    manualNoteText,
    operatorPreviewLabel,
  }: CreateRuntimePreviewDraftInput) {
    if (!manualNoteText.trim() || isRuntimeLoading) return false;

    setIsRuntimeLoading(true);
    setRuntimeError(null);
    const cleanOperatorPreviewLabel = operatorPreviewLabel.trim();

    try {
      const response = await fetch(MANUAL_NOTE_PREVIEW_ROUTE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          manual_note_text: manualNoteText,
          scope: "project:augnes",
          persist_preview_draft: true,
          ...(cleanOperatorPreviewLabel
            ? { operator_note_label: cleanOperatorPreviewLabel }
            : {}),
        }),
      });
      const result = (await response.json()) as ManualNotePreviewRuntimeResponse;

      if (!response.ok || !result.ok) {
        setRuntimeError(
          result.ok
            ? "Manual note preview route returned an unavailable response."
            : result.message,
        );
        return false;
      }

      setRuntimeResult(result);
      setOpenedPreviewDraft(null);
      clearOpenedPreviewDraftDependentState();
      void refreshPreviewDrafts();
      return true;
    } catch {
      setRuntimeError("Manual note preview route is unavailable.");
      return false;
    } finally {
      setIsRuntimeLoading(false);
    }
  }

  async function openPreviewDraft(previewDraftId: string) {
    setOpeningPreviewDraftId(previewDraftId);
    setPreviewDraftsError(null);

    try {
      const response = await fetch(
        buildManualNotePreviewDraftDetailRoute(previewDraftId),
      );
      const result =
        (await response.json()) as ManualNotePreviewDraftDetailResponse;

      if (!response.ok || !result.ok) {
        setPreviewDraftsError(
          result.ok
            ? "Preview draft detail route returned an unavailable response."
            : result.message,
        );
        return false;
      }

      setOpenedPreviewDraft(result);
      setRuntimeResult(null);
      clearOpenedPreviewDraftDependentState();
      setRuntimeError(null);
      setIsRuntimeLoading(false);
      return true;
    } catch {
      setPreviewDraftsError("Preview draft detail route is unavailable.");
      return false;
    } finally {
      setOpeningPreviewDraftId(null);
    }
  }

  async function loadPreviewDraftActivity(previewDraftId: string) {
    setLoadingPreviewDraftActivityId(previewDraftId);
    setPreviewDraftActivityError(null);

    try {
      const response = await fetch(
        buildManualNotePreviewDraftActivityRoute(previewDraftId),
      );
      const result =
        (await response.json()) as ManualNotePreviewDraftActivityResponse;

      if (!response.ok || !result.ok) {
        setPreviewDraftActivity(null);
        setPreviewDraftActivityError(
          result.ok
            ? "Preview draft activity route returned an unavailable response."
            : result.message,
        );
        return false;
      }

      setPreviewDraftActivity(result);
      return true;
    } catch {
      setPreviewDraftActivity(null);
      setPreviewDraftActivityError("Preview draft activity route is unavailable.");
      return false;
    } finally {
      setLoadingPreviewDraftActivityId(null);
    }
  }

  async function loadPromotionReadinessPreflight(previewDraftId: string) {
    setLoadingPromotionReadinessPreflightId(previewDraftId);
    setPromotionReadinessPreflightError(null);

    try {
      const response = await fetch(
        buildManualNotePreviewDraftPromotionReadinessRoute(previewDraftId),
      );
      const result =
        (await response.json()) as ManualNotePreviewDraftPromotionReadinessResponse;

      if (!response.ok || !result.ok) {
        setPromotionReadinessPreflight(null);
        setPromotionReadinessPreflightError(
          result.ok
            ? "Promotion readiness preflight route returned an unavailable response."
            : result.message,
        );
        return false;
      }

      setPromotionReadinessPreflight(result);
      if (
        promotionDryRunPlan?.ok &&
        promotionDryRunPlan.preview_draft_id === previewDraftId
      ) {
        clearPromotionDryRunPlanState();
      }
      return true;
    } catch {
      setPromotionReadinessPreflight(null);
      setPromotionReadinessPreflightError(
        "Promotion readiness preflight route is unavailable.",
      );
      return false;
    } finally {
      setLoadingPromotionReadinessPreflightId(null);
    }
  }

  async function loadPromotionDryRunPlan(previewDraftId: string) {
    setLoadingPromotionDryRunPlanId(previewDraftId);
    setPromotionDryRunPlanError(null);

    try {
      const response = await fetch(
        buildManualNotePreviewDraftPromotionDryRunPlanRoute(previewDraftId),
      );
      const result =
        (await response.json()) as ManualNotePreviewDraftPromotionDryRunPlanResponse;

      if (!response.ok || !result.ok) {
        setPromotionDryRunPlan(null);
        setPromotionDryRunPlanError(
          result.ok
            ? "Promotion dry-run plan route returned an unavailable response."
            : result.message,
        );
        return false;
      }

      if (result.preview_draft_id !== previewDraftId) {
        setPromotionDryRunPlan(null);
        setPromotionDryRunPlanError(
          "Promotion dry-run plan route returned a mismatched preview draft.",
        );
        return false;
      }

      setPromotionDryRunPlan(result);
      return true;
    } catch {
      setPromotionDryRunPlan(null);
      setPromotionDryRunPlanError(
        "Promotion dry-run plan route is unavailable.",
      );
      return false;
    } finally {
      setLoadingPromotionDryRunPlanId(null);
    }
  }

  async function discardPreviewDraft(previewDraftId: string) {
    if (confirmDiscardPreviewDraftId !== previewDraftId) {
      setConfirmDiscardPreviewDraftId(previewDraftId);
      return false;
    }

    setDiscardingPreviewDraftId(previewDraftId);
    setPreviewDraftsError(null);

    try {
      const response = await fetch(
        buildManualNotePreviewDraftDiscardRoute(previewDraftId),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            discard_reason:
              "Discarded from Cockpit manual preview draft list.",
          }),
        },
      );
      const result =
        (await response.json()) as ManualNotePreviewDraftDiscardResponse;

      if (!response.ok || !result.ok) {
        setPreviewDraftsError(
          result.ok
            ? "Preview draft discard route returned an unavailable response."
            : result.message,
        );
        return false;
      }

      setOpenedPreviewDraft((currentDraft) => {
        if (!currentDraft || currentDraft.draft.preview_draft_id !== previewDraftId) {
          return currentDraft;
        }

        return {
          ...currentDraft,
          lifecycle_status: "discarded_preview_draft",
          discard_metadata: result.discard_metadata,
          draft: {
            ...currentDraft.draft,
            lifecycle_status: "discarded_preview_draft",
            lifecycle_summary: {
              ...currentDraft.draft.lifecycle_summary,
              discard_state: "discarded",
              activity_count:
                currentDraft.draft.lifecycle_summary.activity_count + 1,
              last_activity_type: "preview_draft_discarded",
              last_activity_at: result.discarded_at,
            },
            discard_metadata: result.discard_metadata,
          },
        };
      });
      setConfirmDiscardPreviewDraftId(null);
      clearDraftLabelEditState();
      if (
        promotionDryRunPlan?.ok &&
        promotionDryRunPlan.preview_draft_id === previewDraftId
      ) {
        clearPromotionDryRunPlanState();
      }
      if (
        previewDraftActivity?.ok &&
        previewDraftActivity.preview_draft_id === previewDraftId
      ) {
        void loadPreviewDraftActivity(previewDraftId);
      }
      if (
        promotionReadinessPreflight?.ok &&
        promotionReadinessPreflight.preview_draft_id === previewDraftId
      ) {
        void loadPromotionReadinessPreflight(previewDraftId);
      }
      await refreshPreviewDrafts();
      return true;
    } catch {
      setPreviewDraftsError("Preview draft discard route is unavailable.");
      return false;
    } finally {
      setDiscardingPreviewDraftId(null);
    }
  }

  function cancelDiscardPreviewDraft() {
    setConfirmDiscardPreviewDraftId(null);
  }

  function startDraftLabelEdit(item: ManualNotePreviewDraftListItem) {
    setDraftLabelEditState({
      previewDraftId: item.preview_draft_id,
      value: item.operator_note_label ?? "",
      error: null,
    });
    setConfirmDiscardPreviewDraftId(null);
  }

  function updateDraftLabelEditValue(value: string) {
    setDraftLabelEditState((currentState) =>
      currentState
        ? {
            ...currentState,
            value,
            error: null,
          }
        : currentState,
    );
  }

  function clearDraftLabelEditValue() {
    updateDraftLabelEditValue("");
  }

  function cancelDraftLabelEdit() {
    clearDraftLabelEditState();
  }

  async function saveDraftLabel(previewDraftId: string) {
    if (
      !draftLabelEditState ||
      draftLabelEditState.previewDraftId !== previewDraftId
    ) {
      return false;
    }

    const nextLabel = draftLabelEditState.value.trim();
    if (nextLabel.length > MAX_MANUAL_NOTE_PREVIEW_DRAFT_LABEL_LENGTH) {
      setDraftLabelEditState({
        ...draftLabelEditState,
        error: `Label must be ${MAX_MANUAL_NOTE_PREVIEW_DRAFT_LABEL_LENGTH} characters or fewer.`,
      });
      return false;
    }

    setSavingDraftLabelId(previewDraftId);
    setDraftLabelEditState({
      ...draftLabelEditState,
      error: null,
    });

    try {
      const response = await fetch(
        buildManualNotePreviewDraftLabelRoute(previewDraftId),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            operator_note_label: nextLabel.length > 0 ? nextLabel : null,
          }),
        },
      );
      const result =
        (await response.json()) as ManualNotePreviewDraftLabelUpdateResponse;

      if (!response.ok || !result.ok) {
        setDraftLabelEditState((currentState) =>
          currentState?.previewDraftId === previewDraftId
            ? {
                ...currentState,
                error: result.ok
                  ? "Preview draft label route returned an unavailable response."
                  : result.message,
              }
            : currentState,
        );
        return false;
      }

      setPreviewDraftItems((currentItems) =>
        currentItems.map((item) =>
          item.preview_draft_id === previewDraftId
            ? {
                ...item,
                operator_note_label: result.operator_note_label,
                updated_at: result.updated_at,
                lifecycle_status: result.lifecycle_status,
                lifecycle_summary: {
                  ...item.lifecycle_summary,
                  label_state: result.operator_note_label
                    ? "labeled"
                    : "untitled",
                  discard_state:
                    result.lifecycle_status === "discarded_preview_draft"
                      ? "discarded"
                      : "active",
                  activity_count: item.lifecycle_summary.activity_count + 1,
                  last_activity_type: result.operator_note_label
                    ? "label_updated"
                    : "label_cleared",
                  last_activity_at: result.updated_at,
                },
              }
            : item,
        ),
      );
      setOpenedPreviewDraft((currentDraft) => {
        if (
          !currentDraft ||
          currentDraft.draft.preview_draft_id !== previewDraftId
        ) {
          return currentDraft;
        }

        return {
          ...currentDraft,
          lifecycle_status: result.lifecycle_status,
          draft: {
            ...currentDraft.draft,
            operator_note_label: result.operator_note_label,
            updated_at: result.updated_at,
            lifecycle_status: result.lifecycle_status,
            lifecycle_summary: {
              ...currentDraft.draft.lifecycle_summary,
              label_state: result.operator_note_label ? "labeled" : "untitled",
              discard_state:
                result.lifecycle_status === "discarded_preview_draft"
                  ? "discarded"
                  : "active",
              activity_count:
                currentDraft.draft.lifecycle_summary.activity_count + 1,
              last_activity_type: result.operator_note_label
                ? "label_updated"
                : "label_cleared",
              last_activity_at: result.updated_at,
            },
          },
        };
      });
      clearDraftLabelEditState();
      if (
        promotionDryRunPlan?.ok &&
        promotionDryRunPlan.preview_draft_id === previewDraftId
      ) {
        clearPromotionDryRunPlanState();
      }
      await refreshPreviewDrafts();
      if (
        previewDraftActivity?.ok &&
        previewDraftActivity.preview_draft_id === previewDraftId
      ) {
        void loadPreviewDraftActivity(previewDraftId);
      }
      if (
        promotionReadinessPreflight?.ok &&
        promotionReadinessPreflight.preview_draft_id === previewDraftId
      ) {
        void loadPromotionReadinessPreflight(previewDraftId);
      }
      return true;
    } catch {
      setDraftLabelEditState((currentState) =>
        currentState?.previewDraftId === previewDraftId
          ? {
              ...currentState,
              error: "Preview draft label route is unavailable.",
            }
          : currentState,
      );
      return false;
    } finally {
      setSavingDraftLabelId(null);
    }
  }

  function updateDraftLifecycleFilter(
    lifecycle: ManualNotePreviewDraftListLifecycleFilter,
  ) {
    setDraftLifecycleFilter(lifecycle);
    void refreshPreviewDrafts({ lifecycle });
  }

  function updateDraftSort(sort: ManualNotePreviewDraftListSort) {
    setDraftSort(sort);
    void refreshPreviewDrafts({ sort });
  }

  function updateDraftWarningFilter(
    warnings: ManualNotePreviewDraftWarningFilter,
  ) {
    setDraftWarningFilter(warnings);
    void refreshPreviewDrafts({ warnings });
  }

  function updateDraftCandidateFilter(
    candidates: ManualNotePreviewDraftCandidateFilter,
  ) {
    setDraftCandidateFilter(candidates);
    void refreshPreviewDrafts({ candidates });
  }

  function updateDraftListLimit(limit: DraftListControls["limit"]) {
    setDraftListLimit(limit);
    void refreshPreviewDrafts({ limit });
  }

  return {
    runtimeState: {
      runtimeResult,
      runtimeError,
      isRuntimeLoading,
    },
    draftListState: {
      previewDraftItems,
      previewDraftListSummary,
      controls: {
        lifecycle: draftLifecycleFilter,
        sort: draftSort,
        warnings: draftWarningFilter,
        candidates: draftCandidateFilter,
        limit: draftListLimit,
      } satisfies DraftListControls,
      previewDraftsError,
      isPreviewDraftsLoading,
    },
    openedDraftState: {
      openedPreviewDraft,
      openingPreviewDraftId,
    },
    discardState: {
      discardingPreviewDraftId,
      confirmDiscardPreviewDraftId,
    },
    labelState: {
      draftLabelEditState,
      savingDraftLabelId,
    },
    activityState: {
      previewDraftActivity,
      previewDraftActivityError,
      loadingPreviewDraftActivityId,
    },
    preflightState: {
      promotionReadinessPreflight,
      promotionReadinessPreflightError,
      loadingPromotionReadinessPreflightId,
    },
    dryRunPlanState: {
      promotionDryRunPlan,
      promotionDryRunPlanError,
      loadingPromotionDryRunPlanId,
    },
    actions: {
      createRuntimePreviewDraft,
      refreshPreviewDrafts,
      openPreviewDraft,
      discardPreviewDraft,
      cancelDiscardPreviewDraft,
      startDraftLabelEdit,
      updateDraftLabelEditValue,
      saveDraftLabel,
      cancelDraftLabelEdit,
      clearDraftLabelEditValue,
      loadPreviewDraftActivity,
      loadPromotionReadinessPreflight,
      loadPromotionDryRunPlan,
      clearPromotionDryRunPlanState,
      clearRuntimeResult,
      resetRuntimeDraftState,
    },
    filterActions: {
      updateDraftLifecycleFilter,
      updateDraftSort,
      updateDraftWarningFilter,
      updateDraftCandidateFilter,
      updateDraftListLimit,
    },
  };
}
