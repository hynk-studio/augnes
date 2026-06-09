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
const {
  alignCodexPerspectiveCandidateDraftSchemaFromModelOutput,
} = await import(
  "../lib/perspective-ingest/perspective-codex-candidate-draft-schema-alignment.ts"
);
const {
  CAPTURED_REAL_CODEX_RESPONSE,
  REAL_TRANSCRIPT_SOURCE_FORMER_INPUT_PACKET_ID,
} = await import(
  "./dogfood-perspective-codex-former-manual-copy-real-transcript.mjs"
);

export const CANONICAL_SCHEMA_GENERATED_AT = "2026-06-10T00:00:00.000Z";
export const CANONICAL_SCHEMA_ARTIFACT_PATH =
  "reports/2026-06-09-perspective-codex-former-prompt-contract-canonical-schema.md";
export const CANONICAL_SCHEMA_DOC_PATH =
  "docs/PERSPECTIVE_CODEX_FORMER_PROMPT_CONTRACT_CANONICAL_SCHEMA_V0_1.md";
export const CANONICAL_SCHEMA_RECOMMENDED_NEXT_PR =
  "Dogfood refined Codex former prompt contract with a new captured transcript";

const browserComputerUseValidationNote =
  "Not run: this PR is pure local prompt-contract/docs/report/smoke/package work and adds no UI, route, browser-visible surface, clipboard automation, interactive copy control, or transcript capture.";

const authorityBoundary =
  "This PR is a pure local prompt-contract/docs/report/smoke slice. It does not call Codex from implementation, execute Codex from Augnes, call the Codex SDK, call OpenAI/provider/model APIs from implementation, call GitHub APIs from implementation, use network access in implementation behavior, write DB state, add runtime routes, add UI, add clipboard automation, create proof/evidence/readiness records, approve, merge, publish, retry, replay, deploy, or make Core decisions.";

const sourceChangedFiles = [
  "lib/perspective-ingest/perspective-codex-candidate-draft-schema-alignment.ts",
  "scripts/dogfood-perspective-codex-former-draft-schema-alignment.mjs",
  "scripts/smoke-perspective-codex-former-draft-schema-alignment.mjs",
  "docs/PERSPECTIVE_CODEX_FORMER_DRAFT_SCHEMA_ALIGNMENT_V0_1.md",
  "reports/2026-06-09-perspective-codex-former-draft-schema-alignment.md",
  "scripts/dogfood-perspective-codex-former-manual-copy-real-transcript.mjs",
  "scripts/smoke-perspective-codex-former-manual-copy-real-transcript.mjs",
  "docs/PERSPECTIVE_CODEX_FORMER_MANUAL_COPY_REAL_TRANSCRIPT_DOGFOOD_V0_1.md",
  "reports/dogfood/2026-06-09-perspective-codex-former-manual-copy-real-transcript.md",
];

const requiredCanonicalPromptSnippets = [
  "selected_material must be exactly { changed_files: string[], changed_files_summary: string|null, work_id: string|null, source_pr_refs: string[] }",
  "Do not emit selected_material aliases changed_file_paths, plain_summary_facts, or neutral_perspective_basis",
  "Fold plain summary facts into selected_material.changed_files_summary",
  "Put neutral perspective basis in thesis or qualification_notes",
  'evidence_pointer_refs entries must be exactly { pointer_kind, pointer_semantics: "pointer_only", ref }',
  "Do not emit evidence pointer aliases ref_type or pointer_only",
  "Each evidence pointer ref must match one former input packet pointer ref",
  "authority_flags must use only committed_state, persistence, provider_model_api_calls, proof_evidence_readiness_writes, codex_execution, github_mutation, merge_publish_approval, and core_decision, with every value false",
  "Do not emit model-friendly authority aliases creates_augnes_state, creates_proof, creates_evidence, creates_readiness_record, approves, merges, publishes, retries, replays, deploys, mutates_github, executes_codex, calls_codex_sdk, calls_provider_model_api, or makes_core_decision",
  "privacy_flags must use only raw_payloads_included: false, unsafe_input_material_omitted: boolean, and omitted_unsafe_fields: string[]",
  "Do not emit privacy inclusion aliases raw_diffs_included, raw_review_material_included, raw_source_material_included, private_material_included, provider_material_included, token_material_included, billing_material_included, api_credentials_included, or hidden[_]reasoning_included",
  "user_core_decision_questions must be string[]",
  "next_action_candidates entries must be exactly { action_id, summary } using local action ids review_candidate, fix_input_gaps, or prepare_codex_handoff",
  "Do not emit next-action aliases id or why_next",
  "unresolved_tensions entries must be exactly { tension_kind, summary, source_ref? }",
  "Do not emit unresolved tension aliases id or why_it_matters",
];

export function buildPerspectiveCodexFormerPromptContractCanonicalSchemaDogfood() {
  const context = buildPipelineContext();
  const promptTextScenario = buildPromptContractCanonicalSchemaTextScenario(
    context,
  );
  const manualCopyScenario = buildManualCopyPacketCanonicalContractScenario(
    context,
  );
  const canonicalDraftScenario = buildCanonicalDraftFixtureScenario(context);
  const oldAliasScenario = buildOldAliasDraftStillAlignsScenario(context);
  const unsafeAuthorityScenario = buildUnsafeAuthorityRegressionScenario(
    context,
  );
  const reportScenario = buildAliasFreePromptDogfoodReportScenario({
    promptTextScenario,
    manualCopyScenario,
    canonicalDraftScenario,
    oldAliasScenario,
    unsafeAuthorityScenario,
  });
  const scenarios = [
    promptTextScenario,
    manualCopyScenario,
    canonicalDraftScenario,
    oldAliasScenario,
    reportScenario,
    unsafeAuthorityScenario,
  ];
  const evaluation = evaluateDogfood(scenarios);
  const artifact = renderArtifact({ evaluation, scenarios });

  return {
    artifact,
    context: summarizeContext(context),
    evaluation,
    scenarios,
    paths: {
      artifact: CANONICAL_SCHEMA_ARTIFACT_PATH,
      doc: CANONICAL_SCHEMA_DOC_PATH,
    },
  };
}

export function runPerspectiveCodexFormerPromptContractCanonicalSchemaDogfood() {
  const dogfood =
    buildPerspectiveCodexFormerPromptContractCanonicalSchemaDogfood();
  writeReportFile(dogfood.paths.artifact, dogfood.artifact);
  console.log(`wrote ${dogfood.paths.artifact}`);
  return dogfood;
}

export function deriveCanonicalSchemaConclusion(scenarios) {
  const promptText = requireScenario(
    scenarios,
    "prompt_contract_canonical_schema_text",
  );
  const manualCopy = requireScenario(
    scenarios,
    "manual_copy_packet_prompt_uses_canonical_contract",
  );
  const canonicalDraft = requireScenario(
    scenarios,
    "canonical_draft_fixture_passes_without_alignment",
  );
  const oldAlias = requireScenario(scenarios, "old_alias_draft_still_aligns");
  const unsafeAuthority = requireScenario(
    scenarios,
    "unsafe_authority_regression",
  );

  if (promptText.conclusion === "BLOCKED") return "BLOCKED";
  if (manualCopy.conclusion === "BLOCKED") return "BLOCKED";
  if (canonicalDraft.conclusion === "BLOCKED") return "BLOCKED";
  if (oldAlias.conclusion === "BLOCKED") return "BLOCKED";
  if (unsafeAuthority.conclusion === "BLOCKED") return "BLOCKED";

  return "PASS with follow-up";
}

function buildPipelineContext() {
  const formationInputBundle = buildPerspectiveFormationInputBundle({
    generated_at: CANONICAL_SCHEMA_GENERATED_AT,
    scope: "project:augnes",
    work_id: "project-augnes-ag-codex-former-canonical-schema-contract",
    source_pr_refs: [
      "pr:hynk-studio/augnes#484",
      "pr:hynk-studio/augnes#483",
      "pr:hynk-studio/augnes#482",
      "pr:hynk-studio/augnes#481",
      "pr:hynk-studio/augnes#480",
    ],
    changed_files: sourceChangedFiles,
    changed_files_summary:
      "PR #484 aligned a real #483 Codex former transcript after the prompt allowed alias-shaped selected material, pointer refs, authority flags, privacy flags, questions, actions, and tensions.",
    tests_checks_run: [
      {
        check_id: "check:pr-484-draft-schema-alignment",
        command:
          "npm run smoke:perspective-codex-former-draft-schema-alignment",
        status: "passed",
        result_summary:
          "PR #484 proved old alias-shaped output still aligns before local validation.",
      },
      {
        check_id: "check:prompt-contract",
        command: "npm run smoke:perspective-codex-former-prompt-contract",
        status: "passed",
        result_summary: "Prompt contract smoke passed before refinement.",
      },
    ],
    skipped_checks: [
      {
        check_id: "check:new-real-transcript-capture",
        skipped_reason:
          "No new real Codex transcript was captured in this prompt-contract refinement slice.",
        result_summary:
          "The next follow-up should dogfood the refined prompt with a new captured transcript.",
      },
      {
        check_id: "check:browser-computer-use-validation",
        skipped_reason: browserComputerUseValidationNote,
        result_summary:
          "No browser-visible or interactive capture surface is added by this prompt-contract slice.",
      },
    ],
    unresolved_gaps: [
      {
        gap_id: "gap:new-real-transcript-after-canonical-prompt",
        summary:
          "A new real transcript should verify whether canonical prompt wording reduces alias drift.",
      },
    ],
    evidence_row_refs: ["evidence:row:real-transcript-capture-instructions"],
    work_event_refs: ["work:event:manual-copy-real-transcript-capture-prompt"],
    existing_perspective_refs: [
      "perspective:codex-former-manual-copy-packet:v0.1",
      "perspective:codex-former-manual-copy-transcript-dogfood:v0.1",
      "perspective:codex-former-real-transcript-capture-instructions:v0.1",
      "perspective:codex-former-draft-schema-alignment:v0.1",
    ],
    authority_boundaries: [
      "Pure local prompt-contract/report/smoke slice only.",
      "No Codex call, SDK call, provider/model call, GitHub mutation, UI, DB write, proof/evidence/readiness write, approval, merge, or Core decision.",
    ],
    source_privacy_redaction_notes: [
      "Uses only bounded summaries, pointer refs, and the sanitized PR #483 candidate draft JSON.",
      "The hidden reasoning privacy alias is named in split form in prompt text to avoid unsafe-marker policy trips.",
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
    promptContract:
      buildCodexPerspectiveFormerDraftPromptContractFromInputPacket(
        formerInputPacket,
      ),
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

function buildPromptContractCanonicalSchemaTextScenario(context) {
  const prompt = context.promptContract.copyable_former_draft_prompt_text;
  const missingSnippets = requiredCanonicalPromptSnippets.filter(
    (snippet) => !prompt.includes(snippet),
  );
  const requiredFieldsMatch =
    context.promptContract.output_contract.required_fields.join("|") ===
    context.formerInputPacket.expected_output_contract.required_fields.join("|");
  const unsafeMarkersAbsent = assertNoUnsafeMarkerText(
    "prompt contract canonical schema text",
    prompt,
  );
  const passed =
    missingSnippets.length === 0 && requiredFieldsMatch && unsafeMarkersAbsent;

  return {
    scenario_id: "prompt_contract_canonical_schema_text",
    title: "Prompt Contract Canonical Schema Text",
    fixture_label: "refined copyable prompt contract",
    prompt_contract_required_fields:
      context.promptContract.output_contract.required_fields,
    canonical_snippet_count: requiredCanonicalPromptSnippets.length,
    missing_snippets: missingSnippets,
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : [
          ...missingSnippets.map((snippet) => `missing prompt text: ${snippet}`),
          ...(requiredFieldsMatch
            ? []
            : ["prompt contract required fields diverged from local draft fields"]),
          ...(unsafeMarkersAbsent
            ? []
            : ["prompt contract text includes unsafe marker"]),
        ],
    dogfood_notes: [
      "The prompt now names canonical selected_material, evidence pointer, authority, privacy, question, action, and tension shapes.",
      "The prompt explicitly tells future Codex former responses not to emit model-friendly aliases.",
      "Required fields remain exactly the local CodexPerspectiveCandidateDraft fields.",
    ],
  };
}

function buildManualCopyPacketCanonicalContractScenario(context) {
  const manualPacket = buildManualCodexPerspectiveFormerDraftCopyPacket({
    former_input_packet: context.formerInputPacket,
    prompt_contract: context.promptContract,
    manual_context: {
      reviewer_label: "canonical schema dogfood reviewer",
      intended_codex_surface: "user-started Codex session",
      usage_notes: [
        "Use this packet only for bounded prompt-contract canonical schema review.",
      ],
    },
    expected_validation_commands: [
      "npm run smoke:perspective-codex-former-prompt-contract-canonical-schema",
    ],
    generated_at: CANONICAL_SCHEMA_GENERATED_AT,
  });
  const evaluation =
    evaluateManualCodexPerspectiveFormerDraftCopyPacket(manualPacket);
  const prompt = manualPacket.copyable_codex_prompt_text;
  const missingSnippets = requiredCanonicalPromptSnippets.filter(
    (snippet) => !prompt.includes(snippet),
  );
  const passed =
    manualPacket.copy_status === "needs_review" &&
    evaluation.evaluation_status !== "blocked" &&
    manualPacket.authority_flags.provider_model_api_calls === false &&
    manualPacket.authority_flags.proof_evidence_readiness_writes === false &&
    manualPacket.authority_flags.codex_execution === false &&
    manualPacket.authority_flags.github_mutation === false &&
    manualPacket.authority_flags.core_decision === false &&
    manualPacket.browser_or_computer_use_validation.status ===
      "not_required" &&
    missingSnippets.length === 0 &&
    assertNoUnsafeMarkerText("manual copy canonical prompt", manualPacket);

  return {
    scenario_id: "manual_copy_packet_prompt_uses_canonical_contract",
    title: "Manual Copy Packet Prompt Uses Canonical Contract",
    fixture_label: "manual packet embedding refined prompt contract",
    copy_status: manualPacket.copy_status,
    evaluation_status: evaluation.evaluation_status,
    browser_or_computer_use_validation:
      manualPacket.browser_or_computer_use_validation,
    missing_snippets: missingSnippets,
    authority_flags: manualPacket.authority_flags,
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : [
          ...evaluation.blocked_reasons,
          ...missingSnippets.map(
            (snippet) => `missing manual copy prompt text: ${snippet}`,
          ),
          ...(manualPacket.copy_status === "needs_review"
            ? []
            : [`manual copy status was ${manualPacket.copy_status}`]),
        ],
    dogfood_notes: [
      "Manual copy prompt embeds the same canonical schema-only contract.",
      "The packet remains needs_review because the source packet records skipped new-transcript and browser/computer-use checks.",
      "Authority flags remain false and browser/computer-use validation is not_required.",
    ],
  };
}

function buildCanonicalDraftFixtureScenario(context) {
  const draft = buildCanonicalLocalDraft(context);
  const contractFit = evaluateCodexPerspectiveCandidateDraftPromptContractFit({
    former_input_packet: context.formerInputPacket,
    draft,
  });
  const validationResult = validateAndNormalizeCodexPerspectiveCandidateDraft({
    former_input_packet: context.formerInputPacket,
    draft,
  });
  const candidate = validationResult.candidate_review_material;
  const passed =
    contractFit.status === "fits_contract" &&
    validationResult.status === "needs_review" &&
    candidate?.authority === "non_committed" &&
    candidate.basis_quality.status === "needs_review" &&
    allAuthorityFlagsFalse(validationResult.authority_flags) &&
    assertNoUnsafeMarkerText("canonical draft fixture", draft);

  return {
    scenario_id: "canonical_draft_fixture_passes_without_alignment",
    title: "Canonical Draft Fixture Passes Without Alignment",
    fixture_label: "synthetic canonical local draft",
    contract_fit: summarizeContractFit(contractFit),
    validation_result: summarizeValidationResult(validationResult),
    candidate_review_material: candidate ? summarizeCandidate(candidate) : null,
    alignment_required: false,
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : [
          `contract fit was ${contractFit.status}`,
          `validation status was ${validationResult.status}`,
          ...(validationResult.blocked_reasons ?? []),
        ],
    dogfood_notes: [
      "A canonical local draft emitted from the refined prompt contract needs no schema alignment.",
      "Validation still returns needs_review because the source packet deliberately records skipped checks and an unresolved next-transcript gap.",
      "Candidate-compatible review material remains non_committed.",
    ],
  };
}

function buildOldAliasDraftStillAlignsScenario(context) {
  const originalContractFit =
    evaluateCodexPerspectiveCandidateDraftPromptContractFit({
      former_input_packet: context.formerInputPacket,
      draft: CAPTURED_REAL_CODEX_RESPONSE,
    });
  const alignment =
    alignCodexPerspectiveCandidateDraftSchemaFromModelOutput({
      former_input_packet: context.formerInputPacket,
      draft: CAPTURED_REAL_CODEX_RESPONSE,
    });
  const alignedContractFit = alignment.aligned_draft
    ? evaluateCodexPerspectiveCandidateDraftPromptContractFit({
        former_input_packet: context.formerInputPacket,
        draft: alignment.aligned_draft,
      })
    : null;
  const validationResult = alignment.aligned_draft
    ? validateAndNormalizeCodexPerspectiveCandidateDraft({
        former_input_packet: context.formerInputPacket,
        draft: alignment.aligned_draft,
      })
    : null;
  const candidate = validationResult?.candidate_review_material ?? null;
  const passed =
    ["violates_contract", "needs_review"].includes(originalContractFit.status) &&
    alignment.alignment_status === "aligned" &&
    alignedContractFit?.status === "fits_contract" &&
    validationResult?.status === "needs_review" &&
    candidate?.authority === "non_committed" &&
    candidate.basis_quality.status === "needs_review" &&
    allAuthorityFlagsFalse(alignment.authority_flags);

  return {
    scenario_id: "old_alias_draft_still_aligns",
    title: "Old Alias Draft Still Aligns",
    fixture_label: "PR #483 captured real alias-shaped draft",
    original_contract_fit: summarizeContractFit(originalContractFit),
    alignment: summarizeAlignment(alignment),
    aligned_contract_fit: alignedContractFit
      ? summarizeContractFit(alignedContractFit)
      : null,
    validation_result: validationResult
      ? summarizeValidationResult(validationResult)
      : null,
    candidate_review_material: candidate ? summarizeCandidate(candidate) : null,
    conclusion: passed ? "PASS with follow-up" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : [
          ...alignment.blocked_reasons,
          ...(validationResult?.blocked_reasons ?? []),
        ],
    dogfood_notes: [
      "The old #483 alias-style draft remains a non-fit for the original prompt contract.",
      "PR #484 alignment still maps the known aliases and remains a safety net.",
      "Aligned validation remains candidate-compatible review material, not accepted state.",
    ],
  };
}

function buildAliasFreePromptDogfoodReportScenario({
  promptTextScenario,
  manualCopyScenario,
  canonicalDraftScenario,
  oldAliasScenario,
  unsafeAuthorityScenario,
}) {
  const passed =
    promptTextScenario.conclusion === "PASS" &&
    manualCopyScenario.conclusion === "PASS" &&
    canonicalDraftScenario.conclusion === "PASS" &&
    oldAliasScenario.conclusion !== "BLOCKED" &&
    unsafeAuthorityScenario.conclusion === "PASS";

  return {
    scenario_id: "alias_free_prompt_dogfood_report",
    title: "Alias-Free Prompt Dogfood Report",
    fixture_label: "deterministic report over old transcript plus canonical fixture",
    conclusion: passed ? "PASS with follow-up" : "BLOCKED",
    new_real_transcript_captured: false,
    browser_or_computer_use_validation: {
      required: false,
      status: "not_required",
      reason: browserComputerUseValidationNote,
    },
    blocked_reasons: passed
      ? []
      : [
          "canonical prompt report inputs did not all pass",
          ...promptTextScenario.blocked_reasons,
          ...manualCopyScenario.blocked_reasons,
          ...canonicalDraftScenario.blocked_reasons,
          ...oldAliasScenario.blocked_reasons,
          ...unsafeAuthorityScenario.blocked_reasons,
        ],
    dogfood_notes: [
      "No new real transcript was captured in this PR.",
      "The deterministic report compares the old real transcript alias output, refined canonical prompt expectations, and a canonical fixture.",
      "The next real transcript should measure alias drift reduction after this prompt refinement.",
    ],
  };
}

function buildUnsafeAuthorityRegressionScenario(context) {
  const trueAuthorityDraft = buildCanonicalLocalDraft(context, {
    authority_flags: {
      ...buildFalseAuthorityFlags(),
      committed_state: true,
    },
  });
  const trueAuthorityFit =
    evaluateCodexPerspectiveCandidateDraftPromptContractFit({
      former_input_packet: context.formerInputPacket,
      draft: trueAuthorityDraft,
    });
  const trueAuthorityValidation =
    validateAndNormalizeCodexPerspectiveCandidateDraft({
      former_input_packet: context.formerInputPacket,
      draft: trueAuthorityDraft,
    });
  const unsafeDraft = buildCanonicalLocalDraft(context, {
    qualification_notes: [["raw_source", "_payload"].join("")],
  });
  const unsafeFit = evaluateCodexPerspectiveCandidateDraftPromptContractFit({
    former_input_packet: context.formerInputPacket,
    draft: unsafeDraft,
  });
  const unsafeValidation = validateAndNormalizeCodexPerspectiveCandidateDraft({
    former_input_packet: context.formerInputPacket,
    draft: unsafeDraft,
  });
  const splitMarkerDraft = buildCanonicalLocalDraft(context, {
    qualification_notes: [["hidden", "_reasoning"].join("")],
  });
  const splitMarkerValidation =
    validateAndNormalizeCodexPerspectiveCandidateDraft({
      former_input_packet: context.formerInputPacket,
      draft: splitMarkerDraft,
    });
  const nonPointerAlignment =
    alignCodexPerspectiveCandidateDraftSchemaFromModelOutput({
      former_input_packet: context.formerInputPacket,
      draft: buildCanonicalLocalDraft(context, {
        evidence_pointer_refs: [
          {
            ref: context.formerInputPacket.pointer_refs[0].ref,
            ref_type: context.formerInputPacket.pointer_refs[0].pointer_kind,
            pointer_only: false,
          },
        ],
      }),
    });
  const privacyInclusionValidation =
    validateAndNormalizeCodexPerspectiveCandidateDraft({
      former_input_packet: context.formerInputPacket,
      draft: buildCanonicalLocalDraft(context, {
        privacy_flags: {
          raw_payloads_included: true,
          unsafe_input_material_omitted: false,
          omitted_unsafe_fields: [],
        },
      }),
    });
  const privacyAliasAlignment =
    alignCodexPerspectiveCandidateDraftSchemaFromModelOutput({
      former_input_packet: context.formerInputPacket,
      draft: buildCanonicalLocalDraft(context, {
        privacy_flags: {
          private_material_included: true,
        },
      }),
    });
  const passed =
    trueAuthorityFit.status === "violates_contract" &&
    trueAuthorityValidation.status === "blocked" &&
    unsafeFit.status === "violates_contract" &&
    unsafeValidation.status === "blocked" &&
    splitMarkerValidation.status === "blocked" &&
    nonPointerAlignment.alignment_status === "blocked" &&
    privacyInclusionValidation.status === "blocked" &&
    privacyAliasAlignment.alignment_status === "blocked" &&
    assertNoUnsafeMarkerText("unsafe authority regression summary", {
      trueAuthorityFit: summarizeContractFit(trueAuthorityFit),
      trueAuthorityValidation:
        summarizeValidationResult(trueAuthorityValidation),
      unsafeFit: summarizeContractFit(unsafeFit),
      unsafeValidation: summarizeValidationResult(unsafeValidation),
      splitMarkerValidation: summarizeValidationResult(splitMarkerValidation),
      nonPointerAlignment: summarizeAlignment(nonPointerAlignment),
      privacyInclusionValidation: summarizeValidationResult(
        privacyInclusionValidation,
      ),
      privacyAliasAlignment: summarizeAlignment(privacyAliasAlignment),
    });

  return {
    scenario_id: "unsafe_authority_regression",
    title: "Unsafe Authority Regression",
    fixture_label: "true authority, unsafe marker, non-pointer, and privacy inclusion controls",
    true_authority_contract_fit: summarizeContractFit(trueAuthorityFit),
    true_authority_validation:
      summarizeValidationResult(trueAuthorityValidation),
    unsafe_contract_fit: summarizeContractFit(unsafeFit),
    unsafe_validation: summarizeValidationResult(unsafeValidation),
    split_marker_validation: summarizeValidationResult(splitMarkerValidation),
    non_pointer_alignment: summarizeAlignment(nonPointerAlignment),
    privacy_inclusion_validation: summarizeValidationResult(
      privacyInclusionValidation,
    ),
    privacy_alias_alignment: summarizeAlignment(privacyAliasAlignment),
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : [
          "unsafe/authority regression controls did not block or reject as expected",
        ],
    dogfood_notes: [
      "True authority flags block local validation.",
      "Unsafe marker strings and split-marker policy material block local validation without copying unsafe text into public artifacts.",
      "Non-pointer evidence aliases and privacy inclusion true values block through alignment or validation.",
    ],
  };
}

function buildCanonicalLocalDraft(context, overrides = {}) {
  const sourceBundle = context.formerInputPacket.source_formation_input_bundle;

  return {
    draft_version: "codex_perspective_candidate_draft.v0.1",
    draft_kind: "codex_perspective_candidate_draft",
    source_former_input_packet: {
      packet_version: context.formerInputPacket.packet_version,
      packet_id: context.formerInputPacket.packet_id,
      role: context.formerInputPacket.role,
    },
    thesis:
      "The useful neutral perspective beyond a plain summary is that the prompt contract should now make canonical local schema the easiest path while #484 alignment stays as a safety net.",
    selected_material: {
      changed_files: [...sourceBundle.changed_files],
      changed_files_summary: sourceBundle.changed_files_summary,
      work_id: sourceBundle.work_id,
      source_pr_refs: [...sourceBundle.source_pr_refs],
    },
    evidence_pointer_refs: context.formerInputPacket.pointer_refs
      .slice(0, 3)
      .map((pointer) => ({
        pointer_kind: pointer.pointer_kind,
        pointer_semantics: "pointer_only",
        ref: pointer.ref,
      })),
    unresolved_tensions: [
      {
        tension_kind: "unresolved_gap",
        summary:
          "A new real transcript still needs to test whether the refined prompt reduces alias drift.",
        source_ref: "gap:new-real-transcript-after-canonical-prompt",
      },
    ],
    basis_quality_suggestion: {
      status: "needs_review",
      reasons: [
        "The source packet records skipped new-transcript capture.",
        "This canonical fixture is local draft/review material only.",
      ],
    },
    next_action_candidates: [
      {
        action_id: "review_candidate",
        summary: "Review the canonical draft shape before any follow-up.",
      },
      {
        action_id: "fix_input_gaps",
        summary:
          "Capture one new bounded transcript to test alias drift reduction.",
      },
    ],
    user_core_decision_questions: [
      "Should the next PR capture a new transcript with the refined prompt contract?",
    ],
    qualification_notes: [
      "This draft is useful beyond a plain summary because it turns #484 alignment findings into a prompt-contract validation boundary.",
      "It remains needs_review until a new real transcript is captured.",
    ],
    privacy_flags: {
      raw_payloads_included: false,
      unsafe_input_material_omitted:
        context.formerInputPacket.privacy_constraints
          .unsafe_input_material_omitted,
      omitted_unsafe_fields: [
        ...context.formerInputPacket.privacy_constraints.omitted_unsafe_fields,
      ],
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

function evaluateDogfood(scenarios) {
  const promptText = requireScenario(
    scenarios,
    "prompt_contract_canonical_schema_text",
  );
  const canonicalDraft = requireScenario(
    scenarios,
    "canonical_draft_fixture_passes_without_alignment",
  );
  const oldAlias = requireScenario(scenarios, "old_alias_draft_still_aligns");

  return {
    conclusion: deriveCanonicalSchemaConclusion(scenarios),
    recommended_next_pr_title: CANONICAL_SCHEMA_RECOMMENDED_NEXT_PR,
    scenario_conclusions: scenarios.map((scenario) => ({
      scenario_id: scenario.scenario_id,
      conclusion: scenario.conclusion,
    })),
    answered_questions: {
      what_pr_483_found:
        "PR #483 found that one real human-started Codex former response was useful but alias-shaped, so strict local validation blocked before alignment.",
      what_pr_484_aligned:
        "PR #484 aligned selected_material aliases, pointer ref_type/pointer_only aliases, model-friendly false authority names, false privacy inclusion aliases, object questions, and alias-shaped actions/tensions into canonical local draft schema.",
      prompt_canonical_schema_changes:
        "The prompt now names the canonical selected_material, evidence pointer, authority, privacy, user question, next action, and unresolved tension shapes directly.",
      aliases_future_responses_should_stop_emitting:
        "changed_file_paths, plain_summary_facts, neutral_perspective_basis, ref_type, pointer_only, creates_* authority names, approval/mutation/execution authority aliases, raw/private/provider/token/billing/API privacy inclusion aliases, hidden[_]reasoning inclusion alias, object user questions, id/why_next actions, and id/why_it_matters tensions.",
      what_alignment_still_supports:
        oldAlias.alignment?.applied_mappings?.join(", ") ?? "not evaluated",
      canonical_fixture_result:
        `contract fit ${canonicalDraft.contract_fit.status}; validation ${canonicalDraft.validation_result.status}; candidate authority ${canonicalDraft.candidate_review_material?.authority ?? "none"}`,
      old_alias_alignment_result:
        `original contract fit ${oldAlias.original_contract_fit.status}; alignment ${oldAlias.alignment.alignment_status}; validation ${oldAlias.validation_result?.status ?? "none"}`,
      new_real_transcript_captured: "No.",
      why_browser_computer_use_not_run: browserComputerUseValidationNote,
      next: CANONICAL_SCHEMA_RECOMMENDED_NEXT_PR,
      required_prompt_snippet_count: String(promptText.canonical_snippet_count),
    },
  };
}

function renderArtifact({ evaluation, scenarios }) {
  const promptText = requireScenario(
    scenarios,
    "prompt_contract_canonical_schema_text",
  );
  const manualCopy = requireScenario(
    scenarios,
    "manual_copy_packet_prompt_uses_canonical_contract",
  );
  const canonicalDraft = requireScenario(
    scenarios,
    "canonical_draft_fixture_passes_without_alignment",
  );
  const oldAlias = requireScenario(scenarios, "old_alias_draft_still_aligns");
  const unsafeAuthority = requireScenario(
    scenarios,
    "unsafe_authority_regression",
  );
  const reportScenario = requireScenario(
    scenarios,
    "alias_free_prompt_dogfood_report",
  );
  const lines = [
    "# Perspective Codex Former Prompt Contract Canonical Schema",
    "",
    `Generated at: ${CANONICAL_SCHEMA_GENERATED_AT}`,
    `Conclusion: ${evaluation.conclusion}`,
    `Recommended next implementation PR title: ${evaluation.recommended_next_pr_title}`,
    "",
    "## Summary",
    "",
    "This pure local dogfood/report/smoke slice follows merged PR #484 by refining the Codex former prompt contract so future drafts are steered toward canonical local CodexPerspectiveCandidateDraft schema directly.",
    "It does not remove #484 alignment. Alignment remains the safety net for old or drifted model-shaped output.",
    "",
    "## What PR #483 Found",
    "",
    evaluation.answered_questions.what_pr_483_found,
    "",
    "## What PR #484 Aligned",
    "",
    evaluation.answered_questions.what_pr_484_aligned,
    "",
    "## Prompt Canonical Schema Changes",
    "",
    evaluation.answered_questions.prompt_canonical_schema_changes,
    "",
    "## Aliases Future Responses Should Stop Emitting",
    "",
    evaluation.answered_questions.aliases_future_responses_should_stop_emitting,
    "",
    "## What Alignment Still Supports",
    "",
    evaluation.answered_questions.what_alignment_still_supports,
    "",
    "## Canonical Fixture Result",
    "",
    `Prompt snippets checked: ${promptText.canonical_snippet_count}`,
    `Manual copy status: ${manualCopy.copy_status}`,
    `Canonical contract fit: ${canonicalDraft.contract_fit.status}`,
    `Canonical validation status: ${canonicalDraft.validation_result.status}`,
    `Canonical candidate authority: ${canonicalDraft.candidate_review_material?.authority ?? "not available"}`,
    "",
    "## Old Alias Alignment Result",
    "",
    `Old alias original contract fit: ${oldAlias.original_contract_fit.status}`,
    `Old alias alignment status: ${oldAlias.alignment.alignment_status}`,
    `Old alias aligned contract fit: ${oldAlias.aligned_contract_fit?.status ?? "not available"}`,
    `Old alias validation status: ${oldAlias.validation_result?.status ?? "not available"}`,
    "",
    "## Unsafe And Authority Regression",
    "",
    `True authority validation: ${unsafeAuthority.true_authority_validation.status}`,
    `Unsafe marker validation: ${unsafeAuthority.unsafe_validation.status}`,
    `Split-marker validation: ${unsafeAuthority.split_marker_validation.status}`,
    `Non-pointer alignment: ${unsafeAuthority.non_pointer_alignment.alignment_status}`,
    `Privacy inclusion validation: ${unsafeAuthority.privacy_inclusion_validation.status}`,
    `Privacy alias alignment: ${unsafeAuthority.privacy_alias_alignment.alignment_status}`,
    "",
    "## New Real Transcript Captured",
    "",
    reportScenario.new_real_transcript_captured ? "Yes." : "No.",
    "",
    "## Browser/Computer-Use Validation",
    "",
    reportScenario.browser_or_computer_use_validation.reason,
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
    "## Authority Boundary",
    "",
    authorityBoundary,
    "",
    "## Verification",
    "",
    "- npm run typecheck",
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
    "- New real transcript capture: skipped because this PR only refines the prompt contract after #484 alignment findings.",
    "- DB validation: skipped because this PR adds no DB schema, persistence path, or state writer.",
    "- Provider/model validation: skipped because this PR intentionally does not call Codex, OpenAI, provider/model APIs, or SDKs.",
    "",
    "## What Codex Did Not Do",
    "",
    "Codex did not call Codex from implementation, execute Codex from Augnes, call the Codex SDK, call OpenAI/provider/model APIs from implementation, call GitHub APIs from implementation behavior, use implementation network behavior, write DB state, add runtime routes, add UI, add clipboard automation, create proof/evidence/readiness records, approve, merge, publish, retry, replay, deploy, or make Core decisions.",
    "",
    "## Next",
    "",
    CANONICAL_SCHEMA_RECOMMENDED_NEXT_PR,
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
    "",
    "Dogfood notes:",
    ...formatList(scenario.dogfood_notes),
    "",
  ];
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

function formatList(values) {
  return values.length > 0
    ? values.map((value) => `- ${value}`)
    : ["- none"];
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
  if (/\bsecret\b/i.test(serialized)) {
    throw new Error(`${label} includes unsafe marker`);
  }

  return true;
}

function writeReportFile(path, contents) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runPerspectiveCodexFormerPromptContractCanonicalSchemaDogfood();
}
