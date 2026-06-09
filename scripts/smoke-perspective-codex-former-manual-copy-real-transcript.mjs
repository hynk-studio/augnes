import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const dogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-manual-copy-real-transcript.mjs";
const smokeFile =
  "scripts/smoke-perspective-codex-former-manual-copy-real-transcript.mjs";
const docFile =
  "docs/PERSPECTIVE_CODEX_FORMER_MANUAL_COPY_REAL_TRANSCRIPT_DOGFOOD_V0_1.md";
const reportFile =
  "reports/dogfood/2026-06-09-perspective-codex-former-manual-copy-real-transcript.md";
const captureInstructionsDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_REAL_TRANSCRIPT_CAPTURE_INSTRUCTIONS_V0_1.md";
const captureInstructionsReportFile =
  "reports/2026-06-09-perspective-codex-former-real-transcript-capture-instructions.md";
const captureInstructionsSmokeFile =
  "scripts/smoke-perspective-codex-former-real-transcript-capture-instructions.mjs";
const transcriptDogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-manual-copy-transcript.mjs";
const transcriptDogfoodSmokeFile =
  "scripts/smoke-perspective-codex-former-manual-copy-transcript.mjs";
const manualCopyPacketSmokeFile =
  "scripts/smoke-perspective-codex-former-manual-copy-packet.mjs";
const promptContractSmokeFile =
  "scripts/smoke-perspective-codex-former-prompt-contract.mjs";
const pipelineSmokeFile =
  "scripts/smoke-perspective-codex-former-pipeline.mjs";
const pipelineDogfoodSmokeFile =
  "scripts/smoke-perspective-codex-former-pipeline-dogfood.mjs";
const workerGuidanceSmokeFile =
  "scripts/smoke-perspective-worker-facing-guidance.mjs";
const candidateBuilderSmokeFile =
  "scripts/smoke-perspective-candidate-builder-fixture.mjs";

const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";
const allowedChangedFiles = new Set([
  packageFile,
  dogfoodScriptFile,
  smokeFile,
  docFile,
  reportFile,
  captureInstructionsDocFile,
  captureInstructionsReportFile,
  captureInstructionsSmokeFile,
  transcriptDogfoodScriptFile,
  transcriptDogfoodSmokeFile,
  manualCopyPacketSmokeFile,
  promptContractSmokeFile,
  pipelineSmokeFile,
  pipelineDogfoodSmokeFile,
  workerGuidanceSmokeFile,
  candidateBuilderSmokeFile,
]);

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));

const {
  MANUAL_COPY_REAL_TRANSCRIPT_DOGFOOD_ARTIFACT_PATH,
  MANUAL_COPY_REAL_TRANSCRIPT_DOGFOOD_DOC_PATH,
  MANUAL_COPY_REAL_TRANSCRIPT_DOGFOOD_RECOMMENDED_NEXT_PR,
  REAL_TRANSCRIPT_SOURCE_FORMER_INPUT_PACKET_ID,
  REAL_TRANSCRIPT_SOURCE_MANUAL_COPY_PACKET_ID,
  REAL_TRANSCRIPT_SOURCE_PROMPT_HASH,
  buildPerspectiveCodexFormerManualCopyRealTranscriptDogfood,
  deriveRealTranscriptDogfoodConclusion,
  extractCodexPerspectiveCandidateDraftFromTranscript,
  runPerspectiveCodexFormerManualCopyRealTranscriptDogfood,
} = await import("./dogfood-perspective-codex-former-manual-copy-real-transcript.mjs");

assert.equal(existsSync(dogfoodScriptFile), true, `${dogfoodScriptFile} must exist`);
assert.equal(existsSync(smokeFile), true, `${smokeFile} must exist`);
assert.equal(existsSync(docFile), true, `${docFile} must exist`);

assert.equal(
  packageJson.scripts[
    "dogfood:perspective-codex-former-manual-copy-real-transcript"
  ],
  `${expectedTsxCommand} ${dogfoodScriptFile}`,
  "package.json must register dogfood:perspective-codex-former-manual-copy-real-transcript",
);
assert.equal(
  packageJson.scripts[
    "smoke:perspective-codex-former-manual-copy-real-transcript"
  ],
  `${expectedTsxCommand} ${smokeFile}`,
  "package.json must register smoke:perspective-codex-former-manual-copy-real-transcript",
);

assertRealTranscriptDogfoodBuild();
assertCapturedRealTranscriptScenario();
assertExtractionFailureControl();
assertBadResponseRegressionControl();
assertDownstreamGuidanceSkipped();
assertExtractionHelperFailsClosed();
assertConclusionRules();
assertDocsAndReport();
assertNoForbiddenSurfaces();
assertChangedFileBoundary();

console.log("PASS smoke:perspective-codex-former-manual-copy-real-transcript");

function assertRealTranscriptDogfoodBuild() {
  const first = buildPerspectiveCodexFormerManualCopyRealTranscriptDogfood();
  const second = buildPerspectiveCodexFormerManualCopyRealTranscriptDogfood();

  assert.equal(first.artifact, second.artifact);
  assert.equal(first.paths.artifact, MANUAL_COPY_REAL_TRANSCRIPT_DOGFOOD_ARTIFACT_PATH);
  assert.equal(first.paths.doc, MANUAL_COPY_REAL_TRANSCRIPT_DOGFOOD_DOC_PATH);
  assert.equal(first.evaluation.conclusion, "BLOCKED");
  assert.equal(first.evaluation.real_transcript_available, true);
  assert.equal(first.evaluation.real_transcript_fixture_label, "real_human_started_codex_response");
  assert.equal(first.evaluation.manual_copy_packet_id_matches_transcript, true);
  assert.equal(first.scenarios.length, 4);
  assert.equal(first.artifact.includes("Conclusion: BLOCKED"), true);
  assert.equal(first.artifact.includes("real_human_started_codex_response"), true);
  assert.equal(
    first.artifact.includes(MANUAL_COPY_REAL_TRANSCRIPT_DOGFOOD_RECOMMENDED_NEXT_PR),
    true,
  );

  const written = runPerspectiveCodexFormerManualCopyRealTranscriptDogfood();
  assert.equal(written.artifact, first.artifact);
  assert.equal(readFileSync(reportFile, "utf8"), first.artifact);
}

function assertCapturedRealTranscriptScenario() {
  const dogfood = buildPerspectiveCodexFormerManualCopyRealTranscriptDogfood();
  const scenario = requireScenario(dogfood, "captured_real_transcript_main");

  assert.equal(scenario.fixture_label, "real_human_started_codex_response");
  assert.equal(scenario.conclusion, "BLOCKED");
  assert.equal(scenario.transcript_provenance.transcript_available, true);
  assert.equal(scenario.transcript_provenance.capture_method, "human_manual");
  assert.equal(
    scenario.transcript_provenance.source_manual_copy_packet_id,
    REAL_TRANSCRIPT_SOURCE_MANUAL_COPY_PACKET_ID,
  );
  assert.equal(
    scenario.transcript_provenance.source_former_input_packet_id,
    REAL_TRANSCRIPT_SOURCE_FORMER_INPUT_PACKET_ID,
  );
  assert.equal(
    scenario.transcript_provenance.source_prompt_hash,
    REAL_TRANSCRIPT_SOURCE_PROMPT_HASH,
  );
  assert.equal(
    scenario.transcript_provenance.prompt_was_generated_by_manual_copy_packet,
    true,
  );
  assert.equal(scenario.extraction.extraction_status, "extracted");
  assert.equal(scenario.extraction.extracted_candidate_count, 1);
  assert.equal(
    scenario.content_usefulness.adds_neutral_perspective_beyond_plain_summary,
    true,
  );
  assert.equal(scenario.contract_fit.status, "violates_contract");
  assertWarningKinds(scenario.contract_fit, ["pointer_ref", "authority_claim"]);
  assert.equal(scenario.strict_schema_compatibility.status, "drift_found");
  assert(
    scenario.strict_schema_compatibility.findings.some((finding) =>
      finding.includes("pointer refs use ref_type"),
    ),
    "real transcript must record pointer schema drift",
  );
  assert(
    scenario.strict_schema_compatibility.findings.some((finding) =>
      finding.includes("authority flags use model-friendly"),
    ),
    "real transcript must record authority flag schema drift",
  );
  assert.equal(scenario.validation_result.status, "blocked");
  assert.equal(scenario.validation_result.threw, false);
  assert.equal(scenario.candidate_review_material, null);
  assert(
    scenario.validation_result.blocked_reasons.some((reason) =>
      reason.includes("selected_material.changed_files"),
    ),
    "local validation must honestly block selected_material schema drift",
  );
  assertAuthorityFalse(scenario.validation_result.authority_flags);
}

function assertExtractionFailureControl() {
  const dogfood = buildPerspectiveCodexFormerManualCopyRealTranscriptDogfood();
  const scenario = requireScenario(
    dogfood,
    "transcript_extraction_failure_control",
  );

  assert.equal(scenario.fixture_label, "synthetic negative control");
  assert.equal(scenario.conclusion, "PASS");
  assert.equal(scenario.extraction.extraction_status, "blocked");
  assert.equal(scenario.extraction.extracted_candidate_count, 0);
  assert.equal(scenario.candidate_review_material, null);
}

function assertBadResponseRegressionControl() {
  const dogfood = buildPerspectiveCodexFormerManualCopyRealTranscriptDogfood();
  const scenario = requireScenario(dogfood, "bad_response_regression_control");

  assert.equal(scenario.fixture_label, "synthetic bad response control");
  assert.equal(scenario.conclusion, "PASS");
  assert.equal(scenario.contract_fit.status, "violates_contract");
  assert.equal(scenario.validation_result.status, "blocked");
  assert.equal(scenario.validation_result.candidate_review_material, null);
  assertWarningKinds(scenario.contract_fit, [
    "plain_summary",
    "missing_usefulness",
    "overconfident_basis",
    "pointer_ref",
    "missing_user_core_questions",
    "authority_claim",
  ]);
  assert(
    scenario.validation_result.blocked_reasons.includes(
      "draft includes forbidden authority claims",
    ),
    "bad response regression must block forbidden authority claims",
  );
}

function assertDownstreamGuidanceSkipped() {
  const dogfood = buildPerspectiveCodexFormerManualCopyRealTranscriptDogfood();
  const scenario = requireScenario(
    dogfood,
    "downstream_guidance_from_real_transcript",
  );

  assert.equal(scenario.conclusion, "PASS with follow-up");
  assert.equal(scenario.worker_guidance, null);
  assert.equal(scenario.guidance_input_shape.candidate_present, false);
  assert(
    scenario.dogfood_notes.some((note) =>
      note.includes("validation status was blocked"),
    ),
    "downstream guidance skip must include a concrete validation reason",
  );
}

function assertExtractionHelperFailsClosed() {
  assert.doesNotThrow(() => {
    const result = extractCodexPerspectiveCandidateDraftFromTranscript({
      transcript_available: false,
    });
    assert.equal(result.extraction_status, "blocked");
    assert.equal(result.extracted_candidate_count, 0);
    assert.equal(result.draft, null);
  });

  assert.doesNotThrow(() => {
    const result = extractCodexPerspectiveCandidateDraftFromTranscript({
      transcript_available: true,
      extracted_json_text: "{not-json",
    });
    assert.equal(result.extraction_status, "blocked");
    assert.equal(result.extracted_candidate_count, 0);
    assert.equal(result.draft, null);
  });
}

function assertConclusionRules() {
  assert.equal(
    deriveRealTranscriptDogfoodConclusion([
      {
        scenario_id: "captured_real_transcript_main",
        extraction: { extraction_status: "blocked" },
      },
    ]),
    "BLOCKED",
  );
  assert.equal(
    deriveRealTranscriptDogfoodConclusion([
      {
        scenario_id: "captured_real_transcript_main",
        extraction: { extraction_status: "extracted" },
        validation_result: { status: "needs_review" },
        candidate_review_material: { candidate_id: "candidate" },
        contract_fit: { status: "needs_review" },
      },
      {
        scenario_id: "downstream_guidance_from_real_transcript",
        conclusion: "PASS with follow-up",
      },
    ]),
    "PASS with follow-up",
  );
  assert.equal(
    deriveRealTranscriptDogfoodConclusion([
      {
        scenario_id: "captured_real_transcript_main",
        extraction: { extraction_status: "extracted" },
        validation_result: { status: "needs_review" },
        candidate_review_material: { candidate_id: "candidate" },
        contract_fit: { status: "fits_contract" },
        worker_guidance: { advisory_only: true },
      },
      {
        scenario_id: "downstream_guidance_from_real_transcript",
        conclusion: "PASS",
      },
    ]),
    "PASS",
  );
}

function assertDocsAndReport() {
  const docText = readFileSync(docFile, "utf8");
  const reportText = readFileSync(reportFile, "utf8");

  assertContainsAll(docText, [
    "Perspective Codex Former Manual Copy Real Transcript Dogfood v0.1",
    "PR #482",
    "real_human_started_codex_response",
    "human_manual",
    "validateAndNormalizeCodexPerspectiveCandidateDraft",
    "selected material schema drift",
    "pointer schema drift",
    "authority flag schema drift",
    "Worker-Facing Guidance",
    MANUAL_COPY_REAL_TRANSCRIPT_DOGFOOD_RECOMMENDED_NEXT_PR,
  ]);
  assertContainsAll(reportText, [
    "Perspective Codex Former Manual Copy Real Transcript Dogfood",
    "Conclusion: BLOCKED",
    "real_human_started_codex_response",
    "Exactly one candidate draft extracted: yes",
    "Contract-Fit Result",
    "Local Validation Result",
    "Worker-Facing Guidance was skipped",
    "BLOCKED with useful findings",
    MANUAL_COPY_REAL_TRANSCRIPT_DOGFOOD_RECOMMENDED_NEXT_PR,
  ]);
  assertNoRawUnsafeMarkersInPublicText("real transcript dogfood doc", docText);
  assertNoRawUnsafeMarkersInPublicText("real transcript dogfood report", reportText);
}

function assertNoForbiddenSurfaces() {
  const dogfoodText = readFileSync(dogfoodScriptFile, "utf8");
  const docText = readFileSync(docFile, "utf8");
  const reportText = readFileSync(reportFile, "utf8");
  const smokeText = readFileSync(smokeFile, "utf8");

  for (const [label, text] of [
    ["dogfood", dogfoodText],
    ["doc", docText],
    ["report", reportText],
    ["smoke", smokeText],
  ]) {
    for (const forbidden of [
      ["process", "env"].join("."),
      ["fetch", "("].join(""),
      ["api.github", ".com"].join(""),
      ["api.openai", ".com"].join(""),
      ["OPENAI", "_API_KEY"].join(""),
      ["GITHUB", "_TOKEN"].join(""),
      ["navigator", ".clipboard"].join(""),
      ["app", "/api/"].join(""),
      ["pris", "ma"].join(""),
      ["migr", "ations"].join(""),
    ]) {
      assert.equal(
        text.includes(forbidden),
        false,
        `${label} must not introduce forbidden surface ${forbidden}`,
      );
    }
  }
}

function assertChangedFileBoundary() {
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `Manual copy real transcript dogfood changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith(["app", "/api/"].join("")) &&
        !changedFile.startsWith("components/") &&
        !changedFile.startsWith("db/") &&
        !changedFile.startsWith(["migr", "ations/"].join("")) &&
        !changedFile.includes("codex-sdk") &&
        !changedFile.includes("graph-db") &&
        !changedFile.includes("persistence"),
      `Manual copy real transcript dogfood must not change forbidden surfaces: ${changedFile}`,
    );
  }
}

function requireScenario(dogfood, scenarioId) {
  const scenario = dogfood.scenarios.find(
    (candidate) => candidate.scenario_id === scenarioId,
  );
  assert(scenario, `missing scenario ${scenarioId}`);
  return scenario;
}

function assertWarningKinds(contractFit, expectedKinds) {
  const warningKinds = new Set(
    contractFit.warnings.map((warning) => warning.warning_kind),
  );

  for (const expectedKind of expectedKinds) {
    assert(
      warningKinds.has(expectedKind),
      `expected contract-fit warning ${expectedKind}`,
    );
  }
}

function assertContainsAll(value, expectedSnippets) {
  for (const snippet of expectedSnippets) {
    assert(
      value.includes(snippet),
      `Expected text to include ${JSON.stringify(snippet)}`,
    );
  }
}

function assertAuthorityFalse(flags) {
  assert(flags, "authority flags must exist");
  assert(
    Object.values(flags).every((value) => value === false),
    "authority flags must remain false",
  );
}

function assertNoRawUnsafeMarkersInPublicText(label, value) {
  for (const forbiddenMarker of [
    ["billing", "_payload"].join(""),
    ["token", "_payload"].join(""),
    ["oauth", "_payload"].join(""),
    ["raw_pasted", "_text"].join(""),
    ["raw_source", "_payload"].join(""),
    ["raw_candidate", "_payload"].join(""),
    ["raw_private", "_payload"].join(""),
    ["private", "_payload"].join(""),
    ["provider", "_payload"].join(""),
    ["oauth", "_token"].join(""),
    ["access", "_token"].join(""),
    ["refresh", "_token"].join(""),
    ["api", "_key"].join(""),
    ["hidden", "_reasoning"].join(""),
    ["generated_model", "_payload"].join(""),
    ["sk-proj", "-"].join(""),
    ["ghp", "_"].join(""),
    ["gho", "_"].join(""),
    ["ghu", "_"].join(""),
    ["ghs", "_"].join(""),
    ["ghr", "_"].join(""),
  ]) {
    assert.equal(
      value.includes(forbiddenMarker),
      false,
      `${label} must not include unsafe marker: ${forbiddenMarker}`,
    );
  }
  assert.equal(
    new RegExp(`\\b${["secr", "et"].join("")}\\b`, "i").test(value),
    false,
    `${label} must not include unsafe marker: ${["secr", "et"].join("")}`,
  );
}

function collectChangedFiles() {
  const workingTreeFiles = gitLinesOrEmpty(["diff", "--name-only", "HEAD"]);
  const branchFiles = collectBranchChangedFiles();
  const untrackedFiles = gitLinesOrEmpty([
    "ls-files",
    "--others",
    "--exclude-standard",
  ]);
  const changedFiles = Array.from(
    new Set([...workingTreeFiles, ...branchFiles, ...untrackedFiles]),
  ).filter(Boolean);

  if (changedFiles.length === 0 && isCommittedBranch()) {
    throw new Error(
      "Manual copy real transcript dogfood smoke collected no changed files",
    );
  }

  return changedFiles;
}

function collectBranchChangedFiles() {
  const originMainFiles = gitLinesStrict([
    "diff",
    "--name-only",
    "origin/main...HEAD",
  ]);
  if (originMainFiles) {
    return originMainFiles;
  }

  return gitLinesOrEmpty(["diff", "--name-only", "HEAD"]);
}

function isCommittedBranch() {
  try {
    execFileSync("git", ["rev-parse", "--verify", "HEAD^"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return true;
  } catch {
    return false;
  }
}

function gitLinesStrict(args) {
  return parseGitLines(
    execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }),
  );
}

function gitLinesOrEmpty(args) {
  try {
    return gitLinesStrict(args);
  } catch {
    return [];
  }
}

function parseGitLines(output) {
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
