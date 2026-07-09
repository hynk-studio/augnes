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
  seedLocalAutohuntChainV01,
} from "./dogfood-seed-local-autohunt-chain-v0-1.mjs";
import {
  allValuesFalse,
} from "../lib/research-candidate-review/shared-source-chain-guards.ts";

const files = {
  type: "types/autohunt-execution-readiness-gate.ts",
  builder: "lib/autonomy/autohunt-execution-readiness-gate.ts",
  panel: "components/autonomy/autohunt-execution-readiness-gate-panel.tsx",
  agentWorkplane: "components/workplane/agent-workplane.tsx",
  db: "lib/db.ts",
  schema: "lib/db/schema.sql",
  migrations: "scripts/db-migrations.mjs",
  migrate: "scripts/db-migrate.mjs",
  smoke: "scripts/smoke-autohunt-execution-readiness-gate-v0-1.mjs",
  packageJson: "package.json",
  copyExportSmoke:
    "scripts/smoke-autohunt-handoff-copy-export-preview-v0-1.mjs",
  localAutohuntChainDogfoodSmoke:
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
  autonomyRunnerPreflightSmoke:
    "scripts/smoke-autonomy-runner-preflight-v0-1.mjs",
  autonomyContractSmoke: "scripts/smoke-autonomy-contract-v0-1.mjs",
  agentWorkplanePanelsSmoke: "scripts/smoke-agent-workplane-panels-v0-1.mjs",
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
assertPanelPassive();
assertWorkbenchMount();
assertExistingSmokesStillPass();

console.log(
  JSON.stringify(
    {
      smoke: "autohunt-execution-readiness-gate-v0-1",
      pass: true,
      expected_changed_files_checked: true,
      docs_changed: false,
      schema_follow_on_allowlist_checked: true,
      type_checked: true,
      builder_checked: true,
      panel_passive_checked: true,
      package_script_checked: true,
      workbench_mount_checked: true,
      ready_gate_checked: true,
      missing_and_blocked_statuses_checked: true,
      future_execution_design_requirements_checked: true,
      authority_boundary_checked: true,
      existing_copy_export_smoke_checked: true,
      local_dogfood_chain_smoke_checked: true,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:autohunt-execution-readiness-gate-v0-1");

function assertChangedFileBoundary() {
  const changedFiles = collectChangedFiles();
  for (const file of changedFiles) {
    assert(
      expectedChangedFiles.has(file),
      `Unexpected changed file for Autohunt execution readiness gate slice: ${file}`,
    );
    assert.doesNotMatch(file, /^docs\//, "readiness gate must not edit docs");
    assert.doesNotMatch(file, /^README/i, "readiness gate must not edit README");
    assert.doesNotMatch(file, /^app\/api\//, "readiness gate must not add API routes");
    if (/^(lib\/db\.ts|lib\/db\/schema\.sql|scripts\/db-migrations\.mjs|scripts\/db-migrate\.mjs)$/.test(file)) {
      assert(
        source[fileToSourceKey(file)].includes(
          "autohunt_supervised_execution_contracts",
        ),
        "readiness gate follow-on DB changes must be limited to supervised execution contract wiring",
      );
    }
  }
}

function fileToSourceKey(file) {
  return {
    "lib/db.ts": "db",
    "lib/db/schema.sql": "schema",
    "scripts/db-migrations.mjs": "migrations",
    "scripts/db-migrate.mjs": "migrate",
  }[file];
}

function assertStaticWiring() {
  assertPackageScript({
    packageJsonText: source.packageJson,
    scriptName: "smoke:autohunt-execution-readiness-gate-v0-1",
    expectedCommand:
      "tsx --tsconfig tsconfig.json scripts/smoke-autohunt-execution-readiness-gate-v0-1.mjs",
  });
  assertContains(source.type, [
    "AUTOHUNT_EXECUTION_READINESS_GATE_KIND",
    "ready_for_future_supervised_execution_design",
    "dogfood_seed_not_verified",
    "explicit_user_reconfirmation_required",
    "fresh_grant_required",
    "fresh_preflight_required",
    "fresh_operator_approval_required",
    "result_intake_required",
    "expected_observed_delta_required",
    "reuse_outcome_required",
    "residual_diagnostic_required",
    "raw_copy_text_persisted: false",
    "raw_pr_body_persisted: false",
  ]);
  assertContains(source.builder, [
    "buildAutohuntExecutionReadinessGate",
    "allValuesFalse",
    "assertAllFalseBoundary",
    "findForbiddenRawMaterialFields",
    "containsForbiddenRawMaterial",
    "requiredStringFieldsPresent",
    "validateSourceBindingPairs",
    "isDogfoodSeedReportReady",
  ]);
  assertContains(source.panel, [
    "AutohuntExecutionReadinessGatePanel",
    "Execution Readiness Gate",
    "does not start a runner",
    "launch",
    "Codex",
    "call GitHub",
    "create a branch or PR",
    "merge",
    "Object.entries(gate.authority_boundary)",
    "Object.entries(gate.material_boundary)",
  ]);
}

function assertBuilderBehavior() {
  const db = new Database(":memory:");
  try {
    const seed = seedLocalAutohuntChainV01({ db });
    assert.equal(seed.ok, true, JSON.stringify(seed.refusal_reasons ?? []));
    const copyPreview = buildAutohuntHandoffCopyExportPreview({
      source_operator_decision: seed.readbacks.operator_decision,
      as_of: "2026-07-09T07:40:00.000Z",
    });
    const ready = buildAutohuntExecutionReadinessGate({
      workbench_spine: seed.records.workbench_spine,
      handoff_plan_readback: seed.readbacks.handoff_plan,
      operator_decision_readback: seed.readbacks.operator_decision,
      copy_export_preview: copyPreview,
      local_dogfood_seed_report: seed.report,
      as_of: "2026-07-09T07:41:00.000Z",
    });
    assert.equal(
      ready.readiness_status,
      "ready_for_future_supervised_execution_design",
    );
    assert.equal(ready.readiness_checks.checks_passed, true);
    assert.equal(ready.readiness_checks.dogfood_seed_report_ready, true);
    assert.equal(allValuesFalse(ready.authority_boundary), true);
    assert.equal(ready.material_boundary.raw_material_persisted, false);
    for (const required of [
      "explicit_user_reconfirmation_required",
      "fresh_grant_required",
      "fresh_preflight_required",
      "fresh_operator_approval_required",
      "result_intake_required",
      "expected_observed_delta_required",
      "reuse_outcome_required",
      "residual_diagnostic_required",
    ]) {
      assert(
        ready.future_execution_design_requirements.includes(required),
        `${required} must be listed as a future execution design requirement`,
      );
    }

    assert.equal(
      buildAutohuntExecutionReadinessGate({
        workbench_spine: {
          ...seed.records.workbench_spine,
          latest_active_grant_summary: {
            ...seed.records.workbench_spine.latest_active_grant_summary,
            grant_id: null,
            grant_fingerprint: null,
          },
        },
        handoff_plan_readback: seed.readbacks.handoff_plan,
        operator_decision_readback: seed.readbacks.operator_decision,
        copy_export_preview: copyPreview,
      }).readiness_status,
      "missing_active_grant",
    );

    assert.equal(
      buildAutohuntExecutionReadinessGate({
        workbench_spine: {
          ...seed.records.workbench_spine,
          queued_candidate_summary: {
            ...seed.records.workbench_spine.queued_candidate_summary,
            queued_candidate_count: 0,
            latest_candidate_id: null,
            latest_candidate_fingerprint: null,
          },
        },
        handoff_plan_readback: seed.readbacks.handoff_plan,
        operator_decision_readback: seed.readbacks.operator_decision,
        copy_export_preview: copyPreview,
      }).readiness_status,
      "missing_queued_candidate",
    );

    assert.equal(
      buildAutohuntExecutionReadinessGate({
        workbench_spine: {
          ...seed.records.workbench_spine,
          ready_preflight_summary: {
            ...seed.records.workbench_spine.ready_preflight_summary,
            preflight_packet_id: null,
            preflight_packet_fingerprint: null,
          },
        },
        handoff_plan_readback: seed.readbacks.handoff_plan,
        operator_decision_readback: seed.readbacks.operator_decision,
        copy_export_preview: copyPreview,
      }).readiness_status,
      "missing_ready_preflight",
    );

    assert.equal(
      buildAutohuntExecutionReadinessGate({
        workbench_spine: seed.records.workbench_spine,
        handoff_plan_readback: {
          ...seed.readbacks.handoff_plan,
          selected_handoff_plan: null,
          latest_ready_handoff_plan: null,
        },
        operator_decision_readback: seed.readbacks.operator_decision,
        copy_export_preview: copyPreview,
      }).readiness_status,
      "missing_ready_handoff_plan",
    );

    assert.equal(
      buildAutohuntExecutionReadinessGate({
        workbench_spine: seed.records.workbench_spine,
        handoff_plan_readback: seed.readbacks.handoff_plan,
        operator_decision_readback: {
          ...seed.readbacks.operator_decision,
          selected_decision: null,
          latest_accepted_decision: null,
        },
        copy_export_preview: copyPreview,
      }).readiness_status,
      "missing_accepted_operator_decision",
    );

    assert.equal(
      buildAutohuntExecutionReadinessGate({
        workbench_spine: seed.records.workbench_spine,
        handoff_plan_readback: seed.readbacks.handoff_plan,
        operator_decision_readback: seed.readbacks.operator_decision,
        copy_export_preview: null,
      }).readiness_status,
      "missing_copy_export_preview",
    );

    assert.equal(
      buildAutohuntExecutionReadinessGate({
        workbench_spine: seed.records.workbench_spine,
        handoff_plan_readback: seed.readbacks.handoff_plan,
        operator_decision_readback: seed.readbacks.operator_decision,
        copy_export_preview: {
          ...copyPreview,
          preview_status: "missing_accepted_decision",
        },
      }).readiness_status,
      "copy_export_preview_not_ready",
    );

    assert.equal(
      buildAutohuntExecutionReadinessGate({
        workbench_spine: seed.records.workbench_spine,
        handoff_plan_readback: seed.readbacks.handoff_plan,
        operator_decision_readback: seed.readbacks.operator_decision,
        copy_export_preview: copyPreview,
        raw_material_probe: { raw_prompt_text: "not allowed" },
      }).readiness_status,
      "unsafe_material_detected",
    );

    assert.equal(
      buildAutohuntExecutionReadinessGate({
        workbench_spine: seed.records.workbench_spine,
        handoff_plan_readback: seed.readbacks.handoff_plan,
        operator_decision_readback: seed.readbacks.operator_decision,
        copy_export_preview: {
          ...copyPreview,
          authority_boundary: {
            ...copyPreview.authority_boundary,
            can_execute_codex: true,
          },
        },
      }).readiness_status,
      "authority_boundary_not_clear",
    );

    assert.equal(
      buildAutohuntExecutionReadinessGate({
        workbench_spine: seed.records.workbench_spine,
        handoff_plan_readback: seed.readbacks.handoff_plan,
        operator_decision_readback: seed.readbacks.operator_decision,
        copy_export_preview: copyPreview,
        local_dogfood_seed_report: {
          ...seed.report,
          ok: false,
        },
      }).readiness_status,
      "dogfood_seed_not_verified",
    );
  } finally {
    db.close();
  }
}

function assertPanelPassive() {
  assert.doesNotMatch(source.panel, /<button\b/i, "panel must not render buttons");
  assert.doesNotMatch(source.panel, /\bonClick\b/, "panel must not add click handlers");
  assert.doesNotMatch(source.panel, /\bfetch\s*\(/, "panel must not fetch");
  assert.doesNotMatch(source.panel, /formAction/, "panel must not add form actions");
  assert.doesNotMatch(source.panel, /use server/i, "panel must not add server actions");
  assert.doesNotMatch(source.panel, /navigator\.clipboard|clipboard\.writeText/i, "panel must not write clipboard");
  assert.doesNotMatch(source.panel, /download\s*=/i, "panel must not render downloads");
}

function assertWorkbenchMount() {
  assertContains(source.agentWorkplane, [
    "AutohuntExecutionReadinessGatePanel",
    "buildAutohuntExecutionReadinessGate",
    "const autohuntExecutionReadinessGate",
    "workbench_spine: autohuntWorkbenchReadbackSpine",
    "handoff_plan_readback: autohuntHandoffPlanPreviewReadback",
    "operator_decision_readback:",
    "copy_export_preview: autohuntHandoffCopyExportPreview",
    "<AutohuntExecutionReadinessGatePanel",
  ]);
  assertOrder(
    source.agentWorkplane,
    "<AutohuntHandoffCopyExportPreviewPanel",
    "<AutohuntExecutionReadinessGatePanel",
  );
  assertOrder(
    source.agentWorkplane,
    "<AutohuntExecutionReadinessGatePanel",
    "<AutonomyContractPreviewPanel",
  );
  assert.doesNotMatch(
    source.agentWorkplane,
    /writeAutohunt[A-Za-z0-9_]*/g,
    "Agent Workplane must not invoke Autohunt write helpers",
  );
  assert.doesNotMatch(
    source.agentWorkplane,
    /\bfetch\s*\(/,
    "Agent Workplane must not fetch for readiness gate",
  );
}

function assertExistingSmokesStillPass() {
  execFileSync("npm", ["run", "smoke:autohunt-handoff-copy-export-preview-v0-1"], {
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

function assertContains(text, needles) {
  for (const needle of needles) {
    assert(
      text.includes(needle),
      `Expected source to include ${JSON.stringify(needle)}`,
    );
  }
}

function assertOrder(text, beforeNeedle, afterNeedle) {
  const beforeIndex = text.indexOf(beforeNeedle);
  const afterIndex = text.indexOf(afterNeedle);
  assert(beforeIndex >= 0, `Missing ${beforeNeedle}`);
  assert(afterIndex >= 0, `Missing ${afterNeedle}`);
  assert(
    beforeIndex < afterIndex,
    `${beforeNeedle} must appear before ${afterNeedle}`,
  );
}
