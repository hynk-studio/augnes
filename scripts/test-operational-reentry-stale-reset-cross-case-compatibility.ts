import assert from "node:assert/strict";

import {
  buildOperationalReentryStaleResetCrossCaseProviderMaterialV01,
  OPERATIONAL_REENTRY_STALE_RESET_R1_CASE_ID_V01,
  OPERATIONAL_REENTRY_STALE_RESET_R2_CASE_ID_V01,
} from "@/fixtures/vnext/research/operational-reentry-stale-reset-cross-case-replication-v0-1";
import {
  buildOperationalReentryStaleResetCrossCaseProviderContractV01,
  operationalReentryStaleResetCrossCaseResponseSchemaV01,
  validateOperationalReentryStaleResetCrossCaseProviderMaterialV01,
} from "@/lib/vnext/model-gateway/openai/operational-reentry-stale-reset-cross-case-replication-v0-1-codec";
import { createOpenAIResponsesAdapterV01 } from "@/lib/vnext/model-gateway/openai/responses-adapter";
import {
  prepareOperationalReentryStaleResetCrossCaseModelGatewayRouteV01,
  projectOperationalReentryStaleResetCrossCaseProviderRequestV01,
} from "@/lib/vnext/model-gateway/model-gateway";
import {
  buildOperationalReentryStaleResetCrossCaseCompatibilityAuthorizationContractV01,
  buildOperationalReentryStaleResetCrossCaseCompatibilityPlanV01,
  buildOperationalReentryStaleResetCrossCaseInvocationV01,
  operationalReentryStaleResetCrossCaseStaticAuthorityV01,
} from "@/lib/vnext/operational-reentry-stale-reset-cross-case-replication";
import { buildOperationalReentryStaleResetCrossCaseCompatibilityArtifactFamilyContractV01 } from "@/lib/vnext/operational-reentry-stale-reset-cross-case-compatibility-artifact-store";
import { canonicalizeProtocolValueV01 } from "@/lib/vnext/protocol-primitives";

async function main(): Promise<void> {
  let transportCalls = 0;
  const route = await prepareOperationalReentryStaleResetCrossCaseModelGatewayRouteV01({
    adapter: createOpenAIResponsesAdapterV01({
      environment: { OPENAI_API_KEY: "synthetic-zero-egress-test-credential" },
      transport: async () => {
        transportCalls += 1;
        throw new Error("zero_egress_transport_must_not_run");
      },
    }),
  });
  assert.ok(route);
  const plan = buildOperationalReentryStaleResetCrossCaseCompatibilityPlanV01(route);
  assert.deepEqual(plan.canonical_order, ["R1-A", "R1-B", "R1-C", "R2-A", "R2-B", "R2-C"]);
  assert.equal(plan.entries.length, 6);
  assert.equal(plan.maximum_provider_calls, 6);
  assert.equal(plan.parallel, 1);
  assert.equal(plan.retries, 0);
  assert.equal(plan.replacements, 0);
  assert.equal(plan.adaptive_changes, 0);
  assert.equal(plan.stop_after_first_non_success, true);
  assert.equal(plan.g_live_compatibility_slots, 0);

  for (const caseId of [
    OPERATIONAL_REENTRY_STALE_RESET_R1_CASE_ID_V01,
    OPERATIONAL_REENTRY_STALE_RESET_R2_CASE_ID_V01,
  ] as const) {
    const b = buildOperationalReentryStaleResetCrossCaseProviderMaterialV01(caseId, "B");
    const g = buildOperationalReentryStaleResetCrossCaseProviderMaterialV01(caseId, "G");
    assert.deepEqual(g, b);
    const bRequest = projectOperationalReentryStaleResetCrossCaseProviderRequestV01(
      buildOperationalReentryStaleResetCrossCaseInvocationV01({
        case_id: caseId, arm: "B", cohort_ref: "ccr_compat_b",
        call_slot_id: "ccr_compat_b_slot", repeat_block: 0,
      }),
    );
    const gRequest = projectOperationalReentryStaleResetCrossCaseProviderRequestV01(
      buildOperationalReentryStaleResetCrossCaseInvocationV01({
        case_id: caseId, arm: "G", cohort_ref: "ccr_compat_g",
        call_slot_id: "ccr_compat_g_slot", repeat_block: 0,
      }),
    );
    assert.equal(gRequest.request_body, bRequest.request_body);
    assert.equal(gRequest.request_fingerprint, bRequest.request_fingerprint);
  }

  assert.equal(Object.keys(operationalReentryStaleResetCrossCaseResponseSchemaV01(
    validateOperationalReentryStaleResetCrossCaseProviderMaterialV01(
      buildOperationalReentryStaleResetCrossCaseProviderMaterialV01(
        OPERATIONAL_REENTRY_STALE_RESET_R1_CASE_ID_V01,
        "A",
      ),
    ),
  ).properties).length, 6);
  assert.equal(buildOperationalReentryStaleResetCrossCaseProviderContractV01().compatibility_result, "none");
  assert.equal(buildOperationalReentryStaleResetCrossCaseCompatibilityAuthorizationContractV01().creates_candidate, false);
  assert.equal(buildOperationalReentryStaleResetCrossCaseCompatibilityArtifactFamilyContractV01().live_compatibility_result, "none");
  assert.equal(transportCalls, 0);
  assert.equal(operationalReentryStaleResetCrossCaseStaticAuthorityV01.real_provider_calls, 0);
  assert.equal(
    canonicalizeProtocolValueV01(plan.entries.map((entry) => `${entry.case_id === OPERATIONAL_REENTRY_STALE_RESET_R1_CASE_ID_V01 ? "R1" : "R2"}-${entry.provider_shape}`)),
    canonicalizeProtocolValueV01(plan.canonical_order),
  );

  console.log(JSON.stringify({
    status: "operational_reentry_stale_reset_cross_case_compatibility_test_passed",
    plan_fingerprint: plan.integrity.fingerprint,
    shapes: plan.entries.length,
    fake_transport_calls: transportCalls,
    real_provider_calls: 0,
    live_compatibility_result: "none",
  }, null, 2));
}

void main();
