import type { HumanSurfaceCurrentPerspectiveRead } from "@/lib/human-surface/read-current-perspective";
import type { CurrentWorkingPerspective } from "@/types/current-working-perspective";

type CurrentPerspectiveCardProps = {
  read: HumanSurfaceCurrentPerspectiveRead;
};

export function CurrentPerspectiveCard({ read }: CurrentPerspectiveCardProps) {
  const perspective = read.data;
  const sourceStatusLabel = sourceStatusCopy(read.source_status);

  return (
    <section
      className="human-surface-panel human-surface-current-card"
      aria-labelledby="human-surface-current-perspective"
    >
      <div className="human-surface-section-heading">
        <p>Current Working Perspective</p>
        <h2 id="human-surface-current-perspective">What Augnes thinks is going on</h2>
        <span>
          Source status: {sourceStatusLabel}. Staleness: {perspective.staleness.status}.
        </span>
      </div>

      {read.source_status !== "runtime" ? (
        <p className="human-surface-fallback-note">
          Current Working Perspective is unavailable from runtime. Showing
          public-safe sample / empty fallback. No state was read or mutated.
        </p>
      ) : null}

      {read.fallback_reason ? (
        <p className="human-surface-source-reason">{read.fallback_reason}</p>
      ) : null}

      <article className="human-surface-thesis">
        <span>Current thesis</span>
        <p>{perspective.current_thesis.summary}</p>
      </article>

      <div className="human-surface-metric-grid" aria-label="Current perspective counts">
        <Metric label="Active goals" value={perspective.active_goals.length} />
        <Metric label="Open questions" value={perspective.open_questions.length} />
        <Metric label="Active risks" value={perspective.active_risks.length} />
        <Metric label="Research pressure" value={perspective.research_pressure.pressure_level} />
      </div>

      <div className="human-surface-current-lists">
        <SummaryList
          title="Top goals"
          items={perspective.active_goals.slice(0, 2).map((goal) => ({
            id: goal.goal_id,
            title: goal.title,
            summary: goal.next_action,
          }))}
          emptyText="No active goals are available in this read model."
        />
        <SummaryList
          title="Open questions"
          items={perspective.open_questions.slice(0, 2).map((question) => ({
            id: question.question_id,
            title: question.summary,
            summary: question.suggested_review_path,
          }))}
          emptyText="No open questions are available in this read model."
        />
        <SummaryList
          title="Active risks"
          items={perspective.active_risks.slice(0, 2).map((risk) => ({
            id: risk.risk_id,
            title: risk.summary,
            summary: risk.blocked_authority_notes.join(" "),
          }))}
          emptyText="No active risks are available in this read model."
        />
        <SummaryList
          title="Next candidates"
          items={perspective.next_candidates.slice(0, 2).map((candidate) => ({
            id: candidate.candidate_id,
            title: candidate.title,
            summary: candidate.rationale,
          }))}
          emptyText="No next candidates are available in this read model."
        />
      </div>

      <a className="human-surface-inline-link" href="/perspective">
        Open Perspective
      </a>
    </section>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number | CurrentWorkingPerspective["research_pressure"]["pressure_level"];
}) {
  return (
    <div className="human-surface-metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
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
    <section className="human-surface-summary-list" aria-label={title}>
      <h3>{title}</h3>
      {items.length > 0 ? (
        <ol>
          {items.map((item) => (
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

function sourceStatusCopy(status: HumanSurfaceCurrentPerspectiveRead["source_status"]) {
  if (status === "runtime") return "runtime";
  if (status === "fixture_fallback") return "public-safe fixture fallback";
  return "empty fallback";
}
