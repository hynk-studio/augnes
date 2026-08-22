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
  assertOperationalReentryCleanControlProviderCompatibilityProbeArtifactPayloadSafeV02,
  assertOperationalReentryCleanControlProviderCompatibilityProbeArtifactRootAvailableV02,
  beginOperationalReentryCleanControlProviderCompatibilityProbeAttemptV02,
  validateOperationalReentryCleanControlProviderCompatibilityProbeArtifactsV02,
} from "@/lib/vnext/operational-reentry-clean-control-provider-compatibility-probe-artifact-store";
import {
  ACGC_E2R2P1_AGGREGATE_COST_CEILING_NANO_USD_V02,
  ACGC_E2R2P1_CANONICAL_SHAPE_ORDER_V02,
  buildOperationalReentryCleanControlProviderCompatibilityProbeAuthorizationExpectationsV02,
  buildOperationalReentryCleanControlProviderCompatibilityProbeModelInvocationEnvelopeV02,
  buildOperationalReentryCleanControlProviderCompatibilityProbeRepresentativeShapePlanV02,
  buildOperationalReentryCleanControlProviderCompatibilityProbeV02,
  deriveOperationalReentryCleanControlProviderCompatibilityProbeOutcomeV02,
  operationalReentryCleanControlProviderCompatibilityProbeHarnessAuthorityV02,
  projectOperationalReentryCleanControlProviderCompatibilityProbePlanForArtifactV02,
  runOperationalReentryCleanControlProviderCompatibilityProbeV02,
  type RunOperationalReentryCleanControlProviderCompatibilityProbeDependenciesV02,
} from "@/lib/vnext/operational-reentry-clean-control-provider-compatibility-probe";
import { validateOperationalReentryMatchedCohortArtifactsV01 } from "@/lib/vnext/operational-reentry-matched-cohort-artifact-store";
import { validateOperationalReentryMatchedCohortReplacementArtifactsV01 } from "@/lib/vnext/operational-reentry-matched-cohort-replacement-artifact-store";
import { buildOperationalReentryMatchedCohortCallPlanV01 } from "@/lib/vnext/operational-reentry-matched-cohort";
import { buildOperationalReentryMatchedCohortGoldenOutputV02 } from "@/lib/vnext/operational-reentry-matched-cohort-v0-2";
import { validateOperationalReentryProviderCompatibilityProbeArtifactsV01 } from "@/lib/vnext/operational-reentry-provider-compatibility-probe-artifact-store";
import {
  MODEL_PROVIDER_REQUEST_FAMILY_KINDS_V01,
  createDeterministicModelProviderRequestTraceV01,
} from "@/lib/vnext/model-gateway/provider-rejection-observation";
import {
  OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01,
} from "@/lib/vnext/model-gateway/contracts";
import { validateModelInvocationReceiptV02 } from "@/lib/vnext/model-gateway/model-invocation-receipt";
import {
  prepareOperationalReentryMatchedCohortModelGatewayRouteV01,
  prepareOperationalReentryMatchedCohortModelGatewayRouteV02,
  projectOperationalReentryMatchedCohortProviderRequestV02,
  validateModelInvocationEnvelopeV01,
  type ModelGatewayInteractiveAdmissionV01,
} from "@/lib/vnext/model-gateway/model-gateway";
import {
  createOpenAIResponsesAdapterV01,
  type OpenAIResponsesTransportRequestV01,
  type OpenAIResponsesTransportV01,
} from "@/lib/vnext/model-gateway/openai/responses-adapter";
import {
  operationalReentryMatchedCohortResponseSchemaV03,
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V04,
} from "@/lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-v0-2-codec";
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
import { preflightOperationalReentryCleanControlProviderCompatibilityProbeRepositoryV02 } from "@/scripts/operational-reentry-clean-control-provider-compatibility-probe";
import {
  OPERATIONAL_REENTRY_CLEAN_CONTROL_PROVIDER_COMPATIBILITY_PROBE_AUTHORIZATION_VERSION_V02,
  type OperationalReentryCleanControlProviderCompatibilityProbeAuthorizationV02,
  type OperationalReentryCleanControlProviderCompatibilityProbePreparedV02,
} from "@/types/vnext/operational-reentry-clean-control-provider-compatibility-probe";
import type { OperationalReentryMatchedCohortRouteV02 } from "@/types/vnext/operational-reentry-matched-cohort-v0-2";

const repositoryRoot = process.cwd();
const root = mkdtempSync(path.join(tmpdir(), "augnes-e2r2p1-v02-"));
const projectRoot = path.join(root, "project");
const databasePath = path.join(root, "gateway.db");
const evaluatedAt = "2026-08-19T08:00:00.000Z";
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
      "operational_reentry_clean_control_provider_compatibility_probe_test_failed",
    );
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exitCode = 1;
  });

async function main(): Promise<void> {
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    throw new Error("clean-control compatibility tests must not call fetch");
  }) as typeof fetch;
  mkdirSync(projectRoot, { recursive: true });
  writeFileSync(path.join(projectRoot, ".gitignore"), ".augnes-lab/\n");
  initializeDatabaseV02();
  const admission = registerProjectV02();

  verifyHistoricalPreservationV02();
  const shapeIdentity = await verifyShapePlanAndPricingV02(admission);
  const accepted = await verifySharedGatewayFourShapeProbeV02(admission);
  await verifyTerminalMappingsV02(admission);
  await verifyAuthorizationRefusalsV02(admission);
  await verifyArtifactSingleUseAndPrivacyV02(admission);
  await verifyArtifactConsumptionWriteFailureFailsClosedV02(admission);
  verifyMergedMainPreflightV02();
  verifyStaticAuthorityAndNoBehaviorV02();
  assert.equal(fetchCalls, 0);

  console.log(
    JSON.stringify({
      status:
        "operational_reentry_clean_control_provider_compatibility_probe_test_passed",
      planned_shapes: 4,
      canonical_order: ACGC_E2R2P1_CANONICAL_SHAPE_ORDER_V02,
      case_fingerprint:
        operationalReentryMatchedCohortCaseFixtureV02.integrity.fingerprint,
      common_task_evidence_fingerprint:
        OPERATIONAL_REENTRY_MATCHED_COHORT_COMMON_TASK_EVIDENCE_FINGERPRINT_V02,
      representative_shape_plan_fingerprint:
        shapeIdentity.representative_shape_plan_fingerprint,
      aggregate_worst_case_cost_nano_usd:
        shapeIdentity.aggregate_worst_case_cost_nano_usd,
      accepted_fake_transport_calls: accepted.fake_transport_calls,
      total_fake_transport_calls: fakeTransportCalls,
      real_provider_calls: 0,
      live_probe_authorizations_created: 0,
      live_probe_authorizations_consumed: 0,
      compatibility_result_exists: false,
      behavioral_cohort_executed: false,
      replication_executed: false,
      policy_started: false,
      stage_7_started: false,
    }),
  );
}

function verifyHistoricalPreservationV02(): void {
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
  const issue193 =
    validateOperationalReentryProviderCompatibilityProbeArtifactsV01({
      repository_root: repositoryRoot,
      run_root: path.join(
        repositoryRoot,
        ".augnes-lab/operational-reentry-provider-probes/operational-reentry-provider-probe_724ed8fce6d30d0979efd6bf837a3edc/issue-193",
      ),
    });
  assert.equal(
    issue193.report_fingerprint,
    "sha256:1ef3f21894272f390fcdacce80226383ae6d921c43712c3736a18843a8b08eb2",
  );
  assert.equal(
    issue193.artifact_index_fingerprint,
    "sha256:19bc10cb3f9cbd6d2a0fb2b4df9fca6728c4bb4e571255e52f3c2d0fd7a6bd76",
  );
  const issue199 =
    validateOperationalReentryMatchedCohortReplacementArtifactsV01({
      repository_root: repositoryRoot,
      run_root: path.join(
        repositoryRoot,
        ".augnes-lab/operational-reentry-matched-cohort-replacements/operational-reentry-replacement-cohort_d3136fe392e130ba74f67349686a91d9/issue-199",
      ),
    });
  assert.equal(
    issue199.replacement_cohort_fingerprint,
    "sha256:e23a70a7e7d9a136b1133c0683db46723ba5d2ec93dc4bf029caf9b7c64612a9",
  );
  assert.equal(
    issue199.report_fingerprint,
    "sha256:a3cdf87b2d85bb40d577f4e324ac058652c41414f6fbc26dc21b4ef51e8afa73",
  );
  assert.equal(
    issue199.artifact_index_fingerprint,
    "sha256:14296adcac5b81308a11a0761ac39ce77a4ba0c56ddf2cbf6e7e998f33415755",
  );
  const issue185 = validateOperationalReentryMatchedCohortArtifactsV01({
    repository_root: repositoryRoot,
    run_root: path.join(
      repositoryRoot,
      ".augnes-lab/operational-reentry-matched-cohorts/operational-reentry-cohort_48331280ed7ead6dbad2d12105208dfb/issue-185",
    ),
  });
  assert.equal(issue185.result_kind, "incomplete");
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
}

async function verifyShapePlanAndPricingV02(
  admission: ModelGatewayInteractiveAdmissionV01,
): Promise<{
  representative_shape_plan_fingerprint: string;
  aggregate_worst_case_cost_nano_usd: number;
}> {
  const adapter = adapterV02(async () => {
    throw new Error("shape planning must remain zero egress");
  });
  const route = await routeV02(adapter);
  const authorization = authorizationV02(admission, route, "shape-plan");
  const prepared =
    buildOperationalReentryCleanControlProviderCompatibilityProbeV02({
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
  assert.equal(
    a!.non_target_continuation_fingerprint,
    b!.non_target_continuation_fingerprint,
  );
  assert.equal(
    b!.non_target_continuation_fingerprint,
    c!.non_target_continuation_fingerprint,
  );
  assert.equal(d!.model_input.continuation_context.length, 0);
  assert.deepEqual(
    d!.model_input.common_task_evidence,
    a!.model_input.common_task_evidence,
  );
  assert.equal(
    a!.model_input.continuation_context.filter((item) => item.role === "target")
      .length,
    1,
  );
  assert.equal(
    b!.model_input.continuation_context.filter((item) => item.role === "target")
      .length,
    0,
  );
  assert.equal(c!.model_input.stale_relation?.applies_before_outcome, true);
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
    assert.match(entry.call_slot_id, /^e2r2p-call-/u);
    assert.equal(entry.call_slot_id.startsWith("e2p-call-"), false);
    assert.doesNotThrow(() =>
      validateOpenAIStrictSchemaSupportedSubsetV01(
        operationalReentryMatchedCohortResponseSchemaV03(entry.model_input),
      ),
    );
    const request =
      projectOperationalReentryMatchedCohortProviderRequestV02(
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
    27_852_800,
  );
  assert.equal(
    prepared.pricing.aggregate_ceiling_nano_usd,
    ACGC_E2R2P1_AGGREGATE_COST_CEILING_NANO_USD_V02,
  );
  assert.equal(
    prepared.pricing.pricing_source_version,
    "openai_gpt-4.1-mini-2025-04-14_2026-08-19",
  );
  assert.equal(
    prepared.manifest.route.purpose,
    OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01,
  );
  assert.equal(
    prepared.manifest.route.adapter_implementation_version,
    OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V04,
  );
  assert.equal(
    prepared.manifest.route.provider_contract_version,
    "operational_reentry_clean_control_matched_cohort_provider_contract.v0.2",
  );
  const artifactPlan =
    projectOperationalReentryCleanControlProviderCompatibilityProbePlanForArtifactV02(
      prepared.plan,
    );
  assert.equal(JSON.stringify(artifactPlan).includes("model_input"), false);
  return {
    representative_shape_plan_fingerprint:
      prepared.representative_shape_plan.integrity.fingerprint,
    aggregate_worst_case_cost_nano_usd:
      prepared.pricing.aggregate_worst_case_cost_nano_usd,
  };
}

async function verifySharedGatewayFourShapeProbeV02(
  admission: ModelGatewayInteractiveAdmissionV01,
): Promise<{ fake_transport_calls: 4 }> {
  const requests: OpenAIResponsesTransportRequestV01[] = [];
  let prepared: OperationalReentryCleanControlProviderCompatibilityProbePreparedV02;
  const adapter = adapterV02(async (request) => {
    const entry = prepared.plan.entries[requests.length]!;
    requests.push(request);
    return acceptedResponseV02(
      buildOperationalReentryMatchedCohortGoldenOutputV02(entry.shape),
    );
  });
  const route = await routeV02(adapter);
  const authorization = authorizationV02(admission, route, "accepted-four");
  const buildInput = {
    authorization,
    admission,
    route,
    repository_identity: repositoryIdentity,
    evaluated_at: evaluatedAt,
  };
  prepared =
    buildOperationalReentryCleanControlProviderCompatibilityProbeV02(
      buildInput,
    );
  validateModelInvocationEnvelopeV01(
    buildOperationalReentryCleanControlProviderCompatibilityProbeModelInvocationEnvelopeV02(
      prepared.plan.entries[0]!,
      prepared,
      admission,
      new AbortController().signal,
    ),
  );
  let consumptions = 0;
  const result =
    await runOperationalReentryCleanControlProviderCompatibilityProbeV02(
      buildInput,
      dependenciesV02(adapter, route, {
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
      OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01,
    );
    assert.equal(
      result.shapes[index]!.receipt?.final_implementation_version,
      OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V04,
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

async function verifyTerminalMappingsV02(
  admission: ModelGatewayInteractiveAdmissionV01,
): Promise<void> {
  const invalid = await runScenarioV02(admission, "invalid", async () =>
    acceptedResponseV02({ result_status: "invalid" }),
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
  const rejected = await runScenarioV02(admission, "rejected", async () =>
    rejectedResponseV02(429),
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
    deriveOperationalReentryCleanControlProviderCompatibilityProbeOutcomeV02(
      [],
    ),
    "not_run",
  );
}

async function verifyAuthorizationRefusalsV02(
  admission: ModelGatewayInteractiveAdmissionV01,
): Promise<void> {
  const route = await routeV02(
    adapterV02(async () => {
      throw new Error("authorization checks must remain before transport");
    }),
  );
  const authorization = authorizationV02(admission, route, "refusals");
  const build = (
    changedAuthorization: OperationalReentryCleanControlProviderCompatibilityProbeAuthorizationV02,
    changedAdmission = admission,
  ) =>
    buildOperationalReentryCleanControlProviderCompatibilityProbeV02({
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
    { route_fingerprint: createProtocolSha256V01("changed-route") },
    {
      provider_contract_fingerprint:
        createProtocolSha256V01("changed-contract"),
    },
    { pricing_fingerprint: createProtocolSha256V01("changed-pricing") },
    {
      pricing_authority_fingerprint:
        createProtocolSha256V01("changed-authority"),
    },
    { pricing_authority_expires_at: "2026-08-25T00:00:00.000Z" },
    { maximum_total_cost_nano_usd: 1 },
    { second_probe_authorized: true },
    { behavioral_cohort_authorized: true },
    { replication_authorized: true },
    { policy_authorized: true },
    { stage_7_authorized: true },
  ]) {
    assert.throws(
      () => build(resealAuthorizationV02({ ...authorization, ...override })),
      /clean_control_probe_authorization_mismatched/,
    );
  }
  const changedAdmission = {
    ...admission,
    expected_active_selection_revision:
      admission.expected_active_selection_revision + 1,
  };
  assert.throws(
    () => build(authorization, changedAdmission),
    /clean_control_probe_authorization_mismatched/,
  );
  assert.throws(
    () =>
      buildOperationalReentryCleanControlProviderCompatibilityProbeV02({
        authorization,
        admission,
        route,
        repository_identity: {
          ...repositoryIdentity,
          origin: "https://example.invalid/repository.git",
        },
        evaluated_at: evaluatedAt,
      }),
    /clean_control_probe_repository_origin_mismatch/,
  );
  assert.equal(fakeTransportCalls >= 6, true);
}

async function verifyArtifactSingleUseAndPrivacyV02(
  admission: ModelGatewayInteractiveAdmissionV01,
): Promise<void> {
  let prepared: OperationalReentryCleanControlProviderCompatibilityProbePreparedV02;
  let callIndex = 0;
  const adapter = adapterV02(async () => {
    const entry = prepared.plan.entries[callIndex++]!;
    return acceptedResponseV02(
      buildOperationalReentryMatchedCohortGoldenOutputV02(entry.shape),
    );
  });
  const route = await routeV02(adapter);
  const authorization = authorizationV02(admission, route, "artifacts");
  const buildInput = {
    authorization,
    admission,
    route,
    repository_identity: repositoryIdentity,
    evaluated_at: evaluatedAt,
  };
  prepared =
    buildOperationalReentryCleanControlProviderCompatibilityProbeV02(
      buildInput,
    );
  const journal =
    beginOperationalReentryCleanControlProviderCompatibilityProbeAttemptV02({
      repository_root: projectRoot,
      prepared,
    });
  const result =
    await runOperationalReentryCleanControlProviderCompatibilityProbeV02(
      buildInput,
      dependenciesV02(adapter, route, {
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
    validateOperationalReentryCleanControlProviderCompatibilityProbeArtifactsV02(
      { repository_root: projectRoot, run_root: journal.run_root },
    ),
    summary,
  );
  assert.match(
    summary.relative_run_root,
    /^\.augnes-lab\/operational-reentry-clean-control-provider-probes\/[^/]+\/issue-[1-9][0-9]*$/u,
  );
  assert.equal(summary.authorization_consumed, true);
  const familyRoot = path.join(
    projectRoot,
    ".augnes-lab",
    "operational-reentry-clean-control-provider-probes",
  );
  assert.equal(
    readdirSync(path.join(familyRoot, "authorization-consumptions")).length,
    1,
  );
  const stored = readTreeV02(familyRoot);
  for (const forbidden of [
    "test-credential-never-persisted",
    '"request_body"',
    '"headers"',
    "/Users/",
    "/home/",
    '"model_input"',
    '"e1_evaluation"',
    '"pairwise_relations"',
    '"conditioning_disposition"',
    '"reset_disposition"',
  ]) {
    assert.equal(stored.includes(forbidden), false, forbidden);
  }
  let secondTransportCalls = 0;
  const laterAdapter = adapterV02(async () => {
    secondTransportCalls += 1;
    throw new Error("reused authorization must not reach transport");
  });
  const laterRoute = await routeV02(laterAdapter);
  const laterPrepared =
    buildOperationalReentryCleanControlProviderCompatibilityProbeV02({
      authorization,
      admission,
      route: laterRoute,
      repository_identity: repositoryIdentity,
      evaluated_at: "2026-08-19T08:30:00.000Z",
    });
  const tamperedProbeId = structuredClone(laterPrepared);
  tamperedProbeId.manifest.probe_id =
    `${tamperedProbeId.manifest.probe_id}-changed`;
  assert.throws(
    () =>
      beginOperationalReentryCleanControlProviderCompatibilityProbeAttemptV02({
        repository_root: projectRoot,
        prepared: tamperedProbeId,
      }),
    /clean_control_probe_authorization_global_collision_refused/,
  );
  assert.equal(secondTransportCalls, 0);
  const collisionAuthorization = authorizationV02(
    admission,
    route,
    "root-collision",
  );
  const collisionPrepared =
    buildOperationalReentryCleanControlProviderCompatibilityProbeV02({
      authorization: collisionAuthorization,
      admission,
      route,
      repository_identity: repositoryIdentity,
      evaluated_at: evaluatedAt,
    });
  beginOperationalReentryCleanControlProviderCompatibilityProbeAttemptV02({
    repository_root: projectRoot,
    prepared: collisionPrepared,
  });
  assert.throws(
    () =>
      beginOperationalReentryCleanControlProviderCompatibilityProbeAttemptV02({
        repository_root: projectRoot,
        prepared: collisionPrepared,
      }),
    /clean_control_probe_authorization_collision_refused/,
  );
  for (const relative_run_root of [
    ".augnes-lab/operational-reentry-provider-probes/other/issue-193",
    ".augnes-lab/operational-reentry-matched-cohort-replacements/other/issue-199",
    ".augnes-lab/operational-reentry-clean-control-provider-probes/cohort_attempt/issue-999",
  ]) {
    assert.throws(
      () =>
        assertOperationalReentryCleanControlProviderCompatibilityProbeArtifactRootAvailableV02(
          { repository_root: projectRoot, relative_run_root },
        ),
      /clean_control_probe_historical_or_cohort_root_refused/,
    );
  }
  const symlinkRoot = path.join(
    projectRoot,
    ".augnes-lab",
    "operational-reentry-clean-control-provider-probes",
    "symlink-root",
  );
  symlinkSync(root, symlinkRoot);
  assert.throws(
    () =>
      assertOperationalReentryCleanControlProviderCompatibilityProbeArtifactRootAvailableV02(
        {
          repository_root: projectRoot,
          relative_run_root:
            ".augnes-lab/operational-reentry-clean-control-provider-probes/symlink-root",
        },
      ),
    /clean_control_probe_artifact_symlink_refused/,
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
        assertOperationalReentryCleanControlProviderCompatibilityProbeArtifactPayloadSafeV02(
          payload,
        ),
      /clean_control_probe_artifact_/,
    );
  }
}

async function verifyArtifactConsumptionWriteFailureFailsClosedV02(
  admission: ModelGatewayInteractiveAdmissionV01,
): Promise<void> {
  let prepared: OperationalReentryCleanControlProviderCompatibilityProbePreparedV02;
  let partialTransportCalls = 0;
  const adapter = adapterV02(async () => {
    partialTransportCalls += 1;
    const entry = prepared.plan.entries[partialTransportCalls - 1]!;
    return acceptedResponseV02(
      buildOperationalReentryMatchedCohortGoldenOutputV02(entry.shape),
    );
  });
  const route = await routeV02(adapter);
  const authorization = authorizationV02(
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
    buildOperationalReentryCleanControlProviderCompatibilityProbeV02(
      buildInput,
    );
  const journal =
    beginOperationalReentryCleanControlProviderCompatibilityProbeAttemptV02({
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
    await runOperationalReentryCleanControlProviderCompatibilityProbeV02(
      buildInput,
      dependenciesV02(adapter, route, {
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
    "operational-reentry-clean-control-provider-probes",
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
  const partialTreeBefore = readTreeV02(journal.run_root);
  const globalConsumptionBefore = readFileSync(globalConsumptionPath, "utf8");
  assert.throws(
    () => journal.finalize(result),
    /clean_control_probe_authorization_consumption_history_incomplete/,
  );
  assert.throws(
    () =>
      validateOperationalReentryCleanControlProviderCompatibilityProbeArtifactsV02(
        { repository_root: projectRoot, run_root: journal.run_root },
      ),
    /clean_control_probe_authorization_consumption_history_incomplete/,
  );
  assert.throws(
    () =>
      beginOperationalReentryCleanControlProviderCompatibilityProbeAttemptV02({
        repository_root: projectRoot,
        prepared,
      }),
    /clean_control_probe_authorization_global_collision_refused/,
  );
  assert.equal(readTreeV02(journal.run_root), partialTreeBefore);
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

function verifyMergedMainPreflightV02(): void {
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
    preflightOperationalReentryCleanControlProviderCompatibilityProbeRepositoryV02(
      exactRepository,
      identity,
    ),
  );
  writeFileSync(path.join(repository, "dirty.txt"), "dirty\n");
  assert.throws(
    () =>
      preflightOperationalReentryCleanControlProviderCompatibilityProbeRepositoryV02(
        exactRepository,
        identity,
      ),
    /clean_control_probe_dirty_or_mismatched_head/,
  );
  rmSync(path.join(repository, "dirty.txt"));
  git(["switch", "-c", "clean-feature"]);
  writeFileSync(path.join(repository, "feature.txt"), "feature\n");
  git(["add", "feature.txt"]);
  git(["commit", "-m", "feature"]);
  const featureHead = git(["rev-parse", "HEAD"]);
  assert.throws(
    () =>
      preflightOperationalReentryCleanControlProviderCompatibilityProbeRepositoryV02(
        exactRepository,
        { ...identity, exact_merged_source_head: featureHead },
      ),
    /clean_control_probe_source_head_not_exact_origin_main/,
  );
}

function verifyStaticAuthorityAndNoBehaviorV02(): void {
  assert.deepEqual(
    operationalReentryCleanControlProviderCompatibilityProbeHarnessAuthorityV02,
    {
      live_probe_authorization_granted: false,
      live_probe_authorization_consumed: false,
      real_provider_calls: 0,
      compatibility_result_exists: false,
      behavioral_cohort_authorized: false,
      replication_authorized: false,
      policy_authorized: false,
      stage_7_authorized: false,
    },
  );
  const core = readFileSync(
    path.join(
      repositoryRoot,
      "lib/vnext/operational-reentry-clean-control-provider-compatibility-probe.ts",
    ),
    "utf8",
  );
  const cli = readFileSync(
    path.join(
      repositoryRoot,
      "scripts/operational-reentry-clean-control-provider-compatibility-probe.ts",
    ),
    "utf8",
  );
  assert.equal(core.includes("buildOperationalReentryEvaluationV01"), false);
  assert.equal(core.includes("evaluateOperationalReentryMatchedCohort"), false);
  assert.equal(core.includes("deriveOperationalReentryMatchedCohortPairwise"), false);
  assert.equal(core.includes("fetch("), false);
  assert.equal(core.includes("process.env"), false);
  assert.ok(
    core.includes("invokeOperationalReentryMatchedCohortModelGatewayV02"),
  );
  assert.ok(cli.includes("refs/remotes/origin/main^{commit}"));
  assert.ok(
    cli.includes("--confirm-future-live-clean-control-compatibility-probe"),
  );
  assert.ok(cli.includes("--authorization-file"));
  assert.equal(cli.includes("previous_response_id"), false);
  assert.equal(cli.includes("buildAuthorization"), false);
}

async function runScenarioV02(
  admission: ModelGatewayInteractiveAdmissionV01,
  label: string,
  transport: OpenAIResponsesTransportV01,
) {
  let transportCalls = 0;
  const adapter = adapterV02(async (request) => {
    transportCalls += 1;
    return transport(request);
  });
  const route = await routeV02(adapter);
  const authorization = authorizationV02(admission, route, label);
  const result =
    await runOperationalReentryCleanControlProviderCompatibilityProbeV02(
      {
        authorization,
        admission,
        route,
        repository_identity: repositoryIdentity,
        evaluated_at: evaluatedAt,
      },
      dependenciesV02(adapter, route),
    );
  return { result, transport_calls: transportCalls };
}

function authorizationV02(
  admission: ModelGatewayInteractiveAdmissionV01,
  route: OperationalReentryMatchedCohortRouteV02,
  label: string,
  overrides: Partial<OperationalReentryCleanControlProviderCompatibilityProbeAuthorizationV02> = {},
): OperationalReentryCleanControlProviderCompatibilityProbeAuthorizationV02 {
  const expectations =
    buildOperationalReentryCleanControlProviderCompatibilityProbeAuthorizationExpectationsV02(
      {
        admission,
        route,
        repository_identity: repositoryIdentity,
        evaluated_at: evaluatedAt,
      },
    );
  return resealAuthorizationV02({
    authorization_version:
      OPERATIONAL_REENTRY_CLEAN_CONTROL_PROVIDER_COMPATIBILITY_PROBE_AUTHORIZATION_VERSION_V02,
    authorization_id: `clean-control-probe-${label}-${authorizationSequence++}`,
    authorization_kind:
      "one_bounded_clean_control_provider_compatibility_probe",
    request_family_kind: "clean_control_compatibility_probe",
    future_live_issue_number: 207,
    exact_merged_source_head: futureMergedSourceHead,
    repository_slug: expectations.repository_slug,
    authorized_origin: expectations.authorized_origin,
    issued_at: evaluatedAt,
    expires_at: "2026-08-19T09:00:00.000Z",
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
    route_fingerprint: expectations.route_fingerprint,
    provider_contract_fingerprint:
      expectations.provider_contract_fingerprint,
    provider_contract_version:
      "operational_reentry_clean_control_matched_cohort_provider_contract.v0.2",
    codec_version: "operational_reentry_matched_cohort_codec.v0.3",
    response_schema_version:
      "operational_reentry_matched_cohort_response_schema.v0.3",
    parser_version: "operational_reentry_matched_cohort_parser.v0.2",
    adapter_implementation_id:
      "openai_responses.operational_reentry_matched_cohort",
    adapter_implementation_version:
      "openai_responses_operational_reentry_matched_cohort_adapter.v0.4",
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
    stop_after_first_non_success_terminal_result: true,
    second_probe_authorized: false,
    behavioral_cohort_authorized: false,
    replication_authorized: false,
    policy_authorized: false,
    stage_7_authorized: false,
    maximum_total_cost_nano_usd: 250_000_000,
    ...overrides,
  });
}

function resealAuthorizationV02(
  input: Record<string, unknown>,
): OperationalReentryCleanControlProviderCompatibilityProbeAuthorizationV02 {
  const { integrity: _integrity, ...payload } = input;
  return {
    ...payload,
    integrity: {
      algorithm: "sha256",
      canonicalization: "augnes-json-c14n-v0_1",
      fingerprint_scope:
        "clean_control_probe_authorization_without_integrity_fingerprint",
      fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(payload),
      ),
    },
  } as unknown as OperationalReentryCleanControlProviderCompatibilityProbeAuthorizationV02;
}

function adapterV02(
  transport: Parameters<typeof createOpenAIResponsesAdapterV01>[0] extends infer Options
    ? Options extends { transport?: infer Transport }
      ? NonNullable<Transport>
      : never
    : never,
) {
  return createOpenAIResponsesAdapterV01({
    environment: {
      OPENAI_API_KEY: "test-credential-never-persisted",
      OPENAI_MODEL: "ambient-model-must-not-override-v02",
    },
    transport: async (request) => {
      fakeTransportCalls += 1;
      return transport(request);
    },
  });
}

async function routeV02(
  adapter: ReturnType<typeof createOpenAIResponsesAdapterV01>,
): Promise<OperationalReentryMatchedCohortRouteV02> {
  const route =
    await prepareOperationalReentryMatchedCohortModelGatewayRouteV02({
      adapter,
    });
  assert.ok(route);
  return route;
}

function dependenciesV02(
  adapter: ReturnType<typeof createOpenAIResponsesAdapterV01>,
  route: OperationalReentryMatchedCohortRouteV02,
  overrides: Partial<RunOperationalReentryCleanControlProviderCompatibilityProbeDependenciesV02> = {},
): RunOperationalReentryCleanControlProviderCompatibilityProbeDependenciesV02 {
  return {
    gateway_dependencies: {
      adapter,
      expected_operational_reentry_matched_cohort_v02_route: route,
      open_database: () => new Database(databasePath),
      read_root_availability: async () => "available" as const,
      now: () => new Date(evaluatedAt),
    },
    assert_source_unchanged() {},
    consume_authorization() {},
    ...overrides,
  };
}

function acceptedResponseV02(output: unknown) {
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

function rejectedResponseV02(status: number) {
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

function initializeDatabaseV02(): void {
  const database = new Database(databasePath);
  database.exec(readFileSync(path.join(repositoryRoot, "lib/db/schema.sql"), "utf8"));
  database.close();
}

function registerProjectV02(): ModelGatewayInteractiveAdmissionV01 {
  const database = new Database(databasePath);
  try {
    const workspace = getOrCreateDefaultWorkspaceIdentityV01(database, {
      create_uuid: () => "11111111-1111-4111-8111-111111111111",
      now: () => "2026-08-19T07:50:00.000Z",
    });
    const localRoot = normalizeLocalProjectRootRefV01(projectRoot, {
      base_path: path.parse(projectRoot).root,
    });
    const project = getOrCreateCanonicalProjectForLocalRootV01(
      database,
      {
        workspace_id: workspace.workspace_id,
        local_root: localRoot,
        display_name: "e2r2p1-v02-test-project",
      },
      {
        create_uuid: () => "22222222-2222-4222-8222-222222222222",
        now: () => "2026-08-19T07:51:00.000Z",
      },
    );
    const active = selectActiveProjectV01(database, {
      workspace_id: workspace.workspace_id,
      project_id: project.project.project_id,
      now: "2026-08-19T07:52:00.000Z",
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

function readTreeV02(directory: string): string {
  return readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name, "en"))
    .map((entry) => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory()
        ? readTreeV02(target)
        : readFileSync(target, "utf8");
    })
    .join("\n");
}
