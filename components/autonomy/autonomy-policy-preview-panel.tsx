import {
  AutonomyKeyValues,
  AutonomyList,
  AutonomySection,
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneCopyStyle,
} from "@/components/autonomy/autonomy-preview-shared";
import type { AutonomyContractPreviewForWeb } from "@/lib/autonomy/read-autonomy-contract-for-web";

type AutonomyPolicyPreviewPanelProps = {
  preview: AutonomyContractPreviewForWeb;
};

export function AutonomyPolicyPreviewPanel({
  preview,
}: AutonomyPolicyPreviewPanelProps) {
  const mergePolicy = preview.contract.delta_merge_policy;
  const escalation = preview.contract.review_escalation_policy;

  return (
    <WorkplanePanelShell
      kicker="Phase 8C policy"
      title="Delta merge and escalation policy"
      ariaLabel="Autonomy Delta Merge Policy and Review Escalation preview"
    >
      <p style={workplaneCopyStyle}>
        auto_apply_allowed must remain false in Phase 8. Durable memory and
        project Perspective require review. Proof/evidence write, external
        publication, GitHub actuation, provider call, branch/PR creation, and
        durable apply without review are blocked.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="Default delta"
          value={mergePolicy.default_delta_status}
        />
        <WorkplanePanelMetric
          label="Auto apply"
          value={mergePolicy.auto_apply_allowed ? "true" : "false"}
        />
        <WorkplanePanelMetric
          label="Review targets"
          value={mergePolicy.review_required_targets.length}
        />
        <WorkplanePanelMetric
          label="Blocked targets"
          value={mergePolicy.blocked_targets.length}
        />
      </WorkplanePanelMetricGrid>

      <AutonomySection
        title="delta merge policy"
        description="Delta policy is displayed as inactive preview policy, not state apply implementation."
      >
        <AutonomyKeyValues
          rows={[
            ["policy_id", mergePolicy.policy_id],
            ["default_delta_status", mergePolicy.default_delta_status],
            ["auto_apply_allowed", mergePolicy.auto_apply_allowed],
            ["auto_apply_targets", mergePolicy.auto_apply_targets.join(", ")],
            ["durable_memory_policy", mergePolicy.durable_memory_policy],
            [
              "project_perspective_policy",
              mergePolicy.project_perspective_policy,
            ],
            [
              "external_side_effect_policy",
              mergePolicy.external_side_effect_policy,
            ],
            ["codex_launch_policy", mergePolicy.codex_launch_policy],
            ["proof_evidence_policy", mergePolicy.proof_evidence_policy],
            ["stale_context_policy", mergePolicy.stale_context_policy],
            ["user_judgment_policy", mergePolicy.user_judgment_policy],
          ]}
        />
      </AutonomySection>

      <AutonomySection
        title="review required targets"
        description="These targets require user/operator review before any future runner can proceed."
      >
        <AutonomyList
          itemLabel="review target"
          items={mergePolicy.review_required_targets}
        />
      </AutonomySection>

      <AutonomySection
        title="blocked targets"
        description="These targets remain blocked in Phase 8 Web preview."
      >
        <AutonomyList
          itemLabel="blocked target"
          items={mergePolicy.blocked_targets}
        />
      </AutonomySection>

      <AutonomySection
        title="review escalation policy"
        description="Escalation policy names when operator review, fresh snapshots, or new budget are required."
      >
        <AutonomyKeyValues
          rows={[
            ["escalation_id", escalation.escalation_id],
            ["review_queue_target", escalation.review_queue_target],
            [
              "escalation_summary_template",
              escalation.escalation_summary_template,
            ],
          ]}
        />
        <AutonomyList
          itemLabel="user judgment trigger"
          items={escalation.requires_user_judgment_when}
        />
        <AutonomyList
          itemLabel="operator review trigger"
          items={escalation.requires_operator_review_when}
        />
        <AutonomyList
          itemLabel="fresh snapshot trigger"
          items={escalation.requires_fresh_snapshot_when}
        />
        <AutonomyList
          itemLabel="new budget trigger"
          items={escalation.requires_new_budget_when}
        />
        <AutonomyList
          itemLabel="blocks run when"
          items={escalation.blocks_run_when}
        />
      </AutonomySection>

      <AutonomySection
        title="policy notes"
        description="Notes remain policy display only."
      >
        <AutonomyList
          itemLabel="merge policy note"
          items={mergePolicy.policy_notes}
        />
        <AutonomyList itemLabel="escalation note" items={escalation.notes} />
      </AutonomySection>
    </WorkplanePanelShell>
  );
}
