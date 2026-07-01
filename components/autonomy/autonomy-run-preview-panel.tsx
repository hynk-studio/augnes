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

type AutonomyRunPreviewPanelProps = {
  preview: AutonomyContractPreviewForWeb;
};

export function AutonomyRunPreviewPanel({
  preview,
}: AutonomyRunPreviewPanelProps) {
  const contract = preview.contract;
  const runPreview = contract.run_preview;
  const reporting = contract.reporting_cadence;
  const output = contract.output_policy;

  return (
    <WorkplanePanelShell
      kicker="Phase 8C run preview"
      title="Run preview and stop conditions"
      ariaLabel="Autonomy Run Preview read-only panel"
    >
      <p style={workplaneCopyStyle}>
        AutonomyRunPreview is not execution. run_preview.status remains
        preview_only. No runner exists. No scheduler exists. No daemon exists.
        No background job exists. Phase 9 requires separate explicit scope and
        approval.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Status" value={runPreview.status} />
        <WorkplanePanelMetric
          label="Planned steps"
          value={runPreview.planned_steps.length}
        />
        <WorkplanePanelMetric
          label="Blocked steps"
          value={runPreview.blocked_steps.length}
        />
        <WorkplanePanelMetric
          label="Stop conditions"
          value={contract.stop_conditions.length}
        />
      </WorkplanePanelMetricGrid>

      <AutonomySection
        title="run preview"
        description="The sketch describes possible future review flow only."
      >
        <AutonomyKeyValues
          rows={[
            ["preview_id", runPreview.preview_id],
            ["title", runPreview.title],
            ["status", runPreview.status],
          ]}
        />
        <AutonomyList
          itemLabel="planned step"
          items={runPreview.planned_steps}
        />
        <AutonomyList
          itemLabel="allowed read source"
          items={runPreview.allowed_read_sources}
        />
        <AutonomyList
          itemLabel="proposed delta output"
          items={runPreview.proposed_delta_outputs}
        />
        <AutonomyList
          itemLabel="proposed report"
          items={runPreview.proposed_reports}
        />
      </AutonomySection>

      <AutonomySection
        title="blocked and required"
        description="Blocked steps and preconditions prevent future run semantics."
      >
        <AutonomyList
          itemLabel="blocked step"
          items={runPreview.blocked_steps}
        />
        <AutonomyList
          itemLabel="required precondition"
          items={runPreview.required_preconditions}
        />
        <AutonomyList
          itemLabel="not implemented"
          items={runPreview.not_implemented_notes}
        />
      </AutonomySection>

      <AutonomySection
        title="stop conditions"
        description="Stop conditions block any future run until recovered."
      >
        <ul style={{ display: "grid", gap: "7px", margin: 0, padding: 0 }}>
          {contract.stop_conditions.map((condition) => (
            <li
              key={condition.stop_condition_id}
              style={{
                display: "grid",
                gap: "4px",
                padding: "9px",
                border: "1px solid rgba(30, 41, 59, 0.1)",
                borderRadius: "8px",
                background: "#f8fafc",
                overflowWrap: "anywhere",
              }}
            >
              <strong>{condition.kind}</strong>
              <span style={workplaneCopyStyle}>{condition.summary}</span>
              <span style={workplaneCopyStyle}>
                Severity: {condition.severity}. Blocks future run:{" "}
                {condition.blocks_future_run ? "true" : "false"}.
              </span>
              <span style={workplaneCopyStyle}>
                Recovery: {condition.recovery_hint}
              </span>
            </li>
          ))}
        </ul>
      </AutonomySection>

      <AutonomySection
        title="reporting cadence"
        description="Reporting cadence is policy display only; it creates no schedule."
      >
        <AutonomyKeyValues
          rows={[
            ["mode", reporting.mode],
            ["interval_description", reporting.interval_description],
            ["report_target_surface", reporting.report_target_surface],
          ]}
        />
        <AutonomyList
          itemLabel="minimum report field"
          items={reporting.minimum_report_fields}
        />
      </AutonomySection>

      <AutonomySection
        title="output policy"
        description="Required report sections and boundary statements for future review packets."
      >
        <AutonomyKeyValues
          rows={[
            ["delta_batch_required", output.delta_batch_required],
            [
              "skipped_check_reporting_required",
              output.skipped_check_reporting_required,
            ],
            [
              "proof_evidence_status_required",
              output.proof_evidence_status_required,
            ],
            [
              "no_background_work_statement_required",
              output.no_background_work_statement_required,
            ],
            ["no_merge_statement_required", output.no_merge_statement_required],
            [
              "next_phase_readiness_required",
              output.next_phase_readiness_required,
            ],
          ]}
        />
        <AutonomyList
          itemLabel="output surface"
          items={output.output_surfaces}
        />
        <AutonomyList
          itemLabel="required report section"
          items={output.required_report_sections}
        />
      </AutonomySection>
    </WorkplanePanelShell>
  );
}
