import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const packageFile = "package.json";
const libFile =
  "lib/perspective-ingest/codex-former-local-adapter-surface-snapshots.ts";
const cliFile =
  "scripts/perspective-codex-former-local-adapter-surface-snapshots.mjs";
const existingSmokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-surface-snapshots.mjs";
const prepareExecutionSmokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-prepare-execution.mjs";
const prepareExecutionHardeningSmokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-prepare-execution-hardening.mjs";
const smokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-prepare-output-snapshots.mjs";
const docFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_PREPARE_OUTPUT_SNAPSHOTS_V0_1.md";
const reportFile =
  "reports/2026-06-11-perspective-codex-former-local-adapter-prepare-output-snapshots.md";
const manifestFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-manifest-valid.json";
const sourceInputFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-source-input.json";
const preflightSummaryFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-source-input-preflight-summary.json";
const prepareExecutionSummaryFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-prepare-execution-summary-success.json";
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
const preparedSummaryFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-prepare-output-snapshot-summary.json";
const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";

const generatedAt = "2026-06-11T00:00:00.000Z";
const tmpRoot =
  "/tmp/augnes-codex-former-local-adapter-prepare-output-snapshots-smoke";
const preparedOutDir =
  "/tmp/augnes-codex-former-local-adapter-prepare-output-snapshots";
const notReadyOutDir = join(tmpRoot, "not-ready");
const waitingOutDir = join(tmpRoot, "waiting");
const rejectionDir = join(tmpRoot, "rejections");

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const libText = readFileSync(libFile, "utf8");
const cliText = readFileSync(cliFile, "utf8");
const smokeText = readFileSync(smokeFile, "utf8");
const existingSmokeText = readFileSync(existingSmokeFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");
const manifestText = readFileSync(manifestFixtureFile, "utf8");
const sourceInputText = readFileSync(sourceInputFixtureFile, "utf8");
const preflightSummaryText = readFileSync(preflightSummaryFixtureFile, "utf8");
const prepareExecutionSummaryText = readFileSync(
  prepareExecutionSummaryFixtureFile,
  "utf8",
);
const prepareExecutionSummary = JSON.parse(prepareExecutionSummaryText);
const sessionNotReadyText = readFileSync(sessionNotReadyFixtureFile, "utf8");
const sessionWaitingText = readFileSync(sessionWaitingFixtureFile, "utf8");
const sessionPreparedText = readFileSync(sessionPreparedFixtureFile, "utf8");
const inboxNotReadyText = readFileSync(inboxNotReadyFixtureFile, "utf8");
const inboxWaitingText = readFileSync(inboxWaitingFixtureFile, "utf8");
const inboxPreparedText = readFileSync(inboxPreparedFixtureFile, "utf8");
const preparedSummaryText = readFileSync(preparedSummaryFixtureFile, "utf8");
const sessionPrepared = JSON.parse(sessionPreparedText);
const inboxPrepared = JSON.parse(inboxPreparedText);
const preparedSummary = JSON.parse(preparedSummaryText);

assertPackageScripts();
assertFilesExist();
assertSourceContracts();
runPreparedGeneration();
runExistingStateGeneration();
assertPreparedSnapshotShape();
runPrepareSummaryRejections();
assertDocsAndReport();
assertNoRawUnsafeMarkersInPublicArtifacts();
assertNoForbiddenImplementationSurfaces();
assertChangedFileBoundary();

console.log(
  "PASS smoke:perspective-codex-former-local-adapter-prepare-output-snapshots",
);

function assertPackageScripts() {
  assert.equal(
    packageJson.scripts["perspective:codex-former:local-adapter:snapshots"],
    `${expectedTsxCommand} ${cliFile}`,
  );
  assert.equal(
    packageJson.scripts[
      "smoke:perspective-codex-former-local-adapter-prepare-output-snapshots"
    ],
    `${expectedTsxCommand} ${smokeFile}`,
  );
}

function assertFilesExist() {
  for (const file of [
    packageFile,
    libFile,
    cliFile,
    existingSmokeFile,
    prepareExecutionSmokeFile,
    prepareExecutionHardeningSmokeFile,
    smokeFile,
    docFile,
    reportFile,
    manifestFixtureFile,
    sourceInputFixtureFile,
    preflightSummaryFixtureFile,
    prepareExecutionSummaryFixtureFile,
    sessionNotReadyFixtureFile,
    sessionWaitingFixtureFile,
    sessionPreparedFixtureFile,
    inboxNotReadyFixtureFile,
    inboxWaitingFixtureFile,
    inboxPreparedFixtureFile,
    preparedSummaryFixtureFile,
  ]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }
}

function assertSourceContracts() {
  assertIncludesAll(libText, [
    "prepared_waiting_for_codex_return",
    "prepared-waiting-for-codex-return",
    "validatePrepareExecutionSummaryForSnapshots",
    "buildPrepareOutputEvidence",
    "prepare_execution_summary_hash",
    "prepare_helper_executed",
    "validate_helper_executed",
    "operational_provenance_only",
  ]);
  assertIncludesAll(cliText, [
    "prepare-execution-summary",
    "readPrepareExecutionSummary",
    "prepare_execution_summary_hash=",
    "local-adapter-surface-snapshots",
  ]);
}

function runPreparedGeneration() {
  rmSync(preparedOutDir, { recursive: true, force: true });
  const stdout = runCli([
    "--manifest",
    manifestFixtureFile,
    "--source-input",
    sourceInputFixtureFile,
    "--preflight-summary",
    preflightSummaryFixtureFile,
    "--prepare-execution-summary",
    prepareExecutionSummaryFixtureFile,
    "--out-dir",
    preparedOutDir,
    "--generated-at",
    generatedAt,
  ]);
  assertIncludesAll(stdout, [
    "mode=local-adapter-surface-snapshots",
    "snapshot_state=prepared_waiting_for_codex_return",
    `manifest_hash=${hashText(manifestText)}`,
    `source_input_hash=${hashText(sourceInputText)}`,
    `prepare_execution_summary_hash=${hashText(prepareExecutionSummaryText)}`,
    "authority_boundary=review-only local-only non-authorizing",
  ]);
  assert.equal(
    readFileSync(
      join(preparedOutDir, "codex-former-local-adapter-session-panel-snapshot.json"),
      "utf8",
    ),
    sessionPreparedText,
    "prepared session snapshot must match committed fixture",
  );
  assert.equal(
    readFileSync(
      join(preparedOutDir, "codex-former-local-adapter-inbox-item-snapshot.json"),
      "utf8",
    ),
    inboxPreparedText,
    "prepared inbox item snapshot must match committed fixture",
  );
  assert.equal(
    readFileSync(
      join(preparedOutDir, "codex-former-local-adapter-snapshot-summary.json"),
      "utf8",
    ),
    preparedSummaryText,
    "prepared snapshot summary must match committed fixture",
  );
}

function runExistingStateGeneration() {
  rmSync(tmpRoot, { recursive: true, force: true });
  mkdirSync(notReadyOutDir, { recursive: true });
  mkdirSync(waitingOutDir, { recursive: true });

  runCli([
    "--manifest",
    manifestFixtureFile,
    "--out-dir",
    notReadyOutDir,
    "--generated-at",
    generatedAt,
  ]);
  assert.equal(
    readFileSync(
      join(notReadyOutDir, "codex-former-local-adapter-session-panel-snapshot.json"),
      "utf8",
    ),
    sessionNotReadyText,
  );
  assert.equal(
    readFileSync(
      join(notReadyOutDir, "codex-former-local-adapter-inbox-item-snapshot.json"),
      "utf8",
    ),
    inboxNotReadyText,
  );

  const waitingStdout = runCli([
    "--manifest",
    manifestFixtureFile,
    "--source-input",
    sourceInputFixtureFile,
    "--preflight-summary",
    preflightSummaryFixtureFile,
    "--out-dir",
    waitingOutDir,
    "--generated-at",
    generatedAt,
  ]);
  assertIncludesAll(waitingStdout, ["snapshot_state=waiting"]);
  assert.equal(
    readFileSync(
      join(waitingOutDir, "codex-former-local-adapter-session-panel-snapshot.json"),
      "utf8",
    ),
    sessionWaitingText,
  );
  assert.equal(
    readFileSync(
      join(waitingOutDir, "codex-former-local-adapter-inbox-item-snapshot.json"),
      "utf8",
    ),
    inboxWaitingText,
  );
}

function assertPreparedSnapshotShape() {
  assert.equal(sessionPrepared.snapshot_kind, "session_panel");
  assert.equal(
    sessionPrepared.scenario_id,
    "prepared-waiting-for-codex-return",
  );
  assert.equal(
    sessionPrepared.primary_status_label,
    "Prepared, waiting for Codex return",
  );
  assert.equal(sessionPrepared.review_only, true);
  assert.equal(sessionPrepared.accepted_state, false);
  assert.equal(
    sessionPrepared.evidence.prepare_execution.prepare_execution_summary_hash,
    hashText(prepareExecutionSummaryText),
  );
  assert.equal(
    sessionPrepared.evidence.prepare_execution.prepare_helper_executed,
    true,
  );
  assert.equal(
    sessionPrepared.evidence.prepare_execution.validate_helper_executed,
    false,
  );
  assert(
    sessionPrepared.timeline.some(
      (step) => step.id === "prepare-execution" && step.status === "complete",
    ),
  );
  assert(
    sessionPrepared.timeline.some(
      (step) => step.id === "returned-candidate" && step.status === "waiting",
    ),
  );
  assert(
    sessionPrepared.timeline.some(
      (step) => step.id === "validation" && step.status === "not_started",
    ),
  );
  assert(
    sessionPrepared.timeline.some(
      (step) =>
        step.id === "constellation-handoff" && step.status === "not_started",
    ),
  );
  assert.equal(sessionPrepared.handoff.available, false);
  assert.equal(sessionPrepared.handoff.href, null);

  assert.equal(inboxPrepared.snapshot_kind, "capture_review_inbox_item");
  assert.equal(
    inboxPrepared.item_id,
    "local-adapter-prepared-waiting-for-codex-return",
  );
  assert.equal(inboxPrepared.reviewability, "waiting");
  assert.equal(inboxPrepared.stage, "prepared_waiting_for_codex_return");
  assert.equal(inboxPrepared.candidate_count, 0);
  assert.equal(inboxPrepared.blocked_reason_count, 0);
  assert.deepEqual(inboxPrepared.badges, ["prepared", "waiting"]);
  assert.equal(inboxPrepared.evidence.prepare_execution_summary_hash, hashText(prepareExecutionSummaryText));
  assert.equal(inboxPrepared.safe_links.constellation_preview.available, false);
  assert.equal(inboxPrepared.safe_links.constellation_preview.href, null);
  assert.equal(Object.prototype.hasOwnProperty.call(inboxPrepared, "review_candidate"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(inboxPrepared, "worker_guidance"), false);
  assert.equal(JSON.stringify(inboxPrepared).includes("pass-with-follow-up"), false);
  assert.equal(JSON.stringify(inboxPrepared).includes("BLOCKED"), false);
  assert.equal(JSON.stringify(sessionPrepared).includes("PASS"), false);

  for (const evidence of [
    sessionPrepared.evidence.prepare_execution,
    inboxPrepared.evidence,
  ]) {
    assert.equal(evidence.output_discovery_status, "complete");
    assert.equal(evidence.execution_result, "success");
    assert.equal(evidence.helper_output_refs.manual_copy_packet_ref.length > 0, true);
    assert.equal(evidence.helper_output_refs.former_input_packet_ref.length > 0, true);
    assertSha(evidence.helper_output_hashes.prompt_hash);
    assertSha(evidence.helper_output_hashes.return_envelope_template_hash);
    assertSha(evidence.helper_output_hashes.helper_metadata_hash);
    assert(evidence.helper_output_sizes.prompt_size_bytes > 0);
    assert(evidence.helper_output_sizes.return_envelope_template_size_bytes > 0);
    assert(evidence.helper_output_sizes.helper_metadata_size_bytes > 0);
  }

  assert.equal(preparedSummary.snapshot_state, "prepared_waiting_for_codex_return");
  assert.equal(preparedSummary.prepare_helper_executed, true);
  assert.equal(preparedSummary.validate_helper_executed, false);
  assert.equal(preparedSummary.authority_flags.prepare_helper_executed, true);
  assert.equal(preparedSummary.authority_flags.validate_helper_executed, false);
  for (const key of [
    "accepted_state_created",
    "review_decision_created",
    "proof_evidence_readiness_created",
    "surface_export_created",
    "network_calls",
    "provider_model_calls",
    "codex_sdk_calls",
    "github_api_calls",
    "db_writes",
    "clipboard_automation",
  ]) {
    assert.equal(preparedSummary.authority_flags[key], false, `${key} must be false`);
  }
}

function runPrepareSummaryRejections() {
  mkdirSync(rejectionDir, { recursive: true });
  assertIncludesAll(
    expectCliFailure([
      "--manifest",
      manifestFixtureFile,
      "--source-input",
      sourceInputFixtureFile,
      "--preflight-summary",
      preflightSummaryFixtureFile,
      "--prepare-execution-summary",
      join(rejectionDir, "missing.json"),
      "--out-dir",
      rejectionDir,
    ]),
    ["prepare execution summary file does not exist"],
  );

  writeFileSync(join(rejectionDir, "invalid-json.json"), "{ nope", "utf8");
  assertPrepareSummaryFailure(
    join(rejectionDir, "invalid-json.json"),
    "prepare execution summary file is not valid JSON",
  );

  for (const [name, patch, expected] of [
    [
      "wrong-version",
      { prepare_execution_summary_version: "unsupported" },
      "prepare execution summary version is unsupported",
    ],
    ["wrong-mode", { mode: "unsupported" }, "prepare execution summary mode is unsupported"],
    ["helper-failed", { helper_exit_status: "failed" }, "helper_exit_status must be success"],
    ["helper-nonzero", { helper_exit_code: 17 }, "helper_exit_code must be 0"],
    ["incomplete", { output_discovery_status: "incomplete" }, "output_discovery_status must be complete"],
    ["not-success", { execution_result: "output_incomplete" }, "execution_result must be success"],
    ["failure-kind", { failure_kind: "output_discovery_incomplete" }, "failure_kind must be null"],
    [
      "source-hash-mismatch",
      { source_input_hash: "0".repeat(64) },
      "source_input_hash does not match source input bytes",
    ],
    [
      "preflight-hash-mismatch",
      { preflight_summary_hash: "0".repeat(64) },
      "preflight_summary_hash does not match preflight summary bytes",
    ],
    [
      "manifest-hash-mismatch",
      { manifest_hash: "0".repeat(64) },
      "manifest_hash does not match manifest bytes",
    ],
  ]) {
    const path = writeMutatedPrepareSummary(name, patch);
    assertPrepareSummaryFailure(path, expected);
  }

  assertPrepareSummaryFailure(
    writeMutatedPrepareSummary("prepare-helper-false", {
      authority_flags: {
        ...prepareExecutionSummary.authority_flags,
        prepare_helper_executed: false,
      },
    }),
    "prepare_helper_executed must be true",
  );
  assertPrepareSummaryFailure(
    writeMutatedPrepareSummary("validate-helper-true", {
      authority_flags: {
        ...prepareExecutionSummary.authority_flags,
        validate_helper_executed: true,
      },
    }),
    "authority_flags.validate_helper_executed must be false",
  );
  assertPrepareSummaryFailure(
    writeMutatedPrepareSummary("accepted-state-true", {
      authority_flags: {
        ...prepareExecutionSummary.authority_flags,
        accepted_state_created: true,
      },
    }),
    "authority_flags.accepted_state_created must be false",
  );
  assertPrepareSummaryFailure(
    writeMutatedPrepareSummary("review-decision-true", {
      authority_flags: {
        ...prepareExecutionSummary.authority_flags,
        review_decision_created: true,
      },
    }),
    "authority_flags.review_decision_created must be false",
  );
  assertPrepareSummaryFailure(
    writeMutatedPrepareSummary("missing-helper-hash", {
      helper_output_hashes: {
        ...prepareExecutionSummary.helper_output_hashes,
        prompt_hash: null,
      },
    }),
    "helper_output_hashes.prompt_hash must be a sha256 hash",
  );
  assertPrepareSummaryFailure(
    writeMutatedPrepareSummary("missing-helper-size", {
      helper_output_sizes: {
        ...prepareExecutionSummary.helper_output_sizes,
        prompt_size_bytes: null,
      },
    }),
    "helper_output_sizes.prompt_size_bytes must be a non-negative integer",
  );
  assertPrepareSummaryFailure(
    writeMutatedPrepareSummary("metadata-not-parsed", {
      helper_metadata_checks: {
        ...prepareExecutionSummary.helper_metadata_checks,
        metadata_parse_status: "missing",
      },
    }),
    "metadata_parse_status must be parsed",
  );
  assertPrepareSummaryFailure(
    writeMutatedPrepareSummary("metadata-source-mismatch", {
      helper_metadata_checks: {
        ...prepareExecutionSummary.helper_metadata_checks,
        source_input_hash_match: false,
      },
    }),
    "metadata source_input_hash_match must be true",
  );

  const unsafeMarker = ["access", "token"].join("_");
  const unsafePath = writeMutatedPrepareSummary("unsafe-marker", {
    helper_out_dir: unsafeMarker,
  });
  const unsafeOutput = expectPreparedCliFailure(unsafePath);
  assertIncludesAll(unsafeOutput, ["unsafe marker category"]);
  assert.equal(unsafeOutput.includes(unsafeMarker), false);

  assertIncludesAll(
    expectCliFailure([
      "--manifest",
      manifestFixtureFile,
      "--prepare-execution-summary",
      prepareExecutionSummaryFixtureFile,
      "--out-dir",
      rejectionDir,
    ]),
    ["sourceInput is required when prepareExecutionSummary is supplied"],
  );

  const collisionPath = join(rejectionDir, "collision.json");
  assertIncludesAll(
    expectCliFailure([
      "--manifest",
      manifestFixtureFile,
      "--source-input",
      sourceInputFixtureFile,
      "--preflight-summary",
      preflightSummaryFixtureFile,
      "--prepare-execution-summary",
      prepareExecutionSummaryFixtureFile,
      "--out-dir",
      rejectionDir,
      "--session-panel-out",
      collisionPath,
      "--summary-out",
      collisionPath,
    ]),
    ["output paths must be distinct"],
  );
}

function assertDocsAndReport() {
  assertIncludesAll(docText, [
    "Purpose",
    "Why Follows PR #517",
    "Implementation Scope",
    "Snapshot State",
    "Inputs",
    "Prepare Execution Summary Validation",
    "Session Panel Prepared Snapshot",
    "Inbox Prepared Snapshot",
    "Snapshot Summary",
    "CLI Usage",
    "Compatibility With Existing Fixture Surfaces",
    "Rejection Behavior",
    "Deterministic Fixtures",
    "Privacy / Redaction Boundary",
    "Authority Boundary",
    "What This Does Not Do",
    "Wire adapter snapshots into read-only Session Panel / Inbox fixture surfaces",
    "Design validate orchestration mode",
    "PASS/BLOCKED validate-summary modeling",
    "PASS with follow-up",
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
    "no surface export",
    "no UI/routes/browser surface",
    "operational provenance only",
    "still waiting for human-started Codex return",
  ]);
  assertIncludesAll(reportText, [
    "Summary",
    "Why Follows PR #517",
    "Implementation Scope",
    "Snapshot State",
    "Inputs",
    "Prepare Execution Summary Validation",
    "Session Panel Prepared Snapshot",
    "Inbox Prepared Snapshot",
    "CLI Usage",
    "Compatibility With Existing Surfaces",
    "Rejection Coverage",
    "Deterministic Fixtures",
    "Privacy/Redaction Handling",
    "Authority Boundary",
    "Verification",
    "Skipped Checks With Reasons",
    "Recommended Next PR",
    "What Codex Did Not Do",
  ]);
}

function assertNoRawUnsafeMarkersInPublicArtifacts() {
  const publicText = [
    docText,
    reportText,
    sessionPreparedText,
    inboxPreparedText,
    preparedSummaryText,
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
  ]) {
    assert.equal(
      runtimeText.includes(snippet),
      false,
      `runtime implementation must not introduce forbidden surface ${snippet}`,
    );
  }
  assertIncludesAll(`${docText}\n${reportText}\n${smokeText}`, [
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
  assert.equal(existingSmokeText.includes("prepared_waiting_for_codex_return"), true);
}

function assertChangedFileBoundary() {
  const allowedChangedFiles = new Set([
    packageFile,
    libFile,
    cliFile,
    existingSmokeFile,
    prepareExecutionSmokeFile,
    prepareExecutionHardeningSmokeFile,
    smokeFile,
    docFile,
    reportFile,
    sessionPreparedFixtureFile,
    inboxPreparedFixtureFile,
    preparedSummaryFixtureFile,
  ]);
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `prepare-output snapshots changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      changedFile === packageFile ||
        changedFile.startsWith("lib/perspective-ingest/") ||
        changedFile.startsWith("scripts/") ||
        changedFile.startsWith("docs/") ||
        changedFile.startsWith("reports/"),
      `prepare-output snapshots must stay lib/scripts/docs/report/fixtures/package only: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/") &&
        !changedFile.startsWith("components/") &&
        !changedFile.startsWith("db/") &&
        !changedFile.startsWith("migrations/") &&
        !changedFile.startsWith("apps/augnes_apps/"),
      `prepare-output snapshots must not touch UI, DB, app, component, or schema surfaces: ${changedFile}`,
    );
  }
}

function assertPrepareSummaryFailure(path, expected) {
  assertIncludesAll(expectPreparedCliFailure(path), [expected]);
}

function expectPreparedCliFailure(prepareExecutionSummaryPath) {
  return expectCliFailure([
    "--manifest",
    manifestFixtureFile,
    "--source-input",
    sourceInputFixtureFile,
    "--preflight-summary",
    preflightSummaryFixtureFile,
    "--prepare-execution-summary",
    prepareExecutionSummaryPath,
    "--out-dir",
    rejectionDir,
  ]);
}

function writeMutatedPrepareSummary(name, patch) {
  const path = join(rejectionDir, `${name}.json`);
  writeJson(path, deepMerge(prepareExecutionSummary, patch));
  return path;
}

function runCli(args) {
  return execFileSync(
    "npm",
    ["run", "perspective:codex-former:local-adapter:snapshots", "--", ...args],
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

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function deepMerge(base, patch) {
  const result = clone(base);
  for (const [key, value] of Object.entries(patch)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      result[key] &&
      typeof result[key] === "object" &&
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

function hashText(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function assertSha(value) {
  assert.equal(typeof value, "string");
  assert(/^[a-f0-9]{64}$/.test(value), `${value} must be sha256`);
}

function assertIncludesAll(text, snippets) {
  for (const snippet of snippets) {
    assert(
      text.includes(snippet),
      `expected text to include ${JSON.stringify(snippet)}`,
    );
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
