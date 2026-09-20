import { spawnSync } from "node:child_process";

const failed = (reason) => ({ status: "observation_failed", reason, pids: null });

// Test-owned observation only. Keep the existing ps deadline and matching scope;
// command lines never leave this reader or become ownership/signalling authority.
export function observeSupervisorProcesses({
  supervisorScript,
  platform = process.platform,
  ownPid = process.pid,
  runCommand = spawnSync,
}) {
  if (platform === "win32") {
    return { status: "not_applicable", reason: "windows_ps_not_applicable", pids: null };
  }
  let result;
  try {
    result = runCommand("ps", ["-axo", "pid=,command="], {
      encoding: "utf8",
      timeout: 2_000,
    });
  } catch (error) {
    return failed(error?.code === "ETIMEDOUT" ? "command_timeout" : "command_spawn_failed");
  }
  if (result?.error) {
    return failed(result.error.code === "ETIMEDOUT" ? "command_timeout" : "command_spawn_failed");
  }
  if (result?.signal) return failed("command_signalled");
  if (!Number.isInteger(result?.status)) return failed("command_status_unavailable");
  if (result.status !== 0) return failed("command_nonzero_exit");
  if (typeof result.stdout !== "string" || result.stdout.includes("\0")) {
    return failed("command_output_unusable");
  }

  const seen = new Set();
  const pids = [];
  for (const line of result.stdout.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const row = /^\s*(\d+)\s+(\S.*)$/.exec(line);
    if (!row) return failed("command_output_malformed");
    const pid = Number(row[1]);
    // PID zero is a legitimate non-user process row on some ps platforms.
    if (!Number.isSafeInteger(pid) || seen.has(pid)) return failed("command_output_malformed");
    seen.add(pid);
    if (row[2].includes(supervisorScript) && pid !== ownPid) {
      if (pid === 0) return failed("command_output_malformed");
      pids.push(pid);
    }
  }
  return { status: "observed", reason: null, pids: pids.sort((a, b) => a - b) };
}

const disposition = (observation) => ({
  status: observation.status,
  reason: observation.reason,
  count: observation.status === "observed" ? observation.pids.length : null,
});

export function compareSupervisorObservations(before, after) {
  const report = { before: disposition(before), after: disposition(after) };
  if (before.status === "observation_failed" || after.status === "observation_failed") {
    return { status: "observation_failed", reason: "required_observation_failed", ...report };
  }
  if (before.status === "not_applicable" && after.status === "not_applicable") {
    return { status: "not_applicable", reason: "windows_ps_not_applicable", ...report };
  }
  if (before.status !== "observed" || after.status !== "observed") {
    return { status: "observation_failed", reason: "observation_applicability_changed", ...report };
  }
  const added = after.pids.filter((pid) => !before.pids.includes(pid));
  const missing = before.pids.filter((pid) => !after.pids.includes(pid));
  return {
    status: added.length || missing.length ? "changed" : "preserved",
    reason: added.length || missing.length ? "supervisor_identities_changed" : null,
    ...report,
    added_count: added.length,
    missing_count: missing.length,
  };
}

// The actual suite and controlled regressions share this boundary. Cleanup runs
// even when the baseline cannot be observed; final observation happens after it.
// No PASS result escapes before cleanup and preservation have both settled.
export async function withSupervisorProcessPreservation({ observationOptions, run, cleanup }) {
  const errors = [];
  let before;
  let after;
  let value;
  try {
    before = observeSupervisorProcesses(observationOptions);
    if (before.status !== "observation_failed") value = await run();
  } catch (error) {
    errors.push(error);
  } finally {
    try {
      await cleanup();
    } catch (error) {
      errors.push(error);
    }
    try {
      after = observeSupervisorProcesses(observationOptions);
    } catch (error) {
      errors.push(error);
    }
  }
  let preservation;
  if (before && after) {
    preservation = compareSupervisorObservations(before, after);
    if (preservation.status === "observation_failed" || preservation.status === "changed") {
      const error = new Error(`ambient supervisor preservation failed: ${JSON.stringify(preservation)}`);
      error.code = preservation.status === "changed"
        ? "ambient_supervisor_identities_changed"
        : "ambient_supervisor_observation_failed";
      error.observation = preservation;
      errors.push(error);
    }
  }
  if (errors.length === 1) throw errors[0];
  if (errors.length > 1) {
    throw new AggregateError(errors, "runtime operability, cleanup or supervisor observation failed");
  }
  return { value, preservation };
}
