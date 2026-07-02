import type { WorkplaneContextRead } from "@/lib/workplane/read-workplane-context";
import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";

const reviewQueueFields = [
  ["needs_review_delta_ids", "Needs review"],
  ["blocked_delta_ids", "Blocked"],
  ["manual_review_delta_ids", "Manual review"],
  ["validation_required_delta_ids", "Validation required"],
  ["project_perspective_review_delta_ids", "Project Perspective"],
  ["durable_memory_review_delta_ids", "Durable memory"],
  ["user_decision_delta_ids", "User decision"],
] as const;

export function ReviewQueueWorkplanePanel({
  context,
}: {
  context: WorkplaneContextRead;
}) {
  const reviewQueue = context.current_perspective_read.data.review_queue_hints;
  const summary = context.overview.review_queue;

  return (
    <WorkplanePanelShell
      kicker="Review Queue"
      title="Operator attention hints"
      ariaLabel="Review Queue Workplane panel"
      panelId="review_queue"
      nodeId="authority_validation_debug"
      nodeKind="native_panel"
      nodeStatus="partial"
    >
      <p style={workplaneCopyStyle}>
        Review Queue refs are read-only hints from Current Working Perspective.
        This panel does not approve, reject, apply, or mutate deltas.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Needs review" value={summary.needs_review_count} />
        <WorkplanePanelMetric label="Blocked" value={summary.blocked_count} />
        <WorkplanePanelMetric label="Manual" value={summary.manual_review_count} />
        <WorkplanePanelMetric label="Total refs" value={summary.total_attention_count} />
      </WorkplanePanelMetricGrid>

      <ul style={workplaneListStyle}>
        {reviewQueueFields.map(([field, label]) => {
          const ids = reviewQueue[field];
          return (
            <li key={field} style={workplaneItemStyle}>
              <strong>{label}</strong>
              <span style={workplaneCopyStyle}>
                {ids.length > 0 ? ids.join(", ") : "No review queue delta refs are materialized yet."}
              </span>
            </li>
          );
        })}
      </ul>

      <p style={workplaneCopyStyle}>
        Queue notes:{" "}
        {reviewQueue.notes.length > 0 ? reviewQueue.notes.join(" ") : "none materialized"}
      </p>
    </WorkplanePanelShell>
  );
}
