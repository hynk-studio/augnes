import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { PerspectiveUnitRecordReview } from "@/types/perspective-unit-record-review";

type PerspectiveUnitRecordReviewPanelProps = {
  review: PerspectiveUnitRecordReview;
};

export function PerspectiveUnitRecordReviewPanel({
  review,
}: PerspectiveUnitRecordReviewPanelProps) {
  const latest = review.latest_record_summary;
  const material = review.perspective_unit_material_summary;
  const sideEffects = review.receipt_no_side_effects_summary;

  return (
    <WorkplanePanelShell
      kicker="Scoped PerspectiveUnit record"
      title="PerspectiveUnit Record Review"
      ariaLabel="PerspectiveUnit Record Review panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only review of already-read scoped PerspectiveUnit records. Workbench
        supplies no default database read and no sample records.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Review status" value={review.review_status} />
        <WorkplanePanelMetric
          label="record count"
          value={String(review.input_summary.valid_record_count)}
        />
        <WorkplanePanelMetric
          label="unit entries"
          value={String(material.perspective_unit_entry_count)}
        />
        <WorkplanePanelMetric
          label="side effect problems"
          value={String(review.input_summary.receipt_side_effect_problem_count)}
        />
      </WorkplanePanelMetricGrid>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>latest PerspectiveUnit record</span>
        <strong>{latest?.record_id ?? "none"}</strong>
        <span style={workplaneCopyStyle}>
          selected {latest?.selected_perspective_unit_candidate_count ?? 0};
          entries {latest?.perspective_unit_entry_count ?? 0}
        </span>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>lifecycle directives</span>
        <span style={workplaneCopyStyle}>
          reinforce {material.reinforce_count}; weaken/warn{" "}
          {material.weaken_or_warn_count}; retire/deprioritize{" "}
          {material.retire_or_deprioritize_count}; split/review{" "}
          {material.split_or_review_count}
        </span>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>receipt no side effects</span>
        <strong>
          PerspectiveUnit records{" "}
          {sideEffects.perspective_unit_record_written_count}
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
          can_write_perspective_unit{" "}
          {String(review.authority_boundary.can_write_perspective_unit)};
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
