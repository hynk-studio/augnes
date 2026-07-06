import type { CSSProperties } from "react";

import type { HandoffPacketCopyExportOperatorDecisionPreview } from "@/types/handoff-packet-copy-export-decision";

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

export function HandoffPacketCopyExportDecisionPanel({
  preview,
}: {
  preview: HandoffPacketCopyExportOperatorDecisionPreview;
}) {
  return (
    <section aria-label="Handoff Packet Copy Export Decision" style={cardStyle}>
      <div>
        <p style={kickerStyle}>Packet copy/export decision preview</p>
        <h3 style={titleStyle}>{preview.decision_preview_status}</h3>
      </div>
      <p style={textStyle}>
        Operator decision preview only. It does not write records, write
        clipboard, create downloads, write packet files, send handoff, or mutate
        live handoff context.
      </p>
      <p style={textStyle}>
        Recommended decision: {preview.recommended_operator_decision}. Ready:{" "}
        {preview.write_readiness.write_ready ? "yes" : "no"}.
      </p>
      <p style={textStyle}>
        Entries: {preview.input_summary.proposed_packet_entry_count}. Source
        refs: {preview.evidence_summary.source_refs.length}. Evidence refs:{" "}
        {preview.evidence_summary.evidence_refs.length}.
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
        clipboard {String(preview.authority_boundary.can_write_clipboard)},
        download {String(preview.authority_boundary.can_download_file)}, send{" "}
        {String(preview.authority_boundary.can_send_handoff)}.
      </p>
    </section>
  );
}
