import type { CSSProperties } from "react";

import type { ExportedHandoffPacketArtifactRead } from "@/lib/workplane/read-exported-handoff-packet-artifact-for-web";

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

export function ExportedHandoffPacketArtifactPanel({
  read,
}: {
  read: ExportedHandoffPacketArtifactRead;
}) {
  return (
    <section aria-label="Exported Handoff Packet Artifact" style={cardStyle}>
      <div>
        <p style={kickerStyle}>Exported packet artifact</p>
        <h3 style={titleStyle}>{read.status}</h3>
      </div>
      <p style={textStyle}>
        Scoped local packet artifact readback only. It does not write clipboard,
        create downloads, write packet files, externally export packets, send
        handoff, or mutate live handoff context.
      </p>
      <p style={textStyle}>
        Artifact: {read.summary.exported_artifact_ref ?? "none"}. Format:{" "}
        {read.summary.packet_format ?? "missing"}. Target:{" "}
        {read.summary.copy_export_target ?? "missing"}.
      </p>
      <p style={textStyle}>
        Entries: {read.summary.packet_entry_count}. Sections:{" "}
        {Object.keys(read.summary.packet_section_counts).length}. Payloads:
        markdown {String(read.summary.has_markdown_payload)}, json{" "}
        {String(read.summary.has_json_payload)}, capsule{" "}
        {String(read.summary.has_capsule_payload)}.
      </p>
      <p style={textStyle}>
        Pending user-surface copy/export:{" "}
        {String(read.summary.clipboard_write_still_pending)}. Pending send:{" "}
        {String(read.summary.send_still_pending)}.
      </p>
      <p style={textStyle}>
        Authority: write DB {String(read.authority_boundary.can_write_db)},
        clipboard {String(read.authority_boundary.can_write_clipboard)},
        download {String(read.authority_boundary.can_download_file)}, send{" "}
        {String(read.authority_boundary.can_send_handoff)}.
      </p>
    </section>
  );
}
