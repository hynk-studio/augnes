import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { WorkplaneContinuitySpineSummary } from "@/types/workplane-continuity-spine-summary";
import type { CSSProperties } from "react";

type WorkplaneContinuitySpineSummaryPanelProps = {
  summary: WorkplaneContinuitySpineSummary;
};

const sectionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))",
  gap: "10px",
  minWidth: 0,
};

const refLineStyle: CSSProperties = {
  ...workplaneCopyStyle,
  overflowWrap: "anywhere",
};

export function WorkplaneContinuitySpineSummaryPanel({
  summary,
}: WorkplaneContinuitySpineSummaryPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Continuity spine"
      title="Workplane Continuity Spine Summary"
      ariaLabel="Workplane Continuity Spine Summary panel"
    >
      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Spine status" value={summary.spine_status} />
        <WorkplanePanelMetric
          label="Latest stage"
          value={summary.latest_active_stage ?? "none"}
        />
        <WorkplanePanelMetric
          label="Freshness"
          value={summary.source_freshness_status}
        />
        <WorkplanePanelMetric
          label="Rollback"
          value={summary.rollback_supersede_status}
        />
        <WorkplanePanelMetric
          label="Selected refs"
          value={summary.source_coverage_summary.selected_record_count}
        />
        <WorkplanePanelMetric
          label="Missing refs"
          value={summary.source_coverage_summary.missing_source_count}
        />
      </WorkplanePanelMetricGrid>

      <section
        aria-label="Workplane continuity spine latest active source"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>latest active source</span>
        <span style={refLineStyle}>
          ref {summary.latest_active_receipt_or_record_ref ?? "none"}
        </span>
        <span style={refLineStyle}>
          fingerprint {summary.latest_active_fingerprint ?? "none"}
        </span>
        <span style={workplaneCopyStyle}>
          sources {summary.source_coverage_summary.primary_source_count};
          stale {summary.source_coverage_summary.stale_source_count};
          fallback {summary.source_coverage_summary.fallback_source_count};
          blockers {summary.source_coverage_summary.blocker_count};
          warnings {summary.source_coverage_summary.warning_count}
        </span>
      </section>

      <section style={sectionGridStyle}>
        <ReasonList
          title="next allowed"
          items={summary.next_allowed_actions}
          emptyText="No review actions are available."
        />
        <ReasonList
          title="blocked actions"
          items={summary.blocked_actions}
          emptyText="No blocked actions were listed."
        />
        <ReasonList
          title="blockers"
          items={summary.blocker_reasons}
          emptyText="No compact spine blockers are visible."
        />
        <ReasonList
          title="warnings"
          items={summary.warning_reasons}
          emptyText="No compact spine warnings are visible."
        />
      </section>

      <section style={sectionGridStyle}>
        <ReasonList
          title="selected refs"
          items={summary.selected_record_refs}
          emptyText="No selected record refs are visible."
        />
        <ReasonList
          title="missing refs"
          items={summary.missing_source_refs}
          emptyText="No source refs are missing."
        />
        <ReasonList
          title="stale refs"
          items={summary.stale_source_refs}
          emptyText="No stale refs are visible."
        />
        <ReasonList
          title="Codex hints"
          items={summary.codex_handoff_hints}
          emptyText="No compact Codex handoff hints are visible."
        />
      </section>

      <section
        aria-label="Workplane continuity spine authority boundary"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>authority boundary</span>
        <span style={workplaneCopyStyle}>
          read_only {String(summary.authority_boundary.read_only)};
          advisory_only {String(summary.authority_boundary.advisory_only)};
          compact_summary_only{" "}
          {String(summary.authority_boundary.compact_summary_only)}
        </span>
        <span style={workplaneCopyStyle}>
          can_write_db {String(summary.authority_boundary.can_write_db)};
          can_create_route{" "}
          {String(summary.authority_boundary.can_create_route)};
          can_create_schema{" "}
          {String(summary.authority_boundary.can_create_schema)}
        </span>
        <span style={workplaneCopyStyle}>
          can_execute_delivery{" "}
          {String(summary.authority_boundary.can_execute_delivery)};
          can_call_provider{" "}
          {String(summary.authority_boundary.can_call_provider)};
          can_call_network{" "}
          {String(summary.authority_boundary.can_call_network)}
        </span>
        <span style={workplaneCopyStyle}>
          can_write_proof {String(summary.authority_boundary.can_write_proof)};
          can_write_evidence{" "}
          {String(summary.authority_boundary.can_write_evidence)};
          can_execute_codex{" "}
          {String(summary.authority_boundary.can_execute_codex)};
          can_call_github {String(summary.authority_boundary.can_call_github)}
        </span>
        <span style={workplaneCopyStyle}>
          can_write_clipboard{" "}
          {String(summary.authority_boundary.can_write_clipboard)};
          can_download_file{" "}
          {String(summary.authority_boundary.can_download_file)};
          can_render_workbench_action_button{" "}
          {String(summary.authority_boundary.can_render_workbench_action_button)}
        </span>
      </section>
    </WorkplanePanelShell>
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
    <section
      aria-label={`Workplane continuity spine ${title}`}
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>{title}</span>
      <ul style={workplaneListStyle}>
        {visibleItems.map((item) => (
          <li key={item} style={workplaneItemStyle}>
            <span style={refLineStyle}>{item}</span>
          </li>
        ))}
        {visibleItems.length === 0 ? (
          <li style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>{emptyText}</span>
          </li>
        ) : null}
        {items.length > visibleItems.length ? (
          <li style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>
              +{items.length - visibleItems.length} more
            </span>
          </li>
        ) : null}
      </ul>
    </section>
  );
}
