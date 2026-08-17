import assert from "node:assert/strict";

import { buildOperationalReentryFixtureFamilyV01 } from "@/fixtures/vnext/research/operational-reentry-perturbation-v0-1";
import {
  ACGC_E1_EXACT_SOURCE_FINGERPRINT_V01,
  ACGC_E1_STAGE5_COMPARISON_SOURCE_CASE_FINGERPRINT_V01,
  validateOperationalReentryEvaluationV01,
} from "@/lib/vnext/operational-reentry-perturbation";

export function runOperationalReentryPerturbationConformanceV01() {
  const family = buildOperationalReentryFixtureFamilyV01();
  const deciding = family.deciding_positive_reset.evaluation;
  for (const fixture of Object.values(family)) {
    assert.equal(
      validateOperationalReentryEvaluationV01(fixture.evaluation).status,
      "valid",
    );
    assert.equal(fixture.evaluation.evidence_ladder.support_validation, "unknown");
    assert.equal(fixture.evaluation.evidence_ladder.outcome_association, "unknown");
    assert.equal(fixture.evaluation.evidence_ladder.causal_contribution, "unknown");
    assert.equal(fixture.evaluation.real_provider_or_model_evidence, false);
    assert.equal(fixture.evaluation.no_bundle_credit_or_blame, true);
  }
  assert.equal(
    deciding.source.integrity.fingerprint,
    ACGC_E1_EXACT_SOURCE_FINGERPRINT_V01,
  );
  assert.equal(
    deciding.source.parent_comparison_source_case.record_fingerprint,
    ACGC_E1_STAGE5_COMPARISON_SOURCE_CASE_FINGERPRINT_V01,
  );
  assert.equal(deciding.source.stage5_truth.exact_case_status, "inconclusive");
  assert.equal(deciding.conditioning_relation, "structured_delta_observed");
  assert.equal(deciding.reset_relation, "appropriate_reset_observed");
  assert.equal(
    family.reference_only.evaluation.conditioning_relation,
    "reference_only",
  );
  assert.equal(
    family.no_structured_delta.evaluation.conditioning_relation,
    "no_structured_delta_observed",
  );
  assert.equal(
    family.sticky_stale.evaluation.reset_relation,
    "stale_persistence_candidate",
  );
  return {
    suite: "operational-reentry-perturbation-v0.1",
    status: "passed",
    evaluation_id: deciding.evaluation_id,
    evaluation_fingerprint: deciding.integrity.fingerprint,
    conditioning_relation: deciding.conditioning_relation,
    reset_relation: deciding.reset_relation,
    stage5_exact_case_status: deciding.source.stage5_truth.exact_case_status,
    provider_calls: 0,
    model_calls: 0,
    network_calls: 0,
    product_state_mutations: 0,
  };
}
