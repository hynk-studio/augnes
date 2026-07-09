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
  AutohuntResultIntake,
  AutohuntResultIntakeReadback,
} from "@/types/autohunt-result-intake";

type AutohuntResultIntakeReadbackPanelProps = {
  readback: AutohuntResultIntakeReadback;
};

export function AutohuntResultIntakeReadbackPanel({
  readback,
}: AutohuntResultIntakeReadbackPanelProps) {
  const intake = readback.selected_result_intake;

  return (
    <WorkplanePanelShell
      kicker="Autohunt result intake"
      title="Result Intake Readback"
      ariaLabel="Autohunt Result Intake passive readback"
    >
      <p style={workplaneCopyStyle}>
        Passive structured result-intake readback only. This does not start a
        runner, schedule work, execute Codex, call GitHub or providers, create a
        branch or PR, merge, deploy, fetch sources, run retrieval, write
        clipboard or files, or mutate Perspective, CWP, work, memory, proof,
        evidence, product, delivery, or source state.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="Selection"
          value={readback.selection_status}
        />
        <WorkplanePanelMetric
          label="Recorded"
          value={readback.recorded_result_intakes.length}
        />
        <WorkplanePanelMetric
          label="Blocked"
          value={readback.blocked_result_intakes.length}
        />
        <WorkplanePanelMetric
          label="Invalid rows"
          value={readback.invalid_record_count}
        />
      </WorkplanePanelMetricGrid>

      {intake ? <SelectedIntake intake={intake} /> : <EmptySelection />}
    </WorkplanePanelShell>
  );
}

function SelectedIntake({ intake }: { intake: AutohuntResultIntake }) {
  const report = intake.structured_result_report;
  const delta = intake.expected_observed_delta_candidate;
  const reuse = intake.reuse_outcome_candidate;
  const residual = intake.residual_diagnostic_candidate;

  return (
    <>
      <AutonomySection
        title="selected intake"
        description="Result-intake identity and source execution contract binding."
      >
        <AutonomyKeyValues
          rows={[
            ["result_intake_id", intake.result_intake_id],
            ["result_intake_status", intake.result_intake_status],
            ["result_intake_fingerprint", intake.result_intake_fingerprint],
            [
              "source_execution_contract_id",
              intake.source_execution_contract.contract_id,
            ],
            [
              "source_execution_contract_fingerprint",
              intake.source_execution_contract.contract_fingerprint,
            ],
          ]}
        />
      </AutonomySection>

      <AutonomySection
        title="result report"
        description="Safe structured result summary; no raw result text is persisted."
      >
        <AutonomyKeyValues
          rows={[
            ["result_report_id", report.result_report_id],
            ["result_report_fingerprint", report.result_report_fingerprint],
            ["result_status", report.result_status],
            ["result_source", report.result_source],
            ["changed_file_count", report.changed_file_count],
            ["max_changed_files", report.max_changed_files],
            ["raw_result_text_persisted", report.raw_result_text_persisted],
          ]}
        />
        <AutonomyList itemLabel="check run" items={report.checks_run} />
        <AutonomyList itemLabel="check passed" items={report.checks_passed} />
        <AutonomyList itemLabel="check failed" items={report.checks_failed} />
        <AutonomyList itemLabel="check skipped" items={report.checks_skipped} />
        <AutonomyList itemLabel="changed file" items={report.changed_files} />
      </AutonomySection>

      <AutonomySection
        title="ExpectedObservedDelta candidate"
        description="Derived expectation-versus-observation candidate for future review."
      >
        <AutonomyKeyValues
          rows={[
            ["delta_status", delta.delta_status],
            ["delta_fingerprint", delta.delta_fingerprint],
            ["expected_summary", delta.expected_summary],
            ["observed_summary", delta.observed_summary],
          ]}
        />
        <AutonomyList
          itemLabel="matched expectation"
          items={delta.matched_expectations}
        />
        <AutonomyList
          itemLabel="missed expectation"
          items={delta.missed_expectations}
        />
        <AutonomyList
          itemLabel="unexpected observation"
          items={delta.unexpected_observations}
        />
      </AutonomySection>

      <AutonomySection
        title="ReuseOutcome candidate"
        description="Derived source-chain reuse outcome candidate for the next cycle."
      >
        <AutonomyKeyValues
          rows={[
            ["source_chain_helpfulness", reuse.source_chain_helpfulness],
            ["reused_context_fingerprint", reuse.reused_context_fingerprint],
            ["outcome_fingerprint", reuse.outcome_fingerprint],
          ]}
        />
        <AutonomyList itemLabel="useful ref" items={reuse.useful_refs} />
        <AutonomyList itemLabel="stale ref" items={reuse.stale_refs} />
        <AutonomyList itemLabel="missing ref" items={reuse.missing_refs} />
        <AutonomyList itemLabel="noisy ref" items={reuse.noisy_refs} />
      </AutonomySection>

      <AutonomySection
        title="ResidualDiagnostic candidate"
        description="Derived residual candidate; this panel does not promote or write diagnostics."
      >
        <AutonomyKeyValues
          rows={[
            ["severity", residual.severity],
            ["residual_category", residual.residual_category],
            ["residual_summary", residual.residual_summary],
            [
              "recommended_next_work_class",
              residual.recommended_next_work_class,
            ],
            ["residual_fingerprint", residual.residual_fingerprint],
          ]}
        />
      </AutonomySection>

      <AutonomySection
        title="learning loop"
        description="Satisfied hook summary for result intake and derived candidates."
      >
        <AutonomyKeyValues
          rows={Object.entries(intake.learning_loop_summary).map(
            ([key, value]) => [key, value],
          )}
        />
      </AutonomySection>

      <AutonomySection
        title="authority boundary"
        description="All execution and external authority remains false."
      >
        <AutonomyKeyValues
          rows={Object.entries(intake.authority_boundary).map(
            ([key, value]) => [key, value],
          )}
        />
      </AutonomySection>

      <AutonomySection
        title="material boundary"
        description="Only safe refs, fingerprints, summaries, and derived candidates are persisted."
      >
        <AutonomyKeyValues
          rows={Object.entries(intake.persisted_material_boundary).map(
            ([key, value]) => [key, value],
          )}
        />
      </AutonomySection>

      <AutonomySection
        title="row-count proof"
        description="Target-only write summary captured by the writer."
      >
        <AutonomyKeyValues
          rows={[
            [
              "target_table_name",
              intake.row_count_write_summary.target_table_name,
            ],
            ["target_delta", intake.row_count_write_summary.target_delta],
            [
              "non_target_changed_table_count",
              intake.row_count_write_summary.non_target_changed_table_count,
            ],
            [
              "all_non_target_row_counts_unchanged",
              intake.row_count_write_summary.all_non_target_row_counts_unchanged,
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
      title="selected intake"
      description="No recorded Autohunt result intake is selected."
    >
      <AutonomyKeyValues rows={[["selected_result_intake", "none"]]} />
    </AutonomySection>
  );
}
