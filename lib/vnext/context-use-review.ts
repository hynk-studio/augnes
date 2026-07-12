import {
  canonicalizeProtocolValueV01,
  compareExternalRefsV01,
  compareProtocolCanonicalV01,
  createProtocolSha256V01,
  isProtocolRecordV01,
  normalizeExternalRefPrimitiveV01,
  normalizeProtocolTextV01,
  parseStrictIsoTimestampV01,
  protocolStringValueV01,
  rejectUnknownProtocolKeysV01,
  scanForbiddenProtocolMaterialV01,
  uniqueProtocolStringsV01,
  uniqueProtocolValuesV01,
  validateDuplicateExternalRefsPrimitiveV01,
  validateExternalRefStructureV01,
  type ProtocolJsonRecordV01,
} from "@/lib/vnext/protocol-primitives";
import { validateRunReceiptV01 } from "@/lib/vnext/run-receipt";
import { validateStateTransitionReceiptV01 } from "@/lib/vnext/state-transition-receipt";
import {
  validateTaskContextPacketTransitionRelationV01,
} from "@/lib/vnext/state-transition-eligibility";
import { validateTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import {
  CONTEXT_USE_REVIEW_ACTUALLY_USED_VALUES_V01,
  CONTEXT_USE_REVIEW_ASSESSMENTS_V01,
  CONTEXT_USE_REVIEW_CANONICALIZATION_V01,
  CONTEXT_USE_REVIEW_PRESENTED_VALUES_V01,
  CONTEXT_USE_REVIEW_VERSION_V01,
  type ContextUseReviewAuthoritySummaryV01,
  type ContextUseReviewCompatibilityMetadataV01,
  type ContextUseReviewMaterialBoundaryV01,
  type ContextUseReviewMetricsV01,
  type ContextUseReviewPacketBindingV01,
  type ContextUseReviewRunReceiptBindingV01,
  type ContextUseReviewTransitionReceiptBindingV01,
  type ContextUseReviewV01,
  type ContextUseReviewValidationIssueV01,
  type ContextUseReviewValidationResultV01,
} from "@/types/vnext/context-use-review";
import { RUN_RECEIPT_VERSION_V01, type RunReceiptV01 } from "@/types/vnext/run-receipt";
import {
  STATE_TRANSITION_RECEIPT_VERSION_V01,
  type StateTransitionReceiptV01,
} from "@/types/vnext/state-transition-receipt";
import {
  TASK_CONTEXT_PACKET_VERSION_V01,
  type TaskContextPacketV01,
} from "@/types/vnext/task-context-packet";

const PENDING_REVIEW_ID = "context-use-review:pending";
const PENDING_FINGERPRINT = "sha256:pending";
const presentedValues = new Set<string>(CONTEXT_USE_REVIEW_PRESENTED_VALUES_V01);
const actuallyUsedValues = new Set<string>(
  CONTEXT_USE_REVIEW_ACTUALLY_USED_VALUES_V01,
);
const assessmentValues = new Set<string>(CONTEXT_USE_REVIEW_ASSESSMENTS_V01);

const allowedRootKeys = new Set([
  "review_version", "review_id", "workspace_id", "project_id",
  "prior_packet", "later_packet", "source_transition_receipt",
  "later_task_run_receipt", "reviewer_ref",
  "reviewer_authentication_basis_refs", "reviewed_at", "usage",
  "assessment", "corrections", "metrics", "notes", "compatibility",
  "material_boundary", "authority_summary", "integrity",
]);
const allowedPacketBindingKeys = new Set([
  "packet_version", "packet_id", "packet_fingerprint",
]);
const allowedTransitionBindingKeys = new Set([
  "transition_receipt_version", "transition_receipt_id",
  "transition_receipt_fingerprint",
]);
const allowedRunBindingKeys = new Set([
  "receipt_version", "receipt_id", "receipt_fingerprint",
]);
const allowedUsageKeys = new Set(["presented", "actually_used"]);
const allowedCorrectionsKeys = new Set(["correction_count", "summaries"]);
const allowedMetricsKeys = new Set([
  "wrong_context_correction_count", "repeated_explanation_estimate",
  "missing_critical_context_count", "context_refs_used_count",
]);
const allowedCompatibilityKeys = new Set([
  "source_contracts", "unmapped_fields", "warnings", "external_refs",
]);
const allowedUnmappedKeys = new Set(["source_field", "reason"]);
const allowedMaterialBoundaryKeys = new Set([
  "bounded_summaries_only", "max_summary_characters",
  "max_collection_items", "max_refs_per_collection",
  "raw_prompt_persisted", "raw_transcript_persisted",
  "raw_terminal_output_persisted", "raw_provider_output_persisted",
  "hidden_reasoning_persisted", "credential_or_secret_persisted",
  "absolute_local_path_persisted",
]);
const allowedAuthorityKeys = new Set([
  "record_represents_context_use_review",
  "contract_validation_authenticates_reviewer",
  "construction_proves_real_review", "record_is_evidence",
  "record_is_semantic_state", "record_is_review_decision",
  "record_is_state_transition_receipt", "record_is_work_closure",
  "creates_correction_proposal", "applies_state_transition",
  "accepts_evidence", "mutates_perspective", "promotes_reviewed_memory",
  "closes_work", "selects_next_context_automatically",
  "triggers_automatic_rollback", "authorizes_provider_calls",
  "authorizes_github_mutation", "authorizes_publication",
  "authorizes_external_actuation", "writes_database", "notes",
]);
const allowedIntegrityKeys = new Set([
  "algorithm", "canonicalization", "fingerprint_scope", "fingerprint",
]);
const boundedTextFields = new Set(["summaries", "notes", "warnings", "reason"]);

export const CONTEXT_USE_REVIEW_REQUIRED_CORE_FIELDS_V01 = [
  "review_version", "review_id", "workspace_id", "project_id",
  "prior_packet", "later_packet", "source_transition_receipt",
  "later_task_run_receipt", "reviewer_ref",
  "reviewer_authentication_basis_refs", "reviewed_at", "usage",
  "assessment", "corrections", "metrics", "notes", "compatibility",
  "material_boundary", "authority_summary", "integrity",
] as const;

export type ContextUseReviewBuilderInputV01 = Omit<
  ContextUseReviewV01,
  "review_version" | "review_id" | "material_boundary" | "authority_summary" | "integrity"
> & { authority_notes?: string[] };

interface Accumulator {
  errors: ContextUseReviewValidationIssueV01[];
  warnings: ContextUseReviewValidationIssueV01[];
  blocked: boolean;
}

export function buildContextUseReviewV01(
  input: ContextUseReviewBuilderInputV01,
): ContextUseReviewV01 {
  const review: ContextUseReviewV01 = {
    review_version: CONTEXT_USE_REVIEW_VERSION_V01,
    review_id: PENDING_REVIEW_ID,
    workspace_id: normalizeProtocolTextV01(input.workspace_id),
    project_id: normalizeProtocolTextV01(input.project_id),
    prior_packet: normalizePacketBinding(input.prior_packet),
    later_packet: normalizePacketBinding(input.later_packet),
    source_transition_receipt: normalizeTransitionBinding(
      input.source_transition_receipt,
    ),
    later_task_run_receipt: normalizeRunBinding(input.later_task_run_receipt),
    reviewer_ref: normalizeExternalRefPrimitiveV01(input.reviewer_ref),
    reviewer_authentication_basis_refs: normalizeRefs(
      input.reviewer_authentication_basis_refs,
    ),
    reviewed_at: normalizeProtocolTextV01(input.reviewed_at),
    usage: {
      presented: normalizeProtocolTextV01(input.usage.presented) as
        ContextUseReviewV01["usage"]["presented"],
      actually_used: normalizeProtocolTextV01(input.usage.actually_used) as
        ContextUseReviewV01["usage"]["actually_used"],
    },
    assessment: normalizeProtocolTextV01(input.assessment) as
      ContextUseReviewV01["assessment"],
    corrections: {
      correction_count: input.corrections.correction_count,
      summaries: uniqueProtocolStringsV01(input.corrections.summaries),
    },
    metrics: { ...input.metrics },
    notes: uniqueProtocolStringsV01(input.notes),
    compatibility: normalizeCompatibility(input.compatibility),
    material_boundary: createContextUseReviewMaterialBoundaryV01(),
    authority_summary: createContextUseReviewAuthoritySummaryV01(
      input.authority_notes,
    ),
    integrity: {
      algorithm: "sha256",
      canonicalization: CONTEXT_USE_REVIEW_CANONICALIZATION_V01,
      fingerprint_scope: "review_without_integrity_fingerprint",
      fingerprint: PENDING_FINGERPRINT,
    },
  };
  assertBuildSemantics(review);
  review.review_id = deriveContextUseReviewIdV01(review);
  review.integrity.fingerprint = createContextUseReviewFingerprintV01(review);
  const validation = validateContextUseReviewV01(review);
  if (validation.status !== "valid") {
    const issue = validation.errors[0];
    throw new RangeError(
      `${issue?.path ?? "$"}: ${issue?.code ?? "context_use_review_invalid"}`,
    );
  }
  return review;
}

export function createContextUseReviewMaterialBoundaryV01(): ContextUseReviewMaterialBoundaryV01 {
  return {
    bounded_summaries_only: true,
    max_summary_characters: 2000,
    max_collection_items: 128,
    max_refs_per_collection: 64,
    raw_prompt_persisted: false,
    raw_transcript_persisted: false,
    raw_terminal_output_persisted: false,
    raw_provider_output_persisted: false,
    hidden_reasoning_persisted: false,
    credential_or_secret_persisted: false,
    absolute_local_path_persisted: false,
  };
}

export function createContextUseReviewAuthoritySummaryV01(
  notes: string[] = [],
): ContextUseReviewAuthoritySummaryV01 {
  return {
    record_represents_context_use_review: true,
    contract_validation_authenticates_reviewer: false,
    construction_proves_real_review: false,
    record_is_evidence: false,
    record_is_semantic_state: false,
    record_is_review_decision: false,
    record_is_state_transition_receipt: false,
    record_is_work_closure: false,
    creates_correction_proposal: false,
    applies_state_transition: false,
    accepts_evidence: false,
    mutates_perspective: false,
    promotes_reviewed_memory: false,
    closes_work: false,
    selects_next_context_automatically: false,
    triggers_automatic_rollback: false,
    authorizes_provider_calls: false,
    authorizes_github_mutation: false,
    authorizes_publication: false,
    authorizes_external_actuation: false,
    writes_database: false,
    notes: uniqueProtocolStringsV01([
      "ContextUseReview records a bounded assessment; it is not Evidence, semantic state, a decision, transition, or work closure.",
      "Reviewer authentication basis references do not authenticate a legal, external, or operating-system identity.",
      "A negative assessment does not automatically retract state or create a correction proposal.",
      ...notes,
    ]),
  };
}

export function canonicalizeContextUseReviewValueV01(value: unknown): string {
  return canonicalizeProtocolValueV01(value);
}

export function deriveContextUseReviewIdV01(review: ContextUseReviewV01): string {
  const hash = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      review_version: review.review_version,
      workspace_id: review.workspace_id,
      project_id: review.project_id,
      prior_packet: review.prior_packet,
      later_packet: review.later_packet,
      source_transition_receipt: review.source_transition_receipt,
      later_task_run_receipt: review.later_task_run_receipt,
      reviewer_ref: review.reviewer_ref,
      reviewed_at: review.reviewed_at,
    }),
  );
  return `context-use-review:${hash.slice("sha256:".length, 31)}`;
}

export function createContextUseReviewFingerprintV01(
  review: ContextUseReviewV01,
): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01(withoutFingerprint(review)),
  );
}

export function validateContextUseReviewV01(
  input: unknown,
): ContextUseReviewValidationResultV01 {
  const accumulator = createAccumulator();
  const sink = issueSink(accumulator);
  scanForbiddenProtocolMaterialV01(input, "$", sink, {
    secret_material_message: "Secret-shaped material is forbidden in ContextUseReview.",
    provider_specific_field_message:
      "Provider-native identifiers must remain ExternalRef values in ContextUseReview.",
    allowed_false_invariant_fields: new Set([
      "raw_prompt_persisted", "raw_transcript_persisted",
      "raw_terminal_output_persisted", "raw_provider_output_persisted",
      "hidden_reasoning_persisted", "credential_or_secret_persisted",
      "absolute_local_path_persisted",
    ]),
    additional_forbidden_raw_field_pattern:
      /^(?:raw_provider_output|raw_terminal_(?:output|log)|terminal_(?:dump|log)|stdout|stderr|credential_dump)$/,
    additional_provider_identity_pattern:
      /^(?:(?:github|openai|chatgpt|codex|claude|gemini)(?:_.+)?|(?:response|invocation|workflow|job|commit|pr)_id)$/,
  });
  scanAbsolutePaths(input, "$", accumulator);
  if (!isProtocolRecordV01(input)) {
    addError(accumulator, "review_not_object", "$", "ContextUseReview must be an object.");
    return result(accumulator, null);
  }
  rejectUnknownProtocolKeysV01(input, allowedRootKeys, "$", sink, "unknown_core_field", true);
  const version = protocolStringValueV01(input.review_version);
  if (version !== CONTEXT_USE_REVIEW_VERSION_V01) {
    addError(accumulator, "unsupported_protocol_version", "$.review_version", "Unsupported ContextUseReview version.", true);
  }
  for (const field of CONTEXT_USE_REVIEW_REQUIRED_CORE_FIELDS_V01) {
    if (input[field] === undefined) addError(accumulator, `${field}_missing`, `$.${field}`, `${field} is required.`);
  }
  requireString(input.review_id, "$.review_id", accumulator);
  requireString(input.workspace_id, "$.workspace_id", accumulator);
  requireString(input.project_id, "$.project_id", accumulator);
  validatePacketBinding(input.prior_packet, "$.prior_packet", accumulator);
  validatePacketBinding(input.later_packet, "$.later_packet", accumulator);
  validateTransitionBinding(input.source_transition_receipt, accumulator);
  validateRunBinding(input.later_task_run_receipt, accumulator);
  validateExternalRefStructureV01(input.reviewer_ref, "$.reviewer_ref", sink);
  if (
    !isProtocolRecordV01(input.reviewer_ref) ||
    protocolStringValueV01(input.reviewer_ref.trust_class) !== "user_declaration"
  ) {
    addError(
      accumulator,
      "reviewer_trust_class_invalid",
      "$.reviewer_ref.trust_class",
      "Reviewer identity must remain a user_declaration.",
      true,
    );
  }
  validateRefArray(input.reviewer_authentication_basis_refs, "$.reviewer_authentication_basis_refs", true, accumulator);
  if (
    Array.isArray(input.reviewer_authentication_basis_refs) &&
    input.reviewer_authentication_basis_refs.some(
      (item) =>
        !isProtocolRecordV01(item) ||
        !["direct_local_observation", "verified_external_observation"].includes(
          protocolStringValueV01(item.trust_class) ?? "",
        ),
    )
  ) {
    addError(
      accumulator,
      "reviewer_authentication_basis_trust_invalid",
      "$.reviewer_authentication_basis_refs",
      "Authentication basis refs require direct or verified observation without authenticating external identity.",
      true,
    );
  }
  requireTimestamp(input.reviewed_at, "$.reviewed_at", accumulator);
  validateUsage(input.usage, accumulator);
  if (!assessmentValues.has(protocolStringValueV01(input.assessment) ?? "")) {
    addError(accumulator, "assessment_invalid", "$.assessment", "Assessment value is invalid.");
  }
  validateCorrections(input.corrections, accumulator);
  validateMetrics(input.metrics, accumulator);
  validateUseSemantics(input, accumulator);
  validateStringArray(input.notes, "$.notes", accumulator);
  validateCompatibility(input.compatibility, accumulator);
  validateMaterialBoundary(input.material_boundary, accumulator);
  validateAuthority(input.authority_summary, accumulator);
  validateAllExternalRefs(input, accumulator);
  validateDuplicateExternalRefsPrimitiveV01(input, sink);
  validateBounds(input, accumulator);
  validateIntegrity(input, accumulator);
  return result(
    accumulator,
    version === CONTEXT_USE_REVIEW_VERSION_V01
      ? CONTEXT_USE_REVIEW_VERSION_V01
      : null,
  );
}

export function validateContextUseReviewRelationsV01(
  reviewInput: unknown,
  priorPacketInput: unknown,
  laterPacketInput: unknown,
  transitionReceiptInput: unknown,
  laterTaskRunReceiptInput: unknown,
): ContextUseReviewValidationResultV01 {
  const base = validateContextUseReviewV01(reviewInput);
  const accumulator: Accumulator = {
    errors: [...base.errors], warnings: [...base.warnings],
    blocked: base.status === "blocked",
  };
  const relatedValidations = [
    [
      validateTaskContextPacketV01(priorPacketInput, {
        evaluated_at: packetEvaluationTime(priorPacketInput),
      }),
      "prior_packet_invalid",
      "$.prior_packet",
    ],
    [
      validateTaskContextPacketV01(laterPacketInput, {
        evaluated_at: packetEvaluationTime(laterPacketInput),
      }),
      "later_packet_invalid",
      "$.later_packet",
    ],
    [
      validateStateTransitionReceiptV01(transitionReceiptInput),
      "source_transition_receipt_invalid",
      "$.source_transition_receipt",
    ],
    [
      validateRunReceiptV01(laterTaskRunReceiptInput),
      "later_task_run_receipt_invalid",
      "$.later_task_run_receipt",
    ],
  ] as const;
  for (const [validation, code, path] of relatedValidations) {
    if (validation.status !== "valid") addError(accumulator, code, path, "Related payload must validate independently.", true);
  }
  if (
    base.status !== "valid" ||
    relatedValidations.some(([validation]) => validation.status !== "valid") ||
    !isProtocolRecordV01(reviewInput)
  ) return result(accumulator, base.normalized_protocol_version);

  const review = reviewInput as unknown as ContextUseReviewV01;
  const prior = priorPacketInput as TaskContextPacketV01;
  const later = laterPacketInput as TaskContextPacketV01;
  const transition = transitionReceiptInput as StateTransitionReceiptV01;
  const run = laterTaskRunReceiptInput as RunReceiptV01;
  for (const [value, code, path] of [
    [prior.workspace_id, "workspace_mismatch", "$.prior_packet"],
    [later.workspace_id, "workspace_mismatch", "$.later_packet"],
    [transition.workspace_id, "workspace_mismatch", "$.source_transition_receipt"],
    [run.workspace_id, "workspace_mismatch", "$.later_task_run_receipt"],
  ] as const) if (value !== review.workspace_id) addError(accumulator, code, path, "Workspace identity must match.", true);
  for (const [value, code, path] of [
    [prior.project_id, "project_mismatch", "$.prior_packet"],
    [later.project_id, "project_mismatch", "$.later_packet"],
    [transition.project_id, "project_mismatch", "$.source_transition_receipt"],
    [run.project_id, "project_mismatch", "$.later_task_run_receipt"],
  ] as const) if (value !== review.project_id) addError(accumulator, code, path, "Project identity must match.", true);

  validateExactPacketBinding(review.prior_packet, prior, "prior_packet", accumulator);
  validateExactPacketBinding(review.later_packet, later, "later_packet", accumulator);
  if (
    review.source_transition_receipt.transition_receipt_id !== transition.transition_receipt_id ||
    review.source_transition_receipt.transition_receipt_fingerprint !== transition.integrity.fingerprint
  ) addError(accumulator, "transition_receipt_binding_mismatch", "$.source_transition_receipt", "Review must bind the exact transition receipt.", true);
  if (
    review.later_task_run_receipt.receipt_id !== run.receipt_id ||
    review.later_task_run_receipt.receipt_fingerprint !== run.integrity.fingerprint
  ) addError(accumulator, "run_receipt_binding_mismatch", "$.later_task_run_receipt", "Review must bind the exact later-task RunReceipt.", true);

  const packetRelation = validateTaskContextPacketTransitionRelationV01(prior, transition, later);
  if (packetRelation.status !== "valid") {
    addError(accumulator, "packet_transition_relation_invalid", "$.later_packet", "Prior packet, transition receipt, and later packet relation must validate.", true);
  }
  const packetRef = run.task_context_packet_ref;
  if (
    !packetRef || packetRef.ref_type !== "task_context_packet" ||
    packetRef.external_id !== later.packet_id ||
    packetRef.source_ref !== later.integrity.fingerprint ||
    !["direct_local_observation", "verified_external_observation"].includes(packetRef.trust_class)
  ) addError(accumulator, "later_packet_run_receipt_relation_mismatch", "$.later_task_run_receipt", "Later-task receipt must preserve an observation-grade exact later packet ID and fingerprint reference.", true);
  const transitionRefs = run.external_refs.filter(
    (ref) =>
      ref.ref_type === "state_transition_receipt" &&
      ref.external_id === transition.transition_receipt_id,
  );
  if (
    transitionRefs.length !== 1 ||
    transitionRefs[0]!.source_ref !== transition.integrity.fingerprint ||
    !["direct_local_observation", "verified_external_observation"].includes(
      transitionRefs[0]!.trust_class,
    )
  ) {
    addError(
      accumulator,
      "transition_run_receipt_relation_mismatch",
      "$.later_task_run_receipt",
      "Later-task receipt must preserve one observation-grade exact source transition receipt ID and fingerprint reference.",
      true,
    );
  }

  const reviewedAt = parseStrictIsoTimestampV01(review.reviewed_at);
  const runAt = parseStrictIsoTimestampV01(run.recorded_at);
  const laterAt = parseStrictIsoTimestampV01(later.generated_at);
  if (runAt !== null && laterAt !== null && runAt < laterAt) addError(accumulator, "run_receipt_precedes_later_packet", "$.later_task_run_receipt", "Later-task receipt cannot predate the later packet.", true);
  if (reviewedAt !== null && runAt !== null && reviewedAt < runAt) addError(accumulator, "review_precedes_run_receipt", "$.reviewed_at", "Context-use review cannot predate the later-task receipt.", true);
  return result(accumulator, base.normalized_protocol_version);
}

function normalizePacketBinding(input: ContextUseReviewPacketBindingV01): ContextUseReviewPacketBindingV01 {
  return { packet_version: TASK_CONTEXT_PACKET_VERSION_V01, packet_id: normalizeProtocolTextV01(input.packet_id), packet_fingerprint: normalizeProtocolTextV01(input.packet_fingerprint) };
}
function normalizeTransitionBinding(input: ContextUseReviewTransitionReceiptBindingV01): ContextUseReviewTransitionReceiptBindingV01 {
  return { transition_receipt_version: STATE_TRANSITION_RECEIPT_VERSION_V01, transition_receipt_id: normalizeProtocolTextV01(input.transition_receipt_id), transition_receipt_fingerprint: normalizeProtocolTextV01(input.transition_receipt_fingerprint) };
}
function normalizeRunBinding(input: ContextUseReviewRunReceiptBindingV01): ContextUseReviewRunReceiptBindingV01 {
  return { receipt_version: RUN_RECEIPT_VERSION_V01, receipt_id: normalizeProtocolTextV01(input.receipt_id), receipt_fingerprint: normalizeProtocolTextV01(input.receipt_fingerprint) };
}
function normalizeRefs(refs: ExternalRefV01[]): ExternalRefV01[] {
  return uniqueProtocolValuesV01(refs.map(normalizeExternalRefPrimitiveV01)).sort(compareExternalRefsV01);
}
function normalizeCompatibility(value: ContextUseReviewCompatibilityMetadataV01): ContextUseReviewCompatibilityMetadataV01 {
  return {
    source_contracts: uniqueProtocolStringsV01(value.source_contracts),
    unmapped_fields: uniqueProtocolValuesV01(value.unmapped_fields.map((item) => ({ source_field: normalizeProtocolTextV01(item.source_field), reason: normalizeProtocolTextV01(item.reason) }))).sort(compareProtocolCanonicalV01),
    warnings: uniqueProtocolStringsV01(value.warnings),
    external_refs: normalizeRefs(value.external_refs),
  };
}
function withoutFingerprint(review: ContextUseReviewV01) {
  const copy = structuredClone(review) as ContextUseReviewV01;
  delete (copy.integrity as Partial<ContextUseReviewV01["integrity"]>).fingerprint;
  return copy;
}
function createAccumulator(): Accumulator { return { errors: [], warnings: [], blocked: false }; }
function issueSink(acc: Accumulator) { return { error: (code: string, path: string | null, message: string, blocked = false) => addError(acc, code, path, message, blocked), warning: (code: string, path: string | null, message: string) => acc.warnings.push({ severity: "warning", code, path, message }) }; }
function addError(acc: Accumulator, code: string, path: string | null, message: string, blocked = false) { acc.errors.push({ severity: "error", code, path, message }); if (blocked) acc.blocked = true; }
function result(acc: Accumulator, version: typeof CONTEXT_USE_REVIEW_VERSION_V01 | null): ContextUseReviewValidationResultV01 { return { status: acc.errors.length === 0 ? "valid" : acc.blocked ? "blocked" : "invalid", normalized_protocol_version: version, errors: acc.errors, warnings: acc.warnings }; }
function record(value: unknown, path: string, acc: Accumulator): ProtocolJsonRecordV01 | null { if (!isProtocolRecordV01(value)) { addError(acc, "object_expected", path, "Expected an object."); return null; } return value; }
function requireString(value: unknown, path: string, acc: Accumulator) { if (!protocolStringValueV01(value)) addError(acc, "string_missing", path, "Expected a non-empty string."); }
function requireTimestamp(value: unknown, path: string, acc: Accumulator) { if (parseStrictIsoTimestampV01(value) === null) addError(acc, "timestamp_malformed", path, "Expected a strict ISO timestamp."); }
function validateSha(value: unknown, path: string, acc: Accumulator) { if (!/^sha256:[a-f0-9]{64}$/.test(protocolStringValueV01(value) ?? "")) addError(acc, "sha256_malformed", path, "Expected a SHA-256 fingerprint."); }
function rejectNested(value: ProtocolJsonRecordV01, keys: Set<string>, path: string, acc: Accumulator) { rejectUnknownProtocolKeysV01(value, keys, path, issueSink(acc), "unknown_nested_field", true); }
function validatePacketBinding(value: unknown, path: string, acc: Accumulator) { const item = record(value, path, acc); if (!item) return; rejectNested(item, allowedPacketBindingKeys, path, acc); if (item.packet_version !== TASK_CONTEXT_PACKET_VERSION_V01) addError(acc, "packet_version_invalid", `${path}.packet_version`, "Packet version is invalid."); requireString(item.packet_id, `${path}.packet_id`, acc); validateSha(item.packet_fingerprint, `${path}.packet_fingerprint`, acc); }
function validateTransitionBinding(value: unknown, acc: Accumulator) { const path = "$.source_transition_receipt"; const item = record(value, path, acc); if (!item) return; rejectNested(item, allowedTransitionBindingKeys, path, acc); if (item.transition_receipt_version !== STATE_TRANSITION_RECEIPT_VERSION_V01) addError(acc, "transition_receipt_version_invalid", `${path}.transition_receipt_version`, "Transition receipt version is invalid."); requireString(item.transition_receipt_id, `${path}.transition_receipt_id`, acc); validateSha(item.transition_receipt_fingerprint, `${path}.transition_receipt_fingerprint`, acc); }
function validateRunBinding(value: unknown, acc: Accumulator) { const path = "$.later_task_run_receipt"; const item = record(value, path, acc); if (!item) return; rejectNested(item, allowedRunBindingKeys, path, acc); if (item.receipt_version !== RUN_RECEIPT_VERSION_V01) addError(acc, "run_receipt_version_invalid", `${path}.receipt_version`, "RunReceipt version is invalid."); requireString(item.receipt_id, `${path}.receipt_id`, acc); validateSha(item.receipt_fingerprint, `${path}.receipt_fingerprint`, acc); }
function validateUsage(value: unknown, acc: Accumulator) { const path = "$.usage"; const item = record(value, path, acc); if (!item) return; rejectNested(item, allowedUsageKeys, path, acc); if (!presentedValues.has(protocolStringValueV01(item.presented) ?? "")) addError(acc, "presented_invalid", `${path}.presented`, "Presented value is invalid."); if (!actuallyUsedValues.has(protocolStringValueV01(item.actually_used) ?? "")) addError(acc, "actually_used_invalid", `${path}.actually_used`, "Actually-used value is invalid."); }
function validateCorrections(value: unknown, acc: Accumulator) { const path = "$.corrections"; const item = record(value, path, acc); if (!item) return; rejectNested(item, allowedCorrectionsKeys, path, acc); validateNonnegativeInteger(item.correction_count, `${path}.correction_count`, false, acc); const summaries = validateStringArray(item.summaries, `${path}.summaries`, acc); if (Number.isInteger(item.correction_count) && item.correction_count !== summaries.length) addError(acc, "correction_count_mismatch", `${path}.correction_count`, "correction_count must equal summaries length.", true); }
function validateMetrics(value: unknown, acc: Accumulator) { const path = "$.metrics"; const item = record(value, path, acc); if (!item) return; rejectNested(item, allowedMetricsKeys, path, acc); for (const key of allowedMetricsKeys) validateNonnegativeInteger(item[key], `${path}.${key}`, true, acc); }
function validateUseSemantics(input: ProtocolJsonRecordV01, acc: Accumulator) { const usage = isProtocolRecordV01(input.usage) ? input.usage : null; const metrics = isProtocolRecordV01(input.metrics) ? input.metrics : null; const presented = protocolStringValueV01(usage?.presented); const actuallyUsed = protocolStringValueV01(usage?.actually_used); const assessment = protocolStringValueV01(input.assessment); if ((actuallyUsed === "yes" || actuallyUsed === "partial") && presented !== "yes") addError(acc, "use_without_presentation", "$.usage.actually_used", "Actual use yes or partial requires presented yes.", true); if (assessment === "helpful" && actuallyUsed !== "yes" && actuallyUsed !== "partial") addError(acc, "helpful_without_use", "$.assessment", "Helpful requires actual use yes or partial.", true); if (typeof metrics?.context_refs_used_count === "number" && metrics.context_refs_used_count > 0 && actuallyUsed !== "yes" && actuallyUsed !== "partial") addError(acc, "context_refs_used_without_use", "$.metrics.context_refs_used_count", "A positive used-reference count requires actual use yes or partial.", true); }
function validateNonnegativeInteger(value: unknown, path: string, nullable: boolean, acc: Accumulator) { if (nullable && value === null) return; if (!Number.isInteger(value) || (value as number) < 0) addError(acc, "nonnegative_integer_or_unknown_required", path, nullable ? "Expected a nonnegative integer or null for unknown." : "Expected a nonnegative integer."); }
function validateStringArray(value: unknown, path: string, acc: Accumulator): string[] { if (!Array.isArray(value)) { addError(acc, "array_expected", path, "Expected an array."); return []; } const result: string[] = []; value.forEach((item, index) => { const text = protocolStringValueV01(item); if (!text) addError(acc, "string_missing", `${path}[${index}]`, "Expected a non-empty string."); else result.push(text); }); return result; }
function validateRefArray(value: unknown, path: string, nonempty: boolean, acc: Accumulator) { if (!Array.isArray(value)) { addError(acc, "array_expected", path, "Expected an array."); return; } if (nonempty && value.length === 0) addError(acc, "reviewer_authentication_basis_required", path, "At least one authentication basis ref is required."); value.forEach((item, index) => validateExternalRefStructureV01(item, `${path}[${index}]`, issueSink(acc))); }
function validateCompatibility(value: unknown, acc: Accumulator) { const path = "$.compatibility"; const item = record(value, path, acc); if (!item) return; rejectNested(item, allowedCompatibilityKeys, path, acc); validateStringArray(item.source_contracts, `${path}.source_contracts`, acc); validateStringArray(item.warnings, `${path}.warnings`, acc); validateRefArray(item.external_refs, `${path}.external_refs`, false, acc); if (!Array.isArray(item.unmapped_fields)) addError(acc, "array_expected", `${path}.unmapped_fields`, "Expected an array."); else item.unmapped_fields.forEach((entry, index) => { const nested = record(entry, `${path}.unmapped_fields[${index}]`, acc); if (!nested) return; rejectNested(nested, allowedUnmappedKeys, `${path}.unmapped_fields[${index}]`, acc); requireString(nested.source_field, `${path}.unmapped_fields[${index}].source_field`, acc); requireString(nested.reason, `${path}.unmapped_fields[${index}].reason`, acc); }); }
function validateMaterialBoundary(value: unknown, acc: Accumulator) { const path = "$.material_boundary"; const item = record(value, path, acc); if (!item) return; rejectNested(item, allowedMaterialBoundaryKeys, path, acc); const expected = createContextUseReviewMaterialBoundaryV01(); for (const [key, expectedValue] of Object.entries(expected)) if (item[key] !== expectedValue) addError(acc, "material_boundary_violation", `${path}.${key}`, "Material boundary invariant changed.", true); }
function validateAuthority(value: unknown, acc: Accumulator) { const path = "$.authority_summary"; const item = record(value, path, acc); if (!item) return; rejectNested(item, allowedAuthorityKeys, path, acc); validateStringArray(item.notes, `${path}.notes`, acc); const expected = createContextUseReviewAuthoritySummaryV01([]); for (const [key, expectedValue] of Object.entries(expected)) { if (key === "notes") continue; if (item[key] !== expectedValue) addError(acc, "authority_boundary_violation", `${path}.${key}`, "Authority invariant changed.", true); } }
function validateAllExternalRefs(value: unknown, acc: Accumulator) { walk(value, "$", (candidate, path) => { if (isProtocolRecordV01(candidate) && candidate.ref_version !== undefined) validateExternalRefStructureV01(candidate, path, issueSink(acc)); }); }
function validateBounds(value: unknown, acc: Accumulator) { for (const violation of collectBoundViolations(value)) addError(acc, violation.code, violation.path, violation.message, true); }
function collectBoundViolations(value: unknown) { const boundary = createContextUseReviewMaterialBoundaryV01(); const violations: Array<{ code: string; path: string; message: string }> = []; walk(value, "$", (candidate, path) => { if (Array.isArray(candidate)) { const limit = /(?:_refs|source_contracts)$/.test(lastPathKey(path)) ? boundary.max_refs_per_collection : boundary.max_collection_items; if (candidate.length > limit) violations.push({ code: "collection_bound_exceeded", path, message: `Collection exceeds ${limit} items.` }); } else if (typeof candidate === "string" && boundedTextFields.has(lastPathKey(path)) && candidate.length > boundary.max_summary_characters) violations.push({ code: "summary_bound_exceeded", path, message: `Bounded text exceeds ${boundary.max_summary_characters} characters.` }); }); return violations; }
function assertBuildSemantics(review: ContextUseReviewV01) { if (review.corrections.correction_count !== review.corrections.summaries.length) throw new RangeError("correction_count must equal correction summaries length"); for (const value of Object.values(review.metrics)) if (value !== null && (!Number.isInteger(value) || value < 0)) throw new RangeError("metrics must be nonnegative integers or null"); const [violation] = collectBoundViolations(review); if (violation) throw new RangeError(`${violation.path}: ${violation.message}`); }
function validateIntegrity(input: ProtocolJsonRecordV01, acc: Accumulator) { const item = record(input.integrity, "$.integrity", acc); if (!item) return; rejectNested(item, allowedIntegrityKeys, "$.integrity", acc); if (item.algorithm !== "sha256" || item.canonicalization !== CONTEXT_USE_REVIEW_CANONICALIZATION_V01 || item.fingerprint_scope !== "review_without_integrity_fingerprint") addError(acc, "integrity_metadata_invalid", "$.integrity", "Integrity metadata is invalid."); try { const review = input as unknown as ContextUseReviewV01; if (protocolStringValueV01(input.review_id) !== deriveContextUseReviewIdV01(review)) addError(acc, "review_identity_mismatch", "$.review_id", "Deterministic review ID mismatch."); if (protocolStringValueV01(item.fingerprint) !== createContextUseReviewFingerprintV01(review)) addError(acc, "fingerprint_mismatch", "$.integrity.fingerprint", "Review fingerprint mismatch."); } catch { addError(acc, "integrity_computation_failed", "$.integrity", "Malformed review could not be fingerprinted."); } }
function validateExactPacketBinding(binding: ContextUseReviewPacketBindingV01, packet: TaskContextPacketV01, label: string, acc: Accumulator) { if (binding.packet_id !== packet.packet_id || binding.packet_fingerprint !== packet.integrity.fingerprint) addError(acc, `${label}_binding_mismatch`, `$.${label}`, `Review must bind the exact ${label}.`, true); }
function scanAbsolutePaths(value: unknown, path: string, acc: Accumulator) { walk(value, path, (candidate, candidatePath) => { if (typeof candidate === "string" && /^(?:file:\/\/|\/(?!\/)|[A-Za-z]:[\\/])/.test(candidate)) addError(acc, "absolute_local_path_forbidden", candidatePath, "Absolute local paths are forbidden.", true); }); }
function walk(value: unknown, path: string, visit: (value: unknown, path: string) => void) { visit(value, path); if (Array.isArray(value)) value.forEach((item, index) => walk(item, `${path}[${index}]`, visit)); else if (isProtocolRecordV01(value)) for (const [key, child] of Object.entries(value)) walk(child, `${path}.${key}`, visit); }
function lastPathKey(path: string) { return path.replace(/\[\d+\]$/u, "").split(".").at(-1) ?? ""; }
function packetEvaluationTime(value: unknown): string { return isProtocolRecordV01(value) && protocolStringValueV01(value.generated_at) ? protocolStringValueV01(value.generated_at)! : "1970-01-01T00:00:00.000Z"; }
