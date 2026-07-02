#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const require = createRequire(import.meta.url);

function resolveRootBin(binName) {
  const executableName = process.platform === "win32" ? `${binName}.cmd` : binName;
  const binPath = join(process.cwd(), "node_modules", ".bin", executableName);
  assert.ok(
    existsSync(binPath),
    `missing_root_bin:${binName}: run npm install from the repository root before running smoke:autonomy-runner-v0-1`,
  );
  return binPath;
}

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
const routeDbPath = "tmp/autonomy-runner-v0-1-route-scope.sqlite";
const createStatusDbPath = "tmp/autonomy-runner-v0-1-create-status.sqlite";
const spoofCreateDbPath = "tmp/autonomy-runner-v0-1-spoof-create.sqlite";
const spoofActionDbPath = "tmp/autonomy-runner-v0-1-spoof-action.sqlite";
const routeSmokeDbPaths = [
  routeDbPath,
  createStatusDbPath,
  spoofCreateDbPath,
  spoofActionDbPath,
];
assert(tempDbPath.startsWith(tmpdir()), "smoke must use temp DB storage");
rmSync(tempDir, { recursive: true, force: true });
mkdirSync(tempDir, { recursive: true });
mkdirSync("tmp", { recursive: true });
for (const dbPath of routeSmokeDbPaths) {
  rmSync(dbPath, { force: true });
}

const behaviorScript = `
  import assert from "node:assert/strict";
  import { POST as postCreateRun } from "./app/api/autonomy/runs/route.ts";
  import { POST as postRunAction } from "./app/api/autonomy/runs/[id]/route.ts";
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
  const routeDbPath = ${JSON.stringify(routeDbPath)};
  const createStatusDbPath = ${JSON.stringify(createStatusDbPath)};
  const spoofCreateDbPath = ${JSON.stringify(spoofCreateDbPath)};
  const spoofActionDbPath = ${JSON.stringify(spoofActionDbPath)};
  const scope = "project:augnes";

  const directCompletedStatusBefore = countAutonomyRunnerLedgerRows({ dbPath }).autonomy_runs;
  assert.throws(
    () => createAutonomyRun({
      dbPath,
      run_id: "autonomy_run.smoke.phase9.invalid_completed_status",
      scope,
      status: "completed",
      created_at: "2026-07-02T00:00:00.010Z"
    }),
    /invalid_create_status:completed/
  );
  const directCompletedStatusAfter = countAutonomyRunnerLedgerRows({ dbPath }).autonomy_runs;
  assert.equal(
    directCompletedStatusAfter,
    directCompletedStatusBefore,
    "completed create status must reject before writing rows"
  );

  const directBogusStatusBefore = countAutonomyRunnerLedgerRows({ dbPath }).autonomy_runs;
  assert.throws(
    () => createAutonomyRun({
      dbPath,
      run_id: "autonomy_run.smoke.phase9.invalid_bogus_status",
      scope,
      status: "bogus_status",
      created_at: "2026-07-02T00:00:00.020Z"
    }),
    /invalid_create_status:bogus_status/
  );
  const directBogusStatusAfter = countAutonomyRunnerLedgerRows({ dbPath }).autonomy_runs;
  assert.equal(
    directBogusStatusAfter,
    directBogusStatusBefore,
    "bogus create status must reject before writing rows"
  );

  assert.throws(
    () => createAutonomyRun({
      dbPath,
      run_id: "autonomy_run.smoke.phase9.scheduled_without_time",
      scope,
      status: "scheduled",
      created_at: "2026-07-02T00:00:00.030Z"
    }),
    /scheduled_run_requires_scheduled_for/
  );

  const invalidPostCreateResponse = await postCreateRun(
    new Request("http://localhost/api/autonomy/runs", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        host: "localhost",
        origin: "http://localhost",
        "sec-fetch-site": "same-origin"
      },
      body: JSON.stringify({
        run_id: "autonomy_run.smoke.phase9.route_invalid_completed_status",
        scope,
        status: "completed",
        db_path: createStatusDbPath,
        created_at: "2026-07-02T00:00:00.040Z"
      })
    })
  );
  const invalidPostCreateBody = await invalidPostCreateResponse.json();
  assert.equal(invalidPostCreateResponse.status, 400);
  assert.equal(invalidPostCreateBody.error_code, "invalid_create_status:completed");
  const invalidPostCreateRowsAfter = countAutonomyRunnerLedgerRows({ dbPath: createStatusDbPath }).autonomy_runs;
  assert.equal(
    invalidPostCreateRowsAfter,
    0,
    "invalid create route status must not write rows"
  );

  const validPostPlannedResponse = await postCreateRun(
    new Request("http://localhost/api/autonomy/runs", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        host: "localhost",
        origin: "http://localhost",
        "sec-fetch-site": "same-origin"
      },
      body: JSON.stringify({
        run_id: "autonomy_run.smoke.phase9.route_valid_planned",
        scope,
        status: "planned",
        db_path: createStatusDbPath,
        created_at: "2026-07-02T00:00:00.050Z"
      })
    })
  );
  const validPostPlannedBody = await validPostPlannedResponse.json();
  assert.equal(validPostPlannedResponse.status, 201);
  assert.equal(validPostPlannedBody.run.status, "planned");

  const validPostScheduledResponse = await postCreateRun(
    new Request("http://localhost/api/autonomy/runs", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        host: "localhost",
        origin: "http://localhost",
        "sec-fetch-site": "same-origin"
      },
      body: JSON.stringify({
        run_id: "autonomy_run.smoke.phase9.route_valid_scheduled",
        scope,
        status: "scheduled",
        scheduled_for: "2026-07-02T00:08:00.000Z",
        db_path: createStatusDbPath,
        created_at: "2026-07-02T00:00:00.060Z"
      })
    })
  );
  const validPostScheduledBody = await validPostScheduledResponse.json();
  assert.equal(validPostScheduledResponse.status, 201);
  assert.equal(validPostScheduledBody.run.status, "scheduled");

  const spoofedCreateResponse = await postCreateRun(
    new Request("http://remote.example/api/autonomy/runs", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        host: "remote.example",
        "x-forwarded-host": "localhost",
        origin: "http://localhost",
        "sec-fetch-site": "same-origin"
      },
      body: JSON.stringify({
        run_id: "autonomy_run.smoke.phase9.spoof_create",
        scope,
        status: "planned",
        db_path: spoofCreateDbPath,
        created_at: "2026-07-02T00:00:00.070Z"
      })
    })
  );
  const spoofedCreateBody = await spoofedCreateResponse.json();
  assert.equal(spoofedCreateResponse.status, 403);
  assert.equal(spoofedCreateBody.error_code, "local_operator_host_required");
  assert.equal(
    countAutonomyRunnerLedgerRows({ dbPath: spoofCreateDbPath }).autonomy_runs,
    0,
    "spoofed forwarded host create route must not write rows"
  );

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

  const duplicatePausedRun = createAutonomyRun({
    dbPath,
    run_id: "autonomy_run.smoke.phase9.duplicate_paused",
    scope,
    created_at: "2026-07-02T00:02:30.000Z",
    planned_steps: [
      { step_id: "autonomy_run.smoke.phase9.duplicate_paused.step.1", action_kind: "summarize_current_autonomy_context" }
    ]
  });
  pauseAutonomyRun({
    dbPath,
    run_id: duplicatePausedRun.run_id,
    now: "2026-07-02T00:02:31.000Z"
  });
  tickAutonomyRun({
    dbPath,
    run_id: duplicatePausedRun.run_id,
    now: "2026-07-02T00:02:32.000Z"
  });
  const duplicatePausedTick = tickAutonomyRun({
    dbPath,
    run_id: duplicatePausedRun.run_id,
    now: "2026-07-02T00:02:32.000Z"
  });
  const duplicateSkippedEvents = duplicatePausedTick.events.filter((event) => event.event_type === "tick_skipped");
  assert.equal(duplicateSkippedEvents.length, 2);
  assert.equal(new Set(duplicateSkippedEvents.map((event) => event.event_id)).size, 2);

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

  const defaultWatchRun = createAutonomyRun({
    dbPath,
    run_id: "autonomy_run.smoke.phase9.watch_default_steps",
    scope,
    status: "scheduled",
    scheduled_for: "2026-07-02T00:05:00.000Z",
    created_at: "2026-07-02T00:04:59.000Z"
  });
  assert.equal(defaultWatchRun.steps.length, 2);
  const defaultWatchResult = await scheduler.runAutonomySchedulerWatch({
    dbPath,
    scope,
    now: "2026-07-02T00:05:00.000Z",
    interval_ms: 0,
    max_loops: 4
  });
  assert(defaultWatchResult.processed_runs.some((run) => run.run_id === defaultWatchRun.run_id));
  const defaultWatchCompleted = getAutonomyRun(defaultWatchRun.run_id, { dbPath });
  assert(defaultWatchCompleted, "default scheduled watch run must still exist");
  assert(["completed", "needs_review"].includes(defaultWatchCompleted.status));
  assert.equal(defaultWatchCompleted.steps.filter((step) => step.status === "completed").length, 2);
  const defaultWatchBatch = recoverDeltaBatchForRun({
    dbPath,
    run_id: defaultWatchRun.run_id,
    now: "2026-07-02T00:05:04.000Z"
  });
  const defaultWatchReadBack = readRecoveredDeltaBatch(defaultWatchBatch.batch_id, { dbPath });
  assert(defaultWatchReadBack, "scheduled watch DeltaBatch must read back");
  assert.equal(defaultWatchReadBack.batch_id, defaultWatchBatch.batch_id);
  assert.equal(defaultWatchReadBack.run_id, defaultWatchRun.run_id);

  const preAbortedRun = createAutonomyRun({
    dbPath,
    run_id: "autonomy_run.smoke.phase9.pre_aborted_watch",
    scope,
    status: "scheduled",
    scheduled_for: "2026-07-02T00:06:00.000Z",
    created_at: "2026-07-02T00:05:59.000Z",
    planned_steps: [
      { step_id: "autonomy_run.smoke.phase9.pre_aborted_watch.step.1", action_kind: "summarize_current_autonomy_context" }
    ]
  });
  const abortController = new AbortController();
  abortController.abort();
  const preAbortedWatchResult = await scheduler.runAutonomySchedulerWatch({
    dbPath,
    scope,
    now: "2026-07-02T00:06:00.000Z",
    interval_ms: 0,
    max_loops: 4,
    signal: abortController.signal
  });
  const preAbortedAfter = getAutonomyRun(preAbortedRun.run_id, { dbPath });
  assert.equal(preAbortedWatchResult.loops, 0);
  assert.equal(preAbortedWatchResult.processed_run_count, 0);
  assert.equal(preAbortedWatchResult.stopped, true);
  assert.equal(preAbortedWatchResult.stop_reason, "abort_signal");
  assert.equal(preAbortedAfter?.status, "scheduled");
  assert.equal(preAbortedAfter?.steps.filter((step) => step.status === "completed").length, 0);

  const wrongScopeRun = createAutonomyRun({
    dbPath: routeDbPath,
    run_id: "autonomy_run.smoke.phase9.wrong_scope",
    scope: "project:not-augnes",
    created_at: "2026-07-02T00:07:00.000Z",
    planned_steps: [
      { step_id: "autonomy_run.smoke.phase9.wrong_scope.step.1", action_kind: "summarize_current_autonomy_context" }
    ]
  });
  const wrongScopeResponse = await postRunAction(
    new Request("http://localhost/api/autonomy/runs/" + encodeURIComponent(wrongScopeRun.run_id), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        host: "localhost",
        origin: "http://localhost",
        "sec-fetch-site": "same-origin"
      },
      body: JSON.stringify({
        action: "tick",
        db_path: routeDbPath,
        now: "2026-07-02T00:07:01.000Z"
      })
    }),
    { params: Promise.resolve({ id: encodeURIComponent(wrongScopeRun.run_id) }) }
  );
  const wrongScopeBody = await wrongScopeResponse.json();
  const wrongScopeAfter = getAutonomyRun(wrongScopeRun.run_id, { dbPath: routeDbPath });
  assert.equal(wrongScopeResponse.status, 400);
  assert.equal(wrongScopeBody.error_code, "invalid_scope");
  assert.equal(wrongScopeAfter?.status, "planned");
  assert.equal(wrongScopeAfter?.steps.filter((step) => step.status === "completed").length, 0);
  assert.equal(wrongScopeAfter?.events.length, 1);

  const spoofActionRun = createAutonomyRun({
    dbPath: spoofActionDbPath,
    run_id: "autonomy_run.smoke.phase9.spoof_action",
    scope,
    created_at: "2026-07-02T00:07:30.000Z",
    planned_steps: [
      { step_id: "autonomy_run.smoke.phase9.spoof_action.step.1", action_kind: "summarize_current_autonomy_context" }
    ]
  });
  const spoofedActionResponse = await postRunAction(
    new Request("http://remote.example/api/autonomy/runs/" + encodeURIComponent(spoofActionRun.run_id), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        host: "remote.example",
        "x-forwarded-host": "localhost",
        origin: "http://localhost",
        "sec-fetch-site": "same-origin"
      },
      body: JSON.stringify({
        action: "tick",
        db_path: spoofActionDbPath,
        now: "2026-07-02T00:07:31.000Z"
      })
    }),
    { params: Promise.resolve({ id: encodeURIComponent(spoofActionRun.run_id) }) }
  );
  const spoofedActionBody = await spoofedActionResponse.json();
  const spoofActionAfter = getAutonomyRun(spoofActionRun.run_id, { dbPath: spoofActionDbPath });
  assert.equal(spoofedActionResponse.status, 403);
  assert.equal(spoofedActionBody.error_code, "local_operator_host_required");
  assert.equal(spoofActionAfter?.status, "planned");
  assert.equal(spoofActionAfter?.steps.filter((step) => step.status === "completed").length, 0);
  assert.equal(spoofActionAfter?.events.length, 1);

  const finalCounts = countAutonomyRunnerLedgerRows({ dbPath });
  assert(finalCounts.autonomy_runs >= 8);
  assert(finalCounts.autonomy_run_steps >= 10);
  assert(finalCounts.autonomy_run_events >= 30);
  assert(finalCounts.autonomy_run_delta_batches >= 2);

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
    default_watch_loops: defaultWatchResult.loops,
    default_watch_processed: defaultWatchResult.processed_runs.some((run) => run.run_id === defaultWatchRun.run_id),
    default_watch_final_status: defaultWatchCompleted.status,
    default_watch_completed_step_count: defaultWatchCompleted.steps.filter((step) => step.status === "completed").length,
    default_watch_recovered_batch_id: defaultWatchBatch.batch_id,
    default_watch_readback_batch_id: defaultWatchReadBack.batch_id,
    pre_aborted_watch_loops: preAbortedWatchResult.loops,
    pre_aborted_watch_processed_count: preAbortedWatchResult.processed_run_count,
    pre_aborted_watch_stop_reason: preAbortedWatchResult.stop_reason,
    pre_aborted_run_status: preAbortedAfter?.status,
    pre_aborted_completed_steps: preAbortedAfter?.steps.filter((step) => step.status === "completed").length,
    duplicate_skipped_tick_count: duplicateSkippedEvents.length,
    duplicate_skipped_unique_event_ids: new Set(duplicateSkippedEvents.map((event) => event.event_id)).size,
    invalid_direct_completed_status_rejected_without_write: directCompletedStatusAfter === directCompletedStatusBefore,
    invalid_direct_bogus_status_rejected_without_write: directBogusStatusAfter === directBogusStatusBefore,
    invalid_post_create_status: invalidPostCreateResponse.status,
    invalid_post_create_error_code: invalidPostCreateBody.error_code,
    invalid_post_create_rows: invalidPostCreateRowsAfter,
    valid_post_planned_status: validPostPlannedBody.run.status,
    valid_post_scheduled_status: validPostScheduledBody.run.status,
    spoofed_create_status: spoofedCreateResponse.status,
    spoofed_create_error_code: spoofedCreateBody.error_code,
    spoofed_create_rows: countAutonomyRunnerLedgerRows({ dbPath: spoofCreateDbPath }).autonomy_runs,
    spoofed_action_status: spoofedActionResponse.status,
    spoofed_action_error_code: spoofedActionBody.error_code,
    spoofed_action_after_status: spoofActionAfter?.status,
    spoofed_action_after_completed_steps: spoofActionAfter?.steps.filter((step) => step.status === "completed").length,
    spoofed_action_after_event_count: spoofActionAfter?.events.length,
    wrong_scope_route_status: wrongScopeResponse.status,
    wrong_scope_error_code: wrongScopeBody.error_code,
    wrong_scope_after_status: wrongScopeAfter?.status,
    wrong_scope_after_completed_steps: wrongScopeAfter?.steps.filter((step) => step.status === "completed").length,
    wrong_scope_after_event_count: wrongScopeAfter?.events.length,
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
  resolveRootBin("tsx"),
  ["--eval", behaviorScript],
  {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env, TSX_TSCONFIG_PATH: "tsconfig.json" },
    shell: process.platform === "win32",
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
assert.equal(behavior.default_watch_processed, true);
assert.equal(behavior.default_watch_final_status, "completed");
assert.equal(behavior.default_watch_completed_step_count, 2);
assert.equal(
  behavior.default_watch_readback_batch_id,
  behavior.default_watch_recovered_batch_id,
);
assert.equal(behavior.pre_aborted_watch_loops, 0);
assert.equal(behavior.pre_aborted_watch_processed_count, 0);
assert.equal(behavior.pre_aborted_watch_stop_reason, "abort_signal");
assert.equal(behavior.pre_aborted_run_status, "scheduled");
assert.equal(behavior.pre_aborted_completed_steps, 0);
assert.equal(behavior.duplicate_skipped_tick_count, 2);
assert.equal(behavior.duplicate_skipped_unique_event_ids, 2);
assert.equal(behavior.invalid_direct_completed_status_rejected_without_write, true);
assert.equal(behavior.invalid_direct_bogus_status_rejected_without_write, true);
assert.equal(behavior.invalid_post_create_status, 400);
assert.equal(
  behavior.invalid_post_create_error_code,
  "invalid_create_status:completed",
);
assert.equal(behavior.invalid_post_create_rows, 0);
assert.equal(behavior.valid_post_planned_status, "planned");
assert.equal(behavior.valid_post_scheduled_status, "scheduled");
assert.equal(behavior.spoofed_create_status, 403);
assert.equal(behavior.spoofed_create_error_code, "local_operator_host_required");
assert.equal(behavior.spoofed_create_rows, 0);
assert.equal(behavior.spoofed_action_status, 403);
assert.equal(behavior.spoofed_action_error_code, "local_operator_host_required");
assert.equal(behavior.spoofed_action_after_status, "planned");
assert.equal(behavior.spoofed_action_after_completed_steps, 0);
assert.equal(behavior.spoofed_action_after_event_count, 1);
assert.equal(behavior.wrong_scope_route_status, 400);
assert.equal(behavior.wrong_scope_error_code, "invalid_scope");
assert.equal(behavior.wrong_scope_after_status, "planned");
assert.equal(behavior.wrong_scope_after_completed_steps, 0);
assert.equal(behavior.wrong_scope_after_event_count, 1);
assert.equal(behavior.paused_tick_completed_steps, 0);
assert.equal(behavior.cancelled_tick_completed_steps, 0);
assert.equal(behavior.scheduler_import_counts_unchanged, true);

assertNoRows(tempDbPath, "perspective_memory_items");
assertNoRows(tempDbPath, "perspective_state_apply_events");
assertNoRows(tempDbPath, "perspective_states");
assertNoRows(tempDbPath, "verification_evidence_records");
for (const dbPath of routeSmokeDbPaths) {
  rmSync(dbPath, { force: true });
}

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
      scheduled_default_multi_step_watch_checked: true,
      pause_resume_cancel_checked: true,
      runner_step_executed_checked: true,
      step_event_recorded_checked: true,
      delta_batch_recovered_checked: true,
      delta_batch_readback_checked: true,
      scheduled_watch_delta_batch_readback_checked: true,
      forwarded_host_spoof_create_rejected_checked: true,
      forwarded_host_spoof_action_rejected_checked: true,
      create_status_runtime_validation_checked: true,
      create_route_status_validation_checked: true,
      detail_route_wrong_scope_pre_mutation_guard_checked: true,
      pre_aborted_watch_noop_checked: true,
      duplicate_timestamp_event_ids_checked: true,
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
