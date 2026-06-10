import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const manualCopyPacketFile =
  "lib/perspective-ingest/perspective-codex-former-manual-copy-packet.ts";
const dogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-provenance-stale-wording.mjs";
const smokeFile =
  "scripts/smoke-perspective-codex-former-provenance-stale-wording.mjs";
const docFile =
  "docs/PERSPECTIVE_CODEX_FORMER_PROVENANCE_STALE_WORDING_V0_1.md";
const reportFile =
  "reports/2026-06-09-perspective-codex-former-provenance-stale-wording.md";
const manualCopyPacketSmokeFile =
  "scripts/smoke-perspective-codex-former-manual-copy-packet.mjs";
const neighboringSmokeAllowlistFiles = [
  "scripts/dogfood-perspective-codex-former-separate-session-provenance-clean-capture.mjs",
  "scripts/smoke-perspective-codex-former-separate-session-provenance-clean-capture.mjs",
  "docs/PERSPECTIVE_CODEX_FORMER_SEPARATE_SESSION_PROVENANCE_CLEAN_CAPTURE_V0_1.md",
  "reports/dogfood/2026-06-10-perspective-codex-former-separate-session-provenance-clean-capture.md",
  "scripts/smoke-perspective-candidate-builder-fixture.mjs",
  "scripts/smoke-perspective-codex-former-draft-schema-alignment.mjs",
  "scripts/smoke-perspective-codex-former-manual-copy-real-transcript.mjs",
  "scripts/smoke-perspective-codex-former-manual-copy-transcript.mjs",
  "scripts/smoke-perspective-codex-former-pipeline-dogfood.mjs",
  "scripts/smoke-perspective-codex-former-pipeline.mjs",
  "scripts/smoke-perspective-codex-former-prompt-contract-canonical-schema.mjs",
  "scripts/smoke-perspective-codex-former-prompt-contract.mjs",
  "scripts/smoke-perspective-codex-former-real-transcript-capture-instructions.mjs",
  "scripts/smoke-perspective-codex-former-refined-findings-contract.mjs",
  "scripts/smoke-perspective-codex-former-refined-prompt-real-transcript.mjs",
  "scripts/smoke-perspective-codex-former-second-refined-transcript.mjs",
  "scripts/smoke-perspective-worker-facing-guidance.mjs",
  "scripts/dogfood-perspective-codex-former-provenance-clean-transcript-capture.mjs",
  "scripts/smoke-perspective-codex-former-provenance-clean-transcript-capture.mjs",
  "docs/PERSPECTIVE_CODEX_FORMER_PROVENANCE_CLEAN_TRANSCRIPT_CAPTURE_V0_1.md",
  "reports/dogfood/2026-06-10-perspective-codex-former-provenance-clean-transcript-capture.md",
  "scripts/dogfood-perspective-codex-former-separate-session-capture-packet-prep.mjs",
  "scripts/smoke-perspective-codex-former-separate-session-capture-packet-prep.mjs",
  "docs/PERSPECTIVE_CODEX_FORMER_SEPARATE_SESSION_CAPTURE_PACKET_PREP_V0_1.md",
  "reports/2026-06-10-perspective-codex-former-separate-session-capture-packet-prep.md",
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
  manualCopyPacketSmokeFile,
  ...neighboringSmokeAllowlistFiles,
]);

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const manualCopyPacketText = readFileSync(manualCopyPacketFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");

const {
  PROVENANCE_STALE_WORDING_ARTIFACT_PATH,
  PROVENANCE_STALE_WORDING_DOC_PATH,
  PROVENANCE_STALE_WORDING_RECOMMENDED_NEXT_PR,
  buildPerspectiveCodexFormerProvenanceStaleWordingDogfood,
  classifyCodexFormerTranscriptProvenance,
  detectCodexFormerProvenanceStaleWording,
  deriveProvenanceStaleWordingConclusion,
  runPerspectiveCodexFormerProvenanceStaleWordingDogfood,
} = await import("./dogfood-perspective-codex-former-provenance-stale-wording.mjs");
const { buildPerspectiveFormationInputBundle } = await import(
  "../lib/perspective-ingest/perspective-formation-input-bundle.ts"
);
const { buildCodexPerspectiveFormerInputPacket } = await import(
  "../lib/perspective-ingest/perspective-codex-former-input-packet.ts"
);
const {
  buildManualCodexPerspectiveFormerDraftCopyPacket,
  evaluateManualCodexPerspectiveFormerDraftCopyPacket,
} = await import(
  "../lib/perspective-ingest/perspective-codex-former-manual-copy-packet.ts"
);

assert.equal(existsSync(dogfoodScriptFile), true, `${dogfoodScriptFile} must exist`);
assert.equal(existsSync(smokeFile), true, `${smokeFile} must exist`);
assert.equal(existsSync(docFile), true, `${docFile} must exist`);

assert.equal(
  packageJson.scripts[
    "dogfood:perspective-codex-former-provenance-stale-wording"
  ],
  `${expectedTsxCommand} ${dogfoodScriptFile}`,
  "package.json must register provenance/stale-wording dogfood",
);
assert.equal(
  packageJson.scripts[
    "smoke:perspective-codex-former-provenance-stale-wording"
  ],
  `${expectedTsxCommand} ${smokeFile}`,
  "package.json must register provenance/stale-wording smoke",
);

assertManualCopyPacketSource();
assertDogfoodBuildAndReport();
assertManualCopyPacketCurrentContractLabel();
assertCaptureReturnEnvelope();
assertPreCaptureGapHandling();
assertStaleAndCleanFixtures();
assertProvenanceFixtures();
assertRegressionSafety();
assertDocsAndReport();
assertChangedFileBoundary();

console.log("PASS smoke:perspective-codex-former-provenance-stale-wording");

function assertManualCopyPacketSource() {
  assertContainsAll(manualCopyPacketText, [
    "copyable_prompt_hash",
    "capture_return_envelope",
    "buildCaptureReturnEnvelope",
    "Prompt contract: CodexPerspectiveFormerDraftPromptContract v0.1",
    "The former input packet may mention that a transcript is missing because it was generated before this capture.",
    "Do not repeat that as current state after this response exists.",
    "Use needs_review because local validation has not yet run, not because this response does not exist.",
    "REAL TRANSCRIPT CAPTURE AFTER MANUAL COPY PACKET",
    "source_manual_copy_packet_id",
    "source_former_input_packet_id",
    "source_prompt_hash",
    "RETURNED_CODEX_RESPONSE",
  ]);
  assert.equal(
    manualCopyPacketText.includes("Use the PR #479 prompt contract below."),
    false,
    "manual copy packet source must not render stale PR #479 prompt wording",
  );
}

function assertDogfoodBuildAndReport() {
  const first = buildPerspectiveCodexFormerProvenanceStaleWordingDogfood();
  const second = buildPerspectiveCodexFormerProvenanceStaleWordingDogfood();

  assert.equal(first.artifact, second.artifact);
  assert.equal(first.paths.artifact, PROVENANCE_STALE_WORDING_ARTIFACT_PATH);
  assert.equal(first.paths.doc, PROVENANCE_STALE_WORDING_DOC_PATH);
  assert.equal(first.evaluation.conclusion, "PASS with follow-up");
  assert.equal(
    first.evaluation.recommended_next_pr_title,
    PROVENANCE_STALE_WORDING_RECOMMENDED_NEXT_PR,
  );
  assert.equal(first.scenarios.length, 8);
  assert.equal(
    deriveProvenanceStaleWordingConclusion(first.scenarios),
    "PASS with follow-up",
  );

  const written = runPerspectiveCodexFormerProvenanceStaleWordingDogfood();
  assert.equal(written.artifact, first.artifact);
  assert.equal(readFileSync(reportFile, "utf8"), first.artifact);
}

function assertManualCopyPacketCurrentContractLabel() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerProvenanceStaleWordingDogfood(),
    "manual_copy_packet_current_contract_label",
  );

  assert.equal(scenario.conclusion, "PASS");
  assert.equal(
    scenario.copyable_prompt_contains_stale_pr_479_contract_label,
    false,
  );
  assert.equal(scenario.copyable_prompt_uses_old_pr_contract_identity, false);
  assert.equal(scenario.stable_contract_label_present, true);

  const packet = buildManualPacket();
  assert.equal(
    packet.copyable_codex_prompt_text.includes(
      "Use the PR #479 prompt contract below.",
    ),
    false,
  );
  assert.match(
    packet.copyable_codex_prompt_text,
    /Prompt contract: CodexPerspectiveFormerDraftPromptContract v0\.1/,
  );
  assert.doesNotMatch(packet.copyable_codex_prompt_text, /Prompt contract:.*PR #/);
  assert.equal(packet.copy_status, "needs_review");
  assert.equal(
    evaluateManualCodexPerspectiveFormerDraftCopyPacket(packet)
      .evaluation_status,
    "passes",
  );
}

function assertCaptureReturnEnvelope() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerProvenanceStaleWordingDogfood(),
    "capture_return_envelope_present",
  );
  const packet = buildManualPacket();
  const template = packet.capture_return_envelope.copyable_capture_return_template;

  assert.equal(scenario.conclusion, "PASS");
  assert.equal(scenario.required_fields_present, true);
  assert.equal(scenario.provenance_ids_match_packet, true);
  assert.equal(
    packet.capture_return_envelope.source_manual_copy_packet_id,
    packet.packet_id,
  );
  assert.equal(
    packet.capture_return_envelope.source_former_input_packet_id,
    packet.source_former_input_packet.packet_id,
  );
  assert.equal(
    packet.capture_return_envelope.source_prompt_hash,
    packet.copyable_prompt_hash,
  );
  assertContainsAll(template, [
    "REAL TRANSCRIPT CAPTURE AFTER MANUAL COPY PACKET",
    "capture_method: human_manual",
    "codex_surface_label:",
    "prompt_was_generated_by_manual_copy_packet: true",
    "source_manual_copy_packet_id:",
    "source_former_input_packet_id:",
    "source_prompt_hash:",
    "captured_at: <timestamp or unknown>",
    "TRANSCRIPT_REDACTION_NOTES:",
    "RETURNED_CODEX_RESPONSE:",
    "END RETURNED_CODEX_RESPONSE",
    "No hidden reasoning",
    "cookies",
    "tokens",
    "provider logs",
    "raw page dumps",
    "raw PR diffs",
    "raw review payloads",
    "secrets",
  ]);
}

function assertPreCaptureGapHandling() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerProvenanceStaleWordingDogfood(),
    "pre_capture_gap_not_current_state",
  );

  assert.equal(scenario.conclusion, "PASS");
  assert.equal(scenario.source_packet_pre_capture_gap, true);
  assert.equal(scenario.captured_transcript_present, true);
  assert.equal(scenario.post_capture_remaining_gap, "local_validation_required");
  assert.equal(scenario.stale_source_gap_treated_as_current_state, false);
  assert.equal(scenario.prompt_warns_against_stale_gap_echo, true);
}

function assertStaleAndCleanFixtures() {
  const dogfood = buildPerspectiveCodexFormerProvenanceStaleWordingDogfood();
  const stale = requireScenario(dogfood, "stale_wording_detection_fixture");
  const clean = requireScenario(
    dogfood,
    "clean_second_transcript_style_fixture",
  );
  const findings = detectCodexFormerProvenanceStaleWording({
    text:
      "the transcript has not yet been captured; review against the PR #479 prompt contract; Capture the bounded second human-started Codex response transcript",
    capturedTranscriptPresent: true,
  });

  assert.equal(stale.conclusion, "PASS with follow-up");
  assertContainsAll(stale.stale_wording_findings, [
    "stale_source_packet_gap_echo",
    "stale_capture_next_action_after_supplied_transcript",
    "stale_old_pr_prompt_contract_reference",
  ]);
  assert.equal(stale.classification, "needs_review");
  assert.equal(stale.stale_wording_becomes_accepted_state, false);
  assert.equal(stale.candidate_compatible_material, true);
  assertContainsAll(findings, [
    "stale_source_packet_gap_echo",
    "stale_capture_next_action_after_supplied_transcript",
    "stale_old_pr_prompt_contract_reference",
  ]);

  assert.equal(clean.conclusion, "PASS");
  assert.deepEqual(clean.stale_wording_findings, []);
  assert.equal(clean.contract_fit_status, "fits_contract");
  assert.equal(clean.candidate_compatible_material, true);
  assert.equal(clean.worker_guidance_advisory_only, true);
}

function assertProvenanceFixtures() {
  const dogfood = buildPerspectiveCodexFormerProvenanceStaleWordingDogfood();
  const complete = requireScenario(dogfood, "provenance_complete_fixture");
  const partial = requireScenario(dogfood, "provenance_partial_fixture");
  const packet = buildManualPacket();

  assert.equal(complete.conclusion, "PASS");
  assert.equal(complete.provenance_status, "complete");
  assert.deepEqual(complete.missing_fields, []);
  assert.equal(complete.fabricated_metadata, false);

  assert.equal(partial.conclusion, "PASS");
  assert.equal(partial.provenance_status, "needs_review");
  assertContainsAll(partial.missing_fields, [
    "source_manual_copy_packet_id",
    "source_prompt_hash",
  ]);
  assert.equal(partial.source_manual_copy_packet_id, "not_supplied_in_chat");
  assert.equal(partial.source_prompt_hash, "not_supplied_in_chat");
  assert.equal(partial.fabricated_metadata, false);

  const directComplete = classifyCodexFormerTranscriptProvenance({
    envelope: {
      source_manual_copy_packet_id: packet.packet_id,
      source_former_input_packet_id: packet.source_former_input_packet.packet_id,
      source_prompt_hash: packet.copyable_prompt_hash,
    },
    expectedFormerInputPacketId: packet.source_former_input_packet.packet_id,
  });
  assert.equal(directComplete.provenance_status, "complete");
}

function assertRegressionSafety() {
  const scenario = requireScenario(
    buildPerspectiveCodexFormerProvenanceStaleWordingDogfood(),
    "regression_safety",
  );

  assert.equal(scenario.conclusion, "PASS");
  assert.equal(scenario.contract_fit_status, "violates_contract");
  assert.equal(scenario.validation_status, "blocked");
  assert.equal(scenario.unsafe_or_authority_survived, false);
  assert(
    scenario.blocked_reasons.some((reason) =>
      reason.includes("draft source former input packet ref does not match"),
    ),
    "regression safety must reject source former input packet mismatch",
  );
}

function assertDocsAndReport() {
  assertContainsAll(docText, [
    "Perspective Codex Former Provenance And Stale Wording v0.1",
    "follows PR #488",
    "CodexPerspectiveFormerDraftPromptContract v0.1",
    "REAL TRANSCRIPT CAPTURE AFTER MANUAL COPY PACKET",
    "source_manual_copy_packet_id",
    "source_prompt_hash",
    "source_packet_pre_capture_gap",
    "captured_transcript_present",
    "post_capture_remaining_gap",
    "stale source-packet echo",
    "PASS with follow-up",
    "Dogfood provenance-clean Codex former transcript capture",
  ]);
  assertContainsAll(reportText, [
    "What PR #488 Found",
    "stale_pr_479_prompt_contract_reference",
    "source_manual_copy_packet_id and source_prompt_hash",
    "Manual Copy Packet Wording Changed",
    "Capture Return Envelope Added",
    "Source Pre-Capture Gap Vs Post-Capture State",
    "Stale PR #479 contract wording remains in newly generated prompt: false",
    "Complete provenance status: complete",
    "Partial provenance status: needs_review",
    "No. This PR does not capture a new transcript.",
    "Browser/Computer-Use Validation",
    "PASS with follow-up",
  ]);
}

function buildManualPacket() {
  const bundle = buildPerspectiveFormationInputBundle({
    generated_at: "2026-06-10T00:00:00.000Z",
    scope: "project:augnes",
    work_id: "AG-provenance-stale-wording-smoke",
    source_pr_refs: ["pr:hynk-studio/augnes#488"],
    changed_files: [manualCopyPacketFile, dogfoodScriptFile, smokeFile],
    changed_files_summary:
      "Smoke fixture for provenance capture envelope and stale wording guidance.",
    skipped_checks: [
      {
        check_id: "check:future-transcript",
        skipped_reason:
          "A future real transcript capture remains to confirm the refined packet.",
        result_summary: "No transcript captured in this PR.",
      },
    ],
    unresolved_gaps: [
      {
        gap_id: "gap:future-transcript-confirmation",
        summary:
          "The next real transcript capture should confirm complete provenance.",
      },
    ],
    evidence_row_refs: ["evidence:row:provenance-stale-wording-smoke"],
    work_event_refs: ["work:event:provenance-stale-wording-smoke"],
    existing_perspective_refs: [
      "perspective:codex-former-second-refined-transcript:v0.1",
    ],
    authority_boundaries: [
      "Pure local provenance/stale wording smoke fixture.",
    ],
  });
  const formerInputPacket = buildCodexPerspectiveFormerInputPacket(bundle);

  return buildManualCodexPerspectiveFormerDraftCopyPacket({
    former_input_packet: formerInputPacket,
    manual_context: {
      reviewer_label: "manual reviewer",
      intended_codex_surface: "Codex",
    },
    generated_at: "2026-06-10T00:00:00.000Z",
  });
}

function assertChangedFileBoundary() {
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `Perspective Codex former provenance stale wording changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/api/") &&
        !changedFile.startsWith("components/") &&
        changedFile !== "app/globals.css" &&
        (!changedFile.startsWith("lib/") ||
          changedFile === manualCopyPacketFile),
      `Perspective Codex former provenance stale wording must not change forbidden surfaces: ${changedFile}`,
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
      "Unable to collect base diff for Perspective Codex former provenance stale wording smoke",
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
