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

const packageFile = "package.json";
const libFile =
  "lib/perspective-ingest/codex-former-local-adapter-validate-orchestration.ts";
const cliFile =
  "scripts/perspective-codex-former-local-adapter-validate-orchestration.mjs";
const dryRunSmokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-validate-orchestration-dry-run.mjs";
const smokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-validate-orchestration-execution.mjs";
const docFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_ORCHESTRATION_EXECUTION_V0_1.md";
const reportFile =
  "reports/2026-06-12-perspective-codex-former-local-adapter-validate-orchestration-execution.md";
const validateResultSnapshotsLibFile =
  "lib/perspective-ingest/codex-former-local-adapter-validate-result-snapshots.ts";
const validateResultSnapshotsCliFile =
  "scripts/perspective-codex-former-local-adapter-validate-result-snapshots.mjs";
const validateResultSnapshotsSmokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-validate-result-snapshots.mjs";
const validateResultSnapshotsDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_RESULT_SNAPSHOTS_V0_1.md";
const validateResultSnapshotsReportFile =
  "reports/2026-06-12-perspective-codex-former-local-adapter-validate-result-snapshots.md";
const passSourceInputFixtureFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-source-input-pass.json";
const passPrepareSummaryFixtureFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-prepare-execution-summary-pass.json";
const passEnvelopeFixtureFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-returned-candidate-envelope-pass.txt";
const existingSourceInputFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-source-input.json";
const followUpPrepareSummaryFixtureFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-prepare-execution-summary-pass-with-follow-up.json";
const existingPrepareSummaryFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-prepare-execution-summary-success.json";
const readyEnvelopeFixtureFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-returned-candidate-envelope-ready.txt";
const blockedEnvelopeFixtureFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-returned-candidate-envelope-blocked.txt";
const passSummaryFixtureFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-execution-summary-pass.json";
const followUpSummaryFixtureFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-execution-summary-pass-with-follow-up.json";
const blockedSummaryFixtureFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-execution-summary-blocked.json";
const validateResultSessionPassFixtureFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-session-panel-snapshot-pass.json";
const validateResultSessionFollowUpFixtureFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-session-panel-snapshot-pass-with-follow-up.json";
const validateResultSessionBlockedFixtureFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-session-panel-snapshot-blocked.json";
const validateResultInboxPassFixtureFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-inbox-item-pass.json";
const validateResultInboxFollowUpFixtureFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-inbox-item-pass-with-follow-up.json";
const validateResultInboxBlockedFixtureFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-inbox-item-blocked.json";
const validateResultSnapshotSummaryFixtureFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-snapshot-summary.json";
const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";
const tmpRoot =
  "/tmp/augnes-codex-former-local-adapter-validate-orchestration-execution-smoke";
const generatedAt = "2026-06-12T00:00:00.000Z";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const libText = readFileSync(libFile, "utf8");
const cliText = readFileSync(cliFile, "utf8");
const smokeText = readFileSync(smokeFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");
const passSourceInputText = readFileSync(passSourceInputFixtureFile, "utf8");
const passPrepareSummary = JSON.parse(
  readFileSync(passPrepareSummaryFixtureFile, "utf8"),
);
const passEnvelopeText = readFileSync(passEnvelopeFixtureFile, "utf8");
const passCandidate = extractCandidate(passEnvelopeText);
const existingSourceInputText = readFileSync(existingSourceInputFixtureFile, "utf8");
const followUpPrepareSummary = JSON.parse(
  readFileSync(followUpPrepareSummaryFixtureFile, "utf8"),
);
const readyEnvelopeText = readFileSync(readyEnvelopeFixtureFile, "utf8");
const readyCandidate = extractCandidate(readyEnvelopeText);
const blockedEnvelopeText = readFileSync(blockedEnvelopeFixtureFile, "utf8");
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
assertFixtureSummaries();
assertDryRunSummaryEquivalence();
assertNegativeCoverage();
assertDryRunStillWorks();
assertDocsAndReport();
assertNoForbiddenImplementationSurfaces();
assertChangedFileBoundary();

console.log(
  "PASS smoke:perspective-codex-former-local-adapter-validate-orchestration-execution",
);

function assertPackageScripts() {
  assert.equal(
    packageJson.scripts["perspective:codex-former:local-adapter:validate"],
    `${expectedTsxCommand} ${cliFile}`,
  );
  assert.equal(
    packageJson.scripts[
      "smoke:perspective-codex-former-local-adapter-validate-orchestration-execution"
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
    dryRunSmokeFile,
    docFile,
    reportFile,
    passSourceInputFixtureFile,
    passPrepareSummaryFixtureFile,
    passEnvelopeFixtureFile,
    followUpPrepareSummaryFixtureFile,
    blockedEnvelopeFixtureFile,
    passSummaryFixtureFile,
    followUpSummaryFixtureFile,
    blockedSummaryFixtureFile,
  ]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }
}

function assertSourceContracts() {
  assertIncludesAll(libText, [
    "codex_former_local_adapter_validate_summary.v0.1",
    "validate-orchestration",
    "PASS",
    "PASS with follow-up",
    "BLOCKED",
    "buildCodexFormerLocalAdapterValidateExecutionSummary",
    "buildCodexFormerLocalAdapterValidateDryRunSummary",
    "buildPerspectiveFormationInputBundle",
    "buildCodexPerspectiveFormerInputPacket",
    "evaluateCodexPerspectiveCandidateDraftPromptContractFit",
    "validateAndNormalizeCodexPerspectiveCandidateDraft",
    "alignCodexPerspectiveCandidateDraftSchemaFromModelOutput",
    "buildWorkerFacingPerspectiveGuidanceFromCandidate",
    "alignment_counted_as_direct_success: false",
    "validate_orchestration_execute_ran: true",
    "candidate_material_is_review_only: true",
    "returned_candidate_treated_as_trusted_runtime_state: false",
    "validate_helper_executed: false",
  ]);
  assertIncludesAll(cliText, [
    "--execute",
    "--dry-run",
    "dry-run-summary",
    "validate orchestration cannot use --dry-run and --execute together",
    "validate orchestration requires either --dry-run or --execute",
    "result_state=",
    "contract_fit_status=",
    "direct_validation_status=",
    "worker_facing_guidance_status=",
    "validate_helper_executed=false",
  ]);
}

function assertFixtureSummaries() {
  const pass = runFixtureScenario("pass-fixture", {
    sourceInputFile: passSourceInputFixtureFile,
    prepareSummaryFile: passPrepareSummaryFixtureFile,
    envelopeFile: passEnvelopeFixtureFile,
  });
  assert.deepEqual(pass.summary, passSummaryFixture);
  assert.equal(pass.summary.result_state, "PASS");
  assert.equal(pass.summary.direct_validation_status, "ready_for_review");
  assert.equal(pass.summary.contract_fit_status, "fits_contract");
  assert.equal(pass.summary.alignment_safety_net_status, "aligned");
  assert.equal(pass.summary.worker_facing_guidance_status, "actionable_advisory");
  assert.equal(pass.summary.worker_facing_guidance_advisory_only, true);
  assert.equal(pass.summary.alignment_counted_as_direct_success, false);
  assert.equal(pass.summary.authority_flags.validate_helper_executed, false);
  assert.equal(pass.summary.candidate_material_is_review_only, true);
  assert.equal(pass.summary.returned_candidate_treated_as_trusted_runtime_state, false);
  assert(
    pass.summary.next_safe_action.includes("PASS is review-only"),
    "PASS must explicitly remain review-only",
  );

  const followUp = runFixtureScenario("follow-up-fixture", {
    sourceInputFile: existingSourceInputFixtureFile,
    prepareSummaryFile: followUpPrepareSummaryFixtureFile,
    envelopeFile: readyEnvelopeFixtureFile,
  });
  assert.deepEqual(followUp.summary, followUpSummaryFixture);
  assert.equal(followUp.summary.result_state, "PASS with follow-up");
  assert.equal(followUp.summary.candidate_compatible_review_material, true);
  assert.equal(followUp.summary.direct_validation_status, "needs_review");
  assert.equal(followUp.summary.worker_facing_guidance_status, "resolve_gaps_first");
  assert.equal(followUp.summary.worker_facing_guidance_advisory_only, true);
  assert.equal(followUp.summary.blocked_reasons.length, 0);

  const blocked = runFixtureScenario("blocked-fixture", {
    sourceInputFile: existingSourceInputFixtureFile,
    prepareSummaryFile: followUpPrepareSummaryFixtureFile,
    envelopeFile: blockedEnvelopeFixtureFile,
  });
  assert.deepEqual(blocked.summary, blockedSummaryFixture);
  assert.equal(blocked.summary.result_state, "BLOCKED");
  assert.equal(blocked.summary.execution_result, "blocked");
  assert.equal(blocked.summary.candidate_compatible_review_material, false);
  assert.equal(blocked.summary.worker_facing_guidance_ran, false);
  assert(
    blocked.summary.blocked_reasons.some((reason) =>
      reason.includes("evidence_pointer_refs[0] must be an object"),
    ),
  );
}

function assertDryRunSummaryEquivalence() {
  const scenario = writeScenarioFiles("stale-dry-run-source", {
    sourceInputText: passSourceInputText,
    prepareSummary: passPrepareSummary,
    envelopeText: passEnvelopeText,
  });
  runCli([
    "--dry-run",
    "--generated-at",
    generatedAt,
    "--source-input",
    scenario.sourceInputPath,
    "--prepare-execution-summary",
    scenario.prepareSummaryPath,
    "--returned-envelope",
    scenario.envelopePath,
    "--validation-summary-out",
    scenario.dryRunSummaryPath,
  ]);
  const mutatedSource = JSON.stringify(
    { ...JSON.parse(passSourceInputText), generated_at: "2026-06-12T01:00:00.000Z" },
    null,
    2,
  );
  writeFileSync(scenario.sourceInputPath, `${mutatedSource}\n`, "utf8");
  const staleSourceSummary = runExecuteWithScenario(
    "stale-dry-run-source-execute",
    {
      sourceInputPath: scenario.sourceInputPath,
      prepareSummaryPath: scenario.prepareSummaryPath,
      envelopePath: scenario.envelopePath,
      dryRunSummaryPath: scenario.dryRunSummaryPath,
    },
  ).summary;
  assert.equal(staleSourceSummary.result_state, "BLOCKED");
  assert.equal(staleSourceSummary.failure_kind, "dry_run_summary_stale");
  assert(
    staleSourceSummary.blocked_reasons.some((reason) =>
      reason.includes("source_input_hash does not match current inputs"),
    ),
  );

  const mismatch = writeScenarioFiles("stale-dry-run-envelope", {
    sourceInputText: passSourceInputText,
    prepareSummary: passPrepareSummary,
    envelopeText: passEnvelopeText,
  });
  runCli([
    "--dry-run",
    "--generated-at",
    generatedAt,
    "--source-input",
    mismatch.sourceInputPath,
    "--prepare-execution-summary",
    mismatch.prepareSummaryPath,
    "--returned-envelope",
    mismatch.envelopePath,
    "--validation-summary-out",
    mismatch.dryRunSummaryPath,
  ]);
  writeFileSync(
    mismatch.envelopePath,
    buildEnvelopeForReturnedText(passEnvelopeText, "bounded prose without candidate JSON"),
    "utf8",
  );
  const staleEnvelopeSummary = runExecuteWithScenario(
    "stale-dry-run-envelope-execute",
    {
      sourceInputPath: mismatch.sourceInputPath,
      prepareSummaryPath: mismatch.prepareSummaryPath,
      envelopePath: mismatch.envelopePath,
      dryRunSummaryPath: mismatch.dryRunSummaryPath,
    },
  ).summary;
  assert.equal(staleEnvelopeSummary.result_state, "BLOCKED");
  assert.equal(staleEnvelopeSummary.failure_kind, "dry_run_summary_stale");
  assert(
    staleEnvelopeSummary.blocked_reasons.some((reason) =>
      reason.includes("returned_envelope_hash does not match current inputs"),
    ),
  );
}

function assertNegativeCoverage() {
  assertBlocked("candidate-zero", {
    envelopeText: buildEnvelopeForReturnedText(
      passEnvelopeText,
      "bounded prose without candidate JSON",
    ),
  }, ["expected exactly one existing-validator-compatible candidate draft; found 0"]);
  assertBlocked("candidate-multiple", {
    envelopeText: buildEnvelopeForReturnedText(
      passEnvelopeText,
      `${JSON.stringify(passCandidate)}\n${JSON.stringify(passCandidate)}`,
    ),
  }, ["candidate_count multiple is blocked before validate execution"]);
  assertBlocked("candidate-valid-plus-wrong-shape", {
    envelopeText: buildEnvelopeForReturnedText(
      passEnvelopeText,
      `${JSON.stringify(passCandidate)}\n${JSON.stringify({
        draft_version: "codex_perspective_candidate_draft.v0.1",
        draft_kind: "codex_perspective_candidate_draft",
      })}`,
    ),
  }, [
    "ambiguous returned candidate material contains multiple JSON objects",
    "candidate[1].source_former_input_packet is missing",
  ]);
  assertBlocked("unsupported-version-kind", {
    envelopeText: buildEnvelopeForCandidate(passEnvelopeText, {
      ...passCandidate,
      draft_version: "v0.1",
      draft_kind: "CodexPerspectiveCandidateDraft",
    }),
  }, ["candidate[0].draft_version is unsupported", "candidate[0].draft_kind is unsupported"]);
  assertBlocked("malformed-evidence-pointer", {
    envelopeText: buildEnvelopeForCandidate(passEnvelopeText, {
      ...passCandidate,
      evidence_pointer_refs: [null],
    }),
  }, ["candidate[0].evidence_pointer_refs[0] must be an object"]);
  const pointerWarningSummary = runScenario("pointer-warning", {
    envelopeText: buildEnvelopeForCandidate(passEnvelopeText, {
      ...passCandidate,
      evidence_pointer_refs: [
        {
          pointer_kind: "perspective_ref",
          pointer_semantics: "not_pointer_only",
          ref: "perspective:local-validate-execution:pointer-warning",
        },
      ],
    }),
  }).summary;
  assert.equal(pointerWarningSummary.result_state, "PASS with follow-up");
  assert(
    pointerWarningSummary.pointer_warnings.includes(
      "evidence_pointer_refs[0] is not pointer_only",
    ),
  );
  assert.equal(pointerWarningSummary.authority_flags.validate_helper_executed, false);

  assertBlocked("manual-copy-id-mismatch", {
    envelopeText: passEnvelopeText.replace(
      "source_manual_copy_packet_id: manual-codex-former-copy:v0.1:validate-execution-pass",
      "source_manual_copy_packet_id: manual-codex-former-copy:v0.1:mismatch",
    ),
  }, ["source_manual_copy_packet_id does not match prepare provenance"]);
  assertBlocked("former-input-mismatch", {
    envelopeText: buildEnvelopeForCandidate(passEnvelopeText, {
      ...passCandidate,
      source_former_input_packet: {
        ...passCandidate.source_former_input_packet,
        packet_id: "codex-perspective-former-input:v0.1:mismatch",
      },
    }),
  }, ["candidate.source_former_input_packet.packet_id does not match envelope source_former_input_packet_id"]);
  assertBlocked("source-prompt-hash-mismatch", {
    envelopeText: passEnvelopeText.replace(
      "source_prompt_hash: pass-source-prompt-hash",
      "source_prompt_hash: mismatch",
    ),
  }, ["source_prompt_hash does not match prepare provenance"]);

  const promptPath = join(tmpRoot, "mismatched-prompt.txt");
  writeFileSync(promptPath, "mismatched prompt bytes\n", "utf8");
  const promptMismatchPrepare = clone(passPrepareSummary);
  promptMismatchPrepare.helper_output_paths.prompt_path = promptPath;
  promptMismatchPrepare.helper_metadata_checks.prompt_file_sha256 = sha256(
    "different expected bytes\n",
  );
  assertBlocked("prompt-file-sha-mismatch", {
    prepareSummary: promptMismatchPrepare,
  }, ["prompt_file_sha256 does not match prompt artifact bytes"]);

  const contractViolationCandidate = clone(passCandidate);
  contractViolationCandidate.thesis =
    "The useful neutral perspective beyond a plain summary is raw_private_payload and must be blocked.";
  assertBlocked("contract-fit-hard-violation", {
    envelopeText: buildEnvelopeForCandidate(passEnvelopeText, contractViolationCandidate),
  }, ["contract-fit evaluation found a hard violation"]);

  const directBlockedCandidate = clone(passCandidate);
  directBlockedCandidate.privacy_flags.raw_payloads_included = true;
  const directBlocked = assertBlocked("direct-validation-blocked", {
    envelopeText: buildEnvelopeForCandidate(passEnvelopeText, directBlockedCandidate),
  }, ["draft says raw payloads are included"]);
  assert.equal(directBlocked.summary.direct_validation_status, "blocked");
  assert.equal(
    directBlocked.summary.worker_facing_guidance_status,
    "skipped_blocked_candidate",
  );
  assert.equal(directBlocked.summary.worker_facing_guidance_ran, false);

  assertBlocked("authority-flag-drift", {
    envelopeText: buildEnvelopeForCandidate(passEnvelopeText, {
      ...passCandidate,
      authority_flags: {
        ...passCandidate.authority_flags,
        codex_execution: true,
      },
    }),
  }, ["candidate authority flag must be false: codex_execution"]);
  const validateHelperDrift = clone(passPrepareSummary);
  validateHelperDrift.authority_flags.validate_helper_executed = true;
  assertBlocked("validate-helper-executed-drift", {
    prepareSummary: validateHelperDrift,
  }, ["prepare execution summary says validate_helper_executed is true"]);
}

function assertDryRunStillWorks() {
  const dryRun = runDryRun("dry-run-still-works", {
    sourceInputText: passSourceInputText,
    prepareSummary: passPrepareSummary,
    envelopeText: passEnvelopeText,
  });
  assert.equal(dryRun.summary.mode, "validate-orchestration-dry-run");
  assert.equal(dryRun.summary.dry_run_result, "ready_for_validate_execution");
  assert.equal(dryRun.summary.candidate_count, 1);
  assert.equal(dryRun.summary.authority_flags.validate_helper_executed, false);

  assertIncludesAll(runCliExpectFailure([
    "--dry-run",
    "--execute",
    "--source-input",
    passSourceInputFixtureFile,
    "--prepare-execution-summary",
    passPrepareSummaryFixtureFile,
    "--returned-envelope",
    passEnvelopeFixtureFile,
  ]), ["cannot use --dry-run and --execute together"]);
  assertIncludesAll(runCliExpectFailure([
    "--source-input",
    passSourceInputFixtureFile,
    "--prepare-execution-summary",
    passPrepareSummaryFixtureFile,
    "--returned-envelope",
    passEnvelopeFixtureFile,
  ]), ["requires either --dry-run or --execute"]);
  assertIncludesAll(runCliExpectFailure([
    "--execute",
    "--source-input",
    passSourceInputFixtureFile,
    "--prepare-execution-summary",
    passPrepareSummaryFixtureFile,
    "--returned-envelope",
    passEnvelopeFixtureFile,
    "--helper-command",
    "npm run something",
  ]), ["unknown option: --helper-command"]);
}

function assertDocsAndReport() {
  assertIncludesAll(`${docText}\n${reportText}`, [
    "Why Follows PR #523",
    "Execution Versus Dry-Run Boundary",
    "Local Execution Runs",
    "Local Execution Does Not Run",
    "PASS",
    "PASS with follow-up",
    "BLOCKED",
    "PASS does not mean approval",
    "review material only",
    "existing-validator-compatible",
    "codex_perspective_candidate_draft.v0.1",
    "codex_perspective_candidate_draft",
    "source_prompt_hash",
    "prompt_file_sha256",
    "source_prompt_hash is envelope/helper metadata provenance",
    "prompt_file_sha256 is a prompt artifact byte hash",
    "Dry-Run Summary Equivalence",
    "schema alignment only as a safety-net comparison",
    "Worker-Facing Guidance",
    "advisory-only",
    "Authority Boundary",
    "Skipped Browser/Computer-Use Checks",
    "Prepare validate result snapshots",
  ]);
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
    dryRunSmokeFile,
    docFile,
    reportFile,
    passSourceInputFixtureFile,
    passPrepareSummaryFixtureFile,
    followUpPrepareSummaryFixtureFile,
    passEnvelopeFixtureFile,
    blockedEnvelopeFixtureFile,
    passSummaryFixtureFile,
    followUpSummaryFixtureFile,
    blockedSummaryFixtureFile,
    validateResultSnapshotsLibFile,
    validateResultSnapshotsCliFile,
    validateResultSnapshotsSmokeFile,
    validateResultSnapshotsDocFile,
    validateResultSnapshotsReportFile,
    validateResultSessionPassFixtureFile,
    validateResultSessionFollowUpFixtureFile,
    validateResultSessionBlockedFixtureFile,
    validateResultInboxPassFixtureFile,
    validateResultInboxFollowUpFixtureFile,
    validateResultInboxBlockedFixtureFile,
    validateResultSnapshotSummaryFixtureFile,
  ]);
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `validate orchestration execution changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      changedFile === packageFile ||
        changedFile.startsWith("lib/") ||
        changedFile.startsWith("scripts/") ||
        changedFile.startsWith("docs/") ||
        changedFile.startsWith("reports/"),
      `validate orchestration execution must stay lib/CLI/smoke/docs/report/fixtures/package scope: ${changedFile}`,
    );
  }
}

function assertBlocked(name, overrides, expectedReasons) {
  const result = runScenario(name, overrides);
  assert.equal(result.summary.result_state, "BLOCKED");
  assert.equal(result.summary.execution_result, "blocked");
  for (const reason of expectedReasons) {
    assert(
      result.summary.blocked_reasons.some((blockedReason) =>
        blockedReason.includes(reason),
      ),
      `${name} expected blocked reason ${reason}`,
    );
  }
  assert.equal(result.summary.authority_flags.validate_helper_executed, false);
  return result;
}

function runFixtureScenario(name, {
  sourceInputFile,
  prepareSummaryFile,
  envelopeFile,
}) {
  const summaryPath = join(tmpRoot, `${name}.json`);
  const stdout = runCli([
    "--execute",
    "--generated-at",
    generatedAt,
    "--source-input",
    sourceInputFile,
    "--prepare-execution-summary",
    prepareSummaryFile,
    "--returned-envelope",
    envelopeFile,
    "--validation-summary-out",
    summaryPath,
  ]);
  return {
    stdout,
    summary: JSON.parse(readFileSync(summaryPath, "utf8")),
  };
}

function runScenario(name, {
  envelopeText = passEnvelopeText,
  prepareSummary = passPrepareSummary,
  sourceInputText = passSourceInputText,
} = {}) {
  const scenario = writeScenarioFiles(name, {
    sourceInputText,
    prepareSummary,
    envelopeText,
  });
  return runExecuteWithScenario(name, scenario);
}

function runDryRun(name, {
  envelopeText,
  prepareSummary,
  sourceInputText,
}) {
  const scenario = writeScenarioFiles(name, {
    sourceInputText,
    prepareSummary,
    envelopeText,
  });
  const stdout = runCli([
    "--dry-run",
    "--generated-at",
    generatedAt,
    "--source-input",
    scenario.sourceInputPath,
    "--prepare-execution-summary",
    scenario.prepareSummaryPath,
    "--returned-envelope",
    scenario.envelopePath,
    "--validation-summary-out",
    scenario.summaryPath,
  ]);
  return {
    stdout,
    summary: JSON.parse(readFileSync(scenario.summaryPath, "utf8")),
  };
}

function runExecuteWithScenario(name, {
  sourceInputPath,
  prepareSummaryPath,
  envelopePath,
  dryRunSummaryPath = null,
}) {
  const summaryPath = join(tmpRoot, `${name}-summary.json`);
  const args = [
    "--execute",
    "--generated-at",
    generatedAt,
    "--source-input",
    sourceInputPath,
    "--prepare-execution-summary",
    prepareSummaryPath,
    "--returned-envelope",
    envelopePath,
  ];
  if (dryRunSummaryPath && existsSync(dryRunSummaryPath)) {
    args.push("--dry-run-summary", dryRunSummaryPath);
  }
  args.push("--validation-summary-out", summaryPath);
  const stdout = runCli(args);
  return {
    stdout,
    summary: JSON.parse(readFileSync(summaryPath, "utf8")),
  };
}

function writeScenarioFiles(name, {
  sourceInputText,
  prepareSummary,
  envelopeText,
}) {
  const scenarioDir = join(tmpRoot, name);
  mkdirSync(scenarioDir, { recursive: true });
  const sourceInputPath = join(scenarioDir, "source-input.json");
  const prepareSummaryPath = join(scenarioDir, "prepare-summary.json");
  const envelopePath = join(scenarioDir, "returned-envelope.txt");
  const summaryPath = join(scenarioDir, "summary.json");
  const dryRunSummaryPath = join(scenarioDir, "dry-run-summary.json");
  writeFileSync(sourceInputPath, sourceInputText, "utf8");
  writeFileSync(prepareSummaryPath, `${JSON.stringify(prepareSummary, null, 2)}\n`, "utf8");
  writeFileSync(envelopePath, envelopeText, "utf8");
  return {
    sourceInputPath,
    prepareSummaryPath,
    envelopePath,
    summaryPath,
    dryRunSummaryPath,
  };
}

function runCli(args) {
  return execFileSync("npm", [
    "run",
    "perspective:codex-former:local-adapter:validate",
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

function buildEnvelopeForCandidate(envelopeText, candidate) {
  return buildEnvelopeForReturnedText(
    envelopeText,
    JSON.stringify(candidate, null, 2),
  );
}

function buildEnvelopeForReturnedText(envelopeText, returnedText) {
  return envelopeText.replace(
    /RETURNED_CODEX_RESPONSE:\s*[\s\S]*?\s*END RETURNED_CODEX_RESPONSE/,
    `RETURNED_CODEX_RESPONSE:\n${returnedText}\nEND RETURNED_CODEX_RESPONSE`,
  );
}

function extractCandidate(envelopeText) {
  const match = envelopeText.match(
    /RETURNED_CODEX_RESPONSE:\s*([\s\S]*?)\s*END RETURNED_CODEX_RESPONSE/,
  );
  assert(match, "envelope must include returned response bounds");
  return JSON.parse(match[1]);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
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
