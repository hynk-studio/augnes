#!/usr/bin/env node
import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import type { ModelTransportResponse } from "@/lib/model-egress/bounded-model-payload";
import {
  assertOperationalReentryProviderCompatibilityProbeArtifactPayloadSafeV01,
  assertOperationalReentryProviderCompatibilityProbeArtifactRootAvailableV01,
  beginOperationalReentryProviderCompatibilityProbeAttemptV01,
  validateOperationalReentryProviderCompatibilityProbeArtifactsV01,
} from "@/lib/vnext/operational-reentry-provider-compatibility-probe-artifact-store";
import {
  ACGC_E2P1_AGGREGATE_COST_CEILING_NANO_USD_V01,
  ACGC_E2P1_CANONICAL_SHAPE_ORDER_V01,
  buildOperationalReentryProviderCompatibilityProbeAuthorizationExpectationsV01,
  buildOperationalReentryProviderCompatibilityProbeProviderVisibleRequestV01,
  buildOperationalReentryProviderCompatibilityProbeV01,
  deriveOperationalReentryProviderCompatibilityProbeOutcomeV01,
  projectOperationalReentryProviderCompatibilityProbePlanForArtifactV01,
  runOperationalReentryProviderCompatibilityProbeV01,
  validateOperationalReentryProviderCompatibilityProbeExecutionResultV01,
} from "@/lib/vnext/operational-reentry-provider-compatibility-probe";
import {
  buildOperationalReentryMatchedCohortCallPlanV01,
} from "@/lib/vnext/operational-reentry-matched-cohort";
import {
  prepareOperationalReentryMatchedCohortModelGatewayRouteV01,
  type ModelGatewayInteractiveAdmissionV01,
} from "@/lib/vnext/model-gateway/model-gateway";
import {
  ModelGatewayInvocationErrorV01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
} from "@/lib/vnext/model-gateway/contracts";
import {
  createOpenAIResponsesAdapterV01,
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V03,
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02,
  type OpenAIResponsesTransportRequestV01,
} from "@/lib/vnext/model-gateway/openai/responses-adapter";
import {
  operationalReentryMatchedCohortResponseSchemaV02,
} from "@/lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-codec";
import {
  validateOpenAIStrictSchemaSupportedSubsetV01,
} from "@/lib/vnext/model-gateway/openai/strict-schema-supported-subset";
import {
  createDeterministicModelClientRequestIdV01,
  createDeterministicModelProviderRequestTraceV01,
} from "@/lib/vnext/model-gateway/provider-rejection-observation";
import {
  getOrCreateCanonicalProjectForLocalRootV01,
  getOrCreateDefaultWorkspaceIdentityV01,
  normalizeLocalProjectRootRefV01,
} from "@/lib/vnext/persistence/project-identity-registry";
import { selectActiveProjectV01 } from "@/lib/vnext/persistence/project-lifecycle-registry";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import type {
  OperationalReentryMatchedCohortModelInputV01,
  OperationalReentryMatchedCohortModelOutputV01,
  OperationalReentryMatchedCohortRouteV01,
} from "@/types/vnext/operational-reentry-matched-cohort";
import {
  OPERATIONAL_REENTRY_PROVIDER_COMPATIBILITY_PROBE_AUTHORIZATION_VERSION_V01,
  type OperationalReentryProviderCompatibilityProbeAuthorizationV01,
  type OperationalReentryProviderCompatibilityProbeExecutionResultV01,
} from "@/types/vnext/operational-reentry-provider-compatibility-probe";

const root = mkdtempSync(path.join(tmpdir(), "augnes-e2p1-probe-"));
const projectRoot = path.join(root, "project");
const databasePath = path.join(root, "gateway.db");
const evaluatedAt = "2026-08-18T08:00:00.000Z";
const sourceHead = "b".repeat(40);
const representativeFingerprintsV01 = [
  {
    shape: "A",
    representative_input_fingerprint:
      "sha256:8fe99cb5496af8bc7df51827d215540052bbda2db7751dfbe92c969ef9ba0c4c",
    schema_fingerprint:
      "sha256:521e63cf6f0b7ac3f4c5e9f1239b3dc398ae97bea821cdab3201c4c2303665d9",
  },
  {
    shape: "B",
    representative_input_fingerprint:
      "sha256:af718df0cd0e09ccc93d999ea741c2e7cb7281c14708b752f94c78f59d3020ec",
    schema_fingerprint:
      "sha256:de2fbe755a9ff1d35acbc9369fa7f97db6723b56cd49960b5b927790a3aed5db",
  },
  {
    shape: "C",
    representative_input_fingerprint:
      "sha256:0bc2a5efc4586c253d28ed85ce793ebb4b7f28b7d9a59ce33d0dee5e9dc2a9b9",
    schema_fingerprint:
      "sha256:a0872a14cbd114f7573319e056bb2478326a07f9eeae3c916a6fa8ffcfc09570",
  },
  {
    shape: "D",
    representative_input_fingerprint:
      "sha256:393beed7097f596f90600185816760eb97627649a2699aa02deb11d631fc0da7",
    schema_fingerprint:
      "sha256:3cef104a1d7a0d739dca716335fd5d7744b1e1a033314d2d2cd5d9b3afb6798c",
  },
] as const;
let authorizationSequence = 0;
let fakeProviderCalls = 0;

void main()
  .finally(() => rmSync(root, { recursive: true, force: true }))
  .catch((error) => {
    console.error("operational_reentry_provider_compatibility_probe_test_failed");
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exitCode = 1;
  });

async function main(): Promise<void> {
  mkdirSync(projectRoot, { recursive: true });
  writeFileSync(path.join(projectRoot, ".gitignore"), ".augnes-lab/\n");
  initializeDatabaseV01();
  const admission = registerProjectV01();
  const databaseBefore = readFileSync(databasePath);

  await verifyPlanContractAndProviderProjectionV01(admission);
  await verifyFourAcceptedCallsV01(admission);
  await verifyStopOnFirstFailureV01(admission);
  await verifyProviderResponseInvalidV01(admission);
  await verifyBoundedProviderRejectionDiagnosticsV01(admission);
  await verifyIncompleteTerminalFamiliesV01(admission);
  await verifyDeterministicFallbackCannotSucceedV01(admission);
  await verifyAuthorizationAndCostRefusalsV01(admission);
  await verifyAppendOnlyArtifactsAndPrivacyV01(admission);
  verifyStaticNoBehaviorAndCliBoundaryV01();
  assert.deepEqual(readFileSync(databasePath), databaseBefore);

  console.log(
    JSON.stringify({
      status:
        "operational_reentry_provider_compatibility_probe_test_passed",
      planned_shapes: 4,
      canonical_order: ACGC_E2P1_CANONICAL_SHAPE_ORDER_V01,
      fake_provider_calls: fakeProviderCalls,
      real_provider_calls: 0,
      retries: 0,
      replacement_calls: 0,
      behavioral_outputs_generated: false,
    }),
  );
}

async function verifyPlanContractAndProviderProjectionV01(
  admission: ModelGatewayInteractiveAdmissionV01,
): Promise<void> {
  const adapter = adapterV01(async () => {
    throw new Error("plan construction must remain zero egress");
  });
  const route = await routeV01(adapter);
  const authorization = authorizationV01(admission, route, "plan");
  const prepared = buildOperationalReentryProviderCompatibilityProbeV01({
    authorization,
    admission,
    route,
    evaluated_at: evaluatedAt,
  });
  const rebuilt = buildOperationalReentryProviderCompatibilityProbeV01({
    authorization,
    admission,
    route,
    evaluated_at: evaluatedAt,
  });
  assert.deepEqual(rebuilt, prepared);
  assert.equal(prepared.plan.planned_shapes, 4);
  assert.equal(prepared.plan.entries.length, 4);
  assert.deepEqual(prepared.plan.canonical_order, ["A", "B", "C", "D"]);
  assert.deepEqual(
    prepared.plan.entries.map((entry) => entry.shape),
    ["A", "B", "C", "D"],
  );
  assert.deepEqual(
    prepared.plan.entries.map((entry) => entry.representative_shape_meaning),
    [
      "target_present_fresh",
      "non_target_context_present_target_absent",
      "target_present_exact_stale_regime_relation",
      "no_continuation_context_target_absent",
    ],
  );
  assert.deepEqual(
    prepared.plan.entries.map((entry) => ({
      shape: entry.shape,
      representative_input_fingerprint:
        entry.representative_input_fingerprint,
      schema_fingerprint: entry.schema_fingerprint,
    })),
    representativeFingerprintsV01,
  );
  assert.equal(prepared.plan.maximum_provider_calls, 4);
  assert.equal(prepared.plan.maximum_parallel_calls, 1);
  assert.equal(prepared.plan.retries, 0);
  assert.equal(prepared.plan.replacement_calls, 0);
  assert.equal(prepared.plan.fresh_stateless_request_per_shape, true);
  assert.equal(prepared.plan.conversation_reuse, false);
  assert.equal(prepared.plan.thread_reuse, false);
  assert.equal(prepared.plan.previous_response_reuse, false);
  assert.equal(prepared.plan.adaptive_prompt_schema_or_input_changes, false);
  assert.equal(prepared.plan.stop_after_first_non_success_terminal_result, true);
  assert.equal(
    prepared.plan.remaining_shapes_after_terminal_failure,
    "not_attempted_after_terminal_failure",
  );
  assert.equal(prepared.plan.request_family_kind, "compatibility_probe");
  assert.equal(
    prepared.plan.request_family_trace_id,
    createDeterministicModelProviderRequestTraceV01({
      request_family_kind: "compatibility_probe",
      request_family_fingerprint:
        prepared.plan.request_family_basis_fingerprint,
    }),
  );
  assert.equal(
    new Set(prepared.plan.entries.map((entry) => entry.client_request_id)).size,
    4,
  );
  assert.equal(route.provider_ref.external_id, "openai");
  assert.equal(
    route.model_ref.external_id,
    "gpt-4.1-mini-2025-04-14",
  );
  assert.equal(
    route.adapter_implementation_version,
    OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V03,
  );
  assert.equal(
    prepared.provider_contract.reused_provider_contract_version,
    "operational_reentry_matched_cohort_provider_contract.v0.3",
  );
  assert.equal(
    prepared.provider_contract.deterministic_fallback_counts_as_success,
    false,
  );
  assert.equal(
    prepared.pricing.aggregate_ceiling_nano_usd,
    ACGC_E2P1_AGGREGATE_COST_CEILING_NANO_USD_V01,
  );
  assert.ok(
    prepared.pricing.aggregate_worst_case_cost_nano_usd <=
      ACGC_E2P1_AGGREGATE_COST_CEILING_NANO_USD_V01,
  );
  assert.equal(
    prepared.pricing.missing_usage_or_exact_cost,
    "unknown_never_zero",
  );

  const cohortPlan = buildOperationalReentryMatchedCohortCallPlanV01();
  for (const entry of prepared.plan.entries) {
    const source = cohortPlan.entries.find(
      (candidate) => candidate.arm === entry.shape,
    )!;
    const { invocation_context: _sourceContext, ...sourceMeaning } =
      source.model_input;
    const { invocation_context: _probeContext, ...probeMeaning } =
      entry.model_input;
    assert.deepEqual(probeMeaning, sourceMeaning);
    const schema = operationalReentryMatchedCohortResponseSchemaV02(
      entry.model_input,
    );
    assert.doesNotThrow(() =>
      validateOpenAIStrictSchemaSupportedSubsetV01(schema),
    );
    assert.equal(
      entry.schema_fingerprint,
      createProtocolSha256V01(canonicalizeProtocolValueV01(schema)),
    );
    assert.equal(
      entry.representative_input_fingerprint,
      createProtocolSha256V01(
        canonicalizeProtocolValueV01(entry.model_input),
      ),
    );
    const request =
      buildOperationalReentryProviderCompatibilityProbeProviderVisibleRequestV01(
        entry.model_input,
      );
    assert.equal(
      request.request_fingerprint,
      entry.provider_visible_request_fingerprint,
    );
    const body = request.request_body;
    assert.equal(body.includes(entry.request_family_trace_id), false);
    assert.equal(body.includes(entry.client_request_id), false);
    for (const forbidden of [
      '"arm"',
      '"shape"',
      "evaluator_only",
      "aggregate_rules",
      "bounded_positive_min_better",
      "threshold",
      "acgc_trace_",
      "compatibility_probe",
      "cohort_attempt",
      "replacement_cohort",
    ]) {
      assert.equal(body.includes(forbidden), false, forbidden);
    }
    assert.equal(JSON.parse(body).store, false);
    assert.equal(
      JSON.parse(body).model,
      OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02,
    );
    assert.equal(body.includes("uniqueItems"), false);
  }
  const [a, b, c, d] = prepared.plan.entries.map(
    (entry) => entry.model_input,
  );
  assert.ok(a!.target_context_token);
  assert.equal(a!.stale_relation, null);
  assert.equal(b!.target_context_token, null);
  assert.ok(b!.context_material.length > 0);
  assert.ok(c!.target_context_token);
  assert.ok(c!.stale_relation);
  assert.equal(d!.target_context_token, null);
  assert.equal(d!.context_material.length, 0);

  const sameSlot = prepared.plan.entries[0]!.call_slot_id;
  const sameBasis = prepared.plan.request_family_basis_fingerprint;
  const traces = [
    "cohort_attempt",
    "compatibility_probe",
    "replacement_cohort",
  ].map((request_family_kind) =>
    createDeterministicModelProviderRequestTraceV01({
      request_family_kind: request_family_kind as
        | "cohort_attempt"
        | "compatibility_probe"
        | "replacement_cohort",
      request_family_fingerprint: sameBasis,
    }),
  );
  const requestIds = traces.map((provider_request_trace_id) =>
    createDeterministicModelClientRequestIdV01({
      purpose: OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
      provider_request_trace_id,
      call_slot_id: sameSlot,
      model: OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02,
    }),
  );
  assert.equal(new Set(requestIds).size, 3);
  const artifactPlan =
    projectOperationalReentryProviderCompatibilityProbePlanForArtifactV01(
      prepared.plan,
    );
  assert.equal(JSON.stringify(artifactPlan).includes("model_input"), false);
  assert.equal(
    JSON.stringify(artifactPlan).includes("provider_visible_input_persisted"),
    true,
  );
  assert.equal(fakeProviderCalls, 0);
}

async function verifyFourAcceptedCallsV01(
  admission: ModelGatewayInteractiveAdmissionV01,
): Promise<void> {
  const captured: Array<{
    body: string;
    client_request_id: string | undefined;
  }> = [];
  let prepared: ReturnType<
    typeof buildOperationalReentryProviderCompatibilityProbeV01
  >;
  const adapter = adapterV01(async (request) => {
    const input = prepared.plan.entries[captured.length]!.model_input;
    captured.push({
      body: request.body,
      client_request_id: request.headers["X-Client-Request-Id"],
    });
    return acceptedResponseV01(outputForV01(input));
  });
  const route = await routeV01(adapter);
  const authorization = authorizationV01(admission, route, "accepted");
  prepared = buildOperationalReentryProviderCompatibilityProbeV01({
    authorization,
    admission,
    route,
    evaluated_at: evaluatedAt,
  });
  let consumptions = 0;
  const result = await runOperationalReentryProviderCompatibilityProbeV01(
    { authorization, admission, route, evaluated_at: evaluatedAt },
    dependenciesV01(adapter, {
      consume_authorization() {
        consumptions += 1;
      },
    }),
  );
  assert.equal(consumptions, 1);
  assert.equal(captured.length, 4);
  assert.equal(result.result_kind, "complete");
  assert.equal(result.report.outcome, "accepted_all_shapes");
  assert.equal(result.report.attempted_provider_calls, 4);
  assert.equal(result.report.accepted_and_normalized_shapes, 4);
  assert.equal(result.report.not_attempted_after_terminal_failure, 0);
  assert.equal(result.report.first_terminal_failure, null);
  assert.equal(result.report.authorization_consumed, true);
  assert.equal(result.report.exact_cost.status, "calculated");
  assert.ok((result.report.exact_cost.calculated_total_nano_usd ?? 0) > 0);
  assert.deepEqual(
    result.shapes.map((shape) => shape.terminal_category),
    Array(4).fill("accepted_and_normalized"),
  );
  for (const [index, capture] of captured.entries()) {
    assert.equal(
      createProtocolSha256V01(capture.body),
      result.plan.entries[index]!.provider_visible_request_fingerprint,
    );
    assert.equal(
      capture.client_request_id,
      result.plan.entries[index]!.client_request_id,
    );
    assert.equal(capture.body.includes("acgc_trace_"), false);
    assert.equal(capture.body.includes('"arm"'), false);
  }
  assert.deepEqual(result.report.probe_scope_boundary, {
    operational_reentry_evaluation_built: false,
    behavioral_analysis_generated: false,
    model_or_provider_quality_judgment_generated: false,
    continuation_benefit_or_harm_claim_generated: false,
  });
}

async function verifyStopOnFirstFailureV01(
  admission: ModelGatewayInteractiveAdmissionV01,
): Promise<void> {
  const rejectA = await runTransportScenarioV01(admission, "reject-a", {
    transport: async () => rejectionResponseV01(400),
  });
  assert.equal(rejectA.transport_calls, 1);
  assert.equal(rejectA.result.report.outcome, "provider_rejected");
  assert.deepEqual(
    rejectA.result.shapes.map((shape) => shape.terminal_category),
    [
      "provider_rejected",
      "not_attempted_after_terminal_failure",
      "not_attempted_after_terminal_failure",
      "not_attempted_after_terminal_failure",
    ],
  );
  assert.equal(rejectA.result.report.terminal_shape_count, 1);
  assert.equal(rejectA.result.report.attempted_provider_calls, 1);
  assert.equal(rejectA.result.report.authorization_consumed, true);
  assert.equal(rejectA.result.report.exact_cost.status, "unknown");
  assert.equal(
    rejectA.result.report.exact_cost.calculated_total_nano_usd,
    null,
  );
  assert.equal(
    rejectA.result.report.exact_cost.missing_usage_or_exact_cost,
    "unknown_never_zero",
  );
  assert.equal(
    rejectA.result.report.not_attempted_after_terminal_failure,
    3,
  );

  const acceptThenReject = await runTransportScenarioV01(
    admission,
    "accept-then-reject",
    {
      transport: async (_request, index, input) =>
        index === 0
          ? acceptedResponseV01(outputForV01(input))
          : rejectionResponseV01(429),
    },
  );
  assert.equal(acceptThenReject.transport_calls, 2);
  assert.deepEqual(
    acceptThenReject.result.shapes.map((shape) => shape.terminal_category),
    [
      "accepted_and_normalized",
      "provider_rejected",
      "not_attempted_after_terminal_failure",
      "not_attempted_after_terminal_failure",
    ],
  );
  assert.equal(acceptThenReject.result.report.terminal_shape_count, 2);
  assert.equal(
    acceptThenReject.result.report.not_attempted_after_terminal_failure,
    2,
  );
  assert.equal(acceptThenReject.result.report.attempted_provider_calls, 2);
}

async function verifyProviderResponseInvalidV01(
  admission: ModelGatewayInteractiveAdmissionV01,
): Promise<void> {
  const scenario = await runTransportScenarioV01(admission, "parse-invalid", {
    transport: async () =>
      acceptedResponseV01({
        result_token: "not_allowlisted",
      } as unknown as OperationalReentryMatchedCohortModelOutputV01),
  });
  assert.equal(scenario.transport_calls, 1);
  assert.equal(scenario.result.report.outcome, "provider_response_invalid");
  assert.deepEqual(
    scenario.result.shapes.map((shape) => shape.terminal_category),
    [
      "provider_response_invalid",
      "not_attempted_after_terminal_failure",
      "not_attempted_after_terminal_failure",
      "not_attempted_after_terminal_failure",
    ],
  );
}

async function verifyBoundedProviderRejectionDiagnosticsV01(
  admission: ModelGatewayInteractiveAdmissionV01,
): Promise<void> {
  for (const status of [400, 401, 403, 429, 500]) {
    const scenario = await runTransportScenarioV01(
      admission,
      `diagnostic-${status}`,
      { transport: async () => rejectionResponseV01(status) },
    );
    assert.equal(scenario.transport_calls, 1);
    const observation =
      scenario.result.shapes[0]!.provider_rejection_observation;
    assert.ok(observation);
    assert.equal(observation.http_status, status);
    assert.equal(observation.error_type, "synthetic_error");
    assert.equal(observation.error_code, `synthetic_${status}`);
    assert.equal(observation.error_param, "text.format.schema");
    assert.equal(observation.provider_request_id, `req_test_${status}`);
    assert.equal(
      observation.client_request_id,
      scenario.result.plan.entries[0]!.client_request_id,
    );
    assert.equal(
      observation.request_fingerprint,
      scenario.result.plan.entries[0]!.provider_visible_request_fingerprint,
    );
    assert.equal(
      observation.schema_fingerprint,
      scenario.result.plan.entries[0]!.schema_fingerprint,
    );
    const serialized = JSON.stringify(observation);
    assert.equal(serialized.includes("raw provider message"), false);
    assert.equal(serialized.includes("test-credential"), false);
    assert.equal(serialized.includes("arbitrary"), false);
  }
}

async function verifyIncompleteTerminalFamiliesV01(
  admission: ModelGatewayInteractiveAdmissionV01,
): Promise<void> {
  const transport = await runTransportScenarioV01(admission, "transport", {
    transport: async () => {
      throw new Error("synthetic transport failure");
    },
  });
  assert.equal(
    transport.result.shapes[0]!.terminal_category,
    "transport_failed",
  );
  assert.equal(
    transport.result.report.outcome,
    "transport_or_runtime_incomplete",
  );
  assert.equal(transport.result.report.attempted_provider_calls, 1);
  assert.equal(transport.result.report.authorization_consumed, true);

  for (const [label, error, expected] of [
    [
      "timeout",
      new ModelGatewayInvocationErrorV01("model_gateway_timeout"),
      "timed_out",
    ],
    [
      "cancelled",
      new ModelGatewayInvocationErrorV01("model_gateway_cancelled"),
      "cancelled",
    ],
    ["internal", new Error("synthetic internal"), "internal_failure"],
  ] as const) {
    const route = await routeV01(adapterV01(async () => {
      throw new Error("unexpected transport");
    }));
    const authorization = authorizationV01(admission, route, label);
    const result = await runOperationalReentryProviderCompatibilityProbeV01(
      { authorization, admission, route, evaluated_at: evaluatedAt },
      {
        invoke_gateway: (async () => {
          throw error;
        }) as typeof import("@/lib/vnext/model-gateway/model-gateway").invokeOperationalReentryMatchedCohortModelGatewayV01,
        assert_source_unchanged() {},
        consume_authorization() {
          throw new Error("no egress should consume authorization");
        },
      },
    );
    assert.equal(result.shapes[0]!.terminal_category, expected);
    assert.equal(result.report.outcome, "transport_or_runtime_incomplete");
    assert.equal(result.report.authorization_consumed, false);
  }

  const sourceDrift = await runSourceDriftScenarioV01(admission);
  assert.deepEqual(
    sourceDrift.shapes.map((shape) => shape.terminal_category),
    [
      "accepted_and_normalized",
      "blocked_before_egress",
      "not_attempted_after_terminal_failure",
      "not_attempted_after_terminal_failure",
    ],
  );
  assert.equal(
    sourceDrift.report.outcome,
    "transport_or_runtime_incomplete",
  );
  assert.equal(sourceDrift.report.attempted_provider_calls, 1);
  assert.equal(
    deriveOperationalReentryProviderCompatibilityProbeOutcomeV01([]),
    "not_run",
  );
}

async function verifyDeterministicFallbackCannotSucceedV01(
  admission: ModelGatewayInteractiveAdmissionV01,
): Promise<void> {
  const route = await routeV01(adapterV01(async () => {
    throw new Error("unexpected transport");
  }));
  const authorization = authorizationV01(admission, route, "fallback");
  const result = await runOperationalReentryProviderCompatibilityProbeV01(
    { authorization, admission, route, evaluated_at: evaluatedAt },
    {
      invoke_gateway: (async () => ({
        generator: "deterministic",
        output: outputForV01(
          buildOperationalReentryMatchedCohortCallPlanV01().entries[0]!
            .model_input,
        ),
        model_invocation_receipt: null,
      })) as unknown as typeof import("@/lib/vnext/model-gateway/model-gateway").invokeOperationalReentryMatchedCohortModelGatewayV01,
      assert_source_unchanged() {},
      consume_authorization() {
        throw new Error("deterministic result must not consume authorization");
      },
    },
  );
  assert.equal(result.shapes[0]!.terminal_category, "internal_failure");
  assert.equal(result.report.outcome, "transport_or_runtime_incomplete");
  assert.equal(result.report.accepted_and_normalized_shapes, 0);
  assert.equal(result.report.authorization_consumed, false);
}

async function verifyAuthorizationAndCostRefusalsV01(
  admission: ModelGatewayInteractiveAdmissionV01,
): Promise<void> {
  const route = await routeV01(adapterV01(async () => {
    throw new Error("unexpected transport");
  }));
  const authorization = authorizationV01(admission, route, "auth");
  assert.throws(
    () =>
      buildOperationalReentryProviderCompatibilityProbeV01({
        authorization: undefined,
        admission,
        route,
        evaluated_at: evaluatedAt,
      }),
    /operational_reentry_probe_authorization_missing_or_malformed/,
  );
  const malformed = structuredClone(authorization) as unknown as Record<
    string,
    unknown
  >;
  delete malformed.maximum_parallel_calls;
  assert.throws(
    () =>
      buildOperationalReentryProviderCompatibilityProbeV01({
        authorization: malformed,
        admission,
        route,
        evaluated_at: evaluatedAt,
      }),
    /operational_reentry_probe_authorization_missing_or_malformed|operational_reentry_probe_fingerprint_invalid/,
  );
  for (const exactMergedSourceHead of [
    "not-a-git-sha",
    "123c5e31708a35c68be73b332d595bed9a9eea94",
  ]) {
    const changed = resealAuthorizationV01({
      ...authorization,
      exact_merged_source_head: exactMergedSourceHead,
    });
    assert.throws(
      () =>
        buildOperationalReentryProviderCompatibilityProbeV01({
          authorization: changed,
          admission,
          route,
          evaluated_at: evaluatedAt,
        }),
      /operational_reentry_probe_authorization_mismatched/,
    );
  }
  for (const mutation of [
    { authorization_kind: "historical_provider_cohort" },
    { request_family_kind: "cohort_attempt" },
    { future_live_issue_number: 191 },
    { planned_shapes: 16 },
    { canonical_order: ["D", "C", "B", "A"] },
    { maximum_provider_calls: 5 },
    { maximum_parallel_calls: 2 },
    { retries: 1 },
    { replacement_calls: 1 },
    { fresh_stateless_request_per_shape: false },
    { conversation_reuse: true },
    { thread_reuse: true },
    { previous_response_reuse: true },
    { stop_after_first_non_success_terminal_result: false },
    { second_probe_authorized: true },
    { replacement_cohort_authorized: true },
    { stage_7_authorized: true },
    { maximum_total_cost_nano_usd: 250_000_001 },
    { case_fingerprint: `sha256:${"3".repeat(64)}` },
    { route_fingerprint: `sha256:${"0".repeat(64)}` },
    { provider_contract_fingerprint: `sha256:${"1".repeat(64)}` },
    { pricing_authority_fingerprint: `sha256:${"2".repeat(64)}` },
  ]) {
    const changed = resealAuthorizationV01({
      ...authorization,
      ...mutation,
    });
    assert.throws(
      () =>
        buildOperationalReentryProviderCompatibilityProbeV01({
          authorization: changed,
          admission,
          route,
          evaluated_at: evaluatedAt,
        }),
      /operational_reentry_probe_authorization_mismatched/,
    );
  }
  assert.throws(
    () => authorizationV01(admission, route, "stale", {
      expires_at: "2026-08-18T07:59:59.000Z",
    }),
    /operational_reentry_probe_authorization_mismatched/,
  );
  assert.throws(
    () =>
      buildOperationalReentryProviderCompatibilityProbeAuthorizationExpectationsV01(
        {
          admission,
          route,
          evaluated_at: "2026-08-24T00:00:00.000Z",
        },
      ),
    /model_gateway_pricing_stale/,
  );
  const wrongRoute = {
    ...route,
    model_ref: { ...route.model_ref, external_id: "ambient-wrong-model" },
  };
  assert.throws(
    () =>
      buildOperationalReentryProviderCompatibilityProbeV01({
        authorization,
        admission,
        route: wrongRoute,
        evaluated_at: evaluatedAt,
      }),
    /operational_reentry_probe_route_mismatch/,
  );
}

async function verifyAppendOnlyArtifactsAndPrivacyV01(
  admission: ModelGatewayInteractiveAdmissionV01,
): Promise<void> {
  const artifactRepository = path.join(root, "artifact-project");
  mkdirSync(artifactRepository, { recursive: true });
  writeFileSync(
    path.join(artifactRepository, ".gitignore"),
    ".augnes-lab/\n",
  );
  let prepared: ReturnType<
    typeof buildOperationalReentryProviderCompatibilityProbeV01
  >;
  let callIndex = 0;
  const adapter = adapterV01(async () => {
    const input = prepared.plan.entries[callIndex++]!.model_input;
    return acceptedResponseV01(outputForV01(input));
  });
  const route = await routeV01(adapter);
  const authorization = authorizationV01(admission, route, "artifacts");
  prepared = buildOperationalReentryProviderCompatibilityProbeV01({
    authorization,
    admission,
    route,
    evaluated_at: evaluatedAt,
  });
  const journal =
    beginOperationalReentryProviderCompatibilityProbeAttemptV01({
      repository_root: artifactRepository,
      prepared,
    });
  const result = await runOperationalReentryProviderCompatibilityProbeV01(
    { authorization, admission, route, evaluated_at: evaluatedAt },
    dependenciesV01(adapter, {
      consume_authorization(consumption) {
        journal.consume_authorization({
          authorization_fingerprint:
            consumption.authorization.integrity.fingerprint,
          probe_id: consumption.probe_id,
        });
      },
      on_shape_terminal(shape) {
        journal.append_shape(shape);
      },
    }),
  );
  const summary = journal.finalize(result);
  const validated =
    validateOperationalReentryProviderCompatibilityProbeArtifactsV01({
      repository_root: artifactRepository,
      run_root: journal.run_root,
    });
  assert.deepEqual(validated, summary);
  assert.match(
    summary.relative_run_root,
    /^\.augnes-lab\/operational-reentry-provider-probes\/[^/]+\/issue-[1-9][0-9]*$/u,
  );
  assert.equal(summary.outcome, "accepted_all_shapes");
  assert.equal(summary.authorization_consumed, true);
  assert.equal(summary.product_database_writes, 0);
  assert.equal(summary.core_writes, 0);
  const stored = readTreeV01(journal.run_root);
  for (const forbidden of [
    "test-credential-never-persisted",
    "Authorization",
    '"headers"',
    '"request_body"',
    "raw provider message",
    "/Users/",
    "/home/",
    '"model_input"',
    '"e1_evaluation"',
    '"pairwise_relations"',
  ]) {
    assert.equal(stored.includes(forbidden), false, forbidden);
  }
  assert.equal(
    readdirSync(path.join(journal.run_root, "shapes")).length,
    4,
  );
  assert.throws(
    () =>
      beginOperationalReentryProviderCompatibilityProbeAttemptV01({
        repository_root: artifactRepository,
        prepared,
      }),
    /operational_reentry_probe_authorization_collision_refused/,
  );
  assert.throws(
    () =>
      journal.consume_authorization({
        authorization_fingerprint: authorization.integrity.fingerprint,
        probe_id: prepared.manifest.probe_id,
      }),
    /operational_reentry_probe_authorization_reuse_refused/,
  );
  for (const relative_run_root of [
    ".augnes-lab/operational-reentry-matched-cohorts/other/issue-185",
    ".augnes-lab/operational-reentry-provider-probes/replacement/issue-999",
    ".augnes-lab/operational-reentry-provider-probes/other/issue-185",
  ]) {
    assert.throws(
      () =>
        assertOperationalReentryProviderCompatibilityProbeArtifactRootAvailableV01(
          { repository_root: artifactRepository, relative_run_root },
        ),
      /operational_reentry_probe_historical_or_replacement_root_refused/,
    );
  }
  for (const payload of [
    { request_body: "forbidden" },
    { headers: { Authorization: "Bearer forbidden" } },
    { private_path: "/Users/private/value" },
    { credential: "sk-1234567890" },
    { core_records: [] },
    { policies: [] },
  ]) {
    assert.throws(
      () =>
        assertOperationalReentryProviderCompatibilityProbeArtifactPayloadSafeV01(
          payload,
        ),
      /operational_reentry_probe_artifact_/,
    );
  }
}

function verifyStaticNoBehaviorAndCliBoundaryV01(): void {
  const core = readFileSync(
    path.join(
      process.cwd(),
      "lib/vnext/operational-reentry-provider-compatibility-probe.ts",
    ),
    "utf8",
  );
  const types = readFileSync(
    path.join(
      process.cwd(),
      "types/vnext/operational-reentry-provider-compatibility-probe.ts",
    ),
    "utf8",
  );
  const cli = readFileSync(
    path.join(
      process.cwd(),
      "scripts/operational-reentry-provider-compatibility-probe.ts",
    ),
    "utf8",
  );
  assert.equal(core.includes("operational-reentry-perturbation"), false);
  assert.equal(core.includes("buildOperationalReentryEvaluation"), false);
  assert.equal(core.includes("deriveOperationalReentryMatchedCohortPairwise"), false);
  assert.equal(core.includes("fetch("), false);
  assert.equal(core.includes("process.env"), false);
  assert.equal(types.includes("OperationalReentryEvaluationV01"), false);
  assert.equal(types.includes("PairwiseRelationV01"), false);
  assert.ok(cli.includes("--confirm-future-live-compatibility-probe"));
  assert.ok(cli.includes("--authorization-file"));
  assert.ok(cli.includes("exact_merged_source_head"));
  assert.ok(cli.includes("dirty_or_mismatched_head"));
  assert.equal(cli.includes("previous_response_id"), false);
  assert.equal(cli.includes("retry" + "("), false);
  assert.equal(cli.includes("buildAuthorization"), false);
}

async function runTransportScenarioV01(
  admission: ModelGatewayInteractiveAdmissionV01,
  label: string,
  input: {
    transport: (
      request: OpenAIResponsesTransportRequestV01,
      index: number,
      modelInput: OperationalReentryMatchedCohortModelInputV01,
    ) => Promise<ModelTransportResponse>;
  },
): Promise<{
  result: OperationalReentryProviderCompatibilityProbeExecutionResultV01;
  transport_calls: number;
}> {
  let prepared: ReturnType<
    typeof buildOperationalReentryProviderCompatibilityProbeV01
  >;
  let transportCalls = 0;
  const adapter = adapterV01(async (request) => {
    const index = transportCalls++;
    return input.transport(
      request,
      index,
      prepared.plan.entries[index]!.model_input,
    );
  });
  const route = await routeV01(adapter);
  const authorization = authorizationV01(admission, route, label);
  prepared = buildOperationalReentryProviderCompatibilityProbeV01({
    authorization,
    admission,
    route,
    evaluated_at: evaluatedAt,
  });
  const result = await runOperationalReentryProviderCompatibilityProbeV01(
    { authorization, admission, route, evaluated_at: evaluatedAt },
    dependenciesV01(adapter),
  );
  return { result, transport_calls: transportCalls };
}

async function runSourceDriftScenarioV01(
  admission: ModelGatewayInteractiveAdmissionV01,
): Promise<OperationalReentryProviderCompatibilityProbeExecutionResultV01> {
  let prepared: ReturnType<
    typeof buildOperationalReentryProviderCompatibilityProbeV01
  >;
  let transportCalls = 0;
  const adapter = adapterV01(async () => {
    const input = prepared.plan.entries[transportCalls++]!.model_input;
    return acceptedResponseV01(outputForV01(input));
  });
  const route = await routeV01(adapter);
  const authorization = authorizationV01(admission, route, "source-drift");
  prepared = buildOperationalReentryProviderCompatibilityProbeV01({
    authorization,
    admission,
    route,
    evaluated_at: evaluatedAt,
  });
  let sourceChecks = 0;
  const result = await runOperationalReentryProviderCompatibilityProbeV01(
    { authorization, admission, route, evaluated_at: evaluatedAt },
    dependenciesV01(adapter, {
      assert_source_unchanged() {
        if (sourceChecks++ > 0) throw new Error("synthetic source drift");
      },
    }),
  );
  assert.equal(transportCalls, 1);
  return result;
}

function dependenciesV01(
  adapter: ReturnType<typeof createOpenAIResponsesAdapterV01>,
  overrides: Partial<
    Parameters<
      typeof runOperationalReentryProviderCompatibilityProbeV01
    >[1]
  > = {},
): Parameters<
  typeof runOperationalReentryProviderCompatibilityProbeV01
>[1] {
  return {
    gateway_dependencies: {
      adapter,
      open_database: () => new Database(databasePath),
      read_root_availability: async () => "available" as const,
      now: () => new Date(evaluatedAt),
    },
    assert_source_unchanged() {},
    consume_authorization() {},
    ...overrides,
  };
}

function adapterV01(
  transport: (
    request: OpenAIResponsesTransportRequestV01,
  ) => Promise<ModelTransportResponse>,
) {
  return createOpenAIResponsesAdapterV01({
    environment: {
      OPENAI_API_KEY: "test-credential-never-persisted",
      OPENAI_MODEL: "ambient-model-must-not-change-probe-route",
    },
    transport: async (request) => {
      fakeProviderCalls += 1;
      return transport(request);
    },
  });
}

async function routeV01(
  adapter: ReturnType<typeof createOpenAIResponsesAdapterV01>,
): Promise<OperationalReentryMatchedCohortRouteV01> {
  const route =
    await prepareOperationalReentryMatchedCohortModelGatewayRouteV01({
      adapter,
    });
  assert.ok(route);
  assert.equal(
    route.model_ref.external_id,
    OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02,
  );
  return route;
}

function authorizationV01(
  admission: ModelGatewayInteractiveAdmissionV01,
  route: OperationalReentryMatchedCohortRouteV01,
  label: string,
  overrides: Partial<
    OperationalReentryProviderCompatibilityProbeAuthorizationV01
  > = {},
): OperationalReentryProviderCompatibilityProbeAuthorizationV01 {
  const expectations =
    buildOperationalReentryProviderCompatibilityProbeAuthorizationExpectationsV01(
      { admission, route, evaluated_at: evaluatedAt },
    );
  const authorization = resealAuthorizationV01({
    authorization_version:
      OPERATIONAL_REENTRY_PROVIDER_COMPATIBILITY_PROBE_AUTHORIZATION_VERSION_V01,
    authorization_id: `probe-authorization-${label}-${authorizationSequence++}`,
    authorization_kind: "one_bounded_provider_compatibility_probe",
    request_family_kind: "compatibility_probe",
    future_live_issue_number: 999,
    exact_merged_source_head: sourceHead,
    planned_shapes: 4,
    canonical_order: ["A", "B", "C", "D"],
    maximum_provider_calls: 4,
    maximum_parallel_calls: 1,
    retries: 0,
    replacement_calls: 0,
    fresh_stateless_request_per_shape: true,
    conversation_reuse: false,
    thread_reuse: false,
    previous_response_reuse: false,
    stop_after_first_non_success_terminal_result: true,
    second_probe_authorized: false,
    replacement_cohort_authorized: false,
    stage_7_authorized: false,
    maximum_total_cost_nano_usd: 250_000_000,
    case_fingerprint: expectations.case_fingerprint,
    route_fingerprint: expectations.route_fingerprint,
    provider_contract_fingerprint:
      expectations.provider_contract_fingerprint,
    pricing_authority_fingerprint:
      expectations.pricing_authority_fingerprint,
    issued_at: "2026-08-18T07:00:00.000Z",
    expires_at: "2026-08-20T00:00:00.000Z",
    ...overrides,
  });
  buildOperationalReentryProviderCompatibilityProbeV01({
    authorization,
    admission,
    route,
    evaluated_at: evaluatedAt,
  });
  return authorization;
}

function resealAuthorizationV01(
  input: Record<string, unknown>,
): OperationalReentryProviderCompatibilityProbeAuthorizationV01 {
  const { integrity: _integrity, ...payload } = input;
  return {
    ...payload,
    integrity: {
      algorithm: "sha256",
      canonicalization: "augnes-json-c14n-v0_1",
      fingerprint_scope: "authorization_without_integrity_fingerprint",
      fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(payload),
      ),
    },
  } as unknown as OperationalReentryProviderCompatibilityProbeAuthorizationV01;
}

function acceptedResponseV01(
  output: OperationalReentryMatchedCohortModelOutputV01,
) {
  return {
    ok: true,
    status: 200,
    async json() {
      return {
        status: "completed",
        output_text: JSON.stringify(output),
        usage: {
          input_tokens: 64,
          input_tokens_details: { cached_tokens: 0 },
          output_tokens: 24,
          total_tokens: 88,
        },
      };
    },
  };
}

function rejectionResponseV01(status: number) {
  return {
    ok: false,
    status,
    headers: {
      get(name: string) {
        if (name === "x-request-id") return `req_test_${status}`;
        return null;
      },
    },
    async json() {
      return {
        error: {
          type: "synthetic_error",
          code: `synthetic_${status}`,
          param: "text.format.schema",
          message: "raw provider message must not be retained",
          arbitrary: { must_not_persist: true },
        },
      };
    },
  };
}

function outputForV01(
  input: OperationalReentryMatchedCohortModelInputV01,
): OperationalReentryMatchedCohortModelOutputV01 {
  const stale = input.stale_relation !== null;
  const targetPresent = input.target_context_token !== null;
  if (!targetPresent && input.context_material.length > 0) {
    return {
      result_token: "result_review_blocked",
      referenced_context_tokens: [...input.allowed_output.referenced_context_tokens],
      required_check_dispositions: ["verify_portable_output:blocked"],
      operation_action_class_tokens: ["no_external_action"],
      blocker_warning_gap_tokens: ["gap_support_unknown"],
      result_limitation_tokens: [
        "limitation_non_authoritative",
        "limitation_target_not_available",
      ],
      target_disposition: "not_available",
      abstention: true,
    };
  }
  if (stale) {
    return {
      result_token: "result_review_ready",
      referenced_context_tokens: input.allowed_output.referenced_context_tokens.filter(
        (token) => token !== input.target_context_token,
      ),
      required_check_dispositions: ["verify_portable_output:passed"],
      operation_action_class_tokens: ["bounded_result_review"],
      blocker_warning_gap_tokens: ["gap_decision_pending"],
      result_limitation_tokens: ["limitation_non_authoritative"],
      target_disposition: "withheld_stale",
      abstention: false,
    };
  }
  return {
    result_token: "result_review_ready",
    referenced_context_tokens: [...input.allowed_output.referenced_context_tokens],
    required_check_dispositions: ["verify_portable_output:passed"],
    operation_action_class_tokens: targetPresent
      ? ["bounded_result_review", "target_linked_verification_preparation"]
      : ["bounded_result_review"],
    blocker_warning_gap_tokens: targetPresent
      ? ["gap_decision_pending", "gap_support_unknown"]
      : [],
    result_limitation_tokens: targetPresent
      ? ["limitation_non_authoritative"]
      : ["limitation_non_authoritative", "limitation_target_not_available"],
    target_disposition: targetPresent ? "applied_to_structure" : "not_available",
    abstention: false,
  };
}

function initializeDatabaseV01(): void {
  const database = new Database(databasePath);
  database.exec(
    readFileSync(path.join(process.cwd(), "lib/db/schema.sql"), "utf8"),
  );
  database.close();
}

function registerProjectV01(): ModelGatewayInteractiveAdmissionV01 {
  const database = new Database(databasePath);
  const workspace = getOrCreateDefaultWorkspaceIdentityV01(database, {
    create_uuid: () => "11111111-1111-4111-8111-111111111111",
    now: () => "2026-08-18T07:55:00.000Z",
  });
  const localRoot = normalizeLocalProjectRootRefV01(projectRoot, {
    base_path: path.parse(projectRoot).root,
  });
  const project = getOrCreateCanonicalProjectForLocalRootV01(
    database,
    {
      workspace_id: workspace.workspace_id,
      local_root: localRoot,
      display_name: "e2p1-test-project",
    },
    {
      create_uuid: () => "22222222-2222-4222-8222-222222222222",
      now: () => "2026-08-18T07:56:00.000Z",
    },
  );
  const active = selectActiveProjectV01(database, {
    workspace_id: workspace.workspace_id,
    project_id: project.project.project_id,
    now: "2026-08-18T07:57:00.000Z",
    expected_project_id: null,
    expected_revision: null,
  });
  database.close();
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
}

function readTreeV01(directory: string): string {
  return readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name, "en"))
    .map((entry) => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory() ? readTreeV01(target) : readFileSync(target, "utf8");
    })
    .join("\n");
}
