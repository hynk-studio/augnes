"use client";

import { CockpitStartupReadinessReadout } from "@/components/cockpit-startup-readiness-readout";
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
import { PromotionReadinessGateExplanations } from "@/components/research-candidate-promotion-readiness-gate-explanations";
import { ReadinessCopyPacketPanel } from "@/components/research-candidate-readiness-copy-packet-panel";
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
  type ManualNotePreviewDraftPromotionReadinessGateResult,
  type ManualNotePreviewDraftPromotionReadinessResponse,
  type ManualNotePreviewDraftWarningFilter,
  type ManualNotePreviewRuntimeAuthority,
  type ManualNotePreviewRuntimeOkResponse,
  type ManualNotePreviewRuntimeResponse,
} from "@/lib/research-candidate-review/manual-note-runtime-preview";
import type {
  ClaimCandidate,
  EvidenceCandidate,
  FollowUpWorkCandidate,
  KnowledgeGapCandidate,
  PerspectiveDeltaCandidate,
  ResearchCandidateReviewAuthority,
  SourceReferencePreview,
  TensionCandidate,
} from "@/types/research-candidate-review";
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

const MANUAL_NOTE_PREFIX_GROUPS = [
  { label: "Research Question", prefixes: ["Research Question:", "연구질문:"] },
  { label: "Operator Intent", prefixes: ["Operator Intent:", "의도:"] },
  { label: "Source Title", prefixes: ["Source Title:", "출처제목:"] },
  { label: "Source Origin", prefixes: ["Source Origin:", "출처:"] },
  { label: "Source Identifier", prefixes: ["Source Identifier:", "식별자:"] },
  { label: "Claim", prefixes: ["Claim:", "주장:"] },
  { label: "Evidence", prefixes: ["Evidence:", "근거:"] },
  { label: "Tension", prefixes: ["Tension:", "긴장:"] },
  { label: "Gap", prefixes: ["Gap:", "공백:"] },
  { label: "Perspective Delta", prefixes: ["Perspective Delta:", "관점변화:"] },
  { label: "Next", prefixes: ["Next:", "다음:"] },
];

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

const PROMOTION_READINESS_STATUS_LABELS = {
  blocked: "Blocked",
  needs_operator_review: "Needs operator review",
  ready_for_promotion_discussion: "Ready for promotion discussion",
} as const;

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

          <div className="perspective-formation-summary-grid">
            <div>
              <span>research_session_preview</span>
              <strong>{session.session_id}</strong>
              <small>work_id {session.work_id}</small>
            </div>
            <div>
              <span>research question</span>
              <strong>{session.research_question}</strong>
              <small>review_status {session.review_status}</small>
            </div>
            <div>
              <span>operator intent</span>
              <strong>{session.operator_intent}</strong>
              <small>scope {session.scope}</small>
            </div>
            <div>
              <span>source refs</span>
              <strong>{formatList(session.source_refs)}</strong>
              <small>{session.boundary_notes}</small>
            </div>
          </div>

          <div
            className="tab-stat-row"
            aria-label="Manual note parser candidate counts"
          >
            <CandidateCount label="Claims" value={session.claim_candidate_count} />
            <CandidateCount
              label="Evidence"
              value={session.evidence_candidate_count}
            />
            <CandidateCount
              label="Tensions"
              value={session.tension_candidate_count}
            />
            <CandidateCount
              label="Knowledge gaps"
              value={session.knowledge_gap_candidate_count}
            />
            <CandidateCount
              label="Perspective deltas"
              value={session.perspective_delta_candidate_count}
            />
            <CandidateCount
              label="Follow-up work"
              value={session.follow_up_work_candidate_count}
            />
          </div>

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

function ManualNoteFormatHint() {
  return (
    <section
      className="perspective-inspector-section manual-note-format-hint"
      id="research-candidate-manual-note-format-hint"
    >
      <h3>How to format a note</h3>
      <p>
        Use one prefix per line. This help mirrors the current deterministic
        parser prefixes; it is UI guidance, not a new parser contract.
      </p>
      <div className="manual-note-prefix-grid">
        {MANUAL_NOTE_PREFIX_GROUPS.map((group) => (
          <div key={group.label}>
            <strong>{group.label}</strong>
            <code>{group.prefixes.join(" / ")}</code>
          </div>
        ))}
      </div>
      <p>
        For gap and follow-up lines, the parser also reads inline markers such
        as <code>next:</code>, <code>files:</code>, and <code>checks:</code>.
      </p>
    </section>
  );
}

function ManualNoteResultSummary({
  displayResult,
  parseCount,
}: {
  displayResult: ManualNoteDisplayResult;
  parseCount: number;
}) {
  const { preview } = displayResult;
  const session = preview.research_session_preview;

  return (
    <section
      className="perspective-inspector-section manual-note-result-summary"
      aria-label="Manual note parse result summary"
    >
      <h3>Parse result summary</h3>
      <div className="perspective-workbench-status-row">
        <span>
          candidates{" "}
          <code>
            {session.claim_candidate_count +
              session.evidence_candidate_count +
              session.tension_candidate_count +
              session.knowledge_gap_candidate_count +
              session.perspective_delta_candidate_count +
              session.follow_up_work_candidate_count}
          </code>
        </span>
        <span>
          claims <code>{session.claim_candidate_count}</code>
        </span>
        <span>
          evidence <code>{session.evidence_candidate_count}</code>
        </span>
        <span>
          warnings <code>{displayResult.warnings.length}</code>
        </span>
        <span>
          parser_version <code>{displayResult.parser_version}</code>
        </span>
        <span>
          preview_status <code>{preview.status}</code>
        </span>
        <span>
          source <code>{displayResult.source}</code>
        </span>
        <span>
          local_parse_count <code>{parseCount}</code>
        </span>
      </div>
    </section>
  );
}

function PromotionReadinessPreflightReadout({
  storedDraftResult,
  preflightResult,
  activityResult,
  isLoadingDraftId,
  error,
  onLoad,
}: {
  storedDraftResult: ManualNotePreviewDraftDetailOkResponse | null;
  preflightResult: ManualNotePreviewDraftPromotionReadinessResponse | null;
  activityResult: ManualNotePreviewDraftActivityResponse | null;
  isLoadingDraftId: string | null;
  error: string | null;
  onLoad: (previewDraftId: string) => void;
}) {
  if (!storedDraftResult) return null;

  const previewDraftId = storedDraftResult.draft.preview_draft_id;
  const isLoading = isLoadingDraftId === previewDraftId;
  const isCurrentPreflight =
    preflightResult?.ok === true &&
    preflightResult.preview_draft_id === previewDraftId;
  const gateGroups = isCurrentPreflight
    ? groupPromotionReadinessGates(preflightResult.gate_results)
    : { block: [], warn: [], pass: [] };

  return (
    <section
      className="perspective-inspector-section manual-note-promotion-readiness"
      aria-label="Promotion readiness preflight"
    >
      <div className="manual-note-preview-draft-activity-header">
        <div>
          <h3>Promotion readiness preflight</h3>
          <p>
            This is a read-only preflight. It does not promote, reject, defer,
            approve, write proof/evidence, create work items, or update
            Perspective state.
          </p>
        </div>
        <button
          type="button"
          className="secondary-button"
          disabled={isLoading}
          onClick={() => onLoad(previewDraftId)}
        >
          {isLoading
            ? "Running preflight..."
            : isCurrentPreflight
              ? "Refresh preflight"
              : "Run preflight"}
        </button>
      </div>
      <ul className="manual-note-label-boundary-copy">
        <li>
          This is a read-only preflight. It does not promote, reject, defer,
          approve, write proof/evidence, create work items, or update
          Perspective state.
        </li>
        <li>Ready for promotion discussion is not promotion authority.</li>
        <li>
          No source URLs are fetched, no retrieval is run, and no external
          handoff is sent.
        </li>
      </ul>
      {error ? (
        <p className="manual-note-runtime-error" role="alert">
          {error}
        </p>
      ) : null}
      {isCurrentPreflight ? (
        <>
          <div className="manual-note-promotion-readiness-status">
            <span>
              readiness_status{" "}
              <strong>
                {
                  PROMOTION_READINESS_STATUS_LABELS[
                    preflightResult.readiness_status
                  ]
                }
              </strong>
            </span>
            <span>
              readiness_score <strong>{preflightResult.readiness_score}</strong>
            </span>
            <span>
              lifecycle_status <strong>{preflightResult.lifecycle_status}</strong>
            </span>
          </div>

          <PromotionReadinessTextList
            title="Blockers"
            items={preflightResult.blockers}
            emptyText="No block gates returned by the preflight."
          />
          <PromotionReadinessTextList
            title="Warnings"
            items={preflightResult.warnings}
            emptyText="No warning gates returned by the preflight."
          />
          <PromotionReadinessTextList
            title="Next review steps"
            items={preflightResult.next_review_steps}
            emptyText="No next review steps returned by the preflight."
          />

          <div className="manual-note-promotion-readiness-summary-grid">
            <div>
              <h4>Source summary</h4>
              <span>
                source_ref_count{" "}
                <code>{preflightResult.source_summary.source_ref_count}</code>
              </span>
              <span>
                source_titles{" "}
                <code>
                  {formatList(preflightResult.source_summary.source_titles)}
                </code>
              </span>
              <span>
                source_identifiers{" "}
                <code>
                  {formatList(preflightResult.source_summary.source_identifiers)}
                </code>
              </span>
              <span>
                source_statuses{" "}
                <code>
                  {formatList(preflightResult.source_summary.source_statuses)}
                </code>
              </span>
              <span>
                source_boundary_notes{" "}
                <code>
                  {formatList(
                    preflightResult.source_summary.source_boundary_notes,
                  )}
                </code>
              </span>
            </div>
            <div>
              <h4>Candidate summary</h4>
              <span>
                total <code>{preflightResult.candidate_summary.total}</code>
              </span>
              <span>
                claims <code>{preflightResult.candidate_summary.claims}</code>
              </span>
              <span>
                evidence{" "}
                <code>{preflightResult.candidate_summary.evidence}</code>
              </span>
              <span>
                tensions{" "}
                <code>{preflightResult.candidate_summary.tensions}</code>
              </span>
              <span>
                knowledge_gaps{" "}
                <code>{preflightResult.candidate_summary.knowledge_gaps}</code>
              </span>
              <span>
                perspective_deltas{" "}
                <code>
                  {preflightResult.candidate_summary.perspective_deltas}
                </code>
              </span>
              <span>
                follow_up_work{" "}
                <code>{preflightResult.candidate_summary.follow_up_work}</code>
              </span>
            </div>
            <div>
              <h4>Lifecycle summary</h4>
              <span>
                label_state{" "}
                <code>{preflightResult.lifecycle_summary.label_state}</code>
              </span>
              <span>
                discard_state{" "}
                <code>{preflightResult.lifecycle_summary.discard_state}</code>
              </span>
              <span>
                activity_count{" "}
                <code>{preflightResult.lifecycle_summary.activity_count}</code>
              </span>
              <span>
                last_activity_type{" "}
                <code>
                  {preflightResult.lifecycle_summary.last_activity_type ??
                    "none recorded"}
                </code>
              </span>
              <span>
                last_activity_at{" "}
                <code>
                  {preflightResult.lifecycle_summary.last_activity_at ??
                    "none recorded"}
                </code>
              </span>
            </div>
          </div>

          <PromotionReadinessGateExplanations
            focusGates={[...gateGroups.block, ...gateGroups.warn]}
            passGates={gateGroups.pass}
          />

          <ReadinessCopyPacketPanel
            storedDraftResult={storedDraftResult}
            preflightResult={preflightResult}
            activityResult={activityResult}
            isPreflightRefreshing={isLoading}
          />

          <PromotionReadinessGateGroup
            title="Block gates"
            gates={gateGroups.block}
          />
          <PromotionReadinessGateGroup
            title="Warning gates"
            gates={gateGroups.warn}
          />
          <PromotionReadinessGateGroup
            title="Pass gates"
            gates={gateGroups.pass}
          />

          <div className="perspective-workbench-status-row">
            {Object.entries(preflightResult.runtime_boundary).map(
              ([key, value]) => (
                <span key={key}>
                  {key} <code>{String(value)}</code>
                </span>
              ),
            )}
            {Object.entries(preflightResult.no_side_effects).map(
              ([key, value]) => (
                <span key={key}>
                  {key} <code>{String(value)}</code>
                </span>
              ),
            )}
          </div>
        </>
      ) : (
        <p className="manual-note-runtime-hint">
          Run preflight to inspect read-only promotion discussion readiness for
          this stored preview draft. No promotion, proof/evidence write, work
          item, retrieval, or Perspective update is created.
        </p>
      )}
    </section>
  );
}

function PromotionReadinessTextList({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: string[];
  emptyText: string;
}) {
  return (
    <div className="manual-note-promotion-readiness-list">
      <h4>{title}</h4>
      {items.length === 0 ? (
        <p>{emptyText}</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PromotionReadinessGateGroup({
  title,
  gates,
}: {
  title: string;
  gates: ManualNotePreviewDraftPromotionReadinessGateResult[];
}) {
  return (
    <div className="manual-note-promotion-readiness-gates">
      <h4>{title}</h4>
      {gates.length === 0 ? (
        <p className="manual-note-runtime-hint">No gates in this group.</p>
      ) : (
        <div className="manual-note-promotion-readiness-gate-list">
          {gates.map((gate) => (
            <article
              key={gate.gate_id}
              className={`cockpit-surface-card manual-note-promotion-readiness-gate manual-note-promotion-readiness-gate-${gate.status}`}
            >
              <div className="manual-note-preview-draft-title-row">
                <div>
                  <strong>{gate.label}</strong>
                  <small>{gate.gate_id}</small>
                </div>
                <span className="status-pill">{gate.status}</span>
              </div>
              <p>{gate.summary}</p>
              <p className="manual-note-runtime-hint">{gate.detail}</p>
              <div className="manual-note-preview-draft-badges">
                {gate.evidence_fields.map((field) => (
                  <span key={field}>{field}</span>
                ))}
                <span>no_side_effects {String(gate.no_side_effects)}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function groupPromotionReadinessGates(
  gates: ManualNotePreviewDraftPromotionReadinessGateResult[],
) {
  return {
    block: gates.filter((gate) => gate.status === "block"),
    warn: gates.filter((gate) => gate.status === "warn"),
    pass: gates.filter((gate) => gate.status === "pass"),
  };
}

function ParserWarningSummary({
  warnings,
}: {
  warnings: ManualResearchNoteParserWarning[];
}) {
  if (warnings.length === 0) return null;

  return (
    <section
      className="perspective-inspector-section manual-note-warning-summary"
      role="status"
      aria-live="polite"
    >
      <h3>Parser warning summary</h3>
      <ul>
        {warnings.map((warning) => (
          <li key={`${warning.code}:${warning.line ?? "none"}`}>
            <strong>{warning.code}</strong>
            <span>{warning.message}</span>
            <small>
              line <code>{warning.line ?? "not available"}</code>
            </small>
          </li>
        ))}
      </ul>
    </section>
  );
}

function BooleanFlagGrid({
  title,
  flags,
}: {
  title: string;
  flags:
    | ManualResearchNoteParserResult["authority"]
    | ManualNotePreviewRuntimeAuthority
    | ResearchCandidateReviewAuthority;
}) {
  return (
    <section className="perspective-inspector-section">
      <h3>{title}</h3>
      <div className="perspective-workbench-status-row">
        {Object.entries(flags).map(([key, value]) => (
          <span key={key}>
            {key} <code>{String(value)}</code>
          </span>
        ))}
      </div>
    </section>
  );
}

function CandidateCount({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ParserWarningsList({
  warnings,
}: {
  warnings: ManualResearchNoteParserWarning[];
}) {
  return (
    <section className="perspective-inspector-section">
      <h3>warnings</h3>
      {warnings.length === 0 ? (
        <p>No parser warnings.</p>
      ) : (
        <ul>
          {warnings.map((warning) => (
            <li key={`${warning.code}:${warning.line ?? "none"}`}>
              <code>{warning.code}</code> {warning.message}
              {warning.line ? <small> line {warning.line}</small> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SourceReferenceList({
  sources,
}: {
  sources: SourceReferencePreview[];
}) {
  return (
    <section className="perspective-inspector-section">
      <h3>source_reference_previews</h3>
      {sources.length === 0 ? (
        <p>No source refs parsed.</p>
      ) : (
        sources.map((source) => (
          <article key={source.source_ref_id} className="cockpit-surface-card">
            <div className="meta-row">
              <span>
                source_ref_id <code>{source.source_ref_id}</code>
              </span>
              <span>
                review_status <code>{source.review_status}</code>
              </span>
            </div>
            <h4>{source.title}</h4>
            <p>{source.operator_note_summary}</p>
            <ul>
              <li>
                authors_or_origin <code>{source.authors_or_origin}</code>
              </li>
              <li>
                identifier_or_url <code>{source.identifier_or_url}</code>
              </li>
              <li>
                reference_source <code>{source.reference_source}</code>
              </li>
              <li>
                source_status <code>{source.source_status}</code>
              </li>
              <li>{source.boundary_notes}</li>
            </ul>
          </article>
        ))
      )}
    </section>
  );
}

function ClaimCandidateList({ candidates }: { candidates: ClaimCandidate[] }) {
  return (
    <section className="perspective-inspector-section">
      <h3>claim_candidates</h3>
      {candidates.length === 0 ? (
        <p>No claim candidates parsed.</p>
      ) : (
        candidates.map((candidate) => (
          <article
            key={candidate.claim_candidate_id}
            className="cockpit-surface-card"
          >
            <CandidateMeta
              idLabel="claim_candidate_id"
              id={candidate.claim_candidate_id}
              reviewStatus={candidate.review_status}
              epistemicStatus={candidate.epistemic_status}
              sourceRefs={formatCandidateSourceRefs(candidate)}
            />
            <p>{candidate.claim_text}</p>
            <ul>
              <li>
                claim_type <code>{candidate.claim_type}</code>
              </li>
              <li>
                confidence_label <code>{candidate.confidence_label}</code>
              </li>
              <li>
                supporting_evidence_candidate_ids{" "}
                <code>{formatList(candidate.supporting_evidence_candidate_ids)}</code>
              </li>
              <li>
                contradicting_evidence_candidate_ids{" "}
                <code>
                  {formatList(candidate.contradicting_evidence_candidate_ids)}
                </code>
              </li>
              <li>{candidate.boundary_notes}</li>
            </ul>
          </article>
        ))
      )}
    </section>
  );
}

function EvidenceCandidateList({
  candidates,
}: {
  candidates: EvidenceCandidate[];
}) {
  return (
    <section className="perspective-inspector-section">
      <h3>evidence_candidates</h3>
      {candidates.length === 0 ? (
        <p>No evidence candidates parsed.</p>
      ) : (
        candidates.map((candidate) => (
          <article
            key={candidate.evidence_candidate_id}
            className="cockpit-surface-card"
          >
            <CandidateMeta
              idLabel="evidence_candidate_id"
              id={candidate.evidence_candidate_id}
              reviewStatus={candidate.review_status}
              epistemicStatus={candidate.epistemic_status}
              sourceRefs={formatCandidateSourceRefs(candidate)}
            />
            <p>{candidate.evidence_summary}</p>
            <ul>
              <li>
                claim_candidate_id <code>{candidate.claim_candidate_id}</code>
              </li>
              <li>
                evidence_role <code>{candidate.evidence_role}</code>
              </li>
              <li>
                locator <code>{candidate.locator}</code>
              </li>
              <li>{candidate.quality_note}</li>
              <li>{candidate.boundary_notes}</li>
            </ul>
          </article>
        ))
      )}
    </section>
  );
}

function TensionCandidateList({
  candidates,
}: {
  candidates: TensionCandidate[];
}) {
  return (
    <section className="perspective-inspector-section">
      <h3>tension_candidates</h3>
      {candidates.length === 0 ? (
        <p>No tension candidates parsed.</p>
      ) : (
        candidates.map((candidate) => (
          <article
            key={candidate.tension_candidate_id}
            className="cockpit-surface-card"
          >
            <CandidateMeta
              idLabel="tension_candidate_id"
              id={candidate.tension_candidate_id}
              reviewStatus={candidate.review_status}
              epistemicStatus={candidate.epistemic_status}
              sourceRefs={formatCandidateSourceRefs(candidate)}
            />
            <p>{candidate.summary}</p>
            <ul>
              <li>
                tension_type <code>{candidate.tension_type}</code>
              </li>
              <li>
                related_claim_candidate_ids{" "}
                <code>{formatList(candidate.related_claim_candidate_ids)}</code>
              </li>
              <li>
                related_evidence_candidate_ids{" "}
                <code>{formatList(candidate.related_evidence_candidate_ids)}</code>
              </li>
              <li>{candidate.operator_question}</li>
              <li>
                blocks_or_qualifies_promotion{" "}
                <code>{String(candidate.blocks_or_qualifies_promotion)}</code>
              </li>
              <li>{candidate.boundary_notes}</li>
            </ul>
          </article>
        ))
      )}
    </section>
  );
}

function KnowledgeGapCandidateList({
  candidates,
}: {
  candidates: KnowledgeGapCandidate[];
}) {
  return (
    <section className="perspective-inspector-section">
      <h3>knowledge_gap_candidates</h3>
      {candidates.length === 0 ? (
        <p>No knowledge gap candidates parsed.</p>
      ) : (
        candidates.map((candidate) => (
          <article
            key={candidate.knowledge_gap_candidate_id}
            className="cockpit-surface-card"
          >
            <CandidateMeta
              idLabel="knowledge_gap_candidate_id"
              id={candidate.knowledge_gap_candidate_id}
              reviewStatus={candidate.review_status}
              epistemicStatus={candidate.epistemic_status}
              sourceRefs={formatCandidateSourceRefs(candidate)}
            />
            <p>{candidate.summary}</p>
            <ul>
              <li>{candidate.why_it_matters}</li>
              <li>
                related_claim_candidate_ids{" "}
                <code>{formatList(candidate.related_claim_candidate_ids)}</code>
              </li>
              <li>
                related_tension_candidate_ids{" "}
                <code>{formatList(candidate.related_tension_candidate_ids)}</code>
              </li>
              <li>
                suggested_next_reading{" "}
                <code>{formatList(candidate.suggested_next_reading)}</code>
              </li>
              <li>{candidate.boundary_notes}</li>
            </ul>
          </article>
        ))
      )}
    </section>
  );
}

function PerspectiveDeltaCandidateList({
  candidates,
}: {
  candidates: PerspectiveDeltaCandidate[];
}) {
  return (
    <section className="perspective-inspector-section">
      <h3>perspective_delta_candidates</h3>
      {candidates.length === 0 ? (
        <p>No perspective delta candidates parsed.</p>
      ) : (
        candidates.map((candidate) => (
          <article
            key={candidate.perspective_delta_candidate_id}
            className="cockpit-surface-card"
          >
            <CandidateMeta
              idLabel="perspective_delta_candidate_id"
              id={candidate.perspective_delta_candidate_id}
              reviewStatus={candidate.review_status}
              epistemicStatus={candidate.epistemic_status}
              sourceRefs={formatCandidateSourceRefs(candidate)}
            />
            <p>{candidate.proposed_update_summary}</p>
            <ul>
              <li>
                target_perspective_key{" "}
                <code>{candidate.target_perspective_key}</code>
              </li>
              <li>
                delta_type <code>{candidate.delta_type}</code>
              </li>
              <li>
                promotion_readiness <code>{candidate.promotion_readiness}</code>
              </li>
              <li>{candidate.before_summary}</li>
              <li>{candidate.after_summary}</li>
              <li>
                basis_claim_candidate_ids{" "}
                <code>{formatList(candidate.basis_claim_candidate_ids)}</code>
              </li>
              <li>
                basis_evidence_candidate_ids{" "}
                <code>{formatList(candidate.basis_evidence_candidate_ids)}</code>
              </li>
              <li>
                related_tension_candidate_ids{" "}
                <code>{formatList(candidate.related_tension_candidate_ids)}</code>
              </li>
              <li>
                related_gap_candidate_ids{" "}
                <code>{formatList(candidate.related_gap_candidate_ids)}</code>
              </li>
              <li>{candidate.risk_or_conflict_note}</li>
              <li>{candidate.boundary_notes}</li>
            </ul>
          </article>
        ))
      )}
    </section>
  );
}

function FollowUpWorkCandidateList({
  candidates,
}: {
  candidates: FollowUpWorkCandidate[];
}) {
  return (
    <section className="perspective-inspector-section">
      <h3>follow_up_work_candidates</h3>
      {candidates.length === 0 ? (
        <p>No follow-up work candidates parsed.</p>
      ) : (
        candidates.map((candidate) => (
          <article
            key={candidate.follow_up_work_candidate_id}
            className="cockpit-surface-card"
          >
            <div className="meta-row">
              <span>
                follow_up_work_candidate_id{" "}
                <code>{candidate.follow_up_work_candidate_id}</code>
              </span>
              <span>
                candidate_scope <code>{candidate.candidate_scope}</code>
              </span>
              <span>
                review_status <code>{candidate.review_status}</code>
              </span>
            </div>
            <h4>{candidate.candidate_title}</h4>
            <p>{candidate.candidate_summary}</p>
            <ul>
              <li>{candidate.reason}</li>
              <li>
                suggested_expected_files{" "}
                <code>{formatList(candidate.suggested_expected_files)}</code>
              </li>
              <li>
                suggested_expected_checks{" "}
                <code>{formatList(candidate.suggested_expected_checks)}</code>
              </li>
              <li>{candidate.boundary_notes}</li>
            </ul>
          </article>
        ))
      )}
    </section>
  );
}

function CandidateMeta({
  idLabel,
  id,
  reviewStatus,
  epistemicStatus,
  sourceRefs,
}: {
  idLabel: string;
  id: string;
  reviewStatus: string;
  epistemicStatus: string;
  sourceRefs: string;
}) {
  return (
    <div className="meta-row">
      <span>
        {idLabel} <code>{id}</code>
      </span>
      <span>
        review_status <code>{reviewStatus}</code>
      </span>
      <span>
        epistemic_status <code>{epistemicStatus}</code>
      </span>
      <span>
        source_refs <code>{sourceRefs}</code>
      </span>
    </div>
  );
}

function formatCandidateSourceRefs(candidate: {
  source_ref_id?: string;
  source_refs?: string[];
}) {
  return formatList(
    candidate.source_refs ??
      (candidate.source_ref_id ? [candidate.source_ref_id] : []),
  );
}

function formatList(values: readonly string[]) {
  return values.length > 0 ? values.join(", ") : "none";
}
