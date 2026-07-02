import type { WorkplaneContextRead } from "@/lib/workplane/read-workplane-context";
import {
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";

export function WorkQueuePanel({
  context,
}: {
  context: WorkplaneContextRead;
}) {
  const activeGoals = context.current_perspective_read.data.active_goals;
  const activeWorkIds = context.overview.current_perspective.active_work_ids;
  const nextCandidates = context.current_perspective_read.data.next_candidates;

  return (
    <WorkplanePanelShell
      kicker="Work Queue"
      title="Active work and review scope"
      ariaLabel="Work Queue Workplane panel"
      panelId="work_queue"
      nodeId="current_objective"
      nodeKind="native_panel"
      nodeStatus="partial"
    >
      <p style={workplaneCopyStyle}>
        {activeGoals.length > 0
          ? `${activeGoals.length} active goals are visible from the Current Working Perspective read context.`
          : "No active work goals are materialized yet."}
      </p>

      <ul style={workplaneListStyle}>
        {activeGoals.slice(0, 4).map((goal) => (
          <li key={goal.goal_id} style={workplaneItemStyle}>
            <span style={workplaneBadgeStyle}>{goal.priority}</span>
            <strong>{goal.title}</strong>
            <span style={workplaneCopyStyle}>{goal.next_action}</span>
          </li>
        ))}
      </ul>

      <p style={workplaneCopyStyle}>
        Active work ids:{" "}
        {activeWorkIds.length > 0 ? activeWorkIds.join(", ") : "none materialized"}
      </p>
      <p style={workplaneCopyStyle}>
        Next candidates visible here are read-only queue hints, not work
        creation controls. Candidate count: {nextCandidates.length}.
      </p>
    </WorkplanePanelShell>
  );
}
