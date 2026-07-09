import {
  AutonomyKeyValues,
  AutonomyList,
  AutonomySection,
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneCopyStyle,
} from "@/components/autonomy/autonomy-preview-shared";
import type {
  AutohuntSupervisedExecutionContract,
  AutohuntSupervisedExecutionContractReadback,
} from "@/types/autohunt-supervised-execution-contract";

type AutohuntSupervisedExecutionContractReadbackPanelProps = {
  readback: AutohuntSupervisedExecutionContractReadback;
};

export function AutohuntSupervisedExecutionContractReadbackPanel({
  readback,
}: AutohuntSupervisedExecutionContractReadbackPanelProps) {
  const contract = readback.selected_contract;

  return (
    <WorkplanePanelShell
      kicker="Autohunt execution contract"
      title="Supervised Execution Contract Readback"
      ariaLabel="Autohunt Supervised Execution Contract passive readback"
    >
      <p style={workplaneCopyStyle}>
        Passive launch-contract readback only. This does not start a runner,
        schedule work, execute Codex, call GitHub or providers, create a branch
        or PR, merge, deploy, fetch sources, run retrieval, write clipboard or
        files, or mutate Perspective, CWP, work, memory, proof, evidence,
        product, delivery, or source state. The launch guard keeps launch now
        disallowed.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="Selection"
          value={readback.selection_status}
        />
        <WorkplanePanelMetric
          label="Ready"
          value={readback.ready_contracts.length}
        />
        <WorkplanePanelMetric
          label="Blocked"
          value={readback.blocked_contracts.length}
        />
        <WorkplanePanelMetric
          label="Invalid rows"
          value={readback.invalid_record_count}
        />
      </WorkplanePanelMetricGrid>

      {contract ? <SelectedContract contract={contract} /> : <EmptySelection />}
    </WorkplanePanelShell>
  );
}

function SelectedContract({
  contract,
}: {
  contract: AutohuntSupervisedExecutionContract;
}) {
  return (
    <>
      <AutonomySection
        title="selected contract"
        description="Contract identity, launch mode, and source gate binding."
      >
        <AutonomyKeyValues
          rows={[
            ["contract_id", contract.contract_id],
            ["contract_status", contract.contract_status],
            ["launch_mode", contract.launch_envelope.launch_mode],
            ["contract_fingerprint", contract.contract_fingerprint],
            [
              "source_readiness_gate_fingerprint",
              contract.source_readiness_gate.gate_fingerprint,
            ],
          ]}
        />
      </AutonomySection>

      <AutonomySection
        title="freshness contract"
        description="Fresh grant, preflight, and operator approval remain required before any future launch attempt."
      >
        <AutonomyKeyValues
          rows={Object.entries(contract.freshness_contract).map(
            ([key, value]) => [key, value],
          )}
        />
      </AutonomySection>

      <AutonomySection
        title="launch envelope"
        description="Maximum future launcher envelope only; no launcher is started here."
      >
        <AutonomyKeyValues
          rows={[
            ["max_candidates", contract.launch_envelope.max_candidates],
            ["max_iterations", contract.launch_envelope.max_iterations],
            ["max_tool_calls", contract.launch_envelope.max_tool_calls],
            ["max_codex_tasks", contract.launch_envelope.max_codex_tasks],
            ["max_draft_prs", contract.launch_envelope.max_draft_prs],
            ["max_changed_files", contract.launch_envelope.max_changed_files],
            [
              "required_result_intake",
              contract.launch_envelope.required_result_intake,
            ],
            [
              "required_expected_observed_delta",
              contract.launch_envelope.required_expected_observed_delta,
            ],
            [
              "required_reuse_outcome",
              contract.launch_envelope.required_reuse_outcome,
            ],
            [
              "required_residual_diagnostic",
              contract.launch_envelope.required_residual_diagnostic,
            ],
          ]}
        />
        <AutonomyList
          itemLabel="allowed file glob"
          items={contract.launch_envelope.allowed_file_globs}
        />
        <AutonomyList
          itemLabel="forbidden file glob"
          items={contract.launch_envelope.forbidden_file_globs}
        />
        <AutonomyList
          itemLabel="required check"
          items={contract.launch_envelope.required_checks}
        />
        <AutonomyList
          itemLabel="required stop condition"
          items={contract.launch_envelope.required_stop_conditions}
        />
      </AutonomySection>

      <AutonomySection
        title="launcher boundaries"
        description="Future launcher permissions and prohibitions are recorded as policy, not action."
      >
        <AutonomyList itemLabel="launcher may" items={contract.launcher_may} />
        <AutonomyList
          itemLabel="launcher must not"
          items={contract.launcher_must_not}
        />
      </AutonomySection>

      <AutonomySection
        title="launch guard"
        description="Launch now remains false even when launcher design is allowed."
      >
        <AutonomyKeyValues
          rows={Object.entries(contract.launch_guard_checks).map(
            ([key, value]) => [key, value],
          )}
        />
        <AutonomyKeyValues
          rows={Object.entries(contract.launch_guard_result).map(
            ([key, value]) => [key, value],
          )}
        />
      </AutonomySection>

      <AutonomySection
        title="source fingerprints"
        description="The contract binds to the readiness gate source chain by ids and fingerprints."
      >
        <AutonomyKeyValues
          rows={[
            [
              "active_grant_id",
              contract.source_readiness_gate.active_grant_id,
            ],
            [
              "active_grant_fingerprint",
              contract.source_readiness_gate.active_grant_fingerprint,
            ],
            [
              "latest_queued_candidate_id",
              contract.source_readiness_gate.latest_queued_candidate_id,
            ],
            [
              "latest_queued_candidate_fingerprint",
              contract.source_readiness_gate.latest_queued_candidate_fingerprint,
            ],
            [
              "ready_preflight_packet_id",
              contract.source_readiness_gate.ready_preflight_packet_id,
            ],
            [
              "ready_preflight_packet_fingerprint",
              contract.source_readiness_gate.ready_preflight_packet_fingerprint,
            ],
            [
              "handoff_plan_id",
              contract.source_readiness_gate.handoff_plan_id,
            ],
            [
              "handoff_plan_fingerprint",
              contract.source_readiness_gate.handoff_plan_fingerprint,
            ],
            [
              "operator_decision_id",
              contract.source_readiness_gate.operator_decision_id,
            ],
            [
              "operator_decision_fingerprint",
              contract.source_readiness_gate.operator_decision_fingerprint,
            ],
            [
              "copy_export_preview_fingerprint",
              contract.source_readiness_gate.copy_export_preview_fingerprint,
            ],
          ]}
        />
      </AutonomySection>

      <AutonomySection
        title="authority boundary"
        description="All runner, external, branch, PR, merge, deploy, source, retrieval, memory, Perspective, CWP, work, proof, evidence, and auto-apply authority remains false."
      >
        <AutonomyKeyValues
          rows={Object.entries(contract.authority_boundary).map(
            ([key, value]) => [key, value],
          )}
        />
      </AutonomySection>

      <AutonomySection
        title="material boundary"
        description="The contract persists source fingerprints and launch policy only; no raw prompt, copy, PR body, operator note, source payload, token, secret, URL, or env value."
      >
        <AutonomyKeyValues
          rows={Object.entries(contract.persisted_material_boundary).map(
            ([key, value]) => [key, value],
          )}
        />
      </AutonomySection>

      <AutonomySection
        title="row count proof"
        description="Accepted writes prove the target contract table changed and protected non-target tables did not."
      >
        <AutonomyKeyValues
          rows={[
            [
              "target_table_name",
              contract.row_count_write_summary.target_table_name,
            ],
            ["target_delta", contract.row_count_write_summary.target_delta],
            [
              "target_delta_matches_expected",
              contract.row_count_write_summary.target_delta_matches_expected,
            ],
            [
              "all_non_target_row_counts_unchanged",
              contract.row_count_write_summary
                .all_non_target_row_counts_unchanged,
            ],
            [
              "non_target_changed_table_count",
              contract.row_count_write_summary.non_target_changed_table_count,
            ],
          ]}
        />
      </AutonomySection>
    </>
  );
}

function EmptySelection() {
  return (
    <AutonomySection
      title="no selected contract"
      description="No ready supervised execution contract is selected by this readback."
    >
      <AutonomyKeyValues rows={[["selected_contract", "none"]]} />
    </AutonomySection>
  );
}
