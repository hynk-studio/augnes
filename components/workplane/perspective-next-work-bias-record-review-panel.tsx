import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { PerspectiveNextWorkBiasRecordReview } from "@/types/perspective-next-work-bias-record-review";

type PerspectiveNextWorkBiasRecordReviewPanelProps = {
  review: PerspectiveNextWorkBiasRecordReview;
};

export function PerspectiveNextWorkBiasRecordReviewPanel({
  review,
}: PerspectiveNextWorkBiasRecordReviewPanelProps) {
  const latest = review.latest_record_summary;
  const material = review.next_work_bias_material_summary;
  const sideEffects = review.receipt_no_side_effects_summary;

  return (
    <WorkplanePanelShell
      kicker="Scoped NextWorkBias record"
      title="Perspective Next-Work Bias Record Review"
      ariaLabel="Perspective Next-Work Bias Record Review panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only review of already-read scoped NextWorkBias records. Workbench
        supplies no default database read and no sample records.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Review status" value={review.review_status} />
        <WorkplanePanelMetric
          label="record count"
          value={String(review.input_summary.valid_record_count)}
        />
        <WorkplanePanelMetric
          label="bias entries"
          value={String(material.next_work_bias_entry_count)}
        />
        <WorkplanePanelMetric
          label="side effect problems"
          value={String(review.input_summary.receipt_side_effect_problem_count)}
        />
      </WorkplanePanelMetricGrid>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>latest bias record</span>
        <strong>{latest?.record_id ?? "none"}</strong>
        <span style={workplaneCopyStyle}>
          selected {latest?.selected_next_work_bias_candidate_count ?? 0};
          entries {latest?.next_work_bias_entry_count ?? 0}
        </span>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>directives</span>
        <span style={workplaneCopyStyle}>
          preserve {material.preserve_next_time_count}; warn{" "}
          {material.warn_next_time_count}; drop{" "}
          {material.drop_or_deprioritize_count}; verification{" "}
          {material.verification_bias_count}; diet {material.context_diet_bias_count};
          handoff quality {material.handoff_quality_bias_count}
        </span>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>receipt no side effects</span>
        <strong>
          NextWorkBias records{" "}
          {sideEffects.perspective_next_work_bias_record_written_count}
        </strong>
        <span style={workplaneCopyStyle}>
          next_work_bias_written {sideEffects.next_work_bias_written_count};
          PerspectiveUnit {sideEffects.perspective_unit_written_count}; CWP{" "}
          {sideEffects.current_working_perspective_updated_count}; relay{" "}
          {sideEffects.continuity_relay_written_count}; handoff{" "}
          {sideEffects.handoff_sent_count}; memory {sideEffects.memory_written_count}
        </span>
      </section>

      <ReasonList
        title="record review blockers"
        reasons={[
          ...review.blocked_reasons,
          ...review.insufficient_data_reasons,
          ...review.evidence_summary.missing_evidence,
        ]}
      />

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>authority boundary</span>
        <strong>Read-only record review</strong>
        <span style={workplaneCopyStyle}>
          can_create_schema {String(review.authority_boundary.can_create_schema)};
          can_write_next_work_bias{" "}
          {String(review.authority_boundary.can_write_next_work_bias)};
          can_update_current_working_perspective{" "}
          {String(review.authority_boundary.can_update_current_working_perspective)}
        </span>
        <span style={workplaneCopyStyle}>
          can_update_continuity_relay{" "}
          {String(review.authority_boundary.can_update_continuity_relay)};
          can_send_handoff {String(review.authority_boundary.can_send_handoff)};
          can_execute_codex {String(review.authority_boundary.can_execute_codex)}
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
