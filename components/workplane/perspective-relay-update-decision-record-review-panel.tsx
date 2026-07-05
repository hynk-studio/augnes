import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { PerspectiveRelayUpdateDecisionRecordReview } from "@/types/perspective-relay-update-decision-record-review";

type PerspectiveRelayUpdateDecisionRecordReviewPanelProps = {
  review: PerspectiveRelayUpdateDecisionRecordReview;
};

export function PerspectiveRelayUpdateDecisionRecordReviewPanel({
  review,
}: PerspectiveRelayUpdateDecisionRecordReviewPanelProps) {
  const latest = review.latest_record_summary;
  const sideEffects = review.receipt_no_side_effects_summary;

  return (
    <WorkplanePanelShell
      kicker="Perspective relay update record"
      title="Perspective Relay Update Decision Record Review"
      ariaLabel="Perspective Relay Update Decision Record Review panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only review of already-read perspective relay update decision records.
        Workbench supplies no default database read and no sample records.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Review status" value={review.review_status} />
        <WorkplanePanelMetric label="record count" value={String(review.input_summary.valid_record_count)} />
        <WorkplanePanelMetric label="selected candidates" value={String(review.input_summary.selected_candidate_ref_count)} />
        <WorkplanePanelMetric label="side effect problems" value={String(review.input_summary.receipt_side_effect_problem_count)} />
      </WorkplanePanelMetricGrid>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>latest decision record</span>
        <strong>{latest?.record_id ?? "none"}</strong>
        <span style={workplaneCopyStyle}>
          selected {latest?.selected_candidate_count ?? 0}; perspective{" "}
          {latest?.selected_perspective_unit_candidate_count ?? 0}; next-work{" "}
          {latest?.selected_next_work_bias_candidate_count ?? 0}; relay{" "}
          {latest?.selected_continuity_relay_candidate_count ?? 0}
        </span>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>receipt no side effects</span>
        <strong>
          records {sideEffects.perspective_relay_update_decision_record_written_count}
        </strong>
        <span style={workplaneCopyStyle}>
          PerspectiveUnit {sideEffects.perspective_unit_written_count};
          NextWorkBias {sideEffects.next_work_bias_written_count}; CWP{" "}
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
          can_write_perspective_relay_update_decision{" "}
          {String(review.authority_boundary.can_write_perspective_relay_update_decision)};
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
