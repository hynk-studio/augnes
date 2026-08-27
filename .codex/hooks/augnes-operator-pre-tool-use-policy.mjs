const input = await readJsonFromStdin();
const toolName = stringValue(input.tool_name ?? input.toolName ?? input.name);
const command = commandValue(input.tool_input ?? input.toolInput ?? input.input);

if (!/^(Bash|exec_command)$/i.test(toolName) || !command) {
  writeJson({});
} else {
  const denial = commandClauses(command)
    .map(findHighConfidenceDenial)
    .find(Boolean);
  writeJson(
    denial
      ? {
          hookSpecificOutput: {
            hookEventName: "PreToolUse",
            permissionDecision: "deny",
            permissionDecisionReason: denial,
          },
        }
      : {},
  );
}

function findHighConfidenceDenial(commandClause) {
  if (/^(?:env\s+)?gh\s+pr\s+merge\b/i.test(commandClause)) {
    return "Denied: Codex must not merge pull requests.";
  }
  if (/^(?:env\s+)?gh\s+pr\s+ready\b/i.test(commandClause)) {
    return "Denied: Codex must not mark pull requests ready for review.";
  }
  if (/^(?:env\s+)?gh\s+api\b.{0,220}(?:\/merge|enablePullRequestAutoMerge|auto-merge|autoMerge)\b/i.test(commandClause)) {
    return "Denied: direct GitHub merge or auto-merge mutation is outside Codex authority.";
  }
  if (/^(?:env\s+)?git\s+push\b[^\n]*(?:--force-with-lease|--force|-f)\b/i.test(commandClause)) {
    return "Denied: force-pushing is outside the Augnes operator boundary.";
  }
  if (/^(?:env\s+)?cat\s+\.env(?:\.local)?\b/i.test(commandClause)) {
    return "Denied: direct secret-file reads are not allowed.";
  }
  if (/^(?:env\s+)?printenv\s+(?:OPENAI_API_KEY|GITHUB_TOKEN|AUGNES_TOKEN|API_TOKEN|ACCESS_TOKEN)\b/i.test(commandClause)) {
    return "Denied: direct secret reads are not allowed.";
  }
  return "";
}

function commandClauses(command) {
  return command
    .split(/(?:\r?\n|&&|\|\||;)/u)
    .map((clause) => clause.trim())
    .filter(Boolean);
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
