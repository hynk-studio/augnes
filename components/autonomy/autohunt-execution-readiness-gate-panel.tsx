import {
  AutonomyKeyValues,
  AutonomyList,
  AutonomySection,
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneCopyStyle,
} from "@/components/autonomy/autonomy-preview-shared";
import type { AutohuntExecutionReadinessGate } from "@/types/autohunt-execution-readiness-gate";

type AutohuntExecutionReadinessGatePanelProps = {
  gate: AutohuntExecutionReadinessGate;
};

export function AutohuntExecutionReadinessGatePanel({
  gate,
}: AutohuntExecutionReadinessGatePanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Autohunt execution readiness gate"
      title="Execution Readiness Gate"
      ariaLabel="Autohunt Execution Readiness Gate passive readback"
    >
      <p style={workplaneCopyStyle}>
        Passive go/no-go read model only. This does not start a runner, schedule
        work, launch Codex, call GitHub, create a branch or PR, merge, deploy,
        call providers, fetch sources, run retrieval, write clipboard or files,
        or mutate Perspective, CWP, work, memory, proof, evidence, product, or
        delivery state. It only says whether future supervised execution design
        may be considered.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="Status"
          value={gate.readiness_status}
        />
        <WorkplanePanelMetric
          label="Grant"
          value={gate.source_chain_summary.active_grant_id ?? "none"}
        />
        <WorkplanePanelMetric
          label="Candidates"
          value={gate.source_chain_summary.queued_candidate_count}
        />
        <WorkplanePanelMetric
          label="Fingerprint"
          value={gate.gate_fingerprint}
        />
      </WorkplanePanelMetricGrid>

      <AutonomySection
        title="source chain"
        description="The gate compresses the current grant, queue, preflight, Workbench spine, handoff, decision, and copy/export preview bindings."
      >
        <AutonomyKeyValues
          rows={[
            ["active_grant_id", gate.source_chain_summary.active_grant_id],
            [
              "active_grant_fingerprint",
              gate.source_chain_summary.active_grant_fingerprint,
            ],
            [
              "latest_queued_candidate_id",
              gate.source_chain_summary.latest_queued_candidate_id,
            ],
            [
              "latest_queued_candidate_fingerprint",
              gate.source_chain_summary.latest_queued_candidate_fingerprint,
            ],
            [
              "ready_preflight_packet_id",
              gate.source_chain_summary.ready_preflight_packet_id,
            ],
            [
              "ready_preflight_packet_fingerprint",
              gate.source_chain_summary.ready_preflight_packet_fingerprint,
            ],
            [
              "workbench_spine_status",
              gate.source_chain_summary.workbench_spine_status,
            ],
            [
              "workbench_spine_fingerprint",
              gate.source_chain_summary.workbench_spine_fingerprint,
            ],
            ["handoff_plan_id", gate.source_chain_summary.handoff_plan_id],
            [
              "handoff_plan_fingerprint",
              gate.source_chain_summary.handoff_plan_fingerprint,
            ],
            [
              "operator_decision_id",
              gate.source_chain_summary.operator_decision_id,
            ],
            [
              "operator_decision_status",
              gate.source_chain_summary.operator_decision_status,
            ],
            [
              "operator_decision_fingerprint",
              gate.source_chain_summary.operator_decision_fingerprint,
            ],
            [
              "copy_export_preview_status",
              gate.source_chain_summary.copy_export_preview_status,
            ],
            [
              "copy_export_preview_fingerprint",
              gate.source_chain_summary.copy_export_preview_fingerprint,
            ],
          ]}
        />
      </AutonomySection>

      <AutonomySection
        title="readiness checks"
        description="Every check must pass before a future, separately approved supervised execution design slice can be considered."
      >
        <AutonomyKeyValues
          rows={[
            ["active_grant_present", gate.readiness_checks.active_grant_present],
            [
              "queued_candidate_present",
              gate.readiness_checks.queued_candidate_present,
            ],
            [
              "ready_preflight_present",
              gate.readiness_checks.ready_preflight_present,
            ],
            ["workbench_spine_ready", gate.readiness_checks.workbench_spine_ready],
            ["handoff_plan_ready", gate.readiness_checks.handoff_plan_ready],
            [
              "operator_decision_accepted",
              gate.readiness_checks.operator_decision_accepted,
            ],
            [
              "operator_decision_scope_limited",
              gate.readiness_checks.operator_decision_scope_limited,
            ],
            [
              "copy_export_preview_ready",
              gate.readiness_checks.copy_export_preview_ready,
            ],
            [
              "source_chain_bindings_present",
              gate.readiness_checks.source_chain_bindings_present,
            ],
            [
              "dogfood_seed_report_present",
              gate.readiness_checks.dogfood_seed_report_present,
            ],
            [
              "dogfood_seed_report_ready",
              gate.readiness_checks.dogfood_seed_report_ready,
            ],
            [
              "authority_boundaries_all_false",
              gate.readiness_checks.authority_boundaries_all_false,
            ],
            [
              "export_boundary_passive",
              gate.readiness_checks.export_boundary_passive,
            ],
            ["raw_material_absent", gate.readiness_checks.raw_material_absent],
            ["checks_passed", gate.readiness_checks.checks_passed],
          ]}
        />
        <AutonomyList
          itemLabel="blocker"
          items={gate.readiness_checks.blocker_reasons}
        />
        <AutonomyList
          itemLabel="warning"
          items={gate.readiness_checks.warning_reasons}
        />
      </AutonomySection>

      <AutonomySection
        title="future design requirements"
        description="This gate does not grant execution authority; future design must still satisfy these requirements."
      >
        <AutonomyList
          itemLabel="requirement"
          items={gate.future_execution_design_requirements}
        />
      </AutonomySection>

      <AutonomySection
        title="next outputs"
        description="Only design artifacts are allowed from the current gate."
      >
        <AutonomyList
          itemLabel="allowed design output"
          items={gate.allowed_next_design_outputs}
        />
        <AutonomyList
          itemLabel="forbidden current output"
          items={gate.forbidden_current_outputs}
        />
      </AutonomySection>

      <AutonomySection
        title="authority boundary"
        description="All runner, external, branch, PR, merge, deploy, source, retrieval, memory, Perspective, CWP, work, proof, evidence, and auto-apply authority remains false."
      >
        <AutonomyKeyValues
          rows={Object.entries(gate.authority_boundary).map(([key, value]) => [
            key,
            value,
          ])}
        />
      </AutonomySection>

      <AutonomySection
        title="material boundary"
        description="The gate persists no raw prompt, copy, PR body, operator note, source payload, secret, token, URL, or environment value."
      >
        <AutonomyKeyValues
          rows={Object.entries(gate.material_boundary).map(([key, value]) => [
            key,
            value,
          ])}
        />
      </AutonomySection>
    </WorkplanePanelShell>
  );
}
