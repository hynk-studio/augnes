import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const dogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-separate-session-capture-packet-prep.mjs";
const smokeFile =
  "scripts/smoke-perspective-codex-former-separate-session-capture-packet-prep.mjs";
const docFile =
  "docs/PERSPECTIVE_CODEX_FORMER_SEPARATE_SESSION_CAPTURE_PACKET_PREP_V0_1.md";
const reportFile =
  "reports/2026-06-10-perspective-codex-former-separate-session-capture-packet-prep.md";

const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";
const allowedChangedFiles = new Set([
  packageFile,
  dogfoodScriptFile,
  smokeFile,
  docFile,
  reportFile,
  "scripts/dogfood-perspective-codex-former-separate-session-provenance-clean-capture.mjs",
  "scripts/smoke-perspective-codex-former-separate-session-provenance-clean-capture.mjs",
  "docs/PERSPECTIVE_CODEX_FORMER_SEPARATE_SESSION_PROVENANCE_CLEAN_CAPTURE_V0_1.md",
  "reports/dogfood/2026-06-10-perspective-codex-former-separate-session-provenance-clean-capture.md",
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
  "scripts/smoke-perspective-codex-former-provenance-clean-transcript-capture.mjs",
  "scripts/smoke-perspective-codex-former-provenance-stale-wording.mjs",
]);
const bannedManualCopyPacketIds = new Set([
  "manual-codex-former-copy:v0.1:4wl862",
  "manual-codex-former-copy:v0.1:1h8nabl",
  "manual-codex-former-copy:v0.1:1smxq68",
]);
const bannedFormerInputPacketIds = new Set([
  "codex-perspective-former-input:v0.1:project-augnes-ag-refined-codex-former-canonical:odnwc7",
  "codex-perspective-former-input:v0.1:project-augnes-ag-second-refined-codex-former-tr:13keb5c",
  "codex-perspective-former-input:v0.1:project-augnes-ag-provenance-clean-codex-former-:1t2k3qo",
]);
const bannedPromptHashes = new Set([
  "35ab4e77f689514ac22ca098111f6cf7553d6bf1cf3a733c30f67572f403ca17",
  "cc5e44414a9e2942c57cad1ded854194d0a3f4f45be199509ca8600230b185d5",
  "1bctd1u",
]);

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const dogfoodText = readFileSync(dogfoodScriptFile, "utf8");
const smokeText = readFileSync(smokeFile, "utf8");
const docText = readFileSync(docFile, "utf8");

const {
  SEPARATE_SESSION_CAPTURE_PACKET_PREP_ARTIFACT_PATH,
  SEPARATE_SESSION_CAPTURE_PACKET_PREP_CONCLUSION,
  SEPARATE_SESSION_CAPTURE_PACKET_PREP_DOC_PATH,
  SEPARATE_SESSION_CAPTURE_PACKET_PREP_RECOMMENDED_NEXT_PR,
  buildPerspectiveCodexFormerSeparateSessionCapturePacketPrep,
  runPerspectiveCodexFormerSeparateSessionCapturePacketPrep,
} = await import(
  "./dogfood-perspective-codex-former-separate-session-capture-packet-prep.mjs"
);

assert.equal(existsSync(dogfoodScriptFile), true, `${dogfoodScriptFile} must exist`);
assert.equal(existsSync(smokeFile), true, `${smokeFile} must exist`);
assert.equal(existsSync(docFile), true, `${docFile} must exist`);

assert.equal(
  packageJson.scripts[
    "dogfood:perspective-codex-former-separate-session-capture-packet-prep"
  ],
  `${expectedTsxCommand} ${dogfoodScriptFile}`,
  "package.json must register separate-session capture packet prep dogfood",
);
assert.equal(
  packageJson.scripts[
    "smoke:perspective-codex-former-separate-session-capture-packet-prep"
  ],
  `${expectedTsxCommand} ${smokeFile}`,
  "package.json must register separate-session capture packet prep smoke",
);

assertDogfoodBuildAndReport();
assertTranscriptAvailability();
assertFreshGeneratedPacket();
assertCaptureInstructionArtifact();
assertNoSuccessClaimWithoutTranscript();
assertAuthorityBoundary();
assertDocsAndReport();
assertNoForbiddenSurfaces();
assertChangedFileBoundary();

console.log(
  "PASS smoke:perspective-codex-former-separate-session-capture-packet-prep",
);

function assertDogfoodBuildAndReport() {
  const first = buildPerspectiveCodexFormerSeparateSessionCapturePacketPrep();
  const second = buildPerspectiveCodexFormerSeparateSessionCapturePacketPrep();

  assert.equal(first.artifact, second.artifact);
  assert.equal(first.paths.artifact, SEPARATE_SESSION_CAPTURE_PACKET_PREP_ARTIFACT_PATH);
  assert.equal(first.paths.doc, SEPARATE_SESSION_CAPTURE_PACKET_PREP_DOC_PATH);
  assert.equal(first.evaluation.conclusion, SEPARATE_SESSION_CAPTURE_PACKET_PREP_CONCLUSION);
  assert.equal(
    first.evaluation.recommended_next_pr_title,
    SEPARATE_SESSION_CAPTURE_PACKET_PREP_RECOMMENDED_NEXT_PR,
  );
  assert.equal(first.evaluation.real_separate_session_transcript_supplied, true);
  assert.equal(first.packet_validation.status, "passes");
  assert.equal(first.scenarios.length, 5);
  assert.deepEqual(
    first.scenarios.map((scenario) => scenario.scenario_id),
    [
      "separate_session_transcript_availability",
      "generated_packet_match",
      "capture_instruction_artifact",
      "no_confirmation_claim_without_transcript",
      "authority_boundary",
    ],
  );

  const written = runPerspectiveCodexFormerSeparateSessionCapturePacketPrep();
  assert.equal(written.artifact, first.artifact);
  assert.equal(readFileSync(reportFile, "utf8"), first.artifact);
}

function assertTranscriptAvailability() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerSeparateSessionCapturePacketPrep(),
    "separate_session_transcript_availability",
  );

  assert.equal(scenario.conclusion, "PASS");
  assert.equal(scenario.transcript_available, true);
  assert.equal(scenario.real_separate_session_envelope_supplied, true);
  assert.equal(scenario.capture_method, "human_manual");
  assert.equal(scenario.capture_surface, "separate user-started Codex session");
  assert.equal(scenario.prompt_was_generated_by_manual_copy_packet, true);
  assert.deepEqual(scenario.blocked_reasons, []);
}

function assertFreshGeneratedPacket() {
  const dogfood = buildPerspectiveCodexFormerSeparateSessionCapturePacketPrep();
  const scenario = requireScenario(dogfood, "generated_packet_match");

  assert.equal(scenario.conclusion, "PASS");
  assert.equal(scenario.manual_copy_packet_id_fresh, true);
  assert.equal(scenario.former_input_packet_id_fresh, true);
  assert.equal(scenario.copyable_prompt_hash_fresh, true);
  assert.equal(scenario.copyable_prompt_hash_present, true);
  assert.equal(scenario.stable_contract_label_present, true);
  assert.equal(
    scenario.copyable_prompt_contains_stale_pr_479_contract_label,
    false,
  );
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
  assert.equal(
    dogfood.generated_packet.copyable_codex_prompt_text.includes(
      "Prompt contract: CodexPerspectiveFormerDraftPromptContract v0.1",
    ),
    true,
  );
}

function assertCaptureInstructionArtifact() {
  const dogfood = buildPerspectiveCodexFormerSeparateSessionCapturePacketPrep();
  const scenario = requireScenario(dogfood, "capture_instruction_artifact");

  assert.equal(scenario.conclusion, "PASS");
  assert.equal(scenario.copyable_prompt_stored_in_report, true);
  assert.equal(scenario.capture_return_envelope_stored_in_report, true);
  assert.equal(scenario.capture_method_template, "human_manual");
  assert.equal(
    scenario.codex_surface_label_template,
    "separate user-started Codex session",
  );
  assert.equal(scenario.prompt_was_generated_by_manual_copy_packet, true);
  assert.equal(scenario.template_has_response_bounds, true);
  assert.equal(
    scenario.source_manual_copy_packet_id,
    dogfood.context.manual_copy_packet_id,
  );
  assert.equal(
    scenario.source_former_input_packet_id,
    dogfood.context.former_input_packet_id,
  );
  assert.equal(scenario.source_prompt_hash, dogfood.context.copyable_prompt_hash);
  assertContainsAll(dogfood.capture_return_envelope, [
    "REAL TRANSCRIPT CAPTURE AFTER MANUAL COPY PACKET",
    "capture_method: human_manual",
    "codex_surface_label: separate user-started Codex session",
    "prompt_was_generated_by_manual_copy_packet: true",
    "source_manual_copy_packet_id:",
    "source_former_input_packet_id:",
    "source_prompt_hash:",
    "RETURNED_CODEX_RESPONSE:",
    "END RETURNED_CODEX_RESPONSE",
  ]);
}

function assertNoSuccessClaimWithoutTranscript() {
  const dogfood = buildPerspectiveCodexFormerSeparateSessionCapturePacketPrep();
  const scenario = requireScenario(
    dogfood,
    "no_confirmation_claim_without_transcript",
  );

  assert.equal(scenario.conclusion, "PASS");
  assert.equal(scenario.transcript_available, true);
  assert.equal(scenario.separate_session_confirmation_claimed, false);
  assert.equal(
    scenario.contract_fit_result,
    "delegated_to_follow_up_capture_dogfood",
  );
  assert.equal(
    scenario.direct_validation_result,
    "delegated_to_follow_up_capture_dogfood",
  );
  assert.equal(
    scenario.alignment_safety_net_result,
    "delegated_to_follow_up_capture_dogfood",
  );
  assert.equal(
    scenario.downstream_guidance_result,
    "delegated_to_follow_up_capture_dogfood",
  );
  assert.equal(
    dogfood.artifact.includes("Contract-fit status: fits_contract"),
    false,
  );
  assert.equal(
    dogfood.artifact.includes("Direct validation returned"),
    false,
  );
  assert.equal(
    dogfood.artifact.includes("Worker-Facing Guidance ran advisory-only"),
    false,
  );
}

function assertAuthorityBoundary() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerSeparateSessionCapturePacketPrep(),
    "authority_boundary",
  );

  assert.equal(scenario.conclusion, "PASS");
  assert.equal(scenario.authority_flags_all_false, true);
  assert.equal(scenario.raw_payloads_included, false);
  assert.equal(scenario.browser_computer_use_required, false);
  assert.equal(scenario.browser_computer_use_status, "not_required");
}

function assertDocsAndReport() {
  const dogfood = buildPerspectiveCodexFormerSeparateSessionCapturePacketPrep();
  const reportText = readFileSync(reportFile, "utf8");

  assertContainsAll(docText, [
    "Perspective Codex Former Separate-Session Capture Packet Prep v0.1",
    "follows PR #490",
    "real separate-session transcript envelope has now been supplied",
    "PASS with follow-up",
    "Capture separate-session provenance-clean Codex former transcript",
    "manual copy packet id",
    "source_prompt_hash",
    "CodexPerspectiveFormerDraftPromptContract v0.1",
  ]);
  assertContainsAll(reportText, [
    "Perspective Codex Former Separate-Session Capture Packet Prep",
    "Why This Follows PR #490",
    "Whether Real Separate-Session Transcript Was Supplied",
    "Capture Method And Provenance",
    "Generated Packet Metadata",
    "Contract-Fit Result",
    "Direct Validation Result",
    "Alignment Safety-Net Result",
    "Downstream Guidance Result",
    "Stale Wording Regression Result",
    "Evaluation Conclusion",
    "Copyable Prompt For Separate User-Started Codex Session",
    "Capture Return Envelope To Paste Back",
    "What Codex Did Not Do",
    "PASS with follow-up",
    "Transcript available: true",
    "Result: delegated_to_follow_up_capture_dogfood",
    "Follow-up capture artifact: reports/dogfood/2026-06-10-perspective-codex-former-separate-session-provenance-clean-capture.md",
    "Stale PR #479 prompt wording present: false",
    "Capture separate-session provenance-clean Codex former transcript",
  ]);
  assertContainsAll(reportText, [
    dogfood.generated_packet.manual_copy_packet_id,
    dogfood.generated_packet.former_input_packet_id,
    dogfood.generated_packet.copyable_prompt_hash,
    dogfood.generated_packet.copyable_codex_prompt_text.trimEnd(),
    dogfood.capture_return_envelope.trimEnd(),
  ]);
}

function assertNoForbiddenSurfaces() {
  assert.equal(dogfoodText.includes("await fetch("), false);
  assert.equal(dogfoodText.includes("globalThis.fetch("), false);
  assert.equal(dogfoodText.includes("XMLHttpRequest"), false);
  assert.equal(dogfoodText.includes("openai.chat"), false);
  assert.equal(dogfoodText.includes("responses.create"), false);
  assert.equal(dogfoodText.includes("app/api/"), false);
  assert.equal(dogfoodText.includes("clipboard"), true);
  assert.equal(smokeText.includes("child_process"), true);
  assert.equal(docText.includes("runtime route"), true);
}

function assertChangedFileBoundary() {
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `Separate-session capture packet prep changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/api/") &&
        !changedFile.startsWith("components/") &&
        changedFile !== "app/globals.css" &&
        !changedFile.startsWith("lib/"),
      `Separate-session capture packet prep must not change forbidden surfaces: ${changedFile}`,
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
      "Unable to collect base diff for separate-session capture packet prep smoke",
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
