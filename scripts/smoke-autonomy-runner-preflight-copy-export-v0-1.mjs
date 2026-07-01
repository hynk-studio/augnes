#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertPackageScript,
  collectUntrackedFiles,
  loadTextByFile,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const helperFile =
  "lib/autonomy/autonomy-runner-preflight-copy-export.ts";
const componentFile =
  "components/autonomy/autonomy-runner-preflight-copy-export-panel.tsx";
const previewPanelFile =
  "components/autonomy/autonomy-runner-preflight-preview-panel.tsx";
const webReadHelperFile =
  "lib/autonomy/read-autonomy-runner-preflight-for-web.ts";
const contractDoc = "docs/AUTONOMY_RUNNER_PREFLIGHT_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const smokeFile =
  "scripts/smoke-autonomy-runner-preflight-copy-export-v0-1.mjs";

const phase9aSmokeFile = "scripts/smoke-autonomy-runner-preflight-v0-1.mjs";
const phase9bSmokeFile =
  "scripts/smoke-autonomy-runner-preflight-route-v0-1.mjs";
const phase9cSmokeFile =
  "scripts/smoke-autonomy-runner-preflight-web-preview-v0-1.mjs";
const phase9dSmokeFile =
  "scripts/smoke-chatgpt-app-autonomy-runner-preflight-tool-v0-1.mjs";
const phase9eSmokeFile =
  "scripts/smoke-codex-autonomy-runner-preflight-v0-1.mjs";

const requiredFiles = [
  helperFile,
  componentFile,
  previewPanelFile,
  webReadHelperFile,
  contractDoc,
  indexDoc,
  packageJsonFile,
  smokeFile,
  phase9aSmokeFile,
  phase9bSmokeFile,
  phase9cSmokeFile,
  phase9dSmokeFile,
  phase9eSmokeFile,
];

const priorSmokeAllowlistCompatibilityFiles = [
  phase9aSmokeFile,
  phase9bSmokeFile,
  phase9cSmokeFile,
  phase9dSmokeFile,
  phase9eSmokeFile,
  "scripts/smoke-augnes-delta-contract-v0-1.mjs",
  "scripts/smoke-augnes-delta-projection-v0-1.mjs",
  "scripts/smoke-augnes-delta-projection-route-v0-1.mjs",
  "scripts/smoke-current-working-perspective-v0-1.mjs",
  "scripts/smoke-current-working-perspective-route-v0-1.mjs",
  "scripts/smoke-human-surface-home-v0-1.mjs",
  "scripts/smoke-perspective-human-timeline-v0-1.mjs",
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
  "scripts/smoke-autonomy-contract-v0-1.mjs",
  "scripts/smoke-autonomy-contract-route-v0-1.mjs",
  "scripts/smoke-autonomy-contract-web-preview-v0-1.mjs",
  "scripts/smoke-chatgpt-app-autonomy-contract-tool-v0-1.mjs",
  "scripts/smoke-codex-autonomy-contract-v0-1.mjs",
  "scripts/smoke-autonomy-contract-copy-export-v0-1.mjs",
  "scripts/smoke-handoff-capsule-copy-export-v0-1.mjs",
  "scripts/smoke-agent-workplane-shell-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
];

const allowedChangedFiles = new Set([
  helperFile,
  componentFile,
  previewPanelFile,
  smokeFile,
  contractDoc,
  indexDoc,
  packageJsonFile,
  ...priorSmokeAllowlistCompatibilityFiles,
]);

const forbiddenChangedFilePatterns = [
  /^app\/api\//,
  /^apps\/augnes_apps\//,
  /^migrations\//,
  /^db\//,
  /^lib\/db(\/|\.|$)/,
  /^plugins\//,
  /(^|\/)(provider|providers|openai|github|octokit)(\/|$)/i,
  /(^|\/)(proof|evidence)(\/|$)/i,
  /(^|\/)(scheduler|daemon|background-worker|background_worker)(\/|$)/i,
  /(^|\/)(route|api)\.(js|jsx|ts|tsx)$/,
];

const textByFile = loadTextByFile(requiredFiles);
const helperText = textByFile.get(helperFile);
const componentText = textByFile.get(componentFile);
const previewPanelText = textByFile.get(previewPanelFile);
const contractDocText = textByFile.get(contractDoc);
const indexText = textByFile.get(indexDoc);
const packageJsonText = textByFile.get(packageJsonFile);

assertPackageJsonScript();
assertDocsAndIndex();
assertHelperExportsAndBoundary();
assertComponentBoundary();
assertPreviewPanelIntegration();
assertNoForbiddenRuntimeCode();
const behavior = assertBehavioralHelperAndComponent();
assertCompanionSmokesPass();
const changedFilesBoundary = assertChangedFileBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "autonomy-runner-preflight-copy-export-v0-1",
      pass: true,
      required_files_checked: requiredFiles,
      package_script_checked: true,
      docs_phase_9f_note_checked: true,
      index_pointer_checked: true,
      helper_exports_checked: true,
      helper_behavior_checked: true,
      packet_titles_checked: behavior.packet_titles,
      packet_count: behavior.packet_count,
      dry_run_only_preserved_checked: true,
      every_planned_step_would_execute_false_checked: true,
      bounded_json_parses_checked: true,
      bounded_json_public_safe_checked: true,
      component_import_checked: behavior.component_imported,
      component_manual_copy_preview_checked: true,
      component_local_clipboard_only_checked: true,
      component_no_download_export_to_disk_checked: true,
      no_forbidden_action_controls_checked: true,
      no_api_route_files_changed_checked: true,
      no_app_mcp_tool_files_changed_checked: true,
      no_db_migration_files_changed_checked: true,
      no_provider_openai_github_codex_product_code_checked: true,
      no_child_process_in_product_code_checked: true,
      no_fs_write_apis_in_product_code_checked: true,
      no_interval_timer_cron_worker_daemon_background_loop_checked: true,
      no_proof_evidence_write_checked: true,
      no_memory_perspective_mutation_checked: true,
      no_handoff_send_checked: true,
      no_branch_pr_creation_from_product_code_checked: true,
      no_auto_apply_budget_spend_external_post_checked: true,
      no_file_download_export_to_disk_checked: true,
      prior_phase_smokes_passed: true,
      prior_smoke_allowlist_compatibility_files_allowed:
        priorSmokeAllowlistCompatibilityFiles,
      changed_files_boundary_checked: changedFilesBoundary.checked,
      changed_files_boundary_skipped: changedFilesBoundary.skipped,
      changed_files_boundary_skip_reason: changedFilesBoundary.skip_reason,
      changed_files_observed: changedFilesBoundary.files,
      changed_files_base_ref: changedFilesBoundary.base_ref,
      untracked_files_checked: changedFilesBoundary.untracked_checked,
      untracked_files_skipped: changedFilesBoundary.untracked_skipped,
      untracked_files_skip_reason: changedFilesBoundary.untracked_skip_reason,
      smoke_type:
        "static-and-import-autonomy-runner-preflight-copy-preview-boundary",
    },
    null,
    2,
  ),
);
console.log("PASS smoke:autonomy-runner-preflight-copy-export-v0-1");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText,
    scriptName: "smoke:autonomy-runner-preflight-copy-export-v0-1",
    expectedCommand:
      "node scripts/smoke-autonomy-runner-preflight-copy-export-v0-1.mjs",
  });
}

function assertDocsAndIndex() {
  assertContainsAll(contractDocText, [
    "Phase 9F Local Copy / Manual-Copy Preview",
    "local copy/manual-copy preview",
    "Copy packets are local text previews only",
    "Clipboard copy is local-only",
    "There is no file download/export-to-disk",
    "There is no external post, send, or publish behavior",
    "There is no run, schedule, launch, apply, persist, write, or product action behavior",
    "Phase 9F is not approval to run",
    "preserves `dry_run_only`",
    "every planned step with `would_execute: false`",
    "smoke:autonomy-runner-preflight-copy-export-v0-1",
    "Phase 9G - explicit operator-approved runner skeleton planning v0.1",
    "planning only unless separately and explicitly scoped",
  ], { label: contractDoc });

  assertContainsAll(indexText, [
    "Phase 9F Autonomy Runner Preflight / Dry-Run local copy and manual-copy preview v0.1",
    helperFile,
    componentFile,
    smokeFile,
    "smoke:autonomy-runner-preflight-copy-export-v0-1",
    "local text/manual-copy only",
    "may use local clipboard copy",
    "dry_run_plan.status: dry_run_only",
    "would_execute: false",
    "file download/export-to-disk",
    "external post/send/publish",
    "external side effect",
  ], { label: indexDoc });
}

function assertHelperExportsAndBoundary() {
  assertContainsAll(helperText, [
    "AUTONOMY_RUNNER_PREFLIGHT_COPY_PACKET_VERSION",
    "autonomy_runner_preflight_copy_export.v0.1",
    "AUTONOMY_RUNNER_PREFLIGHT_COPY_PACKET_TITLES",
    "Preflight Markdown",
    "Dry-Run Plan Markdown",
    "Readiness Checklist",
    "Combined Review Packet",
    "Bounded JSON Preview",
    "buildAutonomyRunnerPreflightMarkdown",
    "buildAutonomyDryRunPlanMarkdown",
    "buildAutonomyRunnerReadinessChecklistMarkdown",
    "buildAutonomyRunnerReviewPacketMarkdown",
    "buildAutonomyRunnerPreflightJsonPreview",
    "buildAutonomyRunnerPreflightCopyPackets",
    "buildAutonomyRunnerPreflightCopyBoundary",
    "Local text copy/manual-copy preview only",
    "Clipboard copy, when available, is local-only",
    "No file download/export-to-disk",
    "No runner starts",
    "No scheduler starts",
    "No daemon starts",
    "No background work starts",
    "No Codex execution",
    "No GitHub/provider/OpenAI call",
    "No DB write",
    "No proof/evidence write",
    "No memory mutation",
    "No durable Perspective apply",
    "No handoff send",
    "No branch/PR creation",
    "No auto-apply",
    "No budget spend",
    "No external side effect",
    "dry_run_only",
    "would_execute: false",
    "SOURCE_CAVEAT",
    "public_safe_text_only",
    "no_executable_commands",
  ], { label: helperFile });
}

function assertComponentBoundary() {
  assertContainsAll(componentText, [
    '"use client"',
    "Autonomy Runner Preflight Copy Preview",
    "buildAutonomyRunnerPreflightCopyPackets",
    "Copy/manual-copy only",
    "Local clipboard only",
    "No file download/export-to-disk",
    "No external post/send/publish",
    "No runner starts",
    "No scheduler starts",
    "No daemon starts",
    "No background work starts",
    "No Codex execution",
    "No GitHub/provider/OpenAI call",
    "No DB write",
    "No proof/evidence write",
    "No memory mutation",
    "No durable Perspective apply",
    "No handoff send",
    "No branch/PR creation",
    "No auto-apply",
    "No budget spend",
    "No external side effect",
    "Copy preflight markdown",
    "Copy dry-run plan markdown",
    "Copy readiness checklist",
    "Copy combined review packet",
    "Copy bounded JSON preview",
    "textarea",
    "readOnly",
    "Manual-copy packet text",
    "navigator.clipboard.writeText",
    "file_download_created",
    "exported_to_disk",
    "external_side_effect_created",
  ], { label: componentFile });

  const buttonLabels = extractButtonLabels(componentText);
  const forbiddenButtonLabels = [
    "Download",
    "Export file",
    "Save file",
    "Save to disk",
    "Send",
    "Post",
    "Publish",
    "Start runner",
    "Run now",
    "Schedule",
    "Launch Codex",
    "Call GitHub",
    "Send handoff",
    "Apply delta",
    "Approve auto-apply",
    "Persist run record",
    "Create branch",
    "Open PR",
    "Merge",
    "Deploy",
    "Retry",
    "Replay",
    "Spend budget",
  ];

  for (const label of buttonLabels) {
    for (const forbidden of forbiddenButtonLabels) {
      assert.notEqual(
        normalizeButtonText(label).toLowerCase(),
        forbidden.toLowerCase(),
        `Component must not expose forbidden action button: ${forbidden}`,
      );
    }
  }
}

function assertPreviewPanelIntegration() {
  assertContainsAll(previewPanelText, [
    "AutonomyRunnerPreflightCopyExportPanel",
    "<AutonomyRunnerPreflightCopyExportPanel preview={preview} />",
  ], { label: previewPanelFile });
}

function assertNoForbiddenRuntimeCode() {
  const productTextByFile = new Map([
    [helperFile, helperText],
    [componentFile, componentText],
    [previewPanelFile, previewPanelText],
  ]);

  const forbiddenProductSnippets = [
    "URL.createObjectURL",
    "new Blob",
    "Blob(",
    "download=",
    ".download",
    "FileReader",
    "writeFile",
    "appendFile",
    "createWriteStream",
    "node:fs",
    "child_process",
    "exec(",
    "spawn(",
    "fetch(",
    "XMLHttpRequest",
    "sendBeacon",
    "setInterval(",
    "setTimeout(",
    "cron",
    "Worker(",
    "new Worker",
    "recordProof",
    "createEvidence",
    "writeEvidence",
    "mutateMemory",
    "applyProjectPerspective",
    "sendHandoff",
    "createBranch",
    "openPullRequest",
    "autoApply",
    "spendBudget",
  ];

  for (const [file, text] of productTextByFile) {
    for (const snippet of forbiddenProductSnippets) {
      assert(
        !text.includes(snippet),
        `${file} must not contain forbidden runtime/file/export snippet: ${snippet}`,
      );
    }
  }
}

function assertBehavioralHelperAndComponent() {
  const behaviorScript = String.raw`
    import { AutonomyRunnerPreflightCopyExportPanel } from "./components/autonomy/autonomy-runner-preflight-copy-export-panel.tsx";
    import { buildAutonomyRunnerPreflightCopyPackets } from "./lib/autonomy/autonomy-runner-preflight-copy-export.ts";
    import { readAutonomyRunnerPreflightPreviewForWeb } from "./lib/autonomy/read-autonomy-runner-preflight-for-web.ts";

    const preview = readAutonomyRunnerPreflightPreviewForWeb();
    const packets = buildAutonomyRunnerPreflightCopyPackets(preview);
    const json = JSON.parse(packets.bounded_json_text);
    const packetTexts = packets.packets.map((packet) => packet.text);

    console.log(JSON.stringify({
      componentType: typeof AutonomyRunnerPreflightCopyExportPanel,
      packetCount: packets.packets.length,
      packetTitles: packets.packets.map((packet) => packet.title),
      everyPacketHasBoundary: packetTexts.every((text) =>
        /copy\/manual-copy|manual-copy/i.test(text) &&
        /No runner starts|not approval to run/i.test(text) &&
        /No file download\/export-to-disk|does not download files/i.test(text)
      ),
      dryRunTextHasStatus: packets.dry_run_plan_markdown.includes("status: dry_run_only"),
      plannedStepTextHasWouldExecuteFalse: packets.dry_run_plan_markdown.includes("would_execute: false"),
      preflightTextHasReadiness: packets.preflight_markdown.includes("readiness:"),
      packetsHaveBlockersOrWarnings:
        packets.preflight_markdown.includes("## Blockers") &&
        packets.preflight_markdown.includes("## Warnings"),
      packetsHaveJudgmentReview:
        packets.preflight_markdown.includes("required_user_judgment") &&
        packets.preflight_markdown.includes("required_operator_review"),
      packetsHaveAssessments:
        packets.preflight_markdown.includes("## Assessments") &&
        packets.readiness_checklist_markdown.includes("Budget / Action / Delta / Review / Stop / Staleness / Authority"),
      packetsHaveDryRunDetails:
        packets.dry_run_plan_markdown.includes("planned_read_source") &&
        packets.dry_run_plan_markdown.includes("planned_step") &&
        packets.dry_run_plan_markdown.includes("blocked_step") &&
        packets.dry_run_plan_markdown.includes("required_precondition") &&
        packets.dry_run_plan_markdown.includes("required_check") &&
        packets.dry_run_plan_markdown.includes("stop_condition") &&
        packets.dry_run_plan_markdown.includes("Budget Projection"),
      packetsHaveSourceRefs: packets.preflight_markdown.includes("## Source Refs"),
      packetsHaveAuthorityBoundary:
        packets.preflight_markdown.includes("## Authority Boundary") &&
        packets.dry_run_plan_markdown.includes("## No-Run Boundary"),
      packetsHavePublicSafety: packets.preflight_markdown.includes("## Public Safety"),
      jsonStatus: json.dry_run_plan.status,
      jsonEveryStepWouldExecuteFalse: json.dry_run_plan.planned_steps.every((step) => step.would_execute === false),
      jsonAuthorityAllFalse: Object.entries(json.preflight.authority_boundary)
        .filter(([key]) => key !== "notes")
        .every(([, value]) => value === false),
      jsonPublicSafe:
        json.preflight.public_safety.contains_private_conversation === false &&
        json.preflight.public_safety.contains_hidden_reasoning === false &&
        json.preflight.public_safety.contains_local_private_paths === false &&
        json.preflight.public_safety.contains_secrets_or_tokens === false &&
        json.preflight.public_safety.contains_raw_provider_output === false &&
        json.preflight.public_safety.contains_raw_retrieval_output === false &&
        json.preflight.public_safety.contains_real_account_artifacts === false,
      jsonNoExecutableCommands: json.no_executable_commands === true,
      jsonCopyBoundary:
        json.copy_boundary.copy_manual_copy_only === true &&
        json.copy_boundary.file_download_created === false &&
        json.copy_boundary.exported_to_disk === false &&
        json.copy_boundary.external_side_effect_created === false,
      jsonTextPublicSafeNoPrivatePaths: !packets.bounded_json_text.includes("/Users/") && !packets.bounded_json_text.includes("sk-"),
    }));
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
  const result = JSON.parse(output);

  assert.equal(result.componentType, "function");
  assert(result.packetCount >= 5, "copy packet builder must return at least five packets");
  assert.deepEqual(result.packetTitles, [
    "Preflight Markdown",
    "Dry-Run Plan Markdown",
    "Readiness Checklist",
    "Combined Review Packet",
    "Bounded JSON Preview",
  ]);
  assert.equal(result.everyPacketHasBoundary, true);
  assert.equal(result.dryRunTextHasStatus, true);
  assert.equal(result.plannedStepTextHasWouldExecuteFalse, true);
  assert.equal(result.preflightTextHasReadiness, true);
  assert.equal(result.packetsHaveBlockersOrWarnings, true);
  assert.equal(result.packetsHaveJudgmentReview, true);
  assert.equal(result.packetsHaveAssessments, true);
  assert.equal(result.packetsHaveDryRunDetails, true);
  assert.equal(result.packetsHaveSourceRefs, true);
  assert.equal(result.packetsHaveAuthorityBoundary, true);
  assert.equal(result.packetsHavePublicSafety, true);
  assert.equal(result.jsonStatus, "dry_run_only");
  assert.equal(result.jsonEveryStepWouldExecuteFalse, true);
  assert.equal(result.jsonAuthorityAllFalse, true);
  assert.equal(result.jsonPublicSafe, true);
  assert.equal(result.jsonNoExecutableCommands, true);
  assert.equal(result.jsonCopyBoundary, true);
  assert.equal(result.jsonTextPublicSafeNoPrivatePaths, true);

  return {
    component_imported: true,
    packet_count: result.packetCount,
    packet_titles: result.packetTitles,
  };
}

function assertCompanionSmokesPass() {
  for (const scriptName of [
    "smoke:autonomy-runner-preflight-v0-1",
    "smoke:autonomy-runner-preflight-route-v0-1",
    "smoke:autonomy-runner-preflight-web-preview-v0-1",
    "smoke:chatgpt-app-autonomy-runner-preflight-tool-v0-1",
    "smoke:codex-autonomy-runner-preflight-v0-1",
  ]) {
    execFileSync("npm", ["run", scriptName], {
      cwd: process.cwd(),
      env: { ...process.env },
      stdio: "pipe",
    });
  }
}

function assertChangedFileBoundary() {
  const untracked = collectUntrackedFiles();
  const files = uniqueSorted(untracked);
  for (const file of files) {
    assert(
      allowedChangedFiles.has(file),
      `Unexpected untracked file for Phase 9F Autonomy Runner Preflight copy preview: ${file}`,
    );
  }

  const result = assertChangedFilesWithin({
    allowedChangedFiles,
    label: "Phase 9F Autonomy Runner Preflight copy preview",
  });

  for (const file of result.files) {
    for (const pattern of forbiddenChangedFilePatterns) {
      assert(
        !pattern.test(file),
        `Forbidden changed file for Phase 9F Autonomy Runner Preflight copy preview: ${file}`,
      );
    }
  }

  return {
    ...result,
    untracked_checked: true,
    untracked_skipped: false,
    untracked_skip_reason: null,
    files: uniqueSorted([...result.files, ...files]),
  };
}

function extractButtonLabels(text) {
  return [...text.matchAll(/<button[\s\S]*?>([\s\S]*?)<\/button>/g)].map(
    (match) => match[1],
  );
}

function normalizeButtonText(text) {
  return text
    .replace(/\{[\s\S]*?\}/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
