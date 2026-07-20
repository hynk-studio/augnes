import {
  canonicalizeProtocolValueV01,
  compareExternalRefsV01,
  compareProtocolCanonicalV01,
  createProtocolSha256V01,
  isProtocolRecordV01,
  normalizeExternalRefPrimitiveV01,
  normalizeProtocolNullableTextV01,
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
import { validateEpisodeDeltaProposalV01 } from "@/lib/vnext/episode-delta-proposal";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import {
  EPISODE_DELTA_PROPOSAL_VERSION_V01,
  type EpisodeDeltaProposalDeltaCandidateV01,
  type EpisodeDeltaProposalV01,
} from "@/types/vnext/episode-delta-proposal";
import {
  REVIEW_DECISION_CANONICALIZATION_V01,
  REVIEW_DECISION_REQUESTED_TRANSITION_KINDS_V01,
  REVIEW_DECISION_VALUES_V01,
  REVIEW_DECISION_VERSION_V01,
  type ReviewDecisionAuthoritySummaryV01,
  type ReviewDecisionCandidateBindingV01,
  type ReviewDecisionCompatibilityMetadataV01,
  type ReviewDecisionLineageV01,
  type ReviewDecisionMaterialBoundaryV01,
  type ReviewDecisionPriorDecisionBindingV01,
  type ReviewDecisionRequestedTransitionIntentV01,
  type ReviewDecisionRevisitV01,
  type ReviewDecisionV01,
  type ReviewDecisionValidationIssueV01,
  type ReviewDecisionValidationResultV01,
} from "@/types/vnext/review-decision";

const PENDING_DECISION_ID = "review-decision:pending";
const PENDING_FINGERPRINT = "sha256:pending";

const decisionValues = new Set<string>(REVIEW_DECISION_VALUES_V01);
const transitionKinds = new Set<string>(
  REVIEW_DECISION_REQUESTED_TRANSITION_KINDS_V01,
);

const allowedRootKeys = new Set([
  "decision_version",
  "decision_id",
  "workspace_id",
  "project_id",
  "source_proposal",
  "target_class",
  "candidate",
  "decision",
  "actor_ref",
  "authorization_basis_refs",
  "decision_basis_material_ids",
  "decision_basis_refs",
  "rationale_summary",
  "decided_at",
  "revisit",
  "requested_transition_intent",
  "lineage",
  "compatibility",
  "material_boundary",
  "authority_summary",
  "integrity",
]);
const allowedSourceProposalKeys = new Set([
  "proposal_version",
  "proposal_id",
  "proposal_fingerprint",
]);
const allowedCandidateBindingKeys = new Set([
  "candidate_id",
  "candidate_fingerprint",
]);
const allowedPriorDecisionBindingKeys = new Set([
  "decision_id",
  "decision_fingerprint",
]);
const allowedRevisitKeys = new Set([
  "revisit_at",
  "expires_at",
  "condition_summary",
]);
const allowedRequestedTransitionKeys = new Set([
  "intent_id",
  "transition_kind",
  "bounded_summary",
  "target_refs",
  "intent_only",
  "applied",
  "state_transition_receipt_ref",
]);
const allowedLineageKeys = new Set([
  "prior_decisions",
  "superseding_candidate",
  "retracted_decision",
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
  "decision_is_proposal",
  "decision_is_canonical_project_state",
  "decision_is_state_transition_receipt",
  "decision_is_accepted_evidence",
  "decision_is_proof",
  "decision_is_work_closure",
  "contract_validation_verifies_actor_authorization",
  "construction_proves_real_user_decision",
  "requested_transition_is_applied",
  "performs_durable_transition",
  "creates_evidence",
  "applies_perspective",
  "promotes_reviewed_memory",
  "closes_work",
  "selects_next_context_automatically",
  "authorizes_execution",
  "authorizes_scheduling",
  "authorizes_retry",
  "authorizes_replay",
  "authorizes_deployment",
  "authorizes_provider_calls",
  "authorizes_github_mutation",
  "authorizes_merge",
  "authorizes_publication",
  "authorizes_external_actuation",
  "authorizes_external_side_effects",
  "writes_database",
  "notes",
]);
const allowedIntegrityKeys = new Set([
  "algorithm",
  "canonicalization",
  "fingerprint_scope",
  "fingerprint",
]);

const boundedTextFieldNames = new Set([
  "bounded_summary",
  "rationale_summary",
  "condition_summary",
  "reason",
  "warnings",
  "notes",
]);

export const REVIEW_DECISION_REQUIRED_CORE_FIELDS_V01 = [
  "decision_version",
  "decision_id",
  "workspace_id",
  "project_id",
  "source_proposal",
  "target_class",
  "candidate",
  "decision",
  "actor_ref",
  "authorization_basis_refs",
  "decision_basis_material_ids",
  "decision_basis_refs",
  "rationale_summary",
  "decided_at",
  "revisit",
  "requested_transition_intent",
  "lineage",
  "compatibility",
  "material_boundary",
  "authority_summary",
  "integrity",
] as const;

export type ReviewDecisionBuilderInputV01 = Omit<
  ReviewDecisionV01,
  | "decision_version"
  | "decision_id"
  | "target_class"
  | "material_boundary"
  | "authority_summary"
  | "integrity"
> & {
  authority_notes?: string[];
};

type ValidationAccumulator = {
  errors: ReviewDecisionValidationIssueV01[];
  warnings: ReviewDecisionValidationIssueV01[];
  blocked: boolean;
};

export function buildReviewDecisionV01(
  input: ReviewDecisionBuilderInputV01,
): ReviewDecisionV01 {
  const decision: ReviewDecisionV01 = {
    decision_version: REVIEW_DECISION_VERSION_V01,
    decision_id: PENDING_DECISION_ID,
    workspace_id: normalizeProtocolTextV01(input.workspace_id),
    project_id: normalizeProtocolTextV01(input.project_id),
    source_proposal: {
      proposal_version: EPISODE_DELTA_PROPOSAL_VERSION_V01,
      proposal_id: normalizeProtocolTextV01(input.source_proposal.proposal_id),
      proposal_fingerprint: normalizeProtocolTextV01(
        input.source_proposal.proposal_fingerprint,
      ),
    },
    target_class: "episode_delta_candidate",
    candidate: normalizeCandidateBinding(input.candidate),
    decision: input.decision,
    actor_ref: normalizeExternalRefPrimitiveV01(input.actor_ref),
    authorization_basis_refs: normalizeRefs(input.authorization_basis_refs),
    decision_basis_material_ids: uniqueProtocolStringsV01(
      input.decision_basis_material_ids,
    ),
    decision_basis_refs: normalizeRefs(input.decision_basis_refs),
    rationale_summary: normalizeProtocolTextV01(input.rationale_summary),
    decided_at: normalizeProtocolTextV01(input.decided_at),
    revisit: normalizeRevisit(input.revisit),
    requested_transition_intent: normalizeRequestedTransition(
      input.requested_transition_intent,
    ),
    lineage: normalizeLineage(input.lineage),
    compatibility: normalizeCompatibility(input.compatibility),
    material_boundary: createReviewDecisionMaterialBoundaryV01(),
    authority_summary: createReviewDecisionAuthoritySummaryV01(
      input.authority_notes,
    ),
    integrity: {
      algorithm: "sha256",
      canonicalization: REVIEW_DECISION_CANONICALIZATION_V01,
      fingerprint_scope: "decision_without_integrity_fingerprint",
      fingerprint: PENDING_FINGERPRINT,
    },
  };
  assertReviewDecisionBuildBounds(decision);
  decision.decision_id = deriveReviewDecisionIdV01(decision);
  decision.integrity.fingerprint = createReviewDecisionFingerprintV01(decision);
  return decision;
}

export function createReviewDecisionAuthoritySummaryV01(
  notes: string[] = [],
): ReviewDecisionAuthoritySummaryV01 {
  return {
    decision_is_proposal: false,
    decision_is_canonical_project_state: false,
    decision_is_state_transition_receipt: false,
    decision_is_accepted_evidence: false,
    decision_is_proof: false,
    decision_is_work_closure: false,
    contract_validation_verifies_actor_authorization: false,
    construction_proves_real_user_decision: false,
    requested_transition_is_applied: false,
    performs_durable_transition: false,
    creates_evidence: false,
    applies_perspective: false,
    promotes_reviewed_memory: false,
    closes_work: false,
    selects_next_context_automatically: false,
    authorizes_execution: false,
    authorizes_scheduling: false,
    authorizes_retry: false,
    authorizes_replay: false,
    authorizes_deployment: false,
    authorizes_provider_calls: false,
    authorizes_github_mutation: false,
    authorizes_merge: false,
    authorizes_publication: false,
    authorizes_external_actuation: false,
    authorizes_external_side_effects: false,
    writes_database: false,
    notes: uniqueProtocolStringsV01([
      "ReviewDecision is a decision contract, not a proposal or durable transition.",
      "Contract validation does not verify actor authorization or prove a real user decision occurred.",
      "Requested transition material remains unapplied intent until a separate authorized transition path exists.",
      ...notes,
    ]),
  };
}

export function createReviewDecisionMaterialBoundaryV01(): ReviewDecisionMaterialBoundaryV01 {
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

export function canonicalizeReviewDecisionValueV01(value: unknown): string {
  return canonicalizeProtocolValueV01(value);
}

export function createEpisodeDeltaCandidateFingerprintV01(
  candidate: EpisodeDeltaProposalDeltaCandidateV01,
): string {
  return createProtocolSha256V01(canonicalizeProtocolValueV01(candidate));
}

export function deriveReviewDecisionIdV01(decision: ReviewDecisionV01): string {
  const identityHash = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      ...withoutFingerprint(decision),
      decision_id: PENDING_DECISION_ID,
    }),
  );
  return `review-decision:${identityHash.slice("sha256:".length, 31)}`;
}

export function createReviewDecisionFingerprintV01(
  decision: ReviewDecisionV01,
): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01(withoutFingerprint(decision)),
  );
}

export function validateReviewDecisionV01(
  input: unknown,
): ReviewDecisionValidationResultV01 {
  const accumulator = createAccumulator();
  const sink = issueSink(accumulator);
  scanForbiddenProtocolMaterialV01(input, "$", sink, {
    secret_material_message:
      "Secret-shaped material is forbidden in ReviewDecision.",
    provider_specific_field_message:
      "Provider-native identifiers must remain ExternalRef values in ReviewDecision.",
    allowed_false_invariant_fields: new Set([
      "applied",
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
      "decision_not_object",
      "$",
      "ReviewDecision must be an object.",
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
  const version = protocolStringValueV01(input.decision_version);
  if (version !== REVIEW_DECISION_VERSION_V01) {
    addError(
      accumulator,
      "unsupported_protocol_version",
      "$.decision_version",
      `Unsupported ReviewDecision protocol version: ${version ?? "missing"}.`,
      true,
    );
  }
  for (const field of REVIEW_DECISION_REQUIRED_CORE_FIELDS_V01) {
    if (input[field] === undefined) {
      addError(
        accumulator,
        `${field}_missing`,
        `$.${field}`,
        `${field} is required by ReviewDecision v0.1.`,
      );
    }
  }

  requireString(input, "decision_id", "$", accumulator);
  requireString(input, "workspace_id", "$", accumulator);
  requireString(input, "project_id", "$", accumulator);
  if (input.target_class !== "episode_delta_candidate") {
    addError(
      accumulator,
      "target_class_invalid",
      "$.target_class",
      "ReviewDecision v0.1 targets one EpisodeDeltaProposal candidate.",
    );
  }
  validateSourceProposal(input.source_proposal, accumulator);
  validateCandidateBinding(input.candidate, "$.candidate", accumulator);
  const decisionValue = protocolStringValueV01(input.decision);
  if (!decisionValue || !decisionValues.has(decisionValue)) {
    addError(
      accumulator,
      "decision_value_invalid",
      "$.decision",
      "Decision must be accept, reject, defer, supersede, or retract.",
    );
  }
  validateAllExternalRefs(input, accumulator);
  validateExternalRefStructureV01(input.actor_ref, "$.actor_ref", sink);
  requireNonEmptyRefArray(
    input.authorization_basis_refs,
    "$.authorization_basis_refs",
    "authorization_basis_required",
    accumulator,
  );
  requireNonEmptyStringArray(
    input.decision_basis_material_ids,
    "$.decision_basis_material_ids",
    "decision_basis_material_required",
    accumulator,
  );
  requireNonEmptyRefArray(
    input.decision_basis_refs,
    "$.decision_basis_refs",
    "decision_basis_ref_required",
    accumulator,
  );
  requireString(input, "rationale_summary", "$", accumulator);
  const decidedAt = requireTimestamp(
    input.decided_at,
    "$.decided_at",
    accumulator,
  );
  validateRevisit(input.revisit, decidedAt, decisionValue, accumulator);
  validateRequestedTransition(
    input.requested_transition_intent,
    decisionValue,
    accumulator,
  );
  validateLineage(input.lineage, decisionValue, accumulator);
  validateCompatibility(input.compatibility, accumulator);
  validateDuplicateExternalRefsPrimitiveV01(input, sink);
  validateMaterialBoundary(input.material_boundary, accumulator);
  validateAuthority(input.authority_summary, accumulator);
  validateBounds(input, accumulator);
  validateIntegrity(input, accumulator);

  return buildValidationResult(
    accumulator,
    version === REVIEW_DECISION_VERSION_V01
      ? REVIEW_DECISION_VERSION_V01
      : null,
  );
}

export function validateReviewDecisionAgainstEpisodeDeltaProposalV01(
  decisionInput: unknown,
  proposalInput: unknown,
): ReviewDecisionValidationResultV01 {
  const decisionValidation = validateReviewDecisionV01(decisionInput);
  const accumulator: ValidationAccumulator = {
    errors: [...decisionValidation.errors],
    warnings: [...decisionValidation.warnings],
    blocked: decisionValidation.status === "blocked",
  };
  if (!isProtocolRecordV01(decisionInput)) {
    return buildValidationResult(accumulator, null);
  }
  const proposalValidation = validateEpisodeDeltaProposalV01(proposalInput);
  if (proposalValidation.status !== "valid") {
    addError(
      accumulator,
      "source_proposal_invalid",
      "$.source_proposal",
      "Relation validation requires a valid EpisodeDeltaProposal v0.1 payload.",
      proposalValidation.status === "blocked",
    );
    return buildValidationResult(
      accumulator,
      decisionValidation.normalized_protocol_version,
    );
  }
  const proposal = proposalInput as EpisodeDeltaProposalV01;
  const sourceBinding = isProtocolRecordV01(decisionInput.source_proposal)
    ? decisionInput.source_proposal
    : null;
  const candidateBinding = isProtocolRecordV01(decisionInput.candidate)
    ? decisionInput.candidate
    : null;
  if (
    protocolStringValueV01(decisionInput.workspace_id) !== proposal.workspace_id
  ) {
    addError(
      accumulator,
      "workspace_mismatch",
      "$.workspace_id",
      "ReviewDecision workspace_id must match the source proposal.",
      true,
    );
  }
  if (
    protocolStringValueV01(decisionInput.project_id) !== proposal.project_id
  ) {
    addError(
      accumulator,
      "project_mismatch",
      "$.project_id",
      "ReviewDecision project_id must match the source proposal.",
      true,
    );
  }
  if (
    protocolStringValueV01(sourceBinding?.proposal_id) !== proposal.proposal_id
  ) {
    addError(
      accumulator,
      "proposal_id_mismatch",
      "$.source_proposal.proposal_id",
      "ReviewDecision must bind the exact source proposal ID.",
      true,
    );
  }
  if (
    protocolStringValueV01(sourceBinding?.proposal_fingerprint) !==
    proposal.integrity.fingerprint
  ) {
    addError(
      accumulator,
      "proposal_fingerprint_mismatch",
      "$.source_proposal.proposal_fingerprint",
      "ReviewDecision must bind the exact source proposal fingerprint.",
      true,
    );
  }

  const candidateId = protocolStringValueV01(candidateBinding?.candidate_id);
  const candidate = proposal.proposed_deltas.find(
    (item) => item.candidate_id === candidateId,
  );
  if (!candidate) {
    addError(
      accumulator,
      "candidate_missing_from_proposal",
      "$.candidate.candidate_id",
      "The bound candidate is not present in the source proposal.",
      true,
    );
  } else if (
    protocolStringValueV01(candidateBinding?.candidate_fingerprint) !==
    createEpisodeDeltaCandidateFingerprintV01(candidate)
  ) {
    addError(
      accumulator,
      "candidate_fingerprint_mismatch",
      "$.candidate.candidate_fingerprint",
      "The candidate fingerprint does not match the source proposal candidate.",
      true,
    );
  }

  const materialIds = new Set([
    ...proposal.observations.map((item) => item.material_id),
    ...proposal.attestations.map((item) => item.material_id),
    ...proposal.inferences.map((item) => item.material_id),
  ]);
  for (const [index, materialId] of stringValues(
    decisionInput.decision_basis_material_ids,
  ).entries()) {
    if (!materialIds.has(materialId)) {
      addError(
        accumulator,
        "basis_material_outside_proposal",
        `$.decision_basis_material_ids[${index}]`,
        "Decision basis material must be present in the source proposal.",
        true,
      );
    }
  }

  const proposalRefIdentities = collectExternalRefIdentities(proposal);
  const proposalCanonicalRefs = collectCanonicalExternalRefs(proposal);
  for (const [index, ref] of arrayValues(
    decisionInput.decision_basis_refs,
  ).entries()) {
    const identity = refIdentity(ref);
    if (!identity || !proposalRefIdentities.has(identity)) {
      addError(
        accumulator,
        "basis_ref_outside_proposal",
        `$.decision_basis_refs[${index}]`,
        "Decision basis references must be present in the source proposal.",
        true,
      );
    } else {
      const canonicalRef = canonicalExternalRef(ref);
      if (!canonicalRef || !proposalCanonicalRefs.has(canonicalRef)) {
        addError(
          accumulator,
          "basis_ref_provenance_mismatch",
          `$.decision_basis_refs[${index}]`,
          "Decision basis references must preserve the exact normalized source-proposal ExternalRef provenance.",
          true,
        );
      }
    }
  }

  const lineage = isProtocolRecordV01(decisionInput.lineage)
    ? decisionInput.lineage
    : null;
  if (isProtocolRecordV01(lineage?.superseding_candidate)) {
    validateBoundCandidateAgainstProposal(
      lineage.superseding_candidate,
      proposal,
      "$.lineage.superseding_candidate",
      accumulator,
    );
    if (
      protocolStringValueV01(lineage.superseding_candidate.candidate_id) ===
        candidateId &&
      !proposal.project_verify_lifecycle
    ) {
      addError(
        accumulator,
        "superseding_candidate_matches_target",
        "$.lineage.superseding_candidate.candidate_id",
        "A superseding candidate must differ from the decision target candidate.",
      );
    }
  }

  const requestedTransition = isProtocolRecordV01(
    decisionInput.requested_transition_intent,
  )
    ? decisionInput.requested_transition_intent
    : null;
  const decisionValue = protocolStringValueV01(decisionInput.decision);
  const supersedingCandidateId = isProtocolRecordV01(
    lineage?.superseding_candidate,
  )
    ? protocolStringValueV01(lineage.superseding_candidate.candidate_id)
    : null;
  const transitionTargetCandidate =
    decisionValue === "supersede"
      ? (proposal.proposed_deltas.find(
          (item) => item.candidate_id === supersedingCandidateId,
        ) ?? null)
      : decisionValue === "accept" || decisionValue === "retract"
        ? (candidate ?? null)
        : null;
  if (requestedTransition && transitionTargetCandidate) {
    const requestedTargets = canonicalExternalRefSet(
      arrayValues(requestedTransition.target_refs),
    );
    const candidateTargets = canonicalExternalRefSet(
      transitionTargetCandidate.target_refs,
    );
    if (!canonicalStringSetsEqual(requestedTargets, candidateTargets)) {
      addError(
        accumulator,
        "requested_transition_target_mismatch",
        "$.requested_transition_intent.target_refs",
        "Requested transition targets must exactly preserve the selected candidate target set and provenance.",
        true,
      );
    }
  }

  const decidedAt = parseStrictIsoTimestampV01(decisionInput.decided_at);
  const proposalCreatedAt = parseStrictIsoTimestampV01(proposal.created_at);
  if (
    decidedAt !== null &&
    proposalCreatedAt !== null &&
    decidedAt < proposalCreatedAt
  ) {
    addError(
      accumulator,
      "decision_precedes_proposal",
      "$.decided_at",
      "ReviewDecision cannot predate its source proposal.",
    );
  }

  validateProjectVerifyLifecycleDecisionRelationV01(
    decisionInput,
    proposal,
    accumulator,
  );

  return buildValidationResult(
    accumulator,
    decisionValidation.normalized_protocol_version,
  );
}

function validateProjectVerifyLifecycleDecisionRelationV01(
  decision: ProtocolJsonRecordV01,
  proposal: EpisodeDeltaProposalV01,
  accumulator: ValidationAccumulator,
): void {
  const profile = proposal.project_verify_lifecycle;
  if (!profile) return;
  const binding = profile.lifecycle_binding;
  const decisionValue = protocolStringValueV01(decision.decision);
  const applyingDecision =
    binding.selected_record_operation_intent === "supersede"
      ? "supersede"
      : binding.selected_record_operation_intent === "retract"
        ? "retract"
        : "accept";
  if (
    decisionValue !== "reject" &&
    decisionValue !== "defer" &&
    decisionValue !== applyingDecision
  ) {
    addError(
      accumulator,
      "project_verify_lifecycle_decision_operation_mismatch",
      "$.decision",
      "Applying lifecycle decisions must exactly match the selected SR-2 operation intent.",
      true,
    );
  }
  const candidate = isProtocolRecordV01(decision.candidate)
    ? decision.candidate
    : null;
  if (
    candidate?.candidate_id !== binding.decision_candidate.candidate_id ||
    candidate?.candidate_fingerprint !==
      binding.decision_candidate.candidate_fingerprint
  ) {
    addError(
      accumulator,
      "project_verify_lifecycle_decision_candidate_mismatch",
      "$.candidate",
      "Lifecycle ReviewDecision must bind the profile's exact selected candidate.",
      true,
    );
  }
  const intent = isProtocolRecordV01(decision.requested_transition_intent)
    ? decision.requested_transition_intent
    : null;
  const expectedTransitionKind =
    applyingDecision === "accept"
      ? "semantic_candidate_apply"
      : applyingDecision === "supersede"
        ? "semantic_candidate_supersede"
        : "semantic_candidate_retract";
  if (decisionValue === applyingDecision) {
    if (
      !intent ||
      intent.transition_kind !== expectedTransitionKind ||
      !Array.isArray(intent.target_refs) ||
      intent.target_refs.length !== 1 ||
      canonicalizeProtocolValueV01(intent.target_refs[0]) !==
        canonicalizeProtocolValueV01(binding.family_target_ref)
    ) {
      addError(
        accumulator,
        "project_verify_lifecycle_transition_intent_mismatch",
        "$.requested_transition_intent",
        "Lifecycle transition intent must preserve the exact decision-specific kind and family target.",
        true,
      );
    }
  }
  const lineage = isProtocolRecordV01(decision.lineage)
    ? decision.lineage
    : null;
  const priorDecisions = Array.isArray(lineage?.prior_decisions)
    ? lineage.prior_decisions
    : [];
  if (
    decisionValue === applyingDecision &&
    (binding.selected_record_revision === 1
      ? priorDecisions.length !== 0
      : priorDecisions.length !== 1)
  ) {
    addError(
      accumulator,
      "project_verify_lifecycle_prior_decision_lineage_mismatch",
      "$.lineage.prior_decisions",
      "Applying lifecycle revisions must carry exactly the prior applied decision lineage; initial creation carries none.",
      true,
    );
  }
  if (
    decisionValue === "supersede" &&
    (!isProtocolRecordV01(lineage?.superseding_candidate) ||
      lineage.superseding_candidate.candidate_id !==
        binding.selected_candidate.candidate_id ||
      lineage.superseding_candidate.candidate_fingerprint !==
        binding.selected_candidate.candidate_fingerprint)
  ) {
    addError(
      accumulator,
      "project_verify_lifecycle_superseding_candidate_mismatch",
      "$.lineage.superseding_candidate",
      "A lifecycle supersede decision must name the exact selected immutable SR-2 candidate.",
      true,
    );
  }
}

function withoutFingerprint(decision: ReviewDecisionV01) {
  const { fingerprint: _fingerprint, ...integrity } = decision.integrity;
  return { ...decision, integrity };
}

function normalizeRefs(refs: ExternalRefV01[]): ExternalRefV01[] {
  return uniqueProtocolValuesV01(
    refs.map(normalizeExternalRefPrimitiveV01),
  ).sort(compareExternalRefsV01);
}

function normalizeCandidateBinding(
  value: ReviewDecisionCandidateBindingV01,
): ReviewDecisionCandidateBindingV01 {
  return {
    candidate_id: normalizeProtocolTextV01(value.candidate_id),
    candidate_fingerprint: normalizeProtocolTextV01(
      value.candidate_fingerprint,
    ),
  };
}

function normalizePriorDecisionBinding(
  value: ReviewDecisionPriorDecisionBindingV01,
): ReviewDecisionPriorDecisionBindingV01 {
  return {
    decision_id: normalizeProtocolTextV01(value.decision_id),
    decision_fingerprint: normalizeProtocolTextV01(value.decision_fingerprint),
  };
}

function normalizeRevisit(
  value: ReviewDecisionRevisitV01 | null,
): ReviewDecisionRevisitV01 | null {
  return value
    ? {
        revisit_at: normalizeProtocolNullableTextV01(value.revisit_at),
        expires_at: normalizeProtocolNullableTextV01(value.expires_at),
        condition_summary: normalizeProtocolNullableTextV01(
          value.condition_summary,
        ),
      }
    : null;
}

function normalizeRequestedTransition(
  value: ReviewDecisionRequestedTransitionIntentV01 | null,
): ReviewDecisionRequestedTransitionIntentV01 | null {
  return value
    ? {
        intent_id: normalizeProtocolTextV01(value.intent_id),
        transition_kind: value.transition_kind,
        bounded_summary: normalizeProtocolTextV01(value.bounded_summary),
        target_refs: normalizeRefs(value.target_refs),
        intent_only: true,
        applied: false,
        state_transition_receipt_ref: null,
      }
    : null;
}

function normalizeLineage(
  value: ReviewDecisionLineageV01,
): ReviewDecisionLineageV01 {
  return {
    prior_decisions: uniqueProtocolValuesV01(
      value.prior_decisions.map(normalizePriorDecisionBinding),
    ).sort(compareProtocolCanonicalV01),
    superseding_candidate: value.superseding_candidate
      ? normalizeCandidateBinding(value.superseding_candidate)
      : null,
    retracted_decision: value.retracted_decision
      ? normalizePriorDecisionBinding(value.retracted_decision)
      : null,
  };
}

function normalizeCompatibility(
  value: ReviewDecisionCompatibilityMetadataV01,
): ReviewDecisionCompatibilityMetadataV01 {
  return {
    source_contracts: uniqueProtocolStringsV01(value.source_contracts),
    unmapped_fields: uniqueProtocolValuesV01(
      value.unmapped_fields.map((entry) => ({
        source_field: normalizeProtocolTextV01(entry.source_field),
        reason: normalizeProtocolTextV01(entry.reason),
      })),
    ).sort(compareProtocolCanonicalV01),
    warnings: uniqueProtocolStringsV01(value.warnings),
    external_refs: normalizeRefs(value.external_refs),
  };
}

function validateSourceProposal(
  value: unknown,
  accumulator: ValidationAccumulator,
) {
  const proposal = recordAt(value, "$.source_proposal", accumulator);
  if (!proposal) return;
  rejectUnknownNestedKeys(
    proposal,
    allowedSourceProposalKeys,
    "$.source_proposal",
    accumulator,
  );
  if (proposal.proposal_version !== EPISODE_DELTA_PROPOSAL_VERSION_V01) {
    addError(
      accumulator,
      "source_proposal_version_invalid",
      "$.source_proposal.proposal_version",
      "ReviewDecision v0.1 requires EpisodeDeltaProposal v0.1.",
    );
  }
  const proposalId = requireString(
    proposal,
    "proposal_id",
    "$.source_proposal",
    accumulator,
  );
  if (proposalId && !proposalId.startsWith("episode-delta-proposal:")) {
    addError(
      accumulator,
      "source_proposal_id_malformed",
      "$.source_proposal.proposal_id",
      "Expected an EpisodeDeltaProposal canonical ID.",
    );
  }
  validateSha256(
    proposal.proposal_fingerprint,
    "$.source_proposal.proposal_fingerprint",
    "source_proposal_fingerprint_malformed",
    accumulator,
  );
}

function validateCandidateBinding(
  value: unknown,
  path: string,
  accumulator: ValidationAccumulator,
) {
  const binding = recordAt(value, path, accumulator);
  if (!binding) return;
  rejectUnknownNestedKeys(
    binding,
    allowedCandidateBindingKeys,
    path,
    accumulator,
  );
  requireString(binding, "candidate_id", path, accumulator);
  validateSha256(
    binding.candidate_fingerprint,
    `${path}.candidate_fingerprint`,
    "candidate_fingerprint_malformed",
    accumulator,
  );
}

function validatePriorDecisionBinding(
  value: unknown,
  path: string,
  accumulator: ValidationAccumulator,
) {
  const binding = recordAt(value, path, accumulator);
  if (!binding) return;
  rejectUnknownNestedKeys(
    binding,
    allowedPriorDecisionBindingKeys,
    path,
    accumulator,
  );
  const decisionId = requireString(binding, "decision_id", path, accumulator);
  if (decisionId && !decisionId.startsWith("review-decision:")) {
    addError(
      accumulator,
      "prior_decision_id_malformed",
      `${path}.decision_id`,
      "Expected a ReviewDecision canonical ID.",
    );
  }
  validateSha256(
    binding.decision_fingerprint,
    `${path}.decision_fingerprint`,
    "prior_decision_fingerprint_malformed",
    accumulator,
  );
}

function validateRevisit(
  value: unknown,
  decidedAt: number | null,
  decisionValue: string | null,
  accumulator: ValidationAccumulator,
) {
  if (value === null) {
    if (decisionValue === "defer") {
      addError(
        accumulator,
        "defer_revisit_required",
        "$.revisit",
        "A defer decision requires explicit revisit semantics.",
      );
    }
    return;
  }
  const revisit = recordAt(value, "$.revisit", accumulator);
  if (!revisit) return;
  rejectUnknownNestedKeys(
    revisit,
    allowedRevisitKeys,
    "$.revisit",
    accumulator,
  );
  const revisitAt = optionalTimestamp(
    revisit.revisit_at,
    "$.revisit.revisit_at",
    accumulator,
  );
  const expiresAt = optionalTimestamp(
    revisit.expires_at,
    "$.revisit.expires_at",
    accumulator,
  );
  validateNullableString(
    revisit.condition_summary,
    "$.revisit.condition_summary",
    accumulator,
  );
  if (
    revisitAt === null &&
    expiresAt === null &&
    !protocolStringValueV01(revisit.condition_summary)
  ) {
    addError(
      accumulator,
      "revisit_semantics_empty",
      "$.revisit",
      "Revisit semantics require a time, expiry, or bounded condition.",
    );
  }
  for (const [time, path] of [
    [revisitAt, "$.revisit.revisit_at"],
    [expiresAt, "$.revisit.expires_at"],
  ] as const) {
    if (time !== null && decidedAt !== null && time <= decidedAt) {
      addError(
        accumulator,
        "revisit_time_not_after_decision",
        path,
        "Revisit and expiry times must be later than decided_at.",
      );
    }
  }
  if (revisitAt !== null && expiresAt !== null && revisitAt > expiresAt) {
    addError(
      accumulator,
      "revisit_after_expiry",
      "$.revisit.revisit_at",
      "revisit_at cannot be later than expires_at.",
    );
  }
}

function validateRequestedTransition(
  value: unknown,
  decisionValue: string | null,
  accumulator: ValidationAccumulator,
) {
  if (value === null) return;
  const transition = recordAt(
    value,
    "$.requested_transition_intent",
    accumulator,
  );
  if (!transition) return;
  rejectUnknownNestedKeys(
    transition,
    allowedRequestedTransitionKeys,
    "$.requested_transition_intent",
    accumulator,
  );
  requireString(
    transition,
    "intent_id",
    "$.requested_transition_intent",
    accumulator,
  );
  requireString(
    transition,
    "bounded_summary",
    "$.requested_transition_intent",
    accumulator,
  );
  const transitionKind = protocolStringValueV01(transition.transition_kind);
  if (!transitionKind || !transitionKinds.has(transitionKind)) {
    addError(
      accumulator,
      "requested_transition_kind_invalid",
      "$.requested_transition_intent.transition_kind",
      "Expected a supported requested transition intent kind.",
    );
  }
  requireNonEmptyRefArray(
    transition.target_refs,
    "$.requested_transition_intent.target_refs",
    "requested_transition_target_required",
    accumulator,
  );
  if (transition.intent_only !== true) {
    addError(
      accumulator,
      "requested_transition_not_intent_only",
      "$.requested_transition_intent.intent_only",
      "Requested transition must remain intent only.",
      true,
    );
  }
  if (transition.applied !== false) {
    addError(
      accumulator,
      "automatic_transition_claim",
      "$.requested_transition_intent.applied",
      "ReviewDecision cannot claim a requested transition was applied.",
      true,
    );
  }
  if (transition.state_transition_receipt_ref !== null) {
    addError(
      accumulator,
      "state_transition_receipt_claim_forbidden",
      "$.requested_transition_intent.state_transition_receipt_ref",
      "ReviewDecision cannot embed or claim a StateTransitionReceipt.",
      true,
    );
  }
  const expectedKind =
    decisionValue === "accept"
      ? "semantic_candidate_apply"
      : decisionValue === "supersede"
        ? "semantic_candidate_supersede"
        : decisionValue === "retract"
          ? "semantic_candidate_retract"
          : null;
  if (!expectedKind) {
    addError(
      accumulator,
      "requested_transition_not_allowed",
      "$.requested_transition_intent",
      "Reject and defer decisions cannot request transition intent.",
      true,
    );
  } else if (transitionKind !== expectedKind && transitionKind !== "other") {
    addError(
      accumulator,
      "requested_transition_decision_mismatch",
      "$.requested_transition_intent.transition_kind",
      "Requested transition kind does not match the decision.",
    );
  }
}

function validateLineage(
  value: unknown,
  decisionValue: string | null,
  accumulator: ValidationAccumulator,
) {
  const lineage = recordAt(value, "$.lineage", accumulator);
  if (!lineage) return;
  rejectUnknownNestedKeys(
    lineage,
    allowedLineageKeys,
    "$.lineage",
    accumulator,
  );
  const priorDecisions = arrayAt(
    lineage.prior_decisions,
    "$.lineage.prior_decisions",
    accumulator,
  );
  priorDecisions.forEach((item, index) =>
    validatePriorDecisionBinding(
      item,
      `$.lineage.prior_decisions[${index}]`,
      accumulator,
    ),
  );
  if (lineage.superseding_candidate !== null) {
    validateCandidateBinding(
      lineage.superseding_candidate,
      "$.lineage.superseding_candidate",
      accumulator,
    );
  }
  if (lineage.retracted_decision !== null) {
    validatePriorDecisionBinding(
      lineage.retracted_decision,
      "$.lineage.retracted_decision",
      accumulator,
    );
  }

  if (decisionValue === "supersede") {
    if (!isProtocolRecordV01(lineage.superseding_candidate)) {
      addError(
        accumulator,
        "superseding_candidate_required",
        "$.lineage.superseding_candidate",
        "A supersede decision requires an explicit superseding candidate binding.",
      );
    }
    if (lineage.retracted_decision !== null) {
      addError(
        accumulator,
        "supersede_retraction_lineage_conflict",
        "$.lineage.retracted_decision",
        "Supersede and retract lineage are distinct.",
      );
    }
  } else if (decisionValue === "retract") {
    if (!isProtocolRecordV01(lineage.retracted_decision)) {
      addError(
        accumulator,
        "retracted_decision_required",
        "$.lineage.retracted_decision",
        "A retract decision requires exact prior ReviewDecision lineage.",
      );
    } else {
      const retractedCanonical = canonicalizeProtocolValueV01(
        lineage.retracted_decision,
      );
      if (
        !priorDecisions.some(
          (item) => canonicalizeProtocolValueV01(item) === retractedCanonical,
        )
      ) {
        addError(
          accumulator,
          "retracted_decision_lineage_missing",
          "$.lineage.prior_decisions",
          "The retracted decision binding must be preserved in prior_decisions.",
        );
      }
    }
    if (lineage.superseding_candidate !== null) {
      addError(
        accumulator,
        "retract_supersession_lineage_conflict",
        "$.lineage.superseding_candidate",
        "Retract and supersede lineage are distinct.",
      );
    }
  } else {
    if (lineage.superseding_candidate !== null) {
      addError(
        accumulator,
        "unexpected_superseding_candidate",
        "$.lineage.superseding_candidate",
        "Only a supersede decision may bind a superseding candidate.",
      );
    }
    if (lineage.retracted_decision !== null) {
      addError(
        accumulator,
        "unexpected_retracted_decision",
        "$.lineage.retracted_decision",
        "Only a retract decision may bind a retracted decision.",
      );
    }
  }
}

function validateCompatibility(
  value: unknown,
  accumulator: ValidationAccumulator,
) {
  const compatibility = recordAt(value, "$.compatibility", accumulator);
  if (!compatibility) return;
  rejectUnknownNestedKeys(
    compatibility,
    allowedCompatibilityKeys,
    "$.compatibility",
    accumulator,
  );
  stringArray(
    compatibility.source_contracts,
    "$.compatibility.source_contracts",
    accumulator,
  );
  stringArray(compatibility.warnings, "$.compatibility.warnings", accumulator);
  validateRefArray(
    compatibility.external_refs,
    "$.compatibility.external_refs",
    accumulator,
  );
  arrayAt(
    compatibility.unmapped_fields,
    "$.compatibility.unmapped_fields",
    accumulator,
  ).forEach((item, index) => {
    const path = `$.compatibility.unmapped_fields[${index}]`;
    const unmapped = recordAt(item, path, accumulator);
    if (!unmapped) return;
    rejectUnknownNestedKeys(
      unmapped,
      allowedUnmappedFieldKeys,
      path,
      accumulator,
    );
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
  rejectUnknownNestedKeys(
    boundary,
    allowedMaterialBoundaryKeys,
    "$.material_boundary",
    accumulator,
  );
  const expected = createReviewDecisionMaterialBoundaryV01();
  for (const [key, expectedValue] of Object.entries(expected)) {
    if (boundary[key] !== expectedValue) {
      addError(
        accumulator,
        "material_boundary_violation",
        `$.material_boundary.${key}`,
        `${key} must remain ${JSON.stringify(expectedValue)}.`,
        true,
      );
    }
  }
}

function validateAuthority(value: unknown, accumulator: ValidationAccumulator) {
  const authority = recordAt(value, "$.authority_summary", accumulator);
  if (!authority) return;
  rejectUnknownNestedKeys(
    authority,
    allowedAuthoritySummaryKeys,
    "$.authority_summary",
    accumulator,
  );
  stringArray(authority.notes, "$.authority_summary.notes", accumulator);
  const expected = createReviewDecisionAuthoritySummaryV01(
    Array.isArray(authority.notes)
      ? authority.notes.filter(
          (item): item is string => typeof item === "string",
        )
      : [],
  );
  for (const key of Object.keys(expected) as Array<
    keyof ReviewDecisionAuthoritySummaryV01
  >) {
    if (key === "notes") continue;
    if (authority[key] !== false) {
      addError(
        accumulator,
        "authority_boundary_violation",
        `$.authority_summary.${key}`,
        `${key} must remain false.`,
        true,
      );
    }
  }
}

function validateIntegrity(
  input: ProtocolJsonRecordV01,
  accumulator: ValidationAccumulator,
) {
  const integrity = recordAt(input.integrity, "$.integrity", accumulator);
  if (!integrity) return;
  rejectUnknownNestedKeys(
    integrity,
    allowedIntegrityKeys,
    "$.integrity",
    accumulator,
  );
  if (
    integrity.algorithm !== "sha256" ||
    integrity.canonicalization !== REVIEW_DECISION_CANONICALIZATION_V01 ||
    integrity.fingerprint_scope !== "decision_without_integrity_fingerprint"
  ) {
    addError(
      accumulator,
      "integrity_metadata_invalid",
      "$.integrity",
      "ReviewDecision integrity metadata is invalid.",
    );
  }
  try {
    const decision = input as unknown as ReviewDecisionV01;
    if (
      protocolStringValueV01(input.decision_id) !==
      deriveReviewDecisionIdV01(decision)
    ) {
      addError(
        accumulator,
        "decision_identity_mismatch",
        "$.decision_id",
        "ReviewDecision decision_id is inconsistent with its deterministic identity.",
      );
    }
    if (
      protocolStringValueV01(integrity.fingerprint) !==
      createReviewDecisionFingerprintV01(decision)
    ) {
      addError(
        accumulator,
        "fingerprint_mismatch",
        "$.integrity.fingerprint",
        "ReviewDecision fingerprint does not match its normalized content.",
      );
    }
  } catch {
    addError(
      accumulator,
      "integrity_computation_failed",
      "$.integrity",
      "Malformed ReviewDecision content could not be fingerprinted safely.",
    );
  }
}

function validateBoundCandidateAgainstProposal(
  binding: ProtocolJsonRecordV01,
  proposal: EpisodeDeltaProposalV01,
  path: string,
  accumulator: ValidationAccumulator,
) {
  const candidateId = protocolStringValueV01(binding.candidate_id);
  const candidate = proposal.proposed_deltas.find(
    (item) => item.candidate_id === candidateId,
  );
  if (!candidate) {
    addError(
      accumulator,
      "superseding_candidate_missing_from_proposal",
      `${path}.candidate_id`,
      "Superseding candidate must be present in the same source proposal.",
      true,
    );
    return;
  }
  if (
    protocolStringValueV01(binding.candidate_fingerprint) !==
    createEpisodeDeltaCandidateFingerprintV01(candidate)
  ) {
    addError(
      accumulator,
      "superseding_candidate_fingerprint_mismatch",
      `${path}.candidate_fingerprint`,
      "Superseding candidate fingerprint does not match the source proposal.",
      true,
    );
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
  arrayAt(value, path, accumulator).forEach((ref, index) =>
    validateExternalRefStructureV01(
      ref,
      `${path}[${index}]`,
      issueSink(accumulator),
    ),
  );
}

function requireNonEmptyRefArray(
  value: unknown,
  path: string,
  code: string,
  accumulator: ValidationAccumulator,
) {
  const refs = arrayAt(value, path, accumulator);
  refs.forEach((ref, index) =>
    validateExternalRefStructureV01(
      ref,
      `${path}[${index}]`,
      issueSink(accumulator),
    ),
  );
  if (refs.length === 0) {
    addError(accumulator, code, path, "Expected at least one reference.");
  }
}

function requireNonEmptyStringArray(
  value: unknown,
  path: string,
  code: string,
  accumulator: ValidationAccumulator,
) {
  const values = stringArray(value, path, accumulator);
  if (values.length === 0) {
    addError(
      accumulator,
      code,
      path,
      "Expected at least one non-empty string.",
    );
  }
}

function validateBounds(input: unknown, accumulator: ValidationAccumulator) {
  for (const violation of collectBoundViolations(input)) {
    addError(
      accumulator,
      violation.code,
      violation.path,
      violation.message,
      true,
    );
  }
}

function assertReviewDecisionBuildBounds(decision: ReviewDecisionV01) {
  const [violation] = collectBoundViolations(decision);
  if (violation) {
    throw new RangeError(`${violation.path}: ${violation.message}`);
  }
}

function collectBoundViolations(value: unknown) {
  const boundary = createReviewDecisionMaterialBoundaryV01();
  const violations: Array<{ code: string; path: string; message: string }> = [];
  walk(value, "$", (candidate, path) => {
    if (Array.isArray(candidate)) {
      const key = lastPathKey(path);
      const isRefCollection = /(?:_refs|_ids)$/.test(key);
      const limit = isRefCollection
        ? boundary.max_refs_per_collection
        : boundary.max_collection_items;
      if (candidate.length > limit) {
        violations.push({
          code: "collection_bound_exceeded",
          path,
          message: `Collection exceeds the v0.1 bound (${candidate.length} > ${limit}).`,
        });
      }
    } else if (
      typeof candidate === "string" &&
      boundedTextFieldNames.has(lastPathKey(path)) &&
      candidate.length > boundary.max_summary_characters
    ) {
      violations.push({
        code: "summary_bound_exceeded",
        path,
        message: `Bounded text exceeds ${boundary.max_summary_characters} characters.`,
      });
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
    if (
      typeof candidate === "string" &&
      /^(?:file:\/\/|\/(?!\/)|[A-Za-z]:[\\/])/.test(candidate)
    ) {
      addError(
        accumulator,
        "absolute_local_path_forbidden",
        candidatePath,
        "Absolute local paths are forbidden; use a bounded ExternalRef.",
        true,
      );
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

function validateNullableString(
  value: unknown,
  path: string,
  accumulator: ValidationAccumulator,
) {
  if (value !== null && value !== undefined && !protocolStringValueV01(value)) {
    addError(
      accumulator,
      "nullable_string_malformed",
      path,
      "Expected a non-empty string, null, or absent.",
    );
  }
}

function requireString(
  record: ProtocolJsonRecordV01,
  field: string,
  path: string,
  accumulator: ValidationAccumulator,
): string | null {
  const value = protocolStringValueV01(record[field]);
  if (!value) {
    addError(
      accumulator,
      `${field}_missing`,
      `${path}.${field}`,
      `${field} must be a non-empty string.`,
    );
  }
  return value;
}

function requireTimestamp(
  value: unknown,
  path: string,
  accumulator: ValidationAccumulator,
): number | null {
  const parsed = parseStrictIsoTimestampV01(value);
  if (parsed === null) {
    addError(
      accumulator,
      "timestamp_invalid",
      path,
      "Expected a valid ISO-8601 timestamp with timezone.",
    );
  }
  return parsed;
}

function optionalTimestamp(
  value: unknown,
  path: string,
  accumulator: ValidationAccumulator,
): number | null {
  if (value === null || value === undefined) return null;
  return requireTimestamp(value, path, accumulator);
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
    else {
      addError(
        accumulator,
        "string_array_malformed",
        `${path}[${index}]`,
        "Expected a non-empty string.",
      );
    }
  });
  return values;
}

function stringValues(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .map(protocolStringValueV01)
        .filter((item): item is string => Boolean(item))
    : [];
}

function arrayValues(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function collectExternalRefIdentities(value: unknown): Set<string> {
  const identities = new Set<string>();
  walk(value, "$", (candidate) => {
    if (
      isProtocolRecordV01(candidate) &&
      candidate.ref_version === "external_ref.v0.1"
    ) {
      const identity = refIdentity(candidate);
      if (identity) identities.add(identity);
    }
  });
  return identities;
}

function collectCanonicalExternalRefs(value: unknown): Set<string> {
  const refs = new Set<string>();
  walk(value, "$", (candidate) => {
    if (
      isProtocolRecordV01(candidate) &&
      candidate.ref_version === "external_ref.v0.1"
    ) {
      const canonical = canonicalExternalRef(candidate);
      if (canonical) refs.add(canonical);
    }
  });
  return refs;
}

function canonicalExternalRef(value: unknown): string | null {
  if (
    !isProtocolRecordV01(value) ||
    value.ref_version !== "external_ref.v0.1" ||
    !refIdentity(value)
  ) {
    return null;
  }
  return canonicalizeProtocolValueV01(
    normalizeExternalRefPrimitiveV01(value as unknown as ExternalRefV01),
  );
}

function canonicalExternalRefSet(values: unknown[]): Set<string> {
  return new Set(
    values
      .map(canonicalExternalRef)
      .filter((value): value is string => value !== null),
  );
}

function canonicalStringSetsEqual(
  left: ReadonlySet<string>,
  right: ReadonlySet<string>,
): boolean {
  return (
    left.size === right.size && [...left].every((value) => right.has(value))
  );
}

function refIdentity(value: unknown): string | null {
  if (!isProtocolRecordV01(value)) return null;
  const refType = protocolStringValueV01(value.ref_type);
  const externalId = protocolStringValueV01(value.external_id);
  if (!refType || !externalId) return null;
  const namespace = protocolStringValueV01(value.compatibility_namespace);
  return namespace
    ? `namespace:${namespace}|${refType}|${externalId}`
    : `provider:${protocolStringValueV01(value.provider) ?? ""}|host:${
        protocolStringValueV01(value.host) ?? ""
      }|${refType}|${externalId}`;
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
  rejectUnknownProtocolKeysV01(
    record,
    allowed,
    path,
    issueSink(accumulator),
    "unknown_nested_field",
    true,
  );
}

function lastPathKey(path: string) {
  return (
    path
      .replace(/\[\d+\]$/, "")
      .split(".")
      .at(-1) ?? ""
  );
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
      addWarning(accumulator, code, path, message);
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

function addWarning(
  accumulator: ValidationAccumulator,
  code: string,
  path: string | null,
  message: string,
) {
  accumulator.warnings.push({ severity: "warning", code, path, message });
}

function buildValidationResult(
  accumulator: ValidationAccumulator,
  version: typeof REVIEW_DECISION_VERSION_V01 | null,
): ReviewDecisionValidationResultV01 {
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
