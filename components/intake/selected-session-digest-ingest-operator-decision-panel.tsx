import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { SelectedSessionDigestIngestOperatorDecisionPreview } from "@/types/selected-session-digest-ingest-operator-decision";
import type { CSSProperties } from "react";

type SelectedSessionDigestIngestOperatorDecisionPanelProps = {
  preview: SelectedSessionDigestIngestOperatorDecisionPreview;
};

const sectionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
  gap: "10px",
  minWidth: 0,
};

export function SelectedSessionDigestIngestOperatorDecisionPanel({
  preview,
}: SelectedSessionDigestIngestOperatorDecisionPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Selected session ingest decision"
      title="Selected Session Digest Ingest Operator Decision"
      ariaLabel="Selected Session Digest Ingest Operator Decision panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only operator decision preview for a future selected session digest
        ingest decision record. It consumes the already-built ingest contract
        preview, rechecks contract readiness, candidate selection, privacy,
        idempotency, and evidence material, and still does not perform the
        selected digest ingest.
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
          label="Write readiness"
          value={String(preview.write_readiness.write_ready)}
        />
        <WorkplanePanelMetric
          label="Approval requirements"
          value={String(preview.approval_requirements.length)}
        />
      </WorkplanePanelMetricGrid>

      <section style={sectionGridStyle}>
        <SourceMaterialSection preview={preview} />
        <DecisionMaterialSection preview={preview} />
        <WouldWriteDecisionRecordSection preview={preview} />
        <CarryForwardSection preview={preview} />
      </section>

      <section
        aria-label="Selected session digest ingest operator decision blockers"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>review blockers</span>
        <strong>
          blockers {preview.blocking_reasons.length}; missing{" "}
          {preview.missing_evidence.length}; refusals{" "}
          {preview.refusal_reasons.length}
        </strong>
        <ul style={workplaneListStyle}>
          {[
            ...preview.blocking_reasons,
            ...preview.missing_evidence,
            ...preview.refusal_reasons,
          ]
            .slice(0, 8)
            .map((reason) => (
              <li key={reason} style={workplaneItemStyle}>
                <span style={workplaneCopyStyle}>{reason}</span>
              </li>
            ))}
        </ul>
      </section>

      <section
        aria-label="Selected session digest ingest operator decision approval requirements"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>approval requirements</span>
        <ul style={workplaneListStyle}>
          {preview.approval_requirements.slice(0, 10).map((requirement) => (
            <li key={requirement} style={workplaneItemStyle}>
              <span style={workplaneCopyStyle}>{requirement}</span>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-label="Selected session digest ingest operator decision would not write"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>would not write</span>
        <ul style={workplaneListStyle}>
          {preview.would_not_write.slice(0, 14).map((item) => (
            <li key={item} style={workplaneItemStyle}>
              <span style={workplaneCopyStyle}>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-label="Selected session digest ingest operator decision authority boundary"
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
          can_create_ingest_decision_record{" "}
          {String(
            preview.authority_boundary.can_create_ingest_decision_record,
          )}
          ; can_create_ingest_record{" "}
          {String(preview.authority_boundary.can_create_ingest_record)};
          can_create_ingest_receipt{" "}
          {String(preview.authority_boundary.can_create_ingest_receipt)}
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
  preview: SelectedSessionDigestIngestOperatorDecisionPreview;
}) {
  return (
    <section
      aria-label="Selected session digest ingest operator decision source material"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>source material</span>
      <strong>
        contract{" "}
        {
          preview.source_status
            .selected_session_digest_ingest_contract_preview
        }
      </strong>
      <span style={workplaneCopyStyle}>
        contract status {preview.source_status.contract_preview_status ?? "none"}
      </span>
      <span style={workplaneCopyStyle}>
        authority {preview.source_status.authority_boundary}; write authority{" "}
        {preview.source_status.contract_preview_write_authority}
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

function DecisionMaterialSection({
  preview,
}: {
  preview: SelectedSessionDigestIngestOperatorDecisionPreview;
}) {
  return (
    <section
      aria-label="Selected session digest ingest operator decision material"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>decision material</span>
      <strong>
        selected refs {preview.input_summary.selected_digest_candidate_ref_count}
      </strong>
      <span style={workplaneCopyStyle}>
        selectable refs{" "}
        {preview.input_summary.selectable_digest_candidate_ref_count}
      </span>
      <span style={workplaneCopyStyle}>
        privacy{" "}
        {String(
          preview.input_summary.privacy_review_confirmation_ref_supplied,
        )}
        ; idempotency{" "}
        {String(preview.input_summary.requested_idempotency_key_supplied)}
      </span>
      <span style={workplaneCopyStyle}>
        contract ready{" "}
        {String(
          preview.input_summary
            .contract_ready_for_future_ingest_write_scope,
        )}
      </span>
    </section>
  );
}

function WouldWriteDecisionRecordSection({
  preview,
}: {
  preview: SelectedSessionDigestIngestOperatorDecisionPreview;
}) {
  const material = preview.would_write_decision_record_preview;
  return (
    <section
      aria-label="Selected session digest ingest operator decision would-write decision record"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>would-write decision record</span>
      <strong>{material.proposed_record_kind ?? "not ready"}</strong>
      <span style={workplaneCopyStyle}>
        receipt {material.proposed_receipt_kind ?? "not ready"}
      </span>
      <span style={workplaneCopyStyle}>
        future target {material.proposed_future_ingest_record_kind}; future
        receipt {material.proposed_future_ingest_receipt_kind}
      </span>
      <span style={workplaneCopyStyle}>
        sanitized summaries {material.sanitized_candidate_summaries.length}
      </span>
    </section>
  );
}

function CarryForwardSection({
  preview,
}: {
  preview: SelectedSessionDigestIngestOperatorDecisionPreview;
}) {
  return (
    <section
      aria-label="Selected session digest ingest operator decision carry-forward material"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>carry-forward only</span>
      <strong>
        review-only {preview.candidate_carry_forward.review_only_candidate_count}
      </strong>
      <span style={workplaneCopyStyle}>
        unresolved blockers{" "}
        {preview.candidate_carry_forward.unresolved_contract_blockers.length}
      </span>
      <span style={workplaneCopyStyle}>
        contract missing evidence{" "}
        {preview.candidate_carry_forward.contract_missing_evidence.length}
      </span>
    </section>
  );
}
