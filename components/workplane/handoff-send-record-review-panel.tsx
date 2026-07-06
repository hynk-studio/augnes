import type { CSSProperties } from "react";

import type { HandoffSendRecordReview } from "@/types/handoff-send-record-review";

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

export function HandoffSendRecordReviewPanel({
  review,
}: {
  review: HandoffSendRecordReview;
}) {
  const material = review.handoff_send_material_summary;
  return (
    <section aria-label="Handoff Send Record Review" style={cardStyle}>
      <div>
        <p style={kickerStyle}>Handoff send records</p>
        <h3 style={titleStyle}>{review.review_status}</h3>
      </div>
      <p style={textStyle}>
        Readback review only. Valid records are scoped local handoff send
        fulfillment rows; they do not mean external delivery occurred and do not
        call provider, email, Slack, webhook, GitHub, Codex, browser, crawler,
        OpenAI, clipboard, downloads, files, or live handoff mutation surfaces.
      </p>
      <p style={textStyle}>
        Valid records: {review.input_summary.valid_record_count}. Invalid:{" "}
        {review.input_summary.invalid_record_count}. Latest:{" "}
        {material.latest_record_id ?? "none"}. Status:{" "}
        {material.latest_fulfillment_status ?? "missing"}.
      </p>
      <p style={textStyle}>
        Contract: {material.latest_source_handoff_send_contract_record_ref ?? "none"}.
        Payload hash: {material.latest_payload_hash ?? "missing"}. Payload type:{" "}
        {material.latest_payload_type ?? "missing"}.
      </p>
      {review.blocked_reasons.length > 0 ? (
        <p style={textStyle}>Blocked: {review.blocked_reasons.join(", ")}</p>
      ) : null}
      {review.insufficient_data_reasons.length > 0 ? (
        <p style={textStyle}>
          Missing: {review.insufficient_data_reasons.join(", ")}
        </p>
      ) : null}
      <p style={textStyle}>
        Authority: write DB {String(review.authority_boundary.can_write_db)},
        local fulfillment{" "}
        {String(review.authority_boundary.can_record_local_send_fulfillment)},
        external send {String(review.authority_boundary.can_send_handoff)},
        provider {String(review.authority_boundary.can_call_send_provider)},
        clipboard {String(review.authority_boundary.can_write_clipboard)}.
      </p>
    </section>
  );
}
