import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { DogfoodMetricCandidatePreview } from "@/types/dogfood-metric-candidate-preview";
import type { CSSProperties } from "react";

type DogfoodMetricCandidatePreviewPanelProps = {
  preview: DogfoodMetricCandidatePreview;
};

const sectionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))",
  gap: "10px",
  minWidth: 0,
};

export function DogfoodMetricCandidatePreviewPanel({
  preview,
}: DogfoodMetricCandidatePreviewPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Dogfood metrics"
      title="Reuse metric candidates"
      ariaLabel="Dogfood metric candidate preview"
    >
      <p style={workplaneCopyStyle}>
        Read-only candidate metric preview derived from approved handoff reuse
        outcome ledger records. This panel does not write dogfood metrics,
        update baselines, mutate memory, apply Perspective state, call GitHub
        or Codex, or send a handoff.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="Status"
          value={preview.candidate_status}
        />
        <WorkplanePanelMetric
          label="Approved records"
          value={preview.aggregate_counts.approved_record_count}
        />
        <WorkplanePanelMetric
          label="Helpful refs"
          value={preview.aggregate_counts.helpful_ref_count}
        />
        <WorkplanePanelMetric
          label="Problem refs"
          value={
            preview.aggregate_counts.stale_ref_count +
            preview.aggregate_counts.missing_ref_count +
            preview.aggregate_counts.noisy_ref_count +
            preview.aggregate_counts.misleading_ref_count +
            preview.aggregate_counts.unknown_ref_count
          }
        />
      </WorkplanePanelMetricGrid>

      <section style={sectionGridStyle}>
        <MetricCandidateSummary preview={preview} />
        <ReuseBuckets preview={preview} />
        <HandoffSignals preview={preview} />
        <MetricWriteReadiness preview={preview} />
      </section>

      <section
        aria-label="Dogfood metric candidate source records"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>source records</span>
        <ul style={workplaneListStyle}>
          {preview.source_record_summaries.slice(0, 4).map((summary) => (
            <li key={summary.record_id} style={workplaneItemStyle}>
              <strong>{summary.result_report_ref}</strong>
              <span style={workplaneCopyStyle}>
                {summary.proposed_record_kind}; helpful{" "}
                {summary.helpful_ref_count}; stale {summary.stale_ref_count};
                missing {summary.missing_ref_count}; noisy{" "}
                {summary.noisy_ref_count}; misleading{" "}
                {summary.misleading_ref_count}; unknown{" "}
                {summary.unknown_ref_count}
              </span>
              <span style={workplaneCopyStyle}>
                {summary.mismatch_summary}
              </span>
            </li>
          ))}
          {preview.source_record_summaries.length === 0 ? (
            <li style={workplaneItemStyle}>
              <span style={workplaneCopyStyle}>
                No approved ledger records are available in the current
                preview window.
              </span>
            </li>
          ) : null}
        </ul>
      </section>

      <section
        aria-label="Dogfood metric candidate authority boundary"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>authority</span>
        <strong>Read-only candidate metric preview</strong>
        <span style={workplaneCopyStyle}>
          source_of_truth{" "}
          {String(preview.authority_boundary.source_of_truth)};
          can_write_dogfood_metrics{" "}
          {String(preview.authority_boundary.can_write_dogfood_metrics)};
          can_update_metrics{" "}
          {String(preview.authority_boundary.can_update_metrics)};
          can_write_dogfood_ledger{" "}
          {String(preview.authority_boundary.can_write_dogfood_ledger)};
          can_mutate_memory{" "}
          {String(preview.authority_boundary.can_mutate_memory)};
          can_apply_project_perspective{" "}
          {String(preview.authority_boundary.can_apply_project_perspective)}
        </span>
      </section>
    </WorkplanePanelShell>
  );
}

function MetricCandidateSummary({
  preview,
}: {
  preview: DogfoodMetricCandidatePreview;
}) {
  return (
    <section
      aria-label="Dogfood metric candidate summary"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>candidate summary</span>
      <p style={workplaneCopyStyle}>{preview.summary}</p>
      <span style={workplaneCopyStyle}>
        record_count {preview.ledger_source.record_count}; raw_record_count{" "}
        {preview.ledger_source.raw_record_count}; excluded{" "}
        {preview.ledger_source.excluded_record_count}
      </span>
      <ul style={workplaneListStyle}>
        {preview.insufficient_data_reasons.slice(0, 4).map((reason) => (
          <li key={reason} style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>{reason}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ReuseBuckets({
  preview,
}: {
  preview: DogfoodMetricCandidatePreview;
}) {
  const counts = preview.aggregate_counts;
  return (
    <section
      aria-label="Dogfood metric candidate reuse buckets"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>reuse buckets</span>
      <span style={workplaneCopyStyle}>
        helpful {counts.helpful_ref_count}; stale {counts.stale_ref_count};
        missing {counts.missing_ref_count}; noisy {counts.noisy_ref_count};
        misleading {counts.misleading_ref_count}; unknown{" "}
        {counts.unknown_ref_count}
      </span>
      <span style={workplaneCopyStyle}>
        {preview.reuse_quality_candidate.summary}
      </span>
    </section>
  );
}

function HandoffSignals({
  preview,
}: {
  preview: DogfoodMetricCandidatePreview;
}) {
  const counts = preview.aggregate_counts;
  return (
    <section
      aria-label="Dogfood metric candidate handoff signals"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>handoff signals</span>
      <span style={workplaneCopyStyle}>
        skipped_or_unverified_checks{" "}
        {counts.skipped_or_unverified_check_count}; not_done{" "}
        {counts.not_done_item_count}; mismatch_records{" "}
        {counts.expected_observed_mismatch_count}
      </span>
      <span style={workplaneCopyStyle}>
        {preview.handoff_quality_candidate.summary}
      </span>
    </section>
  );
}

function MetricWriteReadiness({
  preview,
}: {
  preview: DogfoodMetricCandidatePreview;
}) {
  return (
    <section
      aria-label="Dogfood metric write readiness"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>metric write readiness</span>
      <strong>
        ready_for_metric_write{" "}
        {String(preview.metric_write_readiness.ready_for_metric_write)}
      </strong>
      <ul style={workplaneListStyle}>
        {preview.metric_write_readiness.refusal_reasons.map((reason) => (
          <li key={reason} style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>{reason}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
