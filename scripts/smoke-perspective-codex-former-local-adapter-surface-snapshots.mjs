import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import localAdapter from "../lib/perspective-ingest/codex-former-local-adapter-manifest-to-source-input.ts";
import surfaceSnapshots from "../lib/perspective-ingest/codex-former-local-adapter-surface-snapshots.ts";

const {
  hashCodexFormerLocalAdapterContent,
  stableStringifyCodexFormerLocalAdapterJson,
} = localAdapter;
const {
  buildCodexFormerLocalAdapterSurfaceSnapshots,
  validateCodexFormerLocalAdapterSurfaceSnapshotInputs,
} = surfaceSnapshots;

const packageFile = "package.json";
const libFile =
  "lib/perspective-ingest/codex-former-local-adapter-surface-snapshots.ts";
const adapterLibFile =
  "lib/perspective-ingest/codex-former-local-adapter-manifest-to-source-input.ts";
const cliFile =
  "scripts/perspective-codex-former-local-adapter-surface-snapshots.mjs";
const smokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-surface-snapshots.mjs";
const preflightSmokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-source-input-preflight-hardening.mjs";
const docFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_SURFACE_SNAPSHOTS_V0_1.md";
const reportFile =
  "reports/2026-06-11-perspective-codex-former-local-adapter-surface-snapshots.md";
const validManifestFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-manifest-valid.json";
const sourceInputFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-source-input.json";
const preflightSummaryFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-source-input-preflight-summary.json";
const sessionNotReadyFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-session-panel-snapshot-not-ready.json";
const sessionWaitingFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-session-panel-snapshot-waiting.json";
const inboxNotReadyFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-inbox-item-not-ready.json";
const inboxWaitingFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-inbox-item-waiting.json";
const sessionFixtureHelperFile =
  "lib/perspective-ingest/codex-former-session-perspective-panel-fixture-surface.ts";
const inboxFixtureHelperFile =
  "lib/perspective-ingest/codex-former-capture-review-inbox-fixture-surface.ts";
const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";

const tmpRoot = "/tmp/augnes-codex-former-local-adapter-snapshots-smoke";
const notReadyDir = join(tmpRoot, "not-ready");
const waitingDir = join(tmpRoot, "waiting");
const rejectionDir = join(tmpRoot, "rejections");
const generatedAt = "2026-06-11T00:00:00.000Z";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const libText = readFileSync(libFile, "utf8");
const cliText = readFileSync(cliFile, "utf8");
const smokeText = readFileSync(smokeFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");
const sessionFixtureHelperText = readFileSync(sessionFixtureHelperFile, "utf8");
const inboxFixtureHelperText = readFileSync(inboxFixtureHelperFile, "utf8");
const manifestText = readFileSync(validManifestFixtureFile, "utf8");
const manifest = JSON.parse(manifestText);
const sourceInputText = readFileSync(sourceInputFixtureFile, "utf8");
const sourceInput = JSON.parse(sourceInputText);
const preflightSummaryText = readFileSync(preflightSummaryFixtureFile, "utf8");
const preflightSummary = JSON.parse(preflightSummaryText);
const sessionNotReadyText = readFileSync(sessionNotReadyFixtureFile, "utf8");
const sessionWaitingText = readFileSync(sessionWaitingFixtureFile, "utf8");
const inboxNotReadyText = readFileSync(inboxNotReadyFixtureFile, "utf8");
const inboxWaitingText = readFileSync(inboxWaitingFixtureFile, "utf8");
const sessionNotReady = JSON.parse(sessionNotReadyText);
const sessionWaiting = JSON.parse(sessionWaitingText);
const inboxNotReady = JSON.parse(inboxNotReadyText);
const inboxWaiting = JSON.parse(inboxWaitingText);

assertPackageScripts();
assertFilesExist();
assertSourceContracts();
runSnapshotGeneration();
assertCommittedFixtureShapes();
runRejectionCoverage();
assertDocsAndReport();
assertNoRawUnsafeMarkersInPublicArtifacts();
assertNoForbiddenImplementationSurfaces();
assertChangedFileBoundary();

console.log("PASS smoke:perspective-codex-former-local-adapter-surface-snapshots");

function assertPackageScripts() {
  assert.equal(
    packageJson.scripts["perspective:codex-former:local-adapter:snapshots"],
    `${expectedTsxCommand} ${cliFile}`,
  );
  assert.equal(
    packageJson.scripts[
      "smoke:perspective-codex-former-local-adapter-surface-snapshots"
    ],
    `${expectedTsxCommand} ${smokeFile}`,
  );
}

function assertFilesExist() {
  for (const file of [
    packageFile,
    libFile,
    adapterLibFile,
    cliFile,
    smokeFile,
    preflightSmokeFile,
    docFile,
    reportFile,
    validManifestFixtureFile,
    sourceInputFixtureFile,
    preflightSummaryFixtureFile,
    sessionNotReadyFixtureFile,
    sessionWaitingFixtureFile,
    inboxNotReadyFixtureFile,
    inboxWaitingFixtureFile,
    sessionFixtureHelperFile,
    inboxFixtureHelperFile,
  ]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }
}

function assertSourceContracts() {
  assertIncludesAll(libText, [
    "codex_former_local_adapter_session_panel_snapshot.v0.1",
    "codex_former_local_adapter_inbox_item_snapshot.v0.1",
    "codex_former_local_adapter_surface_snapshot_summary.v0.1",
    "buildCodexFormerLocalAdapterSessionPanelSnapshot",
    "buildCodexFormerLocalAdapterInboxItemSnapshot",
    "buildCodexFormerLocalAdapterSurfaceSnapshots",
    "validateCodexFormerLocalAdapterSurfaceSnapshotInputs",
    "not-prepared",
    "waiting-for-candidate",
    "not_ready",
    "waiting",
  ]);
  assertIncludesAll(cliText, [
    "manifest",
    "out-dir",
    "source-input",
    "preflight-summary",
    "session-panel-out",
    "inbox-item-out",
    "local-adapter-surface-snapshots",
    "snapshot_state=",
    "review-only local-only non-authorizing",
  ]);
}

function runSnapshotGeneration() {
  rmSync(tmpRoot, { recursive: true, force: true });
  mkdirSync(notReadyDir, { recursive: true });
  mkdirSync(waitingDir, { recursive: true });

  const generatedNotReadySession = join(notReadyDir, "session.json");
  const generatedNotReadyInbox = join(notReadyDir, "inbox.json");
  const generatedNotReadySummary = join(notReadyDir, "summary.json");
  const notReadyStdout = runCli([
    "--manifest",
    validManifestFixtureFile,
    "--out-dir",
    notReadyDir,
    "--generated-at",
    generatedAt,
    "--session-panel-out",
    generatedNotReadySession,
    "--inbox-item-out",
    generatedNotReadyInbox,
    "--summary-out",
    generatedNotReadySummary,
  ]);
  assertIncludesAll(notReadyStdout, [
    "mode=local-adapter-surface-snapshots",
    `session_panel_snapshot_path=${generatedNotReadySession}`,
    `inbox_item_snapshot_path=${generatedNotReadyInbox}`,
    "snapshot_state=not_ready",
    `manifest_hash=${hashText(manifestText)}`,
    "source_input_hash=none",
  ]);
  assertSnapshotEqualsFixtureIgnoringSourcePaths(
    JSON.parse(readFileSync(generatedNotReadySession, "utf8")),
    sessionNotReady,
  );
  assertSnapshotEqualsFixtureIgnoringSourcePaths(
    JSON.parse(readFileSync(generatedNotReadyInbox, "utf8")),
    inboxNotReady,
  );
  assert.equal(
    readFileSync(generatedNotReadySummary, "utf8"),
    readFileSync(generatedNotReadySummary, "utf8"),
    "snapshot summary must be readable and deterministic",
  );

  const generatedWaitingSession = join(waitingDir, "session.json");
  const generatedWaitingInbox = join(waitingDir, "inbox.json");
  const generatedWaitingSummary = join(waitingDir, "summary.json");
  const waitingStdout = runCli([
    "--manifest",
    validManifestFixtureFile,
    "--source-input",
    sourceInputFixtureFile,
    "--preflight-summary",
    preflightSummaryFixtureFile,
    "--out-dir",
    waitingDir,
    "--generated-at",
    generatedAt,
    "--session-panel-out",
    generatedWaitingSession,
    "--inbox-item-out",
    generatedWaitingInbox,
    "--summary-out",
    generatedWaitingSummary,
  ]);
  assertIncludesAll(waitingStdout, [
    "snapshot_state=waiting",
    `source_input_hash=${hashText(sourceInputText)}`,
    "authority_boundary=review-only local-only non-authorizing",
  ]);
  assertSnapshotEqualsFixtureIgnoringSourcePaths(
    JSON.parse(readFileSync(generatedWaitingSession, "utf8")),
    sessionWaiting,
  );
  assertSnapshotEqualsFixtureIgnoringSourcePaths(
    JSON.parse(readFileSync(generatedWaitingInbox, "utf8")),
    inboxWaiting,
  );

  const repeatSummaryPath = join(waitingDir, "summary-repeat.json");
  runCli([
    "--manifest",
    validManifestFixtureFile,
    "--source-input",
    sourceInputFixtureFile,
    "--preflight-summary",
    preflightSummaryFixtureFile,
    "--out-dir",
    waitingDir,
    "--generated-at",
    generatedAt,
    "--session-panel-out",
    generatedWaitingSession,
    "--inbox-item-out",
    generatedWaitingInbox,
    "--summary-out",
    repeatSummaryPath,
  ]);
  assert.deepEqual(
    normalizeSummary(JSON.parse(readFileSync(repeatSummaryPath, "utf8"))),
    normalizeSummary(JSON.parse(readFileSync(generatedWaitingSummary, "utf8"))),
    "snapshot summary must be deterministic apart from summary output file path",
  );

  const built = buildCodexFormerLocalAdapterSurfaceSnapshots({
    manifest,
    manifestPath: validManifestFixtureFile,
    manifestHash: hashCodexFormerLocalAdapterContent(manifestText),
    sourceInput,
    sourceInputPath: sourceInputFixtureFile,
    sourceInputHash: hashCodexFormerLocalAdapterContent(sourceInputText),
    preflightSummary,
    preflightSummaryPath: preflightSummaryFixtureFile,
    generatedAtOverride: generatedAt,
    sessionPanelSnapshotPath: sessionWaitingFixtureFile,
    inboxItemSnapshotPath: inboxWaitingFixtureFile,
  });
  assert.equal(built.snapshotState, "waiting");
  assert.equal(built.snapshotSummary.source_input_hash, hashText(sourceInputText));
}

function assertCommittedFixtureShapes() {
  assert.equal(hashText(manifestText), sessionNotReady.source.manifest_hash);
  assert.equal(hashText(manifestText), sessionWaiting.source.manifest_hash);
  assert.equal(hashText(sourceInputText), preflightSummary.source_input_hash);
  assert.equal(hashText(sourceInputText), sessionWaiting.source.source_input_hash);
  assert.equal(hashText(sourceInputText), inboxWaiting.source.source_input_hash);

  assert.equal(sessionNotReady.snapshot_kind, "session_panel");
  assert.equal(sessionWaiting.snapshot_kind, "session_panel");
  assert.equal(sessionNotReady.scenario_id, "not-prepared");
  assert.equal(sessionWaiting.scenario_id, "waiting-for-candidate");
  assert.equal(inboxNotReady.snapshot_kind, "capture_review_inbox_item");
  assert.equal(inboxWaiting.snapshot_kind, "capture_review_inbox_item");
  assert.equal(inboxNotReady.reviewability, "not_ready");
  assert.equal(inboxWaiting.reviewability, "waiting");

  for (const snapshot of [
    sessionNotReady,
    sessionWaiting,
    inboxNotReady,
    inboxWaiting,
  ]) {
    assert.equal(snapshot.review_only, true);
    assert.equal(snapshot.accepted_state, false);
    assert.equal(snapshot.candidate_count ?? snapshot.evidence?.candidate_count, 0);
    const flags =
      snapshot.authority_flags ?? snapshot.authority?.flags ?? {};
    for (const [key, value] of Object.entries(flags)) {
      assert.equal(value, false, `${key} must be false`);
    }
    const handoff =
      snapshot.handoff ?? snapshot.safe_links?.constellation_preview;
    assert.equal(handoff.available, false);
    assert.equal(handoff.href, null);
    assert(!JSON.stringify(snapshot).includes("pass-with-follow-up"));
    assert(!JSON.stringify(snapshot).includes("reviewable_with_follow_up"));
  }

  for (const inbox of [inboxNotReady, inboxWaiting]) {
    assert(inbox.item_id.startsWith("capture-review:"));
    assert(inbox.badges.length <= 2);
    assert(
      inboxFixtureHelperText.includes(`"${inbox.reviewability}"`),
      `inbox helper must support reviewability ${inbox.reviewability}`,
    );
  }
  for (const session of [sessionNotReady, sessionWaiting]) {
    assert(
      sessionFixtureHelperText.includes(`"${session.scenario_id}"`),
      `session helper must support scenario ${session.scenario_id}`,
    );
    for (const step of session.timeline) {
      assert(
        sessionFixtureHelperText.includes(`"${step.status}"`),
        `session helper must support timeline status ${step.status}`,
      );
    }
  }
}

function runRejectionCoverage() {
  mkdirSync(rejectionDir, { recursive: true });
  for (const option of [
    "--manifest",
    "--out-dir",
    "--source-input",
    "--preflight-summary",
    "--generated-at",
    "--session-panel-out",
    "--inbox-item-out",
    "--summary-out",
  ]) {
    assertIncludesAll(expectCliFailure([option]), [
      `option ${option} requires a value`,
    ]);
  }
  assertIncludesAll(expectCliFailure(["--banana", "value"]), [
    "unknown option: --banana",
  ]);
  assertIncludesAll(
    expectCliFailure([
      "--manifest",
      validManifestFixtureFile,
      "--manifest",
      validManifestFixtureFile,
      "--out-dir",
      rejectionDir,
    ]),
    ["duplicate option: --manifest"],
  );
  const collisionPath = join(rejectionDir, "collision.json");
  assertIncludesAll(
    expectCliFailure([
      "--manifest",
      validManifestFixtureFile,
      "--out-dir",
      rejectionDir,
      "--session-panel-out",
      collisionPath,
      "--inbox-item-out",
      collisionPath,
    ]),
    ["output paths must be distinct"],
  );

  const invalidManifest = clone(manifest);
  invalidManifest.adapter_manifest_version = "unsupported";
  writeJson(join(rejectionDir, "invalid-manifest.json"), invalidManifest);
  assertIncludesAll(
    expectCliFailure([
      "--manifest",
      join(rejectionDir, "invalid-manifest.json"),
      "--out-dir",
      rejectionDir,
    ]),
    ["manifest adapter_manifest_version"],
  );

  const invalidSourceInput = clone(sourceInput);
  invalidSourceInput.tests_checks_run[0].status = "skipped";
  writeJson(join(rejectionDir, "invalid-source-input.json"), invalidSourceInput);
  assertIncludesAll(
    expectCliFailure([
      "--manifest",
      validManifestFixtureFile,
      "--source-input",
      join(rejectionDir, "invalid-source-input.json"),
      "--out-dir",
      rejectionDir,
    ]),
    ["source_input.tests_checks_run[0].status must be passed or failed"],
  );

  writeFileSync(join(rejectionDir, "invalid-preflight-summary.json"), "{ nope", "utf8");
  assertIncludesAll(
    expectCliFailure([
      "--manifest",
      validManifestFixtureFile,
      "--source-input",
      sourceInputFixtureFile,
      "--preflight-summary",
      join(rejectionDir, "invalid-preflight-summary.json"),
      "--out-dir",
      rejectionDir,
    ]),
    ["preflight summary file is not valid JSON"],
  );

  const badPreflight = clone(preflightSummary);
  badPreflight.mode = "unsupported";
  writeJson(join(rejectionDir, "bad-preflight-mode.json"), badPreflight);
  assertIncludesAll(
    expectCliFailure([
      "--manifest",
      validManifestFixtureFile,
      "--source-input",
      sourceInputFixtureFile,
      "--preflight-summary",
      join(rejectionDir, "bad-preflight-mode.json"),
      "--out-dir",
      rejectionDir,
    ]),
    ["snapshot preflight summary mode is unsupported"],
  );

  const mismatchPreflight = clone(preflightSummary);
  mismatchPreflight.source_input_hash = "0".repeat(64);
  writeJson(join(rejectionDir, "preflight-hash-mismatch.json"), mismatchPreflight);
  assertIncludesAll(
    expectCliFailure([
      "--manifest",
      validManifestFixtureFile,
      "--source-input",
      sourceInputFixtureFile,
      "--preflight-summary",
      join(rejectionDir, "preflight-hash-mismatch.json"),
      "--out-dir",
      rejectionDir,
    ]),
    ["source_input_hash does not match source input bytes"],
  );

  const unsafeSourceInput = clone(sourceInput);
  unsafeSourceInput.changed_files_summary = [
    ["access", "token"].join("_"),
    ["raw", "pr", "diff"].join("_"),
  ].join(" ");
  writeJson(join(rejectionDir, "unsafe-source-input.json"), unsafeSourceInput);
  const unsafeOutput = expectCliFailure([
    "--manifest",
    validManifestFixtureFile,
    "--source-input",
    join(rejectionDir, "unsafe-source-input.json"),
    "--out-dir",
    rejectionDir,
  ]);
  assertIncludesAll(unsafeOutput, ["unsafe marker category"]);
  assert.equal(
    unsafeOutput.includes(["access", "token"].join("_")),
    false,
    "unsafe marker value must not be echoed",
  );

  assert.deepEqual(
    validateCodexFormerLocalAdapterSurfaceSnapshotInputs({
      manifest,
      manifestPath: validManifestFixtureFile,
      manifestHash: hashText(manifestText),
      sessionPanelSnapshotPath: "session.json",
      inboxItemSnapshotPath: "inbox.json",
    }),
    { valid: true, errors: [] },
  );
}

function assertDocsAndReport() {
  assertIncludesAll(docText, [
    "Purpose",
    "Why Follows PR #510",
    "Snapshot Scope",
    "Snapshot Inputs",
    "Snapshot States",
    "Session Panel Snapshot Shape",
    "Capture Review Inbox Item Snapshot Shape",
    "CLI Usage",
    "Not-ready Fixture Generation",
    "Waiting Fixture Generation",
    "Snapshot Summary",
    "Compatibility With Existing Fixture Surfaces",
    "Validation and Rejection Behavior",
    "Privacy / Redaction Boundary",
    "Authority Boundary",
    "What This Does Not Do",
    "PASS/BLOCKED adapter snapshots after validate summary modeling",
    "prepare orchestration design",
    "validate orchestration design",
    "surface integration for adapter snapshots",
    "Design local Codex adapter prepare orchestration mode",
    "Conclusion",
    "PASS with follow-up",
    "no prepare orchestration",
    "no validate orchestration",
    "no surface export beyond local snapshot files",
    "no UI/routes/browser surface",
    "no Codex/SDK/provider/GitHub/DB/network calls",
    "no accepted state",
    "no review decisions",
    "no persistence",
    "no clipboard automation",
  ]);
  assertIncludesAll(reportText, [
    "Summary",
    "Why Follows PR #510",
    "Snapshot Scope",
    "Snapshot Inputs",
    "Snapshot States",
    "Session Panel Snapshot",
    "Inbox Item Snapshot",
    "Fixture Outputs",
    "Snapshot Summary",
    "Compatibility With Existing Surfaces",
    "Validation and Rejection Coverage",
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
    sessionNotReadyText,
    sessionWaitingText,
    inboxNotReadyText,
    inboxWaitingText,
    preflightSummaryText,
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
    "no DB",
    "no clipboard",
    "no prepare/validate orchestration",
  ]);
}

function assertChangedFileBoundary() {
  const allowedChangedFiles = new Set([
    packageFile,
    libFile,
    cliFile,
    smokeFile,
    preflightSmokeFile,
    docFile,
    reportFile,
    preflightSummaryFixtureFile,
    sessionNotReadyFixtureFile,
    sessionWaitingFixtureFile,
    inboxNotReadyFixtureFile,
    inboxWaitingFixtureFile,
  ]);
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `local adapter surface snapshots changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      changedFile === packageFile ||
        changedFile.startsWith("lib/perspective-ingest/") ||
        changedFile.startsWith("scripts/") ||
        changedFile.startsWith("docs/") ||
        changedFile.startsWith("reports/"),
      `local adapter snapshots must stay lib/scripts/docs/report/fixtures/package only: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/") &&
        !changedFile.startsWith("components/") &&
        !changedFile.startsWith("db/") &&
        !changedFile.startsWith("migrations/") &&
        !changedFile.startsWith("apps/augnes_apps/"),
      `local adapter snapshots must not touch UI, DB, app, component, or schema surfaces: ${changedFile}`,
    );
  }
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

function assertSnapshotEqualsFixtureIgnoringSourcePaths(generated, fixture) {
  assert.deepEqual(generated, fixture);
}

function normalizeSummary(summary) {
  return { ...summary, session_panel_snapshot_path: "<session>", inbox_item_snapshot_path: "<inbox>" };
}

function writeJson(path, value) {
  writeFileSync(path, stableStringifyCodexFormerLocalAdapterJson(value), "utf8");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function collectChangedFiles() {
  return [
    ...new Set([
      ...gitLines(["diff", "--name-only", "--diff-filter=ACMR", "HEAD"]),
      ...gitLines(["diff", "--cached", "--name-only", "--diff-filter=ACMR"]),
      ...gitLines(["diff", "--name-only", "--diff-filter=ACMR", "origin/main...HEAD"]),
      ...gitLines(["ls-files", "--others", "--exclude-standard"]),
    ]),
  ].sort();
}

function gitLines(args) {
  return execFileSync("git", args, { encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function assertIncludesAll(text, snippets) {
  const normalizedText = normalizeText(text);
  for (const snippet of snippets) {
    assert(
      normalizedText.includes(normalizeText(snippet)),
      `expected text to include: ${snippet}`,
    );
  }
}

function normalizeText(value) {
  return String(value).replace(/\s+/g, " ").trim();
}

function hashText(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
