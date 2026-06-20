"use client";

import { PreviewDraftCard } from "@/components/research-candidate-preview-draft-card";
import type { DraftLabelEditState } from "@/components/research-candidate-preview-draft-label-controls";
import type {
  ManualNotePreviewDraftCandidateFilter,
  ManualNotePreviewDraftListItem,
  ManualNotePreviewDraftListLifecycleFilter,
  ManualNotePreviewDraftListSort,
  ManualNotePreviewDraftListSummary,
  ManualNotePreviewDraftWarningFilter,
} from "@/lib/research-candidate-review/manual-note-runtime-preview";

export const DRAFT_LIST_LIMIT_OPTIONS = [10, 25, 50] as const;

const LIFECYCLE_FILTER_LABELS: Record<
  ManualNotePreviewDraftListLifecycleFilter,
  string
> = {
  active: "Active only",
  discarded: "Discarded only",
  all: "All preview drafts",
};

const SORT_LABELS: Record<ManualNotePreviewDraftListSort, string> = {
  created_desc: "Newest first",
  created_asc: "Oldest first",
};

const WARNING_FILTER_LABELS: Record<ManualNotePreviewDraftWarningFilter, string> =
  {
    all: "All warning states",
    with_warnings: "Warnings only",
    without_warnings: "No warnings",
  };

const CANDIDATE_FILTER_LABELS: Record<ManualNotePreviewDraftCandidateFilter, string> =
  {
    all: "All candidate counts",
    with_candidates: "Has candidates",
    without_candidates: "No candidates",
  };

export type DraftListControls = {
  lifecycle: ManualNotePreviewDraftListLifecycleFilter;
  sort: ManualNotePreviewDraftListSort;
  warnings: ManualNotePreviewDraftWarningFilter;
  candidates: ManualNotePreviewDraftCandidateFilter;
  limit: (typeof DRAFT_LIST_LIMIT_OPTIONS)[number];
};

type RecentPreviewDraftsPanelProps = {
  items: ManualNotePreviewDraftListItem[];
  summary: ManualNotePreviewDraftListSummary | null;
  controls: DraftListControls;
  isLoading: boolean;
  error: string | null;
  openedPreviewDraftId: string | null;
  openingPreviewDraftId: string | null;
  discardingPreviewDraftId: string | null;
  confirmDiscardPreviewDraftId: string | null;
  labelEditState: DraftLabelEditState | null;
  savingDraftLabelId: string | null;
  onRefresh: () => void;
  onChangeLifecycle: (
    lifecycle: ManualNotePreviewDraftListLifecycleFilter,
  ) => void;
  onChangeSort: (sort: ManualNotePreviewDraftListSort) => void;
  onChangeWarnings: (warnings: ManualNotePreviewDraftWarningFilter) => void;
  onChangeCandidates: (candidates: ManualNotePreviewDraftCandidateFilter) => void;
  onChangeLimit: (limit: DraftListControls["limit"]) => void;
  onOpen: (previewDraftId: string) => void;
  onDiscard: (previewDraftId: string) => void;
  onCancelDiscard: () => void;
  onStartLabelEdit: (item: ManualNotePreviewDraftListItem) => void;
  onChangeLabelEdit: (value: string) => void;
  onSaveLabelEdit: (previewDraftId: string) => void;
  onCancelLabelEdit: () => void;
  onClearLabelEdit: () => void;
};

export function RecentPreviewDraftsPanel({
  items,
  summary,
  controls,
  isLoading,
  error,
  openedPreviewDraftId,
  openingPreviewDraftId,
  discardingPreviewDraftId,
  confirmDiscardPreviewDraftId,
  labelEditState,
  savingDraftLabelId,
  onRefresh,
  onChangeLifecycle,
  onChangeSort,
  onChangeWarnings,
  onChangeCandidates,
  onChangeLimit,
  onOpen,
  onDiscard,
  onCancelDiscard,
  onStartLabelEdit,
  onChangeLabelEdit,
  onSaveLabelEdit,
  onCancelLabelEdit,
  onClearLabelEdit,
}: RecentPreviewDraftsPanelProps) {
  const isDefaultEmptyState =
    controls.lifecycle === "active" &&
    controls.warnings === "all" &&
    controls.candidates === "all";

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
      </div>

      <div
        className="manual-note-preview-drafts-actions"
        aria-label="Preview draft list filters"
      >
        <label>
          <span>Lifecycle filter</span>
          <select
            value={controls.lifecycle}
            onChange={(event) =>
              onChangeLifecycle(
                event.currentTarget
                  .value as ManualNotePreviewDraftListLifecycleFilter,
              )
            }
          >
            {typedEntries(LIFECYCLE_FILTER_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Sort order</span>
          <select
            value={controls.sort}
            onChange={(event) =>
              onChangeSort(
                event.currentTarget.value as ManualNotePreviewDraftListSort,
              )
            }
          >
            {typedEntries(SORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Warning filter</span>
          <select
            value={controls.warnings}
            onChange={(event) =>
              onChangeWarnings(
                event.currentTarget.value as ManualNotePreviewDraftWarningFilter,
              )
            }
          >
            {typedEntries(WARNING_FILTER_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Candidate filter</span>
          <select
            value={controls.candidates}
            onChange={(event) =>
              onChangeCandidates(
                event.currentTarget
                  .value as ManualNotePreviewDraftCandidateFilter,
              )
            }
          >
            {typedEntries(CANDIDATE_FILTER_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Limit selector</span>
          <select
            value={String(controls.limit)}
            onChange={(event) =>
              onChangeLimit(
                Number(event.currentTarget.value) as DraftListControls["limit"],
              )
            }
          >
            {DRAFT_LIST_LIMIT_OPTIONS.map((limit) => (
              <option key={limit} value={limit}>
                {limit}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="secondary-button" onClick={onRefresh}>
          {isLoading ? "Refreshing preview drafts..." : "Refresh preview drafts"}
        </button>
      </div>

      <p className="manual-note-preview-drafts-summary">
        {formatDraftListFilterSummary(controls)}
      </p>
      <PreviewDraftListSummaryBadges summary={summary} />
      <ul className="manual-note-label-boundary-copy">
        <li>Counts are preview-list metadata only.</li>
        <li>
          Counts do not approve, reject, defer, promote, or canonize drafts.
        </li>
        <li>Activity count is lifecycle metadata, not proof or evidence.</li>
      </ul>
      <p className="manual-note-runtime-hint">
        Include discarded by choosing All preview drafts. Discarded only shows
        discarded lifecycle records with discard disabled.
      </p>

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
          {isDefaultEmptyState
            ? "No active runtime preview drafts yet."
            : "No preview drafts match the current filters."}
        </p>
      ) : (
        <div className="manual-note-preview-drafts-list">
          {items.map((item) => (
            <PreviewDraftCard
              key={item.preview_draft_id}
              item={item}
              isOpen={openedPreviewDraftId === item.preview_draft_id}
              isOpening={openingPreviewDraftId === item.preview_draft_id}
              isDiscarding={discardingPreviewDraftId === item.preview_draft_id}
              isConfirmingDiscard={
                confirmDiscardPreviewDraftId === item.preview_draft_id
              }
              labelEditState={labelEditState}
              isSavingLabel={savingDraftLabelId === item.preview_draft_id}
              onOpen={onOpen}
              onDiscard={onDiscard}
              onCancelDiscard={onCancelDiscard}
              onStartLabelEdit={onStartLabelEdit}
              onChangeLabelEdit={onChangeLabelEdit}
              onSaveLabelEdit={onSaveLabelEdit}
              onCancelLabelEdit={onCancelLabelEdit}
              onClearLabelEdit={onClearLabelEdit}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function PreviewDraftListSummaryBadges({
  summary,
}: {
  summary: ManualNotePreviewDraftListSummary | null;
}) {
  if (!summary) {
    return (
      <p className="manual-note-runtime-hint">
        Refresh preview drafts to load bounded lifecycle summary counts.
      </p>
    );
  }

  return (
    <div
      className="manual-note-preview-draft-summary-badges"
      aria-label="Preview draft list lifecycle summary counts"
    >
      <span>Active: {summary.active_count}</span>
      <span>Discarded: {summary.discarded_count}</span>
      <span>With warnings: {summary.with_warnings_count}</span>
      <span>With candidates: {summary.with_candidates_count}</span>
      <span>Activity recorded: {summary.activity_recorded_count}</span>
      <span>Untitled: {summary.label_missing_count}</span>
      <span>Returned: {summary.returned_count}</span>
      <span>Scope: {summary.summary_scope}</span>
    </div>
  );
}

function typedEntries<T extends Record<string, string>>(record: T) {
  return Object.entries(record) as [keyof T, T[keyof T]][];
}

function formatDraftListFilterSummary(controls: DraftListControls) {
  const lifecycleSummary: Record<
    ManualNotePreviewDraftListLifecycleFilter,
    string
  > = {
    active: "active preview drafts",
    discarded: "discarded preview drafts",
    all: "all preview drafts",
  };
  const sortSummary: Record<ManualNotePreviewDraftListSort, string> = {
    created_desc: "newest first",
    created_asc: "oldest first",
  };
  const warningSummary: Record<ManualNotePreviewDraftWarningFilter, string> = {
    all: "all warning states",
    with_warnings: "warnings only",
    without_warnings: "no warnings",
  };
  const candidateSummary: Record<ManualNotePreviewDraftCandidateFilter, string> =
    {
      all: "all candidate counts",
      with_candidates: "has candidates",
      without_candidates: "no candidates",
    };

  return `Showing ${lifecycleSummary[controls.lifecycle]}, ${
    sortSummary[controls.sort]
  }, ${warningSummary[controls.warnings]}, ${
    candidateSummary[controls.candidates]
  }. Limit ${controls.limit}.`;
}
