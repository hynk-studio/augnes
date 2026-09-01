const input = await readJsonFromStdin();

const reminder = [
  "Augnes operator guardrails:",
  "- Read AGENTS.md and task-relevant Augnes docs before editing.",
  "- Ordinary source-first work does not require continuity or memory priming.",
  "- Explicit resume, continue, recovery, or current-state intent uses the reviewed Augnes Operator Companion lifecycle and repository-continuity owner; preserve unavailable or ambiguous results without fallback reconstruction.",
  "- Preserve the exact repository root, unrelated user work, concrete skipped reasons, and planner-selected exact-head verification.",
  "- Codex may implement and open a Draft PR, but never claim approval or merge authority.",
].join("\n");

writeJson({
  ...(input.__malformed
    ? { systemMessage: "Augnes operator SessionStart input was malformed; continuing with safe guardrail reminders." }
    : {}),
  hookSpecificOutput: {
    hookEventName: "SessionStart",
    additionalContext: reminder,
  },
});

async function readJsonFromStdin() {
  const raw = await readStdin();
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return { __malformed: true };
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
