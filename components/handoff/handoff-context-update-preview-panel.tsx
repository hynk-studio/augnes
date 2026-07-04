import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type {
  HandoffContextUpdateCandidate,
  HandoffContextUpdatePreview,
} from "@/types/handoff-context-update-preview";
import type { CSSProperties } from "react";

type HandoffContextUpdatePreviewPanelProps = {
  preview: HandoffContextUpdatePreview;
};

const sectionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))",
  gap: "10px",
  minWidth: 0,
};

export function HandoffContextUpdatePreviewPanel({
  preview,
}: HandoffContextUpdatePreviewPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Handoff update"
      title="Handoff Context Update Preview"
      ariaLabel="Handoff Context Update Preview panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only candidate preview derived from Handoff Context Relay Rationale
        and metric-informed relay adjustment candidates. It does not write
        handoff context, send handoffs, mutate memory, call providers, GitHub,
        or Codex, or run autonomous actions.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="Status"
          value={preview.candidate_status}
        />
        <WorkplanePanelMetric
          label="Selected"
          value={preview.input_summary.selected_ref_candidate_count}
        />
        <WorkplanePanelMetric
          label="Warnings"
          value={preview.input_summary.warning_candidate_count}
        />
        <WorkplanePanelMetric
          label="Return"
          value={
            preview.input_summary.expected_return_signal_candidate_count
          }
        />
      </WorkplanePanelMetricGrid>

      <section style={sectionGridStyle}>
        <CandidateList
          title="Selected refs"
          candidates={[
            ...preview.proposed_selected_ref_updates
              .reinforce_selected_ref_candidates,
            ...preview.proposed_selected_ref_updates.add_selected_ref_candidates,
          ]}
          emptyText="No selected-ref update candidates materialized."
        />
        <CandidateList
          title="Warnings"
          candidates={[
            ...preview.proposed_warning_updates.add_warning_candidates,
            ...preview.proposed_warning_updates.strengthen_warning_candidates,
            ...preview.proposed_warning_updates.unknown_warning_candidates,
          ]}
          emptyText="No warning update candidates materialized."
        />
        <CandidateList
          title="Stop"
          candidates={[
            ...preview.proposed_stop_if_missing_updates
              .stop_if_missing_candidates,
            ...preview.proposed_stop_if_missing_updates
              .verification_required_before_handoff,
          ]}
          emptyText="No stop-if-missing update candidates materialized."
        />
        <CandidateList
          title="Expected return"
          candidates={[
            ...preview.proposed_expected_return_signal_updates
              .expected_return_emphasis_candidates,
            ...preview.proposed_expected_return_signal_updates
              .next_handoff_focus_candidates,
            ...preview.proposed_expected_return_signal_updates
              .mismatch_return_signal_candidates,
          ]}
          emptyText="No expected-return update candidates materialized."
        />
      </section>

      <section
        aria-label="Handoff context update context diet"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>context diet</span>
        <span style={workplaneCopyStyle}>
          deprioritize{" "}
          {preview.proposed_context_diet_updates.refs_to_deprioritize.length};
          exclude{" "}
          {
            preview.proposed_context_diet_updates.refs_to_exclude_from_handoff
              .length
          }
          ; keep_unknown{" "}
          {preview.proposed_context_diet_updates.refs_to_keep_unknown.length}
        </span>
      </section>

      <section
        aria-label="Handoff context update write readiness"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>write readiness</span>
        <strong>
          ready_for_handoff_context_write{" "}
          {String(preview.write_readiness.ready_for_handoff_context_write)}
        </strong>
        <strong>
          ready_for_handoff_send{" "}
          {String(preview.write_readiness.ready_for_handoff_send)}
        </strong>
        <ul style={workplaneListStyle}>
          {preview.insufficient_data_reasons.slice(0, 4).map((reason) => (
            <li key={reason} style={workplaneItemStyle}>
              <span style={workplaneCopyStyle}>{reason}</span>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-label="Handoff context update authority boundary"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>authority</span>
        <strong>Read-only handoff context update preview</strong>
        <span style={workplaneCopyStyle}>
          read_only {String(preview.authority_boundary.read_only)};
          source_of_truth {String(preview.authority_boundary.source_of_truth)};
          can_write_db {String(preview.authority_boundary.can_write_db)};
          can_write_handoff_context{" "}
          {String(preview.authority_boundary.can_write_handoff_context)};
          can_send_handoff{" "}
          {String(preview.authority_boundary.can_send_handoff)};
          can_execute_codex{" "}
          {String(preview.authority_boundary.can_execute_codex)}
        </span>
      </section>
    </WorkplanePanelShell>
  );
}

function CandidateList({
  title,
  candidates,
  emptyText,
}: {
  title: string;
  candidates: HandoffContextUpdateCandidate[];
  emptyText: string;
}) {
  const visibleCandidates = candidates.slice(0, 4);
  return (
    <section
      aria-label={`Handoff context update ${title}`}
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>{title}</span>
      <ul style={workplaneListStyle}>
        {visibleCandidates.map((candidate) => (
          <li key={candidate.candidate_id} style={workplaneItemStyle}>
            <strong>{candidate.label}</strong>
            <span style={workplaneCopyStyle}>
              {candidate.source_bucket}; {candidate.candidate_kind};{" "}
              {candidate.review_note}
            </span>
          </li>
        ))}
        {visibleCandidates.length === 0 ? (
          <li style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>{emptyText}</span>
          </li>
        ) : null}
      </ul>
    </section>
  );
}
