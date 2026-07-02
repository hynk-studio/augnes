import type { BlankStateReviewEntry } from "@/lib/human-surface/blank-state-review-entries";

type BlankStateReviewEntryGridProps = {
  entries: BlankStateReviewEntry[];
};

export function BlankStateReviewEntryGrid({
  entries,
}: BlankStateReviewEntryGridProps) {
  return (
    <section
      className="human-surface-section human-surface-review-entry-section"
      aria-labelledby="blank-state-review-entry-title"
      data-blank-state-review-entry-grid="v0.1"
    >
      <div className="human-surface-section-heading">
        <p>Review entry absorption</p>
        <h2 id="blank-state-review-entry-title">Choose the next review path</h2>
        <span>
          These entries replace high-level Cockpit starts on the human-facing
          Blank State. They route to native surfaces and do not mutate state.
        </span>
      </div>

      <div className="human-surface-review-entry-grid">
        {entries.map((entry) => (
          <a
            className="human-surface-review-entry-card"
            data-blank-state-entry-id={entry.capability_id}
            data-blank-state-entry-target={entry.target_label}
            data-blank-state-entry-source-status={entry.source_status}
            href={entry.href}
            key={entry.capability_id}
          >
            <div>
              <strong>{entry.title}</strong>
              <span>{entry.status_label}</span>
            </div>
            <p>{entry.summary}</p>
            <dl>
              <div>
                <dt>{entry.metric_label}</dt>
                <dd>{entry.metric_value}</dd>
              </div>
              <div>
                <dt>Target</dt>
                <dd>{entry.target_label}</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>{entry.source_note}</dd>
              </div>
            </dl>
            <small>{entry.authority_note}</small>
          </a>
        ))}
      </div>
    </section>
  );
}
