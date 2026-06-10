import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const manualCopyPacketFile =
  "lib/perspective-ingest/perspective-codex-former-manual-copy-packet.ts";
const promptContractFile =
  "lib/perspective-ingest/perspective-codex-former-prompt-contract.ts";
const formerInputPacketFile =
  "lib/perspective-ingest/perspective-codex-former-input-packet.ts";
const draftPipelineFile =
  "lib/perspective-ingest/perspective-codex-candidate-draft-pipeline.ts";
const docFile =
  "docs/PERSPECTIVE_CODEX_FORMER_MANUAL_COPY_PACKET_V0_1.md";
const reportFile =
  "reports/2026-06-09-perspective-codex-former-manual-copy-packet.md";
const smokeFile =
  "scripts/smoke-perspective-codex-former-manual-copy-packet.mjs";
const promptContractDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_PROMPT_CONTRACT_V0_1.md";
const promptContractReportFile =
  "reports/2026-06-09-perspective-codex-former-prompt-contract.md";
const promptContractSmokeFile =
  "scripts/smoke-perspective-codex-former-prompt-contract.mjs";
const formerPipelineDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_PIPELINE_V0_1.md";
const formerDogfoodDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_PIPELINE_DOGFOOD_V0_1.md";
const formerPipelineSmokeFile =
  "scripts/smoke-perspective-codex-former-pipeline.mjs";
const formerDogfoodSmokeFile =
  "scripts/smoke-perspective-codex-former-pipeline-dogfood.mjs";
const workerGuidanceSmokeFile =
  "scripts/smoke-perspective-worker-facing-guidance.mjs";
const candidateBuilderSmokeFile =
  "scripts/smoke-perspective-candidate-builder-fixture.mjs";
const transcriptDogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-manual-copy-transcript.mjs";
const transcriptDogfoodSmokeFile =
  "scripts/smoke-perspective-codex-former-manual-copy-transcript.mjs";
const transcriptDogfoodDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_MANUAL_COPY_TRANSCRIPT_DOGFOOD_V0_1.md";
const transcriptDogfoodReportFile =
  "reports/dogfood/2026-06-09-perspective-codex-former-manual-copy-transcript.md";
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
const canonicalPromptContractDogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-prompt-contract-canonical-schema.mjs";
const canonicalPromptContractSmokeFile =
  "scripts/smoke-perspective-codex-former-prompt-contract-canonical-schema.mjs";
const canonicalPromptContractDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_PROMPT_CONTRACT_CANONICAL_SCHEMA_V0_1.md";
const canonicalPromptContractReportFile =
  "reports/2026-06-09-perspective-codex-former-prompt-contract-canonical-schema.md";
const refinedPromptRealTranscriptDogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-refined-prompt-real-transcript.mjs";
const refinedPromptRealTranscriptSmokeFile =
  "scripts/smoke-perspective-codex-former-refined-prompt-real-transcript.mjs";
const refinedPromptRealTranscriptDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_REFINED_PROMPT_REAL_TRANSCRIPT_DOGFOOD_V0_1.md";
const refinedPromptRealTranscriptReportFile =
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
const provenanceCleanTranscriptCaptureDogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-provenance-clean-transcript-capture.mjs";
const provenanceCleanTranscriptCaptureSmokeFile =
  "scripts/smoke-perspective-codex-former-provenance-clean-transcript-capture.mjs";
const provenanceCleanTranscriptCaptureDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_PROVENANCE_CLEAN_TRANSCRIPT_CAPTURE_V0_1.md";
const provenanceCleanTranscriptCaptureReportFile =
  "reports/dogfood/2026-06-10-perspective-codex-former-provenance-clean-transcript-capture.md";
const separateSessionCapturePacketPrepDogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-separate-session-capture-packet-prep.mjs";
const separateSessionCapturePacketPrepSmokeFile =
  "scripts/smoke-perspective-codex-former-separate-session-capture-packet-prep.mjs";
const separateSessionCapturePacketPrepDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_SEPARATE_SESSION_CAPTURE_PACKET_PREP_V0_1.md";
const separateSessionCapturePacketPrepReportFile =
  "reports/2026-06-10-perspective-codex-former-separate-session-capture-packet-prep.md";
const refinedFindingsContractDogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-refined-findings-contract.mjs";
const refinedFindingsContractSmokeFile =
  "scripts/smoke-perspective-codex-former-refined-findings-contract.mjs";
const refinedFindingsContractDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_REFINED_FINDINGS_CONTRACT_V0_1.md";
const refinedFindingsContractReportFile =
  "reports/2026-06-09-perspective-codex-former-refined-findings-contract.md";

const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";
const noBrowserComputerUseReason =
  "Not run: no browser/computer-use validation required because this PR is pure local library/docs/report/smoke/package work and adds no UI, route, browser-visible surface, or interactive copy control.";
const allowedChangedFiles = new Set([
  "scripts/dogfood-perspective-codex-former-separate-session-provenance-clean-capture.mjs",
  "scripts/smoke-perspective-codex-former-separate-session-provenance-clean-capture.mjs",
  "docs/PERSPECTIVE_CODEX_FORMER_SEPARATE_SESSION_PROVENANCE_CLEAN_CAPTURE_V0_1.md",
  "reports/dogfood/2026-06-10-perspective-codex-former-separate-session-provenance-clean-capture.md",
  "docs/PERSPECTIVE_CODEX_FORMER_MANUAL_WORKFLOW_V0_1.md",
  "reports/2026-06-10-perspective-codex-former-manual-workflow-docs.md",
  "scripts/smoke-perspective-codex-former-manual-workflow-docs.mjs",
  "scripts/perspective-codex-former-capture-helper.mjs",
  "scripts/smoke-perspective-codex-former-capture-helper.mjs",
  "reports/2026-06-10-perspective-codex-former-capture-helper.md",
  "reports/2026-06-10-perspective-codex-former-capture-helper-parameterized-input.md",
  packageFile,
  manualCopyPacketFile,
  promptContractFile,
  formerInputPacketFile,
  draftPipelineFile,
  docFile,
  reportFile,
  smokeFile,
  promptContractDocFile,
  promptContractReportFile,
  promptContractSmokeFile,
  formerPipelineDocFile,
  formerDogfoodDocFile,
  formerPipelineSmokeFile,
  formerDogfoodSmokeFile,
  workerGuidanceSmokeFile,
  candidateBuilderSmokeFile,
  transcriptDogfoodScriptFile,
  transcriptDogfoodSmokeFile,
  transcriptDogfoodDocFile,
  transcriptDogfoodReportFile,
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
  canonicalPromptContractDogfoodScriptFile,
  canonicalPromptContractSmokeFile,
  canonicalPromptContractDocFile,
  canonicalPromptContractReportFile,
  refinedPromptRealTranscriptDogfoodScriptFile,
  refinedPromptRealTranscriptSmokeFile,
  refinedPromptRealTranscriptDocFile,
  refinedPromptRealTranscriptReportFile,
  secondRefinedTranscriptDogfoodScriptFile,
  secondRefinedTranscriptSmokeFile,
  secondRefinedTranscriptDocFile,
  secondRefinedTranscriptReportFile,
  provenanceStaleWordingDogfoodScriptFile,
  provenanceStaleWordingSmokeFile,
  provenanceStaleWordingDocFile,
  provenanceStaleWordingReportFile,
  provenanceCleanTranscriptCaptureDogfoodScriptFile,
  provenanceCleanTranscriptCaptureSmokeFile,
  provenanceCleanTranscriptCaptureDocFile,
  provenanceCleanTranscriptCaptureReportFile,
  separateSessionCapturePacketPrepDogfoodScriptFile,
  separateSessionCapturePacketPrepSmokeFile,
  separateSessionCapturePacketPrepDocFile,
  separateSessionCapturePacketPrepReportFile,
  refinedFindingsContractDogfoodScriptFile,
  refinedFindingsContractSmokeFile,
  refinedFindingsContractDocFile,
  refinedFindingsContractReportFile,
]);

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const manualCopyPacketText = readFileSync(manualCopyPacketFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");

const { buildPerspectiveFormationInputBundle } = await import(
  "../lib/perspective-ingest/perspective-formation-input-bundle.ts"
);
const { buildCodexPerspectiveFormerInputPacket } = await import(
  "../lib/perspective-ingest/perspective-codex-former-input-packet.ts"
);
const {
  buildCodexPerspectiveFormerDraftPromptContractFromInputPacket,
  evaluateCodexPerspectiveCandidateDraftPromptContractFit,
} = await import(
  "../lib/perspective-ingest/perspective-codex-former-prompt-contract.ts"
);
const {
  buildManualCodexPerspectiveFormerDraftCopyPacket,
  evaluateManualCodexPerspectiveFormerDraftCopyPacket,
} = await import(
  "../lib/perspective-ingest/perspective-codex-former-manual-copy-packet.ts"
);
const { validateAndNormalizeCodexPerspectiveCandidateDraft } = await import(
  "../lib/perspective-ingest/perspective-codex-candidate-draft-pipeline.ts"
);

assert.equal(existsSync(manualCopyPacketFile), true, `${manualCopyPacketFile} must exist`);
assert.equal(existsSync(docFile), true, `${docFile} must exist`);
assert.equal(existsSync(reportFile), true, `${reportFile} must exist`);
assert.equal(existsSync(smokeFile), true, `${smokeFile} must exist`);

assert.equal(
  packageJson.scripts["smoke:perspective-codex-former-manual-copy-packet"],
  `${expectedTsxCommand} ${smokeFile}`,
  "package.json must register smoke:perspective-codex-former-manual-copy-packet",
);

assertManualCopyPacketSourceIsPureLocal();
assertDocsAndReport();
assertReadyManualCopyPacket();
assertNeedsReviewManualCopyPacket();
assertBlockedUnsafeManualCopyPacket();
assertReturnedDraftRoundTripFixture();
assertBadReturnedDraftRegressionFixture();
assertChangedFileBoundary();

console.log("PASS smoke:perspective-codex-former-manual-copy-packet");

function assertManualCopyPacketSourceIsPureLocal() {
  assertContainsAll(manualCopyPacketText, [
    "buildManualCodexPerspectiveFormerDraftCopyPacket",
    "evaluateManualCodexPerspectiveFormerDraftCopyPacket",
    "manual_codex_perspective_former_draft_copy_packet.v0.1",
    "copyable_codex_prompt_text",
    "validateAndNormalizeCodexPerspectiveCandidateDraft",
    "user-started Codex session",
    "authority_flags",
    "browser_or_computer_use_validation",
    "Not run: no browser/computer-use validation required",
    "copyable_prompt_hash",
    "capture_return_envelope",
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
    "manual copy packet source must not render stale PR #479 contract wording",
  );

  for (const forbiddenMarker of [
    ["read", "File"].join(""),
    ["write", "File"].join(""),
    ["process", "env"].join("."),
    ["fetch", "("].join(""),
    ["Date", "now"].join("."),
    ["new", "Date"].join(" "),
    "api.github.com",
    "api.openai.com",
    "GITHUB_TOKEN",
    "OPENAI_API_KEY",
  ]) {
    assert.equal(
      manualCopyPacketText.includes(forbiddenMarker),
      false,
      `${manualCopyPacketFile} must remain deterministic and local-only`,
    );
  }
}

function assertDocsAndReport() {
  assertContainsAll(docText, [
    "Perspective Codex Former Manual Copy Packet v0.1",
    "follows PR #479",
    "Manual Codex Former Draft Copy Packet",
    "human can review and copy into Codex",
    "user-started Codex session",
    "returned CodexPerspectiveCandidateDraft",
    "validateAndNormalizeCodexPerspectiveCandidateDraft",
    "not Codex execution",
    "not proof/evidence/readiness",
    "not approval",
    "not a Core decision",
    "no browser/computer-use validation required",
    "The transcript dogfood harness is BLOCKED",
    "Prepare real Codex former transcript capture instructions",
  ]);
  assertContainsAll(reportText, [
    "What PR #479 Enabled",
    "What The Manual Copy Packet Adds",
    "How A Human Uses The Packet",
    "What Is Copied Into Codex",
    "What Must Be Pasted Back Into Augnes Validation",
    "Why This Is Still Not Codex Execution",
    "Browser/Computer-Use Validation",
    "PASS with follow-up",
    "The transcript dogfood harness is BLOCKED",
    "Prepare real Codex former transcript capture instructions",
  ]);
  assert.equal(
    reportText.includes(noBrowserComputerUseReason),
    true,
    "report must record browser/computer-use validation not required",
  );
}

function assertReadyManualCopyPacket() {
  const packet = buildManualPacketFromBundle(buildReadyPr479LikeBundle());
  const evaluation =
    evaluateManualCodexPerspectiveFormerDraftCopyPacket(packet);

  assert.equal(packet.copy_status, "ready_to_copy");
  assert.equal(evaluation.evaluation_status, "passes");
  assertContainsAll(packet.copyable_codex_prompt_text, [
    "Role: codex_perspective_former",
    "CodexPerspectiveCandidateDraft",
    "neutral perspective, not a plain PR summary",
    "pointer-only",
    "Set all authority flags false.",
    "draft/review material only",
    "validateAndNormalizeCodexPerspectiveCandidateDraft",
    "Prompt contract: CodexPerspectiveFormerDraftPromptContract v0.1",
    "The former input packet may mention that a transcript is missing because it was generated before this capture.",
    "Do not repeat that as current state after this response exists.",
    "Treat this response as the captured draft output to be locally validated.",
    "Use needs_review because local validation has not yet run, not because this response does not exist.",
  ]);
  assert.equal(
    packet.copyable_codex_prompt_text.includes(
      "Use the PR #479 prompt contract below.",
    ),
    false,
    "copyable prompt must not use stale PR #479 contract wording",
  );
  assert.doesNotMatch(
    packet.copyable_codex_prompt_text,
    /Prompt contract:.*PR #/,
    "copyable prompt must not identify prompt contract by PR number",
  );
  assertCaptureReturnEnvelope(packet);
  assert.equal(
    packet.returned_draft_validation_instructions.validation_function,
    "validateAndNormalizeCodexPerspectiveCandidateDraft",
  );
  assertAuthorityFalse(packet.authority_flags);
  assertNoUnsafeMarkerText("ready manual copy packet", packet);
}

function assertCaptureReturnEnvelope(packet) {
  const envelope = packet.capture_return_envelope;
  const template = envelope.copyable_capture_return_template;

  assert.equal(packet.copyable_prompt_hash.length > 0, true);
  assert.equal(envelope.envelope_label, "REAL TRANSCRIPT CAPTURE AFTER MANUAL COPY PACKET");
  assert.equal(envelope.capture_method, "human_manual");
  assert.equal(envelope.prompt_was_generated_by_manual_copy_packet, true);
  assert.equal(envelope.source_manual_copy_packet_id, packet.packet_id);
  assert.equal(
    envelope.source_former_input_packet_id,
    packet.source_former_input_packet.packet_id,
  );
  assert.equal(envelope.source_prompt_hash, packet.copyable_prompt_hash);
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
    "account data",
    "provider logs",
    "raw page dumps",
    "raw PR diffs",
    "raw review payloads",
    "secrets",
  ]);
}

function assertNeedsReviewManualCopyPacket() {
  const packet = buildManualPacketFromBundle(buildNeedsReviewBundle());

  assert.equal(packet.copy_status, "needs_review");
  assert(
    packet.manual_review_checklist.some((item) =>
      item.toLowerCase().includes("skipped checks"),
    ),
    "needs-review checklist must call out skipped checks",
  );
  assert(
    packet.manual_review_checklist.some((item) =>
      item.toLowerCase().includes("unresolved gaps"),
    ),
    "needs-review checklist must call out unresolved gaps",
  );
  assertContainsAll(packet.copyable_codex_prompt_text, [
    "If the packet is insufficient, return needs_review or blocked draft material with visible reasons.",
    "Do not claim checks passed unless the former input packet provides check summaries.",
    "Use needs_review because local validation has not yet run, not because this response does not exist.",
  ]);
  assertCaptureReturnEnvelope(packet);
  assert.equal(
    packet.copyable_codex_prompt_text.includes("ready_to_merge"),
    false,
    "manual prompt must not include overconfident ready language",
  );
  assertNoUnsafeMarkerText("needs-review manual copy packet", packet);
}

function assertBlockedUnsafeManualCopyPacket() {
  const packet = buildManualPacketFromBundle(buildUnsafeBundle());

  assert(
    ["needs_review", "blocked"].includes(packet.copy_status),
    "redacted unsafe input should not produce ready_to_copy",
  );
  assert.equal(packet.privacy.unsafe_input_material_omitted, true);
  assert(packet.privacy.omitted_unsafe_fields.length > 0);
  assert.equal(
    packet.unsafe_material_policy.copyable_prompt_unsafe_markers_included,
    false,
  );
  assertNoUnsafeMarkerText("unsafe manual copy packet", packet);
}

function assertReturnedDraftRoundTripFixture() {
  const formerInputPacket = buildCodexPerspectiveFormerInputPacket(
    buildReadyPr479LikeBundle(),
  );
  const promptContract =
    buildCodexPerspectiveFormerDraftPromptContractFromInputPacket(
      formerInputPacket,
    );
  const copyPacket = buildManualCodexPerspectiveFormerDraftCopyPacket({
    former_input_packet: formerInputPacket,
    prompt_contract: promptContract,
    generated_at: "2026-06-09T00:00:00.000Z",
  });
  const returnedDraft = buildReturnedDraftFromPacket(formerInputPacket, {
    thesis:
      "The useful neutral perspective beyond a plain summary is that PR #479 made the prompt contract explicit, and this manual copy packet now tests the human handoff boundary before any Codex execution exists.",
    basis_quality_suggestion: {
      status: "needs_review",
      reasons: [
        "Manual copy packet should be dogfooded with a real Codex response transcript before further automation.",
      ],
    },
    qualification_notes: [
      "This remains draft/review material; it is useful because it separates manual prompt copy from accepted candidate state.",
    ],
    next_action_candidates: [
      {
        action_id: "review_candidate",
        summary:
          "Review the returned draft and validation result before any next manual dogfood.",
      },
    ],
  });
  const contractFit = evaluateCodexPerspectiveCandidateDraftPromptContractFit({
    former_input_packet: formerInputPacket,
    draft: returnedDraft,
  });
  const validationResult = validateAndNormalizeCodexPerspectiveCandidateDraft({
    former_input_packet: formerInputPacket,
    draft: returnedDraft,
  });
  const candidate = validationResult.candidate_review_material;

  assert.equal(copyPacket.copy_status, "ready_to_copy");
  assert.equal(contractFit.status, "fits_contract");
  assert.notEqual(candidate, null);
  assert.equal(candidate.authority, "non_committed");
  assert.equal(candidate.thesis, returnedDraft.thesis);
  assertAuthorityFalse(validationResult.authority_flags);
  assertCandidateAuthorityFalse(candidate.authority_flags);
  assertNoUnsafeMarkerText("round-trip copy packet", copyPacket);
  assertNoUnsafeMarkerText("round-trip returned draft validation", validationResult);
}

function assertBadReturnedDraftRegressionFixture() {
  const formerInputPacket = buildCodexPerspectiveFormerInputPacket(
    buildNeedsReviewBundle(),
  );
  const returnedDraft = buildReturnedDraftFromPacket(formerInputPacket, {
    thesis: "PR #479 added docs and a smoke.",
    evidence_pointer_refs: [
      {
        pointer_kind: "evidence_row_ref",
        pointer_semantics: "raw_material",
        ref: "evidence:row:not-allowed",
      },
    ],
    unresolved_tensions: "not-an-array",
    basis_quality_suggestion: {
      status: "sufficient_for_review",
      reasons: ["ready for merge"],
    },
    qualification_notes: [],
    authority_flags: {
      ...buildFalseAuthorityFlags(),
      merge_publish_approval: true,
    },
    forbidden_actions: ["may merge"],
  });
  const contractFit = evaluateCodexPerspectiveCandidateDraftPromptContractFit({
    former_input_packet: formerInputPacket,
    draft: returnedDraft,
  });
  const validationResult = validateAndNormalizeCodexPerspectiveCandidateDraft({
    former_input_packet: formerInputPacket,
    draft: returnedDraft,
  });

  assert.equal(contractFit.status, "violates_contract");
  assertContractWarnings(contractFit, [
    "plain_summary",
    "missing_usefulness",
    "overconfident_basis",
    "pointer_ref",
    "authority_claim",
  ]);
  assert.equal(validationResult.status, "blocked");
  assert.equal(validationResult.candidate_review_material, null);
  assert(
    validationResult.blocked_reasons.some((reason) =>
      reason.includes("invalid draft field shape"),
    ),
    "bad returned draft must block malformed shape",
  );
  assert(
    validationResult.blocked_reasons.includes(
      "draft includes forbidden authority claims",
    ),
    "bad returned draft must block authority claims",
  );
  assertAuthorityFalse(validationResult.authority_flags);
  assertNoUnsafeMarkerText("bad returned draft regression result", validationResult);
}

function buildManualPacketFromBundle(bundle) {
  const formerInputPacket = buildCodexPerspectiveFormerInputPacket(bundle);
  const promptContract =
    buildCodexPerspectiveFormerDraftPromptContractFromInputPacket(
      formerInputPacket,
    );

  return buildManualCodexPerspectiveFormerDraftCopyPacket({
    former_input_packet: formerInputPacket,
    prompt_contract: promptContract,
    manual_context: {
      reviewer_label: "manual reviewer",
      intended_codex_surface: "user-started Codex session",
      usage_notes: ["Review locally before copy."],
    },
    expected_validation_commands: [
      "npm run smoke:perspective-codex-former-manual-copy-packet",
      "npm run smoke:perspective-codex-former-prompt-contract",
    ],
    generated_at: "2026-06-09T00:00:00.000Z",
  });
}

function buildReadyPr479LikeBundle() {
  return buildPerspectiveFormationInputBundle({
    generated_at: "2026-06-09T00:00:00.000Z",
    scope: "project:augnes",
    work_id: "AG-perspective-codex-former-manual-copy-packet",
    source_pr_refs: ["pr:hynk-studio/augnes#479"],
    changed_files: [
      manualCopyPacketFile,
      docFile,
      reportFile,
      smokeFile,
    ],
    changed_files_summary:
      "Adds a pure local manual copy packet for Codex former draft prompts.",
    tests_checks_run: [
      {
        check_id: "check:typecheck",
        command: "npm run typecheck",
        status: "passed",
        result_summary: "TypeScript completed without errors.",
      },
      {
        check_id: "check:prompt-contract",
        command: "npm run smoke:perspective-codex-former-prompt-contract",
        status: "passed",
        result_summary:
          "Prompt contract smoke passed and established the draft instruction contract.",
      },
    ],
    evidence_row_refs: ["evidence:row:manual-copy-ready"],
    proof_only_action_refs: ["proof:action:manual-copy-local-validation"],
    work_event_refs: ["work:event:manual-copy-ready"],
    existing_perspective_refs: [
      "perspective:codex-former-prompt-contract:v0.1",
    ],
    authority_boundaries: [
      "Pure local manual copy packet only.",
      "No Codex execution, SDK integration, provider/model calls, GitHub mutation, UI, or DB writes.",
    ],
    source_privacy_redaction_notes: [
      "Only bounded PR #479 summaries and pointer refs are included.",
    ],
  });
}

function buildNeedsReviewBundle() {
  return buildPerspectiveFormationInputBundle({
    generated_at: "2026-06-09T00:00:00.000Z",
    scope: "project:augnes",
    work_id: "AG-perspective-codex-former-manual-copy-needs-review",
    source_pr_refs: ["pr:hynk-studio/augnes#479"],
    changed_files: [manualCopyPacketFile, smokeFile],
    changed_files_summary:
      "Manual copy packet exists but has unresolved usability review.",
    skipped_checks: [
      {
        check_id: "check:browser-computer-use",
        skipped_reason:
          "Browser/computer-use validation is not required because no UI, route, browser surface, clipboard automation, or copy control was added.",
        result_summary: "No browser-visible surface changed.",
      },
    ],
    unresolved_gaps: [
      {
        gap_id: "gap:real-codex-response",
        summary:
          "Manual packet has not yet been dogfooded with a real user-started Codex response transcript.",
      },
    ],
    evidence_row_refs: ["evidence:row:manual-copy-needs-review"],
    work_event_refs: ["work:event:manual-copy-needs-review"],
    existing_perspective_refs: [
      "perspective:codex-former-prompt-contract:v0.1",
    ],
    authority_boundaries: [
      "Manual copy packet remains draft/review material only.",
      "No proof/evidence/readiness writes.",
    ],
  });
}

function buildUnsafeBundle() {
  return buildPerspectiveFormationInputBundle({
    generated_at: "2026-06-09T00:00:00.000Z",
    scope: "project:augnes",
    work_id: "AG-perspective-codex-former-manual-copy-unsafe",
    source_pr_refs: [
      "pr:hynk-studio/augnes#479",
      "billing_payload",
      "ghp_unsafe_fixture",
    ],
    changed_files: [manualCopyPacketFile, "api_key"],
    changed_files_summary:
      "Manual copy packet should omit raw_source_payload and raw_candidate_payload details.",
    tests_checks_run: [
      {
        check_id: "check:unsafe",
        command: "npm run typecheck",
        status: "passed",
        result_summary: "hidden_reasoning and generated_model_payload are omitted.",
      },
    ],
    skipped_checks: [
      {
        check_id: "check:unsafe",
        skipped_reason: "token_payload oauth_payload private_payload provider_payload omitted.",
      },
    ],
    unresolved_gaps: [
      {
        gap_id: "gap:unsafe",
        summary: "secret sk-proj- unsafe source material omitted.",
      },
    ],
    evidence_row_refs: ["evidence:row:manual-copy-unsafe-safe-ref", "raw_source_payload"],
    proof_only_action_refs: ["raw_candidate_payload"],
    work_event_refs: ["provider_payload"],
    source_privacy_redaction_notes: ["Unsafe source material omitted."],
  });
}

function buildReturnedDraftFromPacket(packet, overrides = {}) {
  return {
    draft_version: "codex_perspective_candidate_draft.v0.1",
    draft_kind: "codex_perspective_candidate_draft",
    source_former_input_packet: {
      packet_version: packet.packet_version,
      packet_id: packet.packet_id,
      role: packet.role,
    },
    thesis:
      overrides.thesis ??
      "The useful neutral perspective beyond a plain summary is that manual copy remains review material until local validation accepts candidate-compatible output.",
    selected_material: overrides.selected_material ?? {
      changed_files: [...packet.bounded_material.changed_files],
      changed_files_summary: packet.bounded_material.changed_files_summary,
      work_id: packet.source_formation_input_bundle.work_id,
      source_pr_refs: [...packet.source_formation_input_bundle.source_pr_refs],
    },
    evidence_pointer_refs:
      overrides.evidence_pointer_refs ?? packet.pointer_refs.slice(0, 3),
    unresolved_tensions: overrides.unresolved_tensions ?? [],
    basis_quality_suggestion: overrides.basis_quality_suggestion ?? {
      status: "needs_review",
      reasons: [
        "Manual copy output needs local validation and user judgment.",
      ],
    },
    next_action_candidates: overrides.next_action_candidates ?? [
      {
        action_id: "review_candidate",
        summary:
          "Review the non-committed returned draft after local validation.",
      },
    ],
    user_core_decision_questions:
      overrides.user_core_decision_questions ?? [
        "Is the returned draft useful enough to dogfood a real Codex response transcript next?",
      ],
    qualification_notes: overrides.qualification_notes ?? [
      "This draft is useful beyond summary because it preserves manual copy as draft/review material.",
    ],
    privacy_flags: overrides.privacy_flags ?? {
      raw_payloads_included: false,
      unsafe_input_material_omitted:
        packet.privacy_constraints.unsafe_input_material_omitted,
      omitted_unsafe_fields: [
        ...packet.privacy_constraints.omitted_unsafe_fields,
      ],
    },
    authority_flags: overrides.authority_flags ?? buildFalseAuthorityFlags(),
    forbidden_actions: overrides.forbidden_actions ?? [
      "do not create proof/evidence/readiness records",
      "do not approve, merge, mutate GitHub, execute Codex, or make Core decisions",
    ],
  };
}

function assertContractWarnings(contractFit, expectedKinds) {
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

function assertCandidateAuthorityFalse(flags) {
  assert(flags, "candidate authority flags must exist");
  assert.equal(flags.committed_state, false);
  assert.equal(flags.persistence, false);
  assert.equal(flags.provider_model_api_calls, false);
  assert.equal(flags.proof_evidence_readiness_writes, false);
  assert.equal(flags.codex_execution, false);
  assert.equal(flags.merge_publish_approval, false);
}

function assertNoUnsafeMarkerText(label, value) {
  const serialized = JSON.stringify(value);
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

function buildFalseAuthorityFlags() {
  return {
    committed_state: false,
    persistence: false,
    provider_model_api_calls: false,
    proof_evidence_readiness_writes: false,
    codex_execution: false,
    github_mutation: false,
    merge_publish_approval: false,
    core_decision: false,
  };
}

function assertChangedFileBoundary() {
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `Perspective Codex former manual copy packet changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/api/") &&
        !changedFile.startsWith("components/") &&
        changedFile !== "app/globals.css" &&
        (!changedFile.startsWith("lib/") ||
          changedFile === manualCopyPacketFile ||
          changedFile === promptContractFile ||
          changedFile === formerInputPacketFile ||
          changedFile === draftPipelineFile ||
          changedFile === draftSchemaAlignmentHelperFile) &&
        !changedFile.startsWith("db/") &&
        !changedFile.startsWith("migrations/") &&
        !changedFile.startsWith("fixtures/") &&
        !changedFile.startsWith("types/") &&
        !changedFile.includes("codex-sdk") &&
        !changedFile.includes("graph-db") &&
        !changedFile.includes("persistence"),
      `Perspective Codex former manual copy packet must not change forbidden surfaces: ${changedFile}`,
    );
  }
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
      "Perspective Codex former manual copy packet smoke collected no changed files",
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
