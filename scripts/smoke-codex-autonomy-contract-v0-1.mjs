import assert from "node:assert/strict";
import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertNoRuntimeImports,
  assertPackageScript,
  collectUntrackedFiles,
  loadTextByFile,
  normalizeText,
  parsePackageJson,
} from "./smoke-boundary-common.mjs";

const consumptionDoc = "docs/CODEX_AUTONOMY_CONTRACT_CONSUMPTION_V0_1.md";
const skillFile =
  "plugins/augnes-operator/skills/augnes-autonomy-contract/SKILL.md";
const pluginDoc = "docs/CODEX_AUGNES_OPERATOR_PLUGIN_V0_2.md";
const autonomyContractDoc = "docs/AUTONOMY_CONTRACT_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const pluginJsonFile = "plugins/augnes-operator/.codex-plugin/plugin.json";
const packageJsonFile = "package.json";
const smokeFile = "scripts/smoke-codex-autonomy-contract-v0-1.mjs";

const priorSmokeAllowlistCompatibilityFiles = [
  "scripts/smoke-codex-handoff-capsule-v0-1.mjs",
  "scripts/smoke-codex-guidebrief-handoff-v0-1.mjs",
  "scripts/smoke-augnes-operator-plugin-v2.mjs",
  "scripts/smoke-autonomy-contract-v0-1.mjs",
  "scripts/smoke-autonomy-contract-route-v0-1.mjs",
  "scripts/smoke-autonomy-contract-web-preview-v0-1.mjs",
  "scripts/smoke-chatgpt-app-autonomy-contract-tool-v0-1.mjs",
  "scripts/smoke-handoff-capsule-v0-1.mjs",
  "scripts/smoke-handoff-capsule-route-v0-1.mjs",
  "scripts/smoke-handoff-capsule-web-preview-v0-1.mjs",
  "scripts/smoke-chatgpt-app-handoff-capsule-tool-v0-1.mjs",
  "scripts/smoke-handoff-capsule-copy-export-v0-1.mjs",
  "scripts/smoke-guide-brief-v0-1.mjs",
  "scripts/smoke-guide-brief-route-v0-1.mjs",
  "scripts/smoke-web-guide-panel-v0-1.mjs",
  "scripts/smoke-chatgpt-app-guide-brief-tool-v0-1.mjs",
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
];

const phase8fAutonomyContractCopyExportFiles = [
  "lib/autonomy/autonomy-contract-copy-export.ts",
  "components/autonomy/autonomy-copy-export-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "lib/autonomy/read-autonomy-contract-for-web.ts",
  "components/autonomy/autonomy-boundary-card.tsx",
  "components/autonomy/autonomy-contract-preview-panel.tsx",
  "scripts/smoke-autonomy-contract-copy-export-v0-1.mjs",
  "scripts/smoke-autonomy-contract-web-preview-v0-1.mjs",
  "docs/AUTONOMY_CONTRACT_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
];

const inspectedFiles = [
  consumptionDoc,
  skillFile,
  pluginDoc,
  autonomyContractDoc,
  indexDoc,
  pluginJsonFile,
  packageJsonFile,
  smokeFile,
];

const phase9aAutonomyRunnerPreflightFiles = [
  "docs/AUTONOMY_RUNNER_PREFLIGHT_V0_1.md",
  "types/autonomy-runner.ts",
  "lib/autonomy/autonomy-runner-preflight.ts",
  "fixtures/autonomy-runner-preflight.sample.v0.1.json",
  "scripts/smoke-autonomy-runner-preflight-v0-1.mjs",
  "app/api/augnes/read/autonomy-runner-preflight/route.ts",
  "lib/autonomy/autonomy-runner-preflight-source.ts",
  "scripts/smoke-autonomy-runner-preflight-route-v0-1.mjs",
  "package.json",
  "docs/00_INDEX_LATEST.md",
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
];
const allowedChangedFiles = new Set([
  consumptionDoc,
  skillFile,
  smokeFile,
  pluginDoc,
  autonomyContractDoc,
  indexDoc,
  packageJsonFile,
  ...priorSmokeAllowlistCompatibilityFiles,
  ...phase8fAutonomyContractCopyExportFiles,
]);
for (const file of phase9aAutonomyRunnerPreflightFiles) {
  allowedChangedFiles.add(file);
}

const forbiddenChangedPathPatterns = [
  /^app\/api\//,
  /^components\/(?!autonomy\/autonomy-copy-export-panel\.tsx$|autonomy\/autonomy-boundary-card\.tsx$|autonomy\/autonomy-contract-preview-panel\.tsx$|workplane\/agent-workplane\.tsx$)/,
  /^apps\/augnes_apps\//,
  /^lib\/autonomy\/(?!autonomy-contract-copy-export\.ts$|read-autonomy-contract-for-web\.ts$)/,
  /^types\/autonomy-contract\.ts$/,
  /^fixtures\/autonomy-contract\.sample\.v0\.1\.json$/,
  /^migrations\//,
  /^lib\/db/,
  /^provider\//i,
  /^providers\//i,
  /^proof\//i,
  /^evidence\//i,
  /(^|\/)(scheduler|autonomy-runner|autonomy_runner|daemon)(\/|$)/i,
  /(^|\/)(handoff-execution|handoff_execution)(\/|$)/i,
  /(^|\/)(route|api)\.(js|jsx|ts|tsx)$/,
];

const textByFile = loadTextByFile(inspectedFiles);

assertPackageJsonScript();
assertConsumptionDoc();
assertSkill();
assertPluginDoc();
assertAutonomyContractDoc();
assertIndexPointer();
assertPluginManifestMetadataOnly();
assertSmokeScriptBoundary();
const changedFilesBoundary = assertChangedFilesBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "codex-autonomy-contract-v0-1",
      pass: true,
      required_files_checked: inspectedFiles,
      package_script_checked: true,
      consumption_doc_checked: true,
      skill_checked: skillFile,
      plugin_doc_checked: true,
      autonomy_contract_doc_checked: true,
      latest_index_checked: true,
      plugin_manifest_metadata_only_checked: true,
      prior_smoke_allowlist_compatibility_files_allowed:
        priorSmokeAllowlistCompatibilityFiles,
      phase8f_autonomy_contract_copy_export_files_allowed:
        phase8fAutonomyContractCopyExportFiles,
      no_app_api_route_files_changed_checked: true,
      no_components_files_changed_checked: true,
      no_apps_augnes_apps_files_changed_checked: true,
      no_lib_autonomy_runtime_files_changed_checked: true,
      no_db_migration_schema_changes_checked: true,
      no_provider_openai_github_client_actuation_checked: true,
      no_codex_execution_code_checked: true,
      no_proof_evidence_write_code_checked: true,
      no_scheduler_autonomy_runner_checked: true,
      no_daemon_background_work_checked: true,
      no_handoff_execution_added_checked: true,
      no_branch_pr_creation_runtime_added_checked: true,
      no_copy_export_behavior_added_checked: true,
      changed_files_boundary_checked: changedFilesBoundary.checked,
      changed_files_boundary_skipped: changedFilesBoundary.skipped,
      changed_files_boundary_skip_reason: changedFilesBoundary.skip_reason,
      changed_files_observed: changedFilesBoundary.files,
      changed_files_base_ref: changedFilesBoundary.base_ref,
      untracked_files_checked: changedFilesBoundary.untracked_checked,
      untracked_files_skipped: changedFilesBoundary.untracked_skipped,
      untracked_files_skip_reason: changedFilesBoundary.untracked_skip_reason,
      smoke_type:
        "static-codex-autonomy-contract-doc-skill-smoke-package-index-boundary-only",
    },
    null,
    2,
  ),
);
console.log("PASS smoke:codex-autonomy-contract-v0-1");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText: textByFile.get(packageJsonFile),
    scriptName: "smoke:codex-autonomy-contract-v0-1",
    expectedCommand: "node scripts/smoke-codex-autonomy-contract-v0-1.mjs",
  });
}

function assertConsumptionDoc() {
  assertContainsAll(consumptionDoc, [
    "Codex Autonomy Contract consumption",
    "planning boundary context for a separately scoped user/operator task",
    "Autonomy Contract is a bounded delegation contract for future autonomous or scheduled work.",
    "Autonomy Contract is not Autonomy Runner.",
    "Autonomy Budget is not spend permission.",
    "Autonomy Delta Merge Policy is not state apply implementation.",
    "Autonomy Run Preview is not background work.",
    "Autonomy Contract may describe a future autonomous run.",
    "Autonomy Contract may not run, schedule, launch, apply, post, merge, or mutate anything.",
    "Phase 9 runner requires separate explicit scope and approval.",
    "Codex may use Autonomy Contract to preserve budget, stop conditions, forbidden actions, review escalation, validation policy, reporting policy, output policy, source refs, and authority boundary.",
    "Codex must not treat Autonomy Contract as permission to execute autonomously.",
    "Codex must not treat allowed_actions as commands.",
    "Codex must not treat budget as spend permission.",
    "Codex must not treat run_preview as active execution.",
    "Codex must not treat delta_merge_policy as implementation of auto-apply.",
    "Codex must not auto-apply durable memory or project Perspective.",
    "Codex must not decide unresolved user judgment.",
    "Codex must not claim proof/evidence writes unless separately scoped and actually completed.",
    "Codex must not claim background work.",
    "Codex must not merge.",
    "Active user/operator prompt and AGENTS.md remain the authority",
    "contract_ref",
    "contract_id",
    "autonomy_mode",
    "bounded_context_summary",
    "guide_brief_refs",
    "handoff_capsule_refs",
    "codex_launch_card_refs",
    "current_working_perspective_refs",
    "delta_projection_refs",
    "workplane_refs",
    "context_scope",
    "allowed_agents",
    "allowed_surfaces",
    "allowed_actions",
    "forbidden_actions",
    "budget",
    "reporting_cadence",
    "stop_conditions",
    "delta_merge_policy",
    "review_escalation_policy",
    "output_policy",
    "staleness_policy",
    "validation_policy",
    "run_preview",
    "authority_boundary",
    "route_authority_boundary",
    "read_boundary",
    "source_status",
    "warnings",
    "gaps",
    "public_safety",
    "next_phase_notes",
    "Restate or preserve the Autonomy Contract goal and bounded context.",
    "Preserve source refs as refs, not invented source content.",
    "budget as boundary only",
    "missing or stale budget as a blocker",
    "allowed_actions as planning context only, not automatic permission",
    "forbidden_actions as hard review warnings",
    "Preserve stop conditions.",
    "Preserve review escalation triggers.",
    "`run_preview.status` as `preview_only`",
    "AutonomyRunPreview is not execution",
    "no runner/scheduler/daemon/background job exists",
    "auto_apply_allowed` false",
    "`auto_apply_targets` as empty",
    "Durable memory and project Perspective require review.",
    "proof/evidence boundary",
    "Budget is not spend permission.",
    "If budget is missing, stale, exceeded, or unclear",
    "Autonomy Delta Merge Policy is not state apply implementation.",
    "auto_apply_allowed` is false in Phase 8",
    "Proof/evidence write, external publication, GitHub actuation, provider call, branch/PR creation, and durable apply without review remain blocked",
    "Autonomy Contract consumed: yes/no.",
    "Budget boundary preserved: yes/no.",
    "Forbidden actions preserved: yes/no.",
    "Stop conditions preserved: yes/no.",
    "Review escalation preserved: yes/no.",
    "Delta merge policy preserved: yes/no.",
    "auto_apply_allowed remained false: yes/no.",
    "run_preview remained preview_only: yes/no.",
    "authority boundary preserved: yes/no.",
    "source refs preserved: yes/no.",
    "forbidden files touched: yes/no with explanation.",
    "proof/evidence write status or skipped reason.",
    "unresolved user judgment carried forward: yes/no.",
    "no runner/scheduler/daemon/background work statement.",
    "no merge statement.",
  ], { textByFile });
}

function assertSkill() {
  assertContainsAll(skillFile, [
    "name: augnes-autonomy-contract",
    "description: Consume Autonomy Contract packets as bounded Codex planning context",
    "## Purpose",
    "## Operating Contract",
    "## Autonomy Contract Intake",
    "## Budget And Scope Boundary Rules",
    "## Allowed / Forbidden Action Rules",
    "## Delta Merge And Review Escalation Rules",
    "## Stop Conditions And Reporting Rules",
    "## Source Refs And Validation Rules",
    "## Authority Boundary",
    "## PR Body Requirements",
    "## Final Report Requirements",
    "## Non-Goals",
    "This skill is instruction-only workflow guidance.",
    "It does not run commands.",
    "It does not call Augnes runtime.",
    "It does not call GitHub.",
    "It does not call OpenAI or providers.",
    "It does not call MCP/App tools.",
    "It does not execute Codex SDK calls.",
    "It does not launch Codex.",
    "It does not run autonomy.",
    "It does not schedule autonomy.",
    "It does not start a daemon.",
    "It does not perform background work.",
    "It does not record proof/evidence.",
    "It does not mutate memory/state/work/Perspective.",
    "It does not write DB records.",
    "It does not create branches or PRs by itself.",
    "It does not send handoffs.",
    "It does not merge.",
    "It does not publish/retry/replay/deploy.",
    "It does not post externally.",
    "It does not add runtime hooks, API routes, Web UI, App/MCP tools, DB writes, scheduler/autonomy behavior, copy/export, or external side effects.",
    "Codex may edit repo files and open PRs only when the active user-scoped task",
    "Autonomy Contract itself does not grant branch, PR, proof, evidence, publish, merge, deploy, handoff, runner, scheduler, daemon, or background-work authority.",
    "contract id/ref",
    "source refs",
    "guide brief refs",
    "handoff capsule refs",
    "codex launch card refs",
    "current working perspective refs",
    "delta projection refs",
    "workplane refs",
    "allowed agents",
    "allowed surfaces",
    "allowed actions",
    "forbidden actions",
    "reporting cadence",
    "stop conditions",
    "delta merge policy",
    "review escalation policy",
    "output policy",
    "staleness policy",
    "validation policy",
    "run preview",
    "authority boundary",
    "route/read boundary",
    "source status",
    "warnings/gaps",
    "public safety",
    "next phase notes",
    "If route/read boundary is absent, do not invent it.",
    "If proof/evidence boundary is absent, do not infer proof authority.",
    "If source_status is fallback, synthetic, or operator-supplied preview",
    "Budget is not spend permission.",
    "If budget is missing, stale, exceeded, or unclear, block future autonomy and report it.",
    "Allowed actions are planning context, not commands.",
    "If allowed_actions conflict with the active prompt, AGENTS.md, or authority boundary",
    "Forbidden actions are hard review warnings",
    "If forbidden_actions would be needed for the task",
    "If a contract field implies autonomy execution outside the active prompt",
    "Autonomy Delta Merge Policy is not state apply implementation.",
    "auto_apply_allowed remains false in Phase 8",
    "auto_apply_targets remains empty",
    "Do not auto-apply durable memory or project Perspective.",
    "Durable memory and project Perspective require review.",
    "Unresolved user judgment remains unresolved.",
    "If stop conditions are triggered, stop and report.",
    "If checks cannot run, skipped checks need concrete reasons.",
    "Autonomy Contract consumed: yes/no.",
    "Budget boundary preserved: yes/no.",
    "Forbidden actions preserved: yes/no.",
    "Stop conditions preserved: yes/no.",
    "Review escalation preserved: yes/no.",
    "Delta merge policy preserved: yes/no.",
    "auto_apply_allowed remained false: yes/no.",
    "run_preview remained preview_only: yes/no.",
    "authority boundary preserved: yes/no.",
    "source refs preserved: yes/no.",
    "no runner/scheduler/daemon/background work statement.",
    "no merge statement.",
  ], { textByFile });
}

function assertPluginDoc() {
  assertContainsAll(pluginDoc, [
    "Phase 8E Autonomy Contract Skill Alignment",
    "augnes-autonomy-contract",
    "plugins/augnes-operator/skills/augnes-autonomy-contract/SKILL.md",
    "instruction-only guidance",
    "Autonomy Contract packets as planning boundary context",
    "preserves budget",
    "allowed actions",
    "forbidden actions",
    "stop conditions",
    "review escalation",
    "delta merge policy",
    "output policy",
    "validation policy",
    "source/fallback status",
    "warnings/gaps",
    "run preview",
    "authority boundaries",
    "Autonomy Budget as boundary only",
    "allowed actions as planning context only",
    "`auto_apply_allowed` false",
    "`run_preview` as `preview_only`",
    "unresolved user judgment unresolved",
    "no runtime behavior",
    "no network calls",
    "no GitHub calls",
    "no OpenAI/provider calls",
    "no Augnes runtime calls",
    "no hooks",
    "no MCP config",
    "no App/MCP tool changes",
    "no Web UI",
    "no DB writes",
    "no proof/evidence writes",
    "no handoff execution",
    "no autonomy runner",
    "no scheduler",
    "no daemon",
    "no background work",
    "no copy/export",
    "no branch/PR creation from Augnes product code",
    "no merge/publish/retry/replay/deploy",
    "no external side effects",
    "does not imply that `plugin.json` adds runtime capability",
  ], { textByFile });
}

function assertAutonomyContractDoc() {
  assertContainsAll(autonomyContractDoc, [
    "Phase 8E Codex Skill Alignment",
    "docs/CODEX_AUTONOMY_CONTRACT_CONSUMPTION_V0_1.md",
    "plugins/augnes-operator/skills/augnes-autonomy-contract/SKILL.md",
    "scripts/smoke-codex-autonomy-contract-v0-1.mjs",
    "npm run smoke:codex-autonomy-contract-v0-1",
    "Codex can consume Autonomy Contract as planning boundary context only for separately scoped operator tasks.",
    "budget as boundary only",
    "allowed actions as planning context only",
    "forbidden actions as hard review warnings",
    "stop conditions",
    "review escalation",
    "delta merge policy",
    "output policy",
    "validation policy",
    "source/fallback status",
    "warnings/gaps",
    "run preview",
    "authority boundaries",
    "adds no runtime hooks",
    "no API routes",
    "no Web UI",
    "no App/MCP tools",
    "no DB schema/migration",
    "no DB writes",
    "no provider/OpenAI calls",
    "no GitHub actuation",
    "no Codex execution from Augnes",
    "no proof/evidence writes",
    "no memory mutation",
    "no durable Perspective apply",
    "no handoff send/execution",
    "no branch/PR creation behavior from Augnes product code",
    "no scheduler",
    "no autonomy runner",
    "no daemon",
    "no background work",
    "no copy/export",
    "no merge/publish/retry/replay/deploy",
    "no external side effects",
    "Phase 8F Local Copy/Export Preview",
    "local clipboard copy and manual text export preview only",
    "Phase 9 Autonomy Runner planning and implementation remain future work and require separate explicit scope and approval.",
    "Phase 9 runner remains deferred and requires separate explicit scope and approval.",
  ], { textByFile });
}

function assertIndexPointer() {
  assertContainsAll(indexDoc, [
    "Phase 8E Codex Autonomy Contract alignment v0.1",
    "CODEX_AUTONOMY_CONTRACT_CONSUMPTION_V0_1.md",
    "plugins/augnes-operator/skills/augnes-autonomy-contract/SKILL.md",
    "scripts/smoke-codex-autonomy-contract-v0-1.mjs",
    "smoke:codex-autonomy-contract-v0-1",
    "instruction-only Codex planning-boundary guidance",
    "budget boundaries",
    "allowed/forbidden actions",
    "stop conditions",
    "review escalation",
    "delta merge policy",
    "output policy",
    "validation policy",
    "source/fallback status",
    "warnings/gaps",
    "run preview",
    "authority boundaries",
    "no runtime/write/execution/schedule authority",
    "no runtime hooks",
    "Web UI",
    "API routes",
    "App/MCP tools",
    "DB schema/migration",
    "DB write",
    "provider/OpenAI call",
    "GitHub actuation from Augnes product code",
    "Codex execution from Augnes product code",
    "autonomy runner",
    "scheduler",
    "daemon",
    "background work",
    "proof/evidence write",
    "memory mutation",
    "durable Perspective apply",
    "handoff send",
    "branch/PR creation behavior",
    "copy/export",
    "external side effect",
    "This index pointer is not roadmap authority.",
  ], { textByFile });
}

function assertPluginManifestMetadataOnly() {
  const plugin = parsePackageJson(textByFile.get(pluginJsonFile));
  assert.equal(plugin.name, "augnes-operator");
  assert.equal(plugin.skills, "./skills/");
  assert.equal(plugin.mcpServers, undefined, "plugin.json must not add MCP config");
  assert.equal(plugin.apps, undefined, "plugin.json must not add app mappings");
  assert.equal(plugin.hooks, undefined, "plugin.json must not add hooks");
  assert.equal(plugin.commands, undefined, "plugin.json must not add commands");
}

function assertSmokeScriptBoundary() {
  assertNoRuntimeImports({
    file: smokeFile,
    text: textByFile.get(smokeFile),
    forbiddenImports: [
      "app/",
      "app/api/",
      "components/",
      "apps/augnes_apps/",
      "lib/autonomy",
      "lib/db",
      "migrations/",
      "provider/",
      "providers/",
      "proof/",
      "evidence/",
      "scheduler/",
      "autonomy-runner",
      "@openai/codex-sdk",
      "openai",
      "octokit",
      "@octokit",
    ],
  });

  const combinedText = normalizeText(
    [
      textByFile.get(consumptionDoc),
      textByFile.get(skillFile),
      textByFile.get(pluginDoc),
      textByFile.get(autonomyContractDoc),
    ].join("\n"),
  );

  assert(!/\ballowed actions are commands\b/i.test(combinedText));
  assert(!/\bbudget is spend permission\b/i.test(combinedText));
  assert(!/\brun_preview is execution\b/i.test(combinedText));
  assert(!/\bauto_apply_allowed remains true\b/i.test(combinedText));
  assert(!/\bmust run autonomy\b/i.test(combinedText));
  assert(!/\bmust schedule autonomy\b/i.test(combinedText));
  assert(!/\bmust launch Codex\b/i.test(combinedText));
}

function assertChangedFilesBoundary() {
  const result = assertChangedFilesWithin({
    allowedChangedFiles,
    label: "Codex Autonomy Contract alignment boundary smoke",
  });
  const untrackedFiles = collectUntrackedFiles();
  const contentOnly = result.mode === "content-only";

  if (!contentOnly) {
    for (const file of untrackedFiles) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected untracked file for Codex Autonomy Contract alignment smoke: ${file}`,
      );
    }
  }

  const files = [...new Set([...result.files, ...untrackedFiles])].sort();
  if (!contentOnly) {
    for (const file of files) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected changed file for Codex Autonomy Contract alignment smoke: ${file}`,
      );
      assert(
        phase9aAutonomyRunnerPreflightFiles.includes(file) ||
          !forbiddenChangedPathPatterns.some((pattern) => pattern.test(file)),
        `Forbidden changed file for Codex Autonomy Contract alignment smoke: ${file}`,
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
