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
  const clauses = [];
  let clauseStart = 0;
  let quote = "";
  let escaped = false;

  for (let index = 0; index < command.length; index += 1) {
    const character = command[index];

    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === "\\" && quote !== "'") {
      escaped = true;
      continue;
    }
    if (quote) {
      if (character === quote) quote = "";
      continue;
    }
    if (character === "'" || character === '"') {
      quote = character;
      continue;
    }

    const separatorLength = shellSeparatorLength(command, index);
    if (separatorLength === 0) continue;
    clauses.push(command.slice(clauseStart, index));
    index += separatorLength - 1;
    clauseStart = index + 1;
  }

  clauses.push(command.slice(clauseStart));
  return clauses.map((clause) => clause.trim()).filter(Boolean);
}

function shellSeparatorLength(command, index) {
  const character = command[index];
  if (character === ";" || character === "\n") return 1;
  if (character === "\r") return command[index + 1] === "\n" ? 2 : 1;
  if (character === "&" && command[index + 1] === "&") return 2;
  if (character === "|" && command[index + 1] === "|") return 2;
  return 0;
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
