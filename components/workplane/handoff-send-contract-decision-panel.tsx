import type { CSSProperties } from "react";

import type { HandoffSendContractOperatorDecisionPreview } from "@/types/handoff-send-contract-decision";

const cardStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  padding: "14px",
  border: "1px solid rgba(30, 41, 59, 0.12)",
  borderRadius: "8px",
  background: "rgba(255, 255, 255, 0.92)",
  color: "#0f172a",
  minWidth: 0,
};

const kickerStyle: CSSProperties = {
  margin: 0,
  color: "#64748b",
  fontSize: "0.72rem",
  fontWeight: 820,
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "1rem",
  lineHeight: 1.2,
};

const textStyle: CSSProperties = {
  margin: 0,
  color: "#475569",
  fontSize: "0.82rem",
  lineHeight: 1.38,
  overflowWrap: "anywhere",
};

export function HandoffSendContractDecisionPanel({
  preview,
}: {
  preview: HandoffSendContractOperatorDecisionPreview;
}) {
  return (
    <section aria-label="Handoff Send Contract Decision" style={cardStyle}>
      <div>
        <p style={kickerStyle}>Handoff send contract decision preview</p>
        <h3 style={titleStyle}>{preview.decision_preview_status}</h3>
      </div>
      <p style={textStyle}>
        Operator decision preview only. It does not write records, send
        handoff, call providers or external messaging systems, write clipboard,
        create downloads, write files, or mutate live handoff context.
      </p>
      <p style={textStyle}>
        Recommended decision: {preview.recommended_operator_decision}. Ready:{" "}
        {preview.write_readiness.write_ready ? "yes" : "no"}.
      </p>
      <p style={textStyle}>
        Source refs: {preview.evidence_summary.source_refs.length}. Evidence
        refs: {preview.evidence_summary.evidence_refs.length}. Approval intent:{" "}
        {String(preview.evidence_summary.has_approval_intent)}.
      </p>
      {preview.blocking_reasons.length > 0 ? (
        <p style={textStyle}>Blocked: {preview.blocking_reasons.join(", ")}</p>
      ) : null}
      {preview.missing_evidence.length > 0 ? (
        <p style={textStyle}>Missing: {preview.missing_evidence.join(", ")}</p>
      ) : null}
      {preview.refusal_reasons.length > 0 ? (
        <p style={textStyle}>Refused: {preview.refusal_reasons.join(", ")}</p>
      ) : null}
      <p style={textStyle}>
        Authority: write DB {String(preview.authority_boundary.can_write_db)},
        create contract{" "}
        {String(
          preview.authority_boundary.can_create_handoff_send_contract_record,
        )}, send {String(preview.authority_boundary.can_send_handoff)},
        provider {String(preview.authority_boundary.can_call_send_provider)},
        email {String(preview.authority_boundary.can_call_email)}, webhook{" "}
        {String(preview.authority_boundary.can_call_webhook)}.
      </p>
    </section>
  );
}
