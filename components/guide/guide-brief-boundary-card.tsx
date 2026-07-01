import type { GuideBriefAuthorityBoundary } from "@/types/guide-brief";
import type { CSSProperties } from "react";

type GuideBriefBoundaryCardProps = {
  authorityBoundary: GuideBriefAuthorityBoundary;
};

const boundaryStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
  padding: "12px",
  border: "1px solid rgba(127, 29, 29, 0.18)",
  borderRadius: "8px",
  background: "rgba(255, 251, 235, 0.72)",
};

const headingStyle: CSSProperties = {
  margin: 0,
  color: "#0f172a",
  fontSize: "0.9rem",
  lineHeight: 1.25,
};

const listStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  margin: 0,
  paddingInlineStart: "18px",
  color: "#334155",
  fontSize: "0.77rem",
  lineHeight: 1.35,
};

const flagListStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  margin: 0,
  padding: 0,
  listStyle: "none",
};

const flagStyle: CSSProperties = {
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  border: "1px solid rgba(15, 23, 42, 0.12)",
  background: "#ffffff",
  color: "#334155",
  fontSize: "0.68rem",
  fontWeight: 760,
  overflowWrap: "anywhere",
};

export function GuideBriefBoundaryCard({
  authorityBoundary,
}: GuideBriefBoundaryCardProps) {
  const deniedFlags = [
    ["source_of_truth", authorityBoundary.source_of_truth],
    ["can_create_ui_action", authorityBoundary.can_create_ui_action],
    ["can_send_handoff", authorityBoundary.can_send_handoff],
    ["can_execute_codex", authorityBoundary.can_execute_codex],
    ["can_record_proof", authorityBoundary.can_record_proof],
    ["can_create_evidence", authorityBoundary.can_create_evidence],
    ["can_call_github", authorityBoundary.can_call_github],
    ["can_call_openai_or_provider", authorityBoundary.can_call_openai_or_provider],
  ] as const;

  return (
    <section aria-labelledby="guide-brief-authority-boundary" style={boundaryStyle}>
      <h3 id="guide-brief-authority-boundary" style={headingStyle}>
        Authority boundary
      </h3>
      <ul style={listStyle}>
        <li>No hidden execution authority</li>
        <li>Suggestions are not actions</li>
        <li>The guide does not decide user judgment items</li>
        <li>Handoff candidates are preview-only</li>
      </ul>
      <ul aria-label="Denied GuideBrief authorities" style={flagListStyle}>
        {deniedFlags.map(([label, value]) => (
          <li key={label} style={flagStyle}>
            {label}: {String(value)}
          </li>
        ))}
      </ul>
    </section>
  );
}
