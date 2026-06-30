import { AugnesCockpit } from "@/components/augnes-cockpit";
import { LegacyCockpitCompatibilityPanel } from "@/components/workplane/legacy-cockpit-compatibility-panel";
import { WorkplaneBoundaryCard } from "@/components/workplane/workplane-boundary-card";
import { WorkplaneHeader } from "@/components/workplane/workplane-header";
import { WorkplaneOverview } from "@/components/workplane/workplane-overview";
import { readWorkplaneContext } from "@/lib/workplane/read-workplane-context";
import type { CSSProperties } from "react";

const surfaceStyle: CSSProperties = {
  minHeight: "100vh",
  padding: "28px",
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

const layoutStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
  gap: "14px",
  alignItems: "start",
};

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

const copyStyle: CSSProperties = {
  margin: 0,
  color: "#475569",
  fontSize: "0.8rem",
  lineHeight: 1.36,
  overflowWrap: "anywhere",
};

const listStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  margin: 0,
  padding: 0,
  listStyle: "none",
};

const itemStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  minWidth: 0,
  padding: "9px",
  border: "1px solid rgba(30, 41, 59, 0.1)",
  borderRadius: "8px",
  background: "#f8fafc",
};

const badgeStyle: CSSProperties = {
  display: "inline-flex",
  width: "fit-content",
  padding: "3px 7px",
  borderRadius: "8px",
  background: "#e0f2fe",
  color: "#075985",
  fontSize: "0.68rem",
  fontWeight: 820,
  textTransform: "uppercase",
};

export async function AgentWorkplane() {
  const context = await readWorkplaneContext();
  const activeGoals = context.current_perspective_read.data.active_goals;
  const activeWorkIds = context.overview.current_perspective.active_work_ids;
  const latestDeltaTitles = context.overview.delta_projection.latest_delta_titles;
  const workplaneNotes = context.workplane_notes;

  return (
    <div aria-label="Agent Workplane" style={surfaceStyle}>
      <div style={shellStyle}>
        <WorkplaneHeader />
        <WorkplaneOverview context={context} />

        <section aria-label="Agent Workplane layout" style={layoutStyle}>
          <aside aria-labelledby="workplane-queue-title" style={panelStyle}>
            <p style={kickerStyle}>Work queue / context scope</p>
            <h2 id="workplane-queue-title" style={titleStyle}>
              Active work and review scope
            </h2>
            <p style={copyStyle}>
              {activeGoals.length > 0
                ? `${activeGoals.length} active goals are visible from the Current Working Perspective read context.`
                : "No active work goals are materialized yet."}
            </p>
            <ul style={listStyle}>
              {activeGoals.slice(0, 4).map((goal) => (
                <li key={goal.goal_id} style={itemStyle}>
                  <span style={badgeStyle}>{goal.priority}</span>
                  <strong>{goal.title}</strong>
                  <span style={copyStyle}>{goal.next_action}</span>
                </li>
              ))}
            </ul>
            <p style={copyStyle}>
              Active work ids: {activeWorkIds.length > 0 ? activeWorkIds.join(", ") : "none materialized"}
            </p>
          </aside>

          <section
            aria-label="Agent Workplane active compatibility content"
            style={{ minWidth: 0 }}
          >
            <LegacyCockpitCompatibilityPanel>
              <AugnesCockpit />
            </LegacyCockpitCompatibilityPanel>
          </section>

          <aside aria-label="Agent Workplane inspector" style={{ display: "grid", gap: "14px", minWidth: 0 }}>
            <WorkplaneBoundaryCard notes={context.authority_boundary.notes} />
            <section aria-labelledby="workplane-inspector-title" style={panelStyle}>
              <p style={kickerStyle}>Inspector / handoff / evidence</p>
              <h2 id="workplane-inspector-title" style={titleStyle}>
                Pointer-only backend context
              </h2>
              <p style={copyStyle}>
                Handoff refs: {context.overview.delta_projection.handoff_ref_count}. Codex result refs: {context.overview.delta_projection.codex_result_ref_count}. Evidence pointers: {context.overview.delta_projection.evidence_ref_count}.
                {context.overview.delta_projection.handoff_ref_count === 0
                  ? " No handoff refs materialized yet."
                  : ""}
              </p>
              <p style={copyStyle}>
                Projection candidates and Delta Batch review remain read-only in Phase 5A. No approve, apply, send, launch, or persistence controls are added here.
              </p>
              <p style={copyStyle}>
                Run postmortem source is not materialized yet.
              </p>
              <ul style={listStyle}>
                {latestDeltaTitles.length > 0 ? (
                  latestDeltaTitles.map((title) => (
                    <li key={title} style={itemStyle}>
                      <span style={copyStyle}>{title}</span>
                    </li>
                  ))
                ) : (
                  <li style={itemStyle}>
                    <span style={copyStyle}>No projected deltas materialized yet.</span>
                  </li>
                )}
              </ul>
            </section>
            <section aria-labelledby="workplane-notes-title" style={panelStyle}>
              <p style={kickerStyle}>Boundary notes</p>
              <h2 id="workplane-notes-title" style={titleStyle}>
                Surface split for Phase 6
              </h2>
              <ul style={listStyle}>
                {workplaneNotes.map((note) => (
                  <li key={note} style={itemStyle}>
                    <span style={copyStyle}>{note}</span>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </section>
      </div>
    </div>
  );
}
