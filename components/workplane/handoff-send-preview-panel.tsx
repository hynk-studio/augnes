import type { CSSProperties } from "react";

import type { HandoffSendPreview } from "@/types/handoff-send-preview";

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

export function HandoffSendPreviewPanel({
  preview,
}: {
  preview: HandoffSendPreview;
}) {
  const source = preview.source_send_contract_summary;
  const fulfillment = preview.proposed_handoff_send_fulfillment;
  return (
    <section aria-label="Handoff Send Preview" style={cardStyle}>
      <div>
        <p style={kickerStyle}>Handoff send preview</p>
        <h3 style={titleStyle}>{preview.send_preview_status}</h3>
      </div>
      <p style={textStyle}>
        Local fulfillment preview only. This PR writes only a scoped local send
        fulfillment record and does not send externally, call providers, email,
        Slack, webhook, GitHub, Codex, OpenAI, browser, crawler, or network
        surfaces, write clipboard, create downloads, write files, or mutate live
        handoff context.
      </p>
      <p style={textStyle}>
        Contract: {source.source_handoff_send_contract_record_ref ?? "none"}.
        Artifact: {source.source_exported_artifact_ref ?? "none"}. Payload hash:{" "}
        {source.payload_hash ?? "missing"}.
      </p>
      <p style={textStyle}>
        Mode: {fulfillment?.requested_send_execution_mode ?? "missing"}.
        Status: {fulfillment?.fulfillment_status ?? "missing"}. Surface:{" "}
        {source.requested_send_surface ?? "missing"}. Delivery:{" "}
        {source.requested_delivery_mode ?? "missing"}. Recipient:{" "}
        {source.requested_recipient_ref ?? "missing"}.
      </p>
      <p style={textStyle}>
        Source refs: {preview.evidence_summary.source_refs.length}. Evidence
        refs: {preview.evidence_summary.evidence_refs.length}. Ready:{" "}
        {preview.send_readiness.write_ready ? "yes" : "no"}.
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
        local fulfillment{" "}
        {String(preview.authority_boundary.can_record_local_send_fulfillment)},
        external send {String(preview.authority_boundary.can_send_handoff)},
        provider {String(preview.authority_boundary.can_call_send_provider)},
        clipboard {String(preview.authority_boundary.can_write_clipboard)},
        download {String(preview.authority_boundary.can_download_file)}.
      </p>
    </section>
  );
}
