import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const runbookPath = "docs/CURRENT_RUNTIME_CODEX_HANDOFF_CONTRACT_V0_1.md";
const templatePath = "docs/templates/current-runtime-codex-handoff-contract.md";
const readinessRunbookPath = "docs/CURRENT_RUNTIME_DOGFOOD_READINESS_RUNBOOK_V0_1.md";
const readinessSmokePath = "scripts/smoke-current-runtime-dogfood-readiness.mjs";
const smokePath = "scripts/smoke-current-runtime-codex-handoff-contract.mjs";
const packagePath = "package.json";
const packageScriptName = "smoke:current-runtime-codex-handoff-contract";
const packageScriptCommand = "node scripts/smoke-current-runtime-codex-handoff-contract.mjs";
const strictPrScope = process.env.AUGNES_SMOKE_STRICT_PR_SCOPE === "1";

const allowedChangedFiles = [
  runbookPath,
  templatePath,
  smokePath,
  readinessSmokePath,
  packagePath,
  readinessRunbookPath,
];

const requiredTemplateHeadings = [
  "Title",
  "Current Runtime",
  "Work Item",
  "Handoff Summary",
  "Expected Scope",
  "Forbidden Changes",
  "Evidence Authorization",
  "Proof-Only Closeout Authorization",
  "Browser Verification Requirement",
  "Start Command",
  "Stop Conditions",
  "Authority Boundaries",
  "User/Core Questions",
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
  "package.json must expose the current-runtime Codex handoff contract smoke script",
);
if (strictPrScope) {
  assertPackageJsonDeltaIsOnlyHandoffSmokeScript(packageJson);
}

assertRunbook(runbook);
assertTemplate(template);
assertNoSecretLikePlaceholders(runbook, "runbook");
assertNoSecretLikePlaceholders(template, "template");
assertNoSecretLikePlaceholders(smoke, "smoke");
assertNoRuntimeOpenAiGithubOrNetworkCalls(smoke);
assertNoActiveMcpConfigFilesAdded([]);

if (strictPrScope) {
  const changedFiles = collectChangedFiles();
  assertChangedFilesWithinAllowed(changedFiles);
  assertNoForbiddenSurfacesChanged(changedFiles);
  assertNoActiveMcpConfigFilesAdded(changedFiles);
  assertNoGeneratedReportsAdded(changedFiles);
}

console.log(
  JSON.stringify(
    {
      smoke: "current-runtime-codex-handoff-contract",
      strict_pr_scope: strictPrScope,
      reusable_regression_mode: !strictPrScope,
      runbook_present: true,
      template_present: true,
      package_script_present: true,
      primary_abstraction: "current runtime endpoint plus current work item",
      raw_db_path_user_abstraction: false,
      db_path_fallback_warning_present: true,
      required_fields_documented: true,
      authority_boundaries_documented: true,
      template_headings_present: requiredTemplateHeadings.length,
      template_fields_present: true,
      evidence_proof_browser_authorization_present: true,
      stop_conditions_present: true,
      no_merge_authority: true,
      secret_like_placeholders_absent: true,
      smoke_runtime_openai_github_network_calls_absent: true,
      active_mcp_config_files_added: false,
      generated_reports_added: strictPrScope ? false : "not_checked",
      changed_files_within_scope: strictPrScope ? true : "not_checked",
      package_json_delta_limited_to_script: strictPrScope ? true : "not_checked",
    },
    null,
    2,
  ),
);

function assertRunbook(text) {
  assertContainsAll(text, [
    "Users should not normally manage raw database paths.",
    "The preferred abstraction is a current Augnes runtime endpoint plus a current Augnes work item.",
    "A raw DB path is a local-dev fallback only.",
    "The contract gives Codex enough context to start safely",
  ], "runbook purpose");

  assertContainsAll(text, [
    "Current runtime endpoint: the Augnes runtime URL where Codex reads current state and the current work brief.",
    "Work item: the trace anchor for this Codex task",
    "Evidence/proof authorization: explicit user/Core choices",
    "Scope/forbidden surfaces:",
    "Stop conditions:",
  ], "runbook conceptual model");

  assertContainsAll(text, [
    "`AUGNES_API_BASE_URL`, or `provided by local operator`",
    "`CODEX_SCOPE`",
    "`CODEX_WORK_ID`",
    "Work title.",
    "Work status.",
    "Work next action.",
    "Related state keys.",
    "Expected files.",
    "Expected checks.",
    "Evidence recording allowed: yes/no.",
    "Proof-only closeout allowed: yes/no.",
    "Browser verification required: yes/no.",
    "Forbidden changes.",
    "Publication/approval/retry/replay/external posting allowed: no by default.",
    "Merge authority: no.",
    "Start command.",
    "Stop conditions.",
  ], "runbook required fields");

  assertContainsAll(text, [
    "Do not ask the user to choose a DB path unless the task is explicitly operating in local-dev fallback mode.",
    "label it as a local-current DB path",
    "Do not run `db:reset` or `demo:seed` unless the task is explicitly demo mode",
    "Do not run `db:migrate` unless the user/Core separately authorizes migrations.",
    "Demo DB paths under `/tmp`",
    "They must not be mixed with current-runtime refs",
  ], "runbook db-path fallback warning");

  for (const section of [
    "Relationship To Current Runtime Readiness Runbook",
    "Relationship To Work Contract Card",
    "Relationship To Codex Session Adapter",
    "Relationship To Closeout Preflight",
    "Relationship To Dogfood Capture",
    "Relationship To Authority Matrix",
  ]) {
    assert.match(text, new RegExp(`^## ${escapeRegExp(section)}$`, "m"), `runbook missing relationship section: ${section}`);
  }

  assertAuthorityBoundaries(text);

  assertContainsAll(text, [
    "`AUGNES_API_BASE_URL` is missing",
    "`CODEX_SCOPE` is missing",
    "`CODEX_WORK_ID` is missing",
    "The supplied work ID is unknown to the provided current runtime.",
    "`codex:read-brief` fails.",
    "Evidence recording is requested without explicit user/Core authorization.",
    "Proof-only closeout is requested without explicit user/Core authorization.",
  ], "runbook stop conditions");
}

function assertTemplate(text) {
  for (const heading of requiredTemplateHeadings) {
    assert.match(text, new RegExp(`^#{1,2} ${escapeRegExp(heading)}$`, "m"), `template missing heading: ${heading}`);
  }

  assertContainsAll(text, [
    "`AUGNES_API_BASE_URL`",
    "`CODEX_SCOPE`",
    "`CODEX_WORK_ID`",
    "Work title:",
    "Work status:",
    "Work next action:",
    "Related state keys:",
    "Expected files:",
    "Expected checks:",
    "Evidence recording allowed: yes/no:",
    "Proof-only closeout allowed: yes/no:",
    "Browser verification required: yes/no:",
    "Publication/approval/retry/replay/external posting allowed: no by default:",
    "Merge authority: no:",
    "Raw DB path fallback only if local operator explicitly supplies it:",
    "Do not use demo DB refs as current runtime refs:",
  ], "template required fields");

  assertContainsAll(text, [
    "git status --short",
    "AUGNES_API_BASE_URL=<provided> CODEX_SCOPE=<provided> CODEX_WORK_ID=<provided> npm run codex:read-brief",
    "Concrete blocked reason: missing `AUGNES_API_BASE_URL`",
    "Concrete blocked reason: missing `CODEX_SCOPE`.",
    "Concrete blocked reason: missing `CODEX_WORK_ID`.",
    "Concrete blocked reason: unknown work ID in provided current runtime.",
    "Concrete blocked reason: `codex:read-brief` failed.",
    "Concrete blocked reason: demo DB refs offered as current-runtime refs.",
  ], "template start command and stop conditions");

  assertAuthorityBoundaries(text);
}

function assertPackageJsonDeltaIsOnlyHandoffSmokeScript(currentPackageJson) {
  const basePackageJson = readBasePackageJson();
  if (!basePackageJson) return;

  const currentScripts = currentPackageJson.scripts ?? {};
  const baseScripts = basePackageJson.scripts ?? {};
  const addedScripts = Object.keys(currentScripts).filter((key) => !Object.hasOwn(baseScripts, key));
  const removedScripts = Object.keys(baseScripts).filter((key) => !Object.hasOwn(currentScripts, key));
  const changedScripts = Object.keys(baseScripts).filter(
    (key) => Object.hasOwn(currentScripts, key) && currentScripts[key] !== baseScripts[key],
  );

  assert.deepEqual(addedScripts, [packageScriptName], "package.json must add only the current-runtime handoff smoke script");
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
    assert.ok(allowed.has(filePath), `unexpected changed file for current-runtime Codex handoff contract PR: ${filePath}`);
  }
}

function assertNoForbiddenSurfacesChanged(changedFiles) {
  const forbiddenPathPatterns = [
    /^app\//,
    /^apps\/augnes_apps\/src\//,
    /^apps\/augnes_apps\/server\//,
    /^apps\/augnes_apps\/public\//,
    /^lib\//,
    /^plugins\//,
    /^\.codex\//,
    /^\.mcp\.json$/,
    /^mcp\.json$/,
    /^db\//,
    /^migrations\//,
  ];

  for (const filePath of changedFiles) {
    assert.equal(
      forbiddenPathPatterns.some((pattern) => pattern.test(filePath)),
      false,
      `forbidden runtime/schema/API/MCP/App/plugin/hook/UI surface changed: ${filePath}`,
    );
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

function assertAuthorityBoundaries(text) {
  assertContainsAll(text, [
    "ChatGPT does not execute Codex.",
    "Codex does not commit/reject Augnes state.",
    "Codex does not approve, publish, retry, replay, externally post, merge, or enable auto-merge.",
    "Evidence is not approval.",
    "Proof is not approval.",
    "PR is not merge authority.",
    "Durable approval remains user/Core gated.",
  ], "authority boundaries");
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
