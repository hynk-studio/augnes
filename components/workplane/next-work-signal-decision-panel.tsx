import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { NextWorkSignalOperatorDecisionPreview } from "@/types/next-work-signal-decision";

type NextWorkSignalDecisionPanelProps = {
  preview: NextWorkSignalOperatorDecisionPreview;
};

export function NextWorkSignalDecisionPanel({
  preview,
}: NextWorkSignalDecisionPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Next-work signal decision"
      title="Next-Work Signal Operator Decision Preview"
      ariaLabel="Next-Work Signal Operator Decision Preview panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only operator decision preview for a future scoped local
        next-work signal decision record. It cannot write Perspective,
        NextWorkBias, relay, handoff, memory, metrics, or external action state.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Decision status" value={preview.decision_preview_status} />
        <WorkplanePanelMetric label="recommended decision" value={preview.recommended_operator_decision} />
        <WorkplanePanelMetric label="selected signals" value={String(preview.input_summary.selected_signal_ref_count)} />
        <WorkplanePanelMetric label="write ready" value={String(preview.write_readiness.write_ready)} />
      </WorkplanePanelMetricGrid>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>would write preview</span>
        <span style={workplaneCopyStyle}>
          selectable {preview.input_summary.selectable_signal_ref_count};
          would write {preview.input_summary.would_write_signal_count}
        </span>
        <span style={workplaneCopyStyle}>
          record{" "}
          {preview.would_write_next_work_signal_record_preview
            .proposed_record_kind ?? "none"};
          receipt{" "}
          {preview.would_write_next_work_signal_record_preview
            .proposed_receipt_kind ?? "none"}
        </span>
      </section>

      <ReasonList
        title="decision blockers"
        reasons={[
          ...preview.blocking_reasons,
          ...preview.missing_evidence,
          ...preview.refusal_reasons,
          ...preview.write_readiness.current_insufficient_data,
        ]}
      />

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>authority boundary</span>
        <strong>Read-only decision preview</strong>
        <span style={workplaneCopyStyle}>
          can_write_db {String(preview.authority_boundary.can_write_db)};
          can_create_next_work_signal_record{" "}
          {String(preview.authority_boundary.can_create_next_work_signal_record)};
          can_update_current_working_perspective{" "}
          {String(preview.authority_boundary.can_update_current_working_perspective)}
        </span>
        <span style={workplaneCopyStyle}>
          can_update_continuity_relay{" "}
          {String(preview.authority_boundary.can_update_continuity_relay)};
          can_send_handoff {String(preview.authority_boundary.can_send_handoff)};
          can_execute_codex {String(preview.authority_boundary.can_execute_codex)}
        </span>
      </section>
    </WorkplanePanelShell>
  );
}

function ReasonList({ title, reasons }: { title: string; reasons: string[] }) {
  return (
    <section style={workplaneItemStyle}>
      <span style={workplaneBadgeStyle}>{title}</span>
      <ul style={workplaneListStyle}>
        {(reasons.length > 0 ? reasons : ["none"]).slice(0, 8).map((reason) => (
          <li key={reason} style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>{reason}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
