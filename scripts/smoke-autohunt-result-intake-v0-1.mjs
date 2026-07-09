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
  writeAutohuntResultIntake,
} from "../lib/autonomy/autohunt-result-intake-write.ts";
import {
  computeAutohuntResultIntakeFingerprint,
  readAutohuntResultIntakes,
} from "../lib/autonomy/read-autohunt-result-intakes.ts";
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
  seedLocalAutohuntChainV01,
} from "./dogfood-seed-local-autohunt-chain-v0-1.mjs";
import {
  allValuesFalse,
} from "../lib/research-candidate-review/shared-source-chain-guards.ts";

const files = {
  type: "types/autohunt-result-intake.ts",
  writer: "lib/autonomy/autohunt-result-intake-write.ts",
  readback: "lib/autonomy/read-autohunt-result-intakes.ts",
  panel:
    "components/autonomy/autohunt-result-intake-readback-panel.tsx",
  dbTs: "lib/db.ts",
  schema: "lib/db/schema.sql",
  migrations: "scripts/db-migrations.mjs",
  migrate: "scripts/db-migrate.mjs",
  smoke: "scripts/smoke-autohunt-result-intake-v0-1.mjs",
  packageJson: "package.json",
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
assertPanelPassive();
assertNoForbiddenImports();
assertExistingSmokesStillPass();

console.log(
  JSON.stringify(
    {
      smoke: "autohunt-result-intake-v0-1",
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
      expected_observed_delta_checked: true,
      reuse_outcome_checked: true,
      residual_diagnostic_checked: true,
      row_count_target_only_checked: true,
      execution_started: false,
      external_authority_checked: true,
      existing_supervised_execution_contract_smoke_checked: true,
      existing_dogfood_smoke_checked: true,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:autohunt-result-intake-v0-1");

function assertChangedFileBoundary() {
  const changedFiles = collectChangedFiles();
  for (const file of changedFiles) {
    assert(
      expectedChangedFiles.has(file),
      `Unexpected changed file for Autohunt result intake slice: ${file}`,
    );
    assert.doesNotMatch(file, /^docs\//, "result intake must not edit docs");
    assert.doesNotMatch(file, /^README/i, "result intake must not edit README");
    assert.doesNotMatch(file, /^app\/api\//, "result intake must not add API routes");
  }
}

function assertStaticWiring() {
  assertPackageScript({
    packageJsonText: source.packageJson,
    scriptName: "smoke:autohunt-result-intake-v0-1",
    expectedCommand:
      "tsx --tsconfig tsconfig.json scripts/smoke-autohunt-result-intake-v0-1.mjs",
  });
  assertContains(source.type, [
    "AUTOHUNT_RESULT_INTAKE_KIND",
    "result_intake_recorded",
    "source_execution_contract_missing",
    "source_execution_contract_not_ready",
    "source_execution_contract_fingerprint_mismatch",
    "result_report_missing",
    "result_report_invalid",
    "expected_observed_delta_candidate",
    "reuse_outcome_candidate",
    "residual_diagnostic_candidate",
    "result_intake_required_satisfied: true",
    "persists_raw_result_text: false",
    "persists_raw_prompt_text: false",
    "persists_raw_pr_body: false",
  ]);
  assertContains(source.writer, [
    "writeAutohuntResultIntake",
    "buildDeterministicIdempotencyKey",
    "summarizeTargetOnlyRowCountWrite",
    "isTargetOnlyRowCountWrite",
    "assertAllFalseBoundary",
    "findForbiddenRawMaterialFields",
    "containsForbiddenRawMaterial",
    "buildExpectedObservedDeltaCandidate",
    "buildReuseOutcomeCandidate",
    "buildResidualDiagnosticCandidate",
    "codex_executed: false",
    "github_called: false",
    "branch_or_pr_created: false",
  ]);
  assertContains(source.readback, [
    "readAutohuntResultIntakes",
    "computeAutohuntResultIntakeFingerprint",
    "ensureAutohuntResultIntakeSchema",
    "selected_latest_result_intake",
    "latest_expected_observed_delta_candidate",
    "latest_reuse_outcome_candidate",
    "latest_residual_diagnostic_candidate",
    "no_run_no_execution_boundary",
  ]);
  assertContains(source.panel, [
    "AutohuntResultIntakeReadbackPanel",
    "Result Intake Readback",
    "ExpectedObservedDelta candidate",
    "ReuseOutcome candidate",
    "ResidualDiagnostic candidate",
    "Passive structured result-intake readback only",
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
      text.includes("autohunt_result_intakes"),
      `${label} must include autohunt_result_intakes`,
    );
    const ddl = extractTableDdl(text, "autohunt_result_intakes");
    assert(ddl, `${label} must include result intake target table DDL`);
    for (const column of [
      "result_intake_id TEXT PRIMARY KEY",
      "source_execution_contract_id TEXT NOT NULL",
      "result_report_id TEXT NOT NULL",
      "structured_result_report_json TEXT NOT NULL",
      "expected_observed_delta_candidate_json TEXT NOT NULL",
      "reuse_outcome_candidate_json TEXT NOT NULL",
      "residual_diagnostic_candidate_json TEXT NOT NULL",
      "learning_loop_summary_json TEXT NOT NULL",
      "result_intake_fingerprint TEXT NOT NULL",
    ]) {
      assert(ddl.includes(column), `${label} missing ${column}`);
    }
    for (const forbiddenColumn of [
      "raw_result_text",
      "raw_prompt",
      "raw_copy",
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
    (source.schema.match(/CREATE TABLE IF NOT EXISTS autohunt_result_intakes/g) ?? [])
      .length,
    1,
    "schema.sql must add exactly one autohunt_result_intakes table",
  );
  assert(source.migrate.includes("migrateAutohuntResultIntakes"));
}

function assertWriteReadbackBehavior() {
  const db = new Database(":memory:");
  try {
    const seed = seedLocalAutohuntChainV01({ db });
    const readyGate = buildReadyGate(seed);
    const contractWrite = writeAutohuntSupervisedExecutionContract(
      {
        scope: "project:augnes",
        source_readiness_gate: readyGate,
      },
      { db, now: "2026-07-09T09:30:00.000Z" },
    );
    assert.equal(contractWrite.ok, true, JSON.stringify(contractWrite.refusal_reasons));
    assert(contractWrite.contract, "contract write must return contract");

    const contract = contractWrite.contract;
    const report = successfulReport(contract);
    const beforeTargetCount = countRows(db, "autohunt_result_intakes");
    const write = writeAutohuntResultIntake(
      {
        scope: "project:augnes",
        source_execution_contract: contract,
        structured_result_report: report,
      },
      { db, now: "2026-07-09T09:35:00.000Z" },
    );
    assert.equal(write.ok, true, JSON.stringify(write.refusal_reasons));
    assert.equal(write.result_status, "written");
    assert(write.result_intake, "write must return result intake");
    assert.equal(write.execution_started, false);
    assert.equal(write.codex_executed, false);
    assert.equal(write.github_called, false);
    assert.equal(write.branch_or_pr_created, false);
    assert.equal(
      write.result_intake.result_intake_status,
      "result_intake_recorded",
    );
    assert.equal(write.result_intake.validation.passed, true);
    assert.equal(
      write.result_intake.expected_observed_delta_candidate.delta_status,
      "aligned",
    );
    assert.equal(
      write.result_intake.reuse_outcome_candidate.source_chain_helpfulness,
      "helpful",
    );
    assert.equal(
      write.result_intake.residual_diagnostic_candidate.residual_category,
      "no_residual",
    );
    assert.equal(
      write.result_intake.learning_loop_summary
        .result_intake_required_satisfied,
      true,
    );
    assert.equal(
      write.result_intake.learning_loop_summary
        .expected_observed_delta_required_satisfied,
      true,
    );
    assert.equal(
      write.result_intake.learning_loop_summary
        .reuse_outcome_required_satisfied,
      true,
    );
    assert.equal(
      write.result_intake.learning_loop_summary
        .residual_diagnostic_required_satisfied,
      true,
    );
    assert.equal(allValuesFalse(write.result_intake.authority_boundary), true);
    assert.equal(
      write.result_intake.persisted_material_boundary
        .persists_raw_result_text,
      false,
    );
    assert.equal(
      write.result_intake.structured_result_report.raw_result_text_persisted,
      false,
    );
    assert.equal(write.result_intake.row_count_write_summary.target_delta, 1);
    assert.equal(
      write.result_intake.row_count_write_summary
        .target_delta_matches_expected,
      true,
    );
    assert.equal(
      write.result_intake.row_count_write_summary
        .all_non_target_row_counts_unchanged,
      true,
    );
    assert.equal(
      write.result_intake.row_count_write_summary
        .non_target_changed_table_count,
      0,
    );
    assert.equal(
      countRows(db, "autohunt_result_intakes"),
      beforeTargetCount + 1,
      "target table must gain one row on first accepted write",
    );

    const duplicate = writeAutohuntResultIntake(
      {
        scope: "project:augnes",
        source_execution_contract: contract,
        structured_result_report: report,
      },
      { db },
    );
    assert.equal(duplicate.ok, true);
    assert.equal(duplicate.result_status, "duplicate_replayed");
    assert.equal(duplicate.result_intake_record_written, false);
    assert.equal(
      countRows(db, "autohunt_result_intakes"),
      beforeTargetCount + 1,
      "duplicate replay must not insert another row",
    );

    const readback = readAutohuntResultIntakes({
      db,
      scope: "project:augnes",
      result_intake_status: "result_intake_recorded",
    });
    assert.equal(readback.selection_status, "selected_latest_result_intake");
    assert(readback.selected_result_intake, "readback must select latest intake");
    assert.equal(
      readback.selected_result_intake.result_intake_fingerprint,
      computeAutohuntResultIntakeFingerprint(readback.selected_result_intake),
    );
    assert.equal(readback.invalid_record_count, 0);
    assert.equal(
      readback.latest_expected_observed_delta_candidate?.delta_status,
      "aligned",
    );
    assert.equal(
      readback.latest_reuse_outcome_candidate?.source_chain_helpfulness,
      "helpful",
    );
    assert.equal(
      readback.latest_residual_diagnostic_candidate?.residual_category,
      "no_residual",
    );
    assert.equal(allValuesFalse(readback.no_run_no_execution_boundary), true);

    const failedCheck = writeAutohuntResultIntake(
      {
        scope: "project:augnes",
        source_execution_contract: contract,
        structured_result_report: failedCheckReport(contract),
      },
      { db },
    );
    assert.equal(failedCheck.ok, true, JSON.stringify(failedCheck.refusal_reasons));
    assert.equal(
      failedCheck.result_intake?.residual_diagnostic_candidate
        .residual_category,
      "check_failure",
    );

    const skippedCheck = writeAutohuntResultIntake(
      {
        scope: "project:augnes",
        source_execution_contract: contract,
        structured_result_report: skippedCheckReport(contract),
      },
      { db },
    );
    assert.equal(skippedCheck.ok, true, JSON.stringify(skippedCheck.refusal_reasons));
    assert.equal(
      skippedCheck.result_intake?.residual_diagnostic_candidate
        .residual_category,
      "skipped_required_check",
    );

    assertRefused("missing_contract", {
      scope: "project:augnes",
      source_execution_contract: null,
      structured_result_report: report,
    });
    assertRefused("not_ready_contract", {
      scope: "project:augnes",
      source_execution_contract: {
        ...contract,
        contract_status: "blocked",
      },
      structured_result_report: report,
    });
    assertRefused("contract_fingerprint_mismatch", {
      scope: "project:augnes",
      source_execution_contract: {
        ...contract,
        contract_fingerprint: "fnv1a32_canonical_json_v0_1:badbad00",
      },
      structured_result_report: report,
    });
    assertRefused("missing_report", {
      scope: "project:augnes",
      source_execution_contract: contract,
      structured_result_report: null,
    });
    assertRefused("invalid_report", {
      scope: "project:augnes",
      source_execution_contract: contract,
      structured_result_report: {
        ...report,
        result_status: "not_a_status",
      },
    });
    assertRefused("budget_overrun", {
      scope: "project:augnes",
      source_execution_contract: contract,
      structured_result_report: {
        ...report,
        result_report_id: "autohunt-result-report:budget-overrun",
        budget_used: {
          ...report.budget_used,
          iterations: contract.launch_envelope.max_iterations + 1,
        },
      },
    });
    assertRefused("changed_file_count_above_max", {
      scope: "project:augnes",
      source_execution_contract: contract,
      structured_result_report: {
        ...report,
        result_report_id: "autohunt-result-report:file-overrun",
        changed_files: Array.from(
          { length: contract.launch_envelope.max_changed_files + 1 },
          (_, index) => `types/autohunt-result-intake-${index}.ts`,
        ),
        changed_file_count: contract.launch_envelope.max_changed_files + 1,
      },
    });
    assertRefused("missing_required_check", {
      scope: "project:augnes",
      source_execution_contract: contract,
      structured_result_report: {
        ...report,
        result_report_id: "autohunt-result-report:missing-check",
        checks_run: [],
        checks_passed: [],
        checks_failed: [],
        checks_skipped: [],
      },
    });

    for (const [label, probe] of [
      ["raw_result", { raw_result_text: "raw result body" }],
      ["raw_prompt", { raw_prompt_text: "do the thing" }],
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
        source_execution_contract: contract,
        structured_result_report: report,
        raw_material_probe: probe,
      });
    }

    function assertRefused(label, input) {
      const result = writeAutohuntResultIntake(input, { db });
      assert.equal(result.ok, false, `${label} must refuse`);
      assert.equal(result.result_status, "refused", `${label} status`);
      assert(result.refusal_reasons.length > 0, `${label} reasons`);
      assert.equal(result.execution_started, false, `${label} no execution`);
      assert.equal(result.codex_executed, false, `${label} no codex`);
      assert.equal(result.github_called, false, `${label} no github`);
      assert.equal(result.branch_or_pr_created, false, `${label} no branch/pr`);
      assert.equal(result.result_intake_record_written, false, `${label} no write`);
    }
  } finally {
    db.close();
  }
}

function buildReadyGate(seed) {
  const copyPreview = buildAutohuntHandoffCopyExportPreview({
    source_operator_decision: seed.readbacks.operator_decision,
    as_of: "2026-07-09T09:10:00.000Z",
  });
  const readyGate = buildAutohuntExecutionReadinessGate({
    workbench_spine: seed.records.workbench_spine,
    handoff_plan_readback: seed.readbacks.handoff_plan,
    operator_decision_readback: seed.readbacks.operator_decision,
    copy_export_preview: copyPreview,
    local_dogfood_seed_report: seed.report,
    as_of: "2026-07-09T09:11:00.000Z",
  });
  assert.equal(
    readyGate.readiness_status,
    "ready_for_future_supervised_execution_design",
  );
  assert.equal(readyGate.readiness_checks.checks_passed, true);
  return readyGate;
}

function successfulReport(contract) {
  return {
    result_report_id: "autohunt-result-report:successful-fixture",
    result_source: "dry_run_fixture_report",
    result_status: "completed",
    branch_created: false,
    pr_created: false,
    github_called: false,
    codex_executed: false,
    checks_run: contract.launch_envelope.required_checks,
    checks_passed: contract.launch_envelope.required_checks,
    checks_failed: [],
    checks_skipped: [],
    changed_files: ["types/autohunt-result-intake.ts"],
    changed_file_count: 1,
    expected_changed_file_globs: contract.launch_envelope.allowed_file_globs,
    max_changed_files: contract.launch_envelope.max_changed_files,
    budget_used: {
      iterations: 1,
      tool_calls: 2,
      codex_tasks: 0,
      draft_prs: 0,
      changed_files: 1,
    },
    useful_refs: [contract.contract_id],
    stale_refs: [],
    missing_refs: [],
    noisy_refs: [],
    blocker_reasons: [],
    warning_reasons: [],
    raw_result_text_persisted: false,
  };
}

function failedCheckReport(contract) {
  const [failedCheck, ...passedChecks] = contract.launch_envelope.required_checks;
  return {
    ...successfulReport(contract),
    result_report_id: "autohunt-result-report:failed-check-fixture",
    result_status: "completed_with_warnings",
    checks_run: contract.launch_envelope.required_checks,
    checks_passed: passedChecks,
    checks_failed: [failedCheck],
    warning_reasons: ["required_check_failed"],
  };
}

function skippedCheckReport(contract) {
  const [skippedCheck, ...passedChecks] = contract.launch_envelope.required_checks;
  return {
    ...successfulReport(contract),
    result_report_id: "autohunt-result-report:skipped-check-fixture",
    result_status: "completed_with_warnings",
    checks_run: passedChecks,
    checks_passed: passedChecks,
    checks_skipped: [skippedCheck],
    warning_reasons: ["required_check_skipped"],
  };
}

function assertPanelPassive() {
  assert.doesNotMatch(source.panel, /<button\b/i, "panel must not render buttons");
  assert.doesNotMatch(source.panel, /\bonClick\s*=/, "panel must not use onClick");
  assert.doesNotMatch(source.panel, /\bfetch\s*\(/, "panel must not fetch");
  assert.doesNotMatch(source.panel, /\bformAction\s*=/, "panel must not use formAction");
  assert.doesNotMatch(source.panel, /server action/i, "panel must not add server actions");
  assert.doesNotMatch(source.panel, /navigator\.clipboard|writeText\s*\(/i, "panel must not write clipboard");
  assert.doesNotMatch(source.panel, /\bdownload\s*=/i, "panel must not render download controls");
  assert.doesNotMatch(source.panel, /Launch[A-Z]|\bonLaunch\b/i, "panel must not expose launch controls");
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
