import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const dogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-provenance-clean-transcript-capture.mjs";
const smokeFile =
  "scripts/smoke-perspective-codex-former-provenance-clean-transcript-capture.mjs";
const docFile =
  "docs/PERSPECTIVE_CODEX_FORMER_PROVENANCE_CLEAN_TRANSCRIPT_CAPTURE_V0_1.md";
const reportFile =
  "reports/dogfood/2026-06-10-perspective-codex-former-provenance-clean-transcript-capture.md";
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
  "scripts/smoke-perspective-codex-former-provenance-stale-wording.mjs",
  "scripts/smoke-perspective-codex-former-real-transcript-capture-instructions.mjs",
  "scripts/smoke-perspective-codex-former-refined-findings-contract.mjs",
  "scripts/smoke-perspective-codex-former-refined-prompt-real-transcript.mjs",
  "scripts/smoke-perspective-codex-former-second-refined-transcript.mjs",
  "scripts/smoke-perspective-worker-facing-guidance.mjs",
];

const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";
const allowedChangedFiles = new Set([
  packageFile,
  dogfoodScriptFile,
  smokeFile,
  docFile,
  reportFile,
  ...neighboringSmokeAllowlistFiles,
]);
const bannedManualCopyPacketIds = new Set([
  "manual-codex-former-copy:v0.1:4wl862",
  "manual-codex-former-copy:v0.1:1h8nabl",
]);
const bannedFormerInputPacketIds = new Set([
  "codex-perspective-former-input:v0.1:project-augnes-ag-refined-codex-former-canonical:odnwc7",
  "codex-perspective-former-input:v0.1:project-augnes-ag-second-refined-codex-former-tr:13keb5c",
]);
const bannedPromptHashes = new Set([
  "35ab4e77f689514ac22ca098111f6cf7553d6bf1cf3a733c30f67572f403ca17",
  "cc5e44414a9e2942c57cad1ded854194d0a3f4f45be199509ca8600230b185d5",
]);

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const dogfoodText = readFileSync(dogfoodScriptFile, "utf8");
const smokeText = readFileSync(smokeFile, "utf8");
const docText = readFileSync(docFile, "utf8");

const {
  PROVENANCE_CLEAN_TRANSCRIPT_CAPTURE_ARTIFACT_PATH,
  PROVENANCE_CLEAN_TRANSCRIPT_CAPTURE_DOC_PATH,
  PROVENANCE_CLEAN_TRANSCRIPT_CAPTURE_RECOMMENDED_NEXT_PR,
  buildPerspectiveCodexFormerProvenanceCleanTranscriptCaptureDogfood,
  deriveProvenanceCleanTranscriptCaptureConclusion,
  runPerspectiveCodexFormerProvenanceCleanTranscriptCaptureDogfood,
} = await import(
  "./dogfood-perspective-codex-former-provenance-clean-transcript-capture.mjs"
);

assert.equal(existsSync(dogfoodScriptFile), true, `${dogfoodScriptFile} must exist`);
assert.equal(existsSync(smokeFile), true, `${smokeFile} must exist`);
assert.equal(existsSync(docFile), true, `${docFile} must exist`);

assert.equal(
  packageJson.scripts[
    "dogfood:perspective-codex-former-provenance-clean-transcript-capture"
  ],
  `${expectedTsxCommand} ${dogfoodScriptFile}`,
  "package.json must register provenance-clean transcript capture dogfood",
);
assert.equal(
  packageJson.scripts[
    "smoke:perspective-codex-former-provenance-clean-transcript-capture"
  ],
  `${expectedTsxCommand} ${smokeFile}`,
  "package.json must register provenance-clean transcript capture smoke",
);

assertDogfoodBuildAndReport();
assertGeneratedPostPr489Packet();
assertProvenanceCleanCaptureEnvelope();
assertCapturedCandidateContractFit();
assertDirectValidation();
assertAlignmentSafetyNet();
assertDownstreamGuidance();
assertStaleWordingRegression();
assertUnsafeAuthorityRegression();
assertDocsAndReport();
assertNoForbiddenSurfaces();
assertChangedFileBoundary();

console.log(
  "PASS smoke:perspective-codex-former-provenance-clean-transcript-capture",
);

function assertDogfoodBuildAndReport() {
  const first =
    buildPerspectiveCodexFormerProvenanceCleanTranscriptCaptureDogfood();
  const second =
    buildPerspectiveCodexFormerProvenanceCleanTranscriptCaptureDogfood();

  assert.equal(first.artifact, second.artifact);
  assert.equal(
    first.paths.artifact,
    PROVENANCE_CLEAN_TRANSCRIPT_CAPTURE_ARTIFACT_PATH,
  );
  assert.equal(first.paths.doc, PROVENANCE_CLEAN_TRANSCRIPT_CAPTURE_DOC_PATH);
  assert.equal(first.evaluation.conclusion, "PASS with follow-up");
  assert.equal(
    first.evaluation.recommended_next_pr_title,
    PROVENANCE_CLEAN_TRANSCRIPT_CAPTURE_RECOMMENDED_NEXT_PR,
  );
  assert.equal(first.scenarios.length, 8);
  assert.equal(
    deriveProvenanceCleanTranscriptCaptureConclusion(first.scenarios),
    "PASS with follow-up",
  );
  assert.deepEqual(
    first.scenarios.map((scenario) => scenario.scenario_id),
    [
      "generated_post_pr489_packet",
      "provenance_clean_capture_envelope",
      "captured_candidate_contract_fit",
      "direct_validation",
      "alignment_safety_net",
      "downstream_guidance",
      "stale_wording_regression",
      "unsafe_authority_regression",
    ],
  );
  assert.equal(first.packet_validation.status, "passes");
  assert.equal(first.capture_envelope.provenance_status, "complete");

  const written =
    runPerspectiveCodexFormerProvenanceCleanTranscriptCaptureDogfood();
  assert.equal(written.artifact, first.artifact);
  assert.equal(readFileSync(reportFile, "utf8"), first.artifact);
}

function assertGeneratedPostPr489Packet() {
  const dogfood =
    buildPerspectiveCodexFormerProvenanceCleanTranscriptCaptureDogfood();
  const scenario = requireScenario(dogfood, "generated_post_pr489_packet");

  assert.equal(scenario.conclusion, "PASS");
  assert.equal(scenario.manual_copy_packet_id_fresh, true);
  assert.equal(scenario.former_input_packet_id_fresh, true);
  assert.equal(scenario.copyable_prompt_hash_fresh, true);
  assert.equal(scenario.copyable_prompt_hash_present, true);
  assert.equal(
    scenario.copyable_prompt_contains_stale_pr_479_contract_label,
    false,
  );
  assert.equal(scenario.stable_contract_label_present, true);
  assert.equal(scenario.pre_capture_gap_guidance_present, true);
  assert.equal(scenario.post_capture_state_guidance_present, true);
  assert.equal(scenario.capture_return_envelope_present, true);
  assert.equal(scenario.capture_return_envelope_matches_packet, true);
  assert.equal(bannedManualCopyPacketIds.has(scenario.manual_copy_packet_id), false);
  assert.equal(
    bannedFormerInputPacketIds.has(scenario.former_input_packet_id),
    false,
  );
  assert.equal(bannedPromptHashes.has(scenario.copyable_prompt_hash), false);
}

function assertProvenanceCleanCaptureEnvelope() {
  const dogfood =
    buildPerspectiveCodexFormerProvenanceCleanTranscriptCaptureDogfood();
  const scenario = requireScenario(
    dogfood,
    "provenance_clean_capture_envelope",
  );

  assert.equal(scenario.conclusion, "PASS with follow-up");
  assert.equal(scenario.capture_method, "human_manual");
  assert.equal(scenario.codex_surface_label, "Codex");
  assert.equal(scenario.prompt_was_generated_by_manual_copy_packet, true);
  assert.equal(scenario.provenance_status, "complete");
  assert.deepEqual(scenario.missing_fields, []);
  assert.equal(scenario.no_not_supplied_in_chat_values, true);
  assert.equal(scenario.fabricated_metadata, false);
  assert.equal(scenario.separate_session_confirmation_still_useful, true);
  assert.equal(
    scenario.source_manual_copy_packet_id,
    dogfood.context.manual_copy_packet_id,
  );
  assert.equal(
    scenario.source_former_input_packet_id,
    dogfood.context.former_input_packet_id,
  );
  assert.equal(scenario.source_prompt_hash, dogfood.context.copyable_prompt_hash);
  assert(
    scenario.capture_method_honesty_note.includes(
      "phone/manual packet copying",
    ),
    "honesty note must mention avoided phone/manual packet copying",
  );
}

function assertCapturedCandidateContractFit() {
  const dogfood =
    buildPerspectiveCodexFormerProvenanceCleanTranscriptCaptureDogfood();
  const scenario = requireScenario(dogfood, "captured_candidate_contract_fit");

  assert.equal(scenario.conclusion, "PASS");
  assert.equal(scenario.extracted_candidate_count, 1);
  assert.equal(scenario.contract_fit_status, "fits_contract");
  assert.equal(scenario.plain_summary_warning_present, false);
  assert.equal(scenario.tension_kind_warning_present, false);
  assert.deepEqual(scenario.stale_wording_findings, []);
  assert.equal(
    scenario.candidate_source_former_input_packet_matches_generated,
    true,
  );
  assert.deepEqual(scenario.forbidden_aliases_present, []);
  assert.equal(
    dogfood.captured_candidate.source_former_input_packet.packet_id,
    dogfood.context.former_input_packet_id,
  );
  assert.equal(
    dogfood.captured_candidate.basis_quality_suggestion.status,
    "needs_review",
  );
}

function assertDirectValidation() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerProvenanceCleanTranscriptCaptureDogfood(),
    "direct_validation",
  );

  assert.equal(scenario.conclusion, "PASS");
  assert.notEqual(scenario.validation_status, "blocked");
  assert.notEqual(scenario.validation_status, "threw");
  assert.equal(scenario.candidate_compatible_material, true);
  assert.equal(scenario.candidate_authority, "non_committed");
  assert.equal(scenario.authority_flags_all_false, true);
}

function assertAlignmentSafetyNet() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerProvenanceCleanTranscriptCaptureDogfood(),
    "alignment_safety_net",
  );

  assert.equal(scenario.conclusion, "PASS");
  assert.equal(scenario.pr_484_alignment_available, true);
  assert.equal(scenario.direct_validation_succeeded_first, true);
  assert.equal(scenario.alignment_required_for_candidate_material, false);
  assert.notEqual(scenario.alignment_status, "blocked");
}

function assertDownstreamGuidance() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerProvenanceCleanTranscriptCaptureDogfood(),
    "downstream_guidance",
  );

  assert.equal(scenario.conclusion, "PASS");
  assert.equal(scenario.worker_guidance_advisory_only, true);
  assert.equal(scenario.next_action_count > 0, true);
  assert.equal(scenario.authority_flags_all_false, true);
}

function assertStaleWordingRegression() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerProvenanceCleanTranscriptCaptureDogfood(),
    "stale_wording_regression",
  );

  assert.equal(scenario.conclusion, "PASS");
  assert.deepEqual(scenario.stale_wording_findings, []);
  assert.equal(scenario.stale_pr_479_prompt_contract_wording_present, false);
  assert.equal(
    scenario.stale_transcript_not_captured_current_state_wording_present,
    false,
  );
  assert.equal(
    scenario.stale_capture_next_action_after_supplied_transcript_present,
    false,
  );
  assert.equal(
    scenario.source_pre_capture_gap_treated_as_historical_context,
    true,
  );
}

function assertUnsafeAuthorityRegression() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerProvenanceCleanTranscriptCaptureDogfood(),
    "unsafe_authority_regression",
  );

  assert.equal(scenario.conclusion, "PASS");
  assert.equal(scenario.contract_fit_status, "violates_contract");
  assert.equal(scenario.validation_status, "blocked");
  assert.equal(scenario.alignment_status, "blocked");
  assert.equal(scenario.candidate_compatible_material, false);
  assert.equal(scenario.authority_flags_all_false, true);
  assert.equal(scenario.unsafe_or_authority_survived, false);
}

function assertDocsAndReport() {
  const reportText = readFileSync(reportFile, "utf8");

  assertContainsAll(docText, [
    "Perspective Codex Former Provenance-Clean Transcript Capture v0.1",
    "follows PR #489",
    "phone-assisted same-session",
    "copyable_prompt_hash",
    "capture_return_envelope",
    "source_manual_copy_packet_id",
    "source_prompt_hash",
    "CodexPerspectiveFormerDraftPromptContract v0.1",
    "PASS with follow-up",
    "Confirm provenance-clean Codex former capture in separate session",
  ]);
  assertContainsAll(reportText, [
    "Perspective Codex Former Provenance-Clean Transcript Capture",
    "Why This Follows PR #489",
    "Why Phone/Manual Copy Was Avoided",
    "Fresh Generated Packet Provenance",
    "Capture Method And Honesty Note",
    "Capture Envelope Result",
    "Contract-Fit Result",
    "Direct Validation Result",
    "Alignment Safety-Net Result",
    "Downstream Guidance Result",
    "Stale Wording Regression Result",
    "Provenance Completeness",
    "What Codex Did Not Do",
    "PASS with follow-up",
    "No not_supplied_in_chat values: true",
    "Stale wording findings: none",
    "Confirm provenance-clean Codex former capture in separate session",
  ]);
}

function assertNoForbiddenSurfaces() {
  assert.equal(dogfoodText.includes("await fetch("), false);
  assert.equal(dogfoodText.includes("globalThis.fetch("), false);
  assert.equal(dogfoodText.includes("OpenAI"), true);
  assert.equal(dogfoodText.includes("source_manual_copy_packet_id"), true);
  assert.equal(dogfoodText.includes("copyable_prompt_hash"), true);
  assert.equal(docText.includes("runtime route"), true);
}

function assertChangedFileBoundary() {
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `Perspective Codex former provenance-clean transcript capture changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/api/") &&
        !changedFile.startsWith("components/") &&
        changedFile !== "app/globals.css" &&
        !changedFile.startsWith("lib/"),
      `Perspective Codex former provenance-clean transcript capture must not change forbidden surfaces: ${changedFile}`,
    );
  }
}

function collectChangedFiles() {
  const workingTreeFiles = execFileSync(
    "git",
    ["diff", "--name-only", "--diff-filter=ACMR"],
    { encoding: "utf8" },
  )
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const stagedFiles = execFileSync(
    "git",
    ["diff", "--cached", "--name-only", "--diff-filter=ACMR"],
    { encoding: "utf8" },
  )
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  let branchFiles = [];
  try {
    branchFiles = execFileSync(
      "git",
      ["diff", "--name-only", "--diff-filter=ACMR", "origin/main...HEAD"],
      { encoding: "utf8" },
    )
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    throw new Error(
      "Unable to collect base diff for Perspective Codex former provenance-clean transcript capture smoke",
    );
  }
  const untrackedFiles = execFileSync(
    "git",
    ["ls-files", "--others", "--exclude-standard"],
    { encoding: "utf8" },
  )
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return [
    ...new Set([
      ...workingTreeFiles,
      ...stagedFiles,
      ...branchFiles,
      ...untrackedFiles,
    ]),
  ].sort();
}

function requireScenario(dogfood, scenarioId) {
  const scenario = dogfood.scenarios.find(
    (candidate) => candidate.scenario_id === scenarioId,
  );
  assert(scenario, `missing scenario ${scenarioId}`);
  return scenario;
}

function assertContainsAll(value, expectedSnippets) {
  for (const snippet of expectedSnippets) {
    assert(
      value.includes(snippet),
      `expected text to include ${JSON.stringify(snippet)}`,
    );
  }
}
