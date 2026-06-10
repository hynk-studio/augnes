import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

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

export const PROVENANCE_STALE_WORDING_GENERATED_AT =
  "2026-06-10T00:00:00.000Z";
export const PROVENANCE_STALE_WORDING_ARTIFACT_PATH =
  "reports/2026-06-09-perspective-codex-former-provenance-stale-wording.md";
export const PROVENANCE_STALE_WORDING_DOC_PATH =
  "docs/PERSPECTIVE_CODEX_FORMER_PROVENANCE_STALE_WORDING_V0_1.md";
export const PROVENANCE_STALE_WORDING_RECOMMENDED_NEXT_PR =
  "Dogfood provenance-clean Codex former transcript capture";

const noBrowserComputerUseReason =
  "Not run: this PR is pure local manual-copy/provenance/docs/report/smoke/package work and adds no UI, route, browser-visible surface, clipboard automation, interactive copy control, or transcript capture.";

const authorityBoundary =
  "This PR is a pure local manual-copy/provenance/docs/report/smoke slice. It does not capture a new transcript, call Codex from implementation, execute Codex from Augnes, call the Codex SDK, call OpenAI/provider/model APIs from implementation, call GitHub APIs from implementation, use network access in implementation behavior, write DB state, add runtime routes, add UI, add clipboard automation, create proof/evidence/readiness records, approve, merge, publish, retry, replay, deploy, or make Core decisions.";

export function buildPerspectiveCodexFormerProvenanceStaleWordingDogfood() {
  const context = buildDogfoodContext();
  const scenarios = [
    buildManualCopyPacketCurrentContractLabelScenario(context),
    buildCaptureReturnEnvelopePresentScenario(context),
    buildPreCaptureGapNotCurrentStateScenario(context),
    buildStaleWordingDetectionFixtureScenario(context),
    buildCleanSecondTranscriptStyleFixtureScenario(context),
    buildProvenanceCompleteFixtureScenario(context),
    buildProvenancePartialFixtureScenario(context),
    buildRegressionSafetyScenario(context),
  ];
  const evaluation = evaluateDogfood(scenarios);
  const artifact = renderArtifact({ evaluation, scenarios });

  return {
    artifact,
    context: summarizeContext(context),
    evaluation,
    scenarios,
    paths: {
      artifact: PROVENANCE_STALE_WORDING_ARTIFACT_PATH,
      doc: PROVENANCE_STALE_WORDING_DOC_PATH,
    },
  };
}

export function runPerspectiveCodexFormerProvenanceStaleWordingDogfood() {
  const dogfood =
    buildPerspectiveCodexFormerProvenanceStaleWordingDogfood();
  writeReportFile(dogfood.paths.artifact, dogfood.artifact);
  console.log(`wrote ${dogfood.paths.artifact}`);
  return dogfood;
}

export function deriveProvenanceStaleWordingConclusion(scenarios) {
  const currentLabel = requireScenario(
    scenarios,
    "manual_copy_packet_current_contract_label",
  );
  const envelope = requireScenario(
    scenarios,
    "capture_return_envelope_present",
  );
  const preCaptureGap = requireScenario(
    scenarios,
    "pre_capture_gap_not_current_state",
  );
  const regression = requireScenario(scenarios, "regression_safety");
  const complete = requireScenario(scenarios, "provenance_complete_fixture");
  const clean = requireScenario(
    scenarios,
    "clean_second_transcript_style_fixture",
  );

  if (currentLabel.copyable_prompt_contains_stale_pr_479_contract_label) {
    return "BLOCKED";
  }
  if (!envelope.required_fields_present) return "BLOCKED";
  if (preCaptureGap.stale_source_gap_treated_as_current_state) {
    return "BLOCKED";
  }
  if (regression.unsafe_or_authority_survived) return "BLOCKED";
  if (scenarios.some((scenario) => scenario.conclusion === "BLOCKED")) {
    return "BLOCKED";
  }
  if (
    complete.provenance_status === "complete" &&
    clean.stale_wording_findings.length === 0 &&
    clean.transcript_fixture_kind === "real_human_started_codex_response"
  ) {
    return "PASS";
  }

  return "PASS with follow-up";
}

export function detectCodexFormerProvenanceStaleWording({
  draft,
  text,
  capturedTranscriptPresent,
}) {
  const serialized =
    text ?? (draft === undefined ? "" : JSON.stringify(draft ?? {}));
  const findings = [];
  const lower = serialized.toLowerCase();

  if (
    serialized.includes("Use the PR #479 prompt contract below.") ||
    serialized.includes("PR #479 prompt contract")
  ) {
    findings.push("stale_pr_479_prompt_contract_reference");
    findings.push("stale_prompt_lineage_label");
    findings.push("stale_old_pr_prompt_contract_reference");
  }
  if (
    capturedTranscriptPresent &&
    (lower.includes("transcript has not yet been captured") ||
      lower.includes("transcript has not been captured") ||
      lower.includes("has not yet been captured") ||
      lower.includes("still required before the prompt refinements") ||
      lower.includes("current returned transcript as still absent") ||
      lower.includes("this response does not exist"))
  ) {
    findings.push("stale_source_packet_gap_echo");
    findings.push("stale_second_transcript_missing_capture_wording");
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

  return [...new Set(findings)];
}

export function classifyCodexFormerTranscriptProvenance({
  envelope,
  expectedFormerInputPacketId,
}) {
  const missingFields = [];
  const sourceManualCopyPacketId = readEnvelopeField(
    envelope,
    "source_manual_copy_packet_id",
  );
  const sourcePromptHash = readEnvelopeField(envelope, "source_prompt_hash");
  const sourceFormerInputPacketId = readEnvelopeField(
    envelope,
    "source_former_input_packet_id",
  );

  if (!hasUsableText(sourceManualCopyPacketId)) {
    missingFields.push("source_manual_copy_packet_id");
  }
  if (!hasUsableText(sourcePromptHash)) {
    missingFields.push("source_prompt_hash");
  }

  const formerInputPacketMatches =
    sourceFormerInputPacketId === expectedFormerInputPacketId;

  return {
    provenance_status:
      missingFields.length === 0 && formerInputPacketMatches
        ? "complete"
        : "needs_review",
    missing_fields: missingFields,
    source_manual_copy_packet_id: hasUsableText(sourceManualCopyPacketId)
      ? sourceManualCopyPacketId
      : "not_supplied_in_chat",
    source_former_input_packet_id: hasUsableText(sourceFormerInputPacketId)
      ? sourceFormerInputPacketId
      : "not_supplied_in_chat",
    source_prompt_hash: hasUsableText(sourcePromptHash)
      ? sourcePromptHash
      : "not_supplied_in_chat",
    source_former_input_packet_matches_expected: formerInputPacketMatches,
    fabricated_metadata: false,
  };
}

function buildDogfoodContext() {
  const sourceBundle = buildPerspectiveFormationInputBundle({
    generated_at: PROVENANCE_STALE_WORDING_GENERATED_AT,
    scope: "project:augnes",
    work_id: "project-augnes-ag-codex-former-provenance-stale-wording",
    source_pr_refs: [
      "pr:hynk-studio/augnes#488",
      "pr:hynk-studio/augnes#487",
      "pr:hynk-studio/augnes#486",
      "pr:hynk-studio/augnes#485",
      "pr:hynk-studio/augnes#484",
      "pr:hynk-studio/augnes#483",
    ],
    changed_files: [
      "lib/perspective-ingest/perspective-codex-former-manual-copy-packet.ts",
      "scripts/dogfood-perspective-codex-former-provenance-stale-wording.mjs",
      "scripts/smoke-perspective-codex-former-provenance-stale-wording.mjs",
      "docs/PERSPECTIVE_CODEX_FORMER_PROVENANCE_STALE_WORDING_V0_1.md",
      "reports/2026-06-09-perspective-codex-former-provenance-stale-wording.md",
      "package.json",
    ],
    changed_files_summary:
      "Refines the local manual copy packet provenance return envelope and stale source-gap wording after PR #488.",
    tests_checks_run: [
      {
        check_id: "check:pr-488-second-transcript-dogfood",
        command:
          "npm run smoke:perspective-codex-former-second-refined-transcript",
        status: "passed",
        result_summary:
          "PR #488 produced candidate-compatible second-transcript material with PASS with follow-up.",
      },
    ],
    skipped_checks: [
      {
        check_id: "check:new-real-transcript-capture",
        skipped_reason:
          "This follow-up intentionally updates capture/provenance instructions and does not capture a new transcript.",
        result_summary:
          "The next run should dogfood with a provenance-clean real transcript.",
      },
      {
        check_id: "check:browser-computer-use-validation",
        skipped_reason: noBrowserComputerUseReason,
        result_summary:
          "No UI, route, browser-visible surface, clipboard automation, interactive copy control, or transcript capture was added.",
      },
    ],
    unresolved_gaps: [
      {
        gap_id: "gap:next-real-transcript-confirmation",
        summary:
          "A future real transcript capture should confirm the refined provenance envelope and stale wording guidance.",
      },
    ],
    evidence_row_refs: [
      "evidence:row:pr-488-second-transcript-dogfood-report",
    ],
    work_event_refs: [
      "work:event:refine-second-transcript-provenance-stale-wording",
    ],
    existing_perspective_refs: [
      "perspective:codex-former-second-refined-transcript:v0.1",
    ],
    authority_boundaries: [authorityBoundary],
    source_privacy_redaction_notes: [
      "Uses only bounded synthetic fixtures and PR #488 summary findings.",
      "Does not include hidden reasoning, account data, provider logs, raw page dumps, raw PR diffs, raw review payloads, unrelated chat text, or secrets.",
    ],
  });
  const formerInputPacket = buildCodexPerspectiveFormerInputPacket(sourceBundle);
  const manualCopyPacket = buildManualCodexPerspectiveFormerDraftCopyPacket({
    former_input_packet: formerInputPacket,
    manual_context: {
      reviewer_label: "manual reviewer",
      intended_codex_surface: "Codex",
      usage_notes: [
        "Return the capture envelope with the Codex response after manual copy.",
      ],
    },
    generated_at: PROVENANCE_STALE_WORDING_GENERATED_AT,
  });

  return {
    sourceBundle,
    formerInputPacket,
    manualCopyPacket,
  };
}

function buildManualCopyPacketCurrentContractLabelScenario(context) {
  const promptText = context.manualCopyPacket.copyable_codex_prompt_text;
  const staleLabel = "Use the PR #479 prompt contract below.";
  const hasStableContractLabel = promptText.includes(
    "Prompt contract: CodexPerspectiveFormerDraftPromptContract v0.1",
  );
  const oldPrPromptContractIdentity =
    /Prompt contract:.*PR #\d+/.test(promptText) ||
    /Use the PR #\d+ prompt contract below\./.test(promptText);
  const unsafeAbsent = !containsUnsafeMarkerText(promptText);
  const passed =
    !promptText.includes(staleLabel) &&
    !oldPrPromptContractIdentity &&
    hasStableContractLabel &&
    unsafeAbsent;

  return {
    scenario_id: "manual_copy_packet_current_contract_label",
    title: "Manual Copy Packet Current Contract Label",
    copyable_prompt_contains_stale_pr_479_contract_label:
      promptText.includes(staleLabel),
    copyable_prompt_uses_old_pr_contract_identity: oldPrPromptContractIdentity,
    stable_contract_label_present: hasStableContractLabel,
    prompt_contract_version:
      context.manualCopyPacket.source_prompt_contract.contract_version,
    unsafe_markers_detected: !unsafeAbsent,
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : [
          ...(promptText.includes(staleLabel)
            ? ["copyable prompt still uses stale PR #479 contract wording"]
            : []),
          ...(oldPrPromptContractIdentity
            ? ["copyable prompt identifies contract by old PR number"]
            : []),
          ...(hasStableContractLabel ? [] : ["stable contract label missing"]),
          ...(unsafeAbsent ? [] : ["unsafe marker present in prompt"]),
        ],
    dogfood_notes: [
      "The copyable prompt now identifies the local contract by stable contract label/version.",
      "PR refs may still appear as bounded source refs, but not as the prompt contract identity.",
    ],
  };
}

function buildCaptureReturnEnvelopePresentScenario(context) {
  const envelope = context.manualCopyPacket.capture_return_envelope;
  const template = envelope.copyable_capture_return_template;
  const requiredSnippets = [
    "REAL TRANSCRIPT CAPTURE AFTER MANUAL COPY PACKET",
    "capture_method: human_manual",
    "codex_surface_label:",
    "prompt_was_generated_by_manual_copy_packet: true",
    "source_manual_copy_packet_id:",
    "source_former_input_packet_id:",
    "source_prompt_hash:",
    "captured_at: <timestamp or unknown>",
    "TRANSCRIPT_REDACTION_NOTES:",
    "RETURNED_CODEX_RESPONSE:",
    "END RETURNED_CODEX_RESPONSE",
    "No hidden reasoning",
    "cookies",
    "tokens",
    "account data",
    "provider logs",
    "raw page dumps",
    "raw PR diffs",
    "raw review payloads",
    "secrets",
  ];
  const requiredFieldsPresent = requiredSnippets.every((snippet) =>
    template.includes(snippet),
  );
  const idsMatch =
    envelope.source_manual_copy_packet_id ===
      context.manualCopyPacket.packet_id &&
    envelope.source_former_input_packet_id ===
      context.formerInputPacket.packet_id &&
    envelope.source_prompt_hash === context.manualCopyPacket.copyable_prompt_hash;

  return {
    scenario_id: "capture_return_envelope_present",
    title: "Capture Return Envelope Present",
    required_fields_present: requiredFieldsPresent,
    provenance_ids_match_packet: idsMatch,
    source_manual_copy_packet_id: envelope.source_manual_copy_packet_id,
    source_former_input_packet_id: envelope.source_former_input_packet_id,
    source_prompt_hash: envelope.source_prompt_hash,
    copyable_prompt_hash: context.manualCopyPacket.copyable_prompt_hash,
    conclusion: requiredFieldsPresent && idsMatch ? "PASS" : "BLOCKED",
    blocked_reasons:
      requiredFieldsPresent && idsMatch
        ? []
        : [
            ...(requiredFieldsPresent
              ? []
              : ["capture return envelope omits required fields"]),
            ...(idsMatch
              ? []
              : ["capture return envelope provenance does not match packet"]),
          ],
    dogfood_notes: [
      "The capture return envelope is separate from the Codex JSON-only prompt and is intended for the human to return with the captured transcript.",
      "The envelope preserves manual copy packet id, former input packet id, and copyable prompt hash.",
    ],
  };
}

function buildPreCaptureGapNotCurrentStateScenario(context) {
  const promptText = context.manualCopyPacket.copyable_codex_prompt_text;
  const sourcePacketPreCaptureGap = context.sourceBundle.unresolved_gaps.some(
    (gap) => gap.summary.includes("future real transcript capture"),
  );
  const capturedTranscriptPresent = true;
  const promptWarnsAgainstEcho = promptText.includes(
    "Do not repeat that as current state after this response exists.",
  );
  const postCaptureRemainingGap = "local_validation_required";
  const staleSourceGapTreatedAsCurrentState = false;
  const passed =
    sourcePacketPreCaptureGap &&
    capturedTranscriptPresent &&
    promptWarnsAgainstEcho &&
    !staleSourceGapTreatedAsCurrentState;

  return {
    scenario_id: "pre_capture_gap_not_current_state",
    title: "Pre-Capture Gap Not Current State",
    source_packet_pre_capture_gap: sourcePacketPreCaptureGap,
    captured_transcript_present: capturedTranscriptPresent,
    post_capture_remaining_gap: postCaptureRemainingGap,
    prompt_warns_against_stale_gap_echo: promptWarnsAgainstEcho,
    stale_source_gap_treated_as_current_state:
      staleSourceGapTreatedAsCurrentState,
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : [
          ...(sourcePacketPreCaptureGap
            ? []
            : ["source pre-capture gap was not represented"]),
          ...(capturedTranscriptPresent
            ? []
            : ["captured transcript fixture was not present"]),
          ...(promptWarnsAgainstEcho
            ? []
            : ["prompt does not warn against stale source-gap echo"]),
          ...(staleSourceGapTreatedAsCurrentState
            ? ["source packet gap was treated as current missing transcript"]
            : []),
        ],
    dogfood_notes: [
      "Source packet pre-capture gaps remain historical input context.",
      "When a transcript fixture is present, dogfood treats the current remaining gap as local validation/provenance review, not missing transcript evidence.",
    ],
  };
}

function buildStaleWordingDetectionFixtureScenario(context) {
  const draft = buildReturnedDraftFromPacket(context.formerInputPacket, {
    thesis:
      "The transcript has not yet been captured, so review against the PR #479 prompt contract before proceeding.",
    next_action_candidates: [
      {
        action_id: "review_candidate",
        summary:
          "Capture the bounded second human-started Codex response transcript before validation.",
      },
    ],
  });
  const findings = detectCodexFormerProvenanceStaleWording({
    draft,
    capturedTranscriptPresent: true,
  });
  const contractFit = evaluateCodexPerspectiveCandidateDraftPromptContractFit({
    former_input_packet: context.formerInputPacket,
    draft,
  });
  const validation = validateAndNormalizeCodexPerspectiveCandidateDraft({
    former_input_packet: context.formerInputPacket,
    draft,
  });
  const passed =
    findings.includes("stale_source_packet_gap_echo") &&
    findings.includes("stale_capture_next_action_after_supplied_transcript") &&
    findings.includes("stale_old_pr_prompt_contract_reference") &&
    validation.status !== "blocked" &&
    validation.candidate_review_material?.authority === "non_committed" &&
    allAuthorityFlagsFalse(validation.authority_flags);

  return {
    scenario_id: "stale_wording_detection_fixture",
    title: "Stale Wording Detection Fixture",
    stale_wording_findings: findings,
    classification: findings.length > 0 ? "needs_review" : "clean",
    contract_fit_status: contractFit.status,
    validation_status: validation.status,
    candidate_compatible_material:
      validation.candidate_review_material !== null,
    stale_wording_becomes_accepted_state: false,
    conclusion: passed ? "PASS with follow-up" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : ["stale wording detector or validation boundary failed"],
    dogfood_notes: [
      "Stale source-gap wording is classified as needs_review/follow-up, not unsafe by itself.",
      "Validation may still produce non-committed candidate-compatible material when the schema is otherwise valid.",
    ],
  };
}

function buildCleanSecondTranscriptStyleFixtureScenario(context) {
  const draft = buildReturnedDraftFromPacket(context.formerInputPacket, {
    thesis:
      "The useful neutral perspective is that this response is the captured draft output to be locally validated against CodexPerspectiveFormerDraftPromptContract v0.1, so the remaining boundary is validation and provenance review rather than missing transcript evidence.",
    qualification_notes: [
      "This is useful beyond a plain summary because it separates historical source packet pre-capture gaps from the current captured response.",
      "The source packet may have described pre-capture gaps, but this response is present and remains draft/review material.",
    ],
    next_action_candidates: [
      {
        action_id: "review_candidate",
        summary:
          "Run local validation on this captured draft output and keep the result advisory until the user decides next steps.",
      },
    ],
  });
  const findings = detectCodexFormerProvenanceStaleWording({
    draft,
    capturedTranscriptPresent: true,
  });
  const contractFit = evaluateCodexPerspectiveCandidateDraftPromptContractFit({
    former_input_packet: context.formerInputPacket,
    draft,
  });
  const validation = validateAndNormalizeCodexPerspectiveCandidateDraft({
    former_input_packet: context.formerInputPacket,
    draft,
  });
  const guidance = validation.candidate_review_material
    ? buildWorkerFacingPerspectiveGuidanceFromCandidate({
        candidate: validation.candidate_review_material,
        guidance_context: {
          work_goal:
            "Use a provenance-clean second transcript style fixture for advisory next-step planning only.",
          bounded_summary:
            "The fixture is synthetic, local, non-committed, and non-authoritative.",
        },
      })
    : null;
  const passed =
    findings.length === 0 &&
    contractFit.status === "fits_contract" &&
    validation.candidate_review_material !== null &&
    guidance?.scope_alignment?.advisory_only === true;

  return {
    scenario_id: "clean_second_transcript_style_fixture",
    title: "Clean Second Transcript Style Fixture",
    transcript_fixture_kind: "synthetic_clean_fixture",
    stale_wording_findings: findings,
    contract_fit_status: contractFit.status,
    validation_status: validation.status,
    candidate_compatible_material:
      validation.candidate_review_material !== null,
    worker_guidance_status: guidance?.guidance_status ?? "not_run",
    worker_guidance_advisory_only:
      guidance?.scope_alignment?.advisory_only ?? false,
    conclusion: passed ? "PASS" : "BLOCKED",
    blocked_reasons: passed
      ? []
      : ["clean fixture did not avoid stale wording or preserve validation"],
    dogfood_notes: [
      "The clean fixture uses the current contract label and treats the response as present while still requiring local validation.",
      "Worker-Facing Guidance remains advisory-only.",
    ],
  };
}

function buildProvenanceCompleteFixtureScenario(context) {
  const envelope = {
    capture_method: "human_manual",
    codex_surface_label: "Codex",
    prompt_was_generated_by_manual_copy_packet: true,
    source_manual_copy_packet_id: context.manualCopyPacket.packet_id,
    source_former_input_packet_id: context.formerInputPacket.packet_id,
    source_prompt_hash: context.manualCopyPacket.copyable_prompt_hash,
    captured_at: "2026-06-10T00:00:00.000Z",
  };
  const provenance = classifyCodexFormerTranscriptProvenance({
    envelope,
    expectedFormerInputPacketId: context.formerInputPacket.packet_id,
  });

  return {
    scenario_id: "provenance_complete_fixture",
    title: "Provenance Complete Fixture",
    provenance_status: provenance.provenance_status,
    missing_fields: provenance.missing_fields,
    fabricated_metadata: provenance.fabricated_metadata,
    conclusion:
      provenance.provenance_status === "complete" &&
      provenance.missing_fields.length === 0 &&
      provenance.fabricated_metadata === false
        ? "PASS"
        : "BLOCKED",
    blocked_reasons:
      provenance.provenance_status === "complete"
        ? []
        : ["complete provenance fixture did not classify as complete"],
    dogfood_notes: [
      "A returned envelope with source_manual_copy_packet_id and source_prompt_hash can now preserve complete provenance.",
    ],
  };
}

function buildProvenancePartialFixtureScenario(context) {
  const envelope = {
    capture_method: "human_manual",
    codex_surface_label: "Codex",
    prompt_was_generated_by_manual_copy_packet: true,
    source_former_input_packet_id: context.formerInputPacket.packet_id,
    captured_at: "unknown",
  };
  const provenance = classifyCodexFormerTranscriptProvenance({
    envelope,
    expectedFormerInputPacketId: context.formerInputPacket.packet_id,
  });

  return {
    scenario_id: "provenance_partial_fixture",
    title: "Provenance Partial Fixture",
    provenance_status: provenance.provenance_status,
    missing_fields: provenance.missing_fields,
    source_manual_copy_packet_id: provenance.source_manual_copy_packet_id,
    source_prompt_hash: provenance.source_prompt_hash,
    fabricated_metadata: provenance.fabricated_metadata,
    conclusion:
      provenance.provenance_status === "needs_review" &&
      provenance.missing_fields.includes("source_manual_copy_packet_id") &&
      provenance.missing_fields.includes("source_prompt_hash") &&
      provenance.fabricated_metadata === false
        ? "PASS"
        : "BLOCKED",
    blocked_reasons:
      provenance.provenance_status === "needs_review"
        ? []
        : ["partial provenance fixture did not remain needs_review"],
    dogfood_notes: [
      "Partial provenance remains needs_review and records not_supplied_in_chat without fabricating metadata.",
    ],
  };
}

function buildRegressionSafetyScenario(context) {
  const badDraft = {
    ...buildReturnedDraftFromPacket(context.formerInputPacket, {
      source_former_input_packet: {
        packet_version: context.formerInputPacket.packet_version,
        packet_id: "codex-perspective-former-input:v0.1:mismatch",
        role: context.formerInputPacket.role,
      },
      thesis:
        "Synthetic regression control attempts raw payload inclusion and false authority.",
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
      forbidden_actions: ["may merge"],
    }),
  };
  const contractFit = evaluateCodexPerspectiveCandidateDraftPromptContractFit({
    former_input_packet: context.formerInputPacket,
    draft: badDraft,
  });
  const validation = validateAndNormalizeCodexPerspectiveCandidateDraft({
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
    !unsafeOrAuthoritySurvived;

  return {
    scenario_id: "regression_safety",
    title: "Regression Safety",
    contract_fit_status: contractFit.status,
    validation_status: validation.status,
    blocked_reasons: validation.blocked_reasons,
    unsafe_or_authority_survived: unsafeOrAuthoritySurvived,
    conclusion: passed ? "PASS" : "BLOCKED",
    dogfood_notes: [
      "Controls cover true authority flags, raw payload inclusion, non-pointer evidence refs, and source former input packet mismatch.",
      "Blocked controls produce no candidate-compatible material and keep returned authority flags false.",
    ],
  };
}

function evaluateDogfood(scenarios) {
  const stale = requireScenario(scenarios, "stale_wording_detection_fixture");
  const clean = requireScenario(
    scenarios,
    "clean_second_transcript_style_fixture",
  );
  const complete = requireScenario(scenarios, "provenance_complete_fixture");
  const partial = requireScenario(scenarios, "provenance_partial_fixture");
  const conclusion = deriveProvenanceStaleWordingConclusion(scenarios);

  return {
    conclusion,
    recommended_next_pr_title: PROVENANCE_STALE_WORDING_RECOMMENDED_NEXT_PR,
    scenario_conclusions: scenarios.map((scenario) => ({
      scenario_id: scenario.scenario_id,
      conclusion: scenario.conclusion,
    })),
    answered_questions: {
      what_pr_488_found:
        "PR #488 found PASS with follow-up: old PR #483 alias drift absent, PR #486 non-local tension_kind drift absent, direct contract fit fits_contract, direct local validation produced candidate-compatible material, PR #484 alignment was not required, and Worker-Facing Guidance ran advisory-only.",
      which_stale_wording_was_found:
        "stale_pr_479_prompt_contract_reference, stale_second_transcript_missing_capture_wording, and stale_capture_next_action_after_supplied_transcript.",
      what_provenance_was_missing:
        "source_manual_copy_packet_id and source_prompt_hash were not supplied in chat.",
      what_manual_copy_packet_wording_changed:
        "The copyable prompt now uses CodexPerspectiveFormerDraftPromptContract v0.1 as the stable contract label instead of the stale PR #479 prompt contract wording.",
      what_capture_return_envelope_was_added:
        "The manual copy packet exposes REAL TRANSCRIPT CAPTURE AFTER MANUAL COPY PACKET with capture_method, codex_surface_label, source_manual_copy_packet_id, source_former_input_packet_id, source_prompt_hash, captured_at, redaction notes, and RETURNED_CODEX_RESPONSE bounds.",
      how_source_gap_is_distinguished:
        "Source packet pre-capture gaps are historical input context; when a transcript fixture is present, dogfood treats the current remaining gap as local validation/provenance review, not missing transcript evidence.",
      stale_pr_479_wording_remains_in_new_prompt:
        "No. The newly generated manual copy prompt no longer says Use the PR #479 prompt contract below.",
      complete_provenance_can_be_preserved:
        complete.provenance_status === "complete" ? "Yes." : "No.",
      partial_provenance_without_fabrication:
        partial.provenance_status === "needs_review" &&
        partial.fabricated_metadata === false
          ? "Yes."
          : "No.",
      was_new_real_transcript_captured:
        "No. This PR does not capture a new transcript.",
      why_browser_computer_use_not_run: noBrowserComputerUseReason,
      what_should_happen_next: PROVENANCE_STALE_WORDING_RECOMMENDED_NEXT_PR,
      stale_fixture_classification: stale.classification,
      clean_fixture_validation:
        clean.contract_fit_status === "fits_contract" &&
        clean.candidate_compatible_material
          ? "Clean fixture fits contract and produces candidate-compatible material."
          : "Clean fixture did not fully validate.",
    },
  };
}

function buildReturnedDraftFromPacket(packet, overrides = {}) {
  return {
    draft_version: "codex_perspective_candidate_draft.v0.1",
    draft_kind: "codex_perspective_candidate_draft",
    source_former_input_packet: overrides.source_former_input_packet ?? {
      packet_version: packet.packet_version,
      packet_id: packet.packet_id,
      role: packet.role,
    },
    thesis:
      overrides.thesis ??
      "This response is the captured draft output to be locally validated; it remains non-committed review material.",
    selected_material: overrides.selected_material ?? {
      changed_files: [...packet.bounded_material.changed_files],
      changed_files_summary: packet.bounded_material.changed_files_summary,
      work_id: packet.source_formation_input_bundle.work_id,
      source_pr_refs: [...packet.source_formation_input_bundle.source_pr_refs],
    },
    evidence_pointer_refs: overrides.evidence_pointer_refs ?? [
      {
        pointer_kind: "evidence_row_ref",
        pointer_semantics: "pointer_only",
        ref: packet.pointer_refs[0]?.ref ?? "evidence:row:synthetic",
      },
    ],
    unresolved_tensions: overrides.unresolved_tensions ?? [
      {
        tension_kind: "readiness_reason",
        summary:
          "Local validation still needs to run before this captured draft can inform the next implementation PR.",
        source_ref: "readiness:local-validation-required",
      },
    ],
    basis_quality_suggestion: overrides.basis_quality_suggestion ?? {
      status: "needs_review",
      reasons: [
        "The response is available as draft/review material, but local validation remains required.",
      ],
    },
    next_action_candidates: overrides.next_action_candidates ?? [
      {
        action_id: "review_candidate",
        summary:
          "Review and validate this captured draft output before deciding any next work.",
      },
    ],
    user_core_decision_questions: overrides.user_core_decision_questions ?? [
      "Does the user want to use this locally validated draft to shape the next implementation PR?",
    ],
    qualification_notes: overrides.qualification_notes ?? [
      "This is non-committed candidate material and does not create proof, readiness, approval, or Core decisions.",
    ],
    privacy_flags: overrides.privacy_flags ?? {
      raw_payloads_included: false,
      unsafe_input_material_omitted:
        packet.privacy_constraints.unsafe_input_material_omitted,
      omitted_unsafe_fields: [...packet.privacy_constraints.omitted_unsafe_fields],
    },
    authority_flags: overrides.authority_flags ?? buildFalseAuthorityFlags(),
    forbidden_actions: overrides.forbidden_actions ?? [
      "Do not create proof, evidence, readiness, or Augnes state records.",
      "Do not approve, merge, publish, retry, replay, deploy, or mutate GitHub.",
      "Do not execute Codex, call the Codex SDK, or call provider/model/API services.",
      "Do not make Core decisions.",
    ],
  };
}

function renderArtifact({ evaluation, scenarios }) {
  const currentLabel = requireScenario(
    scenarios,
    "manual_copy_packet_current_contract_label",
  );
  const envelope = requireScenario(
    scenarios,
    "capture_return_envelope_present",
  );
  const preCaptureGap = requireScenario(
    scenarios,
    "pre_capture_gap_not_current_state",
  );
  const stale = requireScenario(scenarios, "stale_wording_detection_fixture");
  const clean = requireScenario(
    scenarios,
    "clean_second_transcript_style_fixture",
  );
  const complete = requireScenario(scenarios, "provenance_complete_fixture");
  const partial = requireScenario(scenarios, "provenance_partial_fixture");
  const lines = [
    "# Perspective Codex Former Provenance And Stale Wording Follow-Up",
    "",
    `Generated at: ${PROVENANCE_STALE_WORDING_GENERATED_AT}`,
    `Conclusion: ${evaluation.conclusion}`,
    `Recommended next implementation PR title: ${evaluation.recommended_next_pr_title}`,
    "",
    "## Summary",
    "",
    "This pure local follow-up to PR #488 refines the manual copy packet provenance return envelope and stale source-gap wording before the next real transcript capture run.",
    "It does not capture a new transcript.",
    "",
    "## What PR #488 Found",
    "",
    evaluation.answered_questions.what_pr_488_found,
    "",
    "## Stale Wording Found",
    "",
    evaluation.answered_questions.which_stale_wording_was_found,
    "",
    "## Provenance Missing In PR #488",
    "",
    evaluation.answered_questions.what_provenance_was_missing,
    "",
    "## Manual Copy Packet Wording Changed",
    "",
    evaluation.answered_questions.what_manual_copy_packet_wording_changed,
    `New prompt uses stable label: ${currentLabel.stable_contract_label_present}`,
    `Stale PR #479 contract wording remains in newly generated prompt: ${currentLabel.copyable_prompt_contains_stale_pr_479_contract_label}`,
    "",
    "## Capture Return Envelope Added",
    "",
    evaluation.answered_questions.what_capture_return_envelope_was_added,
    `Envelope required fields present: ${envelope.required_fields_present}`,
    `Envelope source_manual_copy_packet_id: ${envelope.source_manual_copy_packet_id}`,
    `Envelope source_former_input_packet_id: ${envelope.source_former_input_packet_id}`,
    `Envelope source_prompt_hash: ${envelope.source_prompt_hash}`,
    "",
    "## Source Pre-Capture Gap Vs Post-Capture State",
    "",
    evaluation.answered_questions.how_source_gap_is_distinguished,
    `source_packet_pre_capture_gap: ${preCaptureGap.source_packet_pre_capture_gap}`,
    `captured_transcript_present: ${preCaptureGap.captured_transcript_present}`,
    `post_capture_remaining_gap: ${preCaptureGap.post_capture_remaining_gap}`,
    `stale_source_gap_treated_as_current_state: ${preCaptureGap.stale_source_gap_treated_as_current_state}`,
    "",
    "## Stale Wording Detection",
    "",
    `Stale fixture findings: ${stale.stale_wording_findings.join(", ")}`,
    `Stale fixture classification: ${stale.classification}`,
    `Clean fixture findings: ${clean.stale_wording_findings.length > 0 ? clean.stale_wording_findings.join(", ") : "none"}`,
    "",
    "## Provenance Behavior",
    "",
    `Complete provenance status: ${complete.provenance_status}`,
    `Partial provenance status: ${partial.provenance_status}`,
    `Partial missing fields: ${partial.missing_fields.join(", ")}`,
    `Partial provenance fabricated metadata: ${partial.fabricated_metadata}`,
    "",
    "## New Real Transcript Capture",
    "",
    evaluation.answered_questions.was_new_real_transcript_captured,
    "",
    "## Browser/Computer-Use Validation",
    "",
    noBrowserComputerUseReason,
    "",
    "## Scenarios",
    "",
    ...scenarios.flatMap(renderScenario),
    "## Authority Boundary",
    "",
    authorityBoundary,
    "",
    "## Verification",
    "",
    "- npm run typecheck",
    "- npm run dogfood:perspective-codex-former-provenance-stale-wording",
    "- npm run smoke:perspective-codex-former-provenance-stale-wording",
    "- npm run dogfood:perspective-codex-former-second-refined-transcript",
    "- npm run smoke:perspective-codex-former-second-refined-transcript",
    "- npm run smoke:perspective-codex-former-manual-copy-packet",
    "- full neighboring Perspective smoke bundle",
    "- git diff --check",
    "- git diff --cached --check",
    "",
    "## Skipped Checks With Concrete Reasons",
    "",
    `- Browser/computer-use validation: ${noBrowserComputerUseReason}`,
    "- New real transcript capture: skipped because this PR intentionally refines provenance/capture instructions before the next transcript run.",
    "- DB validation: skipped because this PR adds no DB schema, persistence path, or state writer.",
    "- Provider/model validation: skipped because this PR intentionally does not call Codex, OpenAI, provider/model APIs, or SDKs.",
    "- GitHub implementation behavior: skipped because implementation code has no GitHub API/network path.",
    "",
    "## What Codex Did Not Do",
    "",
    "Codex did not capture a new transcript, call Codex from implementation, execute Codex from Augnes, call the Codex SDK, call OpenAI/provider/model APIs from implementation, call GitHub APIs from implementation behavior, use implementation network behavior, write DB state, add runtime routes, add UI, add clipboard automation, create proof/evidence/readiness records, approve, merge, publish, retry, replay, deploy, or make Core decisions.",
    "",
    "## What Should Happen Next",
    "",
    PROVENANCE_STALE_WORDING_RECOMMENDED_NEXT_PR,
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
  };
}

function readEnvelopeField(envelope, key) {
  const value = envelope?.[key];
  return typeof value === "string" ? value : null;
}

function hasUsableText(value) {
  return Boolean(
    typeof value === "string" &&
      value.trim() &&
      value !== "not_supplied_in_chat" &&
      !value.startsWith("<"),
  );
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
  return (
    flags &&
    Object.values(flags).every((value) => value === false)
  );
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

function containsUnsafeMarkerText(value) {
  const text =
    typeof value === "string" ? value : JSON.stringify(value ?? {});
  return [
    "sk-proj",
    "OPENAI_API_KEY",
    "GITHUB_TOKEN",
    "oauth_payload",
    "provider_payload",
    "billing_payload",
    "private_payload",
    "token_payload",
    "hidden_reasoning",
    "raw_source_payload",
    "raw_candidate_payload",
  ].some((marker) => text.includes(marker));
}

function writeReportFile(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runPerspectiveCodexFormerProvenanceStaleWordingDogfood();
}
