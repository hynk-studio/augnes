"use client";

import type {
  ManualNotePreviewDraftActivityItem,
  ManualNotePreviewDraftActivityResponse,
  ManualNotePreviewDraftDetailOkResponse,
} from "@/lib/research-candidate-review/manual-note-runtime-preview";

const ACTIVITY_TYPE_LABELS: Record<
  ManualNotePreviewDraftActivityItem["activity_type"],
  string
> = {
  preview_draft_created: "Created preview draft",
  label_updated: "Label updated",
  label_cleared: "Label cleared",
  preview_draft_discarded: "Discarded preview draft",
};

type PreviewDraftActivityReadoutProps = {
  storedDraftResult: ManualNotePreviewDraftDetailOkResponse | null;
  activityResult: ManualNotePreviewDraftActivityResponse | null;
  isLoadingDraftId: string | null;
  error: string | null;
  onLoad: (previewDraftId: string) => void;
};

export function PreviewDraftActivityReadout({
  storedDraftResult,
  activityResult,
  isLoadingDraftId,
  error,
  onLoad,
}: PreviewDraftActivityReadoutProps) {
  if (!storedDraftResult) return null;

  const previewDraftId = storedDraftResult.draft.preview_draft_id;
  const isLoading = isLoadingDraftId === previewDraftId;
  const isCurrentActivity =
    activityResult?.ok === true &&
    activityResult.preview_draft_id === previewDraftId;
  const activityItems = isCurrentActivity ? activityResult.items : [];

  return (
    <section
      className="perspective-inspector-section manual-note-preview-draft-activity"
      aria-label="Preview draft activity"
    >
      <div className="manual-note-preview-draft-activity-header">
        <div>
          <h3>Preview draft activity</h3>
          <p>Activity is preview-draft metadata only.</p>
        </div>
        <button
          type="button"
          className="secondary-button"
          disabled={isLoading}
          onClick={() => onLoad(previewDraftId)}
        >
          {isLoading
            ? "Loading activity..."
            : isCurrentActivity
              ? "Refresh activity"
              : "Load activity"}
        </button>
      </div>
      <ul className="manual-note-label-boundary-copy">
        <li>Activity is preview-draft metadata only.</li>
        <li>Activity does not approve, reject, defer, promote, or canonize this draft.</li>
        <li>Raw note text is not stored or recoverable.</li>
      </ul>
      {error ? (
        <p className="manual-note-runtime-error" role="alert">
          {error}
        </p>
      ) : null}
      {isCurrentActivity ? (
        <>
          <div className="perspective-workbench-status-row">
            <span>
              lifecycle_status <code>{activityResult.lifecycle_status}</code>
            </span>
            <span>
              count <code>{activityResult.count}</code>
            </span>
            <span>
              limit <code>{activityResult.limit}</code>
            </span>
            <span>
              activity_actions{" "}
              <code>{activityResult.runtime_boundary.activity_actions}</code>
            </span>
            <span>
              approval_workflow_created{" "}
              <code>
                {String(activityResult.runtime_boundary.approval_workflow_created)}
              </code>
            </span>
            <span>
              reject_defer_promote_workflow_created{" "}
              <code>
                {String(
                  activityResult.runtime_boundary
                    .reject_defer_promote_workflow_created,
                )}
              </code>
            </span>
          </div>
          {activityItems.length === 0 ? (
            <p>No activity metadata recorded for this preview draft yet.</p>
          ) : (
            <div className="manual-note-preview-draft-activity-list">
              {activityItems.map((item) => (
                <PreviewDraftActivityItemCard key={item.activity_id} item={item} />
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="manual-note-runtime-hint">
          Load activity to inspect create, label, and discard lifecycle metadata
          for this preview draft. Open/load activity is not persisted as an activity row.
        </p>
      )}
    </section>
  );
}

function PreviewDraftActivityItemCard({
  item,
}: {
  item: ManualNotePreviewDraftActivityItem;
}) {
  const beforeLabel = getActivityOperatorLabel(item.before_json);
  const afterLabel = getActivityOperatorLabel(item.after_json);
  const afterDiscardReason = getStringRecordValue(
    item.after_json,
    "discard_reason",
  );

  return (
    <article className="cockpit-surface-card manual-note-preview-draft-activity-card">
      <div className="manual-note-preview-draft-title-row">
        <div>
          <strong>{ACTIVITY_TYPE_LABELS[item.activity_type]}</strong>
          <small>{item.activity_type}</small>
        </div>
        <span className="status-pill">metadata-only</span>
      </div>
      <p>{item.summary}</p>
      <div className="manual-note-preview-draft-grid">
        <span>
          activity_at <code>{item.activity_at}</code>
        </span>
        <span>
          activity_by <code>{item.activity_by}</code>
        </span>
        <span>
          activity_id{" "}
          <code title={item.activity_id}>{shortenMiddle(item.activity_id)}</code>
        </span>
        <span>
          preview_draft_id{" "}
          <code title={item.preview_draft_id}>
            {shortenMiddle(item.preview_draft_id)}
          </code>
        </span>
        <span>
          activity_is_preview_metadata_only{" "}
          <code>{String(item.authority.activity_is_preview_metadata_only)}</code>
        </span>
        <span>
          raw_manual_note_text_returned{" "}
          <code>{String(item.authority.raw_manual_note_text_returned)}</code>
        </span>
      </div>
      {beforeLabel || afterLabel || afterDiscardReason ? (
        <div className="manual-note-preview-draft-activity-delta">
          {beforeLabel ? (
            <span>
              before_label <code>{beforeLabel}</code>
            </span>
          ) : null}
          {afterLabel ? (
            <span>
              after_label <code>{afterLabel}</code>
            </span>
          ) : null}
          {afterDiscardReason ? (
            <span>
              discard_reason <code>{afterDiscardReason}</code>
            </span>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function shortenMiddle(value: string, leading = 22, trailing = 10) {
  if (value.length <= leading + trailing + 3) {
    return value;
  }

  return `${value.slice(0, leading)}...${value.slice(-trailing)}`;
}

function getActivityOperatorLabel(record: Record<string, unknown>) {
  if (!Object.prototype.hasOwnProperty.call(record, "operator_note_label")) {
    return null;
  }

  const label = record.operator_note_label;
  if (typeof label === "string" && label.trim().length > 0) {
    return label;
  }

  if (label === null) {
    return "none";
  }

  return "not recorded";
}

function getStringRecordValue(record: Record<string, unknown>, key: string) {
  if (!Object.prototype.hasOwnProperty.call(record, key)) {
    return null;
  }

  const value = record[key];
  return typeof value === "string" && value.trim().length > 0
    ? value
    : "none";
}
