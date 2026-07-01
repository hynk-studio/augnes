import {
  getAutonomyRun,
  listAutonomyRuns,
  tickAutonomyRun,
} from "./runner";
import type {
  AutonomyRunRecord,
  AutonomyRunSummary,
  AutonomyRunnerLedgerOptions,
} from "../../types/autonomy-runner-execution";

export interface FindDueAutonomyRunsInput extends AutonomyRunnerLedgerOptions {
  scope?: string;
  now?: string;
  limit?: number;
}

export interface RunDueAutonomyRunsOnceInput
  extends FindDueAutonomyRunsInput {}

export interface RunDueAutonomyRunsOnceResult {
  now: string;
  due_runs: AutonomyRunSummary[];
  processed_runs: AutonomyRunRecord[];
}

export interface RunAutonomySchedulerWatchInput
  extends RunDueAutonomyRunsOnceInput {
  interval_ms?: number;
  max_loops?: number;
  signal?: AbortSignal;
  handle_process_signals?: boolean;
}

export interface RunAutonomySchedulerWatchResult {
  now: string;
  loops: number;
  processed_run_count: number;
  stopped: boolean;
  stop_reason: "max_loops" | "abort_signal" | "process_signal";
  processed_runs: AutonomyRunRecord[];
}

export function findDueAutonomyRuns(
  input: FindDueAutonomyRunsInput = {},
): AutonomyRunSummary[] {
  const now = input.now ?? nowIso();
  const limit = input.limit ?? 100;
  const candidateRuns = [
    ...listAutonomyRuns({
      dbPath: input.dbPath,
      scope: input.scope,
      status: "planned",
      limit,
    }),
    ...listAutonomyRuns({
      dbPath: input.dbPath,
      scope: input.scope,
      status: "scheduled",
      limit,
    }),
  ];

  return candidateRuns
    .filter((run) => Boolean(run.scheduled_for))
    .filter((run) => String(run.scheduled_for) <= now)
    .sort((a, b) => {
      const scheduleCompare = String(a.scheduled_for).localeCompare(
        String(b.scheduled_for),
      );
      if (scheduleCompare !== 0) return scheduleCompare;
      return a.run_id.localeCompare(b.run_id);
    })
    .slice(0, limit);
}

export function runDueAutonomyRunsOnce(
  input: RunDueAutonomyRunsOnceInput = {},
): RunDueAutonomyRunsOnceResult {
  const now = input.now ?? nowIso();
  const dueRuns = findDueAutonomyRuns({ ...input, now });
  const processedRuns = dueRuns.map((run) =>
    tickAutonomyRun({ run_id: run.run_id, now, dbPath: input.dbPath }),
  );

  return {
    now,
    due_runs: dueRuns,
    processed_runs: processedRuns,
  };
}

export async function runAutonomySchedulerWatch(
  input: RunAutonomySchedulerWatchInput = {},
): Promise<RunAutonomySchedulerWatchResult> {
  const maxLoops = Math.max(1, input.max_loops ?? 1);
  const intervalMs = Math.max(0, input.interval_ms ?? 1_000);
  const processedRuns: AutonomyRunRecord[] = [];
  let loops = 0;
  let stopped = false;
  let stopReason: RunAutonomySchedulerWatchResult["stop_reason"] =
    "max_loops";

  const cleanupProcessSignalHandlers = input.handle_process_signals
    ? installProcessStopHandlers(() => {
        stopped = true;
        stopReason = "process_signal";
      })
    : () => {};

  const abortHandler = () => {
    stopped = true;
    stopReason = "abort_signal";
  };
  input.signal?.addEventListener("abort", abortHandler, { once: true });

  try {
    while (!stopped && loops < maxLoops) {
      loops += 1;
      const now = input.now ?? nowIso();
      const onceResult = runDueAutonomyRunsOnce({ ...input, now });
      processedRuns.push(...onceResult.processed_runs);

      if (stopped || loops >= maxLoops) break;
      await waitForInterval(intervalMs, input.signal);
    }
  } finally {
    input.signal?.removeEventListener("abort", abortHandler);
    cleanupProcessSignalHandlers();
  }

  return {
    now: input.now ?? nowIso(),
    loops,
    processed_run_count: processedRuns.length,
    stopped,
    stop_reason: stopReason,
    processed_runs: processedRuns.map((run) =>
      getAutonomyRun(run.run_id, { dbPath: input.dbPath }) ?? run,
    ),
  };
}

function waitForInterval(intervalMs: number, signal: AbortSignal | undefined) {
  if (intervalMs === 0) return Promise.resolve();
  return new Promise<void>((resolve) => {
    if (signal?.aborted) {
      resolve();
      return;
    }
    const timeout = setTimeout(resolve, intervalMs);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timeout);
        resolve();
      },
      { once: true },
    );
  });
}

function installProcessStopHandlers(onStop: () => void): () => void {
  const processLike = globalThis.process;
  if (!processLike?.on || !processLike?.off) return () => {};

  const handleSignal = () => onStop();
  processLike.on("SIGINT", handleSignal);
  processLike.on("SIGTERM", handleSignal);
  return () => {
    processLike.off("SIGINT", handleSignal);
    processLike.off("SIGTERM", handleSignal);
  };
}

function nowIso(): string {
  return new Date().toISOString();
}
