const input = await readJsonFromStdin();

if (input.stop_hook_active === true) {
  writeJson({ systemMessage: "Augnes operator Stop hook is already active; no continuation requested." });
  process.exit(0);
}

const message = stringValue(input.last_assistant_message ?? input.lastAssistantMessage ?? input.message);
const issues = [];

if (!hasCloseoutSections(message)) {
  issues.push("add closeout sections: Summary, Files changed, Authority boundary statement, Verification, Skipped checks, and Proof-only closeout status or skipped reason");
}

if (mentionsUnsafeMergeAuthority(message)) {
  issues.push("correct merge-authority language so Codex does not claim merge, auto-merge, approval, publish, or durable state authority");
}

if (!hasProofOnlyCloseoutStatus(message)) {
  issues.push("state proof-only closeout status or a concrete skipped reason; do not require proof recording when runtime or CODEX_WORK_ID is unavailable");
}

if (issues.length === 0) {
  writeJson({});
} else {
  const prompt = `Augnes closeout guard: ${issues.join("; ")}. Keep it concise and preserve proof is not approval / PR is not merge authority.`;
  writeJson({
    decision: "block",
    reason: prompt,
  });
}

function hasCloseoutSections(text) {
  const required = [
    /summary/i,
    /files changed/i,
    /authority boundary statement/i,
    /verification/i,
    /skipped checks/i,
  ];
  return required.every((pattern) => pattern.test(text)) && hasProofOnlyCloseoutStatus(text);
}

function hasProofOnlyCloseoutStatus(text) {
  return /proof-only closeout (status|skipped|recorded)|proof closeout (status|skipped|recorded)|proof-only closeout status or skipped reason/i.test(text);
}

function mentionsUnsafeMergeAuthority(text) {
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
    /\bcodex\b.{0,40}\b(can|may)\s+merge\b/i,
    /\bcodex\b.{0,80}\b(can|may)\s+enable\s+auto-merge\b/i,
    /\bcodex\b.{0,80}\bis\s+(allowed|permitted)\s+to\s+(merge|enable\s+auto-merge)\b/i,
    /\bcodex\b.{0,80}\bhas\s+permission\s+to\s+(merge|enable\s+auto-merge)\b/i,
    /\bcodex\b.{0,80}\b(owns|has|claimed|claims|claiming|was\s+granted|is\s+granted)\s+merge\s+authority\b/i,
    /\bgrant(?:s|ed|ing)?\b.{0,80}\bcodex\b.{0,80}\bmerge\s+authority\b/i,
    /\bmerged\s+by\s+codex\b/i,
    /\bauto-merge\s+enabled\s+by\s+codex\b/i,
    /\bauto-merge\s+was\s+enabled\s+by\s+codex\b/i,
  ];

  if (!unsafePatterns.some((pattern) => pattern.test(clause))) return false;
  return !isNegatedMergeAuthorityBoundary(clause);
}

function isNegatedMergeAuthorityBoundary(clause) {
  const negatedCodexAction =
    /\bcodex\b.{0,80}\b(must\s+never|never|must\s+not|may\s+not|does\s+not|do\s+not|doesn't|cannot|can't|can\s+not|should\s+not|is\s+not|is\s+not\s+allowed|is\s+not\s+permitted|has\s+no\s+permission)\b.{0,80}\b(merge|auto-merge|merge\s+authority)\b/i;
  const negatedGrant =
    /\b(does\s+not|do\s+not|doesn't|must\s+not|may\s+not|never|cannot|can't|can\s+not|should\s+not|without|no)\b.{0,80}\b(grant|claim|enable|merge|own|have|permission|allow|permit)\b.{0,80}\bcodex\b.{0,80}\b(merge\s+authority|auto-merge|merge)\b/i;
  const noMergeAuthority =
    /\b(no|not)\b.{0,40}\bcodex\b.{0,80}\b(merge\s+authority|authority)\b/i;

  return negatedCodexAction.test(clause) || negatedGrant.test(clause) || noMergeAuthority.test(clause);
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
