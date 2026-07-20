import Link from "next/link";
import type { CSSProperties } from "react";
import { createSharedInspectorHrefV01 } from "@/lib/vnext/shared-project-inspector-href";

const surfaceStyle: CSSProperties = {
  minHeight: "100vh",
  padding: "clamp(24px, 5vw, 72px)",
  background: "#f8fafc",
  color: "#0f172a",
};

const cardStyle: CSSProperties = {
  maxWidth: "760px",
  margin: "0 auto",
  display: "grid",
  gap: "20px",
  padding: "clamp(24px, 4vw, 48px)",
  border: "1px solid rgba(15, 23, 42, 0.14)",
  borderRadius: "16px",
  background: "#ffffff",
};

const linkRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "12px",
};

const linkStyle: CSSProperties = {
  color: "#0f766e",
  fontWeight: 750,
};

export function AgentWorkplane() {
  return (
    <main aria-label="Agent Workplane" style={surfaceStyle}>
      <section style={cardStyle}>
        <p style={{ margin: 0, fontWeight: 800, color: "#0f766e" }}>
          Augnes Workbench
        </p>
        <h1 style={{ margin: 0 }}>Review project-scoped native-host results</h1>
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          Start from the active Project Home. Augnes admits the exact persisted
          task context, supervises the native-host lifecycle, and returns one
          structured result automatically. The Semantic Workbench and shared
          Inspector then separate responsibility: Workbench owns explicit
          ReviewDecision and Transition actions; Inspector is exact read-only
          drill-down.
        </p>
        <div style={linkRowStyle}>
          <Link href="/" style={linkStyle}>
            Open Project Home
          </Link>
          <Link href="/workbench/semantic-review" style={linkStyle}>
            Open Semantic Workbench
          </Link>
          <Link
            href={createSharedInspectorHrefV01({
              target_kind: "project_coordination",
            })}
            style={linkStyle}
          >
            Open shared Inspector
          </Link>
        </div>
      </section>
    </main>
  );
}
