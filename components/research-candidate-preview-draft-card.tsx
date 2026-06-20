"use client";

import {
  type ManualNotePreviewDraftActivityItem,
  type ManualNotePreviewDraftListItem,
} from "@/lib/research-candidate-review/manual-note-runtime-preview";
import {
  PreviewDraftLabelControls,
  type DraftLabelEditState,
} from "@/components/research-candidate-preview-draft-label-controls";

const LAST_ACTIVITY_BADGE_LABELS: Record<
  ManualNotePreviewDraftActivityItem["activity_type"],
  string
> = {
  preview_draft_created: "created",
  label_updated: "label updated",
  label_cleared: "label cleared",
  preview_draft_discarded: "discarded",
};

type PreviewDraftCardProps = {
  item: ManualNotePreviewDraftListItem;
  isOpen: boolean;
  isOpening: boolean;
  isDiscarding: boolean;
  isConfirmingDiscard: boolean;
  labelEditState: DraftLabelEditState | null;
  isSavingLabel: boolean;
  onOpen: (previewDraftId: string) => void;
  onDiscard: (previewDraftId: string) => void;
  onCancelDiscard: () => void;
  onStartLabelEdit: (item: ManualNotePreviewDraftListItem) => void;
  onChangeLabelEdit: (value: string) => void;
  onSaveLabelEdit: (previewDraftId: string) => void;
  onCancelLabelEdit: () => void;
  onClearLabelEdit: () => void;
};

export function PreviewDraftCard({
  item,
  isOpen,
  isOpening,
  isDiscarding,
  isConfirmingDiscard,
  labelEditState,
  isSavingLabel,
  onOpen,
  onDiscard,
  onCancelDiscard,
  onStartLabelEdit,
  onChangeLabelEdit,
  onSaveLabelEdit,
  onCancelLabelEdit,
  onClearLabelEdit,
}: PreviewDraftCardProps) {
  const isDiscarded = item.lifecycle_status === "discarded_preview_draft";
  const isEditingLabel = labelEditState?.previewDraftId === item.preview_draft_id;
  const displayLabel = item.operator_note_label ?? "Untitled preview draft";
  const lifecycleSummary = item.lifecycle_summary;
  const lastActivityLabel = lifecycleSummary.last_activity_type
    ? LAST_ACTIVITY_BADGE_LABELS[lifecycleSummary.last_activity_type]
    : "none recorded";

  return (
    <article className="cockpit-surface-card manual-note-preview-draft-card">
      <div className="manual-note-preview-draft-title-row">
        <div>
          <strong>{displayLabel}</strong>
          <small>
            {item.operator_note_label
              ? "operator_note_label"
              : "generated fallback label"}
          </small>
        </div>
        <span className="status-pill">label-only metadata</span>
      </div>
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
      <div
        className="manual-note-preview-draft-badges"
        aria-label="Preview draft lifecycle summary badges"
      >
        <span>
          {lifecycleSummary.discard_state === "discarded"
            ? "Discarded preview draft"
            : "Active preview draft"}
        </span>
        <span>
          {lifecycleSummary.label_state === "labeled" ? "Labeled" : "Untitled"}
        </span>
        <span>Activity count {lifecycleSummary.activity_count}</span>
        <span>Last activity: {lastActivityLabel}</span>
        {lifecycleSummary.last_activity_at ? (
          <span>Last activity time {lifecycleSummary.last_activity_at}</span>
        ) : null}
        <span>Warnings {item.warning_count}</span>
        <span>Candidates {item.candidate_count_summary.total}</span>
      </div>
      <div className="manual-note-preview-draft-grid">
        <span>
          created_at <code>{item.created_at}</code>
        </span>
        <span>
          updated_at <code>{item.updated_at}</code>
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
          candidates <code>{formatCandidateCountSummary(item)}</code>
        </span>
        <span>
          lifecycle_status <code>{item.lifecycle_status}</code>
        </span>
      </div>
      {isEditingLabel ? (
        <PreviewDraftLabelControls
          item={item}
          labelEditState={labelEditState}
          isSavingLabel={isSavingLabel}
          onChangeLabelEdit={onChangeLabelEdit}
          onSaveLabelEdit={onSaveLabelEdit}
          onCancelLabelEdit={onCancelLabelEdit}
          onClearLabelEdit={onClearLabelEdit}
        />
      ) : null}
      {item.discard_metadata ? (
        <p className="manual-note-runtime-hint">
          discarded_at <code>{item.discard_metadata.discarded_at}</code> reason{" "}
          <code>{item.discard_metadata.discard_reason || "none"}</code>
        </p>
      ) : null}
      <div className="manual-note-preview-draft-controls">
        <button
          type="button"
          className="secondary-button"
          disabled={isEditingLabel || isOpening || isDiscarding || isSavingLabel}
          onClick={() => onStartLabelEdit(item)}
        >
          Edit label
        </button>
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
            : isConfirmingDiscard
              ? "Confirm discard preview draft"
              : "Discard preview draft"}
        </button>
        {isConfirmingDiscard ? (
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
        Label editing is metadata-only, including discarded preview drafts.
        Discard only marks this preview draft as no longer active; it does not
        delete canonical state because the draft never created canonical state.
      </p>
    </article>
  );
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
