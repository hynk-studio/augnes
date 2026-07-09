#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import Database from "better-sqlite3";

import {
  assertPackageScript,
  getBaseRangeChangedFiles,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";
import {
  buildAutohuntHandoffPlanPreviewAuthorityBoundary,
  computeAutohuntHandoffPlanPreviewFingerprint,
} from "../lib/autonomy/read-autohunt-handoff-plan-previews.ts";
import { writeAutohuntHandoffPlanOperatorReviewDecision } from "../lib/autonomy/autohunt-handoff-plan-operator-review-decision-write.ts";
import {
  buildAutohuntHandoffPlanOperatorReviewDecisionAuthorityBoundary,
  computeAutohuntHandoffPlanOperatorReviewDecisionFingerprint,
  ensureAutohuntHandoffPlanOperatorReviewDecisionSchema,
  readAutohuntHandoffPlanOperatorReviewDecisions,
} from "../lib/autonomy/read-autohunt-handoff-plan-operator-review-decisions.ts";
import {
  allValuesFalse,
  fingerprint,
  STABLE_FINGERPRINT_ALGORITHM,
} from "../lib/research-candidate-review/shared-source-chain-guards.ts";
import {
  AUTOHUNT_HANDOFF_PLAN_PREVIEW_BLOCKED_ACTIONS,
  AUTOHUNT_HANDOFF_PLAN_PREVIEW_FORBIDDEN_OUTPUTS,
  AUTOHUNT_HANDOFF_PLAN_PREVIEW_KIND,
  AUTOHUNT_HANDOFF_PLAN_PREVIEW_NEXT_ALLOWED_OUTPUTS,
  AUTOHUNT_HANDOFF_PLAN_PREVIEW_TABLE,
  AUTOHUNT_HANDOFF_PLAN_PREVIEW_VERSION,
} from "../types/autohunt-handoff-plan-preview.ts";
import {
  AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_TABLE,
} from "../types/autohunt-handoff-plan-operator-review-decision.ts";

const files = {
  type: "types/autohunt-handoff-plan-operator-review-decision.ts",
  writer:
    "lib/autonomy/autohunt-handoff-plan-operator-review-decision-write.ts",
  reader:
    "lib/autonomy/read-autohunt-handoff-plan-operator-review-decisions.ts",
  panel:
    "components/autonomy/autohunt-handoff-plan-operator-review-decision-readback-panel.tsx",
  db: "lib/db.ts",
  schema: "lib/db/schema.sql",
  migrations: "scripts/db-migrations.mjs",
  migrate: "scripts/db-migrate.mjs",
  smoke:
    "scripts/smoke-autohunt-handoff-plan-operator-review-decision-v0-1.mjs",
  workbenchMountSmoke:
    "scripts/smoke-autohunt-handoff-plan-operator-review-decision-workbench-mount-v0-1.mjs",
  packageJson: "package.json",
  agentWorkplane: "components/workplane/agent-workplane.tsx",
  agentWorkplanePanelsSmoke: "scripts/smoke-agent-workplane-panels-v0-1.mjs",
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
  localAutohuntChainDogfood:
    "scripts/dogfood-seed-local-autohunt-chain-v0-1.mjs",
  localAutohuntChainDogfoodSmoke:
    "scripts/smoke-local-autohunt-chain-dogfood-v0-1.mjs",
  copyExportType: "types/autohunt-handoff-copy-export-preview.ts",
  copyExportBuilder:
    "lib/autonomy/autohunt-handoff-copy-export-preview.ts",
  copyExportPanel:
    "components/autonomy/autohunt-handoff-copy-export-preview-panel.tsx",
  copyExportSmoke:
    "scripts/smoke-autohunt-handoff-copy-export-preview-v0-1.mjs",
  executionGateType: "types/autohunt-execution-readiness-gate.ts",
  executionGateBuilder:
    "lib/autonomy/autohunt-execution-readiness-gate.ts",
  executionGatePanel:
    "components/autonomy/autohunt-execution-readiness-gate-panel.tsx",
  executionGateSmoke:
    "scripts/smoke-autohunt-execution-readiness-gate-v0-1.mjs",
  executionContractType: "types/autohunt-supervised-execution-contract.ts",
  executionContractWriter:
    "lib/autonomy/autohunt-supervised-execution-contract-write.ts",
  executionContractReader:
    "lib/autonomy/read-autohunt-supervised-execution-contracts.ts",
  executionContractPanel:
    "components/autonomy/autohunt-supervised-execution-contract-readback-panel.tsx",
  executionContractSmoke:
    "scripts/smoke-autohunt-supervised-execution-contract-v0-1.mjs",
  resultIntakeType: "types/autohunt-result-intake.ts",
  resultIntakeWriter: "lib/autonomy/autohunt-result-intake-write.ts",
  resultIntakeReadback: "lib/autonomy/read-autohunt-result-intakes.ts",
  resultIntakePanel:
    "components/autonomy/autohunt-result-intake-readback-panel.tsx",
  resultIntakeSmoke: "scripts/smoke-autohunt-result-intake-v0-1.mjs",
  dailyLauncherType: "types/autohunt-daily-launcher-run.ts",
  dailyLauncherWriter:
    "lib/autonomy/autohunt-daily-launcher-run-write.ts",
  dailyLauncherReadback:
    "lib/autonomy/read-autohunt-daily-launcher-runs.ts",
  dailyLauncherPanel:
    "components/autonomy/autohunt-daily-launcher-run-readback-panel.tsx",
  dailyLauncherCli: "scripts/autohunt-daily-launcher-v0-1.mjs",
  dailyLauncherSmoke:
    "scripts/smoke-autohunt-daily-launcher-run-v0-1.mjs",
  persistentChainReadinessBindingSmoke:
    "scripts/smoke-autohunt-persistent-chain-readiness-binding-v0-1.mjs",
};

const expectedChangedFiles = new Set(Object.values(files));
const source = Object.fromEntries(
  Object.entries(files).map(([key, filePath]) => {
    assert(existsSync(filePath), `${filePath} must exist`);
    return [key, readFileSync(filePath, "utf8")];
  }),
);

assertChangedFileBoundary();
assertTypeAndHelperFiles();
assertDbSchemaAndMigration();
assertPackageScriptWiring();
assertWriteReadBehavior();
assertPanelPassive();
assertNoRuntimeImportsOrWorkbenchWrite();

console.log(
  JSON.stringify(
    {
      smoke: "autohunt-handoff-plan-operator-review-decision-v0-1",
      pass: true,
      target_table: AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_TABLE,
      expected_changed_files_checked: true,
      docs_changed: false,
      type_checked: true,
      write_helper_checked: true,
      readback_helper_checked: true,
      panel_passive_checked: true,
      schema_migration_checked: true,
      target_only_write_checked: true,
      duplicate_replay_checked: true,
      accept_defer_reject_checked: true,
      source_validation_refusals_checked: true,
      unsafe_input_refusals_checked: true,
      latest_accepted_readback_checked: true,
      no_runner_or_external_authority_checked: true,
      no_auto_acceptance_checked: true,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:autohunt-handoff-plan-operator-review-decision-v0-1");

function assertChangedFileBoundary() {
  const changedFiles = collectChangedFiles();
  for (const file of changedFiles) {
    assert(
      expectedChangedFiles.has(file),
      `Unexpected changed file for autohunt handoff plan operator review decision slice: ${file}`,
    );
    assert.doesNotMatch(file, /^docs\//, "operator decision slice must not edit docs");
    assert.doesNotMatch(file, /^README/i, "operator decision slice must not edit README");
    assert.doesNotMatch(file, /^app\/api\//, "operator decision slice must not add routes");
    assert.doesNotMatch(file, /^app\//, "operator decision slice must not alter app surfaces");
    assert.doesNotMatch(file, /package-lock|pnpm-lock|yarn\.lock/, "package lock must not change");
  }
}

function assertTypeAndHelperFiles() {
  assertContains(source.type, [
    "AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_KIND",
    "accepted_for_future_supervised_handoff_copy_export_planning",
    "accept_handoff_plan_for_future_supervised_copy_export_planning",
    "source_handoff_plan_fingerprint_mismatch",
    "future_supervised_handoff_copy_export_planning_only",
    "raw_review_note_persisted: false",
    "raw_reason_text_persisted: false",
    "decision_fingerprint",
  ]);
  assertContains(source.writer, [
    "writeAutohuntHandoffPlanOperatorReviewDecision",
    "validateAutohuntHandoffPlanOperatorReviewDecisionInput",
    "buildDeterministicIdempotencyKey",
    "findForbiddenRawMaterialFields",
    "containsForbiddenRawMaterial",
    "assertAllFalseBoundary",
    "requiredStringFieldsPresent",
    "validateSourceBindingPairs",
    "summarizeTargetOnlyRowCountWrite",
    "BEGIN IMMEDIATE",
    "target_only_autohunt_handoff_plan_operator_review_decision_row_count_proof_failed",
  ]);
  assertContains(source.reader, [
    "readAutohuntHandoffPlanOperatorReviewDecisions",
    "ensureAutohuntHandoffPlanOperatorReviewDecisionSchema",
    "computeAutohuntHandoffPlanOperatorReviewDecisionFingerprint",
    "latest_accepted_decision",
    "deferred_decisions",
    "rejected_decisions",
    "no_run_no_execution_boundary",
  ]);
  assertContains(source.panel, [
    "AutohuntHandoffPlanOperatorReviewDecisionReadbackPanel",
    "Acceptance here is limited to future supervised handoff copy/export planning",
    "selected decision",
    "source handoff plan",
    "accepted summary",
    "defer or reject summary",
    "authority boundary",
    "material boundary",
    "row counts",
  ]);
}

function assertDbSchemaAndMigration() {
  for (const [label, text] of [
    [files.schema, source.schema],
    [files.db, source.db],
    [files.migrations, source.migrations],
    [files.migrate, source.migrate],
    [files.reader, source.reader],
  ]) {
    assert(
      text.includes(AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_TABLE),
      `${label} must wire target table`,
    );
  }

  for (const [label, text] of [
    [files.schema, source.schema],
    [files.migrations, source.migrations],
  ]) {
    const targetTableBlock = extractTargetTableBlock(text);
    const addedTables = collectAddedCreateTableNames(label);
    if (addedTables.length > 0) {
      assert.deepEqual(
        addedTables,
        addedTables.filter((table) =>
          [
            AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_TABLE,
            "autohunt_supervised_execution_contracts",
            "autohunt_result_intakes",
            "autohunt_daily_launcher_runs",
          ].includes(table),
        ),
        `${label} must add only the operator review decision table or named supervised execution contract/result-intake/launcher follow-on table`,
      );
    }
    assert.doesNotMatch(targetTableBlock, /raw_review_note/i, `${label} must not define raw review note columns`);
    assert.doesNotMatch(targetTableBlock, /raw_reason_text/i, `${label} must not define raw reason text columns`);
    assert.doesNotMatch(targetTableBlock, /raw_prompt/i, `${label} must not define raw prompt columns`);
    assert.doesNotMatch(targetTableBlock, /raw_pr_body/i, `${label} must not define raw PR body columns`);
    assert.doesNotMatch(targetTableBlock, /raw_source_payload/i, `${label} must not define raw source payload columns`);
    assert.doesNotMatch(targetTableBlock, /\b(token|secret|url|env|credential)\b/i, `${label} must not define token/secret/url/env columns`);
  }

  const db = new Database(":memory:");
  try {
    ensureAutohuntHandoffPlanOperatorReviewDecisionSchema(db);
    const columns = db
      .prepare(
        `PRAGMA table_info(${AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_TABLE})`,
      )
      .all()
      .map((column) => column.name);
    assert.deepEqual(
      columns,
      [
        "decision_id",
        "created_at",
        "scope",
        "decision_status",
        "operator_decision",
        "source_handoff_plan_id",
        "source_handoff_plan_fingerprint",
        "source_handoff_plan_status",
        "source_grant_id",
        "source_grant_fingerprint",
        "source_preflight_packet_id",
        "source_preflight_packet_fingerprint",
        "source_workbench_spine_fingerprint",
        "selected_candidate_ids_json",
        "selected_candidate_fingerprints_json",
        "review_basis_ref",
        "reviewed_by",
        "reviewed_at",
        "review_basis_fingerprint",
        "idempotency_key",
        "accepted_summary_json",
        "defer_or_reject_summary_json",
        "source_chain_validation_json",
        "blocked_actions_json",
        "next_allowed_outputs_json",
        "forbidden_outputs_json",
        "authority_boundary_json",
        "persisted_material_boundary_json",
        "validation_json",
        "row_count_write_summary_json",
        "decision_fingerprint",
      ],
    );
    for (const column of columns) {
      assert.doesNotMatch(column, /raw_review_note/i);
      assert.doesNotMatch(column, /raw_reason_text/i);
      assert.doesNotMatch(column, /raw_prompt/i);
      assert.doesNotMatch(column, /raw_pr_body/i);
      assert.doesNotMatch(column, /raw_source_payload/i);
      assert.doesNotMatch(column, /\b(token|secret|url|env|credential)\b/i);
    }
    const indexes = db
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'index'
            AND tbl_name = ?
          ORDER BY name
        `,
      )
      .all(AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_TABLE)
      .map((index) => index.name);
    assert.deepEqual(indexes, [
      "idx_autohunt_handoff_plan_operator_review_decisions_decision_status_created",
      "idx_autohunt_handoff_plan_operator_review_decisions_operator_decision_created",
      "idx_autohunt_handoff_plan_operator_review_decisions_scope_created",
      "idx_autohunt_handoff_plan_operator_review_decisions_source_handoff_plan_id_created",
      "sqlite_autoindex_autohunt_handoff_plan_operator_review_decisions_1",
      "sqlite_autoindex_autohunt_handoff_plan_operator_review_decisions_2",
    ]);
  } finally {
    db.close();
  }
}

function assertPackageScriptWiring() {
  assertPackageScript({
    packageJsonText: source.packageJson,
    scriptName: "smoke:autohunt-handoff-plan-operator-review-decision-v0-1",
    expectedCommand:
      "tsx --tsconfig tsconfig.json scripts/smoke-autohunt-handoff-plan-operator-review-decision-v0-1.mjs",
  });
}

function assertWriteReadBehavior() {
  const db = new Database(":memory:");
  try {
    const handoffPlan = makeReadyHandoffPlan();
    const acceptedInput = makeDecisionInput({ handoffPlan });
    const beforeTarget = countRows(db, AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_TABLE);
    const accepted = writeAutohuntHandoffPlanOperatorReviewDecision(
      acceptedInput,
      { db, now: "2026-07-09T05:00:00.000Z" },
    );
    assert.equal(
      accepted.ok,
      true,
      `accepted decision should write: ${JSON.stringify(accepted.refusal_reasons)}`,
    );
    assert.equal(accepted.result_status, "written");
    assert.equal(
      accepted.decision?.decision_status,
      "accepted_for_future_supervised_handoff_copy_export_planning",
    );
    assert.equal(
      accepted.decision?.accepted_summary?.approval_scope,
      "future_supervised_handoff_copy_export_planning_only",
    );
    assert.equal(accepted.decision?.defer_or_reject_summary, null);
    assert.equal(accepted.row_count_write_summary?.target_delta, 1);
    assert.equal(
      accepted.row_count_write_summary?.all_non_target_row_counts_unchanged,
      true,
    );
    assert.equal(
      countRows(db, AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_TABLE),
      beforeTarget + 1,
    );
    for (const flag of Object.entries(accepted).filter(([key]) =>
      key.startsWith("can_"),
    )) {
      assert.equal(flag[1], false, `${flag[0]} must remain false`);
    }

    const duplicate = writeAutohuntHandoffPlanOperatorReviewDecision(
      acceptedInput,
      { db, now: "2026-07-09T05:01:00.000Z" },
    );
    assert.equal(duplicate.result_status, "duplicate_replayed");
    assert.equal(
      countRows(db, AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_TABLE),
      beforeTarget + 1,
    );

    assertRefused({ source_handoff_plan: null }, "source_handoff_plan_missing", db);
    assertRefused(
      {
        source_handoff_plan: {
          ...handoffPlan,
          handoff_plan_status: "blocked",
          handoff_plan_fingerprint: computeAutohuntHandoffPlanPreviewFingerprint({
            ...handoffPlan,
            handoff_plan_status: "blocked",
          }),
        },
      },
      "source_handoff_plan_not_ready",
      db,
    );
    assertRefused(
      {
        source_handoff_plan: {
          ...handoffPlan,
          handoff_plan_fingerprint: "fnv1a32_canonical_json_v0_1:bad",
        },
      },
      "source_handoff_plan_fingerprint_mismatch",
      db,
    );
    assertRefused({ operator_decision: null }, "operator_decision_missing", db);
    assertRefused(
      { operator_decision: "execute_handoff_plan_now" },
      "operator_decision_invalid",
      db,
    );
    assertRefused(
      {
        review_basis: {
          ...makeReviewBasis(),
          review_basis_ref: "",
        },
      },
      "review_basis_ref_missing",
      db,
    );
    assertRefused(
      {
        review_basis: {
          ...makeReviewBasis(),
          review_basis_fingerprint: "",
        },
      },
      "review_basis_fingerprint_missing",
      db,
    );
    assertRefused({ accepted_summary: null }, "accepted_summary_missing", db);
    assertRefused(
      {
        accepted_summary: {
          ...makeAcceptedSummary(handoffPlan),
          approval_scope: "execute_now",
        },
      },
      "accepted_summary_approval_scope_invalid",
      db,
    );
    assertRefused(
      {
        raw_material_probe: { raw_review_note: "operator says do it now" },
      },
      "raw_material_fields_present",
      db,
    );
    assertRefused(
      { raw_material_probe: { raw_reason_text: "because I said so" } },
      "raw_material_fields_present",
      db,
    );
    assertRefused(
      { raw_material_probe: { raw_prompt_text: "run the implementation" } },
      "raw_material_fields_present",
      db,
    );
    assertRefused(
      { raw_material_probe: { raw_pr_body: "full PR body text" } },
      "raw_material_fields_present",
      db,
    );
    assertRefused(
      { raw_material_probe: { raw_source_payload: "payload body" } },
      "raw_material_fields_present",
      db,
    );
    assertRefused(
      { raw_material_probe: { token: "sk-test_1234567890" } },
      "raw_material_fields_present",
      db,
    );
    assertRefused(
      { raw_material_probe: { operator_secret: "password=abc123" } },
      "raw_material_fields_present",
      db,
    );
    assertRefused(
      { raw_material_probe: { endpoint_url: "https://example.com" } },
      "raw_material_fields_present",
      db,
    );
    assertRefused(
      { raw_material_probe: { ENV_VALUE: "SECRET=value" } },
      "unsafe_string_material_present",
      db,
    );
    assertRefused(
      { raw_material_probe: { credential: "ghp_1234567890abcdef" } },
      "raw_material_fields_present",
      db,
    );

    const deferred = writeAutohuntHandoffPlanOperatorReviewDecision(
      makeDecisionInput({
        handoffPlan,
        operator_decision: "defer_handoff_plan_review",
        review_basis: makeReviewBasis("review-basis:defer"),
        defer_or_reject_summary: makeReasonSummary("needs_more_context"),
        accepted_summary: null,
      }),
      { db, now: "2026-07-09T05:02:00.000Z" },
    );
    assert.equal(deferred.ok, true);
    assert.equal(deferred.decision?.decision_status, "deferred");
    assert.equal(deferred.decision?.accepted_summary, null);
    assert.equal(
      deferred.decision?.defer_or_reject_summary?.reason_code,
      "needs_more_context",
    );

    const rejected = writeAutohuntHandoffPlanOperatorReviewDecision(
      makeDecisionInput({
        handoffPlan,
        operator_decision: "reject_handoff_plan_review",
        review_basis: makeReviewBasis("review-basis:reject"),
        defer_or_reject_summary: makeReasonSummary("out_of_scope"),
        accepted_summary: null,
      }),
      { db, now: "2026-07-09T05:03:00.000Z" },
    );
    assert.equal(rejected.ok, true);
    assert.equal(rejected.decision?.decision_status, "rejected");
    assert.equal(rejected.decision?.accepted_summary, null);
    assert.equal(
      rejected.decision?.defer_or_reject_summary?.reason_code,
      "out_of_scope",
    );

    const readback = readAutohuntHandoffPlanOperatorReviewDecisions({
      db,
      scope: "project:augnes",
    });
    assert.equal(
      readback.selection_status,
      "selected_latest_accepted_decision",
    );
    assert.equal(readback.accepted_decisions.length, 1);
    assert.equal(readback.deferred_decisions.length, 1);
    assert.equal(readback.rejected_decisions.length, 1);
    assert.equal(readback.invalid_record_count, 0);
    assert.equal(
      readback.selected_decision?.decision_fingerprint,
      computeAutohuntHandoffPlanOperatorReviewDecisionFingerprint(
        readback.selected_decision,
      ),
    );
    assert.equal(
      allValuesFalse(readback.no_run_no_execution_boundary),
      true,
    );
    assert.equal(readback.raw_material_persisted, false);
    assert.equal(readback.runner_started, false);
    assert.equal(readback.scheduler_started, false);
    assert.equal(readback.codex_executed, false);
    assert.equal(readback.github_called, false);
    assert.equal(readback.provider_openai_called, false);
    assert.equal(readback.sources_fetched, false);
    assert.equal(readback.retrieval_run, false);
    assert.equal(readback.memory_written, false);
    assert.equal(readback.perspective_promoted, false);
    assert.equal(readback.cwp_mutated, false);
    assert.equal(readback.work_mutated, false);
    assert.equal(readback.proof_or_evidence_written, false);
    assert.equal(readback.product_or_delivery_state_written, false);
    assert.equal(
      allValuesFalse(
        buildAutohuntHandoffPlanOperatorReviewDecisionAuthorityBoundary(),
      ),
      true,
    );
  } finally {
    db.close();
  }
}

function assertPanelPassive() {
  assert.doesNotMatch(source.panel, /<button\b/i);
  assert.doesNotMatch(source.panel, /\bonClick\b/);
  assert.doesNotMatch(source.panel, /\bfetch\s*\(/);
  assert.doesNotMatch(source.panel, /\bformAction\b/);
  assert.doesNotMatch(source.panel, /server action/i);
  assert.doesNotMatch(source.panel, /use server/i);
  assertContains(source.panel, [
    "auto_acceptance",
    "false",
    "creates no branch or PR",
    "performs no merge, deploy",
  ]);
}

function assertNoRuntimeImportsOrWorkbenchWrite() {
  for (const [label, text] of Object.entries({
    type: source.type,
    writer: source.writer,
    reader: source.reader,
    panel: source.panel,
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
      /from\s+["'][^"']*(retrieval|rag|embedding|vector|crawler|source-fetch)[^"']*["']/i,
      `${label} must not import retrieval or source-fetch code`,
    );
    assert.doesNotMatch(text, /\bfetch\s*\(/, `${label} must not fetch`);
    assert.doesNotMatch(
      text,
      /\bcreatePullRequest\b|\bcallGithub\b|\bexecuteCodex\b|\blaunchCodex\b/i,
    );
  }
  assert.doesNotMatch(
    source.agentWorkplane,
    /writeAutohuntHandoffPlanOperatorReviewDecision/,
    "Agent Workplane must not call the decision write helper",
  );
  assert.match(
    source.agentWorkplane,
    /AutohuntHandoffPlanOperatorReviewDecisionReadbackPanel/,
    "Agent Workplane may mount the passive decision readback panel",
  );
}

function assertRefused(overrides, expectedReason, db) {
  const handoffPlan = makeReadyHandoffPlan();
  const result = writeAutohuntHandoffPlanOperatorReviewDecision(
    makeDecisionInput({ handoffPlan, ...overrides }),
    { db },
  );
  assert.equal(result.result_status, "refused");
  assert(
    result.refusal_reasons.includes(expectedReason),
    `expected refusal ${expectedReason}, got ${result.refusal_reasons.join(", ")}`,
  );
}

function makeDecisionInput({
  handoffPlan,
  operator_decision = "accept_handoff_plan_for_future_supervised_copy_export_planning",
  review_basis = makeReviewBasis(),
  accepted_summary = makeAcceptedSummary(handoffPlan),
  defer_or_reject_summary = null,
  ...overrides
} = {}) {
  return {
    scope: "project:augnes",
    source_handoff_plan: handoffPlan,
    operator_decision,
    review_basis,
    accepted_summary,
    defer_or_reject_summary,
    ...overrides,
  };
}

function makeReviewBasis(ref = "review-basis:accept") {
  return {
    review_basis_ref: ref,
    reviewed_by: "operator:local",
    reviewed_at: "2026-07-09T05:00:00.000Z",
    review_basis_fingerprint: fingerprint({ ref }),
    raw_review_note_persisted: false,
  };
}

function makeAcceptedSummary(handoffPlan) {
  return {
    handoff_plan_id: handoffPlan.handoff_plan_id,
    handoff_plan_fingerprint: handoffPlan.handoff_plan_fingerprint,
    prompt_plan_id: handoffPlan.supervised_codex_prompt_plan.prompt_plan_id,
    review_packet_id: handoffPlan.operator_review_packet.review_packet_id,
    selected_candidate_count: handoffPlan.selected_candidate_plan_summaries.length,
    required_checks: [...handoffPlan.draft_pr_plan.checks_to_run],
    expected_changed_file_globs: [
      ...handoffPlan.draft_pr_plan.expected_changed_file_globs,
    ],
    max_changed_files: handoffPlan.draft_pr_plan.max_changed_files,
    approval_scope: "future_supervised_handoff_copy_export_planning_only",
  };
}

function makeReasonSummary(reasonCode) {
  return {
    reason_code: reasonCode,
    reason_fingerprint: fingerprint({ reasonCode }),
    raw_reason_text_persisted: false,
  };
}

function makeReadyHandoffPlan() {
  const selectedCandidateIds = ["candidate:autohunt-operator-review"];
  const selectedCandidateFingerprints = [
    fingerprint({ candidate: "autohunt-operator-review" }),
  ];
  const sourceGrantFingerprint = fingerprint({ grant: "active-autohunt" });
  const sourcePreflightFingerprint = fingerprint({
    preflight: "ready-for-handoff-plan",
  });
  const spineFingerprint = fingerprint({ spine: "ready" });
  const promptPlanMaterial = {
    prompt_plan_id: "prompt-plan:autohunt-operator-review",
    prompt_title: "Supervised Autohunt handoff plan preview",
    prompt_goal_summary:
      "Prepare a supervised handoff plan without executing work.",
    required_context_refs: ["context:preflight"],
    selected_source_refs: ["source:queue-candidate"],
    selected_source_fingerprints: [sourcePreflightFingerprint],
    implementation_constraints: ["no runner", "no Codex execution"],
    acceptance_criteria: ["decision remains readback-only"],
    required_checks: ["npm run typecheck"],
    expected_result_report_sections: ["Summary", "Checks run"],
    raw_prompt_text_persisted: false,
  };
  const rowCountSummary = {
    target_table_name: AUTOHUNT_HANDOFF_PLAN_PREVIEW_TABLE,
    target_before_count: 0,
    target_after_count: 1,
    target_delta: 1,
    target_table_changed: true,
    expected_target_delta: 1,
    target_delta_matches_expected: true,
    non_target_table_count: 0,
    non_target_changed_table_count: 0,
    all_non_target_row_counts_unchanged: true,
    rows: [
      {
        table_name: AUTOHUNT_HANDOFF_PLAN_PREVIEW_TABLE,
        before_count: 0,
        after_count: 1,
        delta: 1,
        changed: true,
      },
    ],
  };
  const planWithoutFingerprint = {
    handoff_plan_kind: AUTOHUNT_HANDOFF_PLAN_PREVIEW_KIND,
    handoff_plan_version: AUTOHUNT_HANDOFF_PLAN_PREVIEW_VERSION,
    handoff_plan_id: "handoff-plan:autohunt-operator-review",
    scope: "project:augnes",
    created_at: "2026-07-09T04:55:00.000Z",
    handoff_plan_status: "ready_for_operator_review",
    source_grant: {
      grant_id: "grant:active-autohunt",
      grant_fingerprint: sourceGrantFingerprint,
      grant_status: "active",
      grant_mode: "supervised_autohunt_planning",
    },
    source_preflight: {
      preflight_packet_id: "preflight:ready-for-handoff-plan",
      preflight_packet_fingerprint: sourcePreflightFingerprint,
      preflight_status: "ready_for_supervised_handoff_planning",
      selected_candidate_ids: selectedCandidateIds,
      selected_candidate_fingerprints: selectedCandidateFingerprints,
    },
    source_workbench_spine: {
      spine_fingerprint: spineFingerprint,
      spine_status: "ready_for_supervised_handoff_planning",
      chain_binding_summary: {
        grant_to_candidates_bound: true,
        candidates_to_preflight_bound: true,
        grant_fingerprint_matches: true,
        candidate_fingerprints_match: true,
        selected_candidate_ids: selectedCandidateIds,
        selected_candidate_fingerprints: selectedCandidateFingerprints,
      },
    },
    selected_candidate_plan_summaries: [
      {
        candidate_id: selectedCandidateIds[0],
        candidate_fingerprint: selectedCandidateFingerprints[0],
        candidate_origin: "operator_supplied",
        work_class: "small_refactor",
        title_summary_fingerprint: fingerprint({ title: "operator review" }),
        proposed_files_or_globs: [
          "types/autohunt-handoff-plan-operator-review-decision.ts",
          "lib/autonomy/**",
          "scripts/**",
        ],
        expected_outputs: ["handoff_plan_decision_report"],
        required_checks: ["npm run typecheck"],
        budget_projection: {
          estimated_iterations: 1,
          estimated_tool_calls: 4,
          estimated_codex_tasks: 0,
          estimated_file_changes: 4,
          estimated_draft_prs: 0,
        },
      },
    ],
    supervised_codex_prompt_plan: {
      ...promptPlanMaterial,
      prompt_text_fingerprint: fingerprint(promptPlanMaterial),
    },
    draft_pr_plan: {
      branch_name_preview:
        "codex/autohunt-handoff-plan-operator-review-decision-v0-1",
      pr_title_preview: "Autohunt handoff plan operator decision record",
      pr_body_sections: ["Summary", "Checks run"],
      expected_changed_file_globs: [
        "types/autohunt-handoff-plan-operator-review-decision.ts",
        "lib/autonomy/**",
        "scripts/**",
      ],
      max_changed_files: 6,
      checks_to_run: ["npm run typecheck"],
      reviewer_focus: ["authority boundary", "raw-material absence"],
      raw_pr_body_persisted: false,
    },
    operator_review_packet: {
      review_packet_id: "review-packet:autohunt-operator-review",
      review_status: "requires_explicit_operator_approval",
      review_questions: ["Accept for future copy/export planning?"],
      approval_required_before_execution: true,
      approval_required_before_branch_or_pr: true,
      approval_required_before_merge: true,
      approval_required_before_external_call: true,
      raw_operator_note_persisted: false,
    },
    aggregate_budget_projection: {
      estimated_iterations: 1,
      estimated_tool_calls: 4,
      estimated_codex_tasks: 0,
      estimated_file_changes: 4,
      estimated_draft_prs: 0,
    },
    blocked_actions: [...AUTOHUNT_HANDOFF_PLAN_PREVIEW_BLOCKED_ACTIONS],
    next_allowed_outputs: [...AUTOHUNT_HANDOFF_PLAN_PREVIEW_NEXT_ALLOWED_OUTPUTS],
    forbidden_outputs: [...AUTOHUNT_HANDOFF_PLAN_PREVIEW_FORBIDDEN_OUTPUTS],
    authority_boundary: buildAutohuntHandoffPlanPreviewAuthorityBoundary(),
    persisted_material_boundary: {
      persists_source_fingerprints: true,
      persists_handoff_plan_policy: true,
      persists_raw_prompt_text: false,
      persists_raw_pr_body: false,
      persists_raw_operator_note: false,
      persists_raw_source_payload: false,
      persists_secret_or_token: false,
      persists_url_or_env_value: false,
    },
    validation: {
      passed: true,
      fingerprint_algorithm: STABLE_FINGERPRINT_ALGORITHM,
      preflight_ready: true,
      preflight_fingerprint_verified: true,
      workbench_spine_ready: true,
      workbench_spine_fingerprint_verified: true,
      chain_binding_passed: true,
      selected_candidate_binding_verified: true,
      source_grant_binding_verified: true,
      aggregate_budget_matches_preflight: true,
      required_checks_present: true,
      required_blocked_actions_present: true,
      authority_boundary_all_false: true,
      persisted_material_boundary_safe: true,
      raw_material_absent: true,
      target_only_write_proven: true,
      handoff_plan_fingerprint: null,
    },
    row_count_write_summary: rowCountSummary,
    idempotency_key: fingerprint({ handoff_plan: "operator-review" }),
  };
  return {
    ...planWithoutFingerprint,
    handoff_plan_fingerprint:
      computeAutohuntHandoffPlanPreviewFingerprint(planWithoutFingerprint),
  };
}

function countRows(db, tableName) {
  const table = db
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name = ?
      `,
    )
    .get(tableName);
  if (!table) return 0;
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function collectAddedCreateTableNames(file) {
  try {
    const output = execFileSync("git", ["diff", "--", file], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return output
      .split("\n")
      .filter((line) => /^\+\s*CREATE TABLE IF NOT EXISTS\b/i.test(line))
      .map((line) =>
        line
          .replace(/^\+\s*CREATE TABLE IF NOT EXISTS\s+/i, "")
          .replace(/\s*\(.*/, "")
          .trim(),
      )
      .filter(Boolean);
  } catch {
    return [];
  }
}

function extractTargetTableBlock(text) {
  const start = text.indexOf(
    `CREATE TABLE IF NOT EXISTS ${AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_TABLE}`,
  );
  assert(start !== -1, "target table block must be present");
  const end = text.indexOf("CREATE INDEX", start);
  assert(end > start, "target table block must be followed by indexes");
  return text.slice(start, end);
}

function collectChangedFiles() {
  return uniqueSorted([
    ...collectGitFiles(["diff", "--name-only"]),
    ...collectGitFiles(["diff", "--cached", "--name-only"]),
    ...collectGitFiles(["ls-files", "--others", "--exclude-standard"]),
    ...getBaseRangeChangedFiles().files,
  ]);
}

function collectGitFiles(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" })
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function assertContains(text, phrases) {
  const normalizedText = text.replace(/\s+/g, " ");
  for (const phrase of phrases) {
    assert(
      normalizedText.includes(phrase.replace(/\s+/g, " ")),
      `Expected source to contain ${JSON.stringify(phrase)}`,
    );
  }
}
