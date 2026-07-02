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

export function CurrentPerspectiveWorkplanePanel({
  context,
}: {
  context: WorkplaneContextRead;
}) {
  const current = context.current_perspective_read.data;
  const overview = context.overview.current_perspective;

  return (
    <WorkplanePanelShell
      kicker="Current Perspective"
      title="Current Working Perspective workplane context"
      ariaLabel="Current Perspective Workplane panel"
      panelId="current_perspective"
      nodeId="current_perspective"
      nodeKind="native_panel"
      nodeStatus="partial"
    >
      <p style={workplaneCopyStyle}>{overview.thesis}</p>
      <p style={workplaneCopyStyle}>{overview.frame_summary}</p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Goals" value={overview.active_goal_count} />
        <WorkplanePanelMetric label="Questions" value={overview.open_question_count} />
        <WorkplanePanelMetric label="Risks" value={overview.active_risk_count} />
        <WorkplanePanelMetric label="Pressure" value={overview.research_pressure} />
      </WorkplanePanelMetricGrid>

      <ul style={workplaneListStyle}>
        {current.open_questions.slice(0, 2).map((question) => (
          <li key={question.question_id} style={workplaneItemStyle}>
            <span style={workplaneBadgeStyle}>{question.severity}</span>
            <span style={workplaneCopyStyle}>{question.summary}</span>
          </li>
        ))}
        {current.open_questions.length === 0 ? (
          <li style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>No open questions materialized yet.</span>
          </li>
        ) : null}
      </ul>

      <p style={workplaneCopyStyle}>
        Source status: {context.source_status.current_perspective}. Staleness:{" "}
        {overview.staleness_status}. Fixture fallback is disclosed when present
        and is not live runtime state.
      </p>
    </WorkplanePanelShell>
  );
}
