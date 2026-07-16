import {
  appendAutonomyRunLedgerEvent,
  buildAutonomyRunEventRecord,
  insertAutonomyRunDeltaBatchLedgerRecord,
  insertAutonomyRunLedgerRecord,
  listAutonomyRunLedgerRecords,
  readAutonomyRunDeltaBatchLedgerRecord,
  readAutonomyRunLedgerRecord,
  updateAutonomyRunLedgerFields,
  updateAutonomyRunStepLedgerFields,
  withAutonomyRunnerLedgerDb,
  type AutonomyRunnerLedgerDbOptions,
} from "./runner-ledger";
import { buildRecoveredDeltaBatchForRun } from "./runner-delta-batch";
import {
  AUTONOMY_RUNNER_DEFAULT_SCOPE,
  buildDefaultRunnerAuthorityBoundary,
  buildDefaultRunnerBudgetSnapshot,
  buildDefaultRunnerSourceRefs,
  buildDefaultRunnerStepPlans,
  isNonExecutingRunnerStatus,
  isSafeRunnerStepAction,
  isTerminalRunnerStatus,
  safeRunnerIdSegment,
} from "./runner-state";
import type {
  AutonomyRunListOptions,
  AutonomyRunRecord,
  AutonomyRunStepRecord,
  AutonomyRunSummary,
  CreateAutonomyRunInput,
  RecoveredAutonomyDeltaBatch,
  RunLifecycleInput,
  TickAutonomyRunInput,
} from "../../types/autonomy-runner-execution";

export function createAutonomyRun(
  input: CreateAutonomyRunInput = {},
): AutonomyRunRecord {
  const createdAt = input.created_at ?? nowIso();
  const scope = input.scope ?? AUTONOMY_RUNNER_DEFAULT_SCOPE;
  const runId =
    input.run_id ??
    `autonomy_run.${safeRunnerIdSegment(scope)}.${safeRunnerIdSegment(createdAt)}`;
  const scheduledFor = input.scheduled_for ?? null;
  const status = normalizeCreateAutonomyRunStatus(input.status, scheduledFor);
  const sourceRefs = buildDefaultRunnerSourceRefs({
    ...input.source_refs,
    autonomy_contract_refs: [
      ...(input.source_refs?.autonomy_contract_refs ?? []),
      input.autonomy_contract_ref ?? "",
    ].filter(Boolean),
  });
  const run: AutonomyRunSummary = {
    run_id: runId,
    scope,
    autonomy_contract_ref: input.autonomy_contract_ref ?? null,
    title: input.title ?? "Local autonomy runner v0.1 run",
    status,
    scheduled_for: scheduledFor,
    started_at: null,
    finished_at: null,
    created_at: createdAt,
    updated_at: createdAt,
    stop_reason: null,
    source_refs: sourceRefs,
    authority_boundary: buildDefaultRunnerAuthorityBoundary(
      input.authority_boundary,
    ),
    budget_snapshot: buildDefaultRunnerBudgetSnapshot(input.budget_snapshot),
    metadata: input.metadata ?? {},
  };
  const steps = buildDefaultRunnerStepPlans(runId, input.planned_steps).map(
    (step, index): AutonomyRunStepRecord => ({
      step_id: step.step_id,
      run_id: runId,
      step_index: index + 1,
      action_kind: step.action_kind,
      status: "planned",
      title: step.title,
      summary: step.summary,
      started_at: null,
      finished_at: null,
      output: {},
      error_message: null,
      created_at: createdAt,
      updated_at: createdAt,
    }),
  );
  const initialEvents = [
    buildAutonomyRunEventRecord({
      run_id: runId,
      event_type: "run_created",
      status,
      message:
        "Autonomy run ledger record created. This is execution bookkeeping, not approval.",
      payload: {
        scope,
        scheduled_for: scheduledFor,
        step_count: steps.length,
      },
      created_at: createdAt,
    }),
  ];

  if (status === "scheduled") {
    initialEvents.push(
      buildAutonomyRunEventRecord({
        run_id: runId,
        event_type: "run_scheduled",
        status,
        message:
          "Scheduled run recorded; it will execute only when the local runner or scheduler is explicitly invoked.",
        payload: { scheduled_for: scheduledFor },
        created_at: createdAt,
      }),
    );
  }

  return insertAutonomyRunLedgerRecord(run, steps, initialEvents, input);
}

export function getAutonomyRun(
  runId: string,
  options: AutonomyRunnerLedgerDbOptions = {},
): AutonomyRunRecord | null {
  return readAutonomyRunLedgerRecord(runId, options);
}

export function listAutonomyRuns(
  options: AutonomyRunListOptions = {},
): AutonomyRunSummary[] {
  return listAutonomyRunLedgerRecords(options);
}

export function tickAutonomyRun(
  input: TickAutonomyRunInput,
): AutonomyRunRecord {
  const now = input.now ?? nowIso();
  return withAutonomyRunnerLedgerDb(input, (db) => {
    const current = readRequiredRun(input.run_id, { db });

    if (isNonExecutingRunnerStatus(current.status)) {
      appendAutonomyRunLedgerEvent(
        buildAutonomyRunEventRecord({
          run_id: current.run_id,
          event_type: "tick_skipped",
          status: "skipped",
          message: `Tick skipped because run status is ${current.status}.`,
          payload: {
            status: current.status,
            cancelled_runs_do_not_execute_more_steps:
              current.status === "cancelled",
            paused_runs_do_not_progress_on_tick: current.status === "paused",
          },
          created_at: now,
        }),
        { db },
      );
      return readRequiredRun(current.run_id, { db });
    }

    let run = current;
    if (run.status !== "running") {
      run = updateAutonomyRunLedgerFields(
        run.run_id,
        {
          status: "running",
          started_at: run.started_at ?? now,
          updated_at: now,
        },
        { db },
      );
      appendAutonomyRunLedgerEvent(
        buildAutonomyRunEventRecord({
          run_id: run.run_id,
          event_type: "run_started",
          status: "running",
          message:
            "Autonomy run started by explicit local tick invocation.",
          payload: {
            first_action_is_internal: true,
            no_provider_github_codex_external_call: true,
          },
          created_at: now,
        }),
        { db },
      );
    }

    const nextStep = findNextExecutableStep(run.steps);
    if (!nextStep) {
      return finishRunIfAllStepsComplete(run, now, { db });
    }
    if (!isSafeRunnerStepAction(nextStep.action_kind)) {
      return markRunNeedsReview({
        run,
        now,
        reason: "model_gateway_step_requires_explicit_policy_run_service",
        dbOptions: { db },
      });
    }

    const completedStepCount = run.steps.filter(
      (step) => step.status === "completed",
    ).length;
    if (completedStepCount >= run.budget_snapshot.max_iterations) {
      return markRunNeedsReview({
        run,
        now,
        reason: "iteration_budget_exhausted_before_next_step",
        dbOptions: { db },
      });
    }

    updateAutonomyRunStepLedgerFields(
      nextStep.step_id,
      {
        status: "running",
        started_at: nextStep.started_at ?? now,
        updated_at: now,
      },
      { db },
    );
    appendAutonomyRunLedgerEvent(
      buildAutonomyRunEventRecord({
        run_id: run.run_id,
        step_id: nextStep.step_id,
        event_type: "step_started",
        status: "running",
        message: `Runner step started: ${nextStep.action_kind}.`,
        payload: {
          action_kind: nextStep.action_kind,
          external_call_authority: false,
        },
        created_at: now,
      }),
      { db },
    );

    const output = executeSafeInternalStep(run, nextStep, now);
    updateAutonomyRunStepLedgerFields(
      nextStep.step_id,
      {
        status: "completed",
        finished_at: now,
        output,
        updated_at: now,
      },
      { db },
    );
    appendAutonomyRunLedgerEvent(
      buildAutonomyRunEventRecord({
        run_id: run.run_id,
        step_id: nextStep.step_id,
        event_type: "step_completed",
        status: "completed",
        message: `Runner step completed: ${nextStep.action_kind}.`,
        payload: output,
        created_at: now,
      }),
      { db },
    );

    run = updateAutonomyRunLedgerFields(
      run.run_id,
      { status: "running", updated_at: now },
      { db },
    );
    return finishRunIfAllStepsComplete(run, now, { db });
  });
}

export function pauseAutonomyRun(input: RunLifecycleInput): AutonomyRunRecord {
  const now = input.now ?? nowIso();
  return withAutonomyRunnerLedgerDb(input, (db) => {
    const run = readRequiredRun(input.run_id, { db });
    if (isTerminalRunnerStatus(run.status)) {
      return run;
    }
    const updated = updateAutonomyRunLedgerFields(
      run.run_id,
      {
        status: "paused",
        updated_at: now,
        stop_reason: input.reason ?? "paused_by_local_operator",
      },
      { db },
    );
    appendAutonomyRunLedgerEvent(
      buildAutonomyRunEventRecord({
        run_id: run.run_id,
        event_type: "run_paused",
        status: "paused",
        message:
          "Autonomy run paused; ticks will not execute steps until resumed.",
        payload: { reason: input.reason ?? "paused_by_local_operator" },
        created_at: now,
      }),
      { db },
    );
    return updated;
  });
}

export function resumeAutonomyRun(input: RunLifecycleInput): AutonomyRunRecord {
  const now = input.now ?? nowIso();
  return withAutonomyRunnerLedgerDb(input, (db) => {
    const run = readRequiredRun(input.run_id, { db });
    if (run.status !== "paused") return run;
    const resumedStatus = run.started_at ? "running" : "planned";
    const updated = updateAutonomyRunLedgerFields(
      run.run_id,
      {
        status: resumedStatus,
        updated_at: now,
        stop_reason: null,
      },
      { db },
    );
    appendAutonomyRunLedgerEvent(
      buildAutonomyRunEventRecord({
        run_id: run.run_id,
        event_type: "run_resumed",
        status: resumedStatus,
        message:
          "Autonomy run resumed by local operator action; no step executes until tick.",
        payload: { resumed_status: resumedStatus },
        created_at: now,
      }),
      { db },
    );
    return updated;
  });
}

export function cancelAutonomyRun(input: RunLifecycleInput): AutonomyRunRecord {
  const now = input.now ?? nowIso();
  return withAutonomyRunnerLedgerDb(input, (db) => {
    const run = readRequiredRun(input.run_id, { db });
    if (run.status === "cancelled") return run;
    const updated = updateAutonomyRunLedgerFields(
      run.run_id,
      {
        status: "cancelled",
        finished_at: run.finished_at ?? now,
        updated_at: now,
        stop_reason: input.reason ?? "cancelled_by_local_operator",
      },
      { db },
    );
    appendAutonomyRunLedgerEvent(
      buildAutonomyRunEventRecord({
        run_id: run.run_id,
        event_type: "run_cancelled",
        status: "cancelled",
        message:
          "Autonomy run cancelled; future ticks will not execute additional steps.",
        payload: { reason: input.reason ?? "cancelled_by_local_operator" },
        created_at: now,
      }),
      { db },
    );
    return updated;
  });
}

export function recoverDeltaBatchForRun(
  input: RunLifecycleInput,
): RecoveredAutonomyDeltaBatch {
  const now = input.now ?? nowIso();
  return withAutonomyRunnerLedgerDb(input, (db) => {
    const run = readRequiredRun(input.run_id, { db });
    if (!["completed", "needs_review", "blocked"].includes(run.status)) {
      throw new Error(
        `delta_batch_recovery_requires_completed_or_needs_review_run:${run.status}`,
      );
    }

    const batch = buildRecoveredDeltaBatchForRun(run, now);
    insertAutonomyRunDeltaBatchLedgerRecord(batch, { db });
    appendAutonomyRunLedgerEvent(
      buildAutonomyRunEventRecord({
        run_id: run.run_id,
        event_type: "delta_batch_recovered",
        status: batch.status,
        message:
          "Recovered DeltaBatch written to runner ledger for local readback.",
        payload: {
          batch_id: batch.batch_id,
          delta_count: batch.delta_count,
          durable_perspective_apply: false,
          memory_mutation: false,
        },
        created_at: now,
      }),
      { db },
    );
    updateAutonomyRunLedgerFields(run.run_id, { updated_at: now }, { db });
    return batch;
  });
}

export function readRecoveredDeltaBatch(
  batchId: string,
  options: AutonomyRunnerLedgerDbOptions = {},
): RecoveredAutonomyDeltaBatch | null {
  return readAutonomyRunDeltaBatchLedgerRecord(batchId, options);
}

function finishRunIfAllStepsComplete(
  run: AutonomyRunRecord,
  now: string,
  options: AutonomyRunnerLedgerDbOptions,
): AutonomyRunRecord {
  const latest = readRequiredRun(run.run_id, options);
  const allCompleted = latest.steps.every((step) => step.status === "completed");
  if (!allCompleted) return latest;
  if (latest.status === "completed") return latest;

  const updated = updateAutonomyRunLedgerFields(
    latest.run_id,
    {
      status: "completed",
      finished_at: latest.finished_at ?? now,
      updated_at: now,
      stop_reason: "deterministic_local_runner_steps_completed",
    },
    options,
  );
  appendAutonomyRunLedgerEvent(
    buildAutonomyRunEventRecord({
      run_id: latest.run_id,
      event_type: "run_completed",
      status: "completed",
      message:
        "Autonomy run completed deterministic local steps; DeltaBatch recovery is available.",
      payload: {
        completed_step_count: latest.steps.length,
        delta_batch_recovery_available: true,
      },
      created_at: now,
    }),
    options,
  );
  return updated;
}

function markRunNeedsReview({
  run,
  now,
  reason,
  dbOptions,
}: {
  run: AutonomyRunRecord;
  now: string;
  reason: string;
  dbOptions: AutonomyRunnerLedgerDbOptions;
}): AutonomyRunRecord {
  const updated = updateAutonomyRunLedgerFields(
    run.run_id,
    {
      status: "needs_review",
      finished_at: run.finished_at ?? now,
      updated_at: now,
      stop_reason: reason,
    },
    dbOptions,
  );
  appendAutonomyRunLedgerEvent(
    buildAutonomyRunEventRecord({
      run_id: run.run_id,
      event_type: "run_needs_review",
      status: "needs_review",
      message: `Autonomy run needs review: ${reason}.`,
      payload: { reason },
      created_at: now,
    }),
    dbOptions,
  );
  return updated;
}

function executeSafeInternalStep(
  run: AutonomyRunRecord,
  step: AutonomyRunStepRecord,
  executedAt: string,
) {
  const common = {
    executed_at: executedAt,
    run_id: run.run_id,
    action_kind: step.action_kind,
    provider_calls: 0,
    openai_calls: 0,
    github_calls: 0,
    codex_executions: 0,
    external_posts: 0,
    durable_memory_mutations: 0,
    durable_perspective_applies: 0,
    proof_or_evidence_writes: 0,
    branch_or_pr_creations_from_product_code: 0,
  };

  if (step.action_kind === "recover_preflight_delta_batch") {
    return {
      ...common,
      recovered_preflight_refs: run.source_refs.preflight_refs,
      recovery_mode: "local_runner_ledger_review_candidate",
      delta_batch_written_now: false,
    };
  }

  if (step.action_kind === "generate_runner_status_delta_batch") {
    return {
      ...common,
      delta_batch_recovery_available: true,
      delta_batch_write_deferred_to_recoverDeltaBatchForRun: true,
      generated_delta_types: [
        "coordination_delta",
        "validation_delta",
        "agent_plan_delta",
        "handoff_delta",
      ],
    };
  }

  return {
    ...common,
    summary:
      "Local deterministic context summary recorded without external calls.",
    scope: run.scope,
    autonomy_contract_ref: run.autonomy_contract_ref,
    authority_boundary_snapshot: run.authority_boundary,
    budget_snapshot: run.budget_snapshot,
    source_refs: run.source_refs,
  };
}

function findNextExecutableStep(
  steps: AutonomyRunStepRecord[],
): AutonomyRunStepRecord | undefined {
  return steps.find((step) => step.status === "planned");
}

function readRequiredRun(
  runId: string,
  options: AutonomyRunnerLedgerDbOptions,
): AutonomyRunRecord {
  const run = readAutonomyRunLedgerRecord(runId, options);
  if (!run) throw new Error(`autonomy_run_not_found:${runId}`);
  return run;
}

function normalizeCreateAutonomyRunStatus(
  status: unknown,
  scheduledFor: string | null,
): "planned" | "scheduled" {
  if (status === undefined || status === null) {
    return scheduledFor ? "scheduled" : "planned";
  }
  if (status !== "planned" && status !== "scheduled") {
    throw new Error(`invalid_create_status:${String(status)}`);
  }
  if (status === "scheduled" && !scheduledFor) {
    throw new Error("scheduled_run_requires_scheduled_for");
  }
  return status;
}

function nowIso(): string {
  return new Date().toISOString();
}
