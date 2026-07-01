#!/usr/bin/env node
import assert from "node:assert/strict";
import {
  assertContainsAll,
  assertNoRuntimeImports,
  assertPackageScript,
  collectGitDiffFiles,
  collectUntrackedFiles,
  getBaseRangeChangedFiles,
  loadTextByFile,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const guideBriefDoc = "docs/GUIDEBRIEF_CONTRACT_V0_1.md";
const guideBriefTypeFile = "types/guide-brief.ts";
const guideBriefHelperFile = "lib/guide/guide-brief.ts";
const fixtureFile = "fixtures/guide-brief.sample.v0.1.json";
const smokeFile = "scripts/smoke-guide-brief-v0-1.mjs";
const packageJsonFile = "package.json";
const indexDoc = "docs/00_INDEX_LATEST.md";

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
];

const followOnGuideBriefRouteFiles = [
  "app/api/augnes/read/guide-brief/route.ts",
  "lib/guide/guide-brief-source.ts",
  "scripts/smoke-guide-brief-route-v0-1.mjs",
];

const followOnWebGuidePanelFiles = [
  "components/guide/guide-brief-panel.tsx",
  "components/guide/guide-brief-section.tsx",
  "components/guide/guide-brief-summary-card.tsx",
  "components/guide/guide-brief-boundary-card.tsx",
  "components/guide/guide-brief-mini-panel.tsx",
  "lib/guide/read-guide-brief-for-web.ts",
  "components/human-surface/human-surface-home.tsx",
  "components/perspective/perspective-public-constellation-surface.tsx",
  "components/perspective/perspective-human-surface.tsx",
  "components/workplane/agent-workplane.tsx",
  "scripts/smoke-web-guide-panel-v0-1.mjs",
];
const followOnChatgptAppGuideBriefToolFiles = [
  "apps/augnes_apps/src/server.ts",
  "apps/augnes_apps/src/lib/state-runtime-types.ts",
  "apps/augnes_apps/src/adapters/state-runtime-http.ts",
  "apps/augnes_apps/scripts/invariants.ts",
  "apps/augnes_apps/scripts/smoke.ts",
  "apps/augnes_apps/scripts/mock-state-runtime.ts",
  "docs/CHATGPT_APP_MCP_READONLY_SURFACE_BOUNDARY_V0_1.md",
  "scripts/smoke-chatgpt-app-guide-brief-tool-v0-1.mjs",
  "scripts/smoke-chatgpt-app-autonomy-contract-tool-v0-1.mjs",
];

const followOnHandoffCapsuleAppToolFiles = [
  "docs/HANDOFF_CAPSULE_CONTRACT_V0_1.md",
  "scripts/smoke-handoff-capsule-v0-1.mjs",
  "scripts/smoke-handoff-capsule-route-v0-1.mjs",
  "scripts/smoke-handoff-capsule-web-preview-v0-1.mjs",
  "scripts/smoke-chatgpt-app-handoff-capsule-tool-v0-1.mjs",
  "docs/CODEX_HANDOFF_CAPSULE_CONSUMPTION_V0_1.md",
  "plugins/augnes-operator/skills/augnes-handoff-capsule/SKILL.md",
  "scripts/smoke-codex-handoff-capsule-v0-1.mjs",
];

const followOnAutonomyContractCodexSkillFiles = [
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

const requiredFiles = [
  guideBriefDoc,
  guideBriefTypeFile,
  guideBriefHelperFile,
  fixtureFile,
  smokeFile,
  packageJsonFile,
  indexDoc,
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
  "lib/autonomy/autonomy-runner-preflight-copy-export.ts",
  "components/autonomy/autonomy-runner-preflight-copy-export-panel.tsx",
  "scripts/smoke-autonomy-runner-preflight-copy-export-v0-1.mjs",
  "docs/AUTONOMY_RUNNER_SKELETON_PLANNING_V0_1.md",
  "docs/AUTONOMY_RUNNER_OPERATOR_APPROVAL_GATE_V0_1.md",
  "scripts/smoke-autonomy-runner-skeleton-planning-v0-1.mjs",
  "docs/AUTONOMY_RUNNER_EXECUTION_V0_1.md",
  "types/autonomy-runner-execution.ts",
  "lib/autonomy/runner.ts",
  "lib/autonomy/scheduler.ts",
  "lib/autonomy/runner-ledger.ts",
  "lib/autonomy/runner-delta-batch.ts",
  "lib/autonomy/runner-state.ts",
  "app/api/autonomy/runs/route.ts",
  "app/api/autonomy/runs/[id]/route.ts",
  "fixtures/autonomy-runner.sample.v0.1.json",
  "scripts/smoke-autonomy-runner-v0-1.mjs",
  "lib/db/schema.sql",
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
  ...followOnGuideBriefRouteFiles,
  ...followOnWebGuidePanelFiles,
  ...followOnChatgptAppGuideBriefToolFiles,
  ...followOnHandoffCapsuleAppToolFiles,
  ...followOnAutonomyContractCodexSkillFiles,
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

const textByFile = loadTextByFile(requiredFiles);
const docText = textByFile.get(guideBriefDoc);
const typeText = textByFile.get(guideBriefTypeFile);
const helperText = textByFile.get(guideBriefHelperFile);
const fixtureText = textByFile.get(fixtureFile);
const smokeText = textByFile.get(smokeFile);
const packageJsonText = textByFile.get(packageJsonFile);
const indexText = textByFile.get(indexDoc);
const fixture = JSON.parse(fixtureText);

assertPackageJsonScript();
assertIndexPointer();
assertDocumentContract();
assertTypeContract();
assertHelperContract();
assertFixtureShape();
assertSeparation();
assertSurfaceRenderingNotes();
assertHandoffPreviewBoundary();
assertAuthorityBoundary();
assertPublicSafety();
assertNoRuntimeActuationCode();
const followOnCodexGuideBriefHandoffFiles = [
  "docs/CODEX_GUIDEBRIEF_HANDOFF_V0_1.md",
  "plugins/augnes-operator/skills/augnes-guidebrief-handoff/SKILL.md",
  "docs/GUIDEBRIEF_CONTRACT_V0_1.md",
  "docs/CODEX_AUGNES_OPERATOR_PLUGIN_V0_2.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
  "scripts/smoke-codex-guidebrief-handoff-v0-1.mjs",
  "scripts/smoke-augnes-operator-plugin-v2.mjs",
  "scripts/smoke-augnes-capsule-handoff-skill.mjs",
];
for (const file of followOnCodexGuideBriefHandoffFiles) {
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
];
for (const file of followOnHandoffCapsuleWebPreviewFiles) {
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

const changedFilesBoundary = assertChangedFileBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "guide-brief-v0-1",
      pass: true,
      required_files_checked: requiredFiles,
      package_script_checked: true,
      index_pointer_checked: true,
      document_contract_checked: true,
      type_exports_checked: true,
      helper_exports_checked: true,
      fixture_json_parsed: true,
      observed_count: fixture.observed.length,
      inferred_count: fixture.inferred.length,
      suggested_count: fixture.suggested.length,
      needs_user_judgment_count: fixture.needs_user_judgment.length,
      handoff_candidate_count: fixture.handoff_candidates.length,
      staleness_warning_count: fixture.staleness_warnings.length,
      authority_boundary_checked: true,
      public_safety_checked: true,
      no_runtime_actuation_code_checked: true,
      changed_files_checked: changedFilesBoundary.checked,
      changed_files_skipped: changedFilesBoundary.skipped,
      changed_files_skip_reason: changedFilesBoundary.skip_reason,
      changed_files_observed: changedFilesBoundary.files,
      prior_smoke_allowlist_compatibility_files_allowed:
        priorSmokeAllowlistCompatibilityFiles,
      guidebrief_route_files_allowed: followOnGuideBriefRouteFiles,
      web_guide_panel_files_allowed: followOnWebGuidePanelFiles,
      smoke_type:
        "static-guide-brief-contract-type-helper-fixture-package-index-boundary-only",
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
      external_side_effect_added: false,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:guide-brief-v0-1");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText,
    scriptName: "smoke:guide-brief-v0-1",
    expectedCommand: "node scripts/smoke-guide-brief-v0-1.mjs",
  });
}

function assertIndexPointer() {
  assertContainsAll(
    indexText,
    [
      guideBriefDoc,
      "GuideBrief / Cross-Surface Guide Core v0.1",
      "contract/type/helper/fixture/smoke only",
    ],
    { label: indexDoc },
  );
}

function assertDocumentContract() {
  assertContainsAll(
    docText,
    [
      "GuideBrief is a read-only guide packet",
      "Top-Level Shape",
      "Observed / Inferred / Suggested / Needs User Judgment",
      "Observed items are source-backed facts",
      "Inferred items are derived interpretations",
      "Suggested items are candidate next actions or navigation suggestions only",
      "needs_user_judgment",
      "Source Mapping",
      "Surface Rendering Notes",
      "Handoff candidates are preview-only",
      "Authority Boundary",
      "Phase 6A scope is contract/type/helper/fixture/smoke only",
      "Phase 6B GuideBrief GET-only read route is deferred",
      "Phase 6C Web Guide UI is deferred",
      "Phase 6D ChatGPT App/MCP Guide tool is deferred",
      "Phase 6E scope is Codex GuideBrief alignment docs, skill guidance, smoke",
      "Phase 7 Handoff Capsule / Codex Launch Card may consume GuideBrief only",
      "no DB reads",
      "no DB writes",
      "no provider/OpenAI calls",
      "no GitHub calls",
      "no Codex execution",
      "no proof/evidence writes",
      "no external side effects",
    ],
    { label: guideBriefDoc },
  );
}

function assertTypeContract() {
  assertNoRuntimeImports({
    file: guideBriefTypeFile,
    text: typeText,
    forbiddenImports: [
      "node:",
      "fs",
      "path",
      "child_process",
      ".json",
      "app/",
      "components/",
      "lib/db",
      "migrations/",
      "apps/augnes_apps/",
      "@openai",
      "openai",
      "octokit",
    ],
  });

  assert(
    !/\breadFileSync\b|\bwriteFileSync\b|\bfetch\s*\(|\bnew\s+Database\b|\bprocess\.env\b/.test(
      typeText,
    ),
    `${guideBriefTypeFile} must not contain runtime side effects`,
  );

  const requiredExports = [
    "GuideBrief",
    "GuideBriefInput",
    "GuideBriefObservedItem",
    "GuideBriefInferredItem",
    "GuideBriefSuggestion",
    "GuideBriefUserJudgmentItem",
    "GuideBriefCurrentPerspectiveSummary",
    "GuideBriefDeltaSummary",
    "GuideBriefWorkplaneSummary",
    "GuideBriefReviewQueueSummary",
    "GuideBriefHandoffCandidate",
    "GuideBriefStalenessWarning",
    "GuideBriefSurfaceRenderingNotes",
    "GuideBriefSourceRefs",
    "GuideBriefGap",
    "GuideBriefAuthorityBoundary",
    "GuideBriefSourceSurface",
    "GuideBriefSuggestedSurface",
    "GuideBriefSuggestedActor",
    "GuideBriefConfidence",
    "GuideBriefJudgmentUrgency",
  ];

  for (const exportName of requiredExports) {
    const exportPattern = new RegExp(
      `export\\s+(?:const|type|interface)\\s+${escapeRegExp(exportName)}\\b`,
    );
    assert(
      exportPattern.test(typeText),
      `${guideBriefTypeFile} must export ${exportName}`,
    );
  }
}

function assertHelperContract() {
  const requiredExports = [
    "buildGuideBrief",
    "buildGuideObservedItems",
    "buildGuideInferences",
    "buildGuideSuggestions",
    "buildGuideUserJudgmentItems",
    "buildGuideCurrentPerspectiveSummary",
    "buildGuideDeltaSummary",
    "buildGuideWorkplaneSummary",
    "buildGuideReviewQueueSummary",
    "buildGuideHandoffCandidates",
    "buildGuideStalenessWarnings",
    "buildGuideSurfaceRenderingNotes",
    "buildGuideBriefAuthorityBoundary",
  ];

  for (const exportName of requiredExports) {
    const exportPattern = new RegExp(
      `export\\s+function\\s+${escapeRegExp(exportName)}\\b`,
    );
    assert(
      exportPattern.test(helperText),
      `${guideBriefHelperFile} must export ${exportName}`,
    );
  }

  assertContainsAll(
    helperText,
    [
      "GuideBrief is read-only",
      "Observed items are read-model observations only",
      "Inferred items are derived interpretations only",
      "Suggested items are candidate next actions only",
      "Needs user judgment items must not be decided by the guide",
      "Handoff candidates are preview-only",
      "Codex and ChatGPT surfaces require separate scoped implementation",
    ],
    { label: guideBriefHelperFile },
  );
}

function assertFixtureShape() {
  assert.equal(fixture.runtime, "augnes", `${fixtureFile} must use runtime`);
  assert.equal(
    fixture.guide_version,
    "guide_brief.v0.1",
    `${fixtureFile} must use GuideBrief version`,
  );
  assert.equal(fixture.scope, "project:augnes", `${fixtureFile} must use scope`);

  for (const field of [
    "observed",
    "inferred",
    "suggested",
    "needs_user_judgment",
    "current_perspective_summary",
    "delta_summary",
    "workplane_summary",
    "review_queue_summary",
    "handoff_candidates",
    "staleness_warnings",
    "surface_rendering_notes",
    "source_refs",
    "gaps",
    "authority_boundary",
    "next_phase_notes",
  ]) {
    assert(
      Object.prototype.hasOwnProperty.call(fixture, field),
      `${fixtureFile} must include ${field}`,
    );
  }

  assert(fixture.observed.length >= 4, `${fixtureFile} needs observed items`);
  assert(fixture.inferred.length >= 2, `${fixtureFile} needs inferred items`);
  assert(fixture.suggested.length >= 3, `${fixtureFile} needs suggested items`);
  assert(
    fixture.needs_user_judgment.length >= 2,
    `${fixtureFile} needs needs_user_judgment items`,
  );
  assert(
    fixture.handoff_candidates.length >= 1,
    `${fixtureFile} needs handoff candidates`,
  );
  assert(
    fixture.staleness_warnings.length >= 1,
    `${fixtureFile} needs staleness warnings`,
  );
  assert.equal(
    fixture.current_perspective_summary.research_pressure_level,
    "medium",
    `${fixtureFile} must include current perspective research pressure`,
  );
  assert.equal(
    fixture.workplane_summary.route,
    "/workbench",
    `${fixtureFile} must show /workbench route`,
  );
  assert.equal(
    fixture.workplane_summary.surface_role,
    "agent_workplane",
    `${fixtureFile} must show Agent Workplane role`,
  );
}

function assertSeparation() {
  for (const item of fixture.observed) {
    assert.equal(
      item.confidence,
      "observed",
      "observed items must use observed confidence",
    );
    assert(!item.suggestion_id, "observed item must not be suggestion");
    assert(!item.inference_id, "observed item must not be inference");
  }

  for (const item of fixture.inferred) {
    assert(
      ["low", "medium", "high"].includes(item.confidence),
      "inferred item must use low/medium/high confidence",
    );
    assert(
      Array.isArray(item.basis_observation_ids),
      "inferred item must preserve basis observations",
    );
    assert(
      Array.isArray(item.caveats) && item.caveats.length > 0,
      "inferred item must preserve caveats",
    );
  }

  for (const item of fixture.suggested) {
    assert(
      item.authority_boundary_summary.includes("no") ||
        item.authority_boundary_summary.includes("Candidate"),
      "suggested item must include boundary summary",
    );
    assert(!item.question, "suggested item must not become a user judgment");
  }

  for (const item of fixture.needs_user_judgment) {
    assert(
      Array.isArray(item.options) && item.options.length >= 2,
      "needs_user_judgment item must preserve options",
    );
    assert(
      Array.isArray(item.blocked_until_decided),
      "needs_user_judgment item must preserve blocked_until_decided",
    );
  }
}

function assertSurfaceRenderingNotes() {
  for (const surface of [
    "human_surface",
    "perspective_timeline",
    "agent_workplane",
    "chatgpt_app",
    "codex",
    "future_agent_surface",
  ]) {
    assert(
      Array.isArray(fixture.surface_rendering_notes[surface]) &&
        fixture.surface_rendering_notes[surface].length > 0,
      `${fixtureFile} must include surface rendering notes for ${surface}`,
    );
  }

  assertContainsAll(
    fixtureText,
    [
      "compact summary and user judgment prompts",
      "Preserve delta chronology",
      "trace and diagnostic refs",
      "Observed, Inferred, Suggested, and Needs user judgment separated",
      "repo/task boundaries",
      "read-only context unless separately scoped",
    ],
    { label: fixtureFile },
  );
}

function assertHandoffPreviewBoundary() {
  assert(
    fixture.handoff_candidates.length >= 1,
    `${fixtureFile} must include handoff candidate`,
  );

  for (const candidate of fixture.handoff_candidates) {
    assert(
      ["preview_only", "needs_review", "blocked"].includes(candidate.status),
      "handoff candidate status must be preview_only, needs_review, or blocked",
    );
    assert(
      candidate.authority_boundary.includes("Preview-only") ||
        candidate.authority_boundary.includes("Preview"),
      "handoff candidate must preserve preview-only boundary",
    );
    assert(
      /cannot send|no send|Preview-only/i.test(candidate.authority_boundary),
      "handoff candidate must deny send authority",
    );
    assert(
      /execute|launch Codex/i.test(candidate.authority_boundary),
      "handoff candidate must deny execution authority",
    );
  }
}

function assertAuthorityBoundary() {
  const boundary = fixture.authority_boundary;
  const deniedFields = [
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
    "can_launch_autonomy",
    "can_create_mcp_tool",
    "can_create_ui_action",
  ];

  for (const field of deniedFields) {
    assert.equal(
      boundary[field],
      false,
      `${fixtureFile} authority boundary must deny ${field}`,
    );
  }

  assertContainsAll(
    boundary.notes.join("\n"),
    [
      "GuideBrief is read-only.",
      "Observed items are read-model observations only.",
      "Inferred items are derived interpretations only.",
      "Suggested items are candidate next actions only.",
      "Needs user judgment items must not be decided by the guide.",
      "Handoff candidates are preview-only.",
      "Codex and ChatGPT surfaces require separate scoped implementation.",
    ],
    { label: `${fixtureFile} authority notes` },
  );
}

function assertPublicSafety() {
  const safety = fixture.public_safety;
  for (const field of [
    "contains_private_paths",
    "contains_secrets",
    "contains_api_keys",
    "contains_github_tokens",
    "contains_raw_private_conversations",
    "contains_hidden_reasoning",
    "contains_raw_provider_output",
    "contains_raw_retrieval_output",
    "contains_real_external_account_artifacts",
  ]) {
    assert.equal(
      safety[field],
      false,
      `${fixtureFile} public_safety.${field} must be false`,
    );
  }

  assert(!/\/Users\/|sk-[A-Za-z0-9]|ghp_[A-Za-z0-9]/.test(fixtureText));
}

function assertNoRuntimeActuationCode() {
  const checkedText = `${typeText}\n${helperText}`;
  const forbiddenPatterns = [
    /\bfrom\s+["']@\/lib\/db["']/,
    /\bfrom\s+["'][^"']*\/db["']/,
    /\bnew\s+Database\b/,
    /\bfetch\s*\(/,
    /\bappendWorkEvent\b/,
    /\bappendCoordinationEvent\b/,
    /\bcreateEvidenceRecord\b/,
    /\brecordProof\b/,
    /\bcommitState\b/,
    /\brejectState\b/,
    /\bcommitStateDeltaProposal\b/,
    /\brejectStateDeltaProposal\b/,
    /@openai/,
    /\boctokit\b/i,
    /\bcreatePullRequest\b/,
    /\bchild_process\b/,
    /\bspawn\s*\(/,
    /\bexecFile\s*\(/,
    /\breadFileSync\b/,
    /\bwriteFileSync\b/,
    /\bprocess\.env\b/,
    /\bINSERT\s+INTO\b/i,
    /\bUPDATE\s+[A-Za-z_][\w.]*\s+SET\b/i,
    /\bDELETE\s+FROM\b/i,
    /\bCREATE\s+TABLE\b/i,
    /\bALTER\s+TABLE\b/i,
    /\bDROP\s+TABLE\b/i,
    /\bsetInterval\s*\(/,
    /\bsetTimeout\s*\(/,
    /\bautonomyRunner\b/i,
  ];

  for (const pattern of forbiddenPatterns) {
    assert(
      !pattern.test(checkedText),
      `GuideBrief type/helper must not add runtime actuation code matching ${pattern}`,
    );
  }

  assertContainsAll(
    smokeText,
    [
      "allowedChangedFiles",
      "source_of_truth",
      "can_send_handoff",
      "can_launch_autonomy",
      "can_create_mcp_tool",
      "can_create_ui_action",
    ],
    { label: smokeFile },
  );
}

function assertChangedFileBoundary() {
  const workingTree = collectGitDiffFiles(["diff", "--name-only"]);
  const cached = collectGitDiffFiles(["diff", "--cached", "--name-only"]);
  const baseRange = getBaseRangeChangedFiles();
  const untrackedFiles = collectUntrackedFiles();
  const files = uniqueSorted([
    ...workingTree.files,
    ...cached.files,
    ...baseRange.files,
    ...untrackedFiles,
  ]);

  for (const file of files) {
    assert(
      allowedChangedFiles.has(file),
      `Unexpected Phase 6A GuideBrief changed or untracked file: ${file}`,
    );
    assert(file !== "app/page.tsx", "Phase 6A must not update / home page");
    assert(
      file !== "app/perspective/page.tsx",
      "Phase 6A must not update /perspective page",
    );
    assert(
      file !== "app/workbench/page.tsx",
      "Phase 6A must not update /workbench page",
    );
    assert(
      !/^components\//.test(file) ||
        followOnWebGuidePanelFiles.includes(file) ||
        followOnHandoffCapsuleWebPreviewFiles.includes(file) ||
        followOnHandoffCapsuleCopyExportFiles.includes(file) ||
        phase8cAutonomyContractWebPreviewFiles.includes(file) ||
        phase9aAutonomyRunnerPreflightFiles.includes(file) ||
        phase8fAutonomyContractCopyExportFiles.includes(file),
      `Phase 6A must not change UI files outside exact Phase 6C/7C/7F Web follow-on scope or exact Phase 8C/8F Autonomy Web preview files: ${file}`,
    );
    assert(
      !/^app\/api\//.test(file) ||
        followOnGuideBriefRouteFiles.includes(file) ||
        followOnHandoffCapsuleRouteFiles.includes(file) ||
        file === "app/api/augnes/read/autonomy-contract/route.ts" ||
        phase9aAutonomyRunnerPreflightFiles.includes(file),
      `Phase 6A must not add API routes outside exact GuideBrief/Handoff Capsule follow-on scope: ${file}`,
    );
    assert(
      !/^app\/.*route\.(ts|tsx|js|jsx)$/.test(file) ||
        followOnGuideBriefRouteFiles.includes(file) ||
        followOnHandoffCapsuleRouteFiles.includes(file) ||
        file === "app/api/augnes/read/autonomy-contract/route.ts" ||
        phase9aAutonomyRunnerPreflightFiles.includes(file),
      `Phase 6A must not add route files outside exact GuideBrief/Handoff Capsule follow-on scope: ${file}`,
    );
    assert(!/^db\//.test(file), `Phase 6A must not change DB files: ${file}`);
    assert(
      !/^migrations\//.test(file),
      `Phase 6A must not change migrations: ${file}`,
    );
    assert(
      (!/^apps\/augnes_apps\//.test(file) || followOnChatgptAppGuideBriefToolFiles.includes(file)),
      `Phase 6A must not change MCP/App files: ${file}`,
    );
    assert(
      ((!/(^|\/)(mcp|plugin|plugins|tool|tools)(\/|$)/i.test(file) ||
        followOnCodexGuideBriefHandoffFiles.includes(file)) ||
        followOnChatgptAppGuideBriefToolFiles.includes(file) ||
        followOnCodexGuideBriefHandoffFiles.includes(file) ||
        followOnHandoffCapsuleAppToolFiles.includes(file) ||
        followOnAutonomyContractCodexSkillFiles.includes(file) || phase9aAutonomyRunnerPreflightFiles.includes(file)),
      `Phase 6A must not change MCP/App tool files: ${file}`,
    );
    assert(
      !/(^|\/)(provider|providers|openai|github)(\/|$)/i.test(file),
      `Phase 6A must not change provider/OpenAI/GitHub runtime files: ${file}`,
    );
    assert(
      !/(^|\/)(proof|evidence)(\/|$)/i.test(file),
      `Phase 6A must not add proof/evidence write paths: ${file}`,
    );
    assert(
      !/(^|\/)(autonomy-runner|scheduler)(\/|$)/i.test(file),
      `Phase 6A must not add scheduler or autonomy runner files: ${file}`,
    );
  }

  return {
    checked:
      workingTree.checked ||
      cached.checked ||
      baseRange.checked ||
      untrackedFiles.length > 0,
    skipped: !(
      workingTree.checked ||
      cached.checked ||
      baseRange.checked ||
      untrackedFiles.length > 0
    ),
    skip_reason:
      workingTree.checked ||
      cached.checked ||
      baseRange.checked ||
      untrackedFiles.length > 0
        ? null
        : "changed-file boundary could not be checked",
    files,
  };
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
