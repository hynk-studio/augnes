import { AugnesCockpit } from "@/components/augnes-cockpit";
import type { CSSProperties } from "react";

export const metadata = {
  title: "Augnes Legacy Cockpit",
  description:
    "Retained Legacy Cockpit compatibility route for local/manual controls while Agent Workplane remains the primary surface.",
};

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  boxSizing: "border-box",
  padding: "clamp(12px, 4vw, 28px)",
  background:
    "linear-gradient(180deg, #eaf0f8 0%, #f8fafc 42%, #eef2f7 100%)",
  color: "#0f172a",
};

const shellStyle: CSSProperties = {
  display: "grid",
  gap: "14px",
  width: "min(1560px, 100%)",
  margin: "0 auto",
};

const headerStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  padding: "14px",
  border: "1px solid rgba(30, 41, 59, 0.12)",
  borderRadius: "8px",
  background: "rgba(255, 255, 255, 0.92)",
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
  fontSize: "1.12rem",
  lineHeight: 1.2,
};

const copyStyle: CSSProperties = {
  margin: 0,
  color: "#475569",
  fontSize: "0.84rem",
  lineHeight: 1.42,
  overflowWrap: "anywhere",
};

export default function CockpitPage() {
  return (
    <main aria-label="Legacy Cockpit compatibility route" style={pageStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <p style={kickerStyle}>Retained compatibility route</p>
          <h1 style={titleStyle}>Legacy Cockpit</h1>
          <p style={copyStyle}>
            This is the retained Legacy Cockpit compatibility route. Agent
            Workplane no longer embeds the full Cockpit in /workbench; this
            route remains available for retained compatibility/local-write/manual
            controls until native authority contracts exist.
          </p>
        </header>
        <AugnesCockpit />
      </div>
    </main>
  );
}
