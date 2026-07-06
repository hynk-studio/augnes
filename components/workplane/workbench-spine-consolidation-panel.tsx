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
  WorkbenchSpineConsolidation,
  WorkbenchSpineLineageEdge,
  WorkbenchSpinePhaseGroup,
} from "@/types/workbench-spine-consolidation";
import type { CSSProperties } from "react";

type WorkbenchSpineConsolidationPanelProps = {
  dashboard: WorkbenchSpineConsolidation;
};

const sectionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
  gap: "10px",
  minWidth: 0,
};

const stageHeaderStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
  alignItems: "baseline",
  justifyContent: "space-between",
  flexWrap: "wrap",
  minWidth: 0,
};

export function WorkbenchSpineConsolidationPanel({
  dashboard,
}: WorkbenchSpineConsolidationPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Operator dashboard"
      title="Workbench Spine Consolidation"
      ariaLabel="Workbench Spine Consolidation Operator Dashboard panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only operator dashboard for the local CWP to handoff context to
        packet artifact to send contract to local fulfillment spine. It
        compresses existing records, blockers, lineage, and next action without
        adding external delivery or mutation authority.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="Dashboard status"
          value={dashboard.dashboard_status}
        />
        <WorkplanePanelMetric
          label="Next operator action"
          value={dashboard.recommended_next_operator_action.action}
        />
        <WorkplanePanelMetric
          label="External delivery"
          value={dashboard.external_delivery.status}
        />
        <WorkplanePanelMetric
          label="Missing links"
          value={dashboard.lineage_map.missing_links.length}
        />
      </WorkplanePanelMetricGrid>

      <section style={sectionGridStyle}>
        <ReasonList
          title="blockers"
          items={dashboard.blocker_summary.blockers}
          emptyText="No blockers are visible in the consolidated local spine."
        />
        <ReasonList
          title="missing prerequisites"
          items={dashboard.blocker_summary.missing_prerequisites}
          emptyText="No missing prerequisites are visible in the consolidated local spine."
        />
        <ReasonList
          title="authority warnings"
          items={dashboard.blocker_summary.authority_warnings}
          emptyText="No unsafe authority boundary claims are visible."
        />
        <ReasonList
          title="next action rationale"
          items={dashboard.recommended_next_operator_action.rationale}
          emptyText="No additional next-action rationale materialized."
        />
      </section>

      <section aria-label="Workbench spine phase groups" style={sectionGridStyle}>
        {dashboard.phase_groups.map((phase) => (
          <PhaseGroup key={phase.phase_id} phase={phase} />
        ))}
      </section>

      <section aria-label="Workbench spine lineage mini-map" style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>lineage mini-map</span>
        <ul style={workplaneListStyle}>
          {dashboard.lineage_map.edges.map((edge) => (
            <LineageEdgeItem key={`${edge.from}:${edge.to}`} edge={edge} />
          ))}
        </ul>
      </section>

      <section aria-label="Workbench spine external delivery boundary" style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>external delivery</span>
        <strong>{dashboard.external_delivery.status}</strong>
        <span style={workplaneCopyStyle}>
          local_fulfillment_is_external_delivery{" "}
          {String(dashboard.external_delivery.local_fulfillment_is_external_delivery)};
          provider_contract_present{" "}
          {String(dashboard.external_delivery.provider_contract_present)};
          provider_called {String(dashboard.external_delivery.provider_called)};
          external_message_sent{" "}
          {String(dashboard.external_delivery.external_message_sent)}
        </span>
        <ul style={workplaneListStyle}>
          {dashboard.external_delivery.notes.map((note) => (
            <li key={note} style={workplaneItemStyle}>
              <span style={workplaneCopyStyle}>{note}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Workbench spine authority boundary" style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>authority boundary</span>
        <span style={workplaneCopyStyle}>
          read_only {String(dashboard.authority_boundary.read_only)};
          advisory_only {String(dashboard.authority_boundary.advisory_only)};
          derived_read_model{" "}
          {String(dashboard.authority_boundary.derived_read_model)}
        </span>
        <span style={workplaneCopyStyle}>
          can_write_db {String(dashboard.authority_boundary.can_write_db)};
          can_create_schema{" "}
          {String(dashboard.authority_boundary.can_create_schema)};
          can_send_handoff{" "}
          {String(dashboard.authority_boundary.can_send_handoff)}
        </span>
        <span style={workplaneCopyStyle}>
          can_call_send_provider{" "}
          {String(dashboard.authority_boundary.can_call_send_provider)};
          can_call_email {String(dashboard.authority_boundary.can_call_email)};
          can_call_slack {String(dashboard.authority_boundary.can_call_slack)};
          can_call_webhook{" "}
          {String(dashboard.authority_boundary.can_call_webhook)}
        </span>
        <span style={workplaneCopyStyle}>
          can_write_clipboard{" "}
          {String(dashboard.authority_boundary.can_write_clipboard)};
          can_download_file{" "}
          {String(dashboard.authority_boundary.can_download_file)};
          can_write_memory {String(dashboard.authority_boundary.can_write_memory)}
        </span>
      </section>
    </WorkplanePanelShell>
  );
}

function PhaseGroup({ phase }: { phase: WorkbenchSpinePhaseGroup }) {
  return (
    <section style={workplaneItemStyle}>
      <div style={stageHeaderStyle}>
        <strong>{phase.label}</strong>
        <span style={workplaneBadgeStyle}>{phase.status}</span>
      </div>
      <span style={workplaneCopyStyle}>{phase.summary}</span>
      <ul style={workplaneListStyle}>
        {phase.stages.map((stage) => (
          <li key={stage.stage_id} style={workplaneItemStyle}>
            <div style={stageHeaderStyle}>
              <strong>{stage.label}</strong>
              <span style={workplaneBadgeStyle}>{stage.status}</span>
            </div>
            <span style={workplaneCopyStyle}>{stage.summary}</span>
            <span style={workplaneCopyStyle}>
              ref {stage.primary_ref ?? "none"}; source_status{" "}
              {stage.source_status ?? "none"}; blockers{" "}
              {stage.blocker_reasons.length}; missing{" "}
              {stage.missing_prerequisites.length}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function LineageEdgeItem({ edge }: { edge: WorkbenchSpineLineageEdge }) {
  return (
    <li style={workplaneItemStyle}>
      <div style={stageHeaderStyle}>
        <strong>
          {edge.from} to {edge.to}
        </strong>
        <span style={workplaneBadgeStyle}>{edge.linked ? "linked" : "gap"}</span>
      </div>
      <span style={workplaneCopyStyle}>{edge.relationship}</span>
      <span style={workplaneCopyStyle}>
        expected {edge.expected_ref ?? "none"}; observed{" "}
        {edge.observed_ref ?? "none"}; problem {edge.problem ?? "none"}
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
    <section aria-label={`Workbench spine ${title}`} style={workplaneItemStyle}>
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
