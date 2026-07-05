import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { CurrentWorkingPerspectiveApplyOperatorDecisionPreview } from "@/types/current-working-perspective-apply-decision";

type CurrentWorkingPerspectiveApplyDecisionPanelProps = {
  preview: CurrentWorkingPerspectiveApplyOperatorDecisionPreview;
};

export function CurrentWorkingPerspectiveApplyDecisionPanel({
  preview,
}: CurrentWorkingPerspectiveApplyDecisionPanelProps) {
  const material =
    preview.would_write_current_working_perspective_apply_decision_preview;
  return (
    <WorkplanePanelShell
      kicker="CWP apply decision"
      title="CurrentWorkingPerspective Apply Decision Preview"
      ariaLabel="CurrentWorkingPerspective Apply Decision Preview panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only operator decision preview. It can recommend a scoped local
        apply record write, but Workbench does not approve, write, apply,
        mutate handoff, write memory, or call external systems.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="decision status"
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
          label="patches"
          value={String(material.proposed_patch_entry_count)}
        />
      </WorkplanePanelMetricGrid>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>requested refs</span>
        <span style={workplaneCopyStyle}>
          operator {material.requested_operator_ref ?? "missing"};
          idempotency {material.requested_idempotency_key ?? "missing"};
          review {material.review_confirmation_ref ?? "missing"}
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
          can_create_apply_record{" "}
          {String(
            preview.authority_boundary
              .can_create_current_working_perspective_apply_record,
          )}
          ; can_apply_cwp_update{" "}
          {String(preview.authority_boundary.can_apply_current_working_perspective_update)}
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
