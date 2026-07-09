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
  buildAutohuntExecutionReadinessGate,
} from "../lib/autonomy/autohunt-execution-readiness-gate.ts";
import {
  buildAutohuntHandoffCopyExportPreview,
} from "../lib/autonomy/autohunt-handoff-copy-export-preview.ts";
import {
  writeAutohuntDailyLauncherRun,
} from "../lib/autonomy/autohunt-daily-launcher-run-write.ts";
import {
  buildAutohuntWorkTargetModeOptions,
  getAutohuntWorkTargetModeOption,
} from "../lib/autonomy/autohunt-work-target-mode-options.ts";
import {
  writeAutohuntSupervisedExecutionContract,
} from "../lib/autonomy/autohunt-supervised-execution-contract-write.ts";
import {
  fingerprint,
} from "../lib/research-candidate-review/shared-source-chain-guards.ts";
import {
  AUTOHUNT_WORK_TARGET_MODES,
} from "../types/autohunt-work-target-mode.ts";
import {
  seedLocalAutohuntChainV01,
} from "./dogfood-seed-local-autohunt-chain-v0-1.mjs";

const files = {
  type: "types/autohunt-work-target-mode.ts",
  builder: "lib/autonomy/autohunt-work-target-mode-options.ts",
  panel:
    "components/human-surface/blank-state-autohunt-target-options-panel.tsx",
  home: "components/human-surface/human-surface-home.tsx",
  blankState: "components/human-surface/blank-state-panel.tsx",
  dailyLauncherType: "types/autohunt-daily-launcher-run.ts",
  dailyLauncherWriter:
    "lib/autonomy/autohunt-daily-launcher-run-write.ts",
  dailyLauncherReadback:
    "lib/autonomy/read-autohunt-daily-launcher-runs.ts",
  dailyLauncherCli: "scripts/autohunt-daily-launcher-v0-1.mjs",
  dailyLauncherSmoke:
    "scripts/smoke-autohunt-daily-launcher-run-v0-1.mjs",
  resultIntakeSmoke: "scripts/smoke-autohunt-result-intake-v0-1.mjs",
  supervisedExecutionContractSmoke:
    "scripts/smoke-autohunt-supervised-execution-contract-v0-1.mjs",
  executionReadinessGateSmoke:
    "scripts/smoke-autohunt-execution-readiness-gate-v0-1.mjs",
  persistentChainReadinessBindingSmoke:
    "scripts/smoke-autohunt-persistent-chain-readiness-binding-v0-1.mjs",
  localAutohuntChainDogfoodSmoke:
    "scripts/smoke-local-autohunt-chain-dogfood-v0-1.mjs",
  copyExportSmoke:
    "scripts/smoke-autohunt-handoff-copy-export-preview-v0-1.mjs",
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
  workQueueCandidateSmoke:
    "scripts/smoke-autohunt-work-queue-candidate-v0-1.mjs",
  delegationGrantSmoke:
    "scripts/smoke-autonomy-delegation-grant-record-v0-1.mjs",
  sharedSourceGuardSmoke: "scripts/smoke-shared-source-chain-guards-v0-1.mjs",
  autonomyRunnerPreflightSmoke:
    "scripts/smoke-autonomy-runner-preflight-v0-1.mjs",
  autonomyContractSmoke: "scripts/smoke-autonomy-contract-v0-1.mjs",
  agentWorkplanePanelsSmoke:
    "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  humanSurfaceSmoke: "scripts/smoke-human-surface-home-v0-1.mjs",
  blankStateSmoke:
    "scripts/smoke-blank-state-review-entry-absorption-v0-1.mjs",
  smoke: "scripts/smoke-autohunt-work-target-mode-options-v0-1.mjs",
  packageJson: "package.json",
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
assertBuilderBehavior();
assertDailyLauncherMetadata();
assertPanelPassive();
assertNoForbiddenImports();
assertExistingSmokesStillPass();

console.log(
  JSON.stringify(
    {
      smoke: "autohunt-work-target-mode-options-v0-1",
      pass: true,
      expected_changed_files_checked: true,
      docs_changed: false,
      schema_changed: false,
      routes_added: false,
      types_checked: true,
      builder_checked: true,
      blank_state_panel_checked: true,
      daily_launcher_target_mode_checked: true,
      branch_suggestion_checked: true,
      existing_smokes_checked: true,
      codex_executed: false,
      github_called: false,
      branch_or_pr_created: false,
      provider_openai_called: false,
      sources_fetched: false,
      retrieval_run: false,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:autohunt-work-target-mode-options-v0-1");

function assertChangedFileBoundary() {
  const changedFiles = collectChangedFiles();
  for (const file of changedFiles) {
    assert(
      expectedChangedFiles.has(file),
      `Unexpected changed file for Autohunt target mode options slice: ${file}`,
    );
    assert.doesNotMatch(file, /^docs\//, "slice must not edit docs");
    assert.doesNotMatch(file, /^README/i, "slice must not edit README");
    assert.doesNotMatch(file, /^app\/api\//, "slice must not add API routes");
    assert.doesNotMatch(file, /^app\/.*route\./, "slice must not add routes");
    assert.doesNotMatch(file, /^migrations\//, "slice must not add migrations");
    assert.notEqual(file, "lib/db/schema.sql", "slice must not change DB schema");
    assert.notEqual(file, "scripts/db-migrations.mjs", "slice must not change migrations");
    assert.notEqual(file, "scripts/db-migrate.mjs", "slice must not change migrations");
  }
}

function assertStaticWiring() {
  assertPackageScript({
    packageJsonText: source.packageJson,
    scriptName: "smoke:autohunt-work-target-mode-options-v0-1",
    expectedCommand:
      "tsx --tsconfig tsconfig.json scripts/smoke-autohunt-work-target-mode-options-v0-1.mjs",
  });
  assertContains(source.type, [
    "AUTOHUNT_WORK_TARGET_MODES",
    "extend_current_perspective_work",
    "create_new_perspective_work_from_autohunt_conditions",
    "durable_creation_allowed_now: false",
    "perspective_mutation_allowed_now: false",
    "cwp_mutation_allowed_now: false",
    "memory_write_allowed_now: false",
    "codex_execution_allowed_now: false",
    "github_or_pr_allowed_now: false",
  ]);
  assertContains(source.builder, [
    "buildAutohuntWorkTargetModeOptions",
    "AUTOHUNT_WORK_TARGET_MODE_OPTIONS",
    "현재 관점작업 연장",
    "Autohunt 조건으로 새 관점작업 생성",
    "selected_mode",
    "recommended_mode",
    "branch_suggestion",
    "authority_boundary_all_false: true",
    "raw_material_persisted: false",
  ]);
  assertContains(source.dailyLauncherType, [
    "work_target_mode?: AutohuntWorkTargetMode",
    "work_target_mode_label?: string",
    "durable_new_work_created?: false",
    "perspective_mutated?: false",
    "cwp_mutated?: false",
    "memory_written?: false",
  ]);
  assertContains(source.dailyLauncherWriter, [
    "work_target_mode: targetModeOption.mode",
    "work_target_mode_label: targetModeOption.short_label",
    "durable_new_work_created: false",
    "perspective_mutated: false",
    "cwp_mutated: false",
    "memory_written: false",
    "work_target_mode: input.work_target_mode",
  ]);
  assertContains(source.dailyLauncherCli, [
    "--target-mode",
    'targetMode: "extend_current_perspective_work"',
    "work_target_mode: result.launcher_run.handoff_packet.work_target_mode",
  ]);
  assertContains(source.home, [
    "readAutohuntDailyLauncherRuns",
    "readAutohuntResultIntakes",
    "buildAutohuntWorkTargetModeOptions",
    "autohuntTargetModeSummary",
  ]);
  assert.doesNotMatch(
    source.home,
    /writeAutohunt/i,
    "HumanSurfaceHome must not import Autohunt write helpers",
  );
  assertContains(source.blankState, [
    "BlankStateAutohuntTargetOptionsPanel",
    "autohuntTargetModeSummary",
  ]);
  assertContains(source.panel, [
    "Daily Autohunt target",
    "summary.options.map",
    "option.title",
    "/workbench#autohunt-daily-launcher",
    "/workbench#autohunt-result-intake",
    "/perspective",
  ]);
}

function assertBuilderBehavior() {
  assert.deepEqual(AUTOHUNT_WORK_TARGET_MODES, [
    "extend_current_perspective_work",
    "create_new_perspective_work_from_autohunt_conditions",
  ]);
  assert.equal(
    getAutohuntWorkTargetModeOption("extend_current_perspective_work").title,
    "현재 관점작업 연장",
  );

  const activeRead = currentPerspectiveRead({
    active_work_ids: ["work:current"],
    active_goals: [{ goal_id: "goal:1" }],
  });
  const defaultSummary = buildAutohuntWorkTargetModeOptions({
    currentPerspectiveRead: activeRead,
    as_of: "2026-07-09T11:00:00.000Z",
  });
  assert.equal(defaultSummary.options.length, 2);
  assert.equal(defaultSummary.selected_mode, "extend_current_perspective_work");
  assert.equal(defaultSummary.recommended_mode, "extend_current_perspective_work");
  assert.equal(defaultSummary.authority_boundary_all_false, true);
  assert.equal(defaultSummary.raw_material_persisted, false);
  assert(defaultSummary.summary_fingerprint);

  const emptyRead = currentPerspectiveRead({
    active_work_ids: [],
    active_goals: [],
  });
  const emptySummary = buildAutohuntWorkTargetModeOptions({
    currentPerspectiveRead: emptyRead,
    as_of: "2026-07-09T11:01:00.000Z",
  });
  assert.equal(emptySummary.selected_mode, "extend_current_perspective_work");
  assert.equal(
    emptySummary.recommended_mode,
    "create_new_perspective_work_from_autohunt_conditions",
  );

  const explicitSummary = buildAutohuntWorkTargetModeOptions({
    currentPerspectiveRead: activeRead,
    selectedMode: "create_new_perspective_work_from_autohunt_conditions",
    as_of: "2026-07-09T11:02:00.000Z",
  });
  assert.equal(
    explicitSummary.selected_mode,
    "create_new_perspective_work_from_autohunt_conditions",
  );

  const branchSummary = buildAutohuntWorkTargetModeOptions({
    currentPerspectiveRead: activeRead,
    latestResultIntakeReadback: resultIntakeReadback({
      residual_category: "source_chain_gap",
      severity: "medium",
      source_chain_helpfulness: "missing",
      delta_status: "major_delta",
    }),
    as_of: "2026-07-09T11:03:00.000Z",
  });
  assert(branchSummary.branch_suggestion);
  assert.equal(
    branchSummary.branch_suggestion.suggested_mode,
    "create_new_perspective_work_from_autohunt_conditions",
  );
  assert.equal(branchSummary.branch_suggestion.auto_promoted, false);
  assert.equal(branchSummary.branch_suggestion.durable_creation_allowed_now, false);

  const alignedSummary = buildAutohuntWorkTargetModeOptions({
    currentPerspectiveRead: activeRead,
    latestResultIntakeReadback: resultIntakeReadback({
      residual_category: "no_residual",
      severity: "none",
      source_chain_helpfulness: "helpful",
      delta_status: "aligned",
    }),
    as_of: "2026-07-09T11:04:00.000Z",
  });
  assert.equal(alignedSummary.branch_suggestion, null);
}

function assertDailyLauncherMetadata() {
  const db = new Database(":memory:");
  try {
    const contract = createReadyExecutionContract(db);
    const defaultRun = writeAutohuntDailyLauncherRun(
      {
        scope: "project:augnes",
        source_execution_contract: contract,
        daily_confirmation: confirmation("default-target"),
      },
      { db, now: "2026-07-09T11:10:00.000Z" },
    );
    assert.equal(defaultRun.ok, true);
    assert.equal(
      defaultRun.launcher_run?.handoff_packet.work_target_mode,
      "extend_current_perspective_work",
    );
    assert.equal(
      defaultRun.launcher_run?.handoff_packet.durable_new_work_created,
      false,
    );
    assert.equal(defaultRun.launcher_run?.handoff_packet.perspective_mutated, false);
    assert.equal(defaultRun.launcher_run?.handoff_packet.cwp_mutated, false);
    assert.equal(defaultRun.launcher_run?.handoff_packet.memory_written, false);

    const newWorkRun = writeAutohuntDailyLauncherRun(
      {
        scope: "project:augnes",
        source_execution_contract: contract,
        daily_confirmation: confirmation("new-work-target"),
        work_target_mode: "create_new_perspective_work_from_autohunt_conditions",
      },
      { db, now: "2026-07-09T11:11:00.000Z" },
    );
    assert.equal(newWorkRun.ok, true);
    assert.equal(
      newWorkRun.launcher_run?.handoff_packet.work_target_mode,
      "create_new_perspective_work_from_autohunt_conditions",
    );
    assert.equal(
      newWorkRun.launcher_run?.handoff_packet.durable_new_work_created,
      false,
    );
    assert.equal(newWorkRun.launcher_run?.launcher_run_boundary.codex_executed, false);
    assert.equal(newWorkRun.launcher_run?.launcher_run_boundary.github_called, false);
    assert.equal(
      newWorkRun.launcher_run?.launcher_run_boundary.branch_or_pr_created,
      false,
    );
    assert.equal(
      newWorkRun.launcher_run?.launcher_run_boundary.provider_openai_called,
      false,
    );
    assert.equal(newWorkRun.launcher_run?.launcher_run_boundary.sources_fetched, false);
    assert.equal(newWorkRun.launcher_run?.launcher_run_boundary.retrieval_run, false);

    const invalid = writeAutohuntDailyLauncherRun(
      {
        scope: "project:augnes",
        source_execution_contract: contract,
        daily_confirmation: confirmation("invalid-target"),
        work_target_mode: "invalid_mode",
      },
      { db, now: "2026-07-09T11:12:00.000Z" },
    );
    assert.equal(invalid.ok, false);
    assert(invalid.refusal_reasons.includes("work_target_mode_invalid"));
  } finally {
    db.close();
  }
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
    source.builder,
    source.panel,
    source.home,
    source.blankState,
    source.dailyLauncherType,
    source.dailyLauncherWriter,
    source.dailyLauncherReadback,
    source.dailyLauncherCli,
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
  for (const smoke of [
    "smoke:human-surface-home-v0-1",
    "smoke:blank-state-review-entry-absorption-v0-1",
    "smoke:autohunt-daily-launcher-run-v0-1",
    "smoke:autohunt-result-intake-v0-1",
  ]) {
    execFileSync("npm", ["run", smoke], { stdio: "pipe" });
  }
}

function createReadyExecutionContract(db) {
  const seed = seedLocalAutohuntChainV01({ db });
  const copyPreview = buildAutohuntHandoffCopyExportPreview({
    source_operator_decision: seed.readbacks.operator_decision,
    as_of: "2026-07-09T11:05:00.000Z",
  });
  const readyGate = buildAutohuntExecutionReadinessGate({
    workbench_spine: seed.records.workbench_spine,
    handoff_plan_readback: seed.readbacks.handoff_plan,
    operator_decision_readback: seed.readbacks.operator_decision,
    copy_export_preview: copyPreview,
    local_dogfood_seed_report: seed.report,
    as_of: "2026-07-09T11:06:00.000Z",
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
    { db, now: "2026-07-09T11:07:00.000Z" },
  );
  assert.equal(contractWrite.ok, true);
  assert(contractWrite.contract);
  return contractWrite.contract;
}

function currentPerspectiveRead({ active_work_ids, active_goals }) {
  return {
    data: {
      current_frame: {
        active_work_ids,
      },
      active_goals,
    },
    source_status: "runtime",
    fallback_reason: null,
    authority_boundary: {},
  };
}

function resultIntakeReadback({
  residual_category,
  severity,
  source_chain_helpfulness,
  delta_status,
}) {
  const intake = {
    result_intake_id: `autohunt-result-intake:${residual_category}`,
    result_intake_status: "result_intake_recorded",
    expected_observed_delta_candidate: {
      delta_status,
      delta_fingerprint: fingerprint({ delta_status }),
    },
    reuse_outcome_candidate: {
      source_chain_helpfulness,
      outcome_fingerprint: fingerprint({ source_chain_helpfulness }),
    },
    residual_diagnostic_candidate: {
      residual_category,
      severity,
      residual_fingerprint: fingerprint({ residual_category, severity }),
    },
    learning_loop_summary: {
      ready_for_next_daily_autohunt_cycle:
        residual_category === "no_residual" &&
        source_chain_helpfulness === "helpful",
    },
  };
  return {
    selected_result_intake: intake,
    latest_recorded_result_intake: intake,
  };
}

function confirmation(seed) {
  const confirmationRef = `confirmation:autohunt-target-mode:${seed}`;
  const confirmedAt = "2026-07-09T11:08:00.000Z";
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

function collectChangedFiles() {
  return uniqueSorted([
    ...collectGitDiffFiles(["diff", "--name-only"]).files,
    ...collectGitDiffFiles(["diff", "--cached", "--name-only"]).files,
    ...collectUntrackedFiles(),
    ...getBaseRangeChangedFiles().files,
  ]);
}

function assertContains(text, needles) {
  for (const needle of needles) {
    assert(
      text.includes(needle),
      `Expected source to include ${JSON.stringify(needle)}`,
    );
  }
}
