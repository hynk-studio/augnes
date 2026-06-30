import type { CurrentWorkingPerspective } from "@/types/current-working-perspective";

type RecentDeltasPreviewProps = {
  perspective: CurrentWorkingPerspective;
};

export function RecentDeltasPreview({ perspective }: RecentDeltasPreviewProps) {
  const queue = perspective.review_queue_hints;
  const manualOrBlockedCount =
    queue.blocked_delta_ids.length + queue.manual_review_delta_ids.length;

  return (
    <section
      className="human-surface-panel human-surface-deltas"
      aria-labelledby="human-surface-recent-deltas"
    >
      <div className="human-surface-section-heading">
        <p>Recent important deltas</p>
        <h2 id="human-surface-recent-deltas">Review queue preview</h2>
        <span>
          Projected deltas are read-model inputs only, not approval or apply
          authority.
        </span>
      </div>

      <div className="human-surface-delta-counts" aria-label="Review queue counts">
        <span>
          <strong>{perspective.last_major_delta_refs.length}</strong> last major
          delta refs
        </span>
        <span>
          <strong>{queue.needs_review_delta_ids.length}</strong> needs review
        </span>
        <span>
          <strong>{manualOrBlockedCount}</strong> blocked / manual review
        </span>
      </div>

      {perspective.last_major_delta_refs.length > 0 ? (
        <div className="human-surface-delta-list">
          {perspective.last_major_delta_refs.map((delta) => (
            <article className="human-surface-delta-card" key={delta.delta_id}>
              <div>
                <strong>{delta.title}</strong>
                <span>{delta.status}</span>
              </div>
              <dl>
                <div>
                  <dt>Type</dt>
                  <dd>{delta.type}</dd>
                </div>
                <div>
                  <dt>Source</dt>
                  <dd>{delta.source}</dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd>{delta.created_at}</dd>
                </div>
              </dl>
              <p>{delta.review_reason}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="human-surface-empty-deltas">
          No projected deltas available yet. Augnes can still show Current
          Working Perspective from snapshot context.
        </p>
      )}
    </section>
  );
}
