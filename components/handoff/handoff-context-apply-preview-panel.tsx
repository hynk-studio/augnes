import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { HandoffContextApplyPreview } from "@/types/handoff-context-apply-preview";
import type { CSSProperties } from "react";

type HandoffContextApplyPreviewPanelProps = {
  preview: HandoffContextApplyPreview;
};

const sectionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))",
  gap: "10px",
  minWidth: 0,
};

export function HandoffContextApplyPreviewPanel({
  preview,
}: HandoffContextApplyPreviewPanelProps) {
  const delta = preview.proposed_apply_delta;
  const selectedCount =
    delta.selected_refs_to_add.length + delta.selected_refs_to_reinforce.length;
  const warningContextCount =
    delta.warnings_to_add_or_strengthen.length +
    delta.context_refs_to_deprioritize.length +
    delta.context_refs_to_exclude.length;

  return (
    <WorkplanePanelShell
      kicker="Handoff apply preview"
      title="Handoff Context Apply Preview"
      ariaLabel="Handoff Context Apply Preview panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only preview of how already-approved handoff context update record
        material could affect a future handoff context packet. It does not
        mutate live handoff context, write selected refs, or send a handoff.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="Preview status"
          value={preview.preview_status}
        />
        <WorkplanePanelMetric
          label="Full record"
          value={String(preview.input_summary.selected_full_record_supplied)}
        />
        <WorkplanePanelMetric label="Selected" value={selectedCount} />
        <WorkplanePanelMetric
          label="Conflicts"
          value={preview.conflict_summary.conflicting_candidate_ids.length}
        />
      </WorkplanePanelMetricGrid>

      <section style={sectionGridStyle}>
        <SelectedRecordSection preview={preview} />
        <DeltaSection preview={preview} warningContextCount={warningContextCount} />
        <EvidenceSection preview={preview} />
        <BoundarySection preview={preview} />
      </section>

      <section
        aria-label="Handoff context apply preview authority boundary"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>authority</span>
        <strong>Read-only apply preview</strong>
        <span style={workplaneCopyStyle}>
          can_write_db {String(preview.authority_boundary.can_write_db)};
          can_create_schema {String(preview.authority_boundary.can_create_schema)}
          ; can_mutate_live_handoff_context{" "}
          {String(preview.authority_boundary.can_mutate_live_handoff_context)};
          can_write_selected_refs_to_live_handoff{" "}
          {String(
            preview.authority_boundary.can_write_selected_refs_to_live_handoff,
          )}
          ; can_send_handoff{" "}
          {String(preview.authority_boundary.can_send_handoff)};
          can_call_provider_openai{" "}
          {String(preview.authority_boundary.can_call_provider_openai)};
          can_call_github {String(preview.authority_boundary.can_call_github)};
          can_execute_codex {String(preview.authority_boundary.can_execute_codex)}
        </span>
      </section>

      {preview.insufficient_data_reasons.length > 0 ? (
        <section
          aria-label="Handoff context apply preview insufficient data"
          style={workplaneItemStyle}
        >
          <span style={workplaneBadgeStyle}>insufficient data</span>
          <ul style={workplaneListStyle}>
            {preview.insufficient_data_reasons.slice(0, 8).map((reason) => (
              <li key={reason} style={workplaneItemStyle}>
                <span style={workplaneCopyStyle}>{reason}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </WorkplanePanelShell>
  );
}

function SelectedRecordSection({
  preview,
}: {
  preview: HandoffContextApplyPreview;
}) {
  return (
    <section
      aria-label="Handoff context apply preview selected record"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>record</span>
      <strong>{preview.selected_record_ref ?? "no selected record"}</strong>
      <span style={workplaneCopyStyle}>
        selected_found {String(preview.input_summary.selected_record_found)};
        full_record_supplied{" "}
        {String(preview.input_summary.selected_full_record_supplied)}
      </span>
      <span style={workplaneCopyStyle}>
        review_status {preview.input_summary.review_status ?? "none"};
        approved_records {preview.input_summary.approved_record_count}
      </span>
    </section>
  );
}

function DeltaSection({
  preview,
  warningContextCount,
}: {
  preview: HandoffContextApplyPreview;
  warningContextCount: number;
}) {
  const delta = preview.proposed_apply_delta;
  return (
    <section
      aria-label="Handoff context apply preview proposed delta"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>candidate delta</span>
      <strong>
        add {delta.selected_refs_to_add.length}; reinforce{" "}
        {delta.selected_refs_to_reinforce.length}
      </strong>
      <span style={workplaneCopyStyle}>
        warnings_context {warningContextCount}; keep_unknown{" "}
        {delta.keep_unknown_as_review_only.length}; expected_return{" "}
        {delta.expected_return_signal_updates.length}
      </span>
      <span style={workplaneCopyStyle}>
        stop_if_missing {delta.carry_forward_stop_if_missing.length};
        rejected_or_excluded {delta.rejected_or_excluded_review_notes.length}
      </span>
    </section>
  );
}

function EvidenceSection({
  preview,
}: {
  preview: HandoffContextApplyPreview;
}) {
  return (
    <section
      aria-label="Handoff context apply preview source and evidence"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>source and evidence</span>
      <strong>
        sources {preview.evidence_summary.source_refs.length}; evidence{" "}
        {preview.evidence_summary.evidence_refs.length}
      </strong>
      <span style={workplaneCopyStyle}>
        full_material {String(preview.evidence_summary.has_full_record_material)}
        ; all_candidates_evidence_backed{" "}
        {String(preview.evidence_summary.all_apply_candidates_evidence_backed)}
      </span>
      <span style={workplaneCopyStyle}>
        problem_records {preview.evidence_summary.problem_record_ids.length};
        missing_evidence {preview.evidence_summary.missing_evidence.length}
      </span>
    </section>
  );
}

function BoundarySection({
  preview,
}: {
  preview: HandoffContextApplyPreview;
}) {
  return (
    <section
      aria-label="Handoff context apply preview live state boundary"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>live state</span>
      <strong>Live handoff context not mutated</strong>
      <span style={workplaneCopyStyle}>
        no_live_mutation{" "}
        {String(preview.evidence_summary.no_live_handoff_mutation_confirmed)};
        no_handoff_send{" "}
        {String(preview.evidence_summary.no_handoff_send_confirmed)}
      </span>
      <span style={workplaneCopyStyle}>
        no_provider_github_codex{" "}
        {String(preview.evidence_summary.no_provider_github_codex_confirmed)};
        current_selected_refs{" "}
        {preview.current_context_summary.current_selected_ref_count}
      </span>
    </section>
  );
}
