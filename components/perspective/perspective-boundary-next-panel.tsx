import type { HumanSurfaceCurrentPerspectiveRead } from "@/lib/human-surface/read-current-perspective";
import type { HumanSurfaceDeltaProjectionRead } from "@/lib/human-surface/read-delta-projection";

type PerspectiveBoundaryNextPanelProps = {
  currentPerspectiveRead: HumanSurfaceCurrentPerspectiveRead;
  deltaProjectionRead: HumanSurfaceDeltaProjectionRead;
};

export function PerspectiveBoundaryNextPanel({
  currentPerspectiveRead,
  deltaProjectionRead,
}: PerspectiveBoundaryNextPanelProps) {
  const perspective = currentPerspectiveRead.data;
  const projection = deltaProjectionRead.data;

  return (
    <section
      className="perspective-human-panel perspective-human-boundary-next"
      aria-labelledby="perspective-human-boundary-next-title"
    >
      <div className="perspective-human-section-heading">
        <p>Boundary / Next panel</p>
        <h2 id="perspective-human-boundary-next-title">Next candidates and warnings</h2>
        <span>
          Next candidates, open questions, active risks, source/fallback notes,
          gaps, and staleness warnings remain read-only.
        </span>
      </div>

      <SummaryList
        title="Next candidates"
        items={perspective.next_candidates.map((candidate) => ({
          id: candidate.candidate_id,
          title: candidate.title,
          summary: candidate.rationale,
        }))}
        emptyText="No next candidates are available in this read model."
      />
      <SummaryList
        title="Open questions"
        items={perspective.open_questions.map((question) => ({
          id: question.question_id,
          title: question.summary,
          summary: question.suggested_review_path,
        }))}
        emptyText="No open questions are available in this read model."
      />
      <SummaryList
        title="Active risks"
        items={perspective.active_risks.map((risk) => ({
          id: risk.risk_id,
          title: risk.summary,
          summary: risk.blocked_authority_notes.join(" "),
        }))}
        emptyText="No active risks are available in this read model."
      />

      <section className="perspective-human-summary-list">
        <h3>Source / fallback notes</h3>
        <p>
          Current perspective source: {currentPerspectiveRead.source_status}.
          Delta projection source: {deltaProjectionRead.source_status}.
        </p>
        {currentPerspectiveRead.fallback_reason ? (
          <p>{currentPerspectiveRead.fallback_reason}</p>
        ) : null}
        {deltaProjectionRead.fallback_reason ? (
          <p>{deltaProjectionRead.fallback_reason}</p>
        ) : null}
      </section>

      <SummaryList
        title="Gaps / staleness warnings"
        items={[
          ...perspective.gaps.map((gap) => ({
            id: `cwp:${gap.code}`,
            title: `${gap.severity}: ${gap.code}`,
            summary: gap.summary,
          })),
          ...projection.gaps.map((gap) => ({
            id: `projection:${gap.code}`,
            title: `${gap.severity}: ${gap.code}`,
            summary: gap.summary,
          })),
        ]}
        emptyText="No gaps are attached to these read models."
      />
    </section>
  );
}

function SummaryList({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: Array<{ id: string; title: string; summary: string }>;
  emptyText: string;
}) {
  return (
    <section className="perspective-human-summary-list" aria-label={title}>
      <h3>{title}</h3>
      {items.length > 0 ? (
        <ol>
          {items.slice(0, 4).map((item) => (
            <li key={item.id}>
              <strong>{item.title}</strong>
              <span>{item.summary}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p>{emptyText}</p>
      )}
    </section>
  );
}
