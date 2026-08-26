import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { resolveMigratedHistoricalEvidencePath } from "@/scripts/canonical-historical-evidence.mjs";

import Database from "better-sqlite3";

import {
  operationalReentryMatchedCohortCaseFixtureV01,
  operationalReentryMatchedCohortRubricFixtureV01,
} from "@/fixtures/vnext/research/operational-reentry-matched-cohort-v0-1";
import {
  ACGC_E2_V02_TARGET_CONTEXT_TOKEN,
  OPERATIONAL_REENTRY_MATCHED_COHORT_COMMON_TASK_EVIDENCE_FINGERPRINT_V02,
  operationalReentryMatchedCohortCaseFixtureV02,
} from "@/fixtures/vnext/research/operational-reentry-matched-cohort-v0-2";
import { buildOperationalReentryMatchedCohortCallPlanV01 } from "@/lib/vnext/operational-reentry-matched-cohort";
import {
  buildOperationalReentryMatchedCohortGoldenOutputV02,
  buildOperationalReentryMatchedCohortModelInputV02,
  evaluateOperationalReentryMatchedCohortArmV02,
} from "@/lib/vnext/operational-reentry-matched-cohort-v0-2";
import {
  ACGC_E2_V03_CANONICAL_ORDER,
  buildOperationalReentryMatchedCohortGoldenWireOutputV03,
  buildOperationalReentryMatchedCohortRepresentativeInputsV03,
} from "@/lib/vnext/operational-reentry-matched-cohort-v0-3";
import { validateOperationalReentryProviderCompatibilityProbeArtifactsV01 } from "@/lib/vnext/operational-reentry-provider-compatibility-probe-artifact-store";
import { validateOperationalReentryMatchedCohortReplacementArtifactsV01 } from "@/lib/vnext/operational-reentry-matched-cohort-replacement-artifact-store";
import { validateOperationalReentryCleanControlProviderCompatibilityProbeArtifactsV02 } from "@/lib/vnext/operational-reentry-clean-control-provider-compatibility-probe-artifact-store";
import {
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V04,
} from "@/lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-v0-2-codec";
import {
  buildOperationalReentryMatchedCohortProviderContractV03,
  OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03,
  OPERATIONAL_REENTRY_MATCHED_COHORT_WIRE_BUDGET_PROOF_V03,
  OperationalReentryMatchedCohortOutputInvalidErrorV03,
  operationalReentryMatchedCohortResponseSchemaV04,
  parseOperationalReentryMatchedCohortOutputV03,
  validateOperationalReentryMatchedCohortModelInputV03,
} from "@/lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-v0-3-codec";
import {
  createOpenAIResponsesAdapterV01,
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02,
  projectOpenAIResponsesOperationalReentryMatchedCohortRequestV02,
  projectOpenAIResponsesOperationalReentryMatchedCohortRequestV03,
  type OpenAIResponsesTransportRequestV01,
  type OpenAIResponsesTransportV01,
} from "@/lib/vnext/model-gateway/openai/responses-adapter";
import {
  invokeOperationalReentryMatchedCohortModelGatewayV03,
  prepareOperationalReentryMatchedCohortModelGatewayRouteV02,
  prepareOperationalReentryMatchedCohortModelGatewayRouteV03,
  validateOperationalReentryMatchedCohortModelInvocationEnvelopeV03,
  type ModelGatewayInteractiveAdmissionV01,
} from "@/lib/vnext/model-gateway/model-gateway";
import {
  MODEL_INVOCATION_ENVELOPE_VERSION_V01,
  ModelGatewayInvocationErrorV01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01,
} from "@/lib/vnext/model-gateway/contracts";
import {
  buildModelGatewayCostAuthorityV01,
  buildModelGatewayCostBudgetV01,
} from "@/lib/vnext/model-gateway/cost-authority";
import { validateModelInvocationReceiptV02 } from "@/lib/vnext/model-gateway/model-invocation-receipt";
import {
  createDeterministicModelProviderRequestTraceV01,
} from "@/lib/vnext/model-gateway/provider-rejection-observation";
import {
  MODEL_PROVIDER_RESPONSE_INVALID_STAGES_V01,
  projectModelProviderResponseInvalidObservationV01,
  type ModelProviderResponseInvalidStageV01,
} from "@/lib/vnext/model-gateway/provider-response-invalid-observation";
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
  type OperationalReentryMatchedCohortArmV03,
  type OperationalReentryMatchedCohortModelInputV03,
  type OperationalReentryMatchedCohortWireOutputV03,
} from "@/types/vnext/operational-reentry-matched-cohort-v0-3";

const repositoryRoot = process.cwd();
const originalFetch = globalThis.fetch;
let fetchCalls = 0;

void main().catch((error) => {
  console.error("operational_reentry_matched_cohort_v03_test_failed");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

async function main(): Promise<void> {
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    throw new Error("v0.3 provider-contract tests must not call fetch");
  }) as typeof fetch;
  try {
    testHistoricalIdentitiesV03();
    const closureCombinations = testSchemaParserClosureV03();
    const gateway = await testSharedGatewayV03();
    assert.equal(fetchCalls, 0);
    console.log(JSON.stringify({
      status: "operational_reentry_matched_cohort_v03_test_passed",
      purpose: OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01,
      adapter_version:
        OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V05,
      provider_contract_version:
        OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V03,
      codec_version: OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V04,
      response_schema_version:
        OPERATIONAL_REENTRY_MATCHED_COHORT_RESPONSE_SCHEMA_VERSION_V04,
      parser_version: OPERATIONAL_REENTRY_MATCHED_COHORT_PARSER_VERSION_V03,
      closure_combinations: closureCombinations,
      fake_transport_success_calls: gateway.success_calls,
      fake_transport_failure_calls: gateway.failure_calls,
      bounded_failure_stages: gateway.observed_stages,
      local_derivation_failure_reachable: false,
      real_provider_calls: 0,
      successor_live_authorizations_created: 0,
      successor_live_authorizations_consumed: 0,
      successor_compatibility_result: "none",
      model_as_judge_calls: 0,
    }));
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function testHistoricalIdentitiesV03(): void {
  assert.equal(
    operationalReentryMatchedCohortCaseFixtureV01.integrity.fingerprint,
    "sha256:de6326bcd9411507790a271e57d09e7442018a22509d211a95f81dcc9f55b4d6",
  );
  assert.equal(
    operationalReentryMatchedCohortRubricFixtureV01.integrity.fingerprint,
    "sha256:837810e5f54e8f235f14b7fb3bb660a21d61f54849c1b378aa81ee4a37513896",
  );
  assert.equal(
    buildOperationalReentryMatchedCohortCallPlanV01().integrity.fingerprint,
    "sha256:02ce97acf6f9e7a02a1eb85f73e4da3748c2d6d944bbd96acdac5a515f89f9df",
  );

  const issue193 = validateOperationalReentryProviderCompatibilityProbeArtifactsV01({
    repository_root: repositoryRoot,
    read_scope: "migrated_historical",
    run_root: resolveMigratedHistoricalEvidencePath({ repositoryRoot, legacyRelativePath: ".augnes-lab/operational-reentry-provider-probes/operational-reentry-provider-probe_724ed8fce6d30d0979efd6bf837a3edc/issue-193" }),
  });
  assert.equal(issue193.report_fingerprint, "sha256:1ef3f21894272f390fcdacce80226383ae6d921c43712c3736a18843a8b08eb2");
  assert.equal(issue193.artifact_index_fingerprint, "sha256:19bc10cb3f9cbd6d2a0fb2b4df9fca6728c4bb4e571255e52f3c2d0fd7a6bd76");

  const issue199 = validateOperationalReentryMatchedCohortReplacementArtifactsV01({
    repository_root: repositoryRoot,
    read_scope: "migrated_historical",
    run_root: resolveMigratedHistoricalEvidencePath({ repositoryRoot, legacyRelativePath: ".augnes-lab/operational-reentry-matched-cohort-replacements/operational-reentry-replacement-cohort_d3136fe392e130ba74f67349686a91d9/issue-199" }),
  });
  assert.equal(issue199.replacement_cohort_fingerprint, "sha256:e23a70a7e7d9a136b1133c0683db46723ba5d2ec93dc4bf029caf9b7c64612a9");
  assert.equal(issue199.report_fingerprint, "sha256:a3cdf87b2d85bb40d577f4e324ac058652c41414f6fbc26dc21b4ef51e8afa73");
  assert.equal(issue199.artifact_index_fingerprint, "sha256:14296adcac5b81308a11a0761ac39ce77a4ba0c56ddf2cbf6e7e998f33415755");

  const issue208Root = resolveMigratedHistoricalEvidencePath({ repositoryRoot, legacyRelativePath: ".augnes-lab/operational-reentry-clean-control-provider-probes/operational-reentry-clean-control-provider-probe_9b197e054fab24139b511d4a1e6a4bde/issue-208" });
  const issue208 = validateOperationalReentryCleanControlProviderCompatibilityProbeArtifactsV02({
    repository_root: repositoryRoot,
    read_scope: "migrated_historical",
    run_root: issue208Root,
  });
  assert.equal(issue208.outcome, "provider_response_invalid");
  assert.equal(issue208.probe_fingerprint, "sha256:4d93d73ee21d223fbe554cf768d74c74d175bba89df6eebf99c06a2d5dc940d9");
  assert.equal(issue208.report_fingerprint, "sha256:1dd9cdf3909e0c5667064f1e38b569805c7e38b38fd63ea707535c1a85308aab");
  assert.equal(issue208.artifact_index_fingerprint, "sha256:8ffb5af4c99f2524eb7bc3b787c7d063d2bd639d2e461c18c408aa8475ac102c");
  const authorization = JSON.parse(readFileSync(path.join(issue208Root, "authorization.json"), "utf8")) as { integrity: { fingerprint: string } };
  assert.equal(authorization.integrity.fingerprint, "sha256:ca4af721dce8b69d95904626e2a67c09c00e312efef138ab9161a3b71e70c9c9");
  const identities = JSON.parse(readFileSync(path.join(issue208Root, "identities.json"), "utf8")) as Record<string, unknown>;
  const historicalReport = JSON.parse(readFileSync(path.join(issue208Root, "report.json"), "utf8")) as Record<string, unknown>;
  assert.equal(historicalReport.planned_shapes, 4);
  assert.equal(historicalReport.attempted_provider_calls, 1);
  assert.equal(historicalReport.accepted_and_normalized_shapes, 0);
  assert.equal(historicalReport.not_attempted_after_terminal_failure, 3);
  assert.equal(identities.case_fingerprint, "sha256:d702283dae6d9cfe586a3b7fd91893aee2720a3f136a027c321c3ecfa9d7fa4b");
  assert.equal(identities.common_task_evidence_fingerprint, "sha256:455cb74df26f63eccd15952a98433cba7f410a9e8b312afe5d35d4ceb235f38d");
  assert.equal(identities.representative_shape_plan_fingerprint, "sha256:abed2c04ff06f92e533932cd42c35fd95991424fa2841015e7050b11bd5a92eb");
  assert.equal(identities.plan_fingerprint, "sha256:29f33cf725ef26b365f64ec96bfdb4c2a1b98611a1d346d2ec44b3ec2e576eed");
  assert.equal(identities.route_fingerprint, "sha256:c1facb04df67d50831208dd4ae4be98f0af2560a39d00fc6b356eb29d3298388");
  assert.equal(identities.provider_contract_fingerprint, "sha256:94a91b52411b8baf8c29a90d5be73c7244b4afcb0c32426819c94b13dde62347");
  assert.equal((identities.shapes as Array<Record<string, unknown>>)[0]!.adapter_request_route_fingerprint, "sha256:bae20f32d247d702a86d78b851650241f4b1b25de463934a6523d35777cc73fc");

  const historicalInput = buildOperationalReentryMatchedCohortModelInputV02({ arm: "A", block: 0, call_slot_id: "historical-v02-route" });
  const historicalRequest = projectOpenAIResponsesOperationalReentryMatchedCohortRequestV02(historicalInput);
  assert.equal(historicalRequest.adapter_implementation_version, OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V04);
  assert.equal(historicalRequest.model, OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02);
  assert.equal(historicalRequest.adapter_request_route_fingerprint, "sha256:bae20f32d247d702a86d78b851650241f4b1b25de463934a6523d35777cc73fc");
  assert.equal(historicalRequest.provider_contract_version, "operational_reentry_clean_control_matched_cohort_provider_contract.v0.2");
  assert.equal(historicalRequest.response_schema_version, "operational_reentry_matched_cohort_response_schema.v0.3");
  assert.equal(historicalRequest.parser_version, "operational_reentry_matched_cohort_parser.v0.2");
}

function testSchemaParserClosureV03(): number {
  const representatives = buildOperationalReentryMatchedCohortRepresentativeInputsV03();
  assert.deepEqual(representatives.map(({ arm }) => arm), ACGC_E2_V03_CANONICAL_ORDER);
  assert.equal(new Set(representatives.map(({ input }) => canonicalizeProtocolValueV01(input.common_task_evidence))).size, 1);
  assert.equal(createProtocolSha256V01(canonicalizeProtocolValueV01(representatives[0]!.input.common_task_evidence)), OPERATIONAL_REENTRY_MATCHED_COHORT_COMMON_TASK_EVIDENCE_FINGERPRINT_V02);
  assert.deepEqual(representatives.slice(0, 3).map(({ input }) => input.continuation_context.filter((item) => item.role === "non_target")), [
    representatives[0]!.input.continuation_context.filter((item) => item.role === "non_target"),
    representatives[0]!.input.continuation_context.filter((item) => item.role === "non_target"),
    representatives[0]!.input.continuation_context.filter((item) => item.role === "non_target"),
  ]);
  assert.equal(representatives[3]!.input.continuation_context.length, 0);

  let combinations = 0;
  let maximumObservedWireBytes = 0;
  for (const { arm, input } of representatives) {
    assert.doesNotThrow(() => validateOperationalReentryMatchedCohortModelInputV03(input));
    const schema = operationalReentryMatchedCohortResponseSchemaV04(input);
    assert.doesNotThrow(() => validateOpenAIStrictSchemaSupportedSubsetV01(schema));
    const schemaText = JSON.stringify(schema);
    assert.equal(schemaText.includes("uniqueItems"), false);
    assert.equal(schemaText.includes("target_disposition"), false);
    assert.equal(schemaText.includes("common_task_evidence_fingerprint"), false);
    assert.equal(schemaText.includes("check_token"), false);
    const targetToken = ACGC_E2_V02_TARGET_CONTEXT_TOKEN;
    assert.equal(schemaText.includes(targetToken), input.continuation_context.some((item) => item.context_token === targetToken));

    const referenceKeys = input.allowed_output.referenced_continuation_tokens.length === 0
      ? [OPERATIONAL_REENTRY_MATCHED_COHORT_EMPTY_SELECTION_KEY_V03]
      : [...input.allowed_output.referenced_continuation_tokens];
    const operationKeys = [...input.allowed_output.operation_action_class_tokens];
    const limitationKeys = [...input.allowed_output.result_limitation_tokens];
    const allKeys = [...referenceKeys, ...operationKeys, ...limitationKeys];
    for (let mask = 0; mask < 2 ** allKeys.length; mask += 1) {
      let offset = 0;
      const wire: OperationalReentryMatchedCohortWireOutputV03 = {
        result_status: "review_blocked",
        required_check_disposition: "blocked",
        referenced_continuation_selections: booleansForMask(referenceKeys, mask, offset),
        operation_action_class_selections: booleansForMask(operationKeys, mask, offset += referenceKeys.length),
        result_limitation_selections: booleansForMask(limitationKeys, mask, offset += operationKeys.length),
        abstention: false,
      };
      const normalized = parseOperationalReentryMatchedCohortOutputV03(JSON.stringify(wire), input);
      maximumObservedWireBytes = Math.max(
        maximumObservedWireBytes,
        Buffer.byteLength(canonicalizeProtocolValueV01(wire), "utf8"),
      );
      assert.deepEqual(normalized.referenced_continuation_tokens, input.allowed_output.referenced_continuation_tokens.filter((token) => wire.referenced_continuation_selections[token]));
      assert.deepEqual(normalized.operation_action_class_tokens, input.allowed_output.operation_action_class_tokens.filter((token) => wire.operation_action_class_selections[token]));
      assert.deepEqual(normalized.result_limitation_tokens, input.allowed_output.result_limitation_tokens.filter((token) => wire.result_limitation_selections[token]));
      combinations += 1;
    }

    const golden = buildOperationalReentryMatchedCohortGoldenWireOutputV03(arm);
    for (const resultStatus of input.allowed_output.result_statuses) {
      for (const disposition of input.allowed_output.required_check_dispositions) {
        for (const abstention of [false, true]) {
          assert.doesNotThrow(() => parseOperationalReentryMatchedCohortOutputV03(JSON.stringify({ ...golden, result_status: resultStatus, required_check_disposition: disposition, abstention }), input));
        }
      }
    }
    assertWireStage(input, { ...golden, unknown_key: true }, "response_wire_shape_invalid");
    assertWireStage(input, { ...golden, result_status: "invented" }, "response_wire_value_invalid");
    const brokenSelection = structuredClone(golden);
    delete brokenSelection.operation_action_class_selections[operationKeys[0]!];
    assertWireStage(input, brokenSelection, "response_wire_selection_invalid");

    const behaviorallyWrong = parseOperationalReentryMatchedCohortOutputV03(JSON.stringify({ ...golden, required_check_disposition: "failed" }), input);
    const historicalInput = buildOperationalReentryMatchedCohortModelInputV02({ arm, block: 0, call_slot_id: input.invocation_context.call_slot_id });
    const evaluation = evaluateOperationalReentryMatchedCohortArmV02({ arm, call_slot_id: input.invocation_context.call_slot_id, model_input: historicalInput, normalized_output: behaviorallyWrong });
    assert.equal(evaluation.common_compliance, "invalid");
    assert.ok(evaluation.failed_common_hard_gates.includes("required_check_disposition"));
  }

  const contract = buildOperationalReentryMatchedCohortProviderContractV03();
  assert.equal(contract.parser_closed_wire_contract, true);
  assert.equal(contract.selection_representation, "exact_required_boolean_objects");
  assert.equal(contract.successor_live_authorizations_created, 0);
  assert.equal(contract.successor_live_authorizations_consumed, 0);
  assert.equal(contract.real_provider_calls, 0);
  assert.equal(contract.successor_compatibility_result, "none");
  assert.equal(OPERATIONAL_REENTRY_MATCHED_COHORT_WIRE_BUDGET_PROOF_V03.shapes.length, 4);
  assert.equal(maximumObservedWireBytes, OPERATIONAL_REENTRY_MATCHED_COHORT_WIRE_BUDGET_PROOF_V03.maximum_canonical_wire_response_bytes);
  assert.equal(OPERATIONAL_REENTRY_MATCHED_COHORT_WIRE_BUDGET_PROOF_V03.response_bytes, OPERATIONAL_REENTRY_MATCHED_COHORT_WIRE_BUDGET_PROOF_V03.maximum_canonical_wire_response_bytes + OPERATIONAL_REENTRY_MATCHED_COHORT_WIRE_BUDGET_PROOF_V03.safety_margin_bytes);
  assert.equal(OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03.maxOutputTokens, OPERATIONAL_REENTRY_MATCHED_COHORT_WIRE_BUDGET_PROOF_V03.response_bytes);
  assert.ok(OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03.maxOutputTokens <= 4_096);
  return combinations;
}

async function testSharedGatewayV03(): Promise<{ success_calls: number; failure_calls: number; observed_stages: string[] }> {
  const root = mkdtempSync(path.join(tmpdir(), "augnes-e2r2p3h-v03-"));
  const projectRoot = path.join(root, "project");
  const databasePath = path.join(root, "gateway.db");
  mkdirSync(projectRoot, { recursive: true });
  const database = new Database(databasePath);
  database.exec(readFileSync(path.join(repositoryRoot, "lib/db/schema.sql"), "utf8"));
  database.close();
  try {
    const admission = registerGatewayProjectV03(databasePath, projectRoot);
    const requests: OpenAIResponsesTransportRequestV01[] = [];
    let outputIndex = 0;
    const representatives = buildOperationalReentryMatchedCohortRepresentativeInputsV03();
    const successAdapter = adapterV03(async (request) => {
      requests.push(request);
      const arm = representatives[outputIndex++]!.arm;
      return completedResponseV03(buildOperationalReentryMatchedCohortGoldenWireOutputV03(arm));
    });
    const route = await prepareOperationalReentryMatchedCohortModelGatewayRouteV03({ adapter: successAdapter });
    assert.ok(route);
    assert.equal(route.purpose, OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01);
    assert.equal(route.model_ref.external_id, OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02);
    assert.equal(route.adapter_implementation_version, OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V05);
    assert.equal(route.provider_contract_version, OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V03);
    assert.equal(route.provider_contract_fingerprint, buildOperationalReentryMatchedCohortProviderContractV03().integrity.fingerprint);
    assert.equal(route.maximum_canonical_wire_response_bytes, OPERATIONAL_REENTRY_MATCHED_COHORT_WIRE_BUDGET_PROOF_V03.maximum_canonical_wire_response_bytes);
    assert.equal(route.response_safety_margin_bytes, OPERATIONAL_REENTRY_MATCHED_COHORT_WIRE_BUDGET_PROOF_V03.safety_margin_bytes);
    assert.equal(route.response_bytes, OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03.responseBytes);
    assert.equal(route.max_output_tokens, OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03.maxOutputTokens);
    const historicalRoute = await prepareOperationalReentryMatchedCohortModelGatewayRouteV02({ adapter: successAdapter });
    assert.ok(historicalRoute);
    assert.equal(historicalRoute.adapter_implementation_version, OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V04);

    const traces = new Set<string>();
    const clientRequestIds = new Set<string>();
    for (let index = 0; index < representatives.length; index += 1) {
      const { input } = representatives[index]!;
      const envelope = envelopeV03(admission, route, input, index);
      traces.add(envelope.provider_request_trace_id);
      assert.doesNotThrow(() => validateOperationalReentryMatchedCohortModelInvocationEnvelopeV03(envelope));
      const result = await invokeOperationalReentryMatchedCohortModelGatewayV03(envelope, dependenciesV03(databasePath, successAdapter, route));
      assert.equal(result.model_invocation_receipt.purpose, OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01);
      assert.equal(result.model_invocation_receipt.final_implementation_version, OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V05);
      assert.doesNotThrow(() => validateModelInvocationReceiptV02(result.model_invocation_receipt));
      const actual = requests[index]!;
      clientRequestIds.add(actual.headers["X-Client-Request-Id"]!);
      assert.equal(actual.body.includes(envelope.provider_request_trace_id), false);
      const projected = projectOpenAIResponsesOperationalReentryMatchedCohortRequestV03(input);
      assert.equal(actual.body, projected.request_body);
      assert.equal(createProtocolSha256V01(actual.body), projected.request_fingerprint);
      const body = JSON.parse(actual.body) as { model: string; text: { format: { schema: unknown } } };
      assert.equal(body.model, OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02);
      assert.equal(createProtocolSha256V01(canonicalizeProtocolValueV01(body.text.format.schema)), projected.schema_fingerprint);
    }
    assert.equal(requests.length, 4);
    assert.equal(traces.size, 4);
    assert.equal(clientRequestIds.size, 4);

    const failureCases: Array<{ stage: ModelProviderResponseInvalidStageV01; transport: OpenAIResponsesTransportV01; reason?: string }> = [
      { stage: "response_json_unreadable", transport: async () => ({ ok: true, status: 200, async json() { throw new Error("raw-json-error-must-not-escape"); } }) },
      { stage: "response_envelope_invalid", transport: async () => ({ ok: true, status: 200, async json() { return []; } }) },
      { stage: "response_status_not_completed", reason: "max_output_tokens", transport: async () => ({ ok: true, status: 200, async json() { return { status: "incomplete", incomplete_details: { reason: "max_output_tokens" }, output_text: "raw-incomplete-output-must-not-escape" }; } }) },
      { stage: "response_output_text_missing", transport: async () => ({ ok: true, status: 200, async json() { return { status: "completed" }; } }) },
      { stage: "response_output_text_out_of_bounds", transport: async () => ({ ok: true, status: 200, async json() { return { status: "completed", output_text: "x".repeat(OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03.responseBytes + 1) }; } }) },
      { stage: "response_usage_invalid", transport: async () => completedResponseV03(buildOperationalReentryMatchedCohortGoldenWireOutputV03("A"), { input_tokens: 2, output_tokens: 2, total_tokens: 1 }) },
      { stage: "response_wire_json_invalid", transport: async () => completedResponseTextV03("{") },
      { stage: "response_wire_shape_invalid", transport: async () => completedResponseTextV03("[]") },
      { stage: "response_wire_value_invalid", transport: async () => completedResponseV03({ ...buildOperationalReentryMatchedCohortGoldenWireOutputV03("A"), result_status: "invented" }) },
      { stage: "response_wire_selection_invalid", transport: async () => { const value = buildOperationalReentryMatchedCohortGoldenWireOutputV03("A"); delete value.operation_action_class_selections.bounded_result_review; return completedResponseV03(value); } },
    ];
    const observedStages: string[] = [];
    let failureCalls = 0;
    for (let index = 0; index < failureCases.length; index += 1) {
      const fixture = failureCases[index]!;
      const adapter = adapterV03(async (request) => { failureCalls += 1; return fixture.transport(request); });
      const failure = await captureGatewayFailureV03(() => invokeOperationalReentryMatchedCohortModelGatewayV03(envelopeV03(admission, route, representatives[0]!.input, 100 + index), dependenciesV03(databasePath, adapter, route)));
      assert.equal(failure.code, "model_gateway_provider_response_invalid");
      assert.equal(failure.receipt?.egress_attempted, true);
      assert.equal(failure.provider_response_invalid_observation?.stage, fixture.stage);
      assert.equal(failure.provider_response_invalid_observation?.incomplete_reason, fixture.reason ?? null);
      if (fixture.stage === "response_status_not_completed") {
        assert.equal(failure.provider_response_invalid_observation?.provider_status, "incomplete");
      }
      assert.equal(JSON.stringify(failure).includes("raw-"), false);
      observedStages.push(fixture.stage);
    }

    const nativeStructuredClone = globalThis.structuredClone;
    const otherOutput = buildOperationalReentryMatchedCohortGoldenWireOutputV03("A");
    const otherAdapter = adapterV03(async () => {
      failureCalls += 1;
      globalThis.structuredClone = ((..._arguments: Parameters<typeof structuredClone>) => {
        globalThis.structuredClone = nativeStructuredClone;
        throw new Error("raw-unexpected-parse-error-must-not-escape");
      }) as typeof structuredClone;
      return completedResponseV03(otherOutput);
    });
    try {
      const other = await captureGatewayFailureV03(() => invokeOperationalReentryMatchedCohortModelGatewayV03(envelopeV03(admission, route, representatives[0]!.input, 200), dependenciesV03(databasePath, otherAdapter, route)));
      assert.equal(
        other.provider_response_invalid_observation?.stage,
        "response_other_invalid",
        `unexpected other failure code=${other.code}`,
      );
      assert.equal(JSON.stringify(other).includes("raw-unexpected"), false);
      observedStages.push("response_other_invalid");
    } finally {
      globalThis.structuredClone = nativeStructuredClone;
    }

    const rejectedAdapter = adapterV03(async () => {
      failureCalls += 1;
      return { ok: false, status: 429, headers: { get: () => "req_v03_rejected" }, async text() { return JSON.stringify({ error: { message: "raw-provider-rejection-must-not-escape" } }); }, async json() { throw new Error("text expected"); } };
    });
    const rejected = await captureGatewayFailureV03(() => invokeOperationalReentryMatchedCohortModelGatewayV03(envelopeV03(admission, route, representatives[0]!.input, 201), dependenciesV03(databasePath, rejectedAdapter, route)));
    assert.equal(rejected.code, "model_gateway_provider_rejected");
    assert.equal(rejected.provider_response_invalid_observation, null);
    assert.equal(JSON.stringify(rejected).includes("raw-provider"), false);

    projectModelProviderResponseInvalidObservationV01({
      stage: "response_local_derivation_invalid",
      output_text_present: true,
      client_request_id: "acgc_req_0000000000000000000000000000000000000000",
      route_fingerprint: `sha256:${"0".repeat(64)}`,
      request_fingerprint: `sha256:${"1".repeat(64)}`,
      schema_fingerprint: `sha256:${"2".repeat(64)}`,
    });
    assert.deepEqual(new Set([...observedStages, "response_local_derivation_invalid"]), new Set(MODEL_PROVIDER_RESPONSE_INVALID_STAGES_V01));
    return { success_calls: requests.length, failure_calls: failureCalls, observed_stages: observedStages };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function booleansForMask(keys: readonly string[], mask: number, offset: number): Record<string, boolean> {
  return Object.fromEntries(keys.map((key, index) => [key, (mask & (1 << (offset + index))) !== 0]));
}

function assertWireStage(input: OperationalReentryMatchedCohortModelInputV03, wire: unknown, stage: ModelProviderResponseInvalidStageV01): void {
  assert.throws(() => parseOperationalReentryMatchedCohortOutputV03(JSON.stringify(wire), input), (error: unknown) => error instanceof OperationalReentryMatchedCohortOutputInvalidErrorV03 && error.stage === stage);
}

function adapterV03(transport: OpenAIResponsesTransportV01) {
  return createOpenAIResponsesAdapterV01({ environment: { OPENAI_API_KEY: "test-credential-never-persisted", OPENAI_MODEL: "ambient-model-must-not-change-v03" }, transport });
}

function completedResponseV03(output: unknown, usage = { input_tokens: 120, output_tokens: 40, total_tokens: 160 }) {
  return completedResponseTextV03(JSON.stringify(output), usage);
}

function completedResponseTextV03(outputText: string, usage: unknown = { input_tokens: 120, output_tokens: 40, total_tokens: 160 }) {
  return { ok: true, status: 200, headers: { get: (name: string) => name === "x-request-id" ? "req_v03_fake" : null }, async json() { return { status: "completed", output_text: outputText, usage }; } };
}

function registerGatewayProjectV03(databasePath: string, projectRoot: string): ModelGatewayInteractiveAdmissionV01 {
  const database = new Database(databasePath);
  try {
    const workspace = getOrCreateDefaultWorkspaceIdentityV01(database, { create_uuid: () => "11111111-1111-4111-8111-111111111111", now: () => "2026-08-19T00:00:00.000Z" });
    const localRoot = normalizeLocalProjectRootRefV01(projectRoot, { base_path: path.parse(projectRoot).root });
    const project = getOrCreateCanonicalProjectForLocalRootV01(database, { workspace_id: workspace.workspace_id, local_root: localRoot, display_name: "e2r2p3h-v03-test-project" }, { create_uuid: () => "22222222-2222-4222-8222-222222222222", now: () => "2026-08-19T00:00:01.000Z" });
    const active = selectActiveProjectV01(database, { workspace_id: workspace.workspace_id, project_id: project.project.project_id, now: "2026-08-19T00:00:02.000Z", expected_project_id: null, expected_revision: null });
    return { workspace_id: workspace.workspace_id, project_id: project.project.project_id, expected_active_selection_revision: active.selection_revision, project_root: { path_flavor: localRoot.path_flavor, normalized_path: localRoot.normalized_path }, gateway_authorization_project_is_lab_experiment_meaning: false };
  } finally {
    database.close();
  }
}

function envelopeV03(admission: ModelGatewayInteractiveAdmissionV01, route: NonNullable<Awaited<ReturnType<typeof prepareOperationalReentryMatchedCohortModelGatewayRouteV03>>>, modelInput: OperationalReentryMatchedCohortModelInputV03, index: number) {
  const evaluatedAt = "2026-08-19T00:01:00.000Z";
  const authority = buildModelGatewayCostAuthorityV01({ authority_kind: "provider_model_pricing_snapshot", workspace_id: admission.workspace_id, project_id: admission.project_id, purpose: OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01, provider_ref: route.provider_ref, model_ref: route.model_ref, cost_unit: "nano_usd", input_rate: { unit: "utf8_byte", cost_per_unit: 400 }, output_rate: { unit: "token", cost_per_unit: 1_600 }, pricing_source_version: "synthetic_test_pricing_v03", pricing_effective_at: "2026-08-18T00:00:00.000Z", pricing_expires_at: "2026-08-20T00:00:00.000Z", project_model_policy_fingerprint: createProtocolSha256V01(canonicalizeProtocolValueV01(route)) });
  const costBudget = buildModelGatewayCostBudgetV01({ authority, workspace_id: admission.workspace_id, project_id: admission.project_id, purpose: OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01, provider_ref: route.provider_ref, model_ref: route.model_ref, maximum_input_units: OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03.finalRequestBytes, maximum_output_units: OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03.maxOutputTokens, timeout_ms: OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03.timeoutMs, maximum_permitted_cost: 250_000_000, evaluated_at: evaluatedAt });
  return {
    envelope_version: MODEL_INVOCATION_ENVELOPE_VERSION_V01,
    invocation_id: `e2r2p3h-v03-gateway-${index}`,
    provider_request_trace_id: createDeterministicModelProviderRequestTraceV01({ request_family_kind: "compatibility_probe", request_family_fingerprint: createProtocolSha256V01(canonicalizeProtocolValueV01({ index, input: modelInput })) }),
    workspace_id: admission.workspace_id,
    project_id: admission.project_id,
    purpose: OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01,
    data_classification: "public_safe" as const,
    provenance_refs: [operationalReentryMatchedCohortCaseFixtureV02.integrity.fingerprint],
    privacy: { provider_egress: "allow" as const, retention_class: "none" as const },
    budget: { max_input_bytes: OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03.finalRequestBytes, max_output_tokens: OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03.maxOutputTokens, max_provider_calls: 1 as const, cost_budget: costBudget },
    timeout_ms: OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03.timeoutMs,
    cancellation: { signal: new AbortController().signal },
    execution_mode: "live" as const,
    policy: { invocation_origin: "interactive" as const, expected_active_project_id: admission.project_id, expected_active_selection_revision: admission.expected_active_selection_revision },
    project_root: admission.project_root,
    input: modelInput,
  };
}

function dependenciesV03(databasePath: string, adapter: ReturnType<typeof createOpenAIResponsesAdapterV01>, route: NonNullable<Awaited<ReturnType<typeof prepareOperationalReentryMatchedCohortModelGatewayRouteV03>>>) {
  return { adapter, expected_operational_reentry_matched_cohort_v03_route: route, open_database: () => new Database(databasePath), read_root_availability: async () => "available" as const, now: () => new Date("2026-08-19T00:01:00.000Z") };
}

async function captureGatewayFailureV03(run: () => Promise<unknown>): Promise<ModelGatewayInvocationErrorV01> {
  try {
    await run();
  } catch (error) {
    assert.ok(
      error instanceof ModelGatewayInvocationErrorV01,
      `unexpected gateway error: ${error instanceof Error ? error.name : typeof error}`,
    );
    return error;
  }
  assert.fail("expected v0.3 Model Gateway invocation to fail");
}
