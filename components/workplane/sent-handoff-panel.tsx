import type { CSSProperties } from "react";

import type { SentHandoffReadForWeb } from "@/lib/workplane/read-sent-handoff-for-web";

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

export function SentHandoffPanel({
  sentHandoff,
}: {
  sentHandoff: SentHandoffReadForWeb;
}) {
  const summary = sentHandoff.latest_fulfillment_summary;
  return (
    <section aria-label="Sent Handoff Status" style={cardStyle}>
      <div>
        <p style={kickerStyle}>Sent handoff status</p>
        <h3 style={titleStyle}>{sentHandoff.status}</h3>
      </div>
      <p style={textStyle}>
        Status is based only on scoped local handoff send fulfillment records.
        It does not imply external delivery, provider calls, email, Slack,
        webhook, GitHub, Codex, browser, crawler, network send, clipboard,
        download, file write, or live handoff context mutation.
      </p>
      <p style={textStyle}>
        Record: {summary.record_id ?? "none"}. Fulfillment:{" "}
        {summary.fulfillment_status ?? "missing"}. Contract:{" "}
        {summary.source_handoff_send_contract_record_ref ?? "none"}.
      </p>
      <p style={textStyle}>
        Mode: {summary.requested_send_execution_mode ?? "missing"}. Surface:{" "}
        {summary.requested_send_surface ?? "missing"}. Delivery:{" "}
        {summary.requested_delivery_mode ?? "missing"}. Recipient:{" "}
        {summary.requested_recipient_ref ?? "missing"}.
      </p>
      <p style={textStyle}>
        Authority: write DB {String(sentHandoff.authority_boundary.can_write_db)},
        create schema {String(sentHandoff.authority_boundary.can_create_schema)},
        send {String(sentHandoff.authority_boundary.can_send_handoff)},
        provider {String(sentHandoff.authority_boundary.can_call_send_provider)},
        clipboard {String(sentHandoff.authority_boundary.can_write_clipboard)}.
      </p>
    </section>
  );
}
