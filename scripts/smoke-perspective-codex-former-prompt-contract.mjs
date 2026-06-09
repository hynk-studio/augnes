import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const promptContractFile =
  "lib/perspective-ingest/perspective-codex-former-prompt-contract.ts";
const manualCopyPacketFile =
  "lib/perspective-ingest/perspective-codex-former-manual-copy-packet.ts";
const formerInputPacketFile =
  "lib/perspective-ingest/perspective-codex-former-input-packet.ts";
const draftPipelineFile =
  "lib/perspective-ingest/perspective-codex-candidate-draft-pipeline.ts";
const docFile =
  "docs/PERSPECTIVE_CODEX_FORMER_PROMPT_CONTRACT_V0_1.md";
const reportFile =
  "reports/2026-06-09-perspective-codex-former-prompt-contract.md";
const smokeFile =
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
const manualCopyPacketDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_MANUAL_COPY_PACKET_V0_1.md";
const manualCopyPacketReportFile =
  "reports/2026-06-09-perspective-codex-former-manual-copy-packet.md";
const manualCopyPacketSmokeFile =
  "scripts/smoke-perspective-codex-former-manual-copy-packet.mjs";
const manualCopyTranscriptDogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-manual-copy-transcript.mjs";
const manualCopyTranscriptDogfoodSmokeFile =
  "scripts/smoke-perspective-codex-former-manual-copy-transcript.mjs";
const manualCopyTranscriptDogfoodDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_MANUAL_COPY_TRANSCRIPT_DOGFOOD_V0_1.md";
const manualCopyTranscriptDogfoodReportFile =
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

const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";
const allowedChangedFiles = new Set([
  packageFile,
  promptContractFile,
  manualCopyPacketFile,
  formerInputPacketFile,
  draftPipelineFile,
  docFile,
  reportFile,
  smokeFile,
  formerPipelineDocFile,
  formerDogfoodDocFile,
  formerPipelineSmokeFile,
  formerDogfoodSmokeFile,
  workerGuidanceSmokeFile,
  candidateBuilderSmokeFile,
  manualCopyPacketDocFile,
  manualCopyPacketReportFile,
  manualCopyPacketSmokeFile,
  manualCopyTranscriptDogfoodScriptFile,
  manualCopyTranscriptDogfoodSmokeFile,
  manualCopyTranscriptDogfoodDocFile,
  manualCopyTranscriptDogfoodReportFile,
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
]);

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const promptContractText = readFileSync(promptContractFile, "utf8");
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
  buildCodexPerspectiveFormerDraftPromptFromInputPacket,
  evaluateCodexPerspectiveCandidateDraftPromptContractFit,
} = await import(
  "../lib/perspective-ingest/perspective-codex-former-prompt-contract.ts"
);
const { validateAndNormalizeCodexPerspectiveCandidateDraft } = await import(
  "../lib/perspective-ingest/perspective-codex-candidate-draft-pipeline.ts"
);

assert.equal(existsSync(promptContractFile), true, `${promptContractFile} must exist`);
assert.equal(existsSync(docFile), true, `${docFile} must exist`);
assert.equal(existsSync(reportFile), true, `${reportFile} must exist`);
assert.equal(existsSync(smokeFile), true, `${smokeFile} must exist`);

assert.equal(
  packageJson.scripts["smoke:perspective-codex-former-prompt-contract"],
  `${expectedTsxCommand} ${smokeFile}`,
  "package.json must register smoke:perspective-codex-former-prompt-contract",
);

assertPromptContractSourceIsPureLocal();
assertDocsAndReport();
assertPromptContractReadyPacket();
assertPromptContractNeedsReviewPacket();
assertPromptContractBlockedOrUnsafePacket();
assertModelShapedContractFixture();
assertPromptContractRegressionFixture();
assertChangedFileBoundary();

console.log("PASS smoke:perspective-codex-former-prompt-contract");

function assertPromptContractSourceIsPureLocal() {
  assertContainsAll(promptContractText, [
    "buildCodexPerspectiveFormerDraftPromptContractFromInputPacket",
    "buildCodexPerspectiveFormerDraftPromptFromInputPacket",
    "evaluateCodexPerspectiveCandidateDraftPromptContractFit",
    "codex_perspective_former",
    "CodexPerspectiveCandidateDraft",
    "neutral perspective, not a plain PR summary",
    "output is draft/review material only",
    "pointer-only refs",
    "basis_quality_suggestion",
    "qualification_notes",
    "proof, evidence, or readiness records",
    "mutate GitHub",
    "Core decisions",
  ]);

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
      promptContractText.includes(forbiddenMarker),
      false,
      `${promptContractFile} must remain deterministic and local-only`,
    );
  }
}

function assertDocsAndReport() {
  assertContainsAll(docText, [
    "Perspective Codex Former Prompt Contract v0.1",
    "PR #478",
    "neutral perspective",
    "not a plain PR summary",
    "CodexPerspectiveFormerInputPacket",
    "CodexPerspectiveCandidateDraft",
    "buildCodexPerspectiveFormerDraftPromptFromInputPacket(input)",
    "draft/review material only",
    "pointer-only refs",
    "basis_quality_suggestion",
    "needs_review",
    "blocked",
    "no Codex call",
    "no Codex SDK",
    "no provider/model/API call",
    "no GitHub API call",
    "no DB state",
    "no runtime routes",
    "no UI",
    "no proof/evidence/readiness records",
    "no Core decisions",
  ]);
  assertContainsAll(reportText, [
    "Summary",
    "What PR #478 Dogfood Found",
    "Different From A PR Summary Prompt",
    "Future Model Instructions",
    "Authority Boundary",
    "Draft Review Only",
    "Needs Review Or Blocked Input",
    "Out Of Scope",
    "Next Implementation PR",
    "PASS with follow-up",
    "Add manual Codex former draft copy packet",
  ]);
}

function assertPromptContractReadyPacket() {
  const packet = buildCodexPerspectiveFormerInputPacket(
    buildReadyReviewedPr477LikeBundle(),
  );
  const contract =
    buildCodexPerspectiveFormerDraftPromptContractFromInputPacket(packet);
  const prompt = buildCodexPerspectiveFormerDraftPromptFromInputPacket(packet);

  assert.equal(contract.role, "codex_perspective_former");
  assert.equal(contract.output_contract.output_is_draft_review_material_only, true);
  assert.equal(contract.output_contract.must_use_pointer_only_refs, true);
  assert.equal(contract.output_contract.must_include_non_summary_usefulness, true);
  assert.equal(prompt, contract.copyable_former_draft_prompt_text);
  assertContainsAll(prompt, [
    "Role: codex_perspective_former",
    "CodexPerspectiveCandidateDraft",
    "neutral perspective, not a plain PR summary",
    "useful neutral perspective beyond a plain PR summary",
    "pointer-only refs",
    "basis_quality_suggestion",
    "unresolved_tensions",
    "user_core_decision_questions",
    "raw diffs",
    "private material",
    "provider material",
    "token material",
    "billing material",
    "raw source data",
    "proof, evidence, or readiness records",
    "approve",
    "merge",
    "mutate GitHub",
    "execute Codex",
    "Core decisions",
    "draft/review material only",
  ]);
  assertNoUnsafeMarkerText("ready prompt", prompt);
}

function assertPromptContractNeedsReviewPacket() {
  const packet = buildCodexPerspectiveFormerInputPacket(
    buildNeedsReviewFormerBundle(),
  );
  const prompt = buildCodexPerspectiveFormerDraftPromptFromInputPacket(packet);

  assertContainsAll(prompt, [
    "readiness: needs_review",
    "skipped_checks:",
    "unresolved_gaps:",
    "Use needs_review when skipped checks, unresolved gaps, weak verification, or qualification notes remain.",
    "If the packet is insufficient, produce needs_review or blocked draft material with visible reasons.",
    "Do not claim checks passed unless the former input packet provides check summaries.",
    "Preserve uncertainty",
  ]);
  assertNoUnsafeMarkerText("needs-review prompt", prompt);
}

function assertPromptContractBlockedOrUnsafePacket() {
  const packet = buildCodexPerspectiveFormerInputPacket(
    buildUnsafeFormerBundle(),
  );
  const prompt = buildCodexPerspectiveFormerDraftPromptFromInputPacket(packet);

  assertContainsAll(prompt, [
    "Role: codex_perspective_former",
    "unsafe_input_material_omitted: yes",
    "omitted_unsafe_field_count:",
    "Use blocked when the packet is blocked or a safe draft cannot be produced from bounded material.",
    "Do not invent raw diffs",
    "private material",
    "provider material",
    "token material",
    "billing material",
  ]);
  assert.equal(
    packet.privacy_constraints.unsafe_input_material_omitted,
    true,
    "unsafe input packet must record omitted unsafe material",
  );
  assertNoUnsafeMarkerText("unsafe prompt", prompt);
}

function assertModelShapedContractFixture() {
  const packet = buildCodexPerspectiveFormerInputPacket(
    buildReadyReviewedPr477LikeBundle(),
  );
  const draft = buildDraftFromPacket(packet, {
    thesis:
      "The useful neutral perspective beyond a plain summary is that PR #478 made the validation boundary testable, so the next useful work is a narrower prompt contract for future draft formation.",
    basis_quality_suggestion: {
      status: "needs_review",
      reasons: [
        "Prompt contract usefulness should be reviewed before any future manual copy packet.",
      ],
    },
    qualification_notes: [
      "This draft is useful beyond summary because it identifies prompt-contract work as the next reviewable boundary, not accepted state.",
    ],
    next_action_candidates: [
      {
        action_id: "prepare_codex_handoff",
        summary:
          "Prepare a local manual copy packet only after user review of this prompt-contract material.",
      },
    ],
    user_core_decision_questions: [
      "Is the prompt contract specific enough to guide a future CodexPerspectiveCandidateDraft without overclaiming readiness?",
    ],
  });
  const contractFit = evaluateCodexPerspectiveCandidateDraftPromptContractFit({
    former_input_packet: packet,
    draft,
  });
  const validationResult = validateAndNormalizeCodexPerspectiveCandidateDraft({
    former_input_packet: packet,
    draft,
  });
  const candidate = validationResult.candidate_review_material;

  assert.equal(contractFit.status, "fits_contract");
  assert.equal(validationResult.status, "needs_review");
  assert(candidate, "contract-following draft must normalize to review material");
  assert.equal(candidate.thesis, draft.thesis);
  assert.equal(candidate.basis_quality.status, "needs_review");
  assert(
    candidate.basis_quality.reasons.includes(
      "Prompt contract usefulness should be reviewed before any future manual copy packet.",
    ),
    "candidate must preserve basis quality reasons",
  );
  assert(
    candidate.basis_quality.reasons.includes(
      "qualification: This draft is useful beyond summary because it identifies prompt-contract work as the next reviewable boundary, not accepted state.",
    ),
    "candidate must preserve useful qualification notes",
  );
  assert(
    candidate.evidence_pointers.every(
      (pointer) => pointer.pointer_semantics === "pointer_only",
    ),
    "candidate evidence refs must remain pointer-only",
  );
  assertAuthorityFalse(validationResult.authority_flags);
  assertCandidateAuthorityFalse(candidate.authority_flags);
  assertNoUnsafeMarkerText("contract-following candidate", candidate);
}

function assertPromptContractRegressionFixture() {
  const packet = buildCodexPerspectiveFormerInputPacket(
    buildNeedsReviewFormerBundle(),
  );
  const draft = buildDraftFromPacket(packet, {
    thesis: "PR #478 added a dogfood script and report.",
    basis_quality_suggestion: {
      status: "sufficient_for_review",
      reasons: ["ready for merge"],
    },
    qualification_notes: [],
    unresolved_tensions: [],
    authority_flags: {
      ...buildFalseAuthorityFlags(),
      merge_publish_approval: true,
    },
    forbidden_actions: [
      "may merge",
      "no provider/model/API calls",
    ],
  });
  const contractFit = evaluateCodexPerspectiveCandidateDraftPromptContractFit({
    former_input_packet: packet,
    draft,
  });
  const validationResult = validateAndNormalizeCodexPerspectiveCandidateDraft({
    former_input_packet: packet,
    draft,
  });

  assert.equal(contractFit.status, "violates_contract");
  assertContractWarnings(contractFit, [
    "plain_summary",
    "missing_usefulness",
    "overconfident_basis",
    "authority_claim",
  ]);
  assert.equal(validationResult.status, "blocked");
  assert.equal(validationResult.candidate_review_material, null);
  assert(
    validationResult.blocked_reasons.includes(
      "draft includes forbidden authority claims",
    ),
    "authority-claiming draft must still be blocked by validator",
  );
  assertAuthorityFalse(validationResult.authority_flags);
  assertNoUnsafeMarkerText("prompt-contract regression result", validationResult);
}

function buildReadyReviewedPr477LikeBundle() {
  return buildPerspectiveFormationInputBundle({
    generated_at: "2026-06-09T00:00:00.000Z",
    scope: "project:augnes",
    work_id: "AG-perspective-codex-former-prompt-contract",
    source_pr_refs: ["pr:hynk-studio/augnes#477", "pr:hynk-studio/augnes#478"],
    changed_files: [
      promptContractFile,
      docFile,
      reportFile,
      smokeFile,
    ],
    changed_files_summary:
      "Adds a pure local prompt contract for future Codex perspective draft formation.",
    tests_checks_run: [
      {
        check_id: "check:typecheck",
        command: "npm run typecheck",
        status: "passed",
        result_summary: "TypeScript completed without errors.",
      },
      {
        check_id: "check:dogfood",
        command: "npm run smoke:perspective-codex-former-pipeline-dogfood",
        status: "passed",
        result_summary:
          "PR #478 dogfood passed with follow-up and identified prompt contract refinement as next work.",
      },
    ],
    skipped_checks: [],
    evidence_row_refs: ["evidence:row:prompt-contract-ready"],
    proof_only_action_refs: ["proof:action:prompt-contract-local-validation"],
    work_event_refs: ["work:event:prompt-contract-ready"],
    existing_perspective_refs: [
      "perspective:codex-former-pipeline:v0.1",
      "perspective:codex-former-pipeline-dogfood:v0.1",
    ],
    authority_boundaries: [
      "Pure local prompt-contract refinement only.",
      "No model/provider call, no Codex execution, no GitHub mutation from implementation.",
    ],
    source_privacy_redaction_notes: [
      "Only bounded reviewed PR summaries and pointer refs are included.",
    ],
  });
}

function buildNeedsReviewFormerBundle() {
  return buildPerspectiveFormationInputBundle({
    generated_at: "2026-06-09T00:00:00.000Z",
    scope: "project:augnes",
    work_id: "AG-perspective-codex-former-prompt-contract-needs-review",
    source_pr_refs: ["pr:hynk-studio/augnes#478"],
    changed_files: [promptContractFile, smokeFile],
    changed_files_summary:
      "Prompt contract is present but verification and usefulness remain qualified.",
    skipped_checks: [
      {
        check_id: "check:manual-model-copy",
        skipped_reason:
          "Manual model-copy packet is out of scope for this prompt-contract PR.",
        result_summary: "Future copy packet not created.",
      },
    ],
    unresolved_gaps: [
      {
        gap_id: "gap:manual-copy-packet",
        summary:
          "The prompt contract has not yet been dogfooded through a manual copy packet.",
      },
    ],
    evidence_row_refs: ["evidence:row:prompt-contract-needs-review"],
    work_event_refs: ["work:event:prompt-contract-needs-review"],
    existing_perspective_refs: ["perspective:codex-former-dogfood:v0.1"],
    authority_boundaries: [
      "Qualified draft/review material only.",
      "No proof/evidence/readiness writes.",
    ],
  });
}

function buildUnsafeFormerBundle() {
  return buildPerspectiveFormationInputBundle({
    generated_at: "2026-06-09T00:00:00.000Z",
    scope: "project:augnes",
    work_id: "AG-perspective-codex-former-prompt-contract-unsafe",
    source_pr_refs: [
      "pr:hynk-studio/augnes#478",
      "raw_source_payload",
      "ghp_unsafe_fixture",
    ],
    changed_files: [
      promptContractFile,
      "api_key",
    ],
    changed_files_summary:
      "Prompt contract should omit raw_candidate_payload details.",
    tests_checks_run: [
      {
        check_id: "check:unsafe",
        command: "npm run typecheck",
        status: "passed",
        result_summary: "hidden_reasoning should not appear in prompts.",
      },
    ],
    skipped_checks: [
      {
        check_id: "check:billing",
        skipped_reason: "billing_payload should be omitted.",
      },
    ],
    unresolved_gaps: [
      {
        gap_id: "gap:unsafe",
        summary: "private_payload should be omitted.",
      },
    ],
    evidence_row_refs: ["token_payload"],
    proof_only_action_refs: ["oauth_payload"],
    work_event_refs: ["provider_payload"],
    source_privacy_redaction_notes: ["sk-proj-unsafe-fixture"],
  });
}

function buildDraftFromPacket(packet, overrides = {}) {
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
      "The useful neutral perspective beyond a plain summary is that prompt-contract validation should preserve the draft/review boundary before any future copy packet.",
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
        "Prompt-contract usefulness remains review material until a future copy-packet dogfood.",
      ],
    },
    next_action_candidates: overrides.next_action_candidates ?? [
      {
        action_id: "review_candidate",
        summary:
          "Review the non-committed prompt-contract candidate material.",
      },
    ],
    user_core_decision_questions:
      overrides.user_core_decision_questions ?? [
        "Does this prompt contract make the neutral perspective useful beyond a plain summary?",
      ],
    qualification_notes: overrides.qualification_notes ?? [
      "This draft is useful beyond summary because it keeps prompt-contract refinement separate from accepted state.",
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
      `expected prompt-contract warning ${expectedKind}`,
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
      `Perspective Codex former prompt contract changed an out-of-scope file: ${changedFile}`,
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
      `Perspective Codex former prompt contract must not change forbidden surfaces: ${changedFile}`,
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
      "Perspective Codex former prompt contract smoke collected no changed files",
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
