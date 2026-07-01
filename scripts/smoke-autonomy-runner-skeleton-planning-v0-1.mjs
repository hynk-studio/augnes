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
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const planningDoc = "docs/AUTONOMY_RUNNER_SKELETON_PLANNING_V0_1.md";
const approvalGateDoc = "docs/AUTONOMY_RUNNER_OPERATOR_APPROVAL_GATE_V0_1.md";
const runnerPreflightDoc = "docs/AUTONOMY_RUNNER_PREFLIGHT_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const smokeFile = "scripts/smoke-autonomy-runner-skeleton-planning-v0-1.mjs";

const optionalPointerFiles = [
  "docs/CODEX_AUTONOMY_RUNNER_PREFLIGHT_CONSUMPTION_V0_1.md",
  "plugins/augnes-operator/skills/augnes-autonomy-runner-preflight/SKILL.md",
];

const priorPhaseSmokeScripts = [
  "smoke:autonomy-runner-preflight-v0-1",
  "smoke:autonomy-runner-preflight-route-v0-1",
  "smoke:autonomy-runner-preflight-web-preview-v0-1",
  "smoke:chatgpt-app-autonomy-runner-preflight-tool-v0-1",
  "smoke:codex-autonomy-runner-preflight-v0-1",
  "smoke:autonomy-runner-preflight-copy-export-v0-1",
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
  ...priorPhaseSmokeScripts.map((scriptName) =>
    `scripts/${scriptName.replace("smoke:", "smoke-")}.mjs`,
  ),
];

const inspectedFiles = [
  planningDoc,
  approvalGateDoc,
  runnerPreflightDoc,
  indexDoc,
  packageJsonFile,
  smokeFile,
];

const allowedChangedFiles = new Set([
  planningDoc,
  approvalGateDoc,
  smokeFile,
  packageJsonFile,
  indexDoc,
  runnerPreflightDoc,
  ...optionalPointerFiles,
  ...priorSmokeAllowlistCompatibilityFiles,
]);

const forbiddenChangedFilePatterns = [
  /^app\/api\//,
  /^app\//,
  /^components\//,
  /^apps\/augnes_apps\//,
  /^lib\/(?!autonomy\/autonomy-runner-preflight-copy-export\.ts$)/,
  /^lib\/autonomy\/(?!autonomy-runner-preflight-copy-export\.ts$)/,
  /^types\//,
  /^fixtures\//,
  /^migrations\//,
  /^db\//,
  /(^|\/)(provider|providers|openai|github|octokit)(\/|$)/i,
  /(^|\/)(proof|evidence)(\/|$)/i,
  /(^|\/)(scheduler|daemon|background|worker|queue|runner-loop)(\/|$)/i,
  /(^|\/)(route|api)\.(js|jsx|ts|tsx)$/,
];

const textByFile = loadTextByFile(inspectedFiles);
const planningText = textByFile.get(planningDoc);
const approvalText = textByFile.get(approvalGateDoc);
const packageJsonText = textByFile.get(packageJsonFile);
const smokeText = textByFile.get(smokeFile);

assertPackageJsonScript();
assertPlanningDoc();
assertApprovalGateDoc();
assertRunnerPreflightDocNote();
assertIndexPointers();
assertSmokeScriptBoundary();
const priorSmokes = assertPriorPhaseSmokesPass();
const changedFilesBoundary = assertChangedFileBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "autonomy-runner-skeleton-planning-v0-1",
      pass: true,
      required_files_checked: inspectedFiles,
      package_script_checked: true,
      planning_doc_checked: true,
      approval_gate_doc_checked: true,
      preflight_doc_phase_9g_note_checked: true,
      latest_index_checked: true,
      prior_phase_smokes_checked: priorSmokes,
      no_actual_runner_file_added_checked: true,
      no_runner_skeleton_implementation_file_added_checked: true,
      no_scheduler_daemon_background_worker_queue_files_changed_checked: true,
      no_api_route_files_changed_checked: true,
      no_ui_component_page_files_changed_checked: true,
      no_app_mcp_tool_files_changed_checked: true,
      no_db_migration_files_changed_checked: true,
      no_db_write_code_checked: true,
      no_provider_openai_github_codex_product_actuation_checked: true,
      no_child_process_in_product_code_checked: true,
      no_fs_write_apis_in_product_code_checked: true,
      no_timer_worker_daemon_loop_checked: true,
      no_proof_evidence_memory_perspective_handoff_branch_pr_auto_apply_budget_external_scope_drift_checked: true,
      changed_files_boundary_checked: changedFilesBoundary.checked,
      changed_files_boundary_skipped: changedFilesBoundary.skipped,
      changed_files_boundary_skip_reason: changedFilesBoundary.skip_reason,
      changed_files_observed: changedFilesBoundary.files,
      changed_files_base_ref: changedFilesBoundary.base_ref,
      untracked_files_checked: changedFilesBoundary.untracked_checked,
      untracked_files_skipped: changedFilesBoundary.untracked_skipped,
      untracked_files_skip_reason: changedFilesBoundary.untracked_skip_reason,
      smoke_type:
        "static-autonomy-runner-skeleton-planning-docs-smoke-package-index-boundary-only",
    },
    null,
    2,
  ),
);
console.log("PASS smoke:autonomy-runner-skeleton-planning-v0-1");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText,
    scriptName: "smoke:autonomy-runner-skeleton-planning-v0-1",
    expectedCommand:
      "node scripts/smoke-autonomy-runner-skeleton-planning-v0-1.mjs",
  });
}

function assertPlanningDoc() {
  assertContainsAll(planningDoc, [
    "Autonomy Runner Skeleton Planning v0.1",
    "Phase 9G is planning only.",
    "Phase 9G does not implement a runner skeleton.",
    "Phase 9G does not add execution authority.",
    "future runner skeleton must be separately scoped and explicitly operator-approved",
    "Autonomy Runner Preflight remains planning context only.",
    "Autonomy Dry-Run Plan remains preview context only.",
    "Readiness remains not authorization.",
    "Copy packets remain review artifacts only.",
    "Codex alignment remains instruction-only.",
    "No actual run may start from Phase 9G artifacts.",
    "Operator approval is a future gate",
    "No planned future run may execute in Phase 9G.",
    "No new write authority is introduced in Phase 9G.",
    "Explicit operator approval model",
    "Run ledger decision",
    "Append-only run record schema decision",
    "Whether writes are allowed at all",
    "Pause / stop / cancel semantics",
    "Manual confirmation step before any run start",
    "Tool execution whitelist",
    "Read-only source whitelist",
    "Write target denylist and later allowlist proposal",
    "Codex launch boundary",
    "GitHub boundary",
    "Provider/OpenAI boundary",
    "DB write boundary",
    "Proof/evidence write boundary",
    "Memory mutation boundary",
    "Perspective apply boundary",
    "Handoff send boundary",
    "Branch/PR creation boundary",
    "Budget spend boundary",
    "External side-effect boundary",
    "Rollback / postmortem requirements",
    "Audit/review packet requirements",
    "Fixture/public-safety requirements",
    "Operator-facing failure states",
    "No-run fallback behavior",
    "scheduler behavior",
    "daemon behavior",
    "background work",
    "automatic retry/replay/deploy",
    "auto-apply",
    "external posting",
    "hidden runs",
    "runs triggered by readiness alone",
    "runs triggered by copy packets",
    "runs triggered by ChatGPT App/MCP tool output",
    "runs triggered by Codex skill output",
    "Phase 9G must not include executable code.",
    "It must not add an importable runtime module.",
    "non-executable planning pseudocode",
    "`not_configured`",
    "`blocked_by_preflight`",
    "`awaiting_operator_approval`",
    "`approved_for_manual_start`",
    "`dry_run_preview_ready`",
    "`run_not_started`",
    "`stopped_before_start`",
    "`rejected_by_operator`",
    "Active execution states are not implemented and not authorized in Phase 9G.",
    "`running`",
    "`scheduled`",
    "`queued`",
    "`executing_codex`",
    "`calling_github`",
    "`writing_db`",
    "The dry-run plan is present and `dry_run_only`.",
    "Every planned step still has `would_execute: false`.",
    "The run ledger and write policy are decided.",
    "no runner starts",
    "no scheduler starts",
    "no daemon starts",
    "no background work starts",
    "no Codex execution",
    "no GitHub/provider/OpenAI call",
    "no DB write",
    "no proof/evidence write",
    "no memory mutation",
    "no durable Perspective apply",
    "no handoff send",
    "no branch/PR creation",
    "no budget spend",
    "no external side effect",
    "Phase 9H - Autonomy Runner ledger and run-record policy planning v0.1, docs/smoke only",
  ], { textByFile });

  assertNoExecutablePlanningDocSnippets(planningText, planningDoc);
}

function assertApprovalGateDoc() {
  assertContainsAll(approvalGateDoc, [
    "Autonomy Runner Operator Approval Gate v0.1",
    "Operator approval is not implied by preflight readiness.",
    "Operator approval is not implied by a dry-run plan.",
    "Operator approval is not implied by copy packet review.",
    "Operator approval is not implied by Codex alignment.",
    "Operator approval is not implied by ChatGPT App/MCP preview tool output.",
    "Operator approval must be explicit, phase-scoped, and auditable.",
    "Phase 9G does not create the approval mechanism",
    "later phase must separately define the approval mechanism before runner execution exists",
    "operator identity or local operator context",
    "exact scope, for example `project:augnes`",
    "exact run target",
    "source preflight id",
    "source dry-run id",
    "preflight readiness",
    "blocker status",
    "warning status",
    "required user judgment status",
    "required operator review status",
    "budget boundary acknowledged",
    "stop conditions acknowledged",
    "stale-source status acknowledged",
    "forbidden actions acknowledged",
    "authority boundary acknowledged",
    "`dry_run_only` acknowledged",
    "every planned step with `would_execute: false` acknowledged",
    "run ledger/write policy decision acknowledged",
    "rollback/postmortem expectation acknowledged",
    "explicit expiration or freshness window",
    "explicit denial path",
    "no implicit approval through UI read, App/MCP read, copy packet read, or Codex summary",
    "preflight is missing",
    "preflight is `not_supported`",
    "blockers exist",
    "required user judgment is unresolved",
    "required operator review is unresolved",
    "budget is missing or unacknowledged",
    "stop condition is active",
    "source is stale enough to block",
    "forbidden action is requested",
    "authority boundary is unclear",
    "planned step `would_execute` is anything other than `false`",
    "source composition is unknown",
    "operator approval expired",
    "operator approval scope mismatch",
    "ledger/write policy is unresolved",
    "auto-approval",
    "approval inferred from readiness",
    "approval inferred from `ready_for_future_supervised_runner`",
    "approval inferred from copy/manual-copy packet",
    "approval inferred from App/MCP tool call",
    "approval inferred from Codex summary",
    "approval inferred from browser visibility",
    "approval inferred from successful smoke tests",
    "approval inferred from merged PR unless the PR explicitly scopes execution authority, which Phase 9G does not",
    "no runner starts",
    "no scheduler starts",
    "no daemon starts",
    "no background work starts",
    "no queue or worker starts",
    "no Codex execution",
    "no GitHub/provider/OpenAI call",
    "no DB write",
    "no proof/evidence write",
    "no memory mutation",
    "no durable Perspective apply",
    "no handoff send",
    "no branch/PR creation from Augnes product code",
    "no auto-apply",
    "no budget spend",
    "no external side effect",
    "This document is not that approval record.",
  ], { textByFile });

  assertNoExecutablePlanningDocSnippets(approvalText, approvalGateDoc);
}

function assertRunnerPreflightDocNote() {
  assertContainsAll(runnerPreflightDoc, [
    "## 1.6 Phase 9G Runner Skeleton Planning",
    "Phase 9G adds planning docs and smoke coverage only.",
    "docs/AUTONOMY_RUNNER_SKELETON_PLANNING_V0_1.md",
    "docs/AUTONOMY_RUNNER_OPERATOR_APPROVAL_GATE_V0_1.md",
    "scripts/smoke-autonomy-runner-skeleton-planning-v0-1.mjs",
    "Phase 9G does not implement a runner skeleton.",
    "Phase 9G does not add execution authority.",
    "preflight remains planning context",
    "dry-run remains preview context",
    "readiness remains not authorization",
    "operator approval is not implied",
    "No run may start from Phase 9G artifacts.",
    "npm run smoke:autonomy-runner-skeleton-planning-v0-1",
    "Browser/CDP validation is skipped because Phase 9G adds only runner skeleton planning docs/smoke and no Web UI.",
    "Phase 9H - Autonomy Runner ledger and run-record policy planning v0.1, docs/smoke only",
  ], { textByFile });
}

function assertIndexPointers() {
  assertContainsAll(indexDoc, [
    "Phase 9G explicit operator-approved Autonomy Runner skeleton planning v0.1",
    planningDoc,
    approvalGateDoc,
    smokeFile,
    "smoke:autonomy-runner-skeleton-planning-v0-1",
    "Phase 9G is planning only",
    "does not implement a runner skeleton",
    "does not add execution authority",
    "future runner skeleton requires separate explicit operator approval",
    "preflight remains planning context",
    "dry-run remains preview context",
    "readiness remains not authorization",
    "operator approval is not implied",
    "run ledger/write policy",
    "pause/stop/cancel",
    "manual confirmation",
    "tool execution whitelist",
    "Codex/GitHub/provider/OpenAI/DB/proof/evidence/memory/Perspective/handoff/branch-PR/budget/external boundaries",
    "adds no API route, UI, App/MCP tool, actual runner, runner skeleton implementation, scheduler, daemon, background work, queue, worker, DB schema/migration, DB write, provider/OpenAI call, GitHub actuation, Codex execution from Augnes product code, proof/evidence write, memory mutation, durable Perspective apply, handoff execution, branch/PR creation from product code, budget spend, auto-apply, file download/export-to-disk, external posting, product-write, merge/publish/retry/replay/deploy behavior, or external side effect.",
    "This index pointer is not roadmap authority.",
  ], { textByFile });
}

function assertSmokeScriptBoundary() {
  assertContainsAll(smokeFile, [
    "smoke-autonomy-runner-skeleton-planning-v0-1",
    "priorPhaseSmokeScripts",
    "smoke:autonomy-runner-preflight-v0-1",
    "smoke:autonomy-runner-preflight-route-v0-1",
    "smoke:autonomy-runner-preflight-web-preview-v0-1",
    "smoke:chatgpt-app-autonomy-runner-preflight-tool-v0-1",
    "smoke:codex-autonomy-runner-preflight-v0-1",
    "smoke:autonomy-runner-preflight-copy-export-v0-1",
    "assertChangedFilesWithin",
    "collectUntrackedFiles",
    "Unexpected changed file for Phase 9G Autonomy Runner skeleton planning",
  ], { textByFile });

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

function assertChangedFileBoundary() {
  const untracked = collectUntrackedFiles();
  const result = assertChangedFilesWithin({
    allowedChangedFiles,
    label: "Phase 9G Autonomy Runner skeleton planning",
  });

  const contentOnly = result.mode === "content-only";
  if (!contentOnly) {
    for (const file of untracked) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected untracked file for Phase 9G Autonomy Runner skeleton planning: ${file}`,
      );
    }
  }

  const files = uniqueSorted([...result.files, ...untracked]);
  if (!contentOnly) {
    for (const file of files) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected changed file for Phase 9G Autonomy Runner skeleton planning: ${file}`,
      );

      if (
        priorSmokeAllowlistCompatibilityFiles.includes(file) ||
        optionalPointerFiles.includes(file)
      ) {
        continue;
      }

      for (const pattern of forbiddenChangedFilePatterns) {
        assert(
          !pattern.test(file),
          `Forbidden changed file for Phase 9G Autonomy Runner skeleton planning: ${file}`,
        );
      }
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

function assertNoExecutablePlanningDocSnippets(text, file) {
  const forbiddenSnippets = [
    "export function",
    "export class",
    "class AutonomyRunner",
    "function run",
    "function start",
    "setInterval(",
    "setTimeout(",
    "worker_threads",
    "queueMicrotask",
    "NextResponse",
    "export async function GET",
    "export async function POST",
    "fs.writeFile",
    "writeFileSync",
    "appendFile",
    "createWriteStream",
    "fetch(",
    "@octokit",
    "@openai",
    "openai.chat",
    "child_process",
    "URL.createObjectURL",
    "download=",
  ];

  const normalized = normalizeText(text).toLowerCase();
  for (const snippet of forbiddenSnippets) {
    assert(
      !normalized.includes(snippet.toLowerCase()),
      `${file} must not contain executable/runtime snippet: ${snippet}`,
    );
  }
}

parsePackageJson(packageJsonText);
