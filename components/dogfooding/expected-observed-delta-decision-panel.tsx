import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { ExpectedObservedDeltaOperatorDecisionPreview } from "@/types/expected-observed-delta-decision";

type ExpectedObservedDeltaDecisionPanelProps = {
  preview: ExpectedObservedDeltaOperatorDecisionPreview;
};

export function ExpectedObservedDeltaDecisionPanel({
  preview,
}: ExpectedObservedDeltaDecisionPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Delta operator decision"
      title="ExpectedObservedDelta Operator Decision Preview"
      ariaLabel="ExpectedObservedDelta Operator Decision Preview panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only operator decision preview for a future scoped local
        ExpectedObservedDelta record. Review-only candidates stay excluded from
        would-write material.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Decision status" value={preview.decision_preview_status} />
        <WorkplanePanelMetric label="recommended decision" value={preview.recommended_operator_decision} />
        <WorkplanePanelMetric label="selected refs" value={String(preview.input_summary.selected_delta_candidate_ref_count)} />
        <WorkplanePanelMetric label="write ready" value={String(preview.write_readiness.write_ready)} />
      </WorkplanePanelMetricGrid>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>would write preview</span>
        <span style={workplaneCopyStyle}>
          selectable {preview.input_summary.selectable_delta_candidate_ref_count};
          would write {preview.input_summary.would_write_delta_candidate_count};
          review only {preview.input_summary.review_only_candidate_count}
        </span>
        <span style={workplaneCopyStyle}>
          record {preview.would_write_delta_record_preview.proposed_record_kind ?? "none"};
          receipt {preview.would_write_delta_record_preview.proposed_receipt_kind ?? "none"}
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
          can_write_db {String(preview.authority_boundary.can_write_db)};
          can_write_expected_observed_delta{" "}
          {String(preview.authority_boundary.can_write_expected_observed_delta)};
          can_write_reuse_outcome_ledger{" "}
          {String(preview.authority_boundary.can_write_reuse_outcome_ledger)}
        </span>
        <span style={workplaneCopyStyle}>
          can_write_dogfood_metrics{" "}
          {String(preview.authority_boundary.can_write_dogfood_metrics)};
          can_mutate_handoff_context{" "}
          {String(preview.authority_boundary.can_mutate_handoff_context)};
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
