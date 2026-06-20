"use client";

import { CockpitStartupReadinessReadout } from "@/components/cockpit-startup-readiness-readout";
import { BooleanFlagGrid } from "@/components/research-candidate-manual-note-authority-flags";
import {
  ClaimCandidateList,
  EvidenceCandidateList,
  FollowUpWorkCandidateList,
  KnowledgeGapCandidateList,
  PerspectiveDeltaCandidateList,
  TensionCandidateList,
} from "@/components/research-candidate-manual-note-candidate-family-lists";
import { ManualNoteFormatHint } from "@/components/research-candidate-manual-note-format-hint";
import {
  ManualNoteResultSummary,
  ManualNoteSessionSummary,
} from "@/components/research-candidate-manual-note-result-summary";
import { SourceReferenceList } from "@/components/research-candidate-manual-note-source-reference-list";
import {
  ParserWarningSummary,
  ParserWarningsList,
} from "@/components/research-candidate-manual-note-warning-display";
import { PreviewDraftActivityReadout } from "@/components/research-candidate-preview-draft-activity-readout";
import {
  RecentPreviewDraftsPanel,
  type DraftListControls,
} from "@/components/research-candidate-preview-draft-list-panel";
import {
  RuntimeBoundarySummary,
  RuntimeMetadataSummary,
} from "@/components/research-candidate-preview-draft-metadata-readout";
import type { DraftLabelEditState } from "@/components/research-candidate-preview-draft-label-controls";
import { PromotionReadinessPreflightReadout } from "@/components/research-candidate-promotion-readiness-preflight-readout";
import { parseManualResearchNoteToPreview } from "@/lib/research-candidate-review/manual-note-parser";
import type {
  ManualResearchNoteParserResult,
  ManualResearchNoteParserWarning,
} from "@/lib/research-candidate-review/manual-note-parser";
import {
  MANUAL_NOTE_PREVIEW_DRAFTS_ROUTE,
  MANUAL_NOTE_PREVIEW_ROUTE,
  MAX_MANUAL_NOTE_PREVIEW_DRAFT_LABEL_LENGTH,
  buildManualNotePreviewDraftActivityRoute,
  buildManualNotePreviewDraftDetailRoute,
  buildManualNotePreviewDraftDiscardRoute,
  buildManualNotePreviewDraftLabelRoute,
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
  type ManualNotePreviewDraftPromotionReadinessOkResponse,
  type ManualNotePreviewDraftPromotionReadinessResponse,
  type ManualNotePreviewDraftWarningFilter,
  type ManualNotePreviewRuntimeAuthority,
  type ManualNotePreviewRuntimeOkResponse,
  type ManualNotePreviewRuntimeResponse,
} from "@/lib/research-candidate-review/manual-note-runtime-preview";
import type { FormEvent } from "react";
import { useState } from "react";

const MANUAL_NOTE_PLACEHOLDER = [
  "Research Question: What should the operator review?",
  "Operator Intent: Inspect candidate-only research material.",
  "Source Title: Manual source title",
  "Source Origin: operator note",
  "Source Identifier: local-note",
  "Claim: Candidate claim text.",
  "Evidence: supporting source-bound note.",
  "Tension: What remains uncertain?",
  "Gap: Missing context. next: source A, source B",
  "Perspective Delta: Refine the candidate review frame.",
  "Next: Review the candidate list before any separate work.",
].join("\n");

const MANUAL_NOTE_SAMPLE = [
  "Research Question: Should Augnes keep manual research notes candidate-only before any Perspective promotion?",
  "Operator Intent: Inspect a local pasted note as non-authoritative Research Candidate Review material.",
  "Source Title: Operator synthesis note for manual preview UX",
  "Source Origin: local operator note",
  "Source Identifier: local-preview-note-ux-001",
  "Claim: Manual pasted notes should be previewed as candidate-only research material before durable promotion.",
  "Evidence: supports: The manual parser output marks preview authority as candidate-only and read-only.",
  "Evidence: context: Human review is still required before any canonical Perspective update.",
  "Tension: A readable preview can still make candidate material feel more authoritative than it is.",
  "Gap: Need operator-visible UX cues that warnings and boundaries stay near the parse result. next: warning visibility check, narrow viewport pass",
  "Perspective Delta: Make Research Candidate Review easier to inspect without committing state.",
  "Next: Validate the manual preview UX refinements before PR review. files: components/research-candidate-manual-note-preview-panel.tsx checks: smoke:research-candidate-manual-note-preview-ui-v0-1, typecheck, browser pass",
].join("\n");

const AUTHORITY_BOUNDARY_COPY = [
  "Local parser execution remains available.",
  "Runtime action uses the same-origin bounded preview route only.",
  "Optional DB write is a non-canonical preview draft.",
  "Recent draft reads use same-origin preview draft routes only.",
  "Stored preview content is parsed preview JSON.",
  "Labels are operator-facing preview metadata only.",
  "Labels do not promote, classify, or canonize the draft.",
  "Activity is preview-draft metadata only.",
  "Activity does not approve, reject, defer, promote, or canonize this draft.",
  "Counts are preview-list metadata only.",
  "Counts do not approve, reject, defer, promote, or canonize drafts.",
  "Activity count is lifecycle metadata, not proof or evidence.",
  "Raw note text is not stored or recoverable.",
  "Raw pasted note text is not persisted.",
  "Raw note text not stored.",
  "Output is read-only preview material.",
  "No durable candidate/review/receipt storage or canonical Perspective storage.",
  "Discard is preview-draft lifecycle hygiene only.",
  "Discard does not delete canonical state because no canonical state was created.",
  "No promotion/reject/defer workflow.",
  "No proof/evidence writes.",
  "No work item creation.",
  "No provider/OpenAI calls.",
  "No retrieval/RAG/source fetching.",
  "No Codex execution or external handoff sending.",
];

type ManualNoteResultSource =
  | "local_parse"
  | "persisted_preview_draft"
  | "route_only_no_persistence"
  | "stored_preview_draft"
  | "discarded_preview_draft";

type ManualNoteDisplayResult = {
  parser_version: string;
  preview: ManualResearchNoteParserResult["preview"];
  warnings: ManualResearchNoteParserWarning[];
  authority:
    | ManualResearchNoteParserResult["authority"]
    | ManualNotePreviewRuntimeAuthority;
  source: ManualNoteResultSource;
  runtimeResult: ManualNotePreviewRuntimeOkResponse | null;
  storedDraftResult: ManualNotePreviewDraftDetailOkResponse | null;
};

export function ResearchCandidateManualNotePreviewPanel() {
  const [manualNoteText, setManualNoteText] = useState("");
  const [operatorPreviewLabel, setOperatorPreviewLabel] = useState("");
  const [parserResult, setParserResult] =
    useState<ManualResearchNoteParserResult | null>(null);
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
  const [parseCount, setParseCount] = useState(0);

  const inputHasText = manualNoteText.trim().length > 0;
  const operatorPreviewLabelLength = operatorPreviewLabel.trim().length;
  const operatorPreviewLabelTooLong =
    operatorPreviewLabelLength > MAX_MANUAL_NOTE_PREVIEW_DRAFT_LABEL_LENGTH;
  const displayResult: ManualNoteDisplayResult | null = openedPreviewDraft
    ? {
        parser_version: openedPreviewDraft.draft.parser_version,
        preview: openedPreviewDraft.preview,
        warnings: openedPreviewDraft.warnings,
        authority: openedPreviewDraft.authority,
        source:
          openedPreviewDraft.lifecycle_status === "discarded_preview_draft"
            ? "discarded_preview_draft"
            : "stored_preview_draft",
        runtimeResult: null,
        storedDraftResult: openedPreviewDraft,
      }
    : runtimeResult
    ? {
        parser_version: runtimeResult.parser_version,
        preview: runtimeResult.preview,
        warnings: runtimeResult.warnings,
        authority: runtimeResult.authority,
        source: runtimeResult.persisted_preview_draft
          ? "persisted_preview_draft"
          : "route_only_no_persistence",
        runtimeResult,
        storedDraftResult: null,
      }
    : parserResult
      ? {
          parser_version: parserResult.parser_version,
          preview: parserResult.preview,
          warnings: parserResult.warnings,
          authority: parserResult.authority,
          source: "local_parse",
          runtimeResult: null,
          storedDraftResult: null,
        }
      : null;

  function parseManualNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!inputHasText) return;

    setParserResult(parseManualResearchNoteToPreview(manualNoteText));
    setRuntimeResult(null);
    setOpenedPreviewDraft(null);
    setPreviewDraftActivity(null);
    setPreviewDraftActivityError(null);
    setLoadingPreviewDraftActivityId(null);
    setPromotionReadinessPreflight(null);
    setPromotionReadinessPreflightError(null);
    setLoadingPromotionReadinessPreflightId(null);
    setRuntimeError(null);
    setIsRuntimeLoading(false);
    setParseCount((currentCount) => currentCount + 1);
  }

  async function createRuntimePreviewDraft() {
    if (!inputHasText || operatorPreviewLabelTooLong || isRuntimeLoading) return;

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
        return;
      }

      setRuntimeResult(result);
      setParserResult(null);
      setOpenedPreviewDraft(null);
      setPreviewDraftActivity(null);
      setPreviewDraftActivityError(null);
      setLoadingPreviewDraftActivityId(null);
      setPromotionReadinessPreflight(null);
      setPromotionReadinessPreflightError(null);
      setLoadingPromotionReadinessPreflightId(null);
      void refreshPreviewDrafts();
    } catch {
      setRuntimeError("Manual note preview route is unavailable.");
    } finally {
      setIsRuntimeLoading(false);
    }
  }

  function useSampleNote() {
    setManualNoteText(MANUAL_NOTE_SAMPLE);
    setParserResult(null);
    setRuntimeResult(null);
    setOpenedPreviewDraft(null);
    setPreviewDraftActivity(null);
    setPreviewDraftActivityError(null);
    setLoadingPreviewDraftActivityId(null);
    setPromotionReadinessPreflight(null);
    setPromotionReadinessPreflightError(null);
    setLoadingPromotionReadinessPreflightId(null);
    setRuntimeError(null);
    setIsRuntimeLoading(false);
    setParseCount(0);
  }

  function clearManualNote() {
    setManualNoteText("");
    setOperatorPreviewLabel("");
    setParserResult(null);
    setRuntimeResult(null);
    setOpenedPreviewDraft(null);
    setPreviewDraftActivity(null);
    setPreviewDraftActivityError(null);
    setLoadingPreviewDraftActivityId(null);
    setPromotionReadinessPreflight(null);
    setPromotionReadinessPreflightError(null);
    setLoadingPromotionReadinessPreflightId(null);
    setRuntimeError(null);
    setIsRuntimeLoading(false);
    setParseCount(0);
  }

  function clearRuntimeResult() {
    setRuntimeResult(null);
    setOpenedPreviewDraft(null);
    setPreviewDraftActivity(null);
    setPreviewDraftActivityError(null);
    setLoadingPreviewDraftActivityId(null);
    setPromotionReadinessPreflight(null);
    setPromotionReadinessPreflightError(null);
    setLoadingPromotionReadinessPreflightId(null);
    setRuntimeError(null);
    setIsRuntimeLoading(false);
  }

  async function refreshPreviewDrafts(
    overrides: Partial<DraftListControls> = {},
  ) {
    const controls = {
      lifecycle: overrides.lifecycle ?? draftLifecycleFilter,
      sort: overrides.sort ?? draftSort,
      warnings: overrides.warnings ?? draftWarningFilter,
      candidates: overrides.candidates ?? draftCandidateFilter,
      limit: overrides.limit ?? draftListLimit,
    } satisfies DraftListControls;

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
        return;
      }

      setPreviewDraftItems(result.items);
      setPreviewDraftListSummary(result.summary);
    } catch {
      setPreviewDraftsError("Preview draft list route is unavailable.");
    } finally {
      setIsPreviewDraftsLoading(false);
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
        return;
      }

      setOpenedPreviewDraft(result);
      setParserResult(null);
      setRuntimeResult(null);
      setPreviewDraftActivity(null);
      setPreviewDraftActivityError(null);
      setLoadingPreviewDraftActivityId(null);
      setPromotionReadinessPreflight(null);
      setPromotionReadinessPreflightError(null);
      setLoadingPromotionReadinessPreflightId(null);
      setRuntimeError(null);
      setIsRuntimeLoading(false);
    } catch {
      setPreviewDraftsError("Preview draft detail route is unavailable.");
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
        return;
      }

      setPreviewDraftActivity(result);
    } catch {
      setPreviewDraftActivity(null);
      setPreviewDraftActivityError("Preview draft activity route is unavailable.");
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
        return;
      }

      setPromotionReadinessPreflight(result);
    } catch {
      setPromotionReadinessPreflight(null);
      setPromotionReadinessPreflightError(
        "Promotion readiness preflight route is unavailable.",
      );
    } finally {
      setLoadingPromotionReadinessPreflightId(null);
    }
  }

  async function discardPreviewDraft(previewDraftId: string) {
    if (confirmDiscardPreviewDraftId !== previewDraftId) {
      setConfirmDiscardPreviewDraftId(previewDraftId);
      return;
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
        return;
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
    } catch {
      setPreviewDraftsError("Preview draft discard route is unavailable.");
    } finally {
      setDiscardingPreviewDraftId(null);
    }
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
    setDraftLabelEditState(null);
    setSavingDraftLabelId(null);
  }

  async function saveDraftLabel(previewDraftId: string) {
    if (
      !draftLabelEditState ||
      draftLabelEditState.previewDraftId !== previewDraftId
    ) {
      return;
    }

    const nextLabel = draftLabelEditState.value.trim();
    if (nextLabel.length > MAX_MANUAL_NOTE_PREVIEW_DRAFT_LABEL_LENGTH) {
      setDraftLabelEditState({
        ...draftLabelEditState,
        error: `Label must be ${MAX_MANUAL_NOTE_PREVIEW_DRAFT_LABEL_LENGTH} characters or fewer.`,
      });
      return;
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
        return;
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
      setDraftLabelEditState(null);
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
    } catch {
      setDraftLabelEditState((currentState) =>
        currentState?.previewDraftId === previewDraftId
          ? {
              ...currentState,
              error: "Preview draft label route is unavailable.",
            }
          : currentState,
      );
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

  const preview = displayResult?.preview ?? null;
  const session = preview?.research_session_preview ?? null;
  const textareaDescriptionIds = displayResult
    ? "research-candidate-manual-note-boundary"
    : "research-candidate-manual-note-format-hint research-candidate-manual-note-boundary";

  return (
    <section
      className="perspective-section"
      id="research-candidate-manual-note-preview-panel"
      tabIndex={-1}
      aria-label="Manual pasted note parser and runtime preview"
      data-augnes-authority="read-only preview-only candidate-only manual-parser same-origin-runtime-preview-draft"
      data-augnes-parser-execution="local-parser-and-same-origin-runtime-route"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">AUGNES / Research</p>
          <h2>Cockpit Manual Pasted Note Preview</h2>
          <p>
            Paste a bounded manual research note, run the deterministic parser
            locally or through the bounded runtime route, and inspect
            candidate-only Research Candidate Review preview output.
          </p>
        </div>
        <div className="perspective-constellation-shell-status">
          <span className="status-pill">local parser</span>
          <span className="status-pill">runtime preview draft</span>
          <span className="status-pill">read-only preview</span>
          <span className="status-pill">candidate-only</span>
        </div>
      </div>

      <form className="observe-form" onSubmit={parseManualNote}>
        <div className="manual-note-input-header">
          <label htmlFor="research-candidate-manual-note-input">
            Manual note text
          </label>
          <button
            type="button"
            className="secondary-button"
            onClick={useSampleNote}
          >
            Use sample note
          </button>
        </div>
        <div className="manual-note-label-field">
          <label htmlFor="research-candidate-manual-note-label-input">
            Operator preview label
          </label>
          <input
            id="research-candidate-manual-note-label-input"
            value={operatorPreviewLabel}
            onChange={(event) => setOperatorPreviewLabel(event.target.value)}
            maxLength={MAX_MANUAL_NOTE_PREVIEW_DRAFT_LABEL_LENGTH}
            placeholder="Paper synthesis: retrieval quality notes"
            aria-describedby="research-candidate-manual-note-label-boundary"
          />
          <small>
            {operatorPreviewLabelLength}/
            {MAX_MANUAL_NOTE_PREVIEW_DRAFT_LABEL_LENGTH} characters. Optional
            and saved only when creating a runtime preview draft.
          </small>
          <ul
            className="manual-note-label-boundary-copy"
            id="research-candidate-manual-note-label-boundary"
          >
            <li>Labels are operator-facing preview metadata only.</li>
            <li>Labels do not promote, classify, or canonize the draft.</li>
            <li>Raw note text is not stored or recoverable.</li>
          </ul>
        </div>
        <textarea
          id="research-candidate-manual-note-input"
          value={manualNoteText}
          onChange={(event) => setManualNoteText(event.target.value)}
          rows={10}
          placeholder={MANUAL_NOTE_PLACEHOLDER}
          spellCheck={false}
          aria-describedby={textareaDescriptionIds}
        />
        <div className="form-row">
          <button type="submit" disabled={!inputHasText}>
            Parse locally
          </button>
          <button
            type="button"
            className="secondary-button"
            disabled={
              !inputHasText || operatorPreviewLabelTooLong || isRuntimeLoading
            }
            onClick={createRuntimePreviewDraft}
          >
            {isRuntimeLoading
              ? "Creating runtime preview draft..."
              : "Create runtime preview draft"}
          </button>
          <button
            type="button"
            className="secondary-button"
            disabled={
              !manualNoteText &&
              !parserResult &&
              !runtimeResult &&
              !runtimeError &&
              !isRuntimeLoading
            }
            onClick={clearManualNote}
          >
            Clear local note
          </button>
          <button
            type="button"
            className="secondary-button"
            disabled={
              !runtimeResult &&
              !runtimeError &&
              !isRuntimeLoading &&
              !openedPreviewDraft
            }
            onClick={clearRuntimeResult}
          >
            Clear runtime result
          </button>
        </div>
        <p className="manual-note-runtime-hint">
          Local parse updates this panel only. Runtime preview draft posts to
          the same-origin route, reruns the deterministic parser, stores a
          preview draft when requested, and does not persist raw note text.
        </p>
        {runtimeError ? (
          <p className="manual-note-runtime-error" role="alert">
            {runtimeError}
          </p>
        ) : null}
      </form>

      <section
        className="perspective-inspector-section"
        id="research-candidate-manual-note-boundary"
      >
        <h3>Authority boundary</h3>
        <ul className="boundary-list">
          {AUTHORITY_BOUNDARY_COPY.map((boundary) => (
            <li key={boundary}>{boundary}</li>
          ))}
        </ul>
      </section>

      <CockpitStartupReadinessReadout />

      <RecentPreviewDraftsPanel
        items={previewDraftItems}
        summary={previewDraftListSummary}
        controls={{
          lifecycle: draftLifecycleFilter,
          sort: draftSort,
          warnings: draftWarningFilter,
          candidates: draftCandidateFilter,
          limit: draftListLimit,
        }}
        isLoading={isPreviewDraftsLoading}
        error={previewDraftsError}
        openedPreviewDraftId={openedPreviewDraft?.draft.preview_draft_id ?? null}
        openingPreviewDraftId={openingPreviewDraftId}
        discardingPreviewDraftId={discardingPreviewDraftId}
        confirmDiscardPreviewDraftId={confirmDiscardPreviewDraftId}
        labelEditState={draftLabelEditState}
        savingDraftLabelId={savingDraftLabelId}
        onRefresh={() => void refreshPreviewDrafts()}
        onChangeLifecycle={updateDraftLifecycleFilter}
        onChangeSort={updateDraftSort}
        onChangeWarnings={updateDraftWarningFilter}
        onChangeCandidates={updateDraftCandidateFilter}
        onChangeLimit={updateDraftListLimit}
        onOpen={(previewDraftId) => void openPreviewDraft(previewDraftId)}
        onDiscard={(previewDraftId) => void discardPreviewDraft(previewDraftId)}
        onCancelDiscard={() => setConfirmDiscardPreviewDraftId(null)}
        onStartLabelEdit={startDraftLabelEdit}
        onChangeLabelEdit={updateDraftLabelEditValue}
        onSaveLabelEdit={(previewDraftId) => void saveDraftLabel(previewDraftId)}
        onCancelLabelEdit={cancelDraftLabelEdit}
        onClearLabelEdit={clearDraftLabelEditValue}
      />

      {displayResult && preview && session ? (
        <div className="perspective-detail-stack">
          <ManualNoteResultSummary
            displayResult={displayResult}
            parseCount={parseCount}
          />

          <ParserWarningSummary warnings={displayResult.warnings} />

          <RuntimeMetadataSummary
            runtimeResult={displayResult.runtimeResult}
            storedDraftResult={displayResult.storedDraftResult}
          />
          <PreviewDraftActivityReadout
            storedDraftResult={displayResult.storedDraftResult}
            activityResult={previewDraftActivity}
            isLoadingDraftId={loadingPreviewDraftActivityId}
            error={previewDraftActivityError}
            onLoad={(previewDraftId) => void loadPreviewDraftActivity(previewDraftId)}
          />
          <PromotionReadinessPreflightReadout
            storedDraftResult={displayResult.storedDraftResult}
            preflightResult={promotionReadinessPreflight}
            activityResult={previewDraftActivity}
            isLoadingDraftId={loadingPromotionReadinessPreflightId}
            error={promotionReadinessPreflightError}
            onLoad={(previewDraftId) =>
              void loadPromotionReadinessPreflight(previewDraftId)
            }
          />
          <RuntimeBoundarySummary
            runtimeResult={displayResult.runtimeResult}
            storedDraftResult={displayResult.storedDraftResult}
          />

          <BooleanFlagGrid
            title={
              displayResult.runtimeResult
                ? "Runtime authority"
                : displayResult.storedDraftResult
                  ? "Stored draft authority"
                  : "Parser authority"
            }
            flags={displayResult.authority}
          />
          <BooleanFlagGrid title="Preview authority" flags={preview.authority} />

          <ManualNoteSessionSummary session={session} />

          <div className="perspective-constellation-workspace-grid">
            <ParserWarningsList warnings={displayResult.warnings} />
            <SourceReferenceList sources={preview.source_reference_previews} />
            <ClaimCandidateList candidates={preview.claim_candidates} />
            <EvidenceCandidateList candidates={preview.evidence_candidates} />
            <TensionCandidateList candidates={preview.tension_candidates} />
            <KnowledgeGapCandidateList
              candidates={preview.knowledge_gap_candidates}
            />
            <PerspectiveDeltaCandidateList
              candidates={preview.perspective_delta_candidates}
            />
            <FollowUpWorkCandidateList
              candidates={preview.follow_up_work_candidates}
            />
          </div>
        </div>
      ) : (
        <>
          <section className="perspective-inspector-section">
            <h3>Preview output</h3>
            <p>
              Parser output appears here after local parsing, runtime preview
              draft creation, or opening a stored preview draft. No preview
              result is selected yet.
            </p>
          </section>
          <ManualNoteFormatHint />
        </>
      )}
    </section>
  );
}
