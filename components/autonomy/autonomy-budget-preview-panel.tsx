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

type AutonomyBudgetPreviewPanelProps = {
  preview: AutonomyContractPreviewForWeb;
};

export function AutonomyBudgetPreviewPanel({
  preview,
}: AutonomyBudgetPreviewPanelProps) {
  const budget = preview.contract.budget;

  return (
    <WorkplanePanelShell
      kicker="Phase 8C budget"
      title="Autonomy Budget preview"
      ariaLabel="Autonomy Budget read-only preview"
    >
      <p style={workplaneCopyStyle}>
        Budget is boundary only. Budget is not spend permission. Missing budget
        blocks future autonomy. Phase 8C does not charge, call providers,
        execute tools, or run background work.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="Minutes"
          value={budget.time_limit_minutes}
        />
        <WorkplanePanelMetric
          label="Iterations"
          value={budget.max_iterations}
        />
        <WorkplanePanelMetric
          label="Tool calls"
          value={budget.max_tool_calls}
        />
        <WorkplanePanelMetric label="PRs" value={budget.max_prs} />
      </WorkplanePanelMetricGrid>

      <AutonomySection
        title="budget fields"
        description="Operator budget fields are preview defaults unless a later scoped phase supplies reviewed values."
      >
        <AutonomyKeyValues
          rows={[
            ["budget_id", budget.budget_id],
            ["max_codex_tasks", budget.max_codex_tasks],
            ["max_file_changes", budget.max_file_changes],
            ["retry_limit", budget.retry_limit],
            ["failure_threshold", budget.failure_threshold],
            ["reporting_interval", budget.reporting_interval],
            [
              "wall_clock_window",
              `${budget.wall_clock_window.starts_at ?? "none"} to ${
                budget.wall_clock_window.ends_at ?? "none"
              } (${budget.wall_clock_window.timezone})`,
            ],
            [
              "cost_budget",
              `${budget.cost_budget.currency} ${
                budget.cost_budget.amount ?? "none"
              }`,
            ],
            [
              "token_or_compute_budget",
              `tokens ${
                budget.token_or_compute_budget.max_tokens ?? "none"
              }, compute ${
                budget.token_or_compute_budget.max_compute_units ?? "none"
              }`,
            ],
          ]}
        />
      </AutonomySection>

      <AutonomySection
        title="allowed file globs"
        description="Allowed file globs are review context only and do not authorize file edits."
      >
        <AutonomyList
          itemLabel="allowed glob"
          items={budget.allowed_file_globs}
          emptyText="No allowed file globs materialized for active autonomy."
        />
      </AutonomySection>

      <AutonomySection
        title="forbidden file globs"
        description="Forbidden file globs remain visible for future review and stop-condition handling."
      >
        <AutonomyList
          itemLabel="forbidden glob"
          items={budget.forbidden_file_globs}
        />
      </AutonomySection>

      <AutonomySection
        title="refresh boundary"
        description="Budget refresh triggers block future autonomy until reviewed."
      >
        <AutonomyList
          itemLabel="refresh trigger"
          items={budget.requires_budget_refresh_after}
        />
        <AutonomyList
          itemLabel="budget note"
          items={[
            ...budget.wall_clock_window.notes,
            ...budget.token_or_compute_budget.notes,
            ...budget.cost_budget.notes,
            ...budget.budget_boundary_notes,
          ]}
        />
      </AutonomySection>
    </WorkplanePanelShell>
  );
}
