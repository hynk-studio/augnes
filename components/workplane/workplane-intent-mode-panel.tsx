import type { ProjectedWorkplaneViewModel } from "@/lib/workplane/apply-workplane-view-projection";
import type { WorkplaneIntentProjection } from "@/types/workplane-intent-projection";
import type { CSSProperties, ReactNode } from "react";

type WorkplaneIntentModePanelProps = {
  projection: WorkplaneIntentProjection;
  projectedView?: ProjectedWorkplaneViewModel;
};

const panelStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  minWidth: 0,
  padding: "14px",
  border: "1px solid rgba(15, 23, 42, 0.14)",
  borderRadius: "8px",
  background: "rgba(255, 255, 255, 0.94)",
  boxShadow: "0 14px 30px rgba(15, 23, 42, 0.07)",
  overflow: "hidden",
};

const headerStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
  minWidth: 0,
};

const kickerStyle: CSSProperties = {
  margin: 0,
  color: "#64748b",
  fontSize: "0.68rem",
  fontWeight: 840,
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  margin: 0,
  color: "#0f172a",
  fontSize: "1rem",
  lineHeight: 1.2,
};

const copyStyle: CSSProperties = {
  margin: 0,
  color: "#475569",
  fontSize: "0.8rem",
  lineHeight: 1.42,
  overflowWrap: "anywhere",
};

const sectionStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "#0f172a",
  fontSize: "0.86rem",
  lineHeight: 1.25,
};

const listStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
  margin: 0,
  padding: 0,
  listStyle: "none",
};

const itemStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
  minWidth: 0,
  padding: "9px",
  border: "1px solid rgba(15, 23, 42, 0.1)",
  borderRadius: "8px",
  background: "#f8fafc",
  overflowWrap: "anywhere",
};

const itemTitleStyle: CSSProperties = {
  margin: 0,
  color: "#0f172a",
  fontSize: "0.78rem",
  lineHeight: 1.3,
  fontWeight: 760,
};

const metaStyle: CSSProperties = {
  margin: 0,
  color: "#64748b",
  fontSize: "0.68rem",
  lineHeight: 1.35,
  overflowWrap: "anywhere",
};

const pillListStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  minWidth: 0,
  margin: 0,
  padding: 0,
  listStyle: "none",
};

const pillStyle: CSSProperties = {
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "8px",
  background: "#ecfeff",
  color: "#155e75",
  fontSize: "0.68rem",
  lineHeight: 1.25,
  overflowWrap: "anywhere",
};

export function WorkplaneIntentModePanel({
  projection,
  projectedView,
}: WorkplaneIntentModePanelProps) {
  return (
    <aside
      aria-label="Workplane Intent Mode Projection"
      data-workplane-intent-mode-panel="v0.1"
      data-workplane-intent-class={projection.intent_class}
      data-workplane-intent-projection-status={projection.projection_status}
      style={panelStyle}
    >
      <header style={headerStyle}>
        <p style={kickerStyle}>Workplane intent mode</p>
        <h2 style={titleStyle}>Reversible View Projection</h2>
        <p style={copyStyle}>
          Reversible and dismissible view and draft projection only. This panel
          does not persist a mode, execute work, or create local-write controls.
        </p>
      </header>

      <ProjectionSection title="Projection status">
        <ul style={listStyle}>
          <li style={itemStyle}>
            <p style={itemTitleStyle}>{projection.original_user_intent}</p>
            <p style={copyStyle}>{projection.interpreted_intent.summary}</p>
            <p style={metaStyle}>
              class: {projection.intent_class}; level:{" "}
              {projection.projection_level}; status:{" "}
              {projection.projection_status}
            </p>
          </li>
        </ul>
      </ProjectionSection>

      <ProjectionSection title="Prioritized panels">
        <PillList values={projection.prioritized_panels.slice(0, 10)} />
      </ProjectionSection>

      <ProjectionSection title="Suggested panel modes">
        <ul style={listStyle}>
          {projection.suggested_panel_modes.slice(0, 6).map((mode) => (
            <li key={`${mode.panel_id}:${mode.mode}`} style={itemStyle}>
              <p style={itemTitleStyle}>
                {mode.panel_id}: {mode.mode}
              </p>
              <p style={copyStyle}>{mode.reason}</p>
            </li>
          ))}
        </ul>
      </ProjectionSection>

      <ProjectionSection title="Focus refs">
        <PillList values={projection.focus_refs.slice(0, 10)} />
      </ProjectionSection>

      <ProjectionSection title="Suppressed refs">
        <PillList values={projection.suppressed_refs.slice(0, 10)} />
      </ProjectionSection>

      <ProjectionSection title="Display filters">
        <ul style={listStyle}>
          {projection.display_filters.map((filter) => (
            <li key={filter.filter_id} style={itemStyle}>
              <p style={itemTitleStyle}>{filter.label}</p>
              <p style={copyStyle}>{filter.reason}</p>
              <p style={metaStyle}>
                pure_view_only: {String(filter.pure_view_only)}
              </p>
            </li>
          ))}
        </ul>
      </ProjectionSection>

      {projectedView ? (
        <ProjectionSection title="Projected view model">
          <p style={metaStyle}>
            highlighted: {projectedView.highlighted_panel_ids.join(", ") || "none"}
          </p>
          <p style={metaStyle}>
            hidden: {projectedView.hidden_panel_ids.join(", ") || "none"}
          </p>
        </ProjectionSection>
      ) : null}

      <ProjectionSection title="Reversibility">
        <p style={copyStyle}>{projection.reversibility.reset_behavior}</p>
        <p style={metaStyle}>
          reversible: {String(projection.reversibility.reversible)};
          durable_state_changed:{" "}
          {String(projection.reversibility.durable_state_changed)};
          dismissible: {String(projection.reversibility.dismissible)}
        </p>
      </ProjectionSection>

      <ProjectionSection title="Needs user judgment">
        <ul style={listStyle}>
          {projection.needs_user_judgment.length > 0 ? (
            projection.needs_user_judgment.slice(0, 4).map((item) => (
              <li key={item.judgment_id} style={itemStyle}>
                <p style={itemTitleStyle}>{item.question}</p>
                <p style={copyStyle}>{item.why_it_matters}</p>
                <p style={metaStyle}>urgency: {item.urgency}</p>
              </li>
            ))
          ) : (
            <li style={itemStyle}>
              <p style={copyStyle}>
                No unresolved user judgment is required for this reversible view
                projection.
              </p>
            </li>
          )}
        </ul>
      </ProjectionSection>

      <ProjectionSection title="Authority boundary">
        <p style={copyStyle}>
          View and draft candidate authority only. No executable projection, no
          persistent Workplane mode, no runner execution, no recovery write, no
          scheduled behavior, no provider/OpenAI/GitHub/Codex execution, no DB
          write, no proof/evidence write, no durable memory apply, no
          Perspective apply, and no delta auto-apply.
        </p>
      </ProjectionSection>
    </aside>
  );
}

function ProjectionSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section style={sectionStyle}>
      <h3 style={sectionTitleStyle}>{title}</h3>
      {children}
    </section>
  );
}

function PillList({ values }: { values: readonly string[] }) {
  return (
    <ul style={pillListStyle}>
      {values.length > 0 ? (
        values.map((value) => (
          <li key={value} style={pillStyle}>
            {value}
          </li>
        ))
      ) : (
        <li style={pillStyle}>none</li>
      )}
    </ul>
  );
}
