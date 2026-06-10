import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const dogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-separate-session-provenance-clean-capture.mjs";
const smokeFile =
  "scripts/smoke-perspective-codex-former-separate-session-provenance-clean-capture.mjs";
const docFile =
  "docs/PERSPECTIVE_CODEX_FORMER_SEPARATE_SESSION_PROVENANCE_CLEAN_CAPTURE_V0_1.md";
const reportFile =
  "reports/dogfood/2026-06-10-perspective-codex-former-separate-session-provenance-clean-capture.md";
const prepDogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-separate-session-capture-packet-prep.mjs";
const prepSmokeFile =
  "scripts/smoke-perspective-codex-former-separate-session-capture-packet-prep.mjs";
const prepDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_SEPARATE_SESSION_CAPTURE_PACKET_PREP_V0_1.md";
const prepReportFile =
  "reports/2026-06-10-perspective-codex-former-separate-session-capture-packet-prep.md";

const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";
const allowedChangedFiles = new Set([
  packageFile,
  dogfoodScriptFile,
  smokeFile,
  docFile,
  reportFile,
  prepDogfoodScriptFile,
  prepSmokeFile,
  prepDocFile,
  prepReportFile,
  "docs/PERSPECTIVE_CODEX_FORMER_MANUAL_WORKFLOW_V0_1.md",
  "reports/2026-06-10-perspective-codex-former-manual-workflow-docs.md",
  "scripts/smoke-perspective-codex-former-manual-workflow-docs.mjs",
  "scripts/smoke-perspective-codex-former-manual-copy-packet.mjs",
  "scripts/perspective-codex-former-capture-helper.mjs",
  "scripts/smoke-perspective-codex-former-capture-helper.mjs",
  "reports/2026-06-10-perspective-codex-former-capture-helper.md",
  "reports/2026-06-10-perspective-codex-former-capture-helper-parameterized-input.md",
  "docs/PERSPECTIVE_CODEX_FORMER_CAPTURE_SOURCE_INPUT_TEMPLATE_V0_1.md",
  "reports/2026-06-10-perspective-codex-former-source-input-hardening.md",
  "docs/PERSPECTIVE_CODEX_FORMER_WORKFLOW_CLOSEOUT_V0_1.md",
  "reports/2026-06-10-perspective-codex-former-workflow-closeout.md",
  "scripts/smoke-perspective-codex-former-workflow-closeout.mjs",
]);

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const dogfoodText = readFileSync(dogfoodScriptFile, "utf8");
const smokeText = readFileSync(smokeFile, "utf8");
const docText = readFileSync(docFile, "utf8");

const {
  SANITIZED_OMITTED_UNSAFE_FIELD_SUMMARY,
  SEPARATE_SESSION_PROVENANCE_CLEAN_CAPTURE_ARTIFACT_PATH,
  SEPARATE_SESSION_PROVENANCE_CLEAN_CAPTURE_DOC_PATH,
  SEPARATE_SESSION_PROVENANCE_CLEAN_CAPTURE_PASS_FOLLOW_UP_PR,
  SUPPLIED_SEPARATE_SESSION_CAPTURE_METHOD,
  SUPPLIED_SEPARATE_SESSION_CODEX_SURFACE_LABEL,
  SUPPLIED_SEPARATE_SESSION_FORMER_INPUT_PACKET_ID,
  SUPPLIED_SEPARATE_SESSION_MANUAL_COPY_PACKET_ID,
  SUPPLIED_SEPARATE_SESSION_SOURCE_PROMPT_HASH,
  buildPerspectiveCodexFormerSeparateSessionProvenanceCleanCaptureDogfood,
  deriveSeparateSessionProvenanceCleanCaptureConclusion,
  runPerspectiveCodexFormerSeparateSessionProvenanceCleanCaptureDogfood,
} = await import(
  "./dogfood-perspective-codex-former-separate-session-provenance-clean-capture.mjs"
);

assert.equal(existsSync(dogfoodScriptFile), true, `${dogfoodScriptFile} must exist`);
assert.equal(existsSync(smokeFile), true, `${smokeFile} must exist`);
assert.equal(existsSync(docFile), true, `${docFile} must exist`);

assert.equal(
  packageJson.scripts[
    "dogfood:perspective-codex-former-separate-session-provenance-clean-capture"
  ],
  `${expectedTsxCommand} ${dogfoodScriptFile}`,
  "package.json must register separate-session provenance-clean capture dogfood",
);
assert.equal(
  packageJson.scripts[
    "smoke:perspective-codex-former-separate-session-provenance-clean-capture"
  ],
  `${expectedTsxCommand} ${smokeFile}`,
  "package.json must register separate-session provenance-clean capture smoke",
);

assertDogfoodBuildAndReport();
assertSeparateSessionTranscriptProvenance();
assertGeneratedPacketMatch();
assertContractFitAndValidation();
assertDriftRegression();
assertAlignmentSafetyNet();
assertDownstreamGuidance();
assertUnsafeAuthorityRegression();
assertDocsAndReport();
assertNoForbiddenSurfaces();
assertChangedFileBoundary();

console.log(
  "PASS smoke:perspective-codex-former-separate-session-provenance-clean-capture",
);

function assertDogfoodBuildAndReport() {
  const first =
    buildPerspectiveCodexFormerSeparateSessionProvenanceCleanCaptureDogfood();
  const second =
    buildPerspectiveCodexFormerSeparateSessionProvenanceCleanCaptureDogfood();

  assert.equal(first.artifact, second.artifact);
  assert.equal(
    first.paths.artifact,
    SEPARATE_SESSION_PROVENANCE_CLEAN_CAPTURE_ARTIFACT_PATH,
  );
  assert.equal(first.paths.doc, SEPARATE_SESSION_PROVENANCE_CLEAN_CAPTURE_DOC_PATH);
  assert.equal(first.evaluation.conclusion, "PASS with follow-up");
  assert.equal(
    first.evaluation.recommended_next_pr_title,
    SEPARATE_SESSION_PROVENANCE_CLEAN_CAPTURE_PASS_FOLLOW_UP_PR,
  );
  assert.equal(
    deriveSeparateSessionProvenanceCleanCaptureConclusion(first.scenarios),
    "PASS with follow-up",
  );
  assert.deepEqual(
    first.scenarios.map((scenario) => scenario.scenario_id),
    [
      "separate_session_transcript_provenance",
      "generated_packet_match",
      "contract_fit_and_validation",
      "drift_regression",
      "alignment_safety_net",
      "downstream_guidance",
      "unsafe_authority_regression",
    ],
  );

  const written =
    runPerspectiveCodexFormerSeparateSessionProvenanceCleanCaptureDogfood();
  assert.equal(written.artifact, first.artifact);
  assert.equal(readFileSync(reportFile, "utf8"), first.artifact);
}

function assertSeparateSessionTranscriptProvenance() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerSeparateSessionProvenanceCleanCaptureDogfood(),
    "separate_session_transcript_provenance",
  );

  assert.equal(scenario.conclusion, "PASS");
  assert.equal(scenario.transcript_available, true);
  assert.equal(scenario.capture_method, SUPPLIED_SEPARATE_SESSION_CAPTURE_METHOD);
  assert.equal(
    scenario.codex_surface_label,
    SUPPLIED_SEPARATE_SESSION_CODEX_SURFACE_LABEL,
  );
  assert.equal(scenario.prompt_was_generated_by_manual_copy_packet, true);
  assert.equal(
    scenario.source_manual_copy_packet_id,
    SUPPLIED_SEPARATE_SESSION_MANUAL_COPY_PACKET_ID,
  );
  assert.equal(
    scenario.source_former_input_packet_id,
    SUPPLIED_SEPARATE_SESSION_FORMER_INPUT_PACKET_ID,
  );
  assert.equal(
    scenario.source_prompt_hash,
    SUPPLIED_SEPARATE_SESSION_SOURCE_PROMPT_HASH,
  );
  assert.equal(scenario.no_not_supplied_in_chat_values, true);
  assert.equal(scenario.provenance_status, "complete");
  assert.equal(scenario.fabricated_metadata, false);
  assert.equal(scenario.clearly_not_same_session_fallback, true);
}

function assertGeneratedPacketMatch() {
  const dogfood =
    buildPerspectiveCodexFormerSeparateSessionProvenanceCleanCaptureDogfood();
  const scenario = requireScenario(dogfood, "generated_packet_match");

  assert.equal(scenario.conclusion, "PASS");
  assert.equal(scenario.transcript_ids_match_prepared_packet, true);
  assert.equal(
    scenario.manual_copy_packet_id,
    SUPPLIED_SEPARATE_SESSION_MANUAL_COPY_PACKET_ID,
  );
  assert.equal(
    scenario.former_input_packet_id,
    SUPPLIED_SEPARATE_SESSION_FORMER_INPUT_PACKET_ID,
  );
  assert.equal(scenario.source_prompt_hash, SUPPLIED_SEPARATE_SESSION_SOURCE_PROMPT_HASH);
  assert.equal(scenario.stable_contract_label_present, true);
  assert.equal(scenario.stale_pr_479_prompt_wording_absent, true);
  assert.equal(scenario.capture_return_envelope_present, true);
  assert.equal(scenario.capture_return_envelope_matches_packet, true);
  assert.equal(
    dogfood.transcript_envelope.source_manual_copy_packet_id,
    dogfood.context.manual_copy_packet_id,
  );
  assert.equal(
    dogfood.transcript_envelope.source_former_input_packet_id,
    dogfood.context.former_input_packet_id,
  );
  assert.equal(
    dogfood.transcript_envelope.source_prompt_hash,
    dogfood.context.copyable_prompt_hash,
  );
}

function assertContractFitAndValidation() {
  const dogfood =
    buildPerspectiveCodexFormerSeparateSessionProvenanceCleanCaptureDogfood();
  const scenario = requireScenario(dogfood, "contract_fit_and_validation");

  assert.equal(scenario.conclusion, "PASS with follow-up");
  assert.equal(scenario.extracted_candidate_count, 1);
  assert.equal(scenario.contract_fit_status, "needs_review");
  assert.equal(scenario.plain_summary_warning_present, false);
  assert.equal(scenario.tension_kind_warning_present, false);
  assert.deepEqual(scenario.contract_fit_warning_kinds, [
    "pointer_ref",
    "pointer_ref",
  ]);
  assert.equal(scenario.validation_status, "needs_review");
  assert.deepEqual(scenario.validation_warning_kinds, [
    "unknown_pointer_ref",
    "unknown_pointer_ref",
  ]);
  assert.equal(scenario.candidate_compatible_material, true);
  assert.equal(scenario.candidate_authority, "non_committed");
  assert.equal(scenario.candidate_basis_quality, "needs_review");
  assert.equal(scenario.candidate_pointer_count, 1);
  assert.equal(scenario.basis_quality_suggestion, "needs_review");
  assert.equal(
    scenario.sanitized_omitted_marker_summary,
    SANITIZED_OMITTED_UNSAFE_FIELD_SUMMARY,
  );
  assert.equal(scenario.unsafe_material_detected, false);
  assert.equal(scenario.authority_flags_all_false, true);
}

function assertDriftRegression() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerSeparateSessionProvenanceCleanCaptureDogfood(),
    "drift_regression",
  );

  assert.equal(scenario.conclusion, "PASS");
  assert.equal(scenario.old_pr_483_alias_drift_absent, true);
  assert.deepEqual(scenario.forbidden_aliases_present, []);
  assert.equal(scenario.pr_486_non_local_tension_kind_drift_absent, true);
  assert.deepEqual(scenario.stale_wording_findings, []);
  assert.deepEqual(scenario.stale_prompt_lineage_labels, []);
  assert.equal(scenario.stale_pr_479_prompt_wording_absent, true);
}

function assertAlignmentSafetyNet() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerSeparateSessionProvenanceCleanCaptureDogfood(),
    "alignment_safety_net",
  );

  assert.equal(scenario.conclusion, "PASS");
  assert.equal(scenario.alignment_available, true);
  assert.equal(scenario.direct_validation_ran_first, true);
  assert.equal(scenario.direct_validation_succeeded_first, true);
  assert.equal(scenario.alignment_required_for_candidate_material, false);
  assert.equal(scenario.alignment_counted_as_direct_success, false);
  assert.equal(scenario.alignment_status, "blocked");
  assert.equal(scenario.alignment_safe_blocked_reasons.length > 0, true);
}

function assertDownstreamGuidance() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerSeparateSessionProvenanceCleanCaptureDogfood(),
    "downstream_guidance",
  );

  assert.equal(scenario.conclusion, "PASS");
  assert.equal(scenario.worker_guidance_advisory_only, true);
  assert.equal(scenario.next_action_count > 0, true);
  assert.equal(scenario.authority_flags_all_false, true);
}

function assertUnsafeAuthorityRegression() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerSeparateSessionProvenanceCleanCaptureDogfood(),
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
    "Perspective Codex Former Separate-Session Provenance-Clean Capture v0.1",
    "follows PR #491",
    "PASS with follow-up",
    "manual-codex-former-copy:v0.1:okr3cu",
    "3jveop",
    "Direct validation must run before alignment",
    "sanitized marker-count summary",
    "Promote provenance-clean Codex former capture path to manual workflow docs",
  ]);
  assertContainsAll(reportText, [
    "Perspective Codex Former Separate-Session Provenance-Clean Capture",
    "Why This Follows PR #491 Prep",
    "Real Separate-Session Transcript Provenance",
    "Generated Packet Match",
    "Contract-Fit Result",
    "Direct Validation Result",
    "Alignment Safety-Net Result",
    "Downstream Guidance Result",
    "Drift/Stale Wording Regression Result",
    "Privacy/Omitted-Field Handling",
    "Unsafe Authority Regression",
    "Evaluation Conclusion",
    "PASS with follow-up",
    "provenance_status: complete",
    "No not_supplied_in_chat values: true",
    "Contract-fit status: needs_review",
    "Validation status: needs_review",
    "Candidate-compatible material: true",
    "Alignment counted as direct success: false",
    "Worker guidance advisory-only: true",
    "Stale wording findings: none",
    "Raw marker names echoed in public artifact: false",
    "What Codex Did Not Do",
    "Promote provenance-clean Codex former capture path to manual workflow docs",
  ]);
  assertNoRawUnsafeMarkersInPublicText(reportText);
  assertNoRawUnsafeMarkersInPublicText(docText);
}

function assertNoForbiddenSurfaces() {
  assert.equal(dogfoodText.includes("await fetch("), false);
  assert.equal(dogfoodText.includes("globalThis.fetch("), false);
  assert.equal(dogfoodText.includes("XMLHttpRequest"), false);
  assert.equal(dogfoodText.includes("responses.create"), false);
  assert.equal(dogfoodText.includes("openai.chat"), false);
  assert.equal(dogfoodText.includes("app/api/"), false);
  assert.equal(dogfoodText.includes("clipboard"), true);
  assert.equal(smokeText.includes("child_process"), true);
  assert.equal(docText.includes("runtime routes"), true);
}

function assertChangedFileBoundary() {
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `Separate-session provenance-clean capture changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/api/") &&
        !changedFile.startsWith("components/") &&
        changedFile !== "app/globals.css" &&
        !changedFile.startsWith("lib/"),
      `Separate-session provenance-clean capture must not change forbidden surfaces: ${changedFile}`,
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
      "Unable to collect base diff for separate-session provenance-clean capture smoke",
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

function assertNoRawUnsafeMarkersInPublicText(value) {
  for (const marker of [
    "hidden_reasoning",
    "raw page dumps",
    "raw PR diffs",
    "raw review payloads",
  ]) {
    assert.equal(
      value.includes(marker),
      false,
      `public artifact must not echo raw unsafe marker ${marker}`,
    );
  }
}
