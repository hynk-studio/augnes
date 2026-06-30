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

export function DeltaBatchPanel({
  context,
}: {
  context: WorkplaneContextRead;
}) {
  const projection = context.delta_projection_read.data;
  const batches = projection.batches;
  const totalBatchDeltaCount = batches.reduce(
    (count, batch) => count + batch.deltas.length,
    0,
  );
  const totalBatchSnapshotRefCount = batches.reduce(
    (count, batch) => count + batch.snapshot_refs.length,
    0,
  );
  const totalBatchDiagnosticRefCount = batches.reduce(
    (count, batch) => count + batch.diagnostic_refs.length,
    0,
  );

  return (
    <WorkplanePanelShell
      kicker="Phase 5C preview"
      title="Delta Batch"
      ariaLabel="Delta Batch Workplane panel"
    >
      <p style={workplaneCopyStyle}>
        Delta Batch context is read-only preview context. It is not a
        transaction, not approval, and not persistence behavior.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Batches" value={batches.length} />
        <WorkplanePanelMetric label="Deltas" value={totalBatchDeltaCount} />
        <WorkplanePanelMetric label="Snapshots" value={totalBatchSnapshotRefCount} />
        <WorkplanePanelMetric label="Diagnostics" value={totalBatchDiagnosticRefCount} />
      </WorkplanePanelMetricGrid>

      <ul style={workplaneListStyle}>
        {batches.slice(0, 3).map((batch) => (
          <li key={batch.batch_id} style={workplaneItemStyle}>
            <span style={workplaneBadgeStyle}>
              {batch.validation_summary.validation_status}
            </span>
            <strong>{batch.title}</strong>
            <span style={workplaneCopyStyle}>{batch.summary}</span>
            <span style={workplaneCopyStyle}>
              {batch.deltas.length} deltas; {batch.snapshot_refs.length} snapshot
              refs; {batch.diagnostic_refs.length} diagnostic refs.
            </span>
            <span style={workplaneCopyStyle}>
              Authority:{" "}
              {batch.authority_boundary.notes[0] ?? "read-only projection"}
            </span>
          </li>
        ))}
        {batches.length === 0 ? (
          <li style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>No Delta Batch materialized yet.</span>
          </li>
        ) : null}
      </ul>

      <p style={workplaneCopyStyle}>
        Source status: {context.source_status.delta_projection}. Batch review
        context has no batch apply, batch approval, or durable write authority.
      </p>
    </WorkplanePanelShell>
  );
}
