import { readFileSync } from "node:fs";

const knownFlags = new Set(["--strict", "--json", "--help", "--file"]);
const strict = process.argv.includes("--strict");

const parsedArgs = parseArgs(process.argv.slice(2));

if (parsedArgs.error) {
  const output = buildMalformedOutput(parsedArgs.error);
  writeJson(output);
  console.error(`Malformed input: ${parsedArgs.error}`);
  process.exit(2);
}

if (parsedArgs.help) {
  console.log(`Usage: npm run codex:handoff-preflight -- [--strict] [--json] [--file <path>]

Reads copied Codex Handoff Preview packet text from CODEX_HANDOFF_PACKET, a
file, or stdin and prints a deterministic JSON preflight report. The helper is
local only: it does not execute Codex, call Augnes, GitHub, OpenAI, or network
resources, record proof/evidence, mutate files, or mutate runtime state.`);
  process.exit(0);
}

const inputResult = readPacketInput(parsedArgs.filePath);

if (inputResult.error) {
  const output = buildMalformedOutput(inputResult.error);
  writeJson(output);
  console.error(`Malformed input: ${inputResult.error}`);
  process.exit(inputResult.exitCode ?? 2);
}

const packet = inputResult.packet.trim();
const checks = [];

addCoreChecks(packet, checks);
addAuthorityChecks(packet, checks);
addUnsafeInputChecks(packet, checks);

const summary = buildSummary(packet);
const hasFail = checks.some((check) => check.status === "fail");
const hasWarn = checks.some((check) => check.status === "warn");
const output = {
  ok: !hasFail,
  strict,
  summary,
  checks,
  recommended_next_step: recommendedNextStep(hasFail, hasWarn),
};

writeJson(output);

const nonPass = checks.filter((check) => check.status !== "pass");
if (nonPass.length > 0) {
  console.error(nonPass.map((check) => `${check.status.toUpperCase()}: ${check.id}: ${check.message}`).join("\n"));
}

process.exit(hasFail ? 1 : 0);

function parseArgs(args) {
  let filePath = null;
  let help = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--help") {
      help = true;
      continue;
    }
    if (arg === "--file") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        return { error: "--file requires a path" };
      }
      filePath = value;
      index += 1;
      continue;
    }
    if (arg.startsWith("--file=")) {
      const value = arg.slice("--file=".length).trim();
      if (!value) return { error: "--file requires a path" };
      filePath = value;
      continue;
    }
    if (arg.startsWith("--") && !knownFlags.has(arg)) {
      return { error: `Unknown flag: ${arg}` };
    }
  }

  return { filePath, help };
}

function readPacketInput(filePath) {
  const envPacket = clean(process.env.CODEX_HANDOFF_PACKET);
  if (envPacket) return { packet: envPacket };

  if (filePath) {
    try {
      return { packet: readFileSync(filePath, "utf8") };
    } catch (error) {
      return {
        error: `Unable to read --file path: ${error instanceof Error ? error.message : String(error)}`,
        exitCode: 2,
      };
    }
  }

  if (process.stdin.isTTY) {
    return { error: "Missing handoff packet input", exitCode: 2 };
  }

  let stdinText = "";
  try {
    stdinText = readFileSync(0, "utf8");
  } catch (error) {
    return {
      error: `Unable to read stdin: ${error instanceof Error ? error.message : String(error)}`,
      exitCode: 2,
    };
  }

  if (!clean(stdinText)) return { error: "Missing handoff packet input", exitCode: 2 };
  return { packet: stdinText };
}

function addCoreChecks(text, checks) {
  const runtimeValue = extractFieldValue(text, "AUGNES_API_BASE_URL");
  const hasRuntimePhrase = /provided by (?:current Augnes runtime|local operator)/i.test(text);
  const hasRuntime = Boolean(runtimeValue) || hasRuntimePhrase;
  checks.push({
    id: "runtime_reference",
    status: hasRuntime ? placeholderStatus(runtimeValue) : strict ? "fail" : "warn",
    message: hasRuntime
      ? placeholderStatus(runtimeValue) === "pass"
        ? "Current runtime reference is present."
        : "Current runtime reference is a placeholder; user/Core must provide the current runtime before Codex starts."
      : "Current runtime reference is missing.",
  });

  addFieldCheck({
    checks,
    id: "scope",
    label: "CODEX_SCOPE",
    value: extractFieldValue(text, "CODEX_SCOPE"),
    presentMessage: "CODEX_SCOPE is present.",
    missingMessage: "CODEX_SCOPE is missing.",
    placeholderMessage: "CODEX_SCOPE is a placeholder; user/Core must provide scope before Codex starts.",
  });

  addFieldCheck({
    checks,
    id: "work_id",
    label: "CODEX_WORK_ID",
    value: extractFieldValue(text, "CODEX_WORK_ID"),
    presentMessage: "CODEX_WORK_ID is present.",
    missingMessage: "CODEX_WORK_ID is missing.",
    placeholderMessage: "CODEX_WORK_ID is a placeholder; user/Core must provide a real work ID before Codex starts.",
  });

  const hasStartCommand = /\bnpm\s+run\s+codex:read-brief\b/.test(text);
  checks.push({
    id: "start_command",
    status: hasStartCommand ? "pass" : strict ? "fail" : "warn",
    message: hasStartCommand
      ? "Start command uses npm run codex:read-brief."
      : "Start command using npm run codex:read-brief is missing.",
  });

  addPresenceCheck({
    checks,
    id: "work_title",
    present: hasWorkItemField(text, ["Title", "Work title"], ["Work title"]),
    pass: "Work title is present.",
    warn: "Work title is missing.",
  });
  addPresenceCheck({
    checks,
    id: "work_status",
    present: hasWorkItemField(text, ["Status", "Work status"], ["Work status"]),
    pass: "Work status is present.",
    warn: "Work status is missing.",
  });
  addPresenceCheck({
    checks,
    id: "work_next_action",
    present: hasWorkItemField(text, ["Next action", "Work next action"], ["Work next action"]),
    pass: "Work next action is present.",
    warn: "Work next action is missing.",
  });

  addExpectedScopeCheck(checks, text, "expected_files", "Expected files", "No expected files are listed");
  addExpectedScopeCheck(checks, text, "expected_checks", "Expected checks", "No expected checks are listed");

  addAuthorizationCheck(checks, text, "evidence_authorization", "Evidence recording");
  addAuthorizationCheck(checks, text, "proof_authorization", "Proof-only closeout");
  addAuthorizationCheck(checks, text, "browser_verification", "Browser verification");

  addPresenceCheck({
    checks,
    id: "forbidden_actions",
    present: /Forbidden actions/i.test(text) || /No Codex execution|No commit\/reject state|No approve\/publish\/retry\/replay/i.test(text),
    pass: "Forbidden actions are present.",
    warn: "Forbidden actions are missing.",
  });
  addPresenceCheck({
    checks,
    id: "stop_conditions",
    present: /Stop conditions/i.test(text) && /codex:read-brief|Work ID is missing|Scope is missing|unknown/i.test(text),
    pass: "Stop conditions are present.",
    warn: "Stop conditions are missing or incomplete.",
  });
}

function addAuthorityChecks(text, checks) {
  const authorityPatterns = [
    ["authority_read_only", /read-only|preview\/copy packet|preview\/copy/i, "Read-only or preview/copy packet boundary is present."],
    ["authority_no_execute", /cannot execute Codex|not an execution action|does not execute Codex/i, "No Codex execution boundary is present."],
    ["authority_no_commit_reject", /cannot commit or reject|does not commit\/reject|commit\/reject/i, "No commit/reject state boundary is present."],
    ["authority_no_publish", /cannot approve, publish, retry, replay, or externally post|does not approve, publish, retry, replay|No approve\/publish\/retry\/replay/i, "No approve/publish/retry/replay/external-posting boundary is present."],
    ["authority_no_merge", /cannot merge or enable auto-merge|does not merge|No merge\/auto-merge/i, "No merge/auto-merge boundary is present."],
    ["authority_evidence_not_approval", /Evidence is not approval/i, "Evidence is not approval boundary is present."],
    ["authority_proof_not_approval", /Proof is not approval/i, "Proof is not approval boundary is present."],
    ["authority_pr_not_merge", /PR is not merge authority/i, "PR is not merge authority boundary is present."],
    ["authority_user_core_gated", /Durable approval remains user\/Core gated/i, "User/Core durable approval boundary is present."],
  ];

  for (const [id, pattern, pass] of authorityPatterns) {
    addPresenceCheck({
      checks,
      id,
      present: pattern.test(text),
      pass,
      warn: `${pass.replace(" is present.", "")} is missing.`,
    });
  }
}

function addUnsafeInputChecks(text, checks) {
  const forbiddenLabels = [
    "Run Codex",
    "Start Codex",
    "Execute Codex",
    "Launch Codex",
    "Send to Codex",
    "Merge PR",
    "Enable auto-merge",
    "Approve publication",
    "Publish now",
    "Commit state",
    "Record proof",
    "Record evidence",
  ];
  const presentForbiddenLabels = forbiddenLabels.filter((label) => text.includes(label));
  checks.push({
    id: "forbidden_labels",
    status: presentForbiddenLabels.length === 0 ? "pass" : "fail",
    message: presentForbiddenLabels.length === 0
      ? "No forbidden execution, approval, merge, proof, or evidence UI labels detected."
      : `Forbidden UI/control labels detected: ${presentForbiddenLabels.join(", ")}`,
  });

  const writeCommands = findWriteCommands(text);
  checks.push({
    id: "write_shell_commands",
    status: writeCommands.length === 0 ? "pass" : "fail",
    message: writeCommands.length === 0
      ? "No shell commands for write, approval, publication, merge, proof, evidence, or state mutation behavior detected."
      : `Unsafe shell command text detected: ${writeCommands.join("; ")}`,
  });

  const secretFindings = findSecretLikeValues(text);
  checks.push({
    id: "secret_like_values",
    status: secretFindings.length === 0 ? "pass" : "fail",
    message: secretFindings.length === 0
      ? "No obvious secret or token values detected."
      : `Obvious secret/token values detected: ${secretFindings.join(", ")}`,
  });

  const rawDbFinding = findRawDbFinding(text);
  checks.push({
    id: "raw_db_refs",
    status: rawDbFinding.status,
    message: rawDbFinding.message,
  });

  const demoDbFinding = findDemoDbFinding(text);
  checks.push({
    id: "demo_db_refs",
    status: demoDbFinding.status,
    message: demoDbFinding.message,
  });
}

function addFieldCheck({ checks, id, value, presentMessage, missingMessage, placeholderMessage }) {
  const status = value ? placeholderStatus(value) : strict ? "fail" : "warn";
  checks.push({
    id,
    status,
    message: value ? status === "pass" ? presentMessage : placeholderMessage : missingMessage,
  });
}

function addPresenceCheck({ checks, id, present, pass, warn }) {
  checks.push({
    id,
    status: present ? "pass" : strict ? "fail" : "warn",
    message: present ? pass : warn,
  });
}

function addExpectedScopeCheck(checks, text, id, heading, missingPhrase) {
  const listedItems = itemsAfterListLabel(text, heading).filter((item) => !new RegExp(missingPhrase, "i").test(item));
  const hasMissingStatement = new RegExp(missingPhrase, "i").test(text);
  const present = listedItems.length > 0;
  checks.push({
    id,
    status: present ? "pass" : strict ? "fail" : "warn",
    message: present
      ? `${heading} are listed.`
      : hasMissingStatement
        ? `${heading} are not listed; user/Core must confirm before Codex starts.`
        : `${heading} are missing.`,
  });
}

function addAuthorizationCheck(checks, text, id, label) {
  const value = extractLineFieldValue(text, label);
  const ambiguous = !value || /needs_user_core_confirmation|user\/Core confirmation|needs confirmation|ambiguous/i.test(value);
  checks.push({
    id,
    status: ambiguous ? strict ? "fail" : "warn" : "pass",
    message: !value
      ? `${label} setting is missing.`
      : ambiguous
        ? `${label} needs user/Core confirmation before Codex starts.`
        : `${label} setting is explicit.`,
  });
}

function buildSummary(text) {
  const runtimeValue = extractFieldValue(text, "AUGNES_API_BASE_URL");
  const hasRuntimePhrase = /provided by (?:current Augnes runtime|local operator)/i.test(text);
  return {
    has_runtime: Boolean(runtimeValue) || hasRuntimePhrase,
    has_scope: Boolean(extractFieldValue(text, "CODEX_SCOPE")),
    has_work_id: Boolean(extractFieldValue(text, "CODEX_WORK_ID")),
    has_start_command: /\bnpm\s+run\s+codex:read-brief\b/.test(text),
    readiness_status: extractReadinessStatus(text),
    task_profile: extractLineFieldValue(text, "Task profile"),
  };
}

function extractFieldValue(text, fieldName) {
  const escaped = escapeRegExp(fieldName);
  const assignment = new RegExp(`\\b${escaped}\\s*=\\s*([^\\s\\n]+)`).exec(text);
  if (assignment) return clean(stripQuotes(assignment[1]));

  const fieldLine = new RegExp(`\\b${escaped}\\s*:\\s*([^\\n]+)`).exec(text);
  if (fieldLine) return clean(stripBullet(fieldLine[1]));

  return null;
}

function extractLineFieldValue(text, label) {
  const escaped = escapeRegExp(label);
  const match = new RegExp(`(?:^|\\n)\\s*(?:[-*]\\s*)?${escaped}\\s*:\\s*([^\\n]+)`, "i").exec(text);
  return match ? clean(stripBullet(match[1])) : null;
}

function extractSectionLineFieldValue(text, sectionName, label) {
  const section = sectionText(text, sectionName);
  return section ? extractLineFieldValue(section, label) : null;
}

function extractTopLevelLineFieldValue(text, label) {
  let currentSection = null;

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (isKnownPacketSectionHeading(trimmed)) {
      currentSection = trimmed;
      continue;
    }
    if (currentSection) continue;

    const value = extractLineFieldValue(line, label);
    if (value) return value;
  }

  return null;
}

function extractReadinessStatus(text) {
  const readinessSection = sectionText(text, "Readiness");
  return extractLineFieldValue(readinessSection || text, "Status");
}

function hasWorkItemField(text, workItemLabels, explicitTopLevelLabels) {
  return (
    workItemLabels.some((label) => Boolean(extractSectionLineFieldValue(text, "Work item", label))) ||
    explicitTopLevelLabels.some((label) => Boolean(extractTopLevelLineFieldValue(text, label)))
  );
}

function sectionText(text, heading) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim().toLowerCase() === heading.toLowerCase());
  if (start === -1) return "";
  const sectionLines = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (isSectionHeading(line.trim()) && line.trim() !== heading) break;
    sectionLines.push(line);
  }
  return sectionLines.join("\n");
}

function sectionItems(text, heading) {
  const section = sectionText(text, heading);
  if (!section) return [];
  return section
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^[-*]\s+/.test(line))
    .map(stripBullet)
    .filter(Boolean);
}

function itemsAfterListLabel(text, label) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => new RegExp(`^\\s*(?:[-*]\\s*)?${escapeRegExp(label)}\\s*:\\s*$`, "i").test(line));
  if (start === -1) return sectionItems(text, label);

  const items = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^[-*]\s+[A-Z][A-Za-z0-9 /-]+\s*:\s*$/.test(trimmed)) break;
    if (isSectionHeading(trimmed)) break;
    if (/^[-*]\s+/.test(trimmed)) items.push(stripBullet(trimmed));
  }
  return items.filter(Boolean);
}

function isSectionHeading(line) {
  return /^[A-Z][A-Za-z0-9 /-]+$/.test(line);
}

function isKnownPacketSectionHeading(line) {
  return [
    "readiness",
    "current runtime",
    "copyable start command preview",
    "work item",
    "authorization",
    "expected scope",
    "forbidden actions",
    "stop conditions",
    "authority boundaries",
  ].includes(line.toLowerCase());
}

function placeholderStatus(value) {
  if (!value) return strict ? "fail" : "warn";
  if (isPlaceholder(value)) return strict ? "fail" : "warn";
  return "pass";
}

function isPlaceholder(value) {
  const normalized = value.toLowerCase();
  return (
    /^<[^>]+>$/.test(value) ||
    normalized.includes("provided-current-runtime") ||
    normalized.includes("provided-work-id") ||
    normalized.includes("provided-scope") ||
    normalized.includes("no work id listed") ||
    normalized.includes("no scope listed") ||
    normalized === "provided"
  );
}

function findWriteCommands(text) {
  const patterns = [
    /\bnpm\s+run\s+codex:record-(?:completion|completion-proof|evidence)\b/,
    /\bnpm\s+run\s+codex:(?:authority-grant|actuation|github-comment|record-action)\b/,
    /\bnpm\s+run\s+db:(?:reset|migrate|init)\b/,
    /\bgh\s+pr\s+(?:merge|ready|edit)\b/,
    /\bgit\s+(?:push|merge|reset|checkout\s+--)\b/,
    /\bcurl\b.*\/api\/(?:actions|evidence|observe|plan|work|state|publication|delivery)\b/,
    /\bPOST\b.*\/api\/(?:actions|evidence|observe|plan|work|state|publication|delivery)\b/i,
  ];
  return patterns.flatMap((pattern) => [...text.matchAll(new RegExp(pattern, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`))].map((match) => match[0]));
}

function findSecretLikeValues(text) {
  const findings = [];
  const tokenPatterns = [
    /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g,
    /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g,
    /\bsk-[A-Za-z0-9_-]{20,}\b/g,
    /\b(?:OPENAI_API_KEY|GITHUB_TOKEN|AUGNES_[A-Z0-9_]*SECRET|[A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD))\s*=\s*(?!<[^>]+>)([^\s`'"]+)/g,
  ];
  for (const pattern of tokenPatterns) {
    for (const match of text.matchAll(pattern)) {
      findings.push(match[0].split("=")[0]);
    }
  }
  return [...new Set(findings)];
}

function findRawDbFinding(text) {
  const rawDbRefs = [...text.matchAll(/(?:AUGNES_DB_PATH\s*=\s*)?[^\s`'"]+\.db\b/g)].map((match) => match[0]);
  if (rawDbRefs.length === 0) {
    return { status: "pass", message: "No raw DB path references detected." };
  }
  const labeledFallback = /local-dev fallback|local-current DB path|Raw DB path fallback only/i.test(text);
  if (labeledFallback) {
    return { status: "pass", message: "Raw DB path reference is explicitly labeled as local-dev fallback." };
  }
  return { status: "fail", message: `Raw DB path appears as normal input without local-dev fallback labeling: ${rawDbRefs.join(", ")}` };
}

function findDemoDbFinding(text) {
  const demoDbRefs = [...text.matchAll(/\/tmp\/augnes-(?:runtime-dogfood|browser-verification|demo)\.db\b/g)].map((match) => match[0]);
  if (demoDbRefs.length === 0) {
    return { status: "pass", message: "No demo DB refs detected as current runtime refs." };
  }
  const explicitlyExcluded = /Demo DB refs excluded|Do not use demo DB refs|must not be mixed with current runtime refs/i.test(text);
  if (explicitlyExcluded) {
    return { status: "pass", message: "Demo DB refs are mentioned only as excluded/non-current refs." };
  }
  return { status: "fail", message: `Demo DB refs must not be used as current runtime refs: ${demoDbRefs.join(", ")}` };
}

function recommendedNextStep(hasFail, hasWarn) {
  if (hasFail) {
    return "Stop. Fix failed handoff packet checks before starting a separate Codex session.";
  }
  if (hasWarn) {
    return "Resolve warnings with user/Core confirmation before Codex starts implementation.";
  }
  return "Packet preflight passed. Start the separate Codex session with codex:read-brief only after user/Core confirms the current runtime and work item.";
}

function buildMalformedOutput(message) {
  return {
    ok: false,
    strict,
    summary: {
      has_runtime: false,
      has_scope: false,
      has_work_id: false,
      has_start_command: false,
      readiness_status: null,
      task_profile: null,
    },
    checks: [{ id: "input", status: "fail", message }],
    recommended_next_step: "Provide copied Codex handoff packet text through CODEX_HANDOFF_PACKET, --file, or stdin.",
  };
}

function clean(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function stripBullet(value) {
  return value.replace(/^\s*[-*]\s*/, "").trim();
}

function stripQuotes(value) {
  return value.replace(/^['"]|['"]$/g, "");
}

function writeJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
