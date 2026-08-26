import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  ACGC_E2P1_AGGREGATE_COST_CEILING_NANO_USD_V01,
  ACGC_E2P1_CANONICAL_SHAPE_ORDER_V01,
  ACGC_E2P1_PROBE_OUTCOMES_V01,
  ACGC_E2P1_TERMINAL_CATEGORIES_V01,
  buildOperationalReentryProviderCompatibilityProbeProviderVisibleRequestV01,
} from "@/lib/vnext/operational-reentry-provider-compatibility-probe";
import { buildOperationalReentryMatchedCohortCallPlanV01 } from "@/lib/vnext/operational-reentry-matched-cohort";
import {
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V03,
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02,
} from "@/lib/vnext/model-gateway/openai/responses-adapter";
import {
  operationalReentryMatchedCohortResponseSchemaV02,
} from "@/lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-codec";
import { validateOpenAIStrictSchemaSupportedSubsetV01 } from "@/lib/vnext/model-gateway/openai/strict-schema-supported-subset";
import {
  OPERATIONAL_REENTRY_PROVIDER_COMPATIBILITY_PROBE_AUTHORIZATION_VERSION_V01,
  OPERATIONAL_REENTRY_PROVIDER_COMPATIBILITY_PROBE_VERSION_V01,
} from "@/types/vnext/operational-reentry-provider-compatibility-probe";

export function runOperationalReentryProviderCompatibilityProbeConformanceV01() {
  assert.deepEqual(ACGC_E2P1_CANONICAL_SHAPE_ORDER_V01, ["A", "B", "C", "D"]);
  assert.deepEqual(ACGC_E2P1_PROBE_OUTCOMES_V01, [
    "accepted_all_shapes",
    "provider_rejected",
    "provider_response_invalid",
    "transport_or_runtime_incomplete",
    "not_run",
  ]);
  assert.deepEqual(ACGC_E2P1_TERMINAL_CATEGORIES_V01, [
    "accepted_and_normalized",
    "provider_rejected",
    "provider_response_invalid",
    "transport_failed",
    "timed_out",
    "cancelled",
    "blocked_before_egress",
    "internal_failure",
    "not_attempted_after_terminal_failure",
  ]);
  assert.equal(ACGC_E2P1_AGGREGATE_COST_CEILING_NANO_USD_V01, 250_000_000);
  assert.equal(
    OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02,
    "gpt-4.1-mini-2025-04-14",
  );
  assert.equal(
    OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V03,
    "openai_responses_operational_reentry_matched_cohort_adapter.v0.3",
  );
  assert.equal(
    OPERATIONAL_REENTRY_PROVIDER_COMPATIBILITY_PROBE_VERSION_V01,
    "operational_reentry_provider_compatibility_probe.v0.1",
  );
  assert.equal(
    OPERATIONAL_REENTRY_PROVIDER_COMPATIBILITY_PROBE_AUTHORIZATION_VERSION_V01,
    "operational_reentry_provider_compatibility_probe_authorization.v0.1",
  );

  const cohortPlan = buildOperationalReentryMatchedCohortCallPlanV01();
  for (const shape of ACGC_E2P1_CANONICAL_SHAPE_ORDER_V01) {
    const representative = cohortPlan.entries.find((entry) => entry.arm === shape);
    assert.ok(representative);
    const schema = operationalReentryMatchedCohortResponseSchemaV02(
      representative.model_input,
    );
    assert.doesNotThrow(() => validateOpenAIStrictSchemaSupportedSubsetV01(schema));
    const request =
      buildOperationalReentryProviderCompatibilityProbeProviderVisibleRequestV01(
        representative.model_input,
      );
    for (const forbidden of [
      '"arm"',
      '"shape"',
      "compatibility_probe",
      "cohort_attempt",
      "replacement_cohort",
      "acgc_trace_",
      "evaluator_only",
      "aggregate_rules",
      "threshold",
    ]) {
      assert.equal(request.request_body.includes(forbidden), false, forbidden);
    }
  }

  const core = sourceV01("lib/vnext/operational-reentry-provider-compatibility-probe.ts");
  const types = sourceV01("types/vnext/operational-reentry-provider-compatibility-probe.ts");
  const artifacts = sourceV01(
    "lib/vnext/operational-reentry-provider-compatibility-probe-artifact-store.ts",
  );
  const runner = sourceV01("scripts/operational-reentry-provider-compatibility-probe.ts");
  assert.equal(core.includes("operational-reentry-perturbation"), false);
  assert.equal(core.includes("buildOperationalReentryEvaluation"), false);
  assert.equal(core.includes("fetch("), false);
  assert.equal(core.includes("process.env"), false);
  assert.equal(types.includes("OperationalReentryEvaluationV01"), false);
  assert.ok(artifacts.includes(".augnes-lab/operational-reentry-provider-probes/"));
  assert.ok(runner.includes("--confirm-future-live-compatibility-probe"));
  assert.ok(runner.includes("--authorization-file"));
  assert.equal(runner.includes("previous_response_id"), false);

  return {
    status:
      "operational_reentry_provider_compatibility_probe_conformance_passed" as const,
    planned_shapes: 4,
    canonical_order: ACGC_E2P1_CANONICAL_SHAPE_ORDER_V01,
    provider_calls: 0,
    retries: 0,
    replacement_calls: 0,
    behavioral_outputs_generated: false,
    stage_7_started: false,
  };
}

function sourceV01(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}
