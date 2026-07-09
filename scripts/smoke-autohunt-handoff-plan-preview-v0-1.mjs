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
import { writeAutonomyDelegationGrant } from "../lib/autonomy/autonomy-delegation-grant-write.ts";
import {
  buildAutonomyDelegationGrantAuthorityBoundary,
  ensureAutonomyDelegationGrantSchema,
  readAutonomyDelegationGrants,
} from "../lib/autonomy/read-autonomy-delegation-grants.ts";
import { writeAutohuntWorkQueueCandidate } from "../lib/autonomy/autohunt-work-queue-candidate-write.ts";
import {
  ensureAutohuntWorkQueueCandidateSchema,
  readAutohuntWorkQueueCandidates,
} from "../lib/autonomy/read-autohunt-work-queue-candidates.ts";
import { writeAutohuntPreflightPacket } from "../lib/autonomy/autohunt-preflight-packet-write.ts";
import {
  computeAutohuntPreflightPacketFingerprint,
  ensureAutohuntPreflightPacketSchema,
  readAutohuntPreflightPackets,
} from "../lib/autonomy/read-autohunt-preflight-packets.ts";
import { buildAutohuntWorkbenchReadbackSpine } from "../lib/autonomy/autohunt-workbench-readback-spine.ts";
import { writeAutohuntHandoffPlanPreview } from "../lib/autonomy/autohunt-handoff-plan-preview-write.ts";
import {
  buildAutohuntHandoffPlanPreviewAuthorityBoundary,
  computeAutohuntHandoffPlanPreviewFingerprint,
  ensureAutohuntHandoffPlanPreviewSchema,
  readAutohuntHandoffPlanPreviews,
} from "../lib/autonomy/read-autohunt-handoff-plan-previews.ts";
import {
  fingerprint,
  stableJson,
} from "../lib/research-candidate-review/shared-source-chain-guards.ts";
import {
  AUTONOMY_DELEGATION_GRANT_ALLOWED_ACTIONS,
  AUTONOMY_DELEGATION_GRANT_ALLOWED_OUTPUTS,
  AUTONOMY_DELEGATION_GRANT_ALLOWED_WORK_CLASSES,
  AUTONOMY_DELEGATION_GRANT_FORBIDDEN_ACTIONS,
  AUTONOMY_DELEGATION_GRANT_FORBIDDEN_OUTPUTS,
  AUTONOMY_DELEGATION_GRANT_FORBIDDEN_WORK_CLASSES,
  AUTONOMY_DELEGATION_GRANT_STOP_CONDITIONS,
  AUTONOMY_DELEGATION_GRANT_TABLE,
} from "../types/autonomy-delegation-grant.ts";
import {
  AUTOHUNT_WORK_QUEUE_CANDIDATE_TABLE,
} from "../types/autohunt-work-queue-candidate.ts";
import {
  AUTOHUNT_PREFLIGHT_PACKET_TABLE,
} from "../types/autohunt-preflight-packet.ts";
import {
  AUTOHUNT_HANDOFF_PLAN_PREVIEW_AUTHORITY_FLAG_NAMES,
  AUTOHUNT_HANDOFF_PLAN_PREVIEW_BLOCKED_ACTIONS,
  AUTOHUNT_HANDOFF_PLAN_PREVIEW_TABLE,
} from "../types/autohunt-handoff-plan-preview.ts";
import { RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_PROTECTED_ROW_COUNT_TABLES } from "../types/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-result.ts";

const files = {
  type: "types/autohunt-handoff-plan-preview.ts",
  writer: "lib/autonomy/autohunt-handoff-plan-preview-write.ts",
  reader: "lib/autonomy/read-autohunt-handoff-plan-previews.ts",
  panel:
    "components/autonomy/autohunt-handoff-plan-preview-readback-panel.tsx",
  operatorDecisionType:
    "types/autohunt-handoff-plan-operator-review-decision.ts",
  operatorDecisionWriter:
    "lib/autonomy/autohunt-handoff-plan-operator-review-decision-write.ts",
  operatorDecisionReader:
    "lib/autonomy/read-autohunt-handoff-plan-operator-review-decisions.ts",
  operatorDecisionPanel:
    "components/autonomy/autohunt-handoff-plan-operator-review-decision-readback-panel.tsx",
  agentWorkplane: "components/workplane/agent-workplane.tsx",
  db: "lib/db.ts",
  schema: "lib/db/schema.sql",
  migrations: "scripts/db-migrations.mjs",
  migrate: "scripts/db-migrate.mjs",
  smoke: "scripts/smoke-autohunt-handoff-plan-preview-v0-1.mjs",
  mountSmoke:
    "scripts/smoke-autohunt-handoff-plan-preview-workbench-mount-v0-1.mjs",
  operatorDecisionSmoke:
    "scripts/smoke-autohunt-handoff-plan-operator-review-decision-v0-1.mjs",
  operatorDecisionWorkbenchMountSmoke:
    "scripts/smoke-autohunt-handoff-plan-operator-review-decision-workbench-mount-v0-1.mjs",
  packageJson: "package.json",
  workbenchSpineSmoke:
    "scripts/smoke-autohunt-workbench-readback-spine-v0-1.mjs",
  preflightSmoke: "scripts/smoke-autohunt-preflight-packet-v0-1.mjs",
  queueCandidateSmoke: "scripts/smoke-autohunt-work-queue-candidate-v0-1.mjs",
  delegationGrantSmoke:
    "scripts/smoke-autonomy-delegation-grant-record-v0-1.mjs",
  sharedSourceGuardSmoke: "scripts/smoke-shared-source-chain-guards-v0-1.mjs",
  agentWorkplanePanelsSmoke: "scripts/smoke-agent-workplane-panels-v0-1.mjs",
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
assertForbiddenImportsAbsent();

console.log(
  JSON.stringify(
    {
      smoke: "autohunt-handoff-plan-preview-v0-1",
      pass: true,
      target_table: AUTOHUNT_HANDOFF_PLAN_PREVIEW_TABLE,
      expected_changed_files_checked: true,
      docs_changed: false,
      write_helper_checked: true,
      readback_helper_checked: true,
      panel_passive_checked: true,
      target_only_write_checked: true,
      duplicate_replay_checked: true,
      source_chain_refusals_checked: true,
      unsafe_input_refusals_checked: true,
      latest_ready_readback_checked: true,
      no_runner_or_external_authority_checked: true,
      raw_material_persistence_checked: true,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:autohunt-handoff-plan-preview-v0-1");

function assertChangedFileBoundary() {
  const changedFiles = uniqueSorted([
    ...collectGitFiles(["diff", "--name-only"]),
    ...collectGitFiles(["diff", "--cached", "--name-only"]),
    ...collectGitFiles(["ls-files", "--others", "--exclude-standard"]),
    ...getBaseRangeChangedFiles().files,
  ]);

  for (const file of changedFiles) {
    assert(
      expectedChangedFiles.has(file),
      `Unexpected changed file for autohunt handoff plan preview slice: ${file}`,
    );
    assert.doesNotMatch(file, /^docs\//, "handoff plan preview must not edit docs");
    assert.doesNotMatch(file, /^README/i, "handoff plan preview must not edit README");
    assert.doesNotMatch(file, /^app\/api\//, "handoff plan preview must not edit routes");
    assert.doesNotMatch(file, /^app\//, "handoff plan preview must not edit app surfaces");
    assert.doesNotMatch(file, /package-lock|pnpm-lock|yarn\.lock/, "package lock must not change");
  }
}

function assertTypeAndHelperFiles() {
  assertContains(source.type, [
    "AUTOHUNT_HANDOFF_PLAN_PREVIEW_KIND",
    "AUTOHUNT_HANDOFF_PLAN_PREVIEW_VERSION",
    "AUTOHUNT_HANDOFF_PLAN_PREVIEW_TABLE",
    "ready_for_operator_review",
    "missing_ready_preflight_packet",
    "source_preflight",
    "source_workbench_spine",
    "supervised_codex_prompt_plan",
    "draft_pr_plan",
    "operator_review_packet",
    "raw_prompt_text_persisted: false",
    "raw_pr_body_persisted: false",
    "raw_operator_note_persisted: false",
    "handoff_plan_fingerprint",
  ], files.type);
  assertContains(source.writer, [
    "writeAutohuntHandoffPlanPreview",
    "validateAutohuntHandoffPlanPreviewInput",
    "buildDeterministicIdempotencyKey",
    "findForbiddenRawMaterialFields",
    "containsForbiddenRawMaterial",
    "assertAllFalseBoundary",
    "requiredStringFieldsPresent",
    "validateSourceBindingPairs",
    "summarizeTargetOnlyRowCountWrite",
    "BEGIN IMMEDIATE",
    "target_only_autohunt_handoff_plan_preview_row_count_proof_failed",
  ], files.writer);
  assertContains(source.reader, [
    "readAutohuntHandoffPlanPreviews",
    "ensureAutohuntHandoffPlanPreviewSchema",
    "computeAutohuntHandoffPlanPreviewFingerprint",
    "latest_ready_handoff_plan",
    "blocked_handoff_plans",
    "insufficient_data_handoff_plans",
    "no_run_no_execution_boundary",
  ], files.reader);
  assertContains(source.panel, [
    "AutohuntHandoffPlanPreviewReadbackPanel",
    "selected plan",
    "selected candidates",
    "prompt plan",
    "draft PR plan",
    "operator review",
    "authority boundary",
    "material boundary",
    "row counts",
  ], files.panel);
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
      text.includes("autohunt_handoff_plan_previews"),
      `${label} must wire target table`,
    );
  }

  const db = new Database(":memory:");
  try {
    ensureAutohuntHandoffPlanPreviewSchema(db);
    const columns = db
      .prepare("PRAGMA table_info(autohunt_handoff_plan_previews)")
      .all();
    const columnNames = columns.map((column) => column.name);
    assert.deepEqual(columnNames, [
      "handoff_plan_id",
      "created_at",
      "scope",
      "handoff_plan_status",
      "source_grant_id",
      "source_grant_fingerprint",
      "source_grant_status",
      "source_grant_mode",
      "source_preflight_packet_id",
      "source_preflight_packet_fingerprint",
      "source_workbench_spine_fingerprint",
      "selected_candidate_ids_json",
      "selected_candidate_fingerprints_json",
      "idempotency_key",
      "selected_candidate_plan_summaries_json",
      "supervised_codex_prompt_plan_json",
      "draft_pr_plan_json",
      "operator_review_packet_json",
      "aggregate_budget_projection_json",
      "blocked_actions_json",
      "next_allowed_outputs_json",
      "forbidden_outputs_json",
      "authority_boundary_json",
      "persisted_material_boundary_json",
      "validation_json",
      "row_count_write_summary_json",
      "handoff_plan_fingerprint",
    ]);
    for (const columnName of columnNames) {
      assert.doesNotMatch(columnName, /^raw/i, "raw columns must not exist");
      assert.doesNotMatch(columnName, /raw_prompt/i);
      assert.doesNotMatch(columnName, /raw_pr_body/i);
      assert.doesNotMatch(columnName, /operator_note/i);
      assert.doesNotMatch(columnName, /source_payload/i);
      assert.doesNotMatch(columnName, /\btoken\b/i);
      assert.doesNotMatch(columnName, /\bsecret\b/i);
      assert.doesNotMatch(columnName, /\burl\b/i);
      assert.doesNotMatch(columnName, /\benv\b/i);
      assert.doesNotMatch(columnName, /credential/i);
    }
    const indexes = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'autohunt_handoff_plan_previews'",
      )
      .all()
      .map((index) => index.name);
    for (const indexName of [
      "idx_autohunt_handoff_plan_previews_scope_created",
      "idx_autohunt_handoff_plan_previews_source_grant_id_created",
      "idx_autohunt_handoff_plan_previews_source_preflight_packet_id_created",
      "idx_autohunt_handoff_plan_previews_handoff_plan_status_created",
    ]) {
      assert(indexes.includes(indexName), `${indexName} must exist`);
    }
  } finally {
    db.close();
  }
}

function assertPackageScriptWiring() {
  assertPackageScript({
    packageJsonText: source.packageJson,
    scriptName: "smoke:autohunt-handoff-plan-preview-v0-1",
    expectedCommand:
      "tsx --tsconfig tsconfig.json scripts/smoke-autohunt-handoff-plan-preview-v0-1.mjs",
  });
}

function assertWriteReadBehavior() {
  const db = new Database(":memory:");
  try {
    ensureChainSchemas(db);
    const chain = buildReadySourceChain(db, {
      approvalRef: "approval:handoff-plan-active",
      sourceFingerprint: "fnv1a32_canonical_json_v0_1:handoff001",
      candidateTitle: "Ready handoff plan candidate",
      nowPrefix: "2026-07-09T03:10",
    });

    const beforeTarget = countRows(db, AUTOHUNT_HANDOFF_PLAN_PREVIEW_TABLE);
    const beforeGrant = countRows(db, AUTONOMY_DELEGATION_GRANT_TABLE);
    const beforeQueue = countRows(db, AUTOHUNT_WORK_QUEUE_CANDIDATE_TABLE);
    const beforePreflight = countRows(db, AUTOHUNT_PREFLIGHT_PACKET_TABLE);
    const accepted = writeAutohuntHandoffPlanPreview(
      makeHandoffInput(chain.preflightPacket, chain.spine),
      {
        db,
        now: "2026-07-09T03:20:00.000Z",
      },
    );
    assert.equal(
      accepted.result_status,
      "written",
      JSON.stringify(accepted.refusal_reasons),
    );
    assert.equal(accepted.ok, true);
    assert.equal(
      accepted.handoff_plan?.handoff_plan_status,
      "ready_for_operator_review",
    );
    assert.equal(accepted.handoff_plan_record_written, true);
    assert.equal(
      countRows(db, AUTOHUNT_HANDOFF_PLAN_PREVIEW_TABLE),
      beforeTarget + 1,
    );
    assert.equal(countRows(db, AUTONOMY_DELEGATION_GRANT_TABLE), beforeGrant);
    assert.equal(countRows(db, AUTOHUNT_WORK_QUEUE_CANDIDATE_TABLE), beforeQueue);
    assert.equal(countRows(db, AUTOHUNT_PREFLIGHT_PACKET_TABLE), beforePreflight);
    assert.equal(accepted.row_count_write_summary?.target_delta, 1);
    assert.equal(
      accepted.row_count_write_summary?.target_delta_matches_expected,
      true,
    );
    assert.equal(
      accepted.row_count_write_summary?.all_non_target_row_counts_unchanged,
      true,
    );
    assert.equal(
      accepted.row_count_write_summary?.non_target_changed_table_count,
      0,
    );
    assertRowCountSummaryIncludesProtectedTables(
      accepted.row_count_write_summary,
    );
    assertNoAuthority(accepted);
    assertNoHandoffPlanAuthority(accepted.handoff_plan);
    assert.equal(
      accepted.handoff_plan?.handoff_plan_fingerprint,
      computeAutohuntHandoffPlanPreviewFingerprint(accepted.handoff_plan),
    );
    assert.equal(
      accepted.handoff_plan?.supervised_codex_prompt_plan
        .raw_prompt_text_persisted,
      false,
    );
    assert.equal(accepted.handoff_plan?.draft_pr_plan.raw_pr_body_persisted, false);
    assert.equal(
      accepted.handoff_plan?.operator_review_packet.raw_operator_note_persisted,
      false,
    );

    const duplicate = writeAutohuntHandoffPlanPreview(
      makeHandoffInput(chain.preflightPacket, chain.spine),
      {
        db,
        now: "2026-07-09T03:21:00.000Z",
      },
    );
    assert.equal(duplicate.result_status, "duplicate_replayed");
    assert.equal(duplicate.duplicate_replayed, true);
    assert.equal(duplicate.handoff_plan_record_written, false);
    assert.equal(
      countRows(db, AUTOHUNT_HANDOFF_PLAN_PREVIEW_TABLE),
      beforeTarget + 1,
    );

    assertRefused(db, chain, { source_preflight: null });
    assertRefused(db, chain, {
      source_preflight: refreshPreflightFingerprint({
        ...chain.preflightPacket,
        preflight_status: "blocked",
      }),
    });
    assertRefused(db, chain, { source_workbench_spine: null });
    assertRefused(db, chain, {
      source_workbench_spine: refreshSpineFingerprint({
        ...chain.spine,
        spine_status: "missing_preflight_packet",
      }),
    });
    assertRefused(db, chain, {
      source_workbench_spine: refreshSpineFingerprint({
        ...chain.spine,
        chain_binding: {
          ...chain.spine.chain_binding,
          grant_to_candidates_bound: false,
        },
      }),
    });
    assertRefused(db, chain, {
      source_workbench_spine: refreshSpineFingerprint({
        ...chain.spine,
        chain_binding: {
          ...chain.spine.chain_binding,
          selected_candidate_ids: ["candidate:mismatch"],
        },
      }),
    });
    assertRefused(db, chain, {
      source_workbench_spine: refreshSpineFingerprint({
        ...chain.spine,
        latest_active_grant_summary: {
          ...chain.spine.latest_active_grant_summary,
          grant_id: "autonomy-delegation-grant:mismatch",
        },
      }),
    });
    assertRefused(db, chain, {
      source_preflight: refreshPreflightFingerprint({
        ...chain.preflightPacket,
        required_checks: [],
        selected_candidates: chain.preflightPacket.selected_candidates.map(
          (candidate) => ({ ...candidate, required_checks: [] }),
        ),
      }),
    });
    assertRefused(db, chain, {
      blocked_actions: AUTOHUNT_HANDOFF_PLAN_PREVIEW_BLOCKED_ACTIONS.filter(
        (action) => action !== "execute_codex",
      ),
    });
    assertRefused(db, chain, { raw_prompt_text: "prompt body" });
    assertRefused(db, chain, { raw_pr_body: "PR body" });
    assertRefused(db, chain, { raw_operator_note: "operator note body" });
    assertRefused(db, chain, { raw_source_payload: "source body" });
    assertRefused(db, chain, { token: "token=value" });
    assertRefused(db, chain, { secret: "secret=value" });
    assertRefused(db, chain, { callback_url: "https://example.invalid/source" });
    assertRefused(db, chain, { env: "OPENAI_API_KEY=sk-not-real-value" });
    assertRefused(db, chain, { raw_material_probe: { api_key: "sk-not-real-value" } });

    const secondChain = buildReadySourceChain(db, {
      approvalRef: "approval:handoff-plan-second",
      sourceFingerprint: "fnv1a32_canonical_json_v0_1:handoff002",
      candidateTitle: "Second ready handoff plan candidate",
      nowPrefix: "2026-07-09T03:12",
    });
    const secondReady = writeAutohuntHandoffPlanPreview(
      makeHandoffInput(secondChain.preflightPacket, secondChain.spine),
      {
        db,
        now: "2026-07-09T03:22:00.000Z",
      },
    );
    assert.equal(secondReady.ok, true);

    const readback = readAutohuntHandoffPlanPreviews({ db });
    assert.equal(
      readback.selection_status,
      "selected_latest_ready_handoff_plan",
    );
    assert.equal(readback.ready_handoff_plans.length, 2);
    assert.equal(readback.invalid_record_count, 0);
    assert.equal(
      readback.selected_handoff_plan?.handoff_plan_id,
      secondReady.handoff_plan?.handoff_plan_id,
    );
    assert.equal(
      readback.selected_handoff_plan?.handoff_plan_fingerprint,
      computeAutohuntHandoffPlanPreviewFingerprint(
        readback.selected_handoff_plan,
      ),
    );
    assertNoReadbackAuthority(readback);

    const byId = readAutohuntHandoffPlanPreviews({
      db,
      handoff_plan_id: accepted.handoff_plan?.handoff_plan_id,
    });
    assert.equal(byId.selection_status, "selected_by_handoff_plan_id");
    assert.equal(
      byId.selected_handoff_plan?.handoff_plan_id,
      accepted.handoff_plan?.handoff_plan_id,
    );
  } finally {
    db.close();
  }

  const tamperDb = new Database(":memory:");
  try {
    ensureChainSchemas(tamperDb);
    const chain = buildReadySourceChain(tamperDb, {
      approvalRef: "approval:handoff-plan-tamper",
      sourceFingerprint: "fnv1a32_canonical_json_v0_1:handoff099",
      candidateTitle: "Tamper handoff plan candidate",
      nowPrefix: "2026-07-09T03:14",
    });
    const result = writeAutohuntHandoffPlanPreview(
      makeHandoffInput(chain.preflightPacket, chain.spine),
      {
        db: tamperDb,
        now: "2026-07-09T03:30:00.000Z",
      },
    );
    assert.equal(result.ok, true);
    tamperDb
      .prepare(
        "UPDATE autohunt_handoff_plan_previews SET handoff_plan_fingerprint = ? WHERE handoff_plan_id = ?",
      )
      .run("tampered", result.handoff_plan?.handoff_plan_id);
    const tamperedReadback = readAutohuntHandoffPlanPreviews({ db: tamperDb });
    assert.equal(tamperedReadback.invalid_record_count, 1);
    assert.equal(tamperedReadback.selected_handoff_plan, null);
  } finally {
    tamperDb.close();
  }
}

function assertPanelPassive() {
  assert.doesNotMatch(source.panel, /<button\b/i);
  assert.doesNotMatch(source.panel, /\bonClick\b/);
  assert.doesNotMatch(source.panel, /\bfetch\s*\(/);
  assert.doesNotMatch(source.panel, /\bformAction\b/);
  assert.doesNotMatch(source.panel, /server action/i);
  assert.doesNotMatch(source.panel, /use server/i);
}

function assertForbiddenImportsAbsent() {
  for (const [label, text] of Object.entries({
    [files.type]: source.type,
    [files.writer]: source.writer,
    [files.reader]: source.reader,
    [files.panel]: source.panel,
  })) {
    const importLines = text
      .split("\n")
      .filter((line) => line.trim().startsWith("import "));
    const imports = importLines.join("\n");
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
    assert.doesNotMatch(text, /\bfetch\s*\(/, `${label} must not fetch sources`);
    assert.doesNotMatch(
      text,
      /\bcreatePullRequest\b|\bcallGithub\b|\bexecuteCodex\b|\blaunchCodex\b/i,
    );
  }
}

function buildReadySourceChain(db, {
  approvalRef,
  sourceFingerprint,
  candidateTitle,
  nowPrefix,
}) {
  const grant = writeGrant(db, "active", approvalRef, nowPrefix).grant;
  assert(grant, "active grant must write");
  const candidate = writeCandidate(db, grant, {
    title: candidateTitle,
    source_fingerprints: [sourceFingerprint],
  }).candidate;
  assert(candidate, "queued candidate must write");
  const queueReadback = readAutohuntWorkQueueCandidates({
    db,
    source_grant_id: grant.grant_id,
    candidate_status: "queued",
  });
  const preflightResult = writeAutohuntPreflightPacket(
    {
      scope: "project:augnes",
      source_grant: grant,
      source_queue: queueReadback,
    },
    {
      db,
      now: `${nowPrefix}:30.000Z`,
    },
  );
  assert.equal(
    preflightResult.ok,
    true,
    JSON.stringify(preflightResult.refusal_reasons),
  );
  assert(preflightResult.preflight_packet, "preflight packet must write");

  const grantReadback = readAutonomyDelegationGrants({ db });
  const preflightReadback = readAutohuntPreflightPackets({
    db,
    source_grant_id: grant.grant_id,
  });
  const spine = buildAutohuntWorkbenchReadbackSpine({
    grant_readback: grantReadback,
    queue_readback: queueReadback,
    preflight_readback: preflightReadback,
    as_of: `${nowPrefix}:40.000Z`,
  });
  assert.equal(spine.spine_status, "ready_for_supervised_handoff_planning");

  return {
    grant,
    candidate,
    preflightPacket: preflightResult.preflight_packet,
    spine,
  };
}

function writeGrant(db, grantStatus, approvalRef, nowPrefix) {
  const result = writeAutonomyDelegationGrant(
    makeGrantInput({
      grant_status: grantStatus,
      explicit_user_approval: { approval_ref: approvalRef },
    }),
    {
      db,
      now: `${nowPrefix}:00.000Z`,
    },
  );
  assert.equal(result.ok, true, `${grantStatus} grant should write`);
  return result;
}

function writeCandidate(db, sourceGrant, overrides = {}) {
  const result = writeAutohuntWorkQueueCandidate(
    makeCandidateInput(sourceGrant, overrides),
    {
      db,
      now: `2026-07-09T03:1${String(overrides.title ?? "").length % 10}:10.000Z`,
    },
  );
  assert.equal(result.ok, true, "queue candidate should write");
  return result;
}

function makeGrantInput(overrides = {}) {
  const base = {
    scope: "project:augnes",
    grant_status: "active",
    grant_mode: "supervised_autohunt_planning",
    explicit_user_approval: {
      approval_ref: "approval:autohunt-handoff-plan:v0.1",
      approved_by: "operator",
      approved_at: "2026-07-09T03:00:00.000Z",
      approval_basis: "explicit bounded handoff plan preview approval",
      approval_text_fingerprint: "fnv1a32_canonical_json_v0_1:approval101",
      raw_approval_text_persisted: false,
    },
    source_autonomy_contract: {
      contract_id: "autonomy_contract.sample.phase_8a.v0.1",
      contract_fingerprint: "fnv1a32_canonical_json_v0_1:contract101",
      contract_version: "autonomy_contract.v0.1",
      autonomy_mode: "scheduled_hunt_preview",
      source_refs: ["autonomy-contract:fixture"],
    },
    allowed_work_classes: [
      AUTONOMY_DELEGATION_GRANT_ALLOWED_WORK_CLASSES[0],
      AUTONOMY_DELEGATION_GRANT_ALLOWED_WORK_CLASSES[2],
      AUTONOMY_DELEGATION_GRANT_ALLOWED_WORK_CLASSES[3],
    ],
    forbidden_work_classes: [
      ...AUTONOMY_DELEGATION_GRANT_FORBIDDEN_WORK_CLASSES,
    ],
    allowed_actions: [...AUTONOMY_DELEGATION_GRANT_ALLOWED_ACTIONS],
    forbidden_actions: [...AUTONOMY_DELEGATION_GRANT_FORBIDDEN_ACTIONS],
    budget: {
      time_limit_minutes: 30,
      max_iterations: 2,
      max_tool_calls: 20,
      max_codex_tasks: 0,
      max_draft_prs: 0,
      max_file_changes: 8,
      max_changed_files_per_pr: 8,
      allowed_file_globs: [
        "types/**",
        "lib/autonomy/**",
        "components/autonomy/**",
        "scripts/**",
      ],
      forbidden_file_globs: ["app/api/**", "docs/**"],
      retry_limit: 1,
      failure_threshold: 1,
      requires_budget_refresh_after: ["budget_exhausted", "scope_change"],
    },
    reporting_cadence: {
      mode: "manual",
      interval_description: "report after bounded handoff plan preview write",
      minimum_report_fields: [
        "handoff_plan_id",
        "handoff_plan_status",
        "source_chain_status",
      ],
      report_target_surface: "operator_report",
    },
    stop_conditions: [...AUTONOMY_DELEGATION_GRANT_STOP_CONDITIONS],
    allowed_outputs: [...AUTONOMY_DELEGATION_GRANT_ALLOWED_OUTPUTS],
    forbidden_outputs: [...AUTONOMY_DELEGATION_GRANT_FORBIDDEN_OUTPUTS],
    revocation: {
      revoked_by: null,
      revoked_at: null,
      revocation_reason: null,
      supersedes_grant_id: null,
      superseded_by_grant_id: null,
    },
    authority_boundary: buildAutonomyDelegationGrantAuthorityBoundary(),
    persisted_material_boundary: {
      persists_source_fingerprints: true,
      persists_budget: true,
      persists_policy: true,
      persists_raw_user_approval_text: false,
      persists_raw_prompt: false,
      persists_raw_operator_note: false,
      persists_secret_or_token: false,
      persists_url_or_env_value: false,
    },
  };
  return deepMerge(base, overrides);
}

function makeCandidateInput(sourceGrant, overrides = {}) {
  const base = {
    scope: "project:augnes",
    candidate_origin: "continuity_spine_summary",
    source_grant: sourceGrant,
    work_class: "small_refactor",
    title: "Bounded handoff plan queue candidate",
    summary: "Queue candidate for future supervised Autohunt handoff plan preview.",
    source_refs: ["workplane-continuity-spine-summary:fixture"],
    source_fingerprints: ["fnv1a32_canonical_json_v0_1:source101"],
    evidence_refs: [],
    required_context_refs: ["context:workplane-summary"],
    proposed_files_or_globs: [
      "types/autohunt-handoff-plan-preview.ts",
      "lib/autonomy/autohunt-handoff-plan-preview-write.ts",
      "components/autonomy/autohunt-handoff-plan-preview-readback-panel.tsx",
      "scripts/smoke-autohunt-handoff-plan-preview-v0-1.mjs",
    ],
    expected_outputs: ["operator_review_packet"],
    required_checks: ["npm run smoke:autohunt-handoff-plan-preview-v0-1"],
    blocked_actions: [],
    stop_conditions: [
      "manual_stop_requested",
      "authority_boundary_unclear",
      "budget_exhausted",
      "forbidden_action_requested",
    ],
    budget_projection: {
      estimated_iterations: 1,
      estimated_tool_calls: 4,
      estimated_codex_tasks: 0,
      estimated_file_changes: 4,
      estimated_draft_prs: 0,
    },
    proposed_actions: ["read_repo", "report_result"],
  };
  return deepMerge(base, overrides);
}

function makeHandoffInput(sourcePreflight, sourceWorkbenchSpine, overrides = {}) {
  const base = {
    scope: "project:augnes",
    source_preflight: sourcePreflight,
    source_workbench_spine: sourceWorkbenchSpine,
  };
  return deepMerge(base, overrides);
}

function assertRefused(db, chain, overrides) {
  const result = writeAutohuntHandoffPlanPreview(
    makeHandoffInput(chain.preflightPacket, chain.spine, overrides),
    {
      db,
      now: "2026-07-09T03:40:00.000Z",
    },
  );
  assert.equal(result.result_status, "refused");
  assert.equal(result.ok, false);
  assert.equal(result.handoff_plan_record_written, false);
  assertNoAuthority(result);
}

function ensureChainSchemas(db) {
  ensureAutonomyDelegationGrantSchema(db);
  ensureAutohuntWorkQueueCandidateSchema(db);
  ensureAutohuntPreflightPacketSchema(db);
  ensureAutohuntHandoffPlanPreviewSchema(db);
}

function refreshPreflightFingerprint(packet) {
  const firstPass = {
    ...packet,
    validation: {
      ...packet.validation,
      preflight_packet_fingerprint: null,
    },
  };
  const innerFingerprint = computeAutohuntPreflightPacketFingerprint(firstPass);
  const finalPacket = {
    ...packet,
    validation: {
      ...packet.validation,
      preflight_packet_fingerprint: innerFingerprint,
    },
  };
  return {
    ...finalPacket,
    preflight_packet_fingerprint:
      computeAutohuntPreflightPacketFingerprint(finalPacket),
  };
}

function refreshSpineFingerprint(spine) {
  const { spine_fingerprint: _spineFingerprint, ...sourceForFingerprint } =
    spine;
  return {
    ...spine,
    spine_fingerprint: fingerprint(sourceForFingerprint),
  };
}

function assertRowCountSummaryIncludesProtectedTables(summary) {
  assert(summary, "row-count summary must exist");
  const tableNames = summary.rows.map((row) => row.table_name);
  assert(tableNames.includes(AUTONOMY_DELEGATION_GRANT_TABLE));
  assert(tableNames.includes(AUTOHUNT_WORK_QUEUE_CANDIDATE_TABLE));
  assert(tableNames.includes(AUTOHUNT_PREFLIGHT_PACKET_TABLE));
  for (const tableName of RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_PROTECTED_ROW_COUNT_TABLES) {
    assert(tableNames.includes(tableName), `${tableName} must be checked`);
  }
}

function assertNoAuthority(result) {
  for (const key of AUTOHUNT_HANDOFF_PLAN_PREVIEW_AUTHORITY_FLAG_NAMES) {
    assert.equal(result[key], false, `${key} must remain false`);
  }
  assert.equal(result.raw_material_persisted, false);
}

function assertNoHandoffPlanAuthority(handoffPlan) {
  assert(handoffPlan, "handoff plan must exist");
  assert.deepEqual(
    handoffPlan.authority_boundary,
    buildAutohuntHandoffPlanPreviewAuthorityBoundary(),
  );
  for (const [key, value] of Object.entries(handoffPlan.authority_boundary)) {
    assert.equal(value, false, `${key} must remain false`);
  }
  assert.equal(
    handoffPlan.persisted_material_boundary.persists_raw_prompt_text,
    false,
  );
  assert.equal(handoffPlan.persisted_material_boundary.persists_raw_pr_body, false);
  assert.equal(
    handoffPlan.persisted_material_boundary.persists_raw_operator_note,
    false,
  );
  assert.equal(
    handoffPlan.persisted_material_boundary.persists_raw_source_payload,
    false,
  );
  assert.equal(
    handoffPlan.persisted_material_boundary.persists_secret_or_token,
    false,
  );
  assert.equal(
    handoffPlan.persisted_material_boundary.persists_url_or_env_value,
    false,
  );
  for (const action of AUTOHUNT_HANDOFF_PLAN_PREVIEW_BLOCKED_ACTIONS) {
    assert(
      handoffPlan.blocked_actions.includes(action),
      `${action} must remain blocked`,
    );
  }
}

function assertNoReadbackAuthority(readback) {
  for (const [key, value] of Object.entries(readback.no_run_no_execution_boundary)) {
    assert.equal(value, false, `${key} must remain false`);
  }
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
}

function countRows(db, tableName) {
  return db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get().count;
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

function assertContains(text, requiredPhrases, label) {
  const normalized = text.replace(/\s+/g, " ");
  for (const phrase of requiredPhrases) {
    assert(
      normalized.includes(phrase.replace(/\s+/g, " ")),
      `${label} must contain ${phrase}`,
    );
  }
}

function deepMerge(base, overrides) {
  const output = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      base[key] &&
      typeof base[key] === "object" &&
      !Array.isArray(base[key])
    ) {
      output[key] = deepMerge(base[key], value);
    } else {
      output[key] = value;
    }
  }
  return output;
}
