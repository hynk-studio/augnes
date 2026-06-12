import {
  hashCodexFormerLocalAdapterContent,
  stableStringifyCodexFormerLocalAdapterJson,
} from "@/lib/perspective-ingest/codex-former-local-adapter-manifest-to-source-input";
import type { CodexPerspectiveCandidateDraftV0 } from "@/lib/perspective-ingest/perspective-codex-candidate-draft-pipeline";

export const CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_DRY_RUN_SUMMARY_VERSION =
  "codex_former_local_adapter_validate_dry_run_summary.v0.1";
export const CODEX_FORMER_LOCAL_ADAPTER_PREPARE_EXECUTION_SUMMARY_VERSION =
  "codex_former_local_adapter_prepare_execution_summary.v0.1";

export type CodexFormerLocalAdapterValidateDryRunResult =
  | "ready_for_validate_execution"
  | "blocked_before_validate_execution"
  | "warnings_before_validate_execution";

export type CodexFormerLocalAdapterValidateMatchStatus =
  | boolean
  | "not_comparable"
  | "not_present";

export type CodexFormerLocalAdapterValidateAuthorityFlags = {
  accepted_state_created: false;
  review_decision_created: false;
  db_writes: false;
  network_calls: false;
  provider_model_api_calls: false;
  codex_calls: false;
  codex_sdk_calls: false;
  github_mutation: false;
  core_decision: false;
  proof_evidence_readiness_records_created: false;
  persistence: false;
  surface_export: false;
  clipboard_automation: false;
  runtime_fixture_mutation: false;
  automatic_promotion: false;
  validate_helper_executed: false;
};

export type CodexFormerLocalAdapterValidateDryRunSummaryV0 = {
  summary_version: typeof CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_DRY_RUN_SUMMARY_VERSION;
  mode: "validate-orchestration-dry-run";
  generated_at: string;
  source_input_path: string;
  source_input_hash: string;
  prepare_execution_summary_path: string;
  prepare_execution_summary_hash: string;
  returned_envelope_path: string;
  returned_envelope_hash: string;
  candidate_count: number;
  dry_run_result: CodexFormerLocalAdapterValidateDryRunResult;
  provenance_status: "complete" | "blocked";
  metadata_match: boolean;
  source_manual_copy_packet_id: string | null;
  source_manual_copy_packet_id_match: CodexFormerLocalAdapterValidateMatchStatus;
  former_input_packet_id: string | null;
  former_input_packet_id_match: CodexFormerLocalAdapterValidateMatchStatus;
  source_prompt_hash: string | null;
  source_prompt_hash_match: CodexFormerLocalAdapterValidateMatchStatus;
  prompt_file_sha256: string | null;
  prompt_file_sha256_match: CodexFormerLocalAdapterValidateMatchStatus;
  candidate_shape_status:
    | "existing_validator_compatible"
    | "missing_candidate"
    | "multiple_candidates"
    | "wrong_shape"
    | "unparsable";
  direct_validation_prerequisites_status: "present" | "missing";
  planned_validation_steps: string[];
  worker_facing_guidance_eligibility:
    | "planned_after_direct_validation"
    | "skipped_until_candidate_compatible_review_material";
  warnings: string[];
  pointer_warnings: string[];
  blocked_reasons: string[];
  next_safe_action: string;
  candidate_material_is_review_only: true;
  returned_candidate_treated_as_trusted_runtime_state: false;
  authority_flags: CodexFormerLocalAdapterValidateAuthorityFlags;
};

export type BuildCodexFormerLocalAdapterValidateDryRunSummaryInput = {
  generatedAt?: string | null;
  sourceInputPath: string;
  sourceInputText: string;
  prepareExecutionSummaryPath: string;
  prepareExecutionSummaryText: string;
  returnedEnvelopePath: string;
  returnedEnvelopeText: string;
  promptArtifactText?: string | null;
};

type UnknownRecord = Record<string, unknown>;

type ParsedEnvelope = {
  fields: {
    capture_method: string | null;
    codex_surface_label: string | null;
    prompt_was_generated_by_manual_copy_packet: boolean | null;
    source_manual_copy_packet_id: string | null;
    source_former_input_packet_id: string | null;
    source_prompt_hash: string | null;
  };
  returnedText: string;
  errors: string[];
};

type CandidateExtraction = {
  parsedObjects: unknown[];
  parseErrors: string[];
  compatibleCandidates: CodexPerspectiveCandidateDraftV0[];
  candidateShapeErrors: string[];
};

const requiredCandidateFields = [
  "draft_version",
  "draft_kind",
  "source_former_input_packet",
  "thesis",
  "selected_material",
  "evidence_pointer_refs",
  "unresolved_tensions",
  "basis_quality_suggestion",
  "next_action_candidates",
  "user_core_decision_questions",
  "qualification_notes",
  "privacy_flags",
  "authority_flags",
  "forbidden_actions",
] as const;

const falseCandidateAuthorityFields = [
  "committed_state",
  "persistence",
  "provider_model_api_calls",
  "proof_evidence_readiness_writes",
  "codex_execution",
  "github_mutation",
  "merge_publish_approval",
  "core_decision",
] as const;

const notSuppliedSentinel = "not_supplied_in_chat";

export function buildCodexFormerLocalAdapterValidateDryRunSummary(
  input: BuildCodexFormerLocalAdapterValidateDryRunSummaryInput,
): {
  summary: CodexFormerLocalAdapterValidateDryRunSummaryV0;
  summaryJson: string;
} {
  const generatedAt = hasText(input.generatedAt)
    ? input.generatedAt.trim()
    : new Date().toISOString();
  const sourceInputHash = hashCodexFormerLocalAdapterContent(
    input.sourceInputText,
  );
  const prepareExecutionSummaryHash = hashCodexFormerLocalAdapterContent(
    input.prepareExecutionSummaryText,
  );
  const returnedEnvelopeHash = hashCodexFormerLocalAdapterContent(
    input.returnedEnvelopeText,
  );
  const sourceInput = parseJsonRecord(input.sourceInputText);
  const prepareSummary = parseJsonRecord(input.prepareExecutionSummaryText);
  const envelope = parseReturnedCandidateEnvelope(input.returnedEnvelopeText);
  const extraction = extractCandidateDrafts(envelope.returnedText);
  const candidateCount = extraction.compatibleCandidates.length;
  const candidate = candidateCount === 1 ? extraction.compatibleCandidates[0] : null;

  const blockedReasons: string[] = [];
  const warnings: string[] = [];
  const pointerWarnings: string[] = [];

  if (!sourceInput) blockedReasons.push("source input is not valid JSON object");
  if (!prepareSummary) {
    blockedReasons.push("prepare execution summary is missing or invalid JSON");
  }
  blockedReasons.push(...envelope.errors);
  blockedReasons.push(...extraction.parseErrors);

  const prepareVersion =
    stringField(prepareSummary, "prepare_execution_summary_version") ??
    stringField(prepareSummary, "summary_version");
  if (
    prepareVersion !== CODEX_FORMER_LOCAL_ADAPTER_PREPARE_EXECUTION_SUMMARY_VERSION
  ) {
    blockedReasons.push("prepare execution summary version is unsupported");
  }
  if (stringField(prepareSummary, "mode") !== "prepare-orchestration-execution") {
    blockedReasons.push("prepare execution summary mode must be prepare-orchestration-execution");
  }
  if (stringField(prepareSummary, "output_discovery_status") !== "complete") {
    blockedReasons.push("prepare execution summary output discovery is not complete");
  }
  if (
    hasText(stringField(prepareSummary, "source_input_hash")) &&
    stringField(prepareSummary, "source_input_hash") !== sourceInputHash
  ) {
    blockedReasons.push("source input hash does not match prepare execution summary");
  }

  const prepareAuthority = recordField(prepareSummary, "authority_flags");
  if (prepareAuthority?.validate_helper_executed === true) {
    blockedReasons.push("prepare execution summary says validate_helper_executed is true");
  }
  for (const [field, value] of Object.entries(prepareAuthority ?? {})) {
    if (field === "prepare_helper_executed") continue;
    if (value === true) {
      blockedReasons.push(`prepare execution summary authority flag drift: ${field}`);
    }
  }

  const sourceManualCopyPacketId = envelope.fields.source_manual_copy_packet_id;
  const formerInputPacketId = envelope.fields.source_former_input_packet_id;
  const sourcePromptHash = envelope.fields.source_prompt_hash;
  const helperOutputRefs = recordField(prepareSummary, "helper_output_refs");
  const helperMetadataChecks = recordField(prepareSummary, "helper_metadata_checks");
  const helperOutputPaths = recordField(prepareSummary, "helper_output_paths");
  const sourceManualCopyPacketIdMatch = compareWhenPresent({
    label: "source_manual_copy_packet_id",
    actual: sourceManualCopyPacketId,
    expected: stringField(helperOutputRefs, "manual_copy_packet_ref"),
    blockedReasons,
  });
  const candidateFormerInputPacketId = stringField(
    recordField(candidate, "source_former_input_packet"),
    "packet_id",
  );
  const formerIdCandidates = [
    stringField(helperOutputRefs, "former_input_packet_ref"),
    candidateFormerInputPacketId,
  ].filter(hasText);
  const formerInputPacketIdMatch = compareAgainstAllPresent({
    label: "former_input_packet_id",
    actual: formerInputPacketId,
    expectedValues: formerIdCandidates,
    blockedReasons,
  });
  const sourcePromptHashMatch = compareWhenPresent({
    label: "source_prompt_hash",
    actual: sourcePromptHash,
    expected:
      stringField(helperMetadataChecks, "metadata_source_prompt_hash") ??
      stringField(helperMetadataChecks, "copyable_prompt_hash"),
    blockedReasons,
  });

  const promptFileSha256 = stringField(helperMetadataChecks, "prompt_file_sha256");
  const promptArtifactText = input.promptArtifactText ?? null;
  const promptFileSha256Match =
    hasText(promptFileSha256) && typeof promptArtifactText === "string"
      ? hashCodexFormerLocalAdapterContent(promptArtifactText) === promptFileSha256
      : hasText(promptFileSha256)
        ? "not_comparable"
        : "not_present";
  if (promptFileSha256Match === false) {
    blockedReasons.push("prompt_file_sha256 does not match prompt artifact bytes");
  }

  if (envelope.fields.capture_method !== "human_manual") {
    blockedReasons.push("capture_method must be human_manual");
  }
  if (
    envelope.fields.codex_surface_label !== "separate user-started Codex session"
  ) {
    blockedReasons.push(
      "codex_surface_label must be separate user-started Codex session",
    );
  }
  if (envelope.fields.prompt_was_generated_by_manual_copy_packet !== true) {
    blockedReasons.push("prompt_was_generated_by_manual_copy_packet must be true");
  }
  for (const [field, value] of [
    ["source_manual_copy_packet_id", sourceManualCopyPacketId],
    ["source_former_input_packet_id", formerInputPacketId],
    ["source_prompt_hash", sourcePromptHash],
  ] as const) {
    if (!hasText(value)) blockedReasons.push(`${field} is required`);
    if (value === notSuppliedSentinel) {
      blockedReasons.push(`${field} is ${notSuppliedSentinel}`);
    }
  }

  if (candidateCount !== 1) {
    blockedReasons.push(
      `expected exactly one existing-validator-compatible candidate draft; found ${candidateCount}`,
    );
  }
  if (candidateCount === 0 && extraction.parsedObjects.length > 0) {
    blockedReasons.push(...extraction.candidateShapeErrors);
  }
  if (candidateCount > 1) {
    blockedReasons.push("candidate_count multiple is blocked before validate execution");
  }
  if (candidate && candidateFormerInputPacketId !== formerInputPacketId) {
    blockedReasons.push(
      "candidate.source_former_input_packet.packet_id does not match envelope source_former_input_packet_id",
    );
  }
  if (candidate) {
    const candidateAuthority = recordField(candidate, "authority_flags");
    for (const field of falseCandidateAuthorityFields) {
      if (candidateAuthority?.[field] !== false) {
        blockedReasons.push(`candidate authority flag must be false: ${field}`);
      }
    }
    pointerWarnings.push(...collectPointerWarnings(candidate));
  }

  const candidateShapeStatus = buildCandidateShapeStatus({
    candidateCount,
    parsedObjectCount: extraction.parsedObjects.length,
    parseErrorCount: extraction.parseErrors.length,
  });
  const directValidationPrerequisitesStatus =
    candidateCount === 1 && blockedReasons.length === 0 ? "present" : "missing";
  const dryRunResult =
    blockedReasons.length > 0
      ? "blocked_before_validate_execution"
      : warnings.length > 0 || pointerWarnings.length > 0
        ? "warnings_before_validate_execution"
        : "ready_for_validate_execution";
  const metadataMatch = [
    sourceManualCopyPacketIdMatch,
    formerInputPacketIdMatch,
    sourcePromptHashMatch,
    promptFileSha256Match,
  ].every((value) => value !== false);

  const summary: CodexFormerLocalAdapterValidateDryRunSummaryV0 = {
    summary_version: CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_DRY_RUN_SUMMARY_VERSION,
    mode: "validate-orchestration-dry-run",
    generated_at: generatedAt,
    source_input_path: input.sourceInputPath,
    source_input_hash: sourceInputHash,
    prepare_execution_summary_path: input.prepareExecutionSummaryPath,
    prepare_execution_summary_hash: prepareExecutionSummaryHash,
    returned_envelope_path: input.returnedEnvelopePath,
    returned_envelope_hash: returnedEnvelopeHash,
    candidate_count: candidateCount,
    dry_run_result: dryRunResult,
    provenance_status: blockedReasons.length === 0 ? "complete" : "blocked",
    metadata_match: metadataMatch,
    source_manual_copy_packet_id: sourceManualCopyPacketId,
    source_manual_copy_packet_id_match: sourceManualCopyPacketIdMatch,
    former_input_packet_id: formerInputPacketId,
    former_input_packet_id_match: formerInputPacketIdMatch,
    source_prompt_hash: sourcePromptHash,
    source_prompt_hash_match: sourcePromptHashMatch,
    prompt_file_sha256: promptFileSha256,
    prompt_file_sha256_match: promptFileSha256Match,
    candidate_shape_status: candidateShapeStatus,
    direct_validation_prerequisites_status: directValidationPrerequisitesStatus,
    planned_validation_steps: [
      "Parse returned envelope bounds.",
      "Extract exactly one existing-validator-compatible codex_perspective_candidate_draft.v0.1 object.",
      "Verify source_manual_copy_packet_id, former_input_packet_id, source_prompt_hash, and prompt_file_sha256 provenance.",
      "Run contract-fit evaluation during validate execution.",
      "Run direct candidate validation during validate execution.",
      "Run schema alignment only as a safety-net comparison during validate execution.",
    ],
    worker_facing_guidance_eligibility:
      directValidationPrerequisitesStatus === "present"
        ? "planned_after_direct_validation"
        : "skipped_until_candidate_compatible_review_material",
    warnings: uniqueStrings(warnings),
    pointer_warnings: uniqueStrings(pointerWarnings),
    blocked_reasons: uniqueStrings(blockedReasons),
    next_safe_action: buildNextSafeAction(dryRunResult),
    candidate_material_is_review_only: true,
    returned_candidate_treated_as_trusted_runtime_state: false,
    authority_flags: buildFalseValidateAuthorityFlags(),
  };

  return {
    summary,
    summaryJson: stableStringifyCodexFormerLocalAdapterJson(summary),
  };
}

export function parseReturnedCandidateEnvelope(envelopeText: string): ParsedEnvelope {
  const text = typeof envelopeText === "string" ? envelopeText : "";
  const errors: string[] = [];
  if (!text.includes("REAL TRANSCRIPT CAPTURE AFTER MANUAL COPY PACKET")) {
    errors.push("capture envelope header missing");
  }
  const returnedResponseMatch = text.match(
    /RETURNED_CODEX_RESPONSE:\s*([\s\S]*?)\s*END RETURNED_CODEX_RESPONSE/,
  );
  if (!returnedResponseMatch) {
    errors.push("RETURNED_CODEX_RESPONSE bounds missing");
  }
  const fields = {
    capture_method: parseEnvelopeField(text, "capture_method"),
    codex_surface_label: parseEnvelopeField(text, "codex_surface_label"),
    prompt_was_generated_by_manual_copy_packet: parseEnvelopeBooleanField(
      text,
      "prompt_was_generated_by_manual_copy_packet",
    ),
    source_manual_copy_packet_id: parseEnvelopeField(
      text,
      "source_manual_copy_packet_id",
    ),
    source_former_input_packet_id: parseEnvelopeField(
      text,
      "source_former_input_packet_id",
    ),
    source_prompt_hash: parseEnvelopeField(text, "source_prompt_hash"),
  };
  return {
    fields,
    returnedText: returnedResponseMatch?.[1]?.trim() ?? "",
    errors,
  };
}

export function extractCandidateDrafts(returnedText: string): CandidateExtraction {
  const text = typeof returnedText === "string" ? returnedText.trim() : "";
  if (!hasText(text)) {
    return {
      parsedObjects: [],
      parseErrors: ["returned candidate response text is empty"],
      compatibleCandidates: [],
      candidateShapeErrors: [],
    };
  }

  const objectTexts = collectCandidateObjectTexts(text);
  const parsedObjects: unknown[] = [];
  const parseErrors: string[] = [];
  for (const objectText of objectTexts) {
    try {
      parsedObjects.push(JSON.parse(objectText));
    } catch {
      parseErrors.push("returned candidate JSON object is unparsable");
    }
  }

  const compatibleCandidates: CodexPerspectiveCandidateDraftV0[] = [];
  const candidateShapeErrors: string[] = [];
  for (const [index, candidate] of parsedObjects.entries()) {
    const errors = collectCandidateDraftShapeErrors(candidate, index);
    if (errors.length === 0) {
      compatibleCandidates.push(candidate as CodexPerspectiveCandidateDraftV0);
    } else {
      candidateShapeErrors.push(...errors);
    }
  }

  return {
    parsedObjects,
    parseErrors: uniqueStrings(parseErrors),
    compatibleCandidates,
    candidateShapeErrors: uniqueStrings(candidateShapeErrors),
  };
}

export function stableStringifyCodexFormerLocalAdapterValidateJson(
  value: unknown,
) {
  return stableStringifyCodexFormerLocalAdapterJson(value);
}

export function buildFalseValidateAuthorityFlags():
  CodexFormerLocalAdapterValidateAuthorityFlags {
  return {
    accepted_state_created: false,
    review_decision_created: false,
    db_writes: false,
    network_calls: false,
    provider_model_api_calls: false,
    codex_calls: false,
    codex_sdk_calls: false,
    github_mutation: false,
    core_decision: false,
    proof_evidence_readiness_records_created: false,
    persistence: false,
    surface_export: false,
    clipboard_automation: false,
    runtime_fixture_mutation: false,
    automatic_promotion: false,
    validate_helper_executed: false,
  };
}

function collectCandidateObjectTexts(text: string) {
  try {
    const parsed = JSON.parse(text);
    if (isRecord(parsed)) return [JSON.stringify(parsed)];
  } catch {
    // Continue to bounded object extraction.
  }
  return extractBalancedJsonObjectStrings(text);
}

function extractBalancedJsonObjectStrings(text: string) {
  const objects: string[] = [];
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
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }
    if (char === "\"") {
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

function collectCandidateDraftShapeErrors(candidate: unknown, index: number) {
  const prefix = `candidate[${index}]`;
  const errors: string[] = [];
  if (!isRecord(candidate)) {
    return [`${prefix} is not an object`];
  }
  for (const field of requiredCandidateFields) {
    if (!Object.prototype.hasOwnProperty.call(candidate, field)) {
      errors.push(`${prefix}.${field} is missing`);
    }
  }
  if (candidate.draft_version !== "codex_perspective_candidate_draft.v0.1") {
    errors.push(`${prefix}.draft_version is unsupported`);
  }
  if (candidate.draft_kind !== "codex_perspective_candidate_draft") {
    errors.push(`${prefix}.draft_kind is unsupported`);
  }
  const sourceFormerInputPacket = recordField(
    candidate,
    "source_former_input_packet",
  );
  if (!sourceFormerInputPacket) {
    errors.push(`${prefix}.source_former_input_packet must be an object`);
  } else if (!hasText(stringField(sourceFormerInputPacket, "packet_id"))) {
    errors.push(`${prefix}.source_former_input_packet.packet_id is missing`);
  }
  if (!hasText(stringField(candidate, "thesis"))) {
    errors.push(`${prefix}.thesis is required`);
  }
  if (!isRecord(candidate.selected_material)) {
    errors.push(`${prefix}.selected_material must be an object`);
  }
  for (const field of [
    "evidence_pointer_refs",
    "unresolved_tensions",
    "next_action_candidates",
    "user_core_decision_questions",
    "qualification_notes",
    "forbidden_actions",
  ]) {
    if (!Array.isArray(candidate[field])) {
      errors.push(`${prefix}.${field} must be an array`);
    }
  }
  if (!isRecord(candidate.basis_quality_suggestion)) {
    errors.push(`${prefix}.basis_quality_suggestion must be an object`);
  }
  if (!isRecord(candidate.privacy_flags)) {
    errors.push(`${prefix}.privacy_flags must be an object`);
  }
  if (!isRecord(candidate.authority_flags)) {
    errors.push(`${prefix}.authority_flags must be an object`);
  }
  return errors;
}

function collectPointerWarnings(candidate: CodexPerspectiveCandidateDraftV0) {
  const warnings: string[] = [];
  for (const [index, pointer] of candidate.evidence_pointer_refs.entries()) {
    if (pointer.pointer_semantics !== "pointer_only") {
      warnings.push(`evidence_pointer_refs[${index}] is not pointer_only`);
    }
  }
  return warnings;
}

function compareWhenPresent({
  label,
  actual,
  expected,
  blockedReasons,
}: {
  label: string;
  actual: string | null;
  expected: string | null;
  blockedReasons: string[];
}): CodexFormerLocalAdapterValidateMatchStatus {
  if (!hasText(actual)) return "not_present";
  if (!hasText(expected)) return "not_comparable";
  const matched = actual === expected;
  if (!matched) blockedReasons.push(`${label} does not match prepare provenance`);
  return matched;
}

function compareAgainstAllPresent({
  label,
  actual,
  expectedValues,
  blockedReasons,
}: {
  label: string;
  actual: string | null;
  expectedValues: string[];
  blockedReasons: string[];
}): CodexFormerLocalAdapterValidateMatchStatus {
  if (!hasText(actual)) return "not_present";
  if (expectedValues.length === 0) return "not_comparable";
  const matched = expectedValues.every((expected) => expected === actual);
  if (!matched) blockedReasons.push(`${label} does not match candidate or prepare provenance`);
  return matched;
}

function buildCandidateShapeStatus({
  candidateCount,
  parsedObjectCount,
  parseErrorCount,
}: {
  candidateCount: number;
  parsedObjectCount: number;
  parseErrorCount: number;
}): CodexFormerLocalAdapterValidateDryRunSummaryV0["candidate_shape_status"] {
  if (candidateCount === 1) return "existing_validator_compatible";
  if (candidateCount > 1) return "multiple_candidates";
  if (parseErrorCount > 0) return "unparsable";
  if (parsedObjectCount === 0) return "missing_candidate";
  return "wrong_shape";
}

function buildNextSafeAction(
  dryRunResult: CodexFormerLocalAdapterValidateDryRunResult,
) {
  if (dryRunResult === "ready_for_validate_execution") {
    return "Review this dry-run summary before running a future validate execution command.";
  }
  if (dryRunResult === "warnings_before_validate_execution") {
    return "Review warnings before deciding whether a future validate execution command is safe.";
  }
  return "Fix blocked dry-run findings before validate execution.";
}

function parseEnvelopeField(text: string, fieldName: string) {
  const match = text.match(new RegExp(`^${fieldName}:\\s*(.+)$`, "m"));
  return match?.[1]?.trim() ?? null;
}

function parseEnvelopeBooleanField(text: string, fieldName: string) {
  const value = parseEnvelopeField(text, fieldName);
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function parseJsonRecord(text: string): UnknownRecord | null {
  try {
    const parsed = JSON.parse(text);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function stringField(record: unknown, fieldName: string) {
  if (!isRecord(record)) return null;
  const value = record[fieldName];
  return typeof value === "string" ? value : null;
}

function recordField(record: unknown, fieldName: string) {
  if (!isRecord(record)) return null;
  const value = record[fieldName];
  return isRecord(value) ? value : null;
}

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function uniqueStrings(values: string[]) {
  return [...new Set(values)];
}

export default {
  CODEX_FORMER_LOCAL_ADAPTER_PREPARE_EXECUTION_SUMMARY_VERSION,
  CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_DRY_RUN_SUMMARY_VERSION,
  buildCodexFormerLocalAdapterValidateDryRunSummary,
  buildFalseValidateAuthorityFlags,
  extractCandidateDrafts,
  parseReturnedCandidateEnvelope,
  stableStringifyCodexFormerLocalAdapterValidateJson,
};
