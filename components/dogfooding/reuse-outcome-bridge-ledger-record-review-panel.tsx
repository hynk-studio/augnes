import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { ReuseOutcomeBridgeLedgerRecordReview } from "@/types/reuse-outcome-bridge-ledger-record-review";

type ReuseOutcomeBridgeLedgerRecordReviewPanelProps = {
  review: ReuseOutcomeBridgeLedgerRecordReview;
};

export function ReuseOutcomeBridgeLedgerRecordReviewPanel({
  review,
}: ReuseOutcomeBridgeLedgerRecordReviewPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Reuse ledger review"
      title="Reuse Outcome Bridge Ledger Record Review"
      ariaLabel="Reuse Outcome Bridge Ledger Record Review panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only review of already-read HandoffReuseOutcomeLedger records. The
        Workbench default does not open the ledger DB or call write routes.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Review status" value={review.review_status} />
        <WorkplanePanelMetric label="valid records" value={String(review.input_summary.valid_record_count)} />
        <WorkplanePanelMetric label="bridge records" value={String(review.input_summary.bridge_written_record_count)} />
        <WorkplanePanelMetric label="side-effect problems" value={String(review.input_summary.receipt_side_effect_problem_count)} />
      </WorkplanePanelMetricGrid>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>latest record</span>
        <span style={workplaneCopyStyle}>
          {review.latest_record_summary?.record_id ?? "none"}
        </span>
        <span style={workplaneCopyStyle}>
          result {review.latest_record_summary?.result_ref ?? "none"}; work{" "}
          {review.latest_record_summary?.work_ref ?? "none"}; handoff{" "}
          {review.latest_record_summary?.handoff_ref ?? "none"}
        </span>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>reuse counts</span>
        <span style={workplaneCopyStyle}>
          helpful {review.aggregate_counts.helpful_ref_count}; stale{" "}
          {review.aggregate_counts.stale_ref_count}; missing{" "}
          {review.aggregate_counts.missing_ref_count}; noisy{" "}
          {review.aggregate_counts.noisy_ref_count}
        </span>
        <span style={workplaneCopyStyle}>
          misleading {review.aggregate_counts.misleading_ref_count}; unknown{" "}
          {review.aggregate_counts.unknown_ref_count}; carry forward{" "}
          {review.aggregate_counts.carry_forward_count}
        </span>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>quality signals</span>
        <span style={workplaneCopyStyle}>
          skipped {review.aggregate_counts.skipped_or_unverified_check_count};
          not done {review.aggregate_counts.not_done_count}; mismatches{" "}
          {review.aggregate_counts.expected_observed_mismatch_count}
        </span>
      </section>

      <ReasonList
        title="review blockers"
        reasons={[
          ...review.blocked_reasons,
          ...review.insufficient_data_reasons,
        ]}
      />

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>authority boundary</span>
        <strong>Read-only ledger review</strong>
        <span style={workplaneCopyStyle}>
          can_write_handoff_reuse_ledger{" "}
          {String(review.authority_boundary.can_write_handoff_reuse_ledger)};
          can_write_dogfood_metrics{" "}
          {String(review.authority_boundary.can_write_dogfood_metrics)};
          can_write_expected_observed_delta{" "}
          {String(review.authority_boundary.can_write_expected_observed_delta)}
        </span>
        <span style={workplaneCopyStyle}>
          can_write_memory {String(review.authority_boundary.can_write_memory)};
          can_mutate_handoff_context{" "}
          {String(review.authority_boundary.can_mutate_handoff_context)};
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
