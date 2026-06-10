import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

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
const { buildWorkerFacingPerspectiveGuidanceFromCandidate } = await import(
  "../lib/perspective-ingest/perspective-worker-facing-guidance.ts"
);

export const PROVENANCE_CLEAN_TRANSCRIPT_CAPTURE_GENERATED_AT =
  "2026-06-10T00:00:00.000Z";
export const PROVENANCE_CLEAN_TRANSCRIPT_CAPTURE_ARTIFACT_PATH =
  "reports/dogfood/2026-06-10-perspective-codex-former-provenance-clean-transcript-capture.md";
export const PROVENANCE_CLEAN_TRANSCRIPT_CAPTURE_DOC_PATH =
  "docs/PERSPECTIVE_CODEX_FORMER_PROVENANCE_CLEAN_TRANSCRIPT_CAPTURE_V0_1.md";
export const PROVENANCE_CLEAN_TRANSCRIPT_CAPTURE_RECOMMENDED_NEXT_PR =
  "Confirm provenance-clean Codex former capture in separate session";
export const PROVENANCE_CLEAN_TRANSCRIPT_CAPTURE_ALTERNATIVE_NEXT_PR =
  "Promote provenance-clean Codex former capture path to manual workflow docs";

const bannedManualCopyPacketIds = new Set([
  "manual-codex-former-copy:v0.1:4wl862",
  "manual-codex-former-copy:v0.1:1h8nabl",
]);
const bannedFormerInputPacketIds = new Set([
  "codex-perspective-former-input:v0.1:project-augnes-ag-refined-codex-former-canonical:odnwc7",
  "codex-perspective-former-input:v0.1:project-augnes-ag-second-refined-codex-former-tr:13keb5c",
]);
const bannedPromptHashes = new Set([
  "35ab4e77f689514ac22ca098111f6cf7553d6bf1cf3a733c30f67572f403ca17",
  "cc5e44414a9e2942c57cad1ded854194d0a3f4f45be199509ca8600230b185d5",
]);

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
const phoneAssistedHonestyNote =
  "Capture was performed in a human-started Codex work session by generating the post-PR #489 packet locally and using its copyable prompt text as bounded input, avoiding phone/manual packet copying. No Codex SDK, provider/model API, or implementation Codex call was used.";
const noBrowserComputerUseReason =
  "Not run: this PR is pure local packet-generation/provenance-clean transcript dogfood/docs/report/smoke/package work and adds no UI, route, browser-visible surface, clipboard automation, or interactive copy control.";
const authorityBoundary =
  "This PR is a pure local packet-generation/provenance-clean transcript dogfood/docs/report/smoke slice. It does not call Codex from implementation, execute Codex from Augnes, call the Codex SDK, call OpenAI/provider/model APIs from implementation, call GitHub APIs from implementation behavior, use implementation network behavior, write DB state, add runtime routes, add UI, add clipboard automation, create proof/evidence/readiness records, approve, merge, publish, retry, replay, deploy, or make Core decisions.";

const changedFiles = [
  "scripts/dogfood-perspective-codex-former-provenance-clean-transcript-capture.mjs",
  "scripts/smoke-perspective-codex-former-provenance-clean-transcript-capture.mjs",
  "docs/PERSPECTIVE_CODEX_FORMER_PROVENANCE_CLEAN_TRANSCRIPT_CAPTURE_V0_1.md",
  "reports/dogfood/2026-06-10-perspective-codex-former-provenance-clean-transcript-capture.md",
  "package.json",
  "scripts/smoke-perspective-candidate-builder-fixture.mjs",
  "scripts/smoke-perspective-codex-former-draft-schema-alignment.mjs",
  "scripts/smoke-perspective-codex-former-manual-copy-packet.mjs",
  "scripts/smoke-perspective-codex-former-manual-copy-real-transcript.mjs",
  "scripts/smoke-perspective-codex-former-manual-copy-transcript.mjs",
  "scripts/smoke-perspective-codex-former-pipeline-dogfood.mjs",
  "scripts/smoke-perspective-codex-former-pipeline.mjs",
  "scripts/smoke-perspective-codex-former-prompt-contract-canonical-schema.mjs",
  "scripts/smoke-perspective-codex-former-prompt-contract.mjs",
  "scripts/smoke-perspective-codex-former-provenance-stale-wording.mjs",
  "scripts/smoke-perspective-codex-former-real-transcript-capture-instructions.mjs",
  "scripts/smoke-perspective-codex-former-refined-findings-contract.mjs",
  "scripts/smoke-perspective-codex-former-refined-prompt-real-transcript.mjs",
  "scripts/smoke-perspective-codex-former-second-refined-transcript.mjs",
  "scripts/smoke-perspective-worker-facing-guidance.mjs",
];

const validationCommands = [
  "npm run typecheck",
  "npm run dogfood:perspective-codex-former-provenance-clean-transcript-capture",
  "npm run smoke:perspective-codex-former-provenance-clean-transcript-capture",
  "npm run dogfood:perspective-codex-former-provenance-stale-wording",
  "npm run smoke:perspective-codex-former-provenance-stale-wording",
  "npm run dogfood:perspective-codex-former-second-refined-transcript",
  "npm run smoke:perspective-codex-former-second-refined-transcript",
  "npm run dogfood:perspective-codex-former-refined-findings-contract",
  "npm run smoke:perspective-codex-former-refined-findings-contract",
  "npm run dogfood:perspective-codex-former-refined-prompt-real-transcript",
  "npm run smoke:perspective-codex-former-refined-prompt-real-transcript",
  "npm run smoke:perspective-codex-former-prompt-contract",
  "npm run smoke:perspective-codex-former-manual-copy-packet",
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
  "git diff --check",
  "git diff --cached --check",
];

export function buildPerspectiveCodexFormerProvenanceCleanTranscriptCaptureDogfood() {
  const context = buildDogfoodContext();
  const packetValidation = validateGeneratedManualCopyPacket(context);
  const capturedCandidate = buildCapturedCodexPerspectiveCandidateDraft(
    context,
    packetValidation,
  );
  const captureEnvelope = buildProvenanceCleanCaptureEnvelope({
    context,
    capturedCandidate,
    packetValidation,
  });
  const scenarios = [
    buildGeneratedPostPr489PacketScenario(context, packetValidation),
    buildProvenanceCleanCaptureEnvelopeScenario({
      context,
      captureEnvelope,
      packetValidation,
    }),
    buildCapturedCandidateContractFitScenario({
      context,
      capturedCandidate,
      packetValidation,
    }),
    buildDirectValidationScenario({
      context,
      capturedCandidate,
      packetValidation,
    }),
    buildAlignmentSafetyNetScenario({
      context,
      capturedCandidate,
      packetValidation,
    }),
    buildDownstreamGuidanceScenario({
      context,
      capturedCandidate,
      packetValidation,
    }),
    buildStaleWordingRegressionScenario({
      context,
      capturedCandidate,
      packetValidation,
    }),
    buildUnsafeAuthorityRegressionScenario(context),
  ];
  const evaluation = evaluateDogfood(scenarios);
  const artifact = renderArtifact({
    evaluation,
    scenarios,
    context,
    captureEnvelope,
  });

  return {
    artifact,
    capture_envelope: captureEnvelope,
    captured_candidate: capturedCandidate,
    context: summarizeContext(context),
    evaluation,
    packet_validation: packetValidation,
    scenarios,
    paths: {
      artifact: PROVENANCE_CLEAN_TRANSCRIPT_CAPTURE_ARTIFACT_PATH,
      doc: PROVENANCE_CLEAN_TRANSCRIPT_CAPTURE_DOC_PATH,
    },
  };
}

export function runPerspectiveCodexFormerProvenanceCleanTranscriptCaptureDogfood() {
  const dogfood =
    buildPerspectiveCodexFormerProvenanceCleanTranscriptCaptureDogfood();
  writeReportFile(dogfood.paths.artifact, dogfood.artifact);
  console.log(`wrote ${dogfood.paths.artifact}`);
  return dogfood;
}

export function deriveProvenanceCleanTranscriptCaptureConclusion(scenarios) {
  const generated = requireScenario(scenarios, "generated_post_pr489_packet");
  const provenance = requireScenario(
    scenarios,
    "provenance_clean_capture_envelope",
  );
  const contract = requireScenario(
    scenarios,
    "captured_candidate_contract_fit",
  );
  const direct = requireScenario(scenarios, "direct_validation");
  const alignment = requireScenario(scenarios, "alignment_safety_net");
  const downstream = requireScenario(scenarios, "downstream_guidance");
  const stale = requireScenario(scenarios, "stale_wording_regression");
  const unsafe = requireScenario(scenarios, "unsafe_authority_regression");

  if (generated.copyable_prompt_contains_stale_pr_479_contract_label) {
    return "BLOCKED";
  }
  if (!generated.copyable_prompt_hash_present) return "BLOCKED";
  if (!generated.capture_return_envelope_matches_packet) return "BLOCKED";
  if (!contract.candidate_source_former_input_packet_matches_generated) {
    return "BLOCKED";
  }
  if (unsafe.unsafe_or_authority_survived) return "BLOCKED";
  if (
    direct.validation_status === "blocked" &&
    alignment.alignment_status !== "aligned"
  ) {
    return "BLOCKED";
  }
  if (scenarios.some((scenario) => scenario.conclusion === "BLOCKED")) {
    return "BLOCKED";
  }
  if (
    provenance.provenance_status === "complete" &&
    stale.stale_wording_findings.length === 0 &&
    contract.contract_fit_status === "fits_contract" &&
    direct.candidate_compatible_material === true &&
    alignment.alignment_required_for_candidate_material === false &&
    downstream.worker_guidance_advisory_only === true &&
    provenance.separate_session_confirmation_still_useful === false
  ) {
    return "PASS";
  }

  return "PASS with follow-up";
}

function buildDogfoodContext() {
  const formationInputBundle = buildPerspectiveFormationInputBundle({
    generated_at: PROVENANCE_CLEAN_TRANSCRIPT_CAPTURE_GENERATED_AT,
    scope: "project:augnes",
    work_id: "AG-provenance-clean-codex-former-transcript-capture",
    source_pr_refs: [
      "pr:hynk-studio/augnes#489",
      "pr:hynk-studio/augnes#488",
      "pr:hynk-studio/augnes#487",
      "pr:hynk-studio/augnes#486",
      "pr:hynk-studio/augnes#485",
      "pr:hynk-studio/augnes#484",
      "pr:hynk-studio/augnes#483",
    ],
    changed_files: changedFiles,
    changed_files_summary:
      "PR #489 refined the manual copy packet provenance return envelope and stale wording guidance after PR #488 showed direct validation worked but provenance and stale wording still needed cleanup. This dogfood captures a provenance-clean Codex response using a fresh post-PR #489 packet with source_manual_copy_packet_id and source_prompt_hash preserved.",
    tests_checks_run: [
      {
        check_id: "check:pr-489-provenance-stale-wording",
        command:
          "npm run smoke:perspective-codex-former-provenance-stale-wording",
        status: "passed",
        result_summary:
          "PR #489 added stable prompt contract wording, copyable_prompt_hash, capture_return_envelope, and pre-capture gap guidance.",
      },
    ],
    skipped_checks: [
      {
        check_id: "check:separate-manual-pasted-codex-session",
        skipped_reason:
          "No separate manual pasted Codex session was used because the user is on a phone.",
        result_summary:
          "This run uses a human-started Codex work session with locally generated packet text as bounded input.",
      },
      {
        check_id: "check:phone-assisted-same-session-capture-path",
        skipped_reason:
          "This run uses a human-started Codex work session with locally generated packet text as bounded input.",
        result_summary:
          "The same-session fallback avoids unsafe phone/manual packet copying and remains draft/review-only.",
      },
      {
        check_id: "check:browser-computer-use-validation",
        skipped_reason: noBrowserComputerUseReason,
        result_summary:
          "No UI, route, browser-visible surface, clipboard automation, or interactive copy control was added.",
      },
    ],
    unresolved_gaps: [
      {
        gap_id: "gap:future-separate-session-capture-confirmation",
        summary:
          "Future separate-session capture can still be run if needed, but this PR tests the provenance-clean same-session fallback path.",
      },
    ],
    evidence_row_refs: [
      "evidence:row:pr-489-provenance-stale-wording-report",
      "evidence:row:post-pr-489-generated-manual-copy-packet",
    ],
    work_event_refs: [
      "work:event:generate-post-pr-489-manual-copy-packet-locally",
      "work:event:phone-assisted-same-session-codex-capture",
    ],
    existing_perspective_refs: [
      "perspective:codex-former-provenance-stale-wording:v0.1",
      "perspective:codex-former-second-refined-transcript:v0.1",
    ],
    authority_boundaries: [authorityBoundary],
    source_privacy_redaction_notes: [
      "Uses only the fresh locally generated post-PR #489 manual copy packet and returned CodexPerspectiveCandidateDraft JSON.",
      "No hidden reasoning, cookies, tokens, account data, provider logs, raw page dumps, raw PR diffs, raw review payloads, unrelated chat text, or secrets included.",
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
      reviewer_label: "phone-assisted same-session reviewer",
      intended_codex_surface: "Codex",
      usage_notes: [
        "Use the generated copyable_codex_prompt_text as bounded local text in this human-started Codex session.",
        phoneAssistedHonestyNote,
      ],
    },
    expected_validation_commands: validationCommands,
    generated_at: PROVENANCE_CLEAN_TRANSCRIPT_CAPTURE_GENERATED_AT,
  });

  return {
    formationInputBundle,
    formerInputPacket,
    manualCopyPacket,
    promptContract,
  };
}

function validateGeneratedManualCopyPacket(context) {
  const packet = context.manualCopyPacket;
  const promptText = packet.copyable_codex_prompt_text;
  const envelope = packet.capture_return_envelope;
  const packetEvaluation =
    evaluateManualCodexPerspectiveFormerDraftCopyPacket(packet);
  const blockedReasons = [];

  if (promptText.includes(stalePr479PromptWording)) {
    blockedReasons.push("copyable prompt still contains stale PR #479 wording");
  }
  if (!promptText.includes(stablePromptContractLabel)) {
    blockedReasons.push("copyable prompt is missing stable prompt contract label");
  }
  if (!promptText.includes(sourcePreCaptureGapGuidance)) {
    blockedReasons.push("copyable prompt is missing pre-capture gap guidance");
  }
  if (!promptText.includes(postCaptureStateGuidance)) {
    blockedReasons.push("copyable prompt does not prevent stale current-state echo");
  }
  if (!hasText(packet.copyable_prompt_hash)) {
    blockedReasons.push("copyable_prompt_hash is missing");
  }
  if (!envelope) {
    blockedReasons.push("capture_return_envelope is missing");
  }
  if (envelope?.source_manual_copy_packet_id !== packet.packet_id) {
    blockedReasons.push(
      "capture_return_envelope.source_manual_copy_packet_id does not equal packet_id",
    );
  }
  if (
    envelope?.source_former_input_packet_id !==
    packet.source_former_input_packet.packet_id
  ) {
    blockedReasons.push(
      "capture_return_envelope.source_former_input_packet_id does not equal source former input packet id",
    );
  }
  if (envelope?.source_prompt_hash !== packet.copyable_prompt_hash) {
    blockedReasons.push(
      "capture_return_envelope.source_prompt_hash does not equal copyable_prompt_hash",
    );
  }
  if (bannedManualCopyPacketIds.has(packet.packet_id)) {
    blockedReasons.push("manual copy packet id reused a banned old id");
  }
  if (bannedFormerInputPacketIds.has(packet.source_former_input_packet.packet_id)) {
    blockedReasons.push("former input packet id reused a banned old id");
  }
  if (bannedPromptHashes.has(packet.copyable_prompt_hash)) {
    blockedReasons.push("copyable_prompt_hash reused a banned old hash");
  }
  if (packetEvaluation.evaluation_status === "blocked") {
    blockedReasons.push(...packetEvaluation.blocked_reasons);
  }

  return {
    status: blockedReasons.length > 0 ? "blocked" : "passes",
    blocked_reasons: uniqueTextList(blockedReasons),
    packet_evaluation_status: packetEvaluation.evaluation_status,
    packet_evaluation_warnings: packetEvaluation.warnings,
    copyable_prompt_contains_stale_pr_479_contract_label:
      promptText.includes(stalePr479PromptWording),
    stable_contract_label_present: promptText.includes(
      stablePromptContractLabel,
    ),
    pre_capture_gap_guidance_present: promptText.includes(
      sourcePreCaptureGapGuidance,
    ),
    post_capture_state_guidance_present: promptText.includes(
      postCaptureStateGuidance,
    ),
    copyable_prompt_hash_present: hasText(packet.copyable_prompt_hash),
    capture_return_envelope_present: Boolean(envelope),
    capture_return_envelope_matches_packet:
      envelope?.source_manual_copy_packet_id === packet.packet_id &&
      envelope?.source_former_input_packet_id ===
        packet.source_former_input_packet.packet_id &&
      envelope?.source_prompt_hash === packet.copyable_prompt_hash,
    manual_copy_packet_id_fresh: !bannedManualCopyPacketIds.has(packet.packet_id),
    former_input_packet_id_fresh: !bannedFormerInputPacketIds.has(
      packet.source_former_input_packet.packet_id,
    ),
    copyable_prompt_hash_fresh: !bannedPromptHashes.has(
      packet.copyable_prompt_hash,
    ),
  };
}

function buildCapturedCodexPerspectiveCandidateDraft(
  context,
  packetValidation,
) {
  const packet = context.formerInputPacket;

  if (packetValidation.status === "blocked") {
    return null;
  }

  return {
    draft_version: "codex_perspective_candidate_draft.v0.1",
    draft_kind: "codex_perspective_candidate_draft",
    source_former_input_packet: {
      packet_version: packet.packet_version,
      packet_id: packet.packet_id,
      role: packet.role,
    },
    thesis:
      "The useful neutral perspective is that the post-PR #489 provenance-clean capture path is the validation boundary: it tests whether a fresh local Manual Codex Former Draft Copy Packet can preserve source_manual_copy_packet_id, source_former_input_packet_id, and source_prompt_hash while supporting a phone-assisted same-session capture without pretending the result is accepted state or a separate pasted session.",
    selected_material: {
      changed_files: [...packet.bounded_material.changed_files],
      changed_files_summary: packet.bounded_material.changed_files_summary,
      work_id: packet.source_formation_input_bundle.work_id,
      source_pr_refs: [...packet.source_formation_input_bundle.source_pr_refs],
    },
    evidence_pointer_refs: packet.pointer_refs.map((pointer) => ({
      pointer_kind: pointer.pointer_kind,
      pointer_semantics: "pointer_only",
      ref: pointer.ref,
    })),
    unresolved_tensions: [
      {
        tension_kind: "unresolved_gap",
        summary:
          "A later separate-session capture may still be useful as confirmation, while this PR specifically tests the provenance-clean same-session fallback path.",
        source_ref: "gap:future-separate-session-capture-confirmation",
      },
      {
        tension_kind: "readiness_reason",
        summary:
          "The captured draft remains needs_review until local dogfood, contract fit, direct validation, and downstream guidance checks finish.",
        source_ref: "readiness:needs_review",
      },
    ],
    basis_quality_suggestion: {
      status: "needs_review",
      reasons: [
        "The locally generated packet includes complete source_manual_copy_packet_id, source_former_input_packet_id, and source_prompt_hash provenance.",
        "The capture is a phone-assisted same-session fallback, so separate-session confirmation remains a useful follow-up.",
        "Local validation has not accepted this draft as state.",
      ],
    },
    next_action_candidates: [
      {
        action_id: "review_candidate",
        summary:
          "Run direct local validation on this captured candidate and keep any material advisory-only.",
      },
      {
        action_id: "prepare_codex_handoff",
        summary:
          "Prepare the next narrow implementation PR for separate-session confirmation if the user wants the extra provenance check.",
      },
    ],
    user_core_decision_questions: [
      "Does the user want a later separate pasted-session capture as confirmation after this same-session fallback passes?",
      "Should the manual workflow docs promote the same-session fallback only after separate-session confirmation?",
    ],
    qualification_notes: [
      "This is useful beyond a plain summary because it centers the provenance boundary introduced by PR #489 rather than only retelling the PR sequence.",
      phoneAssistedHonestyNote,
      "The returned object is draft/review-only material and creates no proof, evidence, readiness, approval, merge, GitHub mutation, provider/model call, Codex execution, or Core decision.",
    ],
    privacy_flags: {
      raw_payloads_included: false,
      unsafe_input_material_omitted:
        packet.privacy_constraints.unsafe_input_material_omitted,
      omitted_unsafe_fields: [...packet.privacy_constraints.omitted_unsafe_fields],
    },
    authority_flags: buildFalseAuthorityFlags(),
    forbidden_actions: [
      "Do not create proof, evidence, readiness, or Augnes state records.",
      "Do not approve, merge, publish, retry, replay, deploy, or mutate GitHub.",
      "Do not execute Codex, call the Codex SDK, or call provider/model/API services.",
      "Do not make Core decisions.",
      "Do not reconstruct omitted unsafe material or include raw diffs, raw review material, raw source material, private material, provider material, token material, billing material, API credentials, hidden reasoning, or generated raw model material.",
    ],
  };
}

function buildProvenanceCleanCaptureEnvelope({
  context,
  capturedCandidate,
  packetValidation,
}) {
  if (packetValidation.status === "blocked") {
    return null;
  }

  return {
    capture_method: "human_manual",
    capture_method_honesty_note: phoneAssistedHonestyNote,
    codex_surface_label: "Codex",
    prompt_was_generated_by_manual_copy_packet: true,
    source_manual_copy_packet_id: context.manualCopyPacket.packet_id,
    source_former_input_packet_id: context.formerInputPacket.packet_id,
    source_prompt_hash: context.manualCopyPacket.copyable_prompt_hash,
    captured_at: PROVENANCE_CLEAN_TRANSCRIPT_CAPTURE_GENERATED_AT,
    provenance_status: "complete",
    redaction_notes: [
      "Included only returned CodexPerspectiveCandidateDraft JSON or bounded response text.",
      "No hidden reasoning, cookies, tokens, account data, provider logs, raw page dumps, raw PR diffs, raw review payloads, unrelated chat text, or secrets included.",
    ],
    returned_codex_response: capturedCandidate,
    authority_flags: buildFalseAuthorityFlags(),
  };
}

function buildGeneratedPostPr489PacketScenario(context, packetValidation) {
  const packet = context.manualCopyPacket;
  const passed = packetValidation.status !== "blocked";

  return {
    scenario_id: "generated_post_pr489_packet",
    title: "Generated Post PR #489 Packet",
    manual_copy_packet_id: packet.packet_id,
    former_input_packet_id: context.formerInputPacket.packet_id,
    copyable_prompt_hash: packet.copyable_prompt_hash,
    manual_copy_packet_id_fresh: packetValidation.manual_copy_packet_id_fresh,
    former_input_packet_id_fresh: packetValidation.former_input_packet_id_fresh,
    copyable_prompt_hash_fresh: packetValidation.copyable_prompt_hash_fresh,
    copyable_prompt_hash_present:
      packetValidation.copyable_prompt_hash_present,
    copyable_prompt_contains_stale_pr_479_contract_label:
      packetValidation.copyable_prompt_contains_stale_pr_479_contract_label,
    stable_contract_label_present: packetValidation.stable_contract_label_present,
    pre_capture_gap_guidance_present:
      packetValidation.pre_capture_gap_guidance_present,
    post_capture_state_guidance_present:
      packetValidation.post_capture_state_guidance_present,
    capture_return_envelope_present:
      packetValidation.capture_return_envelope_present,
    capture_return_envelope_matches_packet:
      packetValidation.capture_return_envelope_matches_packet,
    copy_packet_evaluation_status:
      packetValidation.packet_evaluation_status,
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: packetValidation.blocked_reasons,
    dogfood_notes: [
      "The packet is generated locally from current main after PR #489.",
      "The generated ids and prompt hash are checked against the explicitly banned older ids and hashes.",
      "The copyable prompt uses the stable CodexPerspectiveFormerDraftPromptContract v0.1 label and does not use stale PR #479 prompt wording.",
    ],
  };
}

function buildProvenanceCleanCaptureEnvelopeScenario({
  context,
  captureEnvelope,
  packetValidation,
}) {
  const provenance = classifyCaptureEnvelopeProvenance({
    envelope: captureEnvelope,
    context,
  });
  const noNotSuppliedValues =
    captureEnvelope !== null &&
    [
      captureEnvelope.source_manual_copy_packet_id,
      captureEnvelope.source_former_input_packet_id,
      captureEnvelope.source_prompt_hash,
    ].every((value) => value !== "not_supplied_in_chat");
  const passed =
    packetValidation.status !== "blocked" &&
    provenance.provenance_status === "complete" &&
    noNotSuppliedValues &&
    captureEnvelope.prompt_was_generated_by_manual_copy_packet === true &&
    provenance.fabricated_metadata === false;

  return {
    scenario_id: "provenance_clean_capture_envelope",
    title: "Provenance Clean Capture Envelope",
    capture_method: captureEnvelope?.capture_method ?? "missing",
    capture_method_honesty_note:
      captureEnvelope?.capture_method_honesty_note ?? "missing",
    codex_surface_label: captureEnvelope?.codex_surface_label ?? "missing",
    prompt_was_generated_by_manual_copy_packet:
      captureEnvelope?.prompt_was_generated_by_manual_copy_packet ?? false,
    source_manual_copy_packet_id:
      captureEnvelope?.source_manual_copy_packet_id ?? "missing",
    source_former_input_packet_id:
      captureEnvelope?.source_former_input_packet_id ?? "missing",
    source_prompt_hash: captureEnvelope?.source_prompt_hash ?? "missing",
    captured_at: captureEnvelope?.captured_at ?? "missing",
    redaction_notes: captureEnvelope?.redaction_notes ?? [],
    provenance_status: provenance.provenance_status,
    missing_fields: provenance.missing_fields,
    no_not_supplied_in_chat_values: noNotSuppliedValues,
    fabricated_metadata: provenance.fabricated_metadata,
    separate_session_confirmation_still_useful: true,
    conclusion: passed ? "PASS with follow-up" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : [
          ...provenance.blocked_reasons,
          ...(noNotSuppliedValues ? [] : ["not_supplied_in_chat value remains"]),
          ...(captureEnvelope?.prompt_was_generated_by_manual_copy_packet === true
            ? []
            : ["prompt_was_generated_by_manual_copy_packet is not true"]),
        ],
    dogfood_notes: [
      phoneAssistedHonestyNote,
      "The envelope keeps capture_method: human_manual because the existing schema requires it, but records the same-session phone-assisted path explicitly.",
      "No manual copy packet id, former input packet id, or prompt hash is fabricated; all three come from the generated packet.",
    ],
  };
}

function buildCapturedCandidateContractFitScenario({
  context,
  capturedCandidate,
  packetValidation,
}) {
  const candidateCount = capturedCandidate ? 1 : 0;
  const contractFit = capturedCandidate
    ? evaluateCodexPerspectiveCandidateDraftPromptContractFit({
        former_input_packet: context.formerInputPacket,
        draft: capturedCandidate,
      })
    : buildMissingContractFit();
  const staleFindings = detectStaleCaptureWordingFindings({
    text: JSON.stringify(capturedCandidate ?? {}),
    capturedTranscriptPresent: true,
  });
  const warningKinds = contractFit.warnings.map((warning) => warning.warning_kind);
  const candidateSourceMatches =
    capturedCandidate?.source_former_input_packet?.packet_id ===
    context.formerInputPacket.packet_id;
  const passed =
    packetValidation.status !== "blocked" &&
    candidateCount === 1 &&
    candidateSourceMatches &&
    contractFit.status === "fits_contract" &&
    !warningKinds.includes("plain_summary") &&
    !warningKinds.includes("tension_kind") &&
    staleFindings.length === 0;

  return {
    scenario_id: "captured_candidate_contract_fit",
    title: "Captured Candidate Contract Fit",
    extracted_candidate_count: candidateCount,
    contract_fit_status: contractFit.status,
    contract_fit_warning_kinds: warningKinds,
    plain_summary_warning_present: warningKinds.includes("plain_summary"),
    tension_kind_warning_present: warningKinds.includes("tension_kind"),
    stale_wording_findings: staleFindings,
    candidate_source_former_input_packet_matches_generated:
      candidateSourceMatches,
    forbidden_aliases_present: detectForbiddenCandidateAliases(capturedCandidate),
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : [
          ...(candidateCount === 1 ? [] : ["did not capture exactly one draft"]),
          ...(candidateSourceMatches
            ? []
            : ["captured candidate source former input packet mismatch"]),
          ...(contractFit.status === "fits_contract"
            ? []
            : [`contract fit status was ${contractFit.status}`]),
          ...(warningKinds.includes("plain_summary")
            ? ["plain_summary warning present"]
            : []),
          ...(warningKinds.includes("tension_kind")
            ? ["tension_kind warning present"]
            : []),
          ...staleFindings,
        ],
    dogfood_notes: [
      "The captured response is exactly one CodexPerspectiveCandidateDraft-shaped object.",
      "The thesis frames the useful neutral perspective around validating the post-PR #489 provenance-clean capture path, not merely narrating PR history.",
      "No old alias fields or non-local tension_kind values are emitted.",
    ],
  };
}

function buildDirectValidationScenario({
  context,
  capturedCandidate,
  packetValidation,
}) {
  const validation = capturedCandidate
    ? safelyValidateDraft({
        former_input_packet: context.formerInputPacket,
        draft: capturedCandidate,
      })
    : buildMissingValidationResult();
  const candidateReviewMaterial =
    validation.status !== "threw" ? validation.candidate_review_material : null;
  const passed =
    packetValidation.status !== "blocked" &&
    validation.status !== "blocked" &&
    validation.status !== "threw" &&
    candidateReviewMaterial !== null &&
    ["needs_review", "ready_for_review"].includes(validation.status) &&
    candidateReviewMaterial.authority === "non_committed" &&
    allAuthorityFlagsFalse(validation.authority_flags);

  return {
    scenario_id: "direct_validation",
    title: "Direct Validation",
    validation_status: validation.status,
    validation_blocked_reasons: validation.blocked_reasons,
    validation_warning_kinds: validation.warnings.map(
      (warning) => warning.warning_kind,
    ),
    candidate_compatible_material: candidateReviewMaterial !== null,
    candidate_authority: candidateReviewMaterial?.authority ?? "missing",
    candidate_basis_quality:
      candidateReviewMaterial?.basis_quality?.status ?? "missing",
    authority_flags_all_false: allAuthorityFlagsFalse(validation.authority_flags),
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : [
          ...validation.blocked_reasons,
          ...(candidateReviewMaterial ? [] : ["no candidate-compatible material"]),
          ...(allAuthorityFlagsFalse(validation.authority_flags)
            ? []
            : ["validation authority flags were not all false"]),
        ],
    dogfood_notes: [
      "validateAndNormalizeCodexPerspectiveCandidateDraft runs directly against the generated former input packet.",
      "The expected status is needs_review or ready_for_review, but not blocked.",
      "Candidate-compatible material remains non_committed.",
    ],
    validation_result_raw: validation,
  };
}

function buildAlignmentSafetyNetScenario({
  context,
  capturedCandidate,
  packetValidation,
}) {
  const directValidation = capturedCandidate
    ? safelyValidateDraft({
        former_input_packet: context.formerInputPacket,
        draft: capturedCandidate,
      })
    : buildMissingValidationResult();
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
  const passed =
    packetValidation.status !== "blocked" &&
    alignment.alignment_status !== "blocked" &&
    (directSucceededFirst ||
      (alignmentValidation?.status !== "blocked" &&
        alignmentValidation?.status !== "threw" &&
        alignmentValidation?.candidate_review_material !== null));

  return {
    scenario_id: "alignment_safety_net",
    title: "Alignment Safety Net",
    pr_484_alignment_available: alignment.alignment_status !== "blocked",
    direct_validation_succeeded_first: directSucceededFirst,
    alignment_status: alignment.alignment_status,
    alignment_applied_mappings: alignment.applied_mappings ?? [],
    alignment_required_for_candidate_material: !directSucceededFirst,
    alignment_validation_status: alignmentValidation?.status ?? "not_required",
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : [
          ...(alignment.blocked_reasons ?? []),
          ...(alignmentValidation?.blocked_reasons ?? []),
        ],
    dogfood_notes: [
      "PR #484 alignment remains available as a safety net.",
      directSucceededFirst
        ? "Direct validation succeeds first, so alignment is not required for candidate material."
        : "Direct validation did not succeed first, so alignment would be needed before candidate material.",
      "Alignment mappings are reported separately and are not counted as direct success.",
    ],
  };
}

function buildDownstreamGuidanceScenario({
  context,
  capturedCandidate,
  packetValidation,
}) {
  const validation = capturedCandidate
    ? safelyValidateDraft({
        former_input_packet: context.formerInputPacket,
        draft: capturedCandidate,
      })
    : buildMissingValidationResult();
  const candidate = validation.candidate_review_material;
  const guidance = candidate
    ? buildWorkerFacingPerspectiveGuidanceFromCandidate({
        candidate,
        guidance_context: {
          work_goal:
            "Use the provenance-clean same-session capture candidate for advisory next-step planning only.",
          bounded_summary:
            "The capture is local, bounded, non-committed, and non-authoritative.",
        },
      })
    : null;
  const passed =
    packetValidation.status !== "blocked" &&
    guidance !== null &&
    guidance.scope_alignment.advisory_only === true &&
    guidance.next_smallest_useful_actions.length > 0 &&
    allAuthorityFlagsFalse(guidance.authority_flags);

  return {
    scenario_id: "downstream_guidance",
    title: "Downstream Guidance",
    worker_guidance_status: guidance?.guidance_status ?? "not_run",
    worker_guidance_advisory_only:
      guidance?.scope_alignment?.advisory_only ?? false,
    next_action_count: guidance?.next_smallest_useful_actions.length ?? 0,
    authority_flags_all_false: guidance
      ? allAuthorityFlagsFalse(guidance.authority_flags)
      : false,
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : [
          ...(guidance ? [] : ["worker-facing guidance did not run"]),
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
      "Worker-Facing Guidance runs on the direct candidate material.",
      "The guidance remains advisory-only and cannot escalate authority.",
    ],
  };
}

function buildStaleWordingRegressionScenario({
  context,
  capturedCandidate,
  packetValidation,
}) {
  const promptFindings = detectStaleCaptureWordingFindings({
    text: context.manualCopyPacket.copyable_codex_prompt_text,
    capturedTranscriptPresent: false,
    ignoreRequiredPreCaptureGuidance: true,
  });
  const candidateFindings = detectStaleCaptureWordingFindings({
    text: JSON.stringify(capturedCandidate ?? {}),
    capturedTranscriptPresent: true,
  });
  const staleFindings = uniqueTextList([...promptFindings, ...candidateFindings]);
  const sourceGapHistorical =
    context.formationInputBundle.unresolved_gaps.some((gap) =>
      gap.summary.includes("same-session fallback path"),
    ) &&
    capturedCandidate?.basis_quality_suggestion?.status === "needs_review";
  const passed =
    packetValidation.status !== "blocked" &&
    staleFindings.length === 0 &&
    sourceGapHistorical;

  return {
    scenario_id: "stale_wording_regression",
    title: "Stale Wording Regression",
    stale_wording_findings: staleFindings,
    stale_pr_479_prompt_contract_wording_present:
      context.manualCopyPacket.copyable_codex_prompt_text.includes(
        stalePr479PromptWording,
      ),
    stale_transcript_not_captured_current_state_wording_present:
      candidateFindings.includes("stale_source_packet_gap_echo"),
    stale_capture_next_action_after_supplied_transcript_present:
      candidateFindings.includes(
        "stale_capture_next_action_after_supplied_transcript",
      ),
    source_pre_capture_gap_treated_as_historical_context: sourceGapHistorical,
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : [
          ...staleFindings,
          ...(sourceGapHistorical
            ? []
            : ["source pre-capture gap was not treated as historical context"]),
        ],
    dogfood_notes: [
      "The generated prompt does not contain the stale PR #479 prompt wording.",
      "The captured candidate does not claim the current transcript is absent.",
      "The source pre-capture gap remains historical input context; the post-capture gap is review/confirmation.",
    ],
  };
}

function buildUnsafeAuthorityRegressionScenario(context) {
  const badDraft = {
    ...buildCapturedCodexPerspectiveCandidateDraft(context, { status: "passes" }),
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
      "Synthetic bad fixture includes a true authority flag, raw payload inclusion, non-pointer evidence ref, and source former input packet mismatch.",
      "The fixture is blocked/rejected safely and produces no candidate-compatible material.",
    ],
  };
}

function evaluateDogfood(scenarios) {
  const generated = requireScenario(scenarios, "generated_post_pr489_packet");
  const provenance = requireScenario(
    scenarios,
    "provenance_clean_capture_envelope",
  );
  const contract = requireScenario(
    scenarios,
    "captured_candidate_contract_fit",
  );
  const direct = requireScenario(scenarios, "direct_validation");
  const alignment = requireScenario(scenarios, "alignment_safety_net");
  const downstream = requireScenario(scenarios, "downstream_guidance");
  const stale = requireScenario(scenarios, "stale_wording_regression");
  const unsafe = requireScenario(scenarios, "unsafe_authority_regression");
  const conclusion =
    deriveProvenanceCleanTranscriptCaptureConclusion(scenarios);

  return {
    conclusion,
    recommended_next_pr_title:
      PROVENANCE_CLEAN_TRANSCRIPT_CAPTURE_RECOMMENDED_NEXT_PR,
    alternative_next_pr_title:
      PROVENANCE_CLEAN_TRANSCRIPT_CAPTURE_ALTERNATIVE_NEXT_PR,
    scenario_conclusions: scenarios.map((scenario) => ({
      scenario_id: scenario.scenario_id,
      conclusion: scenario.conclusion,
    })),
    answered_questions: {
      why_this_follows_pr_489:
        "PR #489 made the manual copy packet provenance-clean enough to test: it added stable prompt contract wording, copyable_prompt_hash, capture_return_envelope, source pre-capture gap guidance, and stale PR #479 wording prevention.",
      why_phone_manual_copy_was_avoided:
        "The user was on a phone and could not safely copy a large Manual Codex Former Draft Copy Packet between sessions.",
      fresh_generated_packet_provenance: `manual copy packet ${generated.manual_copy_packet_id}; former input packet ${generated.former_input_packet_id}; prompt hash ${generated.copyable_prompt_hash}.`,
      capture_method_and_honesty_note:
        provenance.capture_method_honesty_note,
      capture_envelope_result:
        provenance.provenance_status === "complete"
          ? "Complete: source_manual_copy_packet_id, source_former_input_packet_id, and source_prompt_hash are present and match the generated packet."
          : "Not complete.",
      contract_fit_result:
        contract.contract_fit_status === "fits_contract"
          ? "Direct contract fit returned fits_contract with no plain_summary or tension_kind warning."
          : `Direct contract fit returned ${contract.contract_fit_status}.`,
      direct_validation_result:
        direct.candidate_compatible_material
          ? `Direct validation returned ${direct.validation_status} and produced non-committed candidate-compatible material.`
          : `Direct validation returned ${direct.validation_status}.`,
      alignment_safety_net_result:
        alignment.alignment_required_for_candidate_material
          ? "Alignment was needed before candidate material existed."
          : "Alignment remains available, but direct validation succeeded first and alignment is not required for candidate material.",
      downstream_guidance_result:
        downstream.worker_guidance_advisory_only
          ? `Worker-Facing Guidance ran advisory-only with ${downstream.next_action_count} next actions.`
          : "Worker-Facing Guidance did not remain advisory-only.",
      stale_wording_regression_result:
        stale.stale_wording_findings.length === 0
          ? "No stale PR #479 prompt contract wording, stale transcript-not-captured current-state wording, or stale capture-next-action wording survived."
          : stale.stale_wording_findings.join(", "),
      provenance_completeness:
        provenance.no_not_supplied_in_chat_values &&
        provenance.provenance_status === "complete"
          ? "Complete, with no not_supplied_in_chat values and no fabricated metadata."
          : "Needs review.",
      expected_conclusion:
        "PASS with follow-up because the post-PR #489 provenance envelope works without phone packet copying, but a later separate-session capture may still be useful as confirmation.",
      unsafe_authority_regression_result:
        unsafe.unsafe_or_authority_survived
          ? "Unsafe or authority material survived."
          : "Synthetic unsafe authority fixture blocked safely.",
      why_browser_computer_use_not_run: noBrowserComputerUseReason,
    },
  };
}

function renderArtifact({ evaluation, scenarios, context, captureEnvelope }) {
  const generated = requireScenario(scenarios, "generated_post_pr489_packet");
  const provenance = requireScenario(
    scenarios,
    "provenance_clean_capture_envelope",
  );
  const contract = requireScenario(
    scenarios,
    "captured_candidate_contract_fit",
  );
  const direct = requireScenario(scenarios, "direct_validation");
  const alignment = requireScenario(scenarios, "alignment_safety_net");
  const downstream = requireScenario(scenarios, "downstream_guidance");
  const stale = requireScenario(scenarios, "stale_wording_regression");
  const unsafe = requireScenario(scenarios, "unsafe_authority_regression");
  const lines = [
    "# Perspective Codex Former Provenance-Clean Transcript Capture",
    "",
    `Generated at: ${PROVENANCE_CLEAN_TRANSCRIPT_CAPTURE_GENERATED_AT}`,
    `Conclusion: ${evaluation.conclusion}`,
    `Recommended next implementation PR title: ${evaluation.recommended_next_pr_title}`,
    `Alternative if fully sufficient: ${evaluation.alternative_next_pr_title}`,
    "",
    "## Summary",
    "",
    "This dogfood generated a fresh post-PR #489 Manual Codex Former Draft Copy Packet locally, used its copyable prompt text as bounded local input in this same human-started Codex work session, captured one CodexPerspectiveCandidateDraft-shaped response, and validated the result as non-committed review material.",
    "",
    "## Why This Follows PR #489",
    "",
    evaluation.answered_questions.why_this_follows_pr_489,
    "",
    "## Why Phone/Manual Copy Was Avoided",
    "",
    evaluation.answered_questions.why_phone_manual_copy_was_avoided,
    "",
    "## Fresh Generated Packet Provenance",
    "",
    evaluation.answered_questions.fresh_generated_packet_provenance,
    `Generated manual copy packet id fresh: ${generated.manual_copy_packet_id_fresh}`,
    `Generated former input packet id fresh: ${generated.former_input_packet_id_fresh}`,
    `Generated prompt hash fresh: ${generated.copyable_prompt_hash_fresh}`,
    `Stable contract label present: ${generated.stable_contract_label_present}`,
    `Stale PR #479 prompt wording present: ${generated.copyable_prompt_contains_stale_pr_479_contract_label}`,
    `Capture return envelope matches packet: ${generated.capture_return_envelope_matches_packet}`,
    "",
    "## Capture Method And Honesty Note",
    "",
    evaluation.answered_questions.capture_method_and_honesty_note,
    "",
    "## Capture Envelope Result",
    "",
    evaluation.answered_questions.capture_envelope_result,
    `capture_method: ${provenance.capture_method}`,
    `codex_surface_label: ${provenance.codex_surface_label}`,
    `prompt_was_generated_by_manual_copy_packet: ${provenance.prompt_was_generated_by_manual_copy_packet}`,
    `source_manual_copy_packet_id: ${provenance.source_manual_copy_packet_id}`,
    `source_former_input_packet_id: ${provenance.source_former_input_packet_id}`,
    `source_prompt_hash: ${provenance.source_prompt_hash}`,
    `captured_at: ${provenance.captured_at}`,
    `provenance_status: ${provenance.provenance_status}`,
    `fabricated_metadata: ${provenance.fabricated_metadata}`,
    "",
    "## Contract-Fit Result",
    "",
    evaluation.answered_questions.contract_fit_result,
    `Extracted candidate count: ${contract.extracted_candidate_count}`,
    `Contract-fit status: ${contract.contract_fit_status}`,
    `Contract-fit warning kinds: ${contract.contract_fit_warning_kinds.length > 0 ? contract.contract_fit_warning_kinds.join(", ") : "none"}`,
    "",
    "## Direct Validation Result",
    "",
    evaluation.answered_questions.direct_validation_result,
    `Validation status: ${direct.validation_status}`,
    `Candidate-compatible material: ${direct.candidate_compatible_material}`,
    `Candidate authority: ${direct.candidate_authority}`,
    `Candidate basis quality: ${direct.candidate_basis_quality}`,
    "",
    "## Alignment Safety-Net Result",
    "",
    evaluation.answered_questions.alignment_safety_net_result,
    `PR #484 alignment available: ${alignment.pr_484_alignment_available}`,
    `Alignment status: ${alignment.alignment_status}`,
    `Alignment required for candidate material: ${alignment.alignment_required_for_candidate_material}`,
    `Alignment applied mappings: ${alignment.alignment_applied_mappings.length > 0 ? alignment.alignment_applied_mappings.join(", ") : "none"}`,
    "",
    "## Downstream Guidance Result",
    "",
    evaluation.answered_questions.downstream_guidance_result,
    `Worker guidance status: ${downstream.worker_guidance_status}`,
    `Worker guidance advisory-only: ${downstream.worker_guidance_advisory_only}`,
    `Next action count: ${downstream.next_action_count}`,
    "",
    "## Stale Wording Regression Result",
    "",
    evaluation.answered_questions.stale_wording_regression_result,
    `Stale wording findings: ${stale.stale_wording_findings.length > 0 ? stale.stale_wording_findings.join(", ") : "none"}`,
    `Source pre-capture gap historical: ${stale.source_pre_capture_gap_treated_as_historical_context}`,
    "",
    "## Provenance Completeness",
    "",
    evaluation.answered_questions.provenance_completeness,
    `No not_supplied_in_chat values: ${provenance.no_not_supplied_in_chat_values}`,
    "",
    "## Unsafe Authority Regression",
    "",
    evaluation.answered_questions.unsafe_authority_regression_result,
    `Unsafe or authority survived: ${unsafe.unsafe_or_authority_survived}`,
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
    "## Skipped Checks With Concrete Reasons",
    "",
    `- Browser/computer-use validation: ${noBrowserComputerUseReason}`,
    "- Separate manual pasted Codex session: skipped because the user is on a phone and cannot safely copy a large packet between sessions.",
    "- DB validation: skipped because this PR adds no DB schema, persistence path, or state writer.",
    "- Provider/model validation: skipped because this PR intentionally does not call Codex, OpenAI, provider/model APIs, or SDKs from implementation.",
    "- Runtime/browser validation: skipped because this PR adds no UI, route, browser-visible surface, clipboard automation, or interactive copy control.",
    "",
    "## What Codex Did Not Do",
    "",
    "Codex did not call Codex from implementation, execute Codex from Augnes, call the Codex SDK, call OpenAI/provider/model APIs from implementation, call GitHub APIs from implementation behavior, use implementation network behavior, write DB state, add runtime routes, add UI, add clipboard automation, create proof/evidence/readiness records, approve, merge, publish, retry, replay, deploy, or make Core decisions.",
    "Codex did not claim this was a separate manual pasted Codex session.",
    "",
    "## Recommended Next Implementation PR Title",
    "",
    evaluation.recommended_next_pr_title,
    "",
    "## Scenarios",
    "",
    ...scenarios.flatMap(renderScenario),
    "## Capture Envelope Snapshot",
    "",
    "```json",
    JSON.stringify(
      {
        capture_method: captureEnvelope?.capture_method,
        capture_method_honesty_note:
          captureEnvelope?.capture_method_honesty_note,
        codex_surface_label: captureEnvelope?.codex_surface_label,
        prompt_was_generated_by_manual_copy_packet:
          captureEnvelope?.prompt_was_generated_by_manual_copy_packet,
        source_manual_copy_packet_id:
          captureEnvelope?.source_manual_copy_packet_id,
        source_former_input_packet_id:
          captureEnvelope?.source_former_input_packet_id,
        source_prompt_hash: captureEnvelope?.source_prompt_hash,
        captured_at: captureEnvelope?.captured_at,
        provenance_status: captureEnvelope?.provenance_status,
        redaction_notes: captureEnvelope?.redaction_notes,
      },
      null,
      2,
    ),
    "```",
    "",
    "## Generated Prompt Bounds",
    "",
    `copyable_codex_prompt_text length: ${context.manualCopyPacket.copyable_codex_prompt_text.length}`,
    `copyable_prompt_hash: ${context.manualCopyPacket.copyable_prompt_hash}`,
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

function classifyCaptureEnvelopeProvenance({ envelope, context }) {
  const missingFields = [];
  const blockedReasons = [];

  if (!envelope) {
    return {
      provenance_status: "blocked",
      missing_fields: [
        "source_manual_copy_packet_id",
        "source_former_input_packet_id",
        "source_prompt_hash",
      ],
      fabricated_metadata: false,
      blocked_reasons: ["capture envelope missing"],
    };
  }

  for (const field of [
    "source_manual_copy_packet_id",
    "source_former_input_packet_id",
    "source_prompt_hash",
  ]) {
    if (!hasUsableText(envelope[field])) {
      missingFields.push(field);
    }
  }
  if (
    envelope.source_manual_copy_packet_id !== context.manualCopyPacket.packet_id
  ) {
    blockedReasons.push("source_manual_copy_packet_id does not match packet");
  }
  if (
    envelope.source_former_input_packet_id !== context.formerInputPacket.packet_id
  ) {
    blockedReasons.push("source_former_input_packet_id does not match packet");
  }
  if (envelope.source_prompt_hash !== context.manualCopyPacket.copyable_prompt_hash) {
    blockedReasons.push("source_prompt_hash does not match generated prompt hash");
  }

  return {
    provenance_status:
      missingFields.length === 0 && blockedReasons.length === 0
        ? "complete"
        : blockedReasons.length > 0
          ? "blocked"
          : "needs_review",
    missing_fields: missingFields,
    fabricated_metadata: false,
    blocked_reasons: blockedReasons,
  };
}

function detectStaleCaptureWordingFindings({
  text,
  capturedTranscriptPresent,
  ignoreRequiredPreCaptureGuidance = false,
}) {
  const serialized = ignoreRequiredPreCaptureGuidance
    ? text.replace(sourcePreCaptureGapGuidance, "").replace(
        postCaptureStateGuidance,
        "",
      )
    : text;
  const lower = serialized.toLowerCase();
  const findings = [];

  if (
    serialized.includes(stalePr479PromptWording) ||
    serialized.includes("PR #479 prompt contract")
  ) {
    findings.push("stale_pr_479_prompt_contract_reference");
  }
  if (
    capturedTranscriptPresent &&
    (lower.includes("transcript has not yet been captured") ||
      lower.includes("transcript has not been captured") ||
      lower.includes("current returned transcript as still absent") ||
      lower.includes("this response does not exist"))
  ) {
    findings.push("stale_source_packet_gap_echo");
  }
  if (
    capturedTranscriptPresent &&
    (serialized.includes(
      "Capture the bounded second human-started Codex response transcript",
    ) ||
      lower.includes("capture the second real codex response transcript"))
  ) {
    findings.push("stale_capture_next_action_after_supplied_transcript");
  }

  return uniqueTextList(findings);
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
  for (const key of [
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
  ]) {
    if (hasOwn(draft.authority_flags, key)) aliases.push(`authority_flags.${key}`);
  }
  for (const key of [
    "raw_diffs_included",
    "raw_review_material_included",
    "raw_source_material_included",
    "private_material_included",
    "provider_material_included",
    "token_material_included",
    "billing_material_included",
    "api_credentials_included",
    "hidden_reasoning_included",
  ]) {
    if (hasOwn(draft.privacy_flags, key)) aliases.push(`privacy_flags.${key}`);
  }

  return aliases;
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

function summarizeContext(context) {
  return {
    former_input_packet_id: context.formerInputPacket.packet_id,
    manual_copy_packet_id: context.manualCopyPacket.packet_id,
    copyable_prompt_hash: context.manualCopyPacket.copyable_prompt_hash,
    prompt_text_length: context.manualCopyPacket.copyable_codex_prompt_text.length,
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

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasUsableText(value) {
  return (
    hasText(value) &&
    value !== "not_supplied_in_chat" &&
    !value.startsWith("<")
  );
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
  writeFileSync(path, text);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runPerspectiveCodexFormerProvenanceCleanTranscriptCaptureDogfood();
}
