import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import {
  operationalReentryMatchedCohortCaseFixtureV01,
  operationalReentryMatchedCohortRubricFixtureV01,
} from "@/fixtures/vnext/research/operational-reentry-matched-cohort-v0-1";
import {
  OPERATIONAL_REENTRY_MATCHED_COHORT_COMMON_TASK_EVIDENCE_FINGERPRINT_V02,
  operationalReentryMatchedCohortCaseFixtureV02,
} from "@/fixtures/vnext/research/operational-reentry-matched-cohort-v0-2";
import {
  assertOperationalReentryV04ProviderCompatibilityProbeArtifactPayloadSafeV01,
  assertOperationalReentryV04ProviderCompatibilityProbeArtifactRootAvailableV01,
  beginOperationalReentryV04ProviderCompatibilityProbeAttemptV01,
  validateOperationalReentryV04ProviderCompatibilityProbeArtifactsV01,
} from "@/lib/vnext/operational-reentry-v0-4-provider-compatibility-probe-artifact-store";
import { validateOperationalReentryCleanControlProviderCompatibilityProbeArtifactsV02 } from "@/lib/vnext/operational-reentry-clean-control-provider-compatibility-probe-artifact-store";
import { buildOperationalReentryCleanControlProviderCompatibilityProbeRepresentativeShapePlanV02 } from "@/lib/vnext/operational-reentry-clean-control-provider-compatibility-probe";
import {
  ACGC_E2R2P6C_AGGREGATE_COST_CEILING_NANO_USD_V01,
  ACGC_E2R2P6C_CANONICAL_SHAPE_ORDER_V01,
  buildOperationalReentryV04ProviderCompatibilityProbeAuthorizationExpectationsV01,
  buildOperationalReentryV04ProviderCompatibilityProbeModelInvocationEnvelopeV01,
  buildOperationalReentryV04ProviderCompatibilityProbeRepresentativeShapePlanV01,
  buildOperationalReentryV04ProviderCompatibilityProbeV01,
  deriveOperationalReentryV04ProviderCompatibilityProbeOutcomeV01,
  operationalReentryV04ProviderCompatibilityProbeHarnessAuthorityV01,
  projectOperationalReentryV04ProviderCompatibilityProbePlanForArtifactV01,
  runOperationalReentryV04ProviderCompatibilityProbeV01,
  type RunOperationalReentryV04ProviderCompatibilityProbeDependenciesV01,
} from "@/lib/vnext/operational-reentry-v0-4-provider-compatibility-probe";
import { validateOperationalReentryMatchedCohortArtifactsV01 } from "@/lib/vnext/operational-reentry-matched-cohort-artifact-store";
import { validateOperationalReentryMatchedCohortReplacementArtifactsV01 } from "@/lib/vnext/operational-reentry-matched-cohort-replacement-artifact-store";
import { buildOperationalReentryMatchedCohortCallPlanV01 } from "@/lib/vnext/operational-reentry-matched-cohort";
import { buildOperationalReentryMatchedCohortGoldenWireOutputV04 } from "@/lib/vnext/operational-reentry-matched-cohort-v0-4";
import { validateOperationalReentryProviderCompatibilityProbeArtifactsV01 } from "@/lib/vnext/operational-reentry-provider-compatibility-probe-artifact-store";
import {
  MODEL_PROVIDER_REQUEST_FAMILY_KINDS_V01,
  createDeterministicModelProviderRequestTraceV01,
} from "@/lib/vnext/model-gateway/provider-rejection-observation";
import type { ModelProviderResponseInvalidStageV01 } from "@/lib/vnext/model-gateway/provider-response-invalid-observation";
import {
  OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01,
} from "@/lib/vnext/model-gateway/contracts";
import { validateModelInvocationReceiptV02 } from "@/lib/vnext/model-gateway/model-invocation-receipt";
import {
  prepareOperationalReentryMatchedCohortModelGatewayRouteV01,
  prepareOperationalReentryMatchedCohortModelGatewayRouteV02,
  prepareOperationalReentryMatchedCohortModelGatewayRouteV03,
  prepareOperationalReentryMatchedCohortModelGatewayRouteV04,
  projectOperationalReentryMatchedCohortProviderRequestV02,
  projectOperationalReentryMatchedCohortProviderRequestV03,
  projectOperationalReentryMatchedCohortProviderRequestV04,
  validateModelInvocationEnvelopeV01,
  type ModelGatewayInteractiveAdmissionV01,
} from "@/lib/vnext/model-gateway/model-gateway";
import {
  createOpenAIResponsesAdapterV01,
  type OpenAIResponsesTransportRequestV01,
  type OpenAIResponsesTransportV01,
} from "@/lib/vnext/model-gateway/openai/responses-adapter";
import {
  operationalReentryMatchedCohortResponseSchemaV04,
  OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V04,
} from "@/lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-v0-4-codec";
import { OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V04 } from "@/lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-v0-2-codec";
import { buildOperationalReentryMatchedCohortModelInputV02 } from "@/lib/vnext/operational-reentry-matched-cohort-v0-2";
import { buildOperationalReentryMatchedCohortModelInputV03 } from "@/lib/vnext/operational-reentry-matched-cohort-v0-3";
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
import { preflightOperationalReentryV04ProviderCompatibilityProbeRepositoryV01 } from "@/scripts/operational-reentry-v0-4-provider-compatibility-probe";
import {
  OPERATIONAL_REENTRY_V04_PROVIDER_COMPATIBILITY_PROBE_AUTHORIZATION_VERSION_V01,
  type OperationalReentryV04ProviderCompatibilityProbeAuthorizationV01,
  type OperationalReentryV04ProviderCompatibilityProbePreparedV01,
} from "@/types/vnext/operational-reentry-v0-4-provider-compatibility-probe";
import {
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V06,
  type OperationalReentryMatchedCohortRouteV04,
} from "@/types/vnext/operational-reentry-matched-cohort-v0-4";

const repositoryRoot = process.cwd();
const root = mkdtempSync(path.join(tmpdir(), "augnes-e2r2p6c-v04-"));
const projectRoot = path.join(root, "project");
const databasePath = path.join(root, "gateway.db");
const evaluatedAt = "2026-08-22T08:00:00.000Z";
const futureMergedSourceHead = "c".repeat(40);
const repositoryIdentity = {
  repository_slug: "hynk-studio/augnes-perspective-lab" as const,
  origin: "https://github.com/hynk-studio/augnes-perspective-lab.git",
};
const originalFetch = globalThis.fetch;
let fetchCalls = 0;
let fakeTransportCalls = 0;
let authorizationSequence = 0;

void main()
  .finally(() => {
    globalThis.fetch = originalFetch;
    rmSync(root, { recursive: true, force: true });
  })
  .catch((error) => {
    console.error(
      "operational_reentry_v04_provider_compatibility_probe_test_failed",
    );
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exitCode = 1;
  });

async function main(): Promise<void> {
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    throw new Error("v0.4 compatibility harness tests must not call fetch");
  }) as typeof fetch;
  mkdirSync(projectRoot, { recursive: true });
  writeFileSync(path.join(projectRoot, ".gitignore"), ".augnes-lab/\n");
  initializeDatabaseV01();
  const admission = registerProjectV01();

  await verifyHistoricalPreservationV01();
  const shapeIdentity = await verifyShapePlanAndPricingV01(admission);
  const accepted = await verifySharedGatewayFourShapeProbeV01(admission);
  await verifyTerminalMappingsV01(admission);
  await verifyAuthorizationRefusalsV01(admission);
  await verifyArtifactSingleUseAndPrivacyV01(admission);
  await verifyArtifactConsumptionWriteFailureFailsClosedV01(admission);
  verifyMergedMainPreflightV01();
  verifyStaticAuthorityAndNoBehaviorV01();
  assert.equal(fetchCalls, 0);

  console.log(
    JSON.stringify({
      status:
        "operational_reentry_v04_provider_compatibility_probe_test_passed",
      planned_shapes: 4,
      canonical_order: ACGC_E2R2P6C_CANONICAL_SHAPE_ORDER_V01,
      case_fingerprint:
        operationalReentryMatchedCohortCaseFixtureV02.integrity.fingerprint,
      common_task_evidence_fingerprint:
        OPERATIONAL_REENTRY_MATCHED_COHORT_COMMON_TASK_EVIDENCE_FINGERPRINT_V02,
      representative_shape_plan_fingerprint:
        shapeIdentity.representative_shape_plan_fingerprint,
      twin_b_zero_egress_witness_fingerprint:
        shapeIdentity.twin_b_zero_egress_witness_fingerprint,
      route_fingerprint: shapeIdentity.route_fingerprint,
      provider_contract_fingerprint:
        shapeIdentity.provider_contract_fingerprint,
      adapter_request_route_fingerprint:
        shapeIdentity.adapter_request_route_fingerprint,
      pricing_fingerprint: shapeIdentity.pricing_fingerprint,
      pricing_snapshot_evaluated_at:
        shapeIdentity.pricing_snapshot_evaluated_at,
      pricing_authority_fingerprint:
        shapeIdentity.pricing_authority_fingerprint,
      aggregate_worst_case_cost_nano_usd:
        shapeIdentity.aggregate_worst_case_cost_nano_usd,
      required_fake_deterministic_test_categories: 22,
      index_only_tamper_regressions: 5,
      coordinated_artifact_cross_link_tamper_regressions: 2,
      accepted_fake_transport_calls: accepted.fake_transport_calls,
      total_fake_transport_calls: fakeTransportCalls,
      real_provider_calls: 0,
      successor_live_authorizations_created: 0,
      successor_live_authorizations_consumed: 0,
      successor_compatibility_result: "none",
      behavioral_cohort_executed: false,
      replication_executed: false,
      policy_started: false,
      stage_7_started: false,
    }),
  );
}

async function verifyHistoricalPreservationV01(): Promise<void> {
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
  const historicalRequest =
    projectOperationalReentryMatchedCohortProviderRequestV02(
      buildOperationalReentryMatchedCohortModelInputV02({
        arm: "A",
        block: 0,
        call_slot_id: "historical-v02-route-check",
      }),
    );
  assert.equal(
    historicalRequest.adapter_implementation_version,
    OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V04,
  );
  assert.equal(
    historicalRequest.provider_contract_version,
    "operational_reentry_clean_control_matched_cohort_provider_contract.v0.2",
  );
  assert.equal(
    historicalRequest.response_schema_version,
    "operational_reentry_matched_cohort_response_schema.v0.3",
  );
  assert.equal(
    historicalRequest.parser_version,
    "operational_reentry_matched_cohort_parser.v0.2",
  );
  const historicalAdapter = adapterV01(async () => {
    throw new Error("historical v0.3 preservation must remain zero egress");
  });
  const historicalV03Route =
    await prepareOperationalReentryMatchedCohortModelGatewayRouteV03({
      adapter: historicalAdapter,
    });
  assert.ok(historicalV03Route);
  assert.equal(
    historicalV03Route.integrity_fingerprint,
    "sha256:4d286f56405ff66236a19d1e0f4529510faa8c53a80e6bba4ecac9c4845930e0",
  );
  assert.equal(
    historicalV03Route.provider_contract_fingerprint,
    "sha256:682905683f083ee67002dc4cf2577ec3ae4302e90fc85e27f43019b8b7978bbb",
  );
  const historicalV03Request =
    projectOperationalReentryMatchedCohortProviderRequestV03(
      buildOperationalReentryMatchedCohortModelInputV03({
        arm: "A",
        block: 0,
        call_slot_id: "historical-v03-route-check",
      }),
    );
  assert.equal(
    historicalV03Request.adapter_request_route_fingerprint,
    "sha256:182e0be9c2b4a53baca61c01d9b83f67fbd6855d1e3b8c9cbd182abeff4831e9",
  );
  const packageJson = JSON.parse(
    readFileSync(path.join(repositoryRoot, "package.json"), "utf8"),
  ) as { scripts: Record<string, string> };
  assert.equal(
    packageJson.scripts["operational-reentry:provider-compatibility-probe"],
    "node --import tsx scripts/operational-reentry-provider-compatibility-probe.ts",
  );
  assert.equal(
    packageJson.scripts["operational-reentry:live-matched-cohort"],
    "node --import tsx scripts/operational-reentry-matched-cohort.ts",
  );
  assert.equal(
    packageJson.scripts["operational-reentry:replacement-matched-cohort"],
    "node --import tsx scripts/operational-reentry-matched-cohort-replacement.ts",
  );
  assert.equal(
    packageJson.scripts[
      "operational-reentry:parser-closed-provider-compatibility-probe"
    ],
    "node --import tsx scripts/operational-reentry-parser-closed-provider-compatibility-probe.ts",
  );
  assert.equal(
    packageJson.scripts[
      "operational-reentry:v04-provider-compatibility-probe"
    ],
    "node --import tsx scripts/operational-reentry-v0-4-provider-compatibility-probe.ts",
  );
  assert.equal(
    packageJson.scripts[
      "test:operational-reentry-v04-provider-compatibility-probe"
    ],
    "node --import tsx scripts/test-operational-reentry-v0-4-provider-compatibility-probe.ts",
  );
}

async function verifyShapePlanAndPricingV01(
  admission: ModelGatewayInteractiveAdmissionV01,
): Promise<{
  representative_shape_plan_fingerprint: string;
  twin_b_zero_egress_witness_fingerprint: string;
  route_fingerprint: string;
  provider_contract_fingerprint: string;
  adapter_request_route_fingerprint: string;
  pricing_fingerprint: string;
  pricing_snapshot_evaluated_at: string;
  pricing_authority_fingerprint: string;
  aggregate_worst_case_cost_nano_usd: number;
}> {
  const adapter = adapterV01(async () => {
    throw new Error("shape planning must remain zero egress");
  });
  const route = await routeV01(adapter);
  const authorization = authorizationV01(admission, route, "shape-plan");
  const prepared =
    buildOperationalReentryV04ProviderCompatibilityProbeV01({
      authorization,
      admission,
      route,
      repository_identity: repositoryIdentity,
      evaluated_at: evaluatedAt,
    });
  assert.deepEqual(
    prepared.plan.entries.map((entry) => entry.shape),
    ["A", "B", "C", "D"],
  );
  assert.equal(prepared.plan.maximum_provider_calls, 4);
  assert.equal(prepared.plan.maximum_parallel_calls, 1);
  assert.equal(prepared.plan.retries, 0);
  assert.equal(prepared.plan.replacement_calls, 0);
  assert.equal(prepared.plan.fresh_stateless_request_per_shape, true);
  assert.equal(prepared.plan.conversation_reuse, false);
  assert.equal(prepared.plan.thread_reuse, false);
  assert.equal(prepared.plan.previous_response_reuse, false);
  assert.equal(prepared.plan.stop_after_first_non_success_terminal_result, true);
  assert.equal(
    new Set(
      prepared.plan.entries.map(
        (entry) => entry.common_task_evidence_fingerprint,
      ),
    ).size,
    1,
  );
  const [a, b, c, d] = prepared.plan.entries;
  assert.notEqual(
    a!.provider_material_fingerprint,
    b!.provider_material_fingerprint,
  );
  assert.notEqual(
    b!.provider_material_fingerprint,
    c!.provider_material_fingerprint,
  );
  assert.equal(d!.invocation.provider_material.continuation_context.length, 0);
  assert.deepEqual(
    d!.invocation.provider_material.common_task_evidence,
    a!.invocation.provider_material.common_task_evidence,
  );
  assert.equal(
    a!.invocation.provider_material.continuation_context.filter((item) => item.role === "target")
      .length,
    1,
  );
  assert.equal(
    b!.invocation.provider_material.continuation_context.filter((item) => item.role === "target")
      .length,
    0,
  );
  assert.equal(c!.invocation.provider_material.stale_relation?.applies_before_outcome, true);
  assert.equal(
    prepared.representative_shape_plan.twin_b_identity_separation_witness
      .exact_provider_body_equal,
    true,
  );
  assert.equal(
    prepared.representative_shape_plan.twin_b_identity_separation_witness
      .live_eligible,
    false,
  );
  assert.equal(
    prepared.representative_shape_plan.twin_b_identity_separation_witness
      .cohort_refs_distinct,
    true,
  );
  assert.equal(
    prepared.representative_shape_plan.twin_b_identity_separation_witness
      .call_slot_ids_distinct,
    true,
  );
  assert.equal(
    prepared.representative_shape_plan.twin_b_identity_separation_witness
      .repeat_blocks_distinct,
    true,
  );
  assert.equal(
    prepared.representative_shape_plan.twin_b_identity_separation_witness
      .canonical_openai_json_request_body_bytes_equal,
    true,
  );
  assert.equal(new Set(prepared.plan.entries.map((entry) => entry.call_slot_id)).size, 4);
  assert.equal(
    new Set(
      prepared.plan.entries.map((entry) => entry.request_family_trace_id),
    ).size,
    4,
  );
  assert.equal(
    new Set(prepared.plan.entries.map((entry) => entry.client_request_id)).size,
    4,
  );
  for (const entry of prepared.plan.entries) {
    assert.match(entry.call_slot_id, /^e2r2p6c-call-/u);
    assert.equal(entry.call_slot_id.startsWith("e2r2p-call-"), false);
    assert.equal(entry.call_slot_id.startsWith("e2-call-"), false);
    assert.equal(entry.call_slot_id.startsWith("e2p-call-"), false);
    const schema =
      operationalReentryMatchedCohortResponseSchemaV04(
        entry.invocation.provider_material,
      );
    assert.doesNotThrow(() =>
      validateOpenAIStrictSchemaSupportedSubsetV01(schema),
    );
    const schemaText = canonicalizeProtocolValueV01(schema);
    assert.equal(schemaText.includes("common_task_evidence_fingerprint"), false);
    assert.equal(schemaText.includes("check_token"), false);
    assert.equal(schemaText.includes("target_disposition"), false);
    assert.equal(schemaText.includes("uniqueItems"), false);
    const selectionKeys = Object.keys(
      schema.properties.referenced_continuation_selections.properties,
    ).sort();
    const expectedSelectionKeys = (
      entry.invocation.provider_material.allowed_output.referenced_continuation_tokens.length ===
      0
        ? ["no_continuation_available"]
        : [...entry.invocation.provider_material.allowed_output.referenced_continuation_tokens]
    ).sort();
    assert.deepEqual(selectionKeys, expectedSelectionKeys);
    assert.equal(
      Object.values(
        schema.properties.referenced_continuation_selections.properties,
      ).every((property) => property.type === "boolean"),
      true,
    );
    const request =
      projectOperationalReentryMatchedCohortProviderRequestV04(
        entry.invocation,
      );
    assert.equal(
      request.request_fingerprint,
      entry.provider_visible_request_fingerprint,
    );
    assert.equal(request.request_body.includes(entry.request_family_trace_id), false);
    assert.equal(request.request_body.includes(entry.client_request_id), false);
    const requestBody = JSON.parse(request.request_body) as {
      text: { format: { schema: unknown } };
    };
    assert.equal(
      createProtocolSha256V01(
        canonicalizeProtocolValueV01(requestBody.text.format.schema),
      ),
      entry.schema_fingerprint,
    );
  }
  assert.deepEqual(MODEL_PROVIDER_REQUEST_FAMILY_KINDS_V01, [
    "cohort_attempt",
    "compatibility_probe",
    "replacement_cohort",
    "clean_control_compatibility_probe",
    "parser_closed_compatibility_probe",
    "parser_closed_clean_control_cohort",
    "operational_reentry_v04_compatibility_probe",
  ]);
  const traceBasis = createProtocolSha256V01("same-basis");
  const familyTraces = MODEL_PROVIDER_REQUEST_FAMILY_KINDS_V01.map(
    (request_family_kind) =>
      createDeterministicModelProviderRequestTraceV01({
        request_family_kind,
        request_family_fingerprint: traceBasis,
      }),
  );
  assert.equal(new Set(familyTraces).size, 7);
  assert.equal(
    prepared.pricing.aggregate_worst_case_cost_nano_usd,
    46_796_800,
  );
  assert.equal(
    prepared.pricing.aggregate_ceiling_nano_usd,
    ACGC_E2R2P6C_AGGREGATE_COST_CEILING_NANO_USD_V01,
  );
  assert.equal(
    prepared.pricing.pricing_source_version,
    "openai_gpt-4.1-mini-2025-04-14_2026-08-22",
  );
  assert.equal(
    prepared.manifest.route.purpose,
    OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01,
  );
  assert.equal(
    prepared.manifest.route.adapter_implementation_version,
    OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V06,
  );
  assert.equal(
    prepared.manifest.route.provider_contract_version,
    "operational_reentry_clean_control_matched_cohort_provider_contract.v0.4",
  );
  assert.equal(prepared.manifest.route.response_bytes, 1168);
  assert.equal(prepared.manifest.route.max_output_tokens, 1168);
  assert.equal(
    prepared.provider_contract.integrity.fingerprint,
    "sha256:1ca7da7cf3870de67fdbe36f1a6bf9d67a3a50accbd8f7daf147e424901eda52",
  );
  assert.equal(
    prepared.manifest.adapter_request_route_fingerprint,
    "sha256:7418f3ace51f53a8089c33392dc00d697f21ab383a4c4442fc4ffdc39efea0fa",
  );
  const artifactPlan =
    projectOperationalReentryV04ProviderCompatibilityProbePlanForArtifactV01(
      prepared.plan,
    );
  assert.equal(JSON.stringify(artifactPlan).includes('"invocation":'), false);
  return {
    representative_shape_plan_fingerprint:
      prepared.representative_shape_plan.integrity.fingerprint,
    twin_b_zero_egress_witness_fingerprint:
      prepared.representative_shape_plan.twin_b_identity_separation_witness
        .integrity.fingerprint,
    route_fingerprint: prepared.manifest.route.integrity_fingerprint,
    provider_contract_fingerprint:
      prepared.provider_contract.integrity.fingerprint,
    adapter_request_route_fingerprint:
      prepared.manifest.adapter_request_route_fingerprint,
    pricing_fingerprint: prepared.pricing.integrity.fingerprint,
    pricing_snapshot_evaluated_at: prepared.pricing.evaluated_at,
    pricing_authority_fingerprint:
      prepared.pricing.gateway_cost_budget.authority.pricing_fingerprint,
    aggregate_worst_case_cost_nano_usd:
      prepared.pricing.aggregate_worst_case_cost_nano_usd,
  };
}

async function verifySharedGatewayFourShapeProbeV01(
  admission: ModelGatewayInteractiveAdmissionV01,
): Promise<{ fake_transport_calls: 4 }> {
  const requests: OpenAIResponsesTransportRequestV01[] = [];
  let prepared: OperationalReentryV04ProviderCompatibilityProbePreparedV01;
  const adapter = adapterV01(async (request) => {
    const entry = prepared.plan.entries[requests.length]!;
    requests.push(request);
    return acceptedResponseV01(
      buildOperationalReentryMatchedCohortGoldenWireOutputV04(entry.shape),
    );
  });
  const route = await routeV01(adapter);
  const authorization = authorizationV01(admission, route, "accepted-four");
  const buildInput = {
    authorization,
    admission,
    route,
    repository_identity: repositoryIdentity,
    evaluated_at: evaluatedAt,
  };
  prepared =
    buildOperationalReentryV04ProviderCompatibilityProbeV01(
      buildInput,
    );
  validateModelInvocationEnvelopeV01(
    buildOperationalReentryV04ProviderCompatibilityProbeModelInvocationEnvelopeV01(
      prepared.plan.entries[0]!,
      prepared,
      admission,
      new AbortController().signal,
    ),
  );
  let consumptions = 0;
  const result =
    await runOperationalReentryV04ProviderCompatibilityProbeV01(
      buildInput,
      dependenciesV01(adapter, route, {
        consume_authorization() {
          consumptions += 1;
        },
      }),
    );
  assert.equal(
    requests.length,
    4,
    JSON.stringify(
      result.shapes.map((shape) => ({
        category: shape.terminal_category,
        failure_code: shape.terminal_failure_code,
      })),
    ),
  );
  assert.equal(consumptions, 1);
  assert.equal(result.report.outcome, "accepted_all_shapes");
  assert.equal(result.report.attempted_provider_calls, 4);
  assert.equal(result.report.accepted_and_normalized_shapes, 4);
  assert.equal(result.report.authorization_consumed, true);
  assert.deepEqual(
    result.shapes.map((shape) => shape.terminal_category),
    Array(4).fill("accepted_and_normalized"),
  );
  for (const [index, request] of requests.entries()) {
    const entry = result.plan.entries[index]!;
    assert.equal(
      request.headers["X-Client-Request-Id"],
      entry.client_request_id,
    );
    assert.equal(request.body.includes(entry.request_family_trace_id), false);
    const requestRecord = JSON.parse(request.body) as { model: string };
    assert.equal(requestRecord.model, "gpt-4.1-mini-2025-04-14");
    assert.equal(
      createProtocolSha256V01(request.body),
      entry.provider_visible_request_fingerprint,
    );
    assert.doesNotThrow(() =>
      validateModelInvocationReceiptV02(result.shapes[index]!.receipt!),
    );
    assert.equal(result.shapes[index]!.receipt?.egress_attempted, true);
    assert.equal(
      result.shapes[index]!.receipt?.purpose,
      OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01,
    );
    assert.equal(
      result.shapes[index]!.receipt?.final_implementation_version,
      OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V06,
    );
  }
  const historicalRoute =
    await prepareOperationalReentryMatchedCohortModelGatewayRouteV01({
      adapter,
    });
  assert.ok(historicalRoute);
  assert.equal(
    historicalRoute.purpose,
    OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
  );
  assert.equal(
    historicalRoute.adapter_implementation_version,
    "openai_responses_operational_reentry_matched_cohort_adapter.v0.3",
  );
  return { fake_transport_calls: 4 };
}

async function verifyTerminalMappingsV01(
  admission: ModelGatewayInteractiveAdmissionV01,
): Promise<void> {
  const failures: Array<{
    stage: ModelProviderResponseInvalidStageV01;
    transport: OpenAIResponsesTransportV01;
    incomplete_reason?: "max_output_tokens";
  }> = [
    {
      stage: "response_json_unreadable",
      transport: async () => ({
        ok: true,
        status: 200,
        async json() {
          throw new Error("raw-json-error-must-not-escape");
        },
      }),
    },
    {
      stage: "response_envelope_invalid",
      transport: async () => ({
        ok: true,
        status: 200,
        async json() {
          return [];
        },
      }),
    },
    {
      stage: "response_status_not_completed",
      incomplete_reason: "max_output_tokens",
      transport: async () => ({
        ok: true,
        status: 200,
        async json() {
          return {
            status: "incomplete",
            incomplete_details: { reason: "max_output_tokens" },
            output_text: "raw-incomplete-output-must-not-escape",
          };
        },
      }),
    },
    {
      stage: "response_output_text_missing",
      transport: async () => ({
        ok: true,
        status: 200,
        async json() {
          return { status: "completed" };
        },
      }),
    },
    {
      stage: "response_output_text_out_of_bounds",
      transport: async () => ({
        ok: true,
        status: 200,
        async json() {
          return {
            status: "completed",
            output_text: "x".repeat(
              OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V04.responseBytes +
                1,
            ),
          };
        },
      }),
    },
    {
      stage: "response_usage_invalid",
      transport: async () =>
        acceptedResponseV01(
          buildOperationalReentryMatchedCohortGoldenWireOutputV04("A"),
          { input_tokens: 2, output_tokens: 2, total_tokens: 1 },
        ),
    },
    {
      stage: "response_wire_json_invalid",
      transport: async () => acceptedResponseTextV01("{"),
    },
    {
      stage: "response_wire_shape_invalid",
      transport: async () => acceptedResponseTextV01("[]"),
    },
    {
      stage: "response_wire_value_invalid",
      transport: async () =>
        acceptedResponseV01({
          ...buildOperationalReentryMatchedCohortGoldenWireOutputV04("A"),
          result_status: "invented",
        }),
    },
    {
      stage: "response_wire_selection_invalid",
      transport: async () => {
        const output =
          buildOperationalReentryMatchedCohortGoldenWireOutputV04("A");
        delete output.operation_action_class_selections.bounded_result_review;
        return acceptedResponseV01(output);
      },
    },
  ];
  for (const failure of failures) {
    const invalid = await runScenarioV01(
      admission,
      failure.stage,
      failure.transport,
    );
    assert.equal(invalid.transport_calls, 1);
    assert.equal(invalid.result.report.outcome, "provider_response_invalid");
    assert.deepEqual(
      invalid.result.shapes.map((shape) => shape.terminal_category),
      [
        "provider_response_invalid",
        "not_attempted_after_terminal_failure",
        "not_attempted_after_terminal_failure",
        "not_attempted_after_terminal_failure",
      ],
    );
    const observation =
      invalid.result.shapes[0]!.provider_response_invalid_observation;
    assert.ok(observation);
    assert.equal(observation.stage, failure.stage);
    assert.equal(
      observation.incomplete_reason,
      failure.incomplete_reason ?? null,
    );
    assert.equal(observation.client_request_id, invalid.result.shapes[0]!.client_request_id);
    assert.equal(
      observation.route_fingerprint,
      invalid.result.shapes[0]!.adapter_request_route_fingerprint,
    );
    assert.equal(
      JSON.stringify(invalid.result).includes("raw-"),
      false,
    );
  }
  const rejected = await runScenarioV01(admission, "rejected", async () =>
    rejectedResponseV01(429),
  );
  assert.equal(rejected.transport_calls, 1);
  assert.equal(rejected.result.report.outcome, "provider_rejected");
  const observation =
    rejected.result.shapes[0]!.provider_rejection_observation;
  assert.ok(observation);
  assert.equal(observation.http_status, 429);
  assert.equal(observation.error_type, "synthetic_error");
  assert.equal(observation.error_code, "synthetic_429");
  assert.equal(observation.error_param, "text.format.schema");
  assert.equal(
    JSON.stringify(rejected.result).includes("raw provider error must not persist"),
    false,
  );
  assert.equal(
    deriveOperationalReentryV04ProviderCompatibilityProbeOutcomeV01(
      [],
    ),
    "not_run",
  );
}

async function verifyAuthorizationRefusalsV01(
  admission: ModelGatewayInteractiveAdmissionV01,
): Promise<void> {
  const route = await routeV01(
    adapterV01(async () => {
      throw new Error("authorization checks must remain before transport");
    }),
  );
  const authorization = authorizationV01(admission, route, "refusals");
  const build = (
    changedAuthorization: OperationalReentryV04ProviderCompatibilityProbeAuthorizationV01,
    changedAdmission = admission,
  ) =>
    buildOperationalReentryV04ProviderCompatibilityProbeV01({
      authorization: changedAuthorization,
      admission: changedAdmission,
      route,
      repository_identity: repositoryIdentity,
      evaluated_at: evaluatedAt,
    });
  for (const override of [
    { workspace_id: "workspace:changed" },
    { project_id: "project:changed" },
    { expected_active_selection_revision: 999 },
    { project_root_fingerprint: createProtocolSha256V01("changed-root") },
    { case_fingerprint: createProtocolSha256V01("changed-case") },
    {
      common_task_evidence_fingerprint:
        createProtocolSha256V01("changed-evidence"),
    },
    {
      representative_shape_plan_fingerprint:
        createProtocolSha256V01("changed-plan"),
    },
    {
      twin_b_zero_egress_witness_fingerprint:
        createProtocolSha256V01("changed-twin-b-witness"),
    },
    { route_fingerprint: createProtocolSha256V01("changed-route") },
    {
      provider_contract_fingerprint:
        createProtocolSha256V01("changed-contract"),
    },
    {
      adapter_request_route_fingerprint:
        createProtocolSha256V01("changed-adapter-route"),
    },
    { response_bytes: 1167 },
    { max_output_tokens: 1167 },
    { final_request_bytes: 24_575 },
    { pricing_fingerprint: createProtocolSha256V01("changed-pricing") },
    {
      pricing_authority_fingerprint:
        createProtocolSha256V01("changed-authority"),
    },
    { pricing_authority_expires_at: "2026-08-25T00:00:00.000Z" },
    { maximum_total_cost_nano_usd: 1 },
    { exact_merged_source_head: "e1c6aa46960bf3d983818faba0d9531d3e3333fa" },
    { second_probe_authorized: true },
    { historical_authorization_reuse: true },
    { adaptive_prompt_schema_or_input_changes: true },
    { behavioral_cohort_authorized: true },
    { replication_authorized: true },
    { policy_authorized: true },
    { stage_7_authorized: true },
  ]) {
    assert.throws(
      () => build(resealAuthorizationV01({ ...authorization, ...override })),
      /operational_reentry_v04_probe_authorization_mismatched/,
    );
  }
  const changedAdmission = {
    ...admission,
    expected_active_selection_revision:
      admission.expected_active_selection_revision + 1,
  };
  assert.throws(
    () => build(authorization, changedAdmission),
    /operational_reentry_v04_probe_authorization_mismatched/,
  );
  const { integrity_fingerprint: _routeFingerprint, ...routeWithoutFingerprint } =
    route;
  const changedBudgetRoute = {
    ...routeWithoutFingerprint,
    max_output_tokens: 1167,
    integrity_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        ...routeWithoutFingerprint,
        max_output_tokens: 1167,
      }),
    ),
  } as typeof route;
  assert.throws(
    () =>
      buildOperationalReentryV04ProviderCompatibilityProbeV01({
        authorization,
        admission,
        route: changedBudgetRoute,
        repository_identity: repositoryIdentity,
        evaluated_at: evaluatedAt,
      }),
    /operational_reentry_v04_probe_route_mismatch/,
  );
  assert.throws(
    () =>
      buildOperationalReentryV04ProviderCompatibilityProbeV01({
        authorization,
        admission,
        route,
        repository_identity: repositoryIdentity,
        evaluated_at: "2026-08-29T00:00:00.000Z",
      }),
    /model_gateway_pricing_stale/,
  );
  assert.throws(
    () =>
      buildOperationalReentryV04ProviderCompatibilityProbeV01({
        authorization,
        admission,
        route,
        repository_identity: {
          ...repositoryIdentity,
          origin: "https://example.invalid/repository.git",
        },
        evaluated_at: evaluatedAt,
      }),
    /operational_reentry_v04_probe_repository_origin_mismatch/,
  );
  assert.equal(fakeTransportCalls >= 6, true);
}

async function verifyArtifactSingleUseAndPrivacyV01(
  admission: ModelGatewayInteractiveAdmissionV01,
): Promise<void> {
  let prepared: OperationalReentryV04ProviderCompatibilityProbePreparedV01;
  let callIndex = 0;
  const adapter = adapterV01(async () => {
    const entry = prepared.plan.entries[callIndex++]!;
    return acceptedResponseV01(
      buildOperationalReentryMatchedCohortGoldenWireOutputV04(entry.shape),
    );
  });
  const route = await routeV01(adapter);
  const authorization = authorizationV01(admission, route, "artifacts");
  const buildInput = {
    authorization,
    admission,
    route,
    repository_identity: repositoryIdentity,
    evaluated_at: evaluatedAt,
  };
  prepared =
    buildOperationalReentryV04ProviderCompatibilityProbeV01(
      buildInput,
    );
  const journal =
    beginOperationalReentryV04ProviderCompatibilityProbeAttemptV01({
      repository_root: projectRoot,
      prepared,
    });
  const result =
    await runOperationalReentryV04ProviderCompatibilityProbeV01(
      buildInput,
      dependenciesV01(adapter, route, {
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
  assert.deepEqual(
    validateOperationalReentryV04ProviderCompatibilityProbeArtifactsV01(
      { repository_root: projectRoot, run_root: journal.run_root },
    ),
    summary,
  );
  assert.match(
    summary.relative_run_root,
    /^\.augnes-lab\/operational-reentry-v04-provider-probes\/[^/]+\/issue-[1-9][0-9]*$/u,
  );
  assert.equal(summary.authorization_consumed, true);
  const familyRoot = path.join(
    projectRoot,
    ".augnes-lab",
    "operational-reentry-v04-provider-probes",
  );
  assert.equal(
    readdirSync(path.join(familyRoot, "authorization-consumptions")).length,
    1,
  );
  const stored = readTreeV01(familyRoot);
  for (const forbidden of [
    "test-credential-never-persisted",
    '"request_body"',
    '"headers"',
    "/Users/",
    "/home/",
    '"invocation"',
    '"e1_evaluation"',
    '"pairwise_relations"',
    '"conditioning_disposition"',
    '"reset_disposition"',
  ]) {
    assert.equal(stored.includes(forbidden), false, forbidden);
  }
  let secondTransportCalls = 0;
  const laterAdapter = adapterV01(async () => {
    secondTransportCalls += 1;
    throw new Error("reused authorization must not reach transport");
  });
  const laterRoute = await routeV01(laterAdapter);
  const laterPrepared =
    buildOperationalReentryV04ProviderCompatibilityProbeV01({
      authorization,
      admission,
      route: laterRoute,
      repository_identity: repositoryIdentity,
      evaluated_at: "2026-08-22T08:30:00.000Z",
    });
  const tamperedProbeId = structuredClone(laterPrepared);
  tamperedProbeId.manifest.probe_id =
    `${tamperedProbeId.manifest.probe_id}-changed`;
  assert.throws(
    () =>
      beginOperationalReentryV04ProviderCompatibilityProbeAttemptV01({
        repository_root: projectRoot,
        prepared: tamperedProbeId,
      }),
    /operational_reentry_v04_probe_authorization_global_collision_refused/,
  );
  assert.equal(secondTransportCalls, 0);
  const collisionAuthorization = authorizationV01(
    admission,
    route,
    "root-collision",
  );
  const collisionPrepared =
    buildOperationalReentryV04ProviderCompatibilityProbeV01({
      authorization: collisionAuthorization,
      admission,
      route,
      repository_identity: repositoryIdentity,
      evaluated_at: evaluatedAt,
    });
  const collisionJournal =
    beginOperationalReentryV04ProviderCompatibilityProbeAttemptV01({
      repository_root: projectRoot,
      prepared: collisionPrepared,
    });
  const collisionEntry = collisionPrepared.plan.entries[0]!;
  assert.throws(
    () =>
      collisionJournal.append_shape({
        ...structuredClone(result.shapes[0]!),
        canonical_order: collisionEntry.canonical_order,
        shape: collisionEntry.shape,
        call_slot_id: collisionEntry.call_slot_id,
        request_family_trace_id: collisionEntry.request_family_trace_id,
        client_request_id: collisionEntry.client_request_id,
        local_invocation_identity_fingerprint:
          collisionEntry.local_invocation_identity_fingerprint,
        schema_fingerprint: collisionEntry.schema_fingerprint,
        provider_visible_request_fingerprint:
          collisionEntry.provider_visible_request_fingerprint,
        route_fingerprint:
          collisionPrepared.manifest.route.integrity_fingerprint,
        adapter_request_route_fingerprint:
          collisionEntry.adapter_request_route_fingerprint,
        provider_contract_fingerprint:
          collisionPrepared.provider_contract.integrity.fingerprint,
        pricing_fingerprint: collisionPrepared.pricing.integrity.fingerprint,
        terminal_category: "provider_response_invalid",
        provider_rejection_observation: null,
        provider_response_invalid_observation: {
          observation_version:
            "model_provider_response_invalid_observation.v0.1",
          stage: "invented_stage",
          provider_status: null,
          incomplete_reason: null,
          output_text_present: false,
          provider_request_id: null,
          client_request_id: collisionEntry.client_request_id,
          route_fingerprint:
            collisionEntry.adapter_request_route_fingerprint,
          request_fingerprint:
            collisionEntry.provider_visible_request_fingerprint,
          schema_fingerprint: collisionEntry.schema_fingerprint,
        },
      } as never),
    /operational_reentry_v04_probe_response_invalid_observation_malformed/,
  );
  assert.throws(
    () =>
      collisionJournal.append_shape({
        ...structuredClone(result.shapes[0]!),
        canonical_order: collisionEntry.canonical_order,
        shape: collisionEntry.shape,
        call_slot_id: collisionEntry.call_slot_id,
        request_family_trace_id: collisionEntry.request_family_trace_id,
        client_request_id: collisionEntry.client_request_id,
        local_invocation_identity_fingerprint:
          collisionEntry.local_invocation_identity_fingerprint,
        schema_fingerprint: collisionEntry.schema_fingerprint,
        provider_visible_request_fingerprint:
          collisionEntry.provider_visible_request_fingerprint,
        route_fingerprint:
          collisionPrepared.manifest.route.integrity_fingerprint,
        adapter_request_route_fingerprint:
          collisionEntry.adapter_request_route_fingerprint,
        provider_contract_fingerprint:
          collisionPrepared.provider_contract.integrity.fingerprint,
        pricing_fingerprint: collisionPrepared.pricing.integrity.fingerprint,
        terminal_category: "provider_rejected",
        provider_rejection_observation: {
          observation_version: "model_provider_rejection_observation.v0.1",
          http_status: 429,
          error_type: "rate_limit",
          error_code: null,
          error_param: null,
          provider_request_id: "req_bounded",
          client_request_id: collisionEntry.client_request_id,
          route_fingerprint:
            collisionEntry.adapter_request_route_fingerprint,
          request_fingerprint:
            collisionEntry.provider_visible_request_fingerprint,
          schema_fingerprint: collisionEntry.schema_fingerprint,
          unexpected_field: "must_not_persist",
        },
        provider_response_invalid_observation: null,
      } as never),
    /operational_reentry_v04_probe_rejection_observation_malformed/,
  );
  assert.throws(
    () =>
      beginOperationalReentryV04ProviderCompatibilityProbeAttemptV01({
        repository_root: projectRoot,
        prepared: collisionPrepared,
      }),
    /operational_reentry_v04_probe_authorization_collision_refused/,
  );
  for (const relative_run_root of [
    ".augnes-lab/operational-reentry-provider-probes/other/issue-193",
    ".augnes-lab/operational-reentry-matched-cohort-replacements/other/issue-199",
    ".augnes-lab/operational-reentry-clean-control-provider-probes/other/issue-208",
    ".augnes-lab/operational-reentry-v04-provider-probes/cohort_attempt/issue-999",
    ".augnes-lab/operational-reentry-v04-provider-probes/behavioral_cohort/issue-999",
    ".augnes-lab/operational-reentry-v04-provider-probes/other/issue-998",
  ]) {
    assert.throws(
      () =>
        assertOperationalReentryV04ProviderCompatibilityProbeArtifactRootAvailableV01(
          { repository_root: projectRoot, relative_run_root },
        ),
      /operational_reentry_v04_probe_historical_or_cohort_root_refused/,
    );
  }
  const symlinkRoot = path.join(
    projectRoot,
    ".augnes-lab",
    "operational-reentry-v04-provider-probes",
    "operational-reentry-v04-provider-probe_0123456789abcdef0123456789abcdef",
    "issue-999",
  );
  mkdirSync(path.dirname(symlinkRoot), { recursive: true });
  symlinkSync(root, symlinkRoot);
  assert.throws(
    () =>
      assertOperationalReentryV04ProviderCompatibilityProbeArtifactRootAvailableV01(
        {
          repository_root: projectRoot,
          relative_run_root:
            ".augnes-lab/operational-reentry-v04-provider-probes/operational-reentry-v04-provider-probe_0123456789abcdef0123456789abcdef/issue-999",
        },
      ),
    /operational_reentry_v04_probe_artifact_symlink_refused/,
  );
  for (const payload of [
    { request_body: "forbidden" },
    { headers: { Authorization: "Bearer forbidden" } },
    { private_path: "/Users/private/value" },
    { credential: "sk-1234567890" },
    { core_records: [] },
    { e1_evaluation: {} },
  ]) {
    assert.throws(
      () =>
        assertOperationalReentryV04ProviderCompatibilityProbeArtifactPayloadSafeV01(
          payload,
        ),
      /operational_reentry_v04_probe_artifact_/,
    );
  }
  const indexPath = path.join(journal.run_root, "artifact-index.json");
  const validIndexText = readFileSync(indexPath, "utf8");
  const validIndex = JSON.parse(validIndexText) as {
    probe_id: string;
    source_repository_head_sha: string;
    future_live_issue_number: number;
    request_family_kind: string;
    outcome: string;
    artifacts: Array<{ path: string; fingerprint: string }>;
  };
  const memberContents = new Map(
    validIndex.artifacts.map((artifact) => [
      artifact.path,
      readFileSync(path.join(journal.run_root, artifact.path), "utf8"),
    ]),
  );
  for (const tamper of [
    {
      field: "outcome",
      value:
        validIndex.outcome === "accepted_all_shapes"
          ? "provider_rejected"
          : "accepted_all_shapes",
    },
    { field: "probe_id", value: `${validIndex.probe_id}-tampered` },
    { field: "source_repository_head_sha", value: "d".repeat(40) },
    {
      field: "future_live_issue_number",
      value: validIndex.future_live_issue_number + 1,
    },
    {
      field: "request_family_kind",
      value: "clean_control_compatibility_probe",
    },
  ] as const) {
    const tamperedIndex = structuredClone(validIndex) as Record<
      string,
      unknown
    >;
    tamperedIndex[tamper.field] = tamper.value;
    writeFileSync(
      indexPath,
      `${canonicalizeProtocolValueV01(tamperedIndex)}\n`,
      "utf8",
    );
    assert.throws(
      () =>
        validateOperationalReentryV04ProviderCompatibilityProbeArtifactsV01(
          { repository_root: projectRoot, run_root: journal.run_root },
        ),
      /operational_reentry_v04_probe_artifact_index_source_mismatch/,
      tamper.field,
    );
    for (const [artifactPath, contents] of memberContents) {
      assert.equal(
        readFileSync(path.join(journal.run_root, artifactPath), "utf8"),
        contents,
        `${tamper.field}:${artifactPath}`,
      );
    }
  }
  writeFileSync(indexPath, validIndexText, "utf8");
  for (const crossLinkTamper of [
    {
      artifactPath: "plan.json",
      mutate(value: Record<string, unknown>) {
        value.future_live_issue_number =
          Number(value.future_live_issue_number) + 1;
      },
    },
    {
      artifactPath: "identities.json",
      mutate(value: Record<string, unknown>) {
        value.twin_b_zero_egress_witness_fingerprint =
          createProtocolSha256V01("coordinated-twin-b-tamper");
      },
    },
  ]) {
    const artifactPath = path.join(
      journal.run_root,
      crossLinkTamper.artifactPath,
    );
    const validArtifactText = readFileSync(artifactPath, "utf8");
    const tamperedArtifact = JSON.parse(validArtifactText) as Record<
      string,
      unknown
    >;
    crossLinkTamper.mutate(tamperedArtifact);
    const tamperedArtifactText = `${canonicalizeProtocolValueV01(
      tamperedArtifact,
    )}\n`;
    writeFileSync(artifactPath, tamperedArtifactText, "utf8");
    const crossLinkedIndex = JSON.parse(validIndexText) as typeof validIndex;
    const indexedArtifact = crossLinkedIndex.artifacts.find(
      (artifact) => artifact.path === crossLinkTamper.artifactPath,
    );
    assert.ok(indexedArtifact);
    indexedArtifact.fingerprint = createProtocolSha256V01(
      tamperedArtifactText.trimEnd(),
    );
    writeFileSync(
      indexPath,
      `${canonicalizeProtocolValueV01(crossLinkedIndex)}\n`,
      "utf8",
    );
    assert.throws(
      () =>
        validateOperationalReentryV04ProviderCompatibilityProbeArtifactsV01(
          { repository_root: projectRoot, run_root: journal.run_root },
        ),
      /operational_reentry_v04_probe_artifact_cross_link_invalid/,
      crossLinkTamper.artifactPath,
    );
    writeFileSync(artifactPath, validArtifactText, "utf8");
    writeFileSync(indexPath, validIndexText, "utf8");
  }
  const malformedIndex = JSON.parse(
    validIndexText,
  ) as Record<string, unknown>;
  malformedIndex.unexpected_field = false;
  writeFileSync(indexPath, `${JSON.stringify(malformedIndex)}\n`, "utf8");
  assert.throws(
    () =>
      validateOperationalReentryV04ProviderCompatibilityProbeArtifactsV01(
        { repository_root: projectRoot, run_root: journal.run_root },
      ),
    /operational_reentry_v04_probe_artifact_index_invalid/,
  );
}

async function verifyArtifactConsumptionWriteFailureFailsClosedV01(
  admission: ModelGatewayInteractiveAdmissionV01,
): Promise<void> {
  let prepared: OperationalReentryV04ProviderCompatibilityProbePreparedV01;
  let partialTransportCalls = 0;
  const adapter = adapterV01(async () => {
    partialTransportCalls += 1;
    const entry = prepared.plan.entries[partialTransportCalls - 1]!;
    return acceptedResponseV01(
      buildOperationalReentryMatchedCohortGoldenWireOutputV04(entry.shape),
    );
  });
  const route = await routeV01(adapter);
  const authorization = authorizationV01(
    admission,
    route,
    "consumption-write-failure",
  );
  const buildInput = {
    authorization,
    admission,
    route,
    repository_identity: repositoryIdentity,
    evaluated_at: evaluatedAt,
  };
  prepared =
    buildOperationalReentryV04ProviderCompatibilityProbeV01(
      buildInput,
    );
  const journal =
    beginOperationalReentryV04ProviderCompatibilityProbeAttemptV01({
      repository_root: projectRoot,
      prepared,
    });
  const runLocalConsumptionPath = path.join(
    journal.run_root,
    "authorization-consumed.json",
  );
  mkdirSync(runLocalConsumptionPath);
  const fakeTransportCallsBefore = fakeTransportCalls;
  const result =
    await runOperationalReentryV04ProviderCompatibilityProbeV01(
      buildInput,
      dependenciesV01(adapter, route, {
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
  assert.equal(partialTransportCalls, 0);
  assert.equal(fakeTransportCalls, fakeTransportCallsBefore);
  assert.equal(result.report.authorization_consumed, false);
  assert.equal(result.report.outcome, "transport_or_runtime_incomplete");
  assert.equal(result.shapes[0]?.terminal_category, "transport_failed");
  assert.equal(
    result.shapes.filter(
      (shape) =>
        shape.terminal_category === "not_attempted_after_terminal_failure",
    ).length,
    3,
  );

  const familyRoot = path.join(
    projectRoot,
    ".augnes-lab",
    "operational-reentry-v04-provider-probes",
  );
  const globalConsumptionPath = path.join(
    familyRoot,
    "authorization-consumptions",
    `${authorization.integrity.fingerprint.replaceAll(":", "_")}.json`,
  );
  assert.equal(existsSync(globalConsumptionPath), true);
  assert.equal(lstatSync(globalConsumptionPath).isFile(), true);
  assert.equal(lstatSync(runLocalConsumptionPath).isDirectory(), true);
  assert.equal(existsSync(path.join(journal.run_root, "report.json")), false);
  assert.equal(
    existsSync(path.join(journal.run_root, "artifact-index.json")),
    false,
  );
  const partialTreeBefore = readTreeV01(journal.run_root);
  const globalConsumptionBefore = readFileSync(globalConsumptionPath, "utf8");
  assert.throws(
    () => journal.finalize(result),
    /operational_reentry_v04_probe_authorization_consumption_history_incomplete/,
  );
  assert.throws(
    () =>
      validateOperationalReentryV04ProviderCompatibilityProbeArtifactsV01(
        { repository_root: projectRoot, run_root: journal.run_root },
      ),
    /operational_reentry_v04_probe_authorization_consumption_history_incomplete/,
  );
  assert.throws(
    () =>
      beginOperationalReentryV04ProviderCompatibilityProbeAttemptV01({
        repository_root: projectRoot,
        prepared,
      }),
    /operational_reentry_v04_probe_authorization_global_collision_refused/,
  );
  assert.equal(readTreeV01(journal.run_root), partialTreeBefore);
  assert.equal(
    readFileSync(globalConsumptionPath, "utf8"),
    globalConsumptionBefore,
  );
  assert.equal(existsSync(globalConsumptionPath), true);
  assert.equal(existsSync(path.join(journal.run_root, "report.json")), false);
  assert.equal(
    existsSync(path.join(journal.run_root, "artifact-index.json")),
    false,
  );
}

function verifyMergedMainPreflightV01(): void {
  const repository = path.join(root, "preflight-repository");
  mkdirSync(repository, { recursive: true });
  const git = (args: string[]): string =>
    execFileSync("git", ["-C", repository, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  git(["init", "--initial-branch=main"]);
  git(["config", "user.name", "E2R2P1 Test"]);
  git(["config", "user.email", "e2r2p1-test@example.invalid"]);
  git(["config", "commit.gpgsign", "false"]);
  git(["remote", "add", "origin", repositoryIdentity.origin]);
  writeFileSync(path.join(repository, "baseline.txt"), "merged main\n");
  git(["add", "baseline.txt"]);
  git(["commit", "-m", "merged main"]);
  const mainHead = git(["rev-parse", "HEAD"]);
  git(["update-ref", "refs/remotes/origin/main", mainHead]);
  const exactRepository = realpathSync(repository);
  const identity = {
    exact_merged_source_head: mainHead,
    repository_slug: repositoryIdentity.repository_slug,
    authorized_origin: repositoryIdentity.origin,
  };
  assert.doesNotThrow(() =>
    preflightOperationalReentryV04ProviderCompatibilityProbeRepositoryV01(
      exactRepository,
      identity,
    ),
  );
  writeFileSync(path.join(repository, "dirty.txt"), "dirty\n");
  assert.throws(
    () =>
      preflightOperationalReentryV04ProviderCompatibilityProbeRepositoryV01(
        exactRepository,
        identity,
      ),
    /operational_reentry_v04_probe_dirty_or_mismatched_head/,
  );
  rmSync(path.join(repository, "dirty.txt"));
  git(["switch", "-c", "clean-feature"]);
  writeFileSync(path.join(repository, "feature.txt"), "feature\n");
  git(["add", "feature.txt"]);
  git(["commit", "-m", "feature"]);
  const featureHead = git(["rev-parse", "HEAD"]);
  assert.throws(
    () =>
      preflightOperationalReentryV04ProviderCompatibilityProbeRepositoryV01(
        exactRepository,
        { ...identity, exact_merged_source_head: featureHead },
      ),
    /operational_reentry_v04_probe_source_head_not_exact_origin_main/,
  );
}

function verifyStaticAuthorityAndNoBehaviorV01(): void {
  assert.deepEqual(
    operationalReentryV04ProviderCompatibilityProbeHarnessAuthorityV01,
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
  const core = readFileSync(
    path.join(
      repositoryRoot,
      "lib/vnext/operational-reentry-v0-4-provider-compatibility-probe.ts",
    ),
    "utf8",
  );
  const cli = readFileSync(
    path.join(
      repositoryRoot,
      "scripts/operational-reentry-v0-4-provider-compatibility-probe.ts",
    ),
    "utf8",
  );
  assert.equal(core.includes("buildOperationalReentryEvaluationV01"), false);
  assert.equal(core.includes("evaluateOperationalReentryMatchedCohort"), false);
  assert.equal(core.includes("deriveOperationalReentryMatchedCohortPairwise"), false);
  assert.equal(core.includes("fetch("), false);
  assert.equal(core.includes("process.env"), false);
  assert.ok(
    core.includes("invokeOperationalReentryMatchedCohortModelGatewayV04"),
  );
  assert.ok(cli.includes("refs/remotes/origin/main^{commit}"));
  assert.ok(
    cli.includes("--confirm-operational-reentry-v04-provider-compatibility-probe"),
  );
  assert.ok(cli.includes("--authorization-file"));
  assert.equal(cli.includes("previous_response_id"), false);
  assert.equal(cli.includes("buildAuthorization"), false);
  assert.equal(cli.includes("String(error)"), false);
  assert.ok(cli.includes("operational_reentry_v04_probe_runtime_failed"));
}

async function runScenarioV01(
  admission: ModelGatewayInteractiveAdmissionV01,
  label: string,
  transport: OpenAIResponsesTransportV01,
) {
  let transportCalls = 0;
  const adapter = adapterV01(async (request) => {
    transportCalls += 1;
    return transport(request);
  });
  const route = await routeV01(adapter);
  const authorization = authorizationV01(admission, route, label);
  const result =
    await runOperationalReentryV04ProviderCompatibilityProbeV01(
      {
        authorization,
        admission,
        route,
        repository_identity: repositoryIdentity,
        evaluated_at: evaluatedAt,
      },
      dependenciesV01(adapter, route),
    );
  return { result, transport_calls: transportCalls };
}

function authorizationV01(
  admission: ModelGatewayInteractiveAdmissionV01,
  route: OperationalReentryMatchedCohortRouteV04,
  label: string,
  overrides: Partial<OperationalReentryV04ProviderCompatibilityProbeAuthorizationV01> = {},
): OperationalReentryV04ProviderCompatibilityProbeAuthorizationV01 {
  const expectations =
    buildOperationalReentryV04ProviderCompatibilityProbeAuthorizationExpectationsV01(
      {
        admission,
        route,
        repository_identity: repositoryIdentity,
        evaluated_at: evaluatedAt,
      },
    );
  return resealAuthorizationV01({
    authorization_version:
      OPERATIONAL_REENTRY_V04_PROVIDER_COMPATIBILITY_PROBE_AUTHORIZATION_VERSION_V01,
    authorization_id: `v04-provider-probe-${label}-${authorizationSequence++}`,
    authorization_kind:
      "one_bounded_operational_reentry_v04_provider_compatibility_probe",
    request_family_kind: "operational_reentry_v04_compatibility_probe",
    future_live_issue_number: 230,
    exact_merged_source_head: futureMergedSourceHead,
    repository_slug: expectations.repository_slug,
    authorized_origin: expectations.authorized_origin,
    issued_at: evaluatedAt,
    expires_at: "2026-08-22T09:00:00.000Z",
    workspace_id: expectations.workspace_id,
    project_id: expectations.project_id,
    expected_active_selection_revision:
      expectations.expected_active_selection_revision,
    project_root_fingerprint: expectations.project_root_fingerprint,
    gateway_authorization_project_is_lab_experiment_meaning: false,
    case_fingerprint: expectations.case_fingerprint,
    common_task_evidence_fingerprint:
      expectations.common_task_evidence_fingerprint,
    representative_shape_plan_fingerprint:
      expectations.representative_shape_plan_fingerprint,
    twin_b_zero_egress_witness_fingerprint:
      expectations.twin_b_zero_egress_witness_fingerprint,
    route_fingerprint: expectations.route_fingerprint,
    provider_contract_fingerprint:
      expectations.provider_contract_fingerprint,
    adapter_request_route_fingerprint:
      expectations.adapter_request_route_fingerprint,
    provider_contract_version:
      "operational_reentry_clean_control_matched_cohort_provider_contract.v0.4",
    codec_version: "operational_reentry_matched_cohort_codec.v0.5",
    response_schema_version:
      "operational_reentry_matched_cohort_response_schema.v0.4",
    parser_version: "operational_reentry_matched_cohort_parser.v0.4",
    adapter_implementation_id:
      "openai_responses.operational_reentry_matched_cohort",
    adapter_implementation_version:
      "openai_responses_operational_reentry_matched_cohort_adapter.v0.6",
    response_invalid_observation_version:
      "model_provider_response_invalid_observation.v0.1",
    response_bytes: 1168,
    max_output_tokens: 1168,
    final_request_bytes: 24_576,
    pricing_fingerprint: expectations.pricing_fingerprint,
    pricing_snapshot_evaluated_at:
      expectations.pricing_snapshot_evaluated_at,
    pricing_authority_fingerprint:
      expectations.pricing_authority_fingerprint,
    pricing_authority_expires_at:
      expectations.pricing_authority_expires_at,
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
    adaptive_prompt_schema_or_input_changes: false,
    stop_after_first_non_success_terminal_result: true,
    second_probe_authorized: false,
    historical_authorization_reuse: false,
    behavioral_cohort_authorized: false,
    replication_authorized: false,
    policy_authorized: false,
    stage_7_authorized: false,
    maximum_total_cost_nano_usd: 250_000_000,
    ...overrides,
  });
}

function resealAuthorizationV01(
  input: Record<string, unknown>,
): OperationalReentryV04ProviderCompatibilityProbeAuthorizationV01 {
  const { integrity: _integrity, ...payload } = input;
  return {
    ...payload,
    integrity: {
      algorithm: "sha256",
      canonicalization: "augnes-json-c14n-v0_1",
      fingerprint_scope:
        "operational_reentry_v04_probe_authorization_without_integrity_fingerprint",
      fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(payload),
      ),
    },
  } as unknown as OperationalReentryV04ProviderCompatibilityProbeAuthorizationV01;
}

function adapterV01(
  transport: Parameters<typeof createOpenAIResponsesAdapterV01>[0] extends infer Options
    ? Options extends { transport?: infer Transport }
      ? NonNullable<Transport>
      : never
    : never,
) {
  return createOpenAIResponsesAdapterV01({
    environment: {
      OPENAI_API_KEY: "test-credential-never-persisted",
      OPENAI_MODEL: "ambient-model-must-not-override-v04",
    },
    transport: async (request) => {
      fakeTransportCalls += 1;
      return transport(request);
    },
  });
}

async function routeV01(
  adapter: ReturnType<typeof createOpenAIResponsesAdapterV01>,
): Promise<OperationalReentryMatchedCohortRouteV04> {
  const route =
    await prepareOperationalReentryMatchedCohortModelGatewayRouteV04({
      adapter,
    });
  assert.ok(route);
  return route;
}

function dependenciesV01(
  adapter: ReturnType<typeof createOpenAIResponsesAdapterV01>,
  route: OperationalReentryMatchedCohortRouteV04,
  overrides: Partial<RunOperationalReentryV04ProviderCompatibilityProbeDependenciesV01> = {},
): RunOperationalReentryV04ProviderCompatibilityProbeDependenciesV01 {
  return {
    gateway_dependencies: {
      adapter,
      expected_operational_reentry_matched_cohort_v04_route: route,
      open_database: () => new Database(databasePath),
      read_root_availability: async () => "available" as const,
      now: () => new Date(evaluatedAt),
    },
    assert_source_unchanged() {},
    consume_authorization() {},
    ...overrides,
  };
}

function acceptedResponseV01(
  output: unknown,
  usage: unknown = {
    input_tokens: 120,
    input_tokens_details: { cached_tokens: 0 },
    output_tokens: 40,
    total_tokens: 160,
  },
) {
  return {
    ok: true,
    status: 200,
    headers: { get: () => null },
    async json() {
      return {
        status: "completed",
        output_text: JSON.stringify(output),
        usage,
      };
    },
    async text() {
      return "";
    },
  };
}

function acceptedResponseTextV01(outputText: string) {
  return {
    ok: true,
    status: 200,
    headers: { get: () => null },
    async json() {
      return {
        status: "completed",
        output_text: outputText,
        usage: {
          input_tokens: 120,
          input_tokens_details: { cached_tokens: 0 },
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
        return name === "x-request-id" ? `req_clean_control_${status}` : null;
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
      create_uuid: () => "11111111-1111-4111-8111-111111111111",
      now: () => "2026-08-22T07:50:00.000Z",
    });
    const localRoot = normalizeLocalProjectRootRefV01(projectRoot, {
      base_path: path.parse(projectRoot).root,
    });
    const project = getOrCreateCanonicalProjectForLocalRootV01(
      database,
      {
        workspace_id: workspace.workspace_id,
        local_root: localRoot,
        display_name: "e2r2p6c-v04-test-project",
      },
      {
        create_uuid: () => "22222222-2222-4222-8222-222222222222",
        now: () => "2026-08-22T07:51:00.000Z",
      },
    );
    const active = selectActiveProjectV01(database, {
      workspace_id: workspace.workspace_id,
      project_id: project.project.project_id,
      now: "2026-08-22T07:52:00.000Z",
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

function readTreeV01(directory: string): string {
  return readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name, "en"))
    .map((entry) => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory()
        ? readTreeV01(target)
        : readFileSync(target, "utf8");
    })
    .join("\n");
}
