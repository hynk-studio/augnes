import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { DogfoodMetricSnapshotRecordReview } from "@/types/dogfood-metric-snapshot-record-review";

type DogfoodMetricSnapshotRecordReviewPanelProps = {
  review: DogfoodMetricSnapshotRecordReview;
};

export function DogfoodMetricSnapshotRecordReviewPanel({
  review,
}: DogfoodMetricSnapshotRecordReviewPanelProps) {
  const latest = review.latest_record_summary;
  const sideEffects = review.receipt_no_side_effects_summary;

  return (
    <WorkplanePanelShell
      kicker="Metric snapshot review"
      title="Dogfood Metric Snapshot Record Review"
      ariaLabel="Dogfood Metric Snapshot Record Review panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only review of already-read dogfood metric snapshot records.
        Workbench supplies no default database read and no sample metric record.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Review status" value={review.review_status} />
        <WorkplanePanelMetric label="record count" value={String(review.input_summary.valid_record_count)} />
        <WorkplanePanelMetric label="selected refs" value={String(review.input_summary.selected_metric_candidate_ref_count)} />
        <WorkplanePanelMetric label="side effect problems" value={String(review.input_summary.receipt_side_effect_problem_count)} />
      </WorkplanePanelMetricGrid>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>latest metric snapshot</span>
        <strong>{latest?.record_id ?? "none"}</strong>
        <span style={workplaneCopyStyle}>
          window {latest?.metric_window_start ?? "none"} to{" "}
          {latest?.metric_window_end ?? "none"}; operator{" "}
          {latest?.operator_ref ?? "none"}
        </span>
        <span style={workplaneCopyStyle}>
          helpful {latest?.helpful_context_signal_count ?? 0}; stale{" "}
          {latest?.stale_context_signal_count ?? 0}; missing{" "}
          {latest?.missing_context_signal_count ?? 0}; noisy{" "}
          {latest?.noisy_context_signal_count ?? 0}; misleading{" "}
          {latest?.misleading_context_signal_count ?? 0}; unknown{" "}
          {latest?.unknown_context_signal_count ?? 0}
        </span>
        <span style={workplaneCopyStyle}>
          skipped {latest?.skipped_or_unverified_check_count ?? 0}; not done{" "}
          {latest?.not_done_item_count ?? 0}; mismatches{" "}
          {latest?.expected_observed_mismatch_count ?? 0}; carry forward{" "}
          {latest?.carry_forward_candidate_count ?? 0}
        </span>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>receipt no side effects</span>
        <strong>
          snapshots {sideEffects.dogfood_metric_snapshot_record_written_count}
        </strong>
        <span style={workplaneCopyStyle}>
          receipts {sideEffects.dogfood_metric_snapshot_receipt_written_count};
          persisted {sideEffects.dogfood_metric_snapshot_persisted_count}
        </span>
        <span style={workplaneCopyStyle}>
          global metrics {sideEffects.dogfood_metrics_global_state_updated_count};
          reuse ledger {sideEffects.reuse_outcome_ledger_written_count};
          ExpectedObservedDelta{" "}
          {sideEffects.expected_observed_delta_written_count}; WorkEpisode{" "}
          {sideEffects.work_episode_written_count}; memory{" "}
          {sideEffects.memory_mutated_count}
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
          can_write_dogfood_metric_snapshot{" "}
          {String(review.authority_boundary.can_write_dogfood_metric_snapshot)};
          can_update_metrics {String(review.authority_boundary.can_update_metrics)}
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
