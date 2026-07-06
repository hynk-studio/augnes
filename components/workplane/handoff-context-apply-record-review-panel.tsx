import type { CSSProperties } from "react";

import type { HandoffContextApplyRecordReview } from "@/types/handoff-context-apply-record-review";

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

export function HandoffContextApplyRecordReviewPanel({
  review,
}: {
  review: HandoffContextApplyRecordReview;
}) {
  return (
    <section aria-label="Handoff Context Apply Record Review" style={cardStyle}>
      <div>
        <p style={kickerStyle}>Handoff apply record review</p>
        <h3 style={titleStyle}>{review.review_status}</h3>
      </div>
      <p style={textStyle}>
        Valid records: {review.input_summary.valid_record_count}. Applied
        snapshots: {review.applied_snapshots.length}. Latest snapshot:{" "}
        {review.latest_applied_snapshot_summary?.applied_handoff_context_snapshot_ref ??
          "none"}.
      </p>
      <p style={textStyle}>
        Applied entries:{" "}
        {review.handoff_context_apply_material_summary.applied_entry_count}.
        Copy/export pending:{" "}
        {String(review.handoff_context_apply_material_summary.copy_export_still_pending)}.
        Send pending:{" "}
        {String(review.handoff_context_apply_material_summary.send_still_pending)}.
      </p>
      <p style={textStyle}>
        Receipt problems:{" "}
        {review.input_summary.receipt_side_effect_problem_count}. Blockers:{" "}
        {review.blocked_reasons.length}.
      </p>
      <p style={textStyle}>
        Review is read-only and does not apply, send, copy, export, or mutate
        handoff context.
      </p>
    </section>
  );
}
