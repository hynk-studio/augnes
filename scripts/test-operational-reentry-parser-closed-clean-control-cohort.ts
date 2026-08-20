import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import {
  assertOperationalReentryParserClosedCleanControlCohortArtifactPayloadSafeV01,
  beginOperationalReentryParserClosedCleanControlCohortAttemptV01,
  validateOperationalReentryParserClosedCleanControlCohortArtifactsV01,
} from "@/lib/vnext/operational-reentry-parser-closed-clean-control-cohort-artifact-store";
import { validateOperationalReentryParserClosedProviderCompatibilityProbeArtifactsV01 } from "@/lib/vnext/operational-reentry-parser-closed-provider-compatibility-probe-artifact-store";
import {
  ACGC_E2R2P5H_ADAPTER_REQUEST_ROUTE_FINGERPRINT_V01,
  ACGC_E2R2P5H_AGGREGATE_WORST_CASE_NANO_USD_V01,
  ACGC_E2R2P5H_CASE_FINGERPRINT_V01,
  ACGC_E2R2P5H_COMMON_TASK_EVIDENCE_FINGERPRINT_V01,
  ACGC_E2R2P5H_DEFAULT_AUTHORIZATION_CEILING_NANO_USD_V01,
  ACGC_E2R2P5H_PER_CALL_WORST_CASE_NANO_USD_V01,
  ACGC_E2R2P5H_PROVIDER_CONTRACT_FINGERPRINT_V01,
  ACGC_E2R2P5H_ROUTE_FINGERPRINT_V01,
  ACGC_E2R2P5H_SEALED_ORDER_V01,
  OperationalReentryParserClosedCleanControlCohortDriftErrorV01,
  buildOperationalReentryParserClosedCleanControlCohortAuthorizationCandidateV01,
  buildOperationalReentryParserClosedCleanControlCohortPlanV01,
  buildOperationalReentryParserClosedCleanControlCohortPricingV01,
  buildOperationalReentryParserClosedCleanControlCohortV01,
  buildOperationalReentryParserClosedCleanControlEvaluatorBridgeV01,
  operationalReentryParserClosedCleanControlCohortHarnessV01,
  projectOperationalReentryParserClosedCleanControlEvaluatorInputV01,
  runOperationalReentryParserClosedCleanControlCohortV01,
  type BuildOperationalReentryParserClosedCleanControlCohortInputV01,
  type RunOperationalReentryParserClosedCleanControlCohortDependenciesV01,
} from "@/lib/vnext/operational-reentry-parser-closed-clean-control-cohort";
import {
  buildModelGatewayCostAuthorityV01,
  buildModelGatewayCostBudgetV01,
} from "@/lib/vnext/model-gateway/cost-authority";
import {
  MODEL_PROVIDER_REQUEST_FAMILY_KINDS_V01,
  createDeterministicModelProviderRequestTraceV01,
} from "@/lib/vnext/model-gateway/provider-rejection-observation";
import {
  prepareOperationalReentryMatchedCohortModelGatewayRouteV03,
  projectOperationalReentryMatchedCohortProviderRequestV03,
  type ModelGatewayInteractiveAdmissionV01,
} from "@/lib/vnext/model-gateway/model-gateway";
import {
  createOpenAIResponsesAdapterV01,
  type OpenAIResponsesTransportRequestV01,
} from "@/lib/vnext/model-gateway/openai/responses-adapter";
import { OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03 } from "@/lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-v0-3-codec";
import {
  buildOperationalReentryMatchedCohortGoldenOutputV02,
  evaluateOperationalReentryMatchedCohortBlockV02,
} from "@/lib/vnext/operational-reentry-matched-cohort-v0-2";
import { buildOperationalReentryMatchedCohortGoldenWireOutputV03 } from "@/lib/vnext/operational-reentry-matched-cohort-v0-3";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  getOrCreateCanonicalProjectForLocalRootV01,
  getOrCreateDefaultWorkspaceIdentityV01,
  normalizeLocalProjectRootRefV01,
} from "@/lib/vnext/persistence/project-identity-registry";
import { selectActiveProjectV01 } from "@/lib/vnext/persistence/project-lifecycle-registry";
import type { OperationalReentryMatchedCohortRouteV03 } from "@/types/vnext/operational-reentry-matched-cohort-v0-3";

const repositoryRoot = process.cwd();
const testRoot = mkdtempSync(path.join(tmpdir(), "augnes-e2r2p5h-v03-"));
const projectRoot = path.join(testRoot, "project");
const databasePath = path.join(testRoot, "gateway.db");
const evaluatedAt = "2026-08-20T10:00:00.000Z";
const repositoryIdentity = {
  repository_slug: "hynk-studio/augnes-perspective-lab" as const,
  origin: "https://github.com/hynk-studio/augnes-perspective-lab.git" as const,
};
const originalFetch = globalThis.fetch;
let fakeTransportCalls = 0;
let authorizationSequence = 0;

void main()
  .finally(() => {
    globalThis.fetch = originalFetch;
    rmSync(testRoot, { recursive: true, force: true });
  })
  .catch((error) => {
    console.error(
      "operational_reentry_parser_closed_clean_control_cohort_test_failed",
    );
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exitCode = 1;
  });

async function main(): Promise<void> {
  globalThis.fetch = (async () => {
    throw new Error("E2R2P5H tests must never use global fetch");
  }) as typeof fetch;
  mkdirSync(projectRoot, { recursive: true });
  initializeDatabaseV01();
  const admission = registerProjectV01();

  const planIdentity = verifyPlanProviderContractAndBridgeV01();
  verifyEvaluatorBoundaryV01();
  await verifyAuthorizationContractRefusalsV01(admission);
  const golden = await verifyGoldenBehavioralRunV01(admission);
  const exactCost = await verifyExactCostAccountingV01(admission);
  const providerFailure = await verifyOrdinaryProviderFailureContinuesV01(admission);
  await verifyDriftHardStopsV01(admission);
  await verifyTerminalDriftPreventsCompleteV01(admission);
  await verifyArtifactSymlinkRefusalV01(admission);
  const artifacts = await verifySingleUseArtifactsAndTamperV01(admission);
  await verifyPartialConsumptionFailureV01(admission);
  verifyHistoricalIssue216PreservedV01();
  verifyStaticPrivacyAndAuthorityBoundaryV01();

  console.log(
    JSON.stringify({
      status:
        "operational_reentry_parser_closed_clean_control_cohort_test_passed",
      plan_fingerprint: planIdentity.plan_fingerprint,
      evaluator_bridge_fingerprint: planIdentity.evaluator_bridge_fingerprint,
      case_fingerprint: ACGC_E2R2P5H_CASE_FINGERPRINT_V01,
      common_task_evidence_fingerprint:
        ACGC_E2R2P5H_COMMON_TASK_EVIDENCE_FINGERPRINT_V01,
      route_fingerprint: ACGC_E2R2P5H_ROUTE_FINGERPRINT_V01,
      provider_contract_fingerprint:
        ACGC_E2R2P5H_PROVIDER_CONTRACT_FINGERPRINT_V01,
      adapter_request_route_fingerprint:
        ACGC_E2R2P5H_ADAPTER_REQUEST_ROUTE_FINGERPRINT_V01,
      golden_complete_blocks: golden.complete_blocks,
      cached_aware_exact_cost_cases: exactCost.checked_cases,
      ordinary_failure_terminal_calls: providerFailure.terminal_calls,
      artifact_index_fingerprint: artifacts.artifact_index_fingerprint,
      fake_transport_calls: fakeTransportCalls,
      real_provider_calls: 0,
      successor_live_authorizations_created: 0,
      successor_live_authorizations_consumed: 0,
      behavioral_cohort_result: "none",
      live_behavioral_cohort_executed: false,
      stage_7_started: false,
    }),
  );
}

function verifyPlanProviderContractAndBridgeV01(): {
  plan_fingerprint: string;
  evaluator_bridge_fingerprint: string;
} {
  const plan = buildOperationalReentryParserClosedCleanControlCohortPlanV01();
  const bridge = buildOperationalReentryParserClosedCleanControlEvaluatorBridgeV01();
  assert.deepEqual(plan.sealed_order, [
    ["A", "B", "D", "C"],
    ["B", "C", "A", "D"],
    ["C", "D", "B", "A"],
    ["D", "A", "C", "B"],
  ]);
  assert.deepEqual(plan.sealed_order, ACGC_E2R2P5H_SEALED_ORDER_V01);
  assert.equal(plan.entries.length, 16);
  assert.equal(new Set(plan.entries.map((entry) => entry.call_slot_id)).size, 16);
  assert.equal(
    new Set(plan.entries.map((entry) => entry.request_family_trace_id)).size,
    16,
  );
  assert.equal(new Set(plan.entries.map((entry) => entry.client_request_id)).size, 16);
  assert.equal(
    new Set(plan.entries.map((entry) => entry.common_task_evidence_fingerprint)).size,
    1,
  );
  assert.equal(
    plan.entries.every((entry) => entry.call_slot_id.startsWith("e2r2p5h-call-")),
    true,
  );
  for (const block of [0, 1, 2, 3] as const) {
    const entries = plan.entries.filter((entry) => entry.repeat_block === block);
    const byArm = new Map(entries.map((entry) => [entry.arm, entry] as const));
    assert.equal(
      byArm.get("A")!.non_target_continuation_fingerprint,
      byArm.get("B")!.non_target_continuation_fingerprint,
    );
    assert.equal(
      byArm.get("B")!.non_target_continuation_fingerprint,
      byArm.get("C")!.non_target_continuation_fingerprint,
    );
    assert.equal(byArm.get("D")!.model_input.continuation_context.length, 0);
    assert.deepEqual(
      byArm.get("D")!.model_input.common_task_evidence,
      byArm.get("A")!.model_input.common_task_evidence,
    );
  }
  for (const entry of plan.entries) {
    const request =
      projectOperationalReentryMatchedCohortProviderRequestV03(
        entry.model_input,
      );
    assert.equal(
      request.request_fingerprint,
      entry.provider_visible_request_fingerprint,
    );
    assert.equal(request.request_body.includes(entry.request_family_trace_id), false);
    assert.equal(request.request_body.includes(entry.client_request_id), false);
  }
  assert.deepEqual(MODEL_PROVIDER_REQUEST_FAMILY_KINDS_V01, [
    "cohort_attempt",
    "compatibility_probe",
    "replacement_cohort",
    "clean_control_compatibility_probe",
    "parser_closed_compatibility_probe",
    "parser_closed_clean_control_cohort",
  ]);
  const traceBasis = fingerprintV01("same-request-family-basis");
  assert.equal(
    new Set(
      MODEL_PROVIDER_REQUEST_FAMILY_KINDS_V01.map((request_family_kind) =>
        createDeterministicModelProviderRequestTraceV01({
          request_family_kind,
          request_family_fingerprint: traceBasis,
        }),
      ),
    ).size,
    6,
  );
  assert.equal(bridge.parser_closed_wire_representation_is_evaluator_dimension, false);
  assert.equal(bridge.historical_evaluator_version, "operational_reentry_matched_cohort_evaluator.v0.2");

  const base = plan.entries[3]!;
  const output = buildOperationalReentryMatchedCohortGoldenOutputV02(base.arm);
  for (const [label, mutate] of [
    ["common_evidence", (entry: typeof base) => {
      entry.model_input.common_task_evidence.observed_result_status = "review_blocked" as never;
    }],
    ["continuation", (entry: typeof base) => {
      entry.model_input.continuation_context = [];
    }],
    ["stale_relation", (entry: typeof base) => {
      entry.model_input.stale_relation = null;
    }],
    ["operation_action", (entry: typeof base) => {
      entry.model_input.allowed_output.operation_action_class_tokens = ["bounded_result_review"] as never;
    }],
  ] as const) {
    const changed = structuredClone(base);
    mutate(changed);
    assert.throws(
      () =>
        projectOperationalReentryParserClosedCleanControlEvaluatorInputV01(
          changed,
          output,
        ),
      new RegExp(`evaluator_bridge_${label}_mismatch`, "u"),
    );
  }
  return {
    plan_fingerprint: plan.integrity.fingerprint,
    evaluator_bridge_fingerprint: bridge.integrity.fingerprint,
  };
}

function verifyEvaluatorBoundaryV01(): void {
  const plan = buildOperationalReentryParserClosedCleanControlCohortPlanV01();
  const observed = plan.entries.slice(0, 4).map((entry) =>
    projectOperationalReentryParserClosedCleanControlEvaluatorInputV01(
      entry,
      buildOperationalReentryMatchedCohortGoldenOutputV02(entry.arm),
    ).observed_arm,
  );
  const clean = evaluateOperationalReentryMatchedCohortBlockV02(0, observed);
  assert.equal(clean.status, "complete");
  assert.equal(
    clean.arm_evaluations.every((evaluation) => evaluation.common_compliance === "valid"),
    true,
  );
  assert.notEqual(clean.conditioning_relation, "unknown");
  assert.notEqual(clean.reset_relation, "unknown");

  observed[0]!.normalized_output = buildOperationalReentryMatchedCohortGoldenOutputV02(
    observed[0]!.arm,
    { result_status: "review_blocked", abstention: false },
  );
  observed[1]!.normalized_output = buildOperationalReentryMatchedCohortGoldenOutputV02(
    observed[1]!.arm,
    { required_check: { disposition: "failed" } },
  );
  const invalid = evaluateOperationalReentryMatchedCohortBlockV02(0, observed);
  assert.equal(
    invalid.pairwise_comparisons.some(
      (comparison) => comparison.comparison_status === "protocol_invalid_not_comparable",
    ),
    true,
  );
  assert.equal(
    invalid.pairwise_comparisons.some(
      (comparison) => comparison.comparison_status === "compliance_asymmetry",
    ),
    true,
  );
  assert.equal(
    invalid.pairwise_comparisons.every(
      (comparison) => comparison.rank_or_winner_created === false,
    ),
    true,
  );
}

async function verifyGoldenBehavioralRunV01(
  admission: ModelGatewayInteractiveAdmissionV01,
): Promise<{ complete_blocks: number }> {
  const plan = buildOperationalReentryParserClosedCleanControlCohortPlanV01();
  let call = 0;
  const adapter = adapterV01(async () => {
    const entry = plan.entries[call++]!;
    return acceptedResponseV01(
      buildOperationalReentryMatchedCohortGoldenWireOutputV03(entry.arm),
    );
  });
  const route = await routeV01(adapter);
  const input = buildInputV01(admission, route, "golden");
  let consumptionCount = 0;
  const result = await runOperationalReentryParserClosedCleanControlCohortV01(
    input,
    dependenciesV01(adapter, route, {
      consume_authorization() {
        consumptionCount += 1;
      },
    }),
  );
  assert.equal(call, 16);
  assert.equal(consumptionCount, 1);
  assert.equal(result.report.completion_status, "complete");
  assert.equal(result.report.complete_blocks.length, 4);
  assert.equal(result.report.terminal_execution_state_valid, true);
  assert.equal(result.report.common_compliance_valid_blocks, 4);
  assert.equal(result.report.scalar_score_created, false);
  assert.equal(result.report.rank_created, false);
  assert.equal(result.report.winner_created, false);
  assert.equal(result.report.product_database_writes, 0);
  assert.equal(result.report.core_writes, 0);
  assert.equal(result.calls[0]!.exact_cost_nano_usd, 112_000);
  assert.equal(result.report.exact_cost_nano_usd, 1_792_000);
  assert.equal(result.report.usage.total_cached_input_tokens, 0);
  assert.equal(result.report.usage.total_uncached_input_tokens, 1_920);
  assert.deepEqual(result.report.conservative_cost, {
    per_call_worst_case_nano_usd: 11_699_200,
    planned_aggregate_worst_case_nano_usd: 187_187_200,
    authorization_ceiling_nano_usd: 1_000_000_000,
  });
  return { complete_blocks: result.report.complete_blocks.length };
}

async function verifyExactCostAccountingV01(
  admission: ModelGatewayInteractiveAdmissionV01,
): Promise<{ checked_cases: 3 }> {
  const plan = buildOperationalReentryParserClosedCleanControlCohortPlanV01();
  let call = 0;
  const adapter = adapterV01(async () => {
    const entry = plan.entries[call]!;
    const cachedInputTokens = call === 1 ? 20 : call === 2 ? "unavailable" : 0;
    call += 1;
    return acceptedResponseV01(
      buildOperationalReentryMatchedCohortGoldenWireOutputV03(entry.arm),
      cachedInputTokens,
    );
  });
  const route = await routeV01(adapter);
  const result = await runOperationalReentryParserClosedCleanControlCohortV01(
    buildInputV01(admission, route, "exact-cost"),
    dependenciesV01(adapter, route),
  );
  assert.equal(call, 16);
  assert.equal(result.calls[0]!.exact_cost_nano_usd, 112_000);
  assert.equal(result.calls[1]!.exact_cost_nano_usd, 106_000);
  assert.equal(result.calls[2]!.exact_cost_nano_usd, "unknown");
  assert.equal(result.report.exact_cost_nano_usd, "unknown");
  assert.equal(result.report.usage.known_call_count, 16);
  assert.equal(result.report.usage.cached_input_known_call_count, 15);
  assert.equal(result.report.usage.total_input_tokens, 1_920);
  assert.equal(result.report.usage.total_cached_input_tokens, "unknown");
  assert.equal(result.report.usage.total_uncached_input_tokens, "unknown");
  assert.equal(result.report.usage.total_output_tokens, 640);
  assert.deepEqual(result.report.conservative_cost, {
    per_call_worst_case_nano_usd: 11_699_200,
    planned_aggregate_worst_case_nano_usd: 187_187_200,
    authorization_ceiling_nano_usd: 1_000_000_000,
  });
  return { checked_cases: 3 };
}

async function verifyAuthorizationContractRefusalsV01(
  admission: ModelGatewayInteractiveAdmissionV01,
): Promise<void> {
  const adapter = adapterV01(async () => {
    throw new Error("authorization validation must remain before transport");
  });
  const route = await routeV01(adapter);
  const input = buildInputV01(admission, route, "authorization-refusals");
  assert.doesNotThrow(() =>
    buildOperationalReentryParserClosedCleanControlCohortV01(input),
  );
  assert.equal(
    (
      input.authorization as {
        behavioral_cohort_authorized?: unknown;
      }
    ).behavioral_cohort_authorized,
    true,
  );
  for (const override of [
    { case_fingerprint: `sha256:${"1".repeat(64)}` },
    { common_task_evidence_fingerprint: `sha256:${"2".repeat(64)}` },
    { behavioral_plan_fingerprint: `sha256:${"3".repeat(64)}` },
    { evaluator_bridge_fingerprint: `sha256:${"4".repeat(64)}` },
    { route_fingerprint: `sha256:${"5".repeat(64)}` },
    { provider_contract_fingerprint: `sha256:${"6".repeat(64)}` },
    { adapter_request_route_fingerprint: `sha256:${"7".repeat(64)}` },
    { maximum_parallel_provider_calls: 2 },
    { retries: 1 },
    { behavioral_cohort_authorized: false },
    { replication_authorized: true },
    { policy_authorized: true },
    { stage_7_authorized: true },
  ]) {
    const transportCallsBeforeRefusal = fakeTransportCalls;
    assert.throws(
      () =>
        buildOperationalReentryParserClosedCleanControlCohortV01({
          ...input,
          authorization: resealAuthorizationV01({
            ...(input.authorization as Record<string, unknown>),
            ...override,
          }),
        }),
      /authorization_(?:invalid|mismatched)/u,
    );
    assert.equal(fakeTransportCalls, transportCallsBeforeRefusal);
  }
  const missingBehavioralGrant = structuredClone(
    input.authorization,
  ) as Record<string, unknown>;
  delete missingBehavioralGrant.behavioral_cohort_authorized;
  const transportCallsBeforeMissingGrantRefusal = fakeTransportCalls;
  assert.throws(
    () =>
      buildOperationalReentryParserClosedCleanControlCohortV01({
        ...input,
        authorization: resealAuthorizationV01(missingBehavioralGrant),
      }),
    /authorization_(?:invalid|mismatched)/u,
  );
  assert.equal(fakeTransportCalls, transportCallsBeforeMissingGrantRefusal);
}

async function verifyOrdinaryProviderFailureContinuesV01(
  admission: ModelGatewayInteractiveAdmissionV01,
): Promise<{ terminal_calls: number }> {
  const plan = buildOperationalReentryParserClosedCleanControlCohortPlanV01();
  let call = 0;
  const adapter = adapterV01(async () => {
    const entry = plan.entries[call]!;
    const current = call++;
    return current === 1
      ? rejectedResponseV01(429)
      : acceptedResponseV01(
          buildOperationalReentryMatchedCohortGoldenWireOutputV03(entry.arm),
        );
  });
  const route = await routeV01(adapter);
  const result = await runOperationalReentryParserClosedCleanControlCohortV01(
    buildInputV01(admission, route, "ordinary-failure"),
    dependenciesV01(adapter, route),
  );
  assert.equal(call, 16);
  assert.equal(result.calls.length, 16);
  assert.equal(result.calls[1]!.terminal_category, "provider_rejected");
  assert.equal(result.calls[1]!.normalized_output, null);
  assert.equal(result.block_evaluations[0]!.status, "incomplete");
  assert.equal(result.block_evaluations.slice(1).every((block) => block.status === "complete"), true);
  assert.equal(result.report.completion_status, "incomplete");
  return { terminal_calls: result.calls.length };
}

async function verifyDriftHardStopsV01(
  admission: ModelGatewayInteractiveAdmissionV01,
): Promise<void> {
  for (const driftKind of ["source", "admission", "authorization", "route"] as const) {
    const plan = buildOperationalReentryParserClosedCleanControlCohortPlanV01();
    let calls = 0;
    const adapter = adapterV01(async () => {
      const entry = plan.entries[calls++]!;
      return acceptedResponseV01(
        buildOperationalReentryMatchedCohortGoldenWireOutputV03(entry.arm),
      );
    });
    const route = await routeV01(adapter);
    const result = await runOperationalReentryParserClosedCleanControlCohortV01(
      buildInputV01(admission, route, `drift-${driftKind}`),
      dependenciesV01(adapter, route, {
        assert_execution_state(entry) {
          if (entry.call_order === 2) {
            throw new OperationalReentryParserClosedCleanControlCohortDriftErrorV01(
              driftKind,
            );
          }
        },
      }),
    );
    assert.equal(calls, 2);
    assert.equal(result.calls.length, 16);
    assert.equal(result.calls[2]!.terminal_category, "authority_or_source_route_drift");
    assert.equal(
      result.calls.slice(3).every(
        (terminal) => terminal.terminal_category === "not_attempted_after_hard_stop",
      ),
      true,
    );
  }
}

async function verifySingleUseArtifactsAndTamperV01(
  admission: ModelGatewayInteractiveAdmissionV01,
): Promise<{ artifact_index_fingerprint: string }> {
  const artifactRepository = path.join(testRoot, "artifact-success");
  mkdirSync(artifactRepository, { recursive: true });
  const plan = buildOperationalReentryParserClosedCleanControlCohortPlanV01();
  let call = 0;
  const adapter = adapterV01(async () => {
    const entry = plan.entries[call++]!;
    return acceptedResponseV01(
      buildOperationalReentryMatchedCohortGoldenWireOutputV03(entry.arm),
    );
  });
  const route = await routeV01(adapter);
  const input = buildInputV01(admission, route, "artifact-success");
  const prepared = buildOperationalReentryParserClosedCleanControlCohortV01(input);
  const journal = beginOperationalReentryParserClosedCleanControlCohortAttemptV01({
    repository_root: artifactRepository,
    prepared,
  });
  const result = await runOperationalReentryParserClosedCleanControlCohortV01(
    input,
    dependenciesV01(adapter, route, {
      consume_authorization(consumption) {
        journal.consume_authorization({
          authorization_fingerprint:
            consumption.authorization.integrity.fingerprint,
          cohort_id: consumption.cohort_id,
        });
      },
      on_call_terminal(callTerminal) {
        journal.append_call(callTerminal);
      },
      on_block_evaluation(block) {
        journal.append_block(block);
      },
    }),
  );
  const summary = journal.finalize(result);
  assert.equal(summary.authorization_consumed, true);
  assert.equal(summary.completion_status, "complete");
  assert.throws(
    () =>
      beginOperationalReentryParserClosedCleanControlCohortAttemptV01({
        repository_root: artifactRepository,
        prepared,
      }),
    /authorization_global_collision_refused/u,
  );
  const indexPath = path.join(journal.run_root, "artifact-index.json");
  const originalIndex = readFileSync(indexPath, "utf8");
  writeFileSync(indexPath, "{}\n");
  assert.throws(
    () =>
      validateOperationalReentryParserClosedCleanControlCohortArtifactsV01({
        repository_root: artifactRepository,
        run_root: journal.run_root,
      }),
    /artifact_index_invalid/u,
  );
  writeFileSync(indexPath, originalIndex);
  assert.equal(
    validateOperationalReentryParserClosedCleanControlCohortArtifactsV01({
      repository_root: artifactRepository,
      run_root: journal.run_root,
    }).artifact_index_fingerprint,
    summary.artifact_index_fingerprint,
  );
  return { artifact_index_fingerprint: summary.artifact_index_fingerprint };
}

async function verifyTerminalDriftPreventsCompleteV01(
  admission: ModelGatewayInteractiveAdmissionV01,
): Promise<void> {
  const plan = buildOperationalReentryParserClosedCleanControlCohortPlanV01();
  let call = 0;
  let executionStateChecks = 0;
  const adapter = adapterV01(async () => {
    const entry = plan.entries[call++]!;
    return acceptedResponseV01(
      buildOperationalReentryMatchedCohortGoldenWireOutputV03(entry.arm),
    );
  });
  const route = await routeV01(adapter);
  const input = buildInputV01(admission, route, "terminal-drift");
  const result = await runOperationalReentryParserClosedCleanControlCohortV01(
    input,
    dependenciesV01(adapter, route, {
      assert_execution_state() {
        executionStateChecks += 1;
        if (executionStateChecks === 17) {
          throw new OperationalReentryParserClosedCleanControlCohortDriftErrorV01(
            "source",
          );
        }
      },
    }),
  );
  assert.equal(result.calls.length, 16);
  assert.equal(result.report.terminal_execution_state_valid, false);
  assert.equal(result.report.completion_status, "incomplete");
}

async function verifyArtifactSymlinkRefusalV01(
  admission: ModelGatewayInteractiveAdmissionV01,
): Promise<void> {
  const artifactRepository = path.join(testRoot, "artifact-symlink");
  const externalDirectory = path.join(testRoot, "artifact-symlink-target");
  mkdirSync(artifactRepository, { recursive: true });
  mkdirSync(externalDirectory, { recursive: true });
  symlinkSync(externalDirectory, path.join(artifactRepository, ".augnes-lab"), "dir");
  const adapter = adapterV01(async () => {
    throw new Error("symlink refusal must precede transport");
  });
  const route = await routeV01(adapter);
  const prepared = buildOperationalReentryParserClosedCleanControlCohortV01(
    buildInputV01(admission, route, "artifact-symlink"),
  );
  assert.throws(
    () =>
      beginOperationalReentryParserClosedCleanControlCohortAttemptV01({
        repository_root: artifactRepository,
        prepared,
      }),
    /artifact_symlink_refused/u,
  );
  assert.equal(existsSync(path.join(externalDirectory, "authorization-consumptions")), false);
}

async function verifyPartialConsumptionFailureV01(
  admission: ModelGatewayInteractiveAdmissionV01,
): Promise<void> {
  const artifactRepository = path.join(testRoot, "artifact-partial");
  mkdirSync(artifactRepository, { recursive: true });
  let transportCalls = 0;
  const adapter = adapterV01(async () => {
    transportCalls += 1;
    return acceptedResponseV01(
      buildOperationalReentryMatchedCohortGoldenWireOutputV03("A"),
    );
  });
  const route = await routeV01(adapter);
  const input = buildInputV01(admission, route, "artifact-partial");
  const prepared = buildOperationalReentryParserClosedCleanControlCohortV01(input);
  const journal = beginOperationalReentryParserClosedCleanControlCohortAttemptV01({
    repository_root: artifactRepository,
    prepared,
    write_run_local_consumption() {
      throw new Error("synthetic local journal failure");
    },
  });
  const result = await runOperationalReentryParserClosedCleanControlCohortV01(
    input,
    dependenciesV01(adapter, route, {
      consume_authorization(consumption) {
        journal.consume_authorization({
          authorization_fingerprint:
            consumption.authorization.integrity.fingerprint,
          cohort_id: consumption.cohort_id,
        });
      },
      on_call_terminal(call) {
        journal.append_call(call);
      },
      on_block_evaluation(block) {
        journal.append_block(block);
      },
    }),
  );
  assert.equal(transportCalls, 0);
  assert.equal(result.calls[0]!.terminal_category, "internal_failure");
  assert.equal(result.calls[0]!.egress_attempted, false);
  assert.equal(
    existsSync(path.join(journal.run_root, "authorization-consumed.json")),
    false,
  );
  assert.throws(
    () => journal.finalize(result),
    /authorization_consumption_history_incomplete/u,
  );
  assert.equal(existsSync(path.join(journal.run_root, "report.json")), false);
  assert.equal(existsSync(path.join(journal.run_root, "artifact-index.json")), false);
  assert.throws(
    () =>
      beginOperationalReentryParserClosedCleanControlCohortAttemptV01({
        repository_root: artifactRepository,
        prepared,
      }),
    /authorization_global_collision_refused/u,
  );
}

function verifyHistoricalIssue216PreservedV01(): void {
  const issue216 =
    validateOperationalReentryParserClosedProviderCompatibilityProbeArtifactsV01({
      repository_root: repositoryRoot,
      run_root: path.join(
        repositoryRoot,
        ".augnes-lab/operational-reentry-parser-closed-provider-probes/operational-reentry-parser-closed-provider-probe_154650381bef68202a998f1b6770513c/issue-216",
      ),
    });
  assert.equal(issue216.outcome, "accepted_all_shapes");
  assert.equal(issue216.authorization_consumed, true);
  const source = readFileSync(
    path.join(
      repositoryRoot,
      "lib/vnext/operational-reentry-parser-closed-clean-control-cohort.ts",
    ),
    "utf8",
  );
  assert.equal(
    source.includes(
      "operational-reentry-parser-closed-provider-compatibility-probe",
    ),
    false,
  );
  assert.equal(source.includes("issue-216"), false);
}

function verifyStaticPrivacyAndAuthorityBoundaryV01(): void {
  assert.deepEqual(operationalReentryParserClosedCleanControlCohortHarnessV01, {
    harness_version:
      "operational_reentry_parser_closed_clean_control_matched_cohort.v0.1",
    issue_number: 219,
    implementation_kind: "zero_egress_future_live_harness",
    successor_live_authorizations_created: 0,
    successor_live_authorizations_consumed: 0,
    real_provider_calls: 0,
    behavioral_cohort_result: "none",
    compatibility_probe_result_reused_as_behavioral_input: false,
    behavioral_cohort_executed: false,
    replication_authorized: false,
    policy_authorized: false,
    stage_7_authorized: false,
  });
  assert.throws(
    () =>
      assertOperationalReentryParserClosedCleanControlCohortArtifactPayloadSafeV01({
        raw_response: "synthetic forbidden material",
      }),
    /forbidden_field_refused/u,
  );
  const packageJson = JSON.parse(
    readFileSync(path.join(repositoryRoot, "package.json"), "utf8"),
  ) as { scripts: Record<string, string> };
  assert.equal(
    packageJson.scripts[
      "operational-reentry:parser-closed-clean-control-cohort"
    ],
    "node --import tsx scripts/operational-reentry-parser-closed-clean-control-cohort.ts",
  );
  assert.equal(
    packageJson.scripts[
      "test:operational-reentry-parser-closed-clean-control-cohort"
    ],
    "node --import tsx scripts/test-operational-reentry-parser-closed-clean-control-cohort.ts",
  );
  assert.equal(
    packageJson.scripts["protocol:conformance"],
    "node --import tsx scripts/vnext-protocol-conformance.ts",
  );
  const cli = readFileSync(
    path.join(
      repositoryRoot,
      "scripts/operational-reentry-parser-closed-clean-control-cohort.ts",
    ),
    "utf8",
  );
  assert.ok(cli.includes("--authorization-file"));
  assert.ok(cli.includes("--confirm-parser-closed-clean-control-cohort"));
  assert.equal(cli.includes("buildOperationalReentryParserClosedCleanControlCohortAuthorizationCandidateV01"), false);
}

function buildInputV01(
  admission: ModelGatewayInteractiveAdmissionV01,
  route: OperationalReentryMatchedCohortRouteV03,
  label: string,
): BuildOperationalReentryParserClosedCleanControlCohortInputV01 {
  const plan = buildOperationalReentryParserClosedCleanControlCohortPlanV01();
  const bridge = buildOperationalReentryParserClosedCleanControlEvaluatorBridgeV01();
  const authority = buildModelGatewayCostAuthorityV01({
    authority_kind: "provider_model_pricing_snapshot",
    workspace_id: admission.workspace_id,
    project_id: admission.project_id,
    purpose: "operational_reentry_matched_cohort_v03",
    provider_ref: route.provider_ref,
    model_ref: route.model_ref,
    cost_unit: "nano_usd",
    input_rate: { unit: "utf8_byte", cost_per_unit: 400 },
    output_rate: { unit: "token", cost_per_unit: 1_600 },
    pricing_source_version:
      "e2r2p5h_test_only_openai_gpt-4.1-mini-2025-04-14_2026-08-20",
    pricing_effective_at: "2026-08-20T09:00:00.000Z",
    pricing_expires_at: "2026-08-20T12:00:00.000Z",
    project_model_policy_fingerprint: route.integrity_fingerprint,
  });
  const budget = buildModelGatewayCostBudgetV01({
    authority,
    workspace_id: admission.workspace_id,
    project_id: admission.project_id,
    purpose: "operational_reentry_matched_cohort_v03",
    provider_ref: route.provider_ref,
    model_ref: route.model_ref,
    maximum_input_units:
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03.finalRequestBytes,
    maximum_output_units:
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03.maxOutputTokens,
    timeout_ms:
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03.timeoutMs,
    maximum_permitted_cost:
      ACGC_E2R2P5H_DEFAULT_AUTHORIZATION_CEILING_NANO_USD_V01,
    evaluated_at: evaluatedAt,
  });
  const pricing = buildOperationalReentryParserClosedCleanControlCohortPricingV01({
    pricing_snapshot_authority:
      "future_live_issue_must_refresh_official_pricing",
    pricing_source_version: authority.pricing_source_version,
    pricing_snapshot_evaluated_at: evaluatedAt,
    pricing_authority_expires_at: authority.pricing_expires_at!,
    pricing_authority_fingerprint: authority.pricing_fingerprint,
    input_nano_usd_per_token: 400,
    cached_input_nano_usd_per_token: 100,
    output_nano_usd_per_token: 1_600,
    gateway_cost_budget: budget,
  });
  assert.equal(
    pricing.per_call_conservative_worst_case_nano_usd,
    ACGC_E2R2P5H_PER_CALL_WORST_CASE_NANO_USD_V01,
  );
  assert.equal(
    pricing.aggregate_conservative_worst_case_nano_usd,
    ACGC_E2R2P5H_AGGREGATE_WORST_CASE_NANO_USD_V01,
  );
  assert.equal(pricing.input_nano_usd_per_token, 400);
  assert.equal(pricing.cached_input_nano_usd_per_token, 100);
  assert.equal(pricing.output_nano_usd_per_token, 1_600);
  assert.equal(
    pricing.exact_cost_basis,
    "validated_provider_reported_token_usage",
  );
  assert.equal(pricing.missing_exact_usage_or_cost, "unknown_never_zero");
  const authorization =
    buildOperationalReentryParserClosedCleanControlCohortAuthorizationCandidateV01({
      authorization_id: `e2r2p5h-test-${label}-${authorizationSequence++}`,
      future_live_issue_number: 220,
      exact_merged_source_head: "d".repeat(40),
      repository_slug: repositoryIdentity.repository_slug,
      authorized_origin: repositoryIdentity.origin,
      issued_at: evaluatedAt,
      expires_at: "2026-08-20T11:00:00.000Z",
      workspace_id: admission.workspace_id,
      project_id: admission.project_id,
      expected_active_selection_revision:
        admission.expected_active_selection_revision,
      project_root_fingerprint: fingerprintV01(admission.project_root),
      gateway_authorization_project_is_lab_experiment_meaning: false,
      case_fingerprint: ACGC_E2R2P5H_CASE_FINGERPRINT_V01,
      common_task_evidence_fingerprint:
        ACGC_E2R2P5H_COMMON_TASK_EVIDENCE_FINGERPRINT_V01,
      behavioral_plan_fingerprint: plan.integrity.fingerprint,
      route_fingerprint: route.integrity_fingerprint,
      provider_contract_fingerprint:
        ACGC_E2R2P5H_PROVIDER_CONTRACT_FINGERPRINT_V01,
      adapter_request_route_fingerprint:
        ACGC_E2R2P5H_ADAPTER_REQUEST_ROUTE_FINGERPRINT_V01,
      evaluator_bridge_fingerprint: bridge.integrity.fingerprint,
      evaluator_bridge_version: bridge.bridge_version,
      evaluator_version: bridge.historical_evaluator_version,
      e1_evaluator_version: bridge.historical_e1_evaluator_version,
      provider_contract_version:
        "operational_reentry_clean_control_matched_cohort_provider_contract.v0.3",
      codec_version: "operational_reentry_matched_cohort_codec.v0.4",
      response_schema_version:
        "operational_reentry_matched_cohort_response_schema.v0.4",
      parser_version: "operational_reentry_matched_cohort_parser.v0.3",
      adapter_implementation_version:
        "openai_responses_operational_reentry_matched_cohort_adapter.v0.5",
      planned_calls: 16,
      maximum_parallel_provider_calls: 1,
      retries: 0,
      replacement_calls: 0,
      adaptive_stopping: false,
      fresh_stateless_invocation_per_call: true,
      conversation_reuse: false,
      thread_reuse: false,
      previous_response_reuse: false,
      behavioral_cohort_authorized: true,
      replication_authorized: false,
      policy_authorized: false,
      stage_7_authorized: false,
      pricing_snapshot_evaluated_at: pricing.pricing_snapshot_evaluated_at,
      pricing_source_version: pricing.pricing_source_version,
      pricing_authority_fingerprint: pricing.pricing_authority_fingerprint,
      pricing_authority_expires_at: pricing.pricing_authority_expires_at,
      pricing_fingerprint: pricing.integrity.fingerprint,
      maximum_total_cost_nano_usd:
        ACGC_E2R2P5H_DEFAULT_AUTHORIZATION_CEILING_NANO_USD_V01,
    });
  return {
    authorization,
    pricing,
    admission,
    route,
    repository_identity: repositoryIdentity,
    evaluated_at: evaluatedAt,
  };
}

function dependenciesV01(
  adapter: ReturnType<typeof createOpenAIResponsesAdapterV01>,
  route: OperationalReentryMatchedCohortRouteV03,
  overrides: Partial<RunOperationalReentryParserClosedCleanControlCohortDependenciesV01> = {},
): RunOperationalReentryParserClosedCleanControlCohortDependenciesV01 {
  return {
    gateway_dependencies: {
      adapter,
      expected_operational_reentry_matched_cohort_v03_route: route,
      open_database: () => new Database(databasePath),
      read_root_availability: async () => "available" as const,
      now: () => new Date(evaluatedAt),
    },
    assert_execution_state() {},
    consume_authorization() {},
    ...overrides,
  };
}

function adapterV01(
  transport: (request: OpenAIResponsesTransportRequestV01) => Promise<any>,
) {
  return createOpenAIResponsesAdapterV01({
    environment: {
      OPENAI_API_KEY: "test-credential-never-persisted",
      OPENAI_MODEL: "ambient-model-must-not-override-v03",
    },
    transport: async (request) => {
      fakeTransportCalls += 1;
      return transport(request);
    },
  });
}

async function routeV01(
  adapter: ReturnType<typeof createOpenAIResponsesAdapterV01>,
): Promise<OperationalReentryMatchedCohortRouteV03> {
  const route =
    await prepareOperationalReentryMatchedCohortModelGatewayRouteV03({
      adapter,
    });
  assert.ok(route);
  assert.equal(route.integrity_fingerprint, ACGC_E2R2P5H_ROUTE_FINGERPRINT_V01);
  return route;
}

function acceptedResponseV01(
  output: unknown,
  cachedInputTokens: number | "unavailable" = 0,
) {
  return {
    ok: true,
    status: 200,
    headers: { get: () => null },
    async json() {
      return {
        status: "completed",
        output_text: JSON.stringify(output),
        usage: {
          input_tokens: 120,
          ...(cachedInputTokens === "unavailable"
            ? {}
            : { input_tokens_details: { cached_tokens: cachedInputTokens } }),
          output_tokens: 40,
          total_tokens: 160,
        },
      };
    },
    async text() {
      return "";
    },
  };
}

function rejectedResponseV01(status: number) {
  return {
    ok: false,
    status,
    headers: {
      get(name: string) {
        return name === "x-request-id" ? `req_e2r2p5h_${status}` : null;
      },
    },
    async text() {
      return JSON.stringify({
        error: {
          type: "synthetic_error",
          code: `synthetic_${status}`,
          param: "text.format.schema",
          message: "raw provider error must not persist",
        },
      });
    },
    async json() {
      throw new Error("text response expected");
    },
  };
}

function initializeDatabaseV01(): void {
  const database = new Database(databasePath);
  database.exec(readFileSync(path.join(repositoryRoot, "lib/db/schema.sql"), "utf8"));
  database.close();
}

function registerProjectV01(): ModelGatewayInteractiveAdmissionV01 {
  const database = new Database(databasePath);
  try {
    const workspace = getOrCreateDefaultWorkspaceIdentityV01(database, {
      create_uuid: () => "31111111-1111-4111-8111-111111111111",
      now: () => "2026-08-20T09:50:00.000Z",
    });
    const localRoot = normalizeLocalProjectRootRefV01(projectRoot, {
      base_path: path.parse(projectRoot).root,
    });
    const project = getOrCreateCanonicalProjectForLocalRootV01(
      database,
      {
        workspace_id: workspace.workspace_id,
        local_root: localRoot,
        display_name: "e2r2p5h-v03-test-project",
      },
      {
        create_uuid: () => "32222222-2222-4222-8222-222222222222",
        now: () => "2026-08-20T09:51:00.000Z",
      },
    );
    const active = selectActiveProjectV01(database, {
      workspace_id: workspace.workspace_id,
      project_id: project.project.project_id,
      now: "2026-08-20T09:52:00.000Z",
      expected_project_id: null,
      expected_revision: null,
    });
    return {
      workspace_id: workspace.workspace_id,
      project_id: project.project.project_id,
      expected_active_selection_revision: active.selection_revision,
      project_root: {
        path_flavor: localRoot.path_flavor,
        normalized_path: localRoot.normalized_path,
      },
      gateway_authorization_project_is_lab_experiment_meaning: false,
    };
  } finally {
    database.close();
  }
}

function fingerprintV01(value: unknown): string {
  return createProtocolSha256V01(canonicalizeProtocolValueV01(value));
}

function resealAuthorizationV01(value: Record<string, unknown>): unknown {
  const { integrity: _integrity, ...payload } = value;
  return {
    ...payload,
    integrity: {
      algorithm: "sha256",
      canonicalization: "augnes-json-c14n-v0_1",
      fingerprint_scope:
        "parser_closed_clean_control_cohort_authorization_without_integrity_fingerprint",
      fingerprint: fingerprintV01(payload),
    },
  };
}
