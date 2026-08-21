import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import { operationalReentryMatchedCohortCaseFixtureV02 } from "@/fixtures/vnext/research/operational-reentry-matched-cohort-v0-2";
import {
  buildOperationalReentryMatchedCohortModelInputV03,
} from "@/lib/vnext/operational-reentry-matched-cohort-v0-3";
import {
  ACGC_E2_V04_CANONICAL_ORDER,
  buildOperationalReentryMatchedCohortGoldenWireOutputV04,
  buildOperationalReentryMatchedCohortInvocationV04,
  buildOperationalReentryMatchedCohortRepresentativeInvocationsV04,
} from "@/lib/vnext/operational-reentry-matched-cohort-v0-4";
import {
  buildOperationalReentryMatchedCohortModelInputV02,
  evaluateOperationalReentryMatchedCohortArmV02,
} from "@/lib/vnext/operational-reentry-matched-cohort-v0-2";
import {
  buildOperationalReentryMatchedCohortProviderContractV03,
  operationalReentryMatchedCohortResponseSchemaV04 as operationalReentryMatchedCohortResponseSchemaHistoricalV04,
  OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03,
  OPERATIONAL_REENTRY_MATCHED_COHORT_WIRE_BUDGET_PROOF_V03,
} from "@/lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-v0-3-codec";
import {
  buildOperationalReentryMatchedCohortProviderContractV04,
  buildOperationalReentryMatchedCohortSystemPromptV04,
  createOperationalReentryMatchedCohortLocalInvocationIdentityFingerprintV04,
  createOperationalReentryMatchedCohortOutputParserV04,
  createOperationalReentryMatchedCohortProviderMaterialFingerprintV04,
  operationalReentryMatchedCohortResponseSchemaV04,
  parseOperationalReentryMatchedCohortOutputV04,
  projectOperationalReentryMatchedCohortProviderMaterialV04,
  validateOperationalReentryMatchedCohortInvocationV04,
  OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V04,
  OPERATIONAL_REENTRY_MATCHED_COHORT_PARSER_CLOSURE_CARDINALITY_V04,
  OPERATIONAL_REENTRY_MATCHED_COHORT_WIRE_BUDGET_PROOF_V04,
} from "@/lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-v0-4-codec";
import {
  createOpenAIResponsesAdapterV01,
  OPENAI_RESPONSES_ENDPOINT_V01,
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02,
  projectOpenAIResponsesOperationalReentryMatchedCohortRequestV03,
  projectOpenAIResponsesOperationalReentryMatchedCohortRequestV04,
  type OpenAIResponsesTransportRequestV01,
} from "@/lib/vnext/model-gateway/openai/responses-adapter";
import {
  invokeOperationalReentryMatchedCohortModelGatewayV04,
  prepareOperationalReentryMatchedCohortModelGatewayRouteV03,
  prepareOperationalReentryMatchedCohortModelGatewayRouteV04,
  validateOperationalReentryMatchedCohortModelInvocationEnvelopeV04,
  type ModelGatewayInteractiveAdmissionV01,
} from "@/lib/vnext/model-gateway/model-gateway";
import {
  MODEL_INVOCATION_ENVELOPE_VERSION_V01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01,
} from "@/lib/vnext/model-gateway/contracts";
import {
  buildModelGatewayCostAuthorityV01,
  buildModelGatewayCostBudgetV01,
} from "@/lib/vnext/model-gateway/cost-authority";
import { validateModelInvocationReceiptV02 } from "@/lib/vnext/model-gateway/model-invocation-receipt";
import {
  createDeterministicModelClientRequestIdV01,
  createDeterministicModelProviderRequestTraceV01,
} from "@/lib/vnext/model-gateway/provider-rejection-observation";
import { validateOpenAIStrictSchemaSupportedSubsetV01 } from "@/lib/vnext/model-gateway/openai/strict-schema-supported-subset";
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
import {
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V05,
  OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V04,
  OPERATIONAL_REENTRY_MATCHED_COHORT_EMPTY_SELECTION_KEY_V03,
  OPERATIONAL_REENTRY_MATCHED_COHORT_PARSER_VERSION_V03,
  OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V03,
  OPERATIONAL_REENTRY_MATCHED_COHORT_RESPONSE_SCHEMA_VERSION_V04,
} from "@/types/vnext/operational-reentry-matched-cohort-v0-3";
import {
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V06,
  OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V05,
  OPERATIONAL_REENTRY_MATCHED_COHORT_PARSER_VERSION_V04,
  OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V04,
  OPERATIONAL_REENTRY_MATCHED_COHORT_VERSION_V04,
  type OperationalReentryMatchedCohortInvocationV04,
  type OperationalReentryMatchedCohortProviderMaterialV04,
  type OperationalReentryMatchedCohortWireOutputV04,
} from "@/types/vnext/operational-reentry-matched-cohort-v0-4";

const repositoryRoot = process.cwd();
const originalFetch = globalThis.fetch;
let fetchCalls = 0;

void main().catch((error) => {
  console.error("operational_reentry_matched_cohort_v04_test_failed");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

async function main(): Promise<void> {
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    throw new Error("v0.4 contract tests must not call fetch");
  }) as typeof fetch;
  try {
    const historical = await testHistoricalV03Immutability();
    const closureCardinality = testParserClosureV04();
    const parity = testIdentitySeparationAndTreatmentSensitivityV04();
    const gateway = await testSharedGatewayCorrelationBoundaryV04();
    assert.equal(fetchCalls, 0);
    console.log(JSON.stringify({
      status: "operational_reentry_matched_cohort_v04_test_passed",
      purpose: OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01,
      input_contract_version: OPERATIONAL_REENTRY_MATCHED_COHORT_VERSION_V04,
      codec_version: OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V05,
      provider_contract_version:
        OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V04,
      response_schema_version:
        OPERATIONAL_REENTRY_MATCHED_COHORT_RESPONSE_SCHEMA_VERSION_V04,
      parser_version: OPERATIONAL_REENTRY_MATCHED_COHORT_PARSER_VERSION_V04,
      adapter_version:
        OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V06,
      provider_contract_fingerprint:
        parity.provider_contract_fingerprint,
      route_fingerprint: gateway.route_fingerprint,
      adapter_request_route_fingerprint:
        parity.adapter_request_route_fingerprint,
      parser_closure_cardinality: closureCardinality,
      response_bytes:
        OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V04.responseBytes,
      max_output_tokens:
        OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V04.maxOutputTokens,
      final_request_bytes:
        OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V04.finalRequestBytes,
      distinct_local_invocations_provider_body_equal: true,
      local_invocation_identity_provider_visible: false,
      opaque_transport_correlation: true,
      treatment_sensitivity_cases: parity.treatment_sensitivity_cases,
      historical_v03_route_fingerprint: historical.route_fingerprint,
      historical_v03_provider_contract_fingerprint:
        historical.provider_contract_fingerprint,
      historical_v03_adapter_request_route_fingerprint:
        historical.adapter_request_route_fingerprint,
      fake_transport_calls: gateway.fake_transport_calls,
      real_provider_calls: 0,
      successor_live_authorizations_created: 0,
      successor_live_authorizations_consumed: 0,
      compatibility_result: "none",
      behavioral_cohort_authorized: false,
      policy_authorized: false,
      stage_7_authorized: false,
    }));
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function testHistoricalV03Immutability() {
  const adapter = testAdapter(async () => {
    throw new Error("historical route preparation must not invoke transport");
  });
  const route = await prepareOperationalReentryMatchedCohortModelGatewayRouteV03({
    adapter,
  });
  assert.ok(route);
  const input = buildOperationalReentryMatchedCohortModelInputV03({
    arm: "A",
    call_slot_id: "historical-v03-preservation",
    block: 0,
  });
  const request =
    projectOpenAIResponsesOperationalReentryMatchedCohortRequestV03(input);
  const contract = buildOperationalReentryMatchedCohortProviderContractV03();
  assert.equal(
    route.integrity_fingerprint,
    "sha256:4d286f56405ff66236a19d1e0f4529510faa8c53a80e6bba4ecac9c4845930e0",
  );
  assert.equal(
    contract.integrity.fingerprint,
    "sha256:682905683f083ee67002dc4cf2577ec3ae4302e90fc85e27f43019b8b7978bbb",
  );
  assert.equal(
    request.adapter_request_route_fingerprint,
    "sha256:182e0be9c2b4a53baca61c01d9b83f67fbd6855d1e3b8c9cbd182abeff4831e9",
  );
  assert.equal(
    request.adapter_implementation_version,
    OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V05,
  );
  assert.equal(
    request.provider_contract_version,
    OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V03,
  );
  assert.equal(
    contract.input_codec_version,
    OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V04,
  );
  assert.equal(contract.parser_version, OPERATIONAL_REENTRY_MATCHED_COHORT_PARSER_VERSION_V03);
  return {
    route_fingerprint: route.integrity_fingerprint,
    provider_contract_fingerprint: contract.integrity.fingerprint,
    adapter_request_route_fingerprint: request.adapter_request_route_fingerprint,
  };
}

function testParserClosureV04(): number {
  const representatives =
    buildOperationalReentryMatchedCohortRepresentativeInvocationsV04();
  assert.deepEqual(
    representatives.map(({ arm }) => arm),
    ACGC_E2_V04_CANONICAL_ORDER,
  );
  let combinations = 0;
  let maximumObservedWireBytes = 0;
  for (const { arm, invocation } of representatives) {
    assert.doesNotThrow(() =>
      validateOperationalReentryMatchedCohortInvocationV04(invocation),
    );
    const material = invocation.provider_material;
    const parseOutput = createOperationalReentryMatchedCohortOutputParserV04(material);
    const schema = operationalReentryMatchedCohortResponseSchemaV04(material);
    assert.doesNotThrow(() => validateOpenAIStrictSchemaSupportedSubsetV01(schema));
    const historicalSchema =
      operationalReentryMatchedCohortResponseSchemaHistoricalV04(
        buildOperationalReentryMatchedCohortModelInputV03({
          arm,
          call_slot_id: `v04-schema-parity-${arm.toLowerCase()}`,
          block: 0,
        }),
      );
    assert.equal(
      canonicalizeProtocolValueV01(schema),
      canonicalizeProtocolValueV01(historicalSchema),
    );
    const referenceKeys =
      material.allowed_output.referenced_continuation_tokens.length === 0
        ? [OPERATIONAL_REENTRY_MATCHED_COHORT_EMPTY_SELECTION_KEY_V03]
        : [...material.allowed_output.referenced_continuation_tokens];
    const operationKeys = [...material.allowed_output.operation_action_class_tokens];
    const limitationKeys = [...material.allowed_output.result_limitation_tokens];
    const allKeys = [...referenceKeys, ...operationKeys, ...limitationKeys];
    for (const resultStatus of material.allowed_output.result_statuses) {
      for (const requiredCheckDisposition of material.allowed_output.required_check_dispositions) {
        for (const abstention of [false, true]) {
          for (let mask = 0; mask < 2 ** allKeys.length; mask += 1) {
            let offset = 0;
            const wire: OperationalReentryMatchedCohortWireOutputV04 = {
              result_status: resultStatus,
              required_check_disposition: requiredCheckDisposition,
              referenced_continuation_selections: booleansForMask(
                referenceKeys,
                mask,
                offset,
              ),
              operation_action_class_selections: booleansForMask(
                operationKeys,
                mask,
                (offset += referenceKeys.length),
              ),
              result_limitation_selections: booleansForMask(
                limitationKeys,
                mask,
                (offset += operationKeys.length),
              ),
              abstention,
            };
            assert.doesNotThrow(() => parseOutput(JSON.stringify(wire)));
            maximumObservedWireBytes = Math.max(
              maximumObservedWireBytes,
              Buffer.byteLength(canonicalizeProtocolValueV01(wire), "utf8"),
            );
            combinations += 1;
          }
        }
      }
    }

    const behaviorallyWrong = parseOperationalReentryMatchedCohortOutputV04(
      JSON.stringify({
        ...buildOperationalReentryMatchedCohortGoldenWireOutputV04(arm),
        required_check_disposition: "failed",
      }),
      material,
    );
    const historicalInput = buildOperationalReentryMatchedCohortModelInputV02({
      arm,
      call_slot_id: invocation.local_invocation_context.call_slot_id,
      block: invocation.local_invocation_context.repeat_block,
    });
    const evaluation = evaluateOperationalReentryMatchedCohortArmV02({
      arm,
      call_slot_id: invocation.local_invocation_context.call_slot_id,
      model_input: historicalInput,
      normalized_output: behaviorallyWrong,
    });
    assert.equal(evaluation.common_compliance, "invalid");
  }
  assert.equal(
    combinations,
    OPERATIONAL_REENTRY_MATCHED_COHORT_PARSER_CLOSURE_CARDINALITY_V04,
  );
  assert.equal(
    maximumObservedWireBytes,
    OPERATIONAL_REENTRY_MATCHED_COHORT_WIRE_BUDGET_PROOF_V04.maximum_canonical_wire_response_bytes,
  );
  assert.deepEqual(
    OPERATIONAL_REENTRY_MATCHED_COHORT_WIRE_BUDGET_PROOF_V04,
    OPERATIONAL_REENTRY_MATCHED_COHORT_WIRE_BUDGET_PROOF_V03,
  );
  assert.equal(
    OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V04.finalRequestBytes,
    OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03.finalRequestBytes,
  );
  return combinations;
}

function testIdentitySeparationAndTreatmentSensitivityV04() {
  const left = buildOperationalReentryMatchedCohortInvocationV04({
    arm: "B",
    cohort_ref: "cohort-local-left",
    call_slot_id: "call-local-left",
    block: 0,
  });
  const right = buildOperationalReentryMatchedCohortInvocationV04({
    arm: "B",
    cohort_ref: "cohort-local-right",
    call_slot_id: "call-local-right",
    block: 3,
  });
  assert.deepEqual(left.provider_material, right.provider_material);
  assert.notEqual(
    createOperationalReentryMatchedCohortLocalInvocationIdentityFingerprintV04(left),
    createOperationalReentryMatchedCohortLocalInvocationIdentityFingerprintV04(right),
  );
  assert.equal(
    createOperationalReentryMatchedCohortProviderMaterialFingerprintV04(
      left.provider_material,
    ),
    createOperationalReentryMatchedCohortProviderMaterialFingerprintV04(
      right.provider_material,
    ),
  );
  const leftRequest =
    projectOpenAIResponsesOperationalReentryMatchedCohortRequestV04(left);
  const rightRequest =
    projectOpenAIResponsesOperationalReentryMatchedCohortRequestV04(right);
  assert.equal(leftRequest.request_body, rightRequest.request_body);
  assert.equal(leftRequest.request_fingerprint, rightRequest.request_fingerprint);
  assert.equal(leftRequest.schema_fingerprint, rightRequest.schema_fingerprint);
  assert.equal(
    leftRequest.adapter_request_route_fingerprint,
    rightRequest.adapter_request_route_fingerprint,
  );
  assert.equal(leftRequest.model, rightRequest.model);
  const body = JSON.parse(leftRequest.request_body) as {
    model: string;
    input: Array<{ role: string; content: Array<{ type: string; text: string }> }>;
    text: { format: { name: string; schema: unknown; strict: boolean } };
    max_output_tokens: number;
    store: boolean;
  };
  assert.equal(body.model, OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02);
  assert.equal(body.max_output_tokens, OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V04.maxOutputTokens);
  assert.equal(body.store, false);
  assert.equal(body.text.format.name, "operational_reentry_matched_cohort_v04");
  assert.equal(body.text.format.strict, true);
  assert.equal(
    canonicalizeProtocolValueV01(body.text.format.schema),
    canonicalizeProtocolValueV01(
      operationalReentryMatchedCohortResponseSchemaV04(left.provider_material),
    ),
  );
  assert.equal(
    body.input[0]!.content[0]!.text,
    buildOperationalReentryMatchedCohortSystemPromptV04(),
  );
  assert.deepEqual(
    JSON.parse(body.input[1]!.content[0]!.text),
    projectOperationalReentryMatchedCohortProviderMaterialV04(left),
  );
  for (const forbidden of [
    left.local_invocation_context.cohort_ref,
    left.local_invocation_context.call_slot_id,
    right.local_invocation_context.cohort_ref,
    right.local_invocation_context.call_slot_id,
    "local_invocation_context",
    "cohort_ref",
    "call_slot_id",
    "repeat_block",
    "provider_request_trace_id",
    "client_request_id",
    "arm",
    '"G"',
    "gate_notice",
    "experiment_label",
    "comparison_label",
    "outcome_label",
  ]) {
    assert.equal(leftRequest.request_body.includes(forbidden), false, forbidden);
    assert.equal(buildOperationalReentryMatchedCohortSystemPromptV04().includes(forbidden), false, forbidden);
    assert.equal(JSON.stringify(body.text.format.schema).includes(forbidden), false, forbidden);
  }
  const extraIdentity = structuredClone(left) as unknown as Record<string, unknown>;
  (extraIdentity.provider_material as Record<string, unknown>).call_slot_id = "forbidden";
  assert.throws(() => validateOperationalReentryMatchedCohortInvocationV04(extraIdentity));
  assert.throws(() =>
    buildOperationalReentryMatchedCohortInvocationV04({
      arm: "G" as never,
      cohort_ref: "no-g-shape",
      call_slot_id: "no-g-shape",
      block: 0,
    }),
  );

  const treatmentSensitivityCases = [
    ["task", (material: Record<string, any>) => { material.task.goal += "-changed"; }],
    ["common_evidence", (material: Record<string, any>) => { material.common_task_evidence.observed_result_status = "changed"; }],
    ["non_target_continuation", (material: Record<string, any>) => { material.continuation_context[0].material_token += "-changed"; }],
    ["allowed_output", (material: Record<string, any>) => { material.allowed_output.result_statuses = [...material.allowed_output.result_statuses].reverse(); }],
    ["authority_notice", (material: Record<string, any>) => { material.authority_notice.execution_authority = "changed"; }],
  ] as const;
  for (const [name, mutate] of treatmentSensitivityCases) {
    assertBodyMutationChangesFingerprint(leftRequest.request_body, mutate);
    const invalid = structuredClone(left) as unknown as Record<string, any>;
    mutate(invalid.provider_material);
    assert.throws(() =>
      projectOpenAIResponsesOperationalReentryMatchedCohortRequestV04(
        invalid as unknown as OperationalReentryMatchedCohortInvocationV04,
      ),
      name,
    );
  }
  const validArmRequests = Object.fromEntries(
    (["A", "B", "C", "D"] as const).map((arm) => [
      arm,
      projectOpenAIResponsesOperationalReentryMatchedCohortRequestV04(
        buildOperationalReentryMatchedCohortInvocationV04({
          arm,
          cohort_ref: "treatment-arm-proof",
          call_slot_id: `treatment-${arm.toLowerCase()}`,
          block: 0,
        }),
      ),
    ]),
  );
  assert.notEqual(validArmRequests.A.request_fingerprint, validArmRequests.B.request_fingerprint);
  assert.notEqual(validArmRequests.B.request_fingerprint, validArmRequests.C.request_fingerprint);
  assert.notEqual(validArmRequests.B.request_fingerprint, validArmRequests.D.request_fingerprint);
  assertBodyMutationChangesFingerprint(leftRequest.request_body, (material) => {
    material.continuation_context.push({
      context_token: "target_presence_changed",
      material_token: "target_presence_changed",
      role: "target",
    });
  });
  assertBodyMutationChangesFingerprint(leftRequest.request_body, (material) => {
    material.stale_relation = {
      relation_token: "stale_relation_changed",
      target_context_token: "target_presence_changed",
    };
  });

  const contract = buildOperationalReentryMatchedCohortProviderContractV04();
  assert.equal(contract.prepared_without_provider_egress, true);
  assert.equal(contract.local_invocation_identity_provider_visible, false);
  assert.equal(contract.transport_correlation_experimental_material, false);
  assert.equal(contract.parser_closure_cardinality, 172_032);
  assert.equal(contract.compatibility_result, "none");
  assert.equal(contract.successor_live_authorizations_created, 0);
  assert.equal(contract.successor_live_authorizations_consumed, 0);
  assert.equal(contract.real_provider_calls, 0);
  assert.equal(contract.successor_live_probe_authorized, false);
  assert.equal(contract.behavioral_cohort_authorized, false);
  assert.equal(contract.replication_authorized, false);
  assert.equal(contract.policy_authorized, false);
  assert.equal(contract.stage_7_authorized, false);
  return {
    provider_contract_fingerprint: contract.integrity.fingerprint,
    adapter_request_route_fingerprint:
      leftRequest.adapter_request_route_fingerprint,
    treatment_sensitivity_cases: 7,
  };
}

async function testSharedGatewayCorrelationBoundaryV04() {
  const root = mkdtempSync(path.join(tmpdir(), "augnes-e2r2p6b-v04-"));
  const projectRoot = path.join(root, "project");
  const databasePath = path.join(root, "gateway.db");
  mkdirSync(projectRoot, { recursive: true });
  const database = new Database(databasePath);
  database.exec(readFileSync(path.join(repositoryRoot, "lib/db/schema.sql"), "utf8"));
  database.close();
  try {
    const admission = registerGatewayProjectV04(databasePath, projectRoot);
    const requests: OpenAIResponsesTransportRequestV01[] = [];
    const adapter = testAdapter(async (request) => {
      requests.push(request);
      return completedResponseV04(buildOperationalReentryMatchedCohortGoldenWireOutputV04("B"));
    });
    const route = await prepareOperationalReentryMatchedCohortModelGatewayRouteV04({
      adapter,
    });
    assert.ok(route);
    const invocations = [
      buildOperationalReentryMatchedCohortInvocationV04({
        arm: "B",
        cohort_ref: "gateway-local-one",
        call_slot_id: "gateway-slot-one",
        block: 0,
      }),
      buildOperationalReentryMatchedCohortInvocationV04({
        arm: "B",
        cohort_ref: "gateway-local-two",
        call_slot_id: "gateway-slot-two",
        block: 3,
      }),
    ];
    const traces = invocations.map((invocation, index) =>
      createDeterministicModelProviderRequestTraceV01({
        request_family_kind: "compatibility_probe",
        request_family_fingerprint: createProtocolSha256V01(
          canonicalizeProtocolValueV01({
            index,
            local_invocation_context: invocation.local_invocation_context,
          }),
        ),
      }),
    );
    assert.notEqual(traces[0], traces[1]);
    const expectedClientIds = traces.map((trace, index) =>
      createDeterministicModelClientRequestIdV01({
        purpose: OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01,
        provider_request_trace_id: trace,
        call_slot_id: invocations[index]!.local_invocation_context.call_slot_id,
        model: OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02,
      }),
    );
    assert.equal(new Set(expectedClientIds).size, 2);
    for (const id of expectedClientIds) {
      assert.match(id, /^acgc_req_[0-9a-f]{40}$/u);
    }
    for (const correlation of [...traces, ...expectedClientIds]) {
      for (const semanticFragment of [
        "gateway-local",
        "gateway-slot",
        "arm",
        "block",
        "gate",
        "stale",
        "target",
        "comparison",
        "result",
      ]) {
        assert.equal(correlation.includes(semanticFragment), false);
      }
    }
    const receipts = [];
    for (let index = 0; index < invocations.length; index += 1) {
      const envelope = envelopeV04(
        admission,
        route,
        invocations[index]!,
        traces[index]!,
        index,
      );
      assert.doesNotThrow(() =>
        validateOperationalReentryMatchedCohortModelInvocationEnvelopeV04(envelope),
      );
      const result = await invokeOperationalReentryMatchedCohortModelGatewayV04(
        envelope,
        {
          adapter,
          expected_operational_reentry_matched_cohort_v04_route: route,
          open_database: () => new Database(databasePath),
          read_root_availability: async () => "available" as const,
          now: () => new Date("2026-08-21T00:01:00.000Z"),
        },
      );
      assert.doesNotThrow(() =>
        validateModelInvocationReceiptV02(result.model_invocation_receipt),
      );
      receipts.push(result.model_invocation_receipt);
    }
    assert.equal(requests.length, 2);
    assert.equal(requests[0]!.url, OPENAI_RESPONSES_ENDPOINT_V01);
    assert.equal(requests[0]!.method, "POST");
    assert.equal(requests[0]!.url, requests[1]!.url);
    assert.equal(requests[0]!.method, requests[1]!.method);
    assert.equal(requests[0]!.body, requests[1]!.body);
    assert.equal(
      requests[0]!.headers["X-Client-Request-Id"],
      expectedClientIds[0],
    );
    assert.equal(
      requests[1]!.headers["X-Client-Request-Id"],
      expectedClientIds[1],
    );
    assert.notEqual(
      requests[0]!.headers["X-Client-Request-Id"],
      requests[1]!.headers["X-Client-Request-Id"],
    );
    for (const value of [...traces, ...expectedClientIds]) {
      assert.equal(requests[0]!.body.includes(value), false);
      assert.equal(requests[1]!.body.includes(value), false);
    }
    assert.notEqual(receipts[0]!.invocation_id, receipts[1]!.invocation_id);
    assert.notEqual(
      receipts[0]!.local_invocation_identity_fingerprint,
      receipts[1]!.local_invocation_identity_fingerprint,
    );
    assert.equal(
      receipts[0]!.local_invocation_identity_fingerprint,
      createOperationalReentryMatchedCohortLocalInvocationIdentityFingerprintV04(
        invocations[0]!,
      ),
    );
    assert.equal(
      receipts[1]!.local_invocation_identity_fingerprint,
      createOperationalReentryMatchedCohortLocalInvocationIdentityFingerprintV04(
        invocations[1]!,
      ),
    );
    assert.equal(receipts[0]!.purpose, OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01);
    assert.equal(receipts[1]!.purpose, OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01);
    return {
      route_fingerprint: route.integrity_fingerprint,
      fake_transport_calls: requests.length,
    };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function assertBodyMutationChangesFingerprint(
  originalBody: string,
  mutate: (material: Record<string, any>) => void,
): void {
  const body = JSON.parse(originalBody) as Record<string, any>;
  const material = JSON.parse(body.input[1].content[0].text) as Record<string, any>;
  mutate(material);
  body.input[1].content[0].text = JSON.stringify(material);
  const changedBody = JSON.stringify(body);
  assert.notEqual(changedBody, originalBody);
  assert.notEqual(
    createProtocolSha256V01(changedBody),
    createProtocolSha256V01(originalBody),
  );
}

function booleansForMask(
  keys: readonly string[],
  mask: number,
  offset: number,
): Record<string, boolean> {
  return Object.fromEntries(
    keys.map((key, index) => [key, (mask & (1 << (offset + index))) !== 0]),
  );
}

function testAdapter(transport: (request: OpenAIResponsesTransportRequestV01) => Promise<any>) {
  return createOpenAIResponsesAdapterV01({
    environment: {
      OPENAI_API_KEY: "test-credential-never-persisted",
      OPENAI_MODEL: "ambient-model-must-not-change-v04",
    },
    transport,
  });
}

function completedResponseV04(output: unknown) {
  return {
    ok: true,
    status: 200,
    headers: { get: (name: string) => name === "x-request-id" ? "req_v04_fake" : null },
    async json() {
      return {
        status: "completed",
        output_text: JSON.stringify(output),
        usage: { input_tokens: 120, output_tokens: 40, total_tokens: 160 },
      };
    },
  };
}

function registerGatewayProjectV04(
  databasePath: string,
  projectRoot: string,
): ModelGatewayInteractiveAdmissionV01 {
  const database = new Database(databasePath);
  try {
    const workspace = getOrCreateDefaultWorkspaceIdentityV01(database, {
      create_uuid: () => "11111111-1111-4111-8111-111111111111",
      now: () => "2026-08-21T00:00:00.000Z",
    });
    const localRoot = normalizeLocalProjectRootRefV01(projectRoot, {
      base_path: path.parse(projectRoot).root,
    });
    const project = getOrCreateCanonicalProjectForLocalRootV01(
      database,
      {
        workspace_id: workspace.workspace_id,
        local_root: localRoot,
        display_name: "e2r2p6b-v04-test-project",
      },
      {
        create_uuid: () => "22222222-2222-4222-8222-222222222222",
        now: () => "2026-08-21T00:00:01.000Z",
      },
    );
    const active = selectActiveProjectV01(database, {
      workspace_id: workspace.workspace_id,
      project_id: project.project.project_id,
      now: "2026-08-21T00:00:02.000Z",
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

function envelopeV04(
  admission: ModelGatewayInteractiveAdmissionV01,
  route: NonNullable<Awaited<ReturnType<typeof prepareOperationalReentryMatchedCohortModelGatewayRouteV04>>>,
  invocation: OperationalReentryMatchedCohortInvocationV04,
  trace: string,
  index: number,
) {
  const evaluatedAt = "2026-08-21T00:01:00.000Z";
  const authority = buildModelGatewayCostAuthorityV01({
    authority_kind: "provider_model_pricing_snapshot",
    workspace_id: admission.workspace_id,
    project_id: admission.project_id,
    purpose: OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01,
    provider_ref: route.provider_ref,
    model_ref: route.model_ref,
    cost_unit: "nano_usd",
    input_rate: { unit: "utf8_byte", cost_per_unit: 400 },
    output_rate: { unit: "token", cost_per_unit: 1_600 },
    pricing_source_version: "synthetic_test_pricing_v04",
    pricing_effective_at: "2026-08-20T00:00:00.000Z",
    pricing_expires_at: "2026-08-22T00:00:00.000Z",
    project_model_policy_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(route),
    ),
  });
  const costBudget = buildModelGatewayCostBudgetV01({
    authority,
    workspace_id: admission.workspace_id,
    project_id: admission.project_id,
    purpose: OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01,
    provider_ref: route.provider_ref,
    model_ref: route.model_ref,
    maximum_input_units:
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V04.finalRequestBytes,
    maximum_output_units:
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V04.maxOutputTokens,
    timeout_ms: OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V04.timeoutMs,
    maximum_permitted_cost: 250_000_000,
    evaluated_at: evaluatedAt,
  });
  return {
    envelope_version: MODEL_INVOCATION_ENVELOPE_VERSION_V01,
    invocation_id: `e2r2p6b-v04-gateway-${index}`,
    provider_request_trace_id: trace,
    workspace_id: admission.workspace_id,
    project_id: admission.project_id,
    purpose: OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01,
    data_classification: "public_safe" as const,
    provenance_refs: [operationalReentryMatchedCohortCaseFixtureV02.integrity.fingerprint],
    privacy: { provider_egress: "allow" as const, retention_class: "none" as const },
    budget: {
      max_input_bytes:
        OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V04.finalRequestBytes,
      max_output_tokens:
        OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V04.maxOutputTokens,
      max_provider_calls: 1 as const,
      cost_budget: costBudget,
    },
    timeout_ms: OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V04.timeoutMs,
    cancellation: { signal: new AbortController().signal },
    execution_mode: "live" as const,
    policy: {
      invocation_origin: "interactive" as const,
      expected_active_project_id: admission.project_id,
      expected_active_selection_revision: admission.expected_active_selection_revision,
    },
    project_root: admission.project_root,
    input: invocation,
  };
}
