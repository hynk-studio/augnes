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
  ContinuityRelayAdjustmentCandidate,
  MetricInformedContinuityRelayAdjustmentPreview,
} from "@/types/metric-informed-continuity-relay-adjustment-preview";
import type { CSSProperties } from "react";

type MetricInformedContinuityRelayAdjustmentPreviewPanelProps = {
  preview: MetricInformedContinuityRelayAdjustmentPreview;
};

const sectionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))",
  gap: "10px",
  minWidth: 0,
};

export function MetricInformedContinuityRelayAdjustmentPreviewPanel({
  preview,
}: MetricInformedContinuityRelayAdjustmentPreviewPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Continuity adjustment"
      title="Relay adjustment candidates"
      ariaLabel="Metric-informed Continuity Relay adjustment preview"
    >
      <p style={workplaneCopyStyle}>
        Read-only candidate preview derived from the current Continuity Relay
        and Perspective Next-Work candidate preview. It does not write relay,
        CWP, handoff, PerspectiveUnit, NextWorkBias, memory, metric, or ledger
        state.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="Status"
          value={preview.candidate_status}
        />
        <WorkplanePanelMetric
          label="Preserve"
          value={preview.input_summary.preserve_candidate_count}
        />
        <WorkplanePanelMetric
          label="Warn"
          value={preview.input_summary.warn_candidate_count}
        />
        <WorkplanePanelMetric
          label="Stop"
          value={preview.input_summary.verification_candidate_count}
        />
      </WorkplanePanelMetricGrid>

      <section style={sectionGridStyle}>
        <CandidateList
          title="Preserve"
          candidates={[
            ...preview.proposed_relay_preserve_adjustments
              .reinforce_existing_preserve_anchors,
            ...preview.proposed_relay_preserve_adjustments
              .add_preserve_anchor_candidates,
          ]}
          emptyText="No preserve adjustment candidates materialized."
        />
        <CandidateList
          title="Warnings"
          candidates={[
            ...preview.proposed_relay_warning_adjustments
              .add_warn_anchor_candidates,
            ...preview.proposed_relay_warning_adjustments
              .strengthen_warn_anchor_candidates,
            ...preview.proposed_relay_warning_adjustments
              .unknown_context_warning_candidates,
          ]}
          emptyText="No warning adjustment candidates materialized."
        />
        <CandidateList
          title="Stop If Missing"
          candidates={[
            ...preview.proposed_stop_if_missing_adjustments
              .add_stop_if_missing_candidates,
            ...preview.proposed_stop_if_missing_adjustments
              .missing_source_or_evidence_blockers,
          ]}
          emptyText="No stop-if-missing candidates materialized."
        />
        <CandidateList
          title="Next Focus"
          candidates={[
            ...preview.proposed_next_focus_adjustments.next_focus_candidates,
            ...preview.proposed_next_focus_adjustments
              .next_relay_update_suggestions,
          ]}
          emptyText="No next-focus candidates materialized."
        />
      </section>

      <section
        aria-label="Continuity relay adjustment context diet"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>context diet</span>
        <span style={workplaneCopyStyle}>
          drop_or_deprioritize{" "}
          {
            preview.proposed_context_diet_adjustments
              .refs_to_drop_or_deprioritize.length
          }
          ; exclude_from_handoff{" "}
          {
            preview.proposed_context_diet_adjustments
              .refs_to_exclude_from_next_handoff.length
          }
          ; keep_unknown{" "}
          {preview.proposed_context_diet_adjustments.refs_to_keep_unknown.length}
          ; stale_or_gap{" "}
          {
            preview.proposed_context_diet_adjustments.stale_or_gap_warnings
              .length
          }
        </span>
      </section>

      <section
        aria-label="Continuity relay adjustment write readiness"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>write readiness</span>
        <strong>
          ready_for_continuity_relay_write{" "}
          {String(
            preview.write_readiness.ready_for_continuity_relay_write,
          )}
        </strong>
        <strong>
          ready_for_cwp_update_write{" "}
          {String(preview.write_readiness.ready_for_cwp_update_write)}
        </strong>
        <strong>
          ready_for_handoff_context_update_write{" "}
          {String(
            preview.write_readiness.ready_for_handoff_context_update_write,
          )}
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
        aria-label="Continuity relay adjustment authority boundary"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>authority</span>
        <strong>Read-only candidate adjustment preview</strong>
        <span style={workplaneCopyStyle}>
          read_only {String(preview.authority_boundary.read_only)};
          source_of_truth {String(preview.authority_boundary.source_of_truth)};
          can_write_continuity_relay{" "}
          {String(preview.authority_boundary.can_write_continuity_relay)};
          can_update_current_working_perspective{" "}
          {String(
            preview.authority_boundary.can_update_current_working_perspective,
          )}
          ; can_write_handoff_context{" "}
          {String(preview.authority_boundary.can_write_handoff_context)};
          can_write_memory{" "}
          {String(preview.authority_boundary.can_write_memory)}
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
  candidates: ContinuityRelayAdjustmentCandidate[];
  emptyText: string;
}) {
  const visibleCandidates = candidates.slice(0, 4);
  return (
    <section aria-label={`Continuity relay adjustment ${title}`} style={workplaneItemStyle}>
      <span style={workplaneBadgeStyle}>{title}</span>
      <ul style={workplaneListStyle}>
        {visibleCandidates.map((candidate) => (
          <li key={candidate.candidate_id} style={workplaneItemStyle}>
            <strong>{candidate.label}</strong>
            <span style={workplaneCopyStyle}>
              {candidate.source_bucket}; {candidate.strength};{" "}
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
