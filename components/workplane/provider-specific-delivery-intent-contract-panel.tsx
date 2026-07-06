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
  ProviderSpecificDeliveryIntentContractPreview,
  ProviderSpecificDeliveryIntentContractRecordReview,
  ProviderSpecificDeliveryIntentOperatorDecisionPreview,
} from "@/types/provider-specific-delivery-intent-contract";
import type { CSSProperties } from "react";

type ProviderSpecificDeliveryIntentContractPanelProps = {
  preview: ProviderSpecificDeliveryIntentContractPreview;
  decisionPreview: ProviderSpecificDeliveryIntentOperatorDecisionPreview;
  recordReview: ProviderSpecificDeliveryIntentContractRecordReview;
};

const sectionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
  gap: "10px",
  minWidth: 0,
};

export function ProviderSpecificDeliveryIntentContractPanel({
  preview,
  decisionPreview,
  recordReview,
}: ProviderSpecificDeliveryIntentContractPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Provider-specific intent"
      title="Provider-Specific Delivery Intent Contract"
      ariaLabel="Provider-Specific Delivery Intent Contract panel"
    >
      <p style={workplaneCopyStyle}>
        Scoped local intent contract layer between provider-specific preview and
        any future execution slice. It records intent readiness only; it does
        not authorize delivery, call providers, send email, Slack, webhook, or
        network traffic, read secrets, write clipboard or files, mutate state, or
        render action controls.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Preview status" value={preview.status} />
        <WorkplanePanelMetric
          label="Decision"
          value={decisionPreview.recommended_operator_decision}
        />
        <WorkplanePanelMetric
          label="Record review"
          value={recordReview.review_status}
        />
        <WorkplanePanelMetric
          label="Provider surface"
          value={preview.requested_provider_surface ?? "none"}
        />
      </WorkplanePanelMetricGrid>

      <section style={sectionGridStyle}>
        <ReasonList
          title="blockers"
          items={preview.blocker_reasons}
          emptyText="No provider-specific intent blockers are visible."
        />
        <ReasonList
          title="warnings"
          items={preview.warning_reasons}
          emptyText="No provider-specific intent warnings are visible."
        />
        <ReasonList
          title="decision blockers"
          items={decisionPreview.blocker_reasons}
          emptyText="No provider-specific intent decision blockers are visible."
        />
        <ReasonList
          title="record review blockers"
          items={recordReview.blocked_reasons}
          emptyText="No provider-specific intent record blockers are visible."
        />
      </section>

      <section
        aria-label="Provider-specific delivery intent source refs"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>source refs</span>
        <span style={workplaneCopyStyle}>
          provider preview{" "}
          {preview.source_provider_specific_preview_fingerprint ?? "none"};
          provider decision{" "}
          {preview.source_provider_specific_decision_fingerprint ?? "none"}
        </span>
        <span style={workplaneCopyStyle}>
          external contract{" "}
          {preview.source_external_handoff_delivery_contract_record_ref ??
            preview.source_external_handoff_delivery_contract_preview_fingerprint ??
            "none"}
        </span>
        <span style={workplaneCopyStyle}>
          local fulfillment {preview.source_local_fulfillment_ref ?? "none"};
          artifact {preview.source_exported_artifact_ref ?? "none"}
        </span>
      </section>

      <section
        aria-label="Provider-specific delivery intent payload"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>payload and recipient</span>
        <span style={workplaneCopyStyle}>
          profile_ref {preview.provider_profile_ref ?? "none"};
          recipient_ref {preview.requested_recipient_ref ?? "none"}
        </span>
        <span style={workplaneCopyStyle}>
          payload_hash {preview.payload_hash ?? "none"}; payload_format{" "}
          {preview.requested_payload_format ?? "none"}; payload_type{" "}
          {preview.payload_type ?? "none"}
        </span>
      </section>

      <section
        aria-label="Provider-specific delivery intent boundary"
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
          provider_delivery_intent_is_delivery{" "}
          {String(
            preview.external_delivery_boundary.provider_delivery_intent_is_delivery,
          )}
          ; provider_specific_preview_is_delivery{" "}
          {String(
            preview.external_delivery_boundary.provider_specific_preview_is_delivery,
          )}
        </span>
      </section>

      <section
        aria-label="Provider-specific delivery intent authority"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>authority boundary</span>
        <span style={workplaneCopyStyle}>
          read_only {String(preview.authority_boundary.read_only)};
          advisory_only {String(preview.authority_boundary.advisory_only)};
          intent_contract_only{" "}
          {String(preview.authority_boundary.intent_contract_only)}
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
      aria-label={`Provider-specific delivery intent ${title}`}
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
