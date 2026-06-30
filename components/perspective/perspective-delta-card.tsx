import type { AugnesDelta } from "@/types/augnes-delta";

export type PerspectiveDeltaCardReviewState = {
  labels: string[];
  isImportant: boolean;
};

type PerspectiveDeltaCardProps = {
  delta: AugnesDelta;
  createdAtLabel: string;
  reviewState: PerspectiveDeltaCardReviewState;
  selected: boolean;
  onSelect: (deltaId: string) => void;
};

export function PerspectiveDeltaCard({
  delta,
  createdAtLabel,
  reviewState,
  selected,
  onSelect,
}: PerspectiveDeltaCardProps) {
  const reviewNeed =
    reviewState.labels.length > 0
      ? reviewState.labels.join(", ")
      : "read-only context";

  return (
    <button
      type="button"
      data-created-at={delta.created_at}
      className={`perspective-human-delta-card${selected ? " is-selected" : ""}`}
      aria-pressed={selected}
      onClick={() => onSelect(delta.delta_id)}
    >
      <span className="perspective-human-delta-pin" aria-hidden="true" />
      <span className="perspective-human-delta-card__body">
        <span className="perspective-human-delta-card__meta">
          <span>{delta.type}</span>
          <span>{delta.status}</span>
          <span>{delta.source}</span>
        </span>
        <strong>{delta.title}</strong>
        <span className="perspective-human-delta-card__created">
          created_at: {createdAtLabel}
        </span>
        <span className="perspective-human-delta-card__summary">
          {delta.summary}
        </span>
        <span className="perspective-human-delta-card__review">
          Review needs: {reviewNeed}
          {reviewState.isImportant ? " / last major delta" : ""}
        </span>
      </span>
    </button>
  );
}
