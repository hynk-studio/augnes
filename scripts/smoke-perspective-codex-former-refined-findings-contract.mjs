import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const manualCopyPacketFile =
  "lib/perspective-ingest/perspective-codex-former-manual-copy-packet.ts";
const promptContractFile =
  "lib/perspective-ingest/perspective-codex-former-prompt-contract.ts";
const dogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-refined-findings-contract.mjs";
const smokeFile =
  "scripts/smoke-perspective-codex-former-refined-findings-contract.mjs";
const docFile =
  "docs/PERSPECTIVE_CODEX_FORMER_REFINED_FINDINGS_CONTRACT_V0_1.md";
const reportFile =
  "reports/2026-06-09-perspective-codex-former-refined-findings-contract.md";
const refinedTranscriptDogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-refined-prompt-real-transcript.mjs";
const refinedTranscriptSmokeFile =
  "scripts/smoke-perspective-codex-former-refined-prompt-real-transcript.mjs";
const refinedTranscriptDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_REFINED_PROMPT_REAL_TRANSCRIPT_DOGFOOD_V0_1.md";
const refinedTranscriptReportFile =
  "reports/dogfood/2026-06-09-perspective-codex-former-refined-prompt-real-transcript.md";
const secondRefinedTranscriptDogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-second-refined-transcript.mjs";
const secondRefinedTranscriptSmokeFile =
  "scripts/smoke-perspective-codex-former-second-refined-transcript.mjs";
const secondRefinedTranscriptDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_SECOND_REFINED_TRANSCRIPT_DOGFOOD_V0_1.md";
const secondRefinedTranscriptReportFile =
  "reports/dogfood/2026-06-09-perspective-codex-former-second-refined-transcript.md";
const provenanceStaleWordingDogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-provenance-stale-wording.mjs";
const provenanceStaleWordingSmokeFile =
  "scripts/smoke-perspective-codex-former-provenance-stale-wording.mjs";
const provenanceStaleWordingDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_PROVENANCE_STALE_WORDING_V0_1.md";
const provenanceStaleWordingReportFile =
  "reports/2026-06-09-perspective-codex-former-provenance-stale-wording.md";
const neighboringSmokeAllowlistFiles = [
  "scripts/smoke-perspective-candidate-builder-fixture.mjs",
  "scripts/smoke-perspective-codex-former-draft-schema-alignment.mjs",
  "scripts/smoke-perspective-codex-former-manual-copy-packet.mjs",
  "scripts/smoke-perspective-codex-former-manual-copy-real-transcript.mjs",
  "scripts/smoke-perspective-codex-former-manual-copy-transcript.mjs",
  "scripts/smoke-perspective-codex-former-pipeline-dogfood.mjs",
  "scripts/smoke-perspective-codex-former-pipeline.mjs",
  "scripts/smoke-perspective-codex-former-prompt-contract-canonical-schema.mjs",
  "scripts/smoke-perspective-codex-former-prompt-contract.mjs",
  "scripts/smoke-perspective-codex-former-real-transcript-capture-instructions.mjs",
  "scripts/smoke-perspective-worker-facing-guidance.mjs",
];

const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";
const allowedChangedFiles = new Set([
  packageFile,
  manualCopyPacketFile,
  promptContractFile,
  dogfoodScriptFile,
  smokeFile,
  docFile,
  reportFile,
  refinedTranscriptDogfoodScriptFile,
  refinedTranscriptSmokeFile,
  refinedTranscriptDocFile,
  refinedTranscriptReportFile,
  secondRefinedTranscriptDogfoodScriptFile,
  secondRefinedTranscriptSmokeFile,
  secondRefinedTranscriptDocFile,
  secondRefinedTranscriptReportFile,
  provenanceStaleWordingDogfoodScriptFile,
  provenanceStaleWordingSmokeFile,
  provenanceStaleWordingDocFile,
  provenanceStaleWordingReportFile,
  ...neighboringSmokeAllowlistFiles,
]);

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const promptContractText = readFileSync(promptContractFile, "utf8");
const dogfoodText = readFileSync(dogfoodScriptFile, "utf8");
const smokeText = readFileSync(smokeFile, "utf8");
const docText = readFileSync(docFile, "utf8");

const {
  REFINED_FINDINGS_CONTRACT_ARTIFACT_PATH,
  REFINED_FINDINGS_CONTRACT_DOC_PATH,
  REFINED_FINDINGS_CONTRACT_RECOMMENDED_NEXT_PR,
  buildPerspectiveCodexFormerRefinedFindingsContractDogfood,
  deriveRefinedFindingsContractConclusion,
  runPerspectiveCodexFormerRefinedFindingsContractDogfood,
} = await import(
  "./dogfood-perspective-codex-former-refined-findings-contract.mjs"
);

assert.equal(existsSync(promptContractFile), true, `${promptContractFile} must exist`);
assert.equal(existsSync(dogfoodScriptFile), true, `${dogfoodScriptFile} must exist`);
assert.equal(existsSync(smokeFile), true, `${smokeFile} must exist`);
assert.equal(existsSync(docFile), true, `${docFile} must exist`);

assert.equal(
  packageJson.scripts[
    "dogfood:perspective-codex-former-refined-findings-contract"
  ],
  `${expectedTsxCommand} ${dogfoodScriptFile}`,
  "package.json must register refined findings contract dogfood",
);
assert.equal(
  packageJson.scripts[
    "smoke:perspective-codex-former-refined-findings-contract"
  ],
  `${expectedTsxCommand} ${smokeFile}`,
  "package.json must register refined findings contract smoke",
);

assertPromptContractSource();
assertDogfoodBuildAndReport();
assertPromptScenario();
assertBoundaryPositiveFixture();
assertPlainSummaryNegativeFixture();
assertLocalEnumFixture();
assertOldPr486DriftFixture();
assertPr486Replay();
assertUnsafeRegression();
assertConclusionRules();
assertDocsAndReport();
assertNoForbiddenSurfaces();
assertChangedFileBoundary();

console.log("PASS smoke:perspective-codex-former-refined-findings-contract");

function assertPromptContractSource() {
  assertContainsAll(promptContractText, [
    "The thesis must name the validation boundary, unresolved tension, scope/risk tradeoff, remaining gap, or next smallest useful work first.",
    "The thesis must not merely list what PRs did or narrate PR chronology.",
    "If the thesis includes PR facts, those facts must support the boundary rather than replace it.",
    "what remains unproven or needs_review",
    "Use wording such as",
    "unresolved_tensions[].tension_kind must be one of unresolved_gap, readiness_reason, failed_check, or skipped_check_missing_reason.",
    "Do not emit non-local tension_kind values validation_gap, schema_drift_risk, or readiness_boundary.",
    "Map validation_gap to unresolved_gap.",
    "Map schema_drift_risk to unresolved_gap or readiness_reason",
    "Map readiness_boundary to readiness_reason.",
    "Use skipped_check_missing_reason when a missing validation or weak check result is tied to a skipped check with a missing or weak reason.",
    "Use failed_check when a validation or check result failed.",
    '"tension_kind"',
    "collectTensionKindWarnings",
    "next smallest useful work",
    "remains unproven",
    "draft/review-only",
    "non-authoritative",
  ]);
}

function assertDogfoodBuildAndReport() {
  const first = buildPerspectiveCodexFormerRefinedFindingsContractDogfood();
  const second = buildPerspectiveCodexFormerRefinedFindingsContractDogfood();

  assert.equal(first.artifact, second.artifact);
  assert.equal(first.paths.artifact, REFINED_FINDINGS_CONTRACT_ARTIFACT_PATH);
  assert.equal(first.paths.doc, REFINED_FINDINGS_CONTRACT_DOC_PATH);
  assert.equal(first.evaluation.conclusion, "PASS with follow-up");
  assert.equal(
    first.evaluation.recommended_next_pr_title,
    REFINED_FINDINGS_CONTRACT_RECOMMENDED_NEXT_PR,
  );
  assert.equal(first.scenarios.length, 7);

  const written = runPerspectiveCodexFormerRefinedFindingsContractDogfood();
  assert.equal(written.artifact, first.artifact);
  assert.equal(readFileSync(reportFile, "utf8"), first.artifact);
}

function assertPromptScenario() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerRefinedFindingsContractDogfood(),
    "refined_prompt_contract_thesis_boundary",
  );

  assert.equal(scenario.conclusion, "PASS");
  assert.deepEqual(scenario.local_tension_kinds, [
    "unresolved_gap",
    "readiness_reason",
    "failed_check",
    "skipped_check_missing_reason",
  ]);
  assert.deepEqual(scenario.discouraged_tension_kinds, [
    "validation_gap",
    "schema_drift_risk",
    "readiness_boundary",
  ]);
  assert.equal(scenario.missing_snippets.length, 0);
}

function assertBoundaryPositiveFixture() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerRefinedFindingsContractDogfood(),
    "contract_fit_boundary_positive_fixture",
  );

  assert.equal(scenario.conclusion, "PASS");
  assert.equal(scenario.contract_fit.status, "fits_contract");
  assertWarningKinds(scenario.contract_fit, []);
  assert.equal(scenario.validation_result.status, "needs_review");
  assert.equal(scenario.candidate_review_material.authority, "non_committed");
  assertAuthorityFalse(scenario.validation_result.authority_flags);
}

function assertPlainSummaryNegativeFixture() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerRefinedFindingsContractDogfood(),
    "contract_fit_plain_summary_negative_fixture",
  );

  assert.equal(scenario.conclusion, "PASS");
  assert.equal(scenario.contract_fit.status, "needs_review");
  assertWarningKinds(scenario.contract_fit, ["plain_summary"]);
  assert.equal(scenario.weak_thesis_quality_recorded, true);
  assert.equal(scenario.validation_result.status, "needs_review");
  assertAuthorityFalse(scenario.validation_result.authority_flags);
}

function assertLocalEnumFixture() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerRefinedFindingsContractDogfood(),
    "unresolved_tension_kind_local_enum_fixture",
  );

  assert.equal(scenario.conclusion, "PASS");
  assert.equal(scenario.contract_fit.status, "fits_contract");
  assertWarningKinds(scenario.contract_fit, []);
  assert.equal(scenario.validation_result.status, "needs_review");
  assertContainsAll(
    scenario.candidate_review_material.unresolved_tension_kinds,
    ["unresolved_gap", "readiness_reason", "failed_check", "skipped_check_missing_reason"],
  );
}

function assertOldPr486DriftFixture() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerRefinedFindingsContractDogfood(),
    "unresolved_tension_kind_old_pr486_drift_fixture",
  );

  assert.equal(scenario.conclusion, "PASS with follow-up");
  assert.equal(scenario.contract_fit.status, "needs_review");
  assertWarningKinds(scenario.contract_fit, [
    "tension_kind",
    "tension_kind",
    "tension_kind",
  ]);
  assert.equal(scenario.validation_result.status, "needs_review");
}

function assertPr486Replay() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerRefinedFindingsContractDogfood(),
    "refined_transcript_replay_after_contract_update",
  );

  assert.equal(scenario.conclusion, "PASS with follow-up");
  assert.deepEqual(scenario.old_alias_drift, []);
  assert.deepEqual(scenario.semantic_tension_enum_drift, [
    "validation_gap",
    "schema_drift_risk",
    "readiness_boundary",
  ]);
  assert.equal(scenario.contract_fit.status, "needs_review");
  assertWarningKinds(scenario.contract_fit, [
    "tension_kind",
    "tension_kind",
    "tension_kind",
  ]);
  assert.equal(scenario.validation_result.status, "needs_review");
  assert.equal(
    scenario.validation_result.candidate_review_material.authority,
    "non_committed",
  );
  assert.equal(scenario.alignment_needed_for_candidate_material, false);
  assert.equal(scenario.worker_guidance.advisory_only, true);
  assert.equal(scenario.worker_guidance.next_action_count > 0, true);
}

function assertUnsafeRegression() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerRefinedFindingsContractDogfood(),
    "unsafe_authority_privacy_regression",
  );

  assert.equal(scenario.conclusion, "PASS");
  assert.equal(scenario.contract_fit.status, "violates_contract");
  assert.equal(scenario.validation_result.status, "blocked");
  assert.equal(scenario.alignment.alignment_status, "blocked");
  assert.equal(scenario.validation_result.candidate_review_material, null);
  assertAuthorityFalse(scenario.validation_result.authority_flags);
  assertAuthorityFalse(scenario.alignment.authority_flags);
}

function assertConclusionRules() {
  const dogfood = buildPerspectiveCodexFormerRefinedFindingsContractDogfood();
  assert.equal(
    deriveRefinedFindingsContractConclusion(dogfood.scenarios),
    "PASS with follow-up",
  );

  const promptBlocked = dogfood.scenarios.map((scenario) =>
    scenario.scenario_id === "refined_prompt_contract_thesis_boundary"
      ? { ...scenario, conclusion: "BLOCKED" }
      : scenario,
  );
  assert.equal(
    deriveRefinedFindingsContractConclusion(promptBlocked),
    "BLOCKED",
  );

  const negativeBroken = dogfood.scenarios.map((scenario) =>
    scenario.scenario_id === "contract_fit_plain_summary_negative_fixture"
      ? { ...scenario, conclusion: "BLOCKED" }
      : scenario,
  );
  assert.equal(
    deriveRefinedFindingsContractConclusion(negativeBroken),
    "BLOCKED",
  );
}

function assertDocsAndReport() {
  const reportText = readFileSync(reportFile, "utf8");

  assertContainsAll(docText, [
    "Perspective Codex Former Refined Findings Contract v0.1",
    "Conclusion: PASS with follow-up",
    "the PR #486 thesis was useful but still warned",
    "unresolved_tensions used canonical object shape but non-local",
    "unresolved_gap",
    "readiness_reason",
    "failed_check",
    "skipped_check_missing_reason",
    "Dogfood refined Codex former prompt contract with a second captured transcript",
  ]);
  assertContainsAll(reportText, [
    "Conclusion: PASS with follow-up",
    "Boundary-positive fixture contract fit: fits_contract",
    "Plain-summary negative fixture contract fit: needs_review",
    "PR #486 replay warnings: tension_kind",
    "Allowed local tension_kind values: unresolved_gap, readiness_reason, failed_check, skipped_check_missing_reason",
    "Worker-Facing Guidance ran",
    "Dogfood refined Codex former prompt contract with a second captured transcript",
  ]);
  assertNoUnsafeMarkerText("doc", docText);
  assertNoUnsafeMarkerText("report", reportText);
}

function assertNoForbiddenSurfaces() {
  assertContainsAll(dogfoodText, [
    "buildPerspectiveCodexFormerRefinedFindingsContractDogfood",
    "buildRefinedTranscriptReplayAfterContractUpdate",
    "buildUnsafeAuthorityPrivacyRegressionScenario",
    "CAPTURED_REFINED_PROMPT_REAL_CODEX_RESPONSE",
  ]);
  assertContainsAll(smokeText, [
    "assertBoundaryPositiveFixture",
    "assertPlainSummaryNegativeFixture",
    "assertPr486Replay",
  ]);

  const combined = [promptContractText, dogfoodText, docText].join("\n");
  for (const forbiddenSnippet of [
    "fetch(",
    "XMLHttpRequest",
    "new OpenAI",
    "createChatCompletion",
    "responses.create",
    "navigator.clipboard",
    "app/api/",
    "db:write",
    "proof/evidence/readiness records created",
  ]) {
    assert.equal(
      combined.includes(forbiddenSnippet),
      false,
      `forbidden implementation surface found: ${forbiddenSnippet}`,
    );
  }
}

function assertChangedFileBoundary() {
  const changedFiles = execFileSync("git", ["diff", "--name-only"], {
    encoding: "utf8",
  })
    .trim()
    .split("\n")
    .filter(Boolean);

  for (const changedFile of changedFiles) {
    assert.equal(
      allowedChangedFiles.has(changedFile),
      true,
      `unexpected changed file in refined findings contract slice: ${changedFile}`,
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
  assert.deepEqual(
    contractFit.warnings.map((warning) => warning.warning_kind),
    expectedKinds,
  );
}

function assertAuthorityFalse(flags) {
  assert(flags, "authority flags must be present");
  for (const [key, value] of Object.entries(flags)) {
    assert.equal(value, false, `${key} must stay false`);
  }
}

function assertContainsAll(value, snippets) {
  for (const snippet of snippets) {
    assert.equal(
      value.includes(snippet),
      true,
      `expected snippet not found: ${snippet}`,
    );
  }
}

function assertNoUnsafeMarkerText(label, value) {
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
      value.includes(forbiddenMarker),
      false,
      `${label} includes unsafe marker: ${forbiddenMarker}`,
    );
  }
}
