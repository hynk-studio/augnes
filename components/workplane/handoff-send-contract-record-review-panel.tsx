import type { CSSProperties } from "react";

import type { HandoffSendContractRecordReview } from "@/types/handoff-send-contract-record-review";

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

export function HandoffSendContractRecordReviewPanel({
  review,
}: {
  review: HandoffSendContractRecordReview;
}) {
  const material = review.handoff_send_contract_material_summary;
  return (
    <section aria-label="Handoff Send Contract Record Review" style={cardStyle}>
      <div>
        <p style={kickerStyle}>Handoff send contract records</p>
        <h3 style={titleStyle}>{review.review_status}</h3>
      </div>
      <p style={textStyle}>
        Readback review only. Valid records are scoped local handoff send
        contract records; they are not handoff sends and do not call providers,
        email, Slack, webhook, GitHub, Codex, browser, crawler, OpenAI, clipboard,
        downloads, files, or live handoff mutation surfaces.
      </p>
      <p style={textStyle}>
        Valid records: {review.input_summary.valid_record_count}. Invalid:{" "}
        {review.input_summary.invalid_record_count}. Artifact refs:{" "}
        {material.source_exported_artifact_refs.length}. Payload hashes:{" "}
        {material.payload_hashes.length}.
      </p>
      <p style={textStyle}>
        Recipients: {material.recipient_refs.length}. Source refs:{" "}
        {review.evidence_summary.source_refs.length}. Evidence refs:{" "}
        {review.evidence_summary.evidence_refs.length}.
      </p>
      {review.blocked_reasons.length > 0 ? (
        <ul style={listStyle}>
          {review.blocked_reasons.slice(0, 5).map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : null}
      {review.insufficient_data_reasons.length > 0 ? (
        <p style={textStyle}>
          Missing: {review.insufficient_data_reasons.join(", ")}
        </p>
      ) : null}
      <p style={textStyle}>
        Authority: write DB {String(review.authority_boundary.can_write_db)},
        create contract{" "}
        {String(
          review.authority_boundary.can_create_handoff_send_contract_record,
        )}, send {String(review.authority_boundary.can_send_handoff)}, provider{" "}
        {String(review.authority_boundary.can_call_send_provider)}, clipboard{" "}
        {String(review.authority_boundary.can_write_clipboard)}, download{" "}
        {String(review.authority_boundary.can_download_file)}.
      </p>
    </section>
  );
}
