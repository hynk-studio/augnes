import type { CSSProperties } from "react";

import type { AppliedHandoffContextRead } from "@/lib/workplane/read-applied-handoff-context-for-web";

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

export function AppliedHandoffContextPanel({
  read,
}: {
  read: AppliedHandoffContextRead;
}) {
  return (
    <section aria-label="Applied Handoff Context" style={cardStyle}>
      <div>
        <p style={kickerStyle}>Applied handoff context</p>
        <h3 style={titleStyle}>{read.status}</h3>
      </div>
      <p style={textStyle}>
        Latest snapshot:{" "}
        {read.summary.applied_handoff_context_snapshot_ref ?? "none"}. Entries:{" "}
        {read.summary.entry_count}.
      </p>
      <p style={textStyle}>
        Source contract: {read.summary.source_contract_record_ref ?? "none"}.
        Route read: {read.summary.source_route_integration_read_ref ?? "none"}.
      </p>
      <p style={textStyle}>
        Previous context used: {String(read.summary.previous_context_used)}.
        Copy/export pending: {String(read.summary.copy_export_still_pending)}.
        Send pending: {String(read.summary.send_still_pending)}.
      </p>
      <p style={textStyle}>
        Read-only status: write DB {String(read.authority_boundary.can_write_db)},
        send {String(read.authority_boundary.can_send_handoff)}, copy/export{" "}
        {String(read.authority_boundary.can_copy_export_handoff_packet)}.
      </p>
    </section>
  );
}
