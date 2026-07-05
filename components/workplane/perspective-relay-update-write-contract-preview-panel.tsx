import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { PerspectiveRelayUpdateWriteContractPreview } from "@/types/perspective-relay-update-write-contract-preview";

type PerspectiveRelayUpdateWriteContractPreviewPanelProps = {
  preview: PerspectiveRelayUpdateWriteContractPreview;
};

export function PerspectiveRelayUpdateWriteContractPreviewPanel({
  preview,
}: PerspectiveRelayUpdateWriteContractPreviewPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Future write contract"
      title="Perspective Relay Update Write Contract Preview"
      ariaLabel="Perspective Relay Update Write Contract Preview panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only contract preview for a later scoped PerspectiveUnit,
        NextWorkBias, and continuity relay write slice. This panel does not
        perform those writes.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Contract status" value={preview.contract_preview_status} />
        <WorkplanePanelMetric label="recommended next" value={preview.recommended_next_action} />
        <WorkplanePanelMetric label="decision records" value={String(preview.input_summary.has_valid_decision_records)} />
        <WorkplanePanelMetric label="bridge supplied" value={String(preview.input_summary.has_candidate_bridge_preview)} />
      </WorkplanePanelMetricGrid>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>selected targets</span>
        <span style={workplaneCopyStyle}>
          PerspectiveUnit {preview.input_summary.selected_perspective_unit_candidate_count};
          NextWorkBias {preview.input_summary.selected_next_work_bias_candidate_count};
          Relay {preview.input_summary.selected_continuity_relay_candidate_count}
        </span>
      </section>

      <ReasonList
        title="contract blockers"
        reasons={[
          ...preview.blocking_reasons,
          ...preview.insufficient_data_reasons,
          ...preview.evidence_summary.missing_evidence,
        ]}
      />

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>authority boundary</span>
        <strong>Read-only write contract preview</strong>
        <span style={workplaneCopyStyle}>
          can_write_perspective_unit{" "}
          {String(preview.authority_boundary.can_write_perspective_unit)};
          can_write_next_work_bias{" "}
          {String(preview.authority_boundary.can_write_next_work_bias)};
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
