import assert from "node:assert/strict";

import {
  genericStateTransitionEligibilityEvaluationInputFixture,
  genericStateTransitionReceiptInputFixture,
  genericStateTransitionReceiptAfterStateRefFixture,
  invalidStateTransitionEligibilityInputFixtureCases,
  invalidStateTransitionReceiptFixtureCases,
  malformedStateTransitionReceiptRelationCases,
} from "@/fixtures/vnext/protocol/state-transition-receipt-v0-1";
import {
  genericCliDirectObservationProposalInputFixture,
} from "@/fixtures/vnext/protocol/episode-delta-proposal-v0-1";
import {
  acceptReviewDecisionInputFixture,
  deferReviewDecisionInputFixture,
  rejectReviewDecisionInputFixture,
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
  createReviewDecisionFingerprintV01,
  deriveReviewDecisionIdV01,
} from "@/lib/vnext/review-decision";
import {
  buildStateTransitionReceiptV01,
  canonicalizeStateTransitionReceiptValueV01,
  compareStateTransitionReceiptReplayCompatibilityV01,
  createStateTransitionApplicationResultFingerprintV01,
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
  StateTransitionReceiptBuilderInputV01,
  StateTransitionReceiptV01,
} from "@/types/vnext/state-transition-receipt";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type { EpisodeDeltaProposalV01 } from "@/types/vnext/episode-delta-proposal";
import type { ReviewDecisionV01 } from "@/types/vnext/review-decision";

const FIXED_GENERIC_TRANSITION_RECEIPT_ID =
  "state-transition-receipt:ad798a497f77b63f64da3d22";
const FIXED_GENERIC_IDEMPOTENCY_KEY =
  "sha256:73156c918536c96bd94b1f63331441b063cc6a27f28a49ae7b4f5661290d11de";
const FIXED_GENERIC_TRANSITION_RECEIPT_FINGERPRINT =
  "sha256:7609d734ca7090f4af69bbe29c31c1ecf1af2a4544f026265e4dbcf80f5404da";
const FIXED_CANONICAL_ELIGIBILITY_PRECONDITION_FINGERPRINT =
  "sha256:20d498b7ff23198b112c7104ded039c0ba35863bb93862f2346e65459ea428a1";

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
  exact_prior_applied_lineage_checked: true;
  same_target_supersede_model_checked: true;
  reject_and_defer_ineligible_checked: true;
  exact_gate_and_current_state_binding_checked: true;
  partial_and_conflicting_target_admission_checked: true;
  receipt_eligibility_relation_checked: true;
  authorized_after_state_checked: true;
  application_result_proof_checked: true;
  applied_by_authorization_checked: true;
  writer_allocated_state_ref_rule_checked: true;
  replay_conflict_semantics_checked: true;
  semantic_content_change_required_checked: true;
  malformed_receipt_relation_fail_closed_checked: true;
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
  const genericApplicationResult =
    createStateTransitionApplicationResultFingerprintV01(
      receipt.effects[0]!,
      receipt.applied_at,
    );
  assert.equal(
    receipt.effects[0]!.after_application_observation_ref.source_ref,
    genericApplicationResult,
  );
  assert.equal(
    receipt.effects[0]!.durable_record_ref.source_ref,
    genericApplicationResult,
  );
  assert.deepEqual(
    receipt.applied_by_ref,
    genericStateTransitionEligibilityEvaluationInputFixture
      .semantic_commit_gate_evaluation.authorized_applier_ref,
  );
  assert.equal(
    receipt.applied_by_ref.trust_class,
    "user_declaration",
  );
  assert.equal(receipt.applied_by_ref.observed_at, undefined);
  assert.equal(receipt.applied_by_ref.source_ref, undefined);
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
  assert.equal(
    compareStateTransitionReceiptReplayCompatibilityV01(receipt, repeated)
      .status,
    "exact_replay",
  );

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
  rebindApplicationResultProofs(sameIntentDifferentResult);
  const differentResult = buildStateTransitionReceiptV01(
    deepFreeze(sameIntentDifferentResult),
  );
  assert.equal(differentResult.idempotency_key, receipt.idempotency_key);
  assert.notEqual(
    differentResult.transition_receipt_id,
    receipt.transition_receipt_id,
  );
  assert.equal(validateStateTransitionReceiptV01(differentResult).status, "valid");
  assert.equal(
    compareStateTransitionReceiptReplayCompatibilityV01(
      receipt,
      differentResult,
    ).status,
    "conflicting_result",
  );
  const distinctIntentInput = clone(genericStateTransitionReceiptInputFixture);
  distinctIntentInput.requested_transition_intent.intent_id =
    "transition-intent:distinct-protocol-foundation";
  const distinctIntentReceipt = buildStateTransitionReceiptV01(
    deepFreeze(distinctIntentInput),
  );
  assert.equal(
    compareStateTransitionReceiptReplayCompatibilityV01(
      receipt,
      distinctIntentReceipt,
    ).status,
    "distinct_intent",
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
  const semanticNoOpReceiptNegativeCount =
    assertSemanticNoOpReceiptNegativeCases(receipt);

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
  const authorizedGenericEffect =
    acceptAbsentEligibility.expected_effects[0];
  assert.ok(authorizedGenericEffect);
  assert.equal(
    authorizedGenericEffect.expected_after_state.presence,
    "present",
  );
  if (authorizedGenericEffect.expected_after_state.presence === "present") {
    assert.equal(
      authorizedGenericEffect.expected_after_state.state_fingerprint,
      receipt.effects[0]!.after_state.state_fingerprint,
    );
    assert.equal(
      authorizedGenericEffect.expected_after_state.state_ref_rule.mode,
      "exact_identity",
    );
  }

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
  assertExpectedSemanticContentChange(acceptPresentEligibility);

  const supersedeInput = createAppliedLineageEligibilityInput("supersede");
  const supersedeEligibility =
    evaluateReviewDecisionStateTransitionEligibilityV01(supersedeInput);
  assertEligibilityOperation(
    "supersede with observed present state",
    supersedeEligibility,
    "supersede",
  );
  assertExpectedSemanticContentChange(supersedeEligibility);

  assert.equal(supersedeEligibility.expected_effects[0]?.lineage_refs.length, 1);

  const retractInput = createAppliedLineageEligibilityInput("retract");
  const retractEligibility =
    evaluateReviewDecisionStateTransitionEligibilityV01(retractInput);
  assertEligibilityOperation(
    "retract with observed present state",
    retractEligibility,
    "retract",
  );
  assert.equal(retractEligibility.expected_effects[0]?.lineage_refs.length, 1);

  const crossTargetSupersede = eligibilityInputForDecision(
    reviewDecisionMultiCandidateSourceProposal,
    buildReviewDecisionV01(clone(supersedeReviewDecisionInputFixture)),
    "present",
  );
  const crossTargetSupersedeEligibility =
    evaluateReviewDecisionStateTransitionEligibilityV01(
      crossTargetSupersede,
    );
  assert.equal(crossTargetSupersedeEligibility.status, "ineligible");
  assert.ok(
    crossTargetSupersedeEligibility.errors.some(
      (issue) => issue.code === "supersede_target_set_mismatch",
    ),
    format(crossTargetSupersedeEligibility),
  );
  const semanticNoOpEligibilityNegativeCount =
    assertSemanticNoOpEligibilityCases(acceptPresentInput, supersedeInput);
  const appliedLineageNegativeFixtureCount =
    assertAppliedLineageNegativeCases();

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
  reorderedMultiTargetInput.semantic_commit_gate_evaluation.authorized_effects.reverse();
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
  const malformedReceiptRelationNegativeCount =
    assertMalformedReceiptRelationCases(relationReceipt);

  const writerAllocatedEligibilityInput = clone(acceptPresentInput);
  const writerAuthorizedEffect =
    writerAllocatedEligibilityInput.semantic_commit_gate_evaluation
      .authorized_effects[0]!;
  if (writerAuthorizedEffect.expected_after_state.presence !== "present") {
    throw new Error("Writer allocation fixture requires present after-state.");
  }
  writerAuthorizedEffect.expected_after_state.state_ref_rule = {
    mode: "writer_allocated",
    ref_type: "accepted_semantic_state",
    compatibility_namespace: "augnes.state-transition.writer-allocation.v0.1",
    trust_class: "direct_local_observation",
  };
  const writerAllocatedEligibility =
    evaluateReviewDecisionStateTransitionEligibilityV01(
      writerAllocatedEligibilityInput,
    );
  assert.equal(
    writerAllocatedEligibility.status,
    "eligible",
    format(writerAllocatedEligibility),
  );
  const writerAllocatedReceiptInput = clone(
    genericStateTransitionReceiptInputFixture,
  );
  writerAllocatedReceiptInput.eligibility_precondition_fingerprint =
    writerAllocatedEligibility.precondition_fingerprint;
  const writerExpectedEffect = writerAllocatedEligibility.expected_effects[0];
  const writerReceiptEffect = writerAllocatedReceiptInput.effects[0];
  if (!writerExpectedEffect || !writerReceiptEffect) {
    throw new Error("Writer allocation fixture requires one expected effect.");
  }
  const priorBeforeObservationRef = clone(
    writerReceiptEffect.before_state_observation_ref,
  );
  writerReceiptEffect.operation = writerExpectedEffect.operation;
  writerReceiptEffect.before_state = clone(writerExpectedEffect.before_state);
  writerReceiptEffect.before_state_observation_ref = clone(
    writerExpectedEffect.before_state_observation_ref,
  );
  writerReceiptEffect.source_refs = replaceExactRef(
    writerReceiptEffect.source_refs,
    priorBeforeObservationRef,
    writerReceiptEffect.before_state_observation_ref,
  );
  writerAllocatedReceiptInput.source_refs = replaceExactRef(
    writerAllocatedReceiptInput.source_refs,
    priorBeforeObservationRef,
    writerReceiptEffect.before_state_observation_ref,
  );
  if (
    writerAllocatedReceiptInput.effects[0]?.after_state.presence !== "present"
  ) {
    throw new Error("Writer allocation receipt requires present after-state.");
  }
  writerAllocatedReceiptInput.effects[0].after_state.state_ref = {
    ref_version: "external_ref.v0.1",
    ref_type: "accepted_semantic_state",
    external_id: "allocated-state:protocol-foundation:0001",
    trust_class: "direct_local_observation",
    observed_at: writerAllocatedReceiptInput.applied_at,
    source_ref:
      writerAllocatedReceiptInput.effects[0].after_state.state_fingerprint,
    compatibility_namespace:
      "augnes.state-transition.writer-allocation.v0.1",
  };
  if (writerReceiptEffect.before_state.presence !== "present") {
    throw new Error("Writer allocation replacement requires present before-state.");
  }
  assert.notEqual(
    writerReceiptEffect.before_state.state_fingerprint,
    writerReceiptEffect.after_state.state_fingerprint,
  );
  rebindApplicationResultProofs(writerAllocatedReceiptInput);
  const writerAllocatedReceipt = buildStateTransitionReceiptV01(
    deepFreeze(writerAllocatedReceiptInput),
  );
  const writerAllocatedRelation =
    validateStateTransitionReceiptAgainstEligibilityV01({
      ...writerAllocatedEligibilityInput,
      receipt: writerAllocatedReceipt,
    });
  assert.equal(
    writerAllocatedRelation.status,
    "valid",
    format(writerAllocatedRelation),
  );
  const unauthorizedWriterAllocatedReceipt = clone(writerAllocatedReceipt);
  if (
    unauthorizedWriterAllocatedReceipt.effects[0]?.after_state.presence !==
    "present"
  ) {
    throw new Error("Writer allocation negative requires present after-state.");
  }
  unauthorizedWriterAllocatedReceipt.effects[0].after_state.state_ref.compatibility_namespace =
    "augnes.state-transition.unapproved-allocation.v0.1";
  rebindApplicationResultProofs(unauthorizedWriterAllocatedReceipt);
  resign(unauthorizedWriterAllocatedReceipt);
  const unauthorizedWriterRelation =
    validateStateTransitionReceiptAgainstEligibilityV01({
      ...writerAllocatedEligibilityInput,
      receipt: unauthorizedWriterAllocatedReceipt,
    });
  assert.equal(unauthorizedWriterRelation.status, "blocked");
  assert.ok(
    unauthorizedWriterRelation.errors.some(
      (issue) =>
        issue.code === "writer_allocated_state_ref_rule_mismatch",
    ),
    format(unauthorizedWriterRelation),
  );
  assertIntegrityChecksPassed(unauthorizedWriterRelation);

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
    positive_fixture_count: 6,
    negative_fixture_count:
      invalidStateTransitionReceiptFixtureCases.length +
      2 +
      semanticNoOpReceiptNegativeCount,
    eligibility_positive_fixture_count: 6,
    eligibility_negative_fixture_count:
      invalidStateTransitionEligibilityInputFixtureCases.length +
      3 +
      semanticNoOpEligibilityNegativeCount +
      appliedLineageNegativeFixtureCount,
    receipt_relation_negative_fixture_count:
      receiptRelationCases.length +
      1 +
      malformedReceiptRelationNegativeCount,
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
    exact_prior_applied_lineage_checked: true,
    same_target_supersede_model_checked: true,
    reject_and_defer_ineligible_checked: true,
    exact_gate_and_current_state_binding_checked: true,
    partial_and_conflicting_target_admission_checked: true,
    receipt_eligibility_relation_checked: true,
    authorized_after_state_checked: true,
    application_result_proof_checked: true,
    applied_by_authorization_checked: true,
    writer_allocated_state_ref_rule_checked: true,
    replay_conflict_semantics_checked: true,
    semantic_content_change_required_checked: true,
    malformed_receipt_relation_fail_closed_checked: true,
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

function assertExpectedSemanticContentChange(
  result: StateTransitionEligibilityResultV01,
) {
  for (const effect of result.expected_effects) {
    if (
      effect.operation !== "replace" &&
      effect.operation !== "supersede"
    ) {
      continue;
    }
    assert.equal(effect.before_state.presence, "present");
    assert.equal(effect.expected_after_state.presence, "present");
    if (
      effect.before_state.presence === "present" &&
      effect.expected_after_state.presence === "present"
    ) {
      assert.notEqual(
        effect.before_state.state_fingerprint,
        effect.expected_after_state.state_fingerprint,
      );
    }
  }
}

function assertSemanticNoOpEligibilityCases(
  replaceSource: StateTransitionEligibilityEvaluationInputV01,
  supersedeSource: StateTransitionEligibilityEvaluationInputV01,
): number {
  const cases = [
    ["replace", replaceSource],
    ["supersede", supersedeSource],
  ] as const;
  for (const [name, source] of cases) {
    const input = clone(source);
    const observation = input.current_state_observations[0];
    const authorized =
      input.semantic_commit_gate_evaluation.authorized_effects[0];
    if (
      !observation ||
      observation.presence !== "present" ||
      !observation.state_fingerprint ||
      !authorized ||
      authorized.expected_after_state.presence !== "present"
    ) {
      throw new Error(`${name} no-op fixture requires present state material.`);
    }
    authorized.expected_after_state.state_fingerprint =
      observation.state_fingerprint;
    const result = evaluateReviewDecisionStateTransitionEligibilityV01(input);
    assert.equal(result.status, "ineligible", `${name}: ${format(result)}`);
    assert.ok(
      result.errors.some(
        (issue) => issue.code === "state_content_change_required",
      ),
      `${name}: ${format(result)}`,
    );
  }
  return cases.length;
}

function assertSemanticNoOpReceiptNegativeCases(
  source: StateTransitionReceiptV01,
): number {
  const cases: Array<{
    name: string;
    operation: "replace" | "supersede";
    mutateAfterRef(ref: ExternalRefV01, receipt: StateTransitionReceiptV01): void;
  }> = [
    {
      name: "replace_equal_fingerprint_different_external_id_resigned",
      operation: "replace",
      mutateAfterRef(ref) {
        ref.external_id = "semantic-state:no-op:different-id";
      },
    },
    {
      name: "replace_equal_fingerprint_changed_observed_at_resigned",
      operation: "replace",
      mutateAfterRef(ref, receipt) {
        ref.observed_at = receipt.recorded_at;
      },
    },
    {
      name: "replace_equal_fingerprint_changed_source_ref_resigned",
      operation: "replace",
      mutateAfterRef(ref) {
        ref.source_ref = `sha256:${"c".repeat(64)}`;
      },
    },
    {
      name: "supersede_equal_fingerprint_different_state_ref_resigned",
      operation: "supersede",
      mutateAfterRef(ref) {
        ref.external_id = "semantic-state:no-op:superseding-ref";
      },
    },
  ];
  for (const testCase of cases) {
    const receipt = clone(source);
    const effect = receipt.effects[0];
    if (!effect || effect.after_state.presence !== "present") {
      throw new Error(`${testCase.name} requires present after-state.`);
    }
    effect.operation = testCase.operation;
    effect.before_state = clone(effect.after_state);
    testCase.mutateAfterRef(effect.after_state.state_ref, receipt);
    rebindApplicationResultProofs(receipt);
    resign(receipt);
    const validation = validateStateTransitionReceiptV01(receipt);
    assert.equal(
      validation.status,
      "blocked",
      `${testCase.name}: ${format(validation)}`,
    );
    assert.ok(
      validation.errors.some(
        (issue) => issue.code === "state_content_change_required",
      ),
      `${testCase.name}: ${format(validation)}`,
    );
    assertIntegrityChecksPassed(validation);
  }
  return cases.length;
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
  const operation =
    decision.decision === "retract"
      ? "retract"
      : decision.decision === "supersede"
        ? "supersede"
        : presence === "absent"
          ? "create"
          : "replace";
  gate.authorized_effects = intent.target_refs.map((target, index) => ({
    target_ref: clone(target),
    operation,
    expected_after_state:
      operation === "retract"
        ? {
            presence: "absent",
            state_fingerprint: null,
            state_ref_rule: null,
          }
        : {
            presence: "present",
            state_fingerprint: `sha256:${"a".repeat(64)}`,
            state_ref_rule: {
              mode: "exact_identity",
              state_ref: {
                ref_version: "external_ref.v0.1",
                ref_type: genericStateTransitionReceiptAfterStateRefFixture.ref_type,
                external_id: `${genericStateTransitionReceiptAfterStateRefFixture.external_id}:${index}`,
                trust_class:
                  genericStateTransitionReceiptAfterStateRefFixture.trust_class,
              },
            },
          },
  }));
  gate.source_refs = [clone(gate.evaluation_ref)];
  return {
    proposal: clone(proposal),
    decision: clone(decision),
    current_state_observations: currentStateObservations,
    semantic_commit_gate_evaluation: gate,
    prior_review_decisions: [],
    prior_state_transition_receipts: [],
    evaluated_at: base.evaluated_at,
  };
}

function createAppliedLineageEligibilityInput(
  mode: "supersede" | "retract",
): StateTransitionEligibilityEvaluationInputV01 {
  const proposal = createSameTargetLineageProposal();
  const sourceCandidate = proposal.proposed_deltas[0]!;
  const replacementCandidate = proposal.proposed_deltas[1]!;
  const priorDecisionInput = decisionInputForProposalCandidate(
    proposal,
    sourceCandidate,
  );
  const priorDecision = buildReviewDecisionV01(priorDecisionInput);
  const priorEligibilityInput = eligibilityInputForDecision(
    proposal,
    priorDecision,
    "absent",
  );
  const priorEligibility =
    evaluateReviewDecisionStateTransitionEligibilityV01(
      priorEligibilityInput,
    );
  assert.equal(priorEligibility.status, "eligible", format(priorEligibility));
  const priorReceipt = buildPriorAppliedReceipt(
    proposal,
    priorDecision,
    priorEligibilityInput,
    priorEligibility,
  );
  const currentInput = decisionInputForProposalCandidate(
    proposal,
    sourceCandidate,
  );
  const priorBinding = {
    decision_id: priorDecision.decision_id,
    decision_fingerprint: priorDecision.integrity.fingerprint,
  };
  currentInput.decision = mode;
  currentInput.decided_at = "2026-07-10T12:30:00.000Z";
  currentInput.rationale_summary =
    mode === "supersede"
      ? "Supersede the exact previously applied source candidate with a same-target replacement candidate."
      : "Retract the exact previously accepted and applied source candidate.";
  currentInput.lineage = {
    prior_decisions: [priorBinding],
    superseding_candidate:
      mode === "supersede"
        ? {
            candidate_id: replacementCandidate.candidate_id,
            candidate_fingerprint:
              createEpisodeDeltaCandidateFingerprintV01(
                replacementCandidate,
              ),
          }
        : null,
    retracted_decision: mode === "retract" ? priorBinding : null,
  };
  currentInput.requested_transition_intent = {
    intent_id: `transition-intent:applied-lineage:${mode}`,
    transition_kind:
      mode === "supersede"
        ? "semantic_candidate_supersede"
        : "semantic_candidate_retract",
    bounded_summary:
      "Request a separately gated synthetic lineage transition without applying state.",
    target_refs: clone(
      mode === "supersede"
        ? replacementCandidate.target_refs
        : sourceCandidate.target_refs,
    ),
    intent_only: true,
    applied: false,
    state_transition_receipt_ref: null,
  };
  const decision = buildReviewDecisionV01(currentInput);
  const input = eligibilityInputForDecision(proposal, decision, "present");
  const priorEffects = new Map(
    priorReceipt.effects.map((effect) => [
      JSON.stringify(effect.target_ref),
      effect,
    ]),
  );
  for (const observation of input.current_state_observations) {
    const priorEffect = priorEffects.get(JSON.stringify(observation.target_ref));
    if (!priorEffect || priorEffect.after_state.presence !== "present") {
      throw new Error("Applied lineage fixture requires prior present after-state.");
    }
    observation.presence = "present";
    observation.state_ref = clone(priorEffect.after_state.state_ref);
    observation.state_fingerprint = priorEffect.after_state.state_fingerprint;
    observation.observed_at = "2026-07-10T12:32:00.000Z";
    observation.observation_ref.observed_at = observation.observed_at;
  }
  if (mode === "supersede") {
    for (const authorized of input.semantic_commit_gate_evaluation
      .authorized_effects) {
      if (authorized.expected_after_state.presence === "present") {
        authorized.expected_after_state.state_fingerprint =
          `sha256:${"d".repeat(64)}`;
      }
    }
  }
  input.semantic_commit_gate_evaluation.evaluated_at =
    "2026-07-10T12:35:00.000Z";
  input.semantic_commit_gate_evaluation.evaluation_ref.observed_at =
    input.semantic_commit_gate_evaluation.evaluated_at;
  input.evaluated_at = "2026-07-10T12:36:00.000Z";
  input.prior_review_decisions = [priorDecision];
  input.prior_state_transition_receipts = [priorReceipt];
  return input;
}

function createSameTargetLineageProposal(): EpisodeDeltaProposalV01 {
  const input = clone(genericCliDirectObservationProposalInputFixture);
  const source = input.proposed_deltas[0]!;
  input.bounded_summary =
    "Two same-target candidates exercise applied supersede and retract lineage without transition authority.";
  input.proposed_deltas.push({
    ...clone(source),
    candidate_id: "delta:protocol-contract-same-target-replacement",
    title: "Review the same-target replacement contract candidate",
    proposed_state_summary:
      "Replace the source candidate with a distinct review-required candidate over the exact same semantic target.",
    uncertainties: [
      "The replacement remains synthetic candidate material until separately reviewed.",
    ],
  });
  return buildEpisodeDeltaProposalV01(input);
}

function decisionInputForProposalCandidate(
  proposal: EpisodeDeltaProposalV01,
  candidate: EpisodeDeltaProposalV01["proposed_deltas"][number],
) {
  const input = clone(acceptReviewDecisionInputFixture);
  input.workspace_id = proposal.workspace_id;
  input.project_id = proposal.project_id;
  input.source_proposal = {
    proposal_version: proposal.proposal_version,
    proposal_id: proposal.proposal_id,
    proposal_fingerprint: proposal.integrity.fingerprint,
  };
  input.candidate = {
    candidate_id: candidate.candidate_id,
    candidate_fingerprint:
      createEpisodeDeltaCandidateFingerprintV01(candidate),
  };
  input.decision_basis_material_ids = clone(candidate.basis_material_ids);
  input.decision_basis_refs = [clone(proposal.run_receipt_refs[0]!)];
  input.requested_transition_intent!.target_refs = clone(candidate.target_refs);
  return input;
}

function buildPriorAppliedReceipt(
  proposal: EpisodeDeltaProposalV01,
  decision: ReviewDecisionV01,
  eligibilityInput: StateTransitionEligibilityEvaluationInputV01,
  eligibility: StateTransitionEligibilityResultV01,
): StateTransitionReceiptV01 {
  const input = clone(genericStateTransitionReceiptInputFixture);
  const intent = decision.requested_transition_intent!;
  input.workspace_id = proposal.workspace_id;
  input.project_id = proposal.project_id;
  input.source_proposal = {
    proposal_version: proposal.proposal_version,
    proposal_id: proposal.proposal_id,
    proposal_fingerprint: proposal.integrity.fingerprint,
  };
  input.source_decision = {
    decision_version: decision.decision_version,
    decision_id: decision.decision_id,
    decision_fingerprint: decision.integrity.fingerprint,
  };
  input.source_candidate = clone(decision.candidate);
  input.requested_transition_intent = {
    intent_id: intent.intent_id,
    transition_kind: intent.transition_kind,
    target_refs: clone(intent.target_refs),
  };
  input.applied_by_ref = clone(
    eligibilityInput.semantic_commit_gate_evaluation.authorized_applier_ref,
  );
  input.semantic_commit_gate = {
    status: "authorized",
    evaluation_ref: clone(
      eligibilityInput.semantic_commit_gate_evaluation.evaluation_ref,
    ),
    evaluated_at:
      eligibilityInput.semantic_commit_gate_evaluation.evaluated_at,
    expires_at: eligibilityInput.semantic_commit_gate_evaluation.expires_at,
  };
  input.eligibility_precondition_fingerprint =
    eligibility.precondition_fingerprint;
  input.effects = eligibility.expected_effects.map((expected, index) => {
    if (
      expected.expected_after_state.presence !== "present" ||
      expected.expected_after_state.state_ref_rule.mode !== "exact_identity"
    ) {
      throw new Error("Prior accept fixture requires exact present outcome.");
    }
    const stateFingerprint =
      expected.expected_after_state.state_fingerprint;
    return {
      ...clone(input.effects[0]!),
      target_ref: clone(expected.target_ref),
      operation: expected.operation,
      before_state: clone(expected.before_state),
      after_state: {
        presence: "present" as const,
        state_ref: {
          ...clone(expected.expected_after_state.state_ref_rule.state_ref),
          observed_at: input.applied_at,
          source_ref: stateFingerprint,
        },
        state_fingerprint: stateFingerprint,
      },
      before_state_observation_ref: clone(
        expected.before_state_observation_ref,
      ),
      after_application_observation_ref: {
        ...clone(input.effects[0]!.after_application_observation_ref),
        external_id: `prior-application-observation:${index}`,
      },
      durable_record_ref: {
        ...clone(input.effects[0]!.durable_record_ref),
        external_id: `prior-durable-record:${index}`,
      },
      source_refs: [
        clone(expected.before_state_observation_ref),
        ...clone(expected.lineage_refs),
      ],
    };
  });
  input.source_refs = [
    clone(eligibilityInput.semantic_commit_gate_evaluation.evaluation_ref),
    ...input.effects.flatMap((effect) => clone(effect.source_refs)),
    ...input.effects.map((effect) =>
      clone(effect.after_application_observation_ref),
    ),
    ...input.effects.map((effect) => clone(effect.durable_record_ref)),
  ];
  for (const effect of input.effects) {
    effect.source_refs.push(
      clone(effect.after_application_observation_ref),
      clone(effect.durable_record_ref),
    );
  }
  rebindApplicationResultProofs(input);
  return buildStateTransitionReceiptV01(deepFreeze(input));
}

function assertAppliedLineageNegativeCases(): number {
  const base = createAppliedLineageEligibilityInput("retract");
  const cases: Array<{
    name: string;
    expectedStatus: "ineligible" | "blocked";
    expectedCode: string;
    input: StateTransitionEligibilityEvaluationInputV01;
  }> = [];
  const add = (
    name: string,
    expectedStatus: "ineligible" | "blocked",
    expectedCode: string,
    mutate: (input: StateTransitionEligibilityEvaluationInputV01) => void,
  ) => {
    const input = clone(base);
    mutate(input);
    cases.push({ name, expectedStatus, expectedCode, input });
  };

  add(
    "fabricated_retracted_decision_binding_resigned",
    "blocked",
    "prior_review_decision_binding_mismatch",
    (input) => {
      const binding = {
        decision_id: "review-decision:fabricated-lineage",
        decision_fingerprint: `sha256:${"9".repeat(64)}`,
      };
      input.decision.lineage.prior_decisions = [binding];
      input.decision.lineage.retracted_decision = binding;
      resignEligibilityDecision(input);
    },
  );
  add(
    "prior_review_decision_payload_missing",
    "ineligible",
    "prior_review_decision_missing",
    (input) => {
      input.prior_review_decisions = [];
    },
  );
  add(
    "prior_review_decision_fingerprint_mismatch_resigned",
    "blocked",
    "prior_review_decision_fingerprint_mismatch",
    (input) => {
      const binding = {
        ...input.decision.lineage.retracted_decision!,
        decision_fingerprint: `sha256:${"8".repeat(64)}`,
      };
      input.decision.lineage.prior_decisions = [binding];
      input.decision.lineage.retracted_decision = binding;
      resignEligibilityDecision(input);
    },
  );
  add(
    "prior_review_decision_cross_project_resigned",
    "blocked",
    "prior_review_decision_project_mismatch",
    (input) => {
      const prior = input.prior_review_decisions[0]!;
      prior.project_id = "project:other-lineage";
      resignReviewDecision(prior);
      bindEligibilityDecisionToPrior(input, prior);
      input.prior_state_transition_receipts = [];
    },
  );
  for (const [decisionValue, fixture] of [
    ["reject", rejectReviewDecisionInputFixture],
    ["defer", deferReviewDecisionInputFixture],
  ] as const) {
    add(
      `prior_${decisionValue}_decision_not_transitionable`,
      "ineligible",
      "prior_review_decision_not_transitionable",
      (input) => {
        const proposal = input.proposal;
        const candidate = proposal.proposed_deltas[0]!;
        const priorInput = clone(fixture);
        priorInput.workspace_id = proposal.workspace_id;
        priorInput.project_id = proposal.project_id;
        priorInput.source_proposal = {
          proposal_version: proposal.proposal_version,
          proposal_id: proposal.proposal_id,
          proposal_fingerprint: proposal.integrity.fingerprint,
        };
        priorInput.candidate = {
          candidate_id: candidate.candidate_id,
          candidate_fingerprint:
            createEpisodeDeltaCandidateFingerprintV01(candidate),
        };
        priorInput.decision_basis_material_ids = clone(
          candidate.basis_material_ids,
        );
        priorInput.decision_basis_refs = [
          clone(proposal.run_receipt_refs[0]!),
        ];
        const prior = buildReviewDecisionV01(priorInput);
        input.prior_review_decisions = [prior];
        input.prior_state_transition_receipts = [];
        bindEligibilityDecisionToPrior(input, prior);
      },
    );
  }
  add(
    "prior_accept_has_no_applied_receipt",
    "ineligible",
    "prior_state_transition_receipt_missing",
    (input) => {
      input.prior_state_transition_receipts = [];
    },
  );
  add(
    "prior_receipt_bound_to_another_decision_resigned",
    "blocked",
    "prior_state_transition_receipt_decision_mismatch",
    (input) => {
      const receipt = input.prior_state_transition_receipts[0]!;
      receipt.source_decision.decision_id = "review-decision:other-lineage";
      receipt.source_decision.decision_fingerprint = `sha256:${"7".repeat(64)}`;
      resign(receipt);
    },
  );
  add(
    "prior_receipt_target_mismatch_resigned",
    "blocked",
    "prior_state_transition_receipt_target_mismatch",
    (input) => {
      const receipt = input.prior_state_transition_receipts[0]!;
      const target = {
        ...clone(receipt.effects[0]!.target_ref),
        external_id: "target:unrelated-applied-lineage",
      };
      receipt.requested_transition_intent.target_refs = [clone(target)];
      receipt.effects[0]!.target_ref = clone(target);
      rebindApplicationResultProofs(receipt);
      resign(receipt);
    },
  );
  add(
    "current_state_differs_from_prior_applied_result",
    "ineligible",
    "prior_applied_state_not_current",
    (input) => {
      const observation = input.current_state_observations[0]!;
      if (observation.presence !== "present" || !observation.state_ref) {
        throw new Error("Current-state drift case requires present state.");
      }
      const fingerprint = `sha256:${"6".repeat(64)}`;
      observation.state_ref.external_id = "semantic-state:later-independent-change";
      observation.state_ref.source_ref = fingerprint;
      observation.state_fingerprint = fingerprint;
    },
  );
  add(
    "fully_resigned_forged_candidate_lineage",
    "blocked",
    "prior_review_decision_candidate_mismatch",
    (input) => {
      const replacement = input.proposal.proposed_deltas[1]!;
      const forgedPrior = buildReviewDecisionV01(
        decisionInputForProposalCandidate(input.proposal, replacement),
      );
      input.prior_review_decisions = [forgedPrior];
      input.prior_state_transition_receipts = [];
      bindEligibilityDecisionToPrior(input, forgedPrior);
    },
  );
  add(
    "extra_cross_project_prior_lineage_material",
    "blocked",
    "unexpected_prior_lineage_material",
    (input) => {
      const foreign = clone(input.prior_review_decisions[0]!);
      foreign.project_id = "project:foreign-extra-lineage";
      resignReviewDecision(foreign);
      input.prior_review_decisions.push(foreign);
    },
  );
  add(
    "duplicate_prior_review_decision_payload",
    "blocked",
    "duplicate_prior_review_decision",
    (input) => {
      input.prior_review_decisions.push(
        clone(input.prior_review_decisions[0]!),
      );
    },
  );

  for (const testCase of cases) {
    const result = evaluateReviewDecisionStateTransitionEligibilityV01(
      testCase.input,
    );
    assert.equal(
      result.status,
      testCase.expectedStatus,
      `${testCase.name}: ${format(result)}`,
    );
    assert.ok(
      result.errors.some((issue) => issue.code === testCase.expectedCode),
      `${testCase.name} must report ${testCase.expectedCode}: ${format(result)}`,
    );
  }
  return cases.length;
}

function bindEligibilityDecisionToPrior(
  input: StateTransitionEligibilityEvaluationInputV01,
  prior: ReviewDecisionV01,
) {
  const binding = {
    decision_id: prior.decision_id,
    decision_fingerprint: prior.integrity.fingerprint,
  };
  input.decision.lineage.prior_decisions = [binding];
  input.decision.lineage.retracted_decision = binding;
  resignEligibilityDecision(input);
}

function resignEligibilityDecision(
  input: StateTransitionEligibilityEvaluationInputV01,
) {
  resignReviewDecision(input.decision);
  input.semantic_commit_gate_evaluation.decision_id =
    input.decision.decision_id;
  input.semantic_commit_gate_evaluation.decision_fingerprint =
    input.decision.integrity.fingerprint;
}

function resignReviewDecision(decision: ReviewDecisionV01) {
  decision.decision_id = deriveReviewDecisionIdV01(decision);
  decision.integrity.fingerprint = createReviewDecisionFingerprintV01(decision);
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

function assertMalformedReceiptRelationCases(
  source: StateTransitionReceiptV01,
): number {
  for (const testCase of malformedStateTransitionReceiptRelationCases) {
    const receipt = testCase.build(source);
    const standalone = validateStateTransitionReceiptV01(receipt);
    assert.notEqual(
      standalone.status,
      "valid",
      `${testCase.name}: ${format(standalone)}`,
    );
    assert.ok(
      standalone.errors.some(
        (issue) => issue.code === testCase.expected_error_code,
      ),
      `${testCase.name}: ${format(standalone)}`,
    );
    const capture: {
      value?: ReturnType<
        typeof validateStateTransitionReceiptAgainstEligibilityV01
      >;
    } = {};
    assert.doesNotThrow(() => {
      capture.value = validateStateTransitionReceiptAgainstEligibilityV01({
        ...clone(genericStateTransitionEligibilityEvaluationInputFixture),
        receipt,
      });
    }, testCase.name);
    const relation = capture.value;
    assert.ok(relation, testCase.name);
    assert.ok(
      relation.status === "invalid" || relation.status === "blocked",
      `${testCase.name}: ${format(relation)}`,
    );
    assert.ok(
      relation.errors.some(
        (issue) => issue.code === testCase.expected_error_code,
      ),
      `${testCase.name}: ${format(relation)}`,
    );
  }
  return malformedStateTransitionReceiptRelationCases.length;
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
  add("effect_missing", "transition_effect_required", (receipt) => {
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
      rebindApplicationResultProofs(receipt);
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
    rebindApplicationResultProofs(receipt);
  });
  add("before_state_mismatch", "operation_snapshot_mismatch", (receipt) => {
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
  add("applied_before_decision", "timestamp_order_invalid", (receipt) => {
    receipt.applied_at = "2026-07-10T12:14:00.000Z";
  });
  add(
    "applied_before_gate_evaluation",
    "timestamp_order_invalid",
    (receipt) => {
      receipt.applied_at = "2026-07-10T12:19:00.000Z";
    },
  );
  add(
    "applied_before_current_state_observation",
    "timestamp_order_invalid",
    (receipt) => {
      receipt.applied_at = "2026-07-10T12:17:00.000Z";
    },
  );
  add(
    "arbitrary_after_state_resigned",
    "authorized_after_state_mismatch",
    (receipt) => {
      const after = receipt.effects[0]!.after_state;
      if (after.presence !== "present") {
        throw new Error("After-state negative requires present state.");
      }
      after.state_fingerprint = `sha256:${"7".repeat(64)}`;
      after.state_ref = {
        ...after.state_ref,
        external_id: "semantic-state:arbitrary-substitution",
        source_ref: after.state_fingerprint,
      };
      rebindApplicationResultProofs(receipt);
    },
  );
  add(
    "after_state_fingerprint_changed_resigned",
    "authorized_after_state_mismatch",
    (receipt) => {
      const after = receipt.effects[0]!.after_state;
      if (after.presence !== "present") {
        throw new Error("After-state negative requires present state.");
      }
      after.state_fingerprint = `sha256:${"8".repeat(64)}`;
      rebindApplicationResultProofs(receipt);
    },
  );
  add(
    "after_state_ref_identity_changed_resigned",
    "authorized_after_state_ref_identity_mismatch",
    (receipt) => {
      const after = receipt.effects[0]!.after_state;
      if (after.presence !== "present") {
        throw new Error("After-state negative requires present state.");
      }
      after.state_ref = {
        ...after.state_ref,
        external_id: "semantic-state:unauthorized-identity",
      };
      rebindApplicationResultProofs(receipt);
      rebindApplicationResultProofs(receipt);
    },
  );
  add(
    "after_application_observation_unrelated_result_resigned",
    "after_application_result_fingerprint_mismatch",
    (receipt) => {
      receipt.effects[0]!.after_application_observation_ref.source_ref =
        `sha256:${"9".repeat(64)}`;
    },
  );
  add(
    "durable_record_unrelated_result_resigned",
    "durable_record_result_fingerprint_mismatch",
    (receipt) => {
      receipt.effects[0]!.durable_record_ref.source_ref =
        `sha256:${"a".repeat(64)}`;
    },
  );
  add("applied_by_not_authorized_resigned", "applied_by_not_authorized", (receipt) => {
    receipt.applied_by_ref = {
      ...receipt.applied_by_ref,
      external_id: "synthetic-actor:unauthorized-applier",
    };
  });
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

function rebindApplicationResultProofs(
  value: StateTransitionReceiptBuilderInputV01 | StateTransitionReceiptV01,
) {
  for (const effect of value.effects) {
    const fingerprint =
      createStateTransitionApplicationResultFingerprintV01(
        effect,
        value.applied_at,
      );
    const oldAfter = clone(effect.after_application_observation_ref);
    const oldDurable = clone(effect.durable_record_ref);
    const after = { ...oldAfter, source_ref: fingerprint };
    const durable = { ...oldDurable, source_ref: fingerprint };
    effect.after_application_observation_ref = after;
    effect.durable_record_ref = durable;
    effect.source_refs = replaceExactRef(effect.source_refs, oldAfter, after);
    effect.source_refs = replaceExactRef(
      effect.source_refs,
      oldDurable,
      durable,
    );
    value.source_refs = replaceExactRef(value.source_refs, oldAfter, after);
    value.source_refs = replaceExactRef(value.source_refs, oldDurable, durable);
  }
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
