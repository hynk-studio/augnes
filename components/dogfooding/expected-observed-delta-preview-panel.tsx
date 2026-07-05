import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { ExpectedObservedDeltaPreview } from "@/types/expected-observed-delta-preview";

type ExpectedObservedDeltaPreviewPanelProps = {
  preview: ExpectedObservedDeltaPreview;
};

export function ExpectedObservedDeltaPreviewPanel({
  preview,
}: ExpectedObservedDeltaPreviewPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Expected observed delta"
      title="ExpectedObservedDelta Candidate Preview"
      ariaLabel="ExpectedObservedDelta Candidate Preview panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only comparison of expected result signals against observed changed
        files, checks, skipped checks, not-done items, requirement progress, and
        followups. This is learning signal, not approval.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Delta status" value={preview.delta_preview_status} />
        <WorkplanePanelMetric label="recommended next action" value={preview.recommended_next_action} />
        <WorkplanePanelMetric label="expected signals" value={String(preview.input_summary.expected_signal_count)} />
        <WorkplanePanelMetric label="observed signals" value={String(preview.input_summary.observed_signal_count)} />
      </WorkplanePanelMetricGrid>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>delta candidates</span>
        <span style={workplaneCopyStyle}>
          matched {preview.mismatch_summary.matched_expectation_count}; missing{" "}
          {preview.mismatch_summary.missing_expectation_count}; unexpected{" "}
          {preview.mismatch_summary.unexpected_observation_count}
        </span>
        <span style={workplaneCopyStyle}>
          skipped {preview.mismatch_summary.skipped_or_unverified_check_count};
          not done {preview.mismatch_summary.not_done_count}; files{" "}
          {preview.mismatch_summary.changed_file_delta_count}; requirements{" "}
          {preview.mismatch_summary.requirement_progress_delta_count}
        </span>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>comparison guardrails</span>
        <span style={workplaneCopyStyle}>
          skipped_checks_count_as_passed{" "}
          {String(preview.verification_comparison.skipped_checks_count_as_passed)};
          changed_files_are_not_requirement_completion{" "}
          {String(
            preview.requirement_progress_comparison
              .changed_files_are_not_requirement_completion,
          )}
        </span>
      </section>

      <ReasonList
        title="delta blockers"
        reasons={[
          ...preview.blocked_reasons,
          ...preview.insufficient_data_reasons,
          ...preview.evidence_summary.missing_evidence,
        ]}
      />

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>would not write</span>
        <ul style={workplaneListStyle}>
          {preview.would_not_write.slice(0, 10).map((item) => (
            <li key={item} style={workplaneItemStyle}>
              <span style={workplaneCopyStyle}>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>authority boundary</span>
        <strong>Read-only candidate material</strong>
        <span style={workplaneCopyStyle}>
          can_write_expected_observed_delta{" "}
          {String(preview.authority_boundary.can_write_expected_observed_delta)};
          can_write_reuse_outcome_ledger{" "}
          {String(preview.authority_boundary.can_write_reuse_outcome_ledger)};
          can_write_dogfood_metrics{" "}
          {String(preview.authority_boundary.can_write_dogfood_metrics)}
        </span>
        <span style={workplaneCopyStyle}>
          can_write_memory {String(preview.authority_boundary.can_write_memory)};
          can_update_current_working_perspective{" "}
          {String(preview.authority_boundary.can_update_current_working_perspective)};
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
