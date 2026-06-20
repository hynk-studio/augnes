"use client";

import { useEffect, useMemo, useState } from "react";

type LocalPacketReviewChecklistItemId =
  | "source_refs_reviewed"
  | "parser_warnings_reviewed"
  | "block_gates_reviewed"
  | "warning_gates_reviewed"
  | "gate_explanations_reviewed"
  | "freshness_current_reviewed"
  | "copy_packet_reviewed"
  | "raw_note_absence_reviewed"
  | "boundary_reviewed"
  | "future_lane_needed_reviewed";

type LocalPacketReviewChecklistStatus =
  | "no_checklist_started"
  | "in_progress"
  | "complete"
  | "stale_for_current_packet";

type LocalPacketReviewChecklistItemDefinition = {
  id: LocalPacketReviewChecklistItemId;
  label: string;
  helper: string;
};

type LocalPacketReviewChecklistItemState = {
  checked: boolean;
  note: string;
};

type LocalPacketReviewChecklistProps = {
  currentPacketFingerprint: string | null;
  previewDraftId: string;
  preflightPreviewDraftId: string;
};

const CHECKLIST_ITEMS: LocalPacketReviewChecklistItemDefinition[] = [
  {
    id: "source_refs_reviewed",
    label: "Source references reviewed",
    helper: "Confirm the visible source reference summary was inspected.",
  },
  {
    id: "parser_warnings_reviewed",
    label: "Parser warnings reviewed",
    helper: "Confirm parser warning and critical warning signals were read.",
  },
  {
    id: "block_gates_reviewed",
    label: "Block gates reviewed",
    helper: "Confirm each block gate explanation was scanned.",
  },
  {
    id: "warning_gates_reviewed",
    label: "Warning gates reviewed",
    helper: "Confirm each warning gate explanation was scanned.",
  },
  {
    id: "gate_explanations_reviewed",
    label: "Gate explanations reviewed",
    helper: "Confirm safe actions and resolution boundaries were inspected.",
  },
  {
    id: "freshness_current_reviewed",
    label: "Packet freshness is current",
    helper: "Confirm the packet freshness readout matches the review need.",
  },
  {
    id: "copy_packet_reviewed",
    label: "Full packet copied or manual fallback reviewed",
    helper: "Confirm the local copy action or manual fallback was checked.",
  },
  {
    id: "raw_note_absence_reviewed",
    label: "Raw manual note text absence confirmed",
    helper: "Confirm packet preview/copy excludes raw pasted note text.",
  },
  {
    id: "boundary_reviewed",
    label: "Boundary/no-side-effect metadata reviewed",
    helper: "Confirm no-side-effect and authority metadata were scanned.",
  },
  {
    id: "future_lane_needed_reviewed",
    label: "Separate future lane needed, if applicable",
    helper: "Record whether unresolved work belongs in a separate future lane.",
  },
];

const EMPTY_ITEM_STATE = CHECKLIST_ITEMS.reduce(
  (items, item) => ({
    ...items,
    [item.id]: {
      checked: false,
      note: "",
    },
  }),
  {} as Record<LocalPacketReviewChecklistItemId, LocalPacketReviewChecklistItemState>,
);

const CHECKLIST_STATUS_LABELS: Record<
  LocalPacketReviewChecklistStatus,
  string
> = {
  no_checklist_started: "no_checklist_started",
  in_progress: "in_progress",
  complete: "complete",
  stale_for_current_packet: "stale_for_current_packet",
};

export function LocalPacketReviewChecklist({
  currentPacketFingerprint,
  previewDraftId,
  preflightPreviewDraftId,
}: LocalPacketReviewChecklistProps) {
  const [items, setItems] = useState(() => cloneEmptyItemState());
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [
    checklistStartedForPacketFingerprint,
    setChecklistStartedForPacketFingerprint,
  ] = useState<string | null>(null);

  useEffect(() => {
    setItems(cloneEmptyItemState());
    setReviewerNotes("");
    setChecklistStartedForPacketFingerprint(null);
  }, [previewDraftId, preflightPreviewDraftId]);

  const checkedCount = CHECKLIST_ITEMS.filter(
    (item) => items[item.id].checked,
  ).length;
  const localNotesCharacterCount = useMemo(
    () =>
      reviewerNotes.length +
      CHECKLIST_ITEMS.reduce(
        (total, item) => total + items[item.id].note.length,
        0,
      ),
    [items, reviewerNotes],
  );
  const checklistHasStarted =
    checkedCount > 0 ||
    localNotesCharacterCount > 0 ||
    Boolean(checklistStartedForPacketFingerprint);
  const checklistStatus = getChecklistStatus({
    checkedCount,
    totalCount: CHECKLIST_ITEMS.length,
    checklistHasStarted,
    checklistStartedForPacketFingerprint,
    currentPacketFingerprint,
  });

  function markChecklistStarted() {
    setChecklistStartedForPacketFingerprint((existing) => {
      if (existing) return existing;
      return currentPacketFingerprint ?? "unavailable";
    });
  }

  function updateItemChecked(
    itemId: LocalPacketReviewChecklistItemId,
    checked: boolean,
  ) {
    markChecklistStarted();
    setItems((currentItems) => ({
      ...currentItems,
      [itemId]: {
        ...currentItems[itemId],
        checked,
      },
    }));
  }

  function updateItemNote(
    itemId: LocalPacketReviewChecklistItemId,
    note: string,
  ) {
    markChecklistStarted();
    setItems((currentItems) => ({
      ...currentItems,
      [itemId]: {
        ...currentItems[itemId],
        note,
      },
    }));
  }

  function updateReviewerNotes(note: string) {
    markChecklistStarted();
    setReviewerNotes(note);
  }

  function resetChecklist() {
    setItems(cloneEmptyItemState());
    setReviewerNotes("");
    setChecklistStartedForPacketFingerprint(null);
  }

  return (
    <section
      className="manual-note-local-packet-review-checklist"
      aria-label="Local packet review checklist"
    >
      <div className="manual-note-local-packet-review-checklist-header">
        <div>
          <h4>Local packet review checklist</h4>
          <p>
            Checklist state is local to this screen only. It resets when the
            opened preview draft context changes.
          </p>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={resetChecklist}
        >
          Reset local checklist
        </button>
      </div>
      <ul className="manual-note-label-boundary-copy">
        <li>Checklist is local screen aid only.</li>
        <li>Checklist completion is not approval or promotion authority.</li>
        <li>Checklist notes are not stored, sent, shared, or persisted.</li>
        <li>
          No proof/evidence, Perspective, work item, provider, retrieval, source-fetch, Codex, or handoff action is run.
        </li>
      </ul>
      <div className="manual-note-local-packet-review-checklist-status">
        <span>
          checklist_status <code>{CHECKLIST_STATUS_LABELS[checklistStatus]}</code>
        </span>
        <span>
          checked_count <code>{checkedCount}</code>
        </span>
        <span>
          total_count <code>{CHECKLIST_ITEMS.length}</code>
        </span>
        <span>
          current_packet_fingerprint{" "}
          <code>{currentPacketFingerprint ?? "unavailable"}</code>
        </span>
        <span>
          checklist_started_for_packet_fingerprint{" "}
          <code>{checklistStartedForPacketFingerprint ?? "not started"}</code>
        </span>
        <span>
          local notes character count{" "}
          <code>{localNotesCharacterCount}</code>
        </span>
      </div>
      {checklistStatus === "stale_for_current_packet" ? (
        <p className="manual-note-runtime-error" role="status">
          Checklist was made against a previous packet state. Review again
          before relying on it.
        </p>
      ) : null}
      {checklistStatus === "complete" ? (
        <p className="manual-note-runtime-hint" role="status">
          Complete checklist is a local screen aid only. It does not approve, reject, defer, promote, or canonize this draft.
        </p>
      ) : null}
      <div className="manual-note-local-packet-review-checklist-items">
        {CHECKLIST_ITEMS.map((item) => (
          <article
            key={item.id}
            className="manual-note-local-packet-review-checklist-item"
          >
            <label>
              <input
                type="checkbox"
                checked={items[item.id].checked}
                onChange={(event) =>
                  updateItemChecked(item.id, event.currentTarget.checked)
                }
              />
              <span>{item.label}</span>
            </label>
            <p>{item.helper}</p>
            <textarea
              value={items[item.id].note}
              placeholder="Local note for this checklist item"
              aria-label={`Local note: ${item.label}`}
              onChange={(event) =>
                updateItemNote(item.id, event.currentTarget.value)
              }
            />
          </article>
        ))}
      </div>
      <label className="manual-note-local-packet-review-checklist-notes">
        <span>Local reviewer notes</span>
        <textarea
          value={reviewerNotes}
          placeholder="Local notes for this screen only"
          aria-label="Local packet review notes"
          onChange={(event) => updateReviewerNotes(event.currentTarget.value)}
        />
      </label>
    </section>
  );
}

function getChecklistStatus({
  checkedCount,
  totalCount,
  checklistHasStarted,
  checklistStartedForPacketFingerprint,
  currentPacketFingerprint,
}: {
  checkedCount: number;
  totalCount: number;
  checklistHasStarted: boolean;
  checklistStartedForPacketFingerprint: string | null;
  currentPacketFingerprint: string | null;
}): LocalPacketReviewChecklistStatus {
  if (!checklistHasStarted) return "no_checklist_started";
  if (
    checklistStartedForPacketFingerprint &&
    currentPacketFingerprint &&
    checklistStartedForPacketFingerprint !== currentPacketFingerprint
  ) {
    return "stale_for_current_packet";
  }
  if (checkedCount === totalCount) return "complete";
  return "in_progress";
}

function cloneEmptyItemState() {
  return Object.fromEntries(
    Object.entries(EMPTY_ITEM_STATE).map(([key, value]) => [
      key,
      { ...value },
    ]),
  ) as Record<
    LocalPacketReviewChecklistItemId,
    LocalPacketReviewChecklistItemState
  >;
}
