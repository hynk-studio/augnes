"use client";

import { parseManualResearchNoteToPreview } from "@/lib/research-candidate-review/manual-note-parser";
import type {
  ManualResearchNoteParserResult,
  ManualResearchNoteParserWarning,
} from "@/lib/research-candidate-review/manual-note-parser";
import {
  MANUAL_NOTE_PREVIEW_DRAFTS_ROUTE,
  MANUAL_NOTE_PREVIEW_ROUTE,
  buildManualNotePreviewDraftDetailRoute,
  buildManualNotePreviewDraftDiscardRoute,
  type ManualNotePreviewDraftDetailOkResponse,
  type ManualNotePreviewDraftDetailResponse,
  type ManualNotePreviewDraftDiscardResponse,
  type ManualNotePreviewDraftListItem,
  type ManualNotePreviewDraftListResponse,
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
  const [parserResult, setParserResult] =
    useState<ManualResearchNoteParserResult | null>(null);
  const [runtimeResult, setRuntimeResult] =
    useState<ManualNotePreviewRuntimeOkResponse | null>(null);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [isRuntimeLoading, setIsRuntimeLoading] = useState(false);
  const [previewDraftItems, setPreviewDraftItems] = useState<
    ManualNotePreviewDraftListItem[]
  >([]);
  const [includeDiscardedDrafts, setIncludeDiscardedDrafts] = useState(false);
  const [previewDraftsError, setPreviewDraftsError] = useState<string | null>(
    null,
  );
  const [isPreviewDraftsLoading, setIsPreviewDraftsLoading] = useState(false);
  const [openedPreviewDraft, setOpenedPreviewDraft] =
    useState<ManualNotePreviewDraftDetailOkResponse | null>(null);
  const [openingPreviewDraftId, setOpeningPreviewDraftId] = useState<
    string | null
  >(null);
  const [discardingPreviewDraftId, setDiscardingPreviewDraftId] = useState<
    string | null
  >(null);
  const [confirmDiscardPreviewDraftId, setConfirmDiscardPreviewDraftId] =
    useState<string | null>(null);
  const [parseCount, setParseCount] = useState(0);

  const inputHasText = manualNoteText.trim().length > 0;
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
    setRuntimeError(null);
    setIsRuntimeLoading(false);
    setParseCount((currentCount) => currentCount + 1);
  }

  async function createRuntimePreviewDraft() {
    if (!inputHasText || isRuntimeLoading) return;

    setIsRuntimeLoading(true);
    setRuntimeError(null);

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
          operator_note_label: "Cockpit manual pasted note preview",
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
      void refreshPreviewDrafts(includeDiscardedDrafts);
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
    setRuntimeError(null);
    setIsRuntimeLoading(false);
    setParseCount(0);
  }

  function clearManualNote() {
    setManualNoteText("");
    setParserResult(null);
    setRuntimeResult(null);
    setOpenedPreviewDraft(null);
    setRuntimeError(null);
    setIsRuntimeLoading(false);
    setParseCount(0);
  }

  function clearRuntimeResult() {
    setRuntimeResult(null);
    setOpenedPreviewDraft(null);
    setRuntimeError(null);
    setIsRuntimeLoading(false);
  }

  async function refreshPreviewDrafts(includeDiscarded = includeDiscardedDrafts) {
    setIsPreviewDraftsLoading(true);
    setPreviewDraftsError(null);
    setConfirmDiscardPreviewDraftId(null);

    try {
      const params = new URLSearchParams({
        limit: "10",
        include_discarded: String(includeDiscarded),
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
      setRuntimeError(null);
      setIsRuntimeLoading(false);
    } catch {
      setPreviewDraftsError("Preview draft detail route is unavailable.");
    } finally {
      setOpeningPreviewDraftId(null);
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
            discard_metadata: result.discard_metadata,
          },
        };
      });
      setConfirmDiscardPreviewDraftId(null);
      await refreshPreviewDrafts(includeDiscardedDrafts);
    } catch {
      setPreviewDraftsError("Preview draft discard route is unavailable.");
    } finally {
      setDiscardingPreviewDraftId(null);
    }
  }

  function toggleIncludeDiscardedDrafts(checked: boolean) {
    setIncludeDiscardedDrafts(checked);
    void refreshPreviewDrafts(checked);
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
            disabled={!inputHasText || isRuntimeLoading}
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

      <RecentPreviewDraftsPanel
        items={previewDraftItems}
        includeDiscarded={includeDiscardedDrafts}
        isLoading={isPreviewDraftsLoading}
        error={previewDraftsError}
        openedPreviewDraftId={openedPreviewDraft?.draft.preview_draft_id ?? null}
        openingPreviewDraftId={openingPreviewDraftId}
        discardingPreviewDraftId={discardingPreviewDraftId}
        confirmDiscardPreviewDraftId={confirmDiscardPreviewDraftId}
        onRefresh={() => void refreshPreviewDrafts(includeDiscardedDrafts)}
        onToggleIncludeDiscarded={toggleIncludeDiscardedDrafts}
        onOpen={(previewDraftId) => void openPreviewDraft(previewDraftId)}
        onDiscard={(previewDraftId) => void discardPreviewDraft(previewDraftId)}
        onCancelDiscard={() => setConfirmDiscardPreviewDraftId(null)}
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

function RecentPreviewDraftsPanel({
  items,
  includeDiscarded,
  isLoading,
  error,
  openedPreviewDraftId,
  openingPreviewDraftId,
  discardingPreviewDraftId,
  confirmDiscardPreviewDraftId,
  onRefresh,
  onToggleIncludeDiscarded,
  onOpen,
  onDiscard,
  onCancelDiscard,
}: {
  items: ManualNotePreviewDraftListItem[];
  includeDiscarded: boolean;
  isLoading: boolean;
  error: string | null;
  openedPreviewDraftId: string | null;
  openingPreviewDraftId: string | null;
  discardingPreviewDraftId: string | null;
  confirmDiscardPreviewDraftId: string | null;
  onRefresh: () => void;
  onToggleIncludeDiscarded: (checked: boolean) => void;
  onOpen: (previewDraftId: string) => void;
  onDiscard: (previewDraftId: string) => void;
  onCancelDiscard: () => void;
}) {
  return (
    <section
      className="perspective-inspector-section manual-note-preview-drafts"
      aria-label="Recent runtime preview drafts"
    >
      <div className="manual-note-preview-drafts-header">
        <div>
          <h3>Recent runtime preview drafts</h3>
          <p>
            Stored parsed preview only. Raw note text not stored. These are
            non-canonical preview drafts only.
          </p>
        </div>
        <div className="manual-note-preview-drafts-actions">
          <button type="button" className="secondary-button" onClick={onRefresh}>
            {isLoading ? "Refreshing preview drafts..." : "Refresh preview drafts"}
          </button>
          <label>
            <input
              type="checkbox"
              checked={includeDiscarded}
              onChange={(event) =>
                onToggleIncludeDiscarded(event.currentTarget.checked)
              }
            />
            Show discarded
          </label>
        </div>
      </div>

      <p className="manual-note-runtime-hint">
        Opening a stored preview draft reads persisted preview JSON and metadata.
        It does not re-parse, fetch sources, call a provider, create work items,
        or promote Perspective state.
      </p>

      {error ? (
        <p className="manual-note-runtime-error" role="alert">
          {error}
        </p>
      ) : null}

      {items.length === 0 ? (
        <p>
          {includeDiscarded
            ? "No runtime preview drafts yet."
            : "No active runtime preview drafts yet."}
        </p>
      ) : (
        <div className="manual-note-preview-drafts-list">
          {items.map((item) => {
            const isDiscarded =
              item.lifecycle_status === "discarded_preview_draft";
            const isOpen = openedPreviewDraftId === item.preview_draft_id;
            const isOpening = openingPreviewDraftId === item.preview_draft_id;
            const isDiscarding =
              discardingPreviewDraftId === item.preview_draft_id;
            const isConfirming =
              confirmDiscardPreviewDraftId === item.preview_draft_id;

            return (
              <article
                key={item.preview_draft_id}
                className="cockpit-surface-card manual-note-preview-draft-card"
              >
                <div className="meta-row">
                  <span>
                    preview_draft_id{" "}
                    <code title={item.preview_draft_id}>
                      {shortenMiddle(item.preview_draft_id)}
                    </code>
                  </span>
                  <span>
                    {isDiscarded ? "Discarded preview draft" : "Active preview draft"}
                  </span>
                  {isOpen ? <span>open</span> : null}
                </div>
                <div className="manual-note-preview-draft-grid">
                  <span>
                    created_at <code>{item.created_at}</code>
                  </span>
                  <span>
                    operator_note_label{" "}
                    <code>{item.operator_note_label ?? "none"}</code>
                  </span>
                  <span>
                    input_fingerprint{" "}
                    <code title={item.input_fingerprint}>
                      {shortenMiddle(item.input_fingerprint)}
                    </code>
                  </span>
                  <span>
                    parser_version <code>{item.parser_version}</code>
                  </span>
                  <span>
                    preview_version <code>{item.preview_version}</code>
                  </span>
                  <span>
                    warnings <code>{item.warning_count}</code>
                  </span>
                  <span>
                    candidates{" "}
                    <code>{formatCandidateCountSummary(item)}</code>
                  </span>
                  <span>
                    lifecycle_status <code>{item.lifecycle_status}</code>
                  </span>
                </div>
                {item.discard_metadata ? (
                  <p className="manual-note-runtime-hint">
                    discarded_at <code>{item.discard_metadata.discarded_at}</code>
                    {" "}reason{" "}
                    <code>{item.discard_metadata.discard_reason || "none"}</code>
                  </p>
                ) : null}
                <div className="manual-note-preview-draft-controls">
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={isOpening || isDiscarding}
                    onClick={() => onOpen(item.preview_draft_id)}
                  >
                    {isOpening ? "Opening preview draft..." : "Open preview draft"}
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={isDiscarded || isOpening || isDiscarding}
                    onClick={() => onDiscard(item.preview_draft_id)}
                  >
                    {isDiscarding
                      ? "Discarding preview draft..."
                      : isConfirming
                        ? "Confirm discard preview draft"
                        : "Discard preview draft"}
                  </button>
                  {isConfirming ? (
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={isDiscarding}
                      onClick={onCancelDiscard}
                    >
                      Cancel discard
                    </button>
                  ) : null}
                </div>
                <p className="manual-note-runtime-hint">
                  Discard only marks this preview draft as no longer active; it
                  does not delete canonical state because the draft never created
                  canonical state.
                </p>
              </article>
            );
          })}
        </div>
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

function RuntimeMetadataSummary({
  runtimeResult,
  storedDraftResult,
}: {
  runtimeResult: ManualNotePreviewRuntimeOkResponse | null;
  storedDraftResult: ManualNotePreviewDraftDetailOkResponse | null;
}) {
  if (!runtimeResult && !storedDraftResult) return null;

  if (storedDraftResult) {
    const draft = storedDraftResult.draft;

    return (
      <section
        className="perspective-inspector-section manual-note-runtime-summary"
        aria-label="Stored preview draft metadata"
      >
        <h3>Stored preview draft metadata</h3>
        <div className="perspective-workbench-status-row">
          <span>
            runtime_version <code>{storedDraftResult.runtime_version}</code>
          </span>
          <span>
            preview_draft_id <code>{draft.preview_draft_id}</code>
          </span>
          <span>
            lifecycle_status <code>{storedDraftResult.lifecycle_status}</code>
          </span>
          <span>
            input_fingerprint <code>{draft.input_fingerprint}</code>
          </span>
          <span>
            parser_version <code>{draft.parser_version}</code>
          </span>
          <span>
            preview_version <code>{draft.preview_version}</code>
          </span>
          <span>
            warning_count <code>{draft.warning_count}</code>
          </span>
          <span>
            candidate_count_summary{" "}
            <code>{formatCandidateCountSummary(draft)}</code>
          </span>
          <span>
            manual_note_text_stored{" "}
            <code>{String(draft.manual_note_text_stored)}</code>
          </span>
          <span>
            created_at <code>{draft.created_at}</code>
          </span>
          {storedDraftResult.discard_metadata ? (
            <span>
              discarded_at{" "}
              <code>{storedDraftResult.discard_metadata.discarded_at}</code>
            </span>
          ) : null}
        </div>
      </section>
    );
  }

  const activeRuntimeResult = runtimeResult;
  if (!activeRuntimeResult) return null;

  return (
    <section
      className="perspective-inspector-section manual-note-runtime-summary"
      aria-label="Runtime preview draft metadata"
    >
      <h3>Runtime preview draft metadata</h3>
      <div className="perspective-workbench-status-row">
        <span>
          runtime_version <code>{activeRuntimeResult.runtime_version}</code>
        </span>
        <span>
          input_fingerprint <code>{activeRuntimeResult.input_fingerprint}</code>
        </span>
        <span>
          preview_draft_id{" "}
          <code>{activeRuntimeResult.preview_draft_id ?? "not persisted"}</code>
        </span>
        <span>
          persistence_mode <code>{activeRuntimeResult.persistence_mode}</code>
        </span>
        <span>
          persisted_preview_draft{" "}
          <code>{String(activeRuntimeResult.persisted_preview_draft)}</code>
        </span>
        <span>
          created_at <code>{activeRuntimeResult.created_at}</code>
        </span>
      </div>
    </section>
  );
}

function RuntimeBoundarySummary({
  runtimeResult,
  storedDraftResult,
}: {
  runtimeResult: ManualNotePreviewRuntimeOkResponse | null;
  storedDraftResult: ManualNotePreviewDraftDetailOkResponse | null;
}) {
  if (!runtimeResult && !storedDraftResult) return null;

  const routeBoundary =
    runtimeResult?.runtime_boundary ?? storedDraftResult?.runtime_boundary;
  const noSideEffects =
    runtimeResult?.no_side_effects ?? storedDraftResult?.no_side_effects;
  if (!routeBoundary || !noSideEffects) return null;

  return (
    <section
      className="perspective-inspector-section manual-note-runtime-boundary"
      aria-label="Runtime boundary and no side effects"
    >
      <h3>Runtime boundary</h3>
      <div className="perspective-workbench-status-row">
        {Object.entries(routeBoundary).map(([key, value]) => (
          <span key={key}>
            {key} <code>{String(value)}</code>
          </span>
        ))}
        {Object.entries(noSideEffects).map(([key, value]) => (
          <span key={key}>
            {key} <code>{String(value)}</code>
          </span>
        ))}
      </div>
      {storedDraftResult ? (
        <>
          <h4>Stored creation boundary</h4>
          <div className="perspective-workbench-status-row">
            {Object.entries(storedDraftResult.draft.stored_runtime_boundary).map(
              ([key, value]) => (
                <span key={key}>
                  {key} <code>{String(value)}</code>
                </span>
              ),
            )}
            {Object.entries(storedDraftResult.draft.stored_no_side_effects).map(
              ([key, value]) => (
                <span key={key}>
                  {key} <code>{String(value)}</code>
                </span>
              ),
            )}
          </div>
        </>
      ) : null}
    </section>
  );
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

function shortenMiddle(value: string, leading = 22, trailing = 10) {
  if (value.length <= leading + trailing + 3) {
    return value;
  }

  return `${value.slice(0, leading)}...${value.slice(-trailing)}`;
}

function formatCandidateCountSummary(item: {
  candidate_count_summary: ManualNotePreviewDraftListItem["candidate_count_summary"];
}) {
  const counts = item.candidate_count_summary;
  return [
    `total ${counts.total}`,
    `claims ${counts.claims}`,
    `evidence ${counts.evidence}`,
    `tensions ${counts.tensions}`,
    `gaps ${counts.knowledge_gaps}`,
    `deltas ${counts.perspective_deltas}`,
    `work ${counts.follow_up_work}`,
  ].join(", ");
}
