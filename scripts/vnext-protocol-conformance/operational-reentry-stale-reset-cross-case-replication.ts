import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  OPERATIONAL_REENTRY_STALE_RESET_R1_CASE_ID_V01,
  OPERATIONAL_REENTRY_STALE_RESET_R2_CASE_ID_V01,
  readOperationalReentryStaleResetCrossCaseV01,
} from "@/fixtures/vnext/research/operational-reentry-stale-reset-cross-case-replication-v0-1";
import {
  buildOperationalReentryStaleResetCrossCaseProviderContractV01,
  OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_AGGREGATE_PARSER_CLOSURE_V01,
  OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_PER_SHAPE_PARSER_CLOSURE_V01,
  OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_WIRE_BUDGET_PROOF_V01,
} from "@/lib/vnext/model-gateway/openai/operational-reentry-stale-reset-cross-case-replication-v0-1-codec";
import {
  buildOperationalReentryStaleResetCrossCaseAuthorizationContractV01,
  buildOperationalReentryStaleResetCrossCaseCompatibilityAuthorizationContractV01,
  buildOperationalReentryStaleResetCrossCaseEvaluatorBindingV01,
  buildOperationalReentryStaleResetCrossCaseGateContractV01,
  operationalReentryStaleResetCrossCaseStaticAuthorityV01,
  OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_DIRECT_PAIRS_V01,
  OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_SEALED_ORDER_V01,
} from "@/lib/vnext/operational-reentry-stale-reset-cross-case-replication";
import { buildOperationalReentryStaleResetCrossCaseReplicationArtifactFamilyContractV01 } from "@/lib/vnext/operational-reentry-stale-reset-cross-case-replication-artifact-store";
import { buildOperationalReentryStaleResetCrossCaseCompatibilityArtifactFamilyContractV01 } from "@/lib/vnext/operational-reentry-stale-reset-cross-case-compatibility-artifact-store";

export function runOperationalReentryStaleResetCrossCaseReplicationConformanceV01() {
  const r1 = readOperationalReentryStaleResetCrossCaseV01(OPERATIONAL_REENTRY_STALE_RESET_R1_CASE_ID_V01);
  const r2 = readOperationalReentryStaleResetCrossCaseV01(OPERATIONAL_REENTRY_STALE_RESET_R2_CASE_ID_V01);
  const provider = buildOperationalReentryStaleResetCrossCaseProviderContractV01();
  assert.notEqual(r1.integrity.fingerprint, r2.integrity.fingerprint);
  assert.deepEqual(OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_SEALED_ORDER_V01, [["A", "B", "G", "C"], ["B", "C", "A", "G"], ["C", "G", "B", "A"], ["G", "A", "C", "B"]]);
  assert.equal(OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_DIRECT_PAIRS_V01.length, 6);
  assert.equal(provider.compatibility_result, "none");
  assert.equal(provider.parser_closed_wire_contract, true);
  assert.equal(Object.keys(OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_PER_SHAPE_PARSER_CLOSURE_V01).length, 6);
  assert.equal(Object.values(OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_PER_SHAPE_PARSER_CLOSURE_V01).reduce((sum, value) => sum + value, 0), OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_AGGREGATE_PARSER_CLOSURE_V01);
  assert.equal(OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_WIRE_BUDGET_PROOF_V01.maximum_canonical_wire_response_bytes <= 1168, true);
  assert.equal(buildOperationalReentryStaleResetCrossCaseEvaluatorBindingV01(r1.case_id).runtime_token_name_inference, false);
  assert.notEqual(buildOperationalReentryStaleResetCrossCaseGateContractV01(r1.case_id).integrity.fingerprint, buildOperationalReentryStaleResetCrossCaseGateContractV01(r2.case_id).integrity.fingerprint);
  assert.equal(buildOperationalReentryStaleResetCrossCaseAuthorizationContractV01().creates_candidate, false);
  assert.equal(buildOperationalReentryStaleResetCrossCaseCompatibilityAuthorizationContractV01().creates_candidate, false);
  assert.notEqual(buildOperationalReentryStaleResetCrossCaseReplicationArtifactFamilyContractV01().namespace, buildOperationalReentryStaleResetCrossCaseCompatibilityArtifactFamilyContractV01().namespace as string);
  assert.equal(operationalReentryStaleResetCrossCaseStaticAuthorityV01.real_provider_calls, 0);
  assert.equal(operationalReentryStaleResetCrossCaseStaticAuthorityV01.replication_live_GO, false);

  const providerNeutral = source("lib/vnext/operational-reentry-stale-reset-cross-case-replication.ts");
  assert.equal(providerNeutral.includes("model-gateway/openai"), false);
  assert.equal(providerNeutral.includes("fetch("), false);
  for (const runner of ["scripts/operational-reentry-stale-reset-cross-case-compatibility.ts", "scripts/operational-reentry-stale-reset-cross-case-replication.ts"]) {
    const contents = source(runner);
    assert.ok(contents.includes("--authorization-file"));
    assert.ok(contents.includes("--pricing-file"));
    assert.ok(contents.includes("--repository-root"));
  }

  return {
    status: "operational_reentry_stale_reset_cross_case_replication_conformance_passed" as const,
    r1_case_fingerprint: r1.integrity.fingerprint,
    r2_case_fingerprint: r2.integrity.fingerprint,
    provider_contract_fingerprint: provider.integrity.fingerprint,
    parser_shapes: 6,
    parser_closure_cardinality: OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_AGGREGATE_PARSER_CLOSURE_V01,
    real_provider_calls: 0,
  };
}

function source(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}
