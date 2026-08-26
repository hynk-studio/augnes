import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  operationalReentryMatchedCohortCaseFixtureV02,
} from "@/fixtures/vnext/research/operational-reentry-matched-cohort-v0-2";
import {
  assertOperationalReentryV04StaleResetIsolationAuthorizationUnusedV01,
  assertOperationalReentryV04StaleResetIsolationIdentityAvailableV01,
  assertOperationalReentryV04StaleResetIsolationPublicSafeArtifactV01,
  beginOperationalReentryV04StaleResetIsolationAttemptV01,
  buildOperationalReentryV04StaleResetIsolationArtifactFamilyContractV01,
  OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_ARTIFACT_NAMESPACE_V01,
  validateOperationalReentryV04StaleResetIsolationArtifactsV01,
} from "@/lib/vnext/operational-reentry-v0-4-stale-reset-isolation-artifact-store";
import {
  ACGC_E2R2P6H_ADAPTER_REQUEST_ROUTE_FINGERPRINT_V01,
  ACGC_E2R2P6H_CASE_FINGERPRINT_V01,
  ACGC_E2R2P6H_COMMON_TASK_EVIDENCE_FINGERPRINT_V01,
  ACGC_E2R2P6H_DIRECT_PAIRS_V01,
  ACGC_E2R2P6H_PROVIDER_CONTRACT_FINGERPRINT_V01,
  ACGC_E2R2P6H_ROUTE_FINGERPRINT_V01,
  ACGC_E2R2P6H_SEALED_ORDER_V01,
  assertOperationalReentryV04StaleResetIsolationGProviderProjectionV01,
  buildOperationalReentryV04StaleResetIsolationAuthorizationContractV01,
  buildOperationalReentryV04StaleResetIsolationAuthorizationV01,
  buildOperationalReentryV04StaleResetIsolationCohortV01,
  buildOperationalReentryV04StaleResetIsolationEvaluatorContractV01,
  buildOperationalReentryV04StaleResetIsolationGatedInvocationV01,
  buildOperationalReentryV04StaleResetIsolationGateContractV01,
  buildOperationalReentryV04StaleResetIsolationHarnessContractV01,
  buildOperationalReentryV04StaleResetIsolationLayerAV01,
  buildOperationalReentryV04StaleResetIsolationLayerBV01,
  buildOperationalReentryV04StaleResetIsolationPlanV01,
  buildOperationalReentryV04StaleResetIsolationPricingV01,
  deriveOperationalReentryV04StaleResetIsolationPairV01,
  evaluateOperationalReentryV04StaleResetIsolationBlockV01,
  operationalReentryV04StaleResetIsolationHarnessAuthorityV01,
  operationalReentryV04StaleResetIsolationHypothesesV01,
  runOperationalReentryV04StaleResetIsolationCohortV01,
} from "@/lib/vnext/operational-reentry-v0-4-stale-reset-isolation-cohort";
import { ModelGatewayInvocationErrorV01 } from "@/lib/vnext/model-gateway/contracts";
import {
  buildOperationalReentryMatchedCohortGoldenWireOutputV04,
  buildOperationalReentryMatchedCohortInvocationV04,
} from "@/lib/vnext/operational-reentry-matched-cohort-v0-4";
import {
  createOperationalReentryMatchedCohortLocalInvocationIdentityFingerprintV04,
  createOperationalReentryMatchedCohortProviderMaterialFingerprintV04,
  parseOperationalReentryMatchedCohortOutputV04,
} from "@/lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-v0-4-codec";
import {
  createOpenAIResponsesAdapterV01,
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02,
} from "@/lib/vnext/model-gateway/openai/responses-adapter";
import {
  prepareOperationalReentryMatchedCohortModelGatewayRouteV04,
  projectOperationalReentryMatchedCohortProviderRequestV04,
  readOperationalReentryMatchedCohortProviderContractV04,
  type ModelGatewayInteractiveAdmissionV01,
} from "@/lib/vnext/model-gateway/model-gateway";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  preflightOperationalReentryV04StaleResetIsolationRepositoryV01,
  refreshOperationalReentryV04StaleResetIsolationRemoteMainV01,
} from "@/scripts/operational-reentry-v0-4-stale-reset-isolation-cohort";
import {
  OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V05,
  OPERATIONAL_REENTRY_MATCHED_COHORT_PARSER_VERSION_V04,
  OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V04,
  type OperationalReentryMatchedCohortModelOutputV04,
  type OperationalReentryMatchedCohortRouteV04,
  type OperationalReentryMatchedCohortWireOutputV04,
} from "@/types/vnext/operational-reentry-matched-cohort-v0-4";
import {
  OPERATIONAL_REENTRY_MATCHED_COHORT_RESPONSE_SCHEMA_VERSION_V04,
} from "@/types/vnext/operational-reentry-matched-cohort-v0-3";
import {
  type OperationalReentryV04StaleResetIsolationAuthorizationV01,
  type OperationalReentryV04StaleResetIsolationLayerAV01,
  type OperationalReentryV04StaleResetIsolationLayerBV01,
  type OperationalReentryV04StaleResetIsolationObservedArmV01,
  type OperationalReentryV04StaleResetIsolationPlanEntryV01,
  type OperationalReentryV04StaleResetIsolationPreparedV01,
} from "@/types/vnext/operational-reentry-v0-4-stale-reset-isolation-cohort";

const repositoryRoot = process.cwd();
const temporaryRoot = mkdtempSync(
  path.join(tmpdir(), "augnes-e2r2p6h-zero-egress-"),
);
const originalFetch = globalThis.fetch;
let fetchCalls = 0;
let fakeTransportCalls = 0;

void main()
  .finally(() => {
    globalThis.fetch = originalFetch;
    rmSync(temporaryRoot, { recursive: true, force: true });
  })
  .catch((error) => {
    console.error(
      "operational_reentry_v04_stale_reset_isolation_test_failed",
    );
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exitCode = 1;
  });

async function main(): Promise<void> {
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    throw new Error("P6H zero-egress tests must not call fetch");
  }) as typeof fetch;

  const planSummary = verifySealedPlanAndStaticParityV01();
  verifyGateFailureAndLeakageBoundariesV01();
  const evaluatorSummary = verifyEvaluatorV01();
  const futureSummary = await verifyFutureAuthorizationAndArtifactsV01();
  verifyFutureRunnerPreflightV01();
  verifyHistoricalAndAuthorityBoundariesV01();

  assert.equal(fetchCalls, 0);
  assert.equal(fakeTransportCalls, 16);
  console.log(
    JSON.stringify({
      status:
        "operational_reentry_v04_stale_reset_isolation_test_passed",
      plan: planSummary,
      evaluator: evaluatorSummary,
      future_contracts: futureSummary,
      provider_contract_verdict: "reuse_v04_exact",
      all_four_blocks_bg_static_parity: true,
      all_six_direct_pairs_per_complete_block: true,
      future_live_authorizations_created: 0,
      future_live_authorizations_consumed: 0,
      real_p6h_run_roots_created: 0,
      temporary_artifact_roots_only: true,
      product_database_writes: 0,
      core_writes: 0,
      fake_transport_calls: fakeTransportCalls,
      real_provider_calls: 0,
      fetch_calls: fetchCalls,
      cleanup_complete: true,
    }),
  );
}

function verifySealedPlanAndStaticParityV01() {
  const plan = buildOperationalReentryV04StaleResetIsolationPlanV01();
  const rebuilt = buildOperationalReentryV04StaleResetIsolationPlanV01();
  assert.deepEqual(
    plan.entries.map(({ arm }) => arm).join(""),
    "ABGCBCAGCGBAGACB",
  );
  assert.deepEqual(plan.sealed_order, ACGC_E2R2P6H_SEALED_ORDER_V01);
  assert.equal(plan.planned_calls, 16);
  assert.equal(plan.repeat_blocks, 4);
  assert.equal(plan.calls_per_arm, 4);
  assert.equal(plan.maximum_parallel_provider_calls, 1);
  assert.equal(plan.retries, 0);
  assert.equal(plan.replacement_calls, 0);
  assert.equal(plan.adaptive_stopping, false);
  assert.equal(plan.fresh_stateless_invocation_per_call, true);
  assert.equal(plan.conversation_reuse, false);
  assert.equal(plan.thread_reuse, false);
  assert.equal(plan.previous_response_reuse, false);
  assert.equal(plan.integrity.fingerprint, rebuilt.integrity.fingerprint);
  for (const arm of ["A", "B", "C", "G"] as const) {
    const entries = plan.entries.filter((entry) => entry.arm === arm);
    assert.equal(entries.length, 4);
    assert.equal(
      new Set(entries.map(({ position_in_block }) => position_in_block)).size,
      4,
    );
  }

  const canonical = {
    A: buildOperationalReentryMatchedCohortInvocationV04({
      arm: "A",
      cohort_ref: "p6h-canonical-a",
      call_slot_id: "e2r2p6h-call-canonical-a",
      block: 0,
    }),
    B: buildOperationalReentryMatchedCohortInvocationV04({
      arm: "B",
      cohort_ref: "p6h-canonical-b",
      call_slot_id: "e2r2p6h-call-canonical-b",
      block: 0,
    }),
    C: buildOperationalReentryMatchedCohortInvocationV04({
      arm: "C",
      cohort_ref: "p6h-canonical-c",
      call_slot_id: "e2r2p6h-call-canonical-c",
      block: 0,
    }),
  };
  for (const arm of ["A", "B", "C"] as const) {
    for (const entry of plan.entries.filter((candidate) => candidate.arm === arm)) {
      assert.equal(
        canonicalizeProtocolValueV01(entry.invocation.provider_material),
        canonicalizeProtocolValueV01(canonical[arm].provider_material),
      );
    }
  }

  const forbiddenOpaqueSemantics =
    /(?:^|[-_:])(a|b|c|g|fresh|stale|gate|block|target-present|target-absent|outcome)(?:$|[-_:])/iu;
  for (const entry of plan.entries) {
    assert.equal(forbiddenOpaqueSemantics.test(entry.request_family_trace_id), false);
    assert.equal(forbiddenOpaqueSemantics.test(entry.client_request_id), false);
    if (entry.arm === "G") {
      assert.ok(entry.gate_provenance);
      assert.equal(
        entry.gate_provenance.source_case_fingerprint,
        ACGC_E2R2P6H_CASE_FINGERPRINT_V01,
      );
      assert.equal(entry.gate_provenance.target_excluded, true);
      assert.equal(entry.gate_provenance.stale_relation_excluded, true);
      assert.equal(entry.gate_provenance.non_target_material_unchanged, true);
      assert.equal(
        entry.gate_provenance.local_provenance_provider_visibility,
        "absent",
      );
      assert.equal(
        canonicalizeProtocolValueV01(entry.invocation.provider_material),
        canonicalizeProtocolValueV01(canonical.B.provider_material),
      );
    }
  }

  assert.equal(plan.bg_conformance_witnesses.length, 4);
  for (const witness of plan.bg_conformance_witnesses) {
    assert.equal(witness.local_invocation_identities_distinct, true);
    assert.equal(witness.openai_json_request_body_bytes_equal, true);
    assert.equal(witness.g_provenance_provider_visibility, "absent");
    const b = plan.entries.find(
      (entry) => entry.repeat_block === witness.repeat_block && entry.arm === "B",
    )!;
    const g = plan.entries.find(
      (entry) => entry.repeat_block === witness.repeat_block && entry.arm === "G",
    )!;
    const bRequest = projectOperationalReentryMatchedCohortProviderRequestV04(
      b.invocation,
    );
    const gRequest = projectOperationalReentryMatchedCohortProviderRequestV04(
      g.invocation,
    );
    assert.notEqual(b.cohort_ref, g.cohort_ref);
    assert.notEqual(b.call_slot_id, g.call_slot_id);
    assert.notEqual(
      b.local_invocation_identity_fingerprint,
      g.local_invocation_identity_fingerprint,
    );
    assert.notEqual(b.request_family_trace_id, g.request_family_trace_id);
    assert.notEqual(b.client_request_id, g.client_request_id);
    assert.notEqual(
      b.local_manifest_identity_fingerprint,
      g.local_manifest_identity_fingerprint,
    );
    assert.equal(b.provider_material_fingerprint, g.provider_material_fingerprint);
    assert.equal(bRequest.request_body, gRequest.request_body);
    assert.equal(bRequest.request_fingerprint, gRequest.request_fingerprint);
    assert.equal(bRequest.schema_fingerprint, gRequest.schema_fingerprint);
    assert.equal(bRequest.model, OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02);
    const providerVisible = `${canonicalizeProtocolValueV01(
      g.invocation.provider_material,
    )}\n${gRequest.request_body}`;
    for (const token of [
      g.gate_provenance!.provenance_version,
      g.gate_provenance!.gate_version,
      g.gate_provenance!.source_gate_lineage_fingerprint,
      g.gate_provenance!.integrity.fingerprint,
      "gate_disposition",
      "source_gate_lineage_fingerprint",
      "local_provenance_provider_visibility",
    ]) {
      assert.equal(providerVisible.includes(token), false);
    }
  }

  const providerContract =
    readOperationalReentryMatchedCohortProviderContractV04();
  assert.equal(
    operationalReentryMatchedCohortCaseFixtureV02.integrity.fingerprint,
    ACGC_E2R2P6H_CASE_FINGERPRINT_V01,
  );
  assert.equal(
    createProtocolSha256V01(
      canonicalizeProtocolValueV01(
        operationalReentryMatchedCohortCaseFixtureV02.provider_visible
          .common_task_evidence,
      ),
    ),
    ACGC_E2R2P6H_COMMON_TASK_EVIDENCE_FINGERPRINT_V01,
  );
  assert.equal(
    providerContract.integrity.fingerprint,
    ACGC_E2R2P6H_PROVIDER_CONTRACT_FINGERPRINT_V01,
  );
  assert.equal(
    providerContract.provider_contract_version,
    OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V04,
  );
  assert.equal(
    providerContract.input_codec_version,
    OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V05,
  );
  assert.equal(
    providerContract.response_schema_version,
    OPERATIONAL_REENTRY_MATCHED_COHORT_RESPONSE_SCHEMA_VERSION_V04,
  );
  assert.equal(
    providerContract.parser_version,
    OPERATIONAL_REENTRY_MATCHED_COHORT_PARSER_VERSION_V04,
  );
  assert.equal(providerContract.response_bytes, 1168);
  assert.equal(providerContract.max_output_tokens, 1168);
  assert.equal(providerContract.parser_closure_cardinality, 172032);

  const contract =
    buildOperationalReentryV04StaleResetIsolationHarnessContractV01();
  return {
    order: ["ABGC", "BCAG", "CGBA", "GACB"],
    fingerprint: plan.integrity.fingerprint,
    gate_contract_fingerprint: plan.gate_contract_fingerprint,
    bg_conformance_witness_fingerprint:
      contract.bg_static_conformance_witness_fingerprint,
  };
}

function verifyGateFailureAndLeakageBoundariesV01(): void {
  const gate = buildOperationalReentryV04StaleResetIsolationGateContractV01();
  for (const invalid of [
    { declared_source_case_fingerprint: "sha256:" + "0".repeat(64) },
    { declared_upstream_target_fingerprint: "sha256:" + "1".repeat(64) },
    { declared_upstream_stale_relation_fingerprint: "sha256:" + "2".repeat(64) },
    { declared_non_target_material_fingerprint: "sha256:" + "3".repeat(64) },
    { gate_version: "operational_reentry_v04_stale_reset_isolation_gate.v9.9" },
    { gate_disposition: "included" },
  ]) {
    let projectionCalls = 0;
    assert.throws(
      () =>
        buildOperationalReentryV04StaleResetIsolationGatedInvocationV01(
          {
            cohort_ref: "p6h-invalid-gate",
            call_slot_id: "e2r2p6h-call-invalid-gate",
            repeat_block: 0,
            ...invalid,
          },
          {
            project_provider_request(invocation) {
              projectionCalls += 1;
              return projectOperationalReentryMatchedCohortProviderRequestV04(
                invocation,
              );
            },
          },
        ),
      /operational_reentry_v04_stale_reset_gate_provenance_invalid/,
    );
    assert.equal(projectionCalls, 0);
  }

  const valid = buildOperationalReentryV04StaleResetIsolationGatedInvocationV01({
    cohort_ref: "p6h-provenance-only-change",
    call_slot_id: "e2r2p6h-call-provenance-only-change",
    repeat_block: 0,
  });
  const bodyBefore =
    projectOperationalReentryMatchedCohortProviderRequestV04(
      valid.invocation,
    ).request_body;
  const changedLocalProvenance = {
    ...valid.provenance,
    source_gate_lineage_fingerprint: "sha256:" + "9".repeat(64),
  };
  assert.notEqual(
    changedLocalProvenance.source_gate_lineage_fingerprint,
    valid.provenance.source_gate_lineage_fingerprint,
  );
  assert.equal(
    projectOperationalReentryMatchedCohortProviderRequestV04(valid.invocation)
      .request_body,
    bodyBefore,
  );

  const leaked = structuredClone(valid.invocation);
  leaked.provider_material.continuation_context.push(
    structuredClone(
      buildOperationalReentryMatchedCohortInvocationV04({
        arm: "C",
        cohort_ref: "p6h-leak-source",
        call_slot_id: "e2r2p6h-call-leak-source",
        block: 0,
      }).provider_material.continuation_context.find(
        (item) => item.role === "target",
      )!,
    ),
  );
  assert.throws(
    () =>
      assertOperationalReentryV04StaleResetIsolationGProviderProjectionV01({
        gated_invocation: leaked,
        canonical_b_invocation: buildOperationalReentryMatchedCohortInvocationV04({
          arm: "B",
          cohort_ref: "p6h-leak-comparison",
          call_slot_id: "e2r2p6h-call-leak-comparison",
          block: 0,
        }),
        expected_non_target_material_fingerprint:
          gate.non_target_material_fingerprint,
      }),
    /new_provider_contract_required/,
  );
}

function verifyEvaluatorV01() {
  const plan = buildOperationalReentryV04StaleResetIsolationPlanV01();
  const evaluator =
    buildOperationalReentryV04StaleResetIsolationEvaluatorContractV01();
  assert.deepEqual(evaluator.layer_a_dimensions, [
    "upstream_target_identity",
    "upstream_stale_relation_identity",
    "substrate_gate_disposition",
    "source_gate_lineage",
    "provider_projection_shape",
    "provider_target_material",
    "provider_stale_relation",
    "provider_material_fingerprint",
    "provider_request_fingerprint",
    "local_provenance_provider_visibility",
  ]);
  assert.deepEqual(evaluator.layer_b_independent_dimensions, [
    "selected_or_referenced_target_identity",
    "target_action_or_decision_preparation",
    "target_specific_result_limitation",
  ]);
  assert.equal(evaluator.dimension_counting, false);
  assert.equal(evaluator.majority_vote, false);
  assert.equal(evaluator.weighting, false);
  assert.equal(evaluator.scalar_score, false);
  assert.equal(evaluator.rank_or_winner, false);
  assert.equal(evaluator.transitive_pair_inference, false);

  for (const block of [0, 1, 2, 3] as const) {
    const observed = plan.entries
      .filter((entry) => entry.repeat_block === block)
      .map((entry) => observedV01(entry, normalizedGoldenV01(entry)));
    const result =
      evaluateOperationalReentryV04StaleResetIsolationBlockV01(
        block,
        observed,
      );
    assert.equal(result.status, "complete");
    assert.equal(result.pair_evaluations.length, 6);
    assert.deepEqual(
      result.pair_evaluations.map(({ pair_id }) => pair_id),
      ACGC_E2R2P6H_DIRECT_PAIRS_V01.map(([left, right]) =>
        `${left}-${right}`,
      ),
    );
    assert.equal(
      result.pair_evaluations.every(
        (pair) => pair.direct_evaluation && !pair.inferred_transitively,
      ),
      true,
    );
    assert.equal(result.all_six_pairs_evaluated_directly, true);
    assert.equal(result.pair_results_inferred_transitively, false);
  }

  const a = entryV01(plan, 0, "A");
  const b = entryV01(plan, 0, "B");
  const c = entryV01(plan, 0, "C");
  const g = entryV01(plan, 0, "G");
  const aGolden = normalizedGoldenV01(a);
  const bGolden = normalizedGoldenV01(b);
  const cGolden = normalizedGoldenV01(c);
  const gGolden = normalizedGoldenV01(g);

  const layerAC = buildOperationalReentryV04StaleResetIsolationLayerAV01(c);
  assert.equal(layerAC.provider_target_material, "present");
  assert.equal(layerAC.provider_stale_relation, "present");
  const cNoPersistence =
    buildOperationalReentryV04StaleResetIsolationLayerBV01(c, cGolden);
  assert.equal(cNoPersistence.state, "no_target_persistence_observed");
  assert.equal(
    cNoPersistence.selected_or_referenced_target_identity,
    "absent",
  );
  assert.equal(cNoPersistence.target_action_or_decision_preparation, "absent");

  const cPersistence = normalizedWithSelectionsV01(c, {
    target_reference: true,
    target_action: false,
    limitations: ["limitation_non_authoritative"],
  });
  const cPersistenceLayer =
    buildOperationalReentryV04StaleResetIsolationLayerBV01(c, cPersistence);
  assert.equal(
    cPersistenceLayer.state,
    "bounded_target_persistence_observed",
  );

  const bgGoldenPair =
    deriveOperationalReentryV04StaleResetIsolationPairV01(
      observedV01(b, bGolden),
      observedV01(g, gGolden),
    );
  assert.equal(bgGoldenPair.target_persistence_relation, "equal");
  assert.equal(
    buildOperationalReentryV04StaleResetIsolationLayerBV01(b, bGolden).state,
    "no_target_persistence_observed",
  );
  assert.equal(
    buildOperationalReentryV04StaleResetIsolationLayerBV01(g, gGolden).state,
    "no_target_persistence_observed",
  );

  const gDistinctWholeOutput = normalizedWithSelectionsV01(g, {
    target_reference: false,
    target_action: false,
    limitations: ["limitation_non_authoritative"],
    suppress_first_non_target_reference: true,
  });
  assert.notEqual(
    canonicalizeProtocolValueV01(bGolden),
    canonicalizeProtocolValueV01(gDistinctWholeOutput),
  );
  const bgDistinctPair =
    deriveOperationalReentryV04StaleResetIsolationPairV01(
      observedV01(b, bGolden),
      observedV01(g, gDistinctWholeOutput),
    );
  assert.notEqual(bgDistinctPair.hypothesis_label, null);
  assert.equal(
    "hypothesis_result" in (bgDistinctPair as unknown as Record<string, unknown>),
    false,
  );

  const treatmentInvalidLayerA = structuredClone(
    buildOperationalReentryV04StaleResetIsolationLayerAV01(a),
  );
  treatmentInvalidLayerA.provider_target_material = "absent";
  const treatmentInvalid =
    deriveOperationalReentryV04StaleResetIsolationPairV01(
      observedV01(a, aGolden, { layer_a: treatmentInvalidLayerA }),
      observedV01(b, bGolden),
    );
  assert.equal(treatmentInvalid.comparison_status, "protocol_invalid");

  const parityDriftEntry = structuredClone(b);
  parityDriftEntry.non_intervention_parity_fingerprint =
    "sha256:" + "d".repeat(64);
  const parityDrift =
    deriveOperationalReentryV04StaleResetIsolationPairV01(
      observedV01(parityDriftEntry, bGolden),
      observedV01(g, gGolden),
    );
  assert.equal(parityDrift.comparison_status, "not_comparable");
  assert.equal(parityDrift.target_persistence_relation, "not_comparable");

  const validBLayer =
    buildOperationalReentryV04StaleResetIsolationLayerBV01(b, bGolden);
  const packetContradiction = sealLayerBV01({
    ...stripIntegrityV01(validBLayer),
    continuation_packet_target_material: "present",
  });
  const packetInvalid =
    deriveOperationalReentryV04StaleResetIsolationPairV01(
      observedV01(b, bGolden, { layer_b: packetContradiction }),
      observedV01(g, gGolden),
    );
  assert.equal(packetInvalid.comparison_status, "protocol_invalid");

  const dispositionContradiction = sealLayerBV01({
    ...stripIntegrityV01(validBLayer),
    target_disposition: "applied_to_structure",
  });
  const dispositionInvalid =
    deriveOperationalReentryV04StaleResetIsolationPairV01(
      observedV01(b, bGolden, { layer_b: dispositionContradiction }),
      observedV01(g, gGolden),
    );
  assert.equal(dispositionInvalid.comparison_status, "protocol_invalid");

  const invalidCommonA = normalizedWithSelectionsV01(a, {
    required_check_disposition: "failed",
  });
  const oneSidedCompliance =
    deriveOperationalReentryV04StaleResetIsolationPairV01(
      observedV01(a, invalidCommonA),
      observedV01(b, bGolden),
    );
  assert.equal(oneSidedCompliance.comparison_status, "compliance_asymmetry");
  assert.equal(
    oneSidedCompliance.target_persistence_relation,
    "compliance_asymmetry",
  );
  assert.equal(
    Object.values(oneSidedCompliance.dimension_relations).every(
      (relation) => relation === "not_comparable",
    ),
    true,
  );

  const invalidCommonB = normalizedWithSelectionsV01(b, {
    required_check_disposition: "failed",
  });
  const bothInvalid =
    deriveOperationalReentryV04StaleResetIsolationPairV01(
      observedV01(a, invalidCommonA),
      observedV01(b, invalidCommonB),
    );
  assert.equal(bothInvalid.comparison_status, "not_comparable");
  assert.equal(bothInvalid.common_compliance_relation, "both_invalid");

  const unknown = deriveOperationalReentryV04StaleResetIsolationPairV01(
    observedV01(a, null),
    observedV01(b, bGolden),
  );
  assert.equal(unknown.comparison_status, "unknown");
  assert.equal(unknown.target_persistence_relation, "unknown");

  const equal = deriveOperationalReentryV04StaleResetIsolationPairV01(
    observedV01(b, bGolden),
    observedV01(g, gGolden),
  );
  assert.equal(equal.target_persistence_relation, "equal");

  const left = deriveOperationalReentryV04StaleResetIsolationPairV01(
    observedV01(a, aGolden),
    observedV01(b, bGolden),
  );
  assert.equal(left.target_persistence_relation, "left_persists_more");
  const right = deriveOperationalReentryV04StaleResetIsolationPairV01(
    observedV01(b, bGolden),
    observedV01(a, aGolden),
  );
  assert.equal(right.target_persistence_relation, "right_persists_more");

  const leftMixedLayer = sealLayerBV01({
    ...stripIntegrityV01(
      buildOperationalReentryV04StaleResetIsolationLayerBV01(a, aGolden),
    ),
    selected_or_referenced_target_identity: "present",
    target_action_or_decision_preparation: "absent",
    target_specific_result_limitation: "absent",
    continuation_packet_target_material: "present",
    target_disposition: "reference_only",
    state: "bounded_target_persistence_observed",
  });
  const rightMixedLayer = sealLayerBV01({
    ...stripIntegrityV01(
      buildOperationalReentryV04StaleResetIsolationLayerBV01(c, cGolden),
    ),
    selected_or_referenced_target_identity: "absent",
    target_action_or_decision_preparation: "present",
    target_specific_result_limitation: "absent",
    continuation_packet_target_material: "absent",
    target_disposition: "applied_to_structure",
    state: "bounded_target_persistence_observed",
  });
  const mixed = deriveOperationalReentryV04StaleResetIsolationPairV01(
    observedV01(a, aGolden, { layer_b: leftMixedLayer }),
    observedV01(c, cGolden, { layer_b: rightMixedLayer }),
  );
  assert.equal(mixed.target_persistence_relation, "mixed");

  const unknownLayer = sealLayerBV01({
    ...stripIntegrityV01(validBLayer),
    selected_or_referenced_target_identity: "unknown",
    continuation_packet_target_material: "unknown",
    target_disposition: "unknown",
    state: "unknown",
  });
  const blockingUnknown =
    deriveOperationalReentryV04StaleResetIsolationPairV01(
      observedV01(b, bGolden, { layer_b: unknownLayer }),
      observedV01(g, gGolden),
    );
  assert.equal(blockingUnknown.target_persistence_relation, "unknown");

  const notComparableLayer = sealLayerBV01({
    ...stripIntegrityV01(validBLayer),
    target_specific_result_limitation: "mixed",
    target_disposition: "unknown",
    state: "not_comparable",
  });
  const blockingNotComparable =
    deriveOperationalReentryV04StaleResetIsolationPairV01(
      observedV01(b, bGolden, { layer_b: notComparableLayer }),
      observedV01(g, gGolden),
    );
  assert.equal(
    blockingNotComparable.target_persistence_relation,
    "not_comparable",
  );

  const requiredCheckOnly = normalizedWithSelectionsV01(b, {
    required_check_disposition: "failed",
  });
  const requiredCheckLayer =
    buildOperationalReentryV04StaleResetIsolationLayerBV01(
      b,
      requiredCheckOnly,
    );
  assert.equal(
    requiredCheckLayer.target_specific_required_check_relation,
    "not_available_under_v04",
  );
  assert.equal(
    requiredCheckLayer.selected_or_referenced_target_identity,
    validBLayer.selected_or_referenced_target_identity,
  );
  assert.equal(
    requiredCheckLayer.target_action_or_decision_preparation,
    validBLayer.target_action_or_decision_preparation,
  );

  const serialPair = JSON.stringify(mixed);
  assert.equal(serialPair.includes('"score"'), false);
  assert.equal(serialPair.includes('"rank"'), false);
  assert.equal(serialPair.includes('"winner"'), false);
  assert.equal(serialPair.includes('"weight"'), false);
  assert.equal(
    buildOperationalReentryV04StaleResetIsolationLayerBV01(
      a,
      normalizedWithSelectionsV01(a, { target_action: true }),
    ).action_and_decision_preparation_counted_once,
    true,
  );
  assert.equal(operationalReentryV04StaleResetIsolationHypothesesV01.results, null);
  for (const label of ["H1", "H2", "H3", "H4", "H5"] as const) {
    assert.equal(
      operationalReentryV04StaleResetIsolationHypothesesV01[label].includes(
        "passed",
      ),
      false,
    );
  }

  return {
    fingerprint: evaluator.integrity.fingerprint,
    layer_a_dimensions: evaluator.layer_a_dimensions,
    layer_b_independent_dimensions: evaluator.layer_b_independent_dimensions,
    deterministic_no_score_aggregation: true,
    all_six_direct_pairs: evaluator.direct_pairs,
  };
}

function entryV01(
  plan: ReturnType<typeof buildOperationalReentryV04StaleResetIsolationPlanV01>,
  block: 0 | 1 | 2 | 3,
  arm: "A" | "B" | "C" | "G",
): OperationalReentryV04StaleResetIsolationPlanEntryV01 {
  return plan.entries.find(
    (entry) => entry.repeat_block === block && entry.arm === arm,
  )!;
}

function observedV01(
  entry: OperationalReentryV04StaleResetIsolationPlanEntryV01,
  normalizedOutput: OperationalReentryMatchedCohortModelOutputV04 | null,
  override: {
    layer_a?: OperationalReentryV04StaleResetIsolationLayerAV01;
    layer_b?: OperationalReentryV04StaleResetIsolationLayerBV01;
  } = {},
): OperationalReentryV04StaleResetIsolationObservedArmV01 {
  return {
    entry,
    normalized_output: normalizedOutput,
    ...override,
  };
}

function normalizedGoldenV01(
  entry: OperationalReentryV04StaleResetIsolationPlanEntryV01,
): OperationalReentryMatchedCohortModelOutputV04 {
  const arm = entry.arm === "G" ? "B" : entry.arm;
  return parseOperationalReentryMatchedCohortOutputV04(
    JSON.stringify(buildOperationalReentryMatchedCohortGoldenWireOutputV04(arm)),
    entry.invocation.provider_material,
  );
}

function normalizedWithSelectionsV01(
  entry: OperationalReentryV04StaleResetIsolationPlanEntryV01,
  options: {
    target_reference?: boolean;
    target_action?: boolean;
    limitations?: string[];
    required_check_disposition?: "passed" | "failed" | "blocked" | "unknown";
    suppress_first_non_target_reference?: boolean;
  },
): OperationalReentryMatchedCohortModelOutputV04 {
  const arm = entry.arm === "G" ? "B" : entry.arm;
  const wire = structuredClone(
    buildOperationalReentryMatchedCohortGoldenWireOutputV04(arm),
  );
  const targetToken = entry.invocation.provider_material.continuation_context.find(
    (item) => item.role === "target",
  )?.context_token;
  if (options.target_reference !== undefined && targetToken) {
    wire.referenced_continuation_selections[targetToken] =
      options.target_reference;
  }
  if (options.suppress_first_non_target_reference) {
    const token = entry.invocation.provider_material.continuation_context.find(
      (item) => item.role === "non_target",
    )?.context_token;
    if (token) wire.referenced_continuation_selections[token] = false;
  }
  if (options.target_action !== undefined) {
    wire.operation_action_class_selections.target_linked_verification_preparation =
      options.target_action;
  }
  if (options.limitations) {
    for (const token of Object.keys(wire.result_limitation_selections)) {
      wire.result_limitation_selections[token] =
        options.limitations.includes(token);
    }
  }
  if (options.required_check_disposition) {
    wire.required_check_disposition = options.required_check_disposition;
  }
  return parseOperationalReentryMatchedCohortOutputV04(
    JSON.stringify(wire satisfies OperationalReentryMatchedCohortWireOutputV04),
    entry.invocation.provider_material,
  );
}

function stripIntegrityV01<T extends { integrity: unknown }>(
  value: T,
): Omit<T, "integrity"> {
  const { integrity: _integrity, ...payload } = value;
  return payload;
}

function sealLayerBV01(
  payload: Omit<OperationalReentryV04StaleResetIsolationLayerBV01, "integrity">,
): OperationalReentryV04StaleResetIsolationLayerBV01 {
  return {
    ...payload,
    integrity: {
      algorithm: "sha256",
      canonicalization: "augnes-json-c14n-v0_1",
      fingerprint_scope:
        "operational_reentry_v04_stale_reset_isolation_layer_b_without_integrity_fingerprint",
      fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(payload),
      ),
    },
  };
}

async function verifyFutureAuthorizationAndArtifactsV01() {
  const adapter = createOpenAIResponsesAdapterV01({
    environment: {
      OPENAI_API_KEY: "fake-test-credential-never-persisted",
      OPENAI_MODEL: "ambient-model-must-not-override-frozen-v04",
    },
    transport: async () => {
      fakeTransportCalls += 1;
      throw new Error("P6H static authorization tests must not invoke transport");
    },
  });
  const route =
    await prepareOperationalReentryMatchedCohortModelGatewayRouteV04({
      adapter,
    });
  assert.ok(route);
  assert.equal(route.integrity_fingerprint, ACGC_E2R2P6H_ROUTE_FINGERPRINT_V01);
  assert.equal(
    route.provider_contract_fingerprint,
    ACGC_E2R2P6H_PROVIDER_CONTRACT_FINGERPRINT_V01,
  );
  assert.equal(route.model_ref.external_id, OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02);

  const admission: ModelGatewayInteractiveAdmissionV01 = {
    workspace_id: "workspace:11111111-1111-4111-8111-111111111111",
    project_id: "project:22222222-2222-4222-8222-222222222222",
    expected_active_selection_revision: 7,
    project_root: {
      path_flavor: "posix",
      normalized_path: "/public-safe-synthetic-p6h-root",
    },
    gateway_authorization_project_is_lab_experiment_meaning: false,
  };
  const evaluatedAt = "2026-09-01T00:10:00.000Z";
  const pricing = buildOperationalReentryV04StaleResetIsolationPricingV01({
    admission,
    route,
    evaluated_at: evaluatedAt,
    pricing_source_version: "official-openai-pricing-future-test-v01",
    pricing_effective_at: "2026-09-01T00:00:00.000Z",
    pricing_expires_at: "2026-09-01T02:00:00.000Z",
    input_nano_usd_per_token: 400,
    cached_input_nano_usd_per_token: 100,
    output_nano_usd_per_token: 1600,
  });
  const plan = buildOperationalReentryV04StaleResetIsolationPlanV01();
  const gate = buildOperationalReentryV04StaleResetIsolationGateContractV01();
  const evaluator =
    buildOperationalReentryV04StaleResetIsolationEvaluatorContractV01();
  const harness =
    buildOperationalReentryV04StaleResetIsolationHarnessContractV01();
  const authorizationContract =
    buildOperationalReentryV04StaleResetIsolationAuthorizationContractV01();
  assert.equal(
    authorizationContract.constructing_or_validating_contract_creates_live_authorization,
    false,
  );
  assert.equal(
    authorizationContract.implementation_issue_number_forbidden,
    237,
  );
  const authorization =
    buildOperationalReentryV04StaleResetIsolationAuthorizationV01({
      authorization_id: "p6h-future-static-test-authorization",
      future_live_issue_number: 238,
      exact_merged_source_head: "a".repeat(40),
      repository_slug: "hynk-studio/augnes",
      authorized_origin:
        "https://github.com/hynk-studio/augnes.git",
      issued_at: "2026-09-01T00:05:00.000Z",
      expires_at: "2026-09-01T01:00:00.000Z",
      workspace_id: admission.workspace_id,
      project_id: admission.project_id,
      expected_active_selection_revision:
        admission.expected_active_selection_revision,
      project_root_fingerprint: fingerprintV01(admission.project_root),
      gateway_authorization_project_is_lab_experiment_meaning: false,
      case_fingerprint: ACGC_E2R2P6H_CASE_FINGERPRINT_V01,
      common_task_evidence_fingerprint:
        ACGC_E2R2P6H_COMMON_TASK_EVIDENCE_FINGERPRINT_V01,
      g_gate_provenance_contract_fingerprint: gate.integrity.fingerprint,
      sealed_plan_fingerprint: plan.integrity.fingerprint,
      evaluator_fingerprint: evaluator.integrity.fingerprint,
      bg_static_conformance_witness_fingerprint:
        harness.bg_static_conformance_witness_fingerprint,
      route_fingerprint: route.integrity_fingerprint,
      provider_contract_fingerprint:
        ACGC_E2R2P6H_PROVIDER_CONTRACT_FINGERPRINT_V01,
      adapter_request_route_fingerprint:
        ACGC_E2R2P6H_ADAPTER_REQUEST_ROUTE_FINGERPRINT_V01,
      codec_version: OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V05,
      response_schema_version:
        OPERATIONAL_REENTRY_MATCHED_COHORT_RESPONSE_SCHEMA_VERSION_V04,
      parser_version: OPERATIONAL_REENTRY_MATCHED_COHORT_PARSER_VERSION_V04,
      adapter_implementation_id:
        "openai_responses.operational_reentry_matched_cohort",
      adapter_implementation_version:
        "openai_responses_operational_reentry_matched_cohort_adapter.v0.6",
      model: OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02,
      response_bytes: 1168,
      max_output_tokens: 1168,
      final_request_bytes: 24576,
      planned_calls: 16,
      repeat_blocks: 4,
      calls_per_arm: 4,
      maximum_parallel_provider_calls: 1,
      retries: 0,
      replacements: 0,
      adaptive_changes: 0,
      fresh_stateless_invocation_per_call: true,
      conversation_reuse: false,
      thread_reuse: false,
      previous_response_reuse: false,
      pricing_snapshot_fingerprint: pricing.integrity.fingerprint,
      pricing_snapshot_evaluated_at: pricing.pricing_snapshot_evaluated_at,
      pricing_authority_fingerprint: pricing.pricing_authority_fingerprint,
      pricing_authority_expires_at: pricing.pricing_authority_expires_at,
      aggregate_worst_case_cost_nano_usd:
        pricing.aggregate_conservative_worst_case_nano_usd,
      maximum_total_cost_nano_usd: 250_000_000,
      historical_authorization_reuse: false,
      second_cohort_under_same_authorization: false,
      replication: false,
      policy: false,
      stage_7: false,
    });
  assert.equal(authorization.future_live_issue_number, 238);
  assert.notEqual(authorization.future_live_issue_number, 237);
  assert.throws(
    () =>
      buildOperationalReentryV04StaleResetIsolationAuthorizationV01({
        ...stripAuthorizationIntegrityV01(authorization),
        future_live_issue_number: 237,
      }),
    /operational_reentry_v04_stale_reset_authorization_invalid/,
  );

  const buildInput = {
    authorization,
    pricing,
    admission,
    route,
    repository_identity: {
      repository_slug: "hynk-studio/augnes" as const,
      origin:
        "https://github.com/hynk-studio/augnes.git" as const,
    },
    evaluated_at: evaluatedAt,
  };
  const prepared =
    buildOperationalReentryV04StaleResetIsolationCohortV01(buildInput);
  assert.equal(prepared.manifest.raw_prompt_persisted, false);
  assert.equal(prepared.manifest.raw_request_body_persisted, false);
  assert.equal(prepared.manifest.raw_provider_response_persisted, false);
  assert.equal(prepared.manifest.raw_provider_error_persisted, false);
  assert.equal(prepared.manifest.hidden_reasoning_persisted, false);

  for (const [failureCode, expectedCategory] of [
    ["model_gateway_provider_rejected", "provider_rejected"],
    ["model_gateway_provider_response_invalid", "provider_response_invalid"],
  ] as const) {
    let consumptions = 0;
    const failed =
      await runOperationalReentryV04StaleResetIsolationCohortV01(
        buildInput,
        {
          invoke_gateway: async () => {
            throw new ModelGatewayInvocationErrorV01(failureCode);
          },
          assert_execution_state() {},
          consume_authorization() {
            consumptions += 1;
          },
        },
      );
    assert.equal(consumptions, 1);
    assert.equal(failed.calls[0]?.terminal_category, expectedCategory);
    assert.equal(failed.calls[0]?.failure_code, failureCode);
    assert.equal(failed.calls[0]?.egress_attempted, false);
    assert.equal(failed.calls[1]?.terminal_category, "not_attempted_after_hard_stop");
    assert.equal(failed.report.real_provider_calls, 0);
    assert.equal(failed.report.retries, 0);
    assert.equal(failed.report.replacement_calls, 0);
  }

  const artifactRepository = path.join(temporaryRoot, "artifact-repository");
  mkdirSync(artifactRepository, { recursive: true });
  writeFileSync(path.join(artifactRepository, ".gitignore"), ".augnes-lab/\n");
  assertOperationalReentryV04StaleResetIsolationAuthorizationUnusedV01({
    repository_root: artifactRepository,
    authorization_fingerprint: authorization.integrity.fingerprint,
  });
  assertOperationalReentryV04StaleResetIsolationIdentityAvailableV01({
    repository_root: artifactRepository,
    cohort_id: prepared.manifest.cohort_id,
    future_live_issue_number: 238,
  });
  const journal = beginOperationalReentryV04StaleResetIsolationAttemptV01({
    repository_root: artifactRepository,
    authorization,
    manifest: prepared.manifest,
    plan: prepared.plan,
    pricing: prepared.pricing,
  });
  assert.equal(journal.authorization_consumed, false);
  assert.equal(existsSync(path.join(artifactRepository, journal.consumption_marker_path)), false);
  const persistedResult =
    await runOperationalReentryV04StaleResetIsolationCohortV01(
      buildInput,
      {
        invoke_gateway: (async () => {
          const entry = prepared.plan.entries[fakeTransportCalls];
          assert.ok(entry);
          fakeTransportCalls += 1;
          return {
            generator: "model",
            output: normalizedGoldenV01(entry),
            model_invocation_receipt: null,
          };
        }) as unknown as NonNullable<
          Parameters<
            typeof runOperationalReentryV04StaleResetIsolationCohortV01
          >[1]["invoke_gateway"]
        >,
        assert_execution_state() {},
        consume_authorization() {
          journal.consume_authorization();
        },
        on_call_terminal(call) {
          journal.append_call(call);
        },
        on_block_evaluation(block) {
          journal.append_block(block);
        },
      },
    );
  const cleanBundle = journal.finalize(persistedResult);
  assert.equal(journal.authorization_consumed, true);
  assert.equal(existsSync(path.join(artifactRepository, journal.consumption_marker_path)), true);
  assert.equal(persistedResult.calls.length, 16);
  assert.equal(persistedResult.blocks.length, 4);
  assert.equal(persistedResult.report.complete_blocks, 4);
  assert.equal(persistedResult.report.all_six_pair_records, 24);
  assert.equal(persistedResult.report.real_provider_calls, 0);
  assert.equal(cleanBundle.completion_status, "complete");
  assert.equal(cleanBundle.authorization_consumed, true);
  assert.doesNotThrow(() =>
    validateOperationalReentryV04StaleResetIsolationArtifactsV01({
      repository_root: artifactRepository,
      run_root: journal.run_root,
    }),
  );
  const tamperFailureCount = verifyPersistedBundleTamperMatrixV01({
    clean_repository: artifactRepository,
    relative_run_root: journal.relative_run_root,
    consumption_marker_path: journal.consumption_marker_path,
  });
  assert.equal(tamperFailureCount, 23);
  assert.throws(
    () => journal.consume_authorization(),
    /operational_reentry_v04_stale_reset_authorization_already_consumed/,
  );
  assert.throws(
    () =>
      assertOperationalReentryV04StaleResetIsolationAuthorizationUnusedV01({
        repository_root: artifactRepository,
        authorization_fingerprint: authorization.integrity.fingerprint,
      }),
    /operational_reentry_v04_stale_reset_authorization_already_consumed/,
  );
  assert.throws(
    () =>
      assertOperationalReentryV04StaleResetIsolationIdentityAvailableV01({
        repository_root: artifactRepository,
        cohort_id: prepared.manifest.cohort_id,
        future_live_issue_number: 238,
      }),
    /operational_reentry_v04_stale_reset_artifact_collision/,
  );

  const partialFingerprint = "sha256:" + "b".repeat(64);
  const partialMarker = path.join(
    artifactRepository,
    ...OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_ARTIFACT_NAMESPACE_V01.split(
      "/",
    ),
    "authorization-consumptions",
    `${partialFingerprint.replace("sha256:", "sha256_")}.json`,
  );
  mkdirSync(path.dirname(partialMarker), { recursive: true });
  writeFileSync(partialMarker, "{partial", { flag: "wx" });
  assert.throws(
    () =>
      assertOperationalReentryV04StaleResetIsolationAuthorizationUnusedV01({
        repository_root: artifactRepository,
        authorization_fingerprint: partialFingerprint,
      }),
    /operational_reentry_v04_stale_reset_authorization_already_consumed/,
  );

  assert.throws(
    () =>
      assertOperationalReentryV04StaleResetIsolationIdentityAvailableV01({
        repository_root: artifactRepository,
        cohort_id: "operational-reentry-matched-cohorts",
        future_live_issue_number: 239,
      }),
    /operational_reentry_v04_stale_reset_historical_namespace_refused/,
  );
  const tamperedBeginRepository = path.join(
    temporaryRoot,
    "tampered-begin-repository",
  );
  mkdirSync(tamperedBeginRepository, { recursive: true });
  writeFileSync(
    path.join(tamperedBeginRepository, ".gitignore"),
    ".augnes-lab/\n",
  );
  const tamperedManifest = {
    ...prepared.manifest,
    plan_fingerprint: "sha256:" + "c".repeat(64),
  };
  assert.throws(
    () =>
      beginOperationalReentryV04StaleResetIsolationAttemptV01({
        repository_root: tamperedBeginRepository,
        authorization,
        manifest: tamperedManifest,
        plan: prepared.plan,
        pricing: prepared.pricing,
      }),
    /operational_reentry_v04_stale_reset_artifact_cross_link_invalid/,
  );

  for (const forbidden of [
    { api_key: "sk-forbidden-material-123456789" },
    { Authorization: "Bearer forbidden-token" },
    { raw_request_body: { model: "forbidden" } },
    { raw_provider_response: "forbidden raw output" },
    { hidden_reasoning: "forbidden" },
    { private_absolute_path: "/Users/private/repository" },
    { product_row: { id: 1 } },
    { core_record: { id: 1 } },
    { task_context_packet: { id: 1 } },
    { proposal: { id: 1 } },
    { review_decision: { id: 1 } },
    { transition: { id: 1 } },
    { policy: { id: 1 } },
    { scalar_fitness: 1 },
    { rank: 1 },
    { winner: "A" },
  ]) {
    assert.throws(
      () =>
        assertOperationalReentryV04StaleResetIsolationPublicSafeArtifactV01(
          forbidden,
        ),
      /operational_reentry_v04_stale_reset_forbidden_artifact_material/,
    );
  }
  assert.doesNotThrow(() =>
    assertOperationalReentryV04StaleResetIsolationPublicSafeArtifactV01({
      raw_prompt_persisted: false,
      raw_request_body_persisted: false,
      policy_authorized: false,
      request_fingerprint: "sha256:" + "e".repeat(64),
    }),
  );

  const artifactContract =
    buildOperationalReentryV04StaleResetIsolationArtifactFamilyContractV01();
  assert.equal(
    artifactContract.first_provider_egress_consumes_globally_before_transport,
    true,
  );
  assert.equal(artifactContract.partial_consumption_remains_consumed, true);
  assert.equal(artifactContract.retries, 0);
  assert.equal(artifactContract.replacements, 0);

  return {
    authorization_contract_schema_identity:
      authorizationContract.authorization_version,
    authorization_contract_fingerprint:
      authorizationContract.integrity.fingerprint,
    artifact_family_contract_fingerprint:
      artifactContract.integrity.fingerprint,
    manifest_family_fingerprint: prepared.manifest.integrity.fingerprint,
    pricing_reference_fingerprint: pricing.integrity.fingerprint,
    in_memory_fake_authorization_fingerprint: authorization.integrity.fingerprint,
    clean_full_persisted_bundle_validation: "passed" as const,
    clean_full_persisted_bundle_artifact_index_fingerprint:
      cleanBundle.artifact_index_fingerprint,
    tamper_fail_closed_cases: tamperFailureCount + 2,
    live_candidates_created: 0,
    live_authorizations_consumed: 0,
    real_run_roots_created: 0,
  };
}

function verifyPersistedBundleTamperMatrixV01(input: {
  clean_repository: string;
  relative_run_root: string;
  consumption_marker_path: string;
}): number {
  let failures = 0;
  const expectFailure = (
    id: string,
    mutate: (context: {
      repository: string;
      runRoot: string;
      globalMarker: string;
    }) => void,
  ): void => {
    const repository = path.join(temporaryRoot, `tamper-${id}`);
    cpSync(input.clean_repository, repository, { recursive: true });
    const runRoot = path.join(repository, input.relative_run_root);
    const globalMarker = path.join(repository, input.consumption_marker_path);
    mutate({ repository, runRoot, globalMarker });
    assert.throws(() =>
      validateOperationalReentryV04StaleResetIsolationArtifactsV01({
        repository_root: repository,
        run_root: runRoot,
      }),
    );
    failures += 1;
  };

  expectFailure("01-call-bytes", ({ runRoot }) => {
    const target = path.join(runRoot, "calls/00.json");
    writeFileSync(target, `${readFileSync(target, "utf8").trimEnd()} \n`);
  });
  expectFailure("02-call-payload-stale-integrity", ({ runRoot }) => {
    const target = path.join(runRoot, "calls/00.json");
    const value = readJsonV01(target);
    value.call_slot_id = "e2r2p6h-call-tampered-stale-integrity";
    writeCanonicalJsonV01(target, value);
  });
  expectFailure("03-call-resealed-index-stale", ({ runRoot }) => {
    const target = path.join(runRoot, "calls/00.json");
    const value = readJsonV01(target);
    value.call_slot_id = "e2r2p6h-call-tampered-resealed";
    writeCanonicalJsonV01(target, resealRecordV01(value));
  });
  expectFailure("04-report-payload", ({ runRoot }) => {
    const target = path.join(runRoot, "report.json");
    const value = readJsonV01(target);
    value.attempted_provider_calls = 1;
    writeCanonicalJsonV01(target, value);
  });
  expectFailure("05-report-resealed-index-stale", ({ runRoot }) => {
    const target = path.join(runRoot, "report.json");
    const value = readJsonV01(target);
    value.attempted_provider_calls = 1;
    writeCanonicalJsonV01(target, resealRecordV01(value));
  });
  expectFailure("06-report-resealed-index-updated", ({ runRoot }) => {
    const target = path.join(runRoot, "report.json");
    const value = readJsonV01(target);
    value.attempted_provider_calls = 1;
    const resealed = resealRecordV01(value);
    writeCanonicalJsonV01(target, resealed);
    updateIndexMemberV01(runRoot, "report.json", {
      report_fingerprint: resealed.integrity.fingerprint,
    });
  });
  expectFailure("07-manifest-source-resealed", ({ runRoot }) => {
    const target = path.join(runRoot, "manifest.json");
    const value = readJsonV01(target);
    value.source_repository_head_sha = "b".repeat(40);
    writeCanonicalJsonV01(target, resealRecordV01(value));
    updateIndexMemberV01(runRoot, "manifest.json", {
      source_repository_head_sha: "b".repeat(40),
    });
  });
  expectFailure("08-authorization-resealed", ({ runRoot }) => {
    const target = path.join(runRoot, "authorization.json");
    const value = readJsonV01(target);
    value.future_live_issue_number = 239;
    value.exact_merged_source_head = "b".repeat(40);
    value.sealed_plan_fingerprint = "sha256:" + "9".repeat(64);
    const resealed = resealRecordV01(value);
    writeCanonicalJsonV01(target, resealed);
    updateIndexMemberV01(runRoot, "authorization.json", {
      authorization_fingerprint: resealed.integrity.fingerprint,
      source_repository_head_sha: "b".repeat(40),
    });
  });
  expectFailure("09-plan-order-resealed", ({ runRoot }) => {
    const target = path.join(runRoot, "plan.json");
    const value = readJsonV01(target);
    [value.entries[0], value.entries[1]] = [value.entries[1], value.entries[0]];
    writeCanonicalJsonV01(target, resealRecordV01(value));
    updateIndexMemberV01(runRoot, "plan.json");
  });
  expectFailure("10-pricing-identity-resealed", ({ runRoot }) => {
    const target = path.join(runRoot, "pricing.json");
    const value = readJsonV01(target);
    value.pricing_authority_fingerprint = "sha256:" + "8".repeat(64);
    value.gateway_cost_budget.authority.pricing_fingerprint =
      value.pricing_authority_fingerprint;
    writeCanonicalJsonV01(target, resealRecordV01(value));
    updateIndexMemberV01(runRoot, "pricing.json");
  });
  expectFailure("11-call-deleted", ({ runRoot }) => {
    rmSync(path.join(runRoot, "calls/15.json"));
  });
  expectFailure("12-call-duplicated", ({ runRoot }) => {
    cpSync(
      path.join(runRoot, "calls/00.json"),
      path.join(runRoot, "calls/01.json"),
      { force: true },
    );
    updateIndexMemberV01(runRoot, "calls/01.json");
  });
  expectFailure("13-block-deleted", ({ runRoot }) => {
    rmSync(path.join(runRoot, "checkpoints/block-3.json"));
  });
  expectFailure("14-block-pair-resealed", ({ runRoot }) => {
    const target = path.join(runRoot, "checkpoints/block-0.json");
    const value = readJsonV01(target);
    value.all_six_pairs_evaluated_directly = false;
    writeCanonicalJsonV01(target, resealRecordV01(value));
    updateIndexMemberV01(runRoot, "checkpoints/block-0.json");
  });
  expectFailure("15-global-marker-removed", ({ globalMarker }) => {
    rmSync(globalMarker);
  });
  expectFailure("16-global-marker-mutated", ({ globalMarker }) => {
    const value = readJsonV01(globalMarker);
    value.retries_authorized = true;
    writeCanonicalJsonV01(globalMarker, value);
  });
  expectFailure("17-local-marker-disagrees", ({ runRoot }) => {
    const target = path.join(runRoot, "authorization-consumed.json");
    const value = readJsonV01(target);
    value.replacements_authorized = true;
    writeCanonicalJsonV01(target, value);
    updateIndexMemberV01(runRoot, "authorization-consumed.json");
  });
  expectFailure("18-consumed-false-marker-present", ({ runRoot }) => {
    for (const relative of ["report.json", "terminal.json"]) {
      const target = path.join(runRoot, relative);
      const value = readJsonV01(target);
      value.authorization_consumed = false;
      const resealed = resealRecordV01(value);
      writeCanonicalJsonV01(target, resealed);
      updateIndexMemberV01(
        runRoot,
        relative,
        relative === "report.json"
          ? { report_fingerprint: resealed.integrity.fingerprint }
          : {},
      );
    }
    const indexPath = path.join(runRoot, "artifact-index.json");
    const index = readJsonV01(indexPath);
    index.authorization_consumed = false;
    writeCanonicalJsonV01(indexPath, resealRecordV01(index));
  });
  expectFailure("19-index-noncanonical", ({ runRoot }) => {
    const target = path.join(runRoot, "artifact-index.json");
    writeFileSync(target, `${JSON.stringify(readJsonV01(target), null, 2)}\n`);
  });
  expectFailure("20-index-extra-key", ({ runRoot }) => {
    const target = path.join(runRoot, "artifact-index.json");
    const value = readJsonV01(target);
    value.unexpected = false;
    writeCanonicalJsonV01(target, resealRecordV01(value));
  });
  expectFailure("21-index-missing-key", ({ runRoot }) => {
    const target = path.join(runRoot, "artifact-index.json");
    const value = readJsonV01(target);
    delete value.report_fingerprint;
    writeCanonicalJsonV01(target, resealRecordV01(value));
  });
  expectFailure("22-index-version", ({ runRoot }) => {
    const target = path.join(runRoot, "artifact-index.json");
    const value = readJsonV01(target);
    value.index_version =
      "operational_reentry_v04_stale_reset_isolation_artifact_index.v9.9";
    writeCanonicalJsonV01(target, resealRecordV01(value));
  });
  expectFailure("23-coherent-index-semantic-drift", ({ runRoot }) => {
    const target = path.join(runRoot, "calls/00.json");
    const value = readJsonV01(target);
    value.request_family_trace_id = "acgc_trace_" + "f".repeat(40);
    writeCanonicalJsonV01(target, resealRecordV01(value));
    updateIndexMemberV01(runRoot, "calls/00.json");
  });
  return failures;
}

function readJsonV01(target: string): Record<string, any> {
  return JSON.parse(readFileSync(target, "utf8")) as Record<string, any>;
}

function writeCanonicalJsonV01(target: string, value: unknown): void {
  writeFileSync(target, `${canonicalizeProtocolValueV01(value)}\n`);
}

function resealRecordV01(value: Record<string, any>): Record<string, any> {
  const { integrity, ...payload } = value;
  assert.equal(typeof integrity?.fingerprint_scope, "string");
  return {
    ...payload,
    integrity: {
      algorithm: "sha256",
      canonicalization: "augnes-json-c14n-v0_1",
      fingerprint_scope: integrity.fingerprint_scope,
      fingerprint: fingerprintV01(payload),
    },
  };
}

function updateIndexMemberV01(
  runRoot: string,
  relativePath: string,
  replacements: Record<string, unknown> = {},
): void {
  const indexPath = path.join(runRoot, "artifact-index.json");
  const index = readJsonV01(indexPath);
  const member = index.artifacts.find(
    (entry: { path: string }) => entry.path === relativePath,
  );
  assert.ok(member);
  member.fingerprint = createProtocolSha256V01(
    readFileSync(path.join(runRoot, relativePath), "utf8").trimEnd(),
  );
  Object.assign(index, replacements);
  writeCanonicalJsonV01(indexPath, resealRecordV01(index));
}

function stripAuthorizationIntegrityV01(
  authorization: OperationalReentryV04StaleResetIsolationAuthorizationV01,
): Omit<
  OperationalReentryV04StaleResetIsolationAuthorizationV01,
  | "authorization_version"
  | "authorization_kind"
  | "request_family_kind"
  | "request_family"
  | "integrity"
> {
  const {
    authorization_version: _authorizationVersion,
    authorization_kind: _authorizationKind,
    request_family_kind: _requestFamilyKind,
    request_family: _requestFamily,
    integrity: _integrity,
    ...input
  } = authorization;
  return input;
}

function verifyFutureRunnerPreflightV01(): void {
  const repositoryInput = path.join(temporaryRoot, "preflight-repository");
  const actualRemote = path.join(temporaryRoot, "preflight-actual-remote.git");
  mkdirSync(repositoryInput, { recursive: true });
  const repository = realpathSync(repositoryInput);
  const git = (args: string[]) =>
    execFileSync("git", ["-C", repository, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  git(["init", "--initial-branch=main"]);
  git(["config", "user.name", "P6H Static Test"]);
  git(["config", "user.email", "p6h-test@example.invalid"]);
  git(["config", "commit.gpgsign", "false"]);
  execFileSync("git", ["init", "--bare", actualRemote], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  git([
    "remote",
    "add",
    "origin",
    "https://github.com/hynk-studio/augnes.git",
  ]);
  writeFileSync(path.join(repository, "baseline.txt"), "future merged source\n");
  git(["add", "baseline.txt"]);
  git(["commit", "-m", "future merged source"]);
  const oldHead = git(["rev-parse", "HEAD"]);
  git(["push", actualRemote, "HEAD:refs/heads/main"]);
  git(["update-ref", "refs/remotes/origin/main", oldHead]);
  const oldIdentity = {
    exact_merged_source_head: oldHead,
    repository_slug: "hynk-studio/augnes",
    authorized_origin:
      "https://github.com/hynk-studio/augnes.git",
  };
  let localRefreshes = 0;
  const localRefresh = {
    fetch_origin_main(root: string) {
      localRefreshes += 1;
      execFileSync(
        "git",
        [
          "-C", root, "fetch", "--no-tags", "--no-recurse-submodules",
          "--no-write-fetch-head", actualRemote,
          "+refs/heads/main:refs/remotes/origin/main",
        ],
        { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
      );
    },
  };
  assert.equal(
    refreshOperationalReentryV04StaleResetIsolationRemoteMainV01(
      repository,
      localRefresh,
    ),
    oldHead,
  );
  assert.doesNotThrow(() =>
    preflightOperationalReentryV04StaleResetIsolationRepositoryV01(
      repository,
      oldIdentity,
    ),
  );

  const remoteWork = path.join(temporaryRoot, "preflight-remote-work");
  execFileSync("git", ["clone", repository, remoteWork], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  const remoteGit = (args: string[]) =>
    execFileSync("git", ["-C", remoteWork, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  remoteGit(["config", "user.name", "P6H Static Test"]);
  remoteGit(["config", "user.email", "p6h-test@example.invalid"]);
  remoteGit(["config", "commit.gpgsign", "false"]);
  writeFileSync(path.join(remoteWork, "remote-new.txt"), "new actual main\n");
  remoteGit(["add", "remote-new.txt"]);
  remoteGit(["commit", "-m", "advance actual remote main"]);
  const newHead = remoteGit(["rev-parse", "HEAD"]);
  remoteGit(["push", actualRemote, "HEAD:refs/heads/main"]);
  assert.equal(git(["rev-parse", "refs/remotes/origin/main"]), oldHead);
  assert.equal(git(["rev-parse", "HEAD"]), oldHead);
  assert.equal(
    refreshOperationalReentryV04StaleResetIsolationRemoteMainV01(
      repository,
      localRefresh,
    ),
    newHead,
  );
  assert.throws(
    () =>
      preflightOperationalReentryV04StaleResetIsolationRepositoryV01(
        repository,
        oldIdentity,
      ),
    /operational_reentry_v04_stale_reset_head_not_exact_origin_main/,
  );

  const realArtifactRoot = path.join(
    repository,
    ...OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_ARTIFACT_NAMESPACE_V01.split(
      "/",
    ),
  );
  assert.equal(existsSync(realArtifactRoot), false);
  assert.throws(
    () =>
      refreshOperationalReentryV04StaleResetIsolationRemoteMainV01(
        repository,
        {
          fetch_origin_main() {
            throw new Error("deterministic local refresh failure");
          },
        },
      ),
    /operational_reentry_v04_stale_reset_origin_main_refresh_failed/,
  );
  assert.equal(existsSync(realArtifactRoot), false);

  git(["update-ref", "refs/remotes/origin/main", oldHead]);
  writeFileSync(path.join(repository, "dirty.txt"), "dirty\n");
  assert.throws(
    () =>
      preflightOperationalReentryV04StaleResetIsolationRepositoryV01(
        repository,
        oldIdentity,
      ),
    /operational_reentry_v04_stale_reset_worktree_not_clean/,
  );
  rmSync(path.join(repository, "dirty.txt"));
  git(["update-ref", "refs/remotes/origin/main", newHead]);
  git(["switch", "-c", "future-feature"]);
  writeFileSync(path.join(repository, "feature.txt"), "feature\n");
  git(["add", "feature.txt"]);
  git(["commit", "-m", "future feature"]);
  const featureHead = git(["rev-parse", "HEAD"]);
  assert.throws(
    () =>
      preflightOperationalReentryV04StaleResetIsolationRepositoryV01(
        repository,
        { ...oldIdentity, exact_merged_source_head: featureHead },
      ),
    /operational_reentry_v04_stale_reset_head_not_exact_origin_main/,
  );
  assert.equal(
    refreshOperationalReentryV04StaleResetIsolationRemoteMainV01(
      repository,
      localRefresh,
    ),
    newHead,
  );
  assert.throws(
    () =>
      preflightOperationalReentryV04StaleResetIsolationRepositoryV01(
        repository,
        { ...oldIdentity, exact_merged_source_head: featureHead },
      ),
    /operational_reentry_v04_stale_reset_head_not_exact_origin_main/,
  );

  git(["switch", "main"]);
  git(["merge", "--ff-only", newHead]);
  const freshIdentity = { ...oldIdentity, exact_merged_source_head: newHead };
  assert.equal(
    refreshOperationalReentryV04StaleResetIsolationRemoteMainV01(
      repository,
      localRefresh,
    ),
    newHead,
  );
  assert.doesNotThrow(() =>
    preflightOperationalReentryV04StaleResetIsolationRepositoryV01(
      repository,
      freshIdentity,
    ),
  );
  assert.equal(localRefreshes, 4);
}

function verifyHistoricalAndAuthorityBoundariesV01(): void {
  const historicalDesign = readFileSync(
    path.join(
      repositoryRoot,
      "docs/vnext/research/ACGC_E2R2P6_STALE_RESET_ISOLATION_DESIGN_V0_1.md",
    ),
  );
  assert.equal(
    createHash("sha256").update(historicalDesign).digest("hex"),
    "cddc7f5009dcef95ef2047257985a76e61b66af2b4f609796c12b93dfdac4f0a",
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
  const core = readFileSync(
    path.join(
      repositoryRoot,
      "lib/vnext/operational-reentry-v0-4-stale-reset-isolation-cohort.ts",
    ),
    "utf8",
  );
  const store = readFileSync(
    path.join(
      repositoryRoot,
      "lib/vnext/operational-reentry-v0-4-stale-reset-isolation-artifact-store.ts",
    ),
    "utf8",
  );
  const runner = readFileSync(
    path.join(
      repositoryRoot,
      "scripts/operational-reentry-v0-4-stale-reset-isolation-cohort.ts",
    ),
    "utf8",
  );
  assert.equal(core.includes("fetch("), false);
  assert.equal(core.includes("process.env"), false);
  assert.equal(store.includes("rmSync("), false);
  assert.equal(store.includes("unlinkSync("), false);
  assert.equal(runner.includes("buildOperationalReentryV04StaleResetIsolationAuthorizationV01"), false);
  assert.ok(
    runner.includes(
      "--confirm-operational-reentry-v04-stale-reset-isolation-cohort",
    ),
  );
  assert.ok(runner.includes("--authorization-file"));
  assert.ok(runner.includes("refs/remotes/origin/main^{commit}"));
  assert.ok(
    runner.includes(
      "+refs/heads/main:refs/remotes/origin/main",
    ),
  );
  assert.ok(runner.includes("--no-write-fetch-head"));
  assert.ok(
    runner.indexOf(
      "refreshOperationalReentryV04StaleResetIsolationRemoteMainV01(",
    ) <
      runner.indexOf(
        "beginOperationalReentryV04StaleResetIsolationAttemptV01({",
      ),
  );
  for (const forbiddenOwner of [
    "TaskContextPacket",
    "ReviewDecision",
    "Transition",
    "scalar_fitness",
    "rank_or_winner_created: true",
  ]) {
    assert.equal(core.includes(forbiddenOwner), false);
  }
  assert.ok(core.includes("product_database_writes: 0 as const"));
  assert.ok(core.includes("core_writes: 0 as const"));
  assert.equal(
    createOperationalReentryMatchedCohortProviderMaterialFingerprintV04(
      buildOperationalReentryMatchedCohortInvocationV04({
        arm: "B",
        cohort_ref: "p6h-historical-fingerprint",
        call_slot_id: "e2r2p6h-call-historical-fingerprint",
        block: 0,
      }).provider_material,
    ).startsWith("sha256:"),
    true,
  );
  assert.notEqual(
    createOperationalReentryMatchedCohortLocalInvocationIdentityFingerprintV04(
      buildOperationalReentryMatchedCohortInvocationV04({
        arm: "B",
        cohort_ref: "p6h-local-one",
        call_slot_id: "e2r2p6h-call-local-one",
        block: 0,
      }),
    ),
    createOperationalReentryMatchedCohortLocalInvocationIdentityFingerprintV04(
      buildOperationalReentryMatchedCohortInvocationV04({
        arm: "B",
        cohort_ref: "p6h-local-two",
        call_slot_id: "e2r2p6h-call-local-two",
        block: 0,
      }),
    ),
  );
}

function fingerprintV01(value: unknown): string {
  return createProtocolSha256V01(canonicalizeProtocolValueV01(value));
}
