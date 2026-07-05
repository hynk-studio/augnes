import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { ProjectHistoryIntakeRecordReview } from "@/types/project-history-intake-record-review";

type ProjectHistoryIntakeRecordReviewPanelProps = {
  review: ProjectHistoryIntakeRecordReview;
};

export function ProjectHistoryIntakeRecordReviewPanel({
  review,
}: ProjectHistoryIntakeRecordReviewPanelProps) {
  const latest = review.latest_record_summary;
  const sideEffects = review.receipt_no_side_effects_summary;

  return (
    <WorkplanePanelShell
      kicker="Project history record review"
      title="Project History Intake Record Review"
      ariaLabel="Project History Intake Record Review panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only review of already-read project history candidate ingest
        records. Workbench supplies no default DB read and no sample current
        record.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="Review status"
          value={review.review_status}
        />
        <WorkplanePanelMetric
          label="candidate ingest record count"
          value={String(review.input_summary.valid_record_count)}
        />
        <WorkplanePanelMetric
          label="selected candidate refs"
          value={String(review.input_summary.selected_candidate_ref_count)}
        />
        <WorkplanePanelMetric
          label="receipt side effect problems"
          value={String(review.input_summary.receipt_side_effect_problem_count)}
        />
      </WorkplanePanelMetricGrid>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>latest candidate ingest record</span>
        <strong>{latest?.record_id ?? "none"}</strong>
        <span style={workplaneCopyStyle}>
          project {latest?.project_ref ?? "none"}; operator{" "}
          {latest?.operator_ref ?? "none"}; source{" "}
          {latest?.source_ref ?? "none"}
        </span>
        <span style={workplaneCopyStyle}>
          timeline {latest?.timeline_event_count ?? 0}; decisions{" "}
          {latest?.decision_count ?? 0}; requirements{" "}
          {latest?.requirement_count ?? 0}
        </span>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>receipt no side effects</span>
        <strong>
          candidate records{" "}
          {sideEffects.project_history_intake_record_written_count}
        </strong>
        <span style={workplaneCopyStyle}>
          receipts {sideEffects.project_history_intake_receipt_written_count};
          persisted candidates{" "}
          {sideEffects.project_history_persisted_as_candidate_record_count}
        </span>
        <span style={workplaneCopyStyle}>
          memory {sideEffects.memory_mutated_count}; CWP{" "}
          {sideEffects.current_working_perspective_updated_count}; Perspective{" "}
          {sideEffects.perspective_unit_written_count}; relay{" "}
          {sideEffects.continuity_relay_written_count}
        </span>
        <span style={workplaneCopyStyle}>
          handoff {sideEffects.handoff_context_mutated_count}; provider{" "}
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
        <span style={workplaneBadgeStyle}>would not do</span>
        <ul style={workplaneListStyle}>
          {review.would_not_do.slice(0, 10).map((item) => (
            <li key={item} style={workplaneItemStyle}>
              <span style={workplaneCopyStyle}>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>authority boundary</span>
        <strong>Read-only record review</strong>
        <span style={workplaneCopyStyle}>
          read_only_record_review{" "}
          {String(review.authority_boundary.read_only_record_review)};
          can_create_schema{" "}
          {String(review.authority_boundary.can_create_schema)};
          can_create_ingest_record{" "}
          {String(review.authority_boundary.can_create_ingest_record)}
        </span>
        <span style={workplaneCopyStyle}>
          can_write_memory {String(review.authority_boundary.can_write_memory)};
          can_mutate_current_working_perspective{" "}
          {String(
            review.authority_boundary.can_mutate_current_working_perspective,
          )}
        </span>
        <span style={workplaneCopyStyle}>
          can_send_handoff {String(review.authority_boundary.can_send_handoff)};
          can_execute_codex{" "}
          {String(review.authority_boundary.can_execute_codex)}
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
