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
  AutohuntDailyLauncherRun,
  AutohuntDailyLauncherRunReadback,
} from "@/types/autohunt-daily-launcher-run";

type AutohuntDailyLauncherRunReadbackPanelProps = {
  readback: AutohuntDailyLauncherRunReadback;
};

export function AutohuntDailyLauncherRunReadbackPanel({
  readback,
}: AutohuntDailyLauncherRunReadbackPanelProps) {
  const launcherRun = readback.selected_launcher_run;

  return (
    <WorkplanePanelShell
      kicker="Autohunt daily launcher"
      title="Daily Launcher Run Readback"
      ariaLabel="Autohunt Daily Launcher Run passive readback"
    >
      <p style={workplaneCopyStyle}>
        Passive local launcher run readback only. This does not execute Codex,
        call GitHub or providers, create a branch or PR, merge, deploy, fetch
        sources, run retrieval, write clipboard or files, start a scheduler or
        daemon, or mutate Perspective, CWP, work, memory, proof, evidence,
        product, delivery, or source state.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="Selection"
          value={readback.selection_status}
        />
        <WorkplanePanelMetric
          label="Runs"
          value={readback.all_launcher_runs.length}
        />
        <WorkplanePanelMetric
          label="Invalid rows"
          value={readback.invalid_record_count}
        />
        <WorkplanePanelMetric
          label="Linked intake"
          value={readback.linked_result_intake_summary ? "present" : "none"}
        />
      </WorkplanePanelMetricGrid>

      {launcherRun ? (
        <SelectedLauncherRun launcherRun={launcherRun} />
      ) : (
        <EmptySelection />
      )}
    </WorkplanePanelShell>
  );
}

function SelectedLauncherRun({
  launcherRun,
}: {
  launcherRun: AutohuntDailyLauncherRun;
}) {
  const packet = launcherRun.handoff_packet;

  return (
    <>
      <AutonomySection
        title="selected launcher run"
        description="Local launcher run identity and source execution contract binding."
      >
        <AutonomyKeyValues
          rows={[
            ["launcher_run_id", launcherRun.launcher_run_id],
            ["launcher_run_status", launcherRun.launcher_run_status],
            ["launcher_run_fingerprint", launcherRun.launcher_run_fingerprint],
            [
              "source_execution_contract_id",
              launcherRun.source_execution_contract.contract_id,
            ],
            [
              "source_execution_contract_fingerprint",
              launcherRun.source_execution_contract.contract_fingerprint,
            ],
          ]}
        />
      </AutonomySection>

      <AutonomySection
        title="daily confirmation"
        description="Explicit daily confirmation refs only; raw confirmation text is not persisted."
      >
        <AutonomyKeyValues
          rows={[
            [
              "confirmation_ref",
              launcherRun.daily_confirmation.confirmation_ref,
            ],
            [
              "confirmation_fingerprint",
              launcherRun.daily_confirmation.confirmation_fingerprint,
            ],
            ["confirmed_by", launcherRun.daily_confirmation.confirmed_by ?? null],
            ["confirmed_at", launcherRun.daily_confirmation.confirmed_at ?? null],
            [
              "raw_confirmation_text_persisted",
              launcherRun.daily_confirmation.raw_confirmation_text_persisted,
            ],
          ]}
        />
      </AutonomySection>

      <AutonomySection
        title="handoff packet"
        description="Structured handoff packet summary; no raw prompt body is persisted."
      >
        <AutonomyKeyValues
          rows={[
            ["handoff_packet_id", packet.handoff_packet_id],
            ["handoff_packet_fingerprint", packet.handoff_packet_fingerprint],
            ["handoff_packet_status", packet.handoff_packet_status],
            ["title", packet.title],
            ["goal_summary", packet.goal_summary],
            ["max_changed_files", packet.max_changed_files],
            ["raw_prompt_text_persisted", packet.raw_prompt_text_persisted],
          ]}
        />
        <AutonomyList itemLabel="source ref" items={packet.source_refs} />
        <AutonomyList
          itemLabel="source fingerprint"
          items={packet.source_fingerprints}
        />
        <AutonomyList
          itemLabel="selected candidate"
          items={packet.selected_candidate_refs}
        />
        <AutonomyList itemLabel="constraint" items={packet.constraints} />
        <AutonomyList
          itemLabel="required check"
          items={packet.required_checks}
        />
      </AutonomySection>

      <AutonomySection
        title="launcher boundary"
        description="The local launcher prepared a packet only; external and execution flags remain false."
      >
        <AutonomyKeyValues
          rows={Object.entries(launcherRun.launcher_run_boundary).map(
            ([key, value]) => [key, value],
          )}
        />
      </AutonomySection>

      <AutonomySection
        title="linked result intake"
        description="Present only when explicit fixture mode feeds Autohunt Result Intake."
      >
        <AutonomyKeyValues
          rows={
            launcherRun.linked_result_intake
              ? Object.entries(launcherRun.linked_result_intake).map(
                  ([key, value]) => [key, value],
                )
              : [["linked_result_intake", "none"]]
          }
        />
      </AutonomySection>

      <AutonomySection
        title="authority boundary"
        description="All external and execution authority remains false."
      >
        <AutonomyKeyValues
          rows={Object.entries(launcherRun.authority_boundary).map(
            ([key, value]) => [key, value],
          )}
        />
      </AutonomySection>

      <AutonomySection
        title="material boundary"
        description="Only safe refs, fingerprints, packet summaries, and result summaries are persisted."
      >
        <AutonomyKeyValues
          rows={Object.entries(launcherRun.persisted_material_boundary).map(
            ([key, value]) => [key, value],
          )}
        />
      </AutonomySection>

      <AutonomySection
        title="row-count proof"
        description="Launcher target write plus optional explicit result-intake linked target."
      >
        <AutonomyKeyValues
          rows={[
            [
              "target_table_name",
              launcherRun.row_count_write_summary.target_table_name,
            ],
            ["target_delta", launcherRun.row_count_write_summary.target_delta],
            [
              "allowed_linked_target_table_name",
              launcherRun.row_count_write_summary
                .allowed_linked_target_table_name,
            ],
            [
              "allowed_linked_target_delta",
              launcherRun.row_count_write_summary.allowed_linked_target_delta,
            ],
            [
              "non_target_changed_table_count",
              launcherRun.row_count_write_summary
                .non_target_changed_table_count,
            ],
            [
              "all_non_target_row_counts_unchanged",
              launcherRun.row_count_write_summary
                .all_non_target_row_counts_unchanged,
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
      title="selected launcher run"
      description="No Autohunt daily launcher run is selected."
    >
      <AutonomyKeyValues rows={[["selected_launcher_run", "none"]]} />
    </AutonomySection>
  );
}
