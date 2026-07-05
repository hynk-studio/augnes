import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { ReuseOutcomeCandidateBridgePreview } from "@/types/reuse-outcome-candidate-bridge-preview";

type ReuseOutcomeCandidateBridgePreviewPanelProps = {
  preview: ReuseOutcomeCandidateBridgePreview;
};

export function ReuseOutcomeCandidateBridgePreviewPanel({
  preview,
}: ReuseOutcomeCandidateBridgePreviewPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Reuse outcome bridge"
      title="Reuse Outcome Candidate Bridge Preview"
      ariaLabel="Reuse Outcome Candidate Bridge Preview panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only bridge material for a future reuse outcome review. It prepares
        candidate classifications without writing the reuse ledger or dogfood
        metrics.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Bridge status" value={preview.bridge_preview_status} />
        <WorkplanePanelMetric label="recommended next action" value={preview.recommended_next_action} />
        <WorkplanePanelMetric label="delta material" value={String(preview.input_summary.delta_material_count)} />
        <WorkplanePanelMetric label="bridge candidates" value={String(preview.input_summary.bridge_candidate_count)} />
      </WorkplanePanelMetricGrid>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>reuse classifications</span>
        <span style={workplaneCopyStyle}>
          helpful {preview.proposed_reuse_classifications.helpful_refs.length};
          stale {preview.proposed_reuse_classifications.stale_refs.length};
          missing {preview.proposed_reuse_classifications.missing_refs.length}
        </span>
        <span style={workplaneCopyStyle}>
          noisy {preview.proposed_reuse_classifications.noisy_refs.length};
          misleading{" "}
          {preview.proposed_reuse_classifications.misleading_refs.length};
          unknown {preview.proposed_reuse_classifications.unknown_refs.length}
        </span>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>handoff quality signals</span>
        <span style={workplaneCopyStyle}>
          skipped{" "}
          {preview.proposed_handoff_quality_signals.skipped_or_unverified_checks.length};
          not done {preview.proposed_handoff_quality_signals.not_done_items.length};
          mismatches{" "}
          {preview.proposed_handoff_quality_signals.expected_observed_mismatches.length}
        </span>
        <span style={workplaneCopyStyle}>
          requirement gaps{" "}
          {preview.proposed_handoff_quality_signals.requirement_progress_gaps.length};
          context feedback{" "}
          {preview.proposed_handoff_quality_signals.context_feedback_signals.length}
        </span>
      </section>

      <ReasonList
        title="bridge blockers"
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
        <strong>Read-only reuse outcome candidates</strong>
        <span style={workplaneCopyStyle}>
          can_write_reuse_outcome_ledger{" "}
          {String(preview.authority_boundary.can_write_reuse_outcome_ledger)};
          can_write_dogfood_metrics{" "}
          {String(preview.authority_boundary.can_write_dogfood_metrics)};
          can_write_expected_observed_delta{" "}
          {String(preview.authority_boundary.can_write_expected_observed_delta)}
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
