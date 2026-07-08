import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { ProviderSpecificDeliveryExecutionContractRecordReview } from "@/types/provider-specific-delivery-execution-contract-record-review";
import type { CSSProperties } from "react";

type ProviderSpecificDeliveryExecutionContractRecordReviewPanelProps = {
  review: ProviderSpecificDeliveryExecutionContractRecordReview;
};

const sectionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
  gap: "10px",
  minWidth: 0,
};

export function ProviderSpecificDeliveryExecutionContractRecordReviewPanel({
  review,
}: ProviderSpecificDeliveryExecutionContractRecordReviewPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Execution contract record review"
      title="Provider-Specific Delivery Execution Contract Record Review"
      ariaLabel="Provider-Specific Delivery Execution Contract Record Review panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only record review for the provider-specific delivery execution
        contract. The execution contract record is not delivery, the execution
        preview is not provider authorization, the operator decision preview is
        not a send action, no external message was sent, and no provider was
        called.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Review status" value={review.review_status} />
        <WorkplanePanelMetric
          label="Execution surface"
          value={review.requested_execution_surface ?? "none"}
        />
        <WorkplanePanelMetric
          label="Config gate"
          value={review.provider_config_gate_summary.config_ref_status}
        />
        <WorkplanePanelMetric
          label="Recordable"
          value={String(review.readiness_summary.recordable)}
        />
      </WorkplanePanelMetricGrid>

      <section style={sectionGridStyle}>
        <ReasonList
          title="blockers"
          items={review.blocker_reasons}
          emptyText="No execution contract record blockers are visible."
        />
        <ReasonList
          title="warnings"
          items={review.warning_reasons}
          emptyText="No execution contract record warnings are visible."
        />
        <ReasonList
          title="missing refs"
          items={review.requirement_summary.missing_refs}
          emptyText="No required execution contract record refs are missing."
        />
        <ReasonList
          title="insufficient data"
          items={review.insufficient_data_reasons}
          emptyText="No execution contract record data gaps are visible."
        />
      </section>

      <section
        aria-label="Provider-specific delivery execution contract record source refs"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>source fingerprints</span>
        <span style={workplaneCopyStyle}>
          execution preview{" "}
          {review.source_execution_contract_preview_fingerprint ?? "none"};
          operator decision{" "}
          {review.source_operator_decision_preview_fingerprint ?? "none"}
        </span>
        <span style={workplaneCopyStyle}>
          delivery spine {review.source_delivery_spine_fingerprint ?? "none"};
          intent record{" "}
          {review.source_provider_specific_intent_contract_record_ref ?? "none"}
        </span>
        <span style={workplaneCopyStyle}>
          external contract{" "}
          {review.source_external_handoff_delivery_contract_record_ref ?? "none"};
          local fulfillment {review.source_local_fulfillment_ref ?? "none"};
          artifact {review.source_exported_handoff_artifact_ref ?? "none"}
        </span>
      </section>

      <section
        aria-label="Provider-specific delivery execution contract payload"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>payload and refs</span>
        <span style={workplaneCopyStyle}>
          provider_surface {review.requested_provider_surface ?? "none"};
          provider_profile_ref {review.provider_profile_ref ?? "none"};
          execution_profile_ref {review.execution_profile_ref ?? "none"}
        </span>
        <span style={workplaneCopyStyle}>
          recipient_ref {review.recipient_ref ?? "none"}; payload_hash{" "}
          {review.payload_hash ?? "none"}
        </span>
        <span style={workplaneCopyStyle}>
          payload_format {review.payload_format ?? "none"}; payload_type{" "}
          {review.payload_type ?? "none"}
        </span>
      </section>

      <section
        aria-label="Provider-specific delivery execution contract gates"
        style={sectionGridStyle}
      >
        <GateSummary
          title="lineage"
          status={review.lineage_gate_summary.gate_status}
          items={review.lineage_gate_summary.problem_reasons}
        />
        <GateSummary
          title="residual"
          status={review.residual_gate_summary.gate_status}
          items={[
            ...review.residual_gate_summary.hard_blocker_reasons,
            ...review.residual_gate_summary.warning_reasons,
          ]}
        />
        <GateSummary
          title="provider config"
          status={review.provider_config_gate_summary.config_ref_status}
          items={review.provider_config_gate_summary.problem_reasons}
        />
        <GateSummary
          title="operator"
          status={String(
            review.operator_gate_summary.operator_decision_ready_for_record_review,
          )}
          items={[
            review.operator_gate_summary.operator_decision_preview_status ??
              "operator_decision_preview_missing",
            `matches_execution_preview:${String(
              review.operator_gate_summary
                .operator_decision_matches_execution_preview,
            )}`,
          ]}
        />
      </section>

      <section
        aria-label="Provider-specific delivery execution contract non-delivery boundary"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>non-delivery boundary</span>
        <span style={workplaneCopyStyle}>
          delivery_performed{" "}
          {String(review.explicit_non_delivery_boundary.delivery_performed)};
          execution_performed{" "}
          {String(review.explicit_non_delivery_boundary.execution_performed)};
          provider_called{" "}
          {String(review.explicit_non_delivery_boundary.provider_called)};
          external_message_sent{" "}
          {String(review.explicit_non_delivery_boundary.external_message_sent)}
        </span>
        <span style={workplaneCopyStyle}>
          email_sent {String(review.explicit_non_delivery_boundary.email_sent)};
          slack_sent {String(review.explicit_non_delivery_boundary.slack_sent)};
          webhook_called{" "}
          {String(review.explicit_non_delivery_boundary.webhook_called)};
          network_called{" "}
          {String(review.explicit_non_delivery_boundary.network_called)}
        </span>
      </section>

      <section
        aria-label="Provider-specific delivery execution contract authority"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>authority boundary</span>
        <span style={workplaneCopyStyle}>
          read_only {String(review.authority_boundary.read_only)};
          read_only_record_review{" "}
          {String(review.authority_boundary.read_only_record_review)};
          can_write_db {String(review.authority_boundary.can_write_db)};
          can_create_route {String(review.authority_boundary.can_create_route)}
        </span>
        <span style={workplaneCopyStyle}>
          can_execute_delivery{" "}
          {String(review.authority_boundary.can_execute_delivery)};
          can_call_send_provider{" "}
          {String(review.authority_boundary.can_call_send_provider)};
          can_call_email {String(review.authority_boundary.can_call_email)};
          can_call_network {String(review.authority_boundary.can_call_network)}
        </span>
        <span style={workplaneCopyStyle}>
          can_write_clipboard{" "}
          {String(review.authority_boundary.can_write_clipboard)};
          can_download_file {String(review.authority_boundary.can_download_file)};
          can_write_memory {String(review.authority_boundary.can_write_memory)};
          can_mutate_cwp {String(review.authority_boundary.can_mutate_cwp)};
          can_mutate_handoff{" "}
          {String(review.authority_boundary.can_mutate_handoff)};
          can_render_workbench_action_button{" "}
          {String(review.authority_boundary.can_render_workbench_action_button)}
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
      aria-label={`Provider-specific delivery execution contract record ${title}`}
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

function GateSummary({
  title,
  status,
  items,
}: {
  title: string;
  status: string;
  items: string[];
}) {
  return (
    <section
      aria-label={`Provider-specific delivery execution contract record ${title} gate`}
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>{title} gate</span>
      <span style={workplaneCopyStyle}>status {status}</span>
      <ul style={workplaneListStyle}>
        {items.slice(0, 4).map((item) => (
          <li key={item} style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>{item}</span>
          </li>
        ))}
        {items.length === 0 ? (
          <li style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>No gate issues are visible.</span>
          </li>
        ) : null}
      </ul>
    </section>
  );
}
