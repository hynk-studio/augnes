import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type {
  WorkbenchDogfoodLoopSpineOverview,
  WorkbenchDogfoodLoopSpineStep,
} from "@/types/workbench-dogfood-loop-spine-overview";
import type { CSSProperties } from "react";

type WorkbenchDogfoodLoopSpineOverviewPanelProps = {
  preview: WorkbenchDogfoodLoopSpineOverview;
};

const sectionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
  gap: "10px",
  minWidth: 0,
};

const stepHeaderStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
  alignItems: "baseline",
  justifyContent: "space-between",
  minWidth: 0,
  flexWrap: "wrap",
};

export function WorkbenchDogfoodLoopSpineOverviewPanel({
  preview,
}: WorkbenchDogfoodLoopSpineOverviewPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Dogfood loop spine"
      title="Workbench Dogfood Loop Spine Overview"
      ariaLabel="Workbench Dogfood Loop Spine Overview panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only overview of the current Augnes-on-Augnes continuity spine. It
        consumes already-built Workbench previews and reports missing material,
        blockers, review points, and authority boundaries without rebuilding
        upstream previews or mutating product state.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="Overview status"
          value={preview.overview_status}
        />
        <WorkplanePanelMetric
          label="recommended next operator action"
          value={preview.recommended_next_operator_action}
        />
        <WorkplanePanelMetric
          label="Top blockers"
          value={preview.top_blockers.length}
        />
        <WorkplanePanelMetric
          label="Missing evidence"
          value={preview.top_missing_evidence.length}
        />
      </WorkplanePanelMetricGrid>

      <section aria-label="Workbench dogfood loop spine steps" style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>spine steps</span>
        <ol style={{ ...workplaneListStyle, listStyle: "decimal", paddingLeft: "18px" }}>
          {preview.spine_steps.map((step) => (
            <SpineStepItem key={step.step_id} step={step} />
          ))}
        </ol>
      </section>

      <section style={sectionGridStyle}>
        <ReasonList
          title="top blockers"
          items={preview.top_blockers}
          emptyText="No severe blockers are visible in the current overview."
        />
        <ReasonList
          title="top missing evidence"
          items={preview.top_missing_evidence}
          emptyText="No missing evidence is visible in the current overview."
        />
        <ReasonList
          title="material gaps"
          items={preview.current_material_gaps}
          emptyText="No current material gaps are visible in the current overview."
        />
        <ReasonList
          title="next action rationale"
          items={preview.next_operator_action_rationale}
          emptyText="No additional rationale materialized."
        />
      </section>

      <section
        aria-label="Workbench dogfood loop spine would not"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>would not</span>
        <ul style={workplaneListStyle}>
          {preview.would_not_do.slice(0, 10).map((item) => (
            <li key={item} style={workplaneItemStyle}>
              <span style={workplaneCopyStyle}>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-label="Workbench dogfood loop spine authority boundary"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>authority boundary</span>
        <strong>Read-only derived read model</strong>
        <span style={workplaneCopyStyle}>
          read_only {String(preview.authority_boundary.read_only)};
          advisory_only {String(preview.authority_boundary.advisory_only)};
          derived_read_model{" "}
          {String(preview.authority_boundary.derived_read_model)}
        </span>
        <span style={workplaneCopyStyle}>
          can_write_db {String(preview.authority_boundary.can_write_db)};
          can_create_schema{" "}
          {String(preview.authority_boundary.can_create_schema)};
          can_create_ingest_record{" "}
          {String(preview.authority_boundary.can_create_ingest_record)}
        </span>
        <span style={workplaneCopyStyle}>
          can_write_memory {String(preview.authority_boundary.can_write_memory)};
          can_mutate_current_working_perspective{" "}
          {String(
            preview.authority_boundary
              .can_mutate_current_working_perspective,
          )}
        </span>
        <span style={workplaneCopyStyle}>
          can_apply_handoff_context{" "}
          {String(preview.authority_boundary.can_apply_handoff_context)};
          can_write_selected_refs_to_live_handoff{" "}
          {String(
            preview.authority_boundary.can_write_selected_refs_to_live_handoff,
          )}
          ; can_send_handoff{" "}
          {String(preview.authority_boundary.can_send_handoff)}
        </span>
        <span style={workplaneCopyStyle}>
          can_call_provider_openai{" "}
          {String(preview.authority_boundary.can_call_provider_openai)};
          can_call_github {String(preview.authority_boundary.can_call_github)};
          can_execute_codex {String(preview.authority_boundary.can_execute_codex)}
        </span>
      </section>
    </WorkplanePanelShell>
  );
}

function SpineStepItem({ step }: { step: WorkbenchDogfoodLoopSpineStep }) {
  return (
    <li style={workplaneItemStyle}>
      <div style={stepHeaderStyle}>
        <strong>{step.label}</strong>
        <span style={workplaneBadgeStyle}>{step.status}</span>
      </div>
      <span style={workplaneCopyStyle}>{step.summary}</span>
      <span style={workplaneCopyStyle}>
        material {step.material_count}; blockers {step.blocker_count}; missing
        evidence {step.missing_evidence_count}; evidence_present{" "}
        {String(step.evidence_present)}
      </span>
      <span style={workplaneCopyStyle}>
        next {step.recommended_next_action}; read_only {String(step.read_only)}
      </span>
    </li>
  );
}

function ReasonList({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: string[];
  emptyText: string;
}) {
  const visibleItems = items.slice(0, 6);
  return (
    <section aria-label={`Workbench dogfood loop spine ${title}`} style={workplaneItemStyle}>
      <span style={workplaneBadgeStyle}>{title}</span>
      <ul style={workplaneListStyle}>
        {visibleItems.map((item) => (
          <li key={item} style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>{item}</span>
          </li>
        ))}
        {visibleItems.length === 0 ? (
          <li style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>{emptyText}</span>
          </li>
        ) : null}
      </ul>
    </section>
  );
}
