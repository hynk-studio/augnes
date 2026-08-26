import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  ACGC_E2R2P1_AGGREGATE_COST_CEILING_NANO_USD_V02,
  ACGC_E2R2P1_AGGREGATE_WORST_CASE_COST_NANO_USD_V02,
  ACGC_E2R2P1_CANONICAL_SHAPE_ORDER_V02,
  ACGC_E2R2P1_PROBE_OUTCOMES_V02,
  ACGC_E2R2P1_TERMINAL_CATEGORIES_V02,
  buildOperationalReentryCleanControlProviderCompatibilityProbeRepresentativeShapePlanV02,
  operationalReentryCleanControlProviderCompatibilityProbeHarnessAuthorityV02,
} from "@/lib/vnext/operational-reentry-clean-control-provider-compatibility-probe";
import { MODEL_PROVIDER_REQUEST_FAMILY_KINDS_V01 } from "@/lib/vnext/model-gateway/provider-rejection-observation";
import {
  OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01,
} from "@/lib/vnext/model-gateway/contracts";
import {
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V04,
} from "@/lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-v0-2-codec";
import {
  OPERATIONAL_REENTRY_CLEAN_CONTROL_PROVIDER_COMPATIBILITY_PROBE_AUTHORIZATION_VERSION_V02,
  OPERATIONAL_REENTRY_CLEAN_CONTROL_PROVIDER_COMPATIBILITY_PROBE_VERSION_V02,
} from "@/types/vnext/operational-reentry-clean-control-provider-compatibility-probe";

export function runOperationalReentryCleanControlProviderCompatibilityProbeConformanceV02() {
  assert.deepEqual(ACGC_E2R2P1_CANONICAL_SHAPE_ORDER_V02, ["A", "B", "C", "D"]);
  assert.deepEqual(ACGC_E2R2P1_PROBE_OUTCOMES_V02, [
    "accepted_all_shapes",
    "provider_rejected",
    "provider_response_invalid",
    "transport_or_runtime_incomplete",
    "not_run",
  ]);
  assert.deepEqual(ACGC_E2R2P1_TERMINAL_CATEGORIES_V02, [
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
  assert.equal(ACGC_E2R2P1_AGGREGATE_COST_CEILING_NANO_USD_V02, 250_000_000);
  assert.equal(
    OPERATIONAL_REENTRY_CLEAN_CONTROL_PROVIDER_COMPATIBILITY_PROBE_VERSION_V02,
    "operational_reentry_clean_control_provider_compatibility_probe.v0.2",
  );
  assert.equal(
    OPERATIONAL_REENTRY_CLEAN_CONTROL_PROVIDER_COMPATIBILITY_PROBE_AUTHORIZATION_VERSION_V02,
    "operational_reentry_clean_control_provider_compatibility_probe_authorization.v0.2",
  );
  assert.equal(
    OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01,
    "operational_reentry_matched_cohort_v02",
  );
  assert.equal(
    OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V04,
    "openai_responses_operational_reentry_matched_cohort_adapter.v0.4",
  );
  assert.deepEqual(
    operationalReentryCleanControlProviderCompatibilityProbeHarnessAuthorityV02,
    {
      live_probe_authorization_granted: false,
      live_probe_authorization_consumed: false,
      real_provider_calls: 0,
      compatibility_result_exists: false,
      behavioral_cohort_authorized: false,
      replication_authorized: false,
      policy_authorized: false,
      stage_7_authorized: false,
    },
  );
  assert.deepEqual(MODEL_PROVIDER_REQUEST_FAMILY_KINDS_V01, [
    "cohort_attempt",
    "compatibility_probe",
    "replacement_cohort",
    "clean_control_compatibility_probe",
    "parser_closed_compatibility_probe",
    "parser_closed_clean_control_cohort",
    "operational_reentry_v04_compatibility_probe",
    "operational_reentry_v04_stale_reset_isolation_cohort",
    "operational_reentry_v04_stale_reset_cross_case_replication",
    "operational_reentry_stale_reset_cross_case_compatibility_probe",
  ]);

  const plan =
    buildOperationalReentryCleanControlProviderCompatibilityProbeRepresentativeShapePlanV02();
  assert.equal(plan.entries.length, 4);
  assert.deepEqual(plan.entries.map((entry) => entry.shape), ["A", "B", "C", "D"]);
  assert.equal(new Set(plan.entries.map((entry) => entry.common_task_evidence_fingerprint)).size, 1);
  assert.equal(plan.entries[3]?.model_input.continuation_context.length, 0);
  assert.equal(
    plan.entries[3]?.common_task_evidence_fingerprint,
    plan.common_task_evidence_fingerprint,
  );
  assert.equal(
    ACGC_E2R2P1_AGGREGATE_WORST_CASE_COST_NANO_USD_V02,
    27_852_800,
  );
  assert.equal(
    ACGC_E2R2P1_AGGREGATE_WORST_CASE_COST_NANO_USD_V02 <=
      ACGC_E2R2P1_AGGREGATE_COST_CEILING_NANO_USD_V02,
    true,
  );

  const core = sourceV02("lib/vnext/operational-reentry-clean-control-provider-compatibility-probe.ts");
  const types = sourceV02("types/vnext/operational-reentry-clean-control-provider-compatibility-probe.ts");
  const artifacts = sourceV02("lib/vnext/operational-reentry-clean-control-provider-compatibility-probe-artifact-store.ts");
  const runner = sourceV02("scripts/operational-reentry-clean-control-provider-compatibility-probe.ts");
  assert.ok(core.includes("invokeOperationalReentryMatchedCohortModelGatewayV02"));
  assert.equal(core.includes("evaluateOperationalReentryMatchedCohort"), false);
  assert.equal(core.includes("fetch("), false);
  assert.equal(core.includes("process.env"), false);
  assert.equal(types.includes("OperationalReentryEvaluationV01"), false);
  assert.ok(artifacts.includes(".augnes-lab/operational-reentry-clean-control-provider-probes/"));
  assert.ok(runner.includes("--confirm-future-live-clean-control-compatibility-probe"));
  assert.ok(runner.includes("--authorization-file"));
  assert.equal(runner.includes("previous_response_id"), false);

  return {
    status:
      "operational_reentry_clean_control_provider_compatibility_probe_conformance_passed" as const,
    planned_shapes: 4,
    canonical_order: ACGC_E2R2P1_CANONICAL_SHAPE_ORDER_V02,
    aggregate_worst_case_cost_nano_usd:
      ACGC_E2R2P1_AGGREGATE_WORST_CASE_COST_NANO_USD_V02,
    provider_calls: 0,
    live_authorizations_created: 0,
    live_authorizations_consumed: 0,
    compatibility_result_exists: false,
    behavioral_outputs_generated: false,
    stage_7_started: false,
  };
}

function sourceV02(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}
