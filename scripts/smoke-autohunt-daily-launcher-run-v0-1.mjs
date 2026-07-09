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
  writeAutohuntDailyLauncherRun,
} from "../lib/autonomy/autohunt-daily-launcher-run-write.ts";
import {
  computeAutohuntDailyLauncherRunFingerprint,
  readAutohuntDailyLauncherRuns,
} from "../lib/autonomy/read-autohunt-daily-launcher-runs.ts";
import {
  computeAutohuntSupervisedExecutionContractFingerprint,
} from "../lib/autonomy/read-autohunt-supervised-execution-contracts.ts";
import {
  writeAutohuntSupervisedExecutionContract,
} from "../lib/autonomy/autohunt-supervised-execution-contract-write.ts";
import {
  buildAutohuntExecutionReadinessGate,
} from "../lib/autonomy/autohunt-execution-readiness-gate.ts";
import {
  buildAutohuntHandoffCopyExportPreview,
} from "../lib/autonomy/autohunt-handoff-copy-export-preview.ts";
import {
  readAutohuntResultIntakes,
} from "../lib/autonomy/read-autohunt-result-intakes.ts";
import {
  seedLocalAutohuntChainV01,
} from "./dogfood-seed-local-autohunt-chain-v0-1.mjs";
import {
  allValuesFalse,
  fingerprint,
} from "../lib/research-candidate-review/shared-source-chain-guards.ts";

const files = {
  type: "types/autohunt-daily-launcher-run.ts",
  writer: "lib/autonomy/autohunt-daily-launcher-run-write.ts",
  readback: "lib/autonomy/read-autohunt-daily-launcher-runs.ts",
  panel: "components/autonomy/autohunt-daily-launcher-run-readback-panel.tsx",
  cli: "scripts/autohunt-daily-launcher-v0-1.mjs",
  smoke: "scripts/smoke-autohunt-daily-launcher-run-v0-1.mjs",
  dbTs: "lib/db.ts",
  schema: "lib/db/schema.sql",
  migrations: "scripts/db-migrations.mjs",
  migrate: "scripts/db-migrate.mjs",
  packageJson: "package.json",
  resultIntakeSmoke: "scripts/smoke-autohunt-result-intake-v0-1.mjs",
  supervisedExecutionContractSmoke:
    "scripts/smoke-autohunt-supervised-execution-contract-v0-1.mjs",
  executionReadinessGateSmoke:
    "scripts/smoke-autohunt-execution-readiness-gate-v0-1.mjs",
  copyExportSmoke:
    "scripts/smoke-autohunt-handoff-copy-export-preview-v0-1.mjs",
  localDogfoodSmoke:
    "scripts/smoke-local-autohunt-chain-dogfood-v0-1.mjs",
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
  runnerPreflightSmoke:
    "scripts/smoke-autonomy-runner-preflight-v0-1.mjs",
  autonomyContractSmoke: "scripts/smoke-autonomy-contract-v0-1.mjs",
  agentWorkplanePanelsSmoke:
    "scripts/smoke-agent-workplane-panels-v0-1.mjs",
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
assertCliRefusals();
assertPanelPassive();
assertNoForbiddenImports();
assertExistingSmokesStillPass();

console.log(
  JSON.stringify(
    {
      smoke: "autohunt-daily-launcher-run-v0-1",
      pass: true,
      expected_changed_files_checked: true,
      docs_changed: false,
      type_checked: true,
      writer_checked: true,
      readback_checked: true,
      cli_checked: true,
      panel_passive_checked: true,
      target_table_checked: true,
      handoff_only_checked: true,
      fixture_result_intake_checked: true,
      row_count_boundary_checked: true,
      result_intake_loop_closed: true,
      codex_executed: false,
      github_called: false,
      branch_or_pr_created: false,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:autohunt-daily-launcher-run-v0-1");

function assertChangedFileBoundary() {
  const changedFiles = collectChangedFiles();
  for (const file of changedFiles) {
    assert(
      expectedChangedFiles.has(file),
      `Unexpected changed file for Autohunt daily launcher slice: ${file}`,
    );
    assert.doesNotMatch(file, /^docs\//, "daily launcher must not edit docs");
    assert.doesNotMatch(file, /^README/i, "daily launcher must not edit README");
    assert.doesNotMatch(file, /^app\/api\//, "daily launcher must not add API routes");
  }
}

function assertStaticWiring() {
  assertPackageScript({
    packageJsonText: source.packageJson,
    scriptName: "smoke:autohunt-daily-launcher-run-v0-1",
    expectedCommand:
      "tsx --tsconfig tsconfig.json scripts/smoke-autohunt-daily-launcher-run-v0-1.mjs",
  });
  assertPackageScript({
    packageJsonText: source.packageJson,
    scriptName: "autohunt:daily-launcher-v0-1",
    expectedCommand:
      "tsx --tsconfig tsconfig.json scripts/autohunt-daily-launcher-v0-1.mjs",
  });
  assertContains(source.type, [
    "AUTOHUNT_DAILY_LAUNCHER_RUN_KIND",
    "handoff_packet_prepared",
    "result_intake_recorded",
    "daily_confirmation_missing",
    "daily_confirmation_invalid",
    "launcher_started: true",
    "codex_executed: false",
    "github_called: false",
    "branch_or_pr_created: false",
    "persists_raw_confirmation_text: false",
    "persists_raw_prompt_text: false",
    "persists_raw_result_text: false",
  ]);
  assertContains(source.writer, [
    "writeAutohuntDailyLauncherRun",
    "writeAutohuntResultIntake",
    "buildDeterministicIdempotencyKey",
    "assertAllFalseBoundary",
    "findForbiddenRawMaterialFields",
    "containsForbiddenRawMaterial",
    "prepare_handoff_and_record_fixture_result",
    "codex_executed: false",
    "github_called: false",
    "branch_or_pr_created: false",
  ]);
  assertContains(source.readback, [
    "readAutohuntDailyLauncherRuns",
    "computeAutohuntDailyLauncherRunFingerprint",
    "ensureAutohuntDailyLauncherRunSchema",
    "linked_result_intake_summary",
    "no_external_no_execution_boundary",
  ]);
  assertContains(source.cli, [
    "AUGNES_AUTOHUNT_DAILY_LAUNCHER_CONFIRM",
    "--confirmation-ref",
    "--fixture-result",
    "readAutohuntSupervisedExecutionContracts",
    "writeAutohuntDailyLauncherRun",
    "codex_executed",
    "github_called",
    "branch_or_pr_created",
  ]);
}

function assertDbSchema() {
  for (const [label, text] of [
    ["schema", source.schema],
    ["db.ts", source.dbTs],
    ["migrations", source.migrations],
    ["readback", source.readback],
  ]) {
    assert(
      text.includes("autohunt_daily_launcher_runs"),
      `${label} must include autohunt_daily_launcher_runs`,
    );
    const ddl = extractTableDdl(text, "autohunt_daily_launcher_runs");
    assert(ddl, `${label} must include daily launcher target table DDL`);
    for (const column of [
      "launcher_run_id TEXT PRIMARY KEY",
      "source_execution_contract_id TEXT NOT NULL",
      "confirmation_ref TEXT NOT NULL",
      "confirmation_fingerprint TEXT NOT NULL",
      "handoff_packet_id TEXT NOT NULL",
      "handoff_packet_json TEXT NOT NULL",
      "linked_result_intake_json TEXT",
      "launcher_run_fingerprint TEXT NOT NULL",
    ]) {
      assert(ddl.includes(column), `${label} missing ${column}`);
    }
    for (const forbiddenColumn of [
      "raw_confirmation",
      "raw_prompt",
      "raw_result",
      "raw_pr",
      "raw_operator",
      "raw_source",
      "token",
      "secret",
      "url",
      "env",
    ]) {
      assert.doesNotMatch(
        ddl,
        new RegExp(`\\b${forbiddenColumn}\\b`, "i"),
        `${label} must not add ${forbiddenColumn} column`,
      );
    }
  }
  assert.equal(
    (source.schema.match(/CREATE TABLE IF NOT EXISTS autohunt_daily_launcher_runs/g) ?? [])
      .length,
    1,
    "schema.sql must add exactly one autohunt_daily_launcher_runs table",
  );
  assert(source.migrate.includes("migrateAutohuntDailyLauncherRuns"));
}

function assertWriteReadbackBehavior() {
  const db = new Database(":memory:");
  try {
    const contract = createReadyExecutionContract(db);

    const beforeLauncher = countRows(db, "autohunt_daily_launcher_runs");
    const beforeIntake = countRows(db, "autohunt_result_intakes");
    const handoffOnly = writeAutohuntDailyLauncherRun(
      {
        scope: "project:augnes",
        source_execution_contract: contract,
        daily_confirmation: confirmation("handoff-only"),
      },
      { db, now: "2026-07-09T10:10:00.000Z" },
    );
    assert.equal(handoffOnly.ok, true);
    assert.equal(handoffOnly.launcher_run_record_written, true);
    assert.equal(handoffOnly.result_intake_record_written, false);
    assert.equal(
      handoffOnly.launcher_run?.launcher_run_status,
      "handoff_packet_prepared",
    );
    assert.equal(countRows(db, "autohunt_daily_launcher_runs"), beforeLauncher + 1);
    assert.equal(countRows(db, "autohunt_result_intakes"), beforeIntake);
    assert.equal(
      handoffOnly.launcher_run?.row_count_write_summary.target_delta,
      1,
    );
    assert.equal(
      handoffOnly.launcher_run?.row_count_write_summary
        .allowed_linked_target_delta,
      0,
    );

    const duplicate = writeAutohuntDailyLauncherRun(
      {
        scope: "project:augnes",
        source_execution_contract: contract,
        daily_confirmation: confirmation("handoff-only"),
      },
      { db, now: "2026-07-09T10:10:01.000Z" },
    );
    assert.equal(duplicate.ok, true);
    assert.equal(duplicate.duplicate_replayed, true);
    assert.equal(duplicate.launcher_run_record_written, false);
    assert.equal(countRows(db, "autohunt_daily_launcher_runs"), beforeLauncher + 1);

    const fixtureBeforeLauncher = countRows(db, "autohunt_daily_launcher_runs");
    const fixtureBeforeIntake = countRows(db, "autohunt_result_intakes");
    const fixture = writeAutohuntDailyLauncherRun(
      {
        scope: "project:augnes",
        source_execution_contract: contract,
        mode: "prepare_handoff_and_record_fixture_result",
        daily_confirmation: confirmation("fixture-result"),
      },
      { db, now: "2026-07-09T10:20:00.000Z" },
    );
    assert.equal(fixture.ok, true);
    assert.equal(fixture.launcher_run_record_written, true);
    assert.equal(fixture.result_intake_record_written, true);
    assert.equal(
      fixture.launcher_run?.launcher_run_status,
      "result_intake_recorded",
    );
    assert.equal(
      countRows(db, "autohunt_daily_launcher_runs"),
      fixtureBeforeLauncher + 1,
    );
    assert.equal(countRows(db, "autohunt_result_intakes"), fixtureBeforeIntake + 1);
    assert(fixture.launcher_run?.linked_result_intake?.result_intake_id);
    assert(fixture.launcher_run?.linked_result_intake?.expected_observed_delta_fingerprint);
    assert(fixture.launcher_run?.linked_result_intake?.reuse_outcome_fingerprint);
    assert(fixture.launcher_run?.linked_result_intake?.residual_diagnostic_fingerprint);
    assert.equal(
      fixture.launcher_run?.row_count_write_summary.allowed_linked_target_delta,
      1,
    );
    assert.equal(
      fixture.launcher_run?.row_count_write_summary
        .all_non_target_row_counts_unchanged,
      true,
    );

    const resultIntakeReadback = readAutohuntResultIntakes({
      db,
      source_execution_contract_id: contract.contract_id,
      result_intake_status: "result_intake_recorded",
    });
    assert(resultIntakeReadback.latest_expected_observed_delta_candidate);
    assert(resultIntakeReadback.latest_reuse_outcome_candidate);
    assert(resultIntakeReadback.latest_residual_diagnostic_candidate);

    const readback = readAutohuntDailyLauncherRuns({
      db,
      source_execution_contract_id: contract.contract_id,
    });
    assert.equal(readback.selection_status, "selected_latest_launcher_run");
    assert.equal(
      readback.selected_launcher_run?.launcher_run_fingerprint,
      computeAutohuntDailyLauncherRunFingerprint(
        readback.selected_launcher_run,
      ),
    );
    assert.equal(allValuesFalse(readback.no_external_no_execution_boundary), true);

    assertRefused(db, "missing contract", {
      scope: "project:augnes",
      source_execution_contract: null,
      daily_confirmation: confirmation("missing-contract"),
    });
    assertRefused(db, "not-ready contract", {
      scope: "project:augnes",
      source_execution_contract: notReadyContract(contract),
      daily_confirmation: confirmation("not-ready"),
    });
    assertRefused(db, "contract fingerprint mismatch", {
      scope: "project:augnes",
      source_execution_contract: {
        ...contract,
        contract_fingerprint: "fnv1a32_canonical_json_v0_1:mismatch",
      },
      daily_confirmation: confirmation("mismatch"),
    });
    assertRefused(db, "missing confirmation", {
      scope: "project:augnes",
      source_execution_contract: contract,
      daily_confirmation: null,
    });

    for (const [label, probe] of [
      ["raw confirmation", { raw_confirmation_text: "do it" }],
      ["raw prompt", { prompt_text: "run this" }],
      ["raw result", { raw_result_text: "done" }],
      ["raw pr", { raw_pr_body: "body" }],
      ["raw operator", { operator_note: "note" }],
      ["raw source", { raw_source_payload: "payload" }],
      ["token", { token: "abc" }],
      ["secret", { secret: "abc" }],
      ["url", { callback_url: "https://example.invalid" }],
      ["env", { env: "OPENAI_API_KEY=abc" }],
      ["credential-shaped", { credential: "sk-proj-abc" }],
    ]) {
      assertRefused(db, label, {
        scope: "project:augnes",
        source_execution_contract: contract,
        daily_confirmation: confirmation(`unsafe-${label}`),
        raw_material_probe: probe,
      });
    }

    assert.equal(
      fixture.launcher_run?.launcher_run_boundary.launcher_started,
      true,
    );
    assert.equal(
      fixture.launcher_run?.launcher_run_boundary.handoff_packet_prepared,
      true,
    );
    assert.equal(fixture.launcher_run?.launcher_run_boundary.codex_executed, false);
    assert.equal(fixture.launcher_run?.launcher_run_boundary.github_called, false);
    assert.equal(
      fixture.launcher_run?.launcher_run_boundary.branch_or_pr_created,
      false,
    );
    assert.equal(
      fixture.launcher_run?.launcher_run_boundary.merge_or_deploy_performed,
      false,
    );
    assert.equal(
      fixture.launcher_run?.launcher_run_boundary.provider_openai_called,
      false,
    );
    assert.equal(fixture.launcher_run?.launcher_run_boundary.sources_fetched, false);
    assert.equal(fixture.launcher_run?.launcher_run_boundary.retrieval_run, false);
    assert.equal(
      fixture.launcher_run?.launcher_run_boundary
        .state_mutated_outside_launcher_run,
      false,
    );
  } finally {
    db.close();
  }
}

function assertCliRefusals() {
  assert.throws(() =>
    execFileSync("npm", ["run", "autohunt:daily-launcher-v0-1"], {
      stdio: "pipe",
      env: { ...process.env, AUGNES_AUTOHUNT_DAILY_LAUNCHER_CONFIRM: "" },
    }),
  );
  assert.throws(() =>
    execFileSync("npm", ["run", "autohunt:daily-launcher-v0-1"], {
      stdio: "pipe",
      env: {
        ...process.env,
        AUGNES_AUTOHUNT_DAILY_LAUNCHER_CONFIRM: "1",
      },
    }),
  );
}

function createReadyExecutionContract(db) {
  const seed = seedLocalAutohuntChainV01({ db });
  const copyPreview = buildAutohuntHandoffCopyExportPreview({
    source_operator_decision: seed.readbacks.operator_decision,
    as_of: "2026-07-09T10:00:00.000Z",
  });
  const readyGate = buildAutohuntExecutionReadinessGate({
    workbench_spine: seed.records.workbench_spine,
    handoff_plan_readback: seed.readbacks.handoff_plan,
    operator_decision_readback: seed.readbacks.operator_decision,
    copy_export_preview: copyPreview,
    local_dogfood_seed_report: seed.report,
    as_of: "2026-07-09T10:01:00.000Z",
  });
  assert.equal(
    readyGate.readiness_status,
    "ready_for_future_supervised_execution_design",
  );
  const contractWrite = writeAutohuntSupervisedExecutionContract(
    {
      scope: "project:augnes",
      source_readiness_gate: readyGate,
    },
    { db, now: "2026-07-09T10:02:00.000Z" },
  );
  assert.equal(contractWrite.ok, true);
  assert(contractWrite.contract);
  return contractWrite.contract;
}

function confirmation(seed) {
  const confirmationRef = `confirmation:local-daily-autohunt-v0-1:${seed}`;
  const confirmedAt = "2026-07-09T10:03:00.000Z";
  return {
    confirmation_ref: confirmationRef,
    confirmed_by: "operator:smoke",
    confirmed_at: confirmedAt,
    confirmation_fingerprint: fingerprint({
      confirmation_ref: confirmationRef,
      confirmed_by: "operator:smoke",
      confirmed_at: confirmedAt,
    }),
    raw_confirmation_text_persisted: false,
  };
}

function notReadyContract(contract) {
  const updated = {
    ...contract,
    contract_status: "blocked",
  };
  return {
    ...updated,
    contract_fingerprint: computeAutohuntSupervisedExecutionContractFingerprint(
      updated,
    ),
  };
}

function assertRefused(db, label, input) {
  const result = writeAutohuntDailyLauncherRun(input, { db });
  assert.equal(result.ok, false, `${label} must refuse`);
  assert(result.refusal_reasons.length > 0, `${label} reasons`);
  assert.equal(result.launcher_run_record_written, false, `${label} no write`);
  assert.equal(result.result_intake_record_written, false, `${label} no intake`);
  assert.equal(result.codex_executed, false, `${label} no codex`);
  assert.equal(result.github_called, false, `${label} no github`);
  assert.equal(result.branch_or_pr_created, false, `${label} no branch/pr`);
}

function assertPanelPassive() {
  assert.doesNotMatch(source.panel, /<button\b/i, "panel must not render buttons");
  assert.doesNotMatch(source.panel, /\bonClick\s*=/, "panel must not use onClick");
  assert.doesNotMatch(source.panel, /\bfetch\s*\(/, "panel must not fetch");
  assert.doesNotMatch(source.panel, /\bformAction\s*=/, "panel must not use formAction");
  assert.doesNotMatch(source.panel, /server action/i, "panel must not add server actions");
  assert.doesNotMatch(source.panel, /navigator\.clipboard|writeText\s*\(/i, "panel must not write clipboard");
  assert.doesNotMatch(source.panel, /\bdownload\s*=/i, "panel must not render download controls");
  assert.doesNotMatch(source.panel, /<LaunchButton\b|\bonLaunch\b/i, "panel must not expose launch controls");
}

function assertNoForbiddenImports() {
  const importText = [
    source.type,
    source.writer,
    source.readback,
    source.panel,
    source.cli,
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
  execFileSync("npm", ["run", "smoke:autohunt-result-intake-v0-1"], {
    stdio: "pipe",
  });
  execFileSync("npm", ["run", "smoke:autohunt-supervised-execution-contract-v0-1"], {
    stdio: "pipe",
  });
  execFileSync("npm", ["run", "smoke:local-autohunt-chain-dogfood-v0-1"], {
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
