import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { HandoffContextApplyOperatorDecisionPreview } from "@/types/handoff-context-apply-operator-decision-preview";
import type { CSSProperties } from "react";

type HandoffContextApplyOperatorDecisionPreviewPanelProps = {
  preview: HandoffContextApplyOperatorDecisionPreview;
};

const sectionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))",
  gap: "10px",
  minWidth: 0,
};

export function HandoffContextApplyOperatorDecisionPreviewPanel({
  preview,
}: HandoffContextApplyOperatorDecisionPreviewPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Handoff apply decision"
      title="Operator-reviewed Handoff Context Apply Decision Preview"
      ariaLabel="Operator-reviewed Handoff Context Apply Decision Preview panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only decision preview for whether the current Handoff Context
        Apply Preview is ready for operator review or a later separately
        scoped apply write. This panel does not persist decisions, mutate live
        handoff context, write selected refs, send handoffs, write DB rows,
        call providers, GitHub, or Codex, or run autonomous actions.
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
          label="Review ready"
          value={String(preview.readiness.ready_for_operator_review)}
        />
        <WorkplanePanelMetric
          label="Future write"
          value={String(preview.readiness.ready_for_future_apply_write)}
        />
      </WorkplanePanelMetricGrid>

      <section style={sectionGridStyle}>
        <ReadinessSection preview={preview} />
        <WouldApplySection preview={preview} />
        <CarryForwardSection preview={preview} />
        <EvidenceSection preview={preview} />
      </section>

      <section
        aria-label="Handoff context apply decision would not apply"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>would not apply</span>
        <ul style={workplaneListStyle}>
          {preview.would_not_apply.slice(0, 10).map((item) => (
            <li key={item} style={workplaneItemStyle}>
              <span style={workplaneCopyStyle}>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-label="Handoff context apply decision authority boundary"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>authority</span>
        <strong>Read-only operator decision preview</strong>
        <span style={workplaneCopyStyle}>
          can_persist_decision{" "}
          {String(preview.authority_boundary.can_persist_decision)};
          can_write_db {String(preview.authority_boundary.can_write_db)};
          can_create_schema{" "}
          {String(preview.authority_boundary.can_create_schema)};
          can_mutate_live_handoff_context{" "}
          {String(preview.authority_boundary.can_mutate_live_handoff_context)};
          can_write_selected_refs_to_live_handoff{" "}
          {String(
            preview.authority_boundary.can_write_selected_refs_to_live_handoff,
          )}
        </span>
        <span style={workplaneCopyStyle}>
          can_send_handoff{" "}
          {String(preview.authority_boundary.can_send_handoff)};
          can_call_provider_openai{" "}
          {String(preview.authority_boundary.can_call_provider_openai)};
          can_call_github {String(preview.authority_boundary.can_call_github)};
          can_execute_codex {String(preview.authority_boundary.can_execute_codex)}
        </span>
      </section>
    </WorkplanePanelShell>
  );
}

function ReadinessSection({
  preview,
}: {
  preview: HandoffContextApplyOperatorDecisionPreview;
}) {
  const visibleReasons = [
    ...preview.readiness.current_blockers,
    ...preview.insufficient_data_reasons,
    ...preview.readiness.current_missing_evidence,
  ].slice(0, 6);
  return (
    <section
      aria-label="Handoff context apply decision readiness"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>readiness</span>
      <strong>{preview.source_status.apply_preview_status ?? "missing"}</strong>
      <span style={workplaneCopyStyle}>
        selected_record {preview.input_summary.selected_record_ref ?? "none"};
        full_record{" "}
        {String(preview.input_summary.selected_full_record_supplied)}
      </span>
      <span style={workplaneCopyStyle}>
        blockers {preview.input_summary.blocker_count}; insufficient{" "}
        {preview.input_summary.insufficient_data_count}; conflicts{" "}
        {preview.input_summary.conflict_count}; missing_evidence{" "}
        {preview.input_summary.missing_evidence_count}
      </span>
      <ul style={workplaneListStyle}>
        {visibleReasons.length > 0 ? (
          visibleReasons.map((reason) => (
            <li key={reason} style={workplaneItemStyle}>
              <span style={workplaneCopyStyle}>{reason}</span>
            </li>
          ))
        ) : (
          <li style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>
              No readiness blocker is surfaced by this decision preview.
            </span>
          </li>
        )}
      </ul>
    </section>
  );
}

function WouldApplySection({
  preview,
}: {
  preview: HandoffContextApplyOperatorDecisionPreview;
}) {
  const wouldApply = preview.would_apply_preview;
  return (
    <section
      aria-label="Handoff context apply decision would apply preview"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>would apply preview</span>
      <strong>
        {wouldApply.proposed_record_kind ?? "no apply write candidate"}
      </strong>
      <span style={workplaneCopyStyle}>{wouldApply.review_summary}</span>
      <span style={workplaneCopyStyle}>
        add {wouldApply.selected_refs_to_add.length}; reinforce{" "}
        {wouldApply.selected_refs_to_reinforce.length}; warnings{" "}
        {wouldApply.warnings_to_add_or_strengthen.length}; context{" "}
        {wouldApply.context_refs_to_deprioritize.length +
          wouldApply.context_refs_to_exclude.length}
      </span>
      <span style={workplaneCopyStyle}>
        expected_return {wouldApply.expected_return_signal_updates.length};
        sources {wouldApply.source_refs.length}; evidence{" "}
        {wouldApply.evidence_refs.length}
      </span>
    </section>
  );
}

function CarryForwardSection({
  preview,
}: {
  preview: HandoffContextApplyOperatorDecisionPreview;
}) {
  const carryForward = preview.candidate_carry_forward;
  return (
    <section
      aria-label="Handoff context apply decision carry-forward material"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>carry forward</span>
      <strong>
        keep_unknown {carryForward.keep_unknown_as_review_only.length};
        stop_if_missing {carryForward.carry_forward_stop_if_missing.length}
      </strong>
      <span style={workplaneCopyStyle}>
        rejected_or_excluded{" "}
        {carryForward.rejected_or_excluded_review_notes.length};
        duplicate_refs {carryForward.duplicate_selected_refs.length};
        unknown_selected_refs{" "}
        {carryForward.unknown_selected_ref_attempts.length}
      </span>
      <span style={workplaneCopyStyle}>
        stale_or_noisy {carryForward.stale_or_noisy_candidates.length};
        missing_evidence_candidates{" "}
        {carryForward.missing_evidence_candidates.length}
      </span>
    </section>
  );
}

function EvidenceSection({
  preview,
}: {
  preview: HandoffContextApplyOperatorDecisionPreview;
}) {
  return (
    <section
      aria-label="Handoff context apply decision evidence and boundary"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>evidence</span>
      <strong>
        sources {preview.evidence_summary.source_refs.length}; evidence{" "}
        {preview.evidence_summary.evidence_refs.length}
      </strong>
      <span style={workplaneCopyStyle}>
        all_candidates_evidence_backed{" "}
        {String(preview.evidence_summary.all_apply_candidates_evidence_backed)}
        ; no_live_mutation{" "}
        {String(preview.evidence_summary.no_live_handoff_mutation_confirmed)}
      </span>
      <span style={workplaneCopyStyle}>
        no_handoff_send{" "}
        {String(preview.evidence_summary.no_handoff_send_confirmed)};
        no_provider_github_codex{" "}
        {String(preview.evidence_summary.no_provider_github_codex_confirmed)}
      </span>
    </section>
  );
}
