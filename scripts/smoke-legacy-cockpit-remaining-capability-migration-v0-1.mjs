#!/usr/bin/env node
import assert from "node:assert/strict";
import {
  assertContainsAll,
  assertPackageScript,
  collectGitDiffFiles,
  collectUntrackedFiles,
  loadTextByFile,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const migrationDoc =
  "docs/LEGACY_COCKPIT_REMAINING_CAPABILITY_MIGRATION_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const shrinkDoc = "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_V0_1.md";
const packageJsonFile = "package.json";
const smokeFile =
  "scripts/smoke-legacy-cockpit-remaining-capability-migration-v0-1.mjs";
const shrinkSmokeFile =
  "scripts/smoke-agent-workplane-legacy-cockpit-shrink-v0-1.mjs";
const runtimeSmokeFile =
  "scripts/smoke-agent-workplane-legacy-cockpit-runtime-check-v0-1.mjs";
const routeRemovalDoc = "docs/COCKPIT_ROUTE_REMOVAL_V0_1.md";

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

const followOnCockpitManualControlsMigrationFiles = [
  "types/cockpit-manual-controls-migration.ts",
  "lib/workplane/cockpit-manual-controls-migration.ts",
  "types/workplane-state-proposal-review.ts",
  "lib/workplane/workplane-state-proposal-review.ts",
  "components/workplane/state-proposal-review-panel.tsx",
  "docs/COCKPIT_MANUAL_CONTROLS_MIGRATION_V0_1.md",
  "docs/WORKPLANE_STATE_PROPOSAL_REVIEW_V0_1.md",
  "docs/LEGACY_COCKPIT_REMAINING_CAPABILITY_MIGRATION_V0_1.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_V0_1.md",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
  "scripts/smoke-cockpit-manual-controls-migration-v0-1.mjs",
  "scripts/smoke-workplane-state-proposal-review-v0-1.mjs",
  "scripts/smoke-legacy-cockpit-remaining-capability-migration-v0-1.mjs",
  "scripts/smoke-agent-workplane-legacy-cockpit-shrink-v0-1.mjs",
  "scripts/smoke-blank-state-review-entry-absorption-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
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
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/AGENT_WORKPLANE_COCKPIT_CAPABILITY_INVENTORY_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_ABSORPTION_MAP_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_REPLACEMENT_BROWSER_REGRESSION_V0_1.md",
  "docs/AGENT_WORKPLANE_NODE_CONTRACT_V0_1.md",
  "scripts/smoke-cockpit-route-removal-v0-1.mjs",
  "scripts/run-cockpit-route-removal-runtime-check-v0-1.mjs",
  "scripts/smoke-cockpit-route-removal-readiness-v0-1.mjs",
  "scripts/smoke-cockpit-manual-controls-migration-v0-1.mjs",
  "scripts/smoke-workplane-state-proposal-review-v0-1.mjs",
  "scripts/smoke-agent-workplane-cockpit-inheritance-v0-1.mjs",
  "scripts/smoke-agent-workplane-shell-v0-1.mjs",
  "scripts/smoke-workplane-native-browser-regression-v0-1.mjs",
  "lib/workplane/legacy-cockpit-control-inventory.ts",
  "scripts/run-agent-workplane-legacy-cockpit-runtime-check-v0-1.mjs",
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

const allowedChangedFiles = [
  migrationDoc,
  smokeFile,
  packageJsonFile,
  indexDoc,
  shrinkDoc,
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_ABSORPTION_MAP_V0_1.md",
  "docs/AGENT_WORKPLANE_COCKPIT_CAPABILITY_INVENTORY_V0_1.md",
  shrinkSmokeFile,
  runtimeSmokeFile,
  ...followOnWorkplaneStateProposalReviewFiles,
  ...followOnCockpitManualControlsMigrationFiles,
  ...followOnCockpitRouteRemovalReadinessFiles,
  ...followOnCockpitRouteRemovalFiles,
];

const destinationValues = [
  "blank_state",
  "workplane",
  "workplane_state_proposal_review",
  "dedicated_review_or_edit_surface",
  "delete",
  "blocked_until_authority_contract",
  "retained_temporarily_in_cockpit",
];

const migrationStatusValues = [
  "ready_for_blank_state",
  "ready_for_workplane",
  "ready_for_state_proposal_review",
  "needs_dedicated_surface",
  "blocked_until_authority_contract",
  "obsolete_delete",
  "retained_temporarily",
];

const riskLevelValues = ["low", "medium", "high"];

const minimumCapabilityIds = [
  "continue_current_work_entry",
  "review_pending_proposals_entry",
  "choose_perspective_lens_entry",
  "prepare_codex_handoff_entry",
  "review_runner_deltabatch_entry",
  "automation_mode_entry",
  "user_judgment_summary_entry",
  "work_brief_detail",
  "work_queue_detail",
  "current_perspective_detail",
  "delta_projection_detail",
  "projected_delta_batch_detail",
  "recovered_runner_deltabatch_detail",
  "run_postmortem_detail",
  "source_ref_bridge_detail",
  "trace_diagnostics_detail",
  "validation_smoke_detail",
  "handoff_builder_detail",
  "guidebrief_debug_context_detail",
  "intent_projection_detail",
  "review_queue_detail",
  "field_level_proposal_diff",
  "before_after_state_preview",
  "proposal_impact_analysis",
  "memory_proposal_review",
  "perspective_lens_detail_edit",
  "local_draft_review",
  "manual_preview_editor",
  "manual_gravity_preview",
  "formation_basis_preview",
  "proposal_status_history",
  "needs_user_judgment_lane",
  "stale_fallback_warning_review",
  "authority_boundary_review",
  "local_write_manual_controls",
  "local_storage_draft_controls",
  "proposal_commit_reject_controls",
  "durable_memory_apply_controls",
  "perspective_apply_controls",
  "six_tab_cockpit_shell",
  "legacy_cockpit_tab_navigation",
  "duplicate_work_brief_cards",
  "duplicate_perspective_summary_cards",
  "duplicate_bridge_summary_copy",
  "duplicate_operator_visibility_copy",
  "obsolete_external_execution_controls",
  "compatibility_island_explainer_copy",
];

const researchCriticalPhrases = [
  "field-level proposal diff",
  "before/after state preview",
  "manual preview editor",
  "Perspective lens detail",
  "memory proposal review",
  "local draft review",
  "source refs",
  "impact analysis",
  "stale/fallback warnings",
  "needs-user-judgment lane",
  "authority boundary",
  "proposal status history",
];

const textByFile = loadTextByFile([
  migrationDoc,
  indexDoc,
  shrinkDoc,
  packageJsonFile,
  smokeFile,
]);

const migrationText = textByFile.get(migrationDoc);
const indexText = textByFile.get(indexDoc);
const shrinkText = textByFile.get(shrinkDoc);
const packageJsonText = textByFile.get(packageJsonFile);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:legacy-cockpit-remaining-capability-migration-v0-1",
  expectedCommand:
    "node scripts/smoke-legacy-cockpit-remaining-capability-migration-v0-1.mjs",
});

assertContainsAll(indexText, [migrationDoc], { label: indexDoc });
assertContainsAll(shrinkText, [migrationDoc], { label: shrinkDoc });

assertContainsAll(
  migrationText,
  [
    ...destinationValues.map((value) => `\`${value}\``),
    ...migrationStatusValues.map((value) => `\`${value}\``),
    ...riskLevelValues.map((value) => `\`${value}\``),
    "PR 2: Blank State Review Entry Absorption v0.1",
    "PR 3: Workplane State Proposal Review v0.1",
    "PR 4: Cockpit Manual Controls Migration v0.1",
    "PR 5: Cockpit Route Removal v0.1",
    "PR 4 implementation update",
    "docs/COCKPIT_MANUAL_CONTROLS_MIGRATION_V0_1.md",
    "## Completion Criteria",
    "At the time of this map, `/cockpit` was temporary retained compatibility, not a",
    "Cockpit unique useful capability count must reach 0 before route removal.",
    "docs/COCKPIT_ROUTE_REMOVAL_READINESS_V0_1.md",
    routeRemovalDoc,
    "`unique_useful_cockpit_capability_count: 0`",
    "`zero_count_verified: true`",
    "route removal completed",
    "local-write/apply/commit/reject controls are blocked until a separate authority contract.",
    "local-write/apply controls are not migrated without authority contract.",
    "This original migration-map PR did not",
    ...researchCriticalPhrases,
  ],
  { label: migrationDoc },
);

const rowsByCapabilityId = parseCapabilityRows(migrationText);
for (const capabilityId of minimumCapabilityIds) {
  const row = rowsByCapabilityId.get(capabilityId);
  assert(row, `${migrationDoc} must include capability row: ${capabilityId}`);
  assert(
    destinationValues.includes(row.destination),
    `${capabilityId} must include an allowed destination`,
  );
  assert(
    migrationStatusValues.includes(row.migrationStatus),
    `${capabilityId} must include an allowed migration_status`,
  );
  assert(
    riskLevelValues.includes(row.riskLevel),
    `${capabilityId} must include an allowed risk_level`,
  );
}

assertDestinationDecisions(rowsByCapabilityId);

const changedFilesBoundary = assertChangedFilesBoundary();
assertNoProductUiOrAuthorityPaths(changedFilesBoundary.files);

console.log(
  JSON.stringify(
    {
      smoke: "legacy-cockpit-remaining-capability-migration-v0-1",
      pass: true,
      migration_doc_checked: true,
      package_script_checked: true,
      docs_pointers_checked: true,
      destination_values_checked: destinationValues,
      migration_status_values_checked: migrationStatusValues,
      risk_level_values_checked: riskLevelValues,
      minimum_capability_count_checked: minimumCapabilityIds.length,
      destination_counts: countByDestination(rowsByCapabilityId),
      changed_files_boundary: changedFilesBoundary,
      route_removal_follow_on_checked: true,
      no_authority_paths_changed_checked: true,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:legacy-cockpit-remaining-capability-migration-v0-1");

function parseCapabilityRows(text) {
  const rows = new Map();
  const tableLines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("| `"));

  for (const line of tableLines) {
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => stripTicks(cell.trim()));
    if (!minimumCapabilityIds.includes(cells[0])) {
      continue;
    }
    assert.equal(
      cells.length,
      14,
      `Capability table rows must have 14 columns: ${line}`,
    );
    const [
      capabilityId,
      currentCockpitLocation,
      shortDescription,
      userValue,
      aiAgentValue,
      researchValue,
      riskLevel,
      destination,
      migrationStatus,
      deleteWhen,
      requiredNativeSurface,
      requiredValidation,
      authorityNotes,
      nextPrTarget,
    ] = cells;
    assert(!rows.has(capabilityId), `Duplicate capability row: ${capabilityId}`);
    rows.set(capabilityId, {
      capabilityId,
      currentCockpitLocation,
      shortDescription,
      userValue,
      aiAgentValue,
      researchValue,
      riskLevel,
      destination,
      migrationStatus,
      deleteWhen,
      requiredNativeSurface,
      requiredValidation,
      authorityNotes,
      nextPrTarget,
    });
  }

  return rows;
}

function stripTicks(value) {
  return value.replace(/^`|`$/g, "");
}

function assertDestinationDecisions(rows) {
  for (const id of [
    "continue_current_work_entry",
    "review_pending_proposals_entry",
    "choose_perspective_lens_entry",
    "prepare_codex_handoff_entry",
    "review_runner_deltabatch_entry",
    "automation_mode_entry",
    "user_judgment_summary_entry",
  ]) {
    assert.equal(rows.get(id)?.destination, "blank_state", `${id} must target Blank State`);
  }

  for (const id of [
    "work_brief_detail",
    "work_queue_detail",
    "current_perspective_detail",
    "delta_projection_detail",
    "projected_delta_batch_detail",
    "recovered_runner_deltabatch_detail",
    "run_postmortem_detail",
    "source_ref_bridge_detail",
    "trace_diagnostics_detail",
    "validation_smoke_detail",
    "handoff_builder_detail",
    "guidebrief_debug_context_detail",
    "intent_projection_detail",
    "review_queue_detail",
  ]) {
    assert.equal(rows.get(id)?.destination, "workplane", `${id} must target Workplane`);
  }

  for (const id of [
    "field_level_proposal_diff",
    "before_after_state_preview",
    "proposal_impact_analysis",
    "memory_proposal_review",
    "perspective_lens_detail_edit",
    "local_draft_review",
    "manual_preview_editor",
    "manual_gravity_preview",
    "formation_basis_preview",
    "proposal_status_history",
    "needs_user_judgment_lane",
    "stale_fallback_warning_review",
    "authority_boundary_review",
  ]) {
    assert.equal(
      rows.get(id)?.destination,
      "workplane_state_proposal_review",
      `${id} must target Workplane State Proposal Review`,
    );
  }

  for (const id of [
    "local_write_manual_controls",
    "local_storage_draft_controls",
    "proposal_commit_reject_controls",
    "durable_memory_apply_controls",
    "perspective_apply_controls",
  ]) {
    assert.equal(
      rows.get(id)?.destination,
      "blocked_until_authority_contract",
      `${id} must remain blocked until authority contract`,
    );
  }

  for (const id of [
    "six_tab_cockpit_shell",
    "legacy_cockpit_tab_navigation",
    "duplicate_work_brief_cards",
    "duplicate_perspective_summary_cards",
    "duplicate_bridge_summary_copy",
    "duplicate_operator_visibility_copy",
    "obsolete_external_execution_controls",
    "compatibility_island_explainer_copy",
  ]) {
    assert.equal(rows.get(id)?.destination, "delete", `${id} must be deleted`);
  }
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
  const allowed = new Set(allowedChangedFiles);

  for (const file of files) {
    assert(
      allowed.has(file),
      `Unexpected changed file for remaining capability migration map: ${file}`,
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

function assertNoProductUiOrAuthorityPaths(files) {
  const allowedFollowOnFiles = new Set([
    ...followOnWorkplaneStateProposalReviewFiles,
    ...followOnCockpitManualControlsMigrationFiles,
    ...followOnCockpitRouteRemovalReadinessFiles,
    ...followOnCockpitRouteRemovalFiles,
  ]);
  const forbiddenPathPatterns = [
    /^app\//,
    /^components\//,
    /^app\/.*\/page\.(tsx|ts|jsx|js)$/,
    /^app\/.*\/route\.(tsx|ts|jsx|js)$/,
    /^db\//,
    /^migrations\//,
    /(^|\/)(proof|evidence|memory|persistence)(\/|$)/i,
    /(^|\/)(perspective|delta-apply|delta_apply)(\/|$)/i,
    /(^|\/)(provider|providers|openai|github|codex|runner|scheduler)(\/|$)/i,
  ];

  for (const file of files) {
    if (allowedFollowOnFiles.has(file)) {
      continue;
    }
    for (const pattern of forbiddenPathPatterns) {
      assert(
        !pattern.test(file),
        `Forbidden product UI, route, component, or authority path changed: ${file}`,
      );
    }
  }
}

function countByDestination(rows) {
  const counts = Object.fromEntries(
    destinationValues.map((destination) => [destination, 0]),
  );
  for (const row of rows.values()) {
    counts[row.destination] += 1;
  }
  return counts;
}
