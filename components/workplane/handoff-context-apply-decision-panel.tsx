import type { CSSProperties } from "react";

import type { HandoffContextApplyOperatorDecisionPreview } from "@/types/handoff-context-apply-slice-decision";

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

export function HandoffContextApplyDecisionPanel({
  preview,
}: {
  preview: HandoffContextApplyOperatorDecisionPreview;
}) {
  return (
    <section aria-label="Handoff Context Apply Decision" style={cardStyle}>
      <div>
        <p style={kickerStyle}>Handoff apply decision</p>
        <h3 style={titleStyle}>{preview.decision_preview_status}</h3>
      </div>
      <p style={textStyle}>
        Recommended operator decision: {preview.recommended_operator_decision}.
      </p>
      <p style={textStyle}>
        Write ready: {preview.write_readiness.write_ready ? "yes" : "no"}.
        Proposed entries: {preview.input_summary.proposed_entry_count}.
      </p>
      <p style={textStyle}>
        This decision preview remains read-only and does not write an apply
        record or mutate/send handoff context.
      </p>
      <p style={textStyle}>
        Blockers: {preview.blocking_reasons.length}. Missing evidence:{" "}
        {preview.missing_evidence.length}. Refusals:{" "}
        {preview.refusal_reasons.length}.
      </p>
    </section>
  );
}
