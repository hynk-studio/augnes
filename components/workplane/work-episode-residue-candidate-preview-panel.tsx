import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { WorkEpisodeResidueCandidatePreview } from "@/types/work-episode-residue-candidate-preview";

type WorkEpisodeResidueCandidatePreviewPanelProps = {
  preview: WorkEpisodeResidueCandidatePreview;
};

export function WorkEpisodeResidueCandidatePreviewPanel({
  preview,
}: WorkEpisodeResidueCandidatePreviewPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Work episode residue"
      title="Work Episode Residue Candidate Preview"
      ariaLabel="Work Episode Residue Candidate Preview panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only candidate residue derived from Codex result report intake
        material. It prepares later review of expected/observed deltas and
        reuse outcomes without writing them.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Residue status" value={preview.residue_preview_status} />
        <WorkplanePanelMetric label="recommended next action" value={preview.recommended_next_action} />
        <WorkplanePanelMetric label="residue candidates" value={String(preview.input_summary.residue_candidate_count)} />
        <WorkplanePanelMetric label="records" value={String(preview.input_summary.record_count)} />
      </WorkplanePanelMetricGrid>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>candidate residue</span>
        <span style={workplaneCopyStyle}>
          summaries {preview.candidate_residue.work_episode_summary_candidates.length};
          artifacts {preview.candidate_residue.changed_artifact_candidates.length};
          verification {preview.candidate_residue.verification_result_candidates.length};
          skipped {preview.candidate_residue.skipped_verification_candidates.length}
        </span>
        <span style={workplaneCopyStyle}>
          expected/observed{" "}
          {preview.candidate_residue.expected_observed_signal_candidates.length};
          context reuse {preview.candidate_residue.context_reuse_signal_candidates.length};
          next work {preview.candidate_residue.next_work_bias_candidates.length}
        </span>
      </section>

      <ReasonList
        title="residue blockers"
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
          can_write_work_episode{" "}
          {String(preview.authority_boundary.can_write_work_episode)};
          can_write_expected_observed_delta{" "}
          {String(preview.authority_boundary.can_write_expected_observed_delta)};
          can_write_reuse_outcome_ledger{" "}
          {String(preview.authority_boundary.can_write_reuse_outcome_ledger)}
        </span>
        <span style={workplaneCopyStyle}>
          can_write_dogfood_metrics{" "}
          {String(preview.authority_boundary.can_write_dogfood_metrics)};
          can_write_memory {String(preview.authority_boundary.can_write_memory)};
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
