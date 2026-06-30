import type { CSSProperties } from "react";

const headerStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
  gap: "16px",
  alignItems: "end",
  padding: "18px",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  borderRadius: "8px",
  background: "rgba(15, 23, 42, 0.94)",
  color: "#f8fafc",
};

const kickerStyle: CSSProperties = {
  margin: 0,
  color: "#93c5fd",
  fontSize: "0.74rem",
  fontWeight: 820,
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  margin: "4px 0 0",
  fontSize: "3.4rem",
  lineHeight: 0.94,
  letterSpacing: 0,
};

const copyStyle: CSSProperties = {
  maxWidth: "820px",
  margin: "10px 0 0",
  color: "#cbd5e1",
  fontSize: "1rem",
  lineHeight: 1.42,
};

const navStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  justifyContent: "flex-end",
};

const linkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: "34px",
  padding: "7px 11px",
  border: "1px solid rgba(226, 232, 240, 0.24)",
  borderRadius: "8px",
  background: "rgba(15, 23, 42, 0.72)",
  color: "#e0f2fe",
  fontSize: "0.82rem",
  fontWeight: 800,
  textDecoration: "none",
};

export function WorkplaneHeader() {
  return (
    <header style={headerStyle}>
      <div>
        <p style={kickerStyle}>Backend work surface</p>
        <h1 style={titleStyle}>Agent Workplane</h1>
        <p style={copyStyle}>
          Agent Workplane is the backend work surface for agent/operator traces,
          projection candidates, Handoff context, Evidence pointers, Trace
          context, validation context, Current Working Perspective context, and
          Augnes Delta Projection context. It is a read-only operator view in
          this phase: No hidden execution authority, no agent launch, no delta
          apply, and no state mutation.
        </p>
      </div>
      <nav aria-label="Agent Workplane navigation" style={navStyle}>
        <a href="/" style={linkStyle}>
          Home
        </a>
        <a href="/perspective" style={linkStyle}>
          Perspective
        </a>
      </nav>
    </header>
  );
}
