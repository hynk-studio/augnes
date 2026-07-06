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
  ProviderSpecificDeliveryExecutionContractPreview,
  ProviderSpecificDeliveryExecutionOperatorDecisionPreview,
} from "@/types/provider-specific-delivery-execution-contract-preview";
import type { CSSProperties } from "react";

type ProviderSpecificDeliveryExecutionContractPreviewPanelProps = {
  preview: ProviderSpecificDeliveryExecutionContractPreview;
  decisionPreview: ProviderSpecificDeliveryExecutionOperatorDecisionPreview;
};

const sectionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
  gap: "10px",
  minWidth: 0,
};

export function ProviderSpecificDeliveryExecutionContractPreviewPanel({
  preview,
  decisionPreview,
}: ProviderSpecificDeliveryExecutionContractPreviewPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Execution preflight"
      title="Provider-Specific Delivery Execution Contract Preview"
      ariaLabel="Provider-Specific Delivery Execution Contract Preview panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only provider-specific execution preflight for a future execution
        contract slice. It does not execute delivery, create execution records,
        call providers, send email, Slack, webhook, or network traffic, inspect
        secrets, write clipboard or files, mutate state, or render action
        controls.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Preview status" value={preview.status} />
        <WorkplanePanelMetric
          label="Decision"
          value={decisionPreview.recommended_operator_decision}
        />
        <WorkplanePanelMetric
          label="Execution surface"
          value={preview.requested_execution_surface ?? "none"}
        />
        <WorkplanePanelMetric
          label="Config ref status"
          value={preview.provider_config_gate_summary.config_ref_status}
        />
      </WorkplanePanelMetricGrid>

      <section style={sectionGridStyle}>
        <ReasonList
          title="blockers"
          items={preview.blocker_reasons}
          emptyText="No execution preview blockers are visible."
        />
        <ReasonList
          title="warnings"
          items={preview.warning_reasons}
          emptyText="No execution preview warnings are visible."
        />
        <ReasonList
          title="decision blockers"
          items={decisionPreview.blocker_reasons}
          emptyText="No execution decision blockers are visible."
        />
        <ReasonList
          title="missing evidence"
          items={decisionPreview.next_step_readiness.current_missing_evidence}
          emptyText="No execution decision evidence is missing."
        />
      </section>

      <section
        aria-label="Provider-specific delivery execution source refs"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>source refs</span>
        <span style={workplaneCopyStyle}>
          spine {preview.source_delivery_spine_fingerprint ?? "none"}; intent
          record{" "}
          {preview.source_provider_specific_intent_contract_record_ref ?? "none"}
        </span>
        <span style={workplaneCopyStyle}>
          intent preview{" "}
          {preview.source_provider_specific_intent_preview_fingerprint ?? "none"};
          provider preview{" "}
          {preview.source_provider_specific_preview_fingerprint ?? "none"}
        </span>
        <span style={workplaneCopyStyle}>
          external contract{" "}
          {preview.source_external_handoff_delivery_contract_record_ref ?? "none"};
          local fulfillment {preview.source_local_fulfillment_ref ?? "none"};
          artifact {preview.source_exported_artifact_ref ?? "none"}
        </span>
      </section>

      <section
        aria-label="Provider-specific delivery execution config gate"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>provider config gate</span>
        <span style={workplaneCopyStyle}>
          execution_profile_ref {preview.execution_profile_ref ?? "none"};
          provider_profile_ref {preview.provider_profile_ref ?? "none"}
        </span>
        <span style={workplaneCopyStyle}>
          config_ref_present{" "}
          {String(preview.provider_config_gate_summary.config_ref_present)};
          config_runtime_verified{" "}
          {String(preview.provider_config_gate_summary.config_runtime_verified)};
          provider_call_tested{" "}
          {String(preview.provider_config_gate_summary.provider_call_tested)}
        </span>
        <span style={workplaneCopyStyle}>
          future_runtime_provider_gate_required{" "}
          {String(
            preview.provider_config_gate_summary
              .future_runtime_provider_gate_required,
          )}
        </span>
      </section>

      <section
        aria-label="Provider-specific delivery execution payload"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>payload and recipient</span>
        <span style={workplaneCopyStyle}>
          recipient_ref {preview.requested_recipient_ref ?? "none"};
          payload_hash {preview.payload_hash ?? "none"}
        </span>
        <span style={workplaneCopyStyle}>
          payload_format {preview.requested_payload_format ?? "none"};
          payload_type {preview.payload_type ?? "none"}
        </span>
      </section>

      <section
        aria-label="Provider-specific delivery execution gates"
        style={sectionGridStyle}
      >
        <GateSummary
          title="lineage"
          status={preview.lineage_gate_summary.gate_status}
          items={preview.lineage_gate_summary.problem_reasons}
        />
        <GateSummary
          title="residual"
          status={preview.residual_gate_summary.gate_status}
          items={[
            ...preview.residual_gate_summary.hard_blocker_reasons,
            ...preview.residual_gate_summary.warning_reasons,
          ]}
        />
      </section>

      <section
        aria-label="Provider-specific delivery execution non-delivery boundary"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>non-delivery boundary</span>
        <span style={workplaneCopyStyle}>
          delivery_performed{" "}
          {String(preview.explicit_non_delivery_boundary.delivery_performed)};
          execution_performed{" "}
          {String(preview.explicit_non_delivery_boundary.execution_performed)};
          provider_called{" "}
          {String(preview.explicit_non_delivery_boundary.provider_called)};
          external_message_sent{" "}
          {String(
            preview.explicit_non_delivery_boundary.external_message_sent,
          )}
        </span>
        <span style={workplaneCopyStyle}>
          email_sent{" "}
          {String(preview.explicit_non_delivery_boundary.email_sent)};
          slack_sent{" "}
          {String(preview.explicit_non_delivery_boundary.slack_sent)};
          webhook_called{" "}
          {String(preview.explicit_non_delivery_boundary.webhook_called)};
          network_called{" "}
          {String(preview.explicit_non_delivery_boundary.network_called)}
        </span>
        <span style={workplaneCopyStyle}>
          provider_execution_preview_is_delivery{" "}
          {String(
            preview.explicit_non_delivery_boundary
              .provider_execution_preview_is_delivery,
          )}
          ; provider_execution_contract_is_delivery{" "}
          {String(
            preview.explicit_non_delivery_boundary
              .provider_execution_contract_is_delivery,
          )}
        </span>
      </section>

      <section
        aria-label="Provider-specific delivery execution authority"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>authority boundary</span>
        <span style={workplaneCopyStyle}>
          read_only {String(preview.authority_boundary.read_only)};
          advisory_only {String(preview.authority_boundary.advisory_only)};
          execution_preview_only{" "}
          {String(preview.authority_boundary.execution_preview_only)}
        </span>
        <span style={workplaneCopyStyle}>
          can_write_db {String(preview.authority_boundary.can_write_db)};
          can_create_route{" "}
          {String(preview.authority_boundary.can_create_route)};
          can_execute_delivery{" "}
          {String(preview.authority_boundary.can_execute_delivery)};
          can_call_send_provider{" "}
          {String(preview.authority_boundary.can_call_send_provider)}
        </span>
        <span style={workplaneCopyStyle}>
          can_call_email {String(preview.authority_boundary.can_call_email)};
          can_call_slack {String(preview.authority_boundary.can_call_slack)};
          can_call_webhook {String(preview.authority_boundary.can_call_webhook)};
          can_call_network {String(preview.authority_boundary.can_call_network)}
        </span>
        <span style={workplaneCopyStyle}>
          can_write_clipboard{" "}
          {String(preview.authority_boundary.can_write_clipboard)};
          can_download_file {String(preview.authority_boundary.can_download_file)};
          can_write_memory {String(preview.authority_boundary.can_write_memory)};
          can_render_workbench_action_button{" "}
          {String(preview.authority_boundary.can_render_workbench_action_button)}
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
      aria-label={`Provider-specific delivery execution ${title}`}
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
      aria-label={`Provider-specific delivery execution ${title} gate`}
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
