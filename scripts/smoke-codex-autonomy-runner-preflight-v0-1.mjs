#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertPackageScript,
  collectUntrackedFiles,
  loadTextByFile,
  normalizeText,
  parsePackageJson,
} from "./smoke-boundary-common.mjs";

const consumptionDoc =
  "docs/CODEX_AUTONOMY_RUNNER_PREFLIGHT_CONSUMPTION_V0_1.md";
const skillFile =
  "plugins/augnes-operator/skills/augnes-autonomy-runner-preflight/SKILL.md";
const runnerDoc = "docs/AUTONOMY_RUNNER_PREFLIGHT_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const smokeFile = "scripts/smoke-codex-autonomy-runner-preflight-v0-1.mjs";

const priorPhaseSmokeScripts = [
  "smoke:autonomy-runner-preflight-v0-1",
  "smoke:autonomy-runner-preflight-route-v0-1",
  "smoke:autonomy-runner-preflight-web-preview-v0-1",
  "smoke:chatgpt-app-autonomy-runner-preflight-tool-v0-1",
];

const priorSmokeAllowlistCompatibilityFiles = [
  "scripts/smoke-augnes-delta-contract-v0-1.mjs",
  "scripts/smoke-augnes-delta-projection-v0-1.mjs",
  "scripts/smoke-augnes-delta-projection-route-v0-1.mjs",
  "scripts/smoke-current-working-perspective-v0-1.mjs",
  "scripts/smoke-current-working-perspective-route-v0-1.mjs",
  "scripts/smoke-human-surface-home-v0-1.mjs",
  "scripts/smoke-perspective-human-timeline-v0-1.mjs",
  "scripts/smoke-agent-workplane-shell-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
  "scripts/smoke-guide-brief-v0-1.mjs",
  "scripts/smoke-guide-brief-route-v0-1.mjs",
  "scripts/smoke-web-guide-panel-v0-1.mjs",
  "scripts/smoke-chatgpt-app-guide-brief-tool-v0-1.mjs",
  "scripts/smoke-codex-guidebrief-handoff-v0-1.mjs",
  "scripts/smoke-handoff-capsule-v0-1.mjs",
  "scripts/smoke-handoff-capsule-route-v0-1.mjs",
  "scripts/smoke-handoff-capsule-web-preview-v0-1.mjs",
  "scripts/smoke-chatgpt-app-handoff-capsule-tool-v0-1.mjs",
  "scripts/smoke-codex-handoff-capsule-v0-1.mjs",
  "scripts/smoke-handoff-capsule-copy-export-v0-1.mjs",
  "scripts/smoke-autonomy-contract-v0-1.mjs",
  "scripts/smoke-autonomy-contract-route-v0-1.mjs",
  "scripts/smoke-autonomy-contract-web-preview-v0-1.mjs",
  "scripts/smoke-chatgpt-app-autonomy-contract-tool-v0-1.mjs",
  "scripts/smoke-codex-autonomy-contract-v0-1.mjs",
  "scripts/smoke-autonomy-contract-copy-export-v0-1.mjs",
  "scripts/smoke-autonomy-runner-preflight-v0-1.mjs",
  "scripts/smoke-autonomy-runner-preflight-route-v0-1.mjs",
  "scripts/smoke-autonomy-runner-preflight-web-preview-v0-1.mjs",
  "scripts/smoke-chatgpt-app-autonomy-runner-preflight-tool-v0-1.mjs",
];

const inspectedFiles = [
  consumptionDoc,
  skillFile,
  runnerDoc,
  indexDoc,
  packageJsonFile,
  smokeFile,
];

const allowedChangedFiles = new Set([
  consumptionDoc,
  skillFile,
  smokeFile,
  packageJsonFile,
  indexDoc,
  runnerDoc,
  ...priorSmokeAllowlistCompatibilityFiles,
]);

const phase9fCopyExportFollowOnFiles = new Set([
  "lib/autonomy/autonomy-runner-preflight-copy-export.ts",
  "components/autonomy/autonomy-runner-preflight-copy-export-panel.tsx",
  "components/autonomy/autonomy-runner-preflight-preview-panel.tsx",
  "scripts/smoke-autonomy-runner-preflight-copy-export-v0-1.mjs",
]);
for (const file of phase9fCopyExportFollowOnFiles) {
  allowedChangedFiles.add(file);
}

const forbiddenChangedPathPatterns = [
  /^app\/api\//,
  /^app\/.*route\.(ts|tsx|js|jsx)$/,
  /^components\//,
  /^apps\/augnes_apps\//,
  /^lib\/(?!autonomy\/)/,
  /^lib\/autonomy\/(?!read-autonomy-runner-preflight-for-web\.ts$|autonomy-runner-preflight-source\.ts$|autonomy-runner-preflight\.ts$)/,
  /^types\//,
  /^fixtures\//,
  /^migrations\//,
  /^db\//,
  /^provider\//i,
  /^providers\//i,
  /^proof\//i,
  /^evidence\//i,
  /(^|\/)(scheduler|daemon|background-worker|background_worker)(\/|$)/i,
  /(^|\/)(route|api)\.(js|jsx|ts|tsx)$/,
];

const textByFile = loadTextByFile(inspectedFiles);
const packageJsonText = textByFile.get(packageJsonFile);
const docText = textByFile.get(consumptionDoc);
const skillText = textByFile.get(skillFile);
const runnerDocText = textByFile.get(runnerDoc);
const indexText = textByFile.get(indexDoc);
const smokeText = textByFile.get(smokeFile);

assertPackageJsonScript();
assertConsumptionDoc();
assertSkill();
assertRunnerDocNote();
assertIndexPointer();
assertSmokeScriptBoundary();
const priorSmokes = assertPriorPhaseSmokesPass();
const changedFilesBoundary = assertChangedFilesBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "codex-autonomy-runner-preflight-v0-1",
      pass: true,
      required_files_checked: inspectedFiles,
      package_script_checked: true,
      consumption_doc_checked: true,
      skill_checked: skillFile,
      runner_doc_phase9e_note_checked: true,
      latest_index_checked: true,
      prior_phase_smokes_checked: priorSmokes,
      no_api_route_files_changed_checked: true,
      no_ui_component_page_files_changed_checked: true,
      no_app_mcp_tool_files_changed_checked: true,
      no_db_migration_files_changed_checked: true,
      no_db_write_code_checked: true,
      no_provider_openai_github_codex_product_actuation_checked: true,
      no_child_process_in_product_code_checked: true,
      no_fs_write_apis_in_product_code_checked: true,
      no_timer_worker_daemon_loop_checked: true,
      no_proof_evidence_memory_perspective_handoff_auto_apply_budget_external_scope_drift_checked: true,
      changed_files_boundary_checked: changedFilesBoundary.checked,
      changed_files_boundary_skipped: changedFilesBoundary.skipped,
      changed_files_boundary_skip_reason: changedFilesBoundary.skip_reason,
      changed_files_observed: changedFilesBoundary.files,
      changed_files_base_ref: changedFilesBoundary.base_ref,
      untracked_files_checked: changedFilesBoundary.untracked_checked,
      untracked_files_skipped: changedFilesBoundary.untracked_skipped,
      untracked_files_skip_reason: changedFilesBoundary.untracked_skip_reason,
      smoke_type:
        "static-codex-autonomy-runner-preflight-doc-skill-smoke-package-index-boundary-only",
    },
    null,
    2,
  ),
);
console.log("PASS smoke:codex-autonomy-runner-preflight-v0-1");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText,
    scriptName: "smoke:codex-autonomy-runner-preflight-v0-1",
    expectedCommand:
      "node scripts/smoke-codex-autonomy-runner-preflight-v0-1.mjs",
  });
}

function assertConsumptionDoc() {
  assertContainsAll(consumptionDoc, [
    "Codex Autonomy Runner Preflight Consumption v0.1",
    "Codex may consume Autonomy Runner Preflight and Autonomy Dry-Run Plan packets as planning context",
    "Autonomy Runner Preflight is planning context only.",
    "Autonomy Dry-Run Plan is preview context only.",
    "Preflight is not approval to run.",
    "Dry-run plan is not execution permission.",
    "`readiness` is not authorization.",
    "Phase 9E is docs/skill/smoke only.",
    "`ready_for_future_supervised_runner` still means future supervised review only.",
    "`not_supported` is blocked planning context",
    "A planned step with `would_execute: false` must remain non-executable.",
    "`dry_run_only` must be preserved.",
    "Source composition remains preview/operator-supplied unless a later approved phase says otherwise.",
    "blockers",
    "warnings",
    "required user judgment",
    "required operator review",
    "budget limits",
    "stop conditions",
    "stale-source warnings",
    "forbidden actions",
    "authority boundary",
    "Codex must not convert a planned dry-run step into an executed action.",
    "start a runner",
    "schedule a runner",
    "start a daemon",
    "start background work",
    "launch Codex",
    "call GitHub",
    "call OpenAI or provider APIs",
    "write DB",
    "create proof/evidence",
    "mutate memory",
    "apply durable Perspective state",
    "send handoff",
    "create a branch or PR from Augnes product code",
    "auto-apply deltas",
    "spend budget",
    "post externally",
    "explicit operator approval before any later phase that actually runs anything",
    "Budget assessment is a boundary, not spend permission.",
    "Required user judgment and required operator review remain unresolved",
    "Stop conditions must be preserved.",
    "Stale, partial, synthetic, fallback, or preview-supplied context must be reported",
    "The no-run authority boundary remains controlling.",
    "Codex may edit repo files, commit, push, and open a PR only when the active user-scoped developer workflow explicitly asks for that work.",
    "no private conversation",
    "no hidden reasoning",
    "no secrets/tokens",
    "no local private paths",
    "no raw provider output",
    "no raw retrieval output",
    "no real account artifacts",
    "planned steps that preserve `would_execute: false`",
    "future-only operator-gated next steps",
    "commands to execute planned dry-run steps",
    "claims that readiness authorizes execution",
    "Phase 9F - Autonomy Runner Preflight / Dry-Run local copy and manual-copy preview v0.1",
  ], { textByFile });
}

function assertSkill() {
  assertContainsAll(skillFile, [
    "name: augnes-autonomy-runner-preflight",
    "description: Consume Autonomy Runner Preflight and Dry-Run Plan preview packets as Codex planning context",
    "This skill is for consuming Autonomy Runner Preflight and Autonomy Dry-Run Plan preview context.",
    "It is instruction-only workflow guidance.",
    "It does not run commands.",
    "It does not call Augnes runtime.",
    "It does not call GitHub.",
    "It does not call OpenAI or providers.",
    "It does not call MCP/App tools.",
    "It does not execute Codex based on preflight.",
    "It does not launch Codex.",
    "It does not run autonomy.",
    "It does not schedule autonomy.",
    "It does not start a daemon.",
    "It does not perform background work.",
    "It does not write DB records.",
    "It does not create proof/evidence.",
    "It does not mutate memory/state/work/Perspective.",
    "It does not send handoff.",
    "It does not create branches or PRs from product behavior.",
    "It does not auto-apply deltas.",
    "It does not spend budget.",
    "It does not post externally.",
    "## When To Use",
    "## Inputs To Inspect",
    "## Required Output Format",
    "1. Preflight status",
    "2. Readiness summary",
    "3. Blockers",
    "4. Warnings",
    "5. Required user judgment",
    "6. Required operator review",
    "7. Budget / action / delta / review / stop / staleness / authority assessments",
    "8. Dry-run plan summary",
    "9. Planned steps, preserving `would_execute: false`",
    "10. No-run authority boundary",
    "11. Public-safety notes",
    "12. What would be needed before execution, future-only and operator-gated",
    "## Required No-Run Boundary",
    "Preflight is not approval to run.",
    "Dry-run plan is not execution permission.",
    "Readiness is not authorization.",
    "`ready_for_future_supervised_runner` remains future supervised review only.",
    "`dry_run_only` must be preserved.",
    "Every planned step must preserve `would_execute: false`.",
    "No runner starts.",
    "No scheduler starts.",
    "No daemon starts.",
    "No background work starts.",
    "No Codex execution starts from product behavior.",
    "No GitHub/provider/OpenAI call occurs.",
    "No DB write occurs.",
    "No proof/evidence write occurs.",
    "No memory or Perspective mutation occurs.",
    "No handoff send occurs.",
    "No branch/PR creation occurs from product behavior.",
    "No auto-apply occurs.",
    "No budget spend occurs.",
    "No external side effect occurs.",
    "## Readiness Interpretation",
    "`not_supported`: blocked planning context; do not invent missing policy.",
    "## Blockers / Warnings Handling",
    "Preserve blockers, warnings, required user judgment, required operator review, budget limits, stop conditions, stale-source warnings, forbidden actions, and authority boundary details.",
    "## Dry-Run Step Handling",
    "Preserve `dry_run_only`.",
    "Preserve every planned step with\n`would_execute: false`.",
    "Do not convert a dry-run step into an executed action.",
    "Do not instruct Codex to\nexecute planned steps.",
    "## Forbidden Actions",
    "start runner/scheduler/daemon/background work",
    "execute Codex based on preflight",
    "call GitHub",
    "call OpenAI or provider APIs",
    "write DB",
    "create proof/evidence",
    "mutate memory or Perspective",
    "send handoff",
    "create branch/PR from product behavior",
    "auto-apply deltas",
    "spend budget",
    "post externally",
    "## Public-Safety Handling",
    "secrets",
    "tokens",
    "hidden reasoning",
    "private conversation",
    "local private paths",
    "raw provider output",
    "raw retrieval output",
    "real account artifacts",
    "## Example Review Summary",
    "## Completion Checklist",
    "Phase 9E itself remains docs/skill/smoke only.",
  ], { textByFile });
}

function assertRunnerDocNote() {
  assertContainsAll(runnerDoc, [
    "## 1.4 Phase 9E Codex Consumption Alignment",
    "docs/CODEX_AUTONOMY_RUNNER_PREFLIGHT_CONSUMPTION_V0_1.md",
    "plugins/augnes-operator/skills/augnes-autonomy-runner-preflight/SKILL.md",
    "scripts/smoke-codex-autonomy-runner-preflight-v0-1.mjs",
    "Preflight is not approval to run.",
    "Dry-run plan is not execution permission.",
    "Readiness is not authorization.",
    "Codex must preserve `dry_run_only` and every planned step with `would_execute: false`.",
    "Phase 9E adds no API route, UI, App/MCP tool, runner, scheduler, daemon, background work, product write, runtime execution, or external side effect.",
    "npm run smoke:codex-autonomy-runner-preflight-v0-1",
    "Browser/CDP validation is skipped because Phase 9E adds only Codex docs/skill/smoke alignment and no Web UI.",
    "Phase 9G - explicit operator-approved runner skeleton planning v0.1",
    "Phase 9G is planning only unless separately and explicitly scoped.",
  ], { textByFile });
}

function assertIndexPointer() {
  assertContainsAll(indexDoc, [
    "Phase 9E Codex Autonomy Runner Preflight consumption alignment v0.1",
    "docs/CODEX_AUTONOMY_RUNNER_PREFLIGHT_CONSUMPTION_V0_1.md",
    "plugins/augnes-operator/skills/augnes-autonomy-runner-preflight/SKILL.md",
    "scripts/smoke-codex-autonomy-runner-preflight-v0-1.mjs",
    "smoke:codex-autonomy-runner-preflight-v0-1",
    "Autonomy Runner Preflight is planning context only",
    "Autonomy Dry-Run Plan is preview context only",
    "readiness is not authorization",
    "`dry_run_only`",
    "`would_execute: false`",
    "blockers/warnings",
    "budget/stop/staleness/authority",
    "no API route, UI, App/MCP tool, actual runner, scheduler, daemon, background work, DB write, provider/OpenAI call, GitHub actuation, Codex execution from Augnes product code, proof/evidence write, memory mutation, durable Perspective apply, handoff execution, branch/PR creation from product code, budget spend, auto-apply, product-write, merge/publish/retry/replay/deploy behavior, write-capable skill/tool behavior, or external side effect.",
    "This index pointer is not roadmap authority.",
  ], { textByFile });
}

function assertSmokeScriptBoundary() {
  assertContainsAll(smokeFile, [
    "smoke-codex-autonomy-runner-preflight-v0-1",
    "priorPhaseSmokeScripts",
    "smoke:autonomy-runner-preflight-v0-1",
    "smoke:autonomy-runner-preflight-route-v0-1",
    "smoke:autonomy-runner-preflight-web-preview-v0-1",
    "smoke:chatgpt-app-autonomy-runner-preflight-tool-v0-1",
    "assertChangedFilesWithin",
    "collectUntrackedFiles",
    "Unexpected changed file for Codex Autonomy Runner Preflight alignment smoke",
  ], { textByFile });

  const forbiddenRuntimeSnippets = [
    "registerAppTool(",
    "NextResponse",
    "export async function GET",
    "export async function POST",
    "setInterval(",
    "setTimeout(",
    "worker_threads",
    "fs.writeFile",
    "writeFileSync",
    "appendFile",
    "mkdirSync",
    "fetch(",
    "@octokit",
    "@openai",
    "openai.chat",
  ];

  for (const snippet of forbiddenRuntimeSnippets) {
    assert(
      !docText.includes(snippet) &&
        !skillText.includes(snippet) &&
        !runnerDocText.includes(snippet) &&
        !indexText.includes(snippet),
      `Phase 9E docs/skill must not include runtime implementation snippet: ${snippet}`,
    );
  }

  const combined = normalizeText([docText, skillText].join("\n"));
  for (const forbiddenPositive of [
    "readiness authorizes execution.",
    "dry-run plan is execution permission",
    "preflight is approval to run",
    "must execute planned steps",
    "should execute planned steps",
    "start the runner",
    "schedule the runner",
    "launch Codex now",
    "call GitHub now",
    "write DB now",
    "auto-apply deltas now",
  ]) {
    assert(
      !combined.toLowerCase().includes(forbiddenPositive.toLowerCase()),
      `Phase 9E docs/skill must not contain forbidden positive instruction: ${forbiddenPositive}`,
    );
  }

  assert(smokeText.includes("node:child_process"));
  assert(!/\bfrom\s+["'](?:app|components|apps\/augnes_apps|lib\/autonomy|lib\/db|provider|providers|proof|evidence)\//.test(smokeText));
}

function assertPriorPhaseSmokesPass() {
  const results = [];
  for (const scriptName of priorPhaseSmokeScripts) {
    execFileSync("npm", ["run", scriptName], {
      cwd: process.cwd(),
      stdio: "pipe",
      encoding: "utf8",
    });
    results.push({ script: scriptName, pass: true });
  }
  return results;
}

function assertChangedFilesBoundary() {
  const result = assertChangedFilesWithin({
    allowedChangedFiles,
    label: "Codex Autonomy Runner Preflight alignment smoke",
  });
  const untrackedFiles = collectUntrackedFiles();
  const contentOnly = result.mode === "content-only";

  if (!contentOnly) {
    for (const file of untrackedFiles) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected untracked file for Codex Autonomy Runner Preflight alignment smoke: ${file}`,
      );
    }
  }

  const files = [...new Set([...result.files, ...untrackedFiles])].sort();
  if (!contentOnly) {
    for (const file of files) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected changed file for Codex Autonomy Runner Preflight alignment smoke: ${file}`,
      );
      if (phase9fCopyExportFollowOnFiles.has(file)) {
        continue;
      }
      assert(
        !forbiddenChangedPathPatterns.some((pattern) => pattern.test(file)),
        `Forbidden changed file for Codex Autonomy Runner Preflight alignment smoke: ${file}`,
      );
    }
  }

  return {
    ...result,
    files,
    untracked_checked: !contentOnly,
    untracked_skipped: contentOnly,
    untracked_skip_reason: contentOnly
      ? "untracked-file boundary skipped because AUGNES_BOUNDARY_SMOKE_MODE=content-only"
      : null,
  };
}

parsePackageJson(packageJsonText);
