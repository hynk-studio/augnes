import { spawn } from "node:child_process";

import {
  registerOwnedChild,
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
        `[canonical:${safeSuite}] child_active label=${JSON.stringify(safeLabel)} elapsed_ms=${Date.now() - startedAt} timeout_ms=${timeoutMs}`,
      );
    }, heartbeatMs);
  }

  let outcome;
  try {
    outcome = await Promise.race([
      record.closePromise.then((value) => ({ kind: "closed", value })),
      timeoutOutcome,
    ]);
    if (outcome.kind === "timeout") {
      timedOut = true;
      await terminateOwnedProcessTree(record, { termGraceMs, killGraceMs });
      outcome = { kind: "closed", value: await record.closePromise };
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
  };
  log(
    `[canonical:${safeSuite}] child_result label=${JSON.stringify(safeLabel)} duration_ms=${durationMs} exit_code=${result.exit_code ?? "null"} signal=${result.signal ?? "null"} timed_out=${timedOut}`,
  );
  return result;
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
