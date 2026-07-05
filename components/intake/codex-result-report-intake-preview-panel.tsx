import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { CodexResultReportIntakePreview } from "@/types/codex-result-report-intake-preview";

type CodexResultReportIntakePreviewPanelProps = {
  preview: CodexResultReportIntakePreview;
};

export function CodexResultReportIntakePreviewPanel({
  preview,
}: CodexResultReportIntakePreviewPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Codex result report intake"
      title="Codex Result Report Intake Preview"
      ariaLabel="Codex Result Report Intake Preview panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only candidate intake for selected Codex result report material.
        Workbench supplies empty input by default, so this panel shows no
        current report until one is selected.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Intake status" value={preview.intake_preview_status} />
        <WorkplanePanelMetric label="recommended next action" value={preview.recommended_next_action} />
        <WorkplanePanelMetric label="candidate count" value={String(preview.input_summary.candidate_count)} />
        <WorkplanePanelMetric label="unsafe refs" value={String(preview.input_summary.unsafe_ref_count)} />
      </WorkplanePanelMetricGrid>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>source material</span>
        <span style={workplaneCopyStyle}>
          source_ref {preview.source_status.source_ref}; operator_ref{" "}
          {preview.source_status.operator_ref}; work_ref{" "}
          {preview.source_status.work_ref}; result_ref{" "}
          {preview.source_status.result_ref}
        </span>
        <span style={workplaneCopyStyle}>
          pr_ref {preview.source_status.pr_ref}; commit_ref{" "}
          {preview.source_status.commit_ref}; evidence refs{" "}
          {preview.input_summary.evidence_ref_count}
        </span>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>candidate buckets</span>
        <span style={workplaneCopyStyle}>
          summaries {preview.candidate_material.result_summary_candidates.length};
          changed files {preview.candidate_material.changed_file_candidates.length};
          checks {preview.candidate_material.check_result_candidates.length};
          skipped {preview.candidate_material.skipped_check_candidates.length}
        </span>
        <span style={workplaneCopyStyle}>
          not done {preview.candidate_material.not_done_candidates.length};
          expected/observed{" "}
          {preview.candidate_material.expected_observed_signal_candidates.length};
          context reuse{" "}
          {preview.candidate_material.context_reuse_signal_candidates.length};
          followups {preview.candidate_material.followup_candidates.length}
        </span>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>deterministic extraction</span>
        <span style={workplaneCopyStyle}>
          status lines {preview.extracted_preview.result_status_lines.length};
          changed file lines {preview.extracted_preview.changed_file_lines.length};
          check lines {preview.extracted_preview.check_lines.length}; PR refs{" "}
          {preview.extracted_preview.pr_like_refs.length}
        </span>
        <span style={workplaneCopyStyle}>
          commit refs {preview.extracted_preview.commit_like_refs.length}; ref
          tokens {preview.extracted_preview.explicit_ref_like_tokens.length}
        </span>
      </section>

      <ReasonList
        title="missing and blockers"
        reasons={[
          ...preview.blocked_reasons,
          ...preview.insufficient_data_reasons,
          ...preview.evidence_summary.missing_evidence,
        ]}
      />

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>authority boundary</span>
        <strong>Read-only candidate preview</strong>
        <span style={workplaneCopyStyle}>
          can_write_db {String(preview.authority_boundary.can_write_db)};
          can_write_work_episode{" "}
          {String(preview.authority_boundary.can_write_work_episode)};
          can_write_dogfood_metrics{" "}
          {String(preview.authority_boundary.can_write_dogfood_metrics)}
        </span>
        <span style={workplaneCopyStyle}>
          can_write_memory {String(preview.authority_boundary.can_write_memory)};
          can_send_handoff {String(preview.authority_boundary.can_send_handoff)};
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
