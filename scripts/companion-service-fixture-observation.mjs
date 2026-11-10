// Private native-fixture observations. Never serialize arbitrary CLI output:
// the same stream collector is also used by the one-time access issuer.
import { spawnSync } from "node:child_process";
import { closeSync, constants, fstatSync, openSync, readFileSync } from "node:fs";
import { readCompanionSupervisorFailureProvenance } from "../plugins/augnes-operator/mcp/companion-service-core.mjs";

export function collectFixtureCliResult(child) {
  return new Promise((resolve) => {
    let stdout = "", stderr = "", errorCode = null;
    child.stdout.on("data", chunk => { stdout += chunk; });
    child.stderr.on("data", chunk => { stderr += chunk; });
    child.once("error", error => { errorCode = safeErrorCode(error?.code); });
    // exit precedes pipe settlement; close covers spawn failure as well.
    child.once("close", (status, signal) => resolve({
      status, signal, stdout, stderr, spawn_error_code: errorCode,
      streams_closed: child.stdout.destroyed && child.stderr.destroyed,
    }));
  });
}

function safeErrorCode(code) {
  return ["ENOENT", "EACCES", "EPERM", "ELOOP", "EISDIR", "ETIMEDOUT", "ENOBUFS"].includes(code)
    ? code : "unknown";
}

export function readFixtureJson(file, read = readBoundedJson) {
  try {
    const value = read(file);
    return value && typeof value === "object" && !Array.isArray(value)
      ? { state: "available", value } : { state: "invalid" };
  } catch (error) {
    if (error?.code === "ENOENT") return { state: "absent" };
    if (error instanceof SyntaxError || error?.code === "fixture_json_invalid")
      return { state: "invalid" };
    return { state: "unreadable", error_code: safeErrorCode(error?.code) };
  }
}

function readBoundedJson(file) {
  let fd;
  try {
    fd = openSync(file, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.size > 1024 * 1024)
      throw Object.assign(new Error("invalid fixture observation"), { code: "fixture_json_invalid" });
    return JSON.parse(readFileSync(fd, "utf8"));
  } finally { if (fd !== undefined) closeSync(fd); }
}

const reason = value => typeof value === "string" && /^companion_service_[a-z0-9_]{1,100}$/u.test(value)
  ? value : null;
const pid = value => Number.isSafeInteger(value) && value > 0 ? value : null;

export function readFixtureManagerObservation(file, read) {
  const observation = readFixtureJson(file, read);
  if (observation.state !== "available") return observation;
  const v = observation.value;
  if (v.contract !== "augnes-companion-service.v0.1" || !pid(v.manager_pid))
    return { state: "invalid" };
  return {
    state: "available",
    status: ["starting", "live", "stopped", "failed", "maintenance", "recovery_required"].includes(v.status) ? v.status : "unknown",
    reason: reason(v.reason), manager_pid: pid(v.manager_pid), supervisor_pid: pid(v.supervisor_pid),
    supervisor_failure_provenance: readCompanionSupervisorFailureProvenance(v),
  };
}

export function observeFixtureLaunchJob(label, run = spawnSync) {
  const result = run("/bin/launchctl", ["print", `gui/${process.getuid()}/${label}`],
    { encoding: "utf8", timeout: 2_000, maxBuffer: 64 * 1024, stdio: ["ignore", "pipe", "pipe"] });
  if (result.error || result.signal) return { state: "unavailable", error_code: safeErrorCode(result.error?.code) };
  if (result.status === 113) return { state: "absent", exit_status: 113 };
  if (result.status !== 0) return { state: "unavailable", exit_status: result.status };
  const output = String(result.stdout ?? "");
  const scalar = key => output.match(new RegExp(`^\\s*${key} = (.+)$`, "mu"))?.[1] ?? null;
  const state = scalar("state"), managerPid = Number(scalar("pid"));
  return { state: "available", job_state: ["running", "waiting", "spawn scheduled", "not running"].includes(state) ? state : "unknown",
    pid: pid(managerPid), runs: /^\d+$/u.test(scalar("runs") ?? "") ? Number(scalar("runs")) : null,
    last_exit_code: /^-?\d+$/u.test(scalar("last exit code") ?? "") ? Number(scalar("last exit code")) : null };
}

export function fixtureProcessIdentity(processId, run = spawnSync) {
  // Match the service owner's birth-material observation. Inheriting TZ/locale
  // here hashes a different lstart for the same process under canonical tests.
  const result = run("/bin/ps", ["-o", "lstart=", "-o", "command=", "-p", String(processId)],
    { encoding: "utf8", timeout: 1_500, maxBuffer: 64 * 1024,
      env: { PATH: "/usr/bin:/bin" }, stdio: ["ignore", "pipe", "pipe"] });
  if (!result.error && !result.signal && result.status === 1 && !String(result.stdout ?? "").trim() && !String(result.stderr ?? "").trim()) return null;
  if (!result.error && !result.signal && result.status === 0 && String(result.stdout ?? "").trim())
    return result.stdout.trim();
  // Unknown observation must never satisfy an owned-process absence assertion.
  throw new Error("native_process_observation_unavailable");
}

export function fixtureInstallFailureDiagnostic(result, managerObservation) {
  let refusal = { state: "absent" };
  if (result.stderr?.trim()) {
    try {
      const v = JSON.parse(result.stderr);
      refusal = v?.contract === "augnes-companion-service.v0.1" && v.result === "refused" && reason(v.reason)
        ? { state: "available", result: "refused", reason: reason(v.reason), cleanup_failed: v.cleanup_failed === true }
        : { state: "invalid" };
    } catch { refusal = { state: "invalid" }; }
  }
  return { exit_status: result.status, signal: result.signal, streams_closed: result.streams_closed,
    spawn_error_code: result.spawn_error_code, refusal, manager: managerObservation };
}
