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
  uniqueProtocolValuesV01,
  validateDuplicateExternalRefsPrimitiveV01,
  validateExternalRefStructureV01,
  type ProtocolJsonRecordV01,
} from "@/lib/vnext/protocol-primitives";
import {
  createEpisodeDeltaCandidateFingerprintV01,
  validateReviewDecisionAgainstEpisodeDeltaProposalV01,
  validateReviewDecisionV01,
} from "@/lib/vnext/review-decision";
import { validateEpisodeDeltaProposalV01 } from "@/lib/vnext/episode-delta-proposal";
import { validateStateTransitionReceiptV01 } from "@/lib/vnext/state-transition-receipt";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type { EpisodeDeltaProposalV01 } from "@/types/vnext/episode-delta-proposal";
import type { ReviewDecisionV01 } from "@/types/vnext/review-decision";
import {
  STATE_TRANSITION_RECEIPT_OBSERVATION_TRUST_CLASSES_V01,
  type StateTransitionCurrentStateObservationV01,
  type StateTransitionEligibilityEvaluationInputV01,
  type StateTransitionEligibilityExpectedEffectV01,
  type StateTransitionEligibilityIssueV01,
  type StateTransitionEligibilityResultV01,
  type StateTransitionReceiptStateSnapshotV01,
  type StateTransitionReceiptV01,
  type StateTransitionReceiptValidationResultV01,
  type StateTransitionSemanticCommitGateEvaluationV01,
} from "@/types/vnext/state-transition-receipt";

const allowedEvaluationInputKeys = new Set([
  "proposal",
  "decision",
  "current_state_observations",
  "semantic_commit_gate_evaluation",
  "evaluated_at",
]);
const allowedCurrentStateObservationKeys = new Set([
  "target_ref",
  "presence",
  "state_ref",
  "state_fingerprint",
  "observed_at",
  "observation_ref",
  "source_refs",
]);
const allowedGateEvaluationKeys = new Set([
  "status",
  "workspace_id",
  "project_id",
  "decision_id",
  "decision_fingerprint",
  "intent_id",
  "transition_kind",
  "target_refs",
  "decision_actor_ref",
  "authorization_basis_refs",
  "gate_actor_ref",
  "evaluation_ref",
  "evaluated_at",
  "expires_at",
  "source_refs",
]);
const proofTrustClasses = new Set<string>(
  STATE_TRANSITION_RECEIPT_OBSERVATION_TRUST_CLASSES_V01,
);
const gateStatuses = new Set(["authorized", "denied", "unknown"]);

type EligibilityAccumulator = {
  errors: StateTransitionEligibilityIssueV01[];
  warnings: StateTransitionEligibilityIssueV01[];
  blocked: boolean;
};

export interface StateTransitionReceiptEligibilityRelationInputV01
  extends StateTransitionEligibilityEvaluationInputV01 {
  receipt: unknown;
}

export function createStateTransitionEligibilityPreconditionFingerprintV01(
  input: StateTransitionEligibilityEvaluationInputV01,
): string {
  const proposal = input.proposal;
  const decision = input.decision;
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      workspace_id: normalizeProtocolTextV01(proposal.workspace_id),
      project_id: normalizeProtocolTextV01(proposal.project_id),
      source_proposal: {
        proposal_id: normalizeProtocolTextV01(proposal.proposal_id),
        proposal_fingerprint: normalizeProtocolTextV01(
          proposal.integrity.fingerprint,
        ),
      },
      source_decision: {
        decision_id: normalizeProtocolTextV01(decision.decision_id),
        decision_fingerprint: normalizeProtocolTextV01(
          decision.integrity.fingerprint,
        ),
      },
      requested_transition_intent: decision.requested_transition_intent
        ? {
            intent_id: normalizeProtocolTextV01(
              decision.requested_transition_intent.intent_id,
            ),
            transition_kind:
              decision.requested_transition_intent.transition_kind,
            target_refs: normalizeRefs(
              decision.requested_transition_intent.target_refs,
            ),
          }
        : null,
      current_state_observations: normalizeCurrentStateObservationsForHash(
        input.current_state_observations,
      ),
      semantic_commit_gate_evaluation: normalizeGateForHash(
        input.semantic_commit_gate_evaluation,
      ),
      evaluated_at: normalizeProtocolTextV01(input.evaluated_at),
    }),
  );
}

export function evaluateReviewDecisionStateTransitionEligibilityV01(
  input: StateTransitionEligibilityEvaluationInputV01,
): StateTransitionEligibilityResultV01;
export function evaluateReviewDecisionStateTransitionEligibilityV01(
  input: unknown,
): StateTransitionEligibilityResultV01;
export function evaluateReviewDecisionStateTransitionEligibilityV01(
  input: unknown,
): StateTransitionEligibilityResultV01 {
  const accumulator = createAccumulator();
  if (!isProtocolRecordV01(input)) {
    addError(
      accumulator,
      "eligibility_input_malformed",
      "$",
      "Eligibility input must be an object.",
      true,
    );
    return buildEligibilityResult(accumulator, input, null, [], []);
  }
  rejectUnknownProtocolKeysV01(
    input,
    allowedEvaluationInputKeys,
    "$",
    issueSink(accumulator),
    "unknown_eligibility_field",
    true,
  );
  scanEligibilityMaterial(input.current_state_observations, "$.current_state_observations", accumulator);
  scanEligibilityMaterial(input.semantic_commit_gate_evaluation, "$.semantic_commit_gate_evaluation", accumulator);
  scanAbsoluteLocalPaths(input.current_state_observations, "$.current_state_observations", accumulator);
  scanAbsoluteLocalPaths(input.semantic_commit_gate_evaluation, "$.semantic_commit_gate_evaluation", accumulator);

  const evaluatedAt = requireTimestamp(
    input.evaluated_at,
    "$.evaluated_at",
    accumulator,
  );
  const proposal = input.proposal;
  const decision = input.decision;
  const proposalValidation = validateEpisodeDeltaProposalV01(proposal);
  if (proposalValidation.status !== "valid") {
    addError(
      accumulator,
      "proposal_invalid",
      "$.proposal",
      "Eligibility requires a valid EpisodeDeltaProposal.",
      true,
    );
  }
  const decisionValidation = validateReviewDecisionV01(decision);
  if (decisionValidation.status !== "valid") {
    addError(
      accumulator,
      "decision_invalid",
      "$.decision",
      "Eligibility requires a valid ReviewDecision.",
      true,
    );
  }
  if (
    proposalValidation.status === "valid" &&
    decisionValidation.status === "valid"
  ) {
    const relation = validateReviewDecisionAgainstEpisodeDeltaProposalV01(
      decision,
      proposal,
    );
    if (relation.status !== "valid") {
      addError(
        accumulator,
        "decision_proposal_relation_invalid",
        "$.decision",
        "ReviewDecision does not preserve an exact valid relation to the proposal.",
        true,
      );
    }
    for (const issue of relation.errors) {
      addError(
        accumulator,
        issue.code,
        issue.path ? `$.decision${issue.path.slice(1)}` : "$.decision",
        issue.message,
        true,
      );
    }
  }

  const typedProposal =
    proposalValidation.status === "valid" && isProtocolRecordV01(proposal)
    ? (proposal as unknown as EpisodeDeltaProposalV01)
    : null;
  const typedDecision =
    decisionValidation.status === "valid" && isProtocolRecordV01(decision)
    ? (decision as unknown as ReviewDecisionV01)
    : null;
  const decisionValue = protocolStringValueV01(typedDecision?.decision);
  const intent = typedDecision?.requested_transition_intent ?? null;
  if (decisionValue === "reject" || decisionValue === "defer") {
    addError(
      accumulator,
      "decision_not_transitionable",
      "$.decision.decision",
      "Reject and defer decisions are ineligible for StateTransitionReceipt.",
    );
  }
  if (
    (decisionValue === "accept" ||
      decisionValue === "supersede" ||
      decisionValue === "retract") &&
    !intent
  ) {
    addError(
      accumulator,
      "requested_transition_intent_missing",
      "$.decision.requested_transition_intent",
      "Accept, supersede, and retract require exact transition intent.",
    );
  }

  const expectedKind = intent?.transition_kind ?? null;
  const expectedTargets = intent ? normalizeRefs(intent.target_refs) : [];
  const expectedKindForDecision =
    decisionValue === "accept"
      ? "semantic_candidate_apply"
      : decisionValue === "supersede"
        ? "semantic_candidate_supersede"
        : decisionValue === "retract"
          ? "semantic_candidate_retract"
          : null;
  if (
    expectedKindForDecision &&
    expectedKind !== expectedKindForDecision
  ) {
    addError(
      accumulator,
      "transition_kind_not_eligible",
      "$.decision.requested_transition_intent.transition_kind",
      "Eligibility requires the decision-specific semantic transition kind; other is not eligible.",
    );
  }

  const gate = validateGateEvaluation(
    input.semantic_commit_gate_evaluation,
    typedProposal,
    typedDecision,
    intent,
    evaluatedAt,
    accumulator,
  );
  const observations = validateCurrentStateObservations(
    input.current_state_observations,
    expectedTargets,
    evaluatedAt,
    accumulator,
  );
  const expectedEffects = deriveExpectedEffects(
    decisionValue,
    expectedTargets,
    observations,
    accumulator,
  );

  if (
    gate &&
    typedDecision &&
    parseStrictIsoTimestampV01(typedDecision.decided_at) !== null &&
    parseStrictIsoTimestampV01(gate.evaluated_at) !== null &&
    parseStrictIsoTimestampV01(typedDecision.decided_at)! >
      parseStrictIsoTimestampV01(gate.evaluated_at)!
  ) {
    addError(
      accumulator,
      "gate_precedes_decision",
      "$.semantic_commit_gate_evaluation.evaluated_at",
      "Semantic commit gate evaluation cannot predate the decision.",
      true,
    );
  }

  return buildEligibilityResult(
    accumulator,
    input,
    expectedKind,
    expectedTargets,
    expectedEffects,
  );
}

export function validateStateTransitionReceiptAgainstEligibilityV01(
  input: StateTransitionReceiptEligibilityRelationInputV01,
): StateTransitionReceiptValidationResultV01 {
  const accumulator = createRelationAccumulator();
  const receiptValidation = validateStateTransitionReceiptV01(input.receipt);
  accumulator.errors.push(...receiptValidation.errors);
  accumulator.warnings.push(...receiptValidation.warnings);
  if (receiptValidation.status === "blocked") accumulator.blocked = true;
  const eligibility = evaluateReviewDecisionStateTransitionEligibilityV01({
    proposal: input.proposal,
    decision: input.decision,
    current_state_observations: input.current_state_observations,
    semantic_commit_gate_evaluation: input.semantic_commit_gate_evaluation,
    evaluated_at: input.evaluated_at,
  });
  if (eligibility.status !== "eligible") {
    addRelationError(
      accumulator,
      "transition_not_eligible",
      "$",
      "StateTransitionReceipt cannot relate to ineligible or blocked preconditions.",
      true,
    );
    return buildRelationResult(
      accumulator,
      receiptValidation.normalized_protocol_version,
    );
  }
  if (!isProtocolRecordV01(input.receipt)) {
    return buildRelationResult(
      accumulator,
      receiptValidation.normalized_protocol_version,
    );
  }
  const receipt = input.receipt as unknown as StateTransitionReceiptV01;
  const proposal = input.proposal;
  const decision = input.decision;
  const intent = decision.requested_transition_intent;
  if (!intent) {
    addRelationError(accumulator, "requested_transition_intent_missing", "$.source_decision", "Related decision lacks transition intent.", true);
    return buildRelationResult(
      accumulator,
      receiptValidation.normalized_protocol_version,
    );
  }

  exactText(receipt.workspace_id, proposal.workspace_id, "workspace_mismatch", "$.workspace_id", accumulator);
  exactText(receipt.project_id, proposal.project_id, "project_mismatch", "$.project_id", accumulator);
  exactText(receipt.source_proposal.proposal_id, proposal.proposal_id, "proposal_id_mismatch", "$.source_proposal.proposal_id", accumulator);
  exactText(receipt.source_proposal.proposal_fingerprint, proposal.integrity.fingerprint, "proposal_fingerprint_mismatch", "$.source_proposal.proposal_fingerprint", accumulator);
  exactText(receipt.source_decision.decision_id, decision.decision_id, "decision_id_mismatch", "$.source_decision.decision_id", accumulator);
  exactText(receipt.source_decision.decision_fingerprint, decision.integrity.fingerprint, "decision_fingerprint_mismatch", "$.source_decision.decision_fingerprint", accumulator);
  exactText(receipt.source_candidate.candidate_id, decision.candidate.candidate_id, "candidate_id_mismatch", "$.source_candidate.candidate_id", accumulator);
  exactText(receipt.source_candidate.candidate_fingerprint, decision.candidate.candidate_fingerprint, "candidate_fingerprint_mismatch", "$.source_candidate.candidate_fingerprint", accumulator);
  exactText(receipt.requested_transition_intent.intent_id, intent.intent_id, "intent_id_mismatch", "$.requested_transition_intent.intent_id", accumulator);
  exactText(receipt.requested_transition_intent.transition_kind, intent.transition_kind, "transition_kind_mismatch", "$.requested_transition_intent.transition_kind", accumulator);
  exactRefSet(
    receipt.requested_transition_intent.target_refs,
    intent.target_refs,
    "transition_target_mismatch",
    "$.requested_transition_intent.target_refs",
    accumulator,
  );
  exactText(
    receipt.eligibility_precondition_fingerprint,
    eligibility.precondition_fingerprint,
    "precondition_fingerprint_mismatch",
    "$.eligibility_precondition_fingerprint",
    accumulator,
  );
  const gate = input.semantic_commit_gate_evaluation;
  if (gate.status !== "authorized") {
    addRelationError(accumulator, "gate_status_mismatch", "$.semantic_commit_gate.status", "Applied receipt requires the exact authorized gate.", true);
  }
  exactRef(receipt.semantic_commit_gate.evaluation_ref, gate.evaluation_ref, "gate_evaluation_ref_mismatch", "$.semantic_commit_gate.evaluation_ref", accumulator);
  exactText(receipt.semantic_commit_gate.evaluated_at, gate.evaluated_at, "gate_evaluated_at_mismatch", "$.semantic_commit_gate.evaluated_at", accumulator);
  exactText(receipt.semantic_commit_gate.expires_at, gate.expires_at, "gate_expires_at_mismatch", "$.semantic_commit_gate.expires_at", accumulator);

  const expectedByTarget = new Map(
    eligibility.expected_effects.map((effect) => [
      canonicalExternalRef(effect.target_ref),
      effect,
    ]),
  );
  if (receipt.effects.length !== eligibility.expected_effects.length) {
    addRelationError(accumulator, "effect_count_mismatch", "$.effects", "Receipt effects must match all eligible targets exactly.", true);
  }
  for (const [index, effect] of receipt.effects.entries()) {
    const path = `$.effects[${index}]`;
    const expected = expectedByTarget.get(canonicalExternalRef(effect.target_ref));
    if (!expected) {
      addRelationError(accumulator, "effect_target_outside_decision", `${path}.target_ref`, "Receipt effect target is outside the eligible decision target set.", true);
      continue;
    }
    if (effect.operation !== expected.operation) {
      addRelationError(accumulator, "effect_operation_mismatch", `${path}.operation`, "Receipt effect operation differs from eligibility.", true);
    }
    if (canonicalizeProtocolValueV01(effect.before_state) !== canonicalizeProtocolValueV01(expected.before_state)) {
      addRelationError(accumulator, "before_state_mismatch", `${path}.before_state`, "Receipt must preserve the exact observed before-state snapshot.", true);
    }
    exactRef(effect.before_state_observation_ref, expected.before_state_observation_ref, "before_state_observation_mismatch", `${path}.before_state_observation_ref`, accumulator);
  }

  const decidedAt = parseStrictIsoTimestampV01(decision.decided_at);
  const gateAt = parseStrictIsoTimestampV01(gate.evaluated_at);
  const appliedAt = parseStrictIsoTimestampV01(receipt.applied_at);
  const recordedAt = parseStrictIsoTimestampV01(receipt.recorded_at);
  const expiresAt = parseStrictIsoTimestampV01(gate.expires_at);
  if (decidedAt !== null && appliedAt !== null && appliedAt < decidedAt) {
    addRelationError(accumulator, "applied_before_decision", "$.applied_at", "Applied transition cannot predate its decision.", true);
  }
  if (gateAt !== null && appliedAt !== null && appliedAt < gateAt) {
    addRelationError(accumulator, "applied_before_gate_evaluation", "$.applied_at", "Applied transition cannot predate gate evaluation.", true);
  }
  if (appliedAt !== null && expiresAt !== null && appliedAt > expiresAt) {
    addRelationError(accumulator, "applied_after_gate_expiry", "$.applied_at", "Expired gate cannot support the receipt.", true);
  }
  if (appliedAt !== null && recordedAt !== null && appliedAt > recordedAt) {
    addRelationError(accumulator, "recorded_before_applied", "$.recorded_at", "recorded_at cannot predate applied_at.", true);
  }
  for (const [index, observation] of input.current_state_observations.entries()) {
    const observedAt = parseStrictIsoTimestampV01(observation.observed_at);
    if (observedAt !== null && appliedAt !== null && observedAt > appliedAt) {
      addRelationError(accumulator, "applied_before_current_state_observation", `$.current_state_observations[${index}].observed_at`, "Applied transition cannot predate current-state observation.", true);
    }
  }

  return buildRelationResult(
    accumulator,
    receiptValidation.normalized_protocol_version,
  );
}

export const validateStateTransitionReceiptAgainstReviewDecisionEligibilityV01 =
  validateStateTransitionReceiptAgainstEligibilityV01;

function validateGateEvaluation(
  value: unknown,
  proposal: EpisodeDeltaProposalV01 | null,
  decision: ReviewDecisionV01 | null,
  intent: ReviewDecisionV01["requested_transition_intent"],
  evaluatedAt: number | null,
  accumulator: EligibilityAccumulator,
): StateTransitionSemanticCommitGateEvaluationV01 | null {
  const gate = recordAt(
    value,
    "$.semantic_commit_gate_evaluation",
    accumulator,
  );
  if (!gate) return null;
  rejectUnknownNestedKeys(gate, allowedGateEvaluationKeys, "$.semantic_commit_gate_evaluation", accumulator);
  const status = protocolStringValueV01(gate.status);
  if (!status || !gateStatuses.has(status)) {
    addError(accumulator, "gate_status_invalid", "$.semantic_commit_gate_evaluation.status", "Gate status must be authorized, denied, or unknown.", true);
  } else if (status !== "authorized") {
    addError(accumulator, status === "denied" ? "semantic_commit_gate_denied" : "semantic_commit_gate_unknown", "$.semantic_commit_gate_evaluation.status", "Denied or unknown gate is ineligible.");
  }
  requireString(gate, "workspace_id", "$.semantic_commit_gate_evaluation", accumulator);
  requireString(gate, "project_id", "$.semantic_commit_gate_evaluation", accumulator);
  requireString(gate, "decision_id", "$.semantic_commit_gate_evaluation", accumulator);
  validateSha256(gate.decision_fingerprint, "$.semantic_commit_gate_evaluation.decision_fingerprint", "gate_decision_fingerprint_malformed", accumulator);
  requireString(gate, "intent_id", "$.semantic_commit_gate_evaluation", accumulator);
  requireString(gate, "transition_kind", "$.semantic_commit_gate_evaluation", accumulator);
  const targetRefs = requireNonEmptyRefArray(gate.target_refs, "$.semantic_commit_gate_evaluation.target_refs", "gate_target_required", accumulator);
  validateExternalRefStructureV01(gate.decision_actor_ref, "$.semantic_commit_gate_evaluation.decision_actor_ref", issueSink(accumulator));
  const authorizationRefs = requireNonEmptyRefArray(gate.authorization_basis_refs, "$.semantic_commit_gate_evaluation.authorization_basis_refs", "gate_authorization_basis_required", accumulator);
  validateExternalRefStructureV01(gate.gate_actor_ref, "$.semantic_commit_gate_evaluation.gate_actor_ref", issueSink(accumulator));
  validateProofRef(gate.evaluation_ref, "$.semantic_commit_gate_evaluation.evaluation_ref", "semantic_commit_gate", accumulator);
  const gateEvaluatedAt = requireTimestamp(gate.evaluated_at, "$.semantic_commit_gate_evaluation.evaluated_at", accumulator);
  const expiresAt = requireTimestamp(gate.expires_at, "$.semantic_commit_gate_evaluation.expires_at", accumulator);
  requireNonEmptyRefArray(gate.source_refs, "$.semantic_commit_gate_evaluation.source_refs", "semantic_commit_gate_source_ref_required", accumulator);
  validateDuplicateExternalRefsPrimitiveV01(gate, issueSink(accumulator));
  if (gateEvaluatedAt !== null && expiresAt !== null && gateEvaluatedAt >= expiresAt) {
    addError(accumulator, "gate_expiry_invalid", "$.semantic_commit_gate_evaluation.expires_at", "Gate expiry must be later than evaluation.", true);
  }
  if (evaluatedAt !== null && gateEvaluatedAt !== null && gateEvaluatedAt > evaluatedAt) {
    addError(accumulator, "timestamp_order_invalid", "$.semantic_commit_gate_evaluation.evaluated_at", "Gate evaluation cannot postdate eligibility evaluation.", true);
  }
  if (evaluatedAt !== null && expiresAt !== null && evaluatedAt > expiresAt) {
    addError(accumulator, "semantic_commit_gate_expired", "$.semantic_commit_gate_evaluation.expires_at", "Expired gate is ineligible.");
  }
  const evaluationRef = isProtocolRecordV01(gate.evaluation_ref) ? gate.evaluation_ref : null;
  if (
    gateEvaluatedAt !== null &&
    parseStrictIsoTimestampV01(evaluationRef?.observed_at) !== gateEvaluatedAt
  ) {
    addError(accumulator, "gate_evaluation_time_mismatch", "$.semantic_commit_gate_evaluation.evaluation_ref.observed_at", "Gate evaluation ref must preserve evaluated_at exactly.", true);
  }
  if (proposal) {
    exactEligibilityText(gate.workspace_id, proposal.workspace_id, "gate_workspace_mismatch", "$.semantic_commit_gate_evaluation.workspace_id", accumulator);
    exactEligibilityText(gate.project_id, proposal.project_id, "gate_project_mismatch", "$.semantic_commit_gate_evaluation.project_id", accumulator);
  }
  if (decision) {
    exactEligibilityText(gate.decision_id, decision.decision_id, "gate_decision_id_mismatch", "$.semantic_commit_gate_evaluation.decision_id", accumulator);
    exactEligibilityText(gate.decision_fingerprint, decision.integrity.fingerprint, "gate_decision_fingerprint_mismatch", "$.semantic_commit_gate_evaluation.decision_fingerprint", accumulator);
    exactEligibilityRef(gate.decision_actor_ref, decision.actor_ref, "gate_decision_actor_mismatch", "$.semantic_commit_gate_evaluation.decision_actor_ref", accumulator);
    exactEligibilityRefSet(authorizationRefs, decision.authorization_basis_refs, "gate_authorization_basis_mismatch", "$.semantic_commit_gate_evaluation.authorization_basis_refs", accumulator);
  }
  if (intent) {
    exactEligibilityText(gate.intent_id, intent.intent_id, "gate_intent_mismatch", "$.semantic_commit_gate_evaluation.intent_id", accumulator);
    exactEligibilityText(gate.transition_kind, intent.transition_kind, "gate_transition_kind_mismatch", "$.semantic_commit_gate_evaluation.transition_kind", accumulator);
    exactEligibilityRefSet(targetRefs, intent.target_refs, "gate_target_mismatch", "$.semantic_commit_gate_evaluation.target_refs", accumulator);
  }
  return gate as unknown as StateTransitionSemanticCommitGateEvaluationV01;
}

function validateCurrentStateObservations(
  value: unknown,
  expectedTargets: ExternalRefV01[],
  evaluatedAt: number | null,
  accumulator: EligibilityAccumulator,
): StateTransitionCurrentStateObservationV01[] {
  const observations = arrayAt(value, "$.current_state_observations", accumulator);
  if (observations.length > 64) {
    addError(accumulator, "current_state_collection_bound_exceeded", "$.current_state_observations", "At most 64 target observations are supported.", true);
  }
  const expectedByCanonical = new Map(
    expectedTargets.map((ref) => [canonicalExternalRef(ref), ref]),
  );
  const expectedIdentities = new Map(
    expectedTargets.map((ref) => [externalRefIdentity(ref), canonicalExternalRef(ref)]),
  );
  const seenCanonical = new Set<string>();
  const seenIdentity = new Map<string, string>();
  const seenObservationByTarget = new Map<string, string>();
  const valid: StateTransitionCurrentStateObservationV01[] = [];
  observations.forEach((item, index) => {
    const path = `$.current_state_observations[${index}]`;
    const observation = recordAt(item, path, accumulator);
    if (!observation) return;
    rejectUnknownNestedKeys(observation, allowedCurrentStateObservationKeys, path, accumulator);
    validateExternalRefStructureV01(observation.target_ref, `${path}.target_ref`, issueSink(accumulator));
    const targetCanonical = canonicalExternalRef(observation.target_ref);
    const targetIdentity = externalRefIdentity(observation.target_ref);
    if (targetCanonical) {
      if (seenCanonical.has(targetCanonical)) {
        addError(accumulator, "duplicate_current_state_target", `${path}.target_ref`, "Each target requires one current-state observation.", true);
        const priorObservation = seenObservationByTarget.get(targetCanonical);
        if (
          priorObservation &&
          priorObservation !== canonicalizeProtocolValueV01(observation)
        ) {
          addError(accumulator, "conflicting_current_state_snapshot", path, "Duplicate target observations preserve conflicting snapshots.", true);
        }
      }
      seenCanonical.add(targetCanonical);
      seenObservationByTarget.set(
        targetCanonical,
        canonicalizeProtocolValueV01(observation),
      );
      if (
        expectedByCanonical.size > 0 &&
        !expectedByCanonical.has(targetCanonical)
      ) {
        addError(accumulator, "current_state_target_mismatch", `${path}.target_ref`, "Current-state observation target is outside the requested target set.", true);
      }
    }
    if (targetIdentity && targetCanonical) {
      const prior = seenIdentity.get(targetIdentity);
      if (prior && prior !== targetCanonical) {
        addError(accumulator, "conflicting_current_state_snapshot", `${path}.target_ref`, "Target identity has conflicting provenance or snapshots.", true);
      }
      seenIdentity.set(targetIdentity, targetCanonical);
      const expectedCanonical = expectedIdentities.get(targetIdentity);
      if (expectedCanonical && expectedCanonical !== targetCanonical) {
        addError(accumulator, "current_state_target_provenance_mismatch", `${path}.target_ref`, "Target provenance must match the requested target exactly.", true);
      }
    }
    const presence = protocolStringValueV01(observation.presence);
    if (presence === "unknown") {
      if (observation.state_ref !== null || observation.state_fingerprint !== null) {
        addError(accumulator, "current_state_snapshot_invalid", path, "Unknown state cannot carry fabricated state material.", true);
      }
      addError(accumulator, "current_state_unknown", `${path}.presence`, "Unknown current state is ineligible.");
    } else if (presence === "absent") {
      if (observation.state_ref !== null || observation.state_fingerprint !== null) {
        addError(accumulator, "current_state_snapshot_invalid", path, "Absent current state requires null state material.", true);
      }
    } else if (presence === "present") {
      if (!isProtocolRecordV01(observation.state_ref) || !protocolStringValueV01(observation.state_fingerprint)) {
        addError(accumulator, "current_state_snapshot_invalid", path, "Present current state requires state_ref and state_fingerprint.", true);
      }
      validateExternalRefStructureV01(observation.state_ref, `${path}.state_ref`, issueSink(accumulator));
      validateSha256(observation.state_fingerprint, `${path}.state_fingerprint`, "current_state_fingerprint_invalid", accumulator);
    } else {
      addError(accumulator, "current_state_presence_invalid", `${path}.presence`, "Current state presence must be absent, present, or unknown.", true);
    }
    const observedAt = requireTimestamp(observation.observed_at, `${path}.observed_at`, accumulator);
    validateProofRef(observation.observation_ref, `${path}.observation_ref`, "current_state_observation", accumulator);
    const proofRef = isProtocolRecordV01(observation.observation_ref) ? observation.observation_ref : null;
    if (observedAt !== null && parseStrictIsoTimestampV01(proofRef?.observed_at) !== observedAt) {
      addError(accumulator, "current_state_observation_time_mismatch", `${path}.observation_ref.observed_at`, "Observation ref must preserve observed_at exactly.", true);
    }
    if (observedAt !== null && evaluatedAt !== null && observedAt > evaluatedAt) {
      addError(accumulator, "timestamp_order_invalid", `${path}.observed_at`, "Current-state observation cannot postdate eligibility evaluation.", true);
    }
    requireNonEmptyRefArray(observation.source_refs, `${path}.source_refs`, "current_state_source_ref_required", accumulator);
    validateDuplicateExternalRefsPrimitiveV01(observation, issueSink(accumulator));
    valid.push(observation as unknown as StateTransitionCurrentStateObservationV01);
  });
  const missingTargets = [...expectedByCanonical.keys()].filter(
    (key) => !seenCanonical.has(key),
  );
  if (missingTargets.length > 0) {
    addError(
      accumulator,
      expectedTargets.length > 1 && observations.length > 0
        ? "partial_target_admission"
        : "current_state_missing",
      "$.current_state_observations",
      "Every requested target requires an explicit current-state observation.",
      expectedTargets.length > 1 && observations.length > 0,
    );
  }
  return valid;
}

function deriveExpectedEffects(
  decisionValue: string | null,
  expectedTargets: ExternalRefV01[],
  observations: StateTransitionCurrentStateObservationV01[],
  accumulator: EligibilityAccumulator,
): StateTransitionEligibilityExpectedEffectV01[] {
  const byTarget = new Map(
    observations.map((item) => [canonicalExternalRef(item.target_ref), item]),
  );
  const effects: StateTransitionEligibilityExpectedEffectV01[] = [];
  for (const target of expectedTargets) {
    const observation = byTarget.get(canonicalExternalRef(target));
    if (
      !observation ||
      observation.presence === "unknown" ||
      !isProtocolRecordV01(observation.observation_ref)
    ) {
      continue;
    }
    if (
      observation.presence === "present" &&
      (!isProtocolRecordV01(observation.state_ref) ||
        !protocolStringValueV01(observation.state_fingerprint))
    ) {
      continue;
    }
    let operation: StateTransitionEligibilityExpectedEffectV01["operation"] | null = null;
    if (decisionValue === "accept") {
      operation = observation.presence === "absent" ? "create" : "replace";
    } else if (decisionValue === "supersede") {
      if (observation.presence === "present") operation = "supersede";
      else addError(accumulator, "supersede_requires_present_state", "$.current_state_observations", "Supersede requires observed present state.");
    } else if (decisionValue === "retract") {
      if (observation.presence === "present") operation = "retract";
      else addError(accumulator, "retract_requires_present_state", "$.current_state_observations", "Retract requires observed present state.");
    }
    if (!operation) continue;
    const beforeState: StateTransitionReceiptStateSnapshotV01 =
      observation.presence === "absent"
        ? { presence: "absent", state_ref: null, state_fingerprint: null }
        : {
            presence: "present",
            state_ref: normalizeExternalRefPrimitiveV01(observation.state_ref!),
            state_fingerprint: normalizeProtocolTextV01(
              observation.state_fingerprint,
            ),
          };
    effects.push({
      target_ref: normalizeExternalRefPrimitiveV01(target),
      operation,
      before_state: beforeState,
      before_state_observation_ref: normalizeExternalRefPrimitiveV01(
        observation.observation_ref,
      ),
      source_refs: normalizeRefs(observation.source_refs),
    });
  }
  return effects.sort(compareProtocolCanonicalV01);
}

function normalizeCurrentStateObservationsForHash(
  values: StateTransitionCurrentStateObservationV01[],
) {
  if (!Array.isArray(values)) return [];
  return values
    .map((item) => ({
      target_ref: safeNormalizeRef(item?.target_ref),
      presence: item?.presence ?? null,
      state_ref: item?.state_ref ? safeNormalizeRef(item.state_ref) : null,
      state_fingerprint: protocolStringValueV01(item?.state_fingerprint),
      observed_at: protocolStringValueV01(item?.observed_at),
      observation_ref: safeNormalizeRef(item?.observation_ref),
      source_refs: Array.isArray(item?.source_refs)
        ? item.source_refs.map(safeNormalizeRef).sort(compareProtocolCanonicalV01)
        : [],
    }))
    .sort(compareProtocolCanonicalV01);
}

function normalizeGateForHash(
  gate: StateTransitionSemanticCommitGateEvaluationV01,
) {
  if (!gate || typeof gate !== "object") return gate ?? null;
  return {
    status: gate.status,
    workspace_id: protocolStringValueV01(gate.workspace_id),
    project_id: protocolStringValueV01(gate.project_id),
    decision_id: protocolStringValueV01(gate.decision_id),
    decision_fingerprint: protocolStringValueV01(gate.decision_fingerprint),
    intent_id: protocolStringValueV01(gate.intent_id),
    transition_kind: gate.transition_kind,
    target_refs: Array.isArray(gate.target_refs)
      ? gate.target_refs.map(safeNormalizeRef).sort(compareProtocolCanonicalV01)
      : [],
    decision_actor_ref: safeNormalizeRef(gate.decision_actor_ref),
    authorization_basis_refs: Array.isArray(gate.authorization_basis_refs)
      ? gate.authorization_basis_refs
          .map(safeNormalizeRef)
          .sort(compareProtocolCanonicalV01)
      : [],
    gate_actor_ref: safeNormalizeRef(gate.gate_actor_ref),
    evaluation_ref: safeNormalizeRef(gate.evaluation_ref),
    evaluated_at: protocolStringValueV01(gate.evaluated_at),
    expires_at: protocolStringValueV01(gate.expires_at),
    source_refs: Array.isArray(gate.source_refs)
      ? gate.source_refs.map(safeNormalizeRef).sort(compareProtocolCanonicalV01)
      : [],
  };
}

function safeNormalizeRef(value: unknown): unknown {
  if (!isProtocolRecordV01(value)) return value ?? null;
  try {
    return normalizeExternalRefPrimitiveV01(value as unknown as ExternalRefV01);
  } catch {
    return value;
  }
}

function buildEligibilityResult(
  accumulator: EligibilityAccumulator,
  input: unknown,
  expectedKind: StateTransitionEligibilityResultV01["expected_transition_kind"],
  expectedTargets: ExternalRefV01[],
  expectedEffects: StateTransitionEligibilityExpectedEffectV01[],
): StateTransitionEligibilityResultV01 {
  let fingerprint: string;
  try {
    fingerprint = createStateTransitionEligibilityPreconditionFingerprintV01(
      input as StateTransitionEligibilityEvaluationInputV01,
    );
  } catch {
    fingerprint = createProtocolSha256V01(canonicalizeProtocolValueV01(input));
  }
  return {
    status:
      accumulator.errors.length === 0
        ? "eligible"
        : accumulator.blocked
          ? "blocked"
          : "ineligible",
    precondition_fingerprint: fingerprint,
    expected_transition_kind: expectedKind,
    expected_target_refs: expectedTargets,
    expected_effects: expectedEffects,
    errors: accumulator.errors,
    warnings: accumulator.warnings,
  };
}

function scanEligibilityMaterial(
  value: unknown,
  path: string,
  accumulator: EligibilityAccumulator,
) {
  scanForbiddenProtocolMaterialV01(value, path, issueSink(accumulator), {
    secret_material_message: "Secret-shaped material is forbidden in transition eligibility input.",
    provider_specific_field_message: "Provider-native identifiers must remain ExternalRef values in transition eligibility input.",
    additional_forbidden_raw_field_pattern: /^(?:raw_provider_output|raw_terminal_(?:output|log)|terminal_(?:dump|log)|stdout|stderr|environment_dump|credential_dump)$/,
    additional_provider_identity_pattern: /^(?:(?:github|openai|chatgpt|codex|claude|gemini)(?:_.+)?|(?:response|invocation|workflow|job|commit|pr)_id)$/,
  });
}

function validateProofRef(
  value: unknown,
  path: string,
  codePrefix: string,
  accumulator: EligibilityAccumulator,
) {
  validateExternalRefStructureV01(value, path, issueSink(accumulator));
  if (!isProtocolRecordV01(value)) {
    addError(accumulator, `${codePrefix}_ref_required`, path, "A proof-grade ExternalRef is required.", true);
    return;
  }
  const trust = protocolStringValueV01(value.trust_class);
  if (!trust || !proofTrustClasses.has(trust)) {
    addError(accumulator, `${codePrefix}_trust_insufficient`, `${path}.trust_class`, "Observation requires direct or verified trust.", true);
  }
  if (parseStrictIsoTimestampV01(value.observed_at) === null) {
    addError(accumulator, `${codePrefix}_observed_at_required`, `${path}.observed_at`, "Observation ref requires observed_at.", true);
  }
}

function normalizeRefs(refs: ExternalRefV01[]): ExternalRefV01[] {
  if (!Array.isArray(refs)) return [];
  return uniqueProtocolValuesV01(
    refs.map(normalizeExternalRefPrimitiveV01),
  ).sort(compareExternalRefsV01);
}

function canonicalExternalRef(value: unknown): string {
  if (!isProtocolRecordV01(value)) return "";
  try {
    return canonicalizeProtocolValueV01(
      normalizeExternalRefPrimitiveV01(value as unknown as ExternalRefV01),
    );
  } catch {
    return canonicalizeProtocolValueV01(value);
  }
}

function externalRefIdentity(value: unknown): string {
  if (!isProtocolRecordV01(value)) return "";
  const type = protocolStringValueV01(value.ref_type) ?? "";
  const id = protocolStringValueV01(value.external_id) ?? "";
  const namespace = protocolStringValueV01(value.compatibility_namespace);
  return namespace
    ? `namespace:${namespace}|${type}|${id}`
    : `provider:${protocolStringValueV01(value.provider) ?? ""}|host:${protocolStringValueV01(value.host) ?? ""}|${type}|${id}`;
}

function exactEligibilityText(
  actual: unknown,
  expected: unknown,
  code: string,
  path: string,
  accumulator: EligibilityAccumulator,
) {
  if (protocolStringValueV01(actual) !== protocolStringValueV01(expected)) {
    addError(accumulator, code, path, "Cross-contract binding mismatch.", true);
  }
}

function exactEligibilityRef(
  actual: unknown,
  expected: unknown,
  code: string,
  path: string,
  accumulator: EligibilityAccumulator,
) {
  if (canonicalExternalRef(actual) !== canonicalExternalRef(expected)) {
    addError(accumulator, code, path, "ExternalRef provenance must match exactly.", true);
  }
}

function exactEligibilityRefSet(
  actual: unknown[],
  expected: ExternalRefV01[],
  code: string,
  path: string,
  accumulator: EligibilityAccumulator,
) {
  const left = new Set(actual.map(canonicalExternalRef));
  const right = new Set(expected.map(canonicalExternalRef));
  if (left.size !== right.size || [...left].some((item) => !right.has(item))) {
    addError(accumulator, code, path, "ExternalRef set must preserve exact canonical provenance.", true);
  }
}

function exactText(
  actual: unknown,
  expected: unknown,
  code: string,
  path: string,
  accumulator: RelationAccumulator,
) {
  if (protocolStringValueV01(actual) !== protocolStringValueV01(expected)) {
    addRelationError(accumulator, code, path, "Cross-contract binding mismatch.", true);
  }
}

function exactRef(
  actual: unknown,
  expected: unknown,
  code: string,
  path: string,
  accumulator: RelationAccumulator,
) {
  if (canonicalExternalRef(actual) !== canonicalExternalRef(expected)) {
    addRelationError(accumulator, code, path, "ExternalRef provenance must match exactly.", true);
  }
}

function exactRefSet(
  actual: ExternalRefV01[],
  expected: ExternalRefV01[],
  code: string,
  path: string,
  accumulator: RelationAccumulator,
) {
  const left = new Set(actual.map(canonicalExternalRef));
  const right = new Set(expected.map(canonicalExternalRef));
  if (left.size !== right.size || [...left].some((item) => !right.has(item))) {
    addRelationError(accumulator, code, path, "ExternalRef set must match exactly.", true);
  }
}

function scanAbsoluteLocalPaths(
  value: unknown,
  path: string,
  accumulator: EligibilityAccumulator,
) {
  walk(value, path, (candidate, candidatePath) => {
    if (typeof candidate === "string" && /^(?:file:\/\/|\/(?!\/)|[A-Za-z]:[\\/])/.test(candidate)) {
      addError(accumulator, "absolute_local_path_forbidden", candidatePath, "Absolute local paths are forbidden.", true);
    }
  });
}

function requireNonEmptyRefArray(
  value: unknown,
  path: string,
  code: string,
  accumulator: EligibilityAccumulator,
): unknown[] {
  const refs = arrayAt(value, path, accumulator);
  refs.forEach((ref, index) => validateExternalRefStructureV01(ref, `${path}[${index}]`, issueSink(accumulator)));
  if (refs.length === 0) {
    addError(
      accumulator,
      code,
      path,
      "Expected at least one ExternalRef.",
      true,
    );
  }
  if (refs.length > 64) addError(accumulator, "ref_collection_bound_exceeded", path, "Reference collection exceeds 64 items.", true);
  return refs;
}

function validateSha256(
  value: unknown,
  path: string,
  code: string,
  accumulator: EligibilityAccumulator,
) {
  const normalized = protocolStringValueV01(value);
  if (!normalized || !/^sha256:[a-f0-9]{64}$/.test(normalized)) {
    addError(accumulator, code, path, "Expected a SHA-256 fingerprint.", true);
  }
}

function requireString(
  record: ProtocolJsonRecordV01,
  field: string,
  path: string,
  accumulator: EligibilityAccumulator,
) {
  const value = protocolStringValueV01(record[field]);
  if (!value) addError(accumulator, `${field}_missing`, `${path}.${field}`, `${field} must be a non-empty string.`, true);
  return value;
}

function requireTimestamp(
  value: unknown,
  path: string,
  accumulator: EligibilityAccumulator,
) {
  const parsed = parseStrictIsoTimestampV01(value);
  if (parsed === null) addError(accumulator, "timestamp_invalid", path, "Expected a valid ISO timestamp.", true);
  return parsed;
}

function recordAt(
  value: unknown,
  path: string,
  accumulator: EligibilityAccumulator,
): ProtocolJsonRecordV01 | null {
  if (isProtocolRecordV01(value)) return value;
  addError(accumulator, "object_malformed", path, "Expected an object.", true);
  return null;
}

function arrayAt(
  value: unknown,
  path: string,
  accumulator: EligibilityAccumulator,
): unknown[] {
  if (Array.isArray(value)) return value;
  addError(accumulator, "array_malformed", path, "Expected an array.", true);
  return [];
}

function rejectUnknownNestedKeys(
  record: ProtocolJsonRecordV01,
  allowed: ReadonlySet<string>,
  path: string,
  accumulator: EligibilityAccumulator,
) {
  rejectUnknownProtocolKeysV01(record, allowed, path, issueSink(accumulator), "unknown_eligibility_nested_field", true);
}

function walk(
  value: unknown,
  path: string,
  visit: (value: unknown, path: string) => void,
) {
  visit(value, path);
  if (Array.isArray(value)) value.forEach((item, index) => walk(item, `${path}[${index}]`, visit));
  else if (isProtocolRecordV01(value)) for (const [key, child] of Object.entries(value)) walk(child, `${path}.${key}`, visit);
}

function createAccumulator(): EligibilityAccumulator {
  return { errors: [], warnings: [], blocked: false };
}

function issueSink(accumulator: EligibilityAccumulator) {
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
  accumulator: EligibilityAccumulator,
  code: string,
  path: string | null,
  message: string,
  blocked = false,
) {
  accumulator.errors.push({ severity: "error", code, path, message });
  if (blocked) accumulator.blocked = true;
}

type RelationAccumulator = {
  errors: StateTransitionReceiptValidationResultV01["errors"];
  warnings: StateTransitionReceiptValidationResultV01["warnings"];
  blocked: boolean;
};

function createRelationAccumulator(): RelationAccumulator {
  return { errors: [], warnings: [], blocked: false };
}

function addRelationError(
  accumulator: RelationAccumulator,
  code: string,
  path: string | null,
  message: string,
  blocked = false,
) {
  accumulator.errors.push({ severity: "error", code, path, message });
  if (blocked) accumulator.blocked = true;
}

function buildRelationResult(
  accumulator: RelationAccumulator,
  version: StateTransitionReceiptValidationResultV01["normalized_protocol_version"],
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
