#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  assertContainsAll,
  assertPackageScript,
  collectGitDiffFiles,
  collectUntrackedFiles,
  getBaseRangeChangedFiles,
  loadTextByFile,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const typeFile = "types/workplane-state-proposal-review.ts";
const helperFile = "lib/workplane/workplane-state-proposal-review.ts";
const manualControlsTypeFile = "types/cockpit-manual-controls-migration.ts";
const manualControlsHelperFile =
  "lib/workplane/cockpit-manual-controls-migration.ts";
const panelFile = "components/workplane/state-proposal-review-panel.tsx";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const nodeTypeFile = "types/agent-workplane-node.ts";
const nodeContextFile = "lib/workplane/workplane-node-context.ts";
const docFile = "docs/WORKPLANE_STATE_PROPOSAL_REVIEW_V0_1.md";
const manualControlsDoc =
  "docs/COCKPIT_MANUAL_CONTROLS_MIGRATION_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const migrationDoc =
  "docs/LEGACY_COCKPIT_REMAINING_CAPABILITY_MIGRATION_V0_1.md";
const blankStateDoc = "docs/BLANK_STATE_REVIEW_ENTRY_ABSORPTION_V0_1.md";
const agentWorkplaneDoc = "docs/AGENT_WORKPLANE_V0_1.md";
const shrinkDoc = "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_V0_1.md";
const nodeContractDoc = "docs/AGENT_WORKPLANE_NODE_CONTRACT_V0_1.md";
const packageJsonFile = "package.json";
const smokeFile = "scripts/smoke-workplane-state-proposal-review-v0-1.mjs";
const manualControlsSmokeFile =
  "scripts/smoke-cockpit-manual-controls-migration-v0-1.mjs";
const nodeContractSmokeFile =
  "scripts/smoke-agent-workplane-node-contract-v0-1.mjs";
const panelsSmokeFile = "scripts/smoke-agent-workplane-panels-v0-1.mjs";
const reviewMemorySmokeFile =
  "scripts/smoke-agent-workplane-review-memory-detail-v0-1.mjs";
const blankStateSmokeFile =
  "scripts/smoke-blank-state-review-entry-absorption-v0-1.mjs";
const migrationSmokeFile =
  "scripts/smoke-legacy-cockpit-remaining-capability-migration-v0-1.mjs";
const shrinkSmokeFile =
  "scripts/smoke-agent-workplane-legacy-cockpit-shrink-v0-1.mjs";
const augnesCockpitFile = "components/augnes-cockpit.tsx";
const cockpitPageFile = "app/cockpit/page.tsx";

const requiredGroupIds = [
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
  "manual_control_migration_review",
];

const requiredItemKinds = [
  "field_diff",
  "before_after_preview",
  "impact",
  "memory_proposal",
  "perspective_lens",
  "local_draft",
  "manual_preview",
  "manual_gravity",
  "formation_basis",
  "status_history",
  "stale_fallback_warning",
  "authority_boundary",
  "manual_control_migration",
  "blocked_local_write_control",
  "obsolete_cockpit_control",
  "copy_export_review",
];

const requiredRiskLevels = ["low", "medium", "high"];

const requiredStatuses = [
  "ready",
  "partial",
  "empty",
  "fallback",
  "needs_review",
  "blocked",
];

const requiredAuthorityFields = [
  "can_approve_proposal",
  "can_reject_proposal",
  "can_commit_proposal",
  "can_apply_memory",
  "can_apply_perspective",
  "can_auto_apply_delta",
  "can_write_product_db",
  "can_create_evidence",
  "can_record_proof",
  "can_call_provider_openai",
  "can_call_github",
  "can_actuate_github",
  "can_execute_codex",
  "can_execute_runner",
  "can_tick_runner",
  "can_recover_delta_batch",
  "can_schedule_runner",
  "can_merge_publish_retry_replay_deploy",
  "can_use_local_storage_durable_mode",
];

const expectedChangedFiles = [
  typeFile,
  helperFile,
  manualControlsTypeFile,
  manualControlsHelperFile,
  panelFile,
  agentWorkplaneFile,
  nodeTypeFile,
  nodeContextFile,
  docFile,
  manualControlsDoc,
  indexDoc,
  migrationDoc,
  blankStateDoc,
  agentWorkplaneDoc,
  shrinkDoc,
  nodeContractDoc,
  packageJsonFile,
  smokeFile,
  manualControlsSmokeFile,
  nodeContractSmokeFile,
  panelsSmokeFile,
  reviewMemorySmokeFile,
  blankStateSmokeFile,
  migrationSmokeFile,
  shrinkSmokeFile,
];

const textByFile = loadTextByFile([
  typeFile,
  helperFile,
  manualControlsTypeFile,
  manualControlsHelperFile,
  panelFile,
  agentWorkplaneFile,
  nodeTypeFile,
  nodeContextFile,
  docFile,
  manualControlsDoc,
  indexDoc,
  migrationDoc,
  blankStateDoc,
  agentWorkplaneDoc,
  shrinkDoc,
  nodeContractDoc,
  packageJsonFile,
  manualControlsSmokeFile,
  nodeContractSmokeFile,
  panelsSmokeFile,
  reviewMemorySmokeFile,
  blankStateSmokeFile,
  migrationSmokeFile,
  shrinkSmokeFile,
  augnesCockpitFile,
  cockpitPageFile,
]);

const typeText = textByFile.get(typeFile);
const helperText = textByFile.get(helperFile);
const panelText = textByFile.get(panelFile);
const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
const nodeTypeText = textByFile.get(nodeTypeFile);
const nodeContextText = textByFile.get(nodeContextFile);
const docText = textByFile.get(docFile);
const indexText = textByFile.get(indexDoc);
const migrationText = textByFile.get(migrationDoc);
const blankStateText = textByFile.get(blankStateDoc);
const agentWorkplaneDocText = textByFile.get(agentWorkplaneDoc);
const shrinkText = textByFile.get(shrinkDoc);
const nodeContractDocText = textByFile.get(nodeContractDoc);
const packageJsonText = textByFile.get(packageJsonFile);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:workplane-state-proposal-review-v0-1",
  expectedCommand:
    "node scripts/smoke-workplane-state-proposal-review-v0-1.mjs",
});

assertStaticContracts();
const behavior = assertHelperBehavior();
const changedFiles = assertChangedFilesBoundary();
assertNoForbiddenPaths(changedFiles.files);
assertNoMutationOrAuthorityText();

console.log(
  JSON.stringify(
    {
      smoke: "workplane-state-proposal-review-v0-1",
      pass: true,
      doc_exists: true,
      type_exists: true,
      helper_exists: true,
      panel_exists: true,
      package_script_checked: true,
      group_ids_checked: requiredGroupIds,
      item_kinds_checked: requiredItemKinds,
      risk_levels_checked: requiredRiskLevels,
      statuses_checked: requiredStatuses,
      authority_fields_false_checked: requiredAuthorityFields,
      helper_behavior: behavior,
      changed_files_boundary: changedFiles,
      no_mutation_or_authority_paths_checked: true,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:workplane-state-proposal-review-v0-1");

function assertStaticContracts() {
  assertContainsAll(
    typeText,
    [
      "WORKPLANE_STATE_PROPOSAL_REVIEW_VERSION",
      "WorkplaneStateProposalReviewRead",
      "review_version",
      "scope",
      "as_of",
      "status",
      "source_status",
      "fallback_reason",
      "summary",
      "proposal_groups",
      "field_level_diffs",
      "before_after_previews",
      "impact_items",
      "memory_proposal_reviews",
      "perspective_lens_reviews",
      "local_draft_reviews",
      "manual_preview_reviews",
      "proposal_status_history",
      "needs_user_judgment",
      "stale_fallback_warnings",
      "manual_control_migration_summary",
      "migrated_manual_control_reviews",
      "blocked_manual_control_reviews",
      "obsolete_manual_control_reviews",
      "manual_control_migration_record",
      "authority_boundary",
      "source_refs",
      "validation_summary",
      "next_review_targets",
      ...requiredGroupIds,
      ...requiredItemKinds,
      ...requiredRiskLevels,
      ...requiredStatuses,
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
      "buildWorkplaneStateProposalReviewRead",
      "buildCockpitManualControlsMigrationRead",
      "WORKPLANE_STATE_PROPOSAL_REVIEW_SMOKE_REFS",
      "STATE_PROPOSAL_REVIEW_AUTHORITY_BOUNDARY",
      "WorkplaneContextRead",
      "AgentWorkplaneNodeContextRead",
      "WorkplaneReviewMemoryDetailRead",
      ...requiredGroupIds,
      ...requiredItemKinds,
      "read_only_no_apply",
      "smoke:workplane-state-proposal-review-v0-1",
      "smoke:cockpit-manual-controls-migration-v0-1",
    ],
    { label: helperFile },
  );

  assertContainsAll(
    panelText,
    [
      "StateProposalReviewPanel",
      'data-workplane-state-proposal-review-panel="v0.1"',
      'data-workplane-panel-id="state_proposal_review"',
      'data-workplane-node-id="state_proposal_review"',
      'data-workplane-node-kind="proposal_review_context"',
      "data-workplane-node-status={read.status}",
      'data-state-proposal-review-authority-boundary="read_only_no_apply"',
      "data-state-proposal-review-source-status={read.source_status}",
      "data-state-proposal-review-group-id={group.group_id}",
      "data-state-proposal-review-item-kind={item.item_kind}",
      'data-cockpit-manual-controls-migration="v0.1"',
      "data-cockpit-manual-control-id={manualControlRecord?.control_id}",
      "data-cockpit-manual-control-migration-status={",
      "data-cockpit-manual-control-destination={manualControlRecord?.destination}",
      "data-cockpit-manual-control-authority-class={",
      "State Proposal Review is for reviewing proposed state changes before",
      "This panel does not approve, reject, commit, apply memory, apply Perspective, or auto-apply deltas.",
    ],
    { label: panelFile },
  );

  assertContainsAll(
    agentWorkplaneText,
    [
      "StateProposalReviewPanel",
      "buildWorkplaneStateProposalReviewRead",
      "stateProposalReview",
      "<StateProposalReviewPanel read={stateProposalReview} />",
      "ReviewMemoryDetailPanel",
      "LegacyCockpitCompatibilityPanel",
    ],
    { label: agentWorkplaneFile },
  );
  assert(!agentWorkplaneText.includes("AugnesCockpit"));

  assertContainsAll(
    nodeTypeText,
    [
      "state_proposal_review",
      "proposal_review_context",
      "empty",
      "needs_review",
      "blocked",
    ],
    { label: nodeTypeFile },
  );
  assertContainsAll(
    nodeContextText,
    [
      "state_proposal_review",
      "proposal_review_context",
      "Workplane State Proposal Review",
      "smoke:workplane-state-proposal-review-v0-1",
    ],
    { label: nodeContextFile },
  );

  for (const text of [
    indexText,
    migrationText,
    blankStateText,
    agentWorkplaneDocText,
    shrinkText,
  ]) {
    assertContainsAll(text, [docFile], {
      label: "Workplane State Proposal Review backlink",
    });
  }
  assertContainsAll(docText, [manualControlsDoc], {
    label: `${docFile} manual controls backlink`,
  });

  assertContainsAll(
    migrationText,
    [
      "PR 3 implementation update",
      "PR 4 implementation update",
      "Workplane State Proposal Review v0.1 is now implemented",
      "workplane_state_proposal_review",
      "apply/approve/reject/commit authority blocked",
      manualControlsDoc,
    ],
    { label: migrationDoc },
  );
  assertContainsAll(
    blankStateText,
    ["PR 3 follow-on", "native Workplane State Proposal Review lane"],
    { label: blankStateDoc },
  );
  assertContainsAll(
    docText,
    [
      "Status And Scope",
      "Research-Critical Capabilities Migrated",
      "Data Model",
      "Source And Fallback Behavior",
      "UI Markers",
      "Authority Boundary",
      "Validation",
      "Next PR: Cockpit Manual Controls Migration v0.1",
      "manual_control_migration_review",
      ...requiredGroupIds,
      ...requiredAuthorityFields,
    ],
    { label: docFile },
  );
  assertContainsAll(
    nodeContractDocText,
    ["state_proposal_review", "proposal_review_context", "needs_review"],
    { label: nodeContractDoc },
  );
}

function assertHelperBehavior() {
  const code = `
    import assert from "node:assert/strict";
    import { readWorkplaneContext } from "./lib/workplane/read-workplane-context.ts";
    import { buildAgentWorkplaneNodeContextRead } from "./lib/workplane/workplane-node-context.ts";
    import { buildWorkplaneReviewMemoryDetailRead } from "./lib/workplane/workplane-review-memory-detail.ts";
    import { buildWorkplaneStateProposalReviewRead } from "./lib/workplane/workplane-state-proposal-review.ts";
    import {
      WORKPLANE_STATE_PROPOSAL_REVIEW_VERSION,
      WORKPLANE_STATE_PROPOSAL_REVIEW_GROUP_IDS,
      WORKPLANE_STATE_PROPOSAL_REVIEW_STATUSES
    } from "./types/workplane-state-proposal-review.ts";

    const requiredAuthorityFields = ${JSON.stringify(requiredAuthorityFields)};
    const context = await readWorkplaneContext();
    const nodeContext = buildAgentWorkplaneNodeContextRead(context);
    const reviewMemoryDetail = buildWorkplaneReviewMemoryDetailRead({
      workplane_context: context,
      node_context_read: nodeContext
    });
    const read = buildWorkplaneStateProposalReviewRead({
      workplane_context: context,
      node_context_read: nodeContext,
      review_memory_detail: reviewMemoryDetail
    });

    assert.equal(read.review_version, WORKPLANE_STATE_PROPOSAL_REVIEW_VERSION);
    assert(WORKPLANE_STATE_PROPOSAL_REVIEW_STATUSES.includes(read.status), read.status);
    assert.equal(read.proposal_groups.length, WORKPLANE_STATE_PROPOSAL_REVIEW_GROUP_IDS.length);
    for (const groupId of WORKPLANE_STATE_PROPOSAL_REVIEW_GROUP_IDS) {
      const group = read.proposal_groups.find((candidate) => candidate.group_id === groupId);
      assert(group, groupId);
      assert(group.review_items.length > 0, groupId);
      assert(WORKPLANE_STATE_PROPOSAL_REVIEW_STATUSES.includes(group.status), group.status);
    }
    for (const field of requiredAuthorityFields) {
      assert.equal(read.authority_boundary[field], false, field);
    }
    assert(read.field_level_diffs.length > 0);
    assert(read.before_after_previews.length > 0);
    assert(read.impact_items.length > 0);
    assert(read.memory_proposal_reviews.length > 0);
    assert(read.perspective_lens_reviews.length > 0);
    assert(read.local_draft_reviews.length > 0);
    assert(read.manual_preview_reviews.length >= 3);
    assert(read.proposal_status_history.length > 0);
    assert(read.needs_user_judgment.length > 0);
    assert(read.stale_fallback_warnings.length > 0);
    assert(read.manual_control_migration_summary);
    assert(read.migrated_manual_control_reviews.length >= 7);
    assert(read.blocked_manual_control_reviews.length >= 5);
    assert(read.obsolete_manual_control_reviews.length >= 3);
    assert(read.proposal_groups.some((group) => group.group_id === "manual_control_migration_review"));
    assert(read.proposal_groups.some((group) => group.review_items.some((item) => item.status === "empty" || item.status === "fallback")));

    console.log(JSON.stringify({
      review_version: read.review_version,
      status: read.status,
      source_status: read.source_status,
      group_count: read.proposal_groups.length,
      item_count: read.summary.item_count,
      manual_control_migration_count: read.manual_control_migration_summary.total_record_count,
      authority_false_count: requiredAuthorityFields.filter((field) => read.authority_boundary[field] === false).length,
      has_empty_or_fallback_row: read.proposal_groups.some((group) => group.review_items.some((item) => item.status === "empty" || item.status === "fallback"))
    }));
  `;

  const output = execFileSync("node", ["--import", "tsx", "--eval", code], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: {
      ...process.env,
      AUGNES_DB_PATH: "/tmp/augnes-state-proposal-review-smoke-empty.db",
    },
  });
  return JSON.parse(output);
}

function assertChangedFilesBoundary() {
  const workingTree = collectGitDiffFiles(["diff", "--name-only", "HEAD"]);
  const staged = collectGitDiffFiles(["diff", "--cached", "--name-only"]);
  const baseRange = getBaseRangeChangedFiles();
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
      `Unexpected changed file for Workplane State Proposal Review v0.1: ${file}`,
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
  assert(!/\buse server\b/.test(panelText), "panel must not render server action");

  const implementationText = [
    helperText,
    panelText,
    agentWorkplaneText,
    nodeContextText,
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
      `State Proposal Review must not add mutation authority: ${pattern}`,
    );
  }
}
