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
  ProviderSpecificExternalDeliveryOperatorDecisionPreview,
  ProviderSpecificExternalDeliveryPreviewContract,
} from "@/types/provider-specific-external-delivery-preview-contract";
import type { CSSProperties } from "react";

type ProviderSpecificExternalDeliveryPreviewContractPanelProps = {
  preview: ProviderSpecificExternalDeliveryPreviewContract;
  decisionPreview: ProviderSpecificExternalDeliveryOperatorDecisionPreview;
};

const sectionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
  gap: "10px",
  minWidth: 0,
};

export function ProviderSpecificExternalDeliveryPreviewContractPanel({
  preview,
  decisionPreview,
}: ProviderSpecificExternalDeliveryPreviewContractPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Provider-specific preview"
      title="Provider-Specific External Delivery Preview"
      ariaLabel="Provider-Specific External Delivery Preview Contract panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only provider-specific readiness layer over the external handoff
        delivery contract. It names the candidate surface and prerequisite refs
        for a future delivery slice without discovering provider config,
        accepting secrets, making runtime calls, delivering externally, writing
        clipboard or files, mutating state, or rendering action controls.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Preview status" value={preview.status} />
        <WorkplanePanelMetric
          label="Provider surface"
          value={preview.requested_provider_surface ?? "none"}
        />
        <WorkplanePanelMetric
          label="Provider profile"
          value={preview.provider_profile_status}
        />
        <WorkplanePanelMetric
          label="Decision"
          value={decisionPreview.recommended_operator_decision}
        />
      </WorkplanePanelMetricGrid>

      <section style={sectionGridStyle}>
        <ReasonList
          title="blockers"
          items={preview.blocker_reasons}
          emptyText="No provider-specific preview blockers are visible."
        />
        <ReasonList
          title="warnings"
          items={preview.warning_reasons}
          emptyText="No provider-specific preview warnings are visible."
        />
        <ReasonList
          title="requirements missing"
          items={preview.provider_requirement_summary.missing_refs}
          emptyText="No provider-specific prerequisite refs are missing."
        />
        <ReasonList
          title="decision blockers"
          items={decisionPreview.blocker_reasons}
          emptyText="No provider-specific decision blockers are visible."
        />
      </section>

      <section
        aria-label="Provider-specific external delivery source refs"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>source refs</span>
        <span style={workplaneCopyStyle}>
          external contract{" "}
          {preview.source_external_handoff_delivery_contract_record_ref ??
            preview.source_external_handoff_delivery_contract_preview_fingerprint ??
            "none"}
        </span>
        <span style={workplaneCopyStyle}>
          local fulfillment {preview.source_local_fulfillment_ref ?? "none"};
          send contract{" "}
          {preview.source_handoff_send_contract_record_ref ?? "none"}
        </span>
        <span style={workplaneCopyStyle}>
          exported artifact {preview.source_exported_artifact_ref ?? "none"};
          payload_hash {preview.payload_hash ?? "none"}; payload_format{" "}
          {preview.requested_payload_format ?? "none"}
        </span>
      </section>

      <section
        aria-label="Provider-specific external delivery profile"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>provider profile</span>
        <span style={workplaneCopyStyle}>
          profile_ref {preview.provider_profile_ref ?? "none"};
          recipient_ref {preview.requested_recipient_ref ?? "none"}
        </span>
        <span style={workplaneCopyStyle}>
          requires_profile{" "}
          {String(
            preview.provider_capability_summary.requires_provider_profile_ref,
          )}
          ; requires_token{" "}
          {String(preview.provider_capability_summary.requires_provider_token)}
          ; validates_by_provider_call{" "}
          {String(
            preview.provider_capability_summary.validates_by_provider_call,
          )}
        </span>
        <span style={workplaneCopyStyle}>
          future_delivery_slice_required{" "}
          {String(
            preview.provider_capability_summary.future_delivery_slice_required,
          )}
          ; delivery_execution_available{" "}
          {String(
            preview.provider_capability_summary.delivery_execution_available,
          )}
        </span>
      </section>

      <section
        aria-label="Provider-specific external delivery boundary"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>external delivery boundary</span>
        <span style={workplaneCopyStyle}>
          delivery_performed{" "}
          {String(preview.external_delivery_boundary.delivery_performed)};
          provider_specific_delivery{" "}
          {String(preview.external_delivery_boundary.provider_specific_delivery)};
          provider_called{" "}
          {String(preview.external_delivery_boundary.provider_called)};
          external_message_sent{" "}
          {String(preview.external_delivery_boundary.external_message_sent)}
        </span>
        <span style={workplaneCopyStyle}>
          email_sent {String(preview.external_delivery_boundary.email_sent)};
          slack_sent {String(preview.external_delivery_boundary.slack_sent)};
          webhook_called{" "}
          {String(preview.external_delivery_boundary.webhook_called)};
          network_called{" "}
          {String(preview.external_delivery_boundary.network_called)}
        </span>
        <span style={workplaneCopyStyle}>
          provider_specific_preview_is_delivery{" "}
          {String(
            preview.external_delivery_boundary
              .provider_specific_preview_is_delivery,
          )}
          ; local_fulfillment_is_external_delivery{" "}
          {String(
            preview.external_delivery_boundary
              .local_fulfillment_is_external_delivery,
          )}
        </span>
      </section>

      <section
        aria-label="Provider-specific external delivery authority"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>authority boundary</span>
        <span style={workplaneCopyStyle}>
          read_only {String(preview.authority_boundary.read_only)};
          advisory_only {String(preview.authority_boundary.advisory_only)};
          preview_only {String(preview.authority_boundary.preview_only)}
        </span>
        <span style={workplaneCopyStyle}>
          can_write_db {String(preview.authority_boundary.can_write_db)};
          can_send_handoff {String(preview.authority_boundary.can_send_handoff)};
          can_call_send_provider{" "}
          {String(preview.authority_boundary.can_call_send_provider)};
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
      aria-label={`Provider-specific external delivery ${title}`}
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
