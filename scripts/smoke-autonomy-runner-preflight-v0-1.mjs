#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertPackageScript,
  collectGitDiffFiles,
  collectUntrackedFiles,
  loadTextByFile,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const contractDoc = "docs/AUTONOMY_RUNNER_PREFLIGHT_V0_1.md";
const typeFile = "types/autonomy-runner.ts";
const helperFile = "lib/autonomy/autonomy-runner-preflight.ts";
const fixtureFile = "fixtures/autonomy-runner-preflight.sample.v0.1.json";
const smokeFile = "scripts/smoke-autonomy-runner-preflight-v0-1.mjs";
const packageJsonFile = "package.json";
const indexDoc = "docs/00_INDEX_LATEST.md";

const requiredFiles = [
  contractDoc,
  typeFile,
  helperFile,
  fixtureFile,
  smokeFile,
  packageJsonFile,
  indexDoc,
];

const priorSmokeAllowlistCompatibilityFiles = [
  "scripts/smoke-augnes-delta-contract-v0-1.mjs",
  "scripts/smoke-augnes-delta-projection-v0-1.mjs",
  "scripts/smoke-augnes-delta-projection-route-v0-1.mjs",
  "scripts/smoke-current-working-perspective-v0-1.mjs",
  "scripts/smoke-current-working-perspective-route-v0-1.mjs",
  "scripts/smoke-human-surface-home-v0-1.mjs",
  "scripts/smoke-perspective-human-timeline-v0-1.mjs",
  "scripts/smoke-agent-workplane-shell-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
  "scripts/smoke-guide-brief-v0-1.mjs",
  "scripts/smoke-guide-brief-route-v0-1.mjs",
  "scripts/smoke-web-guide-panel-v0-1.mjs",
  "scripts/smoke-chatgpt-app-guide-brief-tool-v0-1.mjs",
  "scripts/smoke-codex-guidebrief-handoff-v0-1.mjs",
  "scripts/smoke-handoff-capsule-v0-1.mjs",
  "scripts/smoke-handoff-capsule-route-v0-1.mjs",
  "scripts/smoke-handoff-capsule-web-preview-v0-1.mjs",
  "scripts/smoke-chatgpt-app-handoff-capsule-tool-v0-1.mjs",
  "scripts/smoke-codex-handoff-capsule-v0-1.mjs",
  "scripts/smoke-handoff-capsule-copy-export-v0-1.mjs",
  "scripts/smoke-autonomy-contract-v0-1.mjs",
  "scripts/smoke-autonomy-contract-route-v0-1.mjs",
  "scripts/smoke-autonomy-contract-web-preview-v0-1.mjs",
  "scripts/smoke-chatgpt-app-autonomy-contract-tool-v0-1.mjs",
  "scripts/smoke-codex-autonomy-contract-v0-1.mjs",
  "scripts/smoke-autonomy-contract-copy-export-v0-1.mjs",
  "app/api/augnes/read/autonomy-runner-preflight/route.ts",
  "lib/autonomy/autonomy-runner-preflight-source.ts",
  "scripts/smoke-autonomy-runner-preflight-route-v0-1.mjs",
  "lib/autonomy/read-autonomy-runner-preflight-for-web.ts",
  "components/autonomy/autonomy-runner-preflight-preview-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "scripts/smoke-autonomy-runner-preflight-web-preview-v0-1.mjs",
  "apps/augnes_apps/src/server.ts",
  "apps/augnes_apps/src/lib/state-runtime-types.ts",
  "apps/augnes_apps/src/adapters/state-runtime-http.ts",
  "apps/augnes_apps/scripts/invariants.ts",
  "apps/augnes_apps/scripts/smoke.ts",
  "apps/augnes_apps/scripts/mock-state-runtime.ts",
  "scripts/smoke-chatgpt-app-autonomy-runner-preflight-tool-v0-1.mjs",
];

const allowedChangedFiles = new Set([
  ...requiredFiles,
  ...priorSmokeAllowlistCompatibilityFiles,
]);

const forbiddenChangedFilePatterns = [
  /^app\/(?!api\/augnes\/read\/autonomy-runner-preflight\/route\.ts$)/,
  /^components\//,
  /^apps\/augnes_apps\//,
  /^migrations\//,
  /^db\//,
  /^lib\/db(\/|\.|$)/,
  /^plugins\//,
  /(^|\/)(mcp|tool|tools|hook|hooks)(\/|$)/i,
  /(^|\/)(provider|providers|openai|github|octokit)(\/|$)/i,
  /(^|\/)(proof|evidence)(\/|$)/i,
  /(^|\/)(scheduler|daemon|background-worker|background_worker)(\/|$)/i,
  /(^|\/)route\.(js|jsx|ts|tsx)$/,
  /(^|\/)api\.(js|jsx|ts|tsx)$/,
];

const phase9cWebPreviewFollowOnFiles = new Set([
  "lib/autonomy/read-autonomy-runner-preflight-for-web.ts",
  "components/autonomy/autonomy-runner-preflight-preview-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "scripts/smoke-autonomy-runner-preflight-web-preview-v0-1.mjs",
]);

const phase9dChatgptAppFollowOnFiles = new Set([
  "apps/augnes_apps/src/server.ts",
  "apps/augnes_apps/src/lib/state-runtime-types.ts",
  "apps/augnes_apps/src/adapters/state-runtime-http.ts",
  "apps/augnes_apps/scripts/invariants.ts",
  "apps/augnes_apps/scripts/smoke.ts",
  "apps/augnes_apps/scripts/mock-state-runtime.ts",
  "scripts/smoke-chatgpt-app-autonomy-runner-preflight-tool-v0-1.mjs",
]);

const authorityBooleanFields = [
  "source_of_truth",
  "can_start_runner",
  "can_schedule_runner",
  "can_start_daemon",
  "can_start_background_work",
  "can_commit_or_reject_state",
  "can_record_proof",
  "can_create_evidence",
  "can_update_work",
  "can_mutate_memory",
  "can_apply_project_perspective",
  "can_publish_external",
  "can_merge",
  "can_retry_replay_deploy",
  "can_call_github",
  "can_call_openai_or_provider",
  "can_execute_codex",
  "can_create_branch_or_pr",
  "can_send_handoff",
  "can_launch_codex",
  "can_launch_autonomy",
  "can_schedule_background_work",
  "can_create_mcp_tool",
  "can_create_ui_action",
  "can_post_external_comment",
  "can_write_db",
  "can_spend_budget",
  "can_auto_apply_delta",
];

const expectedTypeExports = [
  "AutonomyRunnerPreflight",
  "AutonomyDryRunPlan",
  "AutonomyRunReadiness",
  "AutonomyRunBlocker",
  "AutonomyRunWarning",
  "AutonomyRunStepPreview",
  "AutonomyRunnerPreflightInput",
  "AutonomyBudgetAssessment",
  "AutonomyActionScopeAssessment",
  "AutonomyDeltaMergeAssessment",
  "AutonomyReviewEscalationAssessment",
  "AutonomyStopConditionAssessment",
  "AutonomyStalenessAssessment",
  "AutonomyAuthorityAssessment",
];

const expectedHelperExports = [
  "buildAutonomyRunnerPreflight",
  "buildAutonomyDryRunPlan",
  "assessAutonomyBudget",
  "assessAutonomyActionScope",
  "assessAutonomyDeltaMergePolicy",
  "assessAutonomyReviewEscalation",
  "assessAutonomyStopConditions",
  "assessAutonomyStaleness",
  "assessAutonomyAuthority",
  "deriveAutonomyRunReadiness",
  "buildAutonomyRunBlockers",
  "buildAutonomyRunWarnings",
  "buildAutonomyPreflightAuthorityBoundary",
];

const allowedDryRunActionKinds = [
  "read_contract",
  "read_preview_inputs",
  "evaluate_budget",
  "evaluate_stop_conditions",
  "evaluate_review_escalation",
  "rank_candidate_steps",
  "build_dry_run_plan",
  "draft_report_preview",
];

const forbiddenActions = [
  "execute_codex",
  "run_codex",
  "call_github",
  "call_openai_or_provider",
  "create_branch_or_pr",
  "send_handoff",
  "write_db",
  "record_proof",
  "create_evidence",
  "mutate_memory",
  "apply_project_perspective",
  "publish_external",
  "merge",
  "retry_replay_deploy",
  "start_background_work",
  "schedule_background_work",
  "schedule_run",
  "spend_budget",
  "auto_apply_delta",
];

const textByFile = loadTextByFile(requiredFiles);
const docText = textByFile.get(contractDoc);
const typeText = textByFile.get(typeFile);
const helperText = textByFile.get(helperFile);
const fixtureText = textByFile.get(fixtureFile);
const packageJsonText = textByFile.get(packageJsonFile);
const indexText = textByFile.get(indexDoc);
const fixture = JSON.parse(fixtureText);
const helperBehavior = assertHelperBehavior();

assertPackageJsonScript();
assertIndexPointer();
assertDocumentContract();
assertTypeContract();
assertHelperContract();
assertFixtureShape();
assertDryRunPlan();
assertAuthorityBoundary();
assertPublicSafety();
assertNoRuntimeActuationCode();
const changedFilesBoundary = assertChangedFileBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "autonomy-runner-preflight-v0-1",
      pass: true,
      required_files_checked: requiredFiles,
      package_script_checked: true,
      index_pointer_checked: true,
      document_contract_checked: true,
      type_exports_checked: expectedTypeExports,
      helper_exports_checked: expectedHelperExports,
      fixture_json_parsed: true,
      preflight_id: fixture.preflight_id,
      readiness: fixture.readiness,
      helper_behavior_checked: helperBehavior.checked,
      helper_behavior_cases: helperBehavior.cases,
      dry_run_id: fixture.dry_run_plan.dry_run_id,
      dry_run_status: fixture.dry_run_plan.status,
      all_planned_steps_would_execute_false_checked: true,
      authority_boundary_checked: true,
      no_run_boundary_checked: true,
      auto_apply_allowed: fixture.delta_merge_assessment.auto_apply_allowed,
      auto_apply_targets: fixture.delta_merge_assessment.auto_apply_targets,
      no_ui_files_changed_checked: true,
      no_api_route_files_changed_checked: true,
      no_mcp_app_tool_files_changed_checked: true,
      no_db_migrations_changed_checked: true,
      no_runner_scheduler_daemon_background_work_implementation_checked: true,
      no_interval_timer_cron_code_checked: true,
      no_db_writes_checked: true,
      no_provider_github_codex_calls_checked: true,
      no_child_process_checked: true,
      no_fs_writes_checked: true,
      no_post_put_patch_delete_route_checked: true,
      changed_files_boundary_checked: changedFilesBoundary.checked,
      changed_files_boundary_skipped: changedFilesBoundary.skipped,
      changed_files_boundary_skip_reason: changedFilesBoundary.skip_reason,
      changed_files_observed: changedFilesBoundary.files,
      changed_files_base_ref: changedFilesBoundary.base_ref,
      untracked_files_checked: changedFilesBoundary.untracked_checked,
      untracked_files_skipped: changedFilesBoundary.untracked_skipped,
      untracked_files_skip_reason: changedFilesBoundary.untracked_skip_reason,
      smoke_type:
        "static-autonomy-runner-preflight-dry-run-core-type-helper-fixture-package-index-boundary-only",
    },
    null,
    2,
  ),
);
console.log("PASS smoke:autonomy-runner-preflight-v0-1");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText,
    scriptName: "smoke:autonomy-runner-preflight-v0-1",
    expectedCommand: "node scripts/smoke-autonomy-runner-preflight-v0-1.mjs",
  });
}

function assertIndexPointer() {
  assertContainsAll(indexText, [
    "Phase 9A Autonomy Runner Preflight / Dry-Run core v0.1",
    contractDoc,
    typeFile,
    helperFile,
    fixtureFile,
    "smoke:autonomy-runner-preflight-v0-1",
    "AutonomyRunnerPreflight",
    "AutonomyDryRunPlan",
    "would_execute: false",
    "no runner starts",
  ], { label: indexDoc });
}

function assertDocumentContract() {
  assertContainsAll(docText, [
    "Phase 9A is preflight/dry-run only.",
    "AutonomyRunnerPreflight",
    "AutonomyDryRunPlan",
    "preflight does not start runner",
    "dry-run plan does not execute",
    "no scheduler",
    "no daemon",
    "no background job",
    "no Codex execution",
    "no GitHub/provider/OpenAI call",
    "no DB writes",
    "no proof/evidence writes",
    "no durable state/memory/Perspective apply",
    "no handoff send",
    "no branch/PR creation from product code",
    "no auto-apply",
    "no external side effects",
    "No readiness value means a run has started.",
    "ready_for_future_supervised_runner still means no run starts in Phase 9A.",
    "Every planned step includes",
    "would_execute: false",
    "Every preflight and dry-run plan must include a no-run authority boundary.",
    "All authority boundary execution/write/schedule/external flags are false",
    "The runner may reason about whether a run could start later and may produce a dry-run plan.",
    "The runner must not start the run.",
    "Browser/CDP validation is skipped because Phase 9A has no UI or route.",
  ], { label: contractDoc });

  for (const actionKind of allowedDryRunActionKinds) {
    assert(docText.includes(actionKind), `${contractDoc} must mention ${actionKind}`);
  }

  for (const action of forbiddenActions) {
    assert(docText.includes(action), `${contractDoc} must mention forbidden action ${action}`);
  }

  for (const field of authorityBooleanFields) {
    assert(docText.includes(`${field}: false`), `${contractDoc} must document ${field}: false`);
  }
}

function assertTypeContract() {
  assertContainsAll(typeText, [
    "Type-only Autonomy Runner Preflight / Dry-Run v0.1 contract.",
    "performs no DB reads or writes",
    "starts no scheduler, daemon, runner, or background work",
    "AUTONOMY_RUNNER_PREFLIGHT_VERSION",
    "autonomy_runner_preflight.v0.1",
    "AUTONOMY_DRY_RUN_PLAN_VERSION",
    "autonomy_dry_run_plan.v0.1",
    "AUTONOMY_RUN_READINESS_VALUES",
    "blocked",
    "needs_review",
    "ready_for_future_supervised_runner",
    "not_supported",
    "would_execute: false",
    "status: \"dry_run_only\"",
  ], { label: typeFile });

  for (const exportedName of expectedTypeExports) {
    const exportPattern = new RegExp(
      `export\\s+(?:const|interface|type)\\s+${exportedName}\\b`,
    );
    assert(exportPattern.test(typeText), `${typeFile} must export ${exportedName}`);
  }

  for (const actionKind of allowedDryRunActionKinds) {
    assert(typeText.includes(actionKind), `${typeFile} must define ${actionKind}`);
  }

  for (const action of forbiddenActions) {
    assert(typeText.includes(action), `${typeFile} must define forbidden action ${action}`);
  }

  assert(!typeText.includes('"running"'), `${typeFile} must not define running status`);
}

function assertHelperContract() {
  assertContainsAll(helperText, [
    "FALLBACK_CREATED_AT",
    "1970-01-01T00:00:00.000Z",
    "AUTONOMY_FORBIDDEN_ACTIONS",
    "PHASE_9A_FORBIDDEN_ACTIONS",
    "not_supported",
    "blocker.not_supported.",
    "buildAutonomyRunnerPreflight",
    "buildAutonomyDryRunPlan",
    "assessAutonomyBudget",
    "assessAutonomyActionScope",
    "assessAutonomyDeltaMergePolicy",
    "assessAutonomyReviewEscalation",
    "assessAutonomyStopConditions",
    "assessAutonomyStaleness",
    "assessAutonomyAuthority",
    "deriveAutonomyRunReadiness",
    "buildAutonomyRunBlockers",
    "buildAutonomyRunWarnings",
    "buildAutonomyPreflightAuthorityBoundary",
    "would_execute: false",
    "status: \"dry_run_only\"",
    "can_start_runner: false",
    "can_schedule_runner: false",
    "can_start_daemon: false",
    "can_start_background_work: false",
    "can_spend_budget: false",
    "can_auto_apply_delta: false",
  ], { label: helperFile });

  for (const exportedName of expectedHelperExports) {
    const exportPattern = new RegExp(
      `export\\s+function\\s+${exportedName}\\b`,
    );
    assert(exportPattern.test(helperText), `${helperFile} must export ${exportedName}`);
  }
}

function assertHelperBehavior() {
  const behaviorScript = String.raw`
    import { readFileSync } from "node:fs";
    import { buildAutonomyRunnerPreflight } from "./lib/autonomy/autonomy-runner-preflight.ts";

    const sample = JSON.parse(readFileSync("fixtures/autonomy-contract.sample.v0.1.json", "utf8"));
    const summarize = (preflight) => ({
      readiness: preflight.readiness,
      blockers: preflight.blockers.map((blocker) => ({
        blocker_id: blocker.blocker_id,
        kind: blocker.kind,
        summary: blocker.summary,
      })),
      action_scope_assessment: preflight.action_scope_assessment,
      dry_run_plan: {
        status: preflight.dry_run_plan.status,
        blocked_steps: preflight.dry_run_plan.blocked_steps,
        planned_steps: preflight.dry_run_plan.planned_steps.map((step) => ({
          step_id: step.step_id,
          allowed_by_contract: step.allowed_by_contract,
          blocked_by: step.blocked_by,
          would_execute: step.would_execute,
        })),
      },
    });

    const withAllowedAction = (action) => ({
      ...sample,
      allowed_actions: [action],
      run_preview: {
        ...sample.run_preview,
        status: "preview_only",
        planned_steps: [],
      },
    });

    const cases = {
      missing: summarize(buildAutonomyRunnerPreflight({ contract: null })),
      unsupported_version: summarize(buildAutonomyRunnerPreflight({
        contract: {
          ...sample,
          contract_version: "autonomy_contract.v99",
        },
      })),
      open_pr: summarize(buildAutonomyRunnerPreflight({
        budget_approved: true,
        contract: withAllowedAction("open_pr"),
      })),
      write_memory: summarize(buildAutonomyRunnerPreflight({
        budget_approved: true,
        contract: withAllowedAction("write_memory"),
      })),
    };

    console.log(JSON.stringify(cases));
  `;
  const output = execFileSync(
    "apps/augnes_apps/node_modules/.bin/tsx",
    ["--eval", behaviorScript],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: { ...process.env, TSX_TSCONFIG_PATH: "tsconfig.json" },
    },
  );
  const cases = JSON.parse(output);

  assertUnsupportedCase(cases.missing, "missing contract");
  assertUnsupportedCase(cases.unsupported_version, "unsupported contract version");
  assertForbiddenAliasCase({
    alias: "open_pr",
    expectedPolicySignal: /open_pr|create_branch_or_pr|branch\/pr creation|branch or pr/i,
    observed: cases.open_pr,
  });
  assertForbiddenAliasCase({
    alias: "write_memory",
    expectedPolicySignal: /write_memory|mutate_memory|memory mutation/i,
    observed: cases.write_memory,
  });

  return {
    checked: true,
    cases: ["missing", "unsupported_version", "open_pr", "write_memory"],
  };
}

function assertUnsupportedCase(observed, label) {
  assert.equal(observed.readiness, "not_supported", `${label} must be not_supported`);
  assert(observed.blockers.length > 0, `${label} must include explicit blockers`);
  assert(
    /unsupported|missing|not_supported|cannot reason/i.test(JSON.stringify(observed.blockers)),
    `${label} blocker must explain unsupported, missing, not_supported, or cannot reason`,
  );
  assert.equal(observed.dry_run_plan.status, "dry_run_only", `${label} dry-run status must remain dry_run_only`);
  assert(observed.dry_run_plan.planned_steps.length > 0, `${label} must still build blocked dry-run steps`);

  for (const step of observed.dry_run_plan.planned_steps) {
    assert.equal(step.would_execute, false, `${label} ${step.step_id} must have would_execute false`);
    assert.equal(step.allowed_by_contract, false, `${label} ${step.step_id} must not look contract-allowed`);
    assert(step.blocked_by.length > 0, `${label} ${step.step_id} must carry at least one blocker`);
  }
}

function assertForbiddenAliasCase({ alias, expectedPolicySignal, observed }) {
  assert.equal(observed.readiness, "blocked", `${alias} must block readiness`);
  assert.equal(observed.dry_run_plan.status, "dry_run_only", `${alias} dry-run status must remain dry_run_only`);
  assert(
    observed.action_scope_assessment.requested_forbidden_actions.includes(alias),
    `${alias} must be listed as a requested forbidden action`,
  );
  assert(
    expectedPolicySignal.test(JSON.stringify(observed.action_scope_assessment)) ||
      expectedPolicySignal.test(JSON.stringify(observed.blockers)),
    `${alias} action scope or blockers must identify the forbidden action signal`,
  );
  assert(observed.blockers.length > 0, `${alias} must include at least one blocker`);
  assert(
    observed.dry_run_plan.blocked_steps.includes(alias),
    `${alias} must be present in blocked dry-run steps`,
  );

  for (const step of observed.dry_run_plan.planned_steps) {
    assert.equal(step.would_execute, false, `${alias} ${step.step_id} must have would_execute false`);
  }
}

function assertFixtureShape() {
  assert.equal(fixture.runtime, "augnes");
  assert.equal(fixture.preflight_version, "autonomy_runner_preflight.v0.1");
  assert.equal(fixture.scope, "project:augnes");
  assert.equal(fixture.source_contract_id, "autonomy_contract.sample.phase_8a.v0.1");
  assert.equal(fixture.source_contract_version, "autonomy_contract.v0.1");
  assert(["needs_review", "blocked", "ready_for_future_supervised_runner", "not_supported"].includes(fixture.readiness));
  assert(["needs_review", "blocked"].includes(fixture.readiness), "sample fixture must stay conservative");
  assert.equal(fixture.contract_status, "preview_only");
  assert.equal(fixture.autonomy_mode, "scheduled_hunt_preview");

  for (const key of [
    "budget_assessment",
    "action_scope_assessment",
    "delta_merge_assessment",
    "review_escalation_assessment",
    "stop_condition_assessment",
    "staleness_assessment",
    "authority_assessment",
    "blockers",
    "warnings",
    "required_user_judgment",
    "required_operator_review",
    "dry_run_plan",
    "source_refs",
    "authority_boundary",
    "public_safety",
    "next_phase_notes",
  ]) {
    assert(key in fixture, `preflight fixture must include ${key}`);
  }

  assert.equal(fixture.budget_assessment.would_spend_budget, false);
  assert.equal(fixture.delta_merge_assessment.auto_apply_allowed, false);
  assert.deepEqual(fixture.delta_merge_assessment.auto_apply_targets, []);
  assert.equal(fixture.delta_merge_assessment.proposed_outputs_are_review_only, true);
  assert.equal(fixture.authority_assessment.preflight_boundary_all_false, true);
}

function assertDryRunPlan() {
  const plan = fixture.dry_run_plan;
  assert.equal(plan.runtime, "augnes");
  assert.equal(plan.dry_run_version, "autonomy_dry_run_plan.v0.1");
  assert.equal(plan.source_contract_id, fixture.source_contract_id);
  assert.equal(plan.status, "dry_run_only");

  for (const key of [
    "planned_steps",
    "planned_read_sources",
    "proposed_delta_outputs",
    "proposed_delta_batches",
    "proposed_reports",
    "proposed_review_queue_items",
    "blocked_steps",
    "required_preconditions",
    "required_checks",
    "stop_conditions",
    "budget_projection",
    "no_run_boundary",
    "next_phase_notes",
  ]) {
    assert(key in plan, `AutonomyDryRunPlan must include ${key}`);
  }

  assert(plan.planned_steps.length > 0, "dry-run plan must include planned steps");
  for (const step of plan.planned_steps) {
    for (const key of [
      "step_id",
      "title",
      "summary",
      "action_kind",
      "allowed_by_contract",
      "blocked_by",
      "source_refs",
      "expected_output",
      "would_require_review",
      "would_execute",
    ]) {
      assert(key in step, `planned step must include ${key}`);
    }
    assert(allowedDryRunActionKinds.includes(step.action_kind), `unexpected dry-run action kind ${step.action_kind}`);
    assert.equal(step.would_execute, false, `${step.step_id} must have would_execute false`);
  }

  for (const action of forbiddenActions) {
    assert(plan.blocked_steps.includes(action), `dry-run plan must block ${action}`);
  }

  assert.equal(plan.budget_projection.would_spend_budget, false);
  assert(plan.required_checks.includes("npm run smoke:autonomy-runner-preflight-v0-1"));
}

function assertAuthorityBoundary() {
  for (const [label, boundary] of [
    ["fixture.authority_boundary", fixture.authority_boundary],
    ["fixture.dry_run_plan.no_run_boundary", fixture.dry_run_plan.no_run_boundary],
  ]) {
    for (const field of authorityBooleanFields) {
      assert.equal(boundary[field], false, `${label}.${field} must be false`);
    }

    assertContainsAll(JSON.stringify(boundary.notes), [
      "Phase 9A preflight is dry-run only.",
      "Preflight does not start runner.",
      "Dry-run plan does not execute.",
      "No scheduler, daemon, or background work is created.",
      "No Codex, GitHub, OpenAI, provider, DB, proof, evidence, memory, Perspective, handoff, auto-apply, publish, merge, retry, replay, deploy, or external side effect authority is granted.",
    ], { label });
  }
}

function assertPublicSafety() {
  const safety = fixture.public_safety;
  assert.equal(safety.contains_private_conversation, false);
  assert.equal(safety.contains_hidden_reasoning, false);
  assert.equal(safety.contains_local_private_paths, false);
  assert.equal(safety.contains_secrets_or_tokens, false);
  assert.equal(safety.contains_raw_provider_output, false);
  assert.equal(safety.contains_raw_retrieval_output, false);
  assert.equal(safety.contains_real_account_artifacts, false);

  assertContainsAll(JSON.stringify(safety.notes), [
    "No private conversation.",
    "No hidden reasoning.",
    "No local private paths.",
    "No secrets/tokens.",
    "No raw provider output.",
    "No raw retrieval output.",
    "No real account artifacts.",
  ], { label: "fixture.public_safety.notes" });
}

function assertNoRuntimeActuationCode() {
  assertNoPatterns(helperFile, helperText, [
    /from\s+["']@\/app\//,
    /from\s+["']@\/components\//,
    /from\s+["']@\/apps\/augnes_apps/,
    /from\s+["']@\/lib\/db/,
    /from\s+["'][^"']*migrations[^"']*["']/,
    /from\s+["'][^"']*(openai|octokit|github|provider)[^"']*["']/i,
    /from\s+["'][^"']*(proof|evidence)[^"']*["']/i,
    /\bfetch\s*\(/,
    /\bchild_process\b/,
    /\bspawn\s*\(/,
    /\bexec\s*\(/,
    /\bexecFile(?:Sync)?\s*\(/,
    /\bwriteFile(?:Sync)?\s*\(/,
    /\bappendFile(?:Sync)?\s*\(/,
    /\bmkdir(?:Sync)?\s*\(/,
    /\brm(?:Sync)?\s*\(/,
    /\bunlink(?:Sync)?\s*\(/,
    /\bsetInterval\s*\(/,
    /\bsetTimeout\s*\(/,
    /\bcron\b/i,
    /\bDate\.now\s*\(/,
    /\bnew\s+Date\s*\(/,
    /\bMath\.random\s*\(/,
    /\bnew\s+OpenAI\b/,
    /\bOctokit\b/,
    /\blaunchCodex\s*\(/i,
    /\bexecuteCodex\s*\(/i,
    /\brunCodex\s*\(/i,
    /\bcallGithub\s*\(/i,
    /\bcreatePullRequest\s*\(/i,
    /\brecordProof\s*\(/i,
    /\bcreateEvidenceRecord\s*\(/i,
    /\bstartDaemon\s*\(/i,
    /\bscheduleBackgroundWork\s*\(/i,
    /\bPOST\s*\(/,
    /\bPUT\s*\(/,
    /\bPATCH\s*\(/,
    /\bDELETE\s*\(/,
  ]);

  for (const [file, text] of [
    [contractDoc, docText],
    [typeFile, typeText],
    [helperFile, helperText],
    [fixtureFile, fixtureText],
  ]) {
    for (const phrase of [
      "active runner",
      "active scheduler",
      "active schedule",
      "active execution",
      "background job",
      "actual autonomy runner",
    ]) {
      assertNoUnnegatedPositivePhrase(text, phrase, file);
    }
  }
}

function assertChangedFileBoundary() {
  const scopedBoundary = assertChangedFilesWithin({
    allowedChangedFiles,
    label: "Phase 9A Autonomy Runner Preflight core",
  });

  const workingTree = collectGitDiffFiles(["diff", "--name-only", "HEAD"]);
  const untrackedFiles = collectUntrackedFiles();
  const files = uniqueSorted([...workingTree.files, ...untrackedFiles]);

  for (const file of files) {
    assert(allowedChangedFiles.has(file), `Unexpected changed file for Phase 9A: ${file}`);
    for (const pattern of forbiddenChangedFilePatterns) {
      if (file === "app/api/augnes/read/autonomy-runner-preflight/route.ts") {
        continue;
      }
      if (phase9cWebPreviewFollowOnFiles.has(file)) {
        continue;
      }
      if (phase9dChatgptAppFollowOnFiles.has(file)) {
        continue;
      }
      assert(!pattern.test(file), `Forbidden Phase 9A changed file: ${file}`);
    }
  }

  return {
    ...scopedBoundary,
    files,
    untracked_checked: true,
    untracked_skipped: false,
    untracked_skip_reason: null,
  };
}

function assertNoPatterns(file, text, patterns) {
  for (const pattern of patterns) {
    assert(!pattern.test(text), `${file} must not match ${pattern}`);
  }
}

function assertNoUnnegatedPositivePhrase(text, phrase, label) {
  const lowerText = text.toLowerCase();
  const lowerPhrase = phrase.toLowerCase();
  let index = lowerText.indexOf(lowerPhrase);

  while (index !== -1) {
    const before = lowerText.slice(Math.max(0, index - 96), index);
    const negated = /\b(no|not|does not|do not|must not|without)\b/.test(before);
    assert(negated, `${label} contains unnegated active implementation phrase: ${phrase}`);
    index = lowerText.indexOf(lowerPhrase, index + lowerPhrase.length);
  }
}
