const input = await readJsonFromStdin();
const toolName = stringValue(input.tool_name ?? input.toolName ?? input.name);
const hookEventName = stringValue(input.hook_event_name ?? input.hookEventName) || "PreToolUse";
const toolText = collectText(input.tool_input ?? input.toolInput ?? input.input ?? input).join("\n");
const normalizedText = toolText.replace(/\s+/g, " ").trim();

const denial = findDenial(toolName, normalizedText);

if (denial) {
  writeJson({
    hookSpecificOutput: {
      hookEventName,
      permissionDecision: "deny",
      permissionDecisionReason: denial,
    },
  });
} else {
  const warning = findAdditionalContext(toolName, normalizedText);
  writeJson(
    warning
      ? {
          hookSpecificOutput: {
            hookEventName,
            additionalContext: warning,
          },
        }
      : {},
  );
}

function findDenial(toolNameValue, text) {
  if (!text) return null;

  if (/\bgh\s+pr\s+merge\b/i.test(text)) {
    return "Denied: Codex must not merge PRs or claim merge authority.";
  }

  if (/\bgh\s+api\b.{0,220}(\/merge|enablePullRequestAutoMerge|auto-merge|autoMerge)\b/i.test(text)) {
    return "Denied: GitHub API merge or auto-merge mutation is outside Codex authority.";
  }

  if (/\bgit\s+push\b[^\n]*(--force-with-lease|--force|-f)\b/i.test(text)) {
    return "Denied: force-pushing is outside the Augnes operator hook policy.";
  }

  if (looksLikeUnsafeAutoMergeEnablement(text)) {
    return "Denied: Codex must not enable auto-merge.";
  }

  if (looksLikeForbiddenRemoteMutation(text)) {
    return "Denied: remote merge, publish, approval, retry, or replay calls require explicit future Core-gated scope and user approval.";
  }

  if (looksLikeCoreGatedActuation(text) && process.env.AUGNES_ALLOW_CORE_GATED_ACTUATION !== "true") {
    return "Denied: approval, publication, retry, or replay routes require AUGNES_ALLOW_CORE_GATED_ACTUATION=true and explicit user/Core-gated scope.";
  }

  if (looksLikeSecretRead(text)) {
    return "Denied: direct secret reads are not allowed by the Augnes operator hook policy.";
  }

  if (looksLikeProofOrEvidenceRecording(text) && !hasCodexWorkId(text) && !looksLikeDryRunOrPreflight(text)) {
    return "Denied: proof/evidence recording requires CODEX_WORK_ID unless this is only a dry-run or preflight.";
  }

  if (/^mcp__/i.test(toolNameValue) && looksLikeCoreGatedActuation(text)) {
    return "Denied: MCP/App tool actuation requires explicit future Core-gated scope and user approval.";
  }

  return null;
}

function findAdditionalContext(toolNameValue, text) {
  if (!text) return "";

  if (/^mcp__/i.test(toolNameValue)) {
    return "Augnes operator reminder: MCP bridge calls are not Codex execution, merge authority, approval, or committed-state authority.";
  }

  if (/\bnpm\s+run\s+codex:record-completion-proof\b/i.test(text)) {
    return "Augnes operator reminder: proof-only closeout is review material, not approval or committed state.";
  }

  if (/\bnpm\s+run\s+codex:record-evidence\b/i.test(text)) {
    return "Augnes operator reminder: evidence rows are verification material, not approval or merge authority.";
  }

  return "";
}

function looksLikeForbiddenRemoteMutation(text) {
  const remoteToolPattern = /\b(curl|wget)\b.{0,240}(github\.com|api\.github\.com|\/api\/)/i;
  const fetchPattern = new RegExp("\\bf" + "etch\\s*\\(.{0,240}(github|/api/)", "i");
  const mutationTarget = /\b(merge|auto-merge|publish|publication|approval|approve|retry|replay)\b/i;
  return (remoteToolPattern.test(text) || fetchPattern.test(text)) && mutationTarget.test(text);
}

function looksLikeUnsafeAutoMergeEnablement(text) {
  const clauses = splitClauses(text);
  return clauses.some((clause) => hasPositiveAutoMergeEnablement(clause) && !isNegatedAutoMergeBoundary(clause));
}

function hasPositiveAutoMergeEnablement(clause) {
  const unsafePatterns = [
    /\b(enable|enabled|enabling|enables)\s+auto-merge\b/i,
    /\bauto-merge\s+(enable|enabled|on)\b/i,
    /\bcodex\b.{0,80}\benabled\s+auto-merge\b/i,
  ];
  return unsafePatterns.some((pattern) => pattern.test(clause));
}

function isNegatedAutoMergeBoundary(clause) {
  const negatedAction =
    /\b(must\s+never|never|must\s+not|may\s+not|does\s+not|do\s+not|doesn't|cannot|can't|can\s+not|should\s+not|will\s+not|is\s+not|not)\b.{0,80}\b(enable|enabled|enabling|enables)\s+auto-merge\b/i;
  const negatedAuthority =
    /\b(no|not|does\s+not|do\s+not|doesn't|must\s+not|may\s+not|never|cannot|can't|can\s+not|should\s+not|without)\b.{0,80}\b(codex\b.{0,80})?auto-merge\b.{0,80}\b(authority|grant|granted|enable|enabled|enables)\b/i;
  return negatedAction.test(clause) || negatedAuthority.test(clause);
}

function splitClauses(text) {
  return text
    .split(/[\n.;!?]/)
    .map((clause) => clause.trim())
    .filter(Boolean);
}

function looksLikeCoreGatedActuation(text) {
  if (looksLikeDryRunOrPreflight(text)) return false;
  return (
    /\/api\/[^"' ]*(publish|publication|approval|approve|retry|replay)/i.test(text) ||
    /\bnpm\s+run\s+codex:(actuation-gate|actuation-preview|actuation-rehearsal|github-comment-posting-command-preview)\b/i.test(text)
  );
}

function looksLikeSecretRead(text) {
  return (
    /\bcat\s+\.env(?:\.local)?\b/i.test(text) ||
    /\bgrep\b[^\n]*(OPENAI_API_KEY|GITHUB_TOKEN|AUGNES_TOKEN|API_TOKEN|ACCESS_TOKEN)[^\n]*\.env/i.test(text) ||
    /\bprintenv\s+(OPENAI_API_KEY|GITHUB_TOKEN|AUGNES_TOKEN|API_TOKEN|ACCESS_TOKEN)\b/i.test(text) ||
    /\becho\s+\$(OPENAI_API_KEY|GITHUB_TOKEN|AUGNES_TOKEN|API_TOKEN|ACCESS_TOKEN)\b/i.test(text)
  );
}

function looksLikeProofOrEvidenceRecording(text) {
  return /\bnpm\s+run\s+codex:(record-completion-proof|record-evidence)\b/i.test(text);
}

function hasCodexWorkId(text) {
  return Boolean(process.env.CODEX_WORK_ID) || commandHasInlineCodexWorkId(text);
}

function commandHasInlineCodexWorkId(text) {
  return /(?:^|\s)(?:env\s+)?CODEX_WORK_ID=(?:"[^"\s]+"|'[^'\s]+'|[^\s]+)/i.test(text);
}

function looksLikeDryRunOrPreflight(text) {
  return /\b(dry[_-]?run|preflight|codex:closeout-preflight)\b/i.test(text);
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
