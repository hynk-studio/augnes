#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import Database from "better-sqlite3";

import {
  assertPackageScript,
  collectGitDiffFiles,
  collectUntrackedFiles,
  getBaseRangeChangedFiles,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";
import {
  seedLocalAutohuntChainV01,
} from "./dogfood-seed-local-autohunt-chain-v0-1.mjs";
import {
  allValuesFalse,
  findForbiddenRawMaterialFields,
} from "../lib/research-candidate-review/shared-source-chain-guards.ts";
import { AUTONOMY_DELEGATION_GRANT_TABLE } from "../types/autonomy-delegation-grant.ts";
import { AUTOHUNT_WORK_QUEUE_CANDIDATE_TABLE } from "../types/autohunt-work-queue-candidate.ts";
import { AUTOHUNT_PREFLIGHT_PACKET_TABLE } from "../types/autohunt-preflight-packet.ts";
import { AUTOHUNT_HANDOFF_PLAN_PREVIEW_TABLE } from "../types/autohunt-handoff-plan-preview.ts";
import { AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_TABLE } from "../types/autohunt-handoff-plan-operator-review-decision.ts";

const files = {
  dogfoodSeed: "scripts/dogfood-seed-local-autohunt-chain-v0-1.mjs",
  smoke: "scripts/smoke-local-autohunt-chain-dogfood-v0-1.mjs",
  copyExportType: "types/autohunt-handoff-copy-export-preview.ts",
  copyExportBuilder:
    "lib/autonomy/autohunt-handoff-copy-export-preview.ts",
  copyExportPanel:
    "components/autonomy/autohunt-handoff-copy-export-preview-panel.tsx",
  copyExportSmoke:
    "scripts/smoke-autohunt-handoff-copy-export-preview-v0-1.mjs",
  packageJson: "package.json",
  agentWorkplane: "components/workplane/agent-workplane.tsx",
  agentWorkplanePanelsSmoke: "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  operatorDecisionMountSmoke:
    "scripts/smoke-autohunt-handoff-plan-operator-review-decision-workbench-mount-v0-1.mjs",
  operatorDecisionSmoke:
    "scripts/smoke-autohunt-handoff-plan-operator-review-decision-v0-1.mjs",
  handoffPlanWorkbenchMountSmoke:
    "scripts/smoke-autohunt-handoff-plan-preview-workbench-mount-v0-1.mjs",
  handoffPlanSmoke:
    "scripts/smoke-autohunt-handoff-plan-preview-v0-1.mjs",
  workbenchSpineSmoke:
    "scripts/smoke-autohunt-workbench-readback-spine-v0-1.mjs",
  preflightSmoke: "scripts/smoke-autohunt-preflight-packet-v0-1.mjs",
  queueCandidateSmoke: "scripts/smoke-autohunt-work-queue-candidate-v0-1.mjs",
  delegationGrantSmoke:
    "scripts/smoke-autonomy-delegation-grant-record-v0-1.mjs",
  sharedSourceGuardSmoke: "scripts/smoke-shared-source-chain-guards-v0-1.mjs",
  autonomyContractSmoke: "scripts/smoke-autonomy-contract-v0-1.mjs",
  autonomyRunnerPreflightSmoke:
    "scripts/smoke-autonomy-runner-preflight-v0-1.mjs",
};

const expectedChangedFiles = new Set(Object.values(files));
const source = Object.fromEntries(
  Object.entries(files).map(([key, filePath]) => {
    assert(existsSync(filePath), `${filePath} must exist`);
    return [key, readFileSync(filePath, "utf8")];
  }),
);

const TARGET_TABLES = [
  AUTONOMY_DELEGATION_GRANT_TABLE,
  AUTOHUNT_WORK_QUEUE_CANDIDATE_TABLE,
  AUTOHUNT_PREFLIGHT_PACKET_TABLE,
  AUTOHUNT_HANDOFF_PLAN_PREVIEW_TABLE,
  AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_TABLE,
];

const SAFE_RAW_BOUNDARY_KEYS = new Set([
  "raw_material_persisted",
  "raw_material_persisted_any",
  "raw_approval_text_persisted",
  "raw_prompt_text_persisted",
  "raw_pr_body_persisted",
  "raw_operator_note_persisted",
  "raw_review_note_persisted",
  "raw_reason_text_persisted",
  "persists_raw_user_approval_text",
  "persists_raw_prompt",
  "persists_raw_prompt_text",
  "persists_raw_pr_body",
  "persists_raw_operator_note",
  "persists_raw_review_note",
  "persists_raw_reason_text",
  "persists_raw_source_payload",
  "persists_secret_or_token",
  "persists_url_or_env_value",
  "raw_material_absent",
  "expected_result_report_sections",
]);

assertChangedFileBoundary();
assertPackageScriptWiring();
assertNoSchemaRouteOrActionExpansion();
assertForbiddenImportsAbsent();
assertSeedBehavior();
assertWorkbenchReadOnly();

console.log(
  JSON.stringify(
    {
      smoke: "local-autohunt-chain-dogfood-v0-1",
      pass: true,
      expected_changed_files_checked: true,
      docs_changed: false,
      package_scripts_checked: true,
      seed_helper_exists: true,
      in_memory_seed_checked: true,
      idempotency_checked: true,
      readback_selection_checked: true,
      target_only_row_count_checked: true,
      authority_boundary_checked: true,
      raw_material_absence_checked: true,
      workbench_readback_only_checked: true,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:local-autohunt-chain-dogfood-v0-1");

function assertChangedFileBoundary() {
  const changedFiles = collectChangedFiles();
  for (const file of changedFiles) {
    assert(
      expectedChangedFiles.has(file),
      `Unexpected changed file for local Autohunt chain dogfood slice: ${file}`,
    );
    assert.doesNotMatch(file, /^docs\//, "dogfood slice must not edit docs");
    assert.doesNotMatch(file, /^README/i, "dogfood slice must not edit README");
    assert.doesNotMatch(file, /^app\/api\//, "dogfood slice must not add API routes");
    assert.doesNotMatch(file, /^app\//, "dogfood slice must not change app surfaces");
    assert.doesNotMatch(file, /package-lock|pnpm-lock|yarn\.lock/, "package lock must not change");
  }
}

function assertPackageScriptWiring() {
  assertPackageScript({
    packageJsonText: source.packageJson,
    scriptName: "dogfood:seed-local-autohunt-chain-v0-1",
    expectedCommand:
      "tsx --tsconfig tsconfig.json scripts/dogfood-seed-local-autohunt-chain-v0-1.mjs",
  });
  assertPackageScript({
    packageJsonText: source.packageJson,
    scriptName: "smoke:local-autohunt-chain-dogfood-v0-1",
    expectedCommand:
      "tsx --tsconfig tsconfig.json scripts/smoke-local-autohunt-chain-dogfood-v0-1.mjs",
  });
}

function assertNoSchemaRouteOrActionExpansion() {
  const changedFiles = collectChangedFiles();
  for (const forbidden of [
    "lib/db.ts",
    "lib/db/schema.sql",
    "scripts/db-migrations.mjs",
    "scripts/db-migrate.mjs",
  ]) {
    assert(
      !changedFiles.includes(forbidden),
      `dogfood slice must not change schema or migration file: ${forbidden}`,
    );
  }
  assert.equal(
    changedFiles.some((file) => /^app\/api\//.test(file)),
    false,
    "dogfood slice must not add app/api routes",
  );
  for (const [label, text] of Object.entries({
    dogfoodSeed: source.dogfoodSeed,
  })) {
    assert.doesNotMatch(text, /\bfetch\s*\(/, `${label} must not fetch`);
    assert.doesNotMatch(text, /formAction/, `${label} must not add form actions`);
    assert.doesNotMatch(text, /use server/i, `${label} must not add server actions`);
    assert.doesNotMatch(text, /<button\b/i, `${label} must not add buttons`);
    assert.doesNotMatch(text, /\bonClick\b/, `${label} must not add click handlers`);
    assert.doesNotMatch(text, /\bCREATE\s+TABLE\b/i, `${label} must not add tables`);
  }
}

function assertForbiddenImportsAbsent() {
  for (const [label, text] of Object.entries({
    dogfoodSeed: source.dogfoodSeed,
    smoke: source.smoke,
  })) {
    const imports = text
      .split("\n")
      .filter((line) => /^\s*import\b/.test(line))
      .join("\n");
    assert.doesNotMatch(
      imports,
      /from\s+["'][^"']*(openai|provider|github|octokit|codex)[^"']*["']/i,
      `${label} must not import provider/GitHub/Codex code`,
    );
    assert.doesNotMatch(
      imports,
      /from\s+["'][^"']*(retrieval|rag|embedding|vector|crawler|source-fetch|fetch-source)[^"']*["']/i,
      `${label} must not import retrieval or source-fetch code`,
    );
  }
}

function assertSeedBehavior() {
  const db = new Database(":memory:");
  try {
    const first = seedLocalAutohuntChainV01({ db });
    assert.equal(first.ok, true, JSON.stringify(first.refusal_reasons ?? []));
    assert.equal(first.report.mode, "dry_run_in_memory");
    assert.deepEqual(first.report.write_results, {
      grant: "written",
      queue_candidate: "written",
      preflight_packet: "written",
      handoff_plan: "written",
      operator_decision: "written",
    });
    for (const table of TARGET_TABLES) {
      assert.equal(countRows(db, table), 1, `${table} should have one seed row`);
    }

    assert.equal(
      first.report.selected_statuses.grant,
      "active",
    );
    assert.equal(first.report.selected_statuses.queue_candidate, "queued");
    assert.equal(
      first.report.selected_statuses.preflight_packet,
      "ready_for_supervised_handoff_planning",
    );
    assert.equal(
      first.report.selected_statuses.workbench_spine,
      "ready_for_supervised_handoff_planning",
    );
    assert.equal(
      first.report.selected_statuses.handoff_plan,
      "ready_for_operator_review",
    );
    assert.equal(
      first.report.selected_statuses.operator_decision,
      "accepted_for_future_supervised_handoff_copy_export_planning",
    );
    assert.equal(
      first.report.selected_statuses.approval_scope,
      "future_supervised_handoff_copy_export_planning_only",
    );
    assert.equal(
      Object.values(first.report.readback_selections).every(Boolean),
      true,
    );
    assert.equal(
      first.report.workbench_spine_status,
      "ready_for_supervised_handoff_planning",
    );
    assert.equal(first.report.no_external_or_execution_authority, true);
    assert.equal(first.report.raw_material_persisted_any, false);
    for (const value of Object.values(first.report.no_run_no_execution_boundary)) {
      assert.equal(value, true);
    }
    for (const value of Object.values(first.report.raw_material_persisted)) {
      assert.equal(value, false);
    }

    for (const summary of Object.values(first.report.row_count_write_summary)) {
      assert.equal(summary.target_delta, 1);
      assert.equal(summary.target_delta_matches_expected, true);
      assert.equal(summary.all_non_target_row_counts_unchanged, true);
      assert.equal(summary.non_target_changed_table_count, 0);
      assert(TARGET_TABLES.includes(summary.target_table_name));
    }

    assertPersistedAndReportRawMaterialSafe(first);
    assertAllRecordAuthorityFalse(first.records);

    const second = seedLocalAutohuntChainV01({ db });
    assert.equal(second.ok, true, JSON.stringify(second.refusal_reasons ?? []));
    assert.deepEqual(second.report.write_results, {
      grant: "duplicate_replayed",
      queue_candidate: "duplicate_replayed",
      preflight_packet: "duplicate_replayed",
      handoff_plan: "duplicate_replayed",
      operator_decision: "duplicate_replayed",
    });
    assert.equal(second.report.grant_id, first.report.grant_id);
    assert.equal(
      second.report.queue_candidate_id,
      first.report.queue_candidate_id,
    );
    assert.equal(
      second.report.preflight_packet_id,
      first.report.preflight_packet_id,
    );
    assert.equal(second.report.handoff_plan_id, first.report.handoff_plan_id);
    assert.equal(
      second.report.operator_decision_id,
      first.report.operator_decision_id,
    );
    for (const table of TARGET_TABLES) {
      assert.equal(
        countRows(db, table),
        1,
        `${table} should remain idempotent after replay`,
      );
    }
  } finally {
    db.close();
  }
}

function assertWorkbenchReadOnly() {
  assert.doesNotMatch(
    source.agentWorkplane,
    /\bwriteAutonomyDelegationGrant\b|\bwriteAutohuntWorkQueueCandidate\b|\bwriteAutohuntPreflightPacket\b|\bwriteAutohuntHandoffPlanPreview\b|\bwriteAutohuntHandoffPlanOperatorReviewDecision\b/,
    "Agent Workplane must not call any Autohunt write helper",
  );
}

function assertAllRecordAuthorityFalse(records) {
  assert.equal(allValuesFalse(records.grant.authority_boundary), true);
  assert.equal(allValuesFalse(records.candidate.authority_boundary), true);
  assert.equal(allValuesFalse(records.preflight_packet.authority_boundary), true);
  assert.equal(allValuesFalse(records.workbench_spine.authority_boundary), true);
  assert.equal(allValuesFalse(records.handoff_plan.authority_boundary), true);
  assert.equal(allValuesFalse(records.operator_decision.authority_boundary), true);
}

function assertPersistedAndReportRawMaterialSafe(seedResult) {
  const scrubbed = stripSafeRawBoundaryKeys({
    report: seedResult.report,
    records: seedResult.records,
  });
  const forbiddenFields = findForbiddenRawMaterialFields(scrubbed);
  assert.deepEqual(forbiddenFields, []);
  const serialized = JSON.stringify(scrubbed);
  assert.doesNotMatch(serialized, /raw_prompt|raw_pr_body|raw_review_note|raw_reason_text|raw_source_payload/i);
  assert.doesNotMatch(serialized, /\b(token|secret|credential|api_key|authorization|cookie|password)\b/i);
  assert.doesNotMatch(serialized, /\bhttps?:\/\//i);
  assert.doesNotMatch(serialized, /\b[A-Z][A-Z0-9_]*_ENV\b/);
}

function stripSafeRawBoundaryKeys(value) {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(stripSafeRawBoundaryKeys);
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !SAFE_RAW_BOUNDARY_KEYS.has(key))
      .map(([key, nestedValue]) => [key, stripSafeRawBoundaryKeys(nestedValue)]),
  );
}

function countRows(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function collectChangedFiles() {
  return uniqueSorted([
    ...collectGitDiffFiles(["diff", "--name-only"]).files,
    ...collectGitDiffFiles(["diff", "--cached", "--name-only"]).files,
    ...collectUntrackedFiles(),
    ...getBaseRangeChangedFiles().files,
  ]);
}
