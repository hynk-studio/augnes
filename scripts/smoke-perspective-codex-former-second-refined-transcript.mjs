import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const manualCopyPacketFile =
  "lib/perspective-ingest/perspective-codex-former-manual-copy-packet.ts";
const dogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-second-refined-transcript.mjs";
const smokeFile =
  "scripts/smoke-perspective-codex-former-second-refined-transcript.mjs";
const docFile =
  "docs/PERSPECTIVE_CODEX_FORMER_SECOND_REFINED_TRANSCRIPT_DOGFOOD_V0_1.md";
const reportFile =
  "reports/dogfood/2026-06-09-perspective-codex-former-second-refined-transcript.md";
const provenanceStaleWordingDogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-provenance-stale-wording.mjs";
const provenanceStaleWordingSmokeFile =
  "scripts/smoke-perspective-codex-former-provenance-stale-wording.mjs";
const provenanceStaleWordingDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_PROVENANCE_STALE_WORDING_V0_1.md";
const provenanceStaleWordingReportFile =
  "reports/2026-06-09-perspective-codex-former-provenance-stale-wording.md";
const provenanceCleanTranscriptCaptureDogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-provenance-clean-transcript-capture.mjs";
const provenanceCleanTranscriptCaptureSmokeFile =
  "scripts/smoke-perspective-codex-former-provenance-clean-transcript-capture.mjs";
const provenanceCleanTranscriptCaptureDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_PROVENANCE_CLEAN_TRANSCRIPT_CAPTURE_V0_1.md";
const provenanceCleanTranscriptCaptureReportFile =
  "reports/dogfood/2026-06-10-perspective-codex-former-provenance-clean-transcript-capture.md";
const refinedFindingsContractSmokeFile =
  "scripts/smoke-perspective-codex-former-refined-findings-contract.mjs";
const refinedPromptRealTranscriptSmokeFile =
  "scripts/smoke-perspective-codex-former-refined-prompt-real-transcript.mjs";
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
  dogfoodScriptFile,
  smokeFile,
  docFile,
  reportFile,
  provenanceStaleWordingDogfoodScriptFile,
  provenanceStaleWordingSmokeFile,
  provenanceStaleWordingDocFile,
  provenanceStaleWordingReportFile,
  provenanceCleanTranscriptCaptureDogfoodScriptFile,
  provenanceCleanTranscriptCaptureSmokeFile,
  provenanceCleanTranscriptCaptureDocFile,
  provenanceCleanTranscriptCaptureReportFile,
  refinedFindingsContractSmokeFile,
  refinedPromptRealTranscriptSmokeFile,
  ...neighboringSmokeAllowlistFiles,
]);

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const dogfoodText = readFileSync(dogfoodScriptFile, "utf8");
const smokeText = readFileSync(smokeFile, "utf8");
const docText = readFileSync(docFile, "utf8");

const {
  SECOND_REFINED_TRANSCRIPT_ARTIFACT_PATH,
  SECOND_REFINED_TRANSCRIPT_DOC_PATH,
  SECOND_REFINED_TRANSCRIPT_RECOMMENDED_NEXT_PR,
  SECOND_REFINED_SOURCE_FORMER_INPUT_PACKET_ID,
  SECOND_REFINED_SOURCE_MANUAL_COPY_PACKET_ID,
  SECOND_REFINED_SOURCE_PROMPT_HASH,
  buildPerspectiveCodexFormerSecondRefinedTranscriptDogfood,
  deriveSecondRefinedTranscriptConclusion,
  runPerspectiveCodexFormerSecondRefinedTranscriptDogfood,
} = await import(
  "./dogfood-perspective-codex-former-second-refined-transcript.mjs"
);

assert.equal(existsSync(dogfoodScriptFile), true, `${dogfoodScriptFile} must exist`);
assert.equal(existsSync(smokeFile), true, `${smokeFile} must exist`);
assert.equal(existsSync(docFile), true, `${docFile} must exist`);

assert.equal(
  packageJson.scripts[
    "dogfood:perspective-codex-former-second-refined-transcript"
  ],
  `${expectedTsxCommand} ${dogfoodScriptFile}`,
  "package.json must register second refined transcript dogfood",
);
assert.equal(
  packageJson.scripts[
    "smoke:perspective-codex-former-second-refined-transcript"
  ],
  `${expectedTsxCommand} ${smokeFile}`,
  "package.json must register second refined transcript smoke",
);

assertDogfoodBuildAndReport();
assertRealTranscriptMainScenario();
assertDirectContractValidationPath();
assertAlignmentSafetyNetPath();
assertAliasTensionDriftDetection();
assertStaleWordingAndProvenance();
assertSyntheticControls();
assertDownstreamGuidance();
assertConclusionRules();
assertDocsAndReport();
assertNoForbiddenSurfaces();
assertChangedFileBoundary();

console.log("PASS smoke:perspective-codex-former-second-refined-transcript");

function assertDogfoodBuildAndReport() {
  const first = buildPerspectiveCodexFormerSecondRefinedTranscriptDogfood();
  const second = buildPerspectiveCodexFormerSecondRefinedTranscriptDogfood();

  assert.equal(first.artifact, second.artifact);
  assert.equal(first.paths.artifact, SECOND_REFINED_TRANSCRIPT_ARTIFACT_PATH);
  assert.equal(first.paths.doc, SECOND_REFINED_TRANSCRIPT_DOC_PATH);
  assert.equal(first.evaluation.conclusion, "PASS with follow-up");
  assert.equal(
    first.evaluation.recommended_next_pr_title,
    SECOND_REFINED_TRANSCRIPT_RECOMMENDED_NEXT_PR,
  );
  assert.equal(first.scenarios.length, 8);
  assert.equal(
    first.artifact.includes("real_human_started_codex_response"),
    true,
  );

  const written = runPerspectiveCodexFormerSecondRefinedTranscriptDogfood();
  assert.equal(written.artifact, first.artifact);
  assert.equal(readFileSync(reportFile, "utf8"), first.artifact);
}

function assertRealTranscriptMainScenario() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerSecondRefinedTranscriptDogfood(),
    "second_refined_transcript_main",
  );

  assert.equal(scenario.fixture_label, "real_human_started_codex_response");
  assert.equal(scenario.conclusion, "PASS");
  assert.equal(scenario.transcript_provenance.capture_method, "human_manual");
  assert.equal(scenario.transcript_provenance.codex_surface_label, "Codex");
  assert.equal(
    scenario.transcript_provenance.captured_after_pr,
    "pr:hynk-studio/augnes#487",
  );
  assert.equal(
    scenario.transcript_provenance.refined_contract_label,
    "post_pr_487_refined_thesis_tension_kind_prompt_contract",
  );
  assert.equal(
    scenario.transcript_provenance.source_manual_copy_packet_id,
    SECOND_REFINED_SOURCE_MANUAL_COPY_PACKET_ID,
  );
  assert.equal(
    scenario.transcript_provenance.source_former_input_packet_id,
    SECOND_REFINED_SOURCE_FORMER_INPUT_PACKET_ID,
  );
  assert.equal(
    scenario.transcript_provenance.source_prompt_hash,
    SECOND_REFINED_SOURCE_PROMPT_HASH,
  );
  assert.equal(
    scenario.transcript_provenance.prompt_was_generated_by_manual_copy_packet,
    true,
  );
  assert.equal(scenario.extraction.extraction_status, "extracted");
  assert.equal(scenario.extraction.extracted_candidate_count, 1);
  assert.equal(scenario.pointer_summary.all_pointer_refs_canonical, true);
  assert.equal(scenario.unsafe_or_authority_survived, false);
}

function assertDirectContractValidationPath() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerSecondRefinedTranscriptDogfood(),
    "direct_contract_validation_path",
  );

  assert.equal(scenario.conclusion, "PASS");
  assert.equal(scenario.contract_fit.status, "fits_contract");
  assertWarningKinds(scenario.contract_fit, []);
  assert.equal(scenario.validation_result.status, "needs_review");
  assert.equal(scenario.validation_result.threw, false);
  assert.equal(scenario.validation_result.blocked_reasons.length, 0);
  assert.equal(scenario.validation_without_schema_alignment_succeeded, true);
  assert.equal(scenario.alignment_required_for_candidate_material, false);
  assert.equal(scenario.candidate_review_material.authority, "non_committed");
  assert.equal(
    scenario.candidate_review_material.basis_quality.status,
    "needs_review",
  );
  assertContainsAll(scenario.candidate_review_material.unresolved_tension_kinds, [
    "unresolved_gap",
    "skipped_check_missing_reason",
    "readiness_reason",
  ]);
  assertAuthorityFalse(scenario.validation_result.authority_flags);
}

function assertAlignmentSafetyNetPath() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerSecondRefinedTranscriptDogfood(),
    "alignment_safety_net_path",
  );

  assert.equal(scenario.conclusion, "PASS");
  assert.equal(scenario.direct_validation_succeeded_first, true);
  assert.equal(scenario.alignment_needed_for_candidate_material, false);
  assert.equal(scenario.alignment.alignment_status, "aligned");
  assert.deepEqual(scenario.alignment.applied_mappings, [
    "privacy_false_alias_flags",
  ]);
  assert.equal(scenario.validation_result.status, "needs_review");
  assert.equal(scenario.candidate_review_material.authority, "non_committed");
}

function assertAliasTensionDriftDetection() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerSecondRefinedTranscriptDogfood(),
    "alias_tension_drift_detection",
  );

  assert.equal(scenario.conclusion, "PASS");
  assert.equal(scenario.old_alias_drift_absent, true);
  assert.deepEqual(scenario.old_alias_drift, []);
  assert.deepEqual(scenario.non_local_tension_kind_drift, []);
}

function assertStaleWordingAndProvenance() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerSecondRefinedTranscriptDogfood(),
    "stale_wording_and_provenance_review",
  );

  assert.equal(scenario.conclusion, "PASS with follow-up");
  assert.equal(scenario.provenance_status, "needs_review");
  assert.deepEqual(scenario.missing_provenance_fields, [
    "source_manual_copy_packet_id",
    "source_prompt_hash",
  ]);
  assertContainsAll(scenario.stale_wording_findings, [
    "stale_pr_479_prompt_contract_reference",
    "stale_second_transcript_missing_capture_wording",
    "stale_capture_next_action_after_supplied_transcript",
  ]);
}

function assertSyntheticControls() {
  const dogfood = buildPerspectiveCodexFormerSecondRefinedTranscriptDogfood();
  const extraction = requireScenario(
    dogfood,
    "transcript_extraction_failure_control",
  );
  const bad = requireScenario(dogfood, "bad_response_regression_control");

  assert.equal(extraction.conclusion, "PASS");
  assert.equal(extraction.extraction.extraction_status, "blocked");
  assert.equal(extraction.extraction.extracted_candidate_count, 0);
  assert.equal(bad.conclusion, "PASS");
  assert.equal(bad.contract_fit.status, "violates_contract");
  assert.equal(bad.validation_result.status, "blocked");
  assert.equal(bad.alignment.alignment_status, "blocked");
  assert.equal(bad.validation_result.candidate_review_material, null);
}

function assertDownstreamGuidance() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerSecondRefinedTranscriptDogfood(),
    "downstream_guidance_from_second_transcript",
  );

  assert.equal(scenario.conclusion, "PASS");
  assert.equal(scenario.direct_worker_guidance.advisory_only, true);
  assert.equal(scenario.direct_worker_guidance.next_action_count > 0, true);
  assert.equal(scenario.aligned_worker_guidance, null);
  assertAuthorityFalse(scenario.direct_worker_guidance.authority_flags);
}

function assertConclusionRules() {
  const dogfood = buildPerspectiveCodexFormerSecondRefinedTranscriptDogfood();
  assert.equal(
    deriveSecondRefinedTranscriptConclusion(dogfood.scenarios),
    "PASS with follow-up",
  );

  const blockedExtraction = dogfood.scenarios.map((scenario) =>
    scenario.scenario_id === "second_refined_transcript_main"
      ? {
          ...scenario,
          conclusion: "BLOCKED",
          extraction: {
            extraction_status: "blocked",
            extracted_candidate_count: 0,
            draft: null,
            blocked_reasons: ["missing"],
          },
        }
      : scenario,
  );
  assert.equal(
    deriveSecondRefinedTranscriptConclusion(blockedExtraction),
    "BLOCKED",
  );

  const fullyPassing = dogfood.scenarios.map((scenario) =>
    scenario.scenario_id === "stale_wording_and_provenance_review"
      ? {
          ...scenario,
          conclusion: "PASS",
          provenance_status: "complete",
          missing_provenance_fields: [],
          stale_wording_findings: [],
        }
      : scenario,
  );
  assert.equal(deriveSecondRefinedTranscriptConclusion(fullyPassing), "PASS");
}

function assertDocsAndReport() {
  const reportText = readFileSync(reportFile, "utf8");

  assertContainsAll(docText, [
    "Perspective Codex Former Second Refined Transcript Dogfood v0.1",
    "PASS with follow-up",
    "captured after PR #487",
    "Direct validation produced candidate-compatible review material without PR #484",
    "old PR #483 alias drift is absent",
    "PR #486 non-local tension_kind drift is absent",
    "source_manual_copy_packet_id: not_supplied_in_chat",
    "source_prompt_hash: not_supplied_in_chat",
    "PR #479 prompt contract",
    "Refine Codex former prompt contract stale capture-gap wording",
  ]);
  assertContainsAll(reportText, [
    "Conclusion: PASS with follow-up",
    "Old PR #483 alias fields absent: true",
    "PR #486 non-local tension_kind drift: none",
    "Contract fit status: fits_contract",
    "Contract fit warnings: none",
    "Validation status: needs_review",
    "Alignment required for candidate material: false",
    "Worker-Facing Guidance ran on the direct candidate",
    "stale_pr_479_prompt_contract_reference",
    "stale_second_transcript_missing_capture_wording",
    "Refine Codex former prompt contract stale capture-gap wording",
  ]);
  assertNoUnsafeMarkerText("doc", docText);
  assertNoUnsafeMarkerText("report", reportText);
}

function assertNoForbiddenSurfaces() {
  assertContainsAll(dogfoodText, [
    "buildPerspectiveCodexFormerSecondRefinedTranscriptDogfood",
    "CAPTURED_SECOND_REFINED_PROMPT_REAL_CODEX_RESPONSE",
    "buildWorkerFacingPerspectiveGuidanceFromCandidate",
    "alignCodexPerspectiveCandidateDraftSchemaFromModelOutput",
  ]);
  assertContainsAll(smokeText, [
    "assertDirectContractValidationPath",
    "assertAliasTensionDriftDetection",
    "assertStaleWordingAndProvenance",
  ]);

  const combined = [dogfoodText, docText].join("\n");
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
      `unexpected changed file in second refined transcript slice: ${changedFile}`,
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
