import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { PerspectiveNextWorkCandidateUpdatePreview } from "@/types/perspective-next-work-candidate-update-preview";
import type { CSSProperties } from "react";

type PerspectiveNextWorkCandidateUpdatePreviewPanelProps = {
  preview: PerspectiveNextWorkCandidateUpdatePreview;
};

const sectionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))",
  gap: "10px",
  minWidth: 0,
};

export function PerspectiveNextWorkCandidateUpdatePreviewPanel({
  preview,
}: PerspectiveNextWorkCandidateUpdatePreviewPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Perspective feedback"
      title="Next-work update candidates"
      ariaLabel="Perspective Next Work candidate update preview"
    >
      <p style={workplaneCopyStyle}>
        Read-only candidate preview derived from dogfood metric signal. This
        panel does not write PerspectiveUnits, NextWorkBias, memory, dogfood
        metrics, ledger records, GitHub/Codex actions, or handoffs.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="Status"
          value={preview.candidate_status}
        />
        <WorkplanePanelMetric
          label="Ledger records"
          value={preview.input_summary.ledger_record_count}
        />
        <WorkplanePanelMetric
          label="Reinforce"
          value={
            preview.proposed_perspective_unit_updates.reinforce_candidates
              .length
          }
        />
        <WorkplanePanelMetric
          label="Warnings"
          value={
            preview.proposed_perspective_unit_updates.warn_candidates.length
          }
        />
      </WorkplanePanelMetricGrid>

      <section style={sectionGridStyle}>
        <CandidateSummary preview={preview} />
        <PerspectiveUnitCandidates preview={preview} />
        <NextWorkBiasCandidates preview={preview} />
        <WriteReadiness preview={preview} />
      </section>

      <section
        aria-label="Perspective next-work carry-forward candidates"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>carry-forward candidates</span>
        <span style={workplaneCopyStyle}>
          reusable_context{" "}
          {
            preview.proposed_carry_forward_memory_candidates
              .reusable_context_candidates.length
          }
          ; stale_warnings{" "}
          {
            preview.proposed_carry_forward_memory_candidates
              .stale_context_warnings.length
          }
          ; unresolved_gaps{" "}
          {
            preview.proposed_carry_forward_memory_candidates
              .unresolved_gap_candidates.length
          }
          ; verification_bias{" "}
          {
            preview.proposed_carry_forward_memory_candidates
              .verification_bias_candidates.length
          }
        </span>
        <ul style={workplaneListStyle}>
          {preview.proposed_carry_forward_memory_candidates.non_goal_reminders
            .slice(0, 4)
            .map((reminder) => (
              <li key={reminder} style={workplaneItemStyle}>
                <span style={workplaneCopyStyle}>{reminder}</span>
              </li>
            ))}
        </ul>
      </section>

      <section
        aria-label="Perspective next-work authority boundary"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>authority</span>
        <strong>Read-only candidate update preview</strong>
        <span style={workplaneCopyStyle}>
          source_of_truth {String(preview.authority_boundary.source_of_truth)};
          can_write_perspective_unit{" "}
          {String(preview.authority_boundary.can_write_perspective_unit)};
          can_write_next_work_bias{" "}
          {String(preview.authority_boundary.can_write_next_work_bias)};
          can_write_memory{" "}
          {String(preview.authority_boundary.can_write_memory)};
          can_apply_project_perspective{" "}
          {String(preview.authority_boundary.can_apply_project_perspective)};
          can_write_dogfood_metrics{" "}
          {String(preview.authority_boundary.can_write_dogfood_metrics)}
        </span>
      </section>
    </WorkplanePanelShell>
  );
}

function CandidateSummary({
  preview,
}: {
  preview: PerspectiveNextWorkCandidateUpdatePreview;
}) {
  return (
    <section
      aria-label="Perspective next-work candidate summary"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>candidate summary</span>
      <p style={workplaneCopyStyle}>{preview.summary}</p>
      <span style={workplaneCopyStyle}>
        helpful {preview.input_summary.helpful_ref_count}; stale{" "}
        {preview.input_summary.stale_ref_count}; missing{" "}
        {preview.input_summary.missing_ref_count}; noisy{" "}
        {preview.input_summary.noisy_ref_count}; misleading{" "}
        {preview.input_summary.misleading_ref_count}; unknown{" "}
        {preview.input_summary.unknown_ref_count}
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

function PerspectiveUnitCandidates({
  preview,
}: {
  preview: PerspectiveNextWorkCandidateUpdatePreview;
}) {
  const updates = preview.proposed_perspective_unit_updates;
  return (
    <section
      aria-label="PerspectiveUnit candidate updates"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>PerspectiveUnit candidates</span>
      <span style={workplaneCopyStyle}>
        reinforce {updates.reinforce_candidates.length}; weaken{" "}
        {updates.weaken_candidates.length}; warn {updates.warn_candidates.length}
        ; retire_or_deprioritize{" "}
        {updates.retire_or_deprioritize_candidates.length}; review{" "}
        {updates.split_or_review_candidates.length}; insufficient{" "}
        {updates.insufficient_data_candidates.length}
      </span>
      <ul style={workplaneListStyle}>
        {[
          ...updates.reinforce_candidates,
          ...updates.warn_candidates,
          ...updates.insufficient_data_candidates,
        ]
          .slice(0, 4)
          .map((candidate) => (
            <li key={candidate.candidate_id} style={workplaneItemStyle}>
              <strong>{candidate.ref_id}</strong>
              <span style={workplaneCopyStyle}>
                {candidate.source_bucket}; {candidate.strength};{" "}
                {candidate.review_note}
              </span>
            </li>
          ))}
      </ul>
    </section>
  );
}

function NextWorkBiasCandidates({
  preview,
}: {
  preview: PerspectiveNextWorkCandidateUpdatePreview;
}) {
  const updates = preview.proposed_next_work_bias_updates;
  return (
    <section
      aria-label="NextWorkBias candidate updates"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>NextWorkBias candidates</span>
      <span style={workplaneCopyStyle}>
        preserve {updates.refs_to_preserve_next_time.length}; warn{" "}
        {updates.refs_to_warn_next_time.length}; drop{" "}
        {updates.refs_to_drop_or_deprioritize.length}; handoff_adjustments{" "}
        {updates.next_handoff_adjustments.length}; relay_suggestions{" "}
        {updates.next_relay_update_suggestions.length}; focus{" "}
        {updates.next_focus_candidates.length}
      </span>
      <ul style={workplaneListStyle}>
        {updates.next_focus_candidates.slice(0, 4).map((candidate) => (
          <li key={candidate} style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>{candidate}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function WriteReadiness({
  preview,
}: {
  preview: PerspectiveNextWorkCandidateUpdatePreview;
}) {
  return (
    <section
      aria-label="Perspective next-work write readiness"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>write readiness</span>
      <strong>
        ready_for_perspective_update_write{" "}
        {String(preview.write_readiness.ready_for_perspective_update_write)}
      </strong>
      <strong>
        ready_for_next_work_bias_write{" "}
        {String(preview.write_readiness.ready_for_next_work_bias_write)}
      </strong>
      <ul style={workplaneListStyle}>
        {preview.write_readiness.refusal_reasons.map((reason) => (
          <li key={reason} style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>{reason}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
