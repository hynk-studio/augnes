#!/usr/bin/env node
import assert from "node:assert/strict";
import {
  buildCockpitRouteRemovalReadiness,
  COCKPIT_ROUTE_REMOVAL_CAPABILITY_RECORDS,
  COCKPIT_ROUTE_REMOVAL_REQUIRED_CAPABILITY_IDS,
} from "../lib/workplane/cockpit-route-removal-readiness.ts";
import {
  COCKPIT_ROUTE_REMOVAL_READINESS_VERSION,
  COCKPIT_ROUTE_REMOVAL_CAPABILITY_DISPOSITIONS,
  COCKPIT_ROUTE_REMOVAL_READINESS_STATUSES,
} from "../types/cockpit-route-removal-readiness.ts";
import {
  assertContainsAll,
  assertPackageScript,
  collectGitDiffFiles,
  collectUntrackedFiles,
  loadTextByFile,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const typeFile = "types/cockpit-route-removal-readiness.ts";
const helperFile = "lib/workplane/cockpit-route-removal-readiness.ts";
const docFile = "docs/COCKPIT_ROUTE_REMOVAL_READINESS_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const migrationDoc =
  "docs/LEGACY_COCKPIT_REMAINING_CAPABILITY_MIGRATION_V0_1.md";
const manualControlsDoc =
  "docs/COCKPIT_MANUAL_CONTROLS_MIGRATION_V0_1.md";
const stateProposalDoc = "docs/WORKPLANE_STATE_PROPOSAL_REVIEW_V0_1.md";
const shrinkDoc = "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_V0_1.md";
const packageJsonFile = "package.json";
const smokeFile = "scripts/smoke-cockpit-route-removal-readiness-v0-1.mjs";
const manualControlsSmokeFile =
  "scripts/smoke-cockpit-manual-controls-migration-v0-1.mjs";
const stateProposalSmokeFile =
  "scripts/smoke-workplane-state-proposal-review-v0-1.mjs";
const migrationSmokeFile =
  "scripts/smoke-legacy-cockpit-remaining-capability-migration-v0-1.mjs";
const shrinkSmokeFile =
  "scripts/smoke-agent-workplane-legacy-cockpit-shrink-v0-1.mjs";
const blankStateSmokeFile =
  "scripts/smoke-blank-state-review-entry-absorption-v0-1.mjs";

const requiredBlankStateCapabilityIds = [
  "continue_current_work_entry",
  "review_pending_proposals_entry",
  "choose_perspective_lens_entry",
  "prepare_codex_handoff_entry",
  "review_runner_deltabatch_entry",
  "automation_mode_entry",
  "user_judgment_summary_entry",
];

const requiredWorkplaneCapabilityIds = [
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
];

const requiredStateProposalReviewCapabilityIds = [
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
];

const requiredManualMigrationCapabilityIds = [
  "local_draft_review_visibility",
  "copy_export_review_packet",
  "manual_source_ref_review",
  "proposal_preview_gap_review",
];

const requiredBlockedCapabilityIds = [
  "local_write_manual_controls",
  "local_storage_draft_controls",
  "proposal_commit_reject_controls",
  "durable_memory_apply_controls",
  "perspective_apply_controls",
];

const requiredObsoleteCapabilityIds = [
  "six_tab_cockpit_shell",
  "legacy_cockpit_tab_navigation",
  "duplicate_work_brief_cards",
  "duplicate_perspective_summary_cards",
  "duplicate_bridge_summary_copy",
  "duplicate_operator_visibility_copy",
  "obsolete_external_execution_controls",
  "compatibility_island_explainer_copy",
  "duplicate_cockpit_manual_explainer_copy",
  "legacy_cockpit_manual_tab_shell_copy",
];

const requiredCapabilityIds = [
  ...requiredBlankStateCapabilityIds,
  ...requiredWorkplaneCapabilityIds,
  ...requiredStateProposalReviewCapabilityIds,
  ...requiredManualMigrationCapabilityIds,
  ...requiredBlockedCapabilityIds,
  ...requiredObsoleteCapabilityIds,
];

const requiredAuthorityFields = [
  "can_delete_cockpit_route",
  "can_delete_augnes_cockpit_component",
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
];

const expectedChangedFiles = [
  typeFile,
  helperFile,
  docFile,
  indexDoc,
  migrationDoc,
  manualControlsDoc,
  stateProposalDoc,
  shrinkDoc,
  packageJsonFile,
  smokeFile,
  manualControlsSmokeFile,
  stateProposalSmokeFile,
  migrationSmokeFile,
  shrinkSmokeFile,
  blankStateSmokeFile,
];

const textByFile = loadTextByFile([
  typeFile,
  helperFile,
  docFile,
  indexDoc,
  migrationDoc,
  manualControlsDoc,
  stateProposalDoc,
  shrinkDoc,
  packageJsonFile,
]);

const typeText = textByFile.get(typeFile);
const helperText = textByFile.get(helperFile);
const docText = textByFile.get(docFile);
const indexText = textByFile.get(indexDoc);
const migrationDocText = textByFile.get(migrationDoc);
const manualControlsDocText = textByFile.get(manualControlsDoc);
const stateProposalDocText = textByFile.get(stateProposalDoc);
const shrinkDocText = textByFile.get(shrinkDoc);
const packageJsonText = textByFile.get(packageJsonFile);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:cockpit-route-removal-readiness-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-cockpit-route-removal-readiness-v0-1.mjs",
});

assertStaticContracts();
const behavior = assertHelperBehavior();
const changedFiles = assertChangedFilesBoundary();
assertNoForbiddenPaths(changedFiles.files);
assertNoRouteOrComponentDeletion();
assertNoMutationOrAuthorityText();

console.log(
  JSON.stringify(
    {
      smoke: "cockpit-route-removal-readiness-v0-1",
      pass: true,
      doc_exists: true,
      type_exists: true,
      helper_exists: true,
      package_script_checked: true,
      required_capability_count_checked: requiredCapabilityIds.length,
      disposition_values_checked: [
        ...COCKPIT_ROUTE_REMOVAL_CAPABILITY_DISPOSITIONS,
      ],
      readiness_statuses_checked: [...COCKPIT_ROUTE_REMOVAL_READINESS_STATUSES],
      authority_fields_false_checked: requiredAuthorityFields,
      helper_behavior: behavior,
      changed_files_boundary: changedFiles,
      no_route_or_component_deletion_checked: true,
      no_authority_paths_changed_checked: true,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:cockpit-route-removal-readiness-v0-1");

function assertStaticContracts() {
  assertContainsAll(
    typeText,
    [
      "COCKPIT_ROUTE_REMOVAL_READINESS_VERSION",
      "CockpitRouteRemovalReadinessStatus",
      "CockpitRouteRemovalCapabilityDisposition",
      "CockpitRouteRemovalCapabilityRecord",
      "CockpitRouteRemovalReadinessRead",
      "CockpitRouteRemovalBlockingCondition",
      "CockpitRouteRemovalAuthorityBoundary",
      ...COCKPIT_ROUTE_REMOVAL_READINESS_STATUSES,
      ...COCKPIT_ROUTE_REMOVAL_CAPABILITY_DISPOSITIONS,
      ...requiredAuthorityFields,
      "unique_useful_cockpit_capability_count",
      "zero_count_verified",
      "route_removal_allowed: false",
      "component_removal_allowed: false",
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
      "buildCockpitRouteRemovalReadiness",
      "COCKPIT_ROUTE_REMOVAL_CAPABILITY_RECORDS",
      "COCKPIT_ROUTE_REMOVAL_REQUIRED_CAPABILITY_IDS",
      "unique_useful_cockpit_capability_count",
      "zero_count_verified",
      "route_removal_allowed: false",
      "component_removal_allowed: false",
      ...requiredCapabilityIds,
    ],
    { label: helperFile },
  );

  assertContainsAll(
    docText,
    [
      "Status And Scope",
      "Why This Follows PR #941",
      "Zero-Count Definition",
      "Capability Dispositions",
      "Full Capability Coverage",
      "Blocked Authority Controls",
      "Obsolete And Forbidden Delete Controls",
      "Readiness Result",
      "Authority Boundary",
      "No Deletion In This PR",
      "Next PR",
      "unique_useful_cockpit_capability_count",
      "zero_count_verified",
      "ready_for_route_removal",
      "route_removal_allowed: false",
      "component_removal_allowed: false",
      ...requiredCapabilityIds,
      ...requiredAuthorityFields,
    ],
    { label: docFile },
  );

  assertContainsAll(indexText, [docFile], { label: indexDoc });
  assertContainsAll(migrationDocText, [docFile, "PR 5 readiness update"], {
    label: migrationDoc,
  });
  assertContainsAll(manualControlsDocText, [docFile], {
    label: manualControlsDoc,
  });
  assertContainsAll(stateProposalDocText, [docFile], {
    label: stateProposalDoc,
  });
  assertContainsAll(shrinkDocText, [docFile], { label: shrinkDoc });
}

function assertHelperBehavior() {
  assert.equal(typeof buildCockpitRouteRemovalReadiness, "function");
  assert(Array.isArray(COCKPIT_ROUTE_REMOVAL_CAPABILITY_RECORDS));
  assert(Array.isArray(COCKPIT_ROUTE_REMOVAL_REQUIRED_CAPABILITY_IDS));

  const read = buildCockpitRouteRemovalReadiness();
  assert.equal(read.readiness_version, COCKPIT_ROUTE_REMOVAL_READINESS_VERSION);
  assert.equal(read.status, "ready_for_route_removal");
  assert.equal(read.unique_useful_cockpit_capability_count, 0);
  assert.equal(read.zero_count_verified, true);
  assert.equal(read.route_removal_allowed, false);
  assert.equal(read.component_removal_allowed, false);
  assert.equal(read.blocking_conditions.length, 0);

  const ids = read.capability_records.map((record) => record.capability_id);
  assert.equal(new Set(ids).size, ids.length, "Capability records must be unique");
  for (const id of requiredCapabilityIds) {
    assert(ids.includes(id), `Missing readiness capability id: ${id}`);
    assert(
      COCKPIT_ROUTE_REMOVAL_REQUIRED_CAPABILITY_IDS.includes(id),
      `Required ids export must include ${id}`,
    );
  }
  assert.equal(
    read.capability_records.length,
    requiredCapabilityIds.length,
    "Readiness record count must match required coverage",
  );

  for (const record of read.capability_records) {
    assert.equal(
      record.is_unique_useful_cockpit_only,
      false,
      `${record.capability_id} must not be Cockpit-only useful`,
    );
    assert.notEqual(
      record.disposition,
      "retained_temporarily",
      `${record.capability_id} must not be retained temporarily`,
    );
  }

  assertDisposition({
    ids: requiredBlankStateCapabilityIds,
    disposition: "migrated_to_blank_state",
  });
  assertDisposition({
    ids: requiredWorkplaneCapabilityIds,
    disposition: "migrated_to_workplane",
  });
  assertDisposition({
    ids: requiredStateProposalReviewCapabilityIds,
    disposition: "migrated_to_state_proposal_review",
  });
  assertDisposition({
    ids: requiredManualMigrationCapabilityIds,
    disposition: "migrated_to_manual_migration_review",
  });
  assertDisposition({
    ids: requiredBlockedCapabilityIds,
    disposition: "blocked_until_authority_contract",
  });

  for (const id of requiredObsoleteCapabilityIds) {
    const record = read.capability_records.find(
      (candidate) => candidate.capability_id === id,
    );
    assert(record, id);
    assert(
      ["obsolete_delete", "forbidden_delete"].includes(record.disposition),
      `${id} must be obsolete_delete or forbidden_delete`,
    );
  }

  for (const field of requiredAuthorityFields) {
    assert.equal(read.authority_boundary[field], false, field);
  }

  return {
    readiness_version: read.readiness_version,
    status: read.status,
    unique_useful_cockpit_capability_count:
      read.unique_useful_cockpit_capability_count,
    zero_count_verified: read.zero_count_verified,
    route_removal_allowed: read.route_removal_allowed,
    component_removal_allowed: read.component_removal_allowed,
    record_count: read.capability_records.length,
    disposition_counts: countByDisposition(read.capability_records),
  };
}

function assertDisposition({ ids, disposition }) {
  const read = buildCockpitRouteRemovalReadiness();
  for (const id of ids) {
    const record = read.capability_records.find(
      (candidate) => candidate.capability_id === id,
    );
    assert(record, id);
    assert.equal(record.disposition, disposition, `${id} disposition`);
  }
}

function countByDisposition(records) {
  const counts = Object.fromEntries(
    COCKPIT_ROUTE_REMOVAL_CAPABILITY_DISPOSITIONS.map((disposition) => [
      disposition,
      0,
    ]),
  );
  for (const record of records) {
    counts[record.disposition] += 1;
  }
  return counts;
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
      `Unexpected changed file for Cockpit Route Removal Readiness v0.1: ${file}`,
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
    /^app\/cockpit\/page\.(tsx|ts|jsx|js)$/,
    /^components\/augnes-cockpit\.tsx$/,
    /^components\/workplane\//,
    /^app\/api\//,
    /^db\//,
    /^migrations\//,
    /(^|\/)(provider|providers|openai|github|codex|runner-execution|scheduler)(\/|$)/i,
    /(^|\/)(proof|evidence|persistence)(\/|$)/i,
    /(^|\/)(memory|perspective\/state|delta-apply|delta_apply)(\/|$)/i,
  ];

  for (const file of files) {
    for (const pattern of forbiddenPatterns) {
      assert(!pattern.test(file), `Forbidden path changed: ${file}`);
    }
  }
}

function assertNoRouteOrComponentDeletion() {
  const deletedFiles = collectGitDiffFiles([
    "diff",
    "--name-only",
    "--diff-filter=D",
    "origin/main...HEAD",
  ]).files;
  assert(
    !deletedFiles.includes("app/cockpit/page.tsx"),
    "app/cockpit/page.tsx must not be deleted in readiness PR",
  );
  assert(
    !deletedFiles.includes("components/augnes-cockpit.tsx"),
    "components/augnes-cockpit.tsx must not be deleted in readiness PR",
  );
}

function assertNoMutationOrAuthorityText() {
  const implementationText = [typeText, helperText].join("\n");
  const forbiddenPatterns = [
    /\bfetch\s*\(/,
    /\bmethod:\s*["'](?:POST|PUT|PATCH|DELETE)["']/,
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
      `Route removal readiness must not add mutation authority: ${pattern}`,
    );
  }
}
