const knownFlags = new Set(["--strict", "--json", "--help"]);

const args = process.argv.slice(2);
const unknownFlag = args.find((arg) => arg.startsWith("--") && !knownFlags.has(arg));
const strict = args.includes("--strict");

if (unknownFlag) {
  const output = buildMalformedOutput(`Unknown flag: ${unknownFlag}`);
  writeJson(output);
  console.error(`Malformed input: ${unknownFlag}`);
  process.exit(2);
}

if (args.includes("--help")) {
  console.log(`Usage: npm run codex:closeout-preflight -- [--strict] [--json]

Reads CODEX_* closeout environment variables and prints a deterministic JSON
preflight report. The helper does not call Augnes, GitHub, OpenAI, or network
resources, and it does not mutate files or runtime state.`);
  process.exit(0);
}

let skippedChecks = [];
let skippedChecksMalformed = null;

try {
  skippedChecks = parseSkippedChecks(process.env.CODEX_SKIPPED_CHECKS_JSON);
} catch (error) {
  skippedChecksMalformed = error instanceof Error ? error.message : String(error);
}

const filesChanged = parseList(process.env.CODEX_FILES_CHANGED);
const relatedStateKeys = parseList(process.env.CODEX_RELATED_STATE_KEYS);
const summary = {
  scope: clean(process.env.CODEX_SCOPE),
  work_id: clean(process.env.CODEX_WORK_ID),
  result_status: clean(process.env.CODEX_RESULT_STATUS),
  result_kind: clean(process.env.CODEX_RESULT_KIND),
  files_changed: filesChanged,
  related_pr: clean(process.env.CODEX_RELATED_PR),
  related_state_keys: relatedStateKeys,
};

if (skippedChecksMalformed) {
  const output = {
    ok: false,
    strict,
    summary,
    checks: [
      {
        id: "input.skipped_checks_json",
        status: "fail",
        message: `CODEX_SKIPPED_CHECKS_JSON is malformed: ${skippedChecksMalformed}`,
      },
    ],
    recommended_next_step: recommendedNextStep(summary.work_id),
  };
  writeJson(output);
  console.error(`Malformed input: CODEX_SKIPPED_CHECKS_JSON ${skippedChecksMalformed}`);
  process.exit(2);
}

const checks = [];
const closeoutText = [
  process.env.CODEX_RESULT_SUMMARY,
  process.env.CODEX_AUTHORITY_BOUNDARY_STATEMENT,
  process.env.CODEX_RELATED_PR,
  JSON.stringify(skippedChecks),
].filter(Boolean).join("\n");

addRequiredCheck({
  id: "work_id",
  value: summary.work_id,
  pass: "CODEX_WORK_ID is present.",
  warn: "CODEX_WORK_ID is missing; proof-only closeout must be reported as skipped unless work context is provided.",
});

addRequiredCheck({
  id: "result_summary",
  value: clean(process.env.CODEX_RESULT_SUMMARY),
  pass: "Result summary is present.",
  warn: "CODEX_RESULT_SUMMARY is missing.",
});

addRequiredCheck({
  id: "result_status",
  value: summary.result_status,
  pass: "Result status is present.",
  warn: "CODEX_RESULT_STATUS is missing.",
});

addRequiredCheck({
  id: "result_kind",
  value: summary.result_kind,
  pass: "Result kind is present.",
  warn: "CODEX_RESULT_KIND is missing.",
});

checks.push({
  id: "files_changed",
  status: filesChanged.length > 0 ? "pass" : "warn",
  message: filesChanged.length > 0
    ? "Files changed are present."
    : "CODEX_FILES_CHANGED is empty; PR closeout should list changed files or explain the gap.",
});

const skippedCheckIssues = validateSkippedChecks(skippedChecks);
checks.push({
  id: "skipped_checks",
  status: skippedCheckIssues.length === 0 ? "pass" : strict ? "fail" : "warn",
  message: skippedCheckIssues.length === 0
    ? "Skipped checks are absent or include concrete check names and reasons."
    : `Skipped checks need concrete names and reasons: ${skippedCheckIssues.join("; ")}`,
});

addRequiredCheck({
  id: "authority_boundary",
  value: clean(process.env.CODEX_AUTHORITY_BOUNDARY_STATEMENT),
  pass: "Authority boundary statement is present.",
  warn: "CODEX_AUTHORITY_BOUNDARY_STATEMENT is missing.",
});

const docsOnlyFindings = process.env.CODEX_DOCS_ONLY === "true"
  ? findDocsOnlyForbiddenFiles(filesChanged)
  : [];
checks.push({
  id: "docs_only_scope",
  status: docsOnlyFindings.length === 0 ? "pass" : strict ? "fail" : "warn",
  message: process.env.CODEX_DOCS_ONLY === "true"
    ? docsOnlyFindings.length === 0
      ? "Docs-only mode found no forbidden runtime/API/schema/tool/hook/plugin/package-script paths."
      : `Docs-only mode flagged forbidden paths: ${docsOnlyFindings.join(", ")}`
    : "Docs-only mode is not enabled.",
});

const legacyCompletionUsed = mentionsLegacyCompletion(closeoutText);
checks.push({
  id: "legacy_completion",
  status: legacyCompletionUsed ? "warn" : "pass",
  message: legacyCompletionUsed
    ? "`npm run codex:record-completion` was mentioned; treat it as legacy compatibility only unless explicitly instructed."
    : "No legacy `codex:record-completion` use detected.",
});

const mergeAuthorityClaim = mentionsMergeAuthority(closeoutText);
checks.push({
  id: "merge_authority",
  status: mergeAuthorityClaim ? strict ? "fail" : "warn" : "pass",
  message: mergeAuthorityClaim
    ? "Closeout text appears to claim Codex merged, enabled auto-merge, or owns merge authority."
    : "No Codex merge or auto-merge authority claim detected.",
});

const hasFail = checks.some((check) => check.status === "fail");
const output = {
  ok: !hasFail,
  strict,
  summary,
  checks,
  recommended_next_step: recommendedNextStep(summary.work_id),
};

writeJson(output);

const nonPass = checks.filter((check) => check.status !== "pass");
if (nonPass.length > 0) {
  console.error(nonPass.map((check) => `${check.status.toUpperCase()}: ${check.id}: ${check.message}`).join("\n"));
}

process.exit(hasFail ? 1 : 0);

function addRequiredCheck({ id, value, pass, warn }) {
  checks.push({
    id,
    status: value ? "pass" : strict ? "fail" : "warn",
    message: value ? pass : warn,
  });
}

function buildMalformedOutput(message) {
  return {
    ok: false,
    strict,
    summary: {
      scope: clean(process.env.CODEX_SCOPE),
      work_id: clean(process.env.CODEX_WORK_ID),
      result_status: clean(process.env.CODEX_RESULT_STATUS),
      result_kind: clean(process.env.CODEX_RESULT_KIND),
      files_changed: parseList(process.env.CODEX_FILES_CHANGED),
      related_pr: clean(process.env.CODEX_RELATED_PR),
      related_state_keys: parseList(process.env.CODEX_RELATED_STATE_KEYS),
    },
    checks: [{ id: "input.arguments", status: "fail", message }],
    recommended_next_step: recommendedNextStep(clean(process.env.CODEX_WORK_ID)),
  };
}

function clean(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseList(value) {
  const cleaned = clean(value);
  if (!cleaned) return [];

  if (cleaned.startsWith("[")) {
    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        return parsed.map((entry) => String(entry).trim()).filter(Boolean);
      }
    } catch {
      return cleaned.split(/[\n,]/).map((entry) => entry.trim()).filter(Boolean);
    }
  }

  return cleaned.split(/[\n,]/).map((entry) => entry.trim()).filter(Boolean);
}

function parseSkippedChecks(value) {
  const cleaned = clean(value);
  if (!cleaned) return [];

  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) {
    throw new Error("expected a JSON array");
  }

  return parsed.map((entry, index) => {
    if (typeof entry === "string") {
      return { check: entry, reason: "" };
    }

    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error(`entry ${index} must be an object or string`);
    }

    return {
      check: stringFromUnknown(entry.check ?? entry.name ?? entry.label),
      reason: stringFromUnknown(entry.reason ?? entry.skipped_reason ?? entry.summary),
    };
  });
}

function stringFromUnknown(value) {
  return typeof value === "string" ? value.trim() : "";
}

function validateSkippedChecks(entries) {
  const genericReasons = new Set([
    "n/a",
    "na",
    "none",
    "skipped",
    "not needed",
    "not applicable",
    "n.a.",
    "-",
    "tbd",
  ]);
  const issues = [];

  for (const [index, entry] of entries.entries()) {
    if (!entry.check) {
      issues.push(`entry ${index} is missing check name`);
    }

    if (!entry.reason) {
      issues.push(`entry ${index} is missing reason`);
      continue;
    }

    const normalized = entry.reason.toLowerCase().replace(/\s+/g, " ").trim();
    if (genericReasons.has(normalized)) {
      issues.push(`entry ${index} reason is generic: ${entry.reason}`);
    }
  }

  return issues;
}

function findDocsOnlyForbiddenFiles(files) {
  return files.filter((file) => {
    const normalized = file.replace(/\\/g, "/");

    if (isDocsOnlyForbiddenPath(normalized)) return true;
    if (normalized === "AGENTS.md") return false;
    if (normalized.startsWith("docs/")) return false;
    if (/\.md$/i.test(normalized)) return false;
    if (/^\.agents\/skills\/[^/]+\/SKILL\.md$/.test(normalized)) return false;

    return false;
  });
}

function isDocsOnlyForbiddenPath(file) {
  return (
    file === "package.json" ||
    file.endsWith("/package.json") ||
    file.includes("package-lock.json") ||
    file.startsWith("apps/") ||
    file.startsWith("app/") ||
    file.startsWith("src/") ||
    file.startsWith("lib/") ||
    file.startsWith("components/") ||
    file.startsWith("scripts/") ||
    file.startsWith("prisma/") ||
    file.startsWith("migrations/") ||
    file.startsWith("plugins/") ||
    file.startsWith("hooks/") ||
    file.startsWith(".codex/") ||
    file.startsWith(".agents/plugins/") ||
    file.includes("/api/") ||
    file.includes("/schema") ||
    file.includes("schema.") ||
    file.includes("/hooks/") ||
    file.includes("/plugins/")
  );
}

function mentionsLegacyCompletion(text) {
  return /\bcodex:record-completion\b(?!-proof)/i.test(text);
}

function mentionsMergeAuthority(text) {
  const clauses = text
    .replace(/\s+/g, " ")
    .split(/[.;!?]/)
    .map((clause) => clause.trim())
    .filter(Boolean);

  return clauses.some((clause) => hasUnsafeMergeAuthorityClaim(clause));
}

function hasUnsafeMergeAuthorityClaim(clause) {
  const unsafePatterns = [
    /\bcodex\b.{0,80}\b(merged|auto-merged)\b/i,
    /\bcodex\b.{0,80}\benabled\s+auto-merge\b/i,
    /\bcodex\b.{0,80}\b(owns|has|claimed|claims|claiming|was\s+granted|is\s+granted)\s+merge\s+authority\b/i,
    /\bgrant(?:s|ed|ing)?\b.{0,80}\bcodex\b.{0,80}\bmerge\s+authority\b/i,
    /\bauto-merge\s+enabled\s+by\s+codex\b/i,
  ];

  if (!unsafePatterns.some((pattern) => pattern.test(clause))) return false;
  return !isNegatedMergeAuthorityBoundary(clause);
}

function isNegatedMergeAuthorityBoundary(clause) {
  const negatedCodexAction =
    /\bcodex\b.{0,80}\b(must\s+never|never|must\s+not|does\s+not|do\s+not|doesn't|cannot|can't|should\s+not|is\s+not)\b.{0,80}\b(merge|auto-merge|merge\s+authority)\b/i;
  const negatedGrant =
    /\b(does\s+not|do\s+not|doesn't|must\s+not|never|cannot|can't|should\s+not|without)\b.{0,80}\b(grant|claim|enable|merge|own|have)\b.{0,80}\bcodex\b.{0,80}\b(merge\s+authority|auto-merge|merge)\b/i;
  const noMergeAuthority =
    /\b(no|not)\b.{0,40}\bcodex\b.{0,80}\b(merge\s+authority|authority)\b/i;

  return negatedCodexAction.test(clause) || negatedGrant.test(clause) || noMergeAuthority.test(clause);
}

function recommendedNextStep(workId) {
  if (workId) {
    return "Run npm run codex:record-completion-proof if the local Augnes runtime is available.";
  }

  return "Report skipped proof-only closeout in the PR body: missing CODEX_WORK_ID.";
}

function writeJson(value) {
  console.log(JSON.stringify(value, null, 2));
}
