const input = await readJsonFromStdin();

const reminder = [
  "Augnes operator guardrails:",
  "- Read AGENTS.md and task-relevant Augnes docs before editing.",
  "- Use npm run codex:read-brief when the local Augnes runtime is available.",
  "- Preserve concrete skipped reasons; do not fabricate work, evidence, action, session, or PR IDs.",
  "- Prefer proof-only closeout with npm run codex:record-completion-proof when runtime and CODEX_WORK_ID are available.",
  "- Codex may edit files and open PRs through normal GitHub workflow, but never merge PRs, enable auto-merge, or claim merge authority.",
  "- Proof is not approval; a PR is not merge authority.",
].join("\n");

if (input.__malformed) {
  writeJson({
    systemMessage: "Augnes operator SessionStart input was malformed; continuing with safe guardrail reminders.",
    additionalContext: reminder,
  });
} else {
  writeJson({ additionalContext: reminder });
}

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
