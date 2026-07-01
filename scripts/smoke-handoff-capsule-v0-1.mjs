#!/usr/bin/env node
import assert from "node:assert/strict";
import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertNoRuntimeImports,
  assertPackageScript,
  collectUntrackedFiles,
  loadTextByFile,
} from "./smoke-boundary-common.mjs";

const contractDoc = "docs/HANDOFF_CAPSULE_CONTRACT_V0_1.md";
const typeFile = "types/handoff-capsule.ts";
const helperFile = "lib/handoff/handoff-capsule.ts";
const capsuleFixtureFile = "fixtures/handoff-capsule.sample.v0.1.json";
const launchCardFixtureFile = "fixtures/codex-launch-card.sample.v0.1.json";
const smokeFile = "scripts/smoke-handoff-capsule-v0-1.mjs";
const packageJsonFile = "package.json";
const indexDoc = "docs/00_INDEX_LATEST.md";

const requiredFiles = [
  contractDoc,
  typeFile,
  helperFile,
  capsuleFixtureFile,
  launchCardFixtureFile,
  smokeFile,
  packageJsonFile,
  indexDoc,
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
];

const followOnHandoffCapsuleRouteFiles = [
  "app/api/augnes/read/handoff-capsule/route.ts",
  "app/api/augnes/read/codex-launch-card/route.ts",
  "lib/handoff/handoff-capsule-source.ts",
  "scripts/smoke-handoff-capsule-route-v0-1.mjs",
];

const followOnHandoffCapsuleWebPreviewFiles = [
  "components/handoff/handoff-capsule-preview-panel.tsx",
  "components/handoff/codex-launch-card-preview-panel.tsx",
  "components/handoff/handoff-preview-boundary-card.tsx",
  "lib/handoff/read-handoff-capsule-for-web.ts",
  "components/workplane/agent-workplane.tsx",
  "scripts/smoke-handoff-capsule-web-preview-v0-1.mjs",
];

const followOnHandoffCapsuleAppToolFiles = [
  "apps/augnes_apps/src/server.ts",
  "apps/augnes_apps/src/lib/state-runtime-types.ts",
  "apps/augnes_apps/src/adapters/state-runtime-http.ts",
  "apps/augnes_apps/scripts/invariants.ts",
  "apps/augnes_apps/scripts/smoke.ts",
  "apps/augnes_apps/scripts/mock-state-runtime.ts",
  "scripts/smoke-chatgpt-app-handoff-capsule-tool-v0-1.mjs",
  "scripts/smoke-chatgpt-app-autonomy-contract-tool-v0-1.mjs",
  "docs/CHATGPT_APP_MCP_READONLY_SURFACE_BOUNDARY_V0_1.md",
];

const followOnHandoffCapsuleCodexSkillFiles = [
  "docs/CODEX_HANDOFF_CAPSULE_CONSUMPTION_V0_1.md",
  "plugins/augnes-operator/skills/augnes-handoff-capsule/SKILL.md",
  "scripts/smoke-codex-handoff-capsule-v0-1.mjs",
  "docs/CODEX_AUGNES_OPERATOR_PLUGIN_V0_2.md",
  "scripts/smoke-augnes-operator-plugin-v2.mjs",
  "scripts/smoke-augnes-capsule-handoff-skill.mjs",
  "scripts/smoke-chatgpt-app-handoff-capsule-tool-v0-1.mjs",
];

const followOnHandoffCapsuleCopyExportFiles = [
  "lib/handoff/handoff-capsule-copy-export.ts",
  "components/handoff/handoff-copy-export-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "lib/handoff/read-handoff-capsule-for-web.ts",
  "components/handoff/handoff-preview-boundary-card.tsx",
  "components/handoff/codex-launch-card-preview-panel.tsx",
  "components/handoff/handoff-capsule-preview-panel.tsx",
  "scripts/smoke-handoff-capsule-copy-export-v0-1.mjs",
  "scripts/smoke-handoff-capsule-web-preview-v0-1.mjs",
];

const phase8eAutonomyContractCodexSkillFiles = [
  "docs/CODEX_AUTONOMY_CONTRACT_CONSUMPTION_V0_1.md",
  "plugins/augnes-operator/skills/augnes-autonomy-contract/SKILL.md",
  "scripts/smoke-codex-autonomy-contract-v0-1.mjs",
  "scripts/smoke-augnes-operator-plugin-v2.mjs",
  "docs/CODEX_AUGNES_OPERATOR_PLUGIN_V0_2.md",
  "docs/AUTONOMY_CONTRACT_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
  "scripts/smoke-autonomy-contract-v0-1.mjs",
  "scripts/smoke-autonomy-contract-route-v0-1.mjs",
  "scripts/smoke-autonomy-contract-web-preview-v0-1.mjs",
  "scripts/smoke-chatgpt-app-autonomy-contract-tool-v0-1.mjs",
  "scripts/smoke-codex-guidebrief-handoff-v0-1.mjs",
  "scripts/smoke-codex-handoff-capsule-v0-1.mjs",
  "scripts/smoke-handoff-capsule-v0-1.mjs",
  "scripts/smoke-handoff-capsule-route-v0-1.mjs",
  "scripts/smoke-handoff-capsule-web-preview-v0-1.mjs",
  "scripts/smoke-chatgpt-app-handoff-capsule-tool-v0-1.mjs",
  "scripts/smoke-handoff-capsule-copy-export-v0-1.mjs",
  "scripts/smoke-guide-brief-v0-1.mjs",
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
  ...requiredFiles,
  ...priorSmokeAllowlistCompatibilityFiles,
  ...followOnHandoffCapsuleRouteFiles,
  ...followOnHandoffCapsuleWebPreviewFiles,
  ...followOnHandoffCapsuleAppToolFiles,
  ...followOnHandoffCapsuleCodexSkillFiles,
  ...followOnHandoffCapsuleCopyExportFiles,
  ...phase8eAutonomyContractCodexSkillFiles,
  ...phase8fAutonomyContractCopyExportFiles,
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

const forbiddenChangedFilePatterns = [
  /^app\//,
  /^components\/(?!autonomy\/|workplane\/agent-workplane\.tsx$)/,
  /^apps\/augnes_apps\//,
  /^migrations\//,
  /^db\//,
  /^lib\/db(\/|\.|$)/,
  /^plugins\//,
  /(^|\/)(route|api)\.(js|jsx|ts|tsx)$/,
  /(^|\/)(provider|providers|openai|github|octokit)(\/|$)/i,
  /(^|\/)(proof|evidence)(\/|$)/i,
  /(^|\/)(scheduler|autonomy-runner|autonomy_runner)(\/|$)/i,
  /(^|\/)(handoff-execution|handoff_execution)(\/|$)/i,
];

const requiredDocsRefs = [
  "docs/GUIDEBRIEF_CONTRACT_V0_1.md",
  "docs/PERSPECTIVE_CAPSULE_CONTRACT_V0_1.md",
  "docs/CODEX_GUIDEBRIEF_HANDOFF_V0_1.md",
  "docs/AUGNES_CODEX_WORKER_BOOTSTRAP_V0_1.md",
  "docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md",
  "docs/AUTHORITY_MATRIX.md",
];

const authorityBooleanFields = [
  "source_of_truth",
  "can_commit_or_reject_state",
  "can_record_proof",
  "can_create_evidence",
  "can_update_work",
  "can_mutate_memory",
  "can_apply_project_perspective",
  "can_publish_external",
  "can_merge",
  "can_retry_replay_deploy",
  "can_call_github",
  "can_call_openai_or_provider",
  "can_execute_codex",
  "can_create_branch_or_pr",
  "can_send_handoff",
  "can_launch_codex",
  "can_launch_autonomy",
  "can_create_mcp_tool",
  "can_create_ui_action",
  "can_post_external_comment",
];

const expectedTypeExports = [
  "HANDOFF_CAPSULE_VERSION",
  "CODEX_LAUNCH_CARD_VERSION",
  "HANDOFF_TARGET_SURFACES",
  "HANDOFF_TARGET_ACTORS",
  "HANDOFF_INTENTS",
  "CODEX_LAUNCH_CARD_STATUSES",
  "HandoffCapsule",
  "CodexLaunchCard",
  "HandoffSourceRefs",
  "HandoffCapsuleAuthorityBoundary",
  "CodexLaunchCardAuthorityBoundary",
];

const expectedHelperExports = [
  "buildHandoffCapsule",
  "buildCodexLaunchCard",
  "buildHandoffObservedContext",
  "buildHandoffInferredContext",
  "buildHandoffSuggestedContext",
  "buildHandoffJudgmentContext",
  "buildHandoffSourceRefs",
  "buildHandoffConstraints",
  "buildCodexExpectedFiles",
  "buildCodexForbiddenFiles",
  "buildCodexRequiredChecks",
  "buildCodexPrBodyRequirements",
  "buildCodexFinalReportRequirements",
  "buildHandoffCapsuleAuthorityBoundary",
  "buildCodexLaunchCardAuthorityBoundary",
];

const textByFile = loadTextByFile(requiredFiles);
const docText = textByFile.get(contractDoc);
const typeText = textByFile.get(typeFile);
const helperText = textByFile.get(helperFile);
const capsuleFixture = JSON.parse(textByFile.get(capsuleFixtureFile));
const launchCardFixture = JSON.parse(textByFile.get(launchCardFixtureFile));
const packageJsonText = textByFile.get(packageJsonFile);
const indexText = textByFile.get(indexDoc);

assertPackageJsonScript();
assertIndexPointer();
assertDocumentContract();
assertTypeContract();
assertHelperContract();
assertFixtures();
assertSeparation(capsuleFixture, launchCardFixture);
assertCodexPacketFields(launchCardFixture);
assertPreviewPreparationBoundary(capsuleFixture, launchCardFixture);
assertAuthorityBoundary(capsuleFixture.authority_boundary, "HandoffCapsule");
assertAuthorityBoundary(launchCardFixture.authority_boundary, "CodexLaunchCard");
assertPublicSafety(capsuleFixture.public_safety, "HandoffCapsule");
assertPublicSafety(launchCardFixture.public_safety, "CodexLaunchCard");
assertNoRuntimeActuationCode();
const changedFilesBoundary = assertChangedFileBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "handoff-capsule-v0-1",
      pass: true,
      required_files_checked: requiredFiles,
      package_script_checked: true,
      index_pointer_checked: true,
      document_contract_checked: true,
      type_exports_checked: expectedTypeExports,
      helper_exports_checked: expectedHelperExports,
      capsule_fixture_parsed: true,
      launch_card_fixture_parsed: true,
      observed_count: capsuleFixture.observed_context.length,
      inferred_count: capsuleFixture.inferred_context.length,
      suggested_count: capsuleFixture.suggested_context.length,
      needs_user_judgment_count: capsuleFixture.needs_user_judgment.length,
      selected_delta_ref_count: capsuleFixture.selected_delta_refs.length,
      codex_expected_file_count: launchCardFixture.expected_files.length,
      codex_required_check_count: launchCardFixture.required_checks.length,
      authority_boundary_checked: true,
      public_safety_checked: true,
      prior_smoke_allowlist_compatibility_files_allowed:
        priorSmokeAllowlistCompatibilityFiles,
      follow_on_handoff_capsule_route_files_allowed:
        followOnHandoffCapsuleRouteFiles,
      no_runtime_actuation_code_checked: true,
      no_ui_files_changed_checked: true,
      no_api_route_files_changed_checked: true,
      no_mcp_app_tool_files_changed_checked: true,
      no_db_migrations_changed_checked: true,
      changed_files_boundary_checked: changedFilesBoundary.checked,
      changed_files_boundary_skipped: changedFilesBoundary.skipped,
      changed_files_boundary_skip_reason: changedFilesBoundary.skip_reason,
      changed_files_observed: changedFilesBoundary.files,
      changed_files_base_ref: changedFilesBoundary.base_ref,
      smoke_type:
        "static-handoff-capsule-codex-launch-card-contract-helper-fixture-package-index-boundary-only",
      route_behavior_changed: false,
      ui_behavior_changed: false,
      mcp_app_tool_added: false,
      db_schema_migration_changed: false,
      db_write_added: false,
      provider_openai_github_runtime_call_added: false,
      codex_execution_added: false,
      proof_evidence_write_added: false,
      memory_mutation_added: false,
      durable_perspective_state_apply_added: false,
      scheduler_autonomy_runner_added: false,
      handoff_execution_added: false,
      branch_pr_creation_from_product_code_added: false,
      external_side_effect_added: false,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:handoff-capsule-v0-1");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText,
    scriptName: "smoke:handoff-capsule-v0-1",
    expectedCommand: "node scripts/smoke-handoff-capsule-v0-1.mjs",
  });
}

function assertIndexPointer() {
  assertContainsAll(indexText, [
    "docs/HANDOFF_CAPSULE_CONTRACT_V0_1.md",
    "Phase 7A Handoff Capsule / Codex Launch Card core v0.1",
    "reviewable transfer packets",
    "smoke:handoff-capsule-v0-1",
    "repo-local non-SSOT pointer",
  ], { label: indexDoc });
}

function assertDocumentContract() {
  assert(
    !docText.includes("No status means executed"),
    `${contractDoc} must not imply any CodexLaunchCard status means executed`,
  );
  assertContainsAll(docText, [
    "Handoff Capsule and Codex Launch Card are reviewable transfer packets.",
    "They prepare context for another surface.",
    "They do not send, launch, execute, post, merge, publish, or mutate state.",
    "CodexLaunchCard is not Codex execution.",
    "HandoffCapsule is not handoff send.",
    "Suggestions are not commands.",
    "User/operator judgment remains unresolved unless explicitly decided outside the packet.",
    "The authority boundary denies all execution/write/external side effects.",
    "Observed: source-backed observations only.",
    "Inferred: derived interpretation with confidence and caveats.",
    "Suggested: advisory next steps only.",
    "Needs user judgment: unresolved decisions surfaced, not decided.",
    "Codex may implement only what the active operator/user prompt explicitly scopes.",
    "GuideBrief suggestions and Launch Card suggestions are not commands by themselves.",
    "No status may mean \"executed\"; every status can only describe review/preparation state.",
    "buildHandoffCapsule(input)",
    "buildCodexLaunchCard(input)",
    "No DB reads in core builder.",
    "No DB writes.",
    "No fetch.",
    "No GitHub calls.",
    "No Codex calls.",
    "No provider/OpenAI calls.",
    "No route dependency.",
    "No UI dependency.",
  ], { label: contractDoc });
}

function assertTypeContract() {
  assertNoRuntimeImports({
    file: typeFile,
    text: typeText,
    forbiddenImports: [
      "node:",
      "fs",
      "path",
      "child_process",
      ".json",
      "app/",
      "components/",
      "apps/augnes_apps/",
      "lib/db",
      "migrations/",
      "openai",
      "octokit",
    ],
  });

  for (const exportedName of expectedTypeExports) {
    assert(
      new RegExp(`export (const|type|interface) ${exportedName}\\b`).test(
        typeText,
      ),
      `${typeFile} must export ${exportedName}`,
    );
  }

  assertContainsAll(typeText, [
    "\"handoff_capsule.v0.1\"",
    "\"codex_launch_card.v0.1\"",
    "\"chatgpt_review\"",
    "\"codex_handoff\"",
    "\"documentation_handoff\"",
    "\"research_handoff\"",
    "\"agent_workplane_preview\"",
    "\"future_agent_handoff\"",
    "\"preview_only\"",
    "\"ready_for_future_launch_review\"",
    "guide_brief_ref",
    "current_working_perspective_ref",
    "delta_projection_ref",
    "workplane_ref",
    "perspective_snapshot_refs",
    "delta_ids",
    "batch_ids",
    "evidence_refs",
    "artifact_refs",
    "handoff_refs",
    "diagnostic_refs",
    "route_refs",
    "docs_refs",
    "repo_refs",
  ], { label: typeFile });
}

function assertHelperContract() {
  assertNoRuntimeImports({
    file: helperFile,
    text: helperText,
    forbiddenImports: [
      "node:",
      "fs",
      "path",
      "child_process",
      ".json",
      "app/",
      "components/",
      "apps/augnes_apps/",
      "lib/db",
      "migrations/",
      "openai",
      "octokit",
    ],
  });

  for (const exportedName of expectedHelperExports) {
    assert(
      new RegExp(`export function ${exportedName}\\b`).test(helperText),
      `${helperFile} must export ${exportedName}`,
    );
  }

  assertContainsAll(helperText, [
    "FALLBACK_CREATED_AT",
    "REQUIRED_DOCS_REFS",
    "DEFAULT_FORBIDDEN_ACTIONS",
    "DEFAULT_PUBLIC_SAFETY_LINES",
    "Capsule is preview-only.",
    "Launch Card is reviewable preparation only.",
    "User/operator prompt is required before any future execution path.",
    "GuideBrief suggestions and Launch Card suggestions are not commands by themselves.",
  ], { label: helperFile });
}

function assertFixtures() {
  assert.equal(capsuleFixture.runtime, "augnes");
  assert.equal(capsuleFixture.capsule_version, "handoff_capsule.v0.1");
  assert.equal(capsuleFixture.target_surface, "codex_handoff");
  assert.equal(capsuleFixture.target_actor, "codex");
  assert.equal(
    capsuleFixture.handoff_intent,
    "implementation_preparation",
  );

  assert.equal(launchCardFixture.runtime, "augnes");
  assert.equal(launchCardFixture.card_version, "codex_launch_card.v0.1");
  assert.equal(
    launchCardFixture.source_capsule_id,
    capsuleFixture.capsule_id,
  );
  assert.equal(
    launchCardFixture.source_guide_brief_ref,
    capsuleFixture.source_guide_brief_ref,
  );

  assert(
    Object.keys(capsuleFixture.source_refs).length >= 3,
    "HandoffCapsule fixture must include at least 3 source ref fields",
  );
  assert(
    capsuleFixture.selected_delta_refs.length >= 2,
    "HandoffCapsule fixture must include at least 2 selected delta refs",
  );
  assert(
    capsuleFixture.needs_user_judgment.length >= 1,
    "HandoffCapsule fixture must include at least 1 needs_user_judgment item",
  );

  for (const docRef of requiredDocsRefs) {
    assert(
      capsuleFixture.source_refs.docs_refs.includes(docRef),
      `HandoffCapsule fixture must include docs ref ${docRef}`,
    );
    assert(
      launchCardFixture.source_refs.docs_refs.includes(docRef),
      `CodexLaunchCard fixture must include docs ref ${docRef}`,
    );
  }
}

function assertSeparation(capsule, card) {
  assert(capsule.observed_context.length > 0, "Observed context required");
  assert(capsule.inferred_context.length > 0, "Inferred context required");
  assert(capsule.suggested_context.length > 0, "Suggested context required");
  assert(
    capsule.needs_user_judgment.length > 0,
    "Needs user judgment required",
  );

  for (const item of capsule.observed_context) {
    assert.equal(item.confidence, "observed");
    assert(Array.isArray(item.source_refs));
  }
  for (const item of capsule.inferred_context) {
    assert.notEqual(item.confidence, "observed");
    assert(Array.isArray(item.caveats));
  }
  for (const item of capsule.suggested_context) {
    assert.equal(item.advisory_only, true);
  }
  for (const item of capsule.needs_user_judgment) {
    assert.equal(item.decided_by_packet, false);
  }

  assert.equal(card.observed_context.length, capsule.observed_context.length);
  assert.equal(card.inferred_context.length, capsule.inferred_context.length);
  assert(card.suggestions_for_codex.every((item) => item.advisory_only));
  assert(
    card.suggestions_for_codex.every(
      (item) => item.active_operator_prompt_required,
    ),
  );
  assert(
    card.unresolved_user_judgment.every(
      (item) => item.decided_by_packet === false,
    ),
  );
}

function assertCodexPacketFields(card) {
  const requiredArrayFields = [
    "expected_files",
    "forbidden_files",
    "required_checks",
    "skipped_check_policy",
    "pr_body_requirements",
    "final_report_requirements",
    "proof_evidence_boundary",
  ];

  for (const field of requiredArrayFields) {
    assert(Array.isArray(card[field]), `CodexLaunchCard ${field} must be array`);
    assert(card[field].length > 0, `CodexLaunchCard ${field} must not be empty`);
  }

  assert(card.expected_files.includes(contractDoc));
  assert(card.expected_files.includes(typeFile));
  assert(card.expected_files.includes(helperFile));
  assert(card.expected_files.includes(capsuleFixtureFile));
  assert(card.expected_files.includes(launchCardFixtureFile));
  assert(card.expected_files.includes(smokeFile));
  assert(card.expected_files.includes(packageJsonFile));
  assert(card.expected_files.includes(indexDoc));
}

function assertPreviewPreparationBoundary(capsule, card) {
  assert(["preview_only", "needs_review", "blocked"].includes(capsule.status));
  assert(
    [
      "preview_only",
      "needs_review",
      "blocked",
      "ready_for_manual_copy",
      "ready_for_future_launch_review",
    ].includes(card.status),
  );
  assert(!/executed/i.test(capsule.status));
  assert(!/executed/i.test(card.status));
  assertContainsAll(capsule.summary, [
    "reviewable transfer packet",
    "without sending, launching, executing",
  ], { label: capsuleFixtureFile });
  assertContainsAll(card.task_summary, [
    "deterministic builders",
    "denying execution/write/external authority",
  ], { label: launchCardFixtureFile });
}

function assertAuthorityBoundary(authority, label) {
  for (const field of authorityBooleanFields) {
    assert.equal(authority[field], false, `${label}.${field} must be false`);
  }

  assertContainsAll(authority.notes.join("\n"), [
    "Capsule is preview-only.",
    "Launch Card is reviewable preparation only.",
    "No execution authority.",
    "No GitHub actuation.",
    "No provider calls.",
    "No proof/evidence writes.",
    "No state/memory mutation.",
    "No handoff send.",
    "No background work.",
    "User/operator prompt is required before any future execution path.",
  ], { label: `${label}.authority_boundary.notes` });
}

function assertPublicSafety(publicSafety, label) {
  const falseFields = [
    "contains_private_conversations",
    "contains_hidden_reasoning",
    "contains_local_private_paths",
    "contains_secrets",
    "contains_tokens",
    "contains_raw_provider_output",
    "contains_raw_retrieval_output",
    "contains_real_account_artifacts",
  ];

  for (const field of falseFields) {
    assert.equal(publicSafety[field], false, `${label}.${field} must be false`);
  }

  assertContainsAll(publicSafety.notes.join("\n"), [
    "No private conversation.",
    "No hidden reasoning.",
    "No local private paths.",
    "No secrets or tokens.",
    "No raw provider output.",
    "No raw retrieval output.",
    "No real account artifacts.",
  ], { label: `${label}.public_safety.notes` });
}

function assertNoRuntimeActuationCode() {
  const forbiddenRuntimePatterns = [
    /\bfetch\s*\(/,
    /\bspawn\s*\(/,
    /\bexec\s*\(/,
    /\bexecFile\s*\(/,
    /\bwriteFile(?:Sync)?\s*\(/,
    /\breadFile(?:Sync)?\s*\(/,
    /\bcreatePullRequest\b/,
    /\bmergePullRequest\b/,
    /\brecordProof\b/,
    /\bcreateEvidenceRecord\b/,
    /\bappendWorkEvent\b/,
    /\bcommitStateUpdate\b/,
    /\blaunchCodex\b/,
    /\bsendHandoff\b/,
    /@openai\//,
    /\bnew OpenAI\b/,
    /\bOctokit\b/,
    /@octokit\//,
    /codex-sdk/,
  ];
  const scanned = [
    [typeFile, typeText],
    [helperFile, helperText],
  ];

  for (const [file, text] of scanned) {
    for (const pattern of forbiddenRuntimePatterns) {
      assert(
        !pattern.test(text),
        `${file} must not include runtime/action pattern ${pattern}`,
      );
    }
  }
}

function assertChangedFileBoundary() {
  const result = assertChangedFilesWithin({
    allowedChangedFiles,
    label: "Handoff Capsule / Codex Launch Card Phase 7A boundary smoke",
  });
  const untrackedFiles = collectUntrackedFiles();
  const contentOnly = result.mode === "content-only";

  if (!contentOnly) {
    for (const file of untrackedFiles) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected untracked file for Handoff Capsule Phase 7A smoke: ${file}`,
      );
    }
  }

  const files = [...new Set([...result.files, ...untrackedFiles])].sort();

  if (!contentOnly) {
    for (const file of files) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected changed file for Handoff Capsule Phase 7A smoke: ${file}`,
      );
      assert(
        followOnHandoffCapsuleRouteFiles.includes(file) ||
          followOnHandoffCapsuleWebPreviewFiles.includes(file) ||
          followOnHandoffCapsuleAppToolFiles.includes(file) ||
          followOnHandoffCapsuleCodexSkillFiles.includes(file) ||
          followOnHandoffCapsuleCopyExportFiles.includes(file) ||
          phase8eAutonomyContractCodexSkillFiles.includes(file) ||
          phase8fAutonomyContractCopyExportFiles.includes(file) ||
          file === "app/api/augnes/read/autonomy-contract/route.ts" ||
          file === "app/api/augnes/read/autonomy-runner-preflight/route.ts" ||
          !forbiddenChangedFilePatterns.some((pattern) => pattern.test(file)),
        `Forbidden changed path for Handoff Capsule Phase 7A smoke: ${file}`,
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
