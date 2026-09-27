const SUPERVISOR_CONTRACT = "augnes-local-runtime-supervisor-v1";
const DEFAULT_MAX_LINES = 6;
const DEFAULT_MAX_CHARACTERS = 4_000;

export function createBrowserSupervisorPublicDiagnosticCapture({
  maxLines = DEFAULT_MAX_LINES,
  maxCharacters = DEFAULT_MAX_CHARACTERS,
  onStartupObservation = () => {},
} = {}) {
  if (
    !Number.isSafeInteger(maxLines) ||
    maxLines < 1 ||
    !Number.isSafeInteger(maxCharacters) ||
    maxCharacters < 256
  ) {
    throw new Error("browser_supervisor_diagnostic_bounds_invalid");
  }

  let remainder = "";
  const entries = [];
  const startup = [];

  const acceptLine = (line) => {
    if (line.length === 0 || line.length > maxCharacters) return;
    try {
      const value = JSON.parse(line);
      if (
        value === null ||
        typeof value !== "object" ||
        Array.isArray(value) ||
        value.contract !== SUPERVISOR_CONTRACT
      ) {
        return;
      }
      if (value.command === "startup_diagnostic") {
        const observation = normalizeBrowserStartupObservation(value.startup_diagnostic);
        if (observation) {
          startup.push(observation); if (startup.length > 4) startup.shift();
          try { onStartupObservation(structuredClone(observation)); } catch { /* Observation cannot alter readiness. */ }
        }
        return;
      }
      entries.push({ line, value });
      while (entries.length > maxLines) entries.shift();
    } catch {
      // Only newline-delimited, already-public supervisor result objects qualify.
    }
  };

  const flush = () => {
    if (remainder.length > 0) acceptLine(remainder.trim());
    remainder = "";
  };

  return {
    append(chunk) {
      remainder = `${remainder}${String(chunk)}`.slice(-maxCharacters * 2);
      const lines = remainder.split("\n");
      remainder = lines.pop() ?? "";
      for (const line of lines) acceptLine(line.trim());
    },
    flush,
    diagnostic(
      /** @type {{ supervisorExitCode?: number | null, supervisorSignal?: string | null }} */
      { supervisorExitCode = null, supervisorSignal = null } = {},
    ) {
      flush();
      const last = entries.at(-1)?.value ?? null;
      const lastPreparing = [...entries]
        .reverse()
        .find((entry) => entry.value.database_state === "preparing")?.value;
      const lastRecovery = [...entries]
        .reverse()
        .find(
          (entry) =>
            entry.value.state === "recovery_required" ||
            entry.value.database_state === "recovery_required",
        )?.value;
      const lastChildFailure = [...entries]
        .reverse()
        .find(
          (entry) =>
            Number.isInteger(entry.value.child_exit_code) ||
            typeof entry.value.child_signal === "string",
        )?.value;
      const outputTail = entries
        .map((entry) => entry.line)
        .join("\n")
        .slice(-maxCharacters);

      return {
        last_supervisor_result_code:
          typeof last?.result === "string" ? last.result : null,
        last_public_reason_code:
          typeof last?.reason === "string" ? last.reason : null,
        database_state:
          typeof last?.database_state === "string"
            ? last.database_state
            : null,
        bootstrap_recovery_phase: lastRecovery
          ? "recovery_mode"
          : lastPreparing &&
              ["preparing", "failed"].includes(last?.database_state)
            ? "database_bootstrap"
            : "runtime_startup",
        child_exit_code: Number.isInteger(lastChildFailure?.child_exit_code)
          ? lastChildFailure.child_exit_code
          : null,
        child_signal:
          typeof lastChildFailure?.child_signal === "string"
            ? lastChildFailure.child_signal
            : null,
        supervisor_exit_code: Number.isInteger(supervisorExitCode)
          ? supervisorExitCode
          : null,
        supervisor_signal:
          typeof supervisorSignal === "string" ? supervisorSignal : null,
        public_supervisor_output_tail: outputTail,
        startup_observations: structuredClone(startup),
      };
    },
  };
}

const STARTUP_OUTCOMES = new Set(["ready", "http_error", "malformed_response", "not_ready", "runtime_instance_mismatch", "connection_failure", "request_timeout", "response_overflow", "transport_error"]);
const STARTUP_PROGRESS = new Set(["next_starting", "next_ready", "health_compiling", "health_compiled"]);
const integer = value => Number.isSafeInteger(value) && value >= 0 ? value : null;
const uuid = value => typeof value === "string" && /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/u.test(value) ? value : null;
const signal = value => ["SIGTERM", "SIGINT", "SIGKILL", "SIGABRT", "SIGSEGV"].includes(value) ? value : null;

// Test-only observation of the existing probes. No request, retry, timer,
// acceptance decision, raw output/body, private path or credential is added.
export function createBrowserStartupObservation({ generation_id, instance_id, role, deadline_ms, now = Date.now }) {
  const started = now();
  const counts = Object.fromEntries([...STARTUP_OUTCOMES].map(key => [key, 0]));
  const probes = [], progress = [];
  let attempts = 0, spawned = null;
  return {
    spawned() { spawned ??= now() - started; },
    append(chunk) {
      const text = String(chunk).slice(0, 4096).replace(/\u001b\[[0-9;]*m/gu, "");
      for (const [label, pattern] of [
        ["next_starting", /Starting\.\.\./u], ["next_ready", /Ready in /u],
        ["health_compiling", /Compiling \/api\/healthz/u], ["health_compiled", /Compiled \/api\/healthz/u],
      ]) if (pattern.test(text) && !progress.some(entry => entry.label === label)) progress.push({label, elapsed_ms: now() - started});
    },
    probe({ response, error, ready, duration_ms }) {
      let outcome;
      if (error) outcome = error?.message === "request timed out" ? "request_timeout"
        : error?.message === "control response exceeded limit" ? "response_overflow"
        : error instanceof SyntaxError ? "malformed_response"
        : ["ECONNREFUSED", "ECONNRESET", "EHOSTUNREACH", "ENETUNREACH"].includes(error?.code) ? "connection_failure" : "transport_error";
      else outcome = response?.statusCode !== 200 ? "http_error" : ready ? "ready"
        : response?.body === null || typeof response?.body !== "object" || Array.isArray(response.body) ? "malformed_response"
        : typeof response.body.runtime_instance_id === "string" && response.body.runtime_instance_id !== instance_id ? "runtime_instance_mismatch" : "not_ready";
      counts[outcome] += 1; attempts += 1;
      probes.push({outcome, elapsed_ms: now() - started, duration_ms, http_status: response?.statusCode ?? null});
      if (probes.length > 8) probes.shift();
    },
    snapshot(stage, result, exit = null) {
      return normalizeBrowserStartupObservation({generation_id, instance_id, role, deadline_ms,
        request_timeout_ms: 1500, probe_interval_ms: 150, stage, result, elapsed_ms: now() - started,
        spawn_elapsed_ms: spawned, exit_code: exit?.code ?? null, exit_signal: exit?.signal ?? null,
        exit_observed: exit !== null, attempts, omitted_probes: Math.max(0, attempts - probes.length), counts, probes, progress});
    },
  };
}

export function normalizeBrowserStartupObservation(value) {
  if (!value || !uuid(value.generation_id) || !uuid(value.instance_id) || !["ui", "bridge"].includes(value.role) ||
      !["readiness_finished", "child_exit", "after_owned_stop"].includes(value.stage)) return null;
  return {
    generation_id: uuid(value.generation_id), instance_id: uuid(value.instance_id), role: value.role,
    stage: value.stage, result: ["ready", "timeout", "shutdown", "spawn_failed", "collision", "child_exit", "required_child_exit"].includes(value.result) ? value.result : null,
    deadline_ms: integer(value.deadline_ms), request_timeout_ms: integer(value.request_timeout_ms), probe_interval_ms: integer(value.probe_interval_ms),
    elapsed_ms: integer(value.elapsed_ms), spawn_elapsed_ms: integer(value.spawn_elapsed_ms),
    exit_observed: value.exit_observed === true, exit_code: integer(value.exit_code), exit_signal: signal(value.exit_signal),
    attempts: integer(value.attempts), omitted_probes: integer(value.omitted_probes),
    counts: Object.fromEntries([...STARTUP_OUTCOMES].map(key => [key, integer(value.counts?.[key])])),
    probes: (Array.isArray(value.probes) ? value.probes : []).slice(-8).map(p => ({
      outcome: STARTUP_OUTCOMES.has(p?.outcome) ? p.outcome : null,
      elapsed_ms: integer(p?.elapsed_ms), duration_ms: integer(p?.duration_ms),
      http_status: Number.isInteger(p?.http_status) && p.http_status >= 100 && p.http_status <= 599 ? p.http_status : null,
    })),
    progress: (Array.isArray(value.progress) ? value.progress : []).slice(0,4).map(p => ({
      label: STARTUP_PROGRESS.has(p?.label) ? p.label : null, elapsed_ms: integer(p?.elapsed_ms),
    })),
    qualification: "bounded existing-probe observation; forwarded progress completeness unavailable",
  };
}
