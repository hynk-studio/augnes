import type { CSSProperties } from "react";

import type { HandoffSendContractPreview } from "@/types/handoff-send-contract-preview";

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

const listStyle: CSSProperties = {
  margin: 0,
  paddingLeft: "18px",
  color: "#475569",
  fontSize: "0.8rem",
  lineHeight: 1.35,
};

export function HandoffSendContractPreviewPanel({
  preview,
}: {
  preview: HandoffSendContractPreview;
}) {
  const artifact = preview.source_exported_packet_artifact_summary;
  const proposal = preview.proposed_handoff_send_contract;
  return (
    <section aria-label="Handoff Send Contract Preview" style={cardStyle}>
      <div>
        <p style={kickerStyle}>Handoff send contract preview</p>
        <h3 style={titleStyle}>{preview.contract_preview_status}</h3>
      </div>
      <p style={textStyle}>
        Contract material only for a future handoff send slice. This panel does
        not send handoff, call a provider, email, Slack, webhook, GitHub, Codex,
        browser, crawler, or OpenAI surface, write clipboard, create downloads,
        write files, or mutate live handoff context.
      </p>
      <p style={textStyle}>
        Exported artifact: {artifact.source_exported_artifact_ref ?? "none"}.
        Format: {artifact.packet_format ?? "missing"}. Payload hash:{" "}
        {artifact.payload_hash ?? "missing"}.
      </p>
      <p style={textStyle}>
        Surface: {proposal?.requested_send_surface ?? "missing"}. Delivery:{" "}
        {proposal?.requested_delivery_mode ?? "missing"}. Recipient:{" "}
        {proposal?.requested_recipient_ref ?? "missing"}.
      </p>
      <p style={textStyle}>
        Source refs: {preview.evidence_summary.source_refs.length}. Evidence
        refs: {preview.evidence_summary.evidence_refs.length}. Ready:{" "}
        {preview.contract_readiness.write_ready ? "yes" : "no"}.
      </p>
      {preview.blocking_reasons.length > 0 ? (
        <ul style={listStyle}>
          {preview.blocking_reasons.slice(0, 5).map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
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
        clipboard {String(preview.authority_boundary.can_write_clipboard)},
        download {String(preview.authority_boundary.can_download_file)}.
      </p>
    </section>
  );
}
