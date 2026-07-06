import type { CSSProperties } from "react";

import type { HandoffPacketCopyExportPreview } from "@/types/handoff-packet-copy-export-preview";

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

export function HandoffPacketCopyExportPreviewPanel({
  preview,
}: {
  preview: HandoffPacketCopyExportPreview;
}) {
  const artifact = preview.proposed_exported_packet_artifact_summary;
  return (
    <section aria-label="Handoff Packet Copy Export Preview" style={cardStyle}>
      <div>
        <p style={kickerStyle}>Packet copy/export preview</p>
        <h3 style={titleStyle}>{preview.copy_export_preview_status}</h3>
      </div>
      <p style={textStyle}>
        Scoped local packet artifact preview only. No clipboard write, browser
        download, arbitrary file write, external export, or handoff send is
        performed here.
      </p>
      <p style={textStyle}>
        Contract:{" "}
        {preview.source_contract_summary.source_copy_export_contract_record_ref ??
          "none"}
        . Artifact: {artifact.artifact_ref ?? "none"}.
      </p>
      <p style={textStyle}>
        Format: {artifact.packet_format ?? "missing"}. Target:{" "}
        {artifact.copy_export_target ?? "missing"}. Entries:{" "}
        {artifact.packet_entry_count}. Sections:{" "}
        {Object.keys(artifact.packet_section_counts).length}.
      </p>
      <p style={textStyle}>
        Payloads: markdown {String(artifact.has_markdown_payload)}, json{" "}
        {String(artifact.has_json_payload)}, capsule{" "}
        {String(artifact.has_capsule_payload)}. Ready:{" "}
        {preview.copy_export_readiness.write_ready ? "yes" : "no"}.
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
        clipboard {String(preview.authority_boundary.can_write_clipboard)},
        download {String(preview.authority_boundary.can_download_file)}, send{" "}
        {String(preview.authority_boundary.can_send_handoff)}.
      </p>
    </section>
  );
}
