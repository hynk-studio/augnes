#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertPackageScript,
  collectGitDiffFiles,
  collectUntrackedFiles,
  getBaseRangeChangedFiles,
  loadTextByFile,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const typeFile = "types/legacy-cockpit-local-control-classification.ts";
const helperFile =
  "lib/workplane/legacy-cockpit-local-control-classification.ts";
const docFile =
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_LOCAL_CONTROL_CLASSIFICATION_V0_1.md";
const smokeFile =
  "scripts/smoke-legacy-cockpit-local-control-classification-v0-1.mjs";
const packageJsonFile = "package.json";
const indexDoc = "docs/00_INDEX_LATEST.md";
const agentWorkplaneDoc = "docs/AGENT_WORKPLANE_V0_1.md";
const inventoryDoc =
  "docs/AGENT_WORKPLANE_COCKPIT_CAPABILITY_INVENTORY_V0_1.md";
const absorptionMapDoc =
  "docs/AGENT_WORKPLANE_NATIVE_ABSORPTION_MAP_V0_1.md";
const shrinkPlanDoc =
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_PLAN_V0_1.md";
const shrinkDoc = "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_V0_1.md";
const browserRegressionDoc =
  "docs/AGENT_WORKPLANE_NATIVE_REPLACEMENT_BROWSER_REGRESSION_V0_1.md";
const runPostmortemDoc =
  "docs/AGENT_WORKPLANE_RUN_POSTMORTEM_DETAIL_V0_1.md";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const augnesCockpitFile = "components/augnes-cockpit.tsx";
const cockpitPageFile = "app/cockpit/page.tsx";
const legacyCompatibilityPanelFile =
  "components/workplane/legacy-cockpit-compatibility-panel.tsx";

const classificationSliceFiles = [
  typeFile,
  helperFile,
  docFile,
  smokeFile,
  inventoryDoc,
  absorptionMapDoc,
  shrinkPlanDoc,
  shrinkDoc,
  browserRegressionDoc,
  agentWorkplaneDoc,
  runPostmortemDoc,
  indexDoc,
  packageJsonFile,
];

const existingSmokeAllowlistFiles = [
  "scripts/smoke-agent-workplane-run-postmortem-detail-v0-1.mjs",
  "scripts/smoke-agent-workplane-review-memory-detail-v0-1.mjs",
  "scripts/smoke-agent-workplane-bridge-trace-detail-v0-1.mjs",
  "scripts/smoke-workplane-native-browser-regression-v0-1.mjs",
  "scripts/smoke-agent-workplane-legacy-cockpit-shrink-plan-v0-1.mjs",
  "scripts/smoke-augnes-on-augnes-dogfood-v0-1.mjs",
  "scripts/smoke-runner-workplane-metrics-v0-1.mjs",
  "scripts/smoke-guidebrief-intent-projection-v0-1.mjs",
  "scripts/smoke-guide-workplane-debug-context-v0-1.mjs",
  "scripts/smoke-guide-brief-v0-1.mjs",
  "scripts/smoke-guide-brief-route-v0-1.mjs",
  "scripts/smoke-agent-workplane-node-contract-v0-1.mjs",
  "scripts/smoke-workplane-runner-deltabatch-integration-v0-1.mjs",
  "scripts/smoke-agent-workplane-cockpit-inheritance-v0-1.mjs",
  "scripts/smoke-agent-workplane-shell-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
  "types/augnes-dogfood-metrics-baseline.ts",
  "lib/dogfood/augnes-dogfood-metrics-baseline.ts",
  "docs/AUGNES_DOGFOOD_METRICS_BASELINE_V0_2.md",
  "scripts/run-augnes-dogfood-metrics-baseline-v0-2.mjs",
  "scripts/smoke-augnes-dogfood-metrics-baseline-v0-2.mjs",

  "docs/AUGNES_ON_AUGNES_DOGFOOD_V0_1.md",
  "docs/AUGNES_WORKFLOW_METRICS_V0_1.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_PLAN_V0_1.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_LOCAL_CONTROL_CLASSIFICATION_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_REPLACEMENT_BROWSER_REGRESSION_V0_1.md",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
  "types/legacy-cockpit-control-inventory.ts",
  "lib/workplane/legacy-cockpit-control-inventory.ts",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_CONTROL_INVENTORY_V0_1.md",
  "scripts/smoke-legacy-cockpit-control-inventory-v0-1.mjs",
  "docs/AGENT_WORKPLANE_REVIEW_MEMORY_DETAIL_V0_1.md",

];

const allowedChangedFiles = [
  ...classificationSliceFiles,
  ...existingSmokeAllowlistFiles,
  cockpitPageFile,
  agentWorkplaneFile,
  legacyCompatibilityPanelFile,
  "lib/workplane/workplane-browser-regression.ts",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_CONTROL_INVENTORY_V0_1.md",
  "scripts/smoke-agent-workplane-legacy-cockpit-shrink-v0-1.mjs",
];

const requiredFiles = [
  ...classificationSliceFiles,
  agentWorkplaneFile,
  augnesCockpitFile,
  cockpitPageFile,
  legacyCompatibilityPanelFile,
];

const requiredControlClasses = [
  "read_only_visibility",
  "copy_only",
  "export_only",
  "preview_only",
  "local_draft",
  "local_write",
  "external_authority_forbidden",
  "compatibility_only",
  "unknown",
];

const requiredAuthorityClasses = [
  "no_authority",
  "copy_authority",
  "local_preview_authority",
  "local_write_authority",
  "external_execution_authority",
  "forbidden_authority",
  "unknown_authority",
];

const requiredStatuses = [
  "classified",
  "needs_review",
  "blocked",
  "obsolete_with_rationale",
  "retained_compatibility",
  "native_absorption_candidate",
  "forbidden",
];

const requiredMigrationTargets = [
  "native_workplane_read_only",
  "native_workplane_copy_only",
  "native_workplane_preview_only",
  "compatibility_only_until_authority_contract",
  "forbidden_do_not_absorb",
  "obsolete_do_not_absorb",
  "needs_browser_manual_review",
];

const requiredGroups = [
  "overview_work_brief",
  "handoff_copy_export",
  "perspective_preview",
  "bridge_navigation",
  "operator_review_controls",
  "proposal_review_controls",
  "evidence_trace_loaders",
  "runner_trace_controls",
  "external_forbidden_controls",
  "unknown_legacy_controls",
];

const requiredControls = [
  "cockpit_tab_navigation",
  "overview_review_local_proposals_navigation",
  "work_item_selection",
  "work_codex_handoff_copy",
  "work_event_template_copy",
  "perspective_packet_copy_export",
  "perspective_formation_basis_switch",
  "perspective_lens_scope_controls",
  "manual_gravity_preview_controls",
  "manual_gravity_local_draft_controls",
  "manual_pasted_text_preview_controls",
  "bridge_tab_matrix_navigation",
  "operator_plan_next",
  "safe_local_checklist_actions",
  "observe_local_proposal_input",
  "proposal_consolidate_candidates",
  "proposal_commit_reject",
  "ag_resume_lifecycle_review_controls",
  "evidence_pack_loader",
  "session_trace_loader",
  "temporal_interpretation_preview_loader",
  "temporal_review_artifact_loader",
  "runner_trace_visibility_controls",
  "external_publish_merge_retry_replay_deploy_controls",
  "provider_github_codex_execution_controls",
  "durable_memory_perspective_delta_apply_controls",
  "unknown_legacy_browser_manual_controls",
];

const requiredAuthorityFields = [
  "can_delete_legacy_cockpit",
  "can_shrink_legacy_cockpit",
  "can_hide_legacy_cockpit",
  "can_change_product_ui_behavior",
  "can_add_product_route",
  "can_add_api_write_route",
  "can_add_server_action",
  "can_call_provider_openai",
  "can_call_github",
  "can_actuate_github",
  "can_execute_codex",
  "can_execute_runner",
  "can_tick_runner",
  "can_recover_delta_batch",
  "can_schedule_runner",
  "can_write_product_db",
  "can_record_proof",
  "can_create_evidence",
  "can_apply_durable_memory",
  "can_apply_perspective",
  "can_auto_apply_delta",
  "can_merge_publish_retry_replay_deploy",
  "can_absorb_local_write_control_without_contract",
];

const requiredReadFields = [
  "version",
  "status",
  "as_of",
  "control_groups",
  "controls",
  "counts",
  "native_absorption_candidates",
  "compatibility_only_controls",
  "forbidden_controls",
  "unknown_controls",
  "required_next_reviews",
  "shrink_gate_notes",
  "authority_boundary",
  "source_refs",
  "validation_summary",
];

const requiredTableFields = [
  "control_id",
  "group_id",
  "legacy_surface",
  "observed_or_documented_source",
  "control_class",
  "authority_class",
  "status",
  "migration_target",
  "native_replacement_or_candidate",
  "compatibility_path",
  "required_before_absorption",
  "shrink_gate_effect",
  "recommended_next_review",
];

const textByFile = loadTextByFile(requiredFiles);
const typeText = textByFile.get(typeFile);
const helperText = textByFile.get(helperFile);
const docText = textByFile.get(docFile);
const packageJsonText = textByFile.get(packageJsonFile);
const indexText = textByFile.get(indexDoc);
const agentWorkplaneDocText = textByFile.get(agentWorkplaneDoc);
const inventoryText = textByFile.get(inventoryDoc);
const absorptionMapText = textByFile.get(absorptionMapDoc);
const shrinkPlanText = textByFile.get(shrinkPlanDoc);
const browserRegressionDocText = textByFile.get(browserRegressionDoc);
const runPostmortemDocText = textByFile.get(runPostmortemDoc);
const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
const augnesCockpitText = textByFile.get(augnesCockpitFile);
const cockpitPageText = textByFile.get(cockpitPageFile);
const legacyCompatibilityPanelText = textByFile.get(
  legacyCompatibilityPanelFile,
);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:legacy-cockpit-local-control-classification-v0-1",
  expectedCommand:
    "node scripts/smoke-legacy-cockpit-local-control-classification-v0-1.mjs",
});

assertDocsAndPointers();
assertTypeContract();
assertHelperStaticShape();
const behavior = assertHelperBehavior();
assertLegacyCompatibilityStillRendered();
const changedFilesBoundary = assertChangedFilesWithin({
  allowedChangedFiles,
  label: "legacy cockpit local control classification v0.1",
});
assertNoProductBehaviorFileChanges();
assertNoRouteOrAuthorityPathAdded();
assertDeltaBatchIdentityStillDocumented();

console.log(
  JSON.stringify(
    {
      ok: true,
      script: "smoke:legacy-cockpit-local-control-classification-v0-1",
      behavior,
      changed_files_boundary: changedFilesBoundary,
    },
    null,
    2,
  ),
);

function assertDocsAndPointers() {
  assertContainsAll(indexText, [
    "AGENT_WORKPLANE_LEGACY_COCKPIT_LOCAL_CONTROL_CLASSIFICATION_V0_1.md",
  ]);
  assertContainsAll(agentWorkplaneDocText, [
    "AGENT_WORKPLANE_LEGACY_COCKPIT_LOCAL_CONTROL_CLASSIFICATION_V0_1.md",
  ]);
  assertContainsAll(inventoryText, [
    "AGENT_WORKPLANE_LEGACY_COCKPIT_LOCAL_CONTROL_CLASSIFICATION_V0_1.md",
  ]);
  assertContainsAll(absorptionMapText, [
    "AGENT_WORKPLANE_LEGACY_COCKPIT_LOCAL_CONTROL_CLASSIFICATION_V0_1.md",
  ]);
  assertContainsAll(shrinkPlanText, [
    "AGENT_WORKPLANE_LEGACY_COCKPIT_LOCAL_CONTROL_CLASSIFICATION_V0_1.md",
  ]);
  assertContainsAll(browserRegressionDocText, [
    "AGENT_WORKPLANE_LEGACY_COCKPIT_LOCAL_CONTROL_CLASSIFICATION_V0_1.md",
  ]);
  assertContainsAll(runPostmortemDocText, [
    "legacy local UI control classification",
  ]);

  assertContainsAll(docText, [
    "why local UI control classification exists",
    "why it happens before any shrink candidate",
    "not a shrink PR",
    "not a deletion PR",
    "control classes",
    "authority classes",
    "migration targets",
    "capability group mapping",
    "control classification table",
    "Native Absorption Candidate Summary",
    "Compatibility-Only Summary",
    "Forbidden Controls Summary",
    "Unknown / Manual Review Summary",
    "Required Authority Contract Before Local-Write Absorption",
    "How Browser Regression Uses This Classification",
    "How Metrics, Dogfood, And Shrink Plan Use This Classification",
    "No Legacy Cockpit functionality is deleted, shrunk, hidden, or disabled",
    "Compatibility path remains rendered",
    "Future deletion requires a separate PR",
    "Classification is evidence/signaling, not shrink authority",
    "Browser regression, metrics, and dogfood are evidence/signals, not shrink authority",
    "Local-write controls require a separate authority contract before native absorption",
    "No native absorption of local-write controls is implemented here",
    "no route",
    "no API write route",
    "no server action",
    "no chat composer",
    "no provider/OpenAI/GitHub/Codex execution",
    "no Codex launch, branch creation, PR creation, merge, publish, retry, replay, or deploy",
    "no runner execution",
    "no runner tick",
    "no runner recovery write",
    "no scheduled runner behavior",
    "no product DB write or persistence",
    "no proof/evidence write",
    "no durable memory apply",
    "no Perspective apply",
    "no delta auto-apply",
    "no localStorage/sessionStorage durable view mode",
    "no product UI action authority",
    "repeated dogfood/metrics baseline",
    "not Legacy Cockpit deletion yet",
  ]);

  assertContainsAll(docText, requiredTableFields);
  assertContainsAll(docText, requiredControls);
  assertContainsAll(docText, requiredControlClasses);
  assertContainsAll(docText, requiredAuthorityClasses);
  assertContainsAll(docText, requiredMigrationTargets);
}

function assertTypeContract() {
  assertContainsAll(typeText, [
    "LEGACY_COCKPIT_LOCAL_CONTROL_CLASSIFICATION_VERSION",
    "LegacyCockpitControlClass",
    "LegacyCockpitControlAuthorityClass",
    "LegacyCockpitControlStatus",
    "LegacyCockpitControlMigrationTarget",
    "LegacyCockpitLocalControl",
    "LegacyCockpitControlGroup",
    "LegacyCockpitControlClassificationAuthorityBoundary",
    "LegacyCockpitControlClassificationRead",
  ]);
  assertContainsAll(typeText, requiredControlClasses);
  assertContainsAll(typeText, requiredAuthorityClasses);
  assertContainsAll(typeText, requiredStatuses);
  assertContainsAll(typeText, requiredMigrationTargets);
  assertContainsAll(typeText, requiredGroups);
  assertContainsAll(typeText, requiredAuthorityFields);
  assertContainsAll(typeText, requiredReadFields);
}

function assertHelperStaticShape() {
  assertContainsAll(helperText, [
    "buildLegacyCockpitLocalControlClassification",
    "LEGACY_COCKPIT_LOCAL_CONTROL_GROUPS",
    "LEGACY_COCKPIT_LOCAL_CONTROL_CLASSIFICATION_REQUIRED_CONTROLS",
    "LEGACY_COCKPIT_LOCAL_CONTROL_AUTHORITY_BOUNDARY",
    "static deterministic classification only",
    "no product UI behavior or authority changes",
  ]);
  assertContainsAll(helperText, requiredControls);
  assertContainsAll(helperText, requiredGroups);
  assertContainsAll(helperText, requiredAuthorityFields);

  const forbiddenPatterns = [
    /fetch\s*\(/,
    /readFileSync|writeFileSync|appendFileSync/,
    /recoverDeltaBatchForRun\s*\(/,
    /runAutonomy|tickAutonomy|scheduleAutonomy/i,
    /localStorage\.|sessionStorage\./,
    /document\./,
    /window\./,
  ];
  for (const pattern of forbiddenPatterns) {
    assert(!pattern.test(helperText), `helper must not contain ${pattern}`);
  }
}

function assertHelperBehavior() {
  const code = `
    import assert from "node:assert/strict";
    import {
      buildLegacyCockpitLocalControlClassification,
      LEGACY_COCKPIT_LOCAL_CONTROL_GROUPS,
      LEGACY_COCKPIT_LOCAL_CONTROL_CLASSIFICATION_REQUIRED_CONTROLS,
    } from "./lib/workplane/legacy-cockpit-local-control-classification";

    const read = buildLegacyCockpitLocalControlClassification({
      as_of: "2026-07-02T00:00:00.000Z",
      source_text: "cockpit_tab_navigation Work Codex handoff copy",
    });

    assert.equal(read.version, "legacy_cockpit_local_control_classification.v0.1");
    assert.equal(read.status, "needs_review");
    assert.equal(read.control_groups.length, 10);
    assert.equal(LEGACY_COCKPIT_LOCAL_CONTROL_GROUPS.length, 10);
    assert.equal(read.controls.length, 27);
    assert.equal(LEGACY_COCKPIT_LOCAL_CONTROL_CLASSIFICATION_REQUIRED_CONTROLS.length, 27);
    assert.deepEqual(read.controls.map((control) => control.control_id).sort(), [...LEGACY_COCKPIT_LOCAL_CONTROL_CLASSIFICATION_REQUIRED_CONTROLS].sort());

    for (const group of ${JSON.stringify(requiredGroups)}) {
      assert(read.control_groups.some((item) => item.group_id === group), group);
    }

    for (const control of read.controls) {
      assert(control.control_id);
      assert(control.group_id);
      assert(control.legacy_surface);
      assert(control.observed_or_documented_source);
      assert(control.control_class);
      assert(control.authority_class);
      assert(control.status);
      assert(control.migration_target);
      assert(control.native_replacement_or_candidate);
      assert(control.compatibility_path);
      assert(Array.isArray(control.required_before_absorption));
      assert(control.shrink_gate_effect);
      assert(control.recommended_next_review);
      assert(Array.isArray(control.source_refs));
    }

    assert.equal(read.counts.by_class.read_only_visibility, 8);
    assert.equal(read.counts.by_class.copy_only, 3);
    assert.equal(read.counts.by_class.preview_only, 5);
    assert.equal(read.counts.by_class.local_draft, 1);
    assert.equal(read.counts.by_class.local_write, 6);
    assert.equal(read.counts.by_class.external_authority_forbidden, 3);
    assert.equal(read.counts.by_class.unknown, 1);
    assert.equal(read.counts.by_status.native_absorption_candidate, 10);
    assert.equal(read.counts.by_status.retained_compatibility, 11);
    assert.equal(read.counts.by_status.forbidden, 3);
    assert.equal(read.counts.by_status.needs_review, 1);
    assert.equal(read.counts.by_migration_target.native_workplane_read_only, 8);
    assert.equal(read.counts.by_migration_target.native_workplane_copy_only, 3);
    assert.equal(read.counts.by_migration_target.native_workplane_preview_only, 3);
    assert.equal(read.counts.by_migration_target.compatibility_only_until_authority_contract, 9);
    assert.equal(read.counts.by_migration_target.forbidden_do_not_absorb, 3);
    assert.equal(read.counts.by_migration_target.needs_browser_manual_review, 1);

    assert(read.native_absorption_candidates.length > 0);
    assert(read.compatibility_only_controls.length > 0);
    assert(read.forbidden_controls.length > 0);
    assert(read.unknown_controls.length > 0);
    assert(read.required_next_reviews.some((item) => item.includes("browser/manual")));
    assert(read.shrink_gate_notes.some((item) => item.includes("not shrink authority")));
    assert(read.validation_summary.smoke_refs.includes("smoke:legacy-cockpit-local-control-classification-v0-1"));

    assert(read.controls.some((control) => control.control_class === "read_only_visibility"));
    assert(read.controls.some((control) => control.control_class === "copy_only"));
    assert(read.controls.some((control) => control.control_class === "preview_only"));
    assert(read.controls.some((control) => control.control_class === "local_draft"));
    assert(read.controls.some((control) => control.control_class === "local_write"));
    assert(read.controls.some((control) => control.control_class === "external_authority_forbidden"));
    assert(read.controls.some((control) => control.control_class === "unknown"));
    assert(read.controls.some((control) => control.migration_target === "compatibility_only_until_authority_contract"));
    assert(read.controls.some((control) => control.migration_target === "forbidden_do_not_absorb"));
    assert(read.controls.some((control) => control.migration_target === "needs_browser_manual_review"));

    for (const field of ${JSON.stringify(requiredAuthorityFields)}) {
      assert.equal(read.authority_boundary[field], false, field);
    }

    console.log(JSON.stringify({
      status: read.status,
      control_count: read.controls.length,
      native_candidate_count: read.native_absorption_candidates.length,
      compatibility_only_count: read.compatibility_only_controls.length,
      forbidden_count: read.forbidden_controls.length,
      unknown_count: read.unknown_controls.length,
      read_only_count: read.counts.by_class.read_only_visibility,
      local_write_count: read.counts.by_class.local_write,
    }));
  `;

  const output = execFileSync("node", ["--import", "tsx", "--eval", code], {
    encoding: "utf8",
  });
  return JSON.parse(output);
}

function assertLegacyCompatibilityStillRendered() {
  assertContainsAll(agentWorkplaneText, [
    "LegacyCockpitCompatibilityPanel",
    "<LegacyCockpitCompatibilityPanel />",
    "Agent Workplane shrunk compatibility route",
  ]);
  assert(!agentWorkplaneText.includes("AugnesCockpit"), `${agentWorkplaneFile} must not import or render AugnesCockpit after the route split`);
  assertContainsAll(legacyCompatibilityPanelText, [
    'data-workplane-panel-id="legacy_cockpit_compatibility"',
    'data-workplane-legacy-cockpit-shrink="workbench_full_mount_removed"',
    'data-workplane-legacy-cockpit-route="/cockpit"',
    "Legacy Cockpit full mount was removed from /workbench",
  ]);
  assertContainsAll(cockpitPageText, [
    'import { AugnesCockpit } from "@/components/augnes-cockpit"',
    "<AugnesCockpit />",
  ]);
  assert(augnesCockpitText.includes("export function AugnesCockpit"));
}

function assertNoProductBehaviorFileChanges() {
  const changedFiles = observedChangedFiles();
  const forbiddenExact = new Set([
    "components/augnes-cockpit.tsx",
  ]);
  for (const file of changedFiles) {
    assert(!forbiddenExact.has(file), `No product UI behavior file changes allowed: ${file}`);
    assert(
      file === cockpitPageFile || !file.startsWith("app/"),
      `No route or product app file changes allowed outside /cockpit: ${file}`,
    );
    assert(!file.startsWith("db/"), `No DB file changes allowed: ${file}`);
    assert(!file.startsWith("migrations/"), `No migration changes allowed: ${file}`);
  }
}

function assertNoRouteOrAuthorityPathAdded() {
  const changedFiles = observedChangedFiles();
  for (const file of changedFiles) {
    assert(
      file === cockpitPageFile || !/route\.(ts|tsx|js|jsx)$/.test(file),
      `No route file changes allowed outside /cockpit: ${file}`,
    );
    assert(!file.startsWith("app/api/"), `No API route changes allowed: ${file}`);
  }

  const changedText = changedFiles
    .filter(
      (file) =>
        file !== smokeFile && !file.endsWith(".png") && !file.endsWith(".jpg"),
    )
    .map((file) => {
      try {
        return textByFile.get(file) ?? "";
      } catch {
        return "";
      }
    })
    .join("\n");

  const forbiddenPositivePatterns = [
    /createServerAction|use server/,
    /openai\.(chat|responses|beta)|new OpenAI/,
    /@octokit|createPullRequest|GitHubApp|request\(\s*["']POST \/repos/i,
    /recoverDeltaBatchForRun\s*\(/,
    /runAutonomy|tickAutonomy|scheduleAutonomy/i,
    /localStorage\.setItem|sessionStorage\.setItem/,
  ];
  for (const pattern of forbiddenPositivePatterns) {
    assert(!pattern.test(changedText), `Unexpected authority pattern: ${pattern}`);
  }
}

function assertDeltaBatchIdentityStillDocumented() {
  for (const text of [shrinkPlanText, browserRegressionDocText]) {
    assertContainsAll(text, [
      "delta_projection",
      "perspective_delta",
      "projected_delta_batch",
      "delta_batch",
      "runner_delta_batch",
    ]);
  }
}

function observedChangedFiles() {
  const workingTree = collectGitDiffFiles(["diff", "--name-only", "HEAD"]);
  const baseRange = getBaseRangeChangedFiles();
  const untracked = collectUntrackedFiles();
  return uniqueSorted([...workingTree.files, ...baseRange.files, ...untracked]);
}
