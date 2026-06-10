import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const { buildPerspectiveFormationInputBundle } = await import(
  "../lib/perspective-ingest/perspective-formation-input-bundle.ts"
);
const { buildCodexPerspectiveFormerInputPacket } = await import(
  "../lib/perspective-ingest/perspective-codex-former-input-packet.ts"
);
const { buildPerspectiveCodexFormerSeparateSessionCapturePacketPrep } =
  await import(
    "./dogfood-perspective-codex-former-separate-session-capture-packet-prep.mjs"
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
const { alignCodexPerspectiveCandidateDraftSchemaFromModelOutput } =
  await import(
    "../lib/perspective-ingest/perspective-codex-candidate-draft-schema-alignment.ts"
  );
const { buildWorkerFacingPerspectiveGuidanceFromCandidate } = await import(
  "../lib/perspective-ingest/perspective-worker-facing-guidance.ts"
);

export const CAPTURE_HELPER_METADATA_VERSION =
  "perspective_codex_former_capture_helper_metadata.v0.1";
export const CAPTURE_HELPER_METADATA_KIND =
  "perspective_codex_former_capture_helper_metadata";
export const CAPTURE_HELPER_SUMMARY_VERSION =
  "perspective_codex_former_capture_helper_validation_summary.v0.1";
export const CAPTURE_HELPER_SUMMARY_KIND =
  "perspective_codex_former_capture_helper_validation_summary";

export const DEFAULT_PROMPT_FILE_NAME = "codex-former-copyable-prompt.txt";
export const DEFAULT_CAPTURE_RETURN_TEMPLATE_FILE_NAME =
  "codex-former-capture-return-envelope-template.txt";
export const DEFAULT_METADATA_FILE_NAME = "codex-former-capture-metadata.json";
export const DEFAULT_VALIDATION_SUMMARY_FILE_NAME =
  "codex-former-capture-validation-summary.json";
export const LEGACY_CAPTURE_SOURCE_KIND =
  "separate_session_capture_packet_prep_builder";
export const BOUNDED_SOURCE_INPUT_CAPTURE_SOURCE_KIND =
  "bounded_source_input_file";

const stablePromptContractLabel =
  "CodexPerspectiveFormerDraftPromptContract v0.1";
const stalePr479PromptWording = [
  "Use the PR #479",
  "prompt contract below.",
].join(" ");
const notSuppliedSentinel = "not_supplied_in_chat";
const requiredProvenanceFields = [
  "capture_method",
  "codex_surface_label",
  "prompt_was_generated_by_manual_copy_packet",
  "source_manual_copy_packet_id",
  "source_former_input_packet_id",
  "source_prompt_hash",
];
const authorityFlagKeys = [
  "committed_state",
  "persistence",
  "provider_model_api_calls",
  "proof_evidence_readiness_writes",
  "codex_execution",
  "github_mutation",
  "merge_publish_approval",
  "core_decision",
];
const parameterizedExpectedValidationCommands = [
  "npm run smoke:perspective-codex-former-capture-helper",
  "npm run smoke:perspective-codex-former-manual-copy-packet",
  "npm run smoke:perspective-codex-former-manual-workflow-docs",
];
const exactUnsafeSourceInputMarkers = [
  "private_payload",
  "provider_payload",
  "raw_source_payload",
  "raw_candidate_payload",
  "raw_private_payload",
  "raw_pr_diff",
  "raw_page_dump",
  "raw_review_payload",
  "oauth_token",
  "access_token",
  "refresh_token",
  "api_key",
  "hidden_reasoning",
];
const prefixUnsafeSourceInputMarkers = [
  "sk-proj-",
  "ghp_",
];
const phraseUnsafeSourceInputMarkers = [
  "raw diff",
  "raw diffs",
  "raw pr diff",
  "raw review payload",
  "raw page dump",
  "provider log",
  "provider logs",
  "hidden reasoning",
  "account data",
  "raw screenshot",
  "raw screenshots",
  "screenshot payload",
  "screenshots included",
  "screenshot included",
  "unrelated private",
  "private payload",
  "provider payload",
  "raw source payload",
  "raw candidate payload",
  "raw private payload",
];
const tokenBoundaryUnsafeSourceInputMarkers = [
  "cookie",
  "cookies",
  "token",
  "tokens",
  "secret",
  "secrets",
];

export function prepareCodexFormerCapturePacket(options = {}) {
  const outDir = resolve(
    String(options.outDir ?? "tmp/perspective-codex-former-capture-helper"),
  );
  const generatedAt =
    typeof options.generatedAt === "string" && options.generatedAt.trim()
      ? options.generatedAt.trim()
      : new Date().toISOString();
  const promptPath = resolve(outDir, DEFAULT_PROMPT_FILE_NAME);
  const captureReturnEnvelopeTemplatePath = resolve(
    outDir,
    DEFAULT_CAPTURE_RETURN_TEMPLATE_FILE_NAME,
  );
  const metadataPath = resolve(outDir, DEFAULT_METADATA_FILE_NAME);

  const prep = buildPreparedCaptureSource({
    sourceInputPath: options.sourceInputPath,
    generatedAt,
  });
  const generatedPacket = prep.generated_packet;
  const blockedReasons = validatePreparedPacket(prep);

  if (blockedReasons.length > 0) {
    throw new Error(
      `prepare blocked: ${uniqueTextList(blockedReasons).join("; ")}`,
    );
  }

  mkdirSync(outDir, { recursive: true });
  writeFileSync(promptPath, generatedPacket.copyable_codex_prompt_text, "utf8");
  writeFileSync(
    captureReturnEnvelopeTemplatePath,
    prep.capture_return_envelope,
    "utf8",
  );

  const metadata = {
    metadata_version: CAPTURE_HELPER_METADATA_VERSION,
    metadata_kind: CAPTURE_HELPER_METADATA_KIND,
    generated_at: generatedAt,
    capture_source_kind: prep.capture_source_kind,
    ...(prep.source_input
      ? {
          source_input_path: prep.source_input.source_input_path,
          source_input_hash: prep.source_input.source_input_hash,
          source_input_scope: prep.source_input.scope,
          source_input_work_id: prep.source_input.work_id,
        }
      : {}),
    source_manual_copy_packet_id: generatedPacket.manual_copy_packet_id,
    source_former_input_packet_id: generatedPacket.former_input_packet_id,
    source_prompt_hash: generatedPacket.copyable_prompt_hash,
    copy_status: generatedPacket.copy_status,
    copy_status_reasons: generatedPacket.copy_status_reasons,
    output_paths: {
      out_dir: outDir,
      copyable_prompt_path: promptPath,
      capture_return_envelope_template_path:
        captureReturnEnvelopeTemplatePath,
      metadata_path: metadataPath,
    },
    prompt_contract_label: stablePromptContractLabel,
    stale_pr_479_prompt_wording_present:
      generatedPacket.copyable_codex_prompt_text.includes(
        stalePr479PromptWording,
      ),
    provenance_not_supplied_values_present: [
      generatedPacket.manual_copy_packet_id,
      generatedPacket.former_input_packet_id,
      generatedPacket.copyable_prompt_hash,
    ].some((value) => value === notSuppliedSentinel),
    source_former_input_packet: prep.source_former_input_packet,
    manual_copy_packet_summary: {
      packet_id: prep.manual_copy_packet.packet_id,
      former_input_packet_id: generatedPacket.former_input_packet_id,
      copyable_prompt_hash: prep.manual_copy_packet.copyable_prompt_hash,
      capture_return_envelope: {
        source_manual_copy_packet_id:
          prep.manual_copy_packet.capture_return_envelope
            .source_manual_copy_packet_id,
        source_former_input_packet_id:
          prep.manual_copy_packet.capture_return_envelope
            .source_former_input_packet_id,
        source_prompt_hash:
          prep.manual_copy_packet.capture_return_envelope.source_prompt_hash,
      },
    },
    authority_boundary: {
      output_is_draft_review_material_only: true,
      accepted_augnes_state: false,
      proof_evidence_readiness_records: false,
      provider_model_api_calls: false,
      codex_sdk_calls: false,
      codex_execution: false,
      db_writes: false,
      runtime_routes: false,
      ui: false,
      clipboard_automation: false,
      github_mutation: false,
      approval_merge_publish_core_decision: false,
    },
  };

  writeJsonFile(metadataPath, metadata);

  return {
    mode: "prepare",
    capture_source_kind: metadata.capture_source_kind,
    source_input_hash: metadata.source_input_hash ?? null,
    source_manual_copy_packet_id: metadata.source_manual_copy_packet_id,
    source_former_input_packet_id: metadata.source_former_input_packet_id,
    source_prompt_hash: metadata.source_prompt_hash,
    output_paths: metadata.output_paths,
  };
}

export function validateCodexFormerCapture(options = {}) {
  const envelopePath = options.envelopePath
    ? resolve(String(options.envelopePath))
    : null;
  if (!envelopePath) {
    throw new Error("validate requires --envelope <path>");
  }
  if (!existsSync(envelopePath)) {
    throw new Error(`validate envelope file does not exist: ${envelopePath}`);
  }

  const metadataPath = resolveMetadataPath({
    metadataPath: options.metadataPath,
    envelopePath,
  });
  const metadata = metadataPath ? readJsonFile(metadataPath) : null;
  const formerInputPacket = metadata?.source_former_input_packet ?? null;
  const envelopeText = readFileSync(envelopePath, "utf8");
  const parsedEnvelope = parseCaptureEnvelope(envelopeText);
  const extraction = extractCandidateDrafts(
    parsedEnvelope.returned_codex_response_text,
  );
  const candidateDraft =
    extraction.candidate_drafts.length === 1
      ? extraction.candidate_drafts[0]
      : null;

  const provenance = evaluateEnvelopeProvenance({
    parsedEnvelope,
    metadata,
  });
  const extractionBlockedReasons = [];
  if (parsedEnvelope.parse_errors.length > 0) {
    extractionBlockedReasons.push(...parsedEnvelope.parse_errors);
  }
  if (extraction.parse_errors.length > 0) {
    extractionBlockedReasons.push(...extraction.parse_errors);
  }
  if (extraction.candidate_drafts.length !== 1) {
    extractionBlockedReasons.push(
      `expected exactly one CodexPerspectiveCandidateDraft object; found ${extraction.candidate_drafts.length}`,
    );
  }
  if (!metadata) {
    extractionBlockedReasons.push(
      "capture metadata was not supplied and could not be inferred",
    );
  }
  if (!formerInputPacket) {
    extractionBlockedReasons.push(
      "source former input packet missing from capture metadata",
    );
  }

  const contractFit =
    candidateDraft && formerInputPacket
      ? safelyEvaluateContractFit({
          formerInputPacket,
          candidateDraft,
        })
      : buildMissingContractFit(extractionBlockedReasons);
  const directValidation =
    candidateDraft && formerInputPacket
      ? safelyValidateCandidateDraft({
          formerInputPacket,
          candidateDraft,
        })
      : buildMissingDirectValidation(extractionBlockedReasons);
  const alignment =
    candidateDraft && formerInputPacket
      ? safelyRunAlignment({
          formerInputPacket,
          candidateDraft,
        })
      : buildMissingAlignment(extractionBlockedReasons);
  const workerGuidance = directValidation.candidate_review_material
    ? safelyBuildWorkerGuidance(directValidation.candidate_review_material)
    : {
        ran: false,
        skipped_reason:
          "Worker-Facing Guidance skipped because direct validation did not return candidate-compatible material.",
        guidance_status: "skipped",
        advisory_only: false,
        authority_flags_all_false: true,
      };

  const warningSummary = buildWarningSummary({
    contractFit,
    directValidation,
    alignment,
  });
  const authorityFlagsAllFalse =
    allAuthorityFlagsFalse(candidateDraft?.authority_flags) &&
    allAuthorityFlagsFalse(contractFit.authority_flags) &&
    allAuthorityFlagsFalse(directValidation.authority_flags) &&
    allAuthorityFlagsFalse(alignment.authority_flags) &&
    workerGuidance.authority_flags_all_false;
  const unsafeMaterialDetected =
    contractFit.privacy.unsafe_material_detected === true ||
    directValidation.privacy.unsafe_input_material_omitted === true ||
    alignment.privacy.unsafe_input_material_omitted === true ||
    candidateDraft?.privacy_flags?.raw_payloads_included === true;
  const candidateCompatibleMaterial =
    directValidation.candidate_review_material !== null;
  const candidateAuthority =
    directValidation.candidate_review_material?.authority ?? "none";
  const candidateBasisQuality =
    directValidation.candidate_review_material?.basis_quality?.status ??
    candidateDraft?.basis_quality_suggestion?.status ??
    "none";

  const blockedReasons = uniqueTextList([
    ...provenance.blocked_reasons,
    ...extractionBlockedReasons,
    ...(contractFit.status === "violates_contract"
      ? ["contract-fit evaluation found a hard violation"]
      : []),
    ...(directValidation.status === "blocked" ||
    directValidation.status === "threw"
      ? directValidation.blocked_reasons
      : []),
    ...(candidateCompatibleMaterial
      ? []
      : ["direct validation did not return candidate-compatible material"]),
    ...(authorityFlagsAllFalse
      ? []
      : ["authority flags were not all false"]),
    ...(unsafeMaterialDetected
      ? ["unsafe/private/provider/source material survived validation"]
      : []),
    ...(candidateCompatibleMaterial && candidateAuthority !== "non_committed"
      ? [`candidate authority was ${candidateAuthority}`]
      : []),
  ]);
  const conclusion = deriveConclusion({
    blockedReasons,
    provenance,
    contractFit,
    directValidation,
    candidateCompatibleMaterial,
    candidateBasisQuality,
    workerGuidance,
    warningSummary,
  });
  const summary = {
    summary_version: CAPTURE_HELPER_SUMMARY_VERSION,
    summary_kind: CAPTURE_HELPER_SUMMARY_KIND,
    mode: "validate",
    conclusion,
    envelope_path: envelopePath,
    metadata_path: metadataPath,
    provenance_status: provenance.status,
    metadata_match: provenance.metadata_match,
    extraction: {
      candidate_count: extraction.candidate_drafts.length,
      parse_errors: [...parsedEnvelope.parse_errors, ...extraction.parse_errors],
    },
    contract_fit: {
      status: contractFit.status,
      warning_count: contractFit.warnings.length,
      warnings: contractFit.warnings.map(formatWarning),
    },
    direct_validation: {
      status: directValidation.status,
      candidate_compatible_material: candidateCompatibleMaterial,
      candidate_authority: candidateAuthority,
      candidate_basis_quality: candidateBasisQuality,
      warning_count: directValidation.warnings.length,
      warnings: directValidation.warnings.map(formatWarning),
      blocked_reasons: directValidation.blocked_reasons,
    },
    alignment_safety_net: {
      ran: alignment.ran,
      status: alignment.alignment_status,
      counted_as_direct_success: false,
      warning_count: alignment.warnings.length,
      warnings: alignment.warnings.map(formatWarning),
      blocked_reasons: alignment.blocked_reasons,
    },
    worker_facing_guidance: {
      ran: workerGuidance.ran,
      guidance_status: workerGuidance.guidance_status,
      advisory_only: workerGuidance.advisory_only,
      skipped_reason: workerGuidance.skipped_reason ?? null,
    },
    warning_summary: warningSummary,
    pointer_warning_summary: warningSummary.filter((warning) =>
      warning.includes("pointer_ref") || warning.includes("unknown_pointer_ref"),
    ),
    authority_flags_all_false: authorityFlagsAllFalse,
    unsafe_material_detected: unsafeMaterialDetected,
    blocked_reasons: blockedReasons,
    candidate_material_is_review_only: true,
  };

  if (options.summaryOutPath) {
    writeJsonFile(resolve(String(options.summaryOutPath)), summary);
  }

  return summary;
}

export function parseCaptureEnvelope(envelopeText) {
  const parseErrors = [];
  const text = typeof envelopeText === "string" ? envelopeText : "";
  if (!text.includes("REAL TRANSCRIPT CAPTURE AFTER MANUAL COPY PACKET")) {
    parseErrors.push("capture envelope header missing");
  }

  const returnedResponseMatch = text.match(
    /RETURNED_CODEX_RESPONSE:\s*([\s\S]*?)\s*END RETURNED_CODEX_RESPONSE/,
  );
  if (!returnedResponseMatch) {
    parseErrors.push("returned Codex response bounds missing");
  }

  const headerText = returnedResponseMatch
    ? text.slice(0, returnedResponseMatch.index)
    : text;
  const fields = {};
  for (const line of headerText.split("\n")) {
    const match = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
    if (!match) continue;
    fields[match[1]] = parseEnvelopeValue(match[2]);
  }

  return {
    fields,
    returned_codex_response_text: returnedResponseMatch?.[1]?.trim() ?? "",
    parse_errors: parseErrors,
  };
}

function buildPreparedCaptureSource({ sourceInputPath, generatedAt }) {
  if (!sourceInputPath) {
    return {
      ...buildPerspectiveCodexFormerSeparateSessionCapturePacketPrep(),
      capture_source_kind: LEGACY_CAPTURE_SOURCE_KIND,
      source_input: null,
    };
  }

  const sourceInput = readBoundedSourceInputFile(sourceInputPath);
  const formationInputBundle = buildPerspectiveFormationInputBundle({
    ...sourceInput.builder_input,
    generated_at: generatedAt || sourceInput.builder_input.generated_at,
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
      reviewer_label: "bounded-source-input manual reviewer",
      intended_codex_surface: "separate user-started Codex session",
      usage_notes: [
        "Paste only the copyable prompt into a separate user-started Codex session after human review.",
        "Return only the capture envelope with one bounded CodexPerspectiveCandidateDraft JSON object.",
        "This parameterized source input remains local review material and does not create accepted Augnes state.",
      ],
    },
    expected_validation_commands: parameterizedExpectedValidationCommands,
    generated_at: generatedAt,
  });
  const packetEvaluation =
    evaluateManualCodexPerspectiveFormerDraftCopyPacket(manualCopyPacket);
  const packetValidation = {
    status:
      packetEvaluation.evaluation_status === "blocked" ||
      manualCopyPacket.copy_status === "blocked"
        ? "blocked"
        : "passes",
    blocked_reasons: [
      ...packetEvaluation.blocked_reasons,
      ...(manualCopyPacket.copy_status === "blocked"
        ? manualCopyPacket.copy_status_reasons
        : []),
    ],
    packet_evaluation_status: packetEvaluation.evaluation_status,
    packet_evaluation_warnings: packetEvaluation.warnings,
    copy_status: manualCopyPacket.copy_status,
    copy_status_reasons: manualCopyPacket.copy_status_reasons,
  };

  return {
    capture_return_envelope:
      manualCopyPacket.capture_return_envelope.copyable_capture_return_template,
    capture_source_kind: BOUNDED_SOURCE_INPUT_CAPTURE_SOURCE_KIND,
    generated_packet: {
      manual_copy_packet_id: manualCopyPacket.packet_id,
      former_input_packet_id: formerInputPacket.packet_id,
      copyable_prompt_hash: manualCopyPacket.copyable_prompt_hash,
      copy_status: manualCopyPacket.copy_status,
      copy_status_reasons: manualCopyPacket.copy_status_reasons,
      copyable_codex_prompt_text: manualCopyPacket.copyable_codex_prompt_text,
    },
    manual_copy_packet: manualCopyPacket,
    packet_validation: packetValidation,
    source_former_input_packet: formerInputPacket,
    source_input: {
      source_input_path: sourceInput.source_input_path,
      source_input_hash: sourceInput.source_input_hash,
      scope: sourceInput.builder_input.scope ?? null,
      work_id: sourceInput.builder_input.work_id ?? null,
    },
  };
}

function readBoundedSourceInputFile(sourceInputPath) {
  const resolvedPath = resolve(String(sourceInputPath));
  if (!existsSync(resolvedPath)) {
    throw new Error(`source input file does not exist: ${resolvedPath}`);
  }

  const sourceText = readFileSync(resolvedPath, "utf8");
  const sourceInputHash = hashText(sourceText);
  const unsafeMarkers = collectUnsafeSourceInputMarkers(sourceText);
  if (unsafeMarkers.length > 0) {
    throw new Error(
      `source input contains unsafe/private/provider material markers: ${unsafeMarkers.join(", ")}`,
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(sourceText);
  } catch (error) {
    throw new Error(`source input file is not valid JSON: ${error}`);
  }
  if (!isRecord(parsed)) {
    throw new Error("source input JSON must be an object");
  }

  return {
    source_input_path: resolvedPath,
    source_input_hash: sourceInputHash,
    builder_input: adaptBoundedSourceInput(parsed),
  };
}

function adaptBoundedSourceInput(input) {
  const adapted = {
    generated_at: optionalString(input.generated_at, "generated_at"),
    scope: optionalString(input.scope, "scope"),
    work_id: optionalString(input.work_id, "work_id"),
    source_pr_refs: optionalStringArray(input.source_pr_refs, "source_pr_refs"),
    changed_files: optionalStringArray(input.changed_files, "changed_files"),
    changed_files_summary: optionalString(
      input.changed_files_summary,
      "changed_files_summary",
    ),
    tests_checks_run: optionalCheckRunArray(
      input.tests_checks_run,
      "tests_checks_run",
    ),
    skipped_checks: optionalSkippedCheckArray(
      input.skipped_checks,
      "skipped_checks",
    ),
    evidence_row_refs: optionalStringArray(
      input.evidence_row_refs,
      "evidence_row_refs",
    ),
    proof_only_action_refs: optionalStringArray(
      input.proof_only_action_refs,
      "proof_only_action_refs",
    ),
    work_event_refs: optionalStringArray(input.work_event_refs, "work_event_refs"),
    session_trace_refs: optionalStringArray(
      input.session_trace_refs,
      "session_trace_refs",
    ),
    existing_perspective_refs: optionalStringArray(
      input.existing_perspective_refs,
      "existing_perspective_refs",
    ),
    unresolved_gaps: optionalGapArray(
      input.unresolved_gaps,
      "unresolved_gaps",
    ),
    authority_boundaries: optionalStringArray(
      input.authority_boundaries,
      "authority_boundaries",
    ),
    source_privacy_redaction_notes: optionalStringArray(
      input.source_privacy_redaction_notes,
      "source_privacy_redaction_notes",
    ),
  };

  if (!hasText(adapted.scope)) {
    throw new Error("source input scope is required");
  }
  if (
    !hasText(adapted.work_id) &&
    adapted.source_pr_refs.length === 0
  ) {
    throw new Error("source input requires work_id or source_pr_refs");
  }
  if (adapted.changed_files.length === 0) {
    throw new Error("source input changed_files must include at least one file");
  }
  if (
    adapted.tests_checks_run.length === 0 &&
    adapted.skipped_checks.length === 0 &&
    adapted.evidence_row_refs.length === 0 &&
    adapted.proof_only_action_refs.length === 0
  ) {
    throw new Error(
      "source input requires checks, skipped checks, evidence refs, or proof-only action refs",
    );
  }

  return adapted;
}

function validatePreparedPacket(prep) {
  const generatedPacket = prep.generated_packet;
  const promptText = generatedPacket.copyable_codex_prompt_text;
  const blockedReasons = [];
  if (prep.packet_validation.status !== "passes") {
    blockedReasons.push(...prep.packet_validation.blocked_reasons);
  }
  if (!promptText.includes(stablePromptContractLabel)) {
    blockedReasons.push("copyable prompt is missing stable prompt contract label");
  }
  if (promptText.includes(stalePr479PromptWording)) {
    blockedReasons.push("copyable prompt contains stale PR #479 wording");
  }
  for (const [label, value] of [
    ["source_manual_copy_packet_id", generatedPacket.manual_copy_packet_id],
    ["source_former_input_packet_id", generatedPacket.former_input_packet_id],
    ["source_prompt_hash", generatedPacket.copyable_prompt_hash],
  ]) {
    if (!hasText(value)) blockedReasons.push(`${label} is missing`);
    if (value === notSuppliedSentinel) {
      blockedReasons.push(`${label} is ${notSuppliedSentinel}`);
    }
  }
  if (generatedPacket.copy_status === "blocked") {
    blockedReasons.push(...generatedPacket.copy_status_reasons);
  }

  return blockedReasons;
}

function evaluateEnvelopeProvenance({ parsedEnvelope, metadata }) {
  const fields = parsedEnvelope.fields;
  const blockedReasons = [];
  const missingFields = requiredProvenanceFields.filter(
    (field) => !hasText(String(fields[field] ?? "")),
  );
  if (missingFields.length > 0) {
    blockedReasons.push(`missing provenance fields: ${missingFields.join(", ")}`);
  }
  if (fields.capture_method !== "human_manual") {
    blockedReasons.push("capture_method must be human_manual");
  }
  if (fields.codex_surface_label !== "separate user-started Codex session") {
    blockedReasons.push(
      "codex_surface_label must be separate user-started Codex session",
    );
  }
  if (fields.prompt_was_generated_by_manual_copy_packet !== true) {
    blockedReasons.push(
      "prompt_was_generated_by_manual_copy_packet must be true",
    );
  }
  for (const field of [
    "source_manual_copy_packet_id",
    "source_former_input_packet_id",
    "source_prompt_hash",
  ]) {
    if (fields[field] === notSuppliedSentinel) {
      blockedReasons.push(`${field} is ${notSuppliedSentinel}`);
    }
  }

  const metadataMismatchReasons = [];
  if (metadata) {
    for (const [field, metadataField] of [
      ["source_manual_copy_packet_id", "source_manual_copy_packet_id"],
      ["source_former_input_packet_id", "source_former_input_packet_id"],
      ["source_prompt_hash", "source_prompt_hash"],
    ]) {
      if (fields[field] !== metadata[metadataField]) {
        metadataMismatchReasons.push(`${field} does not match metadata`);
      }
    }
  }
  blockedReasons.push(...metadataMismatchReasons);

  return {
    status: blockedReasons.length === 0 ? "complete" : "blocked",
    metadata_match: metadata ? metadataMismatchReasons.length === 0 : false,
    blocked_reasons: blockedReasons,
    fields,
  };
}

function extractCandidateDrafts(returnedCodexResponseText) {
  const text =
    typeof returnedCodexResponseText === "string"
      ? returnedCodexResponseText.trim()
      : "";
  const parseErrors = [];
  if (!text) {
    return {
      candidate_drafts: [],
      parse_errors: ["returned Codex response text is empty"],
    };
  }

  try {
    const parsed = JSON.parse(text);
    return {
      candidate_drafts: isCandidateDraftObject(parsed) ? [parsed] : [],
      parse_errors: isCandidateDraftObject(parsed)
        ? []
        : ["returned JSON is not a CodexPerspectiveCandidateDraft object"],
    };
  } catch {
    // Continue to bounded text extraction below.
  }

  const parsedObjects = [];
  for (const jsonText of extractBalancedJsonObjectStrings(text)) {
    try {
      parsedObjects.push(JSON.parse(jsonText));
    } catch {
      parseErrors.push("bounded response contained an unparsable JSON object");
    }
  }

  return {
    candidate_drafts: parsedObjects.filter(isCandidateDraftObject),
    parse_errors: parseErrors,
  };
}

function extractBalancedJsonObjectStrings(text) {
  const objects = [];
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === "{") {
      if (depth === 0) start = index;
      depth += 1;
      continue;
    }
    if (char !== "}") continue;
    depth -= 1;
    if (depth === 0 && start >= 0) {
      objects.push(text.slice(start, index + 1));
      start = -1;
    }
  }

  return objects;
}

function safelyEvaluateContractFit({ formerInputPacket, candidateDraft }) {
  try {
    return evaluateCodexPerspectiveCandidateDraftPromptContractFit({
      former_input_packet: formerInputPacket,
      draft: candidateDraft,
    });
  } catch (error) {
    return buildMissingContractFit([`contract-fit evaluator threw: ${error}`], {
      status: "violates_contract",
    });
  }
}

function safelyValidateCandidateDraft({ formerInputPacket, candidateDraft }) {
  try {
    return validateAndNormalizeCodexPerspectiveCandidateDraft({
      former_input_packet: formerInputPacket,
      draft: candidateDraft,
    });
  } catch (error) {
    return buildMissingDirectValidation([
      `direct validation threw instead of returning a safe result: ${error}`,
    ]);
  }
}

function safelyRunAlignment({ formerInputPacket, candidateDraft }) {
  try {
    return {
      ran: true,
      ...alignCodexPerspectiveCandidateDraftSchemaFromModelOutput({
        former_input_packet: formerInputPacket,
        draft: candidateDraft,
      }),
    };
  } catch (error) {
    return buildMissingAlignment([
      `schema alignment safety-net threw: ${error}`,
    ]);
  }
}

function safelyBuildWorkerGuidance(candidateReviewMaterial) {
  try {
    const guidance = buildWorkerFacingPerspectiveGuidanceFromCandidate({
      candidate: candidateReviewMaterial,
      guidance_context: {
        work_goal:
          "Review the validated manual Codex Former capture material without treating it as accepted state.",
        bounded_summary:
          "Local CLI validation produced review-only candidate-compatible material.",
      },
    });
    const allActions = [
      ...guidance.next_smallest_useful_actions,
      ...guidance.stop_or_defer_actions,
    ];
    return {
      ran: true,
      guidance_status: guidance.guidance_status,
      advisory_only:
        guidance.scope_alignment.advisory_only === true &&
        allActions.every(
          (action) =>
            action.advisory_only === true && action.codex_execution === false,
        ),
      authority_flags_all_false: allAuthorityFlagsFalse(guidance.authority_flags),
    };
  } catch (error) {
    return {
      ran: false,
      skipped_reason: `Worker-Facing Guidance threw: ${error}`,
      guidance_status: "threw",
      advisory_only: false,
      authority_flags_all_false: false,
    };
  }
}

function buildMissingContractFit(blockedReasons, overrides = {}) {
  return {
    contract_fit_version: "codex_perspective_draft_prompt_contract_fit.v0.1",
    contract_fit_kind: "codex_perspective_draft_prompt_contract_fit",
    status: overrides.status ?? "violates_contract",
    warnings: blockedReasons.map((reason) => ({
      warning_kind: "plain_summary",
      field: "draft",
      summary: reason,
    })),
    privacy: {
      raw_payloads_included: false,
      unsafe_material_detected: false,
    },
    authority_flags: buildFalseAuthorityFlags(),
  };
}

function buildMissingDirectValidation(blockedReasons) {
  return {
    validation_version: "codex_perspective_candidate_draft_validation.v0.1",
    validation_kind: "codex_perspective_candidate_draft_validation",
    status: "blocked",
    candidate_review_material: null,
    blocked_reasons: uniqueTextList(blockedReasons),
    warnings: blockedReasons.map((reason) => ({
      warning_kind: "normalization",
      field: "draft",
      summary: reason,
    })),
    privacy: {
      raw_payloads_included: false,
      unsafe_input_material_omitted: false,
      omitted_unsafe_fields: [],
    },
    authority_flags: buildFalseAuthorityFlags(),
  };
}

function buildMissingAlignment(blockedReasons) {
  return {
    ran: false,
    alignment_version: "codex_perspective_candidate_draft_schema_alignment.v0.1",
    alignment_kind: "codex_perspective_candidate_draft_schema_alignment",
    alignment_status: "blocked",
    aligned_draft: null,
    applied_mappings: [],
    blocked_reasons: uniqueTextList(blockedReasons),
    warnings: blockedReasons.map((reason) => ({
      warning_kind: "omitted_ambiguous_material",
      field: "draft",
      summary: reason,
    })),
    privacy: {
      raw_payloads_included: false,
      unsafe_input_material_omitted: false,
      omitted_unsafe_fields: [],
    },
    authority_flags: buildFalseAuthorityFlags(),
  };
}

function deriveConclusion({
  blockedReasons,
  provenance,
  contractFit,
  directValidation,
  candidateCompatibleMaterial,
  candidateBasisQuality,
  workerGuidance,
  warningSummary,
}) {
  if (blockedReasons.length > 0) return "BLOCKED with useful findings";
  if (
    provenance.status === "complete" &&
    contractFit.status === "fits_contract" &&
    directValidation.status === "ready_for_review" &&
    candidateCompatibleMaterial &&
    candidateBasisQuality === "sufficient_for_review" &&
    workerGuidance.advisory_only === true &&
    warningSummary.length === 0
  ) {
    return "PASS";
  }

  return "PASS with follow-up";
}

function buildWarningSummary({ contractFit, directValidation, alignment }) {
  return [
    ...contractFit.warnings.map(
      (warning) => `contract_fit:${formatWarning(warning)}`,
    ),
    ...directValidation.warnings.map(
      (warning) => `direct_validation:${formatWarning(warning)}`,
    ),
    ...alignment.warnings.map(
      (warning) => `alignment_safety_net:${formatWarning(warning)}`,
    ),
  ];
}

function formatWarning(warning) {
  return `${warning.warning_kind}:${warning.field}`;
}

function resolveMetadataPath({ metadataPath, envelopePath }) {
  if (metadataPath) {
    const resolved = resolve(String(metadataPath));
    if (!existsSync(resolved)) {
      throw new Error(`metadata file does not exist: ${resolved}`);
    }
    return resolved;
  }

  const candidate = resolve(dirname(envelopePath), DEFAULT_METADATA_FILE_NAME);
  return existsSync(candidate) ? candidate : null;
}

function parseEnvelopeValue(value) {
  const trimmed = String(value ?? "").trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  return trimmed;
}

function isCandidateDraftObject(value) {
  return (
    isRecord(value) &&
    value.draft_version === "codex_perspective_candidate_draft.v0.1" &&
    value.draft_kind === "codex_perspective_candidate_draft"
  );
}

function allAuthorityFlagsFalse(flags) {
  if (!isRecord(flags)) return false;
  return authorityFlagKeys.every((key) => flags[key] === false);
}

function collectUnsafeSourceInputMarkers(sourceText) {
  const lowered = sourceText.toLowerCase();
  return uniqueTextList([
    ...exactUnsafeSourceInputMarkers.filter((marker) =>
      includesExactMarker(lowered, marker),
    ),
    ...prefixUnsafeSourceInputMarkers.filter((marker) =>
      lowered.includes(marker),
    ),
    ...phraseUnsafeSourceInputMarkers.filter((marker) =>
      lowered.includes(marker),
    ),
    ...tokenBoundaryUnsafeSourceInputMarkers.filter((marker) =>
      includesWordBoundaryMarker(lowered, marker),
    ),
  ]);
}

function hashText(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function includesExactMarker(value, marker) {
  const escaped = escapeRegExp(marker);
  return new RegExp(`(^|[^a-z0-9_])${escaped}([^a-z0-9_]|$)`, "i").test(
    value,
  );
}

function includesWordBoundaryMarker(value, marker) {
  const escaped = escapeRegExp(marker);
  return new RegExp(`\\b${escaped}\\b`, "i").test(value);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function optionalString(value, fieldName) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") {
    throw new Error(`source input ${fieldName} must be a string`);
  }
  return value;
}

function optionalStringArray(value, fieldName) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new Error(`source input ${fieldName} must be an array`);
  }
  return value.map((item, index) => {
    if (typeof item !== "string") {
      throw new Error(`source input ${fieldName}[${index}] must be a string`);
    }
    return item;
  });
}

function optionalCheckRunArray(value, fieldName) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new Error(`source input ${fieldName} must be an array`);
  }
  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`source input ${fieldName}[${index}] must be an object`);
    }
    const status = optionalString(item.status, `${fieldName}[${index}].status`);
    if (!["passed", "failed"].includes(status)) {
      throw new Error(
        `source input ${fieldName}[${index}].status must be passed or failed`,
      );
    }
    return {
      check_id: requireSourceInputString(
        item.check_id,
        `${fieldName}[${index}].check_id`,
      ),
      command: requireSourceInputString(
        item.command,
        `${fieldName}[${index}].command`,
      ),
      status,
      result_summary: requireSourceInputString(
        item.result_summary,
        `${fieldName}[${index}].result_summary`,
      ),
    };
  });
}

function optionalSkippedCheckArray(value, fieldName) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new Error(`source input ${fieldName} must be an array`);
  }
  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`source input ${fieldName}[${index}] must be an object`);
    }
    const resultSummary = optionalString(
      item.result_summary,
      `${fieldName}[${index}].result_summary`,
    );
    return {
      check_id: requireSourceInputString(
        item.check_id,
        `${fieldName}[${index}].check_id`,
      ),
      skipped_reason: requireSourceInputString(
        item.skipped_reason,
        `${fieldName}[${index}].skipped_reason`,
      ),
      ...(resultSummary !== null ? { result_summary: resultSummary } : {}),
    };
  });
}

function optionalGapArray(value, fieldName) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new Error(`source input ${fieldName} must be an array`);
  }
  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`source input ${fieldName}[${index}] must be an object`);
    }
    return {
      gap_id: requireSourceInputString(
        item.gap_id,
        `${fieldName}[${index}].gap_id`,
      ),
      summary: requireSourceInputString(
        item.summary,
        `${fieldName}[${index}].summary`,
      ),
    };
  });
}

function requireSourceInputString(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`source input ${fieldName} must be a non-empty string`);
  }
  return value;
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

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function uniqueTextList(values) {
  return [...new Set(values.filter((value) => typeof value === "string"))];
}

function readJsonFile(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeJsonFile(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function parseOptions(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      throw new Error(`unexpected argument: ${arg}`);
    }
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      options[key] = true;
      continue;
    }
    options[key] = next;
    index += 1;
  }
  return options;
}

function printPrepareSummary(summary) {
  console.log("mode=prepare");
  console.log(`capture_source_kind=${summary.capture_source_kind}`);
  if (summary.source_input_hash) {
    console.log(`source_input_hash=${summary.source_input_hash}`);
  }
  console.log(
    `source_manual_copy_packet_id=${summary.source_manual_copy_packet_id}`,
  );
  console.log(
    `source_former_input_packet_id=${summary.source_former_input_packet_id}`,
  );
  console.log(`source_prompt_hash=${summary.source_prompt_hash}`);
  console.log(`copyable_prompt_path=${summary.output_paths.copyable_prompt_path}`);
  console.log(
    `capture_return_envelope_template_path=${summary.output_paths.capture_return_envelope_template_path}`,
  );
  console.log(`metadata_path=${summary.output_paths.metadata_path}`);
}

function printValidationSummary(summary) {
  console.log("mode=validate");
  console.log(`conclusion=${summary.conclusion}`);
  console.log(`provenance_status=${summary.provenance_status}`);
  console.log(`metadata_match=${summary.metadata_match}`);
  console.log(`candidate_count=${summary.extraction.candidate_count}`);
  console.log(`contract_fit_status=${summary.contract_fit.status}`);
  console.log(`direct_validation_status=${summary.direct_validation.status}`);
  console.log(
    `candidate_compatible_material=${summary.direct_validation.candidate_compatible_material}`,
  );
  console.log(
    `candidate_authority=${summary.direct_validation.candidate_authority}`,
  );
  console.log(
    `candidate_basis_quality=${summary.direct_validation.candidate_basis_quality}`,
  );
  console.log(
    `alignment_status=${summary.alignment_safety_net.status}`,
  );
  console.log("alignment_counted_as_direct_success=false");
  console.log(
    `worker_guidance_status=${summary.worker_facing_guidance.guidance_status}`,
  );
  console.log(
    `worker_guidance_advisory_only=${summary.worker_facing_guidance.advisory_only}`,
  );
  console.log(
    `warning_summary=${
      summary.warning_summary.length > 0
        ? summary.warning_summary.join(", ")
        : "none"
    }`,
  );
  console.log(
    `blocked_reasons=${
      summary.blocked_reasons.length > 0
        ? summary.blocked_reasons.join("; ")
        : "none"
    }`,
  );
}

function runCli(argv) {
  const [mode, ...rest] = argv;
  const options = parseOptions(rest);
  if (mode === "prepare") {
    const summary = prepareCodexFormerCapturePacket({
      outDir: options["out-dir"],
      sourceInputPath: options["source-input"],
      generatedAt: options["generated-at"],
    });
    printPrepareSummary(summary);
    return 0;
  }
  if (mode === "validate") {
    const summary = validateCodexFormerCapture({
      envelopePath: options.envelope,
      metadataPath: options.metadata,
      summaryOutPath: options["summary-out"],
    });
    printValidationSummary(summary);
    return summary.conclusion.startsWith("BLOCKED") ? 1 : 0;
  }

  console.error(
    "usage: perspective-codex-former-capture-helper.mjs <prepare|validate> [options]",
  );
  return 1;
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    process.exitCode = runCli(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
