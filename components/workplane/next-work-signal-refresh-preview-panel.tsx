import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { NextWorkSignalRefreshPreview } from "@/types/next-work-signal-refresh-preview";

type NextWorkSignalRefreshPreviewPanelProps = {
  preview: NextWorkSignalRefreshPreview;
};

export function NextWorkSignalRefreshPreviewPanel({
  preview,
}: NextWorkSignalRefreshPreviewPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Next-work signal refresh"
      title="Next-Work Signal Refresh Preview"
      ariaLabel="Next-Work Signal Refresh Preview panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only next-work signal candidates derived from metric snapshot and
        reuse outcome material. This prepares future Perspective, NextWorkBias,
        and relay review inputs without writing them.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Refresh status" value={preview.refresh_preview_status} />
        <WorkplanePanelMetric label="recommended next action" value={preview.recommended_next_action} />
        <WorkplanePanelMetric label="metric material" value={String(preview.input_summary.metric_material_count)} />
        <WorkplanePanelMetric label="signal candidates" value={String(preview.input_summary.next_work_signal_count)} />
      </WorkplanePanelMetricGrid>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>signal buckets</span>
        <span style={workplaneCopyStyle}>
          preserve {preview.proposed_next_work_signals.preserve_context_refs.length};
          warn {preview.proposed_next_work_signals.warn_context_refs.length};
          drop{" "}
          {preview.proposed_next_work_signals.drop_or_deprioritize_context_refs.length}
        </span>
        <span style={workplaneCopyStyle}>
          verification{" "}
          {preview.proposed_next_work_signals.verification_focus_candidates.length};
          expected/observed{" "}
          {preview.proposed_next_work_signals.expected_observed_followup_candidates.length};
          handoff{" "}
          {preview.proposed_next_work_signals.handoff_quality_focus_candidates.length}
        </span>
      </section>

      <ReasonList
        title="refresh blockers"
        reasons={[
          ...preview.blocked_reasons,
          ...preview.insufficient_data_reasons,
          ...preview.evidence_summary.missing_evidence,
        ]}
      />

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>authority boundary</span>
        <strong>Read-only next-work signal candidate material</strong>
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
