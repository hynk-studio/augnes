import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const runbookPath = "docs/AUGNES_BROWSER_COMPUTER_USE_VERIFICATION_RUNBOOK_V0_1.md";
const templatePath = "docs/templates/codex-browser-verification-report.md";
const packagePath = "package.json";
const smokePath = "scripts/smoke-browser-verification-report-template.mjs";

for (const filePath of [runbookPath, templatePath, packagePath, smokePath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const runbook = readFileSync(runbookPath, "utf8");
const template = readFileSync(templatePath, "utf8");
const smoke = readFileSync(smokePath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assert.equal(
  packageJson.scripts?.["smoke:browser-verification-report-template"],
  "node scripts/smoke-browser-verification-report-template.mjs",
  "package.json must expose only the required browser verification report template smoke script",
);
assertNoBrowserAutomationDependency(packageJson);

assert.match(runbook, /PR 8 in the canonical Codex Agent Harness roadmap/i, "runbook must mention PR 8 and the canonical roadmap");
assert.match(runbook, /verification runbook, not an automation implementation/i, "runbook must say it is not an implementation");
assertNormalizedIncludes(
  runbook,
  "does not add runtime behavior, browser automation, screenshot capture code, app tools, MCP config, hooks, plugin behavior, or authority.",
  "runbook must say it does not add implementation or authority",
);

const requiredStartupCommands = [
  "npm install",
  "npm run db:reset",
  "npm run db:migrate",
  "npm run demo:seed",
  "AUGNES_DB_PATH=/tmp/augnes-demo.db npm run dev -- --port 3000",
  "npm --prefix apps/augnes_apps install",
  "AUGNES_ENABLE_AGENT_BRIDGE=true AUGNES_API_BASE_URL=http://localhost:3000 npm --prefix apps/augnes_apps run dev",
];
for (const command of requiredStartupCommands) {
  assert.ok(runbook.includes(command), `runbook must include startup command: ${command}`);
}

const requiredRunbookChecks = [
  "UI loads.",
  "Target view or card renders.",
  "Missing-data state renders without throwing.",
  "Boundary text is visible when relevant.",
  "No unauthorized write controls are visible.",
  "No `Run Codex` control is visible.",
  "No commit/reject control is visible unless a future Core-gated operator-control PR explicitly scopes it.",
  "No approve, publish, retry, replay, or externally-post controls are visible unless explicitly scoped.",
  "No merge or auto-merge controls are visible.",
  "No proof or evidence recording controls are visible unless explicitly scoped.",
  "Rendered view matches relevant API/tool output at a high level.",
  "Errors or unavailable runtime states show concrete status instead of fabricated data.",
];
for (const check of requiredRunbookChecks) {
  assertNormalizedIncludes(runbook, check, `runbook required check missing: ${check}`);
}

const skippedReasonExamples = [
  "browser verification skipped: no browser runtime available",
  "browser verification skipped: no local Augnes runtime available",
  "browser verification skipped: no ChatGPT Developer Mode tunnel/session available",
  "browser verification skipped: docs-only change with no rendered UI",
  "browser verification skipped: CLI-only helper change with no UI surface",
];
for (const reason of skippedReasonExamples) {
  assert.ok(runbook.includes(reason), `runbook must include skipped reason example: ${reason}`);
}

assertBoundaryLanguage(runbook);

const requiredRelationships = [
  "Relationship To Work Contract Card",
  "Relationship To ChatGPT App Bridge",
  "Relationship To Cockpit",
  "Relationship To Codex Closeout Preflight",
  "Relationship To Augnes Operator Hooks",
  "Relationship To Codex MCP Bridge Docs",
  "Relationship To Canonical Roadmap",
  "Relationship To Authority Matrix",
];
for (const heading of requiredRelationships) {
  assert.match(runbook, new RegExp(`^## ${escapeRegExp(heading)}$`, "m"), `runbook must include ${heading}`);
}

const requiredTemplateHeadings = [
  "Title",
  "Related PR",
  "Date",
  "Verifier / Surface",
  "Environment",
  "Local Startup",
  "Views Checked",
  "Commands Run",
  "Tool/API Outputs Compared",
  "Observations",
  "Missing Data / Error States",
  "Screenshots / Artifacts",
  "Unauthorized Controls Check",
  "Authority Boundary Confirmation",
  "Skipped Checks And Reasons",
  "Gaps / Follow-ups",
  "Result",
  "Notes",
];
for (const heading of requiredTemplateHeadings) {
  assert.match(template, new RegExp(`^#{1,2} ${escapeRegExp(heading)}$`, "m"), `template must include heading ${heading}`);
}

const requiredTemplatePrompts = [
  /\[ \] UI loads\./,
  /\[ \] Target card\/view renders\./,
  /\[ \] Missing-data state renders\./,
  /\[ \] Boundary text visible\./,
  /\[ \] No Run Codex control visible\./,
  /\[ \] No commit\/reject control visible\./,
  /\[ \] No approve\/publish\/retry\/replay\/external-posting control visible\./,
  /\[ \] No merge\/auto-merge control visible\./,
  /\[ \] No proof\/evidence recording control visible\./,
  /\[ \] No secrets captured\./,
  /\[ \] Proof is not approval\./,
  /\[ \] PR is not merge authority\./,
  /\[ \] Durable approval remains user\/Core gated\./,
];
for (const pattern of requiredTemplatePrompts) {
  assert.match(template, pattern, `template prompt missing: ${pattern}`);
}

assertNoSecretLikePlaceholders(template, "template");
assertNoSecretLikePlaceholders(runbook, "runbook");
assertNoActiveBrowserAutomationImplementation([runbook, template, smoke].join("\n\n"));
assertNoScreenshotArtifactsCommitted();

console.log(
  JSON.stringify(
    {
      smoke: "browser-verification-report-template",
      runbook_present: true,
      template_present: true,
      package_script_present: true,
      canonical_pr8_documented: true,
      startup_commands_documented: requiredStartupCommands.length,
      required_checks_documented: requiredRunbookChecks.length,
      skipped_reason_examples_documented: skippedReasonExamples.length,
      authority_boundaries_documented: true,
      template_headings_present: requiredTemplateHeadings.length,
      unauthorized_control_checks_present: true,
      secret_like_placeholders_absent: true,
      browser_automation_implementation_absent: true,
      screenshot_artifacts_absent: true,
    },
    null,
    2,
  ),
);

function assertBoundaryLanguage(text) {
  const requiredStatements = [
    "Browser/computer-use verification is observation.",
    "It does not:",
    "- approve",
    "- publish",
    "- retry",
    "- replay",
    "- externally post",
    "- merge",
    "- enable auto-merge",
    "- commit or reject Augnes state",
    "- record proof",
    "- record evidence",
    "Proof is not approval.",
    "A PR is not merge authority.",
    "Durable approval remains user/Core gated.",
  ];
  for (const statement of requiredStatements) {
    assertNormalizedIncludes(text, statement, `authority boundary missing: ${statement}`);
  }
}

function assertNoBrowserAutomationDependency(pkg) {
  const combined = {
    ...(pkg.dependencies ?? {}),
    ...(pkg.devDependencies ?? {}),
  };
  const forbiddenDeps = ["playwright", "puppeteer", "selenium-webdriver", "webdriverio", "chromedriver"];
  for (const dep of forbiddenDeps) {
    assert.equal(combined[dep], undefined, `package.json must not add browser automation dependency ${dep}`);
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

function assertNoActiveBrowserAutomationImplementation(text) {
  const forbiddenPatterns = [
    /\bfrom\s+["'](?:playwright|puppeteer|selenium-webdriver|webdriverio)["']/,
    /\brequire\(["'](?:playwright|puppeteer|selenium-webdriver|webdriverio)["']\)/,
    /\bchromium\.launch\s*\(/,
    /\bpuppeteer\.launch\s*\(/,
    /\bnew\s+Builder\s*\(/,
    /\bpage\.screenshot\s*\(/,
    /\btakeScreenshot\s*\(/,
    /\bdesktopCapturer\b/,
    /\bscreencapture\b/,
    /\bgnome-screenshot\b/,
    /\bimport\s+["']node:child_process["']/,
  ];
  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(text, pattern, `new runbook/template smoke must not implement browser automation or screenshot capture: ${pattern}`);
  }
}

function assertNoScreenshotArtifactsCommitted() {
  const artifactExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".mp4", ".mov"]);
  const ignoredDirs = new Set([".git", "node_modules", "apps/augnes_apps/node_modules"]);
  const suspicious = [];

  for (const filePath of walk(".")) {
    const normalized = filePath.replace(/^\.\//, "");
    if (!isNewSliceCandidate(normalized)) continue;
    const ext = path.extname(normalized).toLowerCase();
    if (artifactExtensions.has(ext)) suspicious.push(normalized);
  }

  assert.deepEqual(suspicious, [], "this PR must not commit screenshot or media artifacts");

  function* walk(root) {
    for (const entry of readdirSync(root)) {
      const entryPath = path.join(root, entry);
      const normalized = entryPath.replace(/^\.\//, "");
      if ([...ignoredDirs].some((dir) => normalized === dir || normalized.startsWith(`${dir}/`))) continue;
      const stat = statSync(entryPath);
      if (stat.isDirectory()) {
        yield* walk(entryPath);
      } else if (stat.isFile()) {
        yield entryPath;
      }
    }
  }
}

function isNewSliceCandidate(filePath) {
  return (
    filePath === runbookPath ||
    filePath === templatePath ||
    filePath === smokePath ||
    filePath.startsWith("docs/templates/") ||
    filePath.startsWith("reports/browser/") ||
    filePath.startsWith("validation/browser/")
  );
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function assertNormalizedIncludes(text, expected, message) {
  const normalizedText = text.replace(/\s+/g, " ").trim();
  const normalizedExpected = expected.replace(/\s+/g, " ").trim();
  assert.ok(normalizedText.includes(normalizedExpected), message);
}
