const input = await readJsonFromStdin();

const reminder = [
  "Augnes operator guardrails:",
  "- Read AGENTS.md and task-relevant Augnes docs before editing.",
  "- Use npm run codex:read-brief to read the current-project GuideBrief v0.2 when the local Augnes runtime is available; an optional Work Brief remains separate.",
  "- For resume/continue/current-state requests about the current local repository, call augnes_resume_repository with repositoryRoot equal to the exact absolute current working directory from the environment context as the first tool action, before reading repository files, docs, memory, or skills.",
  "- If that tool is unavailable or does not return one verified live Companion with exact repository resolution, stop without inspecting or changing repository files; do not reconstruct continuity from docs, memory, skills, fixtures, names, remotes, or Browser selection.",
  "- For future repository execution preparation, call augnes_prepare_repository_execution with repositoryRoot equal to that same exact absolute current working directory; Browser selection is non-binding, while legacy adoption, root rebind, and revocation require one exact decision grant confirmed in Augnes Browser project settings.",
  "- Preserve concrete skipped reasons; do not fabricate work, evidence, action, session, or PR IDs.",
  "- Prefer proof-only closeout with npm run codex:record-completion-proof when runtime and CODEX_WORK_ID are available.",
  "- Codex may edit files and open PRs through normal GitHub workflow, but never merge PRs, enable auto-merge, or claim merge authority.",
  "- Proof is not approval; a PR is not merge authority.",
].join("\n");

if (input.__malformed) {
  writeJson({
    systemMessage: "Augnes operator SessionStart input was malformed; continuing with safe guardrail reminders.",
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: reminder,
    },
  });
} else {
  writeJson({
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: reminder,
    },
  });
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
