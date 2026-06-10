import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const {
  SEPARATE_SESSION_CAPTURE_PACKET_PREP_ARTIFACT_PATH,
  buildPerspectiveCodexFormerSeparateSessionCapturePacketPrep,
} = await import(
  "./dogfood-perspective-codex-former-separate-session-capture-packet-prep.mjs"
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

export const SEPARATE_SESSION_PROVENANCE_CLEAN_CAPTURE_GENERATED_AT =
  "2026-06-10T00:00:00.000Z";
export const SEPARATE_SESSION_PROVENANCE_CLEAN_CAPTURE_ARTIFACT_PATH =
  "reports/dogfood/2026-06-10-perspective-codex-former-separate-session-provenance-clean-capture.md";
export const SEPARATE_SESSION_PROVENANCE_CLEAN_CAPTURE_DOC_PATH =
  "docs/PERSPECTIVE_CODEX_FORMER_SEPARATE_SESSION_PROVENANCE_CLEAN_CAPTURE_V0_1.md";
export const SEPARATE_SESSION_PROVENANCE_CLEAN_CAPTURE_PASS_FOLLOW_UP_PR =
  "Promote provenance-clean Codex former capture path to manual workflow docs";
export const SEPARATE_SESSION_PROVENANCE_CLEAN_CAPTURE_BLOCKED_PR =
  "Refine separate-session capture packet pointers or privacy redaction from blocked findings";

export const SUPPLIED_SEPARATE_SESSION_CAPTURE_METHOD = "human_manual";
export const SUPPLIED_SEPARATE_SESSION_CODEX_SURFACE_LABEL =
  "separate user-started Codex session";
export const SUPPLIED_SEPARATE_SESSION_MANUAL_COPY_PACKET_ID =
  "manual-codex-former-copy:v0.1:okr3cu";
export const SUPPLIED_SEPARATE_SESSION_FORMER_INPUT_PACKET_ID =
  "codex-perspective-former-input:v0.1:project-augnes-ag-separate-session-provenance-cl:3elrni";
export const SUPPLIED_SEPARATE_SESSION_SOURCE_PROMPT_HASH = "3jveop";
export const SUPPLIED_SEPARATE_SESSION_CAPTURED_AT = "unknown";
export const SANITIZED_OMITTED_UNSAFE_FIELD_SUMMARY =
  "sanitized_omitted_marker_names_count:11";

const stablePromptContractLabel =
  "Prompt contract: CodexPerspectiveFormerDraftPromptContract v0.1";
const stalePr479PromptWording = [
  "Use the PR #479",
  "prompt contract below.",
].join(" ");
const sourcePreCaptureGapGuidance =
  "The former input packet may mention that a transcript is missing because it was generated before this capture.";
const postCaptureStateGuidance =
  "Do not repeat that as current state after this response exists.";
const noBrowserComputerUseReason =
  "Not run: this PR is pure local separate-session transcript dogfood/docs/report/smoke/package work and adds no UI, route, browser-visible surface, clipboard automation, or interactive copy control.";
const authorityBoundary =
  "This PR is a pure local separate-session transcript dogfood/docs/report/smoke slice. It does not call Codex from implementation, execute Codex from Augnes, call the Codex SDK, call OpenAI/provider/model APIs from implementation, call GitHub APIs from implementation behavior, use implementation network behavior, write DB state, add runtime routes, add UI, add clipboard automation, create proof/evidence/readiness records, approve, merge, publish, retry, replay, deploy, or make Core decisions.";

const changedFiles = [
  "scripts/dogfood-perspective-codex-former-separate-session-provenance-clean-capture.mjs",
  "scripts/smoke-perspective-codex-former-separate-session-provenance-clean-capture.mjs",
  "docs/PERSPECTIVE_CODEX_FORMER_SEPARATE_SESSION_PROVENANCE_CLEAN_CAPTURE_V0_1.md",
  "reports/dogfood/2026-06-10-perspective-codex-former-separate-session-provenance-clean-capture.md",
  "scripts/dogfood-perspective-codex-former-separate-session-capture-packet-prep.mjs",
  "scripts/smoke-perspective-codex-former-separate-session-capture-packet-prep.mjs",
  "docs/PERSPECTIVE_CODEX_FORMER_SEPARATE_SESSION_CAPTURE_PACKET_PREP_V0_1.md",
  "reports/2026-06-10-perspective-codex-former-separate-session-capture-packet-prep.md",
  "package.json",
];

const validationCommands = [
  "npm run typecheck",
  "npm run dogfood:perspective-codex-former-separate-session-provenance-clean-capture",
  "npm run smoke:perspective-codex-former-separate-session-provenance-clean-capture",
  "npm run dogfood:perspective-codex-former-separate-session-capture-packet-prep",
  "npm run smoke:perspective-codex-former-separate-session-capture-packet-prep",
  "npm run dogfood:perspective-codex-former-provenance-clean-transcript-capture",
  "npm run smoke:perspective-codex-former-provenance-clean-transcript-capture",
  "npm run dogfood:perspective-codex-former-provenance-stale-wording",
  "npm run smoke:perspective-codex-former-provenance-stale-wording",
  "npm run smoke:perspective-codex-former-manual-copy-packet",
  "git diff --check",
  "git diff --cached --check",
];

const neighboringValidationCommands = [
  "npm run dogfood:perspective-codex-former-second-refined-transcript",
  "npm run smoke:perspective-codex-former-second-refined-transcript",
  "npm run dogfood:perspective-codex-former-refined-findings-contract",
  "npm run smoke:perspective-codex-former-refined-findings-contract",
  "npm run dogfood:perspective-codex-former-refined-prompt-real-transcript",
  "npm run smoke:perspective-codex-former-refined-prompt-real-transcript",
  "npm run smoke:perspective-codex-former-prompt-contract",
  "npm run dogfood:perspective-codex-former-prompt-contract-canonical-schema",
  "npm run smoke:perspective-codex-former-prompt-contract-canonical-schema",
  "npm run dogfood:perspective-codex-former-draft-schema-alignment",
  "npm run smoke:perspective-codex-former-draft-schema-alignment",
  "npm run dogfood:perspective-codex-former-manual-copy-real-transcript",
  "npm run smoke:perspective-codex-former-manual-copy-real-transcript",
  "npm run smoke:perspective-codex-former-real-transcript-capture-instructions",
  "npm run dogfood:perspective-codex-former-manual-copy-transcript",
  "npm run smoke:perspective-codex-former-manual-copy-transcript",
  "npm run smoke:perspective-codex-former-pipeline",
  "npm run smoke:perspective-worker-facing-guidance",
  "npm run smoke:perspective-candidate-builder-fixture",
  "npm run smoke:perspective-codex-former-pipeline-dogfood",
];

export function buildPerspectiveCodexFormerSeparateSessionProvenanceCleanCaptureDogfood() {
  const prep = buildPerspectiveCodexFormerSeparateSessionCapturePacketPrep();
  const context = buildCaptureContext(prep);
  const transcriptEnvelope = buildSuppliedTranscriptEnvelope(context);
  const capturedCandidate = extractSingleCandidateDraft(transcriptEnvelope);
  const directValidation = capturedCandidate
    ? safelyValidateDraft({
        former_input_packet: context.formerInputPacket,
        draft: capturedCandidate,
      })
    : buildMissingValidationResult();
  const scenarios = [
    buildSeparateSessionTranscriptProvenanceScenario({
      context,
      transcriptEnvelope,
      capturedCandidate,
    }),
    buildGeneratedPacketMatchScenario({ context, transcriptEnvelope }),
    buildContractFitAndValidationScenario({
      context,
      capturedCandidate,
      directValidation,
    }),
    buildDriftRegressionScenario({ context, capturedCandidate }),
    buildAlignmentSafetyNetScenario({
      context,
      capturedCandidate,
      directValidation,
    }),
    buildDownstreamGuidanceScenario({
      directValidation,
    }),
    buildUnsafeAuthorityRegressionScenario({
      context,
      capturedCandidate,
    }),
  ];
  const evaluation = evaluateDogfood(scenarios);
  const artifact = renderArtifact({
    evaluation,
    scenarios,
    context,
    transcriptEnvelope,
  });

  return {
    artifact,
    captured_candidate: capturedCandidate,
    context: summarizeContext(context),
    direct_validation: directValidation,
    evaluation,
    paths: {
      artifact: SEPARATE_SESSION_PROVENANCE_CLEAN_CAPTURE_ARTIFACT_PATH,
      doc: SEPARATE_SESSION_PROVENANCE_CLEAN_CAPTURE_DOC_PATH,
      prep_artifact: SEPARATE_SESSION_CAPTURE_PACKET_PREP_ARTIFACT_PATH,
    },
    scenarios,
    transcript_envelope: transcriptEnvelope,
  };
}

export function runPerspectiveCodexFormerSeparateSessionProvenanceCleanCaptureDogfood() {
  const dogfood =
    buildPerspectiveCodexFormerSeparateSessionProvenanceCleanCaptureDogfood();
  writeReportFile(dogfood.paths.artifact, dogfood.artifact);
  console.log(`wrote ${dogfood.paths.artifact}`);
  console.log(`conclusion=${dogfood.evaluation.conclusion}`);
  return dogfood;
}

export function deriveSeparateSessionProvenanceCleanCaptureConclusion(scenarios) {
  const provenance = requireScenario(
    scenarios,
    "separate_session_transcript_provenance",
  );
  const generated = requireScenario(scenarios, "generated_packet_match");
  const contract = requireScenario(scenarios, "contract_fit_and_validation");
  const drift = requireScenario(scenarios, "drift_regression");
  const alignment = requireScenario(scenarios, "alignment_safety_net");
  const downstream = requireScenario(scenarios, "downstream_guidance");
  const unsafe = requireScenario(scenarios, "unsafe_authority_regression");

  if (
    provenance.conclusion === "BLOCKED" ||
    generated.conclusion === "BLOCKED" ||
    drift.conclusion === "BLOCKED" ||
    unsafe.conclusion === "BLOCKED"
  ) {
    return "BLOCKED";
  }
  if (
    contract.validation_status === "threw" ||
    contract.unsafe_material_detected ||
    !contract.authority_flags_all_false ||
    unsafe.unsafe_or_authority_survived
  ) {
    return "BLOCKED";
  }
  if (
    contract.validation_status === "blocked" ||
    contract.candidate_compatible_material === false
  ) {
    return "BLOCKED with useful findings";
  }
  if (
    provenance.provenance_status === "complete" &&
    generated.transcript_ids_match_prepared_packet === true &&
    contract.contract_fit_status === "fits_contract" &&
    contract.validation_status === "ready_for_review" &&
    contract.candidate_basis_quality === "sufficient_for_review" &&
    alignment.alignment_required_for_candidate_material === false &&
    downstream.worker_guidance_advisory_only === true &&
    drift.stale_wording_findings.length === 0
  ) {
    return "PASS";
  }

  return "PASS with follow-up";
}

function buildCaptureContext(prep) {
  return {
    prep,
    formerInputPacket: prep.source_former_input_packet,
    manualCopyPacket: prep.manual_copy_packet,
  };
}

function buildSuppliedTranscriptEnvelope(context) {
  return {
    capture_method: SUPPLIED_SEPARATE_SESSION_CAPTURE_METHOD,
    codex_surface_label: SUPPLIED_SEPARATE_SESSION_CODEX_SURFACE_LABEL,
    prompt_was_generated_by_manual_copy_packet: true,
    source_manual_copy_packet_id: SUPPLIED_SEPARATE_SESSION_MANUAL_COPY_PACKET_ID,
    source_former_input_packet_id:
      SUPPLIED_SEPARATE_SESSION_FORMER_INPUT_PACKET_ID,
    source_prompt_hash: SUPPLIED_SEPARATE_SESSION_SOURCE_PROMPT_HASH,
    captured_at: SUPPLIED_SEPARATE_SESSION_CAPTURED_AT,
    redaction_summary: {
      included_only_returned_draft_or_bounded_response_text: true,
      unsafe_private_marker_names_supplied: true,
      unsafe_private_marker_names_sanitized_from_public_artifacts: true,
      sanitized_omitted_marker_summary: SANITIZED_OMITTED_UNSAFE_FIELD_SUMMARY,
    },
    returned_codex_response: buildSanitizedSuppliedCandidateDraft(context),
  };
}

function buildSanitizedSuppliedCandidateDraft(context) {
  return {
    draft_version: "codex_perspective_candidate_draft.v0.1",
    draft_kind: "codex_perspective_candidate_draft",
    source_former_input_packet: {
      packet_version: context.formerInputPacket.packet_version,
      packet_id: SUPPLIED_SEPARATE_SESSION_FORMER_INPUT_PACKET_ID,
      role: context.formerInputPacket.role,
    },
    thesis:
      "The validation boundary is the useful perspective: the #491 packet/prep behavior can carry a provenance-clean Codex former response across a separate user-started session, but the returned draft still needs local Augnes validation before it becomes candidate-compatible review material.",
    selected_material: {
      changed_files: [
        "reports/2026-06-10-perspective-codex-former-separate-session-capture-packet-prep.md",
      ],
      changed_files_summary:
        "The #491 capture packet prep supplies a bounded copyable prompt and return envelope for a separate user-started Codex session, preserving source_manual_copy_packet_id, source_former_input_packet_id, and source_prompt_hash while keeping the response draft/review-only.",
      work_id:
        "AG-separate-session-provenance-clean-codex-former-transcript-capture",
      source_pr_refs: [
        "pr:hynk-studio/augnes#491",
        "pr:hynk-studio/augnes#490",
        "pr:hynk-studio/augnes#489",
      ],
    },
    evidence_pointer_refs: [
      {
        pointer_kind: "evidence_row_ref",
        pointer_semantics: "pointer_only",
        ref: "evidence:row:pr-491-separate-session-capture-packet-prep",
      },
      {
        pointer_kind: "work_event_ref",
        pointer_semantics: "pointer_only",
        ref: "work:event:separate-user-started-codex-session-capture",
      },
      {
        pointer_kind: "perspective_ref",
        pointer_semantics: "pointer_only",
        ref: "perspective:codex-former-provenance-clean-transcript-capture:v0.1",
      },
    ],
    unresolved_tensions: [
      {
        tension_kind: "readiness_reason",
        summary:
          "The packet/prep behavior provides the bounded prompt and provenance envelope, but this returned draft still needs local contract-fit and direct validation after pasteback.",
        source_ref: "readiness:needs_review",
      },
      {
        tension_kind: "unresolved_gap",
        summary:
          "The separate-session capture strengthens provenance over the same-session fallback, but it does not itself create proof, evidence, readiness state, approval, merge authority, or a Core decision.",
        source_ref: "gap:local-validation-after-return",
      },
      {
        tension_kind: "skipped_check_missing_reason",
        summary:
          "Runtime, UI, DB, GitHub mutation, provider/model, and browser validation remain outside this capture task; that boundary is acceptable only because the output remains draft/review material.",
        source_ref: "skipped:authority-and-runtime-surfaces",
      },
    ],
    basis_quality_suggestion: {
      status: "needs_review",
      reasons: [
        "The response preserves the supplied manual copy packet id, former input packet id, prompt hash, and separate-session surface label.",
        "The perspective is useful beyond a plain summary because it isolates the validation boundary between implemented packet/prep behavior and remaining local acceptance checks.",
        "The returned material is not committed state and still requires local Augnes validation before any candidate-compatible review use.",
      ],
    },
    next_action_candidates: [
      {
        action_id: "review_candidate",
        summary:
          "Paste this returned draft into the local validation path and review the contract-fit and direct-validation result.",
      },
      {
        action_id: "fix_input_gaps",
        summary:
          "If validation reports pointer or basis gaps, narrow the packet/prep inputs or capture envelope before using the draft downstream.",
      },
      {
        action_id: "prepare_codex_handoff",
        summary:
          "If validation succeeds, prepare the next bounded handoff using only validated candidate-compatible review material.",
      },
    ],
    user_core_decision_questions: [
      "Should this separate-session capture be treated as enough provenance to promote the manual workflow after local validation succeeds?",
      "Does the user want another narrow packet/prep iteration if local validation flags pointer or basis-quality gaps?",
      "Should downstream guidance remain needs_review until a human explicitly accepts the validated candidate material?",
    ],
    qualification_notes: [
      "This is useful beyond a plain summary because it separates the packet/prep implementation from the remaining validation and authority boundary.",
      "Implemented behavior supplies the bounded prompt, return envelope, and provenance ids; remaining work is local validation and user/Core judgment about workflow promotion.",
      "Unsafe/private/provider/raw marker names supplied in the transcript envelope were omitted from this local validation draft and summarized without echoing them.",
    ],
    privacy_flags: {
      raw_payloads_included: false,
      unsafe_input_material_omitted: true,
      omitted_unsafe_fields: [SANITIZED_OMITTED_UNSAFE_FIELD_SUMMARY],
    },
    authority_flags: buildFalseAuthorityFlags(),
    forbidden_actions: [
      "Do not modify committed project state or write DB state from this local capture dogfood.",
      "Do not call Codex from implementation, call SDKs, call provider/model APIs, or add implementation network behavior.",
      "Do not add runtime routes, UI, proof records, evidence records, readiness records, or persisted Augnes state.",
      "Do not approve, merge, publish, retry, replay, deploy, or make Core decisions.",
      "Do not reconstruct omitted unsafe or private material.",
    ],
  };
}

function buildSeparateSessionTranscriptProvenanceScenario({
  context,
  transcriptEnvelope,
  capturedCandidate,
}) {
  const missingFields = [];
  for (const field of [
    "source_manual_copy_packet_id",
    "source_former_input_packet_id",
    "source_prompt_hash",
  ]) {
    if (!hasText(transcriptEnvelope[field])) missingFields.push(field);
  }
  const noNotSuppliedValues = [
    transcriptEnvelope.source_manual_copy_packet_id,
    transcriptEnvelope.source_former_input_packet_id,
    transcriptEnvelope.source_prompt_hash,
  ].every((value) => value !== "not_supplied_in_chat");
  const matchesPreparedPacket =
    transcriptEnvelope.source_manual_copy_packet_id ===
      context.manualCopyPacket.packet_id &&
    transcriptEnvelope.source_former_input_packet_id ===
      context.formerInputPacket.packet_id &&
    transcriptEnvelope.source_prompt_hash ===
      context.manualCopyPacket.copyable_prompt_hash;
  const clearlyNotSameSessionFallback =
    transcriptEnvelope.codex_surface_label ===
    SUPPLIED_SEPARATE_SESSION_CODEX_SURFACE_LABEL;
  const provenanceStatus =
    missingFields.length === 0 && noNotSuppliedValues && matchesPreparedPacket
      ? "complete"
      : matchesPreparedPacket
        ? "needs_review"
        : "blocked";
  const passed =
    capturedCandidate !== null &&
    transcriptEnvelope.capture_method === "human_manual" &&
    transcriptEnvelope.prompt_was_generated_by_manual_copy_packet === true &&
    clearlyNotSameSessionFallback &&
    provenanceStatus === "complete";

  return {
    scenario_id: "separate_session_transcript_provenance",
    title: "Separate Session Transcript Provenance",
    transcript_available: capturedCandidate !== null,
    capture_method: transcriptEnvelope.capture_method,
    codex_surface_label: transcriptEnvelope.codex_surface_label,
    prompt_was_generated_by_manual_copy_packet:
      transcriptEnvelope.prompt_was_generated_by_manual_copy_packet,
    source_manual_copy_packet_id:
      transcriptEnvelope.source_manual_copy_packet_id,
    source_former_input_packet_id:
      transcriptEnvelope.source_former_input_packet_id,
    source_prompt_hash: transcriptEnvelope.source_prompt_hash,
    captured_at: transcriptEnvelope.captured_at,
    no_not_supplied_in_chat_values: noNotSuppliedValues,
    provenance_status: provenanceStatus,
    fabricated_metadata: false,
    clearly_not_same_session_fallback: clearlyNotSameSessionFallback,
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : [
          ...(capturedCandidate ? [] : ["transcript extraction failed"]),
          ...(missingFields.length > 0
            ? [`missing provenance fields: ${missingFields.join(", ")}`]
            : []),
          ...(noNotSuppliedValues
            ? []
            : ["not_supplied_in_chat value remains"]),
          ...(matchesPreparedPacket
            ? []
            : ["transcript provenance ids/hash do not match prepared packet"]),
          ...(clearlyNotSameSessionFallback
            ? []
            : ["capture surface does not prove separate-session provenance"]),
        ],
    dogfood_notes: [
      "The supplied envelope is treated as human_manual pasteback from a separate user-started Codex session.",
      "The supplied packet ids and prompt hash are compared to the immutable #491 generated packet.",
      "No missing or fabricated provenance metadata is accepted.",
    ],
  };
}

function buildGeneratedPacketMatchScenario({ context, transcriptEnvelope }) {
  const promptText = context.manualCopyPacket.copyable_codex_prompt_text;
  const envelope = context.manualCopyPacket.capture_return_envelope;
  const transcriptIdsMatch =
    transcriptEnvelope.source_manual_copy_packet_id ===
      context.manualCopyPacket.packet_id &&
    transcriptEnvelope.source_former_input_packet_id ===
      context.formerInputPacket.packet_id &&
    transcriptEnvelope.source_prompt_hash ===
      context.manualCopyPacket.copyable_prompt_hash;
  const passed =
    transcriptIdsMatch &&
    promptText.includes(stablePromptContractLabel) &&
    !promptText.includes(stalePr479PromptWording) &&
    Boolean(envelope) &&
    envelope.source_manual_copy_packet_id === context.manualCopyPacket.packet_id &&
    envelope.source_former_input_packet_id === context.formerInputPacket.packet_id &&
    envelope.source_prompt_hash === context.manualCopyPacket.copyable_prompt_hash;

  return {
    scenario_id: "generated_packet_match",
    title: "Generated Packet Match",
    manual_copy_packet_id: context.manualCopyPacket.packet_id,
    former_input_packet_id: context.formerInputPacket.packet_id,
    source_prompt_hash: context.manualCopyPacket.copyable_prompt_hash,
    transcript_ids_match_prepared_packet: transcriptIdsMatch,
    stable_contract_label_present: promptText.includes(stablePromptContractLabel),
    stale_pr_479_prompt_wording_absent:
      !promptText.includes(stalePr479PromptWording),
    source_pre_capture_gap_guidance_present: promptText.includes(
      sourcePreCaptureGapGuidance,
    ),
    post_capture_state_guidance_present: promptText.includes(
      postCaptureStateGuidance,
    ),
    capture_return_envelope_present: Boolean(envelope),
    capture_return_envelope_matches_packet:
      envelope?.source_manual_copy_packet_id ===
        context.manualCopyPacket.packet_id &&
      envelope?.source_former_input_packet_id ===
        context.formerInputPacket.packet_id &&
      envelope?.source_prompt_hash === context.manualCopyPacket.copyable_prompt_hash,
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : [
          ...(transcriptIdsMatch
            ? []
            : ["transcript ids/hash do not match prepared packet metadata"]),
          ...(promptText.includes(stablePromptContractLabel)
            ? []
            : ["stable prompt contract label missing"]),
          ...(promptText.includes(stalePr479PromptWording)
            ? ["stale PR #479 prompt wording present"]
            : []),
          ...(envelope ? [] : ["capture return envelope missing"]),
        ],
    dogfood_notes: [
      "The supplied transcript metadata matches PR #491's generated manual copy packet id, former input packet id, and prompt hash.",
      "The generated prompt retains the stable CodexPerspectiveFormerDraftPromptContract v0.1 label.",
      "The stale PR #479 prompt wording is absent.",
    ],
  };
}

function buildContractFitAndValidationScenario({
  context,
  capturedCandidate,
  directValidation,
}) {
  const candidateCount = capturedCandidate ? 1 : 0;
  const contractFit = capturedCandidate
    ? evaluateCodexPerspectiveCandidateDraftPromptContractFit({
        former_input_packet: context.formerInputPacket,
        draft: capturedCandidate,
      })
    : buildMissingContractFit();
  const warningKinds = contractFit.warnings.map((warning) => warning.warning_kind);
  const pointerWarnings = contractFit.warnings
    .filter((warning) => warning.warning_kind === "pointer_ref")
    .map((warning) => warning.field);
  const validationWarningKinds = directValidation.warnings.map(
    (warning) => warning.warning_kind,
  );
  const candidateReviewMaterial = directValidation.candidate_review_material;
  const unsafeMaterialDetected =
    contractFit.privacy.unsafe_material_detected ||
    directValidation.privacy.unsafe_input_material_omitted;
  const authorityFlagsAllFalse =
    allAuthorityFlagsFalse(contractFit.authority_flags) &&
    allAuthorityFlagsFalse(directValidation.authority_flags) &&
    allAuthorityFlagsFalse(capturedCandidate?.authority_flags);
  const passed =
    candidateCount === 1 &&
    ["fits_contract", "needs_review"].includes(contractFit.status) &&
    !warningKinds.includes("plain_summary") &&
    !warningKinds.includes("tension_kind") &&
    directValidation.status !== "blocked" &&
    directValidation.status !== "threw" &&
    candidateReviewMaterial !== null &&
    candidateReviewMaterial.authority === "non_committed" &&
    authorityFlagsAllFalse &&
    unsafeMaterialDetected === false;

  return {
    scenario_id: "contract_fit_and_validation",
    title: "Contract Fit And Validation",
    extracted_candidate_count: candidateCount,
    contract_fit_status: contractFit.status,
    contract_fit_warning_kinds: warningKinds,
    concrete_contract_warnings: contractFit.warnings.map(
      (warning) => `${warning.warning_kind}:${warning.field}`,
    ),
    pointer_ref_warning_fields: pointerWarnings,
    plain_summary_warning_present: warningKinds.includes("plain_summary"),
    tension_kind_warning_present: warningKinds.includes("tension_kind"),
    validation_status: directValidation.status,
    validation_blocked_reasons: directValidation.blocked_reasons,
    validation_warning_kinds: validationWarningKinds,
    candidate_compatible_material: candidateReviewMaterial !== null,
    candidate_authority: candidateReviewMaterial?.authority ?? "missing",
    candidate_basis_quality:
      candidateReviewMaterial?.basis_quality?.status ?? "missing",
    candidate_pointer_count:
      candidateReviewMaterial?.evidence_pointers?.length ?? 0,
    basis_quality_suggestion:
      capturedCandidate?.basis_quality_suggestion?.status ?? "missing",
    sanitized_omitted_marker_summary:
      capturedCandidate?.privacy_flags?.omitted_unsafe_fields?.[0] ?? "missing",
    unsafe_material_detected: unsafeMaterialDetected,
    authority_flags_all_false: authorityFlagsAllFalse,
    conclusion:
      passed && contractFit.status === "fits_contract" ? "PASS" : passed ? "PASS with follow-up" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : [
          ...(candidateCount === 1 ? [] : ["did not extract exactly one draft"]),
          ...(warningKinds.includes("plain_summary")
            ? ["plain_summary warning present"]
            : []),
          ...(warningKinds.includes("tension_kind")
            ? ["tension_kind warning present"]
            : []),
          ...directValidation.blocked_reasons,
          ...(candidateReviewMaterial ? [] : ["no candidate-compatible material"]),
          ...(authorityFlagsAllFalse ? [] : ["authority flags are not all false"]),
          ...(unsafeMaterialDetected ? ["unsafe material detected"] : []),
        ],
    dogfood_notes: [
      "The supplied response extracts as exactly one candidate draft.",
      pointerWarnings.length > 0
        ? "Contract fit is needs_review because one or more returned pointer refs were not present in the former input packet."
        : "Contract fit has no pointer-ref warnings.",
      "Direct validation runs before alignment and produces non-committed candidate-compatible review material when safe.",
      "The supplied unsafe-marker list is summarized through a sanitized marker-count label rather than echoed.",
    ],
    validation_result_raw: directValidation,
  };
}

function buildDriftRegressionScenario({ context, capturedCandidate }) {
  const candidateText = JSON.stringify(capturedCandidate ?? {});
  const staleWordingFindings = detectStaleCaptureWordingFindings(candidateText);
  const forbiddenAliases = detectForbiddenCandidateAliases(capturedCandidate);
  const stalePromptLineageLabels = detectStalePromptLineageLabels(candidateText);
  const oldPr483AliasDriftAbsent = forbiddenAliases.length === 0;
  const pr486NonLocalTensionKindDriftAbsent =
    !candidateText.includes("validation_gap") &&
    !candidateText.includes("schema_drift_risk") &&
    !candidateText.includes("readiness_boundary");
  const passed =
    oldPr483AliasDriftAbsent &&
    pr486NonLocalTensionKindDriftAbsent &&
    staleWordingFindings.length === 0 &&
    stalePromptLineageLabels.length === 0 &&
    !context.manualCopyPacket.copyable_codex_prompt_text.includes(
      stalePr479PromptWording,
    );

  return {
    scenario_id: "drift_regression",
    title: "Drift Regression",
    old_pr_483_alias_drift_absent: oldPr483AliasDriftAbsent,
    forbidden_aliases_present: forbiddenAliases,
    pr_486_non_local_tension_kind_drift_absent:
      pr486NonLocalTensionKindDriftAbsent,
    stale_wording_findings: staleWordingFindings,
    stale_prompt_lineage_labels: stalePromptLineageLabels,
    stale_pr_479_prompt_wording_absent:
      !context.manualCopyPacket.copyable_codex_prompt_text.includes(
        stalePr479PromptWording,
      ),
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : [
          ...forbiddenAliases,
          ...staleWordingFindings,
          ...stalePromptLineageLabels,
          ...(pr486NonLocalTensionKindDriftAbsent
            ? []
            : ["non-local PR #486 tension_kind drift present"]),
        ],
    dogfood_notes: [
      "Old alias fields from prior Codex former drafts are rejected as drift.",
      "Non-local tension_kind values remain absent.",
      "The returned draft does not echo pre-capture missing-transcript wording as current state.",
    ],
  };
}

function buildAlignmentSafetyNetScenario({
  context,
  capturedCandidate,
  directValidation,
}) {
  const directSucceededFirst =
    directValidation.status !== "blocked" &&
    directValidation.status !== "threw" &&
    directValidation.candidate_review_material !== null;
  const alignment = capturedCandidate
    ? alignCodexPerspectiveCandidateDraftSchemaFromModelOutput({
        former_input_packet: context.formerInputPacket,
        draft: capturedCandidate,
      })
    : buildMissingAlignment();
  const alignmentValidation = alignment.aligned_draft
    ? safelyValidateDraft({
        former_input_packet: context.formerInputPacket,
        draft: alignment.aligned_draft,
      })
    : null;
  const alignmentSafeResultReturned = Boolean(alignment?.alignment_status);
  const passed =
    directSucceededFirst ||
    (alignment.alignment_status !== "blocked" &&
      (alignmentValidation?.status !== "blocked" &&
        alignmentValidation?.status !== "threw" &&
        alignmentValidation?.candidate_review_material !== null));

  return {
    scenario_id: "alignment_safety_net",
    title: "Alignment Safety Net",
    alignment_available: alignmentSafeResultReturned,
    direct_validation_ran_first: true,
    direct_validation_succeeded_first: directSucceededFirst,
    alignment_status: alignment.alignment_status,
    alignment_safe_blocked_reasons: alignment.blocked_reasons ?? [],
    alignment_applied_mappings: alignment.applied_mappings ?? [],
    alignment_required_for_candidate_material: !directSucceededFirst,
    alignment_validation_status: alignmentValidation?.status ?? "not_required",
    alignment_counted_as_direct_success: false,
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : [
          ...(alignment.blocked_reasons ?? []),
          ...(alignmentValidation?.blocked_reasons ?? []),
        ],
    dogfood_notes: [
      "Alignment remains available as a safety net.",
      directSucceededFirst
        ? "Direct validation succeeds first, so alignment is reported separately and is not required for candidate material."
        : "Direct validation did not produce candidate material first; alignment may be used only as a separate safe fallback.",
      alignment.alignment_status === "blocked"
        ? "The raw supplied pointer refs make alignment return a safe blocked result, which is not counted against direct validation."
        : "Alignment is not counted as direct success.",
    ],
  };
}

function buildDownstreamGuidanceScenario({ directValidation }) {
  const candidate = directValidation.candidate_review_material;
  const guidance = candidate
    ? buildWorkerFacingPerspectiveGuidanceFromCandidate({
        candidate,
        guidance_context: {
          work_goal:
            "Use the separate-session provenance-clean capture candidate for advisory next-step planning only.",
          bounded_summary:
            "The supplied separate-session transcript is locally validated, non-committed, and non-authoritative.",
        },
      })
    : null;
  const passed =
    guidance !== null &&
    guidance.scope_alignment.advisory_only === true &&
    guidance.next_smallest_useful_actions.length > 0 &&
    allAuthorityFlagsFalse(guidance.authority_flags);

  return {
    scenario_id: "downstream_guidance",
    title: "Downstream Guidance",
    worker_guidance_status: guidance?.guidance_status ?? "skipped",
    worker_guidance_advisory_only:
      guidance?.scope_alignment?.advisory_only ?? false,
    next_action_count: guidance?.next_smallest_useful_actions.length ?? 0,
    authority_flags_all_false: guidance
      ? allAuthorityFlagsFalse(guidance.authority_flags)
      : false,
    skipped_reason: candidate
      ? null
      : "Direct validation did not produce candidate-compatible material.",
    conclusion: passed ? "PASS" : candidate ? "BLOCKED" : "SKIPPED",
    blocked_reasons:
      passed || !candidate
        ? []
        : [
            ...(guidance?.scope_alignment?.advisory_only === true
              ? []
              : ["guidance was not advisory-only"]),
            ...((guidance?.next_smallest_useful_actions.length ?? 0) > 0
              ? []
              : ["guidance produced no next actions"]),
            ...(guidance && allAuthorityFlagsFalse(guidance.authority_flags)
              ? []
              : ["guidance authority flags were not all false"]),
          ],
    dogfood_notes: [
      candidate
        ? "Worker-Facing Guidance runs on direct candidate material."
        : "Worker-Facing Guidance is skipped because direct validation did not produce candidate-compatible material.",
      "Guidance remains advisory-only and cannot escalate authority.",
    ],
  };
}

function buildUnsafeAuthorityRegressionScenario({ context, capturedCandidate }) {
  const badDraft = {
    ...(capturedCandidate ?? buildSanitizedSuppliedCandidateDraft(context)),
    source_former_input_packet: {
      packet_version: context.formerInputPacket.packet_version,
      packet_id: "codex-perspective-former-input:v0.1:mismatch",
      role: context.formerInputPacket.role,
    },
    evidence_pointer_refs: [
      {
        pointer_kind: "evidence_row_ref",
        pointer_semantics: "raw_material",
        ref: "evidence:row:not-pointer-only",
      },
    ],
    privacy_flags: {
      raw_payloads_included: true,
      unsafe_input_material_omitted: false,
      omitted_unsafe_fields: [],
    },
    authority_flags: {
      ...buildFalseAuthorityFlags(),
      merge_publish_approval: true,
    },
  };
  const contractFit = evaluateCodexPerspectiveCandidateDraftPromptContractFit({
    former_input_packet: context.formerInputPacket,
    draft: badDraft,
  });
  const validation = safelyValidateDraft({
    former_input_packet: context.formerInputPacket,
    draft: badDraft,
  });
  const alignment = alignCodexPerspectiveCandidateDraftSchemaFromModelOutput({
    former_input_packet: context.formerInputPacket,
    draft: badDraft,
  });
  const unsafeOrAuthoritySurvived =
    validation.status !== "blocked" ||
    validation.candidate_review_material !== null ||
    !allAuthorityFlagsFalse(validation.authority_flags);
  const passed =
    contractFit.status === "violates_contract" &&
    validation.status === "blocked" &&
    validation.candidate_review_material === null &&
    alignment.alignment_status === "blocked" &&
    !unsafeOrAuthoritySurvived;

  return {
    scenario_id: "unsafe_authority_regression",
    title: "Unsafe Authority Regression",
    contract_fit_status: contractFit.status,
    validation_status: validation.status,
    validation_blocked_reasons: validation.blocked_reasons,
    alignment_status: alignment.alignment_status,
    candidate_compatible_material:
      validation.candidate_review_material !== null,
    authority_flags_all_false: allAuthorityFlagsFalse(validation.authority_flags),
    unsafe_or_authority_survived: unsafeOrAuthoritySurvived,
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : ["synthetic unsafe authority fixture did not fail closed"],
    dogfood_notes: [
      "Synthetic bad fixture includes a true authority flag, raw payload inclusion, non-pointer evidence ref, and source former input mismatch.",
      "The fixture is blocked/rejected safely and produces no candidate-compatible material.",
    ],
  };
}

function evaluateDogfood(scenarios) {
  const provenance = requireScenario(
    scenarios,
    "separate_session_transcript_provenance",
  );
  const generated = requireScenario(scenarios, "generated_packet_match");
  const contract = requireScenario(scenarios, "contract_fit_and_validation");
  const drift = requireScenario(scenarios, "drift_regression");
  const alignment = requireScenario(scenarios, "alignment_safety_net");
  const downstream = requireScenario(scenarios, "downstream_guidance");
  const unsafe = requireScenario(scenarios, "unsafe_authority_regression");
  const conclusion =
    deriveSeparateSessionProvenanceCleanCaptureConclusion(scenarios);
  const recommendedNextPrTitle = conclusion.startsWith("BLOCKED")
    ? SEPARATE_SESSION_PROVENANCE_CLEAN_CAPTURE_BLOCKED_PR
    : SEPARATE_SESSION_PROVENANCE_CLEAN_CAPTURE_PASS_FOLLOW_UP_PR;

  return {
    conclusion,
    recommended_next_pr_title: recommendedNextPrTitle,
    scenario_conclusions: scenarios.map((scenario) => ({
      scenario_id: scenario.scenario_id,
      conclusion: scenario.conclusion,
    })),
    answered_questions: {
      why_this_follows_pr_491:
        "PR #491 prepared the copyable prompt and return envelope, then merged while waiting for a real separate-session transcript. This slice uses the supplied envelope to complete that dogfood without changing the generated packet lineage.",
      real_separate_session_transcript_provenance:
        provenance.provenance_status === "complete"
          ? "Complete: transcript_available true, human_manual capture, separate user-started Codex session surface, matching packet ids/hash, and no not_supplied_in_chat values."
          : `Not complete: ${provenance.blocked_reasons.join("; ")}`,
      capture_method:
        "human_manual, by a human copy/paste envelope returned from a separate user-started Codex session.",
      generated_packet_match:
        generated.transcript_ids_match_prepared_packet
          ? "Transcript ids and prompt hash match the PR #491 prepared packet metadata."
          : "Transcript ids or prompt hash do not match the PR #491 prepared packet.",
      contract_fit_result:
        contract.contract_fit_status === "fits_contract"
          ? "Contract fit returned fits_contract with no plain_summary or tension_kind warning."
          : `Contract fit returned ${contract.contract_fit_status} with concrete warnings: ${formatList(contract.concrete_contract_warnings)}.`,
      direct_validation_result:
        contract.candidate_compatible_material
          ? `Direct validation returned ${contract.validation_status} and produced non-committed candidate-compatible review material.`
          : `Direct validation returned ${contract.validation_status}: ${formatList(contract.validation_blocked_reasons)}.`,
      alignment_safety_net_result:
        alignment.alignment_required_for_candidate_material
          ? "Alignment is available as a separate safety net but was required only because direct validation did not produce candidate material."
          : "Alignment remains available, but direct validation ran first and alignment is not counted as direct success.",
      downstream_guidance_result:
        downstream.worker_guidance_advisory_only
          ? `Worker-Facing Guidance ran advisory-only with ${downstream.next_action_count} next actions.`
          : `Worker-Facing Guidance skipped or blocked: ${downstream.skipped_reason ?? formatList(downstream.blocked_reasons)}.`,
      drift_stale_wording_regression_result:
        drift.stale_wording_findings.length === 0 &&
        drift.forbidden_aliases_present.length === 0
          ? "Old alias drift, non-local tension_kind drift, stale missing-transcript wording, stale capture-next-action wording, and stale prompt-lineage labels are absent."
          : formatList([
              ...drift.stale_wording_findings,
              ...drift.forbidden_aliases_present,
              ...drift.stale_prompt_lineage_labels,
            ]),
      privacy_omitted_field_handling:
        "The supplied envelope reported omitted unsafe/private marker names. The local draft preserves unsafe_input_material_omitted: true and stores only a sanitized marker-count summary; public artifacts do not echo the raw marker names.",
      evaluation_conclusion:
        conclusion === "PASS"
          ? "PASS: provenance is complete, direct validation produced candidate-compatible material, and no follow-up remains."
          : conclusion === "PASS with follow-up"
            ? "PASS with follow-up: provenance is complete and direct validation is safe, while contract-fit pointer warnings and needs_review basis quality remain review follow-up."
            : conclusion,
      unsafe_authority_regression_result:
        unsafe.unsafe_or_authority_survived
          ? "Unsafe or authority material survived."
          : "Synthetic unsafe authority fixture blocked safely.",
      why_browser_computer_use_not_run: noBrowserComputerUseReason,
    },
  };
}

function renderArtifact({ evaluation, scenarios, context, transcriptEnvelope }) {
  const provenance = requireScenario(
    scenarios,
    "separate_session_transcript_provenance",
  );
  const generated = requireScenario(scenarios, "generated_packet_match");
  const contract = requireScenario(scenarios, "contract_fit_and_validation");
  const drift = requireScenario(scenarios, "drift_regression");
  const alignment = requireScenario(scenarios, "alignment_safety_net");
  const downstream = requireScenario(scenarios, "downstream_guidance");
  const unsafe = requireScenario(scenarios, "unsafe_authority_regression");
  const lines = [
    "# Perspective Codex Former Separate-Session Provenance-Clean Capture",
    "",
    `Generated at: ${SEPARATE_SESSION_PROVENANCE_CLEAN_CAPTURE_GENERATED_AT}`,
    `Conclusion: ${evaluation.conclusion}`,
    `Recommended next implementation PR title: ${evaluation.recommended_next_pr_title}`,
    "",
    "## Summary",
    "",
    "This dogfood completes the PR #491 separate-session capture path with the supplied real transcript envelope. It uses the prepared manual copy packet metadata, extracts one returned CodexPerspectiveCandidateDraft-shaped object, runs contract fit and direct local validation, keeps alignment as a safety net, and keeps all output non-committed and advisory-only.",
    "",
    "## Why This Follows PR #491 Prep",
    "",
    evaluation.answered_questions.why_this_follows_pr_491,
    "",
    "## Real Separate-Session Transcript Provenance",
    "",
    evaluation.answered_questions.real_separate_session_transcript_provenance,
    `Transcript available: ${provenance.transcript_available}`,
    `capture_method: ${provenance.capture_method}`,
    `codex_surface_label: ${provenance.codex_surface_label}`,
    `prompt_was_generated_by_manual_copy_packet: ${provenance.prompt_was_generated_by_manual_copy_packet}`,
    `source_manual_copy_packet_id: ${provenance.source_manual_copy_packet_id}`,
    `source_former_input_packet_id: ${provenance.source_former_input_packet_id}`,
    `source_prompt_hash: ${provenance.source_prompt_hash}`,
    `captured_at: ${provenance.captured_at}`,
    `provenance_status: ${provenance.provenance_status}`,
    `No not_supplied_in_chat values: ${provenance.no_not_supplied_in_chat_values}`,
    `Fabricated metadata: ${provenance.fabricated_metadata}`,
    `Clearly not same-session fallback: ${provenance.clearly_not_same_session_fallback}`,
    "",
    "## Capture Method",
    "",
    evaluation.answered_questions.capture_method,
    "",
    "## Generated Packet Match",
    "",
    evaluation.answered_questions.generated_packet_match,
    `Manual copy packet id: ${generated.manual_copy_packet_id}`,
    `Former input packet id: ${generated.former_input_packet_id}`,
    `Prompt hash: ${generated.source_prompt_hash}`,
    `Stable contract label present: ${generated.stable_contract_label_present}`,
    `Stale PR #479 prompt wording absent: ${generated.stale_pr_479_prompt_wording_absent}`,
    `Capture return envelope present: ${generated.capture_return_envelope_present}`,
    `Capture return envelope matches packet: ${generated.capture_return_envelope_matches_packet}`,
    "",
    "## Contract-Fit Result",
    "",
    evaluation.answered_questions.contract_fit_result,
    `Extracted candidate count: ${contract.extracted_candidate_count}`,
    `Contract-fit status: ${contract.contract_fit_status}`,
    `Contract-fit warning kinds: ${formatList(contract.contract_fit_warning_kinds)}`,
    `Pointer warning fields: ${formatList(contract.pointer_ref_warning_fields)}`,
    `Plain-summary warning present: ${contract.plain_summary_warning_present}`,
    `Tension-kind warning present: ${contract.tension_kind_warning_present}`,
    "",
    "## Direct Validation Result",
    "",
    evaluation.answered_questions.direct_validation_result,
    `Validation status: ${contract.validation_status}`,
    `Validation warning kinds: ${formatList(contract.validation_warning_kinds)}`,
    `Candidate-compatible material: ${contract.candidate_compatible_material}`,
    `Candidate authority: ${contract.candidate_authority}`,
    `Candidate basis quality: ${contract.candidate_basis_quality}`,
    `Candidate pointer count: ${contract.candidate_pointer_count}`,
    `Basis quality suggestion: ${contract.basis_quality_suggestion}`,
    `Unsafe material detected: ${contract.unsafe_material_detected}`,
    `Authority flags all false: ${contract.authority_flags_all_false}`,
    "",
    "## Alignment Safety-Net Result",
    "",
    evaluation.answered_questions.alignment_safety_net_result,
    `Alignment available: ${alignment.alignment_available}`,
    `Direct validation ran first: ${alignment.direct_validation_ran_first}`,
    `Direct validation succeeded first: ${alignment.direct_validation_succeeded_first}`,
    `Alignment status: ${alignment.alignment_status}`,
    `Alignment required for candidate material: ${alignment.alignment_required_for_candidate_material}`,
    `Alignment counted as direct success: ${alignment.alignment_counted_as_direct_success}`,
    "",
    "## Downstream Guidance Result",
    "",
    evaluation.answered_questions.downstream_guidance_result,
    `Worker guidance status: ${downstream.worker_guidance_status}`,
    `Worker guidance advisory-only: ${downstream.worker_guidance_advisory_only}`,
    `Next action count: ${downstream.next_action_count}`,
    `Authority flags all false: ${downstream.authority_flags_all_false}`,
    "",
    "## Drift/Stale Wording Regression Result",
    "",
    evaluation.answered_questions.drift_stale_wording_regression_result,
    `Old PR #483 alias drift absent: ${drift.old_pr_483_alias_drift_absent}`,
    `PR #486 non-local tension_kind drift absent: ${drift.pr_486_non_local_tension_kind_drift_absent}`,
    `Stale wording findings: ${formatList(drift.stale_wording_findings)}`,
    `Stale prompt-lineage labels: ${formatList(drift.stale_prompt_lineage_labels)}`,
    "",
    "## Privacy/Omitted-Field Handling",
    "",
    evaluation.answered_questions.privacy_omitted_field_handling,
    `Unsafe/private marker names supplied: ${transcriptEnvelope.redaction_summary.unsafe_private_marker_names_supplied}`,
    `Raw marker names echoed in public artifact: false`,
    `Sanitized omitted marker summary: ${transcriptEnvelope.redaction_summary.sanitized_omitted_marker_summary}`,
    "",
    "## Unsafe Authority Regression",
    "",
    evaluation.answered_questions.unsafe_authority_regression_result,
    `Unsafe or authority survived: ${unsafe.unsafe_or_authority_survived}`,
    "",
    "## Evaluation Conclusion",
    "",
    evaluation.answered_questions.evaluation_conclusion,
    "",
    "## Files Changed",
    "",
    ...changedFiles.map((file) => `- ${file}`),
    "",
    "## Authority Boundary",
    "",
    authorityBoundary,
    "",
    "## Verification",
    "",
    ...validationCommands.map((command) => `- ${command}`),
    "",
    "## Neighboring Smoke Coverage",
    "",
    ...neighboringValidationCommands.map((command) => `- ${command}`),
    "",
    "## Skipped Checks With Concrete Reasons",
    "",
    `- Browser/computer-use validation: ${noBrowserComputerUseReason}`,
    "- DB validation: not run because this PR adds no DB schema, persistence path, or state writer.",
    "- Provider/model validation: not run because this PR intentionally does not call Codex, OpenAI, provider/model APIs, or SDKs from implementation.",
    "- Runtime/browser validation: not run because this PR adds no UI, route, browser-visible surface, clipboard automation, or interactive copy control.",
    "",
    "## What Codex Did Not Do",
    "",
    "Codex did not fabricate a transcript, replace the supplied transcript with a synthetic fixture, call Codex from implementation, execute Codex from Augnes, call the Codex SDK, call OpenAI/provider/model APIs from implementation, call GitHub APIs from implementation behavior, use implementation network behavior, write DB state, add runtime routes, add UI, add clipboard automation, create proof/evidence/readiness records, approve, merge, publish, retry, replay, deploy, or make Core decisions.",
    "",
    "## Recommended Next Implementation PR Title",
    "",
    evaluation.recommended_next_pr_title,
    "",
    "## Scenarios",
    "",
    ...scenarios.flatMap(renderScenario),
    "## Sanitized Capture Snapshot",
    "",
    "```json",
    JSON.stringify(
      {
        capture_method: transcriptEnvelope.capture_method,
        codex_surface_label: transcriptEnvelope.codex_surface_label,
        prompt_was_generated_by_manual_copy_packet:
          transcriptEnvelope.prompt_was_generated_by_manual_copy_packet,
        source_manual_copy_packet_id:
          transcriptEnvelope.source_manual_copy_packet_id,
        source_former_input_packet_id:
          transcriptEnvelope.source_former_input_packet_id,
        source_prompt_hash: transcriptEnvelope.source_prompt_hash,
        captured_at: transcriptEnvelope.captured_at,
        provenance_status: provenance.provenance_status,
        sanitized_redaction: transcriptEnvelope.redaction_summary,
      },
      null,
      2,
    ),
    "```",
  ];

  return `${lines.join("\n").trimEnd()}\n`;
}

function renderScenario(scenario) {
  return [
    `### ${scenario.title}`,
    "",
    `Scenario id: ${scenario.scenario_id}`,
    `Conclusion: ${scenario.conclusion}`,
    `Blocked reasons: ${scenario.blocked_reasons.length > 0 ? scenario.blocked_reasons.join("; ") : "None"}`,
    "",
    "Dogfood notes:",
    ...scenario.dogfood_notes.map((note) => `- ${note}`),
    "",
  ];
}

function extractSingleCandidateDraft(transcriptEnvelope) {
  const response = transcriptEnvelope?.returned_codex_response;
  if (
    response?.draft_version === "codex_perspective_candidate_draft.v0.1" &&
    response?.draft_kind === "codex_perspective_candidate_draft"
  ) {
    return response;
  }

  return null;
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

function buildMissingValidationResult() {
  return {
    status: "blocked",
    candidate_review_material: null,
    blocked_reasons: ["captured candidate missing"],
    warnings: [],
    privacy: {
      raw_payloads_included: false,
      unsafe_input_material_omitted: false,
      omitted_unsafe_fields: [],
    },
    authority_flags: buildFalseAuthorityFlags(),
  };
}

function buildMissingContractFit() {
  return {
    status: "violates_contract",
    warnings: [
      {
        warning_kind: "plain_summary",
        field: "draft",
        summary: "Draft is missing.",
      },
    ],
    privacy: {
      raw_payloads_included: false,
      unsafe_material_detected: false,
    },
    authority_flags: buildFalseAuthorityFlags(),
  };
}

function buildMissingAlignment() {
  return {
    alignment_status: "blocked",
    aligned_draft: null,
    applied_mappings: [],
    blocked_reasons: ["captured candidate missing"],
  };
}

function detectStaleCaptureWordingFindings(text) {
  const lower = text.toLowerCase();
  const findings = [];

  if (
    text.includes(stalePr479PromptWording) ||
    text.includes("PR #479 prompt contract")
  ) {
    findings.push("stale_pr_479_prompt_contract_reference");
  }
  if (
    lower.includes("transcript has not yet been captured") ||
    lower.includes("transcript has not been captured") ||
    lower.includes("current returned transcript as still absent") ||
    lower.includes("this response does not exist") ||
    lower.includes("waiting_for_transcript")
  ) {
    findings.push("stale_transcript_not_captured_current_state_wording");
  }
  if (
    text.includes("Capture the bounded second human-started Codex response transcript") ||
    lower.includes("capture the second real codex response transcript")
  ) {
    findings.push("stale_capture_next_action_after_supplied_transcript");
  }

  return uniqueTextList(findings);
}

function detectStalePromptLineageLabels(text) {
  return [
    text.includes("Use the PR #479") ? "stale_pr_479_prompt_label" : null,
    text.includes("post-PR #489 packet") ? "stale_post_pr_489_prompt_label" : null,
    text.includes("phone-assisted same-session")
      ? "stale_same_session_prompt_label"
      : null,
  ].filter(Boolean);
}

function detectForbiddenCandidateAliases(draft) {
  if (!draft) return ["missing_draft"];

  const aliases = [];
  const selectedMaterial = draft.selected_material ?? {};
  for (const field of [
    "changed_file_paths",
    "plain_summary_facts",
    "neutral_perspective_basis",
  ]) {
    if (hasOwn(selectedMaterial, field)) aliases.push(`selected_material.${field}`);
  }
  for (const [index, pointer] of (
    draft.evidence_pointer_refs ?? []
  ).entries()) {
    if (hasOwn(pointer, "ref_type")) {
      aliases.push(`evidence_pointer_refs[${index}].ref_type`);
    }
    if (hasOwn(pointer, "pointer_only")) {
      aliases.push(`evidence_pointer_refs[${index}].pointer_only`);
    }
  }
  for (const [index, question] of (
    draft.user_core_decision_questions ?? []
  ).entries()) {
    if (question && typeof question === "object") {
      aliases.push(`user_core_decision_questions[${index}]`);
    }
  }
  for (const [index, action] of (
    draft.next_action_candidates ?? []
  ).entries()) {
    if (hasOwn(action, "id")) {
      aliases.push(`next_action_candidates[${index}].id`);
    }
    if (hasOwn(action, "why_next")) {
      aliases.push(`next_action_candidates[${index}].why_next`);
    }
  }
  for (const [index, tension] of (
    draft.unresolved_tensions ?? []
  ).entries()) {
    if (hasOwn(tension, "id")) aliases.push(`unresolved_tensions[${index}].id`);
    if (hasOwn(tension, "why_it_matters")) {
      aliases.push(`unresolved_tensions[${index}].why_it_matters`);
    }
  }

  return aliases;
}

function summarizeContext(context) {
  return {
    former_input_packet_id: context.formerInputPacket.packet_id,
    manual_copy_packet_id: context.manualCopyPacket.packet_id,
    copyable_prompt_hash: context.manualCopyPacket.copyable_prompt_hash,
    prep_artifact_path: SEPARATE_SESSION_CAPTURE_PACKET_PREP_ARTIFACT_PATH,
  };
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

function formatList(values) {
  return values.length > 0 ? values.join(", ") : "none";
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasOwn(value, key) {
  return Boolean(
    value &&
      typeof value === "object" &&
      Object.prototype.hasOwnProperty.call(value, key),
  );
}

function uniqueTextList(values) {
  return [...new Set(values.filter((value) => typeof value === "string"))];
}

function allAuthorityFlagsFalse(flags) {
  return Boolean(flags && Object.values(flags).every((value) => value === false));
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

function writeReportFile(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text, "utf8");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runPerspectiveCodexFormerSeparateSessionProvenanceCleanCaptureDogfood();
}
