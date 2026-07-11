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
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import { EPISODE_DELTA_PROPOSAL_VERSION_V01 } from "@/types/vnext/episode-delta-proposal";
import {
  REVIEW_DECISION_VERSION_V01,
  type ReviewDecisionRequestedTransitionKindV01,
} from "@/types/vnext/review-decision";
import {
  STATE_TRANSITION_RECEIPT_CANONICALIZATION_V01,
  STATE_TRANSITION_RECEIPT_OBSERVATION_TRUST_CLASSES_V01,
  STATE_TRANSITION_RECEIPT_OPERATIONS_V01,
  STATE_TRANSITION_RECEIPT_VERSION_V01,
  type StateTransitionReceiptAuthoritySummaryV01,
  type StateTransitionReceiptBuilderInputV01,
  type StateTransitionReceiptCompatibilityMetadataV01,
  type StateTransitionReceiptEffectInputV01,
  type StateTransitionReceiptEffectV01,
  type StateTransitionReceiptMaterialBoundaryV01,
  type StateTransitionReceiptReplayCompatibilityV01,
  type StateTransitionReceiptStateSnapshotV01,
  type StateTransitionReceiptV01,
  type StateTransitionReceiptValidationIssueV01,
  type StateTransitionReceiptValidationResultV01,
} from "@/types/vnext/state-transition-receipt";

const PENDING_TRANSITION_RECEIPT_ID = "state-transition-receipt:pending";
const PENDING_EFFECT_ID = "state-transition-effect:pending";
const PENDING_FINGERPRINT = "sha256:pending";
const PENDING_IDEMPOTENCY_KEY = "sha256:pending";

const operations = new Set<string>(STATE_TRANSITION_RECEIPT_OPERATIONS_V01);
const observationTrustClasses = new Set<string>(
  STATE_TRANSITION_RECEIPT_OBSERVATION_TRUST_CLASSES_V01,
);
const appliedTransitionKinds = new Set<string>([
  "semantic_candidate_apply",
  "semantic_candidate_supersede",
  "semantic_candidate_retract",
]);

const allowedRootKeys = new Set([
  "transition_receipt_version",
  "transition_receipt_id",
  "idempotency_key",
  "workspace_id",
  "project_id",
  "source_proposal",
  "source_decision",
  "source_candidate",
  "requested_transition_intent",
  "transition_scope",
  "receipt_status",
  "atomicity",
  "effects",
  "applied_at",
  "recorded_at",
  "applied_by_ref",
  "semantic_commit_gate",
  "eligibility_precondition_fingerprint",
  "source_refs",
  "compatibility",
  "material_boundary",
  "authority_summary",
  "integrity",
]);
const allowedProposalBindingKeys = new Set([
  "proposal_version",
  "proposal_id",
  "proposal_fingerprint",
]);
const allowedDecisionBindingKeys = new Set([
  "decision_version",
  "decision_id",
  "decision_fingerprint",
]);
const allowedCandidateBindingKeys = new Set([
  "candidate_id",
  "candidate_fingerprint",
]);
const allowedIntentBindingKeys = new Set([
  "intent_id",
  "transition_kind",
  "target_refs",
]);
const allowedAtomicityKeys = new Set([
  "mode",
  "all_effects_applied",
  "partial_application",
]);
const allowedEffectKeys = new Set([
  "effect_id",
  "target_ref",
  "operation",
  "before_state",
  "after_state",
  "before_state_observation_ref",
  "after_application_observation_ref",
  "durable_record_ref",
  "source_refs",
]);
const allowedSnapshotKeys = new Set([
  "presence",
  "state_ref",
  "state_fingerprint",
]);
const allowedGateKeys = new Set([
  "status",
  "evaluation_ref",
  "evaluated_at",
  "expires_at",
]);
const allowedCompatibilityKeys = new Set([
  "source_contracts",
  "unmapped_fields",
  "warnings",
  "external_refs",
]);
const allowedUnmappedFieldKeys = new Set(["source_field", "reason"]);
const allowedMaterialBoundaryKeys = new Set([
  "bounded_summaries_only",
  "max_summary_characters",
  "max_collection_items",
  "max_refs_per_collection",
  "raw_prompt_persisted",
  "raw_transcript_persisted",
  "raw_terminal_output_persisted",
  "raw_provider_output_persisted",
  "raw_artifact_content_persisted",
  "hidden_reasoning_persisted",
  "credential_or_secret_persisted",
  "absolute_local_path_persisted",
]);
const allowedAuthoritySummaryKeys = new Set([
  "represents_applied_durable_semantic_transition",
  "receipt_is_proposal",
  "receipt_is_review_decision",
  "receipt_is_transition_request",
  "receipt_is_eligibility_result",
  "receipt_is_permission_grant",
  "receipt_is_failed_transition_attempt",
  "receipt_is_planned_transition",
  "receipt_is_canonical_project_state",
  "receipt_is_accepted_evidence",
  "receipt_proves_external_publication",
  "builder_applies_state",
  "validator_applies_state",
  "contract_validation_authenticates_external_refs",
  "grants_future_transition_authority",
  "grants_execution_authority",
  "grants_scheduling_authority",
  "grants_retry_authority",
  "grants_replay_authority",
  "grants_deployment_authority",
  "grants_provider_call_authority",
  "grants_github_mutation_authority",
  "grants_merge_authority",
  "grants_publication_authority",
  "grants_external_actuation_authority",
  "grants_external_side_effect_authority",
  "writes_database",
  "creates_evidence",
  "applies_perspective",
  "promotes_reviewed_memory",
  "closes_work",
  "selects_next_context_automatically",
  "notes",
]);
const allowedIntegrityKeys = new Set([
  "algorithm",
  "canonicalization",
  "fingerprint_scope",
  "fingerprint",
]);
const boundedTextFieldNames = new Set(["reason", "warnings", "notes"]);

export const STATE_TRANSITION_RECEIPT_REQUIRED_CORE_FIELDS_V01 = [
  "transition_receipt_version",
  "transition_receipt_id",
  "idempotency_key",
  "workspace_id",
  "project_id",
  "source_proposal",
  "source_decision",
  "source_candidate",
  "requested_transition_intent",
  "transition_scope",
  "receipt_status",
  "atomicity",
  "effects",
  "applied_at",
  "recorded_at",
  "applied_by_ref",
  "semantic_commit_gate",
  "eligibility_precondition_fingerprint",
  "source_refs",
  "compatibility",
  "material_boundary",
  "authority_summary",
  "integrity",
] as const;

type ValidationAccumulator = {
  errors: StateTransitionReceiptValidationIssueV01[];
  warnings: StateTransitionReceiptValidationIssueV01[];
  blocked: boolean;
};

export function buildStateTransitionReceiptV01(
  input: StateTransitionReceiptBuilderInputV01,
): StateTransitionReceiptV01 {
  const intentTargetRefs = normalizeRefs(
    input.requested_transition_intent.target_refs,
  );
  const effects = input.effects
    .map(normalizeEffectInput)
    .map((effect) => ({
      ...effect,
      effect_id: deriveStateTransitionEffectIdV01(effect),
    }))
    .sort(compareProtocolCanonicalV01);
  const receipt: StateTransitionReceiptV01 = {
    transition_receipt_version: STATE_TRANSITION_RECEIPT_VERSION_V01,
    transition_receipt_id: PENDING_TRANSITION_RECEIPT_ID,
    idempotency_key: PENDING_IDEMPOTENCY_KEY,
    workspace_id: normalizeProtocolTextV01(input.workspace_id),
    project_id: normalizeProtocolTextV01(input.project_id),
    source_proposal: {
      proposal_version: EPISODE_DELTA_PROPOSAL_VERSION_V01,
      proposal_id: normalizeProtocolTextV01(input.source_proposal.proposal_id),
      proposal_fingerprint: normalizeProtocolTextV01(
        input.source_proposal.proposal_fingerprint,
      ),
    },
    source_decision: {
      decision_version: REVIEW_DECISION_VERSION_V01,
      decision_id: normalizeProtocolTextV01(input.source_decision.decision_id),
      decision_fingerprint: normalizeProtocolTextV01(
        input.source_decision.decision_fingerprint,
      ),
    },
    source_candidate: {
      candidate_id: normalizeProtocolTextV01(
        input.source_candidate.candidate_id,
      ),
      candidate_fingerprint: normalizeProtocolTextV01(
        input.source_candidate.candidate_fingerprint,
      ),
    },
    requested_transition_intent: {
      intent_id: normalizeProtocolTextV01(
        input.requested_transition_intent.intent_id,
      ),
      transition_kind: input.requested_transition_intent.transition_kind,
      target_refs: intentTargetRefs,
    },
    transition_scope: "semantic_state",
    receipt_status: "applied",
    atomicity: {
      mode: "all_or_nothing",
      all_effects_applied: true,
      partial_application: false,
    },
    effects,
    applied_at: normalizeProtocolTextV01(input.applied_at),
    recorded_at: normalizeProtocolTextV01(input.recorded_at),
    applied_by_ref: normalizeExternalRefPrimitiveV01(input.applied_by_ref),
    semantic_commit_gate: {
      status: "authorized",
      evaluation_ref: normalizeExternalRefPrimitiveV01(
        input.semantic_commit_gate.evaluation_ref,
      ),
      evaluated_at: normalizeProtocolTextV01(
        input.semantic_commit_gate.evaluated_at,
      ),
      expires_at: normalizeProtocolTextV01(
        input.semantic_commit_gate.expires_at,
      ),
    },
    eligibility_precondition_fingerprint: normalizeProtocolTextV01(
      input.eligibility_precondition_fingerprint,
    ),
    source_refs: normalizeRefs(input.source_refs),
    compatibility: normalizeCompatibility(input.compatibility),
    material_boundary: createStateTransitionReceiptMaterialBoundaryV01(),
    authority_summary: createStateTransitionReceiptAuthoritySummaryV01(
      input.authority_notes,
    ),
    integrity: {
      algorithm: "sha256",
      canonicalization: STATE_TRANSITION_RECEIPT_CANONICALIZATION_V01,
      fingerprint_scope: "transition_receipt_without_integrity_fingerprint",
      fingerprint: PENDING_FINGERPRINT,
    },
  };
  assertStateTransitionReceiptBuildBoundsV01(receipt);
  receipt.idempotency_key =
    createStateTransitionReceiptIdempotencyKeyV01(receipt);
  receipt.transition_receipt_id = deriveStateTransitionReceiptIdV01(receipt);
  receipt.integrity.fingerprint =
    createStateTransitionReceiptFingerprintV01(receipt);
  return receipt;
}

export function createStateTransitionReceiptAuthoritySummaryV01(
  notes: string[] = [],
): StateTransitionReceiptAuthoritySummaryV01 {
  return {
    represents_applied_durable_semantic_transition: true,
    receipt_is_proposal: false,
    receipt_is_review_decision: false,
    receipt_is_transition_request: false,
    receipt_is_eligibility_result: false,
    receipt_is_permission_grant: false,
    receipt_is_failed_transition_attempt: false,
    receipt_is_planned_transition: false,
    receipt_is_canonical_project_state: false,
    receipt_is_accepted_evidence: false,
    receipt_proves_external_publication: false,
    builder_applies_state: false,
    validator_applies_state: false,
    contract_validation_authenticates_external_refs: false,
    grants_future_transition_authority: false,
    grants_execution_authority: false,
    grants_scheduling_authority: false,
    grants_retry_authority: false,
    grants_replay_authority: false,
    grants_deployment_authority: false,
    grants_provider_call_authority: false,
    grants_github_mutation_authority: false,
    grants_merge_authority: false,
    grants_publication_authority: false,
    grants_external_actuation_authority: false,
    grants_external_side_effect_authority: false,
    writes_database: false,
    creates_evidence: false,
    applies_perspective: false,
    promotes_reviewed_memory: false,
    closes_work: false,
    selects_next_context_automatically: false,
    notes: uniqueProtocolStringsV01([
      "StateTransitionReceipt represents an already applied durable semantic transition; construction and validation do not apply it.",
      "The receipt is not canonical state, authorization, accepted Evidence, or permission for a future transition.",
      "Contract validation does not authenticate external references or grant external actuation authority.",
      ...notes,
    ]),
  };
}

export function createStateTransitionReceiptMaterialBoundaryV01(): StateTransitionReceiptMaterialBoundaryV01 {
  return {
    bounded_summaries_only: true,
    max_summary_characters: 2000,
    max_collection_items: 128,
    max_refs_per_collection: 64,
    raw_prompt_persisted: false,
    raw_transcript_persisted: false,
    raw_terminal_output_persisted: false,
    raw_provider_output_persisted: false,
    raw_artifact_content_persisted: false,
    hidden_reasoning_persisted: false,
    credential_or_secret_persisted: false,
    absolute_local_path_persisted: false,
  };
}

export function canonicalizeStateTransitionReceiptValueV01(
  value: unknown,
): string {
  return canonicalizeProtocolValueV01(value);
}

export function deriveStateTransitionEffectIdV01(
  effect: StateTransitionReceiptEffectInputV01 | StateTransitionReceiptEffectV01,
): string {
  const { effect_id: _effectId, ...material } = {
    effect_id: PENDING_EFFECT_ID,
    ...effect,
  };
  const hash = createProtocolSha256V01(
    canonicalizeProtocolValueV01(material),
  );
  return `state-transition-effect:${hash.slice("sha256:".length, 31)}`;
}

export function createStateTransitionReceiptIdempotencyKeyV01(
  receipt: StateTransitionReceiptV01,
): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      transition_receipt_version: receipt.transition_receipt_version,
      workspace_id: receipt.workspace_id,
      project_id: receipt.project_id,
      decision_fingerprint: receipt.source_decision.decision_fingerprint,
      intent_id: receipt.requested_transition_intent.intent_id,
      transition_kind: receipt.requested_transition_intent.transition_kind,
      target_refs: normalizeRefs(
        receipt.requested_transition_intent.target_refs,
      ),
    }),
  );
}

export function deriveStateTransitionReceiptIdV01(
  receipt: StateTransitionReceiptV01,
): string {
  const hash = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      ...withoutFingerprint(receipt),
      transition_receipt_id: PENDING_TRANSITION_RECEIPT_ID,
    }),
  );
  return `state-transition-receipt:${hash.slice("sha256:".length, 31)}`;
}

export function createStateTransitionReceiptFingerprintV01(
  receipt: StateTransitionReceiptV01,
): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01(withoutFingerprint(receipt)),
  );
}

export function createStateTransitionApplicationResultFingerprintV01(
  effect: Pick<
    StateTransitionReceiptEffectInputV01,
    "target_ref" | "operation" | "before_state" | "after_state"
  >,
  appliedAt: string,
): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      application_result_version: "state_transition_application_result.v0.1",
      target_ref: normalizeExternalRefPrimitiveV01(effect.target_ref),
      operation: effect.operation,
      before_state: normalizeSnapshot(effect.before_state),
      after_state: normalizeSnapshot(effect.after_state),
      applied_at: normalizeProtocolTextV01(appliedAt),
    }),
  );
}

export function createStateTransitionReceiptAppliedResultFingerprintV01(
  receipt: StateTransitionReceiptV01,
): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      applied_result_version: "state_transition_receipt_applied_result.v0.1",
      workspace_id: normalizeProtocolTextV01(receipt.workspace_id),
      project_id: normalizeProtocolTextV01(receipt.project_id),
      applied_by_ref: normalizeExternalRefPrimitiveV01(
        receipt.applied_by_ref,
      ),
      effect_result_fingerprints: receipt.effects
        .map((effect) =>
          createStateTransitionApplicationResultFingerprintV01(
            effect,
            receipt.applied_at,
          ),
        )
        .sort(),
    }),
  );
}

export function compareStateTransitionReceiptReplayCompatibilityV01(
  leftInput: unknown,
  rightInput: unknown,
): StateTransitionReceiptReplayCompatibilityV01 {
  const leftValidation = validateStateTransitionReceiptV01(leftInput);
  const rightValidation = validateStateTransitionReceiptV01(rightInput);
  const errors = [
    ...leftValidation.errors.map((issue) => ({
      ...issue,
      path: issue.path ? `$.left${issue.path.slice(1)}` : "$.left",
    })),
    ...rightValidation.errors.map((issue) => ({
      ...issue,
      path: issue.path ? `$.right${issue.path.slice(1)}` : "$.right",
    })),
  ];
  if (
    leftValidation.status !== "valid" ||
    rightValidation.status !== "valid" ||
    !isProtocolRecordV01(leftInput) ||
    !isProtocolRecordV01(rightInput)
  ) {
    return {
      status: "blocked",
      idempotency_key: null,
      left_applied_result_fingerprint: null,
      right_applied_result_fingerprint: null,
      errors,
    };
  }
  const left = leftInput as unknown as StateTransitionReceiptV01;
  const right = rightInput as unknown as StateTransitionReceiptV01;
  const leftResult =
    createStateTransitionReceiptAppliedResultFingerprintV01(left);
  const rightResult =
    createStateTransitionReceiptAppliedResultFingerprintV01(right);
  if (left.idempotency_key !== right.idempotency_key) {
    return {
      status: "distinct_intent",
      idempotency_key: null,
      left_applied_result_fingerprint: leftResult,
      right_applied_result_fingerprint: rightResult,
      errors: [],
    };
  }
  return {
    status: leftResult === rightResult ? "exact_replay" : "conflicting_result",
    idempotency_key: left.idempotency_key,
    left_applied_result_fingerprint: leftResult,
    right_applied_result_fingerprint: rightResult,
    errors: [],
  };
}

export function validateStateTransitionReceiptV01(
  input: unknown,
): StateTransitionReceiptValidationResultV01 {
  const accumulator = createAccumulator();
  const sink = issueSink(accumulator);
  scanForbiddenProtocolMaterialV01(input, "$", sink, {
    secret_material_message:
      "Secret-shaped material is forbidden in StateTransitionReceipt.",
    provider_specific_field_message:
      "Provider-native identifiers must remain ExternalRef values in StateTransitionReceipt.",
    allowed_false_invariant_fields: new Set([
      "partial_application",
      "receipt_is_proposal",
      "receipt_is_review_decision",
      "receipt_is_transition_request",
      "receipt_is_eligibility_result",
      "receipt_is_permission_grant",
      "receipt_is_failed_transition_attempt",
      "receipt_is_planned_transition",
      "receipt_is_canonical_project_state",
      "receipt_is_accepted_evidence",
      "receipt_proves_external_publication",
      "builder_applies_state",
      "validator_applies_state",
      "contract_validation_authenticates_external_refs",
      "grants_future_transition_authority",
      "grants_execution_authority",
      "grants_scheduling_authority",
      "grants_retry_authority",
      "grants_replay_authority",
      "grants_deployment_authority",
      "grants_provider_call_authority",
      "grants_github_mutation_authority",
      "grants_merge_authority",
      "grants_publication_authority",
      "grants_external_actuation_authority",
      "grants_external_side_effect_authority",
      "writes_database",
      "creates_evidence",
      "applies_perspective",
      "promotes_reviewed_memory",
      "closes_work",
      "selects_next_context_automatically",
      "raw_prompt_persisted",
      "raw_transcript_persisted",
      "raw_terminal_output_persisted",
      "raw_provider_output_persisted",
      "raw_artifact_content_persisted",
      "hidden_reasoning_persisted",
      "credential_or_secret_persisted",
      "absolute_local_path_persisted",
    ]),
    additional_forbidden_raw_field_pattern:
      /^(?:raw_provider_output|raw_terminal_(?:output|log)|terminal_(?:dump|log)|stdout|stderr|environment_dump|credential_dump)$/,
    additional_provider_identity_pattern:
      /^(?:(?:github|openai|chatgpt|codex|claude|gemini)(?:_.+)?|(?:response|invocation|workflow|job|commit|pr)_id)$/,
  });
  scanAbsoluteLocalPaths(input, "$", accumulator);

  if (!isProtocolRecordV01(input)) {
    addError(
      accumulator,
      "transition_receipt_not_object",
      "$",
      "StateTransitionReceipt must be an object.",
    );
    return buildValidationResult(accumulator, null);
  }

  rejectUnknownProtocolKeysV01(
    input,
    allowedRootKeys,
    "$",
    sink,
    "unknown_core_field",
    true,
  );
  const version = protocolStringValueV01(input.transition_receipt_version);
  if (version !== STATE_TRANSITION_RECEIPT_VERSION_V01) {
    addError(
      accumulator,
      "unsupported_protocol_version",
      "$.transition_receipt_version",
      `Unsupported StateTransitionReceipt version: ${version ?? "missing"}.`,
      true,
    );
  }
  for (const field of STATE_TRANSITION_RECEIPT_REQUIRED_CORE_FIELDS_V01) {
    if (input[field] === undefined) {
      addError(
        accumulator,
        `${field}_missing`,
        `$.${field}`,
        `${field} is required by StateTransitionReceipt v0.1.`,
      );
    }
  }

  const receiptId = requireString(
    input,
    "transition_receipt_id",
    "$",
    accumulator,
  );
  if (receiptId && !receiptId.startsWith("state-transition-receipt:")) {
    addError(
      accumulator,
      "transition_receipt_id_malformed",
      "$.transition_receipt_id",
      "Expected a StateTransitionReceipt canonical ID.",
    );
  }
  validateSha256(input.idempotency_key, "$.idempotency_key", "idempotency_key_malformed", accumulator);
  requireString(input, "workspace_id", "$", accumulator);
  requireString(input, "project_id", "$", accumulator);
  validateProposalBinding(input.source_proposal, accumulator);
  validateDecisionBinding(input.source_decision, accumulator);
  validateCandidateBinding(input.source_candidate, accumulator);
  const intentTargets = validateIntentBinding(
    input.requested_transition_intent,
    accumulator,
  );
  if (input.transition_scope !== "semantic_state") {
    addError(
      accumulator,
      "transition_scope_invalid",
      "$.transition_scope",
      "StateTransitionReceipt v0.1 is restricted to semantic_state.",
      true,
    );
  }
  if (input.receipt_status !== "applied") {
    addError(
      accumulator,
      "receipt_status_invalid",
      "$.receipt_status",
      "Only an applied durable transition may be represented by StateTransitionReceipt.",
      true,
    );
  }
  validateAtomicity(input.atomicity, accumulator);
  const effectTargets = validateEffects(input.effects, accumulator);
  validateExactTargetSet(intentTargets, effectTargets, accumulator);
  const appliedAt = requireTimestamp(input.applied_at, "$.applied_at", accumulator);
  const recordedAt = requireTimestamp(input.recorded_at, "$.recorded_at", accumulator);
  if (appliedAt !== null && recordedAt !== null && appliedAt > recordedAt) {
    addError(
      accumulator,
      "timestamp_order_invalid",
      "$.recorded_at",
      "recorded_at must not precede applied_at.",
      true,
    );
  }
  validateExternalRefStructureV01(input.applied_by_ref, "$.applied_by_ref", sink);
  validateGateBinding(
    input.semantic_commit_gate,
    appliedAt,
    recordedAt,
    accumulator,
  );
  validateEffectTimes(input.effects, appliedAt, recordedAt, accumulator);
  validateApplicationResultProofBindings(
    input.effects,
    appliedAt === null ? null : protocolStringValueV01(input.applied_at),
    accumulator,
  );
  validateSha256(
    input.eligibility_precondition_fingerprint,
    "$.eligibility_precondition_fingerprint",
    "eligibility_precondition_fingerprint_malformed",
    accumulator,
  );
  requireNonEmptyRefArray(
    input.source_refs,
    "$.source_refs",
    "source_ref_required",
    accumulator,
  );
  validateCompatibility(input.compatibility, accumulator);
  validateAllExternalRefs(input, accumulator);
  validateDuplicateExternalRefsPrimitiveV01(input, sink);
  validateMaterialBoundary(input.material_boundary, accumulator);
  validateAuthority(input.authority_summary, accumulator);
  validateBounds(input, accumulator);
  validateIntegrity(input, accumulator);

  return buildValidationResult(
    accumulator,
    version === STATE_TRANSITION_RECEIPT_VERSION_V01
      ? STATE_TRANSITION_RECEIPT_VERSION_V01
      : null,
  );
}

function normalizeEffectInput(
  effect: StateTransitionReceiptEffectInputV01,
): StateTransitionReceiptEffectInputV01 {
  return {
    target_ref: normalizeExternalRefPrimitiveV01(effect.target_ref),
    operation: effect.operation,
    before_state: normalizeSnapshot(effect.before_state),
    after_state: normalizeSnapshot(effect.after_state),
    before_state_observation_ref: normalizeExternalRefPrimitiveV01(
      effect.before_state_observation_ref,
    ),
    after_application_observation_ref: normalizeExternalRefPrimitiveV01(
      effect.after_application_observation_ref,
    ),
    durable_record_ref: normalizeExternalRefPrimitiveV01(
      effect.durable_record_ref,
    ),
    source_refs: normalizeRefs(effect.source_refs),
  };
}

function normalizeSnapshot(
  snapshot: StateTransitionReceiptStateSnapshotV01,
): StateTransitionReceiptStateSnapshotV01 {
  if (snapshot.presence === "absent") {
    return { presence: "absent", state_ref: null, state_fingerprint: null };
  }
  return {
    presence: "present",
    state_ref: normalizeExternalRefPrimitiveV01(snapshot.state_ref),
    state_fingerprint: normalizeProtocolTextV01(snapshot.state_fingerprint),
  };
}

function normalizeCompatibility(
  value: StateTransitionReceiptCompatibilityMetadataV01,
): StateTransitionReceiptCompatibilityMetadataV01 {
  return {
    source_contracts: uniqueProtocolStringsV01(value.source_contracts),
    unmapped_fields: uniqueProtocolValuesV01(
      value.unmapped_fields.map((item) => ({
        source_field: normalizeProtocolTextV01(item.source_field),
        reason: normalizeProtocolTextV01(item.reason),
      })),
    ).sort(compareProtocolCanonicalV01),
    warnings: uniqueProtocolStringsV01(value.warnings),
    external_refs: normalizeRefs(value.external_refs),
  };
}

function normalizeRefs(refs: ExternalRefV01[]): ExternalRefV01[] {
  return uniqueProtocolValuesV01(
    refs.map(normalizeExternalRefPrimitiveV01),
  ).sort(compareExternalRefsV01);
}

function withoutFingerprint(receipt: StateTransitionReceiptV01) {
  const { fingerprint: _fingerprint, ...integrity } = receipt.integrity;
  return { ...receipt, integrity };
}

function validateProposalBinding(
  value: unknown,
  accumulator: ValidationAccumulator,
) {
  const binding = recordAt(value, "$.source_proposal", accumulator);
  if (!binding) return;
  rejectUnknownNestedKeys(binding, allowedProposalBindingKeys, "$.source_proposal", accumulator);
  if (binding.proposal_version !== EPISODE_DELTA_PROPOSAL_VERSION_V01) {
    addError(accumulator, "source_proposal_version_invalid", "$.source_proposal.proposal_version", "StateTransitionReceipt requires EpisodeDeltaProposal v0.1.");
  }
  const id = requireString(binding, "proposal_id", "$.source_proposal", accumulator);
  if (id && !id.startsWith("episode-delta-proposal:")) {
    addError(accumulator, "source_proposal_id_malformed", "$.source_proposal.proposal_id", "Expected an EpisodeDeltaProposal canonical ID.");
  }
  validateSha256(binding.proposal_fingerprint, "$.source_proposal.proposal_fingerprint", "source_proposal_fingerprint_malformed", accumulator);
}

function validateDecisionBinding(
  value: unknown,
  accumulator: ValidationAccumulator,
) {
  const binding = recordAt(value, "$.source_decision", accumulator);
  if (!binding) return;
  rejectUnknownNestedKeys(binding, allowedDecisionBindingKeys, "$.source_decision", accumulator);
  if (binding.decision_version !== REVIEW_DECISION_VERSION_V01) {
    addError(accumulator, "source_decision_version_invalid", "$.source_decision.decision_version", "StateTransitionReceipt requires ReviewDecision v0.1.");
  }
  const id = requireString(binding, "decision_id", "$.source_decision", accumulator);
  if (id && !id.startsWith("review-decision:")) {
    addError(accumulator, "source_decision_id_malformed", "$.source_decision.decision_id", "Expected a ReviewDecision canonical ID.");
  }
  validateSha256(binding.decision_fingerprint, "$.source_decision.decision_fingerprint", "source_decision_fingerprint_malformed", accumulator);
}

function validateCandidateBinding(
  value: unknown,
  accumulator: ValidationAccumulator,
) {
  const binding = recordAt(value, "$.source_candidate", accumulator);
  if (!binding) return;
  rejectUnknownNestedKeys(binding, allowedCandidateBindingKeys, "$.source_candidate", accumulator);
  requireString(binding, "candidate_id", "$.source_candidate", accumulator);
  validateSha256(binding.candidate_fingerprint, "$.source_candidate.candidate_fingerprint", "source_candidate_fingerprint_malformed", accumulator);
}

function validateIntentBinding(
  value: unknown,
  accumulator: ValidationAccumulator,
): string[] {
  const binding = recordAt(value, "$.requested_transition_intent", accumulator);
  if (!binding) return [];
  rejectUnknownNestedKeys(binding, allowedIntentBindingKeys, "$.requested_transition_intent", accumulator);
  requireString(binding, "intent_id", "$.requested_transition_intent", accumulator);
  const kind = protocolStringValueV01(binding.transition_kind);
  if (!kind || !appliedTransitionKinds.has(kind)) {
    addError(accumulator, "transition_intent_kind_invalid", "$.requested_transition_intent.transition_kind", "Applied semantic receipts require apply, supersede, or retract intent; other is not sufficient.", true);
  }
  const refs = requireNonEmptyRefArray(binding.target_refs, "$.requested_transition_intent.target_refs", "transition_target_required", accumulator);
  return refs.map(canonicalExternalRef).filter((item): item is string => item !== null);
}

function validateAtomicity(
  value: unknown,
  accumulator: ValidationAccumulator,
) {
  const atomicity = recordAt(value, "$.atomicity", accumulator);
  if (!atomicity) return;
  rejectUnknownNestedKeys(atomicity, allowedAtomicityKeys, "$.atomicity", accumulator);
  if (
    atomicity.mode !== "all_or_nothing" ||
    atomicity.all_effects_applied !== true ||
    atomicity.partial_application !== false
  ) {
    addError(accumulator, "atomicity_invalid", "$.atomicity", "Applied multi-target effects must be all-or-nothing with no partial application.", true);
  }
}

function validateEffects(
  value: unknown,
  accumulator: ValidationAccumulator,
): string[] {
  const effects = arrayAt(value, "$.effects", accumulator);
  if (effects.length === 0) {
    addError(accumulator, "transition_effect_required", "$.effects", "At least one transition effect is required.");
  }
  if (effects.length > 64) {
    addError(accumulator, "effect_collection_bound_exceeded", "$.effects", "StateTransitionReceipt v0.1 supports at most 64 atomic effects.", true);
  }
  const targets: string[] = [];
  const seenTargets = new Set<string>();
  const seenEffectIds = new Set<string>();
  effects.forEach((item, index) => {
    const path = `$.effects[${index}]`;
    const effect = recordAt(item, path, accumulator);
    if (!effect) return;
    rejectUnknownNestedKeys(effect, allowedEffectKeys, path, accumulator);
    const effectId = requireString(effect, "effect_id", path, accumulator);
    if (effectId) {
      if (seenEffectIds.has(effectId)) {
        addError(accumulator, "duplicate_effect_id", `${path}.effect_id`, "Transition effect IDs must be unique.", true);
      }
      seenEffectIds.add(effectId);
      try {
        if (effectId !== deriveStateTransitionEffectIdV01(effect as unknown as StateTransitionReceiptEffectV01)) {
          addError(accumulator, "effect_identity_mismatch", `${path}.effect_id`, "Effect ID is inconsistent with normalized effect content.");
        }
      } catch {
        addError(accumulator, "effect_id_computation_failed", `${path}.effect_id`, "Malformed effect content could not be identified safely.");
      }
    }
    validateExternalRefStructureV01(effect.target_ref, `${path}.target_ref`, issueSink(accumulator));
    const target = canonicalExternalRef(effect.target_ref);
    if (target) {
      targets.push(target);
      if (seenTargets.has(target)) {
        addError(accumulator, "duplicate_effect_target", `${path}.target_ref`, "Each requested target may have exactly one effect.", true);
      }
      seenTargets.add(target);
    }
    const operation = protocolStringValueV01(effect.operation);
    if (!operation || !operations.has(operation)) {
      addError(accumulator, "effect_operation_invalid", `${path}.operation`, "Expected create, replace, supersede, or retract.");
    }
    const before = validateSnapshot(effect.before_state, `${path}.before_state`, accumulator);
    const after = validateSnapshot(effect.after_state, `${path}.after_state`, accumulator);
    validateOperationSnapshots(operation, before, after, path, accumulator);
    validateProofRef(effect.before_state_observation_ref, `${path}.before_state_observation_ref`, "before_state_observation", accumulator);
    validateProofRef(effect.after_application_observation_ref, `${path}.after_application_observation_ref`, "after_application_observation", accumulator);
    validateProofRef(effect.durable_record_ref, `${path}.durable_record_ref`, "durable_record", accumulator);
    requireNonEmptyRefArray(effect.source_refs, `${path}.source_refs`, "effect_source_ref_required", accumulator);
  });
  return targets;
}

function validateSnapshot(
  value: unknown,
  path: string,
  accumulator: ValidationAccumulator,
): ProtocolJsonRecordV01 | null {
  const snapshot = recordAt(value, path, accumulator);
  if (!snapshot) return null;
  rejectUnknownNestedKeys(snapshot, allowedSnapshotKeys, path, accumulator);
  if (snapshot.presence === "absent") {
    if (snapshot.state_ref !== null || snapshot.state_fingerprint !== null) {
      addError(accumulator, "absent_state_snapshot_invalid", path, "Absent state requires null state_ref and state_fingerprint.", true);
    }
  } else if (snapshot.presence === "present") {
    if (!isProtocolRecordV01(snapshot.state_ref) || !protocolStringValueV01(snapshot.state_fingerprint)) {
      addError(accumulator, "present_state_snapshot_invalid", path, "Present state requires a state_ref and state_fingerprint.");
    }
    validateExternalRefStructureV01(snapshot.state_ref, `${path}.state_ref`, issueSink(accumulator));
    validateSha256(snapshot.state_fingerprint, `${path}.state_fingerprint`, "state_fingerprint_invalid", accumulator);
  } else {
    addError(accumulator, "state_presence_invalid", `${path}.presence`, "State presence must be absent or present.");
  }
  return snapshot;
}

function validateOperationSnapshots(
  operation: string | null,
  before: ProtocolJsonRecordV01 | null,
  after: ProtocolJsonRecordV01 | null,
  path: string,
  accumulator: ValidationAccumulator,
) {
  if (!operation || !before || !after) return;
  const expected: Record<string, [string, string]> = {
    create: ["absent", "present"],
    replace: ["present", "present"],
    supersede: ["present", "present"],
    retract: ["present", "absent"],
  };
  const pair = expected[operation];
  if (!pair) return;
  if (before.presence !== pair[0] || after.presence !== pair[1]) {
    addError(accumulator, "operation_snapshot_mismatch", path, `${operation} requires ${pair[0]} before-state and ${pair[1]} after-state.`, true);
  }
  if (
    (operation === "replace" || operation === "supersede") &&
    canonicalizeProtocolValueV01(before) === canonicalizeProtocolValueV01(after)
  ) {
    addError(accumulator, "state_change_required", path, `${operation} requires distinct before and after state snapshots.`, true);
  }
}

function validateGateBinding(
  value: unknown,
  appliedAt: number | null,
  recordedAt: number | null,
  accumulator: ValidationAccumulator,
) {
  const gate = recordAt(value, "$.semantic_commit_gate", accumulator);
  if (!gate) return;
  rejectUnknownNestedKeys(gate, allowedGateKeys, "$.semantic_commit_gate", accumulator);
  if (gate.status !== "authorized") {
    addError(accumulator, "gate_status_not_authorized", "$.semantic_commit_gate.status", "A denied or unknown gate cannot support an applied receipt.", true);
  }
  validateProofRef(gate.evaluation_ref, "$.semantic_commit_gate.evaluation_ref", "semantic_commit_gate_evaluation", accumulator);
  const evaluatedAt = requireTimestamp(gate.evaluated_at, "$.semantic_commit_gate.evaluated_at", accumulator);
  const expiresAt = requireTimestamp(gate.expires_at, "$.semantic_commit_gate.expires_at", accumulator);
  if (evaluatedAt !== null && expiresAt !== null && evaluatedAt >= expiresAt) {
    addError(accumulator, "gate_expiry_invalid", "$.semantic_commit_gate.expires_at", "Gate expiry must be later than evaluation.", true);
  }
  if (evaluatedAt !== null && appliedAt !== null && evaluatedAt > appliedAt) {
    addError(accumulator, "timestamp_order_invalid", "$.applied_at", "applied_at must not precede gate evaluation.", true);
  }
  if (expiresAt !== null && appliedAt !== null && appliedAt > expiresAt) {
    addError(accumulator, "semantic_commit_gate_expired", "$.semantic_commit_gate.expires_at", "An expired gate cannot support the applied receipt.", true);
  }
  if (evaluatedAt !== null && recordedAt !== null && evaluatedAt > recordedAt) {
    addError(accumulator, "recorded_before_gate_evaluation", "$.recorded_at", "recorded_at must not precede gate evaluation.", true);
  }
  const evaluationRef = isProtocolRecordV01(gate.evaluation_ref) ? gate.evaluation_ref : null;
  const refObservedAt = parseStrictIsoTimestampV01(evaluationRef?.observed_at);
  if (evaluatedAt !== null && refObservedAt !== null && evaluatedAt !== refObservedAt) {
    addError(accumulator, "gate_evaluation_time_mismatch", "$.semantic_commit_gate.evaluation_ref.observed_at", "Gate evaluation ref must preserve evaluated_at exactly.", true);
  }
}

function validateEffectTimes(
  value: unknown,
  appliedAt: number | null,
  recordedAt: number | null,
  accumulator: ValidationAccumulator,
) {
  if (!Array.isArray(value)) return;
  value.forEach((item, index) => {
    if (!isProtocolRecordV01(item)) return;
    const refs: Array<[unknown, string, "before" | "after"]> = [
      [item.before_state_observation_ref, `$.effects[${index}].before_state_observation_ref`, "before"],
      [item.after_application_observation_ref, `$.effects[${index}].after_application_observation_ref`, "after"],
      [item.durable_record_ref, `$.effects[${index}].durable_record_ref`, "after"],
    ];
    for (const [refValue, path, phase] of refs) {
      const ref = isProtocolRecordV01(refValue) ? refValue : null;
      const observedAt = parseStrictIsoTimestampV01(ref?.observed_at);
      if (observedAt === null) continue;
      if (phase === "before" && appliedAt !== null && observedAt > appliedAt) {
        addError(accumulator, "timestamp_order_invalid", `${path}.observed_at`, "Before-state observation must not occur after applied_at.", true);
      }
      if (phase === "after" && appliedAt !== null && observedAt < appliedAt) {
        addError(accumulator, "application_observation_before_applied", `${path}.observed_at`, "Application and durable-record observations must not precede applied_at.", true);
      }
      if (recordedAt !== null && observedAt > recordedAt) {
        addError(accumulator, "transition_observation_after_recorded", `${path}.observed_at`, "Transition observations must not occur after recorded_at.", true);
      }
    }
  });
}

function validateApplicationResultProofBindings(
  value: unknown,
  appliedAt: string | null,
  accumulator: ValidationAccumulator,
) {
  if (!Array.isArray(value) || !appliedAt) return;
  value.forEach((item, index) => {
    if (!isProtocolRecordV01(item) || !hasApplicationResultMaterial(item)) {
      return;
    }
    const path = `$.effects[${index}]`;
    try {
      const fingerprint = createStateTransitionApplicationResultFingerprintV01(
        item as unknown as StateTransitionReceiptEffectV01,
        appliedAt,
      );
      const afterRef = isProtocolRecordV01(
        item.after_application_observation_ref,
      )
        ? item.after_application_observation_ref
        : null;
      const durableRef = isProtocolRecordV01(item.durable_record_ref)
        ? item.durable_record_ref
        : null;
      if (
        afterRef &&
        protocolStringValueV01(afterRef.source_ref) !== fingerprint
      ) {
        addError(
          accumulator,
          "after_application_result_fingerprint_mismatch",
          `${path}.after_application_observation_ref.source_ref`,
          "After-application observation must bind the exact normalized effect result.",
          true,
        );
      }
      if (
        durableRef &&
        protocolStringValueV01(durableRef.source_ref) !== fingerprint
      ) {
        addError(
          accumulator,
          "durable_record_result_fingerprint_mismatch",
          `${path}.durable_record_ref.source_ref`,
          "Durable-record observation must bind the exact normalized effect result.",
          true,
        );
      }
    } catch {
      addError(
        accumulator,
        "application_result_fingerprint_computation_failed",
        path,
        "Malformed transition effect could not be bound to application-result proof.",
      );
    }
  });
}

function hasApplicationResultMaterial(
  effect: ProtocolJsonRecordV01,
): boolean {
  if (
    !isProtocolRecordV01(effect.target_ref) ||
    !protocolStringValueV01(effect.operation) ||
    !isProtocolRecordV01(effect.before_state) ||
    !isProtocolRecordV01(effect.after_state)
  ) {
    return false;
  }
  for (const snapshot of [effect.before_state, effect.after_state]) {
    if (snapshot.presence === "absent") {
      if (snapshot.state_ref !== null || snapshot.state_fingerprint !== null) {
        return false;
      }
    } else if (snapshot.presence === "present") {
      if (
        !isProtocolRecordV01(snapshot.state_ref) ||
        !/^sha256:[a-f0-9]{64}$/.test(
          protocolStringValueV01(snapshot.state_fingerprint) ?? "",
        )
      ) {
        return false;
      }
    } else {
      return false;
    }
  }
  return true;
}

function validateProofRef(
  value: unknown,
  path: string,
  kind: string,
  accumulator: ValidationAccumulator,
) {
  validateExternalRefStructureV01(value, path, issueSink(accumulator));
  if (!isProtocolRecordV01(value)) {
    addError(accumulator, `${kind}_ref_required`, path, "A proof-grade ExternalRef is required.");
    return;
  }
  const trust = protocolStringValueV01(value.trust_class);
  if (!trust || !observationTrustClasses.has(trust)) {
    const trustCode =
      kind === "durable_record"
        ? "durable_record_trust_insufficient"
        : kind === "semantic_commit_gate_evaluation"
          ? "semantic_commit_gate_trust_insufficient"
          : "observation_trust_insufficient";
    addError(accumulator, trustCode, `${path}.trust_class`, "Applied transition proof requires direct_local_observation or verified_external_observation.", true);
  }
  if (parseStrictIsoTimestampV01(value.observed_at) === null) {
    addError(accumulator, `${kind}_observed_at_required`, `${path}.observed_at`, "Applied transition proof refs require an observed_at timestamp.");
  }
}

function validateExactTargetSet(
  intentTargets: string[],
  effectTargets: string[],
  accumulator: ValidationAccumulator,
) {
  const intent = new Set(intentTargets);
  const effects = new Set(effectTargets);
  if (effectTargets.some((item) => !intent.has(item))) {
    addError(accumulator, "effect_target_outside_intent", "$.effects", "An effect target is outside the requested transition intent.", true);
  }
  if (
    intentTargets.length !== effectTargets.length ||
    intent.size !== effects.size ||
    [...intent].some((item) => !effects.has(item))
  ) {
    addError(accumulator, "effect_target_set_mismatch", "$.effects", "Effects must match the exact canonical requested target set.", true);
  }
}

function validateCompatibility(
  value: unknown,
  accumulator: ValidationAccumulator,
) {
  const compatibility = recordAt(value, "$.compatibility", accumulator);
  if (!compatibility) return;
  rejectUnknownNestedKeys(compatibility, allowedCompatibilityKeys, "$.compatibility", accumulator);
  stringArray(compatibility.source_contracts, "$.compatibility.source_contracts", accumulator);
  stringArray(compatibility.warnings, "$.compatibility.warnings", accumulator);
  validateRefArray(compatibility.external_refs, "$.compatibility.external_refs", accumulator);
  arrayAt(compatibility.unmapped_fields, "$.compatibility.unmapped_fields", accumulator).forEach((item, index) => {
    const path = `$.compatibility.unmapped_fields[${index}]`;
    const unmapped = recordAt(item, path, accumulator);
    if (!unmapped) return;
    rejectUnknownNestedKeys(unmapped, allowedUnmappedFieldKeys, path, accumulator);
    requireString(unmapped, "source_field", path, accumulator);
    requireString(unmapped, "reason", path, accumulator);
  });
}

function validateMaterialBoundary(
  value: unknown,
  accumulator: ValidationAccumulator,
) {
  const boundary = recordAt(value, "$.material_boundary", accumulator);
  if (!boundary) return;
  rejectUnknownNestedKeys(boundary, allowedMaterialBoundaryKeys, "$.material_boundary", accumulator);
  const expected = createStateTransitionReceiptMaterialBoundaryV01();
  for (const [key, expectedValue] of Object.entries(expected)) {
    if (boundary[key] !== expectedValue) {
      addError(accumulator, "material_boundary_violation", `$.material_boundary.${key}`, `${key} must remain ${JSON.stringify(expectedValue)}.`, true);
    }
  }
}

function validateAuthority(
  value: unknown,
  accumulator: ValidationAccumulator,
) {
  const authority = recordAt(value, "$.authority_summary", accumulator);
  if (!authority) return;
  rejectUnknownNestedKeys(authority, allowedAuthoritySummaryKeys, "$.authority_summary", accumulator);
  stringArray(authority.notes, "$.authority_summary.notes", accumulator);
  if (authority.represents_applied_durable_semantic_transition !== true) {
    addError(accumulator, "represented_fact_missing", "$.authority_summary.represents_applied_durable_semantic_transition", "The receipt must state the applied durable semantic transition fact it represents.", true);
  }
  const expected = createStateTransitionReceiptAuthoritySummaryV01(
    Array.isArray(authority.notes)
      ? authority.notes.filter((item): item is string => typeof item === "string")
      : [],
  );
  for (const key of Object.keys(expected) as Array<keyof StateTransitionReceiptAuthoritySummaryV01>) {
    if (key === "notes" || key === "represents_applied_durable_semantic_transition") continue;
    if (authority[key] !== false) {
      addError(accumulator, "authority_boundary_violation", `$.authority_summary.${key}`, `${key} must remain false.`, true);
    }
  }
}

function validateIntegrity(
  input: ProtocolJsonRecordV01,
  accumulator: ValidationAccumulator,
) {
  const integrity = recordAt(input.integrity, "$.integrity", accumulator);
  if (!integrity) return;
  rejectUnknownNestedKeys(integrity, allowedIntegrityKeys, "$.integrity", accumulator);
  if (
    integrity.algorithm !== "sha256" ||
    integrity.canonicalization !== STATE_TRANSITION_RECEIPT_CANONICALIZATION_V01 ||
    integrity.fingerprint_scope !== "transition_receipt_without_integrity_fingerprint"
  ) {
    addError(accumulator, "integrity_metadata_invalid", "$.integrity", "StateTransitionReceipt integrity metadata is invalid.");
  }
  try {
    const receipt = input as unknown as StateTransitionReceiptV01;
    if (protocolStringValueV01(input.idempotency_key) !== createStateTransitionReceiptIdempotencyKeyV01(receipt)) {
      addError(accumulator, "idempotency_key_mismatch", "$.idempotency_key", "Idempotency key does not match the authorized transition intent identity.");
    }
    if (protocolStringValueV01(input.transition_receipt_id) !== deriveStateTransitionReceiptIdV01(receipt)) {
      addError(accumulator, "transition_receipt_identity_mismatch", "$.transition_receipt_id", "Transition receipt ID is inconsistent with normalized receipt content.");
    }
    if (protocolStringValueV01(integrity.fingerprint) !== createStateTransitionReceiptFingerprintV01(receipt)) {
      addError(accumulator, "fingerprint_mismatch", "$.integrity.fingerprint", "StateTransitionReceipt fingerprint does not match normalized content.");
    }
  } catch {
    addError(accumulator, "integrity_computation_failed", "$.integrity", "Malformed StateTransitionReceipt could not be fingerprinted safely.");
  }
}

function validateAllExternalRefs(
  input: unknown,
  accumulator: ValidationAccumulator,
) {
  walk(input, "$", (value, path) => {
    if (isProtocolRecordV01(value) && value.ref_version !== undefined) {
      validateExternalRefStructureV01(value, path, issueSink(accumulator));
    }
  });
}

function validateRefArray(
  value: unknown,
  path: string,
  accumulator: ValidationAccumulator,
) {
  arrayAt(value, path, accumulator).forEach((item, index) =>
    validateExternalRefStructureV01(item, `${path}[${index}]`, issueSink(accumulator)),
  );
}

function requireNonEmptyRefArray(
  value: unknown,
  path: string,
  code: string,
  accumulator: ValidationAccumulator,
): unknown[] {
  const refs = arrayAt(value, path, accumulator);
  refs.forEach((item, index) =>
    validateExternalRefStructureV01(item, `${path}[${index}]`, issueSink(accumulator)),
  );
  if (refs.length === 0) {
    addError(accumulator, code, path, "Expected at least one ExternalRef.");
  }
  return refs;
}

function canonicalExternalRef(value: unknown): string | null {
  if (!isProtocolRecordV01(value) || value.ref_version !== "external_ref.v0.1") return null;
  try {
    return canonicalizeProtocolValueV01(
      normalizeExternalRefPrimitiveV01(value as unknown as ExternalRefV01),
    );
  } catch {
    return null;
  }
}

function validateBounds(input: unknown, accumulator: ValidationAccumulator) {
  for (const violation of collectBoundViolations(input)) {
    addError(accumulator, violation.code, violation.path, violation.message, true);
  }
}

function assertStateTransitionReceiptBuildBoundsV01(
  receipt: StateTransitionReceiptV01,
) {
  const [violation] = collectBoundViolations(receipt);
  if (violation) throw new RangeError(`${violation.path}: ${violation.message}`);
}

function collectBoundViolations(value: unknown) {
  const boundary = createStateTransitionReceiptMaterialBoundaryV01();
  const violations: Array<{ code: string; path: string; message: string }> = [];
  walk(value, "$", (candidate, path) => {
    if (Array.isArray(candidate)) {
      const key = lastPathKey(path);
      const limit = /(?:_refs|_ids)$/.test(key)
        ? boundary.max_refs_per_collection
        : boundary.max_collection_items;
      if (candidate.length > limit) {
        violations.push({ code: "collection_bound_exceeded", path, message: `Collection exceeds the v0.1 bound (${candidate.length} > ${limit}).` });
      }
    } else if (
      typeof candidate === "string" &&
      boundedTextFieldNames.has(lastPathKey(path)) &&
      candidate.length > boundary.max_summary_characters
    ) {
      violations.push({ code: "summary_bound_exceeded", path, message: `Bounded text exceeds ${boundary.max_summary_characters} characters.` });
    }
  });
  return violations;
}

function scanAbsoluteLocalPaths(
  value: unknown,
  path: string,
  accumulator: ValidationAccumulator,
) {
  walk(value, path, (candidate, candidatePath) => {
    if (typeof candidate === "string" && /^(?:file:\/\/|\/(?!\/)|[A-Za-z]:[\\/])/.test(candidate)) {
      addError(accumulator, "absolute_local_path_forbidden", candidatePath, "Absolute local paths are forbidden; use a bounded ExternalRef.", true);
    }
  });
}

function validateSha256(
  value: unknown,
  path: string,
  code: string,
  accumulator: ValidationAccumulator,
) {
  const normalized = protocolStringValueV01(value);
  if (!normalized || !/^sha256:[a-f0-9]{64}$/.test(normalized)) {
    addError(accumulator, code, path, "Expected a SHA-256 fingerprint.");
  }
}

function requireString(
  record: ProtocolJsonRecordV01,
  field: string,
  path: string,
  accumulator: ValidationAccumulator,
): string | null {
  const value = protocolStringValueV01(record[field]);
  if (!value) addError(accumulator, `${field}_missing`, `${path}.${field}`, `${field} must be a non-empty string.`);
  return value;
}

function requireTimestamp(
  value: unknown,
  path: string,
  accumulator: ValidationAccumulator,
): number | null {
  const parsed = parseStrictIsoTimestampV01(value);
  if (parsed === null) addError(accumulator, "timestamp_invalid", path, "Expected a valid ISO-8601 timestamp with timezone.");
  return parsed;
}

function stringArray(
  value: unknown,
  path: string,
  accumulator: ValidationAccumulator,
): string[] {
  const values: string[] = [];
  arrayAt(value, path, accumulator).forEach((item, index) => {
    const normalized = protocolStringValueV01(item);
    if (normalized) values.push(normalized);
    else addError(accumulator, "string_array_malformed", `${path}[${index}]`, "Expected a non-empty string.");
  });
  return values;
}

function walk(
  value: unknown,
  path: string,
  visit: (value: unknown, path: string) => void,
) {
  visit(value, path);
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, `${path}[${index}]`, visit));
  } else if (isProtocolRecordV01(value)) {
    for (const [key, child] of Object.entries(value)) {
      walk(child, `${path}.${key}`, visit);
    }
  }
}

function recordAt(
  value: unknown,
  path: string,
  accumulator: ValidationAccumulator,
): ProtocolJsonRecordV01 | null {
  if (isProtocolRecordV01(value)) return value;
  addError(accumulator, "object_malformed", path, "Expected an object.");
  return null;
}

function arrayAt(
  value: unknown,
  path: string,
  accumulator: ValidationAccumulator,
): unknown[] {
  if (Array.isArray(value)) return value;
  addError(accumulator, "array_malformed", path, "Expected an array.");
  return [];
}

function rejectUnknownNestedKeys(
  record: ProtocolJsonRecordV01,
  allowed: ReadonlySet<string>,
  path: string,
  accumulator: ValidationAccumulator,
) {
  rejectUnknownProtocolKeysV01(record, allowed, path, issueSink(accumulator), "unknown_nested_field", true);
}

function lastPathKey(path: string) {
  return path.replace(/\[\d+\]$/, "").split(".").at(-1) ?? "";
}

function createAccumulator(): ValidationAccumulator {
  return { errors: [], warnings: [], blocked: false };
}

function issueSink(accumulator: ValidationAccumulator) {
  return {
    error(code: string, path: string | null, message: string, blocked = false) {
      addError(accumulator, code, path, message, blocked);
    },
    warning(code: string, path: string | null, message: string) {
      accumulator.warnings.push({ severity: "warning", code, path, message });
    },
  };
}

function addError(
  accumulator: ValidationAccumulator,
  code: string,
  path: string | null,
  message: string,
  blocked = false,
) {
  accumulator.errors.push({ severity: "error", code, path, message });
  if (blocked) accumulator.blocked = true;
}

function buildValidationResult(
  accumulator: ValidationAccumulator,
  version: typeof STATE_TRANSITION_RECEIPT_VERSION_V01 | null,
): StateTransitionReceiptValidationResultV01 {
  return {
    status:
      accumulator.errors.length === 0
        ? "valid"
        : accumulator.blocked
          ? "blocked"
          : "invalid",
    normalized_protocol_version: version,
    errors: accumulator.errors,
    warnings: accumulator.warnings,
  };
}
