import type { WorkplaneContinuityRelayAnchor } from "@/types/workplane-continuity-relay";
import type { WorkplaneContextRead } from "@/lib/workplane/read-workplane-context";
import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { CSSProperties } from "react";

const sectionHeadingStyle: CSSProperties = {
  margin: 0,
  color: "#334155",
  fontSize: "0.72rem",
  fontWeight: 820,
  textTransform: "uppercase",
};

const columnGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))",
  gap: "10px",
  minWidth: 0,
};

const sectionStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
};

const boundaryStyle: CSSProperties = {
  margin: 0,
  padding: "9px",
  border: "1px solid rgba(22, 101, 52, 0.2)",
  borderRadius: "8px",
  background: "#f0fdf4",
  color: "#166534",
  fontSize: "0.78rem",
  lineHeight: 1.36,
  overflowWrap: "anywhere",
};

export function ContinuityRelayWorkplanePanel({
  context,
}: {
  context: WorkplaneContextRead;
}) {
  const relay = context.continuity_relay;
  const activeStopCount = relay.stop_if_missing.filter(
    (anchor) => anchor.blocks_handoff,
  ).length;
  const nodeStatus =
    activeStopCount > 0
      ? "blocked"
      : relay.stale_or_gap_warnings.length > 0
        ? "stale"
        : "partial";

  return (
    <WorkplanePanelShell
      kicker="Continuity Relay"
      title="Continue from here"
      ariaLabel="Workbench Continuity Relay panel"
      panelId="continuity_relay"
      nodeId="handoff_context"
      nodeKind="handoff_context_source"
      nodeStatus={nodeStatus}
    >
      <p style={workplaneCopyStyle}>
        Compact next-session relay derived from Current Working Perspective,
        GuideBrief, and Workplane source status. It is advisory working
        material, not durable state.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="Preserve"
          value={relay.preserve_anchors.length}
        />
        <WorkplanePanelMetric label="Watch" value={relay.warn_anchors.length} />
        <WorkplanePanelMetric
          label="Stop"
          value={relay.stop_if_missing.length}
        />
        <WorkplanePanelMetric label="Next" value={relay.next_focus.length} />
      </WorkplanePanelMetricGrid>

      <div style={columnGridStyle}>
        <RelaySection
          title="Preserve"
          anchors={relay.preserve_anchors}
          emptyText="No preserve anchors materialized."
        />
        <RelaySection
          title="Watch"
          anchors={relay.warn_anchors}
          emptyText="No warnings materialized."
        />
        <RelaySection
          title="Stop If Missing"
          anchors={relay.stop_if_missing}
          emptyText="No stop-if-missing blockers materialized."
        />
        <RelaySection
          title="Next Focus"
          anchors={relay.next_focus}
          emptyText="No next focus materialized."
        />
      </div>

      <p style={workplaneCopyStyle}>
        Sources: CWP {relay.source_status.current_perspective}; GuideBrief{" "}
        {relay.source_status.guide_brief}; Delta{" "}
        {relay.source_status.delta_projection}. Source refs:{" "}
        {relay.source_refs.source_refs.length}.
      </p>

      <p style={boundaryStyle}>
        Read-only/advisory. No memory promotion, state apply, formation receipt,
        proof/evidence write, provider call, GitHub call, Codex execution,
        handoff send, crawler, graph/vector store, or autonomous action.
      </p>
    </WorkplanePanelShell>
  );
}

function RelaySection({
  title,
  anchors,
  emptyText,
}: {
  title: string;
  anchors: WorkplaneContinuityRelayAnchor[];
  emptyText: string;
}) {
  const visibleAnchors = anchors.slice(0, 3);

  return (
    <section style={sectionStyle}>
      <h3 style={sectionHeadingStyle}>{title}</h3>
      <ul style={workplaneListStyle}>
        {visibleAnchors.map((anchor) => (
          <li key={anchor.anchor_id} style={workplaneItemStyle}>
            <span style={workplaneBadgeStyle}>{anchor.severity}</span>
            <strong style={workplaneCopyStyle}>{anchor.label}</strong>
            <span style={workplaneCopyStyle}>{anchor.summary}</span>
          </li>
        ))}
        {visibleAnchors.length === 0 ? (
          <li style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>{emptyText}</span>
          </li>
        ) : null}
      </ul>
    </section>
  );
}
