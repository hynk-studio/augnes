import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { ExpectedObservedDeltaRecordReview } from "@/types/expected-observed-delta-record-review";

type ExpectedObservedDeltaRecordReviewPanelProps = {
  review: ExpectedObservedDeltaRecordReview;
};

export function ExpectedObservedDeltaRecordReviewPanel({
  review,
}: ExpectedObservedDeltaRecordReviewPanelProps) {
  const latest = review.latest_record_summary;
  const sideEffects = review.receipt_no_side_effects_summary;

  return (
    <WorkplanePanelShell
      kicker="Delta record review"
      title="ExpectedObservedDelta Record Review"
      ariaLabel="ExpectedObservedDelta Record Review panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only review of already-read ExpectedObservedDelta records.
        Workbench supplies no default database read and no sample current
        record.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Review status" value={review.review_status} />
        <WorkplanePanelMetric label="record count" value={String(review.input_summary.valid_record_count)} />
        <WorkplanePanelMetric label="selected delta refs" value={String(review.input_summary.selected_delta_candidate_ref_count)} />
        <WorkplanePanelMetric label="side effect problems" value={String(review.input_summary.receipt_side_effect_problem_count)} />
      </WorkplanePanelMetricGrid>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>latest expected observed delta</span>
        <strong>{latest?.record_id ?? "none"}</strong>
        <span style={workplaneCopyStyle}>
          work {latest?.work_ref ?? "none"}; result{" "}
          {latest?.result_ref ?? "none"}; handoff{" "}
          {latest?.handoff_ref ?? "none"}; operator{" "}
          {latest?.operator_ref ?? "none"}
        </span>
        <span style={workplaneCopyStyle}>
          matched {latest?.matched_expectation_count ?? 0}; missing{" "}
          {latest?.missing_expectation_count ?? 0}; unexpected{" "}
          {latest?.unexpected_observation_count ?? 0}; skipped{" "}
          {latest?.skipped_or_unverified_check_count ?? 0}; not done{" "}
          {latest?.not_done_count ?? 0}
        </span>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>receipt no side effects</span>
        <strong>
          delta records {sideEffects.expected_observed_delta_record_written_count}
        </strong>
        <span style={workplaneCopyStyle}>
          receipts {sideEffects.expected_observed_delta_receipt_written_count};
          persisted dogfood signal{" "}
          {sideEffects.expected_observed_delta_persisted_as_dogfood_signal_record_count}
        </span>
        <span style={workplaneCopyStyle}>
          reuse ledger {sideEffects.reuse_outcome_ledger_written_count};
          dogfood metrics {sideEffects.dogfood_metrics_written_count};
          WorkEpisode {sideEffects.work_episode_written_count}; memory{" "}
          {sideEffects.memory_mutated_count}; CWP{" "}
          {sideEffects.current_working_perspective_updated_count}
        </span>
        <span style={workplaneCopyStyle}>
          Perspective {sideEffects.perspective_unit_written_count}; relay{" "}
          {sideEffects.continuity_relay_written_count}; handoff{" "}
          {sideEffects.handoff_context_mutated_count}; provider{" "}
          {sideEffects.provider_called_count}; GitHub{" "}
          {sideEffects.github_called_count}; Codex{" "}
          {sideEffects.codex_executed_count}
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
          can_write_expected_observed_delta{" "}
          {String(review.authority_boundary.can_write_expected_observed_delta)};
          can_write_reuse_outcome_ledger{" "}
          {String(review.authority_boundary.can_write_reuse_outcome_ledger)}
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
