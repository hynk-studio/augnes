import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { CSSProperties, ReactNode } from "react";

export {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
};

const valueStyle: CSSProperties = {
  color: "#0f172a",
  fontWeight: 740,
  overflowWrap: "anywhere",
};

export function AutonomySection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={`Autonomy ${title}`} style={workplaneItemStyle}>
      <span style={workplaneBadgeStyle}>{title}</span>
      <p style={workplaneCopyStyle}>{description}</p>
      {children}
    </section>
  );
}

export function AutonomyList({
  items,
  emptyText = "No preview items materialized.",
  itemLabel = "preview item",
  limit = 8,
}: {
  items: string[];
  emptyText?: string;
  itemLabel?: string;
  limit?: number;
}) {
  return (
    <ul style={workplaneListStyle}>
      {items.slice(0, limit).map((item) => (
        <li key={item} style={workplaneItemStyle}>
          <strong>{itemLabel}</strong>
          <span style={workplaneCopyStyle}>{item}</span>
        </li>
      ))}
      {items.length === 0 ? (
        <li style={workplaneItemStyle}>
          <span style={workplaneCopyStyle}>{emptyText}</span>
        </li>
      ) : null}
    </ul>
  );
}

export function AutonomyKeyValues({
  rows,
}: {
  rows: Array<[string, string | number | boolean | null]>;
}) {
  return (
    <ul style={workplaneListStyle}>
      {rows.map(([label, value]) => (
        <li key={label} style={workplaneItemStyle}>
          <strong>{label}</strong>
          <span style={valueStyle}>{stringifyValue(value)}</span>
        </li>
      ))}
    </ul>
  );
}

export function stringifyValue(value: string | number | boolean | null) {
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value === null) return "none";
  return String(value);
}
