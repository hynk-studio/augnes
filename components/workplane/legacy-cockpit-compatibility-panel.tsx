import type { CSSProperties, ReactNode } from "react";

const panelStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  minWidth: 0,
  boxSizing: "border-box",
  padding: "14px",
  border: "1px solid rgba(30, 41, 59, 0.14)",
  borderRadius: "8px",
  background: "rgba(255, 255, 255, 0.92)",
  boxShadow: "0 18px 36px rgba(15, 23, 42, 0.06)",
  overflow: "hidden",
};

const headingStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
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
  color: "#0f172a",
  fontSize: "1.05rem",
  lineHeight: 1.2,
  overflowWrap: "anywhere",
};

const copyStyle: CSSProperties = {
  margin: 0,
  color: "#475569",
  fontSize: "0.82rem",
  lineHeight: 1.36,
  overflowWrap: "anywhere",
};

const bodyStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: "100%",
  overflowX: "auto",
  border: "1px solid rgba(30, 41, 59, 0.1)",
  borderRadius: "8px",
  WebkitOverflowScrolling: "touch",
};

export function LegacyCockpitCompatibilityPanel({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby="legacy-cockpit-compatibility-title"
      data-workplane-panel-id="legacy_cockpit_compatibility"
      data-workplane-node-id="legacy_cockpit_compatibility"
      data-workplane-node-kind="compatibility_panel"
      data-workplane-node-status="compatibility_only"
      style={panelStyle}
    >
      <div style={headingStyle}>
        <p style={kickerStyle}>Existing Cockpit compatibility content</p>
        <h2 id="legacy-cockpit-compatibility-title" style={titleStyle}>
          Legacy Cockpit remains reachable
        </h2>
        <p style={copyStyle}>
          Phase 5A reframes `/workbench` as Agent Workplane without deleting the
          existing Cockpit operator/read surfaces. Phase 5B extracts focused
          read-only panels, Phase 5C adds preview skeletons, and Phase 5D keeps
          legacy Cockpit compatibility content contained and reachable.
        </p>
      </div>
      <div style={bodyStyle}>{children}</div>
    </section>
  );
}
