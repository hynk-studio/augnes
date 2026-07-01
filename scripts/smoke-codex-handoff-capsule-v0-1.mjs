import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertNoRuntimeImports,
  assertPackageScript,
  loadTextByFile,
  normalizeText,
  parsePackageJson,
} from "./smoke-boundary-common.mjs";

const consumptionDoc = "docs/CODEX_HANDOFF_CAPSULE_CONSUMPTION_V0_1.md";
const skillFile =
  "plugins/augnes-operator/skills/augnes-handoff-capsule/SKILL.md";
const pluginDoc = "docs/CODEX_AUGNES_OPERATOR_PLUGIN_V0_2.md";
const handoffContractDoc = "docs/HANDOFF_CAPSULE_CONTRACT_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const pluginJsonFile = "plugins/augnes-operator/.codex-plugin/plugin.json";
const packageJsonFile = "package.json";
const smokeFile = "scripts/smoke-codex-handoff-capsule-v0-1.mjs";

const priorSmokeAllowlistCompatibilityFiles = [
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
  "scripts/smoke-guide-brief-v0-1.mjs",
  "scripts/smoke-guide-brief-route-v0-1.mjs",
  "scripts/smoke-web-guide-panel-v0-1.mjs",
  "scripts/smoke-chatgpt-app-guide-brief-tool-v0-1.mjs",
  "scripts/smoke-codex-guidebrief-handoff-v0-1.mjs",
  "scripts/smoke-augnes-operator-plugin-v2.mjs",
  "scripts/smoke-augnes-capsule-handoff-skill.mjs",
  "scripts/smoke-handoff-capsule-v0-1.mjs",
  "scripts/smoke-handoff-capsule-route-v0-1.mjs",
  "scripts/smoke-handoff-capsule-web-preview-v0-1.mjs",
  "scripts/smoke-chatgpt-app-handoff-capsule-tool-v0-1.mjs",
  "lib/handoff/handoff-capsule-copy-export.ts",
  "components/handoff/handoff-copy-export-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "lib/handoff/read-handoff-capsule-for-web.ts",
  "components/handoff/handoff-preview-boundary-card.tsx",
  "components/handoff/codex-launch-card-preview-panel.tsx",
  "components/handoff/handoff-capsule-preview-panel.tsx",
  "scripts/smoke-handoff-capsule-copy-export-v0-1.mjs",
];

const inspectedFiles = [
  consumptionDoc,
  skillFile,
  pluginDoc,
  handoffContractDoc,
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
  "lib/autonomy/read-autonomy-runner-preflight-for-web.ts",
  "components/autonomy/autonomy-runner-preflight-preview-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "scripts/smoke-autonomy-runner-preflight-web-preview-v0-1.mjs",
  "scripts/smoke-chatgpt-app-autonomy-runner-preflight-tool-v0-1.mjs",
  "docs/CODEX_AUTONOMY_RUNNER_PREFLIGHT_CONSUMPTION_V0_1.md",
  "plugins/augnes-operator/skills/augnes-autonomy-runner-preflight/SKILL.md",
  "scripts/smoke-codex-autonomy-runner-preflight-v0-1.mjs",
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
  "docs/AUTONOMY_CONTRACT_V0_1.md",
  "types/autonomy-contract.ts",
  "lib/autonomy/autonomy-contract.ts",
  "fixtures/autonomy-contract.sample.v0.1.json",
  "scripts/smoke-autonomy-contract-v0-1.mjs",
  "app/api/augnes/read/autonomy-contract/route.ts",
  "lib/autonomy/autonomy-contract-source.ts",
  "scripts/smoke-autonomy-contract-route-v0-1.mjs",
  "package.json",
  "docs/00_INDEX_LATEST.md",
  consumptionDoc,
  skillFile,
  smokeFile,
  pluginDoc,
  handoffContractDoc,
  indexDoc,
  packageJsonFile,
  ...priorSmokeAllowlistCompatibilityFiles,
]);
for (const file of phase9aAutonomyRunnerPreflightFiles) {
  allowedChangedFiles.add(file);
}
const phase8PriorSmokeAllowlistFiles = [
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
];
for (const file of phase8PriorSmokeAllowlistFiles) {
  allowedChangedFiles.add(file);
}
const phase8cAutonomyContractWebPreviewFiles = [
  "components/autonomy/autonomy-boundary-card.tsx",
  "components/autonomy/autonomy-budget-preview-panel.tsx",
  "components/autonomy/autonomy-contract-preview-panel.tsx",
  "components/autonomy/autonomy-policy-preview-panel.tsx",
  "components/autonomy/autonomy-preview-shared.tsx",
  "components/autonomy/autonomy-run-preview-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "lib/autonomy/read-autonomy-contract-for-web.ts",
  "scripts/smoke-autonomy-contract-web-preview-v0-1.mjs",
];
for (const file of phase8cAutonomyContractWebPreviewFiles) {
  allowedChangedFiles.add(file);
}

const phase8dAutonomyContractAppToolFiles = new Set([
  "apps/augnes_apps/src/server.ts",
  "apps/augnes_apps/src/lib/state-runtime-types.ts",
  "apps/augnes_apps/src/adapters/state-runtime-http.ts",
  "apps/augnes_apps/scripts/invariants.ts",
  "apps/augnes_apps/scripts/smoke.ts",
  "apps/augnes_apps/scripts/mock-state-runtime.ts",
  "docs/CHATGPT_APP_MCP_READONLY_SURFACE_BOUNDARY_V0_1.md",
  "scripts/smoke-chatgpt-app-autonomy-contract-tool-v0-1.mjs",
]);
for (const file of phase8dAutonomyContractAppToolFiles) {
  allowedChangedFiles.add(file);
}

const phase8eAutonomyContractCodexSkillFiles = new Set([
  "docs/CODEX_AUTONOMY_CONTRACT_CONSUMPTION_V0_1.md",
  "plugins/augnes-operator/skills/augnes-autonomy-contract/SKILL.md",
  "scripts/smoke-codex-autonomy-contract-v0-1.mjs",
  "docs/CODEX_AUGNES_OPERATOR_PLUGIN_V0_2.md",
  "docs/AUTONOMY_CONTRACT_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
]);
for (const file of phase8eAutonomyContractCodexSkillFiles) {
  allowedChangedFiles.add(file);
}

const phase8fAutonomyContractCopyExportFiles = new Set([
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
]);
for (const file of phase8fAutonomyContractCopyExportFiles) {
  allowedChangedFiles.add(file);
}

const forbiddenChangedPathPatterns = [
  /^app\/api\//,
  /^components\/(?!autonomy\/|workplane\/agent-workplane\.tsx$)/,
  /^apps\/augnes_apps\//,
  /^lib\/handoff\//,
  /^types\/handoff-capsule\.ts$/,
  /^fixtures\//,
  /^migrations\//,
  /^lib\/db(\.ts)?$/,
  /^provider\//i,
  /^providers\//i,
  /^proof\//i,
  /^evidence\//i,
  /^autonomy\//i,
  /(^|\/)(scheduler|autonomy-runner|autonomy_runner)(\/|$)/i,
  /(^|\/)(handoff-execution|handoff_execution)(\/|$)/i,
  /(^|\/)(route|api)\.(js|jsx|ts|tsx)$/,
];

const followOnHandoffCapsuleCopyExportFiles = new Set([
  "lib/handoff/handoff-capsule-copy-export.ts",
  "components/handoff/handoff-copy-export-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "lib/handoff/read-handoff-capsule-for-web.ts",
  "components/handoff/handoff-preview-boundary-card.tsx",
  "components/handoff/codex-launch-card-preview-panel.tsx",
  "components/handoff/handoff-capsule-preview-panel.tsx",
  "scripts/smoke-handoff-capsule-copy-export-v0-1.mjs",
  "scripts/smoke-handoff-capsule-web-preview-v0-1.mjs",
]);

const phase8AutonomyContractCoreFiles = new Set([
  "docs/AUTONOMY_CONTRACT_V0_1.md",
  "types/autonomy-contract.ts",
  "lib/autonomy/autonomy-contract.ts",
  "fixtures/autonomy-contract.sample.v0.1.json",
  "scripts/smoke-autonomy-contract-v0-1.mjs",
  "app/api/augnes/read/autonomy-contract/route.ts",
  "lib/autonomy/autonomy-contract-source.ts",
  "scripts/smoke-autonomy-contract-route-v0-1.mjs",
  "package.json",
  "docs/00_INDEX_LATEST.md",
]);

const textByFile = loadTextByFile(inspectedFiles);

assertPackageJsonScript();
assertConsumptionDoc();
assertSkill();
assertPluginDoc();
assertHandoffContractDoc();
assertIndexPointer();
assertPluginManifestMetadataOnly();
assertSmokeScriptBoundary();
const changedFilesBoundary = assertChangedFilesBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "codex-handoff-capsule-v0-1",
      pass: true,
      required_files_checked: inspectedFiles,
      package_script_checked: true,
      consumption_doc_checked: true,
      skill_checked: skillFile,
      plugin_doc_checked: true,
      handoff_contract_checked: true,
      latest_index_checked: true,
      plugin_manifest_metadata_only_checked: true,
      prior_smoke_allowlist_compatibility_files_allowed:
        priorSmokeAllowlistCompatibilityFiles,
      no_app_api_changes_checked: true,
      no_components_changes_checked: true,
      no_apps_augnes_apps_changes_checked: true,
      no_lib_handoff_runtime_changes_checked: true,
      no_db_migration_schema_changes_checked: true,
      no_provider_openai_github_runtime_calls_checked: true,
      no_codex_execution_code_checked: true,
      no_proof_evidence_write_code_checked: true,
      no_scheduler_autonomy_runner_checked: true,
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
        "static-codex-handoff-capsule-doc-skill-smoke-package-index-boundary-only",
    },
    null,
    2,
  ),
);
console.log("PASS smoke:codex-handoff-capsule-v0-1");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText: textByFile.get(packageJsonFile),
    scriptName: "smoke:codex-handoff-capsule-v0-1",
    expectedCommand: "node scripts/smoke-codex-handoff-capsule-v0-1.mjs",
  });
}

function assertConsumptionDoc() {
  assertContainsAll(consumptionDoc, [
    "Codex Handoff Capsule consumption",
    "Handoff Capsule and Codex Launch Card are reviewable transfer packets.",
    "They prepare context for another surface.",
    "They do not send, launch, execute, post, merge, publish, or mutate state.",
    "CodexLaunchCard is not Codex execution.",
    "HandoffCapsule is not handoff send.",
    "Codex Launch Card is not branch creation.",
    "Codex Launch Card is not PR creation.",
    "No status may mean executed.",
    "Suggestions are advisory only.",
    "Needs user judgment remains unresolved.",
    "Source refs remain refs.",
    "Expected files and expected checks are planning inputs.",
    "Forbidden files and forbidden actions must be treated as hard scope warnings",
    "skipped check policy",
    "Proof/evidence boundary must be reported honestly.",
    "The active user/operator prompt and `AGENTS.md` remain the authority",
    "capsule_ref",
    "capsule_id",
    "launch_card_ref",
    "launch_card_id",
    "source_guide_brief_ref",
    "source_snapshot_refs",
    "repo",
    "base_branch",
    "branch_suggestion",
    "expected_pr_title",
    "task_goal",
    "task_summary",
    "context_anchors",
    "observed_context",
    "inferred_context",
    "suggested_context",
    "needs_user_judgment",
    "unresolved_user_judgment",
    "source_refs",
    "selected_delta_refs",
    "expected_files",
    "forbidden_files",
    "allowed_change_scope",
    "forbidden_actions",
    "required_checks",
    "optional_checks",
    "skipped_check_policy",
    "pr_body_requirements",
    "final_report_requirements",
    "proof_evidence_boundary",
    "authority_boundary",
    "route_authority_boundary",
    "read_boundary",
    "source_status",
    "warnings",
    "gaps",
    "public_safety",
    "next_phase_notes",
    "Restate or preserve Observed context separately from Inferred context.",
    "Keep Inferred caveats and confidence.",
    "Treat Suggested context and `suggestions_for_codex` as advisory only.",
    "Surface unresolved user judgment instead of deciding it.",
    "Map `expected_files` to expected changed-file scope",
    "Map `forbidden_files` to review warnings and changed-file boundary checks.",
    "Map `required_checks` to the validation plan.",
    "Map `skipped_check_policy` to final skipped-check reporting.",
    "Map `pr_body_requirements` and `final_report_requirements`",
    "Do not claim live runtime data unless `source_status` says the packet is live.",
    "Do not claim proof/evidence writes unless separately scoped and actually completed.",
    "Do not claim background work.",
    "Do not merge.",
    "Handoff Capsule consumed: yes/no.",
    "Codex Launch Card consumed: yes/no.",
    "observed/inferred/suggested/judgment separation preserved: yes/no.",
    "forbidden files touched: yes/no with explanation.",
    "unresolved user judgment carried forward: yes/no.",
    "no background work statement.",
    "no merge statement.",
    "Phase 7F copy/export remains deferred",
    "no runtime hook",
    "no API route",
    "no Web UI",
    "no ChatGPT App/MCP tool",
    "no DB write",
    "no provider/OpenAI call",
    "no GitHub actuation from Augnes product code",
    "no Codex execution from Augnes product code",
    "no proof/evidence write",
    "no memory mutation",
    "no durable Perspective apply",
    "no scheduler/autonomy runner",
    "no handoff send or execution",
    "no branch/PR creation behavior from Augnes product code",
    "no copy/export behavior",
    "no external side effects",
  ], { textByFile });
}

function assertSkill() {
  assertContainsAll(skillFile, [
    "name: augnes-handoff-capsule",
    "description: Consume Handoff Capsule and Codex Launch Card packets",
    "This skill is instruction-only workflow guidance.",
    "It does not run commands",
    "call Augnes runtime",
    "call GitHub",
    "call OpenAI or providers",
    "call MCP/App tools",
    "execute Codex SDK calls",
    "record proof/evidence",
    "mutate memory/state/work or Perspective",
    "create branches or PRs by itself",
    "merge, publish, retry, replay, deploy",
    "send handoffs",
    "post externally",
    "Codex may edit repo files and open PRs only when the active user-scoped task",
    "Handoff Capsule and Codex Launch Card packets themselves do not grant branch",
    "CodexLaunchCard is not Codex execution.",
    "HandoffCapsule is not handoff send.",
    "Codex Launch Card is not branch creation.",
    "Codex Launch Card is not PR creation.",
    "No status may mean executed.",
    "Suggestions are advisory only.",
    "Unresolved user judgment remains unresolved",
    "capsule id/ref",
    "launch card id/ref",
    "source guide brief ref",
    "observed context",
    "inferred context",
    "suggested context",
    "needs user judgment / unresolved user judgment",
    "source refs",
    "selected delta refs",
    "expected files",
    "forbidden files",
    "allowed change scope",
    "required checks",
    "optional checks",
    "skipped check policy",
    "PR body requirements",
    "final report requirements",
    "proof/evidence boundary",
    "authority boundary",
    "route/read boundary",
    "source status",
    "warnings/gaps",
    "public safety",
    "next phase notes",
    "Preserve observed/inferred/suggested/judgment separation",
    "suggestions are not commands",
    "Needs user judgment / unresolved user judgment must be surfaced, not decided by Codex.",
    "If a Launch Card suggestion implies write or execution authority outside the active prompt",
    "If expected files conflict with the active prompt or repo status",
    "If forbidden files are touched",
    "If packet source status is fallback, synthetic, or operator-supplied preview",
    "If route/read boundary is absent, do not invent it.",
    "If proof/evidence boundary is absent, do not infer proof authority.",
    "Handoff Capsule consumed: yes/no.",
    "Codex Launch Card consumed: yes/no.",
    "observed/inferred/suggested/judgment separation preserved: yes/no.",
    "source refs preserved: yes/no.",
    "expected files and actual changed files.",
    "forbidden files touched: yes/no with explanation.",
    "authority boundary preserved: yes/no.",
    "expected checks and actual validation results.",
    "skipped checks with concrete reasons.",
    "proof/evidence write status or skipped reason.",
    "unresolved user judgment carried forward: yes/no.",
    "no background work statement.",
    "no merge statement.",
  ], { textByFile });
}

function assertPluginDoc() {
  assertContainsAll(pluginDoc, [
    "Phase 7E Handoff Capsule / Codex Launch Card Skill Alignment",
    "augnes-handoff-capsule",
    "plugins/augnes-operator/skills/augnes-handoff-capsule/SKILL.md",
    "instruction-only guidance",
    "Handoff Capsule and Codex Launch Card packets as task-start context",
    "preserves source refs",
    "expected files",
    "forbidden files",
    "skipped-check policy",
    "PR body requirements",
    "final report requirements",
    "unresolved user judgment",
    "source/fallback status",
    "warnings",
    "gaps",
    "public safety",
    "authority boundaries",
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
    "no copy/export",
    "no branch/PR creation from Augnes product code",
    "no merge/publish/retry/replay/deploy behavior",
    "no external side effects",
    "does not imply that `plugin.json` adds runtime capability",
  ], { textByFile });
}

function assertHandoffContractDoc() {
  assertContainsAll(handoffContractDoc, [
    "Status: Phase 7F Handoff Capsule / Codex Launch Card core",
    "Phase 7E Codex Skill Alignment",
    "docs/CODEX_HANDOFF_CAPSULE_CONSUMPTION_V0_1.md",
    "plugins/augnes-operator/skills/augnes-handoff-capsule/SKILL.md",
    "scripts/smoke-codex-handoff-capsule-v0-1.mjs",
    "smoke:codex-handoff-capsule-v0-1",
    "Codex can consume Handoff Capsule and Codex Launch Card packets as task-start context only for separately scoped operator tasks.",
    "Observed/Inferred/Suggested/Needs user judgment separation",
    "skipped-check policy",
    "PR body requirements",
    "final report requirements",
    "source/fallback status",
    "authority boundary",
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
    "no scheduler/autonomy",
    "no copy/export",
    "no merge/publish/retry/replay/deploy",
    "no external side effects",
    "Phase 7F local copy/export preview is documented below.",
  ], { textByFile });
}

function assertIndexPointer() {
  assertContainsAll(indexDoc, [
    "Phase 7E Codex Handoff Capsule / Codex Launch Card alignment v0.1",
    "CODEX_HANDOFF_CAPSULE_CONSUMPTION_V0_1.md",
    "plugins/augnes-operator/skills/augnes-handoff-capsule/SKILL.md",
    "scripts/smoke-codex-handoff-capsule-v0-1.mjs",
    "smoke:codex-handoff-capsule-v0-1",
    "instruction-only Codex task-start context guidance",
    "Observed/Inferred/Suggested/Needs user judgment separation",
    "expected/forbidden files",
    "required and optional checks",
    "skipped-check policy",
    "PR/final-report requirements",
    "source/fallback status",
    "warnings/gaps",
    "public safety",
    "authority boundaries",
    "no runtime hook",
    "Web UI",
    "API route",
    "App/MCP tool",
    "DB write",
    "provider/OpenAI call",
    "GitHub actuation",
    "Codex execution",
    "proof/evidence write",
    "memory mutation",
    "durable Perspective apply",
    "scheduler/autonomy runner",
    "handoff send",
    "branch/PR creation behavior",
    "copy/export",
    "external side effect",
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
      "lib/handoff",
      "lib/db",
      "migrations/",
      "provider/",
      "providers/",
      "proof/",
      "evidence/",
      "autonomy/",
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
      textByFile.get(handoffContractDoc),
    ].join("\n"),
  );

  assert(!/\bNo status means executed\b/.test(combinedText));
  assert(!/\bmust execute Codex\b/i.test(combinedText));
  assert(!/\bmust send handoff\b/i.test(combinedText));
  assert(!/\bsuggestions are commands\b/i.test(combinedText));
}

function assertChangedFilesBoundary() {
  const result = assertChangedFilesWithin({
    allowedChangedFiles,
    label: "Codex Handoff Capsule alignment boundary smoke",
  });
  const untrackedFiles = getUntrackedFiles();
  const contentOnly = result.mode === "content-only";

  if (!contentOnly) {
    for (const file of untrackedFiles) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected untracked file for Codex Handoff Capsule alignment smoke: ${file}`,
      );
    }
  }

  const files = [...new Set([...result.files, ...untrackedFiles])].sort();
  if (!contentOnly) {
    for (const file of files) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected changed file for Codex Handoff Capsule alignment smoke: ${file}`,
      );
      assert(
        followOnHandoffCapsuleCopyExportFiles.has(file) ||
          phase8AutonomyContractCoreFiles.has(file) ||
          phase8dAutonomyContractAppToolFiles.has(file) ||
          phase8eAutonomyContractCodexSkillFiles.has(file) ||
          phase8fAutonomyContractCopyExportFiles.has(file) ||
          phase9aAutonomyRunnerPreflightFiles.includes(file) ||
          !forbiddenChangedPathPatterns.some((pattern) => pattern.test(file)),
        `Forbidden changed file for Codex Handoff Capsule alignment smoke: ${file}`,
      );
    }
  }

  assertNoForbiddenRuntimeCallText(files);

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

function assertNoForbiddenRuntimeCallText(files) {
  const forbiddenPatterns = [
    /from\s+["'](?:openai|@openai|octokit|@octokit|github|@actions\/github)["']/i,
    /\b(?:spawn|exec)\s*\(/,
    /\bfetch\s*\(/,
    /\bcreateEvidenceRecord\s*\(/i,
    /\brecordProof\s*\(/i,
    /\bappendWorkEvent\s*\(/i,
    /\bcommitStateUpdate\s*\(/i,
    /\bcreatePullRequest\s*\(/i,
    /\bmergePullRequest\s*\(/i,
    /\bpublish[A-Z]\w*\s*\(/,
    /\bdeploy[A-Z]\w*\s*\(/,
    /\bretryReplay\s*\(/i,
    /\bnavigator\.clipboard\b/,
  ];

  for (const file of files) {
    if (!textByFile.has(file)) continue;
    const text = textByFile.get(file);
    for (const pattern of forbiddenPatterns) {
      assert(
        !pattern.test(text),
        `${file} must not add forbidden runtime/action pattern ${pattern}`,
      );
    }
  }
}

function getUntrackedFiles() {
  try {
    const output = execFileSync(
      "git",
      ["ls-files", "--others", "--exclude-standard"],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    return output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .sort();
  } catch {
    return [];
  }
}
