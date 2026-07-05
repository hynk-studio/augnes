import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { PerspectiveRelayUpdateOperatorDecisionPreview } from "@/types/perspective-relay-update-decision";

type PerspectiveRelayUpdateDecisionPanelProps = {
  preview: PerspectiveRelayUpdateOperatorDecisionPreview;
};

export function PerspectiveRelayUpdateDecisionPanel({
  preview,
}: PerspectiveRelayUpdateDecisionPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Perspective relay update decision"
      title="Perspective Relay Update Operator Decision Preview"
      ariaLabel="Perspective Relay Update Operator Decision Preview panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only operator decision preview for a future scoped local
        perspective relay update decision record. It cannot write Perspective,
        NextWorkBias, relay, handoff, memory, metrics, or external action state.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Decision status" value={preview.decision_preview_status} />
        <WorkplanePanelMetric label="recommended decision" value={preview.recommended_operator_decision} />
        <WorkplanePanelMetric label="selected candidates" value={String(preview.input_summary.selected_candidate_ref_count)} />
        <WorkplanePanelMetric label="write ready" value={String(preview.write_readiness.write_ready)} />
      </WorkplanePanelMetricGrid>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>would write preview</span>
        <span style={workplaneCopyStyle}>
          selectable {preview.input_summary.selectable_candidate_ref_count};
          perspective {preview.input_summary.selected_perspective_unit_candidate_ref_count};
          next-work {preview.input_summary.selected_next_work_bias_candidate_ref_count};
          relay {preview.input_summary.selected_continuity_relay_candidate_ref_count}
        </span>
        <span style={workplaneCopyStyle}>
          record{" "}
          {preview.would_write_perspective_relay_update_decision_record_preview
            .proposed_record_kind ?? "none"};
          receipt{" "}
          {preview.would_write_perspective_relay_update_decision_record_preview
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
          can_create_perspective_relay_update_decision_record{" "}
          {String(preview.authority_boundary.can_create_perspective_relay_update_decision_record)};
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
