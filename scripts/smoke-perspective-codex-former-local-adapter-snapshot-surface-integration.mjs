import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import surfaceIntegration from "../lib/perspective-ingest/codex-former-local-adapter-snapshot-surface-integration.ts";

const {
  CODEX_FORMER_LOCAL_ADAPTER_INBOX_SURFACE_VIEW_MODELS_VERSION,
  CODEX_FORMER_LOCAL_ADAPTER_SESSION_PANEL_SURFACE_VIEW_MODELS_VERSION,
  CODEX_FORMER_LOCAL_ADAPTER_SNAPSHOT_SURFACE_INTEGRATION_READINESS_VERSION,
  buildLocalAdapterSnapshotSurfaceIntegration,
  hashLocalAdapterSurfaceIntegrationContent,
  stableStringifyLocalAdapterSurfaceIntegrationJson,
  validateLocalAdapterSnapshotSurfaceIntegrationInputs,
} = surfaceIntegration;

const packageFile = "package.json";
const libFile =
  "lib/perspective-ingest/codex-former-local-adapter-snapshot-surface-integration.ts";
const cliFile =
  "scripts/perspective-codex-former-local-adapter-snapshot-surface-integration.mjs";
const smokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-snapshot-surface-integration.mjs";
const surfaceSnapshotsSmokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-surface-snapshots.mjs";
const prepareOutputSnapshotsSmokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-prepare-output-snapshots.mjs";
const docFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_SNAPSHOT_SURFACE_INTEGRATION_V0_1.md";
const reportFile =
  "reports/2026-06-11-perspective-codex-former-local-adapter-snapshot-surface-integration.md";
const sessionNotReadyFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-session-panel-snapshot-not-ready.json";
const sessionWaitingFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-session-panel-snapshot-waiting.json";
const sessionPreparedFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-session-panel-snapshot-prepared.json";
const inboxNotReadyFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-inbox-item-not-ready.json";
const inboxWaitingFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-inbox-item-waiting.json";
const inboxPreparedFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-inbox-item-prepared.json";
const sessionViewModelsFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-session-panel-surface-view-models.json";
const inboxViewModelsFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-inbox-surface-view-models.json";
const readinessFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-snapshot-surface-integration-readiness.json";

const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";
const generatedAt = "2026-06-11T00:00:00.000Z";
const deterministicOutDir =
  "/tmp/augnes-codex-former-local-adapter-snapshot-surface-integration";
const tmpRoot =
  "/tmp/augnes-codex-former-local-adapter-snapshot-surface-integration-smoke";
const rejectionDir = join(tmpRoot, "rejections");
const deterministicSessionOut = join(
  deterministicOutDir,
  "codex-former-local-adapter-session-panel-surface-view-models.json",
);
const deterministicInboxOut = join(
  deterministicOutDir,
  "codex-former-local-adapter-inbox-surface-view-models.json",
);
const deterministicReadinessOut = join(
  deterministicOutDir,
  "codex-former-local-adapter-snapshot-surface-integration-readiness.json",
);

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const libText = readFileSync(libFile, "utf8");
const cliText = readFileSync(cliFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");
const sessionNotReadyText = readFileSync(sessionNotReadyFixtureFile, "utf8");
const sessionWaitingText = readFileSync(sessionWaitingFixtureFile, "utf8");
const sessionPreparedText = readFileSync(sessionPreparedFixtureFile, "utf8");
const inboxNotReadyText = readFileSync(inboxNotReadyFixtureFile, "utf8");
const inboxWaitingText = readFileSync(inboxWaitingFixtureFile, "utf8");
const inboxPreparedText = readFileSync(inboxPreparedFixtureFile, "utf8");
const sessionViewModelsText = readFileSync(sessionViewModelsFixtureFile, "utf8");
const inboxViewModelsText = readFileSync(inboxViewModelsFixtureFile, "utf8");
const readinessText = readFileSync(readinessFixtureFile, "utf8");
const sessionNotReady = JSON.parse(sessionNotReadyText);
const sessionWaiting = JSON.parse(sessionWaitingText);
const sessionPrepared = JSON.parse(sessionPreparedText);
const inboxNotReady = JSON.parse(inboxNotReadyText);
const inboxWaiting = JSON.parse(inboxWaitingText);
const inboxPrepared = JSON.parse(inboxPreparedText);
const sessionViewModels = JSON.parse(sessionViewModelsText);
const inboxViewModels = JSON.parse(inboxViewModelsText);
const readiness = JSON.parse(readinessText);

assertPackageScripts();
assertFilesExist();
assertSourceContracts();
runDeterministicGeneration();
assertCommittedFixtureShapes();
runInputRejectionCoverage();
runOutputShapeRejectionCoverage();
assertDocsAndReport();
assertNoRawUnsafeMarkersInPublicArtifacts();
assertNoForbiddenImplementationSurfaces();
assertChangedFileBoundary();

console.log(
  "PASS smoke:perspective-codex-former-local-adapter-snapshot-surface-integration",
);

function assertPackageScripts() {
  assert.equal(
    packageJson.scripts[
      "perspective:codex-former:local-adapter:surface-integration"
    ],
    `${expectedTsxCommand} ${cliFile}`,
  );
  assert.equal(
    packageJson.scripts[
      "smoke:perspective-codex-former-local-adapter-snapshot-surface-integration"
    ],
    `${expectedTsxCommand} ${smokeFile}`,
  );
  assert.equal(
    packageJson.scripts["perspective:codex-former:local-adapter:snapshots"],
    `${expectedTsxCommand} scripts/perspective-codex-former-local-adapter-surface-snapshots.mjs`,
  );
  assert.equal(
    packageJson.scripts[
      "smoke:perspective-codex-former-local-adapter-surface-snapshots"
    ],
    `${expectedTsxCommand} ${surfaceSnapshotsSmokeFile}`,
  );
  assert.equal(
    packageJson.scripts[
      "smoke:perspective-codex-former-local-adapter-prepare-output-snapshots"
    ],
    `${expectedTsxCommand} ${prepareOutputSnapshotsSmokeFile}`,
  );
}

function assertFilesExist() {
  for (const file of [
    packageFile,
    libFile,
    cliFile,
    smokeFile,
    docFile,
    reportFile,
    sessionNotReadyFixtureFile,
    sessionWaitingFixtureFile,
    sessionPreparedFixtureFile,
    inboxNotReadyFixtureFile,
    inboxWaitingFixtureFile,
    inboxPreparedFixtureFile,
    sessionViewModelsFixtureFile,
    inboxViewModelsFixtureFile,
    readinessFixtureFile,
  ]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }
}

function assertSourceContracts() {
  assertIncludesAll(libText, [
    "buildLocalAdapterSessionPanelSurfaceViewModels",
    "buildLocalAdapterInboxSurfaceViewModels",
    "buildLocalAdapterSnapshotSurfaceIntegrationReadiness",
    "validateLocalAdapterSnapshotSurfaceIntegrationInputs",
    "stableStringifyLocalAdapterSurfaceIntegrationJson",
    "hashLocalAdapterSurfaceIntegrationContent",
    "codex_former_local_adapter_session_panel_surface_view_models.v0.1",
    "codex_former_local_adapter_inbox_surface_view_models.v0.1",
    "codex_former_local_adapter_snapshot_surface_integration_readiness.v0.1",
    "prepared-waiting-for-codex-return",
    "prepared_waiting_for_codex_return",
    "raw prompt/source/packet content",
  ]);
  assertIncludesAll(cliText, [
    "session-not-ready",
    "session-waiting",
    "session-prepared",
    "inbox-not-ready",
    "inbox-waiting",
    "inbox-prepared",
    "out-dir",
    "generated-at",
    "session-view-models-out",
    "inbox-view-models-out",
    "readiness-out",
    "output paths must be distinct",
    "read-only local-only non-authorizing",
  ]);
}

function runDeterministicGeneration() {
  rmSync(tmpRoot, { recursive: true, force: true });
  rmSync(deterministicOutDir, { recursive: true, force: true });
  const stdout = runCli([
    "--session-not-ready",
    sessionNotReadyFixtureFile,
    "--session-waiting",
    sessionWaitingFixtureFile,
    "--session-prepared",
    sessionPreparedFixtureFile,
    "--inbox-not-ready",
    inboxNotReadyFixtureFile,
    "--inbox-waiting",
    inboxWaitingFixtureFile,
    "--inbox-prepared",
    inboxPreparedFixtureFile,
    "--out-dir",
    deterministicOutDir,
    "--generated-at",
    generatedAt,
  ]);
  assertIncludesAll(stdout, [
    "mode=local-adapter-snapshot-surface-integration",
    `session_view_models_path=${deterministicSessionOut}`,
    `inbox_view_models_path=${deterministicInboxOut}`,
    `readiness_path=${deterministicReadinessOut}`,
    "readiness_status=ready_for_ui_implementation",
    "default_session_scenario_id=prepared-waiting-for-codex-return",
    "default_selected_item_id=local-adapter-prepared-waiting-for-codex-return",
    "authority_boundary=read-only local-only non-authorizing",
  ]);
  assert.equal(
    readFileSync(deterministicSessionOut, "utf8"),
    sessionViewModelsText,
    "generated Session Panel view-model fixture must match committed fixture",
  );
  assert.equal(
    readFileSync(deterministicInboxOut, "utf8"),
    inboxViewModelsText,
    "generated Inbox view-model fixture must match committed fixture",
  );
  assert.equal(
    readFileSync(deterministicReadinessOut, "utf8"),
    readinessText,
    "generated readiness fixture must match committed fixture",
  );

  const built = buildLocalAdapterSnapshotSurfaceIntegration(buildInput());
  assert.equal(built.sessionViewModelsJson, sessionViewModelsText);
  assert.equal(built.inboxViewModelsJson, inboxViewModelsText);
  assert.equal(built.readinessJson, readinessText);
  assert.deepEqual(validateLocalAdapterSnapshotSurfaceIntegrationInputs(buildInput()), {
    valid: true,
    errors: [],
  });
}

function assertCommittedFixtureShapes() {
  assertSurfaceOutputShape(sessionViewModels, inboxViewModels, readiness);

  assert.equal(
    sessionViewModels.view_model_version,
    CODEX_FORMER_LOCAL_ADAPTER_SESSION_PANEL_SURFACE_VIEW_MODELS_VERSION,
  );
  assert.equal(sessionViewModels.surface_kind, "session_panel");
  assert.equal(sessionViewModels.generated_at, generatedAt);
  assert.equal(sessionViewModels.source_kind, "local_adapter_snapshot_fixtures");
  assert.equal(
    sessionViewModels.default_scenario_id,
    "prepared-waiting-for-codex-return",
  );
  assert.deepEqual(
    sessionViewModels.scenarios.map((scenario) => scenario.snapshot_state),
    ["not_ready", "waiting", "prepared_waiting_for_codex_return"],
  );
  assert.deepEqual(
    sessionViewModels.scenarios.map((scenario) => scenario.scenario_id),
    ["not-prepared", "waiting-for-candidate", "prepared-waiting-for-codex-return"],
  );

  const preparedSession = findByState(
    sessionViewModels.scenarios,
    "prepared_waiting_for_codex_return",
  );
  assert.equal(
    preparedSession.primary_status_label,
    "Prepared, waiting for Codex return",
  );
  assert.equal(
    preparedSession.caveat_label,
    "Manual Codex return has not been captured.",
  );
  assertIncludesAll(preparedSession.next_safe_action_label, [
    "separate user-started Codex session",
    "exactly one candidate envelope",
  ]);
  assert.equal(preparedSession.review_only, true);
  assert.equal(preparedSession.accepted_state, false);
  assert.equal(preparedSession.handoff_status.constellation_available, false);
  assert.equal(preparedSession.handoff_status.validation_available, false);
  assert.equal(preparedSession.handoff_status.returned_candidate_available, false);
  assert.equal(preparedSession.authority_summary.review_only, true);
  assert.equal(preparedSession.authority_summary.accepted_state, false);
  assert.equal(
    preparedSession.authority_summary.prepare_helper_executed_operational_only,
    true,
  );
  assertIncludesAll(
    preparedSession.evidence_cards.map((card) => card.title).join("\n"),
    [
      "Prepare execution summary",
      "Helper output refs",
      "Helper output hashes",
      "Source snapshot",
      "Authority boundary",
    ],
  );
  assert.equal(preparedSession.source_snapshot_path, sessionPreparedFixtureFile);
  assert.equal(preparedSession.source_snapshot_hash, hashText(sessionPreparedText));

  assert.equal(
    inboxViewModels.view_model_version,
    CODEX_FORMER_LOCAL_ADAPTER_INBOX_SURFACE_VIEW_MODELS_VERSION,
  );
  assert.equal(inboxViewModels.surface_kind, "capture_review_inbox");
  assert.equal(inboxViewModels.generated_at, generatedAt);
  assert.equal(inboxViewModels.source_kind, "local_adapter_snapshot_fixtures");
  assert.equal(inboxViewModels.default_filter, "all");
  assert.equal(
    inboxViewModels.default_selected_item_id,
    "local-adapter-prepared-waiting-for-codex-return",
  );
  assert.deepEqual(inboxViewModels.filters, [
    "all",
    "not_ready",
    "waiting",
    "prepared",
  ]);
  assert.deepEqual(inboxViewModels.counts, {
    blocked: 0,
    not_ready: 1,
    prepared: 1,
    reviewable: 0,
    total: 3,
    waiting: 1,
  });
  assert.deepEqual(
    inboxViewModels.items.map((item) => item.snapshot_state),
    ["not_ready", "waiting", "prepared_waiting_for_codex_return"],
  );

  const preparedInbox = findByState(
    inboxViewModels.items,
    "prepared_waiting_for_codex_return",
  );
  assert.equal(
    preparedInbox.item_id,
    "local-adapter-prepared-waiting-for-codex-return",
  );
  assert.equal(preparedInbox.title, "Prepared, waiting for Codex return");
  assert.equal(preparedInbox.reviewability, "waiting");
  assert.equal(preparedInbox.stage, "prepared_waiting_for_codex_return");
  assert.equal(preparedInbox.candidate_count, 0);
  assert.equal(preparedInbox.blocked_reason_count, 0);
  assert(preparedInbox.badges.length <= 2);
  assert(preparedInbox.compact_authority_tags.length <= 3);
  assert.equal(
    preparedInbox.safe_links.constellation_preview.available,
    false,
  );
  assert.equal(preparedInbox.safe_links.constellation_preview.href, null);
  assert.equal(preparedInbox.source_snapshot_path, inboxPreparedFixtureFile);
  assert.equal(preparedInbox.source_snapshot_hash, hashText(inboxPreparedText));
  assert.equal(
    Object.prototype.hasOwnProperty.call(preparedInbox, "review_candidate"),
    false,
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(preparedInbox, "worker_guidance"),
    false,
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      inboxViewModels.selected_item_summary,
      "review_candidate_available",
    ),
    false,
  );
  assert.deepEqual(
    inboxViewModels.selected_item_summary.summary_lines,
    [
      "No returned candidate has been captured.",
      "Validation has not run.",
      "No graph handoff is available for the prepared state.",
      "No review candidate exists.",
    ],
  );

  assert.equal(
    readiness.readiness_version,
    CODEX_FORMER_LOCAL_ADAPTER_SNAPSHOT_SURFACE_INTEGRATION_READINESS_VERSION,
  );
  assert.equal(readiness.status, "ready_for_ui_implementation");
  assert.equal(readiness.browser_validation_required_for_next_ui_pr, true);
  assert.deepEqual(readiness.scenario_coverage, [
    "not_ready",
    "waiting",
    "prepared_waiting_for_codex_return",
  ]);
  assert.deepEqual(readiness.blockers, []);
  assert.equal(readiness.prepared_operational_provenance.prepare_helper_executed, true);
  assert.equal(
    readiness.prepared_operational_provenance.operational_provenance_only,
    true,
  );
  for (const [key, value] of Object.entries(readiness.authority_flags)) {
    assert.equal(value, false, `readiness authority flag ${key} must be false`);
  }

  assertReadinessMatrix(readiness.next_ui_pr_browser_validation_matrix);
  assertNoForbiddenControlCopy(sessionViewModels);
  assertNoForbiddenControlCopy(inboxViewModels);
  assertNoLeakedDecisionStates(`${sessionViewModelsText}\n${inboxViewModelsText}`);
  assertFalseEverywhere(sessionViewModels, [
    "accepted_state",
    "accepted_state_created",
    "review_decision_created",
    "validate_helper_executed",
    "surface_export_created",
    "network_calls",
    "provider_model_calls",
    "codex_sdk_calls",
    "github_api_calls",
    "db_writes",
    "clipboard_automation",
  ]);
  assertFalseEverywhere(inboxViewModels, [
    "accepted_state",
    "accepted_state_created",
    "review_decision_created",
    "validate_helper_executed",
    "surface_export_created",
    "network_calls",
    "provider_model_calls",
    "codex_sdk_calls",
    "github_api_calls",
    "db_writes",
    "clipboard_automation",
  ]);
  assertFalseEverywhere(readiness, Object.keys(readiness.authority_flags));
}

function runInputRejectionCoverage() {
  mkdirSync(rejectionDir, { recursive: true });

  assertIncludesAll(expectCliFailure(["--banana", "value"]), [
    "unknown option: --banana",
  ]);
  assertIncludesAll(
    expectCliFailure(["--session-prepared"]),
    ["option --session-prepared requires a value"],
  );
  assertIncludesAll(
    expectCliFailure([
      ...baseCliArgs({ outDir: join(rejectionDir, "dup") }),
      "--session-prepared",
      sessionPreparedFixtureFile,
    ]),
    ["duplicate option: --session-prepared"],
  );
  assertIncludesAll(
    expectCliFailure([
      ...baseCliArgs({
        outDir: join(rejectionDir, "collision"),
        sessionViewModelsOut: join(rejectionDir, "collision.json"),
        inboxViewModelsOut: join(rejectionDir, "collision.json"),
      }),
    ]),
    ["output paths must be distinct"],
  );
  assertIncludesAll(
    expectCliFailure(
      baseCliArgs({
        outDir: join(rejectionDir, "session-dir"),
        sessionPrepared: rejectionDir,
      }),
    ),
    ["session prepared snapshot path must not be a directory"],
  );
  assertIncludesAll(
    expectCliFailure(
      baseCliArgs({
        outDir: join(rejectionDir, "missing-session"),
        sessionPrepared: join(rejectionDir, "missing-session.json"),
      }),
    ),
    ["session prepared snapshot file does not exist"],
  );
  assertIncludesAll(
    expectCliFailure(
      baseCliArgs({
        outDir: join(rejectionDir, "missing-inbox"),
        inboxPrepared: join(rejectionDir, "missing-inbox.json"),
      }),
    ),
    ["inbox prepared snapshot file does not exist"],
  );

  writeFileSync(join(rejectionDir, "invalid-json.json"), "{ nope", "utf8");
  assertIncludesAll(
    expectCliFailure(
      baseCliArgs({
        outDir: join(rejectionDir, "invalid-json"),
        sessionPrepared: join(rejectionDir, "invalid-json.json"),
      }),
    ),
    ["session prepared snapshot file is not valid JSON"],
  );

  assertSnapshotFailure(
    "unsupported-session-version",
    "sessionPrepared",
    { snapshot_version: "unsupported" },
    "unsupported session snapshot version",
  );
  assertSnapshotFailure(
    "unsupported-inbox-version",
    "inboxPrepared",
    { snapshot_version: "unsupported" },
    "unsupported inbox snapshot version",
  );
  assertSnapshotFailure(
    "prepared-session-scenario-mismatch",
    "sessionPrepared",
    { scenario_id: "waiting-for-candidate" },
    "session scenario_id mismatch",
  );
  assertSnapshotFailure(
    "prepared-inbox-stage-mismatch",
    "inboxPrepared",
    { stage: "waiting" },
    "prepared inbox stage mismatch",
  );
  assertSnapshotFailure(
    "prepared-inbox-reviewability-drift",
    "inboxPrepared",
    { reviewability: "not_ready" },
    "prepared inbox reviewability must remain waiting",
  );
  assertSnapshotFailure(
    "candidate-count-drift",
    "inboxPrepared",
    { candidate_count: 1 },
    "candidate_count must be 0",
  );
  assertSnapshotFailure(
    "accepted-state-drift",
    "sessionPrepared",
    { accepted_state: true },
    "accepted_state must be false",
  );
  assertSnapshotFailure(
    "review-only-drift",
    "inboxPrepared",
    { review_only: false },
    "must be review_only",
  );
  assertSnapshotFailure(
    "validate-helper-drift",
    "inboxPrepared",
    {
      authority_flags: {
        ...inboxPrepared.authority_flags,
        validate_helper_executed: true,
      },
    },
    "validate_helper_executed must be false",
  );
  assertSnapshotFailure(
    "review-decision-drift",
    "inboxPrepared",
    {
      authority_flags: {
        ...inboxPrepared.authority_flags,
        review_decision_created: true,
      },
    },
    "review_decision_created must be false",
  );
  assertSnapshotFailure(
    "accepted-state-created-drift",
    "sessionPrepared",
    {
      authority: {
        ...sessionPrepared.authority,
        flags: {
          ...sessionPrepared.authority.flags,
          accepted_state_created: true,
        },
      },
    },
    "accepted_state_created must be false",
  );
  assertSnapshotFailure(
    "surface-export-drift",
    "inboxPrepared",
    {
      authority_flags: {
        ...inboxPrepared.authority_flags,
        surface_export_created: true,
      },
    },
    "surface_export_created must be false",
  );
  assertSnapshotFailure(
    "constellation-handoff-drift",
    "inboxPrepared",
    {
      safe_links: {
        ...inboxPrepared.safe_links,
        constellation_preview: {
          ...inboxPrepared.safe_links.constellation_preview,
          available: true,
        },
      },
    },
    "must not expose Constellation handoff",
  );
  assertSnapshotFailure(
    "pass-leakage",
    "sessionPrepared",
    { caveat_label: "PASS" },
    "leaks PASS",
  );
  assertSnapshotFailure(
    "blocked-leakage",
    "inboxPrepared",
    { caveat: "BLOCKED" },
    "leaks BLOCKED",
  );
  assertSnapshotFailure(
    "raw-prompt-leakage",
    "sessionPrepared",
    {
      evidence: {
        ...sessionPrepared.evidence,
        raw_prompt_text: "omitted",
      },
    },
    "raw prompt/source/packet content",
  );
  assertSnapshotFailure(
    "badge-limit-drift",
    "inboxPrepared",
    { badges: ["prepared", "waiting", "review_only"] },
    "badges exceed max two",
  );

  const unsafeMarker = ["access", "token"].join("_");
  const unsafePath = writeMutatedSnapshot(
    "unsafe-marker",
    "inboxPrepared",
    { title: unsafeMarker },
  );
  const unsafeOutput = expectCliFailure(
    baseCliArgs({
      outDir: join(rejectionDir, "unsafe-marker-out"),
      inboxPrepared: unsafePath,
    }),
  );
  assertIncludesAll(unsafeOutput, ["unsafe marker category"]);
  assert.equal(
    unsafeOutput.includes(unsafeMarker),
    false,
    "unsafe marker value must not be echoed",
  );
}

function runOutputShapeRejectionCoverage() {
  expectShapeFailure(
    () =>
      assertSurfaceOutputShape(
        sessionViewModels,
        deepMerge(inboxViewModels, {
          items: inboxViewModels.items.map((item) =>
            item.snapshot_state === "prepared_waiting_for_codex_return"
              ? { ...item, compact_authority_tags: ["a", "b", "c", "d"] }
              : item,
          ),
        }),
        readiness,
      ),
    "compact authority tags",
  );
  expectShapeFailure(
    () =>
      assertSurfaceOutputShape(
        sessionViewModels,
        deepMerge(inboxViewModels, {
          items: inboxViewModels.items.map((item) =>
            item.snapshot_state === "prepared_waiting_for_codex_return"
              ? { ...item, badges: ["prepared", "waiting", "extra"] }
              : item,
          ),
        }),
        readiness,
      ),
    "badges",
  );
  expectShapeFailure(
    () =>
      assertSurfaceOutputShape(
        sessionViewModels,
        inboxViewModels,
        { ...readiness, next_ui_pr_browser_validation_matrix: [] },
      ),
    "browser validation matrix",
  );
}

function assertDocsAndReport() {
  assertIncludesAll(docText, [
    "Purpose",
    "Why Follows PR #518",
    "UI Implementation Readiness Scope",
    "Inputs",
    "Session Panel View-Model Contract",
    "Capture Review Inbox View-Model Contract",
    "Integration Readiness Summary",
    "CLI Usage",
    "Copy and Density Policy",
    "Accessibility Plan",
    "Browser/Computer-Use Validation Plan For Next UI PR",
    "Validation and Rejection Behavior",
    "Deterministic Fixtures",
    "Privacy / Redaction Boundary",
    "Authority Boundary",
    "What This Does Not Do",
    "Implement read-only adapter snapshot fixture surface integration",
    "Browser-validate adapter snapshot UI",
    "Design validate orchestration mode",
    "PASS/BLOCKED validate-summary modeling",
    "PASS with follow-up",
    "no UI implementation",
    "no routes",
    "no components",
    "no CSS",
    "no browser-visible surface",
    "no validate helper",
    "no Codex call",
    "no Codex SDK",
    "no provider/model API",
    "no GitHub API",
    "no network",
    "no DB",
    "no persistence",
    "no clipboard automation",
    "no accepted state",
    "no review decision",
    "no surface export to runtime/product state",
    "operational provenance only",
  ]);
  assertIncludesAll(reportText, [
    "Summary",
    "Why Follows PR #518",
    "Implementation Scope",
    "Inputs",
    "Session Panel Surface View-Models",
    "Capture Review Inbox Surface View-Models",
    "Integration Readiness Summary",
    "CLI Usage",
    "Copy and Density Policy",
    "Accessibility Plan",
    "Browser/Computer-Use Validation Plan",
    "Validation and Rejection Coverage",
    "Deterministic Fixtures",
    "Privacy/Redaction Handling",
    "Authority Boundary",
    "Verification",
    "Skipped Checks With Reasons",
    "Recommended Next PR",
    "What Codex Did Not Do",
    "no UI, route, browser-visible surface, clipboard automation, or browser/computer-use capture",
  ]);
}

function assertNoRawUnsafeMarkersInPublicArtifacts() {
  const publicText = [
    docText,
    reportText,
    sessionViewModelsText,
    inboxViewModelsText,
    readinessText,
  ].join("\n");
  for (const marker of [
    ["hidden", "reasoning"].join("_"),
    ["raw", "page", "dump"].join("_"),
    ["raw", "pr", "diff"].join("_"),
    ["raw", "review", "payload"].join("_"),
    ["access", "token"].join("_"),
    ["refresh", "token"].join("_"),
    ["api", "key"].join("_"),
    ["oauth", "token"].join("_"),
    ["sk", "proj"].join("-") + "-",
    ["gh", "p_"].join(""),
  ]) {
    assert.equal(
      publicText.includes(marker),
      false,
      `public docs/reports/fixtures must not echo raw unsafe marker ${marker}`,
    );
  }
}

function assertNoForbiddenImplementationSurfaces() {
  const runtimeText = `${libText}\n${cliText}`;
  for (const snippet of [
    ["fetch", "("].join(""),
    "XMLHttpRequest",
    ["responses", "create"].join("."),
    ["openai", "chat"].join("."),
    ["navigator", "clipboard"].join("."),
    ["better", "sqlite3"].join("-"),
    "sqlite",
    ["createClient", "("].join(""),
    ["graphql", "("].join(""),
    "recordProof",
    "createEvidence",
    "commitStateUpdate",
    "perspective:codex-former:capture-packet",
    "perspective:codex-former:validate-capture",
    "from \"react\"",
    "from 'react'",
    "react/jsx",
  ]) {
    assert.equal(
      runtimeText.includes(snippet),
      false,
      `runtime implementation must not introduce forbidden surface ${snippet}`,
    );
  }
  assertIncludesAll(`${docText}\n${reportText}\n${smokeFile}`, [
    "no UI",
    "no route",
    "no accepted",
    "no provider/model",
    "no Codex SDK",
    "no GitHub",
    "no network",
    "no DB",
    "no clipboard",
    "no validate helper",
    "no review decision",
    "no persistence",
  ]);
}

function assertChangedFileBoundary() {
  const allowedChangedFiles = new Set([
    packageFile,
    libFile,
    cliFile,
    smokeFile,
    surfaceSnapshotsSmokeFile,
    prepareOutputSnapshotsSmokeFile,
    docFile,
    reportFile,
    sessionViewModelsFixtureFile,
    inboxViewModelsFixtureFile,
    readinessFixtureFile,
  ]);
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `snapshot surface integration changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      changedFile === packageFile ||
        changedFile.startsWith("lib/perspective-ingest/") ||
        changedFile.startsWith("scripts/") ||
        changedFile.startsWith("docs/") ||
        changedFile.startsWith("reports/"),
      `snapshot surface integration must stay lib/scripts/docs/report/fixtures/package only: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/") &&
        !changedFile.startsWith("components/") &&
        !changedFile.endsWith(".css") &&
        !changedFile.startsWith("db/") &&
        !changedFile.startsWith("migrations/") &&
        !changedFile.startsWith("apps/augnes_apps/"),
      `snapshot surface integration must not touch UI, DB, app, component, CSS, or schema surfaces: ${changedFile}`,
    );
  }
}

function assertSurfaceOutputShape(sessionCollection, inboxCollection, readinessSummary) {
  assert.equal(sessionCollection.scenarios.length, 3);
  assert.equal(inboxCollection.items.length, 3);
  for (const scenario of sessionCollection.scenarios) {
    assert.equal(scenario.review_only, true);
    assert.equal(scenario.accepted_state, false);
    assert.equal(scenario.handoff_status.constellation_available, false);
    assert.equal(scenario.handoff_status.validation_available, false);
    assert.equal(scenario.handoff_status.returned_candidate_available, false);
    assert.equal(scenario.privacy_summary.raw_payloads_included, false);
    assert.equal(
      scenario.privacy_summary.no_raw_prompt_source_or_packet_content,
      true,
    );
  }
  for (const item of inboxCollection.items) {
    assert.equal(item.candidate_count, 0);
    assert.equal(item.blocked_reason_count, 0);
    assert(
      item.badges.length <= 2,
      `inbox item badges exceed max two: ${item.item_id}`,
    );
    assert(
      item.compact_authority_tags.length <= 3,
      `inbox item compact authority tags exceed max three: ${item.item_id}`,
    );
    assert.equal(item.safe_links.constellation_preview.available, false);
    assert.equal(item.safe_links.constellation_preview.href, null);
    assert.equal(item.privacy_summary.raw_payloads_included, false);
    assert.equal(item.privacy_summary.no_raw_prompt_source_or_packet_content, true);
  }
  assert.equal(inboxCollection.counts.reviewable, 0);
  assert.equal(inboxCollection.counts.blocked, 0);
  assert.equal(readinessSummary.browser_validation_required_for_next_ui_pr, true);
  assert(
    Array.isArray(readinessSummary.next_ui_pr_browser_validation_matrix) &&
      readinessSummary.next_ui_pr_browser_validation_matrix.length >= 10,
    "readiness must include browser validation matrix",
  );
  assertReadinessMatrix(readinessSummary.next_ui_pr_browser_validation_matrix);
}

function assertReadinessMatrix(matrix) {
  assertIncludesAll(matrix.join("\n"), [
    "render session panel not_ready",
    "render session panel waiting",
    "render session panel prepared",
    "render inbox all",
    "render inbox not_ready filter",
    "render inbox waiting filter",
    "render inbox prepared filter",
    "select prepared item",
    "verify no accepted-state implication",
    "verify no Constellation handoff for prepared",
    "verify no raw prompt/source/packet content",
    "verify keyboard navigation",
    "verify 390px no horizontal overflow",
  ]);
}

function assertNoForbiddenControlCopy(value) {
  const strings = collectStrings(value);
  const forbidden = [
    "Accept",
    "Approve",
    "Promote",
    "Reject",
    "Merge",
    "Deploy",
    "Validate",
    "Run Codex",
  ];
  for (const text of strings) {
    assert(
      !forbidden.includes(text),
      `view-model must not include forbidden control copy: ${text}`,
    );
  }
}

function assertNoLeakedDecisionStates(text) {
  for (const snippet of [
    "PASS",
    "BLOCKED",
    "pass-with-follow-up",
    "reviewable_with_follow_up",
    "worker_guidance",
    "\"review_candidate\"",
  ]) {
    assert.equal(
      text.includes(snippet),
      false,
      `view-model fixtures must not leak ${snippet}`,
    );
  }
}

function assertFalseEverywhere(value, keys) {
  visit(value, (node) => {
    if (!isRecord(node)) return;
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(node, key)) {
        assert.equal(node[key], false, `${key} must be false`);
      }
    }
  });
}

function buildInput() {
  return {
    generatedAt,
    sessionViewModelsPath: deterministicSessionOut,
    inboxViewModelsPath: deterministicInboxOut,
    readinessPath: deterministicReadinessOut,
    sessionSnapshots: {
      notReady: readSnapshotSource(sessionNotReadyFixtureFile),
      waiting: readSnapshotSource(sessionWaitingFixtureFile),
      prepared: readSnapshotSource(sessionPreparedFixtureFile),
    },
    inboxSnapshots: {
      notReady: readSnapshotSource(inboxNotReadyFixtureFile),
      waiting: readSnapshotSource(inboxWaitingFixtureFile),
      prepared: readSnapshotSource(inboxPreparedFixtureFile),
    },
  };
}

function readSnapshotSource(path) {
  const text = readFileSync(path, "utf8");
  return {
    path,
    hash: hashLocalAdapterSurfaceIntegrationContent(text),
    snapshot: JSON.parse(text),
  };
}

function assertSnapshotFailure(name, kind, patch, expected) {
  const path = writeMutatedSnapshot(name, kind, patch);
  const output = expectCliFailure(
    baseCliArgs({
      outDir: join(rejectionDir, `${name}-out`),
      [kind]: path,
    }),
  );
  assertIncludesAll(output, [expected]);
}

function writeMutatedSnapshot(name, kind, patch) {
  const sourceByKind = {
    sessionPrepared,
    inboxPrepared,
  };
  const path = join(rejectionDir, `${name}.json`);
  writeJson(path, deepMerge(sourceByKind[kind], patch));
  return path;
}

function baseCliArgs(overrides = {}) {
  const outDir = overrides.outDir ?? join(rejectionDir, "out");
  const args = [
    "--session-not-ready",
    overrides.sessionNotReady ?? sessionNotReadyFixtureFile,
    "--session-waiting",
    overrides.sessionWaiting ?? sessionWaitingFixtureFile,
    "--session-prepared",
    overrides.sessionPrepared ?? sessionPreparedFixtureFile,
    "--inbox-not-ready",
    overrides.inboxNotReady ?? inboxNotReadyFixtureFile,
    "--inbox-waiting",
    overrides.inboxWaiting ?? inboxWaitingFixtureFile,
    "--inbox-prepared",
    overrides.inboxPrepared ?? inboxPreparedFixtureFile,
    "--out-dir",
    outDir,
    "--generated-at",
    generatedAt,
  ];
  if (overrides.sessionViewModelsOut) {
    args.push("--session-view-models-out", overrides.sessionViewModelsOut);
  }
  if (overrides.inboxViewModelsOut) {
    args.push("--inbox-view-models-out", overrides.inboxViewModelsOut);
  }
  if (overrides.readinessOut) {
    args.push("--readiness-out", overrides.readinessOut);
  }
  return args;
}

function runCli(args) {
  return execFileSync(
    "npm",
    [
      "run",
      "perspective:codex-former:local-adapter:surface-integration",
      "--",
      ...args,
    ],
    { encoding: "utf8" },
  );
}

function expectCliFailure(args) {
  try {
    runCli(args);
  } catch (error) {
    return `${error.stdout ?? ""}${error.stderr ?? ""}`;
  }
  assert.fail(`expected CLI failure for ${args.join(" ")}`);
}

function expectShapeFailure(callback, expected) {
  try {
    callback();
  } catch (error) {
    assertIncludesAll(error instanceof Error ? error.message : String(error), [
      expected,
    ]);
    return;
  }
  assert.fail(`expected output shape failure containing ${expected}`);
}

function findByState(items, state) {
  const item = items.find((candidate) => candidate.snapshot_state === state);
  assert(item, `expected state ${state}`);
  return item;
}

function writeJson(path, value) {
  writeFileSync(
    path,
    stableStringifyLocalAdapterSurfaceIntegrationJson(value),
    "utf8",
  );
}

function deepMerge(base, patch) {
  if (!isRecord(base) || !isRecord(patch)) return patch;
  const result = clone(base);
  for (const [key, value] of Object.entries(patch)) {
    if (
      isRecord(value) &&
      isRecord(result[key]) &&
      !Array.isArray(value) &&
      !Array.isArray(result[key])
    ) {
      result[key] = deepMerge(result[key], value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function collectStrings(value) {
  const strings = [];
  visit(value, (node) => {
    if (typeof node === "string") strings.push(node);
  });
  return strings;
}

function visit(value, callback) {
  callback(value);
  if (Array.isArray(value)) {
    for (const item of value) visit(item, callback);
  } else if (isRecord(value)) {
    for (const item of Object.values(value)) visit(item, callback);
  }
}

function collectChangedFiles() {
  const tracked = execFileSync("git", ["diff", "--name-only", "HEAD"], {
    encoding: "utf8",
  })
    .split("\n")
    .filter(Boolean);
  const untracked = execFileSync(
    "git",
    ["ls-files", "--others", "--exclude-standard"],
    { encoding: "utf8" },
  )
    .split("\n")
    .filter(Boolean)
    .filter((file) => existsSync(file) && !statSync(file).isDirectory());
  return [...new Set([...tracked, ...untracked])].sort();
}

function assertIncludesAll(text, snippets) {
  const normalizedText = normalizeText(text);
  for (const snippet of snippets) {
    assert(
      normalizedText.includes(normalizeText(snippet)),
      `expected text to include ${JSON.stringify(snippet)}`,
    );
  }
}

function normalizeText(value) {
  return String(value).replace(/\s+/g, " ").trim();
}

function isRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function hashText(text) {
  return hashLocalAdapterSurfaceIntegrationContent(text);
}
