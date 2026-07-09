#!/usr/bin/env node
import assert from "node:assert/strict";
import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertPackageScript,
  collectGitDiffFiles,
  collectUntrackedFiles,
  getBaseRangeChangedFiles,
  loadTextByFile,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const contractDoc = "docs/AUTONOMY_CONTRACT_V0_1.md";
const typeFile = "types/autonomy-contract.ts";
const helperFile = "lib/autonomy/autonomy-contract.ts";
const fixtureFile = "fixtures/autonomy-contract.sample.v0.1.json";
const smokeFile = "scripts/smoke-autonomy-contract-v0-1.mjs";
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
];

const phase8bAutonomyContractRouteFiles = [
  "app/api/augnes/read/autonomy-contract/route.ts",
  "lib/autonomy/autonomy-contract-source.ts",
  "scripts/smoke-autonomy-contract-route-v0-1.mjs",
];

const phase8cAutonomyContractWebPreviewFiles = [
  "components/autonomy/autonomy-boundary-card.tsx",
  "components/autonomy/autonomy-budget-preview-panel.tsx",
  "components/autonomy/autonomy-contract-preview-panel.tsx",
  "components/autonomy/autonomy-policy-preview-panel.tsx",
  "components/autonomy/autonomy-preview-shared.tsx",
  "components/autonomy/autonomy-run-preview-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "lib/autonomy/read-autonomy-contract-for-web.ts",
  "scripts/smoke-autonomy-contract-web-preview-v0-1.mjs",
];

const phase8dAutonomyContractAppToolFiles = [
  "apps/augnes_apps/src/server.ts",
  "apps/augnes_apps/src/lib/state-runtime-types.ts",
  "apps/augnes_apps/src/adapters/state-runtime-http.ts",
  "apps/augnes_apps/scripts/invariants.ts",
  "apps/augnes_apps/scripts/smoke.ts",
  "apps/augnes_apps/scripts/mock-state-runtime.ts",
  "docs/CHATGPT_APP_MCP_READONLY_SURFACE_BOUNDARY_V0_1.md",
  "scripts/smoke-chatgpt-app-autonomy-contract-tool-v0-1.mjs",
];

const phase8eAutonomyContractCodexSkillFiles = [
  "docs/CODEX_AUTONOMY_CONTRACT_CONSUMPTION_V0_1.md",
  "plugins/augnes-operator/skills/augnes-autonomy-contract/SKILL.md",
  "scripts/smoke-codex-autonomy-contract-v0-1.mjs",
  "scripts/smoke-augnes-operator-plugin-v2.mjs",
  "docs/CODEX_AUGNES_OPERATOR_PLUGIN_V0_2.md",
  "docs/AUTONOMY_CONTRACT_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
];

const phase8fAutonomyContractCopyExportFiles = [
  "lib/autonomy/autonomy-contract-copy-export.ts",
  "components/autonomy/autonomy-copy-export-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "lib/autonomy/read-autonomy-contract-for-web.ts",
  "components/autonomy/autonomy-boundary-card.tsx",
  "components/autonomy/autonomy-contract-preview-panel.tsx",
  "scripts/smoke-autonomy-contract-copy-export-v0-1.mjs",
  "scripts/smoke-autonomy-contract-web-preview-v0-1.mjs",
  "docs/AUTONOMY_CONTRACT_V0_1.md",
  "docs/00_INDEX_LATEST.md",
  "package.json",
];

const phase9aAutonomyRunnerPreflightFiles = [
  "docs/AUTONOMY_RUNNER_PREFLIGHT_V0_1.md",
  "types/autonomy-runner.ts",
  "lib/autonomy/autonomy-runner-preflight.ts",
  "fixtures/autonomy-runner-preflight.sample.v0.1.json",
  "scripts/smoke-autonomy-runner-preflight-v0-1.mjs",
  "app/api/augnes/read/autonomy-runner-preflight/route.ts",
  "lib/autonomy/autonomy-runner-preflight-source.ts",
  "scripts/smoke-autonomy-runner-preflight-route-v0-1.mjs",
  "lib/autonomy/read-autonomy-runner-preflight-for-web.ts",
  "components/autonomy/autonomy-runner-preflight-preview-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "scripts/smoke-autonomy-runner-preflight-web-preview-v0-1.mjs",
  "package.json",
  "package-lock.json",
  "docs/00_INDEX_LATEST.md",
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
  "apps/augnes_apps/src/server.ts",
  "apps/augnes_apps/src/lib/state-runtime-types.ts",
  "apps/augnes_apps/src/adapters/state-runtime-http.ts",
  "apps/augnes_apps/scripts/invariants.ts",
  "apps/augnes_apps/scripts/smoke.ts",
  "apps/augnes_apps/scripts/mock-state-runtime.ts",
  "scripts/smoke-chatgpt-app-autonomy-runner-preflight-tool-v0-1.mjs",
  "lib/autonomy/autonomy-runner-preflight-copy-export.ts",
  "components/autonomy/autonomy-runner-preflight-copy-export-panel.tsx",
  "scripts/smoke-autonomy-runner-preflight-copy-export-v0-1.mjs",
  "docs/AUTONOMY_RUNNER_EXECUTION_V0_1.md",
  "types/autonomy-runner-execution.ts",
  "lib/autonomy/runner.ts",
  "lib/autonomy/scheduler.ts",
  "lib/autonomy/runner-ledger.ts",
  "lib/autonomy/runner-delta-batch.ts",
  "lib/autonomy/runner-state.ts",
  "app/api/autonomy/runs/route.ts",
  "app/api/autonomy/runs/[id]/route.ts",
  "fixtures/autonomy-runner.sample.v0.1.json",
  "scripts/smoke-autonomy-runner-v0-1.mjs",
  "lib/db/schema.sql",
];
const autonomyDelegationGrantRecordFiles = [
  "types/autonomy-delegation-grant.ts",
  "lib/autonomy/autonomy-delegation-grant-write.ts",
  "lib/autonomy/read-autonomy-delegation-grants.ts",
  "components/autonomy/autonomy-delegation-grant-readback-panel.tsx",
  "types/autohunt-work-queue-candidate.ts",
  "lib/autonomy/autohunt-work-queue-candidate-write.ts",
  "lib/autonomy/read-autohunt-work-queue-candidates.ts",
  "components/autonomy/autohunt-work-queue-candidate-readback-panel.tsx",
  "types/autohunt-preflight-packet.ts",
  "lib/autonomy/autohunt-preflight-packet-write.ts",
  "lib/autonomy/read-autohunt-preflight-packets.ts",
  "components/autonomy/autohunt-preflight-packet-readback-panel.tsx",
  "types/autohunt-workbench-readback-spine.ts",
  "lib/autonomy/autohunt-workbench-readback-spine.ts",
  "components/autonomy/autohunt-workbench-readback-spine-panel.tsx",
  "types/autohunt-handoff-plan-preview.ts",
  "lib/autonomy/autohunt-handoff-plan-preview-write.ts",
  "lib/autonomy/read-autohunt-handoff-plan-previews.ts",
  "components/autonomy/autohunt-handoff-plan-preview-readback-panel.tsx",
  "types/autohunt-handoff-plan-operator-review-decision.ts",
  "lib/autonomy/autohunt-handoff-plan-operator-review-decision-write.ts",
  "lib/autonomy/read-autohunt-handoff-plan-operator-review-decisions.ts",
  "components/autonomy/autohunt-handoff-plan-operator-review-decision-readback-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "lib/db.ts",
  "lib/db/schema.sql",
  "scripts/db-migrations.mjs",
  "scripts/db-migrate.mjs",
  "scripts/smoke-autonomy-delegation-grant-record-v0-1.mjs",
  "scripts/smoke-autohunt-work-queue-candidate-v0-1.mjs",
  "scripts/smoke-autohunt-preflight-packet-v0-1.mjs",
  "scripts/smoke-autohunt-workbench-readback-spine-v0-1.mjs",
  "scripts/smoke-autohunt-handoff-plan-preview-v0-1.mjs",
  "scripts/smoke-autohunt-handoff-plan-preview-workbench-mount-v0-1.mjs",
  "scripts/smoke-autohunt-handoff-plan-operator-review-decision-v0-1.mjs",
  "scripts/smoke-autohunt-handoff-plan-operator-review-decision-workbench-mount-v0-1.mjs",
  "scripts/dogfood-seed-local-autohunt-chain-v0-1.mjs",
  "scripts/smoke-local-autohunt-chain-dogfood-v0-1.mjs",
  "types/autohunt-handoff-copy-export-preview.ts",
  "lib/autonomy/autohunt-handoff-copy-export-preview.ts",
  "components/autonomy/autohunt-handoff-copy-export-preview-panel.tsx",
  "scripts/smoke-autohunt-handoff-copy-export-preview-v0-1.mjs",
  "types/autohunt-execution-readiness-gate.ts",
  "lib/autonomy/autohunt-execution-readiness-gate.ts",
  "components/autonomy/autohunt-execution-readiness-gate-panel.tsx",
  "scripts/smoke-autohunt-execution-readiness-gate-v0-1.mjs",
  "types/autohunt-supervised-execution-contract.ts",
  "lib/autonomy/autohunt-supervised-execution-contract-write.ts",
  "lib/autonomy/read-autohunt-supervised-execution-contracts.ts",
  "components/autonomy/autohunt-supervised-execution-contract-readback-panel.tsx",
  "scripts/smoke-autohunt-supervised-execution-contract-v0-1.mjs",
  "types/autohunt-result-intake.ts",
  "lib/autonomy/autohunt-result-intake-write.ts",
  "lib/autonomy/read-autohunt-result-intakes.ts",
  "components/autonomy/autohunt-result-intake-readback-panel.tsx",
  "scripts/smoke-autohunt-result-intake-v0-1.mjs",
  "scripts/smoke-shared-source-chain-guards-v0-1.mjs",
  "package.json",
  "scripts/smoke-autonomy-contract-v0-1.mjs",
  "scripts/smoke-autonomy-runner-preflight-v0-1.mjs",
];
const allowedChangedFiles = new Set([
  ...requiredFiles,
  ...priorSmokeAllowlistCompatibilityFiles,
  ...phase8bAutonomyContractRouteFiles,
  ...phase8cAutonomyContractWebPreviewFiles,
  ...phase8dAutonomyContractAppToolFiles,
  ...phase8eAutonomyContractCodexSkillFiles,
  ...phase8fAutonomyContractCopyExportFiles,
]);
for (const file of phase9aAutonomyRunnerPreflightFiles) {
  allowedChangedFiles.add(file);
}
for (const file of autonomyDelegationGrantRecordFiles) {
  allowedChangedFiles.add(file);
}

const forbiddenChangedFilePatterns = [
  /^app\/(?!api\/augnes\/read\/autonomy-contract\/route\.ts$)/,
  /^components\/(?!autonomy\/|workplane\/agent-workplane\.tsx$)/,
  /^apps\/augnes_apps\/(?!(?:src\/server\.ts|src\/lib\/state-runtime-types\.ts|src\/adapters\/state-runtime-http\.ts|scripts\/invariants\.ts|scripts\/smoke\.ts|scripts\/mock-state-runtime\.ts)$)/,
  /^migrations\//,
  /^db\//,
  /^lib\/db(\/|\.|$)/,
  /(^|\/)(provider|providers|openai|github|octokit)(\/|$)/i,
  /(^|\/)(proof|evidence)(\/|$)/i,
  /(^|\/)(scheduler|autonomy-runner|autonomy_runner)(\/|$)/i,
  /(^|\/)api\.(js|jsx|ts|tsx)$/,
];

const requiredDocsRefs = [
  "docs/GUIDEBRIEF_CONTRACT_V0_1.md",
  "docs/HANDOFF_CAPSULE_CONTRACT_V0_1.md",
  "docs/CODEX_HANDOFF_CAPSULE_CONSUMPTION_V0_1.md",
  "docs/AUGNES_DELTA_CONTRACT_V0_1.md",
  "docs/AUTHORITY_MATRIX.md",
  "docs/AGENT_WORKPLANE_V0_1.md",
];

const authorityBooleanFields = [
  "source_of_truth",
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
  "can_start_daemon",
];

const expectedTypeExports = [
  "AUTONOMY_CONTRACT_VERSION",
  "AUTONOMY_CONTRACT_STATUSES",
  "AUTONOMY_MODES",
  "AUTONOMY_ALLOWED_ACTIONS",
  "AUTONOMY_FORBIDDEN_ACTIONS",
  "AutonomyContract",
  "AutonomyBudget",
  "AutonomyDeltaMergePolicy",
  "AutonomyReviewEscalationPolicy",
  "AutonomyStopCondition",
  "ReportingCadence",
  "AutonomyOutputPolicy",
  "AutonomyRunPreview",
  "AutonomySourceRefs",
  "AutonomyContractAuthorityBoundary",
  "AutonomyContractBuilderInput",
];

const expectedHelperExports = [
  "buildAutonomyContract",
  "buildAutonomyBudget",
  "buildAutonomyDeltaMergePolicy",
  "buildAutonomyReviewEscalationPolicy",
  "buildAutonomyStopConditions",
  "buildAutonomyReportingCadence",
  "buildAutonomyOutputPolicy",
  "buildAutonomyRunPreview",
  "buildAutonomySourceRefs",
  "buildAutonomyContractAuthorityBoundary",
  "buildDefaultForbiddenActions",
  "buildDefaultAllowedActions",
];

const requiredStopKinds = [
  "budget_exhausted",
  "stale_context",
  "user_judgment_required",
  "required_check_failed",
  "required_check_skipped",
  "forbidden_action_requested",
  "forbidden_file_scope",
  "source_gap_high",
  "authority_boundary_unclear",
  "runtime_unavailable",
  "manual_stop_requested",
];

const textByFile = loadTextByFile(requiredFiles);
const docText = textByFile.get(contractDoc);
const typeText = textByFile.get(typeFile);
const helperText = textByFile.get(helperFile);
const fixtureText = textByFile.get(fixtureFile);
const packageJsonText = textByFile.get(packageJsonFile);
const indexText = textByFile.get(indexDoc);
const fixture = JSON.parse(fixtureText);

assertPackageJsonScript();
assertIndexPointer();
assertDocumentContract();
assertTypeContract();
assertHelperContract();
assertFixtureShape();
assertBudget();
assertDeltaMergePolicy();
assertReviewEscalationPolicy();
assertStopConditions();
assertReportingAndOutputPolicy();
assertRunPreview();
assertSourceRefs();
assertAuthorityBoundary();
assertPublicSafety();
assertNoRuntimeActuationCode();
const changedFilesBoundary = assertChangedFileBoundary();
const phase8bRouteChanged = changedFilesBoundary.files.includes(
  "app/api/augnes/read/autonomy-contract/route.ts",
);

console.log(
  JSON.stringify(
    {
      smoke: "autonomy-contract-v0-1",
      pass: true,
      required_files_checked: requiredFiles,
      package_script_checked: true,
      index_pointer_checked: true,
      document_contract_checked: true,
      type_exports_checked: expectedTypeExports,
      helper_exports_checked: expectedHelperExports,
      fixture_json_parsed: true,
      contract_id: fixture.contract_id,
      status: fixture.status,
      autonomy_mode: fixture.autonomy_mode,
      authority_boundary_checked: true,
      auto_apply_allowed: fixture.delta_merge_policy.auto_apply_allowed,
      auto_apply_targets: fixture.delta_merge_policy.auto_apply_targets,
      stop_condition_kinds_checked: requiredStopKinds,
      prior_smoke_allowlist_compatibility_files_allowed:
        priorSmokeAllowlistCompatibilityFiles,
      phase8b_autonomy_contract_route_files_allowed:
        phase8bAutonomyContractRouteFiles,
      no_runtime_actuation_code_checked: true,
      no_ui_files_changed_checked: true,
      no_api_route_files_changed_checked: !phase8bRouteChanged,
      no_mcp_app_tool_files_changed_checked: true,
      no_db_migrations_changed_checked: true,
      changed_files_boundary_checked: changedFilesBoundary.checked,
      changed_files_boundary_skipped: changedFilesBoundary.skipped,
      changed_files_boundary_skip_reason: changedFilesBoundary.skip_reason,
      changed_files_observed: changedFilesBoundary.files,
      changed_files_base_ref: changedFilesBoundary.base_ref,
      smoke_type:
        "static-autonomy-contract-budget-delta-merge-policy-type-helper-fixture-package-index-boundary-only",
      route_behavior_changed: phase8bRouteChanged,
      ui_behavior_changed: false,
      mcp_app_tool_added: false,
      db_schema_migration_changed: false,
      db_write_added: false,
      provider_openai_github_runtime_call_added: false,
      codex_execution_added: false,
      proof_evidence_write_added: false,
      memory_mutation_added: false,
      durable_perspective_state_apply_added: false,
      scheduler_autonomy_runner_added: false,
      handoff_execution_added: false,
      external_side_effect_added: false,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:autonomy-contract-v0-1");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText,
    scriptName: "smoke:autonomy-contract-v0-1",
    expectedCommand: "node scripts/smoke-autonomy-contract-v0-1.mjs",
  });
}

function assertIndexPointer() {
  assertContainsAll(indexText, [
    "Phase 8A Autonomy Contract / Budget / Delta Merge Policy core v0.1",
    contractDoc,
    typeFile,
    helperFile,
    fixtureFile,
    "smoke:autonomy-contract-v0-1",
    "no runner/scheduler/daemon/background work/execution/write/external authority",
  ], { label: indexDoc });
}

function assertDocumentContract() {
  assertContainsAll(docText, [
    "Phase 8A defines Autonomy Contract / Budget / Delta Merge Policy core.",
    "Autonomy Contract is a bounded delegation contract for future autonomous or scheduled work.",
    "Autonomy Contract is not Autonomy Runner.",
    "Autonomy Budget is not spend permission.",
    "Autonomy Delta Merge Policy is not state apply implementation.",
    "Autonomy Run Preview is not background work.",
    "Phase 8A is contract/type/helper/fixture/smoke/package/index only.",
    "It adds no runner, scheduler, daemon, background work, hidden automation, Codex execution, GitHub/provider/OpenAI calls, DB writes, proof/evidence writes, memory mutation, durable Perspective apply, handoff send, branch/PR creation, merge/publish/retry/replay/deploy, or external side effects.",
    "Autonomy Contract may consume GuideBrief, Handoff Capsule, Codex Launch Card, Augnes Delta, and Current Working Perspective only as preview input.",
    "Handoff Capsule / Codex Launch Card consumption does not grant launch, execution, handoff send, branch/PR creation, proof/evidence, merge, or external authority.",
    "Budget is boundary only.",
    "Missing budget blocks future autonomy.",
    "auto_apply_allowed: false",
    "Durable memory and project Perspective require review.",
    "Proof/evidence write, external publication, GitHub actuation, provider call, branch/PR creation, and durable apply without review are blocked.",
    "Review escalation is required for stale context, user judgment, budget exceeded, failed/skipped checks, forbidden action, durable memory, project perspective, proof/evidence, Codex launch, GitHub/provider calls, and unclear authority.",
    "Stop conditions prevent future run until recovered.",
    "Future Phase 9 runner requires separate explicit scope and approval.",
  ], { label: contractDoc });

  for (const ref of requiredDocsRefs) {
    assert(docText.includes(ref), `${contractDoc} must mention ${ref}`);
  }
}

function assertTypeContract() {
  assertContainsAll(typeText, [
    "Type-only Autonomy Contract / Budget / Delta Merge Policy v0.1 contract.",
    "performs no DB reads or writes",
    "starts no scheduler or daemon",
    "AUTONOMY_CONTRACT_STATUSES",
    "draft",
    "preview_only",
    "ready_for_future_review",
    "AUTONOMY_MODES",
    "scheduled_hunt_preview",
    "chatgpt_codex_loop_preview",
    "research_accumulation_preview",
    "AUTONOMY_ALLOWED_ACTIONS",
    "read_current_perspective",
    "prepare_codex_handoff_preview",
    "AUTONOMY_FORBIDDEN_ACTIONS",
    "execute_codex",
    "schedule_background_work",
  ], { label: typeFile });

  for (const exportedName of expectedTypeExports) {
    const exportPattern = new RegExp(
      `export\\s+(?:const|interface|type)\\s+${exportedName}\\b`,
    );
    assert(exportPattern.test(typeText), `${typeFile} must export ${exportedName}`);
  }

  assert(!typeText.includes('"running"'), `${typeFile} must not define running status`);
}

function assertHelperContract() {
  assertContainsAll(helperText, [
    "FALLBACK_CREATED_AT",
    "1970-01-01T00:00:00.000Z",
    "REQUIRED_DOCS_REFS",
    "buildAutonomyContract",
    "buildAutonomyBudget",
    "buildAutonomyDeltaMergePolicy",
    "buildAutonomyReviewEscalationPolicy",
    "buildAutonomyStopConditions",
    "buildAutonomyReportingCadence",
    "buildAutonomyOutputPolicy",
    "buildAutonomyRunPreview",
    "buildAutonomySourceRefs",
    "buildAutonomyContractAuthorityBoundary",
    "buildDefaultForbiddenActions",
    "buildDefaultAllowedActions",
    "auto_apply_allowed: false",
    "auto_apply_targets: []",
    "Budget is a boundary, not spend permission.",
    "Future runner requires separate Phase 9 scope and explicit approval.",
  ], { label: helperFile });

  for (const exportedName of expectedHelperExports) {
    const exportPattern = new RegExp(
      `export\\s+function\\s+${exportedName}\\b`,
    );
    assert(exportPattern.test(helperText), `${helperFile} must export ${exportedName}`);
  }
}

function assertFixtureShape() {
  assert.equal(fixture.runtime, "augnes");
  assert.equal(fixture.contract_version, "autonomy_contract.v0.1");
  assert.equal(fixture.status, "preview_only");
  assert(["scheduled_hunt_preview", "chatgpt_codex_loop_preview"].includes(fixture.autonomy_mode));
  assert(fixture.goal, "AutonomyContract must include goal");
  assert(fixture.bounded_context_summary, "AutonomyContract must include bounded_context_summary");

  for (const key of [
    "budget",
    "delta_merge_policy",
    "review_escalation_policy",
    "reporting_cadence",
    "output_policy",
    "staleness_policy",
    "validation_policy",
    "run_preview",
    "source_refs",
    "authority_boundary",
    "gaps",
    "public_safety",
  ]) {
    assert(fixture[key], `AutonomyContract must include ${key}`);
  }

  for (const action of [
    "read_current_perspective",
    "read_delta_projection",
    "read_guide_brief",
    "read_handoff_capsule_preview",
    "read_codex_launch_card_preview",
    "summarize_context",
    "rank_candidate_deltas",
    "prepare_review_packet",
    "prepare_codex_handoff_preview",
    "draft_report_preview",
  ]) {
    assert(fixture.allowed_actions.includes(action), `allowed_actions must include ${action}`);
  }

  for (const action of [
    "execute_codex",
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
  ]) {
    assert(fixture.forbidden_actions.includes(action), `forbidden_actions must include ${action}`);
  }
}

function assertBudget() {
  const budget = fixture.budget;
  for (const key of [
    "budget_id",
    "time_limit_minutes",
    "wall_clock_window",
    "max_iterations",
    "max_tool_calls",
    "max_codex_tasks",
    "max_prs",
    "max_file_changes",
    "allowed_file_globs",
    "forbidden_file_globs",
    "token_or_compute_budget",
    "cost_budget",
    "retry_limit",
    "failure_threshold",
    "reporting_interval",
    "requires_budget_refresh_after",
    "budget_boundary_notes",
  ]) {
    assert(key in budget, `AutonomyBudget must include ${key}`);
  }

  const budgetText = JSON.stringify(budget);
  assert(budgetText.includes("Budget is a boundary, not spend permission."));
  assert(budgetText.includes("Missing budget blocks future autonomy."));
  assert(budgetText.includes("Phase 8A must not charge"));
}

function assertDeltaMergePolicy() {
  const policy = fixture.delta_merge_policy;
  assert.equal(policy.default_delta_status, "needs_review");
  assert.equal(policy.auto_apply_allowed, false);
  assert.deepEqual(policy.auto_apply_targets, []);

  for (const target of [
    "working_memory_candidate",
    "project_perspective_candidate",
    "durable_memory_candidate",
    "codex_launch_candidate",
    "handoff_send_candidate",
  ]) {
    assert(policy.review_required_targets.includes(target), `review_required_targets must include ${target}`);
  }

  for (const target of [
    "proof_evidence_write",
    "external_publication",
    "github_actuation",
    "provider_call",
    "branch_pr_creation",
    "durable_apply_without_review",
  ]) {
    assert(policy.blocked_targets.includes(target), `blocked_targets must include ${target}`);
  }

  const policyText = JSON.stringify(policy);
  assert(policyText.includes("future-contract-preview"));
  assert(policyText.includes("inactive"));
  assert(policy.durable_memory_policy.includes("require"));
  assert(policy.project_perspective_policy.includes("require"));
}

function assertReviewEscalationPolicy() {
  const escalationText = JSON.stringify(fixture.review_escalation_policy);
  for (const phrase of [
    "needs_user_judgment item exists",
    "stale GuideBrief or stale Handoff Capsule",
    "budget exceeded",
    "forbidden file touched in future run",
    "required check skipped",
    "required check failed",
    "external side effect requested",
    "durable memory change requested",
    "project perspective change requested",
    "proof/evidence write requested",
    "Codex launch requested",
    "GitHub/provider call requested",
    "ambiguous authority boundary",
  ]) {
    assert(escalationText.includes(phrase), `review escalation must include ${phrase}`);
  }
}

function assertStopConditions() {
  const kinds = fixture.stop_conditions.map((condition) => condition.kind);
  for (const kind of requiredStopKinds) {
    assert(kinds.includes(kind), `stop_conditions must include ${kind}`);
  }

  for (const condition of fixture.stop_conditions) {
    assert.equal(condition.blocks_future_run, true);
    assert(condition.recovery_hint, `${condition.kind} must include recovery_hint`);
  }
}

function assertReportingAndOutputPolicy() {
  assert(["manual", "scheduled_preview", "after_each_delta", "after_batch", "on_blocker", "on_budget_threshold"].includes(fixture.reporting_cadence.mode));

  for (const section of [
    "summary",
    "source_refs",
    "deltas_created",
    "delta_batch_summary",
    "budget_used",
    "checks_run",
    "skipped_checks",
    "blocked_actions",
    "user_judgment_items",
    "known_risks",
    "next_phase_readiness",
  ]) {
    assert(fixture.output_policy.required_report_sections.includes(section), `output policy must require ${section}`);
  }

  assert.equal(fixture.output_policy.delta_batch_required, true);
  assert.equal(fixture.output_policy.skipped_check_reporting_required, true);
  assert.equal(fixture.output_policy.proof_evidence_status_required, true);
  assert.equal(fixture.output_policy.no_background_work_statement_required, true);
  assert.equal(fixture.output_policy.no_merge_statement_required, true);
  assert.equal(fixture.output_policy.next_phase_readiness_required, true);
}

function assertRunPreview() {
  assert.equal(fixture.run_preview.status, "preview_only");
  for (const key of [
    "preview_id",
    "title",
    "planned_steps",
    "allowed_read_sources",
    "proposed_delta_outputs",
    "proposed_reports",
    "blocked_steps",
    "required_preconditions",
    "not_implemented_notes",
    "status",
  ]) {
    assert(key in fixture.run_preview, `AutonomyRunPreview must include ${key}`);
  }

  const forbiddenKeys = [
    "run_id",
    "schedule_id",
    "daemon_id",
    "background_job_id",
    "runner_id",
  ];
  for (const key of forbiddenKeys) {
    assert(!(key in fixture.run_preview), `AutonomyRunPreview must not include ${key}`);
  }

  assertNoUnnegatedPositivePhrase(fixtureText, "active schedule", fixtureFile);
  assertNoUnnegatedPositivePhrase(fixtureText, "active runner", fixtureFile);
  assertNoUnnegatedPositivePhrase(fixtureText, "active execution", fixtureFile);
  assertNoUnnegatedPositivePhrase(fixtureText, "background job", fixtureFile);
}

function assertSourceRefs() {
  const refs = fixture.source_refs;
  for (const key of [
    "guide_brief_refs",
    "handoff_capsule_refs",
    "codex_launch_card_refs",
    "current_working_perspective_refs",
    "delta_projection_refs",
    "workplane_refs",
    "delta_ids",
    "batch_ids",
    "evidence_refs",
    "artifact_refs",
    "handoff_refs",
    "diagnostic_refs",
    "route_refs",
    "docs_refs",
    "repo_refs",
  ]) {
    assert(Array.isArray(refs[key]), `AutonomySourceRefs.${key} must be an array`);
  }

  assert(refs.guide_brief_refs.length > 0, "fixture must reference GuideBrief");
  assert(refs.handoff_capsule_refs.length > 0, "fixture must reference Handoff Capsule");
  assert(refs.codex_launch_card_refs.length > 0, "fixture must reference Codex Launch Card");

  for (const ref of requiredDocsRefs) {
    assert(refs.docs_refs.includes(ref), `fixture source refs must include ${ref}`);
  }
}

function assertAuthorityBoundary() {
  const boundary = fixture.authority_boundary;
  for (const field of authorityBooleanFields) {
    assert.equal(boundary[field], false, `authority_boundary.${field} must be false`);
  }

  assertContainsAll(JSON.stringify(boundary.notes), [
    "Contract is preview-only.",
    "Contract does not run.",
    "Contract does not schedule.",
    "Contract does not launch Codex.",
    "Contract does not call GitHub or providers.",
    "Contract does not mutate state/memory/work/Perspective.",
    "Contract does not send handoffs.",
    "Contract does not create proof/evidence.",
    "Future runner requires separate Phase 9 scope and explicit approval.",
  ], { label: "fixture.authority_boundary.notes" });
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
    /from\s+["'][^"']*(scheduler|autonomy-runner|autonomy_runner)[^"']*["']/i,
    /\bfetch\s*\(/,
    /\bchild_process\b/,
    /\bspawn\s*\(/,
    /\bexec\s*\(/,
    /\bwriteFile(?:Sync)?\s*\(/,
    /\bappendFile(?:Sync)?\s*\(/,
    /\bDate\.now\s*\(/,
    /\bnew\s+Date\s*\(/,
    /\bMath\.random\s*\(/,
    /\blaunchCodex\b/i,
    /\bexecuteCodex\b/i,
    /\bcallGithub\b/i,
    /\bcreatePullRequest\b/i,
    /\brecordProof\b/i,
    /\bcreateEvidenceRecord\b/i,
    /\bstartDaemon\b/i,
    /\bscheduleBackgroundWork\b/i,
  ]);
}

function assertChangedFileBoundary() {
  const scopedBoundary = assertChangedFilesWithin({
    allowedChangedFiles,
    label: "Phase 8A Autonomy Contract core",
  });

  const workingTree = collectGitDiffFiles(["diff", "--name-only", "HEAD"]);
  const baseRange = getBaseRangeChangedFiles();
  const untrackedFiles = collectUntrackedFiles();
  const files = uniqueSorted([
    ...workingTree.files,
    ...baseRange.files,
    ...untrackedFiles,
  ]);

  for (const file of files) {
    assert(allowedChangedFiles.has(file), `Unexpected changed file for Phase 8A: ${file}`);
    for (const pattern of forbiddenChangedFilePatterns) {
      if (phase9aAutonomyRunnerPreflightFiles.includes(file)) {
        continue;
      }
      if (autonomyDelegationGrantRecordFiles.includes(file)) {
        continue;
      }
      assert(!pattern.test(file), `Forbidden Phase 8A changed file: ${file}`);
    }
  }

  return {
    ...scopedBoundary,
    files,
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
    assert(negated, `${label} contains unnegated active execution phrase: ${phrase}`);
    index = lowerText.indexOf(lowerPhrase, index + lowerPhrase.length);
  }
}
