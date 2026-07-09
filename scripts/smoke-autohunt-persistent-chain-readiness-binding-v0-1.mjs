#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Database from "better-sqlite3";

import {
  assertPackageScript,
  collectGitDiffFiles,
  collectUntrackedFiles,
  getBaseRangeChangedFiles,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";
import { buildAutohuntExecutionReadinessGate } from "../lib/autonomy/autohunt-execution-readiness-gate.ts";
import { buildAutohuntHandoffCopyExportPreview } from "../lib/autonomy/autohunt-handoff-copy-export-preview.ts";
import { writeAutohuntDailyLauncherRun } from "../lib/autonomy/autohunt-daily-launcher-run-write.ts";
import { writeAutohuntSupervisedExecutionContract } from "../lib/autonomy/autohunt-supervised-execution-contract-write.ts";
import { readAutonomyDelegationGrants } from "../lib/autonomy/read-autonomy-delegation-grants.ts";
import { readAutohuntHandoffPlanOperatorReviewDecisions } from "../lib/autonomy/read-autohunt-handoff-plan-operator-review-decisions.ts";
import { readAutohuntHandoffPlanPreviews } from "../lib/autonomy/read-autohunt-handoff-plan-previews.ts";
import { readAutohuntPreflightPackets } from "../lib/autonomy/read-autohunt-preflight-packets.ts";
import { readAutohuntWorkQueueCandidates } from "../lib/autonomy/read-autohunt-work-queue-candidates.ts";
import { buildAutohuntWorkbenchReadbackSpine } from "../lib/autonomy/autohunt-workbench-readback-spine.ts";
import { seedLocalAutohuntChainV01 } from "./dogfood-seed-local-autohunt-chain-v0-1.mjs";
import {
  allValuesFalse,
  fingerprint,
  stableJson,
} from "../lib/research-candidate-review/shared-source-chain-guards.ts";

const smokeName = "autohunt-persistent-chain-readiness-binding-v0-1";
const allowedChangedFiles = new Set([
  "lib/autonomy/autohunt-execution-readiness-gate.ts",
  "package.json",
  "scripts/smoke-autohunt-persistent-chain-readiness-binding-v0-1.mjs",
  "scripts/smoke-autohunt-daily-launcher-run-v0-1.mjs",
  "scripts/smoke-autohunt-execution-readiness-gate-v0-1.mjs",
  "scripts/smoke-autohunt-handoff-copy-export-preview-v0-1.mjs",
  "scripts/smoke-autohunt-handoff-plan-operator-review-decision-v0-1.mjs",
  "scripts/smoke-autohunt-handoff-plan-operator-review-decision-workbench-mount-v0-1.mjs",
  "scripts/smoke-autohunt-handoff-plan-preview-v0-1.mjs",
  "scripts/smoke-autohunt-handoff-plan-preview-workbench-mount-v0-1.mjs",
  "scripts/smoke-autohunt-preflight-packet-v0-1.mjs",
  "scripts/smoke-autohunt-result-intake-v0-1.mjs",
  "scripts/smoke-autohunt-supervised-execution-contract-v0-1.mjs",
  "scripts/smoke-autohunt-work-queue-candidate-v0-1.mjs",
  "scripts/smoke-autohunt-workbench-readback-spine-v0-1.mjs",
  "scripts/smoke-autonomy-contract-v0-1.mjs",
  "scripts/smoke-autonomy-delegation-grant-record-v0-1.mjs",
  "scripts/smoke-autonomy-runner-preflight-v0-1.mjs",
  "scripts/smoke-shared-source-chain-guards-v0-1.mjs",
  "scripts/smoke-local-autohunt-chain-dogfood-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "types/autohunt-work-target-mode.ts",
  "lib/autonomy/autohunt-work-target-mode-options.ts",
  "components/human-surface/blank-state-autohunt-target-options-panel.tsx",
  "components/human-surface/human-surface-home.tsx",
  "components/human-surface/blank-state-panel.tsx",
  "types/autohunt-daily-launcher-run.ts",
  "lib/autonomy/autohunt-daily-launcher-run-write.ts",
  "lib/autonomy/read-autohunt-daily-launcher-runs.ts",
  "scripts/autohunt-daily-launcher-v0-1.mjs",
  "scripts/smoke-autohunt-work-target-mode-options-v0-1.mjs",
  "scripts/smoke-human-surface-home-v0-1.mjs",
  "scripts/smoke-blank-state-review-entry-absorption-v0-1.mjs",
]);
const passiveBlankStateComponentFollowOnFiles = new Set([
  "components/human-surface/blank-state-autohunt-target-options-panel.tsx",
  "components/human-surface/human-surface-home.tsx",
  "components/human-surface/blank-state-panel.tsx",
]);

assertChangedFileBoundary();
assertPackageScript({
  packageJsonText: readFileSync("package.json", "utf8"),
  scriptName: `smoke:${smokeName}`,
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-autohunt-persistent-chain-readiness-binding-v0-1.mjs",
});

const db = new Database(":memory:");
try {
  const firstSeed = seedLocalAutohuntChainV01({
    db,
    mode: "persistent_local_db",
  });
  assert.equal(firstSeed.ok, true, JSON.stringify(firstSeed.refusal_reasons ?? []));
  assert.equal(firstSeed.write_results.grant.result_status, "written");

  const replayedSeed = seedLocalAutohuntChainV01({
    db,
    mode: "persistent_local_db",
  });
  assert.equal(
    replayedSeed.ok,
    true,
    JSON.stringify(replayedSeed.refusal_reasons ?? []),
  );
  for (const [step, result] of Object.entries(replayedSeed.write_results)) {
    assert.equal(
      result.result_status,
      "duplicate_replayed",
      `${step} should duplicate replay in persistent-shaped DB`,
    );
  }

  const rebuilt = rebuildPersistentReadbacks(db);
  const copyPreview = buildAutohuntHandoffCopyExportPreview({
    source_operator_decision: rebuilt.operatorDecisionReadback,
    as_of: "2026-07-09T12:01:00.000Z",
  });
  const gate = buildAutohuntExecutionReadinessGate({
    workbench_spine: rebuilt.workbenchSpine,
    handoff_plan_readback: rebuilt.handoffPlanReadback,
    operator_decision_readback: rebuilt.operatorDecisionReadback,
    copy_export_preview: copyPreview,
    local_dogfood_seed_report: replayedSeed.report,
    as_of: "2026-07-09T12:02:00.000Z",
  });

  assert.equal(
    rebuilt.workbenchSpine.spine_fingerprint !==
      rebuilt.handoffPlan.source_workbench_spine.spine_fingerprint,
    true,
    "rebuilt Workbench spine fingerprint should drift when as_of changes",
  );
  assert.equal(
    gate.readiness_status,
    "ready_for_future_supervised_execution_design",
  );
  assert.equal(gate.readiness_checks.checks_passed, true);
  assert.equal(gate.readiness_checks.source_chain_bindings_present, true);
  assert.deepEqual(gate.readiness_checks.blocker_reasons, []);
  assert(
    gate.readiness_checks.warning_reasons.includes(
      "workbench_spine_fingerprint_rebuilt_differs_from_handoff_source_spine",
    ),
    "full Workbench spine fingerprint drift must be warning-only",
  );
  assertStableSourceBindings(rebuilt, copyPreview);

  const contractWrite = writeAutohuntSupervisedExecutionContract(
    {
      scope: "project:augnes",
      source_readiness_gate: gate,
    },
    { db, now: "2026-07-09T12:03:00.000Z" },
  );
  assert.equal(
    contractWrite.ok,
    true,
    JSON.stringify(contractWrite.refusal_reasons ?? []),
  );
  assert.equal(
    contractWrite.contract?.contract_status,
    "ready_for_future_limited_launcher",
  );
  assert.equal(contractWrite.contract_record_written, true);

  const launcherWrite = writeAutohuntDailyLauncherRun(
    {
      scope: "project:augnes",
      source_execution_contract: contractWrite.contract,
      mode: "prepare_handoff_and_record_fixture_result",
      daily_confirmation: confirmation("persistent-binding"),
    },
    { db, now: "2026-07-09T12:04:00.000Z" },
  );
  assert.equal(
    launcherWrite.ok,
    true,
    JSON.stringify(launcherWrite.refusal_reasons ?? []),
  );
  assert.equal(
    launcherWrite.launcher_run?.launcher_run_status,
    "result_intake_recorded",
  );
  assert(launcherWrite.launcher_run?.launcher_run_id);
  assert(launcherWrite.launcher_run?.handoff_packet.handoff_packet_id);
  assert(launcherWrite.launcher_run?.linked_result_intake?.result_intake_id);
  assert(
    launcherWrite.launcher_run?.linked_result_intake
      ?.expected_observed_delta_fingerprint,
  );
  assert(
    launcherWrite.launcher_run?.linked_result_intake?.reuse_outcome_fingerprint,
  );
  assert(
    launcherWrite.launcher_run?.linked_result_intake
      ?.residual_diagnostic_fingerprint,
  );
  assert.equal(allValuesFalse(launcherWrite.launcher_run.authority_boundary), true);
  assertNoExternalExecutionFlags(launcherWrite.launcher_run.launcher_run_boundary);

  console.log(
    JSON.stringify(
      {
        smoke: smokeName,
        pass: true,
        duplicate_replay_checked: true,
        rebuilt_spine_drift_warning_only: true,
        contract_status: contractWrite.contract.contract_status,
        launcher_run_status: launcherWrite.launcher_run.launcher_run_status,
        linked_result_intake_id:
          launcherWrite.launcher_run.linked_result_intake.result_intake_id,
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
  console.log(`PASS smoke:${smokeName}`);
} finally {
  db.close();
}

function rebuildPersistentReadbacks(db) {
  const scope = "project:augnes";
  const grantReadback = readAutonomyDelegationGrants({
    db,
    scope,
    grant_status: "active",
    limit: 10,
  });
  const grant = grantReadback.selected_grant ?? grantReadback.latest_active_grant;
  assert(grant, "active grant must exist");

  const queueReadback = readAutohuntWorkQueueCandidates({
    db,
    scope,
    source_grant_id: grant.grant_id,
    candidate_status: "queued",
    limit: 10,
  });
  assert(queueReadback.selected_queued_candidates.length > 0);

  const preflightReadback = readAutohuntPreflightPackets({
    db,
    scope,
    source_grant_id: grant.grant_id,
    preflight_status: "ready_for_supervised_handoff_planning",
    limit: 10,
  });
  const preflight =
    preflightReadback.selected_preflight_packet ??
    preflightReadback.latest_ready_preflight_packet;
  assert(preflight, "ready preflight packet must exist");

  const workbenchSpine = buildAutohuntWorkbenchReadbackSpine({
    grant_readback: grantReadback,
    queue_readback: queueReadback,
    preflight_readback: preflightReadback,
    as_of: "2026-07-09T12:00:00.000Z",
  });

  const handoffPlanReadback = readAutohuntHandoffPlanPreviews({
    db,
    scope,
    source_grant_id: grant.grant_id,
    source_preflight_packet_id: preflight.preflight_packet_id,
    handoff_plan_status: "ready_for_operator_review",
    limit: 10,
  });
  const handoffPlan =
    handoffPlanReadback.selected_handoff_plan ??
    handoffPlanReadback.latest_ready_handoff_plan;
  assert(handoffPlan, "ready handoff plan must exist");

  const operatorDecisionReadback = readAutohuntHandoffPlanOperatorReviewDecisions(
    {
      db,
      scope,
      source_handoff_plan_id: handoffPlan.handoff_plan_id,
      decision_status:
        "accepted_for_future_supervised_handoff_copy_export_planning",
      limit: 10,
    },
  );
  const operatorDecision =
    operatorDecisionReadback.selected_decision ??
    operatorDecisionReadback.latest_accepted_decision;
  assert(operatorDecision, "accepted operator decision must exist");

  return {
    grant,
    grantReadback,
    queueReadback,
    preflight,
    preflightReadback,
    workbenchSpine,
    handoffPlan,
    handoffPlanReadback,
    operatorDecision,
    operatorDecisionReadback,
  };
}

function assertStableSourceBindings(rebuilt, copyPreview) {
  assert.equal(
    rebuilt.workbenchSpine.latest_active_grant_summary.grant_id,
    rebuilt.handoffPlan.source_grant.grant_id,
  );
  assert.equal(
    rebuilt.workbenchSpine.latest_active_grant_summary.grant_fingerprint,
    rebuilt.handoffPlan.source_grant.grant_fingerprint,
  );
  assert.equal(
    rebuilt.workbenchSpine.ready_preflight_summary.preflight_packet_id,
    rebuilt.handoffPlan.source_preflight.preflight_packet_id,
  );
  assert.equal(
    rebuilt.workbenchSpine.ready_preflight_summary.preflight_packet_fingerprint,
    rebuilt.handoffPlan.source_preflight.preflight_packet_fingerprint,
  );
  assert.equal(
    rebuilt.handoffPlan.handoff_plan_id,
    rebuilt.operatorDecision.source_handoff_plan.handoff_plan_id,
  );
  assert.equal(
    rebuilt.handoffPlan.handoff_plan_fingerprint,
    rebuilt.operatorDecision.source_handoff_plan.handoff_plan_fingerprint,
  );
  assert.equal(
    rebuilt.operatorDecision.decision_id,
    copyPreview.source_operator_decision.decision_id,
  );
  assert.equal(
    rebuilt.operatorDecision.decision_fingerprint,
    copyPreview.source_operator_decision.decision_fingerprint,
  );
  assert.equal(
    rebuilt.handoffPlan.handoff_plan_id,
    copyPreview.source_handoff_plan.handoff_plan_id,
  );
  assert.equal(
    rebuilt.handoffPlan.handoff_plan_fingerprint,
    copyPreview.source_handoff_plan.handoff_plan_fingerprint,
  );
  assert.equal(
    stableJson(rebuilt.workbenchSpine.chain_binding.selected_candidate_ids),
    stableJson(rebuilt.handoffPlan.source_preflight.selected_candidate_ids),
  );
  assert.equal(
    stableJson(
      rebuilt.workbenchSpine.chain_binding.selected_candidate_fingerprints,
    ),
    stableJson(
      rebuilt.handoffPlan.source_preflight.selected_candidate_fingerprints,
    ),
  );
  assert.equal(
    stableJson(rebuilt.handoffPlan.source_preflight.selected_candidate_ids),
    stableJson(
      rebuilt.operatorDecision.source_handoff_plan.selected_candidate_ids,
    ),
  );
  assert.equal(
    stableJson(
      rebuilt.handoffPlan.source_preflight.selected_candidate_fingerprints,
    ),
    stableJson(
      rebuilt.operatorDecision.source_handoff_plan
        .selected_candidate_fingerprints,
    ),
  );
  assert.equal(
    stableJson(
      rebuilt.operatorDecision.source_handoff_plan.selected_candidate_ids,
    ),
    stableJson(copyPreview.source_handoff_plan.selected_candidate_ids),
  );
  assert.equal(
    stableJson(
      rebuilt.operatorDecision.source_handoff_plan
        .selected_candidate_fingerprints,
    ),
    stableJson(copyPreview.source_handoff_plan.selected_candidate_fingerprints),
  );
}

function confirmation(seed) {
  const confirmationRef = `confirmation:local-daily-autohunt-v0-1:${seed}`;
  const confirmedAt = "2026-07-09T12:04:00.000Z";
  return {
    confirmation_ref: confirmationRef,
    confirmed_by: "operator:smoke",
    confirmed_at: confirmedAt,
    confirmation_fingerprint: fingerprint({
      confirmation_ref: confirmationRef,
      confirmed_by: "operator:smoke",
      confirmed_at: confirmedAt,
      launcher: "autohunt-persistent-chain-readiness-binding-v0-1",
    }),
    raw_confirmation_text_persisted: false,
  };
}

function assertNoExternalExecutionFlags(boundary) {
  for (const flag of [
    "codex_executed",
    "github_called",
    "branch_or_pr_created",
    "merge_or_deploy_performed",
    "provider_openai_called",
    "sources_fetched",
    "retrieval_run",
    "state_mutated_outside_launcher_run",
  ]) {
    assert.equal(boundary[flag], false, `${flag} must remain false`);
  }
}

function assertChangedFileBoundary() {
  const workingTree = collectGitDiffFiles(["diff", "--name-only", "HEAD"]);
  const baseRange = getBaseRangeChangedFiles();
  const untrackedFiles = collectUntrackedFiles();
  const changedFiles = uniqueSorted([
    ...workingTree.files,
    ...baseRange.files,
    ...untrackedFiles,
  ]);

  for (const file of changedFiles) {
    assert(
      allowedChangedFiles.has(file),
      `Unexpected changed file for ${smokeName}: ${file}`,
    );
    assert.doesNotMatch(file, /^docs\//, "must not edit docs");
    assert.doesNotMatch(file, /^README/i, "must not edit README");
    assert.doesNotMatch(file, /^app\/api\//, "must not add routes");
    assert.doesNotMatch(file, /^app\/.*actions?\./, "must not add server actions");
    assert.doesNotMatch(file, /^lib\/db\.ts$/, "must not edit DB wiring");
    assert.doesNotMatch(file, /^lib\/db\/schema\.sql$/, "must not edit schema");
    assert.doesNotMatch(file, /^scripts\/db-migrations\.mjs$/, "must not edit migrations");
    assert.doesNotMatch(file, /^scripts\/db-migrate\.mjs$/, "must not edit migrations");
    if (!passiveBlankStateComponentFollowOnFiles.has(file)) {
      assert.doesNotMatch(file, /^components\//, "must not add action buttons");
    }
  }

  const changedSource = changedFiles
    .filter((file) => /\.(ts|tsx|mjs|js)$/.test(file))
    .filter((file) => !file.startsWith("scripts/smoke-"))
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");
  assert.doesNotMatch(
    changedSource,
    /(<button\b|clipboard\.writeText|navigator\.clipboard|onClick=\{[^}]*launch|onClick=\{[^}]*copy|onClick=\{[^}]*download)/i,
    "must not add action/copy/download/launch button handlers or clipboard writes",
  );
}
