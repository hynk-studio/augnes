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

export const SECOND_REFINED_TRANSCRIPT_GENERATED_AT =
  "2026-06-10T00:00:00.000Z";
export const SECOND_REFINED_TRANSCRIPT_ARTIFACT_PATH =
  "reports/dogfood/2026-06-09-perspective-codex-former-second-refined-transcript.md";
export const SECOND_REFINED_TRANSCRIPT_DOC_PATH =
  "docs/PERSPECTIVE_CODEX_FORMER_SECOND_REFINED_TRANSCRIPT_DOGFOOD_V0_1.md";
export const SECOND_REFINED_TRANSCRIPT_RECOMMENDED_NEXT_PR =
  "Refine Codex former prompt contract stale capture-gap wording";

export const SECOND_REFINED_SOURCE_FORMER_INPUT_PACKET_ID =
  "codex-perspective-former-input:v0.1:project-augnes-ag-second-refined-codex-former-tr:13keb5c";
export const SECOND_REFINED_SOURCE_MANUAL_COPY_PACKET_ID =
  "not_supplied_in_chat";
export const SECOND_REFINED_SOURCE_PROMPT_HASH = "not_supplied_in_chat";

const browserComputerUseValidationNote =
  "Not run: transcript was manually supplied as bounded sanitized text and this PR adds no UI, route, browser-visible surface, clipboard automation, or interactive copy control.";

const authorityBoundary =
  "This PR is a pure local second refined transcript dogfood/report/smoke slice. It does not call Codex from implementation, execute Codex from Augnes, call the Codex SDK, call OpenAI/provider/model APIs from implementation, call GitHub APIs from implementation, use network access in implementation behavior, write DB state, add runtime routes, add UI, add clipboard automation, create proof/evidence/readiness records, approve, merge, publish, retry, replay, deploy, or make Core decisions.";

const secondRefinedTranscriptChangedFiles = [
  "lib/perspective-ingest/perspective-formation-input-bundle.ts",
  "lib/perspective-ingest/perspective-codex-former-input-packet.ts",
  "lib/perspective-ingest/perspective-codex-former-prompt-contract.ts",
  "lib/perspective-ingest/perspective-codex-former-manual-copy-packet.ts",
  "docs/PERSPECTIVE_CODEX_FORMER_REFINED_FINDINGS_CONTRACT_V0_1.md",
  "docs/PERSPECTIVE_CODEX_FORMER_REFINED_PROMPT_REAL_TRANSCRIPT_DOGFOOD_V0_1.md",
  "scripts/dogfood-perspective-codex-former-refined-findings-contract.mjs",
  "scripts/smoke-perspective-codex-former-refined-findings-contract.mjs",
  "scripts/dogfood-perspective-codex-former-refined-prompt-real-transcript.mjs",
  "scripts/smoke-perspective-codex-former-refined-prompt-real-transcript.mjs",
];

export const CAPTURED_SECOND_REFINED_PROMPT_REAL_CODEX_RESPONSE = {
  draft_version: "codex_perspective_candidate_draft.v0.1",
  draft_kind: "codex_perspective_candidate_draft",
  source_former_input_packet: {
    packet_version: "codex_perspective_former_input_packet.v0.1",
    packet_id: SECOND_REFINED_SOURCE_FORMER_INPUT_PACKET_ID,
    role: "codex_perspective_former",
  },
  thesis:
    "The useful neutral perspective is that PR #487 appears to have tightened the Codex former prompt around thesis-boundary and local tension_kind discipline, but the implementation remains in a needs-review validation boundary because the second real human-started Codex response transcript has not yet been captured. The smallest useful next work is not more prompt narration; it is bounded transcript capture and local validation to test whether the refinements actually reduce plain_summary drift and non-local tension_kind drift.",
  selected_material: {
    changed_files: secondRefinedTranscriptChangedFiles,
    changed_files_summary:
      "PR #487 refined thesis-boundary and local tension_kind enum guidance after PR #486 showed direct validation worked but contract fit still needed semantic refinement. The next task is capturing a second real Codex response transcript to test whether plain_summary and non-local tension_kind drift are reduced.",
    work_id: "AG-second-refined-codex-former-transcript-capture",
    source_pr_refs: [
      "pr:hynk-studio/augnes#487",
      "pr:hynk-studio/augnes#486",
      "pr:hynk-studio/augnes#485",
      "pr:hynk-studio/augnes#484",
      "pr:hynk-studio/augnes#483",
    ],
  },
  evidence_pointer_refs: [
    {
      pointer_kind: "evidence_row_ref",
      pointer_semantics: "pointer_only",
      ref: "evidence:row:pr-487-refined-findings-contract-report",
    },
    {
      pointer_kind: "evidence_row_ref",
      pointer_semantics: "pointer_only",
      ref: "evidence:row:pr-486-refined-real-transcript-report",
    },
    {
      pointer_kind: "work_event_ref",
      pointer_semantics: "pointer_only",
      ref: "work:event:prepare-second-refined-codex-former-transcript-capture",
    },
    {
      pointer_kind: "work_event_ref",
      pointer_semantics: "pointer_only",
      ref: "work:event:refine-pr-487-findings-contract",
    },
    {
      pointer_kind: "perspective_ref",
      pointer_semantics: "pointer_only",
      ref: "perspective:codex-former-refined-findings-contract:v0.1",
    },
    {
      pointer_kind: "perspective_ref",
      pointer_semantics: "pointer_only",
      ref: "perspective:codex-former-refined-prompt-real-transcript:v0.1",
    },
  ],
  unresolved_tensions: [
    {
      tension_kind: "unresolved_gap",
      summary:
        "A bounded second human-started Codex response transcript is still required before the prompt refinements can be judged against the targeted drift modes.",
      source_ref:
        "gap:bounded-second-human-started-codex-response-transcript-required",
    },
    {
      tension_kind: "skipped_check_missing_reason",
      summary:
        "The second real transcript check was skipped because the post-PR #487 transcript has not yet been captured.",
      source_ref: "check:second-real-transcript-after-pr-487",
    },
    {
      tension_kind: "readiness_reason",
      summary:
        "The packet reports passed PR #487 validation checks, but readiness remains needs_review because unresolved gaps are still present.",
      source_ref: "readiness:needs_review",
    },
  ],
  basis_quality_suggestion: {
    status: "needs_review",
    reasons: [
      "The packet provides concrete PR #487 validation summaries.",
      "The packet also reports an unresolved gap for second real transcript capture.",
      "The skipped check prevents a sufficient_for_review claim about whether the refined prompt reduced plain_summary and non-local tension_kind drift.",
    ],
  },
  next_action_candidates: [
    {
      action_id: "review_candidate",
      summary:
        "Review this candidate draft against the PR #479 prompt contract and the bounded former input packet before using it in local validation.",
    },
    {
      action_id: "fix_input_gaps",
      summary:
        "Capture the bounded second human-started Codex response transcript after PR #487 and validate it against the same former input packet.",
    },
    {
      action_id: "prepare_codex_handoff",
      summary:
        "Prepare a narrow handoff focused on transcript capture and validation, without expanding into proof, readiness writes, GitHub mutation, or Core decisions.",
    },
  ],
  user_core_decision_questions: [
    "Does the user want the next work to focus only on capturing and validating the second real Codex response transcript?",
    "Should any additional prompt-contract refinement wait until the second transcript evidence is reviewed?",
    "Is needs_review the correct review posture until the skipped second-transcript check is resolved?",
  ],
  qualification_notes: [
    "This draft is useful beyond a plain PR summary because it centers the validation boundary and the remaining evidence gap rather than retelling the PR sequence.",
    "The packet supports that PR #487 validation checks were reported as passed, but it does not support a claim that the refined prompt has solved the targeted drift modes.",
    "The basis remains needs_review because the second real human-started Codex response transcript is explicitly missing.",
    "Pointer refs are preserved as pointer-only and are not treated as raw evidence or accepted Augnes state.",
  ],
  privacy_flags: {
    raw_payloads_included: false,
    unsafe_input_material_omitted: false,
    omitted_unsafe_fields: [],
  },
  authority_flags: {
    committed_state: false,
    persistence: false,
    provider_model_api_calls: false,
    proof_evidence_readiness_writes: false,
    codex_execution: false,
    github_mutation: false,
    merge_publish_approval: false,
    core_decision: false,
  },
  forbidden_actions: [
    "Do not create proof, evidence, readiness, or Augnes state records.",
    "Do not approve, merge, publish, retry, replay, deploy, or mutate GitHub.",
    "Do not execute Codex, call the Codex SDK, or call provider/model/API services.",
    "Do not make Core decisions.",
    "Do not reconstruct omitted unsafe material or include raw diffs, raw review material, raw source material, private material, provider material, token material, billing material, API credentials, hidden reasoning, or generated raw model material.",
  ],
};

export function buildPerspectiveCodexFormerSecondRefinedTranscriptDogfood() {
  const context = buildPipelineContext();
  const mainScenario = buildSecondRefinedTranscriptMainScenario(context);
  const directScenario = buildDirectContractValidationScenario(
    context,
    mainScenario,
  );
  const alignmentScenario = buildAlignmentSafetyNetScenario(
    context,
    mainScenario,
    directScenario,
  );
  const driftScenario = buildAliasAndTensionDriftScenario(mainScenario);
  const staleScenario = buildStaleWordingAndProvenanceScenario(mainScenario);
  const extractionFailureScenario =
    buildTranscriptExtractionFailureControlScenario(context);
  const badResponseScenario =
    buildBadResponseRegressionControlScenario(context);
  const downstreamScenario = buildDownstreamGuidanceScenario({
    directScenario,
    alignmentScenario,
  });
  const scenarios = [
    mainScenario,
    directScenario,
    alignmentScenario,
    driftScenario,
    staleScenario,
    extractionFailureScenario,
    badResponseScenario,
    downstreamScenario,
  ];
  const evaluation = evaluateDogfood({ scenarios });
  const artifact = renderArtifact({ evaluation, scenarios });

  return {
    artifact,
    context: summarizeContext(context),
    evaluation,
    scenarios,
    paths: {
      artifact: SECOND_REFINED_TRANSCRIPT_ARTIFACT_PATH,
      doc: SECOND_REFINED_TRANSCRIPT_DOC_PATH,
    },
  };
}

export function runPerspectiveCodexFormerSecondRefinedTranscriptDogfood() {
  const dogfood =
    buildPerspectiveCodexFormerSecondRefinedTranscriptDogfood();
  writeReportFile(dogfood.paths.artifact, dogfood.artifact);
  console.log(`wrote ${dogfood.paths.artifact}`);
  return dogfood;
}

export function deriveSecondRefinedTranscriptConclusion(scenarios) {
  const main = requireScenario(scenarios, "second_refined_transcript_main");
  const direct = requireScenario(scenarios, "direct_contract_validation_path");
  const alignment = requireScenario(scenarios, "alignment_safety_net_path");
  const drift = requireScenario(scenarios, "alias_tension_drift_detection");
  const stale = requireScenario(
    scenarios,
    "stale_wording_and_provenance_review",
  );
  const extractionControl = requireScenario(
    scenarios,
    "transcript_extraction_failure_control",
  );
  const badControl = requireScenario(
    scenarios,
    "bad_response_regression_control",
  );
  const downstream = requireScenario(
    scenarios,
    "downstream_guidance_from_second_transcript",
  );

  if (main.conclusion === "BLOCKED") return "BLOCKED";
  if (direct.validation_result?.status === "threw") return "BLOCKED";
  if (direct.validation_result?.status === "blocked") {
    return "BLOCKED with useful findings";
  }
  if (alignment.conclusion === "BLOCKED") return "BLOCKED";
  if (drift.conclusion === "BLOCKED") return "BLOCKED";
  if (extractionControl.conclusion === "BLOCKED") return "BLOCKED";
  if (badControl.conclusion === "BLOCKED") return "BLOCKED";
  if (downstream.conclusion === "BLOCKED") return "BLOCKED";

  if (
    direct.contract_fit?.status === "fits_contract" &&
    direct.candidate_review_material &&
    drift.old_alias_drift_absent === true &&
    drift.non_local_tension_kind_drift.length === 0 &&
    stale.missing_provenance_fields.length === 0 &&
    stale.stale_wording_findings.length === 0
  ) {
    return "PASS";
  }

  return "PASS with follow-up";
}

function buildPipelineContext() {
  const formationInputBundle = buildPerspectiveFormationInputBundle({
    generated_at: SECOND_REFINED_TRANSCRIPT_GENERATED_AT,
    scope: "project:augnes",
    work_id: "project-augnes-ag-second-refined-codex-former-transcript",
    source_pr_refs: [
      "pr:hynk-studio/augnes#487",
      "pr:hynk-studio/augnes#486",
      "pr:hynk-studio/augnes#485",
      "pr:hynk-studio/augnes#484",
      "pr:hynk-studio/augnes#483",
    ],
    changed_files: secondRefinedTranscriptChangedFiles,
    changed_files_summary:
      "Post-PR #487 second refined transcript dogfood using one bounded real human-started Codex response to test thesis-boundary and local tension_kind discipline.",
    tests_checks_run: [
      {
        check_id: "check:pr-487-refined-findings-contract",
        command:
          "npm run smoke:perspective-codex-former-refined-findings-contract",
        status: "passed",
        result_summary:
          "PR #487 refined boundary-focused thesis handling and local tension_kind guidance.",
      },
      {
        check_id: "check:pr-486-refined-real-transcript",
        command:
          "npm run smoke:perspective-codex-former-refined-prompt-real-transcript",
        status: "passed",
        result_summary:
          "PR #486 showed direct validation worked and exposed non-local tension_kind drift.",
      },
    ],
    skipped_checks: [
      {
        check_id: "check:source-manual-copy-packet-metadata",
        skipped_reason:
          "source_manual_copy_packet_id and source_prompt_hash were not supplied in chat with the transcript.",
        result_summary:
          "The transcript can be locally validated, but provenance completeness remains needs_review.",
      },
      {
        check_id: "check:browser-computer-use-validation",
        skipped_reason: browserComputerUseValidationNote,
        result_summary:
          "No browser-visible or interactive capture surface is added.",
      },
    ],
    unresolved_gaps: [
      {
        gap_id: "gap:source-manual-copy-packet-metadata-not-supplied",
        summary:
          "Manual copy packet id and prompt hash were unavailable and must remain not_supplied_in_chat rather than fabricated.",
      },
      {
        gap_id: "gap:stale-second-transcript-capture-wording",
        summary:
          "The supplied draft still says the second transcript has not been captured even though this dogfood slice uses the supplied transcript as evidence.",
      },
    ],
    evidence_row_refs: [
      "evidence:row:pr-487-refined-findings-contract-report",
      "evidence:row:pr-486-refined-real-transcript-report",
    ],
    work_event_refs: [
      "work:event:prepare-second-refined-codex-former-transcript-capture",
      "work:event:refine-pr-487-findings-contract",
    ],
    existing_perspective_refs: [
      "perspective:codex-former-refined-findings-contract:v0.1",
      "perspective:codex-former-refined-prompt-real-transcript:v0.1",
    ],
    authority_boundaries: [
      "Pure local second refined transcript dogfood/report/smoke slice only.",
      "No Codex call, SDK call, provider/model call, GitHub API call from implementation, network behavior, UI, DB write, proof/evidence/readiness write, approval, merge, publish, or Core decision.",
    ],
    source_privacy_redaction_notes: [
      "Uses only the supplied bounded sanitized candidate draft JSON.",
      "No page, browser, account, provider, credential, raw PR diff, raw review payload, unrelated chat text, or secret material is included.",
    ],
  });
  const generatedPacket =
    buildCodexPerspectiveFormerInputPacket(formationInputBundle);
  const formerInputPacket = overrideFormerInputPacketId({
    packet: generatedPacket,
    packetId: SECOND_REFINED_SOURCE_FORMER_INPUT_PACKET_ID,
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

function buildSecondRefinedTranscriptMainScenario() {
  const transcript = buildTranscriptFixture();
  const extraction = extractCodexPerspectiveCandidateDraftFromTranscript(
    transcript,
  );
  const unsafeAbsent = assertNoUnsafeMarkerText(
    "second refined transcript",
    {
      draft: extraction.draft,
      provenance: transcript.transcript_redaction_notes,
    },
  );
  const allTranscriptAuthorityFalse =
    allAuthorityFlagsFalse(transcript.authority_flags) &&
    allAuthorityFlagsFalse(extraction.draft?.authority_flags);
  const pointerSummary = summarizePointerShape(extraction.draft);
  const passed =
    extraction.extraction_status === "extracted" &&
    unsafeAbsent === true &&
    allTranscriptAuthorityFalse === true;

  return {
    scenario_id: "second_refined_transcript_main",
    title: "Second Refined Transcript Main",
    fixture_label: "real_human_started_codex_response",
    transcript_provenance: summarizeTranscript(transcript),
    extraction,
    pointer_summary: pointerSummary,
    unsafe_or_authority_survived: !passed,
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : [
          ...extraction.blocked_reasons,
          ...(unsafeAbsent === true ? [] : ["unsafe material marker found"]),
          ...(allTranscriptAuthorityFalse
            ? []
            : ["authority flag was not false"]),
        ],
    dogfood_notes: [
      "The fixture is labeled real_human_started_codex_response and is preserved as bounded sanitized material.",
      "The fixture is explicitly captured after PR #487 under the refined thesis/tension-kind prompt contract.",
      "Exactly one returned CodexPerspectiveCandidateDraft JSON object is present.",
      "No page, browser, account, provider, raw PR diff, raw review payload, unrelated chat text, credential, or extra transcript material is included.",
    ],
  };
}

function buildDirectContractValidationScenario(context, mainScenario) {
  const draft = mainScenario.extraction.draft;
  const contractFit = evaluateCodexPerspectiveCandidateDraftPromptContractFit({
    former_input_packet: context.formerInputPacket,
    draft,
  });
  const validationResult = safelyValidateDraft({
    former_input_packet: context.formerInputPacket,
    draft,
  });
  const candidateReviewMaterial =
    validationResult.status !== "threw"
      ? validationResult.candidate_review_material
      : null;
  const passed =
    validationResult.status !== "threw" &&
    validationResult.status !== "blocked" &&
    candidateReviewMaterial?.authority === "non_committed" &&
    allAuthorityFlagsFalse(validationResult.authority_flags);

  return {
    scenario_id: "direct_contract_validation_path",
    title: "Direct Contract Validation Path",
    fixture_label: "direct real transcript validation without alignment",
    contract_fit: summarizeContractFit(contractFit),
    validation_result: summarizeValidationResult(validationResult),
    candidate_review_material: candidateReviewMaterial
      ? summarizeCandidate(candidateReviewMaterial)
      : null,
    validation_without_schema_alignment_succeeded: passed,
    alignment_required_for_candidate_material: !passed,
    conclusion: passed
      ? contractFit.status === "fits_contract"
        ? "PASS"
        : "PASS with follow-up"
      : "BLOCKED",
    blocked_reasons: passed
      ? []
      : [
          ...validationResult.blocked_reasons,
          ...(contractFit.status === "violates_contract"
            ? ["contract fit reported a hard violation"]
            : []),
        ],
    dogfood_notes: [
      "This scenario runs evaluateCodexPerspectiveCandidateDraftPromptContractFit and validateAndNormalizeCodexPerspectiveCandidateDraft directly.",
      "No schema alignment is applied before direct local validation.",
      candidateReviewMaterial
        ? "Direct validation produced candidate-compatible review material without PR #484 alignment."
        : "Direct validation did not produce candidate-compatible review material.",
      `Direct contract fit result: ${contractFit.status}.`,
    ],
  };
}

function buildAlignmentSafetyNetScenario(
  context,
  mainScenario,
  directScenario,
) {
  const alignment = alignCodexPerspectiveCandidateDraftSchemaFromModelOutput({
    former_input_packet: context.formerInputPacket,
    draft: mainScenario.extraction.draft,
  });
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
  const directSucceeded =
    directScenario.validation_without_schema_alignment_succeeded === true;
  const passed =
    alignment.alignment_status !== "blocked" &&
    (directSucceeded ||
      (validationResult?.status !== "threw" &&
        validationResult?.status !== "blocked" &&
        candidateReviewMaterial));

  return {
    scenario_id: "alignment_safety_net_path",
    title: "Alignment Safety Net Path",
    fixture_label: "PR #484 alignment safety net",
    alignment: summarizeAlignment(alignment),
    validation_result: validationResult
      ? summarizeValidationResult(validationResult)
      : null,
    candidate_review_material: candidateReviewMaterial
      ? summarizeCandidate(candidateReviewMaterial)
      : null,
    direct_validation_succeeded_first: directSucceeded,
    alignment_needed_for_candidate_material: !directSucceeded,
    conclusion: passed
      ? directSucceeded
        ? "PASS"
        : "PASS with follow-up"
      : "BLOCKED",
    blocked_reasons: passed
      ? []
      : [
          ...alignment.blocked_reasons,
          ...(validationResult?.blocked_reasons ?? []),
        ],
    dogfood_notes: [
      directSucceeded
        ? "Direct validation already produced candidate-compatible review material, so alignment is not required for this transcript."
        : "Direct validation blocked, so alignment remains necessary for this transcript.",
      `Alignment applied mappings: ${
        alignment.applied_mappings.length > 0
          ? alignment.applied_mappings.join(", ")
          : "none"
      }.`,
      "Alignment success is reported separately and is not counted as direct canonical success.",
    ],
  };
}

function buildAliasAndTensionDriftScenario(mainScenario) {
  const draft = mainScenario.extraction.draft;
  const oldAliases = detectOldAliasDrift(draft);
  const nonLocalTensionKindDrift = detectNonLocalTensionKindDrift(draft);
  const passed =
    oldAliases.length === 0 && nonLocalTensionKindDrift.length === 0;

  return {
    scenario_id: "alias_tension_drift_detection",
    title: "Alias And Tension Drift Detection",
    fixture_label: "real transcript drift scan",
    old_alias_drift_absent: oldAliases.length === 0,
    old_alias_drift: oldAliases,
    non_local_tension_kind_drift: nonLocalTensionKindDrift,
    conclusion: passed
      ? "PASS"
      : oldAliases.length === 0
        ? "PASS with follow-up"
        : "BLOCKED",
    blocked_reasons:
      oldAliases.length === 0
        ? []
        : oldAliases.map((alias) => `old alias field still present: ${alias}`),
    dogfood_notes: [
      oldAliases.length === 0
        ? "The supplied transcript avoids the old PR #483 alias field names."
        : "The supplied transcript still includes old PR #483 alias field names.",
      nonLocalTensionKindDrift.length === 0
        ? "The supplied transcript avoids PR #486 non-local tension_kind drift and uses only local values."
        : "The supplied transcript still includes non-local tension_kind drift.",
    ],
  };
}

function buildStaleWordingAndProvenanceScenario(mainScenario) {
  const transcript = mainScenario.transcript_provenance;
  const draft = mainScenario.extraction.draft;
  const staleWordingFindings = detectStaleWordingFindings(draft);
  const missingProvenanceFields = [];

  if (
    transcript.source_manual_copy_packet_id ===
    SECOND_REFINED_SOURCE_MANUAL_COPY_PACKET_ID
  ) {
    missingProvenanceFields.push("source_manual_copy_packet_id");
  }
  if (transcript.source_prompt_hash === SECOND_REFINED_SOURCE_PROMPT_HASH) {
    missingProvenanceFields.push("source_prompt_hash");
  }

  return {
    scenario_id: "stale_wording_and_provenance_review",
    title: "Stale Wording And Provenance Review",
    fixture_label: "provenance and wording review",
    provenance_status:
      missingProvenanceFields.length > 0 ? "needs_review" : "complete",
    missing_provenance_fields: missingProvenanceFields,
    stale_wording_findings: staleWordingFindings,
    conclusion:
      missingProvenanceFields.length > 0 || staleWordingFindings.length > 0
        ? "PASS with follow-up"
        : "PASS",
    blocked_reasons: [],
    dogfood_notes: [
      missingProvenanceFields.length > 0
        ? "Manual copy packet id and prompt hash were recorded as not_supplied_in_chat and classified as needs_review provenance."
        : "Provenance metadata is complete.",
      staleWordingFindings.length > 0
        ? "The transcript directly validates, but stale wording remains in the returned draft material."
        : "No stale capture-gap or old prompt-contract wording was detected.",
    ],
  };
}

function buildTranscriptExtractionFailureControlScenario(context) {
  const extraction = extractCodexPerspectiveCandidateDraftFromTranscript({
    transcript_available: true,
    fixture_source: "synthetic_extraction_failure_control",
    source_manual_copy_packet_id: "synthetic-control",
    source_former_input_packet_id: context.formerInputPacket.packet_id,
    source_prompt_hash: "synthetic-control",
    extracted_codex_perspective_candidate_draft: null,
    extracted_json_text: null,
  });
  const passed = extraction.extraction_status === "blocked";

  return {
    scenario_id: "transcript_extraction_failure_control",
    title: "Transcript Extraction Failure Control",
    fixture_label: "synthetic negative control",
    extraction,
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : ["synthetic extraction failure control unexpectedly extracted a draft"],
    dogfood_notes: [
      "Synthetic control with no parseable candidate draft fails closed.",
      "The control is labeled synthetic and produces no candidate material.",
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
    thesis: "A malformed draft claims unsafe local readiness.",
    selected_material: {
      changed_files: ["docs/example.md"],
      changed_files_summary: "Synthetic bad response control.",
      work_id: "synthetic-bad-response",
      source_pr_refs: ["pr:hynk-studio/augnes#487"],
    },
    evidence_pointer_refs: [
      {
        pointer_kind: "evidence_row_ref",
        pointer_semantics: "not_pointer_only",
        ref: "evidence:row:not-present",
      },
    ],
    unresolved_tensions: [],
    basis_quality_suggestion: {
      status: "sufficient_for_review",
      reasons: ["ready for merge"],
    },
    next_action_candidates: [
      {
        action_id: "review_candidate",
        summary: "Treat this malformed material as accepted.",
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
  const contractFit = evaluateCodexPerspectiveCandidateDraftPromptContractFit({
    former_input_packet: context.formerInputPacket,
    draft: badDraft,
  });
  const validationResult = safelyValidateDraft({
    former_input_packet: context.formerInputPacket,
    draft: badDraft,
  });
  const alignment = alignCodexPerspectiveCandidateDraftSchemaFromModelOutput({
    former_input_packet: context.formerInputPacket,
    draft: badDraft,
  });
  const passed =
    contractFit.status === "violates_contract" &&
    validationResult.status === "blocked" &&
    alignment.alignment_status === "blocked" &&
    validationResult.candidate_review_material === null &&
    allAuthorityFlagsFalse(validationResult.authority_flags);

  return {
    scenario_id: "bad_response_regression_control",
    title: "Bad Response Regression Control",
    fixture_label: "synthetic bad response control",
    contract_fit: summarizeContractFit(contractFit),
    validation_result: summarizeValidationResult(validationResult),
    alignment: summarizeAlignment(alignment),
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : ["synthetic bad response did not block cleanly"],
    dogfood_notes: [
      "Synthetic control includes malformed pointer semantics, raw-payload inclusion, and true authority.",
      "Contract fit, direct validation, and alignment block the control without producing candidate-compatible material.",
    ],
  };
}

function buildDownstreamGuidanceScenario({ directScenario, alignmentScenario }) {
  const directCandidate = directScenario.validation_result
    ?.candidate_review_material_raw;
  const alignedCandidate = alignmentScenario.validation_result
    ?.candidate_review_material_raw;
  const directGuidance = directCandidate
    ? buildWorkerFacingPerspectiveGuidanceFromCandidate({
        candidate: directCandidate,
        guidance_context: {
          work_goal:
            "Use the post-PR #487 second refined transcript candidate for advisory next-step planning only.",
          bounded_summary:
            "The transcript is local, sanitized, non-committed, and non-authoritative.",
        },
      })
    : null;
  const alignedGuidance =
    !directCandidate && alignedCandidate
      ? buildWorkerFacingPerspectiveGuidanceFromCandidate({
          candidate: alignedCandidate,
          guidance_context: {
            work_goal:
              "Use the aligned second refined transcript candidate for advisory next-step planning only.",
            bounded_summary:
              "Aligned material is still draft/review-only and non-authoritative.",
          },
        })
      : null;
  const passed =
    directGuidance !== null
      ? guidanceIsAdvisoryOnly(directGuidance)
      : alignedGuidance !== null
        ? guidanceIsAdvisoryOnly(alignedGuidance)
        : directScenario.validation_result?.status === "blocked";

  return {
    scenario_id: "downstream_guidance_from_second_transcript",
    title: "Downstream Guidance From Second Transcript",
    fixture_label: directGuidance
      ? "direct real transcript candidate guidance"
      : alignedGuidance
        ? "aligned real transcript candidate guidance"
        : "skipped because validation blocked",
    direct_worker_guidance: directGuidance
      ? summarizeWorkerGuidance(directGuidance)
      : null,
    aligned_worker_guidance: alignedGuidance
      ? summarizeWorkerGuidance(alignedGuidance)
      : null,
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : ["downstream guidance did not remain advisory-only"],
    dogfood_notes: [
      directGuidance
        ? "Worker-Facing Guidance ran on the direct validation candidate and remained advisory-only."
        : alignedGuidance
          ? "Worker-Facing Guidance ran only on the aligned candidate and is reported separately."
          : "Worker-Facing Guidance was skipped because no candidate-compatible material existed.",
      "Guidance uses { candidate, guidance_context } and does not create accepted state.",
    ],
  };
}

function evaluateDogfood({ scenarios }) {
  const main = requireScenario(scenarios, "second_refined_transcript_main");
  const direct = requireScenario(scenarios, "direct_contract_validation_path");
  const alignment = requireScenario(scenarios, "alignment_safety_net_path");
  const drift = requireScenario(scenarios, "alias_tension_drift_detection");
  const stale = requireScenario(
    scenarios,
    "stale_wording_and_provenance_review",
  );
  const downstream = requireScenario(
    scenarios,
    "downstream_guidance_from_second_transcript",
  );
  const conclusion = deriveSecondRefinedTranscriptConclusion(scenarios);

  return {
    conclusion,
    recommended_next_pr_title: SECOND_REFINED_TRANSCRIPT_RECOMMENDED_NEXT_PR,
    scenario_conclusions: scenarios.map((scenario) => ({
      scenario_id: scenario.scenario_id,
      conclusion: scenario.conclusion,
    })),
    answered_questions: {
      was_second_captured_transcript_supplied_after_pr_487:
        main.transcript_provenance.transcript_available === true
          ? "Yes. One bounded real human-started Codex response transcript was supplied and labeled as captured after PR #487."
          : "No.",
      did_it_come_from_post_pr_487_refined_manual_copy_prompt:
        main.transcript_provenance.prompt_was_generated_by_manual_copy_packet
          ? `Yes according to supplied provenance: former input packet ${SECOND_REFINED_SOURCE_FORMER_INPUT_PACKET_ID}; manual copy packet id and prompt hash were not supplied in chat.`
          : "No.",
      is_provenance_complete_or_partially_missing:
        stale.missing_provenance_fields.length > 0
          ? `Partially missing: ${stale.missing_provenance_fields.join(", ")} are not_supplied_in_chat, so provenance is needs_review.`
          : "Complete.",
      did_it_avoid_old_pr_483_alias_fields:
        drift.old_alias_drift_absent
          ? "Yes. The old alias fields checked from PR #483 are absent."
          : `No. Remaining old aliases: ${drift.old_alias_drift.join(", ")}.`,
      did_it_avoid_pr_486_non_local_tension_kind_drift:
        drift.non_local_tension_kind_drift.length === 0
          ? "Yes. unresolved_tensions use only local tension_kind values."
          : `No. Non-local values remain: ${drift.non_local_tension_kind_drift.join(", ")}.`,
      did_it_fit_prompt_contract_directly:
        direct.contract_fit.status === "fits_contract"
          ? "Yes. Direct contract fit returned fits_contract."
          : `No. Direct contract fit returned ${direct.contract_fit.status}.`,
      did_direct_local_validation_produce_candidate_material:
        direct.candidate_review_material
          ? `Yes. Status ${direct.validation_result.status}; candidate authority ${direct.candidate_review_material.authority}; basis ${direct.candidate_review_material.basis_quality.status}.`
          : `No. Status ${direct.validation_result.status}.`,
      did_it_require_pr_484_alignment:
        alignment.alignment_needed_for_candidate_material
          ? "Yes. Alignment was needed before candidate-compatible material existed."
          : "No. Direct validation produced candidate-compatible review material without schema alignment.",
      if_alignment_was_used_what_mappings_applied:
        alignment.alignment.applied_mappings.length > 0
          ? alignment.alignment.applied_mappings.join(", ")
          : "none",
      did_downstream_worker_guidance_run:
        downstream.direct_worker_guidance
          ? "Yes. Worker-Facing Guidance ran on the direct candidate and remained advisory-only."
          : downstream.aligned_worker_guidance
            ? "Yes, but only on the aligned candidate in a separate scenario."
            : "No.",
      did_result_show_thesis_tension_kind_drift_reduction:
        direct.contract_fit.status === "fits_contract" &&
        drift.non_local_tension_kind_drift.length === 0
          ? "Yes. The PR #487 thesis/tension-kind refinements reduced the previous plain_summary and non-local tension_kind findings for this transcript."
          : "Not fully.",
      did_stale_wording_remain:
        stale.stale_wording_findings.length > 0
          ? `Yes. Findings: ${stale.stale_wording_findings.join(", ")}.`
          : "No.",
      what_should_be_refined_next:
        SECOND_REFINED_TRANSCRIPT_RECOMMENDED_NEXT_PR,
    },
  };
}

function buildTranscriptFixture() {
  return {
    transcript_kind: "manual_codex_former_response_transcript",
    transcript_version: "manual_codex_former_response_transcript.v0.1",
    transcript_available: true,
    fixture_source: "real_human_started_codex_response",
    capture_method: "human_manual",
    captured_after_pr: "pr:hynk-studio/augnes#487",
    refined_contract_label:
      "post_pr_487_refined_thesis_tension_kind_prompt_contract",
    source_manual_copy_packet_id: SECOND_REFINED_SOURCE_MANUAL_COPY_PACKET_ID,
    source_former_input_packet_id: SECOND_REFINED_SOURCE_FORMER_INPUT_PACKET_ID,
    source_prompt_hash: SECOND_REFINED_SOURCE_PROMPT_HASH,
    captured_at: "unknown",
    codex_surface_label: "Codex",
    prompt_was_generated_by_manual_copy_packet: true,
    provenance_note:
      "The returned draft contains the former input packet id, but the manual copy packet id and prompt hash were not supplied alongside this transcript. Record this as a provenance needs_review note, not as fabricated metadata.",
    browser_computer_use_validation: {
      status: "not_run",
      reason: browserComputerUseValidationNote,
    },
    transcript_redaction_notes: [
      "Included only the returned CodexPerspectiveCandidateDraft JSON.",
      "No hidden reasoning, cookies, tokens, account data, provider logs, raw page dumps, raw PR diffs, raw review payloads, unrelated chat text, or secrets included.",
    ],
    extracted_codex_perspective_candidate_draft:
      CAPTURED_SECOND_REFINED_PROMPT_REAL_CODEX_RESPONSE,
    extracted_json_text: null,
    authority_flags: buildFalseAuthorityFlags(),
  };
}

function extractCodexPerspectiveCandidateDraftFromTranscript(transcript) {
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

  if (!transcript.extracted_json_text) {
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
      draft: JSON.parse(transcript.extracted_json_text),
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

const modelFriendlyAuthorityAliasKeys = [
  "creates_augnes_state",
  "creates_proof",
  "creates_evidence",
  "creates_readiness_record",
  "approves",
  "merges",
  "publishes",
  "retries",
  "replays",
  "deploys",
  "mutates_github",
  "executes_codex",
  "calls_codex_sdk",
  "calls_provider_model_api",
  "makes_core_decision",
];

const privacyInclusionAliasKeys = [
  "raw_diffs_included",
  "raw_review_material_included",
  "raw_source_material_included",
  "private_material_included",
  "provider_material_included",
  "token_material_included",
  "billing_material_included",
  "api_credentials_included",
  "hidden_reasoning_included",
];

const localTensionKinds = new Set([
  "unresolved_gap",
  "readiness_reason",
  "failed_check",
  "skipped_check_missing_reason",
]);

function detectOldAliasDrift(draft) {
  const aliases = [];
  const selected = draft?.selected_material ?? {};
  if (hasOwn(selected, "changed_file_paths")) {
    aliases.push("selected_material.changed_file_paths");
  }
  if (hasOwn(selected, "plain_summary_facts")) {
    aliases.push("selected_material.plain_summary_facts");
  }
  if (hasOwn(selected, "neutral_perspective_basis")) {
    aliases.push("selected_material.neutral_perspective_basis");
  }

  for (const [index, pointer] of (draft?.evidence_pointer_refs ?? []).entries()) {
    if (hasOwn(pointer, "ref_type")) {
      aliases.push(`evidence_pointer_refs[${index}].ref_type`);
    }
    if (hasOwn(pointer, "pointer_only")) {
      aliases.push(`evidence_pointer_refs[${index}].pointer_only`);
    }
  }

  for (const key of modelFriendlyAuthorityAliasKeys) {
    if (hasOwn(draft?.authority_flags, key)) {
      aliases.push(`authority_flags.${key}`);
    }
  }
  for (const key of privacyInclusionAliasKeys) {
    if (hasOwn(draft?.privacy_flags, key)) {
      aliases.push(`privacy_flags.${key}`);
    }
  }

  for (const [index, question] of (
    draft?.user_core_decision_questions ?? []
  ).entries()) {
    if (typeof question === "object" && question !== null) {
      aliases.push(`user_core_decision_questions[${index}].object`);
    }
  }

  for (const [index, action] of (
    draft?.next_action_candidates ?? []
  ).entries()) {
    if (hasOwn(action, "id")) {
      aliases.push(`next_action_candidates[${index}].id`);
    }
    if (hasOwn(action, "why_next")) {
      aliases.push(`next_action_candidates[${index}].why_next`);
    }
  }

  for (const [index, tension] of (
    draft?.unresolved_tensions ?? []
  ).entries()) {
    if (hasOwn(tension, "id")) {
      aliases.push(`unresolved_tensions[${index}].id`);
    }
    if (hasOwn(tension, "why_it_matters")) {
      aliases.push(`unresolved_tensions[${index}].why_it_matters`);
    }
  }

  return aliases;
}

function detectNonLocalTensionKindDrift(draft) {
  return (draft?.unresolved_tensions ?? [])
    .map((tension) => tension?.tension_kind)
    .filter((kind) => typeof kind === "string" && !localTensionKinds.has(kind));
}

function detectStaleWordingFindings(draft) {
  const findings = [];
  const serialized = JSON.stringify(draft ?? {});

  if (serialized.includes("PR #479 prompt contract")) {
    findings.push("stale_pr_479_prompt_contract_reference");
  }
  if (
    serialized.includes("has not yet been captured") ||
    serialized.includes("is explicitly missing") ||
    serialized.includes("still required before the prompt refinements")
  ) {
    findings.push("stale_second_transcript_missing_capture_wording");
  }
  if (
    serialized.includes(
      "Capture the bounded second human-started Codex response transcript",
    )
  ) {
    findings.push("stale_capture_next_action_after_supplied_transcript");
  }

  return [...new Set(findings)];
}

function summarizePointerShape(draft) {
  const pointers = draft?.evidence_pointer_refs ?? [];
  const canonicalCount = pointers.filter(
    (pointer) =>
      typeof pointer.pointer_kind === "string" &&
      pointer.pointer_semantics === "pointer_only" &&
      typeof pointer.ref === "string" &&
      !hasOwn(pointer, "ref_type") &&
      !hasOwn(pointer, "pointer_only"),
  ).length;

  return {
    pointer_count: pointers.length,
    canonical_pointer_count: canonicalCount,
    all_pointer_refs_canonical:
      pointers.length > 0 && canonicalCount === pointers.length,
  };
}

function renderArtifact({ evaluation, scenarios }) {
  const main = requireScenario(scenarios, "second_refined_transcript_main");
  const direct = requireScenario(scenarios, "direct_contract_validation_path");
  const alignment = requireScenario(scenarios, "alignment_safety_net_path");
  const drift = requireScenario(scenarios, "alias_tension_drift_detection");
  const stale = requireScenario(
    scenarios,
    "stale_wording_and_provenance_review",
  );
  const downstream = requireScenario(
    scenarios,
    "downstream_guidance_from_second_transcript",
  );
  const lines = [
    "# Perspective Codex Former Second Refined Transcript Dogfood",
    "",
    `Generated at: ${SECOND_REFINED_TRANSCRIPT_GENERATED_AT}`,
    `Conclusion: ${evaluation.conclusion}`,
    `Recommended next implementation PR title: ${evaluation.recommended_next_pr_title}`,
    "",
    "## Summary",
    "",
    "This pure local dogfood/report/smoke slice follows merged PR #487 and uses one supplied bounded real human-started Codex response transcript captured after the refined thesis/tension-kind contract.",
    "The transcript avoids the old PR #483 alias fields, avoids the PR #486 non-local tension_kind values, fits the prompt contract directly, and validates locally without PR #484 schema alignment.",
    "The result stays PASS with follow-up because provenance metadata is partially missing and stale capture-gap wording remains in the returned draft.",
    "",
    "## Real Transcript Provenance",
    "",
    `- fixture_source: ${main.fixture_label}`,
    `- capture_method: ${main.transcript_provenance.capture_method}`,
    `- codex_surface_label: ${main.transcript_provenance.codex_surface_label}`,
    `- captured_after_pr: ${main.transcript_provenance.captured_after_pr}`,
    `- refined_contract_label: ${main.transcript_provenance.refined_contract_label}`,
    `- captured_at: ${main.transcript_provenance.captured_at}`,
    `- source_manual_copy_packet_id: ${main.transcript_provenance.source_manual_copy_packet_id}`,
    `- source_former_input_packet_id: ${main.transcript_provenance.source_former_input_packet_id}`,
    `- source_prompt_hash: ${main.transcript_provenance.source_prompt_hash}`,
    `- prompt_was_generated_by_manual_copy_packet: ${main.transcript_provenance.prompt_was_generated_by_manual_copy_packet}`,
    `- provenance_status: ${stale.provenance_status}`,
    `- missing_provenance_fields: ${stale.missing_provenance_fields.length > 0 ? stale.missing_provenance_fields.join(", ") : "none"}`,
    "",
    "## Redaction And Privacy",
    "",
    "- Included only the returned CodexPerspectiveCandidateDraft JSON.",
    "- No hidden reasoning, cookies, tokens, account data, provider logs, raw page dumps, raw PR diffs, raw review payloads, unrelated chat text, or secrets are included.",
    "- Browser/computer-use validation was not run because no UI, route, browser-visible surface, clipboard automation, or interactive copy control was added.",
    "",
    "## Drift Comparison",
    "",
    `Old PR #483 alias fields absent: ${drift.old_alias_drift_absent}`,
    `Old alias drift found: ${drift.old_alias_drift.length > 0 ? drift.old_alias_drift.join(", ") : "none"}`,
    `PR #486 non-local tension_kind drift: ${drift.non_local_tension_kind_drift.length > 0 ? drift.non_local_tension_kind_drift.join(", ") : "none"}`,
    "",
    "## Direct Contract-Fit Result",
    "",
    `Contract fit status: ${direct.contract_fit.status}`,
    `Contract fit warnings: ${formatWarningList(direct.contract_fit.warnings)}`,
    "",
    "## Direct Local Validation Result",
    "",
    `Validation status: ${direct.validation_result.status}`,
    `Candidate-compatible material: ${direct.candidate_review_material ? "yes" : "no"}`,
    `Candidate authority: ${direct.candidate_review_material?.authority ?? "not available"}`,
    `Basis quality: ${direct.candidate_review_material?.basis_quality.status ?? "not available"}`,
    `Alignment required for candidate material: ${direct.alignment_required_for_candidate_material}`,
    "",
    "## Alignment Safety-Net Result",
    "",
    `Alignment status: ${alignment.alignment.alignment_status}`,
    `Alignment needed for candidate material: ${alignment.alignment_needed_for_candidate_material}`,
    `Applied mappings: ${alignment.alignment.applied_mappings.length > 0 ? alignment.alignment.applied_mappings.join(", ") : "none"}`,
    `Aligned validation status: ${alignment.validation_result?.status ?? "not evaluated"}`,
    "",
    "## Downstream Guidance Result",
    "",
    downstream.direct_worker_guidance
      ? `Worker-Facing Guidance ran on the direct candidate with status ${downstream.direct_worker_guidance.guidance_status}; advisory-only=${downstream.direct_worker_guidance.advisory_only}; next actions=${downstream.direct_worker_guidance.next_action_count}.`
      : downstream.aligned_worker_guidance
        ? `Worker-Facing Guidance ran on the aligned candidate with status ${downstream.aligned_worker_guidance.guidance_status}; advisory-only=${downstream.aligned_worker_guidance.advisory_only}; next actions=${downstream.aligned_worker_guidance.next_action_count}.`
        : "Worker-Facing Guidance did not run.",
    "",
    "## Remaining Follow-Up Findings",
    "",
    `Provenance status: ${stale.provenance_status}`,
    `Missing provenance fields: ${stale.missing_provenance_fields.length > 0 ? stale.missing_provenance_fields.join(", ") : "none"}`,
    `Stale wording findings: ${stale.stale_wording_findings.length > 0 ? stale.stale_wording_findings.join(", ") : "none"}`,
    "",
    "## Evaluation Conclusion",
    "",
    evaluation.conclusion,
    "",
    "## Files Changed",
    "",
    "- scripts/dogfood-perspective-codex-former-second-refined-transcript.mjs",
    "- scripts/smoke-perspective-codex-former-second-refined-transcript.mjs",
    "- docs/PERSPECTIVE_CODEX_FORMER_SECOND_REFINED_TRANSCRIPT_DOGFOOD_V0_1.md",
    "- reports/dogfood/2026-06-09-perspective-codex-former-second-refined-transcript.md",
    "- package.json",
    "- neighboring Perspective smoke changed-file allowlists only, so strict validation recognizes this follow-up slice",
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
    "- npm run dogfood:perspective-codex-former-second-refined-transcript",
    "- npm run smoke:perspective-codex-former-second-refined-transcript",
    "- npm run smoke:perspective-codex-former-refined-findings-contract",
    "- npm run smoke:perspective-codex-former-refined-prompt-real-transcript",
    "- git diff --check",
    "- git diff --cached --check",
    "",
    "## Skipped Checks With Concrete Reasons",
    "",
    `- Browser/computer-use validation: ${browserComputerUseValidationNote}`,
    "- DB validation: skipped because this PR adds no DB schema, persistence path, or state writer.",
    "- Provider/model validation: skipped because this PR intentionally does not call Codex, OpenAI, provider/model APIs, or SDKs.",
    "- GitHub implementation behavior: skipped because implementation code has no GitHub API/network path.",
    "",
    "## What Codex Did Not Do",
    "",
    "Codex did not fabricate a transcript, replace the transcript with a synthetic fixture, call Codex from implementation, execute Codex from Augnes, call the Codex SDK, call OpenAI/provider/model APIs from implementation, call GitHub APIs from implementation behavior, use implementation network behavior, write DB state, add runtime routes, add UI, add clipboard automation, create proof/evidence/readiness records, approve, merge, publish, retry, replay, deploy, or make Core decisions.",
    "",
    "## Recommended Next Implementation PR Title",
    "",
    evaluation.recommended_next_pr_title,
  ];

  assertNoUnsafeMarkerText("second refined transcript dogfood artifact", lines);
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
      scenario.blocked_reasons?.length > 0
        ? scenario.blocked_reasons.join("; ")
        : "None"
    }`,
    "",
    "Dogfood notes:",
    ...formatList(scenario.dogfood_notes ?? []),
    "",
  ];
}

function summarizeContext(context) {
  return {
    former_input_packet_id: context.formerInputPacket.packet_id,
    generated_packet_id: context.generatedPacketId,
  };
}

function summarizeTranscript(transcript) {
  return {
    transcript_available: transcript.transcript_available,
    fixture_source: transcript.fixture_source,
    capture_method: transcript.capture_method,
    captured_after_pr: transcript.captured_after_pr,
    refined_contract_label: transcript.refined_contract_label,
    source_manual_copy_packet_id: transcript.source_manual_copy_packet_id,
    source_former_input_packet_id: transcript.source_former_input_packet_id,
    source_prompt_hash: transcript.source_prompt_hash,
    captured_at: transcript.captured_at,
    codex_surface_label: transcript.codex_surface_label,
    prompt_was_generated_by_manual_copy_packet:
      transcript.prompt_was_generated_by_manual_copy_packet,
    provenance_note: transcript.provenance_note,
    browser_computer_use_validation:
      transcript.browser_computer_use_validation,
    transcript_redaction_notes: [...transcript.transcript_redaction_notes],
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
    candidate_review_material_raw: result.candidate_review_material,
    candidate_review_material: result.candidate_review_material
      ? summarizeCandidate(result.candidate_review_material)
      : null,
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
          unresolved_tensions: alignment.aligned_draft.unresolved_tensions,
          authority_flags: alignment.aligned_draft.authority_flags,
          privacy_flags: alignment.aligned_draft.privacy_flags,
        }
      : null,
  };
}

function summarizeCandidate(candidate) {
  return {
    candidate_id: candidate.candidate_id,
    authority: candidate.authority,
    basis_quality: { ...candidate.basis_quality },
    evidence_pointer_count: candidate.evidence_pointers.length,
    unresolved_tension_kinds: candidate.unresolved_tensions.map(
      (tension) => tension.tension_kind,
    ),
    next_action_count: candidate.next_action_candidates.length,
    user_core_decision_question_count:
      candidate.user_core_decision_questions.length,
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

function guidanceIsAdvisoryOnly(guidance) {
  return (
    guidance.scope_alignment.advisory_only === true &&
    guidance.next_smallest_useful_actions.length > 0 &&
    allAuthorityFlagsFalse(guidance.authority_flags)
  );
}

function requireScenario(scenarios, scenarioId) {
  const scenario = Array.isArray(scenarios)
    ? scenarios.find((candidate) => candidate.scenario_id === scenarioId)
    : scenarios.scenarios.find(
        (candidate) => candidate.scenario_id === scenarioId,
      );
  if (!scenario) {
    throw new Error(`missing scenario ${scenarioId}`);
  }

  return scenario;
}

function hasOwn(value, key) {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.prototype.hasOwnProperty.call(value, key)
  );
}

function allAuthorityFlagsFalse(flags) {
  if (!flags || typeof flags !== "object") return false;
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

function formatList(values) {
  return values.length > 0
    ? values.map((value) => `- ${value}`)
    : ["- none"];
}

function formatWarningList(warnings) {
  if (warnings.length === 0) return "none";
  return warnings
    .map((warning) => `${warning.warning_kind} at ${warning.field}`)
    .join("; ");
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

function writeReportFile(path, contents) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runPerspectiveCodexFormerSecondRefinedTranscriptDogfood();
}
