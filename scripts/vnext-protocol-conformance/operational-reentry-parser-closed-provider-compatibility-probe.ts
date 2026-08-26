import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  ACGC_E2R2P4H_AGGREGATE_COST_CEILING_NANO_USD_V01,
  ACGC_E2R2P4H_AGGREGATE_WORST_CASE_COST_NANO_USD_V01,
  ACGC_E2R2P4H_CANONICAL_SHAPE_ORDER_V01,
  ACGC_E2R2P4H_PROBE_OUTCOMES_V01,
  ACGC_E2R2P4H_TERMINAL_CATEGORIES_V01,
  buildOperationalReentryParserClosedProviderCompatibilityProbeRepresentativeShapePlanV01,
  operationalReentryParserClosedProviderCompatibilityProbeHarnessAuthorityV01,
} from "@/lib/vnext/operational-reentry-parser-closed-provider-compatibility-probe";
import {
  OPERATIONAL_REENTRY_PARSER_CLOSED_PROVIDER_COMPATIBILITY_PROBE_AUTHORIZATION_VERSION_V01,
  OPERATIONAL_REENTRY_PARSER_CLOSED_PROVIDER_COMPATIBILITY_PROBE_VERSION_V01,
} from "@/types/vnext/operational-reentry-parser-closed-provider-compatibility-probe";

const EXPECTED_PLAN_FINGERPRINT_V01 =
  "sha256:788f4af4aa235e208fa94834887a4a36436598ecf0e837a202f6cab5e63dad03";

export function runOperationalReentryParserClosedProviderCompatibilityProbeConformanceV01() {
  assert.deepEqual(ACGC_E2R2P4H_CANONICAL_SHAPE_ORDER_V01, ["A", "B", "C", "D"]);
  assert.equal(ACGC_E2R2P4H_AGGREGATE_WORST_CASE_COST_NANO_USD_V01, 46_796_800);
  assert.equal(ACGC_E2R2P4H_AGGREGATE_COST_CEILING_NANO_USD_V01, 250_000_000);
  assert.equal(
    OPERATIONAL_REENTRY_PARSER_CLOSED_PROVIDER_COMPATIBILITY_PROBE_VERSION_V01,
    "operational_reentry_parser_closed_provider_compatibility_probe.v0.1",
  );
  assert.equal(
    OPERATIONAL_REENTRY_PARSER_CLOSED_PROVIDER_COMPATIBILITY_PROBE_AUTHORIZATION_VERSION_V01,
    "operational_reentry_parser_closed_provider_compatibility_probe_authorization.v0.1",
  );
  assert.deepEqual(ACGC_E2R2P4H_PROBE_OUTCOMES_V01, [
    "accepted_all_shapes",
    "provider_rejected",
    "provider_response_invalid",
    "transport_or_runtime_incomplete",
    "not_run",
  ]);
  assert.equal(ACGC_E2R2P4H_TERMINAL_CATEGORIES_V01.length, 9);
  assert.deepEqual(
    operationalReentryParserClosedProviderCompatibilityProbeHarnessAuthorityV01,
    {
      successor_live_authorization_granted: false,
      successor_live_authorization_consumed: false,
      real_provider_calls: 0,
      successor_compatibility_result: "none",
      behavioral_cohort_authorized: false,
      replication_authorized: false,
      policy_authorized: false,
      stage_7_authorized: false,
    },
  );

  const plan =
    buildOperationalReentryParserClosedProviderCompatibilityProbeRepresentativeShapePlanV01();
  assert.equal(plan.integrity.fingerprint, EXPECTED_PLAN_FINGERPRINT_V01);
  assert.deepEqual(plan.entries.map(({ shape }) => shape), ["A", "B", "C", "D"]);
  assert.equal(new Set(plan.entries.map(({ common_task_evidence_fingerprint }) => common_task_evidence_fingerprint)).size, 1);
  assert.equal(plan.entries[3]?.model_input.continuation_context.length, 0);
  assert.equal(
    plan.entries[3]?.common_task_evidence_fingerprint,
    plan.common_task_evidence_fingerprint,
  );

  const core = sourceV01("lib/vnext/operational-reentry-parser-closed-provider-compatibility-probe.ts");
  const artifacts = sourceV01("lib/vnext/operational-reentry-parser-closed-provider-compatibility-probe-artifact-store.ts");
  const runner = sourceV01("scripts/operational-reentry-parser-closed-provider-compatibility-probe.ts");
  assert.ok(core.includes("invokeOperationalReentryMatchedCohortModelGatewayV03"));
  assert.ok(core.includes("parser_closed_compatibility_probe"));
  assert.equal(core.includes("evaluateOperationalReentryMatchedCohort"), false);
  assert.equal(core.includes("fetch("), false);
  assert.equal(core.includes("process.env"), false);
  assert.ok(artifacts.includes(".augnes-lab/operational-reentry-parser-closed-provider-probes/"));
  assert.ok(artifacts.includes('openSync(target, "wx"'));
  assert.ok(artifacts.includes("parser_closed_probe_authorization_consumption_history_incomplete"));
  assert.ok(runner.includes("--confirm-future-live-parser-closed-compatibility-probe"));
  assert.ok(runner.includes("refs/remotes/origin/main^{commit}"));
  assert.equal(runner.includes("buildAuthorization"), false);

  return {
    status: "operational_reentry_parser_closed_provider_compatibility_probe_conformance_passed" as const,
    planned_shapes: 4,
    canonical_order: ACGC_E2R2P4H_CANONICAL_SHAPE_ORDER_V01,
    representative_shape_plan_fingerprint: EXPECTED_PLAN_FINGERPRINT_V01,
    aggregate_worst_case_cost_nano_usd:
      ACGC_E2R2P4H_AGGREGATE_WORST_CASE_COST_NANO_USD_V01,
    fake_transport_calls: 0,
    real_provider_calls: 0,
    successor_live_authorizations_created: 0,
    successor_live_authorizations_consumed: 0,
    successor_compatibility_result: "none" as const,
    behavioral_outputs_generated: false,
    stage_7_started: false,
  };
}

function sourceV01(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}
