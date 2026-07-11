import assert from "node:assert/strict";

import {
  genericStateTransitionReceiptInputFixture,
  invalidStateTransitionReceiptFixtureCases,
} from "@/fixtures/vnext/protocol/state-transition-receipt-v0-1";
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
  StateTransitionReceiptV01,
} from "@/types/vnext/state-transition-receipt";

const FIXED_GENERIC_TRANSITION_RECEIPT_ID =
  "state-transition-receipt:6e2f5bc528a677eee743bebf";
const FIXED_GENERIC_IDEMPOTENCY_KEY =
  "sha256:73156c918536c96bd94b1f63331441b063cc6a27f28a49ae7b4f5661290d11de";
const FIXED_GENERIC_TRANSITION_RECEIPT_FINGERPRINT =
  "sha256:69c68fe60b078b95e8b01140bc298364fac898bf6210eec52f43e38b134581b1";

export interface StateTransitionReceiptConformanceSummaryV01 {
  suite: "state-transition-receipt-v0.1";
  status: "passed";
  positive_fixture_count: number;
  negative_fixture_count: number;
  generic_transition_receipt_id: string;
  generic_idempotency_key: string;
  generic_fingerprint: string;
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
    generic_transition_receipt_id: receipt.transition_receipt_id,
    generic_idempotency_key: receipt.idempotency_key,
    generic_fingerprint: receipt.integrity.fingerprint,
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
    required_openai_specific_core_fields: 0,
    required_chatgpt_specific_core_fields: 0,
    required_codex_specific_core_fields: 0,
  };
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
