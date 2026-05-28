import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";

const templatePath = "docs/templates/dogfood-ai-surface-episode.md";
const docsPath = "docs/DOGFOOD_AI_SURFACE_EPISODE_CAPTURE_V0_1.md";
const helperPath = "scripts/create-dogfood-episode.mjs";
const smokePath = "scripts/smoke-dogfood-episode-template.mjs";
const packagePath = "package.json";

for (const filePath of [templatePath, docsPath, helperPath, smokePath, packagePath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const template = readFileSync(templatePath, "utf8");
const docs = readFileSync(docsPath, "utf8");
const helper = readFileSync(helperPath, "utf8");
const smoke = readFileSync(smokePath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assert.equal(
  packageJson.scripts?.["dogfood:create-episode"],
  "node scripts/create-dogfood-episode.mjs",
  "package.json must expose dogfood:create-episode",
);
assert.equal(
  packageJson.scripts?.["smoke:dogfood-episode-template"],
  "node scripts/smoke-dogfood-episode-template.mjs",
  "package.json must expose smoke:dogfood-episode-template",
);
assertNoDependencyChanges(packageJson);

const requiredHeadings = [
  "Title",
  "Episode Metadata",
  "User Request Raw Anchor",
  "ChatGPT Planning Prompt Raw Anchor",
  "Codex Prompt Raw Anchor",
  "Work ID / Handoff ID / Session ID",
  "Expected Scope",
  "Commands Run",
  "Files Changed",
  "Tests And Verification",
  "Browser / Computer-Use Checks",
  "Skipped Checks And Concrete Reasons",
  "PR Link",
  "Codex Result Summary",
  "ChatGPT Review Findings",
  "User Merge / Approval Decision",
  "Evidence / Proof / Action / Work Event / Session Refs",
  "Context Preserved",
  "Context Lost",
  "Context Repaired",
  "Remaining Gaps",
  "Follow-Up Backlog",
  "Final Outcome",
  "Notes",
];
for (const heading of requiredHeadings) {
  assert.match(template, new RegExp(`^#{1,2} ${escapeRegExp(heading)}$`, "m"), `template missing heading: ${heading}`);
}

const firstSummaryIndex = template.indexOf("## Codex Result Summary");
for (const heading of [
  "## User Request Raw Anchor",
  "## ChatGPT Planning Prompt Raw Anchor",
  "## Codex Prompt Raw Anchor",
]) {
  assert.ok(template.indexOf(heading) > -1, `${heading} must exist`);
  assert.ok(template.indexOf(heading) < firstSummaryIndex, `${heading} must appear before summary/review sections`);
}
assert.ok(firstSummaryIndex < template.indexOf("## ChatGPT Review Findings"), "Codex summary must appear before ChatGPT review");
assert.ok(template.indexOf("## ChatGPT Review Findings") < template.indexOf("## Final Outcome"), "review must appear before final outcome");

assertNormalizedIncludes(template, "Summaries are review aids, not replacements for raw anchors.", "template must warn that summaries do not replace raw anchors");
assertNormalizedIncludes(template, "Paste the exact user task request", "template must prompt for exact task request");
assertNormalizedIncludes(template, "Paste the exact ChatGPT planning or handoff prompt", "template must prompt for exact ChatGPT prompt");
assertNormalizedIncludes(template, "Paste the exact Codex prompt", "template must prompt for exact Codex prompt");
assertNormalizedIncludes(template, "Paste exact command output excerpts", "template must prompt for command output excerpts");
assertNormalizedIncludes(template, "Paste exact PR title/body excerpts", "template must prompt for PR excerpts");

assertAuthorityBoundaries(template);
assertAuthorityBoundaries(docs);

for (const phrase of [
  "failed",
  "partial",
  "skipped",
  "Remaining Gaps",
  "Browser/computer-use report refs",
  "Closeout preflight summary",
]) {
  assert.match(template, new RegExp(escapeRegExp(phrase), "i"), `template must include failed/partial/skipped/gap/report field: ${phrase}`);
}

assertNormalizedIncludes(docs, "This is PR 9 in the canonical Codex Agent Harness roadmap.", "docs must mention PR 9");
assertNormalizedIncludes(docs, "This PR does not run an actual dogfood episode.", "docs must state this PR does not run an episode");
assertNormalizedIncludes(docs, "Dogfood episode capture preserves raw anchors before summaries", "docs must explain raw anchors");
assertNormalizedIncludes(docs, "Dogfood notes are research and evaluation material unless Augnes Core separately records a durable decision.", "docs must define note authority");

for (const section of [
  "Relationship To AGENTS.md",
  "Relationship To ChatGPT / Codex / Augnes Review Protocol",
  "Relationship To Codex Closeout Preflight",
  "Relationship To Browser / Computer-Use Verification Runbook",
  "Relationship To Augnes Operator Plugin And Hooks",
  "Relationship To Authority Matrix",
  "Relationship To Augnes Dogfooding Research Direction",
]) {
  assert.match(docs, new RegExp(`^## ${escapeRegExp(section)}$`, "m"), `docs missing relationship section: ${section}`);
}

const dryRun = runHelper([
  "--dry-run",
  "--run-id",
  "smoke-dry-run",
  "--title",
  "Smoke Dogfood Episode",
  "--work-id",
  "AG-SMOKE",
  "--handoff-id",
  "H-SMOKE",
  "--session-id",
  "S-SMOKE",
  "--pr",
  "266",
  "--outcome",
  "skipped",
]);
assert.equal(dryRun.status, 0, dryRun.stderr);
const dryRunJson = JSON.parse(dryRun.stdout);
assert.equal(dryRunJson.ok, true);
assert.equal(dryRunJson.dry_run, true);
assertOutputUnderDogfood(dryRunJson.output_path);
assert.equal(existsSync(dryRunJson.output_path), false, "dry run must not write an episode file");

const safeRunId = `smoke-episode-template-${process.pid}-${Date.now()}`;
let createdPath = "";
try {
  const created = runHelper([
    "--run-id",
    safeRunId,
    "--title",
    "Smoke Dogfood Episode",
    "--work-id",
    "AG-SMOKE",
    "--handoff-id",
    "H-SMOKE",
    "--session-id",
    "S-SMOKE",
    "--pr",
    "266",
    "--outcome",
    "completed",
  ]);
  assert.equal(created.status, 0, created.stderr);
  const createdJson = JSON.parse(created.stdout);
  createdPath = createdJson.output_path;
  assert.equal(createdJson.ok, true);
  assert.equal(createdJson.dry_run, false);
  assertOutputUnderDogfood(createdPath);
  assert.ok(existsSync(createdPath), "helper must create an episode file in normal mode");
  const createdContent = readFileSync(createdPath, "utf8");
  assert.match(createdContent, /Run ID: smoke-episode-template-/);
  assert.match(createdContent, /Work ID: AG-SMOKE/);
  assert.match(createdContent, /Handoff ID: H-SMOKE/);
  assert.match(createdContent, /Session ID: S-SMOKE/);
  assert.match(createdContent, /PR: 266/);
  assert.match(createdContent, /Outcome: completed/);
} finally {
  if (createdPath && existsSync(createdPath)) {
    rmSync(createdPath);
  }
}

for (const badRunId of ["../escape", "..", "/tmp/escape", "nested/path", "nested\\path"]) {
  const rejected = runHelper(["--dry-run", "--run-id", badRunId, "--title", "bad"]);
  assert.notEqual(rejected.status, 0, `path-like run id must be rejected: ${badRunId}`);
}

assertNoApiNetworkPatterns(helper, "helper");
assertNoApiNetworkPatterns(smoke, "smoke");
assertNoSecretLikePlaceholders(template, "template");
assertNoSecretLikePlaceholders(docs, "docs");
assertNoSecretLikePlaceholders(helper, "helper");
assertNoSecretLikePlaceholders(smoke, "smoke");

console.log(
  JSON.stringify(
    {
      smoke: "dogfood-episode-template",
      template_present: true,
      docs_present: true,
      helper_present: true,
      package_scripts_present: true,
      required_headings_present: requiredHeadings.length,
      raw_anchor_order_verified: true,
      authority_boundaries_present: true,
      dry_run_no_write_verified: true,
      normal_create_and_cleanup_verified: true,
      path_traversal_rejected: true,
      output_path_bounded: true,
      api_network_patterns_absent: true,
      secret_like_placeholders_absent: true,
    },
    null,
    2,
  ),
);

function runHelper(args) {
  return spawnSync(process.execPath, [helperPath, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: {
      ...process.env,
      DOGFOOD_RUN_ID: "",
      DOGFOOD_TITLE: "",
      DOGFOOD_WORK_ID: "",
      DOGFOOD_HANDOFF_ID: "",
      DOGFOOD_SESSION_ID: "",
      DOGFOOD_PR: "",
      DOGFOOD_OUTCOME: "",
    },
  });
}

function assertOutputUnderDogfood(outputPath) {
  assert.equal(path.isAbsolute(outputPath), false, "output path must be relative");
  const normalized = outputPath.split(path.sep).join("/");
  assert.match(normalized, /^reports\/dogfood\/\d{4}-\d{2}-\d{2}-[a-z0-9.-]+\.md$/);
  const root = path.resolve("reports/dogfood");
  const target = path.resolve(outputPath);
  assert.ok(target.startsWith(`${root}${path.sep}`), "output path must stay under reports/dogfood");
}

function assertAuthorityBoundaries(text) {
  for (const statement of [
    "Dogfood notes are evaluation material, not committed state.",
    "Proof is not approval.",
    "PR is not merge authority.",
    "Durable approval remains user/Core gated.",
    "No ChatGPT direct Codex execution authority is created.",
    "No Codex commit/reject or merge authority is created.",
  ]) {
    assertNormalizedIncludes(text, statement, `authority boundary missing: ${statement}`);
  }
}

function assertNoDependencyChanges(pkg) {
  assert.ok(pkg.dependencies, "package.json dependencies must exist");
  assert.ok(pkg.devDependencies, "package.json devDependencies must exist");
  for (const forbidden of ["openai", "@octokit/rest", "playwright", "puppeteer", "selenium-webdriver"]) {
    assert.equal(pkg.dependencies?.[forbidden], undefined, `must not add dependency ${forbidden}`);
    assert.equal(pkg.devDependencies?.[forbidden], undefined, `must not add devDependency ${forbidden}`);
  }
}

function assertNoApiNetworkPatterns(text, label) {
  const forbiddenPatterns = [
    /\bfetch\s*\(/,
    /\bhttps?\.(?:request|get)\s*\(/,
    /\bnew\s+OpenAI\s*\(/,
    /\bOctokit\b/,
    /\bgh\s+api\b/,
    /\bgh\s+pr\s+merge\b/,
    /\bAUGNES_API_BASE_URL\b/,
    /\blocalhost:3000\/api\b/,
    /\bcodex:record-(?:evidence|completion|completion-proof)\b/,
    /\bpr\s+merge\b/,
    /\benable-auto-merge\b/,
  ];
  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(text, pattern, `${label} must not introduce API/network/runtime/proof/merge call pattern ${pattern}`);
  }
}

function assertNoSecretLikePlaceholders(text, label) {
  const secretPatterns = [
    /\bsk-[A-Za-z0-9_-]{10,}\b/,
    /\bghp_[A-Za-z0-9_]{10,}\b/,
    /\bgithub_pat_[A-Za-z0-9_]{10,}\b/,
    /\b[A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|API_KEY)\s*[:=]\s*\S+/,
    /-----BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY-----/,
    /\bBearer\s+[A-Za-z0-9._-]+/,
  ];
  for (const pattern of secretPatterns) {
    assert.doesNotMatch(text, pattern, `${label} must not contain secret-like placeholder ${pattern}`);
  }
}

function assertNormalizedIncludes(text, expected, message) {
  const normalizedText = text.replace(/\s+/g, " ").trim();
  const normalizedExpected = expected.replace(/\s+/g, " ").trim();
  assert.ok(normalizedText.includes(normalizedExpected), message);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
