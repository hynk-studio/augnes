import type { CSSProperties } from "react";

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

const listStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  margin: 0,
  paddingInlineStart: "18px",
  color: "#334155",
  fontSize: "0.82rem",
  lineHeight: 1.38,
};

const linkStyle: CSSProperties = {
  width: "fit-content",
  color: "#0f766e",
  fontSize: "0.84rem",
  fontWeight: 820,
  textDecoration: "underline",
  textUnderlineOffset: "3px",
};

const statusStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
  padding: "12px",
  border: "1px solid rgba(15, 118, 110, 0.18)",
  borderRadius: "8px",
  background: "rgba(240, 253, 250, 0.72)",
};

export function LegacyCockpitCompatibilityPanel() {
  return (
    <section
      aria-labelledby="legacy-cockpit-compatibility-title"
      data-workplane-panel-id="legacy_cockpit_compatibility"
      data-workplane-node-id="legacy_cockpit_compatibility"
      data-workplane-node-kind="compatibility_panel"
      data-workplane-node-status="compatibility_only"
      data-workplane-legacy-cockpit-shrink="workbench_full_mount_removed"
      data-workplane-legacy-cockpit-route="/cockpit"
      style={panelStyle}
    >
      <div style={headingStyle}>
        <p style={kickerStyle}>Legacy Cockpit route split</p>
        <h2 id="legacy-cockpit-compatibility-title" style={titleStyle}>
          Compatibility pointer
        </h2>
        <p style={copyStyle}>
          Legacy Cockpit full mount was removed from /workbench. Full Legacy
          Cockpit remains reachable at /cockpit while Native Agent Workplane
          panels own the primary operational surface.
        </p>
      </div>
      <div style={statusStyle}>
        <ul style={listStyle}>
          <li>
            Retained local-write/manual compatibility controls remain available
            only through /cockpit until a separate authority contract exists.
          </li>
          <li>
            No provider/OpenAI/GitHub/Codex/runner execution authority is added.
          </li>
        </ul>
        <a href="/cockpit" style={linkStyle}>
          Open retained Legacy Cockpit route
        </a>
      </div>
    </section>
  );
}
