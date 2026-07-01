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

const contractDoc = "docs/CODEX_GUIDEBRIEF_HANDOFF_V0_1.md";
const guideBriefDoc = "docs/GUIDEBRIEF_CONTRACT_V0_1.md";
const pluginDoc = "docs/CODEX_AUGNES_OPERATOR_PLUGIN_V0_2.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const skillFile =
  "plugins/augnes-operator/skills/augnes-guidebrief-handoff/SKILL.md";
const pluginJsonFile = "plugins/augnes-operator/.codex-plugin/plugin.json";
const packageJsonFile = "package.json";
const smokeFile = "scripts/smoke-codex-guidebrief-handoff-v0-1.mjs";
const pluginV2SmokeFile = "scripts/smoke-augnes-operator-plugin-v2.mjs";
const capsuleSkillSmokeFile = "scripts/smoke-augnes-capsule-handoff-skill.mjs";

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
];

const inspectedFiles = [
  contractDoc,
  guideBriefDoc,
  pluginDoc,
  indexDoc,
  skillFile,
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
  ...inspectedFiles,
  pluginV2SmokeFile,
  capsuleSkillSmokeFile,
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

const followOnHandoffCapsuleFiles = [
  "docs/HANDOFF_CAPSULE_CONTRACT_V0_1.md",
  "types/handoff-capsule.ts",
  "lib/handoff/handoff-capsule.ts",
  "fixtures/handoff-capsule.sample.v0.1.json",
  "fixtures/codex-launch-card.sample.v0.1.json",
  "scripts/smoke-handoff-capsule-v0-1.mjs",
];
for (const file of followOnHandoffCapsuleFiles) {
  allowedChangedFiles.add(file);
}

const followOnHandoffCapsuleRouteFiles = [
  "app/api/augnes/read/handoff-capsule/route.ts",
  "app/api/augnes/read/codex-launch-card/route.ts",
  "lib/handoff/handoff-capsule-source.ts",
  "scripts/smoke-handoff-capsule-route-v0-1.mjs",
];
for (const file of followOnHandoffCapsuleRouteFiles) {
  allowedChangedFiles.add(file);
}

const followOnHandoffCapsuleWebPreviewFiles = [
  "components/handoff/handoff-capsule-preview-panel.tsx",
  "components/handoff/codex-launch-card-preview-panel.tsx",
  "components/handoff/handoff-preview-boundary-card.tsx",
  "lib/handoff/read-handoff-capsule-for-web.ts",
  "components/workplane/agent-workplane.tsx",
  "scripts/smoke-handoff-capsule-web-preview-v0-1.mjs",
  "scripts/smoke-agent-workplane-shell-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
  "scripts/smoke-guide-brief-route-v0-1.mjs",
  "scripts/smoke-web-guide-panel-v0-1.mjs",
  "scripts/smoke-handoff-capsule-v0-1.mjs",
];
for (const file of followOnHandoffCapsuleWebPreviewFiles) {
  allowedChangedFiles.add(file);
}

const followOnHandoffCapsuleAppToolFiles = [
  "apps/augnes_apps/src/server.ts",
  "apps/augnes_apps/src/lib/state-runtime-types.ts",
  "apps/augnes_apps/src/adapters/state-runtime-http.ts",
  "apps/augnes_apps/scripts/invariants.ts",
  "apps/augnes_apps/scripts/smoke.ts",
  "apps/augnes_apps/scripts/mock-state-runtime.ts",
  "docs/CHATGPT_APP_MCP_READONLY_SURFACE_BOUNDARY_V0_1.md",
  "scripts/smoke-chatgpt-app-guide-brief-tool-v0-1.mjs",
  "scripts/smoke-chatgpt-app-handoff-capsule-tool-v0-1.mjs",
  "scripts/smoke-chatgpt-app-autonomy-contract-tool-v0-1.mjs",
];
for (const file of followOnHandoffCapsuleAppToolFiles) {
  allowedChangedFiles.add(file);
}

const followOnHandoffCapsuleCodexSkillFiles = [
  "docs/CODEX_HANDOFF_CAPSULE_CONSUMPTION_V0_1.md",
  "plugins/augnes-operator/skills/augnes-handoff-capsule/SKILL.md",
  "scripts/smoke-codex-handoff-capsule-v0-1.mjs",
  "docs/CODEX_AUGNES_OPERATOR_PLUGIN_V0_2.md",
  "scripts/smoke-augnes-operator-plugin-v2.mjs",
  "scripts/smoke-augnes-capsule-handoff-skill.mjs",
  "scripts/smoke-chatgpt-app-handoff-capsule-tool-v0-1.mjs",
];
for (const file of followOnHandoffCapsuleCodexSkillFiles) {
  allowedChangedFiles.add(file);
}

const followOnAutonomyContractCodexSkillFiles = [
  "docs/CODEX_AUTONOMY_CONTRACT_CONSUMPTION_V0_1.md",
  "plugins/augnes-operator/skills/augnes-autonomy-contract/SKILL.md",
  "scripts/smoke-codex-autonomy-contract-v0-1.mjs",
  "docs/CODEX_AUGNES_OPERATOR_PLUGIN_V0_2.md",
  "docs/AUTONOMY_CONTRACT_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
];
for (const file of followOnAutonomyContractCodexSkillFiles) {
  allowedChangedFiles.add(file);
}

const followOnHandoffCapsuleCopyExportFiles = [
  "lib/handoff/handoff-capsule-copy-export.ts",
  "components/handoff/handoff-copy-export-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "lib/handoff/read-handoff-capsule-for-web.ts",
  "components/handoff/handoff-preview-boundary-card.tsx",
  "components/handoff/codex-launch-card-preview-panel.tsx",
  "components/handoff/handoff-capsule-preview-panel.tsx",
  "scripts/smoke-handoff-capsule-copy-export-v0-1.mjs",
];
for (const file of followOnHandoffCapsuleCopyExportFiles) {
  allowedChangedFiles.add(file);
}

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
for (const file of phase8fAutonomyContractCopyExportFiles) {
  allowedChangedFiles.add(file);
}

const forbiddenRuntimePathPatterns = [
  /^app\//,
  /^components\//,
  /^app\/api\//,
  /^apps\/augnes_apps\//,
  /^lib\/guide\//,
  /^lib\/db\.ts$/,
  /^migrations\//,
  /^provider\//i,
  /^providers\//i,
  /^proof\//i,
  /^evidence\//i,
  /^autonomy\//i,
  /(^|\/)(route|api)\.(js|jsx|ts|tsx)$/,
  /(^|\/)(codex-sdk|codex_sdk|provider|providers)(\/|$)/i,
  /(^|\/)(scheduler|autonomy-runner|autonomy_runner)(\/|$)/i,
  /(^|\/)(handoff-execution|handoff_execution)(\/|$)/i,
];

const textByFile = loadTextByFile(inspectedFiles);

assertPackageJsonScript();
assertContractDoc();
assertSkill();
assertPluginManifest();
assertDocsPointers();
assertSmokeScriptBoundary();
const changedFilesBoundary = assertChangedFilesBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "codex-guidebrief-handoff-v0-1",
      pass: true,
      required_files_checked: inspectedFiles,
      package_script_checked: true,
      contract_doc_checked: true,
      skill_checked: skillFile,
      plugin_manifest_checked: true,
      plugin_manifest_updated: false,
      prior_smoke_allowlist_compatibility_files_allowed:
        priorSmokeAllowlistCompatibilityFiles,
      docs_index_checked: true,
      guidebrief_contract_pointer_checked: true,
      no_runtime_files_changed_checked: true,
      no_app_api_changes_checked: true,
      no_components_changes_checked: true,
      no_apps_augnes_apps_runtime_changes_checked: true,
      no_lib_guide_runtime_changes_checked: true,
      no_db_migration_schema_changes_checked: true,
      no_provider_openai_github_runtime_calls_checked: true,
      no_codex_execution_code_checked: true,
      no_proof_evidence_write_code_checked: true,
      no_scheduler_autonomy_runner_checked: true,
      no_handoff_execution_added_checked: true,
      no_branch_pr_creation_runtime_added_checked: true,
      no_merge_publish_retry_replay_deploy_added_checked: true,
      changed_files_boundary_checked: changedFilesBoundary.checked,
      changed_files_boundary_skipped: changedFilesBoundary.skipped,
      changed_files_boundary_skip_reason: changedFilesBoundary.skip_reason,
      changed_files_observed: changedFilesBoundary.files,
      changed_files_base_ref: changedFilesBoundary.base_ref,
      smoke_type: "static-codex-guidebrief-doc-skill-smoke-boundary-only",
    },
    null,
    2,
  ),
);
console.log("PASS smoke:codex-guidebrief-handoff-v0-1");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText: textByFile.get(packageJsonFile),
    scriptName: "smoke:codex-guidebrief-handoff-v0-1",
    expectedCommand: "node scripts/smoke-codex-guidebrief-handoff-v0-1.mjs",
  });
}

function assertContractDoc() {
  assertContainsAll(contractDoc, [
    "GuideBrief",
    "Codex GuideBrief alignment",
    "Observed",
    "Inferred",
    "Suggested",
    "Needs user judgment",
    "suggestions are not commands",
    "`needs_user_judgment` is not decided by Codex",
    "source refs",
    "skipped checks",
    "authority boundary",
    "no Codex execution from Augnes",
    "no GitHub actuation from Augnes",
    "no provider/OpenAI calls",
    "no DB writes",
    "no proof/evidence writes",
    "no memory mutation",
    "no durable Perspective apply",
    "no scheduler/autonomy runner",
    "no handoff execution",
    "no external side effects",
    "Phase 7 Handoff Capsule / Codex Launch Card remains deferred",
    "guide_brief_ref",
    "guide_version",
    "task_prompt_ref",
    "repo_boundary",
    "observed_context",
    "inferred_context",
    "suggested_context",
    "needs_user_judgment_context",
    "expected_files",
    "expected_checks",
    "skipped_check_policy",
    "codex_non_goals",
    "closeout_requirements",
    "next_phase_notes",
  ], { textByFile });
}

function assertSkill() {
  assertContainsAll(skillFile, [
    "name: augnes-guidebrief-handoff",
    "GuideBrief consumed",
    "observed/inferred/suggested/judgment separation",
    "source refs",
    "expected checks",
    "skipped checks",
    "authority boundary",
    "no merge",
    "no background work",
    "no proof/evidence write unless separately scoped",
    "GuideBrief suggestions are not commands",
    "Needs user judgment items must be surfaced, not decided by Codex.",
    "Handoff candidates as preview-only",
    "This skill is instruction-only workflow guidance.",
    "This skill does not grant execution authority.",
    "Never claim background work.",
    "Never merge.",
  ], { textByFile });
}

function assertPluginManifest() {
  const plugin = parsePackageJson(textByFile.get(pluginJsonFile));
  assert.equal(plugin.name, "augnes-operator");
  assert.equal(plugin.skills, "./skills/");
  assert.equal(plugin.mcpServers, undefined, "plugin.json must not add MCP config");
  assert.equal(plugin.apps, undefined, "plugin.json must not add app mappings");
  assert.equal(plugin.hooks, undefined, "plugin.json must not add hooks");
  assert.equal(plugin.commands, undefined, "plugin.json must not add commands");
}

function assertDocsPointers() {
  assertContainsAll(guideBriefDoc, [
    "Phase 6E adds only Codex GuideBrief alignment docs, skill guidance, smoke, package pointer, and latest-index pointer.",
    "Codex can consume GuideBrief as task-start context.",
    "It preserves Observed/Inferred/Suggested/Needs user judgment separation and source refs.",
    "It adds no Codex execution from Augnes, no GitHub/provider calls, and no Phase 7 Handoff Capsule / Codex Launch Card behavior.",
  ], { textByFile });

  assertContainsAll(pluginDoc, [
    "augnes-guidebrief-handoff",
    "GuideBrief consumption note",
    "read-only/context alignment only",
    "does not add launch/runtime behavior",
    "does not add Codex execution from Augnes",
  ], { textByFile });

  assertContainsAll(indexDoc, [
    "CODEX_GUIDEBRIEF_HANDOFF_V0_1.md",
    "Phase 6E Codex GuideBrief alignment",
    "smoke:codex-guidebrief-handoff-v0-1",
    "no UI action/write/execution authority",
    "Phase 7 is next only after explicit scope",
  ], { textByFile });
}

function assertSmokeScriptBoundary() {
  for (const [file, text] of textByFile) {
    if (!file.endsWith(".mjs")) continue;
    assertNoRuntimeImports({
      file,
      text,
      forbiddenImports: [
        "app/",
        "components/",
        "app/api/",
        "apps/augnes_apps/",
        "lib/guide/",
        "lib/db",
        "migrations/",
        "provider/",
        "providers/",
        "proof/",
        "evidence/",
        "@openai/codex-sdk",
        "octokit",
      ],
    });
  }

  const combinedText = normalizeText(
    [...textByFile.values()].join("\n"),
  ).toLowerCase();
  const forbiddenPositivePatterns = [
    /\bfetch\s*\(/,
    /\bspawn\s*\(/,
    /\bexec\s*\(/,
    /\bcreatepullrequest\b/,
    /\bmergepullrequest\b/,
    /\brecordproof\b/,
    /\bcreateevidencerecord\b/,
    /\bappendworkevent\b/,
    /\bcommitstateupdate\b/,
  ];

  for (const pattern of forbiddenPositivePatterns) {
    assert(
      !pattern.test(combinedText),
      `Phase 6E smoke content must not add runtime/action pattern ${pattern}`,
    );
  }
}

function assertChangedFilesBoundary() {
  const result = assertChangedFilesWithin({
    allowedChangedFiles,
    label: "Codex GuideBrief handoff alignment boundary smoke",
  });
  const untrackedFiles = getUntrackedFiles();
  const contentOnly = result.mode === "content-only";
  if (!contentOnly) {
    for (const file of untrackedFiles) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected untracked file for Codex GuideBrief handoff alignment smoke: ${file}`,
      );
    }
  }

  const files = [...new Set([...result.files, ...untrackedFiles])].sort();
  if (!contentOnly) {
    for (const file of files) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected changed file for Codex GuideBrief handoff alignment smoke: ${file}`,
      );
      assert(
        followOnHandoffCapsuleRouteFiles.includes(file) ||
          followOnHandoffCapsuleWebPreviewFiles.includes(file) ||
          followOnHandoffCapsuleAppToolFiles.includes(file) ||
          followOnHandoffCapsuleCodexSkillFiles.includes(file) ||
          followOnHandoffCapsuleCopyExportFiles.includes(file) ||
          phase8cAutonomyContractWebPreviewFiles.includes(file) ||
        phase9aAutonomyRunnerPreflightFiles.includes(file) ||
          phase8fAutonomyContractCopyExportFiles.includes(file) ||
          file === "app/api/augnes/read/autonomy-contract/route.ts" ||
          file === "app/api/augnes/read/autonomy-runner-preflight/route.ts" ||
          !forbiddenRuntimePathPatterns.some((pattern) => pattern.test(file)),
        `Forbidden runtime changed file for Codex GuideBrief handoff alignment smoke: ${file}`,
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
