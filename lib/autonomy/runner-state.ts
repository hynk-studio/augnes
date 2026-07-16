import type {
  AutonomyRunStepPlanInput,
  AutonomyRunnerAuthorityBoundary,
  AutonomyRunnerBudgetSnapshot,
  AutonomyRunnerSourceRefs,
  AutonomyRunnerStatus,
  AutonomyRunnerStepAction,
} from "../../types/autonomy-runner-execution";

export const AUTONOMY_RUNNER_DEFAULT_SCOPE = "project:augnes" as const;

export const AUTONOMY_RUNNER_TERMINAL_STATUSES = [
  "blocked",
  "completed",
  "needs_review",
  "cancelled",
  "failed",
  "stopped",
] as const;

export const AUTONOMY_RUNNER_NON_EXECUTING_STATUSES = [
  ...AUTONOMY_RUNNER_TERMINAL_STATUSES,
  "paused",
] as const;

export const AUTONOMY_RUNNER_SAFE_INTERNAL_ACTIONS = [
  "summarize_current_autonomy_context",
  "recover_preflight_delta_batch",
  "generate_runner_status_delta_batch",
] as const satisfies readonly AutonomyRunnerStepAction[];

const DEFAULT_DOC_REFS = [
  "docs/AUTONOMY_RUNNER_EXECUTION_V0_1.md",
  "docs/AUTONOMY_RUNNER_PREFLIGHT_V0_1.md",
  "docs/AUGNES_DELTA_CONTRACT_V0_1.md",
  "docs/AUTHORITY_MATRIX.md",
] as const;

export function buildDefaultRunnerSourceRefs(
  input: Partial<AutonomyRunnerSourceRefs> = {},
): AutonomyRunnerSourceRefs {
  return {
    autonomy_contract_refs: input.autonomy_contract_refs ?? [],
    guide_brief_refs: input.guide_brief_refs ?? [],
    handoff_refs: input.handoff_refs ?? [],
    codex_launch_card_refs: input.codex_launch_card_refs ?? [],
    current_working_perspective_refs:
      input.current_working_perspective_refs ?? [],
    delta_projection_refs: input.delta_projection_refs ?? [],
    preflight_refs: input.preflight_refs ?? [],
    runner_refs: input.runner_refs ?? [],
    docs_refs: uniqueSorted([
      ...DEFAULT_DOC_REFS,
      ...(input.docs_refs ?? []),
    ]),
    repo_refs: input.repo_refs ?? [],
  };
}

export function buildDefaultRunnerBudgetSnapshot(
  input: Partial<AutonomyRunnerBudgetSnapshot> = {},
): AutonomyRunnerBudgetSnapshot {
  return {
    budget_id: input.budget_id ?? "autonomy_runner_budget.local_v0_1",
    max_iterations: input.max_iterations ?? 3,
    max_tool_calls: input.max_tool_calls ?? 0,
    max_codex_tasks: input.max_codex_tasks ?? 0,
    max_external_calls: 0,
    max_provider_calls: 0,
    max_github_calls: 0,
    max_memory_mutations: 0,
    max_perspective_applies: 0,
    notes: input.notes ?? [
      "Budget snapshot bounds local deterministic runner ticks only.",
      "No provider, GitHub, Codex, memory mutation, or Perspective apply budget is granted.",
    ],
  };
}

export function buildDefaultRunnerAuthorityBoundary(
  input: Partial<AutonomyRunnerAuthorityBoundary> = {},
): AutonomyRunnerAuthorityBoundary {
  return {
    source_of_truth: "autonomy_runner_ledger",
    autonomy_run_is_approval_record: false,
    runner_ledger_is_proof_or_evidence_ledger: false,
    scheduled_run_requires_explicit_local_runner_invocation: true,
    watch_mode_starts_on_import: false,
    can_write_runner_ledger: true,
    can_recover_delta_batch: true,
    can_call_github: false,
    can_call_openai_or_provider: false,
    can_execute_codex: false,
    can_create_branch_or_pr: false,
    can_publish_external: false,
    can_merge: false,
    can_retry_replay_deploy: false,
    can_record_proof: false,
    can_create_evidence: false,
    can_mutate_memory: false,
    can_apply_project_perspective: false,
    can_auto_apply_delta: false,
    notes: input.notes ?? [
      "Autonomy Run is an execution record, not an approval record.",
      "Runner ledger is not a proof/evidence ledger.",
      "Scheduled run is processed only when a local runner/scheduler is explicitly invoked.",
      "DeltaBatch recovery is not durable Perspective apply.",
      "DeltaBatch recovery is not memory mutation.",
    ],
  };
}

export function buildDefaultRunnerStepPlans(
  runId: string,
  input: AutonomyRunStepPlanInput[] | undefined,
): Required<AutonomyRunStepPlanInput>[] {
  const plans: AutonomyRunStepPlanInput[] =
    input && input.length > 0
      ? input
      : [
          {
            action_kind: "summarize_current_autonomy_context",
            title: "Summarize current autonomy context",
            summary:
              "Record a bounded local summary of the run boundary and source refs.",
          },
          {
            action_kind: "generate_runner_status_delta_batch",
            title: "Generate runner status DeltaBatch candidate",
            summary:
              "Prepare deterministic runner output for later DeltaBatch recovery.",
          },
        ];

  return plans.map((plan, index) => {
    if (!isSafeRunnerStepAction(plan.action_kind)) {
      throw new Error(`unsupported_runner_step_action:${plan.action_kind}`);
    }

    return {
      step_id: plan.step_id ?? `${runId}.step.${index + 1}`,
      action_kind: plan.action_kind,
      title: plan.title ?? titleForAction(plan.action_kind),
      summary: plan.summary ?? summaryForAction(plan.action_kind),
    };
  });
}

export function isTerminalRunnerStatus(status: AutonomyRunnerStatus): boolean {
  return AUTONOMY_RUNNER_TERMINAL_STATUSES.includes(
    status as (typeof AUTONOMY_RUNNER_TERMINAL_STATUSES)[number],
  );
}

export function isNonExecutingRunnerStatus(
  status: AutonomyRunnerStatus,
): boolean {
  return AUTONOMY_RUNNER_NON_EXECUTING_STATUSES.includes(
    status as (typeof AUTONOMY_RUNNER_NON_EXECUTING_STATUSES)[number],
  );
}

export function isSafeRunnerStepAction(
  action: string,
): action is (typeof AUTONOMY_RUNNER_SAFE_INTERNAL_ACTIONS)[number] {
  return AUTONOMY_RUNNER_SAFE_INTERNAL_ACTIONS.includes(
    action as (typeof AUTONOMY_RUNNER_SAFE_INTERNAL_ACTIONS)[number],
  );
}

export function safeRunnerIdSegment(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9._:-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "unspecified";
}

function titleForAction(action: AutonomyRunnerStepAction): string {
  if (action === "recover_preflight_delta_batch") {
    return "Recover preflight DeltaBatch candidate";
  }
  if (action === "generate_runner_status_delta_batch") {
    return "Generate runner status DeltaBatch candidate";
  }
  return "Summarize current autonomy context";
}

function summaryForAction(action: AutonomyRunnerStepAction): string {
  if (action === "recover_preflight_delta_batch") {
    return "Read local preflight refs and record a review-only recovery step.";
  }
  if (action === "generate_runner_status_delta_batch") {
    return "Create local runner output that can be recovered as a review-only DeltaBatch.";
  }
  return "Summarize source refs, authority boundary, budget boundary, and stop rules without external calls.";
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort();
}
