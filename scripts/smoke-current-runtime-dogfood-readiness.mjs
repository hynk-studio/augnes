import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const runbookPath = "docs/CURRENT_RUNTIME_DOGFOOD_READINESS_RUNBOOK_V0_1.md";
const templatePath = "docs/templates/current-runtime-work-item-intake.md";
const smokePath = "scripts/smoke-current-runtime-dogfood-readiness.mjs";
const packagePath = "package.json";
const packageScriptName = "smoke:current-runtime-dogfood-readiness";
const packageScriptCommand = "node scripts/smoke-current-runtime-dogfood-readiness.mjs";

const allowedChangedFiles = [
  runbookPath,
  templatePath,
  smokePath,
  packagePath,
];

const requiredTemplateHeadings = [
  "Title",
  "Runtime Environment",
  "Work Item",
  "Session Context",
  "User/Core Authorization",
  "Expected Scope",
  "Forbidden Changes",
  "Verification Plan",
  "Evidence Recording Plan",
  "Proof-Only Closeout Plan",
  "Browser / Computer-Use Verification Plan",
  "Dogfood Capture Plan",
  "Authority Boundaries",
  "Start Gate",
  "Stop Conditions",
  "Supplied Values",
  "Open Questions",
];

for (const filePath of [runbookPath, templatePath, smokePath, packagePath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const runbook = readFileSync(runbookPath, "utf8");
const template = readFileSync(templatePath, "utf8");
const smoke = readFileSync(smokePath, "utf8");
const packageJsonText = readFileSync(packagePath, "utf8");
const packageJson = JSON.parse(packageJsonText);

assert.equal(
  packageJson.scripts?.[packageScriptName],
  packageScriptCommand,
  "package.json must expose the current-runtime dogfood readiness smoke script",
);
assertPackageJsonDeltaIsOnlyCurrentSmokeScript(packageJson);

assertCurrentRuntimeRunbook(runbook);
assertTemplate(template);
assertNoSecretLikePlaceholders(runbook, "runbook");
assertNoSecretLikePlaceholders(template, "template");
assertNoSecretLikePlaceholders(smoke, "smoke");
assertNoRuntimeOpenAiGithubOrNetworkCalls(smoke);

const changedFiles = collectChangedFiles();
assertChangedFilesWithinAllowed(changedFiles);
assertNoActiveMcpConfigFilesAdded(changedFiles);
assertNoGeneratedReportsAdded(changedFiles);

console.log(
  JSON.stringify(
    {
      smoke: "current-runtime-dogfood-readiness",
      runbook_present: true,
      template_present: true,
      package_script_present: true,
      current_runtime_vs_demo_runtime_documented: true,
      required_inputs_documented: true,
      read_brief_start_gate_documented: true,
      evidence_policy_documented: true,
      proof_policy_documented: true,
      browser_verification_policy_documented: true,
      authority_boundaries_documented: true,
      template_headings_present: requiredTemplateHeadings.length,
      template_env_fields_present: true,
      secret_like_placeholders_absent: true,
      smoke_runtime_openai_github_network_calls_absent: true,
      active_mcp_config_files_added: false,
      generated_reports_added: false,
      changed_files_within_scope: true,
      package_json_delta_limited_to_script: true,
    },
    null,
    2,
  ),
);

function assertCurrentRuntimeRunbook(text) {
  assertContainsAll(text, [
    "prepares the next phase after ephemeral demo DB validation",
    "user/Core-provided current runtime and a real work item",
    "does not call the runtime",
    "does not record evidence",
    "does not record proof",
    "current runtime is not an ephemeral demo runtime",
    "Ephemeral demo DB refs from `/tmp/augnes-runtime-dogfood.db` or `/tmp/augnes-browser-verification.db` must not be mixed with current runtime refs.",
    "Demo refs are useful for rehearsal only.",
    "Current runtime refs must come from the provided current runtime URL and work item.",
  ], "runbook current-runtime purpose and demo-runtime boundary");

  assertContainsAll(text, [
    "`AUGNES_API_BASE_URL`",
    "`CODEX_SCOPE`",
    "`CODEX_WORK_ID`",
    "Whether `CODEX_SESSION_ID` is available.",
    "Whether evidence recording is allowed.",
    "Whether proof-only closeout is allowed.",
    "Whether browser/computer-use verification is required.",
    "Expected change scope.",
    "Forbidden files or surfaces.",
    "Expected verification commands.",
    "production/current local, current remote, or another explicitly named current environment",
    "Whether the work item is safe for Codex implementation.",
    "requires user/Core approval before any publication, approval, retry, replay, or external posting",
  ], "runbook required user/Core inputs");

  assertContainsAll(text, [
    "git status --short",
    "AUGNES_API_BASE_URL=<provided> CODEX_SCOPE=<provided> CODEX_WORK_ID=<provided> npm run codex:read-brief",
    "If `codex:read-brief` fails, stop, report blocked, do not implement, do not open a PR, and do not record proof/evidence.",
    "If the work ID is missing or unknown, stop and report blocked.",
    "If `codex:read-brief` succeeds, proceed only within the provided work brief and the user/Core scope.",
  ], "runbook read-brief start gate and blocked behavior");

  assertContainsAll(text, [
    "Evidence recording is allowed only if the provided current runtime and `CODEX_WORK_ID` are available and the user/Core explicitly allows evidence recording.",
    "Only report evidence IDs returned by the helper.",
    "Do not fabricate evidence IDs",
    "Evidence is not approval.",
  ], "runbook evidence policy");

  assertContainsAll(text, [
    "Proof-only closeout is allowed only if the current runtime and `CODEX_WORK_ID` are available and the user/Core explicitly allows proof recording.",
    "`CODEX_RESULT_KIND` must be accepted by `codex:record-completion-proof`",
    "`documentation` or `verification`",
    "`runtime_backed_dogfood` belong in PR/report summaries, not as proof result kind",
    "Proof is not approval.",
  ], "runbook proof-only closeout policy");

  assertContainsAll(text, [
    "`docs/templates/codex-browser-verification-report.md`",
    "If browser/computer-use verification is not applicable, the skipped reason must be concrete",
    "Browser/computer-use verification is observation only.",
  ], "runbook browser verification policy");

  assertContainsAll(text, [
    "ChatGPT does not execute Codex.",
    "Codex does not commit/reject Augnes state.",
    "Codex does not approve, publish, retry, replay, externally post, merge, or enable auto-merge.",
    "Proof is not approval.",
    "Evidence is not approval.",
    "PR is not merge authority.",
    "Durable approval remains user/Core gated.",
  ], "runbook authority boundaries");
}

function assertTemplate(text) {
  for (const heading of requiredTemplateHeadings) {
    assert.match(text, new RegExp(`^#{1,2} ${escapeRegExp(heading)}$`, "m"), `template missing heading: ${heading}`);
  }

  assertContainsAll(text, [
    "`AUGNES_API_BASE_URL`",
    "`CODEX_SCOPE`",
    "`CODEX_WORK_ID`",
    "`CODEX_SESSION_ID`",
    "Work title:",
    "Work status:",
    "Work next action:",
    "Related state keys:",
    "Expected files:",
    "Expected checks:",
  ], "template env and work fields");

  assertContainsAll(text, [
    "Evidence recording allowed: yes/no:",
    "Proof-only closeout allowed: yes/no:",
    "Browser verification required: yes/no:",
    "Publication/approval/retry/replay/external posting allowed: no by default:",
    "Merge authority: no:",
    "Exact start command:",
    "Concrete blocked reasons:",
  ], "template authorization and start/stop fields");

  assertContainsAll(text, [
    "git status --short",
    "AUGNES_API_BASE_URL=<provided> CODEX_SCOPE=<provided> CODEX_WORK_ID=<provided> npm run codex:read-brief",
    "Concrete blocked reason: missing `AUGNES_API_BASE_URL`.",
    "Concrete blocked reason: missing `CODEX_SCOPE`.",
    "Concrete blocked reason: missing `CODEX_WORK_ID`.",
    "Concrete blocked reason: unknown work ID in provided current runtime.",
    "Concrete blocked reason: `codex:read-brief` failed.",
  ], "template start gate and stop conditions");
}

function assertPackageJsonDeltaIsOnlyCurrentSmokeScript(currentPackageJson) {
  const basePackageJson = readBasePackageJson();
  if (!basePackageJson) return;

  if (JSON.stringify(basePackageJson) === JSON.stringify(currentPackageJson)) {
    return;
  }

  const currentScripts = currentPackageJson.scripts ?? {};
  const baseScripts = basePackageJson.scripts ?? {};
  const addedScripts = Object.keys(currentScripts).filter((key) => !Object.hasOwn(baseScripts, key));
  const removedScripts = Object.keys(baseScripts).filter((key) => !Object.hasOwn(currentScripts, key));
  const changedScripts = Object.keys(baseScripts).filter(
    (key) => Object.hasOwn(currentScripts, key) && currentScripts[key] !== baseScripts[key],
  );

  assert.deepEqual(addedScripts, [packageScriptName], "package.json must add only the current readiness smoke script");
  assert.deepEqual(removedScripts, [], "package.json must not remove scripts");
  assert.deepEqual(changedScripts, [], "package.json must not modify unrelated scripts");
  assert.deepEqual(currentPackageJson.dependencies, basePackageJson.dependencies, "package.json dependencies must not change");
  assert.deepEqual(currentPackageJson.devDependencies, basePackageJson.devDependencies, "package.json devDependencies must not change");
  assert.equal(currentScripts[packageScriptName], packageScriptCommand);
}

function readBasePackageJson() {
  try {
    return JSON.parse(
      execFileSync("git", ["show", "origin/main:package.json"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }),
    );
  } catch {
    return null;
  }
}

function collectChangedFiles() {
  const files = new Set();

  for (const args of [
    ["diff", "--name-only", "HEAD"],
    ["diff", "--name-only", "--cached"],
    ["diff", "--name-only", "origin/main...HEAD"],
  ]) {
    for (const filePath of runGitFileList(args)) files.add(filePath);
  }

  for (const filePath of parseGitStatus(runGit(["status", "--short", "--untracked-files=all"]))) {
    files.add(filePath);
  }

  return [...files].filter(Boolean).sort();
}

function assertChangedFilesWithinAllowed(changedFiles) {
  const allowed = new Set(allowedChangedFiles);
  for (const filePath of changedFiles) {
    assert.ok(allowed.has(filePath), `unexpected changed file for current-runtime readiness PR: ${filePath}`);
  }
}

function assertNoActiveMcpConfigFilesAdded(changedFiles) {
  const activeMcpConfigPaths = [
    ".codex/config.toml",
    ".codex/hooks.json",
    ".mcp.json",
    "mcp.json",
    "plugins/augnes-operator/.mcp.json",
    "plugins/augnes-operator/mcp.json",
    "plugins/augnes-operator/apps",
  ];

  for (const configPath of activeMcpConfigPaths) {
    assert.equal(existsSync(configPath), false, `${configPath} must not be added`);
  }

  for (const filePath of changedFiles) {
    assert.equal(
      activeMcpConfigPaths.some((configPath) => filePath === configPath || filePath.startsWith(`${configPath}/`)),
      false,
      `active MCP config file must not be changed: ${filePath}`,
    );
  }
}

function assertNoGeneratedReportsAdded(changedFiles) {
  for (const filePath of changedFiles) {
    assert.equal(
      filePath.startsWith("reports/dogfood/") || filePath.startsWith("reports/browser/"),
      false,
      `generated report file must not be added by this PR: ${filePath}`,
    );
  }
}

function assertNoRuntimeOpenAiGithubOrNetworkCalls(text) {
  const importLines = text.split("\n").filter((line) => line.trim().startsWith("import "));
  for (const line of importLines) {
    for (const forbiddenImport of ["node:http", "node:https", "node:http2", "node:net", "node:tls", "openai", "@octokit"]) {
      assert.equal(line.includes(forbiddenImport), false, `smoke script must not import network/client module: ${forbiddenImport}`);
    }
  }

  const forbiddenCallPatterns = [
    /\bfetch\s*\(/,
    /\bhttps?\.(?:request|get)\s*\(/,
    /\bnew\s+OpenAI\s*\(/,
    /\bOctokit\b/,
    /\bexecFileSync\s*\(\s*["']gh["']/,
    /\bspawnSync\s*\(\s*["']gh["']/,
    /\bexecFileSync\s*\(\s*["']curl["']/,
    /\bspawnSync\s*\(\s*["']curl["']/,
    /\bexecFileSync\s*\(\s*["']wget["']/,
    /\bspawnSync\s*\(\s*["']wget["']/,
    /\bexecFileSync\s*\(\s*["']npm["']\s*,\s*\[[^\]]*codex:read-brief/s,
    /\bspawnSync\s*\(\s*["']npm["']\s*,\s*\[[^\]]*codex:read-brief/s,
    /\bexecFileSync\s*\(\s*["']npm["']\s*,\s*\[[^\]]*codex:record/s,
    /\bspawnSync\s*\(\s*["']npm["']\s*,\s*\[[^\]]*codex:record/s,
  ];

  for (const pattern of forbiddenCallPatterns) {
    assert.doesNotMatch(text, pattern, `smoke script must not introduce runtime/OpenAI/GitHub/network call pattern ${pattern}`);
  }
}

function assertNoSecretLikePlaceholders(text, label) {
  const secretPatterns = [
    /\bsk-[A-Za-z0-9_-]{10,}\b/,
    /\bghp_[A-Za-z0-9_]{10,}\b/,
    /\bgithub_pat_[A-Za-z0-9_]{10,}\b/,
    /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/,
    /-----BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY-----/,
    /\bBearer\s+[A-Za-z0-9._-]+/,
    /\b(?:TOKEN|SECRET|PASSWORD|API_KEY)\s*[:=]\s*\S+/,
  ];

  for (const pattern of secretPatterns) {
    assert.doesNotMatch(text, pattern, `${label} must not contain secret-like placeholder ${pattern}`);
  }
}

function runGit(args) {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    return "";
  }
}

function runGitFileList(args) {
  return runGit(args)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseGitStatus(output) {
  return output
    .split("\n")
    .map((line) => {
      if (!line.trim()) return "";
      const filePart = line.slice(3).trim();
      const renamed = filePart.split(" -> ");
      return renamed[renamed.length - 1];
    })
    .filter(Boolean)
    .map((filePath) => filePath.split(path.sep).join("/"));
}

function assertContainsAll(text, phrases, label) {
  const normalizedText = normalizeText(text);
  for (const phrase of phrases) {
    assert.ok(normalizedText.includes(normalizeText(phrase)), `${label} missing phrase: ${phrase}`);
  }
}

function normalizeText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
