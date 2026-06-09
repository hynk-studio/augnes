import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const dogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-manual-copy-transcript.mjs";
const smokeFile =
  "scripts/smoke-perspective-codex-former-manual-copy-transcript.mjs";
const docFile =
  "docs/PERSPECTIVE_CODEX_FORMER_MANUAL_COPY_TRANSCRIPT_DOGFOOD_V0_1.md";
const reportFile =
  "reports/dogfood/2026-06-09-perspective-codex-former-manual-copy-transcript.md";
const manualCopyPacketDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_MANUAL_COPY_PACKET_V0_1.md";
const manualCopyPacketReportFile =
  "reports/2026-06-09-perspective-codex-former-manual-copy-packet.md";
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
const realTranscriptCaptureInstructionsDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_REAL_TRANSCRIPT_CAPTURE_INSTRUCTIONS_V0_1.md";
const realTranscriptCaptureInstructionsReportFile =
  "reports/2026-06-09-perspective-codex-former-real-transcript-capture-instructions.md";
const realTranscriptCaptureInstructionsSmokeFile =
  "scripts/smoke-perspective-codex-former-real-transcript-capture-instructions.mjs";
const realTranscriptDogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-manual-copy-real-transcript.mjs";
const realTranscriptDogfoodSmokeFile =
  "scripts/smoke-perspective-codex-former-manual-copy-real-transcript.mjs";
const realTranscriptDogfoodDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_MANUAL_COPY_REAL_TRANSCRIPT_DOGFOOD_V0_1.md";
const realTranscriptDogfoodReportFile =
  "reports/dogfood/2026-06-09-perspective-codex-former-manual-copy-real-transcript.md";
const draftSchemaAlignmentHelperFile =
  "lib/perspective-ingest/perspective-codex-candidate-draft-schema-alignment.ts";
const draftSchemaAlignmentDogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-draft-schema-alignment.mjs";
const draftSchemaAlignmentSmokeFile =
  "scripts/smoke-perspective-codex-former-draft-schema-alignment.mjs";
const draftSchemaAlignmentDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_DRAFT_SCHEMA_ALIGNMENT_V0_1.md";
const draftSchemaAlignmentReportFile =
  "reports/2026-06-09-perspective-codex-former-draft-schema-alignment.md";

const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";
const allowedChangedFiles = new Set([
  packageFile,
  dogfoodScriptFile,
  smokeFile,
  docFile,
  reportFile,
  manualCopyPacketDocFile,
  manualCopyPacketReportFile,
  manualCopyPacketSmokeFile,
  promptContractSmokeFile,
  pipelineSmokeFile,
  pipelineDogfoodSmokeFile,
  workerGuidanceSmokeFile,
  candidateBuilderSmokeFile,
  realTranscriptCaptureInstructionsDocFile,
  realTranscriptCaptureInstructionsReportFile,
  realTranscriptCaptureInstructionsSmokeFile,
  realTranscriptDogfoodScriptFile,
  realTranscriptDogfoodSmokeFile,
  realTranscriptDogfoodDocFile,
  realTranscriptDogfoodReportFile,
  draftSchemaAlignmentHelperFile,
  draftSchemaAlignmentDogfoodScriptFile,
  draftSchemaAlignmentSmokeFile,
  draftSchemaAlignmentDocFile,
  draftSchemaAlignmentReportFile,
]);

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));

const {
  MANUAL_COPY_TRANSCRIPT_DOGFOOD_ARTIFACT_PATH,
  MANUAL_COPY_TRANSCRIPT_DOGFOOD_NEXT_PR,
  buildPerspectiveCodexFormerManualCopyTranscriptDogfood,
  deriveTranscriptDogfoodConclusion,
  extractCodexPerspectiveCandidateDraftFromTranscript,
  runPerspectiveCodexFormerManualCopyTranscriptDogfood,
} = await import("./dogfood-perspective-codex-former-manual-copy-transcript.mjs");

assert.equal(existsSync(dogfoodScriptFile), true, `${dogfoodScriptFile} must exist`);
assert.equal(existsSync(smokeFile), true, `${smokeFile} must exist`);
assert.equal(existsSync(docFile), true, `${docFile} must exist`);

assert.equal(
  packageJson.scripts["dogfood:perspective-codex-former-manual-copy-transcript"],
  `${expectedTsxCommand} ${dogfoodScriptFile}`,
  "package.json must register dogfood:perspective-codex-former-manual-copy-transcript",
);
assert.equal(
  packageJson.scripts["smoke:perspective-codex-former-manual-copy-transcript"],
  `${expectedTsxCommand} ${smokeFile}`,
  "package.json must register smoke:perspective-codex-former-manual-copy-transcript",
);

assertDogfoodBuildIsBlockedAndDeterministic();
assertRealTranscriptUnavailableScenario();
assertExtractionFailureScenario();
assertBadResponseRegressionScenario();
assertDownstreamGuidanceSkipped();
assertSyntheticDownstreamGuidancePositiveControl();
assertExtractionHelperFailsClosed();
assertConclusionRules();
assertDocsAndReport();
assertNoForbiddenSurfaces();
assertChangedFileBoundary();

console.log("PASS smoke:perspective-codex-former-manual-copy-transcript");

function assertDogfoodBuildIsBlockedAndDeterministic() {
  const first = buildPerspectiveCodexFormerManualCopyTranscriptDogfood();
  const second = buildPerspectiveCodexFormerManualCopyTranscriptDogfood();

  assert.equal(first.artifact, second.artifact);
  assert.equal(first.paths.artifact, MANUAL_COPY_TRANSCRIPT_DOGFOOD_ARTIFACT_PATH);
  assert.equal(first.evaluation.conclusion, "BLOCKED");
  assert.equal(first.evaluation.real_transcript_available, false);
  assert.equal(first.scenarios.length, 5);
  assert.equal(first.artifact.includes("Conclusion: BLOCKED"), true);
  assert.equal(first.artifact.includes("Real transcript available: No"), true);
  assert.equal(
    first.artifact.includes("No real transcript was supplied"),
    true,
  );
  assert.equal(
    first.artifact.includes(MANUAL_COPY_TRANSCRIPT_DOGFOOD_NEXT_PR),
    true,
  );
  assertNoUnsafeMarkerText("dogfood artifact", first.artifact);
  assertNoUnsafeMarkerText("dogfood object", first);

  const written = runPerspectiveCodexFormerManualCopyTranscriptDogfood();
  assert.equal(written.artifact, first.artifact);
  assert.equal(readFileSync(reportFile, "utf8"), first.artifact);
}

function assertRealTranscriptUnavailableScenario() {
  const dogfood = buildPerspectiveCodexFormerManualCopyTranscriptDogfood();
  const scenario = requireScenario(
    dogfood,
    "real_transcript_ready_or_needs_review",
  );

  assert.equal(scenario.conclusion, "BLOCKED");
  assert.equal(scenario.transcript_provenance.transcript_available, false);
  assert.equal(
    scenario.transcript_provenance.prompt_was_generated_by_manual_copy_packet,
    true,
  );
  assert.equal(scenario.extraction.extraction_status, "blocked");
  assert.equal(scenario.candidate_review_material, null);
  assert.equal(scenario.worker_guidance, null);
  assert(
    scenario.blocked_reasons.some((reason) =>
      reason.includes("real human-started Codex response transcript"),
    ),
    "main scenario must state that no real transcript was supplied",
  );
  assertAuthorityFalse(scenario.transcript_provenance.authority_flags);
  assertNoUnsafeMarkerText("real transcript unavailable scenario", scenario);
}

function assertExtractionFailureScenario() {
  const dogfood = buildPerspectiveCodexFormerManualCopyTranscriptDogfood();
  const scenario = requireScenario(dogfood, "transcript_extraction_failure_case");

  assert.equal(scenario.fixture_label, "synthetic negative control");
  assert.equal(scenario.conclusion, "PASS");
  assert.equal(scenario.extraction.extraction_status, "blocked");
  assert.equal(scenario.candidate_review_material, null);
  assert.equal(scenario.worker_guidance, null);
  assertNoUnsafeMarkerText("extraction failure scenario", scenario);
}

function assertBadResponseRegressionScenario() {
  const dogfood = buildPerspectiveCodexFormerManualCopyTranscriptDogfood();
  const scenario = requireScenario(
    dogfood,
    "real_or_control_bad_response_regression",
  );

  assert.equal(scenario.fixture_label, "synthetic bad response control");
  assert.equal(scenario.conclusion, "PASS");
  assert.equal(scenario.contract_fit.status, "violates_contract");
  assert.equal(scenario.validation_result.status, "blocked");
  assert.equal(scenario.validation_result.candidate_review_material, null);
  assertWarningKinds(scenario.contract_fit, [
    "plain_summary",
    "missing_usefulness",
    "pointer_ref",
    "authority_claim",
  ]);
  assert(
    scenario.validation_result.blocked_reasons.some((reason) =>
      reason.includes("invalid draft field shape"),
    ),
    "bad response regression must block malformed draft shape",
  );
  assert(
    scenario.validation_result.blocked_reasons.includes(
      "draft includes forbidden authority claims",
    ),
    "bad response regression must block forbidden authority claims",
  );
  assertAuthorityFalse(scenario.validation_result.authority_flags);
  assertNoUnsafeMarkerText("bad response regression scenario", scenario);
}

function assertDownstreamGuidanceSkipped() {
  const dogfood = buildPerspectiveCodexFormerManualCopyTranscriptDogfood();
  const scenario = requireScenario(dogfood, "downstream_guidance_compatibility");

  assert.equal(scenario.conclusion, "PASS with follow-up");
  assert.equal(scenario.candidate_review_material, null);
  assert.equal(scenario.worker_guidance, null);
  assert(
    scenario.dogfood_notes.some((note) =>
      note.includes("no real transcript candidate-compatible review material"),
    ),
    "downstream guidance scenario must explain why it is skipped",
  );
  assertNoUnsafeMarkerText("downstream guidance scenario", scenario);
}

function assertSyntheticDownstreamGuidancePositiveControl() {
  const dogfood = buildPerspectiveCodexFormerManualCopyTranscriptDogfood();
  const scenario = requireScenario(
    dogfood,
    "synthetic_downstream_guidance_positive_control",
  );

  assert.equal(scenario.fixture_label, "synthetic positive control, not a real transcript");
  assert.equal(scenario.conclusion, "PASS");
  assert.equal(
    scenario.transcript_provenance.fixture_source,
    "synthetic_positive_guidance_control",
  );
  assert.equal(scenario.candidate_review_material.authority, "non_committed");
  assert.equal(scenario.guidance_input_shape.candidate_present, true);
  assert.equal(scenario.guidance_input_shape.guidance_context_present, true);
  assert.equal(scenario.guidance_input_shape.guidance_context_bounded, true);
  assert.equal(scenario.guidance_input_shape.guidance_context_authoritative, false);
  assert.equal(typeof scenario.worker_guidance.guidance_status, "string");
  assert.equal(scenario.worker_guidance.advisory_only, true);
  assert(
    scenario.worker_guidance.next_action_count > 0,
    "synthetic guidance control must produce next smallest useful actions",
  );
  assertAuthorityFalse(scenario.worker_guidance.authority_flags);
  assertNoUnsafeMarkerText(
    "synthetic downstream guidance positive control",
    scenario,
  );
  assert.equal(dogfood.evaluation.conclusion, "BLOCKED");
}

function assertExtractionHelperFailsClosed() {
  assert.doesNotThrow(() => {
    const result = extractCodexPerspectiveCandidateDraftFromTranscript({
      transcript_available: false,
    });
    assert.equal(result.extraction_status, "blocked");
    assert.equal(result.draft, null);
  });

  assert.doesNotThrow(() => {
    const result = extractCodexPerspectiveCandidateDraftFromTranscript({
      transcript_available: true,
      extracted_json_text: "{not-json",
    });
    assert.equal(result.extraction_status, "blocked");
    assert.equal(result.draft, null);
    assert(
      result.blocked_reasons.some((reason) => reason.includes("could not be parsed")),
      "parse failure must include a concrete blocked reason",
    );
  });
}

function assertConclusionRules() {
  assert.equal(
    deriveTranscriptDogfoodConclusion([
      { conclusion: "PASS" },
      { conclusion: "PASS with follow-up" },
    ]),
    "PASS with follow-up",
  );
  assert.equal(
    deriveTranscriptDogfoodConclusion([
      { conclusion: "PASS" },
      { conclusion: "BLOCKED" },
    ]),
    "BLOCKED",
  );
  assert.equal(
    deriveTranscriptDogfoodConclusion([{ conclusion: "PASS" }]),
    "PASS",
  );
}

function assertDocsAndReport() {
  const docText = readFileSync(docFile, "utf8");
  const reportText = readFileSync(reportFile, "utf8");

  assertContainsAll(docText, [
    "Perspective Codex Former Manual Copy Transcript Dogfood v0.1",
    "PR #480",
    "real Codex response transcript",
    "No real transcript was supplied",
    "BLOCKED",
    "Perspective Codex Former Real Transcript Capture Instructions v0.1",
    "Dogfood manual Codex former draft copy packet with a captured real transcript",
    "not fabricate",
    "not Codex execution",
    "browser/computer-use validation",
  ]);
  assertContainsAll(reportText, [
    "Perspective Codex Former Manual Copy Transcript Dogfood",
    "Conclusion: BLOCKED",
    "Real Transcript Provenance",
    "No real transcript was supplied",
    "transcript_extraction_failure_case",
    "real_or_control_bad_response_regression",
    "downstream_guidance_compatibility",
    "synthetic_downstream_guidance_positive_control",
    "Dogfood manual Codex former draft copy packet with a captured real transcript",
  ]);
  assertNoUnsafeMarkerText("transcript dogfood doc", docText);
  assertNoUnsafeMarkerText("transcript dogfood report", reportText);
}

function assertNoForbiddenSurfaces() {
  const dogfoodText = readFileSync(dogfoodScriptFile, "utf8");
  const docText = readFileSync(docFile, "utf8");
  const reportText = readFileSync(reportFile, "utf8");

  for (const [label, text] of [
    ["dogfood", dogfoodText],
    ["doc", docText],
    ["report", reportText],
  ]) {
    for (const forbidden of [
      ["process", "env"].join("."),
      ["fetch", "("].join(""),
      "api.github.com",
      "api.openai.com",
      "OPENAI_API_KEY",
      "GITHUB_TOKEN",
      "navigator.clipboard",
      "app/api/",
      "prisma",
      "migrations",
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
      `Manual copy transcript dogfood changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/api/") &&
        !changedFile.startsWith("components/") &&
        !changedFile.startsWith("db/") &&
        !changedFile.startsWith("migrations/") &&
        !changedFile.includes("codex-sdk") &&
        !changedFile.includes("graph-db") &&
        !changedFile.includes("persistence"),
      `Manual copy transcript dogfood must not change forbidden surfaces: ${changedFile}`,
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

function assertNoUnsafeMarkerText(label, value) {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  for (const forbiddenMarker of [
    "billing_payload",
    "token_payload",
    "oauth_payload",
    "raw_pasted_text",
    "raw_source_payload",
    "raw_candidate_payload",
    "raw_private_payload",
    "private_payload",
    "provider_payload",
    "oauth_token",
    "access_token",
    "refresh_token",
    "api_key",
    "hidden_reasoning",
    "generated_model_payload",
    "sk-proj-",
    "ghp_",
    "gho_",
    "ghu_",
    "ghs_",
    "ghr_",
  ]) {
    assert.equal(
      serialized.includes(forbiddenMarker),
      false,
      `${label} must not include unsafe marker: ${forbiddenMarker}`,
    );
  }
  assert.equal(
    /\bsecret\b/i.test(serialized),
    false,
    `${label} must not include unsafe marker: secret`,
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
      "Manual copy transcript dogfood smoke collected no changed files",
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
