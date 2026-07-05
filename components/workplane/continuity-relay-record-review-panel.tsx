import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { ContinuityRelayRecordReview } from "@/types/continuity-relay-record-review";

type ContinuityRelayRecordReviewPanelProps = {
  review: ContinuityRelayRecordReview;
};

export function ContinuityRelayRecordReviewPanel({
  review,
}: ContinuityRelayRecordReviewPanelProps) {
  const latest = review.latest_record_summary;
  const material = review.continuity_relay_material_summary;
  const sideEffects = review.receipt_no_side_effects_summary;

  return (
    <WorkplanePanelShell
      kicker="Scoped ContinuityRelay record"
      title="ContinuityRelay Record Review"
      ariaLabel="ContinuityRelay Record Review panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only review of already-read scoped ContinuityRelay records. Workbench
        supplies no default database read and no sample records.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Review status" value={review.review_status} />
        <WorkplanePanelMetric
          label="record count"
          value={String(review.input_summary.valid_record_count)}
        />
        <WorkplanePanelMetric
          label="relay entries"
          value={String(material.continuity_relay_entry_count)}
        />
        <WorkplanePanelMetric
          label="side effect problems"
          value={String(review.input_summary.receipt_side_effect_problem_count)}
        />
      </WorkplanePanelMetricGrid>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>latest ContinuityRelay record</span>
        <strong>{latest?.record_id ?? "none"}</strong>
        <span style={workplaneCopyStyle}>
          selected {latest?.selected_continuity_relay_candidate_count ?? 0};
          entries {latest?.continuity_relay_entry_count ?? 0}
        </span>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>relay directives</span>
        <span style={workplaneCopyStyle}>
          preserve anchor {material.preserve_anchor_count}; warn anchor{" "}
          {material.warn_anchor_count}; stop if missing{" "}
          {material.stop_if_missing_count}; next focus {material.next_focus_count};
          update suggestions {material.relay_update_suggestion_count}
        </span>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>receipt no side effects</span>
        <strong>
          ContinuityRelay records{" "}
          {sideEffects.continuity_relay_record_written_count}
        </strong>
        <span style={workplaneCopyStyle}>
          perspective_unit_written {sideEffects.perspective_unit_written_count};
          next_work_bias_written {sideEffects.next_work_bias_written_count};
          scoped continuity_relay_written{" "}
          {sideEffects.continuity_relay_written_count}; CWP updated{" "}
          {sideEffects.current_working_perspective_updated_count}; live relay
          updated {sideEffects.continuity_relay_updated_count}; handoff{" "}
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
          can_write_perspective_unit{" "}
          {String(review.authority_boundary.can_write_perspective_unit)};
          can_write_next_work_bias{" "}
          {String(review.authority_boundary.can_write_next_work_bias)};
          can_write_continuity_relay{" "}
          {String(review.authority_boundary.can_write_continuity_relay)};
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
