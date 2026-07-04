import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { HandoffContextApplyWriteContractPreview } from "@/types/handoff-context-apply-write-contract-preview";
import type { CSSProperties } from "react";

type HandoffContextApplyWriteContractPreviewPanelProps = {
  preview: HandoffContextApplyWriteContractPreview;
};

const sectionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))",
  gap: "10px",
  minWidth: 0,
};

export function HandoffContextApplyWriteContractPreviewPanel({
  preview,
}: HandoffContextApplyWriteContractPreviewPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Handoff apply write contract"
      title="Handoff Context Apply Write Contract Preview"
      ariaLabel="Handoff Context Apply Write Contract Preview panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only contract preview for a later separately scoped
        operator-approved handoff context apply write. This panel does not
        persist decisions, create records, create schema, write DB rows,
        mutate live handoff context, write selected refs, send handoffs, call
        providers, GitHub, or Codex, or run autonomous actions.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="Status"
          value={preview.contract_preview_status}
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
          label="Future write scope"
          value={String(preview.readiness.ready_for_future_write_scope)}
        />
      </WorkplanePanelMetricGrid>

      <section style={sectionGridStyle}>
        <SourceSection preview={preview} />
        <WouldWriteSection preview={preview} />
        <CarryForwardSection preview={preview} />
        <RequirementsSection preview={preview} />
      </section>

      <section
        aria-label="Handoff context apply write contract would not write"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>would not write</span>
        <ul style={workplaneListStyle}>
          {preview.would_not_write.slice(0, 10).map((item) => (
            <li key={item} style={workplaneItemStyle}>
              <span style={workplaneCopyStyle}>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-label="Handoff context apply write contract authority boundary"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>authority</span>
        <strong>Read-only write contract preview</strong>
        <span style={workplaneCopyStyle}>
          can_persist_decision{" "}
          {String(preview.authority_boundary.can_persist_decision)};
          can_write_db {String(preview.authority_boundary.can_write_db)};
          can_create_schema{" "}
          {String(preview.authority_boundary.can_create_schema)};
          can_create_apply_write_contract_record{" "}
          {String(
            preview.authority_boundary.can_create_apply_write_contract_record,
          )}
        </span>
        <span style={workplaneCopyStyle}>
          can_mutate_live_handoff_context{" "}
          {String(preview.authority_boundary.can_mutate_live_handoff_context)};
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
  preview: HandoffContextApplyWriteContractPreview;
}) {
  const visibleReasons = [
    ...preview.refusal_reasons,
    ...preview.blocked_reasons,
    ...preview.insufficient_data_reasons,
  ].slice(0, 6);
  return (
    <section
      aria-label="Handoff context apply write contract source and readiness"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>source</span>
      <strong>
        {preview.source_status.decision_preview_status ?? "missing"}
      </strong>
      <span style={workplaneCopyStyle}>
        decision {preview.input_summary.recommended_operator_decision ?? "none"}
      </span>
      <span style={workplaneCopyStyle}>
        selected_record {preview.input_summary.selected_record_ref ?? "none"}
      </span>
      <span style={workplaneCopyStyle}>
        blockers {preview.input_summary.blocking_reason_count}; insufficient{" "}
        {preview.input_summary.insufficient_data_reason_count}; refusals{" "}
        {preview.input_summary.refusal_reason_count}
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
              No contract preview blocker is surfaced.
            </span>
          </li>
        )}
      </ul>
    </section>
  );
}

function WouldWriteSection({
  preview,
}: {
  preview: HandoffContextApplyWriteContractPreview;
}) {
  const material = preview.would_write_material_preview;
  return (
    <section
      aria-label="Handoff context apply write contract would-write material"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>would-write material</span>
      <strong>
        add {material.selected_refs_to_add.length}; reinforce{" "}
        {material.selected_refs_to_reinforce.length}
      </strong>
      <span style={workplaneCopyStyle}>
        warnings {material.warnings_to_add_or_strengthen.length}; context{" "}
        {material.context_refs_to_deprioritize.length +
          material.context_refs_to_exclude.length}
        ; expected_return {material.expected_return_signal_updates.length}
      </span>
      <span style={workplaneCopyStyle}>
        sources {material.source_refs.length}; evidence{" "}
        {material.evidence_refs.length}; current_context{" "}
        {material.current_handoff_context_ref ?? "missing"}
      </span>
    </section>
  );
}

function CarryForwardSection({
  preview,
}: {
  preview: HandoffContextApplyWriteContractPreview;
}) {
  const carryForward = preview.carry_forward_review_only_material;
  return (
    <section
      aria-label="Handoff context apply write contract carry-forward material"
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

function RequirementsSection({
  preview,
}: {
  preview: HandoffContextApplyWriteContractPreview;
}) {
  return (
    <section
      aria-label="Handoff context apply write contract requirements"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>future contract</span>
      <strong>{preview.future_write_contract.proposed_record_kind}</strong>
      <span style={workplaneCopyStyle}>
        packet_fingerprint{" "}
        {String(
          preview.input_summary.current_handoff_packet_fingerprint_supplied,
        )}
        ; context_ref{" "}
        {String(preview.input_summary.current_handoff_context_ref_supplied)}
      </span>
      <span style={workplaneCopyStyle}>
        operator_ref{" "}
        {String(preview.input_summary.requested_operator_ref_supplied)};
        idempotency{" "}
        {String(preview.input_summary.requested_idempotency_key_supplied)}
      </span>
      <span style={workplaneCopyStyle}>
        approval payload fields{" "}
        {
          preview.future_write_contract.required_operator_approval_payload
            .length
        }
        ; refusal checks{" "}
        {preview.future_write_contract.required_refusal_checks.length}
      </span>
    </section>
  );
}
