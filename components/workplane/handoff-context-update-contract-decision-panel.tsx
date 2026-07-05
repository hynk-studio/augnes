import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { HandoffContextUpdateContractOperatorDecisionPreview } from "@/types/handoff-context-update-contract-decision";

type HandoffContextUpdateContractDecisionPanelProps = {
  decisionPreview: HandoffContextUpdateContractOperatorDecisionPreview;
};

export function HandoffContextUpdateContractDecisionPanel({
  decisionPreview,
}: HandoffContextUpdateContractDecisionPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Handoff context"
      title="Handoff Context Update Contract Decision"
      ariaLabel="Handoff Context Update Contract Decision panel"
    >
      <p style={workplaneCopyStyle}>
        Display-only operator decision preview. It does not write the contract,
        apply handoff context, send handoff, or write selected refs.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="status"
          value={decisionPreview.decision_preview_status}
        />
        <WorkplanePanelMetric
          label="decision"
          value={decisionPreview.recommended_operator_decision}
        />
        <WorkplanePanelMetric
          label="write ready"
          value={String(decisionPreview.write_readiness.write_ready)}
        />
        <WorkplanePanelMetric
          label="approval intent"
          value={String(decisionPreview.evidence_summary.has_approval_intent)}
        />
      </WorkplanePanelMetricGrid>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>requested refs</span>
        <strong>
          {decisionPreview.would_write_handoff_context_update_contract_decision_preview
            .requested_operator_ref ?? "operator missing"}
        </strong>
        <span style={workplaneCopyStyle}>
          idempotency{" "}
          {decisionPreview
            .would_write_handoff_context_update_contract_decision_preview
            .requested_idempotency_key ?? "missing"}
          ; review{" "}
          {decisionPreview
            .would_write_handoff_context_update_contract_decision_preview
            .review_confirmation_ref ?? "missing"}
        </span>
      </section>

      <ReasonList
        title="decision blockers"
        reasons={[
          ...decisionPreview.blocking_reasons,
          ...decisionPreview.missing_evidence,
          ...decisionPreview.refusal_reasons,
        ]}
      />

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>authority boundary</span>
        <strong>Read-only decision preview</strong>
        <span style={workplaneCopyStyle}>
          can_write_db {String(decisionPreview.authority_boundary.can_write_db)};
          can_apply_handoff{" "}
          {String(
            decisionPreview.authority_boundary
              .can_apply_handoff_context_update,
          )}
          ; can_send_handoff{" "}
          {String(decisionPreview.authority_boundary.can_send_handoff)}
        </span>
      </section>
    </WorkplanePanelShell>
  );
}

function ReasonList({ title, reasons }: { title: string; reasons: string[] }) {
  return (
    <section style={workplaneItemStyle}>
      <span style={workplaneBadgeStyle}>{title}</span>
      <ul style={workplaneListStyle}>
        {(reasons.length > 0 ? reasons : ["none"]).slice(0, 8).map((reason) => (
          <li key={reason} style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>{reason}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
