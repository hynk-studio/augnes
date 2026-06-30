import type { AugnesDelta } from "@/types/augnes-delta";
import {
  PerspectiveDeltaCard,
  type PerspectiveDeltaCardReviewState,
} from "./perspective-delta-card";

type PerspectiveTimelineProps = {
  deltas: AugnesDelta[];
  selectedDeltaId: string | null;
  reviewStateByDeltaId: Map<string, PerspectiveDeltaCardReviewState>;
  formatCreatedAt: (createdAt: string) => string;
  onSelectDelta: (deltaId: string) => void;
};

export function PerspectiveTimeline({
  deltas,
  selectedDeltaId,
  reviewStateByDeltaId,
  formatCreatedAt,
  onSelectDelta,
}: PerspectiveTimelineProps) {
  return (
    <section
      className="perspective-human-panel perspective-human-timeline"
      aria-labelledby="perspective-human-timeline-title"
    >
      <div className="perspective-human-section-heading">
        <p>Vertical Perspective Timeline</p>
        <h2 id="perspective-human-timeline-title">Augnes Delta timeline</h2>
        <span>
          Newest projected deltas first. Timeline cards show type, status,
          source, title, created_at, and review needs.
        </span>
      </div>

      {deltas.length > 0 ? (
        <div className="perspective-human-timeline-list">
          {deltas.map((delta) => (
            <PerspectiveDeltaCard
              key={delta.delta_id}
              delta={delta}
              createdAtLabel={formatCreatedAt(delta.created_at)}
              reviewState={
                reviewStateByDeltaId.get(delta.delta_id) ?? {
                  labels: [],
                  isImportant: false,
                }
              }
              selected={delta.delta_id === selectedDeltaId}
              onSelect={onSelectDelta}
            />
          ))}
        </div>
      ) : (
        <p className="perspective-human-empty-state">
          No projected deltas available yet. Augnes can still show Current
          Working Perspective from snapshot context.
        </p>
      )}
    </section>
  );
}
