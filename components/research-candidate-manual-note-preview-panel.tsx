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
import { ResearchCandidateManualNoteHandoffSeedPreview } from "@/components/research-candidate-manual-note-handoff-seed-preview";
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
import { RecentPreviewDraftsPanel } from "@/components/research-candidate-preview-draft-list-panel";
import {
  RuntimeBoundarySummary,
  RuntimeMetadataSummary,
} from "@/components/research-candidate-preview-draft-metadata-readout";
import { PromotionDryRunPlanReadout } from "@/components/research-candidate-promotion-dry-run-plan-readout";
import { PromotionReadinessPreflightReadout } from "@/components/research-candidate-promotion-readiness-preflight-readout";
import { useResearchCandidateManualNotePreviewRuntime } from "@/components/use-research-candidate-manual-note-preview-runtime";
import { buildResearchCandidateManualNoteHandoffSeed } from "@/lib/research-candidate-review/manual-note-handoff-seed";
import { parseManualResearchNoteToPreview } from "@/lib/research-candidate-review/manual-note-parser";
import type {
  ManualResearchNoteParserResult,
  ManualResearchNoteParserWarning,
} from "@/lib/research-candidate-review/manual-note-parser";
import {
  MAX_MANUAL_NOTE_PREVIEW_DRAFT_LABEL_LENGTH,
  type ManualNotePreviewDraftDetailOkResponse,
  type ManualNotePreviewRuntimeAuthority,
  type ManualNotePreviewRuntimeOkResponse,
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
  const [parseCount, setParseCount] = useState(0);
  const manualNoteRuntime = useResearchCandidateManualNotePreviewRuntime();
  const { runtimeResult, runtimeError, isRuntimeLoading } =
    manualNoteRuntime.runtimeState;
  const {
    previewDraftItems,
    previewDraftListSummary,
    controls: draftListControls,
    previewDraftsError,
    isPreviewDraftsLoading,
  } = manualNoteRuntime.draftListState;
  const { openedPreviewDraft, openingPreviewDraftId } =
    manualNoteRuntime.openedDraftState;
  const { discardingPreviewDraftId, confirmDiscardPreviewDraftId } =
    manualNoteRuntime.discardState;
  const { draftLabelEditState, savingDraftLabelId } =
    manualNoteRuntime.labelState;
  const {
    previewDraftActivity,
    previewDraftActivityError,
    loadingPreviewDraftActivityId,
  } = manualNoteRuntime.activityState;
  const {
    promotionReadinessPreflight,
    promotionReadinessPreflightError,
    loadingPromotionReadinessPreflightId,
  } = manualNoteRuntime.preflightState;
  const {
    promotionDryRunPlan,
    promotionDryRunPlanError,
    loadingPromotionDryRunPlanId,
  } = manualNoteRuntime.dryRunPlanState;

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
    manualNoteRuntime.actions.clearRuntimeResult();
    setParseCount((currentCount) => currentCount + 1);
  }

  async function handleCreateRuntimePreviewDraft() {
    const created =
      await manualNoteRuntime.actions.createRuntimePreviewDraft({
        manualNoteText,
        operatorPreviewLabel,
      });
    if (created) {
      setParserResult(null);
    }
  }

  function useSampleNote() {
    setManualNoteText(MANUAL_NOTE_SAMPLE);
    setParserResult(null);
    manualNoteRuntime.actions.resetRuntimeDraftState();
    setParseCount(0);
  }

  function clearManualNote() {
    setManualNoteText("");
    setOperatorPreviewLabel("");
    setParserResult(null);
    manualNoteRuntime.actions.resetRuntimeDraftState();
    setParseCount(0);
  }

  async function handleOpenPreviewDraft(previewDraftId: string) {
    const opened =
      await manualNoteRuntime.actions.openPreviewDraft(previewDraftId);
    if (opened) {
      setParserResult(null);
    }
  }

  const preview = displayResult?.preview ?? null;
  const session = preview?.research_session_preview ?? null;
  const handoffSeed = displayResult
    ? buildResearchCandidateManualNoteHandoffSeed({
        preview: displayResult.preview,
        warnings: displayResult.warnings,
        source_metadata: {
          result_source: displayResult.source,
          parser_version: displayResult.parser_version,
          preview_draft_id:
            displayResult.runtimeResult?.preview_draft_id ??
            displayResult.storedDraftResult?.draft.preview_draft_id ??
            null,
          input_fingerprint:
            displayResult.runtimeResult?.input_fingerprint ??
            displayResult.storedDraftResult?.draft.input_fingerprint ??
            null,
          created_at:
            displayResult.runtimeResult?.created_at ??
            displayResult.storedDraftResult?.draft.created_at ??
            null,
          persisted_preview_draft:
            displayResult.runtimeResult?.persisted_preview_draft ??
            Boolean(displayResult.storedDraftResult),
          operator_preview_label:
            displayResult.storedDraftResult?.draft.operator_note_label ??
            (operatorPreviewLabel.trim() || null),
        },
        target_label: "manual Research Candidate Review follow-up",
      })
    : null;
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
          <h2>Manual Research Candidate Preview</h2>
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
            onClick={() => void handleCreateRuntimePreviewDraft()}
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
            onClick={manualNoteRuntime.actions.clearRuntimeResult}
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
        controls={draftListControls}
        isLoading={isPreviewDraftsLoading}
        error={previewDraftsError}
        openedPreviewDraftId={openedPreviewDraft?.draft.preview_draft_id ?? null}
        openingPreviewDraftId={openingPreviewDraftId}
        discardingPreviewDraftId={discardingPreviewDraftId}
        confirmDiscardPreviewDraftId={confirmDiscardPreviewDraftId}
        labelEditState={draftLabelEditState}
        savingDraftLabelId={savingDraftLabelId}
        onRefresh={() => void manualNoteRuntime.actions.refreshPreviewDrafts()}
        onChangeLifecycle={
          manualNoteRuntime.filterActions.updateDraftLifecycleFilter
        }
        onChangeSort={manualNoteRuntime.filterActions.updateDraftSort}
        onChangeWarnings={
          manualNoteRuntime.filterActions.updateDraftWarningFilter
        }
        onChangeCandidates={
          manualNoteRuntime.filterActions.updateDraftCandidateFilter
        }
        onChangeLimit={manualNoteRuntime.filterActions.updateDraftListLimit}
        onOpen={(previewDraftId) => void handleOpenPreviewDraft(previewDraftId)}
        onDiscard={(previewDraftId) =>
          void manualNoteRuntime.actions.discardPreviewDraft(previewDraftId)
        }
        onCancelDiscard={manualNoteRuntime.actions.cancelDiscardPreviewDraft}
        onStartLabelEdit={manualNoteRuntime.actions.startDraftLabelEdit}
        onChangeLabelEdit={manualNoteRuntime.actions.updateDraftLabelEditValue}
        onSaveLabelEdit={(previewDraftId) =>
          void manualNoteRuntime.actions.saveDraftLabel(previewDraftId)
        }
        onCancelLabelEdit={manualNoteRuntime.actions.cancelDraftLabelEdit}
        onClearLabelEdit={manualNoteRuntime.actions.clearDraftLabelEditValue}
      />

      {displayResult && preview && session ? (
        <div className="perspective-detail-stack">
          <ManualNoteResultSummary
            displayResult={displayResult}
            parseCount={parseCount}
          />

          {handoffSeed ? (
            <ResearchCandidateManualNoteHandoffSeedPreview seed={handoffSeed} />
          ) : null}

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
            onLoad={(previewDraftId) =>
              void manualNoteRuntime.actions.loadPreviewDraftActivity(
                previewDraftId,
              )
            }
          />
          <PromotionReadinessPreflightReadout
            storedDraftResult={displayResult.storedDraftResult}
            preflightResult={promotionReadinessPreflight}
            activityResult={previewDraftActivity}
            isLoadingDraftId={loadingPromotionReadinessPreflightId}
            error={promotionReadinessPreflightError}
            onLoad={(previewDraftId) =>
              void manualNoteRuntime.actions.loadPromotionReadinessPreflight(
                previewDraftId,
              )
            }
          />
          <PromotionDryRunPlanReadout
            storedDraftResult={displayResult.storedDraftResult}
            dryRunPlanResult={promotionDryRunPlan}
            isLoadingDraftId={loadingPromotionDryRunPlanId}
            error={promotionDryRunPlanError}
            onLoad={(previewDraftId) =>
              void manualNoteRuntime.actions.loadPromotionDryRunPlan(
                previewDraftId,
              )
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
