const SUPERVISOR_CONTRACT = "augnes-local-runtime-supervisor-v1";
const DEFAULT_MAX_LINES = 6;
const DEFAULT_MAX_CHARACTERS = 4_000;

export function createBrowserSupervisorPublicDiagnosticCapture({
  maxLines = DEFAULT_MAX_LINES,
  maxCharacters = DEFAULT_MAX_CHARACTERS,
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
      };
    },
  };
}
