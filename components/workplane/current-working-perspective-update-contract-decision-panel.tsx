import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { CurrentWorkingPerspectiveUpdateContractOperatorDecisionPreview } from "@/types/current-working-perspective-update-contract-decision";

type CurrentWorkingPerspectiveUpdateContractDecisionPanelProps = {
  preview: CurrentWorkingPerspectiveUpdateContractOperatorDecisionPreview;
};

export function CurrentWorkingPerspectiveUpdateContractDecisionPanel({
  preview,
}: CurrentWorkingPerspectiveUpdateContractDecisionPanelProps) {
  const material =
    preview.would_write_current_working_perspective_update_contract_decision_preview;

  return (
    <WorkplanePanelShell
      kicker="CWP contract decision"
      title="CurrentWorkingPerspective Update Contract Decision Preview"
      ariaLabel="CurrentWorkingPerspective Update Contract Decision Preview panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only operator decision preview. It can prepare approval material for
        the scoped local contract record writer, but Workbench does not approve,
        write, apply, or mutate CurrentWorkingPerspective.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="Decision status"
          value={preview.decision_preview_status}
        />
        <WorkplanePanelMetric
          label="recommended decision"
          value={preview.recommended_operator_decision}
        />
        <WorkplanePanelMetric
          label="write ready"
          value={String(preview.write_readiness.write_ready)}
        />
        <WorkplanePanelMetric
          label="patch entries"
          value={String(material.proposed_patch_entry_count)}
        />
      </WorkplanePanelMetricGrid>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>decision material</span>
        <strong>{material.operator_decision ?? "none"}</strong>
        <span style={workplaneCopyStyle}>
          operator {material.requested_operator_ref ?? "missing"}; idempotency{" "}
          {material.requested_idempotency_key ?? "missing"}; review{" "}
          {material.review_confirmation_ref ?? "missing"}
        </span>
      </section>

      <ReasonList
        title="decision blockers"
        reasons={[
          ...preview.blocking_reasons,
          ...preview.missing_evidence,
          ...preview.refusal_reasons,
          ...preview.write_readiness.current_insufficient_data,
        ]}
      />

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>authority boundary</span>
        <strong>Read-only decision preview</strong>
        <span style={workplaneCopyStyle}>
          can_write_db {String(preview.authority_boundary.can_write_db)};
          can_create_contract_record{" "}
          {String(
            preview.authority_boundary
              .can_create_current_working_perspective_update_contract_record,
          )}
        </span>
        <span style={workplaneCopyStyle}>
          can_update_cwp{" "}
          {String(preview.authority_boundary.can_update_current_working_perspective)};
          can_apply_cwp_update{" "}
          {String(
            preview.authority_boundary.can_apply_current_working_perspective_update,
          )};
          can_send_handoff {String(preview.authority_boundary.can_send_handoff)};
          can_execute_codex {String(preview.authority_boundary.can_execute_codex)}
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
