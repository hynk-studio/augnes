import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { HandoffContextUpdateOperatorDecisionPreview } from "@/types/handoff-context-update-operator-decision-preview";
import type { CSSProperties } from "react";

type HandoffContextUpdateOperatorDecisionPreviewPanelProps = {
  preview: HandoffContextUpdateOperatorDecisionPreview;
};

const sectionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))",
  gap: "10px",
  minWidth: 0,
};

export function HandoffContextUpdateOperatorDecisionPreviewPanel({
  preview,
}: HandoffContextUpdateOperatorDecisionPreviewPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Handoff decision"
      title="Operator-reviewed Handoff Context Update Decision Preview"
      ariaLabel="Operator-reviewed Handoff Context Update Decision Preview panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only decision preview for whether the current Handoff Context
        Update Preview could be prepared for a later separately approved write.
        This panel does not persist decisions, write handoff context, send
        handoffs, mutate memory, call providers, GitHub, or Codex, or run
        autonomous actions.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="Status"
          value={preview.decision_preview_status}
        />
        <WorkplanePanelMetric
          label="Decision"
          value={preview.recommended_operator_decision}
        />
        <WorkplanePanelMetric
          label="Write ready"
          value={String(preview.write_readiness.write_ready)}
        />
        <WorkplanePanelMetric
          label="Blockers"
          value={preview.blocking_reasons.length}
        />
      </WorkplanePanelMetricGrid>

      <section style={sectionGridStyle}>
        <SourceSection preview={preview} />
        <ReadinessSection preview={preview} />
        <WouldWriteSection preview={preview} />
        <WouldNotWriteSection preview={preview} />
      </section>

      <section
        aria-label="Handoff context update decision approval requirements"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>approval requirements</span>
        <ul style={workplaneListStyle}>
          {preview.approval_requirements.slice(0, 8).map((item) => (
            <li key={item} style={workplaneItemStyle}>
              <span style={workplaneCopyStyle}>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-label="Handoff context update decision authority boundary"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>authority</span>
        <strong>Read-only operator decision preview</strong>
        <span style={workplaneCopyStyle}>
          source_of_truth{" "}
          {String(preview.authority_boundary.source_of_truth)};
          can_persist_decision{" "}
          {String(preview.authority_boundary.can_persist_decision)};
          can_write_db {String(preview.authority_boundary.can_write_db)};
          can_write_handoff_context{" "}
          {String(preview.authority_boundary.can_write_handoff_context)};
          can_write_selected_refs{" "}
          {String(preview.authority_boundary.can_write_selected_refs)};
          can_send_handoff{" "}
          {String(preview.authority_boundary.can_send_handoff)};
          can_execute_codex{" "}
          {String(preview.authority_boundary.can_execute_codex)}
        </span>
      </section>
    </WorkplanePanelShell>
  );
}

function SourceSection({
  preview,
}: {
  preview: HandoffContextUpdateOperatorDecisionPreview;
}) {
  return (
    <section
      aria-label="Handoff context update decision source status"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>source status</span>
      <strong>{preview.source_status.handoff_context_update_preview}</strong>
      <span style={workplaneCopyStyle}>
        candidate_status{" "}
        {preview.source_status.candidate_status ?? "missing"};
        authority {preview.source_status.authority_boundary}; source_write{" "}
        {preview.source_status.source_write_readiness}
      </span>
      <span style={workplaneCopyStyle}>
        missing evidence {preview.missing_evidence.length}
      </span>
    </section>
  );
}

function ReadinessSection({
  preview,
}: {
  preview: HandoffContextUpdateOperatorDecisionPreview;
}) {
  const visibleReasons = [
    ...preview.write_readiness.current_blockers,
    ...preview.write_readiness.current_missing_evidence,
  ].slice(0, 6);

  return (
    <section
      aria-label="Handoff context update decision write readiness"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>write readiness</span>
      <strong>{preview.write_readiness.readiness_label}</strong>
      <span style={workplaneCopyStyle}>
        valid_preview{" "}
        {String(preview.write_readiness.requires_valid_update_preview)};
        no_blockers{" "}
        {String(preview.write_readiness.requires_no_blockers)};
        no_missing_evidence{" "}
        {String(preview.write_readiness.requires_no_missing_evidence)};
        operator_confirmation{" "}
        {String(preview.write_readiness.requires_operator_confirmation)}
      </span>
      <ul style={workplaneListStyle}>
        {visibleReasons.map((reason) => (
          <li key={reason} style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>{reason}</span>
          </li>
        ))}
        {visibleReasons.length === 0 ? (
          <li style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>
              No blockers detected by this preview; a later write still needs
              separate operator approval and scope.
            </span>
          </li>
        ) : null}
      </ul>
    </section>
  );
}

function WouldWriteSection({
  preview,
}: {
  preview: HandoffContextUpdateOperatorDecisionPreview;
}) {
  return (
    <section
      aria-label="Handoff context update decision would write preview"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>would write preview</span>
      <strong>
        {preview.would_write_preview.proposed_record_kind ?? "not ready"}
      </strong>
      <span style={workplaneCopyStyle}>
        {preview.would_write_preview.review_summary}
      </span>
      <span style={workplaneCopyStyle}>
        selected_add{" "}
        {preview.would_write_preview.selected_ref_add_candidates.length};
        selected_reinforce{" "}
        {
          preview.would_write_preview.selected_ref_reinforcement_candidates
            .length
        }
        ; warnings {preview.would_write_preview.warning_update_candidates.length}
        ; context_diet{" "}
        {preview.would_write_preview.context_diet_candidates.length};
        expected_return{" "}
        {preview.would_write_preview.expected_return_signal_candidates.length}
      </span>
    </section>
  );
}

function WouldNotWriteSection({
  preview,
}: {
  preview: HandoffContextUpdateOperatorDecisionPreview;
}) {
  return (
    <section
      aria-label="Handoff context update decision would not write"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>would not write</span>
      <ul style={workplaneListStyle}>
        {preview.would_not_write.slice(0, 8).map((item) => (
          <li key={item} style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
