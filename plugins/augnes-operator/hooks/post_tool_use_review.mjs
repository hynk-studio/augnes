const input = await readJsonFromStdin();
const toolName = stringValue(input.tool_name ?? input.toolName ?? input.name);
const hookEventName = stringValue(input.hook_event_name ?? input.hookEventName) || "PostToolUse";
const toolInputText = collectText(input.tool_input ?? input.toolInput ?? input.input).join("\n");
const outputText = collectText(
  input.tool_response ?? input.toolResponse ?? input.tool_output ?? input.toolOutput ?? input.output ?? input.result ?? input,
).join("\n");
const combinedText = `${toolInputText}\n${outputText}`.replace(/\s+/g, " ").trim();

const context = reviewContext(toolName, combinedText);
writeJson(
  context
    ? {
        hookSpecificOutput: {
          hookEventName,
          additionalContext: context,
        },
      }
    : {},
);

function reviewContext(toolNameValue, text) {
  if (!text) return "";
  if (!/^Bash$/i.test(toolNameValue) && !/\bnpm\s+run\b/i.test(text)) return "";

  const mentionsVerification = /\bnpm\s+run\s+(typecheck|smoke:[a-z0-9:-]+)\b/i.test(text);
  const looksPassed =
    mentionsVerification &&
    (/\bProcess exited with code 0\b/i.test(text) ||
      /\b(exit|exited|status|code)\s*[:=]?\s*0\b/i.test(text) ||
      /\bpassed\b/i.test(text));
  const looksFailed =
    /\bProcess exited with code [1-9]\d*\b/i.test(text) ||
    /\b(exit|exited|status|code)\s*[:=]?\s*[1-9]\d*\b/i.test(text) ||
    /\b(error|failed|failure|ELIFECYCLE|npm ERR!)\b/i.test(text);

  if (looksFailed) {
    return "Augnes operator review: command output suggests failure. Summarize the failure and keep it visible in Verification or Skipped checks.";
  }

  if (looksPassed) {
    return "Augnes operator review: verification appears to have passed. Consider recording evidence only if the local Augnes runtime and CODEX_WORK_ID are available; do not fabricate evidence IDs.";
  }

  return "";
}

function collectText(value) {
  if (typeof value === "string") return [value];
  if (value == null) return [];
  if (Array.isArray(value)) return value.flatMap((entry) => collectText(entry));
  if (typeof value === "object") return Object.values(value).flatMap((entry) => collectText(entry));
  return [String(value)];
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
