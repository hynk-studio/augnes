import {
  AutonomyKeyValues,
  AutonomyList,
  AutonomySection,
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneCopyStyle,
  workplaneItemStyle,
} from "@/components/autonomy/autonomy-preview-shared";
import type { AutonomyContractPreviewForWeb } from "@/lib/autonomy/read-autonomy-contract-for-web";

type AutonomyContractPreviewPanelProps = {
  preview: AutonomyContractPreviewForWeb;
};

export function AutonomyContractPreviewPanel({
  preview,
}: AutonomyContractPreviewPanelProps) {
  const contract = preview.contract;

  return (
    <WorkplanePanelShell
      kicker="Phase 8C preview"
      title="Autonomy Contract preview"
      ariaLabel="Autonomy Contract read-only Web preview"
    >
      <p style={workplaneCopyStyle}>
        Preview only. Future runner not implemented. No run, no schedule, no
        Codex launch, no handoff send, no write, no copy/export behavior, and
        no external side effect. Phase 9 requires separate explicit scope and
        approval.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Status" value={contract.status} />
        <WorkplanePanelMetric label="Mode" value={contract.autonomy_mode} />
        <WorkplanePanelMetric label="Scope" value={contract.scope} />
        <WorkplanePanelMetric
          label="Run preview"
          value={contract.run_preview.status}
        />
      </WorkplanePanelMetricGrid>

      <AutonomySection
        title="summary"
        description="Goal and bounded context are display-only preview text."
      >
        <section style={workplaneItemStyle}>
          <strong>{contract.title}</strong>
          <span style={workplaneCopyStyle}>{contract.goal}</span>
          <span style={workplaneCopyStyle}>
            {contract.bounded_context_summary}
          </span>
        </section>
      </AutonomySection>

      <AutonomySection
        title="source/fallback status"
        description="Public Web display defaults to fallback unless a validated local route context is supplied."
      >
        <AutonomyKeyValues
          rows={[
            ["source", preview.source_status.source],
            [
              "autonomy contract",
              preview.source_status.autonomy_contract,
            ],
            ["budget", preview.source_status.budget],
            ["run preview", preview.source_status.run_preview],
          ]}
        />
        <p style={workplaneCopyStyle}>
          {preview.source_status.source_disclosure}
        </p>
        <AutonomyList
          items={preview.fallback_reasons}
          itemLabel="fallback reason"
          emptyText="No fallback reason because local read-only route context passed validation."
        />
      </AutonomySection>

      <AutonomySection
        title="source refs"
        description="Pointers only. They do not create proof, evidence, approval, execution, or source-of-truth state."
      >
        <AutonomyList
          itemLabel="source ref"
          items={[
            contract.guide_brief_ref,
            ...contract.handoff_capsule_refs,
            ...contract.codex_launch_card_refs,
            contract.current_working_perspective_ref,
            contract.delta_projection_ref,
          ]}
        />
      </AutonomySection>

      <AutonomySection
        title="agents and surfaces"
        description="Allowed agents and surfaces are planning labels only; no runner agent is active."
      >
        <AutonomyKeyValues
          rows={[
            ["allowed agents", contract.allowed_agents.join(", ")],
            ["allowed surfaces", contract.allowed_surfaces.join(", ")],
          ]}
        />
      </AutonomySection>

      <AutonomySection
        title="allowed actions"
        description="Read, summarize, and prepare-preview actions only."
      >
        <AutonomyList
          itemLabel="allowed action"
          items={contract.allowed_actions}
        />
      </AutonomySection>

      <AutonomySection
        title="forbidden actions"
        description="Future-only or external/write actions remain denied in Phase 8."
      >
        <AutonomyList
          itemLabel="forbidden action"
          items={contract.forbidden_actions}
          limit={12}
        />
      </AutonomySection>

      <AutonomySection
        title="warnings and gaps"
        description="Visible warnings and gaps prevent fallback data from being mistaken for live autonomy state."
      >
        <AutonomyList itemLabel="warning" items={preview.warnings} />
        <AutonomyList itemLabel="gap" items={preview.gaps} />
      </AutonomySection>
    </WorkplanePanelShell>
  );
}
