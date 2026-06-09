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
  CAPTURED_REFINED_PROMPT_REAL_CODEX_RESPONSE,
  REFINED_PROMPT_SOURCE_FORMER_INPUT_PACKET_ID,
} = await import(
  "./dogfood-perspective-codex-former-refined-prompt-real-transcript.mjs"
);

export const REFINED_FINDINGS_CONTRACT_GENERATED_AT =
  "2026-06-10T00:00:00.000Z";
export const REFINED_FINDINGS_CONTRACT_ARTIFACT_PATH =
  "reports/2026-06-09-perspective-codex-former-refined-findings-contract.md";
export const REFINED_FINDINGS_CONTRACT_DOC_PATH =
  "docs/PERSPECTIVE_CODEX_FORMER_REFINED_FINDINGS_CONTRACT_V0_1.md";
export const REFINED_FINDINGS_CONTRACT_RECOMMENDED_NEXT_PR =
  "Dogfood refined Codex former prompt contract with a second captured transcript";

const localTensionKinds = [
  "unresolved_gap",
  "readiness_reason",
  "failed_check",
  "skipped_check_missing_reason",
];

const discouragedTensionKinds = [
  "validation_gap",
  "schema_drift_risk",
  "readiness_boundary",
];

const browserComputerUseValidationNote =
  "Not run: this PR is pure local prompt-contract/evaluator/docs/report/smoke/package work and adds no UI, route, browser-visible surface, clipboard automation, interactive copy control, or transcript capture.";

const authorityBoundary =
  "This PR is a pure local prompt-contract/evaluator/docs/report/smoke slice. It does not capture a new transcript, call Codex from implementation, execute Codex from Augnes, call the Codex SDK, call OpenAI/provider/model APIs from implementation, call GitHub APIs from implementation, use network access in implementation behavior, write DB state, add runtime routes, add UI, add clipboard automation, create proof/evidence/readiness records, approve, merge, publish, retry, replay, deploy, or make Core decisions.";

const sourceChangedFiles = [
  "lib/perspective-ingest/perspective-codex-former-prompt-contract.ts",
  "docs/PERSPECTIVE_CODEX_FORMER_REFINED_PROMPT_REAL_TRANSCRIPT_DOGFOOD_V0_1.md",
  "reports/dogfood/2026-06-09-perspective-codex-former-refined-prompt-real-transcript.md",
  "scripts/dogfood-perspective-codex-former-refined-prompt-real-transcript.mjs",
  "scripts/smoke-perspective-codex-former-refined-prompt-real-transcript.mjs",
];

export function buildPerspectiveCodexFormerRefinedFindingsContractDogfood() {
  const context = buildPipelineContext();
  const promptScenario =
    buildRefinedPromptContractThesisBoundaryScenario(context);
  const boundaryPositiveScenario =
    buildContractFitBoundaryPositiveFixture(context);
  const plainSummaryNegativeScenario =
    buildContractFitPlainSummaryNegativeFixture(context);
  const localEnumScenario =
    buildUnresolvedTensionKindLocalEnumFixture(context);
  const oldPr486DriftScenario =
    buildUnresolvedTensionKindOldPr486DriftFixture(context);
  const replayScenario =
    buildRefinedTranscriptReplayAfterContractUpdate(context);
  const unsafeRegressionScenario =
    buildUnsafeAuthorityPrivacyRegressionScenario(context);
  const scenarios = [
    promptScenario,
    boundaryPositiveScenario,
    plainSummaryNegativeScenario,
    localEnumScenario,
    oldPr486DriftScenario,
    replayScenario,
    unsafeRegressionScenario,
  ];
  const evaluation = evaluateDogfood({ scenarios });
  const artifact = renderArtifact({ evaluation, scenarios });

  return {
    artifact,
    context: summarizeContext(context),
    evaluation,
    scenarios,
    paths: {
      artifact: REFINED_FINDINGS_CONTRACT_ARTIFACT_PATH,
      doc: REFINED_FINDINGS_CONTRACT_DOC_PATH,
    },
  };
}

export function runPerspectiveCodexFormerRefinedFindingsContractDogfood() {
  const dogfood =
    buildPerspectiveCodexFormerRefinedFindingsContractDogfood();
  writeReportFile(dogfood.paths.artifact, dogfood.artifact);
  console.log(`wrote ${dogfood.paths.artifact}`);
  return dogfood;
}

export function deriveRefinedFindingsContractConclusion(scenarios) {
  const promptScenario = requireScenario(
    scenarios,
    "refined_prompt_contract_thesis_boundary",
  );
  const positiveScenario = requireScenario(
    scenarios,
    "contract_fit_boundary_positive_fixture",
  );
  const negativeScenario = requireScenario(
    scenarios,
    "contract_fit_plain_summary_negative_fixture",
  );
  const localEnumScenario = requireScenario(
    scenarios,
    "unresolved_tension_kind_local_enum_fixture",
  );
  const unsafeScenario = requireScenario(
    scenarios,
    "unsafe_authority_privacy_regression",
  );

  if (promptScenario.conclusion === "BLOCKED") return "BLOCKED";
  if (positiveScenario.conclusion === "BLOCKED") return "BLOCKED";
  if (negativeScenario.conclusion === "BLOCKED") return "BLOCKED";
  if (localEnumScenario.conclusion === "BLOCKED") return "BLOCKED";
  if (unsafeScenario.conclusion === "BLOCKED") return "BLOCKED";

  return "PASS with follow-up";
}

function buildPipelineContext() {
  const formationInputBundle = buildPerspectiveFormationInputBundle({
    generated_at: REFINED_FINDINGS_CONTRACT_GENERATED_AT,
    scope: "project:augnes",
    work_id: "project-augnes-ag-refined-findings-contract",
    source_pr_refs: [
      "pr:hynk-studio/augnes#486",
      "pr:hynk-studio/augnes#485",
      "pr:hynk-studio/augnes#484",
      "pr:hynk-studio/augnes#483",
    ],
    changed_files: sourceChangedFiles,
    changed_files_summary:
      "PR #486 showed alias drift was largely fixed and direct validation could produce candidate-compatible review material, while contract-fit thesis semantics and unresolved_tensions.tension_kind enum guidance still needed refinement.",
    tests_checks_run: [
      {
        check_id: "check:pr-486-refined-real-transcript",
        command:
          "npm run smoke:perspective-codex-former-refined-prompt-real-transcript",
        status: "passed",
        result_summary:
          "PR #486 replay directly validated without schema alignment and Worker-Facing Guidance remained advisory-only.",
      },
      {
        check_id: "check:pr-485-canonical-schema-prompt-contract",
        command:
          "npm run smoke:perspective-codex-former-prompt-contract-canonical-schema",
        status: "passed",
        result_summary:
          "PR #485 refined the prompt contract toward canonical schema output.",
      },
    ],
    skipped_checks: [
      {
        check_id: "check:second-real-transcript",
        skipped_reason:
          "This PR refines the contract/evaluator locally and does not capture a second real transcript.",
        result_summary:
          "The next PR should dogfood the refined contract with a second captured transcript.",
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
        gap_id: "gap:second-refined-real-transcript-required",
        summary:
          "A second bounded real transcript should verify that the refined thesis and tension-kind contract reduces semantic review findings.",
      },
    ],
    evidence_row_refs: [
      "evidence:row:pr-486-refined-real-transcript-report",
      "evidence:row:pr-485-canonical-schema-prompt-contract-report",
    ],
    work_event_refs: [
      "work:event:refine-pr-486-findings-contract",
      "work:event:generate-fresh-pr-485-canonical-schema-capture-prompt",
    ],
    existing_perspective_refs: [
      "perspective:codex-former-refined-prompt-real-transcript:v0.1",
      "perspective:codex-former-prompt-contract-canonical-schema:v0.1",
      "perspective:codex-former-draft-schema-alignment:v0.1",
      "perspective:codex-former-manual-copy-real-transcript:v0.1",
    ],
    authority_boundaries: [
      "Pure local prompt-contract/evaluator/docs/report/smoke slice only.",
      "No transcript capture, Codex call, SDK call, provider/model call, GitHub API call from implementation, network behavior, UI, DB write, proof/evidence/readiness write, approval, merge, publish, or Core decision.",
    ],
    source_privacy_redaction_notes: [
      "Uses only bounded report summaries, pointer refs, and the sanitized PR #486 candidate draft fixture.",
      "Synthetic fixtures are used only as controls.",
    ],
  });
  const generatedPacket =
    buildCodexPerspectiveFormerInputPacket(formationInputBundle);
  const formerInputPacket = overrideFormerInputPacketId({
    packet: generatedPacket,
    packetId: REFINED_PROMPT_SOURCE_FORMER_INPUT_PACKET_ID,
  });
  const promptContract =
    buildCodexPerspectiveFormerDraftPromptContractFromInputPacket(
      formerInputPacket,
    );

  return {
    formationInputBundle,
    formerInputPacket,
    generatedPacketId: generatedPacket.packet_id,
    promptContract,
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

function buildRefinedPromptContractThesisBoundaryScenario(context) {
  const prompt = context.promptContract.copyable_former_draft_prompt_text;
  const requiredSnippets = [
    "The thesis must name the validation boundary, unresolved tension, scope/risk tradeoff, remaining gap, or next smallest useful work first.",
    "The thesis must not merely list what PRs did or narrate PR chronology.",
    "If the thesis includes PR facts, those facts must support the boundary rather than replace it.",
    "what remains unproven or needs_review",
    "unresolved_tensions[].tension_kind must be one of unresolved_gap, readiness_reason, failed_check, or skipped_check_missing_reason.",
    "Do not emit non-local tension_kind values validation_gap, schema_drift_risk, or readiness_boundary.",
    "Map validation_gap to unresolved_gap.",
    "Map schema_drift_risk to unresolved_gap or readiness_reason",
    "Map readiness_boundary to readiness_reason.",
    "Use skipped_check_missing_reason when a missing validation or weak check result is tied to a skipped check with a missing or weak reason.",
    "Use failed_check when a validation or check result failed.",
    "Output is draft/review material only.",
    "Set every authority flag to false.",
  ];
  const missingSnippets = requiredSnippets.filter(
    (snippet) => !prompt.includes(snippet),
  );
  const passed = missingSnippets.length === 0;

  return {
    scenario_id: "refined_prompt_contract_thesis_boundary",
    title: "Refined Prompt Contract Thesis Boundary",
    fixture_label: "updated prompt contract",
    missing_snippets: missingSnippets,
    local_tension_kinds: [...localTensionKinds],
    discouraged_tension_kinds: [...discouragedTensionKinds],
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: missingSnippets.map(
      (snippet) => `missing prompt snippet: ${snippet}`,
    ),
    dogfood_notes: [
      "The prompt now asks the thesis to identify the validation boundary, unresolved tension, scope/risk tradeoff, remaining gap, or next smallest useful work first.",
      "The prompt explicitly separates PR facts from the perspective boundary.",
      "The prompt requests local unresolved_tensions.tension_kind enum values and discourages PR #486 drift values.",
    ],
  };
}

function buildContractFitBoundaryPositiveFixture(context) {
  const draft = buildCanonicalDraft(context, {
    thesis:
      "The useful neutral perspective is that PR #486 proves the validation boundary moved from alias-shaped schema drift to a remaining gap around thesis and tension-kind semantics; PR facts support that boundary, but the next smallest useful work is a second transcript dogfood before any readiness claim.",
    unresolved_tensions: [
      {
        tension_kind: "unresolved_gap",
        summary:
          "A second captured transcript is still needed before claiming stable refined prompt behavior.",
        source_ref: "gap:second-refined-real-transcript-required",
      },
    ],
  });
  const contractFit = evaluateCodexPerspectiveCandidateDraftPromptContractFit({
    former_input_packet: context.formerInputPacket,
    draft,
  });
  const validationResult = safelyValidateDraft({
    former_input_packet: context.formerInputPacket,
    draft,
  });
  const candidate = validationResult.candidate_review_material;
  const passed =
    contractFit.status === "fits_contract" &&
    !hasWarningKind(contractFit, "plain_summary") &&
    validationResult.status !== "blocked" &&
    validationResult.status !== "threw" &&
    candidate?.authority === "non_committed" &&
    allAuthorityFlagsFalse(validationResult.authority_flags);

  return {
    scenario_id: "contract_fit_boundary_positive_fixture",
    title: "Contract Fit Boundary Positive Fixture",
    fixture_label: "synthetic canonical boundary thesis",
    contract_fit: summarizeContractFit(contractFit),
    validation_result: summarizeValidationResult(validationResult),
    candidate_review_material: candidate ? summarizeCandidate(candidate) : null,
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : [
          ...validationResult.blocked_reasons,
          ...(hasWarningKind(contractFit, "plain_summary")
            ? ["boundary-focused thesis still warned plain_summary"]
            : []),
          ...(contractFit.status !== "fits_contract"
            ? [`contract fit status was ${contractFit.status}`]
            : []),
        ],
    dogfood_notes: [
      "The thesis contains PR refs but names the validation boundary and next smallest useful work first.",
      "The evaluator should not warn plain_summary merely because PR numbers are present.",
      "Direct validation produces non_committed candidate-compatible review material.",
    ],
  };
}

function buildContractFitPlainSummaryNegativeFixture(context) {
  const draft = buildCanonicalDraft(context, {
    thesis:
      "PR #483 captured a transcript, PR #484 added alignment, PR #485 changed the prompt, and PR #486 added a report.",
    qualification_notes: [
      "This synthetic negative fixture deliberately lacks a boundary, risk, unresolved tension, or next-work claim.",
    ],
    unresolved_tensions: [],
  });
  const contractFit = evaluateCodexPerspectiveCandidateDraftPromptContractFit({
    former_input_packet: context.formerInputPacket,
    draft,
  });
  const validationResult = safelyValidateDraft({
    former_input_packet: context.formerInputPacket,
    draft,
  });
  const passed =
    contractFit.status === "needs_review" &&
    hasWarningKind(contractFit, "plain_summary") &&
    validationResult.status !== "threw" &&
    allAuthorityFlagsFalse(validationResult.authority_flags);

  return {
    scenario_id: "contract_fit_plain_summary_negative_fixture",
    title: "Contract Fit Plain Summary Negative Fixture",
    fixture_label: "synthetic plain summary thesis",
    contract_fit: summarizeContractFit(contractFit),
    validation_result: summarizeValidationResult(validationResult),
    weak_thesis_quality_recorded: hasWarningKind(contractFit, "plain_summary"),
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : ["plain chronological PR thesis did not produce a plain_summary warning"],
    dogfood_notes: [
      "The evaluator still catches a thesis that merely narrates PR chronology.",
      "Validation may still normalize draft material, but dogfood records weak thesis quality.",
      "No unsafe material or authority escalation is produced.",
    ],
  };
}

function buildUnresolvedTensionKindLocalEnumFixture(context) {
  const draft = buildCanonicalDraft(context, {
    thesis:
      "The useful neutral perspective is that local tension kinds are part of the validation boundary: failed checks, skipped-check weaknesses, readiness reasons, and unresolved gaps should be named with canonical enum values before another transcript dogfood.",
    unresolved_tensions: [
      {
        tension_kind: "unresolved_gap",
        summary: "A second refined real transcript is still needed.",
        source_ref: "gap:second-refined-real-transcript-required",
      },
      {
        tension_kind: "readiness_reason",
        summary:
          "The material remains draft/review-only and is not accepted readiness.",
      },
      {
        tension_kind: "failed_check",
        summary:
          "Synthetic failed-check fixture verifies local enum recognition.",
        source_ref: "check:synthetic-failed-check",
      },
      {
        tension_kind: "skipped_check_missing_reason",
        summary:
          "Synthetic skipped-check fixture verifies local enum recognition.",
        source_ref: "check:synthetic-skipped-check",
      },
    ],
  });
  const contractFit = evaluateCodexPerspectiveCandidateDraftPromptContractFit({
    former_input_packet: context.formerInputPacket,
    draft,
  });
  const validationResult = safelyValidateDraft({
    former_input_packet: context.formerInputPacket,
    draft,
  });
  const passed =
    contractFit.status === "fits_contract" &&
    !hasWarningKind(contractFit, "tension_kind") &&
    validationResult.status !== "blocked" &&
    validationResult.status !== "threw";

  return {
    scenario_id: "unresolved_tension_kind_local_enum_fixture",
    title: "Unresolved Tension Kind Local Enum Fixture",
    fixture_label: "synthetic local tension enum fixture",
    local_tension_kinds: [...localTensionKinds],
    contract_fit: summarizeContractFit(contractFit),
    validation_result: summarizeValidationResult(validationResult),
    candidate_review_material: validationResult.candidate_review_material
      ? summarizeCandidate(validationResult.candidate_review_material)
      : null,
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : ["local tension enum fixture warned or blocked unexpectedly"],
    dogfood_notes: [
      "The local canonical tension_kind enum is unresolved_gap, readiness_reason, failed_check, and skipped_check_missing_reason.",
      "The contract-fit evaluator does not warn for local enum values.",
      "Validation preserves or safely normalizes local tension material.",
    ],
  };
}

function buildUnresolvedTensionKindOldPr486DriftFixture(context) {
  const draft = buildCanonicalDraft(context, {
    thesis:
      "The useful neutral perspective is that PR #486 replay preserves a semantic validation boundary: direct validation works, but old tension_kind values remain non-local drift for prompt review.",
    unresolved_tensions: [
      {
        tension_kind: "validation_gap",
        summary:
          "Old PR #486 drift value should map conceptually to unresolved_gap.",
        source_ref: "check:old-validation-gap",
      },
      {
        tension_kind: "schema_drift_risk",
        summary:
          "Old PR #486 drift value should map conceptually to unresolved_gap or readiness_reason.",
        source_ref: "gap:old-schema-drift-risk",
      },
      {
        tension_kind: "readiness_boundary",
        summary:
          "Old PR #486 drift value should map conceptually to readiness_reason.",
      },
    ],
  });
  const contractFit = evaluateCodexPerspectiveCandidateDraftPromptContractFit({
    former_input_packet: context.formerInputPacket,
    draft,
  });
  const validationResult = safelyValidateDraft({
    former_input_packet: context.formerInputPacket,
    draft,
  });
  const passed =
    contractFit.status === "needs_review" &&
    hasWarningKind(contractFit, "tension_kind") &&
    validationResult.status !== "threw" &&
    validationResult.status !== "blocked";

  return {
    scenario_id: "unresolved_tension_kind_old_pr486_drift_fixture",
    title: "Unresolved Tension Kind Old PR486 Drift Fixture",
    fixture_label: "synthetic old PR #486 tension drift fixture",
    discouraged_tension_kinds: [...discouragedTensionKinds],
    contract_fit: summarizeContractFit(contractFit),
    validation_result: summarizeValidationResult(validationResult),
    candidate_review_material: validationResult.candidate_review_material
      ? summarizeCandidate(validationResult.candidate_review_material)
      : null,
    conclusion: passed ? "PASS with follow-up" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : ["old PR #486 tension drift fixture was not recorded as needs_review"],
    dogfood_notes: [
      "The old PR #486 tension_kind values remain visible as non-local semantic drift.",
      "The fixture is not fatal when validation can normalize safely, but the contract-fit result records follow-up.",
      "Historical PR #486 material is not rewritten.",
    ],
  };
}

function buildRefinedTranscriptReplayAfterContractUpdate(context) {
  const draft = CAPTURED_REFINED_PROMPT_REAL_CODEX_RESPONSE;
  const oldAliases = detectOldAliasDrift(draft);
  const tensionDrift = detectSemanticTensionEnumDrift(draft);
  const contractFit = evaluateCodexPerspectiveCandidateDraftPromptContractFit({
    former_input_packet: context.formerInputPacket,
    draft,
  });
  const validationResult = safelyValidateDraft({
    former_input_packet: context.formerInputPacket,
    draft,
  });
  const alignment =
    alignCodexPerspectiveCandidateDraftSchemaFromModelOutput({
      former_input_packet: context.formerInputPacket,
      draft,
    });
  const guidance = validationResult.candidate_review_material
    ? buildWorkerFacingPerspectiveGuidanceFromCandidate({
        candidate: validationResult.candidate_review_material,
        guidance_context: {
          work_goal:
            "Replay PR #486 refined transcript after contract update for advisory planning only.",
          bounded_summary:
            "Replay material is local, sanitized, non-committed, and non-authoritative.",
        },
      })
    : null;
  const passed =
    oldAliases.length === 0 &&
    validationResult.status !== "blocked" &&
    validationResult.status !== "threw" &&
    validationResult.candidate_review_material?.authority === "non_committed" &&
    !hasWarningKind(contractFit, "plain_summary") &&
    hasWarningKind(contractFit, "tension_kind") &&
    guidanceIsAdvisoryOnly(guidance);

  return {
    scenario_id: "refined_transcript_replay_after_contract_update",
    title: "Refined Transcript Replay After Contract Update",
    fixture_label: "PR #486 captured transcript replay",
    old_alias_drift: oldAliases,
    semantic_tension_enum_drift: tensionDrift,
    contract_fit: summarizeContractFit(contractFit),
    validation_result: summarizeValidationResult(validationResult),
    alignment: summarizeAlignment(alignment),
    alignment_needed_for_candidate_material: false,
    worker_guidance: guidance ? summarizeWorkerGuidance(guidance) : null,
    conclusion: passed ? "PASS with follow-up" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : [
          ...(oldAliases.length > 0
            ? [`old alias drift remained: ${oldAliases.join(", ")}`]
            : []),
          ...(hasWarningKind(contractFit, "plain_summary")
            ? ["PR #486 replay still warned plain_summary"]
            : []),
          ...(hasWarningKind(contractFit, "tension_kind")
            ? []
            : ["PR #486 replay did not record tension_kind drift"]),
          ...(validationResult.blocked_reasons ?? []),
        ],
    dogfood_notes: [
      "PR #486 replay no longer warns plain_summary after the thesis heuristic refinement.",
      "PR #486 replay still records non-local tension_kind values as a historical drift finding.",
      "Direct validation still produces candidate-compatible material and alignment remains a safety net, not the main success path.",
      "Worker-Facing Guidance remains advisory-only.",
    ],
  };
}

function buildUnsafeAuthorityPrivacyRegressionScenario(context) {
  const badDraft = buildCanonicalDraft(context, {
    source_former_input_packet: {
      packet_version: context.formerInputPacket.packet_version,
      packet_id: "wrong-packet-id",
      role: context.formerInputPacket.role,
    },
    thesis:
      "The useful neutral perspective is that unsafe controls must block before any non-authoritative review material is produced.",
    evidence_pointer_refs: [
      {
        pointer_kind: "evidence_row_ref",
        pointer_semantics: "not_pointer_only",
        ref: "evidence:row:not-present",
      },
    ],
    unresolved_tensions: [
      {
        tension_kind: "unresolved_gap",
        summary:
          "Synthetic unsafe regression includes a blocked raw marker redacted from public artifacts.",
      },
    ],
    privacy_flags: {
      raw_payloads_included: true,
      unsafe_input_material_omitted: false,
      omitted_unsafe_fields: [],
    },
    authority_flags: {
      ...buildFalseAuthorityFlags(),
      proof_evidence_readiness_writes: true,
    },
    qualification_notes: [
      "Synthetic unsafe regression marker is constructed but not printed into artifacts.",
      buildUnsafeMarker(),
    ],
  });
  const contractFit = evaluateCodexPerspectiveCandidateDraftPromptContractFit({
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
    allAuthorityFlagsFalse(validationResult.authority_flags) &&
    allAuthorityFlagsFalse(alignment.authority_flags);

  return {
    scenario_id: "unsafe_authority_privacy_regression",
    title: "Unsafe Authority Privacy Regression",
    fixture_label: "synthetic unsafe authority privacy control",
    contract_fit: summarizeContractFit(contractFit),
    validation_result: summarizeValidationResult(validationResult),
    alignment: summarizeAlignment(alignment),
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : ["unsafe/authority/privacy regression did not block cleanly"],
    dogfood_notes: [
      "Synthetic controls cover true authority, privacy inclusion true, non-pointer evidence, source packet mismatch, and unsafe marker material.",
      "Public summaries omit the unsafe marker text while preserving blocked status.",
      "False authority flags are preserved in returned validation/alignment results.",
    ],
  };
}

function evaluateDogfood({ scenarios }) {
  const promptScenario = requireScenario(
    scenarios,
    "refined_prompt_contract_thesis_boundary",
  );
  const positiveScenario = requireScenario(
    scenarios,
    "contract_fit_boundary_positive_fixture",
  );
  const negativeScenario = requireScenario(
    scenarios,
    "contract_fit_plain_summary_negative_fixture",
  );
  const localEnumScenario = requireScenario(
    scenarios,
    "unresolved_tension_kind_local_enum_fixture",
  );
  const oldDriftScenario = requireScenario(
    scenarios,
    "unresolved_tension_kind_old_pr486_drift_fixture",
  );
  const replayScenario = requireScenario(
    scenarios,
    "refined_transcript_replay_after_contract_update",
  );
  const conclusion = deriveRefinedFindingsContractConclusion(scenarios);

  return {
    conclusion,
    recommended_next_pr_title: REFINED_FINDINGS_CONTRACT_RECOMMENDED_NEXT_PR,
    scenario_conclusions: scenarios.map((scenario) => ({
      scenario_id: scenario.scenario_id,
      conclusion: scenario.conclusion,
    })),
    answered_questions: {
      what_pr_486_found:
        "PR #486 found old PR #483 alias drift was largely fixed, direct validation produced candidate-compatible material without schema alignment, and Worker-Facing Guidance ran advisory-only.",
      what_improved_compared_with_pr_483:
        "selected_material, evidence pointers, authority/privacy flags, questions, and next actions were emitted in canonical local shape.",
      what_remained_as_refined_findings:
        "The thesis was useful but still warned plain_summary, and unresolved_tensions used non-local values validation_gap, schema_drift_risk, and readiness_boundary.",
      prompt_contract_wording_changed:
        promptScenario.missing_snippets.length === 0
          ? "The prompt now asks the thesis to name the validation boundary/unresolved tension/scope-risk/remaining gap/next smallest useful work first, not merely list PR chronology."
          : "Prompt wording is incomplete.",
      evaluator_behavior_changed:
        positiveScenario.contract_fit.status === "fits_contract" &&
        negativeScenario.weak_thesis_quality_recorded
          ? "Boundary-focused thesis with PR refs no longer warns plain_summary, while pure chronological PR summary still does."
          : "Evaluator behavior did not satisfy the dogfood fixtures.",
      requested_tension_kind_values: localTensionKinds.join(", "),
      discouraged_tension_kind_values:
        "validation_gap -> unresolved_gap; schema_drift_risk -> unresolved_gap or readiness_reason; readiness_boundary -> readiness_reason.",
      pr_486_replay_result:
        replayScenario.conclusion === "PASS with follow-up"
          ? "PR #486 replay improved: no plain_summary warning and direct validation still succeeds, while historical non-local tension_kind drift remains recorded."
          : "PR #486 replay did not satisfy the expected refined contract behavior.",
      was_new_real_transcript_captured:
        "No. This PR refines local contract/evaluator/docs/report/smoke behavior only.",
      browser_computer_use_validation: browserComputerUseValidationNote,
      what_should_happen_next: REFINED_FINDINGS_CONTRACT_RECOMMENDED_NEXT_PR,
      alignment_safety_net_status:
        "PR #484 alignment remains available as a safety net; PR #486 replay still succeeds directly without requiring alignment.",
      downstream_guidance_result:
        replayScenario.worker_guidance?.advisory_only === true
          ? "Worker-Facing Guidance ran on PR #486 replay material and remained advisory-only."
          : "Worker-Facing Guidance did not run on replay material.",
      local_enum_fixture_result:
        localEnumScenario.contract_fit.status === "fits_contract"
          ? "Local tension_kind enum fixture fits contract without tension_kind warnings."
          : "Local tension_kind enum fixture did not fit contract.",
      old_drift_fixture_result:
        oldDriftScenario.contract_fit.status === "needs_review"
          ? "Old PR #486 drift values remain visible as needs_review semantic drift."
          : "Old PR #486 drift values were not recorded as expected.",
    },
  };
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
      "The useful neutral perspective is that prompt-contract review should name the validation boundary before any next transcript dogfood.",
    selected_material: {
      changed_files: [...sourceChangedFiles],
      changed_files_summary:
        "Refined findings contract fixture for thesis and tension-kind semantics.",
      work_id: context.formerInputPacket.source_formation_input_bundle.work_id,
      source_pr_refs: [
        ...context.formerInputPacket.source_formation_input_bundle
          .source_pr_refs,
      ],
    },
    evidence_pointer_refs: context.formerInputPacket.pointer_refs.slice(0, 2),
    unresolved_tensions: [
      {
        tension_kind: "unresolved_gap",
        summary:
          "A second real transcript is needed before claiming full refined prompt stability.",
        source_ref: "gap:second-refined-real-transcript-required",
      },
    ],
    basis_quality_suggestion: {
      status: "needs_review",
      reasons: [
        "A second real transcript remains needed before a stronger readiness claim.",
      ],
    },
    next_action_candidates: [
      {
        action_id: "review_candidate",
        summary:
          "Review the non-committed prompt-contract refinement material.",
      },
      {
        action_id: "fix_input_gaps",
        summary:
          "Dogfood the refined contract with a second captured transcript.",
      },
    ],
    user_core_decision_questions: [
      "Should the next PR capture a second bounded real transcript before further contract changes?",
    ],
    qualification_notes: [
      "This draft is useful beyond a plain summary because it names the validation boundary and next smallest useful work.",
      "The material remains draft/review-only and non-authoritative.",
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
    ],
    ...overrides,
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

function renderArtifact({ evaluation, scenarios }) {
  const positiveScenario = requireScenario(
    scenarios,
    "contract_fit_boundary_positive_fixture",
  );
  const negativeScenario = requireScenario(
    scenarios,
    "contract_fit_plain_summary_negative_fixture",
  );
  const localEnumScenario = requireScenario(
    scenarios,
    "unresolved_tension_kind_local_enum_fixture",
  );
  const oldDriftScenario = requireScenario(
    scenarios,
    "unresolved_tension_kind_old_pr486_drift_fixture",
  );
  const replayScenario = requireScenario(
    scenarios,
    "refined_transcript_replay_after_contract_update",
  );
  const lines = [
    "# Perspective Codex Former Refined Findings Contract",
    "",
    `Generated at: ${REFINED_FINDINGS_CONTRACT_GENERATED_AT}`,
    `Conclusion: ${evaluation.conclusion}`,
    `Recommended next implementation PR title: ${evaluation.recommended_next_pr_title}`,
    "",
    "## Summary",
    "",
    "This pure local prompt-contract/evaluator/docs/report/smoke slice follows PR #486 and addresses the refined transcript findings without capturing a new transcript.",
    "It refines thesis-boundary wording, teaches the evaluator to distinguish boundary-focused theses with PR refs from plain PR chronology, and adds explicit local unresolved_tensions.tension_kind enum guidance.",
    "PR #484 schema alignment remains a safety net; PR #486 replay still produces candidate-compatible review material directly without requiring alignment.",
    "",
    "## What PR #486 Found",
    "",
    "- Old PR #483 alias drift was largely fixed.",
    "- Direct local validation produced candidate-compatible review material without PR #484 schema alignment.",
    "- Worker-Facing Guidance ran advisory-only on the direct candidate.",
    "- Contract fit still returned needs_review with a plain_summary warning at draft.thesis.",
    "- unresolved_tensions used canonical object shape but non-local tension_kind values: validation_gap, schema_drift_risk, and readiness_boundary.",
    "",
    "## Prompt Contract Changes",
    "",
    "- The thesis must name the validation boundary, unresolved tension, scope/risk tradeoff, remaining gap, or next smallest useful work first.",
    "- The thesis must not merely list what PRs did or narrate PR chronology.",
    "- PR facts must support the boundary rather than replace it.",
    "- The thesis should contrast what is implemented with what remains unproven or needs_review.",
    "",
    "## Contract-Fit Evaluator Changes",
    "",
    `Boundary-positive fixture contract fit: ${positiveScenario.contract_fit.status}`,
    `Plain-summary negative fixture contract fit: ${negativeScenario.contract_fit.status}`,
    `PR #486 replay contract fit: ${replayScenario.contract_fit.status}`,
    `PR #486 replay warnings: ${formatWarningList(replayScenario.contract_fit.warnings)}`,
    "",
    "## Tension-Kind Enum Guidance",
    "",
    `Allowed local tension_kind values: ${localTensionKinds.join(", ")}`,
    "Discouraged values and conceptual mapping:",
    "- validation_gap -> unresolved_gap",
    "- schema_drift_risk -> unresolved_gap or readiness_reason, depending on context",
    "- readiness_boundary -> readiness_reason",
    "- missing validation/check result -> skipped_check_missing_reason when tied to skipped check with missing or weak reason",
    "- failed validation/check -> failed_check",
    "",
    "## Local Enum And Old Drift Controls",
    "",
    `Local enum fixture contract fit: ${localEnumScenario.contract_fit.status}`,
    `Old PR #486 drift fixture contract fit: ${oldDriftScenario.contract_fit.status}`,
    `Old PR #486 drift warnings: ${formatWarningList(oldDriftScenario.contract_fit.warnings)}`,
    "",
    "## PR #486 Replay Result",
    "",
    `Old alias drift: ${replayScenario.old_alias_drift.length > 0 ? replayScenario.old_alias_drift.join(", ") : "none"}`,
    `Semantic tension enum drift: ${replayScenario.semantic_tension_enum_drift.join(", ")}`,
    `Direct validation status: ${replayScenario.validation_result.status}`,
    `Candidate material: ${replayScenario.validation_result.candidate_review_material ? "yes" : "no"}`,
    `Alignment needed for candidate material: ${replayScenario.alignment_needed_for_candidate_material}`,
    "",
    "## Alignment Safety Net Status",
    "",
    "PR #484 alignment remains available as a compatibility safety net. This PR does not remove it, make it the main success path, or weaken strict validation.",
    "",
    "## Downstream Guidance Result",
    "",
    replayScenario.worker_guidance
      ? `Worker-Facing Guidance ran with status ${replayScenario.worker_guidance.guidance_status}; advisory-only=${replayScenario.worker_guidance.advisory_only}; next actions=${replayScenario.worker_guidance.next_action_count}.`
      : "Worker-Facing Guidance did not run.",
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
    "- npm run dogfood:perspective-codex-former-refined-findings-contract",
    "- npm run smoke:perspective-codex-former-refined-findings-contract",
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
    "- Second real transcript capture: skipped because this PR intentionally refines the local contract/evaluator before asking for another human-started transcript.",
    "- DB validation: skipped because this PR adds no DB schema, persistence path, or state writer.",
    "- Provider/model validation: skipped because this PR intentionally does not call Codex, OpenAI, provider/model APIs, or SDKs.",
    "",
    "## What Codex Did Not Do",
    "",
    "Codex did not capture a new transcript, fabricate a transcript, call Codex from implementation, execute Codex from Augnes, call the Codex SDK, call OpenAI/provider/model APIs from implementation, call GitHub APIs from implementation behavior, use implementation network behavior, write DB state, add runtime routes, add UI, add clipboard automation, create proof/evidence/readiness records, approve, merge, publish, retry, replay, deploy, or make Core decisions.",
    "",
    "## Recommended Next Implementation PR Title",
    "",
    evaluation.recommended_next_pr_title,
  ];

  assertNoUnsafeMarkerText("refined findings contract artifact", lines);
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

  return aliases;
}

function detectSemanticTensionEnumDrift(draft) {
  return (draft?.unresolved_tensions ?? [])
    .map((tension) => tension?.tension_kind)
    .filter(
      (kind) =>
        typeof kind === "string" && !localTensionKinds.includes(kind),
    );
}

function hasWarningKind(contractFit, warningKind) {
  return contractFit.warnings.some(
    (warning) => warning.warning_kind === warningKind,
  );
}

function guidanceIsAdvisoryOnly(guidance) {
  return (
    guidance !== null &&
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

function buildUnsafeMarker() {
  return ["raw", "source", "payload"].join("_");
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
  runPerspectiveCodexFormerRefinedFindingsContractDogfood();
}
