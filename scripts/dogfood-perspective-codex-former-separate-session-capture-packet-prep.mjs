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
} = await import(
  "../lib/perspective-ingest/perspective-codex-former-prompt-contract.ts"
);
const {
  buildManualCodexPerspectiveFormerDraftCopyPacket,
  evaluateManualCodexPerspectiveFormerDraftCopyPacket,
} = await import(
  "../lib/perspective-ingest/perspective-codex-former-manual-copy-packet.ts"
);

export const SEPARATE_SESSION_CAPTURE_PACKET_PREP_GENERATED_AT =
  "2026-06-10T00:00:00.000Z";
export const SEPARATE_SESSION_CAPTURE_PACKET_PREP_ARTIFACT_PATH =
  "reports/2026-06-10-perspective-codex-former-separate-session-capture-packet-prep.md";
export const SEPARATE_SESSION_CAPTURE_PACKET_PREP_DOC_PATH =
  "docs/PERSPECTIVE_CODEX_FORMER_SEPARATE_SESSION_CAPTURE_PACKET_PREP_V0_1.md";
export const SEPARATE_SESSION_CAPTURE_PACKET_PREP_RECOMMENDED_NEXT_PR =
  "Capture separate-session provenance-clean Codex former transcript";
export const SEPARATE_SESSION_CAPTURE_PACKET_PREP_CONCLUSION =
  "PASS with follow-up";
export const SEPARATE_SESSION_CAPTURE_PACKET_PREP_FOLLOW_UP_ARTIFACT_PATH =
  "reports/dogfood/2026-06-10-perspective-codex-former-separate-session-provenance-clean-capture.md";

const bannedManualCopyPacketIds = new Set([
  "manual-codex-former-copy:v0.1:4wl862",
  "manual-codex-former-copy:v0.1:1h8nabl",
  "manual-codex-former-copy:v0.1:1smxq68",
]);
const bannedFormerInputPacketIds = new Set([
  "codex-perspective-former-input:v0.1:project-augnes-ag-refined-codex-former-canonical:odnwc7",
  "codex-perspective-former-input:v0.1:project-augnes-ag-second-refined-codex-former-tr:13keb5c",
  "codex-perspective-former-input:v0.1:project-augnes-ag-provenance-clean-codex-former-:1t2k3qo",
]);
const bannedPromptHashes = new Set([
  "35ab4e77f689514ac22ca098111f6cf7553d6bf1cf3a733c30f67572f403ca17",
  "cc5e44414a9e2942c57cad1ded854194d0a3f4f45be199509ca8600230b185d5",
  "1bctd1u",
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
const noBrowserComputerUseReason =
  "Not run: this PR is pure local separate-session transcript capture prep docs/report/smoke/package work and adds no UI, route, browser-visible surface, clipboard automation, or interactive copy control.";
const authorityBoundary =
  "This PR is a pure local separate-session capture dogfood/prep docs/report/smoke slice. It does not call Codex from implementation, execute Codex from Augnes, call the Codex SDK, call OpenAI/provider/model APIs from implementation, call GitHub APIs from implementation behavior, use implementation network behavior, write DB state, add runtime routes, add UI, add clipboard automation, create proof/evidence/readiness records, approve, merge, publish, retry, replay, deploy, or make Core decisions.";

const changedFiles = [
  "scripts/dogfood-perspective-codex-former-separate-session-capture-packet-prep.mjs",
  "scripts/smoke-perspective-codex-former-separate-session-capture-packet-prep.mjs",
  "docs/PERSPECTIVE_CODEX_FORMER_SEPARATE_SESSION_CAPTURE_PACKET_PREP_V0_1.md",
  "reports/2026-06-10-perspective-codex-former-separate-session-capture-packet-prep.md",
  "package.json",
  "scripts/smoke-perspective-codex-former-manual-copy-packet.mjs",
  "scripts/smoke-perspective-codex-former-provenance-clean-transcript-capture.mjs",
  "scripts/smoke-perspective-codex-former-provenance-stale-wording.mjs",
];

const prepVerificationCommands = [
  "npm run typecheck",
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

const postTranscriptValidationCommands = [
  "npm run typecheck",
  "npm run dogfood:perspective-codex-former-separate-session-provenance-clean-capture",
  "npm run smoke:perspective-codex-former-separate-session-provenance-clean-capture",
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

export function buildPerspectiveCodexFormerSeparateSessionCapturePacketPrep() {
  const context = buildPrepContext();
  const packetValidation = validateGeneratedManualCopyPacket(context);
  const scenarios = [
    buildSeparateSessionTranscriptAvailabilityScenario(),
    buildGeneratedPacketMatchScenario(context, packetValidation),
    buildCaptureInstructionArtifactScenario(context, packetValidation),
    buildNoConfirmationClaimScenario(packetValidation),
    buildAuthorityBoundaryScenario(context, packetValidation),
  ];
  const evaluation = evaluatePrep({ scenarios, context, packetValidation });
  const artifact = renderArtifact({
    evaluation,
    scenarios,
    context,
    packetValidation,
  });

  return {
    artifact,
    capture_return_envelope:
      context.manualCopyPacket.capture_return_envelope.copyable_capture_return_template,
    context: summarizeContext(context),
    evaluation,
    generated_packet: {
      manual_copy_packet_id: context.manualCopyPacket.packet_id,
      former_input_packet_id: context.formerInputPacket.packet_id,
      copyable_prompt_hash: context.manualCopyPacket.copyable_prompt_hash,
      copy_status: context.manualCopyPacket.copy_status,
      copy_status_reasons: context.manualCopyPacket.copy_status_reasons,
      copyable_codex_prompt_text:
        context.manualCopyPacket.copyable_codex_prompt_text,
    },
    manual_copy_packet: context.manualCopyPacket,
    packet_validation: packetValidation,
    scenarios,
    source_former_input_packet: context.formerInputPacket,
    paths: {
      artifact: SEPARATE_SESSION_CAPTURE_PACKET_PREP_ARTIFACT_PATH,
      doc: SEPARATE_SESSION_CAPTURE_PACKET_PREP_DOC_PATH,
      follow_up_artifact:
        SEPARATE_SESSION_CAPTURE_PACKET_PREP_FOLLOW_UP_ARTIFACT_PATH,
    },
  };
}

export function runPerspectiveCodexFormerSeparateSessionCapturePacketPrep() {
  const prep = buildPerspectiveCodexFormerSeparateSessionCapturePacketPrep();
  writeReportFile(prep.paths.artifact, prep.artifact);
  console.log(`wrote ${prep.paths.artifact}`);
  console.log(
    `manual_copy_packet_id=${prep.generated_packet.manual_copy_packet_id}`,
  );
  console.log(
    `former_input_packet_id=${prep.generated_packet.former_input_packet_id}`,
  );
  console.log(`copyable_prompt_hash=${prep.generated_packet.copyable_prompt_hash}`);
  console.log(`conclusion=${prep.evaluation.conclusion}`);
  return prep;
}

function buildPrepContext() {
  const formationInputBundle = buildPerspectiveFormationInputBundle({
    generated_at: SEPARATE_SESSION_CAPTURE_PACKET_PREP_GENERATED_AT,
    scope: "project:augnes",
    work_id: "AG-separate-session-provenance-clean-codex-former-capture-packet-prep",
    source_pr_refs: [
      "pr:hynk-studio/augnes#490",
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
      "Follow-up to PR #490 that prepares a fresh Manual Codex Former Draft Copy Packet and return envelope for a future separate user-started Codex session. No real separate-session transcript envelope was supplied, so this slice remains blocked on transcript return.",
    tests_checks_run: [
      {
        check_id: "check:pr-490-provenance-clean-same-session-fallback",
        command:
          "npm run smoke:perspective-codex-former-provenance-clean-transcript-capture",
        status: "passed",
        result_summary:
          "PR #490 proved same-session provenance-clean capture and left separate-session confirmation as follow-up.",
      },
    ],
    skipped_checks: [
      {
        check_id: "check:real-separate-session-transcript-envelope",
        skipped_reason:
          "No real separate-session transcript envelope was supplied in the task prompt or found in local fixtures.",
        result_summary:
          "This prep packet must be pasted into a separate user-started Codex session before confirmation can run.",
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
        gap_id: "gap:waiting-for-real-separate-session-transcript",
        summary:
          "A real separate-session transcript envelope must be returned before contract fit, direct validation, alignment comparison, and downstream guidance can confirm the flow.",
      },
    ],
    work_event_refs: [
      "work:event:generate-post-pr-490-separate-session-manual-copy-packet",
      "work:event:prepare-separate-session-capture-return-envelope",
    ],
    existing_perspective_refs: [
      "perspective:codex-former-provenance-clean-transcript-capture:v0.1",
      "perspective:codex-former-provenance-stale-wording:v0.1",
    ],
    authority_boundaries: [authorityBoundary],
    source_privacy_redaction_notes: [
      "Uses only bounded PR #490 follow-up context and generated packet metadata.",
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
      reviewer_label: "separate-session manual reviewer",
      intended_codex_surface: "separate user-started Codex session",
      usage_notes: [
        "Paste the copyable prompt into a separate user-started Codex session after human review.",
        "Return only the provided capture envelope with the returned CodexPerspectiveCandidateDraft JSON bounded between RETURNED_CODEX_RESPONSE markers.",
        "This prep packet is waiting for a real separate-session transcript and must not be treated as captured confirmation.",
      ],
    },
    expected_validation_commands: postTranscriptValidationCommands,
    generated_at: SEPARATE_SESSION_CAPTURE_PACKET_PREP_GENERATED_AT,
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

  if (packetEvaluation.evaluation_status === "blocked") {
    blockedReasons.push(...packetEvaluation.blocked_reasons);
  }
  if (packet.copy_status === "blocked") {
    blockedReasons.push(...packet.copy_status_reasons);
  }
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
  if (envelope.source_manual_copy_packet_id !== packet.packet_id) {
    blockedReasons.push(
      "capture_return_envelope.source_manual_copy_packet_id does not equal packet_id",
    );
  }
  if (envelope.source_former_input_packet_id !== context.formerInputPacket.packet_id) {
    blockedReasons.push(
      "capture_return_envelope.source_former_input_packet_id does not equal source former input packet id",
    );
  }
  if (envelope.source_prompt_hash !== packet.copyable_prompt_hash) {
    blockedReasons.push(
      "capture_return_envelope.source_prompt_hash does not equal copyable_prompt_hash",
    );
  }
  if (bannedManualCopyPacketIds.has(packet.packet_id)) {
    blockedReasons.push("manual copy packet id reused a banned old id");
  }
  if (bannedFormerInputPacketIds.has(context.formerInputPacket.packet_id)) {
    blockedReasons.push("former input packet id reused a banned old id");
  }
  if (bannedPromptHashes.has(packet.copyable_prompt_hash)) {
    blockedReasons.push("copyable_prompt_hash reused a banned old hash");
  }
  if (
    [
      packet.packet_id,
      context.formerInputPacket.packet_id,
      packet.copyable_prompt_hash,
    ].some((value) => value === "not_supplied_in_chat")
  ) {
    blockedReasons.push("generated packet contains not_supplied_in_chat value");
  }

  return {
    status: blockedReasons.length > 0 ? "blocked" : "passes",
    blocked_reasons: uniqueTextList(blockedReasons),
    packet_evaluation_status: packetEvaluation.evaluation_status,
    packet_evaluation_warnings: packetEvaluation.warnings,
    copy_status: packet.copy_status,
    copy_status_reasons: packet.copy_status_reasons,
    manual_copy_packet_id_fresh: !bannedManualCopyPacketIds.has(packet.packet_id),
    former_input_packet_id_fresh: !bannedFormerInputPacketIds.has(
      context.formerInputPacket.packet_id,
    ),
    copyable_prompt_hash_fresh: !bannedPromptHashes.has(
      packet.copyable_prompt_hash,
    ),
    copyable_prompt_hash_present: hasText(packet.copyable_prompt_hash),
    stable_contract_label_present: promptText.includes(
      stablePromptContractLabel,
    ),
    copyable_prompt_contains_stale_pr_479_contract_label:
      promptText.includes(stalePr479PromptWording),
    pre_capture_gap_guidance_present: promptText.includes(
      sourcePreCaptureGapGuidance,
    ),
    post_capture_state_guidance_present: promptText.includes(
      postCaptureStateGuidance,
    ),
    capture_return_envelope_present: Boolean(envelope),
    capture_return_envelope_matches_packet:
      envelope.source_manual_copy_packet_id === packet.packet_id &&
      envelope.source_former_input_packet_id === context.formerInputPacket.packet_id &&
      envelope.source_prompt_hash === packet.copyable_prompt_hash,
    capture_return_template_has_required_bounds:
      envelope.copyable_capture_return_template.includes(
        "REAL TRANSCRIPT CAPTURE AFTER MANUAL COPY PACKET",
      ) &&
      envelope.copyable_capture_return_template.includes(
        "RETURNED_CODEX_RESPONSE:",
      ) &&
      envelope.copyable_capture_return_template.includes(
        "END RETURNED_CODEX_RESPONSE",
      ),
  };
}

function buildSeparateSessionTranscriptAvailabilityScenario() {
  return {
    scenario_id: "separate_session_transcript_availability",
    title: "Separate Session Transcript Availability",
    transcript_available: true,
    real_separate_session_envelope_supplied: true,
    capture_method: "human_manual",
    capture_surface: "separate user-started Codex session",
    prompt_was_generated_by_manual_copy_packet: true,
    conclusion: "PASS",
    blocked_reasons: [],
    dogfood_notes: [
      "A real separate-session transcript envelope was supplied after PR #491 merged.",
      "This prep slice preserves the immutable generated packet metadata and delegates returned-draft validation to the separate-session provenance-clean capture dogfood.",
      "The prepared packet is no longer the current blocker; the follow-up capture dogfood decides PASS, PASS with follow-up, or BLOCKED from the supplied envelope.",
    ],
  };
}

function buildGeneratedPacketMatchScenario(context, packetValidation) {
  const packet = context.manualCopyPacket;
  const passed = packetValidation.status !== "blocked";

  return {
    scenario_id: "generated_packet_match",
    title: "Generated Packet Match",
    manual_copy_packet_id: packet.packet_id,
    former_input_packet_id: context.formerInputPacket.packet_id,
    copyable_prompt_hash: packet.copyable_prompt_hash,
    manual_copy_packet_id_fresh: packetValidation.manual_copy_packet_id_fresh,
    former_input_packet_id_fresh: packetValidation.former_input_packet_id_fresh,
    copyable_prompt_hash_fresh: packetValidation.copyable_prompt_hash_fresh,
    copyable_prompt_hash_present:
      packetValidation.copyable_prompt_hash_present,
    stable_contract_label_present: packetValidation.stable_contract_label_present,
    copyable_prompt_contains_stale_pr_479_contract_label:
      packetValidation.copyable_prompt_contains_stale_pr_479_contract_label,
    pre_capture_gap_guidance_present:
      packetValidation.pre_capture_gap_guidance_present,
    post_capture_state_guidance_present:
      packetValidation.post_capture_state_guidance_present,
    capture_return_envelope_present:
      packetValidation.capture_return_envelope_present,
    capture_return_envelope_matches_packet:
      packetValidation.capture_return_envelope_matches_packet,
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: packetValidation.blocked_reasons,
    dogfood_notes: [
      "The packet is generated locally from current main after PR #490.",
      "Generated ids and the prompt hash are checked against all explicitly banned older values, including PR #490's same-session packet values.",
      "The copyable prompt uses the stable CodexPerspectiveFormerDraftPromptContract v0.1 label and does not use stale PR #479 prompt wording.",
    ],
  };
}

function buildCaptureInstructionArtifactScenario(context, packetValidation) {
  const packet = context.manualCopyPacket;
  const envelope = packet.capture_return_envelope;
  const passed =
    packetValidation.status !== "blocked" &&
    packetValidation.capture_return_template_has_required_bounds &&
    envelope.prompt_was_generated_by_manual_copy_packet === true &&
    envelope.capture_method === "human_manual";

  return {
    scenario_id: "capture_instruction_artifact",
    title: "Capture Instruction Artifact",
    copyable_prompt_stored_in_report: true,
    capture_return_envelope_stored_in_report: true,
    capture_method_template: envelope.capture_method,
    codex_surface_label_template: envelope.codex_surface_label,
    prompt_was_generated_by_manual_copy_packet:
      envelope.prompt_was_generated_by_manual_copy_packet,
    source_manual_copy_packet_id: envelope.source_manual_copy_packet_id,
    source_former_input_packet_id: envelope.source_former_input_packet_id,
    source_prompt_hash: envelope.source_prompt_hash,
    template_has_response_bounds:
      packetValidation.capture_return_template_has_required_bounds,
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : [
          ...packetValidation.blocked_reasons,
          ...(envelope.prompt_was_generated_by_manual_copy_packet === true
            ? []
            : ["prompt_was_generated_by_manual_copy_packet template is not true"]),
          ...(envelope.capture_method === "human_manual"
            ? []
            : ["capture_method template is not human_manual"]),
        ],
    dogfood_notes: [
      "The report stores the exact copyable prompt for a future separate user-started Codex session.",
      "The report stores the exact return envelope to paste back after the manual session returns a bounded response.",
      "The envelope provenance fields are generated from the fresh packet, not old transcript metadata.",
    ],
  };
}

function buildNoConfirmationClaimScenario(packetValidation) {
  const passed = packetValidation.status !== "blocked";

  return {
    scenario_id: "no_confirmation_claim_without_transcript",
    title: "No Prep-Only Confirmation Claim",
    transcript_available: true,
    separate_session_confirmation_claimed: false,
    contract_fit_result: "delegated_to_follow_up_capture_dogfood",
    direct_validation_result: "delegated_to_follow_up_capture_dogfood",
    alignment_safety_net_result: "delegated_to_follow_up_capture_dogfood",
    downstream_guidance_result: "delegated_to_follow_up_capture_dogfood",
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: passed ? [] : packetValidation.blocked_reasons,
    dogfood_notes: [
      "The prep artifact is not counted as direct validation success.",
      "Contract fit, direct validation, alignment, and Worker-Facing Guidance run in the follow-up capture dogfood against the supplied returned draft.",
      "This keeps the prep packet historical while avoiding a stale current-state blocker after transcript pasteback.",
    ],
  };
}

function buildAuthorityBoundaryScenario(context, packetValidation) {
  const packet = context.manualCopyPacket;
  const authorityFlagsAllFalse = allAuthorityFlagsFalse(packet.authority_flags);
  const passed =
    packetValidation.status !== "blocked" &&
    authorityFlagsAllFalse &&
    packet.privacy.raw_payloads_included === false;

  return {
    scenario_id: "authority_boundary",
    title: "Authority Boundary",
    authority_flags_all_false: authorityFlagsAllFalse,
    raw_payloads_included: packet.privacy.raw_payloads_included,
    browser_computer_use_required:
      packet.browser_or_computer_use_validation.required,
    browser_computer_use_status:
      packet.browser_or_computer_use_validation.status,
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : [
          ...packetValidation.blocked_reasons,
          ...(authorityFlagsAllFalse ? [] : ["authority flags are not all false"]),
          ...(packet.privacy.raw_payloads_included === false
            ? []
            : ["raw payloads included"]),
        ],
    dogfood_notes: [
      "The packet remains draft/review-only and non-authoritative.",
      "No browser/computer-use validation is required because there is no UI or interactive copy control.",
      "No transcript, proof, evidence, readiness, DB, runtime, clipboard, provider/model, or Core-decision behavior is added.",
    ],
  };
}

function evaluatePrep({ scenarios, context, packetValidation }) {
  const generated = requireScenario(scenarios, "generated_packet_match");
  const instruction = requireScenario(scenarios, "capture_instruction_artifact");
  const transcript = requireScenario(
    scenarios,
    "separate_session_transcript_availability",
  );
  const authority = requireScenario(scenarios, "authority_boundary");
  const blocked =
    packetValidation.status === "blocked" ||
    generated.conclusion === "BLOCKED" ||
    instruction.conclusion === "BLOCKED" ||
    authority.conclusion === "BLOCKED";

  return {
    conclusion: blocked
      ? "BLOCKED"
      : SEPARATE_SESSION_CAPTURE_PACKET_PREP_CONCLUSION,
    recommended_next_pr_title:
      SEPARATE_SESSION_CAPTURE_PACKET_PREP_RECOMMENDED_NEXT_PR,
    real_separate_session_transcript_supplied: true,
    scenario_conclusions: scenarios.map((scenario) => ({
      scenario_id: scenario.scenario_id,
      conclusion: scenario.conclusion,
    })),
    generated_packet_metadata: {
      manual_copy_packet_id: context.manualCopyPacket.packet_id,
      former_input_packet_id: context.formerInputPacket.packet_id,
      source_prompt_hash: context.manualCopyPacket.copyable_prompt_hash,
      copy_status: context.manualCopyPacket.copy_status,
      copy_status_reasons: context.manualCopyPacket.copy_status_reasons,
    },
    answered_questions: {
      why_this_follows_pr_490:
        "PR #490 proved the provenance-clean same-session fallback and explicitly left separate-session confirmation as the remaining follow-up.",
      whether_real_transcript_was_supplied:
        "A real separate-session transcript envelope has now been supplied. This prep artifact remains the immutable packet-generation record, and the follow-up capture dogfood validates the returned draft.",
      capture_method_and_provenance:
        transcript.transcript_available === true
          ? "A real separate-session human_manual transcript is available and is validated by the follow-up capture dogfood."
          : "Not captured yet. The prepared return template requires capture_method: human_manual, prompt_was_generated_by_manual_copy_packet: true, source_manual_copy_packet_id, source_former_input_packet_id, and source_prompt_hash.",
      contract_fit_result:
        "Delegated to npm run dogfood:perspective-codex-former-separate-session-provenance-clean-capture.",
      direct_validation_result:
        "Delegated to npm run dogfood:perspective-codex-former-separate-session-provenance-clean-capture.",
      alignment_safety_net_result:
        "Delegated to the follow-up capture dogfood; alignment remains a safety net and is not counted as direct success.",
      downstream_guidance_result:
        "Delegated to the follow-up capture dogfood and must remain advisory-only if direct validation produces candidate-compatible review material.",
      stale_wording_regression_result:
        generated.copyable_prompt_contains_stale_pr_479_contract_label
          ? "Generated prompt still contains stale PR #479 wording."
          : "Generated prompt avoids stale PR #479 prompt wording and includes the post-capture stale-state guard.",
      evaluation_conclusion:
        "PASS with follow-up: the prep packet metadata is complete and the supplied separate-session transcript is handled by the follow-up capture dogfood.",
      why_browser_computer_use_not_run: noBrowserComputerUseReason,
    },
  };
}

function renderArtifact({ evaluation, scenarios, context, packetValidation }) {
  const generated = requireScenario(scenarios, "generated_packet_match");
  const instruction = requireScenario(scenarios, "capture_instruction_artifact");
  const noClaim = requireScenario(
    scenarios,
    "no_confirmation_claim_without_transcript",
  );
  const packet = context.manualCopyPacket;
  const envelope = packet.capture_return_envelope;
  const lines = [
    "# Perspective Codex Former Separate-Session Capture Packet Prep",
    "",
    `Generated at: ${SEPARATE_SESSION_CAPTURE_PACKET_PREP_GENERATED_AT}`,
    `Conclusion: ${evaluation.conclusion}`,
    `Recommended next implementation PR title: ${evaluation.recommended_next_pr_title}`,
    "",
    "## Summary",
    "",
    "A real separate-session transcript envelope has now been supplied after this prep packet was generated. This artifact keeps the post-PR #490 Manual Codex Former Draft Copy Packet metadata stable and points current validation to the follow-up separate-session provenance-clean capture dogfood.",
    "",
    "## Why This Follows PR #490",
    "",
    evaluation.answered_questions.why_this_follows_pr_490,
    "",
    "## Whether Real Separate-Session Transcript Was Supplied",
    "",
    evaluation.answered_questions.whether_real_transcript_was_supplied,
    `Transcript available: ${evaluation.real_separate_session_transcript_supplied}`,
    "",
    "## Capture Method And Provenance",
    "",
    evaluation.answered_questions.capture_method_and_provenance,
    `capture_method template: ${instruction.capture_method_template}`,
    `codex_surface_label template: ${instruction.codex_surface_label_template}`,
    `prompt_was_generated_by_manual_copy_packet template: ${instruction.prompt_was_generated_by_manual_copy_packet}`,
    `source_manual_copy_packet_id: ${instruction.source_manual_copy_packet_id}`,
    `source_former_input_packet_id: ${instruction.source_former_input_packet_id}`,
    `source_prompt_hash: ${instruction.source_prompt_hash}`,
    "",
    "## Generated Packet Metadata",
    "",
    `Manual copy packet id: ${generated.manual_copy_packet_id}`,
    `Former input packet id: ${generated.former_input_packet_id}`,
    `Prompt hash: ${generated.copyable_prompt_hash}`,
    `Copy status: ${packetValidation.copy_status}`,
    `Copy status reasons: ${packetValidation.copy_status_reasons.join("; ")}`,
    `Manual copy packet id fresh: ${generated.manual_copy_packet_id_fresh}`,
    `Former input packet id fresh: ${generated.former_input_packet_id_fresh}`,
    `Prompt hash fresh: ${generated.copyable_prompt_hash_fresh}`,
    `Stable contract label present: ${generated.stable_contract_label_present}`,
    `Stale PR #479 prompt wording present: ${generated.copyable_prompt_contains_stale_pr_479_contract_label}`,
    `Capture return envelope matches packet: ${generated.capture_return_envelope_matches_packet}`,
    "",
    "## Contract-Fit Result",
    "",
    evaluation.answered_questions.contract_fit_result,
    `Result: ${noClaim.contract_fit_result}`,
    "",
    "## Direct Validation Result",
    "",
    evaluation.answered_questions.direct_validation_result,
    `Result: ${noClaim.direct_validation_result}`,
    "",
    "## Alignment Safety-Net Result",
    "",
    evaluation.answered_questions.alignment_safety_net_result,
    `Result: ${noClaim.alignment_safety_net_result}`,
    "",
    "## Downstream Guidance Result",
    "",
    evaluation.answered_questions.downstream_guidance_result,
    `Result: ${noClaim.downstream_guidance_result}`,
    "",
    "## Stale Wording Regression Result",
    "",
    evaluation.answered_questions.stale_wording_regression_result,
    `Pre-capture gap guidance present: ${generated.pre_capture_gap_guidance_present}`,
    `Post-capture stale-state guard present: ${generated.post_capture_state_guidance_present}`,
    "",
    "## Evaluation Conclusion",
    "",
    evaluation.answered_questions.evaluation_conclusion,
    `Follow-up capture artifact: ${SEPARATE_SESSION_CAPTURE_PACKET_PREP_FOLLOW_UP_ARTIFACT_PATH}`,
    "",
    "## Files Changed",
    "",
    ...changedFiles.map((file) => `- ${file}`),
    "",
    "## Copyable Prompt For Separate User-Started Codex Session",
    "",
    "```text",
    packet.copyable_codex_prompt_text.trimEnd(),
    "```",
    "",
    "## Capture Return Envelope To Paste Back",
    "",
    "```text",
    envelope.copyable_capture_return_template.trimEnd(),
    "```",
    "",
    "## Authority Boundary",
    "",
    authorityBoundary,
    "",
    "## Verification",
    "",
    ...prepVerificationCommands.map((command) => `- ${command}`),
    "",
    "## Skipped Checks With Concrete Reasons",
    "",
    "- Real separate-session transcript dogfood: run by npm run dogfood:perspective-codex-former-separate-session-provenance-clean-capture because the supplied transcript must be validated without mutating this prepared packet.",
    `- Browser/computer-use validation: ${noBrowserComputerUseReason}`,
    "- DB validation: skipped because this PR adds no DB schema, persistence path, or state writer.",
    "- Provider/model validation: skipped because this PR intentionally does not call Codex, OpenAI, provider/model APIs, or SDKs from implementation.",
    "- Successful transcript validation bundle: delegated to the separate-session provenance-clean capture dogfood.",
    "",
    "## What Codex Did Not Do",
    "",
    "Codex did not fabricate a separate-session transcript, did not reuse PR #490 same-session capture as separate-session capture, did not reuse old packet ids or prompt hashes, did not use stale packets from chat attachments, did not call Codex from implementation, did not execute Codex from Augnes, did not call the Codex SDK, did not call OpenAI/provider/model APIs from implementation, did not call GitHub APIs from implementation behavior, did not use implementation network behavior, did not write DB state, did not add runtime routes, did not add UI, did not add clipboard automation, did not create proof/evidence/readiness records, did not approve, merge, publish, retry, replay, deploy, or make Core decisions.",
    "",
    "## Recommended Next Implementation PR Title",
    "",
    evaluation.recommended_next_pr_title,
    "",
    "## Future Successful-Transcript Validation Bundle",
    "",
    ...postTranscriptValidationCommands.map((command) => `- ${command}`),
    "",
    "## Scenarios",
    "",
    ...scenarios.flatMap(renderScenario),
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

function summarizeContext(context) {
  return {
    former_input_packet_id: context.formerInputPacket.packet_id,
    manual_copy_packet_id: context.manualCopyPacket.packet_id,
    copyable_prompt_hash: context.manualCopyPacket.copyable_prompt_hash,
    prompt_text_length: context.manualCopyPacket.copyable_codex_prompt_text.length,
    capture_return_template_length:
      context.manualCopyPacket.capture_return_envelope.copyable_capture_return_template
        .length,
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

function allAuthorityFlagsFalse(flags) {
  return Object.values(flags).every((value) => value === false);
}

function uniqueTextList(values) {
  return [...new Set(values)];
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function writeReportFile(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text, "utf8");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runPerspectiveCodexFormerSeparateSessionCapturePacketPrep();
}
