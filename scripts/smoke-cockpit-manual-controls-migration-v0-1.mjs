#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import {
  assertContainsAll,
  assertPackageScript,
  collectGitDiffFiles,
  collectUntrackedFiles,
  loadTextByFile,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const typeFile = "types/cockpit-manual-controls-migration.ts";
const helperFile = "lib/workplane/cockpit-manual-controls-migration.ts";
const stateProposalTypeFile = "types/workplane-state-proposal-review.ts";
const stateProposalHelperFile =
  "lib/workplane/workplane-state-proposal-review.ts";
const panelFile = "components/workplane/state-proposal-review-panel.tsx";
const docFile = "docs/COCKPIT_MANUAL_CONTROLS_MIGRATION_V0_1.md";
const stateProposalDoc = "docs/WORKPLANE_STATE_PROPOSAL_REVIEW_V0_1.md";
const migrationDoc =
  "docs/LEGACY_COCKPIT_REMAINING_CAPABILITY_MIGRATION_V0_1.md";
const shrinkDoc = "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_V0_1.md";
const agentWorkplaneDoc = "docs/AGENT_WORKPLANE_V0_1.md";
const routeRemovalDoc = "docs/COCKPIT_ROUTE_REMOVAL_V0_1.md";
const cleanupDoc = "docs/COCKPIT_POST_REMOVAL_CLEANUP_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const smokeFile = "scripts/smoke-cockpit-manual-controls-migration-v0-1.mjs";
const stateProposalSmokeFile =
  "scripts/smoke-workplane-state-proposal-review-v0-1.mjs";
const migrationSmokeFile =
  "scripts/smoke-legacy-cockpit-remaining-capability-migration-v0-1.mjs";
const shrinkSmokeFile =
  "scripts/smoke-agent-workplane-legacy-cockpit-shrink-v0-1.mjs";
const blankStateSmokeFile =
  "scripts/smoke-blank-state-review-entry-absorption-v0-1.mjs";
const panelsSmokeFile = "scripts/smoke-agent-workplane-panels-v0-1.mjs";
const augnesCockpitFile = "components/augnes-cockpit.tsx";
const cockpitPageFile = "app/cockpit/page.tsx";

const requiredMigratedRecords = [
  "manual_preview_editor",
  "manual_gravity_preview",
  "formation_basis_preview",
  "local_draft_review_visibility",
  "copy_export_review_packet",
  "manual_source_ref_review",
  "proposal_preview_gap_review",
];

const requiredBlockedRecords = [
  "local_write_manual_controls",
  "local_storage_draft_controls",
  "proposal_commit_reject_controls",
  "durable_memory_apply_controls",
  "perspective_apply_controls",
];

const requiredObsoleteRecords = [
  "obsolete_external_execution_controls",
  "duplicate_cockpit_manual_explainer_copy",
  "legacy_cockpit_manual_tab_shell_copy",
];

const requiredMigrationStatuses = [
  "migrated_native_review",
  "retained_blocked",
  "obsolete_delete",
  "retained_temporarily",
  "needs_authority_contract",
];

const requiredDestinations = [
  "workplane_state_proposal_review",
  "blocked_until_authority_contract",
  "delete",
  "retained_temporarily_in_cockpit",
];

const requiredControlClasses = [
  "preview_only",
  "copy_only",
  "read_only",
  "local_draft_review",
  "local_write",
  "apply_control",
  "commit_reject_control",
  "external_execution_forbidden",
  "obsolete",
];

const requiredAuthorityClasses = [
  "no_authority",
  "copy_authority",
  "preview_authority",
  "review_only_authority",
  "local_write_authority_blocked",
  "durable_apply_authority_blocked",
  "external_execution_forbidden",
];

const requiredAuthorityFields = [
  "can_write_product_db",
  "can_create_evidence",
  "can_record_proof",
  "can_apply_memory",
  "can_apply_perspective",
  "can_auto_apply_delta",
  "can_commit_proposal",
  "can_reject_proposal",
  "can_approve_proposal",
  "can_write_local_storage",
  "can_use_session_storage",
  "can_call_provider_openai",
  "can_call_github",
  "can_actuate_github",
  "can_execute_codex",
  "can_execute_runner",
  "can_tick_runner",
  "can_recover_delta_batch",
  "can_schedule_runner",
  "can_merge_publish_retry_replay_deploy",
  "can_delete_cockpit_route",
  "can_delete_augnes_cockpit_component",
];

const followOnWorkplaneStateProposalReviewFiles = [
  "types/workplane-state-proposal-review.ts",
  "lib/workplane/workplane-state-proposal-review.ts",
  "components/workplane/state-proposal-review-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "types/agent-workplane-node.ts",
  "lib/workplane/workplane-node-context.ts",
  "docs/WORKPLANE_STATE_PROPOSAL_REVIEW_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "docs/LEGACY_COCKPIT_REMAINING_CAPABILITY_MIGRATION_V0_1.md",
  "docs/BLANK_STATE_REVIEW_ENTRY_ABSORPTION_V0_1.md",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_V0_1.md",
  "docs/AGENT_WORKPLANE_NODE_CONTRACT_V0_1.md",
  "package.json",
  "scripts/smoke-workplane-state-proposal-review-v0-1.mjs",
  "scripts/smoke-agent-workplane-node-contract-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-agent-workplane-review-memory-detail-v0-1.mjs",
  "scripts/smoke-blank-state-review-entry-absorption-v0-1.mjs",
  "scripts/smoke-legacy-cockpit-remaining-capability-migration-v0-1.mjs",
  "scripts/smoke-agent-workplane-legacy-cockpit-shrink-v0-1.mjs",
];

const followOnCockpitRouteRemovalReadinessFiles = [
  "types/cockpit-route-removal-readiness.ts",
  "lib/workplane/cockpit-route-removal-readiness.ts",
  "docs/COCKPIT_ROUTE_REMOVAL_READINESS_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "docs/LEGACY_COCKPIT_REMAINING_CAPABILITY_MIGRATION_V0_1.md",
  "docs/COCKPIT_MANUAL_CONTROLS_MIGRATION_V0_1.md",
  "docs/WORKPLANE_STATE_PROPOSAL_REVIEW_V0_1.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_V0_1.md",
  "package.json",
  "scripts/smoke-cockpit-route-removal-readiness-v0-1.mjs",
  "scripts/smoke-cockpit-manual-controls-migration-v0-1.mjs",
  "scripts/smoke-workplane-state-proposal-review-v0-1.mjs",
  "scripts/smoke-legacy-cockpit-remaining-capability-migration-v0-1.mjs",
  "scripts/smoke-agent-workplane-legacy-cockpit-shrink-v0-1.mjs",
  "scripts/smoke-blank-state-review-entry-absorption-v0-1.mjs",
];

const followOnCockpitRouteRemovalFiles = [
  routeRemovalDoc,
  cleanupDoc,
  "app/cockpit/page.tsx",
  "components/augnes-cockpit.tsx",
  "components/workplane/legacy-cockpit-compatibility-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "types/agent-workplane-node.ts",
  "lib/workplane/workplane-node-context.ts",
  "types/workplane-browser-regression.ts",
  "lib/workplane/workplane-browser-regression.ts",
  "types/workplane-bridge-trace-detail.ts",
  "lib/workplane/workplane-bridge-trace-detail.ts",
  "lib/workplane/workplane-run-postmortem-detail.ts",
  "lib/workplane/workplane-review-memory-detail.ts",
  "lib/metrics/runner-workplane-metrics.ts",
  "lib/guide/workplane-intent-projection.ts",
  "docs/AGENT_WORKPLANE_COCKPIT_CAPABILITY_INVENTORY_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_ABSORPTION_MAP_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_REPLACEMENT_BROWSER_REGRESSION_V0_1.md",
  "docs/AGENT_WORKPLANE_NODE_CONTRACT_V0_1.md",
  "scripts/smoke-cockpit-route-removal-v0-1.mjs",
  "scripts/smoke-cockpit-post-removal-cleanup-v0-1.mjs",
  "scripts/run-cockpit-route-removal-runtime-check-v0-1.mjs",
  "scripts/smoke-agent-workplane-cockpit-inheritance-v0-1.mjs",
  "scripts/smoke-agent-workplane-shell-v0-1.mjs",
  "scripts/smoke-workplane-native-browser-regression-v0-1.mjs",
  "lib/workplane/legacy-cockpit-control-inventory.ts",
  "scripts/run-agent-workplane-legacy-cockpit-runtime-check-v0-1.mjs",
  "scripts/smoke-agent-workplane-legacy-cockpit-runtime-check-v0-1.mjs",
  "scripts/smoke-agent-workplane-legacy-cockpit-shrink-plan-v0-1.mjs",
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
  "scripts/smoke-agent-workplane-bridge-trace-detail-v0-1.mjs",
  "scripts/smoke-agent-workplane-review-memory-detail-v0-1.mjs",
  "scripts/smoke-agent-workplane-run-postmortem-detail-v0-1.mjs",
  "scripts/smoke-augnes-dogfood-metrics-baseline-v0-2.mjs",
  "scripts/smoke-legacy-cockpit-local-control-classification-v0-1.mjs",
  "scripts/smoke-legacy-cockpit-control-inventory-v0-1.mjs",
  "scripts/smoke-web-guide-panel-v0-1.mjs",
];

const expectedChangedFiles = [
  typeFile,
  helperFile,
  stateProposalTypeFile,
  stateProposalHelperFile,
  panelFile,
  docFile,
  stateProposalDoc,
  migrationDoc,
  shrinkDoc,
  agentWorkplaneDoc,
  indexDoc,
  packageJsonFile,
  smokeFile,
  stateProposalSmokeFile,
  migrationSmokeFile,
  blankStateSmokeFile,
  panelsSmokeFile,
  ...followOnWorkplaneStateProposalReviewFiles,
  ...followOnCockpitRouteRemovalReadinessFiles,
  ...followOnCockpitRouteRemovalFiles,
];

const textByFile = loadTextByFile([
  typeFile,
  helperFile,
  stateProposalTypeFile,
  stateProposalHelperFile,
  panelFile,
  docFile,
  stateProposalDoc,
  migrationDoc,
  shrinkDoc,
  agentWorkplaneDoc,
  indexDoc,
  packageJsonFile,
  stateProposalSmokeFile,
  migrationSmokeFile,
  blankStateSmokeFile,
  panelsSmokeFile,
  routeRemovalDoc,
]);

const typeText = textByFile.get(typeFile);
const helperText = textByFile.get(helperFile);
const stateProposalTypeText = textByFile.get(stateProposalTypeFile);
const stateProposalHelperText = textByFile.get(stateProposalHelperFile);
const panelText = textByFile.get(panelFile);
const docText = textByFile.get(docFile);
const stateProposalDocText = textByFile.get(stateProposalDoc);
const migrationDocText = textByFile.get(migrationDoc);
const shrinkDocText = textByFile.get(shrinkDoc);
const agentWorkplaneDocText = textByFile.get(agentWorkplaneDoc);
const indexText = textByFile.get(indexDoc);
const packageJsonText = textByFile.get(packageJsonFile);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:cockpit-manual-controls-migration-v0-1",
  expectedCommand:
    "node scripts/smoke-cockpit-manual-controls-migration-v0-1.mjs",
});

assertRouteRemovalFilesAbsent();
assertStaticContracts();
const behavior = assertHelperBehavior();
const changedFiles = assertChangedFilesBoundary();
assertNoForbiddenPaths(changedFiles.files);
assertNoMutationOrAuthorityText();

console.log(
  JSON.stringify(
    {
      smoke: "cockpit-manual-controls-migration-v0-1",
      pass: true,
      doc_exists: true,
      type_exists: true,
      helper_exists: true,
      package_script_checked: true,
      migrated_records_checked: requiredMigratedRecords,
      blocked_records_checked: requiredBlockedRecords,
      obsolete_records_checked: requiredObsoleteRecords,
      authority_fields_false_checked: requiredAuthorityFields,
      helper_behavior: behavior,
      changed_files_boundary: changedFiles,
      no_mutation_or_authority_paths_checked: true,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:cockpit-manual-controls-migration-v0-1");

function assertStaticContracts() {
  assertContainsAll(
    typeText,
    [
      "COCKPIT_MANUAL_CONTROLS_MIGRATION_VERSION",
      "CockpitManualControlMigrationStatus",
      "CockpitManualControlMigrationDestination",
      "CockpitManualControlMigrationControlClass",
      "CockpitManualControlMigrationAuthorityClass",
      "CockpitManualControlMigrationRecord",
      "CockpitManualControlMigrationRead",
      "CockpitManualControlMigrationAuthorityBoundary",
      ...requiredMigrationStatuses,
      ...requiredDestinations,
      ...requiredControlClasses,
      ...requiredAuthorityClasses,
      ...requiredAuthorityFields,
    ],
    { label: typeFile },
  );

  for (const field of requiredAuthorityFields) {
    assert(
      typeText.includes(`${field}: false;`),
      `${typeFile} must type ${field} as false`,
    );
    assert(
      helperText.includes(`${field}: false,`),
      `${helperFile} must set ${field}: false`,
    );
  }

  assertContainsAll(
    helperText,
    [
      "buildCockpitManualControlsMigrationRead",
      "COCKPIT_MANUAL_CONTROLS_MIGRATION_REQUIRED_RECORDS",
      "COCKPIT_MANUAL_CONTROLS_BLOCKED_RECORDS",
      "COCKPIT_MANUAL_CONTROLS_MIGRATED_RECORDS",
      "COCKPIT_MANUAL_CONTROLS_OBSOLETE_RECORDS",
      ...requiredMigratedRecords,
      ...requiredBlockedRecords,
      ...requiredObsoleteRecords,
      "static_migration_evidence",
      "separate authority contract",
    ],
    { label: helperFile },
  );

  assertContainsAll(
    stateProposalTypeText,
    [
      "manual_control_migration_review",
      "manual_control_migration",
      "blocked_local_write_control",
      "obsolete_cockpit_control",
      "copy_export_review",
      "manual_control_migration_summary",
      "migrated_manual_control_reviews",
      "blocked_manual_control_reviews",
      "obsolete_manual_control_reviews",
      "manual_control_migration_record",
    ],
    { label: stateProposalTypeFile },
  );

  assertContainsAll(
    stateProposalHelperText,
    [
      "buildCockpitManualControlsMigrationRead",
      "manualControlMigrationItems",
      "manual_control_migration_review",
      "migrated_manual_control_reviews",
      "blocked_manual_control_reviews",
      "obsolete_manual_control_reviews",
      "smoke:cockpit-manual-controls-migration-v0-1",
    ],
    { label: stateProposalHelperFile },
  );

  assertContainsAll(
    panelText,
    [
      'data-cockpit-manual-controls-migration="v0.1"',
      "data-cockpit-manual-control-id={manualControlRecord?.control_id}",
      "data-cockpit-manual-control-migration-status={",
      "data-cockpit-manual-control-destination={manualControlRecord?.destination}",
      "data-cockpit-manual-control-authority-class={",
      "Safe manual preview/copy controls are now reviewable in Workplane State Proposal Review.",
      "Local-write/apply/commit/reject controls remain blocked until a separate authority contract.",
      "Obsolete external execution and duplicate Cockpit shell controls are delete candidates, not migration targets.",
    ],
    { label: panelFile },
  );

  assertContainsAll(indexText, [docFile], { label: indexDoc });
  assertContainsAll(stateProposalDocText, [docFile], {
    label: stateProposalDoc,
  });
  assertContainsAll(
    migrationDocText,
    [
      "PR 4 implementation update",
      "Cockpit Manual Controls Migration v0.1",
      "Safe manual preview/copy controls",
      "blocked until a separate authority contract",
      docFile,
    ],
    { label: migrationDoc },
  );
  assertContainsAll(
    docText,
    [
      "Status And Scope",
      "Why This Follows PR #940",
      "Safe Migrated Controls",
      "Blocked Controls",
      "Obsolete/Delete Controls",
      "Integration With Workplane State Proposal Review",
      "Source And Static Migration Evidence Behavior",
      "Authority Boundary",
      "Route Removal Follow-Up",
      "Route Removal",
      ...requiredMigratedRecords,
      ...requiredBlockedRecords,
      ...requiredObsoleteRecords,
      ...requiredAuthorityFields,
    ],
    { label: docFile },
  );
  assertContainsAll(shrinkDocText, [docFile, "manual preview/copy controls"], {
    label: shrinkDoc,
  });
  assertContainsAll(agentWorkplaneDocText, [docFile], {
    label: agentWorkplaneDoc,
  });
  assertContainsAll(textByFile.get(routeRemovalDoc), [docFile], {
    label: routeRemovalDoc,
  });
}

function assertRouteRemovalFilesAbsent() {
  assert(!existsSync(augnesCockpitFile), `${augnesCockpitFile} must be removed`);
  assert(!existsSync(cockpitPageFile), `${cockpitPageFile} must be removed`);
}

function assertHelperBehavior() {
  const code = `
    import assert from "node:assert/strict";
    import { buildCockpitManualControlsMigrationRead } from "./lib/workplane/cockpit-manual-controls-migration.ts";
    import { readWorkplaneContext } from "./lib/workplane/read-workplane-context.ts";
    import { buildAgentWorkplaneNodeContextRead } from "./lib/workplane/workplane-node-context.ts";
    import { buildWorkplaneReviewMemoryDetailRead } from "./lib/workplane/workplane-review-memory-detail.ts";
    import { buildWorkplaneStateProposalReviewRead } from "./lib/workplane/workplane-state-proposal-review.ts";
    import { COCKPIT_MANUAL_CONTROLS_MIGRATION_VERSION } from "./types/cockpit-manual-controls-migration.ts";

    const requiredAuthorityFields = ${JSON.stringify(requiredAuthorityFields)};
    const requiredMigratedRecords = ${JSON.stringify(requiredMigratedRecords)};
    const requiredBlockedRecords = ${JSON.stringify(requiredBlockedRecords)};
    const requiredObsoleteRecords = ${JSON.stringify(requiredObsoleteRecords)};
    const migrationRead = buildCockpitManualControlsMigrationRead();

    assert.equal(migrationRead.migration_version, COCKPIT_MANUAL_CONTROLS_MIGRATION_VERSION);
    assert(migrationRead.migrated_records.length >= 7);
    assert(migrationRead.blocked_records.length >= 5);
    assert(migrationRead.obsolete_records.length >= 3);
    for (const field of requiredAuthorityFields) {
      assert.equal(migrationRead.authority_boundary[field], false, field);
    }
    for (const id of requiredMigratedRecords) {
      assert(migrationRead.migrated_records.some((record) => record.control_id === id), id);
    }
    for (const id of requiredBlockedRecords) {
      assert(migrationRead.blocked_records.some((record) => record.control_id === id), id);
    }
    for (const id of requiredObsoleteRecords) {
      assert(migrationRead.obsolete_records.some((record) => record.control_id === id), id);
    }
    assert(!migrationRead.blocked_records.some((record) => record.migration_status === "migrated_native_review"));
    assert(!migrationRead.migrated_records.some((record) => ["local_write_authority_blocked", "durable_apply_authority_blocked"].includes(record.authority_class)));
    assert(!migrationRead.obsolete_records.some((record) => record.destination === "workplane_state_proposal_review"));

    const context = await readWorkplaneContext();
    const nodeContext = buildAgentWorkplaneNodeContextRead(context);
    const reviewMemoryDetail = buildWorkplaneReviewMemoryDetailRead({
      workplane_context: context,
      node_context_read: nodeContext
    });
    const stateReview = buildWorkplaneStateProposalReviewRead({
      workplane_context: context,
      node_context_read: nodeContext,
      review_memory_detail: reviewMemoryDetail
    });
    assert(stateReview.manual_control_migration_summary);
    assert(stateReview.proposal_groups.some((group) => group.group_id === "manual_control_migration_review"));
    assert(stateReview.migrated_manual_control_reviews.length >= 7);
    assert(stateReview.blocked_manual_control_reviews.length >= 5);
    assert(stateReview.obsolete_manual_control_reviews.length >= 3);

    console.log(JSON.stringify({
      migration_version: migrationRead.migration_version,
      migrated_count: migrationRead.migrated_records.length,
      blocked_count: migrationRead.blocked_records.length,
      obsolete_count: migrationRead.obsolete_records.length,
      state_review_group_count: stateReview.proposal_groups.length,
      state_review_manual_count: stateReview.manual_control_migration_summary.total_record_count,
      authority_false_count: requiredAuthorityFields.filter((field) => migrationRead.authority_boundary[field] === false).length
    }));
  `;

  const output = execFileSync("node", ["--import", "tsx", "--eval", code], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: {
      ...process.env,
      AUGNES_DB_PATH: "/tmp/augnes-cockpit-manual-controls-smoke-empty.db",
    },
  });
  return JSON.parse(output);
}

function assertChangedFilesBoundary() {
  const workingTree = collectGitDiffFiles(["diff", "--name-only", "HEAD"]);
  const staged = collectGitDiffFiles(["diff", "--cached", "--name-only"]);
  const baseRange = collectGitDiffFiles([
    "diff",
    "--name-only",
    "origin/main...HEAD",
  ]);
  const untracked = collectUntrackedFiles();
  const files = uniqueSorted([
    ...workingTree.files,
    ...staged.files,
    ...baseRange.files,
    ...untracked,
  ]);
  const allowed = new Set(expectedChangedFiles);

  for (const file of files) {
    assert(
      allowed.has(file),
      `Unexpected changed file for Cockpit Manual Controls Migration v0.1: ${file}`,
    );
  }

  return {
    files,
    working_tree_files: workingTree.files,
    staged_files: staged.files,
    base_range_files: baseRange.files,
    untracked_files: untracked,
  };
}

function assertNoForbiddenPaths(files) {
  const forbiddenPatterns = [
    /^app\/api\//,
    /^db\//,
    /^migrations\//,
    /(^|\/)(provider|providers|openai|github|codex|runner-execution|scheduler)(\/|$)/i,
    /(^|\/)(proof|evidence|persistence)(\/|$)/i,
    /(^|\/)(perspective\/state|delta-apply|delta_apply)(\/|$)/i,
  ];

  for (const file of files) {
    for (const pattern of forbiddenPatterns) {
      assert(!pattern.test(file), `Forbidden path changed: ${file}`);
    }
  }
}

function assertNoMutationOrAuthorityText() {
  assert(!/<form\b/i.test(panelText), "panel must render no form");
  assert(!/<input\b/i.test(panelText), "panel must render no input");
  assert(!/<textarea\b/i.test(panelText), "panel must render no textarea");
  assert(!/<button\b/i.test(panelText), "panel must render no button");
  assert(!/\bonClick\b/.test(panelText), "panel must not render onClick");
  assert(!/\bformAction\b/.test(panelText), "panel must not render formAction");
  assert(!/\buse server\b/.test(panelText), "panel must render no server action");

  const implementationText = [
    helperText,
    stateProposalHelperText,
    panelText,
  ].join("\n");
  const forbiddenPatterns = [
    /\bmethod:\s*["'](?:POST|PUT|PATCH|DELETE)["']/,
    /\bfetch\s*\([^)]*,\s*\{[\s\S]*\bmethod:\s*["'](?:POST|PUT|PATCH|DELETE)["']/,
    /\bappendFile\b|\bwriteFile\b|\bwriteFileSync\b/,
    /\binsert into\b|\bupdate\s+\w+\s+set\b|\bdelete\s+from\b/i,
    /api\.openai\.com|api\.github\.com|@octokit|OpenAI\(/,
    /\bexecuteCodex\s*\(/,
    /\btickAutonomyRun\s*\(|\brecoverDeltaBatchForRun\s*\(|\brunDueAutonomyRunsOnce\s*\(/,
    /\b(?:localStorage|sessionStorage)\.(?:setItem|removeItem|clear)\b/,
  ];

  for (const pattern of forbiddenPatterns) {
    assert(
      !pattern.test(implementationText),
      `Manual controls migration must not add mutation authority: ${pattern}`,
    );
  }
}
