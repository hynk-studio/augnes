import type { HumanSurfaceCurrentPerspectiveRead } from "@/lib/human-surface/read-current-perspective";

type PerspectiveCurrentSummaryRailProps = {
  currentPerspectiveRead: HumanSurfaceCurrentPerspectiveRead;
};

export function PerspectiveCurrentSummaryRail({
  currentPerspectiveRead,
}: PerspectiveCurrentSummaryRailProps) {
  const perspective = currentPerspectiveRead.data;

  return (
    <aside
      className="perspective-human-panel perspective-human-summary-rail"
      aria-labelledby="perspective-human-current-summary"
    >
      <div className="perspective-human-section-heading">
        <p>Current Working Perspective</p>
        <h2 id="perspective-human-current-summary">Current summary</h2>
        <span>
          Source status: {sourceStatusCopy(currentPerspectiveRead.source_status)}.
          Staleness: {perspective.staleness.status}.
        </span>
      </div>

      {currentPerspectiveRead.source_status !== "runtime" ? (
        <p className="perspective-human-fallback-note">
          Current Working Perspective is unavailable from runtime. Showing
          public-safe sample / empty fallback. No state was read or mutated.
        </p>
      ) : null}

      {currentPerspectiveRead.fallback_reason ? (
        <p className="perspective-human-source-reason">
          {currentPerspectiveRead.fallback_reason}
        </p>
      ) : null}

      <article className="perspective-human-thesis">
        <span>Current thesis</span>
        <p>{perspective.current_thesis.summary}</p>
      </article>

      <div className="perspective-human-metrics" aria-label="Current perspective metrics">
        <Metric label="Active goals" value={perspective.active_goals.length} />
        <Metric label="Open questions" value={perspective.open_questions.length} />
        <Metric label="Active risks" value={perspective.active_risks.length} />
        <Metric
          label="Research pressure"
          value={perspective.research_pressure.pressure_level}
        />
      </div>

      <p className="perspective-human-source-reason">
        Snapshot as of {perspective.staleness.snapshot_as_of}; projection as of{" "}
        {perspective.staleness.projection_as_of}.
      </p>
    </aside>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="perspective-human-metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </span>
  );
}

function sourceStatusCopy(
  status: HumanSurfaceCurrentPerspectiveRead["source_status"],
) {
  if (status === "runtime") return "runtime";
  if (status === "fixture_fallback") return "public-safe fixture fallback";
  return "empty fallback";
}
