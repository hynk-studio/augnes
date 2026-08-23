import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  ACGC_E2R2P6H_ADAPTER_REQUEST_ROUTE_FINGERPRINT_V01,
  ACGC_E2R2P6H_CASE_FINGERPRINT_V01,
  ACGC_E2R2P6H_COMMON_TASK_EVIDENCE_FINGERPRINT_V01,
  ACGC_E2R2P6H_DIRECT_PAIRS_V01,
  ACGC_E2R2P6H_PROVIDER_CONTRACT_FINGERPRINT_V01,
  ACGC_E2R2P6H_ROUTE_FINGERPRINT_V01,
  ACGC_E2R2P6H_SEALED_ORDER_V01,
  buildOperationalReentryV04StaleResetIsolationHarnessContractV01,
  buildOperationalReentryV04StaleResetIsolationPlanV01,
  operationalReentryV04StaleResetIsolationHarnessAuthorityV01,
} from "@/lib/vnext/operational-reentry-v0-4-stale-reset-isolation-cohort";
import {
  OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_ARTIFACT_INDEX_VERSION_V01,
  OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_AUTHORIZATION_VERSION_V01,
  OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_COHORT_VERSION_V01,
  OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_EVALUATOR_VERSION_V01,
  OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_MANIFEST_VERSION_V01,
  OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_PLAN_VERSION_V01,
  OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_REPORT_VERSION_V01,
} from "@/types/vnext/operational-reentry-v0-4-stale-reset-isolation-cohort";

export function runOperationalReentryV04StaleResetIsolationConformanceV01() {
  assert.deepEqual(ACGC_E2R2P6H_SEALED_ORDER_V01, [
    ["A", "B", "G", "C"],
    ["B", "C", "A", "G"],
    ["C", "G", "B", "A"],
    ["G", "A", "C", "B"],
  ]);
  assert.equal(ACGC_E2R2P6H_DIRECT_PAIRS_V01.length, 6);
  assert.equal(
    OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_COHORT_VERSION_V01,
    "operational_reentry_v04_stale_reset_isolation_cohort.v0.1",
  );
  assert.equal(
    OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_PLAN_VERSION_V01,
    "operational_reentry_v04_stale_reset_isolation_plan.v0.1",
  );
  assert.equal(
    OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_EVALUATOR_VERSION_V01,
    "operational_reentry_v04_stale_reset_isolation_evaluator.v0.1",
  );
  assert.equal(
    OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_AUTHORIZATION_VERSION_V01,
    "operational_reentry_v04_stale_reset_isolation_authorization.v0.1",
  );
  assert.equal(
    OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_MANIFEST_VERSION_V01,
    "operational_reentry_v04_stale_reset_isolation_manifest.v0.1",
  );
  assert.equal(
    OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_REPORT_VERSION_V01,
    "operational_reentry_v04_stale_reset_isolation_report.v0.1",
  );
  assert.equal(
    OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_ARTIFACT_INDEX_VERSION_V01,
    "operational_reentry_v04_stale_reset_isolation_artifact_index.v0.1",
  );
  assert.deepEqual(
    operationalReentryV04StaleResetIsolationHarnessAuthorityV01,
    {
      prepared_without_provider_egress: true,
      provider_contract_verdict: "reuse_v04_exact",
      provider_contract_compatibility_source:
        "issue_232_accepted_all_shapes",
      new_compatibility_probe_required: false,
      new_compatibility_probe_executed: false,
      successor_live_authorizations_created: 0,
      successor_live_authorizations_consumed: 0,
      live_behavioral_cohort_authorized: false,
      live_behavioral_cohort_executed: false,
      behavioral_result: "none",
      replication_authorized: false,
      policy_authorized: false,
      stage_7_authorized: false,
      real_provider_calls: 0,
    },
  );

  const plan = buildOperationalReentryV04StaleResetIsolationPlanV01();
  const rebuilt = buildOperationalReentryV04StaleResetIsolationPlanV01();
  assert.equal(plan.integrity.fingerprint, rebuilt.integrity.fingerprint);
  assert.equal(plan.entries.length, 16);
  assert.equal(plan.bg_conformance_witnesses.length, 4);
  assert.equal(
    plan.bg_conformance_witnesses.every(
      (witness) =>
        witness.local_invocation_identities_distinct === true &&
        witness.openai_json_request_body_bytes_equal === true &&
        witness.g_provenance_provider_visibility === "absent",
    ),
    true,
  );
  const contract =
    buildOperationalReentryV04StaleResetIsolationHarnessContractV01();
  assert.equal(contract.plan_fingerprint, plan.integrity.fingerprint);
  assert.equal(contract.provider_contract_verdict, "reuse_v04_exact");
  assert.equal(contract.real_provider_calls, 0);

  const core = sourceV01(
    "lib/vnext/operational-reentry-v0-4-stale-reset-isolation-cohort.ts",
  );
  const artifacts = sourceV01(
    "lib/vnext/operational-reentry-v0-4-stale-reset-isolation-artifact-store.ts",
  );
  const runner = sourceV01(
    "scripts/operational-reentry-v0-4-stale-reset-isolation-cohort.ts",
  );
  assert.ok(core.includes("new_provider_contract_required"));
  assert.equal(core.includes("process.env"), false);
  assert.equal(core.includes("fetch("), false);
  assert.ok(
    artifacts.includes(
      ".augnes-lab/operational-reentry-v04-stale-reset-isolation-cohorts",
    ),
  );
  assert.ok(artifacts.includes('openSync(marker, "wx"'));
  assert.ok(
    runner.includes(
      "--confirm-operational-reentry-v04-stale-reset-isolation-cohort",
    ),
  );
  assert.ok(runner.includes("--authorization-file"));
  assert.ok(runner.includes("refs/remotes/origin/main^{commit}"));
  assert.equal(runner.includes("buildOperationalReentryV04StaleResetIsolationAuthorizationV01"), false);

  return {
    status:
      "operational_reentry_v04_stale_reset_isolation_conformance_passed" as const,
    planned_calls: 16,
    repeat_blocks: 4,
    all_six_direct_pairs_per_block: 6,
    sealed_plan_fingerprint: plan.integrity.fingerprint,
    gate_contract_fingerprint: plan.gate_contract_fingerprint,
    evaluator_fingerprint: contract.evaluator_fingerprint,
    bg_static_conformance_witness_fingerprint:
      contract.bg_static_conformance_witness_fingerprint,
    case_fingerprint: ACGC_E2R2P6H_CASE_FINGERPRINT_V01,
    common_task_evidence_fingerprint:
      ACGC_E2R2P6H_COMMON_TASK_EVIDENCE_FINGERPRINT_V01,
    route_fingerprint: ACGC_E2R2P6H_ROUTE_FINGERPRINT_V01,
    provider_contract_fingerprint:
      ACGC_E2R2P6H_PROVIDER_CONTRACT_FINGERPRINT_V01,
    adapter_request_route_fingerprint:
      ACGC_E2R2P6H_ADAPTER_REQUEST_ROUTE_FINGERPRINT_V01,
    fake_transport_calls: 0,
    real_provider_calls: 0,
    live_authorizations_created: 0,
    live_authorizations_consumed: 0,
    behavioral_outputs_generated: false,
    stage_7_started: false,
  };
}

function sourceV01(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}
