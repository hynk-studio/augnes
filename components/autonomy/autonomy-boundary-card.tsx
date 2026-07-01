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
import type { AutonomyContractAuthorityBoundary } from "@/types/autonomy-contract";

type AutonomyBoundaryCardProps = {
  preview: AutonomyContractPreviewForWeb;
};

const deniedAuthority = [
  "no runner",
  "no scheduler",
  "no daemon",
  "no background work",
  "no Codex execution",
  "no Codex launch",
  "no GitHub actuation",
  "no provider/OpenAI calls",
  "no DB write",
  "no proof/evidence writes",
  "no memory mutation",
  "no durable Perspective apply",
  "no handoff send",
  "no branch/PR creation",
  "no merge/publish/retry/replay/deploy",
  "no external side effects",
] as const;

const authorityBooleanFields = [
  "source_of_truth",
  "can_commit_or_reject_state",
  "can_record_proof",
  "can_create_evidence",
  "can_update_work",
  "can_mutate_memory",
  "can_apply_project_perspective",
  "can_publish_external",
  "can_merge",
  "can_retry_replay_deploy",
  "can_call_github",
  "can_call_openai_or_provider",
  "can_execute_codex",
  "can_create_branch_or_pr",
  "can_send_handoff",
  "can_launch_codex",
  "can_launch_autonomy",
  "can_schedule_background_work",
  "can_create_mcp_tool",
  "can_create_ui_action",
  "can_post_external_comment",
  "can_write_db",
  "can_start_daemon",
] as const;

export function AutonomyBoundaryCard({ preview }: AutonomyBoundaryCardProps) {
  const authority = preview.contract.authority_boundary;
  const falseCount = authorityBooleanFields.filter(
    (field) => authority[field] === false,
  ).length;

  return (
    <WorkplanePanelShell
      kicker="Phase 8C boundary"
      title="Autonomy authority boundary"
      ariaLabel="Autonomy Contract authority boundary"
    >
      <p style={workplaneCopyStyle}>
        Every authority boolean is expected to deny execution, write, schedule,
        and external authority. This preview does not imply approval, proof,
        evidence, source-of-truth state, merge authority, launch authority, or
        future runner authority.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Denied flags" value={falseCount} />
        <WorkplanePanelMetric label="UI actions" value="0" />
        <WorkplanePanelMetric label="Run authority" value="none" />
        <WorkplanePanelMetric label="External authority" value="none" />
      </WorkplanePanelMetricGrid>

      <AutonomySection
        title="denied authority"
        description="Denied authority list for Phase 8C Web preview."
      >
        <AutonomyList
          itemLabel="denied"
          items={[...deniedAuthority]}
          limit={16}
        />
      </AutonomySection>

      <AutonomySection
        title="authority booleans"
        description="All listed authority booleans should render false."
      >
        <AutonomyKeyValues rows={buildAuthorityRows(authority)} />
      </AutonomySection>

      <AutonomySection
        title="boundary notes"
        description="Contract and Web display boundary notes."
      >
        <AutonomyList
          itemLabel="contract note"
          items={authority.notes}
          limit={10}
        />
        <AutonomyList
          itemLabel="web boundary note"
          items={preview.boundary_notes}
          limit={10}
        />
      </AutonomySection>
    </WorkplanePanelShell>
  );
}

function buildAuthorityRows(
  authority: AutonomyContractAuthorityBoundary,
): Array<[string, boolean]> {
  return authorityBooleanFields.map((field) => [field, authority[field]]);
}
