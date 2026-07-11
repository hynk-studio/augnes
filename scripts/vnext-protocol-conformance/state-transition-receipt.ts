import assert from "node:assert/strict";

import {
  genericStateTransitionEligibilityEvaluationInputFixture,
  genericStateTransitionReceiptInputFixture,
  genericStateTransitionReceiptAfterStateRefFixture,
  invalidStateTransitionEligibilityInputFixtureCases,
  invalidStateTransitionReceiptFixtureCases,
} from "@/fixtures/vnext/protocol/state-transition-receipt-v0-1";
import {
  genericCliDirectObservationProposalInputFixture,
} from "@/fixtures/vnext/protocol/episode-delta-proposal-v0-1";
import {
  acceptReviewDecisionInputFixture,
  retractReviewDecisionInputFixture,
  reviewDecisionMultiCandidateSourceProposal,
  supersedeReviewDecisionInputFixture,
} from "@/fixtures/vnext/protocol/review-decision-v0-1";
import {
  buildEpisodeDeltaProposalV01,
} from "@/lib/vnext/episode-delta-proposal";
import {
  createStateTransitionEligibilityPreconditionFingerprintV01,
  evaluateReviewDecisionStateTransitionEligibilityV01,
  validateStateTransitionReceiptAgainstEligibilityV01,
} from "@/lib/vnext/state-transition-eligibility";
import {
  buildReviewDecisionV01,
  createEpisodeDeltaCandidateFingerprintV01,
} from "@/lib/vnext/review-decision";
import {
  buildStateTransitionReceiptV01,
  canonicalizeStateTransitionReceiptValueV01,
  createStateTransitionReceiptFingerprintV01,
  createStateTransitionReceiptIdempotencyKeyV01,
  deriveStateTransitionEffectIdV01,
  deriveStateTransitionReceiptIdV01,
  STATE_TRANSITION_RECEIPT_REQUIRED_CORE_FIELDS_V01,
  validateStateTransitionReceiptV01,
} from "@/lib/vnext/state-transition-receipt";
import type {
  StateTransitionEligibilityEvaluationInputV01,
  StateTransitionEligibilityResultV01,
  StateTransitionReceiptV01,
} from "@/types/vnext/state-transition-receipt";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type { EpisodeDeltaProposalV01 } from "@/types/vnext/episode-delta-proposal";
import type { ReviewDecisionV01 } from "@/types/vnext/review-decision";

const FIXED_GENERIC_TRANSITION_RECEIPT_ID =
  "state-transition-receipt:6e2f5bc528a677eee743bebf";
const FIXED_GENERIC_IDEMPOTENCY_KEY =
  "sha256:73156c918536c96bd94b1f63331441b063cc6a27f28a49ae7b4f5661290d11de";
const FIXED_GENERIC_TRANSITION_RECEIPT_FINGERPRINT =
  "sha256:69c68fe60b078b95e8b01140bc298364fac898bf6210eec52f43e38b134581b1";
const FIXED_CANONICAL_ELIGIBILITY_PRECONDITION_FINGERPRINT =
  "sha256:0e23400277d3a89a564d0f0dd166dac9f29a19070c0bfd7f23c0b9b29082fd9d";

export interface StateTransitionReceiptConformanceSummaryV01 {
  suite: "state-transition-receipt-v0.1";
  status: "passed";
  positive_fixture_count: number;
  negative_fixture_count: number;
  eligibility_positive_fixture_count: number;
  eligibility_negative_fixture_count: number;
  receipt_relation_negative_fixture_count: number;
  generic_transition_receipt_id: string;
  generic_idempotency_key: string;
  generic_fingerprint: string;
  canonical_eligibility_precondition_fingerprint: string;
  deterministic_receipt_identity: true;
  deterministic_intent_idempotency: true;
  multi_target_effect_model_checked: true;
  explicit_state_presence_checked: true;
  operation_snapshot_matrix_checked: true;
  proof_grade_observation_refs_checked: true;
  gate_and_timestamp_rules_checked: true;
  exact_intent_target_binding_checked: true;
  strict_root_and_nested_schema_checked: true;
  bounded_material_boundary_checked: true;
  authority_fact_and_non_authority_checked: true;
  builder_input_immutability_checked: true;
  unordered_collection_normalization_checked: true;
  resigned_malformed_receipt_rejected: true;
  accept_absent_create_checked: true;
  accept_present_replace_checked: true;
  supersede_present_checked: true;
  retract_present_checked: true;
  reject_and_defer_ineligible_checked: true;
  exact_gate_and_current_state_binding_checked: true;
  partial_and_conflicting_target_admission_checked: true;
  receipt_eligibility_relation_checked: true;
  resigned_receipt_relation_mismatch_rejected: true;
  required_openai_specific_core_fields: 0;
  required_chatgpt_specific_core_fields: 0;
  required_codex_specific_core_fields: 0;
}

export function runStateTransitionReceiptConformanceV01(): StateTransitionReceiptConformanceSummaryV01 {
  const frozenInput = deepFreeze(clone(genericStateTransitionReceiptInputFixture));
  const inputBefore = canonicalizeStateTransitionReceiptValueV01(frozenInput);
  const receipt = buildStateTransitionReceiptV01(frozenInput);
  assert.equal(
    canonicalizeStateTransitionReceiptValueV01(frozenInput),
    inputBefore,
    "StateTransitionReceipt builder must not mutate its input.",
  );
  const validation = validateStateTransitionReceiptV01(receipt);
  assert.equal(validation.status, "valid", format(validation));

  assert.equal(
    receipt.transition_receipt_id,
    FIXED_GENERIC_TRANSITION_RECEIPT_ID,
  );
  assert.equal(receipt.idempotency_key, FIXED_GENERIC_IDEMPOTENCY_KEY);
  assert.equal(
    receipt.integrity.fingerprint,
    FIXED_GENERIC_TRANSITION_RECEIPT_FINGERPRINT,
  );

  assert.equal(receipt.transition_scope, "semantic_state");
  assert.equal(receipt.receipt_status, "applied");
  assert.deepEqual(receipt.atomicity, {
    mode: "all_or_nothing",
    all_effects_applied: true,
    partial_application: false,
  });
  assert.ok(receipt.effects.length > 0);
  assert.deepEqual(
    receipt.effects.map((effect) => effect.target_ref),
    receipt.requested_transition_intent.target_refs,
  );
  assert.equal(receipt.effects[0]?.operation, "create");
  assert.equal(receipt.effects[0]?.before_state.presence, "absent");
  assert.equal(receipt.effects[0]?.after_state.presence, "present");
  for (const ref of [
    receipt.semantic_commit_gate.evaluation_ref,
    ...receipt.effects.flatMap((effect) => [
      effect.before_state_observation_ref,
      effect.after_application_observation_ref,
      effect.durable_record_ref,
    ]),
  ]) {
    assert.ok(
      ref.trust_class === "direct_local_observation" ||
        ref.trust_class === "verified_external_observation",
    );
    assert.ok(ref.observed_at);
  }
  assert.equal(
    receipt.authority_summary.represents_applied_durable_semantic_transition,
    true,
  );
  for (const [key, value] of Object.entries(receipt.authority_summary)) {
    if (
      key === "notes" ||
      key === "represents_applied_durable_semantic_transition"
    ) {
      continue;
    }
    assert.equal(value, false, `${key} must remain false`);
  }

  const repeated = buildStateTransitionReceiptV01(
    deepFreeze(clone(genericStateTransitionReceiptInputFixture)),
  );
  assert.deepEqual(repeated, receipt);

  const unorderedInput = clone(genericStateTransitionReceiptInputFixture);
  unorderedInput.source_refs.push({
    ref_version: "external_ref.v0.1",
    ref_type: "synthetic_transition_source",
    external_id: "source:secondary",
    trust_class: "direct_local_observation",
    observed_at: unorderedInput.recorded_at,
  });
  unorderedInput.effects[0]!.source_refs.push({
    ref_version: "external_ref.v0.1",
    ref_type: "synthetic_effect_source",
    external_id: "source:effect-secondary",
    trust_class: "direct_local_observation",
    observed_at: unorderedInput.recorded_at,
  });
  unorderedInput.compatibility.warnings.push(
    "A second warning exercises unordered normalization.",
  );
  const normalized = buildStateTransitionReceiptV01(
    deepFreeze(clone(unorderedInput)),
  );
  reverseAllArrays(unorderedInput);
  const reordered = buildStateTransitionReceiptV01(
    deepFreeze(unorderedInput),
  );
  assert.deepEqual(reordered, normalized);

  const sameIntentDifferentResult = clone(
    genericStateTransitionReceiptInputFixture,
  );
  if (sameIntentDifferentResult.effects[0]?.after_state.presence !== "present") {
    throw new Error("Generic receipt fixture must have a present after-state.");
  }
  sameIntentDifferentResult.effects[0].after_state.state_fingerprint =
    `sha256:${"1".repeat(64)}`;
  sameIntentDifferentResult.effects[0].after_state.state_ref = {
    ...sameIntentDifferentResult.effects[0].after_state.state_ref,
    external_id: "semantic-state:protocol-foundation:v2",
    source_ref: `sha256:${"1".repeat(64)}`,
  };
  const differentResult = buildStateTransitionReceiptV01(
    deepFreeze(sameIntentDifferentResult),
  );
  assert.equal(differentResult.idempotency_key, receipt.idempotency_key);
  assert.notEqual(
    differentResult.transition_receipt_id,
    receipt.transition_receipt_id,
  );

  const maxBoundedInput = clone(genericStateTransitionReceiptInputFixture);
  maxBoundedInput.compatibility.warnings = ["x".repeat(2000)];
  const maxBounded = buildStateTransitionReceiptV01(
    deepFreeze(maxBoundedInput),
  );
  assert.equal(validateStateTransitionReceiptV01(maxBounded).status, "valid");
  const oversizedInput = clone(genericStateTransitionReceiptInputFixture);
  oversizedInput.compatibility.warnings = ["x".repeat(2001)];
  assert.throws(
    () => buildStateTransitionReceiptV01(deepFreeze(oversizedInput)),
    RangeError,
  );

  for (const invalidCase of invalidStateTransitionReceiptFixtureCases) {
    const invalid = invalidCase.mutate(receipt);
    const invalidValidation = validateStateTransitionReceiptV01(invalid);
    assert.equal(
      invalidValidation.status,
      invalidCase.expected_status,
      `${invalidCase.name}: ${format(invalidValidation)}`,
    );
    assert.ok(
      invalidValidation.errors.some(
        (issue) => issue.code === invalidCase.expected_error_code,
      ),
      `${invalidCase.name} must report ${invalidCase.expected_error_code}: ${format(invalidValidation)}`,
    );
  }

  const resignedMalformed = clone(receipt);
  resignedMalformed.effects[0]!.operation = "replace";
  resign(resignedMalformed);
  const resignedMalformedValidation =
    validateStateTransitionReceiptV01(resignedMalformed);
  assert.equal(resignedMalformedValidation.status, "blocked");
  assert.ok(
    resignedMalformedValidation.errors.some(
      (issue) => issue.code === "operation_snapshot_mismatch",
    ),
  );
  assertIntegrityChecksPassed(resignedMalformedValidation);

  const resignedAuthorityClaim = clone(receipt);
  resignedAuthorityClaim.authority_summary.grants_future_transition_authority =
    true as false;
  resign(resignedAuthorityClaim);
  const resignedAuthorityValidation =
    validateStateTransitionReceiptV01(resignedAuthorityClaim);
  assert.equal(resignedAuthorityValidation.status, "blocked");
  assert.ok(
    resignedAuthorityValidation.errors.some(
      (issue) => issue.code === "authority_boundary_violation",
    ),
  );
  assertIntegrityChecksPassed(resignedAuthorityValidation);

  const eligibilityInput = deepFreeze(
    clone(genericStateTransitionEligibilityEvaluationInputFixture),
  );
  const eligibilityInputBefore = JSON.stringify(eligibilityInput);
  const acceptAbsentEligibility =
    evaluateReviewDecisionStateTransitionEligibilityV01(eligibilityInput);
  assert.equal(
    JSON.stringify(eligibilityInput),
    eligibilityInputBefore,
    "Eligibility evaluation must not mutate its input.",
  );
  assertEligibilityOperation(
    "accept with observed absent state",
    acceptAbsentEligibility,
    "create",
  );
  assert.equal(
    acceptAbsentEligibility.precondition_fingerprint,
    createStateTransitionEligibilityPreconditionFingerprintV01(
      eligibilityInput,
    ),
  );
  assert.equal(
    acceptAbsentEligibility.precondition_fingerprint,
    FIXED_CANONICAL_ELIGIBILITY_PRECONDITION_FINGERPRINT,
  );

  const acceptPresentInput = eligibilityInputForDecision(
    eligibilityInput.proposal,
    eligibilityInput.decision,
    "present",
  );
  const acceptPresentEligibility =
    evaluateReviewDecisionStateTransitionEligibilityV01(acceptPresentInput);
  assertEligibilityOperation(
    "accept with observed present state",
    acceptPresentEligibility,
    "replace",
  );

  const supersedeDecision = buildReviewDecisionV01(
    clone(supersedeReviewDecisionInputFixture),
  );
  const supersedeInput = eligibilityInputForDecision(
    reviewDecisionMultiCandidateSourceProposal,
    supersedeDecision,
    "present",
  );
  const supersedeEligibility =
    evaluateReviewDecisionStateTransitionEligibilityV01(supersedeInput);
  assertEligibilityOperation(
    "supersede with observed present state",
    supersedeEligibility,
    "supersede",
  );

  const acceptedDecision = buildReviewDecisionV01(
    clone(acceptReviewDecisionInputFixture),
  );
  const retractDecision = buildReviewDecisionV01(
    retractReviewDecisionInputFixture(acceptedDecision),
  );
  const retractInput = eligibilityInputForDecision(
    eligibilityInput.proposal,
    retractDecision,
    "present",
  );
  const retractEligibility =
    evaluateReviewDecisionStateTransitionEligibilityV01(retractInput);
  assertEligibilityOperation(
    "retract with observed present state",
    retractEligibility,
    "retract",
  );

  for (const invalidCase of invalidStateTransitionEligibilityInputFixtureCases) {
    const invalidEligibility =
      evaluateReviewDecisionStateTransitionEligibilityV01(
        invalidCase.mutate(eligibilityInput),
      );
    assert.equal(
      invalidEligibility.status,
      invalidCase.expected_status,
      `${invalidCase.name}: ${format(invalidEligibility)}`,
    );
    assert.ok(
      invalidEligibility.errors.some(
        (issue) => issue.code === invalidCase.expected_error_code,
      ),
      `${invalidCase.name} must report ${invalidCase.expected_error_code}: ${format(invalidEligibility)}`,
    );
  }

  const gateBeforeDecisionInput = clone(
    genericStateTransitionEligibilityEvaluationInputFixture,
  );
  gateBeforeDecisionInput.semantic_commit_gate_evaluation.evaluated_at =
    "2026-07-10T12:14:00.000Z";
  gateBeforeDecisionInput.semantic_commit_gate_evaluation.evaluation_ref.observed_at =
    "2026-07-10T12:14:00.000Z";
  const gateBeforeDecision =
    evaluateReviewDecisionStateTransitionEligibilityV01(
      gateBeforeDecisionInput,
    );
  assert.equal(gateBeforeDecision.status, "blocked", format(gateBeforeDecision));
  assert.ok(
    gateBeforeDecision.errors.some(
      (issue) => issue.code === "gate_precedes_decision",
    ),
    format(gateBeforeDecision),
  );

  const multiTargetInput = createMultiTargetEligibilityInput();
  const multiTargetEligibility =
    evaluateReviewDecisionStateTransitionEligibilityV01(multiTargetInput);
  assert.equal(
    multiTargetEligibility.status,
    "eligible",
    format(multiTargetEligibility),
  );
  assert.equal(multiTargetEligibility.expected_effects.length, 2);
  assert.ok(
    multiTargetEligibility.expected_effects.every(
      (effect) => effect.operation === "create",
    ),
  );
  const reorderedMultiTargetInput = clone(multiTargetInput);
  reorderedMultiTargetInput.current_state_observations.reverse();
  reorderedMultiTargetInput.semantic_commit_gate_evaluation.target_refs.reverse();
  reorderedMultiTargetInput.semantic_commit_gate_evaluation.authorization_basis_refs.reverse();
  reorderedMultiTargetInput.semantic_commit_gate_evaluation.source_refs.reverse();
  const reorderedMultiTargetEligibility =
    evaluateReviewDecisionStateTransitionEligibilityV01(
      reorderedMultiTargetInput,
    );
  assert.deepEqual(reorderedMultiTargetEligibility, multiTargetEligibility);

  const partialMultiTargetInput = clone(multiTargetInput);
  partialMultiTargetInput.current_state_observations.pop();
  const partialMultiTarget =
    evaluateReviewDecisionStateTransitionEligibilityV01(
      partialMultiTargetInput,
    );
  assert.equal(partialMultiTarget.status, "blocked", format(partialMultiTarget));
  assert.ok(
    partialMultiTarget.errors.some(
      (issue) => issue.code === "partial_target_admission",
    ),
    format(partialMultiTarget),
  );

  const relationReceiptInput = clone(genericStateTransitionReceiptInputFixture);
  relationReceiptInput.eligibility_precondition_fingerprint =
    acceptAbsentEligibility.precondition_fingerprint;
  const relationReceipt = buildStateTransitionReceiptV01(
    deepFreeze(relationReceiptInput),
  );
  const validReceiptRelation =
    validateStateTransitionReceiptAgainstEligibilityV01({
      ...clone(genericStateTransitionEligibilityEvaluationInputFixture),
      receipt: relationReceipt,
    });
  assert.equal(
    validReceiptRelation.status,
    "valid",
    format(validReceiptRelation),
  );

  const receiptRelationCases = createReceiptRelationNegativeCases(
    relationReceipt,
  );
  for (const relationCase of receiptRelationCases) {
    const relation = validateStateTransitionReceiptAgainstEligibilityV01({
      ...clone(genericStateTransitionEligibilityEvaluationInputFixture),
      receipt: relationCase.receipt,
    });
    assert.equal(
      relation.status,
      "blocked",
      `${relationCase.name}: ${format(relation)}`,
    );
    assert.ok(
      relation.errors.some(
        (issue) => issue.code === relationCase.expectedCode,
      ),
      `${relationCase.name} must report ${relationCase.expectedCode}: ${format(relation)}`,
    );
    if (relationCase.resigned) assertIntegrityChecksPassed(relation);
  }

  const openAiFields = STATE_TRANSITION_RECEIPT_REQUIRED_CORE_FIELDS_V01.filter(
    (field) => /openai/i.test(field),
  );
  const chatGptFields = STATE_TRANSITION_RECEIPT_REQUIRED_CORE_FIELDS_V01.filter(
    (field) => /chatgpt/i.test(field),
  );
  const codexFields = STATE_TRANSITION_RECEIPT_REQUIRED_CORE_FIELDS_V01.filter(
    (field) => /codex/i.test(field),
  );
  assert.deepEqual([...openAiFields, ...chatGptFields, ...codexFields], []);

  return {
    suite: "state-transition-receipt-v0.1",
    status: "passed",
    positive_fixture_count: 4,
    negative_fixture_count: invalidStateTransitionReceiptFixtureCases.length + 2,
    eligibility_positive_fixture_count: 5,
    eligibility_negative_fixture_count:
      invalidStateTransitionEligibilityInputFixtureCases.length + 2,
    receipt_relation_negative_fixture_count: receiptRelationCases.length,
    generic_transition_receipt_id: receipt.transition_receipt_id,
    generic_idempotency_key: receipt.idempotency_key,
    generic_fingerprint: receipt.integrity.fingerprint,
    canonical_eligibility_precondition_fingerprint:
      acceptAbsentEligibility.precondition_fingerprint,
    deterministic_receipt_identity: true,
    deterministic_intent_idempotency: true,
    multi_target_effect_model_checked: true,
    explicit_state_presence_checked: true,
    operation_snapshot_matrix_checked: true,
    proof_grade_observation_refs_checked: true,
    gate_and_timestamp_rules_checked: true,
    exact_intent_target_binding_checked: true,
    strict_root_and_nested_schema_checked: true,
    bounded_material_boundary_checked: true,
    authority_fact_and_non_authority_checked: true,
    builder_input_immutability_checked: true,
    unordered_collection_normalization_checked: true,
    resigned_malformed_receipt_rejected: true,
    accept_absent_create_checked: true,
    accept_present_replace_checked: true,
    supersede_present_checked: true,
    retract_present_checked: true,
    reject_and_defer_ineligible_checked: true,
    exact_gate_and_current_state_binding_checked: true,
    partial_and_conflicting_target_admission_checked: true,
    receipt_eligibility_relation_checked: true,
    resigned_receipt_relation_mismatch_rejected: true,
    required_openai_specific_core_fields: 0,
    required_chatgpt_specific_core_fields: 0,
    required_codex_specific_core_fields: 0,
  };
}

function assertEligibilityOperation(
  name: string,
  result: StateTransitionEligibilityResultV01,
  operation: "create" | "replace" | "supersede" | "retract",
) {
  assert.equal(result.status, "eligible", `${name}: ${format(result)}`);
  assert.equal(result.errors.length, 0, `${name}: ${format(result)}`);
  assert.ok(result.expected_transition_kind);
  assert.ok(result.expected_target_refs.length > 0);
  assert.equal(result.expected_effects.length, result.expected_target_refs.length);
  assert.ok(
    result.expected_effects.every(
      (effect) => effect.operation === operation,
    ),
    `${name}: ${format(result)}`,
  );
}

function eligibilityInputForDecision(
  proposal: EpisodeDeltaProposalV01,
  decision: ReviewDecisionV01,
  presence: "absent" | "present",
): StateTransitionEligibilityEvaluationInputV01 {
  const base = clone(genericStateTransitionEligibilityEvaluationInputFixture);
  const intent = decision.requested_transition_intent;
  if (!intent) {
    throw new Error("Transitionable eligibility fixture requires intent.");
  }
  const observedAt = base.current_state_observations[0]!.observed_at;
  const baseObservationRef = base.current_state_observations[0]!.observation_ref;
  const currentStateObservations = intent.target_refs.map((target, index) => {
    const fingerprint = `sha256:${(index % 2 === 0 ? "1" : "2").repeat(64)}`;
    const observationRef: ExternalRefV01 = {
      ...clone(baseObservationRef),
      external_id: `current-state-observation:${decision.decision}:${index}`,
      source_ref: `sha256:${(index % 2 === 0 ? "3" : "4").repeat(64)}`,
    };
    return {
      target_ref: clone(target),
      presence,
      state_ref:
        presence === "present"
          ? {
              ...clone(genericStateTransitionReceiptAfterStateRefFixture),
              external_id: `semantic-state:before:${decision.decision}:${index}`,
              observed_at: observedAt,
              source_ref: fingerprint,
            }
          : null,
      state_fingerprint: presence === "present" ? fingerprint : null,
      observed_at: observedAt,
      observation_ref: observationRef,
      source_refs: [clone(observationRef)],
    };
  });
  const gate = clone(base.semantic_commit_gate_evaluation);
  gate.workspace_id = proposal.workspace_id;
  gate.project_id = proposal.project_id;
  gate.decision_id = decision.decision_id;
  gate.decision_fingerprint = decision.integrity.fingerprint;
  gate.intent_id = intent.intent_id;
  gate.transition_kind = intent.transition_kind;
  gate.target_refs = clone(intent.target_refs);
  gate.decision_actor_ref = clone(decision.actor_ref);
  gate.authorization_basis_refs = clone(decision.authorization_basis_refs);
  gate.source_refs = [clone(gate.evaluation_ref)];
  return {
    proposal: clone(proposal),
    decision: clone(decision),
    current_state_observations: currentStateObservations,
    semantic_commit_gate_evaluation: gate,
    evaluated_at: base.evaluated_at,
  };
}

function createMultiTargetEligibilityInput(): StateTransitionEligibilityEvaluationInputV01 {
  const proposalInput = clone(genericCliDirectObservationProposalInputFixture);
  const candidateInput = proposalInput.proposed_deltas[0]!;
  const firstTarget = candidateInput.target_refs[0]!;
  candidateInput.target_refs.push({
    ...clone(firstTarget),
    external_id: `${firstTarget.external_id}:secondary`,
  });
  const proposal = buildEpisodeDeltaProposalV01(proposalInput);
  const candidate = proposal.proposed_deltas[0]!;
  const decisionInput = clone(acceptReviewDecisionInputFixture);
  decisionInput.workspace_id = proposal.workspace_id;
  decisionInput.project_id = proposal.project_id;
  decisionInput.source_proposal = {
    proposal_version: proposal.proposal_version,
    proposal_id: proposal.proposal_id,
    proposal_fingerprint: proposal.integrity.fingerprint,
  };
  decisionInput.candidate = {
    candidate_id: candidate.candidate_id,
    candidate_fingerprint:
      createEpisodeDeltaCandidateFingerprintV01(candidate),
  };
  decisionInput.decision_basis_material_ids = clone(
    candidate.basis_material_ids,
  );
  decisionInput.decision_basis_refs = [clone(proposal.run_receipt_refs[0]!)];
  decisionInput.requested_transition_intent!.target_refs = clone(
    candidate.target_refs,
  );
  const decision = buildReviewDecisionV01(decisionInput);
  return eligibilityInputForDecision(proposal, decision, "absent");
}

function createReceiptRelationNegativeCases(
  source: StateTransitionReceiptV01,
) {
  const cases: Array<{
    name: string;
    receipt: StateTransitionReceiptV01;
    expectedCode: string;
    resigned: boolean;
  }> = [];
  const add = (
    name: string,
    expectedCode: string,
    mutate: (receipt: StateTransitionReceiptV01) => void,
  ) => {
    const receipt = clone(source);
    mutate(receipt);
    resign(receipt);
    cases.push({ name, receipt, expectedCode, resigned: true });
  };

  add(
    "resigned_precondition_fingerprint_mismatch",
    "precondition_fingerprint_mismatch",
    (receipt) => {
      receipt.eligibility_precondition_fingerprint = `sha256:${"0".repeat(64)}`;
    },
  );
  add("effect_missing", "effect_count_mismatch", (receipt) => {
    receipt.effects = [];
  });
  add(
    "effect_target_outside_decision",
    "effect_target_outside_decision",
    (receipt) => {
      const outsideRef: ExternalRefV01 = {
        ...clone(receipt.effects[0]!.target_ref),
        external_id: "target:outside-eligible-decision",
      };
      receipt.requested_transition_intent.target_refs = [clone(outsideRef)];
      receipt.effects[0]!.target_ref = outsideRef;
    },
  );
  add("effect_operation_mismatch", "effect_operation_mismatch", (receipt) => {
    const priorFingerprint = `sha256:${"6".repeat(64)}`;
    receipt.effects[0]!.operation = "replace";
    receipt.effects[0]!.before_state = {
      presence: "present",
      state_ref: {
        ...clone(genericStateTransitionReceiptAfterStateRefFixture),
        external_id: "semantic-state:relation-operation-mismatch",
        source_ref: priorFingerprint,
      },
      state_fingerprint: priorFingerprint,
    };
  });
  add("before_state_mismatch", "before_state_mismatch", (receipt) => {
    receipt.effects[0]!.before_state = clone(receipt.effects[0]!.after_state);
  });
  add(
    "before_state_observation_trust_upgrade",
    "before_state_observation_mismatch",
    (receipt) => {
      const original = receipt.effects[0]!.before_state_observation_ref;
      const upgraded: ExternalRefV01 = {
        ...clone(original),
        trust_class: "verified_external_observation",
      };
      receipt.effects[0]!.before_state_observation_ref = upgraded;
      receipt.effects[0]!.source_refs = replaceExactRef(
        receipt.effects[0]!.source_refs,
        original,
        upgraded,
      );
      receipt.source_refs = replaceExactRef(
        receipt.source_refs,
        original,
        upgraded,
      );
    },
  );
  add("gate_evaluation_ref_mismatch", "gate_evaluation_ref_mismatch", (receipt) => {
    receipt.semantic_commit_gate.evaluation_ref = {
      ...clone(receipt.semantic_commit_gate.evaluation_ref),
      external_id: "gate-evaluation:other-authorized-evaluation",
    };
  });
  add("applied_before_decision", "applied_before_decision", (receipt) => {
    receipt.applied_at = "2026-07-10T12:14:00.000Z";
  });
  add(
    "applied_before_gate_evaluation",
    "applied_before_gate_evaluation",
    (receipt) => {
      receipt.applied_at = "2026-07-10T12:19:00.000Z";
    },
  );
  add(
    "applied_before_current_state_observation",
    "applied_before_current_state_observation",
    (receipt) => {
      receipt.applied_at = "2026-07-10T12:17:00.000Z";
    },
  );
  return cases;
}

function replaceExactRef(
  refs: ExternalRefV01[],
  expected: ExternalRefV01,
  replacement: ExternalRefV01,
): ExternalRefV01[] {
  const expectedKey = JSON.stringify(expected);
  return refs.map((ref) =>
    JSON.stringify(ref) === expectedKey ? clone(replacement) : ref,
  );
}

function resign(receipt: StateTransitionReceiptV01) {
  for (const effect of receipt.effects) {
    effect.effect_id = deriveStateTransitionEffectIdV01(effect);
  }
  receipt.idempotency_key = createStateTransitionReceiptIdempotencyKeyV01(
    receipt,
  );
  receipt.transition_receipt_id = deriveStateTransitionReceiptIdV01(receipt);
  receipt.integrity.fingerprint =
    createStateTransitionReceiptFingerprintV01(receipt);
}

function assertIntegrityChecksPassed(value: {
  errors: Array<{ code: string }>;
}) {
  for (const code of [
    "effect_identity_mismatch",
    "idempotency_key_mismatch",
    "transition_receipt_identity_mismatch",
    "fingerprint_mismatch",
  ]) {
    assert.equal(
      value.errors.some((issue) => issue.code === code),
      false,
      `Re-signed semantic rejection must not rely on ${code}.`,
    );
  }
}

function reverseAllArrays(value: unknown) {
  if (Array.isArray(value)) {
    value.reverse();
    value.forEach(reverseAllArrays);
    return;
  }
  if (!value || typeof value !== "object") return;
  Object.values(value as Record<string, unknown>).forEach(reverseAllArrays);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value as Record<string, unknown>).forEach(deepFreeze);
  return Object.freeze(value);
}

function format(value: {
  status: string;
  errors: Array<{ code: string; path: string | null; message: string }>;
  warnings: Array<{ code: string; path: string | null; message: string }>;
}) {
  return JSON.stringify(value, null, 2);
}
