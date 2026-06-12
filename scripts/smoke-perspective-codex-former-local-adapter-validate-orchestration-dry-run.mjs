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
const smokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-validate-orchestration-dry-run.mjs";
const docFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_ORCHESTRATION_DRY_RUN_V0_1.md";
const reportFile =
  "reports/2026-06-12-perspective-codex-former-local-adapter-validate-orchestration-dry-run.md";
const designDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_ORCHESTRATION_DESIGN_V0_1.md";
const sourceInputFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-source-input.json";
const prepareExecutionSummaryFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-prepare-execution-summary-success.json";
const returnedEnvelopeFixtureFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-returned-candidate-envelope-ready.txt";
const readySummaryFixtureFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-dry-run-summary-ready.json";
const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";
const tmpRoot =
  "/tmp/augnes-codex-former-local-adapter-validate-orchestration-dry-run-smoke";
const generatedAt = "2026-06-12T00:00:00.000Z";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const libText = readFileSync(libFile, "utf8");
const cliText = readFileSync(cliFile, "utf8");
const smokeText = readFileSync(smokeFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");
const sourceInputText = readFileSync(sourceInputFixtureFile, "utf8");
const prepareSummaryText = readFileSync(prepareExecutionSummaryFixtureFile, "utf8");
const prepareSummary = JSON.parse(prepareSummaryText);
const readyEnvelopeText = readFileSync(returnedEnvelopeFixtureFile, "utf8");
const readySummaryFixture = JSON.parse(readFileSync(readySummaryFixtureFile, "utf8"));
const readyCandidate = extractReadyCandidate();

rmSync(tmpRoot, { recursive: true, force: true });
mkdirSync(tmpRoot, { recursive: true });

assertPackageScripts();
assertFilesExist();
assertSourceContracts();
assertHappyPath();
assertPromptFileComparableMatch();
assertNegativeCoverage();
assertDocsAndReport();
assertNoForbiddenImplementationSurfaces();
assertChangedFileBoundary();

console.log(
  "PASS smoke:perspective-codex-former-local-adapter-validate-orchestration-dry-run",
);

function assertPackageScripts() {
  assert.equal(
    packageJson.scripts["perspective:codex-former:local-adapter:validate"],
    `${expectedTsxCommand} ${cliFile}`,
  );
  assert.equal(
    packageJson.scripts[
      "smoke:perspective-codex-former-local-adapter-validate-orchestration-dry-run"
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
    designDocFile,
    sourceInputFixtureFile,
    prepareExecutionSummaryFixtureFile,
    returnedEnvelopeFixtureFile,
    readySummaryFixtureFile,
  ]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }
}

function assertSourceContracts() {
  assertIncludesAll(libText, [
    "codex_former_local_adapter_validate_dry_run_summary.v0.1",
    "validate-orchestration-dry-run",
    "ready_for_validate_execution",
    "blocked_before_validate_execution",
    "warnings_before_validate_execution",
    "codex_perspective_candidate_draft.v0.1",
    "codex_perspective_candidate_draft",
    "source_former_input_packet",
    "source_prompt_hash",
    "prompt_file_sha256",
    "validate_helper_executed: false",
    "returned_candidate_treated_as_trusted_runtime_state: false",
    "candidate_material_is_review_only: true",
    "buildCodexFormerLocalAdapterValidateDryRunSummary",
    "parseReturnedCandidateEnvelope",
    "extractCandidateDrafts",
    "headerText",
    "ambiguous returned candidate material",
    "invalid draft field shape: selected_material.changed_files must be an array",
    "invalid draft field shape: selected_material.source_pr_refs must be an array",
    "invalid draft field shape: basis_quality_suggestion.reasons must be an array",
    "source_former_input_packet.role is missing or wrong",
  ]);
  assertIncludesAll(cliText, [
    "--dry-run",
    "--execute is not implemented in this dry-run slice",
    "validate orchestration cannot use --dry-run and --execute together",
    "validate dry-run requires --",
    "validate_helper_executed=false",
    "authority_boundary=review-only local-only non-authorizing",
  ]);
}

function assertHappyPath() {
  const { stdout, summary } = runScenario("ready", {});
  assertIncludesAll(stdout, [
    "mode=validate-orchestration-dry-run",
    "dry_run_result=ready_for_validate_execution",
    "candidate_count=1",
    "candidate_shape_status=existing_validator_compatible",
    "direct_validation_prerequisites_status=present",
    "worker_facing_guidance_eligibility=planned_after_direct_validation",
    "validate_helper_executed=false",
  ]);
  assert.equal(summary.summary_version, readySummaryFixture.summary_version);
  assert.equal(summary.mode, "validate-orchestration-dry-run");
  assert.equal(summary.dry_run_result, "ready_for_validate_execution");
  assert.equal(summary.candidate_count, 1);
  assert.equal(summary.candidate_shape_status, "existing_validator_compatible");
  assert.equal(summary.source_manual_copy_packet_id_match, true);
  assert.equal(summary.former_input_packet_id_match, true);
  assert.equal(summary.source_prompt_hash_match, true);
  assert.notEqual(summary.dry_run_result, "PASS");
  assert.notEqual(summary.dry_run_result, "PASS with follow-up");
  assert.notEqual(summary.dry_run_result, "BLOCKED");
  assert.equal(summary.authority_flags.validate_helper_executed, false);
  assert.equal(summary.returned_candidate_treated_as_trusted_runtime_state, false);
  assert.equal(summary.candidate_material_is_review_only, true);
}

function assertPromptFileComparableMatch() {
  const promptText = "bounded prompt artifact for prompt_file_sha256 comparison\n";
  const promptPath = join(tmpRoot, "matching-prompt.txt");
  writeFileSync(promptPath, promptText, "utf8");
  const comparablePrepareSummary = clone(prepareSummary);
  comparablePrepareSummary.helper_output_paths.prompt_path = promptPath;
  comparablePrepareSummary.helper_metadata_checks.prompt_file_sha256 =
    sha256(promptText);
  const { summary } = runScenario("prompt-file-sha-match", {
    prepareSummary: comparablePrepareSummary,
  });
  assert.equal(summary.prompt_file_sha256_match, true);
  assert.equal(summary.dry_run_result, "ready_for_validate_execution");
}

function assertNegativeCoverage() {
  assertMissingReturnedEnvelope();
  assertExecuteFlagsRejected();
  assertBlocked("missing-bounds", {
    envelopeText: readyEnvelopeText.replace("RETURNED_CODEX_RESPONSE:", "RETURNED_CODEX_RESPONSE_MISSING:"),
  }, ["RETURNED_CODEX_RESPONSE bounds missing"]);
  assertBlocked("header-source-prompt-from-response-not-trusted", {
    envelopeText: removeHeaderField(
      buildEnvelopeForReturnedText(
        `source_prompt_hash: 2xhw7m\n${JSON.stringify(readyCandidate, null, 2)}`,
      ),
      "source_prompt_hash",
    ),
  }, ["source_prompt_hash is required"]);
  assertBlocked("header-manual-copy-from-response-not-trusted", {
    envelopeText: removeHeaderField(
      buildEnvelopeForReturnedText(
        `source_manual_copy_packet_id: manual-codex-former-copy:v0.1:1d44vfz\n${JSON.stringify(readyCandidate, null, 2)}`,
      ),
      "source_manual_copy_packet_id",
    ),
  }, ["source_manual_copy_packet_id is required"]);
  assertBlocked("header-former-input-from-response-not-trusted", {
    envelopeText: removeHeaderField(
      buildEnvelopeForReturnedText(
        `source_former_input_packet_id: codex-perspective-former-input:v0.1:project-augnes-ag-codex-former-local-adapter-man:10f6ami\n${JSON.stringify(readyCandidate, null, 2)}`,
      ),
      "source_former_input_packet_id",
    ),
  }, ["source_former_input_packet_id is required"]);
  assertBlocked("candidate-zero", {
    envelopeText: buildEnvelopeForReturnedText("bounded prose without candidate JSON"),
  }, ["expected exactly one existing-validator-compatible candidate draft; found 0"]);
  assertBlocked("candidate-multiple", {
    envelopeText: buildEnvelopeForReturnedText(
      `${JSON.stringify(readyCandidate)}\n${JSON.stringify(readyCandidate)}`,
    ),
  }, ["candidate_count multiple is blocked before validate execution"]);
  assertBlocked("candidate-valid-plus-wrong-shape", {
    envelopeText: buildEnvelopeForReturnedText(
      `${JSON.stringify(readyCandidate)}\n${JSON.stringify({
        draft_version: "codex_perspective_candidate_draft.v0.1",
        draft_kind: "codex_perspective_candidate_draft",
      })}`,
    ),
  }, [
    "ambiguous returned candidate material contains multiple JSON objects",
    "candidate[1].source_former_input_packet is missing",
  ]);
  assertBlocked("unsupported-version-kind", {
    envelopeText: buildEnvelopeForCandidate({
      ...readyCandidate,
      draft_version: "v0.1",
      draft_kind: "CodexPerspectiveCandidateDraft",
    }),
  }, ["candidate[0].draft_version is unsupported", "candidate[0].draft_kind is unsupported"]);
  const missingFieldCandidate = clone(readyCandidate);
  delete missingFieldCandidate.thesis;
  assertBlocked("missing-required-field", {
    envelopeText: buildEnvelopeForCandidate(missingFieldCandidate),
  }, ["candidate[0].thesis is missing"]);
  assertBlocked("selected-changed-files-not-array", {
    envelopeText: buildEnvelopeForCandidate({
      ...readyCandidate,
      selected_material: {
        ...readyCandidate.selected_material,
        changed_files: "not-array",
      },
    }),
  }, ["invalid draft field shape: selected_material.changed_files must be an array"]);
  assertBlocked("selected-source-pr-refs-not-array", {
    envelopeText: buildEnvelopeForCandidate({
      ...readyCandidate,
      selected_material: {
        ...readyCandidate.selected_material,
        source_pr_refs: "not-array",
      },
    }),
  }, ["invalid draft field shape: selected_material.source_pr_refs must be an array"]);
  assertBlocked("basis-reasons-not-array", {
    envelopeText: buildEnvelopeForCandidate({
      ...readyCandidate,
      basis_quality_suggestion: {
        ...readyCandidate.basis_quality_suggestion,
        reasons: "not-array",
      },
    }),
  }, ["invalid draft field shape: basis_quality_suggestion.reasons must be an array"]);
  assertBlocked("source-former-role-wrong", {
    envelopeText: buildEnvelopeForCandidate({
      ...readyCandidate,
      source_former_input_packet: {
        ...readyCandidate.source_former_input_packet,
        role: "wrong_role",
      },
    }),
  }, ["candidate[0].source_former_input_packet.role is missing or wrong"]);
  assertBlocked("former-input-mismatch", {
    envelopeText: buildEnvelopeForCandidate({
      ...readyCandidate,
      source_former_input_packet: {
        ...readyCandidate.source_former_input_packet,
        packet_id: "codex-perspective-former-input:v0.1:mismatch",
      },
    }),
  }, ["candidate.source_former_input_packet.packet_id does not match envelope source_former_input_packet_id"]);
  assertBlocked("manual-copy-id-mismatch", {
    envelopeText: readyEnvelopeText.replace(
      "source_manual_copy_packet_id: manual-codex-former-copy:v0.1:1d44vfz",
      "source_manual_copy_packet_id: manual-codex-former-copy:v0.1:mismatch",
    ),
  }, ["source_manual_copy_packet_id does not match prepare provenance"]);
  assertBlocked("source-prompt-hash-mismatch", {
    envelopeText: readyEnvelopeText.replace(
      "source_prompt_hash: 2xhw7m",
      "source_prompt_hash: mismatch",
    ),
  }, ["source_prompt_hash does not match prepare provenance"]);
  const promptPath = join(tmpRoot, "mismatched-prompt.txt");
  writeFileSync(promptPath, "mismatched prompt bytes\n", "utf8");
  const promptMismatchSummary = clone(prepareSummary);
  promptMismatchSummary.helper_output_paths.prompt_path = promptPath;
  promptMismatchSummary.helper_metadata_checks.prompt_file_sha256 = sha256(
    "different expected bytes\n",
  );
  assertBlocked("prompt-file-sha-mismatch", {
    prepareSummary: promptMismatchSummary,
  }, ["prompt_file_sha256 does not match prompt artifact bytes"]);
  const wrongModeSummary = clone(prepareSummary);
  wrongModeSummary.mode = "prepare-orchestration-dry-run";
  assertBlocked("prepare-wrong-mode", {
    prepareSummary: wrongModeSummary,
  }, ["prepare execution summary mode must be prepare-orchestration-execution"]);
  const sourceMismatch = JSON.stringify(
    { ...JSON.parse(sourceInputText), generated_at: "2026-06-12T01:00:00.000Z" },
    null,
    2,
  );
  assertBlocked("source-input-hash-mismatch", {
    sourceInputText: `${sourceMismatch}\n`,
  }, ["source input hash does not match prepare execution summary"]);
  assertBlocked("authority-flag-drift", {
    envelopeText: buildEnvelopeForCandidate({
      ...readyCandidate,
      authority_flags: {
        ...readyCandidate.authority_flags,
        codex_execution: true,
      },
    }),
  }, ["candidate authority flag must be false: codex_execution"]);
  const validateHelperDrift = clone(prepareSummary);
  validateHelperDrift.authority_flags.validate_helper_executed = true;
  assertBlocked("validate-helper-executed-drift", {
    prepareSummary: validateHelperDrift,
  }, ["prepare execution summary says validate_helper_executed is true"]);
}

function assertMissingReturnedEnvelope() {
  assert.throws(
    () =>
      runCli([
        "--dry-run",
        "--source-input",
        sourceInputFixtureFile,
        "--prepare-execution-summary",
        prepareExecutionSummaryFixtureFile,
        "--returned-envelope",
        join(tmpRoot, "missing-envelope.txt"),
        "--validation-summary-out",
        join(tmpRoot, "missing-envelope-summary.json"),
      ]),
    /validate.returned_envelope_path file does not exist/,
  );
}

function assertExecuteFlagsRejected() {
  assertIncludesAll(runCliExpectFailure([
    "--execute",
    "--source-input",
    sourceInputFixtureFile,
    "--prepare-execution-summary",
    prepareExecutionSummaryFixtureFile,
    "--returned-envelope",
    returnedEnvelopeFixtureFile,
  ]), ["--execute is not implemented in this dry-run slice"]);
  assertIncludesAll(runCliExpectFailure([
    "--dry-run",
    "--execute",
    "--source-input",
    sourceInputFixtureFile,
    "--prepare-execution-summary",
    prepareExecutionSummaryFixtureFile,
    "--returned-envelope",
    returnedEnvelopeFixtureFile,
  ]), ["cannot use --dry-run and --execute together"]);
}

function assertBlocked(name, overrides, expectedReasons) {
  const { summary } = runScenario(name, overrides);
  assert.equal(summary.dry_run_result, "blocked_before_validate_execution");
  for (const reason of expectedReasons) {
    assert(
      summary.blocked_reasons.some((blockedReason) =>
        blockedReason.includes(reason),
      ),
      `${name} expected blocked reason ${reason}`,
    );
  }
  assert.equal(summary.authority_flags.validate_helper_executed, false);
}

function assertDocsAndReport() {
  assertIncludesAll(`${docText}\n${reportText}`, [
    "Why Follows PR #522",
    "Dry-Run Versus Execution Boundary",
    "Exactly-One Candidate Rule",
    "Existing-Validator-Compatible Candidate Draft Shape",
    "codex_perspective_candidate_draft.v0.1",
    "codex_perspective_candidate_draft",
    "source_former_input_packet",
    "source_prompt_hash versus prompt_file_sha256",
    "source_prompt_hash is envelope/helper metadata provenance",
    "prompt_file_sha256 is prompt artifact byte hash",
    "Provenance Matching Behavior",
    "Planned Direct Validation Steps",
    "Worker-Facing Guidance Eligibility",
    "Authority Boundary",
    "Skipped Browser/Computer-Use Checks",
    "Implement local Codex adapter validate orchestration execution",
  ]);
}

function assertNoForbiddenImplementationSurfaces() {
  for (const [label, text] of [
    ["lib", libText],
    ["cli", cliText],
    ["smoke", smokeText],
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
    docFile,
    reportFile,
    returnedEnvelopeFixtureFile,
    readySummaryFixtureFile,
  ]);
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `validate orchestration dry-run changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      changedFile === packageFile ||
        changedFile.startsWith("lib/") ||
        changedFile.startsWith("scripts/") ||
        changedFile.startsWith("docs/") ||
        changedFile.startsWith("reports/"),
      `validate orchestration dry-run must stay lib/scripts/docs/report/fixtures/package scope: ${changedFile}`,
    );
  }
}

function runScenario(name, {
  envelopeText = readyEnvelopeText,
  prepareSummary: prepareSummaryOverride = prepareSummary,
  sourceInputText: sourceInputTextOverride = sourceInputText,
} = {}) {
  const scenarioDir = join(tmpRoot, name);
  mkdirSync(scenarioDir, { recursive: true });
  const sourceInputPath = join(scenarioDir, "source-input.json");
  const prepareSummaryPath = join(scenarioDir, "prepare-summary.json");
  const envelopePath = join(scenarioDir, "returned-envelope.txt");
  const summaryPath = join(scenarioDir, "summary.json");
  writeFileSync(sourceInputPath, sourceInputTextOverride, "utf8");
  writeFileSync(
    prepareSummaryPath,
    `${JSON.stringify(prepareSummaryOverride, null, 2)}\n`,
    "utf8",
  );
  writeFileSync(envelopePath, envelopeText, "utf8");
  const stdout = runCli([
    "--dry-run",
    "--generated-at",
    generatedAt,
    "--source-input",
    sourceInputPath,
    "--prepare-execution-summary",
    prepareSummaryPath,
    "--returned-envelope",
    envelopePath,
    "--validation-summary-out",
    summaryPath,
  ]);
  return {
    stdout,
    summary: JSON.parse(readFileSync(summaryPath, "utf8")),
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

function buildEnvelopeForCandidate(candidate) {
  return buildEnvelopeForReturnedText(JSON.stringify(candidate, null, 2));
}

function buildEnvelopeForReturnedText(returnedText) {
  return readyEnvelopeText.replace(
    /RETURNED_CODEX_RESPONSE:\s*[\s\S]*?\s*END RETURNED_CODEX_RESPONSE/,
    `RETURNED_CODEX_RESPONSE:\n${returnedText}\nEND RETURNED_CODEX_RESPONSE`,
  );
}

function removeHeaderField(envelopeText, fieldName) {
  return envelopeText.replace(new RegExp(`^${fieldName}: .+\\n`, "m"), "");
}

function extractReadyCandidate() {
  const match = readyEnvelopeText.match(
    /RETURNED_CODEX_RESPONSE:\s*([\s\S]*?)\s*END RETURNED_CODEX_RESPONSE/,
  );
  assert(match, "ready envelope must include returned response bounds");
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
