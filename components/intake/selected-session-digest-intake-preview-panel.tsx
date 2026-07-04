import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { SelectedSessionDigestIntakePreview } from "@/types/selected-session-digest-intake-preview";
import type { CSSProperties } from "react";

type SelectedSessionDigestIntakePreviewPanelProps = {
  preview: SelectedSessionDigestIntakePreview;
};

const sectionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
  gap: "10px",
  minWidth: 0,
};

export function SelectedSessionDigestIntakePreviewPanel({
  preview,
}: SelectedSessionDigestIntakePreviewPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Selected session intake"
      title="Selected Session Digest Intake Preview"
      ariaLabel="Selected Session Digest Intake Preview panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only candidate-intake preview for manually supplied selected
        session digest material. This panel does not write memory, create
        records, write DB rows, mutate CWP/Perspective/handoff context, write
        selected refs to a live packet, send handoffs, call providers, GitHub,
        or Codex, or run autonomous actions.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="Status"
          value={preview.intake_preview_status}
        />
        <WorkplanePanelMetric
          label="Next action"
          value={preview.recommended_next_action}
        />
        <WorkplanePanelMetric
          label="Review ready"
          value={String(preview.readiness.ready_for_operator_review)}
        />
        <WorkplanePanelMetric
          label="Future contract"
          value={String(
            preview.readiness.ready_for_future_ingest_contract_preview,
          )}
        />
      </WorkplanePanelMetricGrid>

      <section style={sectionGridStyle}>
        <SourceSection preview={preview} />
        <CandidateCountsSection preview={preview} />
        <ExtractedPreviewSection preview={preview} />
        <RequirementsSection preview={preview} />
      </section>

      <section
        aria-label="Selected session digest intake privacy review notes"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>privacy review</span>
        <ul style={workplaneListStyle}>
          {preview.privacy_review_notes.slice(0, 6).map((note) => (
            <li key={note} style={workplaneItemStyle}>
              <span style={workplaneCopyStyle}>{note}</span>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-label="Selected session digest intake would-not-ingest boundaries"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>would not ingest</span>
        <ul style={workplaneListStyle}>
          {preview.would_not_ingest.slice(0, 12).map((item) => (
            <li key={item} style={workplaneItemStyle}>
              <span style={workplaneCopyStyle}>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-label="Selected session digest intake authority boundary flags"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>authority</span>
        <strong>Read-only intake preview</strong>
        <span style={workplaneCopyStyle}>
          can_write_db {String(preview.authority_boundary.can_write_db)};
          can_create_schema{" "}
          {String(preview.authority_boundary.can_create_schema)};
          can_create_ingest_record{" "}
          {String(preview.authority_boundary.can_create_ingest_record)}
        </span>
        <span style={workplaneCopyStyle}>
          can_write_memory{" "}
          {String(preview.authority_boundary.can_write_memory)};
          can_mutate_current_working_perspective{" "}
          {String(
            preview.authority_boundary
              .can_mutate_current_working_perspective,
          )}
          ; can_mutate_handoff_context{" "}
          {String(preview.authority_boundary.can_mutate_handoff_context)}
        </span>
        <span style={workplaneCopyStyle}>
          can_write_selected_refs_to_live_handoff{" "}
          {String(
            preview.authority_boundary.can_write_selected_refs_to_live_handoff,
          )}
          ; can_send_handoff{" "}
          {String(preview.authority_boundary.can_send_handoff)}
        </span>
        <span style={workplaneCopyStyle}>
          can_call_provider_openai{" "}
          {String(preview.authority_boundary.can_call_provider_openai)};
          can_call_github {String(preview.authority_boundary.can_call_github)};
          can_execute_codex {String(preview.authority_boundary.can_execute_codex)}
        </span>
      </section>
    </WorkplanePanelShell>
  );
}

function SourceSection({
  preview,
}: {
  preview: SelectedSessionDigestIntakePreview;
}) {
  return (
    <section
      aria-label="Selected session digest intake source status"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>source</span>
      <strong>{preview.input_summary.source_kind}</strong>
      <span style={workplaneCopyStyle}>
        digest {preview.source_status.digest}; raw_text{" "}
        {preview.source_status.raw_text}; source_kind{" "}
        {preview.source_status.source_kind}
      </span>
      <span style={workplaneCopyStyle}>
        source_ref {String(preview.input_summary.source_ref_supplied)};
        operator_ref {String(preview.input_summary.operator_ref_supplied)}
      </span>
      <span style={workplaneCopyStyle}>
        session_ref {String(preview.input_summary.session_ref_supplied)};
        project_ref {String(preview.input_summary.project_ref_supplied)}
      </span>
      <span style={workplaneCopyStyle}>
        unsafe {preview.input_summary.unsafe_ref_count}; missing{" "}
        {preview.input_summary.missing_reason_count}; blockers{" "}
        {preview.input_summary.blocked_reason_count}
      </span>
    </section>
  );
}

function CandidateCountsSection({
  preview,
}: {
  preview: SelectedSessionDigestIntakePreview;
}) {
  const material = preview.candidate_material;
  return (
    <section
      aria-label="Selected session digest intake candidate counts by bucket"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>candidates</span>
      <strong>{preview.input_summary.candidate_count} total</strong>
      <span style={workplaneCopyStyle}>
        summaries {material.session_summary_candidates.length}; goals{" "}
        {material.user_goal_candidates.length}; decisions{" "}
        {material.decision_candidates.length}
      </span>
      <span style={workplaneCopyStyle}>
        questions {material.open_question_candidates.length}; next_actions{" "}
        {material.next_action_candidates.length}; risks{" "}
        {material.risk_or_blocker_candidates.length}
      </span>
      <span style={workplaneCopyStyle}>
        evidence_refs {material.evidence_ref_candidates.length}; source_refs{" "}
        {material.source_ref_candidates.length}; reusable{" "}
        {material.reusable_context_candidates.length}; review_only{" "}
        {material.rejected_or_review_only_candidates.length}
      </span>
    </section>
  );
}

function ExtractedPreviewSection({
  preview,
}: {
  preview: SelectedSessionDigestIntakePreview;
}) {
  return (
    <section
      aria-label="Selected session digest intake extracted preview counts"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>extracted preview</span>
      <strong>
        raw length {preview.input_summary.raw_text_length}; lines{" "}
        {preview.input_summary.raw_text_line_count}
      </strong>
      <span style={workplaneCopyStyle}>
        headings {preview.extracted_preview.heading_lines.length}; checklists{" "}
        {preview.extracted_preview.checklist_lines.length}; refs{" "}
        {preview.extracted_preview.explicit_ref_like_tokens.length}
      </span>
      <span style={workplaneCopyStyle}>
        dates {preview.extracted_preview.possible_dates.length}; quoted ids{" "}
        {preview.extracted_preview.quoted_identifiers.length}; review notes{" "}
        {preview.extracted_preview.review_notes.length}
      </span>
    </section>
  );
}

function RequirementsSection({
  preview,
}: {
  preview: SelectedSessionDigestIntakePreview;
}) {
  return (
    <section
      aria-label="Selected session digest intake future ingest contract requirements"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>future ingest contract</span>
      <strong>
        {preview.future_ingest_contract_preview.proposed_record_kind}
      </strong>
      <span style={workplaneCopyStyle}>
        operator review{" "}
        {
          preview.future_ingest_contract_preview.required_operator_review
            .length
        }
        ; source kind{" "}
        {preview.future_ingest_contract_preview.required_source_kind.length};
        source ref{" "}
        {preview.future_ingest_contract_preview.required_source_ref.length}
      </span>
      <span style={workplaneCopyStyle}>
        operator ref{" "}
        {preview.future_ingest_contract_preview.required_operator_ref.length};
        session/project{" "}
        {
          preview.future_ingest_contract_preview
            .required_session_or_project_ref.length
        }
        ; evidence refs{" "}
        {preview.future_ingest_contract_preview.required_evidence_refs.length}
      </span>
      <span style={workplaneCopyStyle}>
        no-side-effects receipt{" "}
        {
          preview.future_ingest_contract_preview
            .required_no_side_effects_receipt.length
        }
        ; refusal checks{" "}
        {preview.future_ingest_contract_preview.required_refusal_checks.length}
      </span>
    </section>
  );
}
