#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";

const reportVersion = "operator_path_assisted_manual_qa_execution_report.v0.1";
const scope = "project:augnes";
const runbookRef = "operator_path_manual_qa_runbook_v0_1";
const assistedExecutionMode = "codex_cdp_browser_assisted";

const runbookPath = "docs/OPERATOR_PATH_MANUAL_QA_RUNBOOK_V0_1.md";
const reportDir =
  "/tmp/augnes-operator-path-assisted-manual-qa-execution-report-v0-1";
const assistedReportPath =
  "/tmp/augnes-operator-path-assisted-manual-qa-execution-report-v0-1/report.json";
const browserArtifactDir =
  "/tmp/augnes-final-rag-answer-review-memory-operator-browser-validation-v0-1";
const browserReportPath =
  "/tmp/augnes-final-rag-answer-review-memory-operator-browser-validation-v0-1/report.json";
const desktopScreenshotPath =
  "/tmp/augnes-final-rag-answer-review-memory-operator-browser-validation-v0-1/desktop.png";
const mobileScreenshotPath =
  "/tmp/augnes-final-rag-answer-review-memory-operator-browser-validation-v0-1/mobile-390.png";

const commandGroups = {
  static_baseline: [
    "node --check scripts/smoke-operator-path-manual-qa-runbook-v0-1.mjs",
    "npm run smoke:operator-path-manual-qa-runbook-v0-1",
    "npm run smoke:final-rag-answer-review-memory-operator-path-usability-audit-v0-1",
    "npm run smoke:final-rag-answer-review-memory-end-to-end-operator-path-v0-1",
    "npm run smoke:final-rag-answer-review-memory-operator-browser-validation-v0-1",
  ],
  focused_smokes: [
    "npm run smoke:promotion-readiness-packet-from-review-memory-v0-1",
    "npm run smoke:final-answer-candidate-review-ui-binding-v0-1",
    "npm run smoke:final-rag-answer-review-memory-binding-v0-1",
    "npm run smoke:final-rag-answer-generation-candidate-review-v0-1",
    "npm run smoke:research-candidate-review-memory-db-routes-runtime-v0-1",
    "npm run smoke:research-candidate-review-memory-db-store-runtime-v0-1",
    "npm run smoke:perspective-promotion-runtime-contract-v0-1",
    "npm run smoke:perspective-promotion-decision-store-v0-1",
    "npm run smoke:product-write-accepted-evidence-ref-runtime-v0-1",
    "npm run smoke:privacy-redaction-guard-v0-1",
    "npm run smoke:authority-boundary-regression-v0-1",
    "npm run smoke:runtime-audit-panel-runtime-completion-v0-1",
  ],
  browser_validation: [
    "npm run browser:validate-final-rag-answer-review-memory-operator-path-v0-1",
  ],
  type_and_diff: ["npm run typecheck", "git diff --check", "git diff --cached --check"],
};

const humanJudgmentItemsNotCompleted = [
  "full human comprehension of runbook clarity",
  "human assessment of UI readability",
  "human assessment of whether boundary notes are sufficiently understandable",
  "human assessment of whether readiness can be confused with promotion",
  "human dogfood readiness signoff",
  "human decision on next product slice",
  "human acceptance of screenshots and UI layout",
];

const knownWarningNeedles = [
  "ExperimentalWarning: stripTypeScriptTypes",
  "MODULE_TYPELESS_PACKAGE_JSON",
];

const preservedAuthorityBoundaries = {
  no_new_runtime_authority: true,
  no_new_api_routes: true,
  no_ui_behavior_changes: true,
  no_db_schema_changes: true,
  review_memory_write_from_ui: false,
  final_answer_generation_expansion: false,
  live_provider_calls: false,
  prompt_sending_expansion: false,
  retrieval_execution_expansion: false,
  source_fetching: false,
  retrieval_index_writes: false,
  promotion_execution: false,
  promotion_decision_write: false,
  promotion_decision_store_write: false,
  proof_or_evidence_creation: false,
  durable_state_mutation: false,
  formation_receipt_write: false,
  product_write: false,
  accepted_evidence_ref_write: false,
  product_id_allocation: false,
  github_or_release_authority: false,
  human_signoff_completed: false,
  smoke_ci_browser_pass_is_truth: false,
};

const forbiddenCapabilitiesNotOpened = [
  "new_api_routes",
  "ui_behavior_changes",
  "review_memory_writes_from_ui",
  "final_answer_generation_expansion",
  "live_provider_calls",
  "prompt_sending_expansion",
  "retrieval_execution_expansion",
  "source_fetching",
  "retrieval_index_writes",
  "promotion_execution",
  "promotion_decision_record_writes",
  "promotion_decision_store_writes",
  "promotion_decision_routes_or_ui",
  "proof_or_evidence_creation",
  "claim_or_evidence_writes",
  "durable_perspective_state_write_or_apply",
  "formation_receipt_writes",
  "product_write",
  "accepted_evidence_ref_write",
  "product_id_allocation",
  "github_actuation",
  "release_execution",
  "human_signoff",
];

const commandResults = [];
const knownWarnings = new Set();
const mechanicalFailures = [];

main();

function main() {
  mkdirSync(reportDir, { recursive: true });
  const runbook = readFileSync(runbookPath, "utf8");
  assertRunbookContainsCommands(runbook);

  for (const [group, commands] of Object.entries(commandGroups)) {
    for (const command of commands) {
      const result = runCommand(group, command);
      commandResults.push(result);
      if (!result.passed) {
        mechanicalFailures.push({
          group,
          command,
          exit_code: result.exit_code,
          signal: result.signal,
        });
      }
    }
  }

  const browserReport = existsSync(browserReportPath)
    ? JSON.parse(readFileSync(browserReportPath, "utf8"))
    : null;
  const browserReportSummary = summarizeBrowserReport(browserReport);
  const browserArtifactChecks = {
    browser_report_exists: existsSync(browserReportPath),
    desktop_screenshot_exists: fileExistsWithBytes(desktopScreenshotPath),
    mobile_screenshot_exists: fileExistsWithBytes(mobileScreenshotPath),
    artifact_contents_copied_into_repo: false,
  };
  const browserChecksPassed =
    browserArtifactChecks.browser_report_exists &&
    browserArtifactChecks.desktop_screenshot_exists &&
    browserArtifactChecks.mobile_screenshot_exists &&
    browserReportSummary.final_status === "pass" &&
    browserReportSummary.browser_launched === true &&
    browserReportSummary.forbidden_request_count === 0 &&
    browserReportSummary.external_request_count === 0 &&
    browserReportSummary.relevant_console_error_count === 0 &&
    browserReportSummary.pageerror_count === 0 &&
    browserReportSummary.failed_request_count === 0 &&
    browserReportSummary.browser_observed_request_boundaries_only === true &&
    browserReportSummary.server_side_outbound_instrumentation === false;

  if (!browserChecksPassed) {
    mechanicalFailures.push({
      group: "browser_artifact_summary",
      command: "parse browser validation report summary",
      failure: "browser summary or artifacts did not satisfy assisted pass criteria",
    });
  }

  const mechanicalChecksPassed = mechanicalFailures.length === 0;
  const assistedExecutionCompleted = mechanicalChecksPassed && browserChecksPassed;
  const safeToRequestHumanSpotReview =
    assistedExecutionCompleted && mechanicalChecksPassed && browserChecksPassed;

  const report = {
    report_version: reportVersion,
    scope,
    generated_at: new Date().toISOString(),
    runbook_ref: runbookRef,
    assisted_execution_mode: assistedExecutionMode,
    precondition_pr_854_merged: true,
    commands_run: commandResults.map((result) => result.command),
    command_results: commandResults,
    browser_validation_rerun: commandResults.find(
      (result) =>
        result.command ===
        "npm run browser:validate-final-rag-answer-review-memory-operator-path-v0-1",
    ),
    browser_report_path: browserReportPath,
    desktop_screenshot_path: desktopScreenshotPath,
    mobile_screenshot_path: mobileScreenshotPath,
    browser_report_summary: browserReportSummary,
    artifact_policy: {
      report_written_under_tmp: assistedReportPath,
      screenshots_copied_into_repo: false,
      raw_browser_report_contents_copied_into_repo: false,
      raw_route_responses_copied_into_repo: false,
      raw_db_rows_copied_into_repo: false,
      terminal_logs_copied_into_repo: false,
      private_local_paths_included: false,
      browser_session_dumps_included: false,
    },
    browser_artifact_checks: browserArtifactChecks,
    mechanical_pass_criteria: {
      static_command_checks_passed: groupPassed("static_baseline"),
      focused_smoke_checks_passed: groupPassed("focused_smokes"),
      type_and_diff_checks_passed: groupPassed("type_and_diff"),
      browser_validation_command_passed: groupPassed("browser_validation"),
      browser_summary_passed: browserChecksPassed,
      assisted_report_written_under_tmp: true,
    },
    mechanical_failures: mechanicalFailures,
    human_judgment_items_not_completed: humanJudgmentItemsNotCompleted,
    human_signoff_completed: false,
    human_review_still_required: true,
    safe_to_request_human_spot_review: safeToRequestHumanSpotReview,
    preserved_authority_boundaries: preservedAuthorityBoundaries,
    forbidden_capabilities_not_opened: forbiddenCapabilitiesNotOpened,
    known_warnings: [...knownWarnings].sort(),
    assisted_execution_completed: assistedExecutionCompleted,
    mechanical_checks_passed: mechanicalChecksPassed,
    browser_checks_passed: browserChecksPassed,
    final_status: assistedExecutionCompleted ? "pass" : "fail",
  };

  writeFileSync(assistedReportPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(
    `${JSON.stringify(
      {
        assisted_execution_report: assistedReportPath,
        final_status: report.final_status,
        assisted_execution_completed: report.assisted_execution_completed,
        mechanical_checks_passed: report.mechanical_checks_passed,
        browser_checks_passed: report.browser_checks_passed,
        human_signoff_completed: report.human_signoff_completed,
        human_review_still_required: report.human_review_still_required,
        safe_to_request_human_spot_review: report.safe_to_request_human_spot_review,
      },
      null,
      2,
    )}\n`,
  );

  if (!assistedExecutionCompleted) process.exit(1);
}

function assertRunbookContainsCommands(runbook) {
  for (const commands of Object.values(commandGroups)) {
    for (const command of commands) {
      if (!runbook.includes(command)) {
        throw new Error(`Runbook is missing command: ${command}`);
      }
    }
  }
}

function runCommand(group, command) {
  const startedAt = Date.now();
  const result = spawnSync(command, {
    cwd: process.cwd(),
    shell: true,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  const combinedOutput = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  const warning_markers = knownWarningNeedles.filter((warning) =>
    combinedOutput.includes(warning),
  );
  for (const warning of warning_markers) knownWarnings.add(warning);
  return {
    group,
    command,
    passed: result.status === 0,
    exit_code: result.status,
    signal: result.signal,
    duration_ms: Date.now() - startedAt,
    warning_markers,
    stdout_copied_to_report: false,
    stderr_copied_to_report: false,
  };
}

function summarizeBrowserReport(report) {
  if (!report) {
    return {
      final_status: "missing",
      forbidden_request_count: null,
      external_request_count: null,
      relevant_console_error_count: null,
      pageerror_count: null,
      failed_request_count: null,
      browser_launched: false,
      browser_observed_request_boundaries_only: false,
      server_side_outbound_instrumentation: null,
    };
  }
  const networkNote = String(report.network_observation_note ?? "");
  return {
    final_status: report.final_status ?? "missing",
    forbidden_request_count: Number(report.forbidden_request_count ?? -1),
    external_request_count: Number(report.external_request_count ?? -1),
    relevant_console_error_count: Number(
      report.relevant_console_error_count ?? report.console_error_count ?? -1,
    ),
    pageerror_count: Number(report.pageerror_count ?? -1),
    failed_request_count: Number(report.failed_request_count ?? -1),
    browser_launched:
      Boolean(report.browser_executable_path) &&
      report.browser_unavailable_reason == null,
    browser_observed_request_boundaries_only:
      networkNote.includes("browser/page network events only") ||
      networkNote.includes("browser/page observation only"),
    server_side_outbound_instrumentation:
      networkNote.includes("not server-side outbound network instrumentation")
        ? false
        : null,
    page_loaded: report.page_loaded === true,
    panel_rendered: report.panel_rendered === true,
    boundary_notes_visible: report.boundary_notes_visible === true,
    db_path_entered: report.db_path_entered === true,
    list_action_completed: report.list_action_completed === true,
    selected_record_opened: report.selected_record_opened === true,
    activity_history_loaded: report.activity_history_loaded === true,
    bounded_packet_preview_created: report.bounded_packet_preview_created === true,
    invalid_db_path_blocked_before_fetch:
      report.invalid_db_path_blocked_before_fetch === true,
    private_raw_filter_blocked_before_fetch:
      report.private_raw_filter_blocked_before_fetch === true,
  };
}

function groupPassed(group) {
  return commandResults
    .filter((result) => result.group === group)
    .every((result) => result.passed);
}

function fileExistsWithBytes(filePath) {
  return existsSync(filePath) && statSync(filePath).isFile() && statSync(filePath).size > 0;
}
