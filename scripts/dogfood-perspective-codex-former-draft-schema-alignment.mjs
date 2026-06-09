import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";

const { buildPerspectiveFormationInputBundle } = await import(
  "../lib/perspective-ingest/perspective-formation-input-bundle.ts"
);
const { buildCodexPerspectiveFormerInputPacket } = await import(
  "../lib/perspective-ingest/perspective-codex-former-input-packet.ts"
);
const {
  evaluateCodexPerspectiveCandidateDraftPromptContractFit,
} = await import(
  "../lib/perspective-ingest/perspective-codex-former-prompt-contract.ts"
);
const { validateAndNormalizeCodexPerspectiveCandidateDraft } = await import(
  "../lib/perspective-ingest/perspective-codex-candidate-draft-pipeline.ts"
);
const {
  alignCodexPerspectiveCandidateDraftSchemaFromModelOutput,
} = await import(
  "../lib/perspective-ingest/perspective-codex-candidate-draft-schema-alignment.ts"
);
const { buildWorkerFacingPerspectiveGuidanceFromCandidate } = await import(
  "../lib/perspective-ingest/perspective-worker-facing-guidance.ts"
);
const {
  CAPTURED_REAL_CODEX_RESPONSE,
  REAL_TRANSCRIPT_SOURCE_FORMER_INPUT_PACKET_ID,
  REAL_TRANSCRIPT_SOURCE_MANUAL_COPY_PACKET_ID,
  REAL_TRANSCRIPT_SOURCE_PROMPT_HASH,
  extractCodexPerspectiveCandidateDraftFromTranscript,
} = await import(
  "./dogfood-perspective-codex-former-manual-copy-real-transcript.mjs"
);

export const DRAFT_SCHEMA_ALIGNMENT_GENERATED_AT =
  "2026-06-10T00:00:00.000Z";
export const DRAFT_SCHEMA_ALIGNMENT_ARTIFACT_PATH =
  "reports/2026-06-09-perspective-codex-former-draft-schema-alignment.md";
export const DRAFT_SCHEMA_ALIGNMENT_DOC_PATH =
  "docs/PERSPECTIVE_CODEX_FORMER_DRAFT_SCHEMA_ALIGNMENT_V0_1.md";
export const DRAFT_SCHEMA_ALIGNMENT_RECOMMENDED_NEXT_PR =
  "Refine Codex former prompt contract to emit canonical schema after alignment findings";
export const DRAFT_SCHEMA_ALIGNMENT_FOLLOW_UP_PROMPT_CONTRACT_DOC =
  "docs/PERSPECTIVE_CODEX_FORMER_PROMPT_CONTRACT_CANONICAL_SCHEMA_V0_1.md";
export const DRAFT_SCHEMA_ALIGNMENT_FOLLOW_UP_PROMPT_CONTRACT_REPORT =
  "reports/2026-06-09-perspective-codex-former-prompt-contract-canonical-schema.md";
export const DRAFT_SCHEMA_ALIGNMENT_NEXT_AFTER_PROMPT_REFINEMENT =
  "Dogfood refined Codex former prompt contract with a new captured transcript";

const browserComputerUseValidationNote =
  "Not run: this PR is pure local schema-alignment/docs/report/smoke/package work and adds no UI, route, browser-visible surface, clipboard automation, interactive copy control, or transcript capture.";

const authorityBoundary =
  "This PR is a pure local schema-alignment/docs/report/smoke slice. It does not call Codex from implementation, execute Codex from Augnes, call the Codex SDK, call OpenAI/provider/model APIs from implementation, call GitHub APIs from implementation, use network access in implementation behavior, write DB state, add runtime routes, add UI, add clipboard automation, create proof/evidence/readiness records, approve, merge, publish, retry, replay, deploy, or make Core decisions.";

const sourceChangedFiles = [
  "docs/PERSPECTIVE_CODEX_FORMER_REAL_TRANSCRIPT_CAPTURE_INSTRUCTIONS_V0_1.md",
  "reports/2026-06-09-perspective-codex-former-real-transcript-capture-instructions.md",
  "scripts/smoke-perspective-codex-former-real-transcript-capture-instructions.mjs",
  "docs/PERSPECTIVE_CODEX_FORMER_MANUAL_COPY_TRANSCRIPT_DOGFOOD_V0_1.md",
  "reports/dogfood/2026-06-09-perspective-codex-former-manual-copy-transcript.md",
  "scripts/dogfood-perspective-codex-former-manual-copy-transcript.mjs",
  "scripts/smoke-perspective-codex-former-manual-copy-transcript.mjs",
  "docs/PERSPECTIVE_CODEX_FORMER_MANUAL_COPY_PACKET_V0_1.md",
  "lib/perspective-ingest/perspective-codex-former-manual-copy-packet.ts",
  "scripts/smoke-perspective-codex-former-manual-copy-packet.mjs",
];

export function buildPerspectiveCodexFormerDraftSchemaAlignmentDogfood() {
  const context = buildPipelineContext();
  const capturedRealTranscriptScenario =
    buildCapturedRealTranscriptSchemaAlignmentScenario(context);
  const pointerAliasScenario = buildPointerAliasAlignmentFixture(context);
  const authorityAliasScenario = buildAuthorityAliasAlignmentFixture(context);
  const selectedMaterialScenario =
    buildSelectedMaterialAliasAlignmentFixture(context);
  const unsafeRegressionScenario =
    buildUnsafeOrPrivateMaterialRegressionScenario(context);
  const downstreamGuidanceScenario =
    buildDownstreamGuidanceAfterAlignmentScenario(
      capturedRealTranscriptScenario,
    );
  const scenarios = [
    capturedRealTranscriptScenario,
    pointerAliasScenario,
    authorityAliasScenario,
    selectedMaterialScenario,
    unsafeRegressionScenario,
    downstreamGuidanceScenario,
  ];
  const evaluation = evaluateDogfood(scenarios);
  const artifact = renderArtifact({ evaluation, scenarios });

  return {
    artifact,
    context: summarizeContext(context),
    evaluation,
    scenarios,
    paths: {
      artifact: DRAFT_SCHEMA_ALIGNMENT_ARTIFACT_PATH,
      doc: DRAFT_SCHEMA_ALIGNMENT_DOC_PATH,
    },
  };
}

export function runPerspectiveCodexFormerDraftSchemaAlignmentDogfood() {
  const dogfood = buildPerspectiveCodexFormerDraftSchemaAlignmentDogfood();
  writeReportFile(dogfood.paths.artifact, dogfood.artifact);
  console.log(`wrote ${dogfood.paths.artifact}`);
  return dogfood;
}

export function deriveDraftSchemaAlignmentConclusion(scenarios) {
  const captured = scenarios.find(
    (scenario) =>
      scenario.scenario_id === "captured_real_transcript_schema_alignment",
  );
  const downstream = scenarios.find(
    (scenario) => scenario.scenario_id === "downstream_guidance_after_alignment",
  );

  if (!captured || captured.extraction.extraction_status !== "extracted") {
    return "BLOCKED";
  }
  if (captured.alignment.alignment_status === "blocked") return "BLOCKED";
  if (captured.validation_result?.threw === true) return "BLOCKED";
  if (!captured.candidate_review_material) return "BLOCKED";
  if (downstream?.conclusion === "BLOCKED") return "BLOCKED";
  if (captured.candidate_review_material.basis_quality.status !== "sufficient_for_review") {
    return "PASS with follow-up";
  }

  return "PASS";
}

function buildPipelineContext() {
  const formationInputBundle = buildPerspectiveFormationInputBundle({
    generated_at: DRAFT_SCHEMA_ALIGNMENT_GENERATED_AT,
    scope: "project:augnes",
    work_id: "project-augnes-ag-real-codex-former-transcript-c",
    source_pr_refs: [
      "pr:hynk-studio/augnes#483",
      "pr:hynk-studio/augnes#482",
      "pr:hynk-studio/augnes#481",
      "pr:hynk-studio/augnes#480",
    ],
    changed_files: sourceChangedFiles,
    changed_files_summary:
      "PR #483 found useful real transcript output that needed explicit schema alignment before local validation could produce candidate-compatible review material.",
    tests_checks_run: [
      {
        check_id: "check:pr-483-real-transcript-dogfood",
        command:
          "npm run smoke:perspective-codex-former-manual-copy-real-transcript",
        status: "passed",
        result_summary:
          "PR #483 dogfood extracted one real draft and blocked strict validation on selected material schema drift.",
      },
      {
        check_id: "check:prompt-contract",
        command: "npm run smoke:perspective-codex-former-prompt-contract",
        status: "passed",
        result_summary: "Prompt contract smoke passed.",
      },
      {
        check_id: "check:worker-guidance",
        command: "npm run smoke:perspective-worker-facing-guidance",
        status: "passed",
        result_summary: "Worker-facing guidance smoke passed.",
      },
    ],
    skipped_checks: [
      {
        check_id: "check:browser-computer-use-validation",
        skipped_reason: browserComputerUseValidationNote,
        result_summary:
          "No browser-visible or interactive capture surface is added by this schema-alignment slice.",
      },
    ],
    unresolved_gaps: [
      {
        gap_id: "gap:prompt-contract-canonical-schema",
        summary:
          "The prompt contract should be refined so future Codex former drafts emit canonical local schema directly.",
      },
    ],
    evidence_row_refs: ["evidence:row:real-transcript-capture-instructions"],
    work_event_refs: ["work:event:manual-copy-real-transcript-capture-prompt"],
    existing_perspective_refs: [
      "perspective:codex-former-manual-copy-packet:v0.1",
      "perspective:codex-former-manual-copy-transcript-dogfood:v0.1",
      "perspective:codex-former-real-transcript-capture-instructions:v0.1",
    ],
    authority_boundaries: [
      "Pure local draft schema alignment/report/smoke slice only.",
      "No Codex call, SDK call, provider/model call, GitHub mutation, UI, DB write, proof/evidence/readiness write, approval, merge, or Core decision.",
    ],
    source_privacy_redaction_notes: [
      "Uses only the bounded sanitized PR #483 candidate draft JSON and local pointer refs.",
    ],
  });
  const generatedPacket =
    buildCodexPerspectiveFormerInputPacket(formationInputBundle);
  const formerInputPacket = overrideFormerInputPacketId({
    packet: generatedPacket,
    packetId: REAL_TRANSCRIPT_SOURCE_FORMER_INPUT_PACKET_ID,
  });

  return {
    formationInputBundle,
    formerInputPacket,
    generatedPacketId: generatedPacket.packet_id,
  };
}

function overrideFormerInputPacketId({ packet, packetId }) {
  return {
    ...packet,
    packet_id: packetId,
    copyable_former_input_text: packet.copyable_former_input_text.replace(
      packet.packet_id,
      packetId,
    ),
  };
}

function buildCapturedRealTranscriptSchemaAlignmentScenario(context) {
  const transcript = {
    transcript_available: true,
    extracted_codex_perspective_candidate_draft: CAPTURED_REAL_CODEX_RESPONSE,
  };
  const extraction = extractCodexPerspectiveCandidateDraftFromTranscript(
    transcript,
  );
  const originalContractFit =
    evaluateCodexPerspectiveCandidateDraftPromptContractFit({
      former_input_packet: context.formerInputPacket,
      draft: extraction.draft,
    });
  const alignment =
    alignCodexPerspectiveCandidateDraftSchemaFromModelOutput({
      former_input_packet: context.formerInputPacket,
      draft: extraction.draft,
    });
  const alignedContractFit = alignment.aligned_draft
    ? evaluateCodexPerspectiveCandidateDraftPromptContractFit({
        former_input_packet: context.formerInputPacket,
        draft: alignment.aligned_draft,
      })
    : null;
  const validationResult = alignment.aligned_draft
    ? safelyValidateDraft({
        former_input_packet: context.formerInputPacket,
        draft: alignment.aligned_draft,
      })
    : null;
  const candidateReviewMaterial =
    validationResult && validationResult.status !== "threw"
      ? validationResult.candidate_review_material
      : null;
  const passed =
    extraction.extraction_status === "extracted" &&
    alignment.alignment_status !== "blocked" &&
    validationResult?.status === "needs_review" &&
    candidateReviewMaterial?.authority === "non_committed" &&
    candidateReviewMaterial.basis_quality.status === "needs_review" &&
    allAuthorityFlagsFalse(validationResult.authority_flags);

  return {
    scenario_id: "captured_real_transcript_schema_alignment",
    title: "Captured Real Transcript Schema Alignment",
    fixture_label: "real_human_started_codex_response",
    extraction,
    original_contract_fit: summarizeContractFit(originalContractFit),
    alignment: summarizeAlignment(alignment),
    aligned_contract_fit: alignedContractFit
      ? summarizeContractFit(alignedContractFit)
      : null,
    validation_result: validationResult
      ? summarizeValidationResult(validationResult)
      : null,
    candidate_review_material_raw: candidateReviewMaterial,
    candidate_review_material: candidateReviewMaterial
      ? summarizeCandidate(candidateReviewMaterial)
      : null,
    worker_guidance: null,
    conclusion: passed ? "PASS with follow-up" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : buildBlockedReasons({ extraction, alignment, validationResult }),
    dogfood_notes: [
      "The original #483 drift remains visible in original_contract_fit.",
      "Alignment explicitly maps selected material, pointer aliases, privacy aliases, and model-friendly false authority flags.",
      "Aligned validation produces candidate-compatible review material that remains non_committed and needs_review.",
    ],
  };
}

function buildPointerAliasAlignmentFixture(context) {
  const goodDraft = buildCanonicalDraft(context, {
    evidence_pointer_refs: context.formerInputPacket.pointer_refs
      .slice(0, 2)
      .map((pointer) => ({
        ref: pointer.ref,
        ref_type: pointer.pointer_kind,
        pointer_only: true,
      })),
  });
  const badDraft = buildCanonicalDraft(context, {
    evidence_pointer_refs: [
      {
        ref: context.formerInputPacket.pointer_refs[0].ref,
        ref_type: context.formerInputPacket.pointer_refs[0].pointer_kind,
        pointer_only: false,
      },
    ],
  });
  const goodAlignment =
    alignCodexPerspectiveCandidateDraftSchemaFromModelOutput({
      former_input_packet: context.formerInputPacket,
      draft: goodDraft,
    });
  const badAlignment =
    alignCodexPerspectiveCandidateDraftSchemaFromModelOutput({
      former_input_packet: context.formerInputPacket,
      draft: badDraft,
    });
  const passed =
    goodAlignment.alignment_status === "aligned" &&
    goodAlignment.applied_mappings.includes("pointer_ref_type_pointer_only") &&
    goodAlignment.aligned_draft?.evidence_pointer_refs.every(
      (pointer) => pointer.pointer_semantics === "pointer_only",
    ) &&
    badAlignment.alignment_status === "blocked";

  return {
    scenario_id: "pointer_alias_alignment_fixture",
    title: "Pointer Alias Alignment Fixture",
    fixture_label: "synthetic pointer alias control",
    alignment: summarizeAlignment(goodAlignment),
    negative_alignment: summarizeAlignment(badAlignment),
    validation_result: null,
    candidate_review_material: null,
    worker_guidance: null,
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : ["pointer alias fixture did not align or block as expected"],
    dogfood_notes: [
      "ref_type plus pointer_only true maps to pointer_kind plus pointer_semantics pointer_only.",
      "pointer_only false blocks.",
    ],
  };
}

function buildAuthorityAliasAlignmentFixture(context) {
  const goodDraft = buildCanonicalDraft(context, {
    authority_flags: {
      creates_augnes_state: false,
      creates_proof: false,
      creates_evidence: false,
      creates_readiness_record: false,
      approves: false,
      merges: false,
      publishes: false,
      retries: false,
      replays: false,
      deploys: false,
      mutates_github: false,
      executes_codex: false,
      calls_provider_model_api: false,
      makes_core_decision: false,
    },
  });
  const badModelFriendlyDraft = buildCanonicalDraft(context, {
    authority_flags: {
      creates_augnes_state: true,
    },
  });
  const badCanonicalDraft = buildCanonicalDraft(context, {
    authority_flags: {
      committed_state: true,
    },
  });
  const goodAlignment =
    alignCodexPerspectiveCandidateDraftSchemaFromModelOutput({
      former_input_packet: context.formerInputPacket,
      draft: goodDraft,
    });
  const badModelFriendlyAlignment =
    alignCodexPerspectiveCandidateDraftSchemaFromModelOutput({
      former_input_packet: context.formerInputPacket,
      draft: badModelFriendlyDraft,
    });
  const badCanonicalAlignment =
    alignCodexPerspectiveCandidateDraftSchemaFromModelOutput({
      former_input_packet: context.formerInputPacket,
      draft: badCanonicalDraft,
    });
  const passed =
    goodAlignment.alignment_status === "aligned" &&
    goodAlignment.applied_mappings.includes(
      "authority_model_friendly_false_flags",
    ) &&
    allAuthorityFlagsFalse(goodAlignment.authority_flags) &&
    badModelFriendlyAlignment.alignment_status === "blocked" &&
    badCanonicalAlignment.alignment_status === "blocked";

  return {
    scenario_id: "authority_alias_alignment_fixture",
    title: "Authority Alias Alignment Fixture",
    fixture_label: "synthetic authority alias control",
    alignment: summarizeAlignment(goodAlignment),
    negative_alignment: summarizeAlignment(badModelFriendlyAlignment),
    canonical_negative_alignment: summarizeAlignment(badCanonicalAlignment),
    validation_result: null,
    candidate_review_material: null,
    worker_guidance: null,
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : ["authority alias fixture did not align/block as expected"],
    dogfood_notes: [
      "Model-friendly false authority flags map to canonical false authority flags.",
      "True model-friendly and true canonical authority flags block.",
    ],
  };
}

function buildSelectedMaterialAliasAlignmentFixture(context) {
  const goodDraft = buildCanonicalDraft(context, {
    selected_material: {
      changed_file_paths: ["docs/example.md"],
      plain_summary_facts: ["A bounded fact was supplied."],
      neutral_perspective_basis: ["A bounded neutral basis was supplied."],
      source_pr_refs: ["pr:hynk-studio/augnes#483"],
    },
  });
  const missingDraft = buildCanonicalDraft(context, {
    selected_material: {
      plain_summary_facts: ["Changed files are absent."],
      source_pr_refs: ["pr:hynk-studio/augnes#483"],
    },
  });
  const goodAlignment =
    alignCodexPerspectiveCandidateDraftSchemaFromModelOutput({
      former_input_packet: context.formerInputPacket,
      draft: goodDraft,
    });
  const missingAlignment =
    alignCodexPerspectiveCandidateDraftSchemaFromModelOutput({
      former_input_packet: {
        ...context.formerInputPacket,
        source_formation_input_bundle: {
          ...context.formerInputPacket.source_formation_input_bundle,
          changed_files: [],
        },
      },
      draft: missingDraft,
    });
  const passed =
    goodAlignment.alignment_status === "aligned" &&
    goodAlignment.applied_mappings.includes(
      "selected_material_changed_file_paths",
    ) &&
    goodAlignment.applied_mappings.includes(
      "selected_material_plain_summary_facts",
    ) &&
    goodAlignment.aligned_draft?.selected_material.changed_files.includes(
      "docs/example.md",
    ) &&
    missingAlignment.alignment_status === "blocked";

  return {
    scenario_id: "selected_material_alias_alignment_fixture",
    title: "Selected Material Alias Alignment Fixture",
    fixture_label: "synthetic selected material alias control",
    alignment: summarizeAlignment(goodAlignment),
    negative_alignment: summarizeAlignment(missingAlignment),
    validation_result: null,
    candidate_review_material: null,
    worker_guidance: null,
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : ["selected material alias fixture did not align/block as expected"],
    dogfood_notes: [
      "changed_file_paths maps to changed_files.",
      "plain_summary_facts maps to a bounded changed_files_summary.",
      "neutral_perspective_basis is preserved as qualification notes.",
      "Ambiguous missing changed files block when no source context default exists.",
    ],
  };
}

function buildUnsafeOrPrivateMaterialRegressionScenario(context) {
  const unsafeDraft = buildCanonicalDraft(context, {
    selected_material: {
      changed_file_paths: ["docs/example.md"],
      plain_summary_facts: ["raw_source_payload"],
      source_pr_refs: ["pr:hynk-studio/augnes#483"],
    },
  });
  const privacyDraft = buildCanonicalDraft(context, {
    privacy_flags: {
      private_material_included: true,
    },
  });
  const unsafeAlignment =
    alignCodexPerspectiveCandidateDraftSchemaFromModelOutput({
      former_input_packet: context.formerInputPacket,
      draft: unsafeDraft,
    });
  const privacyAlignment =
    alignCodexPerspectiveCandidateDraftSchemaFromModelOutput({
      former_input_packet: context.formerInputPacket,
      draft: privacyDraft,
    });
  const passed =
    unsafeAlignment.alignment_status === "blocked" &&
    privacyAlignment.alignment_status === "blocked" &&
    assertNoUnsafeMarkerText("unsafe alignment result", unsafeAlignment) &&
    assertNoUnsafeMarkerText("privacy alignment result", privacyAlignment);

  return {
    scenario_id: "unsafe_or_private_material_regression",
    title: "Unsafe Or Private Material Regression",
    fixture_label: "synthetic unsafe/privacy controls",
    alignment: summarizeAlignment(unsafeAlignment),
    privacy_negative_alignment: summarizeAlignment(privacyAlignment),
    validation_result: null,
    candidate_review_material: null,
    worker_guidance: null,
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : ["unsafe or private material regression did not block cleanly"],
    dogfood_notes: [
      "Unsafe markers block alignment and are not copied into aligned draft material.",
      "Privacy inclusion true values block alignment.",
    ],
  };
}

function buildDownstreamGuidanceAfterAlignmentScenario(realScenario) {
  const candidate = realScenario.candidate_review_material_raw;
  if (!candidate) {
    return {
      scenario_id: "downstream_guidance_after_alignment",
      title: "Downstream Guidance After Alignment",
      fixture_label: "skipped because aligned validation blocked",
      alignment: realScenario.alignment,
      validation_result: realScenario.validation_result,
      candidate_review_material: null,
      worker_guidance: null,
      conclusion: "PASS with follow-up",
      blocked_reasons: [],
      dogfood_notes: [
        "Skipped because aligned validation did not produce candidate-compatible review material.",
      ],
    };
  }

  const guidance = buildWorkerFacingPerspectiveGuidanceFromCandidate({
    candidate,
    guidance_context: {
      work_goal:
        "Use aligned captured real transcript candidate material for advisory next-step planning only.",
      bounded_summary:
        "Aligned material is still draft/review-only and non-authoritative.",
    },
  });
  const guidanceSummary = summarizeWorkerGuidance(guidance);
  const passed =
    guidanceSummary.advisory_only === true &&
    guidanceSummary.next_action_count > 0 &&
    allAuthorityFlagsFalse(guidance.authority_flags) &&
    assertNoUnsafeMarkerText("worker guidance", guidance);

  return {
    scenario_id: "downstream_guidance_after_alignment",
    title: "Downstream Guidance After Alignment",
    fixture_label: "aligned real transcript candidate guidance",
    alignment: realScenario.alignment,
    validation_result: realScenario.validation_result,
    candidate_review_material: realScenario.candidate_review_material,
    worker_guidance: guidanceSummary,
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : ["downstream guidance after alignment did not remain advisory-only"],
    dogfood_notes: [
      "Worker-Facing Guidance ran with { candidate, guidance_context }.",
      "Guidance remains advisory-only with false authority flags and visible next actions.",
    ],
  };
}

function evaluateDogfood(scenarios) {
  const realScenario = scenarios.find(
    (scenario) =>
      scenario.scenario_id === "captured_real_transcript_schema_alignment",
  );
  const downstreamScenario = scenarios.find(
    (scenario) => scenario.scenario_id === "downstream_guidance_after_alignment",
  );

  return {
    conclusion: deriveDraftSchemaAlignmentConclusion(scenarios),
    recommended_next_pr_title: DRAFT_SCHEMA_ALIGNMENT_RECOMMENDED_NEXT_PR,
    scenario_conclusions: scenarios.map((scenario) => ({
      scenario_id: scenario.scenario_id,
      conclusion: scenario.conclusion,
    })),
    answered_questions: {
      what_pr_483_found:
        "PR #483 found a useful real Codex former draft that extracted cleanly but blocked strict validation on schema drift.",
      schema_drifts_observed:
        "selected_material aliases, pointer ref_type/pointer_only aliases, model-friendly false authority flag names, privacy false alias names, object user questions, and non-canonical next action ids.",
      aliases_now_supported:
        realScenario?.alignment.applied_mappings.join(", ") ?? "not evaluated",
      aliases_still_blocked:
        "pointer_only false, non-pointer-only semantics, unknown pointer refs, true model-friendly authority flags, true canonical authority flags, privacy inclusion true values, unsafe markers, missing source packet refs, and missing changed files without source context.",
      aligned_validation_result:
        realScenario?.validation_result?.status ?? "not evaluated",
      candidate_material_produced: realScenario?.candidate_review_material
        ? "Yes. Candidate-compatible review material was produced and remains non_committed."
        : "No.",
      downstream_guidance_result: downstreamScenario?.worker_guidance
        ? "Worker-Facing Guidance ran and remained advisory-only."
        : "Worker-Facing Guidance did not run.",
      why_draft_review_only:
        "Alignment and validation return local review material only and do not create accepted state.",
      next_refinement: DRAFT_SCHEMA_ALIGNMENT_RECOMMENDED_NEXT_PR,
      follow_up_prompt_contract_doc:
        DRAFT_SCHEMA_ALIGNMENT_FOLLOW_UP_PROMPT_CONTRACT_DOC,
      follow_up_prompt_contract_report:
        DRAFT_SCHEMA_ALIGNMENT_FOLLOW_UP_PROMPT_CONTRACT_REPORT,
      next_after_prompt_refinement:
        DRAFT_SCHEMA_ALIGNMENT_NEXT_AFTER_PROMPT_REFINEMENT,
    },
  };
}

function safelyValidateDraft({ former_input_packet, draft }) {
  try {
    return validateAndNormalizeCodexPerspectiveCandidateDraft({
      former_input_packet,
      draft,
    });
  } catch (error) {
    return {
      status: "threw",
      threw: true,
      candidate_review_material: null,
      blocked_reasons: [
        `validator threw instead of returning a safe blocked result: ${error.message}`,
      ],
      warnings: [],
      privacy: {
        raw_payloads_included: false,
        unsafe_input_material_omitted: false,
        omitted_unsafe_fields: [],
      },
      authority_flags: buildFalseAuthorityFlags(),
    };
  }
}

function buildCanonicalDraft(context, overrides = {}) {
  return {
    draft_version: "codex_perspective_candidate_draft.v0.1",
    draft_kind: "codex_perspective_candidate_draft",
    source_former_input_packet: {
      packet_version: context.formerInputPacket.packet_version,
      packet_id: context.formerInputPacket.packet_id,
      role: context.formerInputPacket.role,
    },
    thesis:
      "The useful neutral perspective beyond a plain summary is that schema alignment should be explicit and non-authoritative.",
    selected_material: {
      changed_files: ["docs/example.md"],
      changed_files_summary: "A bounded schema-alignment fixture.",
      work_id: context.formerInputPacket.source_formation_input_bundle.work_id,
      source_pr_refs: [
        ...context.formerInputPacket.source_formation_input_bundle
          .source_pr_refs,
      ],
    },
    evidence_pointer_refs: context.formerInputPacket.pointer_refs.slice(0, 1),
    unresolved_tensions: [],
    basis_quality_suggestion: {
      status: "needs_review",
      reasons: ["Fixture remains draft/review-only."],
    },
    next_action_candidates: [
      {
        action_id: "review_candidate",
        summary: "Review aligned draft material.",
      },
    ],
    user_core_decision_questions: [
      "Should schema alignment be followed by prompt-contract refinement?",
    ],
    qualification_notes: [
      "This fixture is local draft/review material only.",
    ],
    privacy_flags: {
      raw_payloads_included: false,
      unsafe_input_material_omitted: false,
      omitted_unsafe_fields: [],
    },
    authority_flags: buildFalseAuthorityFlags(),
    forbidden_actions: [
      "Do not create proof, evidence, readiness records, or accepted Augnes state.",
      "Do not approve, merge, publish, retry, replay, deploy, or mutate GitHub.",
      "Do not execute Codex, call the Codex SDK, or call provider/model/API services.",
      "Do not make Core decisions.",
    ],
    ...overrides,
  };
}

function buildBlockedReasons({ extraction, alignment, validationResult }) {
  return [
    ...extraction.blocked_reasons,
    ...alignment.blocked_reasons,
    ...(validationResult?.blocked_reasons ?? []),
  ];
}

function renderArtifact({ evaluation, scenarios }) {
  const realScenario = scenarios.find(
    (scenario) =>
      scenario.scenario_id === "captured_real_transcript_schema_alignment",
  );
  const downstreamScenario = scenarios.find(
    (scenario) => scenario.scenario_id === "downstream_guidance_after_alignment",
  );
  const lines = [
    "# Perspective Codex Former Draft Schema Alignment",
    "",
    `Generated at: ${DRAFT_SCHEMA_ALIGNMENT_GENERATED_AT}`,
    `Conclusion: ${evaluation.conclusion}`,
    `Recommended next implementation PR title: ${evaluation.recommended_next_pr_title}`,
    "",
    "## Summary",
    "",
    "This pure local dogfood/report/smoke slice follows PR #483 and adds an explicit schema-alignment layer for known safe CodexPerspectiveCandidateDraft model-output aliases.",
    "It preserves the original #483 finding, then deliberately aligns known aliases before local validation.",
    "The captured real transcript now produces candidate-compatible review material after alignment, remains non_committed, keeps basis quality at needs_review, and feeds advisory-only Worker-Facing Guidance.",
    "",
    "## Follow-Up Prompt Contract Refinement",
    "",
    `The recommended #484 follow-up is represented by ${DRAFT_SCHEMA_ALIGNMENT_FOLLOW_UP_PROMPT_CONTRACT_DOC} and ${DRAFT_SCHEMA_ALIGNMENT_FOLLOW_UP_PROMPT_CONTRACT_REPORT}.`,
    `After that prompt-contract refinement, the next implementation PR should be: ${DRAFT_SCHEMA_ALIGNMENT_NEXT_AFTER_PROMPT_REFINEMENT}.`,
    "",
    "## Captured Transcript Findings Addressed",
    "",
    "- selected_material.changed_files was missing because the real output used changed_file_paths.",
    "- pointer refs preserved pointer-only intent but used ref_type and pointer_only aliases.",
    "- authority intent was false but used model-friendly flag names.",
    "- privacy intent used false inclusion aliases.",
    "",
    "## Schema Mappings Added",
    "",
    ...formatList(realScenario?.alignment.applied_mappings ?? []),
    "",
    "## Remaining Blocked Fields",
    "",
    "- pointer_only false or raw/non-pointer semantics",
    "- pointer refs not present in the former input packet",
    "- true model-friendly or canonical authority flags",
    "- privacy inclusion true values",
    "- unsafe raw/private/provider/token/billing/API/hidden-reasoning markers",
    "- missing changed files when no former input packet context can safely supply them",
    "",
    "## Alignment Result",
    "",
    `Captured real transcript alignment status: ${realScenario?.alignment.alignment_status ?? "not evaluated"}`,
    `Original contract fit: ${realScenario?.original_contract_fit?.status ?? "not evaluated"}`,
    `Aligned contract fit: ${realScenario?.aligned_contract_fit?.status ?? "not evaluated"}`,
    "",
    "## Local Validation Result",
    "",
    `Validation status: ${realScenario?.validation_result?.status ?? "not evaluated"}`,
    `Candidate material produced: ${realScenario?.candidate_review_material ? "yes" : "no"}`,
    `Candidate authority: ${realScenario?.candidate_review_material?.authority ?? "not available"}`,
    `Basis quality: ${realScenario?.candidate_review_material?.basis_quality.status ?? "not available"}`,
    "",
    "## Downstream Guidance Result",
    "",
    downstreamScenario?.worker_guidance
      ? `Worker-Facing Guidance ran with status ${downstreamScenario.worker_guidance.guidance_status}; advisory-only=${downstreamScenario.worker_guidance.advisory_only}; next actions=${downstreamScenario.worker_guidance.next_action_count}.`
      : "Worker-Facing Guidance did not run.",
    "",
    "## Why This Remains Draft/Review-Only",
    "",
    "Aligned material is local candidate-compatible review material only. It remains non_committed and does not create accepted state, persistence, proof, evidence, readiness, approval, merge authority, GitHub mutation, Codex execution, provider/model/API behavior, or a Core decision.",
    "",
    "## Scenarios",
    "",
    ...scenarios.flatMap(renderScenario),
    "",
    "## Evaluation Questions",
    "",
    ...Object.entries(evaluation.answered_questions).map(
      ([key, value]) => `- ${key}: ${value}`,
    ),
    "",
    "## Browser/Computer-Use Validation",
    "",
    browserComputerUseValidationNote,
    "",
    "## Authority Boundary",
    "",
    authorityBoundary,
    "",
    "## Verification",
    "",
    "- npm run typecheck",
    "- npm run dogfood:perspective-codex-former-draft-schema-alignment",
    "- npm run smoke:perspective-codex-former-draft-schema-alignment",
    "- npm run dogfood:perspective-codex-former-manual-copy-real-transcript",
    "- npm run smoke:perspective-codex-former-manual-copy-real-transcript",
    "- npm run smoke:perspective-codex-former-real-transcript-capture-instructions",
    "- npm run dogfood:perspective-codex-former-manual-copy-transcript",
    "- npm run smoke:perspective-codex-former-manual-copy-transcript",
    "- npm run smoke:perspective-codex-former-manual-copy-packet",
    "- npm run smoke:perspective-codex-former-prompt-contract",
    "- npm run smoke:perspective-codex-former-pipeline",
    "- npm run smoke:perspective-worker-facing-guidance",
    "- npm run smoke:perspective-candidate-builder-fixture",
    "- npm run smoke:perspective-codex-former-pipeline-dogfood",
    "- npm run dogfood:perspective-codex-former-prompt-contract-canonical-schema",
    "- npm run smoke:perspective-codex-former-prompt-contract-canonical-schema",
    "- git diff --check",
    "- git diff --cached --check",
    "",
    "## Skipped Checks With Concrete Reasons",
    "",
    `- Browser/computer-use validation: ${browserComputerUseValidationNote}`,
    "- DB validation: skipped because this PR adds no DB schema, persistence path, or state writer.",
    "- Provider/model validation: skipped because this PR intentionally does not call Codex, OpenAI, provider/model APIs, or SDKs.",
    "",
    "## What Codex Did Not Do",
    "",
    "Codex did not call Codex from implementation, execute Codex from Augnes, call the Codex SDK, call OpenAI/provider/model APIs from implementation, call GitHub APIs from implementation behavior, use implementation network behavior, write DB state, add runtime routes, add UI, add clipboard automation, create proof/evidence/readiness records, approve, merge, publish, retry, replay, deploy, or make Core decisions.",
    "",
    "## What Should Be Refined Next",
    "",
    DRAFT_SCHEMA_ALIGNMENT_RECOMMENDED_NEXT_PR,
    "",
    "## Next After Prompt Refinement",
    "",
    DRAFT_SCHEMA_ALIGNMENT_NEXT_AFTER_PROMPT_REFINEMENT,
  ];

  return `${lines.join("\n").trimEnd()}\n`;
}

function renderScenario(scenario) {
  return [
    `### ${scenario.title}`,
    "",
    `Scenario id: ${scenario.scenario_id}`,
    `Fixture: ${scenario.fixture_label}`,
    `Conclusion: ${scenario.conclusion}`,
    `Alignment status: ${scenario.alignment?.alignment_status ?? "not evaluated"}`,
    `Applied mappings: ${
      scenario.alignment?.applied_mappings?.length
        ? scenario.alignment.applied_mappings.join(", ")
        : "none"
    }`,
    `Validation status: ${scenario.validation_result?.status ?? "not evaluated"}`,
    `Candidate material: ${scenario.candidate_review_material ? "present" : "none"}`,
    `Worker guidance: ${scenario.worker_guidance ? "present" : "none"}`,
    `Blocked reasons: ${
      scenario.blocked_reasons.length > 0
        ? scenario.blocked_reasons.join("; ")
        : "None"
    }`,
    "",
    "Dogfood notes:",
    ...formatList(scenario.dogfood_notes),
    "",
  ];
}

function summarizeContext(context) {
  return {
    former_input_packet_id: context.formerInputPacket.packet_id,
    generated_packet_id: context.generatedPacketId,
  };
}

function summarizeAlignment(alignment) {
  return {
    alignment_status: alignment.alignment_status,
    applied_mappings: [...alignment.applied_mappings],
    blocked_reasons: [...alignment.blocked_reasons],
    warnings: alignment.warnings.map((warning) => ({
      warning_kind: warning.warning_kind,
      field: warning.field,
      summary: warning.summary,
    })),
    privacy: { ...alignment.privacy },
    authority_flags: { ...alignment.authority_flags },
    aligned_draft: alignment.aligned_draft
      ? {
          selected_material: alignment.aligned_draft.selected_material,
          evidence_pointer_refs: alignment.aligned_draft.evidence_pointer_refs,
          authority_flags: alignment.aligned_draft.authority_flags,
          privacy_flags: alignment.aligned_draft.privacy_flags,
        }
      : null,
  };
}

function summarizeContractFit(contractFit) {
  return {
    status: contractFit.status,
    warnings: contractFit.warnings.map((warning) => ({
      warning_kind: warning.warning_kind,
      field: warning.field,
      summary: warning.summary,
    })),
    privacy: { ...contractFit.privacy },
    authority_flags: { ...contractFit.authority_flags },
  };
}

function summarizeValidationResult(result) {
  return {
    status: result.status,
    threw: result.threw === true,
    blocked_reasons: [...result.blocked_reasons],
    warnings: result.warnings.map((warning) => ({
      warning_kind: warning.warning_kind,
      field: warning.field,
      summary: warning.summary,
    })),
    privacy: { ...result.privacy },
    authority_flags: { ...result.authority_flags },
    candidate_review_material: result.candidate_review_material
      ? summarizeCandidate(result.candidate_review_material)
      : null,
  };
}

function summarizeCandidate(candidate) {
  return {
    candidate_id: candidate.candidate_id,
    authority: candidate.authority,
    basis_quality: { ...candidate.basis_quality },
    evidence_pointer_count: candidate.evidence_pointers.length,
    next_action_count: candidate.next_action_candidates.length,
    authority_flags: { ...candidate.authority_flags },
  };
}

function summarizeWorkerGuidance(guidance) {
  return {
    guidance_status: guidance.guidance_status,
    advisory_only: guidance.scope_alignment.advisory_only,
    next_action_count: guidance.next_smallest_useful_actions.length,
    authority_flags: { ...guidance.authority_flags },
  };
}

function formatList(values) {
  return values.length > 0
    ? values.map((value) => `- ${value}`)
    : ["- none"];
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
    if (serialized.includes(forbiddenMarker)) {
      throw new Error(`${label} includes unsafe marker: ${forbiddenMarker}`);
    }
  }

  return true;
}

function allAuthorityFlagsFalse(flags) {
  if (!flags) return false;
  return Object.values(flags).every((value) => value === false);
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

function writeReportFile(path, contents) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runPerspectiveCodexFormerDraftSchemaAlignmentDogfood();
}
