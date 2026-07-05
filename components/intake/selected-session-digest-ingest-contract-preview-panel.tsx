import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { SelectedSessionDigestIngestContractPreview } from "@/types/selected-session-digest-ingest-contract-preview";
import type { CSSProperties } from "react";

type SelectedSessionDigestIngestContractPreviewPanelProps = {
  preview: SelectedSessionDigestIngestContractPreview;
};

const sectionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
  gap: "10px",
  minWidth: 0,
};

export function SelectedSessionDigestIngestContractPreviewPanel({
  preview,
}: SelectedSessionDigestIngestContractPreviewPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Selected session ingest contract"
      title="Selected Session Digest Ingest Contract Preview"
      ariaLabel="Selected Session Digest Ingest Contract Preview panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only contract preview for a future separately scoped selected
        session digest ingest write. It consumes the already-built intake
        preview and reports required operator, privacy, idempotency, evidence,
        and candidate-selection material without parsing raw digest text or
        writing product state.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="Contract status"
          value={preview.contract_preview_status}
        />
        <WorkplanePanelMetric
          label="Next action"
          value={preview.recommended_next_action}
        />
        <WorkplanePanelMetric
          label="Review readiness"
          value={String(preview.readiness.ready_for_operator_review)}
        />
        <WorkplanePanelMetric
          label="Future write readiness"
          value={String(preview.readiness.ready_for_future_ingest_write_scope)}
        />
      </WorkplanePanelMetricGrid>

      <section style={sectionGridStyle}>
        <SourceMaterialSection preview={preview} />
        <ContractMaterialSection preview={preview} />
        <FutureContractSection preview={preview} />
        <WouldIngestSection preview={preview} />
      </section>

      <section
        aria-label="Selected session digest ingest contract privacy review"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>privacy review</span>
        <strong>
          confirmation{" "}
          {String(
            preview.privacy_review_summary
              .has_privacy_review_confirmation_ref,
          )}
        </strong>
        <span style={workplaneCopyStyle}>
          notes {preview.privacy_review_summary.intake_privacy_review_note_count}
          ; unsafe markers{" "}
          {String(
            preview.privacy_review_summary
              .unsafe_or_private_markers_present,
          )}
        </span>
        <ul style={workplaneListStyle}>
          {preview.privacy_review_summary.privacy_review_notes
            .slice(0, 4)
            .map((note) => (
              <li key={note} style={workplaneItemStyle}>
                <span style={workplaneCopyStyle}>{note}</span>
              </li>
            ))}
        </ul>
      </section>

      <section
        aria-label="Selected session digest ingest contract carry forward review only"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>carry-forward review-only</span>
        <strong>
          {
            preview.carry_forward_review_only_material
              .rejected_or_review_only_count
          }{" "}
          excluded
        </strong>
        <span style={workplaneCopyStyle}>
          rejected_or_review_only candidates stay out of future ingest material.
        </span>
      </section>

      <section
        aria-label="Selected session digest ingest contract would not write"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>would not write</span>
        <ul style={workplaneListStyle}>
          {preview.would_not_write.slice(0, 12).map((item) => (
            <li key={item} style={workplaneItemStyle}>
              <span style={workplaneCopyStyle}>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-label="Selected session digest ingest contract authority boundary"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>authority boundary</span>
        <strong>Read-only derived read model</strong>
        <span style={workplaneCopyStyle}>
          read_only {String(preview.authority_boundary.read_only)};
          advisory_only {String(preview.authority_boundary.advisory_only)};
          derived_read_model{" "}
          {String(preview.authority_boundary.derived_read_model)}
        </span>
        <span style={workplaneCopyStyle}>
          can_create_ingest_record{" "}
          {String(preview.authority_boundary.can_create_ingest_record)};
          can_create_ingest_receipt{" "}
          {String(preview.authority_boundary.can_create_ingest_receipt)};
          can_write_db {String(preview.authority_boundary.can_write_db)}
        </span>
        <span style={workplaneCopyStyle}>
          can_write_memory {String(preview.authority_boundary.can_write_memory)};
          can_mutate_current_working_perspective{" "}
          {String(
            preview.authority_boundary
              .can_mutate_current_working_perspective,
          )}
        </span>
        <span style={workplaneCopyStyle}>
          can_apply_handoff_context{" "}
          {String(preview.authority_boundary.can_apply_handoff_context)};
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

function SourceMaterialSection({
  preview,
}: {
  preview: SelectedSessionDigestIngestContractPreview;
}) {
  return (
    <section
      aria-label="Selected session digest ingest contract source material"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>source material</span>
      <strong>{preview.input_summary.source_kind ?? "missing"}</strong>
      <span style={workplaneCopyStyle}>
        intake {preview.source_status.selected_session_digest_intake_preview};
        authority {preview.source_status.authority_boundary}; write authority{" "}
        {preview.source_status.intake_preview_write_authority}
      </span>
      <span style={workplaneCopyStyle}>
        source_ref {String(preview.input_summary.source_ref_supplied)};
        operator_ref {String(preview.input_summary.operator_ref_supplied)}
      </span>
      <span style={workplaneCopyStyle}>
        session_ref {String(preview.input_summary.session_ref_supplied)};
        project_ref {String(preview.input_summary.project_ref_supplied)};
        evidence_refs {preview.input_summary.evidence_ref_count}
      </span>
    </section>
  );
}

function ContractMaterialSection({
  preview,
}: {
  preview: SelectedSessionDigestIngestContractPreview;
}) {
  return (
    <section
      aria-label="Selected session digest ingest contract material status"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>contract material</span>
      <strong>
        candidates {preview.input_summary.ingestable_candidate_count}
      </strong>
      <span style={workplaneCopyStyle}>
        selected refs{" "}
        {String(preview.input_summary.selected_candidate_refs_supplied)} (
        {preview.input_summary.selected_candidate_ref_count})
      </span>
      <span style={workplaneCopyStyle}>
        idempotency{" "}
        {String(preview.input_summary.requested_idempotency_key_supplied)};
        privacy{" "}
        {String(
          preview.input_summary.privacy_review_confirmation_ref_supplied,
        )}
      </span>
      <span style={workplaneCopyStyle}>
        blockers {preview.input_summary.blocking_reason_count}; insufficient{" "}
        {preview.input_summary.insufficient_data_reason_count}; refusals{" "}
        {preview.input_summary.refusal_reason_count}
      </span>
    </section>
  );
}

function FutureContractSection({
  preview,
}: {
  preview: SelectedSessionDigestIngestContractPreview;
}) {
  return (
    <section
      aria-label="Selected session digest ingest contract future ingest write contract"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>future ingest write contract</span>
      <strong>
        {preview.future_ingest_write_contract.proposed_record_kind}
      </strong>
      <span style={workplaneCopyStyle}>
        receipt {preview.future_ingest_write_contract.proposed_receipt_kind}
      </span>
      <span style={workplaneCopyStyle}>
        selected refs{" "}
        {
          preview.future_ingest_write_contract
            .required_selected_digest_candidate_refs.length
        }
        ; evidence{" "}
        {preview.future_ingest_write_contract.required_evidence_refs.length};
        idempotency{" "}
        {preview.future_ingest_write_contract.required_idempotency.length}
      </span>
      <span style={workplaneCopyStyle}>
        operator approval{" "}
        {
          preview.future_ingest_write_contract
            .required_operator_approval_payload.length
        }
        ; refusal checks{" "}
        {preview.future_ingest_write_contract.required_refusal_checks.length}
      </span>
    </section>
  );
}

function WouldIngestSection({
  preview,
}: {
  preview: SelectedSessionDigestIngestContractPreview;
}) {
  const counts = preview.would_ingest_material_preview.candidate_counts_by_kind;
  return (
    <section
      aria-label="Selected session digest ingest contract would-ingest material preview"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>would-ingest material preview</span>
      <strong>
        {preview.would_ingest_material_preview.selected_digest_candidate_refs.length}{" "}
        candidate refs
      </strong>
      <span style={workplaneCopyStyle}>
        summaries {counts.session_summary}; goals {counts.user_goal}; decisions{" "}
        {counts.decision}; questions {counts.open_question}
      </span>
      <span style={workplaneCopyStyle}>
        next {counts.next_action}; evidence {counts.evidence_ref}; sources{" "}
        {counts.source_ref}; risks {counts.risk_or_blocker}; reusable{" "}
        {counts.reusable_context}
      </span>
      <span style={workplaneCopyStyle}>
        candidate summaries{" "}
        {preview.would_ingest_material_preview.candidate_summaries.length};
        missing evidence {preview.missing_evidence.length}
      </span>
    </section>
  );
}
