import type { CSSProperties } from "react";

const cardStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  minWidth: 0,
  boxSizing: "border-box",
  padding: "14px",
  border: "1px solid rgba(124, 45, 18, 0.18)",
  borderRadius: "8px",
  background: "#fff7ed",
  color: "#431407",
  overflow: "hidden",
};

const kickerStyle: CSSProperties = {
  margin: 0,
  color: "#9a3412",
  fontSize: "0.72rem",
  fontWeight: 820,
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  margin: 0,
  color: "#431407",
  fontSize: "1rem",
  lineHeight: 1.2,
  overflowWrap: "anywhere",
};

const copyStyle: CSSProperties = {
  margin: 0,
  color: "#7c2d12",
  fontSize: "0.8rem",
  lineHeight: 1.38,
  overflowWrap: "anywhere",
};

const listStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  minWidth: 0,
  margin: 0,
  paddingLeft: "18px",
};

export function WorkplaneBoundaryCard({ notes }: { notes: string[] }) {
  return (
    <aside aria-labelledby="workplane-boundary-title" style={cardStyle}>
      <p style={kickerStyle}>Authority boundary</p>
      <h2 id="workplane-boundary-title" style={titleStyle}>
        Read-only UI; No hidden execution authority
      </h2>
      <p style={copyStyle}>
        This Agent Workplane surfaces backend/operator context only. It does not
        execute agents, apply deltas, approve or reject deltas, send handoffs,
        write DB rows or schema, record proof, create evidence, call providers,
        call GitHub, launch Codex, publish, merge, retry, replay, deploy, mutate
        memory, schedule autonomy runners, or mutate state.
      </p>
      <ul style={listStyle}>
        {notes.map((note) => (
          <li key={note} style={copyStyle}>
            {note}
          </li>
        ))}
      </ul>
    </aside>
  );
}
