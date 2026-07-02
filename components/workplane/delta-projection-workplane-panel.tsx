import type { AugnesDelta } from "@/types/augnes-delta";
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

export function DeltaProjectionWorkplanePanel({
  context,
}: {
  context: WorkplaneContextRead;
}) {
  const projection = context.delta_projection_read.data;
  const overview = context.overview.delta_projection;
  const latestDeltas = sortDeltasNewestFirst(projection.deltas).slice(0, 4);

  return (
    <WorkplanePanelShell
      kicker="Delta Projection"
      title="Augnes Delta Projection workplane context"
      ariaLabel="Delta Projection Workplane panel"
      panelId="delta_projection"
      nodeId="perspective_delta"
      nodeKind="native_panel"
      nodeStatus="partial"
    >
      <p style={workplaneCopyStyle}>
        {overview.projected_delta_count > 0
          ? `${overview.projected_delta_count} projected deltas across ${overview.batch_count} batches are visible as read-model inputs.`
          : "No projected deltas materialized yet."}
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Deltas" value={overview.projected_delta_count} />
        <WorkplanePanelMetric label="Batches" value={overview.batch_count} />
        <WorkplanePanelMetric label="Gaps" value={overview.gap_count} />
        <WorkplanePanelMetric label="Evidence" value={overview.evidence_ref_count} />
      </WorkplanePanelMetricGrid>

      <ul style={workplaneListStyle}>
        {latestDeltas.length > 0 ? (
          latestDeltas.map((delta) => (
            <li key={delta.delta_id} style={workplaneItemStyle}>
              <span style={workplaneBadgeStyle}>{delta.type}</span>
              <strong>{delta.title}</strong>
              <span style={workplaneCopyStyle}>
                {delta.status} from {delta.source}; created_at {delta.created_at}
              </span>
            </li>
          ))
        ) : (
          <li style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>No projected deltas materialized yet.</span>
          </li>
        )}
      </ul>

      <p style={workplaneCopyStyle}>
        Source status: {context.source_status.delta_projection}. Delta
        Projection candidates remain inspection context only; no apply controls
        are available here.
      </p>
    </WorkplanePanelShell>
  );
}

function sortDeltasNewestFirst(deltas: AugnesDelta[]) {
  return [...deltas].sort((left, right) => {
    const leftCreatedAt = Date.parse(left.created_at);
    const rightCreatedAt = Date.parse(right.created_at);
    const createdAtDelta =
      Number.isFinite(rightCreatedAt) && Number.isFinite(leftCreatedAt)
        ? rightCreatedAt - leftCreatedAt
        : 0;

    if (createdAtDelta !== 0) {
      return createdAtDelta;
    }

    return left.delta_id.localeCompare(right.delta_id);
  });
}
