import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { ReuseOutcomeBridgeOperatorDecisionPreview } from "@/types/reuse-outcome-bridge-decision";

type ReuseOutcomeBridgeDecisionPanelProps = {
  preview: ReuseOutcomeBridgeOperatorDecisionPreview;
};

export function ReuseOutcomeBridgeDecisionPanel({
  preview,
}: ReuseOutcomeBridgeDecisionPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Reuse bridge decision"
      title="Reuse Outcome Bridge Operator Decision Preview"
      ariaLabel="Reuse Outcome Bridge Operator Decision Preview panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only decision preview for a future scoped write into the existing
        HandoffReuseOutcomeLedger store. It does not write the ledger or metrics.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Decision status" value={preview.decision_preview_status} />
        <WorkplanePanelMetric label="recommended decision" value={preview.recommended_operator_decision} />
        <WorkplanePanelMetric label="selected refs" value={String(preview.input_summary.selected_reuse_candidate_ref_count)} />
        <WorkplanePanelMetric label="write ready" value={String(preview.write_readiness.write_ready)} />
      </WorkplanePanelMetricGrid>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>would write preview</span>
        <span style={workplaneCopyStyle}>
          selectable {preview.input_summary.selectable_reuse_candidate_ref_count};
          candidates {preview.input_summary.would_write_reuse_candidate_count};
          delta material {preview.input_summary.delta_material_count}
        </span>
        <span style={workplaneCopyStyle}>
          record{" "}
          {preview.would_write_reuse_ledger_record_preview.proposed_record_kind ?? "none"};
          store{" "}
          {preview.would_write_reuse_ledger_record_preview.proposed_store_kind ?? "none"}
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
        <span style={workplaneBadgeStyle}>approval requirements</span>
        <ul style={workplaneListStyle}>
          {preview.approval_requirements.slice(0, 8).map((item) => (
            <li key={item} style={workplaneItemStyle}>
              <span style={workplaneCopyStyle}>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>authority boundary</span>
        <strong>Read-only decision preview</strong>
        <span style={workplaneCopyStyle}>
          can_write_handoff_reuse_ledger{" "}
          {String(preview.authority_boundary.can_write_handoff_reuse_ledger)};
          can_write_dogfood_metrics{" "}
          {String(preview.authority_boundary.can_write_dogfood_metrics)};
          can_write_expected_observed_delta{" "}
          {String(preview.authority_boundary.can_write_expected_observed_delta)}
        </span>
        <span style={workplaneCopyStyle}>
          can_write_memory {String(preview.authority_boundary.can_write_memory)};
          can_update_current_working_perspective{" "}
          {String(preview.authority_boundary.can_update_current_working_perspective)};
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
