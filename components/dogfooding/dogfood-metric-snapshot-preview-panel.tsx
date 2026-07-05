import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { DogfoodMetricSnapshotPreview } from "@/types/dogfood-metric-snapshot-preview";

type DogfoodMetricSnapshotPreviewPanelProps = {
  preview: DogfoodMetricSnapshotPreview;
};

export function DogfoodMetricSnapshotPreviewPanel({
  preview,
}: DogfoodMetricSnapshotPreviewPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Dogfood metric snapshot"
      title="Dogfood Metric Snapshot Candidate Preview"
      ariaLabel="Dogfood Metric Snapshot Candidate Preview panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only metric snapshot candidate material from approved reuse outcome
        ledger records and ExpectedObservedDelta review. Metrics remain local
        snapshot candidates, not proof of improvement.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Snapshot status" value={preview.snapshot_preview_status} />
        <WorkplanePanelMetric label="recommended next action" value={preview.recommended_next_action} />
        <WorkplanePanelMetric label="approved records" value={String(preview.input_summary.approved_reuse_ledger_record_count)} />
        <WorkplanePanelMetric label="metric candidates" value={String(preview.input_summary.metric_candidate_ref_count)} />
      </WorkplanePanelMetricGrid>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>reuse quality</span>
        <span style={workplaneCopyStyle}>
          helpful {preview.reuse_quality_metrics.helpful_context_signal_count};
          stale {preview.reuse_quality_metrics.stale_context_signal_count};
          missing {preview.reuse_quality_metrics.missing_context_signal_count};
          noisy {preview.reuse_quality_metrics.noisy_context_signal_count}
        </span>
        <span style={workplaneCopyStyle}>
          misleading {preview.reuse_quality_metrics.misleading_context_signal_count};
          unknown {preview.reuse_quality_metrics.unknown_context_signal_count}
        </span>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>verification burden</span>
        <span style={workplaneCopyStyle}>
          skipped {preview.verification_quality_metrics.skipped_or_unverified_check_count};
          not done {preview.handoff_quality_metrics.not_done_item_count};
          mismatches {preview.expected_observed_quality_metrics.expected_observed_mismatch_count};
          requirement gaps {preview.expected_observed_quality_metrics.requirement_progress_gap_count}
        </span>
      </section>

      <ReasonList
        title="metric snapshot blockers"
        reasons={[
          ...preview.blocked_reasons,
          ...preview.insufficient_data_reasons,
          ...preview.evidence_summary.missing_evidence,
        ]}
      />

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>authority boundary</span>
        <strong>Read-only metric candidate material</strong>
        <span style={workplaneCopyStyle}>
          can_write_dogfood_metric_snapshot{" "}
          {String(preview.authority_boundary.can_write_dogfood_metric_snapshot)};
          can_update_metrics {String(preview.authority_boundary.can_update_metrics)};
          can_write_reuse_outcome_ledger{" "}
          {String(preview.authority_boundary.can_write_reuse_outcome_ledger)}
        </span>
        <span style={workplaneCopyStyle}>
          can_write_perspective_unit{" "}
          {String(preview.authority_boundary.can_write_perspective_unit)};
          can_update_continuity_relay{" "}
          {String(preview.authority_boundary.can_update_continuity_relay)};
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
