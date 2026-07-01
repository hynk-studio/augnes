import type { CSSProperties, ReactNode } from "react";

type GuideBriefSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  empty?: boolean;
  emptyText?: string;
};

const sectionStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
  paddingTop: "10px",
  borderTop: "1px solid rgba(15, 23, 42, 0.1)",
};

const headingStyle: CSSProperties = {
  margin: 0,
  color: "#0f172a",
  fontSize: "0.9rem",
  lineHeight: 1.25,
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  color: "#475569",
  fontSize: "0.78rem",
  lineHeight: 1.4,
  overflowWrap: "anywhere",
};

const emptyStyle: CSSProperties = {
  margin: 0,
  color: "#64748b",
  fontSize: "0.78rem",
  lineHeight: 1.4,
};

export function GuideBriefSection({
  title,
  description,
  children,
  empty = false,
  emptyText = "No guide items materialized.",
}: GuideBriefSectionProps) {
  return (
    <section aria-labelledby={sectionId(title)} style={sectionStyle}>
      <div>
        <h3 id={sectionId(title)} style={headingStyle}>
          {title}
        </h3>
        {description ? <p style={descriptionStyle}>{description}</p> : null}
      </div>
      {empty ? <p style={emptyStyle}>{emptyText}</p> : children}
    </section>
  );
}

function sectionId(title: string) {
  return `guide-brief-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}
