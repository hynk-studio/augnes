import { spawn } from "node:child_process";

import {
  registerOwnedChild,
  settleOwnedProcessAfterExit,
  terminateOwnedProcessTree,
} from "./test-harness-process-lifecycle.mjs";

export const DEFAULT_CANONICAL_CHILD_TIMEOUT_MS = 300_000;
export const DEFAULT_CANONICAL_HEARTBEAT_MS = 30_000;
export const DEFAULT_CANONICAL_TERM_GRACE_MS = 8_000;
export const DEFAULT_CANONICAL_KILL_GRACE_MS = 5_000;

export async function runCanonicalChild({
  suite,
  label,
  command,
  args,
  cwd,
  env,
  timeoutMs = DEFAULT_CANONICAL_CHILD_TIMEOUT_MS,
  heartbeatMs = DEFAULT_CANONICAL_HEARTBEAT_MS,
  termGraceMs = DEFAULT_CANONICAL_TERM_GRACE_MS,
  killGraceMs = DEFAULT_CANONICAL_KILL_GRACE_MS,
  stdout = process.stdout,
  stderr = process.stderr,
  log = (line) => console.log(line),
  onSpawn = () => {},
}) {
  const safeSuite = safeIdentifier(suite, "unknown");
  const safeLabel = safeText(label, "unnamed child");
  const startedAt = Date.now();
  log(
    `[canonical:${safeSuite}] child_start label=${JSON.stringify(safeLabel)} timeout_ms=${timeoutMs}`,
  );

  const owner = new Set();
  const child = spawn(command, args, {
    cwd,
    env,
    detached: process.platform !== "win32",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  const record = registerOwnedChild(owner, child, { label: safeLabel });
  onSpawn(record.pid);
  log(
    `[canonical:${safeSuite}] child_spawn label=${JSON.stringify(safeLabel)} pid=${record.pid ?? "unavailable"} wait=process_exit`,
  );
  child.stdout.on("data", (chunk) => stdout.write(chunk));
  child.stderr.on("data", (chunk) => stderr.write(chunk));

  let timedOut = false;
  let timeout;
  let heartbeat;
  const timeoutOutcome = new Promise((resolve) => {
    timeout = setTimeout(() => resolve({ kind: "timeout" }), timeoutMs);
  });
  if (heartbeatMs > 0) {
    heartbeat = setInterval(() => {
      log(
        `[canonical:${safeSuite}] child_active label=${JSON.stringify(safeLabel)} elapsed_ms=${Date.now() - startedAt} timeout_ms=${timeoutMs} exit_observed=${record.exited} stdout_closed=${record.stdoutClosed} stderr_closed=${record.stderrClosed} wait=${record.exited ? "stream_close_or_cleanup" : "process_exit"}`,
      );
    }, heartbeatMs);
  }

  let outcome;
  let cleanupResult = {
    term_sent: false,
    kill_sent: false,
    closed_during_drain: false,
    stdout_closed: false,
    stderr_closed: false,
    remaining_owned_processes: null,
  };
  let terminationReason = "natural_exit";
  try {
    outcome = await Promise.race([
      record.exitPromise.then((value) => ({ kind: "exited", value })),
      record.closePromise.then((value) => ({ kind: "closed", value })),
      timeoutOutcome,
    ]);
    if (outcome.kind === "timeout") {
      timedOut = true;
      terminationReason = "bounded_timeout";
      log(
        `[canonical:${safeSuite}] child_cleanup_start label=${JSON.stringify(safeLabel)} elapsed_ms=${Date.now() - startedAt} reason=bounded_timeout exit_observed=${record.exited} stdout_closed=${record.stdoutClosed} stderr_closed=${record.stderrClosed}`,
      );
      await terminateOwnedProcessTree(record, { termGraceMs, killGraceMs });
      outcome = { kind: "closed", value: await record.closePromise };
      cleanupResult = {
        term_sent: true,
        kill_sent: outcome.value.signal === "SIGKILL",
        closed_during_drain: false,
        stdout_closed: record.stdoutClosed,
        stderr_closed: record.stderrClosed,
        remaining_owned_processes: 0,
      };
      log(
        `[canonical:${safeSuite}] child_cleanup_result label=${JSON.stringify(safeLabel)} elapsed_ms=${Date.now() - startedAt} reason=bounded_timeout streams_closed=${record.stdoutClosed && record.stderrClosed} remaining_owned_processes=0`,
      );
    } else if (outcome.kind === "exited") {
      log(
        `[canonical:${safeSuite}] child_exit label=${JSON.stringify(safeLabel)} elapsed_ms=${Date.now() - startedAt} exit_code=${outcome.value.code ?? "null"} signal=${outcome.value.signal ?? "null"} stdout_closed=${record.stdoutClosed} stderr_closed=${record.stderrClosed}`,
      );
      log(
        `[canonical:${safeSuite}] child_cleanup_start label=${JSON.stringify(safeLabel)} elapsed_ms=${Date.now() - startedAt} reason=post_exit_settlement exit_observed=true stdout_closed=${record.stdoutClosed} stderr_closed=${record.stderrClosed}`,
      );
      cleanupResult = await settleOwnedProcessAfterExit(record, {
        termGraceMs,
        killGraceMs,
      });
      outcome = {
        kind: "closed",
        value: record.closeResult ?? outcome.value,
      };
      terminationReason = cleanupResult.term_sent
        ? "exited_with_owned_descendant_cleanup"
        : "natural_exit";
      log(
        `[canonical:${safeSuite}] child_cleanup_result label=${JSON.stringify(safeLabel)} elapsed_ms=${Date.now() - startedAt} reason=post_exit_settlement term_sent=${cleanupResult.term_sent} kill_sent=${cleanupResult.kill_sent} streams_closed=${cleanupResult.stdout_closed && cleanupResult.stderr_closed} remaining_owned_processes=${cleanupResult.remaining_owned_processes}`,
      );
    } else {
      log(
        `[canonical:${safeSuite}] child_cleanup_start label=${JSON.stringify(safeLabel)} elapsed_ms=${Date.now() - startedAt} reason=post_close_settlement exit_observed=${record.exited} stdout_closed=${record.stdoutClosed} stderr_closed=${record.stderrClosed}`,
      );
      cleanupResult = await settleOwnedProcessAfterExit(record, {
        termGraceMs,
        killGraceMs,
      });
      terminationReason = cleanupResult.term_sent
        ? "closed_with_owned_descendant_cleanup"
        : "natural_exit";
      log(
        `[canonical:${safeSuite}] child_cleanup_result label=${JSON.stringify(safeLabel)} elapsed_ms=${Date.now() - startedAt} reason=post_close_settlement term_sent=${cleanupResult.term_sent} kill_sent=${cleanupResult.kill_sent} streams_closed=${cleanupResult.stdout_closed && cleanupResult.stderr_closed} remaining_owned_processes=${cleanupResult.remaining_owned_processes}`,
      );
    }
  } finally {
    clearTimeout(timeout);
    clearInterval(heartbeat);
    child.stdout.removeAllListeners("data");
    child.stderr.removeAllListeners("data");
  }

  const durationMs = Date.now() - startedAt;
  const result = {
    label: safeLabel,
    exit_code: outcome.value.code,
    signal: outcome.value.signal,
    timed_out: timedOut,
    duration_ms: durationMs,
    spawn_error_code: record.spawnErrorCode,
    exit_observed: record.exited,
    streams_closed: record.stdoutClosed && record.stderrClosed,
    cleanup_started: timedOut || outcome.kind === "closed",
    cleanup_completed: record.closed,
    remaining_owned_processes: cleanupResult.remaining_owned_processes,
    termination_reason: terminationReason,
  };
  log(
    `[canonical:${safeSuite}] child_result label=${JSON.stringify(safeLabel)} duration_ms=${durationMs} exit_code=${result.exit_code ?? "null"} signal=${result.signal ?? "null"} timed_out=${timedOut} exit_observed=${result.exit_observed} streams_closed=${result.streams_closed} cleanup_completed=${result.cleanup_completed} remaining_owned_processes=${result.remaining_owned_processes ?? "unknown"} termination_reason=${result.termination_reason}`,
  );
  return result;
}

export async function runCanonicalChildGroups({
  suite,
  groups,
  maxConcurrency,
  runChild = runCanonicalChild,
  log = (line) => console.log(line),
}) {
  const safeSuite = safeIdentifier(suite, "unknown");
  assertConcurrentGroupInput(groups, maxConcurrency);
  const resultsByLabel = new Map();
  const issues = [];
  let nextGroupIndex = 0;
  let activeGroups = 0;
  let completedGroups = 0;

  await new Promise((resolve) => {
    const launch = () => {
      while (
        activeGroups < maxConcurrency &&
        nextGroupIndex < groups.length
      ) {
        const groupIndex = nextGroupIndex;
        const group = groups[groupIndex];
        nextGroupIndex += 1;
        activeGroups += 1;
        void runGroup(group, groupIndex).finally(() => {
          activeGroups -= 1;
          completedGroups += 1;
          if (completedGroups === groups.length) resolve();
          else launch();
        });
      }
    };

    const runGroup = async (group, groupIndex) => {
      const groupId = safeIdentifier(group.id, `group-${groupIndex + 1}`);
      const startedAt = Date.now();
      log(
        `[canonical:${safeSuite}] group_start group=${groupId} child_count=${group.children.length}`,
      );
      for (const child of group.children) {
        let result;
        try {
          result = await runChild(child);
        } catch (error) {
          issues.push({
            code: "child_runner_rejected",
            group: groupId,
            label: safeText(child.label, "unnamed child"),
            detail:
              error instanceof Error
                ? safeIdentifier(error.code, "runner_error")
                : "runner_error",
          });
          continue;
        }
        const expectedLabel = safeText(child.label, "unnamed child");
        if (!result || typeof result !== "object") {
          issues.push({
            code: "child_result_missing",
            group: groupId,
            label: expectedLabel,
          });
          continue;
        }
        if (result.label !== expectedLabel) {
          issues.push({
            code: "child_result_conflicting_label",
            group: groupId,
            label: expectedLabel,
          });
          continue;
        }
        if (resultsByLabel.has(expectedLabel)) {
          issues.push({
            code: "child_result_duplicate",
            group: groupId,
            label: expectedLabel,
          });
          continue;
        }
        resultsByLabel.set(expectedLabel, {
          ...result,
          group: groupId,
        });
      }
      log(
        `[canonical:${safeSuite}] group_result group=${groupId} duration_ms=${Date.now() - startedAt} results=${group.children.filter((child) => resultsByLabel.has(safeText(child.label, "unnamed child"))).length}/${group.children.length}`,
      );
    };

    launch();
  });

  const orderedResults = [];
  for (const group of groups) {
    for (const child of group.children) {
      const label = safeText(child.label, "unnamed child");
      const result = resultsByLabel.get(label);
      if (!result) {
        if (!issues.some((issue) => issue.label === label)) {
          issues.push({ code: "child_result_incomplete", group: group.id, label });
        }
        continue;
      }
      orderedResults.push(result);
      if (
        result.timed_out === true ||
        result.spawn_error_code ||
        result.exit_code !== 0
      ) {
        issues.push({
          code: result.timed_out
            ? "child_timed_out"
            : result.spawn_error_code
              ? "child_spawn_failed"
              : "child_failed",
          group: result.group,
          label,
        });
      }
    }
  }
  if (orderedResults.length !== groups.flatMap((group) => group.children).length) {
    issues.push({
      code: "concurrent_result_count_mismatch",
      group: "all",
      label: "all",
    });
  }
  if (issues.length > 0) {
    const error = new Error(
      `canonical concurrent group failed: suite=${safeSuite} issues=${issues
        .map((issue) => `${issue.code}:${safeIdentifier(issue.group, "group")}:${safeText(issue.label, "child")}`)
        .join(",")}`,
    );
    error.code = "canonical_concurrent_group_failed";
    error.canonicalResults = orderedResults;
    error.canonicalIssues = issues;
    throw error;
  }
  return orderedResults;
}

export function canonicalChildFailure(result, { suite, timeoutMs }) {
  const safeSuite = safeIdentifier(suite, "unknown");
  const safeLabel = safeText(result?.label, "unnamed child");
  let message;
  let code;
  if (result?.timed_out === true) {
    code = "canonical_child_timeout";
    message = `canonical child timed out: suite=${safeSuite} label=${safeLabel} timeout_ms=${timeoutMs}`;
  } else if (result?.spawn_error_code) {
    code = "canonical_child_spawn_failed";
    message = `canonical child spawn failed: suite=${safeSuite} label=${safeLabel} code=${safeIdentifier(result.spawn_error_code, "unknown")}`;
  } else {
    code = "canonical_child_failed";
    message = `canonical child failed: suite=${safeSuite} label=${safeLabel} exit_code=${result?.exit_code ?? "null"} signal=${safeIdentifier(result?.signal, "null")}`;
  }
  const error = new Error(message);
  error.code = code;
  error.canonicalResult = {
    label: safeLabel,
    exit_code: result?.exit_code ?? null,
    signal: safeIdentifier(result?.signal, "null"),
    timed_out: result?.timed_out === true,
    duration_ms: Number.isFinite(result?.duration_ms) ? result.duration_ms : null,
  };
  return error;
}

function safeIdentifier(value, fallback) {
  return typeof value === "string" && /^[a-zA-Z0-9_.:-]{1,80}$/.test(value)
    ? value
    : fallback;
}

function safeText(value, fallback) {
  if (typeof value !== "string" || value.length === 0) return fallback;
  return value.replace(/[^a-zA-Z0-9 _.,:()/-]/g, "?").slice(0, 160);
}

function assertConcurrentGroupInput(groups, maxConcurrency) {
  if (!Array.isArray(groups) || groups.length === 0) {
    throw new Error("canonical concurrent groups must be non-empty");
  }
  if (
    !Number.isInteger(maxConcurrency) ||
    maxConcurrency < 1 ||
    maxConcurrency > groups.length
  ) {
    throw new Error("canonical concurrent group bound is invalid");
  }
  const groupIds = new Set();
  const childLabels = new Set();
  for (const group of groups) {
    if (
      !group ||
      typeof group.id !== "string" ||
      safeIdentifier(group.id, "") !== group.id ||
      groupIds.has(group.id)
    ) {
      throw new Error("canonical concurrent group ownership is invalid");
    }
    groupIds.add(group.id);
    if (!Array.isArray(group.children) || group.children.length === 0) {
      throw new Error("canonical concurrent group must own at least one child");
    }
    for (const child of group.children) {
      const label = safeText(child?.label, "");
      if (!label || label !== child?.label || childLabels.has(label)) {
        throw new Error("canonical concurrent child ownership is invalid");
      }
      childLabels.add(label);
    }
  }
}
