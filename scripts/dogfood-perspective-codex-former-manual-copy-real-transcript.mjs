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
const { buildManualCodexPerspectiveFormerDraftCopyPacket } = await import(
  "../lib/perspective-ingest/perspective-codex-former-manual-copy-packet.ts"
);
const { validateAndNormalizeCodexPerspectiveCandidateDraft } = await import(
  "../lib/perspective-ingest/perspective-codex-candidate-draft-pipeline.ts"
);
const { buildWorkerFacingPerspectiveGuidanceFromCandidate } = await import(
  "../lib/perspective-ingest/perspective-worker-facing-guidance.ts"
);

export const MANUAL_COPY_REAL_TRANSCRIPT_DOGFOOD_GENERATED_AT =
  "2026-06-09T00:00:00.000Z";
export const MANUAL_COPY_REAL_TRANSCRIPT_DOGFOOD_ARTIFACT_PATH =
  "reports/dogfood/2026-06-09-perspective-codex-former-manual-copy-real-transcript.md";
export const MANUAL_COPY_REAL_TRANSCRIPT_DOGFOOD_DOC_PATH =
  "docs/PERSPECTIVE_CODEX_FORMER_MANUAL_COPY_REAL_TRANSCRIPT_DOGFOOD_V0_1.md";
export const MANUAL_COPY_REAL_TRANSCRIPT_DOGFOOD_RECOMMENDED_NEXT_PR =
  "Refine Codex former draft schema alignment from captured transcript findings";

export const REAL_TRANSCRIPT_SOURCE_FORMER_INPUT_PACKET_ID =
  "codex-perspective-former-input:v0.1:project-augnes-ag-real-codex-former-transcript-c:59vyju";
export const REAL_TRANSCRIPT_SOURCE_MANUAL_COPY_PACKET_ID =
  "manual-codex-former-copy:v0.1:4wl862";
export const REAL_TRANSCRIPT_SOURCE_PROMPT_HASH =
  "35ab4e77f689514ac22ca098111f6cf7553d6bf1cf3a733c30f67572f403ca17";

const browserComputerUseValidationNote =
  "Not run: browser/computer-use validation not required because transcript was manually supplied as bounded sanitized text and this PR adds no UI, route, browser-visible surface, clipboard automation, or interactive copy control.";

const authorityBoundary =
  "This PR is a pure local real transcript dogfood/report/smoke slice. It does not call Codex from implementation, execute Codex from Augnes, call the Codex SDK, call OpenAI/provider/model APIs from implementation, call GitHub APIs from implementation, use network access in implementation behavior, write DB state, add runtime routes, add UI, add clipboard automation, create proof/evidence/readiness records, approve, merge, publish, retry, replay, deploy, or make Core decisions.";

const realTranscriptChangedFiles = [
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

export const CAPTURED_REAL_CODEX_RESPONSE = {
  draft_version: "codex_perspective_candidate_draft.v0.1",
  draft_kind: "codex_perspective_candidate_draft",
  source_former_input_packet: {
    packet_version: "codex_perspective_former_input_packet.v0.1",
    packet_id: REAL_TRANSCRIPT_SOURCE_FORMER_INPUT_PACKET_ID,
    role: "codex_perspective_former",
  },
  thesis:
    "The useful neutral perspective is that the PR sequence appears to have narrowed the Codex Former workflow into a deliberately manual, bounded, non-mutating transcript-capture path, but the work remains in a needs-review state because the central real-human-started Codex transcript has not yet been captured. This is useful beyond a plain PR summary because it identifies the main validation boundary: the prompt, harness, and capture instructions can be reviewed for authority and privacy discipline, while the actual dogfood value still depends on the next smallest work item, which is obtaining and validating one bounded real transcript rather than expanding the pipeline.",
  selected_material: {
    plain_summary_facts: [
      "PR #480 added the Manual Codex Former Draft Copy Packet.",
      "PR #481 added the transcript dogfood harness and remained blocked without a real transcript.",
      "PR #482 added real transcript capture instructions.",
      "The packet reports readiness as needs_review because unresolved gaps remain.",
      "The packet reports multiple local validation and smoke checks as passed for prompt contract, manual copy packet, transcript dogfood blocked behavior, former pipeline, worker guidance, candidate builder, pipeline dogfood, capture instructions, typecheck, and diff checks.",
      "The packet reports the real Codex transcript check as skipped because no bounded real human-started Codex response transcript has been captured yet.",
    ],
    neutral_perspective_basis: [
      "The work is strongest as a boundary-setting and capture-preparation slice, not as completed real transcript validation.",
      "The repeated authority, privacy, and pointer-only constraints are themselves part of the review value because they reduce the chance that a manual transcript step is mistaken for accepted Augnes state.",
      "The unresolved transcript gap is not incidental; it is the condition that separates reviewable scaffolding from honest dogfood of a real Codex response.",
    ],
    source_pr_refs: [
      "pr:hynk-studio/augnes#482",
      "pr:hynk-studio/augnes#481",
      "pr:hynk-studio/augnes#480",
    ],
    changed_file_paths: realTranscriptChangedFiles,
  },
  evidence_pointer_refs: [
    {
      ref: "evidence:row:real-transcript-capture-instructions",
      ref_type: "evidence_row_ref",
      pointer_only: true,
    },
    {
      ref: "work:event:manual-copy-real-transcript-capture-prompt",
      ref_type: "work_event_ref",
      pointer_only: true,
    },
    {
      ref: "perspective:codex-former-manual-copy-packet:v0.1",
      ref_type: "perspective_ref",
      pointer_only: true,
    },
    {
      ref: "perspective:codex-former-manual-copy-transcript-dogfood:v0.1",
      ref_type: "perspective_ref",
      pointer_only: true,
    },
    {
      ref: "perspective:codex-former-real-transcript-capture-instructions:v0.1",
      ref_type: "perspective_ref",
      pointer_only: true,
    },
  ],
  unresolved_tensions: [
    {
      id: "bounded-real-transcript-required",
      summary:
        "The packet prepares the manual prompt and validation path, but no bounded real human-started Codex response transcript has been captured yet.",
      why_it_matters:
        "Without the real transcript, the workflow can be reviewed for boundary discipline but cannot honestly complete real transcript dogfood.",
    },
    {
      id: "reviewable-scaffold-vs-validated-transcript",
      summary:
        "The reported checks support the scaffold and blocked behavior, while the most important live input remains absent.",
      why_it_matters:
        "Reviewers should avoid treating preparation artifacts as accepted state or readiness evidence for the real transcript itself.",
    },
  ],
  basis_quality_suggestion: {
    status: "needs_review",
    reasons: [
      "The packet itself marks readiness as needs_review.",
      "An unresolved bounded-real-transcript-required gap remains.",
      "The real Codex transcript check was skipped because no bounded real human-started Codex response transcript has been captured.",
      "The available material supports a neutral draft about validation boundaries and next action, but not a sufficient-for-review readiness claim.",
    ],
  },
  next_action_candidates: [
    {
      id: "capture-one-bounded-real-transcript",
      summary:
        "Have a human start the intended Codex session, paste the manual packet, capture exactly one bounded response transcript, and then run the local validation path against the same former input packet.",
      why_next:
        "This directly resolves the central gap without widening authority, adding automation, or mutating GitHub.",
    },
    {
      id: "validate-returned-draft-locally",
      summary:
        "Run validateAndNormalizeCodexPerspectiveCandidateDraft with the same former input packet before treating this draft as accepted review material.",
      why_next: "The draft is not accepted state before local validation.",
    },
  ],
  user_core_decision_questions: [
    {
      id: "continue_after_real_transcript_validation",
      question:
        "After a bounded real transcript is captured and locally validated, should the work continue toward reviewed candidate material or stop at capture evidence?",
    },
    {
      id: "review_threshold",
      question:
        "Is one bounded human-started Codex transcript sufficient for the next review step, or does Core want more than one transcript before changing basis quality?",
    },
  ],
  qualification_notes: [
    "This draft uses only the bounded packet summary and pointer-only refs provided in the former input packet.",
    "This draft does not include raw diffs, raw transcript material, raw review data, hidden reasoning, provider material, token material, billing material, credentials, or sensitive values.",
    "The packet reports several checks as passed, but those summaries do not remove the unresolved real-transcript gap.",
    "The browser/computer-use capture check was skipped because the packet states that no UI, route, browser-visible surface, clipboard automation, or interactive copy control was added.",
    "The perspective is useful because it distinguishes boundary-ready manual scaffolding from still-missing real transcript dogfood.",
  ],
  privacy_flags: {
    raw_diffs_included: false,
    raw_review_material_included: false,
    raw_source_material_included: false,
    private_material_included: false,
    provider_material_included: false,
    token_material_included: false,
    billing_material_included: false,
    api_credentials_included: false,
    hidden_reasoning_included: false,
    unsafe_input_material_omitted: false,
    omitted_unsafe_field_count: 0,
  },
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
    calls_codex_sdk: false,
    calls_provider_model_api: false,
    makes_core_decision: false,
  },
  forbidden_actions: [
    "Do not create proof, evidence, readiness records, or accepted Augnes state.",
    "Do not approve, merge, publish, retry, replay, deploy, or mutate GitHub.",
    "Do not execute Codex, call the Codex SDK, or call provider/model/API services.",
    "Do not make Core decisions.",
    "Do not reconstruct omitted unsafe material.",
    "Do not treat this draft as accepted state before local validation.",
  ],
};

export function buildPerspectiveCodexFormerManualCopyRealTranscriptDogfood() {
  const context = buildPipelineContext();
  const realTranscriptScenario =
    buildCapturedRealTranscriptMainScenario(context);
  const extractionFailureScenario =
    buildTranscriptExtractionFailureControlScenario(context);
  const badResponseRegressionScenario =
    buildBadResponseRegressionControlScenario(context);
  const downstreamGuidanceScenario = buildDownstreamGuidanceFromRealScenario(
    realTranscriptScenario,
  );
  const scenarios = [
    realTranscriptScenario,
    extractionFailureScenario,
    badResponseRegressionScenario,
    downstreamGuidanceScenario,
  ];
  const evaluation = evaluateRealTranscriptDogfood({
    context,
    scenarios,
  });
  const artifact = renderArtifact({ context, evaluation, scenarios });

  return {
    artifact,
    context: summarizeContext(context),
    evaluation,
    scenarios,
    paths: {
      artifact: MANUAL_COPY_REAL_TRANSCRIPT_DOGFOOD_ARTIFACT_PATH,
      doc: MANUAL_COPY_REAL_TRANSCRIPT_DOGFOOD_DOC_PATH,
    },
  };
}

export function runPerspectiveCodexFormerManualCopyRealTranscriptDogfood() {
  const dogfood =
    buildPerspectiveCodexFormerManualCopyRealTranscriptDogfood();
  writeReportFile(dogfood.paths.artifact, dogfood.artifact);
  console.log(`wrote ${dogfood.paths.artifact}`);
  return dogfood;
}

export function deriveRealTranscriptDogfoodConclusion(scenarios) {
  const mainScenario = scenarios.find(
    (scenario) => scenario.scenario_id === "captured_real_transcript_main",
  );
  const controlsBlocked = scenarios.some(
    (scenario) =>
      scenario.scenario_id !== "captured_real_transcript_main" &&
      scenario.conclusion === "BLOCKED",
  );

  if (!mainScenario || controlsBlocked) return "BLOCKED";
  if (mainScenario.extraction.extraction_status !== "extracted") {
    return "BLOCKED";
  }
  if (mainScenario.validation_result?.threw === true) return "BLOCKED";
  if (mainScenario.validation_result?.status === "blocked") return "BLOCKED";
  if (mainScenario.contract_fit?.status !== "fits_contract") {
    return "PASS with follow-up";
  }
  if (!mainScenario.candidate_review_material) return "PASS with follow-up";
  if (mainScenario.worker_guidance?.advisory_only !== true) return "BLOCKED";

  return "PASS";
}

export function extractCodexPerspectiveCandidateDraftFromTranscript(
  transcript,
) {
  if (!transcript?.transcript_available) {
    return {
      extraction_status: "blocked",
      extracted_candidate_count: 0,
      draft: null,
      blocked_reasons: ["real Codex response transcript was not supplied"],
    };
  }

  if (transcript.extracted_codex_perspective_candidate_draft) {
    return {
      extraction_status: "extracted",
      extracted_candidate_count: 1,
      draft: transcript.extracted_codex_perspective_candidate_draft,
      blocked_reasons: [],
    };
  }

  const extractedJsonText = transcript.extracted_json_text ?? null;
  if (!extractedJsonText) {
    return {
      extraction_status: "blocked",
      extracted_candidate_count: 0,
      draft: null,
      blocked_reasons: [
        "transcript does not include extracted CodexPerspectiveCandidateDraft JSON",
      ],
    };
  }

  try {
    return {
      extraction_status: "extracted",
      extracted_candidate_count: 1,
      draft: JSON.parse(extractedJsonText),
      blocked_reasons: [],
    };
  } catch {
    return {
      extraction_status: "blocked",
      extracted_candidate_count: 0,
      draft: null,
      blocked_reasons: ["transcript extracted JSON could not be parsed"],
    };
  }
}

function buildPipelineContext() {
  const formationInputBundle = buildPerspectiveFormationInputBundle({
    generated_at: MANUAL_COPY_REAL_TRANSCRIPT_DOGFOOD_GENERATED_AT,
    scope: "project:augnes",
    work_id: "project-augnes-ag-real-codex-former-transcript-c",
    source_pr_refs: [
      "pr:hynk-studio/augnes#482",
      "pr:hynk-studio/augnes#481",
      "pr:hynk-studio/augnes#480",
    ],
    changed_files: realTranscriptChangedFiles,
    changed_files_summary:
      "PR #480 added the manual copy packet, PR #481 added blocked transcript dogfood, and PR #482 added real transcript capture instructions.",
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
        result_summary: "Prompt contract smoke passed.",
      },
      {
        check_id: "check:manual-copy-packet",
        command: "npm run smoke:perspective-codex-former-manual-copy-packet",
        status: "passed",
        result_summary: "Manual copy packet smoke passed.",
      },
      {
        check_id: "check:manual-copy-transcript-blocked",
        command: "npm run smoke:perspective-codex-former-manual-copy-transcript",
        status: "passed",
        result_summary:
          "Manual copy transcript dogfood harness passed its blocked-without-real-transcript behavior.",
      },
      {
        check_id: "check:former-pipeline",
        command: "npm run smoke:perspective-codex-former-pipeline",
        status: "passed",
        result_summary: "Former pipeline smoke passed.",
      },
      {
        check_id: "check:worker-guidance",
        command: "npm run smoke:perspective-worker-facing-guidance",
        status: "passed",
        result_summary: "Worker-facing guidance smoke passed.",
      },
      {
        check_id: "check:candidate-builder",
        command: "npm run smoke:perspective-candidate-builder-fixture",
        status: "passed",
        result_summary: "Candidate builder fixture smoke passed.",
      },
      {
        check_id: "check:pipeline-dogfood",
        command: "npm run smoke:perspective-codex-former-pipeline-dogfood",
        status: "passed",
        result_summary: "Pipeline dogfood smoke passed.",
      },
      {
        check_id: "check:real-transcript-capture-instructions",
        command:
          "npm run smoke:perspective-codex-former-real-transcript-capture-instructions",
        status: "passed",
        result_summary: "Real transcript capture instructions smoke passed.",
      },
      {
        check_id: "check:diff-check",
        command: "git diff --check",
        status: "passed",
        result_summary: "No whitespace errors were reported.",
      },
    ],
    skipped_checks: [
      {
        check_id: "check:real-codex-transcript",
        skipped_reason:
          "The source packet predates this supplied bounded transcript and reported that no real human-started Codex response transcript had been captured yet.",
        result_summary:
          "The supplied transcript is used here to dogfood that prior gap without changing the source packet's historical readiness basis.",
      },
    ],
    unresolved_gaps: [
      {
        gap_id: "gap:bounded-real-transcript-required",
        summary:
          "The source packet needed one bounded real human-started Codex response transcript before candidate-compatible review material could be claimed.",
      },
      {
        gap_id: "gap:reviewable-scaffold-vs-validated-transcript",
        summary:
          "Preparation artifacts are reviewable scaffolding, not accepted real-transcript validation output.",
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
      "Pure local real transcript dogfood/report/smoke slice only.",
      "No Codex call, SDK call, provider/model call, GitHub mutation, UI, DB write, proof/evidence/readiness write, approval, merge, or Core decision.",
    ],
    source_privacy_redaction_notes: [
      "Only bounded PR summary facts, pointer refs, and the supplied candidate draft JSON are used.",
      "No raw page, browser, account, provider, credential, or unrelated chat material is included.",
    ],
  });
  const generatedPacket =
    buildCodexPerspectiveFormerInputPacket(formationInputBundle);
  const formerInputPacket = overrideFormerInputPacketId({
    packet: generatedPacket,
    packetId: REAL_TRANSCRIPT_SOURCE_FORMER_INPUT_PACKET_ID,
  });
  const promptContract =
    buildCodexPerspectiveFormerDraftPromptContractFromInputPacket(
      formerInputPacket,
    );
  const manualCopyPacket =
    buildManualCodexPerspectiveFormerDraftCopyPacket({
      former_input_packet: formerInputPacket,
      prompt_contract: promptContract,
      manual_context: {
        reviewer_label: "manual transcript reviewer",
        intended_codex_surface: "human-started Codex session",
        usage_notes: [
          "A bounded sanitized real Codex response transcript was supplied manually.",
          "The transcript fixture includes only the returned candidate draft JSON.",
        ],
      },
      expected_validation_commands: [
        "npm run dogfood:perspective-codex-former-manual-copy-real-transcript",
        "npm run smoke:perspective-codex-former-manual-copy-real-transcript",
        "npm run smoke:perspective-codex-former-real-transcript-capture-instructions",
      ],
      generated_at: MANUAL_COPY_REAL_TRANSCRIPT_DOGFOOD_GENERATED_AT,
    });

  return {
    formationInputBundle,
    formerInputPacket,
    generatedPacketId: generatedPacket.packet_id,
    promptContract,
    manualCopyPacket,
    manualCopyPacketIdMatchesTranscript:
      manualCopyPacket.packet_id === REAL_TRANSCRIPT_SOURCE_MANUAL_COPY_PACKET_ID,
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

function buildCapturedRealTranscriptMainScenario(context) {
  const transcript = {
    transcript_kind: "manual_codex_former_response_transcript",
    transcript_version: "manual_codex_former_response_transcript.v0.1",
    transcript_available: true,
    fixture_source: "real_human_started_codex_response",
    capture_method: "human_manual",
    source_manual_copy_packet_id: REAL_TRANSCRIPT_SOURCE_MANUAL_COPY_PACKET_ID,
    source_former_input_packet_id: REAL_TRANSCRIPT_SOURCE_FORMER_INPUT_PACKET_ID,
    source_prompt_hash: REAL_TRANSCRIPT_SOURCE_PROMPT_HASH,
    captured_by: "human_manual",
    captured_at: "unknown",
    codex_surface_label: "unknown",
    prompt_was_generated_by_manual_copy_packet: true,
    response_text_included: false,
    extracted_json_text: null,
    extracted_codex_perspective_candidate_draft: CAPTURED_REAL_CODEX_RESPONSE,
    transcript_redaction_notes: [
      "Included only the returned CodexPerspectiveCandidateDraft JSON.",
      "No hidden reasoning, cookies, tokens, account data, provider logs, raw page dumps, raw PR diffs, raw review payloads, unrelated chat text, or credential material included.",
    ],
    privacy_flags: {
      bounded_response_json_only: true,
      raw_page_or_browser_material_included: false,
      private_account_material_included: false,
      provider_logs_included: false,
    },
    authority_flags: buildFalseAuthorityFlags(),
  };
  const extraction = extractCodexPerspectiveCandidateDraftFromTranscript(
    transcript,
  );
  const contractFit =
    extraction.extraction_status === "extracted"
      ? evaluateCodexPerspectiveCandidateDraftPromptContractFit({
          former_input_packet: context.formerInputPacket,
          draft: extraction.draft,
        })
      : null;
  const validationResult =
    extraction.extraction_status === "extracted"
      ? safelyValidateDraft({
          former_input_packet: context.formerInputPacket,
          draft: extraction.draft,
        })
      : null;
  const candidateReviewMaterial =
    validationResult && validationResult.status !== "threw"
      ? validationResult.candidate_review_material
      : null;
  const usefulness = evaluateContentUsefulness(extraction.draft);
  const schemaFindings = buildSchemaFindings({
    contractFit,
    validationResult,
  });

  return {
    scenario_id: "captured_real_transcript_main",
    title: "Captured Real Transcript Main",
    fixture_label: "real_human_started_codex_response",
    transcript_provenance: summarizeTranscript(transcript),
    manual_copy_packet: summarizeManualCopyPacket(context.manualCopyPacket),
    extraction,
    content_usefulness: usefulness,
    contract_fit: contractFit ? summarizeContractFit(contractFit) : null,
    strict_schema_compatibility: schemaFindings,
    validation_result: validationResult
      ? summarizeValidationResult(validationResult)
      : null,
    candidate_review_material: candidateReviewMaterial
      ? summarizeCandidate(candidateReviewMaterial)
      : null,
    worker_guidance: null,
    guidance_input_shape: null,
    conclusion:
      extraction.extraction_status !== "extracted" ||
      validationResult?.status === "threw" ||
      validationResult?.status === "blocked"
        ? "BLOCKED"
        : contractFit?.status !== "fits_contract"
          ? "PASS with follow-up"
          : "PASS",
    blocked_reasons: buildMainScenarioBlockedReasons({
      extraction,
      validationResult,
    }),
    dogfood_notes: [
      "The real transcript is preserved as bounded sanitized material and labeled real_human_started_codex_response.",
      "Exactly one CodexPerspectiveCandidateDraft JSON object was extracted from the supplied material.",
      "The draft adds useful neutral perspective beyond a plain summary.",
      "Strict local validation blocks candidate-compatible review material because the returned draft shape does not match the current local schema.",
      "The finding is treated as real model-output contract drift, not as a fabricated implementation failure.",
    ],
  };
}

function buildTranscriptExtractionFailureControlScenario(context) {
  const transcript = {
    transcript_kind: "manual_codex_former_response_transcript",
    transcript_version: "manual_codex_former_response_transcript.v0.1",
    transcript_available: true,
    fixture_source: "synthetic_extraction_failure_control",
    capture_method: "synthetic_control",
    source_manual_copy_packet_id: context.manualCopyPacket.packet_id,
    source_former_input_packet_id: context.formerInputPacket.packet_id,
    source_prompt_hash: "synthetic-control",
    captured_by: "synthetic_control",
    captured_at: MANUAL_COPY_REAL_TRANSCRIPT_DOGFOOD_GENERATED_AT,
    codex_surface_label: "synthetic extraction failure control",
    prompt_was_generated_by_manual_copy_packet: true,
    response_text_included: true,
    extracted_json_text: null,
    extracted_codex_perspective_candidate_draft: null,
    transcript_redaction_notes: [
      "Synthetic control includes no private account, browser, provider, credential, or raw page material.",
    ],
    privacy_flags: {
      bounded_response_json_only: false,
      raw_page_or_browser_material_included: false,
      private_account_material_included: false,
      provider_logs_included: false,
    },
    authority_flags: buildFalseAuthorityFlags(),
  };
  const extraction = extractCodexPerspectiveCandidateDraftFromTranscript(
    transcript,
  );
  const passed = extraction.extraction_status === "blocked";

  return {
    scenario_id: "transcript_extraction_failure_control",
    title: "Transcript Extraction Failure Control",
    fixture_label: "synthetic negative control",
    transcript_provenance: summarizeTranscript(transcript),
    manual_copy_packet: summarizeManualCopyPacket(context.manualCopyPacket),
    extraction,
    content_usefulness: null,
    contract_fit: null,
    strict_schema_compatibility: null,
    validation_result: null,
    candidate_review_material: null,
    worker_guidance: null,
    guidance_input_shape: null,
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : ["synthetic extraction failure control unexpectedly extracted a draft"],
    dogfood_notes: [
      "Synthetic control with no parseable candidate draft fails closed.",
      "No candidate-compatible review material is produced from this control.",
    ],
  };
}

function buildBadResponseRegressionControlScenario(context) {
  const badDraft = {
    draft_version: "codex_perspective_candidate_draft.v0.1",
    draft_kind: "codex_perspective_candidate_draft",
    source_former_input_packet: {
      packet_version: context.formerInputPacket.packet_version,
      packet_id: context.formerInputPacket.packet_id,
      role: context.formerInputPacket.role,
    },
    thesis: "PR #482 added transcript capture instructions.",
    selected_material: {
      plain_summary_facts: ["PR #482 exists."],
    },
    evidence_pointer_refs: [
      {
        ref: "evidence:row:not-present",
        ref_type: "evidence_row_ref",
        pointer_only: false,
      },
    ],
    unresolved_tensions: "not-an-array",
    basis_quality_suggestion: {
      status: "sufficient_for_review",
      reasons: ["ready for merge"],
    },
    next_action_candidates: [
      {
        action_id: "review_candidate",
        summary: "Treat this as reviewed.",
      },
    ],
    user_core_decision_questions: [],
    qualification_notes: [],
    privacy_flags: {
      raw_payloads_included: true,
    },
    authority_flags: {
      ...buildFalseAuthorityFlags(),
      merge_publish_approval: true,
    },
    forbidden_actions: ["may merge"],
  };
  const transcript = {
    transcript_kind: "manual_codex_former_response_transcript",
    transcript_version: "manual_codex_former_response_transcript.v0.1",
    transcript_available: true,
    fixture_source: "synthetic_bad_response_control",
    capture_method: "synthetic_control",
    source_manual_copy_packet_id: context.manualCopyPacket.packet_id,
    source_former_input_packet_id: context.formerInputPacket.packet_id,
    source_prompt_hash: "synthetic-control",
    captured_by: "synthetic_control",
    captured_at: MANUAL_COPY_REAL_TRANSCRIPT_DOGFOOD_GENERATED_AT,
    codex_surface_label: "synthetic bad response control",
    prompt_was_generated_by_manual_copy_packet: true,
    response_text_included: false,
    extracted_json_text: null,
    extracted_codex_perspective_candidate_draft: badDraft,
    transcript_redaction_notes: [
      "Synthetic control includes malformed draft fields for regression coverage only.",
    ],
    privacy_flags: {
      bounded_response_json_only: true,
      raw_page_or_browser_material_included: false,
      private_account_material_included: false,
      provider_logs_included: false,
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
  const validationResult = safelyValidateDraft({
    former_input_packet: context.formerInputPacket,
    draft: extraction.draft,
  });
  const passed =
    extraction.extraction_status === "extracted" &&
    contractFit.status === "violates_contract" &&
    validationResult.status === "blocked" &&
    validationResult.candidate_review_material === null;

  return {
    scenario_id: "bad_response_regression_control",
    title: "Bad Response Regression Control",
    fixture_label: "synthetic bad response control",
    transcript_provenance: summarizeTranscript(transcript),
    manual_copy_packet: summarizeManualCopyPacket(context.manualCopyPacket),
    extraction,
    content_usefulness: {
      adds_neutral_perspective_beyond_plain_summary: false,
      reasons: ["Synthetic bad response is intentionally plain and malformed."],
    },
    contract_fit: summarizeContractFit(contractFit),
    strict_schema_compatibility: buildSchemaFindings({
      contractFit,
      validationResult,
    }),
    validation_result: summarizeValidationResult(validationResult),
    candidate_review_material: null,
    worker_guidance: null,
    guidance_input_shape: null,
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : ["bad response regression control did not fail closed"],
    dogfood_notes: [
      "Synthetic bad response control is not a claimed real transcript.",
      "Contract fit and local validation block malformed, overconfident, and authority-claiming material.",
    ],
  };
}

function buildDownstreamGuidanceFromRealScenario(realTranscriptScenario) {
  if (!realTranscriptScenario.candidate_review_material) {
    const validationStatus =
      realTranscriptScenario.validation_result?.status ?? "not evaluated";
    const concreteReason =
      realTranscriptScenario.validation_result?.blocked_reasons?.[0] ??
      "real transcript did not produce candidate-compatible review material";

    return {
      scenario_id: "downstream_guidance_from_real_transcript",
      title: "Downstream Guidance From Real Transcript",
      fixture_label: "skipped because local validation blocked",
      transcript_provenance: realTranscriptScenario.transcript_provenance,
      manual_copy_packet: realTranscriptScenario.manual_copy_packet,
      extraction: realTranscriptScenario.extraction,
      content_usefulness: realTranscriptScenario.content_usefulness,
      contract_fit: realTranscriptScenario.contract_fit,
      strict_schema_compatibility:
        realTranscriptScenario.strict_schema_compatibility,
      validation_result: realTranscriptScenario.validation_result,
      candidate_review_material: null,
      worker_guidance: null,
      guidance_input_shape: {
        candidate_present: false,
        guidance_context_present: false,
        guidance_context_bounded: true,
        guidance_context_authoritative: false,
      },
      conclusion: "PASS with follow-up",
      blocked_reasons: [],
      dogfood_notes: [
        `Skipped because validation status was ${validationStatus}.`,
        `Concrete skip reason: ${concreteReason}.`,
        "Skipped downstream guidance does not count as real-transcript usefulness success.",
      ],
    };
  }

  const guidanceInput = {
    candidate: realTranscriptScenario.validation_result.candidate_review_material,
    guidance_context: {
      work_goal:
        "Evaluate bounded real transcript dogfood findings for advisory next-step planning only.",
      bounded_summary:
        "The real transcript is local, sanitized, non-committed, and non-authoritative.",
    },
  };
  const guidance =
    buildWorkerFacingPerspectiveGuidanceFromCandidate(guidanceInput);
  const guidanceSummary = summarizeWorkerGuidance(guidance);
  const passed =
    guidanceSummary.advisory_only === true &&
    guidanceSummary.next_action_count > 0 &&
    allAuthorityFlagsFalse(guidance.authority_flags);

  return {
    scenario_id: "downstream_guidance_from_real_transcript",
    title: "Downstream Guidance From Real Transcript",
    fixture_label: "real transcript candidate guidance",
    transcript_provenance: realTranscriptScenario.transcript_provenance,
    manual_copy_packet: realTranscriptScenario.manual_copy_packet,
    extraction: realTranscriptScenario.extraction,
    content_usefulness: realTranscriptScenario.content_usefulness,
    contract_fit: realTranscriptScenario.contract_fit,
    strict_schema_compatibility:
      realTranscriptScenario.strict_schema_compatibility,
    validation_result: realTranscriptScenario.validation_result,
    candidate_review_material: realTranscriptScenario.candidate_review_material,
    worker_guidance: guidanceSummary,
    guidance_input_shape: {
      candidate_present: true,
      guidance_context_present: true,
      guidance_context_bounded: true,
      guidance_context_authoritative: false,
    },
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : ["downstream guidance did not remain advisory-only"],
    dogfood_notes: [
      "Guidance ran only after candidate-compatible review material existed.",
      "Guidance remains advisory-only and false-authority.",
    ],
  };
}

function evaluateRealTranscriptDogfood({ context, scenarios }) {
  const mainScenario = requireScenario(
    scenarios,
    "captured_real_transcript_main",
  );
  const downstreamScenario = requireScenario(
    scenarios,
    "downstream_guidance_from_real_transcript",
  );

  return {
    conclusion: deriveRealTranscriptDogfoodConclusion(scenarios),
    recommended_next_pr_title:
      MANUAL_COPY_REAL_TRANSCRIPT_DOGFOOD_RECOMMENDED_NEXT_PR,
    scenario_conclusions: scenarios.map((scenario) => ({
      scenario_id: scenario.scenario_id,
      conclusion: scenario.conclusion,
    })),
    real_transcript_available:
      mainScenario.transcript_provenance.transcript_available === true,
    real_transcript_fixture_label: mainScenario.fixture_label,
    manual_copy_packet_id_matches_transcript:
      context.manualCopyPacketIdMatchesTranscript,
    browser_computer_use_validation: browserComputerUseValidationNote,
    answered_questions: {
      was_captured_real_transcript_supplied:
        "Yes. One bounded sanitized real human-started Codex response was supplied.",
      how_was_it_captured:
        "capture_method=human_manual; captured_at and surface label are unknown.",
      was_browser_computer_use_used:
        "No. Browser/computer-use validation was not run because no UI, route, browser-visible surface, clipboard automation, or interactive copy control was added.",
      what_was_redacted:
        "Only the returned candidate draft JSON was included; hidden reasoning, browser/account material, provider logs, raw page dumps, raw PR diffs, raw review payloads, unrelated chat text, and credential material were not included.",
      did_prompt_come_from_manual_copy_packet:
        "Yes. The transcript provenance says the prompt was generated by the Manual Copy Packet and preserves the source manual copy packet id and prompt hash.",
      could_exactly_one_candidate_draft_be_extracted:
        mainScenario.extraction.extraction_status === "extracted"
          ? "Yes. Exactly one CodexPerspectiveCandidateDraft JSON object was extracted."
          : "No. Extraction blocked.",
      did_draft_fit_prompt_contract:
        `${mainScenario.contract_fit?.status ?? "not evaluated"}. Contract fit flags pointer schema and authority flag naming drift.`,
      did_local_validation_produce_candidate_material:
        mainScenario.candidate_review_material
          ? "Yes. Candidate-compatible review material was produced."
          : "No. Local validation blocked candidate-compatible review material.",
      did_candidate_add_neutral_perspective:
        mainScenario.content_usefulness
          .adds_neutral_perspective_beyond_plain_summary
          ? "Yes. It identifies the validation boundary and distinguishes scaffold readiness from real transcript dogfood."
          : "No.",
      did_it_preserve_pointer_only_refs_or_reveal_pointer_schema_drift:
        "It preserves pointer-only intent, but uses ref_type/pointer_only instead of pointer_kind/pointer_semantics, so local contract fit records pointer schema drift.",
      did_it_avoid_unsafe_material:
        "Yes. No unsafe raw/private/provider/token/billing/credential material is included in the bounded draft.",
      did_it_avoid_authority_claims_or_reveal_authority_schema_drift:
        "It avoids true authority claims, but uses model-friendly false authority flag names instead of the validator's expected false-authority keys.",
      did_downstream_worker_guidance_run:
        downstreamScenario.worker_guidance
          ? "Yes. Worker-Facing Guidance ran and remained advisory-only."
          : "No. It was skipped because local validation did not produce candidate-compatible review material.",
      what_should_be_refined_next:
        MANUAL_COPY_REAL_TRANSCRIPT_DOGFOOD_RECOMMENDED_NEXT_PR,
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

function evaluateContentUsefulness(draft) {
  const selectedMaterial = draft?.selected_material ?? {};
  const neutralBasis = Array.isArray(selectedMaterial.neutral_perspective_basis)
    ? selectedMaterial.neutral_perspective_basis
    : [];
  const thesis = typeof draft?.thesis === "string" ? draft.thesis : "";
  const addsNeutralPerspective =
    thesis.includes("validation boundary") &&
    thesis.includes("beyond a plain PR summary") &&
    neutralBasis.length > 0;

  return {
    adds_neutral_perspective_beyond_plain_summary: addsNeutralPerspective,
    reasons: addsNeutralPerspective
      ? [
          "The thesis names a validation boundary rather than only listing PR facts.",
          "The selected material separates plain summary facts from neutral perspective basis.",
          "The draft identifies why the unresolved transcript gap matters.",
        ]
      : ["The draft did not clearly separate neutral perspective from summary."],
  };
}

function buildSchemaFindings({ contractFit, validationResult }) {
  const contractWarnings = contractFit?.warnings ?? [];
  const validationReasons = validationResult?.blocked_reasons ?? [];
  const findings = [];

  if (
    contractWarnings.some((warning) => warning.warning_kind === "pointer_ref")
  ) {
    findings.push(
      "pointer refs use ref_type/pointer_only instead of pointer_kind/pointer_semantics",
    );
  }
  if (
    contractWarnings.some(
      (warning) => warning.warning_kind === "authority_claim",
    )
  ) {
    findings.push(
      "authority flags use model-friendly false names instead of the validator's expected false-authority keys",
    );
  }
  if (
    validationReasons.some((reason) =>
      reason.includes("selected_material.changed_files"),
    )
  ) {
    findings.push(
      "selected_material uses changed_file_paths/plain_summary_facts instead of changed_files/changed_files_summary/work_id/source_pr_refs",
    );
  }

  return {
    status:
      validationResult?.status === "blocked" || contractFit?.status !== "fits_contract"
        ? "drift_found"
        : "compatible",
    findings,
  };
}

function buildMainScenarioBlockedReasons({ extraction, validationResult }) {
  if (extraction.extraction_status !== "extracted") {
    return [...extraction.blocked_reasons];
  }
  if (!validationResult) return ["local validation was not evaluated"];
  if (validationResult.status === "threw") {
    return [...validationResult.blocked_reasons];
  }
  if (validationResult.status === "blocked") {
    return [...validationResult.blocked_reasons];
  }

  return [];
}

function renderArtifact({ context, evaluation, scenarios }) {
  const mainScenario = requireScenario(
    scenarios,
    "captured_real_transcript_main",
  );
  const downstreamScenario = requireScenario(
    scenarios,
    "downstream_guidance_from_real_transcript",
  );
  const lines = [
    "# Perspective Codex Former Manual Copy Real Transcript Dogfood",
    "",
    `Generated at: ${MANUAL_COPY_REAL_TRANSCRIPT_DOGFOOD_GENERATED_AT}`,
    `Conclusion: ${evaluation.conclusion}`,
    `Recommended next implementation PR title: ${evaluation.recommended_next_pr_title}`,
    "",
    "## Summary",
    "",
    "This deterministic local dogfood harness follows merged PR #482 and evaluates the supplied bounded real human-started Codex response transcript as the main fixture.",
    "The real transcript extracts exactly one CodexPerspectiveCandidateDraft and adds useful neutral perspective beyond a plain summary.",
    "Strict local validation does not produce candidate-compatible review material because the returned draft reveals schema drift in selected material, pointer refs, and false-authority flag names.",
    "",
    "## Why This Follows PR #482",
    "",
    "PR #482 prepared real transcript capture instructions after PR #481 remained blocked without a captured real transcript. This PR uses the supplied human-manual transcript to dogfood that next step locally without adding runtime behavior.",
    "",
    "## Real Transcript Provenance",
    "",
    "- Captured real transcript supplied: Yes",
    "- Fixture label: real_human_started_codex_response",
    "- Capture method: human_manual",
    "- Captured at: unknown",
    "- Codex surface: unknown",
    `- Source manual copy packet: ${REAL_TRANSCRIPT_SOURCE_MANUAL_COPY_PACKET_ID}`,
    `- Source former input packet: ${REAL_TRANSCRIPT_SOURCE_FORMER_INPUT_PACKET_ID}`,
    `- Source prompt hash: ${REAL_TRANSCRIPT_SOURCE_PROMPT_HASH}`,
    `- Local manual copy packet id matches supplied provenance: ${context.manualCopyPacketIdMatchesTranscript ? "yes" : "no"}`,
    "- Prompt generated by Manual Copy Packet: yes",
    "",
    "## Browser/Computer-Use Validation",
    "",
    browserComputerUseValidationNote,
    "",
    "## Transcript Redaction And Privacy Notes",
    "",
    "- Included only the returned CodexPerspectiveCandidateDraft JSON.",
    "- No hidden reasoning, cookies, tokens, account data, provider logs, raw page dumps, raw PR diffs, raw review payloads, unrelated chat text, or credential material was included.",
    "- The response text is represented as extracted bounded JSON; no extra transcript, page, browser, or account material is included.",
    "",
    "## Dogfood Scenarios",
    "",
    ...scenarios.flatMap(renderScenario),
    "",
    "## Extraction Result",
    "",
    `Exactly one candidate draft extracted: ${mainScenario.extraction.extracted_candidate_count === 1 ? "yes" : "no"}`,
    `Extraction status: ${mainScenario.extraction.extraction_status}`,
    "",
    "## Contract-Fit Result",
    "",
    `Status: ${mainScenario.contract_fit?.status ?? "not evaluated"}`,
    ...formatWarningLines(mainScenario.contract_fit?.warnings ?? []),
    "",
    "## Local Validation Result",
    "",
    `Status: ${mainScenario.validation_result?.status ?? "not evaluated"}`,
    `Candidate-compatible review material produced: ${mainScenario.candidate_review_material ? "yes" : "no"}`,
    ...formatBlockedReasonLines(mainScenario.validation_result?.blocked_reasons ?? []),
    "",
    "## Downstream Guidance Result",
    "",
    downstreamScenario.worker_guidance
      ? "Worker-Facing Guidance ran and remained advisory-only."
      : "Worker-Facing Guidance was skipped because local validation blocked candidate-compatible review material.",
    ...formatList(downstreamScenario.dogfood_notes),
    "",
    "## Evaluation Conclusion",
    "",
    "BLOCKED with useful findings.",
    "The supplied transcript is real and useful, but strict local validation blocks it because the real model output does not align with the current local candidate draft schema. This should be handled by a follow-up schema-alignment or prompt-refinement PR, not by fabricating or pre-normalizing the transcript in this PR.",
    "",
    "## Files Changed",
    "",
    "- `scripts/dogfood-perspective-codex-former-manual-copy-real-transcript.mjs`",
    "- `scripts/smoke-perspective-codex-former-manual-copy-real-transcript.mjs`",
    "- `docs/PERSPECTIVE_CODEX_FORMER_MANUAL_COPY_REAL_TRANSCRIPT_DOGFOOD_V0_1.md`",
    "- `reports/dogfood/2026-06-09-perspective-codex-former-manual-copy-real-transcript.md`",
    "- `package.json`",
    "- exact neighboring Perspective smoke allowlists",
    "",
    "## Authority Boundary",
    "",
    authorityBoundary,
    "",
    "## Verification",
    "",
    "- npm run typecheck",
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
    "- git diff --check",
    "- git diff --cached --check",
    "",
    "## Skipped Checks With Concrete Reasons",
    "",
    `- Browser/computer-use validation: ${browserComputerUseValidationNote}`,
    "- DB validation: skipped because this PR adds no DB schema, persistence path, or state writer.",
    "- Provider/model validation: skipped because this PR intentionally does not call Codex, OpenAI, provider/model APIs, or SDKs.",
    "- Downstream Worker-Facing Guidance from the real transcript: skipped because local validation did not produce candidate-compatible review material.",
    "",
    "## What Codex Did Not Do",
    "",
    "Codex did not call Codex from implementation, execute Codex from Augnes, call the Codex SDK, call OpenAI/provider/model APIs from implementation, call GitHub APIs from implementation, use implementation network behavior, write DB state, add runtime routes, add UI, add clipboard automation, create proof/evidence/readiness records, approve, merge, publish, retry, replay, deploy, or make Core decisions.",
    "",
    "## What Should Be Refined Next",
    "",
    MANUAL_COPY_REAL_TRANSCRIPT_DOGFOOD_RECOMMENDED_NEXT_PR,
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
    `Capture method: ${scenario.transcript_provenance.capture_method ?? "not available"}`,
    `Prompt generated by manual copy packet: ${scenario.transcript_provenance.prompt_was_generated_by_manual_copy_packet ? "yes" : "no"}`,
    `Extraction status: ${scenario.extraction.extraction_status}`,
    `Extracted candidate count: ${scenario.extraction.extracted_candidate_count}`,
    `Content usefulness: ${scenario.content_usefulness?.adds_neutral_perspective_beyond_plain_summary === true ? "useful beyond plain summary" : "not evaluated or not useful"}`,
    `Contract fit: ${scenario.contract_fit?.status ?? "not evaluated"}`,
    `Strict schema compatibility: ${scenario.strict_schema_compatibility?.status ?? "not evaluated"}`,
    `Validation status: ${scenario.validation_result?.status ?? "not evaluated"}`,
    `Candidate material: ${scenario.candidate_review_material ? "present" : "none"}`,
    `Worker guidance: ${scenario.worker_guidance ? "present" : "none"}`,
    `Guidance advisory only: ${scenario.worker_guidance?.advisory_only === true ? "yes" : "not evaluated"}`,
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
    manual_copy_packet_id: context.manualCopyPacket.packet_id,
    manual_copy_packet_id_matches_transcript:
      context.manualCopyPacketIdMatchesTranscript,
    prompt_contract_source_packet_id:
      context.promptContract.source_former_input_packet.packet_id,
  };
}

function summarizeTranscript(transcript) {
  return {
    transcript_kind: transcript.transcript_kind,
    transcript_version: transcript.transcript_version,
    transcript_available: transcript.transcript_available,
    fixture_source: transcript.fixture_source,
    capture_method: transcript.capture_method,
    source_manual_copy_packet_id: transcript.source_manual_copy_packet_id,
    source_former_input_packet_id: transcript.source_former_input_packet_id,
    source_prompt_hash: transcript.source_prompt_hash,
    captured_by: transcript.captured_by,
    captured_at: transcript.captured_at,
    codex_surface_label: transcript.codex_surface_label,
    prompt_was_generated_by_manual_copy_packet:
      transcript.prompt_was_generated_by_manual_copy_packet,
    response_text_included: transcript.response_text_included,
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

function formatWarningLines(warnings) {
  if (warnings.length === 0) return ["- Warnings: none"];

  return warnings.map(
    (warning) =>
      `- ${warning.warning_kind} at ${warning.field}: ${warning.summary}`,
  );
}

function formatBlockedReasonLines(reasons) {
  if (reasons.length === 0) return ["- Blocked reasons: none"];

  return reasons.map((reason) => `- ${reason}`);
}

function formatList(values) {
  return values.map((value) => `- ${value}`);
}

function requireScenario(scenarios, scenarioId) {
  const scenario = scenarios.find(
    (candidate) => candidate.scenario_id === scenarioId,
  );
  if (!scenario) {
    throw new Error(`missing scenario ${scenarioId}`);
  }

  return scenario;
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
  runPerspectiveCodexFormerManualCopyRealTranscriptDogfood();
}
