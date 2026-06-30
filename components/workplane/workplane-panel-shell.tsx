import type { CSSProperties, ReactNode } from "react";

const panelStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  minWidth: 0,
  padding: "14px",
  border: "1px solid rgba(30, 41, 59, 0.12)",
  borderRadius: "8px",
  background: "rgba(255, 255, 255, 0.92)",
  boxShadow: "0 18px 36px rgba(15, 23, 42, 0.06)",
};

const headingStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
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
  fontSize: "1.02rem",
  lineHeight: 1.2,
};

export const workplaneCopyStyle: CSSProperties = {
  margin: 0,
  color: "#475569",
  fontSize: "0.8rem",
  lineHeight: 1.36,
  overflowWrap: "anywhere",
};

const metricGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(118px, 1fr))",
  gap: "7px",
};

const metricStyle: CSSProperties = {
  display: "grid",
  gap: "2px",
  minWidth: 0,
  padding: "8px",
  border: "1px solid rgba(30, 41, 59, 0.1)",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#64748b",
  fontSize: "0.68rem",
  fontWeight: 760,
  textTransform: "uppercase",
};

const metricValueStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: "1.02rem",
  lineHeight: 1.05,
  textTransform: "none",
  overflowWrap: "anywhere",
};

export const workplaneListStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  margin: 0,
  padding: 0,
  listStyle: "none",
};

export const workplaneItemStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
  minWidth: 0,
  padding: "9px",
  border: "1px solid rgba(30, 41, 59, 0.1)",
  borderRadius: "8px",
  background: "#f8fafc",
};

export const workplaneBadgeStyle: CSSProperties = {
  display: "inline-flex",
  width: "fit-content",
  maxWidth: "100%",
  padding: "3px 7px",
  borderRadius: "8px",
  background: "#e0f2fe",
  color: "#075985",
  fontSize: "0.68rem",
  fontWeight: 820,
  textTransform: "uppercase",
  overflowWrap: "anywhere",
};

export function WorkplanePanelShell({
  kicker,
  title,
  children,
  ariaLabel,
}: {
  kicker: string;
  title: string;
  children: ReactNode;
  ariaLabel?: string;
}) {
  return (
    <section aria-label={ariaLabel ?? title} style={panelStyle}>
      <div style={headingStyle}>
        <p style={kickerStyle}>{kicker}</p>
        <h2 style={titleStyle}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

export function WorkplanePanelMetricGrid({
  children,
}: {
  children: ReactNode;
}) {
  return <div style={metricGridStyle}>{children}</div>;
}

export function WorkplanePanelMetric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <span style={metricStyle}>
      {label}
      <strong style={metricValueStyle}>{value}</strong>
    </span>
  );
}
