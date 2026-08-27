const input = await readJsonFromStdin();
const toolName = stringValue(input.tool_name ?? input.toolName ?? input.name);
const command = commandValue(input.tool_input ?? input.toolInput ?? input.input);
const response = input.tool_response ?? input.toolResponse ?? input.tool_output ?? input.toolOutput ?? input.result;

if (!/^(Bash|exec_command)$/i.test(toolName) || !isVerificationCommand(command)) {
  writeJson({});
} else {
  const outcome = structuredOutcome(response);
  const additionalContext = outcome === "failed"
    ? "Augnes operator review: the structured command status reports a verification failure. Keep the failure visible in Verification or Skipped checks."
    : outcome === "passed"
      ? "Augnes operator review: the structured command status reports a verification pass. Record evidence only when the applicable runtime context is available."
      : "";
  writeJson(
    additionalContext
      ? {
          hookSpecificOutput: {
            hookEventName: "PostToolUse",
            additionalContext,
          },
        }
      : {},
  );
}

function isVerificationCommand(command) {
  return /\bnpm\s+run\s+(?:typecheck|build|test(?::[a-z0-9:-]+)?|smoke:[a-z0-9:-]+|verify:local:(?:quick|changed|full))\b/i.test(command);
}

function structuredOutcome(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "unknown";
  if (value.isError === true || value.ok === false || value.success === false) return "failed";
  if (value.isError === false || value.ok === true || value.success === true) return "passed";

  for (const key of ["exit_code", "exitCode", "status", "code"]) {
    const status = numericStatus(value[key]);
    if (status !== null) return status === 0 ? "passed" : "failed";
  }
  return "unknown";
}

function numericStatus(value) {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^\d+$/u.test(value)) return Number(value);
  return null;
}

function commandValue(value) {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  return stringValue(value.command ?? value.cmd);
}

function stringValue(value) {
  return typeof value === "string" ? value : "";
}

async function readJsonFromStdin() {
  const raw = await readStdin();
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

function writeJson(value) {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}
