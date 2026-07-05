import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { ProjectHistoryIntakePreview } from "@/types/project-history-intake-preview";

type ProjectHistoryIntakePreviewPanelProps = {
  preview: ProjectHistoryIntakePreview;
};

export function ProjectHistoryIntakePreviewPanel({
  preview,
}: ProjectHistoryIntakePreviewPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Project history intake"
      title="Project History Intake Preview"
      ariaLabel="Project History Intake Preview panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only candidate intake for selected project history digest material.
        Workbench supplies empty input by default, so this panel must show no
        current project history material until a selected digest is supplied.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="Intake status"
          value={preview.intake_preview_status}
        />
        <WorkplanePanelMetric
          label="recommended next action"
          value={preview.recommended_next_action}
        />
        <WorkplanePanelMetric
          label="candidate count"
          value={String(preview.input_summary.candidate_count)}
        />
        <WorkplanePanelMetric
          label="unsafe refs"
          value={String(preview.input_summary.unsafe_ref_count)}
        />
      </WorkplanePanelMetricGrid>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>source material</span>
        <span style={workplaneCopyStyle}>
          source_ref {preview.source_status.source_ref}; operator_ref{" "}
          {preview.source_status.operator_ref}; project_ref{" "}
          {preview.source_status.project_ref}; work_ref{" "}
          {preview.source_status.work_ref}
        </span>
        <span style={workplaneCopyStyle}>
          evidence refs {preview.input_summary.evidence_ref_count}; source refs{" "}
          {preview.input_summary.source_ref_count}
        </span>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>candidate buckets</span>
        <span style={workplaneCopyStyle}>
          timeline {preview.candidate_material.timeline_event_candidates.length};
          decisions {preview.candidate_material.decision_candidates.length};
          requirements{" "}
          {preview.candidate_material.requirement_candidates.length}; artifacts{" "}
          {preview.candidate_material.changed_artifact_candidates.length}
        </span>
        <span style={workplaneCopyStyle}>
          risks {preview.candidate_material.risk_or_blocker_candidates.length};
          next actions {preview.candidate_material.next_action_candidates.length}
        </span>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>deterministic extraction</span>
        <span style={workplaneCopyStyle}>
          headings {preview.extracted_preview.heading_lines.length}; checklist{" "}
          {preview.extracted_preview.checklist_lines.length}; PR refs{" "}
          {preview.extracted_preview.pr_like_refs.length}; commit refs{" "}
          {preview.extracted_preview.commit_like_refs.length}
        </span>
        <span style={workplaneCopyStyle}>
          dates {preview.extracted_preview.possible_dates.length}; ref tokens{" "}
          {preview.extracted_preview.explicit_ref_like_tokens.length}
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
          can_create_ingest_record{" "}
          {String(preview.authority_boundary.can_create_ingest_record)};
          can_write_memory{" "}
          {String(preview.authority_boundary.can_write_memory)}
        </span>
        <span style={workplaneCopyStyle}>
          can_mutate_current_working_perspective{" "}
          {String(
            preview.authority_boundary.can_mutate_current_working_perspective,
          )}; can_send_handoff{" "}
          {String(preview.authority_boundary.can_send_handoff)}
        </span>
      </section>
    </WorkplanePanelShell>
  );
}

function ReasonList({
  title,
  reasons,
}: {
  title: string;
  reasons: string[];
}) {
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
