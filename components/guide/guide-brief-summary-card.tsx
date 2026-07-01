import type { GuideBrief } from "@/types/guide-brief";
import type { CSSProperties } from "react";

type GuideBriefSummaryCardProps = {
  guideBrief: GuideBrief;
  variant: "home" | "perspective" | "workbench";
};

const cardStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  minWidth: 0,
  padding: "12px",
  border: "1px solid rgba(15, 23, 42, 0.12)",
  borderRadius: "8px",
  background: "rgba(248, 250, 252, 0.92)",
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 108px), 1fr))",
  gap: "8px",
  minWidth: 0,
};

const metricStyle: CSSProperties = {
  display: "grid",
  gap: "2px",
  minWidth: 0,
  padding: "8px",
  borderRadius: "7px",
  background: "#ffffff",
  border: "1px solid rgba(15, 23, 42, 0.08)",
};

const labelStyle: CSSProperties = {
  color: "#64748b",
  fontSize: "0.66rem",
  fontWeight: 820,
  textTransform: "uppercase",
};

const valueStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: "0.86rem",
  lineHeight: 1.24,
  overflowWrap: "anywhere",
};

const copyStyle: CSSProperties = {
  margin: 0,
  color: "#334155",
  fontSize: "0.78rem",
  lineHeight: 1.4,
  overflowWrap: "anywhere",
};

export function GuideBriefSummaryCard({
  guideBrief,
  variant,
}: GuideBriefSummaryCardProps) {
  return (
    <section aria-label="GuideBrief summary" style={cardStyle}>
      <p style={copyStyle}>{variantSummary(variant)}</p>
      <div style={gridStyle}>
        <GuideMetric
          label="Thesis"
          value={guideBrief.current_perspective_summary.current_thesis}
        />
        <GuideMetric
          label="Goals"
          value={String(guideBrief.current_perspective_summary.active_goal_count)}
        />
        <GuideMetric
          label="Research pressure"
          value={guideBrief.current_perspective_summary.research_pressure_level}
        />
        <GuideMetric
          label="Projected deltas"
          value={String(guideBrief.delta_summary.projected_delta_count)}
        />
        <GuideMetric
          label="Review queue"
          value={String(guideBrief.review_queue_summary.total_attention_count)}
        />
        <GuideMetric
          label="Source"
          value={
            guideBrief.current_perspective_summary.source_status
              .current_working_perspective
          }
        />
      </div>
    </section>
  );
}

function GuideMetric({ label, value }: { label: string; value: string }) {
  return (
    <div style={metricStyle}>
      <span style={labelStyle}>{label}</span>
      <span style={valueStyle}>{value}</span>
    </div>
  );
}

function variantSummary(variant: GuideBriefSummaryCardProps["variant"]) {
  if (variant === "perspective") {
    return "Perspective guide rail keeps selected-delta context, staleness warnings, and judgment prompts separate from timeline state.";
  }

  if (variant === "workbench") {
    return "Agent Workplane guide view keeps handoff candidates preview-only and trace or diagnostic guidance bounded.";
  }

  return "Human Surface guide view shows compact observed context, candidate suggestions, and user judgment prompts.";
}
