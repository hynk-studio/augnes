import type { WorkplaneContextRead } from "@/lib/workplane/read-workplane-context";
import {
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";

const postmortemFields = [
  "goal",
  "context loaded",
  "major decisions",
  "tools used",
  "failed attempts",
  "validation",
  "outputs",
  "generated deltas",
  "unresolved issues",
] as const;

export function RunPostmortemSkeletonPanel({
  context,
}: {
  context: WorkplaneContextRead;
}) {
  return (
    <WorkplanePanelShell
      kicker="Phase 5C skeleton"
      title="Run Postmortem"
      ariaLabel="Run Postmortem skeleton Workplane panel"
      panelId="run_postmortem"
      nodeId="run_postmortem"
      nodeKind="runner_context_source"
      nodeStatus="not_materialized"
    >
      <p style={workplaneCopyStyle}>
        Run postmortem source is not materialized yet. This skeleton reserves
        read-only preview slots without proof writes, evidence writes,
        completion records, work closeout, or runtime execution.
      </p>

      <ul style={workplaneListStyle}>
        {postmortemFields.map((field) => (
          <li key={field} style={workplaneItemStyle}>
            <span style={workplaneBadgeStyle}>{field}</span>
            <span style={workplaneCopyStyle}>not materialized yet</span>
          </li>
        ))}
      </ul>

      <p style={workplaneCopyStyle}>
        Context source status: Current Perspective{" "}
        {context.source_status.current_perspective}; Delta Projection{" "}
        {context.source_status.delta_projection}. No run source is inferred from
        fixture, review, or trace hints.
      </p>
    </WorkplanePanelShell>
  );
}
