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
import {
  compareStateTransitionReceiptReplayCompatibilityV01,
  validateStateTransitionReceiptV01,
} from "@/lib/vnext/state-transition-receipt";
import { validateTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type { EpisodeDeltaProposalV01 } from "@/types/vnext/episode-delta-proposal";
import type { ReviewDecisionV01 } from "@/types/vnext/review-decision";
import type {
  TaskContextPacketSelectedEntryV01,
  TaskContextPacketV01,
} from "@/types/vnext/task-context-packet";
import {
  STATE_TRANSITION_RECEIPT_OBSERVATION_TRUST_CLASSES_V01,
  STATE_TRANSITION_RECEIPT_OPERATIONS_V01,
  type StateTransitionAuthorizedAfterStateV01,
  type StateTransitionCurrentStateObservationV01,
  type StateTransitionEligibilityEvaluationInputV01,
  type StateTransitionEligibilityExpectedEffectV01,
  type StateTransitionEligibilityIssueV01,
  type StateTransitionEligibilityResultV01,
  type StateTransitionGateAuthorizedEffectV01,
  type StateTransitionReceiptStateSnapshotV01,
  type StateTransitionReceiptObservationTrustClassV01,
  type StateTransitionReceiptV01,
  type StateTransitionReceiptValidationResultV01,
  type StateTransitionSemanticCommitGateEvaluationV01,
  type TaskContextPacketTransitionRelationIssueV01,
  type TaskContextPacketTransitionRelationResultV01,
} from "@/types/vnext/state-transition-receipt";

const allowedEvaluationInputKeys = new Set([
  "proposal",
  "decision",
  "current_state_observations",
  "semantic_commit_gate_evaluation",
  "prior_review_decisions",
  "prior_state_transition_receipts",
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
  "authorized_applier_ref",
  "authorized_effects",
  "evaluation_ref",
  "evaluated_at",
  "expires_at",
  "source_refs",
]);
const allowedGateAuthorizedEffectKeys = new Set([
  "target_ref",
  "operation",
  "expected_after_state",
]);
const allowedAuthorizedAfterStateKeys = new Set([
  "presence",
  "state_fingerprint",
  "state_ref_rule",
]);
const allowedExactStateRefRuleKeys = new Set(["mode", "state_ref"]);
const allowedWriterAllocatedStateRefRuleKeys = new Set([
  "mode",
  "ref_type",
  "compatibility_namespace",
  "trust_class",
]);
const proofTrustClasses = new Set<string>(
  STATE_TRANSITION_RECEIPT_OBSERVATION_TRUST_CLASSES_V01,
);
const gateStatuses = new Set(["authorized", "denied", "unknown"]);
const currentStatePresences = new Set(["absent", "present", "unknown"]);
const effectOperations = new Set<string>(
  STATE_TRANSITION_RECEIPT_OPERATIONS_V01,
);
const STATE_TRANSITION_RECEIPT_LINEAGE_NAMESPACE_V01 =
  "augnes.vnext.state-transition-receipt.v0.1";

type EligibilityAccumulator = {
  errors: StateTransitionEligibilityIssueV01[];
  warnings: StateTransitionEligibilityIssueV01[];
  blocked: boolean;
};

export interface StateTransitionReceiptEligibilityRelationInputV01
  extends StateTransitionEligibilityEvaluationInputV01 {
  receipt: unknown;
}

export interface StateTransitionFullChainValidationInputV01
  extends StateTransitionEligibilityEvaluationInputV01 {
  receipt: unknown;
  prior_packet: unknown;
  later_packet: unknown;
}

interface ResolvedAppliedLineageV01 {
  prior_decision: ReviewDecisionV01;
  prior_receipt: StateTransitionReceiptV01;
  receipt_ref: ExternalRefV01;
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
      prior_review_decisions: normalizePriorReviewDecisionsForHash(
        input.prior_review_decisions,
      ),
      prior_state_transition_receipts:
        normalizePriorStateTransitionReceiptsForHash(
          input.prior_state_transition_receipts,
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
  scanEligibilityMaterial(
    priorLineageMaterialForScan(input.prior_review_decisions),
    "$.prior_review_decisions",
    accumulator,
  );
  scanEligibilityMaterial(
    priorLineageMaterialForScan(input.prior_state_transition_receipts),
    "$.prior_state_transition_receipts",
    accumulator,
  );
  scanAbsoluteLocalPaths(input.current_state_observations, "$.current_state_observations", accumulator);
  scanAbsoluteLocalPaths(input.semantic_commit_gate_evaluation, "$.semantic_commit_gate_evaluation", accumulator);
  scanAbsoluteLocalPaths(input.prior_review_decisions, "$.prior_review_decisions", accumulator);
  scanAbsoluteLocalPaths(input.prior_state_transition_receipts, "$.prior_state_transition_receipts", accumulator);

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

  const priorDecisions = validatePriorReviewDecisions(
    input.prior_review_decisions,
    accumulator,
  );
  const priorReceipts = validatePriorStateTransitionReceipts(
    input.prior_state_transition_receipts,
    accumulator,
  );

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
  const appliedLineage = validateAppliedLineage(
    decisionValue,
    typedProposal,
    typedDecision,
    expectedTargets,
    observations,
    priorDecisions,
    priorReceipts,
    accumulator,
  );
  const expectedEffects = deriveExpectedEffects(
    decisionValue,
    expectedTargets,
    observations,
    gate?.authorized_effects ?? [],
    appliedLineage,
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
    prior_review_decisions: input.prior_review_decisions,
    prior_state_transition_receipts:
      input.prior_state_transition_receipts,
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
  if (
    receiptValidation.status !== "valid" ||
    !isProtocolRecordV01(input.receipt)
  ) {
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
  if (protocolStringValueV01(gate.status) !== "authorized") {
    addRelationError(accumulator, "gate_status_mismatch", "$.semantic_commit_gate.status", "Applied receipt requires the exact authorized gate.", true);
  }
  exactRef(receipt.semantic_commit_gate.evaluation_ref, gate.evaluation_ref, "gate_evaluation_ref_mismatch", "$.semantic_commit_gate.evaluation_ref", accumulator);
  exactText(receipt.semantic_commit_gate.evaluated_at, gate.evaluated_at, "gate_evaluated_at_mismatch", "$.semantic_commit_gate.evaluated_at", accumulator);
  exactText(receipt.semantic_commit_gate.expires_at, gate.expires_at, "gate_expires_at_mismatch", "$.semantic_commit_gate.expires_at", accumulator);
  exactRef(
    receipt.applied_by_ref,
    gate.authorized_applier_ref,
    "applied_by_not_authorized",
    "$.applied_by_ref",
    accumulator,
  );

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
    validateReceiptAfterStateRequirement(
      effect.after_state,
      expected.expected_after_state,
      `${path}.after_state`,
      accumulator,
    );
    for (const lineageRef of expected.lineage_refs) {
      if (!containsExactRef(effect.source_refs, lineageRef)) {
        addRelationError(
          accumulator,
          "effect_applied_lineage_ref_missing",
          `${path}.source_refs`,
          "Supersede and retract effects must preserve the exact prior applied receipt lineage.",
          true,
        );
      }
      if (!containsExactRef(receipt.source_refs, lineageRef)) {
        addRelationError(
          accumulator,
          "receipt_applied_lineage_ref_missing",
          "$.source_refs",
          "StateTransitionReceipt must preserve the exact prior applied receipt lineage.",
          true,
        );
      }
    }
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

export function createStateTransitionReceiptLineageRefV01(
  receipt: StateTransitionReceiptV01,
): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: "state_transition_receipt",
    external_id: receipt.transition_receipt_id,
    trust_class: "derived_interpretation",
    observed_at: receipt.recorded_at,
    source_ref: receipt.integrity.fingerprint,
    compatibility_namespace:
      STATE_TRANSITION_RECEIPT_LINEAGE_NAMESPACE_V01,
  };
}

/**
 * Validates packet postconditions for a self-consistent applied receipt.
 *
 * This low-level relation does not establish that the receipt preserves an
 * eligible ReviewDecision or gate-authorized result. Future consumers must use
 * validateSemanticTransitionFullChainV01 before accepting receipt-derived
 * context changes.
 */
export function validateTaskContextPacketTransitionRelationV01(
  priorPacketInput: unknown,
  receiptInput: unknown,
  laterPacketInput: unknown,
): TaskContextPacketTransitionRelationResultV01 {
  const accumulator = createPacketRelationAccumulator();
  const priorPacket = isProtocolRecordV01(priorPacketInput)
    ? (priorPacketInput as unknown as TaskContextPacketV01)
    : null;
  const laterPacket = isProtocolRecordV01(laterPacketInput)
    ? (laterPacketInput as unknown as TaskContextPacketV01)
    : null;
  const receipt = isProtocolRecordV01(receiptInput)
    ? (receiptInput as unknown as StateTransitionReceiptV01)
    : null;
  let priorPacketValid = false;
  let laterPacketValid = false;
  let receiptValid = false;

  if (!priorPacket) {
    addPacketRelationError(
      accumulator,
      "prior_packet_malformed",
      "$.prior_packet",
      "Prior TaskContextPacket must be an object.",
    );
  } else {
    const validation = validateTaskContextPacketV01(priorPacket, {
      evaluated_at: priorPacket.generated_at,
    });
    if (validation.status !== "valid") {
      addPacketRelationError(
        accumulator,
        "prior_packet_invalid",
        "$.prior_packet",
        "Prior TaskContextPacket must validate independently.",
      );
    } else {
      priorPacketValid = true;
    }
  }
  if (!laterPacket) {
    addPacketRelationError(
      accumulator,
      "later_packet_malformed",
      "$.later_packet",
      "Later TaskContextPacket must be an object.",
    );
  } else {
    const validation = validateTaskContextPacketV01(laterPacket, {
      evaluated_at: laterPacket.generated_at,
    });
    if (validation.status !== "valid") {
      addPacketRelationError(
        accumulator,
        "later_packet_invalid",
        "$.later_packet",
        "Later TaskContextPacket must validate independently.",
      );
    } else {
      laterPacketValid = true;
    }
  }
  if (!receipt) {
    addPacketRelationError(
      accumulator,
      "transition_receipt_malformed",
      "$.transition_receipt",
      "StateTransitionReceipt must be an object.",
    );
  } else {
    const validation = validateStateTransitionReceiptV01(receipt);
    if (validation.status !== "valid") {
      addPacketRelationError(
        accumulator,
        "transition_receipt_invalid",
        "$.transition_receipt",
        "StateTransitionReceipt must validate independently.",
      );
    } else {
      receiptValid = true;
    }
  }
  if (
    !priorPacket ||
    !laterPacket ||
    !receipt ||
    !priorPacketValid ||
    !laterPacketValid ||
    !receiptValid
  ) {
    return buildPacketRelationResult(accumulator);
  }

  for (const [actual, expected, code, path] of [
    [priorPacket.workspace_id, receipt.workspace_id, "workspace_mismatch", "$.prior_packet.workspace_id"],
    [laterPacket.workspace_id, receipt.workspace_id, "workspace_mismatch", "$.later_packet.workspace_id"],
    [priorPacket.project_id, receipt.project_id, "project_mismatch", "$.prior_packet.project_id"],
    [laterPacket.project_id, receipt.project_id, "project_mismatch", "$.later_packet.project_id"],
  ] as const) {
    if (actual !== expected) {
      addPacketRelationError(
        accumulator,
        code,
        path,
        "TaskContextPacket and transition receipt identities must match.",
      );
    }
  }
  const laterGeneratedAt = parseStrictIsoTimestampV01(laterPacket.generated_at);
  const recordedAt = parseStrictIsoTimestampV01(receipt.recorded_at);
  if (
    laterGeneratedAt !== null &&
    recordedAt !== null &&
    laterGeneratedAt < recordedAt
  ) {
    addPacketRelationError(
      accumulator,
      "later_packet_precedes_transition_receipt",
      "$.later_packet.generated_at",
      "Later TaskContextPacket cannot predate receipt recording.",
    );
  }

  const receiptRef = createStateTransitionReceiptLineageRefV01(receipt);
  const exactLineage = laterPacket.compatibility.source_refs.some(
    (ref) => canonicalExternalRef(ref) === canonicalExternalRef(receiptRef),
  );
  if (!exactLineage) {
    const identityPresent = laterPacket.compatibility.source_refs.some(
      (ref) => externalRefIdentity(ref) === externalRefIdentity(receiptRef),
    );
    addPacketRelationError(
      accumulator,
      identityPresent
        ? "transition_receipt_lineage_provenance_mismatch"
        : "transition_receipt_lineage_missing",
      "$.later_packet.compatibility.source_refs",
      "Later TaskContextPacket must preserve the exact receipt ID and fingerprint lineage.",
    );
  }

  const acceptedEntries = laterPacket.selected_context.filter(
    (entry) => entry.entry_kind === "accepted_state_ref",
  );
  const acceptedSelectionKeys = new Set<string>();
  for (const [index, entry] of acceptedEntries.entries()) {
    const key = selectedStateKey(entry);
    if (acceptedSelectionKeys.has(key)) {
      addPacketRelationError(
        accumulator,
        "duplicate_accepted_state_selection",
        `$.later_packet.selected_context[${index}]`,
        "Accepted state selection must not contain duplicate state snapshots.",
      );
    }
    acceptedSelectionKeys.add(key);
  }

  const affectedBeforeSnapshotKeys = new Set<string>();
  const expectedAfterSelectionKeys = new Set<string>();
  const expectedRetractionExclusionKeys = new Set<string>();
  let hasCreateEffect = false;
  for (const [effectIndex, effect] of receipt.effects.entries()) {
    const afterState = effect.after_state;
    if (afterState.presence === "present") {
      const matchingEntries = acceptedEntries.filter(
        (entry) =>
          externalRefIdentity(entry.external_ref) ===
          externalRefIdentity(afterState.state_ref),
      );
      const exactEntry = matchingEntries.find((entry) =>
        selectedEntryMatchesAppliedState(
          entry,
          afterState.state_ref,
          afterState.state_fingerprint,
          effect.after_application_observation_ref,
          receiptRef,
        ),
      );
      if (!exactEntry) {
        addPacketRelationError(
          accumulator,
          matchingEntries.length > 0
            ? "applied_after_state_provenance_mismatch"
            : "applied_after_state_missing",
          `$.later_packet.selected_context`,
          "Every present after-state must be selected with exact receipt and observation provenance.",
        );
      } else {
        expectedAfterSelectionKeys.add(
          selectedStateKey(exactEntry),
        );
      }
    }
    const beforeState = effect.before_state;
    if (beforeState.presence === "present") {
      const beforeIdentity = externalRefIdentity(
        beforeState.state_ref,
      );
      const beforeSnapshotKey = `${canonicalExternalRef(beforeState.state_ref)}|${beforeState.state_fingerprint}`;
      affectedBeforeSnapshotKeys.add(beforeSnapshotKey);
      const retained = acceptedEntries.some(
        (entry) =>
          selectedEntryMatchesSnapshot(
            entry,
            beforeState.state_ref,
            beforeState.state_fingerprint,
          ),
      );
      if (retained) {
        addPacketRelationError(
          accumulator,
          "retired_before_state_retained",
          "$.later_packet.selected_context",
          "Replaced, superseded, or retracted before-state must not remain selected.",
        );
      }
      const priorIncluded = priorPacket.selected_context.some((entry) =>
        selectedEntryMatchesSnapshot(
          entry,
          beforeState.state_ref,
          beforeState.state_fingerprint,
        ),
      );
      if (!priorIncluded) {
        addPacketRelationError(
          accumulator,
          "prior_before_state_missing",
          "$.prior_packet.selected_context",
          "Strict transition relation requires the present before-state in prior selected context.",
        );
      }
      if (effect.operation === "retract") {
        const identityMatches = laterPacket.excluded_context.filter(
          (entry) =>
            externalRefIdentity(entry.external_ref) === beforeIdentity,
        );
        const exactExclusion = identityMatches.some(
          (entry) =>
            canonicalExternalRef(entry.external_ref) ===
              canonicalExternalRef(beforeState.state_ref) &&
            entry.source_ref === beforeState.state_fingerprint &&
            canonicalExternalRef(entry.currentness.source_ref) ===
              canonicalExternalRef(receiptRef) &&
            entry.currentness.as_of === receiptRef.observed_at,
        );
        if (!exactExclusion) {
          addPacketRelationError(
            accumulator,
            identityMatches.length > 0
              ? "retracted_before_state_exclusion_provenance_mismatch"
              : "retracted_before_state_exclusion_missing",
            "$.later_packet.excluded_context",
            "Retracted before-state must be explicitly excluded with exact receipt provenance.",
          );
        } else {
          expectedRetractionExclusionKeys.add(
            `${canonicalExternalRef(beforeState.state_ref)}|${beforeState.state_fingerprint}`,
          );
        }
      }
    } else if (effect.operation === "create") {
      hasCreateEffect = true;
    }
    if (effectIndex >= 64) {
      addPacketRelationError(
        accumulator,
        "transition_effect_bound_exceeded",
        "$.transition_receipt.effects",
        "Transition effect traversal exceeded the v0.1 bound.",
      );
      break;
    }
  }

  for (const [index, entry] of laterPacket.excluded_context.entries()) {
    if (
      canonicalExternalRef(entry.currentness.source_ref) !==
      canonicalExternalRef(receiptRef)
    ) {
      continue;
    }
    const exclusionKey = `${canonicalExternalRef(entry.external_ref)}|${entry.source_ref ?? ""}`;
    if (!expectedRetractionExclusionKeys.has(exclusionKey)) {
      addPacketRelationError(
        accumulator,
        hasCreateEffect
          ? "create_before_state_exclusion_invented"
          : "unexpected_transition_exclusion",
        `$.later_packet.excluded_context[${index}]`,
        "Receipt-derived exclusions are allowed only for exact retracted before-state snapshots.",
      );
    }
  }

  const priorUnrelated = priorPacket.selected_context.filter(
    (entry) =>
      !affectedBeforeSnapshotKeys.has(selectedStateKey(entry)),
  );
  const laterUnrelated = laterPacket.selected_context.filter((entry) => {
    if (entry.entry_kind !== "accepted_state_ref") return true;
    return !expectedAfterSelectionKeys.has(selectedStateKey(entry));
  });
  if (
    canonicalizeProtocolValueV01(
      [...priorUnrelated].sort(compareProtocolCanonicalV01),
    ) !==
    canonicalizeProtocolValueV01(
      [...laterUnrelated].sort(compareProtocolCanonicalV01),
    )
  ) {
    addPacketRelationError(
      accumulator,
      "unrelated_selected_context_changed",
      "$.later_packet.selected_context",
      "Unrelated selected context must remain unchanged in the strict relation.",
    );
  }

  return buildPacketRelationResult(accumulator);
}

/**
 * Composes the complete non-writing transition acceptance boundary.
 * Validation does not apply state or mutate either TaskContextPacket.
 */
export function validateSemanticTransitionFullChainV01(
  input: StateTransitionFullChainValidationInputV01,
): TaskContextPacketTransitionRelationResultV01 {
  const accumulator = createPacketRelationAccumulator();
  const proposalValidation = validateEpisodeDeltaProposalV01(input.proposal);
  if (proposalValidation.status !== "valid") {
    addPacketRelationError(
      accumulator,
      "proposal_invalid",
      "$.proposal",
      "Full-chain validation requires a valid EpisodeDeltaProposal.",
    );
  }
  const decisionValidation = validateReviewDecisionV01(input.decision);
  if (decisionValidation.status !== "valid") {
    addPacketRelationError(
      accumulator,
      "decision_invalid",
      "$.decision",
      "Full-chain validation requires a valid ReviewDecision.",
    );
  }
  if (
    proposalValidation.status === "valid" &&
    decisionValidation.status === "valid"
  ) {
    const relation = validateReviewDecisionAgainstEpisodeDeltaProposalV01(
      input.decision,
      input.proposal,
    );
    if (relation.status !== "valid") {
      addPacketRelationError(
        accumulator,
        "decision_proposal_relation_invalid",
        "$.decision",
        "ReviewDecision must preserve the exact source proposal relation.",
      );
    }
  }
  const eligibilityInput: StateTransitionEligibilityEvaluationInputV01 = {
    proposal: input.proposal,
    decision: input.decision,
    current_state_observations: input.current_state_observations,
    semantic_commit_gate_evaluation:
      input.semantic_commit_gate_evaluation,
    prior_review_decisions: input.prior_review_decisions,
    prior_state_transition_receipts:
      input.prior_state_transition_receipts,
    evaluated_at: input.evaluated_at,
  };
  const eligibility =
    evaluateReviewDecisionStateTransitionEligibilityV01(eligibilityInput);
  if (eligibility.status !== "eligible") {
    addPacketRelationError(
      accumulator,
      "transition_not_eligible",
      "$.eligibility",
      "Full-chain validation requires eligible transition preconditions.",
    );
  }
  const receiptRelation = validateStateTransitionReceiptAgainstEligibilityV01(
    input,
  );
  if (receiptRelation.status !== "valid") {
    addPacketRelationError(
      accumulator,
      "transition_receipt_relation_invalid",
      "$.receipt",
      "StateTransitionReceipt must preserve the exact eligible transition relation.",
    );
    for (const issue of receiptRelation.errors) {
      addPacketRelationError(
        accumulator,
        issue.code,
        issue.path ? `$.receipt${issue.path.slice(1)}` : "$.receipt",
        issue.message,
      );
    }
  }
  const packetRelation = validateTaskContextPacketTransitionRelationV01(
    input.prior_packet,
    input.receipt,
    input.later_packet,
  );
  for (const issue of packetRelation.errors) {
    addPacketRelationError(
      accumulator,
      issue.code,
      issue.path,
      issue.message,
    );
  }
  accumulator.warnings.push(...packetRelation.warnings);
  return buildPacketRelationResult(accumulator);
}

function selectedEntryMatchesAppliedState(
  entry: TaskContextPacketSelectedEntryV01,
  stateRef: ExternalRefV01,
  stateFingerprint: string,
  observationRef: ExternalRefV01,
  receiptRef: ExternalRefV01,
): boolean {
  return (
    selectedEntryMatchesSnapshot(entry, stateRef, stateFingerprint) &&
    canonicalExternalRef(entry.currentness.source_ref) ===
      canonicalExternalRef(observationRef) &&
    entry.currentness.as_of === observationRef.observed_at &&
    canonicalExternalRef(entry.compatibility_source_ref) ===
      canonicalExternalRef(receiptRef)
  );
}

function selectedEntryMatchesSnapshot(
  entry: TaskContextPacketSelectedEntryV01,
  stateRef: ExternalRefV01,
  stateFingerprint: string,
): boolean {
  return (
    entry.entry_kind === "accepted_state_ref" &&
    canonicalExternalRef(entry.external_ref) ===
      canonicalExternalRef(stateRef) &&
    entry.source_ref === stateFingerprint &&
    entry.trust_class === stateRef.trust_class
  );
}

function selectedStateKey(entry: TaskContextPacketSelectedEntryV01): string {
  return `${canonicalExternalRef(entry.external_ref)}|${entry.source_ref ?? ""}`;
}

type PacketRelationAccumulator = {
  errors: TaskContextPacketTransitionRelationIssueV01[];
  warnings: TaskContextPacketTransitionRelationIssueV01[];
};

function createPacketRelationAccumulator(): PacketRelationAccumulator {
  return { errors: [], warnings: [] };
}

function addPacketRelationError(
  accumulator: PacketRelationAccumulator,
  code: string,
  path: string | null,
  message: string,
) {
  accumulator.errors.push({ severity: "error", code, path, message });
}

function buildPacketRelationResult(
  accumulator: PacketRelationAccumulator,
): TaskContextPacketTransitionRelationResultV01 {
  return {
    status: accumulator.errors.length === 0 ? "valid" : "blocked",
    errors: accumulator.errors,
    warnings: accumulator.warnings,
  };
}

function validatePriorReviewDecisions(
  value: unknown,
  accumulator: EligibilityAccumulator,
): ReviewDecisionV01[] {
  const values = arrayAt(value, "$.prior_review_decisions", accumulator);
  if (values.length > 64) {
    addError(
      accumulator,
      "prior_review_decision_collection_bound_exceeded",
      "$.prior_review_decisions",
      "At most 64 prior ReviewDecision payloads are supported.",
      true,
    );
  }
  const seen = new Map<string, string>();
  const valid: ReviewDecisionV01[] = [];
  values.slice(0, 64).forEach((item, index) => {
    const path = `$.prior_review_decisions[${index}]`;
    const validation = validateReviewDecisionV01(item);
    if (validation.status !== "valid" || !isProtocolRecordV01(item)) {
      addError(
        accumulator,
        "prior_review_decision_invalid",
        path,
        "Applied lineage requires independently valid prior ReviewDecision payloads.",
        true,
      );
      return;
    }
    const decision = item as unknown as ReviewDecisionV01;
    const prior = seen.get(decision.decision_id);
    if (prior !== undefined) {
      addError(
        accumulator,
        prior === decision.integrity.fingerprint
          ? "duplicate_prior_review_decision"
          : "conflicting_prior_review_decision",
        path,
        "Prior ReviewDecision identities must be unique and conflict-free.",
        true,
      );
    }
    seen.set(decision.decision_id, decision.integrity.fingerprint);
    valid.push(decision);
  });
  return valid.sort(compareProtocolCanonicalV01);
}

function validatePriorStateTransitionReceipts(
  value: unknown,
  accumulator: EligibilityAccumulator,
): StateTransitionReceiptV01[] {
  const values = arrayAt(
    value,
    "$.prior_state_transition_receipts",
    accumulator,
  );
  if (values.length > 64) {
    addError(
      accumulator,
      "prior_state_transition_receipt_collection_bound_exceeded",
      "$.prior_state_transition_receipts",
      "At most 64 prior StateTransitionReceipt payloads are supported.",
      true,
    );
  }
  const seen = new Map<string, string>();
  const valid: StateTransitionReceiptV01[] = [];
  values.slice(0, 64).forEach((item, index) => {
    const path = `$.prior_state_transition_receipts[${index}]`;
    const validation = validateStateTransitionReceiptV01(item);
    if (validation.status !== "valid" || !isProtocolRecordV01(item)) {
      addError(
        accumulator,
        "prior_state_transition_receipt_invalid",
        path,
        "Applied lineage requires independently valid prior StateTransitionReceipt payloads.",
        true,
      );
      return;
    }
    const receipt = item as unknown as StateTransitionReceiptV01;
    const prior = seen.get(receipt.transition_receipt_id);
    if (prior !== undefined) {
      addError(
        accumulator,
        prior === receipt.integrity.fingerprint
          ? "duplicate_prior_state_transition_receipt"
          : "conflicting_prior_state_transition_receipt",
        path,
        "Prior StateTransitionReceipt identities must be unique and conflict-free.",
        true,
      );
    }
    seen.set(receipt.transition_receipt_id, receipt.integrity.fingerprint);
    for (const priorReceipt of valid) {
      if (priorReceipt.idempotency_key !== receipt.idempotency_key) continue;
      const replay = compareStateTransitionReceiptReplayCompatibilityV01(
        priorReceipt,
        receipt,
      );
      if (replay.status === "conflicting_result") {
        addError(
          accumulator,
          "conflicting_prior_transition_result",
          path,
          "One prior transition intent cannot preserve conflicting applied results.",
          true,
        );
      }
    }
    valid.push(receipt);
  });
  return valid.sort(compareProtocolCanonicalV01);
}

function validateAppliedLineage(
  decisionValue: string | null,
  proposal: EpisodeDeltaProposalV01 | null,
  decision: ReviewDecisionV01 | null,
  expectedTargets: ExternalRefV01[],
  observations: StateTransitionCurrentStateObservationV01[],
  priorDecisions: ReviewDecisionV01[],
  priorReceipts: StateTransitionReceiptV01[],
  accumulator: EligibilityAccumulator,
): ResolvedAppliedLineageV01 | null {
  if (decisionValue !== "supersede" && decisionValue !== "retract") {
    if (priorDecisions.length > 0 || priorReceipts.length > 0) {
      addError(
        accumulator,
        "unexpected_prior_lineage_material",
        priorDecisions.length > 0
          ? "$.prior_review_decisions"
          : "$.prior_state_transition_receipts",
        "Accept, reject, and defer eligibility inputs require empty applied-lineage collections.",
        true,
      );
    }
    return null;
  }
  if (!proposal || !decision) return null;
  const sourceCandidate = proposal.proposed_deltas.find(
    (candidate) => candidate.candidate_id === decision.candidate.candidate_id,
  );
  if (!sourceCandidate) return null;
  if (decision.lineage.prior_decisions.length > 1) {
    addError(
      accumulator,
      "prior_decision_lineage_set_mismatch",
      "$.decision.lineage.prior_decisions",
      "v0.1 retract and supersede require exactly one declared prior decision binding.",
      true,
    );
  }
  if (priorDecisions.length > 1 || priorReceipts.length > 1) {
    addError(
      accumulator,
      "unexpected_prior_lineage_material",
      priorDecisions.length > 1
        ? "$.prior_review_decisions"
        : "$.prior_state_transition_receipts",
      "v0.1 eligibility accepts only the exact one-decision, one-receipt applied lineage set.",
      true,
    );
  }

  if (decisionValue === "supersede") {
    const supersedingBinding = decision.lineage.superseding_candidate;
    const supersedingCandidate = supersedingBinding
      ? proposal.proposed_deltas.find(
          (candidate) =>
            candidate.candidate_id === supersedingBinding.candidate_id,
        )
      : null;
    if (
      !supersedingCandidate ||
      !canonicalRefSetsEqual(
        sourceCandidate.target_refs,
        supersedingCandidate.target_refs,
      )
    ) {
      addError(
        accumulator,
        "supersede_target_set_mismatch",
        "$.decision.lineage.superseding_candidate",
        "v0.1 supersede requires source and replacement candidates to preserve the exact same canonical target set.",
      );
    }
  }

  const lineageBindings =
    decisionValue === "retract"
      ? decision.lineage.retracted_decision
        ? [decision.lineage.retracted_decision]
        : []
      : decision.lineage.prior_decisions;
  if (lineageBindings.length === 0) {
    addError(
      accumulator,
      "prior_review_decision_binding_missing",
      "$.decision.lineage.prior_decisions",
      "Retract and supersede eligibility require an explicit prior decision binding.",
    );
    return null;
  }

  const exactPriorDecisions = priorDecisions.filter((candidate) =>
    lineageBindings.some(
      (binding) =>
        binding.decision_id === candidate.decision_id &&
        binding.decision_fingerprint === candidate.integrity.fingerprint,
    ),
  );
  if (exactPriorDecisions.length === 0) {
    if (priorDecisions.length === 0) {
      addError(
        accumulator,
        "prior_review_decision_missing",
        "$.prior_review_decisions",
        "The exact prior ReviewDecision payload is required for applied lineage.",
      );
    } else {
      const identityMatch = priorDecisions.some((candidate) =>
        lineageBindings.some(
          (binding) => binding.decision_id === candidate.decision_id,
        ),
      );
      addError(
        accumulator,
        identityMatch
          ? "prior_review_decision_fingerprint_mismatch"
          : "prior_review_decision_binding_mismatch",
        "$.prior_review_decisions",
        "Supplied prior ReviewDecision payloads do not preserve the exact declared lineage.",
        true,
      );
    }
    return null;
  }
  const qualifying = exactPriorDecisions.filter(
    (candidate) =>
      candidate.candidate.candidate_id === decision.candidate.candidate_id &&
      candidate.candidate.candidate_fingerprint ===
        decision.candidate.candidate_fingerprint,
  );
  if (qualifying.length !== 1) {
    addError(
      accumulator,
      qualifying.length === 0
        ? "prior_review_decision_candidate_mismatch"
        : "prior_review_decision_ambiguous",
      "$.prior_review_decisions",
      "Applied lineage must resolve one prior decision for the exact source candidate.",
      true,
    );
    return null;
  }
  const priorDecision = qualifying[0]!;
  if (
    priorDecision.workspace_id !== proposal.workspace_id ||
    priorDecision.project_id !== proposal.project_id
  ) {
    addError(
      accumulator,
      "prior_review_decision_project_mismatch",
      "$.prior_review_decisions",
      "Prior ReviewDecision must remain in the exact workspace and project.",
      true,
    );
  }
  if (
    priorDecision.source_proposal.proposal_id !== proposal.proposal_id ||
    priorDecision.source_proposal.proposal_fingerprint !==
      proposal.integrity.fingerprint
  ) {
    addError(
      accumulator,
      "prior_review_decision_proposal_mismatch",
      "$.prior_review_decisions",
      "v0.1 applied lineage requires the exact same source proposal.",
      true,
    );
  }
  const priorRelation = validateReviewDecisionAgainstEpisodeDeltaProposalV01(
    priorDecision,
    proposal,
  );
  if (priorRelation.status !== "valid") {
    addError(
      accumulator,
      "prior_review_decision_relation_invalid",
      "$.prior_review_decisions",
      "Prior ReviewDecision must preserve a valid exact relation to the source proposal.",
      true,
    );
  }
  if (priorDecision.decision !== "accept") {
    addError(
      accumulator,
      "prior_review_decision_not_transitionable",
      "$.prior_review_decisions",
      "v0.1 retract and supersede lineage supports only a prior accept decision.",
    );
    return null;
  }
  const priorIntent = priorDecision.requested_transition_intent;
  if (
    !priorIntent ||
    priorIntent.transition_kind !== "semantic_candidate_apply" ||
    !canonicalRefSetsEqual(priorIntent.target_refs, expectedTargets)
  ) {
    addError(
      accumulator,
      "prior_review_decision_target_mismatch",
      "$.prior_review_decisions",
      "Prior accept intent must preserve the exact transition target set.",
      true,
    );
  }
  const priorDecidedAt = parseStrictIsoTimestampV01(priorDecision.decided_at);
  const currentDecidedAt = parseStrictIsoTimestampV01(decision.decided_at);
  if (
    priorDecidedAt !== null &&
    currentDecidedAt !== null &&
    priorDecidedAt > currentDecidedAt
  ) {
    addError(
      accumulator,
      "prior_review_decision_time_mismatch",
      "$.prior_review_decisions",
      "Prior ReviewDecision cannot postdate the retract or supersede decision.",
      true,
    );
  }

  const matchingReceipts = priorReceipts.filter(
    (receipt) =>
      receipt.source_decision.decision_id === priorDecision.decision_id &&
      receipt.source_decision.decision_fingerprint ===
        priorDecision.integrity.fingerprint,
  );
  if (matchingReceipts.length === 0) {
    if (priorReceipts.length === 0) {
      addError(
        accumulator,
        "prior_state_transition_receipt_missing",
        "$.prior_state_transition_receipts",
        "Prior accept lineage requires an actual applied StateTransitionReceipt payload.",
      );
    } else {
      addError(
        accumulator,
        "prior_state_transition_receipt_decision_mismatch",
        "$.prior_state_transition_receipts",
        "Prior receipt must bind the exact prior accept decision.",
        true,
      );
    }
    return null;
  }
  if (matchingReceipts.length !== 1) {
    addError(
      accumulator,
      "prior_state_transition_receipt_ambiguous",
      "$.prior_state_transition_receipts",
      "Applied lineage must resolve exactly one prior receipt.",
      true,
    );
    return null;
  }
  const priorReceipt = matchingReceipts[0]!;
  if (
    priorReceipt.workspace_id !== proposal.workspace_id ||
    priorReceipt.project_id !== proposal.project_id
  ) {
    addError(
      accumulator,
      "prior_state_transition_receipt_project_mismatch",
      "$.prior_state_transition_receipts",
      "Prior receipt must remain in the exact workspace and project.",
      true,
    );
  }
  if (
    priorReceipt.source_proposal.proposal_id !== proposal.proposal_id ||
    priorReceipt.source_proposal.proposal_fingerprint !==
      proposal.integrity.fingerprint
  ) {
    addError(
      accumulator,
      "prior_state_transition_receipt_proposal_mismatch",
      "$.prior_state_transition_receipts",
      "Prior receipt must bind the exact source proposal.",
      true,
    );
  }
  if (
    priorReceipt.source_candidate.candidate_id !==
      decision.candidate.candidate_id ||
    priorReceipt.source_candidate.candidate_fingerprint !==
      decision.candidate.candidate_fingerprint
  ) {
    addError(
      accumulator,
      "prior_state_transition_receipt_candidate_mismatch",
      "$.prior_state_transition_receipts",
      "Prior receipt must bind the exact source candidate.",
      true,
    );
  }
  if (
    !priorIntent ||
    priorReceipt.requested_transition_intent.intent_id !==
      priorIntent.intent_id ||
    priorReceipt.requested_transition_intent.transition_kind !==
      priorIntent.transition_kind ||
    !canonicalRefSetsEqual(
      priorReceipt.requested_transition_intent.target_refs,
      expectedTargets,
    )
  ) {
    addError(
      accumulator,
      "prior_state_transition_receipt_target_mismatch",
      "$.prior_state_transition_receipts",
      "Prior receipt must preserve the exact prior intent and target set.",
      true,
    );
  }
  if (
    !canonicalRefSetsEqual(
      priorReceipt.effects.map((effect) => effect.target_ref),
      expectedTargets,
    ) ||
    priorReceipt.effects.some((effect) => effect.after_state.presence !== "present")
  ) {
    addError(
      accumulator,
      "prior_state_transition_receipt_effect_mismatch",
      "$.prior_state_transition_receipts",
      "Prior receipt must provide one present applied after-state for every target.",
      true,
    );
  }
  const priorAppliedAt = parseStrictIsoTimestampV01(priorReceipt.applied_at);
  const priorRecordedAt = parseStrictIsoTimestampV01(priorReceipt.recorded_at);
  if (
    priorDecidedAt !== null &&
    priorAppliedAt !== null &&
    priorAppliedAt < priorDecidedAt
  ) {
    addError(
      accumulator,
      "prior_receipt_precedes_prior_decision",
      "$.prior_state_transition_receipts",
      "Prior receipt cannot predate its source decision.",
      true,
    );
  }
  if (
    currentDecidedAt !== null &&
    priorRecordedAt !== null &&
    priorRecordedAt > currentDecidedAt
  ) {
    addError(
      accumulator,
      "prior_receipt_postdates_current_decision",
      "$.prior_state_transition_receipts",
      "Retract or supersede decision cannot predate the applied lineage it changes.",
      true,
    );
  }

  const observationsByTarget = new Map(
    observations.map((observation) => [
      canonicalExternalRef(observation.target_ref),
      observation,
    ]),
  );
  for (const effect of priorReceipt.effects) {
    if (effect.after_state.presence !== "present") continue;
    const observation = observationsByTarget.get(
      canonicalExternalRef(effect.target_ref),
    );
    if (!observation || observation.presence !== "present" || !observation.state_ref) {
      continue;
    }
    const sameRef =
      canonicalExternalRef(observation.state_ref) ===
      canonicalExternalRef(effect.after_state.state_ref);
    const sameFingerprint =
      observation.state_fingerprint === effect.after_state.state_fingerprint;
    if (!sameRef || !sameFingerprint) {
      const sameIdentity =
        externalRefIdentity(observation.state_ref) ===
        externalRefIdentity(effect.after_state.state_ref);
      addError(
        accumulator,
        sameIdentity && !sameRef
          ? "prior_applied_state_provenance_mismatch"
          : "prior_applied_state_not_current",
        "$.current_state_observations",
        "Current state must exactly equal the prior receipt's applied present after-state.",
        sameIdentity && !sameRef,
      );
    }
    const observedAt = parseStrictIsoTimestampV01(observation.observed_at);
    if (
      observedAt !== null &&
      priorRecordedAt !== null &&
      observedAt < priorRecordedAt
    ) {
      addError(
        accumulator,
        "current_state_precedes_prior_receipt",
        "$.current_state_observations",
        "Current-state observation must not predate prior receipt recording.",
        true,
      );
    }
  }
  return {
    prior_decision: priorDecision,
    prior_receipt: priorReceipt,
    receipt_ref: createStateTransitionReceiptLineageRefV01(priorReceipt),
  };
}

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
  const transitionKind = requireString(
    gate,
    "transition_kind",
    "$.semantic_commit_gate_evaluation",
    accumulator,
  );
  const targetRefs = requireNonEmptyRefArray(gate.target_refs, "$.semantic_commit_gate_evaluation.target_refs", "gate_target_required", accumulator);
  validateExternalRefStructureV01(gate.decision_actor_ref, "$.semantic_commit_gate_evaluation.decision_actor_ref", issueSink(accumulator));
  const authorizationRefs = requireNonEmptyRefArray(gate.authorization_basis_refs, "$.semantic_commit_gate_evaluation.authorization_basis_refs", "gate_authorization_basis_required", accumulator);
  validateExternalRefStructureV01(gate.gate_actor_ref, "$.semantic_commit_gate_evaluation.gate_actor_ref", issueSink(accumulator));
  validateExternalRefStructureV01(
    gate.authorized_applier_ref,
    "$.semantic_commit_gate_evaluation.authorized_applier_ref",
    issueSink(accumulator),
  );
  if (!isProtocolRecordV01(gate.authorized_applier_ref)) {
    addError(
      accumulator,
      "gate_authorized_applier_required",
      "$.semantic_commit_gate_evaluation.authorized_applier_ref",
      "Semantic commit gate must bind an explicit application actor.",
      true,
    );
  }
  const authorizedEffects = validateGateAuthorizedEffects(
    gate.authorized_effects,
    targetRefs,
    accumulator,
  );
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
  return {
    ...(gate as unknown as StateTransitionSemanticCommitGateEvaluationV01),
    status: (status ?? gate.status) as StateTransitionSemanticCommitGateEvaluationV01["status"],
    transition_kind: (transitionKind ?? gate.transition_kind) as StateTransitionSemanticCommitGateEvaluationV01["transition_kind"],
    authorized_effects: authorizedEffects,
  };
}

function validateGateAuthorizedEffects(
  value: unknown,
  expectedTargetValues: unknown[],
  accumulator: EligibilityAccumulator,
): StateTransitionGateAuthorizedEffectV01[] {
  const values = arrayAt(
    value,
    "$.semantic_commit_gate_evaluation.authorized_effects",
    accumulator,
  );
  if (values.length === 0) {
    addError(
      accumulator,
      "gate_authorized_effect_required",
      "$.semantic_commit_gate_evaluation.authorized_effects",
      "Authorized gate evaluation requires an outcome for every target.",
      true,
    );
  }
  if (values.length > 64) {
    addError(
      accumulator,
      "gate_authorized_effect_collection_bound_exceeded",
      "$.semantic_commit_gate_evaluation.authorized_effects",
      "Authorized effect collection exceeds 64 items.",
      true,
    );
  }
  const expectedTargets = new Set(
    expectedTargetValues.map(canonicalExternalRef).filter(Boolean),
  );
  const seenTargets = new Set<string>();
  const normalized: StateTransitionGateAuthorizedEffectV01[] = [];
  values.forEach((item, index) => {
    const path = `$.semantic_commit_gate_evaluation.authorized_effects[${index}]`;
    const effect = recordAt(item, path, accumulator);
    if (!effect) return;
    rejectUnknownNestedKeys(
      effect,
      allowedGateAuthorizedEffectKeys,
      path,
      accumulator,
    );
    validateExternalRefStructureV01(
      effect.target_ref,
      `${path}.target_ref`,
      issueSink(accumulator),
    );
    const targetKey = canonicalExternalRef(effect.target_ref);
    if (targetKey) {
      if (seenTargets.has(targetKey)) {
        addError(
          accumulator,
          "duplicate_gate_authorized_effect_target",
          `${path}.target_ref`,
          "Each target may have exactly one authorized effect outcome.",
          true,
        );
      }
      seenTargets.add(targetKey);
      if (expectedTargets.size > 0 && !expectedTargets.has(targetKey)) {
        addError(
          accumulator,
          "gate_authorized_effect_target_mismatch",
          `${path}.target_ref`,
          "Authorized effect target is outside the gate target set.",
          true,
        );
      }
    }
    const operation = protocolStringValueV01(effect.operation);
    if (!operation || !effectOperations.has(operation)) {
      addError(
        accumulator,
        "gate_authorized_effect_operation_invalid",
        `${path}.operation`,
        "Authorized effect operation must be create, replace, supersede, or retract.",
        true,
      );
    }
    const expectedAfterState = validateAuthorizedAfterState(
      effect.expected_after_state,
      operation,
      `${path}.expected_after_state`,
      accumulator,
    );
    if (
      targetKey &&
      operation &&
      effectOperations.has(operation) &&
      expectedAfterState
    ) {
      normalized.push({
        target_ref: normalizeExternalRefPrimitiveV01(
          effect.target_ref as unknown as ExternalRefV01,
        ),
        operation:
          operation as StateTransitionGateAuthorizedEffectV01["operation"],
        expected_after_state: expectedAfterState,
      });
    }
  });
  if (
    expectedTargets.size !== seenTargets.size ||
    [...expectedTargets].some((target) => !seenTargets.has(target))
  ) {
    addError(
      accumulator,
      "gate_authorized_effect_target_set_mismatch",
      "$.semantic_commit_gate_evaluation.authorized_effects",
      "Authorized effects must match the exact canonical gate target set.",
      true,
    );
  }
  return normalized.sort(compareProtocolCanonicalV01);
}

function validateAuthorizedAfterState(
  value: unknown,
  operation: string | null,
  path: string,
  accumulator: EligibilityAccumulator,
): StateTransitionAuthorizedAfterStateV01 | null {
  const state = recordAt(value, path, accumulator);
  if (!state) return null;
  rejectUnknownNestedKeys(
    state,
    allowedAuthorizedAfterStateKeys,
    path,
    accumulator,
  );
  if (state.presence === "absent") {
    if (state.state_fingerprint !== null || state.state_ref_rule !== null) {
      addError(
        accumulator,
        "authorized_after_state_invalid",
        path,
        "Authorized absent after-state requires null fingerprint and ref rule.",
        true,
      );
    }
    if (operation && operation !== "retract") {
      addError(
        accumulator,
        "gate_authorized_effect_operation_mismatch",
        path,
        `${operation} requires an authorized present after-state.`,
        true,
      );
    }
    return {
      presence: "absent",
      state_fingerprint: null,
      state_ref_rule: null,
    };
  }
  if (state.presence !== "present") {
    addError(
      accumulator,
      "authorized_after_state_invalid",
      `${path}.presence`,
      "Authorized after-state presence must be absent or present.",
      true,
    );
    return null;
  }
  validateSha256(
    state.state_fingerprint,
    `${path}.state_fingerprint`,
    "authorized_after_state_fingerprint_invalid",
    accumulator,
  );
  if (operation === "retract") {
    addError(
      accumulator,
      "gate_authorized_effect_operation_mismatch",
      path,
      "Retract requires an authorized absent after-state.",
      true,
    );
  }
  const rule = recordAt(state.state_ref_rule, `${path}.state_ref_rule`, accumulator);
  if (!rule) return null;
  if (rule.mode === "exact_identity") {
    rejectUnknownNestedKeys(
      rule,
      allowedExactStateRefRuleKeys,
      `${path}.state_ref_rule`,
      accumulator,
    );
    validateExternalRefStructureV01(
      rule.state_ref,
      `${path}.state_ref_rule.state_ref`,
      issueSink(accumulator),
    );
    if (!isProtocolRecordV01(rule.state_ref)) return null;
    if (rule.state_ref.observed_at != null || rule.state_ref.source_ref != null) {
      addError(
        accumulator,
        "authorized_state_ref_identity_provenance_forbidden",
        `${path}.state_ref_rule.state_ref`,
        "Exact state-ref authorization is an identity template and must not fabricate future observation provenance.",
        true,
      );
    }
    return {
      presence: "present",
      state_fingerprint: normalizeProtocolTextV01(
        state.state_fingerprint as string,
      ),
      state_ref_rule: {
        mode: "exact_identity",
        state_ref: normalizeExternalRefPrimitiveV01(
          rule.state_ref as unknown as ExternalRefV01,
        ),
      },
    };
  }
  if (rule.mode === "writer_allocated") {
    rejectUnknownNestedKeys(
      rule,
      allowedWriterAllocatedStateRefRuleKeys,
      `${path}.state_ref_rule`,
      accumulator,
    );
    const refType = protocolStringValueV01(rule.ref_type);
    const namespace = protocolStringValueV01(rule.compatibility_namespace);
    const trustClass = protocolStringValueV01(rule.trust_class);
    if (!refType) {
      addError(accumulator, "writer_allocated_ref_type_missing", `${path}.state_ref_rule.ref_type`, "Writer-allocated ref rule requires ref_type.", true);
    }
    if (!namespace) {
      addError(accumulator, "writer_allocated_namespace_missing", `${path}.state_ref_rule.compatibility_namespace`, "Writer-allocated ref rule requires a compatibility namespace.", true);
    }
    if (!trustClass || !proofTrustClasses.has(trustClass)) {
      addError(accumulator, "writer_allocated_trust_invalid", `${path}.state_ref_rule.trust_class`, "Writer-allocated state ref must require direct or verified observation trust.", true);
    }
    if (!refType || !namespace || !trustClass || !proofTrustClasses.has(trustClass)) {
      return null;
    }
    return {
      presence: "present",
      state_fingerprint: normalizeProtocolTextV01(
        state.state_fingerprint as string,
      ),
      state_ref_rule: {
        mode: "writer_allocated",
        ref_type: normalizeProtocolTextV01(refType),
        compatibility_namespace: normalizeProtocolTextV01(namespace),
        trust_class:
          trustClass as StateTransitionReceiptObservationTrustClassV01,
      },
    };
  }
  addError(
    accumulator,
    "authorized_state_ref_rule_invalid",
    `${path}.state_ref_rule.mode`,
    "Authorized state-ref rule must be exact_identity or writer_allocated.",
    true,
  );
  return null;
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
    const targetRef = isProtocolRecordV01(observation.target_ref)
      ? normalizeEligibilityExternalRef(observation.target_ref)
      : null;
    const targetCanonical = canonicalExternalRef(targetRef);
    const targetIdentity = externalRefIdentity(targetRef);
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
    const sourceRefs = requireNonEmptyRefArray(
      observation.source_refs,
      `${path}.source_refs`,
      "current_state_source_ref_required",
      accumulator,
    );
    validateDuplicateExternalRefsPrimitiveV01(observation, issueSink(accumulator));
    const normalizedObservedAt = protocolStringValueV01(
      observation.observed_at,
    );
    const normalizedObservationRef = isProtocolRecordV01(
      observation.observation_ref,
    )
      ? normalizeEligibilityExternalRef(observation.observation_ref)
      : null;
    const normalizedStateRef = isProtocolRecordV01(observation.state_ref)
      ? normalizeEligibilityExternalRef(observation.state_ref)
      : null;
    const normalizedStateFingerprint = protocolStringValueV01(
      observation.state_fingerprint,
    );
    if (
      targetRef &&
      presence &&
      currentStatePresences.has(presence) &&
      normalizedObservedAt &&
      normalizedObservationRef &&
      sourceRefs.length > 0 &&
      sourceRefs.every(isProtocolRecordV01) &&
      ((presence === "present" &&
        normalizedStateRef &&
        normalizedStateFingerprint) ||
        ((presence === "absent" || presence === "unknown") &&
          observation.state_ref === null &&
          observation.state_fingerprint === null))
    ) {
      valid.push({
        target_ref: targetRef,
        presence:
          presence as StateTransitionCurrentStateObservationV01["presence"],
        state_ref: presence === "present" ? normalizedStateRef : null,
        state_fingerprint:
          presence === "present" ? normalizedStateFingerprint : null,
        observed_at: normalizedObservedAt,
        observation_ref: normalizedObservationRef,
        source_refs: uniqueProtocolValuesV01(
          sourceRefs.map((ref) =>
            normalizeEligibilityExternalRef(ref),
          ),
        ).sort(compareExternalRefsV01),
      });
    }
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
  authorizedEffects: StateTransitionGateAuthorizedEffectV01[],
  appliedLineage: ResolvedAppliedLineageV01 | null,
  accumulator: EligibilityAccumulator,
): StateTransitionEligibilityExpectedEffectV01[] {
  const byTarget = new Map(
    observations.map((item) => [canonicalExternalRef(item.target_ref), item]),
  );
  const effects: StateTransitionEligibilityExpectedEffectV01[] = [];
  const authorizedByTarget = new Map(
    authorizedEffects.map((item) => [canonicalExternalRef(item.target_ref), item]),
  );
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
    const authorized = authorizedByTarget.get(canonicalExternalRef(target));
    if (!authorized) continue;
    if (authorized.operation !== operation) {
      addError(
        accumulator,
        "gate_authorized_effect_operation_mismatch",
        "$.semantic_commit_gate_evaluation.authorized_effects",
        "Authorized operation must match the decision and observed current state.",
        true,
      );
      continue;
    }
    if (
      (operation === "replace" || operation === "supersede") &&
      observation.presence === "present" &&
      authorized.expected_after_state.presence === "present" &&
      observation.state_fingerprint ===
        authorized.expected_after_state.state_fingerprint
    ) {
      addError(
        accumulator,
        "state_content_change_required",
        "$.semantic_commit_gate_evaluation.authorized_effects",
        `${operation} requires an authorized after-state content fingerprint that differs from the observed before-state.`,
      );
      continue;
    }
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
      expected_after_state: normalizeAuthorizedAfterState(
        authorized.expected_after_state,
      ),
      lineage_refs: appliedLineage
        ? [normalizeExternalRefPrimitiveV01(appliedLineage.receipt_ref)]
        : [],
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
      presence: protocolStringValueV01(item?.presence),
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

function normalizePriorReviewDecisionsForHash(
  values: ReviewDecisionV01[],
) {
  if (!Array.isArray(values)) return [];
  return values
    .map((decision) => ({
      decision_id: protocolStringValueV01(decision?.decision_id),
      decision_fingerprint: protocolStringValueV01(
        decision?.integrity?.fingerprint,
      ),
    }))
    .sort(compareProtocolCanonicalV01);
}

function normalizePriorStateTransitionReceiptsForHash(
  values: StateTransitionReceiptV01[],
) {
  if (!Array.isArray(values)) return [];
  return values
    .map((receipt) => ({
      transition_receipt_id: protocolStringValueV01(
        receipt?.transition_receipt_id,
      ),
      idempotency_key: protocolStringValueV01(receipt?.idempotency_key),
      receipt_fingerprint: protocolStringValueV01(
        receipt?.integrity?.fingerprint,
      ),
    }))
    .sort(compareProtocolCanonicalV01);
}

function normalizeAuthorizedAfterState(
  value: StateTransitionAuthorizedAfterStateV01,
): StateTransitionAuthorizedAfterStateV01 {
  if (value.presence === "absent") {
    return {
      presence: "absent",
      state_fingerprint: null,
      state_ref_rule: null,
    };
  }
  if (value.state_ref_rule.mode === "exact_identity") {
    return {
      presence: "present",
      state_fingerprint: normalizeProtocolTextV01(value.state_fingerprint),
      state_ref_rule: {
        mode: "exact_identity",
        state_ref: normalizeExternalRefPrimitiveV01(
          value.state_ref_rule.state_ref,
        ),
      },
    };
  }
  return {
    presence: "present",
    state_fingerprint: normalizeProtocolTextV01(value.state_fingerprint),
    state_ref_rule: {
      mode: "writer_allocated",
      ref_type: normalizeProtocolTextV01(value.state_ref_rule.ref_type),
      compatibility_namespace: normalizeProtocolTextV01(
        value.state_ref_rule.compatibility_namespace,
      ),
      trust_class: value.state_ref_rule.trust_class,
    },
  };
}

function normalizeGateForHash(
  gate: StateTransitionSemanticCommitGateEvaluationV01,
) {
  if (!gate || typeof gate !== "object") return gate ?? null;
  return {
    status: protocolStringValueV01(gate.status),
    workspace_id: protocolStringValueV01(gate.workspace_id),
    project_id: protocolStringValueV01(gate.project_id),
    decision_id: protocolStringValueV01(gate.decision_id),
    decision_fingerprint: protocolStringValueV01(gate.decision_fingerprint),
    intent_id: protocolStringValueV01(gate.intent_id),
    transition_kind: protocolStringValueV01(gate.transition_kind),
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
    authorized_applier_ref: safeNormalizeRef(gate.authorized_applier_ref),
    authorized_effects: Array.isArray(gate.authorized_effects)
      ? gate.authorized_effects
          .map((effect) => ({
            target_ref: safeNormalizeRef(effect?.target_ref),
            operation: protocolStringValueV01(effect?.operation),
            expected_after_state: effect?.expected_after_state
              ? normalizeAuthorizedAfterStateForHash(
                  effect.expected_after_state,
                )
              : null,
          }))
          .sort(compareProtocolCanonicalV01)
      : [],
    evaluation_ref: safeNormalizeRef(gate.evaluation_ref),
    evaluated_at: protocolStringValueV01(gate.evaluated_at),
    expires_at: protocolStringValueV01(gate.expires_at),
    source_refs: Array.isArray(gate.source_refs)
      ? gate.source_refs.map(safeNormalizeRef).sort(compareProtocolCanonicalV01)
      : [],
  };
}

function normalizeAuthorizedAfterStateForHash(value: unknown): unknown {
  if (!isProtocolRecordV01(value)) return value ?? null;
  const rule = isProtocolRecordV01(value.state_ref_rule)
    ? value.state_ref_rule
    : value.state_ref_rule ?? null;
  return {
    presence: protocolStringValueV01(value.presence),
    state_fingerprint: protocolStringValueV01(value.state_fingerprint),
    state_ref_rule: isProtocolRecordV01(rule)
      ? rule.mode === "exact_identity"
        ? {
            mode: "exact_identity",
            state_ref: safeNormalizeRef(rule.state_ref),
          }
        : {
            mode: protocolStringValueV01(rule.mode),
            ref_type: protocolStringValueV01(rule.ref_type),
            compatibility_namespace: protocolStringValueV01(
              rule.compatibility_namespace,
            ),
            trust_class: protocolStringValueV01(rule.trust_class),
          }
      : rule,
  };
}

function safeNormalizeRef(value: unknown): unknown {
  if (!isProtocolRecordV01(value)) return value ?? null;
  try {
    return normalizeEligibilityExternalRef(value);
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

function priorLineageMaterialForScan(value: unknown): unknown {
  if (!Array.isArray(value)) return value;
  return value.map((item) => {
    if (!isProtocolRecordV01(item)) return item;
    const { material_boundary: _validatedBoundary, ...material } = item;
    return material;
  });
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
    refs.map((ref) =>
      normalizeEligibilityExternalRef(
        ref as unknown as ProtocolJsonRecordV01,
      ),
    ),
  ).sort(compareExternalRefsV01);
}

function normalizeEligibilityExternalRef(
  value: ProtocolJsonRecordV01,
): ExternalRefV01 {
  const normalized = normalizeExternalRefPrimitiveV01(
    value as unknown as ExternalRefV01,
  );
  return {
    ...normalized,
    trust_class: (protocolStringValueV01(value.trust_class) ??
      normalized.trust_class) as ExternalRefV01["trust_class"],
  };
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

function canonicalRefSetsEqual(
  left: ExternalRefV01[],
  right: ExternalRefV01[],
): boolean {
  const leftSet = new Set(left.map(canonicalExternalRef));
  const rightSet = new Set(right.map(canonicalExternalRef));
  return (
    leftSet.size === rightSet.size &&
    [...leftSet].every((item) => rightSet.has(item))
  );
}

function containsExactRef(
  values: ExternalRefV01[],
  expected: ExternalRefV01,
): boolean {
  const canonical = canonicalExternalRef(expected);
  return values.some((value) => canonicalExternalRef(value) === canonical);
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

function externalRefAuthorizedIdentity(value: unknown): string {
  if (!isProtocolRecordV01(value)) return "";
  return canonicalizeProtocolValueV01({
    ref_version: protocolStringValueV01(value.ref_version),
    ref_type: protocolStringValueV01(value.ref_type),
    external_id: protocolStringValueV01(value.external_id),
    provider: protocolStringValueV01(value.provider),
    host: protocolStringValueV01(value.host),
    compatibility_namespace: protocolStringValueV01(
      value.compatibility_namespace,
    ),
    trust_class: protocolStringValueV01(value.trust_class),
  });
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

function validateReceiptAfterStateRequirement(
  actual: StateTransitionReceiptStateSnapshotV01,
  expected: StateTransitionAuthorizedAfterStateV01,
  path: string,
  accumulator: RelationAccumulator,
) {
  if (actual.presence !== expected.presence) {
    addRelationError(
      accumulator,
      "authorized_after_state_mismatch",
      `${path}.presence`,
      "Receipt after-state presence differs from the gate-authorized outcome.",
      true,
    );
    return;
  }
  if (expected.presence === "absent") {
    if (actual.state_ref !== null || actual.state_fingerprint !== null) {
      addRelationError(
        accumulator,
        "authorized_after_state_mismatch",
        path,
        "Authorized absent outcome requires an exact absent receipt snapshot.",
        true,
      );
    }
    return;
  }
  if (actual.presence !== "present") return;
  if (actual.state_fingerprint !== expected.state_fingerprint) {
    addRelationError(
      accumulator,
      "authorized_after_state_mismatch",
      `${path}.state_fingerprint`,
      "Receipt state content fingerprint differs from the authorized outcome.",
      true,
    );
  }
  const rule = expected.state_ref_rule;
  if (rule.mode === "exact_identity") {
    if (
      externalRefAuthorizedIdentity(actual.state_ref) !==
      externalRefAuthorizedIdentity(rule.state_ref)
    ) {
      addRelationError(
        accumulator,
        "authorized_after_state_ref_identity_mismatch",
        `${path}.state_ref`,
        "Receipt state-ref identity differs from the exact gate-authorized identity.",
        true,
      );
    }
    return;
  }
  if (
    actual.state_ref.ref_type !== rule.ref_type ||
    actual.state_ref.compatibility_namespace !==
      rule.compatibility_namespace ||
    actual.state_ref.trust_class !== rule.trust_class ||
    actual.state_ref.provider != null ||
    actual.state_ref.host != null
  ) {
    addRelationError(
      accumulator,
      "writer_allocated_state_ref_rule_mismatch",
      `${path}.state_ref`,
      "Writer-allocated state ref is outside the provider-free authorized identity rule.",
      true,
    );
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
