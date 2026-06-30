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

export function TraceDiagnosticsPanel({
  context,
}: {
  context: WorkplaneContextRead;
}) {
  const projection = context.delta_projection_read.data;
  const projectionDiagnostics = projection.source_refs.diagnostic_refs;
  const deltaDiagnostics = projection.deltas.flatMap(
    (delta) => delta.diagnostic_refs,
  );
  const diagnosticRefs = uniqueById([
    ...projectionDiagnostics,
    ...deltaDiagnostics,
  ]);
  const validationSummaries = [
    ...projection.batches.map((batch) => ({
      id: batch.batch_id,
      status: batch.validation_summary.validation_status,
      notes: batch.validation_summary.notes,
    })),
    ...projection.deltas
      .filter((delta) => delta.validation_summary)
      .map((delta) => ({
        id: delta.delta_id,
        status: delta.validation_summary?.validation_status ?? "not_run",
        notes: delta.validation_summary?.notes ?? [],
      })),
  ];
  const reviewNotes = projection.deltas.flatMap((delta) => delta.review_notes ?? []);
  const nonGoals = projection.deltas.flatMap((delta) => delta.non_goals);
  const hasTraceDiagnostics =
    projection.gaps.length > 0 ||
    diagnosticRefs.length > 0 ||
    validationSummaries.length > 0 ||
    reviewNotes.length > 0 ||
    nonGoals.length > 0;

  return (
    <WorkplanePanelShell
      kicker="Phase 5C bounded trace"
      title="Trace / Diagnostics"
      ariaLabel="Trace and Diagnostics Workplane panel"
    >
      <p style={workplaneCopyStyle}>
        Trace / Diagnostics context is bounded read-only preview context, not a
        raw unbounded diagnostics dump. Source and fallback status remain
        visible.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Gaps" value={projection.gaps.length} />
        <WorkplanePanelMetric label="Diagnostics" value={diagnosticRefs.length} />
        <WorkplanePanelMetric label="Validation" value={validationSummaries.length} />
        <WorkplanePanelMetric label="Review notes" value={reviewNotes.length} />
      </WorkplanePanelMetricGrid>

      <ul style={workplaneListStyle}>
        {projection.gaps.slice(0, 3).map((gap) => (
          <li key={gap.code} style={workplaneItemStyle}>
            <span style={workplaneBadgeStyle}>{gap.severity}</span>
            <strong>{gap.code}</strong>
            <span style={workplaneCopyStyle}>{gap.summary}</span>
          </li>
        ))}
        {diagnosticRefs.slice(0, 3).map((diagnostic) => (
          <li key={diagnostic.diagnostic_id} style={workplaneItemStyle}>
            <span style={workplaneBadgeStyle}>{diagnostic.status}</span>
            <strong>{diagnostic.diagnostic_kind}</strong>
            <span style={workplaneCopyStyle}>{diagnostic.summary}</span>
          </li>
        ))}
        {validationSummaries.slice(0, 3).map((summary) => (
          <li key={summary.id} style={workplaneItemStyle}>
            <span style={workplaneBadgeStyle}>{summary.status}</span>
            <strong>{summary.id}</strong>
            <span style={workplaneCopyStyle}>
              {summary.notes.length > 0
                ? summary.notes.join(" ")
                : "No validation summary notes materialized yet."}
            </span>
          </li>
        ))}
        {reviewNotes.slice(0, 3).map((note, index) => (
          <li key={`review-note-${index}`} style={workplaneItemStyle}>
            <span style={workplaneBadgeStyle}>review note</span>
            <span style={workplaneCopyStyle}>{note}</span>
          </li>
        ))}
        {!hasTraceDiagnostics ? (
          <li style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>
              No trace diagnostics materialized yet.
            </span>
          </li>
        ) : null}
      </ul>

      <p style={workplaneCopyStyle}>
        Non-goals remain bounded to projected delta metadata. Top non-goal refs:
        {nonGoals.slice(0, 3).join(" ") || "none materialized"}.
      </p>
      <p style={workplaneCopyStyle}>
        Source status: Current Perspective {context.source_status.current_perspective};
        Delta Projection {context.source_status.delta_projection}.
      </p>
    </WorkplanePanelShell>
  );
}

function uniqueById<T extends { diagnostic_id: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.diagnostic_id)) {
      return false;
    }
    seen.add(item.diagnostic_id);
    return true;
  });
}
