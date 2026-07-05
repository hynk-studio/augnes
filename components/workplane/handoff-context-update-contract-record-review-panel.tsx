import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { HandoffContextUpdateContractRecordReview } from "@/types/handoff-context-update-contract-record-review";

type HandoffContextUpdateContractRecordReviewPanelProps = {
  review: HandoffContextUpdateContractRecordReview;
};

export function HandoffContextUpdateContractRecordReviewPanel({
  review,
}: HandoffContextUpdateContractRecordReviewPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Handoff context"
      title="Handoff Context Update Contract Records"
      ariaLabel="Handoff Context Update Contract Record Review panel"
    >
      <p style={workplaneCopyStyle}>
        Display-only readback of scoped local handoff context update contract
        records. Workbench does not call the write route or apply handoff.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="review status"
          value={review.review_status}
        />
        <WorkplanePanelMetric
          label="valid records"
          value={String(review.input_summary.valid_record_count)}
        />
        <WorkplanePanelMetric
          label="entries"
          value={String(
            review.handoff_context_update_contract_material_summary
              .proposed_handoff_context_entry_count,
          )}
        />
        <WorkplanePanelMetric
          label="receipt problems"
          value={String(
            review.input_summary.receipt_side_effect_problem_count,
          )}
        />
      </WorkplanePanelMetricGrid>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>latest record</span>
        <strong>{review.latest_record_summary?.record_id ?? "none"}</strong>
        <span style={workplaneCopyStyle}>
          route read{" "}
          {review.latest_record_summary?.source_route_integration_read_ref ??
            "missing"}
          ; applied snapshot{" "}
          {review.latest_record_summary?.source_applied_snapshot_ref ??
            "none"}
        </span>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>section counts</span>
        <ul style={workplaneListStyle}>
          {Object.entries(
            review.handoff_context_update_contract_material_summary
              .section_counts,
          )
            .slice(0, 12)
            .map(([section, count]) => (
              <li key={section} style={workplaneItemStyle}>
                <span style={workplaneCopyStyle}>
                  {section}: {count}
                </span>
              </li>
            ))}
        </ul>
      </section>

      <ReasonList
        title="record blockers"
        reasons={[
          ...review.blocked_reasons,
          ...review.insufficient_data_reasons,
        ]}
      />

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>authority boundary</span>
        <strong>Read-only record review</strong>
        <span style={workplaneCopyStyle}>
          can_write_db {String(review.authority_boundary.can_write_db)};
          can_apply_handoff{" "}
          {String(
            review.authority_boundary.can_apply_handoff_context_update,
          )}
          ; can_send_handoff{" "}
          {String(review.authority_boundary.can_send_handoff)}
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
