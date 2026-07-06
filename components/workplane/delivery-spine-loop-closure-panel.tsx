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
  DeliverySpineLineageEdge,
  DeliverySpineLoopClosureReadModel,
  DeliverySpineStageGroup,
} from "@/types/delivery-spine-loop-closure";
import type { CSSProperties } from "react";

type DeliverySpineLoopClosurePanelProps = {
  readModel: DeliverySpineLoopClosureReadModel;
};

const sectionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
  gap: "10px",
  minWidth: 0,
};

export function DeliverySpineLoopClosurePanel({
  readModel,
}: DeliverySpineLoopClosurePanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Delivery spine"
      title="Delivery Spine Loop Closure"
      ariaLabel="Delivery Spine Loop Closure panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only consolidation for local fulfillment, external delivery
        contract, provider-specific preview, provider-specific intent, and the
        future execution boundary. This panel is advisory only: no provider is
        called, no message is sent, no route or store is written, and no action
        control is rendered.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="Spine status"
          value={readModel.delivery_spine_status}
        />
        <WorkplanePanelMetric
          label="Next action"
          value={readModel.recommended_next_operator_action}
        />
        <WorkplanePanelMetric
          label="Hardening target"
          value={readModel.recommended_next_hardening_target}
        />
        <WorkplanePanelMetric
          label="Review risk"
          value={readModel.loop_closure_summary.review_burden_risk_level}
        />
      </WorkplanePanelMetricGrid>

      <section style={sectionGridStyle}>
        <ReasonList
          title="blockers"
          items={readModel.blocker_summary.blockers}
          emptyText="No delivery spine blockers are visible."
        />
        <ReasonList
          title="warnings"
          items={readModel.warning_summary.warnings}
          emptyText="No delivery spine warnings are visible."
        />
      </section>

      <section aria-label="Delivery spine stage groups" style={sectionGridStyle}>
        {readModel.stage_groups.map((group) => (
          <StageGroup key={group.group_id} group={group} />
        ))}
      </section>

      <section aria-label="Delivery spine lineage" style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>lineage</span>
        <ul style={workplaneListStyle}>
          {readModel.lineage_map.edges.map((edge) => (
            <LineageEdgeItem
              key={`${edge.from}:${edge.to}`}
              edge={edge}
            />
          ))}
        </ul>
      </section>

      <section aria-label="Delivery spine loop closure" style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>loop closure</span>
        <span style={workplaneCopyStyle}>
          status {readModel.loop_closure_summary.loop_closure_status};
          outcome_claim_status{" "}
          {readModel.loop_closure_summary.outcome_claim_status}
        </span>
        <span style={workplaneCopyStyle}>
          panels {readModel.loop_closure_summary.panel_count_considered};
          stages {readModel.loop_closure_summary.consolidated_stage_count};
          hard_blockers {readModel.loop_closure_summary.hard_blocker_count};
          warnings {readModel.loop_closure_summary.warning_count}
        </span>
        <span style={workplaneCopyStyle}>
          execution_boundary_preserved{" "}
          {String(readModel.loop_closure_summary.execution_boundary_preserved)};
          provider_network_boundary_preserved{" "}
          {String(
            readModel.loop_closure_summary.provider_network_boundary_preserved,
          )}
        </span>
      </section>

      <section
        aria-label="Delivery spine explicit non-delivery boundary"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>non-delivery boundary</span>
        <span style={workplaneCopyStyle}>
          delivery_performed{" "}
          {String(readModel.explicit_non_delivery_boundary.delivery_performed)};
          provider_specific_delivery{" "}
          {String(
            readModel.explicit_non_delivery_boundary.provider_specific_delivery,
          )}
          ; provider_called{" "}
          {String(readModel.explicit_non_delivery_boundary.provider_called)};
          external_message_sent{" "}
          {String(
            readModel.explicit_non_delivery_boundary.external_message_sent,
          )}
        </span>
        <span style={workplaneCopyStyle}>
          email_sent {String(readModel.explicit_non_delivery_boundary.email_sent)};
          slack_sent {String(readModel.explicit_non_delivery_boundary.slack_sent)};
          webhook_called{" "}
          {String(readModel.explicit_non_delivery_boundary.webhook_called)};
          network_called{" "}
          {String(readModel.explicit_non_delivery_boundary.network_called)}
        </span>
        <span style={workplaneCopyStyle}>
          local_fulfillment_is_external_delivery{" "}
          {String(
            readModel.explicit_non_delivery_boundary
              .local_fulfillment_is_external_delivery,
          )}
          ; external_contract_is_delivery{" "}
          {String(
            readModel.explicit_non_delivery_boundary.external_contract_is_delivery,
          )}
          ; provider_specific_preview_is_delivery{" "}
          {String(
            readModel.explicit_non_delivery_boundary
              .provider_specific_preview_is_delivery,
          )}
          ; provider_specific_intent_is_delivery{" "}
          {String(
            readModel.explicit_non_delivery_boundary
              .provider_specific_intent_is_delivery,
          )}
        </span>
      </section>

      <section aria-label="Delivery spine authority" style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>authority boundary</span>
        <span style={workplaneCopyStyle}>
          read_only {String(readModel.authority_boundary.read_only)};
          advisory_only {String(readModel.authority_boundary.advisory_only)};
          consolidation_only{" "}
          {String(readModel.authority_boundary.consolidation_only)}
        </span>
        <span style={workplaneCopyStyle}>
          can_write_db {String(readModel.authority_boundary.can_write_db)};
          can_create_schema{" "}
          {String(readModel.authority_boundary.can_create_schema)};
          can_send_handoff{" "}
          {String(readModel.authority_boundary.can_send_handoff)};
          can_call_send_provider{" "}
          {String(readModel.authority_boundary.can_call_send_provider)};
          can_call_network{" "}
          {String(readModel.authority_boundary.can_call_network)}
        </span>
        <span style={workplaneCopyStyle}>
          can_write_clipboard{" "}
          {String(readModel.authority_boundary.can_write_clipboard)};
          can_download_file{" "}
          {String(readModel.authority_boundary.can_download_file)};
          can_write_memory {String(readModel.authority_boundary.can_write_memory)};
          can_render_workbench_action_button{" "}
          {String(
            readModel.authority_boundary.can_render_workbench_action_button,
          )}
        </span>
      </section>
    </WorkplanePanelShell>
  );
}

function StageGroup({ group }: { group: DeliverySpineStageGroup }) {
  return (
    <section
      aria-label={`Delivery spine ${group.label}`}
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>{group.label}</span>
      <span style={workplaneCopyStyle}>
        status {group.status}; material_count {group.material_count}
      </span>
      <ul style={workplaneListStyle}>
        {group.stages.map((stage) => (
          <li key={stage.stage_id} style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>
              {stage.label}: {stage.status}; ref {stage.primary_ref ?? "none"};
              next {stage.next_expected_artifact ?? "none"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function LineageEdgeItem({ edge }: { edge: DeliverySpineLineageEdge }) {
  return (
    <li style={workplaneItemStyle}>
      <span style={workplaneCopyStyle}>
        {edge.from} to {edge.to}: {edge.status}; expected{" "}
        {edge.expected_ref ?? "none"}; observed {edge.observed_ref ?? "none"};
        blocker {String(edge.blocker)}
      </span>
      {edge.reason ? (
        <span style={workplaneCopyStyle}>reason {edge.reason}</span>
      ) : null}
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
  const visibleItems = items.slice(0, 8);
  return (
    <section
      aria-label={`Delivery spine ${title}`}
      style={workplaneItemStyle}
    >
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
