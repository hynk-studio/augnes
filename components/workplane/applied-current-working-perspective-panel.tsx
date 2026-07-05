import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { AppliedCurrentWorkingPerspectiveRead } from "@/lib/perspective/read-applied-current-working-perspective-for-web";

type AppliedCurrentWorkingPerspectivePanelProps = {
  read: AppliedCurrentWorkingPerspectiveRead;
};

export function AppliedCurrentWorkingPerspectivePanel({
  read,
}: AppliedCurrentWorkingPerspectivePanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Applied CWP snapshot"
      title="Applied CurrentWorkingPerspective Status"
      ariaLabel="Applied CurrentWorkingPerspective Status panel"
    >
      <p style={workplaneCopyStyle}>
        Display-only status for the latest scoped local applied CWP snapshot.
        No snapshot is fabricated from Workbench defaults, and this panel does
        not replace the current perspective route.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="status" value={read.status} />
        <WorkplanePanelMetric
          label="goals"
          value={String(read.summary.active_goal_count)}
        />
        <WorkplanePanelMetric
          label="questions"
          value={String(read.summary.open_question_count)}
        />
        <WorkplanePanelMetric
          label="candidates"
          value={String(read.summary.next_candidate_count)}
        />
      </WorkplanePanelMetricGrid>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>latest snapshot</span>
        <strong>{read.summary.applied_snapshot_ref ?? "none"}</strong>
        <span style={workplaneCopyStyle}>
          source contract {read.summary.source_contract_record_ref ?? "none"};
          staleness {read.summary.staleness_status ?? "none"}
        </span>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>authority boundary</span>
        <strong>Read-only applied snapshot status</strong>
        <span style={workplaneCopyStyle}>
          can_write_db {String(read.authority_boundary.can_write_db)};
          can_create_schema{" "}
          {String(read.authority_boundary.can_create_schema)};
          can_replace_route{" "}
          {String(
            read.authority_boundary
              .can_replace_current_working_perspective_route_response,
          )}
        </span>
      </section>
    </WorkplanePanelShell>
  );
}
