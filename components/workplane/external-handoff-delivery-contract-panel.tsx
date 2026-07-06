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
  ExternalHandoffDeliveryContractPreview,
  ExternalHandoffDeliveryContractRecordReview,
  ExternalHandoffDeliveryOperatorDecisionPreview,
} from "@/types/external-handoff-delivery-contract";
import type { CSSProperties } from "react";

type ExternalHandoffDeliveryContractPanelProps = {
  preview: ExternalHandoffDeliveryContractPreview;
  decisionPreview: ExternalHandoffDeliveryOperatorDecisionPreview;
  recordReview: ExternalHandoffDeliveryContractRecordReview;
};

const sectionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
  gap: "10px",
  minWidth: 0,
};

export function ExternalHandoffDeliveryContractPanel({
  preview,
  decisionPreview,
  recordReview,
}: ExternalHandoffDeliveryContractPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="External delivery contract"
      title="External Handoff Delivery Contract"
      ariaLabel="External Handoff Delivery Contract panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only contract layer for evaluating whether a scoped local handoff
        fulfillment can become a candidate input for a future external delivery
        slice. This panel does not deliver externally, call providers, send
        email, Slack, webhook, GitHub, Codex, provider runtime, browser,
        crawler, or network traffic, write clipboard, create downloads, write files, mutate
        CWP, handoff, relay, memory, metrics, or render action controls.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Preview status" value={preview.status} />
        <WorkplanePanelMetric
          label="Decision recommendation"
          value={decisionPreview.recommended_operator_decision}
        />
        <WorkplanePanelMetric
          label="Record review"
          value={recordReview.review_status}
        />
        <WorkplanePanelMetric
          label="Residual gate"
          value={preview.residual_gate_summary.gate_status}
        />
      </WorkplanePanelMetricGrid>

      <section style={sectionGridStyle}>
        <ReasonList
          title="blockers"
          items={preview.blocker_reasons}
          emptyText="No external delivery contract blockers are visible."
        />
        <ReasonList
          title="warnings"
          items={preview.warning_reasons}
          emptyText="No external delivery contract warnings are visible."
        />
        <ReasonList
          title="decision blockers"
          items={decisionPreview.blocker_reasons}
          emptyText="No operator decision blockers are visible."
        />
        <ReasonList
          title="record review blockers"
          items={recordReview.blocked_reasons}
          emptyText="No external delivery contract record blockers are visible."
        />
      </section>

      <section
        aria-label="External handoff delivery source lineage"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>source lineage</span>
        <span style={workplaneCopyStyle}>
          local fulfillment {preview.source_local_fulfillment_ref ?? "none"};
          send contract{" "}
          {preview.source_handoff_send_contract_record_ref ?? "none"}
        </span>
        <span style={workplaneCopyStyle}>
          exported artifact {preview.source_exported_artifact_ref ?? "none"};
          applied handoff context{" "}
          {preview.source_applied_handoff_context_ref ?? "none"}
        </span>
        <span style={workplaneCopyStyle}>
          payload_hash {preview.payload_hash ?? "none"}; payload_type{" "}
          {preview.payload_type ?? "none"}; recipient{" "}
          {preview.requested_recipient_ref ?? "none"}
        </span>
      </section>

      <section
        aria-label="External handoff delivery boundary"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>external delivery boundary</span>
        <span style={workplaneCopyStyle}>
          delivery_performed{" "}
          {String(preview.external_delivery_boundary.delivery_performed)};
          provider_contract_present{" "}
          {String(preview.external_delivery_boundary.provider_contract_present)};
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
          clipboard_written{" "}
          {String(preview.external_delivery_boundary.clipboard_written)};
          file_downloaded{" "}
          {String(preview.external_delivery_boundary.file_downloaded)};
          local_fulfillment_is_external_delivery{" "}
          {String(
            preview.external_delivery_boundary
              .local_fulfillment_is_external_delivery,
          )}
        </span>
      </section>

      <section
        aria-label="External handoff delivery residual gate"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>residual gate</span>
        <span style={workplaneCopyStyle}>
          hard blockers{" "}
          {preview.residual_gate_summary.hard_blocking_candidate_ids.join(", ") ||
            "none"}
        </span>
        <span style={workplaneCopyStyle}>
          warnings{" "}
          {preview.residual_gate_summary.warning_candidate_ids.join(", ") ||
            "none"}
        </span>
      </section>

      <section
        aria-label="External handoff delivery authority boundary"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>authority boundary</span>
        <span style={workplaneCopyStyle}>
          read_only {String(preview.authority_boundary.read_only)};
          advisory_only {String(preview.authority_boundary.advisory_only)};
          contract_only {String(preview.authority_boundary.contract_only)}
        </span>
        <span style={workplaneCopyStyle}>
          can_write_db {String(preview.authority_boundary.can_write_db)};
          can_create_schema{" "}
          {String(preview.authority_boundary.can_create_schema)};
          can_send_handoff {String(preview.authority_boundary.can_send_handoff)}
        </span>
        <span style={workplaneCopyStyle}>
          can_call_send_provider{" "}
          {String(preview.authority_boundary.can_call_send_provider)};
          can_call_email {String(preview.authority_boundary.can_call_email)};
          can_call_slack {String(preview.authority_boundary.can_call_slack)};
          can_call_webhook {String(preview.authority_boundary.can_call_webhook)}
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
      aria-label={`External handoff delivery contract ${title}`}
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
