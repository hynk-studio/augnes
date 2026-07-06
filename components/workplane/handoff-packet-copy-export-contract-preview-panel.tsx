import type { CSSProperties } from "react";

import type { HandoffPacketCopyExportContractPreview } from "@/types/handoff-packet-copy-export-contract-preview";

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

export function HandoffPacketCopyExportContractPreviewPanel({
  preview,
}: {
  preview: HandoffPacketCopyExportContractPreview;
}) {
  return (
    <section
      aria-label="Handoff Packet Copy Export Contract Preview"
      style={cardStyle}
    >
      <div>
        <p style={kickerStyle}>Packet copy/export contract preview</p>
        <h3 style={titleStyle}>{preview.contract_preview_status}</h3>
      </div>
      <p style={textStyle}>
        Contract material only for a future packet copy/export slice. No packet is
        copied, exported, downloaded, written to file, written to clipboard, or
        sent here.
      </p>
      <p style={textStyle}>
        Format: {preview.input_summary.requested_packet_format ?? "missing"}.
        Target: {preview.input_summary.requested_copy_export_target ?? "missing"}.
      </p>
      <p style={textStyle}>
        Snapshot:{" "}
        {preview.source_applied_handoff_context_summary
          .applied_handoff_context_snapshot_ref ?? "none"}. Packet entries:{" "}
        {preview.input_summary.proposed_packet_entry_count}. Sections:{" "}
        {preview.input_summary.proposed_packet_section_count}.
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
        Authority: write DB{" "}
        {String(preview.authority_boundary.can_write_db)}, copy/export{" "}
        {String(preview.authority_boundary.can_copy_export_handoff_packet)},
        clipboard {String(preview.authority_boundary.can_write_clipboard)}, send{" "}
        {String(preview.authority_boundary.can_send_handoff)}.
      </p>
    </section>
  );
}
