import {
  AutonomyKeyValues,
  AutonomyList,
  AutonomySection,
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/autonomy/autonomy-preview-shared";
import type { AutonomyRunnerPreflightPreviewForWeb } from "@/lib/autonomy/read-autonomy-runner-preflight-for-web";
import type {
  AutonomyRunnerAuthorityBoundary,
  AutonomyRunStepPreview,
} from "@/types/autonomy-runner";

type AutonomyRunnerPreflightPreviewPanelProps = {
  preview: AutonomyRunnerPreflightPreviewForWeb;
};

const noRunBoundaryItems = [
  "No runner starts",
  "No scheduler starts",
  "No daemon starts",
  "No background work starts",
  "No Codex execution",
  "No GitHub/provider/OpenAI call",
  "No DB write",
  "No proof/evidence write",
  "No memory mutation",
  "No durable Perspective apply",
  "No handoff send",
  "No branch/PR creation",
  "No auto-apply",
  "No external side effect",
] as const;

const authorityFields = [
  "can_start_runner",
  "can_schedule_runner",
  "can_start_daemon",
  "can_start_background_work",
  "can_execute_codex",
  "can_call_github",
  "can_call_openai_or_provider",
  "can_write_db",
  "can_record_proof",
  "can_create_evidence",
  "can_mutate_memory",
  "can_apply_project_perspective",
  "can_send_handoff",
  "can_create_branch_or_pr",
  "can_auto_apply_delta",
  "can_post_external_comment",
] as const;

export function AutonomyRunnerPreflightPreviewPanel({
  preview,
}: AutonomyRunnerPreflightPreviewPanelProps) {
  const preflight = preview.preflight;
  const dryRunPlan = preview.dry_run_plan;

  return (
    <WorkplanePanelShell
      kicker="Phase 9C preview"
      title="Autonomy Runner Preflight Preview"
      ariaLabel="Autonomy Runner Preflight read-only preview"
    >
      <p style={workplaneCopyStyle}>
        Read-only display only. This preview does not start, schedule, execute,
        launch Codex, call GitHub/providers, send handoffs, apply deltas,
        create branches/PRs, persist state, spend budget, or expose any
        run/action control.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Readiness" value={preflight.readiness} />
        <WorkplanePanelMetric
          label="Dry-run status"
          value={dryRunPlan.status}
        />
        <WorkplanePanelMetric
          label="Blockers"
          value={preflight.blockers.length}
        />
        <WorkplanePanelMetric
          label="Warnings"
          value={preflight.warnings.length}
        />
      </WorkplanePanelMetricGrid>

      <AutonomySection
        title="readiness"
        description="Readiness is advisory preview status. No readiness value starts a run."
      >
        <AutonomyKeyValues
          rows={[
            ["readiness", preflight.readiness],
            ["readiness_summary", preflight.readiness_summary],
            ["contract_status", preflight.contract_status],
            ["autonomy_mode", preflight.autonomy_mode],
            ["source_contract_id", preflight.source_contract_id],
          ]}
        />
      </AutonomySection>

      <AutonomySection
        title="blockers and warnings"
        description="Blockers and warnings stay visible for operator review; the panel does not resolve them."
      >
        <AutonomyList
          itemLabel="blocker"
          items={preflight.blockers.map(
            (blocker) => `${blocker.blocker_id}: ${blocker.summary}`,
          )}
          emptyText="No blockers materialized in this preview."
        />
        <AutonomyList
          itemLabel="warning"
          items={preflight.warnings.map(
            (warning) => `${warning.warning_id}: ${warning.summary}`,
          )}
          emptyText="No warnings materialized in this preview."
        />
      </AutonomySection>

      <AutonomySection
        title="review queues"
        description="User judgment and operator review are carried forward only."
      >
        <AutonomyList
          itemLabel="required user judgment"
          items={preflight.required_user_judgment}
          emptyText="No required user judgment materialized."
        />
        <AutonomyList
          itemLabel="required operator review"
          items={preflight.required_operator_review}
          emptyText="No required operator review materialized."
        />
      </AutonomySection>

      <AutonomySection
        title="assessment summaries"
        description="Assessments come from the Phase 9A preflight helper and are not recomputed by the panel."
      >
        <AutonomyKeyValues
          rows={[
            ["budget", preflight.budget_assessment.summary],
            ["action scope", preflight.action_scope_assessment.summary],
            ["delta merge", preflight.delta_merge_assessment.summary],
            [
              "review escalation",
              preflight.review_escalation_assessment.summary,
            ],
            ["stop condition", preflight.stop_condition_assessment.summary],
            ["staleness", preflight.staleness_assessment.summary],
            ["authority", preflight.authority_assessment.summary],
          ]}
        />
      </AutonomySection>

      <AutonomySection
        title="Dry-Run Plan Preview"
        description="Dry-run plan status stays dry_run_only. Planned steps are previews and never execute."
      >
        <AutonomyKeyValues
          rows={[
            ["dry_run_id", dryRunPlan.dry_run_id],
            ["status", dryRunPlan.status],
            ["planned_steps", dryRunPlan.planned_steps.length],
            ["blocked_steps", dryRunPlan.blocked_steps.length],
            [
              "would_spend_budget",
              dryRunPlan.budget_projection.would_spend_budget,
            ],
          ]}
        />
      </AutonomySection>

      <AutonomySection
        title="planned steps"
        description="Each step visibly preserves allowed_by_contract, blocked_by, would_require_review, expected_output, and would_execute: false."
      >
        <ul style={workplaneListStyle}>
          {dryRunPlan.planned_steps.map((step) => (
            <PlannedStepItem key={step.step_id} step={step} />
          ))}
        </ul>
      </AutonomySection>

      <AutonomySection
        title="dry-run inputs"
        description="Read sources, preconditions, checks, and stop conditions are requirements only."
      >
        <AutonomyList
          itemLabel="planned read source"
          items={dryRunPlan.planned_read_sources}
          emptyText="No planned read sources materialized."
        />
        <AutonomyList
          itemLabel="required precondition"
          items={dryRunPlan.required_preconditions}
        />
        <AutonomyList itemLabel="required check" items={dryRunPlan.required_checks} />
        <AutonomyList
          itemLabel="stop condition"
          items={dryRunPlan.stop_conditions}
        />
        <AutonomyList
          itemLabel="blocked step"
          items={dryRunPlan.blocked_steps}
        />
      </AutonomySection>

      <AutonomySection
        title="budget projection"
        description="Budget projection is a no-spend boundary preview."
      >
        <AutonomyKeyValues
          rows={[
            ["budget_id", dryRunPlan.budget_projection.budget_id],
            [
              "time_limit_minutes",
              dryRunPlan.budget_projection.time_limit_minutes,
            ],
            ["max_iterations", dryRunPlan.budget_projection.max_iterations],
            ["max_tool_calls", dryRunPlan.budget_projection.max_tool_calls],
            ["max_codex_tasks", dryRunPlan.budget_projection.max_codex_tasks],
            ["max_prs", dryRunPlan.budget_projection.max_prs],
            ["max_file_changes", dryRunPlan.budget_projection.max_file_changes],
            [
              "would_spend_budget",
              dryRunPlan.budget_projection.would_spend_budget,
            ],
          ]}
        />
        <AutonomyList
          itemLabel="budget boundary note"
          items={dryRunPlan.budget_projection.budget_boundary_notes}
        />
      </AutonomySection>

      <AutonomySection
        title="source and route status"
        description="Source refs are pointers only and route/source status is display-only."
      >
        <AutonomyKeyValues
          rows={[
            ["source", preview.source_status.source],
            ["autonomy_contract", preview.source_status.autonomy_contract],
            [
              "autonomy_runner_preflight",
              preview.source_status.autonomy_runner_preflight,
            ],
            ["dry_run_plan", preview.source_status.dry_run_plan],
          ]}
        />
        <p style={workplaneCopyStyle}>
          {preview.source_status.source_disclosure}
        </p>
        <AutonomyList
          itemLabel="route ref"
          items={preview.route_refs}
          emptyText="No route refs materialized."
        />
        <AutonomyList
          itemLabel="doc ref"
          items={preview.docs_refs}
          emptyText="No doc refs materialized."
        />
        <AutonomyList
          itemLabel="fallback reason"
          items={preview.fallback_reasons}
          emptyText="No fallback reason because Phase 9B source composition succeeded."
        />
      </AutonomySection>

      <AutonomySection
        title="no-run authority boundary"
        description="All execution, write, schedule, and external authority flags remain false."
      >
        <AutonomyList itemLabel="denied" items={[...noRunBoundaryItems]} />
        <AutonomyKeyValues
          rows={buildAuthorityRows(preview.authority_boundary)}
        />
        <AutonomyList
          itemLabel="boundary note"
          items={preview.boundary_notes}
          limit={12}
        />
      </AutonomySection>

      <AutonomySection
        title="public safety"
        description="Public safety flags must remain false for private, secret, local-path, raw-provider, and real-account content."
      >
        <AutonomyKeyValues
          rows={[
            [
              "contains_private_conversation",
              preview.public_safety.contains_private_conversation,
            ],
            [
              "contains_hidden_reasoning",
              preview.public_safety.contains_hidden_reasoning,
            ],
            [
              "contains_local_private_paths",
              preview.public_safety.contains_local_private_paths,
            ],
            [
              "contains_secrets_or_tokens",
              preview.public_safety.contains_secrets_or_tokens,
            ],
            [
              "contains_raw_provider_output",
              preview.public_safety.contains_raw_provider_output,
            ],
            [
              "contains_raw_retrieval_output",
              preview.public_safety.contains_raw_retrieval_output,
            ],
            [
              "contains_real_account_artifacts",
              preview.public_safety.contains_real_account_artifacts,
            ],
          ]}
        />
        <AutonomyList
          itemLabel="public safety note"
          items={preview.public_safety.notes}
        />
      </AutonomySection>
    </WorkplanePanelShell>
  );
}

function PlannedStepItem({ step }: { step: AutonomyRunStepPreview }) {
  return (
    <li style={workplaneItemStyle}>
      <span style={workplaneBadgeStyle}>{step.action_kind}</span>
      <strong>{step.title}</strong>
      <span style={workplaneCopyStyle}>{step.summary}</span>
      <AutonomyKeyValues
        rows={[
          ["step_id", step.step_id],
          ["allowed_by_contract", step.allowed_by_contract],
          [
            "blocked_by",
            step.blocked_by.length > 0 ? step.blocked_by.join(", ") : "none",
          ],
          ["would_require_review", step.would_require_review],
          ["would_execute", step.would_execute],
          ["expected_output", step.expected_output],
        ]}
      />
      <AutonomyList
        itemLabel="step source ref"
        items={step.source_refs}
        emptyText="No source refs materialized for this step."
        limit={4}
      />
    </li>
  );
}

function buildAuthorityRows(
  authority: AutonomyRunnerAuthorityBoundary,
): Array<[string, boolean]> {
  return authorityFields.map((field) => [field, authority[field]]);
}
