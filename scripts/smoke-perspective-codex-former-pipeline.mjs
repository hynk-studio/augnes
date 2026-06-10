import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const formerInputPacketFile =
  "lib/perspective-ingest/perspective-codex-former-input-packet.ts";
const draftPipelineFile =
  "lib/perspective-ingest/perspective-codex-candidate-draft-pipeline.ts";
const promptContractFile =
  "lib/perspective-ingest/perspective-codex-former-prompt-contract.ts";
const manualCopyPacketFile =
  "lib/perspective-ingest/perspective-codex-former-manual-copy-packet.ts";
const formationInputBundleFile =
  "lib/perspective-ingest/perspective-formation-input-bundle.ts";
const candidateBuilderFile =
  "lib/perspective-ingest/perspective-candidate-builder.ts";
const workerGuidanceBuilderFile =
  "lib/perspective-ingest/perspective-worker-facing-guidance.ts";
const docFile =
  "docs/PERSPECTIVE_CODEX_FORMER_PIPELINE_V0_1.md";
const reportFile =
  "reports/2026-06-09-perspective-codex-former-pipeline.md";
const smokeFile =
  "scripts/smoke-perspective-codex-former-pipeline.mjs";
const candidateBuilderSmokeFile =
  "scripts/smoke-perspective-candidate-builder-fixture.mjs";
const workerGuidanceSmokeFile =
  "scripts/smoke-perspective-worker-facing-guidance.mjs";
const codexFormerDogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-pipeline.mjs";
const codexFormerDogfoodSmokeFile =
  "scripts/smoke-perspective-codex-former-pipeline-dogfood.mjs";
const codexFormerDogfoodDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_PIPELINE_DOGFOOD_V0_1.md";
const codexFormerDogfoodReportFile =
  "reports/dogfood/2026-06-09-perspective-codex-former-pipeline.md";
const codexFormerPromptContractDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_PROMPT_CONTRACT_V0_1.md";
const codexFormerPromptContractReportFile =
  "reports/2026-06-09-perspective-codex-former-prompt-contract.md";
const codexFormerPromptContractSmokeFile =
  "scripts/smoke-perspective-codex-former-prompt-contract.mjs";
const codexFormerManualCopyPacketDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_MANUAL_COPY_PACKET_V0_1.md";
const codexFormerManualCopyPacketReportFile =
  "reports/2026-06-09-perspective-codex-former-manual-copy-packet.md";
const codexFormerManualCopyPacketSmokeFile =
  "scripts/smoke-perspective-codex-former-manual-copy-packet.mjs";
const codexFormerManualCopyTranscriptDogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-manual-copy-transcript.mjs";
const codexFormerManualCopyTranscriptDogfoodSmokeFile =
  "scripts/smoke-perspective-codex-former-manual-copy-transcript.mjs";
const codexFormerManualCopyTranscriptDogfoodDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_MANUAL_COPY_TRANSCRIPT_DOGFOOD_V0_1.md";
const codexFormerManualCopyTranscriptDogfoodReportFile =
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
const refinedFindingsContractDogfoodScriptFile =
  "scripts/dogfood-perspective-codex-former-refined-findings-contract.mjs";
const refinedFindingsContractSmokeFile =
  "scripts/smoke-perspective-codex-former-refined-findings-contract.mjs";
const refinedFindingsContractDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_REFINED_FINDINGS_CONTRACT_V0_1.md";
const refinedFindingsContractReportFile =
  "reports/2026-06-09-perspective-codex-former-refined-findings-contract.md";

const inheritedPr476Files = [
  "docs/PERSPECTIVE_WORKER_FACING_GUIDANCE_DOGFOOD_V0_1.md",
  "docs/PERSPECTIVE_WORKER_FACING_GUIDANCE_V0_1.md",
  "reports/2026-06-09-perspective-worker-facing-guidance-action-specificity.md",
  "reports/dogfood/2026-06-09-perspective-worker-facing-guidance-loop.md",
  "scripts/dogfood-perspective-worker-facing-guidance-loop.mjs",
  "scripts/smoke-perspective-worker-facing-guidance-loop-dogfood.mjs",
];

const allowedChangedFiles = new Set([
  packageFile,
  formerInputPacketFile,
  draftPipelineFile,
  promptContractFile,
  manualCopyPacketFile,
  docFile,
  reportFile,
  smokeFile,
  candidateBuilderSmokeFile,
  workerGuidanceSmokeFile,
  workerGuidanceBuilderFile,
  codexFormerDogfoodScriptFile,
  codexFormerDogfoodSmokeFile,
  codexFormerDogfoodDocFile,
  codexFormerDogfoodReportFile,
  codexFormerPromptContractDocFile,
  codexFormerPromptContractReportFile,
  codexFormerPromptContractSmokeFile,
  codexFormerManualCopyPacketDocFile,
  codexFormerManualCopyPacketReportFile,
  codexFormerManualCopyPacketSmokeFile,
  codexFormerManualCopyTranscriptDogfoodScriptFile,
  codexFormerManualCopyTranscriptDogfoodSmokeFile,
  codexFormerManualCopyTranscriptDogfoodDocFile,
  codexFormerManualCopyTranscriptDogfoodReportFile,
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
  refinedFindingsContractDogfoodScriptFile,
  refinedFindingsContractSmokeFile,
  refinedFindingsContractDocFile,
  refinedFindingsContractReportFile,
  ...inheritedPr476Files,
]);

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const formerInputPacketText = readFileSync(formerInputPacketFile, "utf8");
const draftPipelineText = readFileSync(draftPipelineFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");

const { buildPerspectiveFormationInputBundle } = await import(
  "../lib/perspective-ingest/perspective-formation-input-bundle.ts"
);
const { buildCodexPerspectiveFormerInputPacket } = await import(
  "../lib/perspective-ingest/perspective-codex-former-input-packet.ts"
);
const { validateAndNormalizeCodexPerspectiveCandidateDraft } = await import(
  "../lib/perspective-ingest/perspective-codex-candidate-draft-pipeline.ts"
);
const { buildWorkerFacingPerspectiveGuidanceFromCandidate } = await import(
  "../lib/perspective-ingest/perspective-worker-facing-guidance.ts"
);

assert.equal(existsSync(formerInputPacketFile), true, `${formerInputPacketFile} must exist`);
assert.equal(existsSync(draftPipelineFile), true, `${draftPipelineFile} must exist`);
assert.equal(existsSync(docFile), true, `${docFile} must exist`);
assert.equal(existsSync(reportFile), true, `${reportFile} must exist`);
assert.equal(existsSync(smokeFile), true, `${smokeFile} must exist`);

assert.equal(
  packageJson.scripts["smoke:perspective-codex-former-pipeline"],
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-perspective-codex-former-pipeline.mjs",
  "package.json must register smoke:perspective-codex-former-pipeline",
);

assertSourceIsPureLocal();
assertDocsAndReport();
assertReadyDraftFixture();
assertNeedsReviewDraftFixture();
assertMalformedDraftShapeFixture();
assertBlockedUnsafePayloadFixture();
assertAuthorityClaimRejectionFixture();
assertDownstreamGuidanceCompatibilityFixture();
assertChangedFileBoundary();

console.log("PASS smoke:perspective-codex-former-pipeline");

function assertReadyDraftFixture() {
  const bundle = buildReadyFormationInputBundle();
  const packet = buildCodexPerspectiveFormerInputPacket(bundle);
  const draft = buildDraftFromPacket(packet, {
    thesis:
      "The worker guidance action-specificity follow-up is the next bounded material to review before dogfooding a local perspective former.",
    selected_material: {
      changed_files: [
        formerInputPacketFile,
        draftPipelineFile,
        docFile,
        smokeFile,
      ],
      changed_files_summary:
        "Adds a pure local Codex perspective former input packet and draft validation pipeline.",
      work_id: "AG-perspective-codex-former-pipeline",
      source_pr_refs: ["pr:hynk-studio/augnes#476"],
    },
    evidence_pointer_refs: packet.pointer_refs.slice(0, 3),
    basis_quality_suggestion: {
      status: "sufficient_for_review",
      reasons: [],
    },
    next_action_candidates: [
      {
        action_id: "review_candidate",
        summary:
          "Review the non-committed candidate-compatible material.",
      },
      {
        action_id: "prepare_codex_handoff",
        summary:
          "Prepare a future handoff only after user review confirms the draft is useful.",
      },
    ],
  });

  assert.equal(packet.role, "codex_perspective_former");
  assert.equal(packet.source_formation_input_bundle.bundle_version, bundle.bundle_version);
  assert.equal(packet.privacy_constraints.raw_payloads_included, false);
  assert.equal(packet.authority_constraints.codex_execution, false);
  assert.equal(packet.authority_constraints.provider_model_api_calls, false);
  assert.equal(packet.expected_output_contract.output_is_draft_only, true);
  assert.equal(packet.pointer_refs.length, 5);
  assertNoForbiddenPayloadText("ready former input packet", packet);

  const result = validateAndNormalizeCodexPerspectiveCandidateDraft({
    former_input_packet: packet,
    draft,
  });
  const candidate = requireCandidate(result);

  assert.equal(result.status, "ready_for_review");
  assert.equal(candidate.candidate_version, "perspective_candidate.v0.1");
  assert.equal(candidate.candidate_kind, "perspective_candidate");
  assert.equal(candidate.status, "perspective_candidate");
  assert.equal(candidate.authority, "non_committed");
  assert.equal(candidate.thesis, draft.thesis);
  assert.deepEqual(candidate.selected_material.changed_files, [
    formerInputPacketFile,
    draftPipelineFile,
    docFile,
    smokeFile,
  ]);
  assert.equal(
    candidate.selected_material.changed_files_summary,
    "Adds a pure local Codex perspective former input packet and draft validation pipeline.",
  );
  assert.deepEqual(candidate.evidence_pointers, packet.pointer_refs.slice(0, 3));
  assert(
    candidate.evidence_pointers.every(
      (pointer) => pointer.pointer_semantics === "pointer_only",
    ),
    "normalized candidate refs must remain pointer-only",
  );
  assert.deepEqual(candidate.basis_quality, {
    status: "sufficient_for_review",
    reasons: [],
  });
  assert.deepEqual(candidate.unresolved_tensions, []);
  assertAuthorityFalse(result);
  assertCandidateAuthorityFalse(candidate);
  assertNoForbiddenPayloadText("ready normalized candidate", candidate);
}

function assertNeedsReviewDraftFixture() {
  const bundle = buildPerspectiveFormationInputBundle({
    scope: "project:augnes",
    work_id: "AG-perspective-codex-former-needs-review",
    source_pr_refs: ["pr:hynk-studio/augnes#476"],
    changed_files: [formerInputPacketFile, draftPipelineFile],
    changed_files_summary:
      "Adds local scaffold material but leaves verification gaps for review.",
    skipped_checks: [
      {
        check_id: "check:browser",
        skipped_reason:
          "Browser validation skipped because this is a pure local pipeline scaffold with no UI or runtime route.",
        result_summary: "No browser-facing surface changed.",
      },
    ],
    unresolved_gaps: [
      {
        gap_id: "gap:dogfood-not-run",
        summary:
          "The generated perspective has not yet been dogfooded on reviewed PR material.",
      },
    ],
    evidence_row_refs: ["evidence:row:codex-former-needs-review"],
    work_event_refs: ["work:event:codex-former-needs-review"],
    existing_perspective_refs: ["perspective:worker-guidance:v0.1"],
  });
  const packet = buildCodexPerspectiveFormerInputPacket(bundle);
  const draft = buildDraftFromPacket(packet, {
    thesis:
      "This scaffold is reviewable, but the usefulness of a generated perspective remains unproven.",
    basis_quality_suggestion: {
      status: "needs_review",
      reasons: ["dogfood on reviewed PR material is still missing"],
    },
    unresolved_tensions: [
      {
        tension_kind: "unresolved_gap",
        summary:
          "Usefulness is intentionally unproven until the next implementation PR.",
        source_ref: "gap:dogfood-not-run",
      },
    ],
    qualification_notes: [
      "Validation proves pipeline existence and boundaries, not generated perspective usefulness.",
    ],
    next_action_candidates: [
      {
        action_id: "fix_input_gaps",
        summary:
          "Run a later dogfood pass on reviewed PR material before treating this as planning guidance.",
      },
    ],
  });

  const result = validateAndNormalizeCodexPerspectiveCandidateDraft({
    former_input_packet: packet,
    draft,
  });
  const candidate = requireCandidate(result);

  assert.equal(result.status, "needs_review");
  assert.equal(candidate.basis_quality.status, "needs_review");
  assert(
    candidate.basis_quality.reasons.includes("unresolved gaps present"),
    "source readiness reasons must remain visible",
  );
  assert(
    candidate.basis_quality.reasons.includes(
      "dogfood on reviewed PR material is still missing",
    ),
    "draft basis qualification must remain visible",
  );
  assert(
    candidate.unresolved_tensions.some(
      (tension) =>
        tension.tension_kind === "unresolved_gap" &&
        tension.source_ref === "gap:dogfood-not-run",
    ),
    "source and draft gaps must remain visible as unresolved tensions",
  );
  assert.deepEqual(candidate.verification_summary.skipped_checks, [
    {
      check_id: "check:browser",
      skipped_reason:
        "Browser validation skipped because this is a pure local pipeline scaffold with no UI or runtime route.",
      result_summary: "No browser-facing surface changed.",
    },
  ]);
  assertAuthorityFalse(result);
  assertCandidateAuthorityFalse(candidate);
  assertNoForbiddenPayloadText("needs-review normalized candidate", candidate);
}

function assertMalformedDraftShapeFixture() {
  const packet = buildCodexPerspectiveFormerInputPacket(
    buildReadyFormationInputBundle(),
  );
  const draft = buildDraftFromPacket(packet, {
    evidence_pointer_refs: "not-an-array",
    unresolved_tensions: {},
    basis_quality_suggestion: {
      status: "sufficient_for_review",
      reasons: "not-an-array",
    },
  });
  let result;

  assert.doesNotThrow(() => {
    result = validateAndNormalizeCodexPerspectiveCandidateDraft({
      former_input_packet: packet,
      draft,
    });
  }, "malformed model-shaped drafts must block instead of throwing");

  assert.equal(result.status, "blocked");
  assert.equal(result.candidate_review_material, null);
  assert(
    result.blocked_reasons.includes(
      "invalid draft field shape: evidence_pointer_refs must be an array",
    ),
    "blocked reasons must name malformed evidence pointer refs",
  );
  assert(
    result.blocked_reasons.includes(
      "invalid draft field shape: unresolved_tensions must be an array",
    ),
    "blocked reasons must name malformed unresolved tensions",
  );
  assert(
    result.blocked_reasons.includes(
      "invalid draft field shape: basis_quality_suggestion.reasons must be an array",
    ),
    "blocked reasons must name malformed basis-quality reasons",
  );
  assert(
    result.warnings.some(
      (warning) =>
        warning.warning_kind === "normalization" &&
        warning.field === "draft.unresolved_tensions",
    ),
    "invalid runtime shapes may be preserved as normalization warnings",
  );
  assert.equal(result.privacy.raw_payloads_included, false);
  assertAuthorityFalse(result);
  assertNoForbiddenPayloadText("malformed draft blocked result", result);
}

function assertBlockedUnsafePayloadFixture() {
  const packet = buildCodexPerspectiveFormerInputPacket(
    buildReadyFormationInputBundle(),
  );
  const draft = buildDraftFromPacket(packet, {
    thesis:
      "billing_payload token_payload oauth_payload raw_source_payload raw_candidate_payload private_payload provider_payload api_key hidden_reasoning generated_model_payload sk-proj- ghp_ secret",
    selected_material: {
      changed_files: [formerInputPacketFile],
      changed_files_summary:
        "raw_private_payload access_token refresh_token gho_ ghu_ ghs_ ghr_",
      work_id: "AG-perspective-codex-former-pipeline",
      source_pr_refs: ["pr:hynk-studio/augnes#476"],
    },
    unresolved_tensions: [
      {
        tension_kind: "readiness_reason",
        summary: "raw_pasted_text should never survive normalization",
      },
    ],
  });

  const result = validateAndNormalizeCodexPerspectiveCandidateDraft({
    former_input_packet: packet,
    draft,
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.candidate_review_material, null);
  assert.equal(result.privacy.unsafe_input_material_omitted, true);
  assert(
    result.privacy.omitted_unsafe_fields.includes("draft.thesis"),
    "unsafe thesis field must be recorded without preserving unsafe text",
  );
  assert(
    result.privacy.omitted_unsafe_fields.includes(
      "draft.selected_material.changed_files_summary",
    ),
    "unsafe selected material field must be recorded",
  );
  assertAuthorityFalse(result);
  assertNoForbiddenPayloadText("unsafe blocked result", result);
}

function assertAuthorityClaimRejectionFixture() {
  const packet = buildCodexPerspectiveFormerInputPacket(
    buildReadyFormationInputBundle(),
  );
  const draft = buildDraftFromPacket(packet, {
    thesis:
      "Approval granted and GitHub mutation complete for this perspective draft.",
    authority_flags: {
      committed_state: true,
      persistence: true,
      provider_model_api_calls: true,
      proof_evidence_readiness_writes: true,
      codex_execution: true,
      github_mutation: true,
      merge_publish_approval: true,
      core_decision: true,
    },
    next_action_candidates: [
      {
        action_id: "review_candidate",
        summary:
          "Codex executed and Core decided that this candidate is ready for merge.",
      },
    ],
  });

  const result = validateAndNormalizeCodexPerspectiveCandidateDraft({
    former_input_packet: packet,
    draft,
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.candidate_review_material, null);
  assert(
    result.blocked_reasons.includes("draft includes forbidden authority claims"),
    "authority claims must block candidate-compatible material",
  );
  assert(
    result.warnings.some((warning) => warning.warning_kind === "authority_claim"),
    "authority claim must be preserved only as a warning",
  );
  assertAuthorityFalse(result);
}

function assertDownstreamGuidanceCompatibilityFixture() {
  const packet = buildCodexPerspectiveFormerInputPacket(
    buildReadyFormationInputBundle(),
  );
  const draft = buildDraftFromPacket(packet, {
    thesis:
      "A bounded former draft can feed worker-facing guidance only after local validation normalizes it.",
    evidence_pointer_refs: packet.pointer_refs,
  });
  const result = validateAndNormalizeCodexPerspectiveCandidateDraft({
    former_input_packet: packet,
    draft,
  });
  const candidate = requireCandidate(result);
  const guidance = buildWorkerFacingPerspectiveGuidanceFromCandidate({
    candidate,
    guidance_context: {
      bounded_summary:
        "Validated candidate-compatible review material from local Codex former pipeline.",
    },
  });

  assert.equal(guidance.guidance_kind, "worker_facing_perspective_guidance");
  assert.equal(guidance.guidance_status, "actionable_advisory");
  assert.equal(guidance.scope_alignment.advisory_only, true);
  assert.equal(guidance.privacy.raw_payloads_included, false);
  assert.equal(guidance.authority_flags.codex_execution, false);
  assert.equal(guidance.authority_flags.github_mutation, false);
  assert.equal(guidance.authority_flags.core_decision, false);
  assert(
    guidance.next_smallest_useful_actions.every(
      (action) =>
        action.advisory_only === true &&
        action.codex_execution === false,
    ),
    "downstream guidance must remain advisory-only and non-executing",
  );
  assertNoForbiddenPayloadText("downstream guidance", guidance);
}

function buildReadyFormationInputBundle() {
  return buildPerspectiveFormationInputBundle({
    scope: "project:augnes",
    work_id: "AG-perspective-codex-former-pipeline",
    source_pr_refs: ["pr:hynk-studio/augnes#476"],
    changed_files: [
      formerInputPacketFile,
      draftPipelineFile,
      docFile,
      reportFile,
      smokeFile,
    ],
    changed_files_summary:
      "Adds a pure local Codex perspective former pipeline scaffold.",
    tests_checks_run: [
      {
        check_id: "check:typecheck",
        command: "npm run typecheck",
        status: "passed",
        result_summary: "TypeScript completed without errors.",
      },
    ],
    skipped_checks: [
      {
        check_id: "check:browser",
        skipped_reason:
          "Browser validation skipped because this scaffold has no runtime route or UI.",
        result_summary: "No browser-facing behavior changed.",
      },
    ],
    evidence_row_refs: ["evidence:row:codex-former-pipeline-smoke"],
    proof_only_action_refs: ["action:proof:codex-former-pipeline-smoke"],
    work_event_refs: ["work:event:codex-former-pipeline-implemented"],
    session_trace_refs: ["session:trace:codex-former-pipeline-local"],
    existing_perspective_refs: ["perspective:worker-guidance:v0.1"],
    authority_boundaries: [
      "pure local scaffold only",
      "no provider/model/API calls",
      "no Codex execution",
    ],
    source_privacy_redaction_notes: [
      "bounded summaries and pointer refs only",
      "raw/private/provider material excluded",
    ],
    generated_at: "2026-06-09T00:00:00.000Z",
  });
}

function buildDraftFromPacket(packet, overrides = {}) {
  const selectedMaterial = {
    changed_files: [
      formerInputPacketFile,
      draftPipelineFile,
      docFile,
      reportFile,
      smokeFile,
    ],
    changed_files_summary:
      "Adds a pure local Codex perspective former pipeline scaffold.",
    work_id: packet.source_formation_input_bundle.work_id,
    source_pr_refs: [...packet.source_formation_input_bundle.source_pr_refs],
    ...(overrides.selected_material ?? {}),
  };

  return {
    draft_version: "codex_perspective_candidate_draft.v0.1",
    draft_kind: "codex_perspective_candidate_draft",
    source_former_input_packet: {
      packet_version: packet.packet_version,
      packet_id: packet.packet_id,
      role: packet.role,
    },
    thesis:
      "The bounded local former scaffold creates review material without accepting candidate state.",
    selected_material: selectedMaterial,
    evidence_pointer_refs:
      overrides.evidence_pointer_refs ?? packet.pointer_refs.slice(0, 2),
    unresolved_tensions: overrides.unresolved_tensions ?? [],
    basis_quality_suggestion: overrides.basis_quality_suggestion ?? {
      status: "sufficient_for_review",
      reasons: [],
    },
    next_action_candidates: overrides.next_action_candidates ?? [
      {
        action_id: "review_candidate",
        summary: "Review the non-committed candidate-compatible material.",
      },
    ],
    user_core_decision_questions:
      overrides.user_core_decision_questions ?? [],
    qualification_notes: overrides.qualification_notes ?? [],
    privacy_flags: overrides.privacy_flags ?? {
      raw_payloads_included: false,
      unsafe_input_material_omitted: false,
      omitted_unsafe_fields: [],
    },
    authority_flags: overrides.authority_flags ?? {
      committed_state: false,
      persistence: false,
      provider_model_api_calls: false,
      proof_evidence_readiness_writes: false,
      codex_execution: false,
      github_mutation: false,
      merge_publish_approval: false,
      core_decision: false,
    },
    forbidden_actions: overrides.forbidden_actions ?? [
      "no commit/reject state",
      "no proof/evidence/readiness writes",
      "no merge/publish/approval",
      "no GitHub mutation",
      "no Codex execution",
      "no provider/model/API calls",
      "no persistence",
      "no Core decision",
    ],
    ...withoutNestedOverrideKeys(overrides),
  };
}

function withoutNestedOverrideKeys(overrides) {
  const clone = { ...overrides };
  for (const key of [
    "selected_material",
    "evidence_pointer_refs",
    "unresolved_tensions",
    "basis_quality_suggestion",
    "next_action_candidates",
    "user_core_decision_questions",
    "qualification_notes",
    "privacy_flags",
    "authority_flags",
    "forbidden_actions",
  ]) {
    delete clone[key];
  }
  return clone;
}

function requireCandidate(result) {
  assert.notEqual(
    result.candidate_review_material,
    null,
    "expected candidate-compatible review material",
  );
  return result.candidate_review_material;
}

function assertAuthorityFalse(result) {
  assert.deepEqual(result.authority_flags, {
    committed_state: false,
    persistence: false,
    provider_model_api_calls: false,
    proof_evidence_readiness_writes: false,
    codex_execution: false,
    github_mutation: false,
    merge_publish_approval: false,
    core_decision: false,
  });
}

function assertCandidateAuthorityFalse(candidate) {
  assert.deepEqual(candidate.authority_flags, {
    committed_state: false,
    persistence: false,
    provider_model_api_calls: false,
    proof_evidence_readiness_writes: false,
    codex_execution: false,
    merge_publish_approval: false,
  });
  assert.equal(candidate.privacy.raw_payloads_included, false);
  assert.equal(candidate.authority, "non_committed");
}

function assertNoForbiddenPayloadText(label, value) {
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
    "secret",
  ]) {
    assert.equal(
      serialized.includes(forbiddenMarker),
      false,
      `${label} must not include unsafe marker: ${forbiddenMarker}`,
    );
  }
}

function assertSourceIsPureLocal() {
  assertContainsAll(formerInputPacketText, [
    "buildCodexPerspectiveFormerInputPacket",
    "codex_perspective_former_input_packet.v0.1",
    "codex_perspective_former",
    "bounded_summaries_and_pointer_refs_only: true",
    "raw_payloads_included: false",
    "provider_model_api_calls: false",
    "codex_execution: false",
    "github_mutation: false",
    "core_decision: false",
    "containsUnsafeCodexPerspectiveMaterial",
  ]);
  assertContainsAll(draftPipelineText, [
    "validateAndNormalizeCodexPerspectiveCandidateDraft",
    "validateDraftRuntimeShape",
    "codex_perspective_candidate_draft.v0.1",
    "codex_perspective_candidate_draft_validation.v0.1",
    "candidate_review_material",
    "invalid draft field shape",
    "draft includes unsafe raw/private/provider/token material",
    "draft includes forbidden authority claims",
    "raw_payloads_included: false",
    "github_mutation: false",
    "core_decision: false",
  ]);

  for (const [file, text] of [
    [formerInputPacketFile, formerInputPacketText],
    [draftPipelineFile, draftPipelineText],
  ]) {
    for (const forbiddenMarker of [
      ["read", "File"].join(""),
      ["process", "env"].join("."),
      ["fetch", "("].join(""),
      ["Date", "now"].join("."),
      ["new", "Date"].join(" "),
      "app/api/",
      "db/",
      "migrations/",
      "api.github.com",
      "api.openai.com",
      "GITHUB_TOKEN",
      "OPENAI_API_KEY",
    ]) {
      assert.equal(
        text.includes(forbiddenMarker),
        false,
        `${file} must remain pure local and avoid ${forbiddenMarker}`,
      );
    }
  }
}

function assertDocsAndReport() {
  assertContainsAll(docText, [
    "pure local Codex perspective former pipeline scaffold",
    "Perspective Formation Input Bundle",
    "CodexPerspectiveFormerInputPacket",
    "CodexPerspectiveCandidateDraft",
    "validateAndNormalizeCodexPerspectiveCandidateDraft(input)",
    "candidate-compatible review material",
    "model-shaped draft",
    "not accepted candidate state",
    "pointer-only refs",
    "skipped-check concrete reasons",
    "Worker-Facing Perspective Guidance",
    "downstream consumer only",
    "no Codex call",
    "no Codex SDK",
    "no provider/model/API call",
    "no GitHub API call",
    "no DB write",
    "no runtime route",
    "no UI",
    "no proof/evidence/readiness record",
    "no Core decision",
  ]);
  assertContainsAll(reportText, [
    "Summary",
    "Why This Follows PR #476",
    "Pipeline Existence Goal",
    "Existing Augnes Elements Reused",
    "Existing Augnes Elements Intentionally Not Reused",
    "Files Changed",
    "What Is Validated",
    "Authority Boundary",
    "Verification",
    "Skipped Checks With Concrete Reasons",
    "What Codex Did Not Do",
    "Recommended Next Implementation PR Title",
    "PASS with follow-up",
    "Dogfood local Codex perspective former pipeline on reviewed PR material",
  ]);
}

function assertChangedFileBoundary() {
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `Perspective Codex former pipeline changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/api/") &&
        !changedFile.startsWith("components/") &&
        changedFile !== "app/globals.css" &&
        (!changedFile.startsWith("lib/") ||
          changedFile === formerInputPacketFile ||
          changedFile === draftPipelineFile ||
          changedFile === promptContractFile ||
          changedFile === manualCopyPacketFile ||
          changedFile === workerGuidanceBuilderFile ||
          changedFile === draftSchemaAlignmentHelperFile) &&
        !changedFile.startsWith("db/") &&
        !changedFile.startsWith("migrations/") &&
        !changedFile.startsWith("fixtures/") &&
        !changedFile.startsWith("types/") &&
        !changedFile.includes("provider") &&
        !changedFile.includes("oauth") &&
        !changedFile.includes("codex-sdk") &&
        !changedFile.includes("graph-db") &&
        !changedFile.includes("persistence"),
      `Perspective Codex former pipeline must not change forbidden surfaces: ${changedFile}`,
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
      "Perspective Codex former pipeline smoke collected no changed files",
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

  const localMainFiles = gitLinesStrict(["diff", "--name-only", "main...HEAD"]);
  if (localMainFiles) {
    return localMainFiles;
  }

  const originMergeBase = gitLineStrict(["merge-base", "HEAD", "origin/main"]);
  if (originMergeBase) {
    const originMergeBaseFiles = gitLinesStrict([
      "diff",
      "--name-only",
      `${originMergeBase}...HEAD`,
    ]);
    if (originMergeBaseFiles) {
      return originMergeBaseFiles;
    }
  }

  const localMergeBase = gitLineStrict(["merge-base", "HEAD", "main"]);
  if (localMergeBase) {
    const localMergeBaseFiles = gitLinesStrict([
      "diff",
      "--name-only",
      `${localMergeBase}...HEAD`,
    ]);
    if (localMergeBaseFiles) {
      return localMergeBaseFiles;
    }
  }

  throw new Error(
    "Unable to collect base diff for Perspective Codex former pipeline smoke",
  );
}

function gitLinesOrEmpty(args) {
  return gitLinesStrict(args) ?? [];
}

function gitLinesStrict(args) {
  const output = tryGitOutput(args);
  return output === null ? null : parseGitLines(output);
}

function gitLineStrict(args) {
  const lines = gitLinesStrict(args);
  return lines?.[0] ?? null;
}

function isCommittedBranch() {
  return gitLineStrict(["rev-parse", "--verify", "HEAD"]) !== null;
}

function tryGitOutput(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" });
  } catch {
    return null;
  }
}

function parseGitLines(output) {
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function assertContainsAll(text, snippets) {
  const normalizedText = normalize(text);
  for (const snippet of snippets) {
    assert(
      normalizedText.includes(normalize(snippet)),
      `Expected source to contain: ${snippet}`,
    );
  }
}

function normalize(text) {
  return text.replace(/\s+/g, " ").trim();
}
