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
  AutonomyDelegationGrant,
  AutonomyDelegationGrantReadback,
} from "@/types/autonomy-delegation-grant";

type AutonomyDelegationGrantReadbackPanelProps = {
  readback: AutonomyDelegationGrantReadback;
};

export function AutonomyDelegationGrantReadbackPanel({
  readback,
}: AutonomyDelegationGrantReadbackPanelProps) {
  const grant = readback.selected_grant;

  return (
    <WorkplanePanelShell
      kicker="Autonomy grant record"
      title="Delegation Grant Readback"
      ariaLabel="Autonomy Delegation Grant passive readback"
    >
      <p style={workplaneCopyStyle}>
        Passive grant record readback. The grant is permission evidence only;
        this panel starts no runner, schedules nothing, executes no Codex task,
        calls no external service, and writes no additional state.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="Selection"
          value={readback.selection_status}
        />
        <WorkplanePanelMetric
          label="Invalid rows"
          value={readback.invalid_record_count}
        />
        <WorkplanePanelMetric
          label="Active grants"
          value={readback.active_grants.length}
        />
        <WorkplanePanelMetric
          label="Historical grants"
          value={
            readback.paused_grants.length +
            readback.revoked_grants.length +
            readback.superseded_grants.length +
            readback.expired_grants.length
          }
        />
      </WorkplanePanelMetricGrid>

      {grant ? <SelectedGrant grant={grant} /> : <EmptySelection />}
    </WorkplanePanelShell>
  );
}

function SelectedGrant({ grant }: { grant: AutonomyDelegationGrant }) {
  return (
    <>
      <AutonomySection
        title="selected grant"
        description="Status, mode, approval ref, and source contract refs are stored as bounded structured material."
      >
        <AutonomyKeyValues
          rows={[
            ["grant_id", grant.grant_id],
            ["grant_status", grant.grant_status],
            ["grant_mode", grant.grant_mode],
            ["approval_ref", grant.explicit_user_approval.approval_ref],
            [
              "approval_text_fingerprint",
              grant.explicit_user_approval.approval_text_fingerprint,
            ],
            [
              "source_contract_fingerprint",
              grant.source_autonomy_contract.contract_fingerprint ?? "none",
            ],
            ["grant_fingerprint", grant.grant_fingerprint],
          ]}
        />
      </AutonomySection>

      <AutonomySection
        title="budget"
        description="Budget limits are recorded as boundaries, not spend or execution permission."
      >
        <AutonomyKeyValues
          rows={[
            ["time_limit_minutes", grant.budget.time_limit_minutes],
            ["max_iterations", grant.budget.max_iterations],
            ["max_tool_calls", grant.budget.max_tool_calls],
            ["max_codex_tasks", grant.budget.max_codex_tasks],
            ["max_draft_prs", grant.budget.max_draft_prs],
            ["max_file_changes", grant.budget.max_file_changes],
            [
              "max_changed_files_per_pr",
              grant.budget.max_changed_files_per_pr,
            ],
            ["retry_limit", grant.budget.retry_limit],
            ["failure_threshold", grant.budget.failure_threshold],
          ]}
        />
        <AutonomyList
          itemLabel="allowed file glob"
          items={grant.budget.allowed_file_globs}
          emptyText="No allowed file glob recorded."
        />
        <AutonomyList
          itemLabel="forbidden file glob"
          items={grant.budget.forbidden_file_globs}
          emptyText="No forbidden file glob recorded."
        />
      </AutonomySection>

      <AutonomySection
        title="work classes"
        description="Allowed and forbidden work classes are future-preflight constraints."
      >
        <AutonomyList
          itemLabel="allowed work class"
          items={grant.allowed_work_classes}
        />
        <AutonomyList
          itemLabel="forbidden work class"
          items={grant.forbidden_work_classes}
        />
      </AutonomySection>

      <AutonomySection
        title="actions"
        description="Allowed actions remain bounded and forbidden actions preserve no-run/no-external authority."
      >
        <AutonomyList itemLabel="allowed action" items={grant.allowed_actions} />
        <AutonomyList
          itemLabel="forbidden action"
          items={grant.forbidden_actions}
          limit={24}
        />
      </AutonomySection>

      <AutonomySection
        title="stop and report"
        description="Stop conditions and reporting cadence are recorded for future queue/preflight use only."
      >
        <AutonomyKeyValues
          rows={[
            ["reporting_mode", grant.reporting_cadence.mode],
            [
              "interval_description",
              grant.reporting_cadence.interval_description,
            ],
            [
              "report_target_surface",
              grant.reporting_cadence.report_target_surface,
            ],
          ]}
        />
        <AutonomyList
          itemLabel="minimum report field"
          items={grant.reporting_cadence.minimum_report_fields}
        />
        <AutonomyList
          itemLabel="stop condition"
          items={grant.stop_conditions}
          limit={16}
        />
      </AutonomySection>

      <AutonomySection
        title="outputs"
        description="Output policy separates draft/report candidates from durable product or evidence records."
      >
        <AutonomyList itemLabel="allowed output" items={grant.allowed_outputs} />
        <AutonomyList
          itemLabel="forbidden output"
          items={grant.forbidden_outputs}
        />
      </AutonomySection>

      <AutonomySection
        title="revocation"
        description="Pause, revoke, expire, and supersede state is record metadata only."
      >
        <AutonomyKeyValues
          rows={[
            ["revoked_by", grant.revocation.revoked_by ?? "none"],
            ["revoked_at", grant.revocation.revoked_at ?? "none"],
            ["revocation_reason", grant.revocation.revocation_reason ?? "none"],
            [
              "supersedes_grant_id",
              grant.revocation.supersedes_grant_id ?? "none",
            ],
            [
              "superseded_by_grant_id",
              grant.revocation.superseded_by_grant_id ?? "none",
            ],
          ]}
        />
      </AutonomySection>

      <AutonomySection
        title="authority boundary"
        description="Every dangerous authority flag remains false."
      >
        <AutonomyKeyValues
          rows={Object.entries(grant.authority_boundary).map(([key, value]) => [
            key,
            value,
          ])}
        />
      </AutonomySection>

      <AutonomySection
        title="material boundary"
        description="Only safe refs, fingerprints, budget, policy, and boundaries are persisted."
      >
        <AutonomyKeyValues
          rows={Object.entries(grant.persisted_material_boundary).map(
            ([key, value]) => [key, value],
          )}
        />
      </AutonomySection>

      <AutonomySection
        title="row-count summary"
        description="The grant record write is target-table only."
      >
        <AutonomyKeyValues
          rows={[
            [
              "target_table_name",
              grant.row_count_write_summary.target_table_name,
            ],
            ["target_delta", grant.row_count_write_summary.target_delta],
            [
              "non_target_changed_table_count",
              grant.row_count_write_summary.non_target_changed_table_count,
            ],
            [
              "all_non_target_row_counts_unchanged",
              grant.row_count_write_summary
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
      title="selected grant"
      description="No valid selected grant is available for this readback."
    >
      <AutonomyKeyValues rows={[["selected_grant", "none"]]} />
    </AutonomySection>
  );
}
