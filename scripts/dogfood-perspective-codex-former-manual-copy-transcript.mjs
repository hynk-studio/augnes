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
const { buildWorkerFacingPerspectiveGuidanceFromCandidate } = await import(
  "../lib/perspective-ingest/perspective-worker-facing-guidance.ts"
);

export const MANUAL_COPY_TRANSCRIPT_DOGFOOD_GENERATED_AT =
  "2026-06-09T00:00:00.000Z";
export const MANUAL_COPY_TRANSCRIPT_DOGFOOD_ARTIFACT_PATH =
  "reports/dogfood/2026-06-09-perspective-codex-former-manual-copy-transcript.md";
export const MANUAL_COPY_TRANSCRIPT_DOGFOOD_NEXT_PR =
  "Dogfood manual Codex former draft copy packet with a captured real transcript";

const browserComputerUseValidationNote =
  "Not run: no real transcript was supplied and this PR adds no UI, route, browser-visible surface, clipboard automation, or interactive copy control.";

const pr480ChangedFiles = [
  "docs/PERSPECTIVE_CODEX_FORMER_MANUAL_COPY_PACKET_V0_1.md",
  "lib/perspective-ingest/perspective-codex-former-manual-copy-packet.ts",
  "package.json",
  "reports/2026-06-09-perspective-codex-former-manual-copy-packet.md",
  "scripts/smoke-perspective-candidate-builder-fixture.mjs",
  "scripts/smoke-perspective-codex-former-manual-copy-packet.mjs",
  "scripts/smoke-perspective-codex-former-pipeline-dogfood.mjs",
  "scripts/smoke-perspective-codex-former-pipeline.mjs",
  "scripts/smoke-perspective-codex-former-prompt-contract.mjs",
  "scripts/smoke-perspective-worker-facing-guidance.mjs",
];

export function buildPerspectiveCodexFormerManualCopyTranscriptDogfood() {
  const pipelineContext = buildPipelineContext();
  const realTranscriptScenario =
    buildRealTranscriptUnavailableScenario(pipelineContext);
  const extractionFailureScenario = buildTranscriptExtractionFailureScenario(
    pipelineContext,
  );
  const badResponseRegressionScenario = buildBadResponseRegressionScenario(
    pipelineContext,
  );
  const downstreamGuidanceScenario = buildDownstreamGuidanceScenario(
    realTranscriptScenario,
  );
  const syntheticDownstreamGuidanceControlScenario =
    buildSyntheticDownstreamGuidancePositiveControlScenario(pipelineContext);
  const scenarios = [
    realTranscriptScenario,
    extractionFailureScenario,
    badResponseRegressionScenario,
    downstreamGuidanceScenario,
    syntheticDownstreamGuidanceControlScenario,
  ];
  const evaluation = evaluateDogfood(scenarios);
  const artifact = renderArtifact({ evaluation, scenarios });

  return {
    artifact,
    evaluation,
    scenarios,
    paths: {
      artifact: MANUAL_COPY_TRANSCRIPT_DOGFOOD_ARTIFACT_PATH,
    },
  };
}

export function runPerspectiveCodexFormerManualCopyTranscriptDogfood() {
  const dogfood = buildPerspectiveCodexFormerManualCopyTranscriptDogfood();
  writeReportFile(dogfood.paths.artifact, dogfood.artifact);
  console.log(`wrote ${dogfood.paths.artifact}`);
  return dogfood;
}

export function deriveTranscriptDogfoodConclusion(scenarios) {
  const conclusions = scenarios.map((scenario) => scenario.conclusion);
  if (conclusions.includes("BLOCKED")) return "BLOCKED";
  if (conclusions.includes("PASS with follow-up")) return "PASS with follow-up";
  return "PASS";
}

export function extractCodexPerspectiveCandidateDraftFromTranscript(
  transcript,
) {
  if (!transcript?.transcript_available) {
    return {
      extraction_status: "blocked",
      draft: null,
      blocked_reasons: ["real Codex response transcript was not supplied"],
    };
  }

  if (transcript.extracted_codex_perspective_candidate_draft) {
    return {
      extraction_status: "extracted",
      draft: transcript.extracted_codex_perspective_candidate_draft,
      blocked_reasons: [],
    };
  }

  const extractedJsonText = transcript.extracted_json_text ?? null;
  if (!extractedJsonText) {
    return {
      extraction_status: "blocked",
      draft: null,
      blocked_reasons: [
        "transcript does not include extracted CodexPerspectiveCandidateDraft JSON",
      ],
    };
  }

  try {
    return {
      extraction_status: "extracted",
      draft: JSON.parse(extractedJsonText),
      blocked_reasons: [],
    };
  } catch {
    return {
      extraction_status: "blocked",
      draft: null,
      blocked_reasons: [
        "transcript extracted JSON could not be parsed",
      ],
    };
  }
}

function buildPipelineContext() {
  const formationInputBundle = buildPerspectiveFormationInputBundle({
    generated_at: MANUAL_COPY_TRANSCRIPT_DOGFOOD_GENERATED_AT,
    scope: "project:augnes",
    work_id: "AG-perspective-codex-former-manual-copy-transcript-dogfood",
    source_pr_refs: ["pr:hynk-studio/augnes#480", "pr:hynk-studio/augnes#479"],
    changed_files: pr480ChangedFiles,
    changed_files_summary:
      "PR #480 added a pure local manual copy packet for Codex former draft prompts after PR #479 added the prompt contract.",
    tests_checks_run: [
      {
        check_id: "check:typecheck",
        command: "npm run typecheck",
        status: "passed",
        result_summary: "TypeScript completed without errors.",
      },
      {
        check_id: "check:manual-copy-packet",
        command: "npm run smoke:perspective-codex-former-manual-copy-packet",
        status: "passed",
        result_summary:
          "Manual copy packet smoke passed and established local copy-packet behavior.",
      },
    ],
    skipped_checks: [
      {
        check_id: "check:real-codex-transcript",
        skipped_reason:
          "A real human-started Codex response transcript was not supplied with this PR.",
        result_summary:
          "The transcript dogfood cannot claim success without real transcript provenance.",
      },
    ],
    unresolved_gaps: [
      {
        gap_id: "gap:real-transcript-missing",
        summary:
          "Real Codex response transcript is required before usefulness can be judged.",
      },
    ],
    evidence_row_refs: ["evidence:row:manual-copy-transcript-harness"],
    work_event_refs: ["work:event:manual-copy-transcript-harness"],
    existing_perspective_refs: [
      "perspective:codex-former-manual-copy-packet:v0.1",
      "perspective:codex-former-prompt-contract:v0.1",
    ],
    authority_boundaries: [
      "Pure local transcript dogfood/report/smoke slice only.",
      "No Codex call, SDK call, provider/model call, GitHub mutation, UI, DB write, proof/evidence/readiness write, approval, merge, or Core decision.",
    ],
    source_privacy_redaction_notes: [
      "Only bounded PR #480 and PR #479 summaries and pointer refs are included.",
    ],
  });
  const formerInputPacket =
    buildCodexPerspectiveFormerInputPacket(formationInputBundle);
  const promptContract =
    buildCodexPerspectiveFormerDraftPromptContractFromInputPacket(
      formerInputPacket,
    );
  const manualCopyPacket = buildManualCodexPerspectiveFormerDraftCopyPacket({
    former_input_packet: formerInputPacket,
    prompt_contract: promptContract,
    manual_context: {
      reviewer_label: "manual transcript reviewer",
      intended_codex_surface: "user-started Codex session",
      usage_notes: [
        "No real response transcript was supplied for this local dogfood PR.",
      ],
    },
    expected_validation_commands: [
      "npm run smoke:perspective-codex-former-manual-copy-transcript",
      "npm run smoke:perspective-codex-former-manual-copy-packet",
      "npm run smoke:perspective-codex-former-prompt-contract",
    ],
    generated_at: MANUAL_COPY_TRANSCRIPT_DOGFOOD_GENERATED_AT,
  });
  const manualCopyPacketEvaluation =
    evaluateManualCodexPerspectiveFormerDraftCopyPacket(manualCopyPacket);

  return {
    formationInputBundle,
    formerInputPacket,
    promptContract,
    manualCopyPacket,
    manualCopyPacketEvaluation,
  };
}

function buildRealTranscriptUnavailableScenario(context) {
  const transcript = {
    transcript_kind: "manual_codex_former_response_transcript",
    transcript_version: "manual_codex_former_response_transcript.v0.1",
    transcript_available: false,
    source_manual_copy_packet_id: context.manualCopyPacket.packet_id,
    source_prompt_hash: stableHash(
      context.manualCopyPacket.copyable_codex_prompt_text,
    ),
    captured_by: null,
    captured_at: null,
    codex_surface_label: null,
    prompt_was_generated_by_manual_copy_packet: true,
    response_text: null,
    extracted_json_text: null,
    extracted_codex_perspective_candidate_draft: null,
    transcript_redaction_notes: [
      "No real transcript was supplied; no transcript content is present.",
    ],
    privacy_flags: {
      raw_payloads_included: false,
      private_account_data_included: false,
      browser_tokens_or_cookies_included: false,
    },
    authority_flags: buildFalseAuthorityFlags(),
  };
  const extraction = extractCodexPerspectiveCandidateDraftFromTranscript(
    transcript,
  );

  return {
    scenario_id: "real_transcript_ready_or_needs_review",
    title: "Real Transcript Ready Or Needs Review",
    fixture_label: "real transcript unavailable",
    transcript_provenance: summarizeTranscript(transcript),
    manual_copy_packet: summarizeManualCopyPacket(context.manualCopyPacket),
    extraction,
    contract_fit: null,
    validation_result: null,
    candidate_review_material: null,
    worker_guidance: null,
    guidance_input_shape: null,
    conclusion: "BLOCKED",
    blocked_reasons: [
      "No real human-started Codex response transcript was supplied.",
      ...extraction.blocked_reasons,
    ],
    dogfood_notes: [
      "This PR does not fabricate a real transcript.",
      "The local harness is ready to evaluate a future bounded sanitized transcript fixture.",
      "Browser/computer-use validation was not used because no transcript capture surface was exercised.",
    ],
  };
}

function buildTranscriptExtractionFailureScenario(context) {
  const transcript = {
    transcript_kind: "manual_codex_former_response_transcript",
    transcript_version: "manual_codex_former_response_transcript.v0.1",
    transcript_available: true,
    fixture_source: "synthetic_negative_control",
    source_manual_copy_packet_id: context.manualCopyPacket.packet_id,
    source_prompt_hash: stableHash(
      context.manualCopyPacket.copyable_codex_prompt_text,
    ),
    captured_by: "synthetic_control",
    captured_at: MANUAL_COPY_TRANSCRIPT_DOGFOOD_GENERATED_AT,
    codex_surface_label: "synthetic negative control",
    prompt_was_generated_by_manual_copy_packet: true,
    response_text:
      "This bounded negative control intentionally contains no JSON candidate draft.",
    extracted_json_text: null,
    extracted_codex_perspective_candidate_draft: null,
    transcript_redaction_notes: [
      "Synthetic control contains no private account, browser, token, or raw page material.",
    ],
    privacy_flags: {
      raw_payloads_included: false,
      private_account_data_included: false,
      browser_tokens_or_cookies_included: false,
    },
    authority_flags: buildFalseAuthorityFlags(),
  };
  const extraction = extractCodexPerspectiveCandidateDraftFromTranscript(
    transcript,
  );

  return {
    scenario_id: "transcript_extraction_failure_case",
    title: "Transcript Extraction Failure Case",
    fixture_label: "synthetic negative control",
    transcript_provenance: summarizeTranscript(transcript),
    manual_copy_packet: summarizeManualCopyPacket(context.manualCopyPacket),
    extraction,
    contract_fit: null,
    validation_result: null,
    candidate_review_material: null,
    worker_guidance: null,
    guidance_input_shape: null,
    conclusion: extraction.extraction_status === "blocked" ? "PASS" : "BLOCKED",
    blocked_reasons:
      extraction.extraction_status === "blocked"
        ? []
        : ["negative control unexpectedly extracted draft JSON"],
    dogfood_notes: [
      "Extraction fails closed without candidate-compatible review material.",
      "Next action is to improve capture instructions or ingestion if real transcripts are hard to extract.",
    ],
  };
}

function buildBadResponseRegressionScenario(context) {
  const badDraft = buildReturnedDraftFromPacket(context.formerInputPacket, {
    thesis: "PR #480 added a manual copy packet.",
    evidence_pointer_refs: [
      {
        pointer_kind: "evidence_row_ref",
        pointer_semantics: "raw_material",
        ref: "evidence:row:not-present",
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
  const transcript = {
    transcript_kind: "manual_codex_former_response_transcript",
    transcript_version: "manual_codex_former_response_transcript.v0.1",
    transcript_available: true,
    fixture_source: "synthetic_bad_response_control",
    source_manual_copy_packet_id: context.manualCopyPacket.packet_id,
    source_prompt_hash: stableHash(
      context.manualCopyPacket.copyable_codex_prompt_text,
    ),
    captured_by: "synthetic_control",
    captured_at: MANUAL_COPY_TRANSCRIPT_DOGFOOD_GENERATED_AT,
    codex_surface_label: "synthetic bad response control",
    prompt_was_generated_by_manual_copy_packet: true,
    response_text: null,
    extracted_json_text: JSON.stringify(badDraft),
    extracted_codex_perspective_candidate_draft: badDraft,
    transcript_redaction_notes: [
      "Synthetic control includes only bounded malformed draft fields for regression coverage.",
    ],
    privacy_flags: {
      raw_payloads_included: false,
      private_account_data_included: false,
      browser_tokens_or_cookies_included: false,
    },
    authority_flags: buildFalseAuthorityFlags(),
  };
  const extraction = extractCodexPerspectiveCandidateDraftFromTranscript(
    transcript,
  );
  const contractFit = evaluateCodexPerspectiveCandidateDraftPromptContractFit({
    former_input_packet: context.formerInputPacket,
    draft: extraction.draft,
  });
  const validationResult = validateAndNormalizeCodexPerspectiveCandidateDraft({
    former_input_packet: context.formerInputPacket,
    draft: extraction.draft,
  });
  const passed =
    extraction.extraction_status === "extracted" &&
    contractFit.status === "violates_contract" &&
    validationResult.status === "blocked" &&
    validationResult.candidate_review_material === null;

  return {
    scenario_id: "real_or_control_bad_response_regression",
    title: "Real Or Control Bad Response Regression",
    fixture_label: "synthetic bad response control",
    transcript_provenance: summarizeTranscript(transcript),
    manual_copy_packet: summarizeManualCopyPacket(context.manualCopyPacket),
    extraction,
    contract_fit: summarizeContractFit(contractFit),
    validation_result: summarizeValidationResult(validationResult),
    candidate_review_material: null,
    worker_guidance: null,
    guidance_input_shape: null,
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : ["bad response regression did not fail closed as expected"],
    dogfood_notes: [
      "The control fixture is not a claimed real transcript.",
      "Contract fit flags the response and validation blocks malformed/authority-claiming output.",
    ],
  };
}

function buildSyntheticDownstreamGuidancePositiveControlScenario(context) {
  const returnedDraft = buildReturnedDraftFromPacket(context.formerInputPacket, {
    thesis:
      "The useful neutral perspective beyond a plain summary is that transcript dogfood can only test downstream planning after local validation produces candidate-compatible review material.",
    unresolved_tensions: [
      {
        tension_id: "tension:real-transcript-still-missing",
        summary:
          "This is a synthetic guidance control, not a real Codex transcript, so usefulness remains blocked for the main dogfood.",
      },
    ],
    basis_quality_suggestion: {
      status: "needs_review",
      reasons: [
        "A real transcript is still missing, but this control can exercise guidance compatibility with candidate-compatible material.",
      ],
    },
    qualification_notes: [
      "Synthetic positive control only; not a claimed real transcript.",
      "Useful beyond summary because it verifies the downstream advisory guidance call shape.",
    ],
  });
  const transcript = {
    transcript_kind: "manual_codex_former_response_transcript",
    transcript_version: "manual_codex_former_response_transcript.v0.1",
    transcript_available: true,
    fixture_source: "synthetic_positive_guidance_control",
    source_manual_copy_packet_id: context.manualCopyPacket.packet_id,
    source_prompt_hash: stableHash(
      context.manualCopyPacket.copyable_codex_prompt_text,
    ),
    captured_by: "synthetic_control",
    captured_at: MANUAL_COPY_TRANSCRIPT_DOGFOOD_GENERATED_AT,
    codex_surface_label: "synthetic downstream guidance control",
    prompt_was_generated_by_manual_copy_packet: true,
    response_text: null,
    extracted_json_text: JSON.stringify(returnedDraft),
    extracted_codex_perspective_candidate_draft: returnedDraft,
    transcript_redaction_notes: [
      "Synthetic positive control contains no real Codex transcript content.",
    ],
    privacy_flags: {
      raw_payloads_included: false,
      private_account_data_included: false,
      browser_tokens_or_cookies_included: false,
    },
    authority_flags: buildFalseAuthorityFlags(),
  };
  const extraction = extractCodexPerspectiveCandidateDraftFromTranscript(
    transcript,
  );
  const contractFit = evaluateCodexPerspectiveCandidateDraftPromptContractFit({
    former_input_packet: context.formerInputPacket,
    draft: extraction.draft,
  });
  const validationResult = validateAndNormalizeCodexPerspectiveCandidateDraft({
    former_input_packet: context.formerInputPacket,
    draft: extraction.draft,
  });

  const controlTranscriptScenario = {
    scenario_id: "synthetic_transcript_guidance_control_source",
    title: "Synthetic Transcript Guidance Control Source",
    fixture_label: "synthetic positive guidance control",
    transcript_provenance: summarizeTranscript(transcript),
    manual_copy_packet: summarizeManualCopyPacket(context.manualCopyPacket),
    extraction,
    contract_fit: summarizeContractFit(contractFit),
    validation_result: summarizeValidationResult(validationResult),
    candidate_review_material: validationResult.candidate_review_material,
    worker_guidance: null,
    guidance_input_shape: null,
    conclusion: "PASS",
    blocked_reasons: [],
    dogfood_notes: [
      "This is a synthetic control used only to exercise the downstream guidance path.",
    ],
  };

  return buildDownstreamGuidanceScenario(controlTranscriptScenario, {
    scenario_id: "synthetic_downstream_guidance_positive_control",
    title: "Synthetic Downstream Guidance Positive Control",
    fixture_label: "synthetic positive control, not a real transcript",
    dogfood_notes: [
      "Synthetic positive control only; it proves the downstream guidance builder receives { candidate, guidance_context }.",
      "It does not change the top-level BLOCKED conclusion while the real transcript is missing.",
    ],
  });
}

function buildDownstreamGuidanceScenario(realTranscriptScenario, overrides = {}) {
  if (!realTranscriptScenario.candidate_review_material) {
    return {
      scenario_id: overrides.scenario_id ?? "downstream_guidance_compatibility",
      title: overrides.title ?? "Downstream Guidance Compatibility",
      fixture_label:
        overrides.fixture_label ??
        "skipped because real transcript validation blocked",
      transcript_provenance: realTranscriptScenario.transcript_provenance,
      manual_copy_packet: realTranscriptScenario.manual_copy_packet,
      extraction: realTranscriptScenario.extraction,
      contract_fit: null,
      validation_result: null,
      candidate_review_material: null,
      worker_guidance: null,
      guidance_input_shape: null,
      conclusion: "PASS with follow-up",
      blocked_reasons: [],
      dogfood_notes:
        overrides.dogfood_notes ?? [
          "Skipped because no real transcript candidate-compatible review material exists.",
          "Run after a bounded real transcript fixture is supplied and validation succeeds.",
        ],
    };
  }

  const guidanceInput = {
    candidate: realTranscriptScenario.candidate_review_material,
    guidance_context: {
      work_goal:
        "Evaluate bounded transcript dogfood candidate material for advisory next-step planning only.",
      bounded_summary:
        "Candidate-compatible review material is local, non-committed, and non-authoritative.",
    },
  };
  const guidance =
    buildWorkerFacingPerspectiveGuidanceFromCandidate(guidanceInput);
  const guidanceSummary = summarizeWorkerGuidance(guidance);
  const passed =
    guidanceInput.candidate === realTranscriptScenario.candidate_review_material &&
    guidanceSummary.advisory_only === true &&
    guidanceSummary.next_action_count > 0 &&
    allAuthorityFlagsFalse(guidance.authority_flags);

  return {
    scenario_id: overrides.scenario_id ?? "downstream_guidance_compatibility",
    title: overrides.title ?? "Downstream Guidance Compatibility",
    fixture_label:
      overrides.fixture_label ?? "real transcript candidate guidance",
    transcript_provenance: realTranscriptScenario.transcript_provenance,
    manual_copy_packet: realTranscriptScenario.manual_copy_packet,
    extraction: realTranscriptScenario.extraction,
    contract_fit: realTranscriptScenario.contract_fit,
    validation_result: realTranscriptScenario.validation_result,
    candidate_review_material: summarizeCandidate(
      realTranscriptScenario.candidate_review_material,
    ),
    worker_guidance: guidanceSummary,
    guidance_input_shape: {
      candidate_present: Boolean(guidanceInput.candidate),
      guidance_context_present: Boolean(guidanceInput.guidance_context),
      guidance_context_bounded: true,
      guidance_context_authoritative: false,
    },
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : ["downstream guidance compatibility did not remain advisory-only"],
    dogfood_notes:
      overrides.dogfood_notes ?? [
        "Guidance remains advisory-only after candidate-compatible material.",
      ],
  };
}

function evaluateDogfood(scenarios) {
  const scenarioConclusions = scenarios.map((scenario) => ({
    scenario_id: scenario.scenario_id,
    conclusion: scenario.conclusion,
  }));
  const realScenario = scenarios.find(
    (scenario) => scenario.scenario_id === "real_transcript_ready_or_needs_review",
  );

  return {
    conclusion: deriveTranscriptDogfoodConclusion(scenarios),
    scenario_conclusions: scenarioConclusions,
    real_transcript_available:
      realScenario?.transcript_provenance.transcript_available === true,
    browser_computer_use_validation: browserComputerUseValidationNote,
    answered_questions: {
      was_real_transcript_available: "No.",
      was_browser_computer_use_used: "No.",
      did_transcript_come_from_manual_copy_packet:
        "No transcript was supplied; the generated prompt packet exists and is referenced.",
      could_returned_json_be_extracted:
        "No for the main scenario because no real transcript was supplied.",
      did_returned_draft_fit_contract:
        "Not evaluated for a real response; synthetic bad control is flagged.",
      did_validation_produce_candidate_material:
        "No real candidate-compatible material exists because the real transcript is missing.",
      did_real_draft_add_neutral_perspective:
        "Not evaluated; real response transcript is missing.",
      did_refs_remain_pointer_only:
        "Not evaluated for real response; controls remain bounded.",
      did_it_avoid_unsafe_material:
        "Yes for generated dogfood artifacts and controls.",
      did_it_avoid_authority_claims:
        "No real response exists; bad control authority claims are blocked.",
      did_it_distinguish_basis:
        "Not evaluated for real response; this remains the next dogfood task.",
      did_downstream_guidance_remain_advisory:
        "Skipped for the missing real transcript; synthetic positive control confirms advisory-only guidance compatibility.",
      what_should_be_refined_next:
        MANUAL_COPY_TRANSCRIPT_DOGFOOD_NEXT_PR,
    },
  };
}

function renderArtifact({ evaluation, scenarios }) {
  const lines = [
    "# Perspective Codex Former Manual Copy Transcript Dogfood",
    "",
    `Generated at: ${MANUAL_COPY_TRANSCRIPT_DOGFOOD_GENERATED_AT}`,
    `Conclusion: ${evaluation.conclusion}`,
    `Recommended next implementation PR title: ${MANUAL_COPY_TRANSCRIPT_DOGFOOD_NEXT_PR}`,
    "",
    "## Summary",
    "",
    "This deterministic local dogfood harness follows PR #480 and prepares evaluation for a real human-started Codex response transcript.",
    "No real transcript was supplied in this PR, so the real transcript dogfood scenario is BLOCKED instead of fabricated.",
    "",
    "## Follow-Up Capture Instructions",
    "",
    "- `docs/PERSPECTIVE_CODEX_FORMER_REAL_TRANSCRIPT_CAPTURE_INSTRUCTIONS_V0_1.md`",
    "- `reports/2026-06-09-perspective-codex-former-real-transcript-capture-instructions.md`",
    "",
    "Perspective Codex Former Real Transcript Capture Instructions v0.1 defines how a future bounded real transcript fixture should be captured, redacted, reviewed, extracted, and validated.",
    "",
    "## Real Transcript Provenance",
    "",
    "- Real transcript available: No",
    "- Captured by: not available",
    "- Codex surface: not available",
    "- Source manual copy packet: generated locally from bounded PR #480-like material",
    "- Browser/computer-use validation: Not run",
    `- Browser/computer-use reason: ${browserComputerUseValidationNote}`,
    "- Redaction/privacy notes: no transcript content supplied; no private browser/account material included",
    "",
    "## Authority Boundary",
    "",
    "This PR is a pure local transcript dogfood/report/smoke slice. It does not call Codex from implementation, execute Codex from Augnes, call the Codex SDK, call OpenAI/provider/model APIs from implementation, call GitHub APIs from implementation, use network access in implementation behavior, write DB state, add runtime routes, add UI, create proof/evidence/readiness records, approve, merge, publish, retry, replay, deploy, or make Core decisions.",
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
    "## Verification",
    "",
    "- npm run typecheck",
    "- npm run dogfood:perspective-codex-former-manual-copy-transcript",
    "- npm run smoke:perspective-codex-former-manual-copy-transcript",
    "- npm run smoke:perspective-codex-former-manual-copy-packet",
    "- npm run smoke:perspective-codex-former-prompt-contract",
    "- npm run smoke:perspective-codex-former-pipeline",
    "- npm run smoke:perspective-worker-facing-guidance",
    "- npm run smoke:perspective-candidate-builder-fixture",
    "- npm run smoke:perspective-codex-former-pipeline-dogfood",
    "- git diff --check",
    "- git diff --cached --check",
    "",
    "## Skipped Checks With Concrete Reasons",
    "",
    "- Real transcript dogfood: skipped/blocked because no bounded real human-started Codex response transcript was supplied.",
    `- Browser/computer-use validation: ${browserComputerUseValidationNote}`,
    "- DB validation: skipped because this PR adds no DB schema, persistence path, or state writer.",
    "- Provider/model validation: skipped because this PR intentionally does not call Codex, OpenAI, provider/model APIs, or SDKs.",
    "",
    "## What Codex Did Not Do",
    "",
    "Codex did not call Codex from implementation, execute Codex from Augnes, call the Codex SDK, call OpenAI/provider/model APIs from implementation, call GitHub APIs from implementation, use implementation network behavior, write DB state, add runtime routes, add UI, create proof/evidence/readiness records, approve, merge, publish, retry, replay, deploy, or make Core decisions.",
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
    `Blocked reasons: ${
      scenario.blocked_reasons.length > 0
        ? scenario.blocked_reasons.join("; ")
        : "None"
    }`,
    `Transcript available: ${scenario.transcript_provenance.transcript_available ? "yes" : "no"}`,
    `Transcript provenance: ${scenario.transcript_provenance.captured_by ?? "not available"}`,
    `Prompt generated by manual copy packet: ${scenario.transcript_provenance.prompt_was_generated_by_manual_copy_packet ? "yes" : "no"}`,
    `Extraction status: ${scenario.extraction.extraction_status}`,
    `Contract fit: ${scenario.contract_fit?.status ?? "not evaluated"}`,
    `Validation status: ${scenario.validation_result?.status ?? "not evaluated"}`,
    `Candidate material: ${scenario.candidate_review_material ? "present" : "none"}`,
    `Worker guidance: ${scenario.worker_guidance ? "present" : "none"}`,
    `Guidance input includes candidate: ${scenario.guidance_input_shape?.candidate_present ? "yes" : "no"}`,
    `Guidance advisory only: ${scenario.worker_guidance?.advisory_only === true ? "yes" : "not evaluated"}`,
    `Guidance next action count: ${scenario.worker_guidance?.next_action_count ?? "not evaluated"}`,
    "",
    "Dogfood notes:",
    ...formatList(scenario.dogfood_notes),
    "",
  ];
}

function summarizeTranscript(transcript) {
  return {
    transcript_kind: transcript.transcript_kind,
    transcript_version: transcript.transcript_version,
    transcript_available: transcript.transcript_available,
    fixture_source: transcript.fixture_source ?? null,
    source_manual_copy_packet_id: transcript.source_manual_copy_packet_id,
    source_prompt_hash: transcript.source_prompt_hash,
    captured_by: transcript.captured_by,
    captured_at: transcript.captured_at,
    codex_surface_label: transcript.codex_surface_label,
    prompt_was_generated_by_manual_copy_packet:
      transcript.prompt_was_generated_by_manual_copy_packet,
    transcript_redaction_notes: [...transcript.transcript_redaction_notes],
    privacy_flags: { ...transcript.privacy_flags },
    authority_flags: { ...transcript.authority_flags },
  };
}

function summarizeManualCopyPacket(packet) {
  return {
    packet_id: packet.packet_id,
    copy_status: packet.copy_status,
    copy_status_reasons: [...packet.copy_status_reasons],
    source_former_input_packet: { ...packet.source_former_input_packet },
    source_prompt_contract: { ...packet.source_prompt_contract },
    expected_draft_version: packet.expected_codex_response_contract.draft_version,
    expected_draft_kind: packet.expected_codex_response_contract.draft_kind,
    privacy: { ...packet.privacy },
    authority_flags: { ...packet.authority_flags },
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
    thesis: candidate.thesis,
    basis_quality: { ...candidate.basis_quality },
    evidence_pointer_count: candidate.evidence_pointers.length,
    unresolved_tension_count: candidate.unresolved_tensions.length,
    next_action_count: candidate.next_action_candidates.length,
    user_core_question_count: candidate.user_core_decision_questions.length,
    authority_flags: { ...candidate.authority_flags },
  };
}

function summarizeWorkerGuidance(guidance) {
  return {
    guidance_status: guidance.guidance_status,
    advisory_only: guidance.scope_alignment.advisory_only,
    scope_alignment_status: guidance.scope_alignment.status,
    next_action_count: guidance.next_smallest_useful_actions.length,
    authority_flags: { ...guidance.authority_flags },
  };
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
      "The useful neutral perspective beyond a plain summary is that transcript dogfood must remain blocked until a real response exists.",
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
      reasons: ["Real transcript dogfood remains missing."],
    },
    next_action_candidates: overrides.next_action_candidates ?? [
      {
        action_id: "review_candidate",
        summary: "Review transcript dogfood output after local validation.",
      },
    ],
    user_core_decision_questions:
      overrides.user_core_decision_questions ?? [
        "Should the next PR capture a real transcript before judging usefulness?",
      ],
    qualification_notes: overrides.qualification_notes ?? [
      "This remains draft/review material only.",
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

function stableHash(value) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash.toString(36);
}

function formatList(values) {
  return values.map((value) => `- ${value}`);
}

function writeReportFile(path, contents) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runPerspectiveCodexFormerManualCopyTranscriptDogfood();
}
