import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { CodexResultReportIntakeOperatorDecisionPreview } from "@/types/codex-result-report-intake-decision";

type CodexResultReportIntakeDecisionPanelProps = {
  preview: CodexResultReportIntakeOperatorDecisionPreview;
};

export function CodexResultReportIntakeDecisionPanel({
  preview,
}: CodexResultReportIntakeDecisionPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Codex result report decision"
      title="Codex Result Report Intake Operator Decision"
      ariaLabel="Codex Result Report Intake Operator Decision panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only operator decision preview for Codex result report candidate
        ingest. It consumes the already-built Codex result report intake preview and
        does not parse raw Codex result report material.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="Decision status"
          value={preview.decision_preview_status}
        />
        <WorkplanePanelMetric
          label="recommended operator decision"
          value={preview.recommended_operator_decision}
        />
        <WorkplanePanelMetric
          label="write readiness"
          value={String(preview.write_readiness.write_ready)}
        />
        <WorkplanePanelMetric
          label="selected refs"
          value={String(preview.input_summary.selected_candidate_ref_count)}
        />
      </WorkplanePanelMetricGrid>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>future candidate record</span>
        <strong>
          {preview.would_write_candidate_record_preview.proposed_record_kind ??
            "none"}
        </strong>
        <span style={workplaneCopyStyle}>
          source {preview.would_write_candidate_record_preview.source_ref ??
            "none"}; work{" "}
          {preview.would_write_candidate_record_preview.work_ref ?? "none"};
          result{" "}
          {preview.would_write_candidate_record_preview.result_ref ?? "none"};
          operator{" "}
          {preview.would_write_candidate_record_preview.operator_ref ?? "none"}
        </span>
        <span style={workplaneCopyStyle}>
          PR {preview.would_write_candidate_record_preview.pr_ref ?? "none"};
          commit{" "}
          {preview.would_write_candidate_record_preview.commit_ref ?? "none"}
        </span>
        <span style={workplaneCopyStyle}>
          privacy{" "}
          {preview.would_write_candidate_record_preview
            .privacy_review_confirmation_ref ?? "missing"}; idempotency{" "}
          {preview.would_write_candidate_record_preview
            .requested_idempotency_key ?? "missing"}
        </span>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>approval requirements</span>
        <ul style={workplaneListStyle}>
          {preview.approval_requirements.slice(0, 8).map((requirement) => (
            <li key={requirement} style={workplaneItemStyle}>
              <span style={workplaneCopyStyle}>{requirement}</span>
            </li>
          ))}
        </ul>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>would-write candidate material</span>
        <span style={workplaneCopyStyle}>
          candidate summaries{" "}
          {
            preview.would_write_candidate_record_preview
              .sanitized_candidate_summaries.length
          }
          ; review-only carry-forward{" "}
          {preview.candidate_carry_forward.review_only_candidates.length}
        </span>
      </section>

      <ReasonList
        title="blockers missing refusals"
        reasons={[
          ...preview.blocking_reasons,
          ...preview.missing_evidence,
          ...preview.refusal_reasons,
          ...preview.write_readiness.current_insufficient_data,
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
        <strong>Read-only decision preview</strong>
        <span style={workplaneCopyStyle}>
          can_write_db {String(preview.authority_boundary.can_write_db)};
          can_create_ingest_record{" "}
          {String(preview.authority_boundary.can_create_ingest_record)};
          can_write_work_episode{" "}
          {String(preview.authority_boundary.can_write_work_episode)};
          can_write_dogfood_metrics{" "}
          {String(preview.authority_boundary.can_write_dogfood_metrics)};
          can_write_memory{" "}
          {String(preview.authority_boundary.can_write_memory)}
        </span>
        <span style={workplaneCopyStyle}>
          can_apply_handoff_context{" "}
          {String(preview.authority_boundary.can_apply_handoff_context)};
          can_call_provider_openai{" "}
          {String(preview.authority_boundary.can_call_provider_openai)}
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
