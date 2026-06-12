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
import { basename, join } from "node:path";

const packageFile = "package.json";
const libFile =
  "lib/perspective-ingest/codex-former-local-adapter-validate-result-snapshots.ts";
const cliFile =
  "scripts/perspective-codex-former-local-adapter-validate-result-snapshots.mjs";
const smokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-validate-result-snapshots.mjs";
const executionSmokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-validate-orchestration-execution.mjs";
const docFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_RESULT_SNAPSHOTS_V0_1.md";
const reportFile =
  "reports/2026-06-12-perspective-codex-former-local-adapter-validate-result-snapshots.md";
const passSummaryFixtureFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-execution-summary-pass.json";
const followUpSummaryFixtureFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-execution-summary-pass-with-follow-up.json";
const blockedSummaryFixtureFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-execution-summary-blocked.json";
const sessionPassFixtureFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-session-panel-snapshot-pass.json";
const sessionFollowUpFixtureFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-session-panel-snapshot-pass-with-follow-up.json";
const sessionBlockedFixtureFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-session-panel-snapshot-blocked.json";
const inboxPassFixtureFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-inbox-item-pass.json";
const inboxFollowUpFixtureFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-inbox-item-pass-with-follow-up.json";
const inboxBlockedFixtureFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-inbox-item-blocked.json";
const snapshotSummaryFixtureFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-snapshot-summary.json";
const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";
const generatedAt = "2026-06-12T00:00:00.000Z";
const outDir = "/tmp/augnes-codex-former-local-adapter-validate-result-snapshots";
const tmpRoot =
  "/tmp/augnes-codex-former-local-adapter-validate-result-snapshots-smoke";

const snapshotFixtureFiles = [
  sessionPassFixtureFile,
  sessionFollowUpFixtureFile,
  sessionBlockedFixtureFile,
  inboxPassFixtureFile,
  inboxFollowUpFixtureFile,
  inboxBlockedFixtureFile,
  snapshotSummaryFixtureFile,
];

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const libText = readFileSync(libFile, "utf8");
const cliText = readFileSync(cliFile, "utf8");
const smokeText = readFileSync(smokeFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");
const publicText = `${docText}\n${reportText}`;
const passSummaryFixture = JSON.parse(readFileSync(passSummaryFixtureFile, "utf8"));
const followUpSummaryFixture = JSON.parse(
  readFileSync(followUpSummaryFixtureFile, "utf8"),
);
const blockedSummaryFixture = JSON.parse(
  readFileSync(blockedSummaryFixtureFile, "utf8"),
);

rmSync(tmpRoot, { recursive: true, force: true });
mkdirSync(tmpRoot, { recursive: true });

assertPackageScripts();
assertFilesExist();
assertSourceContracts();
assertDocsAndReport();
const generatedSnapshots = assertDeterministicGeneration();
assertSnapshotShapesAndSemantics(generatedSnapshots);
assertSnapshotSummary(generatedSnapshots.summary);
assertNegativeCoverage();
assertNoUnsafePublicSnapshotMarkers();
assertNoForbiddenImplementationSurfaces();
assertChangedFileBoundary();

console.log(
  "PASS smoke:perspective-codex-former-local-adapter-validate-result-snapshots",
);

function assertPackageScripts() {
  assert.equal(
    packageJson.scripts[
      "perspective:codex-former:local-adapter:validate-result-snapshots"
    ],
    `${expectedTsxCommand} ${cliFile}`,
  );
  assert.equal(
    packageJson.scripts[
      "smoke:perspective-codex-former-local-adapter-validate-result-snapshots"
    ],
    `${expectedTsxCommand} ${smokeFile}`,
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
    passSummaryFixtureFile,
    followUpSummaryFixtureFile,
    blockedSummaryFixtureFile,
    ...snapshotFixtureFiles,
  ]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }
}

function assertSourceContracts() {
  assertIncludesAll(libText, [
    "codex_former_local_adapter_validate_result_session_panel_snapshot.v0.1",
    "codex_former_local_adapter_validate_result_inbox_item.v0.1",
    "codex_former_local_adapter_validate_result_snapshot_summary.v0.1",
    "codex_former_local_adapter_validate_summary.v0.1",
    "validate-result-snapshots",
    "validation-pass",
    "validation-pass-with-follow-up",
    "validation-blocked",
    "local-adapter-validation-pass",
    "local-adapter-validation-pass-with-follow-up",
    "local-adapter-validation-blocked",
    "PASS, review-only",
    "PASS with follow-up, review-only",
    "BLOCKED, review-only finding",
    "PASS summary warnings must be empty",
    "PASS summary pointer_warnings must be empty",
    "candidate_material_is_review_only must be true",
    "returned_candidate_treated_as_trusted_runtime_state must be false",
    "alignment_counted_as_direct_success must be false",
    "PASS summary blocked_reasons must be empty",
    "PASS summary contract_fit_status must be fits_contract",
    "PASS summary direct_validation_status must be ready_for_review",
    "PASS summary candidate_compatible_review_material must be true",
    "PASS summary candidate_authority must be non_committed",
    "PASS summary candidate_basis_quality must be sufficient_for_review",
    "PASS summary candidate_shape_status must be existing_validator_compatible",
    "PASS summary worker_facing_guidance_advisory_only must be true",
    "PASS summary worker_facing_guidance_status must be actionable_advisory",
    "PASS with follow-up summary blocked_reasons must be empty",
    "PASS with follow-up summary candidate_compatible_review_material must be true",
    "PASS with follow-up summary candidate_authority must be non_committed",
    "PASS with follow-up summary worker_facing_guidance_advisory_only must be true",
    "PASS with follow-up summary direct_validation_status must not be blocked",
    "PASS with follow-up summary contract_fit_status must not be violates_contract",
    "PASS with follow-up summary candidate_shape_status must be existing_validator_compatible",
    "BLOCKED summary blocked_reasons must not be empty",
    "BLOCKED summary must not claim review candidate availability",
    "public validate result snapshot contains unsafe marker",
  ]);
  assertIncludesAll(cliText, [
    "pass-summary",
    "pass-with-follow-up-summary",
    "blocked-summary",
    "out-dir",
    "generated-at",
    "output paths must be distinct",
    "PASS summary",
    "is not valid JSON",
    "mode=",
    "session_panel_snapshot_count",
    "inbox_item_count",
    "covered_result_states",
  ]);
}

function assertDocsAndReport() {
  assertIncludesAll(publicText, [
    "Why This Follows PR #524",
    "What Validate Result Snapshots Are",
    "What They Are Not",
    "PASS is review-only and not approval",
    "PASS with follow-up is review-only and not acceptance",
    "BLOCKED is a validation result, not automated rejection",
    "No state creates accepted Augnes state",
    "No state creates review decisions",
    "No state creates proof/evidence/readiness records",
    "No state creates persistence",
    "No state creates runtime/product state",
    "No state creates surface export",
    "No state creates GitHub, provider/model, Codex, Codex SDK, DB, network, clipboard, or Core authority",
    "validation-pass",
    "validation-pass-with-follow-up",
    "validation-blocked",
    "local-adapter-validation-pass",
    "local-adapter-validation-pass-with-follow-up",
    "local-adapter-validation-blocked",
    "PASS, review-only",
    "PASS with follow-up, review-only",
    "BLOCKED, review-only finding",
    "`reviewable` does not mean accepted, approved, persisted, product-ready, mergeable, or Core-decided",
    "future read-only validate result UI",
    "read-only validate result fixture surface",
    "Browser/computer-use validation is skipped",
    "Implement the read-only validate result fixture surface",
    "`PASS` summaries with non-empty `warnings`, non-empty `pointer_warnings`, or non-empty `blocked_reasons`",
    "`PASS` summaries whose `contract_fit_status` is not `fits_contract`",
    "`PASS` summaries whose `direct_validation_status` is not `ready_for_review`",
    "`PASS` summaries whose `candidate_basis_quality` is not `sufficient_for_review`",
    "`PASS` summaries whose `worker_facing_guidance_status` is not `actionable_advisory`",
    "`PASS with follow-up` summaries with non-empty `blocked_reasons`",
    "`PASS with follow-up` summaries whose `direct_validation_status` is `blocked`",
    "`PASS with follow-up` summaries whose `contract_fit_status` is `violates_contract`",
    "`BLOCKED` summaries with empty `blocked_reasons`",
  ]);
}

function assertDeterministicGeneration() {
  rmSync(outDir, { recursive: true, force: true });
  const stdout = runCli([
    "--pass-summary",
    passSummaryFixtureFile,
    "--pass-with-follow-up-summary",
    followUpSummaryFixtureFile,
    "--blocked-summary",
    blockedSummaryFixtureFile,
    "--out-dir",
    outDir,
    "--generated-at",
    generatedAt,
  ]);
  assertIncludesAll(stdout, [
    "mode=validate-result-snapshots",
    "session_panel_snapshot_count=3",
    "inbox_item_count=3",
    `snapshot_summary_path=${join(outDir, basename(snapshotSummaryFixtureFile))}`,
    "covered_result_states=PASS,PASS with follow-up,BLOCKED",
    "authority_boundary=review-only local-only non-authorizing",
  ]);

  for (const fixtureFile of snapshotFixtureFiles) {
    const generatedFile = join(outDir, basename(fixtureFile));
    assert.equal(existsSync(generatedFile), true, `${generatedFile} must exist`);
    assert.equal(
      readFileSync(generatedFile, "utf8"),
      readFileSync(fixtureFile, "utf8"),
      `${generatedFile} must match committed fixture byte-for-byte`,
    );
  }

  return {
    sessionPass: readJson(sessionPassFixtureFile),
    sessionFollowUp: readJson(sessionFollowUpFixtureFile),
    sessionBlocked: readJson(sessionBlockedFixtureFile),
    inboxPass: readJson(inboxPassFixtureFile),
    inboxFollowUp: readJson(inboxFollowUpFixtureFile),
    inboxBlocked: readJson(inboxBlockedFixtureFile),
    summary: readJson(snapshotSummaryFixtureFile),
  };
}

function assertSnapshotShapesAndSemantics(snapshots) {
  assertSessionSnapshot(snapshots.sessionPass, {
    scenarioId: "validation-pass",
    state: "PASS",
    primaryStatus: "PASS, review-only",
    candidateCount: 1,
    reviewCandidate: true,
    guidanceAdvisory: true,
  });
  assertSessionSnapshot(snapshots.sessionFollowUp, {
    scenarioId: "validation-pass-with-follow-up",
    state: "PASS with follow-up",
    primaryStatus: "PASS with follow-up, review-only",
    candidateCount: 1,
    reviewCandidate: true,
    guidanceAdvisory: true,
  });
  assertSessionSnapshot(snapshots.sessionBlocked, {
    scenarioId: "validation-blocked",
    state: "BLOCKED",
    primaryStatus: "BLOCKED, review-only finding",
    candidateCount: 0,
    reviewCandidate: false,
    guidanceAdvisory: false,
  });

  assertInboxItem(snapshots.inboxPass, {
    itemId: "local-adapter-validation-pass",
    state: "PASS",
    reviewability: "reviewable",
    reviewCandidate: true,
  });
  assertInboxItem(snapshots.inboxFollowUp, {
    itemId: "local-adapter-validation-pass-with-follow-up",
    state: "PASS with follow-up",
    reviewability: "reviewable_with_follow_up",
    reviewCandidate: true,
  });
  assertInboxItem(snapshots.inboxBlocked, {
    itemId: "local-adapter-validation-blocked",
    state: "BLOCKED",
    reviewability: "blocked",
    reviewCandidate: false,
  });
}

function assertSessionSnapshot(snapshot, expected) {
  assert.equal(snapshot.snapshot_kind, "validate_result_session_panel_snapshot");
  assert.equal(
    snapshot.snapshot_version,
    "codex_former_local_adapter_validate_result_session_panel_snapshot.v0.1",
  );
  assert.equal(snapshot.generated_at, generatedAt);
  assert.equal(snapshot.scenario_id, expected.scenarioId);
  assert.equal(snapshot.result_state, expected.state);
  assert.equal(snapshot.primary_status, expected.primaryStatus);
  assert.equal(snapshot.candidate_count, expected.candidateCount);
  assert.equal(
    snapshot.candidate_compatible_review_material,
    expected.reviewCandidate,
  );
  for (const field of [
    "candidate_shape_status",
    "contract_fit_status",
    "direct_validation_status",
    "worker_facing_guidance_status",
    "validation_summary_path",
    "validation_summary_hash",
    "source_input_hash",
    "prepare_execution_summary_hash",
    "returned_envelope_hash",
  ]) {
    assert.equal(typeof snapshot[field], "string", `${field} must be present`);
  }
  assert.equal(
    snapshot.worker_facing_guidance_advisory_only,
    expected.guidanceAdvisory,
  );
  assert.equal(snapshot.review_only, true);
  assert.equal(snapshot.accepted_state, false);
  assert.equal(snapshot.review_decision_created, false);
  assert.equal(snapshot.product_readiness_created, false);
  assert.equal(snapshot.constellation_handoff_available, false);
  assert.equal(snapshot.runtime_handoff_available, false);
  assertAllAuthorityFlagsFalse(snapshot.authority_flags);
}

function assertInboxItem(item, expected) {
  assert.equal(item.snapshot_kind, "validate_result_inbox_item");
  assert.equal(
    item.snapshot_version,
    "codex_former_local_adapter_validate_result_inbox_item.v0.1",
  );
  assert.equal(item.generated_at, generatedAt);
  assert.equal(item.item_id, expected.itemId);
  assert.equal(item.result_state, expected.state);
  assert.equal(item.reviewability, expected.reviewability);
  assert.equal(item.review_candidate_available, expected.reviewCandidate);
  assert.equal(item.stage, "validate_result_snapshot");
  assert.equal(item.review_only, true);
  assert.equal(item.accepted_state, false);
  assert.equal(item.review_decision_created, false);
  assert.equal(item.safe_links.validation_summary.available, true);
  assert.equal(item.safe_links.validation_summary.href, null);
  assert.equal(item.safe_links.read_only_validate_result_ui.available, false);
  assert.equal(item.safe_links.read_only_validate_result_ui.href, null);
  assert.equal(item.safe_links.runtime_handoff.available, false);
  assert.equal(item.safe_links.runtime_handoff.href, null);
  assert(item.authority_tags.includes("review_only"));
  assert(item.authority_tags.includes("no_accepted_state"));
  assert(item.authority_tags.includes("no_review_decision"));
  assert(item.authority_tags.includes("no_provider_model_api"));
  assert(item.authority_tags.includes("no_codex"));
  assert(item.authority_tags.includes("no_github_mutation"));
  assert(item.authority_tags.includes("no_core_decision"));
}

function assertSnapshotSummary(summary) {
  assert.equal(
    summary.summary_version,
    "codex_former_local_adapter_validate_result_snapshot_summary.v0.1",
  );
  assert.equal(summary.mode, "validate-result-snapshots");
  assert.equal(summary.generated_at, generatedAt);
  assert.deepEqual(summary.covered_result_states, [
    "PASS",
    "PASS with follow-up",
    "BLOCKED",
  ]);
  assert.deepEqual(summary.covered_surfaces, [
    "Session Panel",
    "Capture Review Inbox",
    "future read-only validate result UI",
  ]);
  assert.deepEqual(summary.candidate_count_by_state, {
    PASS: 1,
    "PASS with follow-up": 1,
    BLOCKED: 0,
  });
  assert.deepEqual(summary.blocked_reason_count_by_state, {
    PASS: 0,
    "PASS with follow-up": 0,
    BLOCKED: 2,
  });
  assert.equal(
    summary.input_summary_hashes.pass,
    sha256(readFileSync(passSummaryFixtureFile, "utf8")),
  );
  assert.equal(
    summary.input_summary_hashes.pass_with_follow_up,
    sha256(readFileSync(followUpSummaryFixtureFile, "utf8")),
  );
  assert.equal(
    summary.input_summary_hashes.blocked,
    sha256(readFileSync(blockedSummaryFixtureFile, "utf8")),
  );
  assert.equal(
    summary.emitted_snapshot_hashes.session_panel.pass,
    sha256(readFileSync(sessionPassFixtureFile, "utf8")),
  );
  assert.equal(
    summary.emitted_snapshot_hashes.session_panel.pass_with_follow_up,
    sha256(readFileSync(sessionFollowUpFixtureFile, "utf8")),
  );
  assert.equal(
    summary.emitted_snapshot_hashes.session_panel.blocked,
    sha256(readFileSync(sessionBlockedFixtureFile, "utf8")),
  );
  assert.equal(
    summary.emitted_snapshot_hashes.inbox.pass,
    sha256(readFileSync(inboxPassFixtureFile, "utf8")),
  );
  assert.equal(
    summary.emitted_snapshot_hashes.inbox.pass_with_follow_up,
    sha256(readFileSync(inboxFollowUpFixtureFile, "utf8")),
  );
  assert.equal(
    summary.emitted_snapshot_hashes.inbox.blocked,
    sha256(readFileSync(inboxBlockedFixtureFile, "utf8")),
  );
  assertAllSummaryAuthorityFalse(summary.authority_boundary);
  assert(
    summary.future_ui_path.includes("read-only validate result UI"),
    "summary must describe the future read-only validate result UI path",
  );
  assert(
    summary.browser_validation_requirement.includes(
      "later UI PR must add browser/computer-use validation",
    ),
    "summary must preserve later browser validation requirement",
  );
}

function assertNegativeCoverage() {
  assertFailure(
    "output-collision",
    [
      "--session-pass-out",
      join(tmpRoot, "collision.json"),
      "--session-blocked-out",
      join(tmpRoot, "collision.json"),
    ],
    ["output paths must be distinct"],
  );
  assertFailureWithMutatedSummary("unsupported-version", "pass", (summary) => {
    summary.summary_version = "unsupported";
  }, ["passSummary unsupported validate summary version"]);
  assertFailureWithMutatedSummary("unsupported-mode", "pass", (summary) => {
    summary.mode = "validate-orchestration-dry-run";
  }, ["passSummary unsupported validate summary mode"]);
  assertFailureWithMutatedSummary("unknown-state", "pass", (summary) => {
    summary.result_state = "NEEDS_MANUAL";
  }, ["passSummary result_state is unsupported"]);
  assertFailureWithMutatedSummary("candidate-count-mismatch", "pass", (summary) => {
    summary.candidate_count = 0;
  }, ["passSummary candidate_count must be 1 for PASS"]);
  assertFailureWithMutatedSummary("pass-blocked-reasons", "pass", (summary) => {
    summary.blocked_reasons = ["must not be present"];
  }, ["PASS summary blocked_reasons must be empty"]);
  assertFailureWithMutatedSummary("pass-warnings", "pass", (summary) => {
    summary.warnings = ["must not be present"];
  }, ["PASS summary warnings must be empty"]);
  assertFailureWithMutatedSummary("pass-pointer-warnings", "pass", (summary) => {
    summary.pointer_warnings = ["must not be present"];
  }, ["PASS summary pointer_warnings must be empty"]);
  assertFailureWithMutatedSummary("pass-direct-needs-review", "pass", (summary) => {
    summary.direct_validation_status = "needs_review";
  }, ["PASS summary direct_validation_status must be ready_for_review"]);
  assertFailureWithMutatedSummary("pass-contract-needs-review", "pass", (summary) => {
    summary.contract_fit_status = "needs_review";
  }, ["PASS summary contract_fit_status must be fits_contract"]);
  assertFailureWithMutatedSummary("pass-no-review-material", "pass", (summary) => {
    summary.candidate_compatible_review_material = false;
  }, ["PASS summary candidate_compatible_review_material must be true"]);
  assertFailureWithMutatedSummary("pass-committed-authority", "pass", (summary) => {
    summary.candidate_authority = "committed";
  }, ["PASS summary candidate_authority must be non_committed"]);
  assertFailureWithMutatedSummary("pass-basis-needs-review", "pass", (summary) => {
    summary.candidate_basis_quality = "needs_review";
  }, ["PASS summary candidate_basis_quality must be sufficient_for_review"]);
  assertFailureWithMutatedSummary("pass-shape-wrong", "pass", (summary) => {
    summary.candidate_shape_status = "wrong_shape";
  }, ["PASS summary candidate_shape_status must be existing_validator_compatible"]);
  assertFailureWithMutatedSummary("pass-guidance-not-advisory", "pass", (summary) => {
    summary.worker_facing_guidance_advisory_only = false;
  }, ["PASS summary worker_facing_guidance_advisory_only must be true"]);
  assertFailureWithMutatedSummary("pass-guidance-resolve-gaps", "pass", (summary) => {
    summary.worker_facing_guidance_status = "resolve_gaps_first";
  }, ["PASS summary worker_facing_guidance_status must be actionable_advisory"]);
  assertFailureWithMutatedSummary("follow-up-no-review-material", "follow-up", (summary) => {
    summary.candidate_compatible_review_material = false;
  }, ["PASS with follow-up summary candidate_compatible_review_material must be true"]);
  assertFailureWithMutatedSummary("follow-up-blocked-reasons", "follow-up", (summary) => {
    summary.blocked_reasons = ["must not be present"];
  }, ["PASS with follow-up summary blocked_reasons must be empty"]);
  assertFailureWithMutatedSummary("follow-up-direct-blocked", "follow-up", (summary) => {
    summary.direct_validation_status = "blocked";
  }, ["PASS with follow-up summary direct_validation_status must not be blocked"]);
  assertFailureWithMutatedSummary("follow-up-committed-authority", "follow-up", (summary) => {
    summary.candidate_authority = "committed";
  }, ["PASS with follow-up summary candidate_authority must be non_committed"]);
  assertFailureWithMutatedSummary("follow-up-guidance-not-advisory", "follow-up", (summary) => {
    summary.worker_facing_guidance_advisory_only = false;
  }, [
    "PASS with follow-up summary worker_facing_guidance_advisory_only must be true",
  ]);
  assertFailureWithMutatedSummary("follow-up-contract-violation", "follow-up", (summary) => {
    summary.contract_fit_status = "violates_contract";
  }, [
    "PASS with follow-up summary contract_fit_status must not be violates_contract",
  ]);
  assertFailureWithMutatedSummary("follow-up-shape-wrong", "follow-up", (summary) => {
    summary.candidate_shape_status = "wrong_shape";
  }, [
    "PASS with follow-up summary candidate_shape_status must be existing_validator_compatible",
  ]);
  assertFailureWithMutatedSummary("blocked-authority-drift", "blocked", (summary) => {
    summary.authority_flags.network_calls = true;
  }, ["blockedSummary authority flag drift: network_calls must be false"]);
  assertFailureWithMutatedSummary("blocked-no-blocked-reasons", "blocked", (summary) => {
    summary.blocked_reasons = [];
  }, ["BLOCKED summary blocked_reasons must not be empty"]);
  assertFailureWithMutatedSummary("blocked-review-candidate-claim", "blocked", (summary) => {
    summary.candidate_compatible_review_material = true;
  }, ["BLOCKED summary must not claim review candidate availability"]);
  assertFailureWithMutatedSummary("candidate-material-not-review-only", "pass", (summary) => {
    summary.candidate_material_is_review_only = false;
  }, ["passSummary candidate_material_is_review_only must be true"]);
  assertFailureWithMutatedSummary("trusted-runtime-state", "pass", (summary) => {
    summary.returned_candidate_treated_as_trusted_runtime_state = true;
  }, [
    "passSummary returned_candidate_treated_as_trusted_runtime_state must be false",
  ]);
  assertFailureWithMutatedSummary("alignment-direct-success", "pass", (summary) => {
    summary.alignment_counted_as_direct_success = true;
  }, ["passSummary alignment_counted_as_direct_success must be false"]);

  for (const field of [
    "accepted_state_created",
    "review_decision_created",
    "proof_evidence_readiness_records_created",
    "persistence",
    "surface_export",
  ]) {
    assertFailureWithMutatedSummary(`authority-${field}`, "pass", (summary) => {
      summary.authority_flags[field] = true;
    }, [`passSummary authority flag drift: ${field} must be false`]);
  }

  const invalidJsonPath = join(tmpRoot, "invalid-pass-summary.json");
  writeFileSync(invalidJsonPath, "{not json", "utf8");
  assertFailure("invalid-json", ["--pass-summary", invalidJsonPath], [
    "PASS summary file is not valid JSON",
  ]);
  assertFailure("missing-json", ["--pass-summary", join(tmpRoot, "missing.json")], [
    "PASS summary file does not exist",
  ]);
}

function assertFailureWithMutatedSummary(name, slot, mutate, expectedSnippets) {
  const pass = clone(passSummaryFixture);
  const followUp = clone(followUpSummaryFixture);
  const blocked = clone(blockedSummaryFixture);
  const target =
    slot === "pass" ? pass : slot === "follow-up" ? followUp : blocked;
  mutate(target);
  const scenarioDir = join(tmpRoot, name);
  mkdirSync(scenarioDir, { recursive: true });
  const passPath = join(scenarioDir, "pass.json");
  const followUpPath = join(scenarioDir, "follow-up.json");
  const blockedPath = join(scenarioDir, "blocked.json");
  writeJson(passPath, pass);
  writeJson(followUpPath, followUp);
  writeJson(blockedPath, blocked);
  assertIncludesAll(
    runCliExpectFailure(baseArgs({
      passSummary: passPath,
      followUpSummary: followUpPath,
      blockedSummary: blockedPath,
      outDir: join(scenarioDir, "out"),
    })),
    expectedSnippets,
  );
}

function assertFailure(name, extraArgs, expectedSnippets) {
  const scenarioDir = join(tmpRoot, name);
  mkdirSync(scenarioDir, { recursive: true });
  const args = baseArgs({
    passSummary: passSummaryFixtureFile,
    followUpSummary: followUpSummaryFixtureFile,
    blockedSummary: blockedSummaryFixtureFile,
    outDir: join(scenarioDir, "out"),
  });
  for (let index = 0; index < extraArgs.length; index += 2) {
    const option = extraArgs[index];
    const value = extraArgs[index + 1];
    const existing = args.indexOf(option);
    if (existing >= 0) {
      args[existing + 1] = value;
    } else {
      args.push(option, value);
    }
  }
  assertIncludesAll(runCliExpectFailure(args), expectedSnippets);
}

function baseArgs({
  passSummary,
  followUpSummary,
  blockedSummary,
  outDir: scenarioOutDir,
}) {
  return [
    "--pass-summary",
    passSummary,
    "--pass-with-follow-up-summary",
    followUpSummary,
    "--blocked-summary",
    blockedSummary,
    "--out-dir",
    scenarioOutDir,
    "--generated-at",
    generatedAt,
  ];
}

function assertNoUnsafePublicSnapshotMarkers() {
  const publicSnapshotText = [
    docText,
    reportText,
    ...snapshotFixtureFiles.map((file) => readFileSync(file, "utf8")),
  ].join("\n").toLowerCase();
  for (const marker of [
    "raw_private_payload",
    "provider_payload",
    "raw_source_payload",
    "raw_candidate_payload",
    "raw_page_dump",
    "browser_dump",
    "token_payload",
    "oauth_token",
    "access_token",
    "refresh_token",
    "api_key",
    "hidden_reasoning",
    "sk-proj-",
    "ghp_",
  ]) {
    assert(
      !publicSnapshotText.includes(marker),
      `public docs/report/fixtures must not contain unsafe marker ${marker}`,
    );
  }
}

function assertNoForbiddenImplementationSurfaces() {
  for (const [label, text] of [
    ["lib", libText],
    ["cli", cliText],
    ["smoke", smokeText],
    ["doc", docText],
    ["report", reportText],
  ]) {
    for (const snippet of [
      ["fetch", "("].join(""),
      ["XML", "Http", "Request"].join(""),
      ["responses", "create"].join("."),
      ["openai", "chat"].join("."),
      ["navigator", "clipboard"].join("."),
      ["better", "sqlite3"].join("-"),
      ["createClient", "("].join(""),
      ["graphql", "("].join(""),
      ["record", "Proof"].join(""),
      ["create", "Evidence"].join(""),
      ["commit", "State", "Update"].join(""),
      ["validate", "Codex", "Former", "Capture"].join(""),
    ]) {
      assert(
        !text.includes(snippet),
        `${label} must not include forbidden runtime surface ${snippet}`,
      );
    }
  }
}

function assertChangedFileBoundary() {
  const allowedChangedFiles = new Set([
    packageFile,
    libFile,
    cliFile,
    smokeFile,
    executionSmokeFile,
    docFile,
    reportFile,
    sessionPassFixtureFile,
    sessionFollowUpFixtureFile,
    sessionBlockedFixtureFile,
    inboxPassFixtureFile,
    inboxFollowUpFixtureFile,
    inboxBlockedFixtureFile,
    snapshotSummaryFixtureFile,
  ]);
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `validate result snapshots changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      changedFile === packageFile ||
        changedFile.startsWith("lib/") ||
        changedFile.startsWith("scripts/") ||
        changedFile.startsWith("docs/") ||
        changedFile.startsWith("reports/"),
      `validate result snapshots must stay lib/scripts/docs/report/fixtures/package scope: ${changedFile}`,
    );
  }
}

function assertAllAuthorityFlagsFalse(authorityFlags) {
  for (const [field, value] of Object.entries(authorityFlags)) {
    assert.equal(value, false, `${field} authority flag must be false`);
  }
}

function assertAllSummaryAuthorityFalse(authorityBoundary) {
  assert.equal(authorityBoundary.review_only, true);
  for (const [field, value] of Object.entries(authorityBoundary)) {
    if (field === "review_only") continue;
    assert.equal(value, false, `${field} summary authority boundary must be false`);
  }
}

function runCli(args) {
  return execFileSync("npm", [
    "run",
    "perspective:codex-former:local-adapter:validate-result-snapshots",
    "--",
    ...args,
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function runCliExpectFailure(args) {
  try {
    runCli(args);
  } catch (error) {
    return [
      error?.stdout?.toString?.() ?? "",
      error?.stderr?.toString?.() ?? "",
      error instanceof Error ? error.message : String(error),
    ].join("\n");
  }
  assert.fail("expected CLI command to fail");
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

function assertIncludesAll(text, expectedSnippets) {
  for (const snippet of expectedSnippets) {
    assert(
      text.includes(snippet),
      `expected text to include ${JSON.stringify(snippet)}`,
    );
  }
}

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}
