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

export const REFINED_PROMPT_REAL_TRANSCRIPT_GENERATED_AT =
  "2026-06-10T00:00:00.000Z";
export const REFINED_PROMPT_REAL_TRANSCRIPT_ARTIFACT_PATH =
  "reports/dogfood/2026-06-09-perspective-codex-former-refined-prompt-real-transcript.md";
export const REFINED_PROMPT_REAL_TRANSCRIPT_DOC_PATH =
  "docs/PERSPECTIVE_CODEX_FORMER_REFINED_PROMPT_REAL_TRANSCRIPT_DOGFOOD_V0_1.md";
export const REFINED_PROMPT_REAL_TRANSCRIPT_RECOMMENDED_NEXT_PR =
  "Refine Codex former prompt contract from refined transcript findings";
export const REFINED_PROMPT_REAL_TRANSCRIPT_FULLY_PASSING_NEXT_PR =
  "Add second-sample refined Codex former transcript dogfood";

export const REFINED_PROMPT_SOURCE_FORMER_INPUT_PACKET_ID =
  "codex-perspective-former-input:v0.1:project-augnes-ag-refined-codex-former-canonical:odnwc7";
export const REFINED_PROMPT_SOURCE_MANUAL_COPY_PACKET_ID =
  "manual-codex-former-copy:v0.1:1h8nabl";
export const REFINED_PROMPT_SOURCE_PROMPT_HASH =
  "cc5e44414a9e2942c57cad1ded854194d0a3f4f45be199509ca8600230b185d5";

const browserComputerUseValidationNote =
  "Not run: browser/computer-use validation not required because transcript was manually supplied as bounded sanitized text and this PR adds no UI, route, browser-visible surface, clipboard automation, or interactive copy control.";

const authorityBoundary =
  "This PR is a pure local refined real transcript dogfood/report/smoke slice. It does not call Codex from implementation, execute Codex from Augnes, call the Codex SDK, call OpenAI/provider/model APIs from implementation, call GitHub APIs from implementation, use network access in implementation behavior, write DB state, add runtime routes, add UI, add clipboard automation, create proof/evidence/readiness records, approve, merge, publish, retry, replay, deploy, or make Core decisions.";

const refinedTranscriptChangedFiles = [
  "lib/perspective-ingest/perspective-codex-former-prompt-contract.ts",
  "docs/PERSPECTIVE_CODEX_FORMER_PROMPT_CONTRACT_CANONICAL_SCHEMA_V0_1.md",
  "reports/2026-06-09-perspective-codex-former-prompt-contract-canonical-schema.md",
  "scripts/dogfood-perspective-codex-former-prompt-contract-canonical-schema.mjs",
  "scripts/smoke-perspective-codex-former-prompt-contract-canonical-schema.mjs",
  "lib/perspective-ingest/perspective-codex-candidate-draft-schema-alignment.ts",
  "docs/PERSPECTIVE_CODEX_FORMER_DRAFT_SCHEMA_ALIGNMENT_V0_1.md",
  "scripts/dogfood-perspective-codex-former-draft-schema-alignment.mjs",
  "scripts/smoke-perspective-codex-former-draft-schema-alignment.mjs",
  "scripts/dogfood-perspective-codex-former-manual-copy-real-transcript.mjs",
  "scripts/smoke-perspective-codex-former-manual-copy-real-transcript.mjs",
];

export const CAPTURED_REFINED_PROMPT_REAL_CODEX_RESPONSE = {
  draft_version: "codex_perspective_candidate_draft.v0.1",
  draft_kind: "codex_perspective_candidate_draft",
  source_former_input_packet: {
    packet_version: "codex_perspective_former_input_packet.v0.1",
    packet_id: REFINED_PROMPT_SOURCE_FORMER_INPUT_PACKET_ID,
    role: "codex_perspective_former",
  },
  thesis:
    "The useful perspective is that PR #485 appears to move the Codex former workflow from tolerance of alias-shaped output toward direct canonical-schema production, while PR #484 remains as a compatibility safety net. The boundary is not whether the prompt-contract work was validated locally, because the provided checks report broad pass coverage, but whether a fresh human-started Codex response after PR #485 actually shows reduced alias drift. That makes the next smallest useful work transcript capture and local validation, rather than treating the prompt refinement itself as accepted readiness.",
  selected_material: {
    changed_files: refinedTranscriptChangedFiles,
    changed_files_summary:
      "PR #485 refined the Codex former prompt contract to request canonical CodexPerspectiveCandidateDraft schema directly, PR #484 alignment remains a safety net for old alias-shaped output, and the next task is capturing a new real Codex response transcript to test whether alias drift is reduced.",
    work_id:
      "AG-refined-codex-former-canonical-schema-transcript-capture",
    source_pr_refs: [
      "pr:hynk-studio/augnes#485",
      "pr:hynk-studio/augnes#484",
      "pr:hynk-studio/augnes#483",
    ],
  },
  evidence_pointer_refs: [
    {
      pointer_kind: "evidence_row_ref",
      pointer_semantics: "pointer_only",
      ref: "evidence:row:pr-485-canonical-schema-prompt-contract-report",
    },
    {
      pointer_kind: "work_event_ref",
      pointer_semantics: "pointer_only",
      ref: "work:event:generate-fresh-pr-485-canonical-schema-capture-prompt",
    },
    {
      pointer_kind: "perspective_ref",
      pointer_semantics: "pointer_only",
      ref: "perspective:codex-former-prompt-contract-canonical-schema:v0.1",
    },
    {
      pointer_kind: "perspective_ref",
      pointer_semantics: "pointer_only",
      ref: "perspective:codex-former-draft-schema-alignment:v0.1",
    },
    {
      pointer_kind: "perspective_ref",
      pointer_semantics: "pointer_only",
      ref: "perspective:codex-former-manual-copy-real-transcript:v0.1",
    },
  ],
  unresolved_tensions: [
    {
      tension_kind: "validation_gap",
      summary:
        "The packet reports many passed validation and dogfood checks, but no new real human-started Codex response transcript has been captured after PR #485.",
      source_ref: "check:new-real-transcript-after-pr-485",
    },
    {
      tension_kind: "schema_drift_risk",
      summary:
        "The prompt contract now asks for canonical schema directly, but alias drift reduction remains unproven until the new transcript is captured and normalized against the same input packet.",
      source_ref:
        "gap:bounded-new-human-started-codex-response-required",
    },
    {
      tension_kind: "readiness_boundary",
      summary:
        "The bounded packet supports needs-review draft material, not readiness acceptance, because the remaining gap concerns behavior of a fresh manual Codex response.",
    },
  ],
  basis_quality_suggestion: {
    status: "needs_review",
    reasons: [
      "The packet provides concrete validation command summaries reported as passed for PR #485.",
      "The packet also reports a skipped check for the new real transcript capture.",
      "An unresolved gap remains: a bounded new human-started Codex response transcript is still required to evaluate reduced alias drift.",
    ],
  },
  next_action_candidates: [
    {
      action_id: "review_candidate",
      summary:
        "Review this draft against the former input packet and confirm that it preserves canonical schema fields, pointer-only evidence semantics, and needs-review status.",
    },
    {
      action_id: "fix_input_gaps",
      summary:
        "Capture a new bounded human-started Codex response transcript after PR #485 and validate it with the same former input packet.",
    },
    {
      action_id: "prepare_codex_handoff",
      summary:
        "Prepare a narrow handoff that asks only for transcript capture and local validation, without approval, merge, publish, replay, provider execution, or Core decision authority.",
    },
  ],
  user_core_decision_questions: [
    "Should the next step be limited to capturing the new human-started Codex transcript before any readiness claim is considered?",
    "Should PR #484 alignment remain as a safety net until the post-PR #485 transcript demonstrates stable canonical-schema output?",
    "What threshold should be used to decide whether alias drift is sufficiently reduced after local validation?",
  ],
  qualification_notes: [
    "This draft is useful beyond a plain PR summary because it separates the apparent implementation direction from the remaining validation boundary.",
    "The packet supports a neutral needs-review perspective because the reported checks passed, but the key post-PR #485 real transcript check was skipped.",
    "No raw diffs, raw review material, raw source material, private material, provider material, token material, billing material, API credentials, hidden reasoning, or generated raw model material are included.",
    "This draft is review material only and is not accepted Augnes state before local validation.",
  ],
  privacy_flags: {
    raw_payloads_included: false,
    unsafe_input_material_omitted: false,
    omitted_unsafe_fields: [],
  },
  authority_flags: buildFalseAuthorityFlags(),
  forbidden_actions: [
    "Do not create proof, evidence, readiness, or Augnes state records.",
    "Do not approve, merge, publish, retry, replay, deploy, or mutate GitHub.",
    "Do not execute Codex, call the Codex SDK, or call provider/model/API services.",
    "Do not make Core decisions.",
    "Do not reconstruct omitted unsafe material or include raw payloads.",
  ],
};

export function buildPerspectiveCodexFormerRefinedPromptRealTranscriptDogfood() {
  const context = buildPipelineContext();
  const mainScenario = buildRefinedPromptRealTranscriptMainScenario(context);
  const directScenario = buildCanonicalNoAlignmentPathScenario(
    context,
    mainScenario,
  );
  const alignmentScenario = buildAlignmentSafetyNetPathScenario(
    context,
    mainScenario,
    directScenario,
  );
  const aliasScenario = buildAliasDriftDetectionScenario(mainScenario);
  const extractionFailureScenario =
    buildTranscriptExtractionFailureControlScenario(context);
  const badResponseScenario = buildBadResponseRegressionControlScenario(
    context,
  );
  const downstreamScenario = buildDownstreamGuidanceScenario({
    directScenario,
    alignmentScenario,
  });
  const scenarios = [
    mainScenario,
    directScenario,
    alignmentScenario,
    aliasScenario,
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
      artifact: REFINED_PROMPT_REAL_TRANSCRIPT_ARTIFACT_PATH,
      doc: REFINED_PROMPT_REAL_TRANSCRIPT_DOC_PATH,
    },
  };
}

export function runPerspectiveCodexFormerRefinedPromptRealTranscriptDogfood() {
  const dogfood =
    buildPerspectiveCodexFormerRefinedPromptRealTranscriptDogfood();
  writeReportFile(dogfood.paths.artifact, dogfood.artifact);
  console.log(`wrote ${dogfood.paths.artifact}`);
  return dogfood;
}

export function deriveRefinedPromptRealTranscriptConclusion(scenarios) {
  const main = requireScenario(scenarios, "refined_prompt_real_transcript_main");
  const direct = requireScenario(scenarios, "canonical_no_alignment_path");
  const alias = requireScenario(scenarios, "alias_drift_detection");
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
    "downstream_guidance_from_refined_transcript",
  );

  if (main.extraction.extraction_status !== "extracted") return "BLOCKED";
  if (main.unsafe_or_authority_survived === true) return "BLOCKED";
  if (direct.validation_result?.status === "threw") return "BLOCKED";
  if (direct.validation_result?.status === "blocked") {
    return "BLOCKED with useful findings";
  }
  if (extractionControl.conclusion === "BLOCKED") return "BLOCKED";
  if (badControl.conclusion === "BLOCKED") return "BLOCKED";
  if (downstream.conclusion === "BLOCKED") return "BLOCKED";

  if (
    direct.contract_fit?.status === "fits_contract" &&
    direct.candidate_review_material &&
    downstream.direct_worker_guidance &&
    alias.old_alias_drift_absent === true &&
    alias.semantic_tension_enum_drift.length === 0 &&
    direct.candidate_review_material.basis_quality.status ===
      "sufficient_for_review"
  ) {
    return "PASS";
  }

  return "PASS with follow-up";
}

function buildPipelineContext() {
  const formationInputBundle = buildPerspectiveFormationInputBundle({
    generated_at: REFINED_PROMPT_REAL_TRANSCRIPT_GENERATED_AT,
    scope: "project:augnes",
    work_id: "project-augnes-ag-refined-codex-former-canonical",
    source_pr_refs: [
      "pr:hynk-studio/augnes#485",
      "pr:hynk-studio/augnes#484",
      "pr:hynk-studio/augnes#483",
    ],
    changed_files: refinedTranscriptChangedFiles,
    changed_files_summary:
      "PR #485 refined the Codex former prompt contract to ask for canonical CodexPerspectiveCandidateDraft schema directly after PR #484 added a schema-alignment safety net for the alias-shaped PR #483 real transcript.",
    tests_checks_run: [
      {
        check_id: "check:pr-485-canonical-schema-prompt-contract",
        command:
          "npm run smoke:perspective-codex-former-prompt-contract-canonical-schema",
        status: "passed",
        result_summary:
          "PR #485 canonical prompt-contract smoke passed.",
      },
      {
        check_id: "check:pr-484-draft-schema-alignment",
        command:
          "npm run smoke:perspective-codex-former-draft-schema-alignment",
        status: "passed",
        result_summary:
          "PR #484 alignment remained available as a safety net for known safe aliases.",
      },
      {
        check_id: "check:pr-483-real-transcript-dogfood",
        command:
          "npm run smoke:perspective-codex-former-manual-copy-real-transcript",
        status: "passed",
        result_summary:
          "PR #483 first real transcript dogfood extracted a useful draft and exposed alias drift.",
      },
    ],
    skipped_checks: [
      {
        check_id: "check:new-real-transcript-after-pr-485",
        skipped_reason:
          "The source packet predates this supplied bounded transcript and reported that no new post-PR #485 real transcript had been validated yet.",
        result_summary:
          "This dogfood slice supplies the bounded transcript and evaluates it locally without changing the historical source packet.",
      },
      {
        check_id: "check:browser-computer-use-validation",
        skipped_reason: browserComputerUseValidationNote,
        result_summary:
          "No UI, route, browser-visible surface, clipboard automation, or interactive copy control is added.",
      },
    ],
    evidence_row_refs: [
      "evidence:row:pr-485-canonical-schema-prompt-contract-report",
    ],
    work_event_refs: [
      "work:event:generate-fresh-pr-485-canonical-schema-capture-prompt",
    ],
    existing_perspective_refs: [
      "perspective:codex-former-prompt-contract-canonical-schema:v0.1",
      "perspective:codex-former-draft-schema-alignment:v0.1",
      "perspective:codex-former-manual-copy-real-transcript:v0.1",
    ],
    authority_boundaries: [
      "Pure local refined real transcript dogfood/report/smoke slice only.",
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
    packetId: REFINED_PROMPT_SOURCE_FORMER_INPUT_PACKET_ID,
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

function buildRefinedPromptRealTranscriptMainScenario(context) {
  const transcript = buildTranscriptFixture();
  const extraction = extractCodexPerspectiveCandidateDraftFromTranscript(
    transcript,
  );
  const unsafeAbsent = assertNoUnsafeMarkerText(
    "refined prompt real transcript",
    {
      draft: extraction.draft,
      provenance: transcript.transcript_redaction_notes,
    },
  );
  const allTranscriptAuthorityFalse =
    allAuthorityFlagsFalse(transcript.authority_flags) &&
    allAuthorityFlagsFalse(extraction.draft?.authority_flags);
  const pointerSummary = summarizePointerShape(extraction.draft);

  return {
    scenario_id: "refined_prompt_real_transcript_main",
    title: "Refined Prompt Real Transcript Main",
    fixture_label: "real_human_started_codex_response",
    transcript_provenance: summarizeTranscript(transcript),
    extraction,
    pointer_summary: pointerSummary,
    unsafe_or_authority_survived:
      unsafeAbsent !== true || allTranscriptAuthorityFalse !== true,
    conclusion:
      extraction.extraction_status === "extracted" &&
      unsafeAbsent === true &&
      allTranscriptAuthorityFalse === true
        ? "PASS"
        : "BLOCKED",
    blocked_reasons:
      extraction.extraction_status === "extracted" &&
      unsafeAbsent === true &&
      allTranscriptAuthorityFalse === true
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
      "The captured response is from the refined post-PR #485 canonical-schema manual copy packet.",
      "Exactly one returned CodexPerspectiveCandidateDraft JSON object is present.",
      "No page, browser, account, provider, raw PR diff, raw review payload, unrelated chat text, credential, or extra transcript material is included.",
    ],
  };
}

function buildCanonicalNoAlignmentPathScenario(context, mainScenario) {
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
    scenario_id: "canonical_no_alignment_path",
    title: "Canonical No Alignment Path",
    fixture_label: "direct canonical real transcript validation",
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

function buildAlignmentSafetyNetPathScenario(
  context,
  mainScenario,
  directScenario,
) {
  const alignment = alignCodexPerspectiveCandidateDraftSchemaFromModelOutput({
    former_input_packet: context.formerInputPacket,
    draft: mainScenario.extraction.draft,
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
    aligned_contract_fit: alignedContractFit
      ? summarizeContractFit(alignedContractFit)
      : null,
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

function buildAliasDriftDetectionScenario(mainScenario) {
  const draft = mainScenario.extraction.draft;
  const oldAliases = detectOldAliasDrift(draft);
  const semanticTensionEnumDrift = detectSemanticTensionEnumDrift(draft);
  const passed = oldAliases.length === 0;

  return {
    scenario_id: "alias_drift_detection",
    title: "Alias Drift Detection",
    fixture_label: "real transcript alias drift scan",
    old_alias_drift_absent: passed,
    old_alias_drift: oldAliases,
    semantic_tension_enum_drift: semanticTensionEnumDrift,
    conclusion:
      passed && semanticTensionEnumDrift.length === 0
        ? "PASS"
        : passed
          ? "PASS with follow-up"
          : "BLOCKED",
    blocked_reasons: passed
      ? []
      : oldAliases.map((alias) => `old alias field still present: ${alias}`),
    dogfood_notes: [
      passed
        ? "The supplied transcript avoids the old PR #483 alias field names."
        : "The supplied transcript still includes old PR #483 alias field names.",
      semanticTensionEnumDrift.length > 0
        ? "The transcript uses canonical tension shape but non-local tension_kind values, which is a semantic enum refinement finding."
        : "The transcript uses local unresolved_tensions tension_kind values.",
    ],
  };
}

function buildTranscriptExtractionFailureControlScenario(context) {
  const extraction = extractCodexPerspectiveCandidateDraftFromTranscript({
    transcript_available: true,
    fixture_source: "synthetic_extraction_failure_control",
    source_manual_copy_packet_id: "synthetic-control",
    source_former_input_packet_id: context.formerInputPacket.packet_id,
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
      source_pr_refs: ["pr:hynk-studio/augnes#485"],
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
  const contractFit =
    evaluateCodexPerspectiveCandidateDraftPromptContractFit({
      former_input_packet: context.formerInputPacket,
      draft: badDraft,
    });
  const validationResult = safelyValidateDraft({
    former_input_packet: context.formerInputPacket,
    draft: badDraft,
  });
  const alignment =
    alignCodexPerspectiveCandidateDraftSchemaFromModelOutput({
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
            "Use the refined post-PR #485 real transcript candidate for advisory next-step planning only.",
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
              "Use the aligned refined transcript candidate for advisory next-step planning only.",
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
    scenario_id: "downstream_guidance_from_refined_transcript",
    title: "Downstream Guidance From Refined Transcript",
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
  const main = requireScenario(scenarios, "refined_prompt_real_transcript_main");
  const direct = requireScenario(scenarios, "canonical_no_alignment_path");
  const alignment = requireScenario(scenarios, "alignment_safety_net_path");
  const alias = requireScenario(scenarios, "alias_drift_detection");
  const downstream = requireScenario(
    scenarios,
    "downstream_guidance_from_refined_transcript",
  );
  const conclusion = deriveRefinedPromptRealTranscriptConclusion(scenarios);

  return {
    conclusion,
    recommended_next_pr_title:
      conclusion === "PASS"
        ? REFINED_PROMPT_REAL_TRANSCRIPT_FULLY_PASSING_NEXT_PR
        : REFINED_PROMPT_REAL_TRANSCRIPT_RECOMMENDED_NEXT_PR,
    scenario_conclusions: scenarios.map((scenario) => ({
      scenario_id: scenario.scenario_id,
      conclusion: scenario.conclusion,
    })),
    answered_questions: {
      was_new_captured_transcript_supplied_after_pr_485:
        main.transcript_provenance.transcript_available === true
          ? "Yes. One bounded real human-started Codex response transcript was supplied after PR #485."
          : "No.",
      did_it_come_from_refined_manual_copy_packet:
        main.transcript_provenance.prompt_was_generated_by_manual_copy_packet
          ? `Yes. manual copy packet ${REFINED_PROMPT_SOURCE_MANUAL_COPY_PACKET_ID}; former input packet ${REFINED_PROMPT_SOURCE_FORMER_INPUT_PACKET_ID}; prompt hash ${REFINED_PROMPT_SOURCE_PROMPT_HASH}.`
          : "No.",
      was_browser_computer_use_used:
        "No. Browser/computer-use validation was not run; this PR adds no UI, route, browser-visible surface, clipboard automation, or interactive copy control.",
      what_was_redacted:
        "Only the returned CodexPerspectiveCandidateDraft JSON is included; hidden reasoning, cookies, tokens, account data, provider logs, raw page dumps, raw PR diffs, raw review payloads, unrelated chat text, and secrets are not included.",
      did_it_emit_canonical_selected_material:
        alias.old_alias_drift.includes("selected_material.changed_file_paths") ||
        alias.old_alias_drift.includes("selected_material.plain_summary_facts") ||
        alias.old_alias_drift.includes(
          "selected_material.neutral_perspective_basis",
        )
          ? "No. Old selected_material aliases remain."
          : "Yes. It emits changed_files, changed_files_summary, work_id, and source_pr_refs directly.",
      did_it_avoid_old_alias_fields_from_pr_483:
        alias.old_alias_drift_absent
          ? "Yes. The old alias fields checked from PR #483 are absent."
          : `No. Remaining old aliases: ${alias.old_alias_drift.join(", ")}.`,
      did_it_emit_canonical_evidence_pointer_refs:
        main.pointer_summary.all_pointer_refs_canonical
          ? "Yes. Evidence refs use pointer_kind, pointer_semantics, and ref."
          : "No.",
      did_it_emit_canonical_authority_and_privacy_flags:
        alias.old_alias_drift.some((field) =>
          field.startsWith("authority_flags."),
        ) ||
        alias.old_alias_drift.some((field) => field.startsWith("privacy_flags."))
          ? "No. Old authority or privacy aliases remain."
          : "Yes. Authority and privacy flags use canonical local fields.",
      did_it_emit_string_questions_and_action_summary_shape:
        alias.old_alias_drift.some((field) =>
          field.startsWith("user_core_decision_questions"),
        ) ||
        alias.old_alias_drift.some((field) =>
          field.startsWith("next_action_candidates"),
        )
          ? "No."
          : "Yes. Questions are strings and next actions use action_id/summary.",
      did_unresolved_tensions_pass_or_reveal_enum_drift:
        alias.semantic_tension_enum_drift.length > 0
          ? `Direct local validation produced material, but tension_kind values reveal semantic enum drift: ${alias.semantic_tension_enum_drift.join(", ")}.`
          : "They match local tension_kind values.",
      did_contract_fit_return_fits_contract:
        direct.contract_fit.status === "fits_contract"
          ? "Yes."
          : `No. It returned ${direct.contract_fit.status}.`,
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
      did_result_show_alias_drift_reduction:
        alias.old_alias_drift_absent
          ? "Yes. Compared with PR #483, the checked old alias fields are absent; remaining follow-up is semantic contract refinement rather than the old alias shape."
          : "No. Alias drift remains.",
      what_remains_to_refine_next:
        conclusion === "PASS"
          ? REFINED_PROMPT_REAL_TRANSCRIPT_FULLY_PASSING_NEXT_PR
          : REFINED_PROMPT_REAL_TRANSCRIPT_RECOMMENDED_NEXT_PR,
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
    source_manual_copy_packet_id: REFINED_PROMPT_SOURCE_MANUAL_COPY_PACKET_ID,
    source_former_input_packet_id: REFINED_PROMPT_SOURCE_FORMER_INPUT_PACKET_ID,
    source_prompt_hash: REFINED_PROMPT_SOURCE_PROMPT_HASH,
    captured_at: "unknown",
    codex_surface_label: "Codex",
    prompt_was_generated_by_manual_copy_packet: true,
    browser_computer_use_validation: {
      status: "not_run",
      reason: browserComputerUseValidationNote,
    },
    transcript_redaction_notes: [
      "Included only the returned CodexPerspectiveCandidateDraft JSON.",
      "No hidden reasoning, cookies, tokens, account data, provider logs, raw page dumps, raw PR diffs, raw review payloads, unrelated chat text, or secrets included.",
    ],
    extracted_codex_perspective_candidate_draft:
      CAPTURED_REFINED_PROMPT_REAL_CODEX_RESPONSE,
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
    const result = validateAndNormalizeCodexPerspectiveCandidateDraft({
      former_input_packet,
      draft,
    });
    return result;
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

function detectSemanticTensionEnumDrift(draft) {
  return (draft?.unresolved_tensions ?? [])
    .map((tension) => tension?.tension_kind)
    .filter((kind) => typeof kind === "string" && !localTensionKinds.has(kind));
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
    all_pointer_refs_canonical: pointers.length > 0 && canonicalCount === pointers.length,
  };
}

function renderArtifact({ evaluation, scenarios }) {
  const main = requireScenario(scenarios, "refined_prompt_real_transcript_main");
  const direct = requireScenario(scenarios, "canonical_no_alignment_path");
  const alignment = requireScenario(scenarios, "alignment_safety_net_path");
  const alias = requireScenario(scenarios, "alias_drift_detection");
  const downstream = requireScenario(
    scenarios,
    "downstream_guidance_from_refined_transcript",
  );
  const lines = [
    "# Perspective Codex Former Refined Prompt Real Transcript Dogfood",
    "",
    `Generated at: ${REFINED_PROMPT_REAL_TRANSCRIPT_GENERATED_AT}`,
    `Conclusion: ${evaluation.conclusion}`,
    `Recommended next implementation PR title: ${evaluation.recommended_next_pr_title}`,
    "",
    "## Summary",
    "",
    "This pure local dogfood/report/smoke slice follows merged PR #485 and uses one supplied bounded real human-started Codex response transcript captured with the refined canonical-schema manual copy packet.",
    "The transcript avoids the old PR #483 alias fields and direct local validation produces candidate-compatible review material without schema alignment.",
    "The result still stays review-only and needs_review; remaining findings are semantic contract-fit/tension-kind refinement, not proof, evidence, readiness, or accepted Augnes state.",
    "",
    "## Real Transcript Provenance",
    "",
    `- fixture_source: ${main.fixture_label}`,
    `- capture_method: ${main.transcript_provenance.capture_method}`,
    `- codex_surface_label: ${main.transcript_provenance.codex_surface_label}`,
    `- captured_at: ${main.transcript_provenance.captured_at}`,
    `- source_manual_copy_packet_id: ${main.transcript_provenance.source_manual_copy_packet_id}`,
    `- source_former_input_packet_id: ${main.transcript_provenance.source_former_input_packet_id}`,
    `- source_prompt_hash: ${main.transcript_provenance.source_prompt_hash}`,
    `- prompt_was_generated_by_manual_copy_packet: ${main.transcript_provenance.prompt_was_generated_by_manual_copy_packet}`,
    "",
    "## Redaction And Privacy",
    "",
    "- Included only the returned CodexPerspectiveCandidateDraft JSON.",
    "- No hidden reasoning, cookies, tokens, account data, provider logs, raw page dumps, raw PR diffs, raw review payloads, unrelated chat text, or secrets are included.",
    "- Browser/computer-use validation was not run because no UI, route, browser-visible surface, clipboard automation, or interactive copy control was added.",
    "",
    "## Alias Drift Comparison Against PR #483",
    "",
    `Old alias fields absent: ${alias.old_alias_drift_absent}`,
    `Old alias drift found: ${alias.old_alias_drift.length > 0 ? alias.old_alias_drift.join(", ") : "none"}`,
    `Semantic tension enum drift: ${alias.semantic_tension_enum_drift.length > 0 ? alias.semantic_tension_enum_drift.join(", ") : "none"}`,
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
    "## Evaluation Conclusion",
    "",
    evaluation.conclusion,
    "",
    "## Files Changed",
    "",
    "- scripts/dogfood-perspective-codex-former-refined-prompt-real-transcript.mjs",
    "- scripts/smoke-perspective-codex-former-refined-prompt-real-transcript.mjs",
    "- docs/PERSPECTIVE_CODEX_FORMER_REFINED_PROMPT_REAL_TRANSCRIPT_DOGFOOD_V0_1.md",
    "- reports/dogfood/2026-06-09-perspective-codex-former-refined-prompt-real-transcript.md",
    "- package.json",
    "- neighboring Perspective smoke changed-file allowlists only, so the requested strict validation bundle recognizes this follow-up slice",
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
    "- npm run dogfood:perspective-codex-former-refined-prompt-real-transcript",
    "- npm run smoke:perspective-codex-former-refined-prompt-real-transcript",
    "- npm run smoke:perspective-codex-former-prompt-contract",
    "- npm run smoke:perspective-codex-former-manual-copy-packet",
    "- npm run dogfood:perspective-codex-former-prompt-contract-canonical-schema",
    "- npm run smoke:perspective-codex-former-prompt-contract-canonical-schema",
    "- npm run dogfood:perspective-codex-former-draft-schema-alignment",
    "- npm run smoke:perspective-codex-former-draft-schema-alignment",
    "- npm run dogfood:perspective-codex-former-manual-copy-real-transcript",
    "- npm run smoke:perspective-codex-former-manual-copy-real-transcript",
    "- npm run smoke:perspective-codex-former-real-transcript-capture-instructions",
    "- npm run dogfood:perspective-codex-former-manual-copy-transcript",
    "- npm run smoke:perspective-codex-former-manual-copy-transcript",
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

  assertNoUnsafeMarkerText("refined transcript dogfood artifact", lines);
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
    source_manual_copy_packet_id: transcript.source_manual_copy_packet_id,
    source_former_input_packet_id: transcript.source_former_input_packet_id,
    source_prompt_hash: transcript.source_prompt_hash,
    captured_at: transcript.captured_at,
    codex_surface_label: transcript.codex_surface_label,
    prompt_was_generated_by_manual_copy_packet:
      transcript.prompt_was_generated_by_manual_copy_packet,
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
  runPerspectiveCodexFormerRefinedPromptRealTranscriptDogfood();
}
