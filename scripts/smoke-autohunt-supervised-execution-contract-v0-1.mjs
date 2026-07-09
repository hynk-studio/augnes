#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
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
  writeAutohuntSupervisedExecutionContract,
} from "../lib/autonomy/autohunt-supervised-execution-contract-write.ts";
import {
  computeAutohuntSupervisedExecutionContractFingerprint,
  readAutohuntSupervisedExecutionContracts,
} from "../lib/autonomy/read-autohunt-supervised-execution-contracts.ts";
import {
  buildAutohuntExecutionReadinessGate,
} from "../lib/autonomy/autohunt-execution-readiness-gate.ts";
import {
  buildAutohuntHandoffCopyExportPreview,
} from "../lib/autonomy/autohunt-handoff-copy-export-preview.ts";
import {
  seedLocalAutohuntChainV01,
} from "./dogfood-seed-local-autohunt-chain-v0-1.mjs";
import {
  allValuesFalse,
} from "../lib/research-candidate-review/shared-source-chain-guards.ts";

const files = {
  type: "types/autohunt-supervised-execution-contract.ts",
  writer:
    "lib/autonomy/autohunt-supervised-execution-contract-write.ts",
  readback:
    "lib/autonomy/read-autohunt-supervised-execution-contracts.ts",
  panel:
    "components/autonomy/autohunt-supervised-execution-contract-readback-panel.tsx",
  resultIntakeType: "types/autohunt-result-intake.ts",
  resultIntakeWriter: "lib/autonomy/autohunt-result-intake-write.ts",
  resultIntakeReadback: "lib/autonomy/read-autohunt-result-intakes.ts",
  resultIntakePanel:
    "components/autonomy/autohunt-result-intake-readback-panel.tsx",
  dbTs: "lib/db.ts",
  schema: "lib/db/schema.sql",
  migrations: "scripts/db-migrations.mjs",
  migrate: "scripts/db-migrate.mjs",
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
  smoke: "scripts/smoke-autohunt-supervised-execution-contract-v0-1.mjs",
  packageJson: "package.json",
  executionGateSmoke: "scripts/smoke-autohunt-execution-readiness-gate-v0-1.mjs",
  copyExportSmoke:
    "scripts/smoke-autohunt-handoff-copy-export-preview-v0-1.mjs",
  localDogfoodSmoke: "scripts/smoke-local-autohunt-chain-dogfood-v0-1.mjs",
  agentWorkplanePanelsSmoke: "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  operatorDecisionMountSmoke:
    "scripts/smoke-autohunt-handoff-plan-operator-review-decision-workbench-mount-v0-1.mjs",
  operatorDecisionSmoke:
    "scripts/smoke-autohunt-handoff-plan-operator-review-decision-v0-1.mjs",
  handoffPlanMountSmoke:
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
  runnerPreflightSmoke:
    "scripts/smoke-autonomy-runner-preflight-v0-1.mjs",
  autonomyContractSmoke: "scripts/smoke-autonomy-contract-v0-1.mjs",
};

const expectedChangedFiles = new Set(Object.values(files));
const source = Object.fromEntries(
  Object.entries(files).map(([key, filePath]) => {
    assert(existsSync(filePath), `${filePath} must exist`);
    return [key, readFileSync(filePath, "utf8")];
  }),
);

assertChangedFileBoundary();
assertStaticWiring();
assertDbSchema();
assertWriteReadbackBehavior();
assertPanelPassive();
assertNoForbiddenImports();
assertExistingSmokesStillPass();

console.log(
  JSON.stringify(
    {
      smoke: "autohunt-supervised-execution-contract-v0-1",
      pass: true,
      expected_changed_files_checked: true,
      docs_changed: false,
      type_checked: true,
      writer_checked: true,
      readback_checked: true,
      panel_passive_checked: true,
      target_table_checked: true,
      idempotency_checked: true,
      refusal_cases_checked: true,
      row_count_target_only_checked: true,
      launch_now_allowed: false,
      execution_started: false,
      external_authority_checked: true,
      existing_dogfood_smoke_checked: true,
      existing_execution_readiness_gate_smoke_checked: true,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:autohunt-supervised-execution-contract-v0-1");

function assertChangedFileBoundary() {
  const changedFiles = collectChangedFiles();
  for (const file of changedFiles) {
    assert(
      expectedChangedFiles.has(file),
      `Unexpected changed file for Autohunt supervised execution contract slice: ${file}`,
    );
    assert.doesNotMatch(file, /^docs\//, "execution contract must not edit docs");
    assert.doesNotMatch(file, /^README/i, "execution contract must not edit README");
    assert.doesNotMatch(file, /^app\/api\//, "execution contract must not add API routes");
  }
}

function assertStaticWiring() {
  assertPackageScript({
    packageJsonText: source.packageJson,
    scriptName: "smoke:autohunt-supervised-execution-contract-v0-1",
    expectedCommand:
      "tsx --tsconfig tsconfig.json scripts/smoke-autohunt-supervised-execution-contract-v0-1.mjs",
  });
  assertContains(source.type, [
    "AUTOHUNT_SUPERVISED_EXECUTION_CONTRACT_KIND",
    "ready_for_future_limited_launcher",
    "source_readiness_gate_not_ready",
    "freshness_required",
    "operator_reconfirmation_required",
    "required_result_intake: true",
    "required_expected_observed_delta: true",
    "required_reuse_outcome: true",
    "required_residual_diagnostic: true",
    "launch_now_allowed: false",
    "execution_started: false",
    "codex_executed: false",
    "github_called: false",
    "branch_or_pr_created: false",
    "persists_raw_prompt_text: false",
    "persists_raw_copy_text: false",
    "persists_raw_pr_body: false",
  ]);
  assertContains(source.writer, [
    "writeAutohuntSupervisedExecutionContract",
    "buildDeterministicIdempotencyKey",
    "summarizeTargetOnlyRowCountWrite",
    "isTargetOnlyRowCountWrite",
    "assertAllFalseBoundary",
    "findForbiddenRawMaterialFields",
    "containsForbiddenRawMaterial",
    "launch_now_allowed: false",
    "execution_started: false",
    "codex_executed: false",
    "github_called: false",
    "branch_or_pr_created: false",
  ]);
  assertContains(source.readback, [
    "readAutohuntSupervisedExecutionContracts",
    "computeAutohuntSupervisedExecutionContractFingerprint",
    "ensureAutohuntSupervisedExecutionContractSchema",
    "selected_latest_ready_contract",
    "no_run_no_execution_boundary",
  ]);
  assertContains(source.panel, [
    "AutohuntSupervisedExecutionContractReadbackPanel",
    "Supervised Execution Contract Readback",
    "launch now",
    "disallowed",
    "Object.entries(contract.authority_boundary)",
    "Object.entries(contract.persisted_material_boundary)",
  ]);
}

function assertDbSchema() {
  for (const [label, text] of [
    ["schema", source.schema],
    ["dbTs", source.dbTs],
    ["migrations", source.migrations],
    ["migrate", source.migrate],
  ]) {
    assert(
      text.includes("autohunt_supervised_execution_contracts"),
      `${label} must wire autohunt_supervised_execution_contracts`,
    );
  }
  const tableDdl = extractTableDdl(
    source.schema,
    "autohunt_supervised_execution_contracts",
  );
  assert(tableDdl, "schema must contain supervised execution contract table");
  for (const column of [
    "contract_id TEXT PRIMARY KEY",
    "created_at TEXT NOT NULL",
    "scope TEXT NOT NULL CHECK (scope IN ('project:augnes'))",
    "contract_status TEXT NOT NULL",
    "source_readiness_gate_fingerprint TEXT NOT NULL",
    "active_grant_id TEXT NOT NULL",
    "ready_preflight_packet_fingerprint TEXT NOT NULL",
    "operator_decision_fingerprint TEXT NOT NULL",
    "copy_export_preview_fingerprint TEXT NOT NULL",
    "launch_mode TEXT NOT NULL",
    "idempotency_key TEXT NOT NULL UNIQUE",
    "launch_guard_result_json TEXT NOT NULL",
    "contract_fingerprint TEXT NOT NULL",
  ]) {
    assert(tableDdl.includes(column), `table DDL must include ${column}`);
  }
  for (const forbiddenColumn of [
    "raw_prompt",
    "raw_copy",
    "raw_pr_body",
    "raw_operator",
    "raw_source_payload",
    "token",
    "secret",
    "url",
    "env",
  ]) {
    assert.doesNotMatch(
      tableDdl,
      new RegExp(`\\b${forbiddenColumn}\\b`, "i"),
      `table must not persist ${forbiddenColumn} columns`,
    );
  }
  const createTableMatches = source.schema.match(
    /CREATE TABLE IF NOT EXISTS autohunt_supervised_execution_contracts/g,
  );
  assert.equal(createTableMatches?.length, 1, "schema must add exactly one target table declaration");
}

function assertWriteReadbackBehavior() {
  const db = new Database(":memory:");
  try {
    const seed = seedLocalAutohuntChainV01({ db });
    assert.equal(seed.ok, true, JSON.stringify(seed.refusal_reasons ?? []));
    const readyGate = buildReadyGate(seed);

    const beforeTargetCount = countRows(db, "autohunt_supervised_execution_contracts");
    const write = writeAutohuntSupervisedExecutionContract(
      {
        scope: "project:augnes",
        source_readiness_gate: readyGate,
      },
      {
        db,
        now: "2026-07-09T08:20:00.000Z",
      },
    );
    assert.equal(write.ok, true, JSON.stringify(write.refusal_reasons));
    assert.equal(write.result_status, "written");
    assert(write.contract, "write must return a contract");
    assert.equal(write.launch_now_allowed, false);
    assert.equal(write.execution_started, false);
    assert.equal(write.codex_executed, false);
    assert.equal(write.github_called, false);
    assert.equal(write.branch_or_pr_created, false);
    assert.equal(
      write.contract.contract_status,
      "ready_for_future_limited_launcher",
    );
    assert.equal(
      write.contract.launch_guard_result.launch_now_allowed,
      false,
    );
    assert.equal(
      write.contract.launch_guard_result.execution_started,
      false,
    );
    assert.equal(write.contract.launch_guard_result.codex_executed, false);
    assert.equal(write.contract.launch_guard_result.github_called, false);
    assert.equal(
      write.contract.launch_guard_result.branch_or_pr_created,
      false,
    );
    assert.equal(write.contract.validation.passed, true);
    assert.equal(write.contract.launch_guard_checks.passed, true);
    assert.equal(write.contract.launch_envelope.required_result_intake, true);
    assert.equal(
      write.contract.launch_envelope.required_expected_observed_delta,
      true,
    );
    assert.equal(write.contract.launch_envelope.required_reuse_outcome, true);
    assert.equal(
      write.contract.launch_envelope.required_residual_diagnostic,
      true,
    );
    assert.equal(allValuesFalse(write.contract.authority_boundary), true);
    assert.equal(write.contract.persisted_material_boundary.persists_raw_prompt_text, false);
    assert.equal(write.contract.persisted_material_boundary.persists_raw_copy_text, false);
    assert.equal(write.contract.persisted_material_boundary.persists_raw_pr_body, false);
    assert.equal(write.contract.row_count_write_summary.target_delta, 1);
    assert.equal(
      write.contract.row_count_write_summary.target_delta_matches_expected,
      true,
    );
    assert.equal(
      write.contract.row_count_write_summary.all_non_target_row_counts_unchanged,
      true,
    );
    assert.equal(
      write.contract.row_count_write_summary.non_target_changed_table_count,
      0,
    );
    assert.equal(
      countRows(db, "autohunt_supervised_execution_contracts"),
      beforeTargetCount + 1,
      "target table must gain one row on first accepted write",
    );

    const duplicate = writeAutohuntSupervisedExecutionContract(
      {
        scope: "project:augnes",
        source_readiness_gate: readyGate,
      },
      { db },
    );
    assert.equal(duplicate.ok, true);
    assert.equal(duplicate.result_status, "duplicate_replayed");
    assert.equal(duplicate.contract_record_written, false);
    assert.equal(
      countRows(db, "autohunt_supervised_execution_contracts"),
      beforeTargetCount + 1,
      "duplicate replay must not insert another row",
    );

    const readback = readAutohuntSupervisedExecutionContracts({
      db,
      scope: "project:augnes",
      contract_status: "ready_for_future_limited_launcher",
    });
    assert.equal(readback.selection_status, "selected_latest_ready_contract");
    assert(readback.selected_contract, "readback must select latest ready contract");
    assert.equal(
      readback.selected_contract.contract_fingerprint,
      computeAutohuntSupervisedExecutionContractFingerprint(
        readback.selected_contract,
      ),
    );
    assert.equal(readback.invalid_record_count, 0);
    assert.equal(
      readback.launch_guard_result?.launch_now_allowed,
      false,
    );
    assert.equal(allValuesFalse(readback.no_run_no_execution_boundary), true);

    assertRefused("missing_gate", {
      scope: "project:augnes",
      source_readiness_gate: null,
    });
    assertRefused("not_ready_gate", {
      scope: "project:augnes",
      source_readiness_gate: {
        ...readyGate,
        readiness_status: "missing_copy_export_preview",
      },
    });
    assertRefused("missing_future_requirement", {
      scope: "project:augnes",
      source_readiness_gate: {
        ...readyGate,
        future_execution_design_requirements:
          readyGate.future_execution_design_requirements.filter(
            (requirement) =>
              requirement !== "fresh_operator_approval_required",
          ),
      },
    });
    assertRefused("missing_result_intake_requirement", {
      scope: "project:augnes",
      source_readiness_gate: readyGate,
      launch_envelope: { required_result_intake: false },
    });
    assertRefused("missing_expected_observed_delta_requirement", {
      scope: "project:augnes",
      source_readiness_gate: readyGate,
      launch_envelope: { required_expected_observed_delta: false },
    });
    assertRefused("missing_reuse_outcome_requirement", {
      scope: "project:augnes",
      source_readiness_gate: readyGate,
      launch_envelope: { required_reuse_outcome: false },
    });
    assertRefused("missing_residual_diagnostic_requirement", {
      scope: "project:augnes",
      source_readiness_gate: readyGate,
      launch_envelope: { required_residual_diagnostic: false },
    });
    assertRefused("invalid_budget", {
      scope: "project:augnes",
      source_readiness_gate: readyGate,
      launch_envelope: { max_iterations: 0 },
    });
    assertRefused("missing_manual_stop_requested", {
      scope: "project:augnes",
      source_readiness_gate: readyGate,
      launch_envelope: {
        required_stop_conditions: ["authority_boundary_unclear"],
      },
    });
    assertRefused("missing_authority_boundary_unclear", {
      scope: "project:augnes",
      source_readiness_gate: readyGate,
      launch_envelope: {
        required_stop_conditions: ["manual_stop_requested"],
      },
    });
    assertRefused("non_false_authority_boundary", {
      scope: "project:augnes",
      source_readiness_gate: {
        ...readyGate,
        authority_boundary: {
          ...readyGate.authority_boundary,
          can_execute_codex: true,
        },
      },
    });
    for (const [label, probe] of [
      ["raw_prompt", { raw_prompt_text: "do the thing" }],
      ["raw_copy", { raw_copy_text: "copy this" }],
      ["raw_pr", { raw_pr_body: "body" }],
      ["raw_operator", { raw_operator_note: "note" }],
      ["raw_source", { raw_source_payload: "payload" }],
      ["token", { token: "ghp_123456789abcdef" }],
      ["secret", { secret: "api_key=not-allowed" }],
      ["url", { callback: "https://example.invalid/path" }],
      ["env", { env: "OPENAI_API_KEY=sk-testvalue" }],
      ["credential", { credential: "BEGIN PRIVATE KEY" }],
    ]) {
      assertRefused(label, {
        scope: "project:augnes",
        source_readiness_gate: readyGate,
        raw_material_probe: probe,
      });
    }

    function assertRefused(label, input) {
      const result = writeAutohuntSupervisedExecutionContract(input, { db });
      assert.equal(result.ok, false, `${label} must refuse`);
      assert.equal(result.result_status, "refused", `${label} status`);
      assert(result.refusal_reasons.length > 0, `${label} reasons`);
      assert.equal(result.launch_now_allowed, false, `${label} no launch`);
      assert.equal(result.execution_started, false, `${label} no execution`);
      assert.equal(result.contract_record_written, false, `${label} no write`);
    }
  } finally {
    db.close();
  }
}

function buildReadyGate(seed) {
  const copyPreview = buildAutohuntHandoffCopyExportPreview({
    source_operator_decision: seed.readbacks.operator_decision,
    as_of: "2026-07-09T08:10:00.000Z",
  });
  const readyGate = buildAutohuntExecutionReadinessGate({
    workbench_spine: seed.records.workbench_spine,
    handoff_plan_readback: seed.readbacks.handoff_plan,
    operator_decision_readback: seed.readbacks.operator_decision,
    copy_export_preview: copyPreview,
    local_dogfood_seed_report: seed.report,
    as_of: "2026-07-09T08:11:00.000Z",
  });
  assert.equal(
    readyGate.readiness_status,
    "ready_for_future_supervised_execution_design",
  );
  assert.equal(readyGate.readiness_checks.checks_passed, true);
  return readyGate;
}

function assertPanelPassive() {
  assert.doesNotMatch(source.panel, /<button\b/i, "panel must not render buttons");
  assert.doesNotMatch(source.panel, /\bonClick\b/, "panel must not add click handlers");
  assert.doesNotMatch(source.panel, /\bfetch\s*\(/, "panel must not fetch");
  assert.doesNotMatch(source.panel, /formAction/, "panel must not add form actions");
  assert.doesNotMatch(source.panel, /use server/i, "panel must not add server actions");
  assert.doesNotMatch(source.panel, /navigator\.clipboard|clipboard\.writeText/i, "panel must not write clipboard");
  assert.doesNotMatch(source.panel, /download\s*=/i, "panel must not render downloads");
  assert.doesNotMatch(source.panel, /launch\s*=/i, "panel must not add launch controls");
}

function assertNoForbiddenImports() {
  const importText = [
    source.type,
    source.writer,
    source.readback,
    source.panel,
    source.smoke,
  ]
    .flatMap((text) => text.split("\n").filter((line) => line.trim().startsWith("import ")))
    .join("\n");
  assert.doesNotMatch(
    importText,
    /(@octokit|github|openai|codex|source-fetch|retrieval|crawler|embedding|vector)/i,
    "slice must not introduce provider/OpenAI/GitHub/Codex/source-fetch/retrieval imports",
  );
}

function assertExistingSmokesStillPass() {
  execFileSync("npm", ["run", "smoke:local-autohunt-chain-dogfood-v0-1"], {
    stdio: "pipe",
  });
  execFileSync("npm", ["run", "smoke:autohunt-execution-readiness-gate-v0-1"], {
    stdio: "pipe",
  });
}

function collectChangedFiles() {
  return uniqueSorted([
    ...collectGitDiffFiles(["diff", "--name-only"]).files,
    ...collectGitDiffFiles(["diff", "--cached", "--name-only"]).files,
    ...collectUntrackedFiles(),
    ...getBaseRangeChangedFiles().files,
  ]);
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

function extractTableDdl(text, tableName) {
  const start = text.indexOf(`CREATE TABLE IF NOT EXISTS ${tableName}`);
  if (start < 0) return "";
  const end = text.indexOf("\n);\n", start);
  return end < 0 ? text.slice(start) : text.slice(start, end + 3);
}

function assertContains(text, needles) {
  for (const needle of needles) {
    assert(
      text.includes(needle),
      `Expected source to include ${JSON.stringify(needle)}`,
    );
  }
}
