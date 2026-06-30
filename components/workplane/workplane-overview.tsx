import type { WorkplaneContextRead } from "@/lib/workplane/read-workplane-context";
import type { CSSProperties } from "react";

const sectionStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  padding: "16px",
  border: "1px solid rgba(30, 41, 59, 0.12)",
  borderRadius: "14px",
  background: "rgba(255, 255, 255, 0.92)",
  boxShadow: "0 18px 36px rgba(15, 23, 42, 0.06)",
};

const headingStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
};

const kickerStyle: CSSProperties = {
  margin: 0,
  color: "#64748b",
  fontSize: "0.72rem",
  fontWeight: 820,
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  margin: 0,
  color: "#0f172a",
  fontSize: "1.1rem",
  lineHeight: 1.2,
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "10px",
};

const cardStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
  padding: "12px",
  border: "1px solid rgba(30, 41, 59, 0.12)",
  borderRadius: "12px",
  background: "#f8fafc",
};

const metricGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "6px",
};

const metricStyle: CSSProperties = {
  display: "grid",
  gap: "2px",
  minWidth: 0,
  padding: "8px",
  border: "1px solid rgba(30, 41, 59, 0.1)",
  borderRadius: "10px",
  background: "#ffffff",
  color: "#64748b",
  fontSize: "0.68rem",
  fontWeight: 760,
  textTransform: "uppercase",
};

const strongStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: "1.08rem",
  lineHeight: 1,
  textTransform: "none",
  overflowWrap: "anywhere",
};

const bodyTextStyle: CSSProperties = {
  margin: 0,
  color: "#334155",
  fontSize: "0.84rem",
  lineHeight: 1.36,
};

const fallbackStyle: CSSProperties = {
  margin: 0,
  padding: "10px",
  border: "1px solid rgba(180, 83, 9, 0.28)",
  borderRadius: "10px",
  background: "#fff7ed",
  color: "#7c2d12",
  fontSize: "0.78rem",
  lineHeight: 1.38,
};

export function WorkplaneOverview({
  context,
}: {
  context: WorkplaneContextRead;
}) {
  const { overview } = context;
  const hasFallback = Boolean(
    context.fallback_reason.current_perspective ||
      context.fallback_reason.delta_projection,
  );

  return (
    <section aria-labelledby="workplane-overview-title" style={sectionStyle}>
      <div style={headingStyle}>
        <p style={kickerStyle}>Workplane overview</p>
        <h2 id="workplane-overview-title" style={titleStyle}>
          Current read context, projection pressure, and review queue
        </h2>
      </div>

      <div style={gridStyle}>
        <article aria-label="Current Working Perspective summary" style={cardStyle}>
          <p style={kickerStyle}>Current Working Perspective</p>
          <p style={bodyTextStyle}>{overview.current_perspective.thesis}</p>
          <div style={metricGridStyle}>
            <Metric label="Goals" value={overview.current_perspective.active_goal_count} />
            <Metric label="Questions" value={overview.current_perspective.open_question_count} />
            <Metric label="Risks" value={overview.current_perspective.active_risk_count} />
            <Metric label="Pressure" value={overview.current_perspective.research_pressure} />
          </div>
        </article>

        <article aria-label="Augnes Delta Projection summary" style={cardStyle}>
          <p style={kickerStyle}>Augnes Delta Projection</p>
          <p style={bodyTextStyle}>
            {overview.delta_projection.projected_delta_count > 0
              ? `${overview.delta_projection.projected_delta_count} projected deltas across ${overview.delta_projection.batch_count} batches.`
              : "No projected deltas are materialized for this read context."}
          </p>
          <div style={metricGridStyle}>
            <Metric label="Deltas" value={overview.delta_projection.projected_delta_count} />
            <Metric label="Batches" value={overview.delta_projection.batch_count} />
            <Metric label="Gaps" value={overview.delta_projection.gap_count} />
            <Metric label="Evidence refs" value={overview.delta_projection.evidence_ref_count} />
          </div>
        </article>

        <article aria-label="Review queue summary" style={cardStyle}>
          <p style={kickerStyle}>Review queue</p>
          <p style={bodyTextStyle}>
            {overview.review_queue.total_attention_count > 0
              ? `${overview.review_queue.total_attention_count} unique delta refs need operator attention.`
              : "No review queue delta refs are materialized yet."}
          </p>
          <div style={metricGridStyle}>
            <Metric label="Needs review" value={overview.review_queue.needs_review_count} />
            <Metric label="Blocked" value={overview.review_queue.blocked_count} />
            <Metric label="Manual" value={overview.review_queue.manual_review_count} />
            <Metric label="Validation" value={overview.review_queue.validation_required_count} />
          </div>
        </article>

        <article aria-label="Source and fallback status" style={cardStyle}>
          <p style={kickerStyle}>Source / fallback status</p>
          <p style={bodyTextStyle}>
            Current Perspective: {context.source_status.current_perspective}
            <br />
            Delta Projection: {context.source_status.delta_projection}
          </p>
          <p style={bodyTextStyle}>
            Staleness: {overview.current_perspective.staleness_status}
            <br />
            Scope: {overview.scope}
          </p>
        </article>
      </div>

      {hasFallback ? (
        <p style={fallbackStyle}>
          Fallback disclosed. Current Perspective: {context.fallback_reason.current_perspective ?? "runtime read"}. Delta Projection: {context.fallback_reason.delta_projection ?? "runtime read"}. Fixture fallback is not live runtime state, because apparently reality still requires labels.
        </p>
      ) : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <span style={metricStyle}>
      {label}
      <strong style={strongStyle}>{value}</strong>
    </span>
  );
}
