"use client";

import {
  MAX_MANUAL_NOTE_PREVIEW_DRAFT_LABEL_LENGTH,
  type ManualNotePreviewDraftListItem,
} from "@/lib/research-candidate-review/manual-note-runtime-preview";

export type DraftLabelEditState = {
  previewDraftId: string;
  value: string;
  error: string | null;
};

type PreviewDraftLabelControlsProps = {
  item: ManualNotePreviewDraftListItem;
  labelEditState: DraftLabelEditState | null;
  isSavingLabel: boolean;
  onChangeLabelEdit: (value: string) => void;
  onSaveLabelEdit: (previewDraftId: string) => void;
  onCancelLabelEdit: () => void;
  onClearLabelEdit: () => void;
};

export function PreviewDraftLabelControls({
  item,
  labelEditState,
  isSavingLabel,
  onChangeLabelEdit,
  onSaveLabelEdit,
  onCancelLabelEdit,
  onClearLabelEdit,
}: PreviewDraftLabelControlsProps) {
  const editedLabelValue = labelEditState?.value ?? "";
  const editedLabelTrimmed = editedLabelValue.trim();
  const labelIsTooLong =
    editedLabelTrimmed.length > MAX_MANUAL_NOTE_PREVIEW_DRAFT_LABEL_LENGTH;
  const labelIsUnchanged =
    editedLabelTrimmed === (item.operator_note_label ?? "");

  return (
    <div className="manual-note-preview-draft-label-edit">
      <label>
        <span>Edit label</span>
        <input
          value={editedLabelValue}
          onChange={(event) => onChangeLabelEdit(event.currentTarget.value)}
          maxLength={MAX_MANUAL_NOTE_PREVIEW_DRAFT_LABEL_LENGTH}
          placeholder="Untitled preview draft"
          disabled={isSavingLabel}
        />
      </label>
      <small>
        {editedLabelTrimmed.length}/
        {MAX_MANUAL_NOTE_PREVIEW_DRAFT_LABEL_LENGTH} characters. Labels are operator-facing preview metadata only.
      </small>
      {labelEditState?.error ? (
        <p className="manual-note-runtime-error" role="alert">
          {labelEditState.error}
        </p>
      ) : null}
      <div className="manual-note-preview-draft-label-actions">
        <button
          type="button"
          className="secondary-button"
          disabled={isSavingLabel || labelIsUnchanged || labelIsTooLong}
          onClick={() => onSaveLabelEdit(item.preview_draft_id)}
        >
          {isSavingLabel ? "Saving label..." : "Save label"}
        </button>
        <button
          type="button"
          className="secondary-button"
          disabled={isSavingLabel}
          onClick={onCancelLabelEdit}
        >
          Cancel
        </button>
        <button
          type="button"
          className="secondary-button"
          disabled={isSavingLabel || editedLabelValue.length === 0}
          onClick={onClearLabelEdit}
        >
          Clear label
        </button>
      </div>
    </div>
  );
}
