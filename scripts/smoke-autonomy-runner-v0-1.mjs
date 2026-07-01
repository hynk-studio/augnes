#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const require = createRequire(import.meta.url);

const requiredFiles = [
  "lib/autonomy/runner.ts",
  "lib/autonomy/scheduler.ts",
  "app/api/autonomy/runs/route.ts",
  "app/api/autonomy/runs/[id]/route.ts",
  "scripts/smoke-autonomy-runner-v0-1.mjs",
  "types/autonomy-runner-execution.ts",
  "lib/autonomy/runner-ledger.ts",
  "lib/autonomy/runner-delta-batch.ts",
  "lib/autonomy/runner-state.ts",
  "fixtures/autonomy-runner.sample.v0.1.json",
  "docs/AUTONOMY_RUNNER_EXECUTION_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "lib/db/schema.sql",
  "package.json",
];

const requiredPublicStatuses = [
  "planned",
  "running",
  "paused",
  "blocked",
  "completed",
  "needs_review",
  "cancelled",
];

const requiredFunctions = [
  "createAutonomyRun",
  "getAutonomyRun",
  "listAutonomyRuns",
  "tickAutonomyRun",
  "pauseAutonomyRun",
  "resumeAutonomyRun",
  "cancelAutonomyRun",
  "recoverDeltaBatchForRun",
];

const requiredSchedulerFunctions = [
  "findDueAutonomyRuns",
  "runDueAutonomyRunsOnce",
  "runAutonomySchedulerWatch",
];

const productFilesToScan = [
  "lib/autonomy/runner.ts",
  "lib/autonomy/scheduler.ts",
  "lib/autonomy/runner-ledger.ts",
  "lib/autonomy/runner-delta-batch.ts",
  "lib/autonomy/runner-state.ts",
  "app/api/autonomy/runs/route.ts",
  "app/api/autonomy/runs/[id]/route.ts",
];

const forbiddenProductPatterns = [
  /\bfetch\s*\(/,
  /\bXMLHttpRequest\b/,
  /from\s+["'][^"']*openai[^"']*["']/i,
  /new\s+OpenAI\b/,
  /\bembeddings\.create\b/,
  /\boctokit\b/i,
  /\bcreatePullRequest\b/,
  /\bchild_process\b/,
  /\bspawn\s*\(/,
  /(?<!\.)\bexec\s*\(/,
  /\bapplyPerspective/i,
  /\bmutateMemory/i,
  /\brecordProof/i,
  /\bcreateEvidence/i,
  /\bgit\s+push\b/,
  /\bgit\s+commit\b/,
];

for (const file of requiredFiles) {
  assert(existsSync(file), `${file} must exist`);
}

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
assert.equal(
  packageJson.scripts["smoke:autonomy-runner-v0-1"],
  "node scripts/smoke-autonomy-runner-v0-1.mjs",
  "package.json must expose smoke:autonomy-runner-v0-1",
);

const fixture = JSON.parse(
  readFileSync("fixtures/autonomy-runner.sample.v0.1.json", "utf8"),
);
assert.equal(fixture.fixture_version, "autonomy_runner.sample.v0.1");
assert.deepEqual(fixture.required_public_statuses, requiredPublicStatuses);

const typeText = readFileSync("types/autonomy-runner-execution.ts", "utf8");
for (const status of requiredPublicStatuses) {
  assert(typeText.includes(`"${status}"`), `status ${status} must be exported`);
}

const runnerText = readFileSync("lib/autonomy/runner.ts", "utf8");
for (const fn of requiredFunctions) {
  assert(
    new RegExp(`export\\s+function\\s+${fn}\\b`).test(runnerText),
    `runner.ts must export ${fn}`,
  );
}

const schedulerText = readFileSync("lib/autonomy/scheduler.ts", "utf8");
for (const fn of requiredSchedulerFunctions) {
  assert(
    new RegExp(`export\\s+(?:async\\s+)?function\\s+${fn}\\b`).test(
      schedulerText,
    ),
    `scheduler.ts must export ${fn}`,
  );
}
assert(
  !/runAutonomySchedulerWatch\s*\(/.test(
    schedulerText.replace(/export\s+async\s+function\s+runAutonomySchedulerWatch\s*\(/, ""),
  ),
  "scheduler import must not call runAutonomySchedulerWatch",
);

for (const file of productFilesToScan) {
  const text = readFileSync(file, "utf8");
  for (const pattern of forbiddenProductPatterns) {
    assert(!pattern.test(text), `${file} must not match ${pattern}`);
  }
}

const docText = readFileSync("docs/AUTONOMY_RUNNER_EXECUTION_V0_1.md", "utf8");
for (const phrase of fixture.invariants) {
  assert(docText.includes(phrase), `doc must preserve invariant: ${phrase}`);
}
for (const table of [
  "autonomy_runs",
  "autonomy_run_steps",
  "autonomy_run_events",
  "autonomy_run_delta_batches",
]) {
  assert(
    readFileSync("lib/db/schema.sql", "utf8").includes(table),
    `schema.sql must include ${table}`,
  );
}

const tempDir = join(tmpdir(), "augnes-autonomy-runner-v0-1");
const tempDbPath = join(tempDir, "runner.sqlite");
assert(tempDbPath.startsWith(tmpdir()), "smoke must use temp DB storage");
rmSync(tempDir, { recursive: true, force: true });
mkdirSync(tempDir, { recursive: true });

const behaviorScript = `
  import assert from "node:assert/strict";
  import {
    createAutonomyRun,
    getAutonomyRun,
    tickAutonomyRun,
    pauseAutonomyRun,
    resumeAutonomyRun,
    cancelAutonomyRun,
    recoverDeltaBatchForRun,
    readRecoveredDeltaBatch
  } from "./lib/autonomy/runner.ts";
  import {
    countAutonomyRunnerLedgerRows,
    readAutonomyRunDeltaBatchLedgerRecord
  } from "./lib/autonomy/runner-ledger.ts";

  async function main() {
  const dbPath = ${JSON.stringify(tempDbPath)};
  const scope = "project:augnes";
  const created = createAutonomyRun({
    dbPath,
    run_id: "autonomy_run.smoke.phase9.main",
    scope,
    autonomy_contract_ref: "autonomy_contract.smoke.phase8a",
    title: "Smoke local autonomy runner execution",
    created_at: "2026-07-02T00:00:00.000Z",
    budget_snapshot: { budget_id: "budget.smoke", max_iterations: 4 },
    source_refs: {
      autonomy_contract_refs: ["autonomy_contract.smoke.phase8a"],
      preflight_refs: ["autonomy_runner_preflight.smoke.phase9a"],
      docs_refs: ["docs/AUTONOMY_RUNNER_EXECUTION_V0_1.md"],
      repo_refs: ["hynk-studio/augnes"]
    }
  });
  assert.equal(created.status, "planned");
  assert.equal(created.steps.length, 2);

  const firstTick = tickAutonomyRun({
    dbPath,
    run_id: created.run_id,
    now: "2026-07-02T00:00:01.000Z"
  });
  assert.equal(firstTick.status, "running");
  assert.equal(firstTick.steps.filter((step) => step.status === "completed").length, 1);
  assert(firstTick.events.some((event) => event.event_type === "step_completed"));

  const secondTick = tickAutonomyRun({
    dbPath,
    run_id: created.run_id,
    now: "2026-07-02T00:00:02.000Z"
  });
  assert.equal(secondTick.status, "completed");
  assert.equal(secondTick.stop_reason, "deterministic_local_runner_steps_completed");
  assert.equal(secondTick.steps.filter((step) => step.status === "completed").length, 2);

  const recoveredBatch = recoverDeltaBatchForRun({
    dbPath,
    run_id: created.run_id,
    now: "2026-07-02T00:00:03.000Z"
  });
  assert.equal(recoveredBatch.run_id, created.run_id);
  assert.equal(recoveredBatch.batch_version, "autonomy_runner_delta_batch.v0.1");
  assert.equal(recoveredBatch.delta_count, 4);
  assert.deepEqual(
    recoveredBatch.deltas.map((delta) => delta.type).sort(),
    ["agent_plan_delta", "coordination_delta", "handoff_delta", "validation_delta"].sort()
  );
  assert.equal(recoveredBatch.authority_boundary.can_apply_project_perspective, false);
  assert.equal(recoveredBatch.authority_boundary.can_mutate_memory, false);
  assert.equal(recoveredBatch.authority_boundary.can_call_openai_or_provider, false);
  assert.equal(recoveredBatch.authority_boundary.can_call_github, false);
  assert.equal(recoveredBatch.authority_boundary.can_execute_codex, false);

  const readBack = readRecoveredDeltaBatch(recoveredBatch.batch_id, { dbPath });
  assert(readBack, "recovered DeltaBatch must read back through runner helper");
  assert.equal(readBack.batch_id, recoveredBatch.batch_id);
  assert.equal(readBack.delta_count, 4);
  const readBackFromLedger = readAutonomyRunDeltaBatchLedgerRecord(recoveredBatch.batch_id, { dbPath });
  assert(readBackFromLedger, "recovered DeltaBatch must read back through ledger helper");

  const pausedRun = createAutonomyRun({
    dbPath,
    run_id: "autonomy_run.smoke.phase9.paused",
    scope,
    created_at: "2026-07-02T00:01:00.000Z",
    planned_steps: [
      { step_id: "autonomy_run.smoke.phase9.paused.step.1", action_kind: "summarize_current_autonomy_context" }
    ]
  });
  pauseAutonomyRun({
    dbPath,
    run_id: pausedRun.run_id,
    now: "2026-07-02T00:01:01.000Z"
  });
  const pausedTick = tickAutonomyRun({
    dbPath,
    run_id: pausedRun.run_id,
    now: "2026-07-02T00:01:02.000Z"
  });
  assert.equal(pausedTick.status, "paused");
  assert.equal(pausedTick.steps.filter((step) => step.status === "completed").length, 0);
  assert(pausedTick.events.some((event) => event.event_type === "tick_skipped"));
  resumeAutonomyRun({
    dbPath,
    run_id: pausedRun.run_id,
    now: "2026-07-02T00:01:03.000Z"
  });
  const resumedTick = tickAutonomyRun({
    dbPath,
    run_id: pausedRun.run_id,
    now: "2026-07-02T00:01:04.000Z"
  });
  assert.equal(resumedTick.status, "completed");
  assert.equal(resumedTick.steps.filter((step) => step.status === "completed").length, 1);

  const cancelledRun = createAutonomyRun({
    dbPath,
    run_id: "autonomy_run.smoke.phase9.cancelled",
    scope,
    created_at: "2026-07-02T00:02:00.000Z",
    planned_steps: [
      { step_id: "autonomy_run.smoke.phase9.cancelled.step.1", action_kind: "summarize_current_autonomy_context" }
    ]
  });
  cancelAutonomyRun({
    dbPath,
    run_id: cancelledRun.run_id,
    now: "2026-07-02T00:02:01.000Z"
  });
  const cancelledTick = tickAutonomyRun({
    dbPath,
    run_id: cancelledRun.run_id,
    now: "2026-07-02T00:02:02.000Z"
  });
  assert.equal(cancelledTick.status, "cancelled");
  assert.equal(cancelledTick.steps.filter((step) => step.status === "completed").length, 0);

  const countsBeforeSchedulerImport = countAutonomyRunnerLedgerRows({ dbPath });
  const schedulerModule = await import("./lib/autonomy/scheduler.ts");
  const scheduler = schedulerModule.default ?? schedulerModule;
  const countsAfterSchedulerImport = countAutonomyRunnerLedgerRows({ dbPath });
  assert.deepEqual(
    countsAfterSchedulerImport,
    countsBeforeSchedulerImport,
    "importing scheduler must not auto-start watch mode or write ledger rows"
  );

  const scheduledRun = createAutonomyRun({
    dbPath,
    run_id: "autonomy_run.smoke.phase9.scheduled",
    scope,
    status: "scheduled",
    scheduled_for: "2026-07-02T00:03:00.000Z",
    created_at: "2026-07-02T00:02:59.000Z",
    planned_steps: [
      { step_id: "autonomy_run.smoke.phase9.scheduled.step.1", action_kind: "summarize_current_autonomy_context" }
    ]
  });
  const due = scheduler.findDueAutonomyRuns({
    dbPath,
    scope,
    now: "2026-07-02T00:03:00.000Z"
  });
  assert(due.some((run) => run.run_id === scheduledRun.run_id));
  const onceResult = scheduler.runDueAutonomyRunsOnce({
    dbPath,
    scope,
    now: "2026-07-02T00:03:00.000Z"
  });
  assert(onceResult.processed_runs.some((run) => run.run_id === scheduledRun.run_id));
  assert.equal(getAutonomyRun(scheduledRun.run_id, { dbPath })?.status, "completed");

  const watchRun = createAutonomyRun({
    dbPath,
    run_id: "autonomy_run.smoke.phase9.watch",
    scope,
    status: "scheduled",
    scheduled_for: "2026-07-02T00:04:00.000Z",
    created_at: "2026-07-02T00:03:59.000Z",
    planned_steps: [
      { step_id: "autonomy_run.smoke.phase9.watch.step.1", action_kind: "summarize_current_autonomy_context" }
    ]
  });
  const watchResult = await scheduler.runAutonomySchedulerWatch({
    dbPath,
    scope,
    now: "2026-07-02T00:04:00.000Z",
    interval_ms: 0,
    max_loops: 2
  });
  assert.equal(watchResult.loops, 2);
  assert.equal(watchResult.stop_reason, "max_loops");
  assert(watchResult.processed_runs.some((run) => run.run_id === watchRun.run_id));
  assert.equal(getAutonomyRun(watchRun.run_id, { dbPath })?.status, "completed");

  const finalCounts = countAutonomyRunnerLedgerRows({ dbPath });
  assert(finalCounts.autonomy_runs >= 5);
  assert(finalCounts.autonomy_run_steps >= 6);
  assert(finalCounts.autonomy_run_events >= 12);
  assert(finalCounts.autonomy_run_delta_batches >= 1);

  console.log(JSON.stringify({
    created_status: created.status,
    first_tick_status: firstTick.status,
    final_status: secondTick.status,
    completed_step_count: secondTick.steps.filter((step) => step.status === "completed").length,
    step_event_recorded: secondTick.events.some((event) => event.event_type === "step_completed"),
    recovered_batch_id: recoveredBatch.batch_id,
    recovered_delta_count: recoveredBatch.delta_count,
    readback_batch_id: readBack.batch_id,
    due_run_detected: due.some((run) => run.run_id === scheduledRun.run_id),
    due_run_processed_status: getAutonomyRun(scheduledRun.run_id, { dbPath })?.status,
    watch_loops: watchResult.loops,
    watch_processed_status: getAutonomyRun(watchRun.run_id, { dbPath })?.status,
    paused_tick_completed_steps: pausedTick.steps.filter((step) => step.status === "completed").length,
    cancelled_tick_completed_steps: cancelledTick.steps.filter((step) => step.status === "completed").length,
    scheduler_import_counts_unchanged: JSON.stringify(countsAfterSchedulerImport) === JSON.stringify(countsBeforeSchedulerImport),
    final_counts: finalCounts
  }));
  }

  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
`;

const behaviorOutput = execFileSync(
  "apps/augnes_apps/node_modules/.bin/tsx",
  ["--eval", behaviorScript],
  {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env, TSX_TSCONFIG_PATH: "tsconfig.json" },
  },
);
const behavior = JSON.parse(behaviorOutput);

assert.equal(behavior.created_status, "planned");
assert.equal(behavior.first_tick_status, "running");
assert.equal(behavior.final_status, "completed");
assert.equal(behavior.completed_step_count, 2);
assert.equal(behavior.step_event_recorded, true);
assert.equal(behavior.recovered_delta_count, 4);
assert.equal(behavior.readback_batch_id, behavior.recovered_batch_id);
assert.equal(behavior.due_run_detected, true);
assert.equal(behavior.due_run_processed_status, "completed");
assert.equal(behavior.watch_loops, 2);
assert.equal(behavior.watch_processed_status, "completed");
assert.equal(behavior.paused_tick_completed_steps, 0);
assert.equal(behavior.cancelled_tick_completed_steps, 0);
assert.equal(behavior.scheduler_import_counts_unchanged, true);

assertNoRows(tempDbPath, "perspective_memory_items");
assertNoRows(tempDbPath, "perspective_state_apply_events");
assertNoRows(tempDbPath, "perspective_states");
assertNoRows(tempDbPath, "verification_evidence_records");

console.log(
  JSON.stringify(
    {
      smoke: "autonomy-runner-v0-1",
      pass: true,
      temp_db_path: tempDbPath,
      required_files_checked: requiredFiles,
      public_statuses_checked: requiredPublicStatuses,
      runner_functions_checked: requiredFunctions,
      scheduler_functions_checked: requiredSchedulerFunctions,
      run_creation_checked: true,
      status_transition_checked: "planned -> running -> completed",
      scheduled_due_detection_checked: true,
      scheduled_due_processing_checked: true,
      bounded_watch_checked: true,
      pause_resume_cancel_checked: true,
      runner_step_executed_checked: true,
      step_event_recorded_checked: true,
      delta_batch_recovered_checked: true,
      delta_batch_readback_checked: true,
      no_provider_openai_github_codex_external_call_checked: true,
      no_durable_memory_mutation_checked: true,
      no_durable_project_perspective_auto_apply_checked: true,
      cancelled_runs_do_not_execute_more_steps_checked: true,
      paused_runs_do_not_execute_steps_on_tick_checked: true,
      scheduler_import_no_autostart_checked: true,
      final_counts: behavior.final_counts
    },
    null,
    2,
  ),
);
console.log("PASS smoke:autonomy-runner-v0-1");

function assertNoRows(dbPath, tableName) {
  const Database = require("better-sqlite3");
  const db = new Database(dbPath, { readonly: true, fileMustExist: true });
  try {
    const table = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get(tableName);
    if (!table) return;
    const row = db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get();
    assert.equal(row.count, 0, `${tableName} must not have rows`);
  } finally {
    db.close();
  }
}
