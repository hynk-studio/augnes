import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { resolveMigratedHistoricalEvidencePath } from "@/scripts/canonical-historical-evidence.mjs";

import Database from "better-sqlite3";

import { ModelEgressBoundaryError } from "@/lib/model-egress/bounded-model-payload";
import {
  OPERATIONAL_REENTRY_MATCHED_COHORT_COMMON_TASK_EVIDENCE_FINGERPRINT_V02,
  operationalReentryMatchedCohortCaseFixtureV02,
  operationalReentryMatchedCohortRubricFixtureV02,
} from "@/fixtures/vnext/research/operational-reentry-matched-cohort-v0-2";
import {
  operationalReentryMatchedCohortCaseFixtureV01,
  operationalReentryMatchedCohortRubricFixtureV01,
} from "@/fixtures/vnext/research/operational-reentry-matched-cohort-v0-1";
import { buildOperationalReentryPerturbationFixtureV01 } from "@/fixtures/vnext/research/operational-reentry-perturbation-v0-1";
import {
  buildOperationalReentryMatchedCohortCallPlanV01,
} from "@/lib/vnext/operational-reentry-matched-cohort";
import {
  ACGC_E2_V02_SEALED_ORDER,
  buildOperationalReentryMatchedCohortCallPlanV02,
  buildOperationalReentryMatchedCohortGoldenOutputV02,
  buildOperationalReentryMatchedCohortHarnessReportV02,
  deriveOperationalReentryMatchedCohortPairwiseComparisonV02,
  evaluateOperationalReentryMatchedCohortArmV02,
  evaluateOperationalReentryMatchedCohortBlockV02,
} from "@/lib/vnext/operational-reentry-matched-cohort-v0-2";
import { validateOperationalReentryMatchedCohortArtifactsV01 } from "@/lib/vnext/operational-reentry-matched-cohort-artifact-store";
import { validateOperationalReentryProviderCompatibilityProbeArtifactsV01 } from "@/lib/vnext/operational-reentry-provider-compatibility-probe-artifact-store";
import { validateOperationalReentryMatchedCohortReplacementArtifactsV01 } from "@/lib/vnext/operational-reentry-matched-cohort-replacement-artifact-store";
import { projectArtifactEvidenceReadPathV01 } from "@/lib/vnext/migrated-historical-evidence";
import {
  buildOperationalReentryMatchedCohortProviderContractV02,
  buildOperationalReentryMatchedCohortSystemPromptV02,
  commonTaskEvidenceFingerprintV02,
  operationalReentryMatchedCohortResponseSchemaV03,
  parseOperationalReentryMatchedCohortOutputV02,
  projectOperationalReentryMatchedCohortModelMaterialV02,
  validateOperationalReentryMatchedCohortModelInputV02,
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V04,
  OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V02,
} from "@/lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-v0-2-codec";
import {
  createOpenAIResponsesAdapterV01,
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V03,
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02,
  projectOpenAIResponsesOperationalReentryMatchedCohortRequestV02,
  type OpenAIResponsesTransportRequestV01,
} from "@/lib/vnext/model-gateway/openai/responses-adapter";
import {
  invokeOperationalReentryMatchedCohortModelGatewayV02,
  prepareOperationalReentryMatchedCohortModelGatewayRouteV01,
  prepareOperationalReentryMatchedCohortModelGatewayRouteV02,
  validateOperationalReentryMatchedCohortModelInvocationEnvelopeV02,
  type ModelGatewayInteractiveAdmissionV01,
} from "@/lib/vnext/model-gateway/model-gateway";
import {
  MODEL_INVOCATION_ENVELOPE_VERSION_V01,
  ModelGatewayInvocationErrorV01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01,
} from "@/lib/vnext/model-gateway/contracts";
import {
  buildModelGatewayCostAuthorityV01,
  buildModelGatewayCostBudgetV01,
} from "@/lib/vnext/model-gateway/cost-authority";
import { validateModelInvocationReceiptV02 } from "@/lib/vnext/model-gateway/model-invocation-receipt";
import { createDeterministicModelProviderRequestTraceV01 } from "@/lib/vnext/model-gateway/provider-rejection-observation";
import {
  getOrCreateCanonicalProjectForLocalRootV01,
  getOrCreateDefaultWorkspaceIdentityV01,
  normalizeLocalProjectRootRefV01,
} from "@/lib/vnext/persistence/project-identity-registry";
import { selectActiveProjectV01 } from "@/lib/vnext/persistence/project-lifecycle-registry";
import { validateOpenAIStrictSchemaSupportedSubsetV01 } from "@/lib/vnext/model-gateway/openai/strict-schema-supported-subset";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import type {
  OperationalReentryMatchedCohortArmV02,
  OperationalReentryMatchedCohortObservedArmV02,
} from "@/types/vnext/operational-reentry-matched-cohort-v0-2";

const repositoryRoot = process.cwd();
const originalFetch = globalThis.fetch;
let fetchCalls = 0;
void main().catch((error) => {
  console.error("operational_reentry_matched_cohort_v02_test_failed");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

async function main(): Promise<void> {
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    throw new Error("v0.2 clean-control tests must not call fetch");
  }) as typeof fetch;
  try {
  testHistoricalIdentityPreservationV02();
  testCommonEvidenceIsolationV02();
  testProviderContractV02();
  const gatewayProof = await testSharedModelGatewayPathV02();
  testCleanControlAdmissionV02();
  testRequiredCheckAndStatusComplianceV02();
  testPairwiseComparabilityV02();
  testE1BehavioralMechanicsV02();
  const report = testSeparatedHarnessReportV02();
  assert.equal(fetchCalls, 0);

  const plan = buildOperationalReentryMatchedCohortCallPlanV02();
  const commonEvidenceFingerprint =
    OPERATIONAL_REENTRY_MATCHED_COHORT_COMMON_TASK_EVIDENCE_FINGERPRINT_V02;
  const cleanBlock = evaluateOperationalReentryMatchedCohortBlockV02(
    0,
    observedBlockV02(0),
  );
  console.log(
    JSON.stringify({
      status: "operational_reentry_matched_cohort_v02_test_passed",
      planned_calls: plan.planned_calls,
      common_task_evidence_fingerprint: commonEvidenceFingerprint,
      case_fingerprint:
        operationalReentryMatchedCohortCaseFixtureV02.integrity.fingerprint,
      rubric_fingerprint:
        operationalReentryMatchedCohortRubricFixtureV02.integrity.fingerprint,
      call_plan_fingerprint: plan.integrity.fingerprint,
      report_fingerprint: report.integrity.fingerprint,
      clean_control_b_hard_failures:
        cleanBlock.clean_control_admission.arm_b_invariant_hard_failures,
      clean_control_d_hard_failures:
        cleanBlock.clean_control_admission.arm_d_invariant_hard_failures,
      universal_common_hard_failure_dimensions:
        cleanBlock.universal_common_hard_failure_dimensions,
      conditioning_relation: cleanBlock.conditioning_relation,
      reset_relation: cleanBlock.reset_relation,
      compatibility_probe_executed: false,
      behavioral_cohort_executed: false,
      fake_transport_calls: gatewayProof.fake_transport_calls,
      shared_gateway_purpose: gatewayProof.purpose,
      shared_gateway_adapter_version: gatewayProof.adapter_version,
      real_provider_calls: 0,
    }),
  );
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function testHistoricalIdentityPreservationV02(): void {
  assert.equal(
    projectArtifactEvidenceReadPathV01({
      relative_path: ".augnes-lab/example/run",
      active_prefix: ".augnes-lab/example/",
      read_scope: "migrated_historical",
    }),
    null,
  );
  assert.equal(
    projectArtifactEvidenceReadPathV01({
      relative_path:
        ".augnes-history/perspective-lab-cutover/historical-evidence/.augnes-lab/example/run",
      active_prefix: ".augnes-lab/example/",
      read_scope: "active",
    }),
    null,
  );
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
  const e1 = buildOperationalReentryPerturbationFixtureV01();
  assert.equal(
    e1.source.integrity.fingerprint,
    "sha256:9a97c69305aade380958f848c682c8926b780a6bbfcd759df4db153d0b6c1ff1",
  );
  assert.equal(
    e1.evaluation.integrity.fingerprint,
    "sha256:2cb04b40160e26960a876f48605fc6388c9a954b7744b5b89a72eb56da4146ac",
  );

  const issue185 = validateOperationalReentryMatchedCohortArtifactsV01({
    repository_root: repositoryRoot,
    read_scope: "migrated_historical",
    run_root: resolveMigratedHistoricalEvidencePath({
      repositoryRoot,
      legacyRelativePath:
      ".augnes-lab/operational-reentry-matched-cohorts/operational-reentry-cohort_48331280ed7ead6dbad2d12105208dfb/issue-185",
    }),
  });
  assert.equal(issue185.result_kind, "incomplete");
  assert.equal(
    issue185.cohort_fingerprint,
    "sha256:7f2b85d33ba2e9fb4173e18dbdd0f298e6718b6f7dc4d1e5d9759ac28e1e103d",
  );
  assert.equal(issue185.authorization_consumed, true);

  const issue193 =
    validateOperationalReentryProviderCompatibilityProbeArtifactsV01({
      repository_root: repositoryRoot,
      read_scope: "migrated_historical",
      run_root: resolveMigratedHistoricalEvidencePath({
        repositoryRoot,
        legacyRelativePath:
        ".augnes-lab/operational-reentry-provider-probes/operational-reentry-provider-probe_724ed8fce6d30d0979efd6bf837a3edc/issue-193",
      }),
    });
  assert.equal(issue193.outcome, "accepted_all_shapes");
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
      read_scope: "migrated_historical",
      run_root: resolveMigratedHistoricalEvidencePath({
        repositoryRoot,
        legacyRelativePath:
        ".augnes-lab/operational-reentry-matched-cohort-replacements/operational-reentry-replacement-cohort_d3136fe392e130ba74f67349686a91d9/issue-199",
      }),
    });
  assert.equal(issue199.result_kind, "incomplete");
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
}

function testCommonEvidenceIsolationV02(): void {
  const plan = buildOperationalReentryMatchedCohortCallPlanV02();
  assert.equal(plan.planned_calls, 16);
  assert.equal(plan.entries.length, 16);
  assert.deepEqual(plan.sealed_order, ACGC_E2_V02_SEALED_ORDER);
  assert.equal(plan.calls_per_arm, 4);
  assert.equal(plan.max_parallel_provider_calls, 1);
  assert.equal(plan.retries, 0);
  assert.equal(plan.replacement_calls, 0);
  assert.equal(plan.adaptive_stopping, false);
  assert.equal(plan.stateless_invocations, true);
  assert.equal(plan.conversation_reuse, false);
  assert.equal(plan.thread_reuse, false);
  assert.equal(plan.previous_response_reuse, false);
  assert.equal(plan.zero_provider_egress_harness, true);
  assert.equal(
    new Set(
      plan.entries.map((entry) => entry.common_task_evidence_fingerprint),
    ).size,
    1,
  );
  assert.equal(
    plan.entries[0]!.common_task_evidence_fingerprint,
    OPERATIONAL_REENTRY_MATCHED_COHORT_COMMON_TASK_EVIDENCE_FINGERPRINT_V02,
  );
  assert.equal(
    new Set(
      plan.entries.map((entry) =>
        canonicalizeProtocolValueV01(entry.model_input.task),
      ),
    ).size,
    1,
  );
  assert.equal(
    new Set(
      plan.entries.map((entry) =>
        canonicalizeProtocolValueV01(entry.model_input.allowed_output),
      ),
    ).size,
    1,
  );
  for (const block of [0, 1, 2, 3] as const) {
    const entries = plan.entries.filter(
      (entry) => entry.repeat_block === block,
    );
    const byArm = new Map(entries.map((entry) => [entry.arm, entry]));
    const a = byArm.get("A")!;
    const b = byArm.get("B")!;
    const c = byArm.get("C")!;
    const d = byArm.get("D")!;
    assert.equal(
      a.non_target_continuation_fingerprint,
      b.non_target_continuation_fingerprint,
    );
    assert.equal(
      b.non_target_continuation_fingerprint,
      c.non_target_continuation_fingerprint,
    );
    assert.notEqual(
      c.non_target_continuation_fingerprint,
      d.non_target_continuation_fingerprint,
    );
    assert.equal(d.model_input.continuation_context.length, 0);
    assert.equal(
      d.model_input.common_task_evidence.observed_result_status,
      "review_ready",
    );
    assert.equal(
      d.model_input.common_task_evidence.observed_required_check.disposition,
      "passed",
    );
    assert.equal(
      a.model_input.continuation_context.filter(
        (item) => item.role === "target",
      ).length,
      1,
    );
    assert.equal(
      b.model_input.continuation_context.filter(
        (item) => item.role === "target",
      ).length,
      0,
    );
    assert.equal(
      c.model_input.continuation_context.filter(
        (item) => item.role === "target",
      ).length,
      1,
    );
    assert.equal(a.model_input.stale_relation, null);
    assert.equal(b.model_input.stale_relation, null);
    assert.notEqual(c.model_input.stale_relation, null);
    assert.equal(d.model_input.stale_relation, null);
  }
}

function testProviderContractV02(): void {
  const plan = buildOperationalReentryMatchedCohortCallPlanV02();
  for (const entry of plan.entries) {
    assert.doesNotThrow(() =>
      validateOperationalReentryMatchedCohortModelInputV02(entry.model_input),
    );
    const material = projectOperationalReentryMatchedCohortModelMaterialV02(
      entry.model_input,
    );
    assert.deepEqual(Object.keys(material), [
      "invocation_context",
      "task",
      "common_task_evidence",
      "continuation_context",
      "stale_relation",
      "allowed_output",
      "authority_notice",
    ]);
    const schema = operationalReentryMatchedCohortResponseSchemaV03(
      entry.model_input,
    );
    assert.doesNotThrow(() =>
      validateOpenAIStrictSchemaSupportedSubsetV01(schema),
    );
    assert.equal(JSON.stringify(schema).includes("uniqueItems"), false);
  }
  const request =
    projectOpenAIResponsesOperationalReentryMatchedCohortRequestV02(
      plan.entries[0]!.model_input,
    );
  assert.equal(
    request.adapter_implementation_version,
    OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V04,
  );
  assert.equal(JSON.parse(request.request_body).store, false);
  assert.equal(request.request_body.includes("uniqueItems"), false);
  assert.equal(request.real_provider_calls, 0);
  assert.equal(request.compatibility_established, false);
  assert.equal(request.separately_authorized_compatibility_probe_required, true);
  const contract = buildOperationalReentryMatchedCohortProviderContractV02();
  assert.equal(contract.issue_193_v01_result_is_v02_compatibility, false);
  assert.equal(
    contract.separately_authorized_v02_compatibility_probe_required,
    true,
  );
  assert.equal(contract.raw_prompt_persisted, false);
  assert.equal(contract.raw_provider_response_persisted, false);
  assert.equal(contract.hidden_reasoning_persisted, false);
  assert.equal(contract.real_provider_calls, 0);
  const prompt = buildOperationalReentryMatchedCohortSystemPromptV02();
  assert.ok(prompt.includes("Common task evidence is not continuation context"));
  assert.ok(
    prompt.includes(
      "Continuation material cannot upgrade, downgrade, or invent the check result",
    ),
  );

  const missingCheckEvidence = structuredClone(plan.entries[0]!.model_input) as
    unknown as Record<string, unknown>;
  delete (
    missingCheckEvidence.common_task_evidence as Record<string, unknown>
  ).observed_required_check;
  assert.throws(
    () =>
      validateOperationalReentryMatchedCohortModelInputV02(
        missingCheckEvidence,
      ),
    (error: unknown) => error instanceof ModelEgressBoundaryError,
  );

  const bInput = plan.entries.find(
    (entry) => entry.repeat_block === 0 && entry.arm === "B",
  )!.model_input;
  assert.throws(
    () =>
      parseOperationalReentryMatchedCohortOutputV02(
        JSON.stringify(
          buildOperationalReentryMatchedCohortGoldenOutputV02("B", {
            referenced_continuation_tokens: [
              ...bInput.continuation_context.map(
                (item) => item.context_token,
              ),
              operationalReentryMatchedCohortRubricFixtureV02.target_context_token,
            ],
          }),
        ),
        bInput,
      ),
    /operational_reentry_matched_cohort_v02_output_invalid/,
  );
  const cInput = plan.entries.find(
    (entry) => entry.repeat_block === 0 && entry.arm === "C",
  )!.model_input;
  assert.throws(
    () =>
      parseOperationalReentryMatchedCohortOutputV02(
        JSON.stringify(
          buildOperationalReentryMatchedCohortGoldenOutputV02("C", {
            target_disposition: "stale_persisted",
          }),
        ),
        cInput,
      ),
    /operational_reentry_matched_cohort_v02_output_invalid/,
  );
}

async function testSharedModelGatewayPathV02(): Promise<{
  fake_transport_calls: 1;
  purpose: typeof OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01;
  adapter_version: typeof OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V04;
}> {
  const root = mkdtempSync(path.join(tmpdir(), "augnes-e2r2h-gateway-v02-"));
  const projectRoot = path.join(root, "project");
  const databasePath = path.join(root, "gateway.db");
  mkdirSync(projectRoot, { recursive: true });
  const database = new Database(databasePath);
  database.exec(
    readFileSync(path.join(repositoryRoot, "lib/db/schema.sql"), "utf8"),
  );
  database.close();

  try {
    const admission = registerGatewayProjectV02(databasePath, projectRoot);
    const plan = buildOperationalReentryMatchedCohortCallPlanV02();
    const entry = plan.entries.find(
      (candidate) => candidate.repeat_block === 0 && candidate.arm === "D",
    )!;
    const output = buildOperationalReentryMatchedCohortGoldenOutputV02("D");
    const successRequests: OpenAIResponsesTransportRequestV01[] = [];
    const successAdapter = createOpenAIResponsesAdapterV01({
      environment: {
        OPENAI_API_KEY: "test-credential-never-persisted",
        OPENAI_MODEL: "ambient-model-must-not-route-e2-v02",
      },
      transport: async (request) => {
        successRequests.push(request);
        return completedProviderResponseV02(output);
      },
    });
    const route = await prepareOperationalReentryMatchedCohortModelGatewayRouteV02({
      adapter: successAdapter,
    });
    assert.ok(route);
    assert.equal(
      route.purpose,
      OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01,
    );
    assert.equal(route.provider_ref.external_id, "openai");
    assert.equal(
      route.model_ref.external_id,
      OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02,
    );
    assert.equal(
      route.adapter_implementation_version,
      OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V04,
    );
    assert.equal(
      route.provider_contract_version,
      "operational_reentry_clean_control_matched_cohort_provider_contract.v0.2",
    );

    const envelope = gatewayEnvelopeV02({
      admission,
      route,
      model_input: entry.model_input,
    });
    assert.doesNotThrow(() =>
      validateOperationalReentryMatchedCohortModelInvocationEnvelopeV02(
        envelope,
      ),
    );
    const result = await invokeOperationalReentryMatchedCohortModelGatewayV02(
      envelope,
      gatewayDependenciesV02(databasePath, successAdapter, route),
    );
    assert.equal(successRequests.length, 1);
    assert.deepEqual(result.output, output);
    assert.equal(
      result.model_invocation_receipt.purpose,
      OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01,
    );
    assert.equal(result.model_invocation_receipt.egress_attempted, true);
    assert.equal(result.model_invocation_receipt.budget.provider_calls_used, 1);
    assert.equal(
      result.model_invocation_receipt.final_implementation_version,
      OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V04,
    );
    assert.doesNotThrow(() =>
      validateModelInvocationReceiptV02(result.model_invocation_receipt),
    );

    const actualRequest = successRequests[0]!;
    const clientRequestId = actualRequest.headers["X-Client-Request-Id"];
    assert.match(clientRequestId ?? "", /^acgc_req_[0-9a-f]{40}$/u);
    assert.notEqual(clientRequestId, envelope.provider_request_trace_id);
    assert.equal(
      actualRequest.body.includes(envelope.provider_request_trace_id),
      false,
    );
    const staticRequest =
      projectOpenAIResponsesOperationalReentryMatchedCohortRequestV02(
        entry.model_input,
      );
    assert.equal(actualRequest.body, staticRequest.request_body);
    assert.equal(
      createProtocolSha256V01(actualRequest.body),
      staticRequest.request_fingerprint,
    );
    const actualRequestRecord = JSON.parse(actualRequest.body) as {
      model: string;
      text: { format: { schema: unknown } };
    };
    assert.equal(
      actualRequestRecord.model,
      OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02,
    );
    assert.equal(
      createProtocolSha256V01(
        canonicalizeProtocolValueV01(actualRequestRecord.text.format.schema),
      ),
      staticRequest.schema_fingerprint,
    );

    const historicalRoute =
      await prepareOperationalReentryMatchedCohortModelGatewayRouteV01({
        adapter: successAdapter,
      });
    assert.ok(historicalRoute);
    assert.equal(
      historicalRoute.purpose,
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
    );
    assert.equal(
      historicalRoute.adapter_implementation_version,
      OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V03,
    );

    const missingTrace = { ...envelope } as Record<string, unknown>;
    delete missingTrace.provider_request_trace_id;
    await assertGatewayFailureV02(
      () =>
        invokeOperationalReentryMatchedCohortModelGatewayV02(
          missingTrace,
          gatewayDependenciesV02(databasePath, successAdapter, route),
        ),
      "model_gateway_invalid_envelope",
    );
    assert.equal(successRequests.length, 1);

    const invalidRequests: OpenAIResponsesTransportRequestV01[] = [];
    const invalidAdapter = createOpenAIResponsesAdapterV01({
      environment: { OPENAI_API_KEY: "test-credential-never-persisted" },
      transport: async (request) => {
        invalidRequests.push(request);
        return completedProviderResponseV02({});
      },
    });
    await assertGatewayFailureV02(
      () =>
        invokeOperationalReentryMatchedCohortModelGatewayV02(
          envelope,
          gatewayDependenciesV02(databasePath, invalidAdapter, route),
        ),
      "model_gateway_provider_response_invalid",
      true,
    );
    assert.equal(invalidRequests.length, 1);

    const rejectedRequests: OpenAIResponsesTransportRequestV01[] = [];
    const rawProviderMessage = "raw-provider-message-must-not-persist";
    const rejectedAdapter = createOpenAIResponsesAdapterV01({
      environment: { OPENAI_API_KEY: "test-credential-never-persisted" },
      transport: async (request) => {
        rejectedRequests.push(request);
        return {
          ok: false,
          status: 429,
          headers: {
            get(name) {
              if (name === "x-request-id") return "req_v02_test_429";
              return null;
            },
          },
          async text() {
            return JSON.stringify({
              error: {
                type: "rate_limit_error",
                code: "synthetic_rate_limit",
                param: "text.format.schema",
                message: rawProviderMessage,
              },
            });
          },
          async json() {
            throw new Error("text path expected");
          },
        };
      },
    });
    const rejected = await captureGatewayFailureV02(() =>
      invokeOperationalReentryMatchedCohortModelGatewayV02(
        envelope,
        gatewayDependenciesV02(databasePath, rejectedAdapter, route),
      ),
    );
    assert.equal(rejected.code, "model_gateway_provider_rejected");
    assert.equal(rejected.receipt?.egress_attempted, true);
    assert.equal(
      rejected.provider_rejection_observation?.http_status,
      429,
    );
    assert.equal(
      rejected.provider_rejection_observation?.error_type,
      "rate_limit_error",
    );
    assert.equal(
      rejected.provider_rejection_observation?.error_code,
      "synthetic_rate_limit",
    );
    assert.equal(
      rejected.provider_rejection_observation?.error_param,
      "text.format.schema",
    );
    assert.equal(
      JSON.stringify(rejected).includes(rawProviderMessage),
      false,
    );
    assert.equal(rejectedRequests.length, 1);

    const unsupportedSchemaMaterial = {
      ...entry.model_input,
      response_schema: { uniqueItems: true },
    };
    const unsupportedEnvelope = gatewayEnvelopeV02({
      admission,
      route,
      model_input: unsupportedSchemaMaterial,
    });
    await assertGatewayFailureV02(
      () =>
        invokeOperationalReentryMatchedCohortModelGatewayV02(
          unsupportedEnvelope,
          gatewayDependenciesV02(databasePath, successAdapter, route),
        ),
      "model_gateway_invalid_envelope",
    );
    assert.equal(successRequests.length, 1);

    return {
      fake_transport_calls: 1,
      purpose:
        OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01,
      adapter_version:
        OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V04,
    };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function completedProviderResponseV02(output: unknown) {
  return {
    ok: true,
    status: 200,
    async json() {
      return {
        status: "completed",
        output_text: JSON.stringify(output),
        usage: {
          input_tokens: 120,
          cached_input_tokens: 0,
          output_tokens: 40,
          total_tokens: 160,
        },
      };
    },
  };
}

function registerGatewayProjectV02(
  databasePath: string,
  projectRoot: string,
): ModelGatewayInteractiveAdmissionV01 {
  const database = new Database(databasePath);
  try {
    const workspace = getOrCreateDefaultWorkspaceIdentityV01(database, {
      create_uuid: () => "11111111-1111-4111-8111-111111111111",
      now: () => "2026-08-19T00:00:00.000Z",
    });
    const localRoot = normalizeLocalProjectRootRefV01(projectRoot, {
      base_path: path.parse(projectRoot).root,
    });
    const project = getOrCreateCanonicalProjectForLocalRootV01(
      database,
      {
        workspace_id: workspace.workspace_id,
        local_root: localRoot,
        display_name: "e2r2h-v02-test-project",
      },
      {
        create_uuid: () => "22222222-2222-4222-8222-222222222222",
        now: () => "2026-08-19T00:00:01.000Z",
      },
    );
    const active = selectActiveProjectV01(database, {
      workspace_id: workspace.workspace_id,
      project_id: project.project.project_id,
      now: "2026-08-19T00:00:02.000Z",
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

function gatewayEnvelopeV02(input: {
  admission: ModelGatewayInteractiveAdmissionV01;
  route: NonNullable<
    Awaited<ReturnType<typeof prepareOperationalReentryMatchedCohortModelGatewayRouteV02>>
  >;
  model_input: unknown;
}) {
  const evaluatedAt = "2026-08-19T00:01:00.000Z";
  const authority = buildModelGatewayCostAuthorityV01({
    authority_kind: "provider_model_pricing_snapshot",
    workspace_id: input.admission.workspace_id,
    project_id: input.admission.project_id,
    purpose:
      OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01,
    provider_ref: input.route.provider_ref,
    model_ref: input.route.model_ref,
    cost_unit: "nano_usd",
    input_rate: { unit: "utf8_byte", cost_per_unit: 400 },
    output_rate: { unit: "token", cost_per_unit: 1_600 },
    pricing_source_version: "synthetic_test_pricing_v02",
    pricing_effective_at: "2026-08-18T00:00:00.000Z",
    pricing_expires_at: "2026-08-20T00:00:00.000Z",
    project_model_policy_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(input.route),
    ),
  });
  const costBudget = buildModelGatewayCostBudgetV01({
    authority,
    workspace_id: input.admission.workspace_id,
    project_id: input.admission.project_id,
    purpose:
      OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01,
    provider_ref: input.route.provider_ref,
    model_ref: input.route.model_ref,
    maximum_input_units:
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V02.finalRequestBytes,
    maximum_output_units:
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V02.maxOutputTokens,
    timeout_ms:
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V02.timeoutMs,
    maximum_permitted_cost: 25_000_000,
    evaluated_at: evaluatedAt,
  });
  return {
    envelope_version: MODEL_INVOCATION_ENVELOPE_VERSION_V01,
    invocation_id: "e2r2h-v02-shared-gateway-test",
    provider_request_trace_id:
      createDeterministicModelProviderRequestTraceV01({
        request_family_kind: "compatibility_probe",
        request_family_fingerprint: createProtocolSha256V01(
          canonicalizeProtocolValueV01(input.model_input),
        ),
      }),
    workspace_id: input.admission.workspace_id,
    project_id: input.admission.project_id,
    purpose:
      OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01,
    data_classification: "public_safe" as const,
    provenance_refs: [
      operationalReentryMatchedCohortCaseFixtureV02.integrity.fingerprint,
    ],
    privacy: {
      provider_egress: "allow" as const,
      retention_class: "none" as const,
    },
    budget: {
      max_input_bytes:
        OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V02.finalRequestBytes,
      max_output_tokens:
        OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V02.maxOutputTokens,
      max_provider_calls: 1 as const,
      cost_budget: costBudget,
    },
    timeout_ms:
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V02.timeoutMs,
    cancellation: { signal: new AbortController().signal },
    execution_mode: "live" as const,
    policy: {
      invocation_origin: "interactive" as const,
      expected_active_project_id: input.admission.project_id,
      expected_active_selection_revision:
        input.admission.expected_active_selection_revision,
    },
    project_root: input.admission.project_root,
    input: input.model_input,
  };
}

function gatewayDependenciesV02(
  databasePath: string,
  adapter: ReturnType<typeof createOpenAIResponsesAdapterV01>,
  route: NonNullable<
    Awaited<ReturnType<typeof prepareOperationalReentryMatchedCohortModelGatewayRouteV02>>
  >,
) {
  return {
    adapter,
    expected_operational_reentry_matched_cohort_v02_route: route,
    open_database: () => new Database(databasePath),
    read_root_availability: async () => "available" as const,
    now: () => new Date("2026-08-19T00:01:00.000Z"),
  };
}

async function captureGatewayFailureV02(
  run: () => Promise<unknown>,
): Promise<ModelGatewayInvocationErrorV01> {
  try {
    await run();
  } catch (error) {
    assert.ok(error instanceof ModelGatewayInvocationErrorV01);
    return error;
  }
  assert.fail("expected v0.2 Model Gateway invocation to fail");
}

async function assertGatewayFailureV02(
  run: () => Promise<unknown>,
  expectedCode: ModelGatewayInvocationErrorV01["code"],
  egressAttempted = false,
): Promise<void> {
  const failure = await captureGatewayFailureV02(run);
  assert.equal(failure.code, expectedCode);
  assert.equal(failure.receipt?.egress_attempted ?? false, egressAttempted);
}

function testCleanControlAdmissionV02(): void {
  const block = evaluateOperationalReentryMatchedCohortBlockV02(
    0,
    observedBlockV02(0),
  );
  assert.equal(block.status, "complete");
  assert.equal(block.arm_evaluations.length, 4);
  for (const evaluation of block.arm_evaluations) {
    assert.equal(evaluation.common_compliance, "valid");
    assert.deepEqual(evaluation.failed_common_hard_gates, []);
    assert.equal(evaluation.establishes_general_benefit_or_harm, false);
  }
  assert.deepEqual(block.universal_common_hard_failure_dimensions, []);
  assert.equal(block.clean_control_admission.arm_a_invariant_hard_failures, 0);
  assert.equal(block.clean_control_admission.arm_b_invariant_hard_failures, 0);
  assert.equal(block.clean_control_admission.arm_c_invariant_hard_failures, 0);
  assert.equal(block.clean_control_admission.arm_d_invariant_hard_failures, 0);
  assert.equal(block.clean_control_admission.all_arms_common_compliance_valid, true);
  assert.equal(block.clean_control_admission.no_universal_hard_failure_dimension, true);
  assert.equal(block.clean_control_admission.protocol_validation_only, true);
  assert.equal(block.clean_control_admission.behavioral_evidence_created, false);
  assert.equal(block.authority.real_provider_calls, 0);
  assert.equal(block.authority.provider_compatibility_established, false);
  assert.equal(block.authority.live_cohort_authorized, false);
}

function testRequiredCheckAndStatusComplianceV02(): void {
  const plan = buildOperationalReentryMatchedCohortCallPlanV02();
  for (const arm of ["A", "B", "C", "D"] as const) {
    const entry = plan.entries.find(
      (candidate) => candidate.repeat_block === 0 && candidate.arm === arm,
    )!;
    const output = parseOperationalReentryMatchedCohortOutputV02(
      JSON.stringify(buildOperationalReentryMatchedCohortGoldenOutputV02(arm)),
      entry.model_input,
    );
    const evaluation = evaluateOperationalReentryMatchedCohortArmV02({
      arm,
      call_slot_id: entry.call_slot_id,
      model_input: entry.model_input,
      normalized_output: output,
    });
    assert.equal(
      evaluation.common_compliance_dimensions.find(
        (dimension) => dimension.dimension === "required_check_disposition",
      )!.result,
      "pass",
    );
    assert.equal(
      commonTaskEvidenceFingerprintV02(entry.model_input),
      OPERATIONAL_REENTRY_MATCHED_COHORT_COMMON_TASK_EVIDENCE_FINGERPRINT_V02,
    );
  }

  const aEntry = plan.entries.find(
    (entry) => entry.repeat_block === 0 && entry.arm === "A",
  )!;
  const fabricatedCheck = buildOperationalReentryMatchedCohortGoldenOutputV02(
    "A",
    { required_check: { disposition: "unknown" } },
  );
  const parsedFabricatedCheck =
    parseOperationalReentryMatchedCohortOutputV02(
      JSON.stringify(fabricatedCheck),
      aEntry.model_input,
    );
  const fabricatedEvaluation =
    evaluateOperationalReentryMatchedCohortArmV02({
      arm: "A",
      call_slot_id: aEntry.call_slot_id,
      model_input: aEntry.model_input,
      normalized_output: parsedFabricatedCheck,
    });
  assert.equal(fabricatedEvaluation.common_compliance, "invalid");
  assert.deepEqual(fabricatedEvaluation.failed_common_hard_gates, [
    "required_check_disposition",
  ]);

  const mismatchEvaluation = evaluateOperationalReentryMatchedCohortArmV02({
    arm: "A",
    call_slot_id: aEntry.call_slot_id,
    model_input: aEntry.model_input,
    normalized_output: buildOperationalReentryMatchedCohortGoldenOutputV02(
      "A",
      { abstention: true },
    ),
  });
  assert.equal(mismatchEvaluation.common_compliance, "invalid");
  assert.equal(
    mismatchEvaluation.result_abstention_mismatch_is_compliance_failure,
    true,
  );
  assert.equal(mismatchEvaluation.establishes_general_benefit_or_harm, false);

  const boundedBlockedState =
    buildOperationalReentryMatchedCohortGoldenOutputV02("A", {
      result_status: "review_blocked",
      abstention: true,
    });
  const blockedStateEvaluation =
    evaluateOperationalReentryMatchedCohortArmV02({
      arm: "A",
      call_slot_id: aEntry.call_slot_id,
      model_input: aEntry.model_input,
      normalized_output: boundedBlockedState,
    });
  assert.equal(
    blockedStateEvaluation.common_compliance_dimensions.find(
      (dimension) => dimension.dimension === "result_abstention_consistency",
    )!.result,
    "pass",
  );
  assert.equal(
    blockedStateEvaluation.common_compliance_dimensions.find(
      (dimension) => dimension.dimension === "result_status_grounding",
    )!.result,
    "fail",
  );
}

function testPairwiseComparabilityV02(): void {
  const plan = buildOperationalReentryMatchedCohortCallPlanV02();
  const bEntry = plan.entries.find(
    (entry) => entry.repeat_block === 0 && entry.arm === "B",
  )!;
  const bOutput = buildOperationalReentryMatchedCohortGoldenOutputV02("B");
  const bLeft = evaluateOperationalReentryMatchedCohortArmV02({
    arm: "B",
    call_slot_id: bEntry.call_slot_id,
    model_input: bEntry.model_input,
    normalized_output: bOutput,
  });
  const bRight = evaluateOperationalReentryMatchedCohortArmV02({
    arm: "B",
    call_slot_id: `${bEntry.call_slot_id}-equal-control`,
    model_input: bEntry.model_input,
    normalized_output: structuredClone(bOutput),
  });
  const cleanEqual = deriveOperationalReentryMatchedCohortPairwiseComparisonV02(
    bLeft,
    bRight,
    bOutput,
    structuredClone(bOutput),
  );
  assert.equal(cleanEqual.comparison_status, "comparable");
  assert.equal(cleanEqual.behavioral_relation, "equal");
  assert.equal(cleanEqual.bounded_outcome_relation, "equal");
  assert.equal(cleanEqual.general_benefit_or_harm, "not_established");
  assert.equal(cleanEqual.rank_or_winner_created, false);

  const sharedInvalidBlock = observedBlockV02(0, {
    A: { required_check: { disposition: "unknown" } },
    B: { required_check: { disposition: "unknown" } },
    C: { required_check: { disposition: "unknown" } },
    D: { required_check: { disposition: "unknown" } },
  });
  const sharedInvalid = evaluateOperationalReentryMatchedCohortBlockV02(
    0,
    sharedInvalidBlock,
  );
  assert.deepEqual(sharedInvalid.universal_common_hard_failure_dimensions, [
    "required_check_disposition",
  ]);
  assert.ok(
    sharedInvalid.pairwise_comparisons.every(
      (comparison) =>
        comparison.comparison_status ===
          "protocol_invalid_not_comparable" &&
        comparison.behavioral_relation === "not_comparable" &&
        comparison.bounded_outcome_relation === "not_comparable",
    ),
  );

  const asymmetric = evaluateOperationalReentryMatchedCohortBlockV02(
    0,
    observedBlockV02(0, { A: { abstention: true } }),
  );
  const aVsB = asymmetric.pairwise_comparisons.find(
    (comparison) =>
      comparison.left_arm === "A" && comparison.right_arm === "B",
  )!;
  assert.equal(aVsB.comparison_status, "compliance_asymmetry");
  assert.equal(aVsB.compliance_asymmetry, true);
  assert.equal(aVsB.behavioral_relation, "not_comparable");
  assert.equal(aVsB.bounded_outcome_relation, "not_comparable");
  assert.equal(aVsB.general_benefit_or_harm, "not_established");
}

function testE1BehavioralMechanicsV02(): void {
  const structured = evaluateOperationalReentryMatchedCohortBlockV02(
    0,
    observedBlockV02(0),
  );
  assert.equal(structured.conditioning_relation, "structured_delta_observed");
  assert.equal(structured.reset_relation, "appropriate_reset_observed");

  const referenceOnly = evaluateOperationalReentryMatchedCohortBlockV02(
    0,
    observedBlockV02(0, {
      A: {
        operation_action_class_tokens: [
          "bounded_result_review",
          "no_external_action",
        ],
        target_disposition: "reference_only",
      },
    }),
  );
  assert.equal(referenceOnly.conditioning_relation, "reference_only");

  const noStructuredDelta = evaluateOperationalReentryMatchedCohortBlockV02(
    0,
    observedBlockV02(0, {
      A: {
        referenced_continuation_tokens: [
          "ctx_receipt_public_safe_35b0",
          "ctx_proposal_non_authoritative_a614",
          "ctx_decision_pending_8d22",
        ],
        operation_action_class_tokens: [
          "bounded_result_review",
          "no_external_action",
        ],
        target_disposition: "not_referenced",
      },
    }),
  );
  assert.equal(
    noStructuredDelta.conditioning_relation,
    "no_structured_delta_observed",
  );

  const stalePersisted = evaluateOperationalReentryMatchedCohortBlockV02(
    0,
    observedBlockV02(0, {
      C: {
        referenced_continuation_tokens: [
          "ctx_receipt_public_safe_35b0",
          "ctx_proposal_non_authoritative_a614",
          "ctx_decision_pending_8d22",
          operationalReentryMatchedCohortRubricFixtureV02.target_context_token,
        ],
        operation_action_class_tokens: [
          "bounded_result_review",
          "no_external_action",
          "target_linked_verification_preparation",
        ],
        result_limitation_tokens: [
          "limitation_non_authoritative",
          "limitation_stale_target_persisted",
        ],
        target_disposition: "stale_persisted",
      },
    }),
  );
  assert.equal(stalePersisted.reset_relation, "stale_persistence_candidate");

  const missingArm = evaluateOperationalReentryMatchedCohortBlockV02(
    0,
    observedBlockV02(0).filter((entry) => entry.arm !== "C"),
  );
  assert.equal(missingArm.status, "incomplete");
  assert.deepEqual(missingArm.arm_evaluations, []);
  assert.equal(missingArm.conditioning_relation, "unknown");
  assert.equal(missingArm.reset_relation, "unknown");
  assert.ok(
    missingArm.pairwise_comparisons.every(
      (comparison) =>
        comparison.comparison_status === "incomplete_not_comparable" &&
        comparison.behavioral_relation === "not_comparable",
    ),
  );
}

function testSeparatedHarnessReportV02() {
  const blocks = ([0, 1, 2, 3] as const).map((block) =>
    evaluateOperationalReentryMatchedCohortBlockV02(
      block,
      observedBlockV02(block),
    ),
  );
  const report = buildOperationalReentryMatchedCohortHarnessReportV02({
    blocks,
  });
  assert.equal(report.completion_status, "complete");
  assert.equal(report.target_invariant_compliance.evaluated_arm_rows, 16);
  assert.equal(
    report.target_invariant_compliance.all_evaluated_arms_valid,
    true,
  );
  assert.deepEqual(
    Object.values(
      report.target_invariant_compliance.failed_hard_gate_counts,
    ),
    [0, 0, 0, 0, 0],
  );
  assert.deepEqual(
    report.target_invariant_compliance.universal_hard_failure_dimensions,
    [],
  );
  assert.equal(report.clean_control_admission.arm_a_hard_failures, 0);
  assert.equal(report.clean_control_admission.arm_b_hard_failures, 0);
  assert.equal(report.clean_control_admission.arm_c_hard_failures, 0);
  assert.equal(report.clean_control_admission.arm_d_hard_failures, 0);
  assert.equal(
    report.behavioral_intervention_effect.distinct_from_common_compliance,
    true,
  );
  assert.equal(
    report.bounded_outcome_quality.general_benefit_or_harm,
    "not_established",
  );
  assert.equal(report.bounded_outcome_quality.scalar_score_created, false);
  assert.equal(report.bounded_outcome_quality.rank_or_winner_created, false);
  assert.equal(
    report.future_provider_boundary
      .issue_193_accepted_all_shapes_establishes_v02_compatibility,
    false,
  );
  assert.equal(
    report.future_provider_boundary.v02_compatibility_probe_authorized,
    false,
  );
  assert.equal(report.future_provider_boundary.v02_live_cohort_authorized, false);
  assert.equal(report.future_provider_boundary.v01_replication_authorized, false);
  assert.equal(report.authority.real_provider_calls, 0);
  return report;
}

type OutputOverridesByArmV02 = Partial<
  Record<
    OperationalReentryMatchedCohortArmV02,
    Parameters<typeof buildOperationalReentryMatchedCohortGoldenOutputV02>[1]
  >
>;

function observedBlockV02(
  block: 0 | 1 | 2 | 3,
  overrides: OutputOverridesByArmV02 = {},
): OperationalReentryMatchedCohortObservedArmV02[] {
  const plan = buildOperationalReentryMatchedCohortCallPlanV02();
  return plan.entries
    .filter((entry) => entry.repeat_block === block)
    .map((entry) => {
      const output = buildOperationalReentryMatchedCohortGoldenOutputV02(
        entry.arm,
        overrides[entry.arm],
      );
      return {
        arm: entry.arm,
        call_slot_id: entry.call_slot_id,
        model_input: entry.model_input,
        normalized_output: parseOperationalReentryMatchedCohortOutputV02(
          JSON.stringify(output),
          entry.model_input,
        ),
      };
    });
}
